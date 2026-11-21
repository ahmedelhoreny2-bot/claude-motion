import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  Freeze,
  Img,
  OffthreadVideo,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {Grain, Mask} from '../components/primitives';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog, sp} from '../lib';
import {S, SF, SH, SW, T} from './theme';

const FPS = T.fps;
type Cap = [number, number, string, string];
type Pic = [string, number, number, string, string];
const CAPS = T.cap as Cap[];
const PICS = T.imgs as Pic[];
const RINGS = T.rings as [number, number, string][];
const TRANS = T.transitions as [number, string][];

/** Client details come in as props at render time (kept out of the repo). */
export type Client = {name: string; phone: string; addr1: string; addr2: string};
export const CLIENT_PLACEHOLDER: Client = {
  name: 'اسم المركز',
  phone: '01000000000',
  addr1: 'المدينة · الشارع',
  addr2: 'علامة مميزة قريبة',
};

type Track = {x: number[]; y: number[]};

const useAssets = () => {
  const [h] = useState(() => delayRender('talk-assets'));
  const [track, setTrack] = useState<Track | null>(null);
  useEffect(() => {
    Promise.all([
      document.fonts.load('800 60px "Cairo"'),
      document.fonts.load('600 60px "Cairo"'),
      document.fonts.load('700 60px "Amiri"'),
      document.fonts.load('700 60px "Aref Ruqaa"'),
      fetch(staticFile('talk/track.json'))
        .then((r) => r.json())
        .then(setTrack)
        .catch(() => setTrack({x: [540], y: [430]})),
    ]).then(() => continueRender(h));
  }, [h]);
  return track;
};

const env = (t: number, a: number, b: number, inD = 0.45, outD = 0.35) =>
  prog(t, a, a + inD, easeOut) * (1 - prog(t, b - outD, b, easeIn));

const zoomAt = (t: number) => {
  const z = T.zoom as [number, number][];
  let s = z[0][1];
  for (const [at, v] of z) s = lerp(s, v, prog(t, at - 0.2, at + 0.9, easeInOut));
  s *= lerp(1.18, 1, prog(t, 0, 1.6, easeOut));
  return s * (1 + 0.01 * Math.sin(t * 0.35));
};
const ORIGIN = {x: 540, y: 560};

/* ---------- captions that live behind the speaker ---------- */

const capAt = (t: number) =>
  CAPS.findIndex(([a, b], j) => {
    const next = CAPS[j + 1]?.[0] ?? b + 0.4;
    const end = next - b < 0.45 ? next : b + 0.2;
    return t >= a && t < end;
  });

const Words: React.FC<{text: string; t: number; t0: number; font: string; size: number; weight: number; color?: string}> = ({
  text,
  t,
  t0,
  font,
  size,
  weight,
  color = S.cream,
}) => {
  const words = text.split(' ');
  return (
    <span style={{fontFamily: font, fontSize: size, fontWeight: weight, lineHeight: 1.3}}>
      {words.map((w, i) => {
        const hl = w.includes('*');
        const k = prog(t, t0 + i * 0.07, t0 + i * 0.07 + 0.5, easeOut);
        return (
          <React.Fragment key={i}>
            <Mask k={k} tilt={0}>
              <span style={{color: hl ? S.orangeHi : color, textShadow: S.shadow}}>{w.replace(/\*/g, '')}</span>
            </Mask>
            {i < words.length - 1 ? ' ' : ''}
          </React.Fragment>
        );
      })}
    </span>
  );
};

/** Normal speech: sits behind the speaker on the table and rises out from behind his body. */
const BehindCaption: React.FC<{t: number}> = ({t}) => {
  const i = capAt(t);
  if (i < 0) return null;
  const [a, b, text, style] = CAPS[i];
  if (style !== 'n' && style !== 'h') return null;
  const next = CAPS[i + 1]?.[0] ?? b + 0.4;
  const end = next - b < 0.45 ? next : b + 0.2;
  const k = prog(t, a - 0.05, a + 0.45, easeOut);
  const out = prog(t, end - 0.2, end, easeIn);
  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        top: lerp(1190, 1330, k) - out * 120,
        textAlign: 'center',
        direction: 'rtl',
        opacity: (1 - out) * clamp01(k * 2),
      }}
    >
      <Words
        text={text}
        t={t}
        t0={a}
        font={style === 'h' ? SF.naskh : SF.sans}
        size={style === 'h' ? 74 : 70}
        weight={style === 'h' ? 700 : 800}
      />
    </div>
  );
};

