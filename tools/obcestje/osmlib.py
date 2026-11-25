import json, re, math, sys
import xml.etree.ElementTree as ET
from math import radians as rad, sin, cos, sqrt
REPO='/home/user/dirkaska-igra'
OSMD='/tmp/claude-0/-home-user-dirkaska-igra/1475e5b2-0474-552c-9d37-da2549b752a3/scratchpad/osm/'
def load(tid):
    J=json.load(open(f'{REPO}/tools/{tid}/{tid}.json'))
    def find(d,k):
        if isinstance(d,dict):
            if k in d: return d[k]
            for v in d.values():
                r=find(v,k)
                if r is not None: return r
    LAT0=find(J,'lat0'); LON0=find(J,'lon0')
    A,F=6378137.0,1/298.257223563; E2=F*(2-F); S0=sin(rad(LAT0)); W0=1-E2*S0*S0
    MR,NR,C0=A*(1-E2)/W0**1.5,A/sqrt(W0),cos(rad(LAT0))
    xz=lambda lat,lon:(rad(lon-LON0)*NR*C0,-rad(lat-LAT0)*MR)
    src=open(f'{REPO}/js/tracks/{tid}.js').read()
    P=json.loads(re.search(r'points: (\[\[.*?\]\])',src).group(1))
    root=ET.parse(OSMD+tid+'.osm').getroot()
    N={n.get('id'):(float(n.get('lat')),float(n.get('lon')),{t.get('k'):t.get('v') for t in n.findall('tag')}) for n in root.findall('node')}
    W=[(w.get('id'),[nd.get('ref') for nd in w.findall('nd')],{t.get('k'):t.get('v') for t in w.findall('tag')}) for w in root.findall('way')]
    def d2lap(x,z):
        b=1e9
        for i in range(len(P)):
            a=P[i]; c=P[(i+1)%len(P)]
            dx,dz=c[0]-a[0],c[1]-a[1]; L=dx*dx+dz*dz or 1
            t=max(0,min(1,((x-a[0])*dx+(z-a[1])*dz)/L))
            d=math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)
            if d<b:b=d
        return b
    return dict(xz=xz,P=P,N=N,W=W,d2lap=d2lap)
