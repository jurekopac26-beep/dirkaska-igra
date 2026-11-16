// AI and flags (docs/pregled-jedra.md, J14, J23 and J3; Core only, no browser): the examples of the review with their seeds.
// J14: on a circuit an AI car sees a car it laps (where it is on the track, its gap less the whole laps between them) as in its way,
//   as a car on the same lap: the player held on the racing line on the Red Bull Ring (Štajerska, Avstrija), 7 rivals, 3 laps, seed 9
//   (before, not one of the rivals lapping it took it for a hazard in a single step).
// J23: a rival stopped on the track that wants to come into the pits brings out the yellow flag and the safety car as any stopped car
//   (before, its pit wish hid it from the flags: no yellow until the field drove into it); Bathurst, 12 rivals, 8 laps, flags, seed 9.
// J3: a pit stop with »Ne menjaj« (the tyres stay on) keeps the KOLIBRI's own tyres too (before, four new ones every stop); a burning
//   tyre is changed all the same (as a burst one).
// J1: the flying start's column: a car that starts past the first TV sector's line gets its sector times all race (before, none: it
//   waited for that line of the first lap); Marrakesh (Maroko), 40 rivals, a lap, seed 9. (J4, the wheel rule's second wheel: gone with #548, the first wheel off ends the game)
//   node tests/ai-zastave.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const wrap = (d, L) => { d = ((d % L) + L) % L; return d > L / 2 ? d - L : d; };
// a car put on the racing line at s (its race distance moved with it), standing
function putOnLine(T, X, s) {
  const i = T.idx(s), off = T.rl[i], s0 = X.q.s;
  X.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, T.hd[i]); if (T.hasElev) X.y = X.py = T.hy[i];
  X.q = T.query(X.x, X.z, i, X.q); X.sPrev = X.q.s; X.dist += wrap(X.q.s - s0, T.len); X.vx = X.vz = 0; X.w = 0;
}

// --- J14: the player stops on the racing line at s = 1236 m after 30 s and stays there; the rivals lap it
{
  Math.random = seeded(3);
  const T = track('rbring'), L = T.len, r = new C.Race(T, { numAI: 7, playerGrid: 8, laps: 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 9, difficulty: 1, damage: 0 });
  r.start(); const P = r.player, lane = new Map(), seen = new Map(), same = { lane: 0, seen: 0 };
  let t = 0, k = 0, put = false;
  while (t < 600 && r.cars.some(c => !c.isPlayer && !c.finished)) {
    Math.random = seeded(5000 + (++k));
    if (t > 30) { P.inThr = 0; P.inBrk = P.speed > 2 ? 1 : 0; P.inHand = P.speed > 2 ? 0 : 1; P.inSteer = 0; P.digitalSteer = true; if (!put && P.speed < 0.5) { putOnLine(T, P, 1236); put = true; } }
    else { P.digitalSteer = false; C.aiControl(P, r, DT); if (P.stuckT > 3) r.rescue(P); }
    r.step(DT); t += DT;
    if (!put) continue;
    for (const c of r.cars) {   // (a rival up to 22 m behind the player in its lane, the player the nearest car ahead of it there)
      if (c.isPlayer || c.finished) continue;
      const g = wrap(P.q.s - c.q.s, L); if (!(g > 0 && g < 22) || Math.abs(P.q.d - c.q.d) > 3.2) continue;
      if (r.cars.some(o => o !== c && o !== P && Math.abs(o.q.d - c.q.d) < 3.2 && wrap(o.q.s - c.q.s, L) > 0 && wrap(o.q.s - c.q.s, L) < g)) continue;
      const lapping = c.dist - P.dist > L / 2, S = lapping ? null : same;
      if (lapping) { lane.set(c.name, (lane.get(c.name) || 0) + 1); if (c.aiThreat === P) seen.set(c.name, (seen.get(c.name) || 0) + 1); }
      else { S.lane++; if (c.aiThreat === P) S.seen++; }
    }
  }
  const nl = [...lane.values()].reduce((a, b) => a + b, 0), ns = [...seen.values()].reduce((a, b) => a + b, 0);
  check('J14: rivals lapping a car stopped on the racing line come up behind it', put && lane.size >= 2, `${lane.size} rivals, ${nl} steps up to 22 m behind it in its lane`);
  check('J14: they see it as in their way, as a rival on its lap does (before: in no step; each one there 0.25 s or more)', lane.size >= 2 && [...lane.keys()].every(x => lane.get(x) < 30 || (seen.get(x) || 0) > lane.get(x) * 0.5) && ns > nl * 0.7,
    `${ns} of ${nl} steps (each: ${[...lane.keys()].map(x => `${seen.get(x) || 0}/${lane.get(x)}`).join(', ')}); on its lap ${same.seen} of ${same.lane}`);
}

