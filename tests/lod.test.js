// The physics level of detail of a very big field (Core LOD, Race._lodPlan; more than LOD.min cars with the player, offline: Nürburg's
// hundred). An AI car away from the player is worked out every LOD.k-th step (30 Hz) or, further away, every LOD.k2-th (15 Hz), over the
// time since its last step; within LOD.a m ahead of the player, LOD.b m behind it along the race or LOD.r m of it in the world, at the full
// rate. Every 13/20/22-car race (and every golden reference) stays at the full rate. Checked here:
//   1. Nürburg, 100 cars, the flying start (15 m/s), the player 12th on the autopilot, 30 s: no NaN; cars at all three rates; every car near
//      the player worked out every step over one step; the far ones every 4th or 8th step at most, and on the way (none stuck, none rescued,
//      each over 250 m) and drawn smoothly between their steps (Race.lodT, as render.js and the replay use it); the cars that cross the line
//      in a step of several: the time taken where the line was crossed inside it
//   2. Marrakesh (a short circuit), 34 cars, the lights, one lap to the finish, the player last on the grid: every car home, each lap time
//      from the line to the line, the times of the far cars on the steps of 1/120 s inside their longer steps, the order of the finish by the time
//   3. Nürburg, 100 cars, two laps, the safety car out after 10 s: LOD on behind it (the full rate within LOD.r m of it), no NaN, the
//      safety car and the leader on the way (the queue further back stops behind a stopped car or in a pack two abreast and is rescued
//      as often at the full rate: not checked here)
//   4. A 22-car race: no LOD at all
//   node tests/lod.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const L = C.LOD;
// the game's race (game.js newRace, the default settings), champ: the field asked for (not the track's def.rivals)
function race(id, numAI, extra) {
  const d = C.TRACKS.find(x => x.id === id), T = new C.Track(d);
  return new C.Race(T, Object.assign({ numAI, playerGrid: 12, playerModel: C.MODELS[0], playerUpg: { motor: 0, gume: 0, zavore: 0, aero: 0 }, assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs',
    laps: 1, fuel: false, rain: 0, tyres: !!d.pit, compounds: true, flags: true, chars: true, slip: true, faults: true, radio: true, champ: true }, extra));
}
// a run: k steps (the player on the autopilot, Math.random seeded as tests/lib/sim.js does); `each` after every step, with the cars'
// dist, lap and place before it (B)
function drive(r, steps, each) {
  const orig = Math.random, N = r.cars.length, B = { d: new Float64Array(N), l: new Int32Array(N), x: new Float64Array(N), z: new Float64Array(N), sc: null };
  try {
    for (let k = 1; k <= steps; k++) {
      Math.random = seeded(1000 + k);
      for (let i = 0; i < N; i++) { const c = r.cars[i]; B.d[i] = c.dist; B.l[i] = c.lap; B.x[i] = c.x; B.z[i] = c.z; }
      const X = r.fl && r.fl.sc && r.fl.sc.car; B.sc = X ? { x: X.x, z: X.z } : null;   // (the safety car, where it was when the step began)
      C.aiControl(r.player, r, DT); r.step(DT);
      if (each(k, B.d, B.l, B) === false) break;
    }
  } finally { Math.random = orig; }
}
// near the player for the full rate (as Race._lodPlan has it: where the cars were when the step began)
const nearP = (B, i, p) => { const g = B.d[i] - B.d[p], dx = B.x[i] - B.x[p], dz = B.z[i] - B.z[p]; return (g <= L.a && g >= -L.b) || dx * dx + dz * dz <= L.r * L.r; };
// a crossing of dist x in a step that covered m steps (dist d0 -> d1): the end of the step of 1/120 s it fell in (Race._tCross), and the
// time the line was crossed if the car went on evenly through the step
const tStep = (t, x, d0, d1, m) => t - DT * Math.min(m - 1, Math.floor(m * Math.min(1, Math.max(0, (d1 - x) / (d1 - d0)))));
const tLin = (t, x, d0, d1, m) => t - DT * m * (d1 - x) / (d1 - d0);

