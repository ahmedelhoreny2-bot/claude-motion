"""Series 4: the five package posts redone, each in its own style, all in the identity.

  sugar     split magazine layout: photo on top, burgundy panel with headline and tests
  checkup   framed photo on white + a 15-tile test grid; the robot's tablet shows the report
  fatigue   photo inside the cover's double ring as a night window; the alarm clock gets its face (3 AM)
  anemia    fully 2D: the lab's drop mascot, out of iron, with a low "Fe" battery and a magnet
  syndicate red poster: the card-key cut out, syndicate names as chips

No prices: a "سعر خاص" / "خصم خاص" sticker.

    python3 brand/al-asema-lab/make_series4.py && node brand/al-asema-lab/render-posts.mjs
"""
import math

from build import BLUE, BURGUNDY, CAIRO_B, CAIRO_XB, MONT, ORANGE, RED, WHITE, svg
from make_creative import GRAY, INK
from make_series2 import H, W, background, chips, cutout, footer, glow, kicker, logo_tab, molecules, tc, tl, tr
from make_series3 import battery, card, check, doodle_arrow, photo, sparkle, starburst

OUT = __import__("pathlib").Path(__file__).parent / "posts"
WINE = "#5C0E1D"


def icon(cx, cy, r, label, bg=RED, fg=WHITE):
    size = r * (0.8 if len(label) <= 2 else 0.62 if len(label) <= 3 else 0.5)
    p, _ = tc(MONT, label, size, cx, cy + size * 0.36, fg, rtl=False)
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{bg}"/>' + p


# ---------------------------------------------------------------- sugar: split magazine
def sugar():
    split = 770
    b = [f'<rect width="{W}" height="{H}" fill="{WHITE}"/>',
         f'<clipPath id="top"><rect x="0" y="0" width="{W}" height="{split + 40}"/></clipPath>',
         f'<g clip-path="url(#top)"><g transform="translate(0,-300)">{photo("p-sugar.png")}</g></g>']
    panel = f"M0,{split + 30} C300,{split - 20} 760,{split + 50} 1080,{split - 10} L1080,{H} L0,{H} Z"
    b.append(f'<path d="M0,{split + 14} C300,{split - 36} 760,{split + 34} 1080,{split - 26} L1080,{split - 10} '
             f'C760,{split + 50} 300,{split - 20} 0,{split + 30} Z" fill="{RED}"/>')
    b.append(f'<defs><linearGradient id="pn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{BURGUNDY}"/>'
             f'<stop offset="1" stop-color="{WINE}"/></linearGradient></defs><path d="{panel}" fill="url(#pn)"/>')
    b.append(molecules(WHITE, 0.06, seed=1).replace('translate(120,420)', 'translate(120,1020)'))
    b += [logo_tab(), kicker("باقة السكر الشاملة")]
    p, w1 = tr(CAIRO_XB, "سكرك", 120, W - 50, split + 150, ORANGE)
    b.append(p)
    p, _ = tr(CAIRO_XB, "مش لعبة", 120, W - 50 - w1 - 28, split + 150, WHITE)
    b.append(p)
    p, _ = tr(CAIRO_B, "٧ تحاليل بتحكي حكاية سكرك كلها", 36, W - 50, split + 212, WHITE, op=0.85)
    b.append(p)
    rows = [["سكر صايم", "سكر فاطر", "سكر تراكمي", "بول كامل"], ["إنسولين صايم", "مقاومة الإنسولين", "C-Peptide"]]
    for i, r in enumerate(rows):
        c, _ = chips(r, 0, split + 268 + i * 58, 24, latin=False, fill=WHITE, fop=0.12, stroke=WHITE, sop=0.4, color=WHITE, x_right=W - 50)
        b.append(c)
    b.append(starburst(150, split - 10, 100, "سعر", "خاص", rot=-14))
    b.append(footer("احجز باقة السكر"))
    return svg(W, H, "".join(b))


