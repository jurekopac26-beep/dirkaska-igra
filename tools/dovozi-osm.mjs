// Dovozi in poti do hiš ob progi iz OpenStreetMap (docs/realizem/paket-s.md, »Dovozi in poti iz OSM«): pot do hiše samo tam, kjer je
// v resnici; kjer je OSM nima, je ni. Orodje izpiše vrstice za def.yard proge (js/tracks/<id>.js; riše jih World yardWorld, samo videz):
//   [0, x, z, x, z, …]  dovoz (highway=service)        [1, x, z, x, z, …]  pot (highway=footway, path, steps, pedestrian)
// Zaženi:
//   node tools/dovozi-osm.mjs spa --osm <mapa>     kosi OSM v <mapa> (kar manjka, prenese z glavnega API-ja; CLAUDE.md: nikoli Google)
//   … --json f.json                                poročilo: lega, pari tlorisov, vse poti z razlogom, ograje (barrier=*) ob hišah
//   … --do 6                                       koliko metrov od tlorisa hiše se pot še šteje za njeno (privzeto 6)
// Pot do hiše je (in samo to se nariše): dovoz (service=driveway), ki pride do hiše, in pot ali servisna cesta, ki se pri hiši slepo
// konča. Cesta, ki gre samo mimo hiš ali veže dve drugi cesti, in parkirišče (service=parking_aisle) nista poti do hiše: sta v
// poročilu, riše ju paket E (docs/realizem/paket-e.md: stranske ceste s križišči). Ograje ob hišah (barrier=*) so samo v poročilu.
// Samo prave proge iz GEO (js/geo.js: lega sveta proge na Zemlji, narejena za globus, zato le na nekaj deset metrov). Točno lego orodje
// določi po tlorisih hiš (def.bld proti building=* iz OSM: premik in zasuk, za katera glasuje največ tlorisov, nato najmanjši kvadrati);
// če se tlorisi ne ujemajo na ~1 m, ne izpiše ničesar.
// Pot se obreže na pas ob cesti, ki ga kamera vidi (do 64 m za ograjo proge, kot hiše), in ostane zunaj ograj proge; kar že riše
// vrstica def.yard, se ne podvoji. Podatki OSM so pod ODbL 1.0 (zasluge v README.md).
import { serve, launch, openGame, startTrack } from '../tests/browser/lib.mjs';
import { osmParse, geo, minRect } from './proga-uvoz.mjs';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2), opt = (k) => { const i = argv.indexOf(k); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const osmDir = opt('--osm'), jsonOut = opt('--json'), REACH = +(opt('--do') || 6), id = argv[0];
if (!id || !osmDir) { console.log('raba: node tools/dovozi-osm.mjs <proga> --osm <mapa> [--json f.json] [--do 6]'); process.exit(1); }
const UA = 'track-data-tool/1.0 (one-off map extract)';   // (a generic name: nothing of the project or its people goes to the map's server)
const KIND = { service: 0, footway: 1, path: 1, steps: 1, pedestrian: 1 };   // (the row's kind: 0 a 4 m ribbon, 1 a 2 m one)
const HALF = [2.0, 1.0], BAND = 64, GAP = 1.0, MINLEN = 4;                    // (yardWorld's half widths; the band; clear of the barrier; the shortest piece)
const JOIN = 5, TAPER = 8, STRAIGHT = 3;                                      // (a drawn way's end this near is the same way going on: the new row bends to it and ends on its line)

const srv = await serve(), browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0 }, { width: 480, height: 270 });
  await startTrack(page, id);
  const tr = await page.evaluate((id) => { const Tr = window.__game.race.track, def = Tr.def, G = window.GEO && GEO.tracks[id], pts = [];
    for (let i = 0; i < Tr.px.length; i += 4) pts.push([Tr.px[i], Tr.pz[i]]);
    return { G: G || null, bld: def.bld || [], yard: def.houseWays >= 0 ? (def.yard || []).slice(0, def.houseWays) : def.yard || [], pts,   // (the yard without this tool's own rows)
      frozen: !!(def.test || def.pending), len: Tr.len, n: Tr.px.length }; }, id);
  if (tr.frozen) throw new Error(id + ': testna proga ali proga na odločanju (zamrznjena)');
  if (!tr.G || tr.G.kind !== 'real') throw new Error(id + ': proge ni v GEO v pravem merilu (js/geo.js)');
  // the world's ground under a list of points: [the nearest sample of the road (-1 beyond the band), metres beyond the barrier, metres from the start]
  const probe = (P) => page.evaluate((P) => { const A = World.api, Tr = window.__game.race.track;
    return P.map(([x, z]) => { const n = A.nrNear(x, z), i = n.i, dd = n.dd; return [i, +dd.toFixed(2), Math.round(Tr.nearestIdx(x, z) * Tr.len / Tr.px.length)]; }); }, P);

  // ---- the frame: the world's metres <-> degrees (GEO: the origin and the turn, x east, z south) ----
  const g = geo(tr.G.lat0, tr.G.lon0), r0 = tr.G.rot * Math.PI / 180, c0 = Math.cos(r0), s0 = Math.sin(r0);
  const toXZ = (lat, lon) => { const [e, s] = g.xz(lat, lon); return [e * c0 - s * s0, e * s0 + s * c0]; };
  const toLL = (x, z) => g.ll(x * c0 + z * s0, -x * s0 + z * c0);

  // ---- the tiles: 0.01° squares the road passes, and their neighbours within 150 m ----
  const T = 0.01, tiles = new Set(), dLat = 150 / 111000, dLon = 150 / (111000 * Math.cos(tr.G.lat0 * Math.PI / 180));
  for (const p of tr.pts) { const [la, lo] = toLL(p[0], p[1]); for (const a of [-dLat, 0, dLat]) for (const b of [-dLon, 0, dLon]) tiles.add(Math.floor((la + a) / T) + ',' + Math.floor((lo + b) / T)); }
  fs.mkdirSync(osmDir, { recursive: true });
  const nodes = new Map(), ways = new Map(); let fetched = 0;
  const get = async (w, s, e, n, depth) => {   // (one bbox, kept as a file; too many nodes in it (400): its four quarters)
    const bbox = [w, s, e, n].map(v => v.toFixed(5)).join(','), file = path.join(osmDir, bbox.replace(/,/g, '_') + '.osm');
    if (fs.existsSync(file)) return [fs.readFileSync(file, 'utf8')];
    const quarters = async () => { const mx = (w + e) / 2, my = (s + n) / 2, o = []; for (const q of [[w, s, mx, my], [mx, s, e, my], [w, my, mx, n], [mx, my, e, n]]) o.push(...await get(...q, depth + 1)); return o; };
    if (fs.existsSync(file + '.4')) return quarters();
    for (let k = 0; k < 4; k++) {
      try { const res = await fetch('https://api.openstreetmap.org/api/0.6/map?bbox=' + bbox, { headers: { 'User-Agent': UA } }); fetched++;
        if (res.ok) { const xml = await res.text(); if (!/<osm\b/.test(xml.slice(0, 400))) throw new Error('ni izvleček OSM'); fs.writeFileSync(file, xml); await new Promise(r => setTimeout(r, 1000)); return [xml]; }
        if (res.status === 400 && depth < 3) { fs.writeFileSync(file + '.4', ''); return quarters(); }
        console.log('  ' + bbox + ': ' + res.status); }
      catch (err) { console.log('  ' + bbox + ': ' + err.message); }
      await new Promise(r => setTimeout(r, 2000 * (k + 1)));
    }
    throw new Error('OSM: kos ' + bbox + ' ni prenesen');
  };
  for (const t of [...tiles].sort()) { const [iy, ix] = t.split(',').map(Number);
    for (const xml of await get(ix * T, iy * T, (ix + 1) * T, (iy + 1) * T, 0)) { const o = osmParse(xml); for (const [k, v] of o.nodes) nodes.set(k, v); for (const w of o.ways) ways.set(w.id, w); } }
  console.log(`${id}: ${tiles.size} kosov OSM po ${T}° (${fetched} prenesenih), ${nodes.size} točk, ${ways.size} poti`);

  // ---- the frame set on the houses' footprints: def.bld against building=* (GEO's frame is made for the globe: tens of metres and
  // a part of a degree off). First the turn and the shift most footprints agree on, then a rigid fit by least squares. ----
  const line = (w, f) => { const P = []; for (const r of w.nds) { const n = nodes.get(r); if (n) P.push(f(n.lat, n.lon)); } return P; };
  const closed = (w) => w.nds.length > 3 && w.nds[0] === w.nds[w.nds.length - 1];
  const bWays = [...ways.values()].filter(w => w.tags.building && closed(w));
  const rects0 = bWays.map(w => minRect(line(w, toXZ).slice(0, -1)));
  const own = tr.bld.map((b, i) => ({ i, b })).filter(o => o.b[6] <= 1);
  const pair = (f, lim) => { const out = [];   // each of the track's footprints with the map's nearest of a like size
    for (const o of own) { let best = -1, bd = lim; for (let k = 0; k < rects0.length; k++) { const q = f(rects0[k]), d = Math.hypot(q[0] - o.b[0], q[1] - o.b[1]), ar = rects0[k][2] * rects0[k][3] / (o.b[2] * o.b[3]);
      if (d < bd && ar > 0.6 && ar < 1.6) { bd = d; best = k; } } if (best >= 0) out.push([o.i, best, bd]); } return out; };
  let fit = { c: 1, s: 0, tx: 0, tz: 0 };
  const ap = (p) => [p[0] * fit.c - p[1] * fit.s + fit.tx, p[0] * fit.s + p[1] * fit.c + fit.tz];
  const med = (a) => { const b = [...a].sort((x, y) => x - y); return b.length ? b[b.length >> 1] : NaN; };
  const before = pair(ap, 15);
  { let top = 0; for (let rot = -3; rot < 3.01; rot += 0.25) { const r = rot * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), bins = new Map();   // (votes of every pair, in 3 m bins)
      for (const o of own) for (const q of rects0) { const dx = o.b[0] - (q[0] * c - q[1] * s), dz = o.b[1] - (q[0] * s + q[1] * c); if (Math.abs(dx) > 150 || Math.abs(dz) > 150) continue;
        const k = Math.round(dx / 3) + ',' + Math.round(dz / 3); bins.set(k, (bins.get(k) || 0) + 1); }
      for (const [k, v] of bins) if (v > top) { top = v; const [ix, iz] = k.split(',').map(Number); fit = { c, s, tx: ix * 3, tz: iz * 3 }; } } }
  for (let pass = 0, lim = 6; pass < 4; pass++, lim = 3) { const pr = pair(ap, lim); if (pr.length < 8) break;
    let px = 0, pz = 0, qx = 0, qz = 0; for (const [i, k] of pr) { px += rects0[k][0]; pz += rects0[k][1]; qx += tr.bld[i][0]; qz += tr.bld[i][1]; }
    px /= pr.length; pz /= pr.length; qx /= pr.length; qz /= pr.length; let a = 0, b = 0;
    for (const [i, k] of pr) { const ux = rects0[k][0] - px, uz = rects0[k][1] - pz, vx = tr.bld[i][0] - qx, vz = tr.bld[i][1] - qz; a += ux * vx + uz * vz; b += ux * vz - uz * vx; }
    const th = Math.atan2(b, a), c = Math.cos(th), s = Math.sin(th); fit = { c, s, tx: qx - (px * c - pz * s), tz: qz - (px * s + pz * c) }; }
  const pairs = pair(ap, 3), res1 = med(pairs.map(p => p[2])), p90 = [...pairs.map(p => p[2])].sort((x, y) => x - y)[Math.floor(pairs.length * 0.9)];
  console.log(`lega: ${own.length} tlorisov proge, ${bWays.length} stavb OSM; pari po GEO ${before.length}, po prileganju ${pairs.length}, odmik središč (mediana) ${res1.toFixed(2)} m (90 %: ${p90 ? p90.toFixed(2) : '?'} m); popravek GEO ${fit.tx.toFixed(2)}, ${fit.tz.toFixed(2)} m, zasuk ${(Math.atan2(fit.s, fit.c) * 180 / Math.PI).toFixed(3)}°`);
  if (!(pairs.length >= 8 && res1 < 1.2)) throw new Error('tlorisi proge se ne ujemajo z OSM: lega ni zanesljiva, vrstic ni');
  const XZ = (lat, lon) => ap(toXZ(lat, lon));

  // ---- the houses (kind 0) and what may not be drawn over (every footprint) ----
  const rectD = (b, x, z) => { const c = Math.cos(b[4]), s = Math.sin(b[4]), lx = (x - b[0]) * c + (z - b[1]) * s, lz = -(x - b[0]) * s + (z - b[1]) * c;
    return Math.hypot(Math.max(0, Math.abs(lx) - b[2] / 2), Math.max(0, Math.abs(lz) - b[3] / 2)); };
  const houses = tr.bld.map((b, i) => ({ i, b })).filter(o => o.b[6] === 0);
  const dense = (P, ds) => { const out = []; for (let i = 0; i + 1 < P.length; i++) { const d = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]), n = Math.max(1, Math.ceil(d / ds));
    for (let k = 0; k < n; k++) out.push([P[i][0] + (P[i + 1][0] - P[i][0]) * k / n, P[i][1] + (P[i + 1][1] - P[i][1]) * k / n]); } if (P.length) out.push(P[P.length - 1]); return out; };
  const segD = (p, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz, t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / l2)) : 0; return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t); };
  const drawn = (tr.yard || []).filter(r => r[0] <= 1).map(r => { const P = []; for (let k = 1; k + 1 < r.length; k += 2) P.push([r[k], r[k + 1]]); return { P, hw: HALF[r[0]] }; });
  const onDrawn = (p) => drawn.findIndex(d => { for (let k = 0; k + 1 < d.P.length; k++) if (segD(p, d.P[k], d.P[k + 1]) < d.hw) return true; return false; });   // (the drawn way this point lies on, or -1)
  // a piece of a way between the parts the yard draws already (run[i..j]; mask: the drawn way under each point): where it runs into a drawn way's end,
  // its last metres bend to that end and the very last lie on the drawn way's own line (the same way going on: the two ribbons end in one cut, no notch
  // and nothing twice); where it meets a drawn way's side, it goes one point into its ribbon
  const join = (run, mask, i, j) => { const Q = run.slice(i, j + 1).map(p => [p[0], p[1]]);
    const end = (tail, q) => { const d = drawn[mask[q]], m = d.P.length - 1, E = [[d.P[0], d.P[1]], [d.P[m], d.P[m - 1]]].map(e => [Math.hypot(e[0][0] - run[q][0], e[0][1] - run[q][1]), e[0], e[1]]).sort((x, y) => x[0] - y[0])[0];
      if (E[0] > JOIN) { if (tail) Q.push(run[q]); else Q.unshift(run[q]); return; }
      const at = (t) => Q[tail ? Q.length - 1 - t : t], ul = Math.hypot(E[1][0] - E[2][0], E[1][1] - E[2][1]) || 1, ux = (E[1][0] - E[2][0]) / ul, uz = (E[1][1] - E[2][1]) / ul;
      const s = Math.min(STRAIGHT, Math.floor((Q.length - 1) / 3)), n = Math.max(0, Math.min(TAPER, Math.floor((Q.length - 1) / 2) - s)), dx = E[1][0] + ux * s - at(s)[0], dz = E[1][1] + uz * s - at(s)[1];
      for (let t = s + 1; t <= s + n; t++) { const p = at(t), f = 1 - (t - s) / (n + 1); p[0] += dx * f; p[1] += dz * f; }
      for (let t = 0; t <= s; t++) { const p = at(t); p[0] = E[1][0] + ux * t; p[1] = E[1][1] + uz * t; }
      (Q.keep = Q.keep || []).push(tail ? Q.length - 1 - s : s); };
    if (i > 0 && mask[i - 1] >= 0) end(0, i - 1);
    if (j + 1 < run.length && mask[j + 1] >= 0) end(1, j + 1);
    return Q; };
  const simplify = (P, tol) => { if (P.length < 3) return P; let k = -1, m = tol; for (let i = 1; i + 1 < P.length; i++) { const d = segD(P[i], P[0], P[P.length - 1]); if (d > m) { m = d; k = i; } }
    return k < 0 ? [P[0], P[P.length - 1]] : simplify(P.slice(0, k + 1), tol).slice(0, -1).concat(simplify(P.slice(k), tol)); };
  const simplifyK = (Q, tol) => { const K = [...new Set([0, ...(Q.keep || []), Q.length - 1])].sort((x, y) => x - y), out = [];   // (the points join() pinned stay)
    for (let k = 0; k + 1 < K.length; k++) { const S = simplify(Q.slice(K[k], K[k + 1] + 1), tol); out.push(...(k ? S.slice(1) : S)); } return out; };

  // ---- the ways: a house's own ones (a driveway, a way that ends at the house); cut to the band, clear of the road's barriers and of the footprints ----
  const cand = [...ways.values()].filter(w => KIND[w.tags.highway] != null && !closedArea(w) && !w.tags.tunnel && w.tags.covered !== 'yes' && w.tags.indoor !== 'yes' && !(+w.tags.layer < 0));
  function closedArea(w) { return w.tags.area === 'yes'; }
  // (how a road or a path touches a node: its end once, a node inside it twice; 1 is a dead end)
  const inc = new Map(), at = new Map();
  for (const w of ways.values()) { if (!w.tags.highway) continue; const n = w.nds.length; w.nds.forEach((r, k) => { inc.set(r, (inc.get(r) || 0) + (k === 0 || k === n - 1 ? 1 : 2)); if (!at.has(r)) at.set(r, []); at.get(r).push(w); }); }
  const endOf = (w, last) => { const r = w.nds[last ? w.nds.length - 1 : 0], n = nodes.get(r); if (!n) return null; const p = XZ(n.lat, n.lon); let hi = -1, hd = Infinity;
    for (const h of houses) { const d = rectD(h.b, p[0], p[1]); if (d < hd) { hd = d; hi = h.i; } }
    return { dead: inc.get(r) === 1, house: hi, d: +hd.toFixed(1), joins: (at.get(r) || []).filter(o => o !== w).map(o => o.tags.highway + (o.tags.service ? '/' + o.tags.service : '')) }; };
  const rows = [], report = [];
  for (const w of cand) {
    const P = dense(line(w, XZ), 1); if (P.length < 2) continue;
    let hi = -1, hd = REACH; for (const p of P) for (const h of houses) { if (Math.abs(p[0] - h.b[0]) > 60 || Math.abs(p[1] - h.b[1]) > 60) continue; const d = rectD(h.b, p[0], p[1]); if (d < hd) { hd = d; hi = h.i; } }
    if (hi < 0) continue;
    const ends = [endOf(w, 0), endOf(w, 1)];
    // (the house's own way: a driveway, or a way with a dead end at the house; a car park's aisle and a road that only passes are not)
    const de = ends.filter(e => e && e.dead && e.d <= REACH).sort((p, q) => p.d - q.d)[0];
    const own = w.tags.service === 'parking_aisle' ? 'parkirišče' : de || w.tags.service === 'driveway' ? '' : 'gre mimo';
    if (de) { hi = de.house; hd = de.d; }
    const kind = KIND[w.tags.highway], pr = await probe(P), ok = P.map((p, k) => pr[k][0] >= 0 && pr[k][1] <= BAND && pr[k][1] >= HALF[kind] + GAP && !tr.bld.some(b => rectD(b, p[0], p[1]) === 0));
    const rec = { way: w.id, highway: w.tags.highway, service: w.tags.service || '', surface: w.tags.surface || '', access: w.tags.access || '', house: hi, toHouse: +hd.toFixed(1), len: P.length - 1, s: pr[0][2], ends, own, pieces: [] };
    for (let a = 0; a < P.length; a++) { if (!ok[a]) continue; let b = a; while (b + 1 < P.length && ok[b + 1]) b++;
      const run = P.slice(a, b + 1), L = b - a, near = run.some(p => rectD(tr.bld[hi], p[0], p[1]) < REACH), mask = run.map(onDrawn);
      const piece = { from: a, len: L, s: pr[a][2], dd: [Math.min(...pr.slice(a, b + 1).map(q => q[1])), Math.max(...pr.slice(a, b + 1).map(q => q[1]))], why: own || L < MINLEN ? own || 'prekratek' : !near ? 'ne pride do hiše' : '' };
      if (!piece.why) { let n = 0;   // (what the yard draws already is not drawn twice: only the parts between)
        for (let i = 0; i < run.length; i++) { if (mask[i] >= 0) continue; let j = i; while (j + 1 < run.length && mask[j + 1] < 0) j++;
          if (j - i >= MINLEN) { const Q = simplifyK(join(run, mask, i, j), 0.2), row = [kind]; for (const p of Q) row.push(+p[0].toFixed(1), +p[1].toFixed(1)); rows.push({ row, rec, s: pr[a + i][2], L: j - i, cut: j - i < L }); n += j - i; }
          i = j; }
        if (!n) piece.why = 'že narisan (def.yard)'; else if (n < L) piece.drawn = L - n; }
      rec.pieces.push(piece);
      a = b; }
    report.push(rec);
  }
  rows.sort((p, q) => p.s - q.s);
  const inBand = (L) => L.reduce((s, r) => s + r.pieces.filter(p => p.len >= MINLEN).reduce((a, p) => a + p.len, 0), 0), left = (t) => { const L = report.filter(r => r.own === t); return `${L.length} (${inBand(L)} m v pasu)`; };
  console.log(`poti ob hišah (do ${REACH} m od tlorisa): ${report.length} od ${cand.length}; do hiše vodi ${report.filter(r => !r.own).length}; vrstic ${rows.length}`);
  console.log(`  niso poti do hiše (paket E): ceste in povezave mimo hiš ${left('gre mimo')}, parkirišča ${left('parkirišče')}`);
  for (const r of rows) console.log(`  ${String(r.s).padStart(5)} m  hiša ${String(r.rec.house).padStart(3)}  ${r.rec.highway}${r.rec.service ? '/' + r.rec.service : ''}${r.rec.surface ? ' (' + r.rec.surface + ')' : ''}  ${r.L} m${r.cut ? ' (ostalo riše že def.yard)' : ''}  →  vrsta ${r.row[0]}`);
  console.log('\nvrstice za def.yard (na konec seznama; def.houseWays je indeks prve):');
  console.log(rows.map(r => JSON.stringify(r.row)).join(','));

  // ---- fences and walls by the houses (barrier=*), for the report only ----
  const barriers = [...ways.values()].filter(w => w.tags.barrier).map(w => { const P = dense(line(w, XZ), 2); let hd = 12, hi = -1; for (const p of P) for (const h of houses) { const d = rectD(h.b, p[0], p[1]); if (d < hd) { hd = d; hi = h.i; } } return hi < 0 ? null : { way: w.id, barrier: w.tags.barrier, house: hi, len: (P.length - 1) * 2 }; }).filter(Boolean);
  console.log(`\nograje ob hišah (barrier=*, do 12 m od tlorisa): ${barriers.length}` + (barriers.length ? ' — ' + barriers.map(b => `${b.barrier} pri hiši ${b.house} (${b.len} m)`).join(', ') : ''));
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ id, fit, pairs, rects: rects0.map(r => { const q = ap(r); return [+q[0].toFixed(2), +q[1].toFixed(2), +r[2].toFixed(2), +r[3].toFixed(2), +(r[4] + Math.atan2(fit.s, fit.c)).toFixed(3)]; }), tags: bWays.map(w => w.tags), report, rows: rows.map(r => r.row), barriers }, null, 1));
  if (errors.length) console.log('NAPAKE V STRANI:\n' + errors.slice(0, 5).join('\n'));
} finally { await browser.close(); await srv.close(); }
