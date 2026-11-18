import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog} from '../../lib';
import {BENCH_Y, BUR, Burette, BX, Drop, Dropper, Flash, Flask, flaskHW, naohColor, pinkMilk, pinkWater, Pipette, Stand} from '../glass';
import {Atom, Bond, Molecule3D} from '../mol3d';
import {alpha, F, FPS, H, mix, P, T, W, sp} from '../theme';
import {ArWords, Burst, Ltr, Panel, StepBadge, Tag} from '../ui';

const L = T.lab;
const T1 = T.t1;
const FM = T.form;
const T2 = T.t2;
const BL = T.blank;

const SIDE_X = 830;
const MILK_LEVEL = 82;
const FAINT = 0.42;

type Titration = {start: number; end: number; vol: number; stop: number};
const TITRATIONS: Titration[] = [T1, T2, BL];

const dropTimes = (ti: Titration) => {
  const n = Math.max(4, Math.round((ti.end - ti.start) / 0.3));
  return Array.from({length: n}, (_, i) => ti.start + ((ti.end - ti.start) * i) / (n - 1) - 0.25);
};

/** Burette reading (mL) of the titration in progress, with refills in between. */
const readingAt = (t: number) => {
  const r1 = T1.vol * prog(t, T1.start, T1.end, easeInOut);
  if (t < T2.refill) return r1;
  const r2 = T2.vol * prog(t, T2.start, T2.end, easeInOut);
  if (t < BL.refill) return lerp(T1.vol, 0, prog(t, T2.refill, T2.refill + 0.9, easeInOut)) + r2;
  return lerp(T2.vol, 0, prog(t, BL.refill, BL.refill + 0.9, easeInOut)) + BL.vol * prog(t, BL.start, BL.end, easeInOut);
};

const openAt = (t: number) =>
  TITRATIONS.reduce((a, ti) => a + prog(t, ti.start - 0.45, ti.start - 0.1, easeOut) * (1 - prog(t, ti.end, ti.end + 0.3, easeIn)), 0);

const swirlAt = (t: number) =>
  TITRATIONS.reduce((a, ti) => a + prog(t, ti.start - 0.3, ti.start + 0.2) * (1 - prog(t, ti.stop, ti.stop + 0.5)), 0);

const Frac: React.FC<{num: React.ReactNode; den: React.ReactNode; color?: string}> = ({num, den, color = P.text}) => (
  <span style={{display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle', margin: '0 12px', color}}>
    <span style={{padding: '0 8px 6px'}}>{num}</span>
    <span style={{alignSelf: 'stretch', height: 3, background: 'currentColor', borderRadius: 2, opacity: 0.85}} />
    <span style={{padding: '6px 8px 0'}}>{den}</span>
  </span>
);

const Mono: React.FC<{children: React.ReactNode; c?: string; s?: number}> = ({children, c, s}) => (
  <Ltr style={{fontFamily: F.mono, fontWeight: 700, color: c, fontSize: s}}>{children}</Ltr>
);

const fade = (t: number, a: number, d = 0.45) => prog(t, a, a + d, easeOut);

/** The free-COOH product, as a small 3D inset. */
const productAtoms = (t: number): {atoms: Atom[]; bonds: Bond[]} => {
  const g = 0.7 + 0.3 * Math.sin(t * 6);
  return {
    atoms: [
      {id: 'Ca', el: 'C', p: [0, 0, 0]},
      {id: 'R', el: 'R', p: [0, 1.55, -0.35]},
      {id: 'Ha', el: 'H', p: [-0.25, -0.75, 1.0]},
      {id: 'N', el: 'N', p: [1.45, -0.55, 0]},
      {id: 'Cf', el: 'C', p: [2.75, -0.6, 0]},
      {id: 'H1', el: 'H', p: [3.35, 0.3, 0.4]},
      {id: 'H2', el: 'H', p: [3.3, -1.55, -0.35]},
      {id: 'Cc', el: 'C', p: [-1.5, -0.5, 0], glow: P.red, gk: g},
      {id: 'O1', el: 'O', p: [-1.75, -1.7, 0.35], glow: P.red, gk: g},
      {id: 'O2', el: 'O', p: [-2.55, 0.35, -0.25], glow: P.red, gk: g},
      {id: 'HO', el: 'H', p: [-3.35, -0.1, -0.35], glow: P.red, gk: g},
    ],
    bonds: [
      {a: 'Ca', b: 'R'},
      {a: 'Ca', b: 'Ha'},
      {a: 'Ca', b: 'N'},
      {a: 'Ca', b: 'Cc'},
      {a: 'N', b: 'Cf', order: 2},
      {a: 'Cf', b: 'H1'},
      {a: 'Cf', b: 'H2'},
      {a: 'Cc', b: 'O1', order: 2},
      {a: 'Cc', b: 'O2'},
      {a: 'O2', b: 'HO'},
    ],
  };
};

const Swatch: React.FC<{color: string; k: number; label: string; sub: string; hi?: boolean; t: number}> = ({color, k, label, sub, hi, t}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transform: `scale(${k})`, opacity: clamp01(k * 1.5), width: 230}}>
    <div
      style={{
        width: 150,
        height: 150,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        boxShadow: hi ? `0 0 0 5px ${P.gold}, 0 0 40px ${alpha(P.gold, 0.5 + 0.2 * Math.sin(t * 5))}` : `0 0 0 2px ${P.line}`,
        background: 'rgba(255,255,255,0.05)',
      }}
    >
      <svg width={120} height={130} viewBox="-170 -310 340 330">
        <Flask uid={`sw-${color.replace(/[^a-z0-9]/gi, '')}`} x={0} y={0} level={150} color={color} t={0} />
      </svg>
    </div>
    <div style={{fontFamily: F.display, fontSize: 40, marginTop: 8}}>{label}</div>
    <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 25, color: P.dim}}>{sub}</div>
  </div>
);

