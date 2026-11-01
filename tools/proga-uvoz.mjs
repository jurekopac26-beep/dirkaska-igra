// Uvoz proge iz OpenStreetMap, višinskega modela in rabe tal (sklop kratkih prog, docs/gorske-proge.md). Podatke proge vzame iz
// tools/predogled/proge.json (obseg OSM bbox, ime ceste key, odsek sec, slog cfg; dodatno uvoz: { pred, grid, izt, hw, hwG, polmer, naklon }) in
// naredi podatke datoteke proge v oblikah, ki jih berejo Vršičevi pomočniki koridorja (vrPrep v js/world-vrsic.js) in podatkovni graditelj
// js/world-gore.js: sredinsko črto (zglajeno, serpentine odprte na najmanjši polmer, kraki narazen, kot na Irohazaki), višine ob njej
// (očiščene, omejen naklon, serpentine bolj položne), pas terena (dem), rabo tal (lc: ESA WorldCover in OSM: voda, smučarske proge), podlago
// ceste po odsekih (surf, widths), stranske ceste (sideRoads, oblika Vršiča), žičnice, stavbe, jezera, parkirišča in razgledišča v pasu ob
// cesti. Kamera vidi le ~60 m ob cesti (načrt, Kaj vidi kamera): pogleda v daljavo (farDem) zato ni. Samo vgrajeni moduli Node (fetch, zlib).
//
// Viri (CLAUDE.md, Pravna varnost): OSM prek glavnega API-ja (api.openstreetmap.org/api/0.6/map?bbox=…; overpass-api.de iz okolja ne deluje),
// višine Copernicus DEM GLO-30 (copernicus-dem-30m.s3.amazonaws.com), raba tal ESA WorldCover 2021 (esa-worldcover.s3.eu-central-1.amazonaws.com).
// Nikoli Google. Prenosi so v tools/predogled/podatki/ (ni v repozitoriju, isti kot pri tools/predogled/pripravi.py); v repozitorij gre samo
// izpeljan zapis v datoteki proge. Imena stranskih cest se ne prenesejo (ulice, poimenovane po osebah: Pravna varnost).
//
//   node tools/proga-uvoz.mjs <id> --pregled   cesta, odsek, dirka, ovinki in kaj je ob cesti (brez zapisa)
//   node tools/proga-uvoz.mjs <id>             podatki v tools/predogled/podatki/uvoz/<id>.json in v js/tracks/<id>.js med oznakama
//                                              »// ---- uvoz: začetek« in »// ---- uvoz: konec« (datoteko proge naredi tools/nova-proga.mjs)
// Možnosti (prepišejo proge.json uvoz): --pred <m> (start toliko pred začetkom odseka, cesta se po potrebi podaljša), --grid <m> (narisana cesta
// pred startom), --izt <m> (iztek za ciljem), --hw <m> (polovična širina asfalta), --hwG <m> (na makadamu), --polmer <m>, --naklon <delež>, --sveze.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import zlib from 'node:zlib';

const REPO = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..'), PRED = path.join(REPO, 'tools', 'predogled'), DATA = path.join(PRED, 'podatki');

/* ---------------- arguments ---------------- */
function parseArgs(argv) {
  const a = argv.slice(2), o = { _: [] };
  for (let i = 0; i < a.length; i++) {
    if (!a[i].startsWith('--')) { o._.push(a[i]); continue; }
    const k = a[i].slice(2), nx = a[i + 1];
    if (nx == null || nx.startsWith('--')) o[k] = true; else { o[k] = nx; i++; }
  }
  return o;
}

/* ---------------- downloads (cached in the work folder) ---------------- */
async function get(u, opt = {}, tries = 4) {
  for (let k = 0; ; k++) {
    try {
      const r = await fetch(u, opt);
      if (!r.ok && r.status !== 206) throw new Error(r.status + ' ' + r.statusText + ' ' + u);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) { if (k >= tries - 1) throw e; await new Promise(res => setTimeout(res, 2000 * 2 ** k)); }
  }
}
async function cached(file, u, fresh) {
  if (!fresh && fs.existsSync(file)) return fs.readFileSync(file);
  const b = await get(u); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, b); return b;
}

