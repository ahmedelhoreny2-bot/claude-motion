import React from 'react';
import {AbsoluteFill} from 'remotion';
import {easeIn, prog} from '../lib';
import {FPS, HEAVY, sp, TL} from './theme';

/**
 * 2.5D space: one perspective camera for the whole piece, extruded objects,
 * and velocity stretch. Every container between the camera and a layer that
 * sits at its own Z must carry P3, or the browser flattens it.
 */
export const P3: React.CSSProperties = {transformStyle: 'preserve-3d'};
export const PERSPECTIVE = 1500;

const decay = (dt: number, rate: number) => (dt < 0 ? 0 : Math.exp(-dt * rate));

/** Camera pose at frame. Moves are motivated by beats; it calms down whenever text must be read. */
export const camera = (frame: number) => {
  const t = frame / FPS;
  const {s1, s2, s3, s4, s5, s6, s7} = TL;
  // reading calm: the CTA and logo hold barely move
  const calm = 1 - 0.75 * prog(t, s6.word2, s6.word2 + 1.2);
  let rx = 2.2 * Math.sin(t * 0.31 + 0.4) * calm;
  let ry = 3.2 * Math.sin(t * 0.23) * calm;
  let rz = 0;
  let z = 0;

  // hook: the feed lies tilted like a phone in the hand, the stop snaps it upright
  const up = sp(frame, s1.stop, {damping: 11, stiffness: 120, mass: 0.8});
  rx += 34 * (1 - up);
  z += -260 * (1 - up);
  ry += 6 * (1 - up);

  // the pile: a slow orbit that builds tension
  const orbit = prog(t, s2.fall, s3.squash);
  if (t > s2.fall && t < s3.tap + 1.5) ry += (-12 + 24 * orbit) * (1 - prog(t, s3.tap, s3.tap + 1.2));
  z += 140 * prog(t, s2.why, s3.squash);
  z -= 140 * prog(t, s3.tap, s3.tap + 1.2);

  // the tap: a punch toward the lens with a roll
  z += 320 * decay(t - s3.tap, 3.2);
  rz += 4 * Math.sin((t - s3.tap) * 18) * decay(t - s3.tap, 4);

  // every wipe: swing out, then the next scene swings in
  for (const w of [...s4.wipes, s6.converge]) {
    if (t < w && t > w - 0.6) ry += 14 * prog(t, w - 0.6, w, easeIn);
    if (t >= w && t < w + 2.5) ry -= 22 * (1 - sp(frame, w, HEAVY));
    if (t >= w && t < w + 2.5) z += 120 * (1 - sp(frame, w, HEAVY));
  }
  // showcase: a slow push through each card
  for (let i = 0; i < s4.wipes.length - 1; i++) {
    const a = s4.wipes[i];
    const b = s4.wipes[i + 1];
    if (t >= a && t < b) z += 90 * prog(t, a, b);
  }
  // fields: dolly in toward the drum
  if (t > s5.head - 0.3 && t < s5.exit + 0.6) z += 160 * prog(t, s5.head, s5.exit);

  // the brand hit
  z += 260 * decay(t - s6.hit, 3);
  rz += 2.5 * Math.sin((t - s6.hit) * 16) * decay(t - s6.hit, 5);
  // the dock: a gentle settle
  z += 60 * (1 - sp(frame, s7.dock, HEAVY)) * (t > s7.dock ? 1 : 0);

  return `translateZ(${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`;
};

/** Camera rig: perspective on the outside, the pose on the inside. */
export const Stage: React.FC<{frame: number; children: React.ReactNode}> = ({frame, children}) => (
  <AbsoluteFill style={{perspective: PERSPECTIVE, perspectiveOrigin: '50% 48%'}}>
    <AbsoluteFill style={{...P3, transform: camera(frame)}}>{children}</AbsoluteFill>
  </AbsoluteFill>
);

/** Push a layer back (negative) or forward (positive) and keep it filling the frame. */
export const Depth: React.FC<{z: number; fill?: boolean; children: React.ReactNode}> = ({z, fill, children}) => {
  const s = fill ? ((PERSPECTIVE - z) / PERSPECTIVE) * 1.25 : 1;
  return <AbsoluteFill style={{...P3, transform: `translateZ(${z}px) scale(${s})`}}>{children}</AbsoluteFill>;
};

/** A token colour darkened toward black, for the sides of extruded objects. */
export const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.round(v * k).toString(16).padStart(2, '0');
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`;
};

/**
 * Solid thickness: the face, plus `layers` copies of `back` (a cheap
 * silhouette in a side colour) stepping back in Z. No filters: they are what
 * makes software rendering slow.
 */
export const Extrude: React.FC<{
  depth?: number;
  layers?: number;
  back: React.ReactNode;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({depth = 36, layers = 6, back, style, children}) => (
  <div style={{position: 'relative', ...P3, ...style}}>
    {Array.from({length: layers}).map((_, i) => (
      <div key={i} style={{position: 'absolute', inset: 0, transform: `translateZ(${(-depth * (layers - i)) / layers}px)`}}>
        {back}
      </div>
    ))}
    <div style={{position: 'relative', transform: 'translateZ(0.5px)'}}>{children}</div>
  </div>
);

/** A rounded slab: the usual `back` for pills, cards and screens. */
export const Slab: React.FC<{color: string; radius: number}> = ({color, radius}) => (
  <div style={{position: 'absolute', inset: 0, background: color, borderRadius: radius}} />
);

/** Squash & stretch along the direction of travel (dx, dy in px per frame). */
export const stretch = (dx: number, dy: number, gain = 0.012, max = 0.7) => {
  const v = Math.hypot(dx, dy);
  if (v < 0.5) return '';
  const k = Math.min(max, v * gain);
  const a = (Math.atan2(dy, dx) * 180) / Math.PI;
  return `rotate(${a}deg) scale(${1 + k}, ${1 / (1 + k * 0.6)}) rotate(${-a}deg)`;
};

export const dz = (fn: (t: number) => number, t: number) => fn(t) - fn(t - 1 / FPS);
