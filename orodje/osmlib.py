import os, sys, time, math, json, urllib.request, urllib.error
import xml.etree.ElementTree as ET
UA='dirkaska-igra-tracks/1.0 (track data for a racing game; one-off downloads)'
HERE=os.path.dirname(os.path.abspath(__file__))
def get(url,tries=4):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':UA}),timeout=180) as r: return r.read()
        except urllib.error.HTTPError as e:
            if e.code in (400,509) or k==tries-1: raise
        except Exception:
            if k==tries-1: raise
        time.sleep(2**(k+1))
def tile(la0,lo0,la1,lo1,depth=0):
    p=os.path.join(HERE,'osm','%.4f_%.4f_%.4f_%.4f.osm'%(la0,lo0,la1,lo1))
    if os.path.exists(p): return [p]
    try: d=get('https://api.openstreetmap.org/api/0.6/map?bbox=%.5f,%.5f,%.5f,%.5f'%(lo0,la0,lo1,la1))
    except urllib.error.HTTPError as e:
        if e.code==400 and depth<4:
            lm,om=(la0+la1)/2,(lo0+lo1)/2; out=[]
            for a,b,c,dd in ((la0,lo0,lm,om),(la0,om,lm,lo1),(lm,lo0,la1,om),(lm,om,la1,lo1)): out+=tile(a,b,c,dd,depth+1)
            return out
        raise
    open(p,'wb').write(d); return [p]
def load(la0,lo0,la1,lo1):
    nodes={}; ways={}; ntags={}
    for p in tile(la0,lo0,la1,lo1):
        for el in ET.parse(p).getroot():
            if el.tag=='node':
                i=int(el.get('id')); nodes[i]=(float(el.get('lat')),float(el.get('lon')))
                t={x.get('k'):x.get('v') for x in el if x.tag=='tag'}
                if t: ntags[i]=t
            elif el.tag=='way':
                ways[int(el.get('id'))]=([int(x.get('ref')) for x in el if x.tag=='nd'],{x.get('k'):x.get('v') for x in el if x.tag=='tag'})
    return nodes,ways,ntags
if __name__=='__main__':
    la0,lo0,la1,lo1=map(float,sys.argv[1:5]); n,w,nt=load(la0,lo0,la1,lo1)
    print(len(n),'nodes',len(w),'ways')
    for i,(nd,t) in w.items():
        if 'highway' in t:
            pts=[n[x] for x in nd if x in n]
            L=sum(math.hypot((a[0]-b[0])*111320,(a[1]-b[1])*111320*math.cos(math.radians(a[0]))) for a,b in zip(pts,pts[1:]))
            if len(sys.argv)>5 and t['highway'] not in sys.argv[5].split(','): continue
            print(i,t['highway'],t.get('name',''),t.get('ref',''),t.get('surface',''),'%dm'%L,'%.5f,%.5f -> %.5f,%.5f'%(pts[0]+pts[-1]) if pts else '')
    for i,t in nt.items():
        if any(k in t for k in ('name','tourism','natural','mountain_pass')): print('N',i,'%.5f,%.5f'%n[i],{k:v for k,v in t.items() if k in('name','name:en','tourism','natural','mountain_pass','place','ele')})
