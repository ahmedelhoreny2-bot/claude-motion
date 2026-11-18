#!/usr/bin/env python3
"""Build the promo voiceover from the two recorded takes: cut each line, trim pauses,
speed it up a touch, butt lines together, and write per-word timings for the picture.

    python3 scripts/promo-vo.py   ->  public/ibdaa/promo/vo.wav + src/ibdaa3/vo.json
"""
import json, math, os, re, struct, subprocess, wave

SRC = {"a": "public/ibdaa/vo-src/showreel.mp3", "b": "public/ibdaa/vo-src/explainer.mp3"}
TEMPO = 1.07
GAP = 0.08          # between phrases inside a line
LINE_GAP = 0.14     # between lines
STUT = 0.22         # length of the stuttered first word
ECHO = [("brand", "بيتحرك"), ("price", "تلتمية")]  # words that get a short echo tail
LINES = [
    ("hook", "a", 0.00, 2.84, "دي إشارة|إن إعلانك محتاج يتحرك"),
    ("brand", "a", 3.13, 7.86, "إحنا إبداع بيتحرك|فكرتك على الشاشة|بتتحرك وتبيع"),
    ("flat", "b", 0.00, 0.80, "ده إعلان"),
    ("skip", "b", 1.10, 3.13, "والناس بتعدّيه|كده"),
    ("wait", "b", 3.75, 6.99, "استنى|نفس الكلام، بس لما يتحرك"),
    ("diff", "b", 7.40, 9.34, "شفت الفرق؟|ده اللي بنعمله"),
    ("w1", "a", 8.12, 11.09, "إعلانات مطاعم|تخلّي الأكل يطلع من الشاشة"),
    ("w2", "a", 11.30, 14.41, "حملات طبية|بتحكي قصة وتطمّن الناس"),
    ("w3", "a", 14.62, 17.22, "موشن جرافيك|يشرح خدمتك في ثواني"),
    ("w4", "a", 17.51, 20.67, "توعية بالأرقام|معلومة تتفهم وتتصدّق"),
    ("w5", "a", 20.87, 23.96, "إعلان منتج|يخلّي اللي بيتفرج عايز يطلب"),
    ("w6", "a", 24.16, 26.51, "إعلانات تعليمية|بإحساس سينمائي"),
    ("w7", "a", 26.74, 29.59, "ولحد أكاديميات الأطفال|بألوان تفرّح"),
    ("word", "b", 9.79, 12.50, "الكلمة|لما تتحرك|بتتسمع"),
    ("story", "b", 17.13, 19.61, "من فكرة|لقصة|لفيديو"),
    ("shape", "b", 19.94, 22.25, "والشكل لما يتحرك|بيبيع"),
    ("design", "a", 29.83, 33.27, "ومش فيديوهات بس|تصميمات سوشيال ميديا وهويات كاملة"),
    ("burger", "a", 33.50, 38.67, "برجر واحد|عملناه بعشرين ستايل|يعني فكرتك هتطلع بالشكل اللي يليق بيها"),
    ("skins", "b", 25.40, 29.73, "سواء عندك مطعم|أو بتعلّم|أو عندك براند|أو عيادة"),
    ("yours", "b", 30.08, 32.45, "بألوانك إنت|وبهويتك إنت"),
    ("price", "a", 38.90, 41.54, "وفيديوهاتنا|تبدأ من تلتمية جنيه بس"),
    ("cta", "a", 41.74, 46.77, "ابعتلنا نوع البراند بتاعك|والفكرة اللي نفسك تنفذها|وإحنا هنبعتلك كل التفاصيل"),
    ("end", "a", 47.08, 48.95, "خلّي فكرتك|تتحرك"),
]
TMP = "/tmp/claude-0/-home-user/038579fa-af82-537b-9e23-e486c89677ce/scratchpad/promo"
os.makedirs(TMP, exist_ok=True)


def envelope(path):
    wav = f"{TMP}/{os.path.basename(path)}.wav"
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", path, "-ac", "1", "-ar", "16000", wav], check=True)
    w = wave.open(wav)
    n = w.getnframes()
    d = struct.unpack("<%dh" % n, w.readframes(n))
    hop = 160
    return [10 * math.log10(sum(x * x for x in d[i:i + hop]) / hop / 32768 ** 2 + 1e-12) for i in range(0, n - hop, hop)]


ENV = {k: envelope(v) for k, v in SRC.items()}


def dips(env, a, b, th=-40, mind=0.06):
    out, st = [], None
    for i in range(int(a / 0.01), min(len(env), int(b / 0.01))):
        if env[i] < th:
            st = i if st is None else st
        else:
            if st is not None and (i - st) * 0.01 >= mind:
                out.append((st * 0.01, i * 0.01, min(env[st:i])))
            st = None
    return out


def chars(s):
    return len(re.sub(r"[\s،؟\.…]", "", s))


