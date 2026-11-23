// The centre line of a track in game coordinates with its place on the Earth (js/geo.js), for tools/cesta/osm.py
// (the package Realizem E, docs/realizem/paket-e.md, "Prenos OSM").
//   node tools/cesta/crte.js <id> [<id> ...] > crte.json
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = process.env.GAME_ROOT || path.resolve(__dirname, '..', '..');
const { loadCore } = require(path.join(ROOT, 'tests/lib/core.js'));
const C = loadCore(), win = {};
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/geo.js'), 'utf8'), { window: win });
// a track that js/geo.js does not place (the tracks from pull requests): its own frame, the origin on the start line, x east, z south,
// not turned (the mark of tools/proga-uvoz.mjs in the track's file, "izhodišče lat, lon", or lat0 and lon0 in tools/<id>/<id>.json of
// tools/proga-podatki.py); osm.py fits it to the roads all the same
const PROGA = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/proga/proge.json'), 'utf8')); } catch (e) { return {}; } })();
function own(id) {
  const f = path.join(ROOT, 'js/tracks', id + '.js'), src = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '', m = /izhodišče (-?\d+\.\d+), (-?\d+\.\d+)/.exec(src);
  if (m) return { kind: 'own', lat0: +m[1], lon0: +m[2], rot: 0, scale: 1 };
  // the tracks of tools/proga/proga.py (Izoard, Medeu, Porto Moniz, Koror ...): the origin is the line's sample nearest `start` of
  // tools/proga/proge.json (not the route's first point of tools/<id>/config.json nor lat0 and lon0 of an older tools/<id>/<id>.json)
  const pg = PROGA[id]; if (pg && Array.isArray(pg.start) && src.includes('tools/proga/proga.py')) return { kind: 'own', lat0: pg.start[0], lon0: pg.start[1], rot: 0, scale: 1 };
  const j = path.join(ROOT, 'tools', id, id + '.json'), o = fs.existsSync(j) ? JSON.parse(fs.readFileSync(j, 'utf8')) : {};
  if (typeof o.lat0 === 'number' && typeof o.lon0 === 'number') return moved(id, o) || { kind: 'own', lat0: o.lat0, lon0: o.lon0, rot: 0, scale: 1 };
  // a track with only tools/<id>/config.json (Cusco; Furka, Medeu and Sa Calobra are tools/proga/proga.py's now, above): the first point
  // of the route is the start line, the origin of the track's file ("origin = the start line, x east, z south")
  const c = path.join(ROOT, 'tools', id, 'config.json'), q = fs.existsSync(c) ? JSON.parse(fs.readFileSync(c, 'utf8')) : {};
  if (Array.isArray(q.route) && q.route[0] && typeof q.route[0][0] === 'number') return { kind: 'own', lat0: q.route[0][0], lon0: q.route[0][1], rot: 0, scale: 1 };
  return ORIGIN[id] ? { kind: 'own', lat0: ORIGIN[id][0], lon0: ORIGIN[id][1], rot: 0, scale: 1 } : null;
}
// the data's frame has its origin at (lat0, lon0), the route's first point; the builders move the track's origin along the line (tools/
// quezaltepeque/build.py: to the finish line, 260 m on; tools/kratke/build.py: to the route's "start |" point, the run-up before it): the
// shift that lays the track's points on the data's line (every point of the line tried for the track's first point, the median distance
// under 3 m), turned back into degrees (the plane of osm.py's Geo, not turned), or null for none
function moved(id, o) {
  const d = C.TRACKS.find(t => t.id === id), P = d && d.points, L = o.line, n = L ? L.length / 2 : 0;
  if (!P || P.length < 8 || n < 8) return null;
  const pick = [], m = Math.max(1, Math.floor(P.length / 80)); for (let i = 0; i < P.length; i += m) pick.push(P[i]);
  let best = null;
  for (let j = 0; j < n; j++) {
    const tx = L[2 * j] - P[0][0], tz = L[2 * j + 1] - P[0][1], e = [];
    for (const p of pick) {
      const x = p[0] + tx, z = p[1] + tz; let b = Infinity;
      for (let k = 0; k < n; k++) { const dx = L[2 * k] - x, dz = L[2 * k + 1] - z, q = dx * dx + dz * dz; if (q < b) b = q; }
      e.push(Math.sqrt(b));
    }
    e.sort((a, c) => a - c); const md = e[e.length >> 1];
    if (!best || md < best.md) best = { tx, tz, md };
  }
  if (!best || best.md > 3 || Math.hypot(best.tx, best.tz) < 1) return null;
  const A = 6378137, E2 = 0.00669437999014, s = Math.sin(o.lat0 * Math.PI / 180), q = 1 - E2 * s * s, M = A * (1 - E2) / Math.pow(q, 1.5), N = A / Math.sqrt(q);
  return { kind: 'own', lat0: o.lat0 - best.tz / M * 180 / Math.PI, lon0: o.lon0 + best.tx / (N * Math.cos(o.lat0 * Math.PI / 180)) * 180 / Math.PI, rot: 0, scale: 1 };
}
// the origins written down only in a track's own documents: Hakone, the start line in Yumoto (docs/proga-hakone.md, "Okvir igre")
const ORIGIN = { hakone: [35.2336134, 139.1046511] };
const out = {};
for (const id of process.argv.slice(2)) {
  const d = C.TRACKS.find(t => t.id === id); if (!d) { console.error('no track ' + id); process.exit(1); }
  const T = new C.Track(d), g = (win.GEO.tracks || {})[id] || own(id), r = v => +v.toFixed(2);
  const px = [], pz = [], w = [];
  for (let i = 0; i < T.N; i++) { px.push(r(T.px[i])); pz.push(r(T.pz[i])); w.push(r(T.wAt(i))); }
  // for tools/cesta/izvoz.py: the start line (m along the samples), the right-hand normal at the first sample, the banked samples (runs),
  // the bridges of the track's data ([x, z]: no junction there), the bridges and galleries of an open road (brez: [from, to], metres
  // after the start line: no junction there either), an open road's finish line (cilj, metres after the start line: no junction at
  // the gantry and the crowd, nor in the run-off beyond) and the mouths the track's own model has already (ima: [m after the start
  // line, side] of def.sideRoads and def.junctions, and the lay-bys of def.views, the game's own car parks beside the road: no road for
  // the look beside them) and the car parks of World.gore (pulls [x, z, r]: a road stops at the pad's edge)
  const bank = []; if (T.bank) for (let i = 0; i < T.N; i++) if (T.bank[i] > 0) { const l = bank[bank.length - 1]; if (l && l[1] === i - 1) l[1] = i; else bank.push([i, i]); }
  out[id] = { id, name: d.name, N: T.N, ds: T.ds, open: !!T.open, geo: g && { kind: g.kind, lat0: g.lat0, lon0: g.lon0, rot: g.rot, scale: g.scale || 1 }, px, pz, w,
    start: r(T.startS), n0: [T.nx[0], T.nz[0]], bank, mostovi: [].concat(d.brO || [], d.brU || []).map(p => [p[0], p[1]]),
    brez: T.open ? [].concat(d.bridges || [], d.galleries || []).filter(b => b.length <= 3).map(b => [b[0], b[1]]) : [], cilj: T.open ? r(T.finishS - T.startS) : null,
    ima: [].concat(d.sideRoads || [], d.junctions || [], d.views || []).filter(e => typeof e[0] === 'number' && typeof e[1] === 'number').map(e => [e[0], e[1]]),
    pulls: (d.pulls || []).filter(p => typeof p[0] === 'number').map(p => [p[0], p[1], p[2]]) };   // (World.gore's car parks [x, z, r]: no road across them)
}
process.stdout.write(JSON.stringify(out));
