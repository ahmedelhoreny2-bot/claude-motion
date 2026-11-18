import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {Bars, FONT, img, P, Paper, Tri, useArabicFonts, useFrameBox} from '../ibdaa/kit';
import {Logo} from '../ibdaa/scenes';

const txt = (size: number, color: string = P.ink, weight = 900): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: size,
  fontWeight: weight,
  color,
  lineHeight: 1.3,
  whiteSpace: 'nowrap',
});

const Card: React.FC<{src: string; w: number; rot: number; x: number; y: number; ratio?: number; z?: number}> = ({src, w, rot, x, y, ratio, z = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: x - w / 2,
      top: y,
      width: w,
      padding: w * 0.025,
      background: P.white,
      borderRadius: w * 0.06,
      boxShadow: `0 ${w * 0.06}px ${w * 0.14}px rgba(60,40,20,0.28)`,
      transform: `rotate(${rot}deg)`,
      zIndex: z,
    }}
  >
    <Img src={img(src)} style={{width: '100%', height: ratio ? w * ratio : undefined, objectFit: 'cover', display: 'block', borderRadius: w * 0.045}} />
  </div>
);

/** Video cover: the hook's promise, the work in a phone, the price as a sticker. */
export const IbdaaCover: React.FC = () => {
  useArabicFonts();
  const {W, H, tall} = useFrameBox();
  const s = W / 1080;
  const phoneW = (tall ? 460 : 350) * s;
  const stageY = H * (tall ? 0.43 : 0.4);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Paper t={0} />
      {/* orange torn band behind the work */}
      <div
        style={{
          position: 'absolute',
          left: -40 * s,
          right: -40 * s,
          top: stageY + phoneW * 0.25,
          height: phoneW * 1.15,
          background: P.orange,
          transform: 'rotate(-6deg)',
          clipPath:
            'polygon(0% 6%, 6% 2%, 13% 5%, 21% 1%, 30% 4%, 39% 0%, 48% 4%, 57% 1%, 66% 5%, 75% 1%, 84% 4%, 92% 0%, 100% 3%, 100% 96%, 93% 99%, 85% 95%, 76% 100%, 67% 96%, 58% 99%, 48% 95%, 39% 100%, 30% 96%, 21% 99%, 12% 95%, 5% 99%, 0% 95%)',
        }}
      />
      <div style={{position: 'absolute', left: 50 * s, top: stageY + phoneW * 0.42, transform: 'rotate(-6deg)'}}>
        <Bars w={260 * s} k={[1, 1, 1]} thick={24 * s} gap={20 * s} colors={[P.white, P.ink, P.white]} />
      </div>
      {/* the work */}
      <Card src="posters/p01.jpg" w={290 * s} rot={-11} x={W * 0.19} y={stageY + 50 * s} />
      <Card src="posters/p03.jpg" w={300 * s} rot={10} x={W * 0.8} y={stageY + 30 * s} />
      <Card src="posters/p05.jpg" w={220 * s} rot={-5} x={W * 0.85} y={stageY + 380 * s} z={2} />
      <div
        style={{
          position: 'absolute',
          left: W / 2 - phoneW / 2 - 14 * s,
          top: stageY - 40 * s,
          width: phoneW + 28 * s,
          padding: 14 * s,
          borderRadius: 66 * s,
          background: P.ink,
          transform: 'rotate(-4deg)',
          boxShadow: '0 40px 90px rgba(60,30,10,0.45)',
          zIndex: 3,
        }}
      >
        <div style={{width: phoneW, height: phoneW * 1.78, borderRadius: 54 * s, overflow: 'hidden', position: 'relative'}}>
          <Img src={img('stills/b03.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          <div style={{position: 'absolute', left: '50%', top: '50%', width: 130 * s, height: 130 * s, marginLeft: -65 * s, marginTop: -65 * s, borderRadius: '50%', background: 'rgba(255,253,248,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.35)'}}>
            <Tri size={64 * s} style={{transform: 'scaleX(-1) translateX(-4px)'}} />
          </div>
        </div>
      </div>
      {/* headline */}
      <div style={{position: 'absolute', right: 64 * s, top: (tall ? 150 : 56) * s, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', direction: 'rtl', zIndex: 5}}>
        <span style={txt(64 * s, P.inkSoft, 800)}>دي إشارة…</span>
        <span style={{...txt((tall ? 200 : 176) * s), marginTop: -20 * s}}>إعلانك</span>
        <span style={{...txt((tall ? 132 : 118) * s, P.white), background: P.orange, borderRadius: 24 * s, padding: `0 ${30 * s}px ${12 * s}px`, marginTop: 22 * s, boxShadow: '0 16px 40px rgba(229,71,15,0.35)'}}>محتاج يتحرك</span>
      </div>
      {/* price sticker */}
      <div
        style={{
          position: 'absolute',
          left: 54 * s,
          bottom: (tall ? 360 : 120) * s,
          width: 290 * s,
          height: 290 * s,
          borderRadius: '50%',
          background: P.white,
          border: `${14 * s}px solid ${P.teal}`,
          transform: 'rotate(-10deg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 50px rgba(60,40,20,0.3)',
          zIndex: 6,
          direction: 'rtl',
        }}
      >
        <span style={{...txt(38 * s, P.ink, 800), lineHeight: 1}}>يبدأ من</span>
        <span style={{...txt(120 * s, P.orange, 900), lineHeight: 1.05, direction: 'ltr'}}>300</span>
        <span style={{...txt(42 * s, P.ink, 900), lineHeight: 1}}>جنيه</span>
      </div>
      {/* footer */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: (tall ? 330 : 190) * s, background: P.cream, boxShadow: '0 -20px 40px rgba(60,40,20,0.12)', zIndex: 5}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: (tall ? 130 : 40) * s, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: 64 * s, gap: 10 * s, zIndex: 6}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 22 * s, direction: 'rtl'}}>
          <span style={txt(76 * s, P.ink)}>إبداع</span>
          <span style={txt(76 * s, P.orange)}>بيتحرك</span>
          <Logo size={86 * s} />
        </div>
        <span style={{...txt(34 * s, P.inkSoft, 700), direction: 'rtl'}}>موشن جرافيك · إعلانات · تصميمات</span>
      </div>
    </AbsoluteFill>
  );
};
