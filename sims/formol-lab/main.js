import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {BokehPass} from 'three/addons/postprocessing/BokehPass.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {runSim} from '../kit/runtime.js';

// Style frames for the formol-titration remake: a bright, clean lab in real 3D.
// t in [0,1): the lab hero shot · [1,2): macro of a NaOH drop blooming pink in milk
// · [2,3): the molecular world. Units are centimetres in the lab, ångström-ish in the molecule.

const DEFAULTS = {duration: 3, fps: 30, theme: 'light', watermark: '', hud: {enabled: false}, director: {enabled: false}};

const P = {
  labBg: '#e4eaf1',
  milk: '#fff7ef',
  faintPink: '#ffd3e4',
  pink: '#ff3e9a',
  navy: '#0a1230',
  cyan: '#2ec8ff',
  coral: '#ff6b4a',
  lime: '#7be36a',
  violet: '#9a6bff',
  ink: '#16213a',
};

const mulberry = (a) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const glassMat = (o = {}) =>
  new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    metalness: 0,
    roughness: 0.025,
    transmission: 1,
    thickness: 0.3,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 1.3,
    attenuationColor: '#cfe9e0',
    attenuationDistance: 5,
    specularIntensity: 1,
    side: THREE.DoubleSide,
    ...o,
  });

const gradientBg = (top, bottom, spot) => {
  const cv = document.createElement('canvas');
  cv.width = 64;
  cv.height = 512;
  const g = cv.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, top);
  grd.addColorStop(1, bottom);
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 512);
  if (spot) {
    const r = g.createRadialGradient(20, 150, 0, 20, 150, 160);
    r.addColorStop(0, spot);
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 512);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

const lathe = (pts, seg = 96) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

const shadowed = (m) => {
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};

/* ------------------------------------------------------------------ lab */

