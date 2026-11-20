// Razbijanje · nov način: odboji, agresivni vozniki (Core.setCrash({ bump, ai }), Nastavitve xBump, xAi; all off by default, never
// online), and the damaged car's steering (with damage Vklop only, no switch: P3)
// - odboji (with the old knock, Trki med avti: Stara; the other versions turn and spin a car themselves, trki.test.js): a car knocked on
//   its rear quarter at speed: off, it hardly turns (the old damped tap) and loses no grip (xgl stays 0); on, it turns as hard as the knock says
//   (a harder one spins it round) and its grip goes for under a second (xgl, gone again after); a friend's car online (net) never
// - agresivni vozniki: a 90 s race at Bathurst (13 cars; a real track: on the test track Jezero, all off the line at once, the start's knocks
//   alone were as many as the aggressive drivers add): on, more hard knocks between the cars and more damage than off, every rival still
//   driving (the slowest rival at least 0.8 of the way the slowest one makes without them), nothing NaN
// - poškodbe Vklop: a crushed front-right corner pulls the car right, a front-left one left (a few degrees in 2 s at 80 km/h, the
//   wheel held straight); a bent front wheel (cd 0.6) shakes the turn rate once a wheel turn, a crushed corner that bends none (0.3) does not, both front
//   wheels bent alike cancel (the mirror image) and the car runs straight; Samo videz and
//   Izklop: the same car runs dead straight
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
  C.setCrash({ bump }); C.setTest({ cv: 5 });   // (Razbijanje: odboji works with the old knock only)
  const A = H.mkCar('tornado', { v: 100 }), B = H.mkCar('tornado', { v: 0 }), L = A.m.len, W = A.m.wid; if (net) A.net = true;
  B.place(-L * 0.35 - L * 0.5 * Math.cos(0.5) + 0.05, -W * 0.5 - L * 0.5 * Math.sin(0.5) + 0.25, 0.5); B.vx = vb * Math.cos(0.5); B.vz = vb * Math.sin(0.5);
  const w0 = A.w, imp = C.carCollide(A, B), gl = A.xgl || 0, h0 = A.h, w1 = A.w;
  let t = 0, turn = 0, glGone = null, field = A.xgl > 0 || B.xgl > 0, nan = false;   // (field: grip lost to the knock: xgl, on every car from the start, 0 until a knock takes it)
  while (t < 2.5) { H.step(A, { thr: 'hold', st: 0 }); t += DT; turn = Math.max(turn, Math.abs(A.h - h0) * D); if (glGone == null && !(A.xgl > 0)) glGone = t; if (![A.x, A.z, A.vx, A.vz, A.h].every(Number.isFinite)) nan = true; }
  C.setCrash({}); C.setTest(null);
  return { imp, gl, turn, glGone, field, nan, wSame: w1 === w0 };
}
{
  const off = tap(0, 38), on = tap(1, 38), hard = tap(1, 45), soft = tap(1, 33);
  ok('odboji off: a knock on the rear quarter hardly turns the car, no grip lost', off.imp > 10 && off.turn < 10 && !off.field && !off.nan, 'impact ' + off.imp.toFixed(1) + ', turned ' + off.turn.toFixed(1) + '°');
  ok('odboji on: the same knock turns it hard', on.turn > 40 && on.turn > off.turn * 4, 'turned ' + on.turn.toFixed(1) + '° (off ' + off.turn.toFixed(1) + '°)');
  ok('odboji on: a harder knock spins it round, a softer one less', hard.turn > 90 && soft.turn < on.turn && soft.turn > off.turn, [soft, on, hard].map(r => r.turn.toFixed(0) + '°').join(' < '));
  ok('odboji on: the grip gone for a moment (xgl), back within a second', on.gl > 0.3 && on.glGone != null && on.glGone < 1, 'xgl ' + on.gl.toFixed(2) + ', gone after ' + (on.glGone || 0).toFixed(2) + ' s');
  ok('odboji on: nothing NaN', !on.nan && !hard.nan && !soft.nan, '');
  const net = tap(1, 38, true); ok('odboji on: a friend\'s car in an online race (net) is never turned nor loses grip', net.imp > 10 && net.gl === 0 && net.wSame, JSON.stringify({ imp: +net.imp.toFixed(1), gl: net.gl, w: net.wSame }));
}

