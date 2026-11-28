// NALOGA B: kdaj avto obstane in kako se ob ograji se premika (Sa Calobra, seme 81). node b-cas.js <cv>
const path = require('path');
const ROOT = process.env.TRKI_SNAP || require('path').join(__dirname, '..', '..', '..', '..', '..');
const { loadCore } = require(path.join(ROOT, 'tests/lib/core.js'));
const SIM = require(path.join(ROOT, 'tests/lib/sim.js'));
const cv = +(process.argv[2] || 6), seed = 81, tid = 'sacalobra';
const DT = SIM.DT, f = (v, n = 2) => v == null ? '-' : (+v).toFixed(n);
const C = loadCore(); C.setTest({ cv });
Math.random = SIM.seeded(seed);
const race = SIM.makeRace(C, tid, (C2, tt) => Object.assign(SIM.SETUPS.race.opts(C2, tt, 'cs'), { seed: seed - 68 }));
const P = race.player; let k = 0;
const N = Math.round(120 / DT);
let x0 = null, z0 = null, h0 = null;
for (; k < N;) {
  k++; for (const c of race.cars) { c.hitWall = 0; c.hitCar = 0; c.hitDebris = 0; }
  SIM.stepRace(C, race, k);
  const t = k * DT;
  if (t >= 39 && (Math.abs(t - Math.round(t)) < DT / 2) && (t <= 46 || Math.round(t) % 5 === 0)) {
    const q = P.q, ang = Math.atan2(Math.cos(P.h) * q.nx + Math.sin(P.h) * q.nz, Math.cos(P.h) * q.tx + Math.sin(P.h) * q.tz) * 180 / Math.PI;
    if (x0 == null && t >= 40) { x0 = P.x; z0 = P.z; h0 = P.h; }
    const dd = x0 == null ? 0 : Math.hypot(P.x - x0, P.z - z0), dh = h0 == null ? 0 : (P.h - h0) * 180 / Math.PI;
    console.log(`t ${f(t, 0)} s ${f(q.s, 2)} d ${f(q.d)} bl ${f(q.bl)} v ${f(P.speed, 3)} kot do proge ${f(ang, 1)} h ${f(P.h * 180 / Math.PI, 1)} premik od 40 s ${f(dd, 2)} m zasuk ${f(dh, 1)} thr ${f(P.inThr)} st ${f(P.inSteer)} dmg ${f(P.dmg)} stuckT ${f(P.stuckT, 1)} hitW ${f(P.hitWall, 3)} hitC ${f(P.hitCar, 2)}`);
  }
}
