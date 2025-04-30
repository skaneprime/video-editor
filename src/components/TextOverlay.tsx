import React, { useState } from 'react';
import styles from '../styles/TextOverlay.module.css';
import { TextOverlay as ITextOverlay } from '../types';

interface TextOverlayProps extends ITextOverlay {
  onUpdate: (id: string, updates: Partial<ITextOverlay>) => void;
  onDelete: (id: string) => void;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({
  id,
  text,
  color,
  position,
  startTime,
  duration,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);
  const [editedColor, setEditedColor] = useState(color);
  const [editedPosition, setEditedPosition] = useState(position);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedText(e.target.value);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedColor(e.target.value);
  };

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    setEditedPosition((prev) => ({
      ...prev,
      [axis]: Math.max(0, Math.min(100, value)),
    }));
  };

  const handleSave = () => {
    onUpdate(id, {
      text: editedText,
      color: editedColor,
      position: editedPosition,
    });
    setIsEditing(false);
  };

  return (
    <div className={styles.textOverlay}>
      {isEditing ? (
        <div className={styles.editControls}>
          <input
            type="text"
            value={editedText}
            onChange={handleTextChange}
            className={styles.textInput}
          />
          <input
            type="color"
            value={editedColor}
            onChange={handleColorChange}
            className={styles.colorInput}
          />
          <div className={styles.positionControls}>
            <label>
              X:
              <input
                type="number"
                value={editedPosition.x}
                onChange={(e) => handlePositionChange('x', Number(e.target.value))}
                min={0}
                max={100}
              />
            </label>
            <label>
              Y:
              <input
                type="number"
                value={editedPosition.y}
                onChange={(e) => handlePositionChange('y', Number(e.target.value))}
                min={0}
                max={100}
              />
            </label>
          </div>
          <button onClick={handleSave} className={styles.saveButton}>
            Save
          </button>
        </div>
      ) : (
        <div
          className={styles.preview}
          style={{
            color,
            left: `${position.x}%`,
            top: `${position.y}%`,
          }}
          onClick={() => setIsEditing(true)}
        >
          {text}
        </div>
      )}
      <button
        onClick={() => onDelete(id)}
        className={styles.deleteButton}
        title="Delete text overlay"
      >
        ×
      </button>
    </div>
  );
}; 