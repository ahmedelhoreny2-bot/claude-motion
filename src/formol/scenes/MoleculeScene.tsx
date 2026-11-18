import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp01, easeIn, easeInOut, easeOut, prog} from '../../lib';
import {Atom, Bond, lerp3, Molecule3D, MolShadow, V3} from '../mol3d';
import {alpha, F, FPS, H, P, T, W, sp} from '../theme';
import {ArWords, Burst, Ltr, Tag} from '../ui';

const A = T.amino;
const R = T.react;

const NEAR: V3 = [3.75, -1.35, 0.3];
const FAR: V3 = [8.5, -6.5, 1.5];
const CF_END: V3 = [2.75, -0.6, 0];
const OF_REL: V3 = [0.85, -0.85, 0];
const WATER_AWAY: V3 = [7.5, -5.5, 0.8];

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** Atoms and bonds of amino acid + formaldehyde at time t. */
const molecule = (t: number) => {
  const frame = t * FPS;
  const approach = prog(t, R.hcho, R.approach, easeOut) * 0.75 + prog(t, R.approach, R.hit, easeInOut) * 0.25;
  const c = lerp3(FAR, NEAR, approach);
  const k = prog(t, R.hit - 0.1, R.hit + 0.6, easeInOut);
  const fly = prog(t, R.water + 0.7, R.water + 2.6, easeIn);
  const hchoIn = prog(t, R.hcho, R.hcho + 0.4);

  const amineGlow = band01(t, A.amine, A.amine + 0.5) * (1 - prog(t, R.lock, R.lock + 0.6));
  const acidBase = band01(t, A.carboxyl, A.carboxyl + 0.5);
  const acidHero = prog(t, R.acid, R.acid + 0.5, easeOut);
  const pulse = 0.75 + 0.25 * Math.sin(t * 6);
  const acidGlow = clamp01(acidBase * 0.85 * (1 - 0.6 * prog(t, A.cancel, A.cancel + 0.6)) + acidHero * pulse);
  const amineK = clamp01(amineGlow * (1 - 0.6 * prog(t, A.cancel, A.cancel + 0.6)) + 0.6 * prog(t, R.hcho, R.hcho + 0.5) * (1 - k));

  const of0 = add(c, OF_REL);
  const W0 = of0;
  const wc = lerp3(W0, WATER_AWAY, fly);
  const wo = 1 - prog(t, R.water + 1.8, R.water + 2.6);
  const hn1Start: V3 = [2.2, 0.15, 0.55];
  const hn2Start: V3 = [2.05, -1.35, -0.5];
  const hn1 = lerp3(hn1Start, add(wc, [-0.62, 0.48, 0.2]), k);
  const hn2 = lerp3(hn2Start, add(wc, [0.62, 0.48, -0.2]), k);
  const cf = lerp3(c, CF_END, k);
  const of = k < 1 ? lerp3(of0, wc, k) : wc;
  const hf1 = lerp3(add(c, [-0.35, 0.95, 0.5]), add(CF_END, [0.6, 0.9, 0.4]), k);
  const hf2 = lerp3(add(c, [0.45, 0.75, -0.8]), add(CF_END, [0.55, -0.95, -0.35]), k);

  const atoms: Atom[] = [
    {id: 'Ca', el: 'C', p: [0, 0, 0]},
    {id: 'R', el: 'R', p: [0, 1.55, -0.35]},
    {id: 'Ha', el: 'H', p: [-0.25, -0.75, 1.0]},
    {id: 'N', el: 'N', p: [1.45, -0.55, 0], glow: P.cyan, gk: amineK},
    {id: 'HN1', el: 'H', p: hn1, glow: P.cyan, gk: amineK * 0.7, o: k > 0.5 ? wo : 1},
    {id: 'HN2', el: 'H', p: hn2, glow: P.cyan, gk: amineK * 0.7, o: k > 0.5 ? wo : 1},
    {id: 'Cc', el: 'C', p: [-1.5, -0.5, 0], glow: P.red, gk: acidGlow},
    {id: 'O1', el: 'O', p: [-1.75, -1.7, 0.35], glow: P.red, gk: acidGlow},
    {id: 'O2', el: 'O', p: [-2.55, 0.35, -0.25], glow: P.red, gk: acidGlow},
    {id: 'HO', el: 'H', p: [-3.35, -0.1, -0.35], glow: P.red, gk: acidGlow},
    {id: 'Cf', el: 'C', p: cf, o: hchoIn, glow: P.lime, gk: 0.8 * hchoIn * (1 - prog(t, R.lock, R.lock + 1))},
    {id: 'Of', el: 'O', p: of, o: hchoIn * wo},
    {id: 'Hf1', el: 'H', p: hf1, o: hchoIn},
    {id: 'Hf2', el: 'H', p: hf2, o: hchoIn},
  ];
  const kk = clamp01((k - 0.35) / 0.4);
  const bonds: Bond[] = [
    {a: 'Ca', b: 'R'},
    {a: 'Ca', b: 'Ha'},
    {a: 'Ca', b: 'N'},
    {a: 'Ca', b: 'Cc'},
    {a: 'N', b: 'HN1', o: 1 - clamp01(k * 2.5)},
    {a: 'N', b: 'HN2', o: 1 - clamp01(k * 2.5)},
    {a: 'Cc', b: 'O1', order: 2},
    {a: 'Cc', b: 'O2'},
    {a: 'O2', b: 'HO'},
    {a: 'Cf', b: 'Of', order: 2, o: 1 - clamp01(k * 2.5)},
    {a: 'Cf', b: 'Hf1'},
    {a: 'Cf', b: 'Hf2'},
    {a: 'N', b: 'Cf', order: 2, o: kk},
    {a: 'Of', b: 'HN1', o: kk},
    {a: 'Of', b: 'HN2', o: kk},
  ];
  void frame;
  return {atoms, bonds, wc, wo};
};

