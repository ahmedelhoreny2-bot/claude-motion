import json,re
segs=json.load(open('vo/segments.json'))
sil=[tuple(map(float,l.split())) for l in open('vo/sil2.txt')]
L=[len(re.sub(r'[^ء-ي]','',s['text'])) for s in segs]
P=[len(re.findall(r'…|[.!:؛،,]',s['text'].rstrip()[:-1])) for s in segs]  # internal marks
total=158.35
speech=total-sum(e-s for s,e,_ in sil)
cands=[0.0]+[(s+e)/2 for s,e,_ in sil]+[total]
gap=[0]+[d for *_,d in sil]+[0]
N=len(segs); M=len(cands); INF=1e18
def best(rate,pz):
    exp=[L[i]/rate+P[i]*pz+0.3 for i in range(N)]
    dp=[[INF]*M for _ in range(N+1)]; bk=[[-1]*M for _ in range(N+1)]
    dp[0][0]=0
    for k in range(1,N+1):
        for j in range(1,M):
            if k==N and j!=M-1: continue
            for i in range(max(0,j-12),j):
                if dp[k-1][i]>=INF: continue
                d=cands[j]-cands[i]
                c=dp[k-1][i]+((d-exp[k-1])/exp[k-1])**2*4 - (gap[j]*3 if k<N else 0)
                if c<dp[k][j]: dp[k][j]=c; bk[k][j]=i
    j=M-1; path=[j]
    for k in range(N,0,-1): j=bk[k][j]; path.append(j)
    return dp[N][M-1], path[::-1]
res=min((best(r/10,pz/100)+(r/10,pz/100) for r in range(90,150,4) for pz in (15,25,35)), key=lambda x:x[0])
cost,path,rate,pz=res
print('rate',rate,'pause',pz,'cost',round(cost,2))
for k,s in enumerate(segs):
    a,b=cands[path[k]],cands[path[k+1]]
    s['src']=[round(a,3),round(b,3)]; s['dur']=round(b-a,2)
    print(s['n'],f"{a:6.2f}-{b:6.2f} dur {b-a:5.2f} gapEnd {gap[path[k+1]]:.2f} L/s {L[k]/(b-a):5.1f} win {s['win'][1]-s['win'][0]:4.1f}")
json.dump(segs,open('vo/segments.json','w'),ensure_ascii=False,indent=1)
