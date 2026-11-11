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
MASCOT = [[0.0, 540.0, 1180.0, 1.7], [2.7, 540.0, 1180.0, 1.7], [3.25, 210.0, 1300.0, 0.95], [5.85, 210.0, 1300.0, 0.95], [6.5, 540.0, 1300.0, 0.85], [6.9, 150.0, 1290.0, 1.05], [7.2, 150.0, 1290.0, 1.05], [8.2, 400.0, 1290.0, 1.05], [10.5, 400.0, 1290.0, 1.05], [10.6, 160.0, 1060.0, 0.7], [12.35, 640.0, 1060.0, 0.7], [13.9, 640.0, 1060.0, 0.7], [14.2, 870.0, 1300.0, 0.85], [18.6, 870.0, 1300.0, 0.85], [18.9, 110.0, 1310.0, 0.8], [25.0, 110.0, 1310.0, 0.8], [25.3, 880.0, 1320.0, 0.85], [27.75, 880.0, 1320.0, 0.85], [27.91, 820.0, 1030.0, 0.75], [28.6, 540.0, 1030.0, 0.75], [29.27, 260.0, 1030.0, 0.75], [29.85, 540.0, 760.0, 0.9]]

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
    tl = {"fps": 60, "duration": 38.5, **BEATS, "mascot": MASCOT, "lines": [[a, b] for a, b, _, _ in SEG], "words": words}
    out = ROOT / "src/asema2/timeline.json"
    out.write_text(json.dumps(tl, ensure_ascii=False, indent=1))
    print("wrote", out, len(words), "words")


if __name__ == "__main__":
    main()