/* ---------- the ring: words orbit the speaker's head ---------- */

const ringItems = (text: string) => {
  const reps = text.split(' ').length > 2 ? 2 : 3;
  return Array.from({length: reps}, () => text);
};

const Ring: React.FC<{t: number; head: {x: number; y: number}; front: boolean}> = ({t, head, front}) => {
  const r = RINGS.find(([a, b]) => t >= a - 0.3 && t < b + 0.1);
  if (!r) return null;
  const [a, b, text] = r;
  const k = env(t, a - 0.3, b + 0.1, 0.7, 0.45);
  const items = ringItems(text);
  const long = text.length > 12;
  const rx = lerp(200, long ? 330 : 380, k);
  const ry = lerp(40, 95, k);
  const cx = lerp(head.x, 540, 0.5);
  const cy = head.y + 205;
  const spin = (t - a) * 0.75;
  return (
    <AbsoluteFill style={{direction: 'rtl'}}>
      {items.map((txt, i) => {
        const th = spin + (i / items.length) * Math.PI * 2;
        const s = Math.sin(th);
        const isFront = s > 0;
        if (isFront !== front) return null;
        const depth = (s + 1) / 2;
        const x = cx + rx * Math.cos(th);
        const y = cy + ry * s;
        const scale = lerp(0.62, 1.12, depth);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              transform: `translate(-50%, -50%) scale(${scale})`,
              whiteSpace: 'nowrap',
              fontFamily: SF.sans,
              fontWeight: 800,
              fontSize: long ? 60 : 80,
              color: depth > 0.5 ? S.cream : S.orangeHi,
              textShadow: S.shadow,
              opacity: k * lerp(0.55, 1, depth),
              filter: `blur(${(1 - depth) * 2.2}px)`,
            }}
          >
            {txt}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- pictures ---------- */

const TORN =
  'polygon(0% 2%, 6% 0%, 13% 1.5%, 22% 0.2%, 31% 1.8%, 40% 0%, 52% 1.6%, 61% 0.3%, 72% 2%, 83% 0.4%, 92% 1.7%, 100% 0%, 98.6% 9%, 100% 21%, 98.8% 34%, 100% 47%, 98.5% 61%, 100% 74%, 98.7% 88%, 100% 100%, 91% 98.4%, 80% 100%, 69% 98.6%, 58% 100%, 47% 98.3%, 36% 100%, 25% 98.5%, 14% 100%, 5% 98.6%, 0% 100%, 1.4% 87%, 0% 73%, 1.6% 60%, 0% 46%, 1.3% 33%, 0% 19%, 1.5% 9%)';

const SLOTS: Record<string, {x: number; y: number; w: number; r: number}> = {
  L: {x: 30, y: 190, w: 370, r: -6},
  R: {x: 680, y: 220, w: 370, r: 5},
  T: {x: 355, y: 40, w: 370, r: -2},
  R2: {x: 720, y: 640, w: 320, r: -4},
  L2: {x: 30, y: 650, w: 320, r: 6},
};

/** Torn-paper photo cards pinned on the wall behind the speaker. */
const BehindPics: React.FC<{t: number; frame: number}> = ({t, frame}) => (
  <>
    {PICS.filter((p) => p[3] === 'behind').map(([file, a, b, , slot], i) => {
      if (t < a - 0.1 || t > b + 0.1) return null;
      const s = SLOTS[slot];
      const pop = sp(frame, a, {damping: 12, stiffness: 170, mass: 0.8}, FPS);
      const out = prog(t, b - 0.4, b, easeIn);
      const k = pop * (1 - out);
      const hero = file === '09' && a > 80;
      const fromX = 540 - s.w / 2;
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: lerp(fromX, s.x, k),
            top: lerp(s.y + 160, s.y, k) + Math.sin(t * 0.8 + i) * 6,
            width: s.w,
            transform: `rotate(${lerp(0, s.r, k) + Math.sin(t * 0.5 + i) * 0.8}deg) scale(${lerp(0.55, 1, k)})`,
            opacity: clamp01(k * 1.5),
            filter: `drop-shadow(0 18px 28px rgba(0,0,0,0.55))${hero ? ` drop-shadow(0 0 ${30 * k}px rgba(243,147,37,0.9))` : ''}`,
          }}
        >
          <div style={{background: hero ? S.orange : S.paper, padding: 14, clipPath: TORN}}>
            <Img src={staticFile(`talk/img/${file}.jpg`)} style={{width: '100%', display: 'block', aspectRatio: '4 / 5', objectFit: 'cover'}} />
          </div>
        </div>
      );
    })}
  </>
);

