"""Series 6: five packages shot from unusual camera angles. The logo tab and headline move to wherever
each photo leaves calm space; the rest of the system (kicker, footer, no prices) stays fixed.

    python3 brand/al-asema-lab/make_series6.py && node brand/al-asema-lab/render-posts.mjs
"""
from build import BLUE, BURGUNDY, CAIRO_B, CAIRO_XB, ORANGE, RED, WHITE, svg
from make_creative import INK
from make_series2 import H, W, chips, footer, tc, tl, tr
from make_series3 import card, check, doodle_arrow, photo, scrim, sparkle, starburst
from make_social import embed

OUT = __import__("pathlib").Path(__file__).parent / "posts"


def logo_at(x0, w=328, h=126, shadow=0.18):
    x1, r = x0 + w, 26
    path = f"M{x0},0 L{x1},0 L{x1},{h - r} Q{x1},{h} {x1 - r},{h} L{x0 + r},{h} Q{x0},{h} {x0},{h - r} Z"
    logo, _ = embed("logo-horizontal-color", x0 + 24, (h - 98) / 2 + 2, w - 48)
    return (f'<filter id="tab{int(x0)}" x="-10%" y="-20%" width="120%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="12" '
            f'flood-color="#000" flood-opacity="{shadow}"/></filter><path d="{path}" fill="{WHITE}" filter="url(#tab{int(x0)})"/>' + logo)


def tag(text, x, y, anchor="left", bg=ORANGE, fg=INK, size=30):
    w = CAIRO_XB.width(text, size, rtl=True) + 56
    h = 58
    x0 = x if anchor == "left" else (x - w if anchor == "right" else x - w / 2)
    return (f'<rect x="{x0:.1f}" y="{y}" width="{w:.1f}" height="{h}" rx="{h / 2}" fill="{bg}"/>'
            f'<path fill="{fg}" d="{CAIRO_XB.path(text, size, x0 + 28, y + h / 2 + size * 0.36, rtl=True)}"/>')


