import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  Freeze,
  OffthreadVideo,
  Sequence,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {Grain} from '../components/primitives';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog, sp} from '../lib';
import {T} from './theme';

/* إبداع بيتحرك identity */
const B = {
  cream: '#F4F1EA',
  paper: '#EDE6D6',
  white: '#FFFDF8',
  ink: '#161514',
  orange: '#FF5A20',
  orangeDk: '#E5470F',
  teal: '#13C2B5',
};
const AF = '"Alexandria", system-ui, sans-serif';
const FPS = 30;

export const SHOW = {intro: 1.8, after: T.duration, outro: 3.0};
export const SHOW_LEN = SHOW.intro + SHOW.after + SHOW.outro;

const E = T.edit;
const OFF = E.hookLen + E.rewind - E.bodySrc;
/** after-video seconds → source seconds (same edit map as the reel) */
const srcAt = (t: number) => {
  if (t < E.hookLen) return E.hookSrc + t;
  if (t < E.hookLen + E.rewind) return lerp(E.hookSrc + E.hookLen, E.bodySrc, easeInOut(prog(t, E.hookLen, E.hookLen + E.rewind, (x) => x)));
  return t - OFF;
};

const useFontsReady = () => {
  const [h] = useState(() => delayRender('alexandria'));
  useEffect(() => {
    Promise.all([
      document.fonts.load('900 60px "Alexandria"'),
      document.fonts.load('800 60px "Alexandria"'),
      document.fonts.load('600 60px "Alexandria"'),
    ]).then(() => continueRender(h));
  }, [h]);
};

/** The brand mark, drawn so it can animate: a play triangle pointing left (RTL) and three dashes. */
const Mark: React.FC<{size: number; k: number; dash: number[]}> = ({size, k, dash}) => (
  <svg width={size} height={size * 0.56} viewBox="0 0 500 280" style={{display: 'block', overflow: 'visible'}}>
    <g transform={`translate(${lerp(-60, 0, k) + 140} 140) scale(${k}) translate(-140 -140)`}>
      <path d="M262 12 Q275 6 275 22 V258 Q275 274 262 268 L22 150 Q6 140 22 130 Z" fill={B.orange} />
    </g>
    {[
      [70, 0.84, B.teal],
      [140, 1, B.orange],
      [210, 0.84, B.teal],
    ].map(([y, w, c], i) => (
      <rect key={i} x={330} y={(y as number) - 20} height={40} rx={20} width={Math.max(0.01, 160 * (w as number) * dash[i])} fill={c as string} />
    ))}
  </svg>
);

