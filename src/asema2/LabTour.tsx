import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {Grain} from '../components/primitives';
import {easeIn, easeInOut, easeOut, prog, sp} from '../lib';
import {AR, Bg, EN, Glow, HEAVY, L, MARK, POP, Ring, asset, useAsemaFonts} from '../asema/AsemaPromo';
import TL from './timeline.json';

const T = TL;
const WORDS = TL.words as unknown as [number, number, string][];

// Al Asema Lab, video 2: a 2D tour of the lab led by "نُقطة", a drop from the logo. 1080x1920.
export const TW = 1080;
export const TH = 1920;
export const TFPS = T.fps;
const W = TW;
const H = TH;
const STICK = {damping: 8, stiffness: 200, mass: 0.7};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// ---------------------------------------------------------------- the mascot
type Mood = 'worried' | 'happy' | 'wow';
type Pose = {x: number; y: number; s: number; mood: Mood; look: number; hop: number; walk: number; wave: number; squash: number; alpha: number};

/** Keyframes: [time, x, y (feet), scale]. Moves between keys ease in-out and hop. */
const KEYS = TL.mascot as unknown as [number, number, number, number][];

const MOODS: [number, Mood][] = [[0, 'worried'], [3.0, 'wow'], [6.9, 'happy'], [12.4, 'wow'], [13.3, 'happy'], [25.9, 'wow'], [27.0, 'happy']];

const poseAt = (t: number): Pose => {
  let i = 0;
  while (i < KEYS.length - 1 && t >= KEYS[i + 1][0]) i++;
  const a = KEYS[i];
  const b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  const span = Math.max(0.001, b[0] - a[0]);
  const u = b === a ? 1 : clamp01((t - a[0]) / span);
  const moving = a[1] !== b[1] || a[2] !== b[2];
  const k = moving ? easeInOut(u) : 0;
  const dist = Math.hypot(b[1] - a[1], b[2] - a[2]);
  const hops = moving ? Math.max(1, Math.round(dist / 260)) : 0;
  const hop = moving ? Math.abs(Math.sin(Math.PI * hops * u)) * Math.min(160, 60 + dist * 0.25) : 0;
  const mood = MOODS.filter(([mt]) => t >= mt).pop()?.[1] ?? 'happy';
  let look = moving ? Math.sign(b[1] - a[1]) * 0.8 : 0;
  if (t > T.s1.look && t < T.s1.look + 0.5) look = -1;
  if (t > T.s1.look + 0.5 && t < T.s2.enter) look = 1;
  if (t > T.s2.pin && t < T.s2.build + 0.5) look = 0.9;
  if (t > T.s6.enter + 0.2 && t < T.s6.all) look = 1;
  const idle = Math.sin(t * 5.2);
  const landSquash = moving ? 0 : 0.03 * idle;
  const wave = (t > T.s3.welcome && t < T.s3.welcome + 1.2) || (t > T.s6.all && t < T.s6.all + 1.2) ? Math.sin((t - T.s3.welcome) * 14) : 0;
  const burst = prog(t, T.s9.burst, T.s9.burst + 0.25, easeIn);
  return {
    x: lerp(a[1], b[1], k), y: lerp(a[2], b[2], k) - hop, s: lerp(a[3], b[3], k) * (1 + 0.25 * burst),
    mood, look, hop, walk: moving ? t * 9 : 0, wave, squash: landSquash, alpha: 1 - burst,
  };
};

