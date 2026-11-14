"""Sound design + procedural beat for IbdaaPromo (إبداع بيتحرك). Every time comes from the timeline.

    python3 -m sfx sfx/cues/promo.py

Key: D minor with a hijaz touch (C# over A). Beat: 120 BPM, drop on the tap (s3.tap).
"""

import math
import random

from sfx import dsp
from sfx.synth import SR, blip, chime, click, envelope, impact, pad, pop, riser, scratch, whoosh

TIMELINE = "src/promo/timeline.json"
OUT = "public/promo-music.wav"
TARGET_LUFS = -16.0  # leaves headroom for the voiceover to sit on top

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


def score(mix, tl):
    s1, s2, s3, s4, s5, s6, s7 = (tl[k] for k in ("s1", "s2", "s3", "s4", "s5", "s6", "s7"))
    dur = tl["duration"]
    beat = 60 / tl["bpm"]
    put = mix.put
    K, CL, H, HO, DM, TK, TH = kick(), clap(), hat(), hat(True), doum(), tek(), thud()

    # ---- bed: low drone before the drop, full chords after
    drop = s3["tap"]
    chords = [(0, [73.42, 110.0])]
    t, i = drop, 0
    while t < dur:
        chords.append((t, CHORDS[PROG[i % 4]]))
        t += 4 * beat * 2
        i += 1
    vol = envelope([
        (0, 0.5), (s1["stop"], 0.5), (s1["stop"] + 0.05, 0.15), (s2["fall"], 0.5), (s3["squash"], 0.8),
        (drop, 0.4), (drop + 0.3, 1.0), (s6["converge"], 1.0), (s6["hit"] - 0.1, 0.4), (s6["hit"], 1.1),
        (s7["dock"], 0.9), (dur - 1.5, 0.9), (dur, 0),
    ])
    mix.put_stereo(0, *pad(dur, chords, volume=vol), gain=0.05)

    # ---- scene 1: scroll, brake, hook
    tt = 0.0
    while tt < s1["stop"] - 0.1:
        put(tt, whoosh(0.18, 1500, 400, peak=0.4), 0.06, 0.2 * math.sin(tt * 9))
        tt += 0.207
    put(s1["burst"], riser(s1["stop"] - s1["burst"], 600, 4000), 0.12)
    put(s1["stop"], brake(0.45), 0.2)
    put(s1["stop"], K, 0.5)
    put(s1["stop"], TH, 0.35)
    put(s1["stop"] + 0.04, pop(500, 1400, 0.2), 0.2)
    put(s1["word1"], whoosh(0.3, 400, 2600, peak=0.5), 0.12)
    put(s1["word1"] + 0.12, blip(146.83, dur=0.6, tau=0.2), 0.3)
    put(s1["word2"], whoosh(0.3, 700, 2400, peak=0.5), 0.07)
    put(s1["exit"], whoosh(0.5, 2600, 500, peak=0.4), 0.1)

    # ---- scene 2: pile, counter, the stillness ticks
    for i in range(15):
        st = s2["fall"] + i * 0.085
        land = 1560 - (i // 3) * 44
        put(st + math.sqrt(2 * (land + 420) / 5200), TH, 0.16, -0.5 + (i % 5) * 0.25)
        put(st + math.sqrt(2 * (land + 420) / 5200), scratch(0.12), 0.04)
    for i in range(22):
        k = i / 21
        tt = s2["count"] + (s2["countEnd"] - s2["count"]) * (1 - (1 - k) ** 2.2)
        put(tt, click(2200 + i * 40, dur=0.03), 0.09)
    put(s2["countEnd"], blip(293.66, dur=0.5), 0.15)
    put(s2["forget"], whoosh(1.0, 1800, 200, peak=0.3), 0.1)
    put(s2["forget"] + 0.25, blip(220.0, dur=0.8, tau=0.3), 0.12)
    put(s2["forget"] + 0.55, blip(207.65, dur=1.0, tau=0.4), 0.1)
    tt = s2["forget"] + 0.4
    n = 0
    while tt < s3["squash"]:
        put(tt, click(1100 if n % 2 else 1400, dur=0.04), 0.1, 0.3 if n % 2 else -0.3)
        tt += beat
        n += 1
    put(s2["why"], whoosh(0.3, 500, 2200), 0.1)
    put(s2["still"], whoosh(0.3, 500, 2200), 0.08)

    # ---- scene 3: hop, squash, the tap (the drop)
    put(s3["hop"], whoosh(0.7, 300, 2200, peak=0.5), 0.12, -0.3)
    put(s3["hop"] + 0.72, TH, 0.25)
    put(s3["hop"] + 0.72, pop(300, 160, 0.2), 0.2)
    put(s3["hop"] + 0.7, riser(drop - s3["hop"] - 0.7, 300, 6000), 0.2)
    put(s3["squash"], pop(900, 200, 0.45), 0.12)
    put(drop, impact(1.6), 0.4)
    put(drop, chime([293.66, 440.0, 587.33, 698.46], dur=2.2, tau=0.8), 0.12)
    put(s3["line2"], whoosh(0.35, 500, 3000, peak=0.5), 0.1)

    # ---- the beat: drop → brand hit, then a lighter groove under the CTA
    def section(a, b, full=True):
        steps = int(round((b - a) / (beat / 4)))
        for st in range(steps):
            t0 = a + st * beat / 4
            bar_pos = st % 16
            ch = PROG[int((t0 - drop) // (8 * beat)) % 4]
            if bar_pos % 4 == 0 and (full or bar_pos in (0, 8)):
                put(t0, K, 0.5)
            if bar_pos in (4, 12) and full:
                put(t0, CL, 0.22, 0.05)
            if bar_pos % 2 == 0:
                put(t0, HO if bar_pos % 4 == 2 else H, 0.06 if full else 0.045, 0.35)
            if bar_pos in (3, 6, 11, 14):
                put(t0, TK, 0.07, -0.35)
            if bar_pos in (0, 10) and full:
                put(t0, DM, 0.18, -0.15)
            if bar_pos in (0, 3, 6, 8, 11, 14):
                note = BASS_ROOT[ch] * (2 if bar_pos in (6, 14) else 1)
                put(t0, bass(note, beat * 0.7), 0.16 if full else 0.11)

    section(drop, s6["converge"])
    for k in range(16):  # snare roll into the brand hit
        put(s6["converge"] + 1.0 + k * 0.0625, CL, 0.04 + 0.12 * k / 15, 0.05)
    section(s6["hit"], s7["dock"])
    section(s7["dock"] + 0.2, dur - 2.0, full=False)

    # ---- scene 4: wipes and showcase
    for w in s4["wipes"] + [s6["converge"]]:
        put(w - 0.6, whoosh(1.1, 400, 3800, peak=0.5, q=0.7), 0.16, 0.6)
        put(w - 0.1, whoosh(0.6, 3800, 600, peak=0.2, q=0.7), 0.1, -0.6)
    a = s4["logo"]
    put(a + 0.1, scratch(0.9), 0.08)
    put(a + 0.8, pop(1200, 700), 0.16, 0.3)
    put(a + 1.0, pop(1500, 900), 0.16, -0.2)
    put(a + 1.4, blip(587.33, dur=0.6), 0.12)
    a = s4["type"]
    for i, dt in enumerate((0.2, 0.7, 1.2)):
        put(a + dt, pop(700 + i * 250, 300 + i * 120, 0.22), 0.2, 0.4 - i * 0.4)
    a = s4["product"]
    put(a + 0.1, whoosh(0.6, 300, 1800, peak=0.6), 0.12)
    put(a + 1.0, chime([1174.66, 1760.0, 2349.32], dur=1.4, tau=0.4), 0.1, 0.2)
    put(a + 1.6, pop(1600, 1000), 0.15, -0.5)
    a = s4["data"]
    for i in range(5):
        put(a + 0.5 + i * 0.16, pop(500 + i * 140, 900 + i * 180, 0.18), 0.13, -0.5 + i * 0.25)
    for i in range(14):
        put(a + 0.5 + 1.5 * (1 - (1 - i / 13) ** 2), click(2600, dur=0.025), 0.06)

    # ---- scene 5: fields slot machine
    put(s5["head"], whoosh(0.35, 500, 2600), 0.1)
    notes = [293.66, 349.23, 440.0, 523.25]
    for i, st in enumerate(s5["slots"]):
        put(st, pop(900 + i * 150, 500 + i * 100, 0.18), 0.16, -0.3 + i * 0.2)
        put(st + 0.02, blip(notes[i], dur=0.4), 0.1)
    put(s5["final"], chime([587.33, 739.99, 880.0, 1174.66], dur=1.8, tau=0.6), 0.15)
    put(s5["final"], pop(1800, 900, 0.2), 0.18)
    put(s5["sub"], whoosh(0.3, 600, 2400), 0.07)

    # ---- scene 6: converge → brand hit
    put(s6["converge"], riser(s6["hit"] - s6["converge"], 200, 7000), 0.24)
    put(s6["hit"], impact(1.8), 0.45)
    put(s6["hit"], K, 0.4)
    put(s6["hit"], chime([293.66, 440.0, 587.33, 739.99, 880.0], dur=2.6, tau=1.0), 0.15)
    for i, l in enumerate(s6["lines"]):
        put(l, click(2000 + i * 300), 0.14, 0.2 + i * 0.15)
    put(s6["word1"], whoosh(0.35, 500, 2800, peak=0.5), 0.12)
    put(s6["word2"], whoosh(0.35, 700, 3200, peak=0.5), 0.12)
    put(s6["tag"], blip(587.33, dur=0.6), 0.1)

    # ---- scene 7: bubbles, CTA
    put(s7["dock"], whoosh(0.5, 2200, 600), 0.1)
    for i, b in enumerate(s7["bubbles"]):
        put(b, pop(700 + i * 100, 1300 + i * 200, 0.18), 0.14, 0.3)
        if i < 2:
            put(b + 0.25, blip(880.0 if i == 0 else 1046.5, dur=0.3, tau=0.08), 0.12)
            put(b + 0.33, blip(1318.5 if i == 0 else 1568.0, dur=0.4, tau=0.1), 0.1)
    put(s7["line1"], whoosh(0.35, 500, 2600, peak=0.5), 0.1)
    put(s7["line2"], whoosh(0.3, 700, 2400), 0.06)
    put(s7["cta"], pop(600, 1600, 0.25), 0.2)
    put(s7["cta"], chime([293.66, 440.0, 587.33, 880.0], dur=3.0, tau=1.2), 0.12)
    put(dur - 2.0, K, 0.3)
    put(dur - 2.0, chime([146.83, 220.0, 293.66, 440.0, 587.33], dur=2.0, tau=1.0), 0.14)
