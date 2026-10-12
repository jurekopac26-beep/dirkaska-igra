// Medvode's barrier: a race circuit's steel barrier along the whole road, the asphalt run-off out to it (def.barrier: ~9 m past the asphalt or the sidewalk
// where there is room, nearer where a house, a wall, a hedge, a fence, the water or another street stands closer, a house's or a wall's front the barrier
// itself). World.buildMedvode builds it from Track.fenceRuns (the mesh is still called 'mvFence'); the numbers here are the geometry itself, checked in Node
// against the physics (no browser: tests/browser/medvode-fence.test.mjs checks what was built).
//   - the lines are the edge of the cars' free ground as wallCollide has it: the route's barrier on both sides (bl / br, def.barrier), each roundabout's zone
//     circle (zr) and the walls across the roads of the three rings the route goes round the long way (rings[].shut: from the island out to the circle); no
//     side road has a corridor of its own (def.sideClosed: the barrier runs straight across its mouth) and no oncoming lane is free ground of its own
//     (def.altFree false: road only where it lies in the run-off), so neither has runs
//   - along the whole route, every 6 m on both sides, the barrier has a fence on it (within 0.3 m), except inside a roundabout's zone, on the bridge and under
//     the overpass (the parapets and the abutments are the barrier there) and in a bend's corner; the exceptions are listed
//   - the lines are never on the road: at least 0.5 m clear of the asphalt and the sidewalks of every leg of the road (the run-off in front of them), the
//     circles clear of the rings' roads; only the ring walls cross a ring's road, on the side the route leaves out
//   - the lines are the wall: a probe through the real wallCollide finds it within centimetres of the lines (a ring wall: its two faces 25 cm either side), and
//     it puts a car's corner that went past a line back by about as much, never metres (no jump through the run-off or out of a ring); the other way round, the
//     walls across the rings stop a car only where their fence stands (from the island to the zone's circle: no invisible wall)
//   - a car driving into a side road is stopped at the barrier across its mouth, out in the run-off; the runs end at each other (corners and T-junctions at
//     the rings' circles), at the bridge, the overpass, the ends of the road or (a ring wall) at the island
//   - no house (the buildings the scenery builds) stands inside the free ground: the few that did are left out (Track.wallHitter), none of them a church or the castle
//   node tests/medvode-fence.test.js
'use strict';
const { loadCore } = require('./lib/core.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'medvode'), T = new C.Track(def);
const FR = T.fenceRuns(), runs = FR.runs, N = T.N, ds = T.ds;
const KIND = ['route', 'side road', 'ring', 'lane'], kindOf = (r) => r.shut ? 'ring wall' : KIND[r.k];
const len = (r) => { let L = 0; for (let k = 2; k < r.pts.length; k += 2) L += Math.hypot(r.pts[k] - r.pts[k - 2], r.pts[k + 1] - r.pts[k - 1]); return L; };
const WALK = T.walk, wE = (si, i) => T.wAt(i) + (WALK ? WALK[si][i] : 0);
const free = T.wallFree(0.04);
// a point of a car (wallCollide moves it back by how far it is past the wall); (fx, fz): where it was before this step (a ring wall keeps it on that side)
const mkCar = (x, z, h, fx, fz) => ({ x, z, px: fx != null ? fx : x, pz: fz != null ? fz : z, h: 0, vx: 0, vz: 0, w: 0, m: { mass: 1000 }, I: 1000, corners: [[0, 0], [0, 0], [0, 0], [0, 0]], q: { i: h }, hitWall: 0, fxWall: 0, isPlayer: false, pitWant: false, inPit: false });
const pen = (x, z, h, fx, fz) => { const c = mkCar(x, z, h, fx, fz); C.wallCollide(c, T, false); return Math.hypot(c.x - x, c.z - z); };
const pct = (a, q) => a[Math.min(a.length - 1, Math.floor(a.length * q))];

// how far (x, z) lies past the asphalt and the sidewalk of the nearest leg of the road (every leg near it: each sample within ~50 m that is nearer than its two
// neighbours; the edges interpolated between the samples, as the scenery draws them); null off the ends of the road
const SH = new Map(), SC = 16; for (let i = 0; i < N; i++) { const k = Math.floor(T.px[i] / SC) + ',' + Math.floor(T.pz[i] / SC); let L = SH.get(k); if (!L) SH.set(k, L = []); L.push(i); }
const edgeClear = (x, z) => { const cx = Math.floor(x / SC), cz = Math.floor(z / SC), d2 = (i) => (T.px[i] - x) ** 2 + (T.pz[i] - z) ** 2; let best = null;
  for (let a = cx - 3; a <= cx + 3; a++) for (let b = cz - 3; b <= cz + 3; b++) { const L = SH.get(a + ',' + b); if (!L) continue;
    for (const i of L) { if ((i > 0 && d2(i - 1) < d2(i)) || (i < N - 1 && d2(i + 1) < d2(i))) continue; const q = T._qMain(x, z, i, {}); if (q.over) continue;
      const si = q.d > 0 ? 1 : 0, e = Math.abs(q.d) - (wE(si, q.a) * (1 - q.t) + wE(si, Math.min(N - 1, q.a + 1)) * q.t); if (best === null || e < best) best = e; } }
  return best; };

// how far (x, z) lies past the edge of the cars' free ground (the route's barrier as the nearest sample has it, a ring's zone circle; <= 0 inside)
const pastFree = (x, z) => { const q = T._qMain(x, z, T.nearestIdx(x, z), {}); let best = q.over ? 0 : Math.abs(q.d) - (q.d > 0 ? q.br : q.bl);
  for (const R of T.rings) if (R.zr > 0) best = Math.min(best, Math.hypot(x - R.x, z - R.z) - R.zr); return best; };
// the side roads: a car driving down each from the road, its hint following the last query as in the game, is pushed back where (side road -> { t: along it,
// x, z }): at the barrier across the mouth (def.sideClosed); or it never leaves the free ground (a short one that ends in the run-off or a ring's zone); a hole:
// 0.3 m past the free ground's edge and not stopped (side road -> { t, e })
const blind = new Map(), hole = new Map(), inFree = [];
for (const S of T.stubs) {
  const p0 = T.stubPt(S.k, 0, {}); let hint = T.nearestIdx(p0.x, p0.z), q = {}, done = false;
  for (let t = 0; t < Math.max(S.L, S.Lend || 0) - 1 && !done; t += 0.5) { const p = T.stubPt(S.k, t, {}); q = T.query(p.x, p.z, hint, q); hint = q.i; const c = mkCar(p.x, p.z, hint); C.wallCollide(c, T, false);
    if (Math.hypot(c.x - p.x, c.z - p.z) > 0.05) { blind.set(S.k, { t, x: p.x, z: p.z }); done = true; } else { const e = pastFree(p.x, p.z); if (e > 0.3) { hole.set(S.k, { t, e }); done = true; } } }
  if (!done) inFree.push(S.k);
}

// 1. what there is: the route's barrier on both sides, the rings' circles, the walls across three of the rings; nothing of the side roads' or the lanes'
const shutR = runs.filter(r => r.shut);
{
  const by = [0, 0, 0, 0], cnt = [0, 0, 0, 0]; for (const r of runs) { if (r.shut) continue; by[r.k] += len(r); cnt[r.k]++; }
  const circ = new Set(runs.filter(r => r.k === 2 && !r.shut).map(r => r.ref)), withShut = T.rings.filter(R => R.shut.length);
  // each wall on its ring's ray (rings[].shut: the angle), from the ring road's inner edge or nearer the island out to the zone's circle
  const wallBad = [], wallTxt = [];
  for (const r of shutR) { const R = T.rings[r.ref], P = r.pts, m = P.length / 2, a0 = Math.hypot(P[0] - R.x, P[1] - R.z), a1 = Math.hypot(P[2 * m - 2] - R.x, P[2 * m - 1] - R.z);
    let off = 0; for (let j = 0; j < m; j++) { const dx = P[2 * j] - R.x, dz = P[2 * j + 1] - R.z; off = Math.max(off, Math.min(...R.shut.map(S => Math.abs(-dx * S.uz + dz * S.ux) + (dx * S.ux + dz * S.uz < 0 ? 1e3 : 0)))); }
    wallTxt.push(`ring ${r.ref}: ${a0.toFixed(2)}-${a1.toFixed(2)} m from its centre (the island ${R.ri.toFixed(2)}, the road ${(R.r - R.hw).toFixed(2)}-${(R.r + R.hw).toFixed(2)}, the circle ${R.zr.toFixed(2)})`);
    if (r.k !== 2 || r.side !== 0 || r.closed || off > 0.05 || a0 > R.r - R.hw || Math.abs(a1 - R.zr) > 0.1) wallBad.push(`ring ${r.ref}: ${off.toFixed(2)} m off its ray, ${a0.toFixed(2)}-${a1.toFixed(2)} m`); }
  check('fence: the route\'s barrier on both sides of the whole road (def.barrier), the four roundabouts\' zone circles; none down a side road (closed by the barrier across its mouth: def.sideClosed) nor round an oncoming lane (no free ground of its own: def.altFree false)',
    by[0] > 2 * 0.9 * T.len && runs.some(r => r.k === 0 && r.side < 0) && runs.some(r => r.k === 0 && r.side > 0) && T.rings.length === 4 && circ.size === 4 && by[2] > 300 && !cnt[1] && !cnt[3] && !runs.some(r => r.k === 1 || r.k === 3) && !!def.barrier && def.sideClosed && def.altFree === false && !T.altC.length,
    `route ${(by[0] / 1000).toFixed(2)} km in ${cnt[0]} runs (the road is ${(T.len / 1000).toFixed(2)} km, two sides), the rings' circles ${by[2].toFixed(0)} m in ${cnt[2]} pieces round ${circ.size} of ${T.rings.length} rings, side roads ${cnt[1]}, lanes ${cnt[3]} (${T.altC.length} lanes free ground of their own); ${(runs.reduce((a, r) => a + len(r), 0) / 1000).toFixed(1)} km in all`);
  check('fence: a wall across the road of each of the three rings the route goes round the long way (rings[].shut), on its ray from the island\'s side of the ring road out to the zone\'s circle; none at Smlednik',
    shutR.length === 3 && withShut.length === 3 && withShut.every(R => shutR.filter(r => T.rings[r.ref] === R).length === R.shut.length) && !wallBad.length,
    (wallBad.length ? 'wrong: ' + wallBad.join('; ') + '; ' : '') + `${shutR.length} walls, ${shutR.map(r => len(r).toFixed(1) + ' m').join(', ')}: ${wallTxt.join('; ')}`);
  check('fence: skipped where the parapet or the abutments are the barrier (the bridge, the overpass)', FR.skips.length === 2 && FR.skips.some(([a, b]) => b - a > 118 && b - a < 125) && FR.skips.some(([a, b]) => b - a > 9 && b - a < 13),
    FR.skips.map(([a, b]) => `${(a - T.startS).toFixed(0)}-${(b - T.startS).toFixed(0)} m`).join(', '));
}

// distance from a point to the nearest line of the runs (a hash of the runs' segments); skip: a run left out
const SEG = new Map(), CELL = 16;
for (const r of runs) for (let k = 0; k + 3 < r.pts.length; k += 2) { const ax = r.pts[k], az = r.pts[k + 1], bx = r.pts[k + 2], bz = r.pts[k + 3], s = { ax, az, bx, bz, r };
  for (let a = Math.floor((Math.min(ax, bx) - 1) / CELL); a <= Math.floor((Math.max(ax, bx) + 1) / CELL); a++) for (let b = Math.floor((Math.min(az, bz) - 1) / CELL); b <= Math.floor((Math.max(az, bz) + 1) / CELL); b++) { const key = a + ',' + b; let L = SEG.get(key); if (!L) SEG.set(key, L = []); L.push(s); } }
const distTo = (x, z, skip) => { let best = 1e9; const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
  for (let a = cx - 1; a <= cx + 1; a++) for (let b = cz - 1; b <= cz + 1; b++) { const L = SEG.get(a + ',' + b); if (!L) continue; for (const s of L) { if (s.r === skip) continue; const dx = s.bx - s.ax, dz = s.bz - s.az, l2 = dx * dx + dz * dz || 1e-9, t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / l2)); best = Math.min(best, Math.hypot(x - s.ax - dx * t, z - s.az - dz * t)); } }
  return best; };

