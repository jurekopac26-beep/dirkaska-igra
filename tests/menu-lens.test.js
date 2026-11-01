// The menu's table of the tracks' lengths (js/menu-data.js MENU.lens, made by tools/menu-lens.js): the track step's list goes from the
// shortest real track to the longest, then the test tracks, without building every track. Every track of the game is in it with its
// length as the game measures it (an open road: the race from the start to the finish; a circuit: the lap), to the metre; no track that
// is not in the game. After a new track or a changed road: node tools/menu-lens.js
//   node tests/menu-lens.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
global.window = {};
require(path.join(ROOT, 'js', 'menu-data.js'));
const L = window.MENU.lens || {}, ids = C.TRACKS.filter(d => !d.variantOf).map(d => d.id);
const off = [];
for (const d of C.TRACKS) {
  if (d.variantOf) continue;
  const T = new C.Track(d), m = Math.round(d.open ? T.raceLen : T.len);
  if (L[d.id] !== m) off.push(d.id + ': ' + L[d.id] + ' (the game: ' + m + ')');
}
check(`every track of the game (${ids.length}) has its length in the menu's table, to the metre (node tools/menu-lens.js)`, !off.length, off.join(', '));
const extra = Object.keys(L).filter(id => !ids.includes(id));
check('no track in the table that is not in the game', !extra.length, extra.join(', '));
console.log(`\n${n - bad}/${n} passed`);
process.exit(bad ? 1 : 0);
