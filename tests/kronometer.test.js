// Kronometer na vseh progah (#1048): the ways a track is driven (Core.ways). Every real track has its time trial: a circuit too (its race first,
// then its time trial alone against the clock), a mountain road as before; the frozen tracks (test, pending: Jezero, Toskana) only as they were,
// their race. For every track with a time trial: the player alone on the start line (race.timeTrial, one car); Jezero and Toskana their race
// with the rivals as ever, also when a time trial is asked for. A circuit's time trial on autopilot (Biķernieki, 2 laps): the player
// alone finishes it, each lap counted. The quick entry (?nacin=tt) and the friends' leaderboard (Lestvica.keyTable, -tt) know the same ways.
//   node tests/kronometer.test.js
'use strict';
const path = require('path');
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');
const L = require(path.join(__dirname, '..', 'js', 'lestvica.js'));

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const frozen = (d) => !!(d.test || d.pending);
const real = C.TRACKS.filter(d => !frozen(d) && !d.variantOf), circuits = real.filter(d => !d.open && !d.modes && !d.timeTrial);

// 1. the ways: every real track (a variant as its own) has its time trial; a circuit its race first, then its time trial; the frozen ones as before
{
  const noTT = C.TRACKS.filter(d => !frozen(d) && C.ways(d).indexOf('tt') < 0 && !(d.modes && d.modes.indexOf('tt') < 0)).map(d => d.id);
  check(`every real track has its time trial (${C.TRACKS.filter(d => !frozen(d)).length} tracks, a road with its own ways as it set them)`, !noTT.length, noTT.join(', '));
  const bad1 = circuits.filter(d => C.ways(d).join() !== 'race,tt').map(d => d.id + ':' + C.ways(d).join('/'));
  check(`every real circuit: its race first, then its time trial (${circuits.length})`, circuits.length >= 20 && !bad1.length, bad1.join(', '));
  const was = (d) => (d.modes || [d.timeTrial ? 'tt' : 'race']).join();
  const fz = C.TRACKS.filter(frozen), bad2 = fz.filter(d => C.ways(d).join() !== was(d)).map(d => d.id);
  check(`the frozen tracks (test, pending: ${fz.length}) as they were`, !bad2.length, bad2.join(', '));
  check('Jezero and Toskana: their race alone', C.ways(C.TRACKS.find(d => d.id === 'jezero')).join() === 'race' && C.ways(C.TRACKS.find(d => d.id === 'toskana')).join() === 'race');
  check('no track: its race', C.ways(null).join() === 'race');
}

// 2. every track with a time trial: asked for (opts.tt), the player alone on the line; Jezero and Toskana their race with the field
{
  const orig = Math.random; Math.random = seeded(5);
  const wrong = [];
  for (const d of C.TRACKS.filter(d => C.ways(d).indexOf('tt') >= 0)) {
    const r = new C.Race(new C.Track(d), opts({ tt: true }));
    if (!r.timeTrial || r.cars.length !== 1 || !r.player) wrong.push(d.id + ':' + r.cars.length);
  }
  check(`every track's time trial: the player alone (${C.TRACKS.filter(d => C.ways(d).indexOf('tt') >= 0).length} tracks)`, !wrong.length, wrong.join(', '));
  for (const id of ['jezero', 'toskana']) {
    const T = new C.Track(C.TRACKS.find(d => d.id === id)), a = new C.Race(T, opts({ tt: true })), b = new C.Race(T, opts({}));
    check(`${id}: its race with the field, a time trial asked for or not`, !a.timeTrial && !b.timeTrial && a.cars.length === 13 && b.cars.length === 13, `${a.cars.length}/${b.cars.length} cars`);
  }
  Math.random = orig;
}

// 3. a circuit's time trial on autopilot: Biķernieki, 2 laps, the player alone finishes it with each lap counted
{
  const d = C.TRACKS.find(x => x.id === 'bikernieki'), orig = Math.random; Math.random = seeded(9);
  const r = new C.Race(new C.Track(d), opts({ tt: true, laps: 2 })), P = r.player; r.start();
  let t = 0, k = 0, nan = false;
  while (t < 600 && !P.finished) { Math.random = seeded(9000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); if (!isFinite(P.dist)) { nan = true; break; } }
  Math.random = orig;
  check('Biķernieki, time trial of 2 laps on autopilot: the player alone finishes, both laps, a time', r.timeTrial && r.cars.length === 1 && P.finished && !nan && P.lap >= 2 && P.finishTime > 0,
    `finished ${P.finished}, lap ${P.lap}, ${(P.finishTime || 0).toFixed(1)} s`);
}

// 4. the quick entry and the friends' leaderboard know the same ways
{
  const Q = C.quickArgs, noQ = real.filter(d => C.ways(d).indexOf('tt') >= 0 && Q('?proga=' + d.id + '&nacin=tt').mode !== 'tt').map(d => d.id);
  check('?nacin=tt on every real track with a time trial', !noQ.length, noQ.join(', '));
  check('?nacin=tt on Jezero and Toskana: not valid', Q('?proga=jezero&nacin=tt').mode === null && Q('?proga=toskana&nacin=tt').mode === null);
  const T = L.keyTable(C.TRACKS), noK = circuits.filter(d => !T.has((d.recId || d.id) + '-tt@cs') && !T.has((d.recId || d.id) + '-tt@nova')).map(d => d.id);
  check('the leaderboard: every circuit\'s time trial its own key (id-tt)', !noK.length, noK.join(', '));
  check('the leaderboard: Jezero no time trial', ![...T.keys()].some(k => /^jezero-tt/.test(k)));
}

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
