// The globe in the head of the menu's track step (js/menu.js, "the globe in the head"): the Earth turned to the track's place, its country
// gold. Most of what it needs is in js/geo.js (made for the intro's globe by maketa-menija/orodja/geo_build.py): the places of the tracks
// (GEO.tracks) and the outlines of their countries (GEO.outlines). This tool writes the rest into js/menu-data.js (MENU.globe):
//   places    the real tracks without a place in geo.js: their start lines (lat, lon), as their track files give them
//   outlines  the countries of the game's tracks without an outline in geo.js, and the parts of a country geo.js left out where a real
//             track is (its small islands: Hawaii of the USA): Natural Earth 1:50m map subunits (public domain; England, metropolitan
//             France with Corsica, Italy with its islands; the subunit round the track), simplified to about 2 km (the globe is 44 px)
// and, with --earth, the small Earth the globe is drawn from: assets/geo/earth-s.webp, the Blue Marble of the intro's globe
// (assets/geo/earth.webp) at 1024 x 512.
// Run after a track in a new country, or a real track geo.js has no place for (add its start line to PLACES); tests/menu-globe.test.js
// checks the table against the game's tracks.
//   node tools/menu-globe.mjs [--earth]
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { loadCore, ROOT } = require('../tests/lib/core.js');

// the start lines of the real tracks without a place in geo.js (their track files: js/tracks/<id>.js, the comment at the top)
const PLACES = { bathurst: [-33.4393, 149.55846], cpalace: [51.42089, -0.06643], rio: [-22.97503, -43.39523], livorno: [43.51202, 10.31889] };
// a country of the game (its English name, as the menu shows it) and the Natural Earth map subunits that make it
const SUBUNITS = { England: ['England'], France: ['France', 'Corsica'], Italy: ['Italy', 'Sicily', 'Sardinia', 'Pantelleria'] };
const NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_map_subunits.geojson';

global.window = global;
require(path.join(ROOT, 'js', 'geo.js'));
const GEO = global.GEO, C = loadCore();
// the country of a track as the menu reads it: the end of its English name ("Kraj, Država": "Vršič, Slovenia"), else where geo.js puts it
const countryOf = (d) => { const full = (d.en && d.en.name) || d.name, k = full.lastIndexOf(', '); return k > 0 ? full.slice(k + 2) : GEO.tracks[d.id] ? GEO.tracks[d.id].names.country : ''; };
const defs = C.TRACKS.filter(d => !d.variantOf), want = [...new Set(defs.map(countryOf).filter(Boolean))].filter(c => !GEO.outlines[c]);
const places = {};
for (const d of defs) if (!d.test && !GEO.tracks[d.id]) { if (!PLACES[d.id]) throw new Error(d.id + ': no place (add its start line to PLACES)'); places[d.id] = PLACES[d.id]; }
// a point in rings of [lon, lat, ...] (even-odd), and how far from them it is (km)
function inside(R, lon, lat) { let k = false; for (const r of R) for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) { const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1]; if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) k = !k; } return k; }
function nearKm(R, lon, lat) {
  let best = 1e9; const c = Math.cos(lat * Math.PI / 180);
  for (const r of R) for (let i = 2; i < r.length; i += 2) {
    const ax = (r[i - 2] - lon) * c, ay = r[i - 1] - lat, bx = (r[i] - lon) * c, by = r[i + 1] - lat, dx = bx - ax, dy = by - ay, q = dx * dx + dy * dy;
    const t = q ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / q)) : 0; best = Math.min(best, Math.hypot(ax + dx * t, ay + dy * t) * 111.2);
  }
  return best;
}
// the real tracks away from their country's outline in geo.js (more than 30 km off it): the part round them is added
const away = defs.filter(d => !d.test).map(d => { const c = countryOf(d), gt = GEO.tracks[d.id], p = places[d.id] || (gt && gt.names.country === c ? [gt.lat0, gt.lon0] : null), R = GEO.outlines[c];
  return p && R && !inside(R, p[1], p[0]) && nearKm(R, p[1], p[0]) > 30 ? { id: d.id, c, p } : null; }).filter(Boolean);

