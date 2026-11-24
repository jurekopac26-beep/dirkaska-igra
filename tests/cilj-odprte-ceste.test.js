// The finish of an open road (A to B): the car that crosses the line first wins. The line (and a checkpoint's) is crossed where the car
// is on the road (q.s, the arch over it at T.finishS), not by the distance it has run (c.dist): that is a metre or two off the road's for
// every car in its own way (its grid slot snapped to the road's 2 m samples, the lookup jumping round the inside of a sharp corner), so by
// it a car right behind another at the line could finish before it (the user's report of 15. 11. 2026, Killar: 2nd by 0.03 s in the
// results, first under the arch in the race). On Chapman's Peak (a real open road with a field):
//   1. two cars at the line, the player 0.25 m ahead on the road but 3.5 m behind by the distance run: the player first, the time of its crossing;
//   2. whole races (21 AI + the player on autopilot, 2 seeds): every car's finish time is its crossing of the line on the road, the order theirs.
// Two cars across the line in the same step (24. 11. 2026: the order was the loop's, so the one 0.0001 s behind could be placed ahead):
//   1b. the one that crossed first is ahead whichever the loop took first, and each pulls up in a slot of its own past the line.
// The driving is not touched (only the times and the order are read).
//   node tests/cilj-odprte-ceste.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'chapman'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 21, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', difficulty: 2, damage: 2 }, o);

// 1. two cars at the line: the player ahead on the road, behind by the distance run
{
  Math.random = seeded(5);
  const r = new C.Race(T, opts({ numAI: 1, seed: 5 })), P = r.player, R = r.cars.find(c => c !== P); r.start();
  r.state = 'racing'; r.time = 100;
  for (const c of [P, R]) { c.lap = 1; c.cp = T.cpS.length; c.splits = T.cpS.map(() => 90); }
  const ds = 0.4, F = T.finishS, L = T.raceLen;
  // the step that takes the player across: on the road 0.3 m past the line, by its distance 3.2 m short of it; the rival 0.05 m short of the
  // line on the road, 0.95 m past it by its distance
  P.dist = L - 3.2; r._progressOpen(P, { s: F + 0.3 }, ds, DT);
  R.dist = L + 0.95; r._progressOpen(R, { s: F - 0.05 }, ds, DT);
  const pIn = P.finished, rIn = R.finished, pT = P.finishTime;
  // the next step: the rival across too (0.35 m past the line)
  r.time += DT; R.dist += ds; r._progressOpen(R, { s: F + 0.35 }, ds, DT);
  check('the line: the player across it first on the road (behind by its distance run) finishes first, the rival only when it is across',
    pIn && !rIn && R.finished && P.finishPos === 1 && R.finishPos === 2 && P.finishTime < R.finishTime,
    `player ${pT && pT.toFixed(4)} s #${P.finishPos}, rival ${R.finishTime && R.finishTime.toFixed(4)} s #${R.finishPos}`);
  check('the line: the time of the crossing inside the step (from where the car is on the road)',
    Math.abs(P.finishTime - (100 - DT * 0.3 / ds)) < 1e-9 && Math.abs(R.finishTime - (100 + DT - DT * 0.35 / ds)) < 1e-9);
  const res = r.estimateResults();
  check('the results (as the results screen sorts them): the player on top, the rival second', res[0].car === P && res[1].car === R,
    res.slice(0, 2).map(x => `${x.car === P ? 'player' : 'rival'} ${x.time.toFixed(4)} s`).join(', '));
}

// 1b. two cars across the line in one step, the loop's second one the first on the road
{
  Math.random = seeded(5);
  const r = new C.Race(T, opts({ numAI: 2, seed: 5 })), P = r.player, [A, B] = r.cars.filter(c => c !== P); r.start();
  r.state = 'racing'; r.time = 100;
  for (const c of [A, B]) { c.lap = 1; c.cp = T.cpS.length; c.splits = T.cpS.map(() => 90); }
  const ds = 0.4, F = T.finishS, L = T.raceLen;
  // the same step: A 0.1 m past the line (across it late in the step), then B 0.3 m past it (across it earlier)
  A.dist = L + 0.1; r._progressOpen(A, { s: F + 0.1 }, ds, DT);
  B.dist = L + 0.3; r._progressOpen(B, { s: F + 0.3 }, ds, DT);
  check('the line: two cars across it in one step, the one that crossed first ahead (the loop took it second)',
    A.finished && B.finished && B.finishTime < A.finishTime && B.finishPos === 1 && A.finishPos === 2 && r.finishOrder[0] === B && r.finishOrder[1] === A,
    `B ${B.finishTime.toFixed(5)} s #${B.finishPos}, A ${A.finishTime.toFixed(5)} s #${A.finishPos}`);
  check('the line: the two each in a slot of its own past it', A.parkS != null && B.parkS != null && Math.abs(A.parkS - B.parkS) > 1,
    `A ${A.parkS && A.parkS.toFixed(1)} m, B ${B.parkS && B.parkS.toFixed(1)} m`);
}

// 2. whole races: every car's finish time is its crossing of the line on the road, the finish order the order of the crossings
for (const seed of [2, 3]) {
  Math.random = seeded(seed);
  const r = new C.Race(T, opts({ seed })), P = r.player; r.start();
  const geo = new Map(), prev = new Map(); let t = 0, k = 0;
  while (t < 400 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(9000 + seed * 100000 + (++k)); C.aiControl(P, r, DT);
    for (const c of r.cars) prev.set(c, c.q.s);
    r.step(DT); t += DT;
    for (const c of r.cars) { const a = prev.get(c), b = c.q.s; if (!geo.has(c) && a < T.finishS && b >= T.finishS) geo.set(c, r.time - DT * (b - T.finishS) / (b - a)); }
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
  }
  const fin = r.cars.filter(c => c.finished && geo.has(c));
  let worst = 0; for (const c of fin) worst = Math.max(worst, Math.abs(c.finishTime - geo.get(c)));
  const byRoad = fin.slice().sort((a, b) => geo.get(a) - geo.get(b)), wrong = byRoad.filter((c, i) => c.finishPos !== i + 1).length;
  check(`race (seed ${seed}): every car's finish time its crossing of the line on the road, the finish order theirs`,
    fin.length === r.cars.length && worst < 1e-6 && wrong === 0,
    `${fin.length}/${r.cars.length} across, the worst ${worst.toExponential(1)} s off, ${wrong} out of order`);
}

console.log(`\n${n - bad}/${n} OK`);
process.exit(bad ? 1 : 0);
