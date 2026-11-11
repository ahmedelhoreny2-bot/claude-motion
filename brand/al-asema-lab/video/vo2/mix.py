"""Mix video 2: the voiceover over the motion-driven sfx (public/asema/sfx2.wav).

    python3 brand/al-asema-lab/video/vo2/mix.py

The timeline was built on vo.mp3, so it plays from 0 unchanged. The closing line
(vo_end.mp3, when recorded) is placed at its caption slot.
"""
import json
import subprocess
from pathlib import Path

HERE = Path(__file__).parent
ROOT = HERE.parents[3]
tl = json.loads((ROOT / "src/asema2/timeline.json").read_text())


def main():
    dur = tl["duration"]
    end = HERE / "vo_end.mp3"
    inputs = ["-i", str(HERE / "vo.mp3"), "-i", str(ROOT / "public/asema/sfx2.wav")]
    vo = "[0:a]aformat=sample_rates=48000:channel_layouts=stereo[v0];"
    mix_in = "[v0]"
    n = 1
    if end.exists():
        inputs += ["-i", str(end)]
        at = int(tl["lines"][-1][0] * 1000)
        vo += f"[2:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay={at}|{at}[v1];"
        mix_in += "[v1]"
        n = 2
    graph = (
        vo + f"{mix_in}amix=inputs={n}:normalize=0,apad=whole_dur={dur},atrim=0:{dur},highpass=f=80,"
        "acompressor=threshold=-20dB:ratio=3:attack=5:release=120,equalizer=f=3000:t=q:w=1:g=3,volume=1.9[vo];"
        "[vo]asplit=2[vo1][vo2];"
        "[1:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.5[bed];"
        "[bed][vo1]sidechaincompress=threshold=0.02:ratio=8:attack=10:release=300[ducked];"
        f"[ducked][vo2]amix=inputs=2:normalize=0,afade=t=out:st={dur - 1.3}:d=1.3,"
        "loudnorm=I=-14:TP=-3:LRA=11,alimiter=limit=0.7:level=false[out]"
    )
    out = ROOT / "public/asema/mix2.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", graph, "-map", "[out]", "-ar", "48000", str(out)], check=True)
    print("wrote", out, "(with closing line)" if n == 2 else "(closing line not recorded yet)")


if __name__ == "__main__":
    main()
