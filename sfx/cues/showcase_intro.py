"""Brand intro accents for the before/after showcase (1.8 s). Writes public/talk/show_sfx.wav.

    python3 -I sfx/cues/showcase_intro.py   (run from the repo root)
"""
import sys

sys.path.insert(0, ".")
from sfx.mix import Mix  # noqa: E402
from sfx.synth import blip, chime, pop, whoosh  # noqa: E402

m = Mix(2.4)
m.put(0.05, whoosh(0.6, 300, 2200, peak=0.5), 0.2, 0.3)
m.put(0.15, pop(700, 300), 0.35)
for i in range(3):
    m.put(0.4 + i * 0.12, blip([1046.5, 1318.5, 1568.0][i], dur=0.3, tau=0.08), 0.18, -0.3 + i * 0.3)
m.put(0.65, chime([1318.5, 1975.5], dur=1.2, tau=0.4), 0.12)
m.put(1.3, whoosh(0.7, 2400, 500, peak=0.5), 0.18)
m.put(1.55, pop(900, 380), 0.25, -0.2)
m.master(target_lufs=-20.0)
m.write("public/talk/show_sfx.wav")
print("ok")
