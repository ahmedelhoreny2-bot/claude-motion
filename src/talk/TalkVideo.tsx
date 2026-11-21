import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  continueRender,
  delayRender,
  Freeze,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {Grain, Mask} from '../components/primitives';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog, sp} from '../lib';
import {Icon, Star} from './Icons';
import {S, SF, SH, SW, T} from './theme';

const FPS = T.fps;
type Cap = [number, number, string, string];
const CAPS = T.cap as Cap[];

const useTalkFonts = () => {
  const [h] = useState(() => delayRender('talk-fonts'));
  useEffect(() => {
    Promise.all([
      document.fonts.load('800 60px "Cairo"'),
      document.fonts.load('600 60px "Cairo"'),
      document.fonts.load('700 60px "Amiri"'),
      document.fonts.load('400 60px "Aref Ruqaa"'),
      document.fonts.load('700 60px "Aref Ruqaa"'),
    ]).then(() => continueRender(h));
  }, [h]);
};

/** Window envelope: 0 before a, eases to 1 by a+inD, holds, eases out to 0 at b. */
const env = (t: number, a: number, b: number, inD = 0.45, outD = 0.3) =>
  prog(t, a, a + inD, easeOut) * (1 - prog(t, b - outD, b, easeIn));

const zoomAt = (t: number) => {
  const z = T.zoom as [number, number][];
  let s = z[0][1];
  for (const [at, v] of z) s = lerp(s, v, prog(t, at - 0.2, at + 0.9, easeInOut));
  // the hook opens close and pulls back to reveal the room
  s *= lerp(1.22, 1, prog(t, 0, 1.6, easeOut));
  return s * (1 + 0.012 * Math.sin(t * 0.35));
};

/* ---------- captions ---------- */

const Words: React.FC<{text: string; t: number; t0: number; font: string; size: number; weight: number}> = ({
  text,
  t,
  t0,
  font,
  size,
  weight,
}) => {
  const words = text.split(' ');
  return (
    <span style={{fontFamily: font, fontSize: size, fontWeight: weight, lineHeight: 1.35}}>
      {words.map((w, i) => {
        const hl = w.includes('*');
        const clean = w.replace(/\*/g, '');
        const k = prog(t, t0 + i * 0.07, t0 + i * 0.07 + 0.5, easeOut);
        return (
          <React.Fragment key={i}>
            <Mask k={k} tilt={0}>
              <span
                style={{
                  color: hl ? S.goldHi : S.cream,
                  textShadow: hl ? `0 0 ${24 * k}px rgba(211,171,76,0.55)` : 'none',
                }}
              >
                {clean}
              </span>
            </Mask>
            {i < words.length - 1 ? ' ' : ''}
          </React.Fragment>
        );
      })}
    </span>
  );
};

/** Kashida that stretches while the word is said: طبيبـــــها */
const Kashida: React.FC<{t: number; t0: number}> = ({t, t0}) => {
  const n = Math.round(lerp(0, 7, prog(t, t0 + 0.1, t0 + 1.1, easeInOut)));
  const k = prog(t, t0, t0 + 0.45, easeOut);
  return (
    <span style={{fontFamily: SF.naskh, fontWeight: 700, fontSize: 92, lineHeight: 1.3}}>
      <Mask k={k} tilt={0}>
        <span style={{color: S.goldHi, textShadow: '0 0 26px rgba(211,171,76,0.5)'}}>
          {'طبيبـ' + 'ـ'.repeat(n) + 'ها'}
        </span>
      </Mask>{' '}
      <Mask k={prog(t, t0 + 0.6, t0 + 1.1, easeOut)} tilt={0}>
        <span style={{color: S.cream}}>الذي خلقها</span>
      </Mask>
    </span>
  );
};

