// Strategy and the team radio (Race opts.radio; Core only, no browser): the gaps in seconds (Race.gap, from every car's race clock at each
// 25 m), what a stop costs (Race.pitLoss: the pit lane against the road at the race's pace, the stop itself) and the plan for one
// (Race.plan: why, the window, "box this lap", the place it puts the car in once everyone has stopped). Off (the default), in a time
// trial, on the open road, in a one-lap race: none, the race as before (the golden references).
//   node tests/radio.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : String(x));

// 1. off by default; none in a time trial, on the open road or in one lap; on: every car's clock
{
  const T = track('rbring');
  const off = new C.Race(T, { numAI: 3, playerGrid: 4, laps: 3, phys: 'cs', seed: 3 });
  const on = new C.Race(T, { numAI: 3, playerGrid: 4, laps: 3, phys: 'cs', seed: 3, radio: true });
  const one = new C.Race(T, { numAI: 3, playerGrid: 4, laps: 1, phys: 'cs', seed: 3, radio: true });
  const tt = new C.Race(track('pikes'), { numAI: 0, playerGrid: 1, laps: 1, phys: 'cs', seed: 3, radio: true });
  const road = new C.Race(track('vrsic'), { numAI: 1, playerGrid: 2, laps: 1, phys: 'cs', seed: 3, radio: true, traffic: true });
  check('off (the default), in a time trial, on the open road, in one lap: no clock; on: every car\'s', !off.mk && !tt.mk && !road.mk && !one.mk && !!on.mk && on.cars.every(c => Array.isArray(on.mk.t.get(c))) && on.gap(on.cars[0], on.cars[1]) === null, '');
}

// 2. the gaps: after a minute of racing every car behind another by about the distance between them at its speed; one ahead: negative
{
  const T = track('rbring');
  Math.random = seeded(5);
  const r = new C.Race(T, { numAI: 8, noPlayer: true, laps: 3, assist: 2, phys: 'cs', seed: 5, difficulty: 1, radio: true });
  r.start();
  for (let t = 0; t < 70; t += DT) r.step(DT);
  const O = r.order, rows = [];
  for (let i = 1; i < O.length; i++) { const A = O[i - 1], B = O[i], g = r.gap(A, B), est = (A.dist - B.dist) / Math.max(5, B.speed); if (A.dist - B.dist < 120) rows.push({ g, est, back: r.gap(B, A) }); }
  check('the gaps: each car behind the one ahead by about the distance between them at its speed (within half a second); seen from it, negative',
    rows.length >= 3 && rows.every(x => x.g > 0 && Math.abs(x.g - x.est) < 0.5 && x.back === -x.g), rows.map(x => f1(x.g) + ' s (' + f1(x.est) + ')').join(', '));
}

// 3. what a stop costs: the estimate against a stop made (one car alone, three laps, a stop on the second lap against none)
{
  const res = [];
  for (const id of ['rbring', 'spa', 'toskana']) {
    const T = track(id), run = (stop) => {
      Math.random = seeded(4);
      const r = new C.Race(T, { numAI: 1, noPlayer: true, laps: 3, assist: 2, phys: 'cs', seed: 4, difficulty: 1, tyres: true, compounds: true });
      r.start(); const X = r.cars[0]; let t = 0, asked = false;
      while (t < 900 && !X.finished) { r.step(DT); t += DT; if (stop && !asked && r.state === 'racing' && X.lap === 2 && X.dist > T.len * 1.3) { X.pitWant = true; asked = true; } }
      return X.finishTime;
    };
    const r2 = new C.Race(T, { numAI: 2, noPlayer: true, laps: 3, assist: 2, phys: 'cs', seed: 4, difficulty: 1, tyres: true, compounds: true, radio: true });
    res.push({ id, real: run(true) - run(false), est: r2.pitLoss(r2.cars[0]) });
  }
  check('what a stop costs: the estimate within 3 s of a stop made', res.every(x => Math.abs(x.est - x.real) < 3), res.map(x => `${x.id} ${f1(x.est)} s (made: ${f1(x.real)} s)`).join(', '));
}

