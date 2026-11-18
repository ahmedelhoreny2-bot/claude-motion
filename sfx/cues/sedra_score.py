"""Music + SFX for SedraAd, built with numpy and timed from src/sedra/words.json.

    python3 sfx/cues/sedra_score.py   ->  public/sedra/score.wav (stereo, 44.1 kHz, unmastered)

90 BPM. D minor while the warning plays, D major from "المشكلة في مين بيعملها",
full groove from the logo hit, a lift into the call to action.
"""
import json
import wave

import numpy as np

SR = 44100
rng = np.random.default_rng(7)
W = json.load(open("src/sedra/words.json"))
T = lambda i: W[i]["s"]
DUR = W[-1]["e"] + 3.0
N = int(DUR * SR)
L = np.zeros(N)
R = np.zeros(N)

BPM = 90
BEAT = 60 / BPM
BAR = 4 * BEAT

# beats from the voice
CLEAN = T(37)       # "المشكلة في مين بيعملها" -> major
HIT = T(78)         # "مركز سدرة" -> logo
SERVICES = T(132)
WOMEN = T(148)
DAYS = T(175)
CTA = T(186)


def note(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def put(sig, t, gain=1.0, pan=0.0):
    i0 = int(t * SR)
    if i0 >= N:
        return
    sig = sig[: N - i0]
    a = (pan + 1) * np.pi / 4
    L[i0:i0 + len(sig)] += sig * gain * np.cos(a)
    R[i0:i0 + len(sig)] += sig * gain * np.sin(a)


def lowpass(sig, fc):
    spec = np.fft.rfft(sig)
    f = np.fft.rfftfreq(len(sig), 1 / SR)
    spec *= 1 / np.sqrt(1 + (f / fc) ** 4)
    return np.fft.irfft(spec, len(sig))


def bandpass(sig, lo, hi):
    spec = np.fft.rfft(sig)
    f = np.fft.rfftfreq(len(sig), 1 / SR)
    spec *= (1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4)) * (1 / np.sqrt(1 + (f / hi) ** 4))
    return np.fft.irfft(spec, len(sig))


def env(n, a=0.005, d=0.3, curve=1.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d) ** curve
    return e


def piano(m, dur=1.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = note(m)
    s = sum((0.6 / k ** 1.4) * np.sin(2 * np.pi * f * k * (1 + 0.0004 * k * k) * t) * np.exp(-t * (1.6 + k * 0.9)) for k in range(1, 7))
    return s * np.minimum(1, t / 0.004)


def pad_chord(ms, dur, bright=1800):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for m in ms:
        for det in (-0.12, 0.0, 0.12):
            f = note(m + det)
            ph = rng.random() * 2 * np.pi
            s += ((2 * ((f * t + ph / 6.28) % 1) - 1)) * 0.18
    s = lowpass(s, bright)
    fade = min(0.8, dur / 3)
    e = np.minimum(1, t / fade) * np.minimum(1, (dur - t) / fade)
    return s * e / len(ms)


def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 48 + 90 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * 1.0


def snare():
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    nz = bandpass(rng.standard_normal(n), 900, 7000) * np.exp(-t * 16)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25) * 0.4
    return (nz * 0.5 + body)


def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR)
    t = np.arange(n) / SR
    return bandpass(rng.standard_normal(n), 6000, 15000) * np.exp(-t * (12 if open_ else 70)) * 0.5


def sub(m, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * note(m) * t) + 0.25 * np.sin(4 * np.pi * note(m) * t)
    return s * np.minimum(1, t / 0.01) * np.exp(-t * 1.2)


def whoosh(dur, up=True):
    n = int(dur * SR)
    t = np.arange(n) / SR
    k = t / dur
    nz = rng.standard_normal(n)
    out = np.zeros(n)
    seg = 2048
    for i in range(0, n, seg):
        kk = k[i]
        fc = 300 + (5200 if up else 3000) * (kk if up else 1 - kk)
        out[i:i + seg] = bandpass(nz[i:i + seg], fc * 0.5, fc * 2)[: len(out[i:i + seg])]
    shape = np.sin(np.pi * np.clip(k, 0, 1)) ** 2
    return out * shape


def riser(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    k = t / dur
    f = 180 * 2 ** (k * 4)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    return (whoosh(dur) * 0.8 + tone) * k ** 2


def impact():
    n = int(2.2 * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t * 9)) / SR) * np.exp(-t * 2.2)
    crash = bandpass(rng.standard_normal(n), 2500, 14000) * np.exp(-t * 2.5) * 0.25
    return boom + crash


def tick():
    n = int(0.04 * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * 2600 * t) * np.exp(-t * 120)


def pop(f0):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    f = f0 * (1 + 0.6 * np.exp(-t * 60))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30)


def chime(ms):
    return sum(piano(m + 12, 2.5) for m in ms) * 0.5


D, F, G, A, B = 62, 65, 67, 69, 71  # D4 F4 G4 A4 B4

# --- A: tension, D minor (0 -> CLEAN) ------------------------------------
put(pad_chord([D - 12, A - 12, D, F], CLEAN + 1.0, bright=900), 0, 0.55)
t = 0.0
while t < CLEAN:
    put(tick(), t, 0.05, 0.3)
    put(tick(), t + BEAT / 2, 0.025, -0.3)
    t += BEAT
