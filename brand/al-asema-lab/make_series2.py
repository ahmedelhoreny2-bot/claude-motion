"""Series 2: art-directed posts built from cut-out subjects (posts/cut/) on identity backgrounds.

System (same on every post):
  - logo on a white tab hanging from the top-right edge
  - category kicker pill, top-left
  - background from the identity: royal blue, deep burgundy or light; molecules, glows, the cover's ring
  - footer: the logo's swoosh (blue band + red stripe) opening onto white, with CTA, phones, address
Each post then gets its own idea built from its image.

    python3 brand/al-asema-lab/make_series2.py && node brand/al-asema-lab/render-posts.mjs
"""
import base64
import io
import math
from pathlib import Path

from PIL import Image

from build import BLUE, BURGUNDY, CAIRO_B, CAIRO_XB, MONT, ORANGE, RED, WHITE, svg
from make_creative import ADDRESS, GRAY, INK, PHONES
from make_social import embed

ROOT = Path(__file__).parent
CUT = ROOT / "posts" / "cut"
OUT = ROOT / "posts"
W, H = 1080, 1350
NAVY_DEEP, BLUE_HI = "#1F236B", "#4650C4"
WINE_DEEP = "#5C0E1D"


# ---------------------------------------------------------------- primitives
def tr(face, text, size, x_right, base, color, rtl=True, track=0, op=1):
    w = face.width(text, size, rtl=rtl, tracking=track)
    return f'<path fill="{color}" fill-opacity="{op}" d="{face.path(text, size, x_right - w, base, rtl=rtl, tracking=track)}"/>', w


def tc(face, text, size, cx, base, color, rtl=True, track=0, op=1):
    w = face.width(text, size, rtl=rtl, tracking=track)
    return f'<path fill="{color}" fill-opacity="{op}" d="{face.path(text, size, cx - w / 2, base, rtl=rtl, tracking=track)}"/>', w


def tl(face, text, size, x, base, color, rtl=True, track=0, op=1):
    w = face.width(text, size, rtl=rtl, tracking=track)
    return f'<path fill="{color}" fill-opacity="{op}" d="{face.path(text, size, x, base, rtl=rtl, tracking=track)}"/>', w


def fit(face, text, size, maxw, rtl=True):
    w = face.width(text, size, rtl=rtl)
    return size if w <= maxw else size * maxw / w


_cuts = {}


def cutout(name, cx, cy, w=None, h=None, shadow=0.3, rot=0, fid=None):
    """Cut-out subject cropped to its bbox, centred at (cx, cy), with a soft drop shadow."""
    if name not in _cuts:
        im = Image.open(CUT / f"{name}.png").convert("RGBA")
        im = im.crop(im.getbbox())
        buf = io.BytesIO()
        im.save(buf, "PNG")
        _cuts[name] = (base64.b64encode(buf.getvalue()).decode(), im.width, im.height)
    data, iw, ih = _cuts[name]
    if w is None:
        w = h * iw / ih
    h = w * ih / iw
    fid = fid or f"sh-{name}"
    flt = (f'<filter id="{fid}" x="-20%" y="-20%" width="140%" height="150%">'
           f'<feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#000" flood-opacity="{shadow}"/></filter>')
    t = f' transform="rotate({rot} {cx} {cy})"' if rot else ""
    return (flt + f'<image href="data:image/png;base64,{data}" x="{cx - w / 2:.1f}" y="{cy - h / 2:.1f}" '
            f'width="{w:.1f}" height="{h:.1f}" filter="url(#{fid})"{t}/>'), (cx - w / 2, cy - h / 2, w, h, iw, ih)


def to_canvas(box, x, y):
    """Map a point in the cropped cut-out's pixels to canvas coordinates."""
    bx, by, w, h, iw, ih = box
    return bx + x * w / iw, by + y * h / ih


