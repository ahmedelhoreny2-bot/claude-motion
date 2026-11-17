import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {clamp01, easeOut, prog, sp} from '../lib';
import {Grain} from '../components/primitives';
import {N, NF, NFPS, NH, NT, NW, RAINBOW, WIPES} from './theme';
import {
  BlurBg,
  Card,
  ChatIcon,
  CheckDot,
  ClockIcon,
  Confetti,
  Iris,
  PhoneIcon,
  Pill,
  PinIcon,
  popStyle,
  SunIcon,
  SunsetIcon,
} from './ui';
import {useArabicFonts} from './useArabicFonts';

const POP = {damping: 11, stiffness: 210, mass: 0.7};
const SETTLE = {damping: 14, stiffness: 140, mass: 0.8};
const s = (f: number, at: number, cfg = POP) => sp(f, at, cfg, NFPS);

const Center: React.FC<{y: number; children: React.ReactNode; style?: React.CSSProperties}> = ({y, children, style}) => (
  <div style={{position: 'absolute', top: y, left: 0, width: NW, display: 'flex', justifyContent: 'center', ...style}}>
    {children}
  </div>
);

const Header: React.FC<{k: number; color: string; children: React.ReactNode; light?: boolean}> = ({k, color, children, light}) => (
  <div style={{...popStyle(k, 0, 0, 30), direction: 'rtl', textAlign: 'center'}}>
    <div
      style={{
        fontFamily: NF.display,
        fontSize: 100,
        lineHeight: 1.2,
        color: light ? N.white : N.navy,
        textShadow: light ? '0 6px 24px rgba(0,0,0,0.45)' : 'none',
      }}
    >
      {children}
    </div>
    <div
      style={{
        height: 14,
        width: 300 * clamp01(k),
        margin: '4px auto 0',
        borderRadius: 7,
        background: color,
      }}
    />
  </div>
);

/** Small round logo badge that rides in the corner through the middle scenes. */
const Badge: React.FC<{t: number}> = ({t}) => {
  const k = prog(t, NT.s3.start, NT.s3.start + 0.5, easeOut) * (1 - prog(t, NT.s7.exit, NT.s7.exit + 0.3));
  if (k <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 70,
        left: 64,
        width: 150,
        height: 150,
        borderRadius: 75,
        overflow: 'hidden',
        border: `7px solid ${N.white}`,
        boxShadow: `0 10px 30px ${N.shadow}`,
        opacity: k,
        transform: `scale(${0.7 + 0.3 * k})`,
        background: N.white,
      }}
    >
      <Img src={staticFile('nursery/logo.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 0%', transform: 'scale(2.3)', transformOrigin: '50% 4%'}} />
    </div>
  );
};

/** Bottom booking strip through the middle scenes, so every frame carries the number. */
const BookingStrip: React.FC<{t: number}> = ({t}) => {
  const k = prog(t, NT.s3.items[0], NT.s3.items[0] + 0.6, easeOut) * (1 - prog(t, NT.s7.exit, NT.s7.exit + 0.3));
  if (k <= 0) return null;
  return (
    <Center y={NH - 150 + (1 - k) * 60} style={{opacity: k}}>
      <Pill bg={N.navy} size={44} font="body" icon={<PhoneIcon size={40} color={N.yellow} />}>
        للحجز: <span style={{fontFamily: NF.display, direction: 'ltr', unicodeBidi: 'isolate'}}>01146592360</span>
      </Pill>
    </Center>
  );
};

// ---------- scenes ----------

