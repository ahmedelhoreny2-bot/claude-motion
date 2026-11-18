#!/usr/bin/env python3
"""Mux an Ibdaa video: picture + music/SFX bed + voiceover lines placed at timeline.vo.

    python3 scripts/ibdaa-mux.py showreel 4x5     voice lines: public/ibdaa/vo/vo01.*  ...
    python3 scripts/ibdaa-mux.py explainer 9x16   voice lines: public/ibdaa/vo2/vo01.* ...

Music ducks under the voice (sidechain), final loudness -14 LUFS / -1.5 dBTP.
"""
import glob, json, subprocess, sys

VIDEOS = {
    "showreel": ("src/ibdaa/timeline.json", "ibdaa", "public/ibdaa/sfx.wav", "public/ibdaa/vo"),
    "explainer": ("src/ibdaa2/timeline.json", "explainer", "public/ibdaa/sfx2.wav", "public/ibdaa/vo2"),
}
name = sys.argv[1] if len(sys.argv) > 1 else "showreel"
fmt = sys.argv[2] if len(sys.argv) > 2 else "4x5"
tl_path, prefix, bed, vo_dir = VIDEOS[name]
tl = json.load(open(tl_path))
vos = []
for i, t in enumerate(tl["vo"], 1):
    hits = sorted(glob.glob(f"{vo_dir}/vo{i:02d}.*"))
    if hits:
        vos.append((t, hits[0]))
if not vos:
    sys.exit(f"no voiceover files in {vo_dir}/")
args = ["ffmpeg", "-loglevel", "error", "-y", "-i", f"out/{prefix}-{fmt}-silent.mp4", "-i", bed]
for _, f in vos:
    args += ["-i", f]
parts = []
for k, (t, _) in enumerate(vos):
    ms = int(t * 1000)
    parts.append(f"[{k + 2}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={ms}|{ms}[v{k}]")
parts.append("".join(f"[v{k}]" for k in range(len(vos))) + f"amix=inputs={len(vos)}:normalize=0,volume=1.6,asplit[vo][sc]")
parts.append("[1:a][sc]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350[duck]")
parts.append("[duck][vo]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]")
args += ["-filter_complex", ";".join(parts), "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k",
         "-movflags", "+faststart", "-t", str(tl["duration"]), f"out/{prefix}-{fmt}.mp4"]
subprocess.run(args, check=True)
print(f"out/{prefix}-{fmt}.mp4 with {len(vos)} voice lines")
