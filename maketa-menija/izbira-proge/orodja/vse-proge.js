// Every real track of the game for the mockup: maketa-menija/izbira-proge/vse-proge.js (window.VSE). The quick list under the flag, the
// Earth under the globe and the screen of a track without a hand-made mockup (proge.js) read it.
//   order   the menu's order (js/menu.js): the real tracks from the shortest to the longest, then the ones being decided (pending: true)
//   tracks  per track: its place and country (its English name »Place, Country«), the flag's file (assets/flags), where it is (MENU.globe.places,
//           else GEO.tracks: lat, lon), length, climb (def.alt) or corners (the game's Track), its highest point, the heights for the graph
//           (ROUTES, else MENU.profs) and the pictures for the three cameras (assets/tracks, assets/maps: flyover, corner, helicopter)
//   flags   the flags themselves (assets/flags/<country>.svg, inline: the mockup draws them into canvases, where a file cannot be loaded)
// Test tracks are left out (CLAUDE.md »Testne proge«: frozen until they are deleted).
// Run from the repository: node maketa-menija/izbira-proge/orodja/vse-proge.js
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..');
const { loadCore } = require(path.join(ROOT, 'tests', 'lib', 'core.js'));

const win = {};
const load = (f) => new Function('window', fs.readFileSync(path.join(ROOT, f), 'utf8'))(win);
['js/geo.js', 'js/routes.js', 'js/menu-data.js'].forEach(load);
const { GEO, ROUTES, MENU } = win;
const C = loadCore();
const has = (f) => fs.existsSync(path.join(ROOT, f));
const r = (v, k) => Math.round(v * 10 ** k) / 10 ** k;

const lenOf = (d) => (MENU.lens || {})[d.id] || 0;
const rank = (d) => d.pending ? 1 : 0;
const defs = C.TRACKS.filter(d => !d.variantOf && !d.test)
  .sort((a, b) => (rank(a) - rank(b)) || (lenOf(a) - lenOf(b)) || (a.id < b.id ? -1 : 1));

const tracks = {}, used = new Set();
for (const d of defs) {
  const full = (d.en && d.en.name) || d.name, k = full.lastIndexOf(', ');
  const name = k > 0 ? full.slice(0, k) : full, country = k > 0 ? full.slice(k + 2) : '';
  const cc = country.toLowerCase().replace(/\s+/g, '-'), flag = has('assets/flags/' + cc + '.svg') ? cc : '';
  if (flag) used.add(flag);
  const g = GEO.tracks[d.id], pl = (MENU.globe.places || {})[d.id];
  const at = pl || (g ? [g.lat0, g.lon0] : null);
  const T = new C.Track(d), km = (lenOf(d) || (d.open ? T.raceLen : T.len)) / 1000;
  // the heights along the run (the graph): the route's profile with the start and the top from the menu's map, else the menu's own profile
  const R = ROUTES[d.id], P = (MENU.profs || {})[d.id], M = (MENU.routeMaps || {})[d.id] || {};
  let top = null;
  if (MENU.heads && MENU.heads[d.id]) top = MENU.heads[d.id];
  else if (d.alt) top = Math.max(d.alt[0], d.alt[1]);
  else if (R && M.alt) top = Math.max(M.alt[0], M.alt[1]);
  else if (P && P.base != null) top = P.base + Math.max(...P.prof);
  const pic = (f) => has(f) ? f : null;
  const fly = pic('assets/maps/fly-' + d.id + '.webp'), corner = pic('assets/maps/corner-' + d.id + '.webp'), heli = pic('assets/maps/heli-' + d.id + '.webp');
  const model = pic('assets/tracks/' + d.id + '.webp');
  tracks[d.id] = {
    name, country, flag, lat: at ? r(at[0], 5) : null, lon: at ? r(at[1], 5) : null, km: r(km, 2), open: !!d.open,
    alt: d.alt ? d.alt.slice() : null, corners: T.corners.length, top: top != null ? Math.round(top) : null,
    graph: R ? 'routes' : P ? 'profs' : null, profs: !R && P ? { len: P.len, base: P.base, prof: P.prof } : undefined,
    pending: !!d.pending,
    cams: { 1: model || fly || heli, 2: fly || heli || model, 3: corner || heli || fly || model },
  };
}

// the flags: each file's drawing without its title and comments, with its own viewBox (drawn into the mockup's 30 x 20 box)
const flags = {};
for (const cc of [...used].sort()) {
  const s = fs.readFileSync(path.join(ROOT, 'assets', 'flags', cc + '.svg'), 'utf8');
  const vb = (s.match(/viewBox="([^"]+)"/) || [])[1];
  const inner = s.replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<title>[\s\S]*?<\/title>/g, '')
    .replace(/\n\s*/g, '').trim();
  flags[cc] = { vb, svg: inner };
}

const out = path.join(ROOT, 'maketa-menija', 'izbira-proge', 'vse-proge.js');
const head = '// Every real track of the game for the mockup, made by orodja/vse-proge.js from the game (js/tracks, js/menu-data.js, js/geo.js, js/routes.js,\n' +
  '// assets/flags): do not edit by hand, run the tool again after a track is added or changed. Test tracks are left out.\n';
fs.writeFileSync(out, head + 'window.VSE = ' + JSON.stringify({ order: defs.map(d => d.id), tracks, flags }) + ';\n');
console.log(out.replace(ROOT + '/', '') + ': ' + defs.length + ' tracks, ' + Object.keys(flags).length + ' flags, ' + Math.round(fs.statSync(out).size / 1024) + ' kB');
for (const id of defs.map(d => d.id)) { const t = tracks[id]; console.log(id.padEnd(14), (t.name + ', ' + t.country).padEnd(34), String(t.km).padEnd(6), t.lat, t.lon, t.flag || '-', t.top, t.graph, t.pending ? 'pending' : '', Object.values(t.cams).map(c => c ? c.split('/').pop() : '-').join(' ')); }
