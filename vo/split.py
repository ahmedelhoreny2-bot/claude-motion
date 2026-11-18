import re, json
rows=[l for l in open('examples/02-formol/narration-fusha.md') if re.match(r'^\| \d\d \|',l)]
segs=[]
for r in rows:
    c=[x.strip() for x in r.strip().strip('|').split('|')]
    def ts(s): m,x=s.split(':'); return int(m)*60+float(x)
    segs.append(dict(n=c[0],a=ts(c[1]),b=ts(c[2]),text=c[3]))
strip=lambda s: re.sub(r'[ً-ْـ…،.!:؛,\s]','',s)
w=[len(strip(s['text']))+6 for s in segs]   # +6 ≈ per-sentence pause weight
sil=[tuple(map(float,l.split())) for l in open('vo/silences.txt')]
total=158.35; start=0.0; end=total
cum=[sum(w[:k+1])/sum(w) for k in range(len(w))]
pred=[start+(end-start)*cum[k] for k in range(len(w)-1)]
mids=[(s+e)/2 for s,e,_ in sil]
K=len(pred); M=len(mids); INF=1e18
# DP: assign K boundaries to increasing silences
dp=[[INF]*M for _ in range(K)]; bk=[[-1]*M for _ in range(K)]
for j in range(M): dp[0][j]=(mids[j]-pred[0])**2 - 4*sil[j][2]
for k in range(1,K):
    best=INF; bi=-1
    for j in range(M):
        if j>0 and dp[k-1][j-1]<best: best=dp[k-1][j-1]; bi=j-1
        if bi>=0: dp[k][j]=best+(mids[j]-pred[k])**2 - 4*sil[j][2]; bk[k][j]=bi
j=min(range(M),key=lambda j:dp[K-1][j]); ch=[0]*K
for k in range(K-1,-1,-1): ch[k]=j; j=bk[k][j]
cuts=[0.0]+[mids[c] for c in ch]+[total]
out=[]
for i,s in enumerate(segs):
    a,b=cuts[i],cuts[i+1]
    out.append(dict(n=s['n'],src=[round(a,3),round(b,3)],dur=round(b-a,2),win=[s['a'],s['b']],pred=round(pred[i],1) if i<K else None,text=s['text']))
    print(s['n'], f"{a:6.2f}-{b:6.2f} dur {b-a:5.2f}  window {s['b']-s['a']:5.2f}  pred {pred[i] if i<K else 0:6.1f}")
json.dump(out,open('vo/segments.json','w'),ensure_ascii=False,indent=1)
