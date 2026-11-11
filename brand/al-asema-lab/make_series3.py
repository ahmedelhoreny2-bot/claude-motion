"""Series 3: package posts on full-frame generated scenes, dressed with 2D elements in the identity.

Fixed (as series 2): logo tab top-right, category kicker, the swoosh footer with CTA, phones, address.
No prices anywhere: a "سعر خاص" / "خصم خاص" sticker instead.

    python3 brand/al-asema-lab/make_series3.py && node brand/al-asema-lab/render-posts.mjs
"""
import base64
import io
import math
from pathlib import Path

from PIL import Image

from build import BLUE, BURGUNDY, CAIRO_B, CAIRO_XB, MONT, ORANGE, RED, WHITE, svg
from make_creative import INK
from make_series2 import H, NAVY_DEEP, W, chips, footer, kicker, logo_tab, tc, tl, tr

ROOT = Path(__file__).parent
IMG = ROOT / "posts" / "img"
OUT = ROOT / "posts"


# ---------------------------------------------------------------- 2D kit
def photo(name):
    im = Image.open(IMG / name).convert("RGB").resize((W, H), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=92)
    data = base64.b64encode(buf.getvalue()).decode()
    return f'<image href="data:image/jpeg;base64,{data}" x="0" y="0" width="{W}" height="{H}"/>'


def scrim(y0, y1, color, op, up=False):
    gid = f"scr{y0}{y1}"
    a, b = (op, 0) if not up else (0, op)
    return (f'<defs><linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{color}" stop-opacity="{a}"/>'
            f'<stop offset="1" stop-color="{color}" stop-opacity="{b}"/></linearGradient></defs>'
            f'<rect x="0" y="{y0}" width="{W}" height="{y1 - y0}" fill="url(#{gid})"/>')


def starburst(cx, cy, r, line1, line2=None, rot=-12, bg=ORANGE, fg=INK, points=24):
    pts = []
    for i in range(points * 2):
        a = math.pi * i / points
        rr = r if i % 2 == 0 else r * 0.84
        pts.append(f"{cx + rr * math.cos(a):.1f},{cy + rr * math.sin(a):.1f}")
    out = [f'<g transform="rotate({rot} {cx} {cy})">',
           f'<filter id="sb{int(cx)}" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-opacity="0.25"/></filter>',
           f'<polygon points="{" ".join(pts)}" fill="{bg}" filter="url(#sb{int(cx)})"/>',
           f'<circle cx="{cx}" cy="{cy}" r="{r * 0.72:.1f}" fill="none" stroke="{fg}" stroke-opacity="0.25" stroke-width="2" stroke-dasharray="4 6"/>']
    s1 = r * 0.42
    if line2:
        p, _ = tc(CAIRO_XB, line1, s1, cx, cy - r * 0.02, fg)
        out.append(p)
        p, _ = tc(CAIRO_B, line2, r * 0.22, cx, cy + r * 0.34, fg)
        out.append(p)
    else:
        p, _ = tc(CAIRO_XB, line1, s1, cx, cy + s1 * 0.36, fg)
        out.append(p)
    out.append("</g>")
    return "".join(out)


def sparkle(x, y, r, color=ORANGE):
    return (f'<path d="M{x},{y - r} Q{x},{y} {x + r},{y} Q{x},{y} {x},{y + r} Q{x},{y} {x - r},{y} Q{x},{y} {x},{y - r} Z" '
            f'fill="{color}"/>')


def doodle_arrow(d, head, color=BLUE, w=6):
    """Hand-drawn style arrow: a path d and an arrowhead at head=(x, y, angle_deg)."""
    hx, hy, ang = head
    a = math.radians(ang)
    l = 26
    p1 = (hx - l * math.cos(a - 0.5), hy - l * math.sin(a - 0.5))
    p2 = (hx - l * math.cos(a + 0.5), hy - l * math.sin(a + 0.5))
    return (f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round" stroke-dasharray="2 12"/>'
            f'<path d="M{p1[0]:.1f},{p1[1]:.1f} L{hx},{hy} L{p2[0]:.1f},{p2[1]:.1f}" fill="none" stroke="{color}" stroke-width="{w}" '
            'stroke-linecap="round" stroke-linejoin="round"/>')


