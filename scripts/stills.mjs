#!/usr/bin/env node
// Render stills of a composition at given seconds with one bundle, then tile them.
//   node scripts/stills.mjs <CompositionId> <outPrefix> <sec> [sec...] [--scale 0.4]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const si = args.indexOf('--scale');
const scale = si === -1 ? 0.4 : Number(args.splice(si, 2)[1]);
const [id, prefix, ...secs] = args;
const browser = fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined;

const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src/index.ts')});
const comp = await selectComposition({serveUrl, id, browserExecutable: browser});
fs.mkdirSync(path.dirname(prefix), {recursive: true});
const files = [];
for (const s of secs) {
  const frame = Math.min(comp.durationInFrames - 1, Math.round(Number(s) * comp.fps));
  const out = `${prefix}-${String(s).replace('.', '_')}.jpg`;
  await renderStill({composition: comp, serveUrl, output: out, frame, scale, imageFormat: 'jpeg', browserExecutable: browser});
  files.push(out);
}
const cols = Math.min(files.length, 4);
const sheet = `${prefix}-sheet.jpg`;
execFileSync('ffmpeg', [
  '-loglevel', 'error', '-y',
  ...files.flatMap((f) => ['-i', f]),
  '-filter_complex',
  files.map((_, i) => `[${i}:v]`).join('') + `xstack=inputs=${files.length}:layout=` +
    files.map((_, i) => `${i % cols === 0 ? '0' : Array.from({length: i % cols}, (_, j) => `w${j}`).join('+')}_${Math.floor(i / cols) === 0 ? '0' : Array.from({length: Math.floor(i / cols)}, (_, j) => `h${j * cols}`).join('+')}`).join('|') +
    (files.length % cols ? ':fill=white' : ''),
  sheet,
]);
console.log(sheet);
