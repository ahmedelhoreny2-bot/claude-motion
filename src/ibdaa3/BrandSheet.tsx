import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT, P, Paper, useArabicFonts} from '../ibdaa/kit';
import {Logo} from '../ibdaa/scenes';

const txt = (size: number, color: string = P.ink, weight = 900): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: size,
  fontWeight: weight,
  color,
  lineHeight: 1.35,
  whiteSpace: 'nowrap',
});

const SW: {name: string; hex: string; role: string; share: string; dark?: boolean; border?: boolean}[] = [
  {name: 'كريمي', hex: '#F4F1EA', role: 'الخلفية الأساسية', share: '60%', border: true},
  {name: 'ورقي', hex: '#EDE6D6', role: 'خلفية تانية وورق', share: '', border: true},
  {name: 'أبيض دافي', hex: '#FFFDF8', role: 'الكروت والموبايلات', share: '', border: true},
  {name: 'حبر', hex: '#161514', role: 'الكلام بس', share: '15%', dark: true},
  {name: 'برتقالي', hex: '#FF5A20', role: 'البطل: الكلمة المهمة والسعر', share: '15%', dark: true},
  {name: 'برتقالي غامق', hex: '#E5470F', role: 'ظل البرتقالي والضغط', share: '', dark: true},
  {name: 'تيل', hex: '#13C2B5', role: 'المساعد: إطارات وتفاصيل', share: '10%', dark: true},
];

/** Brand sheet: the light identity of Ibdaa Beyt7arak, before vs after, palette, logo on light and on orange. */
export const IbdaaBrand: React.FC = () => {
  useArabicFonts();
  const s = 1;
  return (
    <AbsoluteFill style={{direction: 'rtl', overflow: 'hidden'}}>
      <Paper t={0} />
      <div style={{position: 'absolute', inset: 70, top: 56, display: 'flex', flexDirection: 'column', gap: 34}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <div style={txt(30, P.inkSoft, 700)}>دليل الهوية · النسخة الفاتحة</div>
            <div style={{display: 'flex', gap: 22}}>
              <span style={txt(96)}>إبداع</span>
              <span style={txt(96, P.orange)}>بيتحرك</span>
            </div>
          </div>
          <Logo size={150} />
        </div>

        {/* before / after */}
        <div style={{display: 'flex', gap: 30}}>
          {[
            {t: 'قبل', bg: '#111111', fg: '#F4F1EA', note: 'خلفية سودا، الكلام كريمي'},
            {t: 'بعد', bg: '#F4F1EA', fg: '#161514', note: 'خلفية كريمي، الكلام حبر'},
          ].map((b) => (
            <div key={b.t} style={{flex: 1, background: b.bg, borderRadius: 30, padding: 34, border: `2px solid ${P.inkFaint}`, display: 'flex', flexDirection: 'column', gap: 14}}>
              <span style={txt(30, b.t === 'قبل' ? '#8B877F' : P.inkSoft, 700)}>{b.t}</span>
              <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                <Logo size={58} />
                <span style={txt(42, b.fg)}>إبداع</span>
                <span style={txt(42, P.orange)}>بيتحرك</span>
              </div>
              <span style={txt(26, b.t === 'قبل' ? '#8B877F' : P.inkSoft, 600)}>{b.note}</span>
            </div>
          ))}
        </div>

        {/* palette */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
          {SW.map((c) => (
            <div key={c.hex} style={{display: 'flex', alignItems: 'center', gap: 24, background: P.white, borderRadius: 22, padding: '14px 18px', boxShadow: '0 6px 18px rgba(60,40,20,0.08)'}}>
              <div style={{width: 120, height: 74, borderRadius: 16, background: c.hex, border: c.border ? `2px solid ${P.inkFaint}` : undefined}} />
              <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                <span style={txt(36)}>{c.name}</span>
                <span style={txt(26, P.inkSoft, 600)}>{c.role}</span>
              </div>
              {c.share ? <span style={{...txt(30, P.orange, 900)}}>{c.share}</span> : null}
              <span style={{...txt(30, P.ink, 700), direction: 'ltr', fontFamily: 'monospace'}}>{c.hex}</span>
            </div>
          ))}
        </div>

        {/* logo on light / on orange */}
        <div style={{display: 'flex', gap: 30}}>
          <div style={{flex: 1, background: P.cream, borderRadius: 30, padding: 34, border: `2px solid ${P.inkFaint}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
              <span style={txt(46)}>إبداع</span>
              <span style={txt(46, P.orange)}>بيتحرك</span>
              <Logo size={64} />
            </div>
            <span style={txt(22, P.inkSoft, 600)}>على الفاتح: مثلث برتقالي، وخطوط تيل وبرتقالي</span>
          </div>
          <div style={{flex: 1, background: P.orange, borderRadius: 30, padding: 34, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
              <span style={txt(46, P.white)}>إبداع</span>
              <span style={txt(46, P.ink)}>بيتحرك</span>
              <Logo size={64} triColor={P.white} colors={[P.white, P.ink, P.white]} />
            </div>
            <span style={txt(22, P.white, 600)}>على البرتقالي: مثلث أبيض، خطوط أبيض وحبر</span>
          </div>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, marginTop: -20}}>
          <span style={txt(28, P.inkSoft, 700)}>الخط: Alexandria · عناوين 900 · فرعي 800 · وصف 600</span>
          <span style={txt(28, P.inkSoft, 700)}>ملمس: نقط خفيفة + ظل بني دافي</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
