"""Series 1: seven creative posts, each with its own layout, one locked identity.

Fixed on every post: palette, Cairo/Montserrat, logo, CTA, both phones, full address,
and an info element (fact, symptoms or test list). The layout changes with the image.

    python3 brand/al-asema-lab/make_series.py && node brand/al-asema-lab/render-posts.mjs
"""
import base64
from pathlib import Path

from build import BLUE, BURGUNDY, CAIRO_B, CAIRO_XB, MONT, ORANGE, RED, WHITE, svg
from make_creative import GRAY, INK, footer, ring, scene, stripes, text_right
from make_social import embed, molecule

ROOT = Path(__file__).parent
IMG = ROOT / "posts" / "img"
OUT = ROOT / "posts"
W, H = 1080, 1350


# ---------------------------------------------------------------- helpers
def photo(name):
    data = base64.b64encode((IMG / name).read_bytes()).decode()
    return f'<image href="data:image/png;base64,{data}" x="0" y="0" width="{W}" height="{H}" preserveAspectRatio="xMidYMid slice"/>'


def centered(face, text, size, cx, baseline, color, rtl=True, tracking=0):
    w = face.width(text, size, rtl=rtl, tracking=tracking)
    return f'<path fill="{color}" d="{face.path(text, size, cx - w / 2, baseline, rtl=rtl, tracking=tracking)}"/>', w


def text_left(face, text, size, x, baseline, color, rtl=True, tracking=0):
    w = face.width(text, size, rtl=rtl, tracking=tracking)
    return f'<path fill="{color}" d="{face.path(text, size, x, baseline, rtl=rtl, tracking=tracking)}"/>', w


def chips(items, anchor, cy, size, latin=False, align="right", fill=WHITE, stroke=BURGUNDY, color=BLUE, gap=10, opacity=1):
    """One row of pill chips. align right: anchor = right edge; center: anchor = centre x."""
    face = MONT if latin else CAIRO_B
    pad, h = size * 0.8, size * 1.75
    ws = [face.width(t, size, rtl=not latin, tracking=0.02 if latin else 0) + 2 * pad for t in items]
    total = sum(ws) + gap * (len(ws) - 1)
    x = anchor if align == "right" else anchor + total / 2
    out = []
    for t, w in zip(items, ws):  # RTL: first item on the right
        out.append(f'<rect x="{x - w:.1f}" y="{cy - h / 2:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{h / 2:.1f}" '
                   f'fill="{fill}" fill-opacity="{opacity}" stroke="{stroke}" stroke-opacity="0.35" stroke-width="2"/>')
        out.append(f'<path fill="{color}" d="{face.path(t, size, x - w + pad, cy + size * 0.36, rtl=not latin, tracking=0.02 if latin else 0)}"/>')
        x -= w + gap
    return "".join(out), total


def pill(text, cx, cy, size, bg, fg, tag=None):
    """Pill with Arabic text (right) and an optional Latin tag (left)."""
    aw = CAIRO_XB.width(text, size, rtl=True)
    tw = MONT.width(tag, size * 0.85, tracking=0.04) + 22 if tag else 0
    pad, h = size * 1.0, size * 1.9
    w = aw + tw + 2 * pad
    x = cx - w / 2
    out = [f'<rect x="{x:.1f}" y="{cy - h / 2:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{h / 2:.1f}" fill="{bg}"/>',
           f'<path fill="{fg}" d="{CAIRO_XB.path(text, size, x + w - pad - aw, cy + size * 0.36, rtl=True)}"/>']
    if tag:
        out.append(f'<path fill="{ORANGE}" d="{MONT.path(tag, size * 0.85, x + pad, cy + size * 0.32, tracking=0.04)}"/>')
    return "".join(out)


def logo_chip(x, y, w):
    """Logo on a white rounded chip, for photo backgrounds."""
    logo, lh = embed("logo-horizontal-color", x + 18, y + 10, w - 36)
    return f'<rect x="{x}" y="{y}" width="{w}" height="{lh + 20:.1f}" rx="22" fill="{WHITE}" fill-opacity="0.95"/>' + logo


def glass(y, h=None, r=30):
    h = h or H - y
    return (f'<rect x="0" y="{y}" width="{W}" height="{h + r}" rx="{r}" fill="{WHITE}" fill-opacity="0.94"/>'
            f'<rect x="0" y="{y}" width="{W}" height="4" fill="{ORANGE}" fill-opacity="0"/>')


