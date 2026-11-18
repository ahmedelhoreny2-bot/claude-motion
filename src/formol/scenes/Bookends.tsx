import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog, rand} from '../../lib';
import {alpha, F, FPS, H, P, T, W, sp} from '../theme';
import {ArWords, Burst, Ltr, Tag} from '../ui';
void easeInOut;

const I = T.intro;
const O = T.outro;

const LogoCard: React.FC<{src: string; w: number; h: number; k: number; pad?: number; round?: number}> = ({src, w, h, k, pad = 14, round = 34}) => (
  <div
    style={{
      width: w,
      height: h,
      padding: pad,
      borderRadius: round,
      background: '#FFFFFF',
      boxShadow: `0 20px 60px rgba(0,0,0,0.45), 0 0 0 4px ${alpha(P.gold, 0.6)}, 0 0 60px ${alpha(P.cyan, 0.25)}`,
      transform: `scale(${k}) rotate(${(1 - k) * 12}deg)`,
      opacity: clamp01(k * 2),
      boxSizing: 'border-box',
    }}
  >
    <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
);

/** Milk drop → crown splash → ripples; returns nothing outside its window. */
const Splash: React.FC<{t: number; x: number; y: number}> = ({t, x, y}) => {
  const fall = prog(t, I.drop, I.splash, easeIn);
  const s = t - I.splash;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs>
        <radialGradient id="milkDrop" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor={P.milk} />
          <stop offset="100%" stopColor="#D9CBB8" />
        </radialGradient>
      </defs>
      {s < 0 ? (
        <g transform={`translate(${x} ${lerp(-80, y, fall)}) scale(${1 - fall * 0.1} ${1 + fall * 0.35})`}>
          <path d="M 0 -42 C 14 -18 26 -4 26 10 A 26 26 0 1 1 -26 10 C -26 -4 -14 -18 0 -42 Z" fill="url(#milkDrop)" />
        </g>
      ) : null}
      {s >= 0 && s < 3.5
        ? [0, 0.25, 0.5, 0.8].map((d, i) => {
            const k = clamp01((s - d) / 2.4);
            if (k <= 0 || k >= 1) return null;
            return <ellipse key={i} cx={x} cy={y} rx={60 + 760 * easeOut(k)} ry={(60 + 760 * easeOut(k)) * 0.22} fill="none" stroke={i % 2 ? P.cyan : P.milk} strokeWidth={6 * (1 - k)} opacity={0.8 * (1 - k)} />;
          })
        : null}
      {s >= 0 && s < 1.6
        ? Array.from({length: 18}, (_, i) => {
            const a = Math.PI + (i / 17) * Math.PI;
            const v = 520 + rand(i) * 380;
            const tt = s;
            const px = x + Math.cos(a) * v * tt * 0.9;
            const py = y + Math.sin(a) * v * tt * 0.75 + 900 * tt * tt;
            const r = 6 + rand(i * 3) * 10;
            return <circle key={i} cx={px} cy={py} r={r * (1 - s / 1.6)} fill={i % 4 === 0 ? P.gold : P.milk} opacity={1 - s / 1.6} />;
          })
        : null}
    </svg>
  );
};

