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
import {Icon} from './Icons';
import {S, SF, SH, SW, T} from './theme';

const FPS = T.fps;
const E = T.edit;
type Cap = [number, number, string, string];
type Ring = [number, number, string[], number];
type Cut = [number, number, string[]];
const CAPS = T.cap as Cap[];
const RINGS = T.rings as Ring[];
const CUTS = T.cuts as Cut[];

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

/** How much of the frame a page covers right now (0..1). */
const coverAt = (s: number) =>
  CUTS.reduce((m, c, i) => (s < c[0] - 0.05 || s > c[1] + 0.7 ? m : Math.max(m, 1 - Math.min(1, Math.abs(pageAngle(c, s, i)) / 90))), 0);

const BROWN = '#8A5A2B';
const INKC = '#3B2A1A';

/** An old manuscript page: warm paper, fibre noise, burnt edges, a double ruled border. */
const Parchment: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #F8EEDA 0%, #EEDDBB 58%, #D8BC8E 100%)'}}>
    <svg width={SW} height={SH} style={{position: 'absolute', inset: 0, opacity: 0.4, mixBlendMode: 'multiply'}}>
      <filter id="paper">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} seed={7} />
        <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0 0.18  0 0 0 0.5 0" />
      </filter>
      <rect width={SW} height={SH} filter="url(#paper)" />
    </svg>
    <AbsoluteFill style={{boxShadow: 'inset 0 0 180px rgba(110,65,20,0.5)'}} />
    <div style={{position: 'absolute', inset: 44, border: `3px solid ${BROWN}`, borderRadius: 6}} />
    <div style={{position: 'absolute', inset: 58, border: '1.5px solid #B8873F', borderRadius: 4}} />
    {[
      [44, 44],
      [SW - 44, 44],
      [44, SH - 44],
      [SW - 44, SH - 44],
    ].map(([x, y], i) => (
      <div key={i} style={{position: 'absolute', left: x - 13, top: y - 13, width: 26, height: 26, background: '#B8873F', transform: 'rotate(45deg)', border: `2px solid ${BROWN}`}} />
    ))}
  </AbsoluteFill>
);

/** A picture that "develops" inside an ornate frame: sepia to colour, settling into place. */
const Plate: React.FC<{file: string; s: number; a: number; w: number; delay?: number; hot?: boolean}> = ({file, s, a, w, delay = 0, hot}) => {
  const k = prog(s, a + 0.25 + delay, a + 1.1 + delay, easeOut);
  return (
    <div
      style={{
        width: w,
        padding: 12,
        background: '#F4E6C9',
        border: `2px solid ${hot ? S.orange : BROWN}`,
        boxShadow: `0 14px 30px rgba(80,50,20,0.35)${hot ? `, 0 0 ${30 * k}px rgba(243,147,37,0.6)` : ''}`,
        opacity: clamp01(k * 2.5),
        transform: `translateY(${(1 - k) * 40}px) rotate(${(1 - k) * -2.5}deg)`,
      }}
    >
      <div style={{overflow: 'hidden', outline: '1px solid #B8873F', outlineOffset: -6}}>
        <Img
          src={staticFile(`talk/img/${file}.jpg`)}
          style={{
            width: '100%',
            display: 'block',
            aspectRatio: '4 / 5',
            objectFit: 'cover',
            transform: `scale(${1.14 - 0.06 * k + 0.01 * (s - a)})`,
            filter: `sepia(${lerp(0.85, 0.08, k)}) contrast(${lerp(0.9, 1.04, k)})`,
          }}
        />
      </div>
    </div>
  );
};

/** Page turning on a hinge at the right edge (Arabic books open to the left). */
const PageTurn: React.FC<{ang: number; children: React.ReactNode}> = ({ang, children}) => (
  <AbsoluteFill style={{perspective: 2600}}>
    <AbsoluteFill style={{transformOrigin: '100% 50%', transform: `rotateY(${ang}deg)`, backfaceVisibility: 'hidden'}}>
      {children}
      <AbsoluteFill style={{background: `linear-gradient(90deg, rgba(40,20,5,${0.55 * Math.min(1, Math.abs(ang) / 90)}), transparent 75%)`}} />
    </AbsoluteFill>
  </AbsoluteFill>
);

const pageAngle = (c: Cut, s: number, i: number) => {
  const [a, b] = c;
  const chained = CUTS[i + 1]?.[0] === b;
  const pin = prog(s, a - 0.05, a + 0.65, easeInOut);
  const pout = chained ? 0 : prog(s, b, b + 0.6, easeIn);
  return lerp(-100, 0, pin) + lerp(0, 100, pout);
};

