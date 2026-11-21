import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {FPS, H, TL, W} from './lib';
import {CLIENT_PLACEHOLDER, TalkVideo} from './talk/TalkVideo';
import {SH, SW, T as ST} from './talk/theme';

export const Root: React.FC = () => (
  <>
    <Composition
      id="EffortVideo"
      component={EffortVideo}
      durationInFrames={Math.round(TL.duration * FPS)}
      fps={FPS}
      width={W}
      height={H}
    />
    <Composition
      id="Talk"
      component={TalkVideo}
      defaultProps={CLIENT_PLACEHOLDER}
      durationInFrames={Math.round(ST.duration * ST.fps)}
      fps={ST.fps}
      width={SW}
      height={SH}
    />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
