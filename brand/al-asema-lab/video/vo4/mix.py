"""Video 4 (SeeInside): voice over the paper-foley bed, then mux.

    python3 brand/al-asema-lab/video/vo4/mix.py [silent.mp4 out.mp4]
"""
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent
ROOT = HERE.parents[3]


def main():
    dur = json.loads((ROOT / "src/asema4/timeline.json").read_text())["duration"]
    out = ROOT / "public/asema4/mix.wav"
    graph = (
        f"[0:a]aformat=sample_rates=48000:channel_layouts=stereo,apad=whole_dur={dur},atrim=0:{dur},highpass=f=80,"
        "acompressor=threshold=-20dB:ratio=3:attack=5:release=120,equalizer=f=3000:t=q:w=1:g=3,volume=1.9[vo];"
        "[vo]asplit=2[vo1][vo2];"
        "[1:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.6[bed];"
        "[bed][vo1]sidechaincompress=threshold=0.02:ratio=6:attack=10:release=280[ducked];"
        f"[ducked][vo2]amix=inputs=2:normalize=0,afade=t=out:st={dur - 1.0}:d=1.0,"
        "loudnorm=I=-14:TP=-3:LRA=11,alimiter=limit=0.7:level=false[out]"
    )
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(HERE / "vo.mp3"), "-i", str(ROOT / "public/asema4/sfx.wav"),
                    "-filter_complex", graph, "-map", "[out]", "-ar", "48000", str(out)], check=True)
    print("wrote", out)
    if len(sys.argv) > 2:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", sys.argv[1], "-i", str(out), "-map", "0:v", "-map", "1:a",
                        "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-shortest", sys.argv[2]], check=True)
        print("wrote", sys.argv[2])


if __name__ == "__main__":
    main()