const band01 = (t: number, a: number, b: number) => prog(t, a, b, easeOut);

/** Same projection as Molecule3D, for pinning 2D overlays to an atom. */
const project = (p: V3, yaw: number, pitch: number, scale: number, cx: number, cy: number, persp = 9) => {
  const x1 = p[0] * Math.cos(yaw) + p[2] * Math.sin(yaw);
  const z1 = -p[0] * Math.sin(yaw) + p[2] * Math.cos(yaw);
  const y2 = p[1] * Math.cos(pitch) - z1 * Math.sin(pitch);
  const z2 = p[1] * Math.sin(pitch) + z1 * Math.cos(pitch);
  const f = persp / (persp - z2);
  return {x: cx + x1 * scale * f, y: cy + y2 * scale * f};
};

const Seesaw: React.FC<{t: number}> = ({t}) => {
  const frame = t * FPS;
  const k = sp(frame, A.seesaw, {damping: 15, stiffness: 150});
  const out = prog(t, R.hcho - 0.4, R.hcho + 0.1, easeIn);
  if (k <= 0.001 || out >= 1) return null;
  const blueDrop = sp(frame, A.seesaw + 0.3, {damping: 12, stiffness: 200});
  const redDrop = sp(frame, A.cancel - 0.4, {damping: 12, stiffness: 200});
  const tiltIn = sp(frame, A.seesaw + 0.45, {damping: 8, stiffness: 120});
  const level = sp(frame, A.cancel - 0.25, {damping: 7, stiffness: 140});
  const ang = 11 * tiltIn * (1 - level);
  const cx = 960;
  const cy = 815;
  const L = 300;
  const rad = (ang * Math.PI) / 180;
  const end = (s: number) => ({x: cx + s * L * Math.cos(rad), y: cy + s * L * Math.sin(rad)});
  const right = end(1);
  const left = end(-1);
  const ball = (p: {x: number; y: number}, drop: number, color: string, label: string) => (
    <g transform={`translate(${p.x} ${p.y - 48 - (1 - drop) * 260})`} opacity={clamp01(drop * 3)}>
      <circle r={46} fill={color} />
      <circle r={46} fill="url(#ssShine)" />
      <text y={12} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={label.length > 3 ? 26 : 30} fill="#fff">
        {label}
      </text>
    </g>
  );
  const eqK = sp(frame, A.cancel + 0.2, {damping: 10, stiffness: 200});
  return (
    <div style={{position: 'absolute', inset: 0, opacity: k * (1 - out), transform: `translateY(${(1 - k) * 80}px)`}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="ssShine" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fff" stopOpacity={0.6} />
            <stop offset="50%" stopColor="#fff" stopOpacity={0} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.35} />
          </radialGradient>
          <linearGradient id="beam" x1="0" x2="1">
            <stop offset="0%" stopColor={P.red} />
            <stop offset="50%" stopColor="#E8ECFF" />
            <stop offset="100%" stopColor={P.cyan} />
          </linearGradient>
        </defs>
        <polygon points={`${cx},${cy + 6} ${cx - 46},${cy + 92} ${cx + 46},${cy + 92}`} fill="#C9CFF2" opacity={0.9} />
        <line x1={left.x} y1={left.y} x2={right.x} y2={right.y} stroke="url(#beam)" strokeWidth={16} strokeLinecap="round" />
        {ball(right, blueDrop, P.blue, 'NH₂')}
        {ball(left, redDrop, P.red, 'COOH')}
      </svg>
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          left: cx,
          top: cy - 120,
          transform: `translate(-50%,-50%) scale(${eqK})`,
          fontFamily: F.display,
          fontSize: 44,
          color: P.text,
          padding: '6px 28px 2px',
          borderRadius: 18,
          background: 'rgba(6,10,34,0.65)',
          border: `1.5px solid ${P.line}`,
          whiteSpace: 'nowrap',
        }}
      >
        ⚖ متعادل
      </div>
    </div>
  );
};

