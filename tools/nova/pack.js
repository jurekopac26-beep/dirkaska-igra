// contacts and the train: node pack.js phys [json overrides]
'use strict';
const ROOT=process.env.GAME_ROOT||require('path').resolve(__dirname,'../..');const {loadCore}=require(ROOT+'/tests/lib/core.js');const {seeded}=require(ROOT+'/tests/lib/sim.js');const C=loadCore();
const ov=JSON.parse(process.argv[3]||'{}');Object.assign(C.NVK,ov.K||{});
const DT=1/120,D=180/Math.PI,phys=process.argv[2]||'nova';const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const ev=[];let grp=0,close=0,side=0,n3=0;
for(const tid of (process.env.TR||'bathurst,spa,suzuka,monaco,rbring,detroit,montreal,townsville').split(',')){
 Math.random=seeded(3);const T=new C.Track(C.TRACKS.find(d=>d.id===tid));
 const r=new C.Race(T,{numAI:12,playerGrid:12,laps:9,playerModel:C.MODELS[4],assist:2,seed:9,difficulty:1,phys});r.start();
 const open=new Map();
 for(let i=1;i<=150/DT;i++){Math.random=seeded(9+i);C.aiControl(r.player,r,DT);
  const pre=r.cars.map(c=>({w:c.w,h:c.h,v:c.speed,vx:c.vx,vz:c.vz}));r.step(DT);
  r.cars.forEach((c,j)=>{if(c.hitCar>1.5&&!open.has(c)&&c.speed>10){open.set(c,{t:0,w0:pre[j].w,h0:pre[j].h,v0:pre[j].v,dwMax:0,imp:c.hitCar,vx0:pre[j].vx,vz0:pre[j].vz,hT:pre[j].h})}c.hitCar=0;
   const e=open.get(c);if(e){e.t+=DT;if(e.t<0.3)e.dwMax=Math.max(e.dwMax,Math.abs(c.w-e.w0));if(e.t<=0.15){const ch=Math.cos(e.h0),sh=Math.sin(e.h0);e.lat=Math.abs(-(c.vx-e.vx0)*sh+(c.vz-e.vz0)*ch);}
    if(Math.abs(e.t-0.5)<DT/2){e.dh=Math.abs(wrap(c.h-e.h0-e.w0*0.5))*D;e.dv=e.v0-c.speed;}
    if(e.t>0.3&&e.tr==null&&Math.abs(c.beta||0)<0.035)e.tr=e.t; if(e.t>3){ev.push(e);open.delete(c);}}});
  if(i*DT>10&&i%12==0){for(const c of r.cars){if(c.speed<10)continue;let near=null,nd=1e9,al=false;for(const o of r.cars){if(o===c)continue;const ds=o.dist-c.dist;if(ds>0&&ds<nd){nd=ds;near=o}if(Math.abs(ds)<c.m.len&&Math.abs(o.q.d-c.q.d)<3.2)al=true}
   if(nd<30||al){grp++;if(nd<15)close++;if(al)side++;if(nd/c.speed<0.5)n3++;}}}}
}
const q=(a,p)=>{a=a.filter(Number.isFinite).sort((x,y)=>x-y);return a.length?a[Math.min(a.length-1,Math.floor(a.length*p))]:NaN};
const f=(x,d=1)=>(+x).toFixed(d);
console.log(phys,JSON.stringify(ov),'contacts',ev.length,'| dw p50',f(q(ev.map(e=>e.dwMax*D),0.5)),'p90',f(q(ev.map(e=>e.dwMax*D),0.9)),'max',f(q(ev.map(e=>e.dwMax*D),1)),'deg/s | dHead0.5s p50',f(q(ev.map(e=>e.dh),0.5)),'p90',f(q(ev.map(e=>e.dh),0.9)),'| dv p50',f(q(ev.map(e=>e.dv),0.5)),'p90',f(q(ev.map(e=>e.dv),0.9)),'| lat p50',f(q(ev.map(e=>e.lat),0.5),2),'p90',f(q(ev.map(e=>e.lat),0.9),2),'| realign p50',f(q(ev.map(e=>e.tr),0.5),2),'| train: gap<15m',f(close/grp*100),'% side',f(side/grp*100),'% gap<0.5s',f(n3/grp*100),'%');
