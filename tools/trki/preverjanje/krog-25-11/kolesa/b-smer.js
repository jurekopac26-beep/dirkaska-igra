// NALOGA B: smer naletov na igralca (Sa Calobra, seme 81). node b-smer.js <cv>
const ROOT = process.env.TRKI_SNAP || require('path').join(__dirname, '..', '..', '..', '..', '..');
const { loadCore } = require(ROOT + '/tests/lib/core.js');
const SIM = require(ROOT + '/tests/lib/sim.js');
const cv = +(process.argv[2] || 6), seed = 81, DT = SIM.DT, f = (v, n = 2) => (+v).toFixed(n);
const C = loadCore(); C.setTest({ cv }); Math.random = SIM.seeded(seed);
const race = SIM.makeRace(C, 'sacalobra', (C2, tt) => Object.assign(SIM.SETUPS.race.opts(C2, tt, 'cs'), { seed: seed - 68 }));
const P = race.player, T = race.track; let k = 0;
const N = Math.round(39.2 / DT);
let tan0 = null;
for (; k < N;) {
  k++; for (const c of race.cars) { c.hitWall = 0; c.hitCar = 0; c.hitDebris = 0; }
  const b = { vx: P.vx, vz: P.vz, w: P.w, h: P.h, x: P.x, z: P.z };
  const rb = race.cars.map(c => ({ x: c.x, z: c.z, vx: c.vx, vz: c.vz, h: c.h }));
  SIM.stepRace(C, race, k); const t = k * DT; if (t < 36.75) continue;
  const ch = Math.cos(b.h), sh = Math.sin(b.h);
  const loc = (dx, dz) => [dx * ch + dz * sh, -dx * sh + dz * ch];   // [naprej, desno]
  if (k % 30 === 0) {
    const q = P.q; if (!tan0) tan0 = [q.tx, q.tz];
    const turn = Math.atan2(tan0[0] * q.tz - tan0[1] * q.tx, tan0[0] * q.tx + tan0[1] * q.tz) * 180 / Math.PI;   // zasuk tangente od 36,75 s (+ = v smeri x→z)
    const nsg = q.nx * -q.tz + q.nz * q.tx;   // normala = tangenta zasukana x→z (+1) ali obratno (-1)
    console.log(`  t ${f(t)} s ${f(q.s, 1)} d ${f(q.d)} v ${f(P.speed, 1)} st ${f(P.inSteer)} thr ${f(P.inThr)} w ${f(P.w, 2)} wPath ${f(P.wPath || 0, 2)} tangenta ${f(turn, 0)} st. normala ${f(nsg, 0)} h ${f(P.h * 180 / Math.PI, 0)} st.`);
  }
  if (P.hitCar > 3 || P.hitWall > 1) {
    const dv = loc(P.vx - b.vx, P.vz - b.vz);
    const who = race.cars.map((c, i) => ({ c, i })).filter(o => o.c !== P && o.c.hitCar > 0.3 && Math.hypot(o.c.x - P.x, o.c.z - P.z) < 7).map(o => {
      const r0 = rb[o.i], p = loc(r0.x - b.x, r0.z - b.z), rv = loc(r0.vx - b.vx, r0.vz - b.vz);
      const dh = ((r0.h - b.h) * 180 / Math.PI % 360 + 540) % 360 - 180;
      return `#${o.i} ${o.c.m.id} mesto [naprej ${f(p[0], 1)}, desno ${f(p[1], 1)}] rel. hitrost [naprej ${f(rv[0], 1)}, desno ${f(rv[1], 1)}] smer ${f(dh, 0)} st. hitC ${f(o.c.hitCar)} thr ${f(o.c.inThr)}`;
    });
    console.log(`* t ${f(t)} hitC ${f(P.hitCar)} hitW ${f(P.hitWall)} dv [naprej ${f(dv[0])}, desno ${f(dv[1])}] dw ${f(P.w - b.w, 2)} w ${f(P.w, 2)} dmg ${f(P.dmg)} | ${who.join(' ; ')}`);
  }
}
