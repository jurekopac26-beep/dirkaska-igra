// The corner camera of the menu's track step (camera 3), in the game's page: tools/menu-corner.mjs puts this in and drives it. The game
// stands still (its clock and frames are the tool's: virtual time); a race of the game's own AI cars of its own (no player) runs from the
// grid on the track the page has built, the renderer draws it (Render.attachRace) through a still camera of its own (Render.setShot) at a
// corner, and every frame is read from the game's canvas.
window.MC = (function () {
  const STEP = 1 / 120;
  let R = null, T = null, W = null, cv = null, fps = 30, opt = null;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  // a race of n AI cars from the grid (the title demo's kind of race, with the race's own random numbers: the same seed, the same race)
  function setup(o) {
    opt = o || {}; fps = opt.fps || 30;
    T = window.__game.demo.track; W = Render.world;
    R = new Core.Race(T, { numAI: opt.numAI || 21, noPlayer: true, difficulty: 2, laps: 99, seed: opt.seed || 11, phys: 'cs', repro: true, damage: 0 });   // (no damage: no wreck left burning in the corner)
    R.start(); Render.attachRace(R);
    cv = document.getElementById('gl');
    return { id: T.def.id, len: T.len, startS: T.startS, finishS: T.finishS, open: !!T.open, w: T.w, ds: T.ds, N: T.N, cars: R.cars.length };
  }
  function run(sec) { for (let t = 0; t < sec - 1e-9; t += STEP) { R.step(STEP); for (const c of R.cars) { c.hitWall = 0; c.hitCar = 0; } } }
  const wrap = (s) => T.open ? Math.min(Math.max(s, 0), T.len - 0.01) : ((s % T.len) + T.len) % T.len;
  const at = (s) => { const i = T.idx(wrap(s)); return { i, x: T.px[i], y: T.hasElev && T.hy ? T.hy[i] : 0, z: T.pz[i] }; };
  // the corner at s0: its stretch (a little before the bend's start to a little past its end; T.corners where one is there)
  function span(s0) {
    let a = s0 - 45, b = s0 + 45;
    const c = (T.corners || []).find(k => Math.abs(k.s0 - s0) < 40 || (k.i0 * T.ds <= s0 && k.i1 * T.ds >= s0));
    if (c) { a = Math.min(a, c.i0 * T.ds - 40); b = Math.max(b, c.i1 * T.ds + 40); }
    if (b - a > 200) { const m = (a + b) / 2; a = Math.max(a, m - 100); b = Math.min(b, m + 100); }
    return [a, b];
  }
  const ground = (x, z) => { const g = W && W.groundH ? W.groundH(x, z) : NaN; return Number.isFinite(g) ? g : NaN; };
  // what a ray from p to q hits first in the world (the see-through meshes and the hidden ones are seen through), or null. The world's
  // plants and rocks are instanced (r128's raycast misses them here: their geometry's box is the chunk's), so each of them is a standing
  // cylinder of its own (its unit's reach round its axis and its foot and top, scaled), tested apart
  const rc = new THREE.Raycaster(), _o = V3(0, 0, 0), _d = V3(0, 0, 0);
  let near = null, cyl = null, ncyl = 0;   // (the world's meshes round the corner, and its instances as cylinders: x, z, r, y0, y1)
  const unitOf = new Map();   // (a plant's unit: reach, foot, top, from its position attribute)
  function nearMeshes(cx, cz, r) {
    const out = [], C = []; W.root.updateMatrixWorld(true);
    const m4 = new THREE.Matrix4(), mw = new THREE.Matrix4(), e = new THREE.Matrix4().elements;
    W.root.traverse(o => {
      if (!o.isMesh || !o.geometry || !o.visible) return;
      const m = o.material; if (!m || (Array.isArray(m) ? m.every(x => x.transparent) : m.transparent)) return;
      const g = o.geometry;
      if (o.isInstancedMesh) {
        const pa = g.attributes.position; if (!pa) return;
        let u = unitOf.get(pa); if (!u) { const a = pa.array; let rh = 0, y0 = Infinity, y1 = -Infinity; for (let k = 0; k < a.length; k += 3) { rh = Math.max(rh, Math.hypot(a[k], a[k + 2])); y0 = Math.min(y0, a[k + 1]); y1 = Math.max(y1, a[k + 1]); } unitOf.set(pa, u = [rh, y0, y1]); }
        for (let t = 0; t < o.count; t++) {
          o.getMatrixAt(t, m4); mw.multiplyMatrices(o.matrixWorld, m4); const E = mw.elements, x = E[12], z = E[14];
          if (Math.hypot(x - cx, z - cz) > r) continue;
          const sxz = Math.hypot(E[0], E[1], E[2]), sy = Math.hypot(E[4], E[5], E[6]), y = E[13], a = y + u[1] * sy, b = y + u[2] * sy;
          if (b - a < 1.2) continue;   // (grass and low clumps: they hide no car)
          C.push(x, z, u[0] * sxz * 0.8, a, b);
        }
        return;
      }
      if (!g.boundingSphere) g.computeBoundingSphere(); if (!g.boundingSphere) return;
      const s = g.boundingSphere.clone().applyMatrix4(o.matrixWorld); if (Math.hypot(s.center.x - cx, s.center.z - cz) >= r + s.radius) return;
      if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld);
      o.userData.mcBig = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) >= 60;   // (the ground, the road, a long wall: not a thing in front of the camera)
      out.push(o);
    });
    cyl = new Float32Array(C); ncyl = C.length / 5;
    return out;
  }
  // the nearest standing cylinder the ray (from p along the unit dir d, from tmin to tmax) enters, its distance (Infinity: none)
  function cylHit(p, d, tmin, tmax) {
    let best = Infinity; const dh = Math.hypot(d.x, d.z);
    for (let k = 0; k < ncyl; k++) {
      const o = k * 5, x = cyl[o], z = cyl[o + 1], r = cyl[o + 2];
      // the ray's closest approach to the cylinder's axis in the ground's plane, and where it is inside the circle
      const fx = p[0] - x, fz = p[2] - z; if (dh < 1e-6) { if (fx * fx + fz * fz > r * r) continue; }
      const A = d.x * d.x + d.z * d.z, B = 2 * (fx * d.x + fz * d.z), Cc = fx * fx + fz * fz - r * r;
      let t0, t1;
      if (A < 1e-9) { t0 = tmin; t1 = tmax; } else { const D = B * B - 4 * A * Cc; if (D < 0) continue; const q = Math.sqrt(D); t0 = (-B - q) / (2 * A); t1 = (-B + q) / (2 * A); }
      t0 = Math.max(t0, tmin); t1 = Math.min(t1, tmax); if (t0 > t1 || t0 >= best) continue;
      // inside the circle between t0 and t1: is the ray between the foot and the top there
      const ya = p[1] + d.y * t0, yb = p[1] + d.y * t1, y0 = cyl[o + 3], y1 = cyl[o + 4];
      if (Math.max(ya, yb) < y0 || Math.min(ya, yb) > y1) continue;
      let th = t0; if (ya > y1 || ya < y0) { th = d.y !== 0 ? ((ya > y1 ? y1 : y0) - p[1]) / d.y : t0; }
      if (th >= t0 - 1e-6 && th <= t1 + 1e-6 && th < best) best = th;
    }
    return best;
  }
  function first(p, dir, far) {
    _o.set(p[0], p[1], p[2]); rc.set(_o, dir); rc.near = 0.3; rc.far = far;
    let hit = null;
    for (const h of rc.intersectObjects(near, false)) { const m = h.object.material, mm = Array.isArray(m) ? m[h.face ? h.face.materialIndex : 0] : m; if (!h.object.visible || !mm || mm.transparent) continue; hit = h; break; }
    const t = cylHit(p, dir, 0.3, hit ? hit.distance : far);
    return t < Infinity ? { distance: t, object: { userData: {} } } : hit;
  }
  function blocked(p, q) {
    _d.set(q[0] - p[0], q[1] - p[1], q[2] - p[2]); const len = _d.length(); if (len < 2) return false;
    return !!first(p, _d.multiplyScalar(1 / len), len - 1.5);
  }
  // how much of the frame a thing close to the camera covers (a post, a sign, a tree, a wall's end: rays through a 5 x 5 grid of the frame;
  // the ground and the road are no such thing)
  function clutter(p, f, rt, up, tf, dist) {
    let n = 0; const d = V3(0, 0, 0);
    for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) {
      const u = (i / 4 * 2 - 1) * tf * 0.92, w = (j / 4 * 2 - 1) * tf * 0.92;
      d.copy(f).addScaledVector(rt, u).addScaledVector(up, w).normalize();
      const h = first(p, d, dist * 0.7); if (h && !h.object.userData.mcBig) n++;
    }
    return n / 25;
  }
  // the camera of a corner: candidates round its stretch (5 distances, every 15 degrees, 6 heights over the ground), each aimed at the
  // stretch and zoomed so the whole of it fits the square frame; kept where it is off the road, sees nearly all of the stretch (rays) and
  // looks down at it a little; scored by how much of the frame the stretch fills, how much of it is seen, the view's slope and distance
  function search(s0, o) {
    o = o || {};
    const [a, b] = span(s0), pts = [];
    for (let s = a; s <= b + 1e-6; s += 5) { const p = at(s); pts.push([p.x, p.y + 0.9, p.z, s]); }
    const ap = at(s0), A = [ap.x, ap.y + 0.9, ap.z];
    let cx = 0, cy = 0, cz = 0, wsum = 0; for (const p of pts) { const w = Math.abs(p[3] - s0) < 25 ? 2 : 1; cx += p[0] * w; cy += p[1] * w; cz += p[2] * w; wsum += w; } cx /= wsum; cy /= wsum; cz /= wsum;
    // the bend's inside: the side the road turns to (the camera goes outside it, a little better)
    let ks = 0; for (let d = -30; d <= 30; d += 4) ks += T.k[T.idx(wrap(s0 + d))] || 0;
    const i0 = ap.i, outN = [-(ks > 0 ? 1 : -1) * T.nx[i0], -(ks > 0 ? 1 : -1) * T.nz[i0]];
    // the road nearby (the camera stays off it), every 4 m over 600 m
    const road = []; for (let s = s0 - 300; s <= s0 + 300; s += 4) { const p = at(s); road.push([p.x, p.z]); }
    near = nearMeshes(cx, cz, 200);
    const out = [], R0 = o.dists || [25, 35, 50, 70, 95], H0 = o.heights || [3, 6, 10, 16, 25, 40];
    let tested = 0, rays = 0; const why = { road: 0, behind: 0, fov: 0, down: 0, hidden: 0 };   // (why candidates were left out)
    for (const r of R0) for (let th = 0; th < 360; th += 15) for (const h of H0) {
      const x = cx + r * Math.cos(th * Math.PI / 180), z = cz + r * Math.sin(th * Math.PI / 180);
      let g = ground(x, z); if (!Number.isFinite(g)) g = cy - 0.9;
      const y = Math.max(g + h, cy + 1);
      let dmin = 1e9; for (const q of road) dmin = Math.min(dmin, Math.hypot(q[0] - x, q[1] - z)); if (dmin < T.w + 4) { why.road++; continue; }
      // aimed at the stretch's weighted middle; the zoom that fits it all (square frame), with a margin
      const f = V3(cx - x, cy - y, cz - z).normalize(), rt = V3().crossVectors(f, V3(0, 1, 0)).normalize(), up = V3().crossVectors(rt, f);
      let tmax = 0, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, behind = false;
      for (const p of pts) { const v = V3(p[0] - x, p[1] - y, p[2] - z), zz = v.dot(f); if (zz < 3) { behind = true; break; } const u = v.dot(rt) / zz, w = v.dot(up) / zz; tmax = Math.max(tmax, Math.abs(u), Math.abs(w)); x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, w); y1 = Math.max(y1, w); }
      if (behind) { why.behind++; continue; }
      const fov = Math.max(o.fovMin || 34, 2 * Math.atan(tmax * 1.18) * 180 / Math.PI); if (fov > (o.fovMax || 62)) { why.fov++; continue; }
      const tf = Math.tan(fov * Math.PI / 360), fill = ((x1 - x0) / (2 * tf)) * ((y1 - y0) / (2 * tf));
      const down = Math.asin(Math.max(-1, Math.min(1, -f.y))) * 180 / Math.PI; if (down < (o.downMin || 4) || down > (o.downMax || 50)) { why.down++; continue; }
      // seen: rays to the stretch (stop once more than a sixth is hidden)
      tested++; let hid = 0; const lim = Math.ceil(pts.length / 6);
      for (const p of pts) { rays++; if (blocked([x, y, z], p) && ++hid > lim) break; }
      if (hid > lim) { why.hidden++; continue; }
      const cl = clutter([x, y, z], f, rt, up, Math.tan(fov * Math.PI / 360), Math.hypot(cx - x, cy - y, cz - z)); rays += 25;
      const seen = 1 - hid / pts.length, outside = (x - ap.x) * outN[0] + (z - ap.z) * outN[1] > 0 ? 1 : 0.85;
      // a TV camera's view: looking down 14-28 degrees (the land behind the corner and the sky over it in the frame), not a map's from above
      const slope = down < 8 ? 0.6 : down < 14 ? 0.75 + 0.25 * (down - 8) / 6 : down <= 28 ? 1 : down <= 40 ? 1 - 0.3 * (down - 28) / 12 : 0.6;
      const dist = Math.hypot(cx - x, cy - y, cz - z), dk = dist < 30 ? 0.85 : dist > 90 ? 0.8 : 1;
      const score = Math.pow(seen, 4) * Math.sqrt(Math.max(0.01, Math.min(fill, 0.35))) * slope * dk * outside * Math.pow(1 - cl, 3);
      out.push({ px: x, py: y, pz: z, tx: cx, ty: cy, tz: cz, fov: +fov.toFixed(1), score: +score.toFixed(4), seen: +seen.toFixed(2), fill: +fill.toFixed(2), clutter: cl, down: Math.round(down), dist: Math.round(dist), r, th, h });
    }
    out.sort((p, q) => q.score - p.score);
    return { span: [Math.round(a), Math.round(b)], tested, rays, n: out.length, why, w: T.w, best: out.slice(0, o.keep || 8) };
  }
  // the haze as the game's own camera has it for this distance (THEMES' fogK is the renderer's), the shot set
  function shot(c) {
    const d = Math.hypot(c.tx - c.px, c.ty - c.py, c.tz - c.pz);
    Render.setShot({ px: c.px, py: c.py, pz: c.pz, tx: c.tx, ty: c.ty, tz: c.tz, fov: c.fov, near: 0.5, fogD: Math.max(45, d * (c.fogK || 1.15)), sky: true, noCut: true, blur: 0 });
  }
  // which stretches of the road the camera sees: the road every 2 m over 500 m each way of the corner, in its frame and not hidden (rays)
  function seenRoad(c, s0) {
    const cam = Render.camera; shot(c); Render.frame(0, 1, R.cars[0], 'chase', {});   // (the camera's matrices for the shot)
    cam.updateMatrixWorld(); const pv = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse), v = V3(0, 0, 0);
    near = nearMeshes(c.tx, c.tz, 320);
    const from = s0 - 500, n = 501, on = new Uint8Array(n), xy = [];
    for (let k = 0; k < n; k++) {
      const p = at(from + k * 2); v.set(p.x, p.y + 0.9, p.z).applyMatrix4(pv);
      const inF = v.z < 1 && Math.abs(v.x) < 1.02 && Math.abs(v.y) < 1.02;
      if (inF && !blocked([c.px, c.py, c.pz], [p.x, p.y + 0.9, p.z])) on[k] = 1;
      xy.push(inF ? [Math.round(v.x * 1000) / 1000, Math.round(v.y * 1000) / 1000, on[k]] : null);
    }
    return { from, on, pv, xy };
  }
  // the cars the camera sees at each frame of the next sec seconds (their places in the frame, -1 to 1, and how big they are there: 1 at the
  // corner's distance, a quarter twice as far), the race going on (nothing drawn)
  function timeline(c, s0, sec) {
    const S = seenRoad(c, s0), v = V3(0, 0, 0), out = [], d0 = Math.hypot(c.tx - c.px, c.ty - c.py, c.tz - c.pz);
    for (let k = 0; k < sec * fps; k++) {
      run(1 / fps); const f = [];
      for (const car of R.cars) {
        if (!car.q) continue; let d = car.q.s - S.from; if (!T.open) d = ((d % T.len) + T.len) % T.len;
        const i = Math.round(d / 2); if (i < 0 || i >= S.on.length || !S.on[i]) continue;
        const w = Math.min(1, Math.pow(d0 / Math.max(1, Math.hypot(car.x - c.px, (car.y || 0) - c.py, car.z - c.pz)), 2)); if (w < 0.12) continue;
        v.set(car.x, (car.y || 0) + 0.7, car.z).applyMatrix4(S.pv); f.push([Math.round(v.x * 100) / 100, Math.round(v.y * 100) / 100, Math.round(w * 100) / 100]);
      }
      out.push(f);
    }
    let seen = 0; for (const x of S.on) seen += x;
    return { frames: out, seen: seen * 2 };
  }
  // where the cars are along the track (metres) and the race's clock
  const where = () => ({ t: R.time, s: R.cars.map(c => c.q ? Math.round(c.q.s) : null) });
  // run until the first car is `before` metres short of s0 (at most max s)
  function until(s0, before, max) {
    for (let t = 0; t < (max || 900); t += 0.25) {
      for (const c of R.cars) { const s = c.q ? c.q.s : -1e9; if (T.open ? s >= s0 - before : (((s0 - before - s) % T.len) + T.len) % T.len < 8) return R.time; }
      run(0.25);
    }
    return -1;
  }
  // one frame: the race a frame on, drawn through the corner camera, as JPEG
  function frame(c, q) {
    run(1 / fps); shot(c);
    Render.frame(1 / fps, 1, R.cars[0], 'chase', {});
    return cv.toDataURL('image/jpeg', q || 0.92);
  }
  // the race drawn through the camera for sec seconds at n frames a second, nothing kept: the tyres' marks laid as they will be through the
  // loop (else they would build up from nothing and vanish at its seam)
  function warm(c, sec, n) { for (let k = 0; k < sec * n; k++) { run(1 / n); shot(c); Render.frame(1 / n, 1, R.cars[0], 'chase', {}); } }
  function still(c, q) { shot(c); Render.frame(1 / fps, 1, R.cars[0], 'chase', {}); return cv.toDataURL('image/jpeg', q || 0.9); }
  return { setup, run, search, timeline, until, where, frame, still, warm, span, seen: (c, s0) => { const S = seenRoad(c, s0); return { from: S.from, xy: S.xy }; }, get race() { return R; } };
})();
