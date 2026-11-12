"""Series 5: the fatigue and anemia posts rebuilt in code around the ChatGPT illustrations.

Only the illustration is kept from the generated image (the night scene with the 3 AM clock; the drop,
battery and magnet as cut-outs). All text, cards, icons, logo and footer are drawn in the identity.

    python3 brand/al-asema-lab/make_series5.py && node brand/al-asema-lab/render-posts.mjs
"""
import base64
import io
from pathlib import Path

from PIL import Image

from build import BLUE, BURGUNDY, CAIRO_B, CAIRO_XB, MONT, ORANGE, RED, WHITE, svg
from make_creative import INK
from make_series2 import H, W, background, chips, footer, glow, kicker, logo_tab, tc, tr
from make_series3 import card, starburst
from make_series4 import icon

ROOT = Path(__file__).parent
POSTS = ROOT / "posts"


def png(im, x, y, w, h, extra=""):
    buf = io.BytesIO()
    im.save(buf, "PNG")
    data = base64.b64encode(buf.getvalue()).decode()
    return f'<image href="data:image/png;base64,{data}" x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}"{extra}/>'


def cut(name, cx, cy, h, shadow=0.18):
    im = Image.open(POSTS / "cut" / f"{name}.png").convert("RGBA")
    im = im.crop(im.getbbox())
    w = h * im.width / im.height
    fid = f"sh{name.replace('-', '')}"
    return (f'<filter id="{fid}" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="18" stdDeviation="18" '
            f'flood-color="#5C0E1D" flood-opacity="{shadow}"/></filter>'
            + png(im, cx - w / 2, cy - h / 2, w, h, f' filter="url(#{fid})"')), (cx - w / 2, cy - h / 2, w, h, im.width, im.height)


def pill(text, cx, cy, size, bg, fg, face=CAIRO_XB, latin=False, padx=None, h=None):
    f = MONT if latin else face
    w = f.width(text, size, rtl=not latin)
    padx = padx or size * 0.75
    h = h or size * 1.75
    p, _ = tc(f, text, size, cx, cy + size * 0.36, fg, rtl=not latin)
    return f'<rect x="{cx - w / 2 - padx:.1f}" y="{cy - h / 2:.1f}" width="{w + 2 * padx:.1f}" height="{h:.1f}" rx="{h / 2:.1f}" fill="{bg}"/>' + p


# ---------------------------------------------------------------- fatigue
TESTS8 = [("CBC", "صورة دم كاملة", RED), ("Fe", "مخزون الحديد", BLUE), ("A1c", "سكر تراكمي", BURGUNDY),
          ("D", "فيتامين د", ORANGE), ("ALT", "إنزيمات الكبد", BLUE), ("K", "وظائف الكلى", BURGUNDY),
          ("TC", "الكوليسترول", RED), ("TSH", "الغدة الدرقية", BLUE)]


