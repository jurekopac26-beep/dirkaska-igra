# Slike in meritve nove proge iz OpenStreetMap + Copernicus DEM GLO-30 + ESA WorldCover (brez Googla).
# python3 proga.py <id> [map] [profile] [view]     nastavitve: proge.json
import os, sys, json, math, heapq
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy import ndimage
from scipy.spatial import cKDTree
import osmlib
os.environ.setdefault('GDAL_DISABLE_READDIR_ON_OPEN','EMPTY_DIR'); os.environ.setdefault('CURL_CA_BUNDLE','/root/.ccr/ca-bundle.crt')
os.environ.setdefault('GDAL_HTTP_MAX_RETRY','4'); os.environ.setdefault('GDAL_HTTP_RETRY_DELAY','2')
import rasterio
from rasterio.windows import from_bounds
HERE=os.path.dirname(os.path.abspath(__file__)); STEP=5.0
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf'
def font(sz,bold=False): return ImageFont.truetype(FONT%('-Bold' if bold else ''),sz)
DRIVE={'motorway','trunk','primary','secondary','tertiary','unclassified','residential','service','track','raceway','road','living_street','trunk_link','primary_link','secondary_link','tertiary_link'}

# ---------- rastri ----------
def read_cog(url,lo0,la0,lo1,la1):
    try:
        with rasterio.open('/vsicurl/'+url) as ds:
            w=from_bounds(lo0,la0,lo1,la1,ds.transform).round_offsets().round_lengths()
            a=ds.read(1,window=w,boundless=True,fill_value=0); t=ds.window_transform(w)
            return a,(t.c,t.f,t.a,t.e)   # lon0, lat0(top), dlon, dlat(neg)
    except Exception as e:
        if '404' in str(e) or 'does not exist' in str(e) or 'not recognized' in str(e): return None,None
        raise
def raster(kind,cid,la0,lo0,la1,lo1):
    p=os.path.join(HERE,'dem','%s-%s.npz'%(cid,kind))
    if os.path.exists(p):
        d=np.load(p); return d['a'],tuple(d['t'])
    out=None
    if kind=='dem':
        res=1/3600; n=lambda v,ns: '%s%0*d'%(ns[0] if v>=0 else ns[1],2 if ns=='NS' else 3,abs(v))
        W=int(round((lo1-lo0)/res)); Hh=int(round((la1-la0)/res)); out=np.zeros((Hh,W),np.float32); T=(lo0,la1,res,-res)
        for la in range(math.floor(la0),math.floor(la1)+1):
            for lo in range(math.floor(lo0),math.floor(lo1)+1):
                nm='Copernicus_DSM_COG_10_%s_00_%s_00_DEM'%(n(la,'NS'),n(lo,'EW'))
                a,t=read_cog('https://copernicus-dem-30m.s3.amazonaws.com/%s/%s.tif'%(nm,nm),max(lo0,lo),max(la0,la),min(lo1,lo+1),min(la1,la+1))
                if a is None: continue
                if abs(t[2]-res)>1e-9:   # (višje širine: širše celice) na skupno mrežo
                    a=ndimage.zoom(a,(1,t[2]/res),order=1)
                c0=int(round((t[0]-lo0)/res)); r0=int(round((la1-t[1])/res)); T=(t[0]-c0*res,t[1]+r0*res,res,-res)
                if r0<0: a=a[-r0:]; r0=0
                if c0<0: a=a[:,-c0:]; c0=0
                hh=min(a.shape[0],Hh-r0); ww=min(a.shape[1],W-c0); out[r0:r0+hh,c0:c0+ww]=a[:hh,:ww]
    else:
        f=lambda v: math.floor(v/3)*3; la,lo=f((la0+la1)/2),f((lo0+lo1)/2)
        nm='%s%02d%s%03d'%('N' if la>=0 else 'S',abs(la),'E' if lo>=0 else 'W',abs(lo))
        out,T=read_cog('https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_%s_Map.tif'%nm,lo0,la0,lo1,la1)
    np.savez_compressed(p,a=out,t=np.array(T)); return out,T

class Geo:
    def __init__(s,la,lo): s.la,s.lo=la,lo; s.kx=111320*math.cos(math.radians(la)); s.ky=110540
    def xy(s,la,lo): return (np.asarray(lo)-s.lo)*s.kx,(np.asarray(la)-s.la)*s.ky
    def ll(s,x,y): return s.la+np.asarray(y)/s.ky,s.lo+np.asarray(x)/s.kx
class Grid:
    def __init__(s,a,t,geo): s.a,s.t,s.geo=a,t,geo
    def at(s,x,y,order=1):
        la,lo=s.geo.ll(x,y); c=(lo-s.t[0])/s.t[2]-0.5; r=(la-s.t[1])/s.t[3]-0.5
        return ndimage.map_coordinates(s.a,[np.ravel(r),np.ravel(c)],order=order,mode='nearest').reshape(np.shape(x))