/* ---------------- OpenStreetMap (main API, XML) ---------------- */
const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&');
function osmParse(xml) {
  const nodes = new Map(), ways = [], rels = [];
  const attr = (s, k) => { const m = s.match(new RegExp('\\b' + k + '="([^"]*)"')); return m ? m[1] : null; };
  const re = /<(node|way|relation)\b([^>]*?)(\/>|>([\s\S]*?)<\/\1>)/g; let m;
  while ((m = re.exec(xml))) {
    const kind = m[1], head = m[2], body = m[4] || '', tags = {};
    for (const t of body.matchAll(/<tag k="([^"]*)" v="([^"]*)"\s*\/>/g)) tags[unesc(t[1])] = unesc(t[2]);
    const id = attr(head, 'id');
    if (kind === 'node') nodes.set(id, { lat: +attr(head, 'lat'), lon: +attr(head, 'lon'), tags });
    else if (kind === 'way') ways.push({ id, nds: [...body.matchAll(/<nd ref="(\d+)"\s*\/>/g)].map(x => x[1]), tags });
    else rels.push({ id, members: [...body.matchAll(/<member type="(\w+)" ref="(\d+)" role="([^"]*)"\s*\/>/g)].map(x => ({ type: x[1], ref: x[2], role: x[3] })), tags });
  }
  return { nodes, ways, rels };
}
async function osmLoad(id, bbox, fresh) {   // (the same file as tools/predogled/pripravi.py's)
  const f = path.join(DATA, 'osm', id + '.xml');
  const xml = (await cached(f, 'https://api.openstreetmap.org/api/0.6/map?bbox=' + bbox.join(','), fresh)).toString('utf8');
  if (!/<osm\b/.test(xml.slice(0, 400))) throw new Error('OSM: not an OSM extract (' + xml.slice(0, 120) + ')');
  return osmParse(xml);
}

/* ---------------- the flat world on the globe: origin (lat0, lon0), x east, z south, metres (WGS84 radii at lat0) ---------------- */
function geo(lat0, lon0) {
  const A = 6378137, F = 1 / 298.257223563, E2 = F * (2 - F), s = Math.sin(lat0 * Math.PI / 180), w = 1 - E2 * s * s;
  const M = A * (1 - E2) / Math.pow(w, 1.5), N = A / Math.sqrt(w), c = Math.cos(lat0 * Math.PI / 180), d = Math.PI / 180;
  return {
    lat0, lon0,
    xz: (lat, lon) => [(lon - lon0) * d * N * c, -(lat - lat0) * d * M],
    ll: (x, z) => [lat0 - z / (d * M), lon0 + x / (d * N * c)],
  };
}

/* ---------------- cloud-optimised GeoTIFF (tiled, DEFLATE, predictor 1 or 3): Copernicus DEM, ESA WorldCover ---------------- */
// Only what these two need: the first IFD (full resolution), tiles read with HTTP ranges, inflated with zlib; predictor 3 (floating point:
// bytes of each row split into planes, most significant first, then differenced) undone for float32.
async function cogOpen(u, dir) {
  const name = u.split('/').pop(), hf = path.join(dir, 'cog', name + '.head');
  let head;
  if (fs.existsSync(hf)) head = fs.readFileSync(hf);
  else { head = await get(u, { headers: { Range: 'bytes=0-1048575' } }); fs.mkdirSync(path.dirname(hf), { recursive: true }); fs.writeFileSync(hf, head); }
  const le = head.toString('latin1', 0, 2) === 'II'; if (!le) throw new Error('COG: big-endian TIFF not supported');
  if (head.readUInt16LE(2) !== 42) throw new Error('COG: not a classic TIFF (BigTIFF not supported): ' + u);
  const ifd = head.readUInt32LE(4), n = head.readUInt16LE(ifd), tags = {};
  const TS = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8, 16: 8 };
  const val = (type, off, k) => type === 3 ? head.readUInt16LE(off + 2 * k) : type === 4 ? head.readUInt32LE(off + 4 * k) : type === 12 ? head.readDoubleLE(off + 8 * k) : type === 11 ? head.readFloatLE(off + 4 * k) : type === 2 ? head[off + k] : head[off + k];
  for (let k = 0; k < n; k++) {
    const e = ifd + 2 + 12 * k, tag = head.readUInt16LE(e), type = head.readUInt16LE(e + 2), cnt = head.readUInt32LE(e + 4), sz = (TS[type] || 1) * cnt;
    const off = sz <= 4 ? e + 8 : head.readUInt32LE(e + 8);
    if (off + sz > head.length) throw new Error('COG: tag ' + tag + ' outside the first megabyte');
    const v = []; for (let q = 0; q < cnt; q++) v.push(val(type, off, q));
    tags[tag] = type === 2 ? Buffer.from(v).toString('latin1') : v;
  }
  const W = tags[256][0], H = tags[257][0], tw = tags[322][0], th = tags[323][0], comp = tags[259][0], pred = tags[317] ? tags[317][0] : 1, bps = tags[258][0], fmt = tags[339] ? tags[339][0] : 1;
  if (comp !== 8 && comp !== 32946) throw new Error('COG: compression ' + comp + ' not supported (only DEFLATE)');
  const scale = tags[33550], tie = tags[33922];   // ModelPixelScale, ModelTiepoint: [i, j, k, X, Y, Z]
  const C = { u, W, H, tw, th, bps, fmt, pred, offs: tags[324], cnts: tags[325], ntx: Math.ceil(W / tw), x0: tie[3] - tie[0] * scale[0], y0: tie[4] + tie[1] * scale[1], dx: scale[0], dy: scale[1], tiles: new Map(), dir };
  return C;
}
async function cogTile(C, ti, tj) {
  const k = tj * C.ntx + ti; if (C.tiles.has(k)) return C.tiles.get(k);
  const f = path.join(C.dir, 'cog', C.u.split('/').pop() + '.' + ti + '_' + tj);
  let raw;
  if (fs.existsSync(f)) raw = fs.readFileSync(f);
  else { const o = C.offs[k], n = C.cnts[k]; raw = n ? await get(C.u, { headers: { Range: 'bytes=' + o + '-' + (o + n - 1) } }) : Buffer.alloc(0); fs.writeFileSync(f, raw); }
  const B = C.bps / 8, n = C.tw * C.th;
  let out;
  if (!raw.length) out = C.fmt === 3 ? new Float32Array(n) : new Uint8Array(n);
  else {
    const d = zlib.inflateSync(raw);
    if (C.fmt === 3 && C.bps === 32) {
      out = new Float32Array(n); const ob = new Uint8Array(out.buffer), rowB = C.tw * B;
      for (let r = 0; r < C.th; r++) {
        const row = d.subarray(r * rowB, (r + 1) * rowB);
        if (C.pred === 3) { const t = Uint8Array.from(row); for (let i = 1; i < rowB; i++) t[i] = (t[i] + t[i - 1]) & 255;
          for (let c = 0; c < C.tw; c++) for (let b = 0; b < B; b++) ob[(r * C.tw + c) * B + (B - 1 - b)] = t[b * C.tw + c]; }
        else ob.set(row, r * rowB);
      }
    } else if (C.bps === 8) {
      out = Uint8Array.from(d.subarray(0, n));
      if (C.pred === 2) for (let r = 0; r < C.th; r++) for (let c = 1; c < C.tw; c++) out[r * C.tw + c] = (out[r * C.tw + c] + out[r * C.tw + c - 1]) & 255;
    } else throw new Error('COG: ' + C.bps + '-bit samples of format ' + C.fmt + ' not supported');
  }
  C.tiles.set(k, out); return out;
}
// the pixels of a lat/lon box (fetching the tiles it touches first); px(lon, lat) -> value (nearest), or bilinear
async function cogBox(C, lat0, lon0, lat1, lon1) {
  const i0 = Math.max(0, Math.floor((Math.min(lon0, lon1) - C.x0) / C.dx) - 2), i1 = Math.min(C.W - 1, Math.ceil((Math.max(lon0, lon1) - C.x0) / C.dx) + 2);
  const j0 = Math.max(0, Math.floor((C.y0 - Math.max(lat0, lat1)) / C.dy) - 2), j1 = Math.min(C.H - 1, Math.ceil((C.y0 - Math.min(lat0, lat1)) / C.dy) + 2);
  for (let tj = Math.floor(j0 / C.th); tj <= Math.floor(j1 / C.th); tj++) for (let ti = Math.floor(i0 / C.tw); ti <= Math.floor(i1 / C.tw); ti++) await cogTile(C, ti, tj);
  const at = (i, j) => { i = Math.max(0, Math.min(C.W - 1, i)); j = Math.max(0, Math.min(C.H - 1, j)); const t = C.tiles.get(Math.floor(j / C.th) * C.ntx + Math.floor(i / C.tw)); return t ? t[(j % C.th) * C.tw + (i % C.tw)] : NaN; };
  return {
    near: (lat, lon) => at(Math.floor((lon - C.x0) / C.dx), Math.floor((C.y0 - lat) / C.dy)),
    lin: (lat, lon) => { const fx = (lon - C.x0) / C.dx - 0.5, fy = (C.y0 - lat) / C.dy - 0.5, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j;
      return (at(i, j) * (1 - u) + at(i + 1, j) * u) * (1 - v) + (at(i, j + 1) * (1 - u) + at(i + 1, j + 1) * u) * v; },
  };
}
// Copernicus DEM GLO-30: 1 x 1 degree tiles, named by their south-west corner
const copUrl = (la, lo) => { const n = 'Copernicus_DSM_COG_10_' + (la >= 0 ? 'N' : 'S') + String(Math.abs(la)).padStart(2, '0') + '_00_' + (lo >= 0 ? 'E' : 'W') + String(Math.abs(lo)).padStart(3, '0') + '_00_DEM';
  return 'https://copernicus-dem-30m.s3.amazonaws.com/' + n + '/' + n + '.tif'; };
// ESA WorldCover 2021 v200: 3 x 3 degree tiles
const wcUrl = (la, lo) => 'https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_' + (la >= 0 ? 'N' : 'S') + String(Math.abs(la)).padStart(2, '0') + (lo >= 0 ? 'E' : 'W') + String(Math.abs(lo)).padStart(3, '0') + '_Map.tif';
// a sampler over a box from tiles of a grid (deg: the tiles' size); f(lat, lon) picks the tile
async function mosaic(urlOf, deg, lat0, lon0, lat1, lon1, dir) {
  const parts = [];
  for (let la = Math.floor(Math.min(lat0, lat1) / deg) * deg; la < Math.max(lat0, lat1); la += deg) for (let lo = Math.floor(Math.min(lon0, lon1) / deg) * deg; lo < Math.max(lon0, lon1); lo += deg) {
    const C = await cogOpen(urlOf(la, lo), dir), b = await cogBox(C, Math.max(la, Math.min(lat0, lat1)), Math.max(lo, Math.min(lon0, lon1)), Math.min(la + deg, Math.max(lat0, lat1)), Math.min(lo + deg, Math.max(lon0, lon1)));
    parts.push({ la, lo, b });
  }
  const pick = (lat, lon) => { for (const p of parts) if (lat >= p.la && lat < p.la + deg && lon >= p.lo && lon < p.lo + deg) return p.b; return parts[0].b; };
  return { near: (lat, lon) => pick(lat, lon).near(lat, lon), lin: (lat, lon) => pick(lat, lon).lin(lat, lon) };
}

/* ---------------- the road: its OSM ways chained into one line, bottom end first ---------------- */
// ways: by name (all highway ways of that name) or by id; chained end to end from a node used by one way only (a dual carriageway's two
// directions: the longest chain wins), the gaps of a few metres closed

/* ---------------- the road graph (OSM highways a car can drive) ---------------- */
const CAR = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'service', 'living_street', 'road', 'track',
  'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link']);