def test_rows(items, x_right, top, col_w, cols, size=22, row_h=42, color=INK, tick=RED):
    out, per = [], -(-len(items) // cols)
    for i, it in enumerate(items):
        c, r = divmod(i, per)
        xr, y = x_right - c * col_w, top + r * row_h
        out.append(check(xr - 12, y - size * 0.32, 11, tick))
        p, _ = tr(CAIRO_B, it, size, xr - 32, y, color)
        out.append(p)
    return "".join(out)


# 1 ---- pregnancy: overhead flat lay; headline on the empty sheet, tests as chips under it
def pregnancy():
    b = [photo("q-pregnancy.png"), scrim(0, 470, WHITE, 0.55), logo_at(712), tag("باقة الحامل", 40, 34)]
    p, _ = tr(CAIRO_XB, "حبيبك الصغير بيتطمن..", 56, W - 50, 212, INK)
    b.append(p)
    p, _ = tr(CAIRO_XB, "لما تتطمني إنتي", 100, W - 50, 318, RED)
    b.append(p)
    rows = [["صورة دم", "فصيلة الدم Rh", "سكر صايم", "الغدة TSH"], ["فيتامين د", "مخزون الحديد", "بول كامل", "فيروسات B و C"]]
    for i, r in enumerate(rows):
        c, _ = chips(r, 0, 372 + i * 50, 20, latin=False, fill=WHITE, fop=0.97, stroke=BURGUNDY, sop=0.3, color=BURGUNDY, x_right=W - 50)
        b.append(c)
    b.append(starburst(150, 770, 92, "سعر", "خاص", rot=-12))
    b.append(footer("احجزي باقة الحامل"))
    return svg(W, H, "".join(b))


# 2 ---- athletes: worm's-eye; logo centred between the plates, headline at the bright bottom
def athlete():
    b = [photo("q-athlete.png"), scrim(700, 1180, WHITE, 0.96, up=True), logo_at((W - 328) / 2), tag("باقة الرياضيين", W / 2, 142, "center")]
    p, _ = tc(CAIRO_XB, "قبل ما تزوّد الأوزان..", 54, W / 2, 870, INK)
    b.append(p)
    p, _ = tc(CAIRO_XB, "زوّد معلوماتك", 108, W / 2, 975, RED)
    b.append(p)
    c, _ = chips(["صورة دم", "فيتامين د", "مخزون الحديد", "إنزيم العضلات CK"], W / 2, 1024, 20, latin=False,
                 fill=WHITE, fop=1, stroke=BLUE, sop=0.35, color=BLUE)
    b.append(c)
    c, _ = chips(["وظائف كلى", "وظائف كبد", "تستوستيرون", "سكر تراكمي"], W / 2, 1070, 20, latin=False,
                 fill=WHITE, fop=1, stroke=BLUE, sop=0.35, color=BLUE)
    b.append(c)
    b.append(starburst(930, 690, 88, "سعر", "خاص", rot=12))
    b.append(footer("احجز باقة الرياضيين"))
    return svg(W, H, "".join(b))


# 3 ---- heart: inside the artery; headline in the dark top, a callout on the plaque, dark test card
def artery():
    b = [photo("q-artery.png"), scrim(0, 420, "#1A0508", 0.55), logo_at(712), tag("باقة القلب والكوليسترول", 40, 34)]
    p, _ = tr(CAIRO_XB, "شرايينك طريق..", 66, W - 50, 225, WHITE)
    b.append(p)
    p, _ = tr(CAIRO_XB, "خليه سالك", 116, W - 50, 345, ORANGE)
    b.append(p)
    b.append(doodle_arrow("M290,505 C380,520 560,560 690,640", (700, 648, 35), color=WHITE, w=6))
    b.append(tag("ده الكوليسترول الضار", 60, 470, bg=WHITE, fg=RED, size=26))
    b.append(card(40, 870, 1000, 236, fill="#1A0508", op=0.78))
    p, _ = tr(CAIRO_XB, "٨ تحاليل لقلبك:", 28, W - 70, 916, ORANGE)
    b.append(p)
    b.append(test_rows(["الكوليسترول الكلي", "الكوليسترول الجيد HDL", "الكوليسترول الضار LDL", "الدهون الثلاثية",
                        "سكر تراكمي", "معامل الالتهاب CRP", "وظائف كلى", "يوريك أسيد"], W - 70, 966, 470, 2, color=WHITE, tick=RED))
    b.append(starburst(160, 760, 88, "سعر", "خاص", rot=-12))
    b.append(footer("احجز باقة القلب"))
    return svg(W, H, "".join(b))


# 4 ---- kids: overhead chalk floor; headline top right, tests on a card top left
def kids():
    b = [photo("q-kids.png"), scrim(0, 380, WHITE, 0.4), logo_at(712), tag("باقة الأطفال", 40, 34)]
    p, _ = tr(CAIRO_XB, "بطلك الصغير يستاهل..", 52, W - 50, 196, INK)
    b.append(p)
    p, _ = tr(CAIRO_XB, "يكبر صح", 104, W - 50, 296, RED)
    b.append(p)
    b.append(card(40, 112, 408, 236, op=0.95))
    p, _ = tr(CAIRO_XB, "باقة فيها:", 24, 428, 150, BURGUNDY)
    b.append(p)
    b.append(test_rows(["صورة دم", "مخزون الحديد", "فيتامين د", "سكر صايم", "الغدة", "تحليل براز", "بول كامل", "كالسيوم"],
                       428, 190, 196, 2, size=20, row_h=40, tick=BLUE))
    b += [sparkle(520, 330, 18), sparkle(470, 220, 12, RED)]
    b.append(starburst(140, 1010, 90, "سعر", "خاص", rot=-12))
    b.append(footer("احجز باقة الأطفال"))
    return svg(W, H, "".join(b))


# 5 ---- hair: extreme macro; logo on the left (the helix fills the right), headline beside the helix
def hair():
    b = [photo("q-hair.png"), scrim(0, 560, WHITE, 0.5), logo_at(40), tag("باقة الشعر والبشرة", 680, 150, "right")]
    p, _ = tr(CAIRO_XB, "شعرك بيقع؟", 110, 680, 330, RED)
    b.append(p)
    p, _ = tr(CAIRO_XB, "الإجابة مش في الشامبو", 46, 680, 400, INK)
    b.append(p)
    c, _ = chips(["مخزون الحديد", "فيتامين د", "B12", "الزنك"], 0, 452, 20, latin=False,
                 fill=WHITE, fop=0.97, stroke=RED, sop=0.35, color=BURGUNDY, x_right=680)
    b.append(c)
    c, _ = chips(["الغدة TSH", "صورة دم", "الهرمونات"], 0, 502, 20, latin=False,
                 fill=WHITE, fop=0.97, stroke=RED, sop=0.35, color=BURGUNDY, x_right=680)
    b.append(c)
    b.append(starburst(930, 790, 88, "سعر", "خاص", rot=10))
    b.append(footer("احجز باقة الشعر"))
    return svg(W, H, "".join(b))


SERIES = {"60-pregnancy": pregnancy, "61-athlete": athlete, "62-artery": artery, "63-kids": kids, "64-hair": hair}

if __name__ == "__main__":
    for name, fn in SERIES.items():
        (OUT / f"{name}.svg").write_text(fn())
    print("wrote", len(SERIES))
