"""Write guide.html: the brand guide with every logo inlined, so it is one portable file.

    python3 brand/al-asema-lab/make_guide.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent
SVG = ROOT / "logo" / "svg"
pal = json.loads((ROOT / "palette.json").read_text())


def inline(name, cls=""):
    s = (SVG / f"{name}.svg").read_text().strip()
    s = re.sub(r' width="[\d.]+" height="[\d.]+"', "", s, count=1)
    return s.replace("<svg ", f'<svg class="{cls}" role="img" aria-label="{name}" ', 1)


def swatch(c):
    dark = c["id"] in ("indigo", "crimson", "ink", "teal")
    fg = "#fff" if dark else "#0D1030"
    border = "" if dark else "border:1px solid var(--line);"
    rgb = ", ".join(map(str, c["rgb"]))
    cmyk = " ".join(map(str, c["cmyk"]))
    share = f'<span class="pct">{c["share"]}%</span>' if c["share"] else ""
    return f"""<div class="sw" style="background:{c['hex']};color:{fg};{border}">
  {share}<b>{c['name_ar']}</b><i>{c['name_en']}</i>
  <code>{c['hex']}</code><small>RGB {rgb}<br>CMYK {cmyk}</small></div>"""


def scale_row(cid, label):
    cells = "".join(
        f'<div style="background:{h};color:{"#fff" if k in ("500","700","900") or (k=="400" and cid!="teal") else "#0D1030"}"><span>{k}</span><code>{h}</code></div>'
        for k, h in pal["scales"][cid].items()
    )
    return f'<div class="scale"><h4>{label}</h4><div class="cells">{cells}</div></div>'


ratio = "".join(
    f'<div style="flex:{c["share"]};background:{c["hex"]}" title="{c["name_en"]}"></div>'
    for c in pal["core"] if c["share"]
)
contrast = "".join(
    f'<div class="cp" style="background:{p["bg"]};color:{p["fg"]}"><b>Aa أب</b>'
    f'<span>{p["ratio"]}:1 {"✓" if p["ratio"] >= 4.5 else "كبير فقط"}</span></div>'
    for p in pal["contrast"]
)

html = (ROOT / "guide.src.html").read_text()
html = html.replace("{{swatches}}", "".join(swatch(c) for c in pal["core"]))
html = html.replace(
    "{{scales}}",
    scale_row("indigo", "أزرق العاصمة")
    + scale_row("crimson", "أحمر العيّنة")
    + scale_row("teal", "أخضر النتيجة"),
)
html = html.replace("{{ratio}}", ratio).replace("{{contrast}}", contrast)
html = re.sub(r"\{\{svg:([\w-]+)(?:\|([\w-]+))?\}\}", lambda m: inline(m[1], m[2] or ""), html)
(ROOT / "guide.html").write_text(html)
print("wrote", ROOT / "guide.html")
