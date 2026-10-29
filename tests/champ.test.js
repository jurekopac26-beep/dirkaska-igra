// The championship rules (Core only, no browser): the points per place, the standings and their tie-break, the drivers of a
// championship (the game's: the same 19 AI drivers in every round, 20 cars, also where a track has a bigger field of its own: the Nordschleife's
// Circuit race 100 cars; an older championship's 12 are the first of them), the series (every track exists, circuits only), and a whole short
// championship driven by the AI (the player on autopilot): every round's order holds every driver once, the points add up, and the same AI
// driver is in the same car every round.
//   node tests/champ.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };

// 1. points: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1 for the first ten, nothing further back
const pts = Array.from({ length: 13 }, (_, i) => C.champPoints(i + 1));
check('points per place: 25 18 15 12 10 8 6 4 2 1, then 0', pts.join(' ') === '25 18 15 12 10 8 6 4 2 1 0 0 0', pts.join(' '));

// 2. the drivers: the player, then the 19 AI drivers in grid order (game.js CH_AI), all different; the same as a race's AI (name, car, colour);
// an older championship's 12 (kept before there were 19) the first 12 of them
const CH_AI = 19, keys = C.champKeys(CH_AI);
Math.random = seeded(5);
const race = new C.Race(new C.Track(C.TRACKS.find(d => d.id === 'jezero')), { numAI: CH_AI, playerGrid: 12, laps: 1, playerModel: C.MODELS[0], seed: 3, champ: true });
const ai = race.cars.filter(c => !c.isPlayer);
check('drivers: the player and 19 AI drivers, all different; an older championship\'s 12 the first of them', keys.length === 20 && new Set(keys).size === 20 && keys[0] === C.PLAYER_KEY && C.champKeys(12).every((k, i) => keys[i] === k), keys.join(', '));
check("drivers: the race's AI drivers are the championship's (same names, cars and colours)", ai.every((c, k) => c.name === keys[k + 1] && c.m === C.aiDriver(k).model && c.color === C.aiDriver(k).color),
  ai.map(c => c.name + ' (' + c.m.id + ')').join(', '));
// a track with a bigger field of its own (the Nordschleife: the game's Circuit race 99 rivals, def.raceRivals; Core's def.rivals 20 at least)
// keeps the championship's drivers in a championship round (opts.champ: its 19)
{
  const D = C.TRACKS.find(d => d.id === 'nring'), NR = new C.Track(D), o = { playerGrid: 99, laps: 1, playerModel: C.MODELS[0], seed: 3 };
  const free = new C.Race(NR, Object.assign({ numAI: D.raceRivals }, o)), round = new C.Race(NR, Object.assign({ numAI: CH_AI, champ: true }, o)), few = new C.Race(NR, Object.assign({ numAI: 12 }, o));
  check('drivers: a championship round on the Nordschleife has its 19 AI drivers (the Circuit race there: 99, 100 cars; numAI 12 still its own 20 at least)', free.cars.length === 100 && round.cars.length === 20 && few.cars.length === 21 &&
    round.cars.filter(c => !c.isPlayer).every((c, k) => c.name === keys[k + 1]), `Circuit race ${free.cars.length}, championship ${round.cars.length}, numAI 12 ${few.cars.length} cars`);
}

// 3. the standings: by points; a tie by more wins, then more second places ...
{
  const [A, B, D] = keys, rest = keys.slice(3);
  const t = C.champTable(keys, [{ order: [A, B, D].concat(rest) }, { order: [B, D, A].concat(rest) }, { order: [D, A, B].concat(rest) }]);   // A, B, D: 25 + 18 + 15 = 58 each
  check('standings: a tie on points goes to the driver listed first when wins and places are equal too', t[0].pts === 58 && t[1].pts === 58 && t[2].pts === 58 && t[0].key === A, t.slice(0, 3).map(e => e.key + ' ' + e.pts).join(', '));
  // D wins twice and is 8th once (25 + 25 + 4), A is second three times (18 x 3): 54 each, D ahead with its wins; B 15 + 15 + 25 = 55 leads
  const t2 = C.champTable(keys, [{ order: [D, A, B].concat(rest) }, { order: [D, A, B].concat(rest) }, { order: [B, A].concat(rest.slice(0, 5), [D], rest.slice(5)) }]);
  check('standings: equal points, the one with more wins ahead (D 2 wins before A 0 wins, though A comes first in the list)', t2[0].key === B && t2[0].pts === 55 && t2[1].key === D && t2[2].key === A && t2[1].pts === 54 && t2[2].pts === 54,
    t2.slice(0, 3).map(e => `${e.key} ${e.pts} (${e.places.slice(0, 3).join('/')})`).join(', '));
  const t3 = C.champTable(keys, [{ order: keys.slice() }]);
  check('standings: after one round the order of that race, with its points and the last place', t3.every((e, i) => e.key === keys[i] && e.pts === C.champPoints(i + 1) && e.last === i + 1), t3.slice(0, 4).map(e => e.key + ' ' + e.pts).join(', '));
}

