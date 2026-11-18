import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, useCurrentFrame} from 'remotion';
import {Bars, clamp01, easeInOut, easeOut, FONT, FPS, img, LightGrain, P, Paper, prog, rand, sp, Tri, useArabicFonts, useFrameBox} from '../ibdaa/kit';
import {Logo} from '../ibdaa/scenes';
import VO from './vo.json';

/* ───────────────────────── voice-driven timing ── */

type Wd = {w: string; t: number};
type Phrase = {text: string; start: number; end: number; words: Wd[]};
type Line = {id: string; start: number; end: number; phrases: Phrase[]};
const LINES = VO.lines as Line[];
const L = (id: string) => LINES.find((l) => l.id === id)!;
const nextStart = (id: string) => {
  const i = LINES.findIndex((l) => l.id === id);
  return i + 1 < LINES.length ? LINES[i + 1].start : VO.duration;
};
export const PROMO_DURATION = VO.duration;
const LEAD = 0.12;
const wt = (id: string, p: number, w = 0) => L(id).phrases[p].words[w].t;

const useT = (t0: number) => t0 + useCurrentFrame() / FPS;
const fr = (t: number) => Math.round(t * FPS);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const easeIn = (x: number) => x * x * x;

const txt = (size: number, color: string = P.ink, weight = 900): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: size,
  fontWeight: weight,
  color,
  lineHeight: 1.4,
  whiteSpace: 'nowrap',
});
/** Font size that keeps `s` inside `maxW` px. */
const fit = (s: string, maxW: number, base: number) => Math.min(base, maxW / (s.replace(/\s/g, '').length * 0.74 + s.split(' ').length * 0.45));
const SHADOW = '0 6px 30px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.5)';

