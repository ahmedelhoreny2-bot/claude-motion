"""Sound design for AsemaPromo (Al Asema Lab reel): every sound is driven by a motion on screen.

- Springs (pop-ins, drops, slams) are simulated with the same configs as AsemaPromo.tsx, so the
  hit lands on the exact frame the element lands, and its travel gets a whoosh in its direction.
- Iris wipes get an air sweep panned from the wipe's origin; word reveals get a soft tick each.
- Counters and the dial tick on every step they actually show; the ECG beeps on its spikes.
- Under it all: a quiet lab (analyzer whir) and one natural texture per scene. No music, no low thumps.

    python3 -m sfx sfx/cues/asema.py      (then brand/al-asema-lab/video/mix_vo.py adds the voice)
"""

import math

from sfx.synth import (SR, beep, bubbles, centrifuge, chime, click, crackle, creak, drip, hum, pipette, pop,
                       roomtone, scratch, servo, water, whoosh, wind)

TIMELINE = "src/asema/timeline.json"
OUT = "public/asema/sfx.wav"
TARGET_LUFS = -14.0

# same constants as src/asema/AsemaPromo.tsx
FPS = 60
POP = (10, 220, 0.7)
HEAVY = (17, 180, 0.9)
DIAL = (12, 190, 0.75)
STICKER = (8, 200, 0.7)
WIPE = 0.45
PW = 1080
ORIGIN_X = {"s2": 540, "s3": 780, "s4": 1080, "s5": 540, "s9": 540, "s6": 470, "s10": 540, "s7": 580, "s8": 540}


# ---------------------------------------------------------------- motion maths (mirrors the picture)
def spring_curve(damping, stiffness, mass, secs=2.0):
    """Remotion-style spring 0->1 sampled at 1 ms; returns list of values."""
    x, v, dt = 0.0, 0.0, 0.001
    out = []
    for _ in range(int(secs / dt)):
        a = (-stiffness * (x - 1) - damping * v) / mass
        v += a * dt
        x += v * dt
        out.append(x)
    return out


def land(start, cfg):
    """Seconds after start when the spring first reaches its target (the visual 'impact')."""
    c = spring_curve(*cfg)
    for i, x in enumerate(c):
        if x >= 1.0:
            return start + i * 0.001
    return start + 0.3


def bezier(p1x, p1y, p2x, p2y):
    def f(x):
        lo, hi = 0.0, 1.0
        for _ in range(40):
            m = (lo + hi) / 2
            bx = 3 * (1 - m) ** 2 * m * p1x + 3 * (1 - m) * m * m * p2x + m ** 3
            lo, hi = (m, hi) if bx < x else (lo, m)
        m = (lo + hi) / 2
        return 3 * (1 - m) ** 2 * m * p1y + 3 * (1 - m) * m * m * p2y + m ** 3
    return f


EASE_OUT = bezier(0.16, 1, 0.3, 1)


def panned(samples, p0, p1):
    """Equal-power pan that travels p0 -> p1 over the sound (for things that move across the frame)."""
    n = len(samples)
    left, right = [], []
    for k, s in enumerate(samples):
        p = p0 + (p1 - p0) * k / max(1, n - 1)
        a = (p + 1) * math.pi / 4
        left.append(s * math.cos(a))
        right.append(s * math.sin(a))
    return left, right


def xpan(x):
    return max(-1.0, min(1.0, (x - PW / 2) / (PW / 2)))


# ---------------------------------------------------------------- vocabulary
def tick():
    """Word reveal: a tiny bright air tick."""
    return whoosh(0.09, 3000, 7000, peak=0.25)


def thock(pitch=900):
    """Something solid landing, without a low thump: a dry mid knock."""
    return [a + b for a, b in zip(click(pitch, 0.06) + [0.0] * 200, pop(pitch * 0.8, pitch * 0.45, 0.07))]