function buildLab(env) {
  const scene = new THREE.Scene();
  scene.background = gradientBg('#b4c3d4', '#e8edf3');
  scene.environment = env;
  scene.environmentIntensity = 0.7;
  scene.fog = new THREE.Fog('#c3cfdc', 110, 300);

  const hemi = new THREE.HemisphereLight('#ffffff', '#c6d0dc', 0.7);
  scene.add(hemi);
  const key = new THREE.DirectionalLight('#ffffff', 2.4);
  key.position.set(-40, 80, 45);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, {left: -50, right: 50, top: 50, bottom: -50, near: 1, far: 250});
  key.shadow.bias = -0.0004;
  key.shadow.radius = 8;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#dbe8ff', 1.2);
  rim.position.set(35, 50, -70);
  scene.add(rim);

  // bench, wall, window glow
  const bench = shadowed(new THREE.Mesh(new THREE.BoxGeometry(420, 4, 140), new THREE.MeshPhysicalMaterial({color: '#f3f5f8', roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.4})));
  bench.position.set(0, -2, -20);
  scene.add(bench);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(800, 300), new THREE.MeshStandardMaterial({color: '#a9b8c9', roughness: 0.9}));
  wall.position.set(0, 100, -95);
  scene.add(wall);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(90, 70), new THREE.MeshBasicMaterial({color: '#ffffff'}));
  win.position.set(-95, 70, -94);
  scene.add(win);
  for (const [x, w, h, c] of [[-60, 70, 46, '#5b6a80'], [30, 90, 40, '#6f7f95'], [110, 60, 52, '#56657a']]) {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(w, h, 30), new THREE.MeshStandardMaterial({color: c, roughness: 0.6}));
    cab.position.set(x, h / 2, -75);
    scene.add(cab);
  }
  const shelf = shadowed(new THREE.Mesh(new THREE.BoxGeometry(240, 2, 26), new THREE.MeshStandardMaterial({color: '#f7f9fb', roughness: 0.5})));
  shelf.position.set(40, 52, -82);
  scene.add(shelf);

  // background glassware and bottles (they melt into bokeh)
  const rnd = mulberry(7);
  const tints = ['#7fc4ff', '#ffb35c', '#9be38a', '#c9a4ff', '#ff8fb8', '#ffffff'];
  for (let i = 0; i < 14; i++) {
    const h = 10 + rnd() * 16;
    const r = 3 + rnd() * 3;
    const onShelf = i >= 7;
    const x = -90 + (onShelf ? (i - 7) * 26 + 30 : i * 26) + rnd() * 8;
    const y = onShelf ? 53 : 0;
    const z = onShelf ? -82 : -48 - rnd() * 14;
    const g = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 40), glassMat({thickness: 0.6}));
    g.position.set(x, y + h / 2, z);
    scene.add(g);
    const liq = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 0.92, r * 0.92, h * (0.35 + rnd() * 0.4), 40),
      new THREE.MeshPhysicalMaterial({color: tints[i % tints.length], roughness: 0.15, transmission: 0.5, thickness: 2}),
    );
    liq.position.set(x, y + (liq.geometry.parameters.height / 2) + 0.3, z);
    scene.add(liq);
  }

  // retort stand: base, rod, clamp
  const F0 = 2.2; // flask bottom (tile top)
  const base = shadowed(new THREE.Mesh(new THREE.BoxGeometry(26, 1.6, 16), new THREE.MeshPhysicalMaterial({color: '#2a3142', roughness: 0.35, clearcoat: 0.6})));
  base.position.set(-5, 0.8, -2);
  scene.add(base);
  const tile = shadowed(new THREE.Mesh(new THREE.BoxGeometry(15, 0.6, 15), new THREE.MeshPhysicalMaterial({color: '#ffffff', roughness: 0.15, clearcoat: 1})));
  tile.position.set(0, 1.9, 0);
  scene.add(tile);
  const metal = new THREE.MeshStandardMaterial({color: '#c9cfd8', metalness: 1, roughness: 0.28});
  const rod = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 95, 32), metal));
  rod.position.set(-14, 1.6 + 47.5, -5);
  scene.add(rod);
  const arm = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 15, 24), metal));
  arm.rotation.z = Math.PI / 2;
  arm.rotation.y = -0.33;
  arm.position.set(-7, 52, -2.5);
  scene.add(arm);
  const boss = shadowed(new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.4), new THREE.MeshStandardMaterial({color: '#3a4256', roughness: 0.4, metalness: 0.5})));
  boss.position.set(-14, 52, -5);
  scene.add(boss);
  const jaw = shadowed(new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.25, 16, 40), new THREE.MeshStandardMaterial({color: '#2f6fff', roughness: 0.4})));
  jaw.rotation.x = Math.PI / 2;
  jaw.position.set(0, 52, 0);
  scene.add(jaw);

  // Erlenmeyer flask (outer glass) and milk with a faint pink endpoint
  const flaskProf = [[0, 0], [3.9, 0], [4.25, 0.25], [4.35, 0.7], [4.2, 1.4], [1.75, 10.6], [1.7, 11.2], [1.7, 13.6], [1.95, 13.8], [1.95, 14.15], [1.62, 14.15], [1.6, 13.7]];
  const flask = shadowed(new THREE.Mesh(lathe(flaskProf, 128), glassMat({thickness: 0.4})));
  flask.position.y = F0;
  scene.add(flask);
  const rIn = (y) => (y <= 1.4 ? 3.95 : 3.95 + ((1.5 - 3.95) * (y - 1.4)) / (10.6 - 1.4));
  const L = 3.8;
  const liquid = new THREE.Mesh(
    lathe([[0, 0.3], [3.8, 0.3], [3.98, 0.8], [rIn(L) + 0.02, L - 0.12], [rIn(L) - 0.15, L], [0, L]], 128),
    new THREE.MeshPhysicalMaterial({color: P.faintPink, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.12, sheen: 0.6, sheenColor: '#ffffff', sheenRoughness: 0.5}),
  );
  liquid.position.y = F0;
  liquid.receiveShadow = true;
  scene.add(liquid);

  // burette: graduated tube, NaOH column, taper, PTFE stopcock, tip inside the neck
  const tipEnd = F0 + 14.15 - 1.6;
  const tipTop = tipEnd + 2.0;
  const cock = tipTop + 0.6;
  const taperTop = cock + 1.6;
  const tubeTop = taperTop + 70;
  const R = 0.62;
  const bur = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(R, R, tubeTop - taperTop, 64, 1, true), glassMat({thickness: 0.15}));
  tube.position.y = (tubeTop + taperTop) / 2;
  bur.add(tube);
  const taper = new THREE.Mesh(lathe([[R, taperTop], [R - 0.02, taperTop - 0.6], [0.3, cock + 0.4], [0.3, cock]], 48), glassMat({thickness: 0.2}));
  bur.add(taper);
  const tip = new THREE.Mesh(lathe([[0.3, cock - 0.5], [0.28, tipTop], [0.12, tipEnd]], 48), glassMat({thickness: 0.15}));
  bur.add(tip);
  const naoh = new THREE.MeshPhysicalMaterial({color: '#8fc6f2', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.3, sheenColor: '#ffffff'});
  const level = taperTop + 48; // reading ≈ 22 mL on the visible scale
  const col = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.08, R - 0.08, level - taperTop, 48), naoh);
  col.position.y = (level + taperTop) / 2;
  bur.add(col);
  const tcol = new THREE.Mesh(lathe([[0, taperTop], [R - 0.1, taperTop], [0.22, cock + 0.4], [0.2, tipTop], [0.07, tipEnd + 0.05], [0, tipEnd + 0.05]], 32), naoh);
  bur.add(tcol);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.6, 32), glassMat({thickness: 0.3}));
  barrel.rotation.z = Math.PI / 2;
  barrel.position.y = cock;
  bur.add(barrel);
  const key0 = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.36, 3.4, 32), new THREE.MeshPhysicalMaterial({color: '#f4f6f8', roughness: 0.35, clearcoat: 0.3})));
  key0.rotation.z = Math.PI / 2;
  key0.position.y = cock;
  bur.add(key0);
  const handle = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.0, 0.9), new THREE.MeshPhysicalMaterial({color: '#2f6fff', roughness: 0.3, clearcoat: 0.6})));
  handle.position.set(1.95, cock, 0);
  bur.add(handle);
  // graduations on the front arc
  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = 4096;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, cv.width, cv.height);
  const span = tubeTop - taperTop;
  const yOf = (ml) => ((2 + ml) / span) * cv.height; // 0 mL sits 2 cm below the top
  g.fillStyle = '#1b2235';
  g.font = '700 44px "JetBrains Mono"';
  for (let i = 0; i <= 500; i++) {
    const ml = i / 10;
    const y = yOf(ml);
    const major = i % 10 === 0;
    const mid = i % 5 === 0;
    g.fillRect(150, y - 2, major ? 200 : mid ? 140 : 90, major ? 5 : 3);
    if (major) g.fillText(String(ml), 370, y + 15);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const scale = new THREE.Mesh(
    new THREE.CylinderGeometry(R + 0.01, R + 0.01, span, 48, 1, true, -0.15, 1.1),
    new THREE.MeshBasicMaterial({map: tex, alphaTest: 0.4}),
  );
  scale.position.y = (tubeTop + taperTop) / 2;
  bur.add(scale);
  // hanging drop at the tip
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 24), new THREE.MeshPhysicalMaterial({color: '#ffffff', roughness: 0, transmission: 1, thickness: 0.4, ior: 1.33}));
  drop.scale.set(1, 1.25, 1);
  drop.position.y = tipEnd - 0.18;
  bur.add(drop);
  scene.add(bur);

  const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.5, 1200);
  camera.position.set(25, 17, 60);
  const look = new THREE.Vector3(-1.5, 12.2, 0);
  camera.lookAt(look);
  return {
    scene,
    camera,
    focus: camera.position.distanceTo(new THREE.Vector3(0, 9, 0)),
    aperture: 0.00026,
    maxblur: 0.014,
    bloom: false,
    anchors: {
      bur: new THREE.Vector3(R, 25, 0),
      flask: new THREE.Vector3(3.3, F0 + 3.4, 0),
      cock: new THREE.Vector3(2.2, cock + 1.5, 0),
    },
  };
}

