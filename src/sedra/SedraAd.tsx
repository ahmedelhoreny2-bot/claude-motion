import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from '../components/primitives';
import {clamp01, easeIn, easeInOut, easeOut, lerp, prog, sp as sp60} from '../lib';
import type {SpringConfig} from 'remotion';
import {Chip, Cup, FPS, H, Logo, Photo, S, SedraBackground, SF, T, useSedraFonts, vis, W, Words} from './kit';

const PAD = 80;
const sp = (frame: number, at: number, cfg: Partial<SpringConfig> = {}) => sp60(frame, at, cfg, FPS);
const display: React.CSSProperties = {
  fontFamily: SF.ar,
  fontWeight: 900,
  color: S.cream,
  textAlign: 'center',
};
const body: React.CSSProperties = {fontFamily: SF.ar, fontWeight: 700, color: S.creamDim, textAlign: 'center'};
const Center: React.FC<{top: number; children: React.ReactNode; opacity?: number}> = ({top, children, opacity = 1}) => (
  <div style={{position: 'absolute', left: PAD, right: PAD, top, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity}}>
    {children}
  </div>
);
const Source: React.FC<{k: number; children: React.ReactNode}> = ({k, children}) => (
  <div style={{...body, fontWeight: 500, fontSize: 28, color: S.muted, direction: 'rtl', opacity: k, transform: `translateY(${(1 - k) * 12}px)`}}>
    {children}
  </div>
);

/** The cup is one object travelling from the hook to the logo reveal. */
const cupState = (t: number, frame: number) => {
  const toTop = prog(t, T.s2.enter - 0.2, T.s2.enter + 0.6, easeInOut);
  const toEmblem = prog(t, T.s3.exit, T.s3.exit + 0.7, easeInOut);
  const toHero = prog(t, T.s6.rise, T.s6.hit, easeIn);
  const y = lerp(lerp(lerp(560, 470, toTop), 400, toEmblem), 760, toHero);
  const size = lerp(lerp(lerp(400, 300, toTop), 170, toEmblem), 520, toHero);
  const dirty = prog(t, T.s2.dirty, T.s2.dirty + 1.6, easeOut) * (1 - prog(t, T.s3.clean, T.s3.clean + 0.6, easeInOut));
  const shine = prog(t, T.s3.clean, T.s3.clean + 0.7, easeInOut);
  const pop = sp(frame, 0.0, {damping: 13, stiffness: 160});
  const opacity = (0.25 + 0.75 * pop) * (1 - prog(t, T.s6.hit - 0.12, T.s6.hit, easeIn));
  const bob = Math.sin(t * 1.4) * 8;
  return {y: y + bob, size, dirty, shine, opacity, glow: toHero};
};

const Hook: React.FC<{t: number}> = ({t}) => {
  const x = T.s1.exit;
  if (t > x + 0.6) return null;
  return (
    <>
      <Center top={900}>
        <Words text="الكاسة دي…" t={t} at={T.s1.l1} exit={x} style={{...display, fontSize: 96, color: S.creamDim}} />
        <Words text="اتحطت على ضهر" t={t} at={T.s1.l2} exit={x} style={{...display, fontSize: 112}} />
        <Words text="مين قبلك؟" t={t} at={T.s1.l3} exit={x} stagger={0.12} style={{...display, fontSize: 150, color: S.orange}} />
      </Center>
      <Center top={1440} opacity={prog(t, T.s1.sub, T.s1.sub + 0.6, easeOut) * (1 - prog(t, x, x + 0.4, easeIn))}>
        <div style={{...body, fontSize: 40, direction: 'rtl'}}>سؤال لازم تسأله قبل أي حجامة</div>
      </Center>
    </>
  );
};