def score(mix, tl):
    s1, s2, s3, s4, s5, s6, s7, s8, s9, s10 = (tl[k] for k in ("s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"))
    dur = tl["duration"]
    beat = 60 / tl["bpm"]
    put = mix.put

    def words(t0, text, stagger=0.09, gain=0.05, pan=0.0):
        for i, _ in enumerate(text.split(" ")):
            put(t0 + i * stagger, tick(), gain, pan)

    def drop_in(start, cfg, f0, f1, gain=0.12, land_gain=0.14, pitch=900, pan=0.0):
        """Spring travel = directional whoosh ending on the landing frame, then a dry knock."""
        t_land = land(start, cfg)
        d = max(0.12, t_land - start)
        put(start, whoosh(d, f0, f1, peak=0.85), gain, pan)
        put(t_land, thock(pitch), land_gain, pan)
        return t_land

    def pops(starts, cfg=POP, f0=900, step=130, gain=0.12, pans=None):
        for i, st in enumerate(starts):
            p = pans[i] if pans else -0.5 + i / max(1, len(starts) - 1)
            put(land(st, cfg), pop(f0 + i * step, (f0 + i * step) * 0.5), gain, p)

    # ---- the room: a quiet lab under everything (never silent, never in the way)
    put(0, roomtone(dur), 0.028)
    put(0, centrifuge(dur), 0.018)

    # ---- iris wipes: an air sweep that opens with the circle, from its origin side
    for key in ("s2", "s3", "s4", "s5", "s9", "s6", "s10", "s7", "s8"):
        e = tl[key]["enter"]
        mix.put_stereo(e - 0.05, *panned(whoosh(WIPE + 0.1, 300, 4200, peak=0.55), xpan(ORIGIN_X[key]), 0.0), 0.15)

    # ---- logo tab: drops in at scene 2, lifts away at the logo
    tab_in = s2["enter"] + 0.3
    put(tab_in, whoosh(0.6, 2400, 900, peak=0.3), 0.05, 0.6)
    put(tab_in + 0.55, click(2200), 0.06, 0.6)

    # 1 ---- hook: three words slam in (scale 1.35 -> 1), underline swipes right to left, ECG beeps on its spikes
    for i, (w, note) in enumerate(zip((s1["w1"] - 0.25, s1["w2"], s1["w3"]), (784.0, 987.77, 1174.66))):
        t_l = max(0.0, land(w, POP))
        put(t_l, thock(1100), 0.16, (-0.15, 0.15, 0)[i])
        put(t_l, beep(note, 0.12), 0.06)
    mix.put_stereo(s1["w2"] + 0.25, *panned(whoosh(0.6, 1800, 5200, peak=0.35), 0.5, -0.5), 0.07)
    t = 0.16 * beat
    while t < s1["exit"]:
        put(t, beep(1046.5, 0.09), 0.07, -0.6 + 1.2 * min(1, t / (3 * beat)))
        t += beat

    # 2 ---- liver: ring draws round, liver falls in from above, charge hums up to 15%, badge pops, chips
    mix.put_stereo(s2["ring"], *panned(whoosh(0.9, 400, 3000, peak=0.5), -0.6, 0.6), 0.07)
    drop_in(s2["liver"], HEAVY, 3200, 500, gain=0.14, land_gain=0.16, pitch=700)
    words(s2["t1"], "شحن كبدك")
    words(s2["t2"], "كام في المية؟")
    put(s2["fill"], hum(0.75, f0=110, rise=1.4), 0.07)
    t_b = land(s2["badge"], POP)
    put(t_b, pop(1300, 600), 0.16, 0.5)
    put(t_b, beep(1568.0, 0.18), 0.07, 0.5)
    pops([s2["chips"] + i * 0.08 for i in range(6)], f0=1100, step=110, gain=0.09)

    # 3 ---- kidneys: rise from below, water pours, counter ticks on every 10 it shows, "لتر في اليوم!" lands
    t_k = land(s3["subject"], HEAVY)
    put(s3["subject"], whoosh(t_k - s3["subject"], 500, 2600, peak=0.85), 0.1)
    put(s3["subject"], water(s3["exit"] - s3["subject"] + 0.3), 0.16)
    mix.put_stereo(s3["enter"] + 0.2, *panned(whoosh(1.0, 400, 3000, peak=0.5), 0.6, -0.6), 0.06)
    words(s3["t1"], "كليتك بتفلتر حوالي")
    last = -1
    steps = 2000
    for i in range(steps + 1):
        u = i / steps
        n = round(180 * EASE_OUT(u))
        if n // 10 != last:
            last = n // 10
            put(s3["count"] + u * (s3["countEnd"] - s3["count"]), click(1500 + 6 * n, 0.03), 0.07 + n / 3000)
    put(land(s3["t2"], POP), thock(1000), 0.12, 0.3)
    put(land(s3["t2"], POP), drip(), 0.1, 0.3)

    # 4 ---- thyroid: dial spins in (ratchet click every 15 degrees it turns), cold / hot / tired pop out
    curve = spring_curve(*DIAL)
    last = None
    for i, k in enumerate(curve):
        ang = (1 - k) * -120
        step = math.floor(ang / 15)
        if last is not None and step != last:
            put(s4["dial"] + i * 0.001, click(1400, 0.03), 0.07)
        last = step
    put(land(s4["dial"], DIAL), thock(800), 0.14)
    for i, (w, p) in enumerate(zip(s4["words"], (-0.6, 0.6, 0.0))):
        put(land(w, POP), pop(800 + i * 150, 380 + i * 60), 0.14, p)
    put(s4["words"][0], wind(2.2), 0.14, -0.7)
    put(s4["words"][1], crackle(2.0), 0.14, 0.7)
    words(s4["t1"], "يمكن الغدة الدرقية")
    put(land(s4["tag"], POP), beep(1318.5, 0.16), 0.08)
    put(land(s4["tag"], POP), pop(1200, 600), 0.1)

    # 5 ---- vitamin D: capsule slides in from the right (whoosh travels right -> centre), sun sizzles, chips
    mix.put_stereo(s5["capsule"], *panned(whoosh(0.95, 3400, 400, peak=0.2), 0.9, 0.0), 0.15)
    put(s5["capsule"] + 0.9, thock(650), 0.1)
    put(s5["capsule"] + 0.5, crackle(s5["exit"] - s5["capsule"], rate=16, seed=11), 0.07)
    words(s5["t1"], "عايش في بلد الشمس..")
    words(s5["t2"], "وناقصك فيتامين د؟")
    pops([s5["chips"] + i * 0.15 for i in range(3)], f0=950, step=160, gain=0.11)

    # 6 ---- joints: hinge slides in from the right, ring draws, the squeak shakes it, oil drips, six tests
    t_j = land(s9["subject"], HEAVY)
    mix.put_stereo(s9["subject"], *panned(whoosh(t_j - s9["subject"], 2600, 700, peak=0.85), 0.7, 0.1), 0.12)
    put(t_j, thock(600), 0.12, 0.1)
    mix.put_stereo(s9["enter"] + 0.15, *panned(whoosh(1.0, 400, 3000, peak=0.5), -0.6, 0.6), 0.06)
    words(s9["t1"], "مفاصلك بتزيّق؟", stagger=0.15)
    put(s9["squeak"], creak(0.6), 0.22, -0.5)
    put(s9["t2"] + 0.25, drip(), 0.12, 0.4)
    words(s9["t2"], "قبل ما تزيتها.. اعرف السبب", stagger=0.07, gain=0.035)
    pops([s9["tests"] + i * 0.15 for i in range(6)], f0=900, step=110, gain=0.09)

    # 7 ---- blood: the drop grows out of the centre with the ring drawing round it, bubbling inside, labels pop
    t_d = land(s6["drop"], HEAVY)
    put(s6["drop"], whoosh(t_d - s6["drop"] + 0.1, 300, 2200, peak=0.85), 0.13)
    mix.put_stereo(s6["drop"], *panned(whoosh(1.0, 400, 3000, peak=0.5), -0.6, 0.6), 0.06)
    put(s6["drop"] + 0.15, bubbles(s6["exit"] - s6["drop"]), 0.08)
    words(s6["t1"], "جواك جيش كامل")
    words(s6["t2"], "صورة الدم الكاملة بتطمنك عليه", stagger=0.06, gain=0.035)
    pops([s6["labels"][0] + i * 0.12 for i in range(4)], f0=1000, step=140, gain=0.1)

    # 8 ---- beans: rise from below into a slow zoom, ring draws, the sticker slaps on with an elastic spring
    t_bn = land(s10["subject"], HEAVY)
    put(s10["subject"], whoosh(t_bn - s10["subject"] + 0.05, 500, 2400, peak=0.85), 0.11)
    mix.put_stereo(s10["enter"] + 0.15, *panned(whoosh(1.0, 400, 3000, peak=0.5), 0.2, 0.9), 0.06)
    words(s10["t1"], "مش فاصوليا..")
    words(s10["t2"], "دي كليتك!")
    t_st = land(s10["sticker"], STICKER)
    put(s10["sticker"], whoosh(t_st - s10["sticker"], 1800, 600, peak=0.8), 0.08, -0.6)
    put(t_st, pop(700, 260, 0.2), 0.18, -0.6)
    put(t_st, pipette(), 0.08, -0.6)

    # 9 ---- promise: each word zooms in from 1.6x and lands on the beat; the row and the blue bar sweep in
    for i, w in enumerate(s7["w"]):
        t_w = land(w, POP)
        put(w - 0.02, whoosh(t_w - w + 0.02, 5000, 1200, peak=0.9), 0.1)
        put(t_w, thock(1200), 0.14)
        put(t_w, beep((1046.5, 1318.5, 1568.0)[i], 0.2), 0.08)
    put(s7["line"] - 0.15, whoosh(0.5, 900, 3200, peak=0.5), 0.08)
    mix.put_stereo(s7["line"] + 0.25, *panned(whoosh(0.6, 1600, 4800, peak=0.4), 0.5, -0.5), 0.08)
    put(s8["enter"] - 0.9, whoosh(0.95, 300, 5000, peak=0.95), 0.1)

    # 10 ---- logo builds itself: stripe grows left->right, arm draws, tube drops onto the ring, bubbles pop
    put(s8["enter"], chime([1046.5, 1318.5, 1568.0, 2093.0], dur=2.2, tau=0.7), 0.09)
    mix.put_stereo(s8["stripe"], *panned(whoosh(0.55, 1200, 4400, peak=0.3), -0.7, 0.7), 0.1)
    put(s8["arm"], scratch(0.7), 0.06)
    put(s8["arm"], servo(0.7, 700, 1300), 0.03)
    drop_in(s8["tube"], HEAVY, 3000, 700, gain=0.1, land_gain=0.16, pitch=900)
    pops(s8["bubbles"], f0=1300, step=150, gain=0.08, pans=[-0.6 + i * 0.1 for i in range(6)])
    words(s8["name"], "معمل العاصمة", gain=0.06)
    words(s8["sub"], "للتحاليل الطبية", gain=0.04)
    t_c = land(s8["cta"], POP)
    put(t_c, pop(1000, 420), 0.16)
    put(t_c, beep(1568.0, 0.2), 0.07)
    put(s8["contact"], whoosh(0.6, 700, 2400, peak=0.4), 0.05)
    put(s8["contact"] + 0.5, beep(1318.5, 0.14), 0.05)
    put(s8["contact"] + 0.68, beep(1568.0, 0.22), 0.05)
