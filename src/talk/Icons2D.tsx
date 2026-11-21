import React from 'react';

/**
 * Flat 2D illustrated icons: solid fills, one darker tone for shading, a dark ink
 * outline, drawn like stickers. `lt` is seconds since the icon appeared, used for
 * each icon's small idle motion. 200×200 grid.
 */
const INK = '#2B1D12';
const C = {
  orange: '#F39325',
  orangeDk: '#D9731A',
  blue: '#2FA3DF',
  blueDk: '#1D6FB5',
  cream: '#FFF8EC',
  red: '#E5483A',
  redDk: '#B52A20',
  gold: '#FFC968',
  grey: '#C9D2DC',
  greyDk: '#8E9BAA',
  green: '#3DBE8B',
};

const o = {stroke: INK, strokeWidth: 7, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};

const gear = (cx: number, cy: number, r: number, teeth: number, depth: number) => {
  const pts: string[] = [];
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2;
    const rr = i % 4 < 2 ? r + depth : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
};

const Car: React.FC<{lt: number}> = ({lt}) => {
  const bump = Math.abs(Math.sin(lt * 10)) * -4;
  const wheel = lt * 540;
  return (
    <g>
      <g transform={`translate(0 ${bump})`}>
        <path d="M20 132 Q20 112 40 108 L64 76 Q70 68 82 68 H128 Q140 68 146 76 L170 106 Q184 110 184 128 V140 Q184 148 176 148 H28 Q20 148 20 140 Z" fill={C.red} {...o} />
        <path d="M30 132 H176 V140 Q176 146 170 146 H34 Q30 146 30 140 Z" fill={C.redDk} />
        <path d="M76 80 H96 V106 H58 Z" fill={C.blue} {...o} strokeWidth={5} />
        <path d="M106 80 H128 Q134 80 138 86 L152 106 H106 Z" fill={C.blue} {...o} strokeWidth={5} />
        <rect x="168" y="116" width="12" height="10" rx="3" fill={C.gold} />
      </g>
      {[60, 148].map((x) => (
        <g key={x} transform={`rotate(${wheel} ${x} 150)`}>
          <circle cx={x} cy={150} r={21} fill={INK} />
          <circle cx={x} cy={150} r={9} fill={C.grey} />
          <path d={`M${x} 141 V159 M${x - 9} 150 H${x + 9}`} stroke={INK} strokeWidth={3} />
        </g>
      ))}
    </g>
  );
};

const Gear: React.FC<{lt: number}> = ({lt}) => (
  <g transform={`rotate(${lt * 80} 100 100)`}>
    <path d={gear(100, 100, 60, 10, 18)} fill={C.blue} {...o} />
    <circle cx={100} cy={100} r={36} fill={C.blueDk} />
    <circle cx={100} cy={100} r={22} fill={C.cream} {...o} />
  </g>
);

const Wrench: React.FC<{lt: number}> = ({lt}) => (
  <g transform={`rotate(${Math.sin(lt * 6) * 14} 100 100)`}>
    <path d="M150 30 A36 36 0 0 0 108 76 L36 148 A17 17 0 0 0 60 172 L132 100 A36 36 0 0 0 178 58 L156 80 L134 76 L130 54 Z" fill={C.grey} {...o} />
    <path d="M48 150 L120 78" stroke={C.greyDk} strokeWidth={8} strokeLinecap="round" />
    <circle cx={48} cy={160} r={6} fill={INK} />
  </g>
);

const Helmet: React.FC<{lt: number}> = ({lt}) => (
  <g transform={`rotate(${Math.sin(lt * 3) * 5} 100 140)`}>
    <path d="M36 134 Q36 60 100 56 Q164 60 164 134 Z" fill={C.orange} {...o} />
    <path d="M88 56 H112 V134 H88 Z" fill={C.gold} {...o} strokeWidth={5} />
    <path d="M140 134 Q140 84 116 64 Q164 70 164 134 Z" fill={C.orangeDk} />
    <path d="M18 134 H182 V150 H18 Z" fill={C.orangeDk} {...o} />
  </g>
);

const Thermo: React.FC<{lt: number}> = ({lt}) => {
  const lvl = Math.min(1, lt / 1.1);
  const top = 128 - lvl * 70;
  return (
    <g>
      <path d="M82 36 A18 18 0 0 1 118 36 V118 A32 32 0 1 1 82 118 Z" fill={C.cream} {...o} />
      <path d={`M92 ${top} H108 V128 A22 22 0 1 1 92 128 Z`} fill={C.red} />
      <circle cx={100} cy={146} r={22} fill={C.red} />
      <circle cx={93} cy={140} r={6} fill="rgba(255,255,255,0.6)" />
      <path d="M126 50 H144 M126 72 H138 M126 94 H144" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <g opacity={lvl > 0.8 ? 1 : 0}>
        <path d="M150 30 l6 -12 M164 40 l12 -6 M162 56 l14 2" stroke={C.red} strokeWidth={6} strokeLinecap="round" />
      </g>
    </g>
  );
};