// 4. the series: every track exists and is a circuit (no time trial, no open road: Vršič's race goes up it once), at least three rounds, the ids are all different
{
  const circuit = (d) => !d.timeTrial && !d.open;
  const ids = C.TRACKS.map(d => d.id), bads = C.CHAMPS.filter(s => s.tracks.length < 3 || s.tracks.some(t => !ids.includes(t) || !circuit(C.TRACKS.find(d => d.id === t))));
  check('series: every round a circuit of the game, at least three rounds each', C.CHAMPS.length >= 3 && !bads.length && new Set(C.CHAMPS.map(s => s.id)).size === C.CHAMPS.length,
    C.CHAMPS.map(s => `${s.id}: ${s.tracks.join(' ')}`).join(' | '));
  const all = C.CHAMPS.find(s => s.id === 'veliko');
  check('series: the big championship has every circuit', !!all && all.tracks.length === C.TRACKS.filter(circuit).length, all && all.tracks.join(' '));
}

// 5. a whole championship ("Domači pokal", three races of the game's length, its 19 AI, the player on autopilot from 12th on the grid)
{
  const S = C.CHAMPS.find(s => s.id === 'domaci'), rounds = [], t0 = Date.now();
  let cars = true, nan = false;
  S.tracks.forEach((tid, ri) => {
    Math.random = seeded(100 + ri);
    const T = new C.Track(C.TRACKS.find(d => d.id === tid)), r = new C.Race(T, { numAI: CH_AI, playerGrid: 12, laps: T.def.laps || 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 40 + ri, difficulty: 1, champ: true });
    r.start();
    for (let t = 0, k = 0; t < T.len * r.laps / 12 + 120 && r.cars.some(c => !c.finished); t += DT) {
      Math.random = seeded(9000 + (++k)); C.aiControl(r.player, r, DT); r.step(DT);
      if (r.player.stuckT > 3 || r.player.wrongT > 3) r.rescue(r.player);
    }
    for (const c of r.cars) if (!Number.isFinite(c.x)) nan = true;
    r.cars.filter(c => !c.isPlayer).forEach((c, k) => { if (c.name !== keys[k + 1] || c.m !== C.aiDriver(k).model) cars = false; });
    rounds.push({ track: tid, order: r.estimateResults().map(e => e.car.isPlayer ? C.PLAYER_KEY : e.car.name) });
  });
  const t = C.champTable(keys, rounds), sum = t.reduce((a, e) => a + e.pts, 0);
  check('a whole championship: every round has every driver once', rounds.every(r => r.order.length === 20 && new Set(r.order).size === 20 && r.order.every(k => keys.includes(k))), rounds.map(r => r.track).join(', '));
  check('a whole championship: the points add up (3 x 101), the leader has the most', sum === 3 * 101 && t.every((e, i) => i === 0 || e.pts <= t[i - 1].pts), `total ${sum}, leader ${t[0].key} ${t[0].pts}`);
  check('a whole championship: each AI driver in the same car every round, no NaN', cars && !nan, `${((Date.now() - t0) / 1000).toFixed(0)} s`);
  console.log('   standings: ' + t.map((e, i) => `${i + 1}. ${e.key} ${e.pts}`).join(', '));
  const me = t.find(e => e.key === C.PLAYER_KEY);
  console.log('   the player (autopilot, from 12th): ' + rounds.map(r => r.order.indexOf(C.PLAYER_KEY) + 1).join(', ') + ` -> ${me.pts} points, ${t.indexOf(me) + 1}.`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
