import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from '../components/primitives';
import {easeIn, easeInOut, easeOut, prog, sp} from '../lib';
import {AR, EN, HEAVY, L, MARK, POP, asset, useAsemaFonts} from '../asema/AsemaPromo';
import TL from './timeline.json';

// Al Asema Lab, video 3: «متسألش جوجل.. اسأل معمل». Live footage + motion graphics, 1080x1920.
export const AW = 1080;
export const AH = 1920;
export const AFPS = TL.fps;
const W = AW;
const H = AH;
const T = TL;
const B = T.beats;
const WORDS = T.words as unknown as [number, number, string][];
const STICK = {damping: 8, stiffness: 200, mass: 0.7};
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const sc = (i: number) => T.scenes[i];

// ---------------------------------------------------------------- footage
/** One scene of footage: plays from its in-point, with a slow push-in so nothing is static. */
const Clip: React.FC<{i: number; t: number; push?: number}> = ({i, t, push = 0.06}) => {
  const s = sc(i);
  const k = clamp01((t - s.enter) / (s.exit - s.enter + 0.5));
  return (
    <Sequence from={Math.round(s.enter * AFPS)} durationInFrames={Math.round((s.exit - s.enter + 0.6) * AFPS)}>
      <AbsoluteFill style={{transform: `scale(${1 + push * k})`}}>
        <OffthreadVideo src={staticFile(`asema3/${s.clip}`)} trimBefore={Math.round(s.in * AFPS)} playbackRate={s.rate} muted
          style={{width: W, height: H, objectFit: 'cover'}} />
      </AbsoluteFill>
    </Sequence>
  );
};

/** Barcode labels on the tubes' blank label areas (measured on the clip, canvas px), printed on as each tube lands. */
const LABELS = [
  {x: 365, y: 952, w: 76, h: 266}, {x: 500, y: 932, w: 76, h: 290}, {x: 635, y: 937, w: 76, h: 283}, {x: 771, y: 937, w: 79, h: 278},
];
const bars = (seed: number) => {
  const out: [number, number][] = [];
  let y = 0;
  let k = seed * 9.73;
  while (y < 1) {
    k = (k * 16807 + 11) % 2147483647;
    const w = 0.012 + ((k % 1000) / 1000) * 0.03;
    out.push([y, w]);
    k = (k * 16807 + 7) % 2147483647;
    y += w + 0.012 + ((k % 1000) / 1000) * 0.022;
  }
  return out;
};
const TubeLabel: React.FC<{i: number; k: number}> = ({i, k}) => {
  const l = LABELS[i];
  const bh = l.h * 0.62;
  return (
    <svg width={l.w} height={l.h} style={{position: 'absolute', left: l.x, top: l.y, clipPath: `inset(0 0 ${(1 - k) * 100}% 0)`}}>
      <defs>
        <linearGradient id={`wrap${i}`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity={0.28} /><stop offset="0.25" stopColor="#000" stopOpacity={0} />
          <stop offset="0.7" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.32} />
        </linearGradient>
      </defs>
      <rect x={2} y={0} width={l.w - 4} height={l.h} rx={4} fill="#F7F7F5" />
      <rect x={2} y={0} width={l.w - 4} height={14} fill={[L.red, L.orange, L.blue, '#7B3FA0'][i]} opacity={0.9} />
      {bars(i + 1).map(([y, w], j) => (
        <rect key={j} x={12} y={24 + y * bh} width={l.w - 24} height={w * bh} fill="#1A1A1A" />
      ))}
      <text x={l.w / 2} y={l.h - 14} textAnchor="middle" fontFamily="Montserrat" fontWeight={700} fontSize={12} fill="#1A1A1A"
        transform={`rotate(-90 ${l.w / 2} ${l.h - 50})`}>{`AS-${2611 + i * 7}${(i * 3 + 4) % 10}`}</text>
      <rect x={2} y={0} width={l.w - 4} height={l.h} rx={4} fill={`url(#wrap${i})`} />
    </svg>
  );
};

