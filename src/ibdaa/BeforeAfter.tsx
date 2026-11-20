import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog, sp as sp60} from '../lib';
import {useSedraFonts} from '../sedra/kit';
import EDL from '../talk/edl.json';

/** Ibdaa Bitharrak brand: cream paper with a dot grid, orange and teal. */
const I = {
  paper: '#F2EFE8',
  dot: 'rgba(22,22,22,0.10)',
  orange: '#FF5A20',
  teal: '#13C2B5',
  ink: '#161616',
  inkDim: 'rgba(22,22,22,0.6)',
};
const F = '"Cairo", system-ui, sans-serif';

export const FPS = 30;
const INTRO = 1.4;
const SEG = EDL.duration + 4.5; // the whole edit, end card included
const OUTRO = 4.2;
export const BA_DURATION = Math.round((INTRO + SEG + OUTRO) * FPS);
const sp = (frame: number, t0: number, cfg = {}) => sp60(frame, t0, cfg, FPS);
const soft = {damping: 18, stiffness: 110};

type Piece = {in: number; out: number; at: number};
const PIECES = EDL.pieces as Piece[];

const Mark: React.FC<{size: number; k: number}> = ({size, k}) => {
  const bar = (i: number) => clamp01(k * 2.2 - 0.6 - i * 0.18);
  return (
    <svg width={size} height={size * 0.58} viewBox="0 0 500 290" style={{overflow: 'visible'}}>
      <g transform={`translate(${130} 145) scale(${clamp01(k * 1.6)}) translate(-130 -145)`}>
        <path d="M 252 6 C 262 0 270 6 270 18 V 272 C 270 284 262 290 252 284 L 14 154 C 2 148 2 142 14 136 Z" fill={I.orange} />
      </g>
      {[
        [340, 60, 132, I.teal],
        [340, 130, 155, I.orange],
        [340, 200, 132, I.teal],
      ].map(([x, y, w, c], i) => (
        <rect key={i} x={(x as number) + (1 - bar(i)) * 120} y={y as number} width={w as number} height={40} rx={20} fill={c as string} opacity={bar(i)} />
      ))}
    </svg>
  );
};

const Dots: React.FC<{t: number}> = ({t}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
    <defs>
      <pattern id="ibdots" width="34" height="34" patternUnits="userSpaceOnUse" patternTransform={`translate(${-t * 3} ${-t * 5})`}>
        <circle cx="17" cy="17" r="2" fill={I.dot} />
      </pattern>
    </defs>
    <rect width={1080} height={1920} fill="url(#ibdots)" />
  </svg>
);

const Label: React.FC<{k: number; ar: string; en: string; color: string}> = ({k, ar, en, color}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 14, opacity: clamp01(k * 1.6), transform: `translateY(${(1 - k) * 24}px)`}}>
    <div style={{background: color, color: '#fff', fontFamily: F, fontWeight: 900, fontSize: 46, padding: '4px 30px 12px', borderRadius: 999}}>{ar}</div>
    <div style={{fontFamily: F, fontWeight: 900, fontSize: 34, letterSpacing: '0.12em', color}}>{en}</div>
  </div>
);

