"""Creative posts: a full AI-generated scene (posts/img/) dressed in the locked identity.

Every post carries: logo, headline + subline, a short fact about the topic,
and the footer (CTA, phones, address). Feed 1080x1350 and story 1080x1920.

    python3 brand/al-asema-lab/make_creative.py && node brand/al-asema-lab/render-posts.mjs

Add a post: put the scene in posts/img/, add an entry to POSTS.
"""
import base64
import io
from pathlib import Path

from PIL import Image

from build import BLUE, BURGUNDY, CAIRO_B, CAIRO_XB, MONT, ORANGE, RED, WHITE, svg
from make_social import embed, molecule

ROOT = Path(__file__).parent
OUT = ROOT / "posts"
INK, GRAY = "#1A1A1A", "#5F5F66"
PHONES = "01096534354  ·  01019289733"
ADDRESS = "ميت غمر · برج دهب · شارع الجيش · ناصية شارع أبوسنة · أعلى التوحيد والنور · الدور الأول"

POSTS = {
    "04-creative-liver-hero": dict(
        img="liver-hero.png",
        title="كبدك بطل..",
        sub="بس حتى الأبطال محتاجين كشف",
        fact=["الكبد بيقوم بأكتر من ٥٠٠ وظيفة في جسمك،", "ومشاكله في الأول غالبًا بتكون من غير أعراض."],
        cta="احجز باقة الكبد",
    ),
}


def scene(path, W, top, scale, fade=90):
    """Scene centred at `scale` of the width; off-white lifted to white, bottom faded, multiplied onto the page."""
    im = Image.open(path).convert("RGB")
    lut = [min(255, round(v * 255 / 238)) if v < 238 else 255 for v in range(256)]
    im = im.point(lut * 3)
    buf = io.BytesIO()
    im.save(buf, "PNG")
    data = base64.b64encode(buf.getvalue()).decode()
    w = W * scale
    h = w * im.height / im.width
    x = (W - w) / 2
    return (
        '<defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="{1 - fade / h:.4f}" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>'
        f'<mask id="m"><rect x="{x}" y="{top}" width="{w}" height="{h}" fill="url(#fade)"/></mask></defs>'
        f'<image href="data:image/png;base64,{data}" x="{x:.1f}" y="{top:.1f}" width="{w:.1f}" height="{h:.1f}" '
        'mask="url(#m)" style="mix-blend-mode:multiply"/>'
    )


def text_right(face, text, size, x_right, baseline, color, rtl=True, tracking=0):
    w = face.width(text, size, rtl=rtl, tracking=tracking)
    return f'<path fill="{color}" d="{face.path(text, size, x_right - w, baseline, rtl=rtl, tracking=tracking)}"/>', w


def fact_card(lines, x_right, top, size=27):
    """Small 'did you know' card: light panel, orange edge, label, short lines."""
    widths = [CAIRO_B.width(t, size, rtl=True) for t in lines]
    label = "معلومة"
    lw = CAIRO_XB.width(label, size, rtl=True)
    pad = 24
    w = max(max(widths), lw + 40) + 2 * pad + 10
    lh = size * 1.55
    h = pad * 2 + lh * len(lines) + size * 1.1
    x = x_right - w
    out = [f'<rect x="{x:.1f}" y="{top}" width="{w:.1f}" height="{h:.1f}" rx="20" fill="#F6F6F9" fill-opacity="0.92"/>',
           f'<rect x="{x_right - 8:.1f}" y="{top}" width="8" height="{h:.1f}" rx="4" fill="{ORANGE}"/>']
    xr = x_right - 10 - pad
    y = top + pad + size * 0.9
    p, _ = text_right(CAIRO_XB, label, size, xr, y, BURGUNDY)
    out.append(p)
    out.append(f'<circle cx="{xr - lw - 16:.1f}" cy="{y - size * 0.3:.1f}" r="6" fill="{ORANGE}"/>')
    for t in lines:
        y += lh
        p, _ = text_right(CAIRO_B, t, size, xr, y, INK)
        out.append(p)
    return "".join(out), h


