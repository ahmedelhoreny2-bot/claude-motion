import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Grain} from '../components/primitives';
import {Backdrop, SpeedWipe, useBrandFonts} from './kit';
import {Finale} from './scenes/Finale';
import {Opening} from './scenes/Opening';
import {Showcase} from './scenes/Showcase';
import {Depth, Stage} from './space';
import {FPS, P, TL} from './theme';

export const PromoVideo: React.FC = () => {
  useBrandFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const wipes = [...TL.s4.wipes, TL.s6.converge];
  return (
    <AbsoluteFill style={{background: P.bg}}>
      <Stage frame={frame}>
        <Depth z={-900} fill>
          <Backdrop t={t} />
        </Depth>
        <Opening frame={frame} />
        <Showcase frame={frame} />
        <Finale frame={frame} />
        {wipes.map((w) => (
          <SpeedWipe key={w} t={t} at={w} />
        ))}
      </Stage>
      <Grain frame={frame} opacity={0.08} />
    </AbsoluteFill>
  );
};
