// PNG exports for posts/.   node brand/al-asema-lab/render-posts.mjs
import {chromium} from 'playwright';
import {readdirSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'posts');
const browser = await chromium.launch(process.env.CHROMIUM ? {executablePath: process.env.CHROMIUM} : {});
for (const f of readdirSync(dir).filter((n) => n.endsWith('.svg'))) {
  const page = await browser.newPage({viewport: {width: 1080, height: 1350}});
  await page.setContent(`<html><body style="margin:0">${readFileSync(join(dir, f), 'utf8')}</body></html>`);
  await page.screenshot({path: join(dir, f.replace('.svg', '.png'))});
  await page.close();
}
await browser.close();
console.log('posts →', dir);
