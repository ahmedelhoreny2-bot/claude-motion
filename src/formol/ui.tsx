import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp01, easeIn, easeOut, prog, rand} from '../lib';
import {CAPTIONS} from './captions';
import {alpha, F, FPS, H, P, W, sp} from './theme';

/** Deep indigo backdrop with slow aurora blobs, a drifting hex-dot grid and a vignette. */
export const Aurora: React.FC<{t: number; tint?: string; tintK?: number}> = ({t, tint = P.violet, tintK = 0}) => {
  const blobs = [
    {c: P.blue, x: 22, y: 30, r: 46, s: 0.07},
    {c: P.violet, x: 78, y: 26, r: 50, s: 0.05},
    {c: '#0FB5C8', x: 70, y: 82, r: 44, s: 0.06},
    {c: P.pink, x: 18, y: 86, r: 36, s: 0.045},
  ];
  return (
    <AbsoluteFill style={{background: `linear-gradient(160deg, ${P.bg1} 0%, ${P.bg0} 55%, ${P.bg2} 100%)`}}>
      {blobs.map((b, i) => {
        const x = b.x + Math.sin(t * b.s * 6 + i * 2) * 7;
        const y = b.y + Math.cos(t * b.s * 5 + i) * 6;
        return (
          <AbsoluteFill
            key={i}
            style={{
              background: `radial-gradient(circle ${b.r * 14}px at ${x}% ${y}%, ${alpha(b.c, 0.26)} 0%, ${alpha(b.c, 0)} 70%)`,
            }}
          />
        );
      })}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 55% 50% at 50% 50%, ${alpha(tint, 0.22 * tintK)} 0%, ${alpha(tint, 0)} 70%)`,
        }}
      />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id="dotgrid" width="44" height="38" patternUnits="userSpaceOnUse" patternTransform={`translate(${-t * 5} ${-t * 3})`}>
            <circle cx="11" cy="9.5" r="1.3" fill="rgba(245,247,255,0.13)" />
            <circle cx="33" cy="28.5" r="1.3" fill="rgba(245,247,255,0.13)" />
          </pattern>
          <radialGradient id="dgFade" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id="dgMask">
            <rect width={W} height={H} fill="url(#dgFade)" />
          </mask>
        </defs>
        <rect width={W} height={H} fill="url(#dotgrid)" mask="url(#dgMask)" />
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)'}} />
    </AbsoluteFill>
  );
};

/** Floating, softly lit particles (bokeh) — everything breathes. */
export const Bokeh: React.FC<{t: number; n?: number; opacity?: number}> = ({t, n = 26, opacity = 1}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity}}>
    {Array.from({length: n}, (_, i) => {
      const cols = [P.cyan, P.pink, P.gold, P.violet, P.lime];
      const r = 2 + rand(i * 3.1) * 7;
      const sp0 = 8 + rand(i * 1.7) * 18;
      const x = (rand(i) * W + Math.sin(t * 0.3 + i) * 30) % W;
      const y = (((rand(i * 2.3) * H - t * sp0) % H) + H) % H;
      return <circle key={i} cx={x} cy={y} r={r} fill={cols[i % cols.length]} opacity={0.12 + 0.18 * rand(i * 5.2)} />;
    })}
  </svg>
);

/** Arabic word-by-word mask reveal; padding is generous for tall Arabic glyphs. */
export const ArWords: React.FC<{
  text: string;
  t: number;
  at: number;
  out?: number;
  stagger?: number;
  dur?: number;
  style?: React.CSSProperties;
  wordStyle?: (i: number) => React.CSSProperties | undefined;
}> = ({text, t, at, out = 1e9, stagger = 0.08, dur = 0.75, style, wordStyle}) => {
  const words = text.split(' ');
  const o = prog(t, out, out + 0.4, easeIn);
  return (
    <span style={{direction: 'rtl', display: 'inline-block', ...style}}>
      {words.map((w, i) => {
        const k = prog(t, at + i * stagger, at + i * stagger + dur, easeOut);
        return (
          <React.Fragment key={i}>
            <span style={{display: 'inline-block', overflow: 'hidden', padding: '0.28em 0.08em 0.34em', margin: '-0.28em -0.08em -0.34em', verticalAlign: 'bottom'}}>
              <span
                style={{
                  display: 'inline-block',
                  transform: `translateY(${(1 - k + o) * 120}%) rotate(${(1 - k) * -4}deg)`,
                  transformOrigin: '100% 100%',
                  ...wordStyle?.(i),
                }}
              >
                {w}
              </span>
            </span>
            {i < words.length - 1 ? ' ' : null}
          </React.Fragment>
        );
      })}
    </span>
  );
};

/** LTR-isolated formula run (keeps numbers and operators in order inside RTL text). */
export const Ltr: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <span dir="ltr" style={{unicodeBidi: 'isolate', direction: 'ltr', display: 'inline-block', ...style}}>
    {children}
  </span>
);

const renderCaption = (s: string) =>
  s.split('`').map((part, i) =>
    i % 2 ? (
      <Ltr key={i} style={{fontFamily: F.mono, fontWeight: 700, color: P.gold, fontSize: '0.86em', margin: '0 0.2em'}}>
        {part}
      </Ltr>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );

/** Subtitle strip: the narration script, one line at a time. */
export const Captions: React.FC<{t: number}> = ({t}) => {
  const cur = CAPTIONS.find(([a, b]) => t >= a - 0.05 && t <= b + 0.3);
  if (!cur) return null;
  const [a, b, text] = cur;
  const k = prog(t, a, a + 0.35, easeOut);
  const o = prog(t, b, b + 0.25, easeIn);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 46,
        display: 'flex',
        justifyContent: 'center',
        opacity: k * (1 - o),
        transform: `translateY(${(1 - k) * 18 + o * 8}px)`,
      }}
    >
      <div
        dir="rtl"
        style={{
          fontFamily: F.body,
          fontWeight: 700,
          fontSize: 36,
          color: P.text,
          padding: '8px 34px 12px',
          borderRadius: 22,
          background: 'rgba(6,10,34,0.72)',
          border: `1.5px solid ${P.faint}`,
          boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
          maxWidth: 1500,
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        {renderCaption(text)}
      </div>
    </div>
  );
};