const Lock: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
    <g transform={`translate(${x} ${y}) scale(${k}) rotate(${(1 - k) * 30})`} opacity={clamp01(k * 2)}>
      <circle r={58} fill="rgba(6,10,34,0.75)" stroke={P.lime} strokeWidth={4} />
      <path d="M -16 -6 V -18 a 16 16 0 0 1 32 0 V -6" fill="none" stroke={P.lime} strokeWidth={7} strokeLinecap="round" />
      <rect x={-24} y={-8} width={48} height={38} rx={8} fill={P.lime} />
      <circle cx={0} cy={8} r={5} fill={P.ink} />
      <rect x={-2} y={8} width={4} height={12} fill={P.ink} />
    </g>
  </svg>
);

const EQ: {s: string; c: string}[] = [
  {s: 'R–CH(', c: P.text},
  {s: 'NH₂', c: P.cyan},
  {s: ')–', c: P.text},
  {s: 'COOH', c: P.red},
  {s: ' + ', c: P.muted},
  {s: 'HCHO', c: P.lime},
  {s: ' ⟶ ', c: P.gold},
  {s: 'R–CH(', c: P.text},
  {s: 'N=CH₂', c: P.lime},
  {s: ')–', c: P.text},
  {s: 'COOH', c: P.red},
  {s: ' + ', c: P.muted},
  {s: 'H₂O', c: '#9FD8FF'},
];

const Equation: React.FC<{t: number}> = ({t}) => {
  const frame = t * FPS;
  const k = sp(frame, R.eq, {damping: 16, stiffness: 150});
  const o = prog(t, R.exit, R.exit + 0.4, easeIn);
  if (k <= 0.001 || o >= 1) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 790,
        display: 'flex',
        justifyContent: 'center',
        opacity: clamp01(k * 1.5) * (1 - o),
        transform: `translateY(${(1 - k) * 50}px)`,
      }}
    >
      <div
        style={{
          padding: '18px 40px',
          borderRadius: 26,
          background: 'rgba(6,10,34,0.7)',
          border: `1.5px solid ${alpha(P.gold, 0.45)}`,
          boxShadow: `0 0 40px ${alpha(P.gold, 0.15)}`,
        }}
      >
        <Ltr style={{fontFamily: F.mono, fontWeight: 700, fontSize: 40, whiteSpace: 'pre'}}>
          {EQ.map((e, i) => {
            const kk = prog(t, R.eq + 0.2 + i * 0.09, R.eq + 0.6 + i * 0.09, easeOut);
            return (
              <span key={i} style={{color: e.c, opacity: kk, display: 'inline-block', transform: `translateY(${(1 - kk) * 20}px)`}}>
                {e.s}
              </span>
            );
          })}
        </Ltr>
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: F.body, fontWeight: 700, fontSize: 24, color: P.dim, direction: 'rtl'}}>
          <span style={{opacity: prog(t, R.eq + 1.6, R.eq + 2.1)}}>مشتق ميثيلين — حامضي ✓</span>
          <span style={{opacity: prog(t, R.eq + 1.3, R.eq + 1.8)}}>حمض أميني + فورمالدهيد</span>
        </div>
      </div>
    </div>
  );
};