/** Pictures as pages of a manuscript that turn in over the talk and turn away again. */
const Cutaway: React.FC<{s: number}> = ({s}) => (
  <>
    {CUTS.map((c, i) => {
      const [a, b, files] = c;
      const chained = CUTS[i + 1]?.[0] === b;
      if (s < a - 0.05 || s > b + (chained ? 0.7 : 0.6)) return null;
      return (
        <PageTurn key={i} ang={pageAngle(c, s, i)}>
          <Parchment />
          {files.length > 1 ? (
            <div style={{position: 'absolute', left: 150, right: 150, top: 150, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, direction: 'rtl'}}>
              {files.map((f, j) => (
                <Plate key={f} file={f} s={s} a={a} w={375} delay={j * 0.22} hot={f === 'b2'} />
              ))}
            </div>
          ) : (
            <div style={{position: 'absolute', left: 170, top: 150}}>
              <Plate file={files[0]} s={s} a={a} w={740} />
            </div>
          )}
        </PageTurn>
      );
    })}
  </>
);

/* ---------- captions: every line arrives on an orbit around the speaker ---------- */

const capAt = (s: number) =>
  CAPS.findIndex(([a, b], j) => {
    const next = CAPS[j + 1]?.[0] ?? b + 0.4;
    const end = next - b < 0.45 ? next : b + 0.2;
    return s >= a - 0.1 && s < end;
  });

const ORBIT = {rx: 440, ry: 250, turn: 3.4};

const OrbitCaption: React.FC<{s: number; layer: 'back' | 'front' | 'all'}> = ({s, layer}) => {
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
        top: ink ? 1265 : 1215,
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
                color: ink ? (hl ? '#C0561A' : INKC) : hl ? S.orangeHi : S.cream,
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

/* ---------- little animated icons in the free corners of the frame ---------- */

const ICONS = T.icons as [number, number, string, string][];

const IconBadges: React.FC<{s: number; frame: number}> = ({s, frame}) => (
  <>
    {ICONS.map(([a, b, name, side], i) => {
      if (s < a - 0.1 || s > b + 0.5) return null;
      const f0 = (a + OFF) * FPS;
      const pop = sp(frame - f0, 0, {damping: 10, stiffness: 200, mass: 0.7}, FPS);
      const out = prog(s, b, b + 0.4, easeIn);
      const k = pop * (1 - out);
      const draw = prog(s, a + 0.1, a + 0.9, easeOut);
      const bob = Math.sin((s - a) * 2.4 + i) * 7;
      const tilt = Math.sin((s - a) * 1.7 + i) * 4;
      const spin = name === 'gear' ? (s - a) * 70 : 0;
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: 380 + bob,
            [side === 'R' ? 'right' : 'left']: 58,
            width: 190,
            height: 190,
            borderRadius: 999,
            background: 'rgba(255,248,236,0.16)',
            border: '2px solid rgba(255,248,236,0.55)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 10px 28px rgba(0,0,0,0.35), inset 0 0 22px rgba(255,201,104,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${k}) rotate(${tilt}deg)`,
            opacity: clamp01(k * 1.5),
          }}
        >
          <Icon name={name} size={118} k={draw} color={S.orangeHi} weight={6} rotate={spin} />
        </div>
      );
    })}
  </>
);

/* ---------- overlays ---------- */

