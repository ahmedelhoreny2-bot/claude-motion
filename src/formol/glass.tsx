import React from 'react';
import {clamp01} from '../lib';
import {alpha, F, mix, P} from './theme';

export const BENCH_Y = 930;
export const BX = 560;
export const BUR = {top: 70, zeroY: 130, perMl: 76, bottom: 560, cock: 598, tip: 662, w: 30};
export const FLASK_H = 290;

/** Half-width of the Erlenmeyer interior at local y (bottom = 0, up is negative). */
export const flaskHW = (y: number) => {
  if (y <= -185) return 34;
  const f = clamp01((y + 185) / (185 - 24));
  return 34 + (150 - 34) * f;
};

const FLASK_PATH =
  'M -40 -292 Q -40 -298 -34 -298 L 34 -298 Q 40 -298 40 -292 L 36 -286 L 36 -186 L 152 -30 Q 166 0 132 0 L -132 0 Q -166 0 -152 -30 L -36 -186 L -36 -286 Z';
const FLASK_INNER = 'M -33 -292 L 33 -292 L 33 -186 L 148 -31 Q 160 -4 130 -4 L -130 -4 Q -160 -4 -148 -31 L -33 -186 Z';

export type Flash = {t0: number; x: number; persist?: boolean};

/** Erlenmeyer flask with liquid, swirl, drop flashes and glass highlights. */
export const Flask: React.FC<{
  uid: string;
  x: number;
  y: number;
  s?: number;
  level: number;
  color: string;
  t: number;
  swirl?: number;
  flashes?: Flash[];
  opacity?: number;
  milky?: boolean;
}> = ({uid, x, y, s = 1, level, color, t, swirl = 0, flashes = [], opacity = 1, milky = true}) => {
  const rot = swirl * 3.2 * Math.sin(t * Math.PI * 2 * 1.4);
  const dx = swirl * 7 * Math.cos(t * Math.PI * 2 * 1.4);
  const ly = -level;
  const hw = flaskHW(ly);
  const tilt = swirl * 7 * Math.sin(t * Math.PI * 2 * 1.4 + 0.8);
  const top = mix(color, '#FFFFFF', 0.35);
  const deep = milky ? mix(color, '#C9B9A8', 0.35) : mix(color, '#2A5C9A', 0.25);
  return (
    <g transform={`translate(${x + dx} ${y}) scale(${s}) rotate(${rot})`} opacity={opacity}>
      <defs>
        <clipPath id={`${uid}-in`}>
          <path d={FLASK_INNER} />
        </clipPath>
        <linearGradient id={`${uid}-liq`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={top} />
          <stop offset="100%" stopColor={deep} />
        </linearGradient>
        <linearGradient id={`${uid}-glass`} x1="0" x2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.20)" />
          <stop offset="30%" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="75%" stopColor="rgba(255,255,255,0.02)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.16)" />
        </linearGradient>
        <radialGradient id={`${uid}-flash`}>
          <stop offset="0%" stopColor={P.pink} stopOpacity={0.95} />
          <stop offset="60%" stopColor={P.pink} stopOpacity={0.45} />
          <stop offset="100%" stopColor={P.pink} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={4} rx={190} ry={18} fill="rgba(0,0,0,0.35)" />
      <path d={FLASK_PATH} fill={`url(#${uid}-glass)`} />
      {level > 1 ? (
        <g clipPath={`url(#${uid}-in)`}>
          <g transform={`rotate(${tilt} 0 ${ly})`}>
            <rect x={-200} y={ly} width={400} height={level + 40} fill={`url(#${uid}-liq)`} />
            {flashes.map((f, i) => {
              const k = clamp01((t - f.t0) / 0.7);
              if (k <= 0 || (k >= 1 && !f.persist)) return null;
              const r = 14 + 80 * Math.sqrt(k);
              return <ellipse key={i} cx={f.x} cy={ly + 22 + 40 * k} rx={r} ry={r * 0.55} fill={`url(#${uid}-flash)`} opacity={f.persist ? 1 : 0.85 * (1 - k)} />;
            })}
            <ellipse cx={0} cy={ly} rx={hw + 8} ry={(hw + 8) * 0.16} fill={mix(color, '#FFFFFF', 0.55)} />
            <ellipse cx={-hw * 0.3} cy={ly - 1} rx={hw * 0.4} ry={hw * 0.05} fill="rgba(255,255,255,0.5)" />
          </g>
        </g>
      ) : null}
      <path d={FLASK_PATH} fill="none" stroke="rgba(235,242,255,0.85)" strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M -26 -280 L -26 -190 L -132 -44" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={6} strokeLinecap="round" />
      <path d="M 26 -270 L 26 -200" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={3} strokeLinecap="round" />
      <path d="M 122 -60 L 136 -40" stroke="rgba(255,255,255,0.4)" strokeWidth={4} strokeLinecap="round" />
      {[50, 90, 130].map((g, i) => (
        <g key={i} opacity={0.55}>
          <line x1={-flaskHW(-g) * 0.45} y1={-g} x2={-flaskHW(-g) * 0.25} y2={-g} stroke="#fff" strokeWidth={2} />
        </g>
      ))}
      <ellipse cx={0} cy={-295} rx={40} ry={7} fill="none" stroke="rgba(235,242,255,0.9)" strokeWidth={3} />
    </g>
  );
};

