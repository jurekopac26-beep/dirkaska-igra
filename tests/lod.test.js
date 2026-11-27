// The physics level of detail of a very big field (Core LOD, Race._lodPlan; more than LOD.min cars with the player, offline: Nürburg's
// hundred). An AI car away from the player is worked out every LOD.k-th step (30 Hz) or, over LOD.r2 m away, every LOD.k2-th (30 Hz too:
// see 8; 15 Hz before), over the time since its last step; within LOD.a m ahead of the player, LOD.b m behind it along the race or LOD.r m of it in the world, at the full
// rate. Every 13/20/22-car race (and every golden reference) stays at the full rate. Checked here:
//   1. Nürburg, 100 cars, the flying start's column with a 15 s countdown (the player at its back 15 s below the line, half the field far
//      below it too: their crossings of the line in a longer step), the player on the autopilot, 30 s: no NaN; cars at the full and the lower rates; every car near
//      the player worked out every step over one step; the far ones every LOD.k-th or LOD.k2-th step at most, and on the way (none stuck, none rescued,
//      each over 250 m) and drawn smoothly between their steps (Race.lodT, as render.js and the replay use it); the cars that cross the line
//      in a step of several: the time taken where the line was crossed inside it
//   2. Marrakesh (a short circuit), 34 cars, the lights, one lap to the finish, the player last on the grid: every car home, each lap time
//      from the line to the line, the times of the far cars on the steps of 1/120 s inside their longer steps, the order of the finish by the time
//   3. Nürburg, 100 cars, two laps, the safety car out after 10 s: LOD on behind it (the full rate within LOD.r m of it), no NaN, the
//      safety car and the leader on the way (the queue further back stops behind a stopped car or in a pack two abreast and is rescued
//      as often at the full rate: not checked here)
//   4. A 22-car race: no LOD at all
//   5. Nürburg, 100 cars as the game has them (the flying start, the player at the back), 90 s, with the default knock (Simulacija) and
//      the old one (Trki med avti: Stara): a car close to another (LOD.nr) worked out every step; few hard knocks far ahead of the player (a
//      touch on an extrapolated place, or two far cars running through each other, as before: 0.16 and 0.24 a car-minute in these races)
//   6. LOD.off (the quick entry's lod=0): a 100-car race at the full rate
//   7. Spa, 100 cars from the grid (the lights, as the race after qualifying), the player last, 40 s: no
//      pile-up in the first corners (no rival standing 3 s on end, none rescued, the player over the line). Without LOD.nr the far cars
//      at 15 Hz touched on extrapolated places, spun and closed the corners: 23-30 rivals stood 3 s or more, 12-19 rescued, the player
//      still 235-280 m behind the line after 40 s (four seeds; on Trois-Rivières, the shortest circuit, a pile-up stays in some races)
//   8. Spa, 101 cars from the grid (the lights), the player 50th, three seeds, 45 s, LOD on and off: the first corner does not stall the
//      field (no safety car, no rivals in reverse by the dozen, the field as far as with LOD off). The stall: a jam in the first corner,
//      a yellow, the safety car, the field brakes to a stop behind it and backs away. With the cars over LOD.r2 m ahead at 15 Hz (k2 8)
//      in all three of these races (35-57 rivals in reverse at once, the field 52-85 km on instead of 128 km) and in 6 of 20 after 30 s
//      (seeds 1-20); at 30 Hz there (k2 4) in none of the three and in 1 of 20; with LOD off in 1 of 20 too (another seed): the jam
//      itself is not the LOD's, the 15 Hz stage made it six times as common
//   9. The player's car is no part of the LOD, and the quick search of the track's samples changes nothing. The player alone on the
//      track (the time trial's drive: no rivals, the first place of the grid) on the autopilot for 60 s, on Spa (a circuit) and on Pikes
//      (an open road): the same trace to the bit (every plain value of the race and of the car after every step, hashed) with LOD as
//      the game has it, with LOD.off and with the LOD forced on for the one car (LOD.min 0: on the circuit the plan on and the player at
//      the full rate, on the time trial's road no plan at all).
//      And Track.query finds from every hint of both tracks the sample that the plain search finds: the 21 samples round the hint, the
//      lap's wrap worked out at every sample (the search as it was before the quick one, which takes the same samples in the same
//      order away from the ends of the lap). The traces as they were before a change: the golden net (tests/golden.test.js: every real
//      track, the player alone on the time trial's tracks)
//   node tests/lod.test.js
'use strict';
const crypto = require('crypto');
const { loadCore } = require('./lib/core.js');
const { DT, seeded, raceState } = require('./lib/sim.js');

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
  for (let i = 0; i < N; i++) if (gapMax[i] + 1 > Math.max(L.k, L.k2)) lodMaxBad++;
  const prog = r.cars.map((c, i) => c.dist - start[i]), stuck = Math.max(...r.cars.map(c => c.stuckT));
  check('Nürburg, 100 cars, the flying start, 30 s: no NaN in any car', nan === 0, `${nan} bad values; ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  check(`the cars at the full rate near the player and at the lower ones further away (every ${L.k}th step, every ${L.k2}th over ${L.r2} m away)`, seen[1] > 0 && seen[L.k] > 0 && seen[L.k2] > 0, JSON.stringify(seen));
  check(`every car within ${L.a} m ahead of the player, ${L.b} m behind it or ${L.r} m of it: worked out every step, over one step (the first there over the time since its last)`, nearN > 1000 && nearBad === 0, `${nearBad} of ${nearN} car-steps`);
  check(`a far car: never more than ${Math.max(L.k, L.k2)} steps between two of its steps`, lodMaxBad === 0, `${lodMaxBad} cars; most ${Math.max(...gapMax) + 1}`);
  check('the far cars on the way: each car over 250 m, none stuck, none rescued', Math.min(...prog) > 250 && stuck < 2 && resc === 0, `least ${Math.min(...prog).toFixed(0)} m, most stuck ${stuck.toFixed(1)} s, ${resc} rescues`);
  jerk.sort((a, b) => a - b); const jq = (p) => jerk[Math.min(jerk.length - 1, Math.floor(jerk.length * p))];
  check('a far car drawn smoothly between its steps (Race.lodT): it moves on as fast as it goes, every step, not in jumps every 4th or 8th',
    jerk.length > 10000 && jq(0.99) < 0.1 && jq(1) < 1, `off by p50 ${jq(0.5).toFixed(3)}, p99 ${jq(0.99).toFixed(3)}, most ${jq(1).toFixed(2)} m a step (${jerk.length} car-steps)`);
  check('over the line in a step of several: the lap starts where the line was crossed inside it (on the steps of 1/120 s), not at the step\'s end',
    cross > 20 && crossIn > 10 && crossBad === 0, `${cross} crossings, ${crossIn} in a longer step, ${crossBad} wrong; worst ${(worst * 1000).toFixed(1)} ms from the even crossing`);   // (only the cars below the line at the start cross it: the column's others start past it, on their first lap)
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
  const t0 = Date.now(), r = race('nring', 99, { flying: 3, playerGrid: 99, laps: 2 }), P = r.player, N = r.cars.length;
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

// ---- 5. Nürburg, 100 cars as the game has them (the flying start, the player at the back): a car close to another at the full rate ----
for (const [name, tx, lim, seed] of [['the default knock (Simulacija)', {}, 0.1, 33], ['Trki med avti: Stara (the old knock)', { cv: 5 }, 0.12, 21]]) {   // (one race each: 0-0.12 and 0.035-0.05 over three seeds, before 0.07-0.24 and 0.22-0.6)
  C.setTest(tx);
  let far = 0, hard = 0, nrN = 0, nrBad = 0;
  {
    const r = race('nring', 99, { flying: 3, playerGrid: 999, seed }), P = r.player, N = r.cars.length, nr0 = new Uint8Array(N);
    r.start();
    drive(r, Math.round(90 / DT), (k) => {
      const D = r._lod;
      for (let i = 0; i < N; i++) {
        const c = r.cars[i];
        if (D && D.on && r.state === 'racing' && nr0[i] && !c.finished) { nrN++; if (D.kk[i] !== 1 || !D.st[i]) nrBad++; }
        nr0[i] = D && D.nr ? D.nr[i] : 0;
        if (k > 600 && c !== P && c.speed > 3 && c.dist - P.dist > L.r2) { far += DT / 60; if (c.hitCar > 3.5) hard++; }
        c.hitCar = 0;
      }
    });
  }
  C.setTest({});
  check(`${name}: a car within 1 m of another's bumper or 0.6 m of its side (Race._pairs, LOD.nr) worked out every step`, nrN > 1000 && nrBad === 0, `${nrBad} of ${nrN} car-steps`);
  check(`${name}: hard knocks (over 3.5 m/s) more than ${L.r2} m ahead of the player under ${lim} a car-minute (touches on extrapolated places: 0.16 and 0.24 in these races)`,
    far > 100 && hard / far < lim, `${hard} in ${far.toFixed(0)} car-minutes: ${(hard / far).toFixed(3)}`);
}

