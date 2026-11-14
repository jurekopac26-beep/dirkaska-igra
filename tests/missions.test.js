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
// (Santa Monica Mountains became a test track on 4. 11. 2026, Vršič and Australia's Longford, Newcastle and Townsville on 6. 11. 2026, Great Alpine Road on 9. 11. 2026 and the roads of the USA but Pikes Peak on 5. 11. 2026, the user's decisions
// (one track a country, CLAUDE.md »Testne proge«); Toronto and Trois-Rivières (every track of Canada but Montréal), Sani Pass and Bang Saen became test tracks
// on 5. 11. 2026, Sani Pass again on 7. 11. 2026, also the user's decisions; the missions on them stay there until the user moves them, later, when it is known
// which tracks stay (docs/misije.md): these exceptions only, no other mission may run on a test track)
const ON_TEST_TRACK = { '01': 'vrsic', '49': 'suzuka', '02': 'newcastle', '06': 'mulholland', '07': 'sani', '17': 'troisrivieres', '19': 'townsville', '34': 'toronto', '35': 'newcastle', '37': 'bangsaen', '47': 'greatalpine', '48': 'longford', '30': 'baldy', '39': 'monterey', '46': 'uncompahgre', '52': 'bigsur', '55': 'beartooth', '11': 'maunakea', '08': 'ouninpohja' };   // (the missions that sit on a test track until the user decides: 11 Mauna Kea went to the test tracks with the US ones, 5. 11. 2026; 02, 19, 35 and 48 with the Australian ones, 6. 11. 2026; 07, 17, 34 and 37 with Sani Pass, Trois-Rivières, Toronto and Bang Saen, 5. 11. 2026, Sani Pass again 7. 11. 2026; 08 with Ouninpohja, 8. 11. 2026: Finland gets a new track in the snow; 47 with Great Alpine Road, 9. 11. 2026: Bathurst stays the one track of Australia)
for (const d of M.DEFS) {
  const T = Core.TRACKS.find(t => t.id === d.track);
  check(`mission ${d.id}: on a real track (${d.track})`, !!T && (d.test || !T.test || ON_TEST_TRACK[d.id] === d.track));
  const miss = [d.title, d.story, d.goal, d.hint].concat(d.rows.map(r => r.label)).filter(s => s && !has(s));
  check(`mission ${d.id}: its texts in English`, !miss.length, miss.join(' | '));
  check(`mission ${d.id}: the track's name ("Kraj, Država")`, /, /.test(M.placeOf(d)), M.placeOf(d));
}

// the six garages by trade (docs/misije.md, Odločitve 1): 33 missions, each in one garage, in the user's order (easiest first)
const GAR = { gasilci: '01,49,46,47', resevalci: '06,02,35,19,48,37', tovor: '50,39,07,43,51,52,54,09', zima: '29,33,17,53,30', cesta: '26,34,04,45,40', divjina: '10,55,08,23,11' };
check('garages: the six by trade, in the user\'s order', M.GARAGES.map(g => g.id + ':' + g.ids.join()).join(' ') === Object.keys(GAR).map(k => k + ':' + GAR[k]).join(' '), M.GARAGES.map(g => g.id).join());
const allG = M.GARAGES.flatMap(g => g.ids);
check('garages: 33 missions, none twice', allG.length === 33 && new Set(allG).size === 33, String(allG.length));
const noG = M.DEFS.filter(d => !d.test && !M.garageOf(d.id)).map(d => d.id);
check('garages: every mission in the game is in a garage', !noG.length, noG.join());
const gEn = M.GARAGES.map(g => g.name).concat(['Druge misije']).filter(s => !has(s));
check('garages: their names in English', !gEn.length, gEn.join());

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
// a mission has no tyres of its own to wear (the user's choice 3. 11. 2026): its options turn the game's tyreRule and wheelRule off
M.init({ start() { } }); M.start('vaja'); const mo = M.opts(); M.stop();
check('a mission: its options turn the four tyres (tyreRule) and the wheel rule off, over the game\'s own', !!mo && 'tyreRule' in mo && mo.tyreRule === undefined && 'wheelRule' in mo && mo.wheelRule === undefined && mo.tt === true && M.opts() === null, JSON.stringify(mo));

// the mission's own vehicle is stock (the user's decision 7. 11. 2026, tabla #382): its options take the garage's parts off it, over the game's own
// (newRace: Object.assign(mine, ..., MS.opts())); a mission in the player's own car keeps them
const GAR_DELI = { aero: 3, krilo: 2 }, withDeli = (o) => Object.assign({ playerDeli: GAR_DELI }, o).playerDeli;
const ownV = M.DEFS.filter(d => { M.start(d.id); const o = M.opts(); M.stop(); return o && o.playerModel; });
check('mission vehicles: some missions give their own (car or playerModel)', ownV.length >= 10, String(ownV.length));
const kept = ownV.filter(d => { M.start(d.id); const o = M.opts(); M.stop(); return withDeli(o) !== undefined; });
check('mission vehicles: each mission\'s own vehicle without the garage\'s parts', !kept.length, kept.map(d => d.id).join());
const mine2 = M.DEFS.filter(d => { M.start(d.id); const o = M.opts(); M.stop(); return o && !o.playerModel; });
check('mission vehicles: a mission in the player\'s own car keeps its parts', mine2.every(d => { M.start(d.id); const o = M.opts(); M.stop(); return withDeli(o) === GAR_DELI; }), mine2.map(d => d.id).join());

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
