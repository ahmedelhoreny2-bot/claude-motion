"""Sound effects for IbdaaPromo (no music: SFX under the voiceover) (إبداع بيتحرك). Every time comes from the timeline.

    python3 -m sfx sfx/cues/promo.py

Tonal hits stay in D minor so they sit together.
"""

import math
import random

from sfx import dsp
from sfx.synth import SR, blip, chime, click, envelope, impact, pad, pop, riser, scratch, whoosh

TIMELINE = "src/promo/timeline.json"
OUT = "public/promo-sfx.wav"
TARGET_LUFS = -20.0  # sits under the voiceover

RNG = random.Random(7)
D2, F2, G2, A2, Bb1, C2 = 73.42, 87.31, 98.0, 110.0, 58.27, 65.41

CHORDS = {
    "Dm": [146.83, 220.0, 293.66, 349.23],
    "Bb": [116.54, 233.08, 293.66, 349.23],
    "Gm": [98.0, 196.0, 233.08, 293.66],
    "A": [110.0, 220.0, 277.18, 329.63],
}
PROG = ["Dm", "Bb", "Gm", "A"]
BASS_ROOT = {"Dm": D2, "Bb": Bb1 * 2, "Gm": G2, "A": A2}


def env_exp(n, tau):
    return [math.exp(-k / (tau * SR)) for k in range(n)]


def kick():
    n = int(0.45 * SR)
    out, ph = [], 0.0
    for k in range(n):
        tt = k / SR
        f = 45 + 95 * math.exp(-tt / 0.035)
        ph += 2 * math.pi * f / SR
        out.append(math.tanh(1.6 * math.sin(ph) * math.exp(-tt / 0.16)))
    for k in range(int(0.004 * SR)):
        out[k] += RNG.uniform(-1, 1) * 0.5
    return out


def clap():
    n = int(0.3 * SR)
    x = dsp.biquad(dsp.noise(RNG, n), dsp.bp(1400, 1.2))
    out = []
    for k in range(n):
        tt = k / SR
        e = math.exp(-tt / 0.07)
        for off in (0.0, 0.011, 0.022):
            if tt >= off:
                e += 0.8 * math.exp(-(tt - off) / 0.006)
        out.append(x[k] * e * 1.6)
    return out


def hat(open_=False):
    n = int((0.22 if open_ else 0.06) * SR)
    x = dsp.biquad(dsp.noise(RNG, n), dsp.hp(7000))
    e = env_exp(n, 0.07 if open_ else 0.012)
    return [a * b for a, b in zip(x, e)]


def doum():
    n = int(0.35 * SR)
    out = []
    for k in range(n):
        tt = k / SR
        f = 95 + 40 * math.exp(-tt / 0.02)
        out.append(math.sin(2 * math.pi * f * tt) * math.exp(-tt / 0.12))
    return out


def tek():
    n = int(0.08 * SR)
    x = dsp.biquad(dsp.noise(RNG, n), dsp.bp(3200, 2.5))
    e = env_exp(n, 0.015)
    return [a * b * 2 for a, b in zip(x, e)]


def bass(freq, dur):
    n = int(dur * SR)
    x = dsp.saw(freq, n)
    x = dsp.svf(x, lambda k: 180 + 900 * math.exp(-k / (0.06 * SR)), q=1.4)
    a = int(0.004 * SR)
    return [v * min(1, k / a) * math.exp(-k / (0.35 * SR)) * 0.9 for k, v in enumerate(x)]


def thud():
    n = int(0.2 * SR)
    x = dsp.biquad(dsp.noise(RNG, n), dsp.lp(500))
    return [v * math.exp(-k / (0.04 * SR)) * 2 for k, v in enumerate(x)]


def brake(dur=0.5):
    """Hard stop: falling filtered noise + tonal screech."""
    n = int(dur * SR)
    x = dsp.svf(dsp.noise(RNG, n), lambda k: 3500 * (0.15 ** (k / n)), q=4, mode="bp")
    return [v * (1 - k / n) ** 1.5 * 1.4 for k, v in enumerate(x)]


def flap():
    """Paper flutter: a short airy flick."""
    n = int(0.09 * SR)
    x = dsp.biquad(dsp.noise(RNG, n), dsp.bp(1800 + RNG.random() * 1500, 1.5))
    return [v * math.sin(math.pi * k / n) * 1.2 for k, v in enumerate(x)]


