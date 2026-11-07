// The pit stops of the race (107, Core only, no browser; the results' table and the HUD's notice: tests/browser/pitstats.test.mjs): every
// stop made in the pits is logged (Race pst.log: the car, the lap whose way in it took, the time standing in the box, the time in the pit
// lane from its line in to its line out, the new set; none for a stop that keeps the set on), in the order made; Race.fastestStop the
// shortest in the lane (the earliest of equal ones); the same race twice the same log to the last bit; none in a race without stops.
//   node tests/pitstats.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const T = new C.Track(C.TRACKS.find(d => d.id === 'bathurst'));

// a long race on Bathurst (4 laps, strategies, tyres and compounds); the player in at the end of its second lap. Each car's stops as they
// happen (the step its repair starts: pitDur; the step it is done: the set on it)
function race() {
  Math.random = seeded(3);
  const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 4, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, tyres: true, compounds: true, strat: true });
  r.start(); const P = r.player, seen = [], inT = new Map(); let t = 0, k = 0, asked = false, hb = null; const was = new Map(), lane = new Map();
  while (t < 760 && !r.cars.every(c => c.finished || r.isOut(c))) {
    Math.random = seeded(5000 + (++k));
    if (!asked && P.lap >= 2 && !T.pitAt(P.q.s)) { asked = true; P.pitWant = true; }
    if (P.inPit && P.pitDone && !hb) { const p1 = T.pitAt(P.q.s + Math.max(12, P.speed * 1.3)); if (!p1 || (p1.gap && p1.o <= p1.wall + 1)) hb = t; }
    if (hb != null) P.pitWant = false;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    for (const c of r.cars) {
      const w = was.get(c), l = lane.get(c);
      if (c.inPit && !l) inT.set(c, r.time);
      if (c.pitState === 'done' && w === 'repair') seen.push({ c, t: c.pitDur, ty: c.ty.k === 'wet' ? 'W' : c.ty.c, lap: Math.floor((c.dist - T.def.pit[1]) / T.len), in: inT.get(c), lane: null });
      if (!c.inPit && l) { const e = seen.filter(x => x.c === c).pop(); if (e && e.lane == null) e.lane = r.time - e.in; }
      was.set(c, c.pitState); lane.set(c, !!c.inPit);
    }
  }
  return { r, seen };
}

const A = race(), L = A.r.pst.log;
{
  check('every stop logged, in the order made: the car, its time in the box and in the lane, the new set, the lap of its way in', L.length >= 5 && L.length === A.seen.length &&
    L.every((e, i) => e.c === A.seen[i].c && e.t === A.seen[i].t && e.ty === A.seen[i].ty && e.lap === Math.max(1, A.seen[i].lap) && e.lap >= 1 && e.lap < A.r.laps && e.t > 1 && e.t < 40 &&
      Math.abs(e.lane - A.seen[i].lane) < 1e-6 && e.lane > e.t + 5 && e.lane < 90),
    `${L.length} stops: ` + L.map(e => `${e.c.isPlayer ? 'YOU' : e.c.name} L${e.lap} ${e.lane != null ? e.lane.toFixed(1) : '-'} (${e.t.toFixed(1)}) s ${e.ty}`).join(', '));
  check('the player\'s stop among them', L.filter(e => e.c === A.r.player).length === 1, '');
  const f = A.r.fastestStop(), min = Math.min(...L.map(e => e.lane)), d = new Set(L.map(e => e.lane.toFixed(2))).size;
  check('the fastest stop: the shortest in the lane, the earliest of equal ones; the stops\' lane times not all the same', !!f && f.lane === min && L.indexOf(f) === L.findIndex(e => e.lane === min) && d >= 3,
    `${f && f.c.name} ${f && f.lane.toFixed(2)} s, ${d} different times`);
}
{
  const B = race();
  check('the same race twice: the same log', JSON.stringify(L.map(e => [e.c.name, e.lap, e.t, e.lane, e.ty, e.at])) === JSON.stringify(B.r.pst.log.map(e => [e.c.name, e.lap, e.t, e.lane, e.ty, e.at])), '');
}
{
  const r = new C.Race(T, { numAI: 3, playerGrid: 4, laps: 2, playerModel: C.MODELS[4], phys: 'cs', seed: 5 });
  check('a race without stops: an empty log, no fastest stop', r.pst.log.length === 0 && r.fastestStop() === null, '');
}

console.log(`\n${n - bad}/${n} passed`);
process.exit(bad ? 1 : 0);