export const BeforeAfter: React.FC = () => {
  useSedraFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const end = INTRO + SEG;
  // intro: the mark draws big in the middle, then settles at the top
  const markK = prog(t, 0, 0.9, easeOut);
  const dock = prog(t, 0.55, 1.15, easeInOut);
  const out = prog(t, end, end + 0.6, easeInOut);
  const cards = sp(frame, 0.95, soft) * (1 - out);
  const before = sp(frame, 1.1, soft) * (1 - out);
  const finale = sp(frame, end + 0.35, soft);
  const markSize = lerp(560, 200, dock) * (1 - out) + 420 * out;
  const markY = lerp(780, 52, dock) * (1 - out) + 560 * out;
  return (
    <AbsoluteFill style={{background: I.paper, overflow: 'hidden'}}>
      <Dots t={t} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 55% 30% at 75% 42%, rgba(255,90,32,${0.14 * cards}) 0%, rgba(255,90,32,0) 70%), radial-gradient(ellipse 50% 28% at 22% 58%, rgba(19,194,181,${0.12 * cards}) 0%, rgba(19,194,181,0) 70%)`}} />

      {/* logo */}
      <div style={{position: 'absolute', left: 540 - markSize / 2, top: markY, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
        <Mark size={markSize} k={markK} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: lerp(1120, 180, dock) * (1 - out) + 840 * out, display: 'flex', justifyContent: 'center', opacity: prog(t, 0.3, 0.8, easeOut)}}>
        <Img src={staticFile('ibdaa/word.png')} style={{width: lerp(520, 260, dock) * (1 - out) + 560 * out}} />
      </div>

      {/* the two phones: BEFORE small and set back, AFTER large in front */}
      <AbsoluteFill style={{opacity: clamp01(cards * 1.4)}}>
        <div style={{position: 'absolute', left: 50, top: 420, transform: `translateY(${(1 - before) * 80}px)`}}>
          <Label k={before} ar="قبل" en="BEFORE" color={I.teal} />
          <div style={{marginTop: 14, width: 340, height: 604, borderRadius: 28, overflow: 'hidden', border: `5px solid ${I.teal}`, boxShadow: '0 18px 40px rgba(0,0,0,0.16)', background: '#000', filter: 'saturate(0.9) brightness(0.92)'}}>
            {PIECES.map((p, i) => (
              <Sequence key={i} from={Math.round((INTRO + p.at) * FPS)} durationInFrames={Math.round((p.out - p.in) * FPS)} layout="none">
                <OffthreadVideo src={staticFile('sedra/raw/talk.mp4')} startFrom={Math.round(p.in * FPS)} muted style={{width: '100%', height: '100%', objectFit: 'contain'}} />
              </Sequence>
            ))}
            {t < INTRO || t >= INTRO + EDL.duration ? <Img src={staticFile('ibdaa/before_still.jpg')} style={{width: '100%', height: '100%', objectFit: 'contain'}} /> : null}
          </div>
        </div>
        <div style={{position: 'absolute', right: 50, top: 300, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', transform: `translateY(${(1 - cards) * 120}px)`}}>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 16, opacity: clamp01(cards * 1.6)}}>
            <div style={{fontFamily: F, fontWeight: 900, fontSize: 40, color: I.ink}}>بعد المونتاج</div>
            <div style={{fontFamily: F, fontWeight: 900, fontSize: 92, letterSpacing: '0.04em', color: I.orange, lineHeight: 1}}>AFTER</div>
          </div>
          <div style={{marginTop: 16, width: 590, height: 1049, borderRadius: 42, overflow: 'hidden', border: `7px solid ${I.orange}`, boxShadow: '0 0 0 12px rgba(255,90,32,0.12), 0 40px 90px rgba(255,90,32,0.3), 0 16px 40px rgba(0,0,0,0.22)', background: '#000'}}>
            <Sequence from={Math.round(INTRO * FPS)} durationInFrames={Math.round(SEG * FPS)} layout="none">
              <OffthreadVideo src={staticFile('sedra/raw/after.mp4')} muted style={{width: '100%', height: '100%'}} />
            </Sequence>
            {t < INTRO ? <Img src={staticFile('ibdaa/after_still.jpg')} style={{width: '100%', height: '100%'}} /> : null}
          </div>
        </div>
      </AbsoluteFill>

      {/* note under BEFORE, in the free left column */}
      <div style={{position: 'absolute', left: 50, width: 340, top: 1130, textAlign: 'center', direction: 'rtl', opacity: clamp01(cards * 1.4) * prog(t, 1.5, 2.1, easeOut), fontFamily: F}}>
        <div style={{fontWeight: 900, fontSize: 46, color: I.ink, lineHeight: 1.35}}>
          نفس الفيديو…
          <br />
          <span style={{color: I.orange}}>بلمسة إبداع</span>
        </div>
        <div style={{marginTop: 18, fontWeight: 700, fontSize: 28, color: I.inkDim, lineHeight: 1.5}}>
          مونتاج · موشن جرافيك
          <br />
          كابشن · تلوين · صوت
        </div>
        <div style={{marginTop: 26, display: 'inline-block', background: I.teal, color: '#fff', fontWeight: 900, fontSize: 28, padding: '6px 22px 10px', borderRadius: 999}}>مركز سدرة للحجامة</div>
      </div>

      {/* finale */}
      <div style={{position: 'absolute', left: 60, right: 60, top: 1080, textAlign: 'center', direction: 'rtl', fontFamily: F, opacity: clamp01(finale * 1.5), transform: `translateY(${(1 - finale) * 30}px)`}}>
        <div style={{fontWeight: 900, fontSize: 70, color: I.ink, lineHeight: 1.35}}>
          فيديوهاتك تستاهل <span style={{color: I.orange}}>تتحرك</span>
        </div>
        <div style={{marginTop: 34, display: 'inline-block', background: I.orange, color: '#fff', fontWeight: 900, fontSize: 46, padding: '10px 44px 18px', borderRadius: 999}}>ابعتلنا رسالة دلوقتي</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 70, display: 'flex', justifyContent: 'center', gap: 16, opacity: 1 - out}}>
        {[I.teal, I.orange, I.teal].map((c, i) => (
          <div key={i} style={{width: i === 1 ? 70 : 44, height: 12, borderRadius: 6, background: c, opacity: 0.85}} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

void easeIn;