t = 0.0
while t < CLEAN - 0.2:
    put(sub(D - 24, 1.2), t, 0.35)
    t += BAR / 2
put(impact(), T(5), 0.35)          # "مين قبلك؟"
put(impact(), T(28), 0.3)          # "فيروس"
put(whoosh(0.5), T(13) - 0.35, 0.25)
put(whoosh(0.5), T(26) - 0.35, 0.25)

# --- B: release, D major (CLEAN -> HIT) ----------------------------------
put(whoosh(0.9), CLEAN - 0.6, 0.3)
put(chime([D, F + 1, A]), CLEAN + 0.05, 0.35)
prog_b = [[D, F + 1, A], [G - 12, B - 12, D], [B - 12, D, F + 1], [A - 12, D - 1 + 2, F + 1 - 1 + 1]]
t, i = CLEAN, 0
while t < HIT - 0.1:
    ch = prog_b[i % 4]
    put(pad_chord([m - 12 for m in ch] + ch, BAR + 0.6, 1600), t, 0.5)
    for k in range(8):
        tt = t + k * BEAT / 2
        if tt < HIT - 0.3:
            put(piano(ch[k % 3] + (12 if k >= 4 else 0)), tt, 0.16, -0.3 + 0.2 * (k % 4))
    t += BAR
    i += 1
put(riser(2.4), HIT - 2.4, 0.4)

# --- C: groove from the logo hit (HIT -> DAYS) ---------------------------
put(impact(), HIT, 0.55)
put(chime([D, F + 1, A, D + 12]), HIT, 0.4)
prog_c = [[D, F + 1, A], [G - 12, B - 12, D], [B - 12, D, F + 1], [A - 12, 61, 64]]
roots = [D - 24, G - 24, B - 24, A - 24]
t, i = HIT, 0
while t < DAYS - 0.05:
    ch = prog_c[i % 4]
    bright = 1400 if WOMEN <= t < WOMEN + 3 else 2400
    put(pad_chord([m - 12 for m in ch] + ch, BAR + 0.6, bright), t, 0.38)
    put(sub(roots[i % 4], BAR), t, 0.32)
    for b in range(4):
        tb = t + b * BEAT
        if tb >= DAYS:
            break
        quiet = WOMEN <= tb < WOMEN + 2.6
        if not quiet:
            if b in (0, 2):
                put(kick(), tb, 0.55)
            if b in (1, 3):
                put(snare(), tb, 0.18)
            for h in range(2):
                put(hat(), tb + h * BEAT / 2, 0.06 if h else 0.04, 0.4)
        for k in range(2):
            put(piano(ch[(b * 2 + k) % 3] + 12), tb + k * BEAT / 2, 0.09, -0.4 + 0.25 * b)
    t += BAR
    i += 1

# --- D: lift into the CTA ------------------------------------------------
put(whoosh(0.8), DAYS - 0.5, 0.3)
t, i = DAYS, 0
lift = [[G - 12, B - 12, D], [A - 12, 61, 64], [D, F + 1, A], [D, F + 1, A]]
while t < DUR:
    ch = lift[min(i, 3)]
    put(pad_chord([m - 12 for m in ch] + ch + [ch[0] + 12], min(BAR + 0.6, DUR - t), 2800), t, 0.42)
    put(sub([G - 24, A - 24, D - 24, D - 24][min(i, 3)], BAR), t, 0.3)
    for b in range(4):
        tb = t + b * BEAT
        if tb > DUR - 2.5:
            break
        if b in (0, 2):
            put(kick(), tb, 0.5)
        if b in (1, 3):
            put(snare(), tb, 0.2)
        put(hat(open_=(b == 3)), tb + BEAT / 2, 0.06, 0.4)
    t += BAR
    i += 1
for k, idx in enumerate((178, 179, 180)):
    put(pop(700 + 180 * k), T(idx), 0.35, (k - 1) * 0.4)
put(riser(1.6), CTA - 1.6, 0.3)
put(impact(), CTA, 0.4)
put(chime([D, F + 1, A, D + 12]), CTA, 0.35)

# --- scene cuts: soft whooshes and pops --------------------------------------
for idx in (42, 58, 83, 91, 101, 114, 148, 154):
    put(whoosh(0.45), T(idx) - 0.3, 0.16, 0.2)
for k, idx in enumerate((132, 134, 136, 138, 140, 142, 143)):
    put(whoosh(0.3), T(idx) - 0.15, 0.12, -0.4 + 0.13 * k)
    put(pop(600 + 70 * k), T(idx), 0.18, -0.4 + 0.13 * k)
for k, idx in enumerate((159, 161, 165, 171)):
    put(pop(520 + 60 * k), T(idx), 0.18, 0.3)
put(pop(900), T(121), 0.25, 0.3)
put(pop(1000), T(121) + 0.25, 0.25, -0.3)
put(pop(800), T(61), 0.25)
put(pop(1100), T(70), 0.3)

# fade out, normalize, write
fade = int(1.5 * SR)
L[-fade:] *= np.linspace(1, 0, fade)
R[-fade:] *= np.linspace(1, 0, fade)
peak = max(np.abs(L).max(), np.abs(R).max())
st = np.stack([L, R], 1) / peak * 0.8
pcm = (st * 32767).astype("<i2").tobytes()
with wave.open("public/sedra/score.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm)
print(f"wrote public/sedra/score.wav ({DUR:.1f}s)")