export const Intro: React.FC<{t: number}> = ({t}) => {
  if (t > I.exit + 0.8) return null;
  const frame = t * FPS;
  const out = prog(t, I.exit, I.exit + 0.6, easeIn);
  const logoK = sp(frame, I.logo, {damping: 11, stiffness: 160});
  const logoK2 = sp(frame, I.logo + 0.18, {damping: 11, stiffness: 160});
  return (
    <AbsoluteFill style={{opacity: 1 - out, transform: `translateY(${-out * 60}px)`}}>
      <Splash t={t} x={960} y={640} />
      <div style={{position: 'absolute', top: 60, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 40, direction: 'rtl'}}>
        <LogoCard src="asu-logo.jpg" w={200} h={200} k={logoK} />
        <LogoCard src="fst-logo.png" w={320} h={200} k={logoK2} pad={10} />
      </div>
      <div dir="rtl" style={{position: 'absolute', top: 290, left: 0, right: 0, textAlign: 'center', fontFamily: F.display, fontSize: 54, color: P.text}}>
        <ArWords text="جامعة عين شمس" t={t} at={I.uni} />
      </div>
      <div dir="rtl" style={{position: 'absolute', top: 370, left: 0, right: 0, textAlign: 'center', fontFamily: F.body, fontWeight: 700, fontSize: 36, color: P.dim}}>
        <ArWords text="كلية الزراعة" t={t} at={I.fac} style={{color: P.lime}} /> <span style={{opacity: prog(t, I.dept, I.dept + 0.3), margin: '0 14px', color: P.gold}}>◆</span>{' '}
        <ArWords text="قسم علوم الأغذية" t={t} at={I.dept} style={{color: P.cyan}} />
      </div>
      <div dir="rtl" style={{position: 'absolute', top: 500, left: 0, right: 0, textAlign: 'center', fontFamily: F.display, fontSize: 112, lineHeight: 1.25, color: P.text, textShadow: '0 10px 40px rgba(0,0,0,0.5)'}}>
        <ArWords text="تقدير نسبة البروتين في اللبن" t={t} at={I.title} stagger={0.1} />
      </div>
      <div dir="rtl" style={{position: 'absolute', top: 650, left: 0, right: 0, textAlign: 'center', fontFamily: F.display, fontSize: 96, lineHeight: 1.25}}>
        <ArWords
          text="بطريقة الفورمول"
          t={t}
          at={I.title2}
          stagger={0.12}
          wordStyle={() => ({
            backgroundImage: `linear-gradient(100deg, ${P.pink} 0%, ${P.orange} 50%, ${P.gold} 100%)`,
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          })}
        />
      </div>
      <div style={{position: 'absolute', top: 805, left: 0, right: 0, textAlign: 'center', opacity: prog(t, I.en, I.en + 0.6), transform: `translateY(${(1 - prog(t, I.en, I.en + 0.8, easeOut)) * 20}px)`}}>
        <Ltr style={{fontFamily: F.mono, fontWeight: 700, fontSize: 30, letterSpacing: '0.32em', color: P.dim}}>FORMOL TITRATION METHOD</Ltr>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- protein */

const PR = T.protein;
const BEAD_COLORS = [P.violet, P.cyan, P.pink, P.gold, P.lime, P.orange];
const HERO = 5;

const MilkGlass: React.FC<{x: number; y: number; k: number; t: number}> = ({x, y, k, t}) => {
  const w = 250;
  const h = 360;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: k}}>
      <defs>
        <linearGradient id="mgMilk" x1="0" x2="1">
          <stop offset="0%" stopColor="#E9DFCF" />
          <stop offset="35%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#D8CCBA" />
        </linearGradient>
      </defs>
      <g transform={`translate(${x} ${y + (1 - k) * 120})`}>
        <ellipse cx={0} cy={6} rx={w * 0.62} ry={22} fill="rgba(0,0,0,0.35)" />
        <path d={`M ${-w / 2} ${-h} L ${-w / 2 + 16} 0 L ${w / 2 - 16} 0 L ${w / 2} ${-h} Z`} fill="rgba(255,255,255,0.08)" />
        <path d={`M ${-w / 2 + 6} ${-h * 0.8} L ${-w / 2 + 20} -8 L ${w / 2 - 20} -8 L ${w / 2 - 6} ${-h * 0.8} Z`} fill="url(#mgMilk)" />
        <ellipse cx={0} cy={-h * 0.8} rx={w / 2 - 6} ry={20} fill="#FFFDF7" />
        <ellipse cx={-30 + Math.sin(t * 2) * 6} cy={-h * 0.8 - 2} rx={50} ry={6} fill="rgba(255,255,255,0.9)" />
        <path d={`M ${-w / 2} ${-h} L ${-w / 2 + 16} 0 L ${w / 2 - 16} 0 L ${w / 2} ${-h}`} fill="none" stroke="rgba(235,242,255,0.9)" strokeWidth={4} />
        <ellipse cx={0} cy={-h} rx={w / 2} ry={22} fill="none" stroke="rgba(235,242,255,0.9)" strokeWidth={4} />
        <line x1={-w / 2 + 22} y1={-h + 30} x2={-w / 2 + 34} y2={-30} stroke="rgba(255,255,255,0.6)" strokeWidth={8} strokeLinecap="round" />
      </g>
    </svg>
  );
};

