// The centre line of a track in game coordinates with its place on the Earth (js/geo.js), for tools/cesta/osm.py
// (the package Realizem E, docs/realizem/paket-e.md, "Prenos OSM").
//   node tools/cesta/crte.js <id> [<id> ...] > crte.json
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = process.env.GAME_ROOT || path.resolve(__dirname, '..', '..');
const { loadCore } = require(path.join(ROOT, 'tests/lib/core.js'));
const C = loadCore(), win = {};
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/geo.js'), 'utf8'), { window: win });
const out = {};
for (const id of process.argv.slice(2)) {
  const d = C.TRACKS.find(t => t.id === id); if (!d) { console.error('no track ' + id); process.exit(1); }
  const T = new C.Track(d), g = (win.GEO.tracks || {})[id] || null, r = v => +v.toFixed(2);
  const px = [], pz = [], w = [];
  for (let i = 0; i < T.N; i++) { px.push(r(T.px[i])); pz.push(r(T.pz[i])); w.push(r(T.wAt(i))); }
  // for tools/cesta/izvoz.py: the start line (m along the samples), the right-hand normal at the first sample, the banked samples (runs)
  // and the bridges of the track's data ([x, z]: no junction there)
  const bank = []; if (T.bank) for (let i = 0; i < T.N; i++) if (T.bank[i] > 0) { const l = bank[bank.length - 1]; if (l && l[1] === i - 1) l[1] = i; else bank.push([i, i]); }
  out[id] = { id, name: d.name, N: T.N, ds: T.ds, open: !!T.open, geo: g && { kind: g.kind, lat0: g.lat0, lon0: g.lon0, rot: g.rot, scale: g.scale || 1 }, px, pz, w,
    start: r(T.startS), n0: [T.nx[0], T.nz[0]], bank, mostovi: [].concat(d.brO || [], d.brU || []).map(p => [p[0], p[1]]) };
}
process.stdout.write(JSON.stringify(out));
