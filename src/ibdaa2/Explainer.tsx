import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {
  Bars,
  Chip,
  clamp01,
  easeInOut,
  easeOut,
  FONT,
  FPS,
  LightGrain,
  P,
  Paper,
  prog,
  rand,
  Rise,
  sp,
  Tri,
  TriWipe,
  useArabicFonts,
  useFrameBox,
} from '../ibdaa/kit';
import {Logo} from '../ibdaa/scenes';
import T from './timeline.json';

const easeIn = (x: number) => x * x * x;
const useT = (t0: number) => t0 + useCurrentFrame() / FPS;
const fr = (t: number) => Math.round(t * FPS);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const txt = (size: number, color: string = P.ink, weight = 900): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: size,
  fontWeight: weight,
  color,
  lineHeight: 1.15,
  whiteSpace: 'nowrap',
});
const Center: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', direction: 'rtl', ...style}}>
    {children}
  </AbsoluteFill>
);
/** Orange circle that floods the frame from (x, y). */
const Flood: React.FC<{k: number; x: number; y: number; color?: string}> = ({k, x, y, color = P.orange}) => {
  const {W, H} = useFrameBox();
  if (k <= 0) return null;
  const r = Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) * k;
  return <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: color}} />;
};

/* ─────────── 1. Hook: a flat post gets scrolled past, rewound, then comes alive ── */

const Hook: React.FC = () => {
  const t = useT(0);
  const {W, H, tall} = useFrameBox();
  const s = W / 1080;
  const h = T.hook;
  const yAt = (tt: number) =>
    -1.3 * H * prog(tt, h.scroll, h.scroll + 0.38, easeIn) * (1 - prog(tt, h.rewind, h.rewind + 0.5, easeOut));
  const y = yAt(t);
  const blur = Math.min(26, Math.abs(y - yAt(t - 1 / FPS)) * 0.06);
  const peel = Math.max(0, t - h.peel);
  const shrink = 1 - 0.06 * prog(t, h.peel, h.flood, easeOut);
  const cw = 0.74 * W;
  const labels: [string, number, number][] = [
    ['ده إعلان.', h.label1, h.scroll],
    ['والناس بتعدّيه… كده.', h.label2, h.rewind],
    ['نفس الكلام… لما يتحرك', h.label3, h.flood],
  ];
  const dull = ['مطعم أبو علي', 'أكل بيتي', 'اطلب دلوقتي'];
  const rew = t > h.rewind - 0.05 && t < h.label3 + 0.1;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Paper t={t} />
      <Center>
        <div
          style={{
            width: cw,
            marginTop: (tall ? 140 : 110) * s,
            background: P.white,
            borderRadius: 26 * s,
            boxShadow: `0 ${20 * s}px ${50 * s}px ${P.shadow}`,
            transform: `translateY(${y}px) scale(${shrink})`,
            filter: blur > 0.5 ? `blur(${blur}px)` : undefined,
            overflow: 'hidden',
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 18 * s, padding: 26 * s, direction: 'rtl'}}>
            <div style={{width: 70 * s, height: 70 * s, borderRadius: '50%', background: '#D9D4CB'}} />
            <div style={{display: 'flex', flexDirection: 'column', gap: 12 * s}}>
              <div style={{width: 230 * s, height: 18 * s, borderRadius: 9 * s, background: '#D9D4CB'}} />
              <div style={{width: 140 * s, height: 14 * s, borderRadius: 7 * s, background: '#E6E1D8'}} />
            </div>
          </div>
          <div
            style={{
              height: cw * 0.78,
              background: '#E7E2D8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 18 * s,
              direction: 'rtl',
            }}
          >
            {dull.map((d, i) => {
              const g = peel > 0 ? peel - i * 0.07 : 0;
              const fall = g > 0 ? 2400 * s * g * g : 0;
              return (
                <div
                  key={i}
                  style={{
                    ...txt((i === 0 ? 62 : 50) * s, '#8D877E', 400),
                    transform: `translateY(${fall}px) rotate(${g > 0 ? (rand(i + 2) - 0.5) * 60 * g * 3 : 0}deg)`,
                  }}
                >
                  {d}
                </div>
              );
            })}
          </div>
          <div style={{display: 'flex', justifyContent: 'space-around', padding: 24 * s}}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{width: 110 * s, height: 18 * s, borderRadius: 9 * s, background: '#E6E1D8'}} />
            ))}
          </div>
        </div>
      </Center>
      <div style={{position: 'absolute', top: (tall ? 200 : 90) * s, left: 0, right: 0, display: 'flex', justifyContent: 'center', direction: 'rtl'}}>
        {labels.map(([l, a, b], i) => {
          const k = prog(t, a, a + 0.5, easeOut);
          const out = prog(t, b - 0.25, b, easeIn);
          if (k <= 0 || out >= 1) return null;
          return (
            <div key={i} style={{position: 'absolute'}}>
              <Rise k={k} out={out}>
                <span style={txt(78 * s, i === 2 ? P.orange : P.ink, 900)}>{l}</span>
              </Rise>
            </div>
          );
        })}
      </div>
      {rew ? (
        <div style={{position: 'absolute', right: 70 * s, top: H * 0.5 - 50 * s, display: 'flex', opacity: Math.floor(t * 8) % 2 ? 0.9 : 0.4}}>
          <Tri size={90 * s} color={P.ink} style={{transform: 'scaleX(-1)'}} />
          <Tri size={90 * s} color={P.ink} style={{transform: 'scaleX(-1)', marginLeft: -40 * s}} />
        </div>
      ) : null}
      <Flood k={prog(t, h.flood, h.end, easeIn)} x={W / 2} y={H / 2 + 80 * s} />
    </AbsoluteFill>
  );
};

