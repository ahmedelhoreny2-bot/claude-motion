import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog, rand} from '../../lib';
import {Floaters, Mark, Tri, Words} from '../kit';
import {ELASTIC, F, FPS, H, HEAVY, P, POP, sp, TL, W} from '../theme';

const {s5, s6, s7} = TL;
const BEAT = 60 / TL.bpm;

/* ---------------- scene 5: "عندنا فكرة لـ ___" ---------------- */

const Icon: React.FC<{kind: number; size: number}> = ({kind, size}) => {
  const s = {stroke: P.teal, strokeWidth: 22, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none'};
  return (
    <svg width={size} height={size} viewBox="0 0 260 260" style={{display: 'block', overflow: 'visible'}}>
      {kind === 0 ? (
        <>
          <circle cx={130} cy={130} r={78} {...s} />
          <path d="M 30 60 V 110 M 50 60 V 200 M 70 60 V 110 M 30 110 Q 50 130 70 110" {...s} stroke={P.cream} strokeWidth={14} />
          <path d="M 228 60 Q 200 100 214 140 L 228 140 V 200" {...s} stroke={P.cream} strokeWidth={14} />
        </>
      ) : null}
      {kind === 1 ? <path d="M 130 50 V 210 M 50 130 H 210" {...s} strokeWidth={46} /> : null}
      {kind === 2 ? <path d="M 130 30 L 220 130 L 130 230 L 40 130 Z M 130 90 L 170 130 L 130 170 L 90 130 Z" {...s} /> : null}
      {kind === 3 ? (
        <>
          <path d="M 50 95 H 210 L 196 230 H 64 Z" {...s} />
          <path d="M 95 95 V 70 A 35 35 0 0 1 165 70 V 95" {...s} />
        </>
      ) : null}
    </svg>
  );
};

const SLOTS = ['مطعمك', 'عيادتك', 'براندك', 'متجرك'];

const Fields: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const ends = [...s5.slots.slice(1), s5.final];
  const finalK = prog(t, s5.final, s5.final + 0.45, easeOut);
  const out = prog(t, s5.exit, s5.exit + 0.4, easeIn);
  return (
    <AbsoluteFill style={{opacity: 1 - out, transform: `scale(${1 + 0.03 * clamp01((t - s5.head) / 7)})`}}>
      <Words text="عندنا فكرة لـ" t={t} start={s5.head} size={120} style={{position: 'absolute', top: 470, left: 0, right: 0}} />
      {/* icon */}
      <div style={{position: 'absolute', left: W / 2 - 130, top: 760, width: 260, height: 260}}>
        {SLOTS.map((_, i) => {
          const k = sp(frame, s5.slots[i], POP);
          const o = prog(t, ends[i] - 0.12, ends[i] + 0.12, easeIn);
          if (k <= 0 || o >= 1) return null;
          return (
            <div key={i} style={{position: 'absolute', inset: 0, transform: `scale(${k * (1 - o)}) rotate(${(1 - k) * -40}deg)`}}>
              <Icon kind={i} size={260} />
            </div>
          );
        })}
        {t >= s5.final ? (
          <div style={{position: 'absolute', left: 30, top: 0, transform: `scale(${sp(frame, s5.final, ELASTIC)})`}}>
            <Tri size={220} />
          </div>
        ) : null}
      </div>
      {/* slot word */}
      <div style={{position: 'absolute', top: 1080, left: 0, right: 0, height: 330, overflow: 'hidden'}}>
        {SLOTS.map((w, i) => {
          const k = prog(t, s5.slots[i], s5.slots[i] + 0.35, easeOut);
          const o = prog(t, ends[i] - 0.15, ends[i] + 0.2, easeIn);
          if (k <= 0 || o >= 1) return null;
          return (
            <div key={i} dir="rtl" style={{position: 'absolute', inset: 0, textAlign: 'center', fontFamily: F.ar, fontWeight: 900, fontSize: 210, lineHeight: '330px', color: P.cream, transform: `translateY(${(1 - k) * 100 - o * 100}%)`}}>
              {w}
            </div>
          );
        })}
        {t >= s5.final - 0.05 ? (
          <div dir="rtl" style={{position: 'absolute', inset: 0, textAlign: 'center', fontFamily: F.ar, fontWeight: 900, fontSize: 210, lineHeight: '330px', color: P.orange, transform: `translateY(${(1 - finalK) * 100}%) scale(${1 + 0.05 * Math.exp(-(t - s5.final) * 4)})`}}>
            شغلك إنت
          </div>
        ) : null}
      </div>
      <Words text="وكل مجال… له حركة." t={t} start={s5.sub} size={84} weight={700} color={P.creamDim} style={{position: 'absolute', top: 1470, left: 0, right: 0}} />
    </AbsoluteFill>
  );
};

