#!/usr/bin/env bash
# Cuts the showreel source clips and stills out of public/ibdaa/videos.
set -e
cd "$(dirname "$0")/../public/ibdaa"
mkdir -p clips stills
cut() {
  ffmpeg -loglevel error -y -ss "$3" -to "$4" -i "videos/$2.mp4" -an \
    -vf "scale=720:1280,fps=30" -c:v libx264 -preset fast -crf 18 -g 10 \
    -pix_fmt yuv420p "clips/$1.mp4"
}
cut az1 azooz-nashville 1.0 3.0
cut az2 azooz-nashville 12.5 15.5
cut az3 azooz-nashville 24.8 27.6
cut as1 asema-ask-lab 0.6 3.2
cut as2 asema-ask-lab 5.6 7.8
cut as3 asema-ask-lab 25.0 28.0
cut em1 emtiaz-motion-v2 0.4 3.6
cut em2 emtiaz-motion-v2 8.0 11.0
cut em3 emtiaz-motion-v2 18.0 20.8
cut sd1 sidra-hijama 7.6 11.0
cut sd2 sidra-hijama 28.6 33.4
cut ho1 honey-roqaya 0.8 3.6
cut ho2 honey-roqaya 13.0 16.4
cut ho3 honey-roqaya 41.4 44.6
cut kf1 edu-kafafy 1.8 4.6
cut kf2 edu-kafafy 9.6 12.6
cut kf3 edu-kafafy 19.0 21.4
cut kd1 misc-VID_20261117 0.8 3.6
cut kd2 misc-VID_20261117 6.6 9.0
cut kd3 misc-VID_20261117 19.6 22.6
i=0
for t in 6 10.5 14 17 22 25.5 29 34.5 39 43 46.5 50.5 53 55.5 58.5 62 66 71 73.5 76.5; do
  i=$((i+1))
  ffmpeg -loglevel error -y -ss "$t" -i videos/ad2.mp4 -frames:v 1 -vf scale=540:960 -q:v 3 \
    "stills/b$(printf %02d $i).jpg"
done
ls clips stills | wc -l
