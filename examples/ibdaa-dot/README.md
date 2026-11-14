# إبداع بيتحرك: «نقطة» (36 ثانية، 9:16)

**البرومبت:** فيديو بيسوّق لخدمة الموشن جرافيك نفسها، كله موشن جرافيك احترافي بهوية الصفحة، بحركة ملفتة وجديدة ومختلفة تماماً عن الإعلان اللي قبله، وفي آخره مقطع بالخدمات اللي بنقدّمها.

**الفكرة:** لقطة واحدة متصلة من غير ولا قطع. نقطة برتقالي بتتحول لخط، والخط بيرسم كل حاجة: قهوة، نبض، تاج سعر، موبايل، «فكرتك»، دوّامة. بعدها بترجع نقطة، وتطلع منها خطوط اللوجو التلاتة، وتبدأ الخدمات: الخط بيرسم برواز لكل خدمة، والبرواز بيتملي بمحتواه. في الآخر البراويز بتتحول لحيطة معرض في 3D، وتتلم في نقطة، ويطلع اللوجو. والختام: «ابعتلنا فكرتك… حتى لو لسه نقطة»، والنقطة اللي في آخر الجملة هي نفس النقطة اللي بدأ بيها الفيديو.

- الكومبوزيشن: `IbdaaDot`، وملفاتها في `src/dot/`. الأشكال في `geom.ts`: كل شكل خط واحد مقسوم لـ 260 نقطة، والتحول بين الأشكال بيحصل نقطة بنقطة.
- التايم لاين: `src/dot/timeline.json`، وفيه البيتس والكابشنز والفويس.
- الفويس: تسجيلين من ElevenLabs (A الأساسي وB الخدمات). `scripts/dot-vo.py` بيقطّعهم ويحط كل جملة على مشهدها.
- الصوت: مؤثرات صوتية بس، من `sfx/cues/dot.py`.
- الصور: من `public/photos` (اتولّدت بالذكاء الاصطناعي)، ومكتوب في الآخر إنها للعرض.

```bash
python3 scripts/dot-vo.py && python3 -m sfx sfx/cues/dot.py
scripts/render-chunks.sh IbdaaDot src/dot/timeline.json out/dot-silent.mp4
ffmpeg -y -i out/dot-silent.mp4 -i public/dot/sfx.wav -i public/dot/vo.wav \
  -filter_complex "[2:a]aresample=48000,loudnorm=I=-16:TP=-1.5,pan=stereo|c0=c0|c1=c0,asplit=2[vo][sc];[1:a][sc]sidechaincompress=threshold=0.03:ratio=3:attack=10:release=250:makeup=1[duck];[duck][vo]amix=inputs=2:normalize=0:weights='0.9 1.2',loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest out/ibdaa-dot.mp4
```
