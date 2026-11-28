# Realizem G, Štajerska (rbring): the band 8–60 m measured with tools/proga-podatki.py build_cover (ESA WorldCover 2021, Sentinel-2 2021)
# on the game's own centre line (js/geo.js frame, rot 0.14°), and def.lc's forest against WorldCover's trees by section and side.
#   node tools/rbring/izvoz.mjs <dir>/rbring-game.json ; python3 -I tools/rbring/meritev.py <dir>/rbring-game.json <empty dir>
import sys, json, math, importlib.util, os
import numpy as np
HERE=os.path.dirname(os.path.abspath(__file__)); REPO=os.path.dirname(os.path.dirname(HERE))
GAME, OUT = sys.argv[1], sys.argv[2]   # rbring-game.json (izvoz.mjs), the folder for the downloads and cover.json
spec=importlib.util.spec_from_file_location('pp', REPO+'/tools/proga-podatki.py'); pp=importlib.util.module_from_spec(spec); spec.loader.exec_module(pp)
pp.C.update({'dist': dict(pp.DIST), 'closed': True})
g=json.load(open(GAME))
lat0, lon0, rot = 47.220015, 14.765109, 0.14
r=math.radians(rot); P=np.array(g['line'],float)
east=P[:,0]*math.cos(r)+P[:,1]*math.sin(r); south=-P[:,0]*math.sin(r)+P[:,1]*math.cos(r)
line=np.stack([east,south],1)   # Frame: x east, z south
F=pp.Frame(lat0,lon0)
cover,grid=pp.build_cover(F,line,g['len']/g['N'],OUT)
json.dump({'cover':cover,'grid':grid},open(os.path.join(OUT,'cover.json'),'w'))
# correlation: game lc forest (class 1) vs WorldCover trees (10) by section and side in the band
A=pp.Along(line, g['len']/g['N']); n=len(cover['left']['share'][0]) and len(cover['left']['share'])
lc=g['lc']; cls=np.array(g['cls']).reshape(lc['nz'],lc['nx'])
lo,hi=cover['band']; c=4.0
x0,z0,nx,nz=pp.grid_box(line,hi+c,c)
X,Z=np.meshgrid(x0+(np.arange(nx)+.5)*c, z0+(np.arange(nz)+.5)*c); pts=np.stack([X.ravel(),Z.ravel()],1)
s,d=A.query(pts); m=(np.abs(d)>=lo)&(np.abs(d)<=hi); pts,s,d=pts[m],s[m],d[m]
# back to game coords
gx=pts[:,0]*math.cos(r)-pts[:,1]*math.sin(r); gz=pts[:,0]*math.sin(r)+pts[:,1]*math.cos(r)
ix=np.floor((gx-lc['x0'])/lc['cell']).astype(int); iz=np.floor((gz-lc['z0'])/lc['cell']).astype(int)
ok=(ix>=0)&(ix<lc['nx'])&(iz>=0)&(iz<lc['nz'])
L=A.L; n=len(cover['left']['share']); sec=np.minimum((s/(L/n)).astype(int),n-1); side=(d>0).astype(int)
f=np.zeros(len(s)); f[ok]=(cls[iz[ok],ix[ok]]==1)
gf=np.zeros((2,n)); cn=np.zeros((2,n)); np.add.at(gf,(side,sec),f); np.add.at(cn,(side,sec),1)
gfp=100*gf/np.maximum(cn,1)
ci=cover['classes'].index(10)
wt=np.array([np.array(cover['left']['share'])[:,ci], np.array(cover['right']['share'])[:,ci]])
cc=np.corrcoef(gfp.ravel(),wt.ravel())[0,1]
best=max(((np.corrcoef(np.roll(gfp,sh,1).ravel(),wt.ravel())[0,1],sh) for sh in range(-3,4)))
swap=np.corrcoef(gfp[::-1].ravel(),wt.ravel())[0,1]
print('sections',n,'game forest %.1f %%'%(100*gf.sum()/cn.sum()),'corr %.3f'%cc,'best shift',best,'swapped sides %.3f'%swap)
print('share',dict(zip(cover['names'],cover['share'])),'colour',dict(zip(cover['names'],cover['colour'])))
