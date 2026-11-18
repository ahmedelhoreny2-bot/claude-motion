"""Assemble the Sedra voiceover from timeline.json `vo` clips → public/sedra/vo.wav."""
import json, subprocess
tl = json.load(open("src/sedra/timeline.json"))
src = {"main": "public/sedra/vo-main.mp3", "services": "public/sedra/vo-services.mp3"}
args, chains = [], []
for i, c in enumerate(tl["vo"]):
    args += ["-i", src[c["src"]]]
    d = int(c["at"] * 1000)
    chains.append(f"[{i}:a]atrim={c['in']}:{c['out']},asetpts=PTS-STARTPTS,aresample=48000,"
                  f"afade=t=in:d=0.03,afade=t=out:st={c['out']-c['in']-0.06:.3f}:d=0.06,adelay={d}|{d}[a{i}]")
mix = "".join(f"[a{i}]" for i in range(len(tl["vo"])))
fc = ";".join(chains) + f";{mix}amix=inputs={len(tl['vo'])}:normalize=0,apad=whole_dur={tl['duration']}[out]"
subprocess.run(["ffmpeg", "-v", "error", "-y", *args, "-filter_complex", fc, "-map", "[out]", "-ac", "2", "-t", str(tl["duration"]), "public/sedra/vo.wav"], check=True)
print("wrote public/sedra/vo.wav")
