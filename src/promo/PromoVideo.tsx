import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Grain} from '../components/primitives';
import {easeOut, prog} from '../lib';
import {Backdrop, SpeedWipe, useCairo} from './kit';
import {Finale} from './scenes/Finale';
import {Opening} from './scenes/Opening';
import {Showcase} from './scenes/Showcase';
import {FPS, TL} from './theme';

export const PromoVideo: React.FC = () => {
  useCairo();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const glow = prog(t, TL.s3.tap, TL.s3.tap + 1, easeOut);
  const wipes = [...TL.s4.wipes, TL.s6.converge];
  return (
    <AbsoluteFill style={{background: '#111111'}}>
      <Backdrop t={t} glow={glow} />
      <Opening frame={frame} />
      <Showcase frame={frame} />
      <Finale frame={frame} />
      {wipes.map((w) => (
        <SpeedWipe key={w} t={t} at={w} />
      ))}
      <Grain frame={frame} opacity={0.08} />
    </AbsoluteFill>
  );
};