/** Numbered step badge, top-right (where Arabic reading starts). */
export const StepBadge: React.FC<{t: number; at: number; out: number; n: string; title: string; color: string}> = ({
  t,
  at,
  out,
  n,
  title,
  color,
}) => {
  const frame = t * FPS;
  const k = sp(frame, at, {damping: 13, stiffness: 160});
  const o = prog(t, out, out + 0.4, easeIn);
  if (k <= 0.001 || o >= 1) return null;
  return (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        top: 64,
        right: 80,
        display: 'flex',
        alignItems: 'center',
        gap: 22,
        opacity: clamp01(k * 1.4) * (1 - o),
        transform: `translateX(${(1 - k) * 80 - o * 40}px)`,
      }}
    >
      <div
        style={{
          width: 86,
          height: 86,
          borderRadius: 26,
          background: `linear-gradient(140deg, ${color}, ${alpha(color, 0.55)})`,
          boxShadow: `0 0 40px ${alpha(color, 0.55)}, inset 0 2px 0 rgba(255,255,255,0.45)`,
          display: 'grid',
          placeItems: 'center',
          fontFamily: F.display,
          fontSize: 54,
          color: P.ink,
          transform: `rotate(${(1 - k) * -20}deg)`,
        }}
      >
        <span style={{marginTop: 8}}>{n}</span>
      </div>
      <div style={{fontFamily: F.display, fontSize: 52, color: P.text, lineHeight: 1.1}}>
        <ArWords text={title} t={t} at={at + 0.15} out={out} />
      </div>
    </div>
  );
};