const RANK = { motorway: 9, trunk: 8, primary: 7, secondary: 6, tertiary: 5, unclassified: 4, residential: 4, living_street: 3, road: 3, service: 2, track: 1 };
const isCar = (t) => CAR.has(t.highway) && t.area !== 'yes' && t.access !== 'no' && t.motor_vehicle !== 'no';
// the road of the track: the ways whose name, English name or number holds the key, joined end to end; the longest chain (by its nodes), as
// tools/predogled/prep.py. Returns its nodes and, per segment, its way
function chainByKey(O, key) {
  const sel = O.ways.filter(w => w.nds.length > 1 && w.tags.highway && ((w.tags.name || '') + '|' + (w.tags['name:en'] || '') + '|' + (w.tags.ref || '')).includes(key));
  if (!sel.length) throw new Error('cesta: ni poti s ključem "' + key + '"');
  const adj = new Map(), add = (n, i) => { const L = adj.get(n) || []; L.push(i); adj.set(n, L); };
  sel.forEach((w, i) => { add(w.nds[0], i); add(w.nds[w.nds.length - 1], i); });
  const used = new Set(); let best = null;
  for (let i = 0; i < sel.length; i++) {
    if (used.has(i)) continue; used.add(i);
    let nds = sel[i].nds.slice(), way = new Array(nds.length - 1).fill(sel[i]);
    for (const end of [1, 0]) for (;;) {
      const node = end ? nds[nds.length - 1] : nds[0], j = (adj.get(node) || []).find(q => !used.has(q)); if (j == null) break;
      used.add(j); const ids = sel[j].nds, seq = ids[0] === node ? ids : ids.slice().reverse();
      if (end) { nds = nds.concat(seq.slice(1)); way = way.concat(new Array(seq.length - 1).fill(sel[j])); }
      else { nds = seq.slice().reverse().slice(0, -1).concat(nds); way = new Array(seq.length - 1).fill(sel[j]).concat(way); }
    }
    if (!best || nds.length > best.nds.length) best = { nds, way };
  }
  return best;
}
// the chain lengthened at one end (atStart) by the roads that go on from it: the straightest car road (the higher class first among the nearly
// as straight), until it is metres longer or no road goes on
function extendChain(O, C, atStart, metres, xy) {
  const byNode = new Map(); for (const w of O.ways) if (w.nds.length > 1 && isCar(w.tags)) for (const n of w.nds) { const L = byNode.get(n) || []; L.push(w); byNode.set(n, L); }
  const own = new Set(C.way.map(w => w.id)); let added = 0;
  while (added < metres) {
    const nds = C.nds, n0 = atStart ? nds[0] : nds[nds.length - 1], n1 = atStart ? nds[1] : nds[nds.length - 2], p0 = xy(n0), p1 = xy(n1);
    const out = [p0[0] - p1[0], p0[1] - p1[1]], ol = Math.hypot(out[0], out[1]) || 1;
    let best = null;
    for (const w of byNode.get(n0) || []) { if (own.has(w.id)) continue; const k = w.nds.indexOf(n0);
      for (const dir of [1, -1]) { const seq = []; for (let q = k; q >= 0 && q < w.nds.length; q += dir) seq.push(w.nds[q]); if (seq.length < 2) continue;
        let j = 1, d = 0; while (j < seq.length - 1 && d < 25) { d += Math.hypot(xy(seq[j])[0] - xy(seq[j - 1])[0], xy(seq[j])[1] - xy(seq[j - 1])[1]); j++; }
        const q = xy(seq[j]), v = [q[0] - p0[0], q[1] - p0[1]], ang = Math.acos(Math.max(-1, Math.min(1, (v[0] * out[0] + v[1] * out[1]) / ((Math.hypot(v[0], v[1]) || 1) * ol)))) * 180 / Math.PI;
        const sc = ang - 6 * (RANK[w.tags.highway] || 0); if (ang < 75 && (!best || sc < best.sc)) best = { sc, w, seq }; } }
    if (!best) break;
    own.add(best.w.id); let L = 0; for (let q = 1; q < best.seq.length; q++) L += Math.hypot(xy(best.seq[q])[0] - xy(best.seq[q - 1])[0], xy(best.seq[q])[1] - xy(best.seq[q - 1])[1]);
    if (atStart) { C.nds = best.seq.slice().reverse().concat(C.nds.slice(1)); C.way = new Array(best.seq.length - 1).fill(best.w).concat(C.way); }
    else { C.nds = C.nds.concat(best.seq.slice(1)); C.way = C.way.concat(new Array(best.seq.length - 1).fill(best.w)); }
    added += L; C.ext = (C.ext || []).concat([best.w.tags.name || best.w.tags.highway]);
  }
  return added;
}
// the rings of a multipolygon's outer ways (tools/predogled/prep.py rings_of)
function ringsOf(O, members) {
  const W = new Map(O.ways.map(w => [w.id, w]));
  const segs = members.map(m => W.get(m)).filter(w => w && w.nds.length > 1).map(w => w.nds.slice()), rings = [];
  while (segs.length) { let cur = segs.shift(), ch = true;
    while (cur[0] !== cur[cur.length - 1] && ch) { ch = false;
      for (let k = 0; k < segs.length; k++) { const s = segs[k];
        if (s[0] === cur[cur.length - 1]) cur = cur.concat(s.slice(1)); else if (s[s.length - 1] === cur[cur.length - 1]) cur = cur.concat(s.slice().reverse().slice(1));
        else if (s[s.length - 1] === cur[0]) cur = s.slice(0, -1).concat(cur); else if (s[0] === cur[0]) cur = s.slice().reverse().slice(0, -1).concat(cur); else continue;
        segs.splice(k, 1); ch = true; break; } }
    if (cur[0] === cur[cur.length - 1] && cur.length > 3) rings.push(cur); }
  return rings;
}
// the areas whose tags pass test: closed ways and the outer rings of multipolygons, as node lists
function areasOf(O, test) {
  const out = [];
  for (const w of O.ways) if (w.nds.length > 3 && w.nds[0] === w.nds[w.nds.length - 1] && test(w.tags)) out.push(w.nds);
  for (const r of O.rels) if ((r.tags.type === 'multipolygon' || r.tags.type === 'boundary') && test(r.tags)) for (const ring of ringsOf(O, r.members.filter(m => m.type === 'way' && (m.role === 'outer' || m.role === '')).map(m => m.ref))) out.push(ring);
  return out;
}