def fatigue():
    b = [background("#F6EEF1"), logo_tab(), kicker("باقة الإجهاد والأرق")]
    p, _ = tr(CAIRO_XB, "صاحي تعبان..", 88, W - 50, 236, INK)
    b.append(p)
    p, _ = tr(CAIRO_XB, "ونايم قلقان؟", 108, W - 50, 354, RED)
    b.append(p)
    p, _ = tr(CAIRO_B, "يمكن السبب يبان في تحليل", 40, W - 50, 424, BLUE)
    b.append(p)
    # the night scene from the generated image, inside the cover's double ring
    src = Image.open(POSTS / "gpt" / "fatigue-src.png").convert("RGB")
    scx, scy, sr = 323, 812, 336        # scene circle in the source
    cx, cy, r = 368, 800, 318           # where it goes
    k = r / sr
    b.append(f'<clipPath id="win"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath>'
             f'<g clip-path="url(#win)">' + png(src, cx - scx * k, cy - scy * k, src.width * k, src.height * k) + '</g>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="{r + 22}" fill="none" stroke="{BURGUNDY}" stroke-width="40"/>'
             f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{ORANGE}" stroke-width="14"/>')
    # cover the generated 3:00 AM tag and price sticker with our own
    tx, ty = cx + (535 - scx) * k, cy + (631 - scy) * k
    b.append(pill("3:00 AM", tx, ty, 28, INK, WHITE, latin=True, padx=22, h=54))
    b.append(starburst(cx + (150 - scx) * k, cy + (1040 - scy) * k + 10, 104, "سعر", "خاص", rot=-12))
    # test card
    x1, top, cw = W - 40, 458, 330
    rh = 66
    ch = 92 + rh * len(TESTS8)
    b.append(card(x1 - cw, top, cw, ch, op=0.98))
    b.append(f'<rect x="{x1 - cw}" y="{top}" width="{cw}" height="84" rx="26" fill="{BURGUNDY}"/>'
             f'<rect x="{x1 - cw}" y="{top + 50}" width="{cw}" height="34" fill="{BURGUNDY}"/>')
    p, _ = tc(CAIRO_XB, "٨ تحاليل", 44, x1 - cw / 2, top + 58, WHITE)
    b.append(p)
    for i, (ab, ar, col) in enumerate(TESTS8):
        y = top + 92 + i * rh + rh / 2
        if i:
            b.append(f'<line x1="{x1 - cw + 24}" y1="{y - rh / 2:.1f}" x2="{x1 - 24}" y2="{y - rh / 2:.1f}" stroke="#000" stroke-opacity="0.07" stroke-width="2"/>')
        b.append(icon(x1 - cw + 52, y, 28, ab, bg=col))
        p, _ = tr(CAIRO_B, ar, 30, x1 - 26, y + 11, INK)
        b.append(p)
    b.append(footer("احجز باقة الإجهاد"))
    return svg(W, H, "".join(b))


# ---------------------------------------------------------------- anemia
def anemia():
    b = [background("#F6EEF1"), glow(300, 660, 420, "#F4B9C2", 0.45), logo_tab(), kicker("باقة الأنيميا والفيتامينات")]
    p, _ = tr(CAIRO_XB, "نفسك مقطوع؟", 100, W - 50, 248, RED)
    b.append(p)
    p, _ = tr(CAIRO_XB, "يمكن الحديد ناقص", 68, W - 50, 340, BLUE)
    b.append(p)
    b.append(starburst(150, 250, 84, "سعر", "خاص", rot=-12))
    # symptoms around the drop
    dx, dy = 262, 650
    tags = [("إرهاق", 118, 455), ("دوخة", 345, 410), ("صداع", 470, 530), ("شحوب", 72, 610), ("خمول", 72, 780)]
    for t, x, y in tags:
        b.append(f'<line x1="{x}" y1="{y}" x2="{dx}" y2="{dy - 40}" stroke="{RED}" stroke-width="3.5" stroke-dasharray="2 10" stroke-linecap="round"/>')
    img, _ = cut("a-drop", dx, dy, 420)
    b.append(img)
    for t, x, y in tags:
        c, _ = chips([t], x, y, 27, latin=False, fill=WHITE, fop=1, stroke=RED, sop=0.45, color=RED)
        b.append(c)
    # battery + magnet, label redrawn
    bcx, bcy, bh = 815, 585, 400
    img, (bx, by, bw, _, iw, ih) = cut("a-battery", bcx, bcy, bh, shadow=0.12)
    b.append(img)
    s = bw / iw
    # pill was at (112..388, 206..255) in the crop; the crop's bbox starts at (13, 0)
    px, py = bx + ((112 + 388) / 2 - 13) * s, by + (230 - 0) * s
    b.append(pill("مخزون الحديد", px, py, 28, BURGUNDY, WHITE, padx=24, h=50))
    yb = by + bh + 58
    p, w15 = tc(MONT, "15%", 74, bcx + 10, yb, RED, rtl=False)
    b.append(p)
    for sx, d in ((-1, 1), (1, 1)):
        x0 = bcx + 10 + sx * (w15 / 2 + 24)
        for j, ang in enumerate((-28, 0, 28)):
            import math
            a = math.radians(ang)
            x2 = x0 + sx * 34 * math.cos(a)
            y2 = yb - 26 + 34 * math.sin(a) * d
            b.append(f'<line x1="{x0:.1f}" y1="{yb - 26 + 12 * math.sin(a):.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{RED}" stroke-width="6" stroke-linecap="round"/>')
    # three test cards
    groups = [("الأنيميا والحديد", ["صورة دم كاملة CBC", "مخزون الحديد Ferritin", "الحديد Iron", "سعة الارتباط TIBC", "تشبع الحديد"], RED, 380),
              ("الفيتامينات", ["فيتامين د", "فيتامين B12"], BLUE, 290), ("المعادن", ["كالسيوم", "ماغنسيوم", "زنك"], BURGUNDY, 290)]
    x = W - 40
    top = 858
    for title, items, col, w in groups:
        b.append(card(x - w, top, w, 238, op=0.98))
        b.append(f'<rect x="{x - w}" y="{top}" width="{w}" height="56" rx="24" fill="{col}"/><rect x="{x - w}" y="{top + 28}" width="{w}" height="28" fill="{col}"/>')
        p, _ = tc(CAIRO_XB, title, 28, x - w / 2, top + 38, WHITE)
        b.append(p)
        for i, it in enumerate(items):
            yy = top + 90 + i * 34
            b.append(f'<circle cx="{x - 26}" cy="{yy - 9}" r="6" fill="{col}"/>')
            p, _ = tr(CAIRO_B, it, 25, x - 42, yy, INK)
            b.append(p)
        x -= w + 15
    b.append(footer("احجز باقة الأنيميا"))
    return svg(W, H, "".join(b))


SERIES = {"53-fatigue": fatigue, "54-anemia": anemia}

if __name__ == "__main__":
    for name, fn in SERIES.items():
        (POSTS / f"{name}.svg").write_text(fn())
    print("wrote", len(SERIES))
