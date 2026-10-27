'use strict';
const ROOT=process.env.GAME_ROOT||require('path').resolve(__dirname,'../..');const {loadCore}=require(ROOT+'/tests/lib/core.js');const {seeded}=require(ROOT+'/tests/lib/sim.js');const C=loadCore();
const DT=1/120,D=180/Math.PI;const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const phys=process.argv[2]||'nova', model=process.argv[4]||'kaze', ks=(process.argv[3]||'2.8,3.5,4.5,7').split(',').map(Number);
const res={};for(const k of ks)res[k]={xy:[],big:[]};
for(const tid of ['bathurst','spa','suzuka','monaco','rbring','detroit']){
 Math.random=seeded(3);const T=new C.Track(C.TRACKS.find(d=>d.id===tid));const M=C.MODELS.find(m=>m.id===model);
 const r=new C.Race(T,{numAI:11,playerGrid:6,laps:9,playerModel:M,fieldModel:M,assist:2,seed:9,difficulty:1,phys});r.start();const P=r.player;
 const cams=ks.map(()=>null);
 for(let i=1;i<=150/DT;i++){Math.random=seeded(9+i);C.aiControl(P,r,DT);r.step(DT);
  for(let j=0;j<ks.length;j++){const k=ks[j];const hv=P.h+Math.max(-1.2,Math.min(1.2,P.beta||0))*0.85;
   if(cams[j]==null)cams[j]={hs:hv,prev:hv};const c=cams[j];c.prev=c.hs;c.hs+=wrap(hv-c.hs)*(1-Math.exp(-DT*k));
   if(i*DT>15&&i%4==0){const om=wrap(c.hs-c.prev)/DT*D, ang=wrap(P.h-c.hs)*D; if(P.speed>8){res[k].xy.push([Math.abs(om),Math.abs(ang)]); if(Math.abs(om)>50)res[k].big.push(Math.abs(ang));}}}}
}
for(const k of ks){const xy=res[k].xy.filter(p=>p[0]>10);const n=xy.length;let sx=0,sy=0,sxx=0,sxy=0;for(const[x,y]of xy){sx+=x;sy+=y;sxx+=x*x;sxy+=x*y}
 const slope=(n*sxy-sx*sy)/(n*sxx-sx*sx), thru0=sxy/sxx; const b=res[k].big.sort((a,b)=>a-b);
 const omp=res[k].xy.map(p=>p[0]).sort((a,b)=>a-b);
 console.log(phys,model,'cam',k,'slope',slope.toFixed(3),'thru0',thru0.toFixed(3),'ang@>50dps p50',(b[b.length>>1]||0).toFixed(1),'p95',(b[Math.floor(b.length*0.95)]||0).toFixed(1),'n',b.length,'om p90',omp[Math.floor(omp.length*0.9)].toFixed(0),'p99',omp[Math.floor(omp.length*0.99)].toFixed(0))}
