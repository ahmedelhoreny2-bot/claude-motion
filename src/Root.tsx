import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {FPS, H, TL, W} from './lib';
import {NurseryAd} from './nursery/NurseryAd';
import {NurseryCover} from './nursery/NurseryCover';
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
    <Still id="NurseryCover" component={NurseryCover} width={1080} height={1920} />
    <Still id="NurseryCoverSquare" component={NurseryCover} defaultProps={{square: true}} width={1080} height={1080} />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
