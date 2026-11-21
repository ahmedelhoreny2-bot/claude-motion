import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  Freeze,
  Img,
  OffthreadVideo,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {Grain} from '../components/primitives';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog, sp} from '../lib';
import {Icon3D} from './Icons3D';
import {S, SF, SH, SW, T} from './theme';

const FPS = T.fps;
const E = T.edit;
type Cap = [number, number, string, string];
type Ring = [number, number, string[], number];
type Split = [number, number, [number, string[]][]];
const CAPS = T.cap as Cap[];
const RINGS = T.rings as Ring[];
const SPLITS = T.splits as Split[];

/** Client details come in as props at render time (kept out of the repo). */
export type Client = {name: string; phone: string; addr1: string; addr2: string};
export const CLIENT_PLACEHOLDER: Client = {
  name: 'اسم المركز',
  phone: '01000000000',
  addr1: 'المدينة · الشارع',
  addr2: 'علامة مميزة قريبة',
};

type Track = {x: number[]; y: number[]};
type Pt = {x: number; y: number};

const useAssets = () => {
  const [h] = useState(() => delayRender('talk-assets'));
  const [track, setTrack] = useState<Track | null>(null);
  useEffect(() => {
    Promise.all([
      document.fonts.load('800 60px "Cairo"'),
      document.fonts.load('900 60px "Cairo"'),
      document.fonts.load('700 60px "Amiri"'),
      document.fonts.load('700 60px "Aref Ruqaa"'),
      fetch(staticFile('talk/track.json'))
        .then((r) => r.json())
        .then(setTrack)
        .catch(() => setTrack({x: [540], y: [430]})),
    ]).then(() => continueRender(h));
  }, [h]);
  return track;
};

const env = (t: number, a: number, b: number, inD = 0.45, outD = 0.35) =>
  prog(t, a, a + inD, easeOut) * (1 - prog(t, b - outD, b, easeIn));

/* ---------- the edit: cold open on the punchline, rewind, then the talk from the top ---------- */

const HL = E.hookLen;
const RW = E.rewind;
const OFF = HL + RW - E.bodySrc;

/** Output seconds → source seconds of the talk. */
const srcAt = (t: number) => {
  if (t < HL) return E.hookSrc + t;
  if (t < HL + RW) return lerp(E.hookSrc + HL, E.bodySrc, easeInOut(prog(t, HL, HL + RW, (x) => x)));
  return t - OFF;
};

const zoomAt = (s: number) => {
  const z = T.zoom as [number, number][];
  let v = z[0][1];
  for (const [at, to] of z) v = lerp(v, to, prog(s, at - 0.2, at + 0.9, easeInOut));
  return v * (1 + 0.008 * Math.sin(s * 0.4));
};

const shakeAt = (s: number) => {
  let dx = 0;
  let dy = 0;
  for (const at of T.shakes as number[]) {
    const d = s - at;
    if (d < 0 || d > 0.45) continue;
    const a = 9 * Math.exp(-d * 9);
    dx += a * Math.sin(d * 70);
    dy += a * 0.6 * Math.cos(d * 55);
  }
  return {dx, dy};
};

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/* ---------- backgrounds that open behind the speaker ---------- */

const BgImage: React.FC<{file: string; blur: number; s: number; since: number}> = ({file, blur, s, since}) => (
  <AbsoluteFill style={{overflow: 'hidden'}}>
    <Img
      src={staticFile(`talk/img/${file}.jpg`)}
      style={{
        width: SW,
        height: SH,
        objectFit: 'cover',
        transform: `scale(${1.08 + 0.012 * (s - since)}) translateY(${-6 * (s - since)}px)`,
        filter: `blur(${blur}px) brightness(0.8) saturate(1.08)`,
      }}
    />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,8,6,0.35), rgba(10,8,6,0) 35%, rgba(10,8,6,0.25))'}} />
  </AbsoluteFill>
);