# ---------- pot ----------
def route(cfg):
    la0,lo0,la1,lo1=cfg['box']; nodes,ways,ntags=osmlib.load(la0,lo0,la1,lo1)
    allow=set(cfg.get('hw',DRIVE)); only=set(cfg.get('ways',[])); adj={}; used={}
    for wid,(nd,t) in ways.items():
        if t.get('highway') not in allow or (only and wid not in only): continue
        nd=[n for n in nd if n in nodes]
        for a,b in zip(nd,nd[1:]):
            (ya,xa),(yb,xb)=nodes[a],nodes[b]; d=math.hypot((ya-yb)*110540,(xa-xb)*111320*math.cos(math.radians(ya)))
            adj.setdefault(a,[]).append((b,d,wid)); adj.setdefault(b,[]).append((a,d,wid))
    ids=list(adj); P=np.array([nodes[i] for i in ids]); k=math.cos(math.radians(P[0,0]))
    snap=lambda p: ids[int(np.argmin((P[:,0]-p[0])**2+((P[:,1]-p[1])*k)**2))]
    wp=[snap(p) for p in cfg['pts']]; path=[wp[0]]; pw=[]
    for a,b in zip(wp,wp[1:]):
        dist={a:0}; prev={}; q=[(0,a)]
        while q:
            d,u=heapq.heappop(q)
            if u==b: break
            if d>dist[u]: continue
            for v,w,wid in adj[u]:
                if d+w<dist.get(v,1e18): dist[v]=d+w; prev[v]=(u,wid); heapq.heappush(q,(d+w,v))
        seg=[]; u=b
        while u!=a: seg.append((u,prev[u][1])); u=prev[u][0]
        for n,wid in reversed(seg): path.append(n); pw.append(wid)
    return [nodes[n] for n in path],pw,nodes,ways,ntags