const Lockup: React.FC<{scale: number; k: number; dash: number[]; word: number}> = ({scale, k, dash, word}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${scale})`, transformOrigin: '50% 0%'}}>
    <Mark size={330} k={k} dash={dash} />
    <div style={{overflow: 'hidden', marginTop: 6}}>
      <div style={{fontFamily: AF, fontWeight: 900, fontSize: 96, lineHeight: 1.25, direction: 'rtl', transform: `translateY(${(1 - word) * 110}%)`, whiteSpace: 'nowrap'}}>
        <span style={{color: B.ink}}>إبداع </span>
        <span style={{color: B.orange}}>بيتحرك</span>
      </div>
    </div>
  </div>
);

const Chip: React.FC<{label: string; en: string; hot?: boolean; k: number}> = ({label, en, hot, k}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 14,
      direction: 'rtl',
      padding: '10px 24px',
      borderRadius: 999,
      background: hot ? B.orange : B.white,
      border: hot ? 'none' : `2.5px solid ${B.ink}`,
      color: hot ? B.white : B.ink,
      fontFamily: AF,
      transform: `scale(${k})`,
      transformOrigin: '100% 50%',
      boxShadow: hot ? '0 10px 24px rgba(229,71,15,0.35)' : '0 6px 16px rgba(22,21,20,0.08)',
    }}
  >
    <span style={{fontWeight: 900, fontSize: 38}}>{label}</span>
    <span style={{fontWeight: 800, fontSize: 24, letterSpacing: '0.18em', opacity: 0.85, direction: 'ltr'}}>{en}</span>
  </div>
);

const Card: React.FC<{w: number; h: number; children: React.ReactNode; accent?: string}> = ({w, h, children, accent}) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 44,
      padding: 10,
      background: B.white,
      boxShadow: `0 30px 70px rgba(22,21,20,0.22), 0 0 0 2px ${accent ?? 'rgba(22,21,20,0.06)'}`,
    }}
  >
    <div style={{width: '100%', height: '100%', borderRadius: 36, overflow: 'hidden', position: 'relative', background: B.ink}}>{children}</div>
  </div>
);

/* layout */
const AFTER = {x: 312, y: 300, w: 720, h: 1280};
const BEFORE = {x: 40, y: 840, w: 330, h: 587};

export const Showcase: React.FC = () => {
  useFontsReady();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const ta = t - SHOW.intro; // after-video time
  const outroAt = SHOW.intro + SHOW.after;

  // intro: the mark builds in the centre, then flies to the header
  const mk = sp(frame, 0.1, {damping: 12, stiffness: 160, mass: 0.8}, FPS);
  const dash = [0, 1, 2].map((i) => prog(t, 0.35 + i * 0.12, 0.8 + i * 0.12, easeOut));
  const word = prog(t, 0.6, 1.1, easeOut);
  const dock = prog(t, 1.0, 1.6, easeInOut);
  const undock = prog(t, outroAt + 0.3, outroAt + 1.1, easeInOut);
  const center = Math.max(1 - dock, undock);
  const lockScale = lerp(0.36, 1, center);
  const lockTop = lerp(70, 620, center);

  // cards
  const cardsIn = sp(frame, 1.5, {damping: 14, stiffness: 140, mass: 0.9}, FPS) * (1 - prog(t, outroAt + 0.05, outroAt + 0.6, easeIn));
  const beforeIn = sp(frame, 1.65, {damping: 13, stiffness: 150, mass: 0.85}, FPS) * (1 - prog(t, outroAt, outroAt + 0.5, easeIn));
  const chipA = sp(frame, 1.95, {damping: 10, stiffness: 210, mass: 0.7}, FPS);
  const chipB = sp(frame, 2.1, {damping: 10, stiffness: 210, mass: 0.7}, FPS);
  const foot = prog(t, 2.0, 2.6, easeOut) * (1 - prog(t, outroAt, outroAt + 0.4, easeIn));

  // slider reveal on the after card at the start of playback: before → after
  const slide = prog(ta, 0.0, 1.1, easeInOut);
  const src = srcAt(clamp01(ta / SHOW.after) * SHOW.after);
  const bf = Math.max(0, Math.min(Math.round(src * FPS), Math.floor((T.voiceEnd - 0.1) * FPS)));
  const progress = clamp01(ta / SHOW.after);

  const rawVideo = (
    <Freeze frame={bf}>
      <OffthreadVideo src={staticFile('talk/raw.mp4')} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </Freeze>
  );

  return (
    <AbsoluteFill style={{background: B.cream, direction: 'rtl'}}>
      {/* dot texture */}
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(22,21,20,0.10) 1.6px, transparent 1.8px)', backgroundSize: '34px 34px', backgroundPosition: `${(t * 4) % 34}px 0`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 50% at 70% 45%, rgba(255,90,32,0.07), transparent 70%)'}} />

      {/* AFTER card */}
      <div
        style={{
          position: 'absolute',
          left: AFTER.x,
          top: AFTER.y,
          transform: `translateY(${(1 - cardsIn) * 260}px) scale(${lerp(0.9, 1, cardsIn)})`,
          opacity: clamp01(cardsIn * 1.4),
        }}
      >
        <Card w={AFTER.w} h={AFTER.h} accent="rgba(255,90,32,0.35)">
          <AbsoluteFill>{rawVideo}</AbsoluteFill>
          <AbsoluteFill style={{clipPath: `inset(0 0 0 ${(1 - slide) * 100}%)`}}>
            <Sequence from={Math.round(SHOW.intro * FPS)} durationInFrames={Math.round(SHOW.after * FPS)} layout="none">
              <OffthreadVideo src={staticFile('talk/after.mp4')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </Sequence>
          </AbsoluteFill>
          {slide > 0 && slide < 1 ? (
            <div style={{position: 'absolute', top: 0, bottom: 0, left: `${(1 - slide) * 100}%`, width: 6, marginLeft: -3, background: B.orange, boxShadow: '0 0 20px rgba(255,90,32,0.8)'}}>
              <div style={{position: 'absolute', top: '50%', left: -34, width: 74, height: 74, marginTop: -37, borderRadius: 99, background: B.orange, border: `5px solid ${B.white}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: B.white, fontFamily: AF, fontWeight: 900, fontSize: 30}}>
                ‹›
              </div>
            </div>
          ) : null}
        </Card>
        {/* progress in the brand's dash language */}
        <div style={{display: 'flex', gap: 10, marginTop: 22, direction: 'ltr', opacity: foot}}>
          {[B.teal, B.orange, B.teal].map((c, i) => {
            const seg = clamp01(progress * 3 - i);
            return (
              <div key={i} style={{flex: 1, height: 14, borderRadius: 99, background: 'rgba(22,21,20,0.10)', overflow: 'hidden'}}>
                <div style={{width: `${seg * 100}%`, height: '100%', borderRadius: 99, background: c}} />
              </div>
            );
          })}
        </div>
      </div>
      <div style={{position: 'absolute', right: 1080 - AFTER.x - AFTER.w, top: AFTER.y - 86}}>
        <Chip label="بعد" en="AFTER" hot k={chipA * (1 - undock)} />
      </div>

      {/* BEFORE card */}
      <div
        style={{
          position: 'absolute',
          left: BEFORE.x,
          top: BEFORE.y,
          transform: `translateX(${(1 - beforeIn) * -420}px) rotate(${lerp(-12, -4, beforeIn)}deg)`,
          opacity: clamp01(beforeIn * 1.4),
          filter: 'saturate(0.9)',
        }}
      >
        <Card w={BEFORE.w} h={BEFORE.h}>
          <AbsoluteFill>{rawVideo}</AbsoluteFill>
        </Card>
      </div>
      <div style={{position: 'absolute', left: BEFORE.x + 6, top: BEFORE.y - 92}}>
        <Chip label="قبل" en="BEFORE" k={chipB * (1 - undock)} />
      </div>
      {/* teal arrow: before → after */}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 1 - undock}}>
        <path
          d="M 150 735 C 150 630, 230 560, 300 560"
          fill="none"
          stroke={B.teal}
          strokeWidth={7}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - prog(t, 2.0, 2.7, easeOut)}
        />
        <path d="M 278 538 L 304 560 L 276 582" fill="none" stroke={B.teal} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" opacity={prog(t, 2.6, 2.75)} />
      </svg>

      {/* footer */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1690, textAlign: 'center', opacity: foot, transform: `translateY(${(1 - foot) * 30}px)`}}>
        <div style={{fontFamily: AF, fontWeight: 900, fontSize: 56, color: B.ink, lineHeight: 1.2}}>
          نفس الفيديو.. <span style={{color: B.orange}}>بلمسة إبداع</span>
        </div>
        <div style={{display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16}}>
          {['مونتاج', 'موشن جرافيك', 'كابشن', 'تلوين', 'صوت'].map((w, i) => (
            <div
              key={w}
              style={{
                padding: '6px 18px',
                borderRadius: 999,
                border: `2.5px solid ${i % 2 ? B.orange : B.teal}`,
                fontFamily: AF,
                fontWeight: 600,
                fontSize: 25,
                color: B.ink,
                background: B.white,
                transform: `scale(${sp(frame, 2.2 + i * 0.08, {damping: 11, stiffness: 220, mass: 0.7}, FPS) * (1 - prog(t, outroAt, outroAt + 0.4, easeIn))})`,
              }}
            >
              {w}
            </div>
          ))}
        </div>
      </div>

      {/* lockup: centre in the intro, header during playback, centre again in the outro */}
      <div style={{position: 'absolute', left: 0, right: 0, top: lockTop, display: 'flex', justifyContent: 'center', transform: `translateX(${lerp(-330, 0, center)}px)`}}>
        <Lockup scale={lockScale} k={mk} dash={dash} word={word} />
      </div>
      {/* outro call */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1060, textAlign: 'center', opacity: prog(t, outroAt + 0.9, outroAt + 1.5, easeOut)}}>
        <div style={{fontFamily: AF, fontWeight: 900, fontSize: 66, color: B.ink}}>عايز فيديوهك يتحرك كده؟</div>
        <div
          style={{
            display: 'inline-block',
            marginTop: 34,
            padding: '16px 46px',
            borderRadius: 999,
            background: B.orange,
            color: B.white,
            fontFamily: AF,
            fontWeight: 800,
            fontSize: 48,
            transform: `scale(${sp(frame, outroAt + 1.3, {damping: 10, stiffness: 210, mass: 0.7}, FPS)})`,
            boxShadow: '0 14px 30px rgba(229,71,15,0.35)',
          }}
        >
          ابعتلنا على الصفحة
        </div>
      </div>
      <Grain frame={frame} opacity={0.04} />
      <Sequence from={0} durationInFrames={Math.round(SHOW.intro * FPS)}>
        <Audio src={staticFile('talk/show_sfx.wav')} volume={0.5} />
      </Sequence>
    </AbsoluteFill>
  );
};

