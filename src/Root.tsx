import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {FPS, H, TL, W} from './lib';
import {PromoVideo} from './promo/PromoVideo';
import {DOT_DURATION, DOT_FPS, DotVideo} from './dot/DotVideo';
import * as PT from './promo/theme';

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
      id="IbdaaPromo"
      component={PromoVideo}
      durationInFrames={Math.round(PT.TL.duration * PT.FPS)}
      fps={PT.FPS}
      width={PT.W}
      height={PT.H}
    />
    <Composition
      id="IbdaaDot"
      component={DotVideo}
      durationInFrames={Math.round(DOT_DURATION * DOT_FPS)}
      fps={DOT_FPS}
      width={1080}
      height={1920}
    />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
