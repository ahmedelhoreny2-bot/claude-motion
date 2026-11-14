import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog, rand} from '../../lib';
import {Tri, Words} from '../kit';
import {ELASTIC, F, FPS, HEAVY, P, POP, R, sp, TL, W} from '../theme';

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
            <div key={i} dir="rtl" style={{position: 'absolute', inset: 0, textAlign: 'center', fontFamily: F.display, fontSize: 210, lineHeight: '330px', color: P.ink, transform: `translateY(${(1 - k) * 100 - o * 100}%)`}}>
              {w}
            </div>
          );
        })}
        {t >= s5.final - 0.05 ? (
          <div dir="rtl" style={{position: 'absolute', inset: 0, textAlign: 'center', fontFamily: F.display, fontSize: 210, lineHeight: '330px', color: P.orange, transform: `translateY(${(1 - finalK) * 100}%) scale(${1 + 0.05 * Math.exp(-(t - s5.final) * 4)})`}}>
            شغلك إنت
          </div>
        ) : null}
      </div>
      <Words text="وكل مجال… له حركة." t={t} start={s5.sub} size={76} weight={700} color={P.muted} style={{position: 'absolute', top: 1470, left: 0, right: 0}} />
    </AbsoluteFill>
  );
};

/* ---------------- scene 6 + 7: brand and call to action ---------------- */

const SHARDS = 16;
const Converge: React.FC<{t: number}> = ({t}) => {
  const k = prog(t, s6.converge, s6.sting + 0.1, (x) => x * x * x);
  if (k <= 0 || k >= 1) return null;
  return (
    <AbsoluteFill>
      {Array.from({length: SHARDS}).map((_, i) => {
        const a = (i / SHARDS) * Math.PI * 2 + rand(i) * 0.4;
        const d = 1300 * (1 - k);
        const c = [P.teal, P.ink, P.teal][i % 3];
        const size = 40 + rand(i + 4) * 50;
        return (
          <div key={i} style={{position: 'absolute', left: W / 2 + Math.cos(a) * d - size / 2, top: 840 + Math.sin(a) * d - size / 2, width: size, height: size, borderRadius: i % 2 ? '50%' : 14, background: c, transform: `rotate(${k * 400}deg) scale(${1 - k * 0.7})`}} />
        );
      })}
    </AbsoluteFill>
  );
};

const CHANNELS = [
  {text: 'واتساب', bg: P.teal, fg: P.onTeal},
  {text: 'رسايل الصفحة', bg: P.surface, fg: P.ink},
  {text: '', bg: P.surface, fg: P.ink},
];
const LINE_COLORS = [P.teal, P.orange, P.teal];
// the speed lines inside the logo file (720 × 466 px)
const LOGO_LINES = [
  {x: 213, y: 155, w: 58},
  {x: 213, y: 190, w: 62},
  {x: 213, y: 226, w: 58},
];

