#!/usr/bin/env bash
# Mux the promo: picture + voice + SFX (+ music if public/ibdaa/promo/music.* exists, ducked under the voice).
#   bash scripts/promo-mux.sh 4x5
set -e
cd "$(dirname "$0")/.."
F=${1:-4x5}
V=out/promo-$F-silent.mp4
M=$(ls public/ibdaa/promo/music.* 2>/dev/null | head -1 || true)
if [ -n "$M" ]; then
  ffmpeg -loglevel error -y -i "$V" -i public/ibdaa/promo/vo.wav -i public/ibdaa/promo/sfx.wav -stream_loop -1 -i "$M" -filter_complex \
    "[1:a]aformat=channel_layouts=stereo,asplit[vo][sc];[3:a]aformat=channel_layouts=stereo,volume=0.55[mu];[mu][sc]sidechaincompress=threshold=0.04:ratio=5:attack=20:release=300[duck];[2:a]volume=0.8[fx];[vo][fx][duck]amix=inputs=3:normalize=0,alimiter=limit=0.7:level=false,loudnorm=I=-14:TP=-2:LRA=9,aresample=48000[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k -movflags +faststart -shortest out/promo-$F.mp4
else
  ffmpeg -loglevel error -y -i "$V" -i public/ibdaa/promo/vo.wav -i public/ibdaa/promo/sfx.wav -filter_complex \
    "[1:a]aformat=channel_layouts=stereo[vo];[2:a]volume=0.8[fx];[vo][fx]amix=inputs=2:normalize=0,alimiter=limit=0.7:level=false,loudnorm=I=-14:TP=-2:LRA=9,aresample=48000[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k -movflags +faststart -shortest out/promo-$F.mp4
fi
echo out/promo-$F.mp4
