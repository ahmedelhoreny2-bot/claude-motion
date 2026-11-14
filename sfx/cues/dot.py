"""Sound effects for IbdaaDot ("نقطة"): no music, every sound comes from the line's motion.

    python3 -m sfx sfx/cues/dot.py

The same tick opens and closes the piece: the dot.
"""

import math
import random

from sfx import dsp
from sfx.synth import SR, blip, chime, click, impact, pop, riser, scratch, whoosh

TIMELINE = "src/dot/timeline.json"
OUT = "public/dot/sfx.wav"
TARGET_LUFS = -20.0  # sits under the voiceover

RNG = random.Random(5)


def thud():
    n = int(0.2 * SR)
    x = dsp.biquad(dsp.noise(RNG, n), dsp.lp(500))
    return [v * math.exp(-k / (0.04 * SR)) * 2 for k, v in enumerate(x)]


def zip_(f0, f1, dur=0.16):
    return whoosh(dur, f0, f1, peak=0.25, q=1.4)


def tick():
    """The dot: one clean, bright tick."""
    return [a + 0.5 * b for a, b in zip(click(3400, dur=0.05), blip(1760.0, dur=0.05, tau=0.01) + [0.0] * 2400)]


def beep(f=1000, dur=0.12):
    n = int(dur * SR)
    return [math.sin(2 * math.pi * f * k / SR) * min(1, k / 200) * min(1, (n - k) / 400) for k in range(n)]


