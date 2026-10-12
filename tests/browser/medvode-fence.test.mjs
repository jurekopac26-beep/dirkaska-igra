// Medvode's barrier, as built: a race circuit's steel barrier (two W-beams one over the other on steel posts every ~2.5 m; the meshes are still called
// 'mvFence') on the whole barrier line (World.buildMedvode, out.fence), checked in the browser against the physics (the geometry itself:
// tests/medvode-fence.test.js). Reads what the world built (Render.world.fence: per line its columns as built, 8 cm outside the wall's line, hid: the columns
// with no rail, where a house's front or a garden or retaining wall stands at the line and is the barrier itself, rail: the rail's length) and asserts
//   - what was built: the route's barrier on both sides of the whole road, the four rings' circles and the walls across three of them; nothing down a side road
//     or round an oncoming lane; the rail on nearly all of it, in a few meshes that cast no shadow
//   - the rail is left out only where a house or a wall the world built stands at the line (within 0.7 m of each column without it, 1.5 m between two at a
//     wall's corner): there the house or the wall is the barrier, no hole
//   - along the whole route, every 6 m on both sides, a fence within 0.3 m of the wall (where wallCollide stops a car along the barrier's normal) except inside a
//     roundabout's zone, on the bridge, under the overpass, in a bend's corner (counted)
//   - the fence never lies on the road: 0.5 m clear at least of the asphalt and the sidewalks of every leg (the run-off in front), the circles clear of the rings' roads
//   - no house that was built stands inside the free ground; the houses cut by the fence are counted
//   - the tyre stacks (knockable 'tstack' props): two rows along each ring's wall, one at each end of the rail where it stops at a house's corner or a run ends;
//     each beside the barrier, none on the road's asphalt or sidewalk
//   - what it costs: its vertices and meshes, the draw calls and vertices it adds to a frame (844x390, phone budget) and that it is seen from the iso and the chase camera
//     (the pixels that change when it is hidden)
//   node tests/browser/medvode-fence.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Medvode: the barrier');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 1, camera: 'chase', zoom: 1.2, weather: 'dry' }, { width: 844, height: 390 }, { seed: 12345 });
  await page.evaluate(() => {   // (count every WebGL draw, all passes)
    window.__gl = { calls: 0, verts: 0 };
    const gl = document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
    const P = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
    wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]);
    wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]);
  });
  await startTrack(page, 'medvode');

  // 1. what was built
  const B = await page.evaluate(() => {
    const W = Render.world, F = W.fence, def = window.__game.race.track.def, ms = []; W.root.traverse(o => { if (o.name === 'mvFence') ms.push(o); });
    let verts = 0, tris = 0, nan = 0, nonShadow = 0; for (const m of ms) { const g = m.geometry, p = g.attributes.position.array; verts += g.attributes.position.count; tris += g.index.count / 3; if (!m.castShadow && m.receiveShadow) nonShadow++; for (let k = 0; k < p.length; k++) if (!Number.isFinite(p[k])) { nan++; break; } }
    if (!F) return { has: false };
    // a ring's wall: a line of the ring's (k 2) along its ray at one of rings[].shut's angles
    const wallOf = (l) => { if (l.k !== 2) return null; const r = def.rings[l.ref], C = l.cols; if (!r || !r.shut) return null;
      for (const a of r.shut) { const ux = Math.cos(a), uz = Math.sin(a); let ok = true; for (let j = 0; j < C.length / 3 && ok; j++) { const dx = C[3 * j] - r.c[0], dz = C[3 * j + 2] - r.c[1]; if (Math.abs(-dx * uz + dz * ux) > 0.15 || dx * ux + dz * uz < 0) ok = false; } if (ok) return a; } return null; };
    const kinds = {}; let walls = 0, wallLen = 0, rail = 0, hidden = 0, posts = 0;
    for (const l of F.lines) { const w = wallOf(l), key = w !== null ? 'walls' : l.k; if (w !== null) { walls++; wallLen += l.len; } kinds[key] = (kinds[key] || 0) + l.len; rail += l.rail; hidden += l.len - l.rail; posts += l.posts; }
    return { has: true, stats: F.stats, meshes: ms.length, verts, tris, nan, nonShadow, kinds, walls, wallLen, rail, hidden, posts, lines: F.lines.length, shut: def.rings.reduce((a, r) => a + (r.shut || []).length, 0) };
  });
  T.check('built: the barrier on both sides of the whole route, round the four rings\' zones and across three rings\' roads (13 km), nothing down a side road or round an oncoming lane, in a few meshes that cast no shadow',
    B.has && B.stats.length > 12500 && B.kinds[0] > 12000 && !B.kinds[1] && !B.kinds[3] && B.kinds[2] > 300 && B.walls === 3 && B.shut === 3 && B.meshes === B.stats.meshes && B.meshes > 6 && B.meshes < 45 && B.nonShadow === B.meshes && !B.nan,
    B.has ? `${(B.stats.length / 1000).toFixed(1)} km in ${B.lines} lines (route ${(B.kinds[0] / 1000).toFixed(1)} km, the rings' circles ${(B.kinds[2] || 0).toFixed(0)} m, ${B.walls} ring walls ${B.wallLen.toFixed(0)} m, side roads ${((B.kinds[1] || 0) / 1000).toFixed(1)} km, lanes ${(B.kinds[3] || 0).toFixed(0)} m), ${B.meshes} meshes` : 'no out.fence');
  T.check('built: the rail on nearly all of it (95 % at least: left out only in front of a house\'s or a wall\'s front), a post every ~2.5 m of rail', B.has && B.rail > 0.95 * B.stats.length && B.posts > 0.9 * B.rail / 2.5 && B.posts === B.stats.posts,
    B.has ? `the rail ${(B.rail / 1000).toFixed(2)} km of ${(B.stats.length / 1000).toFixed(2)} km (${B.hidden.toFixed(0)} m left out, ${(100 * B.hidden / B.stats.length).toFixed(1)} %), ${B.posts} posts (one per ${(B.rail / B.posts).toFixed(2)} m), ${B.stats.columns} columns` : '');
  T.check('vertex count: under 75k vertices in all (10 a column of the rail, 4 a post; indexed, thinned out along straight stretches)', B.has && B.verts < 75000 && B.verts === B.stats.vertices,
    `${B.verts} vertices, ${B.tris} triangles (${(B.verts / (B.stats ? B.stats.length : 1)).toFixed(1)} per metre)`);

  // 2. against the physics and the world: coverage, never on the road, the houses, the rail's gaps, the tyre stacks
  const R = await page.evaluate(() => {
    const g = window.__game, Tr = g.race.track, def = Tr.def, W = Render.world, F = W.fence, N = Tr.N, ds = Tr.ds;
    const SEG = new Map(), CELL = 16;   // the built lines' segments (x, y, z of the columns), hashed
    for (const l of F.lines) { const C = l.cols; for (let j = 0; j + 1 < C.length / 3; j++) { const ax = C[3 * j], az = C[3 * j + 2], bx = C[3 * j + 3], bz = C[3 * j + 5], s = { ax, az, bx, bz };
      for (let a = Math.floor((Math.min(ax, bx) - 1) / CELL); a <= Math.floor((Math.max(ax, bx) + 1) / CELL); a++) for (let b = Math.floor((Math.min(az, bz) - 1) / CELL); b <= Math.floor((Math.max(az, bz) + 1) / CELL); b++) { const key = a + ',' + b; let L = SEG.get(key); if (!L) SEG.set(key, L = []); L.push(s); } } }
    const distTo = (x, z) => { let best = 1e9; const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
      for (let a = cx - 1; a <= cx + 1; a++) for (let b = cz - 1; b <= cz + 1; b++) { const L = SEG.get(a + ',' + b); if (!L) continue; for (const s of L) { const dx = s.bx - s.ax, dz = s.bz - s.az, l2 = dx * dx + dz * dz || 1e-9, t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / l2)); best = Math.min(best, Math.hypot(x - s.ax - dx * t, z - s.az - dz * t)); } }
      return best; };
    const mkCar = (x, z, h) => ({ x, z, px: x, pz: z, h: 0, vx: 0, vz: 0, w: 0, m: { mass: 1000 }, I: 1000, corners: [[0, 0], [0, 0], [0, 0], [0, 0]], q: { i: h }, hitWall: 0, fxWall: 0, isPlayer: false, pitWant: false, inPit: false });
    const ringIn = (x, z, m) => Tr.rings.some(R => Math.hypot(x - R.x, z - R.z) < R.zr + m), skipAt = (s, m) => F.skips.some(([a, b]) => s >= a - m && s <= b + m);
    // how far a point lies past the asphalt and the sidewalk of the nearest leg (every sample within ~50 m nearer than its neighbours; the edges interpolated)
    const WK = Tr.walk, wE = (si, i) => Tr.wAt(i) + (WK ? WK[si][i] : 0), SH = new Map(), SC = 16;
    for (let i = 0; i < N; i++) { const k = Math.floor(Tr.px[i] / SC) + ',' + Math.floor(Tr.pz[i] / SC); let L = SH.get(k); if (!L) SH.set(k, L = []); L.push(i); }
    const edgeClear = (x, z) => { const cx = Math.floor(x / SC), cz = Math.floor(z / SC), d2 = (i) => (Tr.px[i] - x) ** 2 + (Tr.pz[i] - z) ** 2; let best = null;
      for (let a = cx - 3; a <= cx + 3; a++) for (let b = cz - 3; b <= cz + 3; b++) { const L = SH.get(a + ',' + b); if (!L) continue;
        for (const i of L) { if ((i > 0 && d2(i - 1) < d2(i)) || (i < N - 1 && d2(i + 1) < d2(i))) continue; const q = Tr._qMain(x, z, i, {}); if (q.over) continue;
          const si = q.d > 0 ? 1 : 0, e = Math.abs(q.d) - (wE(si, q.a) * (1 - q.t) + wE(si, Math.min(N - 1, q.a + 1)) * q.t); if (best === null || e < best) best = e; } }
      return best; };
    // every 6 m on both sides
    let total = 0, fenced = 0, miss = 0, missFar = 0; const ex = {}, missAt = [];
    for (const sd of [-1, 1]) for (let i = 3; i < N - 3; i += 3) {
      const bar = sd > 0 ? Tr.br[i] : Tr.bl[i], s = i * ds; total++;
      let u = null; for (let v = -3; v <= 3.001; v += 0.05) { const xx = Tr.px[i] + Tr.nx[i] * sd * (bar + v), zz = Tr.pz[i] + Tr.nz[i] * sd * (bar + v), c = mkCar(xx, zz, i); Core.wallCollide(c, Tr, false); if (Math.hypot(c.x - xx, c.z - zz) > 0.002) { u = v; break; } }
      const x = Tr.px[i] + Tr.nx[i] * sd * (bar + (u || 0)), z = Tr.pz[i] + Tr.nz[i] * sd * (bar + (u || 0)), B = sd > 0 ? Tr.br : Tr.bl, step = Math.abs(B[i + 1] - B[i - 1]) > 2.5, G = Tr.gap[sd > 0 ? 1 : 0], gap = G[i] || G[i - 1] || G[i + 1];
      const clear = !gap && u !== null && !step && !ringIn(x, z, 0.3) && !skipAt(s, 3), d = distTo(x, z);
      if (clear) { if (d <= 0.3) fenced++; else { miss++; if (d > 1) missFar++; if (missAt.length < 12) missAt.push((sd < 0 ? 'L' : 'R') + (s - Tr.startS).toFixed(0) + ':' + d.toFixed(1) + 'm'); } }
      else if (d > 0.3) { const k = ringIn(x, z, 0) ? 'inside a ring zone' : skipAt(s, 0) ? (def.bridges.some(([a, b]) => s - Tr.startS >= a - 3 && s - Tr.startS <= b + 3) ? 'bridge' : 'overpass') : u === null ? 'corner of a bend' : step ? 'step in the barrier' : gap ? 'side road mouth' : 'edge of an exception'; ex[k] = (ex[k] || 0) + 1; }
    }
    // never on the road: the built columns and the points between them (every ~1 m, 8 cm out as built)
    let nPts = 0, onRoute = 0, onRing = 0, minRoute = 1e9, minRing = 1e9; const near = [];
    const isWall = (l) => { const r = def.rings[l.ref]; if (l.k !== 2 || !r || !r.shut) return false; const C = l.cols; return r.shut.some(a => { const ux = Math.cos(a), uz = Math.sin(a); for (let j = 0; j < C.length / 3; j++) { const dx = C[3 * j] - r.c[0], dz = C[3 * j + 2] - r.c[1]; if (Math.abs(-dx * uz + dz * ux) > 0.15 || dx * ux + dz * uz < 0) return false; } return true; }); };
    for (const l of F.lines) { const C = l.cols, wall = isWall(l); for (let j = 0; j + 1 < C.length / 3; j++) { const ax = C[3 * j], az = C[3 * j + 2], dx = C[3 * j + 3] - ax, dz = C[3 * j + 5] - az, m = Math.max(1, Math.ceil(Math.hypot(dx, dz)));
      for (let q = 0; q < m; q++) { const x = ax + dx * q / m, z = az + dz * q / m, e = edgeClear(x, z); nPts++;
        if (e !== null) { minRoute = Math.min(minRoute, e); if (e < 0.5) { onRoute++; if (near.length < 4) near.push(`${x.toFixed(1)},${z.toFixed(1)}: ${e.toFixed(2)} m`); } }
        if (!wall) for (const R of Tr.rings) { const e2 = Math.abs(Math.hypot(x - R.x, z - R.z) - R.r) - R.hw; minRing = Math.min(minRing, e2); if (e2 < 0.5) onRing++; } } } }
    // the houses that were built: none inside the free ground by more than 30 cm
    const free = Tr.wallFree(0.3), bl = F.bld, inPoly = (xs, zs, x, z) => { let c = false; for (let i = 0, j = xs.length - 1; i < xs.length; j = i++) if ((zs[i] > z) !== (zs[j] > z) && x < (xs[j] - xs[i]) * (z - zs[i]) / (zs[j] - zs[i]) + xs[i]) c = !c; return c; };
    let nB = bl.off.length - 1, inside = 0; const where = [];
    for (let b = 0; b < nB; b++) { const a0 = bl.off[b], a1 = bl.off[b + 1], xs = [], zs = []; for (let k = a0; k < a1; k++) { xs.push(bl.xz[2 * k]); zs.push(bl.xz[2 * k + 1]); }
      let deep = false; for (let k = 0; k < xs.length && !deep; k++) { const k2 = (k + 1) % xs.length, m = Math.max(1, Math.ceil(Math.hypot(xs[k2] - xs[k], zs[k2] - zs[k]) / 0.5)); for (let q = 0; q < m; q++) if (free.any(xs[k] + (xs[k2] - xs[k]) * q / m, zs[k] + (zs[k2] - zs[k]) * q / m)) { deep = true; break; } }
      if (!deep) { const cx = xs.reduce((a, v) => a + v, 0) / xs.length, cz = zs.reduce((a, v) => a + v, 0) / zs.length; if (inPoly(xs, zs, cx, cz) && free.any(cx, cz)) deep = true; }
      if (deep) { inside++; if (where.length < 4) where.push(xs[0].toFixed(0) + ',' + zs[0].toFixed(0)); } }
    // the rail left out: there a house's or a wall's front stands at the line, one the world built (the houses: out.fence.bld; the garden and retaining walls,
    // def.fences kinds 2 and 3, in the pieces World draws them, ≤ 2.5 m, each drawn when both its ends are clear of the road and of the cars' free ground: on
    // def.barrier 0.2 m past the barrier's line at least, as World's walls block decides). Every column without the rail within 0.7 m of one (World leaves the
    // rail out within 0.65 m), every point between two such columns within 1.5 m (where a wall turns a corner away from the line)
    const segs = [], WM = 0.2;
    for (let b = 0; b < nB; b++) { const a0 = bl.off[b], a1 = bl.off[b + 1]; for (let k = a0; k < a1; k++) { const k2 = k + 1 < a1 ? k + 1 : a0; segs.push([bl.xz[2 * k], bl.xz[2 * k + 1], bl.xz[2 * k2], bl.xz[2 * k2 + 1], 0, true]); } }
    const QW = {}, altIn = (x, z, m) => (def.altDn || []).some(A => { const P = A.P; for (let k = 0; k + 5 < P.length; k += 3) { const ax = P[k], az = P[k + 1], dx = P[k + 3] - ax, dz = P[k + 4] - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1e-9))); if (Math.hypot(x - ax - dx * t, z - az - dz * t) < (def.altHw || 2.4) + m) return true; } return false; });
    const wallOk = (x, z) => { if (free.route(x, z, -WM) || free.ring(x, z, -1) || free.any(x, z) || altIn(x, z, WM)) return false; const q = Tr.query(x, z, Tr.nearestIdx(x, z), QW);
      if (q.k >= 0 && Math.abs(q.u) <= Tr.stubHw(Tr.stubs[q.k], q.st) + WM) return false; return !(!q.deep && !q.over && Math.abs(q.d) < wE(q.d > 0 ? 1 : 0, q.a) + WM); };
    let wallsBuilt = 0, wallsAll = 0;
    for (const [kd, L] of def.fences || []) { if (kd !== 2 && kd !== 3) continue; const D = []; for (let k = 0; k + 3 < L.length; k += 2) { const ax = L[k], az = L[k + 1], bx = L[k + 2], bz = L[k + 3], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 2.5)); for (let t = 0; t < m; t++) D.push([ax + (bx - ax) * t / m, az + (bz - az) * t / m]); }
      D.push([L[L.length - 2], L[L.length - 1]]); const ok = D.map(([x, z]) => wallOk(x, z)); for (let k = 0; k + 1 < D.length; k++) { wallsAll++; if (ok[k] && ok[k + 1]) wallsBuilt++; segs.push([D[k][0], D[k][1], D[k + 1][0], D[k + 1][1], kd, ok[k] && ok[k + 1]]); } }
    const SG = new Map(), GC = 8; segs.forEach((s, i) => { for (let a = Math.floor((Math.min(s[0], s[2]) - 1) / GC); a <= Math.floor((Math.max(s[0], s[2]) + 1) / GC); a++) for (let b = Math.floor((Math.min(s[1], s[3]) - 1) / GC); b <= Math.floor((Math.max(s[1], s[3]) + 1) / GC); b++) { const key = a + ',' + b; let L = SG.get(key); if (!L) SG.set(key, L = []); L.push(i); } });
    const nearSeg = (x, z, built) => { let best = { d: 1e9, s: null }; const cx = Math.floor(x / GC), cz = Math.floor(z / GC); for (let a = cx - 1; a <= cx + 1; a++) for (let b = cz - 1; b <= cz + 1; b++) { const L = SG.get(a + ',' + b); if (!L) continue;
      for (const i of L) { const s = segs[i]; if (built && !s[5]) continue; const dx = s[2] - s[0], dz = s[3] - s[1], l2 = dx * dx + dz * dz || 1e-9, t = Math.max(0, Math.min(1, ((x - s[0]) * dx + (z - s[1]) * dz) / l2)), d = Math.hypot(x - s[0] - dx * t, z - s[1] - dz * t); if (d < best.d) best = { d, s }; } } return best; };
    let hidLen = 0, atHouse = 0, atWall = 0, holeLen = 0; const holes = [];
    for (const l of F.lines) { const C = l.cols; for (let j = 0; j + 1 < C.length / 3; j++) { if (!(l.hid[j] && l.hid[j + 1])) continue; const ax = C[3 * j], az = C[3 * j + 2], bx = C[3 * j + 3], bz = C[3 * j + 5], L = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(L / 0.5)); hidLen += L;
      for (let q = 0; q <= m; q++) { const x = ax + (bx - ax) * q / m, z = az + (bz - az) * q / m, nb = nearSeg(x, z, true), w = L / (m + 1);
        if (nb.d <= (q === 0 || q === m ? 0.7 : 1.5)) { if (nb.s[4]) atWall += w; else atHouse += w; continue; }
        holeLen += w; const any = nearSeg(x, z, false); if (!holes.length || Math.hypot(x - holes[holes.length - 1].x, z - holes[holes.length - 1].z) > 6) holes.push({ x, z, len: 0, d: nb.d, why: any.s && any.d < nb.d - 0.05 ? `a ${any.s[4] === 3 ? 'retaining' : 'garden'} wall ${any.d.toFixed(2)} m away that is not drawn` : `the nearest drawn ${nb.s ? (nb.s[4] ? 'wall' : 'house') : 'house or wall'} ${nb.d.toFixed(2)} m away` }); holes[holes.length - 1].len += w; } } }
    // the tyre stacks
    const st = W.props.filter(p => p.kind === 'tstack'), ends = [], trans = [], wallLines = F.lines.filter(isWall);
    for (const l of F.lines) { const C = l.cols, n = C.length / 3; if (!l.closed && !isWall(l)) for (const j of [0, n - 1]) if (!l.hid[j]) ends.push([C[3 * j], C[3 * j + 2]]); for (let j = 0; j + 1 < n; j++) if (l.hid[j] !== l.hid[j + 1]) { const jv = l.hid[j] ? j + 1 : j; trans.push([C[3 * jv], C[3 * jv + 2]]); } }
    const dPt = (p, L) => L.reduce((a, q) => Math.min(a, Math.hypot(p.x - q[0], p.z - q[1])), 1e9), dLine = (p, l) => { const C = l.cols; let best = 1e9; for (let j = 0; j + 1 < C.length / 3; j++) { const ax = C[3 * j], az = C[3 * j + 2], dx = C[3 * j + 3] - ax, dz = C[3 * j + 5] - az, t = Math.max(0, Math.min(1, ((p.x - ax) * dx + (p.z - az) * dz) / (dx * dx + dz * dz || 1e-9))); best = Math.min(best, Math.hypot(p.x - ax - dx * t, p.z - az - dz * t)); } return best; };
    const atWallSt = wallLines.map(() => [0, 0]); let atRailEnd = 0, atRunEnd = 0, stray = 0, onRoadSt = 0; const strayAt = [], roadAt = [];
    for (const p of st) {
      const wi = wallLines.findIndex(l => Math.abs(dLine(p, l) - 0.62) < 0.15);
      if (wi >= 0) { const l = wallLines[wi], C = l.cols, sx = C[3] - C[0], sz = C[5] - C[2], side = (-(p.x - C[0]) * sz + (p.z - C[2]) * sx) > 0 ? 1 : 0; atWallSt[wi][side]++; }
      else if (dPt(p, trans) < 0.8) atRailEnd++; else if (dPt(p, ends) < 0.8) atRunEnd++; else { stray++; if (strayAt.length < 4) strayAt.push(`${p.x.toFixed(1)},${p.z.toFixed(1)}`); }
      const e = edgeClear(p.x, p.z); if (e !== null && e < 0.43) { onRoadSt++; if (roadAt.length < 6) roadAt.push(`${p.x.toFixed(1)},${p.z.toFixed(1)} (its middle ${e.toFixed(2)} m past the road's edge)`); }
    }
    const wallWant = wallLines.map(l => { let n = 0; for (let t = 0.9; t < l.len - 0.6; t += 1.15) n++; return n; });
    return { total, fenced, miss, missFar, missAt, ex, nPts, onRoute, onRing, minRoute, minRing, near, nB, inside, where, left: F.stats.housesLeftOut,
      hidLen, atHouse, atWall, holeLen, holes: holes.slice(0, 8).map(h => `${h.x.toFixed(1)},${h.z.toFixed(1)} (${h.len.toFixed(1)} m: ${h.why})`), nHoles: holes.length, wallsBuilt, wallsAll,
      nst: st.length, atWallSt, wallWant, atRailEnd, atRunEnd, stray, strayAt, onRoadSt, roadAt, nTrans: trans.length, nEnds: ends.length };
  });
  const nEx = Object.values(R.ex).reduce((a, b) => a + b, 0);
  T.check('coverage: every 6 m on both sides a fence within 0.3 m of the wall (wallCollide along the barrier\'s normal) except inside a ring\'s zone, on the bridge, under the overpass, in a bend\'s corner; none open at a side road\'s mouth',
    R.miss <= 3 && R.missFar === 0 && R.fenced > 0.8 * R.total && nEx < 0.08 * R.total && !R.ex['side road mouth'],
    `${R.total} points: ${R.fenced} fenced, ${R.miss} not within 0.3 m (none over 1 m)${R.missAt.length ? ' (' + R.missAt.join(' ') + ')' : ''}; ${nEx} exceptions (${Object.entries(R.ex).map(([k, v]) => v + ' ' + k).join(', ')}) = ${(100 * nEx / R.total).toFixed(1)} %`);
  T.check('never on the road: 0.5 m clear at least of the asphalt and the sidewalks of every leg (the run-off in front), the circles clear of the rings\' roads', R.onRoute === 0 && R.onRing === 0 && R.minRoute >= 0.5,
    `${R.nPts} points of the lines as built every ~1 m: nearest to the road's edge ${R.minRoute.toFixed(2)} m, a circle to a ring's road ${R.minRing.toFixed(2)} m; ${R.onRoute} / ${R.onRing} too close${R.near.length ? ' (' + R.near.join('; ') + ')' : ''}`);
  T.check('houses: none that was built stands inside the free ground (by more than 30 cm); the ones the barrier cuts into are left out', R.inside === 0 && R.left < 40,
    `${R.nB} buildings built, ${R.left} left out for the barrier, ${R.inside} inside the free ground${R.where.length ? ': ' + R.where.join('; ') : ''}`);
  T.check('the rail is left out only where a house or a wall the world built stands at the line (within 0.7 m of each column without it, 1.5 m between two: the barrier there), no hole in the barrier', R.holeLen < 0.5,
    `${R.hidLen.toFixed(0)} m without the rail: ${R.atHouse.toFixed(0)} m at a house, ${R.atWall.toFixed(0)} m at a garden or retaining wall (${R.wallsBuilt} of ${R.wallsAll} pieces of those walls drawn)` + (R.holeLen >= 0.5 ? `; ${R.holeLen.toFixed(1)} m in ${R.nHoles} places with neither: ${R.holes.join('; ')}` : ''));
  T.check('tyre stacks: two rows along each ring\'s wall (one either side, 0.62 m from it), one at each end of the rail where it stops at a house\'s corner or a run ends; none anywhere else, none on the road\'s asphalt or sidewalk',
    R.nst > 60 && R.atWallSt.length === 3 && R.atWallSt.every((s, k) => s[0] >= R.wallWant[k] - 1 && s[1] >= R.wallWant[k] - 1) && R.atRailEnd > 0 && R.stray === 0 && R.onRoadSt === 0,
    `${R.nst} stacks: ${R.atWallSt.map((s, k) => `${s[0]} + ${s[1]} of ${R.wallWant[k]} + ${R.wallWant[k]}`).join(', ')} along the three walls, ${R.atRailEnd} at the rail's ends by a house (${R.nTrans} ends), ${R.atRunEnd} at a run's ends (${R.nEnds}), ${R.stray} elsewhere${R.strayAt.length ? ' (' + R.strayAt.join('; ') + ')' : ''}; ${R.onRoadSt} on the road${R.roadAt.length ? ': ' + R.roadAt.join('; ') : ''}`);

  // 3. what it costs and that it is seen: six places along the road, the phone's view (844x390, chase), the barrier shown and hidden (the same frame: no time
  // passes); then the iso and chase views, the pixels that change
  const costs = [], seen = [];
  for (const d of [150, 800, 2750, 4066, 4440, 5600]) {
    await page.setViewportSize({ width: 844, height: 390 });
    const c = await page.evaluate((d) => {
      const g = window.__game, Tr = g.race.track, W = Render.world, fm = []; W.root.traverse(o => { if (o.name === 'mvFence') fm.push(o); });
      if (d === 150) { g.onAction('restart'); g.pause(); }
      const P = g.race.player; let n = 0; while (P.q.s - Tr.startS < d && n < 800) { g.sim(1, true); n++; }
      g.S.camera = 'chase'; Render.resetCam(); for (let i = 0; i < 10; i++) Render.frame(1 / 60, 1, P, 'chase', {});
      const draw = (on) => { fm.forEach(o => { o.visible = on; }); const c0 = __gl.calls, v0 = __gl.verts; Render.frame(0, 1, P, 'chase', {}); return [__gl.calls - c0, __gl.verts - v0]; };
      const w1 = draw(true), wo = draw(false), w2 = draw(true);   // (shown, hidden, shown again: the smaller of the two)
      return { d: Math.round(P.q.s - Tr.startS), with: w1[1] <= w2[1] ? w1 : w2, without: wo };
    }, d);
    costs.push(c);
    for (const [cam, vp] of [['iso', { width: 800, height: 450 }], ['chase', { width: 400, height: 800 }]]) {
      await page.setViewportSize(vp); await page.waitForTimeout(200);
      const px = await page.evaluate((cam) => {
        const g = window.__game, P = g.race.player, W = Render.world, fm = []; W.root.traverse(o => { if (o.name === 'mvFence') fm.push(o); });
        g.S.camera = cam; Render.resetCam(); for (let i = 0; i < 12; i++) Render.frame(1 / 60, 1, P, cam, {});
        const cv = document.querySelector('canvas'), grab = () => { const c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height; const x = c2.getContext('2d'); x.drawImage(cv, 0, 0); return x.getImageData(0, 0, cv.width, cv.height).data; };
        // (no time passes between the frames: shown, hidden, shown again; the pixels that change only when it is hidden)
        fm.forEach(o => { o.visible = true; }); Render.frame(0, 1, P, cam, {}); const a = grab();
        fm.forEach(o => { o.visible = false; }); Render.frame(0, 1, P, cam, {}); const b = grab();
        fm.forEach(o => { o.visible = true; }); Render.frame(0, 1, P, cam, {}); const a2 = grab();
        const dif = (u, v, k) => Math.abs(u[k] - v[k]) + Math.abs(u[k + 1] - v[k + 1]) + Math.abs(u[k + 2] - v[k + 2]) > 40;
        let diff = 0, noise = 0; for (let k = 0; k < a.length; k += 4) { if (dif(a, a2, k)) noise++; else if (dif(a, b, k)) diff++; }
        return { diff, noise, all: a.length / 4 };
      }, cam);
      seen.push({ d: c.d, cam, frac: px.diff / px.all, diff: px.diff, noise: px.noise });
    }
  }
  const maxC = Math.max(...costs.map(c => c.with[0] - c.without[0])), maxV = Math.max(...costs.map(c => c.with[1] - c.without[1]));
  T.check('per frame (the phone budget): the barrier adds a few draw calls and under 75k vertices to the busiest places', maxC <= 8 && maxV < 75000 && costs.every(c => c.with[0] >= c.without[0]),
    costs.map(c => `d${c.d}: +${c.with[0] - c.without[0]} calls, +${((c.with[1] - c.without[1]) / 1000).toFixed(0)}k of ${(c.with[1] / 1000).toFixed(0)}k vertices`).join('; '));
  const minSeen = Math.min(...seen.map(s => s.diff));
  T.check('seen: from the iso camera (landscape) and the chase camera (portrait) at all six places the barrier changes at least 150 pixels of the picture', minSeen >= 150,
    seen.map(s => `d${s.d} ${s.cam} ${s.diff} px (${(100 * s.frac).toFixed(2)} %, noise ${s.noise})`).join('; '));
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