# ---------------------------------------------------------------- checkup: framed photo + test grid
TESTS15 = [("CBC", "صورة دم"), ("A1c", "سكر تراكمي"), ("K", "وظائف كلى"), ("UA", "يوريك أسيد"), ("L", "وظائف كبد"),
           ("TC", "كوليسترول"), ("HDL", "الجيد والضار"), ("TG", "دهون ثلاثية"), ("TSH", "الغدة"), ("D", "فيتامين د"),
           ("Fe", "مخزون حديد"), ("ESR", "الترسيب"), ("Ca", "كالسيوم"), ("Mg", "ماغنسيوم"), ("U", "بول كامل")]


def checkup():
    b = [background("#E6ECF8"), logo_tab(), kicker("الباقة الشاملة")]
    p, _ = tr(CAIRO_XB, "جسمك محتاج صيانة سنوية..", 58, W - 50, 205, INK)
    b.append(p)
    p, _ = tr(CAIRO_XB, "زي عربيتك بالظبط", 90, W - 50, 298, RED)
    b.append(p)
    fx, fy, fw, fh = 50, 340, 980, 520
    s = fw / W
    ty = fy - 300 * s
    tl_, trr, bl = (700.3, 673.8), (859.1, 649.8), (738.8, 806.2)
    sw, sh = 300.0, 250.0
    m = (f"matrix({(trr[0] - tl_[0]) / sw:.4f},{(trr[1] - tl_[1]) / sw:.4f},{(bl[0] - tl_[0]) / sh:.4f},"
         f"{(bl[1] - tl_[1]) / sh:.4f},{tl_[0]:.1f},{tl_[1]:.1f})")
    scr = [f'<rect x="0" y="0" width="{sw}" height="{sh}" fill="{WHITE}"/>', f'<rect x="0" y="0" width="{sw}" height="54" fill="{BLUE}"/>']
    p, _ = tc(CAIRO_XB, "تقرير الفحص", 30, sw / 2, 38, WHITE)
    scr.append(p)
    p, _ = tc(MONT, "15", 96, sw / 2 + 40, 160, RED)
    scr.append(p)
    p, _ = tc(CAIRO_XB, "تحليل", 34, sw / 2 - 72, 150, INK)
    scr.append(p)
    p, _ = tc(CAIRO_B, "في زيارة واحدة", 30, sw / 2, 212, BLUE)
    scr.append(p)
    b.append(f'<filter id="fs" x="-5%" y="-5%" width="110%" height="115%"><feDropShadow dx="0" dy="14" stdDeviation="18" flood-opacity="0.22"/></filter>'
             f'<rect x="{fx}" y="{fy}" width="{fw}" height="{fh}" rx="40" fill="#fff" filter="url(#fs)"/>'
             f'<clipPath id="fr"><rect x="{fx}" y="{fy}" width="{fw}" height="{fh}" rx="40"/></clipPath>'
             f'<g clip-path="url(#fr)"><g transform="translate({fx},{ty:.1f}) scale({s:.4f})">{photo("p-checkup.png")}'
             f'<g transform="{m}">{"".join(scr)}</g></g></g>'
             f'<rect x="{fx}" y="{fy}" width="{fw}" height="{fh}" rx="40" fill="none" stroke="{WHITE}" stroke-width="10"/>')
    b.append(f'<path d="M{fx + fw - 120},{fy + fh - 6} L{fx + fw - 6},{fy + fh - 6} L{fx + fw - 6},{fy + fh - 120}" fill="none" stroke="{ORANGE}" stroke-width="12" stroke-linecap="round"/>')
    b.append(f'<path d="M{fx + 6},{fy + 120} L{fx + 6},{fy + 6} L{fx + 120},{fy + 6}" fill="none" stroke="{BURGUNDY}" stroke-width="12" stroke-linecap="round"/>')
    tw, th, gap = 184, 76, 9
    x0 = W - 50
    for i, (ab, ar) in enumerate(TESTS15):
        r, c = divmod(i, 5)
        x = x0 - c * (tw + gap) - tw
        y = 884 + r * (th + gap)
        col = (RED, BLUE, BURGUNDY)[r]
        b.append(f'<rect x="{x}" y="{y}" width="{tw}" height="{th}" rx="18" fill="{WHITE}" stroke="{col}" stroke-opacity="0.25" stroke-width="2"/>')
        b.append(icon(x + tw - 36, y + th / 2, 25, ab, bg=col))
        p, _ = tr(CAIRO_B, ar, 20, x + tw - 70, y + th / 2 + 7, INK)
        b.append(p)
    b.append(starburst(160, 360, 92, "سعر", "خاص", rot=-12))
    b.append(footer("احجز الباقة الشاملة"))
    return svg(W, H, "".join(b))


