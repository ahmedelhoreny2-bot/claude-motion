#!/usr/bin/env bash
# Voice over music for SedraAd: music ducks under the voice, master to -14 LUFS.
set -e
ffmpeg -v error -y -i public/sedra/vo.wav -i public/sedra.wav -filter_complex \
 "[0:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=1.6,asplit=2[v][sc];\
  [1:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.42[m];\
  [m][sc]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350[md];\
  [v][md]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000[out]" \
 -map "[out]" public/sedra/final-audio.wav
echo "wrote public/sedra/final-audio.wav"