const Shield: React.FC<{lt: number}> = ({lt}) => {
  const chk = Math.min(1, Math.max(0, (lt - 0.15) / 0.5));
  return (
    <g>
      <path d="M100 20 L164 44 V96 Q164 150 100 180 Q36 150 36 96 V44 Z" fill={C.green} {...o} />
      <path d="M100 20 L164 44 V96 Q164 150 100 180 Z" fill="#2E9E72" />
      <path d="M100 20 L164 44 V96 Q164 150 100 180 Q36 150 36 96 V44 Z" fill="none" {...o} />
      <path d="M66 100 L90 124 L136 78" fill="none" stroke={C.cream} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - chk} />
    </g>
  );
};

const Body: React.FC<{lt: number}> = ({lt}) => {
  const beat = 1 + 0.12 * Math.max(0, Math.sin(lt * 7)) ** 6;
  return (
    <g>
      <circle cx={100} cy={34} r={22} fill={C.blue} {...o} />
      <path d="M58 66 Q100 56 142 66 Q154 70 154 84 V126 H134 V180 H66 V126 H46 V84 Q46 70 58 66 Z" fill={C.blue} {...o} />
      <path d="M134 70 Q154 72 154 84 V126 H134 Z" fill={C.blueDk} />
      <g transform={`translate(100 108) scale(${beat}) translate(-100 -108)`}>
        <path d="M100 126 Q72 108 72 92 Q72 78 86 78 Q96 78 100 88 Q104 78 114 78 Q128 78 128 92 Q128 108 100 126 Z" fill={C.red} {...o} strokeWidth={5} />
      </g>
    </g>
  );
};

const Book: React.FC<{lt: number}> = ({lt}) => {
  const flap = Math.sin(lt * 2.2) * 6;
  return (
    <g>
      <path d="M100 54 Q68 38 22 44 V156 Q68 150 100 166 Q132 150 178 156 V44 Q132 38 100 54 Z" fill={C.orange} {...o} />
      <path d={`M100 60 Q74 ${46 - flap} 34 52 V146 Q72 142 100 156 Z`} fill={C.cream} {...o} strokeWidth={5} />
      <path d={`M100 60 Q126 ${46 - flap} 166 52 V146 Q128 142 100 156 Z`} fill="#F3E6CF" {...o} strokeWidth={5} />
      <path d="M46 82 Q70 78 88 84 M46 102 Q70 98 88 104 M46 122 Q70 118 88 124" stroke="#C9A877" strokeWidth={5} strokeLinecap="round" fill="none" />
      <path d="M130 52 V98 L140 90 L150 98 V50" fill={C.blue} {...o} strokeWidth={4} />
      <g opacity={0.5 + 0.5 * Math.sin(lt * 4)}>
        <path d="M100 26 V12 M76 32 L68 20 M124 32 L132 20" stroke={C.gold} strokeWidth={6} strokeLinecap="round" />
      </g>
    </g>
  );
};

const Steth: React.FC<{lt: number}> = ({lt}) => (
  <g transform={`rotate(${Math.sin(lt * 3) * 6} 150 130)`}>
    <path d="M58 26 V76 Q58 118 96 118 Q134 118 134 76 V26" fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" />
    <path d="M58 26 V76 Q58 118 96 118 Q134 118 134 76 V26" fill="none" stroke={C.blue} strokeWidth={8} strokeLinecap="round" />
    <path d="M96 118 V138 Q96 170 128 170 Q150 170 150 150" fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" />
    <path d="M96 118 V138 Q96 170 128 170 Q150 170 150 150" fill="none" stroke={C.blue} strokeWidth={8} strokeLinecap="round" />
    <circle cx={150} cy={130} r={24} fill={C.grey} {...o} />
    <circle cx={150} cy={130} r={11} fill={C.orange} />
    <circle cx={58} cy={24} r={10} fill={C.orange} {...o} strokeWidth={5} />
    <circle cx={134} cy={24} r={10} fill={C.orange} {...o} strokeWidth={5} />
  </g>
);

const MAP: Record<string, React.FC<{lt: number}>> = {
  car: Car,
  gear: Gear,
  wrench: Wrench,
  helmet: Helmet,
  thermo: Thermo,
  shield: Shield,
  body: Body,
  book: Book,
  steth: Steth,
};

export const Icon2D: React.FC<{name: string; size: number; lt: number}> = ({name, size, lt}) => {
  const Draw = MAP[name];
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{display: 'block', overflow: 'visible'}}>
      <Draw lt={lt} />
    </svg>
  );
};