# ---------------------------------------------------------------- fatigue: night window in the double ring, 3 AM
def clock_face(cx, cy, rx, ry):
    out = [f'<ellipse cx="{cx}" cy="{cy}" rx="{rx * 0.98:.1f}" ry="{ry * 0.98:.1f}" fill="#FFF6EA"/>']
    for i in range(60):
        a = math.radians(i * 6 - 90)
        r0, r1 = (0.86, 0.96) if i % 5 == 0 else (0.91, 0.96)
        out.append(f'<line x1="{cx + rx * r0 * math.cos(a):.1f}" y1="{cy + ry * r0 * math.sin(a):.1f}" x2="{cx + rx * r1 * math.cos(a):.1f}" '
                   f'y2="{cy + ry * r1 * math.sin(a):.1f}" stroke="{INK}" stroke-width="{4 if i % 5 == 0 else 1.6}" stroke-linecap="round"/>')
    for n in range(1, 13):
        a = math.radians(n * 30 - 90)
        x, y = cx + rx * 0.71 * math.cos(a), cy + ry * 0.71 * math.sin(a)
        sz = rx * 0.2
        p, _ = tc(MONT, str(n), sz, x, y + sz * 0.36, INK, rtl=False)
        out.append(p)
    # 3:00 AM: hour hand to 3, minute hand to 12; red second hand
    out.append(f'<line x1="{cx}" y1="{cy}" x2="{cx + rx * 0.45:.1f}" y2="{cy}" stroke="{INK}" stroke-width="{rx * 0.07:.1f}" stroke-linecap="round"/>')
    out.append(f'<line x1="{cx}" y1="{cy}" x2="{cx}" y2="{cy - ry * 0.66:.1f}" stroke="{INK}" stroke-width="{rx * 0.045:.1f}" stroke-linecap="round"/>')
    out.append(f'<line x1="{cx}" y1="{cy + ry * 0.15:.1f}" x2="{cx - rx * 0.35:.1f}" y2="{cy - ry * 0.55:.1f}" stroke="{RED}" stroke-width="3" stroke-linecap="round"/>')
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{rx * 0.07:.1f}" fill="{RED}"/>')
    return "".join(out)