def molecules(color, op, seed=0):
    spots = [(120, 420, 1.0), (980, 520, 0.8), (90, 980, 0.7), (1000, 1020, 0.9), (560, 140, 0.5), (300, 760, 0.45), (820, 860, 0.5)]
    out = []
    for i, (x, y, s) in enumerate(spots):
        if (i + seed) % 3 == 2:
            continue
        nodes = [(0, 0, 22), (-80, -50, 16), (75, -55, 15), (8, 85, 18)]
        g = [f'<g transform="translate({x},{y}) scale({s})" fill="{color}" fill-opacity="{op}" stroke="{color}" stroke-opacity="{op}">']
        for a, b in [(0, 1), (0, 2), (0, 3)]:
            g.append(f'<line x1="{nodes[a][0]}" y1="{nodes[a][1]}" x2="{nodes[b][0]}" y2="{nodes[b][1]}" stroke-width="9" stroke-linecap="round"/>')
        g += [f'<circle cx="{nx}" cy="{ny}" r="{r}" stroke="none"/>' for nx, ny, r in nodes]
        g.append("</g>")
        out.append("".join(g))
    return "".join(out)


def radial(id_, color, op=0.6):
    return (f'<radialGradient id="{id_}"><stop offset="0" stop-color="{color}" stop-opacity="{op}"/>'
            f'<stop offset="1" stop-color="{color}" stop-opacity="0"/></radialGradient>')


def glow(cx, cy, r, color, op=0.6, id_=None):
    id_ = id_ or f"g{int(cx)}{int(cy)}"
    return f'<defs>{radial(id_, color, op)}</defs><circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#{id_})"/>'


def background(theme):
    if theme == "blue":
        g = (f'<defs><linearGradient id="bg" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stop-color="{BLUE_HI}"/>'
             f'<stop offset="0.55" stop-color="{BLUE}"/><stop offset="1" stop-color="{NAVY_DEEP}"/></linearGradient></defs>')
        return g + f'<rect width="{W}" height="{H}" fill="url(#bg)"/>' + molecules(WHITE, 0.07)
    if theme == "wine":
        g = (f'<defs><linearGradient id="bg" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="#B3263F"/>'
             f'<stop offset="0.5" stop-color="{BURGUNDY}"/><stop offset="1" stop-color="{WINE_DEEP}"/></linearGradient></defs>')
        return g + f'<rect width="{W}" height="{H}" fill="url(#bg)"/>' + molecules(WHITE, 0.07, seed=1)
    g = (f'<defs><linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#FFFFFF"/>'
         f'<stop offset="1" stop-color="{theme}"/></linearGradient></defs>')
    return g + f'<rect width="{W}" height="{H}" fill="url(#bg)"/>' + molecules("#C9C9D6", 0.45, seed=2)


def ring(cx, cy, r, sw, outer=BURGUNDY, inner=ORANGE, op=1):
    return (f'<g opacity="{op}"><circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{outer}" stroke-width="{sw}"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r - sw * 0.85:.1f}" fill="none" stroke="{inner}" stroke-width="{sw * 0.55:.1f}"/></g>')


def logo_tab(shadow=0.18):
    x0, x1, h, r = 712, 1040, 126, 26
    path = f"M{x0},0 L{x1},0 L{x1},{h - r} Q{x1},{h} {x1 - r},{h} L{x0 + r},{h} Q{x0},{h} {x0},{h - r} Z"
    logo, lh = embed("logo-horizontal-color", x0 + 24, (h - 98) / 2 + 2, x1 - x0 - 48)
    return (f'<filter id="tabsh" x="-10%" y="-20%" width="120%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="12" '
            f'flood-color="#000" flood-opacity="{shadow}"/></filter><path d="{path}" fill="{WHITE}" filter="url(#tabsh)"/>' + logo)


def kicker(text, light_bg=False):
    size = 30
    w = CAIRO_XB.width(text, size, rtl=True) + 56
    x, y, h = 40, 34, 58
    fg = "#1A1A1A"
    return (f'<rect x="{x}" y="{y}" width="{w:.1f}" height="{h}" rx="{h / 2}" fill="{ORANGE}"/>'
            f'<path fill="{fg}" d="{CAIRO_XB.path(text, size, x + 28, y + h / 2 + size * 0.36, rtl=True)}"/>')


