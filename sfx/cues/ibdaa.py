"""Sound design for the Ibdaa showreel. Every time comes from src/ibdaa/timeline.json.

    python3 -m sfx sfx/cues/ibdaa.py

The music bed (pad + a light kick/hat groove) is kept low: the voiceover sits on top
and is mixed in at mux time.
"""

import math
import random

from sfx.synth import SR, blip, bandnoise, chime, click, envelope, impact, pad, pop, riser, scratch, whoosh

TIMELINE = "src/ibdaa/timeline.json"
OUT = "public/ibdaa/sfx.wav"
TARGET_LUFS = -16.0

# A minor, bright voicings. Bed moves Am9 -> Fmaj7 -> C -> G every 4 bars.
CH = [
    [110.0, 164.81, 220.0, 261.63, 329.63, 493.88],
    [87.31, 174.61, 220.0, 261.63, 329.63, 440.0],
    [130.81, 196.0, 261.63, 329.63, 392.0, 523.25],
    [98.0, 196.0, 246.94, 293.66, 392.0, 587.33],
]
NOTES = [440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66]
BEAT = 7.6 / 16  # 16 beats per section, so every wipe lands on a downbeat


def kick():
    n = int(0.32 * SR)
    out, ph = [], 0.0
    for i in range(n):
        t = i / SR
        f = 48 + 110 * math.exp(-t * 32)
        ph += 2 * math.pi * f / SR
        out.append(math.sin(ph) * math.exp(-t * 9) * (1 - math.exp(-t * 900)))
    return out


def hat(open_=False):
    n = int((0.16 if open_ else 0.05) * SR)
    tau = 0.05 if open_ else 0.012
    noise = bandnoise(n, lambda k: 8500, q=0.6)
    return [s * math.exp(-(i / SR) / tau) for i, s in enumerate(noise)]


def rip(dur):
    """Paper tearing: crackly band noise with random grain bursts."""
    n = int(dur * SR)
    base = bandnoise(n, lambda k: 1800 + 2600 * k / n, q=0.5)
    out = []
    for i, s in enumerate(base):
        grain = 1.0 if random.random() < 0.08 else 0.35
        env = min(1, i / (0.01 * SR)) * (1 - i / n) ** 0.6
        out.append(s * grain * env)
    return out