def split_phrases(src, a, b, phrases):
    """Pick len(phrases)-1 internal pauses whose positions best match the text proportions."""
    if len(phrases) == 1:
        return [(a, b)]
    cand = [d for d in dips(ENV[src], a + 0.15, b - 0.15)]
    total = sum(chars(p) for p in phrases)
    want, acc = [], 0
    for p in phrases[:-1]:
        acc += chars(p)
        want.append(a + (b - a) * acc / total)
    picked, used = [], set()
    for wv in want:
        best = None
        for j, d in enumerate(cand):
            if j in used or (picked and d[0] <= picked[-1][1]):
                continue
            score = abs((d[0] + d[1]) / 2 - wv) - 0.004 * (-d[2])
            if best is None or score < best[0]:
                best = (score, j)
        if best is None:
            picked.append((wv, wv))
        else:
            used.add(best[1])
            picked.append(cand[best[1]][:2])
    out, s = [], a
    for d in picked:
        out.append((s, d[0]))
        s = d[1]
    out.append((s, b))
    return out


pieces, meta, t = [], [], 0.0
for k, (lid, src, a, b, text) in enumerate(LINES):
    phrases = text.split("|")
    spans = split_phrases(src, a, b, phrases)
    line = {"id": lid, "start": round(t, 3), "phrases": []}
    stutter = []
    if lid == "hook":
        # "دي… دي… دي إشارة": the first word twice more, quick, before the line
        s0 = spans[0][0]
        f = f"{TMP}/stutter.wav"
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{s0:.3f}", "-to", f"{s0 + STUT:.3f}", "-i", SRC[src],
                        "-af", f"atempo={TEMPO},afade=t=in:d=0.01,areverse,afade=t=in:d=0.03,areverse", "-ar", "48000", "-ac", "1", f], check=True)
        for r in range(2):
            pieces.append((t, f))
            stutter.append({"w": phrases[0].split()[0], "t": round(t + 0.02, 3), "stutter": True})
            t += STUT / TEMPO + 0.1
    for pi, ((s0, s1), ph) in enumerate(zip(spans, phrases)):
        f = f"{TMP}/p{k:02d}_{pi}.wav"
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{max(0, s0 - 0.03):.3f}", "-to", f"{s1 + 0.05:.3f}", "-i", SRC[src],
                        "-af", f"atempo={TEMPO},afade=t=in:d=0.015,areverse,afade=t=in:d=0.03,areverse", "-ar", "48000", "-ac", "1", f], check=True)
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], capture_output=True, text=True).stdout)
        words = ph.split()
        wt = sum(chars(w) + 1 for w in words)
        acc, wl = 0.0, []
        for w_ in words:
            w0 = t + 0.02 + (dur - 0.06) * acc / wt
            acc += chars(w_) + 1
            wl.append({"w": w_, "t": round(w0, 3)})
        if pi == 0 and stutter:
            wl = stutter + wl
        line["phrases"].append({"text": ph, "start": round(wl[0]["t"] - 0.02, 3), "end": round(t + dur, 3), "words": wl})
        pieces.append((t, f))
        t += dur + (GAP if pi < len(phrases) - 1 else 0)
    line["end"] = round(t, 3)
    meta.append(line)
    t += LINE_GAP

total = t + 1.6
inputs, filt = [], []
for i, (st, f) in enumerate(pieces):
    inputs += ["-i", f]
    ms = int(st * 1000)
    filt.append(f"[{i}:a]adelay={ms}[d{i}]")
filt.append("".join(f"[d{i}]" for i in range(len(pieces))) + f"amix=inputs={len(pieces)}:normalize=0,apad,atrim=0:{total:.3f}[o]")
dry = f"{TMP}/vo_dry.wav"
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *inputs, "-filter_complex", ";".join(filt), "-map", "[o]", "-ar", "48000", dry], check=True)
# echo: copies of the word, later and quieter, mixed back in
parts, labels = [], ["[0:a]"]
for k, (lid, word) in enumerate(ECHO):
    l = next(x for x in meta if x["id"] == lid)
    ws = [w for p in l["phrases"] for w in p["words"]]
    j = next(i for i, w in enumerate(ws) if w["w"] == word)
    a = ws[j]["t"] - 0.03
    b = ws[j + 1]["t"] - 0.02 if j + 1 < len(ws) else max(p["end"] for p in l["phrases"])
    for r, (d, g) in enumerate(((0.16, 0.32), (0.32, 0.14))):
        lab = f"e{k}{r}"
        parts.append(f"[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,highpass=f=300,volume={g},adelay={int((a + d) * 1000)}[{lab}]")
        labels.append(f"[{lab}]")
parts.insert(0, "[0:a]asplit=" + str(len(labels)) + "".join(f"[s{i}]" for i in range(len(labels))))
parts = [parts[0]] + [p.replace("[0:a]", f"[s{i + 1}]", 1) for i, p in enumerate(parts[1:])]
parts.append(f"[s0]" + "".join(labels[1:]) + f"amix=inputs={len(labels)}:normalize=0,atrim=0:{total:.3f}[o]")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", dry, "-filter_complex", ";".join(parts), "-map", "[o]", "-ar", "48000", "public/ibdaa/promo/vo.wav"], check=True)
json.dump({"duration": round(total, 2), "lines": meta}, open("src/ibdaa3/vo.json", "w"), ensure_ascii=False, indent=1)
for l in meta:
    print(f'{l["id"]:7s} {l["start"]:6.2f}-{l["end"]:6.2f}  ' + " | ".join(f'{p["start"]:.2f}' for p in l["phrases"]))
print("total", round(total, 2))
