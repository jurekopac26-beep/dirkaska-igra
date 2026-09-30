// Qualifying and the grid it gives (Core only, no browser): the run-up to a flying lap on every circuit (Track.qualiBack), a qualifying
// lap (Race opts qualiBack: the car alone behind the line on the racing line, the lap timed from the line to the line, finished after
// that lap), each rival's own lap (Race opts aiOrder [k]: that driver alone, with the skill it has in the full field, the same lap every
// time), and the grid in the order of the times (aiOrder + playerGrid: the drivers in that order around the player's slot, each with its
// own skill and car); DRS on Spa (two zones, the Kemmel straight and the start / finish straight, used in a race).
//   node tests/quali.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const runLap = (r, car, drive) => { let t = 0; const cap = r.track.len / 8 + 120; while (!car.finished && t < cap) { if (drive) C.aiControl(car, r, DT); r.step(DT); t += DT; } return t; };

// 1. the run-up: 120-400 m on every circuit, from the exit of the last corner before the line
{
  const bk = C.TRACKS.filter(d => !d.timeTrial).map(d => { const T = track(d.id); return [d.id, T.qualiBack()]; });
  check('run-up to the flying lap: 120-400 m before the line on every circuit', bk.every(([, b]) => b >= 120 && b <= 400), bk.map(([id, b]) => id + ' ' + Math.round(b)).join(', '));
}

// 2. a qualifying lap: the player alone, on the racing line qualiBack m behind the line; lap 1 starts at the line, the run ends after it
{
  Math.random = seeded(21);
  const T = track('rbring'), back = T.qualiBack(), r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, qualiBack: back, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 5, damage: 0 });
  const P = r.player, i = T.idx(T.startS - back);
  check('qualifying lap: the player alone, qualiBack behind the line, on the racing line', r.cars.length === 1 && Math.abs(P.dist + back) < 1e-6 && Math.abs(((P.x - T.px[i]) * T.nx[i] + (P.z - T.pz[i]) * T.nz[i]) - T.rl[i]) < 0.05,
    `${r.cars.length} car, ${Math.round(-P.dist)} m back`);
  r.start(); const t = runLap(r, P, true);
  const lap = P.lapTimes[0], standing = t - lap;
  check('qualifying lap: timed from the line to the line (the run-up not in it), the run ends after the lap', P.finished && P.lapTimes.length === 1 && lap > 60 && lap < 130 && standing > 8 && standing < 30,
    `lap ${lap && lap.toFixed(2)} s, run-up ${standing.toFixed(1)} s`);
}

// 3. the rivals' laps: each driver alone (the skill of the full field), the same lap every time; the fastest skills mostly in front
const T = track('spa'), back = T.qualiBack(), seed = 77;
const solo = (k) => { Math.random = seeded(300 + k); const r = new C.Race(T, { numAI: 12, aiOrder: [k], noPlayer: true, laps: 1, qualiBack: back, difficulty: 1, phys: 'cs', seed, damage: 0 }); r.start(); runLap(r, r.cars[0], false); return r.cars[0]; };
const field = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[0], seed, difficulty: 1, phys: 'cs' }).cars.filter(c => !c.isPlayer);
const laps = [];
for (let k = 0; k < 12; k++) { const c = solo(k); laps.push({ k, name: c.name, skill: c.skill, time: c.finished ? c.lapTimes[0] : Infinity, same: c.name === field[k].name && c.skill === field[k].skill && c.m === field[k].m }); }
check("rivals' laps: every driver alone finishes a flying lap, with its name, car and skill of the full field", laps.every(l => isFinite(l.time) && l.same), laps.map(l => l.name + ' ' + l.time.toFixed(2)).join(', '));
{ const again = solo(3); check("rivals' laps: the same lap again gives the same time", again.lapTimes[0] === laps[3].time, `${again.lapTimes[0]} / ${laps[3].time}`); }
{
  const byTime = laps.slice().sort((a, b) => a.time - b.time), top = byTime.slice(0, 4).reduce((a, l) => a + l.skill, 0) / 4, tail = byTime.slice(-4).reduce((a, l) => a + l.skill, 0) / 4;
  check("rivals' laps: the quicker drivers in front (the four fastest have more skill than the four slowest)", top > tail, `${top.toFixed(3)} vs ${tail.toFixed(3)}`);
}

// 4. the grid from the times: the rivals in that order around the player's slot, each with its own car and skill
{
  const order = laps.slice().sort((a, b) => a.time - b.time).map(l => l.k), grid = 5;
  const r = new C.Race(T, { numAI: 12, aiOrder: order, playerGrid: grid, laps: 2, playerModel: C.MODELS[0], seed, difficulty: 1, phys: 'cs' });
  const want = order.map(k => field[k]), ai = r.cars.filter(c => !c.isPlayer);
  check('grid: 13 cars, the player in slot 5, the rivals in the order of their times', r.cars.length === 13 && r.player.grid === grid && ai.every((c, j) => c.name === want[j].name) && ai.map(c => c.grid).join() === '1,2,3,4,6,7,8,9,10,11,12,13',
    r.cars.map(c => (c.isPlayer ? 'TI' : c.name) + '@' + c.grid).join(', '));
  check('grid: every rival keeps its own car and skill', ai.every((c, j) => c.m === want[j].m && c.skill === want[j].skill), '');
  const dup = new C.Race(T, { numAI: 12, aiOrder: [3, 3, 99, -1, 5], playerGrid: 1, laps: 1, playerModel: C.MODELS[0], seed });
  check('grid: a bad order keeps the drivers it can (no repeats, none out of the roster)', dup.cars.length === 3 && dup.cars.filter(c => !c.isPlayer).map(c => c.name).join() === [field[3].name, field[5].name].join(), dup.cars.map(c => c.name).join(', '));
}

// 5. DRS on Spa: two zones (the Kemmel straight, the start / finish straight), used by the rivals from the second lap on
{
  const Z = T.drs || [], L = T.len, nm = (d) => T.names.reduce((b, q) => Math.abs(q.d - d) < Math.abs(b.d - d) ? q : b).n;
  check('Spa DRS: two zones, open on the Kemmel straight (up to Les Combes) and on the start / finish straight (down to La Source)', Z.length === 2 && Z[0].act > 1200 && Z[0].act < 1500 && nm(Z[0].end) === 'Les Combes' && Z[1].act > 6700 && Z[1].end < 300,
    Z.map(z => [z.det, z.act, z.end].map(v => Math.round(v)).join('/')).join(', '));
  Math.random = seeded(3);
  const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 });
  r.start(); const P = r.player, used = [0, 0], prev = new Map(); let t = 0, k = 0, early = 0;
  while (t < L * 2 / 12 + 120 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT;
    for (const c of r.cars) { const d = c.drs || 0; if (d && !prev.get(c)) { used[d - 1]++; if (c.lap < 2) early++; } prev.set(c, d); }
  }
  check('Spa DRS: the cars open it in both zones, never on the first lap', used[0] > 0 && used[1] > 0 && early === 0, `Kemmel ${used[0]}, start / finish ${used[1]}, first lap ${early}`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