/* ─────────── 2. The same words, alive ── */

const Alive: React.FC = () => {
  const a = T.alive;
  const t = useT(a.start);
  const f = fr(t);
  const {W, H} = useFrameBox();
  const s = W / 1080;
  const w1 = sp(f, a.w1, {damping: 9, stiffness: 170, mass: 0.8});
  const w2 = sp(f, a.w2, {damping: 12, stiffness: 160});
  const w3 = sp(f, a.w3, {damping: 10, stiffness: 190});
  const btn = sp(f, a.btn, {damping: 10, stiffness: 220, mass: 0.7});
  const tapK = clamp01((t - a.tap) / 0.6);
  const press = t > a.tap && t < a.tap + 0.18 ? 0.93 : 1;
  const diff = sp(f, a.diff, {damping: 11, stiffness: 200});
  const steam = (i: number) => {
    const k = prog(t, a.w3 + 0.2 + i * 0.1, a.w3 + 1 + i * 0.1, easeOut);
    const rise = ((t * 0.6 + i * 0.33) % 1) * 30 * s;
    return (
      <path
        key={i}
        d={`M ${40 + i * 50} 150 C ${10 + i * 50} 110, ${70 + i * 50} 80, ${40 + i * 50} 40 S ${20 + i * 50} 0, ${45 + i * 50} -20`}
        stroke={P.white}
        strokeWidth={9}
        strokeLinecap="round"
        fill="none"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - k}
        opacity={0.85}
        transform={`translate(0 ${-rise})`}
      />
    );
  };
  return (
    <AbsoluteFill style={{background: P.orange, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1.6px, transparent 1.8px)',
          backgroundSize: '36px 36px',
          backgroundPosition: `${(t * 8) % 36}px 0`,
        }}
      />
      <Center style={{gap: 60 * s}}>
        <div style={{display: 'flex', gap: 60 * s, alignItems: 'flex-end'}}>
          <span style={{...txt(280 * s, P.white), transform: `translateY(${(1 - w1) * -H * 0.7}px) scaleY(${1 + (w1 - 1) * 0.6})`, transformOrigin: '50% 100%'}}>أكل</span>
          <span style={{...txt(180 * s, P.ink), transform: `translateX(${(1 - w2) * -W}px)`}}>بيتي</span>
        </div>
        <div style={{position: 'relative', transform: `scale(${w3})`}}>
          <svg width={160 * s} height={170 * s} viewBox="0 -30 160 180" style={{position: 'absolute', left: -150 * s, top: -20 * s, overflow: 'visible'}}>
            {[0, 1, 2].map(steam)}
          </svg>
          <span style={txt(190 * s, P.white)}>وسخن</span>
        </div>
        <div style={{position: 'relative', marginTop: 40 * s, transform: `scale(${btn * press})`}}>
          <div style={{background: P.white, borderRadius: 100 * s, padding: `${24 * s}px ${64 * s}px ${32 * s}px`, ...txt(66 * s, P.orange, 900), boxShadow: `0 ${16 * s}px ${40 * s}px rgba(120,30,0,0.3)`}}>
            اطلب دلوقتي
          </div>
          {tapK > 0 && tapK < 1 ? (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 400 * s * tapK,
                height: 400 * s * tapK,
                marginLeft: -200 * s * tapK,
                marginTop: -200 * s * tapK,
                borderRadius: '50%',
                border: `${6 * s}px solid ${P.white}`,
                opacity: 1 - tapK,
              }}
            />
          ) : null}
        </div>
      </Center>
      <div style={{position: 'absolute', bottom: 110 * s, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <Chip size={46 * s} k={diff} color={P.white} fill={false}>
          شفت الفرق؟
        </Chip>
      </div>
    </AbsoluteFill>
  );
};

/* ─────────── 3. A word that moves ── */

