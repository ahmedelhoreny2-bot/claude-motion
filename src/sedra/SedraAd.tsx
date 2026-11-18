import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import type {SpringConfig} from 'remotion';
import {Grain} from '../components/primitives';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog, sp as sp60} from '../lib';
import {Cup, FPS, H, Logo, S, SF, T, useSedraFonts, W} from './kit';
import WORDS from './words.json';

type Word = {w: string; s: number; e: number; para: number};
const WD = WORDS as Word[];
const B = T.beats;
/** Time of a beat (a word index into words.json). */
const at = (i: number) => WD[i].s;
const sp = (frame: number, t0: number, cfg: Partial<SpringConfig> = {}) => sp60(frame, t0, cfg, FPS);
const clean = (w: string) => w.replace(/[،.…:؟]/g, '');

// ---------------------------------------------------------------- scenes
const SCENES: {id: string; start: number}[] = [
  {id: 'hook', start: 0},
  {id: 'risk', start: at(B.risk)},
  {id: 'pivot', start: at(B.pivot)},
  {id: 'sunnah', start: at(B.sunnah)},
  {id: 'science', start: at(B.science)},
  {id: 'reveal', start: at(B.rise)},
  {id: 'p1', start: at(B.p1)},
  {id: 'p2', start: at(B.p2)},
  {id: 'p3', start: at(B.p3)},
  {id: 'sheikh', start: at(B.sheikh)},
  {id: 'services', start: at(B.services[0]) - 0.15},
  {id: 'women', start: at(B.women) - 0.2},
  {id: 'contra', start: at(B.contra) - 0.2},
  {id: 'days', start: at(B.days) - 0.2},
  {id: 'cta', start: at(B.cta) - 0.15},
];
const sceneEnd = (i: number) => (i + 1 < SCENES.length ? SCENES[i + 1].start : T.duration + 1);

/** Captions are hidden where the scene itself writes the spoken words. */
const NO_CAPTIONS: [number, number][] = [
  [B.hadith, B.science - 1],
  [B.sheikh, B.certs - 1],
  [B.services[0], B.days + 200],
];
const captionsOn = (wi: number) => !NO_CAPTIONS.some(([a, b]) => wi >= a && wi <= b);

const IMPACTS = [B.punch, 28, B.hit, B.cta];
const FLASHES = [B.risk, B.sunnah, B.science, B.hit, B.p1, B.p2, B.p3, B.sheikh, ...B.services, B.women, B.contra, B.days, B.cta];

// ---------------------------------------------------------------- pieces
const Center: React.FC<{top: number; children: React.ReactNode; style?: React.CSSProperties}> = ({top, children, style}) => (
  <div style={{position: 'absolute', left: 70, right: 70, top, display: 'flex', flexDirection: 'column', alignItems: 'center', ...style}}>
    {children}
  </div>
);

const Pattern: React.FC<{t: number; opacity?: number; color?: string}> = ({t, opacity = 0.14, color = S.orange}) => {
  const star = (cx: number, cy: number, r: number) => {
    const sq = (rot: number) =>
      [0, 1, 2, 3].map((k) => {
        const a = rot + (k * Math.PI) / 2 + Math.PI / 4;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      }).join(' ');
    return (
      <g key={`${cx}-${cy}`}>
        <polygon points={sq(0)} fill="none" stroke={color} strokeWidth={2} />
        <polygon points={sq(Math.PI / 4)} fill="none" stroke={color} strokeWidth={2} />
        <circle cx={cx} cy={cy} r={r * 0.32} fill="none" stroke={color} strokeWidth={1.5} />
      </g>
    );
  };
  const cells = [];
  for (let y = -1; y < 9; y++) for (let x = -1; x < 6; x++) cells.push(star(x * 240 + (y % 2) * 120, y * 240, 96));
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity}}>
      <g transform={`translate(${-t * 6} ${-t * 10}) rotate(${t * 0.6} ${W / 2} ${H / 2})`}>{cells}</g>
    </svg>
  );
};

