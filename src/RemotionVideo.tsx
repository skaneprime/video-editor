import { Composition, Video, Audio, AbsoluteFill } from 'remotion';
import { VideoClip, AudioClip, TextOverlay } from './types';

export interface RemotionVideoProps {
  videoClips: VideoClip[];
  audioClips: AudioClip[];
  textOverlays: TextOverlay[];
}

export const RemotionVideo = ({
  videoClips = [],
  audioClips = [],
  textOverlays = [],
}: RemotionVideoProps) => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {/* Video Clips */}
      {videoClips.map((clip) => (
        <Video
          key={clip.id}
          src={clip.url}
          startFrom={clip.startTime}
          endAt={clip.endTime}
          volume={clip.volume}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
      ))}

      {/* Audio Clips */}
      {audioClips.map((clip) => (
        <Audio
          key={clip.id}
          src={clip.url}
          startFrom={clip.startTime}
          endAt={clip.endTime}
          volume={clip.volume}
        />
      ))}

      {/* Text Overlays */}
      {textOverlays.map((overlay) => (
        <div
          key={overlay.id}
          style={{
            position: 'absolute',
            left: `${overlay.position.x}%`,
            top: `${overlay.position.y}%`,
            transform: 'translate(-50%, -50%)',
            color: overlay.color,
            fontFamily: 'Arial',
            fontSize: '48px',
            fontWeight: 'bold',
            textAlign: 'center',
            WebkitTextStroke: '2px black',
            textShadow: '2px 2px 0 #000',
            zIndex: 10,
          }}
        >
          {overlay.text}
        </div>
      ))}
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VideoEditor"
        component={RemotionVideo}
        durationInFrames={60 * 30} // 30 seconds at 60fps
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          videoClips: [],
          audioClips: [],
          textOverlays: [],
        }}
      />
    </>
  );
}; 