import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import type {SpringConfig} from 'remotion';
import {Grain} from '../components/primitives';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog, sp as sp60} from '../lib';
import {Logo, S, SF, useSedraFonts} from '../sedra/kit';
import EDL from './edl.json';

export const FPS = 30;
export const W = 1080;
export const H = 1920;
const CTA_LEN = 4.5;
export const TALK_DURATION = Math.round((EDL.duration + CTA_LEN) * FPS);

type Word = {w: string; s: number; e: number; src: number};
type Piece = {in: number; out: number; at: number};
const WD = EDL.words as Word[];
const PIECES = EDL.pieces as Piece[];
const bySrc = new Map(WD.map((w, i) => [w.src, i]));
/** Output start of source word i (first occurrence in the cut). */
const at = (src: number) => WD[bySrc.get(src)!].s;
const endOf = (src: number) => WD[bySrc.get(src)!].e;
const sp = (frame: number, t0: number, cfg: Partial<SpringConfig> = {}) => sp60(frame, t0, cfg, FPS);
const clean = (w: string) => w.replace(/[،.…:؟!]/g, '').replace(/ـ$/, '');

const FACE = {x: 47, y: 31}; // face centre in % of the frame

// ------------------------------------------------------------------ speaker
const SHOT_SCALES = [1.0, 1.42, 1.18, 1.75, 1.3];
const PUNCH_WORDS = [133, 93, 114, 130, 147, 151, 343, 365, 378];

const Speaker: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const k = PIECES.findIndex((p, i) => t >= p.at && (i + 1 === PIECES.length || t < PIECES[i + 1].at));
  const idx = Math.max(0, k);
  const p = PIECES[idx];
  const base = idx === 0 ? 1.85 : SHOT_SCALES[idx % SHOT_SCALES.length];
  const local = t - p.at;
  const push = 1 + 0.05 * clamp01(local / Math.max(1, p.out - p.in));
  const enter = 1 + 0.06 * Math.exp(-local * 9);
  const punch = PUNCH_WORDS.reduce((acc, src) => {
    if (!bySrc.has(src)) return acc;
    const d = t - at(src);
    return d >= 0 && d < 0.7 ? acc + 0.12 * Math.exp(-d * 5) * Math.min(1, d * 20) : acc;
  }, 0);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      {PIECES.map((pc, i) => {
        if (Math.abs(i - idx) > 1) return null;
        return (
          <Sequence key={i} from={Math.round(pc.at * FPS)} durationInFrames={Math.round((pc.out - pc.in) * FPS)} layout="none">
            <AbsoluteFill style={{transformOrigin: `${FACE.x}% ${FACE.y}%`, transform: `scale(${base * push * enter + punch})`}}>
              <OffthreadVideo src={staticFile('sedra/raw/talk_hd_k.mp4')} startFrom={Math.round(pc.in * FPS)} muted style={{width: '100%', height: '100%'}} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(7,23,53,0.35) 0%, rgba(7,23,53,0) 18%, rgba(7,23,53,0) 55%, rgba(7,23,53,0.75) 100%)'}} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ overlay pieces
const Pattern: React.FC<{t: number; opacity?: number}> = ({t, opacity = 0.14}) => {
  const star = (cx: number, cy: number, r: number) => {
    const sq = (rot: number) =>
      [0, 1, 2, 3].map((k) => {
        const a = rot + (k * Math.PI) / 2 + Math.PI / 4;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      }).join(' ');
    return (
      <g key={`${cx}-${cy}`}>
        <polygon points={sq(0)} fill="none" stroke={S.orange} strokeWidth={2} />
        <polygon points={sq(Math.PI / 4)} fill="none" stroke={S.orange} strokeWidth={2} />
      </g>
    );
  };
  const cells = [];
  for (let y = -1; y < 9; y++) for (let x = -1; x < 6; x++) cells.push(star(x * 240 + (y % 2) * 120, y * 240, 96));
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity}}>
      <g transform={`translate(${-t * 6} ${-t * 10})`}>{cells}</g>
    </svg>
  );
};

const Navy: React.FC<{t: number; pattern?: number; glow?: string}> = ({t, pattern = 0.12, glow = 'rgba(242,140,40,0.18)'}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 55% at 50% 40%, ${S.navy2} 0%, ${S.navy} 75%)`}}>
    <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 35% at 50% 42%, ${glow} 0%, rgba(0,0,0,0) 70%)`}} />
    <Pattern t={t} opacity={pattern} />
  </AbsoluteFill>
);

