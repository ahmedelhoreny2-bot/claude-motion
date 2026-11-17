"""Sound for NurseryAd: a playful ukulele/glockenspiel bed in D major plus UI accents.
Every time comes from src/nursery/timeline.json.

    python3 -m sfx sfx/cues/nursery.py
"""

import math
import random
import subprocess

import numpy as np

from sfx.synth import SR, chime, pop, whoosh

TIMELINE = "src/nursery/timeline.json"
OUT = "public/nursery.wav"
TARGET_LUFS = -14.0

BPM = 110
BEAT = 60 / BPM
BAR = 4 * BEAT

# I - V - vi - IV in D major, ukulele-style voicings (Hz) and bass roots.
CHORDS = [
    ([293.66, 369.99, 440.00, 587.33], 73.42),   # D
    ([277.18, 329.63, 440.00, 554.37], 110.00),  # A
    ([293.66, 369.99, 493.88, 587.33], 123.47),  # Bm
    ([293.66, 392.00, 493.88, 587.33], 98.00),   # G
]
# Glockenspiel motif per chord (scale degrees as Hz, one octave up), on beats 1, 2, 3, 3.5.
MOTIF = [
    [1174.66, 1479.98, 1760.00, 1479.98],
    [1108.73, 1318.51, 1760.00, 1318.51],
    [1174.66, 1479.98, 1975.53, 1760.00],
    [1174.66, 1567.98, 1975.53, 1479.98],
]
POPS = [1174.66, 1318.51, 1479.98, 1760.00, 1975.53, 2349.32]


def pluck(freq, dur=0.9, bright=0.55):
    """Karplus-Strong string: a ukulele note."""
    decay = 0.996 if dur < 2 else 0.9993
    n = int(dur * SR)
    p = max(2, int(SR / freq))
    buf = np.random.uniform(-1, 1, p)
    out = np.empty(n)
    idx = 0
    prev = 0.0
    for k in range(n):
        v = buf[idx]
        nxt = buf[(idx + 1) % p]
        buf[idx] = decay * (bright * v + (1 - bright) * 0.5 * (v + nxt))
        out[k] = v
        idx = (idx + 1) % p
        prev = v
    out *= np.minimum(1, np.arange(n) / (0.002 * SR))
    return out


def glock(freq, dur=1.2):
    t = np.arange(int(dur * SR)) / SR
    a = np.minimum(1, t / 0.002) * np.exp(-t / 0.35)
    return a * (np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t / 0.08))


def kick():
    t = np.arange(int(0.3 * SR)) / SR
    f = 48 + 90 * np.exp(-t / 0.04)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / 0.12)


def clap(rng):
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    x = rng.uniform(-1, 1, n)
    x = x - np.concatenate([[0], x[:-1]])  # crude highpass
    env = np.exp(-t / 0.05) * (1 + 0.6 * np.exp(-((t - 0.012) ** 2) / 1e-5))
    return x * env * 0.5


def shaker(rng):
    n = int(0.07 * SR)
    t = np.arange(n) / SR
    x = rng.uniform(-1, 1, n)
    x = x - np.concatenate([[0], x[:-1]])
    return x * np.sin(np.pi * t / t[-1]) ** 2 * 0.25


def bass(freq, dur):
    t = np.arange(int(dur * SR)) / SR
    a = np.minimum(1, t / 0.01) * np.exp(-t / 0.5)
    return a * (np.sin(2 * np.pi * freq * t) + 0.2 * np.sin(4 * np.pi * freq * t))


def add(dst, src, t, g):
    i = int(t * SR)
    if i >= len(dst):
        return
    m = min(len(src), len(dst) - i)
    dst[i:i + m] += src[:m] * g