/* ---------------- lines ---------------- */
function resample(P, ds) {
  const cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const L = cum[cum.length - 1], n = Math.max(2, Math.round(L / ds) + 1), out = []; let j = 0;
  for (let k = 0; k < n; k++) { const s = L * k / (n - 1); while (j < P.length - 2 && cum[j + 1] < s) j++;
    const t = (s - cum[j]) / Math.max(1e-9, cum[j + 1] - cum[j]); out.push([P[j][0] + (P[j + 1][0] - P[j][0]) * t, P[j][1] + (P[j + 1][1] - P[j][1]) * t]); }
  return out;
}
const lineLen = (P) => { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return L; };
// Gaussian smoothing (sigma in samples), the ends kept
function smoothLine(P, sig) {
  const r = Math.ceil(sig * 3), w = []; for (let k = -r; k <= r; k++) w.push(Math.exp(-k * k / (2 * sig * sig)));
  return P.map((p, i) => { if (i === 0 || i === P.length - 1) return p.slice(); let x = 0, z = 0, s = 0;
    for (let k = -r; k <= r; k++) { const j = Math.max(0, Math.min(P.length - 1, i + k)); x += P[j][0] * w[k + r]; z += P[j][1] * w[k + r]; s += w[k + r]; } return [x / s, z / s]; });
}
// the hairpins opened: every pair of points a metres apart along the road at least the chord of a circle of radius R apart (2R once a > pi R:
// the legs of a hairpin at least 2R apart, no bend tighter than R), the line kept near the real one (a spring) and smooth; the ends fixed.
// Returns the line and how far it moved (average, most)
function openHairpins(P0, ds, R, iters) {
  let P = P0.map(p => p.slice()); const n = P.length, aMax = Math.PI * R, kMax = Math.ceil(aMax / ds) + 1, need = (a) => a >= aMax ? 2 * R : 2 * R * Math.sin(a / (2 * R));
  const CS = 2 * R + 4;
  for (let it = 0; it < iters; it++) {
    const g = new Map(); for (let i = 0; i < n; i++) { const k = Math.floor(P[i][0] / CS) * 73856093 ^ Math.floor(P[i][1] / CS) * 19349663; let L = g.get(k); if (!L) g.set(k, L = []); L.push(i); }
    const D = P.map(() => [0, 0, 0]);
    for (let i = 0; i < n; i++) { const cx = Math.floor(P[i][0] / CS), cz = Math.floor(P[i][1] / CS);
      for (let a = cx - 1; a <= cx + 1; a++) for (let b = cz - 1; b <= cz + 1; b++) { const L = g.get(a * 73856093 ^ b * 19349663); if (!L) continue;
        for (const j of L) { if (j <= i + 1) continue; const dd = need((j - i) * ds), dx = P[i][0] - P[j][0], dz = P[i][1] - P[j][1], d = Math.hypot(dx, dz);
          if (d >= dd - 1e-3) continue; const f = (dd - d) / 2 / Math.max(1e-6, d), ux = dx * f, uz = dz * f;
          D[i][0] += ux; D[i][1] += uz; D[i][2]++; D[j][0] -= ux; D[j][1] -= uz; D[j][2]++; } } }
    let moved = 0;
    for (let i = 1; i < n - 1; i++) if (D[i][2]) { P[i][0] += D[i][0] / Math.sqrt(D[i][2]) * 0.8; P[i][1] += D[i][1] / Math.sqrt(D[i][2]) * 0.8; moved++; }
    const last = it === iters - 1;
    // smooth (a Laplacian step), the spring back to the real line, the spacing evened out
    const Q = P.map(p => p.slice());
    for (let i = 1; i < n - 1; i++) { const lx = (P[i - 1][0] + P[i + 1][0]) / 2 - P[i][0], lz = (P[i - 1][1] + P[i + 1][1]) / 2 - P[i][1]; Q[i][0] += lx * 0.35; Q[i][1] += lz * 0.35;
      if (!last) { Q[i][0] += (P0[i][0] - Q[i][0]) * 0.02; Q[i][1] += (P0[i][1] - Q[i][1]) * 0.02; } }
    P = resample(Q, lineLen(Q) / (n - 1));
    if (!moved && it > 20) break;
  }
  // how far it moved: each new point from the old line
  let sum = 0, mx = 0; for (const p of P) { let m = 1e9; for (let j = 0; j < n - 1; j++) { const a = P0[j], b = P0[j + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / l2)); m = Math.min(m, Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t)); } sum += m; mx = Math.max(mx, m); }
  return { P, avg: sum / P.length, max: mx };
}
// the closest pair of points more than a metres apart along the road, and the tightest radius (over 3 samples either side)
function lineCheck(P, ds, a) {
  let dmin = 1e9, at = 0; const k0 = Math.ceil(a / ds);
  for (let i = 0; i < P.length; i += 1) for (let j = i + k0; j < P.length; j++) { const d = Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]); if (d < dmin) { dmin = d; at = i * ds; } }
  let rmin = 1e9, rat = 0; for (let i = 3; i < P.length - 3; i++) { const h0 = Math.atan2(P[i][1] - P[i - 3][1], P[i][0] - P[i - 3][0]), h1 = Math.atan2(P[i + 3][1] - P[i][1], P[i + 3][0] - P[i][0]); let dh = h1 - h0; dh -= 2 * Math.PI * Math.round(dh / (2 * Math.PI)); const r = 3 * ds / Math.max(1e-6, Math.abs(dh)); if (r < rmin) { rmin = r; rat = i * ds; } }
  return { dmin, at, rmin, rat };
}
// the bends of a line (heading change over a window): each turn of more than minDeg within win metres, its middle, size and side (1 right, -1 left:
// x east, z south, a right turn is a positive change of atan2(dz, dx))
function bends(P, ds, win, minDeg) {
  const hd = []; for (let i = 0; i < P.length - 1; i++) hd.push(Math.atan2(P[i + 1][1] - P[i][1], P[i + 1][0] - P[i][0]));
  const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI)), w = Math.round(win / ds), turn = [];
  for (let i = 0; i < hd.length; i++) { const a = Math.max(0, i - (w >> 1)), b = Math.min(hd.length - 1, i + (w >> 1)); let s = 0; for (let k = a; k < b; k++) s += wrap(hd[k + 1] - hd[k]); turn.push(s); }
  const out = []; let i = 0;
  while (i < turn.length) { if (Math.abs(turn[i]) * 180 / Math.PI < minDeg) { i++; continue; }
    let j = i, best = i; while (j < turn.length && Math.abs(turn[j]) * 180 / Math.PI >= minDeg && Math.sign(turn[j]) === Math.sign(turn[i])) { if (Math.abs(turn[j]) > Math.abs(turn[best])) best = j; j++; }
    out.push({ s: best * ds, deg: Math.round(turn[best] * 180 / Math.PI), dir: Math.sign(turn[best]) }); i = j; }
  return out;
}

/* ---------------- heights along the road ---------------- */
// the model's heights every ds metres, cleaned: a running median (the model sees the slope beside a road cut into it), smoothed, the grade
// limited (forwards and backwards), the bends (hairpins) flatter than the legs between them: the rise between anchors every ~150 m kept, spread
// along by a weight that is lower through the bends. Returns metres above the sea for each sample
function roadHeights(P, ds, at, o) {
  const n = P.length, raw = P.map(([x, z]) => at(x, z));
  const med = (a, r) => a.map((_, i) => { const w = a.slice(Math.max(0, i - r), Math.min(a.length, i + r + 1)).sort((p, q) => p - q); return w[w.length >> 1]; });
  let h = med(raw, Math.round((o.median || 60) / 2 / ds));
  const gs = (a, sig) => { const r = Math.ceil(3 * sig), w = []; for (let k = -r; k <= r; k++) w.push(Math.exp(-k * k / (2 * sig * sig)));
    return a.map((_, i) => { let s = 0, t = 0; for (let k = -r; k <= r; k++) { const j = Math.max(0, Math.min(a.length - 1, i + k)); s += a[j] * w[k + r]; t += w[k + r]; } return s / t; }); };
  h = gs(h, (o.smooth || 25) / ds);
  // the bends flatter: weight 1 on the legs, o.flat in the bends (heading change over 40 m), the rise between anchors spread by it
  const hd = []; for (let i = 0; i < n - 1; i++) hd.push(Math.atan2(P[i + 1][1] - P[i][1], P[i + 1][0] - P[i][0])); hd.push(hd[n - 2]);
  const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI)), r20 = Math.round(20 / ds);
  const wgt = hd.map((_, i) => { const a = Math.max(0, i - r20), b = Math.min(n - 1, i + r20); let t = 0; for (let k = a; k < b; k++) t += Math.abs(wrap(hd[k + 1] - hd[k])); return 1 - (1 - (o.flat || 0.45)) * Math.min(1, Math.max(0, (t - 0.5) / 1.2)); });
  const sw = gs(wgt, 8 / ds), step = Math.round((o.anchor || 150) / ds), out = h.slice();
  for (let a = 0; a < n - 1; a += step) { const b = Math.min(n - 1, a + step); let W = 0; for (let k = a; k < b; k++) W += sw[k];
    for (let k = a, acc = 0; k < b; k++) { out[k] = h[a] + (h[b] - h[a]) * acc / W; acc += sw[k]; } out[b] = h[b]; }
  h = gs(out, 6 / ds);
  const g = o.grade || 0.11;
  for (let it = 0; it < 4; it++) { for (let i = 1; i < n; i++) h[i] = Math.min(h[i], h[i - 1] + g * ds) , h[i] = Math.max(h[i], h[i - 1] - g * ds); for (let i = n - 2; i >= 0; i--) h[i] = Math.min(h[i], h[i + 1] + g * ds), h[i] = Math.max(h[i], h[i + 1] - g * ds); }
  return { h, raw };
}