const Photo: React.FC<{src: string; t: number; from: number; dur: number; focusY?: number; z0?: number; z1?: number}> = ({src, t, from, dur, focusY = 50, z0 = 1.2, z1 = 1.04}) => (
  <AbsoluteFill style={{overflow: 'hidden'}}>
    <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: `50% ${focusY}%`, transform: `scale(${lerp(z0, z1, easeOut(clamp01((t - from) / dur)))})`}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(7,23,53,0.45) 0%, rgba(7,23,53,0) 25%, rgba(7,23,53,0) 50%, rgba(7,23,53,0.88) 85%)'}} />
  </AbsoluteFill>
);

const Card: React.FC<{src: string; t: number; from: number; dur: number; w?: number; h?: number; top?: number; circle?: boolean}> = ({src, t, from, dur, w = 900, h = 760, top = 300, circle}) => {
  const pop = prog(t, from, from + 0.35, easeOut);
  const k = clamp01((t - from) / dur);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(34px) brightness(0.42)', transform: 'scale(1.25)'}} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: (W - w) / 2, top, width: w, height: circle ? w : h, overflow: 'hidden', borderRadius: circle ? '50%' : 40, border: `6px solid ${circle ? S.orange : 'rgba(246,242,233,0.9)'}`, boxShadow: '0 40px 90px rgba(0,0,0,0.55)', opacity: clamp01(pop * 2), transform: `scale(${0.85 + 0.15 * pop}) rotate(${(1 - pop) * -3}deg)`}}>
        <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${lerp(1.22, 1.02, easeOut(k)) * (circle ? 1.12 : 1)})`}} />
      </div>
    </AbsoluteFill>
  );
};

const Big: React.FC<{k: number; children: React.ReactNode; size?: number; color?: string; font?: string; top?: number}> = ({k, children, size = 130, color = S.cream, font = SF.ar, top = 900}) => (
  <div style={{position: 'absolute', left: 60, right: 60, top, textAlign: 'center', direction: 'rtl', fontFamily: font, fontWeight: 900, fontSize: size, lineHeight: 1.25, color, textShadow: '0 8px 40px rgba(0,0,0,0.8)', opacity: clamp01(k * 2), transform: `scale(${0.7 + 0.3 * k})`}}>
    {children}
  </div>
);

const Chip: React.FC<{k: number; children: React.ReactNode; bg?: string; color?: string; size?: number}> = ({k, children, bg = S.orange, color = S.navy, size = 40}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, direction: 'rtl', padding: '10px 32px 16px', borderRadius: 999, background: bg, color, fontFamily: SF.ar, fontWeight: 900, fontSize: size, opacity: clamp01(k * 2), transform: `scale(${0.6 + 0.4 * k})`, boxShadow: '0 16px 40px rgba(0,0,0,0.35)'}}>
    {children}
  </div>
);

const LowerThird: React.FC<{k: number; title: string; sub?: string}> = ({k, title, sub}) => (
  <div style={{position: 'absolute', right: 60, top: 300, direction: 'rtl', opacity: clamp01(k * 2), transform: `translateX(${(1 - k) * 200}px)`}}>
    {sub ? <div style={{display: 'inline-block', background: S.orange, color: S.navy, fontFamily: SF.ar, fontWeight: 900, fontSize: 34, padding: '4px 22px 10px', borderRadius: 12}}>{sub}</div> : null}
    <div style={{marginTop: 10, background: 'rgba(7,23,53,0.88)', border: `2px solid ${S.orange}`, color: S.cream, fontFamily: SF.ar, fontWeight: 900, fontSize: 52, padding: '10px 30px 18px', borderRadius: 18}}>{title}</div>
  </div>
);

/** Spoken words revealed in sync (word appears when said). */
const Synced: React.FC<{t: number; from: number; to: number; size: number; font?: string; weight?: number; accent?: number[]; color?: string}> = ({t, from, to, size, font = SF.ar, weight = 900, accent = [], color = S.cream}) => {
  const a = bySrc.get(from)!;
  const b = bySrc.get(to)!;
  return (
    <div style={{direction: 'rtl', textAlign: 'center', fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.45, color}}>
      {WD.slice(a, b + 1).map((w) => {
        const k = prog(t, w.s - 0.08, w.s + 0.2, easeOut);
        return (
          <span key={w.src} style={{display: 'inline-block', margin: '0 0.12em', opacity: 0.15 + 0.85 * k, transform: `translateY(${(1 - k) * 16}px)`, color: accent.includes(w.src) ? S.orange : undefined}}>
            {clean(w.w)}
          </span>
        );
      })}
    </div>
  );
};

const HoneyDrop: React.FC<{t: number; from: number}> = ({t, from}) => {
  const k = prog(t, from, from + 0.9, easeIn);
  return (
    <svg width={W} height={500} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <linearGradient id="honey" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFB42E" />
          <stop offset="100%" stopColor="#C46A00" />
        </linearGradient>
      </defs>
      <path d={`M0 0 H${W} V60 C${W * 0.8} 90 ${W * 0.62} 60 ${W * 0.55} 90 C${W * 0.52} ${120 + 220 * k} ${W * 0.48} ${120 + 220 * k} ${W * 0.45} 90 C${W * 0.35} 60 ${W * 0.2} 100 0 70 Z`} fill="url(#honey)" opacity={0.95} />
    </svg>
  );
};

const Silhouette: React.FC<{x: number; dots: [number, number][]; k: number; label: string}> = ({x, dots, k, label}) => (
  <div style={{position: 'absolute', left: x, top: 330, width: 440, opacity: clamp01(k * 2), transform: `translateY(${(1 - k) * 60}px)`}}>
    <svg width={440} height={640} viewBox="0 0 220 320">
      <path d="M110 20 C125 20 135 32 135 48 C135 62 127 72 118 76 L118 84 C150 90 182 100 192 130 L200 230 C200 250 190 300 180 310 L40 310 C30 300 20 250 20 230 L28 130 C38 100 70 90 102 84 L102 76 C93 72 85 62 85 48 C85 32 95 20 110 20 Z" fill="rgba(246,242,233,0.12)" stroke={S.cream} strokeWidth={3} />
      {dots.map(([dx, dy], i) => (
        <g key={i} opacity={clamp01(k * 3 - i * 0.25)}>
          <circle cx={dx} cy={dy} r={13} fill="rgba(242,140,40,0.25)" stroke={S.orange} strokeWidth={3} />
          <circle cx={dx} cy={dy} r={4} fill={S.orange} />
        </g>
      ))}
    </svg>
    <div style={{textAlign: 'center', fontFamily: SF.ar, fontWeight: 900, fontSize: 44, color: S.cream}}>{label}</div>
  </div>
);

// ------------------------------------------------------------------ overlays (keyed to spoken words)
type Ov = {from: number; to: number; tail?: number; full: boolean; hideCaptions?: boolean; render: (t: number, frame: number, a: number, b: number) => React.ReactNode};

const OVERLAYS: Ov[] = [
  // hook title
  {from: 129, to: 135, tail: 0, full: false, render: (t, frame, a) => <div style={{position: 'absolute', left: 0, right: 0, top: 260, display: 'flex', justifyContent: 'center'}}><Chip k={sp(frame, a + 0.2)}>قصة من السُّنّة</Chip></div>},
  {from: 7, to: 10, full: true, hideCaptions: true, render: (t, frame, a) => (
    <>
      <Navy t={t} />
      <Big k={sp(frame, a)} top={700} size={88} color={S.creamDim}>سر من أسرار</Big>
      <Big k={sp(frame, at(10) - 0.05, {damping: 9, stiffness: 220})} top={830} size={190} color={S.orange}>الشفاء</Big>
    </>
  )},
  {from: 16, to: 20, full: true, hideCaptions: true, render: (t, frame, a) => (
    <>
      <Navy t={t} pattern={0.2} />
      <Big k={sp(frame, a)} top={700} size={88} color={S.creamDim}>سر من أسرار</Big>
      <Big k={sp(frame, at(19) - 0.05, {damping: 9, stiffness: 220})} top={830} size={170} color={S.orange}>الطب النبوي</Big>
    </>
  )},
  {from: 28, to: 34, full: false, render: (t, frame, a) => <LowerThird k={sp(frame, a)} sub="الحديث" title="أبو سعيد الخدري رضي الله عنه" />},
  {from: 48, to: 60, full: true, render: (t, frame, a) => (
    <>
      <Navy t={t} glow="rgba(200,40,30,0.25)" />
      <div style={{position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
        {[[48, 'أخي يشتكي بطنه'], [53, 'قولونه تعبان'], [55, 'ومعدته'], [56, 'والدنيا مش حلوة معاه']].map(([src, txt], i) => (
          <Chip key={i} k={sp(frame, at(src as number) - 0.05)} bg={i === 0 ? S.orange : 'rgba(246,242,233,0.12)'} color={i === 0 ? S.navy : S.cream} size={i === 0 ? 62 : 52}>{txt as string}</Chip>
        ))}
      </div>
    </>
  )},
  {from: 66, to: 67, tail: 0.6, full: true, hideCaptions: true, render: (t, frame, a, b) => (
    <>
      <Photo src="sedra/honey.jpg" t={t} from={a} dur={b - a + 1} focusY={40} />
      <HoneyDrop t={t} from={a} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', justifyContent: 'center'}}><Chip k={sp(frame, a)} bg={S.cream} size={38}>المرة الأولى</Chip></div>
      <Big k={sp(frame, a + 0.1, {damping: 9, stiffness: 220})} top={700} size={180} color={S.orange}>اسقه عسلاً</Big>
    </>
  )},
  {from: 72, to: 73, tail: 0.3, full: false, render: (t, frame, a) => <div style={{position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', justifyContent: 'center'}}><Chip k={sp(frame, a)} bg={S.cream}>📅 تاني يوم</Chip></div>},
  {from: 80, to: 81, tail: 0.5, full: true, hideCaptions: true, render: (t, frame, a, b) => (
    <>
      <Card src="sedra/bee.jpg" t={t} from={a} dur={b - a + 1} circle w={640} top={260} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 940, display: 'flex', justifyContent: 'center'}}><Chip k={sp(frame, a)} bg={S.cream} size={38}>المرة التانية</Chip></div>
      <Big k={sp(frame, a + 0.1, {damping: 9, stiffness: 220})} top={1030} size={170} color={S.orange}>اسقه عسلاً</Big>
    </>
  )},
  {from: 100, to: 101, tail: 0.5, full: true, hideCaptions: true, render: (t, frame, a, b) => (
    <>
      <Photo src="sedra/honey.jpg" t={t} from={a} dur={b - a + 1} focusY={75} z0={1.5} z1={1.25} />
      <HoneyDrop t={t} from={a - 0.2} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', justifyContent: 'center'}}><Chip k={sp(frame, a)} bg={S.cream} size={38}>المرة التالتة</Chip></div>
      <Big k={sp(frame, a + 0.1, {damping: 9, stiffness: 220})} top={700} size={180} color={S.orange}>اسقه عسلاً</Big>
    </>
  )},
  {from: 121, to: 128, full: true, hideCaptions: true, render: (t, frame, a) => (
    <>
      <Navy t={t} pattern={0.18} />
      <div style={{position: 'absolute', left: 70, right: 70, top: 640}}>
        <Synced t={t} from={115} to={128} size={84} accent={[124, 125, 126, 127, 128]} />
      </div>
    </>
  )},
  {from: 140, to: 147, full: false, render: (t, frame) => (
    <div style={{position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', justifyContent: 'center', gap: 24, direction: 'rtl'}}>
      <Chip k={sp(frame, at(143))} size={58}>إيمانه</Chip>
      <Chip k={sp(frame, at(146))} size={58}>يقينه</Chip>
    </div>
  )},
  {from: 157, to: 169, tail: 0.5, full: true, hideCaptions: true, render: (t, frame, a) => (
    <>
      <Navy t={t} pattern={0.2} />
      <Card src="sedra/bee.jpg" t={t} from={a - 0.2} dur={8} circle w={330} top={230} />
      <div style={{position: 'absolute', left: 60, right: 60, top: 640, padding: '46px 30px 50px', borderRadius: 40, background: 'rgba(7,23,53,0.8)', border: `3px solid ${S.orange}`}}>
        <div style={{textAlign: 'center', direction: 'rtl', fontFamily: SF.quote, fontWeight: 700, fontSize: 78, lineHeight: 1.7, color: S.cream}}>
          {[
            [157, 'فَاسْلُكِي سُبُلَ رَبِّكِ ذُلُلًا ۚ'],
            [161, 'يَخْرُجُ مِن بُطُونِهَا شَرَابٌ'],
            [164, 'مُّخْتَلِفٌ أَلْوَانُهُ'],
            [167, 'فِيهِ شِفَاءٌ لِّلنَّاسِ'],
          ].map(([src, line], i) => {
            const k = prog(t, at(src as number) - 0.1, at(src as number) + 0.35, easeOut);
            return (
              <div key={i} style={{opacity: 0.12 + 0.88 * k, color: i === 3 ? S.orange : undefined, transform: `translateY(${(1 - k) * 14}px)`}}>
                {line as string}
              </div>
            );
          })}
        </div>
        <div style={{textAlign: 'center', fontFamily: SF.ar, fontWeight: 700, fontSize: 30, color: S.muted, marginTop: 10}}>[النحل: ٦٩]</div>
      </div>
    </>
  )},
  {from: 170, to: 176, full: true, render: (t, frame, a, b) => <Card src="sedra/products.jpg" t={t} from={a} dur={b - a + 1} w={940} h={740} top={300} />},
  {from: 192, to: 195, tail: 0.4, full: false, render: (t, frame) => (
    <div style={{position: 'absolute', left: 0, right: 0, top: 320, display: 'flex', justifyContent: 'center'}}>
      <Chip k={sp(frame, at(195) - 0.05, {damping: 9, stiffness: 230})} bg="#25A55F" color="#fff" size={70}>✓ خف</Chip>
    </div>
  )},
  {from: 196, to: 199, tail: 0.6, full: true, hideCaptions: true, render: (t, frame, a) => (
    <>
      <Navy t={t} pattern={0.2} />
      <Big k={sp(frame, a, {damping: 10, stiffness: 180})} top={760} size={170} color={S.orange}>اليقين</Big>
      <Big k={sp(frame, at(197))} top={980} size={90}>بما عند الله</Big>
    </>
  )},
  {from: 206, to: 212, full: false, render: (t, frame, a) => <LowerThird k={sp(frame, a)} sub="الحديث" title="جابر بن عبد الله رضي الله عنه" />},
  {from: 221, to: 239, tail: 0.3, full: true, hideCaptions: true, render: (t, frame, a) => {
    const items: [number, string, string][] = [
      [229, 'شرطة محجم', 'sedra/cups.jpg'],
      [231, 'شربة عسل', 'sedra/honey.jpg'],
      [233, 'كية نار', 'sedra/firecups.jpg'],
    ];
    const strike = prog(t, at(236), at(236) + 0.5, easeOut);
    return (
      <>
        <Navy t={t} />
        <div style={{position: 'absolute', left: 70, right: 70, top: 250}}>
          <Synced t={t} from={221} to={227} size={70} />
        </div>
        <div style={{position: 'absolute', left: 60, right: 60, top: 520, display: 'flex', flexDirection: 'column', gap: 26}}>
          {items.map(([src, label, img], i) => {
            const k = sp(frame, at(src) - 0.05, {damping: 12, stiffness: 190});
            return (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 30, direction: 'rtl', background: 'rgba(246,242,233,0.08)', border: `2px solid ${S.line}`, borderRadius: 30, padding: 18, opacity: clamp01(k * 2), transform: `translateX(${(1 - k) * 160}px)`, position: 'relative'}}>
                <div style={{width: 180, height: 180, borderRadius: 24, overflow: 'hidden', flexShrink: 0}}>
                  <Img src={staticFile(img)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                </div>
                <div style={{fontFamily: SF.ar, fontWeight: 900, fontSize: 76, color: i === 2 && strike > 0 ? S.muted : S.cream}}>{label}</div>
                {i === 2 ? <div style={{position: 'absolute', right: 230, top: '50%', height: 8, width: 330 * strike, background: '#E5483B', borderRadius: 4}} /> : null}
              </div>
            );
          })}
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1240, display: 'flex', justifyContent: 'center'}}>
          <Chip k={sp(frame, at(235))} bg="#E5483B" color="#fff" size={46}>وأنا أنهى أمتي عن الكي</Chip>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1350, textAlign: 'center', fontFamily: SF.ar, fontWeight: 700, fontSize: 30, color: S.muted}}>متفق عليه</div>
      </>
    );
  }},
  {from: 258, to: 260, tail: 0.3, full: false, render: (t, frame) => <div style={{position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', justifyContent: 'center'}}><Chip k={sp(frame, at(259))} size={60}>العلاج الصح</Chip></div>},
  {from: 267, to: 281, full: true, render: (t, frame, a, b) => {
    const n = Math.round(lerp(0, 20, prog(t, at(268) - 0.1, at(269), easeOut)) + lerp(0, 10, prog(t, at(271) - 0.1, at(272), easeOut)));
    const target = sp(frame, at(275), {damping: 10, stiffness: 200});
    return (
      <>
        <Photo src="sedra/backcups.jpg" t={t} from={a} dur={b - a + 1} focusY={70} z0={1.6} z1={1.3} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center', fontFamily: SF.ar, fontWeight: 900, fontSize: 220, color: S.cream, textShadow: '0 10px 50px rgba(0,0,0,0.8)', opacity: t < at(273) ? 1 : 1 - prog(t, at(273), at(273) + 0.3, easeIn)}}>
          {n} <span style={{fontSize: 90}}>كاس</span>
        </div>
        <div style={{position: 'absolute', left: W / 2 - 160, top: 560, width: 320, height: 320, borderRadius: '50%', border: `10px solid ${S.orange}`, opacity: clamp01(target * 2), transform: `scale(${2 - target})`, boxShadow: `0 0 60px ${S.orange}`}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 930, display: 'flex', justifyContent: 'center'}}><Chip k={target} size={56}>الكاس المهم</Chip></div>
      </>
    );
  }},
  {from: 294, to: 308, full: true, hideCaptions: true, render: (t, frame, a) => (
    <>
      <Navy t={t} pattern={0.2} />
      <div style={{position: 'absolute', left: 70, right: 70, top: 520}}>
        <Synced t={t} from={294} to={303} size={74} />
      </div>
      <Big k={sp(frame, at(304), {damping: 10, stiffness: 190})} top={900} size={140} color={S.orange}>الجأ لله</Big>
      <Big k={sp(frame, at(308))} top={1080} size={96}>الأول</Big>
    </>
  )},
  {from: 309, to: 319, full: true, render: (t, frame, a, b) => <Photo src="sedra/training.jpg" t={t} from={a} dur={b - a + 1} focusY={35} />},
  {from: 324, to: 337, tail: 0.3, full: true, render: (t, frame) => (
    <>
      <Navy t={t} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 200, textAlign: 'center', fontFamily: SF.ar, fontWeight: 900, fontSize: 60, color: S.cream, opacity: sp(frame, at(324))}}>نفس الشكوى…</div>
      <Silhouette x={570} k={sp(frame, at(328))} label="الأول" dots={[[80, 130], [140, 130], [110, 170], [70, 220]]} />
      <Silhouette x={70} k={sp(frame, at(333))} label="التاني" dots={[[110, 110], [60, 160], [160, 200], [110, 250]]} />
    </>
  )},
  {from: 358, to: 365, tail: 0.5, full: true, render: (t, frame, a, b) => (
    <>
      <Photo src="sedra/sheikh.jpg" t={t} from={a} dur={b - a + 1} focusY={22} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 860, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
        {[[360, 'توفيق'], [362, 'حكمة'], [364, 'خبرة ودراية']].map(([src, txt], i) => (
          <Chip key={i} k={sp(frame, at(src as number) - 0.05, {damping: 10, stiffness: 220})} size={64}>{txt as string}</Chip>
        ))}
      </div>
    </>
  )},
  {from: 374, to: 378, tail: 0.5, full: true, hideCaptions: true, render: (t, frame) => (
    <>
      <Navy t={t} pattern={0.22} glow="rgba(242,140,40,0.3)" />
      <div style={{position: 'absolute', left: 60, right: 60, top: 660}}>
        <Synced t={t} from={374} to={378} size={130} font={SF.quote} weight={700} accent={[376, 377, 378]} />
      </div>
    </>
  )},
];

const HOOK_FULL: Ov = {from: 129, to: 135, full: false, render: () => null};

// payoff in the middle of the story: the same words as the hook, now a full card
const PAYOFF = 129; // first occurrence is the hook; the story copy is found by position
const payoffWords = WD.map((w, i) => ({...w, i})).filter((w) => w.src >= 129 && w.src <= 135);
const payoffStart = payoffWords.length > 7 ? payoffWords[7].s : -1;

// ------------------------------------------------------------------ captions
type Group = {a: number; b: number};
const GROUPS: Group[] = (() => {
  const out: Group[] = [];
  let cur: number[] = [];
  WD.forEach((w, i) => {
    cur.push(i);
    const letters = cur.reduce((n, j) => n + clean(WD[j].w).length, 0);
    const brk = /[،.…:؟!]$/.test(w.w) || cur.length >= 3 || letters >= 15 || (i + 1 < WD.length && WD[i + 1].s - w.e > 0.25);
    if (brk) {
      out.push({a: cur[0], b: cur[cur.length - 1]});
      cur = [];
    }
  });
  return out;
})();

const Captions: React.FC<{t: number; hidden: boolean; top: number}> = ({t, hidden, top}) => {
  if (hidden) return null;
  const gi = GROUPS.findIndex((g, i) => {
    const next = GROUPS[i + 1];
    const end = next ? Math.min(WD[next.a].s - 0.02, WD[g.b].e + 0.5) : WD[g.b].e + 0.5;
    return t >= WD[g.a].s - 0.06 && t < end;
  });
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const k = prog(t, WD[g.a].s - 0.06, WD[g.a].s + 0.1, easeOut);
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top, display: 'flex', justifyContent: 'center'}}>
      <div style={{direction: 'rtl', textAlign: 'center', transform: `scale(${0.85 + 0.15 * k}) translateY(${(1 - k) * 18}px)`, opacity: k}}>
        {WD.slice(g.a, g.b + 1).map((w, j) => {
          const on = t >= w.s - 0.03;
          const active = on && t < w.e + 0.05;
          return (
            <span key={j} style={{display: 'inline-block', margin: '0 0.14em', fontFamily: SF.ar, fontWeight: 900, fontSize: 88, lineHeight: 1.3, color: active ? S.orange : S.cream, opacity: on ? 1 : 0.5, transform: `scale(${active ? 1.08 : 1})`, textShadow: '0 4px 0 rgba(7,23,53,0.9), 0 8px 30px rgba(0,0,0,0.75)', WebkitTextStroke: '2px rgba(7,23,53,0.6)'}}>
              {clean(w.w)}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ CTA
const Cta: React.FC<{t: number; frame: number; from: number}> = ({t, frame, from}) => {
  const logo = sp(frame, from, {damping: 11, stiffness: 170});
  const phone = sp(frame, from + 0.5, {damping: 10, stiffness: 200});
  return (
    <>
      <Navy t={t} pattern={0.12} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{transform: `scale(${0.5 + 0.5 * logo})`, opacity: clamp01(logo * 2)}}>
          <Logo size={380} />
        </div>
        <div style={{marginTop: 40, fontFamily: SF.ar, fontWeight: 900, fontSize: 84, color: S.cream, opacity: logo}}>مركز سدرة للحجامة</div>
        <div style={{marginTop: 40, display: 'flex', alignItems: 'center', gap: 20, background: S.orange, borderRadius: 32, padding: '12px 44px 18px', transform: `scale(${0.6 + 0.4 * phone})`, opacity: clamp01(phone * 2), fontFamily: SF.ar, fontWeight: 900, fontSize: 100, color: S.navy, direction: 'ltr'}}>
          01148470010
        </div>
        <div style={{marginTop: 26, opacity: prog(t, from + 0.9, from + 1.3, easeOut), fontFamily: SF.ar, fontWeight: 700, fontSize: 40, color: S.creamDim, textAlign: 'center', direction: 'rtl', lineHeight: 1.5}}>
          زفتى · شارع الجيش · كوبري المصرف
          <br />
          بجوار سوبر ماركت بشرة خير
        </div>
      </div>
    </>
  );
};

// ------------------------------------------------------------------ composition
export const TalkEdit: React.FC = () => {
  useSedraFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  // overlays use the LAST occurrence of a word for the story payoff (src 129-135 appear twice)
  const live = OVERLAYS.map((o) => {
    const a = o.from === 129 ? WD[0].s : at(o.from);
    const b = (o.from === 129 ? WD[6].e : endOf(o.to)) + (o.tail ?? 0.15);
    return {o, a, b};
  }).filter(({a, b}) => t >= a - 0.25 && t < b + 0.35);
  const payoffOn = payoffStart >= 0 && t >= payoffStart - 0.15 && t < payoffWords[13].e + 0.5;
  const full = live.some(({o, a, b}) => o.full && t >= a && t < b) || payoffOn;
  const hideCaps = live.some(({o, a, b}) => o.hideCaptions && t >= a && t < b) || payoffOn || t > EDL.duration - 0.2;
  const ctaFrom = EDL.duration - 0.3;
  const shake = [payoffStart, WD[0].s + 0.02, at(195), at(304)].reduce((acc, t0) => {
    const d = t - t0;
    return t0 >= 0 && d >= 0 && d < 0.5 ? acc + Math.exp(-d * 10) * 12 : acc;
  }, 0);
  const cuts = [...PIECES.map((p) => p.at), ...OVERLAYS.filter((o) => o.full).map((o) => (o.from === 129 ? -1 : at(o.from))), payoffStart, ctaFrom];
  const flash = cuts.reduce((acc, c) => {
    const d = t - c;
    return c >= 0 && d >= 0 && d < 0.25 ? Math.max(acc, Math.exp(-d * 18) * 0.28) : acc;
  }, 0);
  return (
    <AbsoluteFill style={{background: S.navy, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${Math.sin(t * 71) * shake}px, ${Math.cos(t * 53) * shake}px)`}}>
        <Speaker t={t} frame={frame} />
        {live.map(({o, a, b}, i) => {
          const k = o.full ? prog(t, a - 0.12, a + 0.18, easeOut) * (1 - prog(t, b, b + 0.25, easeIn)) : 1;
          const scale = o.full ? 1.08 - 0.08 * prog(t, a - 0.12, a + 0.25, easeOut) : 1;
          return (
            <AbsoluteFill key={i} style={{opacity: k, transform: `scale(${scale})`}}>
              {o.render(t, frame, a, b)}
            </AbsoluteFill>
          );
        })}
        {payoffOn ? (
          <AbsoluteFill style={{opacity: prog(t, payoffStart - 0.15, payoffStart + 0.15, easeOut) * (1 - prog(t, payoffWords[13].e + 0.2, payoffWords[13].e + 0.5, easeIn))}}>
            <Navy t={t} pattern={0.22} glow="rgba(242,140,40,0.32)" />
            <div style={{position: 'absolute', left: 50, right: 50, top: 600, direction: 'rtl', textAlign: 'center', fontFamily: SF.quote, fontWeight: 700, fontSize: 132, lineHeight: 1.45, color: S.cream}}>
              {payoffWords.slice(7).map((w) => {
                const k = prog(t, w.s - 0.08, w.s + 0.2, easeOut);
                return (
                  <span key={w.i} style={{display: 'inline-block', margin: '0 0.12em', opacity: 0.12 + 0.88 * k, transform: `scale(${0.9 + 0.1 * k})`, color: w.src >= 131 && w.src <= 133 ? S.orange : undefined}}>
                    {clean(w.w)}
                  </span>
                );
              })}
            </div>
          </AbsoluteFill>
        ) : null}
        {t >= ctaFrom ? (
          <AbsoluteFill style={{opacity: prog(t, ctaFrom, ctaFrom + 0.3, easeOut)}}>
            <Cta t={t} frame={frame} from={ctaFrom} />
          </AbsoluteFill>
        ) : null}
        <Captions t={t} hidden={hideCaps} top={full ? 1330 : 1300} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#fff', opacity: flash, pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 75% at 50% 45%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.4) 100%)'}} />
      <div style={{position: 'absolute', left: 0, top: 0, height: 10, width: `${(t / (TALK_DURATION / FPS)) * 100}%`, background: S.orange}} />
      {t < ctaFrom ? (
        <div style={{position: 'absolute', left: 46, top: 60, opacity: 0.92}}>
          <Logo size={110} />
        </div>
      ) : null}
      <Grain frame={frame} opacity={0.05} />
    </AbsoluteFill>
  );
};

void HOOK_FULL;
void PAYOFF;
void easeInOut;
