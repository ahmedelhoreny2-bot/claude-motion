"""Align the known Sedra script to vo-full.mp3 without ASR.

Pauses in the audio are real; punctuation in the script marks where pauses can be.
Speech time (audio minus pauses) is mapped to letter count, punctuation boundaries
snap to the nearest pause, and words are spread by letter count between anchors.
Writes src/sedra/words.json: [{w, s, e, p}] with p = phrase index.
"""
import json, re, subprocess, sys

SRC = "public/sedra/vo-full.mp3"
SCRIPT = """الكاسة دي… اتحطت على ضهر مين قبلك؟ سؤال لازم تسأله… قبل أي حجامة.
المعاهد الوطنية للصحة الأمريكية بتحذّر: أدوات الحجامة، لو اتعاد استخدامها من غير تعقيم… ممكن تنقل فيروس سي، وفيروس بي.
يبقى المشكلة… مش في الحجامة. المشكلة في مين بيعملها… وإزاي.
الحجامة سُنّة نبوية. قال رسول الله صلى الله عليه وسلم: إنَّ أَمْثَلَ ما تَداوَيْتُم به الحِجامة.
والعلم الحديث بيدرسها: مراجعة علمية في مجلة بي إم جي أوبن، جمعت تمنتاشر دراسة عن الحجامة وآلام الرقبة.
وعشان كده… مركز سِدْرة للحجامة. في زفتى.
أدوات معقّمة لكل عميل، ونضافة قبل أي جلسة. جوانتي جديد، وسرير متغلّف… في كل جلسة، من غير استثناء. وبنسأل عن حالتك الصحية قبل ما نبدأ، لأن مش كل الناس الحجامة تناسبهم.
مع الشيخ أحمد أبو يوسف، أخصائي الحجامة، والحاصل على دبلومة الطب الآمن والتكميلي، ودورة العلاج بمنتجات ومصل النحل.
حجامة نبوية، وحجامة نارية، وفوطة نارية، ومصل النحل، وإبر صيني، ومساج… ومنتجات طبيعية من خير النحل.
كما يضم المركز قسمًا مخصصًا للسيدات.
الحجامة مش مناسبة لكل الناس: أصحاب الأنيميا، واللي بياخدوا أدوية سيولة، ومرضى القلب والكلى والكبد… وعشان كده، بنسأل قبل ما نبدأ.
أيام الحجامة المستحبة: سبعتاشر، وتسعتاشر، وواحد وعشرين… من كل شهر هجري. احجز مكانك دلوقتي، اتصل أو كلّمنا واتساب على الرقم اللي على الشاشة."""

def letters(w):
    return max(1, len(re.sub(r"[^ء-ي]", "", w)))

# words with punctuation strength after them
words = []
for para_i, para in enumerate(SCRIPT.split("\n")):
    for tok in para.split():
        strength = 0
        if re.search(r"[.؟?:]$", tok): strength = 3
        elif tok.endswith("…"): strength = 2
        elif tok.endswith("،"): strength = 1
        words.append({"w": tok, "n": letters(tok), "b": strength, "para": para_i})
words[-1]["b"] = 3

