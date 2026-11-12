"""Build src/asema2/timeline.json from the voiceover: one segment per spoken phrase (from
ffmpeg silencedetect at -26 dB + RMS dips), word timings for the captions, scene beats.

    python3 brand/al-asema-lab/video/vo2/make_timeline.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]

# (start, end, text, optional per-word start anchors) in seconds of vo.mp3
SEG = [
    (0.00, 1.10, "محتاج تعمل تحاليل..", None),
    (1.65, 2.53, "ومحتار تروح فين؟", None),
    (2.95, 4.14, "في قلب ميت غمر..", None),
    (4.55, 6.50, "معمل العاصمة للتحاليل الطبية.", [4.55, 4.95, 5.70, 6.18]),
    (6.89, 8.18, "مكان نضيف ومريح..", None),
    (8.42, 9.30, "من أول ما تدخل.", None),
    (9.78, 12.14, "نظام آلي متكامل، وأجهزة حديثة..", [9.78, 10.1, 10.3, 10.72, 11.4]),
    (12.40, 13.77, "بتقرا عينتك بدقة.", [12.46, 12.85, 13.3]),
    (14.08, 14.94, "أدوات معقّمة،", None),
    (15.23, 16.81, "بتتستخدم مرة واحدة بس..", [15.23, 15.75, 16.0, 16.44]),
    (17.08, 17.64, "ونضافة", None),
    (17.83, 18.44, "في كل خطوة.", None),
    (18.84, 19.46, "صورة دم،", None),
    (19.70, 20.11, "سكر،", None),
    (20.34, 21.04, "كبد وكلى،", [20.34, 20.76]),
    (21.24, 21.68, "غدة،", None),
    (21.88, 22.93, "فيتامينات وهرمونات..", [21.95, 22.43]),
    (23.27, 24.85, "كل تحاليلك في مكان واحد.", [23.27, 23.55, 24.1, 24.25, 24.4]),
    (25.20, 27.65, "وبأسعار تنافسية.. وخصومات على الباقات.", [25.2, 25.92, 26.45, 26.97, 27.1]),
    (27.91, 28.31, "دقة..", None),
    (28.60, 29.02, "سرعة..", None),
    (29.27, 29.60, "جودة.", None),
    # not in vo.mp3 yet: provisional slot for the closing line (vo_end.mp3 when it arrives)
    (30.40, 33.90, "معمل العاصمة.. صحتك أمانة عندنا. اتصل واحجز دلوقتي.", [30.4, 30.8, 31.5, 31.95, 32.4, 33.0, 33.35, 33.65]),
]

# mascot path: [time, x, feet y, scale]; the picture hops between keys, the sound lands each hop
MASCOT = [[0.0, 540.0, 1180.0, 1.7], [2.7, 540.0, 1180.0, 1.7], [3.25, 210.0, 1300.0, 0.95], [5.85, 210.0, 1300.0, 0.95], [6.5, 540.0, 1300.0, 0.85], [6.9, 150.0, 1290.0, 1.05], [7.2, 150.0, 1290.0, 1.05], [8.2, 400.0, 1290.0, 1.05], [10.5, 400.0, 1290.0, 1.05], [10.6, 160.0, 1060.0, 0.7], [12.35, 640.0, 1060.0, 0.7], [13.9, 640.0, 1060.0, 0.7], [14.2, 870.0, 1300.0, 0.85], [18.6, 870.0, 1300.0, 0.85], [18.9, 110.0, 1310.0, 0.8], [25.0, 110.0, 1310.0, 0.8], [25.3, 880.0, 1320.0, 0.85], [27.75, 880.0, 1320.0, 0.85], [27.91, 820.0, 535.0, 0.6], [28.6, 540.0, 535.0, 0.6], [29.27, 260.0, 535.0, 0.6], [29.85, 540.0, 760.0, 0.9]]

BEATS = {
    "s1": {"enter": 0, "q": 0.25, "signs": [0.55, 0.75, 0.95], "look": 1.65},
    "s2": {"enter": 2.85, "pin": 2.95, "chip": 3.6, "build": 4.45, "sign": 4.95, "hop": 5.9},
    "s3": {"enter": 6.85, "door": 6.95, "walk": 7.2, "shine": [7.55, 7.75, 7.95], "welcome": 8.42},
    "s4": {"enter": 9.7, "machine": 9.8, "ride": 10.6, "screen": 10.75, "scan": 12.4, "check": 13.3},
    "s5": {"enter": 14.0, "packs": [14.1, 14.3, 14.5], "stamp": 15.95, "wipe": 17.05, "sparkle": [17.85, 18.05, 18.25]},
    "s6": {"enter": 18.75, "tubes": [18.84, 19.70, 20.34, 21.24, 21.95, 22.43], "all": 23.27},
    "s7": {"enter": 25.1, "tag": 25.2, "snip": 25.92, "badge": 26.45},
    "s8": {"enter": 27.8, "w": [27.91, 28.6, 29.27]},
    "s9": {"enter": 29.75, "burst": 29.9, "stripe": 30.0, "arm": 30.15, "tube": 30.55, "name": 30.6,
           "tagline": 31.5, "cta": 32.9, "contact": 33.6},
}


# The picture was choreographed on the first take. The final take (vo.mp3: full script with the corrected
# «في قلب ميت غمر..» line spliced in) speaks the same lines at slightly different moments, so every time in
# the timeline is warped piecewise-linearly through these (first take, final take) anchors: line starts and ends.
WARP = [
    (0.00, 0.00), (1.10, 1.04), (1.65, 1.64), (2.53, 2.55), (2.95, 3.02), (4.14, 4.03), (4.55, 4.43), (6.50, 6.47),
    (6.89, 6.89), (8.18, 8.32), (8.42, 8.59), (9.30, 9.38), (9.78, 9.94), (12.14, 12.25), (12.40, 12.56), (13.77, 13.93),
    (14.08, 14.23), (14.94, 15.14), (15.23, 15.40), (16.81, 16.97), (17.08, 17.21), (18.44, 18.58), (18.84, 18.97),
    (20.11, 20.25), (20.34, 20.47), (22.93, 23.09), (23.27, 23.44), (24.85, 24.98), (25.20, 25.34), (27.65, 27.76),
    (27.91, 28.23), (28.31, 28.65), (28.60, 28.94), (29.02, 29.33), (29.27, 29.54), (29.60, 29.84), (30.40, 30.14),
    (33.90, 34.11),
]


def warp(t):
    if t <= WARP[0][0]:
        return t
    for (a0, b0), (a1, b1) in zip(WARP, WARP[1:]):
        if t <= a1:
            return round(b0 + (t - a0) * (b1 - b0) / (a1 - a0), 3)
    return round(t + WARP[-1][1] - WARP[-1][0], 3)


def warped(x):
    if isinstance(x, (int, float)):
        return warp(x)
    if isinstance(x, list):
        return [warped(v) for v in x]
    if isinstance(x, dict):
        return {k: warped(v) for k, v in x.items()}
    return x


def main():
    words = []
    for a, b, text, anch in SEG:
        ws = text.split(" ")
        if anch is None:
            weights = [len(w.strip(".،؟")) + 1 for w in ws]
            tot, t, anch = sum(weights), a, []
            for w in weights:
                anch.append(t)
                t += (b - a) * w / tot
        assert len(anch) == len(ws), text
        for i, w in enumerate(ws):
            words.append([round(anch[i], 3), round(anch[i + 1] if i + 1 < len(ws) else b, 3), w])
    beats = {k: warped(v) for k, v in BEATS.items()}
    mascot = [[warp(k[0])] + k[1:] for k in MASCOT]
    lines = [[warp(a), warp(b)] for a, b, _, _ in SEG]
    words = [[warp(a), warp(b), w] for a, b, w in words]
    tl = {"fps": 60, "duration": warp(38.5), **beats, "mascot": mascot, "lines": lines, "words": words}
    out = ROOT / "src/asema2/timeline.json"
    out.write_text(json.dumps(tl, ensure_ascii=False, indent=1))
    print("wrote", out, len(words), "words")


if __name__ == "__main__":
    main()
