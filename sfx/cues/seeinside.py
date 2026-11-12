"""Sound design for SeeInside (video 4, paper collage). Paper foley on every move: tears between scenes, slaps
for cut-outs, tape for labels, marker squeaks for drawings, hard knocks for kinetic words. No music.
Times from src/asema4/timeline.json; the voice is added by brand/al-asema-lab/video/vo4/mix.py.
"""

from sfx.cues.asema import land, thock
from sfx.synth import beep, chime, click, crinkle, pop, roomtone, rustle, scratch, whoosh

TIMELINE = "src/asema4/timeline.json"
OUT = "public/asema4/sfx.wav"
TARGET_LUFS = -14.0
SLAP = (13, 320, 0.6)
SLAM = (12, 380, 0.6)


def score(mix, tl):
    b, sc, dur = tl["b"], tl["scenes"], tl["duration"]
    put = mix.put
    put(0, roomtone(dur), 0.03)

    def slap(t, pitch=700, pan=0.0, g=1.0):
        put(t, rustle(0.22, seed=int(t * 10)), 0.07 * g, pan)
        put(land(t, SLAP), thock(pitch), 0.09 * g, pan)

    def slam(t, pitch=1100):
        put(t - 0.03, whoosh(0.14, 5200, 1400, peak=0.9), 0.08)
        put(land(t, SLAM), thock(pitch), 0.16)

    def tape(t, pan=0.0):
        put(t + 0.08, crinkle(0.18, seed=int(t * 7)), 0.06, pan)

    def marker(t, d=0.4, pan=0.0):
        put(t, scratch(d), 0.08, pan)

    def highlight(t, pan=0.0):
        put(t, whoosh(0.35, 3200, 5200, peak=0.5), 0.05, pan)

    for i, t in enumerate(sc[1:]):                       # torn-paper wipes
        put(t - 0.15, crinkle(0.45, seed=40 + i), 0.12, 0.4)
        put(t - 0.15, whoosh(0.4, 900, 3200, peak=0.6), 0.06, 0.6)

    # hook
    slam(b["stop"] + 0.02, 900)
    slap(b["scroll"], 800)
    marker(b["scroll"] + 0.2, 0.18); marker(b["scroll"] + 0.32, 0.18)
    put(b["body"] - 0.05, whoosh(0.35, 400, 2400, peak=0.6), 0.08)
    slap(b["body"] + 0.1, 600)
    marker(b["circle"], 0.45)
    slap(b["blind"], 900, 0.2); tape(b["blind"], 0.2); highlight(b["blind"] + 0.2); marker(b["blind"] + 0.15, 0.2, 0.5)
    # iron
    for i in range(4):
        slap(sc[1] + 0.05 + i * 0.06, 520 + 60 * i, -0.4 + 0.2 * i, 0.6)
    slap(b["drop"], 620, -0.4); marker(b["drop"] + 0.4, 0.3, -0.5)
    slap(b["fe"], 800, 0.5); tape(b["fe"], 0.5); slap(b["fe"] + 0.25, 700, 0.5)
    marker(b["low"], 0.4, 0.3); slap(b["low"], 850, 0.3); highlight(b["low"] + 0.15, 0.3)
    # sugar
    slap(b["glass"], 600, -0.4)
    slap(b["sugar"], 950, -0.2)
    slap(b["gauge"] - 0.15, 800, 0.5)
    for i in range(6):
        put(b["gauge"] + 0.15 * i, click(2400 + 150 * i, 0.02), 0.04, 0.5)
    marker(b["high"] - 0.2, 0.5, 0.3); slap(b["high"], 850, 0.3); highlight(b["high"] + 0.15, 0.3)
    # gland
    slap(b["sleep"], 650)
    for i in range(3):
        put(land(b["sleep"] + 0.3 + i * 0.25, SLAM), pop(700 + 120 * i, 400), 0.07, 0.5)
    slap(b["heavy"], 900, -0.4); tape(b["heavy"], -0.4)
    marker(b["gland"], 0.45); slap(b["gland"], 850); highlight(b["gland"] + 0.1)
    # kinetic
    slam(b["k1"], 1000); slam(b["k2"], 1200)
    put(b["k3"] - 0.1, crinkle(0.35, seed=77), 0.1)
    slam(b["k3"], 1000); slam(b["k4"], 1300)
    put(b["k4"] + 0.05, whoosh(0.4, 1200, 3600, peak=0.5), 0.06, 0.4)
    # lab
    slap(b["logo"], 750); tape(b["logo"], -0.3); tape(b["logo"] + 0.05, 0.3)
    slap(b["machines"], 650, -0.5); tape(b["machines"], -0.5)
    slap(b["rack"], 800, 0.5)
    put(land(b["rack"], SLAP) + 0.02, beep(2349.3, 0.08), 0.03, 0.5)
    slap(b["sheet"], 600, 0.2)
    slap(b["sheet"] + 0.2, 850, -0.4); highlight(b["sheet"] + 0.35, -0.4)
    for i in range(4):
        marker(b["marks"] - 0.4 + i * 0.15, 0.12, 0.3)
    marker(b["marks"], 0.4, 0.1)
    # life
    slap(b["check"], 700, 0.5); slap(b["check"] + 0.25, 650, -0.5)
    marker(b["check"] + 0.1, 0.4, -0.5)
    slap(b["fast"], 850, -0.5)
    for i in range(8):
        put(b["fast"] + 0.1 * i, click(3000, 0.012), 0.04, -0.5)
    slap(b["life"], 850); tape(b["life"]); highlight(b["life"] + 0.2)
    # end
    for i in range(5):
        slap(b["end"] - 0.1 + i * 0.07, 600 + 70 * i, (-0.6, 0.6, -0.6, 0.6, 0.6)[i], 0.6)
    slap(b["end"] + 0.05, 700); tape(b["end"] + 0.05, -0.4); tape(b["end"] + 0.1, 0.4)
    put(b["end"] + 0.4, chime([1046.5, 1318.5, 1567.98, 2093.0], dur=2.0, tau=0.7), 0.05)
    slap(b["tag"], 850); highlight(b["tag"] + 0.15)
    slap(b["pin"], 800)
    put(land(b["cta"], SLAP), pop(1000, 420), 0.12)
    slap(b["cta"] + 0.3, 900)
