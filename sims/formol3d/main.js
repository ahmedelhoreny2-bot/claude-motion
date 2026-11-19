import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {BokehPass} from 'three/addons/postprocessing/BokehPass.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {runSim} from '../kit/runtime.js';
import {ASU, FST} from './assets.js';
import TL from './timeline.json';

// Formol titration — the 3D cut. Four worlds share one clock (timeline.json, built from the
// recorded voice): a bright lab, the inside of the milk, the molecular world and a macro of a
// drop. The camera dives lab → milk → protein chain → amino acid → reaction and back out.
// Every sync point is a word time in TL.words. render(t) is pure.

const S = TL.sentences;
const W = TL.words;
const CH = TL.ch;
const sa = (n) => S[n - 1].at;
const se = (n) => S[n - 1].at + S[n - 1].dur;

const DEFAULTS = {duration: TL.duration, fps: TL.fps, theme: 'light', watermark: '', hud: {enabled: false}, director: {enabled: false}, rs: 0.67};

const P = {
  milk: '#fff6ec',
  faint: '#ffcfe2',
  deep: '#ff3e9a',
  pink: '#ff3e9a',
  navy: '#0a1230',
  cyan: '#2ec8ff',
  coral: '#ff6b4a',
  lime: '#6fd65e',
  violet: '#9a6bff',
  gold: '#f5b51f',
  ink: '#16213a',
  blue: '#2f6fff',
};

/* ------------------------------------------------------------------ helpers */

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (x) => {
  const k = clamp01(x);
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
};
const eout = (x) => 1 - Math.pow(1 - clamp01(x), 3);
const ein = (x) => Math.pow(clamp01(x), 3);
const prog = (t, a, b, f = ease) => f((t - a) / (b - a));
const win = (t, a, b, fi = 0.35, fo = 0.3) => clamp01((t - a) / fi) * clamp01((b - t) / fo);
const spring = (t, a, damp = 7, freq = 2.2) => {
  const x = t - a;
  if (x <= 0) return 0;
  return 1 - Math.exp(-damp * x) * Math.cos(freq * Math.PI * 2 * x * 0.5);
};
const mulberry = (a) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/** Camera rig: keys [t, pos, look, fov?]; eased between consecutive keys, plus a soft handheld drift. */
const rig = (keys, drift = 0.25) => (t) => {
  let i = 0;
  while (i < keys.length - 1 && t > keys[i + 1][0]) i++;
  const a = keys[i];
  const b = keys[Math.min(i + 1, keys.length - 1)];
  const k = b === a ? 0 : ease((t - a[0]) / (b[0] - a[0]));
  const pos = a[1].clone().lerp(b[1], k);
  const look = a[2].clone().lerp(b[2], k);
  const fov = lerp(a[3] ?? 30, b[3] ?? 30, k);
  pos.x += Math.sin(t * 0.7) * drift;
  pos.y += Math.sin(t * 0.53 + 1) * drift * 0.6;
  return {pos, look, fov};
};

const gradientBg = (top, bottom) => {
  const cv = document.createElement('canvas');
  cv.width = 32;
  cv.height = 256;
  const g = cv.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, top);
  grd.addColorStop(1, bottom);
  g.fillStyle = grd;
  g.fillRect(0, 0, 32, 256);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
const radialTex = (color, a0 = 0.9, a1 = 0.35) => {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  const c = new THREE.Color(color);
  const rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, `rgba(${rgb},${a0})`);
  grd.addColorStop(0.4, `rgba(${rgb},${a1})`);
  grd.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
};

const glassMat = (o = {}) =>
  new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.03,
    transmission: 1,
    thickness: 0.3,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.3,
    attenuationColor: '#cfe9e0',
    attenuationDistance: 5,
    specularIntensity: 1,
    side: THREE.DoubleSide,
    ...o,
  });
const lathe = (pts, seg = 72) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
const sh = (m) => {
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};

/* ------------------------------------------------------------------ lab state (pure functions of t) */

const T1 = {start: W.dropwise, end: W.stop - 0.25, vol: 1.6, dt: 0.42};
const T2 = {start: W.t2drops, end: W.t2back + 0.75, vol: 2.0, dt: 0.36};
const TB = {start: sa(24) + 0.3, end: sa(24) + 2.1, vol: 0.2, dt: 0.45};
const REFILL2 = sa(21) + 0.15;
const REFILL3 = sa(24) - 1.3;
const MACRO = {a: W.dropwise + 0.25, b: W.appear + 0.55, impact: W.dropwise + 0.9};

const dropsOf = (ti) => {
  const n = Math.max(3, Math.round((ti.end - ti.start) / ti.dt));
  return Array.from({length: n}, (_, i) => ti.start + ((ti.end - ti.start) * i) / (n - 1));
};
const DROPS = [...dropsOf(T1), ...dropsOf(T2), ...dropsOf(TB)];

const readingAt = (t) => {
  const r1 = T1.vol * prog(t, T1.start, T1.end, (x) => x);
  if (t < REFILL2) return r1;
  const back2 = 1 - prog(t, REFILL2, REFILL2 + 0.9);
  if (t < REFILL3) return T1.vol * back2 + T2.vol * prog(t, T2.start, T2.end, (x) => x);
  const back3 = 1 - prog(t, REFILL3, REFILL3 + 0.9);
  return T2.vol * back3 + TB.vol * prog(t, TB.start, TB.end, (x) => x);
};
const openAt = (t) => [T1, T2, TB].reduce((a, ti) => a + prog(t, ti.start - 0.5, ti.start - 0.15) * (1 - prog(t, ti.end + 0.1, ti.end + 0.4)), 0);
const swirlAt = (t) => [T1, T2, TB].reduce((a, ti) => a + prog(t, ti.start - 0.3, ti.start + 0.3) * (1 - prog(t, ti.end + 0.3, ti.end + 0.9)), 0) + prog(t, W.formPour + 2.0, W.formPour + 2.5) * (1 - prog(t, W.vanish + 0.8, W.vanish + 1.4));

// flask A (milk) x position on the bench: filled at the side, under the burette, out for formalin, aside for the blank
const SIDE = 17;
const flaskAx = (t) => {
  let x = SIDE;
  x = lerp(x, 0, prog(t, W.fillBur - 0.8, W.fillBur + 0.4));
  x = lerp(x, SIDE, prog(t, W.formPour - 0.9, W.formPour - 0.2));
  x = lerp(x, 0, prog(t, W.formPour + 2.2, W.formPour + 3.0));
  x = lerp(x, -SIDE - 2, prog(t, sa(23) + 0.4, sa(23) + 1.5));
  return x;
};
const flaskBx = (t) => lerp(SIDE + 14, 0, prog(t, sa(23) + 1.1, sa(23) + 2.5));
const MILK_L = 3.6;
const milkLevel = (t) => MILK_L * prog(t, W.pour + 0.2, W.pour + 2.4) + 0.5 * prog(t, W.formPour + 0.1, W.formPour + 1.9);
const milkPink = (t) => {
  const p1 = prog(t, T1.end - 0.5, T1.end + 0.4) * 0.5;
  const v = prog(t, W.vanish - 0.35, W.vanish + 0.5);
  const p2 = prog(t, T2.end - 0.6, T2.end + 0.3) * 0.5;
  return p1 * (1 - v) + p2;
};
const waterPink = (t) => prog(t, TB.end - 0.4, TB.end + 0.4) * 0.55;
const flashAt = (t) => DROPS.reduce((a, d) => {
  const x = t - (d + 0.3);
  return x > 0 && x < 0.9 ? Math.max(a, (1 - x / 0.9) * (x < 0.08 ? x / 0.08 : 1)) : a;
}, 0);

/* ------------------------------------------------------------------ LAB */

