// Export every SVG in logo/svg to PNG (transparent where the SVG has no background).
//   node brand/al-asema-lab/render-png.mjs [scale=2]
import {chromium} from 'playwright';
import {readdirSync, readFileSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, 'logo', 'svg');
const out = join(root, 'logo', 'png');
const scale = Number(process.argv[2] ?? 2);
mkdirSync(out, {recursive: true});

const browser = await chromium.launch(
  process.env.CHROMIUM ? {executablePath: process.env.CHROMIUM} : {},
);
for (const f of readdirSync(src).filter((n) => n.endsWith('.svg'))) {
  const svg = readFileSync(join(src, f), 'utf8');
  const [, w, h] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).map(Number);
  const page = await browser.newPage({viewport: {width: Math.ceil(w), height: Math.ceil(h)}, deviceScaleFactor: scale});
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await page.locator('svg').screenshot({path: join(out, f.replace('.svg', '.png')), omitBackground: true});
  await page.close();
}
await browser.close();
console.log(`PNG @${scale}x → ${out}`);
