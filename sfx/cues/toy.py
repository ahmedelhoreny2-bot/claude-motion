"""Sound effects for ShattourToy («شطّور»): wooden blocks, a xylophone that climbs as things
get built, then the flip into إبداع بيتحرك. No music bed.

    python3 -m sfx sfx/cues/toy.py
"""

import math
import random

from sfx import dsp
from sfx.synth import SR, blip, chime, click, impact, pop, riser, whoosh

TIMELINE = "src/toy/timeline.json"
OUT = "public/toy/sfx.wav"
TARGET_LUFS = -20.0

RNG = random.Random(9)
# C major pentatonic, bright register: playful, never sour
PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.5, 1568.0, 1760.0]


def wood(freq=900):
    """A wooden block landing: a short knock plus a bright xylophone note."""
    n = int(0.22 * SR)
    out = []
    for k in range(n):
        tt = k / SR
        knock = math.sin(2 * math.pi * 180 * tt) * math.exp(-tt / 0.02) * 0.8
        bar = (math.sin(2 * math.pi * freq * tt) + 0.3 * math.sin(2 * math.pi * freq * 3.9 * tt)) * math.exp(-tt / 0.07)
        out.append(knock + bar * 0.6)
    for k in range(int(0.003 * SR)):
        out[k] += RNG.uniform(-1, 1) * 0.6
    return out


def puff():
    n = int(0.35 * SR)
    x = dsp.biquad(dsp.noise(RNG, n), dsp.lp(900))
    return [v * math.sin(math.pi * k / n) ** 0.5 * math.exp(-k / (0.15 * SR)) * 1.5 for k, v in enumerate(x)]


def thud():
    n = int(0.25 * SR)
    x = dsp.biquad(dsp.noise(RNG, n), dsp.lp(400))
    return [v * math.exp(-k / (0.05 * SR)) * 2.2 for k, v in enumerate(x)]


def tick():
    return [a + 0.5 * b for a, b in zip(click(3400, dur=0.05), blip(1760.0, dur=0.05, tau=0.01) + [0.0] * 2400)]


