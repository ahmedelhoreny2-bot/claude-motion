"""SFX for the Ibdaa promo, driven by the voiceover word timings in src/ibdaa3/vo.json.

No music and nothing musical: no drums, bells, chimes or note blips. Three layers:
  1. a foley world per scene (grill sizzle, honey drips, lab beeps and servo, pages, chalk, toy knocks, shutters, stamps)
  2. a clock tick under the voice that speeds up into the price, then stops dead on "تلتمية"
  3. transitions: air, paper and low impacts
The voice stutter and echoes live in the voice track itself (scripts/promo-vo.py).

    python3 -m sfx sfx/cues/promo.py
"""

from sfx.synth import (beep, click, crunch, drip, impact, key, knock, pageflip, pop, riser, scratch, servo, shutter, sizzle, stamp,
                       tick, whoosh)
from sfx.cues.ibdaa import rip

TIMELINE = "src/ibdaa3/vo.json"
OUT = "public/ibdaa/promo/sfx.wav"
TARGET_LUFS = -18.0
LEAD = 0.12


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
        put(t, impact(0.45), g * 0.8)
        put(t, whoosh(0.12, 1800, 400, peak=0.1), g * 0.5)

    def whip(t, g=0.22, pan=0.0):
        put(t, whoosh(0.3, 700, 4600, peak=0.35, q=0.8), g, pan)

    # ── 2. the clock: steady under the voice, racing into the price, dead stop on "تلتمية"
    pr = lines["price"]
    b2 = pr["phrases"][1]["words"]
    t300 = next((x["t"] for x in b2 if x["w"] == "تلتمية"), pr["phrases"][1]["start"] + 0.6)
    t, k = lines["brand"]["start"], 0
    race = t300 - 4.0
    while t < t300 - 0.02:
        x = max(0.0, (t - race) / (t300 - race))
        g = 0.05 + 0.06 * x
        put(t, tick(tock=k % 2 == 1), g, 0.25 if k % 2 else -0.25)
        t += 0.5 - 0.39 * x ** 1.4
        k += 1

    # ── hook: a shot per word, stutter slams
    h = lines["hook"]
    hw = [w["t"] for p in h["phrases"] for w in p["words"]]
    for j, w in enumerate(hw[:-1]):
        put(max(0, w - 0.06), whoosh(0.18, 2600, 700, peak=0.2), 0.14, (-1) ** j * 0.5)
        put(max(0, w - 0.03), shutter(), 0.12)
    for w in hw:
        thud(w, 0.18)
    put(hw[-2] + 0.15, impact(0.9), 0.24)

    # ── brand: stamp the logo on kraft, rip it, the phone pushes through onto a sizzling burger
    b = lines["brand"]
    put(b["start"] - LEAD, whoosh(0.4, 3000, 400, peak=0.3), 0.2)
    put(b["phrases"][0]["words"][1]["t"], stamp(), 0.42)
    put(b["phrases"][1]["start"] - 0.1, rip(0.55), 0.36)
    put(b["phrases"][1]["start"] + 0.1, whoosh(0.7, 300, 2600, peak=0.6), 0.22)
    put(b["phrases"][1]["start"] + 0.2, sizzle(b["end"] - b["phrases"][1]["start"]), 0.1)
    thud(b["phrases"][2]["start"], 0.32)
    put(nxt("brand") - LEAD - 0.35, whoosh(0.4, 500, 4000, peak=0.9), 0.22)

    # ── before / after: a flat feed flicked past, rewound, then the food comes alive
    put(lines["flat"]["start"] - 0.05, pop(500, 200), 0.2)
    sk = lines["skip"]
    put(sk["phrases"][0]["words"][1]["t"] - 0.05, whoosh(0.4, 900, 4200, peak=0.5, q=0.7), 0.3, 0.3)
    put(sk["phrases"][1]["start"] - 0.05, whoosh(0.32, 900, 4600, peak=0.5, q=0.7), 0.3, -0.3)
    wt = lines["wait"]
    for j in range(8):
        put(wt["start"] + j * 0.05, click(2600 - j * 180, dur=0.03), 0.12, 0.3 - j * 0.08)
    put(wt["start"], whoosh(0.45, 4200, 700, peak=0.4), 0.2)
    put(wt["start"] + 0.05, scratch(0.4), 0.12)
    last = wt["phrases"][1]["words"][-1]["t"]
    put(wt["phrases"][1]["start"], riser(last - wt["phrases"][1]["start"] + 0.2, 300, 4000), 0.16)
    put(last + 0.15, impact(1.1), 0.34)
    alive = lines["wait"]["end"]
    put(alive - 0.05, stamp(), 0.3)
    put(alive + 0.12, whoosh(0.25, 3000, 600, peak=0.3), 0.2, -0.5)
    put(alive + 0.28, sizzle(lines["diff"]["end"] - alive), 0.16)
    df = lines["diff"]
    put(df["phrases"][0]["start"], pop(1500, 800), 0.22)
    put(df["phrases"][1]["start"], click(2200), 0.3)

    # ── 1. the work, each with its own world
    W = ["w1", "w2", "w3", "w4", "w5", "w6", "w7"]
    for n, i in enumerate(W):
        l = lines[i]
        t0, p2 = l["start"] - LEAD, l["phrases"][1]["start"]
        whip(t0 - 0.05, 0.24, 0.6 if n % 2 else -0.6)
        put(t0 + 0.05, pop(900 + n * 60, 500), 0.1)
        for tt in words(i, 0):
            thud(tt, 0.12)
        put(p2 - 0.06, whoosh(0.2, 3000, 900, peak=0.2), 0.14)
        end = nxt(i) - LEAD
        if i == "w1":  # restaurant: grill and a crunchy cut
            put(t0, sizzle(end - t0), 0.18)
            put(p2 + 0.2, crunch(0.3), 0.3)
            put(p2 + 0.55, crunch(0.25), 0.22)
        elif i == "w2":  # lab: phone glow at night, then the robot arm
            for j in range(2):
                put(t0 + 0.3 + j * 0.25, beep(1800, 0.05), 0.05)
            put(p2, servo(0.7, 120, 240), 0.14, 0.3)
            for j in range(3):
                put(p2 + 0.75 + j * 0.16, beep(2400, 0.05), 0.06, 0.3)
        elif i == "w3":  # clinic chat: clock, then message pops
            for j in range(int((p2 - t0) / 0.25)):
                put(t0 + j * 0.25, tick(j % 2 == 1), 0.07)
            for j in range(3):
                put(p2 + 0.1 + j * 0.3, pop(1300 + j * 120, 900, dur=0.08), 0.2, -0.3 + j * 0.3)
        elif i == "w4":  # cupping glass and a study counter racing up
            put(t0 + 0.2, knock(1800), 0.18)
            for j in range(12):
                put(p2 + j * 0.06, click(2200 + j * 40, dur=0.02), 0.08)
        elif i == "w5":  # honey
            for j in range(3):
                put(t0 + 0.25 + j * 0.42, drip(700 + j * 90), 0.22, -0.2 + j * 0.2)
            put(p2 - 0.1, whoosh(0.5, 300, 1200, peak=0.3), 0.14)
            for j in range(3):
                put(p2 + 0.2 + j * 0.25, pop(1200, 700, dur=0.08), 0.14, 0.4 - j * 0.4)
        elif i == "w6":  # classroom: pages and chalk
            put(t0 + 0.1, pageflip(), 0.24)
            put(p2, scratch(0.7), 0.18)
        elif i == "w7":  # kids: wooden toys
            for j in range(5):
                put(t0 + 0.2 + j * 0.28, knock(480 + (j % 3) * 120), 0.16, (j % 3 - 1) * 0.5)

    # ── motion chapter
    w = lines["word"]
    whip(w["start"] - LEAD - 0.05)
    a = w["phrases"][0]
    for j in range(6):
        put(a["start"] + j * (a["end"] - a["start"]) / 6, key(), 0.2)
    put(w["phrases"][1]["start"] - 0.05, whoosh(0.4, 3600, 700, peak=0.3), 0.24, 0.5)
    thud(w["phrases"][2]["start"], 0.3)
    st = lines["story"]
    whip(st["start"] - LEAD - 0.05, 0.2)
    for j, ph in enumerate(st["phrases"]):
        put(ph["start"] - 0.05, pageflip(0.2), 0.2, 0.5 - j * 0.5)
        put(ph["start"] + 0.12, knock(900), 0.2, 0.5 - j * 0.5)
    put(st["phrases"][1]["start"], scratch(0.8), 0.06)
    put(nxt("story") - LEAD - 0.35, whoosh(0.4, 400, 4400, peak=0.9), 0.22)
    sh = lines["shape"]
    for j, d in enumerate((0.22, 0.45, 0.6)):
        put(sh["start"] - LEAD + d, knock(380), 0.22 - j * 0.06)
    put(sh["phrases"][0]["start"] + 0.6, whoosh(0.45, 500, 2600, peak=0.6), 0.14)
    put(sh["phrases"][1]["start"], stamp(), 0.3)

    # ── designs: a shutter per poster, then the fan
    ds = lines["design"]
    t0, t1 = ds["start"] - LEAD, ds["phrases"][1]["start"] - 0.05
    for j in range(10):
        put(t0 + j * (t1 - t0) / 10, shutter(), 0.2, (j % 3 - 1) * 0.4)
    put(t1, whoosh(0.5, 400, 2400, peak=0.6), 0.2)
    for j in range(7):
        put(t1 + j * 0.05, pageflip(0.12), 0.08, (j - 3) * 0.2)

    # ── burger: riser, a shutter per style, the wall
    bg = lines["burger"]
    sa, sb = bg["phrases"][1]["start"] - 0.05, bg["phrases"][2]["start"] - 0.05
    thud(bg["phrases"][0]["words"][0]["t"], 0.26)
    put(bg["start"], sizzle(sa - bg["start"]), 0.12)
    put(bg["start"], riser(sa - bg["start"], 300, 3600), 0.14)
    for j in range(19):
        put(sa + j * (sb - sa) / 19, shutter(), 0.14, (j % 2 - 0.5) * 0.6)
    put(sb, whoosh(0.9, 2600, 300, peak=0.4, q=0.6), 0.26)

    # ── skins: a page turn per identity
    sks = lines["skins"]
    for j, ph in enumerate(sks["phrases"]):
        put(ph["start"] - 0.12, pageflip(), 0.24)
        put(ph["start"], pop(900 + j * 150, 500), 0.18)
    y = lines["yours"]
    for j in range(4):
        put(y["start"] - 0.1 + j * 0.07, knock(700 + j * 80), 0.14, [-0.4, 0.4, -0.4, 0.4][j])
    for ph in y["phrases"]:
        thud(ph["start"], 0.18)

    # ── price: the clock stops, the stamp lands
    put(pr["start"] - LEAD, whoosh(0.4, 3200, 600, peak=0.3), 0.2)
    put(pr["phrases"][1]["start"], riser(t300 - pr["phrases"][1]["start"], 300, 4200), 0.18)
    put(t300, impact(1.6), 0.45)
    put(t300, stamp(), 0.4)
    for x in b2:
        if x["t"] > t300:
            put(x["t"], stamp(), 0.2)
    put(nxt("price") - LEAD - 0.3, whoosh(0.4, 400, 3800, peak=0.8), 0.24)

    # ── cta + end
    ct = lines["cta"]
    for j, ph in enumerate(ct["phrases"]):
        put(ph["start"] - 0.05, stamp(), 0.22)
    put(ct["phrases"][2]["start"] + 0.2, pop(1600, 800), 0.26)
    e = lines["end"]
    put(e["start"] - 0.15, whoosh(0.5, 400, 2600, peak=0.6), 0.2)
    put(e["start"], stamp(), 0.34)
    thud(e["phrases"][1]["start"], 0.3)
