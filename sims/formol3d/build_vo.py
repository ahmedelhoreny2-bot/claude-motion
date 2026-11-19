"""Lays each recorded sentence at its time in sims/formol3d/timeline.json → public/formol3d-vo.wav."""
import json, wave, struct
tl = json.load(open('sims/formol3d/timeline.json'))
src = wave.open('vo/full.wav'); sr = src.getframerate()
data = struct.unpack('<%dh' % src.getnframes(), src.readframes(src.getnframes()))
n = int(tl['duration'] * sr)
out = [0.0] * n
F = int(0.012 * sr)
for s in tl['sentences']:
    a, b = int(s['src'][0] * sr), int(s['src'][1] * sr)
    seg = data[a:b]; L = len(seg); at = int(s['at'] * sr)
    for i, v in enumerate(seg):
        g = min(1.0, i / F, (L - 1 - i) / F)
        if 0 <= at + i < n:
            out[at + i] += v * g
w = wave.open('public/formol3d-vo.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
w.writeframes(struct.pack('<%dh' % n, *[max(-32768, min(32767, int(x))) for x in out])); w.close()
print('vo', tl['duration'], 's')