const Captions: React.FC<{t: number}> = ({t}) => {
  const i = CAPS.findIndex(([a, b], j) => {
    const next = CAPS[j + 1]?.[0] ?? b + 0.4;
    const end = next - b < 0.45 ? next : b + 0.2;
    return t >= a && t < end;
  });
  if (i < 0) return null;
  const [a, b, text, style] = CAPS[i];
  if (style === 'x' || style === 'names' || style === 'skip') return null;
  const next = CAPS[i + 1]?.[0] ?? b + 0.4;
  const end = next - b < 0.45 ? next : b + 0.2;
  const out = prog(t, end - 0.16, end, easeIn);
  const card = prog(t, a - 0.05, a + 0.3, easeOut);
  const hadith = style === 'h';
  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        top: 1330,
        display: 'flex',
        justifyContent: 'center',
        opacity: 1 - out,
        transform: `translateY(${-out * 18}px)`,
      }}
    >
      <div
        style={{
          direction: 'rtl',
          textAlign: 'center',
          padding: hadith ? '18px 46px 26px' : '16px 40px 22px',
          borderRadius: 30,
          background: S.glass,
          border: `2px solid ${hadith ? S.gold : S.line}`,
          boxShadow: '0 18px 50px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(14px)',
          transform: `scale(${lerp(0.94, 1, card)})`,
          opacity: card,
          maxWidth: 940,
        }}
      >
        {style === 'k' ? (
          <Kashida t={t} t0={a} />
        ) : (
          <Words
            text={text}
            t={t}
            t0={a + 0.05}
            font={hadith ? SF.naskh : SF.sans}
            size={hadith ? 66 : 60}
            weight={hadith ? 700 : 800}
          />
        )}
      </div>
    </div>
  );
};

/* ---------- overlays ---------- */

const Badge: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const k = sp(frame, T.intro.badge, {damping: 11, stiffness: 210, mass: 0.7}, FPS);
  const hide = prog(t, T.end.in - 0.4, T.end.in, easeIn);
  return (
    <div
      style={{
        position: 'absolute',
        right: 62,
        top: 168,
        width: 150,
        height: 150,
        transform: `scale(${k * (1 - hide)})`,
      }}
    >
      <div style={{position: 'absolute', inset: -34, opacity: 0.8}}>
        <Star size={218} k={prog(t, 0.3, 1.4, easeOut)} rotate={t * 6} weight={2.4} />
      </div>
      <Img
        src={staticFile('talk/logo_shape.png')}
        style={{position: 'absolute', left: 10, top: -4, width: 130, height: 151, filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))'}}
      />
    </div>
  );
};

const Chip: React.FC<{k: number; icon: string; label: string; top: number}> = ({k, icon, label, top}) => (
  <div
    style={{
      position: 'absolute',
      top,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      opacity: clamp01(k * 1.4),
      transform: `translateY(${(1 - k) * 24}px) scale(${lerp(0.85, 1, k)})`,
    }}
  >
    <div
      style={{
        direction: 'rtl',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '10px 26px',
        borderRadius: 999,
        background: S.gold,
        color: S.greenDeep,
        fontFamily: SF.sans,
        fontWeight: 800,
        fontSize: 38,
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
      }}
    >
      <Icon name={icon} size={46} color={S.greenDeep} weight={7} k={k} />
      {label}
    </div>
  </div>
);

const Card: React.FC<{
  k: number;
  icon: string;
  label?: string;
  w: number;
  h: number;
  hot?: number;
  rotate?: number;
}> = ({k, icon, label, w, h, hot = 0, rotate = 0}) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 30,
      background: hot > 0 ? `rgba(211,171,76,${0.18 + 0.7 * hot})` : S.glass,
      border: `2px solid ${hot > 0.01 ? S.goldHi : S.line}`,
      boxShadow: `0 16px 40px rgba(0,0,0,0.35), 0 0 ${60 * hot}px rgba(240,212,138,${0.6 * hot})`,
      backdropFilter: 'blur(12px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      opacity: clamp01(k * 1.6),
      transform: `translateY(${(1 - k) * 60}px) scale(${lerp(0.7, 1, k)})`,
    }}
  >
    <Icon name={icon} size={w * 0.52} k={prog(k, 0.2, 1)} rotate={rotate} color={hot > 0.5 ? S.greenDeep : S.gold} />
    {label ? (
      <div
        style={{
          fontFamily: SF.sans,
          fontWeight: 800,
          fontSize: Math.round(w * 0.15),
          whiteSpace: 'nowrap',
          color: hot > 0.5 ? S.greenDeep : S.cream,
          direction: 'rtl',
        }}
      >
        {label}
      </div>
    ) : null}
  </div>
);

