// Medvode's fence: a visible, continuous fence on the whole barrier (World.buildMedvode builds it from Track.fenceRuns). The numbers here are the
// geometry itself, checked in Node against the physics (no browser: tests/browser/medvode-fence.test.mjs checks what was built).
//   - the lines are the edge of the cars' free ground as wallCollide has it: the route's barriers (bl / br), each side road's corridor (stubHw + lim, up to its rail,
//     closed at its end), each roundabout's zone circle (zr) and the oncoming lanes (altHw + 0.4); a probe through the real wallCollide finds the wall within centimetres of them
//   - along the whole route, every 6 m on both sides, the barrier has a fence on it (within 0.3 m), except where it is open (a side road's mouth), inside a
//     roundabout's zone, on the bridge, under the overpass, on an oncoming lane and in the corner of a bend where the wall is another leg's; the exceptions are listed
//   - the lines are never on the asphalt, the sidewalks, an oncoming lane, a side road's carriageway or a ring road; the runs end at each other (the corners at the mouths,
//     the rings, the lanes), at the bridge and the overpass, at a side road's rail and at the ends of the road
//   - no house (the buildings the scenery builds) stands inside the free ground: the few that did are left out (Track.wallHitter), none of them a church or the castle
//   node tests/medvode-fence.test.js
'use strict';
const { loadCore } = require('./lib/core.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'medvode'), T = new C.Track(def);
const FR = T.fenceRuns(), runs = FR.runs, N = T.N, ds = T.ds;
const EPS = 0.08;   // (how far outside the line the scenery puts the fence's plane)
const KIND = ['route', 'side road', 'ring', 'lane'];
const len = (r) => { let L = 0; for (let k = 2; k < r.pts.length; k += 2) L += Math.hypot(r.pts[k] - r.pts[k - 2], r.pts[k + 1] - r.pts[k - 1]); return L; };
const WALK = T.walk, wE = (si, i) => T.wAt(i) + (WALK ? WALK[si][i] : 0);
const free = T.wallFree(0.04), sp = { S: null };
const mkCar = (x, z, h) => ({ x, z, h: 0, vx: 0, vz: 0, w: 0, m: { mass: 1000 }, I: 1000, corners: [[0, 0], [0, 0], [0, 0], [0, 0]], q: { i: h }, hitWall: 0, fxWall: 0, isPlayer: false, pitWant: false, inPit: false });   // (a point of a car: wallCollide moves it back by how far it is past the wall)

// the side roads where a car driving down them, its hint following the last query as in the game, is pushed back before the rail (another side road's limit or rail on top of
// it): none now (they are listed here and left out of the probe if one comes back)
const blind = new Map();
for (const S of T.stubs) {
  const p0 = T.stubPt(S.k, 0, {}); let hint = T.nearestIdx(p0.x, p0.z), q = {};
  for (let t = 0; t < S.L - 1; t += 0.5) { const p = T.stubPt(S.k, t, {}); q = T.query(p.x, p.z, hint, q); hint = q.i; const c = mkCar(p.x, p.z, hint); C.wallCollide(c, T, false); if (Math.hypot(c.x - p.x, c.z - p.z) > 0.05) { blind.set(S.k, t); break; } }
}

// 1. what there is: the route's two barriers, the side roads' limits and ends, the rings' circles, the oncoming lanes' edges
{
  const by = [0, 0, 0, 0], cnt = [0, 0, 0, 0]; for (const r of runs) { by[r.k] += len(r); cnt[r.k]++; }
  const total = by[0] + by[1] + by[2] + by[3], refs = new Set(runs.filter(r => r.k === 1).map(r => r.ref)).size;
  check('fence: the route\'s barriers on both sides, the side roads\' limits, the rings\' circles, the oncoming lanes\' edges',
    by[0] > 2 * 0.8 * T.len && by[1] > 5000 && by[2] > 20 && by[3] > 100 && runs.some(r => r.k === 0 && r.side < 0) && runs.some(r => r.k === 0 && r.side > 0) && refs > 0.9 * T.stubs.length && new Set(runs.filter(r => r.k === 3).map(r => r.ref)).size >= 3,
    `route ${(by[0] / 1000).toFixed(2)} km in ${cnt[0]} runs (the road is 6.58 km, two sides), side roads ${(by[1] / 1000).toFixed(2)} km in ${cnt[1]} (${refs} of ${T.stubs.length} side roads), rings ${by[2].toFixed(0)} m in ${cnt[2]}, lanes ${by[3].toFixed(0)} m in ${cnt[3]}; ${(total / 1000).toFixed(1)} km in all`);
  check('fence: skipped where the parapet or the abutments are the barrier (the bridge, the overpass)', FR.skips.length === 2 && FR.skips.some(([a, b]) => b - a > 118 && b - a < 125) && FR.skips.some(([a, b]) => b - a > 9 && b - a < 13),
    FR.skips.map(([a, b]) => `${(a - T.startS).toFixed(0)}-${(b - T.startS).toFixed(0)} m`).join(', '));
}

// distance from a point to the nearest line of the runs (a hash of the runs' segments)
const SEG = new Map(), CELL = 16;
for (const r of runs) for (let k = 0; k + 3 < r.pts.length; k += 2) { const ax = r.pts[k], az = r.pts[k + 1], bx = r.pts[k + 2], bz = r.pts[k + 3], s = { ax, az, bx, bz };
  for (let a = Math.floor((Math.min(ax, bx) - 1) / CELL); a <= Math.floor((Math.max(ax, bx) + 1) / CELL); a++) for (let b = Math.floor((Math.min(az, bz) - 1) / CELL); b <= Math.floor((Math.max(az, bz) + 1) / CELL); b++) { const key = a + ',' + b; let L = SEG.get(key); if (!L) SEG.set(key, L = []); L.push(s); } }
const distTo = (x, z) => { let best = 1e9; const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
  for (let a = cx - 1; a <= cx + 1; a++) for (let b = cz - 1; b <= cz + 1; b++) { const L = SEG.get(a + ',' + b); if (!L) continue; for (const s of L) { const dx = s.bx - s.ax, dz = s.bz - s.az, l2 = dx * dx + dz * dz || 1e-9, t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / l2)); best = Math.min(best, Math.hypot(x - s.ax - dx * t, z - s.az - dz * t)); } }
  return best; };

