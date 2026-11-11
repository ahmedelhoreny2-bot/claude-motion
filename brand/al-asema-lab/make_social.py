"""Facebook page assets: profile picture and cover, built from the locked identity.

    python3 brand/al-asema-lab/make_social.py && node brand/al-asema-lab/render-social.mjs

Cover is 1640x720 (2x of 820x360): desktop shows the middle 1640x624 band,
mobile shows the middle 1280x720 block. Content stays inside the overlap
(1280x624, centred), and away from both bottom corners, where the profile
picture sits (left in English Facebook, right in Arabic).
"""
import re
from pathlib import Path

from build import BLUE, BURGUNDY, CAIRO_B, CAIRO_XB, ORANGE, RED, WHITE, mark, MARK_W, MARK_H, svg

ROOT = Path(__file__).parent
OUT = ROOT / "social"
LOGO = ROOT / "logo" / "svg"
MOL, MOL_HI = "#E6E6EC", "#D9D7F0"


def embed(name, x, y, w):
    s = (LOGO / f"{name}.svg").read_text().strip()
    vw, vh = map(float, re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', s).groups())
    h = w * vh / vw
    s = re.sub(r' width="[\d.]+" height="[\d.]+"', f' x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}"', s, count=1)
    return s.replace(' xmlns="http://www.w3.org/2000/svg"', ""), h


def molecule(cx, cy, s, hi=False):
    """Ball-and-stick cluster like the back of the printed cover."""
    nodes = [(0, 0, 26), (-90, -55, 20), (85, -60, 18), (10, 95, 22), (120, 60, 14)]
    links = [(0, 1), (0, 2), (0, 3), (2, 4)]
    g = [f'<g transform="translate({cx},{cy}) scale({s})">']
    for a, b in links:
        (x1, y1, _), (x2, y2, _) = nodes[a], nodes[b]
        g.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{MOL}" stroke-width="12" stroke-linecap="round"/>')
    for i, (x, y, r) in enumerate(nodes):
        g.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{MOL_HI if hi and i == 0 else MOL}"/>')
    g.append("</g>")
    return "".join(g)


def pill(text, cx, cy, size, bg, fg, face=CAIRO_B, padx=44, h=None):
    w = face.width(text, size, rtl=True)
    h = h or size * 1.7
    x = cx - w / 2
    return (
        f'<rect x="{x - padx:.1f}" y="{cy - h / 2:.1f}" width="{w + 2 * padx:.1f}" height="{h:.1f}" rx="{h / 2:.1f}" fill="{bg}"/>'
        f'<path fill="{fg}" d="{face.path(text, size, x, cy + size * 0.36, rtl=True)}"/>'
    )


def cover():
    W, H = 1640, 720
    body = [f'<rect width="{W}" height="{H}" fill="{WHITE}"/>']
    # molecules in the background, mostly outside the content block
    body += [molecule(150, 150, 1.6, hi=True), molecule(1460, 560, 1.4), molecule(1380, 120, 0.9),
             molecule(330, 600, 0.8)]
    # the cover's double ring, top-left corner (decoration, safe to crop)
    body.append(f'<circle cx="-40" cy="-60" r="250" fill="none" stroke="{BURGUNDY}" stroke-width="44"/>')
    body.append(f'<circle cx="-40" cy="-60" r="214" fill="none" stroke="{ORANGE}" stroke-width="26"/>')
    # and bottom-right
    body.append(f'<circle cx="1700" cy="790" r="230" fill="none" stroke="{BURGUNDY}" stroke-width="40"/>')
    body.append(f'<circle cx="1700" cy="790" r="197" fill="none" stroke="{ORANGE}" stroke-width="24"/>')
    # content block: centred and kept in the top ~62%, so the profile circle
    # (bottom corner, overlapping ~35% of the height on mobile) never covers it
    logo, lh = embed("logo-horizontal-color", (W - 800) / 2, 50, 800)
    body.append(logo)
    cy = 50 + lh + 52
    t = "نظام آلي متكامل"
    tsz, gap = 52, 36
    tw = CAIRO_XB.width(t, tsz, rtl=True)
    pt, psz = "دقة · سرعة · جودة", 36
    pw = CAIRO_B.width(pt, psz, rtl=True) + 88
    x0 = (W - (tw + gap + pw)) / 2  # RTL row: title on the right, pill on the left
    body.append(pill(pt, x0 + pw / 2, cy, psz, BURGUNDY, WHITE))
    body.append(f'<path fill="{BLUE}" d="{CAIRO_XB.path(t, tsz, x0 + pw + gap, cy + tsz * 0.36, rtl=True)}"/>')
    return svg(W, H, "".join(body))


def profile(ring):
    S = 1080
    body = [f'<rect width="{S}" height="{S}" fill="{WHITE}"/>']
    if ring:  # the cover's double ring, kept inside the circle crop
        body.append(f'<circle cx="540" cy="540" r="488" fill="none" stroke="{BURGUNDY}" stroke-width="40"/>')
        body.append(f'<circle cx="540" cy="540" r="456" fill="none" stroke="{ORANGE}" stroke-width="22"/>')
    s = (560 if ring else 640) / MARK_W
    body.append(mark(BLUE, RED, (S - MARK_W * s) / 2 + 8, (S - MARK_H * s) / 2 - 6, s))
    return svg(S, S, "".join(body))


def profile_named(ring):
    """Mark + Arabic name, sized for a circle crop and legible at small sizes."""
    S, c = 1080, 540
    R = 474 if ring else 505  # usable radius inside the ring / circle
    body = [f'<rect width="{S}" height="{S}" fill="{WHITE}"/>']
    if ring:
        body.append(f'<circle cx="540" cy="540" r="510" fill="none" stroke="{BURGUNDY}" stroke-width="26"/>')
        body.append(f'<circle cx="540" cy="540" r="488" fill="none" stroke="{ORANGE}" stroke-width="14"/>')
    name, sub = "معمل العاصمة", "للتحاليل الطبية"
    k = R / 430
    nsz, ssz = 102 * k, 56 * k
    nw = CAIRO_XB.width(name, nsz, rtl=True)
    sw = CAIRO_B.width(sub, ssz, rtl=True)
    ms = 320 * k / MARK_W
    mh = MARK_H * ms
    gap1, gap2 = 22 * k, 6 * k
    name_h, sub_h = nsz * 1.0, ssz * 1.05
    total = mh + gap1 + name_h + gap2 + sub_h
    top = c - total / 2 - 10 * k
    body.append(mark(BLUE, RED, c - MARK_W * ms / 2 + 6 * k, top, ms))
    nb = top + mh + gap1 + nsz * 0.82
    body.append(f'<path fill="{RED}" d="{CAIRO_XB.path(name, nsz, c - nw / 2, nb, rtl=True)}"/>')
    sb = nb + gap2 + ssz * 1.1
    body.append(f'<path fill="{BLUE}" d="{CAIRO_B.path(sub, ssz, c - sw / 2, sb, rtl=True)}"/>')
    # every text corner must sit inside the usable circle
    import math
    for w, y in ((nw, nb - nsz * 0.75), (nw, nb + nsz * 0.25), (sw, sb + ssz * 0.35)):
        d = math.hypot(w / 2, y - c)
        assert d < R, (w, y, d, R)
    return svg(S, S, "".join(body))


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    (OUT / "facebook-cover.svg").write_text(cover())
    (OUT / "facebook-profile.svg").write_text(profile(ring=True))
    (OUT / "facebook-profile-plain.svg").write_text(profile(ring=False))
    (OUT / "facebook-profile-name.svg").write_text(profile_named(ring=True))
    (OUT / "facebook-profile-name-plain.svg").write_text(profile_named(ring=False))
    print("wrote", OUT)
