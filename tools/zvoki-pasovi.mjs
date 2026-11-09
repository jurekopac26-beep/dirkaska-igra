// Zvočni pasovi prog (docs/zvoki-okolja.md): za vsako pravo progo kratka tabela, kje ob cesti se slišijo zvoki okolja (od–do v metrih
// od starta, zvok, stran L/D), izračunana iz sveta proge tako kot v igri (js/sfx-okolje.js: drevesa, voda, vasi, veter, cerkve).
// Zaženi po novi progi (kot tools/proge-pregled.js) in preveri, da ima proga, kar ima v resnici ob cesti:
//   node tools/zvoki-pasovi.mjs                 vse prave proge
//   node tools/zvoki-pasovi.mjs medvode spa     samo te
//   node tools/zvoki-pasovi.mjs --json f.json   tabele še v datoteko
//   node tools/zvoki-pasovi.mjs --osm medvode   cerkve (amenity=place_of_worship, building=church) in naselja (place=*) do 600 m od
//       ceste iz OpenStreetMap (glavni API, v kosih ob cesti; CLAUDE.md: nikoli Google), izpiše vnosa BELLS in VAS za js/sfx-okolje.js
//       (samo proge iz GEO: projekcija sveta proge na Zemljo; podatki OSM so pod ODbL 1.0, zasluge v README.md)
import { serve, launch, openGame } from '../tests/browser/lib.mjs';
import fs from 'node:fs';

const argv = process.argv.slice(2), opt = (k) => { const i = argv.indexOf(k); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const jsonOut = opt('--json'), osmId = opt('--osm'), ids = argv;
const fmt = (m) => (m / 1000).toFixed(2).replace('.', ',');

const srv = await serve(), browser = await launch(), out = {};
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, track: 'spa' }, { width: 480, height: 270 });
  if (osmId) await osm(page, osmId);
  else {
    const list = ids.length ? ids : await page.evaluate(() => Core.TRACKS.filter(d => SfxOkolje.eligible(d)).map(d => d.id));
    for (const id of list) {
      const r = await page.evaluate((id) => {
        const def = Core.TRACKS.find(d => d.id === id); if (!def) return { id, err: 'ni proge' };
        if (!SfxOkolje.eligible(def)) return { id, err: 'testna proga: brez zvokov okolja' };
        const T = new Core.Track(def), W = Render.buildWorld(T, 1, 2), Z = SfxOkolje.zones(W, T);
        return { id, name: def.name, rows: SfxOkolje.table(Z), st: Z.st, clim: Z.clim, len: Math.round(Z.open ? Z.s1 - Z.s0 : Z.len) };
      }, id);
      out[id] = r;
      if (r.err) { console.log(`${id}: ${r.err}`); continue; }
      const w = r.st.water, wn = ['pasovi', 'potoki', 'reke', 'slapovi', 'jezera', 'morje'].map((n, k) => w[k] ? `${n} ${w[k]}` : '').filter(Boolean).join(', ');
      console.log(`\n${r.name} (${id}, ${fmt(r.len)} km; dreves ${r.st.trees}; voda: ${wn || 'brez'}; ${r.clim.lat.toFixed(1)}°, ${Math.round(r.clim.alt)} m; ${r.st.ms} ms)`);
      for (const [a, b, z, s] of r.rows) console.log(`  ${a === b ? fmt(a).padStart(13) : (fmt(a) + '–' + fmt(b)).padStart(13)}  ${z.padEnd(7)} ${s}`);
    }
  }
  if (errors.length) console.log('NAPAKE V STRANI:\n' + errors.slice(0, 5).join('\n'));
} finally { await browser.close(); await srv.close(); }
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(out, null, 1));

