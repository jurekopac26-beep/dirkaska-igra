// Razbijanje · nov način: odboji, agresivni vozniki, poškodbe vplivajo na vožnjo (Core.setCrash({ bump, ai, handle }), Nastavitve xBump,
// xAi, xHandle; all off by default, never online)
// - odboji: a car knocked on its rear quarter at speed: off, it hardly turns (the old damped tap) and no new field on the car; on, it
//   turns as hard as the knock says (a harder one spins it round) and its grip goes for under a second (xgl, gone again after); a friend's
//   car online (net) never
// - agresivni vozniki: a 90 s race on Jezero (13 cars): on, more hard knocks between the cars and more damage than off, every car still
//   on its laps, nothing NaN
// - poškodbe vplivajo na vožnjo: a crushed front-right corner pulls the car right, a front-left one left (a few degrees in 2 s at
//   80 km/h, the wheel held straight); off, it runs straight
//   node tests/knock.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
const H = require('./lib/handling.js')(C);
const D = 180 / Math.PI;
const checks = [];
const ok = (name, cond, detail) => checks.push({ name, ok: !!cond, detail });

// a knock on the rear quarter: A at 100 km/h along x, B from behind on its left, nose angled into A's left rear quarter at vb
function tap(bump, vb, net) {
  C.setCrash({ bump });
  const A = H.mkCar('tornado', { v: 100 }), B = H.mkCar('tornado', { v: 0 }), L = A.m.len, W = A.m.wid; if (net) A.net = true;
  B.place(-L * 0.35 - L * 0.5 * Math.cos(0.5) + 0.05, -W * 0.5 - L * 0.5 * Math.sin(0.5) + 0.25, 0.5); B.vx = vb * Math.cos(0.5); B.vz = vb * Math.sin(0.5);
  const w0 = A.w, imp = C.carCollide(A, B), gl = A.xgl || 0, h0 = A.h, w1 = A.w;
  let t = 0, turn = 0, glGone = null, field = 'xgl' in A || 'xgl' in B, nan = false;
  while (t < 2.5) { H.step(A, { thr: 'hold', st: 0 }); t += DT; turn = Math.max(turn, Math.abs(A.h - h0) * D); if (glGone == null && !('xgl' in A)) glGone = t; if (![A.x, A.z, A.vx, A.vz, A.h].every(Number.isFinite)) nan = true; }
  C.setCrash({});
  return { imp, gl, turn, glGone, field, nan, wSame: w1 === w0 };
}
{
  const off = tap(0, 38), on = tap(1, 38), hard = tap(1, 45), soft = tap(1, 33);
  ok('odboji off: a knock on the rear quarter hardly turns the car, no new field', off.imp > 10 && off.turn < 10 && !off.field && !off.nan, 'impact ' + off.imp.toFixed(1) + ', turned ' + off.turn.toFixed(1) + '°');
  ok('odboji on: the same knock turns it hard', on.turn > 40 && on.turn > off.turn * 4, 'turned ' + on.turn.toFixed(1) + '° (off ' + off.turn.toFixed(1) + '°)');
  ok('odboji on: a harder knock spins it round, a softer one less', hard.turn > 90 && soft.turn < on.turn && soft.turn > off.turn, [soft, on, hard].map(r => r.turn.toFixed(0) + '°').join(' < '));
  ok('odboji on: the grip gone for a moment (xgl), back within a second', on.gl > 0.3 && on.glGone != null && on.glGone < 1, 'xgl ' + on.gl.toFixed(2) + ', gone after ' + (on.glGone || 0).toFixed(2) + ' s');
  ok('odboji on: nothing NaN', !on.nan && !hard.nan && !soft.nan, '');
  const net = tap(1, 38, true); ok('odboji on: a friend\'s car in an online race (net) is never turned nor loses grip', net.imp > 10 && !('xgl' in net) && net.gl === 0 && net.wSame, JSON.stringify({ imp: +net.imp.toFixed(1), gl: net.gl, w: net.wSame }));
}

// a 90 s race on Jezero, the player on autopilot
function race(ai) {
  C.setCrash({ ai });
  const orig = Math.random; Math.random = seeded(11);
  try {
    const r = new C.Race(new C.Track(C.TRACKS.find(d => d.id === 'jezero')), { numAI: 12, playerGrid: 12, laps: 3, playerModel: C.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' });
    r.start();
    let t = 0, hard = 0, nan = false;
    while (t < 90) { C.aiControl(r.player, r, DT); r.step(DT); t += DT;
      for (const c of r.cars) { if (c.hitCar > 8) hard++; if (![c.x, c.z, c.vx, c.vz].every(Number.isFinite)) nan = true; c.hitCar = 0; c.hitWall = 0; } }
    return { hard, nan, dmg: r.cars.reduce((s, c) => s + c.dmg, 0) / r.cars.length, laps: Math.min(...r.cars.map(c => c.lap || 0)) };
  } finally { Math.random = orig; C.setCrash({}); }
}
{
  const off = race(0), on = race(1);
  ok('agresivni vozniki on: more hard knocks between the cars', on.hard >= off.hard * 2 && on.hard > 10, 'hard knocks ' + off.hard + ' -> ' + on.hard);
  ok('agresivni vozniki on: more damage in the field', on.dmg > off.dmg * 1.5, 'mean damage ' + off.dmg.toFixed(2) + ' -> ' + on.dmg.toFixed(2));
  ok('agresivni vozniki on: every car still on its laps, nothing NaN', on.laps >= off.laps && !on.nan, 'laps (the slowest) ' + off.laps + ' / ' + on.laps);
}

// a crushed front corner (cd: FL, FR, RL, RR), 80 km/h, the wheel held straight for 2 s
function pull(handle, k) {
  C.setCrash({ handle });
  const A = H.mkCar('tornado', { v: 80 }); A.cd[k] = 0.8;
  const h0 = A.h; let t = 0;
  while (t < 2) { H.step(A, { thr: 'hold', st: 0 }); t += DT; }
  C.setCrash({});
  return (A.h - h0) * D;
}
{
  const off = pull(0, 1), fr = pull(1, 1), fl = pull(1, 0);
  ok('poškodbe vplivajo na vožnjo off: a crushed corner, the car runs straight', Math.abs(off) < 0.01, off.toFixed(2) + '°');
  ok('poškodbe vplivajo na vožnjo on: front-right crushed pulls right, front-left left, a few degrees', fr > 2 && fr < 12 && fl < -2 && fl > -12, 'FR ' + fr.toFixed(1) + '°, FL ' + fl.toFixed(1) + '°');
}

let bad = 0;
console.log('== odboji, agresivni vozniki, vpliv na vožnjo (Razbijanje · nov način)');
for (const c of checks) { if (!c.ok) bad++; console.log(`${c.ok ? 'OK  ' : 'FAIL'} ${c.name}${c.detail ? ' — ' + c.detail : ''}`); }
console.log(bad ? `FAIL: ${bad} of ${checks.length} checks` : `OK: all ${checks.length} checks`);
process.exitCode = bad ? 1 : 0;