const Word: React.FC = () => {
  const w = T.word;
  const t = useT(w.start);
  const f = fr(t);
  const {W, H} = useFrameBox();
  const s = W / 1080;
  const r1 = prog(t, w.w[0], w.w[0] + 0.7, easeInOut);
  const x2 = (tt: number) => (1 - prog(tt, w.w[1], w.w[1] + 0.55, easeOut)) * W * 0.9;
  const p3 = sp(f, w.w[2], {damping: 8, stiffness: 200, mass: 0.8});
  const ul = prog(t, w.underline, w.underline + 0.6, easeOut);
  const drift = Math.sin(t * 1.2) * 6 * s;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Paper t={t} />
      <Center style={{gap: 10 * s, transform: `translateY(${drift}px)`}}>
        <div style={{position: 'relative'}}>
          <span style={{...txt(170 * s), display: 'inline-block', clipPath: `inset(0 0 0 ${(1 - r1) * 100}%)`}}>الكلمة</span>
          {r1 > 0 && r1 < 1 ? (
            <div style={{position: 'absolute', top: '12%', bottom: '12%', left: `${(1 - r1) * 100}%`, width: 10 * s, background: P.orange}} />
          ) : null}
        </div>
        <div style={{position: 'relative', height: 190 * s}}>
          {[3, 2, 1, 0].map((g) => (
            <span
              key={g}
              style={{
                ...txt(160 * s, P.orange),
                position: g ? 'absolute' : 'relative',
                right: 0,
                top: 0,
                opacity: g ? 0.22 / g : 1,
                transform: `translateX(${-x2(t - g * 0.045)}px)`,
              }}
            >
              لما تتحرك
            </span>
          ))}
        </div>
        <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 40 * s}}>
          {[0, 1].map((side) => (
            <div key={side} style={{display: 'flex', gap: 12 * s, alignItems: 'center', opacity: clamp01(p3)}}>
              {Array.from({length: 5}, (_, j) => (
                <div
                  key={j}
                  style={{
                    width: 14 * s,
                    height: (30 + 90 * Math.abs(Math.sin(t * 7 + j * 1.3 + side))) * s * clamp01(p3),
                    borderRadius: 10 * s,
                    background: j % 2 ? P.teal : P.orange,
                  }}
                />
              ))}
            </div>
          )).reduce<React.ReactNode[]>((acc, el, i) => (i === 0 ? [el, <span key="w" style={{...txt(200 * s), transform: `scale(${p3})`}}>بتتسمع</span>] : [...acc, el]), [])}
        </div>
        <div style={{width: 560 * s * ul, height: 16 * s, borderRadius: 16 * s, background: P.orange, marginTop: 10 * s}} />
      </Center>
    </AbsoluteFill>
  );
};

/* ─────────── 4. Paper explainer: highlight, circle, pinboard ── */