const Machine: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const M = T.machine;
  const out = prog(t, M.out - 0.35, M.out, easeIn);
  if (t < M.in - 0.1 || out >= 1) return null;
  const pop = (s: number) => sp(frame, s, {damping: 11, stiffness: 210, mass: 0.7}, FPS) * (1 - out);
  const hot = prog(t, M.maker, M.maker + 0.4, easeOut) * (1 - out);
  const arrow = prog(t, M.maker + 0.05, M.maker + 0.7, easeInOut);
  const q = sp(frame, M.fix, {damping: 9, stiffness: 230, mass: 0.6}, FPS) * (1 - prog(t, M.maker - 0.3, M.maker, easeIn));
  return (
    <div style={{position: 'absolute', top: 1020, left: 0, right: 0, height: 300}}>
      <div style={{display: 'flex', direction: 'rtl', justifyContent: 'center', gap: 40, marginTop: 50}}>
        <Card k={pop(M.in)} icon="maker" label="الصانع" w={230} h={240} hot={hot} />
        <Card k={pop(M.car)} icon="car" label="عربية" w={230} h={240} />
        <Card k={pop(M.gear)} icon="gear" label="ماكينة" w={230} h={240} rotate={t * 40} />
      </div>
      {/* the question marks: who knows the problems? */}
      {[ [345, 30], [610, 30] ].map(([x, y], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: 64,
            height: 64,
            borderRadius: 99,
            background: S.gold,
            color: S.greenDeep,
            fontFamily: SF.sans,
            fontWeight: 800,
            fontSize: 44,
            lineHeight: '64px',
            textAlign: 'center',
            transform: `scale(${q})`,
          }}
        >
          ؟
        </div>
      ))}
      {/* the maker knows: arrow from the made thing back to its maker */}
      <svg width={SW} height={120} style={{position: 'absolute', top: -70, left: 0, overflow: 'visible'}}>
        <path
          d="M 270 110 Q 540 -40 800 100"
          fill="none"
          stroke={S.goldHi}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray="1"
          pathLength={1}
          strokeDashoffset={1 - arrow}
          opacity={1 - out}
        />
        <path
          d="M 776 70 L 800 100 L 764 106"
          fill="none"
          stroke={S.goldHi}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={prog(arrow, 0.85, 1) * (1 - out)}
        />
      </svg>
    </div>
  );
};

const Names: React.FC<{t: number}> = ({t}) => {
  const N = T.names;
  const out = prog(t, N.out - 0.35, N.out, easeIn);
  if (t < N.in - 0.1 || out >= 1) return null;
  const names = ['الخالق', 'المبدع', 'المصوِّر'];
  return (
    <div style={{position: 'absolute', top: 1170, left: 0, right: 0, opacity: 1 - out, direction: 'rtl', display: 'flex', justifyContent: 'center'}}>
     <div style={{padding: '16px 44px 26px', borderRadius: 34, background: S.glass, border: `2px solid ${S.gold}`, backdropFilter: 'blur(14px)', boxShadow: '0 18px 50px rgba(0,0,0,0.35)', opacity: prog(t, N.in - 0.1, N.in + 0.3, easeOut)}}>
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18}}>
        {names.map((n, i) => {
          const a = N.in + i * N.step;
          const k = prog(t, a, a + 0.7, easeOut);
          return (
            <React.Fragment key={n}>
              {i > 0 ? (
                <div style={{opacity: k}}>
                  <Star size={34} k={k} weight={6} rotate={t * 30} />
                </div>
              ) : null}
              <div
                style={{
                  fontFamily: SF.ruqaa,
                  fontWeight: 700,
                  fontSize: 88,
                  whiteSpace: 'nowrap',
                  color: S.goldHi,
                  textShadow: '0 0 30px rgba(211,171,76,0.45), 0 8px 20px rgba(0,0,0,0.5)',
                  opacity: k,
                  transform: `translateY(${(1 - k) * 40}px)`,
                  filter: `blur(${(1 - k) * 8}px)`,
                }}
              >
                {n}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 10,
          textAlign: 'center',
          fontFamily: SF.naskh,
          fontWeight: 700,
          fontSize: 54,
          color: S.cream,
          opacity: prog(t, N.in + 3 * N.step, N.in + 3 * N.step + 0.6, easeOut),
        }}
      >
        سبحانه وبحمده
      </div>
     </div>
    </div>
  );
};

