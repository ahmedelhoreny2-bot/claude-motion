import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {FPS, H, TL, W} from './lib';
import {CLIENT_PLACEHOLDER, TalkVideo} from './talk/TalkVideo';
import {SHOW_LEN, ShowCover, Showcase} from './talk/Showcase';
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
    <Composition id="Showcase" component={Showcase} durationInFrames={Math.round(SHOW_LEN * 30)} fps={30} width={1080} height={1920} />
    <Still id="ShowCover" component={ShowCover} width={1080} height={1920} />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
