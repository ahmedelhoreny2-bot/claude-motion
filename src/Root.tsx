import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {FPS, H, TL, W} from './lib';
import {NurseryAd} from './nursery/NurseryAd';
import {NFPS, NH, NT, NW} from './nursery/theme';

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
      id="NurseryAd"
      component={NurseryAd}
      durationInFrames={Math.round(NT.duration * NFPS)}
      fps={NFPS}
      width={NW}
      height={NH}
    />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
