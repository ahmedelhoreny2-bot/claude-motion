import React from 'react';

/**
 * Colour icons with a 2.5D look: every icon is drawn twice, a dark extruded copy
 * offset down-right for depth, then the lit face with gradients and a highlight.
 * 200×200 grid.
 */

const gearPath = (cx: number, cy: number, r: number, teeth: number, depth: number) => {
  const pts: string[] = [];
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2;
    const rr = i % 4 < 2 ? r + depth : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
};

type Part = {d: string; fill: string; stroke?: string; sw?: number};

const P: Record<string, Part[]> = {
  car: [
    {d: 'M24 128 Q24 108 44 104 L66 74 Q72 66 84 66 L128 66 Q140 66 146 74 L166 102 Q182 106 182 124 L182 138 Q182 146 174 146 L32 146 Q24 146 24 138 Z', fill: 'url(#gOrange)'},
    {d: 'M76 78 L94 78 L94 102 L60 102 Z', fill: 'url(#gGlass)'},
    {d: 'M104 78 L128 78 Q134 78 138 84 L150 102 L104 102 Z', fill: 'url(#gGlass)'},
    {d: 'M60 146 m-20 0 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0', fill: '#1D2F7A'},
    {d: 'M60 146 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0', fill: '#E8EEF8'},
    {d: 'M148 146 m-20 0 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0', fill: '#1D2F7A'},
    {d: 'M148 146 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0', fill: '#E8EEF8'},
    {d: 'M170 114 h10 v10 h-10 Z', fill: '#FFE08A'},
  ],
  gear: [
    {d: gearPath(100, 100, 62, 10, 16), fill: 'url(#gBlue)'},
    {d: 'M100 100 m-26 0 a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0', fill: '#FFF8EC'},
    {d: 'M100 100 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0', fill: '#1D2F7A'},
  ],
  wrench: [
    {d: 'M150 34 a34 34 0 0 0 -40 44 L40 148 a16 16 0 0 0 22 22 L132 100 a34 34 0 0 0 44 -40 L156 80 L136 76 L132 56 Z', fill: 'url(#gSteel)'},
    {d: 'M50 158 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0', fill: '#1D2F7A'},
  ],
  helmet: [
    {d: 'M40 132 Q40 62 100 58 Q160 62 160 132 Z', fill: 'url(#gOrange)'},
    {d: 'M22 132 H178 Q182 132 182 138 V146 H18 V138 Q18 132 22 132 Z', fill: '#D9731A'},
    {d: 'M88 58 H112 V132 H88 Z', fill: '#FFB35C'},
    {d: 'M58 98 Q64 76 82 68', fill: 'none', stroke: 'rgba(255,255,255,0.7)', sw: 7},
  ],
  thermo: [
    {d: 'M84 40 a16 16 0 0 1 32 0 V122 a30 30 0 1 1 -32 0 Z', fill: '#FFF8EC'},
    {d: 'M92 70 H108 V128 a20 20 0 1 1 -16 0 Z', fill: 'url(#gRed)'},
    {d: 'M124 52 h18 M124 72 h12 M124 92 h18', fill: 'none', stroke: '#1D2F7A', sw: 6},
  ],
  shield: [
    {d: 'M100 24 L162 46 V96 Q162 148 100 178 Q38 148 38 96 V46 Z', fill: 'url(#gBlue)'},
    {d: 'M70 102 L92 124 L134 80', fill: 'none', stroke: '#FFF8EC', sw: 16},
  ],
  body: [
    {d: 'M100 28 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0', fill: 'url(#gBlue)'},
    {d: 'M62 64 Q100 54 138 64 Q150 68 150 82 L150 128 H132 V178 H68 V128 H50 V82 Q50 68 62 64 Z', fill: 'url(#gBlue)'},
    {d: 'M100 118 q-14 -16 -26 -4 q-8 10 4 24 l22 18 l22 -18 q12 -14 4 -24 q-12 -12 -26 4 Z', fill: 'url(#gRed)'},
  ],
  book: [
    {d: 'M100 52 Q70 36 26 42 V154 Q70 148 100 164 Q130 148 174 154 V42 Q130 36 100 52 Z', fill: 'url(#gOrange)'},
    {d: 'M100 58 Q72 46 36 50 V144 Q72 140 100 154 Z', fill: '#FFF8EC'},
    {d: 'M100 58 Q128 46 164 50 V144 Q128 140 100 154 Z', fill: '#F3E6CF'},
    {d: 'M128 50 V96 L138 88 L148 96 V48', fill: '#2FA3DF'},
    {d: 'M48 78 Q70 74 88 80 M48 98 Q70 94 88 100 M48 118 Q70 114 88 120', fill: 'none', stroke: '#D9B98A', sw: 4},
  ],
  steth: [
    {d: 'M60 30 V80 Q60 120 96 120 Q132 120 132 80 V30', fill: 'none', stroke: '#1D2F7A', sw: 10},
    {d: 'M96 120 V140 Q96 170 126 170 Q150 170 150 146', fill: 'none', stroke: '#1D2F7A', sw: 10},
    {d: 'M150 126 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0', fill: 'url(#gSteel)'},
    {d: 'M150 126 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0', fill: '#2FA3DF'},
    {d: 'M60 30 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0', fill: '#F39325'},
    {d: 'M132 30 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0', fill: '#F39325'},
  ],
};

const Defs: React.FC<{id: string}> = ({id}) => (
  <defs>
    {[
      ['gOrange', '#FFC36B', '#F39325', '#D9731A'],
      ['gBlue', '#7FD0F5', '#2FA3DF', '#1D6FB5'],
      ['gRed', '#FF8A7A', '#E5483A', '#B52A20'],
      ['gSteel', '#F2F5F9', '#BCC8D6', '#8494A8'],
      ['gGlass', '#E6F7FF', '#A9DDF5', '#6FBFE6'],
    ].map(([n, a, b, c]) => (
      <linearGradient key={n} id={`${n}-${id}`} x1="0" y1="0" x2="0.7" y2="1">
        <stop offset="0" stopColor={a} />
        <stop offset="0.55" stopColor={b} />
        <stop offset="1" stopColor={c} />
      </linearGradient>
    ))}
  </defs>
);

const layer = (parts: Part[], id: string, flat?: string) =>
  parts.map((p, i) => {
    const fill = p.fill === 'none' ? 'none' : flat ?? p.fill.replace(/url\(#(\w+)\)/, `url(#$1-${id})`);
    const stroke = p.stroke ? flat ?? p.stroke : undefined;
    return <path key={i} d={p.d} fill={fill} stroke={stroke} strokeWidth={p.sw} strokeLinecap="round" strokeLinejoin="round" />;
  });

export const Icon3D: React.FC<{name: string; size: number; spin?: number; id: string}> = ({name, size, spin = 0, id}) => {
  const parts = P[name];
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{overflow: 'visible', display: 'block'}}>
      <Defs id={id} />
      <g transform={`translate(5 9) rotate(${spin} 100 100)`}>{layer(parts, id, '#10183F')}</g>
      <g transform={`translate(2.5 4.5) rotate(${spin} 100 100)`}>{layer(parts, id, '#2A3870')}</g>
      <g transform={`rotate(${spin} 100 100)`}>{layer(parts, id)}</g>
      <ellipse cx="72" cy="58" rx="30" ry="12" fill="rgba(255,255,255,0.22)" transform="rotate(-25 72 58)" />
    </svg>
  );
};
