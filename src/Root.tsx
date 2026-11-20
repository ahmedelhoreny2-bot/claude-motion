import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {FPS, H, TL, W} from './lib';
import {SEDRA_DURATION, SEDRA_H, SEDRA_W, SedraAd} from './sedra/SedraAd';
import {FPS as SEDRA_FPS} from './sedra/kit';
import {TALK_DURATION, TalkEdit} from './talk/TalkEdit';

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
      id="SedraAd"
      component={SedraAd}
      durationInFrames={SEDRA_DURATION}
      fps={SEDRA_FPS}
      width={SEDRA_W}
      height={SEDRA_H}
    />
    <Composition id="SedraTalk" component={TalkEdit} durationInFrames={TALK_DURATION} fps={30} width={1080} height={1920} />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