// 2. every 6 m on both sides: the barrier has a fence on it (within 0.3 m), except where it is open, inside a ring, on the bridge, under the overpass, on an oncoming lane,
// in the corner of a bend (there the nearest leg's wall, not this barrier line, is the wall)
{
  const stubIn = (x, z, m) => { for (const S of T.stubs) { const b = S.bb; if (x < b[0] || x > b[2] || z < b[1] || z > b[3]) continue; sp.S = null; if (T._stubProj(S, x, z, sp) && sp.t > 0 && sp.t < S.L && Math.abs(sp.u) < T.stubHw(S, sp.t) + S.lim + m) return true; } return false; };
  const ringIn = (x, z, m) => T.rings.some(R => Math.hypot(x - R.x, z - R.z) < R.zr + m), skipAt = (s, m) => FR.skips.some(([a, b]) => s >= a - m && s <= b + m);
  let total = 0, fenced = 0, miss = 0, missFar = 0; const ex = { 'side road\'s mouth': 0, 'inside a ring zone': 0, 'bridge': 0, 'overpass': 0, 'oncoming lane': 0, 'corner of a bend': 0, 'step in the barrier': 0, 'edge of an exception': 0 }, missAt = [];
  for (const sd of [-1, 1]) for (let i = 0; i < N; i += 3) {
    if (i < 3 || i > N - 4) continue;   // (the road's two ends: the concrete blocks across it)
    const bar = sd > 0 ? T.br[i] : T.bl[i], s = i * ds, si = sd > 0 ? 1 : 0; total++;
    // the barrier line at this sample: along its normal to where wallCollide really stops a car (the barrier changes fast in some places: sample i's own offset is then not on the wall)
    let u = null; for (let v = -3; v <= 3.001; v += 0.05) { const xx = T.px[i] + T.nx[i] * sd * (bar + v), zz = T.pz[i] + T.nz[i] * sd * (bar + v), c = mkCar(xx, zz, i); C.wallCollide(c, T, false); if (Math.hypot(c.x - xx, c.z - zz) > 0.002) { u = v; break; } }
    const corner = u === null, x = T.px[i] + T.nx[i] * sd * (bar + (u || 0)), z = T.pz[i] + T.nz[i] * sd * (bar + (u || 0));
    const B = sd > 0 ? T.br : T.bl, step = Math.abs(B[i + 1] - B[i - 1]) > 2.5, G = T.gap[si], gap = G[i] || (i > 0 && G[i - 1]) || (i < N - 1 && G[i + 1]);
    const clear = !gap && !corner && !step && !stubIn(x, z, 0.3) && !ringIn(x, z, 0.3) && !T.onAlt(x, z) && !skipAt(s, 3), d = distTo(x, z);
    // (a point within 0.3 m of an exception's edge may go either way: the exceptions are counted with the plain tests)
    if (clear) { if (d <= 0.3) fenced++; else { miss++; if (d > 1) missFar++; if (missAt.length < 40) missAt.push(`${sd < 0 ? 'L' : 'R'}${(s - T.startS).toFixed(0)}:${d.toFixed(1)}m`); } }
    else if (d > 0.3) { if (G[i] || stubIn(x, z, 0)) ex['side road\'s mouth']++; else if (ringIn(x, z, 0)) ex['inside a ring zone']++; else if (skipAt(s, 0) && def.bridges.some(([a, b]) => s - T.startS >= a - 3 && s - T.startS <= b + 3)) ex['bridge']++; else if (skipAt(s, 0)) ex['overpass']++; else if (T.onAlt(x, z)) ex['oncoming lane']++; else if (corner) ex['corner of a bend']++; else if (step) ex['step in the barrier']++; else ex['edge of an exception']++; }
  }
  const nEx = Object.values(ex).reduce((a, b) => a + b, 0);
  check('fence: every 6 m on both sides the barrier has a fence on it (within 0.3 m) except where it is open, inside a ring, on the bridge, under the overpass, on an oncoming lane, in a bend\'s corner', miss <= 3 && missFar === 0 && fenced > 0.8 * total && nEx < 0.2 * total,
    `${total} points: ${fenced} fenced, ${miss} not within 0.3 m (none over 1 m)${missAt.length ? ' (' + missAt.join(' ') + ')' : ''}, ${nEx} exceptions (${Object.entries(ex).filter(([, v]) => v).map(([k, v]) => v + ' ' + k).join(', ')}) = ${(100 * nEx / total).toFixed(1)} %`);
}

