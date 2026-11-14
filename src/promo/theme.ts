import {spring, SpringConfig} from 'remotion';
import timeline from './timeline.json';

export const TL = timeline;
export const FPS = TL.fps;
export const W = 1080;
export const H = 1920;

/** Tokens from the إبداع بيتحرك design system (dark theme). */
export const P = {
  bg: '#111111', // ground
  surface: '#1C1E21',
  line: '#2E3236',
  ink: '#F4F1E8',
  muted: '#A3A8AD',
  orange: '#FF5A1F', // brand
  onOrange: '#160803', // on-brand: text on orange, never white
  teal: '#13C0AD', // accent: motion lines, labels, info
  onTeal: '#111111',
  // aliases used by the scenes
  card: '#1C1E21',
  cardHi: '#24272B',
  block: '#2E3236',
  paper: '#F4F1E8',
  cream: '#F4F1E8',
  creamDim: '#A3A8AD',
};

export const R = {sm: 8, md: 14, lg: 22, xl: 28, pill: 999};

export const F = {
  display: 'Lalezar, "IBM Plex Sans Arabic", system-ui, sans-serif',
  ar: '"IBM Plex Sans Arabic", system-ui, sans-serif',
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
