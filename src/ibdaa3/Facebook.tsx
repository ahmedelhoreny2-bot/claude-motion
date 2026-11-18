import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {Bars, FONT, img, P, Paper, useArabicFonts} from '../ibdaa/kit';
import {Logo} from '../ibdaa/scenes';

const txt = (size: number, color: string = P.ink, weight = 900): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: size,
  fontWeight: weight,
  color,
  lineHeight: 1.3,
  whiteSpace: 'nowrap',
});

/** Facebook profile picture, 1080×1080. Everything sits inside the centre circle Facebook crops to. */
export const IbdaaProfile: React.FC<{variant?: 'light' | 'orange'}> = ({variant = 'light'}) => {
  useArabicFonts();
  const orange = variant === 'orange';
  return (
    <AbsoluteFill style={{background: orange ? P.orange : P.cream, alignItems: 'center', justifyContent: 'center'}}>
      {orange ? (
        <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(255,255,255,0.16) 3px, transparent 3.4px)', backgroundSize: '54px 54px'}} />
      ) : (
        <Paper t={0} />
      )}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 34, paddingTop: 30}}>
        <Logo
          size={orange ? 360 : 320}
          triColor={orange ? P.white : P.orange}
          colors={orange ? [P.white, P.ink, P.white] : [P.teal, P.orange, P.teal]}
        />
        <div style={{display: 'flex', gap: 26, direction: 'rtl'}}>
          <span style={txt(orange ? 128 : 114, orange ? P.white : P.ink)}>إبداع</span>
          <span style={txt(orange ? 128 : 114, orange ? P.ink : P.orange)}>بيتحرك</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Card: React.FC<{src: string; w: number; rot: number; x: number; y: number}> = ({src, w, rot, x, y}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      padding: w * 0.03,
      background: P.white,
      borderRadius: w * 0.07,
      boxShadow: `0 ${w * 0.06}px ${w * 0.14}px rgba(60,40,20,0.25)`,
      transform: `rotate(${rot}deg)`,
    }}
  >
    <Img src={img(src)} style={{width: '100%', display: 'block', borderRadius: w * 0.05}} />
  </div>
);

const CHIPS = ['موشن جرافيك', 'إعلانات', 'تصميمات سوشيال', 'هوية بصرية'];

/** Facebook page cover, 1640×624. Key content in the centre 1100 px (mobile crop); bottom-left kept quiet for the profile picture. */
export const IbdaaFbCover: React.FC = () => {
  useArabicFonts();
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Paper t={0} />
      {/* edges: the work, cropped away on mobile */}
      <div style={{position: 'absolute', right: -60, top: 0, bottom: 0, width: 330, background: P.orange, transform: 'skewX(-8deg)'}} />
      <Card src="posters/p03.jpg" w={190} rot={8} x={1430} y={60} />
      <Card src="posters/p05.jpg" w={160} rot={-6} x={1330} y={300} />
      <div style={{position: 'absolute', left: 40, top: 70}}>
        <Bars w={190} k={[1, 1, 1]} thick={22} gap={18} />
      </div>
      <Card src="posters/p01.jpg" w={150} rot={-9} x={60} y={190} />
      {/* centre */}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', direction: 'rtl', gap: 8, paddingBottom: 10}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
          <span style={txt(46)}>إبداع</span>
          <span style={txt(46, P.orange)}>بيتحرك</span>
          <Logo size={56} />
        </div>
        <span style={{...txt(72, P.ink), lineHeight: 1.2}}>فكرتك على الشاشة…</span>
        <span style={{...txt(82, P.white), lineHeight: 1.25, background: P.orange, borderRadius: 22, padding: '0 30px 10px', boxShadow: '0 12px 30px rgba(229,71,15,0.3)'}}>بتتحرك وتبيع</span>
        <div style={{display: 'flex', gap: 14, marginTop: 10}}>
          {CHIPS.map((c) => (
            <span key={c} style={{...txt(24, P.teal, 700), border: `3px solid ${P.teal}`, borderRadius: 40, padding: '2px 18px 8px'}}>
              {c}
            </span>
          ))}
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 14}}>
          <span style={txt(30, P.inkSoft, 700)}>فيديوهات تبدأ من</span>
          <span style={{...txt(40, P.orange, 900), direction: 'ltr'}}>300</span>
          <span style={txt(30, P.inkSoft, 700)}>جنيه · واتساب</span>
          <span style={{...txt(32, P.ink, 900), direction: 'ltr'}}>01130808848</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * Facebook page cover v2, 1640×624: the old cover's calm layout in the light identity.
 * Content sits in the upper middle; the bottom band (profile picture on desktop and mobile) stays empty.
 */