export const beadPos = (i: number, t: number, cx: number, cy: number) => {
  const unfold = prog(t, PR.unfold, PR.unfold + 1.6, easeInOut);
  const x = cx - 270 + i * 54;
  const wave = (1 - unfold) * 95 * Math.sin(i * 1.05 + t * 1.6) + (1 - unfold) * 40 * Math.cos(i * 2.1 - t);
  const y = cy + wave + Math.sin(t * 2 + i * 0.6) * 6 * unfold;
  return {x, y};
};

export const ProteinScene: React.FC<{t: number}> = ({t}) => {
  if (t < PR.enter - 0.2 || t > PR.exit + 0.8) return null;
  const frame = t * FPS;
  const cx = 600;
  const cy = 520;
  const glassK = prog(t, PR.glass, PR.glass + 0.8, easeOut) * (1 - prog(t, PR.lens + 0.6, PR.lens + 1.4));
  const lensK = sp(frame, PR.lens, {damping: 16, stiffness: 110});
  const out = prog(t, PR.exit, PR.exit + 0.5, easeIn);
  const fly = prog(t, PR.exit - 0.2, PR.exit + 0.6, easeInOut);
  const r = 310 * lensK;
  const lcx = lerp(cx, cx, lensK);
  const lcy = lerp(600, cy, lensK);
  const chainK = (i: number) => sp(frame, PR.chain + i * 0.07, {damping: 11, stiffness: 200});
  const heroK = sp(frame, PR.bead, {damping: 8, stiffness: 200});
  const beads = Array.from({length: 11}, (_, i) => ({i, ...beadPos(i, t, cx, cy)}));
  const hero = beads[HERO];
  const hx = lerp(hero.x, 1010, fly);
  const hy = lerp(hero.y, 450, fly);
  const hr = lerp(26 * (1 + 0.6 * heroK), 150, fly);
  return (
    <AbsoluteFill style={{opacity: clamp01((t - PR.enter) / 0.4)}}>
      <MilkGlass x={cx} y={880} k={glassK} t={t} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <clipPath id="lensClip">
            <circle cx={lcx} cy={lcy} r={r} />
          </clipPath>
          <radialGradient id="lensBg" cx="45%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#FFF9EE" />
            <stop offset="100%" stopColor="#E8D9C2" />
          </radialGradient>
          <radialGradient id="micelle" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#F2E6D3" />
            <stop offset="100%" stopColor="#C7B497" />
          </radialGradient>
          {BEAD_COLORS.map((c, i) => (
            <radialGradient key={i} id={`bead${i}`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="35%" stopColor={c} />
              <stop offset="100%" stopColor={alpha(c, 1)} stopOpacity={0.7} />
            </radialGradient>
          ))}
        </defs>
        {r > 1 ? (
          <g opacity={1 - out}>
            <circle cx={lcx} cy={lcy} r={r + 22} fill="none" stroke={alpha(P.cyan, 0.35)} strokeWidth={30} />
            <g clipPath="url(#lensClip)">
              <rect x={0} y={0} width={W} height={H} fill="url(#lensBg)" />
              {Array.from({length: 22}, (_, i) => {
                const mx = lcx - 300 + rand(i) * 600 + Math.sin(t * 0.7 + i) * 14;
                const my = lcy - 300 + rand(i * 7) * 600 + Math.cos(t * 0.6 + i * 2) * 14;
                const mr = 16 + rand(i * 3) * 26;
                return <circle key={i} cx={mx} cy={my} r={mr} fill="url(#micelle)" opacity={0.85 * (1 - 0.5 * prog(t, PR.chain, PR.chain + 1))} />;
              })}
              {beads.slice(1).map((b, j) => {
                const a = beads[j];
                const k = Math.min(chainK(j), chainK(j + 1));
                return <line key={j} x1={a.x} y1={a.y} x2={a.x + (b.x - a.x) * k} y2={a.y + (b.y - a.y) * k} stroke="#6A5A9A" strokeWidth={9} strokeLinecap="round" />;
              })}
              {beads.map((b) =>
                b.i === HERO && fly > 0 ? null : (
                  <circle key={b.i} cx={b.x} cy={b.y} r={26 * chainK(b.i) * (b.i === HERO ? 1 + 0.6 * heroK : 1)} fill={`url(#bead${b.i % BEAD_COLORS.length})`} />
                ),
              )}
              {heroK > 0.01 && fly === 0 ? <circle cx={hero.x} cy={hero.y} r={26 * (1 + 0.6 * heroK) + 10} fill="none" stroke={P.gold} strokeWidth={5} opacity={heroK} /> : null}
            </g>
            <circle cx={lcx} cy={lcy} r={r} fill="none" stroke="rgba(235,242,255,0.9)" strokeWidth={8} />
            <path d={`M ${lcx - r * 0.7} ${lcy - r * 0.45} A ${r * 0.85} ${r * 0.85} 0 0 1 ${lcx - r * 0.2} ${lcy - r * 0.82}`} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={10} strokeLinecap="round" />
            <line x1={lcx + r * 0.72} y1={lcy + r * 0.72} x2={lcx + r * 1.02} y2={lcy + r * 1.02} stroke="#C9D0F5" strokeWidth={34} strokeLinecap="round" />
          </g>
        ) : null}
        {fly > 0 ? (
          <g>
                        <circle cx={hx} cy={hy} r={hr} fill={`url(#bead${HERO % BEAD_COLORS.length})`} opacity={1 - prog(t, PR.exit, PR.exit + 0.4)} />
          </g>
        ) : null}
      </svg>
      <Tag t={t} at={PR.bead + 0.2} out={PR.exit - 0.3} x={hero.x} y={hero.y - 105} color={P.gold}>
        حمض أميني
      </Tag>

      <div dir="rtl" style={{position: 'absolute', top: 150, right: 100, width: 820, color: P.text, opacity: 1 - out}}>
        <div style={{fontFamily: F.display, fontSize: 68, lineHeight: 1.3}}>
          <ArWords text="البروتين في اللبن" t={t} at={PR.head} />
        </div>
        <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 40, color: P.dim, marginTop: 8}}>
          <ArWords text="سلسلة طويلة من" t={t} at={PR.head + 0.6} /> <ArWords text="الأحماض الأمينية" t={t} at={PR.head + 0.9} style={{color: P.violet}} />
        </div>
        <div
          style={{
            marginTop: 50,
            padding: '24px 32px 30px',
            borderRadius: 28,
            background: 'linear-gradient(160deg, rgba(40,48,130,0.72), rgba(14,18,60,0.78))',
            border: `1.5px solid ${alpha(P.gold, 0.55)}`,
            opacity: prog(t, PR.sub, PR.sub + 0.5),
            transform: `translateY(${(1 - sp(frame, PR.sub, {damping: 14, stiffness: 140})) * 40}px)`,
          }}
        >
          <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 30, color: P.dim}}>الوحدة الأساسية للبروتين</div>
          <div style={{fontFamily: F.display, fontSize: 72, color: P.gold, lineHeight: 1.3}}>الحمض الأميني</div>
        </div>
        <div
          style={{
            marginTop: 36,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            fontFamily: F.body,
            fontWeight: 700,
            fontSize: 36,
            opacity: prog(t, PR.idea, PR.idea + 0.5),
            transform: `translateX(${(1 - prog(t, PR.idea, PR.idea + 0.7, easeOut)) * 40}px)`,
          }}
        >
          <span>نعدّ الأحماض الأمينية</span>
          <span style={{color: P.gold, fontSize: 44}}>⇐</span>
          <span style={{color: P.lime}}>نعرف نسبة البروتين</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- calculation */

