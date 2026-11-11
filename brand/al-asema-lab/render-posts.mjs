// PNG exports for posts/.   node brand/al-asema-lab/render-posts.mjs
import {chromium} from 'playwright';
import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'posts');
const browser = await chromium.launch(process.env.CHROMIUM ? {executablePath: process.env.CHROMIUM} : {});
for (const [sub, h] of [['', 1350], ['story', 1920]]) {
  const d = join(dir, sub);
  if (!existsSync(d)) continue;
  for (const f of readdirSync(d).filter((n) => n.endsWith('.svg'))) {
    const page = await browser.newPage({viewport: {width: 1080, height: h}});
    await page.setContent(`<html><body style="margin:0">${readFileSync(join(d, f), 'utf8')}</body></html>`);
    await page.screenshot({path: join(d, f.replace('.svg', '.png'))});
    await page.close();
  }
}
await browser.close();
console.log('posts →', dir);