def zip_(f0, f1, dur=0.16):
    """A speed line shooting out: a fast, bright whoosh."""
    return whoosh(dur, f0, f1, peak=0.25, q=1.4)


def score(mix, tl):
    s1, s2, s3, s4, s5, s6, s7 = (tl[k] for k in ("s1", "s2", "s3", "s4", "s5", "s6", "s7"))
    beat = 60 / tl["bpm"]
    drop = s3["tap"]
    put = mix.put
    K, TH, DM = kick(), thud(), doum()

    # ================= 1. hook: the feed, the stop, the slam
    tt = 0.0
    while tt < s1["stop"] - 0.05:  # one swipe per card passing (card pitch / scroll speed)
        put(tt, whoosh(0.18, 1500, 400, peak=0.4), 0.05 + 0.04 * tt / s1["stop"], 0.2 * math.sin(tt * 9))
        tt += 1080 / 5200
    put(s1["burst"], riser(s1["stop"] - s1["burst"], 600, 4000), 0.12)
    put(s1["stop"], brake(0.45), 0.2)
    put(s1["stop"], K, 0.45)
    put(s1["stop"], TH, 0.35)
    put(s1["stop"], whoosh(0.35, 300, 3200, peak=0.6), 0.16)            # triangle bursts toward the lens
    put(s1["stop"], whoosh(0.55, 2000, 180, peak=0.25), 0.1, -0.2)      # the feed falls back into the dark
    for i in range(3):                                                    # brake trails fire out to the right
        put(s1["stop"] + i * 0.04, zip_(2200 + i * 500, 7000), 0.12, 0.35 + i * 0.15)
        put(s1["word2"] + 0.5 + i * 0.05, zip_(6000, 1800 + i * 300, 0.14), 0.06, 0.5)
    put(s1["word1"], whoosh(0.24, 6000, 600, peak=0.85), 0.14)           # the word comes at the glass...
    put(s1["word1"] + 0.24, impact(0.9), 0.3)                             # ...and hits it
    put(s1["word1"] + 0.24, K, 0.3)
    put(s1["word1"] + 0.26, blip(146.83, dur=0.6, tau=0.2), 0.22)
    put(s1["word2"], whoosh(0.3, 700, 2400, peak=0.5), 0.07)
    put(s1["exit"], whoosh(0.5, 2600, 500, peak=0.4), 0.1, -0.6)          # triangle retreats left

    # ================= 2. the pile
    for i in range(15):
        st = s2["fall"] + i * 0.085
        land = st + math.sqrt(2 * ((1560 - (i // 3) * 44) + 420) / 5200)
        pan = -0.5 + (i % 5) * 0.25
        put(st + 0.1, flap(), 0.05, pan)
        put(land, TH, 0.15, pan)
        put(land, scratch(0.1), 0.04, pan)
    for i in range(22):
        k = i / 21
        put(s2["count"] + (s2["countEnd"] - s2["count"]) * (1 - (1 - k) ** 2.2), click(2200 + i * 40, dur=0.03), 0.09)
    put(s2["countEnd"], blip(293.66, dur=0.5), 0.15)
    put(s2["forget"], whoosh(1.0, 1800, 200, peak=0.3), 0.1)
    put(s2["forget"] + 0.25, blip(220.0, dur=0.8, tau=0.3), 0.12)
    put(s2["forget"] + 0.55, blip(207.65, dur=1.0, tau=0.4), 0.1)
    tt, n = s2["forget"] + 0.4, 0
    while tt < s3["squash"]:  # a clock: the stillness ticking
        put(tt, click(1100 if n % 2 else 1400, dur=0.04), 0.08, 0.3 if n % 2 else -0.3)
        tt += beat
        n += 1
    put(s2["why"], whoosh(0.3, 500, 2200), 0.1)
    put(s2["still"], whoosh(0.3, 500, 2200), 0.08)

    # ================= 3. hop, squash, tap
    put(s3["hop"], whoosh(0.75, 300, 2400, peak=0.5), 0.13, -0.5)       # from the left to the pile
    put(s3["hop"] + 0.3, zip_(900, 3000, 0.3), 0.07)                      # the mid-air flip
    put(s3["hop"] + 0.75, TH, 0.25)
    put(s3["hop"] + 0.75, pop(300, 160, 0.2), 0.2)
    put(s3["hop"] + 0.75, riser(drop - s3["hop"] - 0.75, 300, 6000), 0.2)
    put(s3["squash"], pop(900, 200, 0.45), 0.12)
    put(drop, impact(1.6), 0.42)
    put(drop, K, 0.4)
    put(drop, chime([293.66, 440.0, 587.33, 698.46], dur=2.2, tau=0.8), 0.12)
    put(drop, whoosh(0.9, 200, 4000, peak=0.15, q=0.6), 0.16)            # the wave across the floor
    for i, dt in enumerate((0.06, 0.17, 0.3)):                           # colour comes back: shutter clicks
        put(drop + dt, click(3200 - i * 300, dur=0.04), 0.12, [-0.5, 0.4, -0.1][i])
        put(drop + dt + 0.03, click(1600, dur=0.03), 0.07, [-0.5, 0.4, -0.1][i])
    for i in range(10):                                                   # papers burst toward the lens
        put(drop + 0.04 + i * 0.035, flap(), 0.09, -0.8 + i * 0.17)
    put(s3["line1"], whoosh(0.35, 500, 2600, peak=0.5), 0.08)
    put(s3["line2"], whoosh(0.35, 500, 3000, peak=0.5), 0.1)
    put(s3["line2"] + 0.3, blip(587.33, dur=0.5), 0.1)
    put(s3["exit"], whoosh(0.5, 1200, 5000, peak=0.7), 0.14, -0.7)       # triangle shoots off left

    # ================= 4. showcase (offsets mirror Showcase.tsx)
    for w in s4["wipes"] + [s6["converge"]]:  # speed lines sweep right to left
        put(w - 0.4, whoosh(0.8, 400, 3800, peak=0.5, q=0.7), 0.16, 0.6)
        put(w, whoosh(0.4, 3800, 600, peak=0.2, q=0.7), 0.1, -0.6)
    a = s4["logo"]
    put(a, whoosh(0.7, 200, 2600, peak=0.7), 0.12)                        # the mark spins in from depth
    put(a + 0.25, whoosh(0.4, 500, 2000, peak=0.7), 0.06, -0.6)           # cafe photos land
    put(a + 0.4, whoosh(0.4, 500, 2000, peak=0.7), 0.06, 0.6)
    put(a + 0.05, scratch(0.7), 0.06)                                     # ring draws
    put(a + 0.6, pop(1200, 700), 0.16, 0.3)
    put(a + 0.75, pop(1500, 900), 0.16, -0.1)
    put(a + 1.0, whoosh(0.3, 600, 2800), 0.08)
    put(a + 1.1, blip(587.33, dur=0.5), 0.1)
    put(a + 1.3, whoosh(0.25, 900, 3000), 0.04)
    a = s4["type"]
    for i, dt in enumerate((0.1, 0.45, 0.8)):                             # words fly out of the depth
        put(a + dt - 0.05, whoosh(0.25, 300, 3200, peak=0.85), 0.1, [-0.4, 0.1, 0.4][i])
        put(a + dt + 0.18, pop(700 + i * 250, 300 + i * 120, 0.22), 0.18, [-0.4, 0.1, 0.4][i])
    for b in (a + 1.2, a + 1.7):
        put(b, DM, 0.14)
    a = s4["product"]
    put(a + 0.1, whoosh(0.6, 200, 2000, peak=0.6), 0.13, 0.2)
    put(a + 0.55, TH, 0.1)
    put(a + 0.7, chime([1174.66, 1760.0, 2349.32], dur=1.2, tau=0.35), 0.09, 0.2)
    put(a + 0.9, click(2600, dur=0.03), 0.05)
    put(a + 1.1, pop(1600, 1000), 0.15, -0.5)
    a = s4["data"]
    put(a + 0.2, whoosh(0.5, 300, 2200, peak=0.6), 0.12, 0.4)             # the card swings in
    for i in range(10):
        put(a + 0.35 + 0.85 * (1 - (1 - i / 9) ** 2), click(2600, dur=0.025), 0.06)
    put(a + 0.5, whoosh(0.25, 700, 2600), 0.06)
    put(a + 0.7, zip_(3000, 1200, 0.2), 0.08, -0.2)                       # the old price is struck
    put(a + 0.85, blip(880.0, dur=0.35), 0.09)
    put(a + 1.25, whoosh(0.15, 4000, 800, peak=0.8), 0.08, 0.5)          # stamp drops from the lens
    put(a + 1.4, TH, 0.18, 0.5)
    put(a + 1.4, pop(500, 250, 0.2), 0.15, 0.5)
    put(a + 1.1, click(2600, dur=0.03), 0.05)

    # ================= 5. fields drum
    put(s5["head"], whoosh(0.35, 500, 2600), 0.1)
    put(s5["slots"][0] - 0.1, whoosh(0.5, 200, 1800, peak=0.6), 0.1)     # the drum arrives from depth
    put(s5["slots"][0], pop(900, 500, 0.18), 0.14)
    notes = [293.66, 349.23, 440.0, 523.25, 587.33]
    turns = s5["slots"][1:] + [s5["final"]]
    for i, at in enumerate(turns):                                        # each turn: a ratchet, then the note
        for r in range(4):
            put(at + r * 0.03, click(1500 + r * 200, dur=0.025), 0.07, 0.1 * r)
        put(at, whoosh(0.2, 900, 2800, peak=0.3), 0.06)                   # the icon flips
        put(at + 0.12, blip(notes[i + 1], dur=0.35), 0.1)
    put(s5["final"] + 0.1, chime([587.33, 739.99, 880.0, 1174.66], dur=1.6, tau=0.6), 0.14)
    put(s5["final"] + 0.1, pop(1800, 900, 0.2), 0.16)
    put(s5["sub"], whoosh(0.3, 600, 2400), 0.07)
    put(s5["exit"], whoosh(0.4, 400, 3000, peak=0.8), 0.08)

    # ================= 6. brand
    put(s6["converge"], riser(s6["hit"] - s6["converge"], 200, 7000), 0.22)
    for i in range(8):                                                    # shards streaking in
        put(s6["converge"] + 0.15 + i * 0.09, zip_(800 + i * 300, 5000, 0.18), 0.05, -0.8 + i * 0.23)
    for i, l in enumerate(s6["lines"]):
        put(l, zip_(2500, 6000, 0.12), 0.08, 0.3)
        put(l, click(2000 + i * 300), 0.1, 0.2 + i * 0.15)
    put(s6["hit"], impact(1.8), 0.45)
    put(s6["hit"], K, 0.4)
    put(s6["hit"], chime([293.66, 440.0, 587.33, 739.99, 880.0], dur=2.6, tau=1.0), 0.14)
    put(s6["word1"], whoosh(0.35, 500, 2800, peak=0.5), 0.1)
    put(s6["word2"], whoosh(0.35, 700, 3200, peak=0.5), 0.1)
    put(s6["tag"], blip(587.33, dur=0.6), 0.08)

    # ================= 7. the message, the two ways to reach us, the button
    put(s7["dock"], whoosh(0.5, 2200, 600), 0.1)
    b0, b1, b2 = s7["bubbles"]
    put(b0, whoosh(0.35, 400, 2400, peak=0.6), 0.09, 0.2)
    put(b0 + 0.2, pop(700, 1300, 0.16), 0.12)
    tt = b0 + 0.3
    while tt < s7["line1"] - 0.03:                                        # typing...
        put(tt, click(1700 + RNG.random() * 500, dur=0.025), 0.05, RNG.uniform(-0.2, 0.2))
        tt += 0.07 + RNG.random() * 0.05
    put(s7["line1"], blip(880.0, dur=0.25, tau=0.07), 0.12)              # message received
    put(s7["line1"] + 0.09, blip(1318.5, dur=0.35, tau=0.1), 0.1)
    for i, b in enumerate((b1, b2)):
        put(b, whoosh(0.45, 300, 2400, peak=0.6), 0.1, -0.2)
        put(b + 0.3, pop(800 + i * 200, 1400 + i * 200, 0.18), 0.14)
        put(b + 0.35, blip(1046.5 if i == 0 else 1174.66, dur=0.3, tau=0.08), 0.1)
    put(s7["line2"], whoosh(0.3, 700, 2400), 0.06)
    put(s7["cta"], whoosh(0.35, 300, 2600, peak=0.7), 0.1)
    put(s7["cta"] + 0.2, pop(600, 1600, 0.25), 0.18)
    put(s7["cta"] + 0.2, chime([293.66, 440.0, 587.33], dur=1.6, tau=0.6), 0.08)
    put(s7["press"], click(1200, dur=0.06), 0.25)                        # the button is pressed
    put(s7["press"] + 0.02, TH, 0.2)
    put(s7["press"] + 0.12, whoosh(0.9, 300, 1800, peak=0.2, q=0.6), 0.1)
    put(s7["press"] + 0.15, chime([293.66, 440.0, 587.33, 880.0, 1174.66], dur=1.3, tau=0.6), 0.14)
