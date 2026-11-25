// NALOGA A, dodatek: vrnjeno kolo na zmečkanem vogalu ob naslednjem udarcu; tekmec z dvema kolesoma. node a-ponovno.js <cv>
'use strict';
const ROOT = process.env.TRKI_SNAP || require('path').join(__dirname, '..', '..', '..', '..', '..');
const { loadCore } = require(ROOT + '/tests/lib/core.js');
const { DT, seeded } = require(ROOT + '/tests/lib/sim.js');
const CV = +(process.argv[2] || 6);
const C = loadCore(); C.setTest({ cv: CV });
const f = (v, d = 2) => v == null || !Number.isFinite(v) ? String(v) : v.toFixed(d);
const st = (c) => ({ dmg: +f(c.dmg, 3), cd: c.cd.map(x => +f(x, 2)), wl: c.wreck && c.wreck.wl, nL: c.wreck && c.wreck.nL, fix: c.wreck && c.wreck.fix, hold: c.wreck && +f(c.wreck.hold, 2), dnf: c.wreck && c.wreck.dnf, wreck: !!(c.wreck && c.wreck.on), v: +f(c.speed, 1) });
function race(tid, model, opts) {
  const T = new C.Track(C.TRACKS.find(d => d.id === tid)); Math.random = seeded(21);
  const r = new C.Race(T, Object.assign({ numAI: 4, playerGrid: 5, laps: 2, playerModel: C.MODELS.find(m => m.id === model), assist: 2, seed: 21, difficulty: 1, damage: 2 }, opts));
  r.start(); let k = 0; r._run = (sec) => { for (let i = 0; i < sec / DT; i++) { Math.random = seeded(21000 + ++k); if (!r.isOut(r.player)) C.aiControl(r.player, r, DT); r.step(DT); } };
  return r;
}
const kFR = (c) => C.applyDamage(c, 0.04, c.m.len * 0.5, c.m.wid * 0.5), kFL = (c) => C.applyDamage(c, 0.04, c.m.len * 0.5, -c.m.wid * 0.5);
console.log('== cv ' + CV + ' (' + C.KV_IDS[C.TX.cv] + '), sacalobra, jelen, Vklop, brez pravila');
{
  const r = race('sacalobra', 'jelen', {}); const P = r.player, A = r.cars.find(c => !c.isPlayer && c.wreck);
  r._run(10);
  let n = 0; while (!A.wreck.nL && n < 200) { kFR(A); n++; } let m = 0; while (!P.wreck.nL && m < 200) { kFR(P); m++; }
  console.log('kolo odpade: tekmec po', n, JSON.stringify(st(A)), '| igralec po', m, JSON.stringify(st(P)));
  r._run(2); r.rescue(P); r._run(9);
  console.log('po namestitvi, +11 s: tekmec', JSON.stringify(st(A)), '| igralec', JSON.stringify(st(P)));
  // en sam udarec 4 % v isti vogal
  kFR(A); kFR(P);
  console.log('en udarec 4 % v isti vogal: tekmec', JSON.stringify(st(A)), '| igralec', JSON.stringify(st(P)));
  r._run(1); console.log('+1 s: tekmec', JSON.stringify(st(A)));
  r._run(1); console.log('+2 s: tekmec', JSON.stringify(st(A)));
  r._run(7); console.log('+9 s: tekmec', JSON.stringify(st(A)), 'isOut', r.isOut(A));
}
{
  // tekmec: drugo kolo odpade, ko je prvo še na tleh
  const r = race('sacalobra', 'jelen', {}); const A = r.cars.find(c => !c.isPlayer && c.wreck);
  r._run(10);
  let n = 0; while (!A.wreck.nL && n < 200) { kFR(A); n++; }
  let m = 0; while (A.wreck.nL < 2 && m < 200 && !A.wreck.on) { kFL(A); m++; }
  console.log('\ntekmec, drugo kolo (sprednje levo) po', m, 'udarcih:', JSON.stringify(st(A)));
  r._run(0.1); console.log('+0,1 s:', JSON.stringify(st(A)), 'isOut', r.isOut(A), 'retired', !!A.retired, 'dnf', !!(A.wreck && A.wreck.dnf));
  r._run(3); console.log('+3,1 s:', JSON.stringify(st(A)), 'isOut', r.isOut(A), 'retired', !!A.retired);
}