/** Warm light washing in as the talk comes back to the room. */
const Leaks: React.FC<{s: number}> = ({s}) => (
  <>
    {CUTS.filter(([, b], i) => CUTS[i + 1]?.[0] !== b).map(([, at], i) => {
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
  const k = prog(t, 0.6, 1.4, easeOut) * (1 - prog(s, T.end.in - 0.4, T.end.in, easeIn)) * (1 - coverAt(s));
  return (
    <Img
      src={staticFile('talk/logo.png')}
      style={{position: 'absolute', left: 48, top: 150, width: 112, opacity: 0.92 * k, filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.5))'}}
    />
  );
};

const EndCard: React.FC<{s: number; frame: number; c: Client}> = ({s, frame, c}) => {
  const at = T.end.in;
  const bg = prog(s, at - 0.1, at + 0.6, easeInOut);
  if (bg <= 0) return null;
  const f0 = (at + OFF) * FPS;
  const pop = (d: number, cfg = {damping: 11, stiffness: 220, mass: 0.7}) => sp(frame - f0, d, cfg, FPS);
  const name = prog(s, at + 0.7, at + 1.4, easeOut);
  const addr = prog(s, at + 1.6, at + 2.2, easeOut);
  const shine = prog(s, at + 1.0, at + 2.0, easeInOut);
  const stamp = prog(s, at + 0.55, at + 0.8, easeIn);
  return (
    <AbsoluteFill style={{direction: 'rtl'}}>
      <PageTurn ang={lerp(-100, 0, bg)}>
      <Parchment />
      <AbsoluteFill style={{alignItems: 'center'}}>
        <div style={{position: 'absolute', top: 300, width: 380, opacity: stamp, transform: `scale(${lerp(1.7, 1, stamp)}) rotate(${lerp(-10, -3, stamp)}deg)`}}>
          <Img src={staticFile('talk/logo.png')} style={{width: 380, display: 'block', filter: 'drop-shadow(0 10px 14px rgba(80,50,20,0.45))'}} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              WebkitMaskImage: `url(${staticFile('talk/logo.png')})`,
              WebkitMaskSize: '100% 100%',
              background: `linear-gradient(110deg, transparent ${lerp(-30, 110, shine) - 12}%, rgba(255,255,255,0.75) ${lerp(-30, 110, shine)}%, transparent ${lerp(-30, 110, shine) + 12}%)`,
            }}
          />
        </div>
        <div style={{position: 'absolute', top: 820, fontFamily: SF.ruqaa, fontWeight: 700, fontSize: 112, color: INKC, opacity: name, transform: `translateY(${(1 - name) * 30}px)`}}>
          {c.name}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 1020,
            padding: '12px 54px',
            borderRadius: 999,
            background: S.orange,
            color: S.ink,
            fontFamily: SF.sans,
            fontWeight: 800,
            fontSize: 84,
            direction: 'ltr',
            transform: `scale(${pop(1.2)})`,
            boxShadow: '0 10px 24px rgba(80,50,20,0.35)',
          }}
        >
          {c.phone}
        </div>
        <div style={{position: 'absolute', top: 1210, textAlign: 'center', fontFamily: SF.sans, fontWeight: 600, fontSize: 44, lineHeight: 1.5, color: INKC, opacity: addr}}>
          {c.addr1}
          <br />
          {c.addr2}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 1410,
            padding: '12px 40px',
            borderRadius: 999,
            border: `3px solid ${S.blue}`,
            color: INKC,
            fontFamily: SF.sans,
            fontWeight: 800,
            fontSize: 46,
            transform: `scale(${pop(2.1, {damping: 10, stiffness: 210, mass: 0.7})})`,
          }}
        >
          احجز موعدك الآن
        </div>
      </AbsoluteFill>
      </PageTurn>
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
  const cover = coverAt(s);

  return (
    <AbsoluteFill style={{background: S.ink}}>
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
        {show && cover < 0.5 ? (
          <>
            <RingBelt s={s} c={neck} back />
            <OrbitCaption s={s} layer="back" />
          </>
        ) : null}
        <Freeze frame={vf}>
          <OffthreadVideo src={staticFile('talk/fg.webm')} transparent muted style={{position: 'absolute', inset: 0, width: SW, height: SH}} />
        </Freeze>
        {show && cover < 0.5 ? (
          <>
            <RingBelt s={s} c={neck} back={false} />
            <OrbitCaption s={s} layer="front" />
          </>
        ) : null}
        {show ? <IconBadges s={s} frame={frame} /> : null}
        {show ? <Cutaway s={s} /> : null}
        {show && cover >= 0.5 ? <OrbitCaption s={s} layer="all" /> : null}
      </AbsoluteFill>

      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 65% at 50% 40%, transparent 55%, rgba(0,0,0,0.38))'}} />
      {rw > 0 ? (
        <AbsoluteFill
          style={{
            mixBlendMode: 'screen',
            opacity: rw * 0.55,
            background: 'radial-gradient(circle at 50% 35%, rgba(255,190,110,0.7), transparent 60%)',
          }}
        />
      ) : null}
      {show ? <Leaks s={s} /> : null}
      <Watermark t={t} s={s} />
      <EndCard s={s} frame={frame} c={c} />
      <Grain frame={frame} opacity={0.05} />
      <Audio src={staticFile('talk/mix.wav')} />
    </AbsoluteFill>
  );
};
