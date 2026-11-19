"""Sound design for the 3D formol cut. Every time comes from sims/formol3d/timeline.json
(sentence starts and word anchors from the recorded voice).

    python3 -m sfx sfx/cues/formol3d.py
"""

from sfx.synth import blip, chime, click, envelope, impact, pad, pop, riser, scratch, whoosh

TIMELINE = "sims/formol3d/timeline.json"
OUT = "public/formol3d-sfx.wav"
TARGET_LUFS = -14.0

# C major / A minor, warm and hopeful
C = [130.81, 196.0, 246.94, 293.66, 329.63]
AM = [110.0, 164.81, 196.0, 246.94, 261.63]
FM = [87.31, 174.61, 220.0, 261.63, 329.63]
G = [98.0, 196.0, 246.94, 293.66, 329.63]
NOTE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.7, 1318.5, 1568.0]
CH_C = [523.25, 783.99, 1046.5, 1318.5]
CH_HI = [1046.5, 1318.5, 1568.0, 2093.0]


def drops(ti):
    n = max(3, round((ti[1] - ti[0]) / ti[2]))
    return [ti[0] + (ti[1] - ti[0]) * i / (n - 1) for i in range(n)]


def score(mix, tl):
    S, W, CH = tl["sentences"], tl["words"], tl["ch"]
    sa = lambda n: S[n - 1]["at"]
    dur = tl["duration"]
    put = mix.put

    chords = [(0, C), (CH["protein"]["start"], AM), (CH["amino"]["start"], FM), (CH["react"]["start"], G), (W["cancel"], C),
              (CH["setup"]["start"], AM), (CH["t1"]["start"], FM), (CH["form"]["start"], G), (CH["t2"]["start"], C),
              (CH["blank"]["start"], AM), (CH["calc"]["start"], FM), (W["cowRes"], C), (CH["outro"]["start"], FM), (W["credits"] - 1.4, C)]
    vol = envelope([(0, 0), (1.2, 1), (W["bond"], 1), (W["cancel"] - 0.05, 0.3), (W["cancel"] + 1.0, 1.1), (dur - 2.5, 1.1), (dur, 0)])
    mix.put_stereo(0, *pad(dur, chords, volume=vol), gain=0.05)

    # intro: logos, title
    put(0.5, whoosh(0.9, 300, 1800, peak=0.4), 0.10)
    put(0.6, chime(CH_C, dur=2.4, tau=0.9), 0.10)
    put(1.3, whoosh(0.6, 500, 2600, peak=0.5), 0.14)
    put(2.0, chime(CH_HI, dur=2.0, tau=0.7), 0.10)
    # dive into the milk, the chain, into the bead
    ps = CH["protein"]["start"]
    put(ps + 0.4, whoosh(1.8, 2200, 300, peak=0.85, q=0.7), 0.24)
    put(ps + 2.2, whoosh(1.2, 200, 900, peak=0.2, q=1.4), 0.16)
    for i in range(13):
        put(ps + 3.0 + i * 0.08, pop(900 + i * 60, 500), 0.07, -0.7 + i * 0.11)
    put(sa(3) + 0.3, pop(1318.5, 659.25), 0.24)
    put(sa(3) + 0.35, chime([659.25, 987.77, 1318.5], dur=1.4, tau=0.5), 0.10)
    for i in range(13):
        put(sa(4) + 0.4 + i * 2.2 / 13, blip(NOTE[i % 9], dur=0.25, tau=0.07), 0.07, -0.6 + i * 0.1)
    put(CH["amino"]["start"] - 1.3, riser(1.3, 400, 3000), 0.12)
    put(CH["amino"]["start"], whoosh(1.4, 3000, 400, peak=0.15), 0.2)
    # molecular world
    put(sa(5) + 0.25, pop(800, 400), 0.22, 0.5)
    put(sa(5) + 0.3, blip(392.0, dur=0.6), 0.12, 0.5)
    put(sa(6) + 0.15, pop(1000, 500), 0.22, -0.5)
    put(sa(6) + 0.2, blip(523.25, dur=0.6), 0.12, -0.5)
    put(sa(7) + 0.7, chime([392.0, 523.25, 659.25], dur=1.6, tau=0.6), 0.10)
    # reaction: the one riser and the one impact
    put(sa(8) + 0.2, whoosh(1.6, 3200, 500, peak=0.3), 0.2, 0.7)
    put(sa(8) + 0.6, pop(1500, 900), 0.14, 0.6)
    put(W["bond"] - 0.2, riser(W["cancel"] - W["bond"] + 0.2), 0.24, 0.3)
    put(W["cancel"], impact(1.5), 0.34)
    put(W["cancel"], chime(CH_C, dur=2.6, tau=1.0), 0.14)
    put(W["cancel"] + 0.25, click(2200), 0.2, 0.3)
    put(W["water"], pop(1700, 2600, dur=0.12), 0.18, 0.6)
    put(W["water"] + 0.1, whoosh(1.8, 800, 4200, peak=0.3), 0.12, 0.7)
    put(W["free"] - 0.1, pop(1200, 500), 0.24, -0.5)
    put(W["free"], whoosh(0.8, 400, 2200, peak=0.5), 0.12, -0.5)
    put(W["acidShow"] + 0.9, whoosh(0.6, 500, 2200, peak=0.4), 0.1)
    for i in range(13):
        put(W["acidShow"] + 0.9 + i * 0.07, click(2600 + i * 60, dur=0.03), 0.04, -0.6 + i * 0.1)
    put(sa(11), whoosh(3.0, 1800, 300, peak=0.4, q=0.6), 0.14)
    for i, a in enumerate([sa(11) + 0.3, W["amino11"], W["protein11"]]):
        put(a, pop(NOTE[2 + i * 2], NOTE[2 + i * 2] / 2), 0.24, 0.4 - i * 0.4)
        put(a + 0.01, blip(NOTE[2 + i * 2] / 2, dur=0.45), 0.10, 0.4 - i * 0.4)
    put(W["protein11"] + 0.1, chime(CH_HI, dur=2.0, tau=0.7), 0.12)
    put(CH["react"]["end"] - 1.0, riser(1.0, 600, 6000), 0.12)
    put(CH["react"]["end"], whoosh(1.0, 4000, 600, peak=0.1), 0.18)
    # setup
    put(W["pour"] - 0.9, whoosh(0.8, 2000, 500, peak=0.7), 0.10, 0.5)
    put(W["pour"] + 0.2, whoosh(2.2, 250, 700, peak=0.5, q=1.8), 0.16, 0.5)
    for k, d in enumerate([0, 0.45, 0.9]):
        put(W["drops"] + d + 0.3, pop(1900, 700, dur=0.1), 0.2, 0.5)
        put(W["drops"] + d + 0.31, blip(1318.5 + k * 200, dur=0.25, tau=0.06), 0.06, 0.5)
    put(W["fillBur"] - 0.8, whoosh(1.0, 600, 1600, peak=0.5), 0.10)
    put(W["fillBur"], whoosh(3.0, 300, 1100, peak=0.6, q=1.6), 0.12)
    for a, f in [(W["colorless"], 659.25), (W["faint"], 783.99), (W["deep"], 987.77)]:
        put(a, pop(f * 1.5, f), 0.22)
        put(a + 0.02, blip(f, dur=0.5), 0.10)
    # titrations: stopcock, every drop, endpoint chime
    T1 = (W["dropwise"], W["stop"] - 0.25, 0.42)
    T2 = (W["t2drops"], W["t2back"] + 0.75, 0.36)
    TB = (sa(24) + 0.3, sa(24) + 2.1, 0.45)
    for ti, note in [(T1, 659.25), (T2, 783.99), (TB, 880.0)]:
        put(ti[0] - 0.45, click(1200), 0.2, -0.3)
        put(ti[0] - 0.4, click(900, dur=0.04), 0.12, -0.3)
        for j, d in enumerate(drops(ti)):
            put(d + 0.3, pop(2100 - (j % 3) * 120, 800, dur=0.08), 0.13, -0.15 + (j % 2) * 0.1)
            put(d + 0.31, blip(1568.0 - (j % 4) * 90, dur=0.18, tau=0.04), 0.035)
        put(ti[1] + 0.15, click(1000), 0.16, -0.3)
        put(ti[1] + 0.3, chime([note, note * 1.5, note * 2], dur=1.6, tau=0.6), 0.14)
    # macro cut-in
    ma, mb, mi = W["dropwise"] + 0.25, W["appear"] + 0.55, W["dropwise"] + 0.9
    put(ma - 0.05, whoosh(0.3, 3000, 800, peak=0.8), 0.14)
    put(mi, pop(700, 140, dur=0.35), 0.3)
    put(mi + 0.02, whoosh(0.9, 300, 2500, peak=0.1, q=0.6), 0.12)
    put(mb - 0.05, whoosh(0.3, 800, 3000, peak=0.2), 0.12)
    # titration 1 calc
    put(W["acidCalc"] - 0.1, whoosh(0.6, 600, 2400, peak=0.4), 0.14, 0.5)
    put(W["acidCalc"] + 1.6, scratch(0.8), 0.05, 0.5)
    put(W["acidNum"], pop(1318.5, 659.25), 0.24, 0.5)
    put(W["acidNum"] + 0.05, chime(CH_C, dur=1.8, tau=0.6), 0.12, 0.5)
    # badges at each step
    for k, c in enumerate(["t1", "form", "t2", "blank"]):
        put(CH[c]["start"] + 0.4, whoosh(0.5, 700, 2600, peak=0.4), 0.12, 0.6)
        put(CH[c]["start"] + 0.45, blip(NOTE[2 + k], dur=0.4), 0.11, 0.6)
    # formalin and the vanishing pink
    put(W["formPour"] - 0.6, whoosh(0.8, 2000, 500, peak=0.7), 0.10, 0.5)
    put(W["formPour"] + 0.1, whoosh(1.8, 250, 700, peak=0.5, q=1.8), 0.15, 0.5)
    put(W["vanish"] - 0.3, whoosh(1.3, 3400, 300, peak=0.2, q=0.6), 0.18)
    put(W["vanish"] + 0.3, blip(493.88, dur=0.7), 0.14)
    for k in range(3):
        put(W["whyFree"] + k * 0.9, pop(NOTE[3 + k], NOTE[3 + k] / 2), 0.18, 0.6)
    put(W["noInd"], pop(1318.5, 659.25), 0.2, 0.6)
    put(W["noInd"] + 0.05, chime([783.99, 1046.5, 1318.5], dur=1.2, tau=0.4), 0.08, 0.6)
    # titration 2 reading, blank, formol number
    put(sa(21) + 0.15, whoosh(0.9, 500, 2200, peak=0.6, q=1.2), 0.10, -0.3)
    put(sa(22) + 1.3, pop(1046.5, 523.25), 0.22, 0.5)
    put(sa(23) + 0.4, whoosh(1.2, 500, 1600, peak=0.5), 0.12, -0.4)
    put(sa(23) + 1.2, whoosh(1.3, 500, 1600, peak=0.5), 0.12, 0.4)
    put(sa(24) - 1.3, whoosh(0.9, 500, 2200, peak=0.6, q=1.2), 0.10, -0.3)
    put(W["fn"] - 0.1, whoosh(0.6, 600, 2400, peak=0.4), 0.14, 0.5)
    put(W["fnTwo"], blip(659.25, dur=0.4), 0.14, 0.5)
    put(W["fnMinus"], blip(587.33, dur=0.4), 0.14, 0.5)
    put(W["fnRes"], pop(1568.0, 783.99), 0.28, 0.5)
    put(W["fnRes"] + 0.05, chime(CH_HI, dur=2.2, tau=0.8), 0.14, 0.5)
    # calculation
    put(CH["calc"]["start"] + 0.4, whoosh(0.7, 500, 2200, peak=0.5), 0.14, 0.5)
    put(W["cowMul"], blip(659.25, dur=0.4), 0.14, 0.5)
    for i in range(16):
        put(W["cowRes"] - 0.6 + 1.0 * (1 - (1 - i / 16) ** 2), click(2400 + i * 40, dur=0.03), 0.07, 0.5)
    put(W["cowRes"] + 0.4, pop(1568.0, 783.99), 0.28, 0.5)
    put(W["cowRes"] + 0.45, chime(CH_C + [2093.0], dur=2.6, tau=0.9), 0.15, 0.4)
    put(sa(27) - 0.1, whoosh(0.7, 500, 2200, peak=0.5), 0.14, -0.5)
    put(W["buffMul"], blip(587.33, dur=0.4), 0.12, -0.5)
    put(W["range"], pop(1174.7, 587.33), 0.22, -0.5)
    put(W["range"] + 0.2, whoosh(1.4, 400, 1600, peak=0.6), 0.08)
    # summary + credits
    for i in range(5):
        put(sa(29) + 0.25 + i * 0.32, pop(NOTE[i * 2], NOTE[i * 2] / 2), 0.2, 0.7 - i * 0.35)
    c0 = W["credits"]
    put(c0 - 1.6, whoosh(0.7, 2400, 500, peak=0.4), 0.12)
    put(c0 - 1.4, pop(700, 300), 0.2, 0.2)
    put(c0 - 1.2, pop(800, 340), 0.2, -0.2)
    put(c0 - 1.3, chime(CH_C + [1568.0], dur=3.0, tau=1.1), 0.12)
    for i, d in enumerate([0, 0.4, 1.2, 2.2]):
        put(c0 + d, blip(NOTE[3 + i], dur=0.3, tau=0.08), 0.09, -0.3 + i * 0.2)
    put(c0 + 2.8, pop(1318.5, 659.25), 0.22)
    put(c0 + 2.85, chime(CH_HI, dur=3.2, tau=1.2), 0.13)
    for i in range(5):
        put(c0 + 3.3 + i * 0.3, pop(NOTE[i + 2], NOTE[i + 2] / 2), 0.15, -0.5 + i * 0.25)