const S1Hook: React.FC<{f: number; t: number}> = ({f, t}) => {
  const a = NT.s1;
  return (
    <AbsoluteFill>
      <OffthreadVideo src={staticFile('nursery/clip1.mp4')} muted style={{width: NW, height: NH, objectFit: 'cover', transform: `scale(${1.04 + t * 0.008})`}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(23,43,87,0.72) 0%, rgba(23,43,87,0.15) 40%, rgba(0,0,0,0) 60%)'}} />
      <Center y={150}>
        <div style={popStyle(s(f, a.l1), 0, -3)}>
          <Pill bg={N.yellow} color={N.navy} size={70}>نفسك ابنك...</Pill>
        </div>
      </Center>
      <Center y={290}>
        <div
          style={{
            ...popStyle(s(f, a.l2, SETTLE), 0, 0, 60),
            fontFamily: NF.display,
            fontSize: 132,
            color: N.white,
            direction: 'rtl',
            textShadow: '0 8px 30px rgba(0,0,0,0.5)',
            lineHeight: 1.15,
          }}
        >
          يتعلّم وهو بيلعب؟
        </div>
      </Center>
      <Center y={470}>
        <div style={popStyle(s(f, a.l3), 0, 2)}>
          <Pill bg={N.pink} size={66}>ويكبر بشخصية قوية</Pill>
        </div>
      </Center>
    </AbsoluteFill>
  );
};

const S2Brand: React.FC<{f: number; t: number}> = ({f, t}) => {
  const a = NT.s2;
  const logo = s(f, a.logo, {damping: 8, stiffness: 200, mass: 0.8});
  const chips = ['بنبني عقل', 'بنزرع قيمة', 'بنصنع شخصية'];
  return (
    <AbsoluteFill>
      <Confetti t={t} seed={2} />
      <Center y={170}>
        <div style={{opacity: clamp01(logo * 2), transform: `scale(${0.3 + 0.7 * logo}) rotate(${(1 - logo) * -8 + Math.sin(t * 1.4) * 0.8}deg)`}}>
          <Card src="nursery/logo.jpg" w={700} h={626} border={16} />
        </div>
      </Center>
      <Center y={880}>
        <div style={{...popStyle(s(f, a.tag, SETTLE)), fontFamily: NF.display, fontSize: 100, color: N.blue, direction: 'rtl'}}>
          هدفنا عقول مستنيرة
        </div>
      </Center>
      <Center y={1060}>
        <div style={{...popStyle(s(f, a.notJust, SETTLE)), fontFamily: NF.body, fontWeight: 800, fontSize: 64, color: N.navy, direction: 'rtl'}}>
          مش مجرد حضانة.. إحنا
        </div>
      </Center>
      {chips.map((c, i) => (
        <Center key={c} y={1210 + i * 150}>
          <div style={popStyle(s(f, a.chips[i]), 0, i % 2 ? 2 : -2)}>
            <Pill bg={[N.green, N.orange, N.pink][i]} size={74}>{c}</Pill>
          </div>
        </Center>
      ))}
    </AbsoluteFill>
  );
};