// ---- 6. LOD off for the visit (the quick entry's lod=0): a 100-car race at the full rate ----
{
  L.off = true; const r = race('nring', 99, { flying: 3, playerGrid: 999 }); r.start();
  drive(r, 600, () => {});
  L.off = false;
  check('LOD.off (the quick entry\'s lod=0): Nürburg\'s 100 cars every one every step', !r._lod || !r._lod.on, r._lod && r._lod.on ? 'LOD on' : '');
}

// ---- 7. Spa, 100 cars from the grid (the lights), the player last: no pile-up in the first corners ----
for (const seed of [9, 7]) {   // (the longest a rival stood: 0.7 and 0.6 s; 0.0-1.5 s over four seeds, before LOD.nr 5.7-9.1 s)
  const r = race('spa', 100, { flying: 0, playerGrid: 999, laps: 3, seed }), P = r.player, st = new Float64Array(r.cars.length);
  let worst = 0, resc = 0; const orig = r.rescue; r.rescue = function (c) { if (c !== P) resc++; return orig.call(this, c); };
  r.start();
  drive(r, Math.round(40 / DT), (k) => {
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    if (k * DT >= 4) r.cars.forEach((c, i) => { if (c !== P) { st[i] = Math.hypot(c.vx, c.vz) < 3 ? st[i] + DT : 0; worst = Math.max(worst, st[i]); } });   // (stood: under 3 m/s on end, from 4 s on)
  });
  check(`Spa, 100 cars from the grid (the lights), seed ${seed}, 40 s: no pile-up in the first corners (no rival standing 3 s on end, none rescued, the player over the line)`,
    r.cars.length === 101 && worst < 3 && resc === 0 && P.dist > 0, `the longest a rival stood ${worst.toFixed(1)} s, ${resc} rivals rescued, the player at ${P.dist.toFixed(0)} m`);
}