function buildLab(env) {
  const scene = new THREE.Scene();
  scene.background = gradientBg('#b4c3d4', '#e8edf3');
  scene.environment = env;
  scene.environmentIntensity = 0.7;
  scene.fog = new THREE.Fog('#c3cfdc', 140, 360);
  scene.add(new THREE.HemisphereLight('#ffffff', '#c6d0dc', 0.75));
  const key = new THREE.DirectionalLight('#fff6ec', 2.3);
  key.position.set(-40, 80, 45);
  key.castShadow = true;
  key.shadow.mapSize.set(1536, 1536);
  Object.assign(key.shadow.camera, {left: -70, right: 100, top: 70, bottom: -40, near: 1, far: 260});
  key.shadow.bias = -0.0005;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#dbe8ff', 1.1);
  rim.position.set(35, 50, -70);
  scene.add(rim);

  const bench = sh(new THREE.Mesh(new THREE.BoxGeometry(520, 4, 150), new THREE.MeshPhysicalMaterial({color: '#f2f4f7', roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.4})));
  bench.position.set(10, -2, -20);
  scene.add(bench);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(900, 320), new THREE.MeshStandardMaterial({color: '#a9b8c9', roughness: 0.9}));
  wall.position.set(0, 110, -100);
  scene.add(wall);
  for (const [x, w, h, c] of [[-90, 70, 46, '#5b6a80'], [-10, 90, 40, '#6f7f95'], [70, 60, 52, '#56657a'], [130, 80, 44, '#64738a']]) {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(w, h, 30), new THREE.MeshStandardMaterial({color: c, roughness: 0.6}));
    cab.position.set(x, h / 2, -78);
    scene.add(cab);
    for (let k = 0; k < 2; k++) {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(6, 0.8, 0.8), new THREE.MeshStandardMaterial({color: '#c9cfd8', metalness: 1, roughness: 0.3}));
      handle.position.set(x - w / 4 + (k * w) / 2, h - 6, -62.6);
      scene.add(handle);
    }
  }
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(300, 2, 26), new THREE.MeshStandardMaterial({color: '#f7f9fb', roughness: 0.5}));
  shelf.position.set(20, 72, -86);
  scene.add(shelf);
  const windowM = new THREE.Mesh(new THREE.PlaneGeometry(110, 80), new THREE.MeshBasicMaterial({color: '#ffffff'}));
  windowM.position.set(-140, 100, -99);
  scene.add(windowM);
  // background bottles: cheap transparent material (they are always out of focus)
  const rnd = mulberry(7);
  const tints = ['#7fc4ff', '#ffb35c', '#9be38a', '#c9a4ff', '#ff8fb8', '#ffffff'];
  const bgGlass = new THREE.MeshPhysicalMaterial({color: '#ffffff', roughness: 0.05, transparent: true, opacity: 0.22, clearcoat: 1});
  for (let i = 0; i < 18; i++) {
    const h = 10 + rnd() * 16;
    const r = 3 + rnd() * 3;
    const onShelf = i >= 9;
    const x = -110 + (onShelf ? (i - 9) * 30 + 20 : i * 28) + rnd() * 8;
    const y = onShelf ? 73 : 0;
    const z = onShelf ? -86 : -46 - rnd() * 12;
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92, r * 0.92, h * (0.35 + rnd() * 0.4), 24), new THREE.MeshStandardMaterial({color: tints[i % tints.length], roughness: 0.2, transparent: true, opacity: 0.75}));
    liq.position.set(x, y + liq.geometry.parameters.height / 2 + 0.3, z);
    scene.add(liq);
    const g = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24, 1, true), bgGlass);
    g.position.set(x, y + h / 2, z);
    scene.add(g);
  }

  // stand
  const base = sh(new THREE.Mesh(new THREE.BoxGeometry(26, 1.6, 16), new THREE.MeshPhysicalMaterial({color: '#2a3142', roughness: 0.35, clearcoat: 0.6})));
  base.position.set(-5, 0.8, -2);
  scene.add(base);
  const tile = sh(new THREE.Mesh(new THREE.BoxGeometry(15, 0.6, 15), new THREE.MeshPhysicalMaterial({color: '#ffffff', roughness: 0.15, clearcoat: 1})));
  tile.position.set(0, 1.9, 0);
  scene.add(tile);
  const metal = new THREE.MeshStandardMaterial({color: '#c9cfd8', metalness: 1, roughness: 0.28});
  const rod = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 95, 24), metal));
  rod.position.set(-14, 1.6 + 47.5, -5);
  scene.add(rod);
  for (const yy of [40, 76]) {
    const arm = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 15, 16), metal));
    arm.rotation.z = Math.PI / 2;
    arm.rotation.y = -0.33;
    arm.position.set(-7, yy, -2.5);
    scene.add(arm);
    const jaw = sh(new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.22, 12, 32), new THREE.MeshStandardMaterial({color: P.blue, roughness: 0.4})));
    jaw.rotation.x = Math.PI / 2;
    jaw.position.set(0, yy, 0);
    scene.add(jaw);
  }

  // Erlenmeyer: outer glass + liquid (clipped at its level, capped by a disc)
  const PROF = [[0, 0], [3.9, 0], [4.25, 0.25], [4.35, 0.7], [4.2, 1.4], [1.75, 10.6], [1.7, 11.2], [1.7, 13.6], [1.95, 13.8], [1.95, 14.15], [1.62, 14.15], [1.6, 13.7]];
  const rIn = (y) => (y <= 1.4 ? 3.95 : 3.95 + ((1.5 - 3.95) * (y - 1.4)) / (10.6 - 1.4));
  const makeFlask = (s = 1) => {
    const g = new THREE.Group();
    const glass = sh(new THREE.Mesh(lathe(PROF, 96), glassMat({thickness: 0.4})));
    g.add(glass);
    const plane = new THREE.Plane(V(0, -1, 0), 1);
    const mat = new THREE.MeshPhysicalMaterial({color: P.milk, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.12, sheen: 0.6, sheenColor: '#ffffff', clippingPlanes: [plane]});
    const body = new THREE.Mesh(lathe([[0, 0.3], [3.8, 0.3], [3.98, 0.8], [rIn(8), 8], [0, 8]], 72), mat);
    body.receiveShadow = true;
    g.add(body);
    const cap = new THREE.Mesh(new THREE.CircleGeometry(1, 64), mat.clone());
    cap.material.clippingPlanes = null;
    cap.rotation.x = -Math.PI / 2;
    g.add(cap);
    const flash = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({map: radialTex(P.pink, 0.95, 0.5), transparent: true, depthWrite: false}));
    flash.rotation.x = -Math.PI / 2;
    g.add(flash);
    g.scale.setScalar(s);
    const api = {
      g,
      set(level, color, t, swirl, flashK) {
        const lv = Math.max(0.31, level);
        plane.constant = g.position.y + lv * g.scale.y;
        const tilt = swirl * 0.06 * Math.sin(t * 9);
        cap.position.y = lv;
        cap.scale.setScalar(rIn(lv) - 0.04);
        cap.rotation.y = 0;
        cap.rotation.x = -Math.PI / 2 + tilt;
        cap.visible = level > 0.35;
        body.visible = level > 0.35;
        mat.color.set(color);
        cap.material.color.set(color);
        flash.position.y = lv + 0.02;
        flash.scale.setScalar((rIn(lv) - 0.2) * (0.4 + 0.6 * (1 - flashK)));
        flash.material.opacity = flashK;
        flash.visible = flashK > 0.01 && level > 0.35;
        g.rotation.z = swirl * 0.035 * Math.sin(t * 9);
        g.rotation.x = swirl * 0.035 * Math.cos(t * 9);
      },
    };
    return api;
  };
  const F0 = 2.2;
  const flaskA = makeFlask();
  flaskA.g.position.y = F0;
  scene.add(flaskA.g);
  const flaskB = makeFlask();
  flaskB.g.position.y = F0;
  scene.add(flaskB.g);
  const tileB = sh(new THREE.Mesh(new THREE.BoxGeometry(12, 0.6, 12), tile.material));
  tileB.position.set(SIDE, 0.3, 0);
  scene.add(tileB);

  // indicator demo: three small flasks (acid / neutral / alkaline)
  const demo = [P.milk, P.faint, P.deep].map((c, i) => {
    const f = makeFlask(0.8);
    f.g.position.set(60 + i * 11, 0, 6);
    f.set(4.5, c, 0, 0, 0);
    scene.add(f.g);
    return f;
  });

  // milk beaker (intro dive) + milk bottle + formalin bottle
  const beakerX = -38;
  const beaker = sh(new THREE.Mesh(lathe([[0, 0], [4.6, 0], [4.8, 0.3], [4.8, 12], [5.2, 12.4], [4.95, 12.4], [4.55, 12]], 96), glassMat({thickness: 0.3})));
  beaker.position.set(beakerX, 0, 6);
  scene.add(beaker);
  const bmilk = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 8.4, 72), new THREE.MeshPhysicalMaterial({color: P.milk, roughness: 0.3, clearcoat: 0.8, sheen: 0.6, sheenColor: '#ffffff'}));
  bmilk.position.set(beakerX, 4.5, 6);
  scene.add(bmilk);
  for (let i = 0; i < 9; i++) {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(i % 2 ? 1.2 : 2, 0.12, 0.05), new THREE.MeshBasicMaterial({color: '#5b6478'}));
    tick.position.set(beakerX - 2.4, 2 + i * 1.1, 6 + 4.82);
    scene.add(tick);
  }
  const bottle = (x, z, color, cap, label) => {
    const b = sh(new THREE.Mesh(lathe([[0, 0], [3.4, 0], [3.6, 0.4], [3.6, 11], [2.0, 13.5], [1.2, 14], [1.2, 15.5], [0, 15.5]], 64), new THREE.MeshPhysicalMaterial({color, roughness: 0.1, transmission: 0.5, thickness: 2, clearcoat: 1})));
    b.position.set(x, 0, z);
    scene.add(b);
    const c = sh(new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 2, 32), new THREE.MeshStandardMaterial({color: cap, roughness: 0.5})));
    c.position.set(x, 16, z);
    scene.add(c);
    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 256;
    const g = cv.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 512, 256);
    g.fillStyle = cap;
    g.fillRect(0, 0, 512, 46);
    g.fillStyle = '#16213a';
    g.font = '800 64px Cairo';
    g.textAlign = 'center';
    g.direction = 'rtl';
    g.fillText(label, 256, 150);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const lab = new THREE.Mesh(new THREE.CylinderGeometry(3.62, 3.62, 4.5, 48, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({map: tex, roughness: 0.6}));
    lab.position.set(x, 6.5, z);
    scene.add(lab);
  };
  bottle(28, -12, '#d9a464', '#8a5a2b', 'فورمالين');
  bottle(-50, -10, '#ffffff', P.blue, 'لبن');
  bottle(10, -16, '#cfe6ff', '#2a3142', 'NaOH');

  // burette
  const tipEnd = F0 + 14.15 - 1.6;
  const tipTop = tipEnd + 2.0;
  const cock = tipTop + 0.6;
  const taperTop = cock + 1.6;
  const tubeTop = taperTop + 70;
  const zeroY = tubeTop - 2;
  const R = 0.62;
  const bur = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(R, R, tubeTop - taperTop, 48, 1, true), glassMat({thickness: 0.15}));
  tube.position.y = (tubeTop + taperTop) / 2;
  bur.add(tube);
  bur.add(new THREE.Mesh(lathe([[R, taperTop], [R - 0.02, taperTop - 0.6], [0.3, cock + 0.4], [0.3, cock]], 40), glassMat({thickness: 0.2})));
  bur.add(new THREE.Mesh(lathe([[0.3, cock - 0.5], [0.28, tipTop], [0.12, tipEnd]], 40), glassMat({thickness: 0.15})));
  const naoh = new THREE.MeshPhysicalMaterial({color: '#8fc6f2', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.3, sheenColor: '#ffffff'});
  const col = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.08, R - 0.08, 1, 40), naoh);
  bur.add(col);
  const men = new THREE.Mesh(new THREE.SphereGeometry(R - 0.08, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), naoh);
  bur.add(men);
  const tcol = new THREE.Mesh(lathe([[0, taperTop], [R - 0.1, taperTop], [0.22, cock + 0.4], [0.2, tipTop], [0.07, tipEnd + 0.05], [0, tipEnd + 0.05]], 24), naoh);
  bur.add(tcol);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.6, 24), glassMat({thickness: 0.3}));
  barrel.rotation.z = Math.PI / 2;
  barrel.position.y = cock;
  bur.add(barrel);
  const keyM = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.36, 3.4, 24), new THREE.MeshPhysicalMaterial({color: '#f4f6f8', roughness: 0.35, clearcoat: 0.3})));
  keyM.rotation.z = Math.PI / 2;
  keyM.position.y = cock;
  bur.add(keyM);
  const handle = sh(new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.0, 0.9), new THREE.MeshPhysicalMaterial({color: P.blue, roughness: 0.3, clearcoat: 0.6})));
  const hpivot = new THREE.Group();
  hpivot.position.set(1.95, cock, 0);
  hpivot.add(handle);
  bur.add(hpivot);
  // graduations (opaque decal, alpha-tested)
  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = 4096;
  const g = cv.getContext('2d');
  const span = tubeTop - taperTop;
  const yOf = (ml) => ((2 + ml) / span) * cv.height;
  g.fillStyle = '#1b2235';
  g.font = '700 46px "JetBrains Mono"';
  for (let i = 0; i <= 500; i++) {
    const ml = i / 10;
    const y = yOf(ml);
    const major = i % 10 === 0;
    const mid = i % 5 === 0;
    g.fillRect(150, y - 2.5, major ? 210 : mid ? 145 : 95, major ? 6 : 3.5);
    if (major) g.fillText(String(ml), 372, y + 16);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const scale = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.012, R + 0.012, span, 40, 1, true, -0.25, 1.4), new THREE.MeshBasicMaterial({map: tex, alphaTest: 0.35}));
  scale.position.y = (tubeTop + taperTop) / 2;
  bur.add(scale);
  scene.add(bur);
  const dropMat = new THREE.MeshPhysicalMaterial({color: '#e6f4ff', roughness: 0, transmission: 0.9, thickness: 0.4, ior: 1.33, clearcoat: 1});
  const hang = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), dropMat);
  hang.scale.set(1, 1.25, 1);
  hang.position.y = tipEnd - 0.18;
  scene.add(hang);
  const falling = Array.from({length: 3}, () => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 14), dropMat);
    m.scale.set(1, 1.35, 1);
    scene.add(m);
    return m;
  });

  // pipette (milk / formalin) and dropper (indicator)
  const pip = new THREE.Group();
  const pipGlass = new THREE.Mesh(lathe([[0.18, 0], [0.32, 1.2], [0.32, 12], [1.0, 14], [1.0, 19], [0.32, 21], [0.32, 34]], 32), glassMat({thickness: 0.15}));
  pip.add(pipGlass);
  const pipLiq = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 4.6, 32), new THREE.MeshPhysicalMaterial({color: P.milk, roughness: 0.3, clearcoat: 0.6}));
  pipLiq.position.y = 16.5;
  pip.add(pipLiq);
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1, 12), pipLiq.material);
  scene.add(stream);
  scene.add(pip);
  const dropper = new THREE.Group();
  dropper.add(new THREE.Mesh(lathe([[0.1, 0], [0.3, 1.2], [0.42, 2], [0.42, 9]], 24), glassMat({thickness: 0.1})));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(1.0, 32, 20), new THREE.MeshPhysicalMaterial({color: '#7a4fd6', roughness: 0.45, clearcoat: 0.4}));
  bulb.scale.set(1, 1.5, 1);
  bulb.position.y = 10.4;
  dropper.add(bulb);
  scene.add(dropper);
  const indDrop = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), dropMat);
  scene.add(indDrop);

  const camAt = rig([
    [0, V(-5, 58, 140), V(-18, 10, 0), 30],
    [8.8, V(-30, 28, 48), V(beakerX, 8, 6), 30],
    [CH.protein.start + 0.2, V(-34, 22, 30), V(beakerX, 7, 6), 32],
    [CH.protein.start + 1.6, V(beakerX + 0.2, 13, 9), V(beakerX, 6, 6), 40],
    [CH.protein.start + 2.2, V(beakerX, 9.1, 6.3), V(beakerX, 0, 6), 50],
    [CH.setup.start, V(32, 22, 64), V(10, 9, 0), 30],
    [W.pour - 0.6, V(36, 15, 38), V(SIDE, 7, 0), 30],
    [W.drops + 0.8, V(33, 14, 32), V(SIDE, 6, 0), 30],
    [W.fillBur, V(18, 18, 48), V(0, 12, 0), 30],
    [W.fillBur + 2.0, V(12, 82, 34), V(0, 84, 0), 30],
    [sa(14) - 0.2, V(10, 86, 30), V(0, 86, 0), 30],
    [sa(14) + 1.0, V(70, 18, 50), V(71, 5, 6), 28],
    [se(14), V(76, 15, 42), V(71, 5, 6), 28],
    [CH.t1.start + 0.6, V(25, 18, 60), V(-1, 12, 0), 30],
    [sa(16) - 0.4, V(24, 17, 56), V(-1, 12, 0), 30],
    [W.dropwise, V(14, 13, 34), V(0, 10, 0), 30],
    [MACRO.b + 0.6, V(12, 12, 30), V(0, 9, 0), 30],
    [se(16), V(-8, 13, 32), V(0, 9, 0), 30],
    [sa(17) + 1.6, V(4.5, 85.4, 14), V(4.2, 85.4, 0), 30],
    [se(17), V(5.5, 85.8, 13), V(4.2, 85.6, 0), 30],
    [CH.form.start + 0.4, V(30, 16, 50), V(8, 9, 0), 30],
    [W.formPour - 0.2, V(36, 15, 38), V(SIDE, 8, 0), 30],
    [W.formPour + 2.0, V(34, 14, 36), V(SIDE, 7, 0), 30],
    [W.vanish - 0.6, V(14, 12.5, 32), V(0, 8.5, 0), 30],
    [se(20), V(-12, 14, 34), V(0, 9, 0), 30],
    [CH.t2.start + 0.5, V(12, 14, 36), V(0, 10, 0), 30],
    [W.t2back + 1.0, V(10, 12.5, 30), V(0, 9, 0), 30],
    [sa(22) + 0.9, V(4.5, 85.0, 14), V(4.2, 85.0, 0), 30],
    [se(22), V(5.5, 85.4, 13), V(4.2, 85.2, 0), 30],
    [CH.blank.start + 0.5, V(18, 22, 68), V(-2, 10, 0), 30],
    [sa(23) + 2.6, V(16, 20, 62), V(-4, 10, 0), 30],
    [sa(24) - 0.2, V(10, 13, 32), V(0, 9, 0), 30],
    [se(24) + 0.2, V(10, 12.5, 30), V(0, 9, 0), 30],
    [sa(25) + 0.6, V(6, 22, 66), V(-8, 11, 0), 30],
    [se(25), V(2, 22, 64), V(-8, 11, 0), 30],
    [CH.calc.start + 0.5, V(40, 26, 84), V(0, 12, 0), 30],
    [CH.calc.end, V(-24, 24, 84), V(-2, 12, 0), 30],
    [CH.outro.start + 2, V(-18, 30, 96), V(0, 13, 0), 30],
    [TL.duration, V(6, 40, 130), V(0, 14, 0), 30],
  ]);

  const anchors = {};
  const update = (t) => {
    const lvA = milkLevel(t);
    const swirl = clamp01(swirlAt(t));
    const xa = flaskAx(t);
    flaskA.g.position.x = xa;
    const underBur = Math.abs(xa) < 0.5;
    flaskA.set(lvA, new THREE.Color(P.milk).lerp(new THREE.Color(P.faint), clamp01(milkPink(t) / 0.5)).getStyle(), t, underBur ? swirl : 0, underBur && t < REFILL3 ? flashAt(t) : 0);
    const xb = flaskBx(t);
    flaskB.g.position.x = xb;
    flaskB.g.visible = t > CH.blank.start - 1;
    const water = new THREE.Color('#dbeef7').lerp(new THREE.Color('#ffb8d8'), clamp01(waterPink(t) / 0.55));
    flaskB.set(3.6, water.getStyle(), t, t > REFILL3 ? swirl : 0, t > REFILL3 ? flashAt(t) * 0.6 : 0);
    // burette level, stopcock, drops
    const fill = prog(t, W.fillBur, W.fillBur + 3.0);
    const level = lerp(taperTop + 0.2, zeroY - readingAt(t), fill);
    col.scale.y = Math.max(0.01, level - taperTop);
    col.position.y = (level + taperTop) / 2;
    men.position.y = level + 0.02;
    men.scale.y = 0.35;
    hpivot.rotation.z = (1 - clamp01(openAt(t))) * (Math.PI / 2);
    hang.visible = clamp01(openAt(t)) > 0.5;
    hang.scale.set(1, 1 + 0.35 * ((t * 2.4) % 1), 1);
    const surf = F0 + (t > REFILL3 ? 3.6 : lvA);
    let fi = 0;
    for (const m of falling) m.visible = false;
    for (const d of DROPS) {
      const k = (t - d) / 0.3;
      if (k < 0 || k > 1 || fi >= falling.length) continue;
      const m = falling[fi++];
      m.visible = true;
      m.position.set(0, tipEnd - 0.3 - (tipEnd - 0.3 - surf) * k * k, 0);
    }
    // pipette: milk at the pour, formalin later
    const pm = prog(t, W.pour - 1.0, W.pour - 0.1) * (1 - prog(t, W.pour + 2.5, W.pour + 3.3));
    const pf = prog(t, W.formPour - 0.6, W.formPour) * (1 - prog(t, W.formPour + 1.9, W.formPour + 2.6));
    const pk = Math.max(pm, pf);
    pip.visible = pk > 0.001;
    pip.position.set(SIDE, lerp(60, F0 + 9.5, eout(pk)), 0);
    const isF = pf > pm;
    pipLiq.material.color.set(isF ? '#e4f5cf' : P.milk);
    const drain = isF ? prog(t, W.formPour + 0.1, W.formPour + 1.9) : prog(t, W.pour + 0.2, W.pour + 2.4);
    pipLiq.scale.y = Math.max(0.01, 1 - drain);
    pipLiq.position.y = 14.2 + 2.3 * (1 - drain);
    const pouring = isF ? win(t, W.formPour + 0.1, W.formPour + 1.9, 0.15, 0.2) : win(t, W.pour + 0.2, W.pour + 2.4, 0.15, 0.2);
    stream.visible = pk > 0.9 && pouring > 0.01;
    const sTop = pip.position.y;
    const sBot = F0 + Math.max(0.4, lvA);
    stream.scale.set(pouring, Math.max(0.01, sTop - sBot), pouring);
    stream.position.set(SIDE, (sTop + sBot) / 2, 0);
    // dropper
    const dk = prog(t, W.drops - 0.9, W.drops - 0.2) * (1 - prog(t, W.drops + 1.6, W.drops + 2.2));
    dropper.visible = dk > 0.001;
    dropper.position.set(SIDE, lerp(60, F0 + 16, eout(dk)), 0);
    const dts = [0, 0.45, 0.9].map((o) => W.drops + o);
    bulb.scale.set(1 - 0.18 * dts.reduce((a, d) => a + Math.max(0, 1 - Math.abs(t - d + 0.05) / 0.12), 0), 1.5, 1);
    indDrop.visible = false;
    for (const d of dts) {
      const k = (t - d) / 0.35;
      if (k >= 0 && k <= 1) {
        indDrop.visible = true;
        indDrop.position.set(SIDE, F0 + 16 - (16 - Math.max(0.4, lvA)) * k * k, 0);
      }
    }
    // demo flasks highlight
    demo.forEach((f, i) => {
      const at = [W.colorless, W.faint, W.deep][i];
      const pop = spring(t, at, 6, 2.4) * (1 - prog(t, at + 1.2, at + 1.8)) * 0.06;
      f.g.position.y = pop * 30 * (t > at ? 1 : 0);
    });
    anchors.burTop = V(0.6, zeroY - readingAt(t) + 0.2, 0);
    anchors.cock = V(2.3, cock + 1.6, 0);
    anchors.flaskA = V(xa + 3.2, F0 + 5, 0);
    anchors.flaskAhi = V(xa, F0 + 14.8, 0);
    anchors.flaskB = V(xb + 3.2, F0 + 5, 0);
    anchors.side = V(SIDE + 3.0, F0 + 4.5, 0);
    anchors.pip = V(SIDE + 1.0, F0 + 22, 0);
    anchors.dropper = V(SIDE + 1.2, F0 + 27, 0);
    anchors.bur = V(0.7, 40, 0);
    anchors.demo0 = V(60, 9.6, 6);
    anchors.demo1 = V(71, 9.6, 6);
    anchors.demo2 = V(82, 9.6, 6);
    anchors.beaker = V(beakerX + 4, 12.6, 6);
  };
  return {scene, camAt, update, anchors, focusOf: (c) => c.pos.distanceTo(c.look), aperture: 0.00024, maxblur: 0.013, bloom: false, exposure: 0.92};
}

