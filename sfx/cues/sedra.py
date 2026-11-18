"""Sound design for SedraAd. Every time comes from src/sedra/timeline.json.

    python3 -m sfx sfx/cues/sedra.py

D minor while the risk is on screen, D major from the moment the cup is cleaned.
"""

from sfx.synth import blip, chime, click, envelope, impact, pad, pop, riser, whoosh

TIMELINE = "src/sedra/timeline.json"
OUT = "public/sedra.wav"  # music + sfx only; the voice is mixed in by scripts/sedra-mix.sh
TARGET_LUFS = -14.0

Dm = [146.83, 220.0, 293.66, 349.23, 440.0]
Bb = [116.54, 174.61, 233.08, 293.66, 349.23]
Gm = [98.0, 146.83, 196.0, 233.08, 293.66]
A = [110.0, 164.81, 220.0, 277.18, 329.63]
D = [146.83, 220.0, 293.66, 369.99, 440.0, 659.25]
G = [98.0, 196.0, 246.94, 293.66, 392.0]
Bm = [123.47, 185.0, 246.94, 293.66, 369.99]
Asus = [110.0, 164.81, 220.0, 293.66, 329.63]
D_MAJ_NOTES = [587.33, 659.25, 739.99, 880.0, 987.77, 1174.66]


def words_at(start, n, stagger=0.09):
    return [start + i * stagger for i in range(n)]


