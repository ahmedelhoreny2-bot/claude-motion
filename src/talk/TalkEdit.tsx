import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import type {SpringConfig} from 'remotion';
import {Grain} from '../components/primitives';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog, sp as sp60} from '../lib';
import {Logo} from '../sedra/kit';
import EDL from './edl.json';
import {archPath, Divider, G, GF, Lattice, useTalkFonts} from './theme';

export const FPS = 30;
export const W = 1080;
export const H = 1920;
const CTA_LEN = 5;
export const TALK_DURATION = Math.round((EDL.duration + CTA_LEN) * FPS);

type Word = {w: string; s: number; e: number; src: number};
type Piece = {in: number; out: number; at: number};
const WD = EDL.words as Word[];
const PIECES = EDL.pieces as Piece[];
const bySrc = new Map(WD.map((w, i) => [w.src, i])); // last occurrence wins
const at = (src: number) => WD[bySrc.get(src)!].s;
const endOf = (src: number) => WD[bySrc.get(src)!].e;
const sp = (frame: number, t0: number, cfg: Partial<SpringConfig> = {}) => sp60(frame, t0, cfg, FPS);
const soft = {damping: 20, stiffness: 90, mass: 1};
const clean = (w: string) => w.replace(/[،.…:؟!]/g, '').replace(/ـ$/, '');
const FACE = {x: 47, y: 34};
const XF = 0.2; // seconds of dissolve on every jump cut

// ------------------------------------------------------------------ speaker: calm framing, soft jump cuts
const Speaker: React.FC<{t: number}> = ({t}) => {
  const idx = Math.max(0, PIECES.findIndex((p, i) => t >= p.at && (i + 1 === PIECES.length || t < PIECES[i + 1].at)));
  // two framings only, changed every few pieces and eased, plus a slow breathing push
  const framing = (i: number) => (Math.floor(i / 3) % 2 ? 1.12 : 1.04);
  const p = PIECES[idx];
  const prev = framing(Math.max(0, idx - 1));
  const scale = lerp(prev, framing(idx), prog(t, p.at, p.at + 0.9, easeInOut)) + 0.02 * Math.sin(t * 0.25);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: G.deep}}>
      <AbsoluteFill style={{transformOrigin: `${FACE.x}% ${FACE.y}%`, transform: `scale(${scale})`}}>
        {PIECES.map((pc, i) => {
          if (i < idx - 1 || i > idx + 1) return null;
          const from = Math.round(pc.at * FPS);
          const len = Math.round((pc.out - pc.in) * FPS) + Math.round(XF * FPS);
          const fadeIn = i === 0 ? 1 : prog(t, pc.at, pc.at + XF, easeInOut);
          return (
            <Sequence key={i} from={from} durationInFrames={len} layout="none">
              <AbsoluteFill style={{opacity: fadeIn}}>
                <OffthreadVideo src={staticFile('sedra/raw/talk_hd2.mp4')} startFrom={Math.round(pc.in * FPS)} muted style={{width: '100%', height: '100%'}} />
              </AbsoluteFill>
            </Sequence>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(11,35,29,0.5) 0%, rgba(11,35,29,0) 16%, rgba(11,35,29,0) 58%, rgba(11,35,29,0.82) 100%)`}} />
    </AbsoluteFill>
  );
};

/** Thin gold frame inset from the edges, with small corner diamonds. */
const Frame: React.FC<{opacity?: number}> = ({opacity = 1}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity, pointerEvents: 'none'}}>
    <rect x={30} y={30} width={W - 60} height={H - 60} rx={34} fill="none" stroke={G.gold} strokeWidth={2.5} opacity={0.75} />
    {[[30, 30], [W - 30, 30], [30, H - 30], [W - 30, H - 30]].map(([x, y], i) => (
      <rect key={i} x={x - 9} y={y - 9} width={18} height={18} transform={`rotate(45 ${x} ${y})`} fill={G.gold} />
    ))}
  </svg>
);

// ------------------------------------------------------------------ backgrounds and the arch window
const Parchment: React.FC<{t: number; lattice?: number}> = ({t, lattice = 0.1}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 60% at 50% 38%, ${G.emerald} 0%, ${G.green} 45%, ${G.deep} 100%)`}}>
    <Lattice t={t} width={W} height={H} opacity={lattice} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 30% at 50% 36%, rgba(233,205,130,0.16) 0%, rgba(0,0,0,0) 70%)'}} />
  </AbsoluteFill>
);