/* ------------------------------------------------------------------ MILK world */

function buildMilk(env) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f7efe3');
  scene.environment = env;
  scene.environmentIntensity = 0.8;
  scene.fog = new THREE.Fog('#f7efe3', 6, 70);
  scene.add(new THREE.HemisphereLight('#ffffff', '#f1dcc8', 1.0));
  const key = new THREE.DirectionalLight('#fffaf0', 1.6);
  key.position.set(-10, 20, 12);
  scene.add(key);
  // casein micelles: bumpy "raspberries"
  const geo = new THREE.IcosahedronGeometry(1, 4);
  const p = geo.attributes.position;
  const n0 = mulberry(4);
  const bumps = Array.from({length: 40}, () => V(n0() - 0.5, n0() - 0.5, n0() - 0.5).normalize());
  for (let i = 0; i < p.count; i++) {
    const v = V(p.getX(i), p.getY(i), p.getZ(i)).normalize();
    let d = 0;
    for (const b of bumps) d = Math.max(d, Math.pow(Math.max(0, v.dot(b)), 18));
    v.multiplyScalar(1 + 0.12 * d);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshPhysicalMaterial({color: '#fffbf3', roughness: 0.55, sheen: 0.8, sheenColor: '#ffffff', clearcoat: 0.2});
  const N = 90;
  const mic = new THREE.InstancedMesh(geo, mat, N);
  const r = mulberry(9);
  const mdata = [];
  for (let i = 0; i < N; i++) {
    const z = -r() * 110 + 8;
    const a = r() * Math.PI * 2;
    const rad = 4 + r() * 14;
    mdata.push({x: Math.cos(a) * rad, y: Math.sin(a) * rad * 0.7, z, s: 0.8 + r() * 1.8, ph: r() * 6});
  }
  scene.add(mic);
  const fat = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshPhysicalMaterial({color: '#fff3d6', roughness: 0.15, clearcoat: 1, transmission: 0.0}), 24);
  const fdata = Array.from({length: 24}, () => ({x: (r() - 0.5) * 40, y: (r() - 0.5) * 24, z: -r() * 110, s: 1.6 + r() * 2.5}));
  scene.add(fat);
  // protein chain of amino-acid beads
  const COLS = [P.violet, P.cyan, P.coral, '#f5b51f', P.lime, '#ff8fb8'];
  const NB = 13;
  const HERO = 6;
  const beads = Array.from({length: NB}, (_, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), new THREE.MeshPhysicalMaterial({color: i === HERO ? P.violet : COLS[i % COLS.length], roughness: 0.25, clearcoat: 1}));
    scene.add(m);
    return m;
  });
  const links = Array.from({length: NB - 1}, () => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1, 12), new THREE.MeshPhysicalMaterial({color: '#8a7fb5', roughness: 0.4}));
    scene.add(m);
    return m;
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.09, 12, 64), new THREE.MeshBasicMaterial({color: P.gold}));
  scene.add(ring);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({map: radialTex(P.gold, 0.7, 0.2), transparent: true, depthWrite: false}));
  scene.add(halo);
  const CZ = -78;
  const beadPos = (i, t) => {
    const u = prog(t, sa(3) - 0.2, sa(3) + 1.6);
    const x = (i - HERO) * 2.6;
    const coil = (1 - u) * 1;
    const y = coil * 3.2 * Math.sin(i * 0.9 + t * 1.3) + Math.sin(t * 1.5 + i * 0.5) * 0.25;
    const z = CZ + coil * 3 * Math.cos(i * 1.1 + t);
    return V(x * (0.6 + 0.4 * u), y, z);
  };
  const camAt = (t) => {
    const t0 = CH.protein.start + 2.3;
    const k = prog(t, t0, sa(3) + 0.8, (x) => 1 - Math.pow(1 - x, 2));
    const z = lerp(8, CZ + 16, k);
    const pos = V(Math.sin(t * 0.4) * 1.2, 0.8 + Math.sin(t * 0.3) * 0.6, z);
    const look = V(0, 0, z - 20).lerp(V(0, 0, CZ), prog(t, sa(3) - 1, sa(3) + 0.8));
    // final dive into the hero bead
    const dive = prog(t, CH.amino.start - 1.4, CH.amino.start, ein);
    const hp = beadPos(HERO, t);
    pos.lerp(hp.clone().add(V(0, 0, 1.0)), dive);
    look.lerp(hp, dive);
    return {pos, look, fov: lerp(46, 40, k)};
  };
  const dummy = new THREE.Object3D();
  const anchors = {};
  const update = (t) => {
    mdata.forEach((d, i) => {
      dummy.position.set(d.x + Math.sin(t * 0.3 + d.ph) * 0.8, d.y + Math.cos(t * 0.25 + d.ph) * 0.6, d.z);
      dummy.rotation.set(t * 0.1 + d.ph, t * 0.07, 0);
      dummy.scale.setScalar(d.s);
      dummy.updateMatrix();
      mic.setMatrixAt(i, dummy.matrix);
    });
    mic.instanceMatrix.needsUpdate = true;
    fdata.forEach((d, i) => {
      dummy.position.set(d.x, d.y + Math.sin(t * 0.4 + i) * 0.5, d.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(d.s);
      dummy.updateMatrix();
      fat.setMatrixAt(i, dummy.matrix);
    });
    fat.instanceMatrix.needsUpdate = true;
    const appear = prog(t, CH.protein.start + 4.0, sa(3) - 0.2);
    const ps = beads.map((_, i) => beadPos(i, t));
    beads.forEach((b, i) => {
      const k = clamp01(appear * 1.8 - Math.abs(i - HERO) * 0.1);
      b.position.copy(ps[i]);
      b.scale.setScalar(k * (i === HERO ? 1 + 0.25 * prog(t, sa(3) + 0.3, sa(3) + 1.0) : 1));
      b.visible = k > 0.01;
    });
    links.forEach((l, i) => {
      const a = ps[i];
      const b = ps[i + 1];
      const k = Math.min(beads[i].scale.x, beads[i + 1].scale.x);
      l.visible = k > 0.05;
      const d = b.clone().sub(a);
      l.position.copy(a).addScaledVector(d, 0.5);
      l.scale.set(1, d.length(), 1);
      l.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
    });
    const hk = prog(t, sa(3) + 0.3, sa(3) + 0.9) * (1 - prog(t, CH.amino.start - 0.8, CH.amino.start - 0.3));
    ring.position.copy(ps[HERO]);
    ring.scale.setScalar(Math.max(0.01, hk));
    ring.rotation.set(Math.PI / 2 - 0.3, t * 0.8, 0);
    ring.visible = hk > 0.01;
    halo.position.copy(ps[HERO]);
    halo.scale.setScalar(6 * hk);
    halo.visible = hk > 0.01;
    // the counting wave (sentence 4): beads pulse one after another
    const cnt = prog(t, sa(4) + 0.4, sa(4) + 2.6, (x) => x);
    beads.forEach((b, i) => {
      const ph = cnt * NB - i;
      if (ph > 0 && ph < 1.2) b.scale.multiplyScalar(1 + 0.3 * Math.sin((ph / 1.2) * Math.PI));
    });
    anchors.hero = ps[HERO].clone().add(V(0, 1.8, 0));
    anchors.mic = V(mdata[3].x, mdata[3].y + mdata[3].s + 0.5, mdata[3].z);
    const fogK = prog(t, CH.protein.start + 2.2, CH.protein.start + 3.4);
    scene.fog.near = lerp(0.2, 6, fogK);
    scene.fog.far = lerp(4, 70, fogK);
  };
  return {scene, camAt, update, anchors, focusOf: (c) => Math.max(4, c.pos.distanceTo(V(0, 0, CZ))), aperture: 0.0016, maxblur: 0.012, bloom: false, exposure: 0.95};
}

