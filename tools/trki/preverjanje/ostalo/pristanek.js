// Independent check of the landing deviations on REAL tracks (Race.step): (a) a car put h m above the road, parallel to it, at 100 km/h on
// a flat, a downhill and an uphill spot of Spa / Bathurst; (b) the autopilot's real landings on Ouninpohja: what the game takes (vertical
// speed) against the speed square to the road.
'use strict';
const L = require('./lib.js'), { C, SIM, DT, KMH } = L;
const f = (x, d) => x.toFixed(d == null ? 1 : d);
const mode = process.argv[2] || 'spust';
function gradeAt(T, i) { return (T.hy[(i + 1) % T.N] - T.hy[(i - 1 + T.N) % T.N]) / (2 * T.ds); }
function spot(T, g) {   // the sample whose grade is nearest g on a nearly straight, evenly sloped piece (40 m ahead)
  let best = -1, be = 1e9; const n = Math.round(45 / T.ds);
  for (let i = 0; i < T.N; i++) { let mk = 0, mg = 0; for (let j = 0; j <= n; j++) { const q = (i + j) % T.N; mk = Math.max(mk, Math.abs(T.k[q])); mg = Math.max(mg, Math.abs(gradeAt(T, q) - g)); } if (mk > 2.5e-3) continue; if (mg < be) { be = mg; best = i; } }
  return { i: best, err: be };
}
function drop(tid, g, h, kmh, id) {
  const T = L.track(tid), S = spot(T, g), race = L.mkRace(T, id || 'rally'), P = race.player;
  L.put(P, T, S.i, 0, kmh / KMH, 0);
  const g0 = gradeAt(T, S.i); P.air = 1; P.airT = 0; P.y = P.py = T.hy[S.i] + h; P.vy = g0 * kmh / KMH; const d0 = P.dmg || 0;
  let n = 0, vb = 0, va = 0, ivy = 0, gl = 0, vl = 0;
  for (let k = 0; k < 3 / DT; k++) { vb = L.sp(P); const was = P.air; L.step(race); if (was && !P.air) { va = L.sp(P); ivy = P.impactVY; gl = P.gradeNow; vl = vb; break; } n++; }
  const vn = (ivy - gl * vl) / Math.sqrt(1 + gl * gl);
  return { tid, g: g0 * 100, gl: gl * 100, h, kmh, air: (n + 1) * DT, vy: ivy, vn, loss: (vb - va) / vb * 100, dmg: ((P.dmg || 0) - d0) * 100, tReal: Math.sqrt(2 * h / 9.81), vyReal: -Math.sqrt(2 * 9.81 * h), err: S.err * 100 };
}
if (mode === 'spust') {
  for (const tid of ['spa', 'bathurst']) {
    for (const g of [0, -0.08, -0.15, 0.08]) { const r = drop(tid, g, 1, 100); console.log(`${tid} klanec ${f(r.g)} % (ob pristanku ${f(r.gl)} %), 1 m nad cesto, 100 km/h: v zraku ${f(r.air, 2)} s, vy igra ${f(r.vy, 2)} m/s, pravokotno na cesto ${f(r.vn, 2)} m/s, izguba ${f(r.loss)} %, skoda ${f(r.dmg)} %`); }
    for (const h of [0.3, 1, 3, 6, 10]) { const r = drop(tid, 0, h, 100); console.log(`${tid} ravno (${f(r.g)} %), padec ${h} m, 100 km/h: v zraku ${f(r.air, 2)} s (g 9,81: ${f(r.tReal, 2)} s), vy ${f(r.vy, 2)} m/s (g 9,81: ${f(r.vyReal, 2)}), izguba ${f(r.loss)} %, skoda ${f(r.dmg)} %`); }
    { const r = drop(tid, 0, 3, 200); console.log(`${tid} ravno, padec 3 m, 200 km/h: izguba ${f(r.loss)} % (${f(r.loss * 2)} km/h), skoda ${f(r.dmg)} %`); }
    { const r = drop(tid, 0, 3, 100, 'truck'); const r2 = drop(tid, 0, 10, 100, 'truck'); console.log(`${tid} tovornjak, padec 3 / 10 m: izguba ${f(r.loss)} / ${f(r2.loss)} %, skoda ${f(r.dmg)} / ${f(r2.dmg)} %`); }
  }
} else {
  const tid = process.argv[3] || 'ouninpohja', secs = +(process.argv[4] || 150), T = L.track(tid);
  Math.random = SIM.seeded(7);
  const race = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 3, playerModel: L.model(process.argv[5] || 'rally'), assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' }); race.start(); const P = race.player;
  const rows = []; let airN = 0;
  for (let k = 0; k < secs / DT; k++) {
    Math.random = SIM.seeded(1000 + k); C.aiControl(P, race, DT);
    const was = P.air, vb = L.sp(P), ch = Math.cos(P.h), sh = Math.sin(P.h), vlb = P.vx * ch + P.vz * sh; L.step(race);
    if (P.air) airN++;
    if (was && !P.air) { const va = L.sp(P), g = P.gradeNow, vy = P.impactVY, vn = (vy - g * vlb) / Math.sqrt(1 + g * g), scRel = Math.min(0.13, Math.max(0, -vn * 0.016));
      rows.push({ s: P.q.s, v: vb * KMH, air: airN * DT, g: g * 100, vy, vn, loss: (vb - va) / vb * 100, lossKmh: (vb - va) * KMH, rel: scRel * 100, dmg: P.dmg }); airN = 0; }
    else if (!P.air) airN = 0;
  }
  const big = rows.filter(r => r.air > 0.05);
  const sum = (a, k) => a.reduce((x, r) => x + r[k], 0), mean = (a, k) => a.length ? sum(a, k) / a.length : 0;
  console.log(`${tid}: pristankov ${rows.length}, od tega po letu nad 0,05 s ${big.length}; skupaj izguba ${f(sum(rows, 'lossKmh'))} km/h`);
  console.log(`  leti nad 0,05 s: povp. v ${f(mean(big, 'v'))} km/h, v zraku ${f(mean(big, 'air'), 2)} s, klanec ob pristanku ${f(mean(big, 'g'))} %, vy igra ${f(mean(big, 'vy'), 2)} m/s, pravokotno na cesto ${f(mean(big, 'vn'), 2)} m/s, izguba ${f(mean(big, 'loss'))} % (${f(mean(big, 'lossKmh'))} km/h), po hitrosti glede na cesto bi bila ${f(mean(big, 'rel'))} %; na meji 13 %: ${big.filter(r => r.loss > 12.5).length}; klanec navzdol ob pristanku: ${big.filter(r => r.g < -1).length}`);
  for (const r of big.sort((a, b) => b.lossKmh - a.lossKmh).slice(0, 6)) console.log(`  s ${f(r.s, 0)} m: ${f(r.v, 0)} km/h, let ${f(r.air, 2)} s, klanec ${f(r.g)} %, vy ${f(r.vy, 2)} (glede na cesto ${f(r.vn, 2)}) m/s, izguba ${f(r.loss)} % = ${f(r.lossKmh)} km/h (glede na cesto bi ${f(r.rel)} %)`);
}
