// Dovozi in poti do hiš ob progi iz OpenStreetMap (docs/realizem/paket-s.md, »Dovozi in poti iz OSM«): pot do hiše samo tam, kjer je
// v resnici; kjer je OSM nima, je ni. Orodje izpiše vrstice za def.yard proge (js/tracks/<id>.js; riše jih World yardWorld, samo videz):
//   [0, x, z, x, z, …]  dovoz (highway=service)        [1, x, z, x, z, …]  pot (highway=footway, path, steps, pedestrian; samo z
//                                                  asfaltom po OSM, surface=asphalt …, sicer je makadamska in gre v def.okolica.osm)
// Zaženi:
//   node tools/dovozi-osm.mjs spa --osm <mapa>     kosi OSM v <mapa> (kar manjka, prenese z glavnega API-ja; CLAUDE.md: nikoli Google)
//   … --json f.json                                poročilo: lega, pari tlorisov, vse poti z razlogom, ograje (barrier=*) ob hišah
//   … --do 6                                       koliko metrov od tlorisa hiše se pot še šteje za njeno (privzeto 6)
//   … --okolica f.json                             okolica hiš (docs/realizem/paket-s.md, »Okolica hiš«): asfaltne poti ob hišah (samo
//                                                  odseki do 30 m od hiš, vrstice def.yard), pešpoti, makadam
//                                                  (vsaka pot pelje do hiše, poti, ceste ali iz pasu) in parkirišča iz OSM (def.okolica.osm) ter
//                                                  skromna splošna dopolnitev, kjer OSM ob hiši nima ničesar (def.okolica.gen: dvorišče,
//                                                  kratek dovoz do najbližje ceste, nikoli čez progo, in pas uhojenih tal ob hiši)
// Pot do hiše je (in samo to se nariše): dovoz (service=driveway), ki pride do hiše, in pot ali servisna cesta, ki se pri hiši slepo
// konča. Cesta, ki gre samo mimo hiš ali veže dve drugi cesti, in parkirišče (service=parking_aisle) nista poti do hiše: sta v
// poročilu, riše ju paket E (docs/realizem/paket-e.md: stranske ceste s križišči). Ograje ob hišah (barrier=*) so samo v poročilu.
// Samo prave proge iz GEO (js/geo.js: lega sveta proge na Zemlji, narejena za globus, zato le na nekaj deset metrov). Točno lego orodje
// določi po tlorisih hiš (def.bld proti building=* iz OSM: premik in zasuk, za katera glasuje največ tlorisov, nato najmanjši kvadrati);
// če se tlorisi ne ujemajo na ~1 m, ne izpiše ničesar.
// Pot se obreže na pas ob cesti, ki ga kamera vidi (do 64 m za ograjo proge, kot hiše), in ostane zunaj ograj proge; kar že riše
// vrstica def.yard, se ne podvoji. OSM da pot samo z lomi; na tleh je lom zavoj, zato se lom, ostrejši od 10°, nariše kot lok, ki se
// dotika obeh krakov (mehak zavoj: polmer dovoza 6 m, poti 4 m; manjši, kjer je krak prekratek ali bi lok prišel do ograje proge ali
// bliže tlorisu; konca poti ostaneta, kjer sta). Podatki OSM so pod ODbL 1.0 (zasluge v README.md).
import { serve, launch, openGame, startTrack } from '../tests/browser/lib.mjs';
import { osmParse, geo, minRect } from './proga-uvoz.mjs';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2), opt = (k) => { const i = argv.indexOf(k); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const osmDir = opt('--osm'), jsonOut = opt('--json'), REACH = +(opt('--do') || 6), OKOL = opt('--okolica'), id = argv[0];
if (!id || !osmDir) { console.log('raba: node tools/dovozi-osm.mjs <proga> --osm <mapa> [--json f.json] [--do 6]'); process.exit(1); }
const UA = 'track-data-tool/1.0 (one-off map extract)';   // (a generic name: nothing of the project or its people goes to the map's server)
const KIND = { service: 0, footway: 1, path: 1, steps: 1, pedestrian: 1 };   // (the row's kind: 0 a 4 m ribbon, 1 a 2 m one)
const PAVED = /^(asphalt|paved|concrete|concrete:plates|concrete:lanes|paving_stones|sett|cobblestone|metal|wood)$/;   // (a surface the map calls paved)
const HALF = [2.0, 1.0], BAND = 64, GAP = 1.0, MINLEN = 4;                    // (yardWorld's half widths; the band; clear of the barrier; the shortest piece)
const JOIN = 5, TAPER = 8, STRAIGHT = 3;                                      // (a drawn way's end this near is the same way going on: the new row bends to it and ends on its line)
const TURN = 10, RADIUS = [6, 4], STEP = 15;                                  // (a corner sharper than TURN degrees is drawn as an arc: its radius by the row's kind, a point every STEP degrees)

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
  const nodes = new Map(), ways = new Map(), rels = new Map(); let fetched = 0;
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
    for (const xml of await get(ix * T, iy * T, (ix + 1) * T, (iy + 1) * T, 0)) { const o = osmParse(xml); for (const [k, v] of o.nodes) nodes.set(k, v); for (const w of o.ways) ways.set(w.id, w); for (const r of o.rels) rels.set(r.id, r); } }
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
  // the map gives a way by its corners; on the ground a corner is a bend. A corner sharper than TURN becomes an arc that touches both legs: the
  // radius by the row's kind, smaller where a leg is too short for it (two arcs share a leg by their sizes), halved while the arc would leave the
  // band, come to the barrier or run closer to a footprint than the corner itself does (no smaller than 1 m: then the corner stays as the map
  // has it). The row's ends and the points join() pinned stay where they are
  const soften = async (Q, kind, pinned) => {
    const n = Q.length, t = new Array(n).fill(0), th = new Array(n).fill(0), u = [], out = [Q[0]], arcs = [];
    for (let k = 0; k + 1 < n; k++) { const dx = Q[k + 1][0] - Q[k][0], dz = Q[k + 1][1] - Q[k][1], l = Math.hypot(dx, dz) || 1; u.push([dx / l, dz / l, l]); }
    for (let k = 1; k + 1 < n; k++) { if (pinned.includes(Q[k])) continue; const a = u[k - 1], b = u[k]; th[k] = Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1]);
      if (Math.abs(th[k]) > TURN * Math.PI / 180) t[k] = RADIUS[kind] * Math.tan(Math.abs(th[k]) / 2); }
    for (let k = 0; k + 1 < n; k++) { const s = t[k] + t[k + 1]; if (s > u[k][2]) { t[k] *= u[k][2] / s; t[k + 1] *= u[k][2] / s; } }
    const arc = (k, tk) => { const a = u[k - 1], sg = Math.sign(th[k]), R = tk / Math.tan(Math.abs(th[k]) / 2), A = [Q[k][0] - a[0] * tk, Q[k][1] - a[1] * tk], C = [A[0] - a[1] * sg * R, A[1] + a[0] * sg * R];
      const N = Math.max(2, Math.ceil(Math.abs(th[k]) * 180 / Math.PI / STEP)), P = [];   // (from the point on the first leg round the centre to the point on the second)
      for (let m = 0; m <= N; m++) { const f = th[k] * m / N, c = Math.cos(f), s = Math.sin(f), vx = A[0] - C[0], vz = A[1] - C[1]; P.push([C[0] + vx * c - vz * s, C[1] + vx * s + vz * c]); }
      return { P, R }; };
    const nearB = (P, b) => Math.min(...P.map(p => rectD(b, p[0], p[1])));
    const fine = async (P, V) => { const pr = await probe(P), O = dense([P[0], V, P[P.length - 1]], 0.5);
      return P.every((p, m) => pr[m][0] >= 0 && pr[m][1] <= BAND && pr[m][1] >= HALF[kind] + GAP) && tr.bld.every(b => { const d = nearB(P, b); return d >= HALF[kind] || d >= nearB(O, b) - 0.01; }); };
    for (let k = 1; k + 1 < n; k++) { let a = null;
      for (let tk = t[k], tries = 0; tk > 0 && tries < 4 && !a; tk /= 2, tries++) { const c = arc(k, tk); if (c.R < 1) break; if (await fine(c.P, Q[k])) a = c; }
      if (a) { out.push(...a.P); arcs.push([Math.round(Math.abs(th[k]) * 180 / Math.PI), +a.R.toFixed(1)]); } else out.push(Q[k]); }
    out.push(Q[n - 1]); out.arcs = arcs; return out; };

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
          if (j - i >= MINLEN) { const J = join(run, mask, i, j), Q = await soften(simplifyK(J, 0.2), kind, (J.keep || []).map(k => J[k])), row = [kind];
            for (const p of Q) { const x = +p[0].toFixed(1), z = +p[1].toFixed(1); if (row.length < 3 || row[row.length - 2] !== x || row[row.length - 1] !== z) row.push(x, z); }   // (no point twice)
            rows.push({ row, rec, s: pr[a + i][2], L: j - i, cut: j - i < L, arcs: Q.arcs }); n += j - i; }
          i = j; }
        if (!n) piece.why = 'že narisan (def.yard)'; else if (n < L) piece.drawn = L - n; }
      rec.pieces.push(piece);
      a = b; }
    report.push(rec);
  }
  rows.sort((p, q) => p.s - q.s);
  // (a footway to a house the map gives no paved surface is gravel: def.okolica.osm as [1, 1, 1, x, z, …] with the makadam road's relief, whole as here)
  const potke = rows.filter(r => r.row[0] === 1 && !PAVED.test(r.rec.surface)), yardOut = rows.filter(r => !potke.includes(r));
  const inBand = (L) => L.reduce((s, r) => s + r.pieces.filter(p => p.len >= MINLEN).reduce((a, p) => a + p.len, 0), 0), left = (t) => { const L = report.filter(r => r.own === t); return `${L.length} (${inBand(L)} m v pasu)`; };
  console.log(`poti ob hišah (do ${REACH} m od tlorisa): ${report.length} od ${cand.length}; do hiše vodi ${report.filter(r => !r.own).length}; vrstic ${rows.length}`);
  console.log(`  niso poti do hiše (paket E): ceste in povezave mimo hiš ${left('gre mimo')}, parkirišča ${left('parkirišče')}`);
  for (const r of rows) console.log(`  ${String(r.s).padStart(5)} m  hiša ${String(r.rec.house).padStart(3)}  ${r.rec.highway}${r.rec.service ? '/' + r.rec.service : ''}${r.rec.surface ? ' (' + r.rec.surface + ')' : ''}  ${r.L} m${r.cut ? ' (ostalo riše že def.yard)' : ''}  →  vrsta ${r.row[0]}${r.arcs.length ? ', zavoji v loku: ' + r.arcs.map(q => q[0] + '° s polmerom ' + q[1] + ' m').join(', ') : ''}`);
  console.log('\nvrstice za def.yard (na konec seznama; def.houseWays je indeks prve):');
  console.log(yardOut.map(r => JSON.stringify(r.row)).join(','));

  // ---- fences and walls by the houses (barrier=*), for the report only ----
  const barriers = [...ways.values()].filter(w => w.tags.barrier).map(w => { const P = dense(line(w, XZ), 2); let hd = 12, hi = -1; for (const p of P) for (const h of houses) { const d = rectD(h.b, p[0], p[1]); if (d < hd) { hd = d; hi = h.i; } } return hi < 0 ? null : { way: w.id, barrier: w.tags.barrier, house: hi, len: (P.length - 1) * 2 }; }).filter(Boolean);
  console.log(`\nograje ob hišah (barrier=*, do 12 m od tlorisa): ${barriers.length}` + (barriers.length ? ' — ' + barriers.map(b => `${b.barrier} pri hiši ${b.house} (${b.len} m)`).join(', ') : ''));
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ id, fit, pairs, rects: rects0.map(r => { const q = ap(r); return [+q[0].toFixed(2), +q[1].toFixed(2), +r[2].toFixed(2), +r[3].toFixed(2), +(r[4] + Math.atan2(fit.s, fit.c)).toFixed(3)]; }), tags: bWays.map(w => w.tags), report, rows: yardOut.map(r => r.row), potke: potke.map(r => [1, 1, 1, ...r.row.slice(1)]), barriers }, null, 1));

  // ---- --okolica f.json: the ground round every house the road's band holds (docs/realizem/paket-s.md, »Okolica hiš«). From the map: every way
  // and car park within R m of a house (to the band and clear of the barriers, every end at something: no way ends in the grass); asphalt ways go to def.yard (after
  // the rows above), unpaved ones and the car parks to def.okolica.osm. Where the map has nothing at a house (no surface within TOUCH m), a modest
  // generic completion in def.okolica.gen: a gravel yard by the side that faces the nearest drawn surface, a short gravel driveway to it (never
  // over the road: clear of its barriers) and a narrow strip of trodden ground round the walls. Nothing else: no fences, no cars, no objects. ----
  async function okolica(out) {
    const R = 25, NEAR = 30, TOUCH = 3, inPoly = (p, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
    const corners = (b, e) => { const c = Math.cos(b[4]), s = Math.sin(b[4]), L = b[2] / 2 + (e || 0), W = b[3] / 2 + (e || 0); return [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([u, v]) => [b[0] + c * u * L - s * v * W, b[1] + s * u * L + c * v * W]); };
    const built = [];
    for (const h of houses) { const b = h.b, pts = [[b[0], b[1]], ...corners(b)];
      const pr = await probe(pts); if (pr[0][0] < 0 || pr.some(q => q[0] >= 0 && q[1] < 1.5) || b[2] * b[3] >= 1500) continue; built.push({ i: h.i, b, dd: pr[0][1], s: pr[0][2] }); }
    const nearB = (p, lim) => built.some(h => Math.abs(p[0] - h.b[0]) < lim + 40 && Math.abs(p[1] - h.b[1]) < lim + 40 && rectD(h.b, p[0], p[1]) <= lim);
    const inFoot = (p, skip) => tr.bld.some((b, i) => i !== skip && rectD(b, p[0], p[1]) === 0);
    const r1 = (v) => +v.toFixed(1), flat = (P) => P.flatMap(p => [r1(p[0]), r1(p[1])]), unflat = (r, k0) => { const P = []; for (let k = k0; k + 1 < r.length; k += 2) P.push([r[k], r[k + 1]]); return P; };
    for (const r of rows) drawn.push({ P: unflat(r.row, 1), hw: HALF[r.row[0]] });   // (the ways to the houses above are drawn: not twice)
    const KIND2 = { service: 0, footway: 1, path: 1, steps: 1, pedestrian: 1, cycleway: 1, track: 0 };
    const yardRows = [], osm = [], gen = [], why = [];
    for (const r of potke) osm.push({ row: [1, 1, 1, ...r.row.slice(1)], s: r.s, w: { id: r.rec.way, tags: { highway: r.rec.highway } } });   // (the gravel footways to the houses, above)
    // 1. the ways (asphalt ones: def.yard; gravel, earth, the tracks and a footway or path the map gives no paved surface: def.okolica.osm as a
    // gravel ribbon with the makadam road's relief, the footways at their 2 m)
    const isPaved = (w) => w.tags.highway !== 'track' && (w.tags.surface ? PAVED.test(w.tags.surface) : !KIND2[w.tags.highway]);
    const cand = [...ways.values()].filter(w => KIND2[w.tags.highway] != null && !closedArea(w) && !w.tags.tunnel && w.tags.covered !== 'yes' && w.tags.indoor !== 'yes' && !(+w.tags.layer < 0) && w.nds.every(r => nodes.has(r))).sort((p, q) => p.id - q.id);
    const nearHouse = (w) => { const P = dense(line(w, XZ), 1); return P.length >= 2 && P.some(p => nearB(p, R)); };
    // A way never ends in the grass (a path always leads somewhere): every end that touches nothing (no other way of the set, no house within
    // END m, nothing drawn, not the road, not out of the band) is cut back node by node to where it last met something, again and again (a way
    // left with nothing to meet goes). The set: every way near a house, and every unpaved way (gravel, earth, a track, a footway) that shares a
    // node with one of the set and reaches into the band, again and again (asphalt does not grow so: a service road on to the next one would run
    // on for kilometres through the woods, and the trees keep clear of every asphalt row).
    const END = 4, npt = new Map(); for (const w of cand) for (const r of w.nds) if (!npt.has(r)) { const n = nodes.get(r); npt.set(r, XZ(n.lat, n.lon)); }
    const nIds = [...npt.keys()], nPr = await probe(nIds.map(k => npt.get(k))), nq = new Map(nIds.map((k, i) => [k, nPr[i]]));
    const inBand = (r) => { const q = nq.get(r); return q[0] >= 0 && q[1] <= BAND; };
    const nearDrawn = (p) => drawn.some(d => { for (let k = 0; k + 1 < d.P.length; k++) if (segD(p, d.P[k], d.P[k + 1]) < d.hw + 2) return true; return false; });
    // (an asphalt way keeps only the nodes round its houses, each unbroken stretch whose segments come within NEAR m of one: a service road past
    // a house goes on through the woods, and its whole length, or the stretch between two far houses, would clear the trees there; the ends are
    // then cut back to the house or the road)
    const near = (w) => { const runs = []; let lo = -1;
      for (let k = 0; k + 1 < w.nds.length; k++) { const on = dense([npt.get(w.nds[k]), npt.get(w.nds[k + 1])], 1).some(p => nearB(p, NEAR));
        if (on && lo < 0) lo = k; if (!on && lo >= 0) { runs.push({ w, lo, hi: k }); lo = -1; } }
      if (lo >= 0) runs.push({ w, lo, hi: w.nds.length - 1 });
      return runs.length ? runs : [{ w, lo: 0, hi: w.nds.length - 1 }]; };
    async function network(list, grows) {
      const net = new Map(); for (const w of list) if (nearHouse(w)) { if (isPaved(w)) near(w).forEach((e, n) => net.set(w.id + ':' + n, e)); else net.set(w.id, { w, lo: 0, hi: w.nds.length - 1 }); }
      const seeds = net.size;
      for (let grew = true; grew;) { grew = false; const on = new Set(); for (const e of net.values()) for (let i = e.lo; i <= e.hi; i++) on.add(e.w.nds[i]);
        for (const w of list) if (grows(w) && !net.has(w.id) && w.nds.some(r => on.has(r)) && w.nds.some(inBand)) { net.set(w.id, { w, lo: 0, hi: w.nds.length - 1 }); grew = true; } }
      const meets = (e, k) => { const r = e.w.nds[k], q = nq.get(r), p = npt.get(r);
        if (q[0] < 0 || q[1] > BAND - 2 || q[1] < 2 + GAP + 1.5) return true;   // out of the band (out of sight) or at the road
        if (tr.bld.some(b => rectD(b, p[0], p[1]) <= END) || nearDrawn(p)) return true;   // at a house or a way drawn before
        for (const f of net.values()) for (let i = f.lo; i <= f.hi; i++) if (f.w.nds[i] === r && (f !== e || i !== k)) return true;   // at another way
        return false; };
      for (let cut = true; cut;) { cut = false;
        for (const [id, e] of net) { while (e.hi > e.lo && !meets(e, e.lo)) { e.lo++; cut = true; } while (e.hi > e.lo && !meets(e, e.hi)) { e.hi--; cut = true; }
          if (e.hi <= e.lo) { net.delete(id); cut = true; } } }
      console.log(`poti: ${seeds} ob hišah, ${net.size} po rasti in obrezovanju slepih koncev`);
      for (const e of [...net.values()].sort((p, q) => p.w.id - q.w.id || p.lo - q.lo)) await drawWay({ ...e.w, nds: e.w.nds.slice(e.lo, e.hi + 1) });
    }
    await network(cand, w => !isPaved(w));
    async function drawWay(w) {
      const hwy = w.tags.highway, P = dense(line(w, XZ), 1); if (P.length < 2) return;
      const kind = KIND2[hwy], paved = isPaved(w), hw = paved ? HALF[kind] : hwy === 'track' ? 1.5 : kind ? 1.0 : 2.0;
      const pr = await probe(P), ok = P.map((p, k) => pr[k][0] >= 0 && pr[k][1] <= BAND && pr[k][1] >= hw + GAP && !inFoot(p, -1));
      let n = 0;
      for (let a = 0; a < P.length; a++) { if (!ok[a]) continue; let b = a; while (b + 1 < P.length && ok[b + 1]) b++;
        const run = P.slice(a, b + 1), mask = run.map(onDrawn);
        for (let i = 0; i < run.length; i++) { if (mask[i] >= 0) continue; let j = i; while (j + 1 < run.length && mask[j + 1] < 0) j++;
          if (j - i >= MINLEN) { const Q = simplifyK(join(run, mask, i, j), 0.2);
            if (paved) { yardRows.push({ row: [kind, ...flat(Q)], s: pr[a + i][2], w, Q }); drawn.push({ P: Q, hw }); }
            else { osm.push({ row: [1, 1, hw, ...flat(Q)], s: pr[a + i][2], w, Q }); drawn.push({ P: Q, hw }); }
            n += j - i; }
          i = j; }
        a = b; }
      why.push([w.id, hwy + (w.tags.service ? '/' + w.tags.service : '') + (w.tags.surface ? ' ' + w.tags.surface : ''), n]);
    }
    // 2. the car parks (amenity=parking on the ground; one on grass is grass): the outline as mapped, the game cuts it to the band
    const areaWays = [...ways.values()].filter(w => closed(w)).map(w => ({ id: 'w' + w.id, tags: w.tags, P: line(w, XZ) }));
    for (const r of rels.values()) if (r.tags.type === 'multipolygon') for (const m of r.members) if (m.type === 'way' && m.role !== 'inner') { const w = ways.get(m.ref); if (w && closed(w)) areaWays.push({ id: 'r' + r.id, tags: r.tags, P: line(w, XZ) }); }
    const polys = [];
    for (const a of areaWays) { const t = a.tags; if (t.amenity !== 'parking' || /underground|multi-storey|rooftop/.test(t.parking || '') || /grass/.test(t.surface || '')) continue;
      if (!dense(a.P, 2).some(p => nearB(p, R)) && !built.some(h => inPoly([h.b[0], h.b[1]], a.P))) continue;
      const P = simplify(a.P, 0.3).slice(0, -1), surf = !t.surface || PAVED.test(t.surface) ? 0 : 1; polys.push(P);
      osm.push({ row: [0, surf, ...flat(P)], s: (await probe([P[0]]))[0][2], w: { id: a.id, tags: t } }); }
    // 3. the houses the map leaves in the grass: how far the nearest drawn surface is, and where
    const surfPts = [...drawn.map(d => ({ P: dense(d.P, 1), hw: d.hw })), ...polys.map(P => ({ P: dense([...P, P[0]], 1), hw: 0, poly: P }))];
    const gaps = [];
    for (const h of built) { const b = h.b; let best = null;
      for (const S of surfPts) { if (S.poly && corners(b).some(c => inPoly(c, S.poly))) { best = { d: 0 }; break; }
        for (const p of S.P) { if (Math.abs(p[0] - b[0]) > 80 || Math.abs(p[1] - b[1]) > 80) continue; const d = rectD(b, p[0], p[1]) - S.hw; if (!best || d < best.d) best = { d, p, S }; } }
      if (best && best.d <= TOUCH) { gaps.push([h.i, h.s, +best.d.toFixed(1), 'OSM']); continue; }
      const c = Math.cos(b[4]), s = Math.sin(b[4]), loc = (p) => [(p[0] - b[0]) * c + (p[1] - b[1]) * s, -(p[0] - b[0]) * s + (p[1] - b[1]) * c], wld = (u, v) => [b[0] + u * c - v * s, b[1] + u * s + v * c];
      const add = [];
      if (best && best.p) {   // the side that faces the nearest surface: a gravel yard by it, 3 m deep (2 m where 3 do not fit), and a driveway on from its middle
        const q = loc(best.p), ax = Math.abs(q[0]) / (b[2] / 2) > Math.abs(q[1]) / (b[3] / 2) ? 0 : 1, sg = Math.sign(q[ax]) || 1, half = [b[2] / 2, b[3] / 2], side = half[1 - ax] * 2;
        const ws = Math.min(side, 6) / 2, mid = Math.max(-half[1 - ax] + ws, Math.min(half[1 - ax] - ws, q[1 - ax]));
        for (const dep of [3, 2]) {
          const pt = (along, out) => ax === 0 ? wld(sg * (half[0] + out), along) : wld(along, sg * (half[1] + out));
          const Y = [pt(mid - ws, 0), pt(mid - ws, dep), pt(mid + ws, dep), pt(mid + ws, 0)], M = pt(mid, dep), inner = [pt(mid - ws, dep / 2), pt(mid + ws, dep / 2), pt(mid, dep / 2)];
          const prY = await probe([...Y, ...inner]); if (prY.some(r => r[0] < 0 || r[1] < 2) || [...Y.slice(1, 3), ...inner].some(p => inFoot(p, h.i))) continue;
          add.push([0, 1, ...flat(Y)]);
          const L = Math.hypot(best.p[0] - M[0], best.p[1] - M[1]);
          if (L > 0.5) { const D = dense([M, best.p], 1), prD = await probe(D);
            if (L <= 30 && prD.every(r => r[0] >= 0 && r[1] >= 2.5) && !D.slice(1).some(p => inFoot(p, h.i))) add.push([1, 1, 1.5, ...flat([M, best.p])]);
            else { add.length = 0; continue; } }
          break; }
      }
      add.push([2, 2, 0.8, r1(b[0]), r1(b[1]), +b[2].toFixed(2), +b[3].toFixed(2), +b[4].toFixed(3)]);   // the trodden strip round the walls
      for (const r of add) gen.push({ row: r, s: h.s, house: h.i });
      gaps.push([h.i, h.s, best ? +best.d.toFixed(1) : null, 'dopolnitev: ' + add.map(r => ['dvorišče', 'dovoz', 'pas'][r[0]]).join(', ')]);
    }
    // the check: every end of a drawn way meets something (a house, another way, the road, the band's edge); the loose ones are listed
    const loose = [];
    for (const [rows, k0, name] of [[osm.filter(o => o.row[0] === 1), 3, 'makadam'], [yardRows, 1, 'asfalt']]) for (const o of rows) {
      const P = unflat(o.row, k0), hw = k0 === 3 ? o.row[2] : HALF[o.row[0]], q = await probe([P[0], P[P.length - 1]]);
      [P[0], P[P.length - 1]].forEach((p, e) => { const r = q[e];
        if (r[0] < 0 || r[1] > BAND - 3 || r[1] < hw + GAP + 2 || tr.bld.some(b => rectD(b, p[0], p[1]) <= END + 1)) return;
        if (drawn.some(d => d.P !== o.Q && d.P.some((a, k) => k + 1 < d.P.length && segD(p, a, d.P[k + 1]) < d.hw + hw + 1.5))) return;
        loose.push(`${name} ${o.w.id} pri ${Math.round(r[2])} m (${r[1].toFixed(0)} m od ceste)`); }); }
    console.log(`konci poti, ki se ne dotaknejo ničesar: ${loose.length}` + (loose.length ? '\n  ' + loose.join('\n  ') : ''));
    yardRows.sort((p, q) => p.s - q.s); osm.sort((p, q) => p.s - q.s); gen.sort((p, q) => p.s - q.s);
    console.log(`okolica: ${built.length} hiš v pasu; iz OSM ${yardRows.length} asfaltnih poti (def.yard), ${osm.filter(o => o.row[0] === 1).length} makadamskih, ${polys.length} parkirišč; dopolnitev pri ${gaps.filter(g => g[3] !== 'OSM').length} hišah (${gen.length} vrstic)`);
    for (const g of gaps) console.log(`  hiša ${String(g[0]).padStart(3)}  ${String(g[1]).padStart(5)} m  najbližja pot ${g[2] == null ? '—' : g[2] + ' m'}  ${g[3]}`);
    fs.writeFileSync(out, JSON.stringify({ yard: yardRows.map(r => r.row), osm: osm.map(r => r.row), gen: gen.map(r => r.row), ways: why, gaps,
      src: osm.map(r => [r.w.id, Object.entries(r.w.tags).filter(([k]) => /highway|service|surface|amenity|parking|tracktype/.test(k)).map(e => e.join('=')).join(' ')]) }));
  }
  if (OKOL) await okolica(OKOL);
  if (errors.length) console.log('NAPAKE V STRANI:\n' + errors.slice(0, 5).join('\n'));
} finally { await browser.close(); await srv.close(); }