/** Retort stand: heavy base, rod and clamp holding the burette. */
export const Stand: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="rod" x1="0" x2="1">
        <stop offset="0%" stopColor="#5D668F" />
        <stop offset="45%" stopColor="#DCE2FF" />
        <stop offset="100%" stopColor="#4A5276" />
      </linearGradient>
      <linearGradient id="base" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3A4170" />
        <stop offset="100%" stopColor="#1A1E3E" />
      </linearGradient>
    </defs>
    <rect x={250} y={BENCH_Y - 26} width={420} height={26} rx={8} fill="url(#base)" stroke="rgba(255,255,255,0.25)" />
    <rect x={250} y={BENCH_Y - 26} width={420} height={5} rx={3} fill="rgba(255,255,255,0.25)" />
    <rect x={366} y={40} width={14} height={BENCH_Y - 66} rx={7} fill="url(#rod)" />
    <rect x={366} y={92} width={BX - 366 - 14} height={12} rx={6} fill="url(#rod)" />
    <rect x={352} y={84} width={42} height={28} rx={8} fill="#2F3560" stroke="rgba(255,255,255,0.3)" />
    <rect x={BX - 30} y={80} width={60} height={36} rx={10} fill="none" stroke="#C9D0F5" strokeWidth={6} />
  </g>
);

/** Burette with graduations, NaOH column, stopcock and tip. */
export const Burette: React.FC<{reading: number; open: number; liquid?: string}> = ({reading, open, liquid = 'rgba(150,215,255,0.62)'}) => {
  const {top, zeroY, perMl, bottom, cock, tip, w} = BUR;
  const lvl = zeroY + reading * perMl;
  const x0 = BX - w / 2;
  return (
    <g>
      <defs>
        <linearGradient id="burGlass" x1="0" x2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
          <stop offset="40%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.18)" />
        </linearGradient>
        <linearGradient id="burLiq" x1="0" x2="1">
          <stop offset="0%" stopColor={mix(liquid, '#FFFFFF', 0.3)} />
          <stop offset="60%" stopColor={liquid} />
          <stop offset="100%" stopColor={mix(liquid, '#1B4E9A', 0.4)} />
        </linearGradient>
      </defs>
      <rect x={x0} y={lvl} width={w} height={bottom - lvl} fill="url(#burLiq)" />
      <path d={`M ${x0} ${bottom} L ${BX - 6} ${cock - 14} L ${BX + 6} ${cock - 14} L ${x0 + w} ${bottom} Z`} fill={liquid} />
      <ellipse cx={BX} cy={lvl} rx={w / 2} ry={4} fill="rgba(255,255,255,0.75)" />
      <rect x={x0} y={top} width={w} height={bottom - top} rx={6} fill="url(#burGlass)" stroke="rgba(235,242,255,0.85)" strokeWidth={3} />
      <path d={`M ${x0} ${bottom} L ${BX - 7} ${cock - 14} M ${x0 + w} ${bottom} L ${BX + 7} ${cock - 14}`} stroke="rgba(235,242,255,0.85)" strokeWidth={3} fill="none" />
      {Array.from({length: 26}, (_, i) => {
        const y = zeroY + i * perMl * 0.2;
        const major = i % 5 === 0;
        return (
          <g key={i}>
            <line x1={x0 + 3} y1={y} x2={x0 + (major ? 18 : 10)} y2={y} stroke="rgba(255,255,255,0.85)" strokeWidth={major ? 2.4 : 1.4} />
            {major ? (
              <text x={x0 - 8} y={y + 7} textAnchor="end" fontFamily={F.mono} fontWeight={700} fontSize={19} fill="rgba(245,247,255,0.8)">
                {i / 5}
              </text>
            ) : null}
          </g>
        );
      })}
      <line x1={x0 + 7} y1={top + 10} x2={x0 + 7} y2={bottom - 10} stroke="rgba(255,255,255,0.5)" strokeWidth={4} strokeLinecap="round" />
      {/* stopcock */}
      <rect x={BX - 7} y={cock - 16} width={14} height={tip - cock + 16} fill={liquid} stroke="rgba(235,242,255,0.85)" strokeWidth={2.5} />
      <circle cx={BX} cy={cock} r={15} fill="#3B4372" stroke="#C9D0F5" strokeWidth={3} />
      <g transform={`rotate(${90 * open} ${BX} ${cock})`}>
        <rect x={BX - 46} y={cock - 6} width={92} height={12} rx={6} fill={P.orange} />
        <circle cx={BX - 46} cy={cock} r={9} fill={P.orange} />
      </g>
      <path d={`M ${BX - 7} ${tip - 6} L ${BX - 3} ${tip} L ${BX + 3} ${tip} L ${BX + 7} ${tip - 6}`} fill={liquid} stroke="rgba(235,242,255,0.85)" strokeWidth={2} />
    </g>
  );
};