def glow(x, y, w, h, op=0.75):
    return (f'<filter id="gl{int(x)}{int(y)}" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="28"/></filter>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="60" fill="{WHITE}" fill-opacity="{op}" filter="url(#gl{int(x)}{int(y)})"/>')


def rows_card(rows, x_right, top, width, label, size=24):
    """Vertical test list: Arabic name right, Latin code left, thin dividers."""
    pad, rh = 22, size * 1.95
    h = pad * 2 + size * 1.5 + rh * len(rows)
    x = x_right - width
    out = [f'<rect x="{x}" y="{top}" width="{width}" height="{h:.1f}" rx="22" fill="{WHITE}" fill-opacity="0.95" '
           f'stroke="{BURGUNDY}" stroke-opacity="0.15" stroke-width="2"/>',
           f'<rect x="{x_right - 8}" y="{top}" width="8" height="{h:.1f}" rx="4" fill="{ORANGE}"/>']
    xr = x_right - 8 - pad
    p, lw = text_right(CAIRO_XB, label, size, xr, top + pad + size * 0.95, BURGUNDY)
    out.append(p)
    y = top + pad + size * 1.5
    for ar, en in rows:
        out.append(f'<line x1="{x + pad}" y1="{y:.1f}" x2="{xr}" y2="{y:.1f}" stroke="{INK}" stroke-opacity="0.08" stroke-width="2"/>')
        b = y + rh * 0.66
        out.append(f'<circle cx="{xr - 6}" cy="{b - size * 0.33:.1f}" r="5" fill="{RED}"/>')
        p, _ = text_right(CAIRO_B, ar, size, xr - 20, b, INK)
        out.append(p)
        p, _ = text_left(MONT, en, size * 0.78, x + pad, b - 1, BLUE, rtl=False, tracking=0.04)
        out.append(p)
        y += rh
    return "".join(out), h


# ---------------------------------------------------------------- 1. joints: hinge
def joints():
    b = [f'<rect width="{W}" height="{H}" fill="{WHITE}"/>', scene(IMG / "joints-hinge.png", W, 0, 1.0, fade=0)]
    p, _ = text_right(CAIRO_XB, "مفاصلك بتزيّق؟", 112, W - 50, 150, RED)
    b.append(p)
    p, _ = text_right(CAIRO_XB, "قبل ما تزيتها.. اعرف السبب", 44, W - 50, 210, BLUE)
    b.append(p)
    logo, _ = embed("logo-horizontal-color", 130, 255, 280)
    b.append(logo)
    card, _ = rows_card([("سرعة الترسيب", "ESR"), ("معامل الالتهاب", "CRP"), ("عامل الروماتويد", "RF"),
                         ("الحمى الروماتيزمية", "ASO"), ("الكالسيوم", "Ca"), ("فيتامين د", "Vit D")],
                        W - 34, 812, 380, "باقة العظام والمفاصل", size=23)
    b.append(card)
    b.append(glass(1175))
    b.append(footer("احجز باقة العظام والمفاصل", W, 1236))
    b.append(stripes(W, H))
    return svg(W, H, "".join(b))


# ---------------------------------------------------------------- 2. thyroid: thermostat (photo)
def thyroid():
    b = [photo("thyroid-dial.png")]
    logo, lh = embed("logo-horizontal-color", (W - 270) / 2, 26, 270)
    b.append(logo)
    p, _ = centered(CAIRO_XB, "حرارتك مش مظبوطة؟", 92, W / 2, 238, RED)
    b.append(p)
    p, _ = centered(CAIRO_B, "تعبان على طول؟ وزنك بيزيد أو بيقل من غير سبب؟", 34, W / 2, 298, INK)
    b.append(p)
    b.append(pill("يمكن الغدة الدرقية", W / 2, 370, 32, BLUE, WHITE, tag="TSH"))
    b.append(glass(1140))
    p, _ = centered(CAIRO_B, "الغدة الدرقية بتظبط حرق جسمك: طاقتك ووزنك وإحساسك بالحر والبرد.", 26, W / 2, 1192, BURGUNDY)
    b.append(p)
    b.append(footer("احجز تحليل الغدة", W, 1252))
    b.append(stripes(W, H))
    return svg(W, H, "".join(b))