def fatigue():
    b = [background("#F6EEF1"), logo_tab(), kicker("باقة الإجهاد والأرق")]
    p, _ = tr(CAIRO_XB, "صاحي تعبان..", 90, W - 50, 240, INK)
    b.append(p)
    p, _ = tr(CAIRO_XB, "ونايم قلقان؟", 108, W - 50, 360, RED)
    b.append(p)
    p, _ = tr(CAIRO_B, "يمكن السبب يبان في تحليل", 38, W - 50, 428, BLUE)
    b.append(p)
    cx, cy, r = 400, 812, 330
    s = 0.78
    tx, ty = cx - 640 * s, cy - 830 * s
    b.append(f'<clipPath id="win"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath>'
             f'<g clip-path="url(#win)"><g transform="translate({tx:.1f},{ty:.1f}) scale({s})">{photo("p-moon.png")}'
             f'{clock_face(880.8, 871.2, 122, 140)}</g></g>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="{r + 20}" fill="none" stroke="{BURGUNDY}" stroke-width="40"/>'
             f'<circle cx="{cx}" cy="{cy}" r="{r - 2}" fill="none" stroke="{ORANGE}" stroke-width="16"/>')
    for i, (x, y, sz) in enumerate([(380, 610, 36), (420, 565, 48), (472, 510, 62)]):
        p, _ = tc(MONT, "Z", sz, x, y, ORANGE)
        b.append(f'<g transform="rotate({-12 + i * 6} {x} {y})">{p}</g>')
    # 3 AM tag pointing at the clock
    b.append(f'<rect x="770" y="1000" width="200" height="66" rx="33" fill="{INK}"/>')
    p, _ = tc(MONT, "3:00 AM", 30, 870, 1044, WHITE, rtl=False)
    b.append(p)
    b.append(doodle_arrow("M800,1000 C760,970 730,940 700,910", (694, 902, 225), color=INK, w=5))
    b.append(card(760, 520, 285, 460, op=0.96, stroke=BURGUNDY))
    p, _ = tr(CAIRO_XB, "٨ تحاليل", 30, W - 60, 570, BURGUNDY)
    b.append(p)
    items = [("CBC", "صورة دم"), ("Fe", "مخزون الحديد"), ("A1c", "سكر تراكمي"), ("D", "فيتامين د"),
             ("L", "إنزيمات الكبد"), ("K", "وظائف الكلى"), ("TG", "الكوليسترول"), ("TSH", "الغدة الدرقية")]
    for i, (ab, ar) in enumerate(items):
        y = 615 + i * 45
        b.append(icon(W - 82, y - 8, 17, ab, bg=(RED, BLUE)[i % 2]))
        p, _ = tr(CAIRO_B, ar, 22, W - 110, y, INK)
        b.append(p)
    b.append(starburst(150, 1060, 96, "سعر", "خاص", rot=-12))
    b.append(footer("احجز باقة الإجهاد"))
    return svg(W, H, "".join(b))


# ---------------------------------------------------------------- anemia: fully 2D with the mascot
def mascot(x, y, s, tired=True):
    lid = (f'<path d="M-42,18 a17,21 0 0 1 34,0 Z" fill="#C21E2C"/><path d="M8,18 a17,21 0 0 1 34,0 Z" fill="#C21E2C"/>' if tired else "")
    return (f'<defs><radialGradient id="dg" cx="35%" cy="35%" r="75%"><stop offset="0" stop-color="#FF6A6E"/>'
            f'<stop offset="0.55" stop-color="{RED}"/><stop offset="1" stop-color="#A3141F"/></radialGradient></defs>'
            f'<ellipse cx="{x}" cy="{y + 4}" rx="{80 * s}" ry="{13 * s}" fill="#000" opacity="0.1"/>'
            f'<g transform="translate({x},{y}) scale({s}) translate(0,-118)">'
            f'<ellipse cx="-30" cy="114" rx="22" ry="11" fill="{BURGUNDY}"/><ellipse cx="30" cy="114" rx="22" ry="11" fill="{BURGUNDY}"/>'
            f'<path d="M-74,20 q-26,26 -30,58" stroke="{BURGUNDY}" stroke-width="12" stroke-linecap="round" fill="none"/>'
            f'<path d="M74,20 q26,26 30,58" stroke="{BURGUNDY}" stroke-width="12" stroke-linecap="round" fill="none"/>'
            f'<path d="M0,-118 C30,-70 80,-20 80,28 A80,80 0 0 1 -80,28 C-80,-20 -30,-70 0,-118 Z" fill="url(#dg)"/>'
            f'<ellipse cx="-36" cy="-12" rx="13" ry="26" fill="#fff" opacity="0.5" transform="rotate(-28 -36 -12)"/>'
            f'<ellipse cx="-25" cy="18" rx="17" ry="21" fill="#fff"/><ellipse cx="25" cy="18" rx="17" ry="21" fill="#fff"/>'
            f'<circle cx="-25" cy="26" r="8" fill="#1F236B"/><circle cx="25" cy="26" r="8" fill="#1F236B"/>{lid}'
            f'<path d="M-18,62 Q0,50 18,62" stroke="#1F236B" stroke-width="6" stroke-linecap="round" fill="none"/>'
            f'<path d="M58,-30 q10,16 0,24 q-10,-8 0,-24 Z" fill="#9FB3EA"/>'
            '</g>')