// ---- 8. Spa, 101 cars from the grid (the lights), the player 50th: the first corner does not stall the field ----
{
  // a race of 45 s: the most rivals in reverse at once, the safety car out or not, how far the field got (the sum of dist), where the player is
  const run = (seed, off) => {
    L.off = off; const r = race('spa', 100, { playerGrid: 50, laps: 3, seed }), P = r.player; let rev = 0, sc = false;
    r.start();
    drive(r, Math.round(45 / DT), () => {
      let m = 0; for (const c of r.cars) if (c !== P && c.gear === -1 && c.vl < -0.5) m++;
      if (m > rev) rev = m; if (r.fl && r.fl.sc) sc = true;
    });
    L.off = false;
    return { rev, sc, km: r.cars.reduce((a, c) => a + c.dist, 0) / 1000, p: P.dist, lod: !!(r._lod && r._lod.on), n: r.cars.length };
  };
  for (const seed of [9, 10, 11]) {   // (k2 8: the safety car out in all three, 35-57 in reverse, 52.9, 51.6 and 84.7 km; k2 4: 128.7, 128.2, 129.9 km; off: 127.5, 127.9, 128.1 km)
    const a = run(seed, false), b = run(seed, true);
    check(`Spa, 101 cars from the grid, the player 50th, seed ${seed}, 45 s: no stall in the first corner (no safety car, at most 5 rivals in reverse at once, the field at least 0.95 of as far as with LOD off)`,
      a.n === 101 && a.lod && !b.lod && !a.sc && a.rev <= 5 && a.km > 0.95 * b.km,
      `LOD on: ${a.sc ? 'the safety car out, ' : ''}most in reverse ${a.rev}, the field ${a.km.toFixed(1)} km, the player at ${a.p.toFixed(0)} m; off: ${b.sc ? 'the safety car out, ' : ''}most in reverse ${b.rev}, ${b.km.toFixed(1)} km, the player at ${b.p.toFixed(0)} m`);
  }
}