# ---------------------------------------------------------------- 3. CBC: city in a drop
def cbc():
    b = [f'<rect width="{W}" height="{H}" fill="{WHITE}"/>', ring(1150, 640, 190, 34), molecule(90, 520, 0.7, hi=True),
         molecule(1000, 1020, 0.5)]
    b.append(scene(IMG / "cbc-city.png", W, 10, 0.93, fade=60))
    logo, _ = embed("logo-horizontal-color", 36, 34, 230)
    b.append(logo)
    p, _ = text_right(CAIRO_XB, "جواك جيش كامل..", 84, W - 50, 150, RED)
    b.append(p)
    p, _ = text_right(CAIRO_XB, "شغال عشانك ٢٤ ساعة. اطمن عليه", 42, W - 50, 212, BLUE)
    b.append(p)
    # floating card over the bottom of the drop
    cy = 1100
    b.append(f'<filter id="sh" x="-10%" y="-40%" width="120%" height="180%"><feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#9B1D32" flood-opacity="0.18"/></filter>')
    b.append(f'<rect x="90" y="{cy - 70}" width="{W - 180}" height="150" rx="28" fill="{WHITE}" filter="url(#sh)"/>')
    p, _ = centered(CAIRO_XB, "صورة الدم الكاملة بتكشف", 30, W / 2 + 40, cy - 22, BURGUNDY)
    b.append(p)
    p, _ = text_left(MONT, "CBC", 28, W / 2 - 230, cy - 22, ORANGE, rtl=False, tracking=0.06)
    b.append(p)
    c, _ = chips(["الأنيميا", "الالتهابات", "مشاكل الصفايح", "المناعة"], W / 2, cy + 36, 26, align="center", color=RED)
    b.append(c)
    b.append(footer("احجز صورة الدم", W, 1240))
    b.append(stripes(W, H))
    return svg(W, H, "".join(b))


# ---------------------------------------------------------------- 4. vitamin D: sun in a capsule (photo)
def vitd():
    b = [photo("vitd-window.png")]
    b.append(glow(330, 150, 720, 330, 0.8))
    b.append(logo_chip(30, 30, 300))
    p, _ = text_right(CAIRO_XB, "عايش في بلد الشمس..", 76, W - 60, 270, BLUE)
    b.append(p)
    p, _ = text_right(CAIRO_XB, "وعندك نقص فيتامين د؟", 84, W - 60, 370, RED)
    b.append(p)
    c, _ = chips(["تعب مستمر", "وجع عضم وعضلات", "ضعف عام"], W - 60, 450, 27, opacity=0.92, color=BURGUNDY)
    b.append(c)
    b.append(glass(1150))
    p, _ = centered(CAIRO_B, "نقص فيتامين د منتشر في مصر رغم إن الشمس طول السنة.. اكشف واطمن.", 26, W / 2, 1200, BURGUNDY)
    b.append(p)
    b.append(footer("احجز تحليل فيتامين د", W, 1258))
    b.append(stripes(W, H))
    return svg(W, H, "".join(b))


# ---------------------------------------------------------------- 5. kidney beans pun
def beans():
    b = [f'<rect width="{W}" height="{H}" fill="{WHITE}"/>', scene(IMG / "kidney-beans.png", W, 0, 1.0, fade=0)]
    logo, _ = embed("logo-horizontal-color", (W - 240) / 2, 18, 240)
    b.append(logo)
    a = "مش فاصوليا.."
    c2 = "دي كليتك!"
    sz = 88
    wa = CAIRO_XB.width(a, sz, rtl=True)
    wc = CAIRO_XB.width(c2, sz, rtl=True)
    gap = 26
    x0 = (W - (wa + gap + wc)) / 2
    b.append(f'<path fill="{RED}" d="{CAIRO_XB.path(a, sz, x0 + wc + gap, 200, rtl=True)}"/>')
    b.append(f'<path fill="{BLUE}" d="{CAIRO_XB.path(c2, sz, x0, 200, rtl=True)}"/>')
    p, _ = centered(CAIRO_B, "الكلى بتشتغل في صمت، وممكن تتعب من غير أعراض في الأول", 30, W / 2, 262, INK)
    b.append(p)
    b.append(glass(1150))
    c, _ = chips(["Creatinine", "Urea", "Uric Acid", "eGFR", "Na · K", "Urine"], W / 2, 1196, 21, latin=True, align="center")
    b.append(c)
    b.append(footer("احجز وظائف الكلى", W, 1258))
    b.append(stripes(W, H))
    return svg(W, H, "".join(b))


