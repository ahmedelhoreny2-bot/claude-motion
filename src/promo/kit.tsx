import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, interpolate} from 'remotion';
import '@fontsource/lalezar/arabic-400.css';
import '@fontsource/lalezar/latin-400.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-500.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-700.css';
import '@fontsource/ibm-plex-sans-arabic/latin-700.css';
import {clamp01, easeIn, easeOut, prog, rand} from '../lib';
import {Extrude, P3, shade} from './space';
import {F, FPS, H, P, W} from './theme';

export const useBrandFonts = () => {
  const [handle] = useState(() => delayRender('cairo'));
  useEffect(() => {
    Promise.all(
      [
        '400 100px Lalezar',
        '500 100px "IBM Plex Sans Arabic"',
        '700 100px "IBM Plex Sans Arabic"',
      ].map((f) => document.fonts.load(f, 'إبداع')),
    ).then(() => continueRender(handle));
  }, [handle]);
};

/* ---------- logo ---------- */

/** The brand play-triangle, pointing left (the direction Arabic reads). Box 230 × 266. */
export const Tri: React.FC<{size: number; color?: string; style?: React.CSSProperties}> = ({
  size,
  color = P.orange,
  style,
}) => (
  <svg
    width={size}
    height={size * 1.157}
    viewBox="-14 -14 258 294"
    style={{overflow: 'visible', display: 'block', ...style}}
  >
    <path
      d="M 6 133 L 222 6 L 222 260 Z"
      fill={color}
      stroke={color}
      strokeWidth={26}
      strokeLinejoin="round"
    />
  </svg>
);

const LINES = [
  {y: -66, len: 115, c: P.teal},
  {y: 0, len: 127, c: P.orange},
  {y: 66, len: 115, c: P.teal},
];

/**
 * Full mark: triangle + three speed lines, centred on the triangle's right edge.
 * `tri` scales the triangle, `lines[i]` draws each line out (0..1).
 */
export const Mark: React.FC<{
  scale?: number;
  tri?: number;
  lines?: number[];
  triRot?: number;
}> = ({scale = 1, tri = 1, lines = [1, 1, 1], triRot = 0}) => (
  <div style={{position: 'relative', width: 0, height: 0, transform: `scale(${scale})`}}>
    <div
      style={{
        position: 'absolute',
        left: -230 + 16,
        top: -133,
        transform: `scale(${tri}) rotate(${triRot}deg)`,
        transformOrigin: '60% 50%',
      }}
    >
      <Tri size={230} />
    </div>
    {LINES.map((l, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: 44,
          top: l.y - 13.5,
          height: 27,
          width: Math.max(27, l.len * clamp01(lines[i])),
          opacity: lines[i] > 0.01 ? 1 : 0,
          borderRadius: 14,
          background: l.c,
        }}
      />
    ))}
  </div>
);

/* ---------- type ---------- */