def score(mix, tl):
    H, S, V, B, C = tl["hook"], tl["story"], tl["services"], tl["brand"], tl["cta"]
    put = mix.put

    # ===== hook: one dot, waiting
    put(H["dot"], tick(), 0.3)
    t = H["dot"] + 1.0
    while t < H["squash"] - 0.2:  # a quiet clock: the dot is just sitting there
        put(t, click(1200, dur=0.03), 0.05, 0.2)
        t += 0.6
    put(H["squash"], pop(700, 180, 0.3), 0.12)                       # compress...
    put(H["launch"], whoosh(0.35, 400, 6000, peak=0.2), 0.2)         # ...and shoot across
    put(H["launch"] + 0.05, zip_(3000, 8000, 0.2), 0.08, -0.6)

    # ===== the line draws the story
    put(S["cup"], scratch(0.7), 0.1)
    put(S["cup"] + 0.7, click(2600, dur=0.05), 0.1)                  # cup set on the saucer
    put(S["cup"] + 0.72, blip(1318.5, dur=0.3, tau=0.08), 0.06)
    put(S["steam"], whoosh(0.6, 300, 1400, peak=0.6), 0.05)
    put(S["ecg"], whoosh(0.4, 600, 2000), 0.07)
    for b in S["beats"]:
        put(b + 0.18, beep(1000), 0.12)                              # the pulse reaches the peak
    put(S["tag"], whoosh(0.4, 500, 2400), 0.07)
    put(S["tag"] + 0.42, click(1500, dur=0.05), 0.12, -0.4)          # tag hangs on its string
    put(S["tagText"], pop(900, 1600, 0.2), 0.14)
    put(S["phone"], whoosh(0.45, 500, 2600), 0.08)
    for i, n in enumerate(S["notifs"]):
        put(n, blip([880.0, 1046.5, 1318.5][i], dur=0.25, tau=0.07), 0.11, 0.1)
        put(n, pop(1200, 1800, 0.12), 0.06)
    put(S["zoom"], whoosh(0.35, 300, 7000, peak=0.85), 0.16)          # into the screen
    put(S["word1"], scratch(0.55), 0.08)                              # the word writes itself
    put(S["word2"], impact(0.7), 0.22)
    put(S["word2"], pop(500, 1500, 0.2), 0.12)
    put(S["spiral"], riser(S["collapse"] - S["spiral"] + 0.2, 200, 5000), 0.18)
    for i in range(6):
        put(S["spiral"] + 0.2 + i * 0.16, zip_(800 + i * 250, 4000, 0.15), 0.04, math.sin(i * 1.7) * 0.7)
    put(S["collapse"] + 0.3, tick(), 0.3)                            # back to one dot
    put(S["collapse"] + 0.3, thud(), 0.15)
    for i in range(3):                                                # the dot splits into three lines
        put(S["split"] + i * 0.06, zip_(1500 + i * 400, 6000, 0.14), 0.09, -0.3 + i * 0.3)

    # ===== services: each frame closes with a click, its content pops in
    frames = ["square", "polaroid", "laptop", "phone", "wide", "page", "mic", "wave", "triple"]
    for i, k in enumerate(frames):
        at = V[k]
        put(at, whoosh(0.4, 400, 2600, peak=0.6), 0.08, (i % 3 - 1) * 0.3)
        put(at + 0.38, click(2200 + i * 80, dur=0.04), 0.1)
    put(V["square"] + 0.35, scratch(0.5), 0.05)
    put(V["square"] + 0.8, pop(1200, 700), 0.13)
    put(V["polaroid"] + 0.3, click(3000, dur=0.05), 0.12)             # shutter
    put(V["polaroid"] + 0.6, pop(1500, 900), 0.12, 0.4)
    for i in range(3):
        put(V["laptop"] + 0.45 + i * 0.35, pop(800 + i * 250, 1200 + i * 250, 0.16), 0.12, 0.4 - i * 0.4)
    for i in range(4):                                                # reels swiped up
        put(V["phone"] + 0.4 + i * 0.42, whoosh(0.18, 2600, 900, peak=0.3), 0.07)
    for i in range(5):
        put(V["wide"] + 0.45 + i * 0.12, pop(500 + i * 140, 900 + i * 180, 0.16), 0.1, -0.5 + i * 0.25)
    for i in range(12):
        put(V["wide"] + 0.5 + 1.3 * (1 - (1 - i / 11) ** 2), click(2600, dur=0.025), 0.05)
    put(V["page"] + 0.35, scratch(0.5), 0.07)
    put(V["mic"] + 0.3, pop(300, 160, 0.2), 0.12)
    put(V["mic"] + 0.35, whoosh(0.8, 200, 900, peak=0.3), 0.05)
    put(V["wave"] + 0.3, whoosh(1.0, 300, 3000, peak=0.5, q=0.6), 0.08)
    for i in range(6):
        put(V["wave"] + 0.4 + i * 0.15, blip([587.33, 880.0, 1174.66][i % 3], dur=0.2, tau=0.05), 0.05, math.sin(i) * 0.6)
    for i, at in enumerate(V["sizes"]):
        put(at, click(2400 - i * 300, dur=0.05), 0.12, [0.5, 0, -0.5][i])
        put(at, pop(900 + i * 200, 1400 + i * 200, 0.14), 0.08, [0.5, 0, -0.5][i])
    put(V["gallery"], whoosh(1.0, 300, 2400, peak=0.4), 0.12, 0.5)   # the wall swings in
    for i in range(16):
        put(V["gallery"] + 0.03 * i, click(1800 + (i % 4) * 200, dur=0.03), 0.04, -0.6 + (i % 4) * 0.4)
    put(V["implode"], whoosh(0.4, 4000, 300, peak=0.85), 0.16)         # everything sucked back
    put(V["dot"], tick(), 0.3)

    # ===== brand
    put(B["sting"], zip_(2500, 6000, 0.12), 0.08, 0.3)
    put(B["hit"], impact(1.6), 0.4)
    put(B["hit"], chime([293.66, 440.0, 587.33, 739.99, 880.0], dur=2.4, tau=1.0), 0.13)
    put(B["dock"], whoosh(0.5, 2200, 600), 0.09)

    # ===== the way to reach us, and the last dot
    put(C["ask"], pop(700, 1300, 0.16), 0.12)
    t = C["ask"] + 0.08
    while t < C["askText"] - 0.03:
        put(t, click(1700 + RNG.random() * 500, dur=0.025), 0.05)
        t += 0.07
    put(C["askText"], blip(880.0, dur=0.25, tau=0.07), 0.12)
    put(C["askText"] + 0.09, blip(1318.5, dur=0.35, tau=0.1), 0.1)
    for i, at in enumerate((C["wa"], C["page"])):
        put(at, whoosh(0.4, 300, 2400, peak=0.6), 0.09, -0.2)
        put(at + 0.25, pop(800 + i * 200, 1400 + i * 200, 0.18), 0.13)
    put(C["line"], whoosh(0.3, 500, 2600), 0.06)
    put(C["dot"], tick(), 0.32)                                       # the full stop is the dot
    put(C["tick"], tick(), 0.35)
