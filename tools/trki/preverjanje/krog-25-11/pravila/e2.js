'use strict';
// (e) igralec obstane počez na cesti pred poljem (trajna ovira): ali tekmeci pridejo mimo, koliko vrnitev redarjev, NaN, avto zunaj ograje, izid dirke
const { SNAP, MAIN, load } = require('../fizika/lib.js');
const root = process.argv[2] === 'main' ? MAIN : SNAP, tid = process.argv[3] || 'koli', seed = +(process.argv[4] || 9), cv = +(process.argv[5] || 0), tStop = +(process.argv[6] || 10), tMax = +(process.argv[7] || 110);
const { C, SIM } = load(root), DT = SIM.DT, seeded = SIM.seeded;
const ALL = C.MODELS.map(m => m.id), SOKOL = C.MODELS.find(m => m.id === 'sokol');
const def = C.TRACKS.find(d => d.id === tid), T = new C.Track(def);
C.setTest(cv ? { cv } : {});
const r = new C.Race(T, { numAI: 12, playerGrid: 1, laps: 1, playerModel: SOKOL, assist: 2, seed, difficulty: 1, damage: 2, wheelRule: ALL }); r.start();
const P = r.player, cnt = new Map(), orig = r.rescue.bind(r); r.rescue = (c) => { cnt.set(c, (cnt.get(c) || 0) + 1); return orig(c); };
let nan = 0, out = 0, outMax = 0, stopped = false, sP = null, wP = null, tHit = null, first = null; const stand = new Map();
for (let k = 0; k < 120 * tMax; k++) {
  Math.random = seeded(1000 + k);
  const t = k * DT;
  if (!stopped && r.state === 'racing' && r.time >= tStop) { stopped = true; const q = P.q; P.h = T.hd[q.i] + Math.PI / 2; P.vx = P.vz = 0; P.w = 0; sP = q.s; wP = (T.wa ? T.wa[q.i] : T.w); }
  if (!r.isOut(P)) { if (stopped) { P.inThr = 0; P.inBrk = 1; P.inHand = 1; P.inSteer = 0; } else C.aiControl(P, r, DT); }
  r.step(DT);
  for (const c of r.cars) {
    if (!Number.isFinite(c.x + c.z + c.vx + c.vz + c.h + c.w + (c.dist || 0))) { nan++; if (!first) first = 'NaN t ' + r.time.toFixed(2) + ' avto ' + r.cars.indexOf(c); }
    if (c === P || !c.q) continue;
    const ex = Math.abs(c.q.d) - (c.q.d > 0 ? c.q.br : c.q.bl); if (ex > 0.5) { out++; outMax = Math.max(outMax, ex); }
    if (stopped && c.speed < 1 && !c.finished && !(c.wreck && c.wreck.dnf)) stand.set(c, (stand.get(c) || 0) + DT);
  }
  if (stopped && tHit == null && P.wreck && (P.wreck.nL || P.dmg > 0.02)) tHit = r.time;
  if (r.cars.every(c => r.isOut(c))) break;
}
const riv = r.cars.filter(c => c !== P), fin = riv.filter(c => c.finished).length, dn = riv.filter(c => c.wreck && c.wreck.dnf).length;
const rs = riv.map(c => cnt.get(c) || 0), st = riv.map(c => +(stand.get(c) || 0).toFixed(0));
console.log(root === MAIN ? 'MAIN' : 'SNAP', tid, 'seme', seed, 'cv', cv, '| igralec počez pri s', sP && sP.toFixed(0), 'pol širine', wP && wP.toFixed(1), 't', tStop, '| t konec', r.time.toFixed(1), 'state', r.state);
console.log('  tekmeci v cilju', fin, '/ 12, izločeni', dn, '| vrnitve redarjev', rs.join(','), '(skupaj', rs.reduce((a, b) => a + b, 0) + ')', '| s stanja pod 1 m/s', st.join(','), '| NaN', nan, first || '', '| koraki zunaj ograje > 0,5 m', out, 'max', outMax.toFixed(1));
console.log('  igralec: dmg', P.dmg.toFixed(2), 'nL', P.wreck && P.wreck.nL, 'dnf', !!(P.wreck && P.wreck.dnf), 'rule.over', !!(P.wreck && P.wreck.rule && P.wreck.rule.over), 'prvi dotik t', tHit && tHit.toFixed(1), 'rescue igralca', cnt.get(P) || 0);
