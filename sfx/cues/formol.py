"""Sound design for FormolVideo (formol titration explainer). Every time comes from formol.timeline.json.

    python3 -m sfx sfx/cues/formol.py
"""

from sfx.synth import blip, chime, click, envelope, impact, pad, pop, riser, scratch, whoosh

TIMELINE = "formol.timeline.json"
OUT = "public/formol-sfx.wav"
TARGET_LUFS = -14.0

# Everything in C major.
C = [130.81, 196.0, 246.94, 293.66, 329.63]
AM = [110.0, 164.81, 196.0, 246.94, 261.63]
FM = [87.31, 174.61, 220.0, 261.63, 329.63]
G = [98.0, 196.0, 246.94, 293.66, 329.63]
SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.7, 1318.5, 1568.0]
CHIME_C = [523.25, 783.99, 1046.5, 1318.5]
CHIME_HI = [1046.5, 1318.5, 1568.0, 2093.0]


def drop_times(ti):
    n = max(4, round((ti["end"] - ti["start"]) / 0.3))
    return [ti["start"] + (ti["end"] - ti["start"]) * i / (n - 1) - 0.25 + 0.28 for i in range(n)]


def score(mix, tl):
    I, PR, A, R, L = tl["intro"], tl["protein"], tl["amino"], tl["react"], tl["lab"]
    T1, FO, T2, BL, CA, O = tl["t1"], tl["form"], tl["t2"], tl["blank"], tl["calc"], tl["outro"]
    dur = tl["duration"]
    put = mix.put

    chords = [
        (0, C), (PR["enter"], AM), (A["enter"], FM), (R["hcho"], G), (R["hit"], C),
        (L["enter"], AM), (T1["step"], FM), (FO["step"], G), (T2["step"], C),
        (BL["step"], AM), (CA["enter"], FM), (CA["result"], C), (O["enter"], FM), (O["logo"], C),
    ]
    vol = envelope([
        (0, 0), (1.0, 0.8), (R["approach"], 1.0), (R["hit"] - 0.05, 0.35), (R["hit"] + 1.2, 1.1),
        (O["fade"], 1.1), (dur, 0),
    ])
    mix.put_stereo(0, *pad(dur, chords, volume=vol), gain=0.05)

    # intro: drop, splash, logos, title
    put(I["drop"], whoosh(I["splash"] - I["drop"], 2400, 600, peak=0.8), 0.14)
    put(I["splash"], pop(900, 160, dur=0.3), 0.32)
    put(I["splash"] + 0.02, whoosh(1.2, 400, 5000, peak=0.1, q=0.5), 0.12)
    put(I["logo"], pop(700, 300), 0.22, 0.2)
    put(I["logo"] + 0.18, pop(800, 340), 0.22, -0.2)
    put(I["logo"] + 0.1, chime(CHIME_C, dur=2.2, tau=0.8), 0.10)
    for i, k in enumerate(["uni", "fac", "dept"]):
        put(I[k], blip(SCALE[i], dur=0.3, tau=0.08), 0.12, -0.3 + i * 0.3)
    put(I["title"], whoosh(0.6, 500, 2600, peak=0.5), 0.16)
    for i in range(5):
        put(I["title"] + 0.15 + i * 0.1, blip(SCALE[i + 2] / 2, dur=0.25, tau=0.07), 0.10, 0.5 - i * 0.25)
    put(I["title2"], whoosh(0.5, 700, 3200, peak=0.5), 0.14)
    put(I["title2"] + 0.35, chime(CHIME_HI, dur=1.8, tau=0.6), 0.12)
    put(I["exit"], whoosh(0.6, 3000, 600, peak=0.3), 0.14)

    # protein: glass, lens zoom, chain beads, the hero bead
    put(PR["glass"], pop(400, 200), 0.18, -0.4)
    put(PR["lens"], whoosh(1.0, 300, 2600, peak=0.6), 0.2, -0.3)
    for i in range(11):
        put(PR["chain"] + i * 0.07, pop(1000 + i * 70, 600), 0.09, -0.6 + i * 0.08)
    put(PR["head"], whoosh(0.5, 600, 2400, peak=0.4), 0.1, 0.4)
    put(PR["unfold"], whoosh(1.4, 200, 1200, peak=0.5, q=0.6), 0.12, -0.3)
    put(PR["bead"], pop(1318.5, 659.25), 0.26, -0.2)
    put(PR["bead"] + 0.05, chime([659.25, 987.77, 1318.5], dur=1.4, tau=0.5), 0.1)
    put(PR["sub"], whoosh(0.5, 500, 2000, peak=0.4), 0.1, 0.4)
    put(PR["idea"], blip(783.99, dur=0.4), 0.14, 0.4)
    put(PR["exit"] - 0.2, whoosh(0.9, 400, 3000, peak=0.7), 0.18)

    # amino acid: molecule spins in, the two groups, the seesaw cancels out
    put(A["mol"], whoosh(1.4, 300, 2000, peak=0.3), 0.16)
    put(A["amine"], pop(900, 450), 0.24, 0.5)
    put(A["amine"] + 0.02, blip(392.0, dur=0.5), 0.12, 0.5)
    put(A["carboxyl"], pop(1100, 550), 0.24, -0.5)
    put(A["carboxyl"] + 0.02, blip(523.25, dur=0.5), 0.12, -0.5)
    put(A["seesaw"] + 0.55, pop(300, 120, dur=0.22), 0.26, 0.4)
    put(A["cancel"] - 0.15, pop(320, 130, dur=0.22), 0.26, -0.4)
    put(A["cancel"] + 0.25, click(1600), 0.18)
    put(A["cancel"] + 0.3, blip(659.25, dur=0.6), 0.12)
    put(A["note"], pop(600, 300), 0.2)

    # reaction: the hero moment, the only riser and impact in the mix
    put(R["hcho"], whoosh(1.4, 3600, 500, peak=0.3), 0.2, 0.6)
    put(R["hcho"] + 0.5, pop(1500, 900), 0.16, 0.6)
    put(R["approach"] - 0.1, riser(R["hit"] - R["approach"] + 0.1), 0.24, 0.3)
    put(R["hit"], impact(1.4), 0.34)
    put(R["hit"], chime(CHIME_C, dur=2.4, tau=0.9), 0.14)
    put(R["water"] + 0.7, whoosh(1.6, 800, 4000, peak=0.3), 0.12, 0.7)
    put(R["water"] + 0.6, pop(1700, 2400, dur=0.12), 0.16, 0.6)
    put(R["lock"], click(2200), 0.26, 0.3)
    put(R["lock"] + 0.04, click(1500), 0.2, 0.3)
    put(R["acid"], pop(1200, 500), 0.24, -0.5)
    put(R["eq"], whoosh(0.6, 500, 2200, peak=0.4), 0.12)
    for i in range(13):
        put(R["eq"] + 0.2 + i * 0.09, click(2600 + i * 60, dur=0.03), 0.05, -0.6 + i * 0.1)
    for i, c in enumerate(R["chips"]):
        put(c, pop(SCALE[2 + i * 2], SCALE[2 + i * 2] / 2), 0.26, 0.4 - i * 0.4)
        put(c + 0.01, blip(SCALE[2 + i * 2] / 2, dur=0.45), 0.12, 0.4 - i * 0.4)
    put(R["chips"][2] + 0.1, chime(CHIME_HI, dur=2.0, tau=0.7), 0.12)
    put(R["exit"], whoosh(1.0, 2600, 400, peak=0.6), 0.18, -0.4)

    # lab setup
    put(L["burette"], whoosh(0.8, 2000, 500, peak=0.7), 0.16, -0.4)
    put(L["burette"] + 0.55, click(900, dur=0.06), 0.2, -0.4)
    put(L["flask"], pop(500, 240), 0.2, 0.0)
    put(L["pour"], whoosh(L["pourEnd"] - L["pour"], 300, 700, peak=0.5, q=1.6), 0.16)
    for d in L["drops"]:
        put(d + 0.3, pop(1900, 700, dur=0.1), 0.2, 0.1)
    for k in ["milkTag", "indTag", "naohTag"]:
        put(L[k], pop(1000, 520), 0.16, 0.5)
    put(L["indTag"] + 0.4, whoosh(1.0, 400, 1200, peak=0.5), 0.1, -0.2)
    put(L["guide"], whoosh(0.5, 600, 2400, peak=0.4), 0.14, 0.5)
    for i, s in enumerate(L["sw"]):
        put(s, pop(SCALE[4 - i], SCALE[4 - i] / 2), 0.2, 0.6 - i * 0.4)
    put(L["sw"][2] + 1.2, chime([783.99, 1046.5, 1318.5], dur=1.4, tau=0.5), 0.1)

    def titration(ti, step_note):
        put(ti["start"] - 0.4, click(1200), 0.18, -0.4)
        for j, d in enumerate(drop_times(ti)):
            put(d, pop(2100 - (j % 3) * 120, 800, dur=0.08), 0.13, -0.3 + (j % 2) * 0.1)
        put(ti["end"] + 0.05, click(1000), 0.14, -0.4)
        put(ti["stop"] + 0.2, chime([step_note, step_note * 1.5, step_note * 2], dur=1.6, tau=0.6), 0.14)

    put(T1["step"], whoosh(0.5, 700, 2600, peak=0.4), 0.14, 0.6)
    put(T1["step"] + 0.05, blip(659.25, dur=0.4), 0.12, 0.6)
    titration(T1, 659.25)
    put(T1["calc"], whoosh(0.5, 600, 2400, peak=0.4), 0.14, 0.5)
    put(T1["calc"] + 1.6, scratch(0.8), 0.06, 0.5)
    put(T1["result"], pop(1318.5, 659.25), 0.26, 0.5)
    put(T1["result"] + 0.05, chime(CHIME_C, dur=1.8, tau=0.6), 0.12, 0.5)
    put(T1["exit"], whoosh(0.5, 2400, 600, peak=0.4), 0.12, 0.5)

    put(FO["step"], whoosh(0.5, 700, 2600, peak=0.4), 0.14, 0.6)
    put(FO["step"] + 0.05, blip(783.99, dur=0.4), 0.12, 0.6)
    put(FO["pipette"] - 0.5, whoosh(0.8, 300, 900, peak=0.6), 0.12, 0.2)
    put(FO["pour"], whoosh(FO["pourEnd"] - FO["pour"], 300, 800, peak=0.5, q=1.6), 0.14, 0.2)
    put(FO["vanish"], whoosh(1.2, 3200, 300, peak=0.2, q=0.6), 0.16)
    put(FO["vanish"] + 0.5, blip(493.88, dur=0.6), 0.14)
    put(FO["inset"], whoosh(0.5, 600, 2400, peak=0.4), 0.14, 0.5)
    put(FO["note"], pop(1046.5, 523.25), 0.22, 0.5)
    put(FO["exit"], whoosh(0.5, 2400, 600, peak=0.4), 0.12, 0.5)

    put(T2["step"], whoosh(0.5, 700, 2600, peak=0.4), 0.14, 0.6)
    put(T2["step"] + 0.05, blip(880.0, dur=0.4), 0.12, 0.6)
    put(T2["refill"], whoosh(0.9, 500, 2200, peak=0.6, q=1.2), 0.12, -0.4)
    titration(T2, 783.99)
    put(T2["tag"], pop(1046.5, 523.25), 0.24, 0.5)
    put(T2["tag"] + 0.05, blip(523.25, dur=0.6), 0.12, 0.5)

    put(BL["step"], whoosh(0.5, 700, 2600, peak=0.4), 0.14, 0.6)
    put(BL["step"] + 0.05, blip(987.77, dur=0.4), 0.12, 0.6)
    put(BL["swap"], whoosh(1.0, 500, 1600, peak=0.5), 0.14, 0.3)
    put(BL["water"], pop(450, 220), 0.2, -0.3)
    put(BL["refill"], whoosh(0.9, 500, 2200, peak=0.6, q=1.2), 0.1, -0.4)
    titration(BL, 880.0)
    put(BL["formula"], whoosh(0.5, 600, 2400, peak=0.4), 0.14, 0.5)
    put(BL["values"], blip(659.25, dur=0.4), 0.14, 0.5)
    put(BL["result"], pop(1568.0, 783.99), 0.3, 0.6)
    put(BL["result"] + 0.05, chime(CHIME_HI, dur=2.2, tau=0.8), 0.14, 0.5)
    put(BL["exit"], whoosh(0.8, 2600, 400, peak=0.5), 0.16)

    # calculation
    put(CA["cow"], whoosh(0.7, 500, 2200, peak=0.5), 0.16, 0.5)
    put(CA["mult"], blip(659.25, dur=0.4), 0.14, 0.5)
    n = 16
    for i in range(n):
        tt = CA["count"] + (CA["countEnd"] - CA["count"]) * (1 - (1 - i / n) ** 2)
        put(tt, click(2400 + i * 40, dur=0.03), 0.08, 0.5)
    put(CA["result"], pop(1568.0, 783.99), 0.3, 0.5)
    put(CA["result"] + 0.05, chime(CHIME_C + [2093.0], dur=2.6, tau=0.9), 0.16, 0.4)
    put(CA["buff"], whoosh(0.7, 500, 2200, peak=0.5), 0.16, -0.5)
    put(CA["range"], pop(1174.7, 587.33), 0.24, -0.5)
    put(CA["range"] + 0.3, whoosh(1.2, 400, 1600, peak=0.6), 0.08)
    put(CA["exit"], whoosh(0.6, 2600, 500, peak=0.4), 0.14)

    # outro
    for i, c in enumerate(O["chips"]):
        put(c, pop(SCALE[i * 2], SCALE[i * 2] / 2), 0.22, 0.7 - i * 0.35)
    put(O["chipsOut"], whoosh(0.6, 2400, 500, peak=0.4), 0.14)
    put(O["logo"], pop(700, 300), 0.22, 0.2)
    put(O["logo"] + 0.18, pop(800, 340), 0.22, -0.2)
    put(O["logo"] + 0.1, chime(CHIME_C + [1568.0], dur=3.0, tau=1.1), 0.14)
    for i, k in enumerate(["uni", "fac", "dept", "prog"]):
        put(O[k], blip(SCALE[i + 3], dur=0.3, tau=0.08), 0.1, -0.3 + i * 0.2)
    put(O["team"], pop(1318.5, 659.25), 0.24)
    put(O["team"] + 0.05, chime(CHIME_HI, dur=3.2, tau=1.2), 0.14)