const Bg: React.FC<{t: number; tint?: string; pattern?: number}> = ({t, tint, pattern = 0}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 60% at 50% 38%, ${S.navy2} 0%, ${S.navy} 70%)`}}>
    {tint ? <AbsoluteFill style={{background: tint}} /> : null}
    {pattern > 0 ? <Pattern t={t} opacity={pattern} /> : null}
  </AbsoluteFill>
);

const FullPhoto: React.FC<{src: string; t: number; from: number; dur: number; focusY?: number; zoomFrom?: number; zoomTo?: number; panX?: number}> = ({
  src, t, from, dur, focusY = 45, zoomFrom = 1.18, zoomTo = 1.02, panX = 0,
}) => {
  const k = clamp01((t - from) / dur);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img
        src={staticFile(src)}
        style={{
          width: '100%', height: '100%', objectFit: 'cover', objectPosition: `50% ${focusY}%`,
          transform: `scale(${lerp(zoomFrom, zoomTo, easeOut(k))}) translateX(${panX * k}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

const Shade: React.FC<{strength?: number}> = ({strength = 1}) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(180deg, rgba(7,23,53,${0.55 * strength}) 0%, rgba(7,23,53,0) 22%, rgba(7,23,53,0) 48%, rgba(7,23,53,${0.92 * strength}) 78%, ${S.navy} 100%)`,
    }}
  />
);

const Pill: React.FC<{k: number; children: React.ReactNode; bg?: string; color?: string; size?: number; border?: string}> = ({
  k, children, bg = S.orange, color = S.navy, size = 40, border,
}) => (
  <div
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 16, direction: 'rtl', padding: '10px 34px 16px', borderRadius: 999,
      background: bg, color, fontFamily: SF.ar, fontWeight: 900, fontSize: size, border,
      opacity: clamp01(k * 2), transform: `scale(${0.6 + 0.4 * k})`, boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
    }}
  >
    {children}
  </div>
);

const Icon: React.FC<{kind: 'shield' | 'glove' | 'clip' | 'warn' | 'pin' | 'phone' | 'check' | 'women'; size?: number; color?: string}> = ({
  kind, size = 64, color = S.navy,
}) => {
  const p: Record<string, React.ReactNode> = {
    shield: <><path d="M32 4 L56 13 V31 C56 46 45 56 32 60 C19 56 8 46 8 31 V13 Z" fill="none" stroke={color} strokeWidth={5} strokeLinejoin="round" /><path d="M21 32 L29 40 L44 24" fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" /></>,
    glove: <path d="M18 58 V30 L14 20 C12 15 18 13 20 17 L23 25 V10 C23 5 30 5 30 10 V24 V7 C30 2 37 2 37 7 V24 V10 C37 5 44 5 44 10 V27 V16 C44 11 51 11 51 16 V40 C51 50 45 58 38 58 Z" fill="none" stroke={color} strokeWidth={4.5} strokeLinejoin="round" />,
    clip: <><rect x="12" y="10" width="40" height="50" rx="5" fill="none" stroke={color} strokeWidth={5} /><rect x="22" y="5" width="20" height="10" rx="3" fill={color} /><path d="M21 36 L29 44 L44 27" fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" /></>,
    warn: <><path d="M32 6 L60 56 H4 Z" fill="none" stroke={color} strokeWidth={5} strokeLinejoin="round" /><path d="M32 24 V40" stroke={color} strokeWidth={6} strokeLinecap="round" /><circle cx="32" cy="48" r="3.5" fill={color} /></>,
    pin: <><path d="M32 60 C32 60 12 38 12 25 A20 20 0 0 1 52 25 C52 38 32 60 32 60 Z" fill={color} /><circle cx="32" cy="25" r="7" fill={S.orange} /></>,
    phone: <path d="M18 6 L28 18 L22 26 C26 34 30 38 38 42 L46 36 L58 46 L52 56 C30 58 6 34 8 12 Z" fill={color} />,
    check: <><circle cx="32" cy="32" r="27" fill={color} /><path d="M20 33 L28 41 L45 24" fill="none" stroke={S.cream} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" /></>,
    women: <><circle cx="32" cy="18" r="11" fill="none" stroke={color} strokeWidth={5} /><path d="M12 60 C12 42 20 34 32 34 C44 34 52 42 52 60" fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 64 64">{p[kind]}</svg>;
};

/** Spoken words revealed in sync with the voice (word i appears when it is said). */
const Synced: React.FC<{t: number; from: number; to: number; size: number; color?: string; accent?: number[]; font?: string; weight?: number; lineHeight?: number}> = ({
  t, from, to, size, color = S.cream, accent = [], font = SF.ar, weight = 900, lineHeight = 1.3,
}) => (
  <div style={{direction: 'rtl', textAlign: 'center', fontFamily: font, fontWeight: weight, fontSize: size, lineHeight, color}}>
    {WD.slice(from, to + 1).map((w, j) => {
      const i = from + j;
      const k = prog(t, w.s - 0.08, w.s + 0.22, easeOut);
      return (
        <React.Fragment key={i}>
          <span
            style={{
              display: 'inline-block',
              opacity: 0.12 + 0.88 * k,
              transform: `translateY(${(1 - k) * 18}px)`,
              color: accent.includes(i) ? S.orange : undefined,
            }}
          >
            {clean(w.w)}
          </span>{' '}
        </React.Fragment>
      );
    })}
  </div>
);

const VirusBadge: React.FC<{k: number; letter: string; t: number}> = ({k, letter, t}) => (
  <div style={{transform: `scale(${k}) rotate(${(1 - k) * -40 + Math.sin(t * 2) * 4}deg)`, opacity: clamp01(k * 2)}}>
    <svg width={250} height={250} viewBox="-125 -125 250 250">
      {Array.from({length: 12}, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <g key={i}>
            <line x1={Math.cos(a) * 78} y1={Math.sin(a) * 78} x2={Math.cos(a) * 108} y2={Math.sin(a) * 108} stroke={S.orange} strokeWidth={7} />
            <circle cx={Math.cos(a) * 112} cy={Math.sin(a) * 112} r={10} fill={S.orange} />
          </g>
        );
      })}
      <circle r={82} fill="rgba(242,140,40,0.16)" stroke={S.orange} strokeWidth={8} />
      <text y={36} textAnchor="middle" fontFamily={SF.ar} fontWeight={900} fontSize={110} fill={S.cream}>
        {letter}
      </text>
    </svg>
  </div>
);

// ---------------------------------------------------------------- scenes
const Hook: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const punch = sp(frame, at(B.punch), {damping: 9, stiffness: 220});
  const end = at(B.risk);
  return (
    <>
      <AbsoluteFill style={{filter: `saturate(${0.55 + 0.45 * punch}) brightness(${0.62 + 0.18 * punch})`}}>
        <FullPhoto src="sedra/cups.jpg" t={t} from={0} dur={end} focusY={58} zoomFrom={1.75} zoomTo={1.3} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 75% 55% at 50% 42%, rgba(242,140,40,${0.25 * punch}) 0%, rgba(7,23,53,0) 60%, rgba(7,23,53,0.85) 100%)`}} />
      <Shade strength={0.9} />
    </>
  );
};