// 3. the lines are never on the road: the asphalt and sidewalks (0.1 m clear at least), an oncoming lane (its true half width), a side road's carriageway, a ring road
{
  let nPts = 0, onRoute = 0, onLane = 0, onStub = 0, onRing = 0, minRoute = 1e9, minLane = 1e9, minStub = 1e9, minRing = 1e9;
  for (const r of runs) {
    const P = r.pts;
    for (let k = 0; k + 3 < P.length; k += 2) {
      const ax = P[k], az = P[k + 1], dx = P[k + 2] - ax, dz = P[k + 3] - az, l = Math.hypot(dx, dz) || 1e-9, m = Math.max(1, Math.ceil(l)), ox = -dz / l * r.sg * EPS, oz = dx / l * r.sg * EPS;
      for (let q = 0; q < m + (k + 4 >= P.length ? 1 : 0); q++) {
        const x = ax + dx * q / m + ox, z = az + dz * q / m + oz; nPts++;
        const qm = T._qMain(x, z, T.nearestIdx(x, z), {}); if (!qm.over) { const e = Math.abs(qm.d) - wE(qm.d > 0 ? 1 : 0, qm.a); minRoute = Math.min(minRoute, e); if (e < 0.1) onRoute++; }
        for (const L of T.altC) { const b = L.bb; if (x < b[0] - 8 || x > b[2] + 8 || z < b[1] - 8 || z > b[3] + 8) continue; const Pp = L.pts;
          for (let j = 0; j + 3 < Pp.length; j += 2) { const px = Pp[j], pz = Pp[j + 1], ex = Pp[j + 2] - px, ez = Pp[j + 3] - pz, t = Math.max(0, Math.min(1, ((x - px) * ex + (z - pz) * ez) / (ex * ex + ez * ez || 1e-9))), d = Math.hypot(x - px - ex * t, z - pz - ez * t) - def.altHw; minLane = Math.min(minLane, d); if (d < 0.1) onLane++; } }
        for (const S of T.stubs) { const b = S.bb; if (x < b[0] || x > b[2] || z < b[1] || z > b[3]) continue; sp.S = null; if (!T._stubProj(S, x, z, sp) || sp.t < 0 || sp.t > S.L - 0.6) continue; const e = Math.abs(sp.u) - T.stubHw(S, sp.t); minStub = Math.min(minStub, e); if (e < 0.2) onStub++; }
        for (const R of T.rings) { const e = Math.abs(Math.hypot(x - R.x, z - R.z) - R.r) - (def.rings.find(v => v.c[0] === R.x).hw || 3); minRing = Math.min(minRing, e); if (e < 0.2 && Math.hypot(x - R.x, z - R.z) > R.ri) onRing++; }
      }
    }
  }
  check('fence: never on the asphalt or a sidewalk (0.1 m clear at least), on an oncoming lane, a side road\'s carriageway (up to its rail) or a ring road', onRoute === 0 && onLane === 0 && onStub === 0 && onRing === 0,
    `${nPts} points checked every ~1 m: nearest to the route\'s sidewalk edge ${minRoute.toFixed(2)} m, to an oncoming lane\'s edge ${minLane.toFixed(2)} m, to a side road\'s carriageway ${minStub.toFixed(2)} m, to a ring road ${minRing.toFixed(2)} m; ${onRoute} / ${onLane} / ${onStub} / ${onRing} too close`);
}

