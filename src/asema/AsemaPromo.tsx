import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Easing, Img, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {Grain, Mask} from '../components/primitives';
import {easeIn, easeInOut, easeOut, prog, sp} from '../lib';
import T from './timeline.json';

// Al Asema Lab promo reel, 1080x1920. Palette and mark mirror brand/al-asema-lab (locked v1.0).
export const PW = 1080;
export const PH = 1920;
export const PFPS = T.fps;
const L = {
  white: '#FFFFFF', red: '#E0262B', burgundy: '#9B1D32', orange: '#F2A11F', blue: '#33389A',
  blueHi: '#4650C4', navy: '#1F236B', wine: '#5C0E1D', ink: '#1A1A1A', gray: '#5F5F66',
  blush: '#F6EEF1', sky: '#E6ECF8', cold: '#7FB0FF',
};
const AR = '"Cairo", sans-serif';
const EN = '"Montserrat", sans-serif';
const POP = {damping: 10, stiffness: 220, mass: 0.7};
const HEAVY = {damping: 17, stiffness: 180, mass: 0.9};
const LAND = Easing.bezier(0.55, 0, 0.2, 1.12);
const WIPE = 0.6;
const asset = (f: string) => staticFile(`asema/${f}`);

const MARK = {
  arm: 'M330,140 C420,160 474,240 470,330 C466,410 420,452 352,452 C250,454 110,446 4,442 C110,398 220,382 338,404 C392,410 432,372 434,322 C436,262 398,214 330,190 Z',
  stripe: 'M18,458 C160,456 340,466 520,490 L514,518 C350,490 180,470 18,458 Z',
  bubbles: [[48, 198, 25], [56, 250, 7], [100, 248, 14], [85, 292, 9], [118, 282, 6], [116, 325, 9]],
};

const useAsemaFonts = () => {
  const [handle] = useState(() => delayRender('asema-fonts'));
  useEffect(() => {
    const list: [string, string, string][] = [
      ['Cairo', '800', 'Cairo-ExtraBold.ttf'], ['Cairo', '700', 'Cairo-Bold.ttf'],
      ['Cairo', '600', 'Cairo-SemiBold.ttf'], ['Montserrat', '700', 'Montserrat-Bold.ttf'],
    ];
    Promise.all(list.map(([fam, w, f]) => new FontFace(fam, `url(${asset(f)})`, {weight: w}).load().then((ff) => {
      (document.fonts as unknown as {add: (f: FontFace) => void}).add(ff);
    }))).then(() => continueRender(handle));
  }, [handle]);
};

const arDigits = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

// ---------------------------------------------------------------- building blocks
const Line: React.FC<{y: number; children: React.ReactNode; style?: React.CSSProperties}> = ({y, children, style}) => (
  <div style={{position: 'absolute', left: 60, right: 60, top: y, direction: 'rtl', textAlign: 'center', fontFamily: AR, fontWeight: 800, lineHeight: 1.15, whiteSpace: 'nowrap', ...style}}>
    {children}
  </div>
);

/** Words masked in one by one (RTL order), optional masked exit. */
const Words: React.FC<{text: string; t: number; t0: number; size: number; color: string; stagger?: number; exit?: number; weight?: number}> = ({
  text, t, t0, size, color, stagger = 0.09, exit, weight = 800,
}) => (
  <span style={{fontSize: size, color, fontWeight: weight}}>
    {text.split(' ').map((w, i) => {
      const k = prog(t, t0 + i * stagger, t0 + i * stagger + 0.75, easeOut);
      const out = exit === undefined ? 0 : prog(t, exit + i * 0.04, exit + i * 0.04 + 0.4, easeIn);
      return (
        <React.Fragment key={i}>
          <Mask k={k} out={out} tilt={-5}>{w}</Mask>
          {i < text.split(' ').length - 1 ? ' ' : null}
        </React.Fragment>
      );
    })}
  </span>
);