/** Golden dust drifting in the light, behind the speaker. */
const Dust: React.FC<{s: number; k: number}> = ({s, k}) => (
  <AbsoluteFill style={{opacity: k}}>
    {Array.from({length: 46}, (_, i) => {
      const sp0 = 14 + hash(i) * 30;
      const x = hash(i + 7) * SW + Math.sin(s * 0.5 + i) * 30;
      const y = ((hash(i + 3) * SH - s * sp0) % SH + SH) % SH;
      const r = 2 + hash(i + 11) * 6;
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s * (1 + hash(i)) * 2 + i));
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: r,
            height: r,
            borderRadius: 99,
            background: '#FFD9A0',
            opacity: tw * 0.8,
            filter: `blur(${r > 6 ? 2 : 0.6}px)`,
            boxShadow: '0 0 10px rgba(255,200,120,0.8)',
          }}
        />
      );
    })}
  </AbsoluteFill>
);

/** A soft beam of window light sweeping slowly across the backdrop. */
const Rays: React.FC<{s: number; k: number}> = ({s, k}) => (
  <AbsoluteFill
    style={{
      mixBlendMode: 'screen',
      opacity: 0.32 * k,
      background: `linear-gradient(${112 + Math.sin(s * 0.25) * 6}deg, transparent 18%, rgba(255,190,110,0.55) 30%, transparent 42%, rgba(255,210,150,0.35) 52%, transparent 64%)`,
    }}
  />
);

/* ---------- split screen: the speaker slides into a card, the picture comes in above ---------- */

const splitK = (s: number) =>
  SPLITS.reduce((m, [a, b]) => Math.max(m, prog(s, a - 0.15, a + 0.6, easeInOut) * (1 - prog(s, b, b + 0.6, easeInOut))), 0);

const activeSplit = (s: number) => SPLITS.find(([a, b]) => s >= a - 0.15 && s < b + 0.6);

/** The speaker's frame moves into a rounded card in the lower part of the screen. */
const CARD = {top: 880, side: 119, bottom: 60, scale: 0.78, shift: 780};

