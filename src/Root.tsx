import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {IbdaaShowreel} from './ibdaa/Showreel';
import ibdaaTL from './ibdaa/timeline.json';
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
      id="IbdaaShowreel"
      component={IbdaaShowreel}
      durationInFrames={Math.round(ibdaaTL.duration * ibdaaTL.fps)}
      fps={ibdaaTL.fps}
      width={1080}
      height={1350}
    />
    <Composition
      id="IbdaaShowreel916"
      component={IbdaaShowreel}
      durationInFrames={Math.round(ibdaaTL.duration * ibdaaTL.fps)}
      fps={ibdaaTL.fps}
      width={1080}
      height={1920}
    />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
