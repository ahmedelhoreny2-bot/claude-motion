// PNG exports for social/ plus a preview of how Facebook crops them.
//   node brand/al-asema-lab/render-social.mjs
import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'social');
const browser = await chromium.launch(process.env.CHROMIUM ? {executablePath: process.env.CHROMIUM} : {});

const shoot = async (html, w, h, out) => {
  const page = await browser.newPage({viewport: {width: w, height: h}, deviceScaleFactor: 1});
  await page.setContent(`<html><body style="margin:0">${html}</body></html>`);
  await page.screenshot({path: join(dir, out)});
  await page.close();
};
const svg = (f) => readFileSync(join(dir, f), 'utf8');

await shoot(svg('facebook-cover.svg'), 1640, 720, 'facebook-cover.png');
await shoot(svg('facebook-profile.svg'), 1080, 1080, 'facebook-profile.png');
await shoot(svg('facebook-profile-plain.svg'), 1080, 1080, 'facebook-profile-plain.png');

// preview: desktop (820x312 band) and mobile (640x360 block) with the profile circle on each side
const img = (f) => `data:image/png;base64,${readFileSync(join(dir, f)).toString('base64')}`;
const cov = img('facebook-cover.png'), pro = img('facebook-profile.png');
const frame = (w, h, label, side, d, drop) => `
  <div style="margin:0 0 70px">
    <div style="font:600 15px system-ui;color:#555;margin-bottom:8px">${label}</div>
    <div style="position:relative;width:${w}px;height:${h}px;border-radius:8px;
      background:url(${cov}) center/${(820 / 360) * h > w ? 'auto 100%' : '100% auto'} no-repeat;box-shadow:0 0 0 1px #ddd">
      <img src="${pro}" style="position:absolute;${side}:16px;bottom:-${drop}px;width:${d}px;height:${d}px;border-radius:50%;border:4px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.2)">
    </div></div>`;
await shoot(`<div style="padding:30px;background:#F0F2F5;font-family:system-ui">
  ${frame(820, 312, 'كمبيوتر · واجهة عربي (الصورة يمين)', 'right', 168, 60)}
  ${frame(820, 312, 'Desktop · English UI (picture left)', 'left', 168, 60)}
  <div style="display:flex;gap:40px">
    ${frame(360, 203, 'موبايل · عربي', 'right', 120, 50)}
    ${frame(360, 203, 'Mobile · English', 'left', 120, 50)}
  </div></div>`, 880, 1180, 'preview.png');
await browser.close();
console.log('social PNGs →', dir);
