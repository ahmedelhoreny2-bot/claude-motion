"""Sound design for the Ibdaa explainer. Every time comes from src/ibdaa2/timeline.json.

    python3 -m sfx sfx/cues/ibdaa2.py
"""

import math

from sfx.synth import blip, chime, click, envelope, impact, pad, pop, riser, scratch, whoosh

from sfx.cues.ibdaa import hat, kick, rip  # noqa: E402  (shared drum voices)

TIMELINE = "src/ibdaa2/timeline.json"
OUT = "public/ibdaa/sfx2.wav"
TARGET_LUFS = -16.0

# D major, brighter than the showreel.
CH = [
    [146.83, 220.0, 293.66, 369.99, 440.0],
    [123.47, 246.94, 293.66, 369.99, 493.88],
    [98.0, 196.0, 293.66, 392.0, 493.88],
    [110.0, 220.0, 277.18, 329.63, 440.0],
]
N = [587.33, 659.25, 739.99, 880.0, 987.77, 1174.66, 1318.51, 1479.98]
BPM = 116
BEAT = 60 / BPM


def score(mix, tl):
    put = mix.put
    dur = tl["duration"]
    h, a, w, p, c, k, o, ct = (tl[x] for x in ("hook", "alive", "word", "paper", "shape", "skin", "offer", "cta"))

    vol = envelope([
        (0, 0.0), (h["peel"], 0.0), (a["start"], 1.0), (o["three"] - 0.3, 1.0), (o["three"], 0.25),
        (o["egp"], 0.25), (o["egp"] + 0.5, 1.1), (dur - 1.5, 1.0), (dur, 0.0),
    ])
    bar = BEAT * 4
    chords = [(a["start"] + i * bar * 2, CH[i % 4]) for i in range(int((dur - a["start"]) / (bar * 2)) + 1)]
    mix.put_stereo(0, *pad(dur, [(0, CH[0])] + chords, volume=vol), gain=0.024)
    i, kk, hh = 0, kick(), hat()
    while True:
        t = a["start"] + i * BEAT
        if t >= dur - 1.5:
            break
        if not (o["three"] - 0.3 <= t < o["egp"] + 0.4):
            put(t, kk, 0.30 * vol(t))
            put(t + BEAT / 2, hh, 0.07 * vol(t), 0.25)
            if i % 4 == 2:
                put(t, hat(True), 0.06 * vol(t), -0.25)
        i += 1

    # hook: a quiet room, the scroll, the rewind, the peel and the flood
    for x in (h["label1"], h["label2"], h["label3"]):
        put(x, whoosh(0.3, 500, 2400, peak=0.45), 0.10)
        put(x + 0.14, blip(N[0] / 2, dur=0.3, tau=0.08), 0.16)
    put(h["scroll"], whoosh(0.4, 900, 4200, peak=0.5, q=0.7), 0.26, 0.2)
    for j in range(7):
        put(h["rewind"] + j * 0.05, click(2600 - j * 200, dur=0.03), 0.12, 0.3 - j * 0.1)
    put(h["rewind"], whoosh(0.5, 4200, 800, peak=0.5), 0.18)
    put(h["peel"], rip(0.35), 0.18)
    for j in range(3):
        put(h["peel"] + 0.15 + j * 0.07, pop(500 - j * 80, 120, dur=0.18), 0.16)
    put(h["flood"] - 0.1, riser(a["start"] - h["flood"] + 0.2, 300, 4000), 0.18)
    put(a["start"], impact(1.2), 0.34)

    # alive
    put(a["w1"] + 0.18, kick(), 0.3)
    put(a["w1"] + 0.18, pop(240, 90, dur=0.2), 0.3)
    put(a["w2"], whoosh(0.35, 3000, 600, peak=0.4), 0.2, -0.6)
    put(a["w3"], pop(1100, 600), 0.22)
    put(a["w3"] + 0.3, scratch(0.6), 0.06)
    put(a["btn"], pop(1500, 800), 0.26)
    put(a["tap"], click(2200), 0.3)
    put(a["tap"] + 0.02, chime([N[0], N[2], N[4]], dur=1.2, tau=0.4), 0.12)
    put(a["diff"], blip(N[3], dur=0.4), 0.14)

    # transitions
    for x in (w["start"], p["start"], c["start"], k["start"], o["start"]):
        put(x - 0.42, whoosh(0.7, 600, 4200, peak=0.6, q=0.8), 0.24, 0.6)
        put(x - 0.05, whoosh(0.4, 3200, 700, peak=0.3), 0.1, -0.5)

    # word
    mix.typing(w["w"][0], w["w"][0] + 0.7, 6, gain=(0.14, 0.2))
    put(w["w"][1], whoosh(0.5, 3600, 700, peak=0.35), 0.22, 0.6)
    put(w["w"][2], kick(), 0.32)
    put(w["w"][2], pop(400, 160, dur=0.2), 0.2)
    put(w["underline"], whoosh(0.5, 500, 2800, peak=0.7), 0.12)

    # paper
    put(p["highlight"], scratch(0.8), 0.2, 0.3)
    put(p["circle"], scratch(0.6), 0.2, -0.2)
    put(p["circle"] + 0.6, scratch(0.5), 0.14, 0.2)
    for j, x in enumerate(p["cards"]):
        put(x + 0.1, pop(700 + j * 150, 300), 0.2, 0.5 - j * 0.5)
        put(x + 0.25, click(2000 + j * 200), 0.16, 0.5 - j * 0.5)
        put(x + 0.25, blip(N[j + 1], dur=0.4), 0.1, 0.5 - j * 0.5)
    put(p["string"], scratch(1.2), 0.08)
    put(p["push"], whoosh(p["end"] - p["push"], 300, 5000, peak=0.9, q=0.6), 0.24)

    # shapes
    tau = 0.0
    for j in range(5):
        # the ball touches down when |cos(5.2*tau)| = 0
        tau = (math.pi / 2 + j * math.pi) / 5.2
        g = math.exp(-3.2 * tau)
        if g < 0.04:
            break
        put(c["drop"] + tau, pop(600 + j * 80, 200, dur=0.12), 0.3 * g + 0.05)
    put(c["morph"], whoosh(0.8, 500, 2600, peak=0.6), 0.16)
    for j in range(3):
        put(c["bars"] + j * 0.15, blip(N[j], dur=0.3, tau=0.08), 0.14)
    put(c["chart"], whoosh(0.8, 800, 4000, peak=0.9, q=0.6), 0.12)
    put(c["logo"] + 0.1, pop(300, 110, dur=0.22), 0.26)
    for j in range(3):
        put(c["logo"] + 0.2 + j * 0.1, pop(900 + j * 200, 500), 0.16, -0.2 + j * 0.2)
    for j in range(4):
        put(c["orbit"] + j * 0.18, pop(1200 + j * 150, 700), 0.16, [-0.6, 0.6, -0.3, 0.3][j])
    put(c["sub"], blip(N[3], dur=0.4), 0.12)

    # skins
    for j, x in enumerate(k["at"]):
        put(x - 0.25, whoosh(0.45, 600, 3000, peak=0.6), 0.18)
        put(x + 0.05, pop(900 + j * 120, 500), 0.2)
        put(x + 0.1, blip(N[j + 2], dur=0.4), 0.12)
    for j in range(4):
        put(k["grid"] + j * 0.1, pop(1000 + j * 150, 600), 0.16, [-0.4, 0.4, -0.4, 0.4][j])
    put(k["text"], chime([N[0], N[2], N[4]], dur=1.6, tau=0.6), 0.12)

    # offer
    put(o["a"], blip(N[0] / 2, dur=0.3), 0.14)
    put(o["b"], whoosh(0.3, 500, 2600, peak=0.5), 0.12)
    put(o["three"] - 0.6, riser(0.65, 300, 3000), 0.16)
    put(o["three"] + 0.12, impact(1.4), 0.36)
    for x in o["zeros"]:
        put(x, whoosh(0.6, 300, 1400, peak=0.8), 0.2, -0.6)
        put(x + 0.55, click(1800), 0.2, -0.1)
    put(o["egp"], chime([N[0], N[2], N[4], N[7]], dur=2.0, tau=0.8), 0.14)
    put(o["flood"], whoosh(0.5, 400, 3600, peak=0.8), 0.24)

    # cta
    put(ct["l1"], whoosh(0.3, 600, 2800, peak=0.5), 0.14)
    put(ct["l2"], pop(700, 300), 0.2)
    put(ct["wa"], pop(1500, 800), 0.24)
    put(ct["logo"], whoosh(0.5, 400, 2400, peak=0.6), 0.16)
    for j in range(3):
        put(ct["logo"] + 0.2 + j * 0.1, pop(900 + j * 200, 500), 0.18, -0.2 + j * 0.2)
    put(ct["logo"] + 0.6, chime([N[0] / 2, N[2] / 2, N[4] / 2, N[0], N[4]], dur=3.0, tau=1.2), 0.16)
