"""Sound for SedraTalk: soft and sparse, so nothing competes with the sheikh's voice. No music.

    python3 sfx/cues/talk_score.py  ->  public/sedra/raw/talk_sfx.wav

Only three sounds: a slow airy swell as each card fades in, a warm low bell on the
"صدق الله وكذبت بطن أخيك" cards and the close, and a faint room tone under everything.
"""
import json
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(5)
E = json.load(open("src/talk/edl.json", encoding="utf-8"))
WD = E["words"]
DUR = E["duration"] + 5.0
N = int(DUR * SR)
L = np.zeros(N)
R = np.zeros(N)
by_src = {}
for w in WD:
    by_src.setdefault(w["src"], []).append(w["s"])
at = lambda src, occ=-1: by_src[src][occ]


def put(sig, t, gain=1.0, pan=0.0):
    i0 = int(t * SR)
    if i0 >= N or t < 0:
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


def swell(dur=1.2):
    """Soft air rising and settling — no transient."""
    n = int(dur * SR)
    k = np.arange(n) / n
    s = lowpass(rng.standard_normal(n), 1400)
    return s * np.sin(np.pi * k) ** 3


def bell(f0=196.0, dur=3.5):
    """Warm low bell, slow decay."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f0 * m * t) * np.exp(-t * d) for m, a, d in ((1, 1.0, 1.0), (2.01, 0.35, 1.6), (3.0, 0.15, 2.4)))
    return s * np.minimum(1, t / 0.02)


L += lowpass(rng.standard_normal(N), 500) * 0.006
R += lowpass(rng.standard_normal(N), 500) * 0.006

for src in (7, 16, 48, 66, 80, 100, 121, 157, 170, 196, 200, 221, 267, 294, 309, 324, 393):
    if src in by_src:
        put(swell(), at(src) - 0.75, 0.12, 0.25 if src % 2 else -0.25)
pay = by_src[129][-1]
put(swell(1.6), pay - 1.1, 0.14)
put(bell(196.0), pay, 0.16)
put(bell(196.0), at(196), 0.1)
put(swell(1.6), at(374) - 1.1, 0.14)
put(bell(196.0), at(374), 0.16)
put(swell(1.4), E["duration"] - 0.9, 0.14)
put(bell(147.0, 4.0), E["duration"] - 0.1, 0.18)

fade = int(1.2 * SR)
L[-fade:] *= np.linspace(1, 0, fade)
R[-fade:] *= np.linspace(1, 0, fade)
peak = max(np.abs(L).max(), np.abs(R).max())
st = (np.stack([L, R], 1) / peak * 0.5 * 32767).astype("<i2")
with wave.open("public/sedra/raw/talk_sfx.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(st.tobytes())
print(f"wrote public/sedra/raw/talk_sfx.wav ({DUR:.1f}s)")