// 4. the lines are the wall: through the real wallCollide a car is pushed by the wall where the fence stands (to within 4 cm at the median, 40 cm at the worst)
{
  const hintAt = (r, x, z) => { if (r.k === 1) { const S = T.stubs[r.ref]; sp.S = null; if (T._stubProj(S, x, z, sp)) return { h: T.stubHint(S.k, sp.t), t: sp.t }; } return { h: T.nearestIdx(x, z), t: 0 }; };
  const pen = (x, z, h) => { const c = mkCar(x, z, h); C.wallCollide(c, T, false); return Math.hypot(c.x - x, c.z - z); };
  let tested = 0, skipped = 0, noWall = 0; const off = [], fails = [];
  for (const r of runs) {
    const P = r.pts, L = len(r); let nextAt = 3, run = 0;
    for (let k = 0; k + 3 < P.length; k += 2) {
      const ax = P[k], az = P[k + 1], dx = P[k + 2] - ax, dz = P[k + 3] - az, l = Math.hypot(dx, dz) || 1e-9; if (run + l < nextAt) { run += l; continue; }
      const t = (nextAt - run) / l; run += l; nextAt += 8; if (t > 1 || run < 1.5 || L - run < 1.5) continue;
      const x = ax + dx * t, z = az + dz * t, nx = -dz / l * r.sg, nz = dx / l * r.sg, hh = hintAt(r, x, z);
      if (r.k === 1 && blind.has(r.ref) && hh.t >= blind.get(r.ref) - 3) { skipped++; continue; }
      tested++;
      let wall = null; for (let u = -0.6; u <= 0.6001; u += 0.02) if (pen(x + nx * u, z + nz * u, hh.h) > 0.002) { wall = u; break; }   // (the first place along the outward normal where a car is pushed)
      if (wall === null) { if (!free.any(x + nx * 0.7, z + nz * 0.7)) { noWall++; if (fails.length < 5) fails.push(`${KIND[r.k]} ${r.ref} at ${x.toFixed(0)},${z.toFixed(0)}: no wall within 0.6 m`); } }
      else { off.push(Math.abs(wall)); if (Math.abs(wall) > 0.4 && fails.length < 5) fails.push(`${KIND[r.k]} ${r.ref} at ${x.toFixed(0)},${z.toFixed(0)}: wall ${wall.toFixed(2)} m`); }
    }
  }
  off.sort((a, b) => a - b); const med = off[off.length >> 1], p95 = off[Math.floor(off.length * 0.95)], mx = off[off.length - 1], badN = off.filter(v => v > 0.4).length + noWall;
  check('fence: the lines are the wall (wallCollide): a car is stopped where the fence stands, 4 cm at the median, 40 cm at the worst', tested > 1500 && med <= 0.04 && p95 <= 0.2 && badN <= 0.01 * tested,
    `${tested} points every ~8 m: wall ${(med * 100).toFixed(0)} cm from the line at the median, ${(p95 * 100).toFixed(0)} cm at 95 %, ${(mx * 100).toFixed(0)} cm at most; ${badN} off by more than 40 cm or without a wall${fails.length ? '; e.g. ' + fails.join('; ') : ''}`);
  check('side roads: a car drives down every one of them to its rail without meeting a wall (the pick of the side road when two lie side by side, Track._stubQ with def.stubPick)', blind.size === 0, blind.size ? [...blind].map(([k, t]) => `${k}@${t.toFixed(0)} m`).join(', ') : `97 side roads, every 0.5 m`);
}