/* ------------------------------------------------------------------ MOLECULAR world */

function buildMol(env) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(P.navy);
  scene.environment = env;
  scene.environmentIntensity = 0.55;
  scene.fog = new THREE.Fog(P.navy, 22, 70);
  scene.add(new THREE.HemisphereLight('#9fb4ff', '#0a1230', 0.5));
  const key = new THREE.DirectionalLight('#ffffff', 1.6);
  key.position.set(-6, 10, 8);
  scene.add(key);
  const EL = {C: [0.42, '#3d4566'], H: [0.27, '#f2f5ff'], O: [0.4, P.coral], N: [0.4, '#2e7dff'], R: [0.62, P.violet]};
  const mats = {};
  for (const [el, [, c]] of Object.entries(EL)) mats[el] = new THREE.MeshPhysicalMaterial({color: c, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08});
  const sphere = new THREE.SphereGeometry(1, 48, 32);
  const cyl = new THREE.CylinderGeometry(1, 1, 1, 20);

  const BASE = {
    Ca: ['C', [0, 0, 0]], R: ['R', [0, -1.55, -0.35]], Ha: ['H', [-0.25, 0.75, 1.0]], N: ['N', [1.45, 0.55, 0]],
    HN1: ['H', [2.2, -0.15, 0.55]], HN2: ['H', [2.05, 1.35, -0.5]], Cc: ['C', [-1.5, 0.5, 0]], O1: ['O', [-1.75, 1.7, 0.35]],
    O2: ['O', [-2.55, -0.35, -0.25]], HO: ['H', [-3.35, 0.1, -0.35]], Cf: ['C', [0, 0, 0]], Of: ['O', [0, 0, 0]], Hf1: ['H', [0, 0, 0]], Hf2: ['H', [0, 0, 0]],
  };
  const BONDS = [['Ca', 'R'], ['Ca', 'Ha'], ['Ca', 'N'], ['Ca', 'Cc'], ['N', 'HN1'], ['N', 'HN2'], ['Cc', 'O1', 2], ['Cc', 'O2'], ['O2', 'HO'], ['Cf', 'Of', 2], ['Cf', 'Hf1'], ['Cf', 'Hf2'], ['N', 'Cf', 2], ['Of', 'HN1'], ['Of', 'HN2']];
  const mol = new THREE.Group();
  scene.add(mol);
  const atomM = {};
  for (const [id, [el]] of Object.entries(BASE)) {
    const m = new THREE.Mesh(sphere, mats[el]);
    m.scale.setScalar(EL[el][0]);
    mol.add(m);
    atomM[id] = m;
  }
  const bondM = BONDS.map(([a, b, o = 1]) => {
    const parts = [];
    for (const off of o === 2 ? [-1, 1] : [0]) {
      for (const half of [0, 1]) {
        const el = BASE[half ? b : a][0];
        const m = new THREE.Mesh(cyl, mats[el].clone());
        m.material.transparent = true;
        mol.add(m);
        parts.push({m, off, half});
      }
    }
    return {a, b, o, parts};
  });
  const sprite = (c, s) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: radialTex(c, 0.5, 0.17), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true}));
    sp.scale.setScalar(s);
    mol.add(sp);
    return sp;
  };
  const gN = sprite(P.cyan, 3.6);
  const gC = sprite(P.coral, 4.0);
  const gF = sprite(P.lime, 3.0);
  const flash = sprite('#ffffff', 1);
  const lN = new THREE.PointLight(P.cyan, 0, 6, 2);
  const lC = new THREE.PointLight(P.coral, 0, 6, 2);
  const lF = new THREE.PointLight(P.lime, 0, 6, 2);
  mol.add(lN, lC, lF);
  // trail of HCHO
  const trail = Array.from({length: 14}, () => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({color: P.lime, transparent: true}));
    mol.add(m);
    return m;
  });
  // chain of product copies for sentence 11 (protein = many amino acids)
  const copies = [];
  const prodGroup = new THREE.Group();
  scene.add(prodGroup);
  const prodTemplate = () => {
    const g = new THREE.Group();
    const at = {Ca: ['C', [0, 0, 0]], R: ['R', [0, -1.55, -0.35]], N: ['N', [1.45, 0.55, 0]], Cf: ['C', [2.75, 0.6, 0]], Cc: ['C', [-1.5, 0.5, 0]], O1: ['O', [-1.75, 1.7, 0.35]], O2: ['O', [-2.55, -0.35, -0.25]]};
    for (const [, [el, p]] of Object.entries(at)) {
      const m = new THREE.Mesh(sphere, mats[el]);
      m.scale.setScalar(EL[el][0]);
      m.position.set(...p);
      g.add(m);
    }
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map: radialTex(P.coral, 0.55, 0.2), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true}));
    s.position.set(-1.9, 0.6, 0);
    g.add(s);
    g.userData.glow = s;
    return g;
  };
  for (let i = 0; i < 9; i++) {
    const g = prodTemplate();
    prodGroup.add(g);
    copies.push(g);
  }
  // bokeh dust
  const r = mulberry(3);
  const dust = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({color: '#7fa2ff', transparent: true, opacity: 0.5}), 160);
  const dd = Array.from({length: 160}, () => ({x: (r() - 0.5) * 50, y: (r() - 0.5) * 28, z: -r() * 34 + 6, s: 0.04 + r() * 0.08, ph: r() * 6}));
  scene.add(dust);
  const pinkDust = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({color: P.pink}), 20);
  const pd = Array.from({length: 20}, () => ({x: (r() - 0.5) * 50, y: (r() - 0.5) * 28, z: -r() * 34 + 6, s: 0.06 + r() * 0.06, ph: r() * 6}));
  scene.add(pinkDust);
  const dummy = new THREE.Object3D();

  const NEAR = [3.55, 1.45, 0.35];
  const FAR = [9, 6, 1.5];
  const CF_END = [2.75, 0.6, 0];
  const OF_REL = [0.85, 0.85, 0];
  const AWAY = [8, 6.5, 1];
  const L3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

  const amStart = CH.amino.start;
  const camAt = (t) => {
    // pull back out of the R bead, then orbit with the story
    const back = prog(t, amStart, amStart + 2.6, eout);
    let pos = V(0, -1.55, 1.3).lerp(V(0.6, 0.3, 13.5), back);
    let look = V(0, -1.55, -0.35).lerp(V(0.2, 0.1, 0), back);
    const toN = prog(t, sa(5), sa(5) + 1.6) * (1 - prog(t, sa(6) - 0.3, sa(6) + 1.0));
    const toC = prog(t, sa(6), sa(6) + 1.4) * (1 - prog(t, sa(7), sa(7) + 1.4));
    pos = pos.add(V(3.5 * toN - 3.2 * toC, 0.4 * (toN + toC), -3.5 * (toN + toC)));
    look = look.add(V(1.2 * toN - 1.4 * toC, 0, 0));
    const re = prog(t, CH.react.start, sa(8) + 1.2);
    pos.lerp(V(2.6, 1.4, 12.5), re);
    look.lerp(V(1.6, 0.8, 0), re);
    const hit = prog(t, W.bond - 0.2, W.cancel);
    pos.lerp(V(3.2, 1.2, 8.5), hit * (1 - prog(t, W.water + 0.3, W.free)));
    const toAcid = prog(t, W.free - 0.4, W.free + 1.0) * (1 - prog(t, sa(11) - 0.2, sa(11) + 0.8));
    pos.lerp(V(-2.2, 1.2, 8.0), toAcid);
    look.lerp(V(-1.4, 0.6, 0), toAcid);
    const pull = prog(t, sa(11), sa(11) + 3.2);
    pos.lerp(V(4, 3, 34), pull);
    look.lerp(V(0, 0, 0), pull);
    const exitK = prog(t, CH.react.end - 1.2, CH.react.end, ein);
    pos.lerp(V(0, 2, 70), exitK);
    pos.x += Math.sin(t * 0.5) * 0.25;
    pos.y += Math.sin(t * 0.37) * 0.18;
    return {pos, look, fov: 34};
  };
  const anchors = {};
  const update = (t) => {
    mol.rotation.set(0.1 + Math.sin(t * 0.3) * 0.08, -0.3 + Math.sin(t * 0.22) * 0.18, 0);
    const approach = prog(t, sa(8) + 0.2, W.bond - 0.2, eout) * 0.8 + prog(t, W.bond - 0.2, W.cancel - 0.25) * 0.2;
    const c = L3(FAR, NEAR, approach);
    const k = prog(t, W.cancel - 0.35, W.cancel + 0.35);
    const fly = prog(t, W.water - 0.2, W.water + 2.0, ein);
    const wc = L3(add(c, OF_REL), AWAY, fly);
    const wo = 1 - prog(t, W.water + 1.2, W.water + 2.0);
    const hin = prog(t, sa(8), sa(8) + 0.6);
    const pos = {
      ...Object.fromEntries(Object.entries(BASE).map(([id, [, p]]) => [id, p])),
      Cf: L3(c, CF_END, k),
      Of: k < 1 ? L3(add(c, OF_REL), wc, k) : wc,
      Hf1: L3(add(c, [-0.35, 0.95, 0.5]), add(CF_END, [0.6, 0.9, 0.4]), k),
      Hf2: L3(add(c, [0.45, -0.8, -0.6]), add(CF_END, [0.55, -0.95, -0.35]), k),
      HN1: L3([2.2, -0.15, 0.55], add(wc, [-0.62, -0.48, 0.2]), k),
      HN2: L3([2.05, 1.35, -0.5], add(wc, [0.62, -0.48, -0.2]), k),
    };
    const op = {Cf: hin, Of: hin * (k > 0.5 ? wo : 1), Hf1: hin, Hf2: hin, HN1: k > 0.5 ? wo : 1, HN2: k > 0.5 ? wo : 1};
    const shrink = 1 - prog(t, sa(11) + 0.6, sa(11) + 2.2);
    for (const [id, m] of Object.entries(atomM)) {
      m.position.set(...pos[id]);
      const o = op[id] ?? 1;
      m.visible = o > 0.02 && shrink > 0.02;
      m.scale.setScalar(EL[BASE[id][0]][0] * Math.min(1, o * 1.2) * shrink);
    }
    const kk = clamp01((k - 0.35) / 0.4);
    const bo = {N_HN1: 1 - clamp01(k * 2.5), N_HN2: 1 - clamp01(k * 2.5), Cf_Of: (1 - clamp01(k * 2.5)) * hin, Cf_Hf1: hin, Cf_Hf2: hin, N_Cf: kk, Of_HN1: kk * wo, Of_HN2: kk * wo};
    for (const B of bondM) {
      const o = (bo[`${B.a}_${B.b}`] ?? 1) * shrink;
      const A = V(...pos[B.a]);
      const Bv = V(...pos[B.b]);
      const d = Bv.clone().sub(A);
      const len = d.length();
      const dir = d.clone().normalize();
      const side = new THREE.Vector3().crossVectors(dir, V(0, 0, 1)).normalize().multiplyScalar(0.11);
      for (const p of B.parts) {
        p.m.visible = o > 0.02 && len > 0.01;
        p.m.material.opacity = o;
        const w = B.o === 2 ? 0.07 : 0.1;
        p.m.scale.set(w, len / 2, w);
        p.m.position.copy(A).lerp(Bv, p.half ? 0.75 : 0.25).addScaledVector(side, p.off);
        p.m.quaternion.setFromUnitVectors(V(0, 1, 0), dir);
      }
    }
    // glows tell the chemistry
    const amine = prog(t, sa(5) + 0.2, sa(5) + 0.9) * (1 - 0.55 * prog(t, sa(7) + 0.6, sa(7) + 1.6)) + 0.45 * prog(t, sa(8), sa(8) + 0.6);
    const amineOff = 1 - prog(t, W.cancel, W.cancel + 0.6);
    const acid = prog(t, sa(6) + 0.1, sa(6) + 0.8) * (1 - 0.55 * prog(t, sa(7) + 0.6, sa(7) + 1.6));
    const acidHero = prog(t, W.free - 0.2, W.free + 0.5) * (0.8 + 0.2 * Math.sin(t * 7));
    const aN = clamp01(amine) * amineOff * shrink;
    const aC = clamp01(Math.max(acid, acidHero)) * shrink;
    gN.position.set(1.75, 0.6, 0);
    gN.material.opacity = aN;
    gN.scale.setScalar(3.6 * (1 + 0.06 * Math.sin(t * 5)));
    gC.position.set(-2.0, 0.6, 0);
    gC.material.opacity = aC;
    gC.scale.setScalar(4.0 * (1 + 0.25 * acidHero));
    const cf = pos.Cf;
    gF.position.set(cf[0], cf[1], cf[2]);
    gF.material.opacity = hin * (1 - prog(t, W.cancel, W.cancel + 1.2)) * 0.9;
    lN.position.set(1.75, 0.6, 1.5);
    lN.intensity = 6 * aN;
    lC.position.set(-2.0, 0.6, 1.5);
    lC.intensity = 6 * aC;
    lF.position.set(cf[0], cf[1], cf[2] + 1.2);
    lF.intensity = 5 * gF.material.opacity;
    const fk = prog(t, W.cancel - 0.05, W.cancel + 0.5, (x) => x);
    flash.position.set(2.1, 0.6, 0.3);
    flash.visible = fk > 0 && fk < 1;
    flash.scale.setScalar(1 + 9 * eout(fk));
    flash.material.opacity = (1 - fk) * 0.9;
    trail.forEach((m, i) => {
      const a2 = clamp01(approach - i * 0.04);
      const p = L3(FAR, NEAR, a2);
      m.position.set(p[0] + 0.35, p[1] + 0.25, p[2]);
      m.material.opacity = (1 - i / trail.length) * 0.7 * hin * (1 - prog(t, W.bond, W.cancel));
      m.visible = m.material.opacity > 0.01;
    });
    // sentence 11: the molecule becomes one link in a long protein; COOH glows ripple along it
    const grow = prog(t, sa(11) + 0.6, sa(11) + 2.2);
    prodGroup.visible = grow > 0.01;
    copies.forEach((g, i) => {
      const j = i - 4;
      g.position.set(j * 6.6, Math.sin(j * 0.9) * 1.8, Math.cos(j * 0.7) * 2.5 - 2);
      g.rotation.set(0.1, -0.3 + j * 0.25, j * 0.12);
      g.scale.setScalar(clamp01(grow * 2 - Math.abs(j) * 0.18));
      const wave = prog(t, W.amino11 - 0.8, W.protein11, (x) => x) * 11 - (i + 1);
      g.userData.glow.material.opacity = clamp01(wave);
      g.userData.glow.scale.setScalar(3.6);
    });
    prodGroup.rotation.y = mol.rotation.y;
    dd.forEach((d, i) => {
      dummy.position.set(d.x + Math.sin(t * 0.2 + d.ph) * 0.6, d.y + Math.cos(t * 0.17 + d.ph) * 0.5, d.z);
      dummy.scale.setScalar(d.s);
      dummy.updateMatrix();
      dust.setMatrixAt(i, dummy.matrix);
    });
    dust.instanceMatrix.needsUpdate = true;
    pd.forEach((d, i) => {
      dummy.position.set(d.x + Math.sin(t * 0.25 + d.ph) * 0.6, d.y, d.z);
      dummy.scale.setScalar(d.s);
      dummy.updateMatrix();
      pinkDust.setMatrixAt(i, dummy.matrix);
    });
    pinkDust.instanceMatrix.needsUpdate = true;
    mol.updateMatrixWorld();
    const w = (p) => V(...p).applyMatrix4(mol.matrixWorld);
    anchors.N = w(add(pos.HN2, [0, 0.5, 0]));
    anchors.C = w(add(pos.O1, [0, 0.55, 0]));
    anchors.F = w(add(pos.Hf2, [0.3, -0.5, 0]));
    anchors.W = w(add(wc, [0, 0.9, 0]));
    anchors.lock = w([1.6, 1.6, 0]);
    anchors.acid = w([-2.4, -0.9, 0]);
    const fogK = prog(t, CH.react.end - 1.2, CH.react.end);
    scene.fog.color.set(P.navy).lerp(new THREE.Color('#ffffff'), fogK);
    scene.background.set(P.navy).lerp(new THREE.Color('#ffffff'), fogK);
  };
  return {scene, camAt, update, anchors, focusOf: (c) => c.pos.distanceTo(c.look) - 0.5, aperture: 0.0032, maxblur: 0.015, bloom: true, exposure: 0.92};
}

