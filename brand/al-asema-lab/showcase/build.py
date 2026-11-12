"""Two showcase boards (8 posts each) for the «إبداع بيتحرك» portfolio page.

    python3 brand/al-asema-lab/showcase/build.py && node brand/al-asema-lab/showcase/shoot.mjs

Board 1: a tilted 3D wall of posts. Board 2: a fan of cards with one hero post in front.
LOGO: drop logo.png here and it replaces the text wordmark.
"""
from pathlib import Path

HERE = Path(__file__).parent
LOGO = HERE / "logo.png"

BASE = """<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Cairo;src:url(Cairo-ExtraBold.ttf);font-weight:800}
@font-face{font-family:Cairo;src:url(Cairo-Bold.ttf);font-weight:700}
@font-face{font-family:Cairo;src:url(Cairo-SemiBold.ttf);font-weight:600}
@font-face{font-family:Mont;src:url(Montserrat-Bold.ttf);font-weight:700}
@font-face{font-family:Mont;src:url(Montserrat-SemiBold.ttf);font-weight:600}
:root{--bg:#0d0e12;--ink:#f4f1ea;--mute:#8d8f99;--red:#E0262B;--gold:#F2A11F;--blue:#33389A}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1350px;overflow:hidden;background:var(--bg)}
body{position:relative;font-family:Cairo;color:var(--ink)}
.glow{position:absolute;inset:0;background:
 radial-gradient(700px 520px at 50% 58%,rgba(51,56,154,.38),transparent 70%),
 radial-gradient(420px 320px at 85% 90%,rgba(224,38,43,.22),transparent 70%),
 radial-gradient(380px 300px at 10% 15%,rgba(242,161,31,.12),transparent 70%)}
.dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.07) 1.2px,transparent 1.3px);background-size:28px 28px;
 -webkit-mask-image:radial-gradient(circle at 50% 55%,#000 30%,transparent 75%)}
.grain{position:absolute;inset:0;opacity:.07;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>")}
.card{position:absolute;border-radius:14px;overflow:hidden;background:#fff;
 box-shadow:0 2px 0 rgba(255,255,255,.08) inset,0 30px 60px -10px rgba(0,0,0,.65),0 12px 24px rgba(0,0,0,.35)}
.card img{display:block;width:100%;height:100%;object-fit:cover}
.head{position:absolute;left:64px;right:64px;top:58px;display:flex;justify-content:space-between;align-items:flex-start;direction:rtl}
.mark{display:flex;align-items:center;gap:12px;font-weight:800;font-size:30px;letter-spacing:0}
.mark i{width:16px;height:16px;border-radius:50%;background:var(--gold);box-shadow:22px 0 0 var(--red),44px 0 0 var(--blue)}
.mark img{height:64px}
.idx{font-family:Mont;font-weight:600;font-size:18px;color:var(--mute);letter-spacing:.3em;direction:ltr;padding-top:10px}
.title{position:absolute;right:64px;left:64px;direction:rtl}
.kicker{font-family:Mont;font-weight:600;font-size:17px;letter-spacing:.35em;color:var(--gold);direction:ltr;text-align:right}
.h1{font-weight:800;font-size:64px;line-height:1.15;margin-top:4px}
.h1 b{color:var(--red);font-weight:800}
.sub{font-weight:600;font-size:24px;color:var(--mute);margin-top:4px}
.foot{position:absolute;left:64px;right:64px;bottom:50px;display:flex;justify-content:space-between;align-items:center;direction:rtl;font-weight:600;font-size:20px;color:var(--mute)}
.foot .tags{display:flex;gap:10px}
.foot .tags span{border:1px solid rgba(255,255,255,.16);border-radius:40px;padding:4px 18px;color:var(--ink)}
.foot .en{font-family:Mont;font-size:15px;letter-spacing:.3em;direction:ltr}
</style></head><body><div class="glow"></div><div class="dots"></div>
"""


def mark():
    return '<img src="logo.png">' if LOGO.exists() else "<i></i><span style='margin-right:44px'>إبداع بيتحرك</span>"


def head(n):
    return f'<div class="head"><div class="mark">{mark()}</div><div class="idx">0{n} / 02</div></div>'


def foot():
    return ('<div class="foot"><div class="tags"><span>سوشيال ميديا</span><span>باقات التحاليل</span></div>'
            '<div class="en">SOCIAL MEDIA DESIGN</div></div><div class="grain"></div></body></html>')


def wall():
    # 4 columns x 2 rows, every column pushed up or down so the grid reads as a moving wall, then tilted in 3D
    W, H, G = 232, 290, 26
    offs = [40, -90, 70, -40]
    cards = []
    for c in range(4):
        for r in range(2):
            k = c * 2 + r + 1
            x = (3 - c) * (W + G)          # first post on the right, as Arabic reads
            y = r * (H + G) + offs[c]
            cards.append(f'<div class="card" style="left:{x}px;top:{y}px;width:{W}px;height:{H}px"><img src="posts/p{k:02d}.png"></div>')
    stage = (f'<div style="position:absolute;left:50%;top:770px;width:0;height:0;perspective:2400px">'
             f'<div style="position:absolute;left:{-(4 * W + 3 * G) / 2}px;top:{-(2 * H + G) / 2}px;width:{4 * W + 3 * G}px;height:{2 * H + G}px;'
             f'transform:rotateX(24deg) rotateY(-8deg) rotateZ(-9deg) translateX(-18px) scale(0.93);transform-style:preserve-3d">{"".join(cards)}</div></div>')
    title = ('<div class="title" style="top:150px"><div class="kicker">AL ASEMA LAB — VOL.1</div>'
             '<div class="h1">معمل العاصمة <b>للتحاليل الطبية</b></div>'
             '<div class="sub">٨ بوستات لباقات التحاليل.. كل باقة ليها فكرة وصورة</div></div>')
    return BASE + head(1) + title + stage + foot()


def fan():
    # seven cards fanned from a pivot below the frame, one hero post standing in front
    behind = [9, 10, 12, 13, 14, 15, 16]
    hero = 11
    W, H = 262, 328
    R = 400
    angles = [-36, -24, -12, 0, 12, 24, 36]
    cards = []
    for a, k in zip(angles, behind):
        lift = 40 if a == 0 else 0
        cards.append(f'<div class="card" style="left:{-W / 2}px;top:{-H - R - lift}px;width:{W}px;height:{H}px;'
                     f'transform-origin:50% {H + R + lift}px;transform:rotate({a}deg)"><img src="posts/p{k:02d}.png"></div>')
    fanw = f'<div style="position:absolute;left:540px;top:1210px">{"".join(cards)}</div>'
    hw, hh = 352, 440
    herow = (f'<div class="card" style="left:{540 - hw / 2}px;top:800px;width:{hw}px;height:{hh}px;border-radius:18px;'
             f'box-shadow:0 0 0 6px rgba(255,255,255,.95),0 50px 90px -10px rgba(0,0,0,.8),0 0 120px rgba(224,38,43,.35)">'
             f'<img src="posts/p{hero:02d}.png"></div>')
    title = ('<div class="title" style="top:150px;text-align:center"><div class="kicker" style="text-align:center">AL ASEMA LAB — VOL.2</div>'
             '<div class="h1">كل تحليل <b>ليه حكاية</b></div>'
             '<div class="sub">٨ بوستات تانيين لمعمل العاصمة للتحاليل الطبية</div></div>')
    return BASE + head(2) + title + fanw + herow + foot()


(HERE / "board1.html").write_text(wall())
(HERE / "board2.html").write_text(fan())
print("wrote board1.html board2.html")
