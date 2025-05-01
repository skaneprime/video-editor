import React, { useState, useRef, useEffect } from 'react';
import { Timeline } from './Timeline';
import { VideoControls } from './VideoControls';
import { TextOverlay } from './TextOverlay';
import styles from '../styles/VideoEditor.module.css';
import { AudioClip, VideoClip, TextOverlay as TextOverlayData } from '../types';

// interface TextOverlayData {
//   id: string;
//   type: 'text';
//   startTime: number;
//   duration: number;
//   text: string;
//   position: { x: number; y: number };
//   color: string;
// }

interface AudioConnection {
  source: MediaElementAudioSourceNode;
  gainNode: GainNode;
  connected: boolean;
}

export const VideoEditor: React.FC = () => {
  const [videoClips, setVideoClips] = useState<VideoClip[]>([]);
  const [textOverlays, setTextOverlays] = useState<TextOverlayData[]>([]);
  const [audioClips, setAudioClips] = useState<AudioClip[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const playerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const audioConnectionsRef = useRef<{ [key: string]: AudioConnection }>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number>(null);

  useEffect(() => {
    if (isPlaying) {
      const startTime = Date.now();
      const playVideos = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        const newTime = elapsed % 60; // Loop every 60 seconds
        
        setCurrentTime(newTime);
        // Update video positions
        videoClips.forEach(clip => {
          const video = videoRefs.current[clip.id];
          if (video) {
            if (newTime >= clip.startTime && newTime <= clip.startTime + clip.trimStart - clip.startTime + clip.trimEnd - clip.trimStart) {
              if (video.paused) {
                // Calculate the video time based on trim values
                const clipProgress = newTime - clip.startTime;
                const videoTime = clip.trimStart + clipProgress;
                if (videoTime <= clip.trimEnd) {
                  video.currentTime = videoTime;
                  // Ensure volume is a valid number between 0 and 1
                  const validVolume = typeof clip.volume === 'number' && isFinite(clip.volume)
                    ? Math.min(1, Math.max(0, clip.volume))
                    : 1;
                  video.volume = validVolume;
                  video.play().catch(console.error);
                }
              }
            } else {
              video.pause();
            }
          }
        });

        // Update audio positions
        audioClips.forEach(clip => {
          const audio = audioRefs.current[clip.id];
          if (audio) {
            if (newTime >= clip.startTime && newTime <= clip.endTime - clip.startTime) {
              if (audio.paused) {
                audio.currentTime = newTime - clip.startTime;
                // Ensure volume is a valid number between 0 and 1
                const validVolume = typeof clip.volume === 'number' && isFinite(clip.volume)
                  ? Math.min(1, Math.max(0, clip.volume))
                  : 1;
                audio.volume = validVolume;
                audio.play().catch(console.error);
              }
            } else {
              audio.pause();
            }
          }
        });

        animationFrameRef.current = requestAnimationFrame(playVideos);
      };

      playVideos();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Pause all videos and audio
      Object.values(videoRefs.current).forEach(video => video.pause());
      Object.values(audioRefs.current).forEach(audio => audio.pause());
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, videoClips, audioClips]);

  const handleFileDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    files.forEach((file) => {
      if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        setVideoClips((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            type: 'video' as const,
            startTime: 0,
            endTime: 10,
            duration: 10,
            trimStart: 0,
            trimEnd: 10,
            url,
            volume: 1
          } as VideoClip,
        ]);
      } else if (file.type.startsWith('audio/')) {
        const url = URL.createObjectURL(file);
        setAudioClips((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            type: 'audio' as const,
            startTime: 0,
            duration: 10,
            endTime: 10,
            url,
            volume: 1
          } as AudioClip,
        ]);
      }
    });
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const addTextOverlay = () => {
    setTextOverlays((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        type: 'text' as const,
        startTime: currentTime,
        duration: 5,
        text: 'New Text',
        position: { x: 50, y: 50 },
        color: '#ffffff',
      } as TextOverlayData,
    ]);
  };

  const updateTextOverlay = (id: string, updates: Partial<TextOverlayData>) => {
    setTextOverlays((prev) =>
      prev.map((overlay) =>
        overlay.id === id ? { ...overlay, ...updates } : overlay
      )
    );
  };

  const deleteTextOverlay = (id: string) => {
    setTextOverlays((prev) => prev.filter((overlay) => overlay.id !== id));
  };

  const handleClipUpdate = (
    id: string,
    type: 'video' | 'text' | 'audio',
    updates: Partial<VideoClip | TextOverlayData | AudioClip>
  ) => {
    switch (type) {
      case 'video':
        setVideoClips((prev) =>
          prev.map((clip) =>
            clip.id === id ? { ...clip, ...updates as Partial<VideoClip> } : clip
          )
        );
        break;
      case 'text':
        setTextOverlays((prev) =>
          prev.map((overlay) =>
            overlay.id === id ? { ...overlay, ...updates as Partial<TextOverlayData>  } : overlay
          )
        );
        break;
      case 'audio':
        setAudioClips((prev) =>
          prev.map((clip) =>
            clip.id === id ? { ...clip, ...updates as Partial<AudioClip>  } : clip
          )
        );
        break;
    }
  };

  const handleClipDelete = (id: string, type: 'video' | 'text' | 'audio') => {
    // Clean up audio connections if they exist
    if (audioConnectionsRef.current[id]) {
      const connection = audioConnectionsRef.current[id];
      if (connection.connected) {
        connection.source.disconnect();
        connection.gainNode.disconnect();
      }
      delete audioConnectionsRef.current[id];
    }

    if (type === 'video') {
      setVideoClips(prevClips => prevClips.filter(clip => clip.id !== id));
    } else if (type === 'text') {
      setTextOverlays(prevOverlays => prevOverlays.filter(overlay => overlay.id !== id));
    } else if (type === 'audio') {
      setAudioClips(prevClips => prevClips.filter(clip => clip.id !== id));
    }
  };

  const exportVideo = async () => {
    try {
      setIsExporting(true);
      setExportProgress(0);

      // Create a canvas to render the video frames
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Create or reuse audio context
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext();
      }
      const audioContext = audioContextRef.current;
      const audioDestination = audioContext.createMediaStreamDestination();

      // Connect audio nodes
      const connectAudio = (mediaElement: HTMLMediaElement, id: string, volume: number) => {
        let connection = audioConnectionsRef.current[id];
        
        if (!connection) {
          // Create new connection if it doesn't exist
          const source = audioContext.createMediaElementSource(mediaElement);
          const gainNode = audioContext.createGain();
          connection = { source, gainNode, connected: false };
          audioConnectionsRef.current[id] = connection;
        }

        if (!connection.connected) {
          connection.gainNode.gain.value = volume;
          connection.source.connect(connection.gainNode);
          connection.gainNode.connect(audioDestination);
          connection.connected = true;
        } else {
          // Just update the volume if already connected
          connection.gainNode.gain.value = volume;
        }
      };

      // Connect all audio clips
      audioClips.forEach(clip => {
        const audio = audioRefs.current[clip.id];
        if (audio) {
          connectAudio(audio, clip.id, clip.volume);
        }
      });

      // Connect all video clips' audio
      videoClips.forEach(clip => {
        const video = videoRefs.current[clip.id];
        if (video) {
          connectAudio(video, clip.id, clip.volume);
        }
      });

      // Create a MediaRecorder to record the canvas and audio
      const canvasStream = canvas.captureStream(30);
      const outputStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks()
      ]);

      // Check supported MIME types for MP4 first, then fallback to WebM
      const mimeTypes = [
        'video/mp4;codecs=h264,aac',
        'video/mp4;codecs=h264',
        'video/mp4',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp8,vorbis',
        'video/webm'
      ];
      
      const supportedType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      if (!supportedType) {
        throw new Error('No supported video MIME type found');
      }

      console.log('Using MIME type for recording:', supportedType);

      const recorder = new MediaRecorder(outputStream, {
        mimeType: supportedType,
        videoBitsPerSecond: 8000000 // 8 Mbps for good quality
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        try {
          // Disconnect and clean up audio nodes
          audioConnectionsRef.current = {};
          audioContext.close();

          // Create a new blob with proper duration metadata
          const blob = new Blob(chunks, { type: supportedType });
          
          // Create a temporary video element to get the duration
          const tempVideo = document.createElement('video');
          tempVideo.src = URL.createObjectURL(blob);
          
          await new Promise((resolve) => {
            tempVideo.addEventListener('loadedmetadata', resolve);
          });
          
          // Get the actual duration
          const duration = tempVideo.duration;
          
          // Clean up temporary video URL
          URL.revokeObjectURL(tempVideo.src);

          if (supportedType.includes('mp4')) {
            // For MP4, directly create the download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'exported-video.mp4';
            a.click();
            URL.revokeObjectURL(url);
            setIsExporting(false);
            setExportProgress(100);
          } else {
            // For WebM, use MediaSource to try to convert to MP4
            const mediaSource = new MediaSource();
            const videoUrl = URL.createObjectURL(mediaSource);
            const finalVideo = document.createElement('video');
            finalVideo.src = videoUrl;

            await new Promise<void>((resolve, reject) => {
              mediaSource.addEventListener('sourceopen', async () => {
                try {
                  // Use WebM for intermediate processing
                  const sourceBuffer = mediaSource.addSourceBuffer('video/webm;codecs=vp8,opus');
                  
                  // Read the blob as ArrayBuffer
                  const arrayBuffer = await blob.arrayBuffer();
                  
                  await new Promise<void>((resolve, reject) => {
                    sourceBuffer.addEventListener('updateend', () => {
                      try {
                        if (!mediaSource.duration || mediaSource.duration === Infinity) {
                          mediaSource.duration = duration;
                        }
                        mediaSource.endOfStream();
                        resolve();
                      } catch (err) {
                        reject(err);
                      }
                    }, { once: true });

                    sourceBuffer.addEventListener('error', reject, { once: true });
                    sourceBuffer.appendBuffer(arrayBuffer);
                  });

                  await new Promise<void>(resolve => {
                    if (mediaSource.readyState === 'ended') {
                      resolve();
                    } else {
                      mediaSource.addEventListener('sourceended', () => resolve(), { once: true });
                    }
                  });

                  // Try to create final MP4
                  const mediaStream = (finalVideo as unknown as { captureStream(): MediaStream }).captureStream();
                  const mediaRecorder = new MediaRecorder(mediaStream, {
                    mimeType: 'video/mp4;codecs=h264,aac',
                    videoBitsPerSecond: 8000000
                  });

                  const finalChunks: Blob[] = [];
                  mediaRecorder.ondataavailable = (e) => finalChunks.push(e.data);
                  mediaRecorder.onstop = () => {
                    const finalBlob = new Blob(finalChunks, { type: 'video/mp4' });
                    const url = URL.createObjectURL(finalBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'exported-video.mp4';
                    a.click();
                    URL.revokeObjectURL(url);
                    URL.revokeObjectURL(videoUrl);
                    setIsExporting(false);
                    setExportProgress(100);
                  };

                  finalVideo.currentTime = 0;
                  await finalVideo.play();
                  mediaRecorder.start();
                  setTimeout(() => {
                    finalVideo.pause();
                    mediaRecorder.stop();
                  }, Math.ceil(duration * 1000));

                  resolve();
                } catch (err) {
                  console.error('Error in MediaSource processing:', err);
                  // If conversion fails, fallback to original format
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'exported-video.webm';
                  a.click();
                  URL.revokeObjectURL(url);
                  URL.revokeObjectURL(videoUrl);
                  setIsExporting(false);
                  setExportProgress(100);
                  reject(err);
                }
              }, { once: true });
            });
          }
        } catch (error) {
          console.error('Error in recorder.onstop:', error);
          setIsExporting(false);
          setExportProgress(0);
          alert('Error during export finalization: ' + (error instanceof Error ? error.message : 'Unknown error occurred'));
        }
      };

      // Preload all videos and set them to play
      console.log('Preloading videos...');
      await Promise.all(videoClips.map(async (clip) => {
        const video = videoRefs.current[clip.id];
        if (video) {
          video.currentTime = clip.trimStart;
          video.muted = true; // Mute the video element since we're handling audio separately
          await new Promise(resolve => {
            video.addEventListener('seeked', resolve, { once: true });
          });
        }
      }));

      // Start recording
      console.log('Starting recording...');
      recorder.start(1000); // Request data every second

      const startTime = Date.now();
      const totalDuration = 60; // 60 seconds timeline
      const frameInterval = 1000 / 30; // 30fps

      // Render each frame
      const renderFrame = async () => {
        const currentTime = (Date.now() - startTime) / 1000;
        
        if (currentTime > totalDuration) {
          console.log('Finishing recording...');
          recorder.stop();
          return;
        }

        // Update progress
        setExportProgress(Math.round((currentTime / totalDuration) * 100));

        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw video clips
        for (const clip of videoClips) {
          if (currentTime >= clip.startTime && currentTime <= clip.endTime - clip.startTime) {
            const video = videoRefs.current[clip.id];
            if (video) {
              const clipProgress = currentTime - clip.startTime;
              const videoTime = clip.trimStart + clipProgress;
              if (videoTime <= clip.trimEnd) {
                try {
                  // Ensure the video is at the correct time
                  if (Math.abs(video.currentTime - videoTime) > 0.1) {
                    video.currentTime = videoTime;
                    await new Promise(resolve => {
                      video.addEventListener('seeked', resolve, { once: true });
                    });
                  }
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                } catch (error) {
                  console.error('Error drawing video frame:', error);
                }
              }
            }
          }
        }

        // Draw text overlays
        ctx.save(); // Save the current context state
        for (const overlay of textOverlays) {
          if (currentTime >= overlay.startTime && currentTime <= overlay.startTime + overlay.duration) {
            ctx.fillStyle = overlay.color;
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            const text = overlay.text;
            const x = (overlay.position.x / 100) * canvas.width;
            const y = (overlay.position.y / 100) * canvas.height;
            ctx.strokeText(text, x, y); // Add stroke for better visibility
            ctx.fillText(text, x, y);
          }
        }
        ctx.restore(); // Restore the context state

        // Handle audio timing
        audioClips.forEach(clip => {
          const audio = audioRefs.current[clip.id];
          if (audio) {
            if (currentTime >= clip.startTime && currentTime <= clip.endTime - clip.startTime) {
              const desiredTime = currentTime - clip.startTime;
              if (Math.abs(audio.currentTime - desiredTime) > 0.1) {
                audio.currentTime = desiredTime;
              }
              if (audio.paused) {
                audio.play().catch(console.error);
              }
            } else if (!audio.paused) {
              audio.pause();
            }
          }
        });

        // Schedule next frame
        const elapsed = Date.now() - startTime;
        const nextFrameTime = Math.max(0, Math.round(elapsed / frameInterval) * frameInterval - elapsed);
        setTimeout(renderFrame, nextFrameTime);
      };

      // Start rendering
      console.log('Starting frame rendering...');
      renderFrame();
    } catch (error) {
      console.error('Export error:', error);
      setIsExporting(false);
      setExportProgress(0);
      alert('Error during export: ' + (error instanceof Error ? error.message : 'Unknown error occurred'));
    }
  };

  const handleTimeUpdate = (newTime: number) => {
    setCurrentTime(newTime);
  };

  return (
    <div className={styles.editorContainer}>
      <div
        className={styles.previewArea}
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
        ref={playerRef}
      >
        {videoClips.map((clip) => (
          <video
            key={clip.id}
            ref={(el) => {
              if (el) videoRefs.current[clip.id] = el;
            }}
            src={clip.url}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: currentTime >= clip.startTime && currentTime <= clip.endTime - clip.startTime ? 'block' : 'none',
            }}
          />
        ))}
        {audioClips.map((clip) => (
          <audio
            key={clip.id}
            ref={(el) => {
              if (el) audioRefs.current[clip.id] = el;
            }}
            src={clip.url}
            style={{ display: 'none' }}
          />
        ))}
        {textOverlays.map((overlay) => (
          <TextOverlay
            key={overlay.id}
            {...overlay}
            onUpdate={updateTextOverlay}
            onDelete={deleteTextOverlay}
          />
        ))}
      </div>
      
      <div className={styles.timelineContainer}>
        <Timeline
          videoClips={videoClips}
          textOverlays={textOverlays}
          audioClips={audioClips}
          onTimeUpdate={handleTimeUpdate}
          onClipUpdate={handleClipUpdate}
          onClipDelete={handleClipDelete}
          currentTime={currentTime}
        />
      </div>

      <div className={styles.controlsContainer}>
        <VideoControls
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onAddText={addTextOverlay}
          onExport={exportVideo}
          isExporting={isExporting}
          exportProgress={exportProgress}
        />
      </div>
      {isExporting && (
        <div className={styles.exportOverlay}>
          <div className={styles.exportProgress}>
            <div>Exporting video... {exportProgress}%</div>
            <div 
              className={styles.progressBar}
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}; 