def build(mix, at, count, step=0.03, settle=0.24, base=0, gain=0.11):
    for i in range(count):
        note = PENTA[min(len(PENTA) - 1, base + i * 7 // max(1, count - 1))]
        mix.put(at + i * step + settle, wood(note), gain, math.sin(i * 1.3) * 0.4)


def score(mix, tl):
    hk, bd, wy, fl = tl["hook"], tl["build"], tl["why"], tl["flip"]
    put = mix.put

    # one cube drops and bounces
    put(hk["drop"] + 0.32, wood(PENTA[4]), 0.2)
    put(hk["drop"] + 0.55, wood(PENTA[4]), 0.08)
    put(hk["hand"], whoosh(0.4, 300, 1500, peak=0.6), 0.08, 0.6)
    put(hk["hand"] + 0.35, pop(400, 700, 0.15), 0.12, 0.3)              # the hand picks it up
    # it becomes a rocket: blocks rain in, notes climb
    put(hk["rain"] - 0.05, whoosh(0.5, 2500, 600, peak=0.3), 0.08)
    build(mix, hk["rain"], 10, settle=0.36, base=0)
    # lift-off
    put(bd["launch"] - 0.3, riser(0.35, 300, 3000), 0.12)
    put(bd["launch"], whoosh(0.7, 200, 4000, peak=0.25), 0.2)
    for i in range(5):
        put(bd["launch"] + i * 0.06, puff(), 0.12, -0.5 + i * 0.25)
    # house, giraffe, letter: each rebuilt block by block
    put(bd["house"] - 0.05, whoosh(0.4, 3000, 500, peak=0.3), 0.07)
    build(mix, bd["house"], 20, step=0.03, settle=0.3, base=1)
    build(mix, bd["giraffe"], 20, step=0.03, settle=0.25, base=2, gain=0.09)
    for i in range(5):                                                    # the neck grows, up the scale
        put(bd["giraffe"] + 0.45 + i * 0.05, blip(PENTA[4 + i], dur=0.18, tau=0.05), 0.05)
    build(mix, bd["letter"], 8, step=0.04, settle=0.25, base=3)
    for i in range(3):                                                    # the name tiles drop in
        put(bd["name"] + i * 0.12 + 0.18, wood(PENTA[6 + i]), 0.13, -0.3 + i * 0.3)
        put(bd["name"] + i * 0.12 + 0.2, pop(500, 300, 0.12), 0.06)
    # into the box, lid on
    for i in range(10):
        put(bd["box"] + i * 0.05 + 0.2, pop(900 + i * 60, 500, 0.08), 0.05, math.sin(i) * 0.5)
    put(bd["lid"] + 0.15, thud(), 0.3)
    put(bd["lid"] + 0.15, wood(PENTA[0]), 0.12)
    put(bd["lid"] + 0.25, chime([1046.5, 1318.5, 1568.0, 2093.0], dur=1.6, tau=0.5), 0.12)
    put(bd["spin"], pop(500, 1600, 0.2), 0.15)                         # the name pops
    # three cards flip over
    for i, at in enumerate(wy["cards"]):
        put(at, whoosh(0.3, 600, 2600, peak=0.6), 0.08, [0.5, 0, -0.5][i])
        put(at + 0.2, wood(PENTA[4 + i * 2]), 0.13, [0.5, 0, -0.5][i])
    # a big piece, a small hand
    put(wy["big"], whoosh(0.3, 2400, 400), 0.08)
    put(wy["big"] + 0.2, thud(), 0.28)
    put(wy["big"] + 0.2, wood(PENTA[0]), 0.1)
    put(wy["big"] + 0.4, pop(500, 800, 0.15), 0.08, 0.5)
    # happy colours: five cubes pop in and hop on the beat of the notes
    for i in range(5):
        put(wy["colors"] + i * 0.08 + 0.2, wood(PENTA[3 + i]), 0.12, -0.6 + i * 0.3)
    for j in range(3):
        for i in range(5):
            put(wy["colors"] + 0.45 + i * 0.12 + j * 0.78, pop(700 + i * 120, 1100 + i * 140, 0.1), 0.04, -0.6 + i * 0.3)
    put(wy["colors"] + 0.3, chime([1568.0, 2093.0, 2637.0], dur=1.2, tau=0.4), 0.06)
    # the order
    put(wy["cta"], whoosh(0.4, 300, 2400, peak=0.6), 0.08)
    put(wy["cta"] + 0.25, wood(PENTA[2]), 0.12)
    put(wy["cta"] + 0.45, pop(600, 1400, 0.2), 0.14)
    put(wy["order"], click(1100, dur=0.06), 0.25)                       # button pressed
    put(wy["order"] + 0.02, thud(), 0.15)
    put(wy["order"] + 0.12, chime([523.25, 659.25, 783.99, 1046.5], dur=1.4, tau=0.6), 0.13)

    # ===== the flip into إبداع بيتحرك
    put(fl["suck"], whoosh(0.4, 4000, 300, peak=0.85), 0.16)
    put(fl["cube"], wood(PENTA[4]), 0.15)
    put(fl["dark"], impact(1.2), 0.25)
    put(fl["dark"] + 0.35, tick(), 0.3)                                  # the cube becomes the dot
    put(fl["wa"], whoosh(0.4, 300, 2400, peak=0.6), 0.08)
    put(fl["wa"] + 0.25, pop(800, 1400, 0.18), 0.13)
    put(fl["sting"], whoosh(0.15, 2500, 6000, peak=0.25), 0.08, 0.3)
    put(fl["hit"], impact(1.6), 0.38)
    put(fl["hit"], chime([293.66, 440.0, 587.33, 739.99, 880.0], dur=2.4, tau=1.0), 0.12)
    put(fl["end"] - 1.4, tick(), 0.25)