def footer(cta):
    """The logo's swoosh opening onto a white strip with CTA, phones and address."""
    blue = "M0,1176 C330,1112 720,1108 1080,1138 L1080,1156 C720,1134 330,1150 0,1206 Z"
    red = "M0,1214 C330,1160 720,1148 1080,1170 L1080,1180 C720,1162 330,1176 0,1228 Z"
    white = "M0,1236 C330,1186 720,1172 1080,1190 L1080,1350 L0,1350 Z"
    out = [f'<path d="{blue}" fill="{BLUE}"/>', f'<path d="{red}" fill="{RED}"/>', f'<path d="{white}" fill="{WHITE}"/>']
    y = 1262
    csz, psz = 30, 31
    cw = CAIRO_XB.width(cta, csz, rtl=True)
    pw = MONT.width(PHONES, psz, tracking=0.03)
    gap, padx, ph = 30, 30, 58
    x0 = (W - (cw + 2 * padx + gap + pw)) / 2
    px = x0 + pw + gap
    out.append(f'<rect x="{px:.1f}" y="{y - ph / 2:.1f}" width="{cw + 2 * padx:.1f}" height="{ph}" rx="{ph / 2}" fill="{BURGUNDY}"/>')
    out.append(f'<path fill="{WHITE}" d="{CAIRO_XB.path(cta, csz, px + padx, y + csz * 0.36, rtl=True)}"/>')
    out.append(f'<path fill="{BLUE}" d="{MONT.path(PHONES, psz, x0, y + psz * 0.36, tracking=0.03)}"/>')
    asz = 23
    aw = CAIRO_B.width(ADDRESS, asz, rtl=True)
    ay = y + 58
    ax = (W - aw) / 2 - 12
    pinx = ax + aw + 20
    out.append(f'<path fill="{RED}" d="M{pinx:.1f},{ay + 3} c-7,-9 -11,-14 -11,-19 a11,11 0 1 1 22,0 c0,5 -4,10 -11,19 Z"/>'
               f'<circle cx="{pinx:.1f}" cy="{ay - 16}" r="4" fill="{WHITE}"/>')
    out.append(f'<path fill="{GRAY}" d="{CAIRO_B.path(ADDRESS, asz, ax, ay, rtl=True)}"/>')
    return "".join(out)


def chips(items, cx, cy, size, latin=True, fill=WHITE, fop=0.14, stroke=WHITE, sop=0.35, color=WHITE, gap=10, x_right=None):
    face = MONT if latin else CAIRO_B
    pad, h = size * 0.85, size * 1.8
    ws = [face.width(t, size, rtl=not latin, tracking=0.03 if latin else 0) + 2 * pad for t in items]
    total = sum(ws) + gap * (len(ws) - 1)
    x = x_right if x_right is not None else cx + total / 2
    out = []
    for t, w in zip(items, ws):
        out.append(f'<rect x="{x - w:.1f}" y="{cy - h / 2:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{h / 2:.1f}" fill="{fill}" '
                   f'fill-opacity="{fop}" stroke="{stroke}" stroke-opacity="{sop}" stroke-width="2"/>')
        out.append(f'<path fill="{color}" d="{face.path(t, size, x - w + pad, cy + size * 0.36, rtl=not latin, tracking=0.03 if latin else 0)}"/>')
        x -= w + gap
    return "".join(out), total


def callout(px, py, lx, ly, title, desc, color, anchor="right", w=270):
    """Label card whose right edge is at lx (anchor right) or left edge at lx; dotted leader to (px, py)."""
    tsz, dsz, h = 26, 21, 86
    x = lx - w if anchor == "right" else lx
    ex = x if px < x else (x + w if px > x + w else px)
    ey = ly + h / 2 if (px < x or px > x + w) else (ly if py < ly else ly + h)
    fid = f"cs{int(lx)}{int(ly)}"
    out = [f'<line x1="{px:.1f}" y1="{py:.1f}" x2="{ex:.1f}" y2="{ey:.1f}" stroke="{color}" stroke-width="4" stroke-dasharray="1 9" stroke-linecap="round"/>',
           f'<circle cx="{px:.1f}" cy="{py:.1f}" r="12" fill="{WHITE}" stroke="{color}" stroke-width="6"/>',
           f'<filter id="{fid}" x="-10%" y="-30%" width="120%" height="170%"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#5C0E1D" flood-opacity="0.18"/></filter>',
           f'<rect x="{x}" y="{ly}" width="{w}" height="{h}" rx="18" fill="{WHITE}" filter="url(#{fid})"/>',
           f'<rect x="{x + w - 7}" y="{ly + 14}" width="7" height="{h - 28}" rx="3.5" fill="{color}"/>']
    p, _ = tr(CAIRO_XB, title, tsz, x + w - 22, ly + 36, color)
    out.append(p)
    p, _ = tr(CAIRO_B, desc, dsz, x + w - 22, ly + 70, INK)
    out.append(p)
    return "".join(out)


