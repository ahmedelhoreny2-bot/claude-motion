import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {easeIn, easeInOut, easeOut, prog, rand, sp} from '../lib';
import {AR, EN, L, POP, asset, useAsemaFonts} from '../asema/AsemaPromo';
import TL from './timeline.json';

// Al Asema Lab, video 4: «شوف اللي مش باين». Vox-style paper collage + kinetic type, 1080x1920.
export const SW = 1080;
export const SH = 1920;
export const SFPS = TL.fps;
const W = SW;
const H = SH;
const B = TL.b;
const S = TL.scenes;
const WORDS = TL.words as unknown as [number, number, string][];
const PAPER = '#F3ECE1';
const INK = '#1A1A1A';
const SLAP = {damping: 13, stiffness: 320, mass: 0.6};
const img = (f: string) => staticFile(`asema4/${f}`);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Stop-motion clock: paper things move on twos-and-a-half (12 fps). */
const stop = (t: number) => Math.floor(t * 12) / 12;
/** Tiny per-frame paper jitter (px), changing 12 times a second. */
const jit = (t: number, seed: number, amp = 2) => {
  const k = Math.floor(t * 12);
  return [(rand(k * 7.1 + seed) - 0.5) * 2 * amp, (rand(k * 3.3 + seed * 1.7) - 0.5) * 2 * amp, (rand(k * 5.9 + seed * 2.3) - 0.5) * amp * 0.6];
};

// ---------------------------------------------------------------- paper kit
const Paper: React.FC<{color?: string; seed?: number}> = ({color = PAPER, seed = 1}) => (
  <AbsoluteFill style={{background: color}}>
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: 0.55}}>
      <filter id={`fib${seed}`}><feTurbulence type="fractalNoise" baseFrequency="0.9 0.04" numOctaves={2} seed={seed} />
        <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.3  0 0 0 0.35 0" /></filter>
      <rect width={W} height={H} filter={`url(#fib${seed})`} />
      <filter id={`grn${seed}`}><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves={1} seed={seed + 9} />
        <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0.25 0" /></filter>
      <rect width={W} height={H} filter={`url(#grn${seed})`} />
    </svg>
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, transparent 55%, rgba(80,50,30,0.18) 100%)'}} />
  </AbsoluteFill>
);

const Halftone: React.FC<{x: number; y: number; r: number; color?: string; op?: number; id: string}> = ({x, y, r, color = L.blue, op = 0.35, id}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
    <defs>
      <pattern id={`ht${id}`} width={22} height={22} patternUnits="userSpaceOnUse" patternTransform="rotate(20)"><circle cx={11} cy={11} r={5} fill={color} /></pattern>
      <radialGradient id={`hg${id}`}><stop offset="0" stopColor="#fff" /><stop offset="0.7" stopColor="#fff" stopOpacity={0.6} /><stop offset="1" stopColor="#fff" stopOpacity={0} /></radialGradient>
      <mask id={`hm${id}`}><circle cx={x} cy={y} r={r} fill={`url(#hg${id})`} /></mask>
    </defs>
    <rect width={W} height={H} fill={`url(#ht${id})`} mask={`url(#hm${id})`} opacity={op} />
  </svg>
);

const Tape: React.FC<{x: number; y: number; w?: number; rot?: number}> = ({x, y, w = 150, rot = 0}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: y - 22, width: w, height: 44, transform: `rotate(${rot}deg)`,
    background: 'rgba(240,226,190,0.78)', boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
    clipPath: 'polygon(0 8%,4% 0,8% 10%,12% 0,16% 8%,84% 4%,88% 0,92% 10%,96% 0,100% 8%,100% 92%,96% 100%,92% 90%,88% 100%,84% 94%,16% 96%,12% 100%,8% 90%,4% 100%,0 92%)'}} />
);

