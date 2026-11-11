"""Place the voiceover on the promo timeline and mix it over the sfx bed.

    python3 brand/al-asema-lab/video/mix_vo.py

Inputs:  brand/al-asema-lab/video/vo/full.mp3     (all ten lines, one take)
         brand/al-asema-lab/video/vo/promise.mp3  (re-recorded "دقة، سرعة، جودة")
         public/asema/sfx.wav                     (sfx + music bed from sfx/cues/asema.py)
Output:  public/asema/mix.wav  (-14 LUFS), then mux with out/asema-silent.mp4

Every placement is a timeline beat; cut points are seconds inside the source take
(found with ffmpeg silencedetect). "جوّاك جيش كامل" is left out on purpose: it stays on
screen, and the voice carries only "صورة الدم الكاملة بتطمّنك عليه".
"""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
VO = Path(__file__).parent / "vo"
tl = json.loads((ROOT / "src/asema/timeline.json").read_text())
s = tl

# (source file, in, out, start on timeline). Lines play at TEMPO (slightly faster, tighter read).
TEMPO = 1.07
CUTS = [
    ("full", 0.00, 2.50, s["s1"]["vo"]),              # جسمك بيكلّمك.. إنت سامعه؟
    ("full", 2.85, 4.60, s["s2"]["vo"]),              # شحن كبدك كام في المية؟
    ("full", 4.95, 8.82, s["s3"]["vo"]),              # كليتك بتفلتر حوالي ١٨٠ لتر في اليوم!
    ("full", 9.20, 13.84, s["s4"]["vo"]),             # برد؟ حر؟ تعب على طول؟ يمكن الغدة الدرقية.
    ("full", 14.15, 17.26, s["s5"]["vo"]),            # عايش في بلد الشمس.. وناقصك فيتامين د؟
    ("full", 17.47, 21.39, s["s9"]["vo"]),            # مفاصلك بتزيّق؟ قبل ما تزيّتها.. اعرف السبب.
    ("full", 23.58, 26.29, s["s6"]["vo"]),            # صورة الدم الكاملة بتطمّنك عليه.
    ("full", 26.58, 28.83, s["s10"]["vo"]),           # مش فاصوليا.. دي كليتك!
    ("promise", 0.00, 0.62, s["s7"]["w"][0] - 0.05),  # دقة
    ("promise", 1.06, 1.68, s["s7"]["w"][1] - 0.05),  # سرعة
    ("promise", 2.09, 2.93, s["s7"]["w"][2] - 0.05),  # جودة
    ("full", 31.60, 33.70, s["s7"]["vo"]),            # نظام آلي متكامل.
    ("full", 33.98, 38.03, s["s8"]["vo"]),            # معمل العاصمة للتحاليل الطبية.. احجز دلوقتي.
]


def main():
    inputs = ["-i", str(VO / "full.mp3"), "-i", str(VO / "promise.mp3"), "-i", str(ROOT / "public/asema/sfx.wav")]
    src = {"full": 0, "promise": 1}
    parts, labels = [], []
    for i, (f, a, b, at) in enumerate(CUTS):
        d = (b - a) / TEMPO
        parts.append(
            f"[{src[f]}:a]atrim={a}:{b},asetpts=PTS-STARTPTS,atempo={TEMPO},aformat=sample_rates=48000:channel_layouts=stereo,"
            f"afade=t=in:d=0.02,afade=t=out:st={d - 0.04:.3f}:d=0.04,adelay={int(at * 1000)}|{int(at * 1000)}[v{i}]"
        )
        labels.append(f"[v{i}]")
    dur = tl["duration"]
    graph = ";".join(parts) + ";" + "".join(labels) + (
        f"amix=inputs={len(CUTS)}:normalize=0,apad=whole_dur={dur},atrim=0:{dur},"
        "highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,volume=1.6[vo];"
        "[vo]asplit=2[vo1][vo2];"
        "[2:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.75[bed];"
        "[bed][vo1]sidechaincompress=threshold=0.04:ratio=4:attack=15:release=250[ducked];"
        f"[ducked][vo2]amix=inputs=2:normalize=0,afade=t=out:st={dur - 1.3}:d=1.3,loudnorm=I=-14:TP=-1.5:LRA=11[out]"
    )
    out = ROOT / "public/asema/mix.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", graph, "-map", "[out]", "-ar", "48000", str(out)], check=True)
    print("wrote", out)


if __name__ == "__main__":
    main()
