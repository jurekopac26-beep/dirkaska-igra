// The menu's Opponents (0..100 rivals in a race of the player's own, js/menu.js rivSheet, game.js rivSet: S.rivals, at most the track's
// def.maxRivals) on every real track with a race (no browser): with as many rivals as the track takes (its def.maxRivals, else 100) and
// every vehicle's field bigger than the one the game always gave the track (the player's car decides what the rivals drive: the longest,
// the formula's 5.2 m; a big vehicle's field fewer, Core.fieldSize, its own as ever: tests/grid.test.js):
//   1. the start: a circuit's grid (two staggered columns, 9 + 7.5 m a slot, the last ~760 m behind the line), no two cars on each other,
//      every car on the asphalt behind the line; a flying start (an open road, the Nordschleife: Race._flyColumn) the same once it rolls
//   2. an open road's finish: a slot past the line for every car, none past the end of the road (one at most), none on another, none by
//      the barrier (Pikes Peak's summit, the second row of a few roads' parking: their def.maxRivals)
//   3. the field the player chose stays (opts.numSet): fewer than a track's own def.rivals (the Nordschleife's 20), none (0: alone, a run
//      against the clock); without it the track's own field as before; 100 rivals: 101 cars, every one a name and a number of its own
//   4. the race: Trois-Rivières (the shortest circuit) with 100 rivals from the back of the grid and Tianmen (a narrow mountain road) with
//      100 from a flying start, 20 s on the autopilot: no NaN, nobody stuck; a race alone (0 rivals) on Spa to its finish: one car home
// Test tracks (def.test) are left out.
//   node tests/rivals-n.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const model = (id) => C.MODELS.find(m => m.id === id);
const RIV_MAX = 100;   // (game.js RIV_MAX: the most the menu's Opponents offers)
const raced = (d) => !d.timeTrial || (d.modes || []).indexOf('race') >= 0;   // (a track with a race: not a time trial alone)
const tracks = C.TRACKS.filter(d => !d.test && raced(d));
const maxOf = (d) => Math.min(RIV_MAX, d.maxRivals || RIV_MAX);
const PMS = C.MODELS.filter(m => !m.retired);   // (every vehicle the player can drive: its field)

// two cars' boxes (centre, heading, length, width) on each other: overlapping in the plan and less than 1.5 m apart in height (a road's
// two levels in a hairpin stack are not)
function onEach(a, b) {
  if (Math.abs((a.y || 0) - (b.y || 0)) >= 1.5) return false;
  const box = (c) => { const ch = Math.cos(c.h), sh = Math.sin(c.h); return { x: c.x, z: c.z, u: [ch, sh], v: [-sh, ch], l: c.m.len / 2, w: c.m.wid / 2 }; };
  const A = box(a), B = box(b), dx = B.x - A.x, dz = B.z - A.z;
  for (const ax of [A.u, A.v, B.u, B.v]) {
    const r = (o) => o.l * Math.abs(o.u[0] * ax[0] + o.u[1] * ax[1]) + o.w * Math.abs(o.v[0] * ax[0] + o.v[1] * ax[1]);
    if (Math.abs(dx * ax[0] + dz * ax[1]) > r(A) + r(B)) return false;
  }
  return true;
}
// a race as the game's Circuit race makes it with the rivals chosen (newRace: numSet, the player at the back, a flying start up an open road
// and on the Nordschleife)
const race = (d, T, N, pm, o) => new C.Race(T, Object.assign({ numAI: N, numSet: true, playerGrid: 999, laps: 1, tt: false, playerModel: pm, playerNum: pm.num || 1, assist: 2, phys: 'cs', seed: 11,
  difficulty: 1, flying: d.open || d.flyStart ? 3 : 0 }, o));
function startOk(T, r) {   // { pairs on each other, cars off the asphalt, cars not behind the line (a grid) }
  let pairs = 0, off = 0; const cs = r.cars;
  for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) if (onEach(cs[i], cs[j])) pairs++;
  for (const c of cs) { const q = T.query(c.x, c.z, c.q.i, {}); if (Math.abs(q.d) + c.m.wid / 2 > T.wAt(q.i >= 0 ? q.i : T.idx(q.s)) - 0.2) off++; }
  return { pairs, off, ahead: cs.filter(c => c.dist >= 0).length };
}
function parkOk(T, r) {   // the finish past an open road's line: every car over it in turn (Race's own finish, its place's slot)
  r.start(); r.time = 300;
  for (const c of r.cars) { c.cp = T.cpS.length; c.dist = T.raceLen + 1; r._progressOpen(c, { s: T.finishS + 1 }, 1, 1 / 120); }
  const F = r.finishOrder, L = Math.max(...r.cars.map(c => c.m.len)), W = Math.max(...r.cars.map(c => c.m.wid));
  let on = 0; for (let i = 0; i < F.length; i++) for (let j = i + 1; j < F.length; j++) if (Math.abs(F[i].parkS - F[j].parkS) < L + 0.3 && Math.abs(F[i].parkD - F[j].parkD) < W + 0.3) on++;
  const past = F.filter(c => c.parkS > T.len - 20 - 0.5).length;
  const barrier = F.filter(c => { const i = T.idx(c.parkS); return Math.abs(c.parkD) + c.m.wid / 2 > Math.min(c.parkD > 0 ? T.br[i] : T.bl[i], T.wAt(i) + 3) - 0.3; }).length;
  return { slots: F.length, cars: r.cars.length, on, past, barrier };
}

