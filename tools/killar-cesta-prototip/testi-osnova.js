// (testi) baseline numbers of Killar from the game's own Core: node testi-osnova.js [GAME_ROOT via env]
'use strict';
const path = require('path');
const REPO = require('path').join(__dirname, '..', '..');
const { loadCore } = require(path.join(REPO, 'tests/lib/core.js'));
const { DT, seeded } = require(path.join(REPO, 'tests/lib/sim.js'));
const C = loadCore();
const def = C.TRACKS.find(d => d.id === 'killar'), T = new C.Track(def);
let gmax = 0, gmin = 0, imax = 0; for (let i = T.startIdx; i < T.finishIdx; i++) { if (T.grade[i] > gmax) { gmax = T.grade[i]; imax = i; } gmin = Math.min(gmin, T.grade[i]); }
let cmin = 0, cmax = 0; for (let i = T.startIdx; i < T.finishIdx; i++) { cmin = Math.min(cmin, T.curv[i]); cmax = Math.max(cmax, T.curv[i]); }
console.log(JSON.stringify({ N: T.N, ds: +T.ds.toFixed(4), len: +T.len.toFixed(1), raceLen: +T.raceLen.toFixed(1), startS: +T.startS.toFixed(1), finishS: +T.finishS.toFixed(1), hasElev: !!T.hasElev,
  gmax: +(gmax * 100).toFixed(2), gmaxAt: Math.round(imax * T.ds - T.startS), gmin: +(gmin * 100).toFixed(2), curvMin: +cmin.toFixed(5), curvMax: +cmax.toFixed(5),
  hyStart: +T.hy[T.startIdx].toFixed(3), hyFinish: +T.hy[T.finishIdx].toFixed(3), climb: +(T.hy[T.finishIdx] - T.hy[T.startIdx]).toFixed(3), altFinish: +T.altAt(T.hFinish).toFixed(2), hFinish: T.hFinish,
  bumps: (def.bumps || []).length, rain: !!def.rain, puddles: T.puddles.length, codrv: C.codrvRoad(def) }));
const N = T.paceNotes(); console.log('notes', N.length, (N.length / ((T.finishS - T.startS) / 1000)).toFixed(2) + '/km', 'crest-like:', N.filter(c => c.toks.some(w => w === 'crest' || w === 'jump' || w === 'bigjump')).length);
if (process.argv.includes('--notes')) for (const c of N) console.log('  ', Math.round(c.s - T.startS), c.text);
// the medals as tools/nova-proga.mjs works them out (the stock rally car on the autopilot, dry and wet)
if (process.argv.includes('--medalje')) {
  const run = (rain) => { const orig = Math.random; Math.random = seeded(3);
    const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, tt: true, rain }), P = r.player; r.start();
    let t = 0, k = 0, air = 0, airMax = 0, a = 0, resc = 0, vmax = 0; while (!P.finished && t < 900) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
      vmax = Math.max(vmax, P.speed || 0); if (P.air) { air += DT; a += DT; airMax = Math.max(airMax, a); } else a = 0; }
    Math.random = orig; return { t: P.finished ? P.finishTime : null, air: +air.toFixed(2), airMax: +airMax.toFixed(2), resc, vmax: +(vmax * 3.6).toFixed(0), falls: P.falls || 0, offN: P.offN || 0 }; };
  const d = run(0), w = run(1), m = (t) => [Math.round(t * 1.01), Math.round(t * 1.06), Math.round(t * 1.14)];
  console.log('autopilot dry', JSON.stringify(d), 'wet', JSON.stringify(w));
  console.log(`medals: {"cs":[${m(d.t)}],"wet":{"cs":[${m(w.t)}]}},   (now in the file: ${JSON.stringify(def.medals)})`);
}
