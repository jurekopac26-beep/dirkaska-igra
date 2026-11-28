'use strict';
// (tf) Nastavitev »Trk s prometom« (TX.tf): vpliv samo pri Realistični (cv 6); pri drugih različicah mora biti vožnja do števke enaka
const { SNAP, load } = require('../fizika/lib.js');
const tid = process.argv[2] || 'chapman', seed = +(process.argv[3] || 5), bias = +(process.argv[4] || -2.5), tMax = +(process.argv[5] || 70);
const { C, SIM } = load(SNAP), DT = SIM.DT, seeded = SIM.seeded;
const def = C.TRACKS.find(d => d.id === tid), T = new C.Track(def), SOKOL = C.MODELS.find(m => m.id === 'sokol');
function run(tx, net) {
  C.setTest(tx);
  Math.random = seeded(seed);
  const r = new C.Race(T, { numAI: 1, playerGrid: 1, laps: 1, playerModel: SOKOL, assist: 2, seed, difficulty: 1, damage: 2, traffic: true }); r.start();
  const P = r.player; let h = 0, loose = 0, nan = 0, dmgT = null; const seen = new Set();
  if (net) for (const c of r.cars) if (c !== P) c.net = true;
  for (let k = 0; k < 120 * tMax; k++) {
    Math.random = seeded(1000 + k);
    P.laneBias = r.time > 6 ? bias : 0;
    if (!r.isOut(P)) C.aiControl(P, r, DT);
    r.step(DT);
    if (r.tf) for (const v of r.tf.veh) { if (v.st !== 0 && !seen.has(v)) { seen.add(v); loose++; } }
    if (dmgT == null && P.dmg > 0.01) dmgT = r.time;
    if (!Number.isFinite(P.x + P.z + P.h + P.vx + P.vz)) nan++;
    if (k % 12 === 0) { h = (h * 31 + Math.round(P.x * 1e6) + Math.round(P.z * 1e6) * 7 + Math.round(P.h * 1e6) * 13 + Math.round(P.dmg * 1e6) * 17) % 2147483647; if (r.tf) for (const v of r.tf.veh) h = (h * 31 + Math.round(v.x * 1e4) + Math.round(v.z * 1e4) * 3) % 2147483647; }
    if (r.isOut(P)) break;
  }
  return { h, loose, nan, dmg: +P.dmg.toFixed(3), dmgT: dmgT && +dmgT.toFixed(1), t: +r.time.toFixed(1), fin: !!P.finished, tf: !!r.tf, nveh: r.tf ? r.tf.veh.length : 0, pen: P.tfPen || 0, nL: P.wreck && P.wreck.nL };
}
console.log('proga', tid, 'seme', seed, 'odmik', bias);
for (const cv of [0, 5, 6]) for (const tf of [null, 1, 2]) { const o = run(cv ? { cv, tf } : { tf }); console.log('cv', cv, 'tf', tf, JSON.stringify(o)); }
