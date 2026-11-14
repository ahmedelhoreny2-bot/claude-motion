import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, Img, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame} from 'remotion';
import '@fontsource/baloo-bhaijaan-2/arabic-700.css';
import '@fontsource/baloo-bhaijaan-2/arabic-800.css';
import '@fontsource/baloo-bhaijaan-2/latin-800.css';
import {Grain} from '../components/primitives';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog, rand} from '../lib';
import {useBrandFonts, Words} from '../promo/kit';
import {F as BF, P as BP} from '../promo/theme';
import timeline from './timeline.json';

const TL = timeline;
const FPS = TL.fps;
const {hook: HK, build: BD, why: WY, flip: FL} = TL;
const W = 1080;

/** «شطّور» — a fictional toy brand, its own light palette. */
const T = {
  bg: '#FFF8EE',
  navy: '#1E2A5A',
  sky: '#7CC6FE',
  sun: '#FFD15C',
  coral: '#FF8A80',
  mint: '#7ED6B2',
  white: '#FFFFFF',
  skin: '#F6C7A1',
};
const FONT = '"Baloo Bhaijaan 2", system-ui, sans-serif';
/** Where the full stop of «حتى لو لسه نقطة» sits (left end of the centred line). */
const PERIOD = {x: 192, y: 874};

const useToyFont = () => {
  const [h] = useState(() => delayRender('baloo'));
  useEffect(() => {
    Promise.all(['700 100px "Baloo Bhaijaan 2"', '800 100px "Baloo Bhaijaan 2"'].map((f) => document.fonts.load(f, 'شطّور'))).then(() => continueRender(h));
  }, [h]);
};

const sp = (frame: number, at: number, cfg: {damping?: number; stiffness?: number; mass?: number} = {}) => {
  const f = frame - at * FPS;
  return f <= 0 ? 0 : spring({frame: f, fps: FPS, config: {damping: 13, stiffness: 140, mass: 0.8, ...cfg}});
};

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const mixc = (v: number) => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k));
  const r = mixc((n >> 16) & 255);
  const g = mixc((n >> 8) & 255);
  const b = mixc(n & 255);
  return `rgb(${r},${g},${b})`;
};

/* ---------------- isometric blocks ---------------- */

type Cell = [number, number, number, string];
const ORIGIN = {x: 540, y: 1230};
const S = 92;
const iso = (gx: number, gy: number, gz: number, s = S, o = ORIGIN) => ({
  x: o.x + (gx - gy) * s * 0.866,
  y: o.y + (gx + gy) * s * 0.5 - gz * s,
});

const cubeFaces = (gx: number, gy: number, gz: number, color: string, s = S, scale = 1, o = ORIGIN) => {
  const c = iso(gx + 0.5, gy + 0.5, gz + 0.5, s, o);
  const pt = (dx: number, dy: number, dz: number) => {
    const p = iso(gx + 0.5 + (dx - 0.5) * scale, gy + 0.5 + (dy - 0.5) * scale, gz + 0.5 + (dz - 0.5) * scale, s, o);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  };
  return {
    depth: gx + gy + gz * 0.01,
    c,
    faces: [
      {pts: [pt(0, 0, 1), pt(1, 0, 1), pt(1, 1, 1), pt(0, 1, 1)].join(' '), fill: shade(color, 0.35)},
      {pts: [pt(1, 0, 0), pt(1, 1, 0), pt(1, 1, 1), pt(1, 0, 1)].join(' '), fill: shade(color, -0.12)},
      {pts: [pt(0, 1, 0), pt(1, 1, 0), pt(1, 1, 1), pt(0, 1, 1)].join(' '), fill: color},
    ],
  };
};

