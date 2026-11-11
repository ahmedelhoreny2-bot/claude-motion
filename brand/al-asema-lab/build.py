"""Build every Al Asema Lab logo file from code.

    python3 brand/al-asema-lab/build.py          # SVGs (text outlined to paths)
    node brand/al-asema-lab/render-png.mjs       # PNG exports from those SVGs

Needs: pip install fonttools uharfbuzz
Text is shaped with HarfBuzz and converted to outlines, so the SVGs need no fonts
installed and open the same in Illustrator, Figma, Canva or a browser.
"""
import json
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).parent
OUT = ROOT / "logo" / "svg"
PAL = json.loads((ROOT / "palette.json").read_text())
COL = {c["id"]: c["hex"] for c in PAL["core"]}

RED, BURGUNDY, ORANGE = COL["red"], COL["burgundy"], COL["orange"]
BLUE, BLACK, WHITE = COL["blue"], COL["black"], "#FFFFFF"


# ---------------------------------------------------------------- the mark
# The lab's existing logo, redrawn as clean vectors in its printed colours: a blue
# microscope whose arm sweeps into a swoosh, a red stripe under it, red sample bubbles.
# Native grid: MARK_W x MARK_H; mark() places it at (tx, ty) scaled by s.
MARK_W, MARK_H = 524, 530
BUBBLES = [(48, 198, 25), (56, 250, 7), (100, 248, 14), (85, 292, 9), (118, 282, 6), (116, 325, 9)]
TUBE = (
    '<rect x="-46" y="-180" width="92" height="24" rx="9"/>'
    '<rect x="-25" y="-160" width="50" height="40" rx="4"/>'
    '<rect x="-36" y="-124" width="72" height="196" rx="8"/>'
    '<path d="M-30,68 L30,68 L22,108 Q0,118 -22,108 Z"/>'
    '<path fill-rule="evenodd" d="M58,-20 m-52,0 a52,52 0 1,0 104,0 a52,52 0 1,0 -104,0 Z '
    'M58,-20 m-28,0 a28,28 0 1,1 56,0 a28,28 0 1,1 -56,0 Z"/>'
)
ARM = (
    "M330,140 C420,160 474,240 470,330 C466,410 420,452 352,452 "
    "C250,454 110,446 4,442 C110,398 220,382 338,404 C392,410 432,372 434,322 "
    "C436,262 398,214 330,190 Z"
)
STRIPE = "M18,458 C160,456 340,466 520,490 L514,518 C350,490 180,470 18,458 Z"


def mark(k, r, tx=0, ty=0, s=1.0):
    """k = microscope + swoosh colour (blue), r = stripe + bubbles colour (red)."""
    bub = "".join(f'<circle cx="{x}" cy="{y}" r="{rr}"/>' for x, y, rr in BUBBLES)
    return (
        f'<g transform="translate({tx:.2f},{ty:.2f}) scale({s:.4f}) translate(-2,14)">'
        f'<path fill="{k}" d="{ARM}"/>'
        f'<g transform="translate(229,174) rotate(15)" fill="{k}">{TUBE}</g>'
        f'<g fill="{r}"><path d="{STRIPE}"/>{bub}</g></g>'
    )


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


# ---------------------------------------------------------------- variants
# key: (microscope, red parts, text colours (name, sub, EN first word, EN rest), background)
SCHEMES = {
    "color": (BLUE, RED, (RED, BLUE, RED, BLUE), None),
    "on-blue": (WHITE, ORANGE, (WHITE, "#D9DAF2", ORANGE, WHITE), BLUE),
    "on-burgundy": (WHITE, ORANGE, (WHITE, "#F5D9DE", ORANGE, WHITE), BURGUNDY),
    "mono-black": (BLACK, BLACK, (BLACK, BLACK, BLACK, BLACK), None),
    "mono-white": (WHITE, WHITE, (WHITE, WHITE, WHITE, WHITE), None),
}
EN_A, EN_B = "A", "L ASEMA LAB"
TRACK = 0.32