const CA = T.calc;

const CalcCard: React.FC<{x: number; k: number; accent: string; children: React.ReactNode}> = ({x, k, accent, children}) => (
  <div
    dir="rtl"
    style={{
      position: 'absolute',
      left: x,
      top: 200,
      width: 800,
      minHeight: 500,
      padding: '28px 40px',
      boxSizing: 'border-box',
      borderRadius: 34,
      background: 'linear-gradient(160deg, rgba(40,48,130,0.78), rgba(14,18,60,0.82))',
      border: `2px solid ${alpha(accent, 0.6)}`,
      boxShadow: `0 30px 80px rgba(0,0,0,0.45), 0 0 60px ${alpha(accent, 0.2)}`,
      opacity: clamp01(k * 1.4),
      transform: `translateY(${(1 - k) * 80}px) rotateX(${(1 - k) * 25}deg)`,
      transformOrigin: '50% 100%',
      color: P.text,
      fontFamily: F.body,
    }}
  >
    {children}
  </div>
);

export const CalcScene: React.FC<{t: number}> = ({t}) => {
  if (t < CA.enter - 0.2 || t > CA.exit + 0.8) return null;
  const frame = t * FPS;
  const out = prog(t, CA.exit, CA.exit + 0.5, easeIn);
  const cowK = sp(frame, CA.cow, {damping: 15, stiffness: 120});
  const bufK = sp(frame, CA.buff, {damping: 15, stiffness: 120});
  const count = prog(t, CA.count, CA.countEnd, easeOut);
  const val = 1.8 * 1.67 * count;
  const resK = sp(frame, CA.result, {damping: 8, stiffness: 200});
  const gaugeK = prog(t, CA.range, CA.range + 1.2, easeInOut);
  const gx = (v: number) => 200 + (v / 5) * 1520;
  return (
    <AbsoluteFill style={{opacity: clamp01((t - CA.enter) / 0.4) * (1 - out), perspective: 1400}}>
      <div dir="rtl" style={{position: 'absolute', top: 70, right: 90, fontFamily: F.display, fontSize: 62, color: P.text}}>
        <ArWords text="حساب نسبة البروتين" t={t} at={CA.enter + 0.1} />
      </div>
      <CalcCard x={1020} k={cowK} accent={P.gold}>
        <div style={{fontFamily: F.display, fontSize: 52}}>🐄 اللبن البقري</div>
        <div style={{fontSize: 34, fontWeight: 700, marginTop: 10, color: P.dim}}>
          % البروتين = رقم الفورمول × <Ltr style={{fontFamily: F.mono, color: P.gold}}>1.67</Ltr>
        </div>
        <div style={{textAlign: 'center', marginTop: 20, opacity: prog(t, CA.mult, CA.mult + 0.5)}}>
          <Ltr style={{fontFamily: F.mono, fontWeight: 700, fontSize: 64}}>
            <span style={{color: P.gold}}>1.8</span> × 1.67
          </Ltr>
        </div>
        <div style={{textAlign: 'center', marginTop: 14, opacity: prog(t, CA.count, CA.count + 0.3)}}>
          <Ltr style={{fontFamily: F.mono, fontWeight: 700, fontSize: 92, color: P.gold, textShadow: `0 0 40px ${alpha(P.gold, 0.6)}`, display: 'inline-block', transform: `scale(${1 + 0.12 * resK * (1 - prog(t, CA.result + 0.3, CA.result + 0.9))})`}}>
            = {val.toFixed(2)} %
          </Ltr>
        </div>
        <div style={{textAlign: 'center', fontWeight: 700, fontSize: 30, color: P.lime, opacity: prog(t, CA.result + 0.3, CA.result + 0.8)}}>≈ 3 % بروتين ✓</div>
      </CalcCard>
      <Burst t={t} at={CA.result} x={1420} y={560} color={P.gold} r={240} />
      <CalcCard x={100} k={bufK} accent={P.cyan}>
        <div style={{fontFamily: F.display, fontSize: 52}}>🐃 اللبن الجاموسي</div>
        <div style={{fontSize: 34, fontWeight: 700, marginTop: 10, color: P.dim}}>
          % البروتين = رقم الفورمول × <Ltr style={{fontFamily: F.mono, color: P.cyan}}>1.66</Ltr>
        </div>
        <div style={{marginTop: 46, fontSize: 32, fontWeight: 700, color: P.dim, opacity: prog(t, CA.range, CA.range + 0.5)}}>المعدل الطبيعي للبروتين</div>
        <div style={{textAlign: 'center', marginTop: 6, opacity: prog(t, CA.range, CA.range + 0.5), transform: `scale(${0.8 + 0.2 * sp(frame, CA.range, {damping: 10, stiffness: 200})})`}}>
          <Ltr style={{fontFamily: F.mono, fontWeight: 700, fontSize: 84, color: P.cyan, textShadow: `0 0 34px ${alpha(P.cyan, 0.5)}`}}>3.3 – 4.5 %</Ltr>
        </div>
      </CalcCard>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: prog(t, CA.range - 0.2, CA.range + 0.4)}}>
        <defs>
          <linearGradient id="gauge" x1="0" x2="1">
            <stop offset="0%" stopColor={alpha(P.violet, 0.4)} />
            <stop offset="100%" stopColor={alpha(P.pink, 0.4)} />
          </linearGradient>
        </defs>
        <rect x={gx(0)} y={780} width={gx(5) - gx(0)} height={22} rx={11} fill="url(#gauge)" />
        <rect x={gx(3.3)} y={772} width={(gx(4.5) - gx(3.3)) * gaugeK} height={38} rx={12} fill={alpha(P.cyan, 0.85)} />
        {[0, 1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <line x1={gx(v)} y1={812} x2={gx(v)} y2={826} stroke={P.dim} strokeWidth={2} />
            <text x={gx(v)} y={856} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={24} fill={P.dim}>
              {v}%
            </text>
          </g>
        ))}
        <g transform={`translate(${gx(3.006 * gaugeK)} 791)`}>
          <circle r={20} fill={P.gold} stroke="#fff" strokeWidth={4} />
          <text y={-34} textAnchor="middle" fontFamily={F.body} fontWeight={700} fontSize={26} fill={P.gold}>
            بقري 3.0
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- outro */

