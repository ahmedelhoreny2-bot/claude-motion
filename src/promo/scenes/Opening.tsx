import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog, rand} from '../../lib';
import {Floaters, Tri, Words} from '../kit';
import {Extrude, P3, shade, stretch} from '../space';
import {arNum, ELASTIC, F, FPS, H, HEAVY, P, POP, R, sp, TL, W} from '../theme';

const {s1, s2, s3} = TL;
const TRI_SIDE = shade(P.orange, 0.5);

/* ---------------- scene 1: the feed ---------------- */

const CARD_W = 880;
const CARD_H = 1040;
const STEP = 1080;
const TARGET = 9;
const STOP_POS = 120 + TARGET * STEP - (H - CARD_H) / 2;
const SPEED = 5200;

const scrollAt = (t: number) => {
  if (t < s1.stop) return STOP_POS - SPEED * (s1.stop - t);
  const dt = t - s1.stop;
  return STOP_POS + 70 * Math.sin(dt * 26) * Math.exp(-dt * 9);
};

const Card: React.FC<{i: number; glow: number}> = ({i, glow}) => {
  const r = (n: number) => rand(i * 13 + n);
  return (
    <div
      style={{
        position: 'absolute',
        left: (W - CARD_W) / 2,
        top: 120 + i * STEP,
        width: CARD_W,
        height: CARD_H,
        borderRadius: R.lg,
        background: P.card,
        padding: 36,
        boxSizing: 'border-box',
      }}
    >
      <div style={{display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', gap: 22}}>
        <div style={{width: 76, height: 76, borderRadius: 38, background: P.block}} />
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12}}>
          <div style={{width: 200 + r(1) * 120, height: 20, borderRadius: 10, background: P.block}} />
          <div style={{width: 120, height: 14, borderRadius: 7, background: P.cardHi}} />
        </div>
      </div>
      <div
        style={{
          marginTop: 34,
          height: 720,
          borderRadius: R.md,
          background: i === TARGET ? '#1A1918' : P.cardHi,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {i === TARGET ? null : (
          <>
            <div style={{position: 'absolute', width: 260 + r(2) * 160, height: 260 + r(2) * 160, borderRadius: r(3) > 0.5 ? '50%' : 30, background: P.block, opacity: 0.8}} />
            <div style={{position: 'absolute', bottom: 60, right: 60, width: 340, height: 34, borderRadius: 17, background: P.block}} />
          </>
        )}
        {i === TARGET ? (
          <div style={{position: 'absolute', inset: 0, border: `6px solid ${P.orange}`, borderRadius: R.md, opacity: glow}} />
        ) : null}
      </div>
      <div style={{display: 'flex', flexDirection: 'row-reverse', gap: 26, marginTop: 34}}>
        {[0, 1, 2].map((k) => (
          <div key={k} style={{width: 54, height: 54, borderRadius: 27, background: P.block}} />
        ))}
      </div>
    </div>
  );
};

/* ---------------- scene 2: the pile ---------------- */

const PAPERS = 15;
const paper = (i: number) => {
  const r = (n: number) => rand(i * 31 + n + 5);
  return {
    start: s2.fall + i * 0.085,
    x: W / 2 + (r(1) - 0.5) * 460,
    land: 1560 - Math.floor(i / 3) * 44 - r(2) * 20,
    rot: (r(3) - 0.5) * 50,
    vx: (r(4) - 0.5) * 2,
    color: [P.orange, P.teal, P.cream][i % 3],
    kind: i % 3,
  };
};
const PILE_TOP = 1560 - 4 * 44 - 160;

const Paper: React.FC<{i: number; t: number; frame: number}> = ({i, t, frame}) => {
  const p = paper(i);
  if (t < p.start) return null;
  const dt = t - p.start;
  const g = 5200;
  const fallY = -420 + 0.5 * g * dt * dt;
  const landT = Math.sqrt((2 * (p.land + 420)) / g);
  const landed = dt >= landT;
  const settle = landed ? Math.exp(-(dt - landT) * 10) * Math.sin((dt - landT) * 30) : 0;
  let y = landed ? p.land - 22 * Math.abs(settle) : fallY;
  let x = p.x;
  let rot = landed ? p.rot + settle * 6 : p.rot * 0.4 + dt * 140 * (p.vx > 0 ? 1 : -1);
  // forgotten: everything goes grey
  const dead = prog(t, s2.forget, s2.forget + 1.2, easeInOut);
  // the tap: papers blow outward and turn into coloured shapes
  const blow = t >= s3.tap ? t - s3.tap : 0;
  const morph = prog(t, s3.tap, s3.tap + 0.5, easeOut);
  let scale = 1;
  let z = i * 6;
  let rx = landed ? 0 : 35 * (1 - dt / landT);
  let ry = 0;
  if (blow > 0) {
    const ang = (-90 + (i / PAPERS - 0.5) * 200 + (rand(i) - 0.5) * 30) * (Math.PI / 180);
    const speed = 2400 + rand(i + 3) * 1600;
    const d = speed * (1 - Math.exp(-blow * 3)) / 3;
    x += Math.cos(ang) * d;
    y += Math.sin(ang) * d + 120 * blow * blow;
    rot += blow * 260 * (rand(i + 9) - 0.5);
    scale = lerp(1, 0.38, morph);
    z += d * (rand(i + 11) > 0.35 ? 0.9 : -0.4);
    rx += blow * 420 * (rand(i + 12) - 0.5);
    ry += blow * 520 * (rand(i + 13) - 0.5);
    if (blow > 1.6) return null;
  }
  const w = 290;
  const h = 370;
  const radius = lerp(R.md, p.kind === 0 ? 200 : p.kind === 1 ? 70 : 30, morph);
  const base = morph > 0 ? p.color : P.paper;
  const wiggle = 0; // stillness is the point of this scene
  void frame;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h / 2 + wiggle,
        width: w,
        height: h,
        borderRadius: radius,
        background: base,
        transform: `translateZ(${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${rot}deg) scale(${scale})`,
        filter: `saturate(${1 - dead * (morph > 0 ? 0 : 1)}) brightness(${1 - dead * 0.55 * (1 - morph)})`,
        boxShadow: '0 18px 40px rgba(0,0,0,0.45)',
        padding: 28,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div style={{opacity: 1 - morph}}>
        <div style={{height: 150, borderRadius: R.sm, background: P.muted}} />
        <div style={{marginTop: 22, height: 20, width: '80%', marginLeft: 'auto', borderRadius: 10, background: P.muted}} />
        <div style={{marginTop: 14, height: 20, width: '55%', marginLeft: 'auto', borderRadius: 10, background: P.muted}} />
        <div style={{marginTop: 30, height: 44, width: 120, borderRadius: R.pill, background: P.muted}} />
      </div>
    </div>
  );
};

/* ---------------- the hero triangle, alive across all three scenes ---------------- */

const CARD_IMG_Y = (H - CARD_H) / 2 + 36 + 76 + 34 + 360;
const triState = (t: number, frame: number) => {
  // pop out of the card
  const pop = sp(frame, s1.stop, POP);
  let x = W / 2;
  let y = lerp(CARD_IMG_Y, 760, pop);
  let s = lerp(0.87, 1.9, pop);
  let rot = 0;
  let z = lerp(-120, 170, pop);
  let ry = (1 - pop) * -75;
  let sx = 1;
  let sy = 1;
  // retreat to the side while the pile falls
  const side = sp(frame, s1.exit, HEAVY);
  x = lerp(x, 230, side);
  y = lerp(y, 1500, side);
  s = lerp(s, 0.62, side);
  rot = lerp(0, -10, side);
  z = lerp(z, 40, side);
  ry += 25 * side * Math.sin(t * 1.3);
  // hop onto the pile
  const hop = prog(t, s3.hop, s3.hop + 0.75, easeInOut);
  x = lerp(x, W / 2, hop);
  y = lerp(y, PILE_TOP - 70, hop) - Math.sin(hop * Math.PI) * 360;
  rot = lerp(rot, 0, hop) + Math.sin(hop * Math.PI) * 20;
  z += Math.sin(hop * Math.PI) * 260;
  ry = lerp(ry, 0, hop) + Math.sin(hop * Math.PI) * 180;
  // anticipation squash, then the tap
  const squash = prog(t, s3.squash, s3.tap, easeIn) * (t < s3.tap ? 1 : 0);
  sx *= 1 + 0.28 * squash;
  sy *= 1 - 0.32 * squash;
  const rise = sp(frame, s3.tap, ELASTIC);
  x = lerp(x, W / 2, rise);
  y = lerp(y, 690, rise);
  s = lerp(s, 1.35, rise);
  z = lerp(z, 220, rise);
  ry += (1 - rise) * 30 * (t > s3.tap ? 1 : 0) + Math.sin((t - s3.tap) * 1.4) * 16 * rise;
  const st = t >= s3.tap ? Math.exp(-(t - s3.tap) * 6) : 0;
  sx *= 1 - 0.2 * st;
  sy *= 1 + 0.3 * st;
  // exits left, the way it points
  const go = prog(t, s3.exit, s3.exit + 0.5, easeIn);
  x = lerp(x, -500, go);
  z += go * 500;
  sx *= 1 + go * 0.5;
  sy *= 1 - go * 0.25;
  // idle breathing
  const breathe = 1 + 0.025 * Math.sin(t * 3.2);
  return {x, y, z, ry, s: s * breathe, rot, sx, sy};
};

/* ---------------- composition ---------------- */

export const Opening: React.FC<{frame: number}> = ({frame}) => {
  const t = frame / FPS;
  if (t > TL.s4.wipes[0] + 0.1) return null;

  // scene 1
  const pos = scrollAt(t);
  const speed = Math.abs(scrollAt(t) - scrollAt(t - 1 / FPS)) * FPS;
  const blur = Math.min(10, speed / 600);
  const feedDim = prog(t, s1.stop + 0.05, s1.stop + 0.5, easeOut);
  const feedOut = prog(t, s1.exit, s1.exit + 0.5, easeIn);
  const shakeK = t >= s1.stop ? Math.exp(-(t - s1.stop) * 7) : 0;
  const shake = shakeK * 26;
  const sx = (rand(frame) - 0.5) * shake;
  const sy = (rand(frame + 50) - 0.5) * shake;

  const tri = triState(t, frame);
  const triPrev = triState(t - 1 / FPS, frame - 1);
  const showTri = t >= s1.stop;

  // scene 2 counter
  const count = Math.round(100 * prog(t, s2.count, s2.countEnd, easeOut));

  // scene 3 shockwave
  const tap = t - s3.tap;
  const waveA = clamp01(tap / 0.9);
  const waveB = clamp01((tap - 0.12) / 1.0);
  const flash = t >= s3.tap ? Math.exp(-tap * 5) : 0;

  return (
    <AbsoluteFill style={{...P3, transform: `translate(${sx}px, ${sy}px)`}}>
      {/* feed */}
      {t < s1.exit + 0.6 ? (
        <AbsoluteFill
          style={{
            transform: `translateY(${-pos + feedOut * 600}px)`,
            filter: `blur(${blur}px) saturate(${1 - feedDim})`,
            opacity: (1 - feedDim * 0.72) * (1 - feedOut),
          }}
        >
          {Array.from({length: TARGET + 2}).map((_, i) => (
            <Card key={i} i={i} glow={prog(t, s1.burst, s1.stop, easeOut)} />
          ))}
        </AbsoluteFill>
      ) : null}
      {t < s1.stop ? (
        <div
          style={{
            position: 'absolute',
            left: W / 2 - 100,
            top: CARD_IMG_Y - 116 - (pos - STOP_POS),
            filter: `blur(${blur}px)`,
          }}
        >
          <Tri size={200} />
        </div>
      ) : null}

      {/* scene 1 type */}
      {t < s1.exit + 0.6 ? (
        <>
          <Words text="استنّى" t={t} start={s1.word1} dur={0.45} out={s1.exit} size={230} style={{position: 'absolute', top: 1180, left: 0, right: 0}} />
          <Words text="إنت كنت هتعدّي." t={t} start={s1.word2} out={s1.exit} size={92} weight={700} color={P.creamDim} style={{position: 'absolute', top: 1500, left: 0, right: 0}} />
        </>
      ) : null}

      {/* scene 2: pile + counter */}
      {t > s2.fall && t < s3.tap + 1.7
        ? Array.from({length: PAPERS}).map((_, i) => <Paper key={i} i={i} t={t} frame={frame} />)
        : null}
      {t > s2.count - 0.1 && t < s2.forget + 0.6 ? (
        <AbsoluteFill style={{alignItems: 'center', top: 300}}>
          <Words text="كل يوم بتشوف" t={t} start={s2.count} out={s2.forget - 0.2} size={80} weight={700} color={P.creamDim} />
          <div
            dir="rtl"
            style={{
              fontFamily: F.display,
              fontWeight: 400,
              fontSize: 300,
              lineHeight: 1.1,
              color: P.cream,
              opacity: prog(t, s2.count, s2.count + 0.3) * (1 - prog(t, s2.forget - 0.2, s2.forget + 0.15, easeIn)),
              transform: `scale(${0.9 + 0.1 * prog(t, s2.count, s2.countEnd, easeOut)})`,
            }}
          >
            {arNum(count)}
          </div>
          <Words text="إعلان" t={t} start={s2.countEnd - 0.4} out={s2.forget - 0.2} size={80} weight={700} color={P.creamDim} />
        </AbsoluteFill>
      ) : null}
      {t > s2.forget - 0.1 && t < s2.why + 0.6 ? (
        <AbsoluteFill style={{alignItems: 'center', top: 380}}>
          <Words text="وبتنسى" t={t} start={s2.forget} out={s2.why - 0.3} size={110} />
          <Words text="٩٩ منهم" t={t} start={s2.forget + 0.25} out={s2.why - 0.3} size={200} accent={{0: P.muted}} />
        </AbsoluteFill>
      ) : null}
      {t > s2.why - 0.1 && t < s2.exit + 0.6 ? (
        <AbsoluteFill style={{alignItems: 'center', top: 380}}>
          <Words text="ليه؟" t={t} start={s2.why} dur={0.5} out={s2.exit} size={240} />
          <Words text="عشان واقفين." t={t} start={s2.still} out={s2.exit} size={120} accent={{1: P.muted}} />
        </AbsoluteFill>
      ) : null}

      {/* scene 3: the tap */}
      {t >= s3.tap && t < s3.tap + 1.2 ? (
        <AbsoluteFill style={{pointerEvents: 'none', ...P3}}>
          <div style={{position: 'absolute', inset: -1400, background: P.orange, opacity: flash * 0.55}} />
          {[
            {k: waveA, c: P.orange, w: 60, tilt: 74},
            {k: waveB, c: P.teal, w: 40, tilt: 0},
          ].map((r, i) => (
            <div
              key={i}
              style={{
                transform: `rotateX(${r.tilt}deg)`,
                position: 'absolute',
                left: W / 2 - 1600 * r.k,
                top: PILE_TOP - 70 - 1600 * r.k,
                width: 3200 * r.k,
                height: 3200 * r.k,
                borderRadius: '50%',
                border: `${r.w * (1 - r.k) + 2}px solid ${r.c}`,
                opacity: 1 - r.k,
              }}
            />
          ))}
        </AbsoluteFill>
      ) : null}
      {t > s3.tap ? <Floaters t={t} k={prog(t, s3.tap + 0.1, s3.tap + 1.2, easeOut) * (1 - prog(t, s3.exit + 0.2, TL.s4.wipes[0], easeIn))} seed={3} /> : null}
      {t > s3.line1 - 0.1 ? (
        <>
          <Words text="بس لما الفكرة تتحرك…" t={t} start={s3.line1} out={s3.exit} size={96} weight={700} style={{position: 'absolute', top: 1030, left: 60, right: 60}} />
          <Words text="بتتحفظ." t={t} start={s3.line2} dur={0.55} out={s3.exit} size={250} color={P.orange} style={{position: 'absolute', top: 1220, left: 0, right: 0}} />
        </>
      ) : null}

      {/* hero triangle: solid, stretched by its own speed */}
      {showTri ? (
        <div
          style={{
            position: 'absolute',
            left: tri.x,
            top: tri.y,
            ...P3,
            transform: `translate(-50%, -50%) translateZ(${tri.z}px) ${stretch(tri.x - triPrev.x, tri.y - triPrev.y, 0.006, 0.6)} rotateY(${tri.ry}deg) rotate(${tri.rot}deg) scale(${tri.s * tri.sx}, ${tri.s * tri.sy})`,
            transformOrigin: '50% 100%',
          }}
        >
          <Extrude depth={46} layers={8} back={<Tri size={230} color={TRI_SIDE} />}>
            <Tri size={230} />
          </Extrude>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
