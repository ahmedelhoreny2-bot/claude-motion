"""Sound design for SedraTalk: effects only, no music (religious talk), timed from src/talk/edl.json.

    python3 sfx/cues/talk_score.py  ->  public/sedra/raw/talk_sfx.wav

Whooshes on cuts to cards, a deep hit on the hook and the payoffs, pops on chips,
a soft riser into "صدق الله وكذبت بطن أخيك", and a low room tone so cuts never drop to dead silence.
"""
import json
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(3)
E = json.load(open("src/talk/edl.json", encoding="utf-8"))
WD = E["words"]
DUR = E["duration"] + 4.5
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


def bandpass(sig, lo, hi):
    spec = np.fft.rfft(sig)
    f = np.fft.rfftfreq(len(sig), 1 / SR)
    spec *= (1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4)) * (1 / np.sqrt(1 + (f / hi) ** 4))
    return np.fft.irfft(spec, len(sig))


def whoosh(dur, up=True):
    n = int(dur * SR)
    k = np.arange(n) / n
    nz = rng.standard_normal(n)
    out = np.zeros(n)
    seg = 2048
    for i in range(0, n, seg):
        fc = 300 + 4200 * (k[i] if up else 1 - k[i])
        out[i:i + seg] = bandpass(nz[i:i + seg], fc * 0.5, fc * 2)[: len(out[i:i + seg])]
    return out * np.sin(np.pi * k) ** 2


def hit(dur=1.8):
    n = int(dur * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(36 + 70 * np.exp(-t * 10)) / SR) * np.exp(-t * 2.6)
    air = bandpass(rng.standard_normal(n), 1800, 9000) * np.exp(-t * 5) * 0.12
    return boom + air


def pop(f0):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.6 * np.exp(-t * 60))) / SR) * np.exp(-t * 30)


def riser(dur):
    n = int(dur * SR)
    k = np.arange(n) / n
    tone = np.sin(2 * np.pi * np.cumsum(140 * 2 ** (k * 3)) / SR) * 0.2
    return (whoosh(dur) * 0.7 + tone) * k ** 2


def chime(freqs):
    n = int(2.4 * SR)
    t = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * t) * np.exp(-t * 1.6) for f in freqs) / len(freqs)


# room tone so cuts never fall into digital silence
tone = bandpass(rng.standard_normal(N), 80, 1200) * 0.012
L += tone
R += tone

# hook
put(hit(), WD[0]["s"] + 0.02, 0.5)
put(whoosh(0.5), at(5) - 0.35, 0.25)
# cards (full-screen overlays) — whoosh in
for src in (7, 16, 48, 66, 80, 100, 121, 157, 170, 196, 221, 267, 294, 309, 324, 358, 374):
    if src in by_src:
        put(whoosh(0.45), at(src) - 0.32, 0.22, 0.2 if src % 2 else -0.2)
# punches and chips
for src in (10, 19, 67, 81, 101):
    put(hit(1.0), at(src), 0.25)
for k, src in enumerate((48, 53, 55, 56, 143, 146, 229, 231, 233, 259, 360, 362, 364, 195, 72)):
    if src in by_src:
        put(pop(520 + 60 * (k % 6)), at(src), 0.22, -0.3 + 0.12 * (k % 6))
put(pop(300), at(236), 0.3)  # strike-through
for src in (268, 271):
    put(whoosh(0.3), at(src), 0.15)
put(hit(1.2), at(275), 0.3)
# payoff in the story, and the closing one
put(riser(2.0), at(129) - 2.0, 0.3)
put(hit(), at(129), 0.55)
put(chime([392.0, 493.9, 587.3]), at(129) + 0.1, 0.18)
put(hit(), at(196), 0.4)
put(riser(1.5), at(374) - 1.5, 0.25)
put(hit(), at(374), 0.45)
put(chime([392.0, 493.9, 587.3, 784.0]), at(374) + 0.1, 0.18)
# CTA
put(whoosh(0.6), E["duration"] - 0.6, 0.3)
put(hit(1.4), E["duration"] - 0.3, 0.35)
put(chime([293.7, 392.0, 493.9]), E["duration"], 0.2)

fade = int(1.0 * SR)
L[-fade:] *= np.linspace(1, 0, fade)
R[-fade:] *= np.linspace(1, 0, fade)
peak = max(np.abs(L).max(), np.abs(R).max())
st = (np.stack([L, R], 1) / peak * 0.7 * 32767).astype("<i2")
with wave.open("public/sedra/raw/talk_sfx.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(st.tobytes())
print(f"wrote public/sedra/raw/talk_sfx.wav ({DUR:.1f}s)")
