import React from 'react';
import { Composition } from 'remotion';
import { RemotionVideo, RemotionVideoProps } from '../RemotionVideo';

const defaultProps: RemotionVideoProps = {
  videoClips: [],
  audioClips: [],
  textOverlays: [],
};

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="VideoEditor"
        component={RemotionVideo}
        durationInFrames={60 * 30} // 60 seconds at 30fps
        fps={60}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
      />
    </>
  );
}; 