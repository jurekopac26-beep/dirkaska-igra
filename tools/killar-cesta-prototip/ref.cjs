// proto: reference numbers of today's Killar (nothing in the repo changes): grid, base heights, speeds of the autopilot (stock rally car) and of a quick car
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { loadCore } = require(path.join(ROOT, 'tests/lib/core.js'));
const { DT, seeded } = require(path.join(ROOT, 'tests/lib/sim.js'));
const C = loadCore();
const def = C.TRACKS.find(d => d.id === 'killar');
const orig = Math.random; Math.random = seeded(3); const T = new C.Track(def); Math.random = orig;
const N = T.N, ds = T.ds;
// the autopilot's speed by grid sample (time trial, stock rally car), max over the samples it passes
function tt(model) {
  Math.random = seeded(3);
  const r = new C.Race(T, { tt: true, numAI: 0, playerGrid: 1, laps: 1, playerModel: model, assist: 2, phys: 'cs', seed: 11, difficulty: 1 }), P = r.player; r.start();
  const v = new Float64Array(N); let t = 0, k = 0;
  while (!P.finished && t < 600) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); const i = T.idx(P.q.s); v[i] = Math.max(v[i], Math.hypot(P.vx, P.vz)); }
  Math.random = orig;
  for (let i = 1; i < N; i++) if (!v[i]) v[i] = v[i - 1];
  return { v, time: P.finishTime };
}
const out = { N, ds, len: T.len, startS: T.startS, finishS: T.finishS, startIdx: T.startIdx, finishIdx: T.finishIdx, hy: Array.from(T.hy), grade: Array.from(T.grade), curvH: Array.from(T.k || []), models: C.MODELS.map((m, i) => [i, m.id || m.name, m.vmax || m.top || null]) };
const cpIdx = (def.cps || []).map(p => T.nearestIdx(p[0], p[1]));
out.cps = cpIdx.map(i => i * ds);
const R = tt(C.MODELS[4]); out.vRally = Array.from(R.v); out.tRally = R.time;
// the quickest models: try each, keep the max speed per sample
let vMaxAll = new Float64Array(N); const times = [];
for (let m = 0; m < C.MODELS.length; m++) { try { const r = tt(C.MODELS[m]); times.push([m, C.MODELS[m].id || C.MODELS[m].name, +(r.time || 0).toFixed(2), +Math.max(...r.v).toFixed(1)]); for (let i = 0; i < N; i++) vMaxAll[i] = Math.max(vMaxAll[i], r.v[i]); } catch (e) { times.push([m, 'ERR ' + e.message]); } }
out.vFast = Array.from(vMaxAll); out.times = times;
fs.writeFileSync(path.join(__dirname, 'ref.json'), JSON.stringify(out));
console.log('N', N, 'ds', ds, 'len', T.len, 'startS', T.startS, 'finishS', T.finishS, 'cps', out.cps.map(x => x.toFixed(0)).join(','));
console.log('rally', R.time.toFixed(2));
console.log(times.map(t => t.join(' ')).join('\n'));
