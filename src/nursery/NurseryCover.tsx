import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Grain} from '../components/primitives';
import {N, NF} from './theme';
import {Card, ChatIcon, Confetti, PhoneIcon, Pill, PinIcon, Star} from './ui';
import {useArabicFonts} from './useArabicFonts';

const Abs: React.FC<{x: number; y: number; r?: number; children: React.ReactNode; z?: number}> = ({x, y, r = 0, children, z}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${r}deg)`, zIndex: z}}>{children}</div>
);

/** Reel cover (1080×1920) or feed square (1080×1080). Key content sits in the centre square. */
export const NurseryCover: React.FC<{square?: boolean}> = ({square = false}) => {
  useArabicFonts();
  const H = square ? 1080 : 1920;
  const cy = H / 2; // centre of the collage
  const off = square ? -90 : -150;
  const R = square ? 380 : 450;
  return (
    <AbsoluteFill style={{direction: 'rtl'}}>
      <Confetti t={3} seed={11} count={square ? 22 : 34} />
      {/* soft rainbow halo behind the collage */}
      <Abs x={540} y={cy + off}>
        <svg width={1000} height={1000} viewBox="-500 -500 1000 1000">
          {[N.yellow, N.pink, N.blue].map((c, i) => (
            <circle key={c} r={R - i * 34} fill="none" stroke={c} strokeWidth={26} opacity={0.9} />
          ))}
        </svg>
      </Abs>

      {/* photo fan */}
      <Abs x={250} y={cy + off - 40} r={-11}>
        <Card src="nursery/facepaint.jpg" w={430} h={330} border={12} pos="40% 50%" />
      </Abs>
      <Abs x={830} y={cy + off - 40} r={10}>
        <Card src="nursery/class.jpg" w={430} h={330} border={12} pos="55% 50%" />
      </Abs>
      <Abs x={540} y={cy + off} r={-2} z={2}>
        <Card src="nursery/logo.jpg" w={560} h={502} border={16} />
      </Abs>
      {[
        [130, cy + off - R + 140, 34, N.yellow],
        [960, cy + off - R + 150, 28, N.pink],
        [110, cy + off + R - 220, 24, N.blue],
        [980, cy + off + R - 210, 34, N.green],
      ].map(([x, y, r, c], i) => (
        <Abs key={i} x={x as number} y={y as number} r={i * 17}>
          <svg width={(r as number) * 2.4} height={(r as number) * 2.4} viewBox={`${-(r as number) * 1.2} ${-(r as number) * 1.2} ${(r as number) * 2.4} ${(r as number) * 2.4}`}>
            <Star r={r as number} fill={c as string} />
          </svg>
        </Abs>
      ))}

      {/* headline */}
      <div style={{position: 'absolute', top: cy + off + R + (square ? 0 : 20), width: 1080, textAlign: 'center', zIndex: 3}}>
        <div style={{fontFamily: NF.display, fontSize: square ? 100 : 124, lineHeight: 1.1, color: N.navy, textShadow: `0 6px 0 ${N.white}`}}>
          يتعلّم وهو <span style={{color: N.pink}}>بيلعب!</span>
        </div>
        <div style={{marginTop: 18, display: 'flex', justifyContent: 'center', gap: 16}}>
          {['تأسيس قوي', 'قرآن وأخلاق', 'أنشطة ومرح'].map((t, i) => (
            <Pill key={t} bg={[N.blue, N.green, N.orange][i]} size={square ? 40 : 44}>{t}</Pill>
          ))}
        </div>
      </div>

      {square ? (
        <div style={{position: 'absolute', top: 28, width: 1080, display: 'flex', justifyContent: 'center'}}>
          <Pill bg={N.navy} size={40} font="body" icon={<PhoneIcon size={36} color={N.yellow} />}>
            للحجز: <span style={{fontFamily: NF.display, direction: 'ltr', unicodeBidi: 'isolate'}}>01146592360</span>
          </Pill>
        </div>
      ) : (
        <>
          <div style={{position: 'absolute', top: 120, width: 1080, textAlign: 'center'}}>
            <Pill bg={N.yellow} color={N.navy} size={64} style={{transform: 'rotate(-2deg)'}}>حضانة وأكاديمية أطفال</Pill>
            <div style={{fontFamily: NF.display, fontSize: 92, color: N.blue, marginTop: 26, lineHeight: 1.15}}>
              هدفنا عقول <span style={{color: N.pink}}>مستنيرة</span>
            </div>
          </div>
          <div style={{position: 'absolute', top: 1600, width: 1080, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
            <div style={{display: 'flex', gap: 20}}>
              <Pill bg={N.blue} size={58} icon={<PhoneIcon size={54} />}>
                <span style={{direction: 'ltr', unicodeBidi: 'isolate'}}>01146592360</span>
              </Pill>
              <Pill bg={N.green} size={58} icon={<ChatIcon size={54} />}>
                <span style={{direction: 'ltr', unicodeBidi: 'isolate'}}>01224562915</span>
              </Pill>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 12, fontFamily: NF.display, fontSize: 56, color: N.navy}}>
              <PinIcon size={64} />
              زفتى – الحي البحري
            </div>
          </div>
        </>
      )}
      <Grain frame={1} opacity={0.04} />
    </AbsoluteFill>
  );
};
