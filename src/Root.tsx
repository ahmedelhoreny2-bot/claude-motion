import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {IbdaaShowreel} from './ibdaa/Showreel';
import ibdaaTL from './ibdaa/timeline.json';
import {IbdaaExplainer} from './ibdaa2/Explainer';
import explTL from './ibdaa2/timeline.json';
import {IbdaaPromo, PROMO_DURATION} from './ibdaa3/Promo';
import {IbdaaCover} from './ibdaa3/Cover';
import {IbdaaBrand} from './ibdaa3/BrandSheet';
import {IbdaaFbCover, IbdaaFbCover2, IbdaaFbCover3, IbdaaProfile} from './ibdaa3/Facebook';
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
    <Composition
      id="IbdaaExplainer"
      component={IbdaaExplainer}
      durationInFrames={Math.round(explTL.duration * explTL.fps)}
      fps={explTL.fps}
      width={1080}
      height={1350}
    />
    <Composition
      id="IbdaaExplainer916"
      component={IbdaaExplainer}
      durationInFrames={Math.round(explTL.duration * explTL.fps)}
      fps={explTL.fps}
      width={1080}
      height={1920}
    />
    <Composition
      id="IbdaaPromo"
      component={IbdaaPromo}
      durationInFrames={Math.round(PROMO_DURATION * 30)}
      fps={30}
      width={1080}
      height={1350}
    />
    <Composition
      id="IbdaaPromo916"
      component={IbdaaPromo}
      durationInFrames={Math.round(PROMO_DURATION * 30)}
      fps={30}
      width={1080}
      height={1920}
    />
    <Still id="IbdaaCover" component={IbdaaCover} width={1080} height={1350} />
    <Still id="IbdaaCover916" component={IbdaaCover} width={1080} height={1920} />
    <Still id="IbdaaBrand" component={IbdaaBrand} width={1240} height={1754} />
    <Still id="IbdaaProfile" component={IbdaaProfile} width={1080} height={1080} defaultProps={{variant: 'light' as const}} />
    <Still id="IbdaaProfileOrange" component={IbdaaProfile} width={1080} height={1080} defaultProps={{variant: 'orange' as const}} />
    <Still id="IbdaaFbCover" component={IbdaaFbCover} width={1640} height={624} />
    <Still id="IbdaaFbCover2" component={IbdaaFbCover2} width={1640} height={624} />
    <Still id="IbdaaFbCover3" component={IbdaaFbCover3} width={1640} height={624} defaultProps={{dark: false}} />
    <Still id="IbdaaFbCover3Dark" component={IbdaaFbCover3} width={1640} height={624} defaultProps={{dark: true}} />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