def score(mix, tl):
    s1, s2, s3, s4, s5 = tl["s1"], tl["s2"], tl["s3"], tl["s4"], tl["s5"]
    s6, s7, s8, s9, s10 = tl["s6"], tl["s7"], tl["s8"], tl["s9"], tl["s10"]
    dur = tl["duration"]
    put = mix.put

    p = s7["pillars"]
    chords = [
        (0, Dm), (s2["enter"], Bb), (s2["big"][0], Gm), (s3["l1"], A),
        (s3["clean"], D), (s5["chip"], G), (s6["rise"], Asus), (s6["hit"], D),
        (p[1], G), (p[2], Bm), (p[3], A), (s8["enter"], D), (s8["honey"], G),
        (s9["enter"], Bm), (s9["tail"], A), (s10["label"], G), (s10["cta"], D),
    ]
    volume = envelope([
        (0, 0.6), (1.0, 1), (s6["rise"], 1), (s6["hit"] - 0.1, 0.4),
        (s6["hit"] + 0.6, 1.2), (dur - 1.5, 1.2), (dur, 0),
    ])
    mix.put_stereo(0, *pad(dur, chords, volume=volume), gain=0.04)

    # a low pulse under the hook and the warning: tension, like a heartbeat
    t = 0.0
    while t < s3["clean"]:
        put(t, blip(73.42, dur=0.35, tau=0.09), 0.30)
        put(t + 0.22, blip(73.42, dur=0.3, tau=0.07), 0.18)
        t += 1.0
    # steady pulse once the center is on screen, until the CTA settles
    t = s6["hit"] + 1.0
    while t < s10["cta"]:
        put(t, blip(73.42, dur=0.25, tau=0.06), 0.16)
        put(t + 0.5, click(3200, dur=0.02), 0.035, 0.3)
        t += 1.0

    # hook
    for i, w in enumerate([s1["l2"], s1["l3"]]):
        put(w, whoosh(0.3, 500, 2400, peak=0.45), 0.12, -0.2 + i * 0.4)
    put(s1["l3"] + 0.15, impact(0.8), 0.14)
    put(s1["sub"], blip(587.33, dur=0.4), 0.06)
    put(s1["exit"], whoosh(0.45, 3000, 600, peak=0.4), 0.14)

    # warning
    put(s2["chip"], pop(700, 380), 0.22)
    for i, w in enumerate(s2["lines"]):
        put(w, whoosh(0.25, 600, 2200, peak=0.5), 0.07, -0.3 + i * 0.3)
    put(s2["dirty"], whoosh(1.4, 200, 900, peak=0.7, q=0.5), 0.10)
    put(s2["big"][0], impact(0.6), 0.12)
    put(s2["big"][1], impact(1.0), 0.18)
    put(s2["source"], click(1800), 0.08)
    put(s2["exit"], whoosh(0.45, 3000, 600, peak=0.4), 0.14)

    # pivot: the cup gets cleaned
    put(s3["l2"], whoosh(0.3, 500, 2000), 0.08)
    put(s3["clean"], whoosh(0.7, 1200, 7000, peak=0.6, q=0.6), 0.16)
    put(s3["clean"] + 0.35, chime([1174.66, 1479.98, 1760.0], dur=1.6, tau=0.5), 0.12)
    put(s3["l4"], blip(880.0, dur=0.4), 0.10)
    put(s3["exit"], whoosh(0.45, 3000, 600, peak=0.4), 0.12)

    # sunnah + science
    put(s4["chip"], pop(900, 500), 0.16)
    put(s4["h2"], chime([587.33, 739.99, 880.0], dur=2.2, tau=0.9), 0.12)
    put(s4["exit"], whoosh(0.45, 3000, 600, peak=0.4), 0.12)
    put(s5["chip"], pop(1000, 560), 0.16)
    put(s5["card"], whoosh(0.5, 400, 2600, peak=0.6), 0.16, 0.2)
    put(s5["card"] + 0.45, click(1400), 0.14)
    put(s5["l1"] + 0.3, blip(987.77, dur=0.4), 0.10)

    # hero: cup becomes the logo; the only riser and the big impact
    put(s6["rise"], riser(s6["hit"] - s6["rise"]), 0.24)
    put(s6["hit"], impact(1.4), 0.32)
    put(s6["hit"], chime([293.66, 440.0, 587.33, 739.99, 880.0], dur=2.6, tau=1.0), 0.16)
    put(s6["name"], whoosh(0.3, 500, 2400), 0.10)
    put(s6["exit"], whoosh(0.5, 3000, 500, peak=0.4), 0.14)

    # four pillars
    for i, a in enumerate(p):
        put(a, whoosh(0.5, 400, 3000, peak=0.5), 0.14, [-0.3, 0.3, -0.3, 0.3][i])
        put(a + 0.35, pop(D_MAJ_NOTES[i] * 1.2, D_MAJ_NOTES[i] * 0.6), 0.20)
        put(a + 0.37, blip(D_MAJ_NOTES[i], dur=0.45), 0.08)
    put(s7["certs"], pop(1300, 700), 0.22, 0.3)
    put(s7["certs"] + 0.25, pop(1500, 800), 0.22, -0.3)
    put(s7["certs"] + 0.4, chime([880.0, 1108.73, 1318.51], dur=1.6, tau=0.6), 0.10)

    # services
    put(s8["enter"], whoosh(0.5, 400, 3000, peak=0.5), 0.14)
    for i, c in enumerate(s8["chips"]):
        put(c, pop(900 + i * 110, 450 + i * 50), 0.18, -0.5 + i * 0.2)
    put(s8["honey"], whoosh(0.8, 300, 2400, peak=0.5), 0.12)

    # safety list
    put(s9["title"], whoosh(0.35, 600, 2400), 0.10)
    for i, c in enumerate(s9["items"]):
        put(c, click(2000 - i * 150), 0.16, 0.2)
        put(c + 0.01, blip([493.88, 440.0, 369.99, 329.63][i], dur=0.35), 0.08, 0.2)
    put(s9["tail"], blip(587.33, dur=0.5), 0.10)

    # CTA
    for i, d in enumerate(s10["days"]):
        put(d, pop(D_MAJ_NOTES[i * 2] * 1.3, D_MAJ_NOTES[i * 2] * 0.65), 0.26, (i - 1) * -0.4)
    put(s10["cta"] - 0.4, whoosh(0.45, 400, 3200, peak=0.8), 0.18)
    put(s10["cta"], impact(0.9), 0.18)
    put(s10["phone"], pop(1174.66, 587.33), 0.26)
    put(s10["phone"] + 0.1, chime([587.33, 739.99, 880.0, 1174.66], dur=2.4, tau=0.9), 0.14)
    put(s10["wa"], pop(1400, 700), 0.16)