export const IbdaaFbCover2: React.FC = () => {
  useArabicFonts();
  const chips = ['موشن جرافيك', 'Vox', 'HUD', 'أخبار عاجلة', 'جيمنج', 'ذكاء اصطناعي'];
  const bar = (w: number, c: string) => <div style={{width: w, height: 24, borderRadius: 24, background: c}} />;
  return (
    <AbsoluteFill style={{background: P.cream, overflow: 'hidden'}}>
      <AbsoluteFill style={{backgroundImage: `radial-gradient(${P.inkFaint} 1.6px, transparent 1.8px)`, backgroundSize: '34px 34px', opacity: 0.55}} />
      <AbsoluteFill style={{background: 'radial-gradient(70% 90% at 50% 25%, rgba(255,255,255,0.55), transparent 70%)'}} />
      {/* headline */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 118, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 26, direction: 'rtl'}}>
        <span style={txt(58, P.ink)}>فكرتك على الشاشة…</span>
        <span style={txt(58, P.orange)}>بتتحرك وتبيع</span>
      </div>
      {/* services */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 240, display: 'flex', justifyContent: 'center', gap: 12, direction: 'rtl'}}>
        {chips.map((c) => (
          <span key={c} style={{...txt(22, P.teal, 700), lineHeight: 1.2, border: `3px solid ${P.teal}`, borderRadius: 40, padding: '6px 20px 10px', background: 'rgba(255,253,248,0.6)'}}>
            {c}
          </span>
        ))}
      </div>
      {/* the logo's speed bars, as on the original cover */}
      <div style={{position: 'absolute', left: 170, top: 380, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'flex-start'}}>
        {bar(200, P.teal)}
        {bar(130, P.orange)}
      </div>
      <div style={{position: 'absolute', right: 170, top: 380, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'flex-end'}}>
        {bar(130, P.orange)}
        {bar(200, P.teal)}
      </div>
    </AbsoluteFill>
  );
};

/**
 * Facebook page cover v3, 1640×624, laid out for the new mobile profile view:
 * mobile shows only x 303–1337, puts icons over the top band and the round profile picture
 * over the lower centre (x ≈ 580–1060 from y ≈ 260). So the headline and services sit in a
 * band from y ≈ 120 to 250, and the speed bars stay on the visible sides.
 */
export const IbdaaFbCover3: React.FC<{dark?: boolean}> = ({dark = false}) => {
  useArabicFonts();
  const bg = dark ? '#111111' : P.cream;
  const ink = dark ? P.cream : P.ink;
  const chips = ['موشن جرافيك', 'Vox', 'HUD', 'أخبار عاجلة', 'جيمنج', 'ذكاء اصطناعي'];
  const bar = (w: number, c: string) => <div style={{width: w, height: 20, borderRadius: 20, background: c}} />;
  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{backgroundImage: `radial-gradient(${dark ? 'rgba(244,241,234,0.08)' : P.inkFaint} 1.6px, transparent 1.8px)`, backgroundSize: '34px 34px', opacity: 0.6}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 122, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 18, direction: 'rtl'}}>
        <span style={txt(46, ink)}>فكرتك على الشاشة…</span>
        <span style={txt(46, P.orange)}>بتتحرك وتبيع</span>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 202, display: 'flex', justifyContent: 'center', gap: 10, direction: 'rtl'}}>
        {chips.map((c) => (
          <span key={c} style={{...txt(20, P.teal, 700), lineHeight: 1.2, border: `2.5px solid ${P.teal}`, borderRadius: 40, padding: '5px 18px 8px'}}>
            {c}
          </span>
        ))}
      </div>
      <div style={{position: 'absolute', left: 330, top: 335, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start'}}>
        {bar(200, P.teal)}
        {bar(130, P.orange)}
      </div>
      <div style={{position: 'absolute', right: 330, top: 335, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-end'}}>
        {bar(130, P.orange)}
        {bar(200, P.teal)}
      </div>
    </AbsoluteFill>
  );
};
