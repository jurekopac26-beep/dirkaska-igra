// The countries of the menu's track step (js/menu.js: the flags, the globe in the head; its data: js/geo.js, and MENU.globe in
// js/menu-data.js from tools/menu-globe.mjs): every country of the game's tracks has its flag (assets/flags/<country>.svg, in the menu's
// list) and its outline for the globe (GEO.outlines and MENU.globe.outlines); every real track has its place for the globe's ring
// (GEO.tracks in the same country, else MENU.globe.places), in its country (inside its outline, or within 30 km of its simplified
// coast); the small Earth the globe is drawn from is there (assets/geo/earth-s.webp). After a track in a new country, or a real track
// geo.js has no place for: node tools/menu-globe.mjs
//   node tests/menu-globe.test.js
'use strict';
const fs = require('fs'), path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
global.window = global;
require(path.join(ROOT, 'js', 'geo.js')); require(path.join(ROOT, 'js', 'menu-data.js'));
const GEO = global.GEO, GB = global.MENU.globe || { places: {}, outlines: {} };
// a track's country as the menu reads it: the end of its English name ("Vršič, Slovenia"), else where geo.js puts it
const countryOf = (d) => { const full = (d.en && d.en.name) || d.name, k = full.lastIndexOf(', '); return k > 0 ? full.slice(k + 2) : GEO.tracks[d.id] ? GEO.tracks[d.id].names.country : ''; };
const defs = C.TRACKS.filter(d => !d.variantOf), real = defs.filter(d => !d.test);

// the flags: a file for every real track's country, and the menu knows it (FLAG_FILES)
const menu = fs.readFileSync(path.join(ROOT, 'js', 'menu.js'), 'utf8'), m = /const FLAG_FILES = \[([^\]]*)\]/.exec(menu), FILES = m ? m[1].match(/'[^']+'/g).map(s => s.slice(1, -1)) : [];
const fname = (c) => c.toLowerCase().replace(/\s+/g, '-'), countries = [...new Set(real.map(countryOf))];
const noflag = countries.filter(c => !FILES.includes(fname(c)) || !fs.existsSync(path.join(ROOT, 'assets', 'flags', fname(c) + '.svg')));
check(`every real track's country (${countries.length}) has its flag in assets/flags and in the menu's list`, countries.length >= 15 && !noflag.length, noflag.join(', '));

// the outlines: every country of the game (the test tracks' too), each ring [lon, lat, ...] closed and on the Earth
const outline = (c) => { const R = [].concat(GEO.outlines[c] || [], GB.outlines[c] || []); return R.length ? R : null; };
const all = [...new Set(defs.map(countryOf).filter(Boolean))], noout = all.filter(c => !outline(c));
check(`every country of the game's tracks (${all.length}) has its outline for the globe (geo.js, else node tools/menu-globe.mjs)`, !noout.length, noout.join(', '));
const odd = Object.entries(GB.outlines).filter(([, R]) => !R.length || R.some(r => r.length < 8 || r.length % 2 || r.some((v, i) => Math.abs(v) > (i % 2 ? 90 : 180)) || r[0] !== r[r.length - 2] || r[1] !== r[r.length - 1])).map(([c]) => c);
check(`the menu's own outlines (${Object.keys(GB.outlines).join(', ') || 'none'}): closed rings of longitudes and latitudes`, !odd.length, odd.join(', '));

// the places: every real track, in its country
function inside(R, lon, lat) { let k = false; for (const r of R) for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) { const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1]; if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) k = !k; } return k; }
function nearKm(R, lon, lat) {   // (the nearest point of the outline, in km)
  let best = 1e9; const c = Math.cos(lat * Math.PI / 180);
  for (const r of R) for (let i = 2; i < r.length; i += 2) {
    const ax = (r[i - 2] - lon) * c, ay = r[i - 1] - lat, bx = (r[i] - lon) * c, by = r[i + 1] - lat, dx = bx - ax, dy = by - ay, q = dx * dx + dy * dy;
    const t = q ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / q)) : 0; best = Math.min(best, Math.hypot(ax + dx * t, ay + dy * t) * 111.2);
  }
  return best;
}
const off = [];
for (const d of real) {
  const c = countryOf(d), gt = GEO.tracks[d.id], p = GB.places[d.id] || (gt && gt.names.country === c ? [gt.lat0, gt.lon0] : null), R = outline(c);
  if (!p) { off.push(d.id + ': no place'); continue; }
  if (R && !inside(R, p[1], p[0]) && nearKm(R, p[1], p[0]) > 30) off.push(d.id + ': ' + p.join(', ') + ' not in ' + c + ' (' + Math.round(nearKm(R, p[1], p[0])) + ' km)');
}
check(`every real track (${real.length}) has its place for the globe's ring, in its country`, !off.length, off.join('; '));
// (a country geo.js has: only the part round a real track it left out, more than 30 km off its outline)
const spare = Object.keys(GB.outlines).filter(c => !all.includes(c) || (GEO.outlines[c] && !real.some(d => { const gt = GEO.tracks[d.id]; return countryOf(d) === c && gt && !inside(GEO.outlines[c], gt.lon0, gt.lat0) && nearKm(GEO.outlines[c], gt.lon0, gt.lat0) > 30; })));
check('the menu\'s outlines: a country geo.js has not got, or the part of one round a real track it left out (Hawaii)', !spare.length, spare.join(', '));
const pspare = Object.keys(GB.places).filter(id => GEO.tracks[id] || !real.some(d => d.id === id));
check('no place in the menu\'s table that geo.js has, or for a track that is not a real one of the game', !pspare.length, pspare.join(', '));

// the small Earth: a WebP 1024 x 512 (its size in the file's header: VP8X, VP8 or VP8L), small enough for a phone
const E = path.join(ROOT, 'assets', 'geo', 'earth-s.webp'), b = fs.existsSync(E) ? fs.readFileSync(E) : null, kind = b && b.toString('latin1', 0, 4) === 'RIFF' ? b.toString('latin1', 12, 16) : '';
const dims = kind === 'VP8X' ? [b.readUIntLE(24, 3) + 1, b.readUIntLE(27, 3) + 1] : kind === 'VP8 ' ? [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff] : kind === 'VP8L' ? [(b.readUInt32LE(21) & 0x3fff) + 1, ((b.readUInt32LE(21) >> 14) & 0x3fff) + 1] : null;
check('the globe\'s Earth: assets/geo/earth-s.webp, 1024 x 512, at most 120 KB (node tools/menu-globe.mjs --earth)', b && dims && dims[0] === 1024 && dims[1] === 512 && b.length <= 120 * 1024, JSON.stringify({ dims, kb: b && Math.round(b.length / 1024) }));

console.log(`\n${n - bad}/${n} passed`);
process.exit(bad ? 1 : 0);