/* ---------------- scene 6 + 7: brand and call to action ---------------- */

const SHARDS = 16;
const Converge: React.FC<{t: number}> = ({t}) => {
  const k = prog(t, s6.converge, s6.hit, (x) => x * x * x);
  if (k <= 0 || k >= 1) return null;
  return (
    <AbsoluteFill>
      {Array.from({length: SHARDS}).map((_, i) => {
        const a = (i / SHARDS) * Math.PI * 2 + rand(i) * 0.4;
        const d = 1300 * (1 - k);
        const c = [P.orange, P.teal, P.cream][i % 3];
        const size = 40 + rand(i + 4) * 50;
        return (
          <div key={i} style={{position: 'absolute', left: W / 2 + Math.cos(a) * d - size / 2, top: 820 + Math.sin(a) * d - size / 2, width: size, height: size, borderRadius: i % 2 ? '50%' : 14, background: c, transform: `rotate(${k * 400}deg) scale(${1 - k * 0.7})`}} />
        );
      })}
    </AbsoluteFill>
  );
};

const CHANNELS = [
  {text: 'واتساب', bg: P.teal, fg: P.bg},
  {text: 'رسايل الصفحة', bg: P.orange, fg: P.cream},
  {text: '', bg: P.cardHi, fg: P.cream},
];
const LINE_Y = [-66, 0, 66];
const LINE_LEN = [115, 127, 115];

