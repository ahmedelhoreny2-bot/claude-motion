import React from 'react';
import {alpha, F, P} from './theme';

export type V3 = [number, number, number];
export type El = 'C' | 'H' | 'O' | 'N' | 'R';
export type Atom = {id: string; el: El; p: V3; o?: number; glow?: string; gk?: number; s?: number};
export type Bond = {a: string; b: string; order?: 1 | 2; o?: number};

const STYLE: Record<El, {r: number; c: string; hi: string; lo: string; label: string}> = {
  C: {r: 0.42, c: '#4A5175', hi: '#9AA3D6', lo: '#1B1F3A', label: '#FFFFFF'},
  H: {r: 0.27, c: '#E9EEFF', hi: '#FFFFFF', lo: '#9DA6C8', label: '#2A2F55'},
  O: {r: 0.4, c: '#FF4D6A', hi: '#FFB0BE', lo: '#8E1630', label: '#FFFFFF'},
  N: {r: 0.4, c: '#3D7BFF', hi: '#A9C6FF', lo: '#14307E', label: '#FFFFFF'},
  R: {r: 0.62, c: '#A070FF', hi: '#E0CCFF', lo: '#4A1FA0', label: '#FFFFFF'},
};

export const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

/**
 * Ball-and-stick molecule: rotate (yaw, pitch), perspective-project, depth-sort,
 * shade every atom as a lit sphere. Pure function of its props.
 */
