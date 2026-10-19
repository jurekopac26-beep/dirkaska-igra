// Pikes Peak: the hill climb is a time trial first (def.timeTrial: its records, ghosts, boards, medals and lines are the time trial's, as before)
// with a second way to drive it (def.modes: the time trial and the race against twelve rivals). Without opts.tt (the tests, the golden
// references) and with opts.tt it is the time trial, with opts.tt false (the game's race) the race: thirteen cars on the grid, closer together
// below the start line (only ~40 m of road there). A whole race up on autopilot, on asphalt and on the historic gravel road (pikesg): every
// car reaches the summit and pulls up in a slot of its own past the line, the slots closer together on the short road past the finish.
//   node tests/pikes.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const def = C.TRACKS.find(d => d.id === 'pikes'), gravel = C.TRACKS.find(d => d.id === 'pikesg');

// 1. the track: an open road, the time trial first and the race (the gravel road too), not in the big championship
check('track: an open road, a time trial (def.timeTrial) with two ways to drive it (def.modes: time trial, race), the gravel road the same',
  def.open && def.timeTrial && (def.modes || []).join(',') === 'tt,race' && gravel.variantOf === 'pikes' && gravel.timeTrial && (gravel.modes || []).join(',') === 'tt,race' &&
  !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('pikes'), `modes ${(def.modes || []).join(',')}, gravel ${(gravel.modes || []).join(',')}`);

// 2. the ways to drive it: the time trial unless the race is asked for (opts.tt false); online (opts.remote) the time trial as ever
{
  const T = new C.Track(def), orig = Math.random; Math.random = seeded(3);
  const dflt = new C.Race(T, opts({})), tt = new C.Race(T, opts({ tt: true })), race = new C.Race(T, opts({ tt: false }));
  const net = new C.Race(T, opts({ numAI: 0, playerGrid: 1, remote: { model: C.MODELS[0], color: 0, num: 2, name: 'B', grid: 2 } }));
  Math.random = orig;
  race.start();
  const backs = race.cars.map(c => -c.dist).sort((a, b) => a - b), lat = Math.max(...race.cars.map(c => Math.abs(c.q.d)));
  check('mode: without opts.tt and with it the time trial (the player alone on the line), online too', dflt.timeTrial && dflt.cars.length === 1 && tt.timeTrial && tt.cars.length === 1 && net.timeTrial);
  check('mode: opts.tt false the race, 13 cars on the grid behind the line (closer together: ~40 m of road below it), every one on the road',
    !race.timeTrial && race.cars.length === 13 && backs[0] > 0 && backs[12] < T.startS - 4 && lat + 1 < T.w, 'grid ' + backs.map(b => b.toFixed(0)).join(' ') + `, start line ${T.startS.toFixed(0)} m up the road`);
}

// 3. a whole race up on autopilot (asphalt and gravel): every car at the summit, then each in a slot of its own past the line, stopped
for (const d of [def, gravel]) {
  const T = new C.Track(d), orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ tt: false })), P = r.player; r.start();
  let t = 0, k = 0, done = null, nan = false;
  while (t < 420 && !(done != null && t > done + 30)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    for (const c of r.cars) if (!Number.isFinite(c.x) || !Number.isFinite(c.speed)) nan = true;
    if (done == null && r.cars.every(c => c.finished)) done = t;
  }
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishTime - b.finishTime);
  let near = 99; for (let i = 0; i < r.cars.length; i++) for (let j = i + 1; j < r.cars.length; j++) near = Math.min(near, Math.hypot(r.cars[i].x - r.cars[j].x, r.cars[i].z - r.cars[j].z));
  const past = r.cars.map(c => c.q.s - T.finishS), still = Math.max(...r.cars.map(c => Math.abs(c.speed)));
  check(`${d.id}: a whole race on autopilot, all 13 cars at the summit`, fin.length === 13 && !nan, `winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, last ${fin.length ? fin[fin.length - 1].finishTime.toFixed(1) : '-'} s`);
  check(`${d.id}: past the line (~${Math.round(T.len - T.finishS)} m of road) every car stopped in a slot of its own at the side of the road`,
    past.every(p => p > 20 && p < T.len - T.finishS) && near > 4 && still < 0.5 && r.cars.every(c => Math.abs(c.q.d) > 3 && Math.abs(c.q.d) < T.w),
    `nearest two ${near.toFixed(1)} m apart, ${Math.round(Math.min(...past))}-${Math.round(Math.max(...past))} m past the line`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