// 4. a race with fuel (6 laps of the Red Bull Ring, a tank for 2.6): the plan from the start (fuel; the window), "box this lap" on the
// lap after which the fuel would not reach the next way in; stopping when told the player (on autopilot) never runs dry and gets to the
// line; the place the plan gives at the way in close to the one after the stop
{
  const T = track('rbring');
  Math.random = seeded(21);
  const r = new C.Race(T, { numAI: 12, playerGrid: 7, laps: 6, playerModel: C.MODELS[0], assist: 2, phys: 'cs', seed: 21, difficulty: 1, fuel: true, tyres: true, compounds: true, radio: true });
  r.start();
  const P = r.player, laps = [], stops = []; let t = 0, lap = 0, told = false, wasIn = false, minFuel = 1, pred = null;
  while (t < 900 && !P.finished) {
    C.aiControl(P, r, DT); r.step(DT); t += DT; P.hitCar = P.hitWall = 0; minFuel = Math.min(minFuel, P.fuel);
    if (P.lap !== lap) { lap = P.lap; const pl = r.plan(P); if (pl) { laps.push({ lap, fuel: P.fuel, need: pl.need.join(), from: pl.from, to: pl.to, box: pl.box }); if (pl.box) told = true; } }
    if (told && !P.pitWant && !P.inPit && !T.pitAt(P.q.s)) P.pitWant = true;   // (the player does as told: in at the next way in)
    if (P.inPit && !wasIn) pred = r.plan(P).pos;
    if (!P.inPit && wasIn) { stops.push({ pred, pos: P.pos }); P.pitWant = false; told = false; }
    wasIn = P.inPit; P.pitEv = null;
  }
  const L1 = laps[0], boxLaps = laps.filter(x => x.box).map(x => x.lap);
  check('a fuel race: the plan from the start (fuel needed, the window for the first stop)', L1.need === 'fuel' && L1.from >= 1 && L1.to >= L1.from && L1.to <= 3 && !L1.box, JSON.stringify(L1));
  check('... "box this lap" twice (a tank for 2.6 laps of 6); doing as told the player never runs dry and gets to the line',
    boxLaps.length === 2 && stops.length === 2 && minFuel > 0.02 && P.finished, `box on laps ${boxLaps.join(', ')}, ${stops.length} stops, the least fuel ${minFuel.toFixed(3)}, finished ${P.finished}`);
  check('... the place a stop gives (at the way in) close to the one after it (within 3)', stops.every(x => x.pred != null && Math.abs(x.pred - x.pos) <= 3), stops.map(x => `${x.pred} → ${x.pos}`).join(', '));
}

// 5. the plan for the tyres and the car: slicks on a soaked track, rain tyres on a dry line, a cut tyre, heavy damage: box this lap;
// worn slicks that will not last: the window; nothing wrong: no stop (only what one would cost and the place it gives)
{
  const T = track('spa');
  Math.random = seeded(8);
  const r = new C.Race(T, { numAI: 5, playerGrid: 3, laps: 8, playerModel: C.MODELS[0], assist: 2, phys: 'cs', seed: 8, difficulty: 1, tyres: true, compounds: true, radio: true, faults: true });
  r.start();
  for (let t = 0; t < 25; t += DT) { C.aiControl(r.player, r, DT); r.step(DT); }
  const P = r.player, W = r.wst, plan = () => { const p = r.plan(P); return { need: p.need.join(), box: p.box, from: p.from, to: p.to, pos: p.pos }; };
  const ok0 = plan();
  W.line = 0.8; const wet = plan(); W.line = 0;
  P.ty.k = 'wet'; const dry = plan(); P.ty.k = 'dry';
  P.flt.pw = 2; const cut = plan(); P.flt.pw = -1;
  P.dmg = 0.6; const dmg = plan(); P.dmg = 0;
  P.ty.c = 'S'; P.ty.wear = 0.3; const worn = plan(); P.ty.wear = 0;
  check('nothing wrong: no stop, only its cost and the place it gives', ok0.need === '' && !ok0.box && ok0.from == null && ok0.pos >= 1 && ok0.pos <= 6, JSON.stringify(ok0));
  check('slicks on a soaked track, rain tyres on a dry line, a cut tyre, heavy damage: box this lap',
    wet.need === 'wet' && wet.box && dry.need === 'dry' && dry.box && cut.need === 'tyre' && cut.box && dmg.need === 'damage' && dmg.box, JSON.stringify({ wet, dry, cut, dmg }));
  check('worn soft slicks that will not last the 8 laps: the window for fresh ones', worn.need === 'tyres' && worn.from >= 1 && worn.to >= worn.from && worn.to < 8, JSON.stringify(worn));
}

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
