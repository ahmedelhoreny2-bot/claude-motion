"""Splice re-recorded lines (same voice) into a finished take, replacing a mispronounced line.

    python3 brand/al-asema-lab/video/fix_lines.py

Each fix replaces take[a:b] (a = the old line's first sound, b = its final silence start) with the new
recording's speech, gain-matched to the old line; an over-long inner pause can be shortened. The pauses
around the line stay as they were, so everything after it moves by (new length - old length).
"""
import subprocess
from pathlib import Path

HERE = Path(__file__).parent

# take, output, [(a, b, fix file, speech end in fix, gain dB, (pause start, pause end, keep) or None)]
JOBS = [
    ("vo4/vo-prefix.mp3", "vo4/vo.mp3", [(11.63, 14.80, "vo4/fix-gland.mp3", 3.97, 0.9, (2.29, 2.91, 0.38))]),
    ("vo3/vo-prefix.mp3", "vo3/vo.mp3", [(25.02, 28.90, "vo3/fix-sample.mp3", 4.61, 3.5, None),
                                         (39.79, 43.78, "vo3/fix-google.mp3", 4.45, 2.9, None)]),
]
F = "aformat=sample_rates=44100:channel_layouts=mono"


def run(take, out, fixes):
    ins, parts, t, n = ["-i", str(HERE / take)], [], 0.0, 0
    for i, (a, b, fix, end, gain, pause) in enumerate(fixes):
        ins += ["-i", str(HERE / fix)]
        k = i + 1
        parts.append(f"[0:a]{F},atrim={t}:{a},asetpts=N/SR/TB,afade=t=out:st={a - t - 0.01}:d=0.01[p{n}];")
        n += 1
        if pause:
            p0, p1, keep = pause
            cut = (p1 - p0 - keep) / 2
            parts.append(f"[{k}:a]{F},volume={gain}dB,asplit=2[f{k}a][f{k}b];"
                         f"[f{k}a]atrim=0:{p0 + cut},asetpts=N/SR/TB[p{n}];"
                         f"[f{k}b]atrim={p1 - cut}:{end + 0.03},asetpts=N/SR/TB,afade=t=out:st={end + 0.02 - p1 + cut}:d=0.01[p{n + 1}];")
            n += 2
        else:
            parts.append(f"[{k}:a]{F},volume={gain}dB,atrim=0:{end + 0.03},asetpts=N/SR/TB,afade=t=out:st={end + 0.02}:d=0.01[p{n}];")
            n += 1
        t = b
    parts.append(f"[0:a]{F},atrim=start={t},asetpts=N/SR/TB,afade=t=in:d=0.01[p{n}];")
    n += 1
    graph = "".join(parts) + "".join(f"[p{j}]" for j in range(n)) + f"concat=n={n}:v=0:a=1[out]"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *ins, "-filter_complex", graph, "-map", "[out]",
                    "-c:a", "libmp3lame", "-b:a", "192k", str(HERE / out)], check=True)
    print("wrote", out)


for job in JOBS:
    run(*job)
