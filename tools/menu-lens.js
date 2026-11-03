// The menu's tables of the tracks, made from the game's own tracks (building every track in the menu would take seconds on a phone):
//   MENU.lens   the lengths (metres: an open road's race from its start to its finish, a circuit's lap): the order of the track list
//   MENU.profs  the heights along the run of every track without a route map in js/routes.js (its R.prof): the height graph of the
//               track step. { len, base, prof }: 121 heights (m, to 0.1) from the start line over len, above the start line; base: the
//               start line's real height (m above the sea), where it is known (BASE: as the track's file gives it; else def.alt[0])
// Run after a track is added or its road changed; tests/menu-lens.test.js checks the tables against the game's tracks.
//   node tools/menu-lens.js
'use strict';
const fs = require('fs'), path = require('path');
const { loadCore, ROOT } = require('../tests/lib/core.js');
// the start line's height above the sea of the real tracks without a route map (their files: js/tracks/<id>.js, the heights' comment)
const BASE = { bathurst: 708, cpalace: 66.4, rio: 5.3, livorno: 3.8 };
const C = loadCore(), lens = {}, profs = {};
global.window = global; require(path.join(ROOT, 'js', 'routes.js'));
const RT = global.ROUTES || {};
// the heights of a built track along its run: 121 samples from the start line (a circuit: round its lap), above the start line
function profOf(d, T) {
  const L = d.open ? T.raceLen : T.len, N = T.N, out = [];
  for (let k = 0; k <= 120; k++) {
    let s = T.startS + L * k / 120; if (!d.open) s = ((s % T.len) + T.len) % T.len;
    const f = Math.min(N - 1, s / T.ds), i = Math.min(N - 2, Math.floor(f)), h = T.hy[i] + (T.hy[i + 1] - T.hy[i]) * (f - i) - T.hy[T.startIdx];
    out.push(Math.round(h * 10) / 10 || 0);
  }
  return out;
}
for (const d of C.TRACKS) {
  if (d.variantOf) continue;
  const T = new C.Track(d); lens[d.id] = Math.round(d.open ? T.raceLen : T.len);
  if (!RT[d.id]) { const base = BASE[d.id] != null ? BASE[d.id] : d.alt ? d.alt[0] : null; profs[d.id] = Object.assign({ len: lens[d.id] }, base != null ? { base } : {}, { prof: profOf(d, T) }); }
}
const F = path.join(ROOT, 'js', 'menu-data.js');
let src = fs.readFileSync(F, 'utf8');
const put = (key, val, note) => {
  const re = new RegExp('^window\\.MENU\\.' + key + ' = .*;$', 'm'), line = 'window.MENU.' + key + ' = ' + JSON.stringify(val) + ';';
  src = re.test(src) ? src.replace(re, line) : src.replace(/\s*$/, '\n') + '// ' + note + '\n' + line + '\n';
};
put('lens', lens, 'the lengths of the tracks in metres (tools/menu-lens.js): the order of the list');
put('profs', profs, 'the heights along the tracks without a route map (tools/menu-lens.js): the height graph');
fs.writeFileSync(F, src);
console.log(Object.keys(lens).length + ' tracks; heights of ' + Object.keys(profs).join(', '));