const STEPS: {n: string; s: string; c: string}[] = [
  {n: '1', s: 'معايرة الحموضة الطبيعية', c: P.cyan},
  {n: '2', s: 'إضافة 2 مل فورمالين', c: P.lime},
  {n: '3', s: 'المعايرة التانية', c: P.pink},
  {n: '4', s: 'تجربة البلانك', c: '#7FD4FF'},
  {n: '5', s: 'رقم الفورمول × 1.67', c: P.gold},
];

export const Outro: React.FC<{t: number}> = ({t}) => {
  if (t < O.enter - 0.2) return null;
  const frame = t * FPS;
  const chipsOut = prog(t, O.chipsOut, O.chipsOut + 0.5, easeIn);
  const end = prog(t, O.fade, O.end, easeInOut);
  const lk = sp(frame, O.logo, {damping: 11, stiffness: 150});
  const lk2 = sp(frame, O.logo + 0.18, {damping: 11, stiffness: 150});
  return (
    <AbsoluteFill style={{opacity: clamp01((t - O.enter) / 0.4) * (1 - 0.85 * end)}}>
      {chipsOut < 1 ? (
        <div style={{opacity: 1 - chipsOut, transform: `translateY(${-chipsOut * 40}px)`, position: 'absolute', inset: 0}}>
          <div dir="rtl" style={{position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', fontFamily: F.display, fontSize: 72, color: P.text}}>
            <ArWords text="الخلاصة" t={t} at={O.enter + 0.1} />
          </div>
          <div dir="rtl" style={{position: 'absolute', top: 400, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 22}}>
            {STEPS.map((s, i) => {
              const k = sp(frame, O.chips[i], {damping: 11, stiffness: 190});
              return (
                <div
                  key={i}
                  style={{
                    width: 312,
                    height: 230,
                    borderRadius: 28,
                    padding: '20px 18px',
                    boxSizing: 'border-box',
                    background: 'linear-gradient(160deg, rgba(40,48,130,0.8), rgba(14,18,60,0.85))',
                    border: `2px solid ${alpha(s.c, 0.7)}`,
                    boxShadow: `0 0 40px ${alpha(s.c, 0.25)}`,
                    transform: `translateY(${(1 - k) * 80}px) scale(${0.8 + 0.2 * k})`,
                    opacity: clamp01(k * 1.5),
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 14,
                    textAlign: 'center',
                  }}
                >
                  <div style={{width: 70, height: 70, borderRadius: 22, background: s.c, color: P.ink, fontFamily: F.display, fontSize: 46, display: 'grid', placeItems: 'center'}}>
                    <span style={{marginTop: 6}}>{s.n}</span>
                  </div>
                  <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 30, color: P.text, lineHeight: 1.35}}>{s.s}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {t > O.logo - 0.1 ? (
        <>
          <div style={{position: 'absolute', top: 190, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 44, direction: 'rtl'}}>
            <div style={{width: 260, height: 260}}>
              <LogoCard src="asu-logo.jpg" w={260} h={260} k={lk} />
            </div>
            <div style={{width: 416, height: 260}}>
              <LogoCard src="fst-logo.png" w={416} h={260} k={lk2} pad={12} />
            </div>
          </div>
          <div dir="rtl" style={{position: 'absolute', top: 500, left: 0, right: 0, textAlign: 'center', color: P.text}}>
            <div style={{fontFamily: F.display, fontSize: 76, lineHeight: 1.35}}>
              <ArWords text="جامعة عين شمس" t={t} at={O.uni} />
            </div>
            <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 40, lineHeight: 1.6}}>
              <ArWords text="كلية الزراعة" t={t} at={O.fac} style={{color: P.lime}} />
              <span style={{color: P.gold, margin: '0 18px', opacity: prog(t, O.dept, O.dept + 0.3)}}>◆</span>
              <ArWords text="قسم علوم الأغذية" t={t} at={O.dept} style={{color: P.cyan}} />
            </div>
            <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 34, color: P.dim, lineHeight: 1.6}}>
              <ArWords text="برنامج علوم وتكنولوجيا الأغذية" t={t} at={O.prog} />
            </div>
            <div
              style={{
                display: 'inline-block',
                marginTop: 26,
                padding: '10px 40px 16px',
                borderRadius: 999,
                background: `linear-gradient(135deg, ${P.pink}, ${P.orange})`,
                color: P.ink,
                fontFamily: F.display,
                fontSize: 42,
                transform: `scale(${sp(frame, O.team, {damping: 10, stiffness: 190})})`,
                boxShadow: `0 14px 40px ${alpha(P.pink, 0.45)}`,
              }}
            >
              إعداد: طلاب المستوى الثاني
            </div>
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

void lerp;
void easeOut;