/* ------------------------------------------------------------------ macro */

function noise2(seed) {
  const r = mulberry(seed);
  const N = 256;
  const v = new Float32Array(N * N).map(() => r());
  const at = (x, y) => v[(((y % N) + N) % N) * N + (((x % N) + N) % N)];
  const sm = (k) => k * k * (3 - 2 * k);
  return (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = sm(x - xi);
    const fy = sm(y - yi);
    const a = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * fx;
    const b = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * fx;
    return a + (b - a) * fy;
  };
}

function dyeTexture() {
  const S = 2048;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S * 0.7);
  grd.addColorStop(0, '#fffaf4');
  grd.addColorStop(1, '#f6ece0');
  g.fillStyle = grd;
  g.fillRect(0, 0, S, S);
  const n = noise2(11);
  const r = mulberry(5);
  const field = (x, y) => {
    const e = 1.5;
    const s = 0.012;
    const dx = (n((x + e) * s, y * s) - n((x - e) * s, y * s)) / (2 * e);
    const dy = (n(x * s, (y + e) * s) - n(x * s, (y - e) * s)) / (2 * e);
    return [dy, -dx];
  };
  g.lineCap = 'round';
  g.globalCompositeOperation = 'multiply';
  g.filter = 'blur(0.8px)';
  g.filter = 'blur(18px)';
  const haze = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, 340);
  haze.addColorStop(0, 'rgba(255,120,185,0.35)');
  haze.addColorStop(1, 'rgba(255,120,185,0)');
  g.fillStyle = haze;
  g.fillRect(0, 0, S, S);
  g.filter = 'none';
  for (let p = 0; p < 7000; p++) {
    const a = r() * Math.PI * 2;
    const rr = Math.sqrt(r()) * 26;
    let x = S / 2 + Math.cos(a) * rr;
    let y = S / 2 + Math.sin(a) * rr;
    const len = 40 + r() * 140;
    const w = 0.5 + r() * 1.6;
    g.strokeStyle = `rgba(255,${40 + Math.floor(r() * 80)},${140 + Math.floor(r() * 50)},${0.10 + r() * 0.22})`;
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(x, y);
    for (let s = 0; s < len; s++) {
      const [vx, vy] = field(x, y);
      const ox = x - S / 2;
      const oy = y - S / 2;
      const d = Math.hypot(ox, oy) + 1;
      x += vx * 260 + (ox / d) * 1.5 + (-oy / d) * 0.5;
      y += vy * 260 + (oy / d) * 1.5 + (ox / d) * 0.5;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  g.filter = 'none';
  const core = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, 70);
  core.addColorStop(0, 'rgba(255,70,160,0.35)');
  core.addColorStop(1, 'rgba(255,70,160,0)');
  g.fillStyle = core;
  g.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function buildMacro(env) {
  const scene = new THREE.Scene();
  scene.background = gradientBg('#c3c8d8', '#f1e4ea', 'rgba(255,255,255,0.9)');
  scene.environment = env;
  scene.environmentIntensity = 0.85;
  scene.fog = new THREE.Fog('#e6dbe2', 22, 60);
  scene.add(new THREE.HemisphereLight('#ffffff', '#f0d6e0', 0.8));
  const key = new THREE.DirectionalLight('#ffffff', 2.0);
  key.position.set(-10, 20, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, {left: -12, right: 12, top: 12, bottom: -12});
  scene.add(key);
  const back = new THREE.DirectionalLight('#ffe1ee', 1.4);
  back.position.set(4, 6, -20);
  scene.add(back);

  const geo = new THREE.PlaneGeometry(44, 44, 360, 360);
  geo.rotateX(-Math.PI / 2);
  const base = geo.attributes.position.array.slice();
  const surf = new THREE.Mesh(
    geo,
    new THREE.MeshPhysicalMaterial({map: dyeTexture(), roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.04, sheen: 0.4, sheenColor: '#ffffff'}),
  );
  surf.receiveShadow = true;
  scene.add(surf);
  const dropMat = new THREE.MeshPhysicalMaterial({color: '#ffffff', roughness: 0, transmission: 1, thickness: 1.2, ior: 1.33, attenuationColor: '#cfe9ff', attenuationDistance: 4});
  const drop = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.55, 48, 32), dropMat));
  scene.add(drop);
  const crownMat = new THREE.MeshPhysicalMaterial({color: '#fff1f5', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.7, sheenColor: '#ffffff', side: THREE.DoubleSide});
  const SP = 16;
  const cg = new THREE.CylinderGeometry(1.75, 1.25, 1, 96, 12, true);
  cg.translate(0, 0.5, 0);
  const cbase = cg.attributes.position.array.slice();
  const cup = shadowed(new THREE.Mesh(cg, crownMat));
  scene.add(cup);
  const crown = [];
  for (let i = 0; i < SP; i++) {
    const m = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), crownMat));
    scene.add(m);
    crown.push(m);
  }
  const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 400);
  camera.position.set(0, 2.2, 11.5);
  camera.lookAt(0, 1.1, 0);

  const update = (u) => {
    const tt = 0.35 + u * 0.1; // seconds since impact
    const p = geo.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) {
      const x = base[i];
      const z = base[i + 2];
      const r = Math.hypot(x, z);
      const front = 7 * tt;
      const env = Math.exp(-r * 0.12) * (r < front ? 1 : Math.exp(-(r - front) * 3));
      p[i + 1] = 0.22 * env * Math.sin(r * 3.2 - tt * 22) + 0.5 * Math.exp(-r * r * 1.5) * Math.max(0, 1 - tt * 1.5);
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    const H = 1.25;
    const q = cg.attributes.position.array;
    for (let i = 0; i < q.length; i += 3) {
      const x = cbase[i];
      const y = cbase[i + 1];
      const z = cbase[i + 2];
      const th = Math.atan2(z, x);
      const spike = Math.pow(Math.max(0, Math.cos(th * SP)), 6) * 0.55;
      const flare = 1 + y * y * 0.35;
      q[i] = x * flare;
      q[i + 2] = z * flare;
      q[i + 1] = y * (H + spike) - 0.05;
    }
    cg.attributes.position.needsUpdate = true;
    cg.computeVertexNormals();
    crown.forEach((m, i) => {
      const a = (i / SP) * Math.PI * 2;
      const rr = 1.75 * (1 + 0.35) + 0.05;
      m.position.set(Math.cos(a) * rr, H + 0.62 + (i % 3) * 0.12, Math.sin(a) * rr);
      m.scale.setScalar(0.75 + (i % 4) * 0.12);
    });
    drop.position.set(0.1, 3.3, 0.1);
    drop.scale.set(0.85, 1.25, 0.85);
  };
  return {
    scene,
    camera,
    focus: camera.position.distanceTo(new THREE.Vector3(0, 0.8, 0)),
    aperture: 0.0024,
    maxblur: 0.016,
    bloom: false,
    update,
    anchors: {drop: new THREE.Vector3(0.1, 4.0, 0.1), bloom: new THREE.Vector3(-2.6, 0.25, 2.2)},
  };
}

