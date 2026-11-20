"""Word timings for the Sedra talk video, from a hand-checked SRT and the audio itself.

The SRT times (from Gemini) are a rough prior. Real pauses in the voice are found from
its energy, and a dynamic program assigns each pause to a word boundary: close to where
the SRT puts it, and preferring punctuation and line ends. Words between two anchors are
spread by letter count, then each inner edge snaps to the quietest 10 ms nearby.

    python3 scripts/talk-align.py  ->  src/talk/words.json  [{w, s, e, seg}]  (source seconds)
"""
import json
import re
import subprocess

import numpy as np

SRT = "src/talk/transcript.srt"
AUDIO = "public/sedra/raw/voice_clean.wav"
OUT = "src/talk/words.json"


def ts(x):
    h, m, rest = x.split(":")
    s, ms = rest.split(",")
    return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000


def letters(w):
    return max(1, len(re.sub(r"[^ء-ي]", "", w)))


words = []
for si, block in enumerate(open(SRT, encoding="utf-8").read().strip().split("\n\n")):
    lines = block.strip().split("\n")
    a, b = (ts(v) for v in lines[1].split(" --> "))
    toks = " ".join(lines[2:]).split()
    wts = np.array([letters(t) + 1.5 for t in toks])
    cum = np.cumsum(wts) / wts.sum()
    for k, tok in enumerate(toks):
        strength = 0
        if re.search(r"[.؟?!:]$", tok):
            strength = 3
        elif tok.endswith("،") or tok.endswith("ـ،"):
            strength = 1
        if k == len(toks) - 1:
            strength = max(strength, 2)
        words.append({"w": tok, "seg": si + 1, "b": strength, "g": a + (b - a) * cum[k], "gs": a + (b - a) * (cum[k - 1] if k else 0)})

pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", AUDIO, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
x = np.frombuffer(pcm, dtype="<i2").astype(np.float64)
HOP = 160
n = len(x) // HOP
db = 20 * np.log10(np.sqrt((x[: n * HOP].reshape(n, HOP) ** 2).mean(1) + 1) / 32768)
sm = np.convolve(db, np.ones(5) / 5, mode="same")
level = np.percentile(sm, 70)
quiet = sm < level - 9
pauses = []
i = 0
while i < len(quiet):
    if quiet[i]:
        j = i
        while j < len(quiet) and quiet[j]:
            j += 1
        if j - i >= 12:
            pauses.append((i / 100, j / 100))
        i = j
    else:
        i += 1
speech_start = pauses[0][1] if pauses and pauses[0][0] < 0.05 else 0.0
end_audio = len(sm) / 100
speech_end = pauses[-1][0] if pauses and pauses[-1][1] >= end_audio - 0.05 else end_audio
pauses = [p for p in pauses if p[0] > speech_start + 0.05 and p[1] < speech_end - 0.05]

K = len(words) - 1
P = len(pauses)
PEN = {3: 0.0, 2: 0.3, 1: 0.6, 0: 3.5}
SKIP = {3: 1.2, 2: 0.8, 1: 0.2, 0: 0.0}
L = np.cumsum([0] + [letters(w["w"]) for w in words])  # letters before word k: L[k]
skipc = np.cumsum([0] + [SKIP[w["b"]] for w in words])
RATE = 13.0  # letters per second, measured on this speaker


def anchor_cost(p, k):
    d = (pauses[p][0] - words[k]["g"]) / 0.45
    return d * d + PEN[words[k]["b"]]


def interval_cost(t0, t1, k0, k1):
    """Words k0+1..k1 spoken between t0 and t1."""
    dur = max(0.05, t1 - t0)
    rate = (L[k1 + 1] - L[k0 + 1]) / dur
    return 1.5 * np.log(rate / RATE) ** 2 + (skipc[k1] - skipc[k0 + 1])