/* ------------------------------------------------------------------ MACRO */

function dyeTexture() {
  const S = 1024;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const g = cv.getContext('2d');
  const r = mulberry(5);
  const N = 256;
  const vals = new Float32Array(N * N).map(() => r());
  const at = (x, y) => vals[(((y % N) + N) % N) * N + (((x % N) + N) % N)];
  const sm = (k) => k * k * (3 - 2 * k);
  const noise = (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = sm(x - xi);
    const fy = sm(y - yi);
    const a = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * fx;
    const b = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * fx;
    return a + (b - a) * fy;
  };
  g.filter = 'blur(10px)';
  const haze = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, 200);
  haze.addColorStop(0, 'rgba(255,90,170,0.5)');
  haze.addColorStop(1, 'rgba(255,90,170,0)');
  g.fillStyle = haze;
  g.fillRect(0, 0, S, S);
  g.filter = 'blur(0.6px)';
  g.lineCap = 'round';
  for (let p = 0; p < 2600; p++) {
    const a = r() * Math.PI * 2;
    const rr = Math.sqrt(r()) * 14;
    let x = S / 2 + Math.cos(a) * rr;
    let y = S / 2 + Math.sin(a) * rr;
    g.strokeStyle = `rgba(255,${40 + Math.floor(r() * 80)},${140 + Math.floor(r() * 50)},${0.12 + r() * 0.25})`;
    g.lineWidth = 0.5 + r() * 1.4;
    g.beginPath();
    g.moveTo(x, y);
    const len = 30 + r() * 90;
    for (let s = 0; s < len; s++) {
      const e = 1.5;
      const q = 0.02;
      const vx = (noise(x * q, (y + e) * q) - noise(x * q, (y - e) * q)) / (2 * e);
      const vy = -(noise((x + e) * q, y * q) - noise((x - e) * q, y * q)) / (2 * e);
      const ox = x - S / 2;
      const oy = y - S / 2;
      const d = Math.hypot(ox, oy) + 1;
      x += vx * 160 + (ox / d) * 1.3 + (-oy / d) * 0.6;
      y += vy * 160 + (oy / d) * 1.3 + (ox / d) * 0.6;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildMacro(env) {
  const scene = new THREE.Scene();
  scene.background = gradientBg('#c3c8d8', '#f1e4ea');
  scene.environment = env;
  scene.environmentIntensity = 0.85;
  scene.fog = new THREE.Fog('#e6dbe2', 20, 55);
  scene.add(new THREE.HemisphereLight('#ffffff', '#f0d6e0', 0.8));
  const key = new THREE.DirectionalLight('#ffffff', 2.0);
  key.position.set(-10, 20, 8);
  scene.add(key);
  const back = new THREE.DirectionalLight('#ffe1ee', 1.2);
  back.position.set(4, 6, -20);
  scene.add(back);
  const geo = new THREE.PlaneGeometry(44, 44, 200, 200);
  geo.rotateX(-Math.PI / 2);
  const base = geo.attributes.position.array.slice();
  const surf = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({color: P.milk, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.04, sheen: 0.4, sheenColor: '#ffffff'}));
  scene.add(surf);
  const dye = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({map: dyeTexture(), transparent: true, depthWrite: false}));
  dye.rotation.x = -Math.PI / 2;
  scene.add(dye);
  const dropMat = new THREE.MeshPhysicalMaterial({color: '#ffffff', roughness: 0, transmission: 1, thickness: 1.2, ior: 1.33, attenuationColor: '#cfe9ff', attenuationDistance: 4});
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.55, 40, 28), dropMat);
  scene.add(drop);
  const crownMat = new THREE.MeshPhysicalMaterial({color: '#fff1f5', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.7, sheenColor: '#ffffff', side: THREE.DoubleSide});
  const SP = 16;
  const cg = new THREE.CylinderGeometry(1.75, 1.25, 1, 72, 10, true);
  cg.translate(0, 0.5, 0);
  const cbase = cg.attributes.position.array.slice();
  const cup = new THREE.Mesh(cg, crownMat);
  scene.add(cup);
  const tips = Array.from({length: SP}, () => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), crownMat);
    scene.add(m);
    return m;
  });
  const camAt = (t) => {
    const k = prog(t, MACRO.a, MACRO.b, (x) => x);
    return {pos: V(lerp(-1.2, 1.2, k), lerp(2.6, 2.0, k), lerp(12.5, 10.5, k)), look: V(0, 1.0, 0), fov: 30};
  };
  const update = (t) => {
    const tt = t - MACRO.impact;
    const pre = tt < 0;
    drop.visible = pre || tt < 0.05;
    drop.position.set(0, pre ? 0.5 + -tt * 9 : 0.4, 0);
    drop.scale.set(0.85, 1.3, 0.85);
    const after = Math.max(0, tt);
    const H = 1.35 * Math.sin(Math.min(Math.PI, after * 3.6)) * (after > 0 ? 1 : 0);
    cup.visible = after > 0.02 && H > 0.05;
    const q = cg.attributes.position.array;
    const rr = 1 + after * 0.9;
    for (let i = 0; i < q.length; i += 3) {
      const x = cbase[i];
      const y = cbase[i + 1];
      const z = cbase[i + 2];
      const th = Math.atan2(z, x);
      const spike = Math.pow(Math.max(0, Math.cos(th * SP)), 6) * 0.55 * (H / 1.35);
      const flare = (1 + y * y * 0.35) * rr;
      q[i] = x * flare;
      q[i + 2] = z * flare;
      q[i + 1] = y * (H + spike) - 0.05;
    }
    cg.attributes.position.needsUpdate = true;
    cg.computeVertexNormals();
    tips.forEach((m, i) => {
      const a = (i / SP) * Math.PI * 2;
      m.visible = cup.visible && H > 0.6;
      m.position.set(Math.cos(a) * 1.75 * 1.35 * rr, H + 0.5 + (i % 3) * 0.12 + after * 1.5, Math.sin(a) * 1.75 * 1.35 * rr);
      m.scale.setScalar(0.75 + (i % 4) * 0.12);
    });
    const p = geo.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) {
      const x = base[i];
      const z = base[i + 2];
      const r = Math.hypot(x, z);
      const front = 7 * after;
      const env = after > 0 ? Math.exp(-r * 0.15) * (r < front ? 1 : Math.exp(-(r - front) * 3)) : 0;
      p[i + 1] = 0.2 * env * Math.sin(r * 3.2 - after * 22) * Math.exp(-after * 0.8);
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    // the pink appears with the drop, spreads, then fades: the milk is still acidic
    const grow = eout(after / 1.0);
    dye.scale.setScalar(2 + 14 * grow);
    dye.position.y = 0.06;
    dye.material.opacity = after > 0 ? clamp01(after / 0.15) * (1 - prog(t, MACRO.impact + 0.6, MACRO.b - 0.1)) : 0;
  };
  return {scene, camAt, update, anchors: {drop: V(0, 3.4, 0), bloom: V(-2.8, 0.3, 1.8)}, focusOf: () => 11, aperture: 0.0024, maxblur: 0.016, bloom: false, exposure: 0.92};
}