# ---------------------------------------------------------------- posts
def liver_battery():
    b = [background("blue"), glow(540, 718, 520, ORANGE, 0.35), glow(540, 718, 300, RED, 0.35)]
    cx, cy, r = 540, 718, 300
    b.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{BURGUNDY}" stroke-width="40"/>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="{r + 40}" fill="none" stroke="{WHITE}" stroke-opacity="0.12" stroke-width="2"/>')
    # 15% charge arc on the ring
    a0, a1 = -90, -90 + 0.15 * 360
    p0 = (cx + r * math.cos(math.radians(a0)), cy + r * math.sin(math.radians(a0)))
    p1 = (cx + r * math.cos(math.radians(a1)), cy + r * math.sin(math.radians(a1)))
    b.append(f'<path d="M{p0[0]:.1f},{p0[1]:.1f} A{r},{r} 0 0 1 {p1[0]:.1f},{p1[1]:.1f}" fill="none" stroke="{ORANGE}" stroke-width="40" stroke-linecap="round"/>')
    for i in range(1, 20):  # tick marks
        a = math.radians(-90 + i * 18)
        b.append(f'<line x1="{cx + (r - 34) * math.cos(a):.1f}" y1="{cy + (r - 34) * math.sin(a):.1f}" x2="{cx + (r - 46) * math.cos(a):.1f}" '
                 f'y2="{cy + (r - 46) * math.sin(a):.1f}" stroke="{WHITE}" stroke-opacity="0.35" stroke-width="3"/>')
    img, _ = cutout("liver-battery", cx, cy + 10, w=610, shadow=0.45)
    b.append(img)
    # 15% badge at the end of the arc
    bx, by = p1[0] + 70, p1[1] - 40
    b.append(f'<circle cx="{bx}" cy="{by}" r="62" fill="{ORANGE}"/>')
    p, _ = tc(MONT, "15%", 38, bx, by + 14, "#1A1A1A", rtl=False)
    b.append(p)
    b += [logo_tab(), kicker("باقة الكبد")]
    p, _ = tr(CAIRO_XB, "شحن كبدك", 100, W - 50, 240, WHITE)
    b.append(p)
    p, _ = tr(CAIRO_XB, "كام في المية؟", 100, W - 50, 345, ORANGE)
    b.append(p)
    p, _ = tc(CAIRO_XB, "قرب يفصل!", 30, bx, by + 106, WHITE)
    b.append(p)
    c, _ = chips(["ALT", "AST", "ALP", "GGT", "Bilirubin", "Albumin"], W / 2, 1075, 21)
    b.append(c)
    b.append(footer("احجز باقة الكبد"))
    return svg(W, H, "".join(b))