const CARD_X = [0.78, 0.5, 0.22];
const PaperScene: React.FC = () => {
  const p = T.paper;
  const t = useT(p.start);
  const f = fr(t);
  const {W, H, tall} = useFrameBox();
  const s = W / 1080;
  const sheetY = H * (tall ? 0.33 : 0.3);
  const cardY = H * (tall ? 0.7 : 0.72);
  const cw = 0.25 * W;
  const pull = prog(t, p.pull, p.pull + 0.9, easeInOut);
  const push = prog(t, p.push, p.end, easeIn);
  let fx = W / 2;
  let fy = lerp(sheetY, H / 2, pull);
  let sc = lerp(1.22, 1, pull) * (1 + 0.04 * prog(t, p.pull + 0.9, p.push, (x) => x));
  fx = lerp(fx, CARD_X[2] * W, push);
  fy = lerp(fy, cardY, push);
  sc = sc * (1 + 5 * push);
  const hl = prog(t, p.highlight, p.highlight + 0.8, easeInOut);
  const circ = prog(t, p.circle, p.circle + 0.6, easeInOut);
  const arrow = prog(t, p.circle + 0.6, p.circle + 1.1, easeOut);
  const str = prog(t, p.string, p.string + 1.2, easeInOut);
  const pins = CARD_X.map((x) => ({x: x * W, y: cardY - cw * 0.62}));
  const gray = (w: number, k: number) => (
    <div key={k} style={{width: w * s, height: 20 * s, borderRadius: 10 * s, background: '#DCD5C7', margin: `${14 * s}px 0`}} />
  );
  const icons = [
    <svg key="b" width={cw * 0.5} height={cw * 0.5} viewBox="0 0 100 100">
      <circle cx="50" cy="42" r="26" fill={P.orange} />
      <rect x="38" y="66" width="24" height="16" rx="4" fill={P.ink} />
      {[0, 1, 2].map((i) => (
        <line key={i} x1={50 + Math.cos(-Math.PI / 2 + (i - 1) * 0.8) * 34} y1={42 + Math.sin(-Math.PI / 2 + (i - 1) * 0.8) * 34} x2={50 + Math.cos(-Math.PI / 2 + (i - 1) * 0.8) * 44} y2={42 + Math.sin(-Math.PI / 2 + (i - 1) * 0.8) * 44} stroke={P.orange} strokeWidth="6" strokeLinecap="round" />
      ))}
    </svg>,
    <svg key="q" width={cw * 0.5} height={cw * 0.5} viewBox="0 0 100 100">
      <rect x="10" y="16" width="80" height="54" rx="14" fill={P.teal} />
      <path d="M 30 68 L 26 88 L 48 68 Z" fill={P.teal} />
      {[0, 1].map((i) => (
        <rect key={i} x="24" y={32 + i * 16} width={i ? 34 : 52} height="8" rx="4" fill={P.white} />
      ))}
    </svg>,
    <Tri key="v" size={cw * 0.46} />,
  ];
  const labels = ['فكرة', 'قصة', 'فيديو'];
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Paper t={t} tone={P.paper} />
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: `translate(${W / 2 - fx * sc}px, ${H / 2 - fy * sc}px) scale(${sc})`}}>
        {/* the torn sheet */}
        <div
          style={{
            position: 'absolute',
            left: W * 0.11,
            top: sheetY - 0.23 * W,
            width: W * 0.78,
            padding: `${50 * s}px ${60 * s}px`,
            background: P.white,
            transform: 'rotate(-2deg)',
            boxShadow: `0 ${12 * s}px ${30 * s}px ${P.shadow}`,
            clipPath: 'polygon(0% 3%, 8% 0%, 17% 2.5%, 26% 0.5%, 37% 3%, 49% 0%, 61% 2.5%, 72% 0.4%, 84% 2.8%, 93% 0.6%, 100% 2.4%, 100% 100%, 0% 100%)',
            direction: 'rtl',
          }}
        >
          {gray(600, 1)}
          {gray(480, 2)}
          <div style={{position: 'relative', display: 'inline-block', margin: `${10 * s}px 0`}}>
            <div style={{position: 'absolute', right: -10 * s, top: '18%', bottom: '8%', width: `calc(${hl * 100}% + ${20 * s * hl}px)`, background: 'rgba(255,90,32,0.35)', borderRadius: 6 * s}} />
            <span style={{...txt(60 * s, P.ink, 800), position: 'relative'}}>المعلومة لما تتحكي صح</span>
          </div>
          <div style={{display: 'flex', gap: 22 * s, margin: `${4 * s}px 0 ${10 * s}px`}}>
            <span style={{position: 'relative', ...txt(60 * s, P.ink, 800)}}>
              بتتفهم
              <svg viewBox="0 0 100 60" preserveAspectRatio="none" style={{position: 'absolute', left: '-22%', top: '-28%', width: '144%', height: '156%', overflow: 'visible'}}>
                <path d="M 88 12 C 70 0, 18 2, 6 22 C -4 42, 30 58, 62 54 C 92 50, 104 30, 82 8" fill="none" stroke={P.teal} strokeWidth="5" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - circ} />
              </svg>
            </span>
            <span style={txt(60 * s, P.ink, 800)}>وتتفتكر</span>
          </div>
          {gray(560, 3)}
          {gray(380, 4)}
        </div>
        {/* arrow from the circled word down to the board */}
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <path d={`M ${W * 0.7} ${sheetY + 0.1 * W} C ${W * 0.72} ${sheetY + 0.2 * W}, ${W * 0.8} ${sheetY + 0.24 * W}, ${W * 0.78} ${pins[0].y - 30 * s}`} fill="none" stroke={P.teal} strokeWidth={7 * s} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - arrow} />
          <path
            d={`M ${pins[0].x} ${pins[0].y} Q ${(pins[0].x + pins[1].x) / 2} ${pins[0].y + 60 * s}, ${pins[1].x} ${pins[1].y} Q ${(pins[1].x + pins[2].x) / 2} ${pins[1].y + 60 * s}, ${pins[2].x} ${pins[2].y}`}
            fill="none"
            stroke={P.orange}
            strokeWidth={6 * s}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - str}
          />
        </svg>
        {CARD_X.map((x, i) => {
          const k = sp(f, p.cards[i], {damping: 13, stiffness: 150});
          const pin = sp(f, p.cards[i] + 0.25, {damping: 9, stiffness: 250, mass: 0.6});
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x * W - cw / 2,
                top: cardY - cw * 0.62 + (1 - k) * H * 0.6,
                width: cw,
                height: cw * 1.24,
                background: P.white,
                borderRadius: 14 * s,
                boxShadow: `0 ${10 * s}px ${24 * s}px ${P.shadow}`,
                transform: `rotate(${[-4, 2, -2][i] + (1 - k) * 30}deg)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 20 * s,
                opacity: clamp01(k * 3),
              }}
            >
              <div style={{position: 'absolute', top: -14 * s, width: 34 * s, height: 34 * s, borderRadius: '50%', background: P.orange, transform: `scale(${pin})`, boxShadow: `0 ${4 * s}px ${8 * s}px ${P.shadow}`}} />
              {icons[i]}
              <span style={txt(54 * s, P.ink, 900)}>{labels[i]}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ─────────── 5. Shapes: a ball becomes a phone, a chart, the logo ── */

const ORBIT_ICONS = [
  (c: string) => <path d="M 14 22 L 24 22 L 34 62 L 76 62 L 86 32 L 30 32" fill="none" stroke={c} strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" />,
  (c: string) => <path d="M 50 84 C 10 56, 8 30, 28 20 C 40 14, 48 22, 50 30 C 52 22, 60 14, 72 20 C 92 30, 90 56, 50 84 Z" fill={c} />,
  (c: string) => <path d="M 50 8 L 61 37 L 92 38 L 68 57 L 76 88 L 50 70 L 24 88 L 32 57 L 8 38 L 39 37 Z" fill={c} />,
  (c: string) => <path d="M 14 18 H 86 V 66 H 46 L 26 84 V 66 H 14 Z" fill={c} />,
];

const Shapes: React.FC = () => {
  const c = T.shape;
  const t = useT(c.start);
  const f = fr(t);
  const {W, H, tall} = useFrameBox();
  const s = W / 1080;
  const cy = H * (tall ? 0.53 : 0.57);
  const tau = Math.max(0, t - c.drop);
  const bounceY = -H * 0.55 * Math.exp(-3.2 * tau) * Math.abs(Math.cos(Math.min(tau, 3) * 5.2));
  const contact = clamp01(1 - Math.abs(bounceY) / (0.04 * H)) * Math.exp(-2.5 * tau);
  const m = prog(t, c.morph, c.morph + 0.8, easeInOut);
  const d = 0.2 * W;
  const pw = lerp(d, 0.36 * W, m);
  const ph = lerp(d, 0.64 * W, m);
  const radius = lerp(d / 2, 0.06 * W, m);
  const logo = prog(t, c.logo, c.logo + 0.6, easeInOut);
  const bars = [0.38, 0.62, 0.86].map((hgt, i) => hgt * prog(t, c.bars + i * 0.15, c.bars + 0.6 + i * 0.15, easeOut));
  const chart = prog(t, c.chart, c.chart + 0.8, easeInOut);
  const logoK = [0, 1, 2].map((i) => prog(t, c.logo + 0.2 + i * 0.1, c.logo + 0.8 + i * 0.1, easeOut));
  const triK = sp(f, c.logo + 0.1, {damping: 11, stiffness: 180});
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Paper t={t} />
      <div style={{position: 'absolute', top: (tall ? 170 : 80) * s, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', direction: 'rtl'}}>
        <Rise k={prog(t, c.title, c.title + 0.6, easeOut)}>
          <span style={txt(76 * s, P.ink, 800)}>والشكل لما يتحرك…</span>
        </Rise>
        <Rise k={prog(t, c.title + 0.5, c.title + 1.1, easeOut)}>
          <span style={txt(130 * s, P.orange, 900)}>بيبيع</span>
        </Rise>
      </div>
      {/* ball → phone */}
      <div
        style={{
          position: 'absolute',
          left: W / 2 - pw / 2,
          top: cy - ph / 2 + bounceY * (1 - m),
          width: pw,
          height: ph,
          borderRadius: radius,
          background: m > 0.5 ? P.white : P.teal,
          border: `${lerp(0, 12 * s, m)}px solid ${P.ink}`,
          transform: `scale(${1 + 0.28 * contact}, ${1 - 0.22 * contact}) scale(${1 - 0.5 * logo})`,
          transformOrigin: '50% 100%',
          opacity: 1 - logo,
          overflow: 'hidden',
          boxShadow: `0 ${20 * s}px ${40 * s}px ${P.shadow}`,
        }}
      >
        <div style={{position: 'absolute', inset: 0, background: P.teal, opacity: 1 - clamp01(m * 2)}} />
        <div style={{position: 'absolute', left: '14%', right: '14%', bottom: '12%', height: '58%', display: 'flex', alignItems: 'flex-end', gap: '9%'}}>
          {bars.map((b, i) => (
            <div key={i} style={{flex: 1, height: `${b * 100}%`, borderRadius: 10 * s, background: i === 1 ? P.orange : P.teal}} />
          ))}
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
          <polyline points="12,70 34,56 52,62 86,22" fill="none" stroke={P.ink} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - chart} />
        </svg>
      </div>
      {logo > 0 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: cy - 0.13 * W, display: 'flex', justifyContent: 'center', opacity: clamp01(logo * 2)}}>
          <Logo size={0.26 * W} k={logoK} tri={triK} />
        </div>
      ) : null}
      {ORBIT_ICONS.map((ic, i) => {
        const k = sp(f, c.orbit + i * 0.18, {damping: 10, stiffness: 200});
        const ang = (i / 4) * Math.PI * 2 + (t - c.orbit) * 0.5 - Math.PI / 4;
        const R = 0.36 * W;
        const sz = 0.13 * W;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: W / 2 + Math.cos(ang) * R - sz / 2,
              top: cy + Math.sin(ang) * R * 0.8 - sz / 2,
              width: sz,
              height: sz,
              borderRadius: '50%',
              background: P.white,
              boxShadow: `0 ${10 * s}px ${24 * s}px ${P.shadow}`,
              transform: `scale(${k})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width={sz * 0.56} height={sz * 0.56} viewBox="0 0 100 100">
              {ic(i % 2 ? P.teal : P.orange)}
            </svg>
          </div>
        );
      })}
      <div style={{position: 'absolute', bottom: (tall ? 170 : 70) * s, left: 0, right: 0, textAlign: 'center', direction: 'rtl', opacity: prog(t, c.sub, c.sub + 0.5, easeOut)}}>
        <span style={txt(48 * s, P.inkSoft, 600)}>رسمة بسيطة… تبقى </span>
        <span style={txt(48 * s, P.teal, 800)}>رسالة كاملة</span>
      </div>
    </AbsoluteFill>
  );
};

