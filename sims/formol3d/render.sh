#!/usr/bin/env bash
# Resumable render: 10 s segments, each written atomically; finished segments are skipped.
# Run from the repo root:  bash sims/formol3d/render.sh [workers]
cd "$(dirname "$0")/../.."
DUR=$(python3 -c "import json;print(json.load(open('sims/formol3d/timeline.json'))['duration'])")
N=$(python3 -c "import math;print(math.ceil($DUR/10))")
mkdir -p out/sims/seg
worker() {
  for ((k = 0; k < N; k++)); do
    f=$(printf "out/sims/seg/%03d.mp4" $k)
    [ -s "$f" ] && continue
    mkdir "out/sims/seg/$k.lock" 2>/dev/null || continue
    a=$((k * 10)); b=$(python3 -c "print(min($a+10,$DUR))")
    if node sims/capture.mjs formol3d --size 1920x1080 --dpr 1 --fps 30 --crf 18 --from $a --to $b --out "$f.tmp.mp4" > "out/sims/seg/$k.log" 2>&1; then
      mv "$f.tmp.mp4" "$f"
    fi
    rmdir "out/sims/seg/$k.lock"
  done
}
rm -rf out/sims/seg/*.lock out/sims/seg/*.tmp.mp4
for ((w = 0; w < ${1:-3}; w++)); do worker & sleep 3; done
wait
ls out/sims/seg/*.mp4 | wc -l