const Risk: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const s0 = at(B.risk);
  const chip = sp(frame, s0 + 0.1);
  const dirty = prog(t, at(B.dirty), at(B.dirty) + 2.2, easeOut);
  const red = prog(t, at(B.virus), at(B.virus) + 0.4, easeOut);
  const c = sp(frame, at(B.virC), {damping: 10, stiffness: 200});
  const b = sp(frame, at(B.virB), {damping: 10, stiffness: 200});
  const cupOut = prog(t, at(B.virus) - 0.2, at(B.virus) + 0.3, easeIn);
  return (
    <>
      <Bg t={t} tint={`rgba(120,20,10,${0.35 * red * (0.8 + 0.2 * Math.sin(t * 9))})`} />
      <Center top={250}>
        <Pill k={chip} size={36}>
          <Icon kind="warn" size={42} /> تحذير رسمي · NIH
        </Pill>
      </Center>
      <div style={{position: 'absolute', left: W / 2 - 220, top: 430, opacity: 1 - cupOut, transform: `scale(${1 - 0.3 * cupOut})`}}>
        <Cup size={440} t={t} dirty={dirty} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 480, display: 'flex', justifyContent: 'center', gap: 60, direction: 'ltr'}}>
        <VirusBadge k={c} letter="C" t={t} />
        <VirusBadge k={b} letter="B" t={t + 1} />
      </div>
    </>
  );
};

const Pivot: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const shine = prog(t, at(B.clean), at(B.clean) + 0.8, easeInOut);
  const dirty = 1 - prog(t, at(B.clean), at(B.clean) + 0.6, easeInOut);
  const glow = sp(frame, at(B.how), {damping: 10, stiffness: 180});
  return (
    <>
      <Bg t={t} tint={`radial-gradient(ellipse 60% 40% at 50% 34%, rgba(58,160,220,${0.35 * shine}) 0%, rgba(58,160,220,0) 70%)`} />
      <div style={{position: 'absolute', left: W / 2 - 240, top: 280, transform: `scale(${1 + 0.08 * glow})`}}>
        <Cup size={480} t={t} dirty={dirty} shine={shine} glow={shine} />
      </div>
      {shine > 0
        ? Array.from({length: 10}, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            const r = 200 + 160 * shine;
            return (
              <div key={i} style={{position: 'absolute', left: W / 2 + Math.cos(a) * r - 8, top: 560 + Math.sin(a) * r - 8, width: 16, height: 16, borderRadius: 8, background: S.skyHi, opacity: Math.sin(Math.PI * shine) * 0.9}} />
            );
          })
        : null}
    </>
  );
};

