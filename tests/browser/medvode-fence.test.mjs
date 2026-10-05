// Medvode's fence, as built: a visible, continuous timber fence on the whole barrier (World.buildMedvode, out.fence), checked in the browser against the
// physics (the geometry itself: tests/medvode-fence.test.js). Reads what the world built (Render.world.fence: the lines as built, 8 cm outside the wall's line)
// and asserts
//   - along the whole route, every 6 m on both sides, there is a fence within 0.3 m of the wall (where wallCollide stops a car along the barrier's normal) except
//     where it is open (a side road's mouth), inside a roundabout's zone, on the bridge, under the overpass, on an oncoming lane, in a bend's corner (counted)
//   - the fence never lies on the asphalt, a sidewalk, an oncoming lane, a side road's carriageway or a ring road
//   - no house that was built stands inside the free ground; the houses cut by the fence are counted
//   - what it costs: its vertices and meshes, the draw calls and vertices it adds to a frame (844x390, phone budget) and that it is seen from the iso and the chase camera
//     (the pixels that change when it is hidden)
//   node tests/browser/medvode-fence.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Medvode: the fence');
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
    const W = Render.world, F = W.fence, ms = []; W.root.traverse(o => { if (o.name === 'mvFence') ms.push(o); });
    let verts = 0, tris = 0, nan = 0, nonShadow = 0; for (const m of ms) { const g = m.geometry, p = g.attributes.position.array; verts += g.attributes.position.count; tris += g.index.count / 3; if (!m.castShadow && m.receiveShadow) nonShadow++; for (let k = 0; k < p.length; k++) if (!Number.isFinite(p[k])) { nan++; break; } }
    return { has: !!F, stats: F && F.stats, meshes: ms.length, verts, tris, nan, nonShadow, kinds: F ? F.lines.reduce((a, l) => (a[l.k] = (a[l.k] || 0) + l.len, a), {}) : null };
  });
  T.check('built: a fence along the barriers of the whole route, of the side roads, the roundabouts and the oncoming lanes, 20 km of it, in a few meshes that cast no shadow',
    B.has && B.stats.length > 18000 && B.kinds[0] > 10500 && B.kinds[1] > 5000 && B.kinds[3] > 100 && B.meshes === B.stats.meshes && B.meshes > 10 && B.meshes < 45 && B.nonShadow === B.meshes && !B.nan,
    `${(B.stats.length / 1000).toFixed(1)} km (route ${(B.kinds[0] / 1000).toFixed(1)}, side roads ${(B.kinds[1] / 1000).toFixed(1)}, rings ${(B.kinds[2] || 0).toFixed(0)} m, lanes ${(B.kinds[3] || 0).toFixed(0)} m), ${B.stats.posts} posts, ${B.stats.columns} columns, ${B.meshes} meshes`);
  T.check('vertex count added: under 120k vertices in all (indexed, thinned out along straight stretches)', B.verts < 120000 && B.verts === B.stats.vertices,
    `${B.verts} vertices, ${B.tris} triangles (${(B.verts / B.stats.length).toFixed(1)} per metre)`);

  // 2. against the physics
  const R = await page.evaluate(() => {
    const g = window.__game, Tr = g.race.track, def = Tr.def, W = Render.world, F = W.fence, N = Tr.N, ds = Tr.ds, EPS = F.stats.EPS;
    const SEG = new Map(), CELL = 16;   // the built lines' segments (x, y, z of the columns), hashed
    for (const l of F.lines) { const C = l.cols; for (let j = 0; j + 1 < C.length / 3; j++) { const ax = C[3 * j], az = C[3 * j + 2], bx = C[3 * j + 3], bz = C[3 * j + 5], s = { ax, az, bx, bz };
      for (let a = Math.floor((Math.min(ax, bx) - 1) / CELL); a <= Math.floor((Math.max(ax, bx) + 1) / CELL); a++) for (let b = Math.floor((Math.min(az, bz) - 1) / CELL); b <= Math.floor((Math.max(az, bz) + 1) / CELL); b++) { const key = a + ',' + b; let L = SEG.get(key); if (!L) SEG.set(key, L = []); L.push(s); } } }
    const distTo = (x, z) => { let best = 1e9; const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
      for (let a = cx - 1; a <= cx + 1; a++) for (let b = cz - 1; b <= cz + 1; b++) { const L = SEG.get(a + ',' + b); if (!L) continue; for (const s of L) { const dx = s.bx - s.ax, dz = s.bz - s.az, l2 = dx * dx + dz * dz || 1e-9, t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / l2)); best = Math.min(best, Math.hypot(x - s.ax - dx * t, z - s.az - dz * t)); } }
      return best; };
    const mkCar = (x, z, h) => ({ x, z, h: 0, vx: 0, vz: 0, w: 0, m: { mass: 1000 }, I: 1000, corners: [[0, 0], [0, 0], [0, 0], [0, 0]], q: { i: h }, hitWall: 0, fxWall: 0, isPlayer: false, pitWant: false, inPit: false });
    const sp = { S: null }, stubIn = (x, z, m) => { for (const S of Tr.stubs) { const b = S.bb; if (x < b[0] || x > b[2] || z < b[1] || z > b[3]) continue; sp.S = null; if (Tr._stubProj(S, x, z, sp) && sp.t > 0 && sp.t < S.L && Math.abs(sp.u) < Tr.stubHw(S, sp.t) + S.lim + m) return true; } return false; };
    const ringIn = (x, z, m) => Tr.rings.some(R => Math.hypot(x - R.x, z - R.z) < R.zr + m), skipAt = (s, m) => F.skips.some(([a, b]) => s >= a - m && s <= b + m);
    // every 6 m on both sides
    let total = 0, fenced = 0, miss = 0, missFar = 0; const ex = {}, missAt = [];
    for (const sd of [-1, 1]) for (let i = 3; i < N - 3; i += 3) {
      const bar = sd > 0 ? Tr.br[i] : Tr.bl[i], s = i * ds, si = sd > 0 ? 1 : 0; total++;
      let u = null; for (let v = -3; v <= 3.001; v += 0.05) { const xx = Tr.px[i] + Tr.nx[i] * sd * (bar + v), zz = Tr.pz[i] + Tr.nz[i] * sd * (bar + v), c = mkCar(xx, zz, i); Core.wallCollide(c, Tr, false); if (Math.hypot(c.x - xx, c.z - zz) > 0.002) { u = v; break; } }
      const x = Tr.px[i] + Tr.nx[i] * sd * (bar + (u || 0)), z = Tr.pz[i] + Tr.nz[i] * sd * (bar + (u || 0)), B = sd > 0 ? Tr.br : Tr.bl, step = Math.abs(B[i + 1] - B[i - 1]) > 2.5, G = Tr.gap[si], gap = G[i] || G[i - 1] || G[i + 1];
      const clear = !gap && u !== null && !step && !stubIn(x, z, 0.3) && !ringIn(x, z, 0.3) && !Tr.onAlt(x, z) && !skipAt(s, 3), d = distTo(x, z);
      if (clear) { if (d <= 0.3) fenced++; else { miss++; if (d > 1) missFar++; if (missAt.length < 12) missAt.push((sd < 0 ? 'L' : 'R') + (s - Tr.startS).toFixed(0) + ':' + d.toFixed(1) + 'm'); } }
      else if (d > 0.3) { const k = G[i] || stubIn(x, z, 0) ? 'side road mouth' : ringIn(x, z, 0) ? 'inside a ring zone' : skipAt(s, 0) ? (def.bridges.some(([a, b]) => s - Tr.startS >= a - 3 && s - Tr.startS <= b + 3) ? 'bridge' : 'overpass') : Tr.onAlt(x, z) ? 'oncoming lane' : u === null ? 'corner of a bend' : step ? 'step in the barrier' : 'edge of an exception'; ex[k] = (ex[k] || 0) + 1; }
    }
    // never on the road: the built columns and the points between them (every ~1 m, 8 cm out as built)
    let nPts = 0, onRoute = 0, onLane = 0, onStub = 0, onRing = 0, minRoute = 1e9;
    const wE = (si, i) => Tr.wAt(i) + (Tr.walk ? Tr.walk[si][i] : 0);
    for (const l of F.lines) { const C = l.cols; for (let j = 0; j + 1 < C.length / 3; j++) { const ax = C[3 * j], az = C[3 * j + 2], dx = C[3 * j + 3] - ax, dz = C[3 * j + 5] - az, m = Math.max(1, Math.ceil(Math.hypot(dx, dz)));
      for (let q = 0; q < m; q++) { const x = ax + dx * q / m, z = az + dz * q / m; nPts++;
        const qm = Tr._qMain(x, z, Tr.nearestIdx(x, z), {}); if (!qm.over) { const e = Math.abs(qm.d) - wE(qm.d > 0 ? 1 : 0, qm.a); minRoute = Math.min(minRoute, e); if (e < 0.1) onRoute++; }
        for (const L of Tr.altC) { const b = L.bb; if (x < b[0] - 8 || x > b[2] + 8 || z < b[1] - 8 || z > b[3] + 8) continue; const Pp = L.pts; for (let k = 0; k + 3 < Pp.length; k += 2) { const px = Pp[k], pz = Pp[k + 1], ex2 = Pp[k + 2] - px, ez = Pp[k + 3] - pz, t = Math.max(0, Math.min(1, ((x - px) * ex2 + (z - pz) * ez) / (ex2 * ex2 + ez * ez || 1e-9))); if (Math.hypot(x - px - ex2 * t, z - pz - ez * t) < def.altHw + 0.1) onLane++; } }
        for (const S of Tr.stubs) { const b = S.bb; if (x < b[0] || x > b[2] || z < b[1] || z > b[3]) continue; sp.S = null; if (!Tr._stubProj(S, x, z, sp) || sp.t < 0 || sp.t > S.L - 0.6) continue; if (Math.abs(sp.u) - Tr.stubHw(S, sp.t) < 0.2) onStub++; }
        for (const R of Tr.rings) { const e = Math.abs(Math.hypot(x - R.x, z - R.z) - R.r) - (def.rings.find(v => v.c[0] === R.x).hw || 3); if (e < 0.2 && Math.hypot(x - R.x, z - R.z) > R.ri) onRing++; } } } }
    // the houses that were built: none inside the free ground by more than 30 cm
    const free = Tr.wallFree(0.3), bl = F.bld, inPoly = (xs, zs, x, z) => { let c = false; for (let i = 0, j = xs.length - 1; i < xs.length; j = i++) if ((zs[i] > z) !== (zs[j] > z) && x < (xs[j] - xs[i]) * (z - zs[i]) / (zs[j] - zs[i]) + xs[i]) c = !c; return c; };
    let nB = bl.off.length - 1, inside = 0; const where = [];
    for (let b = 0; b < nB; b++) { const a0 = bl.off[b], a1 = bl.off[b + 1], xs = [], zs = []; for (let k = a0; k < a1; k++) { xs.push(bl.xz[2 * k]); zs.push(bl.xz[2 * k + 1]); }
      let deep = false; for (let k = 0; k < xs.length && !deep; k++) { const k2 = (k + 1) % xs.length, m = Math.max(1, Math.ceil(Math.hypot(xs[k2] - xs[k], zs[k2] - zs[k]) / 0.5)); for (let q = 0; q < m; q++) if (free.any(xs[k] + (xs[k2] - xs[k]) * q / m, zs[k] + (zs[k2] - zs[k]) * q / m)) { deep = true; break; } }
      if (!deep) { const cx = xs.reduce((a, v) => a + v, 0) / xs.length, cz = zs.reduce((a, v) => a + v, 0) / zs.length; if (inPoly(xs, zs, cx, cz) && free.any(cx, cz)) deep = true; }
      if (deep) { inside++; if (where.length < 4) where.push(xs[0].toFixed(0) + ',' + zs[0].toFixed(0)); } }
    return { total, fenced, miss, missFar, missAt, ex, nPts, onRoute, onLane, onStub, onRing, minRoute, nB, inside, where, left: F.stats.housesLeftOut };
  });
  const nEx = Object.values(R.ex).reduce((a, b) => a + b, 0);
  T.check('coverage: every 6 m on both sides a fence within 0.3 m of the wall (wallCollide along the barrier\'s normal) except where it is open, inside a ring, on the bridge, under the overpass, on an oncoming lane, in a bend\'s corner',
    R.miss <= 3 && R.missFar === 0 && R.fenced > 0.8 * R.total && nEx < 0.2 * R.total,
    `${R.total} points: ${R.fenced} fenced, ${R.miss} not within 0.3 m (none over 1 m)${R.missAt.length ? ' (' + R.missAt.join(' ') + ')' : ''}; ${nEx} exceptions (${Object.entries(R.ex).map(([k, v]) => v + ' ' + k).join(', ')}) = ${(100 * nEx / R.total).toFixed(1)} %`);
  T.check('never on the road: not on the asphalt or a sidewalk (0.1 m clear at least), an oncoming lane, a side road\'s carriageway (up to its rail) or a ring road', R.onRoute === 0 && R.onLane === 0 && R.onStub === 0 && R.onRing === 0,
    `${R.nPts} points of the lines as built every ~1 m: nearest to a sidewalk edge ${R.minRoute.toFixed(2)} m; ${R.onRoute} / ${R.onLane} / ${R.onStub} / ${R.onRing} on the route / a lane / a side road / a ring`);
  T.check('houses: none that was built stands inside the free ground (by more than 30 cm); the ones the fence cuts into are left out', R.inside === 0 && R.left < 40,
    `${R.nB} buildings built, ${R.left} left out for the fence, ${R.inside} inside the free ground${R.where.length ? ': ' + R.where.join('; ') : ''}`);

  // 3. what it costs and that it is seen: six places along the road, the phone's view (844x390, chase), the fence shown and hidden; then the iso and chase views, the pixels that change
  const costs = [], seen = [];
  for (const d of [150, 800, 2750, 4066, 4440, 5600]) {
    await page.setViewportSize({ width: 844, height: 390 });
    const c = await page.evaluate((d) => {
      const g = window.__game, Tr = g.race.track, W = Render.world, fm = []; W.root.traverse(o => { if (o.name === 'mvFence') fm.push(o); });
      if (d === 150) { g.onAction('restart'); g.pause(); }
      const P = g.race.player; let n = 0; while (P.q.s - Tr.startS < d && n < 800) { g.sim(1, true); n++; }
      g.S.camera = 'chase'; Render.resetCam(); for (let i = 0; i < 10; i++) Render.frame(1 / 60, 1, P, 'chase', {});
      const m = {}; for (const on of [true, false]) { fm.forEach(o => { o.visible = on; }); const c0 = __gl.calls, v0 = __gl.verts; Render.frame(1 / 60, 1, P, 'chase', {}); m[on ? 'with' : 'without'] = [__gl.calls - c0, __gl.verts - v0]; }
      fm.forEach(o => { o.visible = true; });
      return { d: Math.round(P.q.s - Tr.startS), with: m.with, without: m.without };
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
  const maxC = Math.max(...costs.map(c => c.with[0] - c.without[0])), maxV = Math.max(...costs.map(c => c.with[1] - c.without[1])), top = Math.max(...costs.map(c => c.with[1]));
  T.check('per frame (the phone budget): the fence adds a few draw calls and under 50k vertices to the busiest places', maxC <= 8 && maxV < 50000,
    costs.map(c => `d${c.d}: +${c.with[0] - c.without[0]} calls, +${((c.with[1] - c.without[1]) / 1000).toFixed(0)}k of ${(c.with[1] / 1000).toFixed(0)}k vertices`).join('; '));
  const minSeen = Math.min(...seen.map(s => s.diff));
  T.check('seen: from the iso camera (landscape) and the chase camera (portrait) at all six places the fence changes at least 150 pixels of the picture', minSeen >= 150,
    seen.map(s => `d${s.d} ${s.cam} ${s.diff} px (${(100 * s.frac).toFixed(2)} %, noise ${s.noise})`).join('; '));
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
