// Razbijanje · nov način: prevračanje (Core.setCrash({ roll }), Nastavitve xRoll; off by default)
// - off: a hard knock on a car's side never rolls it (no rl), the cars as before
// - on: a car T-boned at 16 m/s rolls over away from the knock (one or two full turns), the car that hit it nose first does not; it slides
//   on without grip, up in an arc and down, the roof on the road once a turn (a dent on top, the roof crushed further), and after 1.2-1.6 s
//   it is on its wheels again (no rl), slower than it was (about 80 % of its speed less the road's drag), nothing NaN; a soft knock (5 m/s) rolls nothing,
//   nor does a friend's car online (net)
//   node tests/roll.test.js
'use strict';
const { loadCore } = require('./lib/core.js');

const C = loadCore();
const H = require('./lib/handling.js')(C);
const { DT, mkCar, step } = H;
const checks = [];
const ok = (name, cond, detail) => checks.push({ name, ok: !!cond, detail });

// a T-bone: A drives along x at 8 m/s, B comes from its right (+z) at v straight at its door
function tbone(v) {
  const A = mkCar('tornado', { v: 29 }), B = mkCar('tornado', { v: 0 });
  B.place(0.3, 3.45, -Math.PI / 2); B.vx = 0; B.vz = -v;
  const imp = C.carCollide(A, B);
  return { A, B, imp };
}

C.setCrash({ roll: 0 });
{ const { A, B, imp } = tbone(16); ok('off: a hard knock on the side rolls nothing', !A.rl && !B.rl && imp > 9, 'impact ' + imp.toFixed(1)); }

C.setCrash({ roll: 1 });
{
  const { A, B, imp } = tbone(16);
  ok('on: the car hit on its side rolls over, away from the knock; the one that hit it nose first does not', A.rl && A.rl.dir === -1 && !B.rl, JSON.stringify({ imp: +imp.toFixed(1), rl: A.rl, b: !!B.rl }));
  ok('on: one or two full turns, 1.2-1.6 s', A.rl && (A.rl.turns === 1 || A.rl.turns === 2) && A.rl.T >= 1.1 && A.rl.T <= 1.7, JSON.stringify(A.rl));
  const v0 = Math.hypot(A.vx, A.vz); let t = 0, top = 0, dents = 0, nan = false;
  while (A.rl && t < 3) { step(A, { thr: 1, st: 0.5 }); t += DT; top = Math.max(top, A.y - A.roadY); dents = A.dents.filter(d => d.top).length; if (![A.x, A.z, A.y, A.vx, A.vz].every(Number.isFinite)) nan = true; }
  ok('on: up in an arc while it rolls (no grip, no drive)', top > 0.4 && top < 2.5, 'highest ' + top.toFixed(2) + ' m');
  ok('on: on its wheels again after its turns (no rl), on the road', !A.rl && Math.abs(A.y - A.roadY) < 1e-6 && t >= 1.1 && t <= 1.7, 't ' + t.toFixed(2) + ' s');
  ok('on: the roof on the road once a turn: a dent on top, the roof crushed', dents >= 1 && A.roofDmg > 0, JSON.stringify({ dents, roof: A.roofDmg }));
  ok('on: slower than it was, but going on (about a second lost)', Math.hypot(A.vx, A.vz) < v0 * 0.85 && Math.hypot(A.vx, A.vz) > v0 * 0.4, (v0 * 3.6).toFixed(0) + ' -> ' + (Math.hypot(A.vx, A.vz) * 3.6).toFixed(0) + ' km/h');
  ok('on: nothing NaN', !nan, '');
}
{ const { A, B, imp } = tbone(5); ok('on: a soft knock rolls nothing', !A.rl && !B.rl, 'impact ' + imp.toFixed(1)); }
{ const A = mkCar('tornado', { v: 29 }), B = mkCar('tornado', { v: 0 }); A.net = true; B.place(0.3, 3.45, -Math.PI / 2); B.vx = 0; B.vz = -16; const imp = C.carCollide(A, B); ok('on: a friend\'s car in an online race (net) never rolls', !A.rl && !B.rl && imp > 9, 'impact ' + imp.toFixed(1)); }
C.setCrash({ roll: 0 });

let bad = 0;
console.log('== prevračanje (Razbijanje · nov način)');
for (const c of checks) { if (!c.ok) bad++; console.log(`${c.ok ? 'OK  ' : 'FAIL'} ${c.name}${c.detail ? ' — ' + c.detail : ''}`); }
console.log(bad ? `FAIL: ${bad} of ${checks.length} checks` : `OK: all ${checks.length} checks`);
process.exitCode = bad ? 1 : 0;
