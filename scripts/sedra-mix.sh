#!/usr/bin/env bash
# Voice over the score for SedraAd: the score ducks under the voice, master to -14 LUFS.
set -e
ffmpeg -v error -y -i public/sedra/vo-full.mp3 -i public/sedra/score.wav -filter_complex \
 "[0:a]aformat=sample_rates=48000:channel_layouts=stereo,highpass=f=80,acompressor=threshold=0.1:ratio=3:attack=5:release=120,volume=1.5,apad,asplit=2[v][sc];\
  [1:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.55[m];\
  [m][sc]sidechaincompress=threshold=0.025:ratio=5:attack=20:release=400[md];\
  [v][md]amix=inputs=2:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000[out]" \
 -map "[out]" -t "$(ffprobe -v error -show_entries format=duration -of csv=p=0 public/sedra/score.wav)" public/sedra/final-audio.wav
echo "wrote public/sedra/final-audio.wav"