/* ------------------------------------------------------------------ molecule */

function buildMol(env) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(P.navy);
  scene.environment = env;
  scene.environmentIntensity = 0.55;
  scene.fog = new THREE.Fog(P.navy, 18, 60);
  scene.add(new THREE.HemisphereLight('#9fb4ff', '#0a1230', 0.5));
  const key = new THREE.DirectionalLight('#ffffff', 1.6);
  key.position.set(-6, 10, 8);
  scene.add(key);

  const EL = {
    C: {r: 0.42, c: '#3d4566'},
    H: {r: 0.27, c: '#f2f5ff'},
    O: {r: 0.4, c: P.coral},
    N: {r: 0.4, c: '#2e7dff'},
    R: {r: 0.62, c: P.violet},
  };
  const atoms = {
    Ca: ['C', [0, 0, 0]],
    R: ['R', [0, -1.55, -0.35]],
    Ha: ['H', [-0.25, 0.75, 1.0]],
    N: ['N', [1.45, 0.55, 0]],
    HN1: ['H', [2.2, -0.15, 0.55]],
    HN2: ['H', [2.05, 1.35, -0.5]],
    Cc: ['C', [-1.5, 0.5, 0]],
    O1: ['O', [-1.75, 1.7, 0.35]],
    O2: ['O', [-2.55, -0.35, -0.25]],
    HO: ['H', [-3.35, 0.1, -0.35]],
    Cf: ['C', [3.75, 1.6, 0.4]],
    Of: ['O', [4.6, 2.45, 0.4]],
    Hf1: ['H', [3.3, 2.05, 1.25]],
    Hf2: ['H', [3.4, 0.75, -0.2]],
  };
  const bonds = [['Ca', 'R'], ['Ca', 'Ha'], ['Ca', 'N'], ['Ca', 'Cc'], ['N', 'HN1'], ['N', 'HN2'], ['Cc', 'O1', 2], ['Cc', 'O2'], ['O2', 'HO'], ['Cf', 'Of', 2], ['Cf', 'Hf1'], ['Cf', 'Hf2']];
  const mol = new THREE.Group();
  const v = (id) => new THREE.Vector3(...atoms[id][1]);
  const mats = {};
  for (const [el, d] of Object.entries(EL)) mats[el] = new THREE.MeshPhysicalMaterial({color: d.c, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, metalness: 0});
  for (const [id, [el, p]] of Object.entries(atoms)) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(EL[el].r, 64, 48), mats[el]);
    m.position.set(...p);
    mol.add(m);
  }
  const up = new THREE.Vector3(0, 1, 0);
  for (const [a, b, order = 1] of bonds) {
    const A = v(a);
    const B = v(b);
    const dir = B.clone().sub(A);
    const len = dir.length();
    const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 0, 1)).normalize().multiplyScalar(0.11);
    const offs = order === 2 ? [-1, 1] : [0];
    for (const o of offs) {
      for (const [from, el, k] of [[A, atoms[a][0], 0.25], [B, atoms[b][0], 0.75]]) {
        void from;
        const c = new THREE.Mesh(new THREE.CylinderGeometry(order === 2 ? 0.07 : 0.1, order === 2 ? 0.07 : 0.1, len / 2, 24), mats[el]);
        c.position.copy(A.clone().lerp(B, k)).addScaledVector(side, o);
        c.quaternion.setFromUnitVectors(up, dir.clone().normalize());
        mol.add(c);
      }
    }
  }
  mol.rotation.set(0.15, -0.35, 0);
  scene.add(mol);

  // coloured lights and glow halos explain the chemistry: cyan = basic, coral = acidic, lime = formaldehyde
  const halo = (color, size) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const g = cv.getContext('2d');
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, color + '77');
    grd.addColorStop(0.35, color + '2a');
    grd.addColorStop(1, color + '00');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(cv), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true}));
    s.scale.setScalar(size);
    return s;
  };
  const glows = [
    [P.cyan, 'N', [1.75, 0.6, 0], 3.4],
    [P.coral, 'Cc', [-2.0, 0.6, 0], 3.8],
    [P.lime, 'Cf', [3.9, 1.8, 0.4], 2.8],
  ];
  for (const [c, , p, s] of glows) {
    const h = halo(c, s);
    h.position.set(...p);
    mol.add(h);
    const l = new THREE.PointLight(c, 5, 6, 2);
    l.position.set(p[0], p[1], p[2] + 1.5);
    mol.add(l);
  }
  // a dotted path showing where HCHO is heading
  const path = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const k = i / 8;
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshBasicMaterial({color: P.lime, transparent: true, opacity: 0.25 + 0.6 * k}));
    d.position.set(6.8 - 2.4 * k, 3.9 - 1.9 * k, 0.6);
    path.add(d);
  }
  mol.add(path);
  // depth: floating particles become bokeh
  const r = mulberry(3);
  const pm = new THREE.MeshBasicMaterial({color: '#7fa2ff', transparent: true, opacity: 0.5});
  for (let i = 0; i < 140; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.04 + r() * 0.08, 10, 8), i % 7 === 0 ? new THREE.MeshBasicMaterial({color: P.pink}) : pm);
    m.position.set((r() - 0.5) * 40, (r() - 0.5) * 22, -r() * 30 + 6);
    scene.add(m);
  }
  const camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.1, 200);
  camera.position.set(1.4, 0.6, 15.5);
  camera.lookAt(1.5, 0.9, 0);
  const world = (id) => {
    mol.updateMatrixWorld();
    return v(id).applyMatrix4(mol.matrixWorld);
  };
  return {
    scene,
    camera,
    focus: 15.2,
    aperture: 0.0035,
    maxblur: 0.016,
    bloom: true,
    anchors: {N: () => world('HN2').add(new THREE.Vector3(0, 0.5, 0)), C: () => world('O1').add(new THREE.Vector3(0, 0.55, 0)), F: () => world('Hf2').add(new THREE.Vector3(0.3, -0.45, 0))},
  };
}

