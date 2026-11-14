import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from '../components/primitives';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog, rand} from '../lib';
import {Backdrop, Label, useBrandFonts, Words} from '../promo/kit';
import {arNum, ELASTIC, F, HEAVY, P, POP, R, sp} from '../promo/theme';
import * as G from './geom';
import timeline from './timeline.json';

const TL = timeline;
const FPS = TL.fps;
const {hook: H, story: S, services: V, brand: B, cta: C} = TL;
const W = 1080;

type Key = {at: number; dur: number; to: G.Pt[]; ease?: (x: number) => number};
const KEYS: Key[] = [
  {at: H.launch, dur: 0.3, to: G.LINE, ease: easeOut},
  {at: S.cup, dur: 0.7, to: G.CUP},
  {at: S.ecg, dur: 0.4, to: G.ECG},
  {at: S.tag, dur: 0.42, to: G.TAG},
  {at: S.phone, dur: 0.45, to: G.PHONE},
  {at: S.zoom, dur: 0.32, to: G.SCREEN, ease: easeIn},
  {at: S.under, dur: 0.45, to: G.UNDER, ease: easeOut},
  {at: S.spiral, dur: 0.8, to: G.SPIRAL},
  {at: S.collapse, dur: 0.35, to: G.DOT, ease: easeIn},
  {at: V.square, dur: 0.4, to: G.SQUARE, ease: easeOut},
  {at: V.polaroid, dur: 0.35, to: G.POLAROID},
  {at: V.laptop, dur: 0.4, to: G.LAPTOP},
  {at: V.phone, dur: 0.4, to: G.PHONE_TALL},
  {at: V.wide, dur: 0.4, to: G.WIDE},
  {at: V.page, dur: 0.35, to: G.PAGE},
  {at: V.mic, dur: 0.35, to: G.MIC},
  {at: V.wave, dur: 0.35, to: G.WAVE},
  {at: V.triple, dur: 0.45, to: G.TRIPLE},
  {at: V.implode, dur: 0.35, to: G.DOT, ease: easeIn},
];

const lineAt = (t: number) => {
  let pts = G.DOT;
  for (const k of KEYS) {
    const e = prog(t, k.at, k.at + k.dur, k.ease ?? easeInOut);
    if (e <= 0) break;
    pts = G.mix(pts, k.to, e);
  }
  return pts;
};

/** A window [a, b) with soft edges, for things that live inside one shape. */
const live = (t: number, a: number, b: number, fin = 0.25, fout = 0.2) =>
  prog(t, a, a + fin, easeOut) * (1 - prog(t, b - fout, b, easeIn));

/* ---------------- the line ---------------- */

const TheLine: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  let pts = lineAt(t);
  // the sound wave is alive while it is a wave
  const waving = live(t, V.wave + 0.3, V.triple + 0.1, 0.2, 0.15);
  if (waving > 0) {
    pts = pts.map(([x, y], i) => [x, y + Math.sin(i * 0.35 + t * 14) * 40 * waving * Math.sin((Math.PI * i) / G.N)]);
  }
  // groups: the tag swings on its hole, the spiral turns
  const swingT = t - (S.tag + 0.42);
  const swing = swingT > 0 ? 14 * Math.sin(swingT * 7) * Math.exp(-swingT * 1.8) * (1 - prog(t, S.phone, S.phone + 0.2)) : 0;
  const turn = 360 * prog(t, S.spiral, S.collapse + 0.35, easeInOut); // whole turns only: the frames after it must stand straight
  const lineOn = t >= H.launch - 0.02 && !(t > S.collapse + 0.4 && t < V.square) && !(t > V.implode + 0.36);
  const fadeForGallery = 1 - 0.65 * live(t, V.gallery + 0.2, V.implode + 0.1, 0.3, 0.1);
  void frame;
  return lineOn ? (
    <svg width={W} height={1920} style={{position: 'absolute', overflow: 'visible', opacity: fadeForGallery}}>
      <g transform={`rotate(${swing} ${G.TAG_HOLE[0]} ${G.TAG_HOLE[1]}) rotate(${turn} ${G.CX} ${G.CY})`}>
        <path d={G.toPath(pts)} fill="none" stroke={P.orange} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  ) : null;
};

/* ---------------- the dot ---------------- */

