"""Sound for the talking-head reel: the speaker's voice plus quiet accents. No music bed.

    python3 -m sfx sfx/cues/talk.py
"""

import struct
import wave

from sfx.synth import blip, chime, click, impact, pop, whoosh

TIMELINE = "src/talk/timeline.json"
OUT = "public/talk/mix.wav"
TARGET_LUFS = -14.0

# A minor pentatonic, soft and warm
NOTES = [880.0, 987.77, 1174.66, 1318.51, 1567.98]


def voice():
    with wave.open("public/talk/voice48.wav") as w:
        raw = w.readframes(w.getnframes())
    n = len(raw) // 2
    return [s / 32768 for s in struct.unpack(f"<{n}h", raw)]


def bed(dur):
    """Optional humming bed (public/talk/hum48.wav), looped, low under the voice."""
    import os
    if not os.path.exists("public/talk/hum48.wav"):
        return None
    with wave.open("public/talk/hum48.wav") as w:
        raw = w.readframes(w.getnframes())
    n = len(raw) // 2
    x = [v / 32768 for v in struct.unpack(f"<{n}h", raw)]
    need = int(dur * 48000)
    out = (x * (need // len(x) + 1))[:need]
    fade = int(2.0 * 48000)
    for i in range(fade):
        out[i] *= i / fade
        out[-1 - i] *= i / fade
    return out


def score(mix, tl):
    put = mix.put
    put(0, voice(), 1.0)
    b = bed(tl["duration"])
    if b:
        put(0, b, 0.11)

    hk = tl["hook"]
    put(0.0, impact(1.2), 0.10)
    put(0.0, whoosh(0.8, 2400, 300, peak=0.15), 0.08)
    put(hk["answer"], pop(900, 400), 0.09)
    put(tl["intro"]["badge"], pop(700, 300), 0.10, 0.5)
    for s in tl["sections"]:
        put(s - 0.15, whoosh(0.7, 300, 2400, peak=0.4), 0.07)
    put(tl["hadith"]["in"], pop(900, 400), 0.08)

    h = tl["hero"]["in"]
    put(h - 0.05, chime([440.0, 659.25, 880.0, 1318.51], dur=2.6, tau=1.0), 0.09)
    put(h - 0.2, whoosh(1.0, 200, 1200, peak=0.6), 0.06)

    m = tl["machine"]
    for i, k in enumerate(("in", "car", "gear")):
        put(m[k], pop(800 + i * 160, 320 + i * 60), 0.09, [0.35, 0, -0.35][i])
    for i in range(6):
        put(m["gear"] + 0.3 + i * 0.22, click(2200), 0.03, -0.35)
    put(m["fix"], pop(1200, 600), 0.07)
    put(m["maker"] + 0.05, whoosh(0.6, 2600, 700, peak=0.5), 0.07, 0.3)
    put(m["maker"] + 0.6, blip(NOTES[3], dur=0.5, tau=0.15), 0.07)

    n = tl["names"]
    for i in range(3):
        put(n["in"] + i * n["step"], blip(NOTES[i + 1], dur=0.6, tau=0.2), 0.07)

    put(tl["final"]["in"], chime([1318.51, 1760.0], dur=1.4, tau=0.5), 0.06)
    put(tl["body"]["in"], pop(700, 300), 0.07)

    r = tl["remedies"]
    for i, a in enumerate(r["items"]):
        put(a, pop(760 + i * 140, 300 + i * 60), 0.09, -0.4 + i * 0.2)
        put(a + 0.02, blip(NOTES[i], dur=0.4, tau=0.12), 0.05)
    put(r["items"][1] + 0.15, chime([880.0, 1318.51, 1760.0], dur=1.6, tau=0.6), 0.06)
    put(r["title"], pop(900, 400), 0.08)

    e = tl["end"]["in"]
    put(e - 0.1, whoosh(0.9, 200, 1600, peak=0.5), 0.08)
    put(e + 0.25, chime([440.0, 659.25, 880.0, 1108.73], dur=3.0, tau=1.1), 0.10)
    put(e + 1.25, pop(900, 380), 0.10)
    put(e + 2.2, pop(1100, 500), 0.08)
