import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, SpringConfig, staticFile} from 'remotion';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog, rand} from '../../lib';
import {Tri, Words} from '../kit';
import {Extrude, P3, shade, Slab} from '../space';
import {ELASTIC, F, FPS, HEAVY, P, POP, R, sp, TL, W} from '../theme';

const {s5, s6, s7} = TL;
const BEAT = 60 / TL.bpm;

/* ---------------- scene 5: "عندنا فكرة لـ ___" ---------------- */

const Icon: React.FC<{kind: number; size: number; dark?: boolean}> = ({kind, size, dark}) => {
  const s = {stroke: dark ? shade(P.teal, 0.5) : P.teal, strokeWidth: 22, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none'};
  return (
    <svg width={size} height={size} viewBox="0 0 260 260" style={{display: 'block', overflow: 'visible'}}>
      {kind === 0 ? (
        <>
          <circle cx={130} cy={130} r={78} {...s} />
          <path d="M 30 60 V 110 M 50 60 V 200 M 70 60 V 110 M 30 110 Q 50 130 70 110" {...s} stroke={dark ? shade(P.ink, 0.45) : P.cream} strokeWidth={14} />
          <path d="M 228 60 Q 200 100 214 140 L 228 140 V 200" {...s} stroke={dark ? shade(P.ink, 0.45) : P.cream} strokeWidth={14} />
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
const STEP_DEG = 72;
const DRUM_R = 230;
const DRUM: Partial<SpringConfig> = {damping: 11, stiffness: 150, mass: 0.8};

const Fields: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const ends = [...s5.slots.slice(1), s5.final];
  const finalK = prog(t, s5.final, s5.final + 0.45, easeOut);
  const out = prog(t, s5.exit, s5.exit + 0.4, easeIn);
  const turns = [...s5.slots.slice(1), s5.final];
  const drum = STEP_DEG * turns.reduce((acc, at) => acc + sp(frame, at, DRUM), 0);
  const drumIn = sp(frame, s5.slots[0] - 0.1, {damping: 14, stiffness: 120});
  void finalK;
  return (
    <AbsoluteFill style={{...P3, opacity: out > 0 ? 1 - out : undefined, transform: `translateZ(${out * 400}px)`}}>
      <Words text="عندنا فكرة لـ" t={t} start={s5.head} size={120} style={{position: 'absolute', top: 470, left: 0, right: 0}} />
      {/* icon */}
      <div style={{position: 'absolute', left: W / 2 - 130, top: 760, width: 260, height: 260, ...P3, transform: 'translateZ(120px)'}}>
        {SLOTS.map((_, i) => {
          const k = sp(frame, s5.slots[i], POP);
          const o = prog(t, ends[i] - 0.12, ends[i] + 0.12, easeIn);
          if (k <= 0 || o >= 1) return null;
          return (
            <div key={i} style={{position: 'absolute', inset: 0, ...P3, transform: `rotateY(${(1 - k) * -120 + o * 120}deg) scale(${0.4 + 0.6 * clamp01(k) - 0.4 * o})`}}>
              <Extrude depth={34} layers={5} back={<Icon kind={i} size={260} dark />}>
                <Icon kind={i} size={260} />
              </Extrude>
            </div>
          );
        })}
        {t >= s5.final ? (
          <div style={{position: 'absolute', left: 30, top: 0, ...P3, transform: `rotateY(${(1 - sp(frame, s5.final, ELASTIC)) * -200 + Math.sin(t * 1.6) * 18}deg) scale(${sp(frame, s5.final, ELASTIC)})`}}>
            <Extrude depth={44} layers={7} back={<Tri size={220} color={shade(P.orange, 0.5)} />}>
              <Tri size={220} />
            </Extrude>
          </div>
        ) : null}
      </div>
      {/* the fields turn on a drum in space */}
      <div style={{position: 'absolute', top: 1080, left: 0, right: 0, height: 330, ...P3, transform: `translateZ(${lerp(-900, 0, drumIn)}px)`}}>
        <div style={{position: 'absolute', inset: 0, ...P3, transform: `rotateX(${drum}deg)`}}>
          {[...SLOTS, 'شغلك إنت'].map((w, i) => {
            const rel = ((drum - i * STEP_DEG) % 360 + 540) % 360 - 180;
            if (Math.abs(rel) > 62) return null;
            if (i === SLOTS.length && t < s5.slots[SLOTS.length - 1] + 0.3) return null;
            return (
              <div key={i} dir="rtl" style={{position: 'absolute', inset: 0, textAlign: 'center', fontFamily: F.display, fontSize: 176, lineHeight: '330px', color: i === SLOTS.length ? P.orange : P.ink, transform: `rotateX(${-i * STEP_DEG}deg) translateZ(${DRUM_R}px)`, backfaceVisibility: 'hidden', opacity: 1 - Math.abs(rel) / 66}}>
                {w}
              </div>
            );
          })}
        </div>
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
    <AbsoluteFill style={P3}>
      {Array.from({length: SHARDS}).map((_, i) => {
        const a = (i / SHARDS) * Math.PI * 2 + rand(i) * 0.4;
        const d = 1300 * (1 - k);
        const z0 = i % 2 ? 1100 : -1800;
        const zz = lerp(z0, 0, k);
        const sv = Math.min(1.6, 3 * k * k);
        const c = [P.teal, P.ink, P.teal][i % 3];
        const size = 40 + rand(i + 4) * 50;
        return (
          <div key={i} style={{position: 'absolute', left: W / 2 + Math.cos(a) * d - size / 2, top: 840 + Math.sin(a) * d - size / 2, width: size, height: size, borderRadius: i % 2 ? '50%' : 14, background: c, transform: `translateZ(${zz}px) rotate(${(a * 180) / Math.PI}deg) scale(${(1 - k * 0.7) * (1 + sv)}, ${(1 - k * 0.7) / (1 + sv * 0.5)}) rotateX(${k * 300}deg)`}} />
        );
      })}
    </AbsoluteFill>
  );
};

const CHANNELS = [
  {text: 'واتساب', bg: P.teal, fg: P.onTeal},
  {text: 'رسالة على الصفحة', bg: P.surface, fg: P.ink},
  {text: '', bg: P.surface, fg: P.ink},
];
const WHATSAPP = '01130808848';
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
    <AbsoluteFill style={P3}>
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
          <Extrude key={i} depth={30 * clamp01(k)} layers={4} back={<Slab color={shade(k < 0.5 ? LINE_COLORS[i] : i === 0 ? P.teal : P.line, 0.6)} radius={R.pill} />} style={{position: 'absolute', left: x, top: y, width: w, height: h, transform: `translateZ(${Math.sin(clamp01(k) * Math.PI) * 300}px) rotateY(${(1 - clamp01(k)) * -70 + Math.sin(t * 1.3 + i) * 6}deg) rotateX(${(1 - clamp01(k)) * 40}deg)`}}>
          <div style={{width: w, height: h, borderRadius: R.pill, background: bg, border: i > 0 && k >= 0.5 ? `3px solid ${P.line}` : undefined, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
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
          </Extrude>
        );
      })}
      {t > s7.line1 - 0.05 ? (
        <>
          <Words text="عندك فكرة عايزها تتحرك؟" t={t} start={s7.line1} size={112} style={{position: 'absolute', top: 1135, left: 70, right: 70}} />
          <Words text="وإحنا معاك في كل التفاصيل" t={t} start={s7.line2} size={56} weight={700} color={P.muted} style={{position: 'absolute', top: 1445, left: 40, right: 40}} />
        </>
      ) : null}
      {t > s7.cta ? (
        <div style={{position: 'absolute', top: 1580, left: 0, right: 0, display: 'flex', justifyContent: 'center', ...P3}}>
          <Extrude depth={34} layers={5} back={<Slab color={shade(P.orange, 0.5)} radius={R.pill} />} style={{transform: `translateZ(${80 + 40 * beat}px) scale(${ctaK * (1 + 0.04 * beat)}) rotateX(${(1 - clamp01(ctaK)) * 80 + Math.sin(t * 1.5) * 5}deg) rotateY(${Math.sin(t * 1.1) * 7}deg)`}}>
          <div dir="rtl" style={{padding: '22px 64px', borderRadius: R.pill, background: P.orange, fontFamily: F.ar, fontWeight: 700, fontSize: 60, color: P.onOrange, display: 'flex', gap: 26, alignItems: 'center'}}>
            <span>واتساب</span>
            <span dir="ltr" style={{fontFamily: F.display, fontSize: 68, letterSpacing: '0.02em'}}>{WHATSAPP}</span>
          </div>
          </Extrude>
        </div>
      ) : null}
      {t > s7.cta + 0.4 ? (
        <div dir="rtl" style={{position: 'absolute', top: 1775, left: 0, right: 0, textAlign: 'center', fontFamily: F.ar, fontWeight: 500, fontSize: 34, color: P.muted, opacity: prog(t, s7.cta + 0.4, s7.cta + 1)}}>
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


