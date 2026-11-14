/**
 * One line, many shapes. Every shape is an open polyline resampled to N points
 * by arc length, so any two shapes can be morphed point by point.
 */
export type Pt = [number, number];
export const N = 260;
export const CX = 540;
export const CY = 900;

const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

export const resample = (pts: Pt[], n = N): Pt[] => {
  const seg: number[] = [0];
  for (let i = 1; i < pts.length; i++) seg.push(seg[i - 1] + dist(pts[i - 1], pts[i]));
  const total = seg[seg.length - 1] || 1;
  const out: Pt[] = [];
  let j = 1;
  for (let i = 0; i < n; i++) {
    const d = (i / (n - 1)) * total;
    while (j < seg.length - 1 && seg[j] < d) j++;
    const a = pts[j - 1];
    const b = pts[j];
    const span = seg[j] - seg[j - 1] || 1;
    const k = Math.min(1, Math.max(0, (d - seg[j - 1]) / span));
    out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]);
  }
  return out;
};

export const mix = (a: Pt[], b: Pt[], k: number): Pt[] =>
  a.map((p, i) => [p[0] + (b[i][0] - p[0]) * k, p[1] + (b[i][1] - p[1]) * k]);

export const toPath = (pts: Pt[]) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, steps = 24): Pt[] =>
  Array.from({length: steps + 1}, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / steps;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  });

/** Rounded rectangle, starting at the top-right corner going right → left (Arabic reading order). */
const rrect = (x0: number, y0: number, x1: number, y1: number, r: number): Pt[] => {
  const P = Math.PI;
  return [
    ...arc(x1 - r, y0 + r, r, r, -P / 2, 0, 6).reverse(),
    ...arc(x0 + r, y0 + r, r, r, -P / 2, -P, 6),
    ...arc(x0 + r, y1 - r, r, r, P, P / 2, 6),
    ...arc(x1 - r, y1 - r, r, r, P / 2, 0, 6),
    [x1, y0 + r],
  ];
};

const rot = (pts: Pt[], deg: number, cx = CX, cy = CY): Pt[] => {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
};

/* ---------- the shapes ---------- */

export const DOT = resample([[CX, CY], [CX + 0.01, CY]]);
export const LINE = resample([[1040, CY], [40, CY]]);

export const CUP = resample([
  [800, 1075], [280, 1075],                                   // saucer, drawn right → left
  ...arc(540, 1075, 260, 22, Math.PI, 2 * Math.PI, 12).slice(0, 1),
  [380, 1040],
  ...arc(540, 790, 175, 245, Math.PI, Math.PI / 2, 14).slice(1), // left wall down to the bottom
  ...arc(540, 790, 175, 245, Math.PI / 2, 0, 14).slice(1),       // right wall up
  ...arc(745, 880, 70, 80, -Math.PI / 2, Math.PI / 2, 14),        // handle
  [715, 790], [365, 790],                                        // rim
]);

export const ECG = resample([
  [1040, CY], [700, CY], [670, 860], [640, CY], [600, CY], [570, 640], [530, 1140], [495, CY],
  [440, CY], [410, 830], [380, 970], [350, CY], [40, CY],
]);

// the string comes in from outside, loops the hole, then the outline is drawn
export const TAG = resample([
  [120, 720], [338, 876],
  ...arc(350, CY, 26, 26, -Math.PI / 2, (3 * Math.PI) / 2, 16),
  [324, CY], [250, CY], [380, 760], [800, 760], [800, 1040], [380, 1040], [250, CY],
]);
export const TAG_HOLE: Pt = [350, CY];

export const PHONE = resample(rrect(370, 600, 710, 1220, 56));
export const SCREEN = resample(rrect(-30, -40, 1110, 1960, 60));
export const UNDER = resample([[880, 1060], [200, 1060]]);

export const SPIRAL = resample(
  Array.from({length: 220}, (_, i) => {
    const k = i / 219;
    const a = k * Math.PI * 7;
    const r = 30 + k * 400;
    return [CX + Math.cos(a) * r, CY + Math.sin(a) * r] as Pt;
  }),
);

export const SQUARE = resample(rrect(330, 690, 750, 1110, 28));
export const POLAROID = resample(rot(rrect(320, 610, 760, 1170, 14), -6));
export const LAPTOP = resample([...rrect(230, 680, 850, 1070, 22), [850, 1070], [930, 1130], [150, 1130], [230, 1070]]);
export const PHONE_TALL = resample(rrect(380, 560, 700, 1240, 46));
export const WIDE = resample(rrect(130, 690, 950, 1130, 28));
export const PAGE = resample([...rrect(360, 600, 720, 1180, 18), [720, 700], [640, 600]]);
export const MIC = resample([
  ...rrect(470, 620, 610, 920, 70),
  [610, 860], ...arc(540, 880, 120, 150, 0, Math.PI, 14), [420, 880],
  [420, 860], [540, 1030], [540, 1150], [440, 1150], [640, 1150],
]);
export const WAVE = resample(
  Array.from({length: 200}, (_, i) => {
    const k = i / 199;
    const env = Math.sin(Math.PI * k) ** 1.4;
    return [1040 - k * 1000, CY + Math.sin(k * Math.PI * 18) * 210 * env] as Pt;
  }),
);
/** 9:16, 1:1 and 16:9 side by side, one continuous stroke. */
export const TRIPLE_BOXES: [number, number, number, number][] = [
  [700, 700, 960, 1162],
  [410, 790, 660, 1040],
  [100, 835, 370, 987],
];
export const TRIPLE = resample(TRIPLE_BOXES.flatMap(([x0, y0, x1, y1]) => rrect(x0, y0, x1, y1, 16)));

/* ---------- small line icons (for the orbit) ---------- */
export const shrink = (pts: Pt[], s: number, cx: number, cy: number): Pt[] =>
  pts.map(([x, y]) => [cx + (x - CX) * s, cy + (y - CY) * s]);
