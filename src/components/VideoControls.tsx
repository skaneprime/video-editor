import React from 'react';
import styles from '../styles/VideoControls.module.css';

interface VideoControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onAddText: () => void;
  onExport: () => void;
  isExporting?: boolean;
  exportProgress?: number;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  onPlayPause,
  onAddText,
  onExport,
  isExporting = false,
  exportProgress = 0
}) => {
  return (
    <div className={styles.controls}>
      <button
        className={styles.controlButton}
        onClick={onPlayPause}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '⏸️' : '▶️'}
      </button>
      
      <button
        className={styles.controlButton}
        onClick={onAddText}
        title="Add Text Overlay"
      >
        📝
      </button>
      
      <button
        className={styles.controlButton}
        onClick={onExport}
        disabled={isExporting}
        title={isExporting ? `Exporting: ${exportProgress}%` : 'Export Video'}
      >
        {isExporting ? '⏳' : '💾'}
      </button>
    </div>
  );
}; 