def kidney_180():
    b = [background("#E6ECF8"), glow(560, 760, 460, "#9FB3EA", 0.45)]
    # the number, huge, behind the subject
    p, nw = tc(CAIRO_XB, "١٨٠", 600, 540, 1000, BLUE, op=0.09)
    b.append(p)
    b.append(ring(540, 1340, 330, 40, op=0.9))
    img, box = cutout("kidney-180", 560, 760, h=840, shadow=0.18)
    b.append(img)
    b += [logo_tab(), kicker("باقة الكلى")]
    p, _ = tr(CAIRO_XB, "كليتك بتفلتر حوالي", 48, W - 50, 200, BLUE)
    b.append(p)
    p, _ = tr(CAIRO_XB, "١٨٠ لتر في اليوم", 92, W - 50, 300, RED)
    b.append(p)
    # fact, left column
    y = 560
    b.append(f'<rect x="56" y="{y - 46}" width="8" height="150" rx="4" fill="{ORANGE}"/>')
    for t, sz, col in [("وبيخرج منهم", 26, INK), ("لتر ونص بس", 40, BURGUNDY), ("والباقي بيرجع", 26, INK), ("لجسمك نضيف", 26, INK)]:
        p, _ = tl(CAIRO_XB if sz == 40 else CAIRO_B, t, sz, 82, y, col)
        b.append(p)
        y += 44 if sz != 40 else 50
    # tests, right column (vertical chips)
    for i, t in enumerate(["Creatinine", "Urea", "Uric Acid", "eGFR"]):
        c, _ = chips([t], 0, 560 + i * 62, 21, fill=WHITE, fop=0.9, stroke=BLUE, sop=0.3, color=BLUE, x_right=W - 50)
        b.append(c)
    b.append(footer("احجز باقة الكلى"))
    return svg(W, H, "".join(b))


def cbc_city():
    b = [background("#F6EEF1"), glow(540, 720, 520, "#F4B9C2", 0.55)]
    b.append(ring(540, 770, 395, 46))
    img, box = cutout("cbc-city", 540, 790, w=650, shadow=0.22)
    b.append(img)
    b += [logo_tab(), kicker("صورة الدم الكاملة")]
    p, w1 = tr(CAIRO_XB, "جواك", 104, W - 50, 236, INK)
    b.append(p)
    p, _ = tr(CAIRO_XB, "جيش كامل", 104, W - 50 - w1 - 26, 236, RED)
    b.append(p)
    p, wsub = tr(CAIRO_B, "صورة الدم الكاملة بتطمنك إنه شغال صح", 34, W - 50, 298, BLUE)
    b.append(p)
    p, _ = tr(MONT, "CBC", 30, W - 50 - wsub - 18, 298, ORANGE, rtl=False, track=0.06)
    b.append(p)
    # callouts mapped onto the characters (crop coords of the cut-out)
    rc = to_canvas(box, 230, 680)   # big red cell
    wc = to_canvas(box, 790, 610)   # white cell knight, right
    pl = to_canvas(box, 860, 810)   # platelet workers
    b.append(callout(rc[0], rc[1], 300, 980, "كرات الدم الحمرا", "بتوصّل الأكسجين", RED, w=262))
    b.append(callout(wc[0], wc[1], 1050, 470, "كرات الدم البيضا", "بتحميك من العدوى", BLUE, w=270))
    b.append(callout(pl[0], pl[1], 1050, 980, "الصفايح الدموية", "بتوقف النزيف", ORANGE, w=262))
    b.append(footer("احجز صورة الدم"))
    return svg(W, H, "".join(b))


