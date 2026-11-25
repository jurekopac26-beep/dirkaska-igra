'use strict';
// Ali dve drevesi vozita do stevke enako? node enako.js <drevo> <cv ali -> <nabor: crash|formula|sam> <proge,...> <sekund> [gibanje]
// sam: en sam avto (samovoznik, brez tekmecev); gibanje: zgoscena vrednost samo iz x, z, h, vx, vz, w, gear (za primerjavo z main, ki nima vseh polj veje)
const path = require('path'), crypto = require('crypto');
const root = path.resolve(process.argv[2]), cv = process.argv[3], set = process.argv[4], tracks = process.argv[5].split(','), secs = +process.argv[6], mot = process.argv[7] === 'gibanje';
const { loadCore } = require(path.join(root, 'tests', 'lib', 'core.js')), SIM = require(path.join(root, 'tests', 'lib', 'sim.js'));
const C = loadCore(root); if (cv !== '-') C.setTest({ cv: +cv });
const num = (v) => Object.is(v, -0) ? '-0' : String(v);
for (const tid of tracks) {
  Math.random = SIM.seeded(7);
  const SU = SIM.SETUPS[set === 'sam' ? 'race' : set];
  const race = SIM.makeRace(C, tid, (C2, tt, t) => set === 'sam' ? Object.assign(SU.opts(C2, true, 'cs', t), { numAI: 0, playerGrid: 1 }) : SU.opts(C2, tt, 'cs', t));
  const h = crypto.createHash('sha1'), n = Math.round(secs / SIM.DT); let dot = 0;
  const st = () => mot ? race.cars.map((c) => [c.x, c.z, c.h, c.vx, c.vz, c.w, c.gear].map(num).join(',')).join('|') : SIM.raceState(race);
  for (let K = 0; K < n; K++) { SIM.stepRace(C, race, K, SU.drive); for (const c of race.cars) if (c.hitWall > 0) dot++; if (mot || K % 60 === 0) h.update(st()); }
  h.update(st()); const p = race.player || race.cars[0];
  console.log(tid, set, 'cv', cv, 'avtov', race.cars.length, 'korakovZDotikomOgraje', dot, 'pot', p.q ? +p.q.s.toFixed(1) : '-', h.digest('hex').slice(0, 16));
}