/** A wide brush stroke that paints the picture on, like an ink calligraphy pen. */
const InkReveal: React.FC<{k: number; id: string; children: React.ReactNode}> = ({k, id, children}) => (
  <svg width={SW} height={SH} style={{position: 'absolute', inset: 0}}>
    <defs>
      <filter id={`rough-${id}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={3} seed={4} />
        <feDisplacementMap in="SourceGraphic" scale={140} />
      </filter>
      <mask id={`ink-${id}`}>
        <rect width={SW} height={SH} fill="black" />
        <g filter={`url(#rough-${id})`}>
          <path
            d="M 1180 260 C 700 120, 300 420, -100 300 M -100 300 C 300 700, 800 600, 1180 900 M 1180 900 C 700 1100, 300 1300, -100 1250 M -100 1250 C 300 1600, 800 1500, 1180 1800"
            fill="none"
            stroke="white"
            strokeWidth={560}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - k}
          />
        </g>
      </mask>
    </defs>
    <foreignObject width={SW} height={SH} mask={`url(#ink-${id})`}>
      {children}
    </foreignObject>
  </svg>
);

const FullPic: React.FC<{t: number}> = ({t}) => (
  <>
    {PICS.filter((p) => p[3] === 'full').map(([file, a, b], i) => {
      if (t < a - 0.05 || t > b + 0.7) return null;
      const kin = prog(t, a - 0.05, a + 0.75, easeInOut);
      const tear = prog(t, b, b + 0.65, easeIn);
      const kb = lerp(1.04, 1.14, prog(t, a, b + 0.7, (x) => x));
      const pic = (dx: number, clip: string) => (
        <AbsoluteFill style={{clipPath: clip, transform: `translate(${dx}px, ${Math.abs(dx) * 0.25}px) rotate(${dx * 0.004}deg)`}}>
          <Img src={staticFile(`talk/img/${file}.jpg`)} style={{width: SW, height: SH, objectFit: 'cover', transform: `scale(${kb})`}} />
          <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.55))'}} />
        </AbsoluteFill>
      );
      const body =
        tear > 0 ? (
          <>
            {pic(-tear * 900, 'polygon(0 0, 62% 0, 55% 18%, 60% 34%, 49% 52%, 56% 70%, 44% 86%, 50% 100%, 0 100%)')}
            {pic(tear * 900, 'polygon(62% 0, 100% 0, 100% 100%, 50% 100%, 44% 86%, 56% 70%, 49% 52%, 60% 34%, 55% 18%)')}
          </>
        ) : (
          pic(0, 'none')
        );
      return kin < 1 ? (
        <InkReveal key={i} k={kin} id={`p${i}`}>
          <div style={{width: SW, height: SH, position: 'relative'}}>{body}</div>
        </InkReveal>
      ) : (
        <AbsoluteFill key={i}>{body}</AbsoluteFill>
      );
    })}
  </>
);