/** Static cover for the post: a split frame, before on one side and after on the other. */
export const ShowCover: React.FC = () => {
  useFontsReady();
  return (
    <AbsoluteFill style={{background: B.cream, direction: 'rtl'}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(22,21,20,0.10) 1.6px, transparent 1.8px)', backgroundSize: '34px 34px'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 70, display: 'flex', justifyContent: 'center'}}>
        <Lockup scale={0.42} k={1} dash={[1, 1, 1]} word={1} />
      </div>
      <div style={{position: 'absolute', left: 70, top: 330}}>
        <Card w={940} h={1180} accent="rgba(255,90,32,0.35)">
          <AbsoluteFill>
            <Freeze frame={300}>
              <OffthreadVideo src={staticFile('talk/raw.mp4')} muted style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.75) brightness(0.92)'}} />
            </Freeze>
          </AbsoluteFill>
          <AbsoluteFill style={{clipPath: 'polygon(0 0, 70% 0, 58% 100%, 0 100%)'}}>
            <Freeze frame={45}>
              <OffthreadVideo src={staticFile('talk/after.mp4')} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </Freeze>
          </AbsoluteFill>
          <svg width={920} height={1160} style={{position: 'absolute', inset: 0}}>
            <line x1={644} y1={0} x2={534} y2={1160} stroke={B.orange} strokeWidth={8} />
            <circle cx={589} cy={580} r={44} fill={B.orange} stroke={B.white} strokeWidth={6} />
            <path d="M 577 562 L 561 580 L 577 598 M 601 562 L 617 580 L 601 598" fill="none" stroke={B.white} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{position: 'absolute', top: 26, left: 26}}>
            <Chip label="بعد" en="AFTER" hot k={1} />
          </div>
          <div style={{position: 'absolute', top: 26, right: 26}}>
            <Chip label="قبل" en="BEFORE" k={1} />
          </div>
        </Card>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1580, textAlign: 'center'}}>
        <div style={{fontFamily: AF, fontWeight: 900, fontSize: 70, color: B.ink, lineHeight: 1.2, whiteSpace: 'nowrap'}}>
          نفس الفيديو.. <span style={{color: B.orange}}>بلمسة إبداع</span>
        </div>
        <div style={{display: 'flex', justifyContent: 'center', gap: 12, marginTop: 26}}>
          {['مونتاج', 'موشن جرافيك', 'كابشن', 'تلوين', 'صوت'].map((w, i) => (
            <div key={w} style={{padding: '8px 22px', borderRadius: 999, border: `2.5px solid ${i % 2 ? B.orange : B.teal}`, fontFamily: AF, fontWeight: 600, fontSize: 30, color: B.ink, background: B.white}}>
              {w}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
