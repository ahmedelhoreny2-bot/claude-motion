"""Pull an externally generated design onto the brand palette, and put the real logo back.

    python3 brand/al-asema-lab/brand_grade.py posts/gpt/checkup.png [--logo x0,y0,x1,y1]

Hue is remapped onto the four brand families (red/burgundy, gold-orange, royal blue; greens left
alone), cyan and purple fold into royal blue, pink folds into red, and near-whites lose their tint so
backgrounds read clean white / light gray. Saturation of brand-family pixels is nudged toward the brand
swatches. With --logo, that box is replaced by the real logo on a white tab.
"""
import argparse
import colorsys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).parent
HEX = {"red": "#E0262B", "burgundy": "#9B1D32", "orange": "#F2A11F", "blue": "#33389A"}


def hue(hexs):
    r, g, b = (int(hexs[i:i + 2], 16) / 255 for i in (1, 3, 5))
    return colorsys.rgb_to_hsv(r, g, b)


RED_H = hue(HEX["red"])[0] * 360           # ~358
ORANGE_H = hue(HEX["orange"])[0] * 360     # ~37
BLUE_H = hue(HEX["blue"])[0] * 360         # ~237

# piecewise-linear hue remap on an unwrapped axis starting at -30 deg (in -> out)
ANCHORS = [(-30, RED_H - 360 - 4), (0, RED_H - 360), (12, RED_H - 360 + 2), (20, 16), (28, ORANGE_H - 2),
           (52, ORANGE_H + 3), (70, 52), (160, 160), (185, BLUE_H - 6), (272, BLUE_H + 2), (300, BLUE_H + 8),
           (330, RED_H - 4)]


def remap_hue(h):
    hu = np.where(h >= 330, h - 360, h)
    xs = np.array([a for a, _ in ANCHORS])
    ys = np.array([b for _, b in ANCHORS])
    return np.mod(np.interp(hu, xs, ys), 360)


def grade(img):
    a = np.asarray(img.convert("RGB")).astype(np.float32) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    v = mx
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    d = np.maximum(mx - mn, 1e-6)
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    h2 = remap_hue(h)
    # brand-family saturation: blues and reds slightly richer, oranges as is
    fam_blue = (h2 > 200) & (h2 < 280)
    fam_red = (h2 > 330) | (h2 < 12)
    s2 = s.copy()
    s2 = np.where(fam_blue & (s > 0.25), np.minimum(1, s * 1.08 + 0.04), s2)
    s2 = np.where(fam_red & (s > 0.3), np.minimum(1, s * 1.05), s2)
    # cyan / sky tones (lab glass, screens, haze) are not brand colors: neutralize them instead of turning them royal blue
    # and azure only moves halfway to royal blue, so photos don't turn violet
    cyan = (h > 165) & (h < 214)
    azure = (h >= 214) & (h < 262)
    h2 = np.where(cyan, h, h2)
    h2 = np.where(azure, h + (BLUE_H - h) * 0.55, h2)
    s2 = np.where(cyan, s * 0.3, s2)
    s2 = np.where(azure & (v > 0.6) & (s < 0.6), s * 0.75, s2)
    # tinted light backgrounds (pink, lavender, cyan haze) -> clean white / light gray
    light = (v > 0.82) & (s < 0.32)
    s2 = np.where(light, s2 * 0.18, s2)
    # convert back
    hh = h2 / 60
    i = np.floor(hh).astype(int) % 6
    f = hh - np.floor(hh)
    p = v * (1 - s2)
    q = v * (1 - s2 * f)
    t = v * (1 - s2 * (1 - f))
    out = np.zeros_like(a)
    for k, (R, G, B) in enumerate([(v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q)]):
        m = i == k
        out[..., 0] = np.where(m, R, out[..., 0])
        out[..., 1] = np.where(m, G, out[..., 1])
        out[..., 2] = np.where(m, B, out[..., 2])
    # leave near-grays untouched in hue (avoids tinting neutral shadows)
    gray = s < 0.06
    out = np.where(gray[..., None], a, out)
    return Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))


def put_logo(img, box):
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    tab = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((x0, y0 - 40, x1, y1 + 6), 34, fill=(0, 0, 0, 60))
    sh = sh.filter(ImageFilter.GaussianBlur(12))
    ImageDraw.Draw(tab).rounded_rectangle((x0, y0 - 40, x1, y1), 34, fill=(255, 255, 255, 255))
    logo = Image.open(ROOT / "logo/png/logo-stacked-color.png").convert("RGBA")
    logo = logo.crop(logo.getbbox())
    k = min((w - 36) / logo.width, (h - 30) / logo.height)
    logo = logo.resize((int(logo.width * k), int(logo.height * k)), Image.LANCZOS)
    base = img.convert("RGBA")
    base.alpha_composite(sh)
    base.alpha_composite(tab)
    base.alpha_composite(logo, (x0 + (w - logo.width) // 2, y0 + (h - logo.height) // 2))
    return base.convert("RGB")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("--logo", help="x0,y0,x1,y1 of the logo tab to replace")
    ap.add_argument("--out")
    a = ap.parse_args()
    src = Path(a.src)
    img = grade(Image.open(src))
    if a.logo:
        img = put_logo(img, tuple(int(v) for v in a.logo.split(",")))
    out = Path(a.out) if a.out else src.with_name(src.stem + "-brand.png")
    img.save(out)
    print("wrote", out)


if __name__ == "__main__":
    main()
