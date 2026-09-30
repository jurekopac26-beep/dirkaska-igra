// Race control (Core Race._flags): yellow flags, overtaking under yellow, track limits, the penalties in the results.
//   node tests/flags.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };

const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const race = (T, o) => { const r = new C.Race(T, Object.assign({ numAI: 6, playerGrid: 7, laps: 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o || {})); r.start(); return r; };
const dS = (T, a, b) => { const L = T.len; let d = a - b; d = ((d % L) + L) % L; return d > L / 2 ? d - L : d; };
const place = (T, c, s, lat, v) => { const i = T.idx(s); c.place(T.px[i] + T.nx[i] * lat, T.pz[i] + T.nz[i] * lat, T.hd[i]); if (T.hasElev) c.y = c.py = T.hy[i]; c.q = T.query(c.x, c.z, i, {}); c.sPrev = c.q.s; c.vx = Math.cos(c.h) * v; c.vz = Math.sin(c.h) * v; };
const hold = (T, c, s, lat) => { place(T, c, s, lat, 0); c.stuckT = 0; c.inThr = 0; c.inBrk = 1; };   // (a car kept stopped on the circuit: re-placed before every step, never rescued)

// 1. a stopped car: a yellow zone from 150 m before it to 40 m past it after 0.6 s, the cars there in it, cleared 4 s after it moves on
{ const T = track('jezero'), r = race(T), P = r.player, A = r.cars.find(c => c !== P), B = r.cars.filter(c => c !== P)[1];
  Math.random = seeded(3);
  for (let k = 0; k < 7 / DT; k++) { C.aiControl(P, r, DT); r.step(DT); }   // (past the start: race control is live after 6 s)
  const s0 = T.startS + 600;   // (A stopped on the road, held there)
  let t0 = null; for (let k = 0; k < 1.5 / DT; k++) { hold(T, A, s0, 0); r.step(DT); if (t0 == null && r.yellow.length) t0 = (k + 1) * DT; }
  const z = r.yellow[0];
  hold(T, A, s0, 0); place(T, B, s0 - 100, 0, 20); r.step(DT); const inB = !!z && B.yellowIn === z;
  hold(T, A, s0, 0); place(T, B, s0 - 170, 0, 20); r.step(DT); const outB = !B.yellowIn;
  check('a stopped car: a yellow zone after ~0.6 s, from 150 m before it to 40 m past it', z && z.car === A && t0 > 0.5 && t0 < 0.8 && inB && outB,
    `zone ${z ? 'at the stopped car' : 'none'} after ${t0 == null ? '-' : t0.toFixed(2)} s; a car 100 m before it ${inB ? 'in' : 'out'}, 170 m before ${outB ? 'out' : 'in'}`);
  place(T, A, s0, 0, 25); let clear = null;
  for (let k = 0; k < 6 / DT; k++) { A.inThr = 1; r.step(DT); if (clear == null && !r.yellow.length) clear = k * DT; }
  check('the zone clears ~4 s after the car moves on', clear != null && clear > 3.5 && clear < 4.6, `cleared after ${clear == null ? '-' : clear.toFixed(2)} s`);
}

// 2. under yellow the AI lifts and does not overtake: a line of AI cars passes a stopped one, their order holds in the zone
{ const T = track('jezero'); Math.random = seeded(5);
  const r = race(T, { numAI: 8, playerGrid: 9 }), P = r.player;
  for (let k = 0; k < 7 / DT; k++) { C.aiControl(P, r, DT); r.step(DT); }
  const ai = r.cars.filter(c => c !== P), X = ai[0], s0 = T.startS + 900;
  const xl = T.rl[T.idx(s0)] + 3;   // (X stopped just off the racing line)
  for (let k = 0; k < 1 / DT; k++) { hold(T, X, s0, xl); r.step(DT); }
  const q = ai.slice(1, 6); q.forEach((c, k) => place(T, c, s0 - 260 - k * 14, T.rl[T.idx(s0 - 260 - k * 14)] + (k % 2 ? 1.6 : -1.6), 32));
  const ps = s0 - 500;   // (the player parked well behind, out of the way)
  let swaps = 0, contacts = 0, vIn = 0, nIn = 0; const order = () => q.slice().sort((a, b) => b.dist - a.dist).map(c => c.name).join();
  let prev = null;
  for (let k = 0; k < 14 / DT; k++) {
    Math.random = seeded(900 + k); hold(T, X, s0, xl); hold(T, P, ps, -T.w + 1); r.step(DT);
    const inZone = q.filter(c => c.yellowIn); if (inZone.length) { const o = order(); if (prev && o !== prev && q.every(c => c.yellowIn || dS(T, c.q.s, s0) > 40)) swaps++; prev = o; }
    for (const c of inZone) { vIn += c.speed; nIn++; if (c.hitCar > 2) contacts++; }
    for (const c of r.cars) { c.hitCar = 0; c.hitWall = 0; }   // (as the game does after every frame)
  }
  check('under yellow the AI does not overtake and lifts', swaps === 0 && nIn > 0 && contacts === 0, `${swaps} changes of order in the zone, mean speed there ${(vIn / Math.max(1, nIn) * 3.6).toFixed(0)} km/h, ${contacts} contacts`);
}

// 3. the player overtaking under yellow: a warning, then 5 s
{ const T = track('jezero'); Math.random = seeded(7);
  const r = race(T, { numAI: 3, playerGrid: 4 }), P = r.player, [X, O] = r.cars.filter(c => c !== P);
  for (let k = 0; k < 7 / DT; k++) { C.aiControl(P, r, DT); r.step(DT); }
  const s0 = T.startS + 800;
  for (let k = 0; k < 1 / DT; k++) { hold(T, X, s0, 3); r.step(DT); }
  const pass = () => { O.q.s = P.q.s + 3; r._flags(DT); O.q.s = P.q.s - 3; r._flags(DT); };   // (the player moves past O on the road, both in the zone and moving)
  place(T, P, s0 - 80, -2, 20); place(T, O, s0 - 76, 2, 20); r._flags(DT);   // (both moving at 20 m/s, in the zone)
  const ev = []; P.flagEv = null; pass(); ev.push(P.flagEv, P.pen); P.flagEv = null; pass(); ev.push(P.flagEv, P.pen);
  check('the player overtaking under yellow: a warning, then 5 s', ev.join() === 'yellowPass,0,yellowPen,5', ev.join());
}

// 4. track limits: all four wheels past the kerb where the stewards watch; three warnings, then 5 s each; the kerb itself is track;
//    nowhere else; no stewards (rules 0): nothing
{ const T = track('jezero'); Math.random = seeded(9);
  const byPit = (i) => T.def.pit && T.pitAt(i * T.ds);
  const zi = (() => { for (let i = 0; i < T.N; i++) if (T.limZ[1][i] && !T.limZ[0][i] && !byPit(i)) return i; return -1; })();
  const zfree = (() => { for (let i = 0; i < T.N; i++) if (!T.limZ[0][i] && !T.limZ[1][i] && !byPit(i)) return i; return -1; })();
  const go = (r, P, i, ws, n) => { for (let k = 0; k < n; k++) { P.q = { i, d: 8, s: i * T.ds }; P.ws = ws.slice(); P.vx = 25; P.vz = 0; r.time = Math.max(r.time, 20); r._flags(0.05); } };
  const run = (opts, i, ws) => { const r = race(T, opts), P = r.player; r.state = 'racing'; P.locked = false; P.hitAt = -1e9; const ev = [];
    for (let e = 0; e < 5; e++) { go(r, P, i, ws, 8); ev.push(P.flagEv || '-'); P.flagEv = null; go(r, P, i, [0, 0, 0, 0], 2); }
    return { ev, warn: P.warn, pen: P.pen, r, P }; };
  const a = run({}, zi, [2, 3, 2, 2]);
  check('track limits: three warnings, then 5 s for each', a.ev.join() === 'limits,limits,limits,limitsPen,limitsPen' && a.warn === 5 && a.pen === 10, `${a.ev.join()}, ${a.warn} warnings, +${a.pen} s`);
  const b = run({}, zi, [1, 1, 1, 1]), c = run({}, zfree, [2, 2, 2, 2]), d = run({ rules: 0 }, zi, [2, 2, 2, 2]);
  check('the kerb is track, and only where the stewards watch; no stewards: no warnings', b.warn === 0 && c.warn === 0 && d.warn === 0 && d.pen === 0,
    `all four on the kerb ${b.warn}, off at an unwatched spot ${c.warn}, with the stewards off ${d.warn}`);
  // the penalty counts in the results (the classification by time + penalty)
  const r = a.r, P = a.P; r.cars.forEach((c, k) => { c.finished = true; c.finishTime = 100 + k; if (!r.finishOrder.includes(c)) r.finishOrder.push(c); });
  P.finishTime = 90; const res = r.estimateResults(), me = res.findIndex(e => e.car === P);
  check('a penalty is added to the race time in the results', Math.abs(res[me].time - 100) < 1e-9 && me === 1, `the player's time ${res[me].time} s (crossed the line in 90 s, +10 s), classified ${me + 1}.`);
}

// 5. whole races with both physics: race control never stops a race, the AI is never penalised
{ let ok = true, info = [];
  for (const [tid, phys] of [['gozd', 'cs'], ['suzuka', 'arcade'], ['monaco', 'arcade']]) {
    Math.random = seeded(11); const T = track(tid), r = race(T, { numAI: 12, playerGrid: 12, laps: 2, phys });
    let t = 0, k = 0; while (t < T.len * 2 / 12 + 200 && r.cars.some(c => !c.finished)) { Math.random = seeded(2000 + (++k)); C.aiControl(r.player, r, DT); r.step(DT); t += DT; for (const c of r.cars) { c.hitCar = 0; c.hitWall = 0; } }
    const aiPen = r.cars.filter(c => !c.isPlayer && (c.pen || c.warn)).length, fin = r.cars.every(c => c.finished);
    if (aiPen || !fin) ok = false; info.push(`${tid}/${phys} ${fin ? 'all finished' : 'NOT all finished'}, AI penalised ${aiPen}, player +${r.player.pen} s`);
  }
  check('whole races: everybody finishes, no AI car is penalised', ok, info.join('; '));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