const TheDot: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  // hook: appears, breathes, squashes, launches
  const born = sp(frame, H.dot, POP);
  const squash = prog(t, H.squash, H.launch, easeIn) * (t < H.launch ? 1 : 0);
  const gone = prog(t, H.launch, H.launch + 0.12);
  let r = 36 * born * (1 + 0.04 * Math.sin(t * 2.4)) * (1 - gone);
  let sx = 1 + 0.45 * squash;
  let sy = 1 - 0.4 * squash;
  // back to one dot after the spiral, then three lines come out of it
  if (t >= S.collapse + 0.3 && t < V.square + 0.1) {
    r = 36 * sp(frame, S.collapse + 0.3, POP) * (1 - prog(t, S.split, S.split + 0.25)) * (1 - prog(t, V.square - 0.05, V.square + 0.1));
    sx = sy = 1;
  }
  // back to one dot after the gallery, then into the logo
  if (t >= V.dot - 0.05) {
    r = 36 * sp(frame, V.dot, POP) * (1 - prog(t, B.sting, B.sting + 0.18, easeIn));
    sx = sy = 1;
  }
  if (r <= 0.5) return null;
  return (
    <div style={{position: 'absolute', left: G.CX - r, top: G.CY - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: P.orange, transform: `scale(${sx}, ${sy})`, transformOrigin: '50% 100%'}} />
  );
};

/** The dot splits into the logo's three speed lines: "we make you…" */
const Split: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  if (t < S.split || t > V.square + 0.2) return null;
  const back = prog(t, V.square - 0.25, V.square + 0.05, easeIn);
  return (
    <>
      {[{y: -70, c: P.teal, w: 300}, {y: 0, c: P.orange, w: 360}, {y: 70, c: P.teal, w: 300}].map((l, i) => {
        const k = sp(frame, S.split + i * 0.06, {damping: 13, stiffness: 170, mass: 0.6}) * (1 - back);
        const w = l.w * k;
        return <div key={i} style={{position: 'absolute', left: G.CX - w / 2, top: G.CY + l.y - 15, width: Math.max(30 * (1 - back), w), height: 30, borderRadius: 15, background: l.c, opacity: 1 - back}} />;
      })}
    </>
  );
};

/* ---------------- what lives inside each shape ---------------- */