const Sunnah: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const chip = sp(frame, at(B.sunnah) + 0.05);
  const card = sp(frame, at(B.hadith) - 0.35, {damping: 15, stiffness: 140});
  return (
    <>
      <Bg t={t} pattern={0.16} />
      <Center top={300}>
        <Pill k={chip} bg={S.cream} size={42}>
          سُنّة نبوية
        </Pill>
        <div style={{marginTop: 40, fontFamily: SF.quote, fontWeight: 700, fontSize: 64, color: S.creamDim, opacity: prog(t, at(45), at(45) + 0.4, easeOut)}}>
          قال رسول الله ﷺ
        </div>
      </Center>
      <div
        style={{
          position: 'absolute', left: 70, right: 70, top: 640, padding: '50px 40px 60px', borderRadius: 40,
          background: 'rgba(7,23,53,0.75)', border: `3px solid ${S.orange}`, opacity: card, transform: `translateY(${(1 - card) * 80}px)`,
        }}
      >
        <div style={{textAlign: 'center', fontFamily: SF.quote, fontSize: 120, color: S.orange, lineHeight: 0.5, height: 60}}>❝</div>
        <Synced t={t} from={B.hadith} to={B.science - 1} size={96} font={SF.quote} weight={700} accent={[B.science - 1]} lineHeight={1.5} />
        <div style={{textAlign: 'center', fontFamily: SF.ar, fontWeight: 700, fontSize: 32, color: S.muted, marginTop: 16}}>رواه البخاري</div>
      </div>
    </>
  );
};

const Science: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const chip = sp(frame, at(B.science) + 0.05);
  const card = sp(frame, at(B.card), {damping: 14, stiffness: 150});
  const n = Math.round(18 * prog(t, at(B.count), at(B.count) + 0.7, easeOut));
  const big = sp(frame, at(B.count), {damping: 9, stiffness: 200});
  return (
    <>
      <Bg t={t} />
      <Center top={260}>
        <Pill k={chip} bg={S.sky} color={S.navy} size={40}>
          والعلم الحديث بيدرسها
        </Pill>
      </Center>
      <div
        style={{
          position: 'absolute', left: 100, right: 100, top: 420, padding: '40px 50px 46px', borderRadius: 34, background: S.cream,
          boxShadow: '0 40px 90px rgba(0,0,0,0.5)', opacity: clamp01(card * 1.5), transform: `translateY(${(1 - card) * 120}px) rotate(${(1 - card) * -6}deg)`,
        }}
      >
        <div style={{fontFamily: SF.ar, fontWeight: 900, fontSize: 70, color: S.navy, direction: 'ltr'}}>
          BMJ <span style={{color: S.blue}}>Open</span>
        </div>
        <div style={{fontFamily: SF.ar, fontWeight: 700, fontSize: 30, color: 'rgba(7,23,53,0.55)', direction: 'ltr'}}>Systematic review &amp; meta-analysis · 2018</div>
        <div style={{height: 3, background: 'rgba(7,23,53,0.12)', margin: '26px 0'}} />
        <div style={{display: 'flex', alignItems: 'center', gap: 30, direction: 'rtl'}}>
          <div style={{fontFamily: SF.ar, fontWeight: 900, fontSize: 200, lineHeight: 1, color: S.orange, transform: `scale(${0.6 + 0.4 * big})`, minWidth: 220, textAlign: 'center'}}>{n}</div>
          <div style={{fontFamily: SF.ar, fontWeight: 900, fontSize: 54, color: S.navy, lineHeight: 1.3}}>
            دراسة عن الحجامة
            <br />
            <span style={{opacity: prog(t, at(B.neck) + 0.6, at(B.neck) + 1, easeOut)}}>وآلام الرقبة</span>
          </div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1040, textAlign: 'center', fontFamily: SF.ar, fontWeight: 500, fontSize: 28, color: S.muted, opacity: card}}>
        المصدر: BMJ Open 2018 · PubMed 30397006
      </div>
    </>
  );
};