/** Scene 7: hard cuts on each spoken test name to the moment its tube lands, then hold the full rack. */
const Snaps: React.FC<{t: number}> = ({t}) => {
  const s = sc(6);
  const snaps = T.snaps;
  const idx = snaps.reduce((acc, sn, k) => (t >= sn.t ? k : acc), -1);
  // after each snap the clip creeps on slowly (the rack settles); the last one nearly holds still
  const rate = idx < 0 ? 1 : idx === snaps.length - 1 ? 0.06 : 0.3;
  const from = idx < 0 ? s.enter : snaps[idx].t - snaps[idx].clipT / rate;
  const flash = idx < 0 ? 0 : Math.exp(-(t - snaps[idx].t) / 0.06) * 0.5;
  const k = clamp01((t - s.enter) / (s.exit - s.enter));
  return (
    <AbsoluteFill style={{transform: `scale(${1.02 + 0.04 * k})`}}>
      <Sequence from={Math.round(from * AFPS)} key={idx}>
        <OffthreadVideo src={staticFile('asema3/s7.mp4')} muted playbackRate={rate} style={{width: W, height: H, objectFit: 'cover'}} />
      </Sequence>
      {LABELS.map((_, i) => (idx >= i ? <TubeLabel key={i} i={i} k={prog(t, snaps[i].t + 0.02, snaps[i].t + 0.3, easeOut)} /> : null))}
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- transitions
/** The logo's swoosh as a wipe: a royal blue band then a red band sweep across, revealing the next scene. */
const Swoosh: React.FC<{t: number; at: number}> = ({t, at}) => {
  const k = prog(t, at - 0.35, at + 0.35, easeInOut);
  if (k <= 0 || k >= 1) return null;
  const x = -1600 + k * 3200;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={W} height={H}>
        <g transform={`translate(${x},0) skewX(-18)`}>
          <rect x={0} y={-200} width={900} height={H + 400} fill={L.blue} />
          <rect x={900} y={-200} width={70} height={H + 400} fill={L.white} />
          <rect x={970} y={-200} width={230} height={H + 400} fill={L.red} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Scene reveal by the cover's double ring opening from a point. */
const Iris: React.FC<{t: number; at: number; x: number; y: number; children: React.ReactNode}> = ({t, at, x, y, children}) => {
  const k = prog(t, at, at + 0.5, easeInOut);
  const r = k * 2300;
  return (
    <AbsoluteFill style={{clipPath: k >= 1 ? undefined : `circle(${r}px at ${x}px ${y}px)`}}>
      {children}
      {k > 0 && k < 1 && (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <circle cx={x} cy={y} r={r} fill="none" stroke={L.burgundy} strokeWidth={40} />
          <circle cx={x} cy={y} r={Math.max(0, r - 32)} fill="none" stroke={L.orange} strokeWidth={20} />
        </svg>
      )}
    </AbsoluteFill>
  );
};

/** A hard cut with a quick punch-in and a white blink. */
const Punch: React.FC<{t: number; at: number; children: React.ReactNode}> = ({t, at, children}) => {
  const d = t - at;
  const s = d >= 0 && d < 0.25 ? 1.1 - 0.1 * easeOut(d / 0.25) : 1;
  return <AbsoluteFill style={{transform: `scale(${s})`}}>{children}</AbsoluteFill>;
};

// ---------------------------------------------------------------- the search bar
const typed = (text: string, t: number, a: number, b: number) => text.slice(0, Math.round(text.length * prog(t, a, b, (x) => x)));

const SearchBar: React.FC<{t: number; text: string; y: number; caret: boolean; glow?: number; scale?: number}> = ({t, text, y, caret, glow = 0, scale = 1}) => (
  <div style={{position: 'absolute', left: 70, right: 70, top: y, height: 118, borderRadius: 59, background: 'rgba(255,255,255,0.97)', transform: `scale(${scale})`,
    boxShadow: `0 18px 40px rgba(0,0,0,0.35), 0 0 0 ${6 * glow}px rgba(242,161,31,${0.9 * glow})`, display: 'flex', alignItems: 'center', direction: 'rtl', padding: '0 44px', gap: 26}}>
    <svg width={54} height={54} viewBox="0 0 54 54"><circle cx={23} cy={23} r={15} fill="none" stroke={L.gray} strokeWidth={6} /><line x1={34} y1={34} x2={48} y2={48} stroke={L.gray} strokeWidth={7} strokeLinecap="round" /></svg>
    <div style={{fontFamily: AR, fontWeight: 700, fontSize: 52, color: L.ink, whiteSpace: 'nowrap', overflow: 'hidden', flex: 1}}>
      {text}
      <span style={{display: 'inline-block', width: 5, height: 58, marginRight: 6, verticalAlign: 'middle', background: L.blue,
        opacity: caret && Math.floor(t * 2.4) % 2 === 0 ? 1 : 0}} />
    </div>
  </div>
);

const Pill: React.FC<{text: string; k: number; x: number; y: number; bg?: string; fg?: string; size?: number; rot?: number; icon?: React.ReactNode}> = ({
  text, k, x, y, bg = L.white, fg = L.ink, size = 46, rot = 0, icon,
}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${k}) rotate(${rot}deg)`, opacity: Math.min(1, k * 1.6)}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 14, background: bg, color: fg, fontFamily: AR, fontWeight: 800, fontSize: size, direction: 'rtl',
      padding: `${size * 0.22}px ${size * 0.7}px`, borderRadius: 999, whiteSpace: 'nowrap', boxShadow: '0 14px 30px rgba(0,0,0,0.28)'}}>{icon}{text}</div>
  </div>
);

const Check: React.FC<{size?: number; color?: string}> = ({size = 44, color = '#2E9E5B'}) => (
  <svg width={size} height={size} viewBox="0 0 44 44"><circle cx={22} cy={22} r={22} fill={color} /><path d="M12,23 L19,30 L32,15" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" /></svg>
);

const PinIcon: React.FC<{size?: number}> = ({size = 46}) => (
  <svg width={size * 0.8} height={size} viewBox="0 0 40 50"><path d="M20,48 C8,32 2,24 2,18 A18,18 0 1 1 38,18 C38,24 32,32 20,48 Z" fill={L.red} /><circle cx={20} cy={18} r={7} fill="#fff" /></svg>
);

// ---------------------------------------------------------------- overlays per scene
const Night: React.FC<{t: number; f: number}> = ({t, f}) => {
  const [a1, b1] = B.typeA;
  const [e0, e1] = B.erase;
  const [c0, c1] = B.typeB;
  const q1 = 'ليه بتعب على طول؟';
  const q2 = 'معمل العاصمة';
  let text = '';
  if (t < e0) text = typed(q1, t, a1, b1);
  else if (t < c0) text = q1.slice(0, Math.round(q1.length * (1 - prog(t, e0, e1, (x) => x))));
  else text = typed(q2, t, c0, c1);
  const inK = prog(t, 0.5, 1.0, easeOut);
  const outK = prog(t, B.enter + 0.05, B.enter + 0.35, easeIn);
  const press = Math.exp(-Math.max(0, t - B.enter) / 0.15) * (t >= B.enter ? 1 : 0);
  // suggestions under the bar after the first question
  const sugg = ['أعراض الأنيميا', 'مشاكل الغدة الدرقية', 'نقص فيتامين د'];
  const sK = prog(t, b1 + 0.1, b1 + 0.5, easeOut) * (1 - prog(t, sc(1).exit - 0.3, sc(1).exit, easeIn));
  if (t > B.enter + 0.4) return null;
  return (
    <AbsoluteFill style={{opacity: inK * (1 - outK), transform: `translateY(${(1 - inK) * -60}px)`}}>
      <SearchBar t={t} text={text} y={230} caret glow={press} scale={1 - 0.03 * press} />
      {sK > 0 && (
        <div style={{position: 'absolute', left: 90, right: 90, top: 360, borderRadius: 30, background: 'rgba(255,255,255,0.94)', padding: '14px 0',
          opacity: sK, transform: `translateY(${(1 - sK) * -20}px)`, boxShadow: '0 18px 40px rgba(0,0,0,0.3)'}}>
          {sugg.map((s, i) => (
            <div key={s} style={{display: 'flex', alignItems: 'center', gap: 18, direction: 'rtl', padding: '12px 40px', fontFamily: AR, fontWeight: 600, fontSize: 40, color: L.gray,
              opacity: prog(t, b1 + 0.15 + i * 0.12, b1 + 0.45 + i * 0.12, easeOut)}}>
              <svg width={34} height={34} viewBox="0 0 54 54"><circle cx={23} cy={23} r={15} fill="none" stroke="#A1A1A8" strokeWidth={6} /><line x1={34} y1={34} x2={48} y2={48} stroke="#A1A1A8" strokeWidth={7} strokeLinecap="round" /></svg>
              {s}
            </div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};

/** Scene 2: the worries multiply around his face; they come back answered in scene 7. */
const WORRIES: [string, number, number, number][] = [
  ['أنيميا؟', 250, 640, -8], ['غدة؟', 830, 600, 7], ['سكر؟', 190, 1010, 6], ['فيتامين د؟', 860, 980, -6], ['ضغط؟', 300, 1300, -4], ['قلب؟', 800, 1330, 5],
];
const Worries: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = sc(1);
  if (t < s.enter - 0.05 || t > s.exit + 0.3) return null;
  const out = prog(t, s.exit - 0.2, s.exit + 0.2, easeIn);
  const shake = Math.sin(t * 40) * 3 * clamp01((t - B.chips[3]) / 1);
  const tint = 0.32 * clamp01((t - s.enter) / (s.exit - s.enter));
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, transparent 35%, rgba(155,29,50,${tint}) 100%)`}} />
      {WORRIES.map(([w, x, y, rot], i) => {
        const k = sp(f, B.chips[i], POP, AFPS);
        const drift = Math.sin(t * 2 + i) * 8;
        return <Pill key={w} text={w} k={k} x={x + shake} y={y + drift} rot={rot} bg={i % 2 ? L.white : L.red} fg={i % 2 ? L.red : L.white} size={50} />;
      })}
    </AbsoluteFill>
  );
};