/* ---------------- encodings of the track file (the forms vrPrep reads, see js/world-vrsic.js) ---------------- */
const A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
// land cover, run-length coded: a symbol = class * 8 + run - 1; a run of 8 or more: class * 8 + 7, then digits of 64 (63: and more) for run - 8
function rleLC(a) {
  let s = '';
  for (let i = 0; i < a.length;) { const c = a[i]; let j = i; while (j < a.length && a[j] === c) j++; let n = j - i;
    if (n < 8) s += A64[c * 8 + n - 1]; else { s += A64[c * 8 + 7]; n -= 8; while (n >= 63) { s += A64[63]; n -= 63; } s += A64[n]; } i = j; }
  return s;
}
// the terrain: a 32 m grid, a trend every f cells (2 bytes a node, big-endian, step 0.1 m above lo) and 1 m residuals (a byte, +128) in each row's
// span of cells near the road (rows: [first cell, count]); heights in metres above the sea, base the start line's
function encDem(dem, x0, z0, nx, nz, cell, near, f) {
  const H = new Float32Array(nx * nz); for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) H[j * nx + i] = dem(x0 + i * cell, z0 + j * cell);
  const tnx = Math.ceil((nx - 1) / f) + 1, tnz = Math.ceil((nz - 1) / f) + 1, tr = new Float32Array(tnx * tnz);
  // the trend: the mean of the model round each trend node (a Gaussian of f/2 cells), so the residuals stay small
  for (let b = 0; b < tnz; b++) for (let a = 0; a < tnx; a++) { let s = 0, w = 0; const ci = a * f, cj = b * f, R = f;
    for (let j = Math.max(0, cj - R); j <= Math.min(nz - 1, cj + R); j++) for (let i = Math.max(0, ci - R); i <= Math.min(nx - 1, ci + R); i++) { const q = Math.exp(-((i - ci) ** 2 + (j - cj) ** 2) / (2 * (f / 2) ** 2)); s += H[j * nx + i] * q; w += q; }
    tr[b * tnx + a] = s / w; }
  let lo = 1e9; for (const v of tr) lo = Math.min(lo, v); lo = Math.floor(lo - 1);
  const tq = new Uint16Array(tr.length); for (let k = 0; k < tr.length; k++) tq[k] = Math.round((tr[k] - lo) / 0.1);
  const tb = Buffer.alloc(tq.length * 2); for (let k = 0; k < tq.length; k++) tb.writeUInt16BE(tq[k], 2 * k);
  const trAt = (i, j) => { const fi = i / f, fj = j / f, ti = Math.min(tnx - 2, Math.floor(fi)), tj = Math.min(tnz - 2, Math.floor(fj)), u = fi - ti, v = fj - tj, k0 = tj * tnx + ti, T = (k) => lo + tq[k] * 0.1;
    return (T(k0) * (1 - u) + T(k0 + 1) * u) * (1 - v) + (T(k0 + tnx) * (1 - u) + T(k0 + tnx + 1) * u) * v; };
  const rows = [], res = []; let clip = 0, worst = 0;
  for (let j = 0; j < nz; j++) { let a = -1, b = -1; for (let i = 0; i < nx; i++) if (near(x0 + i * cell, z0 + j * cell)) { if (a < 0) a = i; b = i; }
    if (a < 0) { rows.push([0, 0]); continue; } rows.push([a, b - a + 1]);
    for (let i = a; i <= b; i++) { const r = Math.round(H[j * nx + i] - trAt(i, j)); worst = Math.max(worst, Math.abs(r)); if (r < -128 || r > 127) clip++; res.push(Math.max(-128, Math.min(127, r)) + 128); } }
  return { tr: { f, nx: tnx, nz: tnz, lo, step: 0.1, b64: tb.toString('base64') }, rows, res: Buffer.from(res).toString('base64'), clip, worst };
}

/* ---------------- polygons ---------------- */
function inPoly(poly, x, z) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; }
function polyArea(p) { let a = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += (p[j][0] + p[i][0]) * (p[j][1] - p[i][1]); return Math.abs(a / 2); }
const segDist = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1e-9, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
// the smallest rectangle round a footprint (its sides along one of the footprint's edges): [cx, cz, length, width, angle]
function minRect(p) {
  let best = null;
  for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), c = Math.cos(ang), s = Math.sin(ang);
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const [x, z] of p) { const u = x * c + z * s, v = -x * s + z * c; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    const A = (u1 - u0) * (v1 - v0); if (!best || A < best.A) { const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2; best = { A, r: [cu * c - cv * s, cu * s + cv * c, u1 - u0, v1 - v0, ang] }; } }
  let [cx, cz, L, W, ang] = best.r; if (W > L) { [L, W] = [W, L]; ang += Math.PI / 2; } ang = Math.atan2(Math.sin(ang), Math.cos(ang)); if (ang < -Math.PI / 2) ang += Math.PI; else if (ang > Math.PI / 2) ang -= Math.PI;
  return [cx, cz, L, W, ang];
}

/* ---------------- the land cover classes ---------------- */
// 0 open (grass, meadow, tundra), 1 forest, 2 shrubs, 3 built-up, 4 rock and scree, 5 water, 6 ski run (OSM piste:type), 7 snow and ice

/* ---------------- the land cover classes ---------------- */
// 0 open (grass, meadow, tundra), 1 forest, 2 shrubs, 3 built-up, 4 rock and scree, 5 water, 6 ski run (OSM piste:type), 7 snow and ice
const WC2LC = { 10: 1, 20: 2, 30: 0, 40: 0, 50: 3, 60: 4, 70: 7, 80: 5, 90: 0, 95: 1, 100: 0 };
const GRAVEL = /^(gravel|unpaved|dirt|compacted|fine_gravel|ground|grass|earth|mud|sand|pebblestone|rock)$/, PAVING = /^(paving_stones|sett|cobblestone|unhewn_cobblestone)$/;
const AK = { gondola: 'gondola', cable_car: 'gondola', mixed_lift: 'chair', chair_lift: 'chair', drag_lift: 'drag', 't-bar': 'drag', 'j-bar': 'drag', platter: 'platter', rope_tow: 'rope', magic_carpet: 'carpet' };

