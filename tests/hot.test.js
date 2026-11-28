// Hot lap (js/zabava/hot.js, docs/igra.md »Hot lap«), no browser: the mode on the circuits only (not an open road, a time trial, the test
// tracks or those awaiting the user's choice: frozen, CLAUDE.md), its race (alone, a flying start from Track.qualiBack, K.laps laps, nothing
// but the lap), its gap to the record, no podium; Jezero and Toskana's own races untouched.
//   node tests/hot.test.js
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
global.window = {};
const Z = require(path.join(ROOT, 'js', 'zabava.js'));
global.Zabava = Z;
const hot = require(path.join(ROOT, 'js', 'zabava', 'hot.js'));
const { loadCore } = require('./lib/core.js');
const C = loadCore();

let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = (id) => C.TRACKS.find(d => d.id === id);
const ctxOf = (d, o) => Object.assign({ md: 'hot', on: false, tt: false, quali: false, chal: null, cr: -1, school: null, nv: null, mis: null, career: null, prvi: false, track: new C.Track(d), nAI: 7, pm: null }, o || {});

// 1. where: a circuit with a race; not an open road, a time trial, a test track or one awaiting the user
{
  const circ = C.TRACKS.filter(d => !d.open && !d.timeTrial && !d.test && !d.pending);
  check('real circuits have the mode', circ.length > 0 && circ.every(d => hot.modes(d, ['race']).join() === 'hot'), circ.length + ' circuits');
  check('not without a race (a time trial only)', hot.modes({}, ['tt']).length === 0);
  check('not on an open road or a time trial', hot.modes({ open: true }, ['race']).length === 0 && hot.modes({ timeTrial: true }, ['race', 'tt']).length === 0);
  check('not on the test tracks (Jezero, Toskana) nor those awaiting the user (frozen)', hot.modes(def('jezero'), ['race']).length === 0 && hot.modes(def('toskana'), ['race']).length === 0 && hot.modes({ pending: true }, ['race']).length === 0);
  check('the registry hands it out with the others', Z.modes(circ[0], ['race']).indexOf('hot') >= 0);
}

// 2. its race: alone, a flying start, K.laps laps, nothing but the lap; only when chosen, never in a championship, online, a mission ...
{
  const d = C.TRACKS.find(t => !t.open && !t.timeTrial && !t.test && !t.pending), ctx = ctxOf(d), o = hot.opts(ctx);
  check('alone on the track (no rivals, no traffic, no police)', o && o.numAI === 0 && o.traffic === false && o.police === false);
  check('a flying start from the straight before the line (Track.qualiBack), no flying-start rolling grid', o.qualiBack === ctx.track.qualiBack() && o.qualiBack >= 120 && o.flying === 0, o.qualiBack + ' m');
  check(hot.K.laps + ' timed laps', o.laps === hot.K.laps && hot.K.laps >= 1);
  check('only the lap: no fuel, strategy, flags, rivals\' characters, slipstream, faults, radio', ['fuel', 'strat', 'flags', 'chars', 'slip', 'faults', 'radio'].every(k => o[k] === false));
  for (const [what, x] of [['the race', { md: 'race' }], ['online', { on: true }], ['a championship round', { cr: 0 }], ['a mission', { mis: {} }], ['the driving school', { school: {} }], ['a challenge', { chal: {} }], ['qualifying', { quali: true }], ['a time trial', { tt: true }]])
    check('not in ' + what, hot.opts(ctxOf(d, x)) === null);
  const race = {}; hot.made(race, ctx); const r2 = {}; hot.made(r2, ctxOf(d, { md: 'race' }));
  check('made: the race is marked as Hot lap (its own record key, js/game.js recKey)', race.zbMode === 'hot' && r2.zbMode === undefined);
  check('no podium after it', hot.noPodium(race) === true && hot.noPodium(r2) === false && hot.noPodium(null) === false);
}

// 3. the gap to the best lap before it
check('gap: quicker, slower, nothing to compare', hot.gapTxt(81.2, 81.512) === '-0.312' && hot.gapTxt(82.552, 81.512) === '+1.040' && hot.gapTxt(80, 0) === '' && hot.gapTxt(0, 80) === '');

// 4. after each lap: the best one kept (the record, then this run's best), the record before the run kept for the results
{
  const race = { zbMode: 'hot', track: { def: { id: 'x' } }, player: { lapTimes: [] } };
  const msgs = [], texts = {};
  Z.init({ rec: () => ({ bestLap: 82 }), fmt: (t) => t.toFixed(3), setText: (id, t) => { texts[id] = t; }, showMsg: (t, cls) => msgs.push([t, cls]) });
  hot.begin(race);
  check('begin: the record shown before the first lap', hot.st && hot.st.rec0 === 82 && /82\.000/.test(texts['h-gap']), texts['h-gap']);
  race.player.lapTimes.push(83); hot.step(race);
  check('a lap slower than the record: its gap, not the best', msgs.length === 1 && msgs[0][1] === 'slow' && /\+1\.000/.test(msgs[0][0]) && hot.st.best === 82, msgs[0] && msgs[0][0]);
  race.player.lapTimes.push(81.5); hot.step(race);
  check('a lap quicker than the record: the best lap, gold', msgs.length === 2 && msgs[1][1] === 'gold' && /-0\.500/.test(msgs[1][0]) && hot.st.best === 81.5 && hot.st.rec0 === 82, msgs[1] && msgs[1][0]);
  hot.step(race);
  check('no new lap, no new message', msgs.length === 2);
  hot.stop(); Z.init(null);
  check('stop clears it', hot.st === null);
}

// 5. Jezero and Toskana: their own races untouched (no Hot lap options there, whatever the mode)
for (const id of ['jezero', 'toskana']) {
  const d = def(id), T = new C.Track(d);
  check(id + ': loads and is a circuit', T.N > 100 && !T.open, 'N ' + T.N);
  check(id + ': a race there gets no Hot lap options', hot.opts(ctxOf(d, { md: 'race' })) === null);
}

console.log(`\n${n - bad}/${n} OK`);
process.exit(bad ? 1 : 0);
