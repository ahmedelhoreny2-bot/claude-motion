import React from 'react';
import {S} from './theme';

/** Line icons on a 100×100 grid. `k` 0→1 draws the strokes on. */
const P: Record<string, string[]> = {
  honey: [
    'M30 34 H70 V40 Q78 46 78 58 V78 Q78 88 68 88 H32 Q22 88 22 78 V58 Q22 46 30 40 Z',
    'M26 26 H74 V34 H26 Z',
    'M22 60 Q36 54 50 62 Q64 70 78 62',
    'M50 62 Q52 70 49 76',
  ],
  cup: [
    'M30 82 V50 Q30 22 50 22 Q70 22 70 50 V82',
    'M24 82 H76',
    'M44 22 V14 H56 V22',
    'M38 64 Q50 70 62 64',
  ],
  seeds: [
    'M34 40 q8 -12 14 0 q-6 10 -14 0 Z',
    'M56 30 q8 -12 14 0 q-6 10 -14 0 Z',
    'M58 58 q8 -12 14 0 q-6 10 -14 0 Z',
    'M30 66 q8 -12 14 0 q-6 10 -14 0 Z',
    'M44 82 q8 -12 14 0 q-6 10 -14 0 Z',
  ],
  bowl: [
    'M16 50 H84 Q82 82 50 84 Q18 82 16 50 Z',
    'M36 90 H64',
    'M40 40 Q34 32 40 24',
    'M54 40 Q48 32 54 22',
  ],
  root: [
    'M50 14 V60',
    'M50 60 Q40 72 30 86',
    'M50 60 Q56 74 52 88',
    'M50 60 Q64 68 74 82',
    'M50 34 Q38 28 30 18',
    'M50 30 Q62 22 70 14',
  ],
  maker: [
    'M26 52 Q26 26 50 26 Q74 26 74 52 Z',
    'M18 52 H82',
    'M50 26 V36',
    'M32 64 Q32 82 50 82 Q68 82 68 64',
  ],
  car: [
    'M14 66 V54 L26 50 L36 34 H64 L76 50 L86 54 V66 Z',
    'M30 66 a8 8 0 1 0 0.1 0',
    'M70 66 a8 8 0 1 0 0.1 0',
    'M40 50 V38 M60 50 V38',
  ],
  gear: [
    'M50 30 a20 20 0 1 0 0.1 0',
    'M50 42 a8 8 0 1 0 0.1 0',
    'M50 14 V24 M50 76 V86 M14 50 H24 M76 50 H86 M25 25 L32 32 M68 68 L75 75 M75 25 L68 32 M32 68 L25 75',
  ],
  body: [
    'M50 14 a10 10 0 1 0 0.1 0',
    'M34 40 Q50 32 66 40 L70 66 M30 66 L34 40',
    'M42 40 V86 M58 40 V86',
    'M50 52 q-6 -6 -10 0 q0 6 10 12 q10 -6 10 -12 q-4 -6 -10 0',
  ],
  seal: [
    'M50 12 L58 20 L69 18 L72 29 L82 34 L78 45 L84 55 L75 62 L74 73 L63 74 L56 83 L46 78 L36 82 L30 73 L19 70 L20 59 L13 50 L20 41 L19 30 L30 27 L36 18 L46 22 Z',
    'M36 50 L46 60 L66 40',
  ],
  book: [
    'M50 26 Q36 18 16 22 V78 Q36 74 50 82 Q64 74 84 78 V22 Q64 18 50 26 Z',
    'M50 26 V82',
  ],
};

export const ICON_KEYS = Object.keys(P);

export const Icon: React.FC<{
  name: string;
  size: number;
  k?: number;
  color?: string;
  weight?: number;
  rotate?: number;
}> = ({name, size, k = 1, color = S.gold, weight = 5, rotate = 0}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{display: 'block', overflow: 'visible'}}>
    <g transform={`rotate(${rotate} 50 50)`}>
      {P[name].map((d, i) => {
        const n = P[name].length;
        const p = Math.min(1, Math.max(0, k * (1 + n * 0.25) - i * 0.25));
        return (
          <path
            key={i}
            d={d}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - p}
            fill="none"
            stroke={color}
            strokeWidth={weight}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  </svg>
);

/** Eight-point star (two overlapped squares). */
export const Star: React.FC<{
  size: number;
  k?: number;
  color?: string;
  fill?: string;
  weight?: number;
  rotate?: number;
}> = ({size, k = 1, color = S.gold, fill = 'none', weight = 3, rotate = 0}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{display: 'block', overflow: 'visible'}}>
    <g transform={`rotate(${rotate})`}>
      {[0, 45].map((a) => (
        <rect
          key={a}
          x={-34}
          y={-34}
          width={68}
          height={68}
          transform={`rotate(${a})`}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - k}
          fill={fill}
          stroke={color}
          strokeWidth={weight}
          strokeLinejoin="round"
        />
      ))}
    </g>
  </svg>
);
