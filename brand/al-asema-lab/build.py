"""Build every Al Asema Lab logo file from code.

    python3 brand/al-asema-lab/build.py          # SVGs (text outlined to paths)
    node brand/al-asema-lab/render-png.mjs       # PNG exports from those SVGs

Needs: pip install fonttools uharfbuzz
Text is shaped with HarfBuzz and converted to outlines, so the SVGs need no fonts
installed and open the same in Illustrator, Figma, Canva or a browser.
"""
import json
import math
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).parent
OUT = ROOT / "logo" / "svg"
PAL = json.loads((ROOT / "palette.json").read_text())
COL = {c["id"]: c["hex"] for c in PAL["core"]}

INDIGO, CRIMSON, TEAL = COL["indigo"], COL["crimson"], COL["teal"]
INK, PAPER, WHITE = COL["ink"], COL["mist"], "#FFFFFF"


# ---------------------------------------------------------------- the mark
# Grid: 200 x 200. A pointed arch (the gate of the capital) holding a sample drop.
# The drop's tip repeats the arch's apex, so the two shapes rhyme.
ARCH_W = 21  # stroke width of the arch


def arch_path():
    return "M40,178 L40,104 A72,72 0 0 1 100,33 A72,72 0 0 1 160,104 L160,178"


def drop_path(cx=100, tip=74, cy=139, r=30):
    d = cy - tip
    a = math.asin(r / d)  # half-angle at the tip
    tx = r * math.cos(a)
    ty = cy - r * math.sin(a)
    # tangent points left/right, then the big arc around the bottom
    return (
        f"M{cx},{tip} L{cx + tx:.2f},{ty:.2f} "
        f"A{r},{r} 0 1 1 {cx - tx:.2f},{ty:.2f} Z"
    )


def shine_path():
    return "M86,140 A15,15 0 0 0 96,155"


def mark(arch, drop, shine=None, tx=0, ty=0, s=1.0):
    g = [f'<g transform="translate({tx:.2f},{ty:.2f}) scale({s:.4f})">']
    g.append(
        f'<path d="{arch_path()}" fill="none" stroke="{arch}" stroke-width="{ARCH_W}" '
        'stroke-linecap="round" stroke-linejoin="round"/>'
    )
    g.append(f'<path d="{drop_path()}" fill="{drop}"/>')
    if shine:
        g.append(
            f'<path d="{shine_path()}" fill="none" stroke="{shine}" stroke-width="5" '
            'stroke-linecap="round" opacity="0.9"/>'
        )
    g.append("</g>")
    return "".join(g)


# ---------------------------------------------------------------- text → paths
class Face:
    def __init__(self, file):
        path = ROOT / "fonts" / file
        blob = hb.Blob.from_file_path(str(path))
        self.font = hb.Font(hb.Face(blob))
        self.tt = TTFont(path)
        self.upm = self.tt["head"].unitsPerEm
        self.gs = self.tt.getGlyphSet()
        self.order = self.tt.getGlyphOrder()

    def shape(self, text, rtl=False, tracking=0):
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        if rtl:
            buf.direction = "rtl"
        hb.shape(self.font, buf, {"kern": True, "liga": True})
        x, glyphs = 0, []
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            glyphs.append((self.order[info.codepoint], x + pos.x_offset, pos.y_offset))
            x += pos.x_advance + tracking * self.upm
        return glyphs, x - tracking * self.upm

    def width(self, text, size, rtl=False, tracking=0):
        return self.shape(text, rtl, tracking)[1] * size / self.upm

    def path(self, text, size, x, baseline, rtl=False, tracking=0):
        """SVG path data for `text` with its left edge at x, baseline at y."""
        glyphs, _ = self.shape(text, rtl, tracking)
        k = size / self.upm
        out = []
        for name, gx, gy in glyphs:
            pen = SVGPathPen(self.gs)
            tp = TransformPen(pen, (k, 0, 0, -k, x + gx * k, baseline - gy * k))
            self.gs[name].draw(tp)
            out.append(pen.getCommands())
        return " ".join(c for c in out if c)


CAIRO_XB = Face("Cairo-ExtraBold.ttf")
CAIRO_B = Face("Cairo-Bold.ttf")
MONT = Face("Montserrat-Bold.ttf")

NAME_AR = "معمل العاصمة"
SUB_AR = "للتحاليل الطبية"
NAME_EN = "AL ASEMA LAB"
TAG_AR = "دقة · سرعة · جودة"


def svg(w, h, body, bg=None):
    rect = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'width="{w}" height="{h}">{rect}{body}</svg>\n'
    )