const Molecules: React.FC<{color: string; op: number; t: number; seed?: number}> = ({color, op, t, seed = 0}) => {
  const spots = [[140, 520, 1.3], [940, 640, 1], [110, 1420, 0.9], [960, 1500, 1.2], [560, 220, 0.7], [320, 1060, 0.6], [860, 1150, 0.7]];
  return (
    <svg width={PW} height={PH} style={{position: 'absolute', inset: 0}}>
      {spots.filter((_, i) => (i + seed) % 3 !== 2).map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x + Math.sin(t * 0.4 + i) * 8},${y + Math.cos(t * 0.35 + i) * 8}) scale(${s})`} fill={color} stroke={color} opacity={op}>
          {[[-80, -50], [75, -55], [8, 85]].map(([nx, ny], j) => <line key={j} x1={0} y1={0} x2={nx} y2={ny} strokeWidth={9} strokeLinecap="round" />)}
          {[[0, 0, 22], [-80, -50, 16], [75, -55, 15], [8, 85, 18]].map(([nx, ny, r], j) => <circle key={j} cx={nx} cy={ny} r={r} stroke="none" />)}
        </g>
      ))}
    </svg>
  );
};

const Glow: React.FC<{x: number; y: number; r: number; color: string; op?: number}> = ({x, y, r, color, op = 0.5}) => (
  <div style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, opacity: op}} />
);

const Bg: React.FC<{kind: 'light' | 'blue' | 'wine' | 'sky' | 'lav'; t: number; seed?: number}> = ({kind, t, seed}) => {
  const bg = {
    light: `linear-gradient(170deg, ${L.white} 0%, ${L.blush} 100%)`,
    sky: `linear-gradient(170deg, ${L.white} 0%, ${L.sky} 100%)`,
    lav: `linear-gradient(170deg, ${L.white} 0%, #EFEAF7 100%)`,
    blue: `linear-gradient(165deg, ${L.blueHi} 0%, ${L.blue} 55%, ${L.navy} 100%)`,
    wine: `linear-gradient(165deg, #B3263F 0%, ${L.burgundy} 50%, ${L.wine} 100%)`,
  }[kind];
  const dark = kind === 'blue' || kind === 'wine';
  return (
    <AbsoluteFill style={{background: bg}}>
      <Molecules color={dark ? L.white : '#C9C9D6'} op={dark ? 0.07 : 0.5} t={t} seed={seed} />
    </AbsoluteFill>
  );
};

/** The cover's double ring, drawn on by k. */
const Ring: React.FC<{cx: number; cy: number; r: number; sw: number; k: number; outer?: string; inner?: string}> = ({cx, cy, r, sw, k, outer = L.burgundy, inner = L.orange}) => {
  const c1 = 2 * Math.PI * r;
  const r2 = r - sw * 0.85;
  const c2 = 2 * Math.PI * r2;
  return (
    <svg width={PW} height={PH} style={{position: 'absolute', inset: 0}}>
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={outer} strokeWidth={sw} strokeDasharray={c1} strokeDashoffset={c1 * (1 - k)} />
        <circle cx={cx} cy={cy} r={r2} fill="none" stroke={inner} strokeWidth={sw * 0.55} strokeDasharray={c2} strokeDashoffset={c2 * (1 - k)} />
      </g>
    </svg>
  );
};

const Cut: React.FC<{src: string; cx: number; cy: number; w: number; style?: React.CSSProperties; shadow?: number}> = ({src, cx, cy, w, style, shadow = 0.35}) => (
  <Img src={asset(src)} style={{position: 'absolute', left: cx - w / 2, top: cy, width: w, transform: 'translateY(-50%)', filter: `drop-shadow(0 30px 34px rgba(0,0,0,${shadow}))`, ...style}} />
);

const Chip: React.FC<{text: string; k: number; latin?: boolean; dark?: boolean; size?: number}> = ({text, k, latin, dark, size = 30}) => (
  <span style={{
    display: 'inline-block', margin: '0 7px', padding: `${size * 0.22}px ${size * 0.8}px`, borderRadius: 999,
    fontFamily: latin ? EN : AR, fontWeight: 700, fontSize: size, letterSpacing: latin ? '0.03em' : 0,
    color: dark ? L.white : L.blue, background: dark ? 'rgba(255,255,255,0.14)' : L.white,
    border: `2px solid ${dark ? 'rgba(255,255,255,0.35)' : 'rgba(155,29,50,0.3)'}`,
    transform: `scale(${0.6 + 0.4 * k})`, opacity: Math.min(1, k * 1.4),
  }}>{text}</span>
);

