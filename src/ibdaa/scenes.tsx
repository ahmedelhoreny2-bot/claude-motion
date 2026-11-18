import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {
  Bars,
  Chip,
  Clip,
  ClipRun,
  clamp01,
  cutTimes,
  easeInOut,
  easeOut,
  FONT,
  FPS,
  img,
  P,
  Paper,
  Phone,
  prog,
  rand,
  Rise,
  sp,
  T,
  Tri,
  useFrameBox,
} from './kit';

const easeIn = (x: number) => x * x * x;
/** Absolute time for a scene that starts at `t0`. */
const useT = (t0: number) => t0 + useCurrentFrame() / FPS;

const txt = (size: number, color: string = P.ink, weight = 900): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: size,
  fontWeight: weight,
  color,
  lineHeight: 1.12,
  whiteSpace: 'nowrap',
});

/* ───────────────────────────── 1. Hook: paper tears, the triangle punches through ── */

const TEAR = Array.from({length: 15}, (_, i) => ({
  y: (i / 14) * 100,
  x: 50 + (i === 0 || i === 14 ? 0 : (rand(i * 3.1) - 0.5) * 7),
}));

const HookPaper: React.FC<{t: number; side: 'l' | 'r'}> = ({t}) => {
  const {W, tall} = useFrameBox();
  const s = W / 1080;
  const lines: [string, number, string, number, number][] = [
    ['دي…', 74, P.inkSoft, 600, 0],
    ['إشارة', 150, P.ink, 900, 120],
    ['إن إعلانك', 112, P.ink, 800, 40],
    ['محتاج يتحرك', 140, P.orange, 900, 0],
  ];
  return (
    <AbsoluteFill style={{background: P.cream}}>
      <Paper t={t} tone={P.cream} />
      <div
        style={{
          position: 'absolute',
          right: 80 * s,
          top: (tall ? 560 : 360) * s,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          direction: 'rtl',
        }}
      >
        {lines.map(([w, size, color, weight, mr], i) => (
          <div key={i} style={{marginRight: mr * s}}>
            <Rise k={prog(t, T.hook.words[i], T.hook.words[i] + 0.55, easeOut)}>
              <span style={txt(size * s, color, weight)}>{w}</span>
            </Rise>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Hook: React.FC = () => {
  const t = useT(0);
  const {W, H} = useFrameBox();
  const pre = prog(t, T.hook.tear - 0.45, T.hook.tear, easeIn);
  const g = prog(t, T.hook.tear, T.hook.tear + 0.6, easeOut) + prog(t, T.hook.fill, T.hook.end, easeIn) * 0.6;
  const shake = pre * (1 - g) * 6 * Math.sin(t * 90);
  const poly = (side: 'l' | 'r') =>
    `polygon(${side === 'l' ? '0% 0%' : '100% 0%'}, ${TEAR.map((p) => `${p.x}% ${p.y}%`).join(', ')}, ${
      side === 'l' ? '0% 100%' : '100% 100%'
    })`;
  const punch = sp(Math.round(t * FPS), T.hook.punch, {damping: 11, stiffness: 210, mass: 0.7});
  const fill = prog(t, T.hook.fill, T.hook.end, easeIn);
  const triScale = 0.05 + 1.05 * punch + 16 * fill;
  const crack = prog(t, T.hook.tear - 0.45, T.hook.tear, easeOut);
  return (
    <AbsoluteFill style={{background: P.teal, overflow: 'hidden'}}>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <Tri size={W * 0.42} style={{transform: `scale(${triScale}) rotate(${(1 - punch) * 25}deg)`}} />
      </AbsoluteFill>
      {(['l', 'r'] as const).map((side) => {
        const dir = side === 'l' ? -1 : 1;
        return (
          <AbsoluteFill
            key={side}
            style={{
              clipPath: poly(side),
              transform: `translateX(${dir * g * W * 0.24 + shake}px) rotate(${dir * g * 5}deg)`,
              transformOrigin: side === 'l' ? '0% 100%' : '100% 100%',
              filter: g > 0.01 ? `drop-shadow(${-dir * 6}px 0 10px rgba(0,0,0,0.25))` : undefined,
            }}
          >
            <HookPaper t={t} side={side} />
          </AbsoluteFill>
        );
      })}
      {crack > 0 && g < 0.05 ? (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <polyline
            points={TEAR.filter((p) => p.y <= crack * 100 + 0.01)
              .map((p) => `${(p.x / 100) * W},${(p.y / 100) * H}`)
              .join(' ')}
            fill="none"
            stroke={P.ink}
            strokeWidth={3}
            strokeLinejoin="round"
            opacity={0.55}
          />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

/* ───────────────────────────── 2. Intro: the orange collapses into the logo ── */

export const Logo: React.FC<{size: number; k?: number[]; tri?: number; colors?: string[]; triColor?: string}> = ({
  size,
  k = [1, 1, 1],
  tri = 1,
  colors,
  triColor,
}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: size * 0.12, direction: 'ltr'}}>
    <Tri size={size} color={triColor} style={{transform: `scale(${tri})`}} />
    <Bars w={size * 0.48} k={k} thick={size * 0.12} gap={size * 0.1} colors={colors} />
  </div>
);

export const Intro: React.FC = () => {
  const t = useT(T.intro.start);
  const {W, tall} = useFrameBox();
  const s = W / 1080;
  const c = prog(t, T.intro.start, T.intro.collapse, easeOut);
  const tri = 1 + 15 * (1 - c);
  const bars = T.intro.bars.map((b) => prog(t, b, b + 0.5, easeOut));
  const title = [0, 1].map((i) => prog(t, T.intro.title + i * 0.14, T.intro.title + i * 0.14 + 0.6, easeOut));
  const tag = prog(t, T.intro.tagline, T.intro.tagline + 0.7, easeOut);
  const breathe = 1 + 0.015 * Math.sin(t * 2.4);
  return (
    <AbsoluteFill>
      <Paper t={t} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 70 * s, flexDirection: 'column', paddingBottom: (tall ? 120 : 40) * s}}>
        <div style={{transform: `scale(${breathe})`}}>
          <Logo size={300 * s} k={bars} tri={tri} />
        </div>
        <div style={{direction: 'rtl', display: 'flex', gap: 30 * s}}>
          <Rise k={title[0]}>
            <span style={txt(150 * s)}>إبداع</span>
          </Rise>
          <Rise k={title[1]}>
            <span style={txt(150 * s, P.orange)}>بيتحرك</span>
          </Rise>
        </div>
        <div style={{direction: 'rtl', opacity: tag, transform: `translateY(${(1 - tag) * 24}px)`}}>
          <span style={txt(54 * s, P.inkSoft, 600)}>فكرتك على الشاشة… </span>
          <span style={txt(54 * s, P.orange, 800)}>بتتحرك وتبيع</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────────────────────────── 3. Work sections: "ده… <type>" + phone ── */

export type SectionData = {top: string; a: string; b: string; tags: string[]; client: string; clips: Clip[]};

export const SECTIONS: SectionData[] = [
  {top: 'ده…', a: 'إعلان', b: 'مطاعم', tags: ['CGI', 'موشن منتج'], client: 'عزوز · ناشفيل تشيكن', clips: [{src: 'az1', len: 2}, {src: 'az2', len: 3}, {src: 'az3', len: 2.8}]},
  {top: 'ده…', a: 'حملة', b: 'طبية', tags: ['شخصيات AI', 'قصة'], client: 'معمل العاصمة للتحاليل', clips: [{src: 'as1', len: 2.6}, {src: 'as2', len: 2.2}, {src: 'as3', len: 3}]},
  {top: 'ده…', a: 'موشن', b: 'جرافيك', tags: ['2D', 'Explainer'], client: 'معمل امتياز للتحاليل', clips: [{src: 'em1', len: 3.2}, {src: 'em2', len: 3}, {src: 'em3', len: 2.8}]},
  {top: 'ده…', a: 'توعية', b: 'بالأرقام', tags: ['إنفوجرافيك', 'Kinetic Type'], client: 'مركز سدرة للحجامة', clips: [{src: 'sd1', len: 3.4}, {src: 'sd2', len: 4.8}]},
  {top: 'ده…', a: 'إعلان', b: 'منتج', tags: ['HUD', 'CGI'], client: 'عسل نحل رقية', clips: [{src: 'ho1', len: 2.8}, {src: 'ho2', len: 3.4}, {src: 'ho3', len: 3.2}]},
  {top: 'ده…', a: 'إعلان', b: 'تعليمي', tags: ['سينمائي', 'VFX'], client: 'أ. عمرو الكفافي', clips: [{src: 'kf1', len: 2.8}, {src: 'kf2', len: 3}, {src: 'kf3', len: 2.4}]},
  {top: 'ده…', a: 'أكاديمية', b: 'أطفال', tags: ['ألوان مبهجة', '2D'], client: 'أكاديمية الملاك الصغير', clips: [{src: 'kd1', len: 2.8}, {src: 'kd2', len: 2.4}, {src: 'kd3', len: 3}]},
];

export const Section: React.FC<{i: number}> = ({i}) => {
  const d = SECTIONS[i];
  const t0 = T.sections[i];
  const t = useT(t0);
  const lt = t - t0;
  const frame = Math.round(t * FPS);
  const {W, H, tall} = useFrameBox();
  const s = W / 1080;
  const span = T.sectionLen + 0.2;

  const inK = sp(frame, t0 + 0.02, {damping: 16, stiffness: 150, mass: 0.9});
  const phoneW = (tall ? 560 : 420) * s;
  const cuts = cutTimes(d.clips, span);
  const flash = Math.max(0, ...cuts.slice(1).map((c) => 1 - clamp01((lt - c) / 0.14) - (lt < c ? 1 : 0)));
  const punch = Math.max(0, ...cuts.map((c) => (lt >= c ? 1 - clamp01((lt - c) / 0.35) : 0)));

  const word = (k: number, at: number) => prog(t, t0 + at, t0 + at + 0.6, easeOut) * k;
  const fit = (str: string, base: number) => Math.min(base, ((tall ? 900 : 370) * s) / (str.length * 0.66));

  const phone = (
    <div
      style={{
        transform: `translateX(${(1 - inK) * -W * 0.9}px) rotate(${(1 - inK) * -14 - 3 + Math.sin(lt * 1.3) * 1.2}deg) translateY(${Math.sin(lt * 1.7) * 6 * s}px)`,
      }}
    >
      <Phone w={phoneW}>
        <AbsoluteFill style={{transform: `scale(${1 + punch * 0.07})`}}>
          <ClipRun clips={d.clips} span={span} />
        </AbsoluteFill>
        <AbsoluteFill style={{background: P.white, opacity: flash * 0.55}} />
      </Phone>
    </div>
  );

  const label = (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', direction: 'rtl', width: (tall ? 920 : 420) * s}}>
      <Rise k={word(1, 0.25)}>
        <span style={txt(64 * s, P.inkSoft, 600)}>{d.top}</span>
      </Rise>
      <div style={{marginRight: 70 * s}}>
        <Rise k={word(1, 0.38)}>
          <span style={txt(fit(d.a, 120 * s), P.ink, 900)}>{d.a}</span>
        </Rise>
      </div>
      <Rise k={word(1, 0.5)}>
        <span style={txt(fit(d.b, 140 * s), P.orange, 900)}>{d.b}</span>
      </Rise>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 16 * s, marginTop: 34 * s, direction: 'rtl'}}>
        {d.tags.map((tg, j) => (
          <Chip key={j} size={34 * s} k={sp(frame, t0 + 0.95 + j * 0.2, {damping: 10, stiffness: 220, mass: 0.7})}>
            {tg}
          </Chip>
        ))}
      </div>
      <div
        style={{
          ...txt(32 * s, P.inkSoft, 600),
          marginTop: 30 * s,
          display: 'flex',
          alignItems: 'center',
          gap: 14 * s,
          opacity: prog(t, t0 + 1.4, t0 + 1.9, easeOut),
        }}
      >
        <div style={{width: 38 * s, height: 6 * s, borderRadius: 6 * s, background: P.teal}} />
        {d.client}
      </div>
    </div>
  );

  const num = `0${i + 1}`;
  const barsK = [0, 1, 2].map((j) => prog(t, t0 + 0.15 + j * 0.08, t0 + 0.9 + j * 0.08, easeOut));
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Paper t={t} />
      <div
        style={{
          position: 'absolute',
          ...(tall ? {left: 60 * s, top: 110 * s} : {right: 50 * s, bottom: 40 * s}),
          ...txt(420 * s, 'transparent', 900),
          WebkitTextStroke: `${3 * s}px ${P.teal}`,
          opacity: 0.35,
          transform: `translateY(${(1 - inK) * 120}px)`,
        }}
      >
        {num}
      </div>
      {/* speed bars trailing the phone */}
      <div
        style={{
          position: 'absolute',
          left: (tall ? W / 2 + phoneW * 0.3 : 80 * s + phoneW * 0.75) + (1 - inK) * -W * 0.6,
          top: tall ? H - 90 * s - phoneW * 1.85 * 0.4 : H * 0.68,
        }}
      >
        <Bars w={(tall ? 360 : 300) * s} k={barsK} thick={26 * s} gap={22 * s} />
      </div>
      {tall ? (
        <>
          <div style={{position: 'absolute', right: 80 * s, top: 170 * s}}>{label}</div>
          <div style={{position: 'absolute', left: (W - phoneW) / 2 - 20 * s, bottom: 90 * s}}>{phone}</div>
        </>
      ) : (
        <>
          <div style={{position: 'absolute', right: 70 * s, top: 250 * s}}>{label}</div>
          <div style={{position: 'absolute', left: 60 * s, top: (H - phoneW * 1.85) / 2}}>{phone}</div>
        </>
      )}
      <div style={{position: 'absolute', left: 60 * s, top: 54 * s, ...txt(26 * s, P.inkSoft, 600), letterSpacing: '0.2em', direction: 'ltr'}}>
        {num} / 07
      </div>
    </AbsoluteFill>
  );
};

/* ───────────────────────────── 4. Designs: posters fly into a collage ── */

const POSTERS = [
  {f: 'p05', x: 0.2, y: 0.47, r: -7, w: 0.27},
  {f: 'p01', x: 0.48, y: 0.45, r: 4, w: 0.25},
  {f: 'p03', x: 0.79, y: 0.5, r: -3, w: 0.26},
  {f: 'p07', x: 0.14, y: 0.74, r: 5, w: 0.25},
  {f: 'p11', x: 0.48, y: 0.69, r: -2, w: 0.42},
  {f: 'p09', x: 0.83, y: 0.77, r: 6, w: 0.26},
  {f: 'p06', x: 0.31, y: 0.9, r: -5, w: 0.25},
  {f: 'p02', x: 0.62, y: 0.9, r: 3, w: 0.24},
  {f: 'p12', x: 0.5, y: 0.55, r: -4, w: 0.36},
];

export const Designs: React.FC = () => {
  const t = useT(T.designs.start);
  const frame = Math.round(t * FPS);
  const {W, H, tall} = useFrameBox();
  const s = W / 1080;
  const push = 1 + 0.06 * prog(t, T.designs.cards + 1.6, T.designs.end, easeInOut);
  const yScale = tall ? 1.08 : 1;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Paper t={t} />
      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 65%'}}>
        {POSTERS.map((p, i) => {
          const k = sp(frame, T.designs.cards + i * 0.16, {damping: 15, stiffness: 120, mass: 0.9});
          const fromX = (rand(i + 4) - 0.5) * 2.4 * W;
          const fromY = H * (1.1 + rand(i + 9) * 0.4);
          const w = p.w * W * (tall ? 1.15 : 1);
          const cy = (tall ? 0.12 : 0) * H + p.y * H * (tall ? 0.85 : 1) * yScale * 0.98;
          return (
            <div
              key={p.f}
              style={{
                position: 'absolute',
                left: p.x * W - w / 2 + (1 - k) * fromX,
                top: cy - w * 0.7 + (1 - k) * fromY,
                width: w,
                transform: `rotate(${p.r + (1 - k) * (rand(i) - 0.5) * 80}deg)`,
                padding: 8 * s,
                background: P.white,
                borderRadius: 18 * s,
                boxShadow: `0 ${18 * s}px ${40 * s}px ${P.shadow}`,
              }}
            >
              <Img src={img(`posters/${p.f}.jpg`)} style={{width: '100%', display: 'block', borderRadius: 12 * s}} />
            </div>
          );
        })}
      </AbsoluteFill>
      <div style={{position: 'absolute', right: 70 * s, top: (tall ? 150 : 70) * s, direction: 'rtl', display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
        <Rise k={prog(t, T.designs.label, T.designs.label + 0.6, easeOut)}>
          <span style={txt(60 * s, P.inkSoft, 600)}>وده…</span>
        </Rise>
        <div style={{display: 'flex', gap: 24 * s}}>
          <Rise k={prog(t, T.designs.label + 0.12, T.designs.label + 0.72, easeOut)}>
            <span style={txt(96 * s)}>تصميمات</span>
          </Rise>
          <Rise k={prog(t, T.designs.label + 0.24, T.designs.label + 0.84, easeOut)}>
            <span style={txt(96 * s, P.orange)}>وهويات</span>
          </Rise>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ───────────────────────────── 5. Hero: one burger, 20 styles ── */

const COLS = 5;
const ROWS = 4;
const LOGO_TILE = 12;
const START_TILE = 6;

export const Hero: React.FC = () => {
  const t = useT(T.hero.start);
  const frame = Math.round(t * FPS);
  const {W, H, tall} = useFrameBox();
  const s = W / 1080;
  const tw = (tall ? 200 : 186) * s;
  const th = tw * (16 / 9);
  const gap = 14 * s;
  const gw = COLS * tw + (COLS - 1) * gap;
  const gh = ROWS * th + (ROWS - 1) * gap;
  const center = (idx: number) => ({
    x: (idx % COLS) * (tw + gap) + tw / 2 - gw / 2,
    y: Math.floor(idx / COLS) * (th + gap) + th / 2 - gh / 2,
  });
  const z = prog(t, T.hero.start + 0.1, T.hero.zoomEnd, easeInOut);
  const crash = prog(t, T.hero.crash, T.hero.end, easeIn);
  const fit = Math.min(W / gw, H / gh) * 1.02;
  const a = center(START_TILE);
  const b = center(LOGO_TILE);
  let scale = 3.6 + (fit - 3.6) * z;
  let fx = a.x * (1 - z);
  let fy = a.y * (1 - z);
  scale *= 1 + 0.03 * prog(t, T.hero.zoomEnd, T.hero.crash, (x) => x);
  scale += crash * 14;
  fx = fx * (1 - crash) + b.x * crash;
  fy = fy * (1 - crash) + b.y * crash;
  const card = prog(t, T.hero.title - 0.2, T.hero.title + 0.4, easeOut) * (1 - prog(t, T.hero.crash - 0.5, T.hero.crash, easeIn));
  const styles = ['CGI', 'VFX', '3D', 'UGC', 'HUD', 'صلصال', 'Vox', 'عاجل', 'جيمنج', 'ماسكوت'];
  let n = 0;
  return (
    <AbsoluteFill style={{background: P.cream, overflow: 'hidden'}}>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{position: 'relative', width: gw, height: gh, transform: `scale(${scale}) translate(${-fx}px, ${-fy}px)`}}>
          {Array.from({length: COLS * ROWS}, (_, idx) => {
            const c = center(idx);
            const isLogo = idx === LOGO_TILE;
            const file = isLogo ? null : `stills/b${String(++n).padStart(2, '0')}.jpg`;
            const pop = sp(frame, T.hero.start + 0.2 + Math.hypot(c.x - a.x, c.y - a.y) / (gw * 1.4), {damping: 13, stiffness: 160});
            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: c.x + gw / 2 - tw / 2,
                  top: c.y + gh / 2 - th / 2,
                  width: tw,
                  height: th,
                  borderRadius: 12 * s,
                  overflow: 'hidden',
                  background: isLogo ? P.cream : P.ink,
                  transform: `scale(${idx === START_TILE ? 1 : 0.6 + 0.4 * pop})`,
                  opacity: idx === START_TILE ? 1 : clamp01(pop * 1.5),
                  boxShadow: `0 ${6 * s}px ${14 * s}px ${P.shadow}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {file ? <Img src={img(file)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <Logo size={62 * s} />}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: card}}>
        <div
          style={{
            background: 'rgba(244,241,234,0.94)',
            borderRadius: 40 * s,
            padding: `${50 * s}px ${70 * s}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            direction: 'rtl',
            transform: `scale(${0.9 + 0.1 * card})`,
            boxShadow: `0 ${30 * s}px ${80 * s}px ${P.shadow}`,
            maxWidth: W * 0.88,
          }}
        >
          <Rise k={prog(t, T.hero.title, T.hero.title + 0.6, easeOut)}>
            <span style={txt(76 * s, P.ink, 800)}>برجر واحد…</span>
          </Rise>
          <Rise k={prog(t, T.hero.sub, T.hero.sub + 0.6, easeOut)}>
            <span style={{...txt(190 * s, P.orange, 900), display: 'flex', gap: 40 * s, direction: 'rtl'}}>
              <span>20</span>
              <span>ستايل</span>
            </span>
          </Rise>
          <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 * s, marginTop: 24 * s, maxWidth: 760 * s}}>
            {styles.map((st, j) => (
              <Chip key={st} size={30 * s} k={sp(frame, T.hero.styles + j * 0.11, {damping: 10, stiffness: 220, mass: 0.7})}>
                {st}
              </Chip>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────────────────────────── 6. Offer: starts from 300 ── */

export const Offer: React.FC = () => {
  const t = useT(T.offer.start);
  const frame = Math.round(t * FPS);
  const {W, H} = useFrameBox();
  const s = W / 1080;
  const c = prog(t, T.offer.count, T.offer.countEnd, easeOut);
  const val = Math.round(300 * c);
  const land = sp(frame, T.offer.countEnd - 0.05, {damping: 8, stiffness: 200});
  const flood = prog(t, T.offer.end - 0.45, T.offer.end, easeIn);
  const barsK = [0, 1, 2].map((j) => prog(t, T.offer.from + j * 0.1, T.offer.from + 0.7 + j * 0.1, easeOut));
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Paper t={t} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', direction: 'rtl'}}>
        <Rise k={prog(t, T.offer.from, T.offer.from + 0.6, easeOut)}>
          <span style={txt(96 * s, P.ink, 800)}>تبدأ من</span>
        </Rise>
        <div
          style={{
            ...txt(400 * s, P.orange, 900),
            lineHeight: 1,
            direction: 'ltr',
            fontVariantNumeric: 'tabular-nums',
            transform: `scale(${(0.7 + 0.3 * c) * (1 + 0.08 * Math.sin(land * Math.PI))})`,
            opacity: clamp01(c * 3),
          }}
        >
          {val}
        </div>
        <Rise k={prog(t, T.offer.egp, T.offer.egp + 0.6, easeOut)}>
          <span style={txt(120 * s, P.ink, 900)}>
            جنيه <span style={{color: P.teal}}>بس</span>
          </span>
        </Rise>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 70 * s, top: H * 0.16}}>
        <Bars w={260 * s} k={barsK} thick={24 * s} gap={20 * s} />
      </div>
      <div style={{position: 'absolute', right: 70 * s, bottom: H * 0.14, transform: 'scaleX(-1)'}}>
        <Bars w={260 * s} k={barsK} thick={24 * s} gap={20 * s} colors={[P.orange, P.teal, P.orange]} />
      </div>
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        <div
          style={{
            position: 'absolute',
            left: W / 2,
            top: H / 2,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: P.orange,
            transform: `translate(-50%,-50%) scale(${flood * Math.hypot(W, H) * 0.21})`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────────────────────────── 7. CTA on solid orange ── */

export const Cta: React.FC = () => {
  const t = useT(T.cta.start);
  const frame = Math.round(t * FPS);
  const {W, H, tall} = useFrameBox();
  const s = W / 1080;
  const logoK = sp(frame, T.cta.logo, {damping: 14, stiffness: 140});
  const barsK = [0, 1, 2].map((j) => prog(t, T.cta.logo + 0.2 + j * 0.1, T.cta.logo + 0.8 + j * 0.1, easeOut));
  const wa = sp(frame, T.cta.wa, {damping: 11, stiffness: 200, mass: 0.7});
  const pulse = 1 + 0.03 * Math.max(0, Math.sin((t - T.cta.wa - 1) * 4));
  return (
    <AbsoluteFill style={{background: P.orange, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.16) 1.6px, transparent 1.8px)',
          backgroundSize: '36px 36px',
          backgroundPosition: `${(t * 6) % 36}px 0px`,
        }}
      />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', direction: 'rtl', gap: 36 * s, paddingBottom: (tall ? 300 : 230) * s}}>
        <Rise k={prog(t, T.cta.line1, T.cta.line1 + 0.6, easeOut)}>
          <span style={txt(130 * s, P.white, 900)}>ابعتلنا</span>
        </Rise>
        <div style={{display: 'flex', flexDirection: 'column', gap: 22 * s, alignItems: 'center'}}>
          {['① نوع البراند بتاعك', '② الفكرة اللي نفسك تنفذها'].map((c, j) => (
            <Chip key={j} size={50 * s} color={P.white} k={sp(frame, T.cta.chips[j], {damping: 11, stiffness: 200, mass: 0.7})}>
              {c}
            </Chip>
          ))}
        </div>
        <div
          style={{
            marginTop: 20 * s,
            background: P.white,
            borderRadius: 100 * s,
            padding: `${24 * s}px ${50 * s}px ${30 * s}px`,
            display: 'flex',
            alignItems: 'center',
            gap: 22 * s,
            transform: `scale(${(0.5 + 0.5 * wa) * pulse})`,
            opacity: clamp01(wa * 2),
            boxShadow: `0 ${20 * s}px ${50 * s}px rgba(120,30,0,0.3)`,
          }}
        >
          <span style={txt(40 * s, P.inkSoft, 600)}>واتساب</span>
          <span style={{...txt(62 * s, P.ink, 900), direction: 'ltr'}}>01130808848</span>
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: (tall ? 170 : 90) * s,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 22 * s,
          transform: `translateY(${(1 - logoK) * 200}px)`,
          opacity: clamp01(logoK * 2),
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 28 * s, direction: 'rtl'}}>
          <span style={txt(84 * s, P.white, 900)}>إبداع</span>
          <span style={txt(84 * s, P.ink, 900)}>بيتحرك</span>
          <Logo size={110 * s} k={barsK} triColor={P.white} colors={[P.white, P.ink, P.white]} />
        </div>
        <span style={{...txt(40 * s, P.white, 600), direction: 'rtl'}}>خلّي فكرتك… تتحرك</span>
      </div>
    </AbsoluteFill>
  );
};