// 2. every 6 m on both sides: the barrier has a fence on it (within 0.3 m), except inside a ring's zone, on the bridge, under the overpass, in the corner of a bend
// (there the nearest leg's wall, not this barrier line, is the wall)
{
  const ringIn = (x, z, m) => T.rings.some(R => Math.hypot(x - R.x, z - R.z) < R.zr + m), skipAt = (s, m) => FR.skips.some(([a, b]) => s >= a - m && s <= b + m);
  let total = 0, fenced = 0, miss = 0, missFar = 0; const ex = { 'inside a ring zone': 0, 'bridge': 0, 'overpass': 0, 'corner of a bend': 0, 'step in the barrier': 0, 'side road\'s mouth': 0, 'edge of an exception': 0 }, missAt = [];
  for (const sd of [-1, 1]) for (let i = 0; i < N; i += 3) {
    if (i < 3 || i > N - 4) continue;   // (the road's two ends: the concrete blocks across it)
    const bar = sd > 0 ? T.br[i] : T.bl[i], s = i * ds, si = sd > 0 ? 1 : 0; total++;
    // the barrier line at this sample: along its normal to where wallCollide really stops a car (the barrier changes fast in some places: sample i's own offset is then not on the wall)
    let u = null; for (let v = -3; v <= 3.001; v += 0.05) { const xx = T.px[i] + T.nx[i] * sd * (bar + v), zz = T.pz[i] + T.nz[i] * sd * (bar + v); if (pen(xx, zz, i) > 0.002) { u = v; break; } }
    const corner = u === null, x = T.px[i] + T.nx[i] * sd * (bar + (u || 0)), z = T.pz[i] + T.nz[i] * sd * (bar + (u || 0));
    const B = sd > 0 ? T.br : T.bl, step = Math.abs(B[i + 1] - B[i - 1]) > 2.5, G = T.gap[si], gap = G[i] || (i > 0 && G[i - 1]) || (i < N - 1 && G[i + 1]);
    const clear = !gap && !corner && !step && !ringIn(x, z, 0.3) && !skipAt(s, 3), d = distTo(x, z);
    // (a point within 0.3 m of an exception's edge may go either way: the exceptions are counted with the plain tests)
    if (clear) { if (d <= 0.3) fenced++; else { miss++; if (d > 1) missFar++; if (missAt.length < 40) missAt.push(`${sd < 0 ? 'L' : 'R'}${(s - T.startS).toFixed(0)}:${d.toFixed(1)}m`); } }
    else if (d > 0.3) { if (ringIn(x, z, 0)) ex['inside a ring zone']++; else if (skipAt(s, 0) && def.bridges.some(([a, b]) => s - T.startS >= a - 3 && s - T.startS <= b + 3)) ex['bridge']++; else if (skipAt(s, 0)) ex['overpass']++; else if (corner) ex['corner of a bend']++; else if (step) ex['step in the barrier']++; else if (gap) ex['side road\'s mouth']++; else ex['edge of an exception']++; }
  }
  const nEx = Object.values(ex).reduce((a, b) => a + b, 0);
  check('fence: every 6 m on both sides the barrier has a fence on it (within 0.3 m) except inside a ring\'s zone, on the bridge, under the overpass, in a bend\'s corner; none open at a side road\'s mouth', miss <= 3 && missFar === 0 && fenced > 0.8 * total && nEx < 0.08 * total && !ex['side road\'s mouth'],
    `${total} points: ${fenced} fenced, ${miss} not within 0.3 m (none over 1 m)${missAt.length ? ' (' + missAt.join(' ') + ')' : ''}, ${nEx} exceptions (${Object.entries(ex).filter(([, v]) => v).map(([k, v]) => v + ' ' + k).join(', ')}) = ${(100 * nEx / total).toFixed(1)} %`);
}