/** A scene layer: revealed by an expanding circle from (ox, oy), pushed in slightly while the next one covers it. */
const Scene: React.FC<{t: number; enter: number; next: number; ox: number; oy: number; children: React.ReactNode; first?: boolean}> = ({t, enter, next, ox, oy, children, first}) => {
  if (t < enter - 0.02 || t > next + WIPE + 0.05) return null;
  const k = first ? 1 : prog(t, enter, enter + WIPE, easeInOut);
  const push = 1 + 0.06 * prog(t, next, next + WIPE, easeIn);
  return (
    <AbsoluteFill style={{clipPath: k >= 1 ? undefined : `circle(${k * 2300}px at ${ox}px ${oy}px)`}}>
      <AbsoluteFill style={{transform: `scale(${push})`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- scenes
const S1: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = T.s1;
  const k1 = sp(f, s.w1 - 0.25, POP, PFPS);
  const k2 = sp(f, s.w2, POP, PFPS);
  const k3 = sp(f, s.w3, POP, PFPS);
  const out = prog(t, s.exit - 0.25, s.exit + 0.15, easeIn);
  const ul = prog(t, s.w2 + 0.25, s.w2 + 0.85, easeOut);
  const slam = (k: number) => ({transform: `scale(${1.35 - 0.35 * k}) translateY(${-out * 40}px)`, opacity: Math.min(1, k * 1.5) * (1 - out * 0.15), display: 'inline-block'});
  return (
    <AbsoluteFill>
      <Bg kind="light" t={t} />
      <Line y={560}><span style={{fontSize: 250, color: L.ink, ...slam(k1)}}>جسمك</span></Line>
      <Line y={850}><span style={{fontSize: 210, color: L.red, ...slam(k2)}}>بيكلمك..</span></Line>
      <svg width={PW} height={PH} style={{position: 'absolute', inset: 0}}>
        <g transform="translate(250,1060) scale(1.15,0.9)" style={{clipPath: `inset(0 0 0 ${(1 - ul) * 100}%)`}}>
          <path d={MARK.stripe} transform="translate(-18,-458)" fill={L.blue} />
        </g>
      </svg>
      <Line y={1180}><span style={{fontSize: 150, color: L.blue, ...slam(k3)}}>إنت سامعه؟</span></Line>
    </AbsoluteFill>
  );
};

const S2: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = T.s2;
  const cx = 540, cy = 1060, r = 340;
  const ringK = prog(t, s.ring, s.ring + 0.9, easeInOut);
  const fill = 0.15 * prog(t, s.fill, s.fill + 0.75, LAND);
  const c = 2 * Math.PI * r;
  const liverK = sp(f, s.liver, HEAVY, PFPS);
  const badgeK = sp(f, s.badge, POP, PFPS);
  const a = (-90 + 0.15 * 360) * (Math.PI / 180);
  const bx = cx + (r + 70) * Math.cos(a), by = cy + (r + 70) * Math.sin(a);
  return (
    <AbsoluteFill>
      <Bg kind="blue" t={t} />
      <Glow x={cx} y={cy} r={620} color={L.orange} op={0.3 + 0.3 * fill / 0.15} />
      <svg width={PW} height={PH} style={{position: 'absolute', inset: 0}}>
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={L.burgundy} strokeWidth={46} strokeDasharray={c} strokeDashoffset={c * (1 - ringK)} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={L.orange} strokeWidth={46} strokeLinecap="round" strokeDasharray={`${c * fill} ${c}`} opacity={fill > 0.002 ? 1 : 0} />
        </g>
        {Array.from({length: 19}, (_, i) => {
          const an = (-90 + (i + 1) * 18) * (Math.PI / 180);
          return <line key={i} x1={cx + (r - 40) * Math.cos(an)} y1={cy + (r - 40) * Math.sin(an)} x2={cx + (r - 54) * Math.cos(an)} y2={cy + (r - 54) * Math.sin(an)} stroke={L.white} strokeOpacity={0.35 * ringK} strokeWidth={4} />;
        })}
      </svg>
      <Cut src="liver-battery.png" cx={cx} cy={cy + 10 + Math.sin(t * 2.2) * 6} w={700} shadow={0.45}
        style={{transform: `translateY(calc(-50% + ${(1 - liverK) * -700}px)) rotate(${(1 - liverK) * -10}deg)`, opacity: Math.min(1, liverK * 2)}} />
      <div style={{position: 'absolute', left: bx - 85, top: by - 85, width: 170, height: 170, borderRadius: '50%', background: L.orange,
        display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${badgeK})`, boxShadow: '0 14px 30px rgba(0,0,0,0.25)'}}>
        <span style={{fontFamily: EN, fontWeight: 700, fontSize: 52, color: L.ink}}>15%</span>
      </div>
      <Line y={by + 100} style={{left: bx - 200, right: PW - bx - 200}}>
        <span style={{fontSize: 42, color: L.white, opacity: badgeK, display: 'inline-block', transform: `translateY(${(1 - badgeK) * 20}px)`}}>قرب يفصل!</span>
      </Line>
      <Line y={300}><Words text="شحن كبدك" t={t} t0={s.t1} size={140} color={L.white} /></Line>
      <Line y={470}><Words text="كام في المية؟" t={t} t0={s.t2} size={140} color={L.orange} /></Line>
      <div style={{position: 'absolute', left: 40, right: 40, top: 1500, textAlign: 'center', direction: 'ltr'}}>
        {['ALT', 'AST', 'ALP', 'GGT', 'Bilirubin', 'Albumin'].map((x, i) => <Chip key={x} text={x} latin dark k={sp(f, s.chips + i * 0.08, POP, PFPS)} size={34} />)}
      </div>
    </AbsoluteFill>
  );
};

const S3: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = T.s3;
  const n = Math.round(180 * prog(t, s.count, s.countEnd, easeOut));
  const subK = sp(f, s.subject, HEAVY, PFPS);
  const t2 = sp(f, s.t2, POP, PFPS);
  return (
    <AbsoluteFill>
      <Bg kind="sky" t={t} seed={1} />
      <Glow x={560} y={1150} r={640} color="#9FB3EA" op={0.55} />
      <Ring cx={540} cy={1880} r={560} sw={50} k={prog(t, s.enter + 0.2, s.enter + 1.2, easeInOut)} />
      <Cut src="kidney-180.png" cx={560} cy={1160 + (1 - subK) * 260 + Math.sin(t * 1.8) * 6} w={600} shadow={0.18} style={{opacity: Math.min(1, subK * 1.6)}} />
      <Line y={250}><Words text="كليتك بتفلتر حوالي" t={t} t0={s.t1} size={78} color={L.blue} /></Line>
      <div style={{position: 'absolute', left: 60, right: 60, top: 360, direction: 'rtl', display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 26, fontFamily: AR, fontWeight: 800}}>
        <span style={{fontSize: 200, color: L.red, lineHeight: 1, minWidth: 330, textAlign: 'center', opacity: prog(t, s.count - 0.1, s.count + 0.1, easeOut)}}>{arDigits(n)}</span>
        <span style={{fontSize: 92, color: L.blue, lineHeight: 1, opacity: t2, transform: `translateX(${(1 - t2) * -40}px)`, display: 'inline-block'}}>لتر في اليوم!</span>
      </div>
    </AbsoluteFill>
  );
};

const S4: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = T.s4;
  const dk = sp(f, s.dial, {damping: 12, stiffness: 190, mass: 0.75}, PFPS);
  const w = s.words.map((x) => sp(f, x, POP, PFPS));
  const pulse = 0.5 + 0.5 * Math.sin(t * 3);
  const tag = sp(f, s.tag, POP, PFPS);
  const word = (text: string, k: number, x: number, y: number, rot: number, color: string) => (
    <div style={{position: 'absolute', left: x - 260, width: 520, top: y, textAlign: 'center', fontFamily: AR, fontWeight: 800, fontSize: 120, color,
      transform: `scale(${k}) rotate(${rot}deg)`, opacity: Math.min(1, k * 1.5), textShadow: '0 10px 30px rgba(0,0,0,0.25)'}}>{text}</div>
  );
  return (
    <AbsoluteFill>
      <Bg kind="wine" t={t} seed={2} />
      <Glow x={300} y={1060} r={520} color="#3E7BFF" op={0.35 + 0.25 * w[0] * (1 - pulse)} />
      <Glow x={780} y={1060} r={520} color="#FF7A1F" op={0.35 + 0.25 * w[1] * pulse} />
      <svg width={PW} height={PH} style={{position: 'absolute', inset: 0}}>
        {[430, 500, 570].map((r, i) => <circle key={r} cx={540} cy={1060} r={r + ((t * 40 + i * 70) % 70)} fill="none" stroke={L.white} strokeOpacity={0.14 - i * 0.04} strokeWidth={3} />)}
      </svg>
      <Cut src="thyroid-dial.png" cx={540} cy={1060} w={660} shadow={0.45}
        style={{transform: `translateY(-50%) scale(${0.6 + 0.4 * dk}) rotate(${(1 - dk) * -120 + Math.sin(t * 1.6) * 2}deg)`, opacity: Math.min(1, dk * 2)}} />
      {word('برد؟', w[0], 230, 600, -8, L.cold)}
      {word('حر؟', w[1], 850, 600, 8, L.orange)}
      {word('تعب؟', w[2], 540, 1430, -3, L.white)}
      <Line y={280}><Words text="يمكن الغدة الدرقية" t={t} t0={s.t1} size={104} color={L.white} /></Line>
      <div style={{position: 'absolute', left: 0, right: 0, top: 432, textAlign: 'center'}}>
        <span style={{display: 'inline-block', padding: '6px 34px', borderRadius: 999, background: L.orange, fontFamily: EN, fontWeight: 700, fontSize: 52, color: L.ink, transform: `scale(${tag})`}}>TSH</span>
      </div>
    </AbsoluteFill>
  );
};

const S5: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = T.s5;
  const ck = prog(t, s.capsule, s.capsule + 0.95, easeOut);
  const sky = [[90, 150], [70, 230], [110, 180], [60, 280], [120, 200], [80, 260], [100, 170], [70, 300], [110, 210], [90, 190], [100, 240]];
  let x = 0;
  return (
    <AbsoluteFill>
      <Bg kind="blue" t={t} seed={1} />
      <Glow x={540} y={1060} r={720} color={L.orange} op={0.5} />
      <Glow x={540} y={1060} r={330} color="#FFE29A" op={0.65} />
      <svg width={PW} height={PH} style={{position: 'absolute', inset: 0}}>
        <g transform={`rotate(${t * 9} 540 1060)`}>
          {Array.from({length: 24}, (_, i) => {
            const a = (i * 15 * Math.PI) / 180;
            return <line key={i} x1={540 + 280 * Math.cos(a)} y1={1060 + 280 * Math.sin(a)} x2={540 + 760 * Math.cos(a)} y2={1060 + 760 * Math.sin(a)} stroke="#FFD27A" strokeOpacity={0.16} strokeWidth={i % 2 ? 18 : 7} strokeLinecap="round" />;
          })}
        </g>
        {sky.map(([w, h], i) => {
          const r = <rect key={i} x={x} y={1700 - h} width={w - 8} height={h + 300} fill={L.navy} fillOpacity={0.6} />;
          x += w;
          return r;
        })}
      </svg>
      <Cut src="vitd-window.png" cx={540 + (1 - ck) * 900} cy={1080 + Math.sin(t * 2) * 8} w={940} shadow={0.4}
        style={{transform: `translateY(-50%) rotate(${-8 - (1 - ck) * 20}deg)`}} />
      <Line y={320}><Words text="عايش في بلد الشمس.." t={t} t0={s.t1} size={86} color={L.white} /></Line>
      <Line y={470}><Words text="وناقصك فيتامين د؟" t={t} t0={s.t2} size={104} color={L.orange} /></Line>
      <div style={{position: 'absolute', left: 40, right: 40, top: 1380, textAlign: 'center', direction: 'rtl'}}>
        {['تعب مستمر', 'وجع عضم وعضلات', 'ضعف عام'].map((x, i) => <Chip key={x} text={x} dark k={sp(f, s.chips + i * 0.15, POP, PFPS)} size={40} />)}
      </div>
    </AbsoluteFill>
  );
};

const S6: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = T.s6;
  const dk = sp(f, s.drop, HEAVY, PFPS);
  return (
    <AbsoluteFill>
      <Bg kind="light" t={t} seed={2} />
      <Glow x={540} y={1130} r={640} color="#F4B9C2" op={0.6} />
      <Ring cx={540} cy={1150} r={470} sw={54} k={prog(t, s.drop, s.drop + 1.0, easeInOut)} />
      <Cut src="cbc-city.png" cx={540} cy={1170 + Math.sin(t * 1.7) * 6} w={760} shadow={0.22}
        style={{transform: `translateY(-50%) scale(${0.35 + 0.65 * dk})`, opacity: Math.min(1, dk * 2)}} />
      <Line y={260}><Words text="جواك" t={t} t0={s.t1} size={124} color={L.ink} /> <Words text="جيش كامل" t={t} t0={s.t1 + 0.12} size={124} color={L.red} /></Line>
      <Line y={455}><Words text="صورة الدم الكاملة بتطمنك عليه" t={t} t0={s.t2} size={52} color={L.blue} stagger={0.06} /></Line>
      <div style={{position: 'absolute', left: 40, right: 40, top: 560, textAlign: 'center', direction: 'rtl'}}>
        {['الأنيميا', 'الالتهابات', 'الصفايح', 'المناعة'].map((x, i) => <Chip key={x} text={x} k={sp(f, s.labels[0] + i * 0.12, POP, PFPS)} size={34} />)}
      </div>
    </AbsoluteFill>
  );
};

const S9: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = T.s9;
  const k = sp(f, s.subject, HEAVY, PFPS);
  const sq = sp(f, s.squeak, POP, PFPS);
  const shake = t > s.squeak && t < s.squeak + 0.6 ? Math.sin(t * 90) * 6 * (1 - (t - s.squeak) / 0.6) : 0;
  const tests = ['سرعة الترسيب', 'معامل الالتهاب', 'الروماتويد', 'الحمى الروماتيزمية', 'الكالسيوم', 'فيتامين د'];
  return (
    <AbsoluteFill>
      <Bg kind="light" t={t} seed={1} />
      <Glow x={470} y={1000} r={560} color="#FFFFFF" op={0.9} />
      <Ring cx={470} cy={1000} r={420} sw={54} k={prog(t, s.enter + 0.15, s.enter + 1.15, easeInOut)} />
      <Cut src="joints-hinge.png" cx={600 + (1 - k) * 300} cy={1010} w={860} shadow={0.2}
        style={{transform: `translateY(-50%) rotate(${shake * 0.3}deg)`, opacity: Math.min(1, k * 1.6)}} />
      <div style={{position: 'absolute', left: 30, top: 760, width: 420, textAlign: 'center', fontFamily: AR, fontWeight: 800, fontSize: 110, color: L.orange,
        WebkitTextStroke: `14px ${L.white}`, paintOrder: 'stroke', transform: `rotate(-12deg) scale(${sq}) translateX(${shake}px)`, opacity: Math.min(1, sq * 1.5)}}>زيييق!</div>
      <Line y={250}><Words text="مفاصلك" t={t} t0={s.t1} size={130} color={L.ink} /> <Words text="بتزيّق؟" t={t} t0={s.t1 + 0.15} size={130} color={L.red} /></Line>
      <Line y={430}><Words text="قبل ما تزيتها.. اعرف السبب" t={t} t0={s.t2} size={58} color={L.blue} stagger={0.07} /></Line>
      <div style={{position: 'absolute', left: 40, right: 40, top: 1480, textAlign: 'center', direction: 'rtl', lineHeight: 2.2}}>
        {tests.map((x, i) => <Chip key={x} text={x} k={sp(f, s.tests + i * 0.15, POP, PFPS)} size={38} />)}
      </div>
    </AbsoluteFill>
  );
};

const S10: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = T.s10;
  const k = sp(f, s.subject, HEAVY, PFPS);
  const st = sp(f, s.sticker, {damping: 8, stiffness: 200, mass: 0.7}, PFPS);
  const zoom = 1 + 0.05 * prog(t, s.subject, s.exit + 0.6, (x) => x);
  return (
    <AbsoluteFill>
      <Bg kind="lav" t={t} seed={2} />
      <Glow x={600} y={1080} r={620} color="#C9BFEA" op={0.55} />
      <Ring cx={1180} cy={980} r={380} sw={54} k={prog(t, s.enter + 0.15, s.enter + 1.15, easeInOut)} />
      <Cut src="kidney-beans.png" cx={580} cy={1100} w={880} shadow={0.2}
        style={{transform: `translateY(-50%) translateY(${(1 - k) * 220}px) scale(${zoom})`, opacity: Math.min(1, k * 1.6)}} />
      <Line y={240}><Words text="مش فاصوليا.." t={t} t0={s.t1} size={120} color={L.red} /></Line>
      <Line y={400}><Words text="دي كليتك!" t={t} t0={s.t2} size={160} color={L.blue} /></Line>
      <div style={{position: 'absolute', left: 70, top: 1440, width: 300, height: 300, borderRadius: '50%', background: L.orange,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: AR, fontWeight: 800, fontSize: 50, lineHeight: 1.15,
        color: L.ink, transform: `rotate(-10deg) scale(${st})`, boxShadow: '0 16px 34px rgba(0,0,0,0.2)', direction: 'rtl'}}>
        <span>الكلى</span><span>بتشتغل</span><span>في صمت</span>
      </div>
    </AbsoluteFill>
  );
};

const S7: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = T.s7;
  const words = [['دقة', L.white], ['سرعة', L.orange], ['جودة', L.white]] as const;
  const rowK = prog(t, s.line - 0.15, s.line + 0.5, easeOut);
  const bar = prog(t, s.line + 0.25, s.line + 0.85, easeOut);
  return (
    <AbsoluteFill>
      <Bg kind="wine" t={t} />
      {words.map(([w, col], i) => {
        const k = sp(f, s.w[i], POP, PFPS);
        const nextT = i < 2 ? s.w[i + 1] : s.line - 0.15;
        const o = prog(t, nextT - 0.05, nextT + 0.25, easeIn);
        if (t < s.w[i] - 0.02 || o >= 1) return null;
        return (
          <div key={w} style={{position: 'absolute', left: 0, right: 0, top: 700, textAlign: 'center', fontFamily: AR, fontWeight: 800, fontSize: 340, color: col, lineHeight: 1,
            transform: `scale(${(1.6 - 0.6 * k) * (1 - 0.3 * o)})`, opacity: Math.min(1, k * 1.6) * (1 - o)}}>{w}</div>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 0, top: 760, textAlign: 'center', direction: 'rtl', fontFamily: AR, fontWeight: 800, fontSize: 120,
        opacity: rowK, transform: `translateY(${(1 - rowK) * 40}px)`}}>
        <span style={{color: L.white}}>دقة</span><span style={{color: L.orange}}> · </span>
        <span style={{color: L.orange}}>سرعة</span><span style={{color: L.orange}}> · </span>
        <span style={{color: L.white}}>جودة</span>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 960, textAlign: 'center'}}>
        <span style={{display: 'inline-block', background: L.blue, padding: '10px 50px', fontFamily: AR, fontWeight: 800, fontSize: 84, color: L.white,
          clipPath: `inset(0 0 0 ${(1 - bar) * 100}%)`}}>نظام آلي متكامل</span>
      </div>
    </AbsoluteFill>
  );
};

const S8: React.FC<{t: number; f: number}> = ({t, f}) => {
  const s = T.s8;
  const stripe = prog(t, s.stripe, s.stripe + 0.55, easeOut);
  const arm = prog(t, s.arm, s.arm + 0.7, easeInOut);
  const tube = sp(f, s.tube, HEAVY, PFPS);
  const cta = sp(f, s.cta, POP, PFPS);
  const contact = prog(t, s.contact, s.contact + 0.6, easeOut);
  const sc = 620 / 524;
  return (
    <AbsoluteFill>
      <Bg kind="light" t={t} />
      <Ring cx={-60} cy={-40} r={330} sw={54} k={prog(t, s.enter + 0.1, s.enter + 1.1, easeInOut)} />
      <Ring cx={1140} cy={1980} r={330} sw={54} k={prog(t, s.enter + 0.2, s.enter + 1.2, easeInOut)} />
      <svg width={PW} height={PH} style={{position: 'absolute', inset: 0}}>
        <defs><clipPath id="armclip"><rect x={-2} y={-20} width={530 * arm} height={560} /></clipPath></defs>
        <g transform={`translate(${540 - 262 * sc},${330}) scale(${sc}) translate(2,14)`}>
          <path d={MARK.stripe} fill={L.red} style={{transform: `scaleX(${stripe})`, transformOrigin: '18px 480px'}} />
          <path d={MARK.arm} fill={L.blue} clipPath="url(#armclip)" />
          <g transform={`translate(0,${(1 - tube) * -320})`} opacity={Math.min(1, tube * 2)}>
            <g transform="translate(229,174) rotate(15)" fill={L.blue}>
              <rect x={-46} y={-180} width={92} height={24} rx={9} />
              <rect x={-25} y={-160} width={50} height={40} rx={4} />
              <rect x={-36} y={-124} width={72} height={196} rx={8} />
              <path d="M-30,68 L30,68 L22,108 Q0,118 -22,108 Z" />
              <path fillRule="evenodd" d="M58,-20 m-52,0 a52,52 0 1,0 104,0 a52,52 0 1,0 -104,0 Z M58,-20 m-28,0 a28,28 0 1,1 56,0 a28,28 0 1,1 -56,0 Z" />
            </g>
          </g>
          {MARK.bubbles.map(([x, y, r], i) => {
            const k = sp(f, s.bubbles[i], POP, PFPS);
            return <circle key={i} cx={x} cy={y} r={r * k} fill={L.red} />;
          })}
        </g>
      </svg>
      <Line y={1010}><Words text="معمل العاصمة" t={t} t0={s.name} size={140} color={L.red} /></Line>
      <Line y={1200}><Words text="للتحاليل الطبية" t={t} t0={s.sub} size={86} color={L.blue} /></Line>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1335, textAlign: 'center', fontFamily: EN, fontWeight: 700, fontSize: 36, letterSpacing: '0.32em',
        opacity: prog(t, s.sub + 0.2, s.sub + 0.7, easeOut)}}>
        <span style={{color: L.red}}>A</span><span style={{color: L.blue}}>L ASEMA LAB</span>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1420, textAlign: 'center'}}>
        <span style={{display: 'inline-block', padding: '14px 60px', borderRadius: 999, background: L.burgundy, color: L.white, fontFamily: AR, fontWeight: 800, fontSize: 58,
          transform: `scale(${cta})`, boxShadow: '0 14px 30px rgba(92,14,29,0.3)'}}>احجز دلوقتي</span>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1560, textAlign: 'center', opacity: contact, transform: `translateY(${(1 - contact) * 20}px)`}}>
        <div style={{fontFamily: EN, fontWeight: 700, fontSize: 50, color: L.blue, letterSpacing: '0.03em'}}>01096534354 · 01019289733</div>
        <div style={{fontFamily: AR, fontWeight: 600, fontSize: 31, color: L.gray, direction: 'rtl', marginTop: 10}}>
          ميت غمر · برج دهب · شارع الجيش · ناصية شارع أبوسنة
        </div>
        <div style={{fontFamily: AR, fontWeight: 600, fontSize: 31, color: L.gray, direction: 'rtl'}}>أعلى التوحيد والنور · الدور الأول</div>
      </div>
    </AbsoluteFill>
  );
};

/** White logo tab hanging from the top edge, shown from scene 2 until the logo becomes the hero. */
const LogoTab: React.FC<{t: number}> = ({t}) => {
  const k = prog(t, T.s2.enter + 0.3, T.s2.enter + 0.9, easeOut) * (1 - prog(t, T.s8.enter - 0.1, T.s8.enter + 0.3, easeIn));
  if (k <= 0) return null;
  return (
    <div style={{position: 'absolute', right: 50, top: 0, width: 380, height: 150, background: L.white, borderRadius: '0 0 30px 30px',
      boxShadow: '0 10px 26px rgba(0,0,0,0.18)', transform: `translateY(${(1 - k) * -170}px)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <Img src={asset('logo-horizontal-color.svg')} style={{width: 330}} />
    </div>
  );
};

export const AsemaPromo: React.FC = () => {
  useAsemaFonts();
  const f = useCurrentFrame();
  const t = f / PFPS;
  return (
    <AbsoluteFill style={{background: L.white}}>
      <Scene t={t} enter={0} next={T.s2.enter} ox={540} oy={1260} first><S1 t={t} f={f} /></Scene>
      <Scene t={t} enter={T.s2.enter} next={T.s3.enter} ox={540} oy={1260}><S2 t={t} f={f} /></Scene>
      <Scene t={t} enter={T.s3.enter} next={T.s4.enter} ox={780} oy={700}><S3 t={t} f={f} /></Scene>
      <Scene t={t} enter={T.s4.enter} next={T.s5.enter} ox={1080} oy={960}><S4 t={t} f={f} /></Scene>
      <Scene t={t} enter={T.s5.enter} next={T.s9.enter} ox={540} oy={1060}><S5 t={t} f={f} /></Scene>
      <Scene t={t} enter={T.s9.enter} next={T.s6.enter} ox={540} oy={1060}><S9 t={t} f={f} /></Scene>
      <Scene t={t} enter={T.s6.enter} next={T.s10.enter} ox={470} oy={1000}><S6 t={t} f={f} /></Scene>
      <Scene t={t} enter={T.s10.enter} next={T.s7.enter} ox={540} oy={1170}><S10 t={t} f={f} /></Scene>
      <Scene t={t} enter={T.s7.enter} next={T.s8.enter} ox={580} oy={1100}><S7 t={t} f={f} /></Scene>
      <Scene t={t} enter={T.s8.enter} next={T.duration + 5} ox={540} oy={960}><S8 t={t} f={f} /></Scene>
      <LogoTab t={t} />
      <Grain frame={f} opacity={0.05} />
    </AbsoluteFill>
  );
};