def magnet(cx, cy, s, rot):
    return (f'<g transform="translate({cx},{cy}) rotate({rot}) scale({s})">'
            f'<path d="M-60,-10 L-60,40 A60,60 0 0 0 60,40 L60,-10" fill="none" stroke="{RED}" stroke-width="42"/>'
            f'<rect x="-81" y="-50" width="42" height="40" fill="#C9C9D6"/><rect x="39" y="-50" width="42" height="40" fill="#C9C9D6"/>'
            f'<path d="M-50,40 A50,50 0 0 0 0,90" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="8"/></g>')


def anemia():
    b = [background("#F6EEF1"), glow(420, 700, 420, "#F4B9C2", 0.5), logo_tab(), kicker("باقة الأنيميا والفيتامينات")]
    p, wl = tr(CAIRO_XB, "نفسك مقطوع؟", 112, W - 50, 250, RED)
    b.append(p)
    p, _ = tr(CAIRO_XB, "يمكن الحديد ناقص", 64, W - 50, 336, BLUE)
    b.append(p)
    # the scene
    mx, my = 300, 840
    b.append(f'<ellipse cx="560" cy="{my + 6}" rx="480" ry="26" fill="#000" opacity="0.04"/>')
    # symptom tags with connectors
    tags = [("إرهاق", 120, 470), ("دوخة", 470, 455), ("صداع", 80, 610), ("شحوب", 520, 600), ("خمول", 100, 760)]
    for t, x, y in tags:
        b.append(f'<line x1="{x}" y1="{y}" x2="{mx}" y2="{my - 150}" stroke="{RED}" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>')
    for t, x, y in tags:
        c, _ = chips([t], x, y, 26, latin=False, fill=WHITE, fop=1, stroke=RED, sop=0.4, color=RED)
        b.append(c)
    b.append(mascot(mx, my, 1.35))
    # the Fe battery, nearly empty, with a magnet pulling iron toward it
    bx, by, bw, bh = 640, 660, 340, 130
    b.append(battery(bx, by, bw, bh, 0.15))
    p, _ = tc(MONT, "Fe", 64, bx + bw * 0.62, by + bh * 0.68, BURGUNDY, rtl=False)
    b.append(p)
    p, _ = tc(MONT, "15%", 30, bx + bw * 0.62, by + bh + 46, RED, rtl=False)
    b.append(p)
    p, _ = tc(CAIRO_XB, "مخزون الحديد", 30, bx + bw / 2, by - 24, INK)
    b.append(p)
    b.append(magnet(900, 500, 0.9, 200))
    for i, (x, y) in enumerate([(880, 560), (850, 585), (930, 590), (815, 600)]):
        b.append(f'<circle cx="{x}" cy="{y}" r="{11 - i % 3 * 2}" fill="#9A9AA1"/><circle cx="{x - 3}" cy="{y - 3}" r="3" fill="#fff"/>')
    b += [sparkle(990, 420, 18), sparkle(620, 650, 12, RED)]
    # three test cards
    groups = [("الأنيميا والحديد", ["صورة دم كاملة CBC", "مخزون الحديد Ferritin", "الحديد Iron", "سعة الارتباط TIBC", "تشبع الحديد"], RED, 530),
              ("الفيتامينات", ["فيتامين د", "فيتامين B12"], BLUE, 235), ("المعادن", ["كالسيوم", "ماغنسيوم", "زنك"], BURGUNDY, 215)]
    x = W - 40
    for title, items, col, w in groups:
        b.append(card(x - w, 878, w, 236, op=0.97))
        b.append(f'<rect x="{x - w}" y="878" width="{w}" height="50" rx="24" fill="{col}"/><rect x="{x - w}" y="903" width="{w}" height="25" fill="{col}"/>')
        p, _ = tc(CAIRO_XB, title, 24, x - w / 2, 912, WHITE)
        b.append(p)
        for i, it in enumerate(items):
            yy = 962 + i * 34
            b.append(f'<circle cx="{x - 24}" cy="{yy - 8}" r="5" fill="{col}"/>')
            p, _ = tr(CAIRO_B, it, 21, x - 38, yy, INK)
            b.append(p)
        x -= w + 15
    b.append(starburst(180, 260, 92, "سعر", "خاص", rot=-12))
    b.append(footer("احجز باقة الأنيميا"))
    return svg(W, H, "".join(b))