const SplitTile: React.FC<{files: string[]; s: number; since: number}> = ({files, s, since}) =>
  files.length > 1 ? (
    <div style={{position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 10, padding: 10, direction: 'rtl', background: S.ink}}>
      {files.map((f, j) => {
        const k = sp(Math.round((s - since) * FPS), 0.1 + j * 0.16, {damping: 12, stiffness: 170, mass: 0.8}, FPS);
        return (
          <div key={f} style={{overflow: 'hidden', borderRadius: 18, transform: `scale(${lerp(0.7, 1, k)})`, opacity: clamp01(k * 1.6), border: f === 'b2' ? `3px solid ${S.orangeHi}` : undefined}}>
            <Img src={staticFile(`talk/img/${f}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.08 + 0.01 * (s - since)})`}} />
          </div>
        );
      })}
    </div>
  ) : (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img
        src={staticFile(`talk/img/${files[0]}.jpg`)}
        style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.1 + 0.012 * (s - since)}) translateY(${-4 * (s - since)}px)`}}
      />
      <Rays s={s} k={0.8} />
      <Dust s={s} k={0.8} />
    </AbsoluteFill>
  );

/** The picture card above the speaker; pictures in a run slide through it like a carousel. */
const SplitCard: React.FC<{s: number; k: number}> = ({s, k}) => {
  const sp0 = activeSplit(s);
  if (!sp0 || k <= 0) return null;
  const [a, , shots] = sp0;
  let cur = 0;
  shots.forEach(([at], i) => {
    if (s >= at) cur = i;
  });
  const sw = prog(s, shots[cur][0], shots[cur][0] + 0.6, easeInOut);
  const land = prog(s, a - 0.15, a + 0.75, easeOut);
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 70, height: 780, perspective: 1600}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 40,
          overflow: 'hidden',
          boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
          border: '3px solid rgba(255,248,236,0.85)',
          transform: `translateY(${(1 - k) * -900}px) rotateX(${(1 - land) * 18}deg) translateY(${Math.sin(s * 1.1) * 4}px)`,
          transformOrigin: '50% 100%',
          opacity: clamp01(k * 2),
        }}
      >
        {cur > 0 && sw < 1 ? (
          <AbsoluteFill style={{transform: `translateX(${sw * 1000}px)`}}>
            <SplitTile files={shots[cur - 1][1]} s={s} since={shots[cur - 1][0]} />
          </AbsoluteFill>
        ) : null}
        <AbsoluteFill style={{transform: cur > 0 ? `translateX(${(1 - sw) * -1000}px)` : undefined}}>
          <SplitTile files={shots[cur][1]} s={s} since={shots[cur][0]} />
        </AbsoluteFill>
      </div>
    </div>
  );
};

/** A blurred wash of the current picture behind both cards, so the split reads as one scene. */
const SplitWash: React.FC<{s: number; k: number}> = ({s, k}) => {
  const sp0 = activeSplit(s);
  if (!sp0 || k <= 0) return null;
  let file = sp0[2][0][1][0];
  sp0[2].forEach(([at, f]) => {
    if (s >= at) file = f[0];
  });
  return (
    <AbsoluteFill style={{opacity: k}}>
      <Img src={staticFile(`talk/img/${file}.jpg`)} style={{width: SW, height: SH, objectFit: 'cover', filter: 'blur(40px) brightness(0.55) saturate(1.2)', transform: 'scale(1.2)'}} />
    </AbsoluteFill>
  );
};

/* ---------- captions: every line arrives on an orbit around the speaker ---------- */

const capAt = (s: number) =>
  CAPS.findIndex(([a, b], j) => {
    const next = CAPS[j + 1]?.[0] ?? b + 0.4;
    const end = next - b < 0.45 ? next : b + 0.2;
    return s >= a - 0.1 && s < end;
  });

const ORBIT = {rx: 440, ry: 250, turn: 3.4};

const OrbitCaption: React.FC<{s: number; layer: 'back' | 'front' | 'all'; lift?: number}> = ({s, layer, lift = 0}) => {
  const ink = layer === 'all';
  const i = capAt(s);
  if (i < 0) return null;
  const [a, b, text, style] = CAPS[i];
  if (style !== 'n' && style !== 'h') return null;
  const next = CAPS[i + 1]?.[0] ?? b + 0.4;
  const end = next - b < 0.45 ? next : b + 0.2;
  const words = text.split(' ');
  const long = text.length > 24;
  const hadith = style === 'h';
  return (
    <div
      style={{
        position: 'absolute',
        left: 30,
        right: 30,
        top: lerp(ink ? 1265 : 1215, 1060, lift),
        textAlign: 'center',
        direction: 'rtl',
        whiteSpace: 'nowrap',
        fontFamily: hadith ? SF.naskh : SF.sans,
        fontWeight: hadith ? 700 : 800,
        fontSize: hadith ? (long ? 62 : 74) : long ? 56 : 70,
        lineHeight: 1.3,
      }}
    >
      {words.map((w, j) => {
        const hl = w.includes('*');
        const kin = prog(s, a - 0.1 + j * 0.06, a - 0.1 + j * 0.06 + 0.8, easeOut);
        const kout = prog(s, end - 0.45 + j * 0.035, end - 0.45 + j * 0.035 + 0.45, easeIn);
        const phi = (1 - kin) * ORBIT.turn - kout * ORBIT.turn;
        const behind = Math.cos(phi) < -0.05;
        const depth = (Math.cos(phi) + 1) / 2;
        const op = clamp01(kin * 4) * (1 - clamp01((kout - 0.75) * 4));
        const land = hl ? 1 + 0.18 * Math.sin(clamp01((kin - 0.85) / 0.15) * Math.PI) : 1;
        return (
          <React.Fragment key={j}>
            <span
              style={{
                display: 'inline-block',
                visibility: layer === 'all' || behind === (layer === 'back') ? 'visible' : 'hidden',
                transform: `translate(${ORBIT.rx * Math.sin(phi)}px, ${-ORBIT.ry * (1 - Math.cos(phi))}px) scale(${lerp(0.5, 1, depth) * land})`,
                opacity: op * lerp(0.55, 1, depth),
                filter: depth < 0.5 ? `blur(${(0.5 - depth) * 5}px)` : undefined,
                color: ink ? (hl ? '#C0561A' : '#3B2A1A') : hl ? S.orangeHi : S.cream,
                fontWeight: hl ? 900 : undefined,
                fontSize: hl ? '1.14em' : undefined,
                textShadow: ink ? '0 1px 0 rgba(255,240,210,0.6)' : hl ? S.glowHot : S.glow,
              }}
            >
              {w.replace(/\*/g, '')}
            </span>
            {j < words.length - 1 ? ' ' : ''}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ---------- the ring: a belt of words turning around the speaker's head ---------- */

const RingBelt: React.FC<{s: number; c: Pt; back: boolean}> = ({s, c, back}) => {
  const r = RINGS.find(([a, b]) => s >= a - 0.4 && s < b + 0.1);
  if (!r) return null;
  const [a, b, phrases, step] = r;
  const k = env(s, a - 0.4, b + 0.1, 0.8, 0.45);
  const n = phrases.length > 1 ? 6 : phrases[0].length > 10 ? 4 : 5;
  const rx = lerp(240, 455, k);
  const ry = lerp(30, 120, k);
  const spin = (s - a) * 0.85 + 1.2;
  return (
    <AbsoluteFill style={{direction: 'rtl'}}>
      {Array.from({length: n}, (_, j) => {
        const th = spin + (j / n) * Math.PI * 2;
        const sn = Math.sin(th);
        if (sn > 0 === back) return null;
        const word = phrases[j % phrases.length];
        const shown = step ? prog(s, a + (j % phrases.length) * step, a + (j % phrases.length) * step + 0.6, easeOut) : 1;
        const depth = (sn + 1) / 2;
        return (
          <div
            key={j}
            style={{
              position: 'absolute',
              left: c.x + rx * Math.cos(th),
              top: c.y + ry * sn,
              transform: `translate(-50%, -50%) scale(${lerp(0.62, 1.15, depth)}) scaleX(${lerp(0.35, 1, Math.abs(sn))})`,
              whiteSpace: 'nowrap',
              fontFamily: phrases.length > 1 ? SF.ruqaa : SF.sans,
              fontWeight: phrases.length > 1 ? 700 : 900,
              fontSize: phrases.length > 1 ? 120 : word.length > 10 ? 86 : 118,
              color: depth > 0.55 ? S.cream : S.orangeHi,
              textShadow: depth > 0.55 ? S.glowHot : S.glow,
              opacity: k * shown * lerp(0.45, 1, depth),
              filter: depth < 0.45 ? `blur(${(0.45 - depth) * 5}px)` : undefined,
            }}
          >
            {word}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- 2.5D colour icons, on their word, in the free corners ---------- */

const ICONS = T.icons as [number, number, string, string][];

const IconBadges: React.FC<{s: number; frame: number}> = ({s, frame}) => (
  <>
    {ICONS.map(([a, b, name, side], i) => {
      if (s < a - 0.1 || s > b + 0.5) return null;
      const f0 = Math.round((a + OFF) * FPS);
      const pop = sp(frame - f0, 0, {damping: 9, stiffness: 180, mass: 0.7}, FPS);
      const out = prog(s, b, b + 0.4, easeIn);
      const k = pop * (1 - out);
      const lt = s - a;
      const float = Math.sin(lt * 2.2 + i) * 10;
      const sway = Math.sin(lt * 1.5 + i) * 14;
      const flip = (1 - pop) * (side === 'R' ? 80 : -80) + out * (side === 'R' ? -70 : 70);
      const spin = name === 'gear' ? lt * 90 * (side === 'R' ? 1 : -1) : 0;
      const bounce = name === 'car' ? Math.abs(Math.sin(lt * 9)) * -5 : 0;
      return (
        <div key={i} style={{position: 'absolute', top: 330, [side === 'R' ? 'right' : 'left']: 30, width: 240, height: 290, perspective: 900}}>
          <div
            style={{
              position: 'absolute',
              left: 40,
              right: 40,
              top: 240,
              height: 26,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.45), transparent 70%)',
              transform: `scale(${k * (1 - float / 60)})`,
              opacity: k,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 20,
              top: 10,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,201,104,0.35), transparent 65%)',
              transform: `scale(${k * 1.3})`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 20,
              top: 10,
              transform: `translateY(${float + bounce - (1 - pop) * 60}px) rotateY(${sway + flip}deg) scale(${k})`,
              filter: 'drop-shadow(0 12px 16px rgba(0,0,0,0.35))',
            }}
          >
            <Icon3D name={name} size={200} spin={spin} id={`i${i}`} />
          </div>
        </div>
      );
    })}
  </>
);

/* ---------- overlays ---------- */

/** Warm light washing in as the talk comes back to the room. */
const Leaks: React.FC<{s: number}> = ({s}) => (
  <>
    {SPLITS.map(([, at], i) => {
      const k = prog(s, at - 0.2, at + 1.1, (x) => x);
      if (k <= 0 || k >= 1) return null;
      const a = Math.sin(k * Math.PI);
      return (
        <AbsoluteFill
          key={i}
          style={{
            mixBlendMode: 'screen',
            opacity: a * 0.35,
            background: `radial-gradient(ellipse 55% 40% at ${lerp(115, -15, k)}% ${lerp(20, 70, k)}%, rgba(255,150,50,0.85), transparent 70%), radial-gradient(ellipse 45% 35% at ${lerp(-10, 110, k)}% ${lerp(80, 30, k)}%, rgba(47,163,223,0.45), transparent 70%)`,
          }}
        />
      );
    })}
  </>
);

const Watermark: React.FC<{t: number; s: number}> = ({t, s}) => {
  const k = prog(t, 0.6, 1.4, easeOut) * (1 - prog(s, T.end.in - 0.4, T.end.in, easeIn)) * (1 - splitK(s));
  return (
    <Img
      src={staticFile('talk/logo.png')}
      style={{position: 'absolute', left: 48, top: 150, width: 112, opacity: 0.92 * k, filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.5))'}}
    />
  );
};

/** Brand ending: the logo flips in, lands with a light wave and a burst, a shine runs over it. */
const EndCard: React.FC<{s: number; frame: number; c: Client}> = ({s, frame, c}) => {
  const at = T.end.in;
  const bg = prog(s, at - 0.1, at + 0.7, easeInOut);
  if (bg <= 0) return null;
  const f0 = Math.round((at + OFF) * FPS);
  const pop = (d: number, cfg = {damping: 11, stiffness: 220, mass: 0.7}) => sp(frame - f0, d, cfg, FPS);
  const logo = pop(0.25, {damping: 10, stiffness: 140, mass: 0.9});
  const land = at + 0.62;
  const wave = prog(s, land, land + 1.1, easeOut);
  const burst = prog(s, land, land + 1.2, easeOut);
  const shine = prog(s, at + 1.25, at + 2.05, easeInOut);
  const name = prog(s, at + 0.95, at + 1.6, easeOut);
  const addr = prog(s, at + 1.8, at + 2.4, easeOut);
  const lt = s - at;
  const float = Math.sin(lt * 1.6) * 6;
  const LY = 560;
  return (
    <AbsoluteFill style={{direction: 'rtl'}}>
      <AbsoluteFill
        style={{
          opacity: bg * 0.96,
          background: `radial-gradient(circle at 50% 30%, #2FA3DF 0%, #1D4F9A 35%, ${S.navy} 62%, #0B1233 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: bg * 0.22,
          mixBlendMode: 'screen',
          background: `repeating-conic-gradient(from ${lt * 8}deg at 50% 29%, rgba(255,255,255,0.5) 0deg 6deg, transparent 6deg 22deg)`,
          WebkitMaskImage: 'radial-gradient(circle at 50% 29%, #000 10%, transparent 60%)',
        }}
      />
      <Dust s={s} k={bg * 0.7} />
      {/* light wave */}
      {wave > 0 && wave < 1 ? (
        <div
          style={{
            position: 'absolute',
            left: 540 - lerp(150, 760, wave),
            top: LY - lerp(150, 760, wave),
            width: lerp(300, 1520, wave),
            height: lerp(300, 1520, wave),
            borderRadius: '50%',
            border: `${lerp(14, 2, wave)}px solid rgba(255,201,104,${1 - wave})`,
            boxShadow: `0 0 50px rgba(243,147,37,${0.7 * (1 - wave)})`,
          }}
        />
      ) : null}
      {/* particle burst */}
      {burst > 0 && burst < 1
        ? Array.from({length: 22}, (_, j) => {
            const ang = (j / 22) * Math.PI * 2 + hash(j) * 0.3;
            const dist = lerp(160, 420 + hash(j + 5) * 260, burst);
            const size = 6 + hash(j + 9) * 12;
            const col = [S.orangeHi, S.cream, '#7FD0F5'][j % 3];
            return (
              <div
                key={j}
                style={{
                  position: 'absolute',
                  left: 540 + Math.cos(ang) * dist - size / 2,
                  top: LY + Math.sin(ang) * dist - size / 2,
                  width: size,
                  height: size,
                  borderRadius: j % 2 ? '50%' : 3,
                  background: col,
                  opacity: 1 - burst,
                  transform: `rotate(${burst * 300}deg) scale(${1 - burst * 0.5})`,
                  boxShadow: `0 0 12px ${col}`,
                }}
              />
            );
          })
        : null}
      {/* the logo */}
      <div style={{position: 'absolute', left: 540 - 200, top: LY - 232, width: 400, perspective: 1300}}>
        <div
          style={{
            position: 'relative',
            transform: `translateY(${float}px) rotateY(${(1 - logo) * 110}deg) scale(${lerp(0.35, 1, logo)})`,
            filter: `blur(${(1 - clamp01(logo * 1.3)) * 10}px) drop-shadow(0 26px 40px rgba(0,0,0,0.55))`,
            opacity: clamp01(logo * 2),
          }}
        >
          <Img src={staticFile('talk/logo.png')} style={{width: 400, display: 'block'}} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              WebkitMaskImage: `url(${staticFile('talk/logo.png')})`,
              WebkitMaskSize: '100% 100%',
              background: `linear-gradient(110deg, transparent ${lerp(-30, 130, shine) - 14}%, rgba(255,255,255,0.85) ${lerp(-30, 130, shine)}%, transparent ${lerp(-30, 130, shine) + 14}%)`,
            }}
          />
        </div>
      </div>
      <AbsoluteFill style={{alignItems: 'center'}}>
        <div style={{position: 'absolute', top: 880, overflow: 'hidden', padding: '0 20px'}}>
          <div style={{fontFamily: SF.ruqaa, fontWeight: 700, fontSize: 112, color: S.cream, textShadow: S.glow, transform: `translateY(${(1 - name) * 110}%)`}}>{c.name}</div>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 1065,
            padding: '12px 54px',
            borderRadius: 999,
            background: `linear-gradient(180deg, ${S.orangeHi}, ${S.orange})`,
            color: S.ink,
            fontFamily: SF.sans,
            fontWeight: 800,
            fontSize: 84,
            direction: 'ltr',
            transform: `scale(${pop(1.4) * (1 + 0.025 * Math.sin(lt * 3))})`,
            boxShadow: '0 14px 40px rgba(0,0,0,0.4), 0 0 30px rgba(243,147,37,0.4)',
          }}
        >
          {c.phone}
        </div>
        <div style={{position: 'absolute', top: 1255, textAlign: 'center', fontFamily: SF.sans, fontWeight: 600, fontSize: 44, lineHeight: 1.5, color: S.cream, opacity: addr, transform: `translateY(${(1 - addr) * 20}px)`}}>
          {c.addr1}
          <br />
          {c.addr2}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 1450,
            padding: '12px 40px',
            borderRadius: 999,
            border: `3px solid ${S.orangeHi}`,
            color: S.cream,
            fontFamily: SF.sans,
            fontWeight: 800,
            fontSize: 46,
            transform: `scale(${pop(2.2, {damping: 10, stiffness: 210, mass: 0.7})})`,
            boxShadow: `0 0 ${20 + 14 * Math.sin(lt * 3)}px rgba(255,201,104,0.45)`,
          }}
        >
          احجز موعدك الآن
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------- the piece ---------- */

