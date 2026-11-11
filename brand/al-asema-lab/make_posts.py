"""Facebook feed posts (1080x1350, 4:5) in the locked identity.

    python3 brand/al-asema-lab/make_posts.py && node brand/al-asema-lab/render-posts.mjs
"""
from pathlib import Path

from build import BLUE, BURGUNDY, CAIRO_B, CAIRO_XB, MONT, ORANGE, RED, WHITE, svg
from make_social import embed, molecule, pill

OUT = Path(__file__).parent / "posts"
W, H = 1080, 1350
INK = "#1A1A1A"


def centered(face, text, size, cy, color, rtl=True, tracking=0):
    w = face.width(text, size, rtl=rtl, tracking=tracking)
    return f'<path fill="{color}" d="{face.path(text, size, (W - w) / 2, cy + size * 0.36, rtl=rtl, tracking=tracking)}"/>'


def intro():
    b = [f'<rect width="{W}" height="{H}" fill="{WHITE}"/>',
         molecule(120, 150, 1.3, hi=True), molecule(960, 260, 1.0), molecule(980, 900, 1.2), molecule(110, 820, 0.9)]
    # cover's double ring, top-right corner
    b.append(f'<circle cx="1110" cy="-30" r="200" fill="none" stroke="{BURGUNDY}" stroke-width="38"/>')
    b.append(f'<circle cx="1110" cy="-30" r="169" fill="none" stroke="{ORANGE}" stroke-width="22"/>')
    logo, lh = embed("logo-stacked-color", (W - 640) / 2, 70, 640)
    b.append(logo)
    y = 70 + lh + 20
    # blue title bar
    t = "نظام آلي متكامل"
    tw = CAIRO_XB.width(t, 62, rtl=True)
    b.append(f'<rect x="{(W - tw) / 2 - 36:.1f}" y="{y:.1f}" width="{tw + 72:.1f}" height="96" fill="{BLUE}"/>')
    b.append(centered(CAIRO_XB, t, 62, y + 46, WHITE))
    y += 96 + 70
    b.append(pill("دقة · سرعة · جودة", W / 2, y, 46, BURGUNDY, WHITE))
    # contact band
    band = H - 300
    b.append(f'<rect y="{band}" width="{W}" height="300" fill="{BURGUNDY}"/>')
    b.append(f'<rect y="{band - 14}" width="{W}" height="14" fill="{ORANGE}"/>')
    b.append(centered(CAIRO_B, "ميت غمر · برج دهب · شارع الجيش · ناصية شارع أبوسنة", 34, band + 62, WHITE))
    b.append(centered(CAIRO_B, "أعلى التوحيد والنور · الدور الأول", 34, band + 114, "#F5D9DE"))
    phones = "01096534354   ·   01019289733"
    b.append(centered(MONT, phones, 46, band + 205, WHITE, rtl=False, tracking=0.04))
    return svg(W, H, "".join(b))


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    (OUT / "01-intro.svg").write_text(intro())
    print("wrote", OUT)