/** An image inside a mihrab arch: the gold outline draws itself, the picture fades up inside. */
const Arch: React.FC<{src: string; t: number; from: number; dur: number; x?: number; y?: number; w?: number; h?: number; focusY?: number}> = ({
  src, t, from, dur, x = 140, y = 230, w = 800, h = 900, focusY = 50,
}) => {
  const draw = prog(t, from - 0.1, from + 0.9, easeInOut);
  const pic = prog(t, from + 0.1, from + 0.8, easeOut);
  const k = clamp01((t - from) / dur);
  const d = archPath(x, y, w, h);
  const len = 2 * h + w * 1.6;
  const id = `arch-${Math.round(from * 100)}`;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={G.deep} opacity={0.6 * pic} transform={`translate(0 18)`} />
      <g clipPath={`url(#${id})`} opacity={pic}>
        <image href={staticFile(src)} x={x - 40} y={y - 40} width={w + 80} height={h + 80} preserveAspectRatio={`xMidY${focusY < 40 ? 'Min' : focusY > 60 ? 'Max' : 'Mid'} slice`} transform={`translate(${W / 2} ${y + h / 2}) scale(${lerp(1.1, 1.0, easeOut(k))}) translate(${-W / 2} ${-(y + h / 2)})`} />
        <rect x={x} y={y + h * 0.6} width={w} height={h * 0.4} fill="url(#archFade)" />
      </g>
      <defs>
        <linearGradient id="archFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={G.deep} stopOpacity={0} />
          <stop offset="100%" stopColor={G.deep} stopOpacity={0.55} />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke={G.gold} strokeWidth={5} strokeDasharray={len} strokeDashoffset={len * (1 - draw)} strokeLinejoin="round" />
      <path d={archPath(x - 18, y - 18, w + 36, h + 18)} fill="none" stroke={G.gold} strokeWidth={1.5} opacity={0.5 * draw} />
    </svg>
  );
};

const Title: React.FC<{t: number; at: number; children: React.ReactNode; size?: number; top: number; color?: string; font?: string}> = ({t, at: a, children, size = 110, top, color = G.goldHi, font = GF.title}) => {
  const k = prog(t, a - 0.1, a + 0.7, easeOut);
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top, textAlign: 'center', direction: 'rtl', fontFamily: font, fontWeight: 700, fontSize: size, lineHeight: 1.35, color, opacity: k, transform: `translateY(${(1 - k) * 24}px)`, textShadow: '0 6px 30px rgba(0,0,0,0.55)'}}>
      {children}
    </div>
  );
};

const Tag: React.FC<{k: number; children: React.ReactNode; size?: number; solid?: boolean}> = ({k, children, size = 40, solid}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, direction: 'rtl', padding: '10px 34px 16px', borderRadius: 999, background: solid ? G.gold : G.glass, border: `2px solid ${G.gold}`, color: solid ? G.deep : G.cream, fontFamily: GF.body, fontWeight: 800, fontSize: size, opacity: clamp01(k * 1.6), transform: `translateY(${(1 - k) * 20}px)`, boxShadow: '0 14px 36px rgba(0,0,0,0.3)'}}>
    {children}
  </div>
);

const LowerThird: React.FC<{k: number; title: string; sub: string}> = ({k, title, sub}) => (
  <div style={{position: 'absolute', right: 70, top: 250, direction: 'rtl', opacity: clamp01(k * 1.6), transform: `translateX(${(1 - k) * 80}px)`}}>
    <div style={{fontFamily: GF.body, fontWeight: 800, fontSize: 30, color: G.goldHi, marginBottom: 6}}>{sub}</div>
    <div style={{background: G.glass, borderRight: `6px solid ${G.gold}`, color: G.cream, fontFamily: GF.title, fontWeight: 700, fontSize: 54, padding: '6px 28px 14px', borderRadius: 14}}>{title}</div>
  </div>
);

/** Spoken words appear as they are said. */
const Synced: React.FC<{t: number; from: number; to: number; size: number; font?: string; accent?: number[]; color?: string; lineHeight?: number}> = ({
  t, from, to, size, font = GF.body, accent = [], color = G.cream, lineHeight = 1.55,
}) => (
  <div style={{direction: 'rtl', textAlign: 'center', fontFamily: font, fontWeight: 700, fontSize: size, lineHeight, color}}>
    {WD.slice(bySrc.get(from)!, bySrc.get(to)! + 1).map((w) => {
      const k = prog(t, w.s - 0.1, w.s + 0.25, easeOut);
      return (
        <span key={w.src} style={{display: 'inline-block', margin: '0 0.12em', opacity: 0.18 + 0.82 * k, color: accent.includes(w.src) ? G.goldHi : undefined}}>
          {clean(w.w)}
        </span>
      );
    })}
  </div>
);