def en_line(colors, x, baseline, size):
    wa = MONT.width(EN_A, size, tracking=TRACK) + TRACK * size
    return (
        f'<path fill="{colors[2]}" d="{MONT.path(EN_A, size, x, baseline, tracking=TRACK)}"/>'
        f'<path fill="{colors[3]}" d="{MONT.path(EN_B, size, x + wa, baseline, tracking=TRACK)}"/>'
    )


def en_width(size):
    return MONT.width(EN_A + EN_B, size, tracking=TRACK)


def lines(colors, anchor, top, align):
    """Arabic name, subline, English line. align='right' (anchor = right edge) or 'center'."""
    name_sz, sub_sz, en_sz = 100, 50, 26
    w1 = CAIRO_XB.width(NAME_AR, name_sz, rtl=True)
    w2 = CAIRO_B.width(SUB_AR, sub_sz, rtl=True)
    w3 = en_width(en_sz)
    b1, b2 = top + 108, top + 180
    b3 = b2 + 56
    x = (lambda w: anchor - w) if align == "right" else (lambda w: anchor - w / 2)
    body = (
        f'<path fill="{colors[0]}" d="{CAIRO_XB.path(NAME_AR, name_sz, x(w1), b1, rtl=True)}"/>'
        f'<path fill="{colors[1]}" d="{CAIRO_B.path(SUB_AR, sub_sz, x(w2), b2, rtl=True)}"/>'
        + en_line(colors, x(w3), b3, en_sz)
    )
    return body, max(w1, w2, w3), b3 - top + 8


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.svg"):
        old.unlink()
    files = []

    for key, (k, r, tcol, bg) in SCHEMES.items():
        # mark only, square, ~9% padding
        S = 1024
        s = 0.82 * S / MARK_W
        files.append((f"mark-{key}.svg", svg(S, S, mark(k, r, (S - MARK_W * s) / 2, (S - MARK_H * s) / 2, s), bg)))

        # horizontal (RTL): mark on the right, text to its left
        pad, gap, ms = 64, 48, 0.62
        txt, tw, th = lines(tcol, 0, 0, "right")
        mw, mh = MARK_W * ms, MARK_H * ms
        W = int(pad + tw + gap + mw + pad)
        H = int(pad * 2 + max(th, mh))
        body = (
            f'<g transform="translate({pad + tw:.2f},{(H - th) / 2 - 4:.2f})">{txt}</g>'
            + mark(k, r, W - pad - mw, (H - mh) / 2, ms)
        )
        files.append((f"logo-horizontal-{key}.svg", svg(W, H, body, bg)))

        # stacked: mark above (like the original), centred text
        W2, ms2 = 900, 0.9
        mw2, mh2 = MARK_W * ms2, MARK_H * ms2
        ctext, _, ch = lines(tcol, W2 / 2, 0, "center")
        H2 = int(70 + mh2 + 10 + ch + 70)
        body2 = mark(k, r, (W2 - mw2) / 2, 70, ms2) + (
            f'<g transform="translate(0,{70 + mh2 + 10:.2f})">{ctext}</g>'
        )
        files.append((f"logo-stacked-{key}.svg", svg(W2, H2, body2, bg)))

    # app icon: white rounded square, colour mark. avatar: white, colour mark (crops to a circle)
    s = 640 / MARK_W
    files.append(("app-icon.svg", svg(1024, 1024,
        f'<rect width="1024" height="1024" rx="224" fill="{WHITE}"/>'
        + mark(BLUE, RED, (1024 - MARK_W * s) / 2, (1024 - MARK_H * s) / 2, s))))
    files.append(("avatar.svg", svg(1024, 1024,
        mark(BLUE, RED, (1024 - MARK_W * s) / 2, (1024 - MARK_H * s) / 2, s), WHITE)))

    tw = CAIRO_B.width(TAG_AR, 56, rtl=True)
    files.append(("tagline.svg", svg(int(tw + 80), 110,
        f'<rect width="{int(tw + 80)}" height="110" rx="55" fill="{BURGUNDY}"/><path fill="{WHITE}" d="{CAIRO_B.path(TAG_AR, 56, 40, 72, rtl=True)}"/>')))

    for name, content in files:
        (OUT / name).write_text(content)
    print(f"wrote {len(files)} SVGs to {OUT}")


if __name__ == "__main__":
    build()