# ---------------------------------------------------------------- 6. 180 litres: side column with a giant number
def litres():
    b = [f'<rect width="{W}" height="{H}" fill="{WHITE}"/>', molecule(300, 1040, 0.6, hi=True), molecule(120, 160, 0.4),
         ring(-170, 930, 240, 40)]
    b.append(scene(IMG / "kidney-180.png", W, 10, 0.92, fade=60, dx=95))
    logo, _ = embed("logo-horizontal-color", 40, 34, 290)
    b.append(logo)
    xr = 470
    p, _ = text_right(CAIRO_XB, "كليتك بتفلتر حوالي", 40, xr, 270, BLUE)
    b.append(p)
    p, _ = text_right(CAIRO_XB, "١٨٠", 250, xr, 520, RED)
    b.append(p)
    p, _ = text_right(CAIRO_XB, "لتر في اليوم", 62, xr, 610, BLUE)
    b.append(p)
    b.append(f'<rect x="{xr - 150}" y="636" width="150" height="10" rx="5" fill="{ORANGE}"/>')
    y = 700
    for t in ["وبيخرج منهم لتر ونص بس تقريبًا،", "والباقي بيرجع لجسمك نضيف.", "مجهود كبير يستاهل تطمن عليه."]:
        p, _ = text_right(CAIRO_B, t, 27, xr, y, INK)
        b.append(p)
        y += 44
    c, _ = chips(["Creatinine", "Urea", "eGFR"], xr, y + 30, 21, latin=True)
    b.append(c)
    b.append(footer("احجز باقة الكلى", W, 1240))
    b.append(stripes(W, H))
    return svg(W, H, "".join(b))


# ---------------------------------------------------------------- 7. liver battery: a UI moment
def battery():
    b = [photo("liver-battery.png")]
    logo, _ = embed("logo-horizontal-color", W - 50 - 270, 30, 270)
    b.append(logo)
    p, _ = centered(CAIRO_XB, "شحن كبدك كام في المية؟", 82, W / 2, 230, RED)
    b.append(p)
    # battery indicator
    bw, bh, bx, by = 230, 62, W / 2 - 40, 268
    b.append(f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" rx="14" fill="{WHITE}" stroke="{INK}" stroke-width="5"/>')
    b.append(f'<rect x="{bx + bw + 3}" y="{by + 18}" width="12" height="{bh - 36}" rx="4" fill="{INK}"/>')
    b.append(f'<rect x="{bx + 9}" y="{by + 9}" width="{(bw - 18) * 0.15:.1f}" height="{bh - 18}" rx="7" fill="{RED}"/>')
    p, _ = text_left(MONT, "15%", 36, bx + 60, by + bh / 2 + 13, INK, rtl=False)
    b.append(p)
    p, _ = text_right(CAIRO_XB, "قرب يفصل!", 36, bx - 24, by + bh / 2 + 14, BURGUNDY)
    b.append(p)
    b.append(glass(1120))
    p, _ = text_right(CAIRO_XB, "اشحنه بباقة الكبد:", 26, W - 50, 1176, BURGUNDY)
    b.append(p)
    c, _ = chips(["ALT", "AST", "ALP", "GGT", "Bilirubin", "Albumin"], W - 300, 1166, 20, latin=True)
    b.append(c)
    b.append(footer("احجز باقة الكبد", W, 1250))
    b.append(stripes(W, H))
    return svg(W, H, "".join(b))


SERIES = {
    "10-joints-hinge": joints,
    "11-thyroid-dial": thyroid,
    "12-cbc-city": cbc,
    "13-vitd-window": vitd,
    "14-kidney-beans": beans,
    "15-kidney-180": litres,
    "16-liver-battery": battery,
}

if __name__ == "__main__":
    for name, fn in SERIES.items():
        (OUT / f"{name}.svg").write_text(fn())
    print("wrote", len(SERIES), "posts")