/** Captions that ride on a full-frame picture (the hadith, the names). */
const OverPicText: React.FC<{t: number}> = ({t}) => {
  const i = capAt(t);
  if (i >= 0 && CAPS[i][3] === 'hb') {
    const [a, b, text] = CAPS[i];
    const next = CAPS[i + 1]?.[0] ?? b + 0.4;
    const end = next - b < 0.45 ? next : b + 0.2;
    const out = prog(t, end - 0.2, end, easeIn);
    return (
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', direction: 'rtl', opacity: 1 - out}}>
        <div style={{textAlign: 'center', maxWidth: 900, padding: '0 40px'}}>
          <div style={{fontFamily: SF.naskh, fontSize: 120, color: S.orangeHi, lineHeight: 0.6, textShadow: S.shadow}}>«</div>
          <Words text={text} t={t} t0={a + 0.05} font={SF.naskh} size={84} weight={700} />
        </div>
      </AbsoluteFill>
    );
  }
  const n = PICS.find((p) => p[0] === '07' && p[3] === 'full');
  if (n && t > n[1] + 2.8 && t < n[2]) {
    const names = ['الخالق', 'المبدع', 'المصوِّر'];
    const base = 63.35;
    return (
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', direction: 'rtl'}}>
        {names.map((w, j) => {
          const kk = prog(t, base + j * 0.95, base + j * 0.95 + 0.7, easeOut) * (1 - prog(t, n[2] - 0.3, n[2], easeIn));
          return (
            <div
              key={w}
              style={{
                fontFamily: SF.ruqaa,
                fontWeight: 700,
                fontSize: 150,
                lineHeight: 1.25,
                color: j === 1 ? S.orangeHi : S.cream,
                textShadow: S.shadow,
                opacity: kk,
                transform: `translateY(${(1 - kk) * 50}px)`,
                filter: `blur(${(1 - kk) * 10}px)`,
              }}
            >
              {w}
            </div>
          );
        })}
      </AbsoluteFill>
    );
  }
  return null;
};

/** Warm light leak washing across the frame on chapter changes. */
const Leaks: React.FC<{t: number}> = ({t}) => (
  <>
    {TRANS.filter(([, kind]) => kind === 'leak').map(([at], i) => {
      const k = prog(t, at - 0.3, at + 0.9, (x) => x);
      if (k <= 0 || k >= 1) return null;
      const a = Math.sin(k * Math.PI);
      return (
        <AbsoluteFill
          key={i}
          style={{
            mixBlendMode: 'screen',
            opacity: a * 0.85,
            background: `radial-gradient(ellipse 55% 40% at ${lerp(115, -15, k)}% ${lerp(20, 70, k)}%, rgba(255,150,50,0.9), transparent 70%), radial-gradient(ellipse 45% 35% at ${lerp(-10, 110, k)}% ${lerp(80, 30, k)}%, rgba(47,163,223,0.55), transparent 70%)`,
          }}
        />
      );
    })}
  </>
);

const RemedyTitle: React.FC<{t: number}> = ({t}) => {
  const a = T.remedyTitle;
  const k = env(t, a, 99.45, 0.5, 0.35);
  if (k <= 0) return null;
  return (
    <div style={{position: 'absolute', top: 1040, left: 0, right: 0, textAlign: 'center', direction: 'rtl'}}>
      <span
        style={{
          fontFamily: SF.ruqaa,
          fontWeight: 700,
          fontSize: 130,
          color: S.cream,
          textShadow: S.shadow,
          opacity: k,
          display: 'inline-block',
          transform: `scale(${lerp(0.8, 1, k)})`,
          backgroundImage: `linear-gradient(${S.orange}, ${S.orange})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${k * 100}% 22%`,
          backgroundPosition: '100% 88%',
          padding: '0 20px',
        }}
      >
        الطب النبوي
      </span>
    </div>
  );
};