# pauses
out = subprocess.run(["ffmpeg", "-hide_banner", "-i", SRC, "-af", "silencedetect=noise=-30dB:d=0.11", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", out)]
en = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", out)]
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", SRC], capture_output=True, text=True).stdout)
raw = [(a, b) for a, b in zip(st, en) if a > 0.05 and b < dur - 0.05]
pauses = []
IGNORE = [5.21, 37.89]  # a breath inside «قبل أي حجامة», not a phrase break
raw = [(a, b) for a, b in raw if not any(abs(a - x) < 0.03 for x in IGNORE)]
for a, b in raw:  # two pauses split by a click are one pause
    if pauses and a - pauses[-1][1] < 0.07: pauses[-1] = (pauses[-1][0], b)
    else: pauses.append((a, b))
speech_start = en[0] if st and st[0] < 0.05 else 0.0
speech_end = st[-1] if st and en[-1] >= dur - 0.05 else dur

# speech-time axis
def to_speech(t):
    s = t - speech_start
    for a, b in pauses:
        if t >= b: s -= (b - a)
        elif t > a: s -= (t - a)
    return s
total_speech = to_speech(speech_end)
total_letters = sum(w["n"] for w in words)
# each pause = boundary; predicted letter position
cum = []
c = 0
for w in words:
    c += w["n"]; cum.append(c)

# DP: assign each pause to a word boundary (index k = after word k), monotonic, preferring punctuation
cands = [k for k in range(len(words) - 1)]
P = len(pauses)
pos_pred = [to_speech(a) / total_speech * total_letters for a, _ in pauses]
INF = 1e18
import math
# pauses whose phrase is known for sure (the services clip and the lines after it)
FORCE = [(59.38, "نبوية،", 0), (60.60, "نارية،", 0), (61.77, "نارية،", 1), (62.83, "النحل،", 0),
         (63.83, "صيني،", 0), (64.82, "ومساج…", 0), (67.24, "النحل.", 1), (70.41, "للسيدات.", 0),
         (72.70, "الناس:", 0), (75.18, "سيولة،", 0),
         (81.96, "سبعتاشر،", 0), (82.91, "وتسعتاشر،", 0)]
def word_index(tok, occ):
    hits = [i for i, w in enumerate(words) if w["w"] == tok]
    return hits[occ]
forced = {}
for t, tok, occ in FORCE:
    for pi, (a, b) in enumerate(pauses):
        if abs(a - t) < 0.05: forced[pi] = word_index(tok, occ)
# cost of placing pause p at boundary k
def cost(p, k):
    if p in forced: return 0 if forced[p] == k else 1e9
    d = abs(cum[k] - pos_pred[p]) / 9.0   # ~6 letters per unit
    pen = {3: 0, 2: 0.2, 1: 0.6, 0: 12.0}[words[k]["b"]] - min(0.6, (pauses[p][1] - pauses[p][0]) - 0.15) * (2 if words[k]["b"] == 3 else 0)
    return d * d * 0.5 + pen
# also penalty for strong punctuation without a pause
skip_pen = {3: 2.5, 2: 1.2, 1: 0.3, 0: 0}
K = len(words) - 1
dp = [[INF] * (K + 1) for _ in range(P + 1)]
bk = [[None] * (K + 1) for _ in range(P + 1)]
dp[0][0] = 0
for p in range(P + 1):
    for k in range(K + 1):
        v = dp[p][k]
        if v >= INF: continue
        # option: boundary k has no pause -> advance k
        if k < K:
            nv = v + skip_pen[words[k]["b"]]
            if nv < dp[p][k + 1]: dp[p][k + 1] = nv; bk[p][k + 1] = (p, k, None)
        # option: pause p at boundary k -> advance both
        if p < P and k < K:
            nv = v + cost(p, k)
            if nv < dp[p + 1][k + 1]: dp[p + 1][k + 1] = nv; bk[p + 1][k + 1] = (p, k, "pause")
# backtrack
assign = {}
p, k = P, K
while (p, k) != (0, 0):
    pp, kk, kind = bk[p][k]
    if kind == "pause": assign[kk] = pp
    p, k = pp, kk

# anchors: (word boundary k, time start of pause, time end of pause)
anchors = [(-1, None, speech_start)] + [(k, pauses[assign[k]][0], pauses[assign[k]][1]) for k in sorted(assign)] + [(len(words) - 1, speech_end, None)]
res = []
for (k0, _, t0), (k1, t1, _) in zip(anchors, anchors[1:]):
    seg = words[k0 + 1:k1 + 1]
    n = sum(w["n"] + 1.2 for w in seg)
    t = t0
    for w in seg:
        d = (t1 - t0) * (w["n"] + 1.2) / n
        res.append({"w": w["w"], "s": round(t, 3), "e": round(t + d, 3), "para": w["para"]})
        t += d
# snap internal word boundaries to the quietest 10 ms within +-0.18 s (word edges dip in energy)
import array
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", SRC, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"], capture_output=True).stdout
x = array.array("h", pcm)
HOP = 80
rms = [sum(v * v for v in x[i:i + HOP]) / HOP for i in range(0, len(x) - HOP, HOP)]
sm = [sum(rms[max(0, i - 2):i + 3]) / len(rms[max(0, i - 2):i + 3]) for i in range(len(rms))]
def quietest(t, lo, hi):
    a, b = int(max(lo, t - 0.18) * 100), int(min(hi, t + 0.18) * 100)
    if b <= a: return t
    i = min(range(a, b), key=lambda i: sm[i] if i < len(sm) else 1e18)
    return i / 100
for i in range(1, len(res)):
    prev, cur = res[i - 1], res[i]
    if abs(prev["e"] - cur["s"]) < 0.002:  # boundary inside a phrase, not a pause
        t = quietest(cur["s"], prev["s"] + 0.12, cur["e"] - 0.12)
        prev["e"] = cur["s"] = round(t, 3)
json.dump(res, open("src/sedra/words.json", "w"), ensure_ascii=False, indent=0)
# report
for k in sorted(assign):
    a, b = pauses[assign[k]]
    print(f"{a:6.2f}-{b:5.2f}  after «{words[k]['w']}» (b={words[k]['b']})")
unused = [k for k, w in enumerate(words[:-1]) if w["b"] >= 2 and k not in assign]
print("strong punctuation with no pause:", [words[k]["w"] for k in unused])
print("pauses:", P, "assigned:", len(assign), "speech", round(speech_start,2), round(speech_end,2))
