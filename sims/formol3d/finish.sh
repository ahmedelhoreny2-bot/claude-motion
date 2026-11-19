#!/usr/bin/env bash
# Concatenate finished segments and mux the voice/music mix.
cd "$(dirname "$0")/../.."
ls out/sims/seg/[0-9][0-9][0-9].mp4 | sed "s#out/sims/seg/#file '#; s#\$#'#" > out/sims/seg/list.txt
ffmpeg -loglevel error -y -f concat -safe 0 -i out/sims/seg/list.txt -c copy out/sims/formol3d-silent.mp4
ffmpeg -loglevel error -y -i out/sims/formol3d-silent.mp4 -i public/formol3d-mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -movflags +faststart -shortest out/sims/formol3d.mp4
ffprobe -v error -count_frames -show_entries stream=nb_read_frames:format=duration -of csv=p=0 out/sims/formol3d.mp4
