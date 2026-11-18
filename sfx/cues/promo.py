"""SFX for the Ibdaa promo (kept sparse and soft: voice first, effects well under it), driven by the voiceover word timings in src/ibdaa3/vo.json.

No music and nothing musical: no drums, bells, chimes or note blips. Three layers:
  1. a foley world per scene (grill sizzle, honey drips, lab beeps and servo, pages, chalk, toy knocks, shutters, stamps)
  2. a clock tick in the last 4 s before the price, racing, then stopping dead on "تلتمية"
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
    race = t300 - 4.0
    t, k = race, 0
    while t < t300 - 0.02:
        x = max(0.0, (t - race) / (t300 - race))
        g = 0.035 + 0.05 * x
        put(t, tick(tock=k % 2 == 1), g, 0.25 if k % 2 else -0.25)
        t += 0.5 - 0.39 * x ** 1.4
        k += 1

    # ── hook: a shot per word, stutter slams
    h = lines["hook"]
    hw = [w["t"] for p in h["phrases"] for w in p["words"]]
    for j, w in enumerate(hw[:-1]):
        put(max(0, w - 0.06), whoosh(0.18, 2000, 600, peak=0.2), 0.08, (-1) ** j * 0.4)
    for w in hw[:3] + hw[-1:]:
        thud(w, 0.14)
    put(hw[-2] + 0.15, impact(0.9), 0.16)

    # ── brand: stamp the logo on kraft, rip it, the phone pushes through onto a sizzling burger
    b = lines["brand"]
    put(b["start"] - LEAD, whoosh(0.4, 3000, 400, peak=0.3), 0.2)
    put(b["phrases"][0]["words"][1]["t"], stamp(), 0.42)
    put(b["phrases"][1]["start"] - 0.1, rip(0.45), 0.18)
    put(b["phrases"][1]["start"] + 0.1, whoosh(0.7, 300, 2600, peak=0.6), 0.22)
    put(b["phrases"][1]["start"] + 0.2, sizzle(1.0), 0.04)
    thud(b["phrases"][2]["start"], 0.32)
    put(nxt("brand") - LEAD - 0.35, whoosh(0.4, 500, 4000, peak=0.9), 0.22)

    # ── before / after: a flat feed flicked past, rewound, then the food comes alive
    put(lines["flat"]["start"] - 0.05, pop(500, 200), 0.2)
    sk = lines["skip"]
    put(sk["phrases"][0]["words"][1]["t"] - 0.05, whoosh(0.4, 700, 3000, peak=0.5, q=0.7), 0.16, 0.3)
    put(sk["phrases"][1]["start"] - 0.05, whoosh(0.32, 700, 3000, peak=0.5, q=0.7), 0.16, -0.3)
    wt = lines["wait"]

    put(wt["start"], whoosh(0.45, 4200, 700, peak=0.4), 0.2)
    last = wt["phrases"][1]["words"][-1]["t"]
    put(wt["phrases"][1]["start"], riser(last - wt["phrases"][1]["start"] + 0.2, 300, 2400), 0.07)
    put(last + 0.15, impact(1.1), 0.18)
    alive = lines["wait"]["end"]
    put(alive - 0.05, stamp(), 0.14)
    put(alive + 0.12, whoosh(0.25, 3000, 600, peak=0.3), 0.2, -0.5)
    put(alive + 0.28, sizzle(1.2), 0.05)
    df = lines["diff"]
    put(df["phrases"][0]["start"], pop(1500, 800), 0.22)
    put(df["phrases"][1]["start"], click(1600), 0.1)

    # ── 1. the work, each with its own world
    W = ["w1", "w2", "w3", "w4", "w5", "w6", "w7"]
    for n, i in enumerate(W):
        l = lines[i]
        t0, p2 = l["start"] - LEAD, l["phrases"][1]["start"]
        whip(t0 - 0.05, 0.24, 0.6 if n % 2 else -0.6)
        put(t0 + 0.05, pop(900 + n * 60, 500), 0.1)
        thud(words(i, 0)[0], 0.1)
        put(p2 - 0.06, whoosh(0.2, 3000, 900, peak=0.2), 0.14)
        end = nxt(i) - LEAD
        if i == "w1":  # restaurant: grill and a crunchy cut
            put(t0 + 0.1, sizzle(1.4), 0.05)
            put(p2 + 0.25, crunch(0.25), 0.12)
        elif i == "w2":  # lab: phone glow at night, then the robot arm
            put(p2 + 0.4, beep(1200, 0.06), 0.02, 0.3)
        elif i == "w3":  # clinic chat: clock, then message pops
            for j in range(2):
                put(p2 + 0.1 + j * 0.35, pop(1100, 800, dur=0.08), 0.1, -0.3 + j * 0.6)
        elif i == "w4":  # cupping glass and a study counter racing up
            put(t0 + 0.2, knock(1200), 0.08)
        elif i == "w5":  # honey
            for j in range(2):
                put(t0 + 0.3 + j * 0.55, drip(600 + j * 80), 0.1, -0.2 + j * 0.4)
        elif i == "w6":  # classroom: pages and chalk
            put(t0 + 0.1, pageflip(), 0.1)
        elif i == "w7":  # kids: wooden toys
            for j in range(2):
                put(t0 + 0.25 + j * 0.4, knock(420 + j * 120), 0.08, (j - 0.5) * 0.6)

    # ── motion chapter
    w = lines["word"]
    whip(w["start"] - LEAD - 0.05)
    a = w["phrases"][0]
    for j in range(6):
        put(a["start"] + j * (a["end"] - a["start"]) / 6, key(), 0.09)
    put(w["phrases"][1]["start"] - 0.05, whoosh(0.4, 3600, 700, peak=0.3), 0.24, 0.5)
    thud(w["phrases"][2]["start"], 0.3)
    st = lines["story"]
    whip(st["start"] - LEAD - 0.05, 0.2)
    for j, ph in enumerate(st["phrases"]):
        put(ph["start"] - 0.05, pageflip(0.2), 0.08, 0.5 - j * 0.5)
    put(nxt("story") - LEAD - 0.35, whoosh(0.4, 400, 4400, peak=0.9), 0.22)
    sh = lines["shape"]
    for j, d in enumerate((0.22, 0.45, 0.6)):
        put(sh["start"] - LEAD + d, knock(380), 0.1 - j * 0.03)
    put(sh["phrases"][0]["start"] + 0.6, whoosh(0.45, 500, 2600, peak=0.6), 0.14)
    put(sh["phrases"][1]["start"], stamp(), 0.14)

    # ── designs: a shutter per poster, then the fan
    ds = lines["design"]
    t0, t1 = ds["start"] - LEAD, ds["phrases"][1]["start"] - 0.05
    for j in range(0, 10, 2):
        put(t0 + j * (t1 - t0) / 10, shutter(), 0.06, (j % 3 - 1) * 0.4)
    put(t1, whoosh(0.5, 400, 2400, peak=0.6), 0.2)


    # ── burger: riser, a shutter per style, the wall
    bg = lines["burger"]
    sa, sb = bg["phrases"][1]["start"] - 0.05, bg["phrases"][2]["start"] - 0.05
    thud(bg["phrases"][0]["words"][0]["t"], 0.14)
    put(bg["start"], riser(sa - bg["start"], 300, 2400), 0.08)
    for j in range(0, 19, 3):
        put(sa + j * (sb - sa) / 19, tick(), 0.05, (j % 2 - 0.5) * 0.6)
    put(sb, whoosh(0.9, 2000, 300, peak=0.4, q=0.6), 0.14)

    # ── skins: a page turn per identity
    sks = lines["skins"]
    for j, ph in enumerate(sks["phrases"]):
        put(ph["start"] - 0.12, pageflip(), 0.1)
    y = lines["yours"]
    thud(y["start"], 0.1)

    # ── price: the clock stops, the stamp lands
    put(pr["start"] - LEAD, whoosh(0.4, 3200, 600, peak=0.3), 0.2)
    
    put(t300, impact(1.4), 0.3)
    put(t300, stamp(), 0.16)

    put(nxt("price") - LEAD - 0.3, whoosh(0.4, 400, 3800, peak=0.8), 0.24)

    # ── cta + end
    ct = lines["cta"]
    for j, ph in enumerate(ct["phrases"][:2]):
        put(ph["start"] - 0.05, pop(800 + j * 150, 500, dur=0.1), 0.1)
    put(ct["phrases"][2]["start"] + 0.2, pop(1200, 700), 0.14)
    e = lines["end"]
    put(e["start"] - 0.15, whoosh(0.5, 400, 2600, peak=0.6), 0.2)
    put(e["start"], stamp(), 0.18)
    thud(e["phrases"][1]["start"], 0.16)
