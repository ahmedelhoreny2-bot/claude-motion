"""Sound for the talking-head reel: cold open on the punchline, a rewind, then the talk.
Voice is re-cut to match the picture edit; a humming bed and quiet accents sit under it.

    python3 -m sfx sfx/cues/talk.py
"""

import os
import struct
import wave

from sfx.synth import blip, chime, envelope, impact, pop, scratch, whoosh

TIMELINE = "src/talk/timeline.json"
OUT = "public/talk/mix.wav"
TARGET_LUFS = -14.0
SR = 48000


def load(path):
    with wave.open(path) as w:
        raw = w.readframes(w.getnframes())
    n = len(raw) // 2
    return [s / 32768 for s in struct.unpack(f"<{n}h", raw)]


def faded(x, ms=25):
    n = int(SR * ms / 1000)
    x = list(x)
    for i in range(min(n, len(x))):
        x[i] *= i / n
        x[-1 - i] *= i / n
    return x


def score(mix, tl):
    put = mix.put
    e = tl["edit"]
    hl, rw = e["hookLen"], e["rewind"]
    off = hl + rw - e["bodySrc"]
    o = lambda s: s + off  # source seconds -> output seconds
    voice = load("public/talk/voice48.wav")

    # cold open: the punchline
    a = int(e["hookSrc"] * SR)
    put(0, faded(voice[a:a + int(hl * SR)]), 1.0)
    put(0.08, impact(1.4), 0.07)
    put(0.0, chime([440.0, 659.25, 880.0, 1318.51], dur=2.4, tau=0.9), 0.06)
    # rewind back to the top
    put(hl - 0.05, whoosh(rw + 0.2, 3200, 220, peak=0.35, q=0.7), 0.12)
    put(hl + rw * 0.5, whoosh(0.5, 400, 2600, peak=0.6), 0.05)
    # the talk
    put(hl + rw, faded(voice[int(e["bodySrc"] * SR):]), 1.0)

    if os.path.exists("public/talk/hum48.wav"):
        hum = load("public/talk/hum48.wav")
        dur = tl["duration"]
        need = int(dur * SR)
        hum = (hum * (need // len(hum) + 1))[:need]
        end = o(tl["end"]["in"])
        lvl = envelope([(0, 0.0), (0.6, 0.12), (hl, 0.12), (hl + rw, 0.05), (hl + rw + 1.5, 0.12),
                        (end - 0.3, 0.12), (end + 0.6, 0.4), (dur - 0.3, 0.4), (dur, 0)])
        put(0, [v * lvl(i / SR) for i, v in enumerate(hum)], 1.0)

    # pictures as their own frames
    cuts = tl["cuts"]
    for i, (a, b, files) in enumerate(cuts):
        put(o(a) - 0.05, whoosh(0.55, 2500, 6500, peak=0.45, q=0.5), 0.07, 0.4)
        put(o(a), scratch(0.4), 0.06, 0.3)
        if len(files) > 1:
            for j in range(len(files)):
                put(o(a) + 0.15 + j * 0.18, pop(800 + j * 140, 320 + j * 60), 0.05, -0.4 + j * 0.25)
            put(o(a) + 0.5, chime([880.0, 1318.51, 1760.0], dur=1.6, tau=0.6), 0.05)
        if i + 1 == len(cuts) or cuts[i + 1][0] != b:
            put(o(b), whoosh(0.55, 6000, 2500, peak=0.45, q=0.5), 0.06, -0.4)
            put(o(b) + 0.05, scratch(0.35), 0.05, -0.3)
    # word belts around the head
    for a, b, _, _ in tl["rings"]:
        put(o(a) - 0.4, whoosh(1.1, 300, 2000, peak=0.55, q=0.6), 0.05, -0.3)
        put(o(a) + 0.15, chime([880.0, 1318.51], dur=1.4, tau=0.5), 0.04)
    for s in tl["shakes"]:
        put(o(s), impact(0.9), 0.04)

    for i, (a, _, _, side) in enumerate(tl["icons"]):
        put(o(a), pop(900 + (i % 4) * 120, 420), 0.06, 0.5 if side == "R" else -0.5)
        put(o(a) + 0.03, blip(1174.66 + (i % 3) * 150, dur=0.35, tau=0.1), 0.03, 0.5 if side == "R" else -0.5)
    end = o(tl["end"]["in"])
    put(end + 0.55, impact(0.7), 0.06)
    put(end - 0.1, whoosh(0.9, 200, 1600, peak=0.5), 0.07)
    put(end + 0.2, chime([440.0, 659.25, 880.0, 1108.73], dur=3.0, tau=1.1), 0.08)
    put(end + 1.2, pop(900, 380), 0.08)
