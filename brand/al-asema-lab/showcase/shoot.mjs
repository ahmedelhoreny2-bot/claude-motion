// Screenshot the two boards at 2x (2160x2700).
import {chromium} from 'playwright';
import {fileURLToPath} from 'url';
import path from 'path';
const here = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({viewport: {width: 1080, height: 1350}, deviceScaleFactor: 2});
for (const n of [1, 2]) {
  await page.goto('file://' + path.join(here, `board${n}.html`));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({path: path.join(here, `asema-showcase-${n}.png`)});
}
await browser.close();
console.log('shot');