const Remedies: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const R = T.remedies;
  const out = prog(t, R.out - 0.35, R.out, easeIn);
  if (t < R.in - 0.1 || out >= 1) return null;
  const items: [string, string][] = [
    ['honey', 'عسل'],
    ['cup', 'حجامة'],
    ['seeds', 'حبة البركة'],
    ['bowl', 'تلبينة'],
    ['root', 'القسط الهندي'],
  ];
  const title = sp(frame, R.title, {damping: 12, stiffness: 190, mass: 0.75}, FPS) * (1 - out);
  return (
    <div style={{position: 'absolute', top: 975, left: 0, right: 0, opacity: 1 - out}}>
      <div style={{height: 105, position: 'relative'}}>
        <Chip k={title} icon="book" label="الطب النبوي" top={0} />
      </div>
      <div style={{display: 'flex', direction: 'rtl', justifyContent: 'center', gap: 12}}>
        {items.map(([ic, label], i) => {
          const a = R.items[i];
          const hero = ic === 'cup';
          const k = sp(frame, a, hero ? {damping: 8, stiffness: 200} : {damping: 11, stiffness: 220, mass: 0.7}, FPS);
          const hot = hero ? prog(t, a + 0.15, a + 0.5, easeOut) : 0;
          return (
            <div key={ic} style={{transform: `scale(${hero ? lerp(1, 1.1, hot) : 1})`}}>
              <Card k={k} icon={ic} label={label} w={190} h={210} hot={hot} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Gold star bloom marking a new chapter. */
const SectionBloom: React.FC<{t: number}> = ({t}) => (
  <>
    {(T.sections as number[]).map((s) => {
      const k = prog(t, s - 0.1, s + 0.8, easeOut);
      if (k <= 0 || k >= 1) return null;
      return (
        <AbsoluteFill key={s} style={{alignItems: 'center', justifyContent: 'center', opacity: (1 - k) * 0.7}}>
          <Star size={lerp(200, 2600, k)} k={1} weight={lerp(10, 3, k)} rotate={k * 40} color={S.goldHi} />
        </AbsoluteFill>
      );
    })}
  </>
);

const EndCard: React.FC<{t: number; frame: number; c: Client}> = ({t, frame, c}) => {
  const E = T.end;
  const bg = prog(t, E.in - 0.1, E.in + 0.6, easeInOut);
  if (bg <= 0) return null;
  const logo = sp(frame, E.in + 0.25, {damping: 8, stiffness: 200}, FPS);
  const name = prog(t, E.in + 0.7, E.in + 1.4, easeOut);
  const phone = sp(frame, E.in + 1.25, {damping: 11, stiffness: 220, mass: 0.7}, FPS);
  const addr = prog(t, E.in + 1.7, E.in + 2.3, easeOut);
  const cta = sp(frame, E.in + 2.2, {damping: 10, stiffness: 210, mass: 0.7}, FPS);
  return (
    <AbsoluteFill style={{direction: 'rtl'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 38%, ${S.green} 0%, ${S.greenDeep} 70%)`,
          opacity: bg * 0.94,
        }}
      />
      <AbsoluteFill style={{alignItems: 'center', opacity: bg}}>
        <div style={{position: 'absolute', top: 360, width: 420, height: 420, transform: `scale(${logo})`}}>
          <div style={{position: 'absolute', inset: -120, opacity: 0.55}}>
            <Star size={660} k={prog(t, E.in, E.in + 1.4, easeOut)} rotate={t * 8} weight={1.6} />
          </div>
          <Img src={staticFile('talk/logo_shape.png')} style={{position: 'absolute', left: 30, top: -10, width: 361, height: 420, filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.55))'}} />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 860,
            fontFamily: SF.ruqaa,
            fontWeight: 700,
            fontSize: 118,
            color: S.goldHi,
            textShadow: '0 0 30px rgba(211,171,76,0.4)',
            opacity: name,
            transform: `translateY(${(1 - name) * 30}px)`,
          }}
        >
          {c.name}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 1065,
            padding: '14px 54px',
            borderRadius: 999,
            background: S.gold,
            color: S.greenDeep,
            fontFamily: SF.sans,
            fontWeight: 800,
            fontSize: 84,
            letterSpacing: '0.02em',
            direction: 'ltr',
            transform: `scale(${phone})`,
            boxShadow: '0 14px 40px rgba(0,0,0,0.4)',
          }}
        >
          {c.phone}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 1250,
            textAlign: 'center',
            fontFamily: SF.sans,
            fontWeight: 600,
            fontSize: 44,
            lineHeight: 1.5,
            color: S.cream,
            opacity: addr,
          }}
        >
          {c.addr1}
          <br />
          {c.addr2}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 1450,
            padding: '12px 40px',
            borderRadius: 999,
            border: `2px solid ${S.gold}`,
            color: S.goldHi,
            fontFamily: SF.sans,
            fontWeight: 800,
            fontSize: 46,
            transform: `scale(${cta})`,
          }}
        >
          احجز موعدك الآن
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------- the piece ---------- */

/** Client details come in as props at render time (kept out of the repo). */
export type Client = {name: string; phone: string; addr1: string; addr2: string};
export const CLIENT_PLACEHOLDER: Client = {
  name: 'اسم المركز',
  phone: '01000000000',
  addr1: 'المدينة · الشارع',
  addr2: 'علامة مميزة قريبة',
};

export const TalkVideo: React.FC<Client> = (c) => {
  useTalkFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const z = zoomAt(t);
  const H = T.hero;
  const hero = env(t, H.in - 0.1, H.out, 0.6, 0.5);
  const HK = T.hook;
  const hook = prog(t, -0.3, 0.35, easeOut) * (1 - prog(t, HK.out - 0.4, HK.out, easeIn));
  const halo = Math.max(hero, hook);
  const endBlur = prog(t, T.end.in - 0.1, T.end.in + 0.6, easeInOut);
  const intro = prog(t, 0, 1.2, easeOut);

  return (
    <AbsoluteFill style={{background: S.greenDeep}}>
      <AbsoluteFill
        style={{
          transform: `scale(${z * lerp(1.06, 1, intro)})`,
          transformOrigin: '540px 520px',
          filter: endBlur > 0 ? `blur(${endBlur * 22}px)` : undefined,
        }}
      >
        <Freeze frame={Math.min(frame, Math.floor((T.voiceEnd - 0.1) * FPS))}>
          <OffthreadVideo src={staticFile('talk/plate.mp4')} muted style={{width: SW, height: SH}} />
        </Freeze>
        {/* hero: a slowly turning star of light that sits BEHIND the speaker */}
        {halo > 0 ? (
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 900, opacity: halo}}>
            <div style={{filter: 'drop-shadow(0 0 30px rgba(240,212,138,0.8))'}}>
              <Star size={lerp(500, 820, halo)} k={halo} weight={5} rotate={t * 12} color={S.goldHi} fill="rgba(211,171,76,0.10)" />
            </div>
          </AbsoluteFill>
        ) : null}
        {halo > 0 ? (
          <OffthreadVideo
            src={staticFile('talk/person.webm')}
            transparent
            muted
            style={{position: 'absolute', top: 0, left: 0, width: SW, height: SH}}
          />
        ) : null}
      </AbsoluteFill>

      {/* a dim gold LED wash low on the right wall */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse 60% 30% at 100% 22%, rgba(240,212,138,0.16), transparent 70%)',
          mixBlendMode: 'screen',
          opacity: 1 - endBlur,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(5,40,34,0.55) 0%, rgba(5,40,34,0) 14%, rgba(5,40,34,0) 62%, rgba(5,40,34,0.55) 100%)',
        }}
      />

      <SectionBloom t={t} />
      <Chip
        k={sp(frame, T.hadith.in, {damping: 12, stiffness: 190, mass: 0.75}, FPS) * (1 - prog(t, T.hadith.out - 0.3, T.hadith.out, easeIn)) * (1 - hero)}
        icon="book"
        label="حديث شريف"
        top={1210}
      />
      {/* hero line, big and calligraphic */}
      {hero > 0 ? (
        <div
          style={{
            position: 'absolute',
            top: 1150,
            left: 0,
            right: 0,
            textAlign: 'center',
            direction: 'rtl',
            fontFamily: SF.ruqaa,
            fontWeight: 700,
            fontSize: 210,
            color: S.goldHi,
            textShadow: '0 0 40px rgba(211,171,76,0.55), 0 12px 30px rgba(0,0,0,0.55)',
            opacity: hero,
            transform: `scale(${lerp(0.9, 1, hero)})`,
            filter: `blur(${(1 - hero) * 10}px)`,
          }}
        >
          الله الطبيب
        </div>
      ) : null}
      {hook > 0 ? (
        <div
          style={{
            position: 'absolute',
            top: 1120,
            left: 0,
            right: 0,
            textAlign: 'center',
            direction: 'rtl',
            opacity: clamp01(hook * 1.3),
          }}
        >
          <div
            style={{
              fontFamily: SF.sans,
              fontWeight: 800,
              fontSize: 120,
              lineHeight: 1.15,
              color: S.cream,
              textShadow: '0 10px 30px rgba(0,0,0,0.6)',
              transform: `scale(${lerp(1.25, 1, prog(t, -0.3, 0.45, easeOut))})`,
            }}
          >
            مين أعلم
            <br />
            <span style={{color: S.goldHi, textShadow: '0 0 40px rgba(211,171,76,0.6), 0 10px 30px rgba(0,0,0,0.6)'}}>
              بعلاج جسمك؟
            </span>
          </div>
          <div style={{position: 'relative', height: 90, marginTop: 18}}>
            <Chip
              k={sp(frame, HK.answer, {damping: 11, stiffness: 210, mass: 0.7}, FPS) * (1 - prog(t, HK.out - 0.4, HK.out, easeIn))}
              icon="book"
              label="الإجابة في حديث شريف"
              top={0}
            />
          </div>
        </div>
      ) : null}
      <Machine t={t} frame={frame} />
      <Names t={t} />
      {(() => {
        const F = T.final;
        const k = sp(frame, F.in, {damping: 10, stiffness: 210, mass: 0.7}, FPS) * (1 - prog(t, F.out - 0.3, F.out, easeIn));
        if (k <= 0.001) return null;
        return (
          <div style={{position: 'absolute', top: 1110, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${k})`}}>
            <Icon name="seal" size={190} k={prog(t, F.in, F.in + 0.8)} weight={4} rotate={t * 10} />
          </div>
        );
      })()}
      {(() => {
        const B = T.body;
        const k = sp(frame, B.in, {damping: 12, stiffness: 190, mass: 0.75}, FPS) * (1 - prog(t, B.out - 0.3, B.out, easeIn));
        if (k <= 0.001) return null;
        return (
          <div style={{position: 'absolute', top: 1060, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
            <Card k={k} icon="body" w={240} h={250} />
          </div>
        );
      })()}
      <Remedies t={t} frame={frame} />
      <Captions t={t} />
      <Badge t={t} frame={frame} />
      <EndCard t={t} frame={frame} c={c} />
      <Grain frame={frame} opacity={0.07} />
      <Audio src={staticFile('talk/mix.wav')} />
    </AbsoluteFill>
  );
};