const Steam: React.FC<{t: number}> = ({t}) => {
  const o = live(t, S.steam, S.ecg + 0.1, 0.1, 0.25);
  if (o <= 0) return null;
  const draw = prog(t, S.steam, S.steam + 0.5, easeOut);
  return (
    <svg width={W} height={1920} style={{position: 'absolute', opacity: o}}>
      {[470, 540, 610].map((x, i) => {
        const d = Array.from({length: 20}, (_, j) => {
          const y = 760 - j * 9;
          return `${j ? 'L' : 'M'}${x + Math.sin(j * 0.5 + t * 5 + i) * 16} ${y}`;
        }).join(' ');
        return <path key={i} d={d} fill="none" stroke={P.teal} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw} 1`} />;
      })}
    </svg>
  );
};

const Pulse: React.FC<{t: number}> = ({t}) => {
  if (t < S.ecg + 0.4 || t > S.tag + 0.1) return null;
  return (
    <>
      {S.beats.map((b, i) => {
        const k = prog(t, b, b + 0.5, (x) => x);
        if (k <= 0 || k >= 1) return null;
        const p = G.ECG[Math.min(G.N - 1, Math.floor(k * (G.N - 1)))];
        return <div key={i} style={{position: 'absolute', left: p[0] - 22, top: p[1] - 22, width: 44, height: 44, borderRadius: '50%', background: P.teal, boxShadow: `0 0 30px ${P.teal}`}} />;
      })}
    </>
  );
};

const TagText: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const o = live(t, S.tagText, S.phone + 0.1, 0.05, 0.2);
  if (o <= 0) return null;
  const k = sp(frame, S.tagText, ELASTIC);
  const swingT = t - (S.tag + 0.42);
  const swing = swingT > 0 ? 14 * Math.sin(swingT * 7) * Math.exp(-swingT * 1.8) : 0;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: 1920, transform: `rotate(${swing}deg)`, transformOrigin: `${G.TAG_HOLE[0]}px ${G.TAG_HOLE[1]}px`, opacity: o}}>
      <div dir="rtl" style={{position: 'absolute', left: 400, width: 380, top: 770, textAlign: 'center', fontFamily: F.display, color: P.ink, transform: `scale(${k})`}}>
        <div style={{fontSize: 70, lineHeight: '90px'}}>خصم</div>
        <div style={{fontSize: 130, lineHeight: '150px', color: P.orange}}>٣٠٪</div>
      </div>
    </div>
  );
};

const Notifs: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const o = live(t, S.notifs[0], S.zoom + 0.1, 0.05, 0.15);
  if (o <= 0) return null;
  return (
    <div style={{opacity: o}}>
      {S.notifs.map((n, i) => {
        const k = sp(frame, n, POP);
        return (
          <div key={i} style={{position: 'absolute', left: 405, width: 270, top: 690 + i * 105, height: 84, borderRadius: R.lg, background: P.surface, border: `3px solid ${P.line}`, transform: `scale(${k}) translateY(${(1 - k) * -40}px)`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px', boxSizing: 'border-box', flexDirection: 'row-reverse'}}>
            <div style={{width: 40, height: 40, borderRadius: 20, background: i === 1 ? P.orange : P.teal}} />
            <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end'}}>
              <div style={{width: '80%', height: 12, borderRadius: 6, background: P.ink}} />
              <div style={{width: '55%', height: 10, borderRadius: 5, background: P.muted}} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Idea: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const o = 1 - prog(t, S.spiral, S.spiral + 0.3, easeIn);
  if (t < S.word1 || o <= 0) return null;
  const write = prog(t, S.word1, S.word1 + 0.55, easeInOut);
  const k2 = sp(frame, S.word2, ELASTIC);
  const wig = t > S.word2 ? Math.sin((t - S.word2) * 18) * 6 * Math.exp(-(t - S.word2) * 3) : 0;
  return (
    <div style={{opacity: o, transform: `scale(${1 - 0.3 * (1 - o)})`, transformOrigin: '50% 50%', position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', right: 1080 - 900, top: 760, width: 720 * write, overflow: 'hidden', height: 340}}>
        <div dir="rtl" style={{position: 'absolute', right: 0, width: 720, textAlign: 'center', fontFamily: F.display, fontSize: 280, lineHeight: '340px', color: P.ink}}>فكرتك</div>
      </div>
      <div dir="rtl" style={{position: 'absolute', left: 0, right: 0, top: 1120, textAlign: 'center', fontFamily: F.display, fontSize: 210, lineHeight: 1.2, color: P.orange, transform: `scale(${k2}) skewX(${wig}deg)`}}>
        بتتحرك.
      </div>
    </div>
  );
};

const ORBIT = [G.CUP, G.TAG, G.PHONE, G.ECG];
const Orbit: React.FC<{t: number}> = ({t}) => {
  const o = live(t, S.spiral + 0.15, S.collapse + 0.25, 0.3, 0.35);
  if (o <= 0) return null;
  const suck = prog(t, S.collapse - 0.15, S.collapse + 0.25, easeIn);
  return (
    <svg width={W} height={1920} style={{position: 'absolute', opacity: o}}>
      {ORBIT.map((shape, i) => {
        const a = t * 2.4 + (i * Math.PI) / 2;
        const rr = 360 * (1 - suck);
        const cx = G.CX + Math.cos(a) * rr;
        const cy = G.CY + Math.sin(a) * rr;
        return <path key={i} d={G.toPath(G.shrink(shape, 0.24 * (1 - suck * 0.8), cx, cy))} fill="none" stroke={P.teal} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />;
      })}
    </svg>
  );
};

const Box: React.FC<{x0: number; y0: number; x1: number; y1: number; o: number; r?: number; rot?: number; children: React.ReactNode}> = ({x0, y0, x1, y1, o, r = 24, rot = 0, children}) =>
  o > 0 ? (
    <div style={{position: 'absolute', left: x0 + 14, top: y0 + 14, width: x1 - x0 - 28, height: y1 - y0 - 28, borderRadius: r, overflow: 'hidden', opacity: o, transform: `rotate(${rot}deg)`}}>{children}</div>
  ) : null;

const Photo: React.FC<{name: string; style?: React.CSSProperties}> = ({name, style}) => (
  <Img src={staticFile(`photos/${name}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', ...style}} />
);

const Services: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const zoomIn = (at: number) => 1.12 - 0.12 * prog(t, at, at + 0.6, easeOut);
  // 1. logo in motion
  const logoO = live(t, V.square + 0.3, V.polaroid + 0.05);
  const ring = prog(t, V.square + 0.35, V.square + 0.9, easeInOut);
  const dotK = sp(frame, V.square + 0.8, POP);
  // 2. product
  const polO = live(t, V.polaroid + 0.3, V.laptop + 0.05);
  const badge = sp(frame, V.polaroid + 0.6, POP);
  // 3. explainer
  const lapO = live(t, V.laptop + 0.35, V.phone + 0.05);
  // 4. reels
  const reelO = live(t, V.phone + 0.35, V.wide + 0.05);
  const reelK = Math.max(0, t - (V.phone + 0.4)) / 0.42;
  const reel = Math.floor(reelK);
  const reelF = easeInOut(clamp01((reelK - reel) * 2.2));
  const REELS = ['coffee-1', 'shop-2', 'gym-2', 'product-1', 'clinic-3'];
  // 5. infographic
  const infO = live(t, V.wide + 0.35, V.page + 0.05);
  const count = Math.round(3200 * prog(t, V.wide + 0.5, V.wide + 1.8, easeOut));
  // 6. script, sound, effects
  const pageO = live(t, V.page + 0.3, V.mic + 0.05);
  const micO = live(t, V.mic + 0.3, V.wave + 0.05);
  const fxO = live(t, V.wave + 0.3, V.triple + 0.05);
  // 7. every size
  const sizesO = 1 - prog(t, V.implode - 0.05, V.implode + 0.25, easeIn);
  return (
    <>
      <Box x0={330} y0={690} x1={750} y1={1110} o={logoO}>
        <svg width={392} height={392} viewBox="-196 -196 392 392" style={{transform: `scale(${zoomIn(V.square + 0.3)}) rotate(${(t - V.square) * 30}deg)`}}>
          <circle r={110} fill="none" stroke={P.ink} strokeWidth={26} strokeLinecap="round" pathLength={1} strokeDasharray={`${ring} 1`} transform="rotate(-90)" />
          <path d="M -70 20 A 70 70 0 0 0 70 20" fill="none" stroke={P.teal} strokeWidth={26} strokeLinecap="round" pathLength={1} strokeDasharray={`${ring} 1`} />
          <circle cx={Math.cos(t * 3) * 110} cy={Math.sin(t * 3) * 110} r={30 * dotK} fill={P.orange} />
        </svg>
      </Box>
      <Box x0={320} y0={610} x1={760} y1={1170} o={polO} r={10} rot={-6}>
        <Photo name="product-3" style={{transform: `scale(${zoomIn(V.polaroid + 0.3)})`}} />
        <div dir="rtl" style={{position: 'absolute', right: 24, top: 24, padding: '10px 28px', borderRadius: R.pill, background: P.teal, color: P.onTeal, fontFamily: F.ar, fontWeight: 700, fontSize: 44, transform: `scale(${badge})`}}>جديد</div>
      </Box>
      <Box x0={230} y0={680} x1={850} y1={1070} o={lapO} r={12}>
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', flexDirection: 'row-reverse'}}>
          {['١', '٢', '٣'].map((s, i) => {
            const k = sp(frame, V.laptop + 0.45 + i * 0.35, POP);
            return (
              <React.Fragment key={i}>
                {i > 0 ? <div style={{width: 60 * clamp01(k * 1.5), height: 8, borderRadius: 4, background: P.muted}} /> : null}
                <div style={{width: 120, height: 120, borderRadius: 60, background: i === 2 ? P.orange : P.surface, border: `6px solid ${i === 2 ? P.orange : P.teal}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontSize: 70, color: i === 2 ? P.onOrange : P.ink, transform: `scale(${k})`}}>{s}</div>
              </React.Fragment>
            );
          })}
        </div>
      </Box>
      <Box x0={380} y0={560} x1={700} y1={1240} o={reelO} r={36}>
        {REELS.map((n, i) => {
          const pos = i - reel - reelF;
          if (pos < -1.05 || pos > 1.05) return null;
          return (
            <div key={n} style={{position: 'absolute', inset: 0, transform: `translateY(${pos * 100}%)`}}>
              <Photo name={n} />
            </div>
          );
        })}
        <div style={{position: 'absolute', right: 18, bottom: 120, width: 54, height: 54, borderRadius: 27, background: P.orange, transform: `scale(${1 + 0.25 * Math.exp(-((reelK % 1) * 6))})`}} />
      </Box>
      <Box x0={130} y0={690} x1={950} y1={1130} o={infO} r={20}>
        <div dir="rtl" style={{position: 'absolute', right: 40, top: 30, fontFamily: F.display, fontSize: 130, lineHeight: 1.2, color: P.ink}}>{arNum(count).replace(/\B(?=(.{3})+$)/g, '٬')}</div>
        <div dir="rtl" style={{position: 'absolute', right: 44, top: 200, fontFamily: F.ar, fontWeight: 500, fontSize: 36, color: P.muted}}>عميل جديد · مثال</div>
        <div style={{position: 'absolute', left: 40, bottom: 34, display: 'flex', gap: 22, alignItems: 'flex-end', height: 300}}>
          {[0.35, 0.5, 0.45, 0.7, 1].map((h, i) => {
            const k = sp(frame, V.wide + 0.45 + i * 0.12, {damping: 11, stiffness: 170, mass: 0.8});
            return <div key={i} style={{width: 56, height: 300 * h * k, borderRadius: 14, background: i === 4 ? P.orange : P.teal, opacity: i === 4 ? 1 : 0.5 + i * 0.12}} />;
          })}
        </div>
      </Box>
      <Box x0={360} y0={600} x1={720} y1={1180} o={pageO} r={12}>
        <div style={{position: 'absolute', inset: '90px 40px', display: 'flex', flexDirection: 'column', gap: 34, alignItems: 'flex-end'}}>
          {[0.9, 0.7, 0.85, 0.5, 0.75, 0.6].map((w, i) => (
            <div key={i} style={{width: `${100 * w * prog(t, V.page + 0.35 + i * 0.08, V.page + 0.6 + i * 0.08, easeOut)}%`, height: 16, borderRadius: 8, background: i === 0 ? P.ink : P.muted}} />
          ))}
        </div>
      </Box>
      {micO > 0 ? (
        <svg width={W} height={1920} style={{position: 'absolute', opacity: micO}}>
          {[0, 1, 2].map((i) => {
            const k = ((t - V.mic) * 1.6 + i / 3) % 1;
            return <circle key={i} cx={540} cy={770} r={170 + k * 260} fill="none" stroke={P.teal} strokeWidth={8} opacity={1 - k} />;
          })}
        </svg>
      ) : null}
      {fxO > 0 ? (
        <div style={{opacity: fxO}}>
          {Array.from({length: 10}).map((_, i) => {
            const ph = ((t - V.wave) * 1.3 + rand(i)) % 1;
            return <div key={i} style={{position: 'absolute', left: 80 + rand(i + 3) * 900, top: 900 - 330 - ph * 160 + rand(i + 5) * 60, width: 18, height: 18, borderRadius: 9, background: i % 3 ? P.teal : P.orange, opacity: 1 - ph, transform: `scale(${1 - ph * 0.5})`}} />;
          })}
        </div>
      ) : null}
      {G.TRIPLE_BOXES.map(([x0, y0, x1, y1], i) => (
        <Box key={i} x0={x0} y0={y0} x1={x1} y1={y1} o={t >= V.sizes[i] ? sizesO * prog(t, V.sizes[i], V.sizes[i] + 0.2) : 0} r={8}>
          <Photo name={['clinic-2', 'coffee-4', 'gym-1'][i]} style={{transform: `scale(${1.15 - 0.15 * prog(t, V.sizes[i], V.sizes[i] + 0.6, easeOut)})`}} />
        </Box>
      ))}
    </>
  );
};

/* ---------------- the gallery wall ---------------- */

const WALL = ['coffee-1', 'product-1', 'shop-2', 'clinic-2', 'gym-2', 'product-3', 'coffee-2', 'shop-3', 'clinic-3', 'product-2', 'coffee-4', 'gym-3', 'product-4', 'shop-4', 'clinic-1', 'gym-1'];
const Gallery: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  if (t < V.gallery || t > V.dot + 0.1) return null;
  const k = prog(t, V.gallery, V.implode, easeInOut);
  const turn = -26 * prog(t, V.gallery, V.gallery + 0.5, easeOut);
  return (
    <AbsoluteFill style={{perspective: 1400}}>
      <AbsoluteFill style={{transformStyle: 'preserve-3d', transform: `translateZ(-380px) rotateY(${turn}deg) translateX(${260 - 520 * k}px)`}}>
        {WALL.map((n, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const x = 40 + col * 300 - 150;
          const y = 300 + row * 360;
          const pop = sp(frame, V.gallery + 0.03 * i, POP);
          const imp = prog(t, V.implode + rand(i) * 0.12, V.implode + 0.3 + rand(i) * 0.08, easeIn);
          const ix = lerp(x, G.CX - 130, imp);
          const iy = lerp(y, G.CY - 160, imp);
          return (
            <div key={n} style={{position: 'absolute', left: ix, top: iy, width: 260, height: 320, borderRadius: R.md, overflow: 'hidden', border: `6px solid ${i % 5 === 0 ? P.orange : P.ink}`, boxSizing: 'border-box', transform: `scale(${pop * (1 - imp)}) rotate(${(rand(i + 9) - 0.5) * 8}deg)`, boxShadow: '0 20px 50px rgba(0,0,0,0.5)'}}>
              <Photo name={n} />
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------------- logo and the way to reach us ---------------- */

const Logo: React.FC<{t: number}> = ({t}) => (
  <>
    <Sequence from={Math.round(B.sting * FPS)} durationInFrames={Math.round(3.2 * FPS)} layout="none">
      <OffthreadVideo src={staticFile('ibdaa-logo-sting.mp4')} muted style={{width: '100%', height: '100%'}} />
    </Sequence>
    {t >= B.sting + 3.2 - 1 / FPS ? <Img src={staticFile('ibdaa-logo-dark.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} /> : null}
  </>
);

const WHATSAPP = '01130808848';
const Ending: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  if (t < B.sting) return null;
  const dock = sp(frame, B.dock, HEAVY);
  const z = lerp(1, 0.62, dock);
  const cy = lerp(860, 330, dock);
  const ring = clamp01((t - B.hit) / 0.8);
  const ask = sp(frame, C.ask, POP);
  const asked = prog(t, C.askText, C.askText + 0.3, easeOut);
  const typing = (i: number) => Math.max(0, Math.sin(t * 6 - i * 0.9));
  const wa = sp(frame, C.wa, {damping: 15, stiffness: 150, mass: 0.8});
  const pg = sp(frame, C.page, {damping: 15, stiffness: 150, mass: 0.8});
  const dotK = sp(frame, C.dot, ELASTIC);
  const tickPulse = t > C.tick ? Math.exp(-(t - C.tick) * 5) : 0;
  return (
    <>
      {t >= B.hit && ring < 1 ? (
        <div style={{position: 'absolute', left: W / 2 - 1300 * ring, top: cy - 1300 * ring, width: 2600 * ring, height: 2600 * ring, borderRadius: '50%', border: `${46 * (1 - ring) + 2}px solid ${P.orange}`, opacity: 1 - ring}} />
      ) : null}
      <div style={{position: 'absolute', left: W / 2 - (1080 * z) / 2, top: cy - (699 * z) / 2, width: 1080 * z, height: 699 * z, mixBlendMode: 'lighten'}}>
        <Logo t={t} />
      </div>
      {t >= C.ask ? (
        <div dir="rtl" style={{position: 'absolute', left: 90, width: 900, top: 620, height: 150, borderRadius: R.pill, background: P.surface, border: `3px solid ${P.line}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${ask})`, transformOrigin: '90% 50%'}}>
          {t < C.askText ? (
            <div style={{display: 'flex', gap: 22}}>
              {[0, 1, 2].map((d) => <div key={d} style={{width: 28, height: 28, borderRadius: 14, background: P.ink, opacity: 0.4 + 0.6 * typing(d), transform: `translateY(${-10 * typing(d)}px)`}} />)}
            </div>
          ) : (
            <div style={{fontFamily: F.ar, fontWeight: 700, fontSize: 62, color: P.ink, opacity: asked, transform: `translateY(${(1 - asked) * 20}px)`}}>ابعتلنا فكرتك…</div>
          )}
        </div>
      ) : null}
      {t >= C.wa ? (
        <div dir="rtl" style={{position: 'absolute', left: 90, width: 900, top: 815, height: 230, borderRadius: 56, background: P.teal, color: P.onTeal, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30, transform: `translateY(${(1 - wa) * 120}px) scale(${0.6 + 0.4 * wa})`, opacity: clamp01(wa * 2)}}>
          <svg width={92} height={92} viewBox="0 0 58 58"><path d="M 29 6 A 23 23 0 1 1 13 45 L 7 52 L 9 40 A 23 23 0 0 1 29 6 Z" fill="none" stroke={P.onTeal} strokeWidth={5} strokeLinejoin="round" /></svg>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1}}>
            <span style={{fontFamily: F.ar, fontWeight: 700, fontSize: 44}}>واتساب</span>
            <span dir="ltr" style={{fontFamily: F.display, fontSize: 100, lineHeight: 1.15}}>{WHATSAPP}</span>
          </div>
        </div>
      ) : null}
      {t >= C.page ? (
        <div dir="rtl" style={{position: 'absolute', left: 90, width: 900, top: 1080, height: 140, borderRadius: R.pill, background: P.surface, border: `3px solid ${P.line}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, color: P.ink, fontFamily: F.ar, fontWeight: 700, fontSize: 56, transform: `translateY(${(1 - pg) * 120}px) scale(${0.6 + 0.4 * pg})`, opacity: clamp01(pg * 2)}}>
          <svg width={64} height={64} viewBox="0 0 58 58"><path d="M 29 6 A 23 23 0 1 1 13 45 L 7 52 L 9 40 A 23 23 0 0 1 29 6 Z" fill="none" stroke={P.teal} strokeWidth={5} strokeLinejoin="round" /></svg>
          رسالة على الصفحة
        </div>
      ) : null}
      {t >= C.line - 0.05 ? (
        <div style={{position: 'absolute', top: 1300, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'baseline', flexDirection: 'row-reverse', gap: 14}}>
          <Words text="حتى لو لسه نقطة" t={t} start={C.line} size={104} />
          <div style={{width: 46, height: 46, borderRadius: 23, background: P.orange, transform: `scale(${dotK * (1 + 0.35 * tickPulse)})`, alignSelf: 'flex-end', marginBottom: 40}} />
        </div>
      ) : null}
      {t > C.dot + 0.3 ? (
        <div dir="rtl" style={{position: 'absolute', top: 1780, left: 0, right: 0, textAlign: 'center', fontFamily: F.ar, fontWeight: 500, fontSize: 34, color: P.muted, opacity: prog(t, C.dot + 0.3, C.dot + 0.9)}}>
          الصور المعروضة للعرض ومتعملة بالذكاء الاصطناعي
        </div>
      ) : null}
    </>
  );
};

/* ---------------- captions ---------------- */

const Captions: React.FC<{t: number}> = ({t}) => (
  <>
    {TL.captions.map((c, i) => {
      if (t < c.at - 0.05 || t > c.out + 0.5) return null;
      if (c.kind === 'label') return <Label key={i} t={t} start={c.at} out={c.out} text={c.text} />;
      if (c.kind === 'hook') return <Words key={i} text={c.text} t={t} start={c.at} out={c.out} size={110} style={{position: 'absolute', top: 1040, left: 0, right: 0}} />;
      if (c.kind === 'hookSub') return <Words key={i} text={c.text} t={t} start={c.at} out={c.out} size={56} weight={700} color={P.muted} style={{position: 'absolute', top: 1230, left: 40, right: 40}} />;
      return <Words key={i} text={c.text} t={t} start={c.at} out={c.out - 0.15} size={100} style={{position: 'absolute', top: 1330, left: 40, right: 40}} />;
    })}
  </>
);

export const DotVideo: React.FC = () => {
  useBrandFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{background: P.bg}}>
      <Backdrop t={t} />
      <Gallery t={t} frame={frame} />
      <Steam t={t} />
      <Services t={t} frame={frame} />
      <TheLine t={t} frame={frame} />
      <Pulse t={t} />
      <TagText t={t} frame={frame} />
      <Notifs t={t} frame={frame} />
      <Orbit t={t} />
      <Idea t={t} frame={frame} />
      <Split t={t} frame={frame} />
      <TheDot t={t} frame={frame} />
      <Ending t={t} frame={frame} />
      <Captions t={t} />
      <Grain frame={frame} opacity={0.07} />
    </AbsoluteFill>
  );
};

export const DOT_DURATION = TL.duration;
export const DOT_FPS = FPS;