// --- J23: a rival with damage 1.0 that wants the pits stands on the racing line for 4 s from 60 s
function stopRun(pit) {
  Math.random = seeded(3);
  const T = track('bathurst'), r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 8, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 9, difficulty: 1, flags: true, damage: 2 });
  r.start(); const P = r.player, S = { yel: null, sc: null, stopT: 0 };
  let t = 0, k = 0, X = null, hold = null;
  while (t < 70) {
    Math.random = seeded(5000 + (++k));
    P.digitalSteer = false; C.aiControl(P, r, DT); if (P.stuckT > 3) r.rescue(P);
    if (t > 60 && !X) { X = r.order.find(c => !c.isPlayer && c.lap >= 1 && c.speed > 20); putOnLine(T, X, X.q.s); X.dmg = 1; hold = { x: X.x, z: X.z, h: X.h, t0: t }; }
    r.step(DT); t += DT;
    if (X && t < hold.t0 + 4) { X.x = X.px = hold.x; X.z = X.pz = hold.z; X.h = hold.h; X.vx = X.vz = 0; X.w = 0; X.pitWant = pit; S.stopT = Math.max(S.stopT, X.fl.stopT); }
    if (X && S.yel == null && r.fl.yel.some(y => y.car === X)) S.yel = t - hold.t0;
    if (X && S.sc == null && r.fl.sc) S.sc = t - hold.t0;
  }
  S.name = X.name; return S;
}
{
  const A = stopRun(true), B = stopRun(false), f = (x) => x == null ? '-' : x.toFixed(1) + ' s';
  check('J23: a stopped rival on its way to the pits brings out the yellow flag (before: none while it stood)', A.yel != null && A.yel < 3 && A.stopT > 2.5, `yellow ${f(A.yel)} after it stopped, stopped ${A.stopT.toFixed(1)} s (${A.name})`);
  check('J23: and the safety car, as the same stopped car without its pit wish', A.sc != null && A.sc < 4 && B.sc != null && Math.abs(A.sc - B.sc) < 0.5 && Math.abs(A.yel - B.yel) < 0.2, `safety car ${f(A.sc)}, without the pit wish yellow ${f(B.yel)}, safety car ${f(B.sc)}`);
}

// --- J3: a pit stop with »Ne menjaj« keeps the KOLIBRI's worn tyres (its tyre set too); without it four new ones (kolibri-tyres.test.js)
{
  const KOL = C.MODELS.find(m => m.id === 'kolibri');
  const pitStop = (plan, hot) => {
    Math.random = seeded(3);
    const T = track('bathurst'), r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 2, playerModel: KOL, assist: 2, seed: 3, difficulty: 1, damage: 1, tyres: true, tyreRule: ['kolibri'], tyreCold: ['kolibri'] });
    r.start(); const P = r.player; P.kt.w = [0.6, 0.7, 0.8, 0.85]; P.kt.d = [0, 0, 0, 0]; P.kt.hot = hot; P.pitWant = true; P.pitPlan = plan;
    let t = 0, n0 = P.ty ? P.ty.n : 0, out = 0, stop = false;
    while (t < 400 && !P.finished) { C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.pitState === 'done') stop = true; if (stop && !P.inPit && (out += DT) > 3) break; }
    return { stop, w: P.kt.w.slice(), hot: P.kt.hot, wear: P.ty ? P.ty.wear : null, nNew: P.ty ? P.ty.n - n0 : 0 };
  };
  const f2 = (a) => a.map(x => x.toFixed(2)).join(' ');
  const K = pitStop({ ty: 'keep', fix: 'need' }, -1), N = pitStop({ ty: 'S', fix: 'need' }, -1), B = pitStop({ ty: 'keep', fix: 'need' }, 0);
  check('J3: »Ne menjaj«: the KOLIBRI keeps its own worn tyres and its set (before: four new ones)', K.stop && K.w.every((x, i) => x >= [0.6, 0.7, 0.8, 0.85][i]) && K.nNew === 0 && K.wear > 0.5, `wear ${f2(K.w)}, sets ${K.nNew}, ty.wear ${K.wear != null ? K.wear.toFixed(2) : '-'}`);
  check('J3: a change of tyres still gives four new ones', N.stop && N.w.every(x => x < 0.1) && N.nNew === 1, `wear ${f2(N.w)}, sets ${N.nNew}`);
  check('J3: a burning tyre is changed with »Ne menjaj« too (as a burst one)', B.stop && B.w.every(x => x < 0.1) && B.hot === -1, `wear ${f2(B.w)}, burning ${B.hot}`);
}

// --- J1: 40 rivals (more than 21: the flying start on a circuit too, js/game.js), the column's first car starts past the line of sector 1
{
  Math.random = seeded(3);
  const T = track('marrakesh'), r = new C.Race(T, { numAI: 40, playerGrid: 41, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 9, difficulty: 1, flying: 3, damage: 0 });
  r.start(); const P = r.player, past = r.cars.filter(c => c.dist >= T.sectors[1]);
  let t = 0, k = 0;
  while (t < 400 && r.cars.some(c => !c.finished)) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); if (P.stuckT > 3) r.rescue(P); r.step(DT); t += DT; }
  const fin = r.cars.filter(c => c.finished), all3 = fin.filter(c => c.secN === 3 && (past.includes(c) ? c.secT[1] > 0 && c.secT[2] > 0 : c.secT.every(x => x > 0)));
  check('J1: a flying start\'s first cars past the line of sector 1: every car with its sector times at the finish, those the times of sectors 2 and 3 (before: none)', past.length >= 1 && fin.length === r.cars.length && all3.length === fin.length,
    `${past.length} past the line (${past.map(c => c.secT.map(x => x.toFixed(1)).join('/')).join(', ')}), ${all3.length} of ${fin.length} with them; the race's best ${r.secBest.map(x => x.toFixed(2)).join('/')}`);
}

console.log(`\n${n - bad}/${n} OK`);
process.exit(bad ? 1 : 0);
