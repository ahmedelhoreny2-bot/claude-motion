#!/bin/bash
# Render a composition in chunks, retrying any chunk that stalls, then join.
#   scripts/render-chunks.sh <CompositionId> <timeline.json> <out.mp4>
set -u
ID=$1; TLJ=$2; OUT=$3
N=$(python3 -c "import json,sys;t=json.load(open(sys.argv[1]));print(round(t['duration']*t['fps']))" "$TLJ")
STEP=240; list=out/chunks-$ID.txt; : > $list
for ((a=0; a<N; a+=STEP)); do
  b=$((a+STEP-1)); [ $b -ge $N ] && b=$((N-1))
  f=out/chunk-$ID-$a.mp4; rm -f $f
  for try in 1 2 3; do
    npx remotion render $ID $f --frames=$a-$b --gl=angle --concurrency=3 --timeout=90000 --log=error && break
    echo "retry chunk $a ($try)"
  done
  [ -f $f ] || { echo "FAILED chunk $a"; exit 1; }
  echo "file '$(pwd)/$f'" >> $list
  echo "chunk $a-$b done"
done
ffmpeg -loglevel error -y -f concat -safe 0 -i $list -c copy $OUT && echo JOINED