/** Something slapped onto the paper: drops in on a stiff spring, settles at its angle, jitters on twos. */
const Slap: React.FC<{t: number; f: number; at: number; x: number; y: number; rot?: number; seed: number; from?: 'top' | 'left' | 'right' | 'bottom' | 'scale'; children: React.ReactNode}> = ({
  t, f, at, x, y, rot = 0, seed, from = 'scale', children,
}) => {
  const k = sp(Math.round(stop(t) * SFPS), at, SLAP, SFPS);
  if (t < at) return null;
  const [jx, jy, jr] = jit(t, seed);
  const d = (1 - k) * 900;
  const tx = from === 'left' ? -d : from === 'right' ? d : 0;
  const ty = from === 'top' ? -d : from === 'bottom' ? d : 0;
  const sc = from === 'scale' ? 1.35 - 0.35 * k : 1;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) translate(${tx + jx}px,${ty + jy}px) rotate(${rot + jr + (1 - k) * 8}deg) scale(${sc})`,
      opacity: from === 'scale' ? Math.min(1, k * 2) : 1}}>{children}</div>
  );
};

const cutStyle = (w: number): React.CSSProperties => ({
  width: w, display: 'block',
  filter: 'drop-shadow(5px 0 0 #fff) drop-shadow(-5px 0 0 #fff) drop-shadow(0 5px 0 #fff) drop-shadow(0 -5px 0 #fff) drop-shadow(0 14px 14px rgba(60,30,10,0.28))',
});
const Cut: React.FC<{src: string; w: number; mine?: boolean}> = ({src, w, mine}) => <Img src={mine ? asset(src) : img(src)} style={cutStyle(w)} />;

const Print: React.FC<{src: string; w: number; h: number; tapeRot?: number}> = ({src, w, h, tapeRot = -6}) => (
  <div style={{position: 'relative', width: w + 36, height: h + 36, background: '#fff', padding: 18, boxShadow: '0 16px 24px rgba(60,30,10,0.3)'}}>
    <Img src={img(src)} style={{width: w, height: h, objectFit: 'cover', display: 'block'}} />
    <Tape x={(w + 36) / 2} y={4} rot={tapeRot} />
  </div>
);

/** Label-maker strip: paper strip with bold text, optional highlighter sweeping behind the text. */
const Strip: React.FC<{text: string; size?: number; hl?: number; bg?: string; fg?: string; hlColor?: string}> = ({text, size = 54, hl = 0, bg = '#fff', fg = INK, hlColor = L.orange}) => (
  <div style={{position: 'relative', background: bg, padding: `${size * 0.18}px ${size * 0.5}px`, boxShadow: '0 8px 14px rgba(60,30,10,0.22)', whiteSpace: 'nowrap', direction: 'rtl',
    clipPath: 'polygon(1% 0,99% 3%,100% 97%,0 100%)'}}>
    <div style={{position: 'absolute', right: size * 0.35, top: '22%', height: '62%', width: `calc(${hl * 100}% - ${size * 0.7 * hl}px)`, background: hlColor, opacity: 0.85,
      transform: 'skewX(-8deg)', borderRadius: 6}} />
    <span style={{position: 'relative', fontFamily: AR, fontWeight: 800, fontSize: size, color: fg}}>{text}</span>
  </div>
);

/** Hand-drawn marker loop, drawn on by k. */
const Loop: React.FC<{cx: number; cy: number; rx: number; ry: number; k: number; color?: string; w?: number; rot?: number}> = ({cx, cy, rx, ry, k, color = L.red, w = 10, rot = -8}) => {
  const d = `M${cx + rx},${cy} C${cx + rx},${cy - ry * 1.1} ${cx - rx * 1.05},${cy - ry * 1.05} ${cx - rx},${cy} C${cx - rx * 0.95},${cy + ry * 1.1} ${cx + rx * 1.1},${cy + ry} ${cx + rx * 1.02},${cy - ry * 0.25} L${cx + rx * 0.9},${cy - ry * 0.6}`;
  const len = (rx + ry) * 3.6;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <path d={d} transform={`rotate(${rot} ${cx} ${cy})`} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - k)} />
    </svg>
  );
};

const Arrow: React.FC<{d: string; head: [number, number, number]; k: number; color?: string; w?: number; len?: number}> = ({d, head, k, color = L.red, w = 9, len = 900}) => {
  const [hx, hy, a] = head;
  const r = (a * Math.PI) / 180;
  const p1 = [hx - 34 * Math.cos(r - 0.5), hy - 34 * Math.sin(r - 0.5)];
  const p2 = [hx - 34 * Math.cos(r + 0.5), hy - 34 * Math.sin(r + 0.5)];
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - clamp01(k * 1.25))} />
      {k > 0.8 && <path d={`M${p1[0]},${p1[1]} L${hx},${hy} L${p2[0]},${p2[1]}`} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
};

/** Big kinetic word: slams in from 1.8x on a stiff spring, with a hard offset shadow. */
const Slam: React.FC<{t: number; f: number; at: number; text: string; size: number; x: number; y: number; color?: string; shadow?: string; rot?: number; seed: number}> = ({
  t, f, at, text, size, x, y, color = '#fff', shadow = INK, rot = 0, seed,
}) => {
  if (t < at - 0.01) return null;
  const k = sp(f, at, {damping: 12, stiffness: 380, mass: 0.6}, SFPS);
  const [jx, jy] = jit(t, seed, 2.5);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) translate(${jx}px,${jy}px) scale(${1.8 - 0.8 * k}) rotate(${rot}deg)`, opacity: Math.min(1, k * 3),
      fontFamily: AR, fontWeight: 800, fontSize: size, color, whiteSpace: 'nowrap', direction: 'rtl', lineHeight: 1, textShadow: `${size * 0.06}px ${size * 0.06}px 0 ${shadow}`}}>{text}</div>
  );
};

