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

Logo variants: `mark-*` (symbol only), `logo-horizontal-*` (main), `logo-stacked-*` (square posts, video),
each in `color`, `reverse` (on indigo), `mono-dark`, `mono-white`; plus `app-icon`, `avatar`, `tagline`.

## Core colours

| | Name | HEX | Use |
|---|---|---|---|
| ■ | Capital Indigo · أزرق العاصمة | `#1F2470` | primary, ~55% |
| ■ | Lab Mist · ضباب المعمل | `#EEF0FB` | light backgrounds, ~20% |
| ■ | Sample Crimson · أحمر العيّنة | `#E1263C` | accent, one highlight per layout, ~10% |
| ■ | Result Teal · أخضر النتيجة | `#0FA39A` | support: normal results, health, ~10% |
| ■ | Ink · حبر | `#0D1030` | body text, ~5% |

## Rebuild

```bash
pip install fonttools uharfbuzz
python3 brand/al-asema-lab/build.py        # SVGs
node brand/al-asema-lab/render-png.mjs 2   # PNGs (scale arg: 2 = 2x, 4 = print size)
python3 brand/al-asema-lab/make_guide.py   # guide.html from guide.src.html
```
