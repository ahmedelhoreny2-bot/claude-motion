import '@fontsource/cairo/400.css';
import '@fontsource/cairo/600.css';
import '@fontsource/cairo/700.css';
import '@fontsource/cairo/900.css';
import '@fontsource/lalezar/arabic-400.css';
import '@fontsource/lalezar/latin-400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import tl from '../../formol.timeline.json';
import {SpringConfig} from 'remotion';
import {clamp01, sp as libSp} from '../lib';

export const T = tl;
export const FPS = T.fps;
export const W = 1920;
export const H = 1080;

/**
 * Colour means chemistry: cyan = basic (amine), red = acidic (carboxyl),
 * pink = phenolphthalein, lime = formalin, violet = protein / R, gold = an answer.
 */
export const P = {
  bg0: '#060A22',
  bg1: '#121A55',
  bg2: '#2B1366',
  text: '#F5F7FF',
  dim: 'rgba(245,247,255,0.70)',
  muted: 'rgba(245,247,255,0.45)',
  faint: 'rgba(245,247,255,0.14)',
  line: 'rgba(245,247,255,0.22)',
  panel: 'rgba(20,26,80,0.62)',
  cyan: '#2ED3FF',
  blue: '#3D7BFF',
  red: '#FF4D6A',
  pink: '#FF4FA8',
  pinkSoft: '#FFB3D8',
  lime: '#8CF25A',
  violet: '#A070FF',
  gold: '#FFC83D',
  orange: '#FF8A3D',
  milk: '#FFF7EA',
  white: '#FFFFFF',
  ink: '#0A0E2A',
  asuNavy: '#2D2B90',
  asuOrange: '#EA7A2A',
  asuGreen: '#22A04D',
};

export const F = {
  display: 'Lalezar, Cairo, sans-serif',
  body: 'Cairo, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

type RGBA = [number, number, number, number];
const parse = (c: string): RGBA => {
  if (c.startsWith('#')) {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const m = c.match(/[\d.]+/g)!.map(Number);
  return [m[0], m[1], m[2], m[3] ?? 1];
};
export const mix = (a: string, b: string, k: number) => {
  const A = parse(a);
  const B = parse(b);
  const q = clamp01(k);
  const v = A.map((x, i) => x + (B[i] - x) * q);
  return `rgba(${v[0].toFixed(0)},${v[1].toFixed(0)},${v[2].toFixed(0)},${v[3].toFixed(3)})`;
};
export const alpha = (c: string, a: number) => {
  const v = parse(c);
  return `rgba(${v[0]},${v[1]},${v[2]},${(v[3] * a).toFixed(3)})`;
};

/** Visible-window helper: 1 inside [a, b], with fade-in `fi` and fade-out `fo` seconds. */
export const win = (t: number, a: number, b: number, fi = 0.4, fo = 0.35) =>
  clamp01((t - a) / fi) * clamp01((b - t) / fo);

/** Spring at this video's 30 fps (lib's `sp` defaults to the 60 fps example). */
export const sp = (frame: number, startSec: number, config: Partial<SpringConfig> = {}) => libSp(frame, startSec, config, FPS);