const IconCup: React.FC<{size: number; color?: string}> = ({size, color = G.goldHi}) => (
  <svg width={size} height={size * 1.15} viewBox="0 0 60 70">
    <path d="M10 60 C6 40 12 22 26 18 V10 H34 V18 C48 22 54 40 50 60 Z" fill="none" stroke={color} strokeWidth={4} strokeLinejoin="round" />
    <rect x={24} y={4} width={12} height={8} rx={2} fill={color} />
    <line x1={8} y1={62} x2={52} y2={62} stroke={color} strokeWidth={4} strokeLinecap="round" />
  </svg>
);
const IconDrop: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 60 60">
    <path d="M30 6 C30 6 12 28 12 40 A18 18 0 0 0 48 40 C48 28 30 6 30 6 Z" fill={G.gold} />
    <path d="M22 40 A8 8 0 0 0 30 48" fill="none" stroke={G.cream} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
  </svg>
);
const IconFlame: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 60 60">
    <path d="M30 4 C34 16 46 22 46 38 A16 16 0 0 1 14 38 C14 28 20 24 22 16 C26 22 28 24 30 26 C32 18 30 10 30 4 Z" fill={G.gold} />
    <path d="M30 30 C32 36 38 38 38 44 A8 8 0 0 1 22 44 C22 40 26 38 30 30 Z" fill={G.cream} opacity={0.85} />
  </svg>
);

// ------------------------------------------------------------------ cards keyed to spoken words
type Ov = {from: number; to: number; tail?: number; full: boolean; captions?: boolean; render: (t: number, frame: number, a: number, b: number) => React.ReactNode};

const ArchCard = (src: string, title: React.ReactNode, sub?: (t: number, frame: number, a: number) => React.ReactNode, focusY = 50) =>
  (t: number, frame: number, a: number, b: number) => (
    <>
      <Parchment t={t} />
      <Arch src={src} t={t} from={a} dur={b - a + 1} focusY={focusY} />
      {sub ? sub(t, frame, a) : null}
      {title}
    </>
  );