const Risk: React.FC<{t: number}> = ({t}) => {
  const s = T.s2;
  if (t < s.enter - 0.1 || t > s.exit + 0.6) return null;
  const chip = prog(t, s.chip, s.chip + 0.6, easeOut) * (1 - prog(t, s.exit, s.exit + 0.35, easeIn));
  return (
    <>
      <Center top={640}>
        <Chip k={chip}>⚠ تحذير من المعاهد الوطنية للصحة الأمريكية</Chip>
      </Center>
      <Center top={800}>
        <Words text="أدوات الحجامة" t={t} at={s.lines[0]} exit={s.exit} style={{...display, fontSize: 80, color: S.creamDim}} />
        <Words text="لو اتعاد استخدامها" t={t} at={s.lines[1]} exit={s.exit} style={{...display, fontSize: 80, color: S.creamDim}} />
        <Words text="من غير تعقيم…" t={t} at={s.lines[2]} exit={s.exit} style={{...display, fontSize: 80, color: S.creamDim}} />
        <div style={{height: 40}} />
        <Words text="ممكن تنقل" t={t} at={s.big[0]} exit={s.exit} style={{...display, fontSize: 116}} />
        <Words text="فيروس C و B" t={t} at={s.big[1]} exit={s.exit} accent={['C', 'B']} style={{...display, fontSize: 132}} />
      </Center>
      <Center top={1560}>
        <Source k={prog(t, s.source, s.source + 0.6, easeOut) * (1 - prog(t, s.exit, s.exit + 0.35, easeIn))}>
          المصدر: NCCIH · المعاهد الوطنية للصحة الأمريكية (NIH)
        </Source>
      </Center>
    </>
  );
};

const Pivot: React.FC<{t: number}> = ({t}) => {
  const s = T.s3;
  if (t < s.l1 - 0.1 || t > s.exit + 0.6) return null;
  const first = prog(t, s.l3 - 0.4, s.l3, easeIn);
  return (
    <>
      <Center top={830} opacity={1 - first}>
        <Words text="يبقى المشكلة" t={t} at={s.l1} style={{...display, fontSize: 96, color: S.creamDim}} />
        <Words text="مش في الحجامة…" t={t} at={s.l2} style={{...display, fontSize: 118}} />
      </Center>
      <Center top={830}>
        <Words text="المشكلة في" t={t} at={s.l3} exit={s.exit} style={{...display, fontSize: 96, color: S.creamDim}} />
        <Words text="مين بيعملها" t={t} at={s.l3 + 0.2} exit={s.exit} accent={['مين']} style={{...display, fontSize: 132}} />
        <Words text="وإزاي." t={t} at={s.l4} exit={s.exit} style={{...display, fontSize: 132, color: S.orange}} />
      </Center>
    </>
  );
};

const Sunnah: React.FC<{t: number}> = ({t}) => {
  const s = T.s4;
  if (t < s.chip - 0.1 || t > s.exit + 0.6) return null;
  const o = 1 - prog(t, s.exit, s.exit + 0.4, easeIn);
  const frame = prog(t, s.h1 - 0.3, s.h1 + 0.9, easeOut);
  return (
    <>
      <Center top={600} opacity={o}>
        <Chip k={prog(t, s.chip, s.chip + 0.6, easeOut)} color={S.skyHi} fill="rgba(58,160,220,0.12)">
          سنة نبوية
        </Chip>
      </Center>
      <div
        style={{
          position: 'absolute',
          left: PAD,
          right: PAD,
          top: 760,
          height: 450,
          borderRadius: 36,
          border: `2px solid ${S.line}`,
          background: S.glass,
          opacity: frame * o,
          transform: `scale(${0.96 + 0.04 * frame})`,
        }}
      />
      <Center top={830}>
        <div style={{...display, fontFamily: SF.quote, fontWeight: 700, fontSize: 120, color: S.orange, opacity: frame * o, lineHeight: 0.6}}>❝</div>
        <Words text="إنَّ أمثلَ ما تداويتم به" t={t} at={s.h1} exit={s.exit} style={{...display, fontFamily: SF.quote, fontWeight: 700, fontSize: 82}} />
        <Words text="الحِجامة" t={t} at={s.h2} exit={s.exit} style={{...display, fontFamily: SF.quote, fontWeight: 700, fontSize: 140, color: S.orange}} />
        <div style={{height: 20}} />
        <Source k={prog(t, s.source, s.source + 0.6, easeOut) * o}>رواه البخاري (٥٦٩٦)</Source>
      </Center>
    </>
  );
};

