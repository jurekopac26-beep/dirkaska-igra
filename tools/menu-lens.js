// The lengths of the tracks for the menu's list (js/menu-data.js: MENU.lens, metres: an open road's race from its start to its finish, a
// circuit's lap). The menu sorts its tracks by them without building every track (a few seconds on a phone). Run after a track is added
// or its road changed; tests/menu-lens.test.js checks the table against the game's tracks.
//   node tools/menu-lens.js
'use strict';
const fs = require('fs'), path = require('path');
const { loadCore, ROOT } = require('../tests/lib/core.js');
const C = loadCore(), lens = {};
for (const d of C.TRACKS) if (!d.variantOf) { const T = new C.Track(d); lens[d.id] = Math.round(d.open ? T.raceLen : T.len); }
const F = path.join(ROOT, 'js', 'menu-data.js'), src = fs.readFileSync(F, 'utf8'), line = 'window.MENU.lens = ' + JSON.stringify(lens) + ';';
const out = /^window\.MENU\.lens = .*;$/m.test(src) ? src.replace(/^window\.MENU\.lens = .*;$/m, line) : src.replace(/\s*$/, '\n') + '// the lengths of the tracks in metres (tools/menu-lens.js): the order of the list\n' + line + '\n';
fs.writeFileSync(F, out);
console.log(Object.keys(lens).length + ' tracks');