const Brand: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const hit = sp(frame, s6.hit, ELASTIC);
  const lines = s6.lines.map((l) => prog(t, l, l + 0.35, easeOut));
  const dock = sp(frame, s7.dock, HEAVY);
  const markScale = lerp(1.6, 0.75, dock);
  const markY = lerp(800, 290, dock);
  const markX = W / 2 + 21 * markScale;
  const bubbleK = s7.bubbles.map((b) => sp(frame, b, {damping: 15, stiffness: 150, mass: 0.8}));
  const lineDraw = lines.map((l, i) => (t >= s7.bubbles[i] ? 0 : l));
  const shimmy = Math.sin(t * 9) * 4 * prog(t, s6.word2 + 0.6, s6.word2 + 1);
  const wordOut = prog(t, s7.dock - 0.1, s7.dock + 0.3, easeIn);
  const ring = clamp01((t - s6.hit) / 0.8);
  const beat = t > s7.cta ? Math.exp(-(((t - s7.cta) % BEAT) / BEAT) * 5) : 0;
  const ctaK = sp(frame, s7.cta, POP);
  const typing = (i: number) => Math.max(0, Math.sin((t * 6 - i * 0.9)));

  return (
    <AbsoluteFill>
      <Converge t={t} />
      {t >= s6.hit && ring < 1 ? (
        <div style={{position: 'absolute', left: W / 2 - 1400 * ring, top: 800 - 1400 * ring, width: 2800 * ring, height: 2800 * ring, borderRadius: '50%', border: `${50 * (1 - ring) + 2}px solid ${P.orange}`, opacity: 1 - ring}} />
      ) : null}
      {t >= s6.hit ? <Floaters t={t} k={prog(t, s6.hit, s6.hit + 0.8, easeOut) * (1 - dock * 0.6)} seed={11} count={14} /> : null}
      {t >= s6.hit - 0.02 ? (
        <div style={{position: 'absolute', left: markX, top: markY}}>
          <Mark scale={markScale} tri={hit} lines={lineDraw} />
        </div>
      ) : null}
      {/* wordmark */}
      {t > s6.word1 - 0.05 && wordOut < 1 ? (
        <div dir="rtl" style={{position: 'absolute', top: 1130, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 36, fontFamily: F.ar, fontWeight: 900, fontSize: 150, lineHeight: 1.3, opacity: 1 - wordOut, transform: `translateY(${-wordOut * 60}px)`}}>
          <Words text="إبداع" t={t} start={s6.word1} dur={0.6} size={150} />
          <div style={{transform: `skewX(-12deg) translateX(${shimmy}px)`}}>
            <Words text="بيتحرك" t={t} start={s6.word2} dur={0.6} size={150} color={P.orange} />
          </div>
        </div>
      ) : null}

      {/* the three lines become chat bubbles */}
      {CHANNELS.map((c, i) => {
        const k = bubbleK[i];
        if (k <= 0) return null;
        const from = {x: markX + 44 * markScale, y: markY + (LINE_Y[i] - 13.5) * markScale, w: LINE_LEN[i] * markScale, h: 27 * markScale};
        const to = {x: i === 1 ? 160 : 280, y: 560 + i * 170, w: 640, h: 132};
        const x = lerp(from.x, to.x, k);
        const y = lerp(from.y, to.y, k);
        const w = lerp(from.w, to.w, k);
        const h = lerp(from.h, to.h, k);
        const content = clamp01((k - 0.6) / 0.4);
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: Math.min(h / 2, 66), background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.35)'}}>
            {i < 2 ? (
              <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 24, fontFamily: F.ar, fontWeight: 900, fontSize: 64, color: c.fg, opacity: content}}>
                <div style={{width: 58, height: 58, borderRadius: 29, border: `8px solid ${c.fg}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <div style={{width: 16, height: 16, borderRadius: 8, background: c.fg}} />
                </div>
                {c.text}
              </div>
            ) : (
              <div style={{display: 'flex', gap: 22, opacity: content}}>
                {[0, 1, 2].map((d) => (
                  <div key={d} style={{width: 30, height: 30, borderRadius: 15, background: P.cream, opacity: 0.4 + 0.6 * typing(d), transform: `translateY(${-10 * typing(d)}px)`}} />
                ))}
              </div>
            )}
          </div>
        );
      })}
      {t > s7.line1 - 0.05 ? (
        <>
          <Words text="قولّنا مجالك…" t={t} start={s7.line1} size={140} style={{position: 'absolute', top: 1130, left: 0, right: 0}} />
          <Words text="ونبعتلك الفكرة والتفاصيل كلها" t={t} start={s7.line2} size={70} weight={700} color={P.creamDim} style={{position: 'absolute', top: 1340, left: 40, right: 40}} />
        </>
      ) : null}
      {t > s7.cta ? (
        <div style={{position: 'absolute', top: 1540, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <div dir="rtl" style={{padding: '26px 70px', borderRadius: 80, background: P.orange, fontFamily: F.ar, fontWeight: 900, fontSize: 72, color: P.cream, transform: `scale(${ctaK * (1 + 0.04 * beat)})`, boxShadow: `0 0 ${40 + 60 * beat}px rgba(255,94,31,0.5)`}}>
            ابعتلنا دلوقتي
          </div>
        </div>
      ) : null}
      {t > s7.cta + 0.4 ? (
        <div dir="rtl" style={{position: 'absolute', top: 1745, left: 0, right: 0, textAlign: 'center', fontFamily: F.ar, fontWeight: 700, fontSize: 46, color: P.muted, opacity: prog(t, s7.cta + 0.4, s7.cta + 1)}}>
          إبداع <span style={{color: P.orange}}>بيتحرك</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const Finale: React.FC<{frame: number}> = ({frame}) => {
  const t = frame / FPS;
  if (t < s5.head - 0.5) return null;
  return (
    <>
      {t < s5.exit + 0.5 ? <Fields t={t} frame={frame} /> : null}
      {t >= s6.converge ? <Brand t={t} frame={frame} /> : null}
    </>
  );
};


