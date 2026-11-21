"""Sound for a talking-head reel: the speaker's voice, an optional humming bed, quiet accents.

    python3 -m sfx sfx/cues/talk.py
"""

import os
import struct
import wave

from sfx.synth import blip, chime, envelope, impact, pop, whoosh

TIMELINE = "src/talk/timeline.json"
OUT = "public/talk/mix.wav"
TARGET_LUFS = -14.0

NOTES = [880.0, 987.77, 1174.66, 1318.51, 1567.98]


def load(path):
    with wave.open(path) as w:
        raw = w.readframes(w.getnframes())
    n = len(raw) // 2
    return [s / 32768 for s in struct.unpack(f"<{n}h", raw)]


def bed(dur):
    """Optional humming bed (public/talk/hum48.wav), looped, faded at both ends."""
    if not os.path.exists("public/talk/hum48.wav"):
        return None
    x = load("public/talk/hum48.wav")
    need = int(dur * 48000)
    out = (x * (need // len(x) + 1))[:need]
    fade = 2 * 48000
    for i in range(fade):
        out[i] *= i / fade
        out[-1 - i] *= i / fade
    return out


def score(mix, tl):
    put = mix.put
    put(0, load("public/talk/voice48.wav"), 1.0)
    b = bed(tl["duration"])
    if b:
        e = tl["end"]["in"]
        lvl = envelope([(0, 0.16), (tl["hook"]["out"], 0.16), (tl["hook"]["out"] + 1.0, 0.12), (e - 0.3, 0.12), (e + 0.6, 0.4), (tl["duration"], 0.4)])
        put(0, [v * lvl(i / 48000) for i, v in enumerate(b)], 1.0)

    put(0.0, impact(1.2), 0.09)
    put(0.0, whoosh(0.8, 2400, 300, peak=0.15), 0.08)
    put(tl["hook"]["answer"], pop(900, 400), 0.09)

    for a, b2, _ in tl["rings"]:
        put(a - 0.3, whoosh(1.0, 300, 1800, peak=0.5), 0.06, -0.3)
    put(tl["rings"][1][0], chime([440.0, 659.25, 880.0, 1318.51], dur=2.6, tau=1.0), 0.08)

    for at, kind in tl["transitions"]:
        if kind == "ink_in":
            put(at - 0.05, whoosh(0.8, 1800, 400, peak=0.35, q=0.6), 0.09, 0.3)
        elif kind == "tear_out":
            put(at, whoosh(0.5, 900, 4000, peak=0.2, q=0.4), 0.08, -0.3)
        else:
            put(at - 0.3, whoosh(1.1, 200, 1400, peak=0.5), 0.05)

    for i, (_, a, _, mode, _) in enumerate(tl["imgs"]):
        if mode == "behind":
            put(a, pop(700 + (i % 5) * 120, 300 + (i % 5) * 50), 0.07, -0.4 + (i % 5) * 0.2)
    put(tl["remedyTitle"], blip(NOTES[3], dur=0.5, tau=0.15), 0.07)
    for j in range(3):
        put(63.35 + j * 0.95, blip(NOTES[j + 1], dur=0.6, tau=0.2), 0.06)

    e = tl["end"]["in"]
    put(e - 0.1, whoosh(0.9, 200, 1600, peak=0.5), 0.08)
    put(e + 0.2, chime([440.0, 659.25, 880.0, 1108.73], dur=3.0, tau=1.1), 0.09)
    put(e + 1.2, pop(900, 380), 0.09)