const Drop: React.FC<{p: Pose; t: number}> = ({p, t}) => {
  if (p.alpha <= 0) return null;
  const blink = (t % 2.9) > 2.78 ? 0.15 : 1;
  const lx = p.look * 7;
  const feet = Math.sin(p.walk) * 10;
  const mouth = {
    happy: 'M-22,48 Q0,70 22,48',
    wow: 'M-10,52 a10,12 0 1,0 20,0 a10,12 0 1,0 -20,0',
    worried: 'M-18,60 Q-9,50 0,58 Q9,66 18,56',
  }[p.mood];
  const shadow = Math.max(0.35, 1 - p.hop / 220);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: p.alpha}}>
      <defs>
        <radialGradient id="dropg" cx="35%" cy="35%" r="75%">
          <stop offset="0" stopColor="#FF6A6E" /><stop offset="0.55" stopColor={L.red} /><stop offset="1" stopColor="#A3141F" />
        </radialGradient>
      </defs>
      <ellipse cx={p.x} cy={p.y + p.hop + 4} rx={70 * p.s * shadow} ry={12 * p.s * shadow} fill="#000" opacity={0.12 * shadow} />
      <g transform={`translate(${p.x},${p.y}) scale(${p.s * (1 + p.squash)},${p.s * (1 - p.squash)}) translate(0,-118)`}>
        <ellipse cx={-26} cy={112 + Math.max(0, feet)} rx={20} ry={11} fill={L.burgundy} />
        <ellipse cx={26} cy={112 + Math.max(0, -feet)} rx={20} ry={11} fill={L.burgundy} />
        <path d={`M-74,10 q-30,${-10 - p.wave * 26} -40,${-34 - p.wave * 30}`} stroke={L.burgundy} strokeWidth={12} strokeLinecap="round" fill="none" />
        <path d="M74,10 q30,-6 38,-30" stroke={L.burgundy} strokeWidth={12} strokeLinecap="round" fill="none" />
        <path d="M0,-118 C30,-70 80,-20 80,28 A80,80 0 0 1 -80,28 C-80,-20 -30,-70 0,-118 Z" fill="url(#dropg)" />
        <ellipse cx={-36} cy={-12} rx={13} ry={26} fill="#fff" opacity={0.55} transform="rotate(-28 -36 -12)" />
        <ellipse cx={-25} cy={18} rx={15} ry={19 * blink} fill="#fff" />
        <ellipse cx={25} cy={18} rx={15} ry={19 * blink} fill="#fff" />
        {blink > 0.5 && <><circle cx={-25 + lx} cy={21} r={8} fill={L.navy} /><circle cx={25 + lx} cy={21} r={8} fill={L.navy} />
          <circle cx={-22 + lx} cy={17} r={2.6} fill="#fff" /><circle cx={28 + lx} cy={17} r={2.6} fill="#fff" /></>}
        {p.mood === 'worried' && <><path d="M-38,-8 L-14,-2" stroke={L.navy} strokeWidth={5} strokeLinecap="round" /><path d="M38,-8 L14,-2" stroke={L.navy} strokeWidth={5} strokeLinecap="round" /></>}
        <circle cx={-48} cy={44} r={11} fill={L.orange} opacity={0.55} />
        <circle cx={48} cy={44} r={11} fill={L.orange} opacity={0.55} />
        <path d={mouth} stroke={L.navy} strokeWidth={6} strokeLinecap="round" fill={p.mood === 'wow' ? L.navy : 'none'} />
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------- shared bits
const Pop: React.FC<{k: number; x: number; y: number; children: React.ReactNode; rot?: number; origin?: string}> = ({k, x, y, children, rot = 0, origin = 'center'}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${k}) rotate(${rot}deg)`, transformOrigin: origin, opacity: Math.min(1, k * 1.6)}}>{children}</div>
);

const Pill: React.FC<{text: string; bg: string; fg: string; size: number; latin?: boolean}> = ({text, bg, fg, size, latin}) => (
  <div style={{background: bg, color: fg, fontFamily: latin ? EN : AR, fontWeight: 800, fontSize: size, padding: `${size * 0.18}px ${size * 0.7}px`,
    borderRadius: 999, whiteSpace: 'nowrap', direction: 'rtl', boxShadow: '0 12px 26px rgba(0,0,0,0.16)'}}>{text}</div>
);

const Sparkle: React.FC<{x: number; y: number; k: number; r?: number; color?: string}> = ({x, y, k, r = 34, color = L.orange}) => {
  const s = Math.sin(Math.PI * clamp01(k)) * r;
  if (s <= 0.5) return null;
  return <path d={`M${x},${y - s} Q${x},${y} ${x + s},${y} Q${x},${y} ${x},${y + s} Q${x},${y} ${x - s},${y} Q${x},${y} ${x},${y - s} Z`} fill={color} />;
};

const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>{children}</svg>
);

/** Scene layer revealed by a circle opening from the mascot, pushed slightly as it leaves. */
const Scene: React.FC<{t: number; enter: number; next: number; children: React.ReactNode; first?: boolean}> = ({t, enter, next, children, first}) => {
  if (t < enter - 0.02 || t > next + 0.5) return null;
  const p = poseAt(enter);
  const k = first ? 1 : prog(t, enter, enter + 0.45, easeInOut);
  const push = 1 + 0.05 * prog(t, next, next + 0.45, easeIn);
  const drift = 1 + 0.035 * clamp01((t - enter) / Math.max(1, next - enter));
  return (
    <AbsoluteFill style={{clipPath: k >= 1 ? undefined : `circle(${k * 2300}px at ${p.x}px ${p.y - 100 * p.s}px)`}}>
      <AbsoluteFill style={{transform: `scale(${push * drift})`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1. lost
const S1: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = T.s1;
  const signs: [string, number, number][] = [['يمين؟', 1, 330], ['شمال؟', -1, 450], ['قدّام؟', 1, 570]];
  return (
    <AbsoluteFill>
      <Bg kind="light" t={t} />
      <Glow x={540} y={900} r={620} color="#F4B9C2" op={0.5} />
      <Svg>
        <rect x={528} y={260} width={24} height={500} rx={12} fill={L.navy} opacity={sp(f, s.signs[0] - 0.2, HEAVY, TFPS)} />
      </Svg>
      {signs.map(([txt, dir, y], i) => {
        const k = sp(f, s.signs[i], POP, TFPS);
        const swing = Math.sin(t * 3 + i) * 3;
        return (
          <div key={txt} style={{position: 'absolute', top: y, left: dir > 0 ? 552 : undefined, right: dir < 0 ? 552 : undefined,
            transform: `scaleX(${k}) rotate(${swing}deg)`, transformOrigin: dir > 0 ? '0% 50%' : '100% 50%'}}>
            <div style={{background: [L.red, L.blue, L.orange][i], color: i === 2 ? L.ink : L.white, fontFamily: AR, fontWeight: 800, fontSize: 64,
              padding: dir > 0 ? '6px 90px 6px 40px' : '6px 40px 6px 90px', direction: 'rtl', whiteSpace: 'nowrap',
              clipPath: dir > 0 ? 'polygon(0 0, 82% 0, 100% 50%, 82% 100%, 0 100%)' : 'polygon(18% 0, 100% 0, 100% 100%, 18% 100%, 0 50%)'}}>{txt}</div>
          </div>
        );
      })}
      {[0, 1, 2].map((i) => {
        const k = sp(f, s.q + i * 0.12, POP, TFPS);
        const a = t * 1.6 + (i * Math.PI * 2) / 3;
        return (
          <div key={i} style={{position: 'absolute', left: 540 + Math.cos(a) * 230 - 40, top: 790 + Math.sin(a) * 50 - 60, fontFamily: AR, fontWeight: 800, fontSize: 110,
            color: [L.blue, L.orange, L.red][i], transform: `scale(${k}) rotate(${Math.sin(a) * 15}deg)`, opacity: Math.min(1, k * 1.5)}}>؟</div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 2. the map, then the building
const Building: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = T.s2;
  const k = prog(t, s.build, s.build + 0.8, easeOut);
  const signK = sp(f, s.sign, POP, TFPS);
  const y0 = 560 + (1 - k) * 900;
  return (
    <>
      <Ring cx={540} cy={560} r={330} sw={48} k={prog(t, s.build + 0.2, s.build + 1.1, easeInOut)} />
      <Svg>
        <g transform={`translate(0,${y0 - 560})`}>
          <rect x={170} y={600} width={740} height={700} rx={18} fill={L.white} stroke="#E3E3EA" strokeWidth={4} />
          <rect x={170} y={600} width={740} height={120} rx={18} fill={L.burgundy} />
          <rect x={170} y={700} width={740} height={14} fill={L.orange} />
          {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => (c === 1 || c === 2) && r === 2 ? null : (
            <g key={`${r}${c}`}><rect x={220 + c * 170} y={760 + r * 150} width={120} height={100} rx={10} fill="#DCE3F5" />
              <rect x={226 + c * 170} y={766 + r * 150} width={34} height={88} rx={6} fill="#fff" opacity={0.5} /></g>
          )))}
          <rect x={410} y={1060} width={260} height={240} rx={12} fill={L.blue} />
          <rect x={426} y={1076} width={110} height={224} rx={6} fill="#9FB3EA" />
          <rect x={544} y={1076} width={110} height={224} rx={6} fill="#9FB3EA" />
          <rect x={130} y={1290} width={820} height={18} rx={9} fill="#C9C9D6" />
        </g>
      </Svg>
      <div style={{position: 'absolute', left: 300, top: y0 + 18, width: 480, height: 100, background: L.white, borderRadius: 18, display: 'flex',
        alignItems: 'center', justifyContent: 'center', transform: `scale(${signK})`, boxShadow: '0 10px 24px rgba(0,0,0,0.18)'}}>
        <Img src={asset('logo-horizontal-color.svg')} style={{width: 420}} />
      </div>
    </>
  );
};

const S2: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = T.s2;
  const mapOut = prog(t, s.build - 0.1, s.build + 0.4, easeIn);
  const pin = sp(f, s.pin, {damping: 11, stiffness: 180, mass: 0.8}, TFPS);
  const chip = sp(f, s.chip, POP, TFPS);
  return (
    <AbsoluteFill>
      <Bg kind="sky" t={t} seed={1} />
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${mapOut * 1200}px) rotate(${mapOut * 6}deg)`, opacity: 1 - mapOut}}>
        <Svg>
          <rect x={110} y={330} width={860} height={860} rx={40} fill={L.white} stroke="#E3E3EA" strokeWidth={4} />
          <path d="M110,980 C320,900 420,1010 560,860 C700,720 820,760 970,640" stroke="#BFD0F0" strokeWidth={70} fill="none" />
          {[[110, 520, 970, 560], [110, 760, 970, 700], [300, 330, 360, 1190], [700, 330, 640, 1190], [110, 1100, 970, 1060]].map(([a, b, c, d], i) => (
            <line key={i} x1={a} y1={b} x2={c} y2={d} stroke="#E6E6EC" strokeWidth={26} strokeLinecap="round" />
          ))}
          {[[400, 400], [760, 420], [420, 600], [780, 860], [180, 860], [430, 1140]].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width={120} height={80} rx={12} fill={i % 2 ? '#F2E4E8' : '#E6ECF8'} />
          ))}
          <circle cx={560} cy={660} r={70 + 30 * Math.sin(t * 4) * pin} fill={L.red} opacity={0.12 * pin} />
          <g transform={`translate(560,${660 - (1 - pin) * 600})`}>
            <path d="M0,0 C-30,-40 -56,-66 -56,-104 A56,56 0 1 1 56,-104 C56,-66 30,-40 0,0 Z" fill={L.red} />
            <circle cx={0} cy={-106} r={22} fill={L.white} />
          </g>
        </Svg>
        <Pop k={chip} x={560} y={500}><Pill text="ميت غمر" bg={L.blue} fg={L.white} size={64} /></Pop>
      </div>
      {t > s.build - 0.05 && <Building t={t} f={f} />}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 3. doors open on a clean reception
