'use strict';
// skrajni vhodi trka dveh avtov (cv 6): sovpadajoci sredisci, nicelna relativna hitrost, zelo velika hitrost; NaN/Infinity, locitev v nekaj klicih
const { SNAP, load } = require('./lib.js');
const { C, handling } = load(process.env.ROOT || SNAP); C.setTest({ cv: process.env.CV != null ? +process.env.CV : 6 });
const H = handling(C, 'cs'), ids = C.MODELS.filter(m => !m.trailer).map(m => m.id);
const fin = (c) => [c.x, c.z, c.h, c.vx, c.vz, c.w, c.dmg || 0, c.csKc || 0, c.xgl || 0].every(Number.isFinite);
const mk = (id, S, pl) => { const c = Object.assign(H.mkCar(id, { v: 0 }), { isPlayer: !!pl }); c.place(S.x, S.z, S.h); c.vx = S.vx; c.vz = S.vz; c.w = S.w || 0; return c; };
const E = (c) => 0.5 * c.m.mass * (c.vx * c.vx + c.vz * c.vz) + 0.5 * c.I * c.w * c.w;
const cases = [];
for (const [ia, ib] of [['formula', 'formula'], [ids[0], ids[1]], ['kamen', 'mravlja'], ['mravlja', 'kamen']]) {
  if (!ids.includes(ia) || !ids.includes(ib)) continue;
  for (const dh of [0, Math.PI / 2, Math.PI, 1e-9]) for (const [va, vb] of [[0, 0], [30, 30], [30, -30], [150, -150], [300, 0], [1e-12, -1e-12]]) for (const off of [0, 1e-12, 1e-6, 0.5])
    cases.push({ ia, ib, dh, va, vb, off });
}
let nan = 0, stuck = 0, eUp = 0, eUpMax = 0, dPmax = 0, n = 0, wMax = 0, vMaxAfter = 0, worst = null;
for (const q of cases) { n++;
  const a = mk(q.ia, { x: 0, z: 0, h: 0, vx: q.va, vz: 0 }, true), b = mk(q.ib, { x: q.off, z: 0, h: q.dh, vx: q.vb, vz: 0 }, false);
  let bad = false, sepAt = -1; const e0 = E(a) + E(b), p0 = a.m.mass * a.vx + b.m.mass * b.vx, v0 = Math.max(Math.abs(q.va), Math.abs(q.vb));
  for (let k = 0; k < 240; k++) { C.carCollide(a, b); if (!fin(a) || !fin(b)) { bad = true; break; }
    if (k === 0) { const e1 = E(a) + E(b), dp = Math.abs(a.m.mass * a.vx + b.m.mass * b.vx - p0); if (e1 - e0 > 1e-4) { eUp++; eUpMax = Math.max(eUpMax, e1 - e0); } dPmax = Math.max(dPmax, dp); wMax = Math.max(wMax, Math.abs(a.w), Math.abs(b.w)); const vm = Math.max(Math.hypot(a.vx, a.vz), Math.hypot(b.vx, b.vz)); if (vm - v0 > vMaxAfter) { vMaxAfter = vm - v0; worst = Object.assign({ vPo: +vm.toFixed(3) }, q); } }
    a.x += a.vx / 120; a.z += a.vz / 120; a.h += a.w / 120; b.x += b.vx / 120; b.z += b.vz / 120; b.h += b.w / 120;   // prosto gibanje med klici (brez pnevmatik)
    const d = Math.hypot(a.x - b.x, a.z - b.z); if (sepAt < 0 && d > a.circles[a.circles.length - 1] + b.circles[b.circles.length - 1] + a.rad + b.rad) sepAt = k; }
  if (bad) { nan++; if (nan < 4) console.log('NAN', JSON.stringify(q)); }
  else if (sepAt < 0 && (q.va !== q.vb || q.va === 0)) { stuck++; if (stuck < 6) console.log('NI LOCITVE v 2 s', JSON.stringify(q), 'razdalja', Math.hypot(a.x - b.x, a.z - b.z).toFixed(3), 'v', a.vx.toFixed(3), b.vx.toFixed(3)); }
}
console.log(JSON.stringify({ primerov: n, nan, brezLocitve2s: stuck, energijaGor1Klic: eUp, energijaGorMaxJ: +eUpMax.toFixed(3), dPmax1Klic: +dPmax.toExponential(2), wMax1Klic: +wMax.toFixed(3), najvecPridobljeneHitrosti: +vMaxAfter.toFixed(3), primer: worst }));
