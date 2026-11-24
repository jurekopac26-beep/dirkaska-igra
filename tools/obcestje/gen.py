import sys, math, json; sys.path.insert(0,sys.argv[2])
from osmlib import load
tid=sys.argv[1]; D=load(tid); xz=D['xz']; N=D['N']; d2=D['d2lap']
r1=lambda v: round(v,1)
def rdp(P,e):
    if len(P)<3: return P
    a,b=P[0],P[-1]; dx,dz=b[0]-a[0],b[1]-a[1]; L=math.hypot(dx,dz) or 1
    i,dm=0,0
    for k in range(1,len(P)-1):
        d=abs((P[k][0]-a[0])*dz-(P[k][1]-a[1])*dx)/L
        if d>dm: i,dm=k,d
    return rdp(P[:i+1],e)[:-1]+rdp(P[i:],e) if dm>e else [a,b]
def rdpc(P,e):
    if len(P)>3 and math.dist(P[0],P[-1])<0.01:
        m=len(P)//2; return rdp(P[:m+1],e)[:-1]+rdp(P[m:],e)
    return rdp(P,e)
def pts(nds): return [xz(*N[r][:2]) for r in nds if r in N]
def flat(P): return [v for p in P for v in (r1(p[0]),r1(p[1]))]
def obb(P):
    if P[0]==P[-1]: P=P[:-1]
    best=None
    for k in range(len(P)):
        a,b=P[k],P[(k+1)%len(P)]; ang=math.atan2(b[1]-a[1],b[0]-a[0]); c,s=math.cos(ang),math.sin(ang)
        U=[p[0]*c+p[1]*s for p in P]; V=[-p[0]*s+p[1]*c for p in P]
        A=(max(U)-min(U))*(max(V)-min(V))
        if best is None or A<best[0]:
            cu,cv=(max(U)+min(U))/2,(max(V)+min(V))/2
            best=(A,cu*c-cv*s,cu*s+cv*c,max(U)-min(U),max(V)-min(V),ang)
    return best[1:]
out={}
W=D['W']
if tid=='kagerod':
    for wid,nds,tg in W:
        if tg.get('barrier')=='fence': out['FENCE']=('w'+wid,flat(rdpc(pts(nds),0.3)))
    ways=[]
    for wid,nds,tg in W:
        h=tg.get('highway')
        if h not in('service','track') or tg.get('tunnel') or tg.get('area'): continue
        P=pts(nds)
        if min(d2(*p) for p in P)>130: continue
        kind=1 if tg.get('surface')=='asphalt' else 0
        ways.append(('w'+wid,[kind,1.75 if h=='service' else 1.3]+flat(rdp(P,0.25))))
    out['WAYS']=ways
    g=[]
    for nid,(la,lo,tg) in N.items():
        if tg.get('barrier')!='gate': continue
        for wid,nds,t2 in W:
            if nid in nds and t2.get('highway'):
                k=nds.index(nid); a=N[nds[max(0,k-1)]]; b=N[nds[min(len(nds)-1,k+1)]]
                (ax,az),(bx,bz)=xz(*a[:2]),xz(*b[:2]); x,z=xz(la,lo)
                g.append(('n'+nid,[r1(x),r1(z),round(math.degrees(math.atan2(bz-az,bx-ax)))])); break
    out['GATES']=g
if tid=='batangas':
    H=[]
    for wid,nds,tg in W:
        if 'building' not in tg: continue
        P=pts(nds); d=min(d2(*p) for p in P)
        if d<=60 or d>230: continue
        x,z,L,Wd,ang=obb(P)
        if L<Wd: L,Wd,ang=Wd,L,ang+math.pi/2
        H.append(('w'+wid,[r1(x),r1(z),r1(L),r1(Wd),round(math.degrees(ang))%180, round(d)]))
    out['HOUSES']=H
    for wid,nds,tg in W:
        lu=tg.get('landuse')
        if lu in('orchard','farmyard'): out[lu]=('w'+wid,flat(rdpc(pts(nds),0.5)), round(min(d2(*p) for p in pts(nds))))
    for wid,nds,tg in W:
        if tg.get('amenity')=='school' or tg.get('leisure')=='resort': out[tg.get('amenity') or 'resort']=('w'+wid,round(min(d2(*p) for p in pts(nds))),len(nds))
    for nid,(la,lo,tg) in N.items():
        if tg.get('barrier')=='gate': x,z=xz(la,lo); out['gate']=('n'+nid,r1(x),r1(z),round(d2(x,z)))
if tid=='riohondo':
    for wid,nds,tg in W:
        if tg.get('highway')=='residential':
            P=pts(nds)
            if min(d2(*p) for p in P)<140: out.setdefault('STREETS',[]).append(('w'+wid,flat(rdp(P,0.25))))
    for nid,(la,lo,tg) in N.items():
        if tg.get('man_made') in('mast','tower'): x,z=xz(la,lo); out[tg['man_made']]=('n'+nid,r1(x),r1(z))
json.dump(out,open(f'../{tid}.data.json','w'))
for k,v in out.items(): print(k, (len(v) if isinstance(v,list) else v if len(str(v))<200 else str(v)[:200]))