/* ─────────── 6. One template, your identity ── */

type Skin = {q: string; sector: string; name: string; head: string; cta: string; bg: string; main: string; acc: string; icon: (m: string, a: string) => React.ReactNode};
const SKINS: Skin[] = [
  {
    q: 'عندك مطعم؟', sector: 'مطعم', name: 'الشيف', head: 'طعم يتفتكر', cta: 'اطلب دلوقتي', bg: '#FFE7D3', main: '#D7263D', acc: '#FFB400',
    icon: (m, a) => (
      <>
        <path d="M 14 46 C 14 20, 86 20, 86 46 Z" fill={a} />
        <rect x="10" y="50" width="80" height="12" rx="6" fill={m} />
        <rect x="14" y="66" width="72" height="14" rx="7" fill={a} />
      </>
    ),
  },
  {
    q: 'بتعلّم؟', sector: 'تعليم', name: 'أكاديمية النجاح', head: 'افهم… متحفظش', cta: 'احجز مكانك', bg: '#E4ECFF', main: '#1D3A8A', acc: '#F2B705',
    icon: (m, a) => (
      <>
        <path d="M 50 18 L 92 38 L 50 58 L 8 38 Z" fill={m} />
        <path d="M 26 48 V 70 C 38 82, 62 82, 74 70 V 48 L 50 60 Z" fill={m} />
        <path d="M 86 40 V 66" stroke={a} strokeWidth="6" strokeLinecap="round" />
        <circle cx="86" cy="70" r="6" fill={a} />
      </>
    ),
  },
  {
    q: 'عندك براند؟', sector: 'براند', name: 'لمسة', head: 'أناقة بتتحرك', cta: 'تسوّق دلوقتي', bg: '#F7E4EA', main: '#7A2E4F', acc: '#C9A46A',
    icon: (m, a) => (
      <>
        <path d="M 50 34 C 50 20, 66 22, 64 32 C 62 40, 50 38, 50 46" fill="none" stroke={a} strokeWidth="6" strokeLinecap="round" />
        <path d="M 50 46 L 10 74 H 90 Z" fill="none" stroke={m} strokeWidth="8" strokeLinejoin="round" />
      </>
    ),
  },
  {
    q: 'عندك عيادة؟', sector: 'عيادة', name: 'سمايل كلينك', head: 'ابتسامتك تهمنا', cta: 'احجز كشفك', bg: '#DFF5F3', main: '#0E8C88', acc: '#FF7A59',
    icon: (m, a) => (
      <>
        <path d="M 50 86 C 12 60, 8 32, 28 22 C 40 16, 48 24, 50 32 C 52 24, 60 16, 72 22 C 92 32, 88 60, 50 86 Z" fill={m} />
        <rect x="44" y="34" width="12" height="34" rx="3" fill={P.white} />
        <rect x="33" y="45" width="34" height="12" rx="3" fill={P.white} />
        <circle cx="80" cy="24" r="8" fill={a} />
      </>
    ),
  },
];