// ---- 9. the player alone (the time trial's drive): the same trace to the bit with and without the LOD; the quick search of the samples ----
{
  const alone = (id, set) => {
    const keep = Object.assign({}, L); Object.assign(L, set);
    try {
      const r = race(id, 0, { playerGrid: 1 }), h = crypto.createHash('sha256'); r.start();
      let on = 0;
      drive(r, Math.round(60 / DT), () => { h.update(raceState(r)); if (r._lod && r._lod.on) on++; });
      return { dig: h.digest('hex').slice(0, 24), d: r.player.dist, on, n: r.cars.length, tt: !!r.timeTrial };
    } finally { Object.assign(L, keep); }
  };
  // the search before the quick one: the 21 samples round the hint, the lap's wrap worked out at every sample
  const plain = (T, x, z, hint) => {
    let bi = -1, bd = 1e18;
    for (let o = -10; o <= 10; o++) {
      const i = T.open ? hint + o : (hint + o + T.N) % T.N;
      if (T.open && (i < 0 || i >= T.N)) continue;
      const dx = x - T.px[i], dz = z - T.pz[i], d = dx * dx + dz * dz;
      if (d < bd) { bd = d; bi = i; }
    }
    return bi;
  };
  for (const [id, open] of [['spa', false], ['pikes', true]]) {
    const a = alone(id, {}), b = alone(id, { off: true }), c = alone(id, { min: 0 });
    check(`${id}, the player alone, 60 s: the same trace to the bit with LOD as the game has it, with LOD.off and with the LOD forced on for the one car`,
      a.n === 1 && a.d > 500 && a.tt === open && !a.on && !b.on && (a.tt ? !c.on : c.on > 7000) && a.dig === b.dig && a.dig === c.dig,
      `${a.d.toFixed(1)} m, trace ${a.dig} / off ${b.dig} / forced on ${c.dig} (the plan on in ${c.on} steps${a.tt ? ': a time trial has none' : ''})`);
    // every hint of the track; the car at the hint's sample, a little off it, and at samples ahead of and behind the hint (the car has
    // moved on since the hint was found; -10, 10: the ends of the search, 12: out of it)
    const T = new C.Track(C.TRACKS.find(d => d.id === id)), N = T.N, out = {};
    let m = 0, diff = 0, first = '';
    for (let h = 0; h < N; h++) for (const [o, ox, oz] of [[0, 0, 0], [0, 1.6, -1.2], [7, 0, 0], [-9, -0.7, 0.4], [10, 0, 0], [-10, 0, 0], [12, 0.3, 0.3]]) {
      const i = T.open ? Math.max(0, Math.min(N - 1, h + o)) : (h + o + N) % N, x = T.px[i] + ox, z = T.pz[i] + oz;
      const want = plain(T, x, z, h), got = T.query(x, z, h, out).i;
      m++; if (got !== want) { diff++; first = first || `hint ${h}, ${o} samples on: ${got}, the plain search ${want}`; }
    }
    check(`${id} (${T.open ? 'an open road' : 'a circuit'}, ${N} samples): Track.query finds from every hint the sample of the plain search of the 21 samples round it`,
      T.open === open && !T.stubs && m === N * 7 && !diff, `${m} searches, ${diff} other${first ? ' (' + first + ')' : ''}`);
  }
}

console.log(`\n${n - bad}/${n} OK`);
process.exit(bad ? 1 : 0);
