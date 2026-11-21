import timeline from './timeline.json';

export const T = timeline;
export const SW = 1080;
export const SH = 1920;

/** Palette taken from the client's logo: warm orange, sky blue, navy, white. */
export const S = {
  orange: '#F39325',
  orangeHi: '#FFC968',
  blue: '#2FA3DF',
  navy: '#1D2F7A',
  cream: '#FFF8EC',
  creamDim: 'rgba(255,248,236,0.78)',
  ink: '#16120E',
  paper: '#F6EFE2',
  shadow: '0 6px 18px rgba(0,0,0,0.75), 0 2px 4px rgba(0,0,0,0.8)',
  /** soft warm halo for captions: lifts the text off the picture without glare */
  glow: '0 0 22px rgba(255,214,170,0.28), 0 0 6px rgba(255,236,214,0.22), 0 4px 14px rgba(0,0,0,0.65), 0 1px 3px rgba(0,0,0,0.7)',
  glowHot: '0 0 26px rgba(243,147,37,0.45), 0 0 8px rgba(255,179,92,0.35), 0 4px 14px rgba(0,0,0,0.65), 0 1px 3px rgba(0,0,0,0.7)',
};

export const SF = {
  sans: '"Cairo", system-ui, sans-serif',
  naskh: '"Amiri", serif',
  ruqaa: '"Aref Ruqaa", serif',
};