const SkinCard: React.FC<{k: Skin; w: number; headK?: number; iconK?: number}> = ({k, w, headK = 1, iconK = 1}) => {
  const u = w / 760;
  return (
    <div style={{width: w, background: P.white, borderRadius: 44 * u, padding: 44 * u, boxShadow: `0 ${24 * u}px ${60 * u}px rgba(0,0,0,0.14)`, direction: 'rtl', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 * u}}>
      <div style={{alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <span style={txt(40 * u, k.main, 900)}>{k.name}</span>
        <span style={{...txt(30 * u, P.white, 700), background: k.main, borderRadius: 40 * u, padding: `${8 * u}px ${24 * u}px ${12 * u}px`}}>{k.sector}</span>
      </div>
      <div style={{width: 360 * u, height: 360 * u, borderRadius: '50%', background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${iconK})`}}>
        <svg width={230 * u} height={230 * u} viewBox="0 0 100 100">
          {k.icon(k.main, k.acc)}
        </svg>
      </div>
      <Rise k={headK}>
        <span style={txt(72 * u, k.main, 900)}>{k.head}</span>
      </Rise>
      <div style={{...txt(40 * u, P.white, 800), background: k.acc, color: P.ink, borderRadius: 60 * u, padding: `${16 * u}px ${54 * u}px ${22 * u}px`}}>{k.cta}</div>
    </div>
  );
};

const Skins: React.FC = () => {
  const c = T.skin;
  const t = useT(c.start);
  const f = fr(t);
  const {W, H, tall} = useFrameBox();
  const s = W / 1080;
  const idx = Math.max(0, c.at.filter((a) => t >= a - 0.25).length - 1);
  const skin = SKINS[idx];
  const prev = SKINS[Math.max(0, idx - 1)];
  const wipe = prog(t, c.at[idx] - 0.25, c.at[idx] + 0.15, easeInOut);
  const headK = prog(t, c.at[idx], c.at[idx] + 0.5, easeOut);
  const iconK = sp(f, c.at[idx] + 0.05, {damping: 10, stiffness: 200});
  const cardIn = sp(f, c.card, {damping: 15, stiffness: 140});
  const grid = prog(t, c.grid, c.grid + 0.7, easeInOut);
  const cardW = (tall ? 780 : 680) * s;
  const qK = prog(t, c.at[idx], c.at[idx] + 0.45, easeOut);
  const gridText = prog(t, c.text, c.text + 0.6, easeOut);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: idx === 0 && t < c.at[0] - 0.25 ? P.cream : prev.bg}}>
      <Flood k={idx === 0 && t < c.at[0] - 0.25 ? 0 : wipe} x={W / 2} y={H / 2} color={skin.bg} />
      <AbsoluteFill style={{background: P.cream, opacity: grid}} />
      {grid < 1 ? (
        <>
          <div style={{position: 'absolute', top: (tall ? 180 : 70) * s, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: 1 - grid}}>
            <Rise k={qK}>
              <span style={txt(96 * s, skin.main, 900)}>{skin.q}</span>
            </Rise>
          </div>
          <Center style={{paddingTop: (tall ? 120 : 150) * s, opacity: 1 - grid}}>
            <div style={{transform: `translateY(${(1 - cardIn) * H}px) scale(${1 - 0.3 * grid})`}}>
              <SkinCard k={skin} w={cardW} headK={t < c.at[0] ? 0 : headK} iconK={t < c.at[0] ? 0.4 : iconK} />
            </div>
          </Center>
        </>
      ) : null}
      {grid > 0 ? (
        <Center style={{paddingTop: (tall ? 60 : 120) * s}}>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 34 * s}}>
            {SKINS.map((k, i) => {
              const g = sp(f, c.grid + i * 0.1, {damping: 13, stiffness: 160});
              return (
                <div key={i} style={{transform: `scale(${0.4 + 0.6 * g}) rotate(${(1 - g) * (i % 2 ? 8 : -8)}deg)`, opacity: clamp01(g * 2)}}>
                  <SkinCard k={k} w={(tall ? 470 : 380) * s} />
                </div>
              );
            })}
          </div>
        </Center>
      ) : null}
      {gridText > 0 ? (
        <div style={{position: 'absolute', top: (tall ? 150 : 40) * s, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 22 * s, direction: 'rtl'}}>
          <Rise k={gridText}>
            <span style={txt(76 * s, P.ink, 900)}>بألوانك…</span>
          </Rise>
          <Rise k={prog(t, c.text + 0.6, c.text + 1.2, easeOut)}>
            <span style={txt(76 * s, P.orange, 900)}>وبهويتك</span>
          </Rise>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* ─────────── 7. Price: the 3 slams, the zeros roll in ── */

const Offer: React.FC = () => {
  const o = T.offer;
  const t = useT(o.start);
  const f = fr(t);
  const {W, H} = useFrameBox();
  const s = W / 1080;
  const three = sp(f, o.three, {damping: 9, stiffness: 210, mass: 0.8});
  const zero = (i: number) => prog(t, o.zeros[i], o.zeros[i] + 0.6, easeOut);
  const barsK = [0, 1, 2].map((j) => prog(t, o.b + j * 0.1, o.b + 0.7 + j * 0.1, easeOut));
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Paper t={t} />
      <Center>
        <Rise k={prog(t, o.a, o.a + 0.5, easeOut)}>
          <span style={txt(64 * s, P.inkSoft, 700)}>وده كله…</span>
        </Rise>
        <Rise k={prog(t, o.b, o.b + 0.5, easeOut)}>
          <span style={txt(104 * s, P.ink, 900)}>بيبدأ من</span>
        </Rise>
        <div style={{display: 'flex', direction: 'ltr', ...txt(380 * s, P.orange, 900), lineHeight: 1.05}}>
          <span style={{display: 'inline-block', transform: `translateY(${(1 - three) * -H * 0.7}px)`}}>3</span>
          {[0, 1].map((i) => (
            <span key={i} style={{display: 'inline-block', transform: `translateX(${(1 - zero(i)) * -W}px) rotate(${(1 - zero(i)) * -720}deg)`, color: i ? P.teal : P.orange}}>
              0
            </span>
          ))}
        </div>
        <Rise k={prog(t, o.egp, o.egp + 0.5, easeOut)}>
          <span style={txt(110 * s, P.ink, 900)}>جنيه بس</span>
        </Rise>
      </Center>
      <div style={{position: 'absolute', left: 70 * s, bottom: H * 0.12}}>
        <Bars w={240 * s} k={barsK} thick={22 * s} gap={18 * s} />
      </div>
      <Flood k={prog(t, o.flood, o.end, easeIn)} x={W / 2} y={H / 2} />
    </AbsoluteFill>
  );
};

/* ─────────── 8. CTA ── */

const Cta: React.FC = () => {
  const c = T.cta;
  const t = useT(c.start);
  const f = fr(t);
  const {W, tall} = useFrameBox();
  const s = W / 1080;
  const wa = sp(f, c.wa, {damping: 11, stiffness: 200, mass: 0.7});
  const logoK = sp(f, c.logo, {damping: 14, stiffness: 140});
  const barsK = [0, 1, 2].map((j) => prog(t, c.logo + 0.2 + j * 0.1, c.logo + 0.8 + j * 0.1, easeOut));
  const wig = Math.sin((t - c.l2) * 6) * 3 * Math.exp(-Math.max(0, t - c.l2 - 0.4) * 0.6);
  return (
    <AbsoluteFill style={{background: P.orange, overflow: 'hidden'}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(255,255,255,0.16) 1.6px, transparent 1.8px)', backgroundSize: '36px 36px', backgroundPosition: `${(t * 6) % 36}px 0`}} />
      <Center style={{gap: 20 * s, paddingBottom: (tall ? 320 : 240) * s}}>
        <Rise k={prog(t, c.l1, c.l1 + 0.6, easeOut)}>
          <span style={txt(110 * s, P.white, 900)}>ابعتلنا فكرتك…</span>
        </Rise>
        <Rise k={prog(t, c.l2, c.l2 + 0.6, easeOut)}>
          <span style={{...txt(140 * s, P.ink, 900), display: 'inline-block', transform: `rotate(${wig}deg)`}}>وإحنا نحرّكها</span>
        </Rise>
        <div
          style={{
            marginTop: 40 * s,
            background: P.white,
            borderRadius: 100 * s,
            padding: `${24 * s}px ${50 * s}px ${30 * s}px`,
            display: 'flex',
            alignItems: 'center',
            gap: 22 * s,
            transform: `scale(${0.5 + 0.5 * wa})`,
            opacity: clamp01(wa * 2),
          }}
        >
          <span style={txt(40 * s, P.inkSoft, 600)}>واتساب</span>
          <span style={{...txt(62 * s, P.ink, 900), direction: 'ltr'}}>01130808848</span>
        </div>
      </Center>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: (tall ? 170 : 90) * s, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 * s, transform: `translateY(${(1 - logoK) * 200}px)`, opacity: clamp01(logoK * 2)}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 28 * s, direction: 'rtl'}}>
          <span style={txt(84 * s, P.white, 900)}>إبداع</span>
          <span style={txt(84 * s, P.ink, 900)}>بيتحرك</span>
          <Logo size={110 * s} k={barsK} triColor={P.white} colors={[P.white, P.ink, P.white]} />
        </div>
        <span style={{...txt(40 * s, P.white, 600), direction: 'rtl'}}>بألوانك… وبهويتك… وبسعر رمزي</span>
      </div>
    </AbsoluteFill>
  );
};

/* ─────────── master ── */

const seq = (a: number, b: number) => ({from: Math.round(a * FPS), durationInFrames: Math.round((b - a) * FPS)});

export const IbdaaExplainer: React.FC = () => {
  useArabicFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{background: P.cream}}>
      <Sequence {...seq(0, T.hook.end + 0.05)}>
        <Hook />
      </Sequence>
      <Sequence {...seq(T.alive.start, T.alive.end + 0.1)}>
        <Alive />
      </Sequence>
      <Sequence {...seq(T.word.start, T.word.end + 0.1)}>
        <Word />
      </Sequence>
      <Sequence {...seq(T.paper.start, T.paper.end + 0.1)}>
        <PaperScene />
      </Sequence>
      <Sequence {...seq(T.shape.start, T.shape.end + 0.1)}>
        <Shapes />
      </Sequence>
      <Sequence {...seq(T.skin.start, T.skin.end + 0.1)}>
        <Skins />
      </Sequence>
      <Sequence {...seq(T.offer.start, T.offer.end + 0.05)}>
        <Offer />
      </Sequence>
      <Sequence {...seq(T.cta.start, T.cta.end)}>
        <Cta />
      </Sequence>
      {[T.word.start, T.paper.start, T.shape.start, T.skin.start, T.offer.start].map((w) => (
        <TriWipe key={w} t={t} at={w} />
      ))}
      <LightGrain frame={frame} />
    </AbsoluteFill>
  );
};
