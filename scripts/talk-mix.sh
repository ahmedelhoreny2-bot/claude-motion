#!/usr/bin/env bash
# Voice + effects for SedraTalk, mastered to -14 LUFS.
set -e
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 public/sedra/raw/talk_sfx.wav)
ffmpeg -v error -y -i public/sedra/raw/talk_voice_edit.wav -i public/sedra/raw/talk_sfx.wav -filter_complex \
 "[0:a]aformat=sample_rates=48000:channel_layouts=stereo,apad[v];[1:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.5[s];\
  [v][s]amix=inputs=2:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000[out]" \
 -map "[out]" -t "$D" public/sedra/raw/talk_final_audio.wav
echo "wrote public/sedra/raw/talk_final_audio.wav"
