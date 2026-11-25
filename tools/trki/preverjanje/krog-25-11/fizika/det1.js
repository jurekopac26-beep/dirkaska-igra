'use strict';
// determinizem (cv 6): ista dirka z istim semenom dvakrat v istem procesu in v locenih procesih; zgoscena vrednost stanja vseh avtov vsakih 600 korakov
const crypto = require('crypto'); const { SNAP, load } = require('./lib.js');
const { C, SIM } = load(SNAP); C.setTest({ cv: 6 });
const TR = (process.env.TRACKS || 'spa,cusco,kotor').split(','), SETS = (process.env.SETS || 'crash,race').split(','), SECS = +(process.env.SECS || 40);
function run(tid, set) { const SU = SIM.SETUPS[set]; Math.random = SIM.seeded(7); const race = SIM.makeRace(C, tid, (C2, tt, t) => SU.opts(C2, tt, 'cs', t)); const h = crypto.createHash('sha1'), n = Math.round(SECS / SIM.DT); let nan = 0;
  for (let k = 0; k < n; k++) { SIM.stepRace(C, race, k, SU.drive); if (k % 600 === 599 || k === n - 1) for (const c of race.cars) { const v = [c.x, c.z, c.h, c.vx, c.vz, c.w, c.dmg || 0, c.progress || 0]; if (!v.every(Number.isFinite)) nan++; h.update(Float64Array.from(v)); } }
  return { hash: h.digest('hex').slice(0, 16), nan, cars: race.cars.length, dmg: +race.cars.reduce((a, c) => a + (c.dmg || 0), 0).toFixed(6), debris: (race.debris || []).length }; }
const out = [];
for (const tid of TR) for (const set of SETS) { const a = run(tid, set), b = run(tid, set); out.push(`${tid}/${set} ${a.hash} ${a.hash === b.hash ? 'enako' : 'RAZLICNO ' + b.hash} avtov ${a.cars} skoda ${a.dmg} nan ${a.nan}`); }
console.log(out.join('\n'));