const Reveal: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const hit = at(B.hit);
  const k = sp(frame, hit, {damping: 8, stiffness: 200});
  const ring = prog(t, hit, hit + 1.1, easeOut);
  const build = prog(t, at(B.rise), hit, easeIn);
  const pin = sp(frame, at(B.place));
  return (
    <>
      <Bg t={t} tint={`radial-gradient(ellipse 70% 45% at 50% 40%, rgba(242,140,40,${0.1 + 0.3 * build + 0.2 * k}) 0%, rgba(242,140,40,0) 70%)`} pattern={0.08 * k} />
      {Array.from({length: 16}, (_, i) => {
        const a = (i / 16) * 360 + t * 12;
        return (
          <div key={i} style={{position: 'absolute', left: W / 2 - 4, top: 760 - 700, width: 8, height: 700, transformOrigin: '50% 100%', transform: `rotate(${a}deg)`, background: `linear-gradient(180deg, rgba(255,180,94,0) 0%, rgba(255,180,94,${0.25 * build * (1 - k * 0.6)}) 100%)`}} />
        );
      })}
      <div style={{position: 'absolute', left: W / 2 - 420, top: 760 - 420, width: 840, height: 840, borderRadius: '50%', border: `8px solid ${S.orange}`, opacity: (1 - ring) * (ring > 0 ? 0.9 : 0), transform: `scale(${0.3 + ring * 1.4})`}} />
      <Center top={380}>
        <div style={{transform: `scale(${0.4 + 0.6 * k})`, opacity: clamp01(k * 2)}}>
          <Logo size={560} />
        </div>
      </Center>
      <Center top={1060}>
        <Pill k={pin} bg={S.cream} size={44}>
          <Icon kind="pin" size={46} color={S.orange} /> زفتى · الغربية
        </Pill>
      </Center>
    </>
  );
};

const Pillar: React.FC<{t: number; frame: number; img: string; start: number; end: number; icon: 'shield' | 'glove' | 'clip'; label: string; n: number; focusY: number}> = ({
  t, frame, img, start, end, icon, label, n, focusY,
}) => {
  const badge = sp(frame, start + 0.25, {damping: 11, stiffness: 190});
  return (
    <>
      <FullPhoto src={img} t={t} from={start} dur={end - start + 0.4} focusY={focusY} panX={n % 2 ? 30 : -30} />
      <Shade />
      <div style={{position: 'absolute', right: 70, top: 260, display: 'flex', alignItems: 'center', gap: 20, direction: 'rtl', opacity: clamp01(badge * 2), transform: `translateX(${(1 - badge) * 120}px)`}}>
        <div style={{width: 110, height: 110, borderRadius: 30, background: S.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'}}>
          <Icon kind={icon} size={72} />
        </div>
        <div style={{fontFamily: SF.ar, fontWeight: 900, fontSize: 56, color: S.cream, textShadow: '0 4px 20px rgba(0,0,0,0.6)'}}>{label}</div>
      </div>
    </>
  );
};

const Sheikh: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const s0 = at(B.sheikh);
  const name = sp(frame, s0 + 0.15, {damping: 14, stiffness: 150});
  const certs = sp(frame, at(B.certs), {damping: 13, stiffness: 150});
  const card = (src: string, x: number, r: number, label: string, delay: number) => {
    const kk = sp(frame, at(B.certs) + delay, {damping: 12, stiffness: 160});
    return (
      <div style={{position: 'absolute', left: x, top: 330, width: 420, opacity: clamp01(kk * 2), transform: `translateY(${(1 - kk) * -200}px) rotate(${r * kk}deg)`}}>
        <div style={{background: '#fff', padding: 10, borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.55)', height: 290, overflow: 'hidden'}}>
          <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 28%'}} />
        </div>
        <div style={{fontFamily: SF.ar, fontWeight: 700, fontSize: 28, marginTop: 12, color: S.cream, textAlign: 'center', textShadow: '0 3px 12px rgba(0,0,0,0.8)'}}>{label}</div>
      </div>
    );
  };
  return (
    <>
      <FullPhoto src="sedra/sheikh.jpg" t={t} from={s0} dur={sceneEnd(9) - s0} focusY={22} zoomFrom={1.2} zoomTo={1.04} />
      <Shade />
      <AbsoluteFill style={{background: `rgba(7,23,53,${0.45 * certs})`}} />
      {card('sedra/cert1.jpg', W / 2 + 10, 4, 'دبلومة الطب الآمن والتكميلي', 0)}
      {card('sedra/cert2.jpg', W / 2 - 430, -4, 'العلاج بمنتجات ومصل النحل', 0.3)}
      <div style={{position: 'absolute', right: 70, left: 70, top: lerp(1180, 1000, certs), direction: 'rtl', opacity: clamp01(name * 2), transform: `translateX(${(1 - name) * 160}px)`}}>
        <div style={{display: 'inline-block', background: S.orange, color: S.navy, fontFamily: SF.ar, fontWeight: 900, fontSize: 36, padding: '6px 26px 12px', borderRadius: 14}}>أخصائي الحجامة</div>
        <div style={{fontFamily: SF.ar, fontWeight: 900, fontSize: 84, color: S.cream, lineHeight: 1.25, whiteSpace: 'nowrap', textShadow: '0 6px 30px rgba(0,0,0,0.7)'}}>الشيخ أحمد أبو يوسف</div>
      </div>
    </>
  );
};

const SERVICE_SHOTS: {img?: string; video?: number; label: string; focusY?: number}[] = [
  {img: 'sedra/cups.jpg', label: 'حجامة نبوية', focusY: 45},
  {video: 0, label: 'حجامة نارية'},
  {video: 2.4, label: 'فوطة نارية'},
  {img: 'sedra/honey.jpg', label: 'مصل النحل', focusY: 30},
  {img: 'sedra/training.jpg', label: 'إبر صيني', focusY: 40},
  {img: 'sedra/selfie.jpg', label: 'مساج', focusY: 45},
  {img: 'sedra/honey.jpg', label: 'منتجات طبيعية', focusY: 55},
];

const Services: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const starts = B.services.map(at);
  let i = 0;
  for (let k = 0; k < starts.length; k++) if (t >= starts[k] - 0.12) i = k;
  const shot = SERVICE_SHOTS[i];
  const s0 = starts[i] - 0.12;
  const end = i + 1 < starts.length ? starts[i + 1] : sceneEnd(10);
  const k = sp(frame, s0, {damping: 10, stiffness: 230});
  return (
    <>
      <AbsoluteFill style={{background: S.navy}} />
      {shot.video !== undefined ? (
        <Sequence from={Math.round(s0 * FPS)} layout="none">
          <AbsoluteFill style={{transform: `scale(${lerp(1.25, 1.05, prog(t, s0, end, easeOut))})`}}>
            <OffthreadVideo src={staticFile('sedra/fire.mp4')} startFrom={Math.round(shot.video * FPS)} muted style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.2) contrast(1.05)'}} />
          </AbsoluteFill>
        </Sequence>
      ) : (
        <FullPhoto src={shot.img!} t={t} from={s0} dur={end - s0 + 0.3} focusY={shot.focusY} zoomFrom={1.3} zoomTo={1.06} />
      )}
      <Shade />
      <Center top={1060}>
        <div style={{fontFamily: SF.ar, fontWeight: 900, fontSize: i === 6 ? 110 : 140, color: S.cream, textShadow: '0 8px 40px rgba(0,0,0,0.8)', transform: `scale(${0.7 + 0.3 * k})`, opacity: clamp01(k * 2)}}>
          {shot.label}
        </div>
        {i === 6 ? (
          <div style={{fontFamily: SF.ar, fontWeight: 900, fontSize: 64, color: S.orange, opacity: prog(t, at(146), at(146) + 0.3, easeOut)}}>من خير النحل</div>
        ) : null}
      </Center>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1420, display: 'flex', justifyContent: 'center', gap: 14}}>
        {SERVICE_SHOTS.map((_, j) => (
          <div key={j} style={{width: j === i ? 46 : 14, height: 14, borderRadius: 7, background: j <= i ? S.orange : 'rgba(246,242,233,0.35)'}} />
        ))}
      </div>
    </>
  );
};