const S3: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = T.s3;
  const door = prog(t, s.door, s.door + 0.7, easeInOut);
  return (
    <AbsoluteFill>
      <Bg kind="light" t={t} seed={2} />
      <Svg>
        <rect x={0} y={1300} width={W} height={H - 1300} fill="#F3F0F2" />
        <rect x={0} y={1296} width={W} height={8} fill="#E3DDE1" />
        <rect x={0} y={1330} width={W} height={60} fill="#fff" opacity={0.6} />
        <rect x={640} y={420} width={300} height={220} rx={16} fill={L.white} stroke="#E3E3EA" strokeWidth={4} />
        <circle cx={790} cy={530} r={70} fill="none" stroke={L.burgundy} strokeWidth={16} />
        <circle cx={790} cy={530} r={56} fill="none" stroke={L.orange} strokeWidth={9} />
        <rect x={500} y={1010} width={520} height={290} rx={26} fill={L.blue} />
        <rect x={500} y={1010} width={520} height={34} rx={17} fill={L.blueHi} />
        <rect x={500} y={1110} width={520} height={14} fill={L.orange} />
        <g transform="translate(10,1060)">
          <rect x={0} y={150} width={90} height={90} rx={14} fill={L.burgundy} />
          <path d="M45,150 C10,90 20,30 45,0 C70,30 80,90 45,150" fill="#4C9A6A" />
          <path d="M45,150 C0,120 -10,80 0,50 C30,70 45,100 45,150" fill="#3E8558" />
        </g>
        {[[130, 1200], [230, 1200]].map(([x, y], i) => (
          <g key={i}><rect x={x} y={y} width={90} height={70} rx={14} fill={L.burgundy} /><rect x={x} y={y - 70} width={90} height={80} rx={14} fill="#B3263F" /></g>
        ))}
      </Svg>
      <Svg>
        {s.shine.map((st, i) => <Sparkle key={i} x={[300, 640, 900][i]} y={[1350, 1380, 1340][i]} k={prog(t, st, st + 0.6, easeOut)} r={44} color={i === 1 ? L.orange : '#FFD27A'} />)}
        <rect x={0} y={1370} width={W * clamp01((t - s.shine[0]) / 0.8)} height={8} fill="#fff" opacity={0.8} />
      </Svg>
      <Pop k={sp(f, s.shine[1], POP, TFPS)} x={760} y={900}><Pill text="نضيف ومريح" bg={L.orange} fg={L.ink} size={60} /></Pop>
      {door < 1 && (
        <Svg>
          <rect x={-door * 560} y={0} width={W / 2} height={H} fill={L.blue} />
          <rect x={W / 2 + door * 560} y={0} width={W / 2} height={H} fill={L.blue} />
          <rect x={W / 2 - 40 - door * 560} y={880} width={16} height={180} rx={8} fill={L.white} />
          <rect x={W / 2 + 24 + door * 560} y={880} width={16} height={180} rx={8} fill={L.white} />
        </Svg>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 4. the automated analyzer
const S4: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = T.s4;
  const mk = sp(f, s.machine, HEAVY, TFPS);
  const scan = prog(t, s.scan, s.scan + 0.8, easeInOut);
  const check = sp(f, s.check, STICK, TFPS);
  const belt = (t * 160) % 120;
  const bars = [0.55, 0.8, 0.4, 0.95, 0.7];
  return (
    <AbsoluteFill>
      <Bg kind="blue" t={t} />
      <Glow x={540} y={820} r={600} color={L.blueHi} op={0.6} />
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${(1 - mk) * 500}px)`, opacity: Math.min(1, mk * 1.5)}}>
        <Svg>
          <rect x={110} y={460} width={860} height={560} rx={40} fill={L.white} />
          <rect x={110} y={460} width={860} height={90} rx={40} fill="#E6ECF8" />
          <rect x={560} y={590} width={360} height={260} rx={22} fill={L.navy} />
          {bars.map((v, i) => {
            const k = prog(t, s.screen + i * 0.1, s.screen + i * 0.1 + 0.6, easeOut) * (0.8 + 0.2 * Math.sin(t * 3 + i));
            return <rect key={i} x={600 + i * 62} y={820 - 190 * v * k} width={40} height={190 * v * k} rx={8} fill={[L.orange, L.red, L.white, L.orange, L.red][i]} />;
          })}
          {[0, 1, 2].map((i) => <circle key={i} cx={190 + i * 60} cy={620} r={18} fill={[L.red, L.orange, '#4C9A6A'][i]} opacity={0.6 + 0.4 * Math.sin(t * 6 + i * 2)} />)}
          <rect x={160} y={700} width={340} height={26} rx={13} fill="#E6E6EC" />
          <rect x={160} y={760} width={260} height={26} rx={13} fill="#E6E6EC" />
          <rect x={30} y={1060} width={1020} height={70} rx={35} fill={L.ink} />
          {Array.from({length: 10}, (_, i) => <line key={i} x1={60 + i * 120 + belt} y1={1070} x2={30 + i * 120 + belt} y2={1120} stroke="#444" strokeWidth={10} />)}
          {Array.from({length: 9}, (_, i) => <circle key={i} cx={70 + i * 118} cy={1095} r={20} fill="#2E2E33" stroke="#555" strokeWidth={4} />)}
          {[0, 1, 2, 3].map((i) => {
            const x = ((i * 300 + t * 160) % 1300) - 100;
            if (x > 520 && x < 760) return null;
            return <g key={i}><rect x={x} y={930} width={44} height={130} rx={18} fill="#F6EEF1" stroke="#C9C9D6" strokeWidth={3} />
              <rect x={x} y={920} width={44} height={34} rx={8} fill={[L.red, L.blue, L.orange, L.burgundy][i]} /></g>;
          })}
          <rect x={590} y={840} width={140} height={60} rx={12} fill={L.blue} />
          <rect x={606} y={1060} width={108} height={8} rx={4} fill={L.red} opacity={0} />
          {scan > 0 && scan < 1 && <rect x={600} y={900 + scan * 160} width={120} height={8} rx={4} fill={L.red} opacity={0.9} />}
          {scan > 0 && scan < 1 && <rect x={600} y={900} width={120} height={scan * 160} fill={L.red} opacity={0.12} />}
        </Svg>
        <Pop k={check} x={740} y={720}>
          <div style={{width: 170, height: 170, borderRadius: '50%', background: '#4C9A6A', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 30px rgba(0,0,0,0.3)'}}>
            <svg width={100} height={100}><path d="M18,52 L42,76 L84,26" stroke="#fff" strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </Pop>
      </div>
      <Pop k={sp(f, s.machine + 0.2, POP, TFPS)} x={540} y={330}><Pill text="نظام آلي متكامل" bg={L.orange} fg={L.ink} size={72} /></Pop>
      <Pop k={sp(f, s.scan, POP, TFPS)} x={300} y={1240}><Pill text="بدقة" bg={L.white} fg={L.blue} size={56} /></Pop>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5. sterile, single use, clean
const Pouch: React.FC<{k: number; x: number; y: number; kind: number}> = ({k, x, y, kind}) => (
  <div style={{position: 'absolute', left: x - 110, top: y - 170, width: 220, height: 340, transform: `translateY(${(1 - k) * -900}px) rotate(${(1 - k) * 25 + (kind - 1) * 6}deg)`}}>
    <svg width={220} height={340}>
      <rect x={4} y={4} width={212} height={332} rx={22} fill="#EEF3FB" stroke="#BFD0F0" strokeWidth={4} />
      <path d={`M4,40 ${Array.from({length: 11}, (_, i) => `L${4 + (i + 0.5) * 19.3},${i % 2 ? 40 : 30}`).join(' ')} L216,40`} stroke="#BFD0F0" strokeWidth={3} fill="none" />
      {kind === 0 && <g transform="translate(110,190) rotate(-30)"><rect x={-18} y={-110} width={36} height={170} rx={8} fill="#fff" stroke={L.blue} strokeWidth={5} />
        <rect x={-18} y={-50} width={36} height={110} rx={6} fill={L.red} opacity={0.35} /><rect x={-4} y={60} width={8} height={60} fill="#9A9AA1" /><rect x={-30} y={-122} width={60} height={14} rx={6} fill={L.blue} /></g>}
      {kind === 1 && <g transform="translate(110,190)"><rect x={-26} y={-100} width={52} height={190} rx={22} fill="#fff" stroke="#C9C9D6" strokeWidth={4} />
        <rect x={-26} y={-110} width={52} height={46} rx={10} fill={L.orange} /></g>}
      {kind === 2 && <g transform="translate(110,190)"><path d="M-55,90 L-55,-30 Q-55,-60 -35,-60 L-35,-100 Q-25,-115 -15,-100 L-15,-70 L-5,-110 Q5,-122 15,-108 L10,-60 L25,-95 Q35,-108 45,-92 L35,-40 Q60,-30 55,10 L45,90 Z" fill="#9FB3EA" /></g>}
    </svg>
  </div>
);

const S5: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = T.s5;
  const stamp = sp(f, s.stamp, {damping: 12, stiffness: 260, mass: 0.6}, TFPS);
  const wipe = prog(t, s.wipe, s.wipe + 0.7, easeInOut);
  return (
    <AbsoluteFill>
      <Bg kind="sky" t={t} seed={2} />
      <Glow x={540} y={780} r={560} color="#FFFFFF" op={0.9} />
      {s.packs.map((st, i) => <Pouch key={i} k={sp(f, st, HEAVY, TFPS)} x={[790, 540, 290][i]} y={760} kind={i} />)}
      <Pop k={sp(f, s.packs[0] + 0.3, POP, TFPS)} x={540} y={420}><Pill text="أدوات معقّمة" bg={L.blue} fg={L.white} size={70} /></Pop>
      <div style={{position: 'absolute', left: 300, top: 900, width: 480, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `scale(${2.2 - 1.2 * stamp}) rotate(-10deg)`, opacity: stamp > 0.02 ? Math.min(1, stamp * 2) : 0}}>
        <div style={{border: `12px solid ${L.burgundy}`, borderRadius: 30, padding: '8px 36px', color: L.burgundy, fontFamily: AR, fontWeight: 800, fontSize: 84,
          background: 'rgba(255,255,255,0.85)', direction: 'rtl', whiteSpace: 'nowrap'}}>مرة واحدة بس</div>
      </div>
      {wipe > 0 && wipe < 1 && (
        <Svg>
          <defs><linearGradient id="wg" x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity={0} /><stop offset="1" stopColor="#fff" stopOpacity={0.85} /></linearGradient></defs>
          <rect x={W - wipe * (W + 300)} y={300} width={300} height={1000} fill="url(#wg)" />
          <rect x={W - wipe * (W + 300) + 290} y={280} width={26} height={1040} rx={13} fill={L.orange} />
        </Svg>
      )}
      <Svg>{s.sparkle.map((st, i) => <Sparkle key={i} x={[820, 520, 260][i]} y={[560, 1040, 640][i]} k={prog(t, st, st + 0.6, easeOut)} r={50} color={i === 1 ? L.orange : '#FFD27A'} />)}</Svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 6. every test in one rack
const TESTS: [string, string][] = [['صورة دم', L.red], ['سكر', L.orange], ['كبد وكلى', L.burgundy], ['غدة', L.blue], ['فيتامينات', L.orange], ['هرمونات', L.red]];

const S6: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = T.s6;
  const all = sp(f, s.all, STICK, TFPS);
  return (
    <AbsoluteFill>
      <Bg kind="lav" t={t} />
      <Glow x={540} y={900} r={600} color="#C9BFEA" op={0.5} />
      <Ring cx={540} cy={1010} r={420} sw={44} k={prog(t, s.all, s.all + 0.9, easeInOut)} />
      <Svg>
        <rect x={210} y={1000} width={780} height={60} rx={20} fill={L.burgundy} />
        <rect x={210} y={1150} width={780} height={60} rx={20} fill={L.burgundy} />
        <rect x={230} y={1000} width={24} height={300} rx={8} fill={L.wine} />
        <rect x={946} y={1000} width={24} height={300} rx={8} fill={L.wine} />
        {TESTS.map(([, col], i) => {
          const k = sp(f, s.tubes[i], {damping: 13, stiffness: 210, mass: 0.8}, TFPS);
          const x = 890 - i * 124;
          return (
            <g key={i} transform={`translate(${x},${880 - (1 - k) * 900})`} opacity={k > 0.01 ? 1 : 0}>
              <rect x={-30} y={0} width={60} height={290} rx={30} fill="#FFFFFF" stroke="#C9C9D6" strokeWidth={4} />
              <rect x={-30} y={120} width={60} height={170} rx={30} fill={col} opacity={0.75} />
              <rect x={-36} y={-20} width={72} height={52} rx={12} fill={col} />
              <rect x={-22} y={160} width={18} height={90} rx={9} fill="#fff" opacity={0.45} />
            </g>
          );
        })}
      </Svg>
      {TESTS.map(([name, col], i) => {
        const k = sp(f, s.tubes[i] + 0.05, POP, TFPS);
        const row = i < 3 ? 0 : 1;
        const x = [[820, 590, 360], [870, 640, 300]][row][i % 3];
        return <Pop key={name} k={k} x={x} y={360 + row * 130}><Pill text={name} bg={col} fg={col === L.orange ? L.ink : L.white} size={56} /></Pop>;
      })}
      <Pop k={all} x={540} y={680} rot={-3}><Pill text="كل تحاليلك في مكان واحد" bg={L.white} fg={L.blue} size={58} /></Pop>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 7. competitive prices, discounts
const S7: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = T.s7;
  const tagIn = sp(f, s.tag, {damping: 6, stiffness: 120, mass: 1}, TFPS);
  const swing = (1 - tagIn) * 40 + Math.sin(t * 2.4) * 2;
  const snip = prog(t, s.snip - 0.25, s.snip, easeIn);
  const fall = prog(t, s.snip, s.snip + 0.9, easeIn);
  const badge = sp(f, s.badge, STICK, TFPS);
  const conf = prog(t, s.badge, s.badge + 1.2, easeOut);
  return (
    <AbsoluteFill>
      <Bg kind="wine" t={t} />
      <Glow x={540} y={820} r={600} color={L.orange} op={0.25} />
      <div style={{position: 'absolute', left: 290, top: 330, width: 500, height: 640, transformOrigin: '250px 0px', transform: `rotate(${swing}deg) translateY(${(1 - tagIn) * -700}px)`}}>
        <svg width={500} height={640} style={{overflow: 'visible'}}>
          <line x1={250} y1={-400} x2={250} y2={70} stroke={L.orange} strokeWidth={6} />
          <g clipPath="url(#topcut)">
            <path d="M120,60 L380,60 L440,140 L440,600 Q440,620 420,620 L80,620 Q60,620 60,600 L60,140 Z" fill={L.white} />
          </g>
          <circle cx={250} cy={110} r={22} fill={L.burgundy} />
          <text x={250} y={300} textAnchor="middle" fontFamily="Cairo" fontWeight={800} fontSize={74} fill={L.blue} direction="rtl">أسعار</text>
          <text x={250} y={400} textAnchor="middle" fontFamily="Cairo" fontWeight={800} fontSize={74} fill={L.red} direction="rtl">تنافسية</text>
          <g transform={`translate(${fall * -40},${fall * 900}) rotate(${fall * -35} 250 560)`}>
            <path d="M60,470 L440,520 L440,600 Q440,620 420,620 L80,620 Q60,620 60,600 Z" fill="#F2E4E8" />
          </g>
          <path d="M60,470 L440,520" stroke={L.burgundy} strokeWidth={4} strokeDasharray="14 10" opacity={snip > 0 && fall < 0.1 ? 1 : 0} />
        </svg>
      </div>
      {t > s.snip - 0.6 && t < s.snip + 0.5 && (
        <div style={{position: 'absolute', left: 120 + snip * 560, top: 740 + snip * 70, transform: 'rotate(8deg)'}}>
          <svg width={220} height={160}>
            <g transform={`rotate(${-18 + 18 * Math.abs(Math.sin(t * 22))} 80 80)`}><path d="M80,80 L210,62 L210,74 Z" fill="#C9C9D6" /><circle cx={40} cy={50} r={30} fill="none" stroke={L.orange} strokeWidth={14} /></g>
            <g transform={`rotate(${18 - 18 * Math.abs(Math.sin(t * 22))} 80 80)`}><path d="M80,80 L210,98 L210,86 Z" fill="#9A9AA1" /><circle cx={40} cy={110} r={30} fill="none" stroke={L.orange} strokeWidth={14} /></g>
          </svg>
        </div>
      )}
      <Svg>
        {Array.from({length: 26}, (_, i) => {
          const a = (i / 26) * Math.PI * 2;
          const r = 80 + 520 * conf;
          const x = 560 + Math.cos(a) * r;
          const y = 1080 + Math.sin(a) * r * 0.8 + conf * conf * 300;
          return conf > 0 && conf < 1 ? <rect key={i} x={x} y={y} width={22} height={12} rx={4} fill={[L.orange, L.white, L.red, '#FFD27A'][i % 4]} transform={`rotate(${i * 40 + conf * 400} ${x} ${y})`} opacity={1 - conf} /> : null;
        })}
      </Svg>
      <div style={{position: 'absolute', left: 560 - 230, top: 1080 - 230, width: 460, height: 460, transform: `scale(${badge}) rotate(${-12 + (1 - badge) * 40}deg)`, opacity: badge > 0.02 ? 1 : 0}}>
        <svg width={460} height={460} style={{position: 'absolute'}}>
          <path d={Array.from({length: 32}, (_, i) => { const a = (i / 32) * Math.PI * 2; const r = i % 2 ? 190 : 228; return `${i ? 'L' : 'M'}${230 + Math.cos(a) * r},${230 + Math.sin(a) * r}`; }).join(' ') + 'Z'} fill={L.orange} />
        </svg>
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: AR, fontWeight: 800, color: L.ink, direction: 'rtl', lineHeight: 1.05}}>
          <span style={{fontSize: 96}}>خصومات</span><span style={{fontSize: 50, color: L.burgundy}}>على الباقات</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 8. accuracy, speed, quality
const Icon: React.FC<{i: number}> = ({i}) => (
  <svg width={150} height={150} viewBox="0 0 150 150">
    {i === 0 && <><circle cx={75} cy={75} r={60} fill="none" stroke={L.red} strokeWidth={12} /><circle cx={75} cy={75} r={34} fill="none" stroke={L.red} strokeWidth={12} /><circle cx={75} cy={75} r={11} fill={L.red} /></>}
    {i === 1 && <path d="M88,10 L36,84 L70,84 L60,140 L114,62 L80,62 Z" fill={L.orange} />}
    {i === 2 && <path d="M75,12 L92,52 L136,56 L102,84 L113,128 L75,104 L37,128 L48,84 L14,56 L58,52 Z" fill={L.blue} />}
  </svg>
);

const S8: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = T.s8;
  const words = ['دقة', 'سرعة', 'جودة'];
  return (
    <AbsoluteFill>
      <Bg kind="light" t={t} />
      <Glow x={540} y={800} r={600} color="#F4B9C2" op={0.5} />
      {words.map((w, i) => {
        const k = sp(f, s.w[i] - 0.06, POP, TFPS);
        const x = [820, 540, 260][i];
        const glow = Math.exp(-Math.max(0, t - s.w[i]) * 2);
        return (
          <Pop key={w} k={k} x={x} y={700}>
            <div style={{width: 250, height: 330, borderRadius: 40, background: L.white, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 10, boxShadow: `0 20px 40px rgba(92,14,29,${0.15 + 0.2 * glow})`, border: `6px solid ${[L.red, L.orange, L.blue][i]}`}}>
              <Icon i={i} />
              <span style={{fontFamily: AR, fontWeight: 800, fontSize: 70, color: [L.red, L.orange, L.blue][i]}}>{w}</span>
            </div>
          </Pop>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 9. the drop becomes the logo
const S9: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = T.s9;
  const stripe = prog(t, s.stripe, s.stripe + 0.5, easeOut);
  const arm = prog(t, s.arm, s.arm + 0.6, easeInOut);
  const tube = sp(f, s.tube, HEAVY, TFPS);
  const sc = 560 / 524;
  const ox = 540 - 262 * sc;
  const oy = 230;
  const fly = prog(t, s.burst, s.burst + 0.55, easeInOut);
  const tagline = sp(f, s.tagline, POP, TFPS);
  const cta = sp(f, s.cta, POP, TFPS);
  const contact = prog(t, s.contact, s.contact + 0.5, easeOut);
  const ring = Math.sin(t * 30) * 8 * Math.max(0, Math.sin((t - s.cta) * 2.2));
  const p0 = poseAt(s.burst);
  return (
    <AbsoluteFill>
      <Bg kind="light" t={t} />
      <Ring cx={-60} cy={-40} r={330} sw={54} k={prog(t, s.enter + 0.1, s.enter + 1.1, easeInOut)} />
      <Ring cx={1140} cy={1980} r={330} sw={54} k={prog(t, s.enter + 0.2, s.enter + 1.2, easeInOut)} />
      <Svg>
        <defs><clipPath id="armclip2"><rect x={-2} y={-20} width={530 * arm} height={560} /></clipPath></defs>
        <g transform={`translate(${ox},${oy}) scale(${sc}) translate(2,14)`}>
          <path d={MARK.stripe} fill={L.red} style={{transform: `scaleX(${stripe})`, transformOrigin: '18px 480px'}} />
          <path d={MARK.arm} fill={L.blue} clipPath="url(#armclip2)" />
          <g transform={`translate(0,${(1 - tube) * -320})`} opacity={Math.min(1, tube * 2)}>
            <g transform="translate(229,174) rotate(15)" fill={L.blue}>
              <rect x={-46} y={-180} width={92} height={24} rx={9} /><rect x={-25} y={-160} width={50} height={40} rx={4} />
              <rect x={-36} y={-124} width={72} height={196} rx={8} /><path d="M-30,68 L30,68 L22,108 Q0,118 -22,108 Z" />
              <path fillRule="evenodd" d="M58,-20 m-52,0 a52,52 0 1,0 104,0 a52,52 0 1,0 -104,0 Z M58,-20 m-28,0 a28,28 0 1,1 56,0 a28,28 0 1,1 -56,0 Z" />
            </g>
          </g>
        </g>
        {MARK.bubbles.map(([bx, by, r], i) => {
          const tx = ox + (bx + 2) * sc, ty = oy + (by + 14) * sc;
          const sx = p0.x + Math.cos(i * 1.1) * 30, sy = p0.y - 120 * p0.s + Math.sin(i * 1.7) * 30;
          const u = clamp01((fly - i * 0.04) / 0.8);
          const k = easeOut(u);
          const arc = Math.sin(Math.PI * k) * -160;
          return fly > 0 ? <circle key={i} cx={lerp(sx, tx, k)} cy={lerp(sy, ty, k) + arc} r={r * sc * (0.6 + 0.4 * k)} fill={L.red} /> : null;
        })}
      </Svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 840, textAlign: 'center', fontFamily: AR, fontWeight: 800, fontSize: 128, color: L.red, direction: 'rtl',
        opacity: prog(t, s.name, s.name + 0.4, easeOut), transform: `translateY(${(1 - prog(t, s.name, s.name + 0.5, easeOut)) * 40}px)`}}>معمل العاصمة</div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1052, textAlign: 'center', fontFamily: EN, fontWeight: 700, fontSize: 34, letterSpacing: '0.32em',
        opacity: prog(t, s.name + 0.3, s.name + 0.8, easeOut)}}><span style={{color: L.red}}>A</span><span style={{color: L.blue}}>L ASEMA LAB</span></div>
      <Pop k={tagline} x={540} y={1170}><Pill text="صحتك أمانة عندنا" bg={L.blue} fg={L.white} size={62} /></Pop>
      <Pop k={cta} x={540} y={1300}>
        <div style={{display: 'flex', alignItems: 'center', gap: 24, background: L.burgundy, borderRadius: 999, padding: '16px 56px', direction: 'rtl', boxShadow: '0 16px 34px rgba(92,14,29,0.3)'}}>
          <span style={{fontFamily: AR, fontWeight: 800, fontSize: 64, color: L.white, whiteSpace: 'nowrap'}}>اتصل واحجز دلوقتي</span>
          <svg width={70} height={70} viewBox="0 0 70 70" style={{transform: `rotate(${ring}deg)`}}>
            <path d="M18,8 L28,8 L32,24 L24,30 Q30,42 40,46 L46,38 L62,42 L62,52 Q62,62 52,62 Q14,58 8,18 Q8,8 18,8 Z" fill={L.orange} />
          </svg>
        </div>
      </Pop>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1380, textAlign: 'center', opacity: contact, transform: `translateY(${(1 - contact) * 20}px)`}}>
        <div style={{fontFamily: EN, fontWeight: 700, fontSize: 52, color: L.blue}}>01096534354 · 01019289733</div>
        <div style={{fontFamily: AR, fontWeight: 600, fontSize: 32, color: L.gray, direction: 'rtl', marginTop: 8}}>ميت غمر · برج دهب · شارع الجيش · ناصية شارع أبوسنة</div>
        <div style={{fontFamily: AR, fontWeight: 600, fontSize: 32, color: L.gray, direction: 'rtl'}}>أعلى التوحيد والنور · الدور الأول</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- captions and logo tab
const Captions: React.FC<{t: number}> = ({t}) => {
  const line = T.lines.find(([a, b]) => t >= a - 0.08 && t <= b + 0.35);
  if (!line || t > T.s9.contact - 0.1) return null;
  const [a, b] = line;
  const words = WORDS.filter(([ws]) => ws >= a - 0.01 && ws <= b);
  const k = prog(t, a - 0.08, a + 0.12, easeOut) * (1 - prog(t, b + 0.2, b + 0.35, easeIn));
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1470, display: 'flex', justifyContent: 'center', opacity: k, transform: `translateY(${(1 - k) * 30}px)`}}>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 14px', direction: 'rtl', background: 'rgba(26,26,26,0.78)', borderRadius: 28,
        padding: '18px 30px', maxWidth: 940}}>
        {words.map(([ws, we, w], i) => {
          const on = t >= ws && t < we + 0.05;
          const past = t >= we + 0.05;
          return (
            <span key={i} style={{fontFamily: AR, fontWeight: 800, fontSize: 56, lineHeight: 1.3, padding: '0 10px', borderRadius: 14,
              color: on ? L.ink : past ? L.white : 'rgba(255,255,255,0.55)', background: on ? L.orange : 'transparent',
              transform: `scale(${on ? 1.06 : 1})`, display: 'inline-block'}}>{w}</span>
          );
        })}
      </div>
    </div>
  );
};

const LogoTab: React.FC<{t: number}> = ({t}) => {
  const k = prog(t, 0.3, 0.9, easeOut) * (1 - prog(t, T.s9.enter - 0.1, T.s9.enter + 0.3, easeIn));
  if (k <= 0) return null;
  return (
    <div style={{position: 'absolute', right: 50, top: 0, width: 380, height: 150, background: L.white, borderRadius: '0 0 30px 30px', boxShadow: '0 10px 26px rgba(0,0,0,0.18)',
      transform: `translateY(${(1 - k) * -170}px)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <Img src={asset('logo-horizontal-color.svg')} style={{width: 330}} />
    </div>
  );
};

export const LabTour: React.FC = () => {
  useAsemaFonts();
  const f = useCurrentFrame();
  const t = f / TFPS;
  const scenes: [number, React.FC<{t: number; f: number}>][] = [
    [T.s1.enter, S1], [T.s2.enter, S2], [T.s3.enter, S3], [T.s4.enter, S4], [T.s5.enter, S5],
    [T.s6.enter, S6], [T.s7.enter, S7], [T.s8.enter, S8], [T.s9.enter, S9],
  ];
  return (
    <AbsoluteFill style={{background: L.white}}>
      {scenes.map(([enter, C], i) => (
        <Scene key={i} t={t} enter={enter} next={i + 1 < scenes.length ? scenes[i + 1][0] : T.duration + 5} first={i === 0}><C t={t} f={f} /></Scene>
      ))}
      <Drop p={poseAt(t)} t={t} />
      <LogoTab t={t} />
      <Captions t={t} />
      <Grain frame={f} opacity={0.05} />
    </AbsoluteFill>
  );
};
