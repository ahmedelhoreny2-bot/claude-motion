"""Sound design for AsemaPromo (Al Asema Lab reel). Every time comes from src/asema/timeline.json.

    python3 -m sfx sfx/cues/asema.py
"""

from sfx.synth import blip, chime, click, envelope, impact, pad, pop, riser, scratch, whoosh

TIMELINE = "src/asema/timeline.json"
OUT = "public/asema/sfx.wav"
TARGET_LUFS = -14.0

# G major throughout: Gmaj9 bed, lifts to Cadd9 for the promise, resolves on G6/9 at the logo.
BED_G = [98.0, 146.83, 196.0, 246.94, 293.66, 440.0]
BED_C = [130.81, 196.0, 261.63, 293.66, 392.0, 493.88]
BED_END = [98.0, 196.0, 246.94, 329.63, 440.0, 587.33]
UP = [783.99, 880.0, 987.77, 1174.66, 1318.51, 1567.98]


def score(mix, tl):
    s1, s2, s3, s4, s5, s6, s7, s8, s9, s10 = (tl[k] for k in ("s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"))
    dur = tl["duration"]
    put = mix.put

    hit = s8["enter"]
    volume = envelope([(0, 0.6), (1.0, 1), (s7["enter"], 1), (s7["line"], 1.1), (hit - 0.4, 1.1), (hit, 0.4),
                       (hit + 0.6, 1.2), (dur - 1.0, 1.2), (dur, 0)])
    mix.put_stereo(0, *pad(dur, [(0, BED_G), (s7["enter"], BED_C), (hit, BED_END)], volume=volume), gain=0.03)

    # scene 1: three words slam in
    for i, w in enumerate((s1["w1"], s1["w2"], s1["w3"])):
        put(max(0, w - 0.05), whoosh(0.3, 400, 2600, peak=0.5), 0.12, -0.3 + i * 0.3)
        put(w + 0.08, blip(196.0 * (1, 1.25, 1.5)[i], dur=0.35, tau=0.1), 0.24)
    put(s1["w2"] + 0.25, scratch(0.6), 0.07)

    # transitions: an iris whoosh into every scene
    for s in (s2, s3, s4, s5, s9, s6, s10, s7):
        put(s["enter"] - 0.05, whoosh(0.6, 300, 3200, peak=0.55), 0.17)

    # scene 2: ring draws, liver drops, charge fills to 15%, badge, chips
    put(s2["ring"], scratch(0.9), 0.08, 0.1)
    put(s2["liver"] + 0.25, click(900), 0.2)
    put(s2["liver"] + 0.26, blip(98.0, dur=0.5, tau=0.15), 0.25)
    for i, w in enumerate((s2["t1"], s2["t2"])):
        put(w, whoosh(0.3, 600, 2600, peak=0.45), 0.08, 0.3)
    put(s2["fill"], riser(0.75, 400, 1800), 0.06)
    put(s2["badge"], pop(1300, 600), 0.3, 0.5)
    for i in range(6):
        put(s2["chips"] + i * 0.08, pop(900 + i * 120, 500 + i * 60), 0.12, -0.5 + i * 0.2)

    # scene 3: kidneys rise, counter ticks to 180
    put(s3["subject"], whoosh(0.7, 2400, 500, peak=0.4), 0.1)
    n = 18
    for i in range(n):
        k = i / (n - 1)
        t = s3["count"] + (1 - (1 - k) ** 2) * (s3["countEnd"] - s3["count"])  # follows easeOut-ish counter
        put(t, click(1500 + 900 * k), 0.07 + 0.05 * k)
    put(s3["t2"], chime([783.99, 987.77, 1174.66], dur=1.4, tau=0.5), 0.12)

    # scene 4: dial spins in, cold / hot / tired words, headline, TSH tag
    put(s4["dial"], whoosh(0.5, 3000, 600, peak=0.3), 0.14)
    put(s4["dial"] + 0.35, click(1100), 0.22)
    for i, (w, pan) in enumerate(zip(s4["words"], (-0.6, 0.6, 0))):
        put(w, pop(700 + i * 160, 320 + i * 60), 0.26, pan)
    put(s4["tag"], blip(UP[2], dur=0.4, tau=0.12), 0.18)

    # scene 5: capsule slides in under the sun
    put(s5["capsule"], whoosh(0.95, 2600, 400, peak=0.35), 0.16, 0.6)
    put(s5["capsule"] + 0.9, chime([587.33, 783.99, 987.77], dur=1.6, tau=0.55), 0.1)
    for i in range(3):
        put(s5["chips"] + i * 0.15, pop(900 + i * 150, 480 + i * 70), 0.15, -0.4 + i * 0.4)

    # scene 9: joints, the squeak, six tests
    put(s9["subject"], whoosh(0.6, 2600, 600, peak=0.35), 0.12, 0.5)
    put(s9["squeak"], riser(0.5, 1800, 2600), 0.06, -0.5)
    put(s9["squeak"], pop(1400, 900, dur=0.3), 0.2, -0.5)
    for i in range(6):
        put(s9["tests"] + i * 0.15, pop(800 + i * 110, 420 + i * 60), 0.13, -0.5 + i * 0.2)

    # scene 6: the drop opens out, labels pop
    put(s6["drop"], whoosh(0.8, 300, 1800, peak=0.6), 0.14)
    for i in range(4):
        put(s6["labels"][0] + i * 0.12, pop(1000 + i * 150, 520 + i * 70), 0.16, -0.45 + i * 0.3)

    # scene 10: kidney beans pun, sticker slaps on
    put(s10["subject"], whoosh(0.6, 400, 2200, peak=0.5), 0.12)
    put(s10["t2"] + 0.1, blip(UP[3], dur=0.4, tau=0.12), 0.18)
    put(s10["sticker"], click(600), 0.22, -0.6)
    put(s10["sticker"] + 0.02, pop(700, 260, dur=0.22), 0.24, -0.6)

    # scene 7: the three promises slam, build to the logo
    for i, w in enumerate(s7["w"]):
        put(w - 0.04, whoosh(0.22, 500, 3400, peak=0.6), 0.14)
        put(w + 0.04, blip(UP[i * 2], dur=0.45, tau=0.12), 0.26)
        put(w + 0.04, click(700), 0.16)
    put(s7["line"] + 0.25, whoosh(0.6, 800, 2600, peak=0.4), 0.1, -0.4)
    put(hit - 1.0, riser(1.0, 260, 4800), 0.13)

    # scene 8 (hero): logo builds itself, name, CTA, contact
    put(hit, impact(1.4), 0.32)
    put(s8["stripe"], whoosh(0.55, 900, 3600, peak=0.4), 0.12, -0.4)
    put(s8["arm"], scratch(0.7), 0.08)
    put(s8["tube"] + 0.28, click(800), 0.25)
    put(s8["tube"] + 0.29, blip(196.0, dur=0.6, tau=0.18), 0.22)
    for i, b in enumerate(s8["bubbles"]):
        put(b, pop(1200 + i * 140, 700 + i * 90), 0.13, -0.6 + i * 0.12)
    put(s8["name"] + 0.3, chime([783.99, 987.77, 1174.66, 1567.98], dur=2.2, tau=0.8), 0.18)
    put(s8["cta"], pop(1000, 420), 0.28)
    put(s8["contact"], whoosh(0.5, 600, 2000, peak=0.4), 0.07)
