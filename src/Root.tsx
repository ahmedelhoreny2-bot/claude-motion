import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {AsemaPromo, PFPS, PH, PW} from './asema/AsemaPromo';
import asemaTL from './asema/timeline.json';
import {LabTour, TFPS, TH, TW} from './asema2/LabTour';
import tourTL from './asema2/timeline.json';
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
      id="AsemaPromo"
      component={AsemaPromo}
      durationInFrames={Math.round(asemaTL.duration * PFPS)}
      fps={PFPS}
      width={PW}
      height={PH}
    />
    <Composition
      id="LabTour"
      component={LabTour}
      durationInFrames={Math.round(tourTL.duration * TFPS)}
      fps={TFPS}
      width={TW}
      height={TH}
    />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