def footer(cta, W, y):
    """Row 1: burgundy CTA pill + phones (blue). Row 2: address with a pin."""
    out = []
    csz, psz = 34, 33
    cw = CAIRO_XB.width(cta, csz, rtl=True)
    pw = MONT.width(PHONES, psz, tracking=0.03)
    gap, padx, ph = 34, 34, 66
    x0 = (W - (cw + 2 * padx + gap + pw)) / 2
    px = x0 + pw + gap
    out.append(f'<rect x="{px:.1f}" y="{y - ph / 2:.1f}" width="{cw + 2 * padx:.1f}" height="{ph}" rx="{ph / 2}" fill="{BURGUNDY}"/>')
    out.append(f'<path fill="{WHITE}" d="{CAIRO_XB.path(cta, csz, px + padx, y + csz * 0.36, rtl=True)}"/>')
    out.append(f'<path fill="{BLUE}" d="{MONT.path(PHONES, psz, x0, y + psz * 0.36, tracking=0.03)}"/>')
    asz = 24
    aw = CAIRO_B.width(ADDRESS, asz, rtl=True)
    ay = y + 64
    ax = (W - aw) / 2 - 14
    pinx = ax + aw + 22
    out.append(f'<path fill="{RED}" d="M{pinx:.1f},{ay + 4} c-8,-10 -12,-15 -12,-21 a12,12 0 1 1 24,0 c0,6 -4,11 -12,21 Z"/>'
               f'<circle cx="{pinx:.1f}" cy="{ay - 17}" r="4.5" fill="{WHITE}"/>')
    out.append(f'<path fill="{GRAY}" d="{CAIRO_B.path(ADDRESS, asz, ax, ay, rtl=True)}"/>')
    return "".join(out)


def stripes(W, H):
    return (f'<rect y="{H - 16}" width="{W}" height="6" fill="{ORANGE}"/>'
            f'<rect y="{H - 10}" width="{W}" height="10" fill="{BURGUNDY}"/>')


def ring(cx, cy, r, sw):
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{BURGUNDY}" stroke-width="{sw}"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r - sw * 0.82:.1f}" fill="none" stroke="{ORANGE}" stroke-width="{sw * 0.6:.1f}"/>')


def feed(p):
    W, H = 1080, 1350
    b = [f'<rect width="{W}" height="{H}" fill="{WHITE}"/>',
         molecule(90, 330, 0.7, hi=True), molecule(560, 70, 0.45), molecule(70, 760, 0.55), molecule(1015, 700, 0.5),
         ring(-50, -70, 190, 32)]
    b.append(scene(ROOT / "posts" / "img" / p["img"], W, 150, 0.80))
    logo, _ = embed("logo-horizontal-color", W - 50 - 290, 30, 290)
    b.append(logo)
    xr = W - 56
    t, _ = text_right(CAIRO_XB, p["title"], 112, xr, 250, RED)
    b.append(t)
    t, _ = text_right(CAIRO_XB, p["sub"], 48, xr, 322, BLUE)
    b.append(t)
    card, _ = fact_card(p["fact"], xr, 348, size=24)
    b.append(card)
    b.append(footer(p["cta"], W, 1236))
    b.append(stripes(W, H))
    return svg(W, H, "".join(b))


def story(p):
    W, H = 1080, 1920  # keep content out of the top ~250px and bottom ~250px (story UI)
    b = [f'<rect width="{W}" height="{H}" fill="{WHITE}"/>',
         molecule(110, 470, 0.8, hi=True), molecule(560, 200, 0.5), molecule(80, 1100, 0.6), molecule(1000, 1040, 0.55),
         ring(-50, -60, 250, 38)]
    b.append(scene(ROOT / "posts" / "img" / p["img"], W, 470, 0.84))
    logo, _ = embed("logo-horizontal-color", W - 60 - 320, 250, 320)
    b.append(logo)
    xr = W - 60
    t, _ = text_right(CAIRO_XB, p["title"], 130, xr, 495, RED)
    b.append(t)
    t, _ = text_right(CAIRO_XB, p["sub"], 54, xr, 575, BLUE)
    b.append(t)
    card, _ = fact_card(p["fact"], xr, 606, size=27)
    b.append(card)
    b.append(footer(p["cta"], W, 1620))
    b.append(stripes(W, H))
    return svg(W, H, "".join(b))


if __name__ == "__main__":
    (OUT / "story").mkdir(parents=True, exist_ok=True)
    for key, p in POSTS.items():
        (OUT / f"{key}.svg").write_text(feed(p))
        (OUT / "story" / f"{key}-story.svg").write_text(story(p))
    print("wrote", len(POSTS), "creative posts")
