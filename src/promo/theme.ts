import {spring, SpringConfig} from 'remotion';
import timeline from './timeline.json';

export const TL = timeline;
export const FPS = TL.fps;
export const W = 1080;
export const H = 1920;

export const P = {
  bg: '#111111',
  bg2: '#1B1A19',
  card: '#222120',
  cardHi: '#2C2B29',
  block: '#353331',
  paper: '#CFCAC0',
  paperDim: '#8E8A83',
  orange: '#FF5E1F',
  orangeHi: '#FF8A55',
  teal: '#17C3B2',
  tealHi: '#5FE0D2',
  cream: '#F3EFE8',
  creamDim: 'rgba(243,239,232,0.62)',
  muted: 'rgba(243,239,232,0.32)',
  line: 'rgba(243,239,232,0.08)',
};

export const F = {
  ar: '"Cairo", system-ui, sans-serif',
};

export const sp = (frame: number, startSec: number, config: Partial<SpringConfig> = {}) => {
  const fr = frame - startSec * FPS;
  if (fr <= 0) return 0;
  return spring({frame: fr, fps: FPS, config: {damping: 14, mass: 0.8, stiffness: 140, ...config}});
};

export const POP: Partial<SpringConfig> = {damping: 10, stiffness: 210, mass: 0.7};
export const HEAVY: Partial<SpringConfig> = {damping: 18, stiffness: 160, mass: 0.9};
export const ELASTIC: Partial<SpringConfig> = {damping: 8, stiffness: 200, mass: 0.8};

const DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const arNum = (n: number) => String(n).replace(/\d/g, (d) => DIGITS[Number(d)]);

/** Scene visibility window with a little slack so overlapping exits/entrances both render. */
export const live = (t: number, a: number, b: number) => t >= a - 0.05 && t <= b + 0.05;