def joints():
    b = [background("#F1EEF0"), ring(470, 720, 360, 44, op=0.95), glow(470, 720, 380, "#FFFFFF", 0.9)]
    img, box = cutout("joints-hinge", 600, 790, w=860, shadow=0.2)
    b.append(img)
    # onomatopoeia near the joint
    jx, jy = to_canvas(box, 330, 640)
    b.append(f'<g transform="rotate(-12 {jx - 210} {jy - 180})">')
    p, _ = tc(CAIRO_XB, "زيييق!", 76, jx - 210, jy - 160, ORANGE)
    b.append(p.replace("<path", f'<path stroke="{WHITE}" stroke-width="10" paint-order="stroke" stroke-linejoin="round"'))
    b.append("</g>")
    b += [logo_tab(), kicker("باقة العظام والمفاصل")]
    p, w1 = tr(CAIRO_XB, "مفاصلك", 104, W - 50, 260, INK)
    b.append(p)
    p, _ = tr(CAIRO_XB, "بتزيّق؟", 104, W - 50 - w1 - 24, 260, RED)
    b.append(p)
    p, _ = tr(CAIRO_B, "قبل ما تزيتها.. اعرف السبب", 40, W - 50, 322, BLUE)
    b.append(p)
    # tests card, bottom-right
    rows = [("سرعة الترسيب", "ESR"), ("معامل الالتهاب", "CRP"), ("عامل الروماتويد", "RF"),
            ("الحمى الروماتيزمية", "ASO"), ("الكالسيوم", "Ca"), ("فيتامين د", "Vit D")]
    x1, top, cw, rh = W - 40, 768, 360, 44
    ch = 66 + rh * len(rows)
    b.append(f'<filter id="tsh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#5C0E1D" flood-opacity="0.2"/></filter>')
    b.append(f'<rect x="{x1 - cw}" y="{top}" width="{cw}" height="{ch}" rx="24" fill="{WHITE}" filter="url(#tsh)"/>')
    b.append(f'<rect x="{x1 - cw}" y="{top}" width="{cw}" height="56" rx="24" fill="{BURGUNDY}"/><rect x="{x1 - cw}" y="{top + 30}" width="{cw}" height="26" fill="{BURGUNDY}"/>')
    p, _ = tc(CAIRO_XB, "٦ تحاليل في باقة واحدة", 25, x1 - cw / 2, top + 38, WHITE)
    b.append(p)
    y = top + 56
    for ar, en in rows:
        base = y + rh * 0.68
        b.append(f'<circle cx="{x1 - 26}" cy="{base - 8}" r="5" fill="{RED}"/>')
        p, _ = tr(CAIRO_B, ar, 23, x1 - 40, base, INK)
        b.append(p)
        p, _ = tl(MONT, en, 18, x1 - cw + 22, base - 1, BLUE, rtl=False, track=0.04)
        b.append(p)
        y += rh
        if y < top + ch - 20:
            b.append(f'<line x1="{x1 - cw + 20}" y1="{y}" x2="{x1 - 20}" y2="{y}" stroke="#000" stroke-opacity="0.06" stroke-width="2"/>')
    b.append(footer("احجز باقة العظام والمفاصل"))
    return svg(W, H, "".join(b))


def beans():
    b = [background("#EFEAF7"), glow(640, 720, 460, "#C9BFEA", 0.5), ring(1130, 640, 300, 44)]
    img, box = cutout("kidney-beans", 0, 0, w=840, shadow=0.2)
    bx, by, w, h, iw, ih = box
    img, box = cutout("kidney-beans", W - w / 2 + 10, 770, w=840, shadow=0.2)
    b.append(img)
    b += [logo_tab(), kicker("وظائف الكلى")]
    p, _ = tr(CAIRO_XB, "مش فاصوليا..", 92, W - 50, 250, RED)
    b.append(p)
    p, _ = tr(CAIRO_XB, "دي كليتك!", 122, W - 50, 372, BLUE)
    b.append(p)
    # sticker badge, left
    sx, sy = 150, 560
    b.append(f'<g transform="rotate(-10 {sx} {sy})"><circle cx="{sx}" cy="{sy}" r="112" fill="{ORANGE}"/>'
             f'<circle cx="{sx}" cy="{sy}" r="100" fill="none" stroke="#1A1A1A" stroke-opacity="0.25" stroke-width="2" stroke-dasharray="4 6"/>')
    for t, dy, sz in [("الكلى", -38, 30), ("بتشتغل", 4, 30), ("في صمت", 46, 30)]:
        p, _ = tc(CAIRO_XB, t, sz, sx, sy + dy + 10, "#1A1A1A")
        b.append(p)
    b.append("</g>")
    for i, t in enumerate(["Creatinine", "Urea", "Uric Acid", "eGFR", "Na · K"]):
        c, _ = chips([t], 0, 760 + i * 60, 20, fill=WHITE, fop=0.95, stroke=BURGUNDY, sop=0.3, color=BLUE, x_right=262)
        b.append(c)
    b.append(footer("احجز وظائف الكلى"))
    return svg(W, H, "".join(b))