# ---------------------------------------------------------------- syndicate: red poster
SYNDICATES = ["نقابة الأطباء", "نقابة المحامين", "نقابة المهندسين", "نقابة الصحفيين", "نقابة التجاريين",
              "نقابة المهن التعليمية", "نقابة المهن العلمية", "نقابة المهن الزراعية", "نقابة التطبيقيين", "البريد المصري"]


def syndicate():
    b = [f'<defs><linearGradient id="rbg" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#EE3B40"/>'
         f'<stop offset="0.55" stop-color="{RED}"/><stop offset="1" stop-color="{BURGUNDY}"/></linearGradient></defs>'
         f'<rect width="{W}" height="{H}" fill="url(#rbg)"/>', molecules(WHITE, 0.07, seed=2)]
    b.append(f'<circle cx="760" cy="760" r="300" fill="none" stroke="{WHITE}" stroke-opacity="0.12" stroke-width="2"/>'
             f'<circle cx="760" cy="760" r="380" fill="none" stroke="{WHITE}" stroke-opacity="0.07" stroke-width="2"/>')
    b.append(glow(700, 690, 300, "#FFFFFF", 0.55))
    img, _ = cutout("p-key", 380, 690, w=780, shadow=0.35)
    b.append(img)
    b += [logo_tab(), kicker("لأعضاء النقابات")]
    p, _ = tr(CAIRO_XB, "كارنيه نقابتك..", 82, W - 50, 235, WHITE)
    b.append(p)
    p, _ = tr(CAIRO_XB, "مفتاح خصمك", 130, W - 50, 375, ORANGE)
    b.append(p)
    p, _ = tr(CAIRO_B, "خصم خاص على التحاليل والباقات", 36, W - 50, 440, WHITE, op=0.9)
    b.append(p)
    b += [sparkle(1000, 560, 24, "#FFD27A"), sparkle(560, 520, 14, WHITE)]
    b.append(starburst(960, 790, 90, "خصم", "خاص", rot=10))
    rows = [SYNDICATES[:4], SYNDICATES[4:7], SYNDICATES[7:]]
    for i, r in enumerate(rows):
        c, _ = chips(r, W / 2, 970 + i * 52, 21, latin=False, fill=WHITE, fop=0.14, stroke=WHITE, sop=0.45, color=WHITE)
        b.append(c)
    b.append(footer("اسأل على خصم نقابتك"))
    return svg(W, H, "".join(b))


SERIES = {"40-sugar": sugar, "41-checkup": checkup, "42-fatigue": fatigue, "43-anemia": anemia, "44-syndicate": syndicate}

if __name__ == "__main__":
    for name, fn in SERIES.items():
        (OUT / f"{name}.svg").write_text(fn())
    print("wrote", len(SERIES))