// a 90 s race at Bathurst, the player on autopilot (every car off the line at once, as before the start's reaction, Core LAUNCH: the
// reactions spread the pack over the first metres and the knocks of one race with them; this measures the aggressive drivers alone)
function race(ai, seed) {
  C.setCrash({ ai });
  const orig = Math.random; Math.random = seeded(seed);
  try {
    const r = new C.Race(new C.Track(C.TRACKS.find(d => d.id === 'bathurst')), { numAI: 12, playerGrid: 12, laps: 3, playerModel: C.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs', launch: false });
    r.start();
    let t = 0, hard = 0, nan = false;
    while (t < 90) { C.aiControl(r.player, r, DT); r.step(DT); t += DT;
      for (const c of r.cars) { if (c.hitCar > 8) hard++; if (![c.x, c.z, c.vx, c.vz].every(Number.isFinite)) nan = true; c.hitCar = 0; c.hitWall = 0; } }
    const riv = r.cars.filter(c => !c.isPlayer);
    return { hard, nan, dmg: r.cars.reduce((s, c) => s + c.dmg, 0) / r.cars.length, laps: Math.min(...riv.map(c => c.lap || 0)), dist: Math.min(...riv.map(c => c.dist || 0)) };   // (the rivals: the marshals put a stuck one back; the player's autopilot has no reverse gear, a player spun round into a barrier backs out of it)
  } finally { Math.random = orig; C.setCrash({}); }
}
{
  // (six races of each, the knocks and the damage added up: one 90 s race alone is a draw of the dice)
  const sum = (ai) => { const t = { hard: 0, dmg: 0, laps: 99, dist: Infinity, nan: false }; for (const sd of [11, 12, 13, 14, 15, 16]) { const r = race(ai, sd); t.hard += r.hard; t.dmg += r.dmg / 6; t.laps = Math.min(t.laps, r.laps); t.dist = Math.min(t.dist, r.dist); t.nan = t.nan || r.nan; } return t; };
  const off = sum(0), on = sum(1);
  ok('agresivni vozniki on: more hard knocks between the cars', on.hard >= off.hard * 1.5 && on.hard > 30, 'hard knocks ' + off.hard + ' -> ' + on.hard);
  ok('agresivni vozniki on: more damage in the field', on.dmg > off.dmg * 1.5, 'mean damage ' + off.dmg.toFixed(2) + ' -> ' + on.dmg.toFixed(2));
  // (by the distance: a lap at Bathurst is longer than 90 s of driving, every rival ends on its first lap whether one stops or not; the slowest
  // rival without them some 3480 m on, with them 3240 m, a rival stopped or put out of the race at 30 s about 1300 m)
  ok('agresivni vozniki on: every rival still driving (the slowest as far as 0.8 of the slowest without them), nothing NaN', on.dist > 0.8 * off.dist && on.laps >= off.laps && !on.nan, 'the slowest rival ' + off.dist.toFixed(0) + ' m / ' + on.dist.toFixed(0) + ' m, laps ' + off.laps + ' / ' + on.laps);
}

// a crushed front corner (cd: FL, FR, RL, RR), 80 km/h, the wheel held straight for 2 s; mode = the damage setting (0, 1, 2)
function pull(mode, k, amt) {
  const A = H.mkCar('tornado', { v: 80 }); A.dmgMode = mode; for (const j of [].concat(k)) A.cd[j] = amt || 0.8;
  // wob: the shake, the largest swing of the turn rate (deg/s) about its straight trend over the second second (a steady pull leaves ~0)
  const h0 = A.h; let t = 0, hp = A.h; const rs = [];
  while (t < 2) { H.step(A, { thr: 'hold', st: 0 }); t += DT; const r = (A.h - hp) / DT * D; hp = A.h; if (t > 1) rs.push(r); }
  const n = rs.length, xm = (n - 1) / 2, m = rs.reduce((a, r) => a + r, 0) / n;
  const sl = rs.reduce((a, r, i) => a + (i - xm) * (r - m), 0) / rs.reduce((a, r, i) => a + (i - xm) * (i - xm), 0);
  return { h: (A.h - h0) * D, wob: rs.reduce((a, r, i) => Math.max(a, Math.abs(r - m - sl * (i - xm))), 0) };
}
{
  const off = pull(1, 1).h, iz = pull(0, 1).h, fr = pull(2, 1).h, fl = pull(2, 0).h, bent = pull(2, 0, 0.6), crush = pull(2, 0, 0.3), both = pull(2, [0, 1], 0.6), bent1 = pull(1, 0, 0.6);
  ok('poškodbe Samo videz and Izklop: a crushed corner, the car runs straight', Math.abs(off) < 0.01 && Math.abs(iz) < 0.01, off.toFixed(2) + '° / ' + iz.toFixed(2) + '°');
  ok('poškodbe Vklop: front-right crushed pulls right, front-left left, a few degrees', fr > 2 && fr < 12 && fl < -2 && fl > -12, 'FR ' + fr.toFixed(1) + '°, FL ' + fl.toFixed(1) + '°');
  // (both front wheels bent alike: the car is its own mirror image, so the two shakes cancel and it runs straight, as trki.test.js asks)
  ok('poškodbe Vklop: a bent front wheel (cd 0.6) shakes the turn rate once a wheel turn, a crushed corner that bends no wheel (0.3) does not; both bent alike run straight; Samo videz: nothing', bent.wob > 0.05 && bent.wob < 3 && crush.wob < 0.02 && Math.abs(both.h) < 0.01 && bent1.wob < 0.001, 'shake ' + bent.wob.toFixed(3) + '°/s, no bend ' + crush.wob.toFixed(4) + '°/s, both ' + both.h.toFixed(2) + '°, Samo videz ' + bent1.wob.toFixed(4) + '°/s');
  // an online race (Core.setCrash({ net: 1 }), game.js xPhys(true) when a friend's car is in the race): the crushed-corner pull is off for every car,
  // so both phones drive the knocked car the same way, as before P3. A light-knock pull that was a few degrees locally must be flat here.
  C.setCrash({ net: 1 });
  const netFr = pull(2, 1).h, netFl = pull(2, 0).h;
  C.setCrash({});
  const locFr = pull(2, 1).h;
  ok('online race (net): the damage pull is off (both phones drive the same), while a local race still pulls', Math.abs(netFr) < 0.01 && Math.abs(netFl) < 0.01 && locFr > 2,
    'net FR ' + netFr.toFixed(2) + '°, FL ' + netFl.toFixed(2) + '°, local FR ' + locFr.toFixed(1) + '°');
}

let bad = 0;
console.log('== odboji, agresivni vozniki, vpliv poškodb na vožnjo');
for (const c of checks) { if (!c.ok) bad++; console.log(`${c.ok ? 'OK  ' : 'FAIL'} ${c.name}${c.detail ? ' — ' + c.detail : ''}`); }
console.log(bad ? `FAIL: ${bad} of ${checks.length} checks` : `OK: all ${checks.length} checks`);
process.exitCode = bad ? 1 : 0;
