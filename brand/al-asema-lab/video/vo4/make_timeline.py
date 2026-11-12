"""Timeline for SeeInside (video 4, «شوف اللي مش باين»): Vox-style paper collage + kinetic type.

    python3 brand/al-asema-lab/video/vo4/make_timeline.py

vo.mp3 = the take with the address phrase replaced by «في قلب ميت غمر..» (from ../vo2/fix-line2.mp3, same voice).
Lines are set from the take's pauses; words are spread over voiced time only; every scene beat is a word.
"""
import json
import re
import subprocess
from pathlib import Path

HERE = Path(__file__).parent
ROOT = HERE.parents[3]
OUT = ROOT / "src/asema4/timeline.json"

LINES = [
    ("استنى.. متقلّبش. جسمك دلوقتي بيحصل فيه حاجة.. انت مش شايفها.", 0.00, 4.58),
    ("نَفَس بيتقطع على السلم.. ممكن يكون حديد ناقص.", 5.02, 7.99),
    ("عطش وتعب بعد الأكل.. ممكن يكون سكر عالي.", 8.25, 11.24),
    ("نعاس طول اليوم وتقل في الجسم.. ممكن تكون الغدة.", 11.63, 14.80),
    ("الحاجات دي مش بتتشاف بالعين.. بتتشاف في التحليل.", 15.08, 17.99),
    ("وفي معمل العاصمة للتحاليل الطبية.. أجهزة آلية حديثة بتقرا اللي جسمك مخبيه، بدقة في كل رقم.", 18.38, 24.93),
    ("ونتيجتك توصلك بسرعة.. عشان ترجع لحياتك وانت مطمن.", 25.20, 28.77),
    ("معمل العاصمة.. شوف اللي مش باين. في قلب ميت غمر.. اتصل واحجز دلوقتي.", 29.17, 34.52),
]
DURATION = 39.0


def silences(path):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "silencedetect=noise=-30dB:d=0.15", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", out)]
    en = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", out)]
    return list(zip(st, en))


def place_words(text, a, b, sil):
    ws = text.split(" ")
    weights = [len(re.sub(r"[.،؟:]", "", w)) + 1.5 for w in ws]
    voiced, t = [], a
    for s0, e0 in sil:
        s0, e0 = max(a, s0), min(b, e0)
        if e0 <= s0:
            continue
        if s0 > t:
            voiced.append((t, s0))
        t = max(t, e0)
    if t < b:
        voiced.append((t, b))
    total = sum(e - s for s, e in voiced)

    def at(u):
        for s, e in voiced:
            if u <= e - s + 1e-9:
                return s + u
            u -= e - s
        return b

    out, acc, tot = [], 0.0, sum(weights)
    for w, k in zip(ws, weights):
        st = at(acc * total / tot)
        acc += k
        out.append([round(st, 3), round(at(acc * total / tot), 3), w])
    return out


def voiced_chunks(a, b, sil):
    out, t = [], a
    for s0, e0 in sil:
        s0, e0 = max(a, s0), min(b, e0)
        if e0 <= s0:
            continue
        if s0 > t:
            out.append((t, s0))
        t = max(t, e0)
    if t < b:
        out.append((t, b))
    return out


def place_line(text, a, b, sil):
    """When the line has as many spoken chunks as written phrases (split after .. . ، ؟ :), each phrase gets its chunk."""
    ws = text.split(" ")
    phrases, cur = [], []
    for x in ws:
        cur.append(x)
        if re.search(r"(\.\.|[.،؟:])$", x):
            phrases.append(cur)
            cur = []
    if cur:
        phrases.append(cur)
    chunks = voiced_chunks(a, b, sil)
    if len(chunks) != len(phrases):
        return place_words(text, a, b, sil)
    out = []
    for ph, (c0, c1) in zip(phrases, chunks):
        out += place_words(" ".join(ph), c0, c1, [])
    return out


def main():
    sil = silences(HERE / "vo.mp3")
    words = []
    for text, a, b in LINES:
        words += place_line(text, a, b, sil)

    def w(prefix, after=0.0):
        return round(next(x[0] for x in words if x[0] >= after and x[2].startswith(prefix)), 3)

    L = [(a, b) for _, a, b in LINES]
    tl = {
        "fps": 30, "duration": DURATION, "lines": [list(x) for x in L], "words": words,
        # scene starts (a torn-paper wipe lands ~0.2 s before each line)
        "scenes": [0.0, 4.80, 8.10, 11.45, 14.95, 18.20, 25.05, 29.00],
        "b": {
            "stop": 0.0, "scroll": w("متقلّبش"), "body": w("جسمك"), "circle": w("حاجة"), "blind": w("انت", 3),
            "drop": L[1][0] + 0.1, "fe": w("ممكن", 5), "low": w("حديد"),
            "glass": L[2][0] + 0.05, "sugar": w("بعد", 8), "gauge": w("ممكن", 9), "high": w("سكر", 9),
            "sleep": L[3][0] + 0.1, "heavy": w("وتقل"), "gland": w("الغدة"),
            "k1": w("مش", 15), "k2": w("بالعين"), "k3": w("بتتشاف", 16.5), "k4": w("التحليل"),
            "logo": L[5][0] + 0.05, "machines": w("أجهزة"), "rack": w("بتقرا"), "sheet": w("بدقة"), "marks": w("رقم"),
            "check": L[6][0] + 0.05, "fast": w("بسرعة"), "life": w("عشان", 25),
            "end": L[7][0], "tag": w("شوف", 29), "pin": w("في", 31), "cta": w("اتصل", 32),
        },
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(tl, ensure_ascii=False, indent=1))
    print("wrote", OUT)
    print(tl["b"])


if __name__ == "__main__":
    main()
