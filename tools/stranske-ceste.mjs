// Stranske ceste (def.sideRoads, oblika Vršiča: js/core.js Track._buildStubs) za progo, ki ni iz tools/proga-uvoz.mjs: iz OpenStreetMap
// (glavni API, api.openstreetmap.org/api/0.6/map?bbox=…; nikoli Google) poišče ceste, ki se med startom in ciljem stikajo s progo, in jih
// zapiše v js/tracks/<id>.js med oznakama »// ---- stranske ceste: začetek« in »// ---- stranske ceste: konec« (pred »points:«).
// Imena se ne prenesejo (Pravna varnost). Višine: cesta ob odcepu, nato višina najbližje točke proge, naklon do 15 %.
// Izhodišče koordinat: tools/<id>/<id>.json (lat0, lon0, tools/proga-podatki.py) ali --lat0 --lon0; --fit poravna OSM na progo
// (proge s premaknjeno sredinsko črto: Rio do Rastro, Tianmen). Prenosi v tools/predogled/podatki/stranske/ (ni v repozitoriju).
//   node tools/stranske-ceste.mjs <id> [--lat0 <deg> --lon0 <deg>] [--fit] [--pregled] [--max <n>] [--brez <s,...>]
// (uporabljeno: mombasa --brez 982; portobelo --brez 1606; seoul --brez 2369; rastro --ll -28.3880,-49.5530 --fit)
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { createRequire } from 'node:module';

const REPO = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..'), require = createRequire(import.meta.url);
const a = process.argv.slice(2), o = { _: [] };
for (let i = 0; i < a.length; i++) { if (!a[i].startsWith('--')) { o._.push(a[i]); continue; } const k = a[i].slice(2), nx = a[i + 1]; if (nx == null || nx.startsWith('--')) o[k] = true; else { o[k] = nx; i++; } }
const id = o._[0]; if (!id) { console.log('node tools/stranske-ceste.mjs <id> [--lat0 --lon0] [--fit] [--pregled]'); process.exit(1); }

const { loadCore } = require(path.join(REPO, 'tests', 'lib', 'core.js'));
const C = loadCore(), def0 = C.TRACKS.find(d => d.id === id); if (!def0) throw new Error('ni proge ' + id);
const def = Object.assign({}, def0, { sideRoads: null }), T = new C.Track(def), N = T.N, ds = T.ds, px = T.px, pz = T.pz;
let lat0 = +o.lat0, lon0 = +o.lon0;
if (!o.ll && (!(lat0 === lat0) || o.lat0 == null)) { const j = JSON.parse(fs.readFileSync(path.join(REPO, 'tools', id, id + '.json'), 'utf8')); lat0 = j.lat0; lon0 = j.lon0; }
const A = 6378137, E2 = 0.00669437999014; let MR, NR, CL;
const setO = () => { const sl = Math.sin(lat0 * Math.PI / 180); MR = A * (1 - E2) / Math.pow(1 - E2 * sl * sl, 1.5); NR = A / Math.sqrt(1 - E2 * sl * sl); CL = Math.cos(lat0 * Math.PI / 180); };
if (o.ll) [lat0, lon0] = o.ll.split(',').map(Number); setO();
const toXZ = (lat, lon) => [(lon - lon0) * Math.PI / 180 * NR * CL, -(lat - lat0) * Math.PI / 180 * MR];
const toLL = (x, z) => [lat0 - z / MR * 180 / Math.PI, lon0 + x / (NR * CL) * 180 / Math.PI];