/** Torn-paper wipe: the new sheet's torn edge sweeps right-to-left (Arabic reading direction). */
const Torn: React.FC<{t: number; at: number; children: React.ReactNode; first?: boolean}> = ({t, at, children, first}) => {
  const k = first ? 1 : prog(stop(t), at - 0.15, at + 0.25, easeInOut);
  if (k <= 0) return null;
  if (k >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  const edge = W * (1 - k) - 60;
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const y = (i / 40) * H;
    pts.push(`${edge + (rand(i * 13.7 + at) - 0.5) * 70}px ${y}px`);
  }
  const poly = `polygon(${W}px 0px, ${pts.join(', ')}, ${W}px ${H}px)`;
  return (
    <AbsoluteFill style={{clipPath: poly, filter: 'drop-shadow(-10px 0 14px rgba(60,30,10,0.35))'}}>{children}</AbsoluteFill>
  );
};

// ---------------------------------------------------------------- scenes
const Hook: React.FC<{t: number; f: number}> = ({t, f}) => {
  const paperIn = prog(stop(t), B.body - 0.05, B.body + 0.25, easeOut);
  return (
    <AbsoluteFill>
      <Paper color={L.red} seed={3} />
      <Halftone x={540} y={760} r={620} color={L.burgundy} op={0.5} id="h1" />
      <Slam t={t} f={f} at={B.stop} text="استنى" size={250} x={540} y={640} seed={1} />
      {/* phone with the scroll crossed out */}
      <Slap t={t} f={f} at={B.scroll} x={540} y={1110} rot={-6} seed={2}>
        <svg width={300} height={470} viewBox="0 0 300 470">
          <rect x={14} y={10} width={272} height={450} rx={44} fill="#fff" stroke={INK} strokeWidth={10} />
          <rect x={110} y={26} width={80} height={14} rx={7} fill={INK} />
          <path d="M150,330 L150,140 M110,180 L150,140 L190,180" fill="none" stroke={L.blue} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Slap>
      {t > B.scroll + 0.2 && (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          {[[400, 930, 680, 1290], [680, 930, 400, 1290]].map(([x1, y1, x2, y2], i) => {
            const k = prog(t, B.scroll + 0.2 + i * 0.12, B.scroll + 0.38 + i * 0.12, easeOut);
            return <line key={i} x1={x1} y1={y1} x2={x1 + (x2 - x1) * k} y2={y1 + (y2 - y1) * k} stroke={INK} strokeWidth={26} strokeLinecap="round" />;
          })}
        </svg>
      )}
      {paperIn > 0 && (
        <AbsoluteFill style={{transform: `translateY(${(1 - paperIn) * H}px) rotate(${(1 - paperIn) * 4}deg)`}}>
          <Paper seed={4} />
          <Halftone x={560} y={820} r={520} op={0.3} id="h2" />
          <Slap t={t} f={f} at={B.body + 0.1} x={540} y={830} rot={-4} seed={5}><Print src="face-duo.png" w={600} h={680} /></Slap>
          <Loop cx={540} cy={690} rx={250} ry={95} k={prog(t, B.circle, B.circle + 0.45, easeOut)} />
          <Slap t={t} f={f} at={B.blind} x={540} y={300} rot={3} seed={6}>
            <Strip text="انت مش شايفها" size={78} hl={prog(t, B.blind + 0.2, B.blind + 0.6, easeOut)} />
          </Slap>
          {/* eye with a slash, drawn */}
          {t > B.blind && (
            <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
              <g transform="translate(860,1230) rotate(-8)" opacity={prog(t, B.blind, B.blind + 0.2, easeOut)}>
                <path d="M-90,0 Q0,-70 90,0 Q0,70 -90,0 Z" fill="#fff" stroke={INK} strokeWidth={9} />
                <circle cx={0} cy={0} r={26} fill={L.blue} />
                <line x1={-80} y1={60} x2={-80 + 160 * prog(t, B.blind + 0.15, B.blind + 0.35, easeOut)} y2={60 - 120 * prog(t, B.blind + 0.15, B.blind + 0.35, easeOut)} stroke={L.red} strokeWidth={12} strokeLinecap="round" />
              </g>
            </svg>
          )}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

const Iron: React.FC<{t: number; f: number}> = ({t, f}) => (
  <AbsoluteFill>
    <Paper seed={5} />
    {/* paper-cut staircase */}
    {[0, 1, 2, 3].map((i) => (
      <Slap key={i} t={t} f={f} at={S[1] + 0.05 + i * 0.06} x={180 + i * 150} y={1340 - i * 120} seed={20 + i} from="bottom">
        <div style={{width: 300, height: 140 + i * 240, background: [L.blue, '#3D43AA', '#4650C4', '#5A63D0'][i], boxShadow: '0 10px 0 rgba(31,35,107,0.5)',
          clipPath: 'polygon(0 0,100% 2%,99% 100%,1% 98%)', transform: `translateY(${(140 + i * 240) / 2 - 70}px)`}} />
      </Slap>
    ))}
    <Slap t={t} f={f} at={B.drop} x={330} y={1040} rot={-5} seed={11} from="top"><Cut src="a-drop.png" w={330} /></Slap>
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      {[[180, 860, 130, 820], [200, 920, 140, 920], [190, 985, 130, 1020]].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x1 + (x2 - x1) * prog(t, B.drop + 0.4 + i * 0.08, B.drop + 0.6 + i * 0.08, easeOut)}
          y2={y1 + (y2 - y1) * prog(t, B.drop + 0.4 + i * 0.08, B.drop + 0.6 + i * 0.08, easeOut)} stroke={L.red} strokeWidth={8} strokeLinecap="round" />
      ))}
    </svg>
    {/* periodic-table tile */}
    <Slap t={t} f={f} at={B.fe} x={800} y={430} rot={7} seed={12} from="right">
      <div style={{position: 'relative', width: 300, height: 330, background: '#fff', border: `10px solid ${L.burgundy}`, boxShadow: '0 16px 24px rgba(60,30,10,0.3)'}}>
        <div style={{position: 'absolute', left: 22, top: 12, fontFamily: EN, fontWeight: 700, fontSize: 40, color: L.burgundy}}>26</div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center', fontFamily: EN, fontWeight: 700, fontSize: 150, color: L.red, lineHeight: 1}}>Fe</div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 18, textAlign: 'center', fontFamily: AR, fontWeight: 800, fontSize: 48, color: INK}}>الحديد</div>
        <Tape x={150} y={-6} rot={-4} />
      </div>
    </Slap>
    <Slap t={t} f={f} at={B.fe + 0.25} x={790} y={860} rot={-4} seed={13} from="right"><Cut src="a-battery.png" w={380} /></Slap>
    <Loop cx={700} cy={880} rx={90} ry={110} k={prog(t, B.low, B.low + 0.4, easeOut)} />
    <Slap t={t} f={f} at={B.low} x={760} y={1160} rot={-3} seed={14}>
      <Strip text="حديد ناقص؟" size={76} hl={prog(t, B.low + 0.15, B.low + 0.55, easeOut)} />
    </Slap>
  </AbsoluteFill>
);

const Sugar: React.FC<{t: number; f: number}> = ({t, f}) => {
  const g = prog(t, B.gauge, B.high + 0.3, easeInOut);
  const ang = -180 + 165 * g;
  return (
    <AbsoluteFill>
      <Paper seed={6} />
      <Halftone x={380} y={900} r={520} op={0.32} id="h3" />
      <Slap t={t} f={f} at={B.glass} x={360} y={1000} rot={-3} seed={30} from="bottom"><Cut src="glass.png" w={360} /></Slap>
      <Slap t={t} f={f} at={B.sugar} x={420} y={560} rot={12} seed={31} from="top"><Cut src="sugar.png" w={430} /></Slap>
      {/* hand-drawn gauge */}
      <Slap t={t} f={f} at={B.gauge - 0.15} x={790} y={760} rot={4} seed={32}>
        <svg width={360} height={240} viewBox="-180 -190 360 240">
          <path d="M-150,0 A150,150 0 0 1 150,0" fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
          <path d="M60,-137 A150,150 0 0 1 150,0" fill="none" stroke={L.red} strokeWidth={26} />
          <path d="M-150,0 A150,150 0 0 1 -60,-137" fill="none" stroke={L.blue} strokeWidth={26} />
          <line x1={0} y1={0} x2={128 * Math.cos((ang * Math.PI) / 180)} y2={128 * Math.sin((ang * Math.PI) / 180)} stroke={INK} strokeWidth={12} strokeLinecap="round" />
          <circle cx={0} cy={0} r={18} fill={L.red} />
        </svg>
      </Slap>
      <Arrow d="M520,520 C640,430 760,470 790,600" head={[792, 615, 85]} k={prog(t, B.high - 0.2, B.high + 0.3, easeOut)} />
      <Slap t={t} f={f} at={B.high} x={760} y={1040} rot={-4} seed={33}>
        <Strip text="سكر عالي؟" size={80} hl={prog(t, B.high + 0.15, B.high + 0.55, easeOut)} />
      </Slap>
    </AbsoluteFill>
  );
};

const Gland: React.FC<{t: number; f: number}> = ({t, f}) => (
  <AbsoluteFill>
    <Paper seed={7} />
    <Halftone x={540} y={820} r={560} color={L.burgundy} op={0.25} id="h4" />
    <Slap t={t} f={f} at={B.sleep} x={540} y={820} rot={-5} seed={40}><Cut src="thyroid-dial.png" w={600} /></Slap>
    {['Z', 'Z', 'Z'].map((z, i) => (
      <Slam key={i} t={t} f={f} at={B.sleep + 0.3 + i * 0.25} text={z} size={70 + i * 26} x={820 + i * 60} y={480 - i * 80} color={L.blue} shadow="#fff" rot={-12} seed={41 + i} />
    ))}
    <Slap t={t} f={f} at={B.heavy} x={300} y={420} rot={-6} seed={44}><Strip text="نعاس؟ تقل؟" size={64} bg={L.blue} fg="#fff" /></Slap>
    <Loop cx={540} cy={820} rx={330} ry={300} k={prog(t, B.gland, B.gland + 0.45, easeOut)} color={L.red} w={12} rot={6} />
    <Slap t={t} f={f} at={B.gland} x={540} y={1230} rot={3} seed={45}>
      <Strip text="الغدة؟" size={96} hl={prog(t, B.gland + 0.1, B.gland + 0.45, easeOut)} />
    </Slap>
  </AbsoluteFill>
);

const Kinetic: React.FC<{t: number; f: number}> = ({t, f}) => {
  const flip = prog(stop(t), B.k3 - 0.1, B.k3 + 0.15, easeInOut);
  const lens = prog(t, B.k4, B.k4 + 0.4, easeOut);
  return (
    <AbsoluteFill>
      <Paper color={L.red} seed={8} />
      <Slam t={t} f={f} at={B.k1} text="مش بتتشاف" size={150} x={540} y={720} seed={50} rot={-3} />
      <Slam t={t} f={f} at={B.k2} text="بالعين" size={210} x={540} y={960} seed={51} color={L.orange} rot={2} />
      {flip > 0 && (
        <AbsoluteFill style={{clipPath: `inset(0 0 ${(1 - flip) * 100}% 0)`}}>
          <Paper color={L.blue} seed={9} />
          <Halftone x={540} y={980} r={600} color="#fff" op={0.12} id="h5" />
          <Slam t={t} f={f} at={B.k3} text="بتتشاف في" size={120} x={540} y={760} seed={52} />
          <Slam t={t} f={f} at={B.k4} text="التحليل" size={250} x={540} y={1030} seed={53} color={L.orange} rot={-2} />
          {lens > 0 && (
            <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
              <g transform={`translate(${300 + 420 * lens},${1060}) rotate(-20)`}>
                <circle cx={0} cy={0} r={120} fill="rgba(255,255,255,0.18)" stroke="#fff" strokeWidth={18} />
                <line x1={85} y1={85} x2={190} y2={190} stroke="#fff" strokeWidth={30} strokeLinecap="round" />
              </g>
            </svg>
          )}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

const Lab: React.FC<{t: number; f: number}> = ({t, f}) => {
  const tick = (i: number) => prog(t, B.marks - 0.4 + i * 0.15, B.marks - 0.25 + i * 0.15, easeOut);
  return (
    <AbsoluteFill>
      <Paper seed={10} />
      <Halftone x={540} y={1080} r={640} op={0.22} id="h6" />
      <Slap t={t} f={f} at={B.logo} x={540} y={300} rot={-3} seed={60}>
        <div style={{position: 'relative', background: '#fff', padding: '26px 40px', borderRadius: 10, boxShadow: '0 16px 24px rgba(60,30,10,0.28)'}}>
          <Img src={img('logo-stacked.png')} style={{width: 330, display: 'block'}} />
          <Tape x={60} y={10} rot={-30} w={120} /><Tape x={350} y={10} rot={28} w={120} />
        </div>
      </Slap>
      <Slap t={t} f={f} at={B.machines} x={330} y={900} rot={-6} seed={61} from="left"><Print src="analyzer-print.png" w={440} h={550} tapeRot={4} /></Slap>
      <Slap t={t} f={f} at={B.rack} x={800} y={880} rot={7} seed={62} from="right"><Cut src="rack.png" w={360} /></Slap>
      <Slap t={t} f={f} at={B.sheet} x={620} y={1230} rot={-4} seed={63} from="bottom">
        <div style={{position: 'relative'}}>
          <Img src={img('clipboard.png')} style={{width: 470, display: 'block', filter: 'drop-shadow(0 16px 18px rgba(60,30,10,0.3))'}} />
          <svg width={470} height={612} style={{position: 'absolute', inset: 0}} viewBox="0 0 470 612">
            {[0, 1, 2, 3].map((i) => (
              <path key={i} d={`M${330},${250 + i * 44} l14,14 l26,-30`} fill="none" stroke={L.red} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray={70} strokeDashoffset={70 * (1 - tick(i))} />
            ))}
            {t > B.marks && <ellipse cx={170} cy={250 + 2 * 44} rx={110} ry={26} fill="none" stroke={L.red} strokeWidth={7} strokeDasharray={480}
              strokeDashoffset={480 * (1 - prog(t, B.marks, B.marks + 0.4, easeOut))} transform={`rotate(-3 170 ${250 + 2 * 44})`} />}
          </svg>
        </div>
      </Slap>
      <Slap t={t} f={f} at={B.sheet + 0.2} x={300} y={1560} rot={-3} seed={64}>
        <Strip text="بدقة في كل رقم" size={64} hl={prog(t, B.sheet + 0.35, B.sheet + 0.8, easeOut)} />
      </Slap>
    </AbsoluteFill>
  );
};

const Life: React.FC<{t: number; f: number}> = ({t, f}) => {
  const sw = prog(t, B.fast, B.fast + 0.8, easeInOut);
  return (
    <AbsoluteFill>
      <Paper seed={11} />
      <Halftone x={700} y={900} r={560} color={L.orange} op={0.3} id="h7" />
      <Slap t={t} f={f} at={B.check} x={700} y={980} rot={4} seed={70} from="right"><Cut src="relief.png" w={560} /></Slap>
      <Slap t={t} f={f} at={B.check + 0.25} x={300} y={1300} rot={-12} seed={71} from="left"><Cut src="stethoscope.png" w={470} /></Slap>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <path d="M150,420 l80,90 l170,-210" fill="none" stroke={L.red} strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={420}
          strokeDashoffset={420 * (1 - prog(t, B.check + 0.1, B.check + 0.5, easeOut))} />
      </svg>
      {t > B.fast - 0.05 && (
        <Slap t={t} f={f} at={B.fast} x={250} y={760} rot={-8} seed={72}>
          <svg width={240} height={270} viewBox="-120 -150 240 270">
            <rect x={-22} y={-148} width={44} height={30} rx={6} fill={INK} />
            <circle cx={0} cy={0} r={108} fill="#fff" stroke={INK} strokeWidth={12} />
            <path d={`M0,0 L0,-90 A90,90 0 ${sw > 0.5 ? 1 : 0} 1 ${90 * Math.sin(sw * 2 * Math.PI)},${-90 * Math.cos(sw * 2 * Math.PI)} Z`} fill={L.orange} opacity={0.8} />
            <line x1={0} y1={0} x2={90 * Math.sin(sw * 2 * Math.PI)} y2={-90 * Math.cos(sw * 2 * Math.PI)} stroke={L.red} strokeWidth={10} strokeLinecap="round" />
            <circle cx={0} cy={0} r={12} fill={INK} />
          </svg>
        </Slap>
      )}
      <Slap t={t} f={f} at={B.life} x={540} y={300} rot={-3} seed={73}>
        <Strip text="ترجع لحياتك وانت مطمن" size={64} hl={prog(t, B.life + 0.2, B.life + 0.8, easeOut)} />
      </Slap>
    </AbsoluteFill>
  );
};

const PinIcon: React.FC<{size?: number}> = ({size = 46}) => (
  <svg width={size * 0.8} height={size} viewBox="0 0 40 50"><path d="M20,48 C8,32 2,24 2,18 A18,18 0 1 1 38,18 C38,24 32,32 20,48 Z" fill={L.red} /><circle cx={20} cy={18} r={7} fill="#fff" /></svg>
);

const End: React.FC<{t: number; f: number}> = ({t, f}) => {
  const e = B.end;
  const scraps: [string, number, number, number, number][] = [
    ['sugar.png', 140, 230, 230, -14], ['glass.png', 960, 280, 150, 10], ['a-drop.png', 120, 1660, 170, -8],
    ['stethoscope.png', 930, 1660, 260, 14], ['a-battery.png', 960, 1190, 140, 8],
  ];
  const pulse = 1 + 0.04 * Math.max(0, Math.sin((t - B.cta - 0.6) * 5)) * (t > B.cta + 0.6 ? 1 : 0);
  return (
    <AbsoluteFill>
      <Paper seed={12} />
      <Halftone x={540} y={760} r={600} op={0.2} id="h8" />
      {scraps.map(([s, x, y, w, r], i) => (
        <Slap key={s} t={t} f={f} at={e - 0.1 + i * 0.07} x={x} y={y} rot={r} seed={80 + i} from={x < 540 ? 'left' : 'right'}><Cut src={s} w={w} /></Slap>
      ))}
      <Slap t={t} f={f} at={e + 0.05} x={540} y={560} rot={-2} seed={86}>
        <div style={{position: 'relative', background: '#fff', padding: '40px 60px', borderRadius: 12, boxShadow: '0 20px 30px rgba(60,30,10,0.3)'}}>
          <Img src={img('logo-stacked.png')} style={{width: 470, display: 'block'}} />
          <Tape x={80} y={14} rot={-28} w={140} /><Tape x={510} y={14} rot={26} w={140} />
        </div>
      </Slap>
      <Slap t={t} f={f} at={B.tag} x={540} y={930} rot={2} seed={87}>
        <Strip text="شوف اللي مش باين" size={84} hl={prog(t, B.tag + 0.15, B.tag + 0.6, easeOut)} />
      </Slap>
      <Slap t={t} f={f} at={B.pin} x={540} y={1110} rot={-2} seed={88}>
        <div style={{background: '#fff', padding: '18px 32px', boxShadow: '0 10px 16px rgba(60,30,10,0.22)', direction: 'rtl', textAlign: 'center'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontFamily: AR, fontWeight: 800, fontSize: 46, color: L.burgundy}}><PinIcon size={44} />في قلب ميت غمر</div>
          <div style={{fontFamily: AR, fontWeight: 600, fontSize: 30, color: '#5F5F66', marginTop: 4, whiteSpace: 'nowrap'}}>برج دهب · شارع الجيش · ناصية شارع أبوسنة</div>
          <div style={{fontFamily: AR, fontWeight: 600, fontSize: 30, color: '#5F5F66', whiteSpace: 'nowrap'}}>أعلى التوحيد والنور · الدور الأول</div>
        </div>
      </Slap>
      <Slap t={t} f={f} at={B.cta} x={540} y={1330} rot={0} seed={89}>
        <div style={{transform: `scale(${pulse})`, background: L.burgundy, color: '#fff', fontFamily: AR, fontWeight: 800, fontSize: 66, padding: '16px 70px', borderRadius: 999,
          boxShadow: '0 16px 30px rgba(92,14,29,0.35)', direction: 'rtl', whiteSpace: 'nowrap'}}>اتصل واحجز دلوقتي</div>
      </Slap>
      <Slap t={t} f={f} at={B.cta + 0.3} x={540} y={1470} rot={-1} seed={90}>
        <div style={{background: L.blue, color: '#fff', fontFamily: EN, fontWeight: 700, fontSize: 50, padding: '10px 36px', whiteSpace: 'nowrap', boxShadow: '0 10px 16px rgba(31,35,107,0.3)'}}>01096534354 · 01019289733</div>
      </Slap>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- captions (a typed paper strip)
type Page = {a: number; b: number; words: [number, number, string][]};
const PAGES: Page[] = (() => {
  const out: Page[] = [];
  for (const [la, lb] of TL.lines as [number, number][]) {
    const ws = WORDS.filter(([s]) => s >= la - 0.01 && s <= lb);
    const n = Math.ceil(ws.length / 5);
    for (let p = 0; p < n; p++) {
      const chunk = ws.slice(Math.round((p * ws.length) / n), Math.round(((p + 1) * ws.length) / n));
      out.push({a: chunk[0][0], b: chunk[chunk.length - 1][1], words: chunk});
    }
  }
  return out;
})();

const Captions: React.FC<{t: number}> = ({t}) => {
  const idx = PAGES.findIndex((p, i) => t >= p.a - 0.05 && t < (PAGES[i + 1] ? Math.min(PAGES[i + 1].a - 0.05, p.b + 0.6) : p.b + 0.6));
  if (idx < 0 || t > B.end - 0.1) return null;
  const p = PAGES[idx];
  const [jx, jy] = jit(t, 99, 1.2);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1700, display: 'flex', justifyContent: 'center', transform: `translate(${jx}px,${jy}px) rotate(-1deg)`}}>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2px 14px', direction: 'rtl', maxWidth: 960, padding: '14px 30px', background: '#fff',
        boxShadow: '0 10px 18px rgba(60,30,10,0.28)', clipPath: 'polygon(0 4%,100% 0,99% 100%,1% 96%)'}}>
        {p.words.map(([ws, we, w], i) => {
          const on = t >= ws && t < we + 0.05;
          const seen = t >= ws;
          return (
            <span key={i} style={{position: 'relative', fontFamily: AR, fontWeight: 800, fontSize: 56, lineHeight: 1.3, padding: '0 8px', display: 'inline-block',
              color: seen ? INK : 'rgba(26,26,26,0.32)'}}>
              {on && <span style={{position: 'absolute', left: 0, right: 0, top: '28%', height: '56%', background: L.orange, opacity: 0.85, transform: 'skewX(-8deg)', zIndex: 0}} />}
              <span style={{position: 'relative'}}>{w}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

export const SeeInside: React.FC = () => {
  useAsemaFonts();
  const f = useCurrentFrame();
  const t = f / SFPS;
  const scenes: React.FC<{t: number; f: number}>[] = [Hook, Iron, Sugar, Gland, Kinetic, Lab, Life, End];
  return (
    <AbsoluteFill style={{background: PAPER}}>
      {scenes.map((C, i) => {
        const at = S[i];
        const next = i + 1 < S.length ? S[i + 1] : TL.duration + 1;
        if (t < at - 0.2 || t > next + 0.35) return null;
        return <Torn key={i} t={t} at={at} first={i === 0}><C t={t} f={f} /></Torn>;
      })}
      <Captions t={t} />
    </AbsoluteFill>
  );
};