const ROCKET: Cell[] = [
  [-1, 0, 0, T.coral], [0, -1, 0, T.coral],
  [0, 0, 0, T.coral], [0, 0, 1, T.white], [0, 0, 2, T.sky], [0, 0, 3, T.white], [0, 0, 4, T.white], [0, 0, 5, T.coral],
  [1, 0, 0, T.coral], [0, 1, 0, T.coral],
];
const HOUSE: Cell[] = [
  ...[0, 1, 2].flatMap((x) => [0, 1].flatMap((y) => [0, 1].map((z) => [x - 1, y - 1, z, x === 1 && y === 1 && z === 0 ? T.sun : T.sky] as Cell))),
  ...[0, 1, 2].flatMap((x) => [0, 1].map((y) => [x - 1, y - 1, 2, T.coral] as Cell)),
  [0, -1, 3, T.coral], [0, 0, 3, T.coral],
];
const GIRAFFE: Cell[] = [
  [-1, -1, 0, T.sun], [1, -1, 0, T.sun], [-1, 0, 0, T.sun], [1, 0, 0, T.sun],
  [-1, -1, 1, T.sun], [1, -1, 1, T.sun], [-1, 0, 1, T.sun], [1, 0, 1, T.sun],
  [-1, -1, 2, T.sun], [0, -1, 2, T.coral], [1, -1, 2, T.sun], [-1, 0, 2, T.coral], [0, 0, 2, T.sun], [1, 0, 2, T.sun],
  [1, 0, 3, T.sun], [1, 0, 4, T.coral], [1, 0, 5, T.sun], [1, 0, 6, T.sun], [1, 0, 7, T.sun], [2, 0, 7, T.sun],
];
const LETTER: Cell[] = [
  [0, 0, 0, T.sky], [0, 0, 1, T.mint], [0, 0, 2, T.sun], [0, 0, 3, T.coral], [0, 0, 4, T.sky], [0, 0, 5, T.mint],
  [0, 0, 7, T.navy], [1, 0, 7, T.navy],
];
const ONE: Cell[] = [[0, 0, 0, T.sun]];
const POOL = 20;

type Phase = {at: number; cells: Cell[]; fly?: boolean};
const PHASES: Phase[] = [
  {at: HK.drop, cells: ONE},
  {at: HK.rain, cells: ROCKET},
  {at: BD.house, cells: HOUSE},
  {at: BD.giraffe, cells: GIRAFFE},
  {at: BD.letter, cells: LETTER},
];

const blockAt = (i: number, t: number, frame: number) => {
  // where block i sits in each phase it belongs to
  let pos: [number, number, number] | null = null;
  let color = T.sun;
  let scale = 0;
  for (let p = 0; p < PHASES.length; p++) {
    const ph = PHASES[p];
    if (t < ph.at) break;
    const cell = ph.cells[i];
    const prev: [number, number, number] | null = pos;
    const k = sp(frame, ph.at + i * 0.03, {damping: 12, stiffness: 150, mass: 0.75});
    if (cell) {
      const from: [number, number, number] = prev ?? [cell[0], cell[1], cell[2] + 14];
      const arc: number = prev ? Math.sin(Math.PI * clamp01(k)) * 2.5 : 0;
      pos = [lerp(from[0], cell[0], k), lerp(from[1], cell[1], k), lerp(from[2], cell[2], k) + arc];
      color = k > 0.5 || !prev ? cell[3] : color;
      scale = prev ? 1 : clamp01(k * 3);
    } else if (prev) {
      // not needed any more: hop off and shrink
      pos = [prev[0], prev[1], prev[2] + 6 * clamp01(k)];
      scale = 1 - clamp01(k * 1.5);
    }
  }
  if (!pos) return null;
  // the rocket takes off, the house rains back down from where it went
  const lift = prog(t, BD.launch, BD.launch + 0.55, easeIn) * (t < BD.house ? 1 : 0);
  pos = [pos[0], pos[1], pos[2] + lift * 40];
  // the hook cube is lifted by the hand
  if (i === 0 && t >= HK.hand && t < HK.rain) pos = [pos[0], pos[1], pos[2] + 0.6 * sp(frame, HK.hand + 0.35)];
  // everything hops into the box
  const intoBox = sp(frame, BD.box + i * 0.025, {damping: 16, stiffness: 120});
  if (intoBox > 0) {
    pos = [lerp(pos[0], 0, intoBox), lerp(pos[1], 0, intoBox), pos[2] + Math.sin(Math.PI * clamp01(intoBox)) * 5 - intoBox * 1.5];
    scale *= 1 - clamp01((intoBox - 0.6) / 0.4);
  }
  return {pos, color, scale};
};