// 5. the runs end at each other, the bridge, the overpass, a side road's rail, the road's ends
{
  const ends = []; for (const r of runs) { const P = r.pts; if (!r.closed) { ends.push({ x: P[0], z: P[1], r, first: true }); ends.push({ x: P[P.length - 2], z: P[P.length - 1], r, first: false }); } }
  const cnt = { 'meets another run': 0, 'the bridge': 0, 'the overpass': 0, 'a side road\'s rail': 0, 'the end of the road': 0 }, lost = [];
  for (const e of ends) {
    const qm = T._qMain(e.x, e.z, T.nearestIdx(e.x, e.z), {}), s = qm.s;
    if (ends.some(f => f !== e && Math.hypot(f.x - e.x, f.z - e.z) < 0.6)) cnt['meets another run']++;
    else if (FR.skips.some(([a, b]) => Math.abs(s - a) < 4 || Math.abs(s - b) < 4) && e.r.k === 0) cnt[def.bridges.some(([a, b]) => Math.abs(s - T.startS - a) < 5 || Math.abs(s - T.startS - b) < 5) ? 'the bridge' : 'the overpass']++;
    else if (e.r.k === 1 && !e.first) cnt['a side road\'s rail']++;
    else if (e.r.k === 0 && (s < 3 || s > T.len - 3)) cnt['the end of the road']++;
    else lost.push(`${KIND[e.r.k]}${e.r.ref >= 0 ? ' ' + e.r.ref : ''} ${e.first ? 'start' : 'end'} at d ${(s - T.startS).toFixed(0)}`);
  }
  check('fence: the runs meet (the corners at the mouths, the rings, the lanes), or end at the bridge, the overpass, a side road\'s rail, the end of the road; only a dozen wedge tips at hairpins and odd mouths stay loose', lost.length <= 14,
    `${ends.length} ends: ${Object.entries(cnt).map(([k, v]) => v + ' ' + k).join(', ')}, ${lost.length} loose${lost.length ? ' (' + lost.slice(0, 5).join('; ') + (lost.length > 5 ? '; ...' : '') + ')' : ''}`);
}

