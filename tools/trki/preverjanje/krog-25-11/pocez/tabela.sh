#!/bin/bash
# tabela.sh ROOT [extra args]: six runs, game only (cv 6), one line each + totals
ROOT=$1; shift
D=$(cd "$(dirname "$0")" && pwd)
for t in cusco hiva tianmen; do for s in 71 72; do node $D/diag.js $ROOT $t $s --sum "$@" | grep '^{'; done; done | node -e '
const L=require("fs").readFileSync(0,"utf8").trim().split("\n").map(x=>JSON.parse(x)); const f=(v,d=1)=>v==null?"-":v.toFixed(d);
let R=0,PD=0;
for(const r of L){R+=r.riv;PD+=r.pDmg;console.log(`${r.tid.padEnd(8)} ${r.seed}  Σ ${f(r.riv).padStart(6)}  P/drugi/ograja ${f(r.byP,0)} / ${f(r.byC,0)} / ${f(r.byW,0)}  počez ${f(r.pDmg)}  udarci ${r.hits} max ${f(r.hitMax)}  izp ${r.out}  mimo ${r.past}/12  prvi ${f(r.firstPast)} zadnji ${f(r.lastPast)} Σmimo ${f(r.sumPast,0)}  stoji max ${f(r.maxStop)} Σ ${f(r.sumStop)} n ${r.nStop}`); console.log("   mimo ob: "+r.pts.join(" "));}
console.log(`SKUPAJ tekmeci ${f(R)} %, z avtom počez ${f(R+PD)} %`);'