export const Molecule3D: React.FC<{
  uid: string;
  atoms: Atom[];
  bonds: Bond[];
  yaw: number;
  pitch: number;
  scale: number;
  cx: number;
  cy: number;
  persp?: number;
  width: number;
  height: number;
  opacity?: number;
}> = ({uid, atoms, bonds, yaw, pitch, scale, cx, cy, persp = 9, width, height, opacity = 1}) => {
  const cy_ = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const spp = Math.sin(pitch);
  const proj = new Map<string, {x: number; y: number; z: number; f: number; a: Atom}>();
  for (const a of atoms) {
    const [x0, y0, z0] = a.p;
    const x1 = x0 * cy_ + z0 * sy;
    const z1 = -x0 * sy + z0 * cy_;
    const y2 = y0 * cp - z1 * spp;
    const z2 = y0 * spp + z1 * cp;
    const f = persp / (persp - z2);
    proj.set(a.id, {x: cx + x1 * scale * f, y: cy + y2 * scale * f, z: z2, f, a});
  }
  type Item = {z: number; el: React.ReactNode};
  const items: Item[] = [];
  bonds.forEach((b, i) => {
    const A = proj.get(b.a);
    const B = proj.get(b.b);
    if (!A || !B) return;
    const o = (b.o ?? 1) * Math.min(A.a.o ?? 1, B.a.o ?? 1);
    if (o <= 0.01) return;
    const f = (A.f + B.f) / 2;
    const w = 0.15 * scale * f;
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const mx = (A.x + B.x) / 2;
    const my = (A.y + B.y) / 2;
    const offs = b.order === 2 ? [-0.55, 0.55] : [0];
    items.push({
      z: (A.z + B.z) / 2 - 0.35,
      el: (
        <g key={`b${i}`} opacity={o}>
          {offs.map((d, j) => {
            const ox = nx * w * d * 1.6;
            const oy = ny * w * d * 1.6;
            const ww = b.order === 2 ? w * 0.62 : w;
            return (
              <g key={j}>
                <line x1={A.x + ox} y1={A.y + oy} x2={mx + ox} y2={my + oy} stroke={STYLE[A.a.el].lo} strokeWidth={ww + 3} strokeLinecap="round" />
                <line x1={B.x + ox} y1={B.y + oy} x2={mx + ox} y2={my + oy} stroke={STYLE[B.a.el].lo} strokeWidth={ww + 3} strokeLinecap="round" />
                <line x1={A.x + ox} y1={A.y + oy} x2={mx + ox} y2={my + oy} stroke={STYLE[A.a.el].c} strokeWidth={ww} strokeLinecap="round" />
                <line x1={B.x + ox} y1={B.y + oy} x2={mx + ox} y2={my + oy} stroke={STYLE[B.a.el].c} strokeWidth={ww} strokeLinecap="round" />
                <line
                  x1={A.x + ox - nx * ww * 0.18}
                  y1={A.y + oy - ny * ww * 0.18}
                  x2={B.x + ox - nx * ww * 0.18}
                  y2={B.y + oy - ny * ww * 0.18}
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth={ww * 0.22}
                  strokeLinecap="round"
                />
              </g>
            );
          })}
        </g>
      ),
    });
  });
  const glows: React.ReactNode[] = [];
  for (const [id, q] of proj) {
    const st = STYLE[q.a.el];
    const r = st.r * scale * q.f * (q.a.s ?? 1);
    const o = q.a.o ?? 1;
    if (o <= 0.01) continue;
    if (q.a.glow && (q.a.gk ?? 0) > 0.01) {
      glows.push(<circle key={`g${id}`} cx={q.x} cy={q.y} r={r * 3.4} fill={`url(#${uid}-glow-${q.a.glow.slice(1)})`} opacity={q.a.gk} />);
    }
    items.push({
      z: q.z,
      el: (
        <g key={`a${id}`} opacity={o}>
          <circle cx={q.x} cy={q.y} r={r} fill={`url(#${uid}-${q.a.el})`} />
          <ellipse cx={q.x - r * 0.32} cy={q.y - r * 0.38} rx={r * 0.32} ry={r * 0.2} fill="rgba(255,255,255,0.75)" transform={`rotate(-30 ${q.x - r * 0.32} ${q.y - r * 0.38})`} />
          <text
            x={q.x}
            y={q.y + r * 0.26}
            textAnchor="middle"
            fontFamily={F.mono}
            fontWeight={700}
            fontSize={r * (q.a.el === 'R' ? 0.9 : 0.82)}
            fill={st.label}
            opacity={0.92}
          >
            {q.a.el}
          </text>
        </g>
      ),
    });
  }
  items.sort((a, b) => a.z - b.z);
  const glowColors = Array.from(new Set(atoms.filter((a) => a.glow).map((a) => a.glow!)));
  return (
    <svg width={width} height={height} style={{position: 'absolute', inset: 0, overflow: 'visible', opacity}}>
      <defs>
        {(Object.keys(STYLE) as El[]).map((el) => (
          <radialGradient key={el} id={`${uid}-${el}`} cx="38%" cy="32%" r="70%">
            <stop offset="0%" stopColor={STYLE[el].hi} />
            <stop offset="45%" stopColor={STYLE[el].c} />
            <stop offset="100%" stopColor={STYLE[el].lo} />
          </radialGradient>
        ))}
        {glowColors.map((c) => (
          <radialGradient key={c} id={`${uid}-glow-${c.slice(1)}`}>
            <stop offset="0%" stopColor={c} stopOpacity={0.85} />
            <stop offset="40%" stopColor={c} stopOpacity={0.35} />
            <stop offset="100%" stopColor={c} stopOpacity={0} />
          </radialGradient>
        ))}
      </defs>
      <g style={{mixBlendMode: 'screen'}}>{glows}</g>
      {items.map((it) => it.el)}
    </svg>
  );
};

/** Shadow under a floating molecule. */
export const MolShadow: React.FC<{cx: number; cy: number; w: number; o?: number}> = ({cx, cy, w, o = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: cx - w / 2,
      top: cy - 30,
      width: w,
      height: 60,
      borderRadius: '50%',
      background: `radial-gradient(ellipse at center, ${alpha(P.ink, 0.6 * o)} 0%, rgba(0,0,0,0) 70%)`,
    }}
  />
);