const CAR = /^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|road|service|track)(_link)?$/;
const isCar = (t) => CAR.test(t.highway || '') && !/no|private/.test(t.access === 'no' ? 'no' : '') && t.area !== 'yes' && !/construction|proposed/.test(t.highway);
/* ---- OSM in tiles along the road (cached) ---- */
const DIR = path.join(REPO, 'tools', 'predogled', 'podatki', 'stranske'); fs.mkdirSync(DIR, { recursive: true });
const nodes = new Map(), ways = new Map();
async function tile(x0, z0, x1, z1) {
  const [la1, lo0] = toLL(x0, z0), [la0, lo1] = toLL(x1, z1), bb = [lo0, la0, lo1, la1].map(v => v.toFixed(5)).join(','), f = path.join(DIR, id + '-' + bb.replace(/,/g, '_') + '.osm');
  let xml; if (fs.existsSync(f)) xml = fs.readFileSync(f, 'utf8'); else {
    for (let k = 0; ; k++) { try { const r = await fetch('https://api.openstreetmap.org/api/0.6/map?bbox=' + bb, { headers: { 'User-Agent': 'dirkaska-igra-tools/1.0' } }); if (!r.ok) throw new Error(r.status + ' ' + bb); xml = await r.text(); break; }
      catch (e) { if (k > 3) throw e; await new Promise(r => setTimeout(r, 2000 * 2 ** k)); } }
    fs.writeFileSync(f, xml); }
  for (const m of xml.matchAll(/<node id="(\d+)"[^>]*?lat="([-\d.]+)" lon="([-\d.]+)"/g)) nodes.set(m[1], toXZ(+m[2], +m[3]));
  for (const m of xml.matchAll(/<way id="(\d+)"[^>]*>([\s\S]*?)<\/way>/g)) { if (ways.has(m[1])) continue; const tags = {};
    for (const t of m[2].matchAll(/<tag k="([^"]*)" v="([^"]*)"/g)) tags[t[1]] = t[2];
    ways.set(m[1], { id: m[1], nds: [...m[2].matchAll(/<nd ref="(\d+)"/g)].map(q => q[1]), tags }); }
}
// --ll <lat,lon>: only roughly where the road is (no origin known): one box round it, the shift that lays the most OSM car-road nodes on the
// track's centre line (a 10 m grid over +-R m, then 2 m), the origin moved by it; then the tiles and --fit as usual
if (o.ll) { let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (let i = 0; i < N; i++) { x0 = Math.min(x0, px[i]); x1 = Math.max(x1, px[i]); z0 = Math.min(z0, pz[i]); z1 = Math.max(z1, pz[i]); }
  const R = +(o.r || 1500), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, hx = (x1 - x0) / 2 + R, hz = (z1 - z0) / 2 + R;
  await tile(-hx, -hz, hx, hz);   // (round the guess: the track's centre is put there)
  const pts = []; for (const w of ways.values()) if (CAR.test(w.tags.highway || '')) for (const nd of w.nds) { const p = nodes.get(nd); if (p) pts.push(p); }
  const tr = []; for (let i = 0; i < N; i += Math.max(1, Math.round(8 / ds))) tr.push([px[i], pz[i]]);
  const G = new Set(); for (const [x, z] of pts) G.add(Math.round(x / 6) * 100000 + Math.round(z / 6));
  const score = (dx, dz) => { let c = 0; for (const [x, z] of tr) { const gx = Math.round((x + dx) / 6), gz = Math.round((z + dz) / 6); for (let a = -1; a <= 1 && true; a++) { let hit = false; for (let b = -1; b <= 1; b++) if (G.has((gx + a) * 100000 + gz + b)) { hit = true; break; } if (hit) { c++; break; } } } return c; };
  let best = [0, 0, -1]; for (let dx = -R; dx <= R; dx += 10) for (let dz = -R; dz <= R; dz += 10) { const c = score(dx - cx, dz - cz); if (c > best[2]) best = [dx - cx, dz - cz, c]; }
  const b0 = best.slice(); for (let dx = -12; dx <= 12; dx += 2) for (let dz = -12; dz <= 12; dz += 2) { const c = score(b0[0] + dx, b0[1] + dz); if (c > best[2]) best = [b0[0] + dx, b0[1] + dz, c]; }
  console.log(`groba poravnava: ${best[0].toFixed(0)}, ${best[1].toFixed(0)} m, ${best[2]}/${tr.length} točk proge na cestah OSM`);
  [lat0, lon0] = toLL(best[0], best[1]); setO(); nodes.clear(); ways.clear(); console.log(`izhodišče ${lat0.toFixed(6)}, ${lon0.toFixed(6)}`); }
{ const step = Math.round(350 / ds), M = 160;
  for (let i = 0; i < N; i += step) { let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
    for (let j = i; j < Math.min(N, i + step + 1); j++) { x0 = Math.min(x0, px[j]); x1 = Math.max(x1, px[j]); z0 = Math.min(z0, pz[j]); z1 = Math.max(z1, pz[j]); }
    await tile(x0 - M, z0 - M, x1 + M, z1 + M); } }

