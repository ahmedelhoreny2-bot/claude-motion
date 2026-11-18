# 02 · Protein in milk by formol titration

196 s · 1920×1080 · 30 fps · stereo, −14 LUFS · Arabic (RTL) · MSA voice-over · source: [`src/formol/`](../../src/formol/)

An educational explainer for second-year Food Science students (Faculty of Agriculture, Ain Shams University): why formaldehyde makes amino acids titratable, then the full lab procedure — natural acidity titration, adding formalin, the second titration, the blank, and the protein calculation.

## Prompt

The agent got three pages of handwritten lab notes (Arabic), the university logo and the department logo, then:

> مطلوب مننا تنفيذ مشروع تعليمي عبارة عن فيديو Animation مبسط لشرح تجربة … تقدير نسبة البروتين في اللبن بطريقة الفورمول … بأسلوب يجمع بين 2D و3D Animation والموشن جرافيك بالوان زاهية … حاجه مختلفة عبقرية

## Structure

| Time | Scene | What carries it |
|---|---|---|
| 0–10 s | Intro | milk drop → splash → logos and title |
| 10–26 s | Protein | magnifier into milk, a protein chain unfolds, one bead = amino acid |
| 26–43 s | Amino acid | 3D ball-and-stick molecule; NH₂ (basic, cyan) vs COOH (acidic, red) balance on a seesaw |
| 43–65 s | Reaction (hero) | HCHO flies in, bonds to N, water leaves, amine locks, COOH lights up; equation |
| 65–149 s | Lab | one persistent bench: setup, indicator guide, titration 1 + acidity %, formalin, titration 2, blank, formol number |
| 149–168 s | Calculation | cow 1.8 × 1.67 ≈ 3.0 %; buffalo × 1.66, range 3.3–4.5 % |
| 168–182 s | Outro | five-step recap, credits |

Colour is semantic throughout: cyan = basic, red = acidic, pink = phenolphthalein, lime = formalin, gold = an answer.

## Files

- `formol.timeline.json` — every beat; the cue sheet reads the same file.
- `src/formol/captions.ts` — narration script shown as captions (also [`narration.md`](narration.md) with timings, for recording a voice-over).
- `src/formol/mol3d.tsx` — a tiny 3D molecule renderer (rotate, perspective, depth sort, shaded spheres) in pure SVG.
- `src/formol/glass.tsx` — burette, stand, Erlenmeyer flask with liquid/swirl/drop blooms, pipette, dropper.
- `sfx/cues/formol.py` — 220 sounds + a C-major pad.

## Voice-over

The narration was recorded as one take (ElevenLabs, "Muafaq – Calm Saudi Teacher") from [`narration-fusha.txt`](narration-fusha.txt) and saved as `vo/full.mp3`.

1. `vo/split.py`, `vo/align.py`: find the pauses (`silencedetect`) and pick the 29 cut points that give every sentence the same speaking rate (≈ 10 letters/s), so each of the 30 sentences is cut on a real pause.
2. `vo/retime.py`: warps `formol.timeline.json` piecewise-linearly so every sentence starts with its scene (the original timeline is kept in `vo/timeline.orig.json`), and regenerates `src/formol/captions.ts` from the same placements, so the captions, the voice, the picture and the effects stay in sync.
3. `vo/build_vo.py`: lays each sentence at its new time → `public/formol-vo.wav`.

## Build

```bash
python3 -m sfx sfx/cues/formol.py
npx remotion render FormolVideo out/formol-silent.mp4
python3 vo/build_vo.py
ffmpeg -y -i public/formol-sfx.wav -i public/formol-vo.wav -filter_complex "[1:a]aformat=channel_layouts=stereo,volume=3dB,asplit=2[vo][sc];[0:a]volume=-8dB[bed];[bed][sc]sidechaincompress=threshold=0.02:ratio=5:attack=25:release=400[duck];[duck][vo]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[out]" -map "[out]" public/formol-mix.wav
ffmpeg -y -i out/formol-silent.mp4 -i public/formol-mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -movflags +faststart -shortest out/formol.mp4
```
