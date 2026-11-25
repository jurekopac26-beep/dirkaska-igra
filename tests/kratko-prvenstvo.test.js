// Kratko prvenstvo (Matej, #382, 25. 11.): the short championship, a series of Core.CHAMPS. Five real circuits in a row (no test,
// no pending track, no open road, no time trial; all different, from five continents), the F1 points by the finishing place, the
// standings after every round (a tie by more wins) and a champion after the fifth round, by Core's rules (champTable); the game shows it
// in Prvenstvo, not behind NEUPORABNO (game.js: a series made of hidden tracks only). docs/igra.md »Prvenstvo«.
//   node tests/kratko-prvenstvo.test.js
'use strict';
const { loadCore } = require('./lib/core.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };

const S = C.CHAMPS.find(c => c.id === 'kratko'), T = (id) => C.TRACKS.find(d => d.id === id);
check('the series: Kratko prvenstvo / Short Championship, with a description in both languages', !!S && S.name === 'Kratko prvenstvo' && S.en && S.en.name === 'Short Championship' && !!S.desc && !!S.en.desc,
  S && JSON.stringify({ name: S.name, en: S.en }));
const tr = (S && S.tracks) || [], defs = tr.map(T);
check('five tracks, all different, all of them real circuits (not test, not pending, no open road, no time trial)', tr.length === 5 && new Set(tr).size === 5 &&
  defs.every(d => d && !d.test && !d.pending && !d.open && !d.timeTrial), tr.map((id, i) => id + (defs[i] ? (defs[i].test ? ':test' : '') + (defs[i].pending ? ':pending' : '') : ':missing')).join(', '));
const land = defs.map(d => d && d.name.split(', ').pop());
check('five countries (Irska, Uzbekistan, Avstralija, Argentina, Mehika: five continents)', land.join('/') === 'Irska/Uzbekistan/Avstralija/Argentina/Mehika', land.join('/'));
check('the description names the five places (Slovenian and English)', defs.every(d => d && S.desc.includes(d.name.split(', ')[0])) && defs.every(d => d && d.en && S.en.desc.includes(d.en.name.split(', ')[0])), S && S.desc);

// a whole championship by Core's rules: the player 1st, 2nd, 1st, 3rd, 1st; one rival always 2nd but 1st where the player is 2nd
const K = C.champKeys(19), R = K[1], ord = (p, q) => { const o = K.filter(k => k !== C.PLAYER_KEY && k !== R); o.splice(Math.min(p, q) - 1, 0, p < q ? C.PLAYER_KEY : R); o.splice(Math.max(p, q) - 1, 0, p < q ? R : C.PLAYER_KEY); return o; };
const places = [[1, 2], [2, 1], [1, 2], [3, 2], [1, 2]], rounds = [];
const after = places.map(([p, q], i) => { rounds.push({ track: tr[i], order: ord(p, q) }); const tab = C.champTable(K, rounds); return tab.map(r => r.key + ':' + r.pts).slice(0, 2).join(' '); });
const pts = (k) => C.champTable(K, rounds).find(r => r.key === k);
check('standings after every round (the player, the rival): 25/18, 43/43 (a tie: one win each, then 2nd places equal: the first by key order), 68/61, 83/79, 108/97',
  after[0] === 'TI:25 ' + R + ':18' && after[2] === 'TI:68 ' + R + ':61' && after[3] === 'TI:83 ' + R + ':79' && after[4] === 'TI:108 ' + R + ':97' && /:43 .*:43$/.test(after[1]), after.join(' | '));
const fin = C.champTable(K, rounds);
check('after round 5: the champion first (108 points, 3 wins), every driver of the 20 in the table, each round\'s points 25 18 15 12 10 8 6 4 2 1', fin.length === 20 && fin[0].key === C.PLAYER_KEY && fin[0].pts === 108 && pts(C.PLAYER_KEY).wins === 3 &&
  fin.reduce((s, r) => s + r.pts, 0) === 5 * 101, `${fin[0].key} ${fin[0].pts}, total ${fin.reduce((s, r) => s + r.pts, 0)}`);

console.log(`\n${n - bad}/${n} OK`);
process.exit(bad ? 1 : 0);