const Hook: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const H = T.hook;
  const k = sp(frame, H.answer, {damping: 11, stiffness: 210, mass: 0.7}, FPS) * (1 - prog(t, H.out - 0.4, H.out, easeIn));
  if (k <= 0.001) return null;
  return (
    <div style={{position: 'absolute', top: 1400, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div
        style={{
          direction: 'rtl',
          padding: '12px 34px',
          borderRadius: 999,
          background: S.orange,
          color: S.ink,
          fontFamily: SF.sans,
          fontWeight: 800,
          fontSize: 44,
          transform: `scale(${k})`,
          boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
        }}
      >
        الإجابة في حديث شريف
      </div>
    </div>
  );
};

const Watermark: React.FC<{t: number}> = ({t}) => {
  const k = prog(t, 0.5, 1.3, easeOut) * (1 - prog(t, T.end.in - 0.4, T.end.in, easeIn));
  return (
    <Img
      src={staticFile('talk/logo.png')}
      style={{position: 'absolute', left: 48, top: 150, width: 120, opacity: 0.92 * k, filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.5))'}}
    />
  );
};

const EndCard: React.FC<{t: number; frame: number; c: Client}> = ({t, frame, c}) => {
  const E = T.end;
  const bg = prog(t, E.in - 0.1, E.in + 0.6, easeInOut);
  if (bg <= 0) return null;
  const logo = sp(frame, E.in + 0.2, {damping: 12, stiffness: 160}, FPS);
  const name = prog(t, E.in + 0.7, E.in + 1.4, easeOut);
  const phone = sp(frame, E.in + 1.2, {damping: 11, stiffness: 220, mass: 0.7}, FPS);
  const addr = prog(t, E.in + 1.6, E.in + 2.2, easeOut);
  const cta = sp(frame, E.in + 2.1, {damping: 10, stiffness: 210, mass: 0.7}, FPS);
  return (
    <AbsoluteFill style={{direction: 'rtl'}}>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(22,18,14,0.55), rgba(22,18,14,0.85))', opacity: bg}} />
      <AbsoluteFill style={{alignItems: 'center', opacity: bg}}>
        <Img
          src={staticFile('talk/logo.png')}
          style={{position: 'absolute', top: 330, width: 380, transform: `scale(${logo})`, filter: 'drop-shadow(0 24px 40px rgba(0,0,0,0.6))'}}
        />
        <div style={{position: 'absolute', top: 820, fontFamily: SF.ruqaa, fontWeight: 700, fontSize: 112, color: S.cream, textShadow: S.shadow, opacity: name, transform: `translateY(${(1 - name) * 30}px)`}}>
          {c.name}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 1020,
            padding: '12px 54px',
            borderRadius: 999,
            background: S.orange,
            color: S.ink,
            fontFamily: SF.sans,
            fontWeight: 800,
            fontSize: 84,
            direction: 'ltr',
            transform: `scale(${phone})`,
            boxShadow: '0 14px 40px rgba(0,0,0,0.45)',
          }}
        >
          {c.phone}
        </div>
        <div style={{position: 'absolute', top: 1210, textAlign: 'center', fontFamily: SF.sans, fontWeight: 600, fontSize: 44, lineHeight: 1.5, color: S.cream, opacity: addr}}>
          {c.addr1}
          <br />
          {c.addr2}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 1410,
            padding: '12px 40px',
            borderRadius: 999,
            border: `3px solid ${S.blue}`,
            color: S.cream,
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

export const TalkVideo: React.FC<Client> = (c) => {
  const track = useAssets();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const z = zoomAt(t);
  const endBlur = prog(t, T.end.in - 0.1, T.end.in + 0.6, easeInOut);
  const vf = Math.min(frame, Math.floor((T.voiceEnd - 0.1) * FPS));
  const tr = track ?? {x: [540], y: [430]};
  const hi = Math.min(vf, tr.x.length - 1);
  const head = {x: tr.x[hi], y: tr.y[hi]};

  return (
    <AbsoluteFill style={{background: S.ink}}>
      <AbsoluteFill
        style={{
          transform: `scale(${z})`,
          transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px`,
          filter: endBlur > 0 ? `blur(${endBlur * 20}px)` : undefined,
        }}
      >
        <Freeze frame={vf}>
          <OffthreadVideo src={staticFile('talk/nat.mp4')} muted style={{width: SW, height: SH}} />
        </Freeze>
        <BehindPics t={t} frame={frame} />
        <BehindCaption t={t} />
        <Ring t={t} head={head} front={false} />
        <Freeze frame={vf}>
          <OffthreadVideo src={staticFile('talk/person.webm')} transparent muted style={{position: 'absolute', inset: 0, width: SW, height: SH}} />
        </Freeze>
        <Ring t={t} head={head} front />
      </AbsoluteFill>

      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 65% at 50% 40%, transparent 55%, rgba(0,0,0,0.38))'}} />
      <RemedyTitle t={t} />
      <Hook t={t} frame={frame} />
      <FullPic t={t} />
      <OverPicText t={t} />
      <Leaks t={t} />
      <Watermark t={t} />
      <EndCard t={t} frame={frame} c={c} />
      <Grain frame={frame} opacity={0.05} />
      <Audio src={staticFile('talk/mix.wav')} />
    </AbsoluteFill>
  );
};