const LogoTab: React.FC<{t: number}> = ({t}) => {
  const k = prog(t, sc(3).enter + 0.5, sc(3).enter + 1.0, easeOut) * (1 - prog(t, T.endCard - 0.2, T.endCard + 0.2, easeIn));
  if (k <= 0) return null;
  return (
    <div style={{position: 'absolute', right: 50, top: 0, width: 360, height: 140, background: L.white, borderRadius: '0 0 30px 30px', boxShadow: '0 10px 26px rgba(0,0,0,0.22)',
      transform: `translateY(${(1 - k) * -160}px)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <Img src={asset('logo-horizontal-color.svg')} style={{width: 310}} />
    </div>
  );
};

const Reception: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = sc(3);
  if (t < s.enter || t > s.exit + 0.3) return null;
  const pin = sp(f, B.pin, POP, AFPS);
  const lis = sp(f, B.listen, POP, AFPS);
  return (
    <AbsoluteFill>
      <Pill text="ميت غمر · برج دهب · شارع الجيش" k={pin} x={W / 2} y={470} size={40} icon={<PinIcon size={44} />} />
      <Pill text="فريق بيسمعك" k={lis} x={W / 2} y={570} size={40} bg={L.blue} fg={L.white} icon={<Check size={38} color={L.orange} />} />
    </AbsoluteFill>
  );
};

const Sterile: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = sc(4);
  if (t < s.enter || t > s.exit + 0.3) return null;
  const chip = sp(f, s.enter + 0.4, POP, AFPS);
  const st = sp(f, B.stamp, {damping: 12, stiffness: 260, mass: 0.6}, AFPS);
  return (
    <AbsoluteFill>
      <Pill text="أدوات معقّمة" k={chip} x={W / 2} y={260} size={46} bg={L.blue} fg={L.white} icon={<Check size={40} color={L.orange} />} />
      {st > 0.01 && (
        <div style={{position: 'absolute', left: W / 2, top: 760, transform: `translate(-50%,-50%) scale(${2.2 - 1.2 * st}) rotate(-9deg)`, opacity: Math.min(1, st * 2)}}>
          <div style={{border: `12px solid ${L.burgundy}`, borderRadius: 30, padding: '6px 40px', color: L.burgundy, fontFamily: AR, fontWeight: 800, fontSize: 86,
            background: 'rgba(255,255,255,0.9)', direction: 'rtl', whiteSpace: 'nowrap'}}>مرة واحدة بس</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const Analyzer: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = sc(5);
  if (t < s.enter || t > s.exit + 0.3) return null;
  const box = prog(t, s.enter + 0.3, s.enter + 0.8, easeOut);
  const scan = prog(t, B.scan, B.scan + 1.2, easeInOut);
  const bar = prog(t, s.enter + 0.6, s.exit - 0.3, (x) => x);
  const corner = (x: number, y: number, dx: number, dy: number) => <path d={`M${x},${y + dy * 60} L${x},${y} L${x + dx * 60},${y}`} fill="none" stroke={L.orange} strokeWidth={8} strokeLinecap="round" />;
  const bx0 = 520, by0 = 430, bx1 = 860, by1 = 920;
  const pad = (1 - box) * 60;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: box}}>
        {corner(bx0 - pad, by0 - pad, 1, 1)}{corner(bx1 + pad, by0 - pad, -1, 1)}{corner(bx0 - pad, by1 + pad, 1, -1)}{corner(bx1 + pad, by1 + pad, -1, -1)}
        {scan > 0 && scan < 1 && <>
          <rect x={80} y={1020 + scan * 420} width={W - 160} height={8} rx={4} fill={L.red} opacity={0.95} />
          <rect x={80} y={1020} width={W - 160} height={scan * 420} fill={L.red} opacity={0.12} />
        </>}
      </svg>
      <div style={{position: 'absolute', left: 70, top: 260, width: 420, opacity: box, direction: 'rtl', background: 'rgba(31,35,107,0.82)', borderRadius: 24, padding: '20px 28px'}}>
        <div style={{fontFamily: AR, fontWeight: 800, fontSize: 40, color: L.white}}>تحليل آلي</div>
        <div style={{height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.2)', marginTop: 14}}>
          <div style={{height: 14, borderRadius: 7, background: L.orange, width: `${bar * 100}%`}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Scene 7: each answered worry lands on its tube with a check. */
const TUBE_X = [396, 534, 675, 816];
const Answers: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = sc(6);
  if (t < s.enter || t > s.exit + 0.3) return null;
  const cols = [L.red, L.orange, L.blue, '#7B3FA0'];
  return (
    <AbsoluteFill>
      {T.snaps.map((sn, i) => {
        const k = sp(f, sn.t, POP, AFPS);
        const x = i < 4 ? TUBE_X[i] : W / 2;
        const y = i < 4 ? 610 - (i % 2) * 90 : 300;
        return (
          <Pill key={sn.label} text={sn.label} k={k} x={x} y={y} size={i < 4 ? 40 : 52} bg={L.white} fg={i < 4 ? cols[i] : L.burgundy}
            icon={<Check size={i < 4 ? 34 : 44} />} />
        );
      })}
    </AbsoluteFill>
  );
};

const Relief: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = sc(7);
  if (t < s.enter || t > s.exit + 0.3) return null;
  const tag = sp(f, B.tag, {damping: 6, stiffness: 120, mass: 1}, AFPS);
  const badge = sp(f, B.badge, STICK, AFPS);
  const swing = (1 - tag) * 35 + Math.sin(t * 2.4) * 2;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 820, top: 190, width: 220, transformOrigin: '110px 0px', transform: `rotate(${swing}deg) translateY(${(1 - tag) * -500}px)`}}>
        <svg width={220} height={330} style={{overflow: 'visible'}}>
          <line x1={110} y1={-200} x2={110} y2={40} stroke={L.orange} strokeWidth={5} />
          <path d="M60,30 L160,30 L200,80 L200,310 Q200,320 190,320 L30,320 Q20,320 20,310 L20,80 Z" fill={L.white} />
          <circle cx={110} cy={62} r={14} fill={L.burgundy} />
        </svg>
        <div style={{position: 'absolute', left: 0, top: 120, width: 220, textAlign: 'center', fontFamily: AR, fontWeight: 800, lineHeight: 1.1, direction: 'rtl'}}>
          <div style={{fontSize: 46, color: L.blue}}>أسعار</div><div style={{fontSize: 46, color: L.red}}>تنافسية</div>
        </div>
      </div>
      {badge > 0.01 && (
        <div style={{position: 'absolute', left: 200, top: 1180, width: 330, height: 330, transform: `translate(-50%,-50%) scale(${badge}) rotate(${-12 + (1 - badge) * 40}deg)`}}>
          <svg width={330} height={330} style={{position: 'absolute'}}>
            <path d={Array.from({length: 32}, (_, i) => { const a = (i / 32) * Math.PI * 2; const r = i % 2 ? 138 : 164; return `${i ? 'L' : 'M'}${165 + Math.cos(a) * r},${165 + Math.sin(a) * r}`; }).join(' ') + 'Z'} fill={L.orange} />
          </svg>
          <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: AR, fontWeight: 800, color: L.ink, direction: 'rtl', lineHeight: 1.05}}>
            <span style={{fontSize: 64}}>خصومات</span><span style={{fontSize: 34, color: L.burgundy}}>على الباقات</span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- end card
const EndCard: React.FC<{t: number; f: number}> = ({t, f}) => {
  const e = T.endCard;
  const q = 'معمل العاصمة';
  const card = sp(f, e + 0.9, HEAVY, AFPS);
  const btn = sp(f, e + 1.7, POP, AFPS);
  const pulse = 1 + 0.04 * Math.max(0, Math.sin((t - e - 2) * 5)) * (t > e + 2 ? 1 : 0);
  const stripe = prog(t, e + 1.1, e + 1.6, easeOut);
  const arm = prog(t, e + 1.2, e + 1.8, easeInOut);
  const tube = sp(f, e + 1.5, HEAVY, AFPS);
  const s = 300 / 524;
  return (
    <AbsoluteFill style={{background: `linear-gradient(170deg, #FFFFFF 0%, #F6EEF1 100%)`}}>
      <SearchBar t={t} text={typed(q, t, e + 0.15, e + 0.7)} y={190} caret={t < e + 1.0} glow={Math.exp(-Math.max(0, t - e - 0.8) / 0.2) * (t > e + 0.8 ? 1 : 0)} />
      <div style={{position: 'absolute', left: 70, right: 70, top: 360, borderRadius: 40, background: L.white, boxShadow: '0 24px 60px rgba(92,14,29,0.18)',
        transform: `translateY(${(1 - card) * 300}px)`, opacity: Math.min(1, card * 1.5), padding: '40px 50px 46px', direction: 'rtl'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 28}}>
          <svg width={300 * 0.6} height={300 * 0.6} viewBox="-2 -14 524 530" style={{flex: 'none'}}>
            <path d={MARK.stripe} fill={L.red} style={{transform: `scaleX(${stripe})`, transformOrigin: '18px 480px'}} />
            <clipPath id="arm3"><rect x={-2} y={-20} width={530 * arm} height={560} /></clipPath>
            <path d={MARK.arm} fill={L.blue} clipPath="url(#arm3)" />
            <g transform={`translate(0,${(1 - tube) * -320})`} opacity={Math.min(1, tube * 2)}>
              <g transform="translate(229,174) rotate(15)" fill={L.blue}>
                <rect x={-46} y={-180} width={92} height={24} rx={9} /><rect x={-25} y={-160} width={50} height={40} rx={4} />
                <rect x={-36} y={-124} width={72} height={196} rx={8} /><path d="M-30,68 L30,68 L22,108 Q0,118 -22,108 Z" />
                <path fillRule="evenodd" d="M58,-20 m-52,0 a52,52 0 1,0 104,0 a52,52 0 1,0 -104,0 Z M58,-20 m-28,0 a28,28 0 1,1 56,0 a28,28 0 1,1 -56,0 Z" />
              </g>
            </g>
            {MARK.bubbles.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r * sp(f, e + 1.7 + i * 0.06, POP, AFPS)} fill={L.red} />)}
          </svg>
          <div>
            <div style={{fontFamily: AR, fontWeight: 800, fontSize: 84, color: L.red, lineHeight: 1.1}}>معمل العاصمة</div>
            <div style={{fontFamily: AR, fontWeight: 700, fontSize: 46, color: L.blue}}>للتحاليل الطبية</div>
            <div style={{fontFamily: EN, fontWeight: 700, fontSize: 24, letterSpacing: '0.3em', direction: 'ltr', textAlign: 'right', marginTop: 6}}>
              <span style={{color: L.red}}>A</span><span style={{color: L.blue}}>L ASEMA LAB</span>
            </div>
          </div>
        </div>
        <div style={{height: 2, background: 'rgba(0,0,0,0.08)', margin: '30px 0'}} />
        {/* mini map */}
        <div style={{position: 'relative', height: 300, borderRadius: 26, overflow: 'hidden', background: '#EEF1F6'}}>
          <svg width={840} height={300} style={{position: 'absolute', inset: 0}}>
            <path d="M-20,230 C200,180 300,260 460,170 C600,90 720,120 860,60" stroke="#C7D3EC" strokeWidth={46} fill="none" />
            {[[0, 90, 860, 70], [0, 200, 860, 250], [250, 0, 300, 300], [600, 0, 560, 300]].map(([a, b, c, d], i) => <line key={i} x1={a} y1={b} x2={c} y2={d} stroke="#fff" strokeWidth={22} />)}
            <circle cx={430} cy={150} r={40 + 18 * Math.sin(t * 4)} fill={L.red} opacity={0.15} />
          </svg>
          <div style={{position: 'absolute', left: 430 - 30, top: 150 - 74 - (1 - sp(f, e + 1.3, {damping: 11, stiffness: 180, mass: 0.8}, AFPS)) * 300}}><PinIcon size={76} /></div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 26, fontFamily: AR, fontWeight: 600, fontSize: 34, color: L.gray}}>
          <PinIcon size={36} />ميت غمر · برج دهب · شارع الجيش · ناصية شارع أبوسنة
        </div>
        <div style={{fontFamily: AR, fontWeight: 600, fontSize: 34, color: L.gray, marginRight: 46}}>أعلى التوحيد والنور · الدور الأول</div>
        <div style={{fontFamily: EN, fontWeight: 700, fontSize: 54, color: L.blue, direction: 'ltr', textAlign: 'center', marginTop: 24}}>01096534354 · 01019289733</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1600, display: 'flex', justifyContent: 'center'}}>
        <div style={{transform: `scale(${btn * pulse})`, background: L.burgundy, color: L.white, fontFamily: AR, fontWeight: 800, fontSize: 64, padding: '18px 70px',
          borderRadius: 999, direction: 'rtl', boxShadow: '0 18px 36px rgba(92,14,29,0.35)'}}>اتصل واحجز دلوقتي</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- captions
