"""Sound design for LabTour (Al Asema Lab video 2): every sound comes from a motion on screen.
Shares the motion maths with sfx/cues/asema.py (springs simulated with the picture's configs).

    python3 -m sfx sfx/cues/labtour.py      (then brand/al-asema-lab/video/vo2/mix.py adds the voice)
"""

import math
import random

from sfx.cues.asema import EASE_OUT, HEAVY, POP, land, panned, thock, tick, xpan
from sfx.synth import (beep, bubbles, chime, click, drip, hum, pipette, pop, scratch, servo,
                       whoosh)

TIMELINE = "src/asema2/timeline.json"
OUT = "public/asema/sfx2.wav"
TARGET_LUFS = -14.0

PIN = (11, 180, 0.8)
STICK = (8, 200, 0.7)
STAMP = (12, 260, 0.6)
TUBE = (13, 210, 0.8)
TAG = (6, 120, 1.0)


def glint(f=2637.0):
    """Sparkle / glass: a tiny high ping."""
    return beep(f, 0.09)


def clink(f=2349.0):
    """Glass tube dropping into a rack."""
    return [a + b for a, b in zip(beep(f, 0.16), click(4200, 0.03) + [0.0] * 8000)]


def squish():
    """The drop character landing: a soft liquid plop."""
    return [a * 0.8 + b for a, b in zip(drip(), pop(520, 220, 0.12) + [0.0] * 6000)]