def battery(x, y, w, h, level, color=RED, frame=INK):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h * 0.25:.1f}" fill="{WHITE}" stroke="{frame}" stroke-width="{h * 0.12:.1f}"/>'
            f'<rect x="{x + w}" y="{y + h * 0.3:.1f}" width="{h * 0.16:.1f}" height="{h * 0.4:.1f}" rx="3" fill="{frame}"/>'
            f'<rect x="{x + h * 0.16:.1f}" y="{y + h * 0.16:.1f}" width="{(w - h * 0.32) * level:.1f}" height="{h * 0.68:.1f}" rx="{h * 0.12:.1f}" fill="{color}"/>')


def card(x, y, w, h, fill=WHITE, op=0.94, r=26, stroke=None):
    s = f' stroke="{stroke}" stroke-opacity="0.25" stroke-width="2"' if stroke else ""
    return (f'<filter id="cd{int(x)}{int(y)}" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="10" stdDeviation="14" '
            f'flood-color="#000" flood-opacity="0.18"/></filter>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" fill-opacity="{op}"{s} filter="url(#cd{int(x)}{int(y)})"/>')


def check(cx, cy, r, color):
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{color}"/>'
            f'<path d="M{cx - r * .45},{cy + r * .02} L{cx - r * .1},{cy + r * .38} L{cx + r * .48},{cy - r * .36}" fill="none" '
            f'stroke="{WHITE}" stroke-width="{r * .3:.1f}" stroke-linecap="round" stroke-linejoin="round"/>')


def checklist(items, x_right, top, col_w, cols, size=23, row_h=44, color=INK, tick=RED):
    """Items laid out RTL in columns (first column on the right)."""
    out = []
    per = math.ceil(len(items) / cols)
    for i, it in enumerate(items):
        c, r = divmod(i, per)
        xr = x_right - c * col_w
        y = top + r * row_h
        out.append(check(xr - 12, y - size * 0.32, 11, tick))
        p, _ = tr(CAIRO_B, it, size, xr - 32, y, color)
        out.append(p)
    return "".join(out)


# ---------------------------------------------------------------- 1. fatigue and insomnia (night)
def fatigue():
    b = [photo("p-moon.png"), scrim(0, 520, NAVY_DEEP, 0.55)]
    b += [logo_tab(), kicker("باقة الإجهاد والأرق")]
    p, _ = tr(CAIRO_XB, "صاحي تعبان..", 96, W - 50, 250, WHITE)
    b.append(p)
    p, _ = tr(CAIRO_XB, "ونايم قلقان؟", 110, W - 50, 370, ORANGE)
    b.append(p)
    p, _ = tr(CAIRO_B, "يمكن السبب يبان في تحليل", 40, W - 50, 440, WHITE, op=0.9)
    b.append(p)
    for i, (x, y, s) in enumerate([(610, 650, 42), (660, 595, 56), (725, 530, 72)]):
        p, _ = tc(MONT, "Z", s, x, y, ORANGE)
        b.append(f'<g transform="rotate({-12 + i * 6} {x} {y})">{p}</g>')
    b += [sparkle(120, 520, 22, "#FFD27A"), sparkle(960, 560, 16, "#FFD27A")]
    b.append(card(40, 952, 1000, 196, fill=NAVY_DEEP, op=0.86))
    p, _ = tr(CAIRO_XB, "٨ تحاليل تطمنك:", 30, W - 80, 1000, ORANGE)
    b.append(p)
    b.append(checklist(["صورة دم كاملة", "مخزون الحديد", "سكر تراكمي", "فيتامين د",
                        "إنزيمات الكبد", "وظائف الكلى", "الكوليسترول والدهون", "الغدة الدرقية TSH"],
                       W - 80, 1052, 236, 4, size=22, row_h=46, color=WHITE, tick=RED))
    b.append(starburst(165, 860, 105, "سعر", "خاص", rot=-14))
    b.append(footer("احجز باقة الإجهاد"))
    return svg(W, H, "".join(b))