/* ------------------------------------------------------------------ overlays */

const SHOTS = [
  {
    theme: 'light',
    title: 'المعايرة الأولى<small>طريقة الفورمول · تقدير البروتين في اللبن</small>',
    labels: [
      ['bur', '#2e8cff', 'سحاحة · <span class="fx-mono">NaOH 0.1 N</span>'],
      ['cock', '#2f6fff', 'المحبس مفتوح · نقطة نقطة'],
      ['flask', P.pink, 'لبن + فينولفثالين · وردي خفيف ثابت ✓'],
    ],
    cap: 'نضيفُ القلويَّ قطرةً قطرة مع الرجّ، حتى يظهرَ لونٌ ورديٌّ خفيفٌ ثابت.',
  },
  {
    theme: 'light',
    title: '',
    labels: [
      ['drop', '#2e8cff', 'نقطة <span class="fx-mono">NaOH</span>'],
      ['bloom', P.pink, 'سحابة وردية… تختفي طالما الوسط حامضي'],
    ],
    cap: 'كلُّ نقطة تُكوِّن سحابةً وردية، وتختفي ما دام في اللبن حموضة.',
  },
  {
    theme: 'dark',
    title: 'العالم الجزيئي<small>الحمض الأميني + الفورمالدهيد</small>',
    labels: [
      ['N', P.cyan, 'مجموعة أمين <span class="fx-mono">NH₂</span> · قاعدي'],
      ['C', P.coral, 'مجموعة كربوكسيل <span class="fx-mono">COOH</span> · حامضي'],
      ['F', P.lime, 'فورمالدهيد <span class="fx-mono">HCHO</span>'],
    ],
    cap: 'يتّحدُ الفورمالدهيد مع مجموعةِ الأمين، فيُلغي تأثيرَها القاعدي.',
  },
];