def score(mix, tl):
    s1, s2, s3, s4, s5, s6, s7, s8, s9 = (tl[k] for k in ("s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"))
    dur = tl["duration"]
    put = mix.put
    rng = random.Random(4)


    # ---- the mascot: a liquid plop on every hop landing, whoosh on each leap, panned where it lands
    keys = tl["mascot"]
    for a, b in zip(keys, keys[1:]):
        if a[1] == b[1] and a[2] == b[2]:
            continue
        span = b[0] - a[0]
        dist = math.hypot(b[1] - a[1], b[2] - a[2])
        hops = max(1, round(dist / 260))
        for j in range(1, hops + 1):
            tland = a[0] + span * j / hops
            x = a[1] + (b[1] - a[1]) * EASE_OUT(j / hops)
            put(tland - span / hops * 0.8, whoosh(span / hops * 0.75, 700, 2200, peak=0.5), 0.04, xpan(x))
            put(tland, squish(), 0.13, xpan(x))

    # ---- iris wipes, opening from the mascot
    for key, x in (("s2", 540), ("s3", 190), ("s4", 400), ("s5", 640), ("s6", 870), ("s7", 110), ("s8", 880), ("s9", 260)):
        e = tl[key]["enter"]
        mix.put_stereo(e - 0.05, *panned(whoosh(0.55, 300, 4200, peak=0.55), xpan(x), 0.0), 0.13)

    # ---- logo tab drops in
    put(0.3, whoosh(0.6, 2400, 900, peak=0.3), 0.04, 0.6)
    put(0.85, click(2200), 0.05, 0.6)

    # 1 ---- lost: the pole rises, three road signs flick out, question marks pop round the head
    put(land(s1["signs"][0] - 0.2, HEAVY), thock(520), 0.12)
    for i, st in enumerate(s1["signs"]):
        side = (0.5, -0.5, 0.5)[i]
        put(st, whoosh(0.18, 1800, 4200, peak=0.6), 0.06, side)
        put(land(st, POP), thock(760 + i * 90), 0.13, side)
    for i in range(3):
        put(land(s1["q"] + i * 0.12, POP), pop(900 + i * 200, 1500 + i * 200, 0.12), 0.09, (-0.6, 0.6, 0)[i])
    put(s1["look"], whoosh(0.2, 2000, 4000, peak=0.5), 0.04, -0.6)
    put(s1["look"] + 0.5, whoosh(0.2, 2000, 4000, peak=0.5), 0.04, 0.6)

    # 2 ---- the map: pin falls and plants, the area chip pops; the map drops away and the lab rises
    tp = land(s2["pin"], PIN)
    put(s2["pin"], whoosh(tp - s2["pin"], 3600, 700, peak=0.85), 0.1)
    put(tp, thock(700), 0.15)
    put(tp + 0.02, pop(700, 1200, 0.12), 0.08)
    put(land(s2["chip"], POP), pop(1100, 560), 0.12)
    put(s2["build"] - 0.1, whoosh(0.5, 2400, 400, peak=0.4), 0.09)
    put(s2["build"], whoosh(0.8, 300, 2400, peak=0.7), 0.11)
    put(s2["build"] + 0.75, thock(520), 0.12)
    mix.put_stereo(s2["build"] + 0.2, *panned(whoosh(0.9, 400, 3000, peak=0.5), -0.5, 0.6), 0.06)
    put(land(s2["sign"], POP), pop(1200, 600), 0.12)
    put(land(s2["sign"], POP), beep(1568.0, 0.16), 0.06)

    # 3 ---- automatic doors part, floor shines, a sign pops
    put(s3["door"], whoosh(0.7, 900, 3400, peak=0.4), 0.1, -0.7)
    put(s3["door"], whoosh(0.7, 900, 3400, peak=0.4), 0.1, 0.7)
    put(s3["door"] + 0.66, click(1500), 0.06)
    for i, st in enumerate(s3["shine"]):
        put(st + 0.25, glint((2349.0, 2637.0, 3136.0)[i]), 0.06, (-0.4, 0.2, 0.6)[i])
    mix.put_stereo(s3["shine"][0], *panned(whoosh(0.8, 3000, 7000, peak=0.5), -0.8, 0.8), 0.05)
    put(land(s3["shine"][1], POP), pop(1100, 520), 0.12, 0.4)

    # 4 ---- the analyzer rises, its belt runs, bars climb on the screen, the laser reads, a check lands
    tm = land(s4["machine"], HEAVY)
    put(s4["machine"], whoosh(tm - s4["machine"], 500, 2200, peak=0.85), 0.1)
    put(tm, thock(560), 0.13)
    put(land(s4["machine"] + 0.2, POP), pop(1000, 500), 0.12)
    put(s4["machine"] + 0.3, hum(s4["check"] + 0.5 - s4["machine"] - 0.3, f0=82, rise=1.0), 0.035)
    t = s4["machine"] + 0.4
    while t < s4["check"] + 0.4:
        put(t, click(900, 0.02), 0.03, -0.3)
        t += 0.75  # one tube passing every 120 px of belt at 160 px/s
    for i in range(5):
        put(s4["screen"] + i * 0.1 + 0.15, beep((1046.5, 1174.66, 1318.5, 1567.98, 1760.0)[i], 0.07), 0.04, 0.4)
    put(s4["scan"], beep(1567.98, 0.1), 0.07, 0.2)
    put(s4["scan"], whoosh(0.8, 5000, 3000, peak=0.5), 0.04, 0.2)
    put(land(s4["scan"], POP), pop(900, 500), 0.08, -0.4)
    tc = land(s4["check"], STICK)
    put(tc, pop(900, 1500, 0.14), 0.14, 0.4)
    put(tc, chime([1318.5, 1567.98, 2093.0], dur=1.2, tau=0.4), 0.06, 0.4)

    # 5 ---- sealed pouches drop in, the stamp slams, a squeegee wipes, sparkles
    for i, st in enumerate(s5["packs"]):
        tl_ = land(st, HEAVY)
        side = (0.5, 0.0, -0.5)[i]
        put(st, whoosh(tl_ - st, 3000, 700, peak=0.85), 0.07, side)
        put(tl_, scratch(0.12), 0.07, side)
        put(tl_, thock(820 - i * 60), 0.08, side)
    put(land(s5["packs"][0] + 0.3, POP), pop(1100, 520), 0.11)
    ts = land(s5["stamp"], STAMP)
    put(s5["stamp"], whoosh(ts - s5["stamp"], 2600, 600, peak=0.9), 0.08)
    put(ts, thock(480), 0.2)
    put(ts, click(700, 0.05), 0.12)
    mix.put_stereo(s5["wipe"], *panned(whoosh(0.7, 3000, 7000, peak=0.5), 0.8, -0.8), 0.1)
    put(s5["wipe"] + 0.05, servo(0.6, 2200, 2600), 0.02)
    for i, st in enumerate(s5["sparkle"]):
        put(st + 0.25, glint((2637.0, 3136.0, 3520.0)[i]), 0.06, (0.6, 0.0, -0.6)[i])

    # 6 ---- one tube per test drops into the rack with a glass clink, its label pops; then the ring
    notes = (1567.98, 1760.0, 1975.53, 2093.0, 2349.32, 2637.0)
    for i, st in enumerate(s6["tubes"]):
        x = 890 - i * 124
        tt = land(st, TUBE)
        put(st, whoosh(tt - st, 3800, 1200, peak=0.9), 0.05, xpan(x))
        put(tt, clink(notes[i]), 0.1, xpan(x))
        put(land(st + 0.05, POP), pop(1000 + i * 120, 520 + i * 60), 0.07, xpan((800, 540, 280)[i % 3]))
    mix.put_stereo(s6["all"], *panned(whoosh(0.9, 400, 3000, peak=0.5), -0.6, 0.6), 0.06)
    ta = land(s6["all"], STICK)
    put(ta, pop(900, 420), 0.15)
    put(ta, chime([1046.5, 1318.5, 1567.98], dur=1.4, tau=0.5), 0.06)

    # 7 ---- the price tag swings in, scissors snip it, the bottom falls, the discount badge slaps on with confetti
    tg = land(s7["tag"], TAG)
    put(s7["tag"], whoosh(tg - s7["tag"], 2600, 700, peak=0.8), 0.09)
    put(tg, scratch(0.1), 0.06)
    put(s7["snip"] - 0.5, click(3200, 0.03), 0.06, -0.4)
    put(s7["snip"] - 0.25, click(3400, 0.03), 0.06, -0.2)
    put(s7["snip"], [a + b for a, b in zip(click(2600, 0.06), scratch(0.06))], 0.16, 0.1)
    put(s7["snip"] + 0.05, whoosh(0.85, 2200, 300, peak=0.3), 0.08, -0.2)
    tb = land(s7["badge"], STICK)
    put(s7["badge"], whoosh(tb - s7["badge"], 900, 3000, peak=0.9), 0.08)
    put(tb, pop(700, 260, 0.2), 0.2)
    put(tb, pipette(), 0.08)
    for i in range(24):
        put(tb + rng.uniform(0.0, 0.6), pop(rng.uniform(1800, 3200), rng.uniform(1200, 2000), 0.04), 0.025, rng.uniform(-0.8, 0.8))

    # 8 ---- three tiles pop on the words
    for i, w in enumerate(s8["w"]):
        tw = land(w - 0.06, POP)
        x = (820, 540, 260)[i]
        put(w - 0.08, whoosh(0.16, 4000, 1600, peak=0.8), 0.07, xpan(x))
        put(tw, thock(1100), 0.14, xpan(x))
        put(tw, beep((1046.5, 1318.5, 1567.98)[i], 0.18), 0.07, xpan(x))

    # 9 ---- the drop bursts into the logo's bubbles, the mark builds, the name, the tagline, the phone rings
    put(s9["burst"], pop(600, 1800, 0.2), 0.14)
    put(s9["burst"], bubbles(0.6, rate=30), 0.06)
    for i in range(6):
        put(s9["burst"] + 0.55 * (0.04 * i + 0.8 * 1.0) * 0.9, pop(1300 + i * 150, 700 + i * 90), 0.07, -0.5 + i * 0.1)
    mix.put_stereo(s9["stripe"], *panned(whoosh(0.5, 1200, 4400, peak=0.3), -0.7, 0.7), 0.09)
    put(s9["arm"], scratch(0.6), 0.05)
    put(s9["arm"], servo(0.6, 700, 1300), 0.025)
    tt = land(s9["tube"], HEAVY)
    put(s9["tube"], whoosh(tt - s9["tube"], 3000, 700, peak=0.85), 0.08)
    put(tt, thock(900), 0.15)
    put(s9["name"], chime([1046.5, 1318.5, 1567.98, 2093.0], dur=2.2, tau=0.7), 0.08)
    for i in range(2):
        put(s9["name"] + i * 0.09, tick(), 0.05)
    put(land(s9["tagline"], POP), pop(1000, 500), 0.12)
    tcta = land(s9["cta"], POP)
    put(tcta, pop(1000, 420), 0.15)
    for k in range(2):
        for j in range(6):
            put(tcta + 0.35 + k * 0.6 + j * 0.035, beep(1318.5 if j % 2 else 1567.98, 0.03), 0.035, 0.3)
    put(s9["contact"], whoosh(0.6, 700, 2400, peak=0.4), 0.05)