const Science: React.FC<{t: number}> = ({t}) => {
  const s = T.s5;
  if (t < s.chip - 0.1 || t > s.exit + 0.6) return null;
  const o = 1 - prog(t, s.exit, s.exit + 0.4, easeIn);
  const card = prog(t, s.card, s.card + 0.8, easeOut);
  return (
    <>
      <Center top={600} opacity={o}>
        <Chip k={prog(t, s.chip, s.chip + 0.6, easeOut)} color={S.skyHi} fill="rgba(58,160,220,0.12)">
          والعلم الحديث بيدرسها
        </Chip>
      </Center>
      <div
        style={{
          position: 'absolute',
          left: PAD + 40,
          right: PAD + 40,
          top: 780,
          padding: '40px 48px',
          borderRadius: 32,
          background: S.cream,
          opacity: card * o,
          transform: `translateY(${(1 - card) * 60}px) rotate(${(1 - card) * -3}deg)`,
          boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
        }}
      >
        <div style={{fontFamily: SF.ar, fontWeight: 900, fontSize: 64, color: S.navy, direction: 'ltr', textAlign: 'left'}}>
          BMJ <span style={{color: S.blue}}>Open</span>
        </div>
        <div style={{fontFamily: SF.ar, fontWeight: 700, fontSize: 30, color: 'rgba(7,23,53,0.55)', direction: 'ltr', textAlign: 'left'}}>
          Systematic review &amp; meta-analysis · 2018
        </div>
        <div style={{height: 2, background: 'rgba(7,23,53,0.12)', margin: '26px 0'}} />
        <Words text="مراجعة علمية جمعت ١٨ دراسة" t={t} at={s.l1} exit={s.exit} accent={['١٨']} accentColor={S.orange} style={{fontFamily: SF.ar, fontWeight: 900, fontSize: 50, color: S.navy, textAlign: 'right'}} />
        <Words text="عن الحجامة وآلام الرقبة" t={t} at={s.l2} exit={s.exit} style={{fontFamily: SF.ar, fontWeight: 900, fontSize: 50, color: S.navy, textAlign: 'right'}} />
      </div>
      <Center top={1300}>
        <Source k={prog(t, s.source, s.source + 0.6, easeOut) * o}>المصدر: BMJ Open 2018 · PubMed 30397006</Source>
      </Center>
    </>
  );
};

const Reveal: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const s = T.s6;
  if (t < s.hit - 0.2 || t > s.exit + 0.6) return null;
  const k = sp(frame, s.hit, {damping: 8, stiffness: 200});
  const o = 1 - prog(t, s.exit, s.exit + 0.45, easeIn);
  const ring = prog(t, s.hit, s.hit + 0.9, easeOut);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: W / 2 - 400,
          top: 760 - 400,
          width: 800,
          height: 800,
          borderRadius: '50%',
          border: `6px solid ${S.orange}`,
          opacity: (1 - ring) * 0.8,
          transform: `scale(${0.4 + ring * 1.2})`,
        }}
      />
      <Center top={760 - 300} opacity={o}>
        <div style={{transform: `scale(${0.6 + 0.4 * k})`, opacity: clamp01(k * 2)}}>
          <Logo size={520} />
        </div>
      </Center>
      <Center top={1260}>
        <Words text="مركز سدرة للحجامة" t={t} at={s.name} exit={s.exit} accent={['سدرة']} style={{...display, fontSize: 96}} />
        <Words text="زفتى · الغربية" t={t} at={s.place} exit={s.exit} style={{...body, fontSize: 44}} />
      </Center>
    </>
  );
};

const PILLARS = [
  {img: 'sedra/cups.jpg', focus: 45, title: 'أدوات معقمة لكل عميل', sub: 'نظافة وتعقيم قبل أي جلسة', accent: ['معقمة']},
  {img: 'sedra/selfie.jpg', focus: 40, title: 'جوانتي جديد وسرير متغلف', sub: 'في كل جلسة… من غير استثناء', accent: ['جديد']},
  {img: 'sedra/training.jpg', focus: 30, title: 'بنسأل عن حالتك قبل ما نبدأ', sub: 'لأن مش كل الناس الحجامة تناسبهم', accent: ['بنسأل']},
  {img: 'sedra/sheikh.jpg', focus: 22, title: 'الشيخ أحمد أبو يوسف', sub: 'أخصائي الحجامة', accent: ['أبو', 'يوسف']},
];

