import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog} from '../../lib';
import {Floaters, Label, Words} from '../kit';
import {arNum, ELASTIC, F, FPS, P, POP, sp, TL, W} from '../theme';

const {s4} = TL;
const [w0, w1, w2, w3, w4] = s4.wipes;
const BEAT = 60 / TL.bpm;

/** Beat pulse 0..1 that peaks on every beat after `from`. */
const pulse = (t: number, from: number) => {
  if (t < from) return 0;
  const ph = ((t - from) % BEAT) / BEAT;
  return Math.exp(-ph * 6);
};

/* 1. a logo is born: "مدار" */
const LogoBuild: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const a = s4.logo;
  const ring = prog(t, a + 0.1, a + 1.0, easeInOut);
  const arc = prog(t, a + 0.45, a + 1.2, easeOut);
  const dot = sp(frame, a + 0.8, POP);
  const orbit = (t - a) * 2.2;
  const name = a + 1.4;
  const cx = W / 2;
  const cy = 900;
  const R = 230;
  return (
    <AbsoluteFill>
      <Label t={t} start={a} out={w1} text="لوجو بيتولد قدامك" />
      <svg width={W} height={1920} style={{position: 'absolute'}}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={P.cream} strokeWidth={34} strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * R * ring} 9999`} transform={`rotate(-90 ${cx} ${cy})`} />
        <path d={`M ${cx - 120} ${cy + 40} A 130 130 0 0 0 ${cx + 120} ${cy + 40}`} fill="none" stroke={P.teal}
          strokeWidth={34} strokeLinecap="round" strokeDasharray={`${420 * arc} 9999`} />
        <circle cx={cx + Math.cos(orbit - 1.2) * R} cy={cy + Math.sin(orbit - 1.2) * R} r={52 * dot} fill={P.orange} />
        <circle cx={cx} cy={cy - 40} r={46 * sp(frame, a + 1.0, POP)} fill={P.orange} />
      </svg>
      <Words text="مَدار" t={t} start={name} size={180} style={{position: 'absolute', top: 1220, left: 0, right: 0}} />
      <Words text="كافيه وروستري" t={t} start={name + 0.3} size={58} weight={600} color={P.creamDim} style={{position: 'absolute', top: 1470, left: 0, right: 0}} />
    </AbsoluteFill>
  );
};

/* 2. kinetic type */
const Kinetic: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const a = s4.type;
  const lines = [
    {w: 'فكرتك', c: P.cream, at: a + 0.2, size: 250},
    {w: 'لازم', c: P.teal, at: a + 0.7, size: 200},
    {w: 'تتشاف', c: P.orange, at: a + 1.2, size: 270},
  ];
  const beat = pulse(t, a + 1.7);
  return (
    <AbsoluteFill>
      <Label t={t} start={a} out={w2} text="كلمة بتتكلم" />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', gap: 0, paddingTop: 80}}>
        {lines.map((l, i) => {
          const k = sp(frame, l.at, ELASTIC);
          const stretch = 1 + (1 - clamp01(k)) * 0.6;
          const b = i === 2 ? beat : beat * 0.4;
          return (
            <div
              key={i}
              dir="rtl"
              style={{
                fontFamily: F.ar,
                fontWeight: 900,
                fontSize: l.size,
                lineHeight: 1.15,
                color: l.c,
                transform: `translateX(${(1 - k) * 700}px) scale(${stretch * (1 + b * 0.06)}, ${(1 / stretch) * (1 + b * 0.06)}) rotate(${(i - 1) * -3 * k}deg)`,
                opacity: clamp01(k * 3),
              }}
            >
              {l.w}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 3. a product that shines (2.5D phone) */
const Product: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const a = s4.product;
  const k = sp(frame, a + 0.1, {damping: 15, stiffness: 120, mass: 0.9});
  const ry = lerp(-70, 0, k) + Math.sin((t - a) * 1.6) * 18;
  const rx = 8 + Math.sin((t - a) * 1.1) * 4;
  const shine = prog(t, a + 1.0, a + 2.0, easeInOut);
  const badge = sp(frame, a + 1.6, POP);
  return (
    <AbsoluteFill>
      <Label t={t} start={a} out={w3} text="منتج بيلمع" />
      <AbsoluteFill style={{top: 420}}><Floaters t={t} k={prog(t, a, a + 0.8)} seed={7} count={8} /></AbsoluteFill>
      <div style={{position: 'absolute', left: W / 2 - 300, top: 1580, width: 600, height: 60, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', filter: 'blur(20px)', transform: `scaleX(${0.6 + 0.4 * k})`}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 520, display: 'flex', justifyContent: 'center', perspective: 1600}}>
        <div
          style={{
            width: 480,
            height: 960,
            borderRadius: 70,
            background: '#0B0B0B',
            border: '14px solid #2E2D2B',
            boxSizing: 'border-box',
            transform: `translateY(${(1 - k) * 600}px) rotateY(${ry}deg) rotateX(${rx}deg)`,
            transformStyle: 'preserve-3d',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `0 40px 120px rgba(255,94,31,${0.25 * k})`,
          }}
        >
          <div style={{position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${P.orange}, #B83A0C 70%)`}} />
          <div style={{position: 'absolute', left: 40, right: 40, top: 120, height: 400, borderRadius: 40, background: 'rgba(255,255,255,0.14)', transform: `translateZ(40px) translateY(${Math.sin(t * 2) * 8}px)`}} />
          <div style={{position: 'absolute', left: 150, top: 220, width: 150, height: 200, borderRadius: 24, background: P.cream, transform: `rotate(${-8 + Math.sin(t * 1.5) * 4}deg)`}} />
          <div dir="rtl" style={{position: 'absolute', right: 44, top: 560, fontFamily: F.ar, fontWeight: 900, fontSize: 64, color: P.cream}}>الجديد</div>
          <div style={{position: 'absolute', right: 44, top: 670, width: 260, height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.4)'}} />
          <div style={{position: 'absolute', left: 44, right: 44, bottom: 60, height: 100, borderRadius: 50, background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.ar, fontWeight: 700, fontSize: 44, color: P.cream}}>اطلب دلوقتي</div>
          {/* light sweep */}
          <div style={{position: 'absolute', top: -200, bottom: -200, width: 160, left: lerp(-300, 700, shine), background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)', transform: 'rotate(18deg)'}} />
        </div>
      </div>
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          left: 130,
          top: 640,
          padding: '18px 34px',
          borderRadius: 40,
          background: P.teal,
          color: P.bg,
          fontFamily: F.ar,
          fontWeight: 900,
          fontSize: 52,
          transform: `scale(${badge}) rotate(-8deg)`,
        }}
      >
        جديد ✦
      </div>
    </AbsoluteFill>
  );
};

