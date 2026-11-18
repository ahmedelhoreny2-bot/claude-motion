"""SFX for the Ibdaa promo, driven by the voiceover word timings in src/ibdaa3/vo.json.
No music bed here: music comes from a separate track mixed under the voice.

    python3 -m sfx sfx/cues/promo.py
"""

from sfx.synth import blip, chime, click, impact, key, pop, riser, scratch, whoosh
from sfx.cues.ibdaa import kick, rip

TIMELINE = "src/ibdaa3/vo.json"
OUT = "public/ibdaa/promo/sfx.wav"
TARGET_LUFS = -18.0
LEAD = 0.12
N = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51]


def score(mix, tl):
    put = mix.put
    lines = {l["id"]: l for l in tl["lines"]}
    order = [l["id"] for l in tl["lines"]]

    def nxt(i):
        j = order.index(i)
        return lines[order[j + 1]]["start"] if j + 1 < len(order) else tl["duration"]

    def words(i, p=None):
        ph = lines[i]["phrases"] if p is None else [lines[i]["phrases"][p]]
        return [w["t"] for x in ph for w in x["words"]]

    def thud(t, g=0.22):
        put(t, kick(), g)
        put(t, pop(220, 80, dur=0.18), g * 0.7)

    # hook: stitched cuts + slammed words
    h = lines["hook"]
    step = (h["end"] - h["start"]) / 6
    for k in range(7):
        put(k * step, whoosh(0.22, 2400, 600, peak=0.2), 0.16, (-1) ** k * 0.5)
        if k:
            put(k * step, click(2600, dur=0.03), 0.12)
    for t in words("hook"):
        thud(t, 0.2)
    put(words("hook")[-2] + 0.15, impact(0.9), 0.22)

    # brand: logo stamp, paper rip, phone push, slam
    b = lines["brand"]
    put(b["start"] - LEAD, whoosh(0.4, 3000, 400, peak=0.3), 0.2)
    thud(b["phrases"][0]["words"][1]["t"], 0.3)
    for j in range(3):
        put(b["phrases"][0]["words"][1]["t"] + 0.1 + j * 0.07, pop(900 + j * 200, 500), 0.16)
    put(b["phrases"][1]["start"] - 0.1, rip(0.55), 0.34)
    put(b["phrases"][1]["start"] + 0.1, whoosh(0.7, 300, 2600, peak=0.6), 0.22)
    thud(b["phrases"][2]["start"], 0.32)
    for t in words("brand", 2):
        put(t, pop(700, 300), 0.14)
    put(nxt("brand") - LEAD - 0.35, whoosh(0.4, 500, 4000, peak=0.9), 0.22)

    # before / after
    put(lines["flat"]["start"] - 0.05, pop(500, 200), 0.24)
    sk = lines["skip"]
    put(sk["phrases"][0]["words"][1]["t"] - 0.05, whoosh(0.4, 900, 4200, peak=0.5, q=0.7), 0.28, 0.3)
    put(sk["phrases"][1]["start"] - 0.05, whoosh(0.32, 900, 4600, peak=0.5, q=0.7), 0.28, -0.3)
    wt = lines["wait"]
    for j in range(8):
        put(wt["start"] + j * 0.05, click(2600 - j * 180, dur=0.03), 0.12, 0.3 - j * 0.08)
    put(wt["start"], whoosh(0.45, 4200, 700, peak=0.4), 0.2)
    put(wt["start"] + 0.05, scratch(0.4), 0.12)
    last = wt["phrases"][1]["words"][-1]["t"]
    put(wt["phrases"][1]["start"], riser(last - wt["phrases"][1]["start"] + 0.2, 300, 4000), 0.18)
    put(last + 0.15, impact(1.1), 0.34)
    for j, d in enumerate((-0.05, 0.12, 0.28)):
        thud(lines["wait"]["end"] + d, 0.24)
    df = lines["diff"]
    put(df["phrases"][0]["start"], pop(1500, 800), 0.24)
    put(df["phrases"][1]["start"], click(2200), 0.28)
    put(df["phrases"][1]["start"], chime([N[0], N[2], N[4]], dur=1.0, tau=0.35), 0.12)

    # work sections: whip in, cut on phrase 2, title slams
    for n, i in enumerate(["w1", "w2", "w3", "w4", "w5", "w6", "w7"]):
        l = lines[i]
        t0 = l["start"] - LEAD
        put(t0 - 0.05, whoosh(0.3, 700, 4600, peak=0.35, q=0.8), 0.24, 0.6 if n % 2 else -0.6)
        put(t0 + 0.05, pop(900 + n * 60, 500), 0.12)
        for t in words(i, 0):
            thud(t, 0.14)
        put(l["phrases"][1]["start"] - 0.06, whoosh(0.2, 3000, 900, peak=0.2), 0.14)
        put(l["phrases"][1]["start"] - 0.06, blip(N[n % 8], dur=0.25, tau=0.07), 0.1)

    # word / story / shape
    w = lines["word"]
    t0 = w["start"] - LEAD
    put(t0 - 0.05, whoosh(0.3, 700, 4600, peak=0.35), 0.24)
    a = w["phrases"][0]
    for j in range(6):
        put(a["start"] + j * (a["end"] - a["start"]) / 6, key(), 0.2)
    put(w["phrases"][1]["start"] - 0.05, whoosh(0.4, 3600, 700, peak=0.3), 0.24, 0.5)
    thud(w["phrases"][2]["start"], 0.32)
    st = lines["story"]
    put(st["start"] - LEAD - 0.05, whoosh(0.3, 700, 4600, peak=0.35), 0.2)
    for j, ph in enumerate(st["phrases"]):
        put(ph["start"], pop(800 + j * 160, 300), 0.24, 0.5 - j * 0.5)
        put(ph["start"] + 0.12, click(2100 + j * 150), 0.16, 0.5 - j * 0.5)
    put(st["phrases"][1]["start"], scratch(0.8), 0.06)
    put(nxt("story") - LEAD - 0.35, whoosh(0.4, 400, 4400, peak=0.9), 0.22)
    sh = lines["shape"]
    for j, d in enumerate((0.22, 0.45, 0.6)):
        put(sh["start"] - LEAD + d, pop(600 - j * 60, 200, dur=0.12), 0.2 - j * 0.05)
    put(sh["phrases"][0]["start"] + 0.6, whoosh(0.45, 500, 2600, peak=0.6), 0.14)
    thud(sh["phrases"][1]["start"], 0.3)

    # designs: shutter flicks, then the fan
    ds = lines["design"]
    t0, t1 = ds["start"] - LEAD, ds["phrases"][1]["start"] - 0.05
    for j in range(10):
        put(t0 + j * (t1 - t0) / 10, click(1900 + (j % 3) * 300, dur=0.04), 0.2, (j % 3 - 1) * 0.4)
    put(t1, whoosh(0.5, 400, 2400, peak=0.6), 0.2)
    for j in range(7):
        put(t1 + j * 0.05, pop(1000 + j * 80, 600, dur=0.1), 0.08, (j - 3) * 0.2)

    # burger: riser into a 19-frame strobe, counter ticks, the wall
    bg = lines["burger"]
    sa, sb = bg["phrases"][1]["start"] - 0.05, bg["phrases"][2]["start"] - 0.05
    thud(bg["phrases"][0]["words"][0]["t"], 0.26)
    put(bg["start"], riser(sa - bg["start"], 300, 3600), 0.16)
    for j in range(19):
        put(sa + j * (sb - sa) / 19, click(2400 + (j % 4) * 150, dur=0.025), 0.16, (j % 2 - 0.5) * 0.6)
    put(sb, whoosh(0.9, 2600, 300, peak=0.4, q=0.6), 0.26)
    put(sb + 0.05, chime([N[0], N[2], N[4]], dur=1.4, tau=0.5), 0.12)

    # skins
    sks = lines["skins"]
    for j, ph in enumerate(sks["phrases"]):
        put(ph["start"] - 0.1, whoosh(0.3, 600, 3000, peak=0.6), 0.2)
        put(ph["start"], pop(900 + j * 150, 500), 0.22)
        put(ph["start"] + 0.04, blip(N[j + 2], dur=0.35), 0.12)
    y = lines["yours"]
    for j in range(4):
        put(y["start"] - 0.1 + j * 0.07, pop(1100 + j * 140, 600), 0.16, [-0.4, 0.4, -0.4, 0.4][j])
    for ph in y["phrases"]:
        thud(ph["start"], 0.2)

    # price: the one big impact on "تلتمية"
    pr = lines["price"]
    put(pr["start"] - LEAD, whoosh(0.4, 3200, 600, peak=0.3), 0.2)
    b2 = pr["phrases"][1]["words"]
    t300 = next((x["t"] for x in b2 if x["w"] == "تلتمية"), pr["phrases"][1]["start"] + 0.6)
    put(pr["phrases"][1]["start"], riser(t300 - pr["phrases"][1]["start"], 300, 4200), 0.2)
    put(t300, impact(1.6), 0.45)
    thud(t300, 0.3)
    for x in b2:
        if x["t"] > t300:
            put(x["t"], pop(700, 260), 0.2)
    put(nxt("price") - LEAD - 0.3, whoosh(0.4, 400, 3800, peak=0.8), 0.24)

    # cta + end
    ct = lines["cta"]
    for j, ph in enumerate(ct["phrases"]):
        put(ph["start"] - 0.05, pop(1100 + j * 200, 600), 0.22)
    put(ct["phrases"][2]["start"] + 0.2, pop(1600, 800), 0.26)
    put(ct["phrases"][2]["start"] + 0.22, blip(N[5], dur=0.5), 0.12)
    e = lines["end"]
    put(e["start"] - 0.15, whoosh(0.5, 400, 2600, peak=0.6), 0.2)
    for j in range(3):
        put(e["start"] + 0.1 + j * 0.07, pop(900 + j * 200, 500), 0.18, -0.2 + j * 0.2)
    thud(e["phrases"][1]["start"], 0.28)
    put(e["phrases"][1]["start"] + 0.05, chime([N[0] / 2, N[2] / 2, N[4] / 2, N[0], N[4]], dur=2.6, tau=1.0), 0.18)
