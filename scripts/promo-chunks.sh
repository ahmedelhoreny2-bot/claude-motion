#!/bin/bash
# Render IbdaaPromo in chunks, retrying any chunk that stalls, then join.
set -u
N=$(python3 -c "import json;t=json.load(open('src/promo/timeline.json'));print(round(t['duration']*t['fps']))"); STEP=240; i=0; list=out/chunks.txt; : > $list
for ((a=0; a<N; a+=STEP)); do
  b=$((a+STEP-1)); [ $b -ge $N ] && b=$((N-1))
  f=out/chunk_$a.mp4
  for try in 1 2 3; do
    npx remotion render IbdaaPromo $f --frames=$a-$b --gl=angle --concurrency=3 --timeout=90000 --log=error && break
    echo "retry chunk $a ($try)"
  done
  [ -f $f ] || { echo "FAILED chunk $a"; exit 1; }
  echo "file '$(pwd)/$f'" >> $list
  echo "chunk $a-$b done"
done
ffmpeg -loglevel error -y -f concat -safe 0 -i $list -c copy out/ibdaa-silent.mp4 && echo JOINED
