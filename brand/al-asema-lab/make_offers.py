"""Offer posts (1080x1350) in the locked identity: a test package with its photo inside
the cover's double ring, the test list, the price and the contact band.

    python3 brand/al-asema-lab/make_offers.py && node brand/al-asema-lab/render-posts.mjs

Photos go in posts/img/<key>.png (any size, square works best; it is cropped to a circle).
Until a photo exists, a light placeholder shows where it goes.
"""
import base64
from pathlib import Path

from build import BLUE, BURGUNDY, CAIRO_B, CAIRO_XB, MONT, ORANGE, RED, WHITE, svg
from make_social import embed, molecule, pill

ROOT = Path(__file__).parent
OUT = ROOT / "posts"
IMG = OUT / "img"
W, H = 1080, 1350
INK, GRAY = "#1A1A1A", "#6B6B73"
PHONES = "01096534354   ·   01019289733"

OFFERS = {
    "liver": dict(
        title="باقة الكبد",
        tagline="كبدك بيشتغل في صمت.. اطمن عليه",
        accent=RED,
        tests=[
            ("إنزيمات الكبد", "ALT · AST"),
            ("إنزيم الفوسفاتيز القلوي", "ALP"),
            ("إنزيم جاما جي تي", "GGT"),
            ("الصفراء الكلية والمباشرة", "Bilirubin T · D"),
            ("الألبومين", "Albumin"),
            ("البروتين الكلي", "Total Protein"),
        ],
        price="000", old=None,
    ),
    "kidney": dict(
        title="باقة الكلى",
        tagline="كليتك بتنضف جسمك.. اطمن عليها",
        accent=BLUE,
        tests=[
            ("الكرياتينين", "Creatinine"),
            ("اليوريا", "Urea"),
            ("حمض اليوريك", "Uric Acid"),
            ("الصوديوم والبوتاسيوم", "Na · K"),
            ("معدل الترشيح الكلوي", "eGFR"),
            ("تحليل البول الكامل", "Urine Analysis"),
        ],
        price="000", old=None,
    ),
}


def right(face, text, size, x_right, baseline, color, rtl=True, tracking=0):
    w = face.width(text, size, rtl=rtl, tracking=tracking)
    return f'<path fill="{color}" d="{face.path(text, size, x_right - w, baseline, rtl=rtl, tracking=tracking)}"/>', w


def check(cx, cy, r, color):
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{color}"/>'
            f'<path d="M{cx - r * .45},{cy + r * .02} L{cx - r * .1},{cy + r * .38} L{cx + r * .48},{cy - r * .36}" '
            f'fill="none" stroke="{WHITE}" stroke-width="{r * .28:.1f}" stroke-linecap="round" stroke-linejoin="round"/>')


def photo(key, cx, cy, r):
    p = next((IMG / f"{key}{e}" for e in (".png", ".jpg", ".jpeg", ".webp") if (IMG / f"{key}{e}").exists()), None)
    out = [f'<clipPath id="c-{key}"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath>']
    if p:
        mime = "jpeg" if p.suffix in (".jpg", ".jpeg") else p.suffix[1:]
        data = base64.b64encode(p.read_bytes()).decode()
        out.append(f'<image href="data:image/{mime};base64,{data}" x="{cx - r}" y="{cy - r}" width="{2 * r}" height="{2 * r}" '
                   f'preserveAspectRatio="xMidYMid slice" clip-path="url(#c-{key})"/>')
    else:
        out.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#F1F1F6"/>')
        t = "مكان الصورة"
        w = CAIRO_B.width(t, 34, rtl=True)
        out.append(f'<path fill="#B9B9C6" d="{CAIRO_B.path(t, 34, cx - w / 2, cy + 12, rtl=True)}"/>')
    return "".join(out)


