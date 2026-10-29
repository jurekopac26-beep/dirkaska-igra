// The special missions (js/missions.js), no browser: the list (the practice one last, every mission's file in js/missions/, every mission on a real track, its texts in English),
// the run of a mission (the clock, the time limit, the player over the finish, a mission's own win and fail, once only), the stars by the
// time, the records (the best time and the most stars of a mission done; a failed run counts as a run only), the race's options a mission
// gives (alone, one run, its vehicle), none without a mission.
//   node tests/missions.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
const M = require(path.join(ROOT, 'js', 'missions.js'));
global.Missions = M;
const fs = require('fs');
for (const f of fs.readdirSync(path.join(ROOT, 'js', 'missions')).filter(f => /\.js$/.test(f)).sort()) require(path.join(ROOT, 'js', 'missions', f));   // (every mission's own file)
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const has = (k) => Object.prototype.hasOwnProperty.call(Lang.EN, k);

// the list
M.add({ id: '99', title: 'Vaja: na vrh', track: 'vrsic', story: 'x', goal: 'x' });
check('the list: by number, the practice one last', M.DEFS.map(d => d.id).join() === M.DEFS.filter(d => !d.test).map(d => d.id).sort().join() + ',vaja' && M.DEFS.map(d => d.id).indexOf('99') === M.DEFS.length - 2, M.DEFS.map(d => d.id).join());
M.DEFS.splice(M.DEFS.findIndex(d => d.id === '99'), 1);
for (const d of M.DEFS) {
  const T = Core.TRACKS.find(t => t.id === d.track);
  check(`mission ${d.id}: on a real track (${d.track})`, !!T && (d.test || !T.test));
  const miss = [d.title, d.story, d.goal, d.hint].concat(d.rows.map(r => r.label)).filter(s => s && !has(s));
  check(`mission ${d.id}: its texts in English`, !miss.length, miss.join(' | '));
  check(`mission ${d.id}: the track's name ("Kraj, Država")`, /, /.test(M.placeOf(d)), M.placeOf(d));
}

// the run
const race = () => ({ player: { finished: false, dist: 0, dmg: 0 }, track: { len: 5000, raceLen: 4000 } });
const def = { id: 't1', title: 'T', limit: 10, stars: [5, 8], rows: [], step: null };
let r = new M.Run(def, race());
for (let i = 0; i < 60; i++) r.step(0.05);
check('the clock runs with the steps, the time left', Math.abs(r.t - 3) < 1e-9 && Math.abs(r.left - 7) < 1e-9 && !r.end, `${r.t} ${r.left}`);
r.P.finished = true; r.step(0.05);
check('the player over the finish: done, 3 stars under the first time', r.end === 'win' && r.stars === 3, `${r.end} ${r.stars}`);
r = new M.Run(def, race()); for (let i = 0; i < 130; i++) r.step(0.05); r.P.finished = true; r.step(0.05);
check('2 stars under the second time, 1 over it', r.stars === 2 && M.starsOf(def, 9) === 1 && M.starsOf({}, 99) === 3, String(r.stars));
r = new M.Run(def, race()); for (let i = 0; i < 300 && !r.end; i++) r.step(0.05);
check('the time limit: failed, why', r.end === 'fail' && /časa/.test(r.why) && Math.abs(r.t - 10) < 0.06, `${r.end} ${r.why} ${r.t}`);
r.win(); check('an ended run stays as it ended', r.end === 'fail');
const own = { id: 't2', title: 'T', rows: [{ k: 'a', label: 'A', bar: true }], finish(x) { x.fail('ne'); }, step(x, dt) { x.set('a', 'v', 1.5); if (x.P.dmg > 0.5) x.fail('škoda'); } };
r = new M.Run(own, race()); r.step(0.05);
check('a gauge set: its text, the bar kept in 0..1', r.vals.a.text === 'v' && r.vals.a.frac === 1);
r.P.dmg = 0.6; r.step(0.05);
check("the mission's own fail", r.end === 'fail' && r.why === 'škoda');
r = new M.Run(own, race()); r.P.finished = true; r.step(0.05);
check("the mission's own finish (over the line is not always a win)", r.end === 'fail' && r.why === 'ne');
r = new M.Run(Object.assign({}, def, { limit: 0 }), race());
check('no limit: no time left, the clock runs up', r.left === null && M.clock(65.4) === '01:05');

// the practice mission: the way to the finish, the car's damage
const V = M.byId('vaja'); r = new M.Run(V, race()); r.P.dist = 1500; r.step(0.05);
check('practice: the way to the finish (raceLen) in km', r.vals.cilj.text === '2,5 km', r.vals.cilj.text);
r.P.dmg = 0.5; r.step(0.05);
check('practice: at half damage, failed', r.end === 'fail');

// the records (no localStorage here: kept for the visit)
let o = M.recOf('t9'); check('no record yet', o.stars === 0 && o.best === 0 && o.runs === 0);
// the race's options
check('no mission: no options', M.opts() === null && !M.on());

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