const Blocks: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  if (t > BD.lid + 0.4) return null;
  const items = Array.from({length: POOL})
    .map((_, i) => {
      const b = blockAt(i, t, frame);
      if (!b || b.scale <= 0.01) return null;
      const f = cubeFaces(b.pos[0], b.pos[1], b.pos[2], b.color, S, b.scale);
      return {...f, i, z: b.pos[2]};
    })
    .filter(Boolean) as (ReturnType<typeof cubeFaces> & {i: number; z: number})[];
  items.sort((a, b) => a.depth - b.depth || a.z - b.z);
  return (
    <svg width={W} height={1920} style={{position: 'absolute'}}>
      {items.map((it) => (
        <g key={it.i}>
          {it.faces.map((fc, k) => (
            <polygon key={k} points={fc.pts} fill={fc.fill} stroke={T.navy} strokeWidth={3} strokeLinejoin="round" />
          ))}
        </g>
      ))}
    </svg>
  );
};

/* ---------------- props around the blocks ---------------- */

const Shadow: React.FC<{t: number}> = ({t}) => {
  const o = 1 - prog(t, BD.box + 0.2, BD.box + 0.6);
  return <div style={{position: 'absolute', left: ORIGIN.x - 340, top: ORIGIN.y + 60, width: 680, height: 110, borderRadius: '50%', background: T.navy, opacity: 0.08 * o}} />;
};

const Hand: React.FC<{x: number; y: number; k: number; rot?: number; open?: number}> = ({x, y, k, rot = 0, open = 0}) => (
  <svg width={420} height={420} viewBox="-210 -210 420 420" style={{position: 'absolute', left: x - 210, top: y - 210, transform: `rotate(${rot}deg) scale(${k})`, overflow: 'visible'}}>
    <g stroke={T.navy} strokeWidth={8} strokeLinejoin="round" fill={T.skin}>
      <rect x={-20} y={60} width={150} height={260} rx={60} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={-120 - open * 30} y={-40 + i * 52} width={170 + open * 40} height={46} rx={23} transform={`rotate(${-open * (10 - i * 6)} 40 ${-20 + i * 52})`} />
      ))}
      <ellipse cx={60} cy={110} rx={95} ry={110} />
    </g>
  </svg>
);

const Smoke: React.FC<{t: number}> = ({t}) => {
  if (t < BD.launch || t > BD.house + 0.4) return null;
  return (
    <>
      {Array.from({length: 9}).map((_, i) => {
        const k = prog(t, BD.launch + i * 0.05, BD.launch + 0.7 + i * 0.05, easeOut);
        if (k <= 0) return null;
        const c = [T.sky, T.sun, T.coral, T.mint][i % 4];
        const x = ORIGIN.x + (rand(i) - 0.5) * 360 * k;
        const y = ORIGIN.y + 40 - 60 * k + rand(i + 4) * 30;
        const r = 30 + 60 * k;
        return <div key={i} style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: c, border: `5px solid ${T.navy}`, opacity: 1 - k}} />;
      })}
    </>
  );
};