// 3. the lines are never on the road: 0.5 m clear at least of the asphalt and the sidewalks of every leg (the run-off between), the circles clear of the rings' roads;
// a ring wall crosses its ring's road (the part the route leaves out), never the route's
{
  let nPts = 0, onRoute = 0, onRing = 0, minRoute = 1e9, minWall = 1e9, minRing = 1e9; const cl = [], where = [];
  for (const r of runs) {
    const P = r.pts;
    for (let k = 0; k + 3 < P.length; k += 2) {
      const ax = P[k], az = P[k + 1], dx = P[k + 2] - ax, dz = P[k + 3] - az, m = Math.max(1, Math.ceil(Math.hypot(dx, dz)));
      for (let q = 0; q < m + (k + 4 >= P.length ? 1 : 0); q++) {
        const x = ax + dx * q / m, z = az + dz * q / m, e = edgeClear(x, z); nPts++;
        if (e !== null) { if (r.shut) minWall = Math.min(minWall, e); else { minRoute = Math.min(minRoute, e); if (r.k === 0) cl.push(e); } if (e < 0.5) { onRoute++; if (where.length < 5) where.push(`${kindOf(r)} at ${x.toFixed(1)},${z.toFixed(1)}: ${e.toFixed(2)} m`); } }
        if (!r.shut) for (const R of T.rings) { const e2 = Math.abs(Math.hypot(x - R.x, z - R.z) - R.r) - R.hw; minRing = Math.min(minRing, e2); if (e2 < 0.5) onRing++; }
      }
    }
  }
  cl.sort((a, b) => a - b);
  check('fence: never on the road — 0.5 m clear at least of the asphalt and the sidewalks of every leg of the road (the run-off in front), the circles clear of the rings\' roads; a ring wall only across its ring\'s road, clear of the route\'s',
    onRoute === 0 && onRing === 0 && minRoute >= 0.5 && minWall >= 0.5,
    `${nPts} points every ~1 m: the route's barrier ${cl[0].toFixed(2)} m past the edge at the nearest, ${pct(cl, 0.5).toFixed(1)} m at the median, ${(100 * cl.filter(v => v > 8.5).length / cl.length).toFixed(0)} % of it over 8.5 m; the nearest of any line to the route's road ${minRoute.toFixed(2)} m, of a ring wall ${minWall.toFixed(2)} m, of a circle to a ring's road ${minRing.toFixed(2)} m; ${onRoute} / ${onRing} too close${where.length ? ' (' + where.join('; ') + ')' : ''}`);
}