/** Masked word-by-word reveal, right-to-left. `start` in seconds. */
export const Words: React.FC<{
  text: string;
  t: number;
  start: number;
  stagger?: number;
  dur?: number;
  out?: number;
  size: number;
  weight?: number;
  color?: string;
  accent?: Record<number, string>;
  style?: React.CSSProperties;
}> = ({text, t, start, stagger = 0.09, dur = 0.7, out, size, weight = 900, color = P.cream, accent = {}, style}) => {
  const words = text.split(' ');
  const o = out === undefined ? 0 : prog(t, out, out + 0.4, easeIn);
  return (
    <div
      dir="rtl"
      style={{
        fontFamily: weight >= 900 ? F.display : F.ar,
        fontWeight: weight >= 900 ? 400 : weight,
        fontSize: size,
        lineHeight: weight >= 900 ? 1.3 : 1.4,
        color,
        textAlign: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        columnGap: size * 0.26,
        ...P3,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const a = start + i * stagger;
        const k = prog(t, a, a + dur, easeOut);
        // entrance speed drives the stretch: fast words smear toward the lens
        const vel = (k - prog(t - 1 / FPS, a, a + dur, easeOut)) * FPS;
        const st = Math.min(0.55, vel * 0.09);
        const ko = clamp01(o * 1.4 - i * 0.08);
        return (
          <span key={i} style={{display: 'inline-block', ...P3}}>
            <span
              style={{
                display: 'inline-block',
                color: accent[i] ?? color,
                opacity: clamp01(k * 2.2) * (1 - clamp01((ko - 0.3) / 0.5)),
                transform: `translateZ(${-900 * (1 - k) + 520 * ko}px) translateY(${(1 - k) * 90 - ko * 40}px) rotateX(${(1 - k) * -78 + ko * 30}deg) rotateY(${(1 - k) * 14}deg) scale(${1 - st * 0.25}, ${1 + st})`,
                transformOrigin: '50% 100%',
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/* ---------- transitions ---------- */

/**
 * The signature transition: the logo's three speed lines sweep right → left
 * across the frame, fully covering it at `at`.
 */
export const SpeedWipe: React.FC<{t: number; at: number}> = ({t, at}) => {
  const d = 0.62;
  if (t < at - d || t > at + d) return null;
  const bands = [
    {c: P.teal, top: -260, h: 900, lag: 0.05},
    {c: P.orange, top: 560, h: 860, lag: 0},
    {c: P.teal, top: 1320, h: 900, lag: 0.08},
  ];
  return (
    <AbsoluteFill style={{pointerEvents: 'none', ...P3}}>
      {bands.map((b, i) => {
        const k = prog(t, at - d + b.lag, at + d + b.lag - 0.1, (x) => x);
        // in: leading edge sweeps from right to left; out: trailing edge follows.
        const lead = interpolate(k, [0, 0.5], [W + 400, -400], {extrapolateRight: 'clamp', easing: easeOut});
        const trail = interpolate(k, [0.5, 1], [W + 400, -420], {extrapolateLeft: 'clamp', easing: easeIn});
        const width = Math.max(0, trail - lead);
        return (
          <Extrude
            key={i}
            depth={70}
            layers={4}
            back={<div style={{position: 'absolute', inset: 0, background: shade(b.c, 0.5), borderRadius: b.h / 2}} />}
            style={{position: 'absolute', top: b.top, left: lead, width, height: b.h, transform: `translateZ(${140 + i * 50}px) rotateY(${-10 + i * 6}deg)`}}
          >
            <div style={{width: '100%', height: b.h, background: b.c, borderRadius: b.h / 2}} />
          </Extrude>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- texture ---------- */

export const Backdrop: React.FC<{t: number; tint?: string; glow?: number}> = ({t}) => (
  <AbsoluteFill style={{background: P.bg}}>
    <AbsoluteFill
      style={{
        backgroundImage: `radial-gradient(${P.line} 2px, transparent 2.5px)`,
        backgroundSize: '48px 48px',
        backgroundPosition: `${-t * 9}px ${t * 4}px`,
        opacity: 0.55,
      }}
    />
  </AbsoluteFill>
);

/** Floating confetti-shapes in three depth layers (2.5D parallax). */
export const Floaters: React.FC<{t: number; k: number; seed?: number; count?: number}> = ({t, k, seed = 1, count = 18}) => (
  <AbsoluteFill style={{pointerEvents: 'none', ...P3}}>
    {Array.from({length: count}).map((_, i) => {
      const r = (n: number) => rand(seed * 100 + i * 7 + n);
      const depth = 0.4 + r(1) * 1.2;
      const kind = Math.floor(r(2) * 3);
      const c = [P.teal, P.teal, P.ink][Math.floor(r(3) * 3)];
      const size = 18 + 40 * depth;
      const x = r(4) * W + Math.sin(t * 0.6 + i) * 20 * depth - t * 14 * depth;
      const y = r(5) * H + Math.cos(t * 0.5 + i * 2) * 26 * depth;
      const xx = ((x % (W + 200)) + W + 200) % (W + 200) - 100;
      const kk = clamp01(k * 1.6 - r(6) * 0.6);
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: xx,
            top: y,
            width: kind === 2 ? size * 1.8 : size,
            height: size * (kind === 2 ? 0.45 : 1),
            borderRadius: kind === 0 ? '50%' : kind === 2 ? size : size * 0.22,
            background: kind === 1 ? 'transparent' : c,
            border: kind === 1 ? `${Math.max(4, size * 0.16)}px solid ${c}` : undefined,
            transform: `translateZ(${(depth - 1) * 700}px) scale(${kk}) rotateX(${t * 50 * (r(9) - 0.5)}deg) rotateY(${t * 70 * (r(10) - 0.5)}deg) rotate(${t * 30 * (r(7) - 0.5) + r(8) * 180}deg)`,
            opacity: (0.35 + 0.55 * (depth - 0.4) / 1.2) * kk,
          }}
        />
      );
    })}
  </AbsoluteFill>
);

/** Section label that sits at the top of each showcase card. */
export const Label: React.FC<{t: number; start: number; out: number; text: string}> = ({t, start, out, text}) => {
  const k = prog(t, start, start + 0.6, easeOut);
  const o = prog(t, out - 0.35, out, easeIn);
  return (
    <div style={{position: 'absolute', top: 250, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div
        dir="rtl"
        style={{
          fontFamily: F.display,
          fontWeight: 400,
          fontSize: 88,
          color: P.cream,
          opacity: k * (1 - o),
          transform: `translateY(${(1 - k) * 40 - o * 30}px)`,
          display: 'flex',
          alignItems: 'center',
          gap: 26,
        }}
      >
        <span>{text}</span>
        <div style={{width: 64 * k, height: 14, borderRadius: 7, background: P.teal}} />
      </div>
    </div>
  );
};

export const sec = (frame: number) => frame / FPS;
