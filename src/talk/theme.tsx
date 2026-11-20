import React, {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import '@fontsource/aref-ruqaa/700.css';
import '@fontsource/almarai/arabic-700.css';
import '@fontsource/almarai/arabic-800.css';
import '@fontsource/almarai/700.css';
import '@fontsource/almarai/800.css';
import '@fontsource/amiri/arabic-700.css';

/** SedraTalk look: emerald, gold and parchment — a manuscript feel, not the ad's navy/orange. */
export const G = {
  deep: '#0B231D',
  green: '#123A30',
  emerald: '#1E5A47',
  gold: '#C9A24A',
  goldHi: '#E9CD82',
  cream: '#F4ECD8',
  creamDim: 'rgba(244,236,216,0.78)',
  muted: 'rgba(244,236,216,0.5)',
  line: 'rgba(201,162,74,0.45)',
  glass: 'rgba(11,35,29,0.62)',
  red: '#B5473A',
};

export const GF = {
  title: '"Aref Ruqaa", "Amiri", serif',
  body: '"Almarai", system-ui, sans-serif',
  quote: '"Amiri", serif',
};

export const useTalkFonts = () => {
  const [handle] = useState(() => delayRender('talk-fonts'));
  useEffect(() => {
    Promise.all([
      document.fonts.load('700 40px "Aref Ruqaa"', 'ابج'),
      document.fonts.load('800 40px "Almarai"', 'ابج'),
      document.fonts.load('700 40px "Almarai"', 'ابج'),
      document.fonts.load('800 40px "Almarai"', '0123'),
      document.fonts.load('700 40px "Amiri"', 'ابج'),
      document.fonts.load('500 40px "Cairo"', 'ابج'),
    ]).then(() => continueRender(handle));
  }, [handle]);
};

/** Pointed (mihrab) arch as an SVG path inside a box. */
export const archPath = (x: number, y: number, w: number, h: number) =>
  `M ${x} ${y + h} V ${y + w * 0.55} C ${x} ${y + w * 0.22}, ${x + w * 0.28} ${y + w * 0.06}, ${x + w / 2} ${y} C ${x + w * 0.72} ${y + w * 0.06}, ${x + w} ${y + w * 0.22}, ${x + w} ${y + w * 0.55} V ${y + h} Z`;

/** Eight-petal rosette lattice (girih-like), slow drift. */
export const Lattice: React.FC<{t: number; width: number; height: number; opacity?: number}> = ({t, width, height, opacity = 0.1}) => {
  const cell = 180;
  const items = [];
  for (let y = -1; y < height / cell + 2; y++) {
    for (let x = -1; x < width / cell + 2; x++) {
      const cx = x * cell + (y % 2 ? cell / 2 : 0);
      const cy = y * cell * 0.86;
      items.push(
        <g key={`${x}-${y}`} transform={`translate(${cx} ${cy})`}>
          {Array.from({length: 8}, (_, i) => (
            <ellipse key={i} rx={38} ry={12} transform={`rotate(${i * 22.5}) translate(34 0)`} fill="none" stroke={G.gold} strokeWidth={1.4} />
          ))}
          <circle r={9} fill="none" stroke={G.gold} strokeWidth={1.4} />
        </g>,
      );
    }
  }
  return (
    <svg width={width} height={height} style={{position: 'absolute', inset: 0, opacity}}>
      <g transform={`translate(${(-t * 4) % cell} ${(-t * 6) % (cell * 0.86)})`}>{items}</g>
    </svg>
  );
};

/** Gold divider: line — diamond — line. `k` draws it from the middle out. */
export const Divider: React.FC<{k: number; width?: number}> = ({k, width = 520}) => (
  <svg width={width} height={30} viewBox={`0 0 ${width} 30`} style={{display: 'block', margin: '0 auto'}}>
    <line x1={width / 2 - 26} y1={15} x2={width / 2 - 26 - (width / 2 - 30) * k} y2={15} stroke={G.gold} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={width / 2 + 26} y1={15} x2={width / 2 + 26 + (width / 2 - 30) * k} y2={15} stroke={G.gold} strokeWidth={2.5} strokeLinecap="round" />
    <rect x={width / 2 - 9} y={6} width={18} height={18} transform={`rotate(45 ${width / 2} 15) scale(1)`} fill={G.gold} opacity={Math.min(1, k * 3)} />
  </svg>
);