export const LabScene: React.FC<{t: number}> = ({t}) => {
  if (t < L.enter - 0.2 || t > BL.exit + 1.0) return null;
  const frame = t * FPS;
  const reading = readingAt(t);
  const open = clamp01(openAt(t));
  const swirl = clamp01(swirlAt(t));
  const exit = prog(t, BL.exit, BL.exit + 0.8, easeIn);

  // apparatus entrances
  const burK = sp(frame, L.burette, {damping: 15, stiffness: 120});
  const flaskK = sp(frame, L.flask, {damping: 13, stiffness: 140});

  // milk flask position: filled at the side, slid under the burette, out again for formalin, then aside for the blank
  const toBur1 = prog(t, L.indTag + 0.4, L.indTag + 1.4, easeInOut);
  const outF = prog(t, FM.pipette - 0.5, FM.pipette + 0.3, easeInOut);
  const backF = prog(t, FM.pourEnd + 0.3, FM.pourEnd + 1.1, easeInOut);
  const aside = prog(t, BL.swap, BL.swap + 1.0, easeInOut);
  let mx = lerp(SIDE_X, BX, toBur1);
  mx = lerp(mx, SIDE_X, outF);
  mx = lerp(mx, BX, backF);
  mx = lerp(mx, 860, aside);
  const ms = lerp(1, 0.72, aside);
  const my = BENCH_Y - 5 + (1 - flaskK) * 400;

  // milk liquid
  const milkFill = prog(t, L.pour, L.pourEnd, easeInOut);
  const formFill = prog(t, FM.pour, FM.pourEnd, easeInOut);
  const milkLevel = MILK_LEVEL * milkFill + 10 * formFill;
  const pink1 = sp(frame, T1.stop - 0.1, {damping: 20, stiffness: 120}) * FAINT;
  const vanish = prog(t, FM.vanish, FM.vanish + 1.2, easeInOut);
  const pink2 = sp(frame, T2.stop - 0.1, {damping: 20, stiffness: 120}) * FAINT;
  const milkPink = pink1 * (1 - vanish) + pink2;

  // drop flashes: pink blooms that vanish while acid remains
  const flashes = (ti: Titration, x: number): Flash[] =>
    dropTimes(ti).map((d) => ({t0: d + 0.28, x: x * 0}));
  const milkFlashes = t < T2.refill ? flashes(T1, 0) : flashes(T2, 0);

  // water (blank) flask
  const waterK = sp(frame, BL.water, {damping: 14, stiffness: 130});
  const waterPink = sp(frame, BL.stop - 0.1, {damping: 20, stiffness: 120}) * 0.75;

  // falling drops from the burette tip
  const active = TITRATIONS.find((ti) => t > ti.start - 0.5 && t < ti.end + 0.5);
  const surfaceY = active === BL ? BENCH_Y - 5 - MILK_LEVEL : BENCH_Y - 5 - milkLevel;
  const fallingDrops = active
    ? dropTimes(active)
        .map((d) => {
          const k = (t - d) / 0.28;
          if (k < 0 || k > 1) return null;
          return <Drop key={d} x={BX} y={BUR.tip + 8 + (surfaceY - BUR.tip - 8) * k * k} color="rgba(190,230,255,0.95)" r={7} />;
        })
        .filter(Boolean)
    : null;
  const hanging = open > 0.5 ? <Drop x={BX} y={BUR.tip + 8} color="rgba(190,230,255,0.9)" r={5 + 2 * ((t * 3.3) % 1)} /> : null;

  // indicator dropper
  const dropperIn = prog(t, L.drops[0] - 0.8, L.drops[0] - 0.2, easeOut) * (1 - prog(t, L.indTag + 0.1, L.indTag + 0.6, easeIn));
  const indDrops = L.drops.map((d) => {
    const k = (t - d) / 0.3;
    if (k < 0 || k > 1) return null;
    return <Drop key={d} x={SIDE_X} y={600 + (BENCH_Y - 5 - MILK_LEVEL - 600) * k * k} color="rgba(245,240,255,0.85)" r={8} />;
  });
  const squeeze = L.drops.reduce((a, d) => a + Math.max(0, 1 - Math.abs(t - d + 0.05) / 0.15), 0);

  // pipettes
  const milkPipIn = prog(t, L.pour - 0.9, L.pour - 0.1, easeOut) * (1 - prog(t, L.pourEnd + 0.1, L.pourEnd + 0.7, easeIn));
  const formPipIn = prog(t, FM.pipette, FM.pipette + 0.8, easeOut) * (1 - prog(t, FM.pourEnd + 0.1, FM.pourEnd + 0.6, easeIn));
  const pipTip = (k: number) => lerp(-120, 700, k);

  const stopTag = (ti: Titration, out: number) => (
    <Tag t={t} at={ti.stop} out={out} x={BX + 330} y={700} tx={BX + 70} ty={BENCH_Y - 70} color={P.pink} size={30}>
      ✋ قف! وردي خفيف ثابت
    </Tag>
  );

  const readoutK = fade(t, T1.step) * (1 - prog(t, BL.exit - 0.2, BL.exit + 0.3));
  const productMol = productAtoms(t);

  return (
    <AbsoluteFill style={{opacity: clamp01((t - L.enter) / 0.4) * (1 - exit), transform: `scale(${1 - 0.05 * exit})`}}>
      {/* bench */}
      <div style={{position: 'absolute', left: 0, right: 0, top: BENCH_Y, height: H - BENCH_Y, background: 'linear-gradient(180deg, rgba(60,70,150,0.55), rgba(10,12,40,0.0))', borderTop: `2px solid ${alpha(P.cyan, 0.35)}`, opacity: fade(t, L.enter, 0.6)}} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(0 ${(1 - burK) * -700})`}>
          <Stand />
          <Burette reading={reading} open={open} liquid={naohColor} />
          {hanging}
        </g>
        {milkPipIn > 0.001 ? (
          <Pipette x={SIDE_X} tipY={pipTip(milkPipIn)} fill={1 - milkFill} color={P.milk} stream={clamp01(prog(t, L.pour, L.pour + 0.2) * (1 - prog(t, L.pourEnd - 0.2, L.pourEnd)))} surfaceY={BENCH_Y - 5 - milkLevel} />
        ) : null}
        {formPipIn > 0.001 ? (
          <Pipette x={SIDE_X} tipY={pipTip(formPipIn)} fill={1 - formFill} color="rgba(190,255,150,0.75)" stream={clamp01(prog(t, FM.pour, FM.pour + 0.2) * (1 - prog(t, FM.pourEnd - 0.2, FM.pourEnd)))} surfaceY={BENCH_Y - 5 - milkLevel} />
        ) : null}
        {dropperIn > 0.001 ? <Dropper x={SIDE_X} tipY={lerp(-100, 590, dropperIn)} squeeze={clamp01(squeeze)} /> : null}
        {indDrops}
        {fallingDrops}
        {waterK > 0.001 ? (
          <Flask uid="water" x={BX} y={BENCH_Y - 5 + (1 - waterK) * 450} level={MILK_LEVEL} color={pinkWater(waterPink)} t={t} swirl={active === BL ? swirl : 0} flashes={flashes(BL, 0)} milky={false} />
        ) : null}
        <Flask uid="milk" x={mx} y={my} s={ms} level={milkLevel} color={pinkMilk(milkPink)} t={t} swirl={active !== BL ? swirl : 0} flashes={milkFlashes} opacity={clamp01(flaskK * 2)} />
      </svg>

      {/* burette readout */}
      {readoutK > 0.001 ? (
        <div
          dir="rtl"
          style={{
            position: 'absolute',
            left: 60,
            top: 120,
            width: 270,
            padding: '14px 20px 18px',
            borderRadius: 22,
            background: 'rgba(6,10,34,0.78)',
            border: `1.5px solid ${alpha(P.cyan, 0.5)}`,
            boxShadow: `0 0 30px ${alpha(P.cyan, 0.2)}`,
            opacity: readoutK,
            transform: `translateX(${(1 - readoutK) * -40}px)`,
            textAlign: 'center',
          }}
        >
          <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 24, color: P.dim}}>قراءة السحاحة</div>
          <Ltr style={{fontFamily: F.mono, fontWeight: 700, fontSize: 58, color: P.cyan, textShadow: `0 0 20px ${alpha(P.cyan, 0.6)}`}}>
            {reading.toFixed(2)}
            <span style={{fontSize: 28, color: P.dim}}> mL</span>
          </Ltr>
          <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 20, color: P.muted}}>
            NaOH <Ltr style={{fontFamily: F.mono}}>0.1 N</Ltr>
          </div>
        </div>
      ) : null}

      {/* setup */}
      <div dir="rtl" style={{position: 'absolute', top: 70, right: 90, fontFamily: F.display, fontSize: 58, color: P.text, opacity: 1 - prog(t, T1.step - 0.5, T1.step, easeIn)}}>
        <ArWords text="تجهيز التجربة" t={t} at={L.enter + 0.3} />
      </div>
      <Tag t={t} at={L.milkTag} out={L.guide - 0.3} x={1250} y={760} tx={mx + 150} ty={BENCH_Y - 60} color={P.milk}>
        دورق: <Mono>10 mL</Mono> لبن
      </Tag>
      <Tag t={t} at={L.indTag} out={L.guide - 0.3} x={1250} y={600} tx={mx + 40} ty={BENCH_Y - 100} color={P.violet}>
        + <Mono>3</Mono> نقط فينولفثالين
      </Tag>
      <Tag t={t} at={L.naohTag} out={L.guide - 0.3} x={1250} y={330} tx={BX + 24} ty={330} color={P.cyan}>
        سحاحة: <Mono>NaOH 0.1 N</Mono>
      </Tag>
      <Panel x={1000} y={210} w={840} k={sp(frame, L.guide, {damping: 15, stiffness: 140})} out={prog(t, L.guideOut, L.guideOut + 0.4, easeIn)} accent={P.pink}>
        <div style={{fontFamily: F.display, fontSize: 52, marginBottom: 18}}>
          دليل الفينولفثالين <Mono c={P.pink} s={34}>Ph.Ph</Mono>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <Swatch t={t} color="#FF3F9A" k={sp(frame, L.sw[0], {damping: 10, stiffness: 210})} label="قلوي" sub="أحمر وردي" />
          <Swatch t={t} color={pinkMilk(FAINT)} k={sp(frame, L.sw[1], {damping: 10, stiffness: 210})} label="متعادل" sub="وردي خفيف" hi={t > L.sw[2] + 1.2} />
          <Swatch t={t} color={P.milk} k={sp(frame, L.sw[2], {damping: 10, stiffness: 210})} label="حامضي" sub="عديم اللون" />
        </div>
        <div style={{marginTop: 22, fontFamily: F.body, fontWeight: 700, fontSize: 30, color: P.gold, opacity: fade(t, L.sw[2] + 1.2), textAlign: 'center'}}>
          ⇐ نوقف المعايرة أول ما يظهر الوردي الخفيف
        </div>
      </Panel>

      {/* titration 1 */}
      <StepBadge t={t} at={T1.step} out={T1.exit} n="1" title="المعايرة الأولى: الحموضة الطبيعية" color={P.cyan} />
      {stopTag(T1, T1.calc)}
      <Panel x={1000} y={210} w={840} k={sp(frame, T1.calc, {damping: 15, stiffness: 140})} out={prog(t, T1.exit, T1.exit + 0.4, easeIn)} accent={P.cyan}>
        <div style={{fontFamily: F.display, fontSize: 50}}>نسبة الحموضة %</div>
        <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 24, color: P.dim, marginBottom: 14}}>مقدّرة كحمض لاكتيك</div>
        <div style={{fontSize: 34, opacity: fade(t, T1.calc + 0.3), textAlign: 'center'}}>
          <Ltr style={{fontFamily: F.mono, fontWeight: 700}}>
            <Frac num="V × N × 90" den="10 × 1000" /> × 100
          </Ltr>
        </div>
        <div dir="rtl" style={{display: 'flex', flexWrap: 'wrap', gap: '6px 22px', justifyContent: 'center', margin: '14px 0 8px', fontFamily: F.body, fontWeight: 600, fontSize: 25, color: P.dim, opacity: fade(t, T1.calc + 0.9)}}>
          <span><Mono c={P.cyan}>V</Mono> حجم الصودا</span>
          <span><Mono c={P.cyan}>N</Mono> العيارية 0.1</span>
          <span><Mono c={P.cyan}>90</Mono> الوزن المكافئ لحمض اللاكتيك</span>
          <span><Mono c={P.cyan}>10</Mono> حجم العينة</span>
        </div>
        <div style={{fontSize: 34, opacity: fade(t, T1.calc + 1.6), textAlign: 'center', color: P.cyan}}>
          <Ltr style={{fontFamily: F.mono, fontWeight: 700}}>
            <Frac num="1.6 × 0.1 × 90" den="10 × 1000" color={P.cyan} /> × 100
          </Ltr>
        </div>
        <div style={{textAlign: 'center', marginTop: 14, transform: `scale(${sp(frame, T1.result, {damping: 9, stiffness: 200})})`}}>
          <Ltr style={{fontFamily: F.mono, fontWeight: 700, fontSize: 64, color: P.gold, textShadow: `0 0 30px ${alpha(P.gold, 0.5)}`}}>= 0.144 %</Ltr>
        </div>
        <div style={{textAlign: 'center', fontFamily: F.body, fontWeight: 700, fontSize: 28, color: P.lime, marginTop: 6, opacity: fade(t, T1.result + 1.4)}}>
          ✓ كده اتخلصنا من الحموضة الطبيعية
        </div>
      </Panel>

      {/* formalin */}
      <StepBadge t={t} at={FM.step} out={FM.exit} n="2" title="إضافة الفورمالين" color={P.lime} />
      <Tag t={t} at={FM.pipette + 0.6} out={FM.pourEnd} x={1250} y={420} tx={SIDE_X + 30} ty={420} color={P.lime}>
        <Mono>2 mL</Mono> فورمالين
      </Tag>
      <Tag t={t} at={FM.vanish + 0.5} out={FM.inset + 1.6} x={BX + 330} y={690} tx={BX + 70} ty={BENCH_Y - 70} color={P.milk} size={30}>
        😮 اللون الوردي اختفى!
      </Tag>
      <Panel x={1000} y={210} w={840} k={sp(frame, FM.inset, {damping: 15, stiffness: 140})} out={prog(t, FM.exit, FM.exit + 0.4, easeIn)} accent={P.red}>
        <div style={{fontFamily: F.display, fontSize: 50}}>ليه اللون اختفى؟</div>
        <div style={{position: 'relative', height: 280, margin: '6px -20px'}}>
          <Molecule3D uid="prod" {...productMol} yaw={0.4 * Math.sin(t * 0.8)} pitch={-0.15} scale={64} cx={420} cy={130} width={800} height={280} />
          <div style={{position: 'absolute', left: 30, top: 18, fontFamily: F.mono, fontWeight: 700, fontSize: 26, color: P.red}}>COOH حرّة</div>
          <div style={{position: 'absolute', right: 40, top: 18, fontFamily: F.mono, fontWeight: 700, fontSize: 26, color: P.lime}}>N=CH₂</div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, fontFamily: F.body, fontWeight: 700, fontSize: 28, opacity: fade(t, FM.inset + 0.8)}}>
          <span style={{color: P.red}}>COOH اتحررت</span>
          <span style={{color: P.gold}}>⇐</span>
          <span>الوسط حامضي</span>
          <span style={{color: P.gold}}>⇐</span>
          <span style={{color: P.dim}}>الدليل عديم اللون</span>
        </div>
        <div
          style={{
            marginTop: 20,
            padding: '8px 20px 12px',
            borderRadius: 18,
            background: alpha(P.lime, 0.16),
            border: `1.5px solid ${alpha(P.lime, 0.6)}`,
            fontFamily: F.body,
            fontWeight: 700,
            fontSize: 28,
            color: P.lime,
            textAlign: 'center',
            opacity: fade(t, FM.note),
            transform: `scale(${0.9 + 0.1 * sp(frame, FM.note, {damping: 10, stiffness: 200})})`,
          }}
        >
          ✓ مش محتاجين نضيف دليل تاني — موجود بالفعل
        </div>
      </Panel>

      {/* titration 2 */}
      <StepBadge t={t} at={T2.step} out={T2.exit} n="3" title="المعايرة التانية" color={P.pink} />
      <Tag t={t} at={T2.refill + 0.1} out={T2.start - 0.2} x={BX + 300} y={200} tx={BX + 24} ty={BUR.zeroY} color={P.cyan} size={28}>
        نصفّر السحاحة
      </Tag>
      {stopTag(T2, T2.tag - 0.2)}
      <Panel x={1000} y={260} w={840} k={sp(frame, T2.tag, {damping: 15, stiffness: 140})} out={prog(t, T2.exit, T2.exit + 0.4, easeIn)} accent={P.pink}>
        <div style={{fontFamily: F.display, fontSize: 48}}>حجم المعايرة التانية (لبن)</div>
        <div style={{textAlign: 'center', margin: '10px 0'}}>
          <Ltr style={{fontFamily: F.mono, fontWeight: 700, fontSize: 110, color: P.gold, textShadow: `0 0 34px ${alpha(P.gold, 0.5)}`}}>
            2.0<span style={{fontSize: 44}}> mL</span>
          </Ltr>
        </div>
        <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 30, color: P.dim, textAlign: 'center', opacity: fade(t, T2.tag + 0.9)}}>
          ⇐ بيعبّر عن مجموعات <Mono c={P.red}>COOH</Mono> = الأحماض الأمينية
        </div>
      </Panel>

      {/* blank */}
      <StepBadge t={t} at={BL.step} out={BL.exit} n="4" title="تجربة البلانك" color="#7FD4FF" />
      <Tag t={t} at={BL.swap + 0.8} out={BL.exit} x={860} y={560} color={P.pinkSoft} size={28}>
        لبن ← <Mono>2.0 mL</Mono>
      </Tag>
      <Tag t={t} at={BL.water + 0.5} out={BL.exit} x={210} y={560} tx={BX - 90} ty={BENCH_Y - 60} color="#9FD8FF" size={28}>
        ماء + فورمالين + دليل
      </Tag>
      <Tag t={t} at={BL.stop + 0.2} out={BL.exit} x={210} y={460} color={P.cyan} size={28}>
        ماء ← <Mono>0.2 mL</Mono>
      </Tag>
      <Panel x={1000} y={240} w={840} k={sp(frame, BL.formula, {damping: 15, stiffness: 140})} out={prog(t, BL.exit, BL.exit + 0.4, easeIn)} accent={P.gold}>
        <div style={{fontFamily: F.display, fontSize: 54}}>رقم الفورمول</div>
        <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 30, margin: '12px 0', lineHeight: 1.6}}>
          = حجم المعايرة التانية <span style={{color: P.pinkSoft}}>(لبن)</span>
          <br />− حجم تجربة البلانك <span style={{color: '#9FD8FF'}}>(ماء)</span>
        </div>
        <div style={{textAlign: 'center', opacity: fade(t, BL.values)}}>
          <Ltr style={{fontFamily: F.mono, fontWeight: 700, fontSize: 60}}>
            <span style={{color: P.pinkSoft}}>2.0</span> − <span style={{color: '#9FD8FF'}}>0.2</span>
            <span style={{color: P.gold, display: 'inline-block', transform: `scale(${sp(frame, BL.result, {damping: 8, stiffness: 200})})`, textShadow: `0 0 34px ${alpha(P.gold, 0.6)}`, marginLeft: 20}}>
              = 1.8
            </span>
          </Ltr>
        </div>
      </Panel>
      <Burst t={t} at={BL.result} x={1640} y={545} color={P.gold} r={200} />
    </AbsoluteFill>
  );
};

void flaskHW;
void mix;