# ---------------------------------------------------------------- 2. full check-up (the tablet speaks)
def checkup():
    b = [photo("p-checkup.png"), scrim(0, 330, WHITE, 0.85)]
    b += [logo_tab(), kicker("الباقة الشاملة")]
    p, _ = tr(CAIRO_XB, "جسمك محتاج صيانة سنوية..", 60, W - 50, 205, INK)
    b.append(p)
    p, _ = tr(CAIRO_XB, "زي عربيتك بالظبط", 92, W - 50, 300, RED)
    b.append(p)
    # the robot's tablet screen (measured quad), drawn into in perspective
    tl_, trr, bl = (700.3, 673.8), (859.1, 649.8), (738.8, 806.2)
    sw, sh = 300.0, 250.0
    m = (f"matrix({(trr[0] - tl_[0]) / sw:.4f},{(trr[1] - tl_[1]) / sw:.4f},{(bl[0] - tl_[0]) / sh:.4f},"
         f"{(bl[1] - tl_[1]) / sh:.4f},{tl_[0]:.1f},{tl_[1]:.1f})")
    scr = [f'<rect x="0" y="0" width="{sw}" height="{sh}" fill="{WHITE}"/>',
           f'<rect x="0" y="0" width="{sw}" height="54" fill="{BLUE}"/>']
    p, _ = tc(CAIRO_XB, "تقرير الفحص", 30, sw / 2, 38, WHITE)
    scr.append(p)
    p, _ = tc(MONT, "15", 96, sw / 2 + 40, 160, RED)
    scr.append(p)
    p, _ = tc(CAIRO_XB, "تحليل", 34, sw / 2 - 72, 150, INK)
    scr.append(p)
    p, _ = tc(CAIRO_B, "في زيارة واحدة", 30, sw / 2, 212, BLUE)
    scr.append(p)
    scr.append(f'<rect x="20" y="230" width="{sw - 40}" height="8" rx="4" fill="#E6E6EC"/><rect x="20" y="230" width="{(sw - 40) * 0.82}" height="8" rx="4" fill="{ORANGE}"/>')
    b.append(f'<g transform="{m}">{"".join(scr)}</g>')
    b.append(doodle_arrow("M560,470 C640,470 700,520 720,600", (722, 610, 80), color=BLUE))
    b.append(card(40, 888, 1000, 236, op=0.93))
    b.append(checklist(["صورة دم كاملة", "سكر تراكمي", "وظائف الكلى", "يوريك أسيد", "وظائف الكبد",
                        "الكوليسترول الكلي", "الكوليسترول الجيد والضار", "الدهون الثلاثية", "الغدة TSH", "فيتامين د",
                        "مخزون الحديد", "سرعة الترسيب", "الكالسيوم", "الماغنسيوم", "تحليل بول كامل"],
                       W - 70, 932, 322, 3, size=21, row_h=40, color=INK, tick=BLUE))
    b.append(starburst(165, 520, 100, "سعر", "خاص", rot=-12))
    b.append(footer("احجز الباقة الشاملة"))
    return svg(W, H, "".join(b))


