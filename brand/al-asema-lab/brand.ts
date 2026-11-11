// Al Asema Lab (معمل العاصمة للتحاليل الطبية): palette, fonts and logo mark for Remotion videos.
// Values mirror palette.json and build.py; change them there first.
// Fonts: Cairo + Montserrat, in brand/al-asema-lab/fonts (copy into public/ or use @remotion/google-fonts).

export const LAB = {
  white: '#FFFFFF',
  red: '#E01E26',
  redDeep: '#A3141B',
  redSoft: '#FCE4E5',
  black: '#141414',
  blackSoft: '#26262B',
  gray: '#F2F2F3',
  grayText: '#5F5F66',
  line: 'rgba(20,20,20,0.10)',
};

export const LAB_FONT = {
  ar: '"Cairo", system-ui, sans-serif',
  en: '"Montserrat", "Cairo", system-ui, sans-serif',
};

// The mark in its native grid (viewBox below). Animate in layers:
// stripe wipes in, swoosh/arm draws, tube drops onto the ring, bubbles pop.
export const LAB_MARK = {
  viewBox: '-2 -14 524 530',
  arm: 'M330,140 C420,160 474,240 470,330 C466,410 420,452 352,452 C250,454 110,446 4,442 C110,398 220,382 338,404 C392,410 432,372 434,322 C436,262 398,214 330,190 Z',
  tube: {transform: 'translate(229,174) rotate(15)', svg: '<rect x="-46" y="-180" width="92" height="24" rx="9"/><rect x="-25" y="-160" width="50" height="40" rx="4"/><rect x="-36" y="-124" width="72" height="196" rx="8"/><path d="M-30,68 L30,68 L22,108 Q0,118 -22,108 Z"/><path fill-rule="evenodd" d="M58,-20 m-52,0 a52,52 0 1,0 104,0 a52,52 0 1,0 -104,0 Z M58,-20 m-28,0 a28,28 0 1,1 56,0 a28,28 0 1,1 -56,0 Z"/>'},
  stripe: 'M18,458 C160,456 340,466 520,490 L514,518 C350,490 180,470 18,458 Z',
  bubbles: [[48, 198, 25], [56, 250, 7], [100, 248, 14], [85, 292, 9], [118, 282, 6], [116, 325, 9]] as [number, number, number][],
};
