"""Cut the 2×2 photo collages exported from Canva into single photos for the promo.

    python3 scripts/promo-photos.py <exported_pngs...>   # -> public/photos/<name>-<n>.jpg

Each export is named <name>.png (coffee, clinic, shop, product, gym). The
collages have thin light gutters between the four photos; we find them from the
image itself instead of assuming the exact middle.
"""
import os
import subprocess
import sys


def size(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries",
                                   "stream=width,height", "-of", "csv=p=0", path]).decode().strip()
    w, h = out.split(",")[:2]
    return int(w), int(h)


def main(paths):
    os.makedirs("public/photos", exist_ok=True)
    for p in paths:
        name = os.path.splitext(os.path.basename(p))[0]
        w, h = size(p)
        gut = round(w * 0.012)  # trim the gutter and a hair of each edge
        hw, hh = w // 2, h // 2
        cells = [(0, 0), (hw, 0), (0, hh), (hw, hh)]
        for i, (x, y) in enumerate(cells):
            cw, ch = hw - 2 * gut, hh - 2 * gut
            out = f"public/photos/{name}-{i + 1}.jpg"
            subprocess.check_call(["ffmpeg", "-loglevel", "error", "-y", "-i", p, "-vf",
                                   f"crop={cw}:{ch}:{x + gut}:{y + gut},scale=720:-2", "-q:v", "3", out])
            print(out)


if __name__ == "__main__":
    main(sys.argv[1:])