const NameTag: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  if (t < BD.name || t > BD.box + 0.5) return null;
  const letters = ['آ', 'د', 'م'];
  const out = prog(t, BD.box, BD.box + 0.35, easeIn);
  return (
    <div dir="rtl" style={{position: 'absolute', left: 0, right: 0, top: 1420, display: 'flex', justifyContent: 'center', gap: 18, opacity: 1 - out}}>
      {letters.map((l, i) => {
        const k = sp(frame, BD.name + i * 0.12, {damping: 9, stiffness: 200, mass: 0.7});
        return (
          <div key={i} style={{width: 130, height: 130, borderRadius: 26, background: [T.coral, T.sky, T.mint][i], border: `6px solid ${T.navy}`, boxShadow: `0 10px 0 ${T.navy}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 92, color: T.navy, transform: `translateY(${(1 - k) * -300}px) rotate(${(1 - k) * 30}deg)`}}>
            {l}
          </div>
        );
      })}
    </div>
  );
};

/** The «شطّور» toy box: an isometric crate with its name on the front. */
const Box: React.FC<{t: number; frame: number; cx: number; cy: number; size: number; lid: number; label?: boolean}> = ({cx, cy, size, lid, label = true}) => {
  const o = {x: cx, y: cy};
  const s = size;
  const P = (x: number, y: number, z: number) => {
    const p = iso(x, y, z, s, o);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  };
  const lz = 2 + (1 - lid) * 1.6;
  return (
    <svg width={W} height={1920} style={{position: 'absolute', overflow: 'visible'}}>
      <g stroke={T.navy} strokeWidth={6} strokeLinejoin="round">
        <polygon points={[P(-1.5, -1.5, 0), P(1.5, -1.5, 0), P(1.5, 1.5, 0), P(-1.5, 1.5, 0)].join(' ')} fill={shade(T.navy, -0.2)} />
        <polygon points={[P(1.5, -1.5, 0), P(1.5, 1.5, 0), P(1.5, 1.5, 2), P(1.5, -1.5, 2)].join(' ')} fill={shade(T.sky, -0.15)} />
        <polygon points={[P(-1.5, 1.5, 0), P(1.5, 1.5, 0), P(1.5, 1.5, 2), P(-1.5, 1.5, 2)].join(' ')} fill={T.sky} />
        <polygon points={[P(-1.6, -1.6, lz), P(1.6, -1.6, lz), P(1.6, 1.6, lz), P(-1.6, 1.6, lz)].join(' ')} fill={shade(T.coral, 0.15)} opacity={clamp01(lid * 4)} />
        <polygon points={[P(1.6, -1.6, lz - 0.3), P(1.6, 1.6, lz - 0.3), P(1.6, 1.6, lz), P(1.6, -1.6, lz)].join(' ')} fill={shade(T.coral, -0.15)} opacity={clamp01(lid * 4)} />
        <polygon points={[P(-1.6, 1.6, lz - 0.3), P(1.6, 1.6, lz - 0.3), P(1.6, 1.6, lz), P(-1.6, 1.6, lz)].join(' ')} fill={T.coral} opacity={clamp01(lid * 4)} />
      </g>

    </svg>
  );
};

/** Text laid on the box's front-left face: that face runs along the X axis (30° down to the right). */
const BoxLabel: React.FC<{cx: number; cy: number; size: number}> = ({cx, cy, size}) => {
  const tl = iso(-1.5, 1.5, 2, size, {x: cx, y: cy});
  return (
    <div style={{position: 'absolute', left: tl.x, top: tl.y, width: 3 * size, height: 2 * size, transformOrigin: '0 0', transform: 'matrix(0.866, 0.5, 0, 1, 0, 0)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div dir="rtl" style={{fontFamily: FONT, fontWeight: 800, fontSize: size * 0.85, color: T.navy, lineHeight: 1}}>شطّور</div>
    </div>
  );
};

const Sparkles: React.FC<{t: number; from: number; to: number; cx: number; cy: number; r: number}> = ({t, from, to, cx, cy, r}) => {
  const o = clamp01((t - from) / 0.2) * (1 - clamp01((t - to + 0.3) / 0.3));
  if (o <= 0) return null;
  return (
    <>
      {Array.from({length: 10}).map((_, i) => {
        const ph = ((t - from) * 0.9 + rand(i)) % 1;
        const a = rand(i + 2) * Math.PI * 2;
        const rr = r * (0.7 + ph * 0.5);
        const sz = 16 + rand(i + 5) * 18;
        return <div key={i} style={{position: 'absolute', left: cx + Math.cos(a) * rr - sz / 2, top: cy + Math.sin(a) * rr * 0.8 - sz / 2, width: sz, height: sz, borderRadius: i % 2 ? '50%' : 5, background: [T.sun, T.coral, T.sky, T.mint][i % 4], border: `3px solid ${T.navy}`, opacity: o * (1 - ph), transform: `rotate(${ph * 180}deg) scale(${1 - ph * 0.4})`}} />;
      })}
    </>
  );
};

/* ---------------- why: three cards, big pieces, happy colours ---------------- */

const CardIcon: React.FC<{kind: number}> = ({kind}) => (
  <svg width={150} height={150} viewBox="0 0 150 150">
    <g stroke={T.navy} strokeWidth={7} strokeLinejoin="round">
      {kind === 0 ? (
        <>
          <circle cx={42} cy={48} r={28} fill={T.sky} />
          <polygon points="108,20 138,72 78,72" fill={T.coral} />
          <rect x={48} y={88} width={54} height={50} rx={8} fill={T.sun} />
        </>
      ) : null}
      {kind === 1 ? (
        <>
          <circle cx={75} cy={75} r={62} fill={T.white} />
          <circle cx={75} cy={75} r={42} fill={T.coral} />
          <circle cx={75} cy={75} r={20} fill={T.white} />
          <circle cx={75} cy={75} r={6} fill={T.navy} />
        </>
      ) : null}
      {kind === 2 ? (
        <path d="M 30 40 H 60 A 15 15 0 1 1 90 40 H 120 V 70 A 15 15 0 1 1 120 100 V 130 H 30 Z" fill={T.mint} />
      ) : null}
    </g>
  </svg>
);

const Why: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  if (t < WY.cards[0] - 0.1 || t > WY.cta + 0.3) return null;
  const cardsOut = prog(t, WY.big - 0.25, WY.big + 0.1, easeIn);
  const labels = ['أشكال وألوان', 'تركيز', 'حل مشكلات'];
  const bigK = sp(frame, WY.big, {damping: 10, stiffness: 160});
  const bigOut = prog(t, WY.colors - 0.25, WY.colors + 0.05, easeIn);
  const handK = sp(frame, WY.big + 0.35);
  const rowOut = prog(t, WY.cta - 0.25, WY.cta + 0.05, easeIn);
  return (
    <>
      {cardsOut < 1 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 640, display: 'flex', justifyContent: 'center', gap: 36, flexDirection: 'row-reverse', perspective: 1200, opacity: 1 - cardsOut, transform: `translateY(${cardsOut * -80}px)`}}>
          {WY.cards.map((at, i) => {
            const k = sp(frame, at, {damping: 12, stiffness: 150});
            return (
              <div key={i} style={{width: 280, height: 380, borderRadius: 34, background: T.white, border: `7px solid ${T.navy}`, boxShadow: `0 14px 0 ${T.navy}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, transform: `rotateY(${(1 - k) * 90}deg) translateY(${(1 - k) * 60}px)`, opacity: k > 0.02 ? 1 : 0}}>
                <CardIcon kind={i} />
                <div dir="rtl" style={{fontFamily: FONT, fontWeight: 800, fontSize: 42, color: T.navy}}>{labels[i]}</div>
              </div>
            );
          })}
        </div>
      ) : null}
      {t >= WY.big && bigOut < 1 ? (
        <div style={{opacity: 1 - bigOut}}>
          <svg width={W} height={1920} style={{position: 'absolute'}}>
            {cubeFaces(0, 0, 0, T.coral, 230 * bigK, 1, {x: 430, y: 1080}).faces.map((fc, k) => (
              <polygon key={k} points={fc.pts} fill={fc.fill} stroke={T.navy} strokeWidth={8} strokeLinejoin="round" />
            ))}
          </svg>
          <Hand x={820} y={1020} k={0.55 * handK} rot={-20} open={1} />
        </div>
      ) : null}
      {t >= WY.colors - 0.05 && rowOut < 1 ? (
        <svg width={W} height={1920} style={{position: 'absolute', opacity: 1 - rowOut}}>
          {[T.sky, T.sun, T.coral, T.mint, T.white].map((c, i) => {
            const k = sp(frame, WY.colors + i * 0.08, {damping: 9, stiffness: 200, mass: 0.7});
            const hop = Math.max(0, Math.sin((t - WY.colors - 0.4 - i * 0.12) * 8)) * 0.6 * (t > WY.colors + 0.4 ? 1 : 0);
            return (
              <g key={i}>
                {cubeFaces(i * 1.25 - 2.5, -i * 1.25 + 2.5, hop + (1 - k) * 8, c, 95, 1, {x: 540, y: 1000}).faces.map((fc, j) => (
                  <polygon key={j} points={fc.pts} fill={fc.fill} stroke={T.navy} strokeWidth={5} strokeLinejoin="round" />
                ))}
              </g>
            );
          })}
        </svg>
      ) : null}
      <Sparkles t={t} from={WY.colors + 0.3} to={WY.cta} cx={540} cy={1000} r={460} />
    </>
  );
};

