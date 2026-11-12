"""Showcase boards for the «إبداع بيتحرك» portfolio page: four posts per board on a blackboard,
each card floating over an LED strip that spills its color onto the board.

    python3 brand/al-asema-lab/showcase/build.py && node brand/al-asema-lab/showcase/shoot.mjs

LOGO: drop logo.png here and it replaces the text wordmark.
"""
from pathlib import Path

HERE = Path(__file__).parent
LOGO = HERE / "logo.png"

BOARDS = [  # (posts, kicker, title, accent word)
    ([1, 2, 3, 4], "VOL.01", "باقة", "لكل حد"),
    ([5, 6, 7, 8], "VOL.02", "جسمك", "بيتكلم"),
    ([9, 10, 11, 12], "VOL.03", "كل تحليل", "ليه حكاية"),
    ([13, 14, 15, 16], "VOL.04", "التفاصيل", "اللي بتفرق"),
]
LED = ["#ff3b3f", "#5a62ff", "#ffb22e", "#ff3b3f", "#5a62ff", "#ffb22e"]

CSS = """
@font-face{font-family:Cairo;src:url(Cairo-ExtraBold.ttf);font-weight:800}
@font-face{font-family:Cairo;src:url(Cairo-SemiBold.ttf);font-weight:600}
@font-face{font-family:Mont;src:url(Montserrat-SemiBold.ttf);font-weight:600}
:root{--ink:#f2efe8;--mute:#8a8d93;--red:#E0262B;--gold:#F2A11F;--blue:#33389A}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1350px;overflow:hidden;background:#141618}
body{position:relative;font-family:Cairo;color:var(--ink)}
/* blackboard: matte slate, wiped chalk haze, dust grain, a dark vignette */
.board{position:absolute;inset:0;background:
 radial-gradient(520px 260px at 22% 18%,rgba(255,255,255,.045),transparent 70%),
 radial-gradient(640px 300px at 78% 46%,rgba(255,255,255,.035),transparent 70%),
 radial-gradient(500px 240px at 30% 82%,rgba(255,255,255,.03),transparent 70%),
 linear-gradient(170deg,#1b1e20,#121416 60%,#0e1011)}
.dust{position:absolute;inset:0;opacity:.22;mix-blend-mode:screen;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence baseFrequency='.75' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1.6 -0.95'/></filter><rect width='300' height='300' filter='url(%23n)'/></svg>")}
.vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 55%,transparent 45%,rgba(0,0,0,.55))}
.frame{position:absolute;inset:18px;border:2px solid rgba(255,255,255,.06);border-radius:10px}
.head{position:absolute;left:64px;right:64px;top:52px;display:flex;justify-content:space-between;align-items:center;direction:rtl}
.mark{display:flex;align-items:center;gap:12px;font-weight:800;font-size:28px}
.mark i{width:14px;height:14px;border-radius:50%;background:var(--gold);box-shadow:20px 0 0 var(--red),40px 0 0 #5a62ff;margin-left:40px}
.mark img{height:60px}
.title{font-weight:800;font-size:44px;line-height:1}
.title b{color:var(--red)}
.idx{font-family:Mont;font-weight:600;font-size:16px;color:var(--mute);letter-spacing:.32em;direction:ltr}
.slot{position:absolute;width:380px;height:475px}
.card{position:absolute;inset:0;border-radius:12px;overflow:hidden;z-index:2;
 box-shadow:0 0 0 1px rgba(255,255,255,.12),0 24px 40px -12px rgba(0,0,0,.8)}
.card img{display:block;width:100%;height:100%;object-fit:cover}
.card::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,var(--c) -40%,transparent 22%);opacity:.28;mix-blend-mode:screen}
.spill{position:absolute;left:-60px;right:-60px;bottom:-150px;height:300px;z-index:1;
 background:radial-gradient(ellipse 50% 42% at 50% 54%,var(--c),transparent 72%);opacity:.9;filter:blur(10px);mix-blend-mode:screen}
.halo{position:absolute;left:6%;right:6%;top:30%;bottom:-30px;z-index:1;border-radius:40px;background:var(--c);filter:blur(50px);opacity:.6}
.led{position:absolute;left:8%;right:8%;bottom:-26px;height:6px;border-radius:6px;z-index:3;
 background:linear-gradient(90deg,transparent,#fff 12%,#fff 88%,transparent);
 box-shadow:0 0 6px 1px var(--c),0 0 18px 4px var(--c),0 0 46px 10px var(--c)}
.foot{position:absolute;left:64px;right:64px;bottom:44px;display:flex;justify-content:space-between;align-items:center;direction:rtl;font-weight:600;font-size:19px;color:var(--mute)}
.en{font-family:Mont;font-size:14px;letter-spacing:.3em;direction:ltr}
"""


def board(posts, kicker, title, accent, n):
    mark = '<img src="logo.png">' if LOGO.exists() else "<i></i><span>إبداع بيتحرك</span>"
    W, H, GX, GY = 380, 475, 60, 66
    x0 = (1080 - 2 * W - GX) / 2
    slots = []
    for i, k in enumerate(posts):
        col, row = i % 2, i // 2
        x = x0 + (1 - col) * (W + GX)            # first post top right, as Arabic reads
        y = 170 + row * (H + GY) + (0 if col == 0 else 44)   # left column sits lower: a gentle stagger
        c = LED[(i + n) % len(LED)]
        slots.append(f'<div class="slot" style="left:{x}px;top:{y}px;--c:{c}"><div class="spill"></div><div class="halo"></div>'
                     f'<div class="card"><img src="posts/p{k:02d}.png"></div><div class="led"></div></div>')
    return (f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>'
            '<div class="board"></div><div class="dust"></div><div class="vig"></div><div class="frame"></div>'
            f'<div class="head"><div class="mark">{mark}</div><div class="title">{title} <b>{accent}</b></div>'
            f'<div class="idx">{kicker}</div></div>{"".join(slots)}'
            '<div class="foot"><span>معمل العاصمة للتحاليل الطبية · سوشيال ميديا</span><span class="en">SOCIAL MEDIA DESIGN</span></div>'
            '</body></html>')


for n, b in enumerate(BOARDS, 1):
    (HERE / f"board{n}.html").write_text(board(*b, n))
print("wrote", len(BOARDS), "boards")
