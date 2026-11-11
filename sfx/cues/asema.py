"""Sound design for AsemaPromo (Al Asema Lab reel). No music and no low thumps: a lab at work
(analyzer whir, monitor beeps on the beat grid, pipettes, a sample tray) under the voice,
and a natural texture per scene. Every time comes from src/asema/timeline.json.

    python3 -m sfx sfx/cues/asema.py      (then brand/al-asema-lab/video/mix_vo.py adds the voice)
"""

from sfx.synth import (beep, blip, bubbles, centrifuge, chime, click, crackle, creak, drip, hum, pipette, pop, riser,
                       roomtone, servo, water, whoosh, wind)

TIMELINE = "src/asema/timeline.json"
OUT = "public/asema/sfx.wav"
TARGET_LUFS = -14.0


def score(mix, tl):
    s1, s2, s3, s4, s5, s6, s7, s8, s9, s10 = (tl[k] for k in ("s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"))
    dur = tl["duration"]
    beat = 60 / tl["bpm"]
    put = mix.put

    # the bed: quiet lab air under everything, so nothing is ever silent
    put(0, roomtone(dur), 0.07)

    # the lab: an analyzer whirring under the whole piece, a monitor beep on every second beat,
    # and now and then a pipette or the sample tray moving. Kept low so the voice leads.
    put(0, centrifuge(dur), 0.05)
    n_beats = int(s8["enter"] / beat)
    for i in range(0, n_beats, 2):
        put(i * beat, beep(1046.5 if i % 8 else 1318.5, 0.1), 0.05, 0.3)
    for i, t in enumerate((s2["enter"] + 1.2, s4["enter"] + 1.6, s9["enter"] + 0.5, s6["enter"] + 1.4, s10["enter"] + 0.8)):
        put(t, pipette(), 0.08, (-0.5, 0.5)[i % 2])
    for t in (s3["enter"] + 2.2, s5["enter"] + 1.8, s10["enter"] + 1.8):
        put(t, servo(0.4, 800, 1400), 0.035, 0.6)
    put(s8["contact"], beep(1318.5, 0.14), 0.07)
    put(s8["contact"] + 0.18, beep(1568.0, 0.2), 0.07)

    # transitions: a short air whoosh into every scene, on the beat
    for s in (s2, s3, s4, s5, s9, s6, s10, s7):
        put(s["enter"] - 0.12, whoosh(0.4, 350, 3800, peak=0.7), 0.14)

    # 1. hook: three words hit
    for i, w in enumerate((s1["w1"], s1["w2"], s1["w3"])):
        put(w, beep((784.0, 1046.5, 1318.5)[i], 0.14), 0.12, (-0.2, 0.2, 0)[i])
        put(w, click(2600), 0.08)

    # 2. liver: charging hum climbs while the ring fills, cuts out at 15%
    put(s2["liver"] + 0.22, click(1200), 0.14)
    put(s2["fill"] - 0.1, hum(s2["badge"] - s2["fill"] + 0.1, f0=55, rise=1.5), 0.12)
    put(s2["badge"], pop(900, 300), 0.24, 0.5)
    put(s2["badge"] + 0.02, click(500), 0.18)
    for i in range(6):
        put(s2["chips"] + i * 0.08, click(2200 + i * 200), 0.08, -0.5 + i * 0.2)

    # 3. kidneys: water pours through the whole scene, counter ticks over it
    put(s3["subject"], water(s3["exit"] - s3["subject"] + 0.3), 0.22)
    n = 16
    for i in range(n):
        k = i / (n - 1)
        put(s3["count"] + (1 - (1 - k) ** 2) * (s3["countEnd"] - s3["count"]), click(1600 + 900 * k), 0.06 + 0.04 * k)
    put(s3["t2"], drip(), 0.25)

    # 4. thyroid: dial ratchets in; cold wind left, fire crackle right, a low pulse for "tired"
    put(s4["dial"], whoosh(0.45, 3000, 600, peak=0.3), 0.12)
    for i in range(6):
        put(s4["dial"] + 0.05 + i * 0.045, click(1300 - i * 80), 0.12)
    put(s4["words"][0] - 0.1, wind(1.8), 0.22, -0.7)
    put(s4["words"][1] - 0.1, crackle(1.8), 0.22, 0.7)
    put(s4["words"][2], pop(700, 300), 0.12)
    put(s4["tag"], pop(1100, 500), 0.2)

    # 5. vitamin D: a warm swell as the capsule arrives, a soft sizzle of sun under the scene
    put(s5["capsule"], whoosh(0.9, 2600, 300, peak=0.3), 0.15, 0.6)
    put(s5["capsule"] + 0.4, crackle(s5["exit"] - s5["capsule"] - 0.4, rate=18, seed=11), 0.12)
    for i in range(3):
        put(s5["chips"] + i * 0.15, pop(900 + i * 150, 480 + i * 70), 0.14, -0.4 + i * 0.4)

    # 6. joints: the hinge really creaks, then a drop of oil
    put(s9["subject"] + 0.1, whoosh(0.5, 2600, 600, peak=0.3), 0.1, 0.5)
    put(s9["squeak"], creak(0.75), 0.3, -0.4)
    put(s9["t2"] + 0.3, drip(), 0.26, 0.3)
    for i in range(6):
        put(s9["tests"] + i * 0.15, click(1800 + i * 150), 0.1, -0.5 + i * 0.2)

    # 7. blood: the drop opens out; bubbling inside it
    put(s6["drop"], whoosh(0.7, 250, 1600, peak=0.6), 0.14)
    put(s6["drop"] + 0.2, bubbles(s6["exit"] - s6["drop"]), 0.1)
    for i in range(4):
        put(s6["labels"][0] + i * 0.12, pop(1000 + i * 150, 520 + i * 70), 0.12, -0.45 + i * 0.3)

    # 8. beans: magnifier zoom, the sticker slaps on
    put(s10["subject"], whoosh(0.6, 400, 2200, peak=0.5), 0.12)
    put(s10["sticker"], pop(800, 280, dur=0.2), 0.18, -0.6)

    # 9. promise: one heavy hit per word, on the beat; build into the logo
    for i, w in enumerate(s7["w"]):
        put(w - 0.04, whoosh(0.18, 600, 4200, peak=0.8), 0.12)
        put(w, beep((1046.5, 1318.5, 1568.0)[i], 0.18), 0.16)
        put(w, click(3000), 0.12)
    put(s8["enter"] - 1.2, riser(1.2, 200, 4000), 0.1)

    # 10. logo (hero): impact, the tube drops with a click, bubbles pop
    put(s8["enter"], chime([1046.5, 1318.5, 1568.0, 2093.0], dur=2.0, tau=0.7), 0.12)
    put(s8["stripe"], whoosh(0.5, 900, 3600, peak=0.4), 0.1, -0.4)
    put(s8["tube"] + 0.28, click(1400), 0.16)
    put(s8["tube"] + 0.29, servo(0.25, 1400, 900), 0.06)
    for i, b in enumerate(s8["bubbles"]):
        put(b, pop(1200 + i * 140, 700 + i * 90), 0.1, -0.6 + i * 0.12)
    put(s8["cta"], pop(1000, 420), 0.22)
    put(s8["cta"], blip(784, dur=0.5), 0.1)