// 6. no house inside the free ground (a car would drive through it): the buildings the scenery builds (def.bld without the ones on the road, as buildMedvode)
{
  const Q = {}, altIn = (x, z, m) => { for (const L of T.altC) { const P = L.pts, h = (def.altHw || 2.4) + m; for (let k = 0; k + 3 < P.length; k += 2) { const ax = P[k], az = P[k + 1], dx = P[k + 2] - ax, dz = P[k + 3] - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1e-9))); if (Math.hypot(x - ax - dx * t, z - az - dz * t) < h) return true; } } return false; };
  const onRoadB = (x, z, m) => { if (altIn(x, z, m)) return true; const q = T.query(x, z, T.nearestIdx(x, z), Q); if (q.k >= 0) { const S = T.stubs[q.k]; if (q.st <= S.Lend && Math.abs(q.u) <= (q.st < S.te ? T.stubHw(S, q.st) : S.hw) + m) return true; } return !q.deep && !q.over && Math.abs(q.d) < wE(q.d > 0 ? 1 : 0, q.a) + m; };
  const f3 = T.wallFree(0.3), hit = T.wallHitter(runs, f3), inPoly = (pts, x, z) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > z) !== (pts[j][1] > z) && x < (pts[j][0] - pts[i][0]) * (z - pts[i][1]) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; };
  let onRoad = 0, left = 0, kept = 0, inside = 0, special = 0, closest = 1e9; const where = [];
  for (const b of def.bld) {
    const [x, z, L, W, ang, , kind] = b; if (L < 2.2 || W < 2.2) continue;
    const c = Math.cos(ang), s = Math.sin(ang), pts = b[8] ? b[8].reduce((a, v, k) => (k % 2 ? a[a.length - 1].push(v) : a.push([v]), a), []) : [[-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]].map(([p, q]) => [x + c * p - s * q, z + s * p + c * q]);
    if (pts.concat([[x, z]]).some(([px, pz]) => onRoadB(px, pz, 0.3))) { onRoad++; continue; }
    if (kind !== 2 && kind !== 6 && hit(pts, x, z)) { left++; continue; }
    kept++;
    let deep = false;   // (area sampling, not the lines: every 0.5 m along the walls, every 2 m inside the small ones)
    const xs = pts.map(p => p[0]), zs = pts.map(p => p[1]);
    for (let k = 0; k < pts.length && !deep; k++) { const a = pts[k], bb = pts[(k + 1) % pts.length], m = Math.max(1, Math.ceil(Math.hypot(bb[0] - a[0], bb[1] - a[1]) / 0.5));
      for (let q = 0; q < m; q++) if (f3.any(a[0] + (bb[0] - a[0]) * q / m, a[1] + (bb[1] - a[1]) * q / m)) { deep = true; break; } }
    if (!deep && L * W < 900) for (let px = Math.min(...xs); px <= Math.max(...xs) && !deep; px += 2) for (let pz = Math.min(...zs); pz <= Math.max(...zs); pz += 2) if (inPoly(pts, px, pz) && f3.any(px, pz)) { deep = true; break; }
    if (deep) { inside++; if (kind === 2 || kind === 6) special++; if (where.length < 5) where.push(`${x.toFixed(0)},${z.toFixed(0)} kind ${kind}`); }
    else { let dm = 1e9; for (const [px, pz] of pts) dm = Math.min(dm, distTo(px, pz)); closest = Math.min(closest, dm); }
  }
  check('houses: none stands inside the free ground (the route\'s barriers, a side road\'s corridor, a ring zone, an oncoming lane) by more than 30 cm; the few that did are left out', inside === 0 && left < 40 && special === 0,
    `${kept} of ${kept + left + onRoad} buildings built (${onRoad} on the road were dropped before, ${left} cut by the fence\'s lines or standing in the free ground are left out now), ${inside} still inside${where.length ? ': ' + where.join('; ') : ''}; the nearest wall is ${closest.toFixed(2)} m from a fence line`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
