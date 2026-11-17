import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, Img, staticFile} from 'remotion';
import '@fontsource/cairo/arabic-500.css';
import '@fontsource/cairo/arabic-700.css';
import '@fontsource/cairo/arabic-900.css';
import '@fontsource/cairo/latin-700.css';
import '@fontsource/cairo/latin-900.css';
import '@fontsource/amiri/arabic-700.css';
import timeline from './timeline.json';
import {clamp01, easeIn, easeOut, prog} from '../lib';

export const T = timeline;
export const FPS = T.fps;
export const W = 1080;
export const H = 1920;

/** Sedra brand palette: navy ground, sky + orange from the logo. Orange is the accent. */
export const S = {
  navy: '#071735',
  navy2: '#0D2654',
  blue: '#1E5BC6',
  sky: '#3AA0DC',
  skyHi: '#7CC6F0',
  orange: '#F28C28',
  orangeHi: '#FFB45E',
  cream: '#F6F2E9',
  creamDim: 'rgba(246,242,233,0.74)',
  muted: 'rgba(246,242,233,0.48)',
  line: 'rgba(246,242,233,0.16)',
  glass: 'rgba(246,242,233,0.07)',
};

export const SF = {
  ar: '"Cairo", system-ui, sans-serif',
  quote: '"Amiri", "Cairo", serif',
};

export const useSedraFonts = () => {
  const [handle] = useState(() => delayRender('sedra-fonts'));
  useEffect(() => {
    Promise.all([
      document.fonts.load('500 40px "Cairo"', 'ابج'),
      document.fonts.load('700 40px "Cairo"', 'ابج'),
      document.fonts.load('900 40px "Cairo"', 'ابج'),
      document.fonts.load('900 40px "Cairo"', '0123'),
      document.fonts.load('700 40px "Amiri"', 'ابج'),
    ]).then(() => continueRender(handle));
  }, [handle]);
};

/** 0..1 visibility of a scene: in over `inDur`, out over `outDur` starting at `exit`. */
export const vis = (t: number, enter: number, exit: number, inDur = 0.5, outDur = 0.45) =>
  prog(t, enter, enter + inDur, easeOut) * (1 - prog(t, exit, exit + outDur, easeIn));

/** Masked word-by-word reveal for Arabic lines (RTL, words never split). */
export const Words: React.FC<{
  text: string;
  t: number;
  at: number;
  exit?: number;
  stagger?: number;
  style?: React.CSSProperties;
  accent?: string[];
  accentColor?: string;
}> = ({text, t, at, exit = 1e9, stagger = 0.09, style, accent = [], accentColor = S.orange}) => {
  const words = text.split(' ');
  return (
    <div style={{direction: 'rtl', lineHeight: 1.25, ...style}}>
      {words.map((w, i) => {
        const k = prog(t, at + i * stagger, at + i * stagger + 0.75, easeOut);
        const out = prog(t, exit + i * 0.03, exit + i * 0.03 + 0.4, easeIn);
        return (
          <React.Fragment key={i}>
            <span
              style={{
                display: 'inline-block',
                overflow: 'hidden',
                verticalAlign: 'bottom',
                padding: '0.3em 0.08em 0.3em',
                margin: '-0.3em -0.08em -0.3em',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  transform: `translateY(${(1 - k - out) * 120}%)`,
                  color: accent.includes(w) ? accentColor : undefined,
                }}
              >
                {w}
              </span>
            </span>
            {i < words.length - 1 ? ' ' : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const Chip: React.FC<{
  k: number;
  children: React.ReactNode;
  color?: string;
  fill?: string;
  size?: number;
}> = ({k, children, color = S.orange, fill = 'rgba(242,140,40,0.12)', size = 34}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 14,
      direction: 'rtl',
      padding: '10px 30px 14px',
      borderRadius: 999,
      border: `2px solid ${color}`,
      background: fill,
      color,
      fontFamily: SF.ar,
      fontWeight: 700,
      fontSize: size,
      opacity: clamp01(k * 1.5),
      transform: `scale(${0.85 + 0.15 * k}) translateY(${(1 - k) * 20}px)`,
    }}
  >
    {children}
  </div>
);

/** Full-bleed photo with a slow push-in and a bottom fade into navy. */
export const Photo: React.FC<{
  src: string;
  t: number;
  from: number;
  dur: number;
  height?: number;
  focusY?: number;
  fade?: number;
  zoom?: number;
}> = ({src, t, from, dur, height = H, focusY = 50, fade = 0.45, zoom = 0.09}) => {
  const k = clamp01((t - from) / dur);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height, overflow: 'hidden'}}>
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: `50% ${focusY}%`,
          transform: `scale(${1 + zoom * (1 - k)})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, rgba(7,23,53,0.35) 0%, rgba(7,23,53,0) 22%, rgba(7,23,53,0) ${
            (1 - fade) * 100
          }%, ${S.navy} 100%)`,
        }}
      />
    </div>
  );
};

