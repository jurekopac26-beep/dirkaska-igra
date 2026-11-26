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
function own(id) {
  const f = path.join(ROOT, 'js/tracks', id + '.js'), m = fs.existsSync(f) && /izhodišče (-?\d+\.\d+), (-?\d+\.\d+)/.exec(fs.readFileSync(f, 'utf8'));
  if (m) return { kind: 'own', lat0: +m[1], lon0: +m[2], rot: 0, scale: 1 };
  const j = path.join(ROOT, 'tools', id, id + '.json'), o = fs.existsSync(j) ? JSON.parse(fs.readFileSync(j, 'utf8')) : {};
  return typeof o.lat0 === 'number' && typeof o.lon0 === 'number' ? { kind: 'own', lat0: o.lat0, lon0: o.lon0, rot: 0, scale: 1 } : null;
}
// a short track (js/world-kratke.js) has no place in js/geo.js: the frame of its data (tools/<id>/<id>.json: metres east and south of
// lat0, lon0, no turn) moved to the start line, the game's origin, as tools/kratke/build.py finds it (the data's line nearest the route's
// start point; tools/cesta/osm.py measures the fit, tools/cesta/izvoz.py fits each junction's surroundings anyway)
function kratke(id) {
  const f = path.join(ROOT, 'tools', id, id + '.json'), fc = path.join(ROOT, 'tools', id, 'config.json');
  if (!fs.existsSync(f) || !fs.existsSync(fc)) return null;
  const J = JSON.parse(fs.readFileSync(f, 'utf8')), st = (JSON.parse(fs.readFileSync(fc, 'utf8')).route || []).find(p => /^start \|/.test(p[3] || ''));
  if (J.lat0 == null || !st || !(J.line && J.line.length >= 4)) return null;
  const A = 6378137.0, E2 = 6.69437999014e-3, sn = Math.sin(J.lat0 * Math.PI / 180), q = 1 - E2 * sn * sn;
  const M = A * (1 - E2) / q ** 1.5, N = A / Math.sqrt(q), c = Math.cos(J.lat0 * Math.PI / 180), rad = Math.PI / 180, L = J.line;
  const sx = (st[1] - J.lon0) * rad * N * c, sz = -(st[0] - J.lat0) * rad * M;
  let best = Infinity, ox = 0, oz = 0;
  for (let k = 0; k + 3 < L.length; k += 2) {
    const ex = L[k + 2] - L[k], ez = L[k + 3] - L[k + 1], ee = ex * ex + ez * ez;
    const t = ee > 0 ? Math.max(0, Math.min(1, ((sx - L[k]) * ex + (sz - L[k + 1]) * ez) / ee)) : 0, x = L[k] + t * ex, z = L[k + 1] + t * ez;
    const dd = (x - sx) ** 2 + (z - sz) ** 2; if (dd < best) { best = dd; ox = x; oz = z; }
  }
  return { kind: 'kratke', lat0: J.lat0 - oz / M / rad, lon0: J.lon0 + ox / (N * c) / rad, rot: 0, scale: 1 };
}
// a short track's lanes and drives (def.lanes [width, dirt, x, z, ...]: OpenStreetMap's, from the road out, which js/world-kratke.js draws
// with a mouth in the barrier) are the track's own side roads: their mouths as ima has them ([m after the start line, side]; 1: right)
function lanes(T, d) {
  const out = [], L = T.N * T.ds;
  for (const Ln of d.lanes || []) {
    const x = Ln[2], z = Ln[3]; let best = Infinity, i0 = 0;
    for (let i = 0; i < T.N; i++) { const dd = (T.px[i] - x) ** 2 + (T.pz[i] - z) ** 2; if (dd < best) { best = dd; i0 = i; } }
    if (Math.sqrt(best) > T.wAt(i0) + 12) continue;   // a lane off another lane, not off the road
    let k = 2; while (k + 3 < Ln.length && Math.hypot(Ln[k] - T.px[i0], Ln[k + 1] - T.pz[i0]) < T.wAt(i0) + 3) k += 2;   // its side: clear of the road
    const s = i0 * T.ds - T.startS, side = (Ln[k] - T.px[i0]) * T.nx[i0] + (Ln[k + 1] - T.pz[i0]) * T.nz[i0] > 0 ? 1 : -1;
    out.push([+(T.open ? s : ((s % L) + L) % L).toFixed(1), side]);
  }
  return out;
}
const out = {};
for (const id of process.argv.slice(2)) {
  const d = C.TRACKS.find(t => t.id === id); if (!d) { console.error('no track ' + id); process.exit(1); }
  const T = new C.Track(d), g = (win.GEO.tracks || {})[id] || kratke(id) || own(id), r = v => +v.toFixed(2);
  const px = [], pz = [], w = [];
  for (let i = 0; i < T.N; i++) { px.push(r(T.px[i])); pz.push(r(T.pz[i])); w.push(r(T.wAt(i))); }
  // for tools/cesta/izvoz.py: the start line (m along the samples), the right-hand normal at the first sample, the banked samples (runs),
  // the bridges of the track's data ([x, z]: no junction there), the bridges and galleries of an open road (brez: [from, to], metres
  // after the start line: no junction there either), an open road's finish line (cilj, metres after the start line: no junction at
  // the gantry and the crowd, nor in the run-off beyond) and the mouths the track's own model has already (ima: [m after the start
  // line, side] of def.sideRoads and def.junctions, the lay-bys of def.views, the game's own car parks beside the road, and a short
  // track's def.lanes: no road for the look beside them)
  const bank = []; if (T.bank) for (let i = 0; i < T.N; i++) if (T.bank[i] > 0) { const l = bank[bank.length - 1]; if (l && l[1] === i - 1) l[1] = i; else bank.push([i, i]); }
  out[id] = { id, name: d.name, N: T.N, ds: T.ds, open: !!T.open, geo: g && { kind: g.kind, lat0: g.lat0, lon0: g.lon0, rot: g.rot, scale: g.scale || 1 }, px, pz, w,
    start: r(T.startS), n0: [T.nx[0], T.nz[0]], bank, mostovi: [].concat(d.brO || [], d.brU || []).map(p => [p[0], p[1]]),
    brez: T.open ? [].concat(d.bridges || [], d.galleries || []).filter(b => b.length <= 3).map(b => [b[0], b[1]]) : [], cilj: T.open ? r(T.finishS - T.startS) : null,
    ima: [].concat(d.sideRoads || [], d.junctions || [], d.views || []).filter(e => typeof e[0] === 'number' && typeof e[1] === 'number').map(e => [e[0], e[1]]).concat(lanes(T, d)) };
}
process.stdout.write(JSON.stringify(out));
