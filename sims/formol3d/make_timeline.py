"""Builds sims/formol3d/timeline.json from the aligned voice: sentences back to back, short pauses,
~1 s between chapters (filled by a 3D transition), and word-level anchors for every sync point."""
import json, re
segs = json.load(open('vo/segments.json'))
sil = [tuple(map(float, l.split())) for l in open('vo/sil2.txt')]
CH = [('intro', 1), ('protein', 4), ('amino', 7), ('react', 11), ('setup', 14), ('t1', 17), ('form', 20), ('t2', 22), ('blank', 25), ('calc', 28), ('outro', 30)]
chapter_of = {}
lo = 1
for name, hi in CH:
    for k in range(lo, hi + 1):
        chapter_of[k] = name
    lo = hi + 1
START, GAP, CGAP = 2.4, 0.28, 1.05
t = START
out = []
for i, s in enumerate(segs):
    n = i + 1
    if i:
        t += CGAP if chapter_of[n] != chapter_of[n - 1] else GAP
    a, b = s['src']
    out.append(dict(n=n, ch=chapter_of[n], at=round(t, 3), src=[a, b], dur=round(b - a, 3), text=s['text']))
    t += b - a
letters = lambda x: len(re.sub(r'[^ء-ي]', '', x))

def word_at(n, word, frac=0.0):
    """Time a word starts inside sentence n: letter-proportional, corrected by the pauses inside the clip."""
    s = out[n - 1]
    txt = s['text']
    k = txt.find(word)
    assert k >= 0, (n, word)
    a, b = s['src']
    inner = [(x, y) for x, y, _ in sil if x > a + 0.05 and y < b - 0.05]
    speech = (b - a) - sum(y - x for x, y in inner)
    f = (letters(txt[:k]) + frac * letters(word)) / max(1, letters(txt))
    target = f * speech
    acc, tt = 0.0, a
    for x, y in inner:
        if acc + (x - tt) >= target:
            break
        acc += x - tt
        tt = y
    return round(s['at'] + (tt - a) + (target - acc), 2)

W = {
    'water': word_at(9, 'جزيءُ ماء'),
    'cancel': word_at(9, 'فيُلغي'),
    'bond': word_at(9, 'يتّحدُ'),
    'free': word_at(10, 'حرّة'),
    'acidShow': word_at(10, 'ويظهرُ'),
    'protein11': word_at(11, 'بروتيناً'),
    'amino11': word_at(11, 'حمضاً'),
    'pour': word_at(12, 'نضعُ'),
    'drops': word_at(13, 'ثلاثَ'),
    'fillBur': word_at(13, 'ونملأُ'),
    'colorless': word_at(14, 'عديمَ'),
    'faint': word_at(14, 'ووردياً'),
    'deep': word_at(14, 'وأحمرَ'),
    'dropwise': word_at(16, 'قطرةً'),
    'appear': word_at(16, 'حتى'),
    'stop': word_at(16, 'فنتوقّف'),
    'acidCalc': word_at(17, 'نحسبُ'),
    'acidNum': word_at(17, 'صفر'),
    'formPour': word_at(18, 'اثنين'),
    'vanish': word_at(19, 'اختفى'),
    'whyFree': word_at(19, 'لأنَّ'),
    'noInd': word_at(20, 'دليلٍ'),
    't2drops': word_at(21, 'نُعايرُ'),
    't2back': word_at(21, 'يعودَ'),
    'water23': word_at(23, 'الماءَ'),
    'fn': word_at(25, 'رقمُ'),
    'fnTwo': word_at(25, 'اثنان'),
    'fnMinus': word_at(25, 'ناقص'),
    'fnRes': word_at(25, 'يساوي'),
    'cowMul': word_at(26, 'مضروباً'),
    'cowRes': word_at(26, 'نحو'),
    'buffMul': word_at(27, 'نضربُ'),
    'range': word_at(28, 'بين'),
    'credits': word_at(30, 'قسمُ'),
}
first = {c: next(o['at'] for o in out if o['ch'] == c) for c, _ in CH}
last = {c: max(o['at'] + o['dur'] for o in out if o['ch'] == c) for c, _ in CH}
dur = round(out[-1]['at'] + out[-1]['dur'] + 4.2, 2)
tl = dict(fps=30, duration=dur, sentences=out, words=W,
          ch={c: dict(start=round(first[c] - (0.0 if c == 'intro' else 0.55), 2), end=round(last[c] + 0.5, 2)) for c, _ in CH})
tl['ch']['intro']['start'] = 0.0
json.dump(tl, open('sims/formol3d/timeline.json', 'w'), ensure_ascii=False, indent=1)
print('duration', dur)
for c, _ in CH:
    print(f"{c:8s} {tl['ch'][c]['start']:7.2f} → {tl['ch'][c]['end']:7.2f}")
print(json.dumps(W))
