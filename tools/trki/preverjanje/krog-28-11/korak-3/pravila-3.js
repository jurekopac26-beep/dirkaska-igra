'use strict';
// korak 3 (pravila-3), krog 28. 11.: nadzorovan poskus. Tekmec, izločen (Race.retire) v boksu v fazi <faza>; pri 'repair' je preostanek popravila <ostanek> s.
// Izpiše premik izločenega avta v 45 s, ali ga prestavijo redarji (_parkRetired) in kje obstoji. Isti avto in isti trenutek na veji in na main.
// Zagon: TRKI_MAIN=<drevo main> node pravila-3.js <veja|main> <proga> <seme> <faza: repair|done|...> <ostanek s> <cv> <v = podrobno> <avto>
const { SNAP, MAIN, load } = require('../../krog-25-11/fizika/lib.js');
const root = process.argv[2] === 'main' ? MAIN : SNAP, tid = process.argv[3] || 'kagerod', seed = +(process.argv[4] || 9), phase = process.argv[5] || 'repair', rem = +(process.argv[6] || 5), cv = +(process.argv[7] || 6), verbose = process.argv[8] === 'v', only = process.argv[9] != null ? +process.argv[9] : -1;
const { C, SIM } = load(root), DT = SIM.DT, seeded = SIM.seeded;
const ALL = C.MODELS.map(m => m.id), T = new C.Track(C.TRACKS.find(d => d.id === tid));
C.setTest(root === MAIN ? {} : { cv });
const r = new C.Race(T, { numAI: 12, playerGrid: 13, laps: 3, playerModel: C.MODELS[4], assist: 2, seed, difficulty: 1, damage: 2, wheelRule: ALL }); r.start();
const P = r.player, AI = r.cars.filter(c => !c.isPlayer), idx = (c) => r.cars.indexOf(c);
const ph = (c) => c.inPit ? (c.pitState || (c.pitDone ? 'doneflag' : 'lane')) : 'track';
let who = null, t0 = 0, x0 = 0, z0 = 0, line = [], last = -1, parkT = -1, px = 0, pz = 0, maxJump = 0, wasStop = false, outT = -1;
for (let k = 0; k < 120 * 200; k++) {
  Math.random = seeded(1000 + k);
  const t = r.time;
  if (r.state === 'racing' && t >= 8) for (const c of AI) if (!(c.wreck && c.wreck.dnf) && !c.finished && !c.pitDone) c.pitWant = true;
  if (!who) for (const c of AI) { if (ph(c) === phase && (only < 0 || idx(c) === only)) { who = c; if (phase === 'repair' && rem >= 0) c.pitT = c.pitDur - rem; r.retire(c); t0 = t; x0 = c.x; z0 = c.z; px = c.x; pz = c.z;
    console.log((root === MAIN ? 'MAIN' : 'VEJA cv ' + cv), tid, 'seme', seed, '| izlocen avto', idx(c), c.m.id, 'v fazi', phase, 't', t.toFixed(1), 'pitT', (c.pitT || 0).toFixed(1), 'pitDur', (c.pitDur || 0).toFixed(1), 'd', c.q.d.toFixed(1), 'dmg', c.dmg.toFixed(2)); break; } }
  if (!r.isOut(P)) C.aiControl(P, r, DT);
  r.step(DT);
  if (who) { const c = who, W = c.wreck, j = Math.hypot(c.x - px, c.z - pz); if (j > maxJump) maxJump = j; if (j > 1 && parkT < 0) parkT = r.time - t0; px = c.x; pz = c.z;
    if (W.stop && !wasStop) { wasStop = true; line.push('[stop ob ' + (r.time - t0).toFixed(1) + ' s, premik ' + Math.hypot(c.x - x0, c.z - z0).toFixed(1) + ' m, d ' + c.q.d.toFixed(1) + ', inPit ' + !!c.inPit + ']'); }
    if (!c.inPit && outT < 0) { outT = r.time - t0; line.push('[zapusti bokse ob ' + outT.toFixed(1) + ' s]'); }
    const sec = Math.floor(r.time - t0); if (verbose && sec !== last && sec % 2 === 0) { last = sec; line.push(sec + 's:' + ph(c) + ' v' + c.speed.toFixed(1) + ' m' + Math.hypot(c.x - x0, c.z - z0).toFixed(1) + ' cr' + W.cr.toFixed(1) + (W.stop ? ' S' : '')); }
    if (r.time - t0 > 45) { console.log('  => premik', Math.hypot(c.x - x0, c.z - z0).toFixed(1), 'm | faza', ph(c), '| stop', !!W.stop, '| d', c.q.d.toFixed(1), '| najvecji skok v koraku', maxJump.toFixed(2), 'm', parkT >= 0 ? '(prestavljen ob ' + parkT.toFixed(1) + ' s)' : '(brez prestavitve)', '| v', c.speed.toFixed(2)); console.log('  ' + line.join(' ')); break; } }
}
if (!who) console.log('ni avta v fazi', phase);
