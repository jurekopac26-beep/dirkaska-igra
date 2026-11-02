# python3 near2.py <city> <radius> lat,lon lat,lon ...: for each point, the 6 nearest junctions (deg>=3) or nodes with street names
import sys, math
from tool import load, graph
d=load(sys.argv[1]); G=graph(d); rad=float(sys.argv[2])
for arg in sys.argv[3:]:
    lat,lon=map(float,arg.split(','))
    x,y=d['xy'](lat,lon)
    res=[]
    for n in G.nodes:
        nx_,ny_=G.nodes[n]['xy']; dd=math.dist((x,y),(nx_,ny_))
        if dd<=rad and len(G[n])>=3:
            names=sorted({(G[n][m]['name'] or '-')+':'+G[n][m]['cls'][:4] for m in G[n]})
            lo,la=d['inv'].transform(nx_,ny_)
            res.append((dd,la,lo,names))
    print(f'== {arg}')
    for dd,la,lo,names in sorted(res)[:7]:
        print(f'   {dd:5.1f} m  [{la:.6f},{lo:.6f}] {"; ".join(names)}')