const Pillars: React.FC<{t: number}> = ({t}) => {
  const s = T.s7;
  if (t < s.pillars[0] - 0.1 || t > s.exit + 0.6) return null;
  return (
    <>
      {PILLARS.map((p, i) => {
        const a = s.pillars[i];
        const b = i < 3 ? s.pillars[i + 1] : s.exit;
        if (t < a - 0.1 || t > b + 0.6) return null;
        const v = vis(t, a, b, 0.6, 0.5);
        const certs = i === 3 ? prog(t, s.certs, s.certs + 0.8, easeOut) : 0;
        const titleTop = i === 3 ? lerp(1260, 1110, certs) : 1260;
        return (
          <AbsoluteFill key={i}>
            <div style={{opacity: v}}>
              <Photo src={p.img} t={t} from={a} dur={b - a + 0.5} height={1500} focusY={p.focus} fade={0.4} />
            </div>
            <div
              style={{
                position: 'absolute',
                right: PAD,
                top: 270,
                fontFamily: SF.ar,
                fontWeight: 900,
                fontSize: 40,
                color: S.navy,
                background: S.orange,
                borderRadius: 999,
                padding: '4px 26px 10px',
                opacity: v,
                transform: `scale(${0.8 + 0.2 * v})`,
              }}
            >
              {['١', '٢', '٣', '٤'][i]} / ٤
            </div>
            <Center top={titleTop}>
              <Words text={p.title} t={t} at={a + 0.35} exit={b} accent={p.accent} style={{...display, fontSize: i === 3 ? 80 : 68}} />
              <Words text={p.sub} t={t} at={a + 0.8} exit={b} style={{...body, fontSize: 44}} />
            </Center>
            {i === 3 ? <Certs t={t} k={certs * (1 - prog(t, s.exit, s.exit + 0.4, easeIn))} /> : null}
          </AbsoluteFill>
        );
      })}
    </>
  );
};

