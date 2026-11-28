'use strict';
// (4) ponovni zagon in menjava proge: ista dirka veckrat v istem procesu (tudi z istim objektom Track kot v igri getTrack), vmes druga
// proga, druga razlicica trkov (cv 1), spletni nacin; zgoscena vrednost CELEGA stanja (SIM.raceState) vsakih 120 korakov.
const crypto = require('crypto'); const { SNAP, load } = require('../fizika/lib.js');
const { C, SIM } = load(SNAP);
const TR = (process.env.TRACKS || 'kotor,killar,koli,spa').split(','), SECS = +(process.env.SECS || 60), OPTS = JSON.parse(process.env.OPTS || '{}'), SET = process.env.SETUP || 'crash';
const real = () => { C.setCrash({ glass: 1 }); C.setTest({ cv: 6 }); };
function run(T, tid, setup, solo, secs, extra) {
  const SU = SIM.SETUPS[setup]; Math.random = SIM.seeded(7);
  const race = new C.Race(T, Object.assign(SU.opts(C, solo ? true : !!T.def.timeTrial, 'cs', tid), OPTS, extra || {})); race.start();
  const h = crypto.createHash('sha1'), n = Math.round(secs / SIM.DT); let nan = 0;
  for (let k = 0; k < n; k++) { SIM.stepRace(C, race, k, solo ? null : SU.drive); if (k % 120 === 119 || k === n - 1) h.update(SIM.raceState(race)); }
  for (const c of race.cars) for (const v of [c.x, c.z, c.h, c.vx, c.vz, c.w]) if (!Number.isFinite(v)) nan++;
  const dm = race.cars.filter(c => (c.dmg || 0) > 0).length, dn = race.cars.filter(c => c.dnf || c.retired || c.out).length;
  return { hash: h.digest('hex').slice(0, 12), txt: `avtov ${race.cars.length} posk ${dm} izlocenih ${dn} delov ${(race.debris || []).length} NaN ${nan}` };
}
const mkT = (tid) => new C.Track(C.TRACKS.find(d => d.id === tid));
const eq = (a, b) => a.hash === b.hash ? 'ENAKO' : 'RAZLICNO ' + b.hash + ' (' + b.txt + ')';
for (const tid of TR) {
  const other = tid === 'montreal' ? 'seoul' : 'montreal';
  real(); const T = mkT(tid);
  const S1 = run(T, tid, 'race', true, 30);
  const A = run(T, tid, SET, false, SECS);
  const S2 = run(T, tid, 'race', true, 30);
  run(mkT(other), other, 'formula', false, 20);
  const B = run(mkT(tid), tid, SET, false, SECS);
  const Cc = run(T, tid, SET, false, SECS);
  C.setTest({ cv: 1 }); const D1 = run(T, tid, SET, false, 20);
  C.setCrash({ net: 1 }); C.setTest({}); run(T, tid, SET, false, 20);
  C.setCrash({ glass: 1 }); C.setTest({ cv: 6, deb: 0, pull: 0, tf: 2 }); run(T, tid, SET, false, 20);
  real(); const E = run(T, tid, SET, false, SECS);
  const S3 = run(T, tid, 'race', true, 30);
  C.setTest({ cv: 1 }); const D2 = run(T, tid, SET, false, 20);
  console.log(`${tid} A ${A.hash} (${A.txt}) | nova Track po drugi progi: ${eq(A, B)} | ista Track: ${eq(A, Cc)} | po cv1, spletu, stikalih: ${eq(A, E)} | sam pred ${S1.hash} po trku: ${eq(S1, S2)} na koncu: ${eq(S1, S3)} | cv1 20 s dvakrat: ${eq(D1, D2)}`);
}