// Douglas-Peucker on a closed ring of [lon, lat] (degrees): the points within tol of the line left out. The ring is split first at its
// point farthest from its first one (its first and last points are the same)
function simplify(P, tol) {
  const keep = new Uint8Array(P.length); let far = 0, m = 0;
  for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[0][0], P[i][1] - P[0][1]); if (d > far) { far = d; m = i; } }
  keep[0] = keep[m] = keep[P.length - 1] = 1;
  const st = [[0, m], [m, P.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let best = -1, at = -1;
    const [ax, ay] = P[a], [bx, by] = P[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-12;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((P[i][0] - ax) * dy - (P[i][1] - ay) * dx) / L; if (d > best) { best = d; at = i; } }
    if (best > tol) { keep[at] = 1; st.push([a, at], [at, b]); }
  }
  return P.filter((_, i) => keep[i]);
}
const area = (P) => { let s = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; s += p[0] * q[1] - q[0] * p[1]; } return Math.abs(s / 2); };
const outlines = {};
if (want.length || away.length) {
  const cache = path.join(os.tmpdir(), 'menu-globe-' + path.basename(NE));
  if (!fs.existsSync(cache)) { const r = await fetch(NE); if (!r.ok) throw new Error(NE + ': ' + r.status); fs.writeFileSync(cache, Buffer.from(await r.arrayBuffer())); }
  const J = JSON.parse(fs.readFileSync(cache, 'utf8'));
  for (const c of want) {
    const units = SUBUNITS[c]; if (!units) throw new Error(c + ': which Natural Earth map subunits? (add it to SUBUNITS)');
    const rings = [];
    for (const f of J.features) {
      if (!units.includes(f.properties.SUBUNIT)) continue;
      const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      for (const poly of polys) for (const ring of poly) {
        if (area(ring) < 0.02) continue;   // (no islets: a few kilometres across is nothing on a globe 44 px wide)
        const s = simplify(ring, 0.02); if (s.length < 4) continue;
        rings.push(s.flatMap(p => [+p[0].toFixed(3), +p[1].toFixed(3)]));
      }
    }
    if (!rings.length) throw new Error(c + ': no outline in ' + NE);
    outlines[c] = rings;
  }
  for (const a of away) {   // (the map subunit the track is in: Hawaii)
    const f = J.features.find(f => { const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates; return polys.some(poly => inside([poly[0].flat()], a.p[1], a.p[0])); });
    if (!f) throw new Error(a.id + ': ' + a.p.join(', ') + ' is in no map subunit of ' + NE);
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates, rings = outlines[a.c] || (outlines[a.c] = []);
    for (const poly of polys) for (const ring of poly) { if (area(ring) < 0.02) continue; const s2 = simplify(ring, 0.02); if (s2.length >= 4) rings.push(s2.flatMap(p => [+p[0].toFixed(3), +p[1].toFixed(3)])); }
    console.log(a.id + ': ' + f.properties.SUBUNIT + ' added to ' + a.c);
  }
}

const F = path.join(ROOT, 'js', 'menu-data.js'), src = fs.readFileSync(F, 'utf8'), line = 'window.MENU.globe = ' + JSON.stringify({ places, outlines }) + ';';
const re = /^window\.MENU\.globe = .*;$/m;
fs.writeFileSync(F, re.test(src) ? src.replace(re, line) : src.replace(/\s*$/, '\n') + '// the globe in the track step\'s head (tools/menu-globe.mjs): the places and the countries\' outlines geo.js has not got\n' + line + '\n');
console.log('places:', Object.keys(places).join(', ') || 'none', '· outlines:', Object.entries(outlines).map(([c, r]) => c + ' (' + r.length + ' rings, ' + r.reduce((s, x) => s + x.length / 2, 0) + ' points)').join(', ') || 'none');

if (process.argv.includes('--earth')) {   // the small Earth: the intro's Blue Marble, 1024 x 512, drawn and saved by the browser (WebP)
  const { serve, launch } = await import('../tests/browser/lib.mjs');
  const srv = await serve(), b = await launch();
  try {
    const p = await b.newPage(); await p.goto(srv.base + '/manifest.webmanifest');
    const url = await p.evaluate(() => new Promise((res, rej) => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, 1024, 512); res(c.toDataURL('image/webp', 0.86)); }; im.onerror = rej; im.src = 'assets/geo/earth.webp'; }));
    const out = path.join(ROOT, 'assets', 'geo', 'earth-s.webp'); fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
    console.log('assets/geo/earth-s.webp', Math.round(fs.statSync(out).size / 1024) + ' KB');
  } finally { await b.close(); srv.close(); }
}