const Certs: React.FC<{t: number; k: number}> = ({k}) => {
  if (k <= 0) return null;
  const card = (src: string, x: number, r: number, label: string, delay: number) => {
    const kk = clamp01(k * 1.4 - delay);
    return (
      <div
        style={{
          position: 'absolute',
          left: x,
          top: 1420,
          width: 400,
          opacity: kk,
          transform: `translateY(${(1 - kk) * 80}px) rotate(${r * kk}deg)`,
        }}
      >
        <div style={{background: '#fff', padding: 10, borderRadius: 14, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', height: 250, overflow: 'hidden'}}>
          <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 30%'}} />
        </div>
        <div style={{...body, fontSize: 28, marginTop: 14, color: S.cream, direction: 'rtl'}}>{label}</div>
      </div>
    );
  };
  return (
    <>
      {card('sedra/cert1.jpg', W / 2 + 20, 3, 'دبلومة الطب الآمن والتكميلي', 0)}
      {card('sedra/cert2.jpg', W / 2 - 420, -3, 'العلاج بمنتجات ومصل النحل', 0.25)}
    </>
  );
};

const SERVICES = ['الحجامة النبوية', 'الحجامة النارية', 'الفوطة النارية', 'مصل النحل', 'الإبر الصينية', 'المساج'];

const Services: React.FC<{t: number}> = ({t}) => {
  const s = T.s8;
  if (t < s.enter - 0.1 || t > s.exit + 0.6) return null;
  const v = vis(t, s.enter, s.exit, 0.5, 0.45);
  const toHoney = prog(t, s.honey, s.honey + 0.8, easeInOut);
  return (
    <>
      <AbsoluteFill style={{opacity: v * (1 - toHoney)}}>
        <Sequence from={Math.round(s.enter * FPS)} durationInFrames={Math.round((s.honey - s.enter + 1) * FPS)} layout="none">
          <div style={{position: 'absolute', left: 0, top: 0, width: W, height: 1400, overflow: 'hidden'}}>
            <OffthreadVideo src={staticFile('sedra/fire.mp4')} muted style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.15) brightness(0.8)'}} />
            <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(7,23,53,0.5) 0%, rgba(7,23,53,0) 30%, ${S.navy} 100%)`}} />
          </div>
        </Sequence>
      </AbsoluteFill>
      <AbsoluteFill style={{opacity: v * toHoney}}>
        <Photo src="sedra/honey.jpg" t={t} from={s.honey} dur={s.exit - s.honey + 0.5} height={1400} focusY={40} fade={0.45} />
      </AbsoluteFill>
      <Center top={830} opacity={1 - toHoney}>
        <Words text="خدمات كاملة في مكان واحد" t={t} at={s.title} accent={['كاملة']} style={{...display, fontSize: 64}} />
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 18, marginTop: 36, direction: 'rtl', width: 920}}>
          {SERVICES.map((n, i) => (
            <Chip key={n} k={prog(t, s.chips[i], s.chips[i] + 0.5, easeOut)} color={S.cream} fill="rgba(7,23,53,0.6)" size={40}>
              {n}
            </Chip>
          ))}
        </div>
      </Center>
      <Center top={1050}>
        <Words text="ومنتجات طبيعية من خير النحل" t={t} at={s.honeyText} exit={s.exit} accent={['طبيعية']} style={{...display, fontSize: 62}} />
      </Center>
    </>
  );
};

const CONTRA = ['الأنيميا', 'أدوية السيولة', 'أمراض القلب والكلى والكبد', 'منظم ضربات القلب'];

const Safety: React.FC<{t: number}> = ({t}) => {
  const s = T.s9;
  if (t < s.enter - 0.1 || t > s.exit + 0.6) return null;
  const o = 1 - prog(t, s.exit, s.exit + 0.4, easeIn);
  return (
    <>
      <Center top={340}>
        <Words text="الحجامة مش مناسبة" t={t} at={s.title} exit={s.exit} style={{...display, fontSize: 90}} />
        <Words text="لكل الناس" t={t} at={s.title + 0.3} exit={s.exit} style={{...display, fontSize: 112, color: S.orange}} />
        <div style={{...body, fontSize: 38, marginTop: 10, opacity: prog(t, s.items[0] - 0.4, s.items[0], easeOut) * o, direction: 'rtl'}}>
          لازم استشارة قبلها لأصحاب:
        </div>
      </Center>
      <div style={{position: 'absolute', left: PAD + 60, right: PAD + 60, top: 740, direction: 'rtl'}}>
        {CONTRA.map((c, i) => {
          const k = prog(t, s.items[i], s.items[i] + 0.6, easeOut) * o;
          return (
            <div
              key={c}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 26,
                padding: '22px 34px 28px',
                marginBottom: 18,
                borderRadius: 22,
                background: S.glass,
                border: `2px solid ${S.line}`,
                opacity: k,
                transform: `translateX(${(1 - k) * 60}px)`,
              }}
            >
              <div style={{width: 18, height: 18, borderRadius: 9, background: S.orange, flexShrink: 0}} />
              <div style={{fontFamily: SF.ar, fontWeight: 700, fontSize: 50, color: S.cream}}>{c}</div>
            </div>
          );
        })}
      </div>
      <Center top={1400}>
        <Words text="وعشان كده… بنسأل قبل ما نبدأ" t={t} at={s.tail} exit={s.exit} accent={['بنسأل']} style={{...display, fontSize: 62}} />
        <div style={{height: 18}} />
        <Source k={prog(t, s.note, s.note + 0.6, easeOut) * o}>الحجامة لا تغني عن استشارة الطبيب</Source>
      </Center>
    </>
  );
};

const Cta: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const s = T.s10;
  if (t < s.label - 0.1) return null;
  const daysOut = prog(t, s.cta - 0.5, s.cta, easeIn);
  const logo = sp(frame, s.cta, {damping: 12, stiffness: 160});
  return (
    <>
      <Center top={560} opacity={1 - daysOut}>
        <Words text="الأيام المستحبة للحجامة" t={t} at={s.label} style={{...display, fontSize: 70, color: S.creamDim}} />
        <div style={{display: 'flex', gap: 34, marginTop: 50, direction: 'rtl'}}>
          {['١٧', '١٩', '٢١'].map((d, i) => {
            const k = sp(frame, s.days[i], {damping: 10, stiffness: 220, mass: 0.7});
            return (
              <div
                key={d}
                style={{
                  width: 240,
                  height: 270,
                  borderRadius: 34,
                  background: S.cream,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scale(${k}) rotate(${(1 - k) * 8}deg)`,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                }}
              >
                <div style={{fontFamily: SF.ar, fontWeight: 900, fontSize: 140, color: S.orange, lineHeight: 1.1}}>{d}</div>
              </div>
            );
          })}
        </div>
        <Words text="من كل شهر هجري" t={t} at={s.month} style={{...display, fontSize: 64, marginTop: 40}} />
      </Center>
      <Center top={380} opacity={clamp01(logo * 2)}>
        <div style={{transform: `scale(${0.7 + 0.3 * logo})`}}>
          <Logo size={300} />
        </div>
      </Center>
      <Center top={760}>
        <Words text="احجز مكانك دلوقتي" t={t} at={s.cta + 0.15} accent={['دلوقتي']} style={{...display, fontSize: 100}} />
      </Center>
      <Center top={960} opacity={prog(t, s.phone, s.phone + 0.6, easeOut)}>
        <div
          style={{
            fontFamily: SF.ar,
            fontWeight: 900,
            fontSize: 104,
            color: S.navy,
            background: S.orange,
            borderRadius: 30,
            padding: '6px 50px 18px',
            letterSpacing: '0.02em',
            direction: 'ltr',
            transform: `scale(${0.9 + 0.1 * prog(t, s.phone, s.phone + 0.6, easeOut)})`,
          }}
        >
          01148470010
        </div>
      </Center>
      <Center top={1170} opacity={prog(t, s.wa, s.wa + 0.6, easeOut)}>
        <Chip k={prog(t, s.wa, s.wa + 0.6, easeOut)} color="#3DDC84" fill="rgba(61,220,132,0.12)" size={42}>
          اتصال أو واتساب
        </Chip>
      </Center>
      <Center top={1310} opacity={prog(t, s.addr, s.addr + 0.6, easeOut)}>
        <div style={{...body, fontSize: 40, direction: 'rtl', lineHeight: 1.5}}>
          زفتى · شارع الجيش · كوبري المصرف
          <br />
          بجوار سوبر ماركت بشرة خير
        </div>
      </Center>
    </>
  );
};

