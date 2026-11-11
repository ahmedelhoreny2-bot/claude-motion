// Al Asema Lab (معمل العاصمة للتحاليل الطبية): palette and fonts for Remotion videos.
// Values mirror palette.json; change them there first.
// Fonts: load Cairo and Montserrat from brand/al-asema-lab/fonts (copy into public/ or use @remotion/google-fonts).

export const LAB = {
  indigo: '#1F2470',
  indigoHi: '#2E3BB0',
  indigoDeep: '#11143E',
  crimson: '#E1263C',
  crimsonDeep: '#B01E2F',
  teal: '#0FA39A',
  tealDeep: '#0C7F78',
  mist: '#EEF0FB',
  ink: '#0D1030',
  white: '#FFFFFF',
  line: 'rgba(31,36,112,0.12)',
  onIndigoDim: 'rgba(255,255,255,0.64)',
};

export const LAB_FONT = {
  ar: '"Cairo", "Tajawal", system-ui, sans-serif',
  en: '"Montserrat", "Cairo", system-ui, sans-serif',
};

// The mark on a 200x200 grid, so videos can draw and animate it (stroke the arch, drop the drop).
export const LAB_MARK = {
  viewBox: '0 0 200 200',
  arch: 'M40,178 L40,104 A72,72 0 0 1 100,33 A72,72 0 0 1 160,104 L160,178',
  archWidth: 21,
  drop: 'M100,74 L126.61,125.15 A30,30 0 1 1 73.39,125.15 Z',
  shine: 'M86,140 A15,15 0 0 0 96,155',
};
