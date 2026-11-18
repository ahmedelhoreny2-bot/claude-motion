import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {FPS, LightGrain, T, TriWipe, useArabicFonts} from './kit';
import {Cta, Designs, Hero, Hook, Intro, Offer, Section, SECTIONS} from './scenes';

const seq = (a: number, b: number) => ({from: Math.round(a * FPS), durationInFrames: Math.round((b - a) * FPS)});

/** Wipe instants: every section boundary plus the edges of the designs block. */
const WIPES = [...T.sections, T.designs.start, T.hero.start];

export const IbdaaShowreel: React.FC = () => {
  useArabicFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const ends = [...T.sections.slice(1), T.designs.start];
  return (
    <AbsoluteFill style={{background: '#F4F1EA'}}>
      <Sequence {...seq(0, T.hook.end + 0.1)}>
        <Hook />
      </Sequence>
      <Sequence {...seq(T.intro.start, T.intro.end + 0.1)}>
        <Intro />
      </Sequence>
      {SECTIONS.map((_, i) => (
        <Sequence key={i} {...seq(T.sections[i], ends[i] + 0.1)}>
          <Section i={i} />
        </Sequence>
      ))}
      <Sequence {...seq(T.designs.start, T.designs.end + 0.1)}>
        <Designs />
      </Sequence>
      <Sequence {...seq(T.hero.start, T.hero.end + 0.05)}>
        <Hero />
      </Sequence>
      <Sequence {...seq(T.offer.start, T.offer.end + 0.05)}>
        <Offer />
      </Sequence>
      <Sequence {...seq(T.cta.start, T.cta.end)}>
        <Cta />
      </Sequence>
      {WIPES.map((w) => (
        <TriWipe key={w} t={t} at={w} />
      ))}
      <LightGrain frame={frame} />
    </AbsoluteFill>
  );
};
