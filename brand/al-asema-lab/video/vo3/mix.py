"""Video 3 (AskLab): voice over the sfx bed, then mux with the rendered picture.

    python3 brand/al-asema-lab/video/vo3/mix.py vo.mp3 [silent.mp4 out.mp4]

The timeline is built from the same vo.mp3 (make_timeline.py), so the voice plays from 0 unchanged.
The bed ducks under the voice; master at -14 LUFS with a -1.5 dBTP ceiling after AAC.
"""
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent
ROOT = HERE.parents[3]


def main():
    vo = Path(sys.argv[1])
    dur = json.loads((ROOT / "src/asema3/timeline.json").read_text())["duration"]
    out = ROOT / "public/asema3/mix.wav"
    graph = (
        f"[0:a]aformat=sample_rates=48000:channel_layouts=stereo,apad=whole_dur={dur},atrim=0:{dur},highpass=f=80,"
        "acompressor=threshold=-20dB:ratio=3:attack=5:release=120,equalizer=f=3000:t=q:w=1:g=3,volume=1.9[vo];"
        "[vo]asplit=2[vo1][vo2];"
        "[1:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.55[bed];"
        "[bed][vo1]sidechaincompress=threshold=0.02:ratio=7:attack=10:release=320[ducked];"
        f"[ducked][vo2]amix=inputs=2:normalize=0,afade=t=out:st={dur - 1.2}:d=1.2,"
        "loudnorm=I=-14:TP=-3:LRA=11,alimiter=limit=0.7:level=false[out]"
    )
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(vo), "-i", str(ROOT / "public/asema3/sfx.wav"),
                    "-filter_complex", graph, "-map", "[out]", "-ar", "48000", str(out)], check=True)
    print("wrote", out)
    if len(sys.argv) > 3:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", sys.argv[2], "-i", str(out), "-map", "0:v", "-map", "1:a",
                        "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-shortest", sys.argv[3]], check=True)
        print("wrote", sys.argv[3])


if __name__ == "__main__":
    main()