export const TalkVideo: React.FC<Client> = (c) => {
  const track = useAssets();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const s = srcAt(t);
  const rewinding = t >= HL && t < HL + RW;
  const rw = rewinding ? Math.sin(prog(t, HL, HL + RW, (x) => x) * Math.PI) : 0;
  const vf = Math.max(0, Math.min(Math.round(s * FPS), Math.floor((T.voiceEnd - 0.1) * FPS)));
  const tr = track ?? {x: [540], y: [430]};
  const hi = Math.min(vf, tr.x.length - 1);
  const head = {x: tr.x[hi], y: tr.y[hi]};
  const neck = {x: lerp(head.x, 540, 0.4), y: head.y + 200};
  const endBlur = prog(s, T.end.in - 0.1, T.end.in + 0.6, easeInOut);
  const hookPush = lerp(1.14, 1, prog(t, 0, HL, easeOut));
  const z = (t < HL ? hookPush : zoomAt(s)) * (1 + 0.1 * rw);
  const sh = shakeAt(s);
  const show = !rewinding;
  const k = show ? splitK(s) : 0;
  const clip = `inset(${CARD.top * k}px ${CARD.side * k}px ${CARD.bottom * k}px ${CARD.side * k}px round ${44 * k}px)`;

  return (
    <AbsoluteFill style={{background: S.ink}}>
      <SplitWash s={s} k={k} />
      <AbsoluteFill style={{clipPath: k > 0 ? clip : undefined}}>
        <AbsoluteFill style={{transform: `translateY(${CARD.shift * k}px) scale(${lerp(1, CARD.scale, k)})`, transformOrigin: '540px 120px'}}>
          <AbsoluteFill
            style={{
              transform: `translate(${sh.dx}px, ${sh.dy}px) scale(${z})`,
              transformOrigin: `${head.x}px ${head.y + 120}px`,
              filter: endBlur > 0 || rw > 0 ? `blur(${endBlur * 20 + rw * 9}px) brightness(${1 - rw * 0.25})` : undefined,
            }}
          >
            <Freeze frame={vf}>
              <OffthreadVideo src={staticFile('talk/nat.mp4')} muted style={{width: SW, height: SH}} />
            </Freeze>
            {show ? (
              <>
                <RingBelt s={s} c={neck} back />
                <OrbitCaption s={s} layer="back" lift={k} />
              </>
            ) : null}
            <Freeze frame={vf}>
              <OffthreadVideo src={staticFile('talk/fg.webm')} transparent muted style={{position: 'absolute', inset: 0, width: SW, height: SH}} />
            </Freeze>
            {show ? (
              <>
                <RingBelt s={s} c={neck} back={false} />
                <OrbitCaption s={s} layer="front" lift={k} />
              </>
            ) : null}
          </AbsoluteFill>
          <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 65% at 50% 40%, transparent 55%, rgba(0,0,0,0.38))'}} />
        </AbsoluteFill>
      </AbsoluteFill>
      {k > 0 ? (
        <div
          style={{
            position: 'absolute',
            top: CARD.top * k,
            left: CARD.side * k,
            right: CARD.side * k,
            bottom: CARD.bottom * k,
            borderRadius: 44 * k,
            border: `${3 * k}px solid rgba(255,248,236,${0.85 * k})`,
            boxShadow: `0 20px 50px rgba(0,0,0,${0.45 * k})`,
          }}
        />
      ) : null}
      <SplitCard s={s} k={k} />
      {rw > 0 ? (
        <AbsoluteFill
          style={{
            mixBlendMode: 'screen',
            opacity: rw * 0.55,
            background: 'radial-gradient(circle at 50% 35%, rgba(255,190,110,0.7), transparent 60%)',
          }}
        />
      ) : null}
      {show ? <IconBadges s={s} frame={frame} /> : null}
      {show ? <Leaks s={s} /> : null}
      <Watermark t={t} s={s} />
      <EndCard s={s} frame={frame} c={c} />
      <Grain frame={frame} opacity={0.05} />
      <Audio src={staticFile('talk/mix.wav')} />
    </AbsoluteFill>
  );
};