const Wordmark: React.FC<{k: number}> = ({k}) => (
  <div dir="rtl" style={{display: 'flex', fontFamily: FONT, fontWeight: 800, fontSize: 190, lineHeight: 1.2, transform: `scale(${k})`, filter: `drop-shadow(0 10px 0 ${T.navy})`}}>
    {['ش', 'طّ', 'و', 'ر'].map((l, i) => (
      <span key={i} style={{color: [T.coral, T.sky, T.sun, T.mint][i], WebkitTextStroke: `8px ${T.navy}`, paintOrder: 'stroke fill'}}>{l}</span>
    ))}
  </div>
);

const Pack: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  // the box: appears for the blocks, spins, steps aside, returns for the order
  const inK = sp(frame, BD.box - 0.15, {damping: 14, stiffness: 130});
  const lid = sp(frame, BD.lid, {damping: 10, stiffness: 180});
  const away = prog(t, WY.cards[0] - 0.3, WY.cards[0], easeIn);
  const back = sp(frame, WY.cta, {damping: 13, stiffness: 120});
  const visible = (t >= BD.box - 0.15 && away < 1) || t >= WY.cta;
  if (!visible || t > FL.suck + 0.4) return null;
  const pressed = t >= WY.order ? Math.sin(Math.PI * prog(t, WY.order, WY.order + 0.3)) : 0;
  const bob = Math.sin(t * 3) * 10;
  const k = t >= WY.cta ? back : inK * (1 - away);
  const cy = t >= WY.cta ? 1180 : 1200;
  const suck = prog(t, FL.suck, FL.suck + 0.35, easeIn);
  const markK = sp(frame, BD.spin, {damping: 9, stiffness: 180});
  return (
    <div style={{position: 'absolute', inset: 0, transform: `scale(${1 - suck})`, transformOrigin: '540px 1100px'}}>
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${bob}px) scale(${k})`, transformOrigin: `540px ${cy}px`}}>
        <div style={{position: 'absolute', left: 540 - 260, top: cy + 70, width: 520, height: 90, borderRadius: '50%', background: T.navy, opacity: 0.08}} />
        <Box t={t} frame={frame} cx={540} cy={cy} size={115} lid={t >= WY.cta ? 1 : lid} />
        <BoxLabel cx={540} cy={cy} size={115} />
      </div>
      {t >= BD.spin && t < WY.cards[0] ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 380, display: 'flex', justifyContent: 'center', opacity: 1 - away}}><Wordmark k={markK} /></div>
      ) : null}
      <Sparkles t={t} from={BD.lid + 0.1} to={WY.cards[0]} cx={540} cy={1000} r={380} />
      {t >= WY.cta ? (
        <>
          <div style={{position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', justifyContent: 'center'}}><Wordmark k={sp(frame, WY.cta + 0.1, {damping: 9, stiffness: 180})} /></div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 1480, display: 'flex', justifyContent: 'center'}}>
            <div dir="rtl" style={{padding: '26px 90px', borderRadius: 999, background: T.navy, color: T.white, fontFamily: FONT, fontWeight: 800, fontSize: 76, boxShadow: `0 ${14 - 10 * pressed}px 0 ${shade(T.navy, -0.4)}`, transform: `translateY(${10 * pressed}px) scale(${sp(frame, WY.cta + 0.4, {damping: 10, stiffness: 180})})`}}>
              اطلب دلوقتي
            </div>
          </div>
          <div dir="rtl" style={{position: 'absolute', left: 0, right: 0, top: 1660, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 64, color: T.navy, opacity: prog(t, WY.order, WY.order + 0.3)}}>وخلّي اللعب يعلّم</div>
          <div dir="rtl" style={{position: 'absolute', left: 0, right: 0, top: 1790, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 32, color: shade(T.navy, 0.35), opacity: prog(t, WY.cta + 0.5, WY.cta + 0.9)}}>«شطّور» براند تخيلي · إعلان للعرض</div>
          <Sparkles t={t} from={WY.order} to={FL.suck} cx={540} cy={1500} r={330} />
        </>
      ) : null}
    </div>
  );
};

/* ---------------- the flip into إبداع بيتحرك ---------------- */

const Flip: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  if (t < FL.suck) return null;
  const cubeK = sp(frame, FL.suck + 0.2, {damping: 10, stiffness: 200});
  const reveal = prog(t, FL.dark, FL.dark + 0.5, easeInOut);
  const toDot = prog(t, FL.dark + 0.1, FL.dark + 0.45, easeInOut);
  const dotOut = 0;
  const toPeriod = sp(frame, FL.line + 0.55, {damping: 12, stiffness: 120});
  const ask = sp(frame, FL.ask, {damping: 14, stiffness: 140});
  const wa = sp(frame, FL.wa, {damping: 15, stiffness: 150});
  const z = 0.62;
  const ring = clamp01((t - FL.hit) / 0.8);
  return (
    <>
      <div style={{position: 'absolute', left: 540 - 1500 * reveal, top: 1060 - 1500 * reveal, width: 3000 * reveal, height: 3000 * reveal, borderRadius: '50%', background: BP.bg}} />
      {toDot < 1 ? (
        <svg width={W} height={1920} style={{position: 'absolute'}}>
          {cubeFaces(0, 0, 0, T.sun, 110 * cubeK * (1 - toDot), 1, {x: 540, y: 1120}).faces.map((fc, k) => (
            <polygon key={k} points={fc.pts} fill={fc.fill} stroke={T.navy} strokeWidth={6} strokeLinejoin="round" />
          ))}
        </svg>
      ) : null}
      {toDot > 0 && dotOut < 1 ? (
        // the cube became a dot; on «حتى لو لسه نقطة» it flies to the end of the line and becomes its full stop
        <div style={{position: 'absolute', left: lerp(540, PERIOD.x, toPeriod) - 36, top: lerp(1060, PERIOD.y, toPeriod) - 36 - Math.sin(Math.PI * toPeriod) * 160, width: 72, height: 72, borderRadius: '50%', background: BP.orange, transform: `scale(${toDot * (1 - dotOut) * lerp(1, 0.7, toPeriod) * (1 + 0.05 * Math.sin(t * 3))})`}} />
      ) : null}
      {t >= FL.hit && ring < 1 ? (
        <div style={{position: 'absolute', left: 540 - 1200 * ring, top: 360 - 1200 * ring, width: 2400 * ring, height: 2400 * ring, borderRadius: '50%', border: `${40 * (1 - ring) + 2}px solid ${BP.orange}`, opacity: 1 - ring}} />
      ) : null}
      {t >= FL.sting ? (
        <div style={{position: 'absolute', left: 540 - (1080 * z) / 2, top: 360 - (699 * z) / 2, width: 1080 * z, height: 699 * z, mixBlendMode: 'lighten'}}>
          <Sequence from={Math.round(FL.sting * FPS)} durationInFrames={Math.round(3.2 * FPS)} layout="none">
            <OffthreadVideo src={staticFile('ibdaa-logo-sting.mp4')} muted style={{width: '100%', height: '100%'}} />
          </Sequence>
          {t >= FL.sting + 3.2 - 1 / FPS ? <Img src={staticFile('ibdaa-logo-dark.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} /> : null}
        </div>
      ) : null}
      {t >= FL.ask ? (
        <>
          <Words text="ابعتلنا فكرتك…" t={t} start={FL.ask} size={104} style={{position: 'absolute', top: 640, left: 60, right: 60}} />
          <Words text="حتى لو لسه نقطة" t={t} start={FL.line} size={104} style={{position: 'absolute', top: 800, left: 60, right: 60}} />
        </>
      ) : null}
      {t >= FL.wa ? (
        <div dir="rtl" style={{position: 'absolute', left: 90, width: 900, top: 1060, height: 230, borderRadius: 56, background: BP.teal, color: BP.onTeal, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30, transform: `translateY(${(1 - wa) * 120}px) scale(${0.6 + 0.4 * wa})`, opacity: clamp01(wa * 2)}}>
          <svg width={92} height={92} viewBox="0 0 58 58"><path d="M 29 6 A 23 23 0 1 1 13 45 L 7 52 L 9 40 A 23 23 0 0 1 29 6 Z" fill="none" stroke={BP.onTeal} strokeWidth={5} strokeLinejoin="round" /></svg>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1}}>
            <span style={{fontFamily: BF.ar, fontWeight: 700, fontSize: 44}}>واتساب</span>
            <span dir="ltr" style={{fontFamily: BF.display, fontSize: 100, lineHeight: 1.15}}>01130808848</span>
          </div>
        </div>
      ) : null}
      {t >= FL.wa + 0.5 ? (
        <div dir="rtl" style={{position: 'absolute', top: 1360, left: 0, right: 0, textAlign: 'center', fontFamily: BF.ar, fontWeight: 700, fontSize: 52, color: BP.muted, opacity: prog(t, FL.wa + 0.5, FL.wa + 1)}}>
          إعلان زي ده… لمنتجك
        </div>
      ) : null}
      {t >= FL.hit + 0.6 ? (
        <div dir="rtl" style={{position: 'absolute', top: 1790, left: 0, right: 0, textAlign: 'center', fontFamily: BF.ar, fontWeight: 500, fontSize: 32, color: BP.muted, opacity: prog(t, FL.hit + 0.6, FL.hit + 1.2)}}>
          «شطّور» براند تخيلي · إعلان للعرض من إبداع بيتحرك
        </div>
      ) : null}
    </>
  );
};

/* ---------------- captions ---------------- */

const Captions: React.FC<{t: number; frame: number}> = ({t, frame}) => (
  <>
    {TL.captions.map((c, i) => {
      if (t < c.at - 0.05 || t > c.out + 0.4) return null;
      const k = sp(frame, c.at, {damping: 11, stiffness: 190, mass: 0.7});
      const o = 1 - prog(t, c.out, c.out + 0.3, easeIn);
      const top = c.kind === 'top' ? 260 : c.kind === 'word' ? 1500 : 1600;
      const size = c.kind === 'word' ? 150 : c.kind === 'top' ? 96 : 78;
      const color = c.kind === 'word' ? T.coral : T.navy;
      return (
        <div key={i} dir="rtl" style={{position: 'absolute', left: 40, right: 40, top, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.25, color, opacity: o * clamp01(k * 2), transform: `translateY(${(1 - k) * 40}px) scale(${0.8 + 0.2 * k})`, WebkitTextStroke: c.kind === 'word' ? `6px ${T.navy}` : undefined, paintOrder: 'stroke fill'}}>
          {c.text}
        </div>
      );
    })}
  </>
);

export const ToyVideo: React.FC = () => {
  useBrandFonts();
  useToyFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const handIn = sp(frame, HK.hand, {damping: 14, stiffness: 120});
  const handOut = prog(t, HK.rain - 0.1, HK.rain + 0.3, easeIn);
  const cube0 = iso(0.5, 0.5, 0.5);
  return (
    <AbsoluteFill style={{background: T.bg}}>
      <AbsoluteFill style={{backgroundImage: `radial-gradient(rgba(30,42,90,0.08) 3px, transparent 3.5px)`, backgroundSize: '56px 56px', backgroundPosition: `${t * 6}px ${-t * 10}px`}} />
      <Shadow t={t} />
      <Smoke t={t} />
      <Blocks t={t} frame={frame} />
      {t >= HK.hand && handOut < 1 ? <Hand x={cube0.x + 150 + handOut * 500} y={cube0.y - 10 - 40 * sp(frame, HK.hand + 0.35) + handOut * 200} k={handIn} rot={-12} /> : null}
      <NameTag t={t} frame={frame} />
      <Pack t={t} frame={frame} />
      <Why t={t} frame={frame} />
      <Captions t={t} frame={frame} />
      <Flip t={t} frame={frame} />
      <Grain frame={frame} opacity={0.05} />
    </AbsoluteFill>
  );
};

export const TOY_DURATION = TL.duration;
export const TOY_FPS = FPS;