def music(tl):
    """Return (left, right) numpy arrays for the whole bed."""
    rng = np.random.default_rng(7)
    np.random.seed(7)
    n = int(tl["duration"] * SR)
    L, R = np.zeros(n), np.zeros(n)
    groove_in = tl["s2"]["logo"]
    final = tl["s8"]["slogan"]
    end = tl["duration"]
    nbars = int(math.ceil(end / BAR))
    strum = [0, 2, 3, 5, 6, 7]  # island strum on eighths
    pluck_cache = {}
    k_s, c_s = kick(), None
    for b in range(nbars):
        t0 = b * BAR
        if t0 >= final - 0.05:
            break
        last = False
        notes, root = CHORDS[b % 4]
        full = t0 + BAR > groove_in
        # ukulele strums
        hits = [0] if last else strum
        for j in hits:
            tt = t0 + j * BEAT / 2
            if tt >= final - 0.05:
                continue
            up = j % 2 == 1
            order = notes[::-1] if up else notes
            for q, f in enumerate(order):
                key = (f, last)
                if key not in pluck_cache:
                    pluck_cache[key] = pluck(f, 3.0 if last else 0.9)
                g = (0.16 if up else 0.22) * (1.0 if full else 0.9)
                pan = -0.25 + q * 0.04
                add(L, pluck_cache[key], tt + q * 0.009, g * (1 - pan) / 2 * 1.4)
                add(R, pluck_cache[key], tt + q * 0.009, g * (1 + pan) / 2 * 1.4)
        # glock melody
        if not last:
            for j, f in enumerate(MOTIF[b % 4]):
                tt = t0 + [0, 1, 2, 2.5][j] * BEAT
                if tt >= final - 0.05:
                    continue
                gl = glock(f)
                add(L, gl, tt, 0.05 * (0.8 if b % 2 else 1))
                add(R, gl, tt, 0.07 * (0.8 if b % 2 else 1))
        else:
            for j, f in enumerate([1174.66, 1479.98, 1760.0, 2349.32]):
                gl = glock(f, 2.5)
                add(L, gl, t0 + j * 0.08, 0.06)
                add(R, gl, t0 + j * 0.08, 0.07)
        if not full:
            for e in range(8):
                add(R, shaker(rng), t0 + e * BEAT / 2, 0.05 if e % 2 else 0.03)
            continue
        # bass + drums
        bl = bass(root, BEAT * (4 if last else 1.8))
        for beat in ([0] if last else [0, 2]):
            if t0 + beat * BEAT >= final - 0.05:
                continue
            add(L, bl, t0 + beat * BEAT, 0.3)
            add(R, bl, t0 + beat * BEAT, 0.3)
            add(L, k_s, t0 + beat * BEAT, 0.3)
            add(R, k_s, t0 + beat * BEAT, 0.3)
        if last:
            continue
        for beat in (1, 3):
            if t0 + beat * BEAT >= final - 0.05:
                continue
            c_s = clap(rng)
            add(L, c_s, t0 + beat * BEAT, 0.16)
            add(R, c_s, t0 + beat * BEAT, 0.13)
        for e in range(8):
            if t0 + e * BEAT / 2 >= final - 0.05:
                continue
            sh = shaker(rng)
            g = 0.10 if e % 2 else 0.05
            add(L, sh, t0 + e * BEAT / 2, g * 0.6)
            add(R, sh, t0 + e * BEAT / 2, g)
    # final D chord lands on the slogan and rings to the end
    for q, f in enumerate([146.83, 293.66, 369.99, 440.0, 587.33]):
        pl = pluck(f, end - final, bright=0.7)
        add(L, pl, final + q * 0.03, 0.2)
        add(R, pl, final + q * 0.03, 0.2)
    for j, f in enumerate([1174.66, 1479.98, 1760.0, 2349.32]):
        gl = glock(f, 3.0)
        add(L, gl, final + 0.12 + j * 0.12, 0.06)
        add(R, gl, final + 0.12 + j * 0.12, 0.08)
    add(L, kick(), final, 0.35)
    add(R, kick(), final, 0.35)
    add(L, bass(73.42, 3.5), final, 0.3)
    add(R, bass(73.42, 3.5), final, 0.3)
    # fade out the tail
    fade = int(1.2 * SR)
    ramp = np.linspace(1, 0, fade)
    L[-fade:] *= ramp
    R[-fade:] *= ramp
    return L, R


def decode(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def voiceover(tl):
    """Narration cut from the ElevenLabs takes at their pauses, placed per tl['vo']."""
    n = int(tl["duration"] * SR)
    vo = np.zeros(n)
    duck = np.ones(n)
    cache = {}
    for c in tl["vo"]:
        if c["src"] not in cache:
            cache[c["src"]] = decode(c["src"])
        x = cache[c["src"]][int(c["in"] * SR):int(c["out"] * SR)].copy()
        f = int(0.012 * SR)
        x[:f] *= np.linspace(0, 1, f)
        x[-f:] *= np.linspace(1, 0, f)
        add(vo, x, c["at"], 1.0)
        a, b = int((c["at"] - 0.15) * SR), int((c["at"] + len(x) / SR + 0.1) * SR)
        duck[max(a, 0):min(b, n)] = 0.32
    # smooth the ducking so the bed breathes instead of switching
    k = int(0.25 * SR)
    duck = np.convolve(duck, np.ones(k) / k, mode="same")
    return vo, duck


def score(mix, tl):
    random.seed(3)
    L, R = music(tl)
    vo, duck = voiceover(tl)
    mix.put_stereo(0, (L * duck).tolist(), (R * duck).tolist(), gain=0.55)
    mix.put_stereo(0, vo.tolist(), vo.tolist(), gain=1.3)

    put = mix.put
    W = tl["wipe"]
    exits = [tl[f"s{i}"]["exit"] for i in range(1, 8)]
    for i, e in enumerate(exits):
        put(e, whoosh(W + 0.25, 300, 3200, peak=0.6), 0.22, -0.3 + 0.1 * i)
        put(e + W + 0.05, whoosh(0.45, 2600, 500, peak=0.3), 0.10, 0.3)

    def pops(times, base=0, gain=0.22, pan0=-0.3):
        for i, t in enumerate(times):
            f = POPS[(base + i) % len(POPS)]
            put(t, pop(f * 0.6, f), gain, pan0 + 0.15 * i)

    s1, s2, s3, s4, s5, s6, s7, s8 = (tl[f"s{i}"] for i in range(1, 9))
    pops([s1["l1"], s1["l2"], s1["l3"]])
    put(s2["logo"], chime([587.33, 739.99, 880.0, 1174.66], dur=2.2, tau=0.8), 0.22)
    put(s2["logo"] - 0.05, whoosh(0.5, 400, 3000, peak=0.7), 0.12)
    pops([s2["tag"], s2["notJust"]] + s2["chips"], base=1)
    pops([s3["head"], s3["card"]] + s3["items"], gain=0.2)
    put(s3["swap"], whoosh(0.5, 800, 2400, peak=0.5), 0.08)
    pops([s4["head"], s4["card"]] + s4["items"], gain=0.2)
    pops([s5["day"], s5["recite"], s5["play"]], base=2)
    pops(s5["polas"] + [s5["line"]], base=1)
    pops([s6["head"], s6["am"], s6["pm"]], base=2)
    pops([s7["head"]] + s7["items"], gain=0.2)
    pops([s8["logo"], s8["cta"], s8["phone"], s8["wa"], s8["addr"]], base=0)
    put(s8["slogan"], chime([587.33, 880.0, 1174.66, 1479.98], dur=2.6, tau=1.0), 0.2)
