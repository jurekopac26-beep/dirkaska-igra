// The car ahead in for its stop (104, Core only, no browser; the team radio's part: tests/browser/pitahead.test.mjs). Race.pitNext: a
// rival's next stop as its plan has it (the lap whose way in comes next, the metres to it; now: it has asked for the pits or its strategy
// has the stop on that lap; next: a lap later); in a strategy race on Bathurst every rival's stop was foretold 200 m before its way in, and
// none foretold that did not come. Race.pitDuel: the seconds the undercut and the overcut gain on the car ahead by the tyres (worn against
// fresh, a softer compound against a harder one), the same for the same state, no random draws.
//   node tests/pitahead.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : String(x));
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 4, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, tyres: true, compounds: true, strat: true, radio: true }, o);

// 1. the plan foretold: every rival's stop (its way into the lane) was 'now' 200 m before that way in; every 'now' 200 m before a way in
// was a stop there
const T = new C.Track(C.TRACKS.find(d => d.id === 'bathurst'));
{
  Math.random = seeded(3);
  const r = new C.Race(T, opts({})); r.start();
  const P = r.player, seen = new Map(), stops = [], told = []; let t = 0, k = 0;
  while (t < 760 && !r.cars.every(c => c.finished || r.isOut(c))) {
    Math.random = seeded(5000 + (++k));
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    for (const c of r.cars) {
      if (c === P) continue;
      const s = seen.get(c) || { n: -1, lane: false }, q = r.pitNext(c);
      if (q && q.to <= 200 && q.to > 150 && s.n !== q.n) { s.n = q.n; told.push({ c, n: q.n, now: q.now }); }
      if (c.inPit && !s.lane) stops.push({ c, n: s.n });
      s.lane = c.inPit; seen.set(c, s);
    }
  }
  const miss = stops.filter(x => !told.some(y => y.c === x.c && y.n === x.n && y.now)), wrong = told.filter(y => y.now && !stops.some(x => x.c === y.c && x.n === y.n));
  check('a strategy race: every rival\'s stop foretold 200 m before its way in (pitNext now), none foretold that did not come', stops.length >= 5 && !miss.length && !wrong.length,
    `${stops.length} stops, ${told.filter(y => y.now).length} foretold` + (miss.length ? '; missed ' + miss.map(x => x.c.name + ' lap ' + x.n).join(', ') : '') + (wrong.length ? '; wrong ' + wrong.map(x => x.c.name + ' lap ' + x.n).join(', ') : ''));
  check('none for the player, nor once at the line', r.pitNext(P) === null && r.cars.filter(c => c.finished).every(c => r.pitNext(c) === null), '');
}

// 2. the duel by the stops on made-up tyres (a race on Bathurst a lap in, so a lap's time is known): the player 1.5 s behind the car ahead
{
  Math.random = seeded(3);
  const r = new C.Race(T, opts({})); r.start();
  let k = 0; while (r.player.lap < 2 && k < 120 * 300) { Math.random = seeded(9000 + (++k)); C.aiControl(r.player, r, DT); r.step(DT); }
  const P = r.player, A = r.cars.find(c => c !== P && c.st);
  const set = (c, cmp, wear, next) => { c.ty.k = 'dry'; c.ty.c = cmp; c.ty.wear = wear; c.ty.w4 = null; if (c.st && next) { c.st.seq = c.st.hist.concat([next]); } };
  P.pitCmp = 'M'; set(P, 'M', 0.5); set(A, 'M', 0.5, 'M');
  const even = r.pitDuel(P, A);
  set(P, 'M', 0.1); set(A, 'M', 0.7, 'M');
  const worn = r.pitDuel(P, A);
  P.pitCmp = 'S'; set(P, 'S', 0.05); set(A, 'M', 0.5, 'H');
  const soft = r.pitDuel(P, A), again = r.pitDuel(P, A);
  check('the same worn tyres and the same new ones on both: the undercut gains what the new set is faster, the overcut loses it', even.under > 0.3 && Math.abs(even.over + even.under) < 1e-9,
    `under ${f2(even.under)} s, over ${f2(even.over)} s`);
  check('the car ahead on far more worn tyres: the undercut gains more', worn.under > even.under + 0.5, `under ${f2(worn.under)} s`);
  check('the player on fresh softs, the car ahead going onto hards: the overcut gains', soft.over > 1.5, `over ${f2(soft.over)} s, under ${f2(soft.under)} s`);
  check('the same state twice: the same', JSON.stringify(soft) === JSON.stringify(again), '');
  const N = new C.Race(T, opts({ tyres: false, compounds: false, strat: false })), Q = new C.Race(T, opts({ radio: false }));
  check('no tyres or no race clock (no team radio): none', N.pitDuel(N.player, N.cars[0]) === null && Q.pitDuel(Q.player, Q.cars[0]) === null, '');
}

console.log(`\n${n - bad}/${n} passed`);
process.exit(bad ? 1 : 0);
