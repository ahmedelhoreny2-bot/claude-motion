# Al Asema Lab: brand identity (معمل العاصمة للتحاليل الطبية)

Open `guide.html` in a browser for the full guide (Arabic): concept, logo versions, colours, type, rules, examples, motion.

## Files

| Path | What |
|---|---|
| `logo/svg/` | Every logo as vector, text converted to outlines (opens in Illustrator, Figma, Canva, browsers) |
| `logo/png/` | Same files at 2x, transparent background where the SVG has none |
| `palette.json` | Colours with HEX, RGB, CMYK, tint scales, contrast ratios |
| `brand.ts` | Palette, fonts and the mark's paths for Remotion videos |
| `fonts/` | Cairo and Montserrat (Google Fonts, SIL OFL) |

The mark is the lab's existing logo (microscope, swoosh, red stripe, sample bubbles) redrawn as clean vectors in red, black and white.

Logo variants: `mark-*` (symbol only), `logo-stacked-*` (main, like the original), `logo-horizontal-*` (signs, headers, result sheets),
each in `color` (on white), `on-black`, `on-red`, `mono-black`, `mono-white`; plus `app-icon` (red), `avatar` (white), `tagline`.

## Core colours

| Name | HEX | Use |
|---|---|---|
| Clean White · أبيض | `#FFFFFF` | dominant background, ~60% |
| Asema Red · أحمر العاصمة | `#E01E26` | brand colour: name, bubbles, stripe, headlines, offers, ~22% |
| Lab Black · أسود المعمل | `#141414` | microscope, text, dark sections, ~13% |
| Lab Gray · رمادي فاتح | `#F2F2F3` | cards and panels, ~5% |
| Deep Red · أحمر غامق | `#A3141B` | gradients, pressed states |
| Text Gray · رمادي النص | `#5F5F66` | secondary text |

No navy, purple or blue anywhere.

## Rebuild

```bash
pip install fonttools uharfbuzz
python3 brand/al-asema-lab/build.py        # SVGs
node brand/al-asema-lab/render-png.mjs 2   # PNGs (scale arg: 2 = 2x, 4 = print size)
python3 brand/al-asema-lab/make_guide.py   # guide.html from guide.src.html
```
