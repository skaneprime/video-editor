export interface VideoClip {
  id: string;
  type: 'video';
  url: string;
  startTime: number;
  endTime: number;
  trimStart: number;
  trimEnd: number;
  duration: number;
  volume: number;
}

export interface AudioClip {
  id: string;
  type: 'audio';
  url: string;
  startTime: number;
  endTime: number;
  trimStart: number;
  trimEnd: number;
  duration: number;
  volume: number;
}

export interface TextOverlay {
  id: string;
  type: 'text';
  text: string;
  position: {
    x: number;
    y: number;
  };
  startTime: number;  
  trimStart: number;
  trimEnd: number;
  duration: number;
  color: string;
}

export type Clip = VideoClip | TextOverlay | AudioClip; 