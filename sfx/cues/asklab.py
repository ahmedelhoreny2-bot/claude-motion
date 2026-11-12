"""Sound design for AskLab (video 3). Every time comes from src/asema3/timeline.json; the voice is mixed on top
by brand/al-asema-lab/video/vo3/mix.py and ducks this bed.

No ambience beds (no room tone, murmur or machine whir: they read as hiss under the voice). A bedside clock
in the dark room for scenes 1-3, then foley that follows the footage and the graphics.
"""

from sfx.cues.asema import POP, land, panned, thock, xpan
from sfx.synth import (beep, chime, click, crinkle, drip, hum, notify, pipette, pop, rustle,
                       scratch, servo, tick, whoosh)

TIMELINE = "src/asema3/timeline.json"
OUT = "public/asema3/sfx.wav"
TARGET_LUFS = -14.0

STICK = (8, 200, 0.7)
STAMP = (12, 260, 0.6)
TAG = (6, 120, 1.0)


def score(mix, tl):
    sc, b = tl["scenes"], tl["beats"]
    dur, end = tl["duration"], tl["endCard"]
    put = mix.put
    lab = sc[3]["enter"]

    # ---- ambience
    t = 0.35
    while t < lab - 0.2:                       # bedside clock in the dark room
        put(t, tick(), 0.035, 0.5)
        t += 1.0

    # ---- 1-3: night, the search bar
    put(0.45, whoosh(0.5, 2400, 900, peak=0.3), 0.04)
    a, z = b["typeA"]
    mix.typing(a, z, len("ليه بتعب على طول؟"), gain=(0.05, 0.08))
    put(z + 0.12, notify(1046.5, 1318.5), 0.04, 0.2)
    for i, c in enumerate(b["chips"]):                      # every worry arrives as a notification
        put(land(c, POP), notify(1318.5 + 80 * i, 1567.98 + 80 * i), 0.055, (-0.6, 0.6, -0.5, 0.5, -0.3, 0.3)[i])
    put(sc[1]["enter"], whoosh(0.25, 3000, 900, peak=0.2), 0.05)
    put(sc[2]["enter"], whoosh(0.25, 3000, 900, peak=0.2), 0.05)
    put(sc[2]["enter"] + 1.15, thock(520), 0.1, 0.3)        # phone placed face-down on wood
    e0, e1 = b["erase"]
    k, n = e0, len("ليه بتعب على طول؟")
    while k < e1:                                           # backspace run
        put(k, click(2600, 0.02), 0.035)
        k += (e1 - e0) / n
    c0, c1 = b["typeB"]
    mix.typing(c0, c1, len("معمل العاصمة"), gain=(0.05, 0.08))
    put(b["enter"], click(1500, 0.04), 0.1)
    put(b["enter"] + 0.02, beep(1567.98, 0.16), 0.05)

    # ---- 4: swoosh into the lab, doors slide, pin, the team listens
    put(lab - 0.4, whoosh(0.8, 400, 3400, peak=0.5), 0.14)
    put(lab + 0.1, whoosh(1.2, 1600, 600, peak=0.4), 0.05, -0.4)     # sliding door
    put(lab + 0.1, whoosh(1.2, 1600, 600, peak=0.4), 0.05, 0.4)
    put(lab + 0.55, click(2200), 0.04, 0.5)                          # logo tab lands
    put(land(b["pin"], POP), pop(1100, 560), 0.09)
    put(land(b["listen"], POP), pop(1250, 640), 0.08)

    # ---- 5: iris, the sterile pouch peels open, stamp
    put(sc[4]["enter"] - 0.05, whoosh(0.55, 300, 4200, peak=0.55), 0.09)
    put(sc[4]["enter"] + 0.1, crinkle(2.2), 0.09)
    put(land(sc[4]["enter"] + 0.4, POP), pop(1000, 500), 0.07)
    ts = land(b["stamp"], STAMP)
    put(b["stamp"], whoosh(ts - b["stamp"], 2600, 600, peak=0.9), 0.06)
    put(ts, thock(460), 0.2)

    # ---- 6: whip pan into the analyzer, servo, laser read
    mix.put_stereo(sc[5]["enter"] - 0.05, *panned(whoosh(0.45, 800, 4800, peak=0.5), -0.8, 0.6), 0.12)
    put(sc[5]["enter"] + 0.2, hum(sc[5]["exit"] - sc[5]["enter"], f0=98, rise=1.0), 0.02)
    put(sc[5]["enter"] + 0.6, servo(0.9, 700, 1300), 0.04, 0.2)
    put(sc[5]["enter"] + 1.6, servo(0.5, 1300, 900), 0.035, 0.2)
    put(b["scan"], beep(1567.98, 0.1), 0.05)
    put(b["scan"], whoosh(1.2, 5200, 3000, peak=0.5), 0.03)
    for i in range(4):
        put(b["scan"] + 1.25 + i * 0.09, click(2800 + 200 * i, 0.02), 0.03)

    # ---- 7: each test snaps in on its word: glass clink + label pop, rising
    notes = (1567.98, 1760.0, 1975.53, 2093.0, 2349.32)
    for i, sn in enumerate(tl["snaps"]):
        put(sn["t"], [x + y for x, y in zip(beep(notes[i], 0.16), click(4200, 0.03) + [0.0] * 8000)], 0.07)
        put(land(sn["t"], POP), pop(1000 + 120 * i, 520 + 60 * i), 0.06, xpan((396, 534, 675, 816, 540)[i]))
    put(tl["snaps"][-1]["t"] + 0.9, chime([1046.5, 1318.5, 1567.98], dur=1.4, tau=0.5), 0.04)

    # ---- 8: swoosh, envelope and paper, price tag swings in, discount badge slaps
    put(sc[7]["enter"] - 0.4, whoosh(0.8, 400, 3400, peak=0.5), 0.12)
    put(sc[7]["enter"] + 0.1, rustle(0.9), 0.06)
    put(sc[7]["enter"] + 1.2, rustle(0.6, seed=19), 0.05)
    tt = land(b["tag"], TAG)
    put(b["tag"], whoosh(tt - b["tag"], 2600, 700, peak=0.8), 0.06, 0.6)
    put(tt, scratch(0.1), 0.04, 0.6)
    tb = land(b["badge"], STICK)
    put(b["badge"], whoosh(tb - b["badge"], 900, 3000, peak=0.9), 0.05, -0.5)
    put(tb, pop(700, 260, 0.2), 0.14, -0.5)
    put(tb, pipette(), 0.05, -0.5)

    # ---- 9: iris into the end card: the search resolves, the logo builds, pin drops, button
    put(end - 0.05, whoosh(0.55, 300, 4200, peak=0.55), 0.1)
    mix.typing(end + 0.15, end + 0.7, len("معمل العاصمة"), gain=(0.04, 0.07))
    put(end + 0.8, click(1500, 0.04), 0.08)
    put(land(end + 0.9, (17, 180, 0.9)), thock(800), 0.07)
    put(end + 1.1, whoosh(0.5, 1200, 4400, peak=0.3), 0.05, -0.3)
    put(end + 1.2, scratch(0.6), 0.03)
    put(land(end + 1.3, (11, 180, 0.8)), drip(), 0.06)
    put(land(end + 1.5, (17, 180, 0.9)), thock(900), 0.08)
    for i in range(6):
        put(land(end + 1.7 + i * 0.06, POP), pop(1300 + 140 * i, 700 + 90 * i), 0.04, -0.4 + i * 0.12)
    put(land(end + 1.7, POP), pop(1000, 420), 0.1)
    put(end + 1.9, chime([1046.5, 1318.5, 1567.98, 2093.0], dur=2.2, tau=0.8), 0.06)
