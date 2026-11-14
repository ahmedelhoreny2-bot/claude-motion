import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog} from '../../lib';
import {Floaters, Label, Words} from '../kit';
import {Extrude, P3, shade, Slab} from '../space';
import {arNum, ELASTIC, F, FPS, P, POP, R, sp, TL, W} from '../theme';

const {s4} = TL;
const [w0, w1, w2, w3, w4] = s4.wipes;
const BEAT = 60 / TL.bpm;
const SIDE = {ink: shade(P.ink, 0.45), teal: shade(P.teal, 0.5), orange: shade(P.orange, 0.5)};

/** Beat pulse 0..1 that peaks on every beat after `from`. */
const pulse = (t: number, from: number) => {
  if (t < from) return 0;
  const ph = ((t - from) % BEAT) / BEAT;
  return Math.exp(-ph * 6);
};

/** Brand rule: fictional brands are marked as demos. */
const Demo: React.FC<{t: number; at: number; top: number}> = ({t, at, top}) => (
  <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: prog(t, at, at + 0.4)}}>
    <div dir="rtl" style={{padding: '6px 26px', borderRadius: R.pill, border: `3px solid ${P.orange}`, fontFamily: F.ar, fontWeight: 500, fontSize: 34, color: P.muted}}>
      براند تخيلي · للعرض
    </div>
  </div>
);

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
  const spin = sp(frame, a + 0.05, {damping: 13, stiffness: 90, mass: 1});
  const Madar: React.FC<{dark: boolean}> = ({dark}) => (
      <svg width={680} height={680} viewBox={`${cx - 340} ${cy - 340} 680 680`} style={{display: 'block'}}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={(dark ? SIDE.ink : P.ink)} strokeWidth={34} strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * R * ring} 9999`} transform={`rotate(-90 ${cx} ${cy})`} />
        <path d={`M ${cx - 120} ${cy + 40} A 130 130 0 0 0 ${cx + 120} ${cy + 40}`} fill="none" stroke={(dark ? SIDE.teal : P.teal)}
          strokeWidth={34} strokeLinecap="round" strokeDasharray={`${420 * arc} 9999`} />
        <circle cx={cx + Math.cos(orbit - 1.2) * R} cy={cy + Math.sin(orbit - 1.2) * R} r={52 * dot} fill={(dark ? SIDE.orange : P.orange)} />
        <circle cx={cx} cy={cy - 40} r={46 * sp(frame, a + 1.0, POP)} fill={(dark ? SIDE.orange : P.orange)} />
      </svg>
  );

  return (
    <AbsoluteFill style={P3}>
      <Label t={t} start={a} out={w1} text="لوجو بيتولد قدامك" />
      <div style={{position: 'absolute', left: cx - 340, top: cy - 340, width: 680, height: 680, ...P3, transform: `translateZ(${lerp(-700, 120, spin)}px) rotateY(${(1 - spin) * -160 + Math.sin(t * 1.2) * 12}deg) rotateX(${Math.sin(t * 0.9) * 8}deg)`}}>
      <Extrude depth={60} layers={7} back={<Madar dark />}>
      <Madar dark={false} />
      </Extrude>
      </div>
      <Words text="مَدار" t={t} start={name} size={180} style={{position: 'absolute', top: 1220, left: 0, right: 0}} />
      <Words text="كافيه وروستري" t={t} start={name + 0.3} size={58} weight={500} color={P.muted} style={{position: 'absolute', top: 1470, left: 0, right: 0}} />
      <Demo t={t} at={name + 0.8} top={1620} />
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
    <AbsoluteFill style={P3}>
      <Label t={t} start={a} out={w2} text="كلمة بتتكلم" />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', gap: 0, paddingTop: 80, ...P3}}>
        {lines.map((l, i) => {
          const k = sp(frame, l.at, ELASTIC);
          const vel = Math.abs(k - sp(frame - 1, l.at, ELASTIC)) * FPS;
          const stretch = 1 + Math.min(0.9, vel * 0.12);
          const zi = [-160, 60, 240][i];
          const b = i === 2 ? beat : beat * 0.4;
          return (
            <div
              key={i}
              dir="rtl"
              style={{
                fontFamily: F.display,
                fontWeight: 400,
                fontSize: l.size,
                lineHeight: 1.15,
                color: l.c,
                transform: `translateZ(${lerp(-2200, zi, k)}px) translateX(${(1 - k) * (i - 1) * 500}px) rotateY(${(1 - k) * (i % 2 ? 70 : -70) + Math.sin(t * 1.4 + i) * 8}deg) scale(${(1 / Math.sqrt(stretch)) * (1 + b * 0.06)}, ${stretch * (1 + b * 0.06)}) rotate(${(i - 1) * -3 * k}deg)`,
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
    <AbsoluteFill style={P3}>
      <Label t={t} start={a} out={w3} text="منتج بيلمع" />
      <AbsoluteFill style={{top: 420, ...P3}}><Floaters t={t} k={prog(t, a, a + 0.8)} seed={7} count={8} /></AbsoluteFill>
      <div style={{position: 'absolute', left: W / 2 - 300, top: 1580, width: 600, height: 60, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', filter: 'blur(20px)', transform: `scaleX(${0.6 + 0.4 * k})`}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 520, display: 'flex', justifyContent: 'center', ...P3}}>
        <Extrude depth={44} layers={6} back={<Slab color={P.line} radius={70} />} style={{transform: `translateZ(${lerp(-900, 80, k)}px) translateY(${(1 - k) * 600}px) rotateY(${ry}deg) rotateX(${rx}deg)`}}>
        <div
          style={{
            width: 480,
            height: 960,
            borderRadius: 70,
            background: P.bg,
            border: `14px solid ${P.line}`,
            boxSizing: 'border-box',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{position: 'absolute', inset: 0, background: P.orange}} />
          <div style={{position: 'absolute', left: 40, right: 40, top: 120, height: 400, borderRadius: 40, background: 'rgba(22,8,3,0.16)', transform: `translateZ(40px) translateY(${Math.sin(t * 2) * 8}px)`}} />
          <div style={{position: 'absolute', left: 150, top: 220, width: 150, height: 200, borderRadius: 24, background: P.cream, transform: `rotate(${-8 + Math.sin(t * 1.5) * 4}deg)`}} />
          <div dir="rtl" style={{position: 'absolute', right: 44, top: 556, fontFamily: F.display, fontWeight: 400, fontSize: 70, color: P.onOrange}}>الجديد</div>
          <div style={{position: 'absolute', right: 44, top: 670, width: 260, height: 22, borderRadius: 11, background: 'rgba(22,8,3,0.35)'}} />
          <div style={{position: 'absolute', left: 44, right: 44, bottom: 60, height: 100, borderRadius: 50, background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.ar, fontWeight: 700, fontSize: 44, color: P.ink}}>اطلب دلوقتي</div>
          {/* light sweep */}
          <div style={{position: 'absolute', top: -200, bottom: -200, width: 160, left: lerp(-300, 700, shine), background: 'rgba(255,255,255,0.28)', transform: 'rotate(18deg)'}} />
        </div>
        </Extrude>
      </div>
      <Demo t={t} at={a + 1.2} top={1660} />
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          left: 130,
          top: 640,
          padding: '18px 34px',
          background: P.teal,
          color: P.onTeal,
          borderRadius: R.pill,
          fontFamily: F.ar,
          fontWeight: 700,
          fontSize: 52,
          transform: `translateZ(260px) scale(${badge}) rotate(-8deg) rotateY(${Math.sin(t * 2) * 15}deg)`,
        }}
      >
        جديد
      </div>
    </AbsoluteFill>
  );
};

/* 4. a number that convinces: an offer for a demo shop */
const Data: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const a = s4.data;
  const n = Math.round(30 * prog(t, a + 0.5, a + 1.6, easeOut));
  const tag = sp(frame, a + 0.35, POP);
  const stamp = sp(frame, a + 1.7, ELASTIC);
  const old = prog(t, a + 1.0, a + 1.4, easeOut);
  return (
    <AbsoluteFill style={P3}>
      <Label t={t} start={a} out={w4} text="رقم بيقنع" />
      <Extrude depth={40} layers={5} back={<Slab color={P.line} radius={R.xl} />} style={{position: 'absolute', left: W / 2 - 330, top: 560, width: 660, height: 820, transform: `translateZ(${lerp(-900, 0, tag)}px) rotateY(${(1 - tag) * 80 + Math.sin(t * 1.1) * 7}deg) rotateX(${(1 - tag) * -20 + Math.sin(t * 0.8) * 4}deg)`}}>
      <div style={{position: 'relative', width: 660, height: 820, borderRadius: R.xl, background: P.surface, border: `3px solid ${P.line}`, boxSizing: 'border-box'}}>
        <div dir="rtl" style={{position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center', fontFamily: F.ar, fontWeight: 700, fontSize: 56, color: P.ink}}>عرض الأسبوع</div>
        <div dir="rtl" style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', fontFamily: F.display, fontSize: 300, lineHeight: 1.3, color: P.orange}}>
          {arNum(n)}٪
        </div>
        <div dir="rtl" style={{position: 'absolute', top: 520, left: 0, right: 0, textAlign: 'center', fontFamily: F.display, fontSize: 110, color: P.ink, opacity: prog(t, a + 0.7, a + 1.0)}}>خصم</div>
        <div dir="rtl" style={{position: 'absolute', top: 690, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 30, fontFamily: F.ar, fontWeight: 700, fontSize: 52}}>
          <span style={{color: P.muted, position: 'relative'}}>
            {arNum(800)} ج
            <span style={{position: 'absolute', left: -8, width: `calc(${100 * old}% + 16px)`, top: '50%', height: 5, borderRadius: 3, background: P.orange, transform: 'rotate(-18deg)', transformOrigin: '0 50%'}} />
          </span>
          <span style={{color: P.teal, opacity: old}}>{arNum(560)} ج</span>
        </div>
      </div>
      </Extrude>
      <div style={{position: 'absolute', right: 150, top: 500, width: 170, height: 170, borderRadius: R.pill, background: P.teal, color: P.onTeal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontSize: 52, transform: `translateZ(${180 + (1 - stamp) * 600}px) scale(${stamp}) rotate(${12 - 12 * stamp + 10}deg) rotateY(${Math.sin(t * 2.2) * 20}deg)`}}>
        لفترة
      </div>
      <Demo t={t} at={a + 1.4} top={1460} />
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
          <AbsoluteFill key={i} style={{...P3, transform: push(from)}}>
            <C t={t} frame={frame} />
          </AbsoluteFill>
        ) : null,
      )}
    </>
  );
};