/* ------------------------------------------------------------------ shot list */

const shotAt = (t) => {
  if (t < CH.protein.start + 2.25) return 'lab';
  if (t < CH.amino.start) return 'milk';
  if (t < CH.react.end) return 'mol';
  if (t >= MACRO.a && t < MACRO.b) return 'macro';
  return 'lab';
};

/* ------------------------------------------------------------------ overlay */

const esc = (s) => s;
const M = (s) => `<span class="m">${s}</span>`;
const fadeStyle = (k, dy = 24) => `opacity:${k.toFixed(3)};transform:translateY(${((1 - k) * dy).toFixed(1)}px)`;

function overlay(t, shot, world, cam, w, h) {
  const out = [];
  const theme = shot === 'mol' ? 'dark' : 'light';
  const proj = (v) => {
    const p = v.clone().project(cam);
    return {x: (p.x * 0.5 + 0.5) * w, y: (-p.y * 0.5 + 0.5) * h, z: p.z};
  };
  const label = (key, a, b, color, html, below = false) => {
    if (t < a - 0.05 || t > b + 0.4) return;
    const v = world.anchors[key];
    if (!v) return;
    const q = proj(v);
    if (q.z > 1) return;
    const k = spring(t, a, 9, 1.6) * (1 - prog(t, b, b + 0.35));
    if (k <= 0.01) return;
    out.push(`<div class="lbl${below ? ' below' : ''}" style="left:${q.x}px;top:${q.y}px;transform:translate(-50%,${below ? '0' : '-100%'}) scale(${(0.7 + 0.3 * Math.min(1, k)).toFixed(3)});opacity:${clamp01(k).toFixed(3)}"><div class="card"><span class="dot" style="background:${color};box-shadow:0 0 12px ${color}"></span>${html}</div><div class="stem"></div></div>`);
  };
  const title = (a, b, html) => {
    const k = win(t, a, b, 0.5, 0.4);
    if (k <= 0.01) return;
    out.push(`<div class="ttl" style="${fadeStyle(k)}">${html}</div>`);
  };
  const badge = (a, b, n, color, txt) => {
    const k = win(t, a, b, 0.45, 0.4);
    if (k <= 0.01) return;
    out.push(`<div class="badge" style="${fadeStyle(k)}"><div class="n" style="background:${color}">${n}</div><div>${txt}</div></div>`);
  };
  const panel = (a, b, x, y, wd, html, dark = false) => {
    const k = win(t, a, b, 0.5, 0.4);
    if (k <= 0.01) return;
    out.push(`<div class="panel ${dark ? 'darkcard' : 'lightcard'}" style="left:${x}px;top:${y}px;width:${wd}px;${fadeStyle(eout(k), 40)}">${html}</div>`);
  };
  const appear = (a, d = 0.45) => clamp01((t - a) / d);
  const span = (a, html, extra = '') => `<span style="display:inline-block;${fadeStyle(eout(appear(a)), 16)};${extra}">${html}</span>`;

  // intro title over the lab
  if (t < CH.intro.end + 0.5) {
    const k = win(t, 0.5, CH.intro.end - 0.3, 0.6, 0.5);
    out.push(`<div style="position:absolute;top:70px;left:0;right:0;display:flex;justify-content:center;gap:28px;direction:rtl;${fadeStyle(k)}">
      <div style="width:150px;height:150px;border-radius:30px;background:#fff;padding:10px;box-shadow:0 14px 40px rgba(20,30,60,.2)"><img src="${ASU}" style="width:100%;height:100%;object-fit:contain"></div>
      <div style="width:240px;height:150px;border-radius:30px;background:#fff;padding:8px;box-shadow:0 14px 40px rgba(20,30,60,.2)"><img src="${FST}" style="width:100%;height:100%;object-fit:contain"></div></div>`);
    const k1 = win(t, 1.3, CH.intro.end - 0.4, 0.7, 0.5);
    const k2 = win(t, 2.0, CH.intro.end - 0.4, 0.7, 0.5);
    const k3 = win(t, 2.6, CH.intro.end - 0.4, 0.7, 0.5);
    out.push(`<div style="position:absolute;top:280px;left:0;right:0;text-align:center">
      <div style="font-weight:600;font-size:30px;color:#3a4766;${fadeStyle(k1)}">جامعة عين شمس · كلية الزراعة · قسم علوم الأغذية</div>
      <div style="font-weight:900;font-size:104px;line-height:1.25;color:#16213a;${fadeStyle(k1, 40)}">تقدير نسبة البروتين في اللبن</div>
      <div style="font-weight:900;font-size:80px;line-height:1.25;color:${P.pink};${fadeStyle(k2, 40)}">بطريقة الفورمول</div>
      <div style="${fadeStyle(k3)};margin-top:12px"><span class="m" style="font-size:26px;letter-spacing:.32em;color:#56627d">FORMOL TITRATION METHOD</span></div></div>`);
  }
  if (shot === 'milk') {
    title(CH.protein.start + 2.6, CH.amino.start - 0.6, 'داخل قطرة اللبن<small>بروتينات الكازين</small>');
    label('mic', CH.protein.start + 3.2, sa(3) - 0.6, '#c9b08a', 'ميسيلات الكازين');
    label('hero', sa(3) + 0.5, CH.amino.start - 0.7, P.violet, 'الحمض الأميني · الوحدة الأساسية');
    const k = win(t, sa(4) + 0.3, CH.amino.start - 0.6, 0.5, 0.4);
    if (k > 0.01) out.push(`<div style="position:absolute;bottom:150px;left:0;right:0;text-align:center;${fadeStyle(k)}"><div class="chip lightcard" style="font-size:38px">نعدّ الأحماض الأمينية <span style="color:${P.gold};margin:0 14px">⇐</span> نحسب نسبة البروتين</div></div>`);
  }
  if (shot === 'mol') {
    title(CH.amino.start + 1.0, CH.react.start - 0.2, 'العالم الجزيئي<small>تركيب الحمض الأميني</small>');
    title(CH.react.start + 0.3, sa(11) - 0.2, 'دور الفورمالين<small>الفورمالدهيد + مجموعة الأمين</small>');
    label('N', sa(5) + 0.3, sa(8) - 0.3, P.cyan, `مجموعة أمين ${M('NH₂')} · قاعدي`);
    label('C', sa(6) + 0.2, sa(8) - 0.3, P.coral, `مجموعة كربوكسيل ${M('COOH')} · حامضي`);
    const k7 = win(t, sa(7) + 0.7, sa(8) - 0.3, 0.45, 0.35);
    if (k7 > 0.01) out.push(`<div style="position:absolute;bottom:150px;left:0;right:0;text-align:center;${fadeStyle(k7)}"><div class="chip darkcard">⚖ متعادل <span style="opacity:.5;margin:0 16px">|</span> لا يمكن معايرته مباشرةً</div></div>`);
    label('F', sa(8) + 0.5, W.cancel - 0.4, P.lime, `فورمالدهيد ${M('HCHO')}`, true);
    label('W', W.water + 0.2, W.water + 1.5, '#9fd8ff', `جزيء ماء ${M('H₂O')}`);
    label('lock', W.cancel + 0.25, sa(11) - 0.3, P.lime, '🔒 أُلغي التأثير القاعدي');
    label('acid', W.free, sa(11) - 0.3, P.coral, `${M('COOH')} حرّة ← حامضية`, true);
    const ke = win(t, W.acidShow + 0.9, sa(11) + 0.4, 0.5, 0.4);
    if (ke > 0.01) {
      const eq = [['R–CH(', '#fff'], ['NH₂', P.cyan], [')–', '#fff'], ['COOH', P.coral], [' + ', '#8a96b8'], ['HCHO', P.lime], [' ⟶ ', P.gold], ['R–CH(', '#fff'], ['N=CH₂', P.lime], [')–', '#fff'], ['COOH', P.coral], [' + ', '#8a96b8'], ['H₂O', '#9fd8ff']]
        .map(([s, c], i) => `<span style="color:${c};display:inline-block;${fadeStyle(eout(appear(W.acidShow + 0.9 + i * 0.07, 0.4)), 14)}">${s}</span>`)
        .join('');
      out.push(`<div style="position:absolute;bottom:140px;left:0;right:0;text-align:center;${fadeStyle(ke)}"><div class="darkcard" style="display:inline-block;padding:16px 34px;border-radius:22px"><span class="m" style="font-size:36px;white-space:pre">${eq}</span></div></div>`);
    }
    if (t > sa(11) && t < CH.react.end + 0.2) {
      const kk = 1 - prog(t, CH.react.end - 0.8, CH.react.end - 0.3);
      const chips = [[`كل ${M('COOH')} نُعادلها`, P.coral, sa(11) + 0.3], ['حمض أميني', P.violet, W.amino11], ['بروتين', P.gold, W.protein11]];
      const html = chips
        .map(([s, c, a], i) => {
          const k = spring(t, a, 8, 1.8);
          return `${i ? `<span style="color:${P.gold};font-weight:900;font-size:56px;opacity:${clamp01(k)}">=</span>` : ''}<span class="chip" style="background:${c};color:#0a1230;transform:scale(${Math.max(0, k).toFixed(3)});opacity:${clamp01(k * 2)}">${s}</span>`;
        })
        .join('');
      out.push(`<div style="position:absolute;bottom:150px;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:22px;opacity:${kk}">${html}</div>`);
    }
  }
  if (shot === 'lab' && t > CH.setup.start - 0.5) {
    title(CH.setup.start + 0.4, sa(15) - 0.6, 'تجهيز التجربة<small>طريقة الفورمول</small>');
    label('side', W.pour + 0.8, W.drops - 0.4, P.milk === '#fff6ec' ? '#c9b08a' : P.milk, `${M('10 mL')} لبن`);
    label('dropper', W.drops + 0.2, W.fillBur - 0.6, P.violet, `${M('3')} نقط فينولفثالين`);
    label('burTop', W.fillBur + 2.4, se(13) + 0.2, P.blue, `سحاحة · ${M('NaOH 0.1 N')}`);
    label('demo0', W.colorless, se(14), '#c9b08a', 'حامضي · عديم اللون');
    label('demo1', W.faint, se(14), P.pink, 'متعادل · وردي خفيف ✓');
    label('demo2', W.deep, se(14), P.deep, 'قلوي · أحمر وردي');
    badge(CH.t1.start + 0.4, CH.t1.end - 0.2, '1', P.cyan, 'المعايرة الأولى · الحموضة الطبيعية');
    label('flaskA', sa(15) + 1.2, W.dropwise - 0.4, '#c9b08a', 'لبن + فينولفثالين');
    label('cock', W.dropwise - 0.3, MACRO.a - 0.05, P.blue, 'نقطة… نقطة… مع الرجّ');
    label('flaskA', W.stop - 0.1, se(16), P.pink, '✋ قف! وردي خفيف ثابت');
    label('burTop', sa(17) + 1.7, se(17) - 0.2, P.blue, `القراءة ${M('1.6 mL')}`, true);
    const ka = appear(W.acidCalc - 0.1, 0.5);
    panel(W.acidCalc - 0.1, se(17) + 0.3, 1000, 260, 820, `<div style="font-weight:900;font-size:44px">نسبة الحموضة %<span style="font-size:24px;font-weight:600;opacity:.6;margin-right:12px">كحمض لاكتيك</span></div>
      <div style="text-align:center;font-size:34px;margin-top:16px"><span class="m"><span class="frac"><i>V × N × 90</i><b></b><u>10 × 1000</u></span> × 100</span></div>
      <div style="text-align:center;font-size:34px;margin-top:14px;color:${P.blue}">${span(W.acidCalc + 1.6, `<span class="m"><span class="frac"><i>1.6 × 0.1 × 90</i><b></b><u>10 × 1000</u></span> × 100</span>`)}</div>
      <div style="text-align:center;margin-top:16px">${span(W.acidNum, `<span class="m" style="font-size:66px;color:${P.pink}">= 0.144 %</span>`)}</div>`);
    void ka;
    badge(CH.form.start + 0.3, CH.form.end - 0.2, '2', P.lime, 'إضافة الفورمالين');
    label('pip', W.formPour + 0.2, W.formPour + 2.0, P.lime, `${M('2 mL')} فورمالين`);
    label('flaskA', W.vanish, W.whyFree + 2.0, P.ink, '😮 اختفى اللون الوردي!');
    const kw = win(t, W.whyFree, se(20) + 0.3, 0.45, 0.35);
    if (kw > 0.01) {
      const steps = [[`${M('COOH')} تحرّرت`, P.coral, W.whyFree], ['الوسط حامضي', P.ink, W.whyFree + 0.9], ['الدليل عديم اللون', '#7a8399', W.whyFree + 1.8]];
      out.push(`<div style="position:absolute;top:260px;right:90px;display:flex;flex-direction:column;gap:14px;align-items:flex-start;opacity:${kw}">${steps.map(([s, c, a]) => span(a, `<div class="chip lightcard" style="font-size:32px;color:${c}">${s}</div>`)).join('')}${span(W.noInd, `<div class="chip" style="font-size:30px;background:${P.lime};color:#0a1230">✓ لا نحتاج دليلاً جديداً</div>`)}</div>`);
    }
    badge(CH.t2.start + 0.3, CH.t2.end - 0.2, '3', P.pink, 'المعايرة الثانية');
    label('burTop', REFILL2 + 0.1, W.t2drops - 0.5, P.blue, 'نُصفّر السحاحة', true);
    label('flaskA', T2.end + 0.1, sa(22) + 0.5, P.pink, '✋ عاد الوردي الخفيف');
    label('burTop', sa(22) + 1.0, se(22) - 0.1, P.blue, `القراءة ${M('2.0 mL')}`, true);
    panel(sa(22) + 1.3, se(22) + 0.2, 1040, 300, 760, `<div style="font-weight:900;font-size:40px">حجم المعايرة الثانية</div><div style="text-align:center"><span class="m" style="font-size:96px;color:${P.pink}">2.0<span style="font-size:40px"> mL</span></span></div><div style="font-weight:700;font-size:28px;opacity:.75;text-align:center">⇐ يُعبّر عن الأحماض الأمينية (البروتين)</div>`);
    badge(CH.blank.start + 0.3, CH.blank.end - 0.2, '4', '#4aa8e0', 'تجربة البلانك');
    label('flaskA', sa(23) + 1.6, CH.blank.end - 0.3, P.pink, `لبن · ${M('2.0 mL')}`);
    label('flaskB', W.water23, sa(24) + 1.0, '#4aa8e0', 'ماء مقطر + فورمالين + دليل');
    label('flaskB', TB.end + 0.2, CH.blank.end - 0.3, P.pink, `ماء · ${M('0.2 mL')}`);
    panel(W.fn - 0.1, CH.blank.end - 0.1, 1060, 250, 760, `<div style="font-weight:900;font-size:44px">رقم الفورمول</div>
      <div style="font-weight:700;font-size:28px;opacity:.75;margin:6px 0 14px">= حجم اللبن − حجم البلانك</div>
      <div style="text-align:center;font-size:76px" class="m">${span(W.fnTwo, '<span style="color:#d6337f">2.0</span>')} ${span(W.fnMinus, '<span>− <span style="color:#4aa8e0">0.2</span></span>')} ${span(W.fnRes, `<span style="color:${P.gold}">= 1.8</span>`)}</div>`);
    // calculation
    if (t > CH.calc.start - 0.2 && t < CH.calc.end + 0.5) {
      const kc = win(t, CH.calc.start + 0.2, CH.calc.end, 0.5, 0.45);
      const cnt = prog(t, W.cowRes - 0.6, W.cowRes + 0.4, eout);
      out.push(`<div style="position:absolute;inset:0;background:rgba(232,237,243,${(0.35 * kc).toFixed(3)})"></div>`);
      title(CH.calc.start + 0.2, CH.calc.end, 'حساب نسبة البروتين');
      panel(CH.calc.start + 0.4, CH.calc.end, 980, 230, 840, `<div style="font-weight:900;font-size:46px">🐄 اللبن البقري</div><div style="font-weight:700;font-size:30px;opacity:.75">% البروتين = رقم الفورمول × ${M('1.67')}</div>
        <div style="text-align:center;margin-top:18px">${span(W.cowMul, `<span class="m" style="font-size:62px">1.8 × 1.67</span>`)}</div>
        <div style="text-align:center">${span(W.cowRes - 0.6, `<span class="m" style="font-size:84px;color:${P.pink}">≈ ${(3.006 * cnt).toFixed(2)} %</span>`)}</div>`);
      panel(sa(27) - 0.1, CH.calc.end, 100, 230, 840, `<div style="font-weight:900;font-size:46px">🐃 اللبن الجاموسي</div><div style="font-weight:700;font-size:30px;opacity:.75">% البروتين = رقم الفورمول × ${M('1.66')}</div>
        <div style="font-weight:700;font-size:30px;margin-top:30px;opacity:${appear(W.range - 0.4).toFixed(2)}">المعدل الطبيعي للبروتين</div>
        <div style="text-align:center">${span(W.range, `<span class="m" style="font-size:80px;color:#2a8fd0">3.3 – 4.5 %</span>`)}</div>`);
      const g = prog(t, W.range, W.range + 1.4);
      if (g > 0) {
        const gx = (v) => 160 + (v / 5) * 1600;
        out.push(`<svg width="${w}" height="${h}" style="position:absolute;inset:0;opacity:${g}">
          <rect x="${gx(0)}" y="790" width="${gx(5) - gx(0)}" height="18" rx="9" fill="#c9d3df"/>
          <rect x="${gx(3.3)}" y="782" width="${(gx(4.5) - gx(3.3)) * g}" height="34" rx="10" fill="#2a8fd0"/>
          ${[0, 1, 2, 3, 4, 5].map((v) => `<text x="${gx(v)}" y="852" text-anchor="middle" font-family="JetBrains Mono" font-weight="700" font-size="24" fill="#56627d">${v}%</text>`).join('')}
          <circle cx="${gx(3.006 * g)}" cy="799" r="18" fill="${P.pink}" stroke="#fff" stroke-width="4"/>
          <text x="${gx(3.006 * g)}" y="764" text-anchor="middle" font-family="Cairo" font-weight="800" font-size="26" fill="${P.pink}">بقري 3.0</text></svg>`);
      }
    }
    // summary + credits
    if (t > CH.outro.start - 0.2) {
      const ks = win(t, sa(29), W.credits - 1.6, 0.4, 0.5);
      const STEPS = [['1', 'معايرة الحموضة الطبيعية', P.cyan], ['2', 'إضافة 2 مل فورمالين', P.lime], ['3', 'المعايرة الثانية', P.pink], ['4', 'تجربة البلانك', '#4aa8e0'], ['5', 'رقم الفورمول × 1.67', P.gold]];
      if (ks > 0.01)
        out.push(`<div style="position:absolute;top:330px;left:0;right:0;display:flex;justify-content:center;gap:20px;opacity:${ks}">${STEPS.map(([n, s, c], i) => {
          const k = spring(t, sa(29) + 0.25 + i * 0.32, 8, 1.6);
          return `<div class="lightcard" style="width:310px;height:220px;border-radius:26px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;transform:translateY(${((1 - Math.min(1, k)) * 60).toFixed(1)}px) scale(${(0.85 + 0.15 * Math.min(1, k)).toFixed(3)});opacity:${clamp01(k * 1.5)};border:2px solid ${c}"><div style="width:68px;height:68px;border-radius:20px;background:${c};color:#fff;font-weight:900;font-size:40px;display:grid;place-items:center">${n}</div><div style="font-weight:800;font-size:30px;line-height:1.35">${s}</div></div>`;
        }).join('')}</div>`);
      const kc = clamp01((t - (W.credits - 1.4)) / 0.6);
      if (kc > 0.01) {
        const NAMES = ['رقية أحمد عبدالعظيم', 'زينب ابراهيم عبدالفتاح', 'سهام مجدي سيد', 'شاهندا ياسر عبدالرحمن', 'شهد حماده احمد'];
        const ln = (a, html) => span(a, html);
        out.push(`<div style="position:absolute;inset:0;background:rgba(240,244,248,${(0.55 * kc).toFixed(3)})"></div>
        <div style="position:absolute;top:56px;left:0;right:0;text-align:center;opacity:${kc}">
          <div style="display:flex;justify-content:center;gap:28px;direction:rtl">${ln(W.credits - 1.4, `<div style="width:170px;height:170px;border-radius:30px;background:#fff;padding:10px;box-shadow:0 14px 40px rgba(20,30,60,.18)"><img src="${ASU}" style="width:100%;height:100%;object-fit:contain"></div>`)}${ln(W.credits - 1.2, `<div style="width:272px;height:170px;border-radius:30px;background:#fff;padding:8px;box-shadow:0 14px 40px rgba(20,30,60,.18)"><img src="${FST}" style="width:100%;height:100%;object-fit:contain"></div>`)}</div>
          <div style="font-weight:900;font-size:60px;margin-top:22px">${ln(W.credits + 2.2, 'جامعة عين شمس')}</div>
          <div style="font-weight:800;font-size:32px;margin-top:4px">${ln(W.credits + 1.2, `<span style="color:#2f9a3e">كلية الزراعة</span>`)} <span style="color:${P.gold};margin:0 12px">◆</span> ${ln(W.credits, `<span style="color:#1f7fc0">قسم علوم الأغذية</span>`)} <span style="color:${P.gold};margin:0 12px">◆</span> ${ln(W.credits + 0.4, '<span style="opacity:.7">برنامج علوم وتكنولوجيا الأغذية</span>')}</div>
          <div style="margin-top:22px">${ln(W.credits + 2.8, `<span class="chip" style="background:linear-gradient(135deg,${P.pink},#ff8a3d);color:#fff;font-size:36px">إعداد: طلاب المستوى الثاني</span>`)}</div>
          <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:16px 20px;width:1500px;margin:26px auto 0">${NAMES.map((nm, i) => ln(W.credits + 3.3 + i * 0.3, `<div class="lightcard" style="display:flex;align-items:center;gap:14px;padding:10px 26px 14px 18px;border-radius:20px;border:1.5px solid ${P.gold}"><div style="width:42px;height:42px;border-radius:13px;background:${P.gold};color:#fff;font-weight:900;font-size:26px;display:grid;place-items:center">${i + 1}</div><div style="font-weight:800;font-size:34px;white-space:nowrap">${nm}</div></div>`)).join('')}</div></div>`);
      }
    }
  }
  if (shot === 'macro') label('bloom', MACRO.impact + 0.15, MACRO.b - 0.1, P.pink, 'سحابة وردية… تختفي ما دام الوسط حامضياً');

  // burette readout HUD during the titrations
  const kh = win(t, CH.t1.start + 0.5, CH.blank.end - 0.5, 0.5, 0.4) * (shot === 'lab' ? 1 : 0) * (1 - win(t, CH.calc.start - 1, 1e9));
  if (kh > 0.01)
    out.push(`<div class="hud lightcard" style="opacity:${kh}"><div style="font-weight:700;font-size:22px;opacity:.65">قراءة السحاحة</div><div class="m" style="font-size:54px;color:${P.blue}">${readingAt(t).toFixed(2)}<span style="font-size:24px;opacity:.6"> mL</span></div><div style="font-weight:600;font-size:18px;opacity:.55"><span class="m">NaOH 0.1 N</span></div></div>`);

  // caption: the narration, in sync with the voice
  const cur = S.find((s) => t >= s.at - 0.05 && t <= s.at + s.dur + 0.25);
  if (cur) {
    const k = clamp01((t - cur.at + 0.05) / 0.25) * clamp01((cur.at + cur.dur + 0.25 - t) / 0.2);
    out.push(`<div class="cap" style="opacity:${k.toFixed(3)}">${esc(cur.text)}</div>`);
  }
  // transitions: cream dip into the milk, white flash out of the molecules, violet into the bead
  const dip = win(t, CH.protein.start + 1.85, CH.protein.start + 2.75, 0.35, 0.5);
  const bead = win(t, CH.amino.start - 0.35, CH.amino.start + 0.35, 0.3, 0.35);
  const white = win(t, CH.react.end - 0.5, CH.react.end + 0.6, 0.45, 0.6);
  const cut = (a, b) => win(t, a, b, 0.06, 0.14);
  const macroIn = cut(MACRO.a - 0.08, MACRO.a + 0.06) + cut(MACRO.b - 0.08, MACRO.b + 0.06);
  if (dip > 0.01) out.push(`<div class="flash" style="background:#fbf5ec;opacity:${dip}"></div>`);
  if (bead > 0.01) out.push(`<div class="flash" style="background:${P.violet};opacity:${bead * 0.85}"></div>`);
  if (white > 0.01) out.push(`<div class="flash" style="background:#ffffff;opacity:${white}"></div>`);
  if (macroIn > 0.01) out.push(`<div class="flash" style="background:#ffffff;opacity:${Math.min(1, macroIn) * 0.7}"></div>`);
  return {theme, html: out.join('')};
}

