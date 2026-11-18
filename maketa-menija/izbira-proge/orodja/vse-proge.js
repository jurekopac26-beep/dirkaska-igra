// Every real track of the game for the mockup: maketa-menija/izbira-proge/vse-proge.js (window.VSE). The quick list under the flag, the
// Earth under the globe and the screen of a track without a hand-made mockup (proge.js) read it.
//   order   the menu's order (js/menu.js): the real tracks from the shortest to the longest, then the ones being decided (pending: true)
//   tracks  per track: its place and country (its English name »Place, Country«), its group (circuit, road, rally: the menu's filters), the
//           flag's file (assets/flags), where it is (MENU.globe.places,
//           else GEO.tracks: lat, lon), length, climb (def.alt) or corners (the game's Track), its highest point, the heights for the graph
//           (ROUTES, else MENU.profs), the pictures for the three cameras (assets/tracks, assets/maps: flyover, corner, helicopter) and the
//           track's shape from above for its card (the game's Track, simplified: shapeOf)
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

// the shape for the track's card: the race's part of the road from above (the game's x east, z south: north up; a circuit from the
// start round to it again), simplified (Douglas-Peucker, 0.4 % of its size), as x, y pairs in a box whose longer side is 200
function shapeOf(T) {
  const N = T.N, a = T.startIdx, b = T.open ? T.finishIdx : T.startIdx + N, P = [];
  for (let i = a; i <= b; i++) { const k = i % N; P.push([T.px[k], T.pz[k]]); }
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const k = 200 / Math.max(x1 - x0, y1 - y0), Q = P.map(([x, y]) => [(x - x0) * k, (y - y0) * k]), keep = new Uint8Array(Q.length), st = [[0, Q.length - 1]];
  keep[0] = keep[Q.length - 1] = 1;
  while (st.length) {
    const [i, j] = st.pop(), [ax, ay] = Q[i], [bx, by] = Q[j], L = Math.hypot(bx - ax, by - ay); let m = -1, md = 0.8;
    for (let n = i + 1; n < j; n++) { const d = L > 1e-6 ? Math.abs((bx - ax) * (ay - Q[n][1]) - (ax - Q[n][0]) * (by - ay)) / L : Math.hypot(Q[n][0] - ax, Q[n][1] - ay); if (d > md) { md = d; m = n; } }
    if (m >= 0) { keep[m] = 1; st.push([i, m], [m, j]); }
  }
  const out = []; Q.forEach((q, i) => { if (keep[i]) out.push(Math.round(q[0]), Math.round(q[1])); });
  return out;
}

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
    pending: !!d.pending, group: (d.rally || d.descent) ? 'rally' : d.open ? 'road' : 'circuit',   // (the game's group, js/menu.js; no test tracks here)
    cams: { 1: model || fly || heli, 2: fly || heli || model, 3: corner || heli || fly || model },
    shape: shapeOf(T),
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
