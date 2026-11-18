# 02 · Protein in milk by formol titration

182 s · 1920×1080 · 30 fps · stereo, −14 LUFS · Arabic (RTL) · source: [`src/formol/`](../../src/formol/)

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

## Build

```bash
python3 -m sfx sfx/cues/formol.py
npx remotion render FormolVideo out/formol-silent.mp4
ffmpeg -y -i out/formol-silent.mp4 -i public/formol-sfx.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -movflags +faststart -shortest out/formol.mp4
```
