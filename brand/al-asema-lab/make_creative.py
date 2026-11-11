"""Creative posts: a full AI-generated scene (posts/img/) dressed in the locked identity.

    python3 brand/al-asema-lab/make_creative.py && node brand/al-asema-lab/render-posts.mjs
"""
import base64
from pathlib import Path

from PIL import Image

from build import BLUE, BURGUNDY, CAIRO_B, CAIRO_XB, MONT, ORANGE, RED, WHITE, svg
from make_social import embed, molecule

ROOT = Path(__file__).parent
OUT = ROOT / "posts"
W, H = 1080, 1350
PHONES = "01096534354  ·  01019289733"


def scene(path, top, scale, fade=90):
    """Place the scene centred, `scale` of the canvas width, top at `top`; fade its bottom edge to white."""
    iw, ih = Image.open(path).size
    w = W * scale
    h = w * ih / iw
    x = (W - w) / 2
    # lift the generator's off-white background to pure white so no box shows around the scene
    import io
    im = Image.open(path).convert("RGB")
    lut = [0 if v < 0 else min(255, round(v * 255 / 238)) if v < 238 else 255 for v in range(256)]
    im = im.point(lut * 3)
    buf = io.BytesIO()
    im.save(buf, "PNG")
    data = base64.b64encode(buf.getvalue()).decode()
    return (
        '<defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="{1 - fade / h:.4f}" stop-color="#fff"/><stop offset="1" stop-color="#000"/>'
        '</linearGradient>'
        f'<mask id="m"><rect x="{x}" y="{top}" width="{w}" height="{h}" fill="url(#fade)"/></mask></defs>'
        f'<image href="data:image/png;base64,{data}" x="{x:.1f}" y="{top:.1f}" width="{w:.1f}" height="{h:.1f}" mask="url(#m)" style="mix-blend-mode:multiply"/>'
    ), top + h


def text_right(face, text, size, x_right, baseline, color, rtl=True, tracking=0):
    w = face.width(text, size, rtl=rtl, tracking=tracking)
    return f'<path fill="{color}" d="{face.path(text, size, x_right - w, baseline, rtl=rtl, tracking=tracking)}"/>', w


def cta_bar(cta, W=W, H=H, y=None):
    """Light bottom bar: burgundy CTA pill + phones in blue, cover's double stripe on the edge."""
    out = []
    y = y or H - 72
    csz = 34
    cw = CAIRO_XB.width(cta, csz, rtl=True)
    psz = 33
    pw = MONT.width(PHONES, psz, tracking=0.03)
    gap, padx, ph = 34, 34, 66
    total = cw + 2 * padx + gap + pw
    x0 = (W - total) / 2
    px = x0 + pw + gap  # pill on the right (RTL)
    out.append(f'<rect x="{px:.1f}" y="{y - ph / 2:.1f}" width="{cw + 2 * padx:.1f}" height="{ph}" rx="{ph / 2}" fill="{BURGUNDY}"/>')
    out.append(f'<path fill="{WHITE}" d="{CAIRO_XB.path(cta, csz, px + padx, y + csz * 0.36, rtl=True)}"/>')
    out.append(f'<path fill="{BLUE}" d="{MONT.path(PHONES, psz, x0, y + psz * 0.36, tracking=0.03)}"/>')
    out.append(f'<rect y="{H - 16}" width="{W}" height="6" fill="{ORANGE}"/>')
    out.append(f'<rect y="{H - 10}" width="{W}" height="10" fill="{BURGUNDY}"/>')
    return "".join(out)


def liver_hero():
    b = [f'<rect width="{W}" height="{H}" fill="{WHITE}"/>']
    # cover identity in the background: molecules + the double ring, top-left
    b += [molecule(105, 285, 0.8, hi=True), molecule(600, 80, 0.5), molecule(80, 640, 0.6), molecule(1010, 560, 0.55)]
    b.append(f'<circle cx="-50" cy="-70" r="200" fill="none" stroke="{BURGUNDY}" stroke-width="34"/>')
    b.append(f'<circle cx="-50" cy="-70" r="172" fill="none" stroke="{ORANGE}" stroke-width="20"/>')
    img, _ = scene(ROOT / "posts" / "img" / "liver-hero.png", 30, 0.90)
    b.append(img)
    # logo, top-right
    logo, lh = embed("logo-horizontal-color", W - 50 - 300, 34, 300)
    b.append(logo)
    # headline
    xr = W - 56
    p, w1 = text_right(CAIRO_XB, "كبدك بطل..", 128, xr, 300, RED)
    b.append(p)
    p, w2 = text_right(CAIRO_XB, "بس حتى الأبطال محتاجين كشف", 54, xr, 384, BLUE)
    b.append(p)
    b.append(f'<rect x="{xr - 140}" y="408" width="140" height="9" rx="4.5" fill="{ORANGE}"/>')
    b.append(cta_bar("احجز باقة الكبد"))
    return svg(W, H, "".join(b))


def liver_hero_story():
    SW, SH = 1080, 1920  # keep content out of the top ~250px and bottom ~250px (story UI)
    b = [f'<rect width="{SW}" height="{SH}" fill="{WHITE}"/>']
    b += [molecule(120, 560, 0.85, hi=True), molecule(560, 230, 0.55), molecule(90, 1050, 0.6), molecule(1000, 980, 0.55)]
    b.append(f'<circle cx="-50" cy="-60" r="260" fill="none" stroke="{BURGUNDY}" stroke-width="40"/>')
    b.append(f'<circle cx="-50" cy="-60" r="226" fill="none" stroke="{ORANGE}" stroke-width="24"/>')
    global W
    W0, W = W, SW
    img, _ = scene(ROOT / "posts" / "img" / "liver-hero.png", 400, 0.92)
    W = W0
    b.append(img)
    logo, lh = embed("logo-horizontal-color", SW - 60 - 330, 250, 330)
    b.append(logo)
    xr = SW - 60
    p, _ = text_right(CAIRO_XB, "كبدك بطل..", 140, xr, 560, RED)
    b.append(p)
    p, _ = text_right(CAIRO_XB, "بس حتى الأبطال محتاجين كشف", 58, xr, 652, BLUE)
    b.append(p)
    b.append(f'<rect x="{xr - 150}" y="678" width="150" height="10" rx="5" fill="{ORANGE}"/>')
    b.append(cta_bar("احجز باقة الكبد", SW, SH, y=1690))
    return svg(SW, SH, "".join(b))


if __name__ == "__main__":
    (OUT / "04-creative-liver-hero.svg").write_text(liver_hero())
    (OUT / "story").mkdir(exist_ok=True)
    (OUT / "story" / "04-creative-liver-hero-story.svg").write_text(liver_hero_story())
    print("wrote", OUT / "04-creative-liver-hero.svg")
