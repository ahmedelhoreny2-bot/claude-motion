"""Lay the two recorded takes onto the Dot video timeline -> public/dot/vo.wav.

    python3 scripts/dot-vo.py

Each phrase is cut from its take ("a" = main script, "b" = services) and placed
so its first syllable lands on `at`. Tails stop at the middle of the pause to
the neighbouring phrase in the same take, so no syllable is heard twice.
"""
import json
import struct
import wave

PRE, POST, FADE = 0.06, 0.15, 0.02
tl = json.load(open("src/dot/timeline.json"))
takes = {}
for k in ("a", "b"):
    r = wave.open(f"public/dot/vo-{k}.wav")
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
w = wave.open("public/dot/vo.wav", "wb")
w.setnchannels(1)
w.setsampwidth(2)
w.setframerate(sr)
w.writeframes(struct.pack("<%dh" % len(out), *(int(max(-32768, min(32767, s))) for s in out)))
print(f"wrote public/dot/vo.wav: {len(tl['vo'])} phrases, {tl['duration']}s")