// 1 and 2: every real track with a race, its most rivals, every vehicle's field
{
  const fs = [], fp = [], caps = [];
  for (const d of tracks) {
    const T = new C.Track(d), N = maxOf(d), fly = !!(d.open || d.flyStart);
    if (d.maxRivals) caps.push(`${d.id} ${d.maxRivals}`);
    for (const pm of PMS) {
      if (C.fieldSize(pm.oneMake ? null : pm, N) <= C.fieldSize(pm.oneMake ? null : pm, d.raceRivals || d.rivals || 21)) continue;   // (no bigger than the track's own field with that car, as the game always raced it: tests/grid.test.js; the big vehicles' fields, Core.fieldSize)
      const r = race(d, T, N, pm);
      if (r.cars.length !== C.fieldSize(pm.oneMake ? null : pm, N) + 1) { fs.push(`${d.id}/${pm.id}: ${r.cars.length} cars`); continue; }
      const g = startOk(T, r);
      if (!fly && (g.pairs || g.off || g.ahead)) fs.push(`${d.id}/${pm.id} ${N}: the grid ${g.pairs} on each other, ${g.off} off the asphalt, ${g.ahead} not behind the line`);
      if (fly) { r.start(); const f = startOk(T, r); if (f.pairs || f.off) fs.push(`${d.id}/${pm.id} ${N}: the flying start ${f.pairs} on each other, ${f.off} off the asphalt`); }
      if (d.open) { const p = parkOk(T, race(d, T, N, pm, { seed: 3 })); if (p.slots !== p.cars || p.past > 1 || p.on || p.barrier) fp.push(`${d.id}/${pm.id} ${N}: ${p.slots} slots of ${p.cars}, ${p.past} at the end of the road, ${p.on} on another, ${p.barrier} by the barrier`); }
    }
  }
  check(`the start with the most rivals each track takes (${tracks.length} tracks, ${PMS.length} vehicles' fields): a circuit's grid and a flying start, no car on another, all on the asphalt (a grid behind the line)`, !fs.length, fs.slice(0, 8).join(' | ') || `capped: ${caps.join(', ')}; the rest 100`);
  check('an open road\'s finish with the most rivals it takes: a slot for every car, none past the end of the road, on another or by the barrier', !fp.length, fp.slice(0, 8).join(' | '));
}

// 3. the field the player chose (numSet) and the track's own
{
  const d = C.TRACKS.find(t => t.id === 'nring'), T = new C.Track(d), pm = model('kaze');
  const own = new C.Race(T, { numAI: 5, playerGrid: 999, laps: 1, playerModel: pm, phys: 'cs', seed: 11 }).cars.length;
  const set = race(d, T, 5, pm).cars.length, alone = race(d, T, 0, pm), big = race(C.TRACKS.find(t => t.id === 'spa'), new C.Track(C.TRACKS.find(t => t.id === 'spa')), 100, pm);
  const names = new Set(big.cars.filter(c => !c.isPlayer).map(c => c.name)), nums = new Set(big.cars.map(c => c.num));
  check('the rivals chosen stay (numSet): the Nordschleife with 5 (its own def.rivals 20 not applied) 6 cars, with 0 the player alone; without numSet 21 as before',
    set === 6 && alone.cars.length === 1 && alone.player && own === 21, `${set} / ${alone.cars.length} / ${own} cars`);
  check('100 rivals: 101 cars, 100 drivers of their own (names), 101 numbers (1..101)', big.cars.length === 101 && names.size === 100 && nums.size === 101 && Math.min(...nums) === 1 && Math.max(...nums) === 101,
    `${big.cars.length} cars, ${names.size} names, ${nums.size} numbers`);
}

// 4. the race itself
{
  const run = (r, sec) => { let k = 0; for (let t = 0; t < sec; t += DT) { Math.random = seeded(5000 + (++k)); C.aiControl(r.player, r, DT); r.step(DT); if (r.player.stuckT > 3 || r.player.wrongT > 3) r.rescue(r.player); } };
  const fin = (r) => r.cars.every(c => [c.x, c.z, c.y || 0, c.vx, c.vz, c.dist].every(Number.isFinite));
  for (const id of ['troisrivieres', 'tianmen']) {
    const d = C.TRACKS.find(t => t.id === id), T = new C.Track(d), r = race(d, T, 100, model('kaze'), { laps: 3, chars: true, slip: true, flags: true, damage: 1 });
    r.start(); run(r, 20);
    const still = r.cars.filter(c => !c.isPlayer && Math.hypot(c.vx, c.vz) < 3).length, far = Math.max(...r.cars.map(c => c.dist)), back = Math.min(...r.cars.map(c => c.dist));
    check(`${id}: 100 rivals (${d.open ? 'a flying start' : 'from the grid, the player at its back'}), 20 s: no NaN, nobody stuck`, fin(r) && !still && r.cars.length === 101, `${still} standing, the field from ${back.toFixed(0)} m to ${far.toFixed(0)} m`);
  }
  const d = C.TRACKS.find(t => t.id === 'spa'), T = new C.Track(d), r = race(d, T, 0, model('kaze'), { laps: 1, flags: true, chars: true, slip: true });
  r.start(); let k = 0, t = 0; for (; t < 400 && !r.player.finished; t += DT) { Math.random = seeded(9000 + (++k)); C.aiControl(r.player, r, DT); r.step(DT); if (r.player.stuckT > 3 || r.player.wrongT > 3) r.rescue(r.player); }
  const res = r.estimateResults();
  check('a race alone (0 rivals) on Spa: the player home after a lap, the results one row', r.player.finished && res.length === 1 && res[0].car === r.player, `finished ${r.player.finished} after ${t.toFixed(1)} s, ${res.length} rows`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