def score(mix, tl):
    put = mix.put
    dur = tl["duration"]
    hk, it, ds, hr, of, ct = tl["hook"], tl["intro"], tl["designs"], tl["hero"], tl["offer"], tl["cta"]
    secs = tl["sections"]
    groove_on, groove_off = it["start"], ct["end"] - 1.5

    # ── bed: pad + groove, ducked for the crash into the price
    vol = envelope([
        (0, 0.0), (hk["tear"], 0.25), (it["start"], 1.0), (hr["crash"], 1.0), (hr["crash"] + 0.3, 0.2),
        (of["countEnd"], 0.2), (of["countEnd"] + 0.6, 1.1), (dur - 1.5, 1.0), (dur, 0.0),
    ])
    bar = BEAT * 4
    chords = [(0, CH[0])] + [(secs[0] + k * bar * 4, CH[(k + 1) % 4]) for k in range(int((dur - secs[0]) / (bar * 4)) + 1)]
    chords = [c for c in chords if c[0] < dur]
    mix.put_stereo(0, *pad(dur, chords, volume=vol), gain=0.024)

    k0 = secs[0] - math.ceil((secs[0] - groove_on) / BEAT) * BEAT
    i, kk, hh = 0, kick(), hat()
    while True:
        t = k0 + i * BEAT
        if t >= groove_off:
            break
        quiet = hr["crash"] - 0.2 <= t < of["countEnd"] + 0.2
        if not quiet:
            put(t, kk, 0.30 * vol(t))
            put(t + BEAT / 2, hh, 0.07 * vol(t), 0.25)
            if i % 4 == 2:
                put(t, hat(True), 0.06 * vol(t), -0.25)
        i += 1

    # ── hook: words land, paper cracks and rips, triangle punches through
    for j, w in enumerate(hk["words"]):
        put(w, whoosh(0.3, 500, 2600, peak=0.45), 0.10, 0.3 - j * 0.2)
        put(w + 0.14, blip(NOTES[j] / 2, dur=0.3, tau=0.08), 0.18)
    put(hk["tear"] - 0.45, scratch(0.45), 0.16)
    put(hk["tear"], rip(0.6), 0.34)
    put(hk["tear"], whoosh(0.5, 300, 1500, peak=0.2), 0.16)
    put(hk["punch"], pop(260, 90, dur=0.25), 0.4)
    put(hk["punch"], kick(), 0.35)
    put(hk["fill"] - 0.1, whoosh(it["start"] - hk["fill"] + 0.2, 400, 4800, peak=0.9, q=0.7), 0.28)

    # ── intro: orange collapses into the logo
    put(it["start"], whoosh(it["collapse"] - it["start"] + 0.1, 3800, 500, peak=0.3), 0.26)
    for j, b in enumerate(it["bars"]):
        put(b, pop(900 + j * 200, 500 + j * 120), 0.22, -0.2 + j * 0.2)
    put(it["title"], blip(NOTES[2], dur=0.4), 0.16)
    put(it["title"] + 0.14, blip(NOTES[4], dur=0.4), 0.16)
    put(it["tagline"], chime([NOTES[0], NOTES[2] * 1.0, NOTES[4], NOTES[6]], dur=1.8, tau=0.6), 0.10)

    # ── sections: arrow wipe in, label words, chips, cuts inside the phone
    for n, s0 in enumerate(secs + [ds["start"], hr["start"]]):
        put(s0 - 0.45, whoosh(0.75, 600, 4200, peak=0.6, q=0.8), 0.24, 0.6)
        put(s0 - 0.05, whoosh(0.45, 3200, 700, peak=0.3), 0.12, -0.5)
    for n, s0 in enumerate(secs):
        put(s0 + 0.38, blip(NOTES[n % 4 + 1] / 2, dur=0.3, tau=0.08), 0.18, 0.4)
        put(s0 + 0.5, blip(NOTES[n % 4 + 3] / 2, dur=0.35, tau=0.1), 0.16, 0.4)
        for j in range(2):
            put(s0 + 0.95 + j * 0.2, pop(1300 + j * 220, 700), 0.16, 0.3 + j * 0.2)
        put(s0 + 1.4, click(2200), 0.07, 0.4)

    # ── designs: posters land one by one
    for j in range(9):
        put(ds["cards"] + j * 0.16 + 0.12, pop(500 + j * 60, 200, dur=0.12), 0.16, (j % 3 - 1) * 0.5)
    put(ds["label"] + 0.12, blip(NOTES[3] / 2, dur=0.4), 0.16)

    # ── hero: wall reveals, title, style chips, riser into the crash
    put(hr["start"] + 0.1, whoosh(hr["zoomEnd"] - hr["start"], 2400, 300, peak=0.5, q=0.6), 0.24)
    for j in range(19):
        put(hr["start"] + 0.25 + j * 0.06, click(2600 + (j % 5) * 200, dur=0.03), 0.06, (j % 5 - 2) * 0.4)
    put(hr["title"], blip(NOTES[2], dur=0.4), 0.18)
    put(hr["sub"], whoosh(0.35, 500, 2600, peak=0.6), 0.16)
    put(hr["sub"] + 0.15, chime([NOTES[0], NOTES[2], NOTES[4]], dur=1.4, tau=0.5), 0.12)
    for j in range(10):
        put(hr["styles"] + j * 0.11, pop(1100 + j * 90, 600 + j * 40), 0.13, -0.6 + j * 0.13)
    put(hr["crash"] - 1.3, riser(of["countEnd"] - hr["crash"] + 1.3, 220, 5200), 0.24)
    put(hr["crash"], whoosh(hr["end"] - hr["crash"] + 0.1, 300, 5200, peak=0.9, q=0.6), 0.3)

    # ── offer: count ticks speed up, the single impact when 300 lands
    n_ticks = 16
    for j in range(n_ticks):
        x = j / n_ticks
        tj = of["count"] + (of["countEnd"] - of["count"]) * (1 - (1 - x) ** 2)
        put(tj, click(1500 + j * 60, dur=0.03), 0.12)
    put(of["from"], blip(NOTES[1] / 2, dur=0.35), 0.16)
    put(of["countEnd"], impact(1.4), 0.42)
    put(of["countEnd"], chime([NOTES[0], NOTES[2], NOTES[4], NOTES[7]], dur=2.2, tau=0.8), 0.14)
    put(of["egp"], pop(700, 300), 0.18)
    put(of["end"] - 0.45, whoosh(0.5, 400, 3600, peak=0.8), 0.26)

    # ── cta
    put(ct["line1"], whoosh(0.3, 600, 2800, peak=0.5), 0.14)
    put(ct["line1"] + 0.14, blip(NOTES[2] / 2, dur=0.35), 0.18)
    for j, c in enumerate(ct["chips"]):
        put(c, pop(1200 + j * 250, 700), 0.2, -0.3 + j * 0.6)
    put(ct["wa"], pop(1500, 800), 0.26)
    put(ct["wa"] + 0.03, blip(NOTES[5], dur=0.5), 0.12)
    put(ct["logo"], whoosh(0.5, 400, 2400, peak=0.6), 0.16)
    for j in range(3):
        put(ct["logo"] + 0.2 + j * 0.1, pop(900 + j * 200, 500), 0.18, -0.2 + j * 0.2)
    put(ct["logo"] + 0.6, chime([NOTES[0] / 2, NOTES[2] / 2, NOTES[4] / 2, NOTES[0], NOTES[4]], dur=3.0, tau=1.2), 0.16)
