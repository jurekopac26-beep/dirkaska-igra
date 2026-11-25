'use strict';
const path = require('path');
const ROOT = process.argv[2];
const { coreSource } = require(path.join(ROOT, 'tests', 'lib', 'core.js'));
const SIM = require(path.join(ROOT, 'tests', 'lib', 'sim.js'));
const s = coreSource();
const m = { exports: {} }, C = new Function('module', 'exports', 'require', s + '\n;return Core;')(m, m.exports, require);
C.setTest({ cv: 6 });
for (const tid of process.argv.slice(3)) {
  Math.random = SIM.seeded(71);
  const race = SIM.makeRace(C, tid, (C2, tt) => Object.assign(SIM.SETUPS.race.opts(C2, tt, 'cs'), { seed: 3 }));
  const T = race.track;
  console.log(tid, 'open', !!T.open, 'len', T.len.toFixed(0), 'w', T.w, 'fl', !!race.fl, 'opts.flags', race.opts.flags, 'laps', race.opts.laps, 'cars', race.cars.length, 'barrier', !!T.def.barrier, 'wa', !!T.wa);
}