def text_block(colors, cx_right, top, scale=1.0):
    """Arabic name + subline + English line, right-aligned at cx_right.
    Returns (svg, width, height)."""
    name_sz, sub_sz, en_sz = 96 * scale, 50 * scale, 26 * scale
    w1 = CAIRO_XB.width(NAME_AR, name_sz, rtl=True)
    w2 = CAIRO_B.width(SUB_AR, sub_sz, rtl=True)
    w3 = MONT.width(NAME_EN, en_sz, tracking=0.32)
    width = max(w1, w2, w3)
    b1 = top + 104 * scale
    b2 = b1 + 70 * scale
    b3 = b2 + 54 * scale
    parts = [
        f'<path fill="{colors[0]}" d="{CAIRO_XB.path(NAME_AR, name_sz, cx_right - w1, b1, rtl=True)}"/>',
        f'<path fill="{colors[1]}" d="{CAIRO_B.path(SUB_AR, sub_sz, cx_right - w2, b2, rtl=True)}"/>',
        f'<path fill="{colors[2]}" d="{MONT.path(NAME_EN, en_sz, cx_right - w3, b3, tracking=0.32)}"/>',
    ]
    return "".join(parts), width, b3 - top + 8 * scale


def centered_block(colors, cx, top, scale=1.0):
    name_sz, sub_sz, en_sz = 96 * scale, 50 * scale, 26 * scale
    w1 = CAIRO_XB.width(NAME_AR, name_sz, rtl=True)
    w2 = CAIRO_B.width(SUB_AR, sub_sz, rtl=True)
    w3 = MONT.width(NAME_EN, en_sz, tracking=0.32)
    b1 = top + 104 * scale
    b2 = b1 + 70 * scale
    b3 = b2 + 56 * scale
    return (
        f'<path fill="{colors[0]}" d="{CAIRO_XB.path(NAME_AR, name_sz, cx - w1 / 2, b1, rtl=True)}"/>'
        f'<path fill="{colors[1]}" d="{CAIRO_B.path(SUB_AR, sub_sz, cx - w2 / 2, b2, rtl=True)}"/>'
        f'<path fill="{colors[2]}" d="{MONT.path(NAME_EN, en_sz, cx - w3 / 2, b3, tracking=0.32)}"/>'
    ), b3 - top + 8 * scale


# ---------------------------------------------------------------- variants
# (name, arch, drop, shine, text colors (name, sub, en), background)
SCHEMES = {
    "color": (INDIGO, CRIMSON, WHITE, (INDIGO, INK, CRIMSON), None),
    "reverse": (WHITE, CRIMSON, WHITE, (WHITE, "#C9CCF2", "#FF8A98"), INDIGO),
    "mono-dark": (INK, INK, None, (INK, INK, INK), None),
    "mono-white": (WHITE, WHITE, None, (WHITE, WHITE, WHITE), None),
}


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    files = []

    for key, (arch, drop, shine, tcol, bg) in SCHEMES.items():
        # mark only, 512 square, 12% safe padding
        files.append((f"mark-{key}.svg", svg(512, 512, mark(arch, drop, shine, 56, 46, 2.0), bg)))

        # horizontal lockup, RTL: mark on the right, text to its left
        pad, gap, mk = 64, 44, 1.5
        txt, tw, th = text_block(tcol, 0, 0)
        mark_w = 200 * mk
        W = int(pad + tw + gap + mark_w + pad)
        H = int(pad * 2 + max(th, 200 * mk))
        ty = (H - th) / 2 - 6
        body = (
            f'<g transform="translate({pad + tw:.2f},{ty:.2f})">{txt}</g>'
            + mark(arch, drop, shine, W - pad - mark_w, (H - 200 * mk) / 2, mk)
        )
        files.append((f"logo-horizontal-{key}.svg", svg(W, H, body, bg)))

        # stacked lockup: mark above, centred text
        W2 = 900
        mk2 = 1.6
        ctext, ch = centered_block(tcol, W2 / 2, 0)
        H2 = int(70 + 200 * mk2 - 26 + ch + 70)
        body2 = mark(arch, drop, shine, (W2 - 200 * mk2) / 2, 70, mk2) + (
            f'<g transform="translate(0,{70 + 200 * mk2 - 26:.2f})">{ctext}</g>'
        )
        files.append((f"logo-stacked-{key}.svg", svg(W2, H2, body2, bg)))

    # app / social avatar: indigo rounded square
    icon = (
        f'<rect width="1024" height="1024" rx="224" fill="{INDIGO}"/>'
        + mark(WHITE, CRIMSON, WHITE, 152, 132, 3.6)
    )
    files.append(("app-icon.svg", svg(1024, 1024, icon)))
    # circle avatar (Facebook / Instagram / WhatsApp crop to a circle)
    avatar = (
        f'<rect width="1024" height="1024" fill="{INDIGO}"/>'
        + mark(WHITE, CRIMSON, WHITE, 192, 166, 3.2)
    )
    files.append(("avatar.svg", svg(1024, 1024, avatar)))

    # tagline lockup used at the end of videos and on print
    tw = CAIRO_B.width(TAG_AR, 56, rtl=True)
    files.append(
        (
            "tagline.svg",
            svg(
                int(tw + 80),
                110,
                f'<path fill="{INDIGO}" d="{CAIRO_B.path(TAG_AR, 56, 40, 72, rtl=True)}"/>',
            ),
        )
    )

    for name, content in files:
        (OUT / name).write_text(content)
    print(f"wrote {len(files)} SVGs to {OUT}")


if __name__ == "__main__":
    build()