/* ------------------------------------------------------------------ boot */

runSim(DEFAULTS, async ({cfg, canvas}) => {
  await Promise.all(['900', '800', '600'].map((wt) => document.fonts.load(`${wt} 20px Cairo`, 'بـ1'))).catch(() => {});
  const renderer = new THREE.WebGLRenderer({canvas, antialias: false, preserveDrawingBuffer: true});
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.localClippingEnabled = true;
  renderer.transmissionResolutionScale = 0.5;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const worlds = {lab: buildLab(env), milk: buildMilk(env), mol: buildMol(env), macro: buildMacro(env)};
  const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.05, 1500);
  const target = new THREE.WebGLRenderTarget(4, 4, {type: THREE.HalfFloatType, samples: 2});
  const composer = new EffectComposer(renderer, target);
  const rp = new RenderPass(worlds.lab.scene, camera);
  composer.addPass(rp);
  const bokeh = new BokehPass(worlds.lab.scene, camera, {focus: 50, aperture: 0.0001, maxblur: 0.01});
  composer.addPass(bokeh);
  const bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), 0.22, 0.45, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const ov = document.createElement('div');
  ov.id = 'ov';
  document.getElementById('app').appendChild(ov);

  const resize = () => {
    const w = innerWidth;
    const h = innerHeight;
    const pr = devicePixelRatio * cfg.rs;
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pr);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();

  return {
    resize,
    render(t) {
      const shot = shotAt(t);
      const wd = worlds[shot];
      wd.update(t);
      const c = wd.camAt(t);
      camera.position.copy(c.pos);
      camera.lookAt(c.look);
      camera.fov = c.fov;
      camera.updateProjectionMatrix();
      rp.scene = wd.scene;
      bokeh.scene = wd.scene;
      bokeh.uniforms.focus.value = wd.focusOf(c);
      bokeh.uniforms.aperture.value = wd.aperture * (shot === 'lab' && t > CH.calc.start && t < CH.calc.end ? 2.2 : 1);
      bokeh.uniforms.maxblur.value = wd.maxblur;
      bloom.enabled = wd.bloom;
      renderer.toneMappingExposure = wd.exposure;
      composer.render();
      const o = overlay(t, shot, wd, camera, innerWidth, innerHeight);
      ov.className = o.theme;
      ov.innerHTML = o.html;
      return {};
    },
  };
});