def thyroid():
    b = [background("wine"), glow(330, 715, 420, "#3E7BFF", 0.45, "gb"), glow(760, 715, 420, "#FF7A1F", 0.5, "go")]
    for r, op in [(380, 0.18), (440, 0.11), (500, 0.06)]:
        b.append(f'<circle cx="540" cy="715" r="{r}" fill="none" stroke="{WHITE}" stroke-opacity="{op}" stroke-width="3"/>')
    img, _ = cutout("thyroid-dial", 540, 715, w=570, shadow=0.45)
    b.append(img)
    b += [logo_tab(), kicker("تحليل الغدة الدرقية")]
    p, _ = tr(CAIRO_XB, "حرارتك مش مظبوطة؟", 84, W - 50, 248, WHITE)
    b.append(p)
    p, wsub = tr(CAIRO_XB, "يمكن الغدة الدرقية هي السبب", 44, W - 50, 318, ORANGE)
    b.append(p)
    p, _ = tr(MONT, "TSH", 40, W - 50 - wsub - 22, 318, WHITE, rtl=False, track=0.06)
    b.append(p)
    # cold / hot sides
    def side(x_right, title, items, col):
        out = [f'<rect x="{x_right - 470}" y="1004" width="470" height="92" rx="22" fill="{WHITE}" fill-opacity="0.1" stroke="{col}" stroke-opacity="0.8" stroke-width="2"/>']
        p, _ = tr(CAIRO_XB, title, 26, x_right - 22, 1040, col)
        out.append(p)
        p, _ = tr(CAIRO_B, items, 23, x_right - 22, 1078, WHITE)
        out.append(p)
        return "".join(out)
    b.append(side(W - 50, "غدة كسلانة", "برد · تعب · زيادة في الوزن", "#7FB0FF"))
    b.append(side(520, "غدة نشيطة زيادة", "حر · عصبية · نقص في الوزن", "#FFB25A"))
    b.append(footer("احجز تحليل الغدة"))
    return svg(W, H, "".join(b))


def vitd():
    b = [background("blue"), glow(540, 700, 560, ORANGE, 0.45, "sun1"), glow(540, 700, 260, "#FFE29A", 0.6, "sun2")]
    # sun rays
    for i in range(24):
        a = math.radians(i * 15)
        b.append(f'<line x1="{540 + 230 * math.cos(a):.1f}" y1="{720 + 230 * math.sin(a):.1f}" x2="{540 + 520 * math.cos(a):.1f}" '
                 f'y2="{720 + 520 * math.sin(a):.1f}" stroke="#FFD27A" stroke-opacity="0.16" stroke-width="{14 if i % 2 else 6}" stroke-linecap="round"/>')
    # skyline
    sky = []
    x = 0
    for w_, h_ in [(90, 120), (70, 180), (110, 140), (60, 220), (120, 160), (80, 200), (100, 130), (70, 240), (110, 170), (90, 150), (100, 190)]:
        sky.append(f'<rect x="{x}" y="{1175 - h_}" width="{w_ - 6}" height="{h_}" fill="{NAVY_DEEP}" fill-opacity="0.55"/>')
        x += w_
    b.append("".join(sky))
    img, _ = cutout("vitd-window", 540, 760, w=820, shadow=0.4, rot=-8)
    b.append(img)
    b += [logo_tab(), kicker("فيتامين د")]
    p, _ = tr(CAIRO_XB, "عايش في بلد الشمس..", 70, W - 50, 236, WHITE)
    b.append(p)
    p, _ = tr(CAIRO_XB, "وعندك نقص فيتامين د؟", 84, W - 50, 340, ORANGE)
    b.append(p)
    c, _ = chips(["تعب مستمر", "وجع عضم وعضلات", "ضعف عام"], W / 2, 1010, 26, latin=False)
    b.append(c)
    p, _ = tc(CAIRO_B, "نقص فيتامين د منتشر في مصر رغم الشمس طول السنة", 25, W / 2, 1082, WHITE, op=0.85)
    b.append(p)
    b.append(footer("احجز تحليل فيتامين د"))
    return svg(W, H, "".join(b))


SERIES = {
    "20-liver-battery": liver_battery,
    "21-kidney-180": kidney_180,
    "22-cbc-city": cbc_city,
    "23-joints": joints,
    "24-kidney-beans": beans,
    "25-thyroid": thyroid,
    "26-vitamin-d": vitd,
}

if __name__ == "__main__":
    for name, fn in SERIES.items():
        (OUT / f"{name}.svg").write_text(fn())
    print("wrote", len(SERIES))