def resample(x,y,step,closed=False):
    if closed: x=np.r_[x,x[0]]; y=np.r_[y,y[0]]
    d=np.r_[0,np.cumsum(np.hypot(np.diff(x),np.diff(y)))]; n=int(d[-1]//step); s=np.arange(n+(0 if closed else 1))*(d[-1]/n if closed else step)
    return np.interp(s,d,x),np.interp(s,d,y)
def smooth(v,sig,closed):
    if closed: return ndimage.gaussian_filter1d(v,sig,mode='wrap')
    w=ndimage.gaussian_filter1d(v,sig,mode='nearest'); return w
def metrics(x,y,closed):
    dx,dy=(np.roll(x,-1)-x,np.roll(y,-1)-y) if closed else (np.diff(x),np.diff(y))
    hd=np.unwrap(np.arctan2(dy,dx)); n=len(hd); L=n*STEP; dh=np.diff(hd)
    twist=np.degrees(np.abs(dh).sum())/(L/1000); win=6
    st=np.abs(hd[win:]-hd[:-win])<win*STEP/250; best=cur=0
    for b in st:
        cur=cur+1 if b else 0; best=max(best,cur)
    k=ndimage.gaussian_filter1d(dh/STEP,3); corners=hair=0; i=0
    while i<len(k):
        if abs(k[i])>1/250:
            j=i
            while j<len(k) and abs(k[j])>1/250 and k[j]*k[i]>0: j+=1
            turn=abs(np.degrees(hd[min(j,n-1)]-hd[i]))
            if turn>25: corners+=1
            if turn>130 and np.abs(k[i:j]).max()>1/90: hair+=1
            i=j
        else: i+=1
    return dict(len=L,twist=twist,straight=float(st.mean()),longest=best*STEP,corners=corners,hairpins=hair)

def build(cid):
    cfg=json.load(open(os.path.join(HERE,'proge.json')))[cid]; cfg['id']=cid; closed=cfg.get('closed',False)
    ll,pw,nodes,ways,ntags=route(cfg); geo=Geo(*ll[0]); x,y=geo.xy([p[0] for p in ll],[p[1] for p in ll])
    x,y=resample(x,y,1.0,closed); sg=cfg.get('gauss',6); x,y=smooth(x,sg,closed),smooth(y,sg,closed)
    if 'trim' in cfg: a,b=cfg['trim']; b=len(x)+b if b<=0 else b; x,y=x[int(a):int(b)],y[int(a):int(b)]
    if cfg.get('reverse'): x,y=x[::-1],y[::-1]
    x,y=resample(x,y,STEP,closed); la,lo=geo.ll(x,y); geo=Geo(la[0],lo[0]); x,y=geo.xy(la,lo)
    m=cfg.get('far',0.16); cla,clo=la.mean(),lo.mean()
    dem=Grid(*raster('dem',cid,cla-m,clo-m/math.cos(math.radians(cla)),cla+m,clo+m/math.cos(math.radians(cla))),geo)
    wc=Grid(*raster('wc',cid,cla-0.04,clo-0.04,cla+0.04,clo+0.04),geo)
    h=dem.at(x,y,3); h=ndimage.median_filter(h,9,mode='wrap' if closed else 'nearest'); h=smooth(h,cfg.get('hs',10),closed)
    M=metrics(x,y,closed); s=np.arange(len(x))*STEP
    up=float(np.clip(np.diff(h),0,None).sum()); dn=float(np.clip(-np.diff(h),0,None).sum())
    M.update(h0=float(h[0]),h1=float(h[-1]),hmin=float(h.min()),hmax=float(h.max()),up=up,dn=dn,grade=(h[-1]-h[0])/M['len']*100,gmax=float(np.abs(np.diff(ndimage.gaussian_filter1d(h,4))).max()/STEP*100))
    return dict(cfg=cfg,geo=geo,x=x,y=y,h=h,s=s,M=M,dem=dem,wc=wc,nodes=nodes,ways=ways,ntags=ntags,pw=set(pw),closed=closed)

# ---------- OSM predmeti v metrih ----------
def feats(T):
    if 'F' in T: return T['F']
    g=T['geo']; F=dict(bld=[],water=[],stream=[],road=[],barrier=[],cliff=[],wood=[],view=[],bridge=[],tunnel=[],farm=[])
    for wid,(nd,t) in T['ways'].items():
        nd=[n for n in nd if n in T['nodes']]
        if len(nd)<2: continue
        px,py=g.xy([T['nodes'][n][0] for n in nd],[T['nodes'][n][1] for n in nd]); P=np.c_[px,py]
        if 'building' in t: F['bld'].append(P)
        elif t.get('natural')=='water' or t.get('waterway')=='riverbank' or t.get('landuse')=='reservoir': F['water'].append(P)
        elif t.get('waterway') in('river','stream','canal'): F['stream'].append(P)
        elif t.get('natural')=='coastline': F['water'].append(P) if False else F.setdefault('coast',[]).append(P)
        elif 'highway' in t:
            if wid in T['pw']:
                if t.get('bridge') not in(None,'no'): F['bridge'].append(P)
                if t.get('tunnel') not in(None,'no'): F['tunnel'].append(P)
            elif t['highway'] not in('proposed','construction'): F['road'].append((P,t['highway']))
        elif t.get('barrier') in('guard_rail','wall','retaining_wall','fence','city_wall','jersey_barrier','kerb') : F['barrier'].append(P)
        elif t.get('natural') in('cliff','rock','bare_rock'): F['cliff'].append(P)
        elif t.get('natural') in('wood','scrub') or t.get('landuse')=='forest': F['wood'].append(P)
        elif t.get('landuse') in('farmland','orchard','vineyard','meadow','plantation'): F['farm'].append(P)
    for i,t in T['ntags'].items():
        if t.get('tourism')=='viewpoint': F['view'].append(np.array([g.xy(*T['nodes'][i])]).reshape(1,2))
    F.setdefault('coast',[]); T['F']=F; return F
def dens(P,step=2.0):
    d=np.r_[0,np.cumsum(np.hypot(*np.diff(P,axis=0).T))]
    if d[-1]<step: return P
    s=np.arange(0,d[-1],step); return np.c_[np.interp(s,d,P[:,0]),np.interp(s,d,P[:,1])]

def check(T):
    F=feats(T); x,y=T['x'],T['y']; n=len(x); tree=cKDTree(np.c_[x,y]); hw=T['cfg'].get('hw2',3.5)
    def cover(polys,r,closedpoly=False):
        hit=np.zeros(n,bool); cnt=0
        for P in polys:
            Q=dens(np.vstack([P,P[:1]]) if closedpoly else P); d,i=tree.query(Q)
            if d.min()<=r: cnt+=1
            for j in np.unique(i[d<=r]): hit[max(0,j-1):j+2]=True
        return hit,cnt
    R={}
    for k,cp in(('bld',1),('water',1),('stream',0),('coast',0),('cliff',0),('barrier',0),('view',0),('farm',1),('wood',1)):
        hit,cnt=cover(F[k],60,cp); R[k]=(float(hit.mean()),cnt)
    rd=[P for P,c in F['road'] if c not in('path','footway','steps')]; R['road']=(0,cover(rd,25)[1])
    # raba tal v pasu 60 m (WorldCover)
    nx,ny=np.gradient(x),np.gradient(y); l=np.hypot(nx,ny); nx,ny=-ny/l,nx/l; cl=[]
    for o in(-55,-40,-25,-12,12,25,40,55): cl.append(T['wc'].at(x+nx*o,y+ny*o,0))
    cl=np.array(cl); R['lc']={c:float((cl==c).mean()) for c in(10,20,30,40,50,60,80,90,95)}
    # voda/morje do 60 m (WorldCover 80) in razgled: padec terena v 300 m
    R['wcwater']=float((cl==80).any(0).mean())
    # izletna cona: pregrada do 3 m od roba asfalta
    z=np.zeros(n,bool)
    for k,cp in(('bld',1),('barrier',0),('cliff',0)): z|=cover(F[k],hw+3,cp)[0]
    bt=np.zeros(n,bool)
    for k in('bridge','tunnel'): bt|=cover(F[k],2)[0]
    R['zone']=float((z|bt).mean()); R['bridges']=len(F['bridge']); R['tunnels']=len(F['tunnel']); R['bt']=float(bt.mean())
    # strmina ob cesti iz DEM (30 m; samo namig): padec ali stena > 60 % v 20 m od roba
    hl=T['dem'].at(x+nx*(hw+20),y+ny*(hw+20),3)-T['h']; hr=T['dem'].at(x-nx*(hw+20),y-ny*(hw+20),3)-T['h']
    R['drop']=float(((hl<-12)|(hr<-12)).mean()); R['wall']=float(((hl>12)|(hr>12)).mean())
    # razgled: najnižja točka v 1,5 km pod cesto
    return R

# ---------- zemljevid ----------
LC={10:(86,125,70),20:(150,160,100),30:(176,190,120),40:(214,200,130),50:(190,170,165),60:(205,190,165),70:(240,240,240),80:(105,160,205),90:(120,170,160),95:(90,140,110),100:(200,200,170),0:(105,160,205)}
def lc_rgb(c):
    out=np.zeros(c.shape+(3,),np.float32)
    for k,v in LC.items(): out[c==k]=v
    return out
def draw_map(T,out):
    cfg,M=T['cfg'],T['M']; W,Hh=1600,1000; x,y=T['x'],T['y']
    cx,cy=(x.min()+x.max())/2,(y.min()+y.max())/2; span=max((x.max()-x.min())*1.35+500,(y.max()-y.min())*1.35*W/Hh+500*W/Hh,cfg.get('span',0)); sc=W/span
    X=cx+(np.arange(W)-W/2)/sc; Y=cy-(np.arange(Hh)-Hh/2)/sc; XX,YY=np.meshgrid(X,Y)
    Z=T['dem'].at(XX,YY,3); Z=ndimage.gaussian_filter(Z,12*sc/1.0*0.5 if sc>0.5 else 2)
    gy,gx=np.gradient(Z,1/sc); gy=-gy; az,alt=math.radians(315),math.radians(45); zf=cfg.get('zf',1.6)
    slope=np.arctan(zf*np.hypot(gx,gy)); asp=np.arctan2(-gx,-gy)   # smer navzdol
    lx,ly,lz=math.sin(az)*math.cos(alt),math.cos(az)*math.cos(alt),math.sin(alt)
    nxv,nyv,nzv=-zf*gx,-zf*gy,np.ones_like(Z); nl=np.sqrt(nxv**2+nyv**2+1); sh=np.clip((nxv*lx+nyv*ly+lz)/nl,0,1)
    c=T['wc'].at(XX,YY,0).astype(int); base=lc_rgb(c); base=ndimage.gaussian_filter(base,(2,2,0))
    sea=(c==80)|(c==0)
    img=base*(0.45+0.8*sh[...,None]); img[sea]=np.array([118,168,210])
    im=Image.fromarray(np.clip(img,0,255).astype(np.uint8)).convert('RGBA'); S=3
    ov=Image.new('RGBA',(W*S,Hh*S),(0,0,0,0)); d=ImageDraw.Draw(ov)
    px=lambda P:[((p[0]-cx)*sc*S+W*S/2,(cy-p[1])*sc*S+Hh*S/2) for p in P]
    F=feats(T)
    # plastnice
    step=cfg.get('cont',20 if (Z.max()-Z.min())<700 else 50)
    for P in F['water']:
        if len(P)>2: d.polygon(px(P),fill=(118,168,210,255),outline=(70,120,170,255))
    for P in F['stream']: d.line(px(P),fill=(70,130,190,255),width=2*S)
    for P,cl in F['road']:
        w=(3 if cl in('trunk','primary','secondary','motorway') else 2 if cl not in('path','footway','track','steps') else 1)
        d.line(px(P),fill=(255,255,255,235) if w>1 else (250,245,225,200),width=w*S,joint='curve')
    for P in F['bld']:
        if len(P)>2: d.polygon(px(P),fill=(95,80,75,255))
    for P in F['view']:
        (a,b),=px(P); d.regular_polygon((a,b,7*S),3,fill=(255,200,0,255),outline=(60,40,0,255))
    R=px(np.c_[x,y]); 
    if T['closed']: R=R+R[:1]
    d.line(R,fill=(255,255,255,255),width=9*S,joint='curve'); d.line(R,fill=(225,30,30,255),width=5*S,joint='curve')
    f=font(15*S,True)
    for km in np.arange(0.5,M['len']/1000,0.5):
        i=int(km*1000/STEP)
        if i<len(R)-1: a,b=R[i]; d.ellipse((a-4*S,b-4*S,a+4*S,b+4*S),fill=(255,255,255,255),outline=(120,0,0,255)); d.text((a+7*S,b-9*S),('%.1f'%km).replace('.',','),font=font(12*S,True),fill=(255,255,255,255),stroke_width=2*S,stroke_fill=(60,0,0,255))
    def tag(i,txt,col):
        a,b=R[i]; d.ellipse((a-9*S,b-9*S,a+9*S,b+9*S),fill=col,outline=(255,255,255,255),width=2*S)
        d.text((a+13*S,b-22*S),txt,font=f,fill=(255,255,255,255),stroke_width=3*S,stroke_fill=(20,20,20,255))
    if T['closed']: tag(0,'ŠTART / CILJ',(30,160,60,255))
    else: tag(0,'ŠTART',(30,160,60,255)); tag(len(x)-1,'CILJ',(20,20,20,255))
    for nm,la,lo in cfg.get('labels',[]):
        a,b=px([T['geo'].xy(la,lo)])[0]; d.text((a,b),nm,font=font(13*S),fill=(255,255,255,255),stroke_width=2*S,stroke_fill=(40,40,40,255),anchor='mm')
    im.alpha_composite(ov.resize((W,Hh),Image.LANCZOS)); d=ImageDraw.Draw(im)
    # plastnice (tanko)
    lv=np.floor(Z/step); edge=(lv!=np.roll(lv,1,0))|(lv!=np.roll(lv,1,1)); a=np.array(im); a[edge&~sea,:3]=(a[edge&~sea,:3]*0.82).astype(np.uint8); im=Image.fromarray(a); d=ImageDraw.Draw(im,'RGBA')
    # naslov
    kind=cfg['kind']; t1=cfg['name']; climb='%+d m'%round(M['h1']-M['h0']) if not T['closed'] else 'višinska razlika %d m'%round(M['hmax']-M['hmin'])
    t2='%s · %s km · %s (%d → %d m n. m.)'%(kind,('%.2f'%(M['len']/1000)).replace('.',','),climb,round(M['h0']),round(M['h1'])) if not T['closed'] else '%s · %s km · %s · %d ovinkov'%(kind,('%.2f'%(M['len']/1000)).replace('.',','),climb,M['corners'])
    d.rectangle((0,0,W,74),fill=(15,20,28,205)); d.text((20,8),t1,font=font(30,True),fill=(255,255,255)); d.text((20,46),t2,font=font(19),fill=(225,230,235))
    # sever
    d.polygon([(W-50,95),(W-64,140),(W-50,130),(W-36,140)],fill=(255,255,255,255),outline=(20,20,20,255)); d.text((W-50,152),'S',font=font(20,True),fill=(255,255,255),anchor='mm',stroke_width=2,stroke_fill=(20,20,20))
    # merilo
    tgt=span*0.2; bar=[b for b in(50,100,200,250,500,1000,2000,5000) if b<=tgt][-1]; bw=bar*sc; x0,y0=30,Hh-40
    d.rectangle((x0-10,y0-30,x0+bw+10,y0+16),fill=(15,20,28,190)); d.rectangle((x0,y0,x0+bw/2,y0+8),fill=(255,255,255)); d.rectangle((x0+bw/2,y0,x0+bw,y0+8),fill=(30,30,30),outline=(255,255,255))
    d.text((x0,y0-25),'0',font=font(15),fill=(255,255,255)); d.text((x0+bw,y0-25),'%d m'%bar if bar<1000 else '%d km'%(bar/1000),font=font(15),fill=(255,255,255),anchor='ra')
    cr='© OpenStreetMap (ODbL) · Copernicus DEM GLO-30 · ESA WorldCover 2021 (CC BY 4.0) · plastnice %d m'%step
    tw=d.textlength(cr,font=font(13)); d.rectangle((W-tw-16,Hh-24,W,Hh),fill=(15,20,28,190)); d.text((W-tw-8,Hh-21),cr,font=font(13),fill=(230,230,230))
    save(im.convert('RGB'),out)

def save(im,out,limit=300):
    for q in(88,84,80,75,70,64,58):
        im.save(out,quality=q,optimize=True,subsampling=1 if q>75 else 2)
        if os.path.getsize(out)<=limit*1024: break

# ---------- profil ----------
def draw_profile(T,out):
    import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
    M=T['M']; s,h=T['s']/1000,T['h']; fig,ax=plt.subplots(figsize=(16,5),dpi=100)
    g=np.gradient(ndimage.gaussian_filter1d(h,4),STEP)*100; lo=min(h.min()-max(8,(h.max()-h.min())*0.25),h.min()-8)
    ax.fill_between(s,h,lo,color='#c9d6c0'); 
    from matplotlib.collections import LineCollection
    pts=np.c_[s,h].reshape(-1,1,2); lc=LineCollection(np.concatenate([pts[:-1],pts[1:]],1),cmap='RdYlGn_r',norm=plt.Normalize(-10,10),linewidth=4); lc.set_array(g[:-1]); ax.add_collection(lc)
    cb=fig.colorbar(lc,ax=ax,pad=0.01,fraction=0.025); cb.set_label('naklon (%)')
    ax.set_xlim(0,s[-1]); ax.set_ylim(lo,h.max()+max(6,(h.max()-h.min())*0.2)); ax.grid(alpha=.35)
    ax.set_xlabel('razdalja od štarta (km)',fontsize=13); ax.set_ylabel('višina ceste (m n. m.)',fontsize=13)
    ax.annotate('ŠTART %d m'%round(h[0]),(s[0],h[0]),xytext=(8,12),textcoords='offset points',fontsize=12,fontweight='bold')
    ax.annotate(('CILJ %d m'%round(h[-1])) if not T['closed'] else '',(s[-1],h[-1]),xytext=(-8,12),textcoords='offset points',fontsize=12,fontweight='bold',ha='right')
    i=int(np.argmax(h)); 
    if 0.05<i/len(h)<0.95: ax.annotate('najvišje %d m'%round(h[i]),(s[i],h[i]),xytext=(0,10),textcoords='offset points',fontsize=11,ha='center')
    fm=lambda v,k=1:('%.*f'%(k,v)).replace('.',',')
    t='%s: višinski profil · %s km · vzpon %d m, spust %d m · povprečno %s %% · največ %s %%'%(T['cfg']['name'],fm(M['len']/1000,2),round(M['up']),round(M['dn']),fm(M['grade']),fm(M['gmax']))
    ax.set_title(t,fontsize=15,fontweight='bold',loc='left'); fig.text(0.995,0.012,'Copernicus DEM GLO-30 (površinski model, zglajeno) · pot © OpenStreetMap (ODbL)',ha='right',fontsize=9,color='#555')
    fig.tight_layout(); p=out[:-4]+'.png'; fig.savefig(p); plt.close(fig)
    Image.open(p).convert('RGB').save(out,quality=88,optimize=True); os.remove(p)

# ---------- pogled za avtom (izris terena) ----------
def draw_view(T,out):
    cfg=T['cfg']; x,y,h=T['x'],T['y'],T['h']; n=len(x); W,Hh,SS=1600,900,1.5; w,hh=int(W*SS),int(Hh*SS)
    rng=np.random.default_rng(7); NZ=ndimage.gaussian_filter(rng.random((512,512)),1.2,mode='wrap'); NZ=(NZ-NZ.min())/(NZ.max()-NZ.min())
    NZ2=rng.random((512,512))
    def noise(a,b,sc,tex=NZ2):
        sh_=np.shape(a); return ndimage.map_coordinates(tex,[np.ravel(b)/sc%512,np.ravel(a)/sc%512],order=1,mode='grid-wrap').reshape(sh_)
    def fbm(a,b,sc): return np.clip((noise(a,b,sc)*0.6+noise(a+311,b+97,sc/2.1)*0.28+noise(a+71,b+513,sc/4.3)*0.12-0.2)/0.6,0,1)
    i=int(cfg.get('cam',0.3*n*STEP)/STEP); i=min(max(i,4),n-12); j=min(i+6,n-1)
    dirx,diry=x[j]-x[i-2],y[j]-y[i-2]; l=math.hypot(dirx,diry); dirx,diry=dirx/l,diry/l; yaw=math.radians(cfg.get('yaw',0))
    dirx,diry=dirx*math.cos(yaw)-diry*math.sin(yaw),dirx*math.sin(yaw)+diry*math.cos(yaw)
    back=cfg.get('back',7.5); camx,camy=x[i]-dirx*back,y[i]-diry*back; camh=h[i]+cfg.get('camh',2.7)
    fov=math.radians(cfg.get('fov',64)); foc=(w/2)/math.tan(fov/2); horizon=hh*cfg.get('hor',0.40)
    # koraki globine
    z=[1.2]
    while z[-1]<cfg.get('zmax',26000): z.append(z[-1]*1.0032+0.04)
    z=np.array(z); tx=(np.arange(w)-w/2+0.5)/foc
    PX=camx+dirx*z[:,None]+(-diry)*(-1)*0+ (diry*tx[None,:])*z[:,None]; PY=camy+diry*z[:,None]-(dirx*tx[None,:])*z[:,None]
    Hd=T['dem'].at(PX,PY,1); near=z<3000; Hd[near]=T['dem'].at(PX[near],PY[near],3)
    # normale za senčenje
    e=15.0; gx=(T['dem'].at(PX+e,PY,1)-T['dem'].at(PX-e,PY,1))/(2*e); gy=(T['dem'].at(PX,PY+e,1)-T['dem'].at(PX,PY-e,1))/(2*e)
    sun=np.array(cfg.get('sun',[-0.45,0.35,0.82])); sun=sun/np.linalg.norm(sun); nl=np.sqrt(gx**2+gy**2+1); sh=np.clip((-gx*sun[0]-gy*sun[1]+sun[2])/nl,0,1)
    c=np.full(PX.shape,-1,int); nw=z<9000; c[nw]=T['wc'].at(PX[nw],PY[nw],0)
    la,lo=T['geo'].ll(PX,PY); t=T['wc'].t; inside=(lo>t[0]+2*t[2])&(lo<t[0]+(T['wc'].a.shape[1]-2)*t[2])&(la<t[1]+2*t[3])&(la>t[1]+(T['wc'].a.shape[0]-2)*t[3]); c[~inside]=-1
    slope=np.hypot(gx,gy)
    col=lc_rgb(np.where(c<0,30,c)); far=c<0
    # daleč: barva po višini in strmini
    hz=np.clip((Hd-cfg.get('treeline',9e9))/400,0,1)[...,None]
    veg=np.array(cfg.get('farcol',[92,128,78]),np.float32); col[far]=veg
    sea=((c==80)|(c==0)|((c<0)&(Hd<=0.5)))&(Hd<cfg.get('seah',3)); 
    if cfg.get('lake') is not None: sea|=(c==80)
    rock=(slope>cfg.get('rock',0.75))&~sea; col[rock]=col[rock]*0.35+np.array([150,140,128])*0.65
    col*= (0.86+0.28*fbm(PX,PY,9)[...,None])*(0.9+0.2*noise(PX,PY,90)[...,None])
    # gozd: krošnje
    treeF=ndimage.map_coordinates((T['wc'].a==10).astype(np.float32),[((la-t[1])/t[3]-0.5).ravel(),((lo-t[0])/t[2]-0.5).ravel()],order=1,mode='nearest').reshape(PX.shape)
    shrubF=ndimage.map_coordinates(np.isin(T['wc'].a,(20,)).astype(np.float32),[((la-t[1])/t[3]-0.5).ravel(),((lo-t[0])/t[2]-0.5).ravel()],order=1,mode='nearest').reshape(PX.shape)
    # cesta
    rt=cKDTree(np.c_[dens(np.c_[x,y],0.5)]); rs=dens(np.c_[x,y],0.5); rh=np.interp(np.arange(len(rs))*0.5,T['s'],h)
    nr=z<2500; dR=np.full(PX.shape,1e9); iR=np.zeros(PX.shape,int)
    dd,ii=rt.query(np.c_[PX[nr].ravel(),PY[nr].ravel()],distance_upper_bound=40,workers=-1); ii=np.minimum(ii,len(rs)-1); dR[nr]=dd.reshape(-1,w); iR[nr]=ii.reshape(-1,w)
    hw=cfg.get('hw2',3.5); bl=np.clip((dR-hw-1.5)/14,0,1); bl=bl*bl*(3-2*bl); Hg=rh[iR]*(1-bl)+Hd*bl; Hg=np.where(dR<1e8,Hg,Hd)
    # druge ceste
    F=feats(T); orp=[dens(P,1.0) for P,cl in F['road'] if cl not in('path','footway','steps')]
    if orp:
        ot=cKDTree(np.vstack(orp)); d2=np.full(PX.shape,1e9); d2[nr]=ot.query(np.c_[PX[nr].ravel(),PY[nr].ravel()],distance_upper_bound=6,workers=-1)[0].reshape(-1,w)
    else: d2=np.full(PX.shape,1e9)
    tree_h=np.zeros(PX.shape,np.float32); th=cfg.get('trees',11)
    tn=noise(PX,PY,cfg.get('treesc',6.5)); tn2=noise(PX+900,PY+300,2.2); vg=hw+cfg.get('verge',7); dens_=cfg.get('treedens',0.36)
    ramp=np.clip((dR-vg)/cfg.get('ramp',30),0,1)*0.6+0.4; ramp=np.where(dR>1e8,1,ramp)
    tmask=(treeF>0.5)&(tn>dens_)&(dR>vg)&(d2>5)&~sea
    tree_h[tmask]=th*ramp[tmask]*np.sin(np.clip((tn[tmask]-dens_)/(0.9-dens_),0,1)*math.pi/2)**0.6*(0.85+0.3*tn2[tmask])*np.clip((treeF[tmask]-0.5)*4,0.3,1)
    smask=(shrubF>0.5)&(tn>0.5)&(dR>hw+3)&~sea&~tmask; tree_h[smask]=2.5*np.clip((tn[smask]-0.5)*4,0,1)
    tcol=np.array(cfg.get('treecol',[52,92,48]),np.float32)
    col[tmask]=tcol*(0.55+0.75*np.clip((tn[tmask]-dens_)/(0.9-dens_),0,1)*(0.7+0.6*tn2[tmask]))[...,None]; col[smask]=np.array([98,120,70])*(0.7+0.5*tn2[smask][...,None])
    # stavbe (raster 1 m okoli kamere)
    Rb=900; bm=Image.new('L',(2*Rb,2*Rb),0); bd=ImageDraw.Draw(bm); k=0
    for P in F['bld']:
        if len(P)>2 and abs(P[:,0].mean()-camx)<Rb and abs(P[:,1].mean()-camy)<Rb: k+=1; bd.polygon([(p[0]-camx+Rb,camy-p[1]+Rb) for p in P],fill=40+(k*37)%200)
    bm=np.array(bm); bi=np.clip((camy-PY+Rb).astype(int),0,2*Rb-1); bj=np.clip((PX-camx+Rb).astype(int),0,2*Rb-1); bv=bm[bi,bj]; bmask=(bv>0)&(np.abs(PX-camx)<Rb)&(np.abs(PY-camy)<Rb)
    wallc=np.array([[226,214,196],[204,190,170],[232,226,214],[196,170,150]],np.float32)
    col[bmask]=wallc[bv[bmask]%4]; tree_h[bmask]=3.2+(bv[bmask]%3)*1.3
    # asfalt / makadam
    grav=cfg['kind'].startswith('makadam'); on=dR<=hw; sh2=dR<=hw+1.3
    vc=np.array(cfg.get('vergecol',[150,140,110]),np.float32); col[sh2&~on]=vc*(0.85+0.3*noise(PX,PY,1.5)[sh2&~on][...,None])
    if grav: rc=np.array(cfg.get('roadcol',[176,150,112]),np.float32); col[on]=rc*(0.82+0.3*fbm(PX,PY,2.5)[on][...,None])*(0.92+0.16*(np.abs(dR[on]-hw*0.45)<0.5)[...,None])
    else:
        col[on]=np.array([74,74,78])*(0.93+0.14*noise(PX,PY,1.2)[on][...,None])
        edge=on&(dR>hw-0.5)&(dR<hw-0.28); col[edge]=(235,235,225)
        if cfg.get('center',True):
            cen=on&(dR<0.14)&(((iR*0.5)%12)<(12 if cfg.get('solid') else 4.5)); col[cen]=cfg.get('centercol',(235,235,225))
    ro=(d2<=cfg.get('ow',2.6))&~on; col[ro]=np.array([96,94,92]) if not grav else np.array([170,146,110])
    if cfg['kind'].startswith('dirk'):   # robniki in trava ob stezi
        kb=sh2&~on&(((iR*0.5)%4)<2)&(dR<hw+0.9); col[kb]=(200,40,40); kb2=sh2&~on&(((iR*0.5)%4)>=2)&(dR<hw+0.9); col[kb2]=(240,240,240)
    shade=(0.42+0.75*sh)[...,None]; col=col*shade
    seacol=np.array(cfg.get('seacol',[58,120,170]),np.float32); col[sea]=seacol*(0.92+0.16*noise(PX,PY,60)[sea][...,None]); Hg[sea]=np.minimum(Hg[sea],cfg.get('sealevel',0.0)) if cfg.get('lake') is None else Hg[sea]
    Ht=Hg+tree_h
    # meglica
    fog=1-np.exp(-(z/cfg.get('fog',16000.0))**1.1)[:,None,None]; skyh=np.array(cfg.get('haze',[190,208,224]),np.float32); col=col*(1-fog)+skyh*fog
    # projekcija
    ys=horizon-(Ht-camh)/z[:,None]*foc; run=np.minimum.accumulate(ys,axis=0)
    img=np.zeros((hh,w,3),np.float32); rows=np.arange(hh)
    top=np.array(cfg.get('sky',[92,150,215]),np.float32); skyimg=skyh[None,:]+(top-skyh)[None,:]*np.clip((horizon-rows)/(horizon*1.0),0,1)[:,None]**0.8
    for cix in range(w):
        r=run[:,cix]; k=np.searchsorted(-r,-(rows+0.5),side='left')   # prvi korak, kjer je run <= vrstica
        vis=k<len(z); img[:,cix]=skyimg; img[vis,cix]=col[k[vis],cix]
    im=Image.fromarray(np.clip(img,0,255).astype(np.uint8)).resize((W,Hh),Image.LANCZOS)
    # avto (generičen, od zadaj)
    d=ImageDraw.Draw(im,'RGBA'); cxp=W/2; dz=back; s=foc/SS/dz; by=horizon/SS+(camh-h[i])/dz*foc/SS
    cw,ch=1.82*s,1.30*s; d.ellipse((cxp-cw*0.62,by-0.10*s,cxp+cw*0.62,by+0.16*s),fill=(0,0,0,110))
    cc=tuple(cfg.get('car',[200,40,40]))
    d.rounded_rectangle((cxp-cw/2,by-0.80*s,cxp+cw/2,by-0.18*s),radius=0.12*s,fill=cc+(255,))
    d.polygon([(cxp-cw*0.40,by-0.80*s),(cxp-cw*0.31,by-ch),(cxp+cw*0.31,by-ch),(cxp+cw*0.40,by-0.80*s)],fill=tuple(int(v*0.8) for v in cc)+(255,))
    d.polygon([(cxp-cw*0.35,by-0.83*s),(cxp-cw*0.28,by-ch+0.07*s),(cxp+cw*0.28,by-ch+0.07*s),(cxp+cw*0.35,by-0.83*s)],fill=(40,52,66,255))
    d.rectangle((cxp-cw/2,by-0.30*s,cxp+cw/2,by-0.16*s),fill=(30,30,32,255))
    for sg in(-1,1):
        d.rounded_rectangle((cxp+sg*cw*0.47-0.13*s,by-0.30*s,cxp+sg*cw*0.47+0.13*s,by+0.02*s),radius=0.04*s,fill=(18,18,18,255))
        d.rounded_rectangle((cxp+sg*cw*0.36-0.12*s,by-0.66*s,cxp+sg*cw*0.36+0.12*s,by-0.55*s),radius=0.03*s,fill=(255,70,50,255))
    d.rectangle((cxp-0.26*s,by-0.52*s,cxp+0.26*s,by-0.40*s),fill=(235,235,235,255))
    cap='%s · pogled za avtom pri %s km (izris terena: Copernicus DEM GLO-30, ESA WorldCover, © OpenStreetMap)'%(cfg['name'],('%.2f'%(i*STEP/1000)).replace('.',','))
    tw=d.textlength(cap,font=font(15)); d.rectangle((0,Hh-28,tw+20,Hh),fill=(15,20,28,190)); d.text((10,Hh-24),cap,font=font(15),fill=(235,235,235))
    save(im,out)

def line(T):
    M,R=T['M'],check(T); fm=lambda v,k=0:('%.*f'%(k,v)).replace('.',','); lc=R['lc']; pc=lambda v:'%d %%'%round(v*100)
    names={10:'gozd',20:'grmovje',30:'trava',40:'polja',50:'pozidano',60:'golo tla in skale',80:'voda',90:'mokrišče',95:'mangrove'}
    land=', '.join('%s %s'%(names[k],pc(v)) for k,v in sorted(lc.items(),key=lambda a:-a[1]) if v>=0.05)
    it=[]
    if R['bld'][1]: it.append('%d stavb (ob %s dolžine)'%(R['bld'][1],pc(R['bld'][0])))
    w=max(R['water'][0],R['wcwater'],R['coast'][0]); 
    if w>0: it.append('voda ali obala ob %s'%pc(w))
    if R['stream'][1]: it.append('%d potokov'%R['stream'][1])
    if R['cliff'][1]: it.append('skale/stene (OSM) ob %s'%pc(R['cliff'][0]))
    if R['view'][1]: it.append('%d razgledišč'%R['view'][1])
    if R['bridges'] or R['tunnels']: it.append('%d mostov, %d predorov'%(R['bridges'],R['tunnels']))
    if R['road'][1]: it.append('%d stranskih cest'%R['road'][1])
    if R['barrier'][1]: it.append('ograje/zidovi (OSM) ob %s'%pc(R['barrier'][0]))
    it.append('strmo pobočje ob cesti (DEM): navzdol %s, navzgor %s'%(pc(R['drop']),pc(R['wall'])))
    meas='%s km, %d °/km, ravnine %s (najdaljša %d m), %d ovinkov, %d lasnic, %+d m (%d → %d m, povprečno %s %%, največ %s %%)'%(fm(M['len']/1000,2),round(M['twist']),pc(M['straight']),M['longest'],M['corners'],M['hairpins'],round(M['h1']-M['h0']),round(M['h0']),round(M['h1']),fm(M['grade'],1),fm(M['gmax'],1))
    if T['closed']: meas='%s km, %d °/km, ravnine %s (najdaljša %d m), %d ovinkov (%s na km), višinska razlika %d m'%(fm(M['len']/1000,2),round(M['twist']),pc(M['straight']),M['longest'],M['corners'],fm(M['corners']/(M['len']/1000),1),round(M['hmax']-M['hmin']))
    return dict(meas=meas,land=land,items='; '.join(it),zone=R['zone'],R=R,M=M)

if __name__=='__main__':
    cid=sys.argv[1]; what=sys.argv[2:] or ['map','profile','view']; T=build(cid); od=os.path.join(HERE,'out',cid); os.makedirs(od,exist_ok=True)
    L=line(T); json.dump(dict(id=cid,name=T['cfg']['name'],meas=L['meas'],land=L['land'],items=L['items'],zone=L['zone'],M=L['M'],R={k:v for k,v in L['R'].items()},start=[float(v) for v in T['geo'].ll(T['x'][0],T['y'][0])],end=[float(v) for v in T['geo'].ll(T['x'][-1],T['y'][-1])]),open(os.path.join(od,'meritve.json'),'w'),ensure_ascii=False,indent=1,default=float)
    print(T['cfg']['name']); print(' ',L['meas']); print('  60 m:',L['land'],'|',L['items']); print('  pregrada <=3 m (OSM): %d %%'%round(L['zone']*100))
    if 'map' in what: draw_map(T,os.path.join(od,'1-oblika.jpg'))
    if 'profile' in what: draw_profile(T,os.path.join(od,'2-profil.jpg'))
    if 'view' in what: draw_view(T,os.path.join(od,'3-pogled.jpg'))