runSim(DEFAULTS, async ({canvas}) => {
  await Promise.all([document.fonts.load('800 20px Cairo', 'ب'), document.fonts.load('600 20px Cairo', 'ب')]).catch(() => {});
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, preserveDrawingBuffer: true});
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const shots = [buildLab(env), buildMacro(env), buildMol(env)];
  const target = new THREE.WebGLRenderTarget(4, 4, {type: THREE.HalfFloatType, samples: 4});
  const composer = new EffectComposer(renderer, target);
  const rp = new RenderPass(shots[0].scene, shots[0].camera);
  composer.addPass(rp);
  const bokeh = new BokehPass(shots[0].scene, shots[0].camera, {focus: 50, aperture: 0.0001, maxblur: 0.01});
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
    renderer.setPixelRatio(devicePixelRatio);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(devicePixelRatio);
    composer.setSize(w, h);
    for (const s of shots) {
      s.camera.aspect = w / h;
      s.camera.updateProjectionMatrix();
    }
  };
  resize();

  return {
    resize,
    render(t) {
      const i = Math.min(2, Math.max(0, Math.floor(t)));
      const s = shots[i];
      s.update?.(t - i);
      rp.scene = s.scene;
      rp.camera = s.camera;
      bokeh.scene = s.scene;
      bokeh.camera = s.camera;
      bokeh.uniforms.focus.value = s.focus;
      bokeh.uniforms.aperture.value = s.aperture;
      bokeh.uniforms.maxblur.value = s.maxblur;
      bloom.enabled = s.bloom;
      composer.render();

      const meta = SHOTS[i];
      const w = innerWidth;
      const h = innerHeight;
      const html = meta.labels
        .map(([k, c, txt]) => {
          const a = s.anchors[k];
          const p = (typeof a === 'function' ? a() : a).clone().project(s.camera);
          const x = (p.x * 0.5 + 0.5) * w;
          const y = (-p.y * 0.5 + 0.5) * h;
          const below = i === 2 && k === 'F';
          return `<div class="fx-lbl${below ? ' below' : ''}" style="left:${x}px;top:${y}px"><div class="fx-card"><span class="fx-dot" style="background:${c};box-shadow:0 0 12px ${c}"></span>${txt}</div><div class="fx-stem"></div></div>`;
        })
        .join('');
      ov.className = meta.theme;
      ov.innerHTML = `${meta.title ? `<div class="fx-title">${meta.title}</div>` : ''}${html}<div class="fx-cap">${meta.cap}</div>`;
      return {};
    },
  };
});
