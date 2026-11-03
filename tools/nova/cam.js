// The car against the view behind it (the chase camera's lag) in races on six tracks, the player driven by the AI:
//   node cam.js [phys] [rates,...] [model] (render.js: nova 12, cs 2.8); env OV='{"K":{…},"A":[…]}' (NVK / NVASSIST as tune.js),
//   CF (the view's share of the slide: 1 nova, 0.85 cs), CAP (its most turn, rad/s: 2.5 nova), AS (the drift assist, 2), TR (tracks),
//   SL=1 the sliding style (Car.nvSl)
// prints per camera rate: the slope of the car's angle against the view's turn (deg per deg/s), its p50 / p95 above 50 deg/s, and the
// car's own slide (beta: its heading against its travel) the same way: how much of the angle is the slide and how much the view's lag
'use strict';
const ROOT=process.env.GAME_ROOT||require('path').resolve(__dirname,'../..');const {loadCore}=require(ROOT+'/tests/lib/core.js');const {seeded}=require(ROOT+'/tests/lib/sim.js');const C=loadCore();
const ov=JSON.parse(process.env.OV||'{}');Object.assign(C.NVK,ov.K||{});(ov.A||[]).forEach((a,i)=>a&&Object.assign(C.NVASSIST[i],a));
const DT=1/120,D=180/Math.PI;const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const phys=process.argv[2]||'nova', model=process.argv[4]||'kaze', ks=(process.argv[3]||'2.8,3.5,4.5,7').split(',').map(Number), CF=+(process.env.CF||(phys==='nova'?1:0.85)), CAP=+(process.env.CAP||(phys==='nova'?2.5:0)), AS=+(process.env.AS||2);
const res={};for(const k of ks)res[k]={xy:[],big:[],sl:[],slb:[]};
for(const tid of (process.env.TR||'bathurst,spa,suzuka,monaco,rbring,detroit').split(',')){
 Math.random=seeded(3);const T=new C.Track(C.TRACKS.find(d=>d.id===tid));const M=C.MODELS.find(m=>m.id===model);
 const r=new C.Race(T,{numAI:11,playerGrid:6,laps:9,playerModel:M,fieldModel:M,assist:AS,seed:9,difficulty:1,phys,playerSlide:!!process.env.SL});r.start();const P=r.player;
 const cams=ks.map(()=>null);
 for(let i=1;i<=150/DT;i++){Math.random=seeded(9+i);C.aiControl(P,r,DT);r.step(DT);
  for(let j=0;j<ks.length;j++){const k=ks[j];const hv=P.h+Math.max(-1.2,Math.min(1.2,P.beta||0))*CF;
   if(cams[j]==null)cams[j]={hs:hv,prev:hv};const c=cams[j];c.prev=c.hs;const dh=wrap(hv-c.hs)*(1-Math.exp(-DT*k));c.hs+=CAP?Math.max(-CAP*DT,Math.min(CAP*DT,dh)):dh;
   if(i*DT>15&&i%4==0){const om=wrap(c.hs-c.prev)/DT*D, ang=wrap(P.h-c.hs)*D, sl=Math.abs(P.beta||0)*D; if(P.speed>8){res[k].xy.push([Math.abs(om),Math.abs(ang)]);res[k].sl.push([Math.abs(om),sl]); if(Math.abs(om)>50){res[k].big.push(Math.abs(ang));res[k].slb.push(sl);}}}}}
}
const fit=(xy)=>{xy=xy.filter(p=>p[0]>10);const n=xy.length;let sx=0,sy=0,sxx=0,sxy=0;for(const[x,y]of xy){sx+=x;sy+=y;sxx+=x*x;sxy+=x*y}return[(n*sxy-sx*sy)/(n*sxx-sx*sx),sxy/sxx]};
const pc=(a,p)=>(a.sort((x,y)=>x-y)[Math.floor(a.length*p)]||0).toFixed(1);
for(const k of ks){const R=res[k],[slope,thru0]=fit(R.xy),[ss]=fit(R.sl);
 const omp=R.xy.map(p=>p[0]).sort((a,b)=>a-b);
 console.log(phys,model,'cam',k,'slope',slope.toFixed(3),'thru0',thru0.toFixed(3),'ang@>50dps p50',pc(R.big,0.5),'p95',pc(R.big,0.95),'n',R.big.length,'| slide slope',ss.toFixed(3),'@>50dps p50',pc(R.slb,0.5),'p95',pc(R.slb,0.95),'| om p90',omp[Math.floor(omp.length*0.9)].toFixed(0),'p99',omp[Math.floor(omp.length*0.99)].toFixed(0))}
