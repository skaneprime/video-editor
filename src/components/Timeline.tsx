import React, { useRef, useState, useEffect } from 'react';
import styles from '../styles/Timeline.module.css';
import { VideoClip, TextOverlay, AudioClip, Clip } from '../types';

interface TimelineProps {
  videoClips: VideoClip[];
  textOverlays: TextOverlay[];
  audioClips: AudioClip[];
  onTimeUpdate: (time: number) => void;
  onClipUpdate: (id: string, type: 'video' | 'text' | 'audio', updates: Partial<VideoClip | TextOverlay | AudioClip>) => void;
  onClipDelete: (id: string, type: 'video' | 'text' | 'audio') => void;
  currentTime: number;
}

export const Timeline: React.FC<TimelineProps> = ({
  videoClips = [],
  textOverlays = [],
  audioClips = [],
  onTimeUpdate,
  onClipUpdate,
  onClipDelete,
  currentTime = 0
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'start' | 'end' | 'move' | null>(null);
  const [initialStartTime, setInitialStartTime] = useState(0);
  const [initialDuration, setInitialDuration] = useState(0);
  const [initialMouseX, setInitialMouseX] = useState(0);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    clipId: string;
    type: 'video' | 'text' | 'audio';
    volume?: number;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent, clipId: string, type: 'video' | 'text' | 'audio') => {
    e.preventDefault();
    let volume = 1;
    if (type === 'video' || type === 'audio') {
      const clip = type === 'video' 
        ? videoClips.find(c => c.id === clipId)
        : audioClips.find(c => c.id === clipId);
      volume = typeof clip?.volume === 'number' && isFinite(clip.volume) 
        ? Math.min(1, Math.max(0, clip.volume))
        : 1;
    }
    setContextMenu({ x: e.clientX, y: e.clientY, clipId, type, volume });
  };

  const handleVolumeChange = (volume: number) => {
    if (!contextMenu) return;
    const validVolume = Math.min(1, Math.max(0, volume));
    onClipUpdate(contextMenu.clipId, contextMenu.type, { volume: validVolume });
    setContextMenu(prev => prev ? { ...prev, volume: validVolume } : null);
  };

  const handleDeleteClip = (clipId: string, type: 'video' | 'text' | 'audio') => {
    onClipDelete(clipId, type);
    setContextMenu(null);
  };

  const handleMouseDown = (clip: Clip, type: 'start' | 'end' | 'move', e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClip(clip);
    setDragType(type);
    setIsDragging(true);
    setInitialStartTime(clip.startTime);
    setInitialDuration(clip.duration);
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      setInitialMouseX(e.clientX - rect.left);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !selectedClip || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const currentMouseX = e.clientX - rect.left;
    const totalWidth = rect.width;
    const mouseDelta = currentMouseX - initialMouseX;
    const timeDelta = (mouseDelta / totalWidth) * 60;

    if (dragType === 'start') {
      const newStartTime = Math.max(0, Math.min(initialStartTime + timeDelta, initialStartTime + initialDuration - 1));
      const newDuration = initialDuration - (newStartTime - initialStartTime);
      if (selectedClip.type === 'video') {
        const videoClip = selectedClip as VideoClip;
        const trimDelta = newStartTime - initialStartTime;
        const newTrimStart = videoClip.trimStart + trimDelta;
        onClipUpdate(selectedClip.id, 'video', {
          startTime: newStartTime,
          duration: newDuration,
          trimStart: newTrimStart
        });
      } else {
        onClipUpdate(selectedClip.id, selectedClip.type, {
          startTime: newStartTime,
          duration: newDuration
        });
      }
    } else if (dragType === 'end') {
      const newDuration = Math.max(1, Math.min(initialDuration + timeDelta, 60 - initialStartTime));
      if (selectedClip.type === 'video') {
        const videoClip = selectedClip as VideoClip;
        const trimDelta = newDuration - initialDuration;
        const newTrimEnd = videoClip.trimEnd + trimDelta;
        onClipUpdate(selectedClip.id, 'video', {
          duration: newDuration,
          trimEnd: newTrimEnd
        });
      } else {
        onClipUpdate(selectedClip.id, selectedClip.type, {
          duration: newDuration
        });
      }
    } else if (dragType === 'move') {
      const newStartTime = Math.max(0, Math.min(initialStartTime + timeDelta, 60 - initialDuration));
      onClipUpdate(selectedClip.id, selectedClip.type, { startTime: newStartTime });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragType(null);
    setSelectedClip(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, selectedClip, dragType]);

  // Add click outside handler for context menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu && contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      // Use setTimeout to avoid immediate trigger on right-click
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu]);

  const renderClip = (clip: Clip, type: 'video' | 'text' | 'audio') => {
    const style = {
      left: `${(clip.startTime / 60) * 100}%`,
      width: `${(clip.duration / 60) * 100}%`,
    };

    return (
      <div
        key={clip.id}
        className={`${styles.clip} ${styles[type]}`}
        style={style}
        onContextMenu={(e) => handleContextMenu(e, clip.id, type)}
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          if (!target.classList.contains(styles.trimHandle)) {
            handleMouseDown(clip, 'move', e);
          }
        }}
      >
        <div
          className={styles.trimHandle}
          style={{ left: 0 }}
          onMouseDown={(e) => handleMouseDown(clip, 'start', e)}
        />
        <div className={styles.clipContent}>
          {type === 'text' ? (clip as TextOverlay).text : type}
        </div>
        <div
          className={styles.trimHandle}
          style={{ right: 0 }}
          onMouseDown={(e) => handleMouseDown(clip, 'end', e)}
        />
      </div>
    );
  };

  return (
    <div className={styles.timeline}>
      <div
        ref={timelineRef}
        className={styles.tracks}
        onClick={(e) => {
          if (!timelineRef.current) return;
          const rect = timelineRef.current.getBoundingClientRect();
          const clickPosition = e.clientX - rect.left;
          const totalWidth = rect.width;
          const time = (clickPosition / totalWidth) * 60;
          onTimeUpdate(time);
        }}
      >
        {/* Playhead indicator */}
        <div 
          className={styles.playhead}
          style={{
            left: `${(currentTime / 60) * 100}%`
          }}
        />

        {/* Video Track */}
        <div className={styles.track}>
          {videoClips.map((clip) => renderClip(clip, 'video'))}
        </div>

        {/* Text Track */}
        <div className={styles.track}>
          {textOverlays.map((clip) => renderClip(clip, 'text'))}
        </div>

        {/* Audio Track */}
        <div className={styles.track}>
          {audioClips.map((clip) => renderClip(clip, 'audio'))}
        </div>
      </div>

      {contextMenu && (
        <div
          ref={contextMenuRef}
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {(contextMenu.type === 'video' || contextMenu.type === 'audio') && (
            <div className={styles.volumeControl}>
              <label>Volume: {Math.round((contextMenu.volume ?? 1) * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={contextMenu.volume ?? 1}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className={styles.volumeSlider}
              />
            </div>
          )}
          <button onClick={() => handleDeleteClip(contextMenu.clipId, contextMenu.type)}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default Timeline; 