import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, useCurrentFrame} from 'remotion';
import {Grain} from '../components/primitives';
import {clamp01} from '../lib';
import {Bokeh, Aurora, Captions} from './ui';
import {CalcScene, Intro, Outro, ProteinScene} from './scenes/Bookends';
import {LabScene} from './scenes/LabScene';
import {MoleculeScene} from './scenes/MoleculeScene';
import {FPS, P, T} from './theme';

const useArabicFonts = () => {
  const [handle] = useState(() => delayRender('arabic fonts'));
  useEffect(() => {
    Promise.all([
      document.fonts.load('400 60px Lalezar', 'تقدير'),
      document.fonts.load('400 30px Cairo', 'تقدير'),
      document.fonts.load('600 30px Cairo', 'تقدير'),
      document.fonts.load('700 30px Cairo', 'تقدير'),
      document.fonts.load('900 30px Cairo', 'تقدير'),
      document.fonts.load('700 30px "JetBrains Mono"'),
      document.fonts.load('500 30px "JetBrains Mono"'),
    ]).then(() => continueRender(handle));
  }, [handle]);
};

export const FormolVideo: React.FC = () => {
  useArabicFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  // background tint follows the chemistry: violet (protein), red (acid), pink (indicator), gold (answers)
  const tint =
    t < T.amino.enter ? P.violet : t < T.lab.enter ? P.red : t < T.calc.enter ? P.pink : P.gold;
  const tintK = clamp01(0.6 + 0.4 * Math.sin(t * 0.5));
  return (
    <AbsoluteFill style={{background: P.bg0}}>
      <Aurora t={t} tint={tint} tintK={tintK} />
      <Bokeh t={t} />
      <Intro t={t} />
      <ProteinScene t={t} />
      <MoleculeScene t={t} />
      <LabScene t={t} />
      <CalcScene t={t} />
      <Outro t={t} />
      <Captions t={t} />
      <Grain frame={frame} opacity={0.07} />
    </AbsoluteFill>
  );
};
