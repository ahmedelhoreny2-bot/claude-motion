#!/usr/bin/env bash
# Voice + soft effects for SedraTalk: effects duck under the voice, master to -14 LUFS.
set -e
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 public/sedra/raw/talk_sfx.wav)
ffmpeg -v error -y -i public/sedra/raw/talk_voice_edit.wav -i public/sedra/raw/talk_sfx.wav -filter_complex \
 "[0:a]aformat=sample_rates=48000:channel_layouts=stereo,equalizer=f=180:t=q:w=1:g=1.5,equalizer=f=6500:t=q:w=1.5:g=-2,apad,asplit=2[v][sc];\
  [1:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.45[s];\
  [s][sc]sidechaincompress=threshold=0.02:ratio=6:attack=30:release=500[sd];\
  [v][sd]amix=inputs=2:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=8,aresample=48000[out]" \
 -map "[out]" -t "$D" public/sedra/raw/talk_final_audio.wav
echo "wrote public/sedra/raw/talk_final_audio.wav"
