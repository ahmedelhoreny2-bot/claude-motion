#!/usr/bin/env python3
"""Mux the Ibdaa showreel: picture + music/SFX bed + voiceover lines placed at timeline.vo.

    python3 scripts/ibdaa-mux.py 4x5      (reads out/ibdaa-4x5-silent.mp4, public/ibdaa/vo/vo01..)

Music ducks under the voice (sidechain), final loudness -14 LUFS / -1 dBTP.
"""
import glob, json, os, subprocess, sys

fmt = sys.argv[1] if len(sys.argv) > 1 else "4x5"
tl = json.load(open("src/ibdaa/timeline.json"))
vos = []
for i, t in enumerate(tl["vo"], 1):
    hits = sorted(glob.glob(f"public/ibdaa/vo/vo{i:02d}.*"))
    if hits:
        vos.append((t, hits[0]))
if not vos:
    sys.exit("no voiceover files in public/ibdaa/vo/")
args = ["ffmpeg", "-loglevel", "error", "-y", "-i", f"out/ibdaa-{fmt}-silent.mp4", "-i", "public/ibdaa/sfx.wav"]
for _, f in vos:
    args += ["-i", f]
parts = []
for k, (t, _) in enumerate(vos):
    ms = int(t * 1000)
    parts.append(f"[{k + 2}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={ms}|{ms}[v{k}]")
parts.append("".join(f"[v{k}]" for k in range(len(vos))) + f"amix=inputs={len(vos)}:normalize=0,volume=1.6,asplit[vo][sc]")
parts.append("[1:a][sc]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350[bed]")
parts.append(f"[bed][vo]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]")
args += ["-filter_complex", ";".join(parts), "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k",
         "-movflags", "+faststart", "-t", str(tl["duration"]), f"out/ibdaa-{fmt}.mp4"]
subprocess.run(args, check=True)
print(f"out/ibdaa-{fmt}.mp4 with {len(vos)} voice lines")
