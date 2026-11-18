import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {FormolVideo} from './formol/FormolVideo';
import {T as FT} from './formol/theme';
import {FPS, H, TL, W} from './lib';

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
      id="FormolVideo"
      component={FormolVideo}
      durationInFrames={Math.round(FT.duration * FT.fps)}
      fps={FT.fps}
      width={1920}
      height={1080}
    />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