/** One word that pops in exactly when it is spoken. Never clipped. */
const Pop: React.FC<{t: number; at: number; children: React.ReactNode; style?: React.CSSProperties; slam?: boolean}> = ({t, at, children, style, slam}) => {
  const k = sp(fr(t), at - 0.04, slam ? {damping: 11, stiffness: 320, mass: 0.6} : {damping: 13, stiffness: 260, mass: 0.6});
  if (t < at - 0.06) return <span style={{...style, opacity: 0}}>{children}</span>;
  const sc = slam ? 2.1 - 1.1 * k : 0.7 + 0.3 * k;
  return (
    <span
      style={{
        display: 'inline-block',
        opacity: clamp01(k * 2.5),
        transform: `translateY(${(1 - k) * 0.35}em) scale(${sc})`,
        filter: k < 0.85 ? `blur(${(1 - k) * 10}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </span>
  );
};

/** A phrase whose words pop on their own timestamps. */
const Words: React.FC<{t: number; ph: Phrase; size: number; color?: string; weight?: number; hi?: string[]; hiColor?: string; shadow?: boolean; slam?: boolean; gap?: number}> = ({
  t,
  ph,
  size,
  color = P.ink,
  weight = 900,
  hi = [],
  hiColor = P.orange,
  shadow,
  slam,
  gap = 0.28,
}) => (
  <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', direction: 'rtl', columnGap: size * gap, rowGap: 0, padding: `0 ${size * 0.5}px`}}>
    {ph.words.map((w, i) => (
      <Pop key={i} t={t} at={w.t} slam={slam}>
        <span style={{...txt(size, hi.includes(w.w) ? hiColor : color, weight), textShadow: shadow ? SHADOW : undefined}}>{w.w}</span>
      </Pop>
    ))}
  </div>
);

const Center: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', direction: 'rtl', ...style}}>{children}</AbsoluteFill>
);

const Clip: React.FC<{src: string; from?: number; rate?: number; style?: React.CSSProperties}> = ({src, from = 0, rate = 1, style}) => (
  <OffthreadVideo
    src={img(`clips/${src}.mp4`)}
    startFrom={Math.round(from * FPS)}
    playbackRate={rate}
    muted
    style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style}}
  />
);

/** Plays clips back to back, each starting at its own absolute time; zoom punch + flash on every cut. */
const Cuts: React.FC<{t0: number; t: number; cuts: {at: number; src: string; from?: number}[]; punch?: number}> = ({t0, t, cuts, punch = 0.12}) => {
  const idx = Math.max(0, cuts.filter((c) => t >= c.at).length - 1);
  const c = cuts[idx];
  const since = t - c.at;
  const z = 1 + punch * (1 - clamp01(since / 0.35)) ** 2;
  const flash = idx > 0 ? 1 - clamp01(since / 0.1) : 0;
  return (
    <AbsoluteFill>
      {cuts.map((cc, i) => {
        const end = i + 1 < cuts.length ? cuts[i + 1].at : 999;
        return (
          <Sequence key={i} from={fr(cc.at - t0)} durationInFrames={Math.max(1, fr(Math.min(end, t0 + 60) - cc.at) + 1)} layout="none">
            <AbsoluteFill style={{transform: `scale(${i === idx ? z : 1})`}}>
              <Clip src={cc.src} from={cc.from ?? 0} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      <AbsoluteFill style={{background: P.white, opacity: flash * 0.7}} />
    </AbsoluteFill>
  );
};

const Shade: React.FC<{top?: number; bottom?: number}> = ({top = 0.55, bottom = 0.6}) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(180deg, rgba(0,0,0,${top}) 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,0) 58%, rgba(0,0,0,${bottom}) 100%)`,
    }}
  />
);

/* ───────────────────────── 1. Hook: a racing feed slams to a stop, the signal rings out, then a shot per word ── */

const FEED = ['stills/b01.jpg', 'posters/p03.jpg', 'stills/b04.jpg', 'posters/p05.jpg', 'stills/b09.jpg', 'posters/p01.jpg', 'stills/b15.jpg', 'posters/p07.jpg', 'stills/b11.jpg', 'posters/p09.jpg', 'stills/b06.jpg', 'posters/p02.jpg', 'stills/b18.jpg', 'posters/p04.jpg', 'stills/b13.jpg', 'posters/p06.jpg', 'stills/b02.jpg', 'posters/p10.jpg'];

const Feed: React.FC<{y: number; blur: number}> = ({y, blur}) => {
  const {W, H} = useFrameBox();
  const s = W / 1080;
  const gap = 18 * s;
  const cw = (W - gap * 4) / 3;
  const ch = cw * 1.25;
  const rows = Math.ceil((H * 4) / (ch + gap)) + 2;
  return (
    <AbsoluteFill style={{filter: blur > 0.4 ? `blur(${blur}px)` : undefined}}>
      {[0, 1, 2].map((c) => (
        <div key={c} style={{position: 'absolute', left: gap + c * (cw + gap), top: -y + (c === 1 ? -ch * 0.45 : 0), display: 'flex', flexDirection: 'column', gap}}>
          {Array.from({length: rows}, (_, r) => (
            <div key={r} style={{width: cw, height: ch, borderRadius: 22 * s, overflow: 'hidden', background: P.paper, boxShadow: `0 ${8 * s}px ${20 * s}px ${P.shadow}`}}>
              <Img src={img(FEED[(r * 3 + c * 5) % FEED.length])} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </div>
          ))}
        </div>
      ))}
    </AbsoluteFill>
  );
};

const Hook: React.FC = () => {
  const l = L('hook');
  const t = useT(0);
  const {W, H, tall} = useFrameBox();
  const s = W / 1080;
  const [p1, p2] = l.phrases;
  const stop = p1.words[0].t;
  const D = H * 2.6;
  const posAt = (tt: number) => {
    if (tt < stop) {
      const k = Math.max(0, tt) / stop;
      return D * (1 - (1 - k) ** 2.4);
    }
    const u = tt - stop;
    return D - 46 * s * Math.sin(u * 26) * Math.exp(-u * 11);
  };
  const y = posAt(t);
  const vel = Math.abs(posAt(t) - posAt(t - 1 / FPS)) * FPS;
  const blur = Math.min(12, vel / 900);
  const dim = prog(t, stop, stop + 0.12, easeOut);
  const flash = t >= stop ? 1 - clamp01((t - stop) / 0.12) : 0;
  const phaseC = t >= p2.start - 0.04;
  const cuts = p2.words.map((w, i) => ({...[{src: 'az2', from: 0.4}, {src: 'ho2', from: 1.6}, {src: 'as3', from: 0.6}, {src: 'az3', from: 0.2}][i % 4], at: w.t - 0.04}));
  const boxK = sp(fr(t), p2.words[2].t + 0.05, {damping: 14, stiffness: 220});
  const rows: Wd[][] = [[p2.words[0], p2.words[1]], [p2.words[2], p2.words[3]]];
  return (
    <AbsoluteFill style={{background: P.cream, overflow: 'hidden'}}>
      {!phaseC ? (
        <>
          <Paper t={t} />
          <Feed y={y} blur={blur} />
          <AbsoluteFill style={{background: P.ink, opacity: dim * 0.62}} />
          {/* the signal: rings pulsing out from the centre */}
          {t >= stop
            ? [0, 1, 2, 3].map((i) => {
                const k = ((t - stop) / 0.75 - i * 0.25) % 1;
                if (t - stop < i * 0.19 || k < 0) return null;
                const r = (0.12 + k * 0.9) * W;
                return <div key={i} style={{position: 'absolute', left: W / 2 - r, top: H / 2 - r, width: r * 2, height: r * 2, borderRadius: '50%', border: `${(10 - 7 * k) * s}px solid ${P.orange}`, opacity: (1 - k) * 0.9}} />;
              })
            : null}
          <AbsoluteFill style={{background: P.white, opacity: flash * 0.6}} />
          <Center style={{gap: 0}}>
            <Pop t={t} at={p1.words[0].t} slam>
              <span style={{...txt(120 * s, P.white, 900), textShadow: SHADOW}}>{p1.words[0].w}</span>
            </Pop>
            <Pop t={t} at={p1.words[1].t} slam>
              <span style={{...txt((tall ? 300 : 270) * s, P.orange, 900), lineHeight: 1.15, textShadow: '0 10px 40px rgba(0,0,0,0.45)'}}>{p1.words[1].w}</span>
            </Pop>
          </Center>
        </>
      ) : (
        <>
          <Cuts t0={0} t={t} cuts={cuts} punch={0.16} />
          <Shade top={0.35} bottom={0.75} />
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%', background: 'linear-gradient(180deg, rgba(10,8,6,0) 0%, rgba(10,8,6,0.82) 45%, rgba(10,8,6,0.9) 100%)'}} />
          <div style={{position: 'absolute', left: 50 * s, right: 50 * s, bottom: (tall ? 330 : 150) * s, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 * s, direction: 'rtl'}}>
            {rows.map((ln, i) => (
              <div key={i} style={{display: 'flex', gap: 28 * s, position: 'relative', padding: i ? `0 ${30 * s}px` : 0}}>
                {i === 1 ? <div style={{position: 'absolute', inset: `${10 * s}px 0 ${4 * s}px`, background: P.orange, borderRadius: 22 * s, transform: `scaleX(${boxK})`, transformOrigin: '100% 50%'}} /> : null}
                {ln.map((w, j) => (
                  <Pop key={j} t={t} at={w.t} slam>
                    <span style={{...txt((i ? 150 : 130) * s, P.white, 900), textShadow: i ? 'none' : SHADOW, position: 'relative'}}>{w.w}</span>
                  </Pop>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

/* ───────────────────────── 2. Brand: kraft paper, logo stamp, tear, phone pushes through ── */

const TEAR = Array.from({length: 17}, (_, i) => ({y: (i / 16) * 100, x: 50 + (i === 0 || i === 16 ? 0 : (rand(i * 5.3) - 0.5) * 6)}));

const Kraft: React.FC<{t: number}> = ({t}) => {
  const {W, H} = useFrameBox();
  return (
    <AbsoluteFill style={{background: '#C9A57A'}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <filter id="kraft">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves={3} seed={4} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0 0.18  0 0 0 0.35 0" />
        </filter>
        <filter id="fiber">
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.25" numOctaves={2} seed={9} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0 0.1  0 0 0 0.22 0" />
        </filter>
        <rect width={W} height={H} filter="url(#kraft)" />
        <rect width={W} height={H} filter="url(#fiber)" />
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(110% 80% at 50% 45%, transparent 50%, rgba(60,35,10,0.35) 100%)'}} />
    </AbsoluteFill>
  );
};

const BrandScene: React.FC = () => {
  const l = L('brand');
  const t0 = l.start - LEAD;
  const t = useT(t0);
  const f = fr(t);
  const {W, H, tall} = useFrameBox();
  const s = W / 1080;
  const p1 = l.phrases[0];
  const p2 = l.phrases[1];
  const p3 = l.phrases[2];
  const stamp = sp(f, p1.words[1].t, {damping: 10, stiffness: 240, mass: 0.7});
  const barsK = [0, 1, 2].map((i) => prog(t, p1.words[1].t + 0.1 + i * 0.07, p1.words[1].t + 0.5 + i * 0.07, easeOut));
  const tear = prog(t, p2.start - 0.1, p2.start + 0.45, easeOut);
  const push = sp(f, p2.start + 0.15, {damping: 13, stiffness: 90, mass: 1});
  const fill = prog(t, nextStart('brand') - LEAD - 0.35, nextStart('brand') - LEAD, easeIn);
  const shake = (t > p3.start && t < p3.start + 0.3 ? Math.sin(t * 120) * 8 * (1 - (t - p3.start) / 0.3) : 0) * s;
  const poly = (side: 'l' | 'r') =>
    `polygon(${side === 'l' ? '0% 0%' : '100% 0%'}, ${TEAR.map((pp) => `${pp.x}% ${pp.y}%`).join(', ')}, ${side === 'l' ? '0% 100%' : '100% 100%'})`;
  const phoneW = (tall ? 600 : 470) * s;
  const half = (side: 'l' | 'r') => {
    const dir = side === 'l' ? -1 : 1;
    return (
      <AbsoluteFill
        key={side}
        style={{
          clipPath: poly(side),
          transform: `translateX(${dir * tear * W * 0.2}px) rotate(${dir * tear * 3}deg)`,
          transformOrigin: side === 'l' ? '0% 100%' : '100% 100%',
          filter: tear > 0.02 ? `drop-shadow(${-dir * 10}px 0 16px rgba(0,0,0,0.45))` : undefined,
        }}
      >
        <Kraft t={t} />
        <Center style={{gap: 30 * s, transform: `translateY(${-tear * 40 * s}px)`}}>
          <div style={{transform: `scale(${0.4 + 0.6 * stamp}) rotate(${(1 - stamp) * -20}deg)`, opacity: clamp01(stamp * 3)}}>
            <Logo size={190 * s} k={barsK} />
          </div>
          <Words t={t} ph={p1} size={120 * s} color={P.ink} hi={['بيتحرك']} />
        </Center>
      </AbsoluteFill>
    );
  };
  return (
    <AbsoluteFill style={{background: '#2A1A0E', transform: `translateX(${shake}px)`}}>
      <AbsoluteFill style={{background: `radial-gradient(40% 50% at 50% 50%, ${P.orange}, transparent 70%)`, opacity: tear}} />
      {half('l')}
      {half('r')}
      {tear > 0 ? (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div
            style={{
              transform: `scale(${(0.15 + 0.85 * push) * (1 + fill * 2.6)}) rotate(${(1 - push) * 18 - 4 * (1 - fill)}deg)`,
              opacity: clamp01(push * 4),
              width: phoneW + 30 * s,
              height: phoneW * 1.78 + 30 * s,
              padding: 15 * s,
              borderRadius: 70 * s,
              background: P.ink,
              boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{position: 'relative', width: phoneW, height: phoneW * 1.78, borderRadius: 56 * s, overflow: 'hidden'}}>
              <Sequence from={fr(p2.start - t0)} layout="none">
                <Clip src="az1" />
              </Sequence>
            </div>
          </div>
        </AbsoluteFill>
      ) : null}
      {t > p2.start - 0.05 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: (tall ? 170 : 70) * s}}>
          <Words t={t} ph={p2} size={82 * s} color={P.white} shadow />
        </div>
      ) : null}
      {t > p3.start - 0.05 ? (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: (tall ? 190 : 80) * s}}>
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <div style={{background: P.orange, borderRadius: 24 * s, padding: `${4 * s}px ${34 * s}px ${10 * s}px`, transform: `scale(${sp(f, p3.start, {damping: 11, stiffness: 260})})`}}>
              <Words t={t} ph={p3} size={120 * s} color={P.white} slam />
            </div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* ───────────────────────── 3. Before / after: a flat post, scrolled past, rewound, alive ── */

const DullPost: React.FC<{w: number; label?: boolean}> = ({w, label = true}) => {
  const u = w / 800;
  return (
    <div style={{width: w, background: P.white, borderRadius: 24 * u, overflow: 'hidden', boxShadow: `0 ${20 * u}px ${50 * u}px ${P.shadow}`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16 * u, padding: 24 * u, direction: 'rtl'}}>
        <div style={{width: 64 * u, height: 64 * u, borderRadius: '50%', background: '#D9D4CB'}} />
        <div style={{display: 'flex', flexDirection: 'column', gap: 10 * u}}>
          <div style={{width: 220 * u, height: 16 * u, borderRadius: 8 * u, background: '#D9D4CB'}} />
          <div style={{width: 130 * u, height: 12 * u, borderRadius: 6 * u, background: '#E6E1D8'}} />
        </div>
      </div>
      <div style={{height: w * 0.72, background: '#E7E2D8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 * u, direction: 'rtl'}}>
        {label ? (
          <>
            <span style={txt(58 * u, '#8D877E', 400)}>مطعم أبو علي</span>
            <span style={txt(46 * u, '#8D877E', 400)}>أكل بيتي · اطلب دلوقتي</span>
          </>
        ) : (
          <>
            <div style={{width: 300 * u, height: 22 * u, borderRadius: 11 * u, background: '#D5CFC4'}} />
            <div style={{width: 200 * u, height: 18 * u, borderRadius: 9 * u, background: '#DDD7CC'}} />
          </>
        )}
      </div>
      <div style={{display: 'flex', justifyContent: 'space-around', padding: 22 * u}}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{width: 100 * u, height: 16 * u, borderRadius: 8 * u, background: '#E6E1D8'}} />
        ))}
      </div>
    </div>
  );
};

const BeforeAfter: React.FC = () => {
  const a = L('flat');
  const sk = L('skip');
  const wa = L('wait');
  const df = L('diff');
  const t0 = a.start - LEAD;
  const t = useT(t0);
  const f = fr(t);
  const {W, H, tall} = useFrameBox();
  const s = W / 1080;
  const cw = (tall ? 820 : 700) * s;
  const pitch = cw * 1.12;
  // feed: flicks on "بتعدّيه" and "كده", rewinds on "استنى"
  const flick1 = prog(t, sk.phrases[0].words[1].t - 0.05, sk.phrases[0].words[1].t + 0.35, easeInOut);
  const flick2 = prog(t, sk.phrases[1].start - 0.05, sk.phrases[1].start + 0.3, easeInOut);
  const rewind = prog(t, wa.start, wa.start + 0.45, easeInOut);
  const scroll = (flick1 * 2 + flick2 * 2) * pitch * (1 - rewind);
  const vel = Math.abs((flick1 - prog(t - 1 / FPS, sk.phrases[0].words[1].t - 0.05, sk.phrases[0].words[1].t + 0.35, easeInOut)) + (flick2 - prog(t - 1 / FPS, sk.phrases[1].start - 0.05, sk.phrases[1].start + 0.3, easeInOut)) - (rewind - prog(t - 1 / FPS, wa.start, wa.start + 0.45, easeInOut)));
  const blur = Math.min(30, vel * 120);
  const glitch = t > wa.start && t < wa.start + 0.5;
  const enter = sp(f, a.start - 0.05, {damping: 12, stiffness: 200});
  // alive: words fly out on "نفس الكلام", orange floods on "يتحرك"
  const pW = wa.phrases[1].words;
  const flood = prog(t, pW[pW.length - 1].t - 0.05, pW[pW.length - 1].t + 0.3, easeIn);
  const alive = t > pW[pW.length - 1].t + 0.2;
  const caption = (() => {
    if (t < sk.start - 0.05) return a.phrases[0];
    if (t < wa.start - 0.05) return sk.phrases[t < sk.phrases[1].start - 0.05 ? 0 : 1];
    if (t < pW[0].t - 0.05) return wa.phrases[0];
    return wa.phrases[1];
  })();
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Paper t={t} />
      {!alive ? (
        <>
          <div style={{position: 'absolute', left: (W - cw) / 2, top: (tall ? 420 : 300) * s}}>
            <div style={{transform: `translateY(${-scroll + (1 - enter) * H}px)`, filter: blur > 0.6 ? `blur(${blur}px)` : undefined, display: 'flex', flexDirection: 'column', gap: pitch - cw * 1.0}}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{height: cw * 1.0, display: 'flex', alignItems: 'center'}}>
                  <DullPost w={cw} label={i === 0} />
                </div>
              ))}
            </div>
          </div>
          {glitch ? (
            <AbsoluteFill style={{mixBlendMode: 'multiply'}}>
              {Array.from({length: 6}, (_, i) => (
                <div key={i} style={{position: 'absolute', left: 0, right: 0, top: rand(i + Math.floor(t * 30)) * H, height: (6 + rand(i * 3) * 18) * s, background: i % 2 ? P.teal : P.orange, opacity: 0.6}} />
              ))}
            </AbsoluteFill>
          ) : null}
          <div style={{position: 'absolute', left: 0, right: 0, top: (tall ? 150 : 60) * s}}>
            <Words t={t} ph={caption} size={(caption === wa.phrases[1] ? 76 : 96) * s} color={P.ink} hi={['كده', 'يتحرك', 'استنى']} />
          </div>
        </>
      ) : null}
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        {flood > 0 && !alive ? (
          <div style={{position: 'absolute', left: W / 2 - flood * H, top: H * 0.55 - flood * H, width: flood * H * 2, height: flood * H * 2, borderRadius: '50%', background: P.orange}} />
        ) : null}
      </AbsoluteFill>
      {alive ? <Alive t={t} df={df} /> : null}
    </AbsoluteFill>
  );
};

const Alive: React.FC<{t: number; df: Line}> = ({t, df}) => {
  const f = fr(t);
  const {W, H} = useFrameBox();
  const s = W / 1080;
  const base = L('wait').end;
  const w1 = sp(f, base - 0.05, {damping: 9, stiffness: 220, mass: 0.7});
  const w2 = sp(f, base + 0.12, {damping: 12, stiffness: 220});
  const w3 = sp(f, base + 0.28, {damping: 10, stiffness: 240});
  const btn = sp(f, df.phrases[0].start, {damping: 10, stiffness: 260, mass: 0.6});
  const tapAt = df.phrases[1].start;
  const tapK = clamp01((t - tapAt) / 0.5);
  const press = t > tapAt && t < tapAt + 0.15 ? 0.92 : 1;
  const steam = (i: number) => {
    const k = prog(t, base + 0.4 + i * 0.08, base + 1 + i * 0.08, easeOut);
    return (
      <path key={i} d={`M ${30 + i * 45} 150 C ${0 + i * 45} 110, ${60 + i * 45} 80, ${30 + i * 45} 40 S ${10 + i * 45} 0, ${35 + i * 45} -20`} stroke={P.white} strokeWidth={9} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} opacity={0.85} transform={`translate(0 ${-((t * 0.7 + i * 0.3) % 1) * 30})`} />
    );
  };
  return (
    <AbsoluteFill style={{background: P.orange}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1.6px, transparent 1.8px)', backgroundSize: '36px 36px', backgroundPosition: `${(t * 10) % 36}px 0`}} />
      <Center style={{gap: 30 * s}}>
        <div style={{display: 'flex', gap: 50 * s, alignItems: 'flex-end', direction: 'rtl'}}>
          <span style={{...txt(230 * s, P.white), transform: `translateY(${(1 - w1) * -H * 0.7}px)`}}>أكل</span>
          <span style={{...txt(180 * s, P.ink), transform: `translateX(${(1 - w2) * -W}px)`}}>بيتي</span>
        </div>
        <div style={{position: 'relative', transform: `scale(${w3})`}}>
          <svg width={150 * s} height={170 * s} viewBox="0 -30 150 180" style={{position: 'absolute', left: -150 * s, top: -10 * s, overflow: 'visible'}}>
            {[0, 1, 2].map(steam)}
          </svg>
          <span style={txt(190 * s, P.white)}>وسخن</span>
        </div>
        <div style={{position: 'relative', transform: `scale(${btn * press})`}}>
          <div style={{background: P.white, borderRadius: 100 * s, padding: `${18 * s}px ${60 * s}px ${26 * s}px`, ...txt(64 * s, P.orange, 900), boxShadow: '0 16px 40px rgba(120,30,0,0.3)'}}>اطلب دلوقتي</div>
          {tapK > 0 && tapK < 1 ? (
            <div style={{position: 'absolute', left: '50%', top: '50%', width: 420 * s * tapK, height: 420 * s * tapK, marginLeft: -210 * s * tapK, marginTop: -210 * s * tapK, borderRadius: '50%', border: `${6 * s}px solid ${P.white}`, opacity: 1 - tapK}} />
          ) : null}
        </div>
      </Center>
      <div style={{position: 'absolute', left: 0, right: 0, top: 50 * s}}>
        <Words t={t} ph={df.phrases[0]} size={70 * s} color={P.ink} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 50 * s}}>
        <Words t={t} ph={df.phrases[1]} size={70 * s} color={P.white} />
      </div>
    </AbsoluteFill>
  );
};

/* ───────────────────────── 4. Work: full-bleed footage, label + karaoke line ── */

const WORK: {id: string; client: string; cuts: {src: string; from?: number}[]; hi: string[]}[] = [
  {id: 'w1', client: 'عزوز · ناشفيل تشيكن', cuts: [{src: 'az2', from: 0.2}, {src: 'az3', from: 0.3}], hi: ['مطاعم']},
  {id: 'w2', client: 'معمل العاصمة للتحاليل', cuts: [{src: 'as1', from: 0.4}, {src: 'as3', from: 0.2}], hi: ['طبية']},
  {id: 'w3', client: 'معمل امتياز', cuts: [{src: 'em1', from: 0.5}, {src: 'em2', from: 0.3}], hi: ['جرافيك']},
  {id: 'w4', client: 'مركز سدرة للحجامة', cuts: [{src: 'sd1', from: 0.6}, {src: 'sd2', from: 1.2}], hi: ['بالأرقام']},
  {id: 'w5', client: 'عسل نحل رقية', cuts: [{src: 'ho2', from: 0.2}, {src: 'ho3', from: 0.4}], hi: ['منتج']},
  {id: 'w6', client: 'أ. عمرو الكفافي', cuts: [{src: 'kf1', from: 0.6}, {src: 'kf3', from: 0.2}], hi: ['تعليمية']},
  {id: 'w7', client: 'أكاديمية الملاك الصغير', cuts: [{src: 'kd1', from: 0.4}, {src: 'kd3', from: 0.5}], hi: ['الأطفال']},
];

const Work: React.FC<{i: number}> = ({i}) => {
  const d = WORK[i];
  const l = L(d.id);
  const t0 = l.start - LEAD;
  const t = useT(t0);
  const f = fr(t);
  const {W, H, tall} = useFrameBox();
  const s = W / 1080;
  const enter = prog(t, t0, t0 + 0.22, easeOut);
  const cuts = [
    {...d.cuts[0], at: t0},
    {...d.cuts[1], at: l.phrases[1].start - 0.05},
  ];
  const chipK = sp(f, t0 + 0.05, {damping: 12, stiffness: 220});
  const p1 = l.phrases[0];
  const big = fit(p1.text, W - 140 * s, (tall ? 150 : 130) * s);
  const ul = prog(t, p1.words[p1.words.length - 1].t + 0.1, p1.words[p1.words.length - 1].t + 0.45, easeOut);
  return (
    <AbsoluteFill style={{background: P.ink, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translateX(${(1 - enter) * -W * 0.35}px)`, filter: enter < 0.9 ? `blur(${(1 - enter) * 24}px)` : undefined}}>
        <Cuts t0={t0} t={t} cuts={cuts} />
      </AbsoluteFill>
      <Shade top={0.8} bottom={0.75} />
      <div style={{position: 'absolute', left: 0, right: 0, top: (tall ? 170 : 60) * s, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 * s}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14 * s, background: P.cream, borderRadius: 50 * s, padding: `${8 * s}px ${26 * s}px ${12 * s}px`, transform: `scale(${chipK})`, direction: 'rtl'}}>
          <Tri size={26 * s} />
          <span style={txt(30 * s, P.ink, 700)}>{d.client}</span>
          <span style={{...txt(26 * s, P.inkSoft, 700), direction: 'ltr'}}>0{i + 1}</span>
        </div>
        <Words t={t} ph={p1} size={big} color={P.white} hi={d.hi} shadow slam />
        <div style={{width: 420 * s * ul, height: 14 * s, borderRadius: 14 * s, background: P.orange, marginTop: -6 * s}} />
      </div>
      <div style={{position: 'absolute', left: 50 * s, right: 50 * s, bottom: (tall ? 200 : 60) * s, display: 'flex', justifyContent: 'center'}}>
        {t > l.phrases[1].start - 0.08 ? (
          <div style={{background: P.cream, borderRadius: 26 * s, padding: `${10 * s}px ${30 * s}px ${14 * s}px`, transform: `scale(${sp(f, l.phrases[1].start - 0.08, {damping: 13, stiffness: 260})})`, maxWidth: W - 100 * s}}>
            <Words t={t} ph={l.phrases[1]} size={fit(l.phrases[1].text, W - 180 * s, 66 * s)} color={P.ink} />
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/* ───────────────────────── 5. Motion chapter: word, story, shape ── */

const WordScene: React.FC = () => {
  const l = L('word');
  const t0 = l.start - LEAD;
  const t = useT(t0);
  const f = fr(t);
  const {W} = useFrameBox();
  const s = W / 1080;
  const [a, b, c] = l.phrases;
  const r1 = prog(t, a.start, a.end, easeInOut);
  const x2 = (tt: number) => (1 - prog(tt, b.start - 0.05, b.start + 0.4, easeOut)) * W;
  const p3 = sp(f, c.start - 0.03, {damping: 8, stiffness: 240, mass: 0.7});
  return (
    <AbsoluteFill style={{background: P.teal, overflow: 'hidden'}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(255,255,255,0.2) 1.6px, transparent 1.8px)', backgroundSize: '36px 36px'}} />
      <Center style={{gap: 0}}>
        <div style={{position: 'relative'}}>
          <span style={{...txt(190 * s, P.white), display: 'inline-block', WebkitMaskImage: `linear-gradient(to left, #000 ${r1 * 100}%, transparent ${r1 * 100}%)`}}>الكلمة</span>
        </div>
        <div style={{position: 'relative', height: 220 * s}}>
          {[3, 2, 1, 0].map((g) => (
            <span key={g} style={{...txt(170 * s, P.ink), position: g ? 'absolute' : 'relative', right: 0, top: 0, opacity: t < b.start - 0.06 ? 0 : g ? 0.25 / g : 1, transform: `translateX(${-x2(t - g * 0.04)}px)`}}>
              لما تتحرك
            </span>
          ))}
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 34 * s, direction: 'rtl'}}>
          {[0, 1].map((side) => (
            <div key={side} style={{display: 'flex', gap: 12 * s, alignItems: 'center', order: side ? 2 : 0, opacity: clamp01(p3)}}>
              {Array.from({length: 5}, (_, j) => (
                <div key={j} style={{width: 14 * s, height: (30 + 100 * Math.abs(Math.sin(t * 8 + j * 1.3 + side))) * s * clamp01(p3), borderRadius: 10 * s, background: j % 2 ? P.white : P.orange}} />
              ))}
            </div>
          ))}
          <span style={{...txt(210 * s, P.orange), order: 1, transform: `scale(${p3})`, display: 'inline-block'}}>بتتسمع</span>
        </div>
      </Center>
    </AbsoluteFill>
  );
};

const StoryScene: React.FC = () => {
  const l = L('story');
  const t0 = l.start - LEAD;
  const t = useT(t0);
  const f = fr(t);
  const {W, H, tall} = useFrameBox();
  const s = W / 1080;
  const cw = 0.27 * W;
  const cy = H * 0.56;
  const xs = [0.79, 0.5, 0.21];
  const labels = ['فكرة', 'قصة', 'فيديو'];
  const str = prog(t, l.phrases[1].start, l.phrases[2].start + 0.3, easeInOut);
  const zoom = prog(t, nextStart('story') - LEAD - 0.35, nextStart('story') - LEAD, easeIn);
  const icons = [
    <svg key="b" width={cw * 0.5} height={cw * 0.5} viewBox="0 0 100 100">
      <circle cx="50" cy="42" r="26" fill={P.orange} />
      <rect x="38" y="66" width="24" height="16" rx="4" fill={P.ink} />
    </svg>,
    <svg key="q" width={cw * 0.5} height={cw * 0.5} viewBox="0 0 100 100">
      <rect x="10" y="16" width="80" height="54" rx="14" fill={P.teal} />
      <path d="M 30 68 L 26 88 L 48 68 Z" fill={P.teal} />
      <rect x="24" y="32" width="52" height="8" rx="4" fill={P.white} />
      <rect x="24" y="48" width="34" height="8" rx="4" fill={P.white} />
    </svg>,
    <Tri key="v" size={cw * 0.46} />,
  ];
  const pins = xs.map((x) => ({x: x * W, y: cy - cw * 0.62}));
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Paper t={t} tone={P.paper} />
      <AbsoluteFill style={{transform: `scale(${1 + zoom * 4})`, transformOrigin: `${xs[2] * 100}% ${(cy / H) * 100}%`}}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <path d={`M ${pins[0].x} ${pins[0].y} Q ${(pins[0].x + pins[1].x) / 2} ${pins[0].y + 60 * s}, ${pins[1].x} ${pins[1].y} Q ${(pins[1].x + pins[2].x) / 2} ${pins[1].y + 60 * s}, ${pins[2].x} ${pins[2].y}`} fill="none" stroke={P.orange} strokeWidth={7 * s} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - str} />
        </svg>
        {xs.map((x, i) => {
          const k = sp(f, l.phrases[i].start - 0.08, {damping: 12, stiffness: 200});
          return (
            <div key={i} style={{position: 'absolute', left: x * W - cw / 2, top: cy - cw * 0.62 + (1 - k) * -H * 0.7, width: cw, height: cw * 1.24, background: P.white, borderRadius: 16 * s, boxShadow: `0 ${12 * s}px ${28 * s}px ${P.shadow}`, transform: `rotate(${[-4, 3, -2][i] + (1 - k) * 25}deg)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 * s}}>
              <div style={{position: 'absolute', top: -16 * s, width: 36 * s, height: 36 * s, borderRadius: '50%', background: P.orange}} />
              {icons[i]}
              <span style={txt(58 * s, P.ink, 900)}>{labels[i]}</span>
            </div>
          );
        })}
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: (tall ? 190 : 70) * s, display: 'flex', justifyContent: 'center', gap: 26 * s, direction: 'rtl'}}>
        {l.phrases.map((ph, i) => (
          <Pop key={i} t={t} at={ph.start} slam>
            <span style={txt(76 * s, i === 2 ? P.orange : P.ink)}>{ph.text}{i < 2 ? '…' : ''}</span>
          </Pop>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const ShapeScene: React.FC = () => {
  const l = L('shape');
  const t0 = l.start - LEAD;
  const t = useT(t0);
  const f = fr(t);
  const {W, H, tall} = useFrameBox();
  const s = W / 1080;
  const cy = H * (tall ? 0.52 : 0.55);
  const [a, b] = l.phrases;
  const tau = Math.max(0, t - t0);
  const bounceY = -H * 0.5 * Math.exp(-4 * tau) * Math.abs(Math.cos(Math.min(tau, 2) * 7));
  const m = prog(t, a.start + 0.6, a.start + 1.05, easeInOut);
  const logo = prog(t, b.start - 0.15, b.start + 0.2, easeInOut);
  const d = 0.2 * W;
  const pw = lerp(d, 0.34 * W, m);
  const ph = lerp(d, 0.6 * W, m);
  const bars = [0.4, 0.65, 0.9].map((hh, i) => hh * prog(t, a.start + 0.9 + i * 0.08, a.start + 1.3 + i * 0.08, easeOut));
  const logoK = [0, 1, 2].map((i) => prog(t, b.start + i * 0.06, b.start + 0.35 + i * 0.06, easeOut));
  const tri = sp(f, b.start - 0.05, {damping: 10, stiffness: 240});
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Paper t={t} />
      <div style={{position: 'absolute', left: 0, right: 0, top: (tall ? 190 : 70) * s}}>
        <Words t={t} ph={a} size={92 * s} color={P.ink} />
      </div>
      <div style={{position: 'absolute', left: W / 2 - pw / 2, top: cy - ph / 2 + bounceY * (1 - m), width: pw, height: ph, borderRadius: lerp(d / 2, 0.06 * W, m), background: m > 0.5 ? P.white : P.teal, border: `${lerp(0, 12 * s, m)}px solid ${P.ink}`, transform: `scale(${1 - 0.6 * logo})`, opacity: 1 - logo, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: '14%', right: '14%', bottom: '12%', height: '60%', display: 'flex', alignItems: 'flex-end', gap: '9%'}}>
          {bars.map((bb, i) => (
            <div key={i} style={{flex: 1, height: `${bb * 100}%`, borderRadius: 10 * s, background: i === 1 ? P.orange : P.teal}} />
          ))}
        </div>
      </div>
      {logo > 0 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: cy - 0.14 * W, display: 'flex', justifyContent: 'center', opacity: clamp01(logo * 2)}}>
          <Logo size={0.28 * W} k={logoK} tri={tri} />
        </div>
      ) : null}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: (tall ? 220 : 90) * s}}>
        <Words t={t} ph={b} size={170 * s} color={P.orange} slam />
      </div>
    </AbsoluteFill>
  );
};

/* ───────────────────────── 6. Designs: posters flick, then fan ── */

const POSTERS = ['p05', 'p03', 'p01', 'p07', 'p09', 'p06', 'p04', 'p02', 'p10', 'p08'];
const DesignScene: React.FC = () => {
  const l = L('design');
  const t0 = l.start - LEAD;
  const t = useT(t0);
  const f = fr(t);
  const {W, H, tall} = useFrameBox();
  const s = W / 1080;
  const [a, b] = l.phrases;
  const flickEnd = b.start - 0.05;
  const n = Math.min(POSTERS.length - 1, Math.floor(((t - t0) / (flickEnd - t0)) * POSTERS.length));
  const fan = t >= flickEnd;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Paper t={t} />
      {!fan ? (
        <Center>
          <div style={{width: (tall ? 760 : 620) * s, padding: 12 * s, background: P.white, borderRadius: 26 * s, boxShadow: `0 ${24 * s}px ${60 * s}px ${P.shadow}`, transform: `rotate(${(rand(n) - 0.5) * 8}deg) scale(${1 + 0.04 * (1 - ((t - t0) * 8) % 1)})`}}>
            <Img src={img(`posters/${POSTERS[n]}.jpg`)} style={{width: '100%', display: 'block', borderRadius: 18 * s}} />
          </div>
        </Center>
      ) : (
        <AbsoluteFill>
          {POSTERS.slice(0, 7).map((p, i) => {
            const k = sp(f, flickEnd + i * 0.05, {damping: 14, stiffness: 160});
            const o = i - 3;
            return (
              <div key={p} style={{position: 'absolute', left: W / 2 - 160 * s + o * 118 * s * k, top: H * (tall ? 0.38 : 0.33) + Math.abs(o) * 26 * s * k, width: 320 * s, padding: 8 * s, background: P.white, borderRadius: 18 * s, boxShadow: `0 ${16 * s}px ${36 * s}px ${P.shadow}`, zIndex: 10 - Math.abs(o), transform: `rotate(${o * 6 * k}deg) translateY(${(1 - k) * 300}px)`}}>
                <Img src={img(`posters/${p}.jpg`)} style={{width: '100%', display: 'block', borderRadius: 12 * s}} />
              </div>
            );
          })}
        </AbsoluteFill>
      )}
      <div style={{position: 'absolute', left: 40 * s, right: 40 * s, top: (tall ? 160 : 50) * s}}>
        {!fan ? (
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <div style={{background: P.ink, borderRadius: 24 * s, padding: `${6 * s}px ${30 * s}px ${12 * s}px`}}>
              <Words t={t} ph={a} size={84 * s} color={P.white} hi={['بس']} />
            </div>
          </div>
        ) : (
          <Words t={t} ph={b} size={76 * s} color={P.ink} hi={['كاملة', 'وهويات']} />
        )}
      </div>
    </AbsoluteFill>
  );
};

/* ───────────────────────── 7. Burger: one product, 19 styles strobed, then the wall ── */

const BurgerScene: React.FC = () => {
  const l = L('burger');
  const t0 = l.start - LEAD;
  const t = useT(t0);
  const f = fr(t);
  const {W, H, tall} = useFrameBox();
  const s = W / 1080;
  const [a, b, c] = l.phrases;
  const strobeA = b.start - 0.05;
  const strobeB = c.start - 0.05;
  const k = clamp01((t - strobeA) / (strobeB - strobeA));
  const n = t < strobeA ? 0 : Math.min(18, Math.floor(k * 19));
  const count = t < strobeA ? 1 : Math.min(20, 1 + Math.floor(k * 20));
  const wall = prog(t, strobeB, strobeB + 0.9, easeInOut);
  const COLS = 5;
  const ROWS = 4;
  const tw = (tall ? 200 : 186) * s;
  const th = tw * (16 / 9);
  const gap = 12 * s;
  const gw = COLS * tw + (COLS - 1) * gap;
  const gh = ROWS * th + (ROWS - 1) * gap;
  const fitS = Math.min(W / gw, H / gh) * 1.04;
  const big = Math.max(W / tw, H / th) * 1.02;
  const sc = lerp(big, fitS, wall) * (1 + 0.04 * prog(t, strobeB + 0.9, nextStart('burger'), (x) => x));
  const focus = {x: -gw / 2 + tw / 2, y: -gh / 2 + th / 2};
  return (
    <AbsoluteFill style={{background: P.cream, overflow: 'hidden'}}>
      {t < strobeB ? (
        <AbsoluteFill>
          <Img src={img(`stills/b${String(n + 1).padStart(2, '0')}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.04 + 0.03 * Math.sin(n)})`}} />
          <Shade top={0.55} bottom={0.55} />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <div style={{position: 'relative', width: gw, height: gh, transform: `scale(${sc}) translate(${-focus.x * (1 - wall)}px, ${-focus.y * (1 - wall)}px)`}}>
            {Array.from({length: 20}, (_, idx) => {
              const x = (idx % COLS) * (tw + gap);
              const y = Math.floor(idx / COLS) * (th + gap);
              const isLogo = idx === 12;
              const file = `stills/b${String(idx < 12 ? idx + 1 : idx).padStart(2, '0')}.jpg`;
              return (
                <div key={idx} style={{position: 'absolute', left: x, top: y, width: tw, height: th, borderRadius: 12 * s, overflow: 'hidden', background: P.cream, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  {isLogo ? <Logo size={64 * s} /> : <Img src={img(file)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />}
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      )}
      {t < strobeB ? (
        <>
          <div style={{position: 'absolute', left: 0, right: 0, top: (tall ? 180 : 70) * s}}>
            <Words t={t} ph={t < strobeA ? a : b} size={110 * s} color={P.white} shadow slam hi={['بعشرين']} />
          </div>
          {t >= strobeA ? (
            <div style={{position: 'absolute', left: 0, right: 0, bottom: (tall ? 200 : 60) * s, display: 'flex', justifyContent: 'center'}}>
              <div style={{background: P.orange, borderRadius: 30 * s, padding: `${0 * s}px ${40 * s}px ${10 * s}px`, ...txt(200 * s, P.white, 900), direction: 'ltr', fontVariantNumeric: 'tabular-nums'}}>
                {String(count).padStart(2, '0')}
                <span style={{fontSize: 70 * s, opacity: 0.85}}>/20</span>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div style={{position: 'absolute', left: 30 * s, right: 30 * s, top: '50%', transform: `translateY(-50%) scale(${0.9 + 0.1 * wall})`, opacity: wall, display: 'flex', justifyContent: 'center'}}>
          <div style={{background: 'rgba(244,241,234,0.95)', borderRadius: 34 * s, padding: `${26 * s}px ${36 * s}px ${34 * s}px`, boxShadow: `0 30px 80px ${P.shadow}`}}>
            <Words t={t} ph={c} size={74 * s} color={P.ink} hi={['يليق', 'بيها']} />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ───────────────────────── 8. Skins: one template, four identities ── */

type Skin = {sector: string; name: string; head: string; cta: string; bg: string; main: string; acc: string; icon: (m: string, a: string) => React.ReactNode};
const SKINS: Skin[] = [
  {sector: 'مطعم', name: 'الشيف', head: 'طعم يتفتكر', cta: 'اطلب دلوقتي', bg: '#FFE7D3', main: '#D7263D', acc: '#FFB400', icon: (m, a) => (<><path d="M 14 46 C 14 20, 86 20, 86 46 Z" fill={a} /><rect x="10" y="50" width="80" height="12" rx="6" fill={m} /><rect x="14" y="66" width="72" height="14" rx="7" fill={a} /></>)},
  {sector: 'تعليم', name: 'أكاديمية النجاح', head: 'افهم… متحفظش', cta: 'احجز مكانك', bg: '#E4ECFF', main: '#1D3A8A', acc: '#F2B705', icon: (m, a) => (<><path d="M 50 18 L 92 38 L 50 58 L 8 38 Z" fill={m} /><path d="M 26 48 V 70 C 38 82, 62 82, 74 70 V 48 L 50 60 Z" fill={m} /><path d="M 86 40 V 66" stroke={a} strokeWidth="6" strokeLinecap="round" /><circle cx="86" cy="70" r="6" fill={a} /></>)},
  {sector: 'براند', name: 'لمسة', head: 'أناقة بتتحرك', cta: 'تسوّق دلوقتي', bg: '#F7E4EA', main: '#7A2E4F', acc: '#C9A46A', icon: (m, a) => (<><path d="M 50 34 C 50 20, 66 22, 64 32 C 62 40, 50 38, 50 46" fill="none" stroke={a} strokeWidth="6" strokeLinecap="round" /><path d="M 50 46 L 10 74 H 90 Z" fill="none" stroke={m} strokeWidth="8" strokeLinejoin="round" /></>)},
  {sector: 'عيادة', name: 'سمايل كلينك', head: 'ابتسامتك تهمنا', cta: 'احجز كشفك', bg: '#DFF5F3', main: '#0E8C88', acc: '#FF7A59', icon: (m, a) => (<><path d="M 50 86 C 12 60, 8 32, 28 22 C 40 16, 48 24, 50 32 C 52 24, 60 16, 72 22 C 92 32, 88 60, 50 86 Z" fill={m} /><rect x="44" y="34" width="12" height="34" rx="3" fill={P.white} /><rect x="33" y="45" width="34" height="12" rx="3" fill={P.white} /><circle cx="80" cy="24" r="8" fill={a} /></>)},
];
const SkinCard: React.FC<{k: Skin; w: number; pop?: number}> = ({k, w, pop = 1}) => {
  const u = w / 760;
  return (
    <div style={{width: w, background: P.white, borderRadius: 44 * u, padding: 40 * u, boxShadow: `0 ${24 * u}px ${60 * u}px rgba(0,0,0,0.14)`, direction: 'rtl', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 * u}}>
      <div style={{alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <span style={txt(40 * u, k.main, 900)}>{k.name}</span>
        <span style={{...txt(30 * u, P.white, 700), background: k.main, borderRadius: 40 * u, padding: `${4 * u}px ${24 * u}px ${8 * u}px`}}>{k.sector}</span>
      </div>
      <div style={{width: 340 * u, height: 340 * u, borderRadius: '50%', background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${pop})`}}>
        <svg width={220 * u} height={220 * u} viewBox="0 0 100 100">{k.icon(k.main, k.acc)}</svg>
      </div>
      <span style={txt(fit(k.head, 680 * u, 76 * u), k.main, 900)}>{k.head}</span>
      <div style={{...txt(38 * u, P.ink, 800), background: k.acc, borderRadius: 60 * u, padding: `${10 * u}px ${50 * u}px ${16 * u}px`}}>{k.cta}</div>
    </div>
  );
};

const SkinScene: React.FC = () => {
  const l = L('skins');
  const y = L('yours');
  const t0 = l.start - LEAD;
  const t = useT(t0);
  const f = fr(t);
  const {W, H, tall} = useFrameBox();
  const s = W / 1080;
  const starts = l.phrases.map((p) => p.start - 0.1);
  const idx = Math.max(0, starts.filter((a) => t >= a).length - 1);
  const k = SKINS[idx];
  const wipe = prog(t, starts[idx], starts[idx] + 0.25, easeOut);
  const prevBg = idx ? SKINS[idx - 1].bg : P.cream;
  const pop = sp(f, starts[idx] + 0.05, {damping: 10, stiffness: 260});
  const grid = prog(t, y.start - 0.15, y.start + 0.35, easeInOut);
  const r = wipe * Math.hypot(W, H);
  return (
    <AbsoluteFill style={{background: prevBg, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: W / 2 - r, top: H / 2 - r, width: r * 2, height: r * 2, borderRadius: '50%', background: k.bg}} />
      <AbsoluteFill style={{background: P.cream, opacity: grid}} />
      {grid < 1 ? (
        <>
          <div style={{position: 'absolute', left: 0, right: 0, top: (tall ? 180 : 60) * s, opacity: 1 - grid}}>
            <Words t={t} ph={l.phrases[idx]} size={fit(l.phrases[idx].text, W - 120 * s, 100 * s)} color={k.main} slam />
          </div>
          <Center style={{paddingTop: (tall ? 160 : 170) * s, opacity: 1 - grid}}>
            <div style={{transform: `scale(${(0.86 + 0.14 * pop) * (1 - 0.3 * grid)}) rotate(${(1 - pop) * (idx % 2 ? 4 : -4)}deg)`}}>
              <SkinCard k={k} w={(tall ? 780 : 640) * s} pop={pop} />
            </div>
          </Center>
        </>
      ) : null}
      {grid > 0 ? (
        <>
          <Center style={{paddingTop: (tall ? 120 : 150) * s}}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 * s}}>
              {SKINS.map((kk, i) => {
                const g = sp(f, y.start - 0.1 + i * 0.07, {damping: 13, stiffness: 200});
                return (
                  <div key={i} style={{transform: `scale(${0.4 + 0.6 * g}) rotate(${(1 - g) * (i % 2 ? 8 : -8)}deg)`, opacity: clamp01(g * 2)}}>
                    <SkinCard k={kk} w={(tall ? 470 : 370) * s} />
                  </div>
                );
              })}
            </div>
          </Center>
          <div style={{position: 'absolute', left: 0, right: 0, top: (tall ? 160 : 40) * s, display: 'flex', justifyContent: 'center', gap: 24 * s, direction: 'rtl'}}>
            {y.phrases.map((ph, i) => (
              <Pop key={i} t={t} at={ph.start} slam>
                <span style={txt(78 * s, i ? P.orange : P.ink)}>{ph.text}</span>
              </Pop>
            ))}
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/* ───────────────────────── 9. Price ── */

const PriceScene: React.FC = () => {
  const l = L('price');
  const t0 = l.start - LEAD;
  const t = useT(t0);
  const f = fr(t);
  const {W, H} = useFrameBox();
  const s = W / 1080;
  const [a, b] = l.phrases;
  const at300 = b.words.find((w) => w.w === 'تلتمية')?.t ?? b.start + 0.6;
  const atEgp = b.words.find((w) => w.w === 'جنيه')?.t ?? at300 + 0.4;
  const atBas = b.words.find((w) => w.w === 'بس')?.t ?? atEgp + 0.3;
  const slam = sp(f, at300 - 0.04, {damping: 9, stiffness: 300, mass: 0.7});
  const shake = t > at300 && t < at300 + 0.3 ? Math.sin(t * 140) * 12 * (1 - (t - at300) / 0.3) * s : 0;
  const flood = prog(t, nextStart('price') - LEAD - 0.3, nextStart('price') - LEAD, easeIn);
  const barsK = [0, 1, 2].map((j) => prog(t, a.start + j * 0.08, a.start + 0.5 + j * 0.08, easeOut));
  return (
    <AbsoluteFill style={{overflow: 'hidden', transform: `translate(${shake}px, ${shake * 0.5}px)`}}>
      <Paper t={t} />
      <Center style={{gap: 0}}>
        <Pop t={t} at={a.start}>
          <span style={txt(76 * s, P.inkSoft, 800)}>{a.text}</span>
        </Pop>
        <div style={{display: 'flex', gap: 24 * s, direction: 'rtl'}}>
          {b.words.slice(0, 2).map((w, i) => (
            <Pop key={i} t={t} at={w.t}>
              <span style={txt(110 * s, P.ink, 900)}>{w.w}</span>
            </Pop>
          ))}
        </div>
        <div style={{...txt(420 * s, P.orange, 900), lineHeight: 1.1, direction: 'ltr', transform: `scale(${t < at300 - 0.06 ? 0 : 2.2 - 1.2 * slam})`, opacity: t < at300 - 0.06 ? 0 : 1}}>300</div>
        <div style={{display: 'flex', gap: 26 * s, direction: 'rtl'}}>
          <Pop t={t} at={atEgp} slam>
            <span style={txt(130 * s, P.ink, 900)}>جنيه</span>
          </Pop>
          <Pop t={t} at={atBas} slam>
            <span style={txt(130 * s, P.teal, 900)}>بس</span>
          </Pop>
        </div>
      </Center>
      <div style={{position: 'absolute', left: 70 * s, top: H * 0.1}}>
        <Bars w={260 * s} k={barsK} thick={24 * s} gap={20 * s} />
      </div>
      <div style={{position: 'absolute', right: 70 * s, bottom: H * 0.1, transform: 'scaleX(-1)'}}>
        <Bars w={260 * s} k={barsK} thick={24 * s} gap={20 * s} colors={[P.orange, P.teal, P.orange]} />
      </div>
      {flood > 0 ? <div style={{position: 'absolute', left: W / 2 - flood * H, top: H / 2 - flood * H, width: flood * H * 2, height: flood * H * 2, borderRadius: '50%', background: P.orange}} /> : null}
    </AbsoluteFill>
  );
};

/* ───────────────────────── 10. CTA + end ── */

const CtaScene: React.FC = () => {
  const l = L('cta');
  const e = L('end');
  const t0 = l.start - LEAD;
  const t = useT(t0);
  const f = fr(t);
  const {W, H, tall} = useFrameBox();
  const s = W / 1080;
  const [a, b, c] = l.phrases;
  const wa = sp(f, c.start + 0.2, {damping: 11, stiffness: 220, mass: 0.7});
  const endK = prog(t, e.start - 0.15, e.start + 0.35, easeInOut);
  const logoK = sp(f, e.start - 0.05, {damping: 12, stiffness: 180});
  const barsK = [0, 1, 2].map((j) => prog(t, e.start + 0.1 + j * 0.07, e.start + 0.5 + j * 0.07, easeOut));
  const pulse = 1 + 0.035 * Math.max(0, Math.sin((t - c.start) * 5));
  const rows = [a, b];
  return (
    <AbsoluteFill style={{background: P.orange, overflow: 'hidden'}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(255,255,255,0.16) 1.6px, transparent 1.8px)', backgroundSize: '36px 36px', backgroundPosition: `${(t * 8) % 36}px 0`}} />
      <AbsoluteFill style={{transform: `translateY(${-endK * H * 0.22}px) scale(${1 - 0.25 * endK})`, opacity: 1 - endK * 0.0}}>
        <Center style={{gap: 22 * s, paddingBottom: (tall ? 200 : 120) * s}}>
          {rows.map((ph, i) => (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 20 * s, direction: 'rtl'}}>
              <Pop t={t} at={ph.start - 0.05} slam>
                <span style={{...txt(54 * s, P.orange, 900), background: P.white, width: 80 * s, height: 80 * s, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1}}>{i + 1}</span>
              </Pop>
              <div style={{maxWidth: W - 200 * s}}><Words t={t} ph={ph} size={(tall ? 96 : 74) * s} color={P.white} /></div>
            </div>
          ))}
          <div style={{marginTop: 18 * s}}>
            <Words t={t} ph={c} size={(tall ? 88 : 68) * s} color={P.ink} />
          </div>
          <div style={{marginTop: 26 * s, background: P.white, borderRadius: 100 * s, padding: `${20 * s}px ${48 * s}px ${26 * s}px`, display: 'flex', alignItems: 'center', gap: 22 * s, transform: `scale(${(0.5 + 0.5 * wa) * pulse})`, opacity: clamp01(wa * 2), boxShadow: '0 20px 50px rgba(120,30,0,0.3)', direction: 'rtl'}}>
            <span style={txt(40 * s, P.inkSoft, 700)}>واتساب</span>
            <span style={{...txt(66 * s, P.ink, 900), direction: 'ltr'}}>01130808848</span>
          </div>
        </Center>
      </AbsoluteFill>
      {endK > 0 ? (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: (tall ? 200 : 90) * s, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 * s, transform: `translateY(${(1 - logoK) * 260}px)`, opacity: clamp01(logoK * 2)}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 30 * s, direction: 'rtl'}}>
            <span style={txt(110 * s, P.white, 900)}>إبداع</span>
            <span style={txt(110 * s, P.ink, 900)}>بيتحرك</span>
            <Logo size={140 * s} k={barsK} triColor={P.white} colors={[P.white, P.ink, P.white]} />
          </div>
          <div style={{display: 'flex', gap: 18 * s, direction: 'rtl'}}>
            {e.phrases.map((ph, i) => (
              <Pop key={i} t={t} at={ph.start} slam>
                <span style={txt(64 * s, i ? P.ink : P.white, 900)}>{ph.text}{i ? '' : '…'}</span>
              </Pop>
            ))}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* ───────────────────────── master ── */

const at = (id: string) => L(id).start - LEAD;
const seq = (a: number, b: number) => ({from: Math.max(0, fr(a)), durationInFrames: Math.max(1, fr(b) - Math.max(0, fr(a)) + 2)});

export const IbdaaPromo: React.FC = () => {
  useArabicFonts();
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: P.ink}}>
      <Sequence {...seq(0, at('brand'))}>
        <Hook />
      </Sequence>
      <Sequence {...seq(at('brand'), at('flat'))}>
        <BrandScene />
      </Sequence>
      <Sequence {...seq(at('flat'), at('w1'))}>
        <BeforeAfter />
      </Sequence>
      {WORK.map((w, i) => (
        <Sequence key={w.id} {...seq(at(w.id), i + 1 < WORK.length ? at(WORK[i + 1].id) : at('word'))}>
          <Work i={i} />
        </Sequence>
      ))}
      <Sequence {...seq(at('word'), at('story'))}>
        <WordScene />
      </Sequence>
      <Sequence {...seq(at('story'), at('shape'))}>
        <StoryScene />
      </Sequence>
      <Sequence {...seq(at('shape'), at('design'))}>
        <ShapeScene />
      </Sequence>
      <Sequence {...seq(at('design'), at('burger'))}>
        <DesignScene />
      </Sequence>
      <Sequence {...seq(at('burger'), at('skins'))}>
        <BurgerScene />
      </Sequence>
      <Sequence {...seq(at('skins'), at('price'))}>
        <SkinScene />
      </Sequence>
      <Sequence {...seq(at('price'), at('cta'))}>
        <PriceScene />
      </Sequence>
      <Sequence {...seq(at('cta'), VO.duration)}>
        <CtaScene />
      </Sequence>
      <LightGrain frame={frame} />
    </AbsoluteFill>
  );
};