// ---- 1. Nürburg, 100 cars, the flying start ----
{
  const t0 = Date.now(), r = race('nring', 99, { flying: 15, playerGrid: 12 }), P = r.player, N = r.cars.length;
  let resc = 0; const orig = r.rescue; r.rescue = function (c) { resc++; return orig.call(this, c); };
  r.start();
  const start = r.cars.map(c => c.dist), gap = new Int32Array(N), gapMax = new Int32Array(N), was = new Uint8Array(N), seen = { 1: 0, 4: 0, 8: 0 };
  let nan = 0, nearBad = 0, nearN = 0, lodMaxBad = 0, cross = 0, crossBad = 0, crossIn = 0, worst = 0;
  const dx0 = new Float64Array(N), dz0 = new Float64Array(N), jerk = [];   // (the drawn place a step before, render.js updateCars: lerp(px, x, Race.lodT(c, 0.5)))
  const pi = r.cars.indexOf(P);
  drive(r, Math.round(30 / DT), (k, d0, l0, B) => {
    const D = r._lod;
    for (let i = 0; i < N; i++) {
      const c = r.cars[i];
      if (!Number.isFinite(c.x + c.z + c.vx + c.vz + c.h + c.dist + (c.y || 0))) nan++;
      if (!D || !D.on) continue;
      seen[D.kk[i]] = (seen[D.kk[i]] || 0) + 1;
      const nr = c !== P && nearP(B, i, pi);   // (near the player: every step, over one step from its second step there on: the first makes up for the time since its last)
      if (nr) { nearN++; if (!D.st[i] || (was[i] && Math.abs(D.dt[i] - DT) > 1e-12)) nearBad++; } was[i] = nr ? 1 : 0;
      if (D.st[i]) { gap[i] = 0; } else if (++gap[i] > gapMax[i]) gapMax[i] = gap[i];
      const u = r.lodT(c, 0.5), x = c.px + (c.x - c.px) * u, z = c.pz + (c.z - c.pz) * u;
      if (k > 600 && D.kk[i] > 1) jerk.push(Math.abs(Math.hypot(x - dx0[i], z - dz0[i]) - c.speed * DT));   // (how much more or less than its speed the drawn car moves in a step)
      dx0[i] = x; dz0[i] = z;
      if (D.st[i] && c.lap > l0[i] && l0[i] === 0) {   // (over the line for the first time: the lap's start)
        const m = Math.round(D.dt[i] / DT); cross++;
        if (m > 1) { crossIn++; const e = tStep(r.time, 0, d0[i], c.dist, m), lin = tLin(r.time, 0, d0[i], c.dist, m); worst = Math.max(worst, Math.abs(c.lapStart - lin));
          if (Math.abs(c.lapStart - e) > 1e-9 || !(c.lapStart > r.time - m * DT - 1e-9 && c.lapStart <= r.time + 1e-9) || Math.abs(c.lapStart - lin) > DT + 1e-9) crossBad++; }
        else if (c.lapStart !== r.time) crossBad++;
      }
    }
  });
  for (let i = 0; i < N; i++) if (gapMax[i] + 1 > L.k2) lodMaxBad++;
  const prog = r.cars.map((c, i) => c.dist - start[i]), stuck = Math.max(...r.cars.map(c => c.stuckT));
  check('Nürburg, 100 cars, the flying start, 30 s: no NaN in any car', nan === 0, `${nan} bad values; ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  check('the cars at all three rates: the full one near the player, every 4th and every 8th step further away', seen[1] > 0 && seen[L.k] > 0 && seen[L.k2] > 0, JSON.stringify(seen));
  check(`every car within ${L.a} m ahead of the player, ${L.b} m behind it or ${L.r} m of it: worked out every step, over one step (the first there over the time since its last)`, nearN > 1000 && nearBad === 0, `${nearBad} of ${nearN} car-steps`);
  check(`a far car: never more than ${L.k2} steps between two of its steps`, lodMaxBad === 0, `${lodMaxBad} cars; most ${Math.max(...gapMax) + 1}`);
  check('the far cars on the way: each car over 250 m, none stuck, none rescued', Math.min(...prog) > 250 && stuck < 2 && resc === 0, `least ${Math.min(...prog).toFixed(0)} m, most stuck ${stuck.toFixed(1)} s, ${resc} rescues`);
  jerk.sort((a, b) => a - b); const jq = (p) => jerk[Math.min(jerk.length - 1, Math.floor(jerk.length * p))];
  check('a far car drawn smoothly between its steps (Race.lodT): it moves on as fast as it goes, every step, not in jumps every 4th or 8th',
    jerk.length > 10000 && jq(0.99) < 0.1 && jq(1) < 1, `off by p50 ${jq(0.5).toFixed(3)}, p99 ${jq(0.99).toFixed(3)}, most ${jq(1).toFixed(2)} m a step (${jerk.length} car-steps)`);
  check('over the line in a step of several: the lap starts where the line was crossed inside it (on the steps of 1/120 s), not at the step\'s end',
    cross > 50 && crossIn > 10 && crossBad === 0, `${cross} crossings, ${crossIn} in a longer step, ${crossBad} wrong; worst ${(worst * 1000).toFixed(1)} ms from the even crossing`);
}

// ---- 2. Marrakesh, 34 cars, one lap to the finish ----
{
  const t0 = Date.now(), r = race('marrakesh', 33, { playerGrid: 99 }), P = r.player, N = r.cars.length, T = r.track;
  let resc = 0; const orig = r.rescue; r.rescue = function (c) { resc++; return orig.call(this, c); };
  for (let k = 0; k < 120; k++) r.step(DT);   // (a second on the grid)
  r.start();
  let nan = 0, fin = 0, finIn = 0, finBad = 0, lapBad = 0, lod = 0, worst = 0;
  const lapStart = new Float64Array(N);
  drive(r, Math.round(200 / DT), (k, d0, l0) => {
    const D = r._lod; if (D && D.on) lod++;
    for (let i = 0; i < N; i++) {
      const c = r.cars[i];
      if (!Number.isFinite(c.x + c.z + c.vx + c.vz + c.dist)) nan++;
      if (c.lap > l0[i] && l0[i] === 0) lapStart[i] = c.lapStart;
      if (c.finished && c.lap > l0[i]) {   // (home in this step)
        fin++;
        const m = D && D.on && D.st[i] ? Math.round(D.dt[i] / DT) : 1, x = r.laps * T.len;
        if (Math.abs(c.lapTimes[0] - (c.finishTime - lapStart[i])) > 1e-9) lapBad++;
        if (m > 1) { finIn++; const lin = tLin(r.time, x, d0[i], c.dist, m); worst = Math.max(worst, Math.abs(c.finishTime - lin)); if (Math.abs(c.finishTime - tStep(r.time, x, d0[i], c.dist, m)) > 1e-9 || Math.abs(c.finishTime - lin) > DT + 1e-9) finBad++; }
        else if (c.finishTime !== r.time) finBad++;
      }
    }
    return !r.cars.every(c => r.isOut(c));
  });
  const F = r.finishOrder; let ord = true; for (let j = 0; j < F.length; j++) if (F[j].finishPos !== j + 1 || (j && F[j].finishTime < F[j - 1].finishTime - 1e-9)) ord = false;
  check('Marrakesh, 34 cars, the lights, one lap: every car home, no NaN', F.length === N && nan === 0 && lod > 0, `${F.length} of ${N} home after ${r.time.toFixed(1)} s, ${nan} bad values, ${resc} rescues; ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  check('each lap time from the line to the line (the lap\'s start and its end where they were crossed)', fin === N && lapBad === 0, `${lapBad} of ${fin}`);
  check('a far car home in a step of several: its time on the steps of 1/120 s inside it, within a step of the even crossing; any other at the step\'s end',
    finIn > 0 && finBad === 0, `${finIn} of ${fin} in a longer step, ${finBad} wrong; worst ${(worst * 1000).toFixed(1)} ms`);
  check('the finish in the order of the times, the places 1..34', ord, F.slice(0, 6).map(c => c.finishTime.toFixed(3)).join(' '));
}

// ---- 3. Nürburg, 100 cars, two laps, the safety car out: LOD on behind it ----
{
  const t0 = Date.now(), r = race('nring', 99, { flying: 15, playerGrid: 99, laps: 2 }), P = r.player, N = r.cars.length;
  let resc = 0; const orig = r.rescue; r.rescue = function (c) { resc++; return orig.call(this, c); };
  r.start();
  let nan = 0, scN = 0, lodN = 0, nearN = 0, nearBad = 0, out = false, scD0 = 0; const seen = { 1: 0, 4: 0, 8: 0 }, start = new Float64Array(N);
  drive(r, Math.round(45 / DT), (k, d0, l0, B) => {
    if (k === Math.round(10 / DT)) { r._scOut(r.order.find(c => !c.finished)); out = true; r.cars.forEach((c, i) => { start[i] = c.dist; }); scD0 = r.fl.sc.car.dist; return; }   // (out after 10 s, ahead of the leader)
    const D = r._lod, S = r.fl && r.fl.sc;
    for (let i = 0; i < N; i++) { const c = r.cars[i]; if (!Number.isFinite(c.x + c.z + c.vx + c.vz + c.h + c.dist + (c.y || 0))) nan++; }
    if (!out || !S || !B.sc) return;
    scN++; if (D && D.on && D.kk.some(x => x > 1)) lodN++;
    for (let i = 0; i < N; i++) { const c = r.cars[i]; if (D && D.on) seen[D.kk[i]] = (seen[D.kk[i]] || 0) + 1; const dx = B.x[i] - B.sc.x, dz = B.z[i] - B.sc.z; if (c !== P && dx * dx + dz * dz <= L.r * L.r) { nearN++; if (D && D.on && !D.st[i]) nearBad++; } }
  });
  const S = r.fl.sc, lead = r.order[0], i0 = r.cars.indexOf(lead);
  check('Nürburg, 100 cars, two laps, the safety car out after 10 s: no NaN, LOD on behind it (cars at 30 and 15 Hz, not the whole field at the full rate)',
    nan === 0 && scN > 3000 && lodN === scN && seen[L.k] > 0 && seen[L.k2] > 0, `${nan} bad values, ${scN} steps with the safety car out, ${lodN} with LOD, ${JSON.stringify(seen)}; ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  check(`every car within ${L.r} m of the safety car: worked out every step`, nearN > 1000 && nearBad === 0, `${nearBad} of ${nearN} car-steps`);
  check('the safety car and the leader behind it on the way (over 300 m in 35 s)', !!(S && S.car) && S.car.dist - scD0 > 300 && lead.dist - start[i0] > 300,
    `the leader ${(lead.dist - start[i0]).toFixed(0)} m, the safety car ${S && S.car ? (S.car.dist - scD0).toFixed(0) + ' m, ' + S.state : 'gone'}; ${resc} rescues behind it (the queue, as at the full rate)`);
}

// ---- 4. a 22-car race: the full rate ----
{
  const r = race('spa', 21, {}); r.start();
  drive(r, 240, () => {});
  check('a 22-car race (Spa): no LOD (every car every step, as the golden references)', !r._lod, r._lod ? 'LOD on' : '');
}

console.log(`\n${n - bad}/${n} OK`);
process.exit(bad ? 1 : 0);