# ---------------------------------------------------------------- 3. anemia, iron, vitamins, minerals
def anemia():
    b = [photo("p-anemia.png")]
    b += [logo_tab(), kicker("باقة الأنيميا والفيتامينات")]
    p, wl = tr(CAIRO_XB, "نفسك مقطوع؟", 116, W - 50, 260, RED)
    b.append(p)
    b.append(battery(W - 50 - wl - 150, 196, 116, 54, 0.18))
    p, _ = tr(CAIRO_XB, "يمكن الحديد ناقص", 66, W - 50, 345, BLUE)
    b.append(p)
    c, _ = chips(["صورة دم CBC", "مخزون الحديد", "الحديد Iron", "TIBC", "تشبع الحديد"], 0, 418, 22, latin=False,
                 fill=WHITE, fop=1, stroke=RED, sop=0.35, color=INK, x_right=W - 50)
    b.append(c)
    c, _ = chips(["فيتامين د", "فيتامين B12", "كالسيوم", "ماغنسيوم", "زنك"], 0, 474, 22, latin=False,
                 fill=WHITE, fop=1, stroke=BLUE, sop=0.35, color=BLUE, x_right=W - 50)
    b.append(c)
    b.append(card(690, 1010, 350, 130, op=0.95))
    p, _ = tr(CAIRO_XB, "إرهاق؟ دوخة؟", 32, W - 70, 1060, RED)
    b.append(p)
    p, _ = tr(CAIRO_B, "شحوب؟ صداع؟ خمول؟", 28, W - 70, 1110, INK)
    b.append(p)
    b += [sparkle(1000, 560, 20), sparkle(700, 600, 14, RED)]
    b.append(starburst(175, 1010, 100, "سعر", "خاص", rot=-10))
    b.append(footer("احجز باقة الأنيميا"))
    return svg(W, H, "".join(b))


# ---------------------------------------------------------------- 4. syndicate members discount
def syndicate():
    b = [photo("p-key.png")]
    b += [logo_tab(), kicker("لأعضاء النقابات")]
    p, _ = tr(CAIRO_XB, "كارنيه نقابتك..", 84, W - 50, 240, BLUE)
    b.append(p)
    p, _ = tr(CAIRO_XB, "مفتاح خصمك", 128, W - 50, 380, RED)
    b.append(p)
    p, _ = tr(CAIRO_B, "خصم خاص على التحاليل والباقات لأعضاء النقابات", 32, W - 50, 448, INK)
    b.append(p)
    b.append(doodle_arrow("M420,500 C520,520 640,560 760,640", (772, 652, 40), color=ORANGE, w=7))
    b += [sparkle(990, 640, 26, "#FFD27A"), sparkle(760, 760, 16, ORANGE), sparkle(1040, 880, 14, "#FFD27A")]
    b.append(starburst(560, 1050, 110, "خصم", "خاص", rot=-10))
    b.append(footer("اسأل على خصم نقابتك"))
    return svg(W, H, "".join(b))


# ---------------------------------------------------------------- 5. full diabetes package
def sugar():
    b = [photo("p-sugar.png")]
    b += [logo_tab(), kicker("باقة السكر الشاملة")]
    p, w1 = tr(CAIRO_XB, "سكرك", 128, W - 50, 270, RED)
    b.append(p)
    p, _ = tr(CAIRO_XB, "مش لعبة", 128, W - 50 - w1 - 28, 270, INK)
    b.append(p)
    p, _ = tr(CAIRO_B, "٧ تحاليل بتحكي الحكاية كلها", 40, W - 50, 336, BLUE)
    b.append(p)
    b.append(card(600, 890, 440, 226, op=0.95))
    p, _ = tr(CAIRO_XB, "الباقة فيها:", 26, W - 70, 930, BURGUNDY)
    b.append(p)
    b.append(checklist(["سكر صايم", "سكر فاطر", "سكر تراكمي", "بول كامل", "إنسولين صايم", "مقاومة الإنسولين", "C-Peptide"],
                       W - 70, 974, 205, 2, size=21, row_h=38, color=INK, tick=RED))
    b.append(doodle_arrow("M300,420 C240,470 230,540 280,590", (286, 600, 70), color=RED))
    b.append(starburst(150, 470, 95, "سعر", "خاص", rot=-14))
    b.append(footer("احجز باقة السكر"))
    return svg(W, H, "".join(b))


SERIES = {
    "30-fatigue": fatigue,
    "31-checkup": checkup,
    "32-anemia": anemia,
    "33-syndicate": syndicate,
    "34-sugar": sugar,
}

if __name__ == "__main__":
    for name, fn in SERIES.items():
        (OUT / f"{name}.svg").write_text(fn())
    print("wrote", len(SERIES))