/** Teardrop falling from (x, y). */
export const Drop: React.FC<{x: number; y: number; color: string; r?: number}> = ({x, y, color, r = 7}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={`M 0 ${-r * 2} C ${r * 0.6} ${-r * 0.8} ${r} ${-r * 0.2} ${r} ${r * 0.3} A ${r} ${r} 0 1 1 ${-r} ${r * 0.3} C ${-r} ${-r * 0.2} ${-r * 0.6} ${-r * 0.8} 0 ${-r * 2} Z`} fill={color} stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />
    <circle cx={-r * 0.35} cy={0} r={r * 0.28} fill="rgba(255,255,255,0.8)" />
  </g>
);

/** Volumetric pipette coming down into the flask neck. `fill` 0..1 of its content left. */
export const Pipette: React.FC<{x: number; tipY: number; fill: number; color: string; stream: number; surfaceY: number}> = ({
  x,
  tipY,
  fill,
  color,
  stream,
  surfaceY,
}) => {
  const bulbY = tipY - 210;
  const topY = tipY - 430;
  const liquidTop = tipY - 30 - (tipY - 30 - (topY + 40)) * fill;
  return (
    <g>
      <defs>
        <clipPath id="pipIn">
          <rect x={x - 6} y={bulbY + 50} width={12} height={tipY - bulbY - 50} />
          <ellipse cx={x} cy={bulbY} rx={24} ry={52} />
          <rect x={x - 6} y={topY} width={12} height={bulbY - topY} />
        </clipPath>
      </defs>
      {stream > 0.01 ? (
        <rect x={x - 3 * stream} y={tipY} width={6 * stream} height={Math.max(0, surfaceY - tipY)} fill={color} opacity={0.9} />
      ) : null}
      <g clipPath="url(#pipIn)">
        <rect x={x - 30} y={liquidTop} width={60} height={tipY - liquidTop} fill={color} />
      </g>
      <path
        d={`M ${x - 6} ${topY} L ${x - 6} ${bulbY - 50} Q ${x - 26} ${bulbY - 40} ${x - 25} ${bulbY} Q ${x - 26} ${bulbY + 40} ${x - 6} ${bulbY + 50} L ${x - 6} ${tipY - 16} L ${x - 2} ${tipY} L ${x + 2} ${tipY} L ${x + 6} ${tipY - 16} L ${x + 6} ${bulbY + 50} Q ${x + 26} ${bulbY + 40} ${x + 25} ${bulbY} Q ${x + 26} ${bulbY - 40} ${x + 6} ${bulbY - 50} L ${x + 6} ${topY}`}
        fill="rgba(255,255,255,0.08)"
        stroke="rgba(235,242,255,0.9)"
        strokeWidth={2.5}
      />
      <line x1={x - 14} y1={bulbY - 30} x2={x - 14} y2={bulbY + 26} stroke="rgba(255,255,255,0.55)" strokeWidth={4} strokeLinecap="round" />
      <line x1={x - 9} y1={topY + 60} x2={x + 9} y2={topY + 60} stroke="#fff" strokeWidth={2} />
    </g>
  );
};

/** Indicator dropper with a rubber bulb. */
export const Dropper: React.FC<{x: number; tipY: number; squeeze: number}> = ({x, tipY, squeeze}) => (
  <g>
    <path d={`M ${x - 9} ${tipY - 150} L ${x - 9} ${tipY - 18} L ${x - 3} ${tipY} L ${x + 3} ${tipY} L ${x + 9} ${tipY - 18} L ${x + 9} ${tipY - 150} Z`} fill="rgba(255,255,255,0.12)" stroke="rgba(235,242,255,0.9)" strokeWidth={2.5} />
    <rect x={x - 9} y={tipY - 90} width={18} height={70} fill="rgba(245,240,255,0.35)" />
    <ellipse cx={x} cy={tipY - 185} rx={22 * (1 - 0.25 * squeeze)} ry={42} fill={P.violet} />
    <ellipse cx={x - 7} cy={tipY - 200} rx={6} ry={14} fill="rgba(255,255,255,0.45)" />
    <rect x={x - 16} y={tipY - 156} width={32} height={10} rx={4} fill="#6B45C9" />
  </g>
);

export const pinkMilk = (k: number) => mix(P.milk, '#FF8CC4', k);
export const pinkWater = (k: number) => mix('rgba(160,210,255,0.30)', 'rgba(255,110,185,0.62)', k);
export const naohColor = alpha('#96D7FF', 0.62);
