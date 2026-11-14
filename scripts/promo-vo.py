"""Lay the recorded voiceover onto the promo timeline.

    python3 scripts/promo-vo.py   # public/promo-vo-raw.wav -> public/promo-vo.wav

Each phrase is cut from the raw take (src, seconds) and placed so its first
syllable lands on `at`. Times come only from src/promo/timeline.json.
"""
import json
import struct
import wave

PRE, POST, FADE = 0.06, 0.15, 0.02
tl = json.load(open("src/promo/timeline.json"))
r = wave.open("public/promo-vo-raw.wav")
sr, ch = r.getframerate(), r.getnchannels()
assert ch == 1, "expects mono"
raw = struct.unpack("<%dh" % r.getnframes(), r.readframes(r.getnframes()))
out = [0.0] * int(tl["duration"] * sr)
last_end = 0.0
# a phrase's tails may not cross the middle of the pause to its neighbours in
# the take, or the start of the next phrase is heard twice ("w- wehna")
spans = sorted(v["src"] for v in tl["vo"])
for v in tl["vo"]:
    a, b = v["src"]
    k = spans.index([a, b])
    lo = (spans[k - 1][1] + a) / 2 if k > 0 else 0.0
    hi = (b + spans[k + 1][0]) / 2 if k + 1 < len(spans) else len(raw) / sr
    i0, i1 = int(max(a - PRE, lo) * sr), min(len(raw), int(min(b + POST, hi) * sr))
    clip = list(raw[max(0, i0):i1])
    f = int(FADE * sr)
    for k in range(f):
        clip[k] *= k / f
        clip[-1 - k] *= k / f
    start = int((v["at"] - (a - i0 / sr)) * sr)
    assert start / sr >= last_end - 0.01, f"overlap at {v['text']}"
    for k, s in enumerate(clip):
        if 0 <= start + k < len(out):
            out[start + k] += s
    last_end = start / sr + len(clip) / sr
w = wave.open("public/promo-vo.wav", "wb")
w.setnchannels(1)
w.setsampwidth(2)
w.setframerate(sr)
w.writeframes(struct.pack("<%dh" % len(out), *(int(max(-32768, min(32767, s))) for s in out)))
print(f"wrote public/promo-vo.wav: {len(tl['vo'])} phrases, {tl['duration']}s")
