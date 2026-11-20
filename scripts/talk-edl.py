"""Cut list for the Sedra talk: which words are kept, in what order, with pauses tightened.

Reads src/talk/words.json (source times) and writes
  src/talk/edl.json   {fps, pieces: [{in, out, at}], words: [{w, s, e, src}], duration}
  public/sedra/raw/talk_voice_edit.wav   the cut voice, sample-exact to the pieces

Every piece edge is on the 30 fps frame grid so picture and sound stay locked.
"""
import json
import subprocess

FPS = 30
W = json.load(open("src/talk/words.json", encoding="utf-8"))

# runs of word indices, in output order (see the transcript for what each one says)
RUNS = [
    (129, 135),  # hook: صدق الله، وكذبت بطن أخيك، اسقه عسلاً
    (5, 24),     # النهارده هقولكم سر من أسرار الشفاء ... إيه هو السر ده؟
    (25, 176),   # the story, the verse
    (180, 199),  # (drops «فراح النبي صـ،») فالراجل ده خد الكلمة ... اليقين بما عند الله
    (200, 281),  # حديث جابر ... اللي ربنا يأذن بالشفا فيه
    (284, 372),  # (drops «ده توـ،») عدم توفيق ... يقين في الله عز وجل
    (374, 399),  # (drops «كذـ،») صدق الله وكذبت بطن أخيك ... جزاكم الله خيراً
]
LEAD, TAIL = 0.06, 0.12      # breath kept before the first and after the last word of a piece
MAX_GAP = 0.32               # longest silence left between two words
STRONG = ".؟!:"


def q(t):
    return round(t * FPS) / FPS


pieces, words = [], []
at = 0.0
for a, b in RUNS:
    idx = list(range(a, b + 1))
    # split the run wherever the gap between words is longer than MAX_GAP
    groups, cur = [], [idx[0]]
    for i in idx[1:]:
        gap = W[i]["s"] - W[i - 1]["e"]
        limit = MAX_GAP + (0.12 if W[i - 1]["w"][-1] in STRONG else 0)
        if gap > limit:
            groups.append(cur)
            cur = []
        cur.append(i)
    groups.append(cur)
    for g in groups:
        src_in = q(max(0.0, W[g[0]]["s"] - LEAD))
        src_out = q(W[g[-1]]["e"] + TAIL)
        if pieces and abs(pieces[-1]["out"] - src_in) < 1e-6:
            pieces[-1]["out"] = src_out  # contiguous: merge
            p = pieces[-1]
        else:
            p = {"in": src_in, "out": src_out, "at": round(at, 4)}
            pieces.append(p)
        for i in g:
            words.append({"w": W[i]["w"], "s": round(p["at"] + W[i]["s"] - p["in"], 3), "e": round(p["at"] + W[i]["e"] - p["in"], 3), "src": i})
        at = p["at"] + (p["out"] - p["in"])

duration = round(at, 4)
json.dump({"fps": FPS, "pieces": pieces, "words": words, "duration": duration}, open("src/talk/edl.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)

# voice: same pieces, 8 ms fades so no cut clicks
chains = []
for k, p in enumerate(pieces):
    d = p["out"] - p["in"]
    chains.append(f"[0:a]atrim={p['in']:.4f}:{p['out']:.4f},asetpts=PTS-STARTPTS,afade=t=in:d=0.008,afade=t=out:st={d - 0.008:.4f}:d=0.008[a{k}]")
fc = ";".join(chains) + ";" + "".join(f"[a{k}]" for k in range(len(pieces))) + f"concat=n={len(pieces)}:v=0:a=1[out]"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "public/sedra/raw/voice_clean.wav", "-filter_complex", fc, "-map", "[out]", "-ar", "48000", "public/sedra/raw/talk_voice_edit.wav"], check=True)
src_total = sum(W[b]["e"] - W[a]["s"] for a, b in RUNS)
print(f"{len(pieces)} pieces, {len(words)} words, {duration:.1f}s out (spoken span {src_total:.1f}s, source 187s)")
