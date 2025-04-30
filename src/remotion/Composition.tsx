import React from 'react';
import { AbsoluteFill, Audio, Video, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { VideoClip, AudioClip, TextOverlay } from '../types';

interface RemotionVideoProps {
  videoClips: (VideoClip & { element: HTMLVideoElement })[];
  audioClips: (AudioClip & { element: HTMLAudioElement })[];
  textOverlays: TextOverlay[];
  canvasWidth: number;
  canvasHeight: number;
}

export const RemotionVideo: React.FC<RemotionVideoProps> = ({
  videoClips,
  audioClips,
  textOverlays,
  canvasWidth,
  canvasHeight,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: 'black' }}>
      {videoClips.map((clip) => {
        const startFrame = Math.round(clip.startTime * fps);
        const endFrame = Math.round((clip.startTime + clip.duration) * fps);
        const isVisible = frame >= startFrame && frame <= endFrame;

        if (!isVisible) return null;

        const videoTime = clip.trimStart + (frame - startFrame) / fps;
        if (videoTime > clip.trimEnd) return null;

        return (
          <Video
            key={clip.id}
            src={clip.url}
            startFrom={startFrame}
            endAt={endFrame}
            volume={clip.volume || 1}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          />
        );
      })}

      {audioClips.map((clip) => {
        const startFrame = Math.round(clip.startTime * fps);
        const endFrame = Math.round((clip.startTime + clip.duration) * fps);

        return (
          <Audio
            key={clip.id}
            src={clip.url}
            startFrom={startFrame}
            endAt={endFrame}
            volume={clip.volume || 1}
          />
        );
      })}

      {textOverlays.map((overlay) => {
        const startFrame = Math.round(overlay.startTime * fps);
        const endFrame = Math.round((overlay.startTime + overlay.duration) * fps);
        const isVisible = frame >= startFrame && frame <= endFrame;

        if (!isVisible) return null;

        const scale = spring({
          fps,
          frame: frame - startFrame,
          config: {
            damping: 100,
          },
        });

        return (
          <div
            key={overlay.id}
            style={{
              position: 'absolute',
              left: `${overlay.position.x}%`,
              top: `${overlay.position.y}%`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              color: overlay.color,
              fontFamily: 'Arial',
              fontSize: '48px',
              fontWeight: 'bold',
              textAlign: 'center',
              WebkitTextStroke: '2px black',
              textShadow: '2px 2px 0 #000',
            }}
          >
            {overlay.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}; 