import '@fontsource/alexandria/400.css';
import '@fontsource/alexandria/600.css';
import '@fontsource/alexandria/800.css';
import '@fontsource/alexandria/900.css';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  OffthreadVideo,
  Sequence,
  staticFile,
  useVideoConfig,
} from 'remotion';
import {SpringConfig} from 'remotion';
import {clamp01, easeInOut, easeOut, prog, rand, sp as libSp} from '../lib';
import timeline from './timeline.json';

export const T = timeline;
export const FPS = T.fps;
export const sp = (frame: number, startSec: number, config: Partial<SpringConfig> = {}) =>
  libSp(frame, startSec, config, FPS);

/** Ibdaa palette: light base, orange hero, teal support. Ink only for type. */
export const P = {
  cream: '#F4F1EA',
  paper: '#EDE6D6',
  white: '#FFFDF8',
  orange: '#FF5A20',
  orangeDeep: '#E5470F',
  teal: '#13C2B5',
  ink: '#161514',
  inkSoft: 'rgba(22,21,20,0.62)',
  inkFaint: 'rgba(22,21,20,0.10)',
  shadow: 'rgba(60,40,20,0.22)',
};

export const FONT = '"Alexandria", "Noto Sans Arabic", sans-serif';

export const useArabicFonts = () => {
  const [handle] = useState(() => delayRender('ibdaa-fonts'));
  useEffect(() => {
    Promise.all(
      [400, 600, 800, 900].map((w) => document.fonts.load(`${w} 80px "Alexandria"`, 'إبداع')),
    ).then(() => continueRender(handle));
  }, [handle]);
};

/** Layout helper: 4:5 vs 9:16. */
export const useFrameBox = () => {
  const {width, height} = useVideoConfig();
  return {W: width, H: height, tall: height / width > 1.5};
};

export const img = (p: string) => staticFile(`ibdaa/${p}`);

/** Cream paper background with a drifting dot grid and soft warm vignette. */
export const Paper: React.FC<{t: number; tone?: string}> = ({t, tone = P.cream}) => (
  <AbsoluteFill style={{background: tone}}>
    <AbsoluteFill
      style={{
        backgroundImage: `radial-gradient(${P.inkFaint} 1.6px, transparent 1.8px)`,
        backgroundSize: '36px 36px',
        backgroundPosition: `${(t * 6) % 36}px ${(t * 3) % 36}px`,
        opacity: 0.7,
      }}
    />
    <AbsoluteFill
      style={{background: 'radial-gradient(120% 90% at 50% 40%, transparent 55%, rgba(120,90,50,0.10) 100%)'}}
    />
  </AbsoluteFill>
);

/** The brand's play triangle, pointing left (RTL "forward"). Rounded corners. */
export const Tri: React.FC<{size: number; color?: string; style?: React.CSSProperties}> = ({
  size,
  color = P.orange,
  style,
}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{overflow: 'visible', display: 'block', ...style}}>
    <path
      d="M 8 50 Q 4 50 9 46.5 L 82 6 Q 90 2 90 11 L 90 89 Q 90 98 82 94 L 9 53.5 Q 4 50 8 50 Z"
      fill={color}
    />
  </svg>
);

/** Three speed bars from the logo. k grows them in with a stagger. */
export const Bars: React.FC<{w: number; k: number[]; colors?: string[]; gap?: number; thick?: number}> = ({
  w,
  k,
  colors = [P.teal, P.orange, P.teal],
  gap,
  thick,
}) => {
  const th = thick ?? w * 0.17;
  const g = gap ?? th * 0.9;
  const lens = [0.86, 1, 0.86];
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: g, alignItems: 'flex-start'}}>
      {lens.map((l, i) => (
        <div
          key={i}
          style={{
            width: w * l * clamp01(k[i] ?? 0),
            height: th,
            borderRadius: th,
            background: colors[i],
          }}
        />
      ))}
    </div>
  );
};

/** Masked reveal for a word; works for RTL. */
export const Rise: React.FC<{k: number; out?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  k,
  out = 0,
  children,
  style,
}) => (
  <span style={{display: 'inline-block', overflow: 'hidden', padding: '0.1em 0.08em 0.28em', margin: '-0.1em -0.08em -0.28em'}}>
    <span
      style={{
        display: 'inline-block',
        transform: `translateY(${(1 - k + out) * 120}%) rotate(${(1 - k) * -6}deg)`,
        transformOrigin: '100% 100%',
        ...style,
      }}
    >
      {children}
    </span>
  </span>
);

export type Clip = {src: string; len: number};

/**
 * Plays a list of pre-cut clips back to back inside the current Sequence,
 * time-stretched to exactly fill `span` seconds.
 */
export const ClipRun: React.FC<{clips: Clip[]; span: number; style?: React.CSSProperties}> = ({clips, span, style}) => {
  const total = clips.reduce((a, c) => a + c.len, 0);
  const rate = total / span;
  let at = 0;
  return (
    <>
      {clips.map((c, i) => {
        const from = Math.round(at * FPS);
        const dur = Math.round((c.len / rate) * FPS);
        at += c.len / rate;
        return (
          <Sequence key={i} from={from} durationInFrames={i === clips.length - 1 ? dur + 30 : dur} layout="none">
            <OffthreadVideo
              src={img(`clips/${c.src}.mp4`)}
              playbackRate={rate}
              muted
              style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style}}
            />
          </Sequence>
        );
      })}
    </>
  );
};

/** Clip-cut instants (seconds from the run start), for punch-ins and sound. */
export const cutTimes = (clips: Clip[], span: number) => {
  const rate = clips.reduce((a, c) => a + c.len, 0) / span;
  const out: number[] = [];
  let at = 0;
  clips.forEach((c) => {
    out.push(at);
    at += c.len / rate;
  });
  return out;
};

/** A phone with a 9:16 screen. */
export const Phone: React.FC<{w: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  w,
  children,
  style,
}) => {
  const h = w * (16 / 9);
  const bez = w * 0.035;
  return (
    <div
      style={{
        width: w + bez * 2,
        height: h + bez * 2,
        padding: bez,
        borderRadius: w * 0.13,
        background: P.ink,
        boxShadow: `0 ${w * 0.08}px ${w * 0.16}px ${P.shadow}, 0 0 0 ${w * 0.006}px rgba(255,255,255,0.08) inset`,
        ...style,
      }}
    >
      <div style={{position: 'relative', width: w, height: h, borderRadius: w * 0.1, overflow: 'hidden', background: '#000'}}>
        {children}
        <div
          style={{
            position: 'absolute',
            top: w * 0.03,
            left: '50%',
            width: w * 0.28,
            height: w * 0.075,
            marginLeft: -w * 0.14,
            borderRadius: w,
            background: P.ink,
          }}
        />
      </div>
    </div>
  );
};

/** Outline chip, like the ones on the page cover. */
export const Chip: React.FC<{k: number; children: React.ReactNode; size: number; color?: string; fill?: boolean}> = ({
  k,
  children,
  size,
  color = P.teal,
  fill = false,
}) => (
  <div
    style={{
      display: 'inline-block',
      padding: `${size * 0.32}px ${size * 0.85}px ${size * 0.42}px`,
      border: `${Math.max(2, size * 0.09)}px solid ${color}`,
      borderRadius: size * 2,
      color: fill ? P.white : color,
      background: fill ? color : 'transparent',
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: size,
      lineHeight: 1,
      transform: `scale(${0.6 + 0.4 * k}) translateY(${(1 - k) * 30}px)`,
      opacity: clamp01(k * 2),
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </div>
);

/**
 * Triangle wipe: an orange arrow (teal echo ahead of it) sweeps right→left.
 * Fully covers the frame around the middle of its 1 s window, so the scene
 * underneath can swap at `at`.
 */
export const TriWipe: React.FC<{t: number; at: number}> = ({t, at}) => {
  const {W, H} = useFrameBox();
  const p0 = (t - (at - 0.42)) / 0.8;
  if (p0 <= 0 || p0 >= 1.12) return null;
  const tri = (p: number, color: string) => {
    const k = prog(p, 0, 1, (x) => x);
    const len = W * 2.2;
    const tip = W * 1.1 - W * 3.4 * k;
    const half = (len * H) / W;
    return (
      <polygon
        points={`${tip},${H / 2} ${tip + len},${H / 2 - half} ${tip + len},${H / 2 + half}`}
        fill={color}
      />
    );
  };
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={W} height={H}>
        {tri(p0 + 0.09, P.teal)}
        {tri(p0, P.orange)}
      </svg>
    </AbsoluteFill>
  );
};

/** Gentle film grain for the light palette. */
export const LightGrain: React.FC<{frame: number}> = ({frame}) => {
  const {W, H} = useFrameBox();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'multiply', opacity: 0.06}}>
      <svg width={W} height={H}>
        <filter id="lgrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={Math.floor(frame / 2) % 61} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter="url(#lgrain)" />
      </svg>
    </AbsoluteFill>
  );
};

export {clamp01, easeInOut, easeOut, prog, rand};
