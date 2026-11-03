'use strict';
const ROOT=process.env.GAME_ROOT||require('path').resolve(__dirname,'../..');const {loadCore}=require(ROOT+'/tests/lib/core.js');const C=loadCore();
const ov=JSON.parse(process.argv[2]||'{}');Object.assign(C.NVK,ov.K||{});(ov.A||[]).forEach((a,i)=>a&&Object.assign(C.NVASSIST[i],a));
const H=require(ROOT+'/tests/lib/handling.js')(C,'nova');const D=180/Math.PI,DT=H.DT;
const id=process.argv[3]||'kaze',kmh=+(process.argv[4]||60),as=+(process.argv[5]||2),mode=process.argv[6]||'lock';
const c=H.mkCar(id,{v:kmh,digital:true,assist:as});for(let i=0;i<0.3/DT;i++)H.step(c,{st:0,thr:'hold'});
if(mode!=='lock'){for(let i=0;i<3/DT;i++)H.step(c,{st:0.7,thr:'hold'});}
for(let i=0;i<2.4/DT;i++){const I=mode==='lock'?{st:1,thr:'hold'}:{st:0.7,thr:mode==='thr'?1:0,brk:mode==='brk'?1:0};H.step(c,I);if(i%12==0){const v=Math.hypot(c.vx,c.vz);console.log((i*DT).toFixed(2),'v',(v*3.6).toFixed(0),'w',c.w.toFixed(2),'wP',c.wPath.toFixed(2),'b',(c.beta*D).toFixed(1),'bSS',(c.csAT*D).toFixed(1),'dl',(c.delta*D).toFixed(1),'thr',c.inThr.toFixed(2),'s',c.csS.toFixed(2),'wcap',c.csWcap.toFixed(2),'axF',c.axF.toFixed(1))}}