// ---- OpenStreetMap: churches and places near the road ----
async function osm(page, id) {
  let own = null;   // (a track GEO has not: its own frame from its data tool, tools/<id>/<id>.json: lat0, lon0, x east, z south)
  try { const j = JSON.parse(fs.readFileSync(new URL(`./${id}/${id}.json`, import.meta.url), 'utf8')); if (Number.isFinite(j.lat0) && Number.isFinite(j.lon0)) own = { kind: 'real', lat0: j.lat0, lon0: j.lon0, rot: 0 }; } catch (_) { }
  const tr = await page.evaluate(([id, own]) => {
    const def = Core.TRACKS.find(d => d.id === id), G = (window.GEO && GEO.tracks[id]) || own; if (!def || !G) return null;
    const T = new Core.Track(def), D2R = Math.PI / 180, a = 6378137, e2 = 0.0066943799901413165, s0 = Math.sin(G.lat0 * D2R), w = 1 - e2 * s0 * s0, M = a * (1 - e2) / Math.pow(w, 1.5), N = a / Math.sqrt(w), c = Math.cos(G.lat0 * D2R), r = G.rot * D2R;
    const pts = [];   // (every 20 m: the world's x, z, the normal, lat, lon; js/journey.js gameLL)
    for (let s = 10; s < T.len; s += 20) { const i = T.idx(s), x = T.px[i], z = T.pz[i], east = x * Math.cos(r) + z * Math.sin(r), south = -x * Math.sin(r) + z * Math.cos(r);
      pts.push([s, x, z, T.nx[i], T.nz[i], G.lat0 - south / M / D2R, G.lon0 + east / (N * c) / D2R]); }
    return { pts, len: T.len, s0: T.startS || 0, open: !!T.open, lat0: G.lat0, lon0: G.lon0, rot: G.rot, M, N, c, scaled: G.kind !== 'real' };
  }, [id, own]);
  if (!tr) { console.log(`${id}: proge ni v GEO (ni projekcije na Zemljo)`); return; }
  if (tr.scaled) console.log(`OPOZORILO: ${id} je v GEO pomanjšana (${'scaled'}): lega na Zemlji ni natančna`);
  // the tiles: 0.01° squares along the road (every one the road passes, and its neighbours within ~600 m)
  const T = 0.01, tiles = new Set(), dLat = 600 / 111000, dLon = 600 / (111000 * Math.cos(tr.lat0 * Math.PI / 180));
  for (const p of tr.pts) for (const la of [-dLat, 0, dLat]) for (const lo of [-dLon, 0, dLon]) tiles.add(Math.floor((p[5] + la) / T) + ',' + Math.floor((p[6] + lo) / T));
  console.log(`${id}: ${tiles.size} kosov OSM po ${T}° …`);
  const nodes = new Map(), items = [];
  const get = async (w, s, e, n, depth) => {   // (one bbox; too many nodes in it (400): its four quarters)
    const bbox = [w, s, e, n].map(v => v.toFixed(5)).join(',');
    for (let k = 0; k < 4; k++) {
      try { const res = await fetch('https://api.openstreetmap.org/api/0.6/map?bbox=' + bbox, { headers: { 'User-Agent': 'dirkaska-igra zvoki-pasovi (one-off)' } });
        if (res.ok) return [await res.text()];
        if (res.status === 400 && depth < 3) { const mx = (w + e) / 2, my = (s + n) / 2, o = []; for (const q of [[w, s, mx, my], [mx, s, e, my], [w, my, mx, n], [mx, my, e, n]]) o.push(...await get(...q, depth + 1)); return o; }
        console.log('  ' + bbox + ': ' + res.status); }
      catch (err) { console.log('  ' + bbox + ': ' + err.message); }
      await new Promise(r => setTimeout(r, 2000 * (k + 1)));
    }
    return [];
  };
  let done = 0;
  for (const t of tiles) {
    const [a, b] = t.split(',').map(Number);
    for (const xml of await get(b * T, a * T, (b + 1) * T, (a + 1) * T, 0)) {
    for (const m of xml.matchAll(/<node id="(\d+)"[^>]*lat="([-\d.]+)" lon="([-\d.]+)"[^>]*?(\/>|>([\s\S]*?)<\/node>)/g)) {
      nodes.set(m[1], [+m[2], +m[3]]);
      if (m[5]) items.push({ kind: 'node', id: m[1], lat: +m[2], lon: +m[3], tags: tags(m[5]) });
    }
    for (const m of xml.matchAll(/<way id="(\d+)"[^>]*>([\s\S]*?)<\/way>/g)) {
      const tg = tags(m[2]); if (!tg.amenity && !tg.building && !tg.place) continue;
      const refs = [...m[2].matchAll(/<nd ref="(\d+)"/g)].map(x => x[1]);
      items.push({ kind: 'way', id: m[1], refs, tags: tg });
    }
    }
    if (++done % 10 === 0) console.log(`  ${done}/${tiles.size}`);
    await new Promise(r => setTimeout(r, 400));   // (gently: the main API is not for bulk downloads)
  }
  for (const it of items) if (it.kind === 'way') { let la = 0, lo = 0, n = 0; for (const r of it.refs) { const p = nodes.get(r); if (p) { la += p[0]; lo += p[1]; n++; } } if (n) { it.lat = la / n; it.lon = lo / n; } }
  const where = (lat, lon) => {   // the nearest point of the road: metres from the start, the side, the distance
    const south = (tr.lat0 - lat) * Math.PI / 180 * tr.M, east = (lon - tr.lon0) * Math.PI / 180 * tr.N * tr.c, r = tr.rot * Math.PI / 180;
    const x = east * Math.cos(r) - south * Math.sin(r), z = east * Math.sin(r) + south * Math.cos(r);
    let best = null, bd = Infinity; for (const p of tr.pts) { const d = Math.hypot(p[1] - x, p[2] - z); if (d < bd) { bd = d; best = p; } }
    let d = best[0] - tr.s0; if (!tr.open) d = ((d % tr.len) + tr.len) % tr.len;
    return { d: Math.round(d), side: (x - best[1]) * best[3] + (z - best[2]) * best[4] > 0 ? 1 : -1, dist: Math.round(bd) };
  };
  const seen = new Set(), bells = [], places = [];
  for (const it of items) {
    if (it.lat == null || seen.has(it.kind + it.id)) continue; seen.add(it.kind + it.id);
    const t = it.tags, church = (t.amenity === 'place_of_worship' && (t.religion === 'christian' || !t.religion)) || t.building === 'church';
    if (church) { const w = where(it.lat, it.lon); if (w.dist <= 600) bells.push([w.d, w.side, w.dist, t.name || '', it.kind + ' ' + it.id]); }
    if (t.place && /^(village|hamlet|town|suburb|isolated_dwelling|neighbourhood)$/.test(t.place)) { const w = where(it.lat, it.lon); if (w.dist <= 400) places.push([w.d, w.dist, t.place, t.name || '']); }
  }
  bells.sort((a, b) => a[0] - b[0]); places.sort((a, b) => a[0] - b[0]);
  const keep = []; for (const b of bells) if (!keep.some(k => Math.abs(k[0] - b[0]) < 150 && k[1] === b[1])) keep.push(b);   // (a church and its building: one)
  console.log('\ncerkve do 600 m od ceste (m od starta, stran, oddaljenost, ime v OSM, vir):');
  for (const b of keep) console.log('  ', b.join(' | '));
  console.log('\nnaselja do 400 m od ceste:');
  for (const p of places) console.log('  ', p.join(' | '));
  console.log(`\nza js/sfx-okolje.js:\n    ${id}: [${keep.map(b => `[${b[0]}, ${b[1]}, ${b[2]}]`).join(', ')}],`);
}
function tags(s) { const o = {}; for (const m of s.matchAll(/<tag k="([^"]+)" v="([^"]*)"\/>/g)) o[m[1]] = m[2].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&apos;/g, "'"); return o; }
