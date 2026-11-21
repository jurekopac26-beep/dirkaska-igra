/* =========================================================================
   WORLD — realizem, skupina 1 (Nürburg, Pikes Peak, Tianmen; docs/realizem.md): what the chase camera sees of these real tracks (the
   horizon, the road, its edges, the ground), on top of their own worlds: World.ext.nring, .pikes and .tianmen wrapped as
   js/world-aguascalientes.js wraps the shared builder, loaded after them (index.html). Sources: OSM and the public elevation models only.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext) return;
  const API = World.api;

  /* ================= TIANMEN: the retaining walls under the stacked legs =================
     Where a leg runs above another, the terrain beside it (caH's blend down to the leg below) lies flat at the lower leg's height right up
     to the upper one's barrier, so its wall stood straight down to that floor: up to 126 m of bare face. The real mountain (the elevation
     model) falls between the legs as a steep forested slope; a wall holds only the road's edge. So: a cast-concrete retaining wall (battered
     1:12) as high as the leg needs, then the fill slope below it, scrub and forest floor with the rock showing on the steepest of it, down to
     where it meets the ground; never over the leg below (its corridor), else the wall goes on down. The old face is taken out of the road's
     meshes (its two triangles per sample and side, found by their exact corners); the camera stays above the new slope (camFloor). */
  const tmBase = World.ext.tianmen;
  if (tmBase) World.ext.tianmen = (scene, tex, opts, api) => {
    const out = tmBase(scene, tex, opts, api), T = (api && api.T) || API.T;
    let br = null;
    try { br = tmSpans(T); } catch (e) { console.error('realizem1 (tianmen, mostova):', e); }
    try { tmWalls(out, T, br && br.mask); } catch (e) { console.error('realizem1 (tianmen):', e); }
    try { if (br) tmBridges(out, T, br); } catch (e) { console.error('realizem1 (tianmen, mostova):', e); }
    return out;
  };

  /* ---- the two small bridges over the stream (OSM: two ways bridge=yes over the stream, 8.6 m and 9.1 m long, at ~1090 m and ~1685 m) ----
     The road crosses the stream coming down the slope twice, below the first hairpins, on short slab bridges; the game drew its plain verge
     and barrier over them on level ground. Here the old verge, guardrail and posts over the span go (found by their exact corners), a cast-
     concrete parapet stands on each side on the barrier's line (the barrier the physics knows stays where it was) with the deck's edge, its
     underside and the abutments, and the stream's bed is cut into the ground under it (the ground the physics knows stays as it was). Not in
     the sources: the parapet (plain concrete, as on the loop's bridge) and the bed's depth (~4 m under the deck); the place is good to ~15 m
     (OSM's line against the game's). The culvert at ~2185 m (OSM: culvert, under the road) shows nothing above the road: left as it is. */
  const TM_BR = [{ x: 96.1, z: 606.7, tx: -0.538, tz: 0.843, L: 8.6 }, { x: 108.0, z: 688.7, tx: 0.763, tz: -0.646, L: 9.1 }];
  function tmSpans(T) {
    const N = T.N, ds = T.ds, mask = new Uint8Array(N), list = [];
    for (const b of TM_BR) {
      let bi = -1, bd = 12;
      for (let i = 0; i < N; i++) { const d = Math.hypot(T.px[i] - b.x, T.pz[i] - b.z); if (d < bd && Math.abs(T.tx[i] * b.tx + T.tz[i] * b.tz) > 0.7) { bd = d; bi = i; } }
      if (bi < 0) continue;
      const h = Math.max(1, Math.round(b.L / 2 / ds)), i0 = bi - h, i1 = bi + h;
      if (i0 < 3 || i1 > N - 4) continue;
      for (let i = i0 - 1; i <= i1 + 1; i++) mask[i] = 1;   // (the parapets' reach, a sample on past each abutment: tmWalls leaves it be)
      list.push({ bi, i0, i1, L: b.L });
    }
    return list.length ? { mask, list } : null;
  }
  function tmBridges(out, T, br) {
    const { GB, clamp, lerp, sstep, rpHash } = API, gH = out.groundH, N = T.N, ds = T.ds, w = T.w, sw = 0.5, def = T.def;
    if (!out.root || !gH || !GB) return;
    const onB0 = new Uint8Array(N);
    if (def.loopBridge) for (let s = T.startS + def.loopBridge[0]; s <= T.startS + def.loopBridge[1]; s += ds / 2) onB0[T.idx(s)] = 1;
    const barOf = (i, side) => side > 0 ? T.br[i] : T.bl[i];
    // (the builder's own arithmetic, step for step, so the points come out to the same floats as its vertices)
    const gAt = (i, side, o) => { const y = T.hy[i], q = side * o; return gH(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; };
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const Q = (i, side, y, e) => { const o = side * (barOf(i, side) + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
    const vProf = (i, side) => { const bar = barOf(i, side), e = w, g = (o) => gAt(i, side, o), lift = (o, h) => [o, Math.max(h, g(o) + 0.05)];
      if (onB0[i]) return [[e + sw, -0.02], [bar - 0.45, -0.02], [bar + 0.58, -0.02], [bar + 0.62, -1.3], [bar + 0.68, -1.4]];
      if (g(bar + 0.45) < -2.6) return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, g(bar + 0.42) - 0.08], [bar + 1.15, g(bar + 1.15) + 0.03], [bar + 1.9, g(bar + 1.9) + 0.03]];
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, g(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, g(bar + 1.9) + 0.03]]; };
    const key = (p) => Math.fround(p[0]) + ',' + Math.fround(p[1]) + ',' + Math.fround(p[2]);
    // the old verge (its four bands), the guardrail or the blocks, the posts: every corner the builder may have put on the span's samples
    // (where the barrier stands well out from the road, the inside of a hairpin, the verge's first band stays: the deck there is the verge)
    const keys = new Set(), near = br.list.map(b => [T.px[b.bi], T.pz[b.bi]]);
    const wideOf = (b, side) => { let m = Infinity; for (let i = b.i0 - 1; i <= b.i1 + 1; i++) m = Math.min(m, barOf(i, side)); return m > w + sw + 2; };
    for (const b of br.list) { b.wide = { '-1': wideOf(b, -1), '1': wideOf(b, 1) }; }
    for (const b of br.list) for (const side of [-1, 1]) for (let i = b.i0 - 1; i <= b.i1 + 1; i++) {
      const P = vProf(i, side); for (let r = b.wide[side] ? 1 : 0; r < P.length; r++) keys.add(key(Pt(i, side * P[r][0], P[r][1])));
      for (const [y, e] of [[0.45, 0], [0.8, 0], [-0.15, -0.05], [0.8, -0.05], [-0.15, 0.45], [0.8, 0.45]]) keys.add(key(Q(i, side, y, e)));
      if (i % 2 === 0) { const p = Q(i, side, -0.35, 0.14), c = Math.cos(T.hd[i]), s = Math.sin(T.hd[i]), hx = 0.13 / 2, hz = 0.13 / 2, sy = 1.13;
        for (const [lx, ly, lz] of [[-hx, 0, -hz], [hx, 0, -hz], [hx, sy, -hz], [-hx, sy, -hz], [-hx, 0, hz], [hx, 0, hz], [hx, sy, hz], [-hx, sy, hz]]) keys.add(key([p[0] + lx * c - lz * s, p[1] + ly, p[2] + lx * s + lz * c])); }
    }
    let removed = 0;
    out.root.traverse((m) => {
      if (!m.isMesh || m.isInstancedMesh || !m.geometry || m.geometry.index || m.material === out.asphaltMat) return;
      const g = m.geometry, pos = g.attributes.position; if (!pos || pos.itemSize !== 3 || !pos.array) return;
      if (!g.boundingSphere) g.computeBoundingSphere(); const bs = g.boundingSphere;
      if (!bs || !near.some(([x, z]) => Math.hypot(bs.center.x - x, bs.center.z - z) < bs.radius + 30)) return;
      const pa = pos.array, n = Math.floor(pos.count / 3), keep = new Uint8Array(n); let drop = 0;
      for (let t = 0; t < n; t++) { let all = true;
        for (let v = 0; v < 3 && all; v++) { const q = t * 9 + v * 3; if (!keys.has(pa[q] + ',' + pa[q + 1] + ',' + pa[q + 2])) all = false; }
        keep[t] = all ? 0 : 1; if (all) drop++; }
      if (!drop) return;
      removed += drop;
      for (const name of Object.keys(g.attributes)) { const at = g.attributes[name], s = at.itemSize, src = at.array, dst = new src.constructor((n - drop) * 3 * s);
        let o = 0; for (let t = 0; t < n; t++) if (keep[t]) { dst.set(src.subarray(t * 3 * s, (t + 1) * 3 * s), o); o += 3 * s; }
        g.setAttribute(name, new THREE.BufferAttribute(dst, s)); }
      g.computeBoundingSphere();
    });

    // the bridges: the parapets (0.45 m thick, 0.95 m above the deck, the slab's edge 0.9 m under it, a wing wall down into the bank at each end),
    // the deck's edge out to them, the slab's underside and the abutments; the concrete of the road's walls
    const wMap = new THREE.CanvasTexture(tmWallCanvas()); wMap.wrapS = wMap.wrapT = THREE.RepeatWrapping; wMap.anisotropy = 4;
    if (out.ownTex) out.ownTex.push(wMap);
    const gb = new GB(true), sc = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
    for (const b of br.list) {
      const a = b.i0 - 1, z = b.i1 + 1, q = 0.92 + 0.12 * rpHash(b.bi >> 2, 61), lit = sc([0.74, 0.73, 0.7], q), stain = sc([0.55, 0.54, 0.5], q), deck = sc([0.6, 0.59, 0.56], q), under = [0.42, 0.42, 0.4];
      const u = (k) => (k - a) * ds / 4;
      for (const side of [-1, 1]) {
        const Qp = (i, y, e) => Q(i, side, y, e), bot = (i) => clamp(gAt(i, side, barOf(i, side) + 0.52) - 0.3, -7, -0.45);
        for (let k = a; k < z; k++) { const j = k + 1, ins = Qp(k, 0.4, 0.18);
          // the inner face, the top, the outer face (the slab's edge; at the ends a wing wall down into the bank)
          gb.quadO(Qp(k, -0.1, -0.05), Qp(j, -0.1, -0.05), Qp(j, 0.95, -0.05), Qp(k, 0.95, -0.05), null, ins, [[u(k), 0.025], [u(j), 0.025], [u(j), -0.2375], [u(k), -0.2375]], [lit, lit, lit, lit]);
          gb.quadO(Qp(k, 0.95, -0.05), Qp(j, 0.95, -0.05), Qp(j, 0.95, 0.4), Qp(k, 0.95, 0.4), null, ins, [[u(k), 0], [u(j), 0], [u(j), 0.11], [u(k), 0.11]], [lit, lit, lit, lit]);
          const yk = k === a ? bot(k) : k === b.i1 ? -7 : -0.9, yj = j === z ? bot(j) : j === b.i0 ? -7 : -0.9;
          gb.quadO(Qp(k, yk, 0.4), Qp(j, yj, 0.4), Qp(j, 0.95, 0.4), Qp(k, 0.95, 0.4), null, ins, [[u(k), -yk / 4], [u(j), -yj / 4], [u(j), -0.2375], [u(k), -0.2375]], [stain, stain, lit, lit]);
          // the deck's edge, from the shoulder out to the parapet
          const ok = barOf(k, side) + 0.07, oj = barOf(j, side) + 0.07;
          if (b.wide[side]) { const [ik, yik] = vProf(k, side)[1], [ij, yij] = vProf(j, side)[1];   // (from the verge's kept band out to the parapet)
            if (ik < ok - 0.05 && ij < oj - 0.05) gb.quadO(Pt(k, side * ik, yik), Pt(j, side * ij, yij), Pt(j, side * oj, -0.05), Pt(k, side * ok, -0.05), null, Pt(k, side * (ik + ok) / 2, -1),
              [[u(k), ik / 4], [u(j), ij / 4], [u(j), oj / 4], [u(k), ok / 4]], [deck, deck, deck, deck]); }
          else if (ok > w + sw + 0.05 || oj > w + sw + 0.05) gb.quadO(Pt(k, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * Math.max(oj, w + sw), -0.05), Pt(k, side * Math.max(ok, w + sw), -0.05), null, Pt(k, side * (w + 1), -1),
            [[u(k), (w + sw) / 4], [u(j), (w + sw) / 4], [u(j), oj / 4], [u(k), ok / 4]], [deck, deck, deck, deck]);
        }
        // the parapet's ends
        for (const [k, kn] of [[a, a + 1], [z, z - 1]]) { const yb = bot(k);
          gb.quadO(Qp(k, yb, -0.05), Qp(k, yb, 0.4), Qp(k, 0.95, 0.4), Qp(k, 0.95, -0.05), null, Qp(kn, 0.4, 0.18), [[0, -yb / 4], [0.11, -yb / 4], [0.11, -0.2375], [0, -0.2375]], [stain, stain, lit, lit]); }
      }
      // the slab's underside over the span, and the abutments' faces under its ends
      const L = (i) => Pt(i, -(T.bl[i] + 0.52), -0.9), R = (i) => Pt(i, T.br[i] + 0.52, -0.9), Ld = (i) => Pt(i, -(T.bl[i] + 0.52), -7), Rd = (i) => Pt(i, T.br[i] + 0.52, -7);
      for (let k = b.i0; k < b.i1; k++) gb.quadO(L(k), L(k + 1), R(k + 1), R(k), null, Pt(k, 0, 0), [[u(k), -T.bl[k] / 4], [u(k + 1), -T.bl[k + 1] / 4], [u(k + 1), T.br[k + 1] / 4], [u(k), T.br[k] / 4]], [under, under, under, under]);
      for (const [k, kb] of [[b.i0, b.i0 - 1], [b.i1, b.i1 + 1]]) { const wl = -(T.bl[k] + 0.52) / 4, wr = (T.br[k] + 0.52) / 4;
        gb.quadO(L(k), R(k), Rd(k), Ld(k), null, Pt(kb, 0, -3), [[wl, 0.225], [wr, 0.225], [wr, 1.75], [wl, 1.75]], [deck, deck, stain, stain]); }
    }
    let verts = 0;
    if (!gb.empty) { const m = new THREE.Mesh(gb.geometry(), new THREE.MeshLambertMaterial({ map: wMap, vertexColors: true })); m.receiveShadow = true; m.castShadow = false; m.matrixAutoUpdate = false; m.updateMatrix(); out.root.add(m); verts = m.geometry.attributes.position.count; }

    // the stream's bed under the deck and its gully up and down the slope, cut into the ground's tiles (the ground the physics knows stays)
    const HC = 12, hash = new Map(), hk = (a, b) => (a + 4096) * 8192 + (b + 4096);
    for (let j = 0; j < N; j++) { const k = hk(Math.floor(T.px[j] / HC), Math.floor(T.pz[j] / HC)); let L = hash.get(k); if (!L) hash.set(k, L = []); L.push(j); }
    const inSpan = (j) => br.list.some(b => j >= b.i0 && j <= b.i1);
    const D = br.list.map(b => { const i = b.bi; return { b, cx: T.px[i], cz: T.pz[i], tx: T.tx[i], tz: T.tz[i], nx: T.nx[i], nz: T.nz[i], A: (b.i1 - i) * ds }; });
    const depth = (x, z) => { let d = 0;
      for (const q of D) { const dx = x - q.cx, dz = z - q.cz, al = dx * q.tx + dz * q.tz, lt = dx * q.nx + dz * q.nz, aa = Math.abs(al), la = Math.abs(lt);
        if (aa > 30 || la > 36) continue;
        const bar = lt > 0 ? T.br[q.b.bi] : T.bl[q.b.bi], uf = sstep(bar + 6, bar + 12, la);
        const fa = 1 - ((1 - uf) * sstep(q.A - 1.5, q.A + 0.5, aa) + uf * sstep(q.A, q.A + 7, aa)); if (fa <= 0) continue;
        const fl = 1 - sstep(18, 32, la), fd = 1 - sstep(bar + 3, bar + 12, la), yD = T.hy[clamp(q.b.bi + Math.round(al / ds), q.b.i0, q.b.i1)];
        d = Math.max(d, 2.2 * fa * fl, fa * fd * (gH(x, z) - (yD - 4))); }
      if (d <= 0) return 0;
      // never under the road's other samples (the legs beside it, the road on either side of the span)
      const cx = Math.floor(x / HC), cz = Math.floor(z / HC);
      for (let a = cx - 1; a <= cx + 1; a++) for (let b = cz - 1; b <= cz + 1; b++) { const L = hash.get(hk(a, b)); if (!L) continue;
        for (const j of L) { if (inSpan(j)) continue; const dx = x - T.px[j], dz = z - T.pz[j]; if (Math.abs(dx * T.tx[j] + dz * T.tz[j]) > ds * 0.75) continue;
          const lt = dx * T.nx[j] + dz * T.nz[j], bj = lt > 0 ? T.br[j] : T.bl[j]; d *= sstep(bj + 3, bj + 9, Math.abs(lt)); if (d <= 0) return 0; } }
      return d; };
    // the tiles near the bridges (the fine ones 5 m a cell, the coarse 10 m); a fine tile's edge against a coarse one keeps to the coarse one's line
    const G = API.VR && API.VR.G, tl = [], tmap = new Map();
    if (out.ground && G) out.ground.traverse((m) => {
      if (!m.isMesh || !m.geometry || !m.geometry.index) return;
      const g = m.geometry, pa = g.attributes.position; if (!pa || !g.attributes.normal) return;
      if (!g.boundingSphere) g.computeBoundingSphere(); const bs = g.boundingSphere;
      if (!D.some(q => Math.hypot(bs.center.x - q.cx, bs.center.z - q.cz) < bs.radius + 50)) return;
      const p = pa.array, n = Math.round(Math.sqrt(pa.count)), S = Math.abs(p[3] - p[0]); if (n * n !== pa.count || !(S > 0)) return;
      const TS = (n - 1) * S, t = { g, S, n, x0: p[0], z0: p[2], ti: Math.round((p[0] - G.x0) / TS), tj: Math.round((p[2] - G.z0) / TS), dep: null };
      tl.push(t); tmap.set(t.ti + ',' + t.tj, t);
    });
    let tiles = 0, cut = 0, maxD = 0, fixed = 0;
    const H = (x, z) => gH(x, z) - depth(x, z);
    for (const t of tl) {
      const g = t.g, p = g.attributes.position.array, nr = g.attributes.normal, cl = g.attributes.color, sp = g.attributes.steep, n = t.n, m = n - 1, S = t.S, dep = new Float32Array(n * n);
      for (let k = 0; k < n * n; k++) { const d = depth(p[k * 3], p[k * 3 + 2]); if (d > 0.01) dep[k] = d; }
      const nbS = (a, b) => { const o = tmap.get(a + ',' + b); return o ? o.S : 0; }, fix = (k0, dk) => { for (let q = 1; q < m; q += 2) { const v = (dep[k0 + (q - 1) * dk] + dep[k0 + (q + 1) * dk]) / 2; if (v !== dep[k0 + q * dk]) fixed++; dep[k0 + q * dk] = v; } };
      if (nbS(t.ti, t.tj - 1) > S) fix(0, 1); if (nbS(t.ti, t.tj + 1) > S) fix(m * n, 1); if (nbS(t.ti - 1, t.tj) > S) fix(0, n); if (nbS(t.ti + 1, t.tj) > S) fix(m, n);
      if (!dep.some(v => v > 0)) continue;
      t.dep = dep; tiles++;
      for (let k = 0; k < n * n; k++) { const a = k % n, b = (k - a) / n, x = p[k * 3], z = p[k * 3 + 2];
        if (!dep[k] && !(a > 0 && dep[k - 1]) && !(a < m && dep[k + 1]) && !(b > 0 && dep[k - n]) && !(b < m && dep[k + n]) && !(depth(x + S, z) > 0.01) && !(depth(x - S, z) > 0.01) && !(depth(x, z + S) > 0.01) && !(depth(x, z - S) > 0.01)) continue;
        if (dep[k]) { p[k * 3 + 1] -= dep[k]; cut++; maxD = Math.max(maxD, dep[k]); }
        let nx = -(H(x + S, z) - H(x - S, z)) / (2 * S), nz = -(H(x, z + S) - H(x, z - S)) / (2 * S); const l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
        nr.array[k * 3] = nx; nr.array[k * 3 + 1] = ny; nr.array[k * 3 + 2] = nz; if (sp) sp.array[k] = sstep(0.78, 0.5, ny);
        // (the bed: the limestone's grey stones, washed; the gully's sides keep their cover)
        if (cl && dep[k]) { const f = sstep(1.5, 3.5, dep[k]) * 0.8, c = cl.array; c[k * 3] = lerp(c[k * 3], 0.44, f); c[k * 3 + 1] = lerp(c[k * 3 + 1], 0.43, f); c[k * 3 + 2] = lerp(c[k * 3 + 2], 0.39, f); }
      }
      g.attributes.position.needsUpdate = nr.needsUpdate = true; if (cl) cl.needsUpdate = true; if (sp) sp.needsUpdate = true; g.computeBoundingSphere();
    }
    // how far the drawn ground went down at (x, z): its two triangles a cell, as the tiles have them
    const meshDepth = (x, z) => { for (const t of tl) { if (!t.dep) continue; const m = t.n - 1, fx = (x - t.x0) / t.S, fz = (z - t.z0) / t.S;
        if (fx < 0 || fz < 0 || fx > m || fz > m) continue;
        const a = Math.min(m - 1, Math.floor(fx)), b = Math.min(m - 1, Math.floor(fz)), u = fx - a, v = fz - b, n = t.n, k = b * n + a, d = t.dep;
        return u + v <= 1 ? d[k] + u * (d[k + 1] - d[k]) + v * (d[k + n] - d[k]) : d[k + n + 1] + (1 - u) * (d[k + n] - d[k + n + 1]) + (1 - v) * (d[k + 1] - d[k + n + 1]); }
      return 0; };
    // the plants down with the ground; on the deck's footprint none
    const seen = new Set(); let lowered = 0, hidden = 0;
    out.root.traverse((m) => {
      if (!m.isInstancedMesh || !m.instanceMatrix) return; const A = m.instanceMatrix.array; if (seen.has(A)) return; seen.add(A);
      let ch = false;
      for (let k = 0; k < m.count; k++) { const o = k * 16, x = m.position.x + A[o + 12], z = m.position.z + A[o + 14];
        if (!D.some(q => Math.abs(x - q.cx) < 50 && Math.abs(z - q.cz) < 50)) continue;
        let on = false;
        for (const q of D) { const dx = x - q.cx, dz = z - q.cz, al = dx * q.tx + dz * q.tz, lt = dx * q.nx + dz * q.nz; if (Math.abs(al) < q.A + ds + 0.5 && Math.abs(lt) < (lt > 0 ? T.br[q.b.bi] : T.bl[q.b.bi]) + 1) on = true; }
        if (on) { for (let r = 0; r < 12; r++) A[o + r] = 0; hidden++; ch = true; continue; }
        const d = meshDepth(x, z); if (d > 0.05) { A[o + 13] -= d; lowered++; ch = true; } }
      if (ch) m.instanceMatrix.needsUpdate = true;
    });
    out.rz1 = out.rz1 || {};
    out.rz1.br = { at: br.list.map(b => b.bi), wide: br.list.map(b => [b.wide[-1] ? 1 : 0, b.wide[1] ? 1 : 0]), removed, verts, tiles, cut, fixed, maxD: +maxD.toFixed(1), lowered, hidden, near: tl.map(t => t.S),
      g: br.list.map(b => [-1, 1].map(s => { let lo = 0; for (let i = b.i0; i <= b.i1; i++) lo = Math.min(lo, gAt(i, s, barOf(i, s) + 0.52)); return +lo.toFixed(1); })) };
  }

  let wallCanvas = null;
  // a cast-concrete face, 4 x 4 m at 64 px to the metre: the formwork's lifts level every metre (a dark joint, the slurry's paler band under
  // it), its panels' joints every 2 m, the tie holes, a weep hole in every other lift with the dark stain of its water below it, the rain's
  // streaks down the face; grey, a touch warm (the vertex colours darken it to the stained concrete of the road's walls)
  function tmWallCanvas() {
    if (wallCanvas) return wallCanvas;
    const S = 256, R = API.rng(7310), v = new Float32Array(S * S), col = new Float32Array(S);
    for (let k = 0; k < 30; k++) { const x0 = Math.floor(R() * S), wd = 1 + Math.floor(R() * 6), a = 0.03 + R() * 0.09;
      for (let dx = -wd; dx <= wd; dx++) col[(x0 + dx + S) % S] += a * (1 - Math.abs(dx) / (wd + 1)); }
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      let t = 0.84 + (R() - 0.5) * 0.08 + 0.025 * Math.sin(x * 0.21 + y * 0.03) * Math.sin(y * 0.17);
      const ly = y % 64, lx = x % 128;
      if (ly === 0) t -= 0.17; else if (ly === 1) t -= 0.08; else if (ly < 12) t += 0.03 * (1 - ly / 12);
      if (lx === 0) t -= 0.12; else if (lx === 1 || lx === 127) t -= 0.05;
      t -= col[x] * (0.75 + 0.25 * Math.sin(y * 0.045 + x * 0.7));
      v[y * S + x] = t;
    }
    const dot = (cx, cy, r, a) => { for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
      const d = Math.hypot(x - cx, y - cy); if (d < r + 1) v[((y + S) % S) * S + ((x + S) % S)] -= a * Math.min(1, r + 1 - d); } };
    for (let ly = 0; ly < 4; ly++) for (let k = 0; k < 6; k++) dot(21 + k * 42.7, ly * 64 + 32, 1.6, 0.16);   // (the tie holes)
    for (const [hx, hy] of [[64, 44], [192, 172]]) {   // the weep holes and their stains
      dot(hx, hy, 4.2, 0.5);
      for (let y = hy + 4; y < hy + 90; y++) { const f = 1 - (y - hy - 4) / 86, wd = 2 + 4 * f;
        for (let x = Math.floor(hx - wd); x <= hx + wd; x++) v[(y % S) * S + ((x + S) % S)] -= 0.2 * f * (1 - Math.abs(x - hx) / (wd + 1)); }
    }
    const c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d'), id = g.createImageData(S, S), d = id.data;
    for (let k = 0; k < S * S; k++) { const t = Math.max(0, Math.min(1, v[k])); d[k * 4] = 255 * t; d[k * 4 + 1] = 255 * t * 0.985; d[k * 4 + 2] = 255 * t * 0.94; d[k * 4 + 3] = 255; }
    g.putImageData(id, 0, 0);
    return (wallCanvas = c);
  }

  let slopeCanvas = null, slopeMean = 0.7;
  // the slopes' face, 20 x 20 m at ~26 px to the metre: a broadleaf forest's closed canopy seen from above (ESA WorldCover has forest on most of
  // Tianmen's slopes; the trees themselves stand only where the ground is gentler): lumpy crowns of 1.2-2.8 m radius, leafy, their tops 2.5 m
  // apart in height, lit from up the slope (the map's -v) and above, each casting its shade down the slope onto the lower ones, the dark gaps
  // between them; grey (the vertex colours give the land cover's colour, over the map's mean: slopeMean)
  function tmSlopeCanvas() {
    if (slopeCanvas) return slopeCanvas;
    const S = 512, px = S / 20, R = API.rng(7313), h = new Float32Array(S * S).fill(1.5 * px), tone = new Float32Array(S * S).fill(0.8), v = new Float32Array(S * S);
    const wr = (a) => ((a % S) + S) % S;
    const dome = (cx, cy, r, top, tn) => { for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const d2 = ((x - cx) * (x - cx) + (y - cy) * (y - cy)) / (r * r); if (d2 >= 1) continue;
      const k = wr(y) * S + wr(x), e = top - 0.75 * r * (1 - Math.sqrt(1 - d2)); if (e > h[k]) { h[k] = e; tone[k] = tn; } } };
    for (let n = 0; n < 120; n++) {
      const cx = R() * S, cy = R() * S, r = (1.2 + 1.6 * R() * R()) * px, top = (4 + 2.5 * R()) * px, tn = 0.86 + 0.28 * R();
      dome(cx, cy, r * 0.8, top - r * 0.2, tn);
      for (let m = 0; m < 7; m++) { const a = R() * 6.283, q = (0.25 + 0.4 * R()) * r, rr = (0.34 + 0.18 * R()) * r; dome(cx + Math.cos(a) * q, cy + Math.sin(a) * q, rr, top - q * 0.4, tn * (0.94 + 0.12 * R())); }
    }
    // the leaves' clumps: a value noise of 8 and 4 px cells (wrapping) on the crowns' surface, for the shading only
    const vn = (x, y, c) => { const n = S / c, fx = x / c, fy = y / c, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
      const q = (a, b) => API.rpHash(((a % n) + n) % n, (((b % n) + n) % n) * 977 + c), sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      return (q(ix, iy) * (1 - sx) + q(ix + 1, iy) * sx) * (1 - sy) + (q(ix, iy + 1) * (1 - sx) + q(ix + 1, iy + 1) * sx) * sy; };
    const hl = new Float32Array(S * S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const k = y * S + x; hl[k] = h[k] + (h[k] > 1.5 * px ? 0.3 * px * (vn(x, y, 8) + 0.5 * vn(x, y, 4)) : 0); }
    const L = [0.35, -0.55, 0.76], lh = Math.hypot(L[0], L[1]), sx = L[0] / lh, sy = L[1] / lh, rise = L[2] / lh;
    let sum = 0;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const k = y * S + x, h0 = h[k], gx = (hl[y * S + wr(x + 1)] - hl[y * S + wr(x - 1)]) / 2, gy = (hl[wr(y + 1) * S + x] - hl[wr(y - 1) * S + x]) / 2;
      const nl = Math.hypot(gx, gy, 1), dif = Math.max(0, (-gx * L[0] - gy * L[1] + L[2]) / nl);
      let sh = 1;
      for (let st = 2; st < 48; st += 2) if (h[wr(Math.round(y + sy * st)) * S + wr(Math.round(x + sx * st))] > h0 + st * rise + 2) { sh = 0.62; break; }
      const occ = Math.min(1, Math.max(0, (h0 - 1.5 * px) / (3 * px)));
      const t = (0.35 + 0.65 * dif) * sh * (0.6 + 0.4 * occ) * tone[k] + (R() - 0.5) * 0.04;
      v[k] = t; sum += t;
    }
    const sc = 0.66 / (sum / (S * S));
    const c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d'), id = g.createImageData(S, S), d = id.data;
    let m = 0;
    for (let k = 0; k < S * S; k++) { const t = Math.max(0, Math.min(1, v[k] * sc)); m += t; d[k * 4] = 255 * t; d[k * 4 + 1] = 255 * t; d[k * 4 + 2] = 255 * t * (1.04 - 0.1 * t); d[k * 4 + 3] = 255; }
    slopeMean = m / (S * S);
    g.putImageData(id, 0, 0);
    return (slopeCanvas = c);
  }

  function tmWalls(out, T, brMask) {
    const { GB, clamp, lerp, sstep, rpHash } = API, P = API.VR, gH = out.groundH, N = T.N, def = T.def, ds = T.ds, w = T.w, sw = 0.5;
    if (!out.root || !gH || !P) return;
    // the samples on the loop's bridge, as the builder marks them (the deck has its own profile)
    const onBr = new Uint8Array(N);
    if (def.loopBridge) for (let s = T.startS + def.loopBridge[0]; s <= T.startS + def.loopBridge[1]; s += ds / 2) onBr[T.idx(s)] = 1;
    const onB0 = onBr.slice();   // (the builder's own: its verge's profile goes by these)
    if (brMask) for (let i = 0; i < N; i++) if (brMask[i]) onBr[i] = 1;   // (and the two small bridges over the stream, with their ends: tmBridges)
    const barOf = (i, side) => side > 0 ? T.br[i] : T.bl[i];
    // (the builder's own arithmetic, step for step, so the points come out to the same floats as its vertices)
    const gAt = (i, side, o) => { const y = T.hy[i], q = side * o; return gH(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; };
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const isWall = [-1, 1].map(side => { const a = new Uint8Array(N); for (let i = 0; i < N; i++) a[i] = !onBr[i] && gAt(i, side, barOf(i, side) + 0.45) < -2.6 ? 1 : 0; return a; });
    // the old face's corners (rows 1 and 2 of the verge's profile) of every sample beside a wall, as the builder makes them
    const rows = (i, side) => { const bar = barOf(i, side);
      if (!onB0[i] && gAt(i, side, bar + 0.45) < -2.6) return [[bar + 0.3, -0.04], [bar + 0.42, gAt(i, side, bar + 0.42) - 0.08]];
      const o1 = Math.max(w + sw + 0.6, bar - 0.7); return [[o1, Math.max(-0.12, gAt(i, side, o1) + 0.05)], [bar + 0.45, Math.min(-0.42, gAt(i, side, bar + 0.45) - 0.25)]]; };
    const key = (p) => Math.fround(p[0]) + ',' + Math.fround(p[1]) + ',' + Math.fround(p[2]);
    const face = new Set(); let segs = 0;
    for (const side of [-1, 1]) { const W = isWall[side > 0 ? 1 : 0];
      for (let i = 0; i < N - 1; i++) { if (!W[i] && !W[i + 1]) continue; segs++;
        for (const j of [i, i + 1]) { for (const [o, y] of rows(j, side)) face.add(key(Pt(j, side * o, y)));
          // (and the old face's apron on the ground at its foot, to 1.9 m out: under the new wall and slope it is buried, but before a wall straight
          // down beside a leg below it lay 3 cm over the ground's own heights, in patches over and under the ground's coarser mesh)
          if (W[j]) { const bar = barOf(j, side); for (const d of [1.15, 1.9]) face.add(key(Pt(j, side * (bar + d), gAt(j, side, bar + d) + 0.03))); } } } }
    if (!segs) return;
    // take the old faces out of the road's meshes: the triangles with all three corners on those rows
    let removed = 0, gMat = null;
    out.root.traverse((m) => {
      if (!m.isMesh || !m.geometry || m.geometry.index || !m.geometry.attributes.uv || m.material === out.asphaltMat) return;
      const mt = m.material; if (!mt || !mt.isMeshLambertMaterial || !mt.map || !mt.vertexColors) return;
      const g = m.geometry, pa = g.attributes.position.array, n = pa.length / 9, keep = new Uint8Array(n); let drop = 0;
      for (let t = 0; t < n; t++) { let all = true;
        for (let v = 0; v < 3 && all; v++) { const b = t * 9 + v * 3; if (!face.has(pa[b] + ',' + pa[b + 1] + ',' + pa[b + 2])) all = false; }
        keep[t] = all ? 0 : 1; if (all) drop++; }
      if (!drop) return;
      removed += drop; gMat = gMat || mt;
      for (const name of Object.keys(g.attributes)) { const at = g.attributes[name], s = at.itemSize, src = at.array, dst = new src.constructor((n - drop) * 3 * s);
        let o = 0; for (let t = 0; t < n; t++) if (keep[t]) { dst.set(src.subarray(t * 3 * s, (t + 1) * 3 * s), o); o += 3 * s; }
        g.setAttribute(name, new THREE.BufferAttribute(dst, s)); }
      g.computeBoundingSphere();
    });
    out.rz1 = { segs, removed };
    if (!gMat) return;   // (nothing matched: the builder changed; leave its walls be)

    // the road's samples hashed (12 m cells), for the legs below: a slope comes down onto a lower leg, it does not go through it
    const HC = 12, hash = new Map(), hk = (a, b) => (a + 4096) * 8192 + (b + 4096);
    for (let j = 0; j < N; j++) { const k = hk(Math.floor(T.px[j] / HC), Math.floor(T.pz[j] / HC)); let L = hash.get(k); if (!L) hash.set(k, L = []); L.push(j); }
    // a lower leg beside the point (x, z) at the height yA: { j, lat, cut: true } in its corridor (its barrier + 2 m) above it; { j, lat, cut: false }
    // within 10 m of that, the point down at its level (the pit between two legs, the terrain there at a third one's level, is filled up to it)
    const lowLeg = (i, x, z, yA, o) => { const cx = Math.floor(x / HC), cz = Math.floor(z / HC); let best = null;
      for (let a = cx - 1; a <= cx + 1; a++) for (let b = cz - 1; b <= cz + 1; b++) { const L = hash.get(hk(a, b)); if (!L) continue;
        for (const j of L) { if (T.hy[j] > T.hy[i] - 1 || Math.abs(j - i) * ds < 1.3 * Math.hypot(T.px[j] - T.px[i], T.pz[j] - T.pz[i]) + 4) continue;   // (not the own leg: a sample whose road from here is about as long as the straight line)
          const dx = x - T.px[j], dz = z - T.pz[j], al = dx * T.tx[j] + dz * T.tz[j]; if (Math.abs(al) > ds * 0.75) continue;
          const lt = dx * T.nx[j] + dz * T.nz[j], lim = (lt > 0 ? T.br[j] : T.bl[j]) + 2;
          if (Math.abs(lt) < lim && yA > T.hy[j] - 0.3) return { j, lat: lt, cut: true };
          if (Math.abs(lt) < lim + 10 && yA <= T.hy[j] - 0.05 && (!best || T.hy[j] > T.hy[best.j])) best = { j, lat: lt, cut: false }; } }
      return best; };
    const latTo = (j, x, z) => (x - T.px[j]) * T.nx[j] + (z - T.pz[j]) * T.nz[j];
    // the slope from the wall's foot (oW, yW) down at m (vertical to horizontal): to where it meets the ground (land 0); or onto a leg below, a cut
    // face at its corridor down to its level (land 1), or down at its level near it (land 2); over a pit, then on at that level to the leg's wall (oE)
    // the wall's foot: battered back 8 cm a metre, but never out over a lower leg (its barrier, the blocks' back face 0.57 m out, and 0.4 m more)
    const inLow = (i, x, z, yF) => { const cx = Math.floor(x / HC), cz = Math.floor(z / HC);
      for (let a = cx - 1; a <= cx + 1; a++) for (let b = cz - 1; b <= cz + 1; b++) { const L = hash.get(hk(a, b)); if (!L) continue;
        for (const j of L) { if (T.hy[j] > T.hy[i] - 1 || yF < T.hy[j] - 0.3 || Math.abs(j - i) * ds < 1.3 * Math.hypot(T.px[j] - T.px[i], T.pz[j] - T.pz[i]) + 4) continue;
          const dx = x - T.px[j], dz = z - T.pz[j]; if (Math.abs(dx * T.tx[j] + dz * T.tz[j]) > ds * 0.75) continue;
          const lt = dx * T.nx[j] + dz * T.nz[j]; if (Math.abs(lt) < (lt > 0 ? T.br[j] : T.bl[j]) + 1) return true; } }
      return false; };
    const footO = (i, side, hw) => { const bar = barOf(i, side), o0 = bar + 0.3 + 0.08 * hw, yF = T.hy[i] - 0.04 - hw, inC = (o) => { const q = side * o; return inLow(i, T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q, yF); };
      if (!inC(o0)) return o0; let lo = bar + 0.3, hi = o0; if (inC(lo)) return lo;
      for (let k = 0; k < 6; k++) { const mid = (lo + hi) / 2; if (inC(mid)) hi = mid; else lo = mid; }
      return lo; };
    // (a bank is an embankment or a cut slope, not the mountain: its toe not more than 60 m under the road, the level fill before a leg below not
    // wider than 20 m. Past that the road stands on the mountain's own face, the wall straight into the elevation model's ground: the legs 86-94 and
    // 124-133 m above the leg at ~1430-1560 m, 50-68 m to the side, had one plane each down to that leg's verge and a level fill over the gully)
    const BANK = 60, FILL = 20;
    const march = (i, side, hw, m) => { const bar = barOf(i, side), oW = footO(i, side, hw), yW = -0.04 - hw, at = (o) => { const q = side * o; return [T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q]; };
      if (gAt(i, side, oW) >= yW - 0.05) return { oW, yW, hw, m, full: true };
      let prev = oW;
      for (let k = 1; k <= 130; k++) { const o = oW + k * 0.75, ys = yW - (o - oW) * m;
        if (ys <= gAt(i, side, o)) { let lo = prev, hi = o; for (let it = 0; it < 6; it++) { const mid = (lo + hi) / 2; if (yW - (mid - oW) * m <= gAt(i, side, mid)) hi = mid; else lo = mid; } if (m * (hi - oW) - yW > BANK) return null; return { oW, yW, hw, m, oM: hi, land: 0 }; }
        const [x, z] = at(o), L = lowLeg(i, x, z, T.hy[i] + ys, o);
        if (L) { const j = L.j, yB = T.hy[j] - T.hy[i] - 0.05, lim = (L.lat > 0 ? T.br[j] : T.bl[j]) + 2, inside = (oo) => { const [a, b] = at(oo); return Math.abs(latTo(j, a, b)) < lim; };
          let oM = o, yL = ys, land = 2;
          if (L.cut) { let lo = prev, hi = o; for (let it = 0; it < 5; it++) { const mid = (lo + hi) / 2; if (inside(mid)) hi = mid; else lo = mid; } oM = hi; yL = yW - (oM - oW) * m; land = 1; }
          else { oM = Math.max(oW + 0.2, oW + (yW - yB) / m); yL = yB; }
          // over a pit (the ground well under the leg's level): on, flat at its level, to its wall (its barrier + 0.32 m) where the slope runs towards it
          let oE = 0; if (gAt(i, side, oM + 0.5) < yB - 0.4) { const r = -Math.sign(L.lat) * side * (T.nx[i] * T.nx[j] + T.nz[i] * T.nz[j]);
            if (r > 0.25) oE = Math.max(oM + 0.4, o + Math.min(16, (Math.abs(L.lat) - (lim - 2 + 0.32)) / r)); }
          if (-yB > BANK || oE - oM > FILL) return null;
          return { oW, yW, hw, m, oM, yL, yB, land, oE }; }
        prev = o; }
      return null; };
    // the cost of a profile: the walls' height (a cut face a little more), the steeper slope a little more; the plain wall down to the floor is the last resort
    const cost = (r, H) => !r ? 1e9 : r.full ? H + 0.3 : r.hw + (r.land === 1 ? 1.3 * Math.max(0, r.yL - r.yB) : 0) + 1.5 * (r.m - 0.9);
    const TRY = [[0, 0.9], [0, 1.25], [3, 1.25], [0, 1.7], [3, 1.7], [7, 1.7], [0, 2.3], [7, 2.3], [14, 2.3]];
    // (deep in a hairpins' stack, the leg below 50-70 m down and 25-40 m out (OSM's line, the road's grade): Tianmen's karst slope, steep and
    // overgrown, the rock showing through; a wall of the stack's whole height, 25-69 m, the face before the pit ~2200 m, is not there)
    const TRY2 = TRY.concat([[0, 3.0], [4, 3.0], [0, 3.6], [4, 3.6]]);
    const wall = [[], []];
    let nFull = 0, nLand = 0, nBig = 0;
    for (const side of [-1, 1]) { const si = side > 0 ? 1 : 0, W = isWall[si], hwA = new Float32Array(N), mA = new Float32Array(N), HA = new Float32Array(N);
      for (let i = 0; i < N; i++) { if (!W[i]) continue;
        const H = -gAt(i, side, barOf(i, side) + 0.45), q = side * barOf(i, side), nz = P.c4(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q);
        const hw0 = clamp(1.8 + 0.18 * H, 2.5, 6.5) + (nz - 0.5) * 1.2; HA[i] = H; hwA[i] = H + 0.3; mA[i] = 2.3;
        let best = H + 0.3;
        for (const [add, m] of H > 20 ? TRY2 : TRY) { const hw = hw0 + add; if (hw >= H + 0.3 || hw + 1.5 * (m - 0.9) >= best) continue;
          const r = march(i, side, hw, m), c = cost(r, H); if (c < best) { best = c; hwA[i] = hw; mA[i] = m; } } }
      // smoothed along each run of wall (the most of the neighbours', then their mean: never below what each sample needs)
      const filt = (A) => { const mx = new Float32Array(N), o = new Float32Array(N);
        for (let i = 0; i < N; i++) if (W[i]) { let v = A[i]; for (let k = 1; k <= 3; k++) { if (i - k >= 0 && W[i - k]) v = Math.max(v, A[i - k]); if (i + k < N && W[i + k]) v = Math.max(v, A[i + k]); } mx[i] = v; }
        for (let i = 0; i < N; i++) if (W[i]) { let s = mx[i], c = 1; for (let k = 1; k <= 3; k++) { if (i - k >= 0 && W[i - k]) { s += mx[i - k]; c++; } if (i + k < N && W[i + k]) { s += mx[i + k]; c++; } } o[i] = s / c; }
        return o; };
      const hwS = filt(hwA), mS = filt(mA);
      for (let i = 0; i < N; i++) { if (!W[i]) continue;
        const hw = Math.min(hwS[i], HA[i] + 0.3), r = march(i, side, hw, mS[i]) || { oW: footO(i, side, HA[i] + 0.3), yW: -0.34 - HA[i], hw: HA[i] + 0.3, m: 2.3, full: true };
        if (r.full) { nFull++; if (HA[i] > 6) nBig++; } else if (r.land) nLand++;
        r.H = HA[i]; wall[si][i] = r; } }

    // the profiles (offset from the road's centre, height above it), 8 points: 0 the wall's top, 1 its foot, 2-4 the slope, 5 where it ends, 6-7 on:
    // under the ground; or the cut face's foot (land 1), and over a pit the level ground on to the leg below
    const prof = (i, side) => { const r = wall[side > 0 ? 1 : 0][i], bar = barOf(i, side), p = [[bar + 0.3, -0.04], [r.oW, r.yW]];
      // (a wall straight down into the ground: its foot at least 0.6 m under it, so the face meets the ground in one clean line; nearer the surface
      // the soft contact shading (aoWorld: a foot within 0.45 m of the ground) laid its strips at this foot on some samples and not on others, each
      // tilted by the ground falling away to the leg below: a column of dark stepped slabs beside the wall, ~2390 m)
      if (r.full) { const yF = Math.min(r.yW, gAt(i, side, r.oW) - 0.6); p[1][1] = yF; for (let k = 0; k < 5; k++) p.push([r.oW, yF]); p.push([r.oW + 0.4, Math.min(yF, gAt(i, side, r.oW + 0.4) - 0.4)]); return p; }
      const L = r.oM - r.oW, yE = r.land ? r.yL : gAt(i, side, r.oM) - 0.05;
      for (const f of [0.2, 0.6, 0.6]) {   // (3 and 4 the same point: three bands of slope, the first, at the wall's foot, narrow)
        const o = r.oW + L * f, q = side * o, b = (P.n4(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - 0.5) * Math.min(3, 0.6 * Math.min(1, L / 6) + 0.06 * Math.max(0, L - 6));
        // (a bank not more than 2.5 m over the ground of the elevation model: over a gully it follows the gully down, not one plane across it, ~1500 m;
        // not a slope onto a leg below nor one over the pit of a hairpins' stack, there the ground under it is the legs' levelling, not the land's)
        p.push([o, Math.min(lerp(r.yW, yE, f) + b, r.land || r.oE || r.H > 15 ? 1e9 : gAt(i, side, o) + 2.5)]); }
      p.push([r.oM, yE]);
      const o6 = r.oM + (r.land === 1 ? 0.3 : 0.4); p.push([o6, r.land === 1 || r.oE ? r.yB : gAt(i, side, o6) - 0.35]);
      const o7 = r.oE ? Math.max(r.oE, o6 + 0.1) : o6 + 0.5; p.push([o7, r.oE ? r.yB : gAt(i, side, o7) - 0.35]);
      return p; };
    // beside the end of a run of wall: the old face's corners, then under the ground at the wall's offsets (the slope runs out into the terrain)
    const profEnd = (i, side, ref) => { const [r1, r2] = rows(i, side), p = [r1, r2]; for (let k = 2; k < 8; k++) p.push([ref[k][0], gAt(i, side, ref[k][0]) - 0.3]); return p; };
    const lc = API.vrLCf || (() => 0);
    tmSlopeCanvas(); const TX = 0.911 / slopeMean;   // (the crowns' map over the grit map's mean, 0.911, the slopes' old one: the same brightness on average)
    const wallCol = (x, z, i, si, foot) => { const q = 0.92 + 0.12 * rpHash(i >> 2, 51 + si);
      if (!foot) return [0.74 * q, 0.73 * q, 0.7 * q];
      const moss = sstep(0.5, 0.8, P.c3(x, z)) * 0.6; return [lerp(0.56, 0.4, moss) * q, lerp(0.56, 0.46, moss) * q, lerp(0.52, 0.32, moss) * q]; };
    const slopeCol = (x, z, m, t) => { const c1 = P.c1(x, z), f = P.n4(x, z), sh = lc(x, z, 1), fld = lc(x, z, 4);
      let R = lerp(0.27, 0.37, Math.max(sh, 0.35)), G = lerp(0.33, 0.43, Math.max(sh, 0.35)), B = lerp(0.17, 0.22, Math.max(sh, 0.35));
      R = lerp(R, 0.47, fld * 0.5); G = lerp(G, 0.5, fld * 0.5); B = lerp(B, 0.27, fld * 0.5);
      const lit = sstep(0.55, 0.85, c1) * 0.5; R = lerp(R, 0.34, lit); G = lerp(G, 0.37, lit); B = lerp(B, 0.19, lit);
      R += (f - 0.5) * 0.08; G += (f - 0.5) * 0.09; B += (f - 0.5) * 0.05;
      // (the forest where ESA WorldCover has it, most of Tianmen's slopes: the crowns' greens, as the trees', in clumps, not a grey face)
      const fo = lc(x, z, 0) * (1 - fld) * 0.85;
      if (fo > 0) { const k = 0.84 + 0.32 * P.n2(x * 0.13, z * 0.13); R = lerp(R, 0.19 * k, fo); G = lerp(G, 0.3 * k, fo); B = lerp(B, 0.115 * k, fo); }
      // (the rock where the land cover has it, ESA WorldCover; elsewhere a fill below the road is overgrown, only its steepest stretches show
      // stones in patches, and not under the forest)
      // (the steepest, 70 degrees and more down a hairpins' stack: the limestone through the green in patches, under the forest too)
      const rk = Math.max(sstep(1.9, 2.3, m) * sstep(0.6, 0.85, P.c2(x, z)) * 0.35 * (1 - fo), lc(x, z, 2) * 0.8, sstep(2.5, 3.4, m) * (0.25 + 0.4 * sstep(0.4, 0.75, P.c2(x, z))));
      if (rk > 0) { const k = 0.8 + 0.25 * P.n2(x * 0.6, z * 0.6); R = lerp(R, 0.66 * k, rk); G = lerp(G, 0.65 * k, rk); B = lerp(B, 0.61 * k, rk); }
      if (t < 0.18) { const g = (0.18 - t) / 0.18 * 0.55 * (1 - 0.6 * fo); R = lerp(R, 0.5, g); G = lerp(G, 0.48, g); B = lerp(B, 0.43, g); }
      return [R * TX, G * TX, B * TX]; };

    // the meshes: ~200 samples a chunk, both sides; the walls and cut faces (their own map), the slopes (theirs, the crowns: along the road and down the profile)
    const wMap = new THREE.CanvasTexture(tmWallCanvas()); wMap.wrapS = wMap.wrapT = THREE.RepeatWrapping; wMap.anisotropy = 4;
    if (out.ownTex) out.ownTex.push(wMap);
    const wMat = new THREE.MeshLambertMaterial({ map: wMap, vertexColors: true });
    const sMap = new THREE.CanvasTexture(tmSlopeCanvas()); sMap.wrapS = sMap.wrapT = THREE.RepeatWrapping; sMap.anisotropy = 4;
    if (out.ownTex) out.ownTex.push(sMap);
    const sMat = new THREE.MeshLambertMaterial({ map: sMap, vertexColors: true });
    const sTop = [new Float32Array(N), new Float32Array(N)];
    for (const side of [-1, 1]) { const si = side > 0 ? 1 : 0; for (let i = 1; i < N; i++) { const a = Pt(i - 1, side * (barOf(i - 1, side) + 0.3), 0), b = Pt(i, side * (barOf(i, side) + 0.3), 0); sTop[si][i] = sTop[si][i - 1] + Math.hypot(b[0] - a[0], b[2] - a[2]); } }
    const wuv = (p) => [(p[0] + 0.55 * p[1]) / 20, (-p[2] - 0.3 * p[1]) / 20];   // (the height in it too: a steep face not streaked down its fall line)
    const puv = (u, q) => [u, (q[0] - 0.85 * q[1]) / 20];   // a slope's own: along the road, and down its profile (offset and depth)
    const fl = [];   // the slopes' cross-sections for the camera's floor: [x, y, z] per profile point, per sample and side
    let verts = 0, nFace = 0;
    const add = (g, mat) => { if (g.empty) return; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = false; m.matrixAutoUpdate = false; m.updateMatrix(); out.root.add(m); verts += m.geometry.attributes.position.count; };
    const end6 = (r) => r && (r.full || r.oE);   // (the last band: the plain wall's skirt, the level ground over a pit; else under the ground, left out)
    const near0 = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 0.03;
    for (let c0 = 0; c0 < N - 1; c0 += 200) {
      const gw = new GB(true), gs = new GB(true);
      for (let i = c0; i < Math.min(c0 + 200, N - 1); i++) for (const side of [-1, 1]) {
        const si = side > 0 ? 1 : 0, W = isWall[si], j = i + 1; if (!W[i] && !W[j]) continue;
        let pi = W[i] ? prof(i, side) : null, pj = W[j] ? prof(j, side) : null;
        if (!pi) pi = profEnd(i, side, pj); if (!pj) pj = profEnd(j, side, pi);
        const A = pi.map(([o, y]) => Pt(i, side * o, y)), B = pj.map(([o, y]) => Pt(j, side * o, y));
        const ri = W[i] ? wall[si][i] : null, rj = W[j] ? wall[si][j] : null, yIn = Math.min(pi[1][1], pj[1][1]), u0 = sTop[si][i] / 4, u1 = sTop[si][j] / 4;
        const wq = (k, inside) => gw.quadO(A[k], A[k + 1], B[k + 1], B[k], null, inside, [[u0, -A[k][1] / 4], [u0, -A[k + 1][1] / 4], [u1, -B[k + 1][1] / 4], [u1, -B[k][1] / 4]],
          [wallCol(A[k][0], A[k][2], i, si, false), wallCol(A[k + 1][0], A[k + 1][2], i, si, true), wallCol(B[k + 1][0], B[k + 1][2], j, si, true), wallCol(B[k][0], B[k][2], j, si, false)]);
        // the wall's face, out from under the road; a tall one (deep in a hairpins' stack, the leg below 50-70 m down, ~2200 m) a wall only its
        // top 6 m, below that Tianmen's karst face: the slope's map and colours, the limestone through the green, bulging a little (its offsets
        // kept between the wall's top and foot: never out over the leg below)
        const fc = (p, ii) => { const h = -0.04 - p[1][1], R = []; if (!(h > 8.5)) return [p[1]];
          const oA = p[0][0], oB = Math.max(oA, p[1][0]), am = Math.min(2.5, 0.05 * h);
          for (let k = 0; k <= 2; k++) { const f = (6 + (h - 6) * k / 2) / h, o0 = lerp(oA, p[1][0], f), q = side * o0;
            const d = k % 2 ? (P.n4(T.px[ii] + T.nx[ii] * q, T.pz[ii] + T.nz[ii] * q + 37 * k) - 0.5) * 2 * am : 0;
            R.push([clamp(o0 + d, oA, oB), -0.04 - h * f]); }
          return R; };
        const Fi = fc(pi, i), Fj = fc(pj, j), ins0 = Pt(i, side * (barOf(i, side) - 2), yIn * 0.5);
        if (Fi.length < 2 && Fj.length < 2) wq(0, ins0);
        else {
          nFace++;
          const SA = Pt(i, side * Fi[0][0], Fi[0][1]), SB = Pt(j, side * Fj[0][0], Fj[0][1]);
          gw.quadO(A[0], SA, SB, B[0], null, ins0, [[u0, -A[0][1] / 4], [u0, -SA[1] / 4], [u1, -SB[1] / 4], [u1, -B[0][1] / 4]],
            [wallCol(A[0][0], A[0][2], i, si, false), wallCol(SA[0], SA[2], i, si, true), wallCol(SB[0], SB[2], j, si, true), wallCol(B[0][0], B[0][2], j, si, false)]);
          const U0 = sTop[si][i] / 20, U1 = sTop[si][j] / 20, at = (F, k) => F[Math.min(k, F.length - 1)], fcol = (v) => slopeCol(v[0], v[2], 4, 0.5);
          const tf = (p, q, r, up, uq, ur, ins) => { if (!near0(p, q) && !near0(q, r) && !near0(p, r)) gs.triO(p, q, r, fcol(p), ins, fcol(q), fcol(r), up, uq, ur); };
          for (let k = 0; k < 2; k++) { const a0 = at(Fi, k), a1 = at(Fi, k + 1), b0 = at(Fj, k), b1 = at(Fj, k + 1);
            const PA0 = Pt(i, side * a0[0], a0[1]), PA1 = Pt(i, side * a1[0], a1[1]), PB0 = Pt(j, side * b0[0], b0[1]), PB1 = Pt(j, side * b1[0], b1[1]);
            const ins = Pt(i, side * (Math.min(a0[0], a1[0], b0[0], b1[0]) - 3), (a0[1] + a1[1] + b0[1] + b1[1]) / 4);
            tf(PA0, PA1, PB1, puv(U0, a0), puv(U0, a1), puv(U1, b1), ins); tf(PA0, PB1, PB0, puv(U0, a0), puv(U1, b1), puv(U1, b0), ins); }
        }
        // the slope, the cut face onto the leg below (both ends landing so), the ground on
        const inS = Pt(i, side * (barOf(i, side) - 2), yIn - 30), mi = ri ? ri.m : 2.3, mj = rj ? rj.m : 2.3;
        const cs = (p, m, k) => slopeCol(p[0], p[2], m, (k - 1) / 4);
        // a step in the slope's reach (a fill over a gully beside one that met the ground short of it): the long one's cross-section zipped to
        // the short one's, run on under the ground out to the long one's reach: the fill's end face, not a band from toe to toe over the gully
        if (ri && rj && !ri.full && !rj.full && !(ri.land === 1 && rj.land === 1) && Math.abs(pi[7][0] - pj[7][0]) > 6) {
          const iL = pi[7][0] > pj[7][0], nL = iL ? i : j, nS = iL ? j : i, mL = iL ? mi : mj, mS = iL ? mj : mi;
          const QA = (iL ? pi : pj).slice(1), QB = (iL ? pj : pi).slice(1), oS = QB[6][0], oL = QA[6][0], n = Math.ceil((oL - oS) / 2.5);
          for (let t = 1; t <= n; t++) { const o = oS + (oL - oS) * t / n; QB.push([o, gAt(nS, side, o) - 0.4]); }
          const VA = QA.map(([o, y]) => Pt(nL, side * o, y)), VB = QB.map(([o, y]) => Pt(nS, side * o, y));
          const cA = VA.map((p, k) => cs(p, mL, k + 1)), cB = VB.map((p, k) => cs(p, mS, Math.min(k + 1, 7)));
          const tr = (p, q, r, cp, cq, cr, ins) => { if (!near0(p, q) && !near0(q, r) && !near0(p, r)) gs.triO(p, q, r, cp, ins, cq, cr, wuv(p), wuv(q), wuv(r)); };
          for (let a = 0, b = 0; a < 6 || b < VB.length - 1;) {   // (inside: under the long one's point, towards the road)
            const ins = Pt(nL, side * (QA[a][0] - 2), QA[a][1] - 2);
            if (b >= VB.length - 1 || (a < 6 && QA[a + 1][0] <= QB[b + 1][0])) { tr(VA[a], VA[a + 1], VB[b], cA[a], cA[a + 1], cB[b], ins); a++; }
            else { tr(VA[a], VB[b + 1], VB[b], cA[a], cB[b + 1], cB[b], ins); b++; }
          }
        } else for (let k = 1; k < 7; k++) {
          if ((near0(A[k], A[k + 1]) && near0(B[k], B[k + 1])) || (k === 6 && !end6(ri) && !end6(rj))) continue;
          if (k === 5 && ri && rj && ri.land === 1 && rj.land === 1) { wq(5, Pt(i, side * (barOf(i, side) - 2), Math.min(pi[5][1], pj[5][1]) + 30)); continue; }
          const U0 = sTop[si][i] / 20, U1 = sTop[si][j] / 20;
          gs.quadO(A[k], A[k + 1], B[k + 1], B[k], null, inS, [puv(U0, pi[k]), puv(U0, pi[k + 1]), puv(U1, pj[k + 1]), puv(U1, pj[k])], [cs(A[k], mi, k), cs(A[k + 1], mi, k + 1), cs(B[k + 1], mj, k + 1), cs(B[k], mj, k)]);
        }
        if (ri && !ri.full) fl.push(A);
      }
      add(gw, wMat); add(gs, sMat);
    }
    out.rz1.walls = isWall[0].reduce((s, v) => s + v, 0) + isWall[1].reduce((s, v) => s + v, 0);
    out.rz1.full = nFull; out.rz1.big = nBig; out.rz1.land = nLand; out.rz1.verts = verts; out.rz1.face = nFace;

    // the camera's floor: the slopes rasterised on a 1.5 m grid (the highest of each cell), so the chase camera stays out of them
    if (fl.length && out.camFloor) {
      let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
      for (const A of fl) for (const p of A) { x0 = Math.min(x0, p[0]); z0 = Math.min(z0, p[2]); x1 = Math.max(x1, p[0]); z1 = Math.max(z1, p[2]); }
      const C = 1.5, nx = Math.ceil((x1 - x0) / C) + 3, nz = Math.ceil((z1 - z0) / C) + 3;
      if (nx * nz < 6e6) {
        const F = new Float32Array(nx * nz).fill(-1e9), gx0 = x0 - C, gz0 = z0 - C;
        const put = (x, y, z) => { const a = Math.round((x - gx0) / C), b = Math.round((z - gz0) / C), k = b * nx + a; if (a >= 0 && b >= 0 && a < nx && b < nz && F[k] < y) F[k] = y; };
        for (const A of fl) for (let k = 1; k < 7; k++) { const a = A[k], b = A[k + 1], L = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.max(1, Math.ceil(L / 0.7));
          for (let s = 0; s <= n; s++) { const t = s / n; put(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t); } }
        const base = out.camFloor;
        out.camFloor = (x, z) => { const h = base(x, z), gx = (x - gx0) / C, gz = (z - gz0) / C, a = Math.floor(gx), b = Math.floor(gz);
          if (a < 0 || b < 0 || a >= nx - 1 || b >= nz - 1) return h;
          const u = gx - a, v = gz - b, f00 = Math.max(F[b * nx + a], h), f10 = Math.max(F[b * nx + a + 1], h), f01 = Math.max(F[(b + 1) * nx + a], h), f11 = Math.max(F[(b + 1) * nx + a + 1], h);
          return Math.max(h, (f00 * (1 - u) + f10 * u) * (1 - v) + (f01 * (1 - u) + f11 * u) * v); };
      }
    }
  }

  /* ================= PIKES PEAK: the old snow banks and the granite (~5300 m) =================
     Above the treeline the plowed banks were pale blue slabs and the granite's lichen bright orange: Pikes Peak granite is pink to tan,
     weathered grey-brown, its lichens small patches; snow banks by the road in June are grey-white with the road's grit at the foot. */
  const pkBase = World.ext.pikes;
  if (pkBase) World.ext.pikes = (scene, tex, opts, api) => {
    const out = pkBase(scene, tex, opts, api);
    try { pkFix(out); } catch (e) { console.error('realizem1 (pikes):', e); }
    return out;
  };

  function pkFix(out) {
    const rz = out.rz1 || (out.rz1 = {});
    if (out.root) pkSnowRock(out, rz);
  }

  function pkSnowRock(out, rz) {   // in the scenery's own meshes, by their exact colours (pkSnow's bank; the granite's sc: granite x k + lichen)
    const skip = new Set(out.ground ? out.ground.children : []), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const BK = [[0.44, 0.39, 0.36], [0.6, 0.58, 0.58], [0.98, 1.0, 1.06], [0.86, 0.9, 0.99], [0.76, 0.79, 0.86], [0.9, 0.91, 0.96], [0.74, 0.72, 0.72]];   // the bank: foot, grit, top, back, back's foot (x its tone); the old drifts in hollows: middle, rim
    const NB = [[0.42, 0.38, 0.35], [0.54, 0.51, 0.49], [0.8, 0.79, 0.77], [0.72, 0.71, 0.71], [0.62, 0.61, 0.6], [0.8, 0.79, 0.77], [0.6, 0.56, 0.53]];   // June's old snow (albedo ~0.5-0.7, fresh ~0.85): grey-white, the road's grit at the foot and rims
    const GR = [[0.54, 0.44, 0.39], [0.48, 0.42, 0.39], [0.58, 0.48, 0.43]], OR = [0.8, 0.5, 0.17], O2 = [0.6, 0.47, 0.36], f = 0.35;   // lichen: a rust-tan stain, a third as much
    const hs = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 4.1414 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
    const fitR = (c, g) => { const a11 = dot(g, g), a12 = dot(g, OR), a22 = dot(OR, OR), b1 = dot(g, c), b2 = dot(OR, c), d = a11 * a22 - a12 * a12;
      const al = (b1 * a22 - b2 * a12) / d, o = (a11 * b2 - a12 * b1) / d; return [al, o, Math.abs(c[0] - al * g[0] - o * OR[0]) + Math.abs(c[1] - al * g[1] - o * OR[1]) + Math.abs(c[2] - al * g[2] - o * OR[2])]; };
    let nb = 0, nr = 0;
    out.root.traverse(m => {
      if (!m.isMesh || m.isInstancedMesh || !m.geometry || !m.geometry.attributes.color || m.geometry.attributes.color.itemSize !== 3) return;
      const A = m.geometry.attributes, Cl = A.color.array, P = A.position.array, n = A.color.count, rk = new Int8Array(n).fill(-1), gd = skip.has(m), S = A.steep && A.steep.array; let ch = false, any = false;
      if (gd && !S) return;   // (in the ground's tiles only their far scenery: the drifts lie flat on the ground there)
      for (let v = 0; v < n; v++) { const o = v * 3, c = [Cl[o], Cl[o + 1], Cl[o + 2]];
        if (gd && (S[v] < 1.5 || P[o + 1] < 320)) continue;   // (the drifts: high up only)
        if (c[1] > 0.25 && c[2] > 0.25) { let hit = false;
          for (let k = gd ? 5 : 0, k1 = gd ? 7 : 5; k < k1 && !hit; k++) { const B = BK[k], t = dot(c, B) / dot(B, B);
            if (t < 0.75 || t > 1.25 || Math.abs(c[0] - t * B[0]) + Math.abs(c[1] - t * B[1]) + Math.abs(c[2] - t * B[2]) > 3e-4) continue;
            const q = hs(P[o], P[o + 1], P[o + 2]), s = t * (0.9 + 0.14 * q) * (q < 0.18 ? 0.86 : 1);   // (lumps and streaks of grit)
            Cl[o] = NB[k][0] * s; Cl[o + 1] = NB[k][1] * s; Cl[o + 2] = NB[k][2] * s; hit = ch = true; nb++; }
          if (hit || gd) continue; }
        if (gd) continue;
        if (c[0] > c[2] + 0.04 && c[0] >= c[1]) for (let k = 0; k < 3; k++) { const [al, o, e] = fitR(c, GR[k]); if (e < 3e-4 && al > 0.15 && o > -1e-4 && o < 0.92) { rk[v] = k; any = true; break; } }
      }
      if (any) {   // a rock's triangles: the vertices with sage or black lichen too (no exact fit) take their triangle's granite
        const I = m.geometry.index ? m.geometry.index.array : null, nt = I ? I.length / 3 : n / 3, vi = (t, q) => I ? I[t * 3 + q] : t * 3 + q;
        for (let t = 0; t < nt; t++) { let k = -1; for (let q = 0; q < 3; q++) if (rk[vi(t, q)] >= 0) k = rk[vi(t, q)]; if (k < 0) continue; for (let q = 0; q < 3; q++) if (rk[vi(t, q)] < 0) rk[vi(t, q)] = k; }
        for (let v = 0; v < n; v++) { if (rk[v] < 0) continue; const o = v * 3, g = GR[rk[v]], c = [Cl[o], Cl[o + 1], Cl[o + 2]], [al, oo] = fitR(c, g), w = Math.min(0.9, oo); if (w <= 0.003) continue;
          const k = al / (1 - w), w2 = w * f;   // c = (1 - o) k g + o OR  ->  (1 - o f) k g + o f O2
          for (let q = 0; q < 3; q++) Cl[o + q] = Math.max(0, c[q] + w2 * O2[q] - w * OR[q] + (w - w2) * k * g[q]);
          ch = true; nr++; } }
      if (ch) A.color.needsUpdate = true;
    });
    rz.bank = nb; rz.rock = nr;
  }
})();