const ListScene: React.FC<{
  f: number;
  t: number;
  beat: {start: number; head: number; card: number; items: number[]};
  title: string;
  color: string;
  items: string[];
  cols: number;
  card: React.ReactNode;
  bg: string;
}> = ({f, t, beat, title, color, items, cols, card, bg}) => {
  const ck = s(f, beat.card, SETTLE);
  const rowH = items.length > 5 ? 116 : 132;
  const top = items.length > 5 ? 975 : 1010;
  return (
    <AbsoluteFill>
      <BlurBg src={bg} t={t} tint="rgba(255,246,230,0.82)" />
      <Center y={260}>
        <Header k={s(f, beat.head, SETTLE)} color={color}>{title}</Header>
      </Center>
      <Center y={440}>
        <div style={{opacity: clamp01(ck * 2), transform: `translateY(${(1 - ck) * 120}px) rotate(${-1.5 + (1 - ck) * -4}deg)`}}>{card}</div>
      </Center>
      {items.map((it, i) => {
        const col = cols === 1 ? 0 : i % cols;
        const row = cols === 1 ? i : Math.floor(i / cols);
        const x = cols === 1 ? NW / 2 : col === 0 ? NW * 0.72 : NW * 0.28;
        return (
          <div
            key={it}
            style={{position: 'absolute', top: top + row * rowH, left: x, transform: 'translateX(-50%)'}}
          >
            <div style={popStyle(s(f, beat.items[i]), 0, i % 2 ? 1.5 : -1.5, 30)}>
              <Pill bg={RAINBOW[i % RAINBOW.length]} size={cols === 1 ? 58 : 60} font="body" icon={<CheckDot size={cols === 1 ? 50 : 52} bg={RAINBOW[i % RAINBOW.length]} />}>
                {it}
              </Pill>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const S3Learn: React.FC<{f: number; t: number}> = ({f, t}) => {
  const a = NT.s3;
  const swap = prog(t, a.swap, a.swap + 0.5);
  return (
    <ListScene
      f={f}
      t={t}
      beat={a}
      title="تأسيس تعليمي متكامل"
      color={N.blue}
      cols={1}
      bg="nursery/class.jpg"
      items={['منهج منّة الرحمن', 'عربي.. قراءة وكتابة', 'حساب و Math', 'English', 'UCMAS للحساب الذهني']}
      card={
        <div style={{position: 'relative', width: 960, height: 540}}>
          <Card src="nursery/clip2.mp4" video w={960} h={540} />
          <div style={{position: 'absolute', inset: 0, opacity: swap}}>
            <Card src="nursery/class.jpg" w={960} h={540} pos="50% 40%" zoom={1 + (t - a.swap) * 0.012} />
          </div>
        </div>
      }
    />
  );
};

const S4Values: React.FC<{f: number; t: number}> = ({f, t}) => (
  <ListScene
    f={f}
    t={t}
    beat={NT.s4}
    title="تربية دينية وأخلاقية"
    color={N.green}
    cols={1}
    bg="nursery/uniform.jpg"
    items={['القرآن الكريم', 'الأذكار', 'السيرة النبوية', 'العقيدة', 'الأحاديث النبوية', 'الآداب الإسلامية']}
    card={<Card src="nursery/uniform.jpg" w={960} h={500} zoom={1.02 + (t - NT.s4.card) * 0.01} />}
  />
);

const S5Thursday: React.FC<{f: number; t: number}> = ({f, t}) => {
  const a = NT.s5;
  const lt = t - a.start;
  const rOut = prog(t, a.play - 0.25, a.play);
  const collage = t >= a.collage;
  const polas = [
    {src: 'nursery/facepaint.jpg', w: 960, h: 422, x: 60, y: 260, r: -3},
    {src: 'nursery/bunny.jpg', w: 480, h: 498, x: 545, y: 770, r: 4},
    {src: 'nursery/group.jpg', w: 480, h: 480, x: 70, y: 820, r: -4},
  ];
  return (
    <AbsoluteFill>
      {!collage ? (
        <>
          <Sequence from={0} layout="none">
            <OffthreadVideo src={staticFile('nursery/clip3.mp4')} muted style={{width: NW, height: NH, objectFit: 'cover', transform: `scale(${1.03 + lt * 0.008})`}} />
          </Sequence>
          <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(23,43,87,0.7) 0%, rgba(23,43,87,0.1) 38%, rgba(0,0,0,0) 55%)'}} />
          <Center y={150}>
            <div style={popStyle(s(f, a.day), 0, -3)}>
              <Pill bg={N.yellow} color={N.navy} size={92}>كل يوم خميس</Pill>
            </div>
          </Center>
          <Center y={330}>
            <div style={{...popStyle(s(f, a.recite, SETTLE), rOut), fontFamily: NF.display, fontSize: 96, color: N.white, direction: 'rtl', textShadow: '0 8px 30px rgba(0,0,0,0.5)', textAlign: 'center', lineHeight: 1.2}}>
              تسميع ومراجعة
              <div style={{fontFamily: NF.body, fontWeight: 700, fontSize: 52}}>لكل اللي اتعلموه في الأسبوع</div>
            </div>
          </Center>
          <Center y={330}>
            <div style={popStyle(s(f, a.play), 0, 2)}>
              <Pill bg={N.pink} size={82}>وبعدها.. لعب ومرح ومسابقات!</Pill>
            </div>
          </Center>
        </>
      ) : (
        <>
          <Confetti t={t} seed={5} />
          {polas.map((p, i) => {
            const k = s(f, a.polas[i]);
            return (
              <div key={p.src} style={{position: 'absolute', left: p.x, top: p.y, ...popStyle(k, 0, 0, 80), rotate: `${p.r + Math.sin(t * 1.1 + i) * 0.6}deg`}}>
                <Card src={p.src} w={p.w} h={p.h} border={16} />
              </div>
            );
          })}
          <Center y={1430}>
            <div style={{...popStyle(s(f, a.line, SETTLE)), fontFamily: NF.display, fontSize: 104, color: N.navy, direction: 'rtl', textAlign: 'center', lineHeight: 1.15}}>
              بنتعلّم.. <span style={{color: N.pink}}>وبنلعب كمان!</span>
            </div>
          </Center>
        </>
      )}
    </AbsoluteFill>
  );
};

const Shift: React.FC<{k: number; bg: string; icon: React.ReactNode; name: string; time: string; rot: number}> = ({k, bg, icon, name, time, rot}) => (
  <div
    style={{
      ...popStyle(k, 0, rot, 80),
      width: 900,
      direction: 'rtl',
      background: N.white,
      borderRadius: 48,
      padding: '40px 50px',
      boxShadow: `0 16px 0 ${bg}, 0 30px 60px ${N.shadow}`,
      display: 'flex',
      alignItems: 'center',
      gap: 40,
      boxSizing: 'border-box',
    }}
  >
    <div style={{width: 170, height: 170, borderRadius: 85, background: `${bg}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{icon}</div>
    <div>
      <div style={{fontFamily: NF.display, fontSize: 80, color: bg, lineHeight: 1.2}}>{name}</div>
      <div style={{fontFamily: NF.body, fontWeight: 800, fontSize: 58, color: N.navy, lineHeight: 1.3}}>{time}</div>
    </div>
  </div>
);

const S6Hours: React.FC<{f: number; t: number}> = ({f, t}) => {
  const a = NT.s6;
  return (
    <AbsoluteFill>
      <Confetti t={t} seed={6} />
      <Center y={330}>
        <div style={{...popStyle(s(f, a.head, SETTLE), 0, 0, 30)}}>
          <ClockIcon size={170} t={t} />
        </div>
      </Center>
      <Center y={540}>
        <Header k={s(f, a.head + 0.1, SETTLE)} color={N.orange}>مواعيد الأكاديمية</Header>
      </Center>
      <Center y={850}>
        <Shift k={s(f, a.am, SETTLE)} bg={N.orange} rot={-1.5} icon={<SunIcon size={130} />} name="الفترة الصباحية" time="من 8 صباحًا لـ 1 ظهرًا" />
      </Center>
      <Center y={1260}>
        <Shift k={s(f, a.pm, SETTLE)} bg={N.pink} rot={1.5} icon={<SunsetIcon size={130} />} name="الفترة المسائية" time="من 11 صباحًا لـ 4 عصرًا" />
      </Center>
    </AbsoluteFill>
  );
};

const S7Why: React.FC<{f: number; t: number}> = ({f, t}) => {
  const a = NT.s7;
  const lt = t - a.start;
  const items = ['تأسيس قوي', 'تعليم متنوع', 'تربية دينية', 'متابعة أسبوعية', 'أنشطة ترفيهية'];
  return (
    <AbsoluteFill>
      <Img src={staticFile('nursery/group.jpg')} style={{width: NW, height: NH, objectFit: 'cover', objectPosition: '50% 40%', transform: `scale(${1.05 + lt * 0.01})`}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(23,43,87,0.78) 0%, rgba(23,43,87,0.35) 30%, rgba(23,43,87,0.35) 45%, rgba(23,43,87,0.88) 70%)'}} />
      <Center y={300}>
        <Header k={s(f, a.head, SETTLE)} color={N.yellow} light>ليه الملاك الصغير؟</Header>
      </Center>
      {items.map((it, i) => (
        <Center key={it} y={930 + i * 140}>
          <div style={popStyle(s(f, a.items[i]), 0, i % 2 ? 1.5 : -1.5)}>
            <Pill bg={RAINBOW[i]} size={66}>{i > 0 ? '+ ' : ''}{it}</Pill>
          </div>
        </Center>
      ))}
    </AbsoluteFill>
  );
};

const S8Cta: React.FC<{f: number; t: number}> = ({f, t}) => {
  const a = NT.s8;
  const logo = s(f, a.logo, SETTLE);
  const breathe = (at: number) => 1 + 0.025 * Math.sin((t - at) * 4) * clamp01(t - at - 0.6);
  return (
    <AbsoluteFill>
      <Confetti t={t} seed={8} count={30} />
      <Center y={120}>
        <div style={{opacity: clamp01(logo * 2), transform: `scale(${0.5 + 0.5 * logo}) rotate(${Math.sin(t * 1.3) * 0.8}deg)`}}>
          <Card src="nursery/logo.jpg" w={560} h={502} border={14} />
        </div>
      </Center>
      <Center y={690}>
        <div style={{...popStyle(s(f, a.cta, SETTLE)), fontFamily: NF.display, fontSize: 104, color: N.navy, direction: 'rtl'}}>
          احجز مكان ابنك <span style={{color: N.pink}}>دلوقتي!</span>
        </div>
      </Center>
      <Center y={880}>
        <div style={{...popStyle(s(f, a.phone)), scale: `${breathe(a.phone)}`}}>
          <Pill bg={N.blue} size={92} icon={<PhoneIcon size={84} />}>
            <span style={{direction: 'ltr', unicodeBidi: 'isolate'}}>01146592360</span>
          </Pill>
        </div>
      </Center>
      <Center y={1065}>
        <div style={{...popStyle(s(f, a.wa)), scale: `${breathe(a.wa + 0.3)}`}}>
          <Pill bg={N.green} size={92} icon={<ChatIcon size={84} />}>
            <span style={{direction: 'ltr', unicodeBidi: 'isolate'}}>01224562915</span>
          </Pill>
        </div>
      </Center>
      <Center y={1275}>
        <div style={{...popStyle(s(f, a.addr, SETTLE)), direction: 'rtl', display: 'flex', alignItems: 'center', gap: 22, background: N.white, borderRadius: 40, padding: '24px 40px', boxShadow: `0 16px 40px ${N.shadow}`}}>
          <PinIcon size={96} />
          <div>
            <div style={{fontFamily: NF.display, fontSize: 64, color: N.navy, lineHeight: 1.2}}>زفتى – الحي البحري</div>
            <div style={{fontFamily: NF.body, fontWeight: 700, fontSize: 40, color: N.navy, opacity: 0.8, lineHeight: 1.3}}>خلف كافيه رايقة – فوق كافيه زجزاج</div>
          </div>
        </div>
      </Center>
      <Center y={1555}>
        <div style={{...popStyle(s(f, a.slogan, SETTLE)), direction: 'rtl', textAlign: 'center'}}>
          <div style={{fontFamily: NF.display, fontSize: 92, color: N.pink, lineHeight: 1.2}}>بداية صغيرة.. لمستقبل كبير!</div>
          <div style={{fontFamily: NF.body, fontWeight: 800, fontSize: 48, color: N.blue, marginTop: 6}}>أكاديمية الملاك الصغير • هدفنا عقول مستنيرة</div>
        </div>
      </Center>
    </AbsoluteFill>
  );
};

const SCENES: {start: number; C: React.FC<{f: number; t: number}>}[] = [
  {start: NT.s1.start, C: S1Hook},
  {start: NT.s2.start, C: S2Brand},
  {start: NT.s3.start, C: S3Learn},
  {start: NT.s4.start, C: S4Values},
  {start: NT.s5.start, C: S5Thursday},
  {start: NT.s6.start, C: S6Hours},
  {start: NT.s7.start, C: S7Why},
  {start: NT.s8.start, C: S8Cta},
];

export const NurseryAd: React.FC = () => {
  useArabicFonts();
  const f = useCurrentFrame();
  const t = f / NFPS;
  return (
    <AbsoluteFill style={{background: N.cream}}>
      {SCENES.map(({start, C}, i) => {
        const from = Math.round(start * NFPS);
        const end = i + 1 < SCENES.length ? Math.round(SCENES[i + 1].start * NFPS) : Math.round(NT.duration * NFPS);
        return (
          <Sequence key={i} from={from} durationInFrames={end - from}>
            <C f={f} t={t} />
          </Sequence>
        );
      })}
      <Badge t={t} />
      <BookingStrip t={t} />
      <Iris t={t} starts={WIPES} />
      <Grain frame={f} opacity={0.05} />
    </AbsoluteFill>
  );
};