# state (p, k): pause p is the boundary after word k. start state: (-1, -1) at speech_start.
best = {(-1, -1): 0.0}
back = {}
order = sorted(((p, k) for p in range(P) for k in range(K)), key=lambda x: (x[0], x[1]))
for p, k in order:
    if abs(pauses[p][0] - words[k]["g"]) > 2.5:
        continue
    bestv, arg = 1e18, None
    for (pp, kk), v in list(best.items()):
        if pp >= p or kk >= k or p - pp > 8 or k - kk > 30:
            continue
        t0 = speech_start if pp < 0 else pauses[pp][1]
        c = v + interval_cost(t0, pauses[p][0], kk, k) + 0.6 * (p - pp - 1)
        if c < bestv:
            bestv, arg = c, (pp, kk)
    if arg is not None:
        best[(p, k)] = bestv + anchor_cost(p, k)
        back[(p, k)] = arg
# close at the last word
fin, farg = 1e18, None
for (pp, kk), v in best.items():
    if K - kk > 30:
        continue
    t0 = speech_start if pp < 0 else pauses[pp][1]
    c = v + interval_cost(t0, speech_end, kk, K) + 0.6 * (P - pp - 1)
    if c < fin:
        fin, farg = c, (pp, kk)
assign = {}
cur = farg
while cur != (-1, -1):
    assign[cur[1]] = cur[0]
    cur = back[cur]


def quietest(t, lo, hi):
    a, b = max(0, int(lo * 100)), min(len(sm) - 1, int(hi * 100))
    if b <= a:
        return t
    return (a + int(np.argmin(sm[a:b]))) / 100


anchors = [(-1, speech_start)] + [(k, None) for k in sorted(assign)] + [(K, speech_end)]
res = []
for idx in range(len(anchors) - 1):
    k0, _ = anchors[idx]
    k1, _ = anchors[idx + 1]
    t0 = speech_start if k0 < 0 else pauses[assign[k0]][1]
    t1 = speech_end if k1 == K and k1 not in assign else pauses[assign[k1]][0]
    seg = words[k0 + 1:k1 + 1]
    wts = np.array([letters(w["w"]) + 1.5 for w in seg])
    edges = t0 + np.concatenate([[0], np.cumsum(wts)]) / wts.sum() * (t1 - t0)
    for j in range(1, len(seg)):
        edges[j] = quietest(edges[j], max(edges[j - 1] + 0.1, edges[j] - 0.16), min(edges[j + 1] - 0.1, edges[j] + 0.16))
    for j, w in enumerate(seg):
        res.append({"w": w["w"], "s": round(float(edges[j]), 3), "e": round(float(edges[j + 1]), 3), "seg": w["seg"]})

# a real pause near a word boundary becomes that boundary's gap
for pa, pb in pauses:
    for j in range(1, len(res)):
        b = res[j]["s"]
        if pa - 0.12 <= b <= pb + 0.12 and res[j - 1]["s"] < pa - 0.08:
            res[j - 1]["e"] = round(pa, 3)
            res[j]["s"] = round(min(pb, res[j]["e"] - 0.12), 3)
            break
# re-spread every run of words between real gaps, now that the gaps are known
runs, start = [], 0
for j in range(1, len(res) + 1):
    if j == len(res) or res[j]["s"] - res[j - 1]["e"] > 0.05:
        runs.append((start, j))
        start = j
for a, b in runs:
    seg = res[a:b]
    t0, t1 = seg[0]["s"], seg[-1]["e"]
    wts = np.array([letters(w["w"]) + 1.5 for w in seg])
    edges = t0 + np.concatenate([[0], np.cumsum(wts)]) / wts.sum() * (t1 - t0)
    for q in range(1, len(seg)):
        edges[q] = quietest(edges[q], max(edges[q - 1] + 0.1, edges[q] - 0.16), min(edges[q + 1] - 0.1, edges[q] + 0.16))
    for q, w in enumerate(seg):
        w["s"], w["e"] = round(float(edges[q]), 3), round(float(edges[q + 1]), 3)
json.dump(res, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(f"{len(res)} words, {P} pauses, {len(assign)} used as anchors")
drift = [(w["seg"], round(r["s"] - w["gs"], 2)) for w, r in zip(words, res) if abs(r["s"] - w["gs"]) > 1.2]
print("words more than 1.2 s away from the SRT:", drift[:40])