const CHIPS: {s: React.ReactNode; c: string}[] = [
  {s: <>كل <Ltr style={{fontFamily: F.mono}}>COOH</Ltr> يتعادل</>, c: P.red},
  {s: 'حمض أميني', c: P.violet},
  {s: 'بروتين', c: P.gold},
];

const Chips: React.FC<{t: number}> = ({t}) => {
  const frame = t * FPS;
  const o = prog(t, R.exit, R.exit + 0.4, easeIn);
  if (t < R.chips[0] || o >= 1) return null;
  return (
    <div dir="rtl" style={{position: 'absolute', top: 96, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 26, opacity: 1 - o}}>
      {CHIPS.map((c, i) => {
        const k = sp(frame, R.chips[i], {damping: 10, stiffness: 220, mass: 0.7});
        return (
          <React.Fragment key={i}>
            {i > 0 ? (
              <span style={{fontFamily: F.display, fontSize: 60, color: P.gold, opacity: k, transform: `scale(${k})`, display: 'inline-block'}}>=</span>
            ) : null}
            <div
              style={{
                transform: `scale(${k})`,
                padding: '8px 34px 14px',
                borderRadius: 999,
                background: `linear-gradient(135deg, ${c.c}, ${alpha(c.c, 0.7)})`,
                color: P.ink,
                fontFamily: F.display,
                fontSize: 48,
                boxShadow: `0 12px 36px ${alpha(c.c, 0.5)}, inset 0 2px 0 rgba(255,255,255,0.5)`,
                whiteSpace: 'nowrap',
              }}
            >
              {c.s}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const MoleculeScene: React.FC<{t: number}> = ({t}) => {
  if (t < A.enter - 0.2 || t > R.exit + 1.2) return null;
  const frame = t * FPS;
  const enter = sp(frame, A.mol, {damping: 16, stiffness: 120});
  const exit = prog(t, R.exit, R.exit + 1.0, easeInOut);
  const spin = (1 - prog(t, A.mol, A.mol + 2.2, easeOut)) * 4.2;
  const reacting = prog(t, R.hcho, R.approach, easeInOut);
  const yaw = spin + 0.32 * Math.sin(t * 0.55) * (1 - 0.6 * reacting) - 0.15 * reacting;
  const pitch = -0.12 + 0.12 * Math.sin(t * 0.4);
  const zoom = 1 + 0.08 * prog(t, R.hcho, R.hit, easeInOut) - 0.2 * prog(t, R.eq - 0.5, R.eq + 0.5, easeInOut);
  const scale = 118 * zoom * (0.4 + 0.6 * enter) * (1 - 0.94 * exit);
  const lift = 25 * prog(t, R.eq - 0.5, R.eq + 0.5, easeInOut);
  const cx = 1010 + (560 - 1010) * exit;
  const cy = 450 + lift + Math.sin(t * 1.1) * 6 + (820 - 450) * exit;
  const {atoms, bonds, wc, wo} = molecule(t);
  const N = project([1.45, -0.55, 0], yaw, pitch, scale, cx, cy);
  const Cc = project([-1.9, -0.6, 0], yaw, pitch, scale, cx, cy);
  const Wp = project(wc, yaw, pitch, scale, cx, cy);
  const Hp = project(lerp3(FAR, NEAR, prog(t, R.hcho, R.approach, easeOut)), yaw, pitch, scale, cx, cy);
  const lockK = sp(frame, R.lock, {damping: 9, stiffness: 200, mass: 0.7}) * (1 - prog(t, R.eq - 0.4, R.eq, easeIn));
  const flash = 1 - prog(t, R.hit, R.hit + 0.5, easeOut);
  const fadeIn = clamp01((t - A.enter) / 0.4);

  return (
    <AbsoluteFill style={{opacity: fadeIn * (1 - prog(t, R.exit + 0.6, R.exit + 1.1))}}>
      {t >= R.hit && t < R.hit + 0.5 ? (
        <AbsoluteFill style={{background: `radial-gradient(circle 700px at ${N.x}px ${N.y}px, ${alpha(P.lime, 0.4 * flash)} 0%, rgba(0,0,0,0) 70%)`}} />
      ) : null}
      <MolShadow cx={cx} cy={cy + 330 * (scale / 118)} w={640 * (scale / 118)} o={enter * (1 - exit)} />
      <Molecule3D uid="aa" atoms={atoms} bonds={bonds} yaw={yaw} pitch={pitch} scale={scale} cx={cx} cy={cy} width={W} height={H} />
      <Burst t={t} at={R.hit} x={N.x + 60} y={N.y} color={P.lime} r={220} />
      {lockK > 0.001 ? <Lock x={N.x + 20} y={N.y - 150} k={lockK} /> : null}

      {/* title of the molecule scene */}
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          top: 70,
          right: 90,
          fontFamily: F.display,
          fontSize: 58,
          color: P.text,
          opacity: 1 - prog(t, R.hcho - 0.3, R.hcho + 0.1, easeIn),
        }}
      >
        <ArWords text="تركيب الحمض الأميني" t={t} at={A.mol + 0.3} />
      </div>

      {/* amino-acid scene labels */}
      <Tag t={t} at={A.amine} out={R.hcho - 0.4} x={1560} y={250} tx={N.x + 40} ty={N.y - 10} color={P.cyan}>
        مجموعة أمين <Ltr style={{fontFamily: F.mono}}>NH₂</Ltr> · قاعدي
      </Tag>
      <Tag t={t} at={A.carboxyl} out={R.hcho - 0.4} x={380} y={250} tx={Cc.x - 20} ty={Cc.y - 20} color={P.red}>
        مجموعة كربوكسيل <Ltr style={{fontFamily: F.mono}}>COOH</Ltr> · حامضي
      </Tag>
      <Tag t={t} at={A.note} out={R.hcho - 0.4} x={1480} y={850} color={P.gold} size={32}>
        ⛔ مينفعش نعايره مباشرة
      </Tag>
      <Seesaw t={t} />

      {/* reaction labels */}
      <Tag t={t} at={R.hcho + 0.5} out={R.hit - 0.3} x={Math.min(Hp.x + 40, 1700)} y={Math.max(Hp.y - 110, 120)} color={P.lime}>
        فورمالدهيد <Ltr style={{fontFamily: F.mono}}>HCHO</Ltr>
      </Tag>
      {wo > 0.05 && t > R.water + 0.5 ? (
        <div
          style={{
            position: 'absolute',
            left: Wp.x,
            top: Wp.y - 80,
            transform: 'translate(-50%,-50%)',
            fontFamily: F.mono,
            fontWeight: 700,
            fontSize: 38,
            color: '#9FD8FF',
            opacity: wo * prog(t, R.water + 0.5, R.water + 0.8),
            textShadow: '0 0 20px rgba(80,170,255,0.8)',
          }}
        >
          H₂O ↗
        </div>
      ) : null}
      <Tag t={t} at={R.lock + 0.2} out={R.eq - 0.4} x={1560} y={620} color={P.lime} size={30}>
        التأثير القاعدي اتلغى
      </Tag>
      <Tag t={t} at={R.acid} out={R.eq - 0.4} x={380} y={620} tx={Cc.x} ty={Cc.y + 20} color={P.red} size={30}>
        <Ltr style={{fontFamily: F.mono}}>COOH</Ltr> حرّة ← حامضي ✓
      </Tag>
      <Equation t={t} />
      <Chips t={t} />
    </AbsoluteFill>
  );
};
