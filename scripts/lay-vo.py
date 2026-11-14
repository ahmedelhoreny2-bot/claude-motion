"""Lay recorded voice phrases onto a video timeline.

    python3 scripts/lay-vo.py src/toy/timeline.json public/toy/vo.wav

The timeline's "takes" maps a key to a mono 48 kHz WAV; each "vo" entry cuts
[src] from its take and places it so the first syllable lands on `at`. Tails
stop at the middle of the pause to the neighbouring phrase in the same take
(as listed in this timeline), so no syllable is heard twice.
"""
import json
import struct
import sys
import wave

PRE, POST, FADE = 0.06, 0.15, 0.02
tl_path, out_path = sys.argv[1], sys.argv[2]
tl = json.load(open(tl_path))
takes, sr = {}, 48000
for k, path in tl["takes"].items():
    r = wave.open(path)
    sr = r.getframerate()
    takes[k] = struct.unpack("<%dh" % r.getnframes(), r.readframes(r.getnframes()))
out = [0.0] * int(tl["duration"] * sr)
last_end = 0.0
for v in sorted(tl["vo"], key=lambda v: v["at"]):
    raw = takes[v["file"]]
    a, b = v["src"]
    spans = sorted(x["src"] for x in tl["vo"] if x["file"] == v["file"])
    k = spans.index([a, b])
    lo = (spans[k - 1][1] + a) / 2 if k > 0 else 0.0
    hi = (b + spans[k + 1][0]) / 2 if k + 1 < len(spans) else len(raw) / sr
    i0, i1 = int(max(a - PRE, lo) * sr), min(len(raw), int(min(b + POST, hi) * sr))
    clip = list(raw[i0:i1])
    f = int(FADE * sr)
    for j in range(f):
        clip[j] *= j / f
        clip[-1 - j] *= j / f
    start = int((v["at"] - (a - i0 / sr)) * sr)
    assert start / sr >= last_end - 0.01, f"overlap at {v['text']} ({start / sr:.2f} < {last_end:.2f})"
    for j, s in enumerate(clip):
        if 0 <= start + j < len(out):
            out[start + j] += s
    last_end = start / sr + len(clip) / sr
w = wave.open(out_path, "wb")
w.setnchannels(1)
w.setsampwidth(2)
w.setframerate(sr)
w.writeframes(struct.pack("<%dh" % len(out), *(int(max(-32768, min(32767, s))) for s in out)))
print(f"wrote {out_path}: {len(tl['vo'])} phrases, {tl['duration']}s")
