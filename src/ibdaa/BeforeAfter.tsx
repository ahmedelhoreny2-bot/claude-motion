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
  // intro: the logo draws in the middle, then settles small in the top-left corner
  const markK = prog(t, 0, 0.9, easeOut);
  const dock = prog(t, 0.6, 1.2, easeInOut);
  const out = prog(t, end, end + 0.6, easeInOut);
  const cards = sp(frame, 1.0, soft) * (1 - out);
  const before = sp(frame, 1.15, soft) * (1 - out);
  const finale = sp(frame, end + 0.3, soft);
  // logo box: centre (intro) -> top-left (during) -> centre (finale)
  const lx = lerp(540, 200, dock) * (1 - out) + 540 * out;
  const ly = lerp(860, 120, dock) * (1 - out) + 820 * out;
  const ls = lerp(1, 0.42, dock) * (1 - out) + 1 * out;
  return (
    <AbsoluteFill style={{background: I.paper, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 70% at 50% 45%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 60%, rgba(0,0,0,0.05) 100%)'}} />

      {/* logo */}
      <div style={{position: 'absolute', left: lx - 260, top: ly - 170, width: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, transform: `scale(${ls})`, transformOrigin: '50% 50%'}}>
        <Mark size={420} k={markK} />
        <Img src={staticFile('ibdaa/word.png')} style={{width: 460, opacity: prog(t, 0.3, 0.8, easeOut)}} />
      </div>

      {/* BEFORE: small, set back */}
      <div style={{position: 'absolute', left: 60, top: 720, opacity: clamp01(before * 1.5), transform: `translateY(${(1 - before) * 60}px)`}}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 12, direction: 'ltr'}}>
          <div style={{fontFamily: F, fontWeight: 800, fontSize: 30, letterSpacing: '0.18em', color: I.inkDim}}>BEFORE</div>
          <div style={{fontFamily: F, fontWeight: 800, fontSize: 30, color: I.inkDim}}>قبل</div>
        </div>
        <div style={{marginTop: 14, width: 320, height: 569, borderRadius: 30, overflow: 'hidden', background: '#000', boxShadow: '0 20px 50px rgba(0,0,0,0.18)', filter: 'brightness(0.94)'}}>
          {PIECES.map((p, i) => (
            <Sequence key={i} from={Math.round((INTRO + p.at) * FPS)} durationInFrames={Math.round((p.out - p.in) * FPS)} layout="none">
              <OffthreadVideo src={staticFile('sedra/raw/talk.mp4')} startFrom={Math.round(p.in * FPS)} muted style={{width: '100%', height: '100%', objectFit: 'contain'}} />
            </Sequence>
          ))}
          {t < INTRO || t >= INTRO + EDL.duration ? <Img src={staticFile('ibdaa/before_still.jpg')} style={{width: '100%', height: '100%', objectFit: 'contain'}} /> : null}
        </div>
      </div>

      {/* AFTER: large, in front */}
      <div style={{position: 'absolute', right: 60, top: 430, opacity: clamp01(cards * 1.5), transform: `translateY(${(1 - cards) * 80}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, direction: 'ltr', justifyContent: 'flex-end'}}>
          <div style={{width: 14, height: 14, borderRadius: 7, background: I.orange}} />
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 52, letterSpacing: '0.14em', color: I.ink}}>AFTER</div>
          <div style={{fontFamily: F, fontWeight: 800, fontSize: 40, color: I.ink}}>بعد</div>
        </div>
        <div style={{marginTop: 16, width: 590, height: 1049, borderRadius: 40, overflow: 'hidden', background: '#000', boxShadow: '0 40px 90px rgba(0,0,0,0.28), 0 10px 24px rgba(0,0,0,0.14)'}}>
          <Sequence from={Math.round(INTRO * FPS)} durationInFrames={Math.round(SEG * FPS)} layout="none">
            <OffthreadVideo src={staticFile('sedra/raw/after.mp4')} muted style={{width: '100%', height: '100%'}} />
          </Sequence>
          {t < INTRO ? <Img src={staticFile('ibdaa/after_still.jpg')} style={{width: '100%', height: '100%'}} /> : null}
        </div>
      </div>

      {/* footer: small, under the phones */}
      <div style={{position: 'absolute', left: 60, right: 60, top: 1610, textAlign: 'center', direction: 'rtl', fontFamily: F, opacity: clamp01(cards * 1.5) * prog(t, 1.6, 2.2, easeOut)}}>
        <div style={{fontWeight: 900, fontSize: 44, color: I.ink}}>
          نفس الفيديو… <span style={{color: I.orange}}>بلمسة إبداع</span>
        </div>
        <div style={{marginTop: 8, fontWeight: 700, fontSize: 26, color: I.inkDim, letterSpacing: '0.02em'}}>مونتاج · موشن جرافيك · كابشن · تلوين · صوت</div>
        <div style={{marginTop: 22, display: 'flex', justifyContent: 'center', gap: 10}}>
          {[I.teal, I.orange, I.teal].map((c, i) => (
            <div key={i} style={{width: i === 1 ? 46 : 28, height: 8, borderRadius: 4, background: c}} />
          ))}
        </div>
      </div>

      {/* finale line */}
      <div style={{position: 'absolute', left: 60, right: 60, top: 1130, textAlign: 'center', direction: 'rtl', fontFamily: F, fontWeight: 900, fontSize: 64, color: I.ink, opacity: clamp01(finale * 1.5), transform: `translateY(${(1 - finale) * 24}px)`}}>
        فيديوهاتك تستاهل <span style={{color: I.orange}}>تتحرك</span>
      </div>
    </AbsoluteFill>
  );
};

void easeIn;