/** The real logo: the sting plays, then the still holds. Never redrawn. */
const Logo: React.FC<{t: number}> = ({t}) => {
  const from = Math.round(s6.sting * FPS);
  return (
    <>
      <Sequence from={from} durationInFrames={Math.round(3.2 * FPS)} layout="none">
        <OffthreadVideo src={staticFile('ibdaa-logo-sting.mp4')} muted style={{width: '100%', height: '100%'}} />
      </Sequence>
      {t >= s6.sting + 3.2 - 1 / FPS ? <Img src={staticFile('ibdaa-logo-dark.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} /> : null}
    </>
  );
};

const Brand: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const dock = sp(frame, s7.dock, HEAVY);
  const z = lerp(1, 0.62, dock);
  const cy = lerp(840, 330, dock);
  const LW = 1080 * z;
  const LH = 699 * z;
  const map = (px: number, py: number) => ({x: W / 2 + (px - 360) * 1.5 * z, y: cy + (py - 233) * 1.5 * z});
  const bubbleK = s7.bubbles.map((b) => sp(frame, b, {damping: 15, stiffness: 150, mass: 0.8}));
  const ring = clamp01((t - s6.hit) / 0.8);
  const beat = t > s7.cta ? Math.exp(-(((t - s7.cta) % BEAT) / BEAT) * 5) : 0;
  const ctaK = sp(frame, s7.cta, POP);
  const typing = (i: number) => Math.max(0, Math.sin(t * 6 - i * 0.9));

  return (
    <AbsoluteFill>
      <Converge t={t} />
      {t >= s6.hit && ring < 1 ? (
        <div style={{position: 'absolute', left: W / 2 - 1400 * ring, top: cy - 1400 * ring, width: 2800 * ring, height: 2800 * ring, borderRadius: '50%', border: `${50 * (1 - ring) + 2}px solid ${P.teal}`, opacity: 1 - ring}} />
      ) : null}
      {t >= s6.sting ? (
        <div style={{position: 'absolute', left: W / 2 - LW / 2, top: cy - LH / 2, width: LW, height: LH, mixBlendMode: 'lighten'}}>
          <Logo t={t} />
        </div>
      ) : null}

      {/* the logo's three lines pull out into chat bubbles */}
      {CHANNELS.map((c, i) => {
        const k = bubbleK[i];
        if (k <= 0) return null;
        const a = map(LOGO_LINES[i].x, LOGO_LINES[i].y);
        const from = {x: a.x, y: a.y - 6 * z, w: LOGO_LINES[i].w * 1.5 * z, h: 12 * z};
        const to = {x: i === 1 ? 160 : 280, y: 620 + i * 170, w: 640, h: 132};
        const x = lerp(from.x, to.x, k);
        const y = lerp(from.y, to.y, k);
        const w = lerp(from.w, to.w, k);
        const h = lerp(from.h, to.h, k);
        const content = clamp01((k - 0.6) / 0.4);
        const bg = k < 0.5 ? LINE_COLORS[i] : c.bg;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: R.pill, background: bg, border: i > 0 && k >= 0.5 ? `3px solid ${P.line}` : undefined, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.35)'}}>
            {i < 2 ? (
              <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 24, fontFamily: F.ar, fontWeight: 700, fontSize: 60, color: c.fg, opacity: content}}>
                <svg width={58} height={58} viewBox="0 0 58 58" style={{display: 'block'}}>
                  <path d="M 29 6 A 23 23 0 1 1 13 45 L 7 52 L 9 40 A 23 23 0 0 1 29 6 Z" fill="none" stroke={i === 0 ? c.fg : P.teal} strokeWidth={5} strokeLinejoin="round" />
                </svg>
                {c.text}
              </div>
            ) : (
              <div style={{display: 'flex', gap: 22, opacity: content}}>
                {[0, 1, 2].map((d) => (
                  <div key={d} style={{width: 30, height: 30, borderRadius: 15, background: P.ink, opacity: 0.4 + 0.6 * typing(d), transform: `translateY(${-10 * typing(d)}px)`}} />
                ))}
              </div>
            )}
          </div>
        );
      })}
      {t > s7.line1 - 0.05 ? (
        <>
          <Words text="قولّنا مجالك…" t={t} start={s7.line1} size={150} style={{position: 'absolute', top: 1150, left: 0, right: 0}} />
          <Words text="ونبعتلك الفكرة والتفاصيل كلها" t={t} start={s7.line2} size={58} weight={700} color={P.muted} style={{position: 'absolute', top: 1370, left: 40, right: 40}} />
        </>
      ) : null}
      {t > s7.cta ? (
        <div style={{position: 'absolute', top: 1540, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <div dir="rtl" style={{padding: '24px 76px', borderRadius: R.pill, background: P.orange, fontFamily: F.ar, fontWeight: 700, fontSize: 66, color: P.onOrange, transform: `scale(${ctaK * (1 + 0.04 * beat)})`}}>
            ابعتلنا رسالة
          </div>
        </div>
      ) : null}
      {t > s7.cta + 0.4 ? (
        <div dir="rtl" style={{position: 'absolute', top: 1760, left: 0, right: 0, textAlign: 'center', fontFamily: F.ar, fontWeight: 500, fontSize: 34, color: P.muted, opacity: prog(t, s7.cta + 0.4, s7.cta + 1)}}>
          إعلان متعمل بالذكاء الاصطناعي
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