def offer(key, o):
    acc = o["accent"]
    b = [f'<rect width="{W}" height="{H}" fill="{WHITE}"/>',
         molecule(90, 1080, 0.8), molecule(600, 1080, 0.6), molecule(990, 1085, 0.6)]
    # header: logo right, "special offer" badge left
    logo, lh = embed("logo-horizontal-color", W - 60 - 340, 34, 340)
    b.append(logo)
    b.append(pill("عرض خاص", 170, 34 + lh / 2, 38, ORANGE, INK, face=CAIRO_XB, padx=40, h=74))
    # title + tagline
    y = 34 + lh + 30
    p, _ = right(CAIRO_XB, o["title"], 118, W - 60, y + 110, RED)
    b.append(p)
    p, _ = right(CAIRO_B, o["tagline"], 42, W - 60, y + 180, BLUE)
    b.append(p)
    b.append(f'<rect x="{W - 60 - 150}" y="{y + 206}" width="150" height="8" rx="4" fill="{ORANGE}"/>')
    # photo inside the cover's double ring, left
    cx, cy, r = 300, 735, 205
    b.append(photo(key, cx, cy, r))
    b.append(f'<circle cx="{cx}" cy="{cy}" r="{r + 26}" fill="none" stroke="{BURGUNDY}" stroke-width="30"/>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="{r + 4}" fill="none" stroke="{ORANGE}" stroke-width="14"/>')
    # test list, right column
    ty = y + 280
    for ar, en in o["tests"]:
        b.append(check(W - 60 - 22, ty + 22, 22, acc))
        p, _ = right(CAIRO_B, ar, 36, W - 60 - 58, ty + 34, INK)
        b.append(p)
        p, _ = right(MONT, en, 21, W - 60 - 58, ty + 68, GRAY, rtl=False, tracking=0.06)
        b.append(p)
        ty += 92
    # price seal over the ring, bottom-right of the photo
    sx, sy, sr = cx + 190, cy + 175, 105
    b.append(f'<circle cx="{sx}" cy="{sy}" r="{sr + 10}" fill="{WHITE}"/>')
    b.append(f'<circle cx="{sx}" cy="{sy}" r="{sr}" fill="{RED}"/>')
    pw = MONT.width(o["price"], 66)
    b.append(f'<path fill="{WHITE}" d="{MONT.path(o["price"], 66, sx - pw / 2, sy + 14)}"/>')
    jw = CAIRO_B.width("جنيه", 30, rtl=True)
    b.append(f'<path fill="{WHITE}" d="{CAIRO_B.path("جنيه", 30, sx - jw / 2, sy + 58, rtl=True)}"/>')
    if o["old"]:
        ow = MONT.width(o["old"], 28)
        b.append(f'<path fill="#FFD3D6" d="{MONT.path(o["old"], 28, sx - ow / 2, sy - 52)}"/>')
        b.append(f'<line x1="{sx - ow / 2 - 4}" y1="{sy - 62}" x2="{sx + ow / 2 + 4}" y2="{sy - 62}" stroke="{WHITE}" stroke-width="3"/>')
    # contact band
    band = H - 190
    b.append(f'<rect y="{band}" width="{W}" height="190" fill="{BURGUNDY}"/>')
    b.append(f'<rect y="{band - 12}" width="{W}" height="12" fill="{ORANGE}"/>')
    t = "للحجز والاستفسار"
    tw = CAIRO_XB.width(t, 40, rtl=True)
    b.append(f'<path fill="{ORANGE}" d="{CAIRO_XB.path(t, 40, (W - tw) / 2, band + 70, rtl=True)}"/>')
    pw = MONT.width(PHONES, 44, tracking=0.04)
    b.append(f'<path fill="{WHITE}" d="{MONT.path(PHONES, 44, (W - pw) / 2, band + 145, tracking=0.04)}"/>')
    return svg(W, H, "".join(b))


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    IMG.mkdir(exist_ok=True)
    for i, (k, o) in enumerate(OFFERS.items(), start=2):
        (OUT / f"{i:02d}-offer-{k}.svg").write_text(offer(k, o))
    print("wrote offers to", OUT)