export const SedraAd: React.FC = () => {
  useSedraFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cup = cupState(t, frame);
  const warm = prog(t, T.s2.dirty, T.s2.big[1], easeOut) * (1 - prog(t, T.s3.clean, T.s3.clean + 0.8, easeOut)) + prog(t, T.s6.rise, T.s6.hit, easeIn) * (1 - prog(t, T.s6.exit, T.s6.exit + 1, easeOut));
  return (
    <AbsoluteFill style={{background: S.navy, overflow: 'hidden'}}>
      <SedraBackground t={t} warm={clamp01(warm)} />
      {cup.opacity > 0.001 ? (
        <div style={{position: 'absolute', left: W / 2 - cup.size / 2, top: cup.y - cup.size * 0.6, opacity: cup.opacity}}>
          <Cup size={cup.size} t={t} dirty={cup.dirty} shine={cup.shine} glow={cup.glow} />
        </div>
      ) : null}
      <Hook t={t} />
      <Risk t={t} />
      <Pivot t={t} />
      <Sunnah t={t} />
      <Science t={t} />
      <Reveal t={t} frame={frame} />
      <Pillars t={t} />
      <Services t={t} />
      <Safety t={t} />
      <Cta t={t} frame={frame} />
      <Grain frame={frame} opacity={0.07} />
    </AbsoluteFill>
  );
};

export const SEDRA_DURATION = Math.round(T.duration * FPS);
export {W as SEDRA_W, H as SEDRA_H};