type Page = {a: number; b: number; words: [number, number, string][]};
const PAGES: Page[] = (() => {
  const out: Page[] = [];
  for (const [la, lb] of T.lines as [number, number][]) {
    const ws = WORDS.filter(([s]) => s >= la - 0.01 && s <= lb);
    for (let i = 0; i < ws.length; i += 5) {
      const chunk = ws.slice(i, i + 5);
      out.push({a: chunk[0][0], b: chunk[chunk.length - 1][1], words: chunk});
    }
  }
  return out;
})();

const Captions: React.FC<{t: number}> = ({t}) => {
  const idx = PAGES.findIndex((p, i) => t >= p.a - 0.05 && t < (PAGES[i + 1] ? Math.min(PAGES[i + 1].a - 0.05, p.b + 0.6) : p.b + 0.6));
  if (idx < 0 || t > T.endCard + 0.2) return null;
  const p = PAGES[idx];
  const k = prog(t, p.a - 0.05, p.a + 0.1, easeOut);
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 1430, display: 'flex', justifyContent: 'center'}}>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px 16px', direction: 'rtl', maxWidth: 960, padding: '20px 34px', borderRadius: 30,
        background: 'rgba(20,20,24,0.72)', backdropFilter: 'blur(6px)', transform: `translateY(${(1 - k) * 24}px)`, opacity: k, boxShadow: '0 16px 36px rgba(0,0,0,0.3)'}}>
        {p.words.map(([ws, we, w], i) => {
          const on = t >= ws && t < we + 0.05;
          const seen = t >= ws;
          return (
            <span key={i} style={{fontFamily: AR, fontWeight: 800, fontSize: 62, lineHeight: 1.25, padding: '0 10px', borderRadius: 14,
              color: on ? L.ink : seen ? L.white : 'rgba(255,255,255,0.4)', background: on ? L.orange : 'transparent',
              transform: `scale(${on ? 1.06 : 1})`, display: 'inline-block'}}>{w}</span>
          );
        })}
      </div>
    </div>
  );
};