export const Logo: React.FC<{size: number; style?: React.CSSProperties}> = ({size, style}) => (
  <Img src={staticFile('sedra/logo.png')} style={{width: size, height: 'auto', ...style}} />
);

/** Cupping cup drawn as glass. `dirty` fills it with drifting specks, `shine` sweeps a highlight. */
export const Cup: React.FC<{size: number; t: number; dirty?: number; shine?: number; glow?: number}> = ({
  size,
  t,
  dirty = 0,
  shine = 0,
  glow = 0,
}) => {
  const specks = Array.from({length: 26}, (_, i) => i);
  const r = (n: number) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const body = 'M-80 70 C-92 -10 -70 -70 -30 -86 L-16 -92 L-16 -112 L16 -112 L16 -92 L30 -86 C70 -70 92 -10 80 70 Z';
  return (
    <svg width={size} height={size * 1.2} viewBox="-120 -150 240 288" style={{overflow: 'visible', display: 'block'}}>
      <defs>
        <linearGradient id="cupGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(246,242,233,0.30)" />
          <stop offset="55%" stopColor="rgba(124,198,240,0.10)" />
          <stop offset="100%" stopColor="rgba(246,242,233,0.22)" />
        </linearGradient>
        <clipPath id="cupClip">
          <path d={body} />
        </clipPath>
        <radialGradient id="cupGlow">
          <stop offset="0%" stopColor="rgba(58,160,220,0.55)" />
          <stop offset="100%" stopColor="rgba(58,160,220,0)" />
        </radialGradient>
      </defs>
      <ellipse cx="0" cy="0" rx={150} ry={150} fill="url(#cupGlow)" opacity={0.35 + 0.65 * glow} />
      <path d={body} fill="url(#cupGlass)" stroke="rgba(246,242,233,0.85)" strokeWidth={4} />
      <g clipPath="url(#cupClip)">
        {specks.map((i) => {
          const x = -70 + r(i) * 140 + Math.sin(t * 0.9 + i) * 6;
          const y = -70 + r(i + 40) * 135 + Math.cos(t * 0.7 + i * 2) * 6;
          const a = clamp01(dirty * 1.6 - r(i + 9) * 0.6);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={3 + r(i + 3) * 6}
              fill="none"
              stroke={S.orange}
              strokeWidth={2.5}
              opacity={a * 0.9}
            />
          );
        })}
        <rect
          x={-160 + shine * 320}
          y={-150}
          width={46}
          height={320}
          fill="rgba(255,255,255,0.55)"
          transform={`rotate(18 ${-160 + shine * 320} 0)`}
          opacity={shine > 0 && shine < 1 ? 1 : 0}
        />
      </g>
      <rect x={-22} y={-132} width={44} height={22} rx={6} fill={S.sky} />
      <rect x={-6} y={-150} width={12} height={22} rx={4} fill={S.cream} />
      <path d="M-58 -30 C-62 0 -60 30 -54 52" stroke="rgba(255,255,255,0.6)" strokeWidth={7} strokeLinecap="round" fill="none" />
      <ellipse cx="0" cy="70" rx="80" ry="10" fill="none" stroke="rgba(246,242,233,0.85)" strokeWidth={4} />
    </svg>
  );
};

export const SedraBackground: React.FC<{t: number; warm?: number}> = ({t, warm = 0}) => (
  <AbsoluteFill style={{background: `linear-gradient(180deg, ${S.navy2} 0%, ${S.navy} 60%)`}}>
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 70% 40% at 50% 38%, rgba(58,160,220,${0.18 * (1 - warm)}) 0%, rgba(58,160,220,0) 70%)`,
      }}
    />
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 70% 40% at 50% 40%, rgba(242,140,40,${0.22 * warm}) 0%, rgba(242,140,40,0) 70%)`,
      }}
    />
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs>
        <pattern
          id="sdots"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${-t * 3} ${-t * 6})`}
        >
          <circle cx="20" cy="20" r="1.3" fill="rgba(246,242,233,0.10)" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#sdots)" />
    </svg>
    <AbsoluteFill
      style={{background: 'radial-gradient(ellipse 90% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)'}}
    />
  </AbsoluteFill>
);
