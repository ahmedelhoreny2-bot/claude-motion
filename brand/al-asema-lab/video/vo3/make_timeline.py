"""Timeline for AskLab (video 3, «متسألش جوجل.. اسأل معمل»).

    python3 brand/al-asema-lab/video/vo3/make_timeline.py            # provisional timings (no voice yet)
    python3 brand/al-asema-lab/video/vo3/make_timeline.py vo.mp3     # real timings from the recorded voice

With a voice file, the nine lines are found by silencedetect (the longest gaps split the take into nine),
and every scene, caption word and on-screen beat moves with them. Words inside a line are placed by
letter count, then snapped to small dips in loudness when one is close.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
OUT = ROOT / "src/asema3/timeline.json"

LINES = [
    "الساعة اتنين بالليل.. وانت بتسأل جوجل: أنا تعبان على طول ليه؟",
    "وكل نتيجة بتطلعلك.. بتقلقك أكتر من اللي قبلها.",
    "كفاية تخمين.. الإجابة الحقيقية مش على الموبايل، الإجابة في تحليل.",
    "في معمل العاصمة للتحاليل الطبية بميت غمر.. استقبال نضيف وهادي، وفريق بيسمعك ويفهم انت محتاج إيه.",
    "سحب آمن بأدوات معقّمة.. بتتفتح قدامك، وبتتستخدم مرة واحدة بس.",
    "وعينتك بتتحلل على أجهزة آلية حديثة.. بدقة في كل رقم.",
    "سكر، غدة، أنيميا، كبد وكلى، فيتامينات.. بدل ألف سؤال، تحليل واحد يجاوبك.",
    "ونتيجة واضحة في إيدك.. بأسعار تنافسية، وخصومات على الباقات.",
    "متسألش جوجل.. اسأل معمل العاصمة. اتصل واحجز دلوقتي.",
]
# provisional (start, end) per line until the voice arrives, ~2.9 words/s
PROVISIONAL = [(0.3, 4.3), (4.7, 8.1), (8.5, 12.4), (12.8, 18.3), (18.7, 22.4), (22.8, 26.3),
               (26.7, 31.9), (32.3, 36.5), (36.9, 40.6)]

# clip per scene: (file, in-point seconds). Scene 7 is cut on the words (see "snaps").
CLIPS = [("s1.mp4", 2.4), ("s2.mp4", 1.4), ("s3.mp4", 0.0), ("s4.mp4", 0.0), ("s5.mp4", 0.4),
         ("s6.mp4", 2.0), ("s7.mp4", 0.0), ("s8.mp4", 3.3)]
TUBE_LANDS = [0.95, 2.35, 5.35, 7.15]   # seconds in s7.mp4 when each tube settles
CLIP_LEN = 7.93


# The take's line breaks (silence starts that end a line). Pauses inside a line can be as long as the ones
# between lines, so the breaks are set by matching each phrase's length to its text, not by gap length.
LINE_BREAKS = [3.89, 7.39, 12.49, 19.61, 24.76, 28.90, 35.12, 39.49]


def silences(path, noise=-30, d=0.15):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", f"silencedetect=noise={noise}dB:d={d}", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", out)]
    en = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", out)]
    m = re.search(r"Duration: (\d+):(\d+):([0-9.]+)", out)
    dur = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))
    return list(zip(st, en + [dur] * (len(st) - len(en)))), dur


def lines_from_voice(path):
    sil, dur = silences(path, -26, 0.2)
    bounds, t0 = [], 0.0
    if sil and sil[0][0] < 0.05:
        t0 = sil[0][1]
    for brk in LINE_BREAKS:
        s0, e0 = min(sil, key=lambda g: abs(g[0] - brk))
        bounds.append((t0, s0))
        t0 = e0
    tail = max((s0 for s0, _ in sil if s0 > t0 + 0.5), default=dur)  # the take's final silence ends the last line
    bounds.append((t0, tail))
    return bounds, sil


def place_words(text, a, b, sil):
    """Words spread over the voiced time of [a, b] only (pauses inside the line are skipped)."""
    ws = text.split(" ")
    weights = [len(re.sub(r"[.،؟:]", "", w)) + 1.5 for w in ws]
    gaps = [(max(a, s0), min(b, e0)) for s0, e0 in sil if e0 > a and s0 < b]
    voiced, t = [], a
    for s0, e0 in gaps:
        if s0 > t:
            voiced.append((t, s0))
        t = max(t, e0)
    if t < b:
        voiced.append((t, b))
    total = sum(e - s for s, e in voiced)

    def at(u):  # u in [0, total] voiced seconds -> clock time
        for s, e in voiced:
            if u <= e - s:
                return s + u
            u -= e - s
        return b

    out, acc, tot = [], 0.0, sum(weights)
    for w, k in zip(ws, weights):
        st = at(acc * total / tot)
        acc += k
        en = at(acc * total / tot)
        out.append([round(st, 3), round(en, 3), w])
    return out


def main():
    voice = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if voice:
        spans, sil = lines_from_voice(voice)
    else:
        spans, sil = PROVISIONAL, []
    assert len(spans) == len(LINES), spans
    words = []
    for (a, b), text in zip(spans, LINES):
        words += place_words(text, a, b, sil)
    lead = 0.25
    starts = [0.0] + [max(0.0, a - lead) for a, _ in spans[1:]]
    end_card = starts[8]
    duration = round(spans[8][1] + 3.2, 2)
    scenes = []
    for i in range(8):
        s0, s1 = starts[i], starts[i + 1]
        f, inp = CLIPS[i]
        avail = CLIP_LEN - inp
        rate = min(1.0, avail / (s1 - s0 + 0.5))
        scenes.append({"enter": round(s0, 3), "exit": round(s1, 3), "clip": f, "in": inp, "rate": round(rate, 3)})
    # scene 7: one snap per listed test, then hold the full rack
    l7 = [w for w in words if spans[6][0] - 0.01 <= w[0] <= spans[6][1]]
    items = [x.strip() for x in LINES[6].split("..")[0].split("،")]  # سكر / غدة / أنيميا / كبد وكلى / فيتامينات
    snaps, wi = [], 0
    for k, item in enumerate(items):
        snaps.append({"t": l7[wi][0], "clipT": TUBE_LANDS[k] + 0.12 if k < 4 else 7.6, "label": item})
        wi += len(item.split(" "))
    tl = {
        "fps": 30, "duration": duration, "lines": [list(s) for s in spans], "words": words,
        "scenes": scenes, "endCard": round(end_card, 3), "snaps": snaps,
        "beats": {
            "typeA": [round(spans[0][0] + 1.3, 2), round(spans[0][1] - 0.2, 2)],   # «ليه بتعب على طول؟»
            "chips": [round(spans[1][0] + 0.15 + 0.32 * i, 2) for i in range(6)],
            "erase": [round(spans[2][0] + 0.1, 2), round(spans[2][0] + 0.8, 2)],
            "typeB": [round(spans[2][0] + 1.3, 2), round(spans[2][0] + 2.6, 2)],     # «معمل العاصمة»
            "enter": round(spans[2][1] - 0.15, 2),
            "pin": round(spans[3][0] + 1.6, 2),
            "listen": round(spans[3][0] + 3.6, 2),
            "stamp": round(scenes[4]["enter"] + (3.4 - CLIPS[4][1]) / scenes[4]["rate"], 2),
            "scan": round(spans[5][0] + 1.0, 2),
            "tag": round(next(w[0] for w in words if w[2].startswith("بأسعار")), 2),
            "badge": round(next(w[0] for w in words if w[2].startswith("وخصومات")), 2),
        },
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(tl, ensure_ascii=False, indent=1))
    print("wrote", OUT, "duration", duration, "(voice)" if voice else "(provisional)")


if __name__ == "__main__":
    main()
