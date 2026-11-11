# python3 scan.py <id> [dolžina okna m] [korak]: meritve drsečih oken po celi poti (brez trim), za izbiro odseka
import sys, json, numpy as np, proga
cid=sys.argv[1]; L=float(sys.argv[2]) if len(sys.argv)>2 else 2000; st=float(sys.argv[3]) if len(sys.argv)>3 else 500; lo_=float(sys.argv[4]) if len(sys.argv)>4 else 0; hi_=float(sys.argv[5]) if len(sys.argv)>5 else 1e9
cfgs=json.load(open(proga.HERE+'/proge.json')); c=dict(cfgs[cid]); c.pop('trim',None); c.pop('reverse',None)
import os; json.dump({**cfgs,'_scan':c},open(proga.HERE+'/proge.json','w'),ensure_ascii=False,indent=1)
try: T=proga.build('_scan')
finally: json.dump(cfgs,open(proga.HERE+'/proge.json','w'),ensure_ascii=False,indent=1)
for f in ('_scan-dem.npz','_scan-wc.npz'):
    p=proga.HERE+'/dem/'+f
    if os.path.exists(p): os.remove(p)
x,y,h=T['x'],T['y'],T['h']; n=len(x); print('cela pot %.0f m, h %.0f..%.0f'%(n*5,h.min(),h.max()), 'start',T['geo'].ll(x[0],y[0]))
print('h vsakih 500 m:',' '.join('%d'%h[i] for i in range(0,n,100)))
for nm,la,lo in c.get('near',[]):
    px,py=T['geo'].xy(la,lo); i=int(np.argmin((x-px)**2+(y-py)**2)); print(nm,'pri s=%d m, %.0f m od ceste, h %d'%(i*5,np.hypot(x[i]-px,y[i]-py),h[i]))
w=int(L/5)
for a in range(int(lo_/5),min(max(1,n-w+1),int(hi_/5)),int(st/5)):
    m=proga.metrics(x[a:a+w],y[a:a+w],False); print('%5d-%5d  %4d°/km ravn %2d%% naj %3dm ov %2d las %d  dh %+4d'%(a*5,a*5+L,m['twist'],m['straight']*100,m['longest'],m['corners'],m['hairpins'],h[min(a+w,n)-1]-h[a]))
