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
import {S, SF, SH, SW, T} from './theme';

const FPS = T.fps;
const E = T.edit;
type Cap = [number, number, string, string];
type Ring = [number, number, string[], number];
type Bg = [number, string | null, number];
const CAPS = T.cap as Cap[];
const RINGS = T.rings as Ring[];
const BGS = T.bg as Bg[];

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

const bgIndex = (s: number) => {
  let i = -1;
  BGS.forEach(([at], j) => {
    if (s >= at) i = j;
  });
  return i;
};

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

const Backdrop: React.FC<{s: number; c: Pt}> = ({s, c}) => {
  const i = bgIndex(s);
  if (i < 0) return null;
  const [at, file, blur] = BGS[i];
  const prev = i > 0 ? BGS[i - 1] : null;
  const p = prog(s, at, at + 0.9, easeInOut);
  const r = lerp(0, 1700, p);
  const feather = 140;
  const ringK = Math.sin(p * Math.PI);
  const holeOut = `radial-gradient(circle at ${c.x}px ${c.y}px, transparent ${r}px, #000 ${r + feather}px)`;
  const reveal = `radial-gradient(circle at ${c.x}px ${c.y}px, #000 ${r}px, transparent ${r + feather}px)`;
  const prevFile = prev?.[1] ?? null;
  const imageK = file ? 1 : 1 - p;
  return (
    <AbsoluteFill>
      {p < 1 && prevFile ? (
        <AbsoluteFill style={file ? undefined : {WebkitMaskImage: holeOut, maskImage: holeOut}}>
          <BgImage file={prevFile} blur={prev![2]} s={s} since={prev![0]} />
        </AbsoluteFill>
      ) : null}
      {file ? (
        <AbsoluteFill style={p < 1 ? {WebkitMaskImage: reveal, maskImage: reveal} : undefined}>
          <BgImage file={file} blur={blur} s={s} since={at} />
        </AbsoluteFill>
      ) : null}
      {imageK > 0 && (file || prevFile) ? (
        <>
          <Rays s={s} k={imageK} />
          <Dust s={s} k={imageK} />
        </>
      ) : null}
      {ringK > 0.01 ? (
        <div
          style={{
            position: 'absolute',
            left: c.x - r - feather / 2,
            top: c.y - r - feather / 2,
            width: (r + feather / 2) * 2,
            height: (r + feather / 2) * 2,
            borderRadius: '50%',
            border: `3px solid rgba(255,201,104,${0.85 * ringK})`,
            boxShadow: `0 0 40px rgba(243,147,37,${0.6 * ringK}), inset 0 0 40px rgba(243,147,37,${0.45 * ringK})`,
          }}
        />
      ) : null}
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

const OrbitCaption: React.FC<{s: number; back: boolean}> = ({s, back}) => {
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
        top: 1215,
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
                visibility: behind === back ? 'visible' : 'hidden',
                transform: `translate(${ORBIT.rx * Math.sin(phi)}px, ${-ORBIT.ry * (1 - Math.cos(phi))}px) scale(${lerp(0.5, 1, depth) * land})`,
                opacity: op * lerp(0.55, 1, depth),
                filter: depth < 0.5 ? `blur(${(0.5 - depth) * 5}px)` : undefined,
                color: hl ? S.orangeHi : S.cream,
                fontWeight: hl ? 900 : undefined,
                fontSize: hl ? '1.14em' : undefined,
                textShadow: hl ? S.glowHot : S.glow,
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

/* ---------- the remedies carousel: four pictures orbiting the speaker ---------- */

const Carousel: React.FC<{s: number; c: Pt; back: boolean}> = ({s, c, back}) => {
  const C = T.carousel;
  const k = env(s, C.in, C.out, 0.9, 0.5);
  if (k <= 0) return null;
  const n = C.cards.length;
  const spin = (s - C.in) * 0.75 + 0.6;
  return (
    <AbsoluteFill>
      {C.cards.map((file, j) => {
        const th = spin + (j / n) * Math.PI * 2;
        const sn = Math.sin(th);
        if (sn > 0 === back) return null;
        const depth = (sn + 1) / 2;
        const w = 330;
        return (
          <div
            key={file}
            style={{
              position: 'absolute',
              left: c.x + lerp(150, 400, k) * Math.cos(th),
              top: c.y + 90 + lerp(20, 170, k) * sn,
              width: w,
              transform: `translate(-50%, -50%) scale(${lerp(0.55, 1.1, depth) * k}) scaleX(${lerp(0.3, 1, Math.abs(sn))})`,
              opacity: lerp(0.55, 1, depth),
              filter: `drop-shadow(0 18px 26px rgba(0,0,0,0.55)) ${depth < 0.45 ? `blur(${(0.45 - depth) * 4}px)` : ''}`,
            }}
          >
            <div style={{background: S.paper, padding: 10, borderRadius: 14}}>
              <Img src={staticFile(`talk/img/${file}.jpg`)} style={{width: '100%', display: 'block', aspectRatio: '4 / 5', objectFit: 'cover', borderRadius: 8}} />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- overlays ---------- */

/** Warm light washing in as the talk comes back to the room. */
const Leaks: React.FC<{s: number}> = ({s}) => (
  <>
    {BGS.filter(([, f]) => f === null).map(([at], i) => {
      const k = prog(s, at - 0.2, at + 1.1, (x) => x);
      if (k <= 0 || k >= 1) return null;
      const a = Math.sin(k * Math.PI);
      return (
        <AbsoluteFill
          key={i}
          style={{
            mixBlendMode: 'screen',
            opacity: a * 0.7,
            background: `radial-gradient(ellipse 55% 40% at ${lerp(115, -15, k)}% ${lerp(20, 70, k)}%, rgba(255,150,50,0.85), transparent 70%), radial-gradient(ellipse 45% 35% at ${lerp(-10, 110, k)}% ${lerp(80, 30, k)}%, rgba(47,163,223,0.45), transparent 70%)`,
          }}
        />
      );
    })}
  </>
);

const Watermark: React.FC<{t: number; s: number}> = ({t, s}) => {
  const k = prog(t, 0.6, 1.4, easeOut) * (1 - prog(s, T.end.in - 0.4, T.end.in, easeIn)) * (1 - env(s, T.carousel.in - 0.2, T.carousel.out + 0.2, 0.3, 0.4));
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
  return (
    <AbsoluteFill style={{direction: 'rtl'}}>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(22,18,14,0.55), rgba(22,18,14,0.88))', opacity: bg}} />
      <AbsoluteFill style={{alignItems: 'center', opacity: bg}}>
        <div style={{position: 'absolute', top: 320, width: 380, transform: `scale(${pop(0.2, {damping: 12, stiffness: 160, mass: 0.8})})`}}>
          <Img src={staticFile('talk/logo.png')} style={{width: 380, display: 'block', filter: 'drop-shadow(0 24px 40px rgba(0,0,0,0.6))'}} />
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
        <div style={{position: 'absolute', top: 820, fontFamily: SF.ruqaa, fontWeight: 700, fontSize: 112, color: S.cream, textShadow: S.glow, opacity: name, transform: `translateY(${(1 - name) * 30}px)`}}>
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
            boxShadow: '0 14px 40px rgba(0,0,0,0.45)',
          }}
        >
          {c.phone}
        </div>
        <div style={{position: 'absolute', top: 1210, textAlign: 'center', fontFamily: SF.sans, fontWeight: 600, fontSize: 44, lineHeight: 1.5, color: S.cream, opacity: addr}}>
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
            color: S.cream,
            fontFamily: SF.sans,
            fontWeight: 800,
            fontSize: 46,
            transform: `scale(${pop(2.1, {damping: 10, stiffness: 210, mass: 0.7})})`,
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
        {show ? <Backdrop s={s} c={{x: head.x, y: head.y + 120}} /> : null}
        {show ? (
          <>
            <Carousel s={s} c={neck} back />
            <RingBelt s={s} c={neck} back />
            <OrbitCaption s={s} back />
          </>
        ) : null}
        <Freeze frame={vf}>
          <OffthreadVideo src={staticFile('talk/fg.webm')} transparent muted style={{position: 'absolute', inset: 0, width: SW, height: SH}} />
        </Freeze>
        {show ? (
          <>
            <Carousel s={s} c={neck} back={false} />
            <RingBelt s={s} c={neck} back={false} />
            <OrbitCaption s={s} back={false} />
          </>
        ) : null}
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