// 4. the lines are the wall: through the real wallCollide a car is pushed by the wall where the fence stands (to within 4 cm at the median, 40 cm at the worst); a
// ring wall: a car from either side is stopped at its face, its half thickness (25 cm) from the line
{
  let tested = 0, noWall = 0; const off = [], fails = [];
  const wallT = [], wallFails = [];
  for (const r of runs) {
    const P = r.pts, L = len(r); let nextAt = r.shut ? 1 : 3, run = 0;
    for (let k = 0; k + 3 < P.length; k += 2) {
      const ax = P[k], az = P[k + 1], dx = P[k + 2] - ax, dz = P[k + 3] - az, l = Math.hypot(dx, dz) || 1e-9;
      while (nextAt <= run + l) {
        const t = (nextAt - run) / l; nextAt += r.shut ? 1 : 8; if ((nextAt - (r.shut ? 1 : 8)) < 1 || L - (run + t * l) < 1) continue;
        const x = ax + dx * t, z = az + dz * t, nx = -dz / l * r.sg, nz = dx / l * r.sg, h = T.nearestIdx(x, z);
        if (distTo(x, z, r) < 0.6) continue;   // (where another line meets it, a corner: the wall there is either's)
        if (r.shut) {   // (from either side: the car comes from 1.5 m away on that side; the first place it is pushed back, out from the line)
          for (const sd of [-1, 1]) { let face = null; for (let u = 0.6; u >= -0.6001; u -= 0.01) { const px = x + nx * sd * u, pz = z + nz * sd * u; if (pen(px, pz, h, x + nx * sd * 1.5, z + nz * sd * 1.5) > 0.002) { face = u; break; } }
            wallT.push(face); if (face === null || Math.abs(face - 0.25) > 0.03) wallFails.push(`ring ${r.ref} at ${x.toFixed(1)},${z.toFixed(1)} from the ${sd > 0 ? '+' : '-'} side: ${face === null ? 'no wall' : (face * 100).toFixed(0) + ' cm'}`); }
          continue;
        }
        tested++;
        let wall = null; for (let u = -0.6; u <= 0.6001; u += 0.02) if (pen(x + nx * u, z + nz * u, h, x - nx * 1.5, z - nz * 1.5) > 0.002) { wall = u; break; }   // (the first place along the outward normal where a car coming from inside is pushed)
        if (wall === null) { if (!free.any(x + nx * 0.7, z + nz * 0.7)) { noWall++; if (fails.length < 5) fails.push(`${kindOf(r)} ${r.ref} at ${x.toFixed(0)},${z.toFixed(0)}: no wall within 0.6 m`); } }
        else { off.push(Math.abs(wall)); if (Math.abs(wall) > 0.4 && fails.length < 5) fails.push(`${kindOf(r)} ${r.ref} at ${x.toFixed(0)},${z.toFixed(0)}: wall ${wall.toFixed(2)} m`); }
      }
      run += l;
    }
  }
  off.sort((a, b) => a - b); const med = pct(off, 0.5), p95 = pct(off, 0.95), mx = off[off.length - 1], badN = off.filter(v => v > 0.4).length + noWall;
  check('fence: the lines are the wall (wallCollide): a car is stopped where the fence stands, 4 cm at the median, 40 cm at the worst', tested > 1500 && med <= 0.04 && p95 <= 0.2 && badN <= 0.01 * tested,
    `${tested} points every ~8 m: wall ${(med * 100).toFixed(0)} cm from the line at the median, ${(p95 * 100).toFixed(0)} cm at 95 %, ${(mx * 100).toFixed(0)} cm at most; ${badN} off by more than 40 cm or without a wall${fails.length ? '; e.g. ' + fails.join('; ') : ''}`);
  const okW = wallT.filter(v => v !== null);
  check('ring walls: a car from either side is stopped at the wall\'s face, its half thickness (25 cm) from the fence\'s line, all along it', wallT.length >= 60 && !wallFails.length,
    `${wallT.length} probes every 1 m on both sides of ${shutR.length} walls: the face ${(Math.min(...okW) * 100).toFixed(0)}-${(Math.max(...okW) * 100).toFixed(0)} cm from the line${wallFails.length ? '; wrong: ' + wallFails.slice(0, 5).join('; ') : ''}`);
  // ... and it puts the car back where it touched it, not somewhere else: a car's front corner 0.1 or 0.3 m past the line (the car behind it on the free side, where it
  // was a step before; its hint the line's own sample) is pushed back by about that much, never metres (a jump through the run-off, out of a ring)
  const th = [], jumps = new Map();
  for (const r of runs) {
    const P = r.pts; let acc = 2;
    for (let k = 0; k + 3 < P.length; k += 2) {
      const ax = P[k], az = P[k + 1], dx = P[k + 2] - ax, dz = P[k + 3] - az, l = Math.hypot(dx, dz); if (l < 1e-6) continue;
      for (let t = 0; t < l; t += 0.5) { acc += 0.5; if (acc < 2) continue; acc = 0;
        const x = ax + dx * t / l, z = az + dz * t / l, h = r.k === 0 && r.ix[k / 2] >= 0 ? r.ix[k / 2] : T.nearestIdx(x, z);
        if (distTo(x, z, r) < 1) continue;   // (a corner where two lines meet: hit at an angle there)
        if (r.k === 0 && T.k[h] * r.side * (r.side > 0 ? T.br[h] : T.bl[h]) > 0.6) continue;   // (the inside tip of a hairpin, the barrier near the bend's centre: the line folds back on itself)
        for (const sd of r.shut ? [1, -1] : [1]) for (const dep of [0.1, 0.3]) {
          // (n: out of the free ground across the line; a ring wall: towards the side the car comes from, its face 25 cm out, the corner that far less the depth)
          const nx = -dz / l * r.sg * sd, nz = dx / l * r.sg * sd, o = r.shut ? 0.25 - dep : dep, cx = x + nx * o, cz = z + nz * o;
          const hd = r.shut ? Math.atan2(-nz, -nx) : Math.atan2(nz, nx), bx = -Math.cos(hd), bz = -Math.sin(hd);   // (heading into the wall; the other corners behind it, 0.6-1 m back on the free side)
          const c = mkCar(cx, cz, h, cx + bx * 1.5, cz + bz * 1.5); c.h = hd; c.corners = [[0, 0], [-0.6, 0], [-0.8, 0], [-1.0, 0]]; C.wallCollide(c, T, false);
          const p = Math.hypot(c.x - cx, c.z - cz); th.push(p - dep);
          if (p - dep > 0.5) { const q = T.query(cx, cz, h, {}), key = r.k === 2 ? `the ring at d ${Math.round(def.rings[r.ref].d)}${r.shut ? '\'s wall' : ''}` : `the route at d ${Math.round((h * ds - T.startS) / 10) * 10} (${r.side < 0 ? 'left' : 'right'})`;
            let g = jumps.get(key); if (!g) jumps.set(key, g = { p: 0, n: 0, at: null, sr: new Set(), deep: 0 }); g.n++; if (q.k >= 0) g.sr.add(q.k); if (q.deep) g.deep++;
            if (p > g.p) { g.p = p; g.dep = dep; g.at = `${cx.toFixed(1)},${cz.toFixed(1)}`; } }
        }
      }
    }
  }
  th.sort((a, b) => a - b); const J = [...jumps.entries()].sort((a, b) => b[1].p - a[1].p), nJ = J.reduce((a, [, g]) => a + g.n, 0);
  check('the wall puts a car back where it touched it: a front corner 0.1 or 0.3 m past any line (the car behind it on the free side) is pushed back by about that much, never metres',
    th.length > 10000 && !J.length && pct(th, 0.99) < 0.1,
    `${th.length} probes every 2 m: pushed back ${Math.round(pct(th, 0.5) * 100) || 0} cm more than its depth at the median, ${Math.round(pct(th, 0.99) * 100) || 0} cm at 99 %${J.length ? `; ${nJ} probes pushed over 0.5 m too far: ` + J.map(([k, g]) => `${k}: ${g.n} probes, up to ${g.p.toFixed(1)} m for ${g.dep} m at ${g.at} (the corner's query in ${g.sr.size ? 'side road ' + [...g.sr].join(', ') + (g.deep ? `, ${g.deep} of them "deep"` : '') : 'the road'})`).join('; ') : ''}`);
}

// 5. the other way round, the walls across the rings: along each wall's ray, wherever a car crossing it is stopped while the ground beside it is free (a car 1 m off
// the ray either side goes freely: the island's edge to the zone's circle), the fence's wall stands (its run spans that, to 0.3 m); no invisible wall on the ring's asphalt
{
  const rows = [], badW = [];
  for (const r of shutR) {
    const R = T.rings[r.ref], P = r.pts, m = P.length / 2, ux = (P[2 * m - 2] - P[0]), uz = (P[2 * m - 1] - P[1]), ul = Math.hypot(ux, uz), S = { ux: ux / ul, uz: uz / ul }, vx = -S.uz, vz = S.ux;
    const ta = (P[0] - R.x) * S.ux + (P[1] - R.z) * S.uz, tb = (P[2 * m - 2] - R.x) * S.ux + (P[2 * m - 1] - R.z) * S.uz;
    let w0 = null, w1 = null, out = 0;
    for (let t = R.ri - 1; t <= R.zr + 1.001; t += 0.25) {
      const x = R.x + S.ux * t, z = R.z + S.uz * t, h = T.nearestIdx(x, z);
      const stop = [1, -1].every(sd => pen(x + vx * sd * 0.1, z + vz * sd * 0.1, h, x - vx * sd * 1.5, z - vz * sd * 1.5) > 0.3), freeBy = [1, -1].every(sd => pen(x + vx * sd, z + vz * sd, h) < 0.002);
      if (!stop || !freeBy) continue;
      if (w0 === null) w0 = t; w1 = t; if (t < ta - 0.3 || t > tb + 0.3) out += 0.25;
    }
    rows.push(`ring ${r.ref}: the wall stops a car from ${w0 === null ? '-' : w0.toFixed(2)} to ${w1 === null ? '-' : w1.toFixed(2)} m from the centre (the island ${R.ri.toFixed(2)}, the circle ${R.zr.toFixed(2)}), the fence ${ta.toFixed(2)}-${tb.toFixed(2)} m`);
    if (w0 === null || out > 0) badW.push(`ring ${r.ref} (${R.x}, ${R.z}): ${out.toFixed(2)} m of the wall without its fence`);
  }
  check('ring walls: the wall a car meets across a ring\'s road is the fence\'s (its run spans all of it, from the island\'s edge out to the zone\'s circle, to 0.3 m): no invisible wall on the ring\'s asphalt', shutR.length === 3 && !badW.length,
    (badW.length ? badW.join('; ') + ' | ' : '') + rows.join('; '));
}

// 6. the side roads: closed at the barrier across the mouth, out in the run-off; the runs end at each other, the bridge, the overpass, the road's ends, the island
{
  const far = [...blind].filter(([, b]) => distTo(b.x, b.z) > 1.5).map(([k, b]) => `${k}@${b.t.toFixed(0)} m: ${distTo(b.x, b.z).toFixed(1)} m from a fence`);
  const past = [...blind].map(([k, b]) => ({ k, e: edgeClear(b.x, b.z) })).filter(o => o.e !== null), pe = past.map(o => o.e).sort((a, b) => a - b), near = past.filter(o => o.e < 0.5);
  check('side roads: closed — a car driving into any of them from the road is stopped at the barrier across its mouth (within 1.5 m of its line), out in the run-off (0.5 m past the asphalt or the sidewalk at least), or it never leaves the free ground (none goes through)',
    !hole.size && !far.length && blind.size >= 90 && !near.length,
    `${blind.size} of ${T.stubs.length} side roads closed, ${inFree.length} in the free ground all their way (${inFree.join(', ')}: they end in the run-off or a ring's zone), stopped ${pe[0].toFixed(2)}-${pe[pe.length - 1].toFixed(2)} m past the road's edge (median ${pct(pe, 0.5).toFixed(1)} m)${hole.size ? '; through the barrier: ' + [...hole].map(([k, h]) => `${k} (${h.t} m down it, ${h.e.toFixed(1)} m past the barrier)`).join(', ') : ''}${far.length ? '; stopped away from the fence: ' + far.join(', ') : ''}${near.length ? '; at the road\'s edge: ' + near.map(o => `${o.k} ${o.e.toFixed(2)} m`).join(', ') : ''}`);
  const ends = []; for (const r of runs) { const P = r.pts; if (!r.closed) { ends.push({ x: P[0], z: P[1], r, first: true }); ends.push({ x: P[P.length - 2], z: P[P.length - 1], r, first: false }); } }
  const cnt = { 'meets another run\'s end': 0, 'meets another run\'s line': 0, 'the bridge': 0, 'the overpass': 0, 'the end of the road': 0, 'a ring wall at the island': 0 }, lost = [];
  for (const e of ends) {
    const qm = T._qMain(e.x, e.z, T.nearestIdx(e.x, e.z), {}), s = qm.s, R = e.r.shut ? T.rings[e.r.ref] : null, rr = R ? Math.hypot(e.x - R.x, e.z - R.z) : 0;
    if (ends.some(f => f !== e && Math.hypot(f.x - e.x, f.z - e.z) < 0.6)) cnt['meets another run\'s end']++;
    else if (distTo(e.x, e.z, e.r) < 0.6) cnt['meets another run\'s line']++;
    else if (R && rr > R.ri - 0.3 && rr < R.r - R.hw + 0.3) cnt['a ring wall at the island']++;
    else if (e.r.k === 0 && FR.skips.some(([a, b]) => Math.abs(s - a) < 4 || Math.abs(s - b) < 4)) cnt[def.bridges.some(([a, b]) => Math.abs(s - T.startS - a) < 5 || Math.abs(s - T.startS - b) < 5) ? 'the bridge' : 'the overpass']++;
    else if (e.r.k === 0 && (s < 3 || s > T.len - 3)) cnt['the end of the road']++;
    else lost.push(`${kindOf(e.r)}${e.r.ref >= 0 ? ' ' + e.r.ref : ''} ${e.first ? 'start' : 'end'} at ${e.x.toFixed(1)},${e.z.toFixed(1)} (d ${(s - T.startS).toFixed(0)})`);
  }
  check('fence: the runs meet (corners, T-junctions at the rings\' circles), or end at the bridge, the overpass, the ends of the road and (a ring wall) the island; at most a couple of loose ends',
    lost.length <= 2 && cnt['the bridge'] === 4 && cnt['the overpass'] === 4 && cnt['the end of the road'] === 4,
    `${ends.length} ends: ${Object.entries(cnt).map(([k, v]) => v + ' ' + k).join(', ')}, ${lost.length} loose${lost.length ? ' (' + lost.slice(0, 5).join('; ') + (lost.length > 5 ? '; ...' : '') + ')' : ''}`);
}

// 7. no house inside the free ground (a car would drive through it): the buildings the scenery builds (def.bld without the ones on the road, as buildMedvode)
{
  const Q = {}, onRoadB = (x, z, m) => { const q = T.query(x, z, T.nearestIdx(x, z), Q); if (q.k >= 0) { const S = T.stubs[q.k]; if (q.st <= S.Lend && Math.abs(q.u) <= (q.st < S.te ? T.stubHw(S, q.st) : S.hw) + m) return true; } return !q.deep && !q.over && Math.abs(q.d) < wE(q.d > 0 ? 1 : 0, q.a) + m; };
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
  check('houses: none stands inside the free ground (the route\'s run-off out to the barrier, a ring\'s zone) by more than 30 cm; the few that did are left out', inside === 0 && left < 40 && special === 0,
    `${kept} of ${kept + left + onRoad} buildings built (${onRoad} on the road were dropped before, ${left} cut by the fence's lines or standing in the free ground are left out now), ${inside} still inside${where.length ? ': ' + where.join('; ') : ''}; the nearest corner is ${closest.toFixed(2)} m from a fence line`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