/* 4. a number that convinces */
const Data: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const a = s4.data;
  const bars = [0.32, 0.45, 0.4, 0.62, 1];
  const n = Math.round(240 * prog(t, a + 0.5, a + 2.0, easeOut));
  return (
    <AbsoluteFill>
      <Label t={t} start={a} out={w4} text="رقم بيقنع" />
      <div dir="rtl" style={{position: 'absolute', top: 470, left: 0, right: 0, textAlign: 'center', fontFamily: F.ar, fontWeight: 900, fontSize: 230, color: P.cream, opacity: prog(t, a + 0.4, a + 0.7)}}>
        +{arNum(n)}٪
      </div>
      <div dir="rtl" style={{position: 'absolute', top: 760, left: 0, right: 0, textAlign: 'center', fontFamily: F.ar, fontWeight: 600, fontSize: 54, color: P.creamDim, opacity: prog(t, a + 0.8, a + 1.2)}}>
        تفاعل أكتر
      </div>
      <div style={{position: 'absolute', left: 150, right: 150, bottom: 330, height: 640, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexDirection: 'row'}}>
        {bars.map((b, i) => {
          const k = sp(frame, a + 0.5 + i * 0.16, {damping: 11, stiffness: 170, mass: 0.8});
          return (
            <div key={i} style={{width: 120, height: 640 * b * k, borderRadius: 26, background: i === bars.length - 1 ? P.orange : P.teal, opacity: i === bars.length - 1 ? 1 : 0.55 + i * 0.1}} />
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 120, right: 120, bottom: 300, height: 8, borderRadius: 4, background: P.muted}} />
    </AbsoluteFill>
  );
};

export const Showcase: React.FC<{frame: number}> = ({frame}) => {
  const t = frame / FPS;
  if (t < w0 - 0.1 || t > w4 + 0.1) return null;
  const push = (from: number) => `scale(${1 + 0.035 * clamp01((t - from) / 4)})`;
  const scenes = [
    {from: w0, to: w1, C: LogoBuild},
    {from: w1, to: w2, C: Kinetic},
    {from: w2, to: w3, C: Product},
    {from: w3, to: w4, C: Data},
  ];
  return (
    <>
      {scenes.map(({from, to, C}, i) =>
        t >= from && t < to ? (
          <AbsoluteFill key={i} style={{transform: push(from)}}>
            <C t={t} frame={frame} />
          </AbsoluteFill>
        ) : null,
      )}
    </>
  );
};