/** Frosted glass card. */
export const Panel: React.FC<{
  x: number;
  y: number;
  w: number;
  k: number;
  out?: number;
  accent?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({x, y, w, k, out = 0, accent = P.cyan, children, style}) => {
  if (k <= 0.001 || out >= 1) return null;
  return (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        padding: '30px 38px 34px',
        borderRadius: 30,
        background: `linear-gradient(160deg, rgba(40,48,130,0.72), rgba(14,18,60,0.78))`,
        border: `1.5px solid ${alpha(accent, 0.55)}`,
        boxShadow: `0 30px 80px rgba(0,0,0,0.45), 0 0 50px ${alpha(accent, 0.18)}, inset 0 1px 0 rgba(255,255,255,0.18)`,
        opacity: clamp01(k * 1.3) * (1 - out),
        transform: `translateY(${(1 - k) * 60 - out * 30}px) scale(${0.94 + 0.06 * k})`,
        transformOrigin: '50% 0%',
        fontFamily: F.body,
        color: P.text,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** A pill tag that pops in with a pointer line toward (tx, ty). */
export const Tag: React.FC<{
  t: number;
  at: number;
  out?: number;
  x: number;
  y: number;
  color: string;
  children: React.ReactNode;
  tx?: number;
  ty?: number;
  size?: number;
}> = ({t, at, out = 1e9, x, y, color, children, tx, ty, size = 34}) => {
  const k = sp(t * FPS, at, {damping: 10, stiffness: 210, mass: 0.7});
  const o = prog(t, out, out + 0.35, easeIn);
  if (k <= 0.001 || o >= 1) return null;
  const lk = prog(t, at, at + 0.5, easeOut);
  return (
    <>
      {tx !== undefined && ty !== undefined ? (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 1 - o}}>
          <line x1={x} y1={y} x2={x + (tx - x) * lk} y2={y + (ty - y) * lk} stroke={color} strokeWidth={3} strokeDasharray="2 8" strokeLinecap="round" />
          <circle cx={tx} cy={ty} r={7 * lk} fill={color} />
        </svg>
      ) : null}
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          left: x,
          top: y,
          transform: `translate(-50%,-50%) scale(${k})`,
          opacity: 1 - o,
          padding: '6px 26px 10px',
          borderRadius: 999,
          background: `linear-gradient(135deg, ${color}, ${alpha(color, 0.72)})`,
          color: P.ink,
          fontFamily: F.body,
          fontWeight: 800,
          fontSize: size,
          whiteSpace: 'nowrap',
          boxShadow: `0 10px 30px ${alpha(color, 0.45)}, inset 0 2px 0 rgba(255,255,255,0.5)`,
        }}
      >
        {children}
      </div>
    </>
  );
};

/** Expanding ring burst at (x, y) starting at `at`. */
export const Burst: React.FC<{t: number; at: number; x: number; y: number; color: string; r?: number}> = ({t, at, x, y, color, r = 160}) => {
  const k = prog(t, at, at + 0.9, easeOut);
  if (k <= 0 || k >= 1) return null;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <circle cx={x} cy={y} r={r * k} fill="none" stroke={color} strokeWidth={10 * (1 - k)} opacity={1 - k} />
      <circle cx={x} cy={y} r={r * 0.6 * k} fill="none" stroke={P.white} strokeWidth={4 * (1 - k)} opacity={0.8 * (1 - k)} />
      {Array.from({length: 10}, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + 0.3;
        const d0 = r * 0.4 * k;
        const d1 = r * (0.5 + 0.7 * k);
        return (
          <line
            key={i}
            x1={x + Math.cos(a) * d0}
            y1={y + Math.sin(a) * d0}
            x2={x + Math.cos(a) * d1}
            y2={y + Math.sin(a) * d1}
            stroke={i % 2 ? color : P.gold}
            strokeWidth={5 * (1 - k)}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};
