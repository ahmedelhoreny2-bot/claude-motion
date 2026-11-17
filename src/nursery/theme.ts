import timeline from './timeline.json';

export const NT = timeline;
export const NFPS = NT.fps;
export const NW = 1080;
export const NH = 1920;

/** Palette pulled from the academy's logo: rainbow letters on cream. */
export const N = {
  cream: '#FFF6E6',
  creamDeep: '#FBE7C6',
  navy: '#172B57',
  blue: '#1F5FC4',
  pink: '#E8418C',
  green: '#2EA44F',
  yellow: '#FFC21A',
  orange: '#F7871E',
  purple: '#7A4DD8',
  white: '#FFFFFF',
  shade: 'rgba(23,43,87,0.55)',
  shadow: 'rgba(23,43,87,0.28)',
};

export const NF = {
  display: '"Lalezar", "Baloo Bhaijaan 2", sans-serif',
  body: '"Baloo Bhaijaan 2", sans-serif',
};

/** Cycle used for chips and the iris wipe. */
export const RAINBOW = [N.blue, N.pink, N.green, N.orange, N.purple, N.yellow];

/** Scene exits, in order; each one starts an iris wipe. */
export const WIPES = [NT.s1.exit, NT.s2.exit, NT.s3.exit, NT.s4.exit, NT.s5.exit, NT.s6.exit, NT.s7.exit];