/* ---- the road's samples in a grid; the nearest one ---- */
const HC = 24, hash = new Map(), hk = (a, b) => a * 65536 + b;
for (let i = 0; i < N; i++) { const k = hk(Math.floor(px[i] / HC), Math.floor(pz[i] / HC)); let L = hash.get(k); if (!L) hash.set(k, L = []); L.push(i); }
let ox = 0, oz = 0;   // (--fit: the shift that lays the OSM road on the track)
function near(x, z, R = 3) { x -= ox; z -= oz; const cx = Math.floor(x / HC), cz = Math.floor(z / HC); let bi = -1, bd = 1e18;
  for (let a = cx - R; a <= cx + R; a++) for (let b = cz - R; b <= cz + R; b++) { const L = hash.get(hk(a, b)); if (L) for (const i of L) { const d = (px[i] - x) ** 2 + (pz[i] - z) ** 2; if (d < bd) { bd = d; bi = i; } } }
  return { i: bi, d: bi < 0 ? 1e9 : Math.sqrt(bd) }; }
if (o.fit) {   // the median offset of the car roads' nodes lying along the road (within 25 m of it), twice
  for (let it = 0; it < 3; it++) { const dx = [], dz = [];
    for (const w of ways.values()) { if (!isCar(w.tags)) continue; for (const nd of w.nds) { const p = nodes.get(nd); if (!p) continue; const q = near(p[0], p[1]); if (q.d < 25 - it * 6) { dx.push(p[0] - ox - px[q.i]); dz.push(p[1] - oz - pz[q.i]); } } }
    const med = (v) => v.sort((a, b) => a - b)[v.length >> 1] || 0; ox += med(dx); oz += med(dz); }
  console.log(`poravnava: ${ox.toFixed(1)}, ${oz.toFixed(1)} m`); }
const P = (nd) => { const p = nodes.get(nd); return p ? [p[0] - ox, p[1] - oz] : null; };

/* ---- the buildings (a side road ending at one) ---- */
const bld = []; for (const w of ways.values()) if (w.tags.building) { const ps = w.nds.map(P).filter(Boolean); if (ps.length < 3) continue; let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const [x, z] of ps) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } bld.push([(x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0]); }

/* ---- the side roads ---- */
const startS = T.startS, finS = T.finishS, cps = (def.cps || []).map(c => near(c[0] + ox, c[1] + oz).i * ds), hw0 = def.halfWidth || 5;
const avoid = [...(def.bridges || []), ...(def.tunnels || []), ...(def.galleries || [])].map(b => Array.isArray(b) ? b : [b.s0 ?? b.s ?? b.d0 ?? 0, b.s1 ?? b.e ?? b.d1 ?? 0]);
function resample(p, st) { const out = [p[0].slice()]; let acc = 0; for (let k = 1; k < p.length; k++) { let [ax, az] = p[k - 1]; const [bx, bz] = p[k]; let L = Math.hypot(bx - ax, bz - az);
  while (acc + L >= st) { const f = (st - acc) / L; ax += (bx - ax) * f; az += (bz - az) * f; out.push([ax, az]); L = Math.hypot(bx - ax, bz - az); acc = 0; } acc += L; } return out; }