/* ---------------- the import ---------------- */
async function main() {
  const o = parseArgs(process.argv), id = o._[0], PJ = JSON.parse(fs.readFileSync(path.join(PRED, 'proge.json'), 'utf8')), E = id && PJ[id];
  if (!E) { console.log('raba: node tools/proga-uvoz.mjs <id> [--pregled] [--pred m] [--grid m] [--izt m] [--hw m] [--hwG m] [--polmer m] [--naklon d] [--sveze]\n  id: ' + Object.keys(PJ).join(' ')); process.exit(2); }
  const U = Object.assign({ pred: 0, grid: 260, izt: 160, hw: 5.0, polmer: 12, naklon: 0.11, ravno: 0.45 }, E.uvoz || {});
  for (const k of Object.keys(U)) if (o[k] != null && o[k] !== true) U[k] = +o[k];
  if (U.hwG == null) U.hwG = U.hw - 0.5;
  const bbox = E.bbox.split(',').map(Number), ds = 2, R = U.polmer, fresh = !!o.sveze;
  const O = await osmLoad(id, bbox, fresh), latC = (bbox[1] + bbox[3]) / 2, lonC = (bbox[0] + bbox[2]) / 2, G0 = geo(latC, lonC);
  const xy = (nid) => { const n = O.nodes.get(nid); return G0.xz(n.lat, n.lon); };
  const dem = await mosaic(copUrl, 1, latC - 0.06, lonC - 0.08, latC + 0.06, lonC + 0.08, DATA), at0 = (x, z) => { const [la, lo] = G0.ll(x, z); return dem.lin(la, lo); };
  // the road: its chain, oriented by the section (sec: its start, its end; else the bottom end first)
  const C = chainByKey(O, E.key), nIdx = (p) => { const q = G0.xz(p[0], p[1]); let b = 0, bd = 1e18; C.nds.forEach((n, k) => { const v = xy(n), d = (v[0] - q[0]) ** 2 + (v[1] - q[1]) ** 2; if (d < bd) { bd = d; b = k; } }); return b; };
  let flip = E.sec ? nIdx(E.sec[0]) > nIdx(E.sec[1]) : at0(...xy(C.nds[0])) > at0(...xy(C.nds[C.nds.length - 1]));
  if (flip) { C.nds.reverse(); C.way.reverse(); }
  const cumOf = () => { const c = [0]; for (let k = 1; k < C.nds.length; k++) { const a = xy(C.nds[k - 1]), b = xy(C.nds[k]); c.push(c[k - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); } return c; };
  let cum = cumOf(), kA = E.sec ? nIdx(E.sec[0]) : 0, kB = E.sec ? nIdx(E.sec[1]) : C.nds.length - 1;
  // lengthened where the section leaves too little road for the grid before the start or the run-out past the finish
  const before = U.pred + U.grid + 20 - cum[kA], after = U.izt + 10 - (cum[cum.length - 1] - cum[kB]);
  let extA = 0, extB = 0;
  if (before > 0) { const n0 = C.nds.length; extA = extendChain(O, C, true, before, xy); kA += C.nds.length - n0; kB += C.nds.length - n0; }
  if (after > 0) extB = extendChain(O, C, false, after, xy);
  cum = cumOf();
  // the line: every 2 m, smoothed, the hairpins opened; each sample's OSM way (its surface)
  const P0 = C.nds.map(xy), Ls = cum[cum.length - 1];
  let Q = smoothLine(resample(P0, ds), 1.5);
  const c0 = lineCheck(Q, ds, Math.PI * R), OH = openHairpins(Q, ds, R, 400); Q = OH.P; const c1 = lineCheck(Q, ds, Math.PI * R), LQ = (Q.length - 1) * ds;
  const wayAt = (i) => { const s = i * ds * Ls / LQ; let k = 0; while (k < cum.length - 2 && cum[k + 1] < s) k++; return C.way[k]; };
  const sOf = (k) => cum[k] * LQ / Ls;
  const sA = sOf(kA), sB = sOf(kB), sStart = Math.max(U.grid, sA - U.pred), sFin = Math.min(sB + (U.za || 0), LQ - U.izt), d0 = Math.max(0, sStart - U.grid), d1 = Math.min(LQ, sFin + U.izt);
  const bd = bends(Q, ds, 80, 100);
  console.log(`${id}: cesta "${E.key}" ${(Ls / 1000).toFixed(2)} km${extA ? `, pred njo +${Math.round(extA)} m (${C.ext ? C.ext.join(', ') : ''})` : ''}${extB ? `, za njo +${Math.round(extB)} m` : ''}; serpentine odprte na ${R} m (premik povprečno ${OH.avg.toFixed(2)} m, največ ${OH.max.toFixed(2)} m; ` +
    `najtesnejši polmer ${c0.rmin.toFixed(1)} -> ${c1.rmin.toFixed(1)} m, kraka ${c0.dmin.toFixed(1)} -> ${c1.dmin.toFixed(1)} m)`);
  console.log(`odsek ${Math.round(sA)}-${Math.round(sB)} m, start ${Math.round(sStart)} m, cilj ${Math.round(sFin)} m: dirka ${((sFin - sStart) / 1000).toFixed(2)} km, narisano ${Math.round(d0)}-${Math.round(d1)} m`);
  console.log('ovinki nad 100° (m od starta: stopinje, + desno):', bd.map(b => Math.round(b.s - sStart) + ':' + b.deg).join(' '));
  if (sFin - sStart < 1800 || sFin - sStart > 3200) console.log('POZOR: dirka ni dolga 2,5-3 km (načrt)');
  // the drawn road from here on, the start line its origin (x east, z south)
  const i0 = Math.round(d0 / ds), i1 = Math.round(d1 / ds), iS = Math.round(sStart / ds) - i0, iF = Math.round(sFin / ds) - i0;
  const llS = G0.ll(...Q[i0 + iS]), G = geo(llS[0], llS[1]), toG = ([x, z]) => G.xz(...G0.ll(x, z)), at = (x, z) => { const [la, lo] = G.ll(x, z); return dem.lin(la, lo); };
  const S = Q.slice(i0, i1 + 1).map(toG), n = S.length, Sway = []; for (let i = i0; i <= i1; i++) Sway.push(wayAt(i));
  const HT = roadHeights(S, ds, at, { grade: U.naklon, flat: U.ravno }), base = HT.h[iS];
  const RC = 64, rg = new Map(); for (let i = 0; i < n; i++) { const k = Math.floor(S[i][0] / RC) + ',' + Math.floor(S[i][1] / RC); let Lq = rg.get(k); if (!Lq) rg.set(k, Lq = []); Lq.push(i); }
  const near = (x, z, lim) => { let m = 1e9, mi = -1; const r = Math.ceil(lim / RC); for (let a = Math.floor(x / RC) - r; a <= Math.floor(x / RC) + r; a++) for (let b = Math.floor(z / RC) - r; b <= Math.floor(z / RC) + r; b++) { const Lq = rg.get(a + ',' + b); if (Lq) for (const i of Lq) { const d = Math.hypot(x - S[i][0], z - S[i][1]); if (d < m) { m = d; mi = i; } } } return { d: m, i: mi }; };
  const dRoad = (x, z, lim) => near(x, z, lim).d, pt = (nid) => { const nd = O.nodes.get(nid); return G.xz(nd.lat, nd.lon); };
  const mS = (i) => +((i - iS) * ds).toFixed(1);   // (metres after the start line)
  // the lifts in reach (bottom station first, the pylons and stations on their lines); the zones round the parts near the road (the terrain is
  // drawn there too: the stations and the lower towers in view)
  const lifts = [], zones = [];
  for (const w of O.ways) { const k = AK[w.tags.aerialway]; if (!k || w.nds.length < 2) continue;
    let p = w.nds.filter(q => O.nodes.has(q)).map(q => { const [x, z] = pt(q), t = O.nodes.get(q).tags.aerialway; return [x, z, t === 'pylon' ? 1 : t === 'station' ? 2 : 0]; });
    if (p.length < 2) continue; if (at(p[0][0], p[0][1]) > at(p[p.length - 1][0], p[p.length - 1][1])) p.reverse();
    let dm = 1e9; for (let q = 0; q < p.length - 1; q++) for (let f = 0; f <= 1; f += 0.1) dm = Math.min(dm, dRoad(p[q][0] + (p[q + 1][0] - p[q][0]) * f, p[q][1] + (p[q + 1][1] - p[q][1]) * f, 500)); if (dm > 400) continue;
    const seats = +(w.tags['aerialway:occupancy'] || (k === 'gondola' ? 8 : k === 'chair' ? 4 : 1)) || 1;
    lifts.push([k, seats, p.flatMap(([x, z, t]) => [+x.toFixed(1), +z.toFixed(1), t])]);
    for (const [x, z] of p) if (dRoad(x, z, 300) < 260) zones.push([+x.toFixed(0), +z.toFixed(0), 70]); }
  const zoneD = (x, z) => { let m = 1e9; for (const [zx, zz, r] of zones) m = Math.min(m, Math.hypot(x - zx, z - zz) - r); return m; };
  // the corridor (the road and the zones, 460 m round as vrPrep wants it) on the 32 m grid; residuals within 420 m of the road
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of S) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  for (const [x, z, r] of zones) { x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r); z0 = Math.min(z0, z - r); z1 = Math.max(z1, z + r); }
  const M = 520, cell = 32; x0 = Math.floor((x0 - M) / cell) * cell; z0 = Math.floor((z0 - M) / cell) * cell; const dnx = Math.ceil((x1 + M - x0) / cell) + 1, dnz = Math.ceil((z1 + M - z0) / cell) + 1;
  const ED = encDem(at, x0, z0, dnx, dnz, cell, (x, z) => dRoad(x, z, 460) < 420 || zoneD(x, z) < 200, 8);
  // land cover, 16 m cells: ESA WorldCover (the most common class of the cell's 3 x 3 samples), OSM over it: water, the ski runs
  const wc = await mosaic(wcUrl, 3, llS[0] - 0.05, llS[1] - 0.06, llS[0] + 0.05, llS[1] + 0.06, DATA);
  const wcAt = (x, z) => { const [la, lo] = G.ll(x, z), v = wc.near(la, lo); return WC2LC[v] != null ? WC2LC[v] : 0; };
  const lcell = 16, lnx = Math.round((dnx - 1) * cell / lcell), lnz = Math.round((dnz - 1) * cell / lcell), lc = new Uint8Array(lnx * lnz);
  for (let j = 0; j < lnz; j++) for (let i = 0; i < lnx; i++) { const cnt = new Uint8Array(8); for (const a of [-5, 0, 5]) for (const b of [-5, 0, 5]) cnt[wcAt(x0 + (i + 0.5) * lcell + a, z0 + (j + 0.5) * lcell + b)]++;
    let c = 0; for (let k = 1; k < 8; k++) if (cnt[k] > cnt[c]) c = k; lc[j * lnx + i] = c; }
  const polyXZ = (nds) => nds.filter(q => O.nodes.has(q)).map(pt), bld0 = bldAll();
  const fill = (poly, v, cond) => { let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9; for (const [x, z] of poly) { a0 = Math.min(a0, x); a1 = Math.max(a1, x); b0 = Math.min(b0, z); b1 = Math.max(b1, z); }
    for (let j = Math.max(0, Math.floor((b0 - z0) / lcell)); j <= Math.min(lnz - 1, Math.floor((b1 - z0) / lcell)); j++) for (let i = Math.max(0, Math.floor((a0 - x0) / lcell)); i <= Math.min(lnx - 1, Math.floor((a1 - x0) / lcell)); i++) {
      const x = x0 + (i + 0.5) * lcell, z = z0 + (j + 0.5) * lcell; if (inPoly(poly, x, z) && (!cond || cond(lc[j * lnx + i]))) lc[j * lnx + i] = v; } };
  const water = areasOf(O, t => t.natural === 'water' || t.landuse === 'reservoir' || t.water != null).map(polyXZ);
  for (const p of water) fill(p, 5);
  // a ski run: within half its width of its line where the land cover is not forest (the run cleared through it), its middle 7 m anyway; one drawn
  // as an area, all of it; never on the road itself
  const pistes = O.ways.filter(w => w.tags['piste:type'] === 'downhill' || w.tags['piste:type'] === 'sled' || w.tags['piste:type'] === 'nordic'), half = (w) => Math.max(8, Math.min(40, (+w.tags['piste:width'] || 30) / 2));
  for (const w of pistes) { const p = polyXZ(w.nds); if (p.length < 2) continue;
    if (w.nds[0] === w.nds[w.nds.length - 1] && w.tags.area !== 'no' && p.length > 3) { fill(p, 6, c => c !== 5); continue; }
    const hw = half(w); let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9; for (const [x, z] of p) { a0 = Math.min(a0, x); a1 = Math.max(a1, x); b0 = Math.min(b0, z); b1 = Math.max(b1, z); }
    for (let j = Math.max(0, Math.floor((b0 - hw - z0) / lcell)); j <= Math.min(lnz - 1, Math.floor((b1 + hw - z0) / lcell)); j++) for (let i = Math.max(0, Math.floor((a0 - hw - x0) / lcell)); i <= Math.min(lnx - 1, Math.floor((a1 + hw - x0) / lcell)); i++) {
      const x = x0 + (i + 0.5) * lcell, z = z0 + (j + 0.5) * lcell; let d = 1e9; for (let q = 0; q < p.length - 1; q++) d = Math.min(d, segDist(x, z, p[q], p[q + 1]));
      const k = j * lnx + i; if (d < 7 || (d < hw && lc[k] !== 1 && lc[k] !== 5)) lc[k] = 6; } }
  for (let j = 0; j < lnz; j++) for (let i = 0; i < lnx; i++) { const k = j * lnx + i; if (lc[k] === 6 && dRoad(x0 + (i + 0.5) * lcell, z0 + (j + 0.5) * lcell, 64) < U.hw + 7) lc[k] = 0; }
  // the surface along the road (OSM surface, a track unpaved), the half widths (narrower on the gravel), in metres after the start line
  const sfc = Sway.map(w => { const s = w.tags.surface || ''; return PAVING.test(s) ? 'paving' : GRAVEL.test(s) || (w.tags.highway === 'track' && !/asphalt|concrete|paved/.test(s)) ? 'makadam' : 'asphalt'; });
  const surf = [], widths = []; for (let i = 0; i < n;) { let j = i; while (j < n && sfc[j] === sfc[i]) j++; if (sfc[i] !== 'asphalt' && (j - i) * ds >= 20) surf.push([mS(i), mS(j - 1), sfc[i]]); i = j; }
  if (surf.length && U.hwG !== U.hw) { widths.push([mS(0), U.hw]); for (const [a, b] of surf) { widths.push([+(a - 12).toFixed(1), U.hw], [+(a + 12).toFixed(1), U.hwG], [+(b - 12).toFixed(1), U.hwG], [+(b + 12).toFixed(1), U.hw]); } widths.push([mS(n - 1), U.hw]); }
  // the side roads (Vršič's form): the car roads that meet the drawn road, not the road itself; none in the hairpins, by the start, the finish
  // and the checkpoints' gantries, at the ends of the drawn road, nor two on a side within 18 m (the bigger road kept); no names
  const cps = []; for (let k = 1; k <= 4; k++) { let i = Math.round(iS + (iF - iS) * k / 5); const bad = (q) => bd.some(b => Math.abs(b.s - (i0 + q) * ds) < 45); for (let t = 0; t < 40 && bad(i); t++) i += (t % 2 ? -t : t); cps.push(i); }
  const own = new Set(Sway.map(w => w.id)), nodeAt = new Map(); C.nds.forEach(nd => nodeAt.set(nd, true));
  const side = [];
  for (const w of O.ways) { if (own.has(w.id) || !isCar(w.tags) || w.nds.length < 2) continue;
    for (const end of [0, 1]) { const nj = end ? w.nds[w.nds.length - 1] : w.nds[0], mid = w.nds.findIndex((q, k) => k > 0 && k < w.nds.length - 1 && nodeAt.has(q));
      const jn = nodeAt.has(nj) ? nj : (end === 0 && mid > 0 ? w.nds[mid] : null); if (!jn) continue;
      const k = w.nds.indexOf(jn), seqs = []; if (k < w.nds.length - 1) seqs.push(w.nds.slice(k)); if (k > 0) seqs.push(w.nds.slice(0, k + 1).reverse());
      for (const seq of seqs) side.push({ w, seq }); if (mid > 0) break; } }
  const sideRoads = [], kinds = { residential: 0, unclassified: 0, tertiary: 0, secondary: 0, primary: 0, living_street: 0, road: 0, service: 1, track: 2 };
  for (const { w, seq } of side) {
    const p = polyXZ(seq); if (p.length < 2) continue; const L0 = lineLen(p), kind0 = kinds[w.tags.highway] != null ? kinds[w.tags.highway] : 1;
    if (L0 < 45 || (kind0 === 1 && L0 < 80) || /driveway|parking_aisle|drive-through|alley|emergency_access/.test(w.tags.service || '')) continue;   // (the side roads that matter: no driveways, no stubs too short to drive into)
    const j = near(p[0][0], p[0][1], 40); if (j.i < 0 || j.d > 6) continue; const i = j.i, s = mS(i);
    if ((iS - i) * ds > 55 || (i - iF) * ds > 200 || (n - 1 - i) * ds < 30 || Math.abs(i - iS) * ds < 30 || Math.abs(i - iF) * ds < 30 || cps.some(c => Math.abs(i - c) * ds < 25)) continue;   // (within the race, as tests/junctions.test.js wants; clear of the gantries)
    if (bd.some(b => Math.abs(b.s - (i0 + i) * ds) < 40)) continue;
    const q = resample(p, 3); let e = Math.min(q.length - 1, 5); const dx = q[e][0] - q[0][0], dz = q[e][1] - q[0][1], dl = Math.hypot(dx, dz) || 1;
    const a = Math.max(0, i - 2), b = Math.min(n - 1, i + 2), tx = S[b][0] - S[a][0], tz = S[b][1] - S[a][1], tl = Math.hypot(tx, tz) || 1, ux = tx / tl, uz = tz / tl;
    const sd = Math.sign(dx * -uz + dz * ux) || 1, cosA = (dx * ux + dz * uz) / dl; let ang = Math.acos(Math.max(-1, Math.min(1, cosA))) * 180 / Math.PI;
    // very shallow ones bent out to ~28 degrees at the junction (their first 15 m)
    if (Math.min(ang, 180 - ang) < 28) { const tgt = (ang < 90 ? 28 : 152) * Math.PI / 180, vx = ux * Math.cos(tgt) + (-uz * sd) * Math.sin(tgt), vz = uz * Math.cos(tgt) + (ux * sd) * Math.sin(tgt);
      for (let m = 1; m < q.length && m * 3 <= 15; m++) { const f = m * 3 / 15; q[m] = [q[0][0] + vx * m * 3 * (1 - f) + (q[m][0] - q[0][0]) * f, q[0][1] + vz * m * 3 * (1 - f) + (q[m][1] - q[0][1]) * f]; } ang = tgt * 180 / Math.PI; }
    q[0] = S[i].slice();
    const kind = kind0, grav = GRAVEL.test(w.tags.surface || '') || (w.tags.highway === 'track' && !/asphalt|concrete|paved/.test(w.tags.surface || '')) ? 1 : 0;
    const L = Math.max(30, Math.min(L0 - 6, kind === 0 ? 90 : 60)), hwd = +w.tags.width ? Math.min(3.5, Math.max(2.2, +w.tags.width / 2)) : kind === 0 ? 3.0 : kind === 1 ? 2.4 : 2.2;
    const endB = bld0.some(B => q.slice(0, Math.ceil(L / 3) + 2).some(([x, z]) => Math.hypot(x - B[0], z - B[1]) < Math.max(B[2], B[3]) / 2 + 6)) && L0 < 140 ? 2 : kind === 2 ? 1 : 0;
    const hs = [], h0 = HT.h[i] - base; let hp = h0; for (let m = 0; m < q.length && m * 3 < L + 40; m++) { let h = m ? at(q[m][0], q[m][1]) - base : h0; h = Math.max(hp - 0.45, Math.min(hp + 0.45, h)); hs.push(+q[m][0].toFixed(1), +q[m][1].toFixed(1), +h.toFixed(1)); hp = h; }
    sideRoads.push([s, sd, Math.round(ang), kind, grav, Math.round(L), endB, hwd, kind === 0 ? 1.2 : 1.6, '', hs]);
  }
  sideRoads.sort((a, b) => a[0] - b[0]);
  for (let k = sideRoads.length - 1; k > 0; k--) for (let m = k - 1; m >= 0; m--) { const A = sideRoads[k], B = sideRoads[m]; if (!A || !B || A[1] !== B[1] || A[0] - B[0] > 40) continue; sideRoads[A[3] > B[3] ? k : m] = null; }
  const SR = sideRoads.filter(Boolean);
  // the buildings within 170 m ([x, z, length, width, angle, height (0: unknown), kind: 0 house or lodge, 1 big, 2 shed or garage, 3 hut]),
  // the lakes, the car parks and the viewpoints by the road
  const bld = bld0.filter(B => dRoad(B[0], B[1], 220) < 170 || zoneD(B[0], B[1]) < 40);
  const centroid = (p) => [p.reduce((a, q) => a + q[0], 0) / p.length, p.reduce((a, q) => a + q[1], 0) / p.length];
  const lakes = water.filter(p => p.length > 3 && dRoad(...centroid(p), 500) < 320).map(p => [Math.round(polyArea(p)), ...p.slice(0, -1).flatMap(q => [+q[0].toFixed(1), +q[1].toFixed(1)])]);
  const pulls = areasOf(O, t => t.amenity === 'parking').map(polyXZ).filter(p => p.length > 3).map(p => { const [x, z] = centroid(p); return [+x.toFixed(1), +z.toFixed(1), Math.round(Math.sqrt(polyArea(p) / Math.PI)), Math.round(dRoad(x, z, 160))]; }).filter(p => p[3] < 110);
  const vistas = []; for (const [, nd] of O.nodes) if (nd.tags.tourism === 'viewpoint') { const [x, z] = G.xz(nd.lat, nd.lon), d = dRoad(x, z, 200); if (d < 150) vistas.push([+x.toFixed(1), +z.toFixed(1), Math.round(d)]); }
  const trees = []; for (const [, nd] of O.nodes) if (nd.tags.natural === 'tree') { const [x, z] = G.xz(nd.lat, nd.lon); if (dRoad(x, z, 100) < 80) trees.push(+x.toFixed(1), +z.toFixed(1)); }
  // the bends of the race (over 70 degrees within 80 m): metres after the start line, altitude, side, size; a hairpin is over 140 (the plan)
  const bRace = bends(S, ds, 80, 70).map(b => [+(b.s - iS * ds).toFixed(1), Math.round(HT.h[Math.round(b.s / ds)]), b.dir, Math.abs(b.deg)]).filter(b => b[0] > -40 && b[0] < (iF - iS) * ds + 40);
  // points every 5 m, heights every 5 m in decimetres above the start line
  const P5 = resample(S, 5).map(([x, z]) => [+x.toFixed(2), +z.toFixed(2)]), nH = P5.length, H5 = [];
  for (let k = 0; k < nH; k++) { const f = k / (nH - 1) * (n - 1), i = Math.min(n - 2, Math.floor(f)), u = f - i; H5.push(Math.round(((HT.h[i] * (1 - u) + HT.h[i + 1] * u) - base) * 10)); }
  const data = {
    realKm: +(((iF - iS) * ds) / 1000).toFixed(2), alt: [Math.round(HT.h[iS]), Math.round(HT.h[iF])], start: [0, 0], finish: S[iF].map(v => +v.toFixed(1)), cps: cps.map(i => S[i].map(v => +v.toFixed(1))), origin: [+llS[0].toFixed(6), +llS[1].toFixed(6)],
    bends: bRace, elevSmooth: 12, elevDm: H5, surf, widths,
    dem: { x0, z0, nx: dnx, nz: dnz, cell, base: +base.toFixed(2), tr: ED.tr, rows: ED.rows, res: ED.res },
    lc: { x0, z0, nx: lnx, nz: lnz, cell: lcell, rle: rleLC(lc) },
    zones, lifts, bld, lakes, pulls, vistas, trees, sideRoads: SR, points: P5,
  };
  let gmax = 0; for (let i = iS; i < iF; i++) gmax = Math.max(gmax, Math.abs(HT.h[i + 1] - HT.h[i]) / ds);
  console.log(`zapis: dirka ${data.realKm} km, ${data.alt[0]} -> ${data.alt[1]} m (najstrmeje ${(gmax * 100).toFixed(1)} %), ovinkov ${bRace.length} (serpentin ${bRace.filter(b => b[3] > 140).length}), ` +
    `makadam ${surf.map(s => s[0] + '-' + s[1]).join(', ') || '-'}, stranskih cest ${SR.length}, žičnic ${lifts.length}, stavb ${bld.length}, jezer ${lakes.length}, parkirišč ${pulls.length}, dreves ${trees.length / 2}; ` +
    `teren ${dnx}x${dnz} (ostanki do ${ED.worst} m${ED.clip ? ', odrezanih ' + ED.clip : ''}), raba tal ${lnx}x${lnz} [${[...new Set(lc)].sort().join(',')}]`);
  if (o.pregled) return;
  const jf = path.join(DATA, 'uvoz', id + '.json'); fs.mkdirSync(path.dirname(jf), { recursive: true }); fs.writeFileSync(jf, JSON.stringify(data));
  console.log('zapisano: ' + path.relative(REPO, jf));
  const tf = path.join(REPO, 'js', 'tracks', id + '.js');
  if (fs.existsSync(tf)) writeTrack(tf, data); else console.log('(js/tracks/' + id + '.js še ni: naredi ga tools/nova-proga.mjs ' + id + ')');

  // the OSM buildings (any distance; the ones near the road picked above)
  function bldAll() {
    const out = [];
    for (const nds of areasOf(O, t => t.building != null && t.building !== 'no')) { const p = polyXZ(nds).slice(0, -1); if (p.length < 3) continue; const r = minRect(p), A = polyArea(p);
      const w = O.ways.find(q => q.nds === nds), t = w ? w.tags : {}, bt = t.building || 'yes', hgt = +String(t.height || '').split(' ')[0] || (+t['building:levels'] ? +t['building:levels'] * 3 + 1 : 0);
      const kind = /^(shed|garage|garages|hut|cabin|roof|carport|service|kiosk)$/.test(bt) ? (A < 40 ? 3 : 2) : A > 900 || /^(commercial|retail|hotel|industrial|warehouse|apartments|public|train_station|transportation)$/.test(bt) ? 1 : A < 25 ? 3 : 0;
      out.push([+r[0].toFixed(1), +r[1].toFixed(1), +r[2].toFixed(1), +r[3].toFixed(1), +r[4].toFixed(3), Math.round(hgt), kind]); }
    return out;
  }
}