const Women: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const k = sp(frame, at(B.women), {damping: 14, stiffness: 140});
  return (
    <>
      <Bg t={t} pattern={0.12} />
      <Center top={420}>
        <div style={{width: 230, height: 230, borderRadius: 115, background: S.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${k})`, boxShadow: '0 20px 60px rgba(0,0,0,0.4)'}}>
          <Icon kind="women" size={140} color={S.navy} />
        </div>
        <div style={{height: 60}} />
        <Synced t={t} from={B.women} to={B.contra - 1} size={88} accent={[151, 152, 153]} />
      </Center>
    </>
  );
};

const Contra: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const items: {at: number; text: string}[] = [
    {at: at(B.items[0]), text: 'الأنيميا'},
    {at: at(B.items[1]), text: 'أدوية السيولة'},
    {at: at(B.items[2]), text: 'القلب · الكلى · الكبد'},
  ];
  const tail = sp(frame, at(B.tail), {damping: 12, stiffness: 170});
  return (
    <>
      <Bg t={t} />
      <Center top={250}>
        <Synced t={t} from={B.contra} to={158} size={86} accent={[157, 158]} />
      </Center>
      <div style={{position: 'absolute', left: 90, right: 90, top: 560, direction: 'rtl'}}>
        {items.map((it, i) => {
          const kk = sp(frame, it.at - 0.05, {damping: 13, stiffness: 190});
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 28, padding: '26px 36px 32px', marginBottom: 22, borderRadius: 26, background: 'rgba(246,242,233,0.08)', border: `2px solid ${S.line}`, opacity: clamp01(kk * 2), transform: `translateX(${(1 - kk) * 140}px)`}}>
              <Icon kind="warn" size={56} color={S.orange} />
              <div style={{fontFamily: SF.ar, fontWeight: 900, fontSize: 58, color: S.cream}}>{it.text}</div>
            </div>
          );
        })}
      </div>
      <Center top={1080}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, opacity: clamp01(tail * 2), transform: `scale(${0.8 + 0.2 * tail})`}}>
          <Icon kind="check" size={90} color={S.orange} />
          <div style={{whiteSpace: 'nowrap'}}>
            <Synced t={t} from={B.tail} to={174} size={68} accent={[171]} />
          </div>
        </div>
        <div style={{marginTop: 26, fontFamily: SF.ar, fontWeight: 500, fontSize: 28, color: S.muted, opacity: tail}}>الحجامة لا تغني عن استشارة الطبيب</div>
      </Center>
    </>
  );
};

const Days: React.FC<{t: number; frame: number}> = ({t, frame}) => (
  <>
    <Bg t={t} pattern={0.12} />
    <Center top={340}>
      <Synced t={t} from={B.days} to={177} size={84} />
      <div style={{display: 'flex', gap: 34, marginTop: 70, direction: 'rtl'}}>
        {['١٧', '١٩', '٢١'].map((d, i) => {
          const k = sp(frame, at(B.dayCards[i]) - 0.05, {damping: 9, stiffness: 230, mass: 0.7});
          return (
            <div key={d} style={{width: 260, height: 300, borderRadius: 36, background: S.cream, overflow: 'hidden', transform: `scale(${k}) rotate(${(1 - k) * 12}deg)`, boxShadow: '0 30px 70px rgba(0,0,0,0.45)'}}>
              <div style={{height: 60, background: S.orange}} />
              <div style={{fontFamily: SF.ar, fontWeight: 900, fontSize: 150, color: S.navy, textAlign: 'center', lineHeight: 1.45}}>{d}</div>
            </div>
          );
        })}
      </div>
      <div style={{marginTop: 60}}>
        <Synced t={t} from={B.month} to={185} size={70} accent={[185]} />
      </div>
    </Center>
  </>
);

const Cta: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const logo = sp(frame, at(B.cta) - 0.1, {damping: 11, stiffness: 170});
  const phone = sp(frame, at(B.call), {damping: 10, stiffness: 200});
  const pulse = 1 + 0.035 * Math.sin((t - at(B.call)) * 6) * (t > at(B.call) + 0.5 ? 1 : 0);
  return (
    <>
      <Bg t={t} tint={`radial-gradient(ellipse 70% 40% at 50% 45%, rgba(242,140,40,0.22) 0%, rgba(242,140,40,0) 70%)`} pattern={0.1} />
      <Center top={250}>
        <div style={{transform: `scale(${0.5 + 0.5 * logo})`, opacity: clamp01(logo * 2)}}>
          <Logo size={330} />
        </div>
        <div style={{height: 30}} />
        <Synced t={t} from={B.cta} to={188} size={100} accent={[188]} />
      </Center>
      <Center top={900}>
        <div style={{display: 'flex', alignItems: 'center', gap: 22, direction: 'ltr', background: S.orange, borderRadius: 34, padding: '14px 46px 20px', transform: `scale(${(0.6 + 0.4 * phone) * pulse})`, opacity: clamp01(phone * 2), boxShadow: '0 24px 60px rgba(242,140,40,0.35)'}}>
          <Icon kind="phone" size={70} />
          <div style={{fontFamily: SF.ar, fontWeight: 900, fontSize: 104, color: S.navy, letterSpacing: '0.02em'}}>01148470010</div>
        </div>
        <div style={{marginTop: 30}}>
          <Pill k={sp(frame, at(192))} bg="#25D366" color="#fff" size={44}>
            اتصال أو واتساب
          </Pill>
        </div>
        <div style={{marginTop: 34, fontFamily: SF.ar, fontWeight: 700, fontSize: 40, color: S.creamDim, textAlign: 'center', direction: 'rtl', lineHeight: 1.5, opacity: prog(t, at(194), at(194) + 0.5, easeOut)}}>
          زفتى · شارع الجيش · كوبري المصرف
          <br />
          بجوار سوبر ماركت بشرة خير
        </div>
      </Center>
    </>
  );
};

// ---------------------------------------------------------------- captions
type Group = {from: number; to: number};
const GROUPS: Group[] = (() => {
  const out: Group[] = [];
  let cur: number[] = [];
  WD.forEach((w, i) => {
    cur.push(i);
    const letters = cur.reduce((n, j) => n + clean(WD[j].w).length, 0);
    const brk = /[،.…:؟]$/.test(w.w) || cur.length >= 3 || letters >= 16 || (i + 1 < WD.length && WD[i + 1].s - w.e > 0.25);
    if (brk) {
      out.push({from: cur[0], to: cur[cur.length - 1]});
      cur = [];
    }
  });
  return out;
})();

const Captions: React.FC<{t: number}> = ({t}) => {
  const g = GROUPS.find((gr, i) => {
    const next = GROUPS[i + 1];
    const end = next ? Math.min(next.from !== undefined ? WD[next.from].s - 0.02 : 1e9, WD[gr.to].e + 0.6) : WD[gr.to].e + 0.6;
    return t >= WD[gr.from].s - 0.06 && t < end;
  });
  if (!g || !captionsOn(g.from)) return null;
  const k = prog(t, WD[g.from].s - 0.06, WD[g.from].s + 0.12, easeOut);
  const hook = g.to < B.risk;
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: hook ? 1100 : 1240, display: 'flex', justifyContent: 'center'}}>
      <div style={{direction: 'rtl', textAlign: 'center', transform: `scale(${0.85 + 0.15 * k}) translateY(${(1 - k) * 20}px)`, opacity: k}}>
        {WD.slice(g.from, g.to + 1).map((w, j) => {
          const i = g.from + j;
          const on = t >= w.s - 0.03;
          const active = on && t < w.e + 0.05;
          return (
            <React.Fragment key={i}>
              <span
                style={{
                  display: 'inline-block', fontFamily: SF.ar, fontWeight: 900, fontSize: hook ? 118 : 84, lineHeight: 1.3,
                  color: active ? S.orange : S.cream, opacity: on ? 1 : 0.45,
                  transform: `scale(${active ? 1.08 : 1})`,
                  textShadow: '0 4px 0 rgba(7,23,53,0.9), 0 8px 30px rgba(0,0,0,0.7)',
                  WebkitTextStroke: '2px rgba(7,23,53,0.6)',
                  margin: '0 0.14em',
                }}
              >
                {clean(w.w)}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- composition
const SCENE_MAP: Record<string, React.FC<{t: number; frame: number}>> = {
  hook: Hook,
  risk: Risk,
  pivot: Pivot,
  sunnah: Sunnah,
  science: Science,
  reveal: Reveal,
  p1: (p) => <Pillar {...p} img="sedra/cups.jpg" start={SCENES[6].start} end={sceneEnd(6)} icon="shield" label="أدوات معقّمة" n={0} focusY={50} />,
  p2: (p) => <Pillar {...p} img="sedra/selfie.jpg" start={SCENES[7].start} end={sceneEnd(7)} icon="glove" label="جوانتي جديد" n={1} focusY={40} />,
  p3: (p) => <Pillar {...p} img="sedra/training.jpg" start={SCENES[8].start} end={sceneEnd(8)} icon="clip" label="سؤال قبل البدء" n={2} focusY={30} />,
  sheikh: Sheikh,
  services: Services,
  women: Women,
  contra: Contra,
  days: Days,
  cta: Cta,
};

export const SedraAd: React.FC = () => {
  useSedraFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const shake = IMPACTS.reduce((acc, i) => {
    const d = t - at(i);
    return d >= 0 && d < 0.6 ? acc + Math.exp(-d * 9) * 14 : acc;
  }, 0);
  const flash = FLASHES.reduce((acc, i) => {
    const d = t - at(i) + (i === B.hit ? 0 : 0.03);
    return d >= 0 && d < 0.3 ? Math.max(acc, Math.exp(-d * 16) * (i === B.hit ? 0.9 : 0.35)) : acc;
  }, 0);
  return (
    <AbsoluteFill style={{background: S.navy, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${Math.sin(t * 71) * shake}px, ${Math.cos(t * 53) * shake}px)`}}>
        {SCENES.map((s, i) => {
          const end = sceneEnd(i);
          if (t < s.start - 0.01 || t > end + 0.35) return null;
          const k = i === 0 ? 1 : prog(t, s.start, s.start + 0.3, easeOut);
          const Comp = SCENE_MAP[s.id];
          return (
            <AbsoluteFill key={s.id} style={{opacity: k, transform: `scale(${1.06 - 0.06 * k})`}}>
              <Comp t={t} frame={frame} />
            </AbsoluteFill>
          );
        })}
        <Captions t={t} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#fff', opacity: flash, pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 75% at 50% 45%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.45) 100%)'}} />
      <div style={{position: 'absolute', left: 0, top: 0, height: 10, width: `${(t / T.duration) * 100}%`, background: S.orange}} />
      {t > at(B.hit) + 1.5 && t < at(B.cta) - 0.3 ? (
        <div style={{position: 'absolute', left: 50, top: 60, opacity: 0.9}}>
          <Logo size={110} />
        </div>
      ) : null}
      <Grain frame={frame} opacity={0.06} />
    </AbsoluteFill>
  );
};

export const SEDRA_DURATION = Math.round(T.duration * FPS);
export {W as SEDRA_W, H as SEDRA_H};