const kinds = { residential: 0, unclassified: 0, tertiary: 0, secondary: 0, primary: 0, trunk: 0, living_street: 0, road: 0, service: 1, track: 2 }, GRAVEL = /gravel|unpaved|dirt|ground|compacted|fine_gravel|sand|earth|grass/;
const cand = [];
for (const w of ways.values()) {
  if (!isCar(w.tags) || w.nds.length < 2 || /driveway|parking_aisle|drive-through|alley|emergency_access/.test(w.tags.service || '') || w.tags.access === 'private') continue;
  const ps = w.nds.map(P); if (ps.some(p => !p)) continue; const dd = ps.map(p => near(p[0], p[1]).d);
  // the way's nodes on the road (within 7 m of the centre line): it leaves the road from each such node whose next one is off it
  for (let k = 0; k < ps.length; k++) { if (dd[k] > 7) continue;
    for (const dir of [1, -1]) { const k1 = k + dir; if (k1 < 0 || k1 >= ps.length || dd[k1] <= 7) continue;
      const seq = []; for (let m = k; m >= 0 && m < ps.length; m += dir) seq.push(ps[m]); cand.push({ w, seq }); } }
}
const rows = [];
for (const { w, seq } of cand) {
  const q = resample(seq, 3); if (q.length < 8) continue; const L0 = (q.length - 1) * 3, kind = kinds[w.tags.highway.replace('_link', '')] ?? 1;
  if (L0 < 45 || (kind === 1 && L0 < 70)) continue;
  const j = near(q[0][0] + ox, q[0][1] + oz), i = j.i, s = i * ds - startS; if (i < 0) continue;
  if (s < 30 || i * ds > finS - 30 || cps.some(c => Math.abs(i * ds - c) < 25) || avoid.some(([a0, a1]) => i * ds > a0 - 40 && i * ds < a1 + 40)) continue;
  // off the road: by 24 m along it at least 12 m from the centre line, and never back near the road (another leg of it) before its end
  let L = Math.min(L0 - 6, kind === 0 ? 90 : 60), ok = true;
  for (let m = 1; m < q.length && m * 3 <= L + 4; m++) { const n = near(q[m][0] + ox, q[m][1] + oz), ad = Math.abs(n.i - i) * ds;
    if (m * 3 >= 24 && n.d < 12 && ad < 60) { ok = false; break; }
    if (m * 3 > 15 && n.d < hw0 + 9 && ad > 40) { L = m * 3 - 12; break; } }
  if (!ok || L < 30) continue;
  let e = Math.min(q.length - 1, 5); const dx = q[e][0] - q[0][0], dz = q[e][1] - q[0][1], dl = Math.hypot(dx, dz) || 1;
  const ia = Math.max(0, i - 2), ib = Math.min(N - 1, i + 2), tx = px[ib] - px[ia], tz = pz[ib] - pz[ia], tl = Math.hypot(tx, tz) || 1, ux = tx / tl, uz = tz / tl;
  const sd = Math.sign(dx * -uz + dz * ux) || 1; let ang = Math.acos(Math.max(-1, Math.min(1, (dx * ux + dz * uz) / dl))) * 180 / Math.PI;
  if (Math.min(ang, 180 - ang) < 28) { const tgt = (ang < 90 ? 28 : 152) * Math.PI / 180, vx = ux * Math.cos(tgt) + (-uz * sd) * Math.sin(tgt), vz = uz * Math.cos(tgt) + (ux * sd) * Math.sin(tgt);
    for (let m = 1; m < q.length && m * 3 <= 15; m++) { const f = m * 3 / 15; q[m] = [q[0][0] + vx * m * 3 * (1 - f) + (q[m][0] - q[0][0]) * f, q[0][1] + vz * m * 3 * (1 - f) + (q[m][1] - q[0][1]) * f]; } ang = tgt * 180 / Math.PI; }
  q[0] = [px[i], pz[i]];
  const grav = GRAVEL.test(w.tags.surface || '') || (w.tags.highway === 'track' && !/asphalt|concrete|paved/.test(w.tags.surface || '')) ? 1 : 0;
  const hwd = +w.tags.width ? Math.min(3.5, Math.max(2.2, +w.tags.width / 2)) : kind === 0 ? 3.0 : kind === 1 ? 2.4 : 2.2;
  const endB = L0 < 140 && bld.some(B => q.slice(0, Math.ceil(L / 3) + 2).some(([x, z]) => Math.hypot(x - B[0], z - B[1]) < Math.max(B[2], B[3]) / 2 + 6)) ? 2 : kind === 2 ? 1 : 0;
  const hs = []; let hp = T.hy[i]; for (let m = 0; m < q.length && m * 3 < L + 40; m++) { let h = m ? T.hy[near(q[m][0] + ox, q[m][1] + oz).i] : hp; h = Math.max(hp - 0.45, Math.min(hp + 0.45, h)); hs.push(+q[m][0].toFixed(1), +q[m][1].toFixed(1), +h.toFixed(1)); hp = h; }
  if (hs.length / 3 * 3 < L + 12) { L = Math.floor(hs.length - 4); if (L < 30) continue; }
  rows.push([+s.toFixed(1), sd, Math.round(ang), kind, grav, Math.round(L), endB, hwd, kind === 0 ? 1.2 : 1.6, '', hs]);
}
rows.sort((a, b) => a[0] - b[0]);
for (let k = rows.length - 1; k > 0; k--) for (let m = k - 1; m >= 0; m--) { const A = rows[k], B = rows[m]; if (!A || !B || A[0] - B[0] > 40) continue; if (A[1] !== B[1] && A[0] - B[0] > 12) continue; rows[A[3] > B[3] || (A[3] === B[3] && A[5] < B[5]) ? k : m] = null; }
let SR = rows.filter(Boolean); if (o.brez) { const B = String(o.brez).split(',').map(Number); SR = SR.filter(r => !B.some(b => Math.abs(r[0] - b) < 2)); }   // (--brez <s,...>: those left out: tests/junctions.test.js) if (o.max && SR.length > +o.max) { const st = SR.length / +o.max; SR = Array.from({ length: +o.max }, (_, k) => SR[Math.floor(k * st)]); }
console.log(`${id}: ${SR.length} stranskih cest (${SR.filter(r => r[1] < 0).length} levo, ${SR.filter(r => r[1] > 0).length} desno, ${SR.filter(r => r[4]).length} makadam): ` + SR.map(r => `${r[0]}${r[1] < 0 ? 'L' : 'D'}${r[3]}`).join(' '));
if (o.pregled) process.exit(0);

const F = path.join(REPO, 'js', 'tracks', id + '.js'); let src = fs.readFileSync(F, 'utf8');
const B0 = '    // ---- stranske ceste: začetek', B1 = '    // ---- stranske ceste: konec';
const block = [B0,
  `    // the side roads (OpenStreetMap, © OpenStreetMap contributors, ODbL 1.0, tools/stranske-ceste.mjs: the streets, service roads and tracks that meet`,
  `    // this road within the race; driveways, car parks and private roads left out; no names), as Vršič's def.sideRoads (js/core.js Track._buildStubs)`,
  `    sideRoads: ${JSON.stringify(SR)},`, B1].join('\n');
if (src.includes(B0)) src = src.slice(0, src.indexOf(B0)) + block + src.slice(src.indexOf(B1) + B1.length);
else { const at = src.lastIndexOf('\n    points: '); if (at < 0) throw new Error('ni »points:« v ' + F); src = src.slice(0, at + 1) + block + '\n' + src.slice(at + 1); }
fs.writeFileSync(F, src); console.log('zapisano v ' + path.relative(REPO, F));
