# Al Asema Lab: brand identity (معمل العاصمة للتحاليل الطبية)

**Status: approved and locked (v1.0).** Colours, logo and lockups are final; new designs and videos build on them without changes.

Open `guide.html` in a browser for the full guide (Arabic): concept, logo versions, colours, type, rules, examples, motion.

## Files

| Path | What |
|---|---|
| `logo/svg/` | Every logo as vector, text converted to outlines (opens in Illustrator, Figma, Canva, browsers) |
| `logo/png/` | Same files at 2x, transparent background where the SVG has none |
| `palette.json` | Colours with HEX, RGB, CMYK, tint scales, contrast ratios |
| `brand.ts` | Palette, fonts and the mark's paths for Remotion videos |
| `fonts/` | Cairo and Montserrat (Google Fonts, SIL OFL) |

Everything follows the lab's printed cover: the logo is the existing one (blue microscope, swoosh,
red stripe, red bubbles) redrawn as clean vectors in its own colours, and the palette is sampled from the cover.

Logo variants: `mark-*` (symbol only), `logo-stacked-*` (main, like the original), `logo-horizontal-*` (signs, headers, result sheets),
each in `color` (on white), `on-blue`, `on-burgundy`, `mono-black`, `mono-white`; plus `app-icon`, `avatar`, `tagline` (burgundy pill).

## Core colours (from the cover)

| Name | HEX | Use |
|---|---|---|
| Paper White · أبيض | `#FFFFFF` | dominant background, ~55% |
| Asema Red · أحمر العاصمة | `#E0262B` | the name, bubbles, red stripe, ~14% |
| Royal Blue · أزرق ملكي | `#33389A` | support: microscope, English line, title bar, ~10% |
| Burgundy · عنابي | `#9B1D32` | outer ring, pill bars, ~8% |
| Gold Orange · برتقالي ذهبي | `#F2A11F` | inner ring, highlights, ~6% |
| Ink Black · أسود | `#1A1A1A` | text, phone numbers, ~5% |
| Molecule Gray · رمادي الجزيئات | `#E6E6EC` | molecule pattern, light panels |

Cover elements: the burgundy + gold double ring (photo frame), the burgundy pill bar, the blue title bar, the light molecule pattern.

## Facebook

| File | Use |
|---|---|
| `social/facebook-profile-name.png` | **main profile picture**: mark + lab name inside a thin double ring, circle-safe |
| `social/facebook-profile-name-plain.png` | same without the ring |
| `social/facebook-profile.png` | profile picture, 1080x1080, mark inside the cover's double ring, circle-safe |
| `social/facebook-profile-plain.png` | same without the ring |
| `social/facebook-cover.png` | cover, 1640x720: fits desktop (820x312) and mobile (640x360); content stays clear of the profile circle in Arabic and English layouts |
| `social/preview.png` | how both crop on desktop and mobile |

## Rebuild

```bash
pip install fonttools uharfbuzz
python3 brand/al-asema-lab/build.py        # SVGs
node brand/al-asema-lab/render-png.mjs 2   # PNGs (scale arg: 2 = 2x, 4 = print size)
python3 brand/al-asema-lab/make_guide.py   # guide.html from guide.src.html
python3 brand/al-asema-lab/make_social.py && node brand/al-asema-lab/render-social.mjs  # Facebook assets
```