export const AskLab: React.FC = () => {
  useAsemaFonts();
  const f = useCurrentFrame();
  const t = f / AFPS;
  const s = T.scenes;
  const vignette = t < s[3].enter ? 0.55 : 0.28;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < s[1].enter + 0.05 && <Clip i={0} t={t} push={0.08} />}
      {t >= s[1].enter && t < s[2].enter + 0.05 && <Punch t={t} at={s[1].enter}><Clip i={1} t={t} push={0.1} /></Punch>}
      {t >= s[2].enter && t < s[3].enter + 0.4 && <Punch t={t} at={s[2].enter}><Clip i={2} t={t} /></Punch>}
      {t >= s[3].enter && t < s[4].enter + 0.55 && <Clip i={3} t={t} push={0.05} />}
      {t >= s[4].enter && t < s[5].enter + 0.05 && <Iris t={t} at={s[4].enter} x={540} y={1300}><Clip i={4} t={t} /></Iris>}
      {t >= s[5].enter && t < s[6].enter + 0.05 && (
        <AbsoluteFill style={{transform: `translateX(${(1 - prog(t, s[5].enter, s[5].enter + 0.35, easeOut)) * -W}px)`,
          filter: `blur(${(1 - prog(t, s[5].enter, s[5].enter + 0.35, easeOut)) * 18}px)`}}><Clip i={5} t={t} /></AbsoluteFill>
      )}
      {t >= s[6].enter && t < s[7].enter + 0.4 && <Snaps t={t} />}
      {t >= s[7].enter && t < T.endCard + 0.55 && <Clip i={7} t={t} push={0.07} />}
      {t >= T.endCard && <Iris t={t} at={T.endCard} x={540} y={960}><EndCard t={t} f={f} /></Iris>}
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 45%, transparent 55%, rgba(0,0,0,${t >= T.endCard + 0.5 ? 0 : vignette}) 100%)`, pointerEvents: 'none'}} />
      <Night t={t} f={f} />
      <Worries t={t} f={f} />
      <Reception t={t} f={f} />
      <Sterile t={t} f={f} />
      <Analyzer t={t} f={f} />
      <Answers t={t} f={f} />
      <Relief t={t} f={f} />
      <LogoTab t={t} />
      <Captions t={t} />
      <Swoosh t={t} at={s[3].enter} />
      <Swoosh t={t} at={s[7].enter} />
      <Grain frame={f} opacity={0.05} />
    </AbsoluteFill>
  );
};