const OVERLAYS: Ov[] = [
  {from: 7, to: 10, full: true, render: (t, frame, a, b) =>
    ArchCard('sedra/ai/lantern.jpg', <><Title t={t} at={a} top={1150} size={70} color={G.creamDim} font={GF.body}>سر من أسرار</Title><Title t={t} at={at(10)} top={1240} size={150}>الشفاء</Title></>)(t, frame, a, b)},
  {from: 16, to: 20, full: true, render: (t, frame, a, b) =>
    ArchCard('sedra/ai/mosque.jpg', <><Title t={t} at={a} top={1150} size={70} color={G.creamDim} font={GF.body}>سر من أسرار</Title><Title t={t} at={at(19)} top={1240} size={140}>الطب النبوي</Title></>, undefined, 45)(t, frame, a, b)},
  {from: 28, to: 34, full: false, captions: true, render: (t, frame, a) => <LowerThird k={sp(frame, a, soft)} sub="من حديث" title="أبي سعيد الخدري رضي الله عنه" />},
  {from: 48, to: 60, full: true, render: (t, frame, a, b) => (
    <>
      <Parchment t={t} />
      <Arch src="sedra/ai/stomach.jpg" t={t} from={a} dur={b - a + 1} h={760} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1040, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, direction: 'rtl', padding: '0 80px'}}>
        {([[48, 'يشتكي بطنه'], [53, 'قولونه تعبان'], [55, 'ومعدته']] as [number, string][]).map(([src, txt], i) => (
          <Tag key={i} k={sp(frame, at(src) - 0.05, soft)} solid={i === 0} size={46}>{txt}</Tag>
        ))}
      </div>
    </>
  )},
  {from: 66, to: 67, tail: 0.8, full: true, render: (t, frame, a, b) =>
    ArchCard('sedra/ai/dipper.jpg', <Title t={t} at={a} top={1200} size={150}>اسقه عسلاً</Title>, (tt, f, aa) => <div style={{position: 'absolute', left: 0, right: 0, top: 1150, display: 'flex', justifyContent: 'center'}}><Tag k={sp(f, aa - 0.2, soft)} size={34}>المرة الأولى</Tag></div>)(t, frame, a, b)},
  {from: 80, to: 81, tail: 0.8, full: true, render: (t, frame, a, b) =>
    ArchCard('sedra/ai/jar.jpg', <Title t={t} at={a} top={1200} size={150}>اسقه عسلاً</Title>, (tt, f, aa) => <div style={{position: 'absolute', left: 0, right: 0, top: 1150, display: 'flex', justifyContent: 'center'}}><Tag k={sp(f, aa - 0.2, soft)} size={34}>المرة الثانية</Tag></div>)(t, frame, a, b)},
  {from: 100, to: 101, tail: 0.8, full: true, render: (t, frame, a, b) =>
    ArchCard('sedra/ai/honeycomb.jpg', <Title t={t} at={a} top={1200} size={150}>اسقه عسلاً</Title>, (tt, f, aa) => <div style={{position: 'absolute', left: 0, right: 0, top: 1150, display: 'flex', justifyContent: 'center'}}><Tag k={sp(f, aa - 0.2, soft)} size={34}>المرة الثالثة</Tag></div>)(t, frame, a, b)},
  {from: 121, to: 128, full: true, render: (t, frame, a) => (
    <>
      <Parchment t={t} lattice={0.14} />
      <div style={{position: 'absolute', left: 80, right: 80, top: 560}}>
        <Divider k={prog(t, a - 0.3, a + 0.6, easeOut)} />
        <div style={{height: 30}} />
        <Synced t={t} from={115} to={128} size={78} accent={[124, 125, 126, 127, 128]} />
        <div style={{height: 30}} />
        <Divider k={prog(t, a, a + 0.9, easeOut)} />
      </div>
    </>
  )},
  {from: 140, to: 147, full: false, captions: true, render: (t, frame) => (
    <div style={{position: 'absolute', left: 0, right: 0, top: 260, display: 'flex', justifyContent: 'center', gap: 22, direction: 'rtl'}}>
      <Tag k={sp(frame, at(143), soft)} size={54} solid>إيمانه</Tag>
      <Tag k={sp(frame, at(146), soft)} size={54} solid>يقينه</Tag>
    </div>
  )},
  {from: 157, to: 169, tail: 0.8, full: true, render: (t, frame, a, b) => (
    <>
      <Parchment t={t} lattice={0.12} />
      <Arch src="sedra/ai/quran.jpg" t={t} from={a} dur={b - a + 1} x={240} y={200} w={600} h={560} />
      <div style={{position: 'absolute', left: 60, right: 60, top: 860, textAlign: 'center', direction: 'rtl', fontFamily: GF.quote, fontWeight: 700, fontSize: 76, lineHeight: 1.75, color: G.cream}}>
        {([[157, 'فَاسْلُكِي سُبُلَ رَبِّكِ ذُلُلًا ۚ'], [161, 'يَخْرُجُ مِن بُطُونِهَا شَرَابٌ'], [164, 'مُّخْتَلِفٌ أَلْوَانُهُ'], [167, 'فِيهِ شِفَاءٌ لِّلنَّاسِ']] as [number, string][]).map(([src, line], i) => {
          const k = prog(t, at(src) - 0.15, at(src) + 0.45, easeOut);
          return <div key={i} style={{opacity: 0.15 + 0.85 * k, color: i === 3 ? G.goldHi : undefined}}>{line}</div>;
        })}
        <div style={{fontFamily: GF.body, fontWeight: 700, fontSize: 30, color: G.muted, marginTop: 8}}>[النحل: ٦٩]</div>
      </div>
    </>
  )},
  {from: 170, to: 176, tail: 0.4, full: true, render: (t, frame, a) => {
    const fall = prog(t, a, a + 1.2, easeIn);
    const ripple = prog(t, a + 1.2, a + 2.2, easeOut);
    return (
      <>
        <Parchment t={t} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <path d="M380 760 C380 700 400 680 420 670 H660 C680 680 700 700 700 760 V1020 C700 1060 680 1080 640 1080 H440 C400 1080 380 1060 380 1020 Z" fill="rgba(201,162,74,0.12)" stroke={G.gold} strokeWidth={5} />
          <rect x={410} y={640} width={260} height={34} rx={10} fill="none" stroke={G.gold} strokeWidth={5} />
          <path d={`M384 ${1000 - 160 * ripple} H696 V1020 C696 1058 678 1076 640 1076 H440 C402 1076 384 1058 384 1020 Z`} fill={G.gold} opacity={0.75} />
          <g transform={`translate(540 ${lerp(300, 900, fall)})`} opacity={1 - ripple}>
            <path d="M0 -40 C0 -40 -26 -6 -26 12 A26 26 0 0 0 26 12 C26 -6 0 -40 0 -40 Z" fill={G.goldHi} />
          </g>
          {ripple > 0 ? <ellipse cx={540} cy={1000 - 160 * ripple} rx={150 * ripple} ry={20 * ripple} fill="none" stroke={G.cream} strokeWidth={3} opacity={1 - ripple} /> : null}
        </svg>
        <Title t={t} at={at(174)} top={1150} size={120}>فيه شفاء للناس</Title>
      </>
    );
  }},
  {from: 192, to: 195, tail: 0.5, full: false, captions: true, render: (t, frame) => (
    <div style={{position: 'absolute', left: 0, right: 0, top: 260, display: 'flex', justifyContent: 'center'}}>
      <Tag k={sp(frame, at(195) - 0.05, soft)} size={64} solid>خفّ بإذن الله</Tag>
    </div>
  )},
  {from: 196, to: 199, tail: 0.6, full: true, render: (t, frame, a) => (
    <>
      <Parchment t={t} lattice={0.16} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 640}}><Divider k={prog(t, a - 0.2, a + 0.8, easeOut)} /></div>
      <Title t={t} at={a} top={720} size={190}>اليقين</Title>
      <Title t={t} at={at(197)} top={960} size={90} color={G.cream} font={GF.body}>بما عند الله</Title>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1130}}><Divider k={prog(t, a, a + 1, easeOut)} /></div>
    </>
  )},
  {from: 200, to: 212, full: true, render: (t, frame, a, b) => (
    <>
      <Parchment t={t} />
      <Arch src="sedra/ai/manuscript.jpg" t={t} from={a} dur={b - a + 1} />
      <Title t={t} at={at(206)} top={1170} size={96}>حديث جابر</Title>
      <Title t={t} at={at(209)} top={1300} size={52} color={G.creamDim} font={GF.body}>رضي الله عنه</Title>
    </>
  )},
  {from: 221, to: 239, tail: 0.4, full: true, render: (t, frame) => {
    const items: [number, string, React.ReactNode][] = [
      [229, 'شرطة محجم', <IconCup key="c" size={86} />],
      [231, 'شربة عسل', <IconDrop key="d" size={96} />],
      [233, 'كية نار', <IconFlame key="f" size={96} />],
    ];
    const strike = prog(t, at(236), at(236) + 0.6, easeInOut);
    return (
      <>
        <Parchment t={t} lattice={0.1} />
        <div style={{position: 'absolute', left: 80, right: 80, top: 260}}>
          <Synced t={t} from={221} to={227} size={66} font={GF.quote} />
          <div style={{height: 16}} />
          <Divider k={prog(t, at(221), at(221) + 0.9, easeOut)} />
        </div>
        <div style={{position: 'absolute', left: 90, right: 90, top: 560, display: 'flex', flexDirection: 'column', gap: 26}}>
          {items.map(([src, label, icon], i) => {
            const k = sp(frame, at(src) - 0.05, soft);
            return (
              <div key={i} style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 34, direction: 'rtl', background: G.glass, border: `2px solid ${G.line}`, borderRadius: 28, padding: '22px 36px', opacity: clamp01(k * 1.6), transform: `translateY(${(1 - k) * 30}px)`}}>
                <div style={{width: 120, display: 'flex', justifyContent: 'center'}}>{icon}</div>
                <div style={{fontFamily: GF.title, fontWeight: 700, fontSize: 78, color: i === 2 && strike > 0 ? G.muted : G.cream}}>{label}</div>
                {i === 2 ? <div style={{position: 'absolute', right: 180, top: '52%', height: 6, width: 300 * strike, background: G.red, borderRadius: 3}} /> : null}
              </div>
            );
          })}
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1150, display: 'flex', justifyContent: 'center'}}>
          <Tag k={sp(frame, at(235), soft)} size={44}>وأنا أنهى أمتي عن الكي</Tag>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1250, textAlign: 'center', fontFamily: GF.body, fontWeight: 700, fontSize: 28, color: G.muted}}>متفق عليه</div>
      </>
    );
  }},
  {from: 258, to: 260, tail: 0.4, full: false, captions: true, render: (t, frame) => <div style={{position: 'absolute', left: 0, right: 0, top: 260, display: 'flex', justifyContent: 'center'}}><Tag k={sp(frame, at(259), soft)} size={56} solid>العلاج الصح</Tag></div>},
  {from: 267, to: 281, full: true, captions: true, render: (t, frame) => {
    const shown = Math.round(20 * prog(t, at(268) - 0.2, at(269) + 0.2, easeOut) + 10 * prog(t, at(271) - 0.2, at(272) + 0.2, easeOut));
    const pick = prog(t, at(275) - 0.1, at(275) + 0.7, easeInOut);
    const PICK = 17;
    return (
      <>
        <Parchment t={t} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 230, textAlign: 'center', fontFamily: GF.title, fontWeight: 700, fontSize: 120, color: G.goldHi, opacity: 1 - pick * 0.6}}>
          {shown} <span style={{fontFamily: GF.body, fontSize: 60, color: G.cream}}>كاس</span>
        </div>
        <div style={{position: 'absolute', left: 150, top: 470, width: 780, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', rowGap: 26, justifyItems: 'center'}}>
          {Array.from({length: 30}, (_, i) => {
            const on = i < shown;
            const isPick = i === PICK;
            return (
              <div key={i} style={{opacity: on ? (isPick ? 1 : 1 - 0.7 * pick) : 0.08, transform: `scale(${on ? (isPick ? 1 + 0.5 * pick : 1) : 0.8})`, filter: isPick && pick > 0 ? `drop-shadow(0 0 ${18 * pick}px ${G.goldHi})` : undefined}}>
                <IconCup size={80} color={isPick && pick > 0 ? G.goldHi : G.cream} />
              </div>
            );
          })}
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1100, display: 'flex', justifyContent: 'center'}}><Tag k={pick} size={52} solid>الكاس المهم</Tag></div>
      </>
    );
  }},
  {from: 294, to: 308, full: true, render: (t, frame, a, b) => (
    <>
      <Parchment t={t} />
      <Arch src="sedra/ai/dua.jpg" t={t} from={a} dur={b - a + 1} />
      <Title t={t} at={at(304)} top={1170} size={140}>الجأ لله</Title>
      <Title t={t} at={at(308)} top={1350} size={70} color={G.cream} font={GF.body}>الأول</Title>
    </>
  )},
  {from: 309, to: 319, full: true, captions: true, render: (t, frame, a, b) => (
    <>
      <Parchment t={t} />
      <Arch src="sedra/ai/placing.jpg" t={t} from={a} dur={b - a + 1} />
    </>
  )},
  {from: 324, to: 337, tail: 0.4, full: true, captions: true, render: (t, frame) => {
    const body = (x: number, dots: [number, number][], k: number, label: string) => (
      <div style={{position: 'absolute', left: x, top: 330, width: 400, opacity: clamp01(k * 1.6), transform: `translateY(${(1 - k) * 30}px)`}}>
        <svg width={400} height={580} viewBox="0 0 220 320">
          <path d="M110 20 C125 20 135 32 135 48 C135 62 127 72 118 76 L118 84 C150 90 182 100 192 130 L200 230 C200 250 190 300 180 310 L40 310 C30 300 20 250 20 230 L28 130 C38 100 70 90 102 84 L102 76 C93 72 85 62 85 48 C85 32 95 20 110 20 Z" fill="rgba(244,236,216,0.08)" stroke={G.gold} strokeWidth={2.5} />
          {dots.map(([dx, dy], i) => <circle key={i} cx={dx} cy={dy} r={10} fill="none" stroke={G.goldHi} strokeWidth={3} opacity={clamp01(k * 3 - i * 0.3)} />)}
        </svg>
        <div style={{textAlign: 'center', fontFamily: GF.title, fontWeight: 700, fontSize: 52, color: G.goldHi}}>{label}</div>
      </div>
    );
    return (
      <>
        <Parchment t={t} />
        <Title t={t} at={at(324)} top={200} size={70} color={G.cream} font={GF.body}>نفس الشكوى…</Title>
        {body(560, [[80, 130], [140, 130], [110, 170], [70, 220]], sp(frame, at(328), soft), 'الأول')}
        {body(120, [[110, 110], [60, 160], [160, 200], [110, 250]], sp(frame, at(333), soft), 'الثاني')}
      </>
    );
  }},
  {from: 393, to: 396, tail: 0.3, full: true, render: (t, frame, a) => {
    const tiles = ['sedra/selfie.jpg', 'sedra/cups.jpg', 'sedra/honey.jpg', 'sedra/chest.jpg'];
    return (
      <>
        <Parchment t={t} />
        <div style={{position: 'absolute', left: 80, right: 80, top: 230, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20}}>
          {tiles.map((src, i) => {
            const k = sp(frame, a - 0.2 + i * 0.15, soft);
            return (
              <div key={i} style={{height: 500, borderRadius: 26, overflow: 'hidden', border: `4px solid ${G.gold}`, opacity: clamp01(k * 1.6), transform: `scale(${0.9 + 0.1 * k})`}}>
                <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              </div>
            );
          })}
        </div>
        <div style={{position: 'absolute', left: W / 2 - 115, top: 625, width: 230, height: 230, borderRadius: '50%', background: G.cream, border: `5px solid ${G.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.45)', transform: `scale(${sp(frame, a + 0.4, soft)})`}}>
          <Logo size={150} />
        </div>
      </>
    );
  }},
];

// the story copy of «صدق الله وكذبت بطن أخيك» (the hook is the first copy)
const PAY = WD.map((w, i) => ({...w, i})).filter((w) => w.src >= 129 && w.src <= 135).slice(7);
const CLOSING = [374, 378] as const;

// ------------------------------------------------------------------ captions
type Grp = {a: number; b: number};
const GROUPS: Grp[] = (() => {
  const out: Grp[] = [];
  let cur: number[] = [];
  WD.forEach((w, i) => {
    cur.push(i);
    const letters = cur.reduce((n, j) => n + clean(WD[j].w).length, 0);
    if (/[،.…:؟!]$/.test(w.w) || cur.length >= 4 || letters >= 18 || (i + 1 < WD.length && WD[i + 1].s - w.e > 0.3)) {
      out.push({a: cur[0], b: cur[cur.length - 1]});
      cur = [];
    }
  });
  return out;
})();

const Captions: React.FC<{t: number; top: number; big: boolean}> = ({t, top, big}) => {
  const gi = GROUPS.findIndex((g, i) => {
    const next = GROUPS[i + 1];
    const end = next ? Math.min(WD[next.a].s - 0.03, WD[g.b].e + 0.6) : WD[g.b].e + 0.6;
    return t >= WD[g.a].s - 0.1 && t < end;
  });
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const k = prog(t, WD[g.a].s - 0.1, WD[g.a].s + 0.15, easeOut);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top, display: 'flex', justifyContent: 'center', opacity: k}}>
      <div style={{direction: 'rtl', textAlign: 'center', background: 'rgba(11,35,29,0.55)', borderRadius: 26, padding: '10px 30px 18px', border: `1.5px solid ${G.line}`}}>
        {WD.slice(g.a, g.b + 1).map((w, j) => {
          const on = t >= w.s - 0.05;
          return (
            <span key={j} style={{display: 'inline-block', margin: '0 0.13em', fontFamily: GF.body, fontWeight: 800, fontSize: big ? 84 : 66, lineHeight: 1.45, color: on ? (t < w.e + 0.05 ? G.goldHi : G.cream) : 'rgba(244,236,216,0.45)'}}>
              {clean(w.w)}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ closing card
const Cta: React.FC<{t: number; frame: number; from: number}> = ({t, frame, from}) => {
  const k = sp(frame, from, soft);
  const p = sp(frame, from + 0.6, soft);
  return (
    <>
      <Parchment t={t} lattice={0.12} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{width: 400, height: 400, borderRadius: '50%', background: G.cream, border: `6px solid ${G.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: clamp01(k * 1.6), transform: `scale(${0.85 + 0.15 * k})`, boxShadow: '0 30px 80px rgba(0,0,0,0.45)'}}>
          <Logo size={280} />
        </div>
        <div style={{height: 40}} />
        <Divider k={k} />
        <div style={{marginTop: 20, fontFamily: GF.title, fontWeight: 700, fontSize: 100, color: G.goldHi, opacity: k}}>مركز سدرة للحجامة</div>
        <div style={{marginTop: 30, display: 'flex', alignItems: 'center', background: G.gold, borderRadius: 30, padding: '10px 46px 16px', fontFamily: GF.body, fontWeight: 800, fontSize: 92, color: G.deep, direction: 'ltr', opacity: clamp01(p * 1.6), transform: `translateY(${(1 - p) * 20}px)`}}>
          01148470010
        </div>
        <div style={{marginTop: 30, opacity: p, fontFamily: GF.body, fontWeight: 700, fontSize: 38, color: G.creamDim, textAlign: 'center', direction: 'rtl', lineHeight: 1.6}}>
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
  useTalkFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const live = OVERLAYS.map((o) => ({o, a: at(o.from), b: endOf(o.to) + (o.tail ?? 0.25)})).filter(({a, b}) => t >= a - 0.6 && t < b + 0.7);
  const payA = PAY[0].s;
  const payB = PAY[PAY.length - 1].e + 0.7;
  const closA = at(CLOSING[0]);
  const closB = endOf(CLOSING[1]) + 0.7;
  const ctaFrom = EDL.duration - 0.2;
  const cardOn = live.some(({o, a, b}) => o.full && t >= a && t < b) || (t >= payA && t < payB) || (t >= closA && t < closB);
  const capsHidden = live.some(({o, a, b}) => o.full && !o.captions && t >= a - 0.5 && t < b + 0.2) || (t >= payA - 0.5 && t < payB) || (t >= closA - 0.5 && t < closB) || t > ctaFrom - 0.5;
  // card fade: 0.55 s in, 0.5 s out — never a hard cut over the voice
  const fade = (a: number, b: number) => prog(t, a - 0.45, a + 0.1, easeInOut) * (1 - prog(t, b, b + 0.5, easeInOut));
  const hookK = prog(t, 0.2, 1.0, easeOut) * (1 - prog(t, WD[6].e, WD[6].e + 0.5, easeIn));
  return (
    <AbsoluteFill style={{background: G.deep, overflow: 'hidden'}}>
      <Speaker t={t} />
      <AbsoluteFill style={{opacity: hookK}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 230, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
          <Tag k={hookK} size={38} solid>قصة من السُّنّة</Tag>
        </div>
      </AbsoluteFill>
      {live.map(({o, a, b}, i) => (
        <AbsoluteFill key={i} style={{opacity: o.full ? fade(a, b) : 1 - prog(t, b, b + 0.5, easeInOut)}}>
          {o.render(t, frame, a, b)}
        </AbsoluteFill>
      ))}
      {[[payA, payB, PAY.map((w) => w.i)], [closA, closB, null]].map(([a, b, idx], n) => {
        const A = a as number;
        const B = b as number;
        if (t < A - 0.6 || t > B + 0.6) return null;
        const words = n === 0 ? (idx as number[]).map((i) => WD[i]) : WD.slice(bySrc.get(374)!, bySrc.get(378)! + 1);
        return (
          <AbsoluteFill key={n} style={{opacity: fade(A, B)}}>
            <Parchment t={t} lattice={0.16} />
            <div style={{position: 'absolute', left: 0, right: 0, top: 560}}><Divider k={prog(t, A - 0.3, A + 0.8, easeOut)} /></div>
            <div style={{position: 'absolute', left: 60, right: 60, top: 640, direction: 'rtl', textAlign: 'center', fontFamily: GF.title, fontWeight: 700, fontSize: 132, lineHeight: 1.5, color: G.cream}}>
              {words.map((w, j) => {
                const k = prog(t, w.s - 0.12, w.s + 0.3, easeOut);
                return (
                  <span key={j} style={{display: 'inline-block', margin: '0 0.12em', opacity: 0.15 + 0.85 * k, color: [131, 132, 133, 376, 377, 378].includes(w.src) ? G.goldHi : undefined}}>
                    {clean(w.w)}
                  </span>
                );
              })}
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, top: 1180}}><Divider k={prog(t, A, A + 1, easeOut)} /></div>
          </AbsoluteFill>
        );
      })}
      {t >= ctaFrom - 0.6 ? (
        <AbsoluteFill style={{opacity: prog(t, ctaFrom - 0.5, ctaFrom + 0.2, easeInOut)}}>
          <Cta t={t} frame={frame} from={ctaFrom} />
        </AbsoluteFill>
      ) : null}
      {!capsHidden ? <Captions t={t} top={cardOn ? 1440 : 1390} big={t < WD[6].e + 0.5} /> : null}
      <Frame />
      {t < ctaFrom - 0.3 ? (
        <div style={{position: 'absolute', left: 64, top: 64, width: 130, height: 130, borderRadius: '50%', background: G.cream, border: `3px solid ${G.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.35)'}}>
          <Logo size={92} />
        </div>
      ) : null}
      <div style={{position: 'absolute', left: 60, right: 60, bottom: 48, height: 4, borderRadius: 2, background: 'rgba(244,236,216,0.15)'}}>
        <div style={{height: 4, borderRadius: 2, width: `${clamp01(t / (TALK_DURATION / FPS)) * 100}%`, background: G.gold}} />
      </div>
      <Grain frame={frame} opacity={0.035} />
    </AbsoluteFill>
  );
};

void easeIn;
