import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, staticFile} from 'remotion';
import {clamp01, easeIn, easeOut, prog, rand} from '../lib';
import {N, NF, NH, NW, RAINBOW} from './theme';

/** Pop-in transform from a spring value k (0..1, may overshoot) and exit e (0..1). */
export const popStyle = (k: number, e = 0, rot = 0, dy = 40): React.CSSProperties => ({
  opacity: clamp01(k * 3) * (1 - e),
  transform: `translateY(${(1 - k) * dy - e * 30}px) scale(${0.6 + 0.4 * k - e * 0.08}) rotate(${rot * k}deg)`,
});

export const Pill: React.FC<{
  bg: string;
  color?: string;
  size?: number;
  font?: 'display' | 'body';
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({bg, color = N.white, size = 64, font = 'display', icon, style, children}) => (
  <div
    style={{
      direction: 'rtl',
      display: 'inline-flex',
      alignItems: 'center',
      gap: size * 0.3,
      background: bg,
      color,
      fontFamily: font === 'display' ? NF.display : NF.body,
      fontWeight: font === 'body' ? 800 : 400,
      fontSize: size,
      lineHeight: 1.25,
      padding: `${size * 0.2}px ${size * 0.5}px ${size * 0.12}px`,
      borderRadius: size * 0.6,
      boxShadow: `0 ${size * 0.12}px 0 rgba(0,0,0,0.16), 0 ${size * 0.3}px ${size * 0.6}px ${N.shadow}`,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {icon}
    <span>{children}</span>
  </div>
);

/** White-bordered photo/video card, like a print stuck on the wall. */
export const Card: React.FC<{
  src: string;
  video?: boolean;
  w: number;
  h: number;
  border?: number;
  fit?: 'cover' | 'contain';
  pos?: string;
  style?: React.CSSProperties;
  zoom?: number;
}> = ({src, video, w, h, border = 14, pos = 'center', style, zoom = 1}) => {
  const media: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: pos,
    transform: `scale(${zoom})`,
  };
  return (
    <div
      style={{
        width: w,
        height: h,
        padding: border,
        background: N.white,
        borderRadius: 34,
        boxShadow: `0 24px 60px ${N.shadow}`,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <div style={{width: '100%', height: '100%', overflow: 'hidden', borderRadius: 22}}>
        {video ? (
          <OffthreadVideo src={staticFile(src)} muted style={media} />
        ) : (
          <Img src={staticFile(src)} style={media} />
        )}
      </div>
    </div>
  );
};

/** Full-bleed blurred photo, darkened, as a backdrop for a card. */
export const BlurBg: React.FC<{src: string; t: number; tint?: string}> = ({src, t, tint = N.shade}) => (
  <AbsoluteFill style={{overflow: 'hidden', background: N.navy}}>
    <Img
      src={staticFile(src)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        filter: 'blur(38px) saturate(1.3)',
        transform: `scale(${1.25 + t * 0.006})`,
      }}
    />
    <AbsoluteFill style={{background: tint}} />
  </AbsoluteFill>
);

/** Cream paper with drifting confetti: dots, rings and little stars. */
export const Confetti: React.FC<{t: number; seed?: number; count?: number}> = ({t, seed = 1, count = 26}) => (
  <AbsoluteFill style={{background: `radial-gradient(circle at 50% 38%, ${N.cream} 0%, ${N.creamDeep} 100%)`}}>
    <svg width={NW} height={NH} style={{position: 'absolute'}}>
      {Array.from({length: count}, (_, i) => {
        const r = (k: number) => rand(seed * 97 + i * 13 + k);
        const x = r(1) * NW;
        const y = ((r(2) * NH + t * (14 + r(3) * 22)) % (NH + 80)) - 40;
        const c = RAINBOW[i % RAINBOW.length];
        const s = 10 + r(4) * 18;
        const rot = t * (r(5) - 0.5) * 90;
        const kind = i % 3;
        return (
          <g key={i} transform={`translate(${x},${y}) rotate(${rot})`} opacity={0.55}>
            {kind === 0 && <circle r={s * 0.6} fill={c} />}
            {kind === 1 && <circle r={s * 0.7} fill="none" stroke={c} strokeWidth={5} />}
            {kind === 2 && <Star r={s} fill={c} />}
          </g>
        );
      })}
    </svg>
  </AbsoluteFill>
);

export const Star: React.FC<{r: number; fill: string}> = ({r, fill}) => {
  const pts = Array.from({length: 10}, (_, i) => {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${Math.cos(a) * rr},${Math.sin(a) * rr}`;
  }).join(' ');
  return <polygon points={pts} fill={fill} strokeLinejoin="round" />;
};

/**
 * Rainbow iris between scenes: three rings grow out of the centre to cover the frame,
 * then open from the middle in reverse order. The scene swaps under full cover (NT.wipe).
 */
export const Iris: React.FC<{t: number; starts: number[]}> = ({t, starts}) => {
  const R = Math.hypot(NW, NH) / 2 + 20;
  const cols = [N.yellow, N.pink, N.blue];
  const layers: React.ReactNode[] = [];
  starts.forEach((s, w) => {
    const lt = t - s;
    if (lt < 0 || lt > 1) return;
    cols.forEach((c, i) => {
      const outer = R * prog(lt, i * 0.06, i * 0.06 + 0.3, easeIn);
      const inner = R * prog(lt, 0.42 + (2 - i) * 0.06, 0.42 + (2 - i) * 0.06 + 0.36, easeOut);
      if (outer <= inner + 0.5) return;
      const cx = NW / 2;
      const cy = NH / 2;
      const d = `M ${cx - outer} ${cy} a ${outer} ${outer} 0 1 0 ${outer * 2} 0 a ${outer} ${outer} 0 1 0 ${-outer * 2} 0 Z
        M ${cx - inner} ${cy} a ${inner} ${inner} 0 1 0 ${inner * 2} 0 a ${inner} ${inner} 0 1 0 ${-inner * 2} 0 Z`;
      layers.push(<path key={`${w}-${i}`} d={d} fill={c} fillRule="evenodd" />);
    });
  });
  if (!layers.length) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={NW} height={NH}>{layers}</svg>
    </AbsoluteFill>
  );
};

type IconProps = {size: number; color?: string};

export const PhoneIcon: React.FC<IconProps> = ({size, color = N.white}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      fill={color}
      d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"
    />
  </svg>
);

export const ChatIcon: React.FC<IconProps> = ({size, color = N.white}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path fill={color} d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.3-1.3A10 10 0 1 0 12 2z" />
    <path
      fill={N.green}
      transform="translate(5.2 5.2) scale(0.57)"
      d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"
    />
  </svg>
);

export const PinIcon: React.FC<IconProps> = ({size, color = N.pink}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path fill={color} d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7z" />
    <circle cx="12" cy="9" r="2.6" fill={N.white} />
  </svg>
);

export const SunIcon: React.FC<IconProps> = ({size, color = N.orange}) => (
  <svg width={size} height={size} viewBox="-12 -12 24 24">
    <circle r="5" fill={color} />
    {Array.from({length: 8}, (_, i) => (
      <line
        key={i}
        x1="0"
        y1="-7.5"
        x2="0"
        y2="-10.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        transform={`rotate(${i * 45})`}
      />
    ))}
  </svg>
);

export const SunsetIcon: React.FC<IconProps> = ({size, color = N.pink}) => (
  <svg width={size} height={size} viewBox="-12 -12 24 24">
    <path d="M -6 3 A 6 6 0 0 1 6 3 Z" fill={color} />
    {[-60, -30, 0, 30, 60].map((a) => (
      <line key={a} x1="0" y1="-5" x2="0" y2="-8.5" stroke={color} strokeWidth="2" strokeLinecap="round" transform={`translate(0 3) rotate(${a})`} />
    ))}
    <line x1="-10" y1="6" x2="10" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const ClockIcon: React.FC<IconProps & {t?: number}> = ({size, color = N.blue, t = 0}) => (
  <svg width={size} height={size} viewBox="-12 -12 24 24">
    <circle r="10" fill={N.white} stroke={color} strokeWidth="2.4" />
    <line x1="0" y1="0" x2="0" y2="-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" transform={`rotate(${t * 30})`} />
    <line x1="0" y1="0" x2="4.5" y2="0" stroke={N.pink} strokeWidth="2.2" strokeLinecap="round" transform={`rotate(${t * 3})`} />
  </svg>
);

export const CheckDot: React.FC<IconProps & {bg: string}> = ({size, bg}) => (
  <svg width={size} height={size} viewBox="-12 -12 24 24">
    <circle r="11" fill={N.white} />
    <path d="M -5 0 L -1.5 3.8 L 5.5 -4" fill="none" stroke={bg} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
