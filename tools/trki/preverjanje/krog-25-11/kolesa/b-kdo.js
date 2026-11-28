// NALOGA B: kdo zadene igralca v serpentini (Sa Calobra, seme 81). node b-kdo.js <cv>
const ROOT = process.env.TRKI_SNAP || require('path').join(__dirname, '..', '..', '..', '..', '..');
const { loadCore } = require(ROOT + '/tests/lib/core.js');
const SIM = require(ROOT + '/tests/lib/sim.js');
const cv = +(process.argv[2] || 6), seed = 81, DT = SIM.DT, f = (v, n = 2) => (+v).toFixed(n);
const C = loadCore(); C.setTest({ cv }); Math.random = SIM.seeded(seed);
const race = SIM.makeRace(C, 'sacalobra', (C2, tt) => Object.assign(SIM.SETUPS.race.opts(C2, tt, 'cs'), { seed: seed - 68 }));
const P = race.player; let k = 0;
const N = Math.round(40 / DT);
for (; k < N;) { k++; for (const c of race.cars) { c.hitWall = 0; c.hitCar = 0; c.hitDebris = 0; } SIM.stepRace(C, race, k); const t = k * DT; if (t < 36.5) continue;
  if (P.hitCar > 0.3 || P.hitWall > 0.3 || k % 60 === 0) {
    const near = race.cars.filter(c => c !== P && Math.hypot(c.x - P.x, c.z - P.z) < 7).map(c => `#${race.cars.indexOf(c)} ${c.m.id} r ${f(Math.hypot(c.x - P.x, c.z - P.z), 1)} v ${f(c.speed, 1)} hitC ${f(c.hitCar)} thr ${f(c.inThr)} brk ${f(c.inBrk)} dmg ${f(c.dmg)}`);
    console.log(`t ${f(t)} P v ${f(P.speed, 1)} d ${f(P.q.d)} hitC ${f(P.hitCar)} hitW ${f(P.hitWall)} dmg ${f(P.dmg)} pos ${P.pos != null ? P.pos : '-'} | ` + near.join(' ; '));
  }
}