// the generated fields into js/tracks/<id>.js, between the two marker lines (the rest of the file written by hand or by tools/nova-proga.mjs)
function writeTrack(f, d) {
  const src = fs.readFileSync(f, 'utf8'), A = '    // ---- uvoz: začetek', B = '    // ---- uvoz: konec';
  const a = src.indexOf(A), b = src.indexOf(B); if (a < 0 || b < a) throw new Error(f + ': ni vrstic z oznakama "' + A.trim() + '" … "' + B.trim() + '"');
  const J = (v) => JSON.stringify(v);
  const lines = [
    A + ' (tools/proga-uvoz.mjs: ne urejaj ročno; izhodišče ' + d.origin.join(', ') + ')',
    `    realKm: ${d.realKm}, alt: ${J(d.alt)},`,
    `    start: ${J(d.start)}, finish: ${J(d.finish)}, cps: ${J(d.cps)},`,
    `    elevSmooth: ${d.elevSmooth}, elev: ((H) => H.map((h, i) => [i / (H.length - 1), h / 10]))(${J(d.elevDm)}),`,
    `    bends: ${J(d.bends)},`,
    ...(d.surf.length ? [`    surf: ${J(d.surf)},`] : []), ...(d.widths.length ? [`    widths: ${J(d.widths)},`] : []),
    `    dem: ${J(d.dem)},`,
    `    lc: ${J(d.lc)},`,
    `    zones: ${J(d.zones)}, lifts: ${J(d.lifts)},`,
    `    bld: ${J(d.bld)},`,
    `    lakes: ${J(d.lakes)}, pulls: ${J(d.pulls)}, vistas: ${J(d.vistas)}, trees: ${J(d.trees)},`,
    ...(d.sideRoads.length ? [`    sideRoads: ${J(d.sideRoads)},`] : []),
    `    points: ${J(d.points)},`,
  ];
  fs.writeFileSync(f, src.slice(0, a) + lines.join('\n') + '\n' + src.slice(b));
  console.log('zapisano v ' + path.relative(REPO, f));
}

if (process.argv[1] && path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url)) main().catch(e => { console.error(e.stack || e.message); process.exit(1); });

export { parseArgs, osmParse, osmLoad, geo, mosaic, copUrl, wcUrl, chainByKey, extendChain, ringsOf, areasOf, resample, smoothLine, openHairpins, lineCheck, bends, lineLen, roadHeights, rleLC, encDem, inPoly, polyArea, segDist, minRect, REPO };
