"""Detach the DNA helix from the hairbrush photo: lift a clean segment of the helix, erase the helix and the
fine hairs that reach up to it, fill what was behind, and float the helix in the empty top-right corner.

    python3 brand/al-asema-lab/edit_hair.py <source.png>   ->  posts/img/q-hair.png (graded)
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

from brand_grade import grade

ROOT = Path(__file__).parent


def hsv(a):
    mx, mn = a.max(-1), a.min(-1)
    d = np.maximum(mx - mn, 1e-6)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    return h, s, mx


def main(src):
    im = Image.open(src).convert("RGB")
    a = np.asarray(im).astype(np.float32) / 255
    H, W = a.shape[:2]
    h, s, v = hsv(a)
    yy, xx = np.mgrid[0:H, 0:W]

    # helix pixels: warm, saturated, bright, and thick (opening drops the thin hair strands)
    warm = ((h < 55) | (h > 335)) & (s > 0.35) & (v > 0.5)
    helix = ndimage.binary_opening(warm, structure=np.ones((5, 5)))
    helix = ndimage.binary_dilation(helix, iterations=2)
    region = (xx > 560) & (yy < 800)
    helix &= region
    # its glow and sparks
    glow = ((h < 60) | (h > 330)) & (s > 0.15) & (v > 0.75) & (xx > 600) & (yy < 760)

    # 1. lift a clean segment from the upper part, on white
    seg_box = (640, 40, 1115, 590)
    loose = ((h < 55) | (h > 335)) & (s > 0.25) & (v > 0.45)
    loose = ndimage.binary_opening(loose, structure=np.ones((3, 3)))
    seg_mask = (helix | glow | loose) & (yy >= seg_box[1]) & (yy < seg_box[3]) & (xx >= seg_box[0]) & (xx < seg_box[2])
    seg_mask = ndimage.binary_closing(seg_mask, iterations=2)
    alpha = Image.fromarray((seg_mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    seg = im.copy().convert("RGBA")
    seg.putalpha(alpha)
    seg = seg.crop(seg_box)
    seg = seg.crop(seg.getbbox())

    # 2. erase: everything above the hair line on the right becomes clean white (soft edge) ...
    hair_line = np.where(xx < 560, 450, 540)
    clear = (yy < hair_line) & (xx > 430)
    clear_soft = ndimage.gaussian_filter(clear.astype(np.float32), 18)
    # ... and where the helix ran through the hair, clone real hair + bristle texture from the left of the brush
    faint = ((h < 60) | (h > 330)) & (s > 0.12) & (v > 0.62)
    patch = (helix | faint) & ~clear & (xx > 590) & (xx < 990) & (yy > 440) & (yy < 820)
    patch = ndimage.binary_closing(patch, iterations=6)
    patch = ndimage.binary_dilation(patch, iterations=8)
    soft = ndimage.gaussian_filter(patch.astype(np.float32), 7)[..., None]
    # out[y, x] takes a[y + 30, x - 340]: the same band of hair and bristles further left on the brush
    shifted = np.roll(np.roll(a, -30, axis=0), 340, axis=1)
    out = a * (1 - soft) + shifted * soft
    white = np.ones_like(out) * np.array([0.985, 0.985, 0.985])
    out = out * (1 - clear_soft[..., None]) + white * clear_soft[..., None]
    base = Image.fromarray((out * 255).astype(np.uint8)).convert("RGBA")

    # 3. float the helix in the empty top-right corner, smaller and tilted, with air below it
    k = 470 / seg.height
    seg = seg.resize((int(seg.width * k), int(seg.height * k)), Image.LANCZOS).rotate(-8, expand=True, resample=Image.BICUBIC)
    shadow = Image.new("RGBA", seg.size, (0, 0, 0, 0))
    shadow.putalpha(seg.getchannel("A").point(lambda p: int(p * 0.18)).filter(ImageFilter.GaussianBlur(14)))
    x, y = W - seg.width - 20, 20
    base.alpha_composite(shadow, (x + 10, y + 26))
    base.alpha_composite(seg, (x, y))
    graded = grade(base.convert("RGB"))
    dst = ROOT / "posts" / "img" / "q-hair.png"
    graded.save(dst)
    print("wrote", dst, "helix at", (x, y, seg.width, seg.height))


if __name__ == "__main__":
    main(sys.argv[1])
