// The game's bigger fields on the road (no browser): the Nordschleife's Circuit race with 100 cars from a flying start (def.raceRivals 99,
// def.flyStart; game.js newRace: numAI 99, opts.flying FLY_T 3 s, the player in slot PLAYER_GRID 99), its first 30 s: the cars in one line
// (Race._flyColumn: the player at the back 3 s below the line, the column ~30 s long, most of it past the line), no start reaction (no lights),
// then no NaN anywhere, every car on the move and over the line; and the 22-car races up two open roads as the game runs them (21 rivals, the
// flying start's column): Pikes Peak (~40 m of road below the line) the whole way to the summit, every car at the finish in a slot of its own past the line (none past the end of the
// road), and Vršič's first minute. The damage of the AI is printed (a big field crashes more at its start; not checked).
//   node tests/field.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const M = C.MODELS[4];
// a race as the game's Circuit race starts it (numAI, the player at the back, the characters, slip, flags, damage), the flying start (FLY_T 3 s)
const race = (id, numAI, o) => new C.Race(new C.Track(C.TRACKS.find(d => d.id === id)), Object.assign({ numAI, playerGrid: 99, laps: 1, tt: false, playerModel: M, playerNum: M.num || 1, assist: 2,
  phys: 'cs', seed: 11, difficulty: 1, flying: 3, chars: true, slip: true, flags: true, damage: 2 }, o));
// sec s of it on the autopilot (the player rescued when stuck, as a player would press the button); until: stop when it says so
function run(r, sec, until) {
  let k = 0, t = 0;
  for (; t < sec && !(until && until(r)); t += DT) { Math.random = seeded(5000 + (++k)); C.aiControl(r.player, r, DT); r.step(DT); if (r.player.stuckT > 3 || r.player.wrongT > 3) r.rescue(r.player); }
  return t;
}
const finite = (r) => r.cars.every(c => [c.x, c.z, c.y || 0, c.vx, c.vz, c.speed, c.dist, c.h, c.dmg || 0].every(Number.isFinite));
const hurt = (r) => { const ai = r.cars.filter(c => !c.isPlayer); return `AI damage over 20 %: ${ai.filter(c => c.dmg > 0.2).length} of ${ai.length}, over 50 %: ${ai.filter(c => c.dmg > 0.5).length}`; };

const orig = Math.random;
try {
  // 1. the Nordschleife: 100 cars, the flying start, 30 s
  {
    Math.random = seeded(3);
    const d = C.TRACKS.find(t => t.id === 'nring'), r = race('nring', d.raceRivals), t0 = Date.now();
    r.start();
    const T = r.track, along = r.cars.map(c => { const i = c.q.i >= 0 ? c.q.i : T.idx(c.q.s); return (c.vx * Math.cos(T.hd[i]) + c.vz * Math.sin(T.hd[i])) / c.speed; }), d0 = r.cars.map(c => c.dist);
    const line = r.cars.filter(c => c !== r.player).sort((a, b) => a.grid - b.grid).concat([r.player]), span = line.slice(1).reduce((a, c, k) => a + (line[k].dist - c.dist) / Math.max(5, c.speed), 0);
    check('Nordschleife: 100 cars from a flying start, in one line along the road in the order of the grid (~30 s long), every one rolling, no start reaction, the player at the back below the line, the others ahead of it',
      r.cars.length === 100 && !r.lch && r.flyOn && r.cars.every(c => c.speed > 10) && along.every(a => a > 0.97) && line.every((c, k) => !k || line[k - 1].dist > c.dist) && r.player.dist < 0 && r.player.dist === Math.min(...d0) && span > 20 && span < 45,
      `the player ${(-r.player.dist).toFixed(0)} m below the line, the first ${Math.max(...d0).toFixed(0)} m past it, ~${span.toFixed(0)} s long`);
    run(r, 30);
    const moved = r.cars.filter((c, i) => c.dist - d0[i] > 300).length, over = r.cars.filter(c => c.lap >= 1).length, out = r.cars.filter(c => !c.finished && r.isOut(c)).length;
    check('Nordschleife: after 30 s no NaN, every car on the move (300 m and more), all over the line, none out', finite(r) && moved === 100 && over === 100 && !out,
      `${moved} moved, ${over} over the line, ${out} out; ${hurt(r)}; ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  // 2. Pikes Peak: 22 cars in the flying start's column, the whole race to the summit, then every car parked in a slot of its own
  {
    Math.random = seeded(3);
    const r = race('pikes', 21), T = r.track, t0 = Date.now();
    r.start();
    const t = run(r, 600, (q) => q.cars.every(c => c.finished || q.isOut(c)));
    run(r, 20);
    const fin = r.cars.filter(c => c.finished), S = fin.map(c => c.parkS);
    check('Pikes Peak: 22 cars from the flying start, every one at the summit, no NaN', r.cars.length === 22 && fin.length === 22 && finite(r),
      `the winner ${Math.min(...fin.map(c => c.finishTime)).toFixed(1)} s, all in after ${t.toFixed(0)} s; ${hurt(r)}; ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    check('Pikes Peak: past the line a slot of its own for every car (none past the end of the road), all parked', new Set(S.map(s => s.toFixed(2))).size === 22 && S.every(s => s <= T.len - 20 + 1e-6) && fin.every(c => c.parked),
      `slots ${(Math.min(...S) - T.finishS).toFixed(0)}-${(Math.max(...S) - T.finishS).toFixed(0)} m past the line, the road ends ${(T.len - T.finishS).toFixed(0)} m past it`);
  }
  // 3. Vršič: 22 cars, the first minute
  {
    Math.random = seeded(3);
    const r = race('vrsic', 21), t0 = Date.now(); r.start();
    const d0 = r.cars.map(c => c.dist); run(r, 60);
    const moved = r.cars.filter((c, i) => c.dist - d0[i] > 1000).length;
    check('Vršič: 22 cars, after a minute no NaN, every car over 1 km up the road, none out', r.cars.length === 22 && finite(r) && moved === 22 && !r.cars.some(c => r.isOut(c)),
      `${moved} over 1 km; ${hurt(r)}; ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
} finally { Math.random = orig; }

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
