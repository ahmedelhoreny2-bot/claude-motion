import json, wave, struct
place = json.load(open('vo/placement.json'))
tl = json.load(open('formol.timeline.json'))
src = wave.open('vo/full.wav'); sr = src.getframerate()
data = struct.unpack('<%dh' % src.getnframes(), src.readframes(src.getnframes()))
n = int((tl['duration']) * sr)
out = [0.0] * n
F = int(0.012 * sr)
for p in place:
    a, b = int(p['src'][0] * sr), int(p['src'][1] * sr)
    seg = data[a:b]; L = len(seg); at = int(p['at'] * sr)
    for i, v in enumerate(seg):
        g = min(1.0, i / F, (L - 1 - i) / F)
        if 0 <= at + i < n: out[at + i] += v * g
w = wave.open('public/formol-vo.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
w.writeframes(struct.pack('<%dh' % n, *[max(-32768, min(32767, int(x))) for x in out])); w.close()
print('vo track', tl['duration'], 's')
