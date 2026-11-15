/* =========================================================================
   WORLD — Livingstone (theme 'livingstone'): from the town south along the main road through the dry savanna to the border post and over the
   old steel arch bridge across the gorge of the Zambezi to the far bank (docs/proge/livingstone.md). Its own builder (World.ext.livingstone)
   in a file of its own, on World's shared corridor helpers (World.api: nrPrep's terrain from the track's dem and land cover, as Luanda) and
   the scenery data of js/data/livingstone.js (OpenStreetMap, Copernicus DEM, ESA WorldCover, Meta / WRI canopy).
   The 60 m rule: the detailed things only within ~60 m of the road, as far as the chase camera sees them: the houses of the town's edge and
   the border post in their OSM footprints, the mopane, the umbrella thorn trees and the baobabs on the tawny grass, the low steel guardrail
   of the country road, the dark basalt of the gorge's rims, and the bridge itself (its steel arch, the deck and its railing: the model of
   assets/landmarks/livingstone.glb, made in Blender by tools/znamenitost/, World.znamenitost; until it has loaded, or if it cannot, the
   simpler one built here) high over the river at the bottom of the gorge (the real gorge under the deck: the terrain from the heights, not
   filled up to the road). Farther out only the terrain and the far land. Only geographic and plain names (no people, events, firms or brands).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, NRC, RB, TAU, atS, atSf, box, clamp, crH, crowdCtx, crowdFinish, crowdRun, cyl,
    ico, lerp, nrDem, nrDist, nrGround, nrLC, nrLCf, nrLump, nrNear, nrPrep, nrShade, nrTileGeo, nrTileOn, rng,
    sstep, valueNoise2, vary, waterMat
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  // ---- the trees (unit height 1, instanced): 0 an umbrella thorn (a slender forked trunk, a wide flat crown), 1 a mopane (a round crown;
  //      squat and sunk: the bushes of the scrub), 2 a baobab (a thick short trunk, a sparse wide flat crown; bare in the dry season) ----
  function lvTreeGeo(kind) {
    const g = new GB(), R = rng(2175 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    const bark = [0.42, 0.36, 0.3];
    if (kind === 0) {
      cyl(g, 0, -0.02, 0, 0.03, 0.42, 5, bark, null, 0.024);
      for (const a of [0.4, 2.6, 4.5]) cyl(g, Math.cos(a) * 0.05, 0.38, Math.sin(a) * 0.05, 0.018, 0.34, 4, bark, null, 0.012);
      ico(g, 0, 0.8, 0, 0.5, 0.2, [0.4, 0.46, 0.24], R, 0.18); nrLump(g, 0.18, 0.84, 0.1, 0.3, 0.3, [0.36, 0.42, 0.22], R, 0.16);
    } else if (kind === 1) {
      cyl(g, 0, -0.02, 0, 0.035, 0.42, 4, bark, null, 0.026);
      ico(g, 0, 0.64, 0, 0.42, 0.72, [0.44, 0.46, 0.26], R, 0.22);
    } else {
      cyl(g, 0, -0.02, 0, 0.11, 0.58, 6, [0.6, 0.55, 0.5], null, 0.08);
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + R() * 0.5; cyl(g, Math.cos(a) * 0.1, 0.52, Math.sin(a) * 0.1, 0.024, 0.22, 4, [0.58, 0.53, 0.48], null, 0.012); }
      ico(g, 0, 0.78, 0, 0.42, 0.22, [0.5, 0.46, 0.34], R, 0.32);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function lvGroundTex() {   // the ground under the vertex colours (256 px = 14 m, tileable): a pale dusty tone with flecks of dry grass
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), r = rng(2176), img = x.createImageData(S, S), d = img.data;
    const n1 = valueNoise2(2177, 40), n2 = valueNoise2(2178, 9), wr = (f, i, j) => { const u = i / S, v = j / S; return f(i, j) * (1 - u) * (1 - v) + f(i - S, j) * u * (1 - v) + f(i, j - S) * (1 - u) * v + f(i - S, j - S) * u * v; };
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const o = (j * S + i) * 4, k = 0.78 + wr(n1, i, j) * 0.16 + wr(n2, i, j) * 0.1 + (r() - 0.5) * 0.14;
      d[o] = Math.min(255, 214 * k); d[o + 1] = Math.min(255, 196 * k); d[o + 2] = Math.min(255, 160 * k); d[o + 3] = 255; }
    x.putImageData(img, 0, 0);
    for (let k = 0; k < 700; k++) { const px = r() * S, py = r() * S, g = 120 + r() * 70; x.strokeStyle = `rgba(${g + 30},${g + 14},${g - 30},0.35)`; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 4, py - 2 - r() * 4); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  }

  function buildLivingstone(scene, tex, opts) {
    const R = rng(2175), N = T.N, ds = T.ds, sStart = T.startS, sFin = T.finishS, iE = N - 1, def = T.def, L = T.len, LD = LS_DATA;
    if (!def.dem) { def.dem = LD.dem; def.lc = LD.lc; }   // (nrPrep reads the corridor's terrain and land cover from the track)
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: nrGround, camFloor: nrGround, props: [], farClip: true, ownTex: [], dust: [0.78, 0.68, 0.52] };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    const dS = (s) => s - sStart, sAt = (d) => clamp(sStart + d, 0, L - 0.01), dFin = sFin - sStart;   // (an open road: no wrapping)
    nrPrep();
    const P = API.NR, G = P.G;
    out.bounds = { minX: P.x0, maxX: P.x1, minZ: P.z0, maxZ: P.z1 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const W1 = [1, 1, 1];
    // what keeps the trees and the houses off (the buildings, the bridge, the crowds, the start), hashed circles
    const eh = new Map(), EHC = 32;
    const exclPush = (x, z, r) => { const e = { x, z, r }; for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); } };
    const excluded = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (const e of Lc) if ((x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; return false; };

    // ---- the bridge (def.bridges): its weight per sample (1 on the span, fading out over 10 m past the abutments), its box; the ground under
    //      the deck is the gorge of the heights (P.pad: not the corridor's fill up to the road) ----
    const BR = (def.bridges || []).map(([a, b]) => ({ a, b, i0: T.idx(sAt(a)), i1: T.idx(sAt(b)) }));
    const brW = new Float32Array(N), onBr = new Uint8Array(N);
    for (const B of BR) for (let i = 0; i < N; i++) { const d = dS(i * ds), f = Math.min(sstep(B.a - 2, B.a + 8, d), sstep(B.b + 2, B.b - 8, d)); if (f > brW[i]) brW[i] = f; if (d >= B.a - 3 && d <= B.b + 3) onBr[i] = 1; }
    const brBox = BR.map(B => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = B.i0; i <= B.i1; i++) { x0 = Math.min(x0, T.px[i]); x1 = Math.max(x1, T.px[i]); z0 = Math.min(z0, T.pz[i]); z1 = Math.max(z1, T.pz[i]); } return [x0 - 40, x1 + 40, z0 - 40, z1 + 40]; });
    const nearBr = (x, z) => brBox.some(b => x > b[0] && x < b[1] && z > b[2] && z < b[3]);

    // ---- the river at the bottom of the gorge (LD.water: OSM's line of the Zambezi), its level the lowest of the heights along it ----
    const RV = []; for (const fl of LD.water || []) { const pts = []; for (let k = 0; k + 1 < fl.length; k += 2) pts.push([fl[k], fl[k + 1]]); if (pts.length > 1) RV.push(pts); }
    let rvY = 1e9; for (const pts of RV) for (let k = 0; k + 1 < pts.length; k++) { const [ax, az] = pts[k], [bx, bz] = pts[k + 1], n = Math.ceil(Math.hypot(bx - ax, bz - az) / 4); for (let q = 0; q <= n; q++) rvY = Math.min(rvY, nrDem(ax + (bx - ax) * q / n, az + (bz - az) * q / n)); }
    rvY += 1.2;
    const RVW = 22;   // (m: half the river's width in the gorge)
    const segD = (pts, x, z) => { let bd = 1e9; for (let k = 0; k + 1 < pts.length; k++) { const [ax, az] = pts[k], [bx, bz] = pts[k + 1], vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1), 0, 1); bd = Math.min(bd, Math.hypot(x - ax - vx * t, z - az - vz * t)); } return bd; };
    const rvBox = RV.map(pts => [Math.min(...pts.map(p => p[0])) - 60, Math.max(...pts.map(p => p[0])) + 60, Math.min(...pts.map(p => p[1])) - 60, Math.max(...pts.map(p => p[1])) + 60]);
    const rvD = (x, z) => { let bd = 1e9; RV.forEach((pts, k) => { const b = rvBox[k]; if (x > b[0] && x < b[1] && z > b[2] && z < b[3]) bd = Math.min(bd, segD(pts, x, z)); }); return bd; };
    P.pad = (x, z, h) => {
      if (nearBr(x, z)) { const n = nrNear(x, z); if (n.i >= 0 && brW[n.i] > 0) h = lerp(h, Math.min(h, nrDem(x, z)), brW[n.i]); }
      if (RV.length) { const rd = rvD(x, z); if (rd < RVW + 30) h = Math.min(h, lerp(rvY - 2.2, h, sstep(RVW - 4, RVW + 30, rd))); }
      return h; };
    // the ground's colours (the dry season on the plateau): the tawny dry grass, the red-brown soil in patches, the grey-green of the mopane
    // woodland's canopy farther out and the leaf litter under the crowns near the road, the dust of the town, the dark basalt of the gorge
    P.colFn = (x, z, ny, dd, cov, o) => {
      const m = P.n3(x, z), q = P.n4(x, z), fo = nrLCf(x, z, 1), sc = nrLCf(x, z, 2), se = nrLCf(x, z, 3);
      let r = 0.86 + (m - 0.5) * 0.14, g = 0.74 + (m - 0.5) * 0.1 + (q - 0.5) * 0.06, b = 0.5 + (q - 0.5) * 0.08;
      const so = sstep(0.55, 0.85, P.n2(x, z)) * 0.55; r = lerp(r, 0.76, so); g = lerp(g, 0.56, so); b = lerp(b, 0.4, so);   // (bare red-brown soil)
      r = lerp(r, 0.7, sc * 0.5); g = lerp(g, 0.64, sc * 0.5); b = lerp(b, 0.42, sc * 0.5);
      const cv = clamp(cov, 0, 1), can = fo * (1 - cv);
      r = lerp(r, 0.5 + m * 0.06, can * 0.75); g = lerp(g, 0.52 + m * 0.05, can * 0.75); b = lerp(b, 0.34, can * 0.75);
      r = lerp(r, 0.6, cv * 0.75); g = lerp(g, 0.52, cv * 0.75); b = lerp(b, 0.4, cv * 0.75);
      const k = 0.96 + (q - 0.5) * 0.12; r = lerp(r, 0.82 * k, se * 0.5); g = lerp(g, 0.72 * k, se * 0.5); b = lerp(b, 0.58 * k, se * 0.5);
      const rk = sstep(0.86, 0.6, ny) * 0.95;   // (the basalt of the gorge's walls)
      r = lerp(r, 0.38 + q * 0.06, rk); g = lerp(g, 0.34 + q * 0.05, rk); b = lerp(b, 0.3 + q * 0.04, rk);
      if (RV.length) { const rd = rvD(x, z); if (rd < RVW + 14) { const t = sstep(RVW + 14, RVW - 2, rd); r = lerp(r, 0.44, t); g = lerp(g, 0.42, t); b = lerp(b, 0.36, t); } }
      if (dd < 4) { const t = sstep(4, 0.5, dd); r = lerp(r, 0.84, t); g = lerp(g, 0.74, t); b = lerp(b, 0.6, t); }
      o[0] = r; o[1] = g; o[2] = b; return o; };
    const gMat = new THREE.MeshLambertMaterial({ map: ownTex(lvGroundTex()), vertexColors: true });
    const tiles = [];
    for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { const on = nrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; tiles.push(ti, tj, on); }

    /* ---- the road: asphalt (resurfaced in sections, darker on the racing line), white edge lines and the centre line by the country's rules
       (World.cesta's crte); the chequered lines at the start and at the finish ---- */
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const RC = 128, tileL = 8, secT = new Float32Array(N), CZ = World.cesta ? World.cesta.crte(T, { r: 140, pred: 40 }) : null, CL = CZ ? CZ.at : null;
    for (let i0 = 0, k = 0; i0 < N; k++) { const n = 50 + Math.floor(crH(k, 3, 37) * 70), t = 0.9 + crH(k, 5, 37) * 0.15; for (let i = i0; i < Math.min(N, i0 + n); i++) secT[i] = t; i0 += n; }
    const shade = (i, o, w) => { const rl = T.rl[i]; let k = (0.84 - 0.12 * Math.exp(-((o - rl) * (o - rl)) / 5)) * secT[i]; if (Math.abs(o) > w * 0.9) k -= 0.04; return [k, k * 0.99, k * 0.97]; };
    for (let c0 = 0; c0 < N - 1; c0 += RC) {
      const gr = new RB(true), gl = new RB(); let pr = -1, pl = -1, pc = 0;
      for (let i = c0; i <= Math.min(c0 + RC, N - 1); i++) {
        const w = T.wAt(i), offs = [-w, -w / 2, 0, w / 2, w], v = i * ds / tileL;
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o, w)), offs.map(o => [(o + w) / tileL, v])); if (pr >= 0) gr.link(pr, r, 0, 4); pr = r;
        const wl = [0.9, 0.9, 0.86], cl = CL ? CL[i] : 0, lp = [Pt(i, -w + 0.22, 0.034), Pt(i, -w + 0.38, 0.034), Pt(i, w - 0.38, 0.034), Pt(i, w - 0.22, 0.034)];
        if (cl) lp.push(Pt(i, -0.08, 0.034), Pt(i, 0.08, 0.034));
        const l = gl.row(lp, lp.map(() => wl));
        if (pl >= 0) { gl.link(pl, l, 0, 1); gl.link(pl, l, 2, 3); if (cl && pc) gl.link(pl, l, 4, 5); } pl = l; pc = cl;
      }
      addM(gr, aMat); addM(gl, lMat);
    }
    {   // the chequered lines: the start, the finish
      const gq = new GB(true), HYp = (p) => T.hy[p[3]];
      for (const s0 of [sStart, sFin]) {
        const w = T.wAt(T.idx(s0)), uM = Math.round(w * 2 / 0.8) / 16;
        const a = atSf(s0 - 0.8, -w), b = atSf(s0 - 0.8, w), c = atSf(s0 + 0.8, w), d = atSf(s0 + 0.8, -w);
        gq.quadUp([a[0], HYp(a) + 0.04, a[1]], [b[0], HYp(b) + 0.04, b[1]], [c[0], HYp(c) + 0.04, c[1]], [d[0], HYp(d) + 0.04, d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker }));
    }

    /* ---- the barriers (Core's T.bl / T.br): the country road's low steel guardrail on its posts; on the bridge its steel railing (the
       model's own once it has loaded: here the top rail, the posts below); at the start and at the finish white walls with a catch fence and
       the crowd behind it; a barrier across the road at both its ends ---- */
    const startArea = (i) => { const d = dS(i * ds); return d < 140 || d > dFin - 100; };
    const kindAt = (i) => (onBr[i] ? 2 : startArea(i) ? 1 : 0);   // 0 guardrail, 1 white wall and fence, 2 the bridge's railing
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const stl = [0.72, 0.74, 0.76], stlD = [0.52, 0.54, 0.56], wh = [0.92, 0.92, 0.9], whD = [0.74, 0.74, 0.72], brS = [0.6, 0.62, 0.6], brSD = [0.44, 0.46, 0.45];
    const scen = new Chunks(128);
    // the railway on the old bridge (OpenStreetMap: one track of Cape gauge in the deck beside the road's centre line): two rails flush
    // with the asphalt, at the offset of the OSM line from the road at each sample on the bridge (only a look: the car drives over them)
    const railO = new Float32Array(N).fill(NaN), rlH = [0.56, 0.56, 0.57], rlS = [0.36, 0.31, 0.27];
    for (const B of BR) for (let i = B.i0; i <= B.i1; i++) {
      let best = 8, o = NaN;
      for (const r of (LD.rail || [])) if (r[0]) { const p = r[2]; for (let k = 0; k + 3 < p.length; k += 2) {
        const ax = p[k], az = p[k + 1], ex = p[k + 2] - ax, ez = p[k + 3] - az, u = clamp(((T.px[i] - ax) * ex + (T.pz[i] - az) * ez) / Math.max(1e-6, ex * ex + ez * ez), 0, 1);
        const qx = ax + ex * u, qz = az + ez * u, dd = Math.hypot(qx - T.px[i], qz - T.pz[i]);
        if (dd < best) { best = dd; o = (qx - T.px[i]) * T.nx[i] + (qz - T.pz[i]) * T.nz[i]; } } }
      if (o === o) railO[i] = clamp(o, -(T.wAt(i) - 1.0), T.wAt(i) - 1.0);
    }
    const wallRow = (gr, i, side, k) => {
      const bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.1);
      let p, c;
      if (k === 1) { const o2 = side * (bar + 0.5); p = [Pt(i, o, -0.5), Pt(i, o, 1.07), Pt(i, o, 1.15), Pt(i, o2, 1.15)]; c = [whD, wh, wh, wh]; }
      else if (k === 2) { const o2 = side * (bar + 0.22); p = [Pt(i, o, 0.98), Pt(i, o, 1.12), Pt(i, o2, 1.12), Pt(i, o2, 0.98)]; c = [brSD, brS, brS, brSD]; }
      else { const o2 = side * (bar + 0.22); p = [Pt(i, o, 0.42), Pt(i, o, 0.62), Pt(i, o2, 0.7), Pt(i, o2, 0.76)]; c = [stlD, stl, stl, stlD]; }
      if (side < 0) { p = p.reverse(); c = c.slice().reverse(); }
      return gr.row(p, c);
    };
    for (let c0 = 0; c0 < N - 1; c0 += RC) {
      const gr = new RB();
      for (const side of [-1, 1]) {
        let prev = -1, pk = -1;
        for (let i = c0; i <= Math.min(c0 + RC, N - 1); i++) {
          const k = kindAt(i);
          if (prev >= 0 && k !== pk) { gr.link(prev, wallRow(gr, i, side, pk), 0, 3); prev = -1; }
          const r = wallRow(gr, i, side, k); if (prev >= 0) gr.link(prev, r, 0, 3); prev = r; pk = k;
        }
      }
      for (const e of [-0.535, 0.535]) { let prev = -1;   // (the rails, in the same mesh as the barriers: no draw call more)
        for (let i = c0; i <= Math.min(c0 + RC, N - 1); i++) {
          if (railO[i] !== railO[i]) { prev = -1; continue; }
          const o = railO[i] + e, r = gr.row([Pt(i, o - 0.04, -0.01), Pt(i, o - 0.035, 0.035), Pt(i, o + 0.035, 0.035), Pt(i, o + 0.04, -0.01)], [rlS, rlH, rlH, rlS]);
          if (prev >= 0) gr.link(prev, r, 0, 3); prev = r;
        }
      }
      addM(gr, rMat, true);
    }
    for (let s = 2; s < L - 2; s += 4) for (const side of [-1, 1]) {   // the guardrail's posts (every 4 m; on the bridge the railing's every 2 m: the fallback's)
      const i = T.idx(s); if (kindAt(i) !== 0) continue;
      const [x, z] = atSf(s, side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.2)); box(scen.get(x, z), x, T.hy[i] - 0.4, z, 0.14, 1.12, 0.12, T.hd[i], [0.6, 0.6, 0.6]);
    }
    for (const [i, dir] of [[0, -1], [iE, 1]]) {   // (the barrier across the road at each end: Core's invisible end walls made visible)
      const eX = T.px[i] + T.tx[i] * 1.2 * dir, eZ = T.pz[i] + T.tz[i] * 1.2 * dir;
      for (let o = -T.bl[i]; o <= T.br[i]; o += 2.05) { const bx = eX + T.nx[i] * o, bz = eZ + T.nz[i] * o; box(scen.get(bx, bz), bx, T.hy[i] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[i], [0.78, 0.77, 0.74], [0.86, 0.85, 0.82]); }
    }
    {   // the catch fence along the white walls at the start and the finish
      const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide }), gf = new RB(true);
      for (const [d0, d1] of [[-110, 140], [dFin - 100, L - sStart - 2]]) for (const side of [-1, 1]) { let pr = -1, acc = 0;
        for (let d = d0; d <= d1; d += 2) { const i = T.idx(sAt(d)), bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.15);
          let p = [Pt(i, o, 1.1), Pt(i, o, 3.8)]; if (side < 0) p = p.reverse();
          const r = gf.row(p, [W1, W1], [[acc / 3, 0], [acc / 3, 1]]); if (pr >= 0) gf.link(pr, r, 0, 1); pr = r; acc += 2; } }
      addM(gf, fMat);
    }

    /* ---- the verges between the asphalt, the barriers and the terrain (lifted onto the ground where it rises; none on the bridge) ---- */
    const vergeRow = (i, side) => {
      const w = T.wAt(i), bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i], lift = (o, h) => { const q = side * o, g = nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.06 - y; return [o, Math.max(h, g)]; };
      return [[w, 0.0], [w + 0.8, -0.04], lift(Math.max(w + 1.2, bar - 0.3), -0.08), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)];
    };

    /* ---- the spectators' context ---- */
    const CR = crowdCtx({ gH: nrGround, near: (x, z) => nrNear(x, z).dd, maxSlope: 0.7 });
    let nBld = 0, nStone = 0;

    /* ---- the bridge, the simple one (one mesh) until the model of assets/landmarks/livingstone.glb has loaded (World.znamenitost): the deck
       (its steel girders and fascias), the railing's posts, the two arch ribs from the gorge's walls (box sections with a lattice of
       diagonals), the spandrel posts up to the deck, the cross bracing, the stone piers at the springings and at the abutments ---- */
    const mark = (LD.marks || []).find(m => m[1] === 'bridge');
    for (const B of BR) {
      const gB = new GB(), st = [0.62, 0.64, 0.62], stD = [0.46, 0.48, 0.47], stone = [0.5, 0.46, 0.42], { i0, i1 } = B;
      const ic = Math.round((i0 + i1) / 2), hw = T.wAt(ic) + 0.9;
      for (let i = i0 - 1; i < i1 + 1; i++) {   // the deck: its underside, the fascias, two deep girders under it
        const j = i + 1, inn = Pt(i, 0, -0.6);
        gB.quadO(Pt(i, -hw, -1.2), Pt(j, -hw, -1.2), Pt(j, hw, -1.2), Pt(i, hw, -1.2), stD, [inn[0], inn[1] + 3, inn[2]]);
        for (const sd of [-1, 1]) gB.quadO(Pt(i, sd * hw, -1.25), Pt(j, sd * hw, -1.25), Pt(j, sd * hw, 0.05), Pt(i, sd * hw, 0.05), st, inn);
        for (const sd of [-1, 1]) { const o = sd * (hw - 1.2); gB.quadO(Pt(i, o, -1.2), Pt(j, o, -1.2), Pt(j, o, -3.4), Pt(i, o, -3.4), stD, Pt(i, 0, -2)); gB.quadO(Pt(i, o - sd * 0.5, -1.2), Pt(j, o - sd * 0.5, -1.2), Pt(j, o - sd * 0.5, -3.4), Pt(i, o - sd * 0.5, -3.4), stD, Pt(i, sd * hw * 2, -2)); }
      }
      for (let s = sAt(B.a) + 1; s < sAt(B.b); s += 2) for (const side of [-1, 1]) {   // the railing's posts and its middle rail
        const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.16), [x, z] = atSf(s, o); box(gB, x, T.hy[i], z, 0.1, 1.0, 0.1, T.hd[i], brS);
        box(gB, x, T.hy[i] + 0.48, z, 2.0, 0.08, 0.06, T.hd[i], brSD);
      }
      const nA = Math.round(78 / ds), ia = clamp(ic - nA, i0 + 1, i1 - 1), ib = clamp(ic + nA, i0 + 1, i1 - 1), ribO = hw - 1.2;
      const gy = (k) => nrGround(T.px[k], T.pz[k]), yA = Math.min(T.hy[ia] - 6, gy(ia) + 1), yB = Math.min(T.hy[ib] - 6, gy(ib) + 1), top = T.hy[ic] - 4.2;
      const archY = (k) => { const u = (k - ia) / Math.max(1, ib - ia), bs = lerp(yA, yB, u); return bs + (top - bs) * (1 - (2 * u - 1) * (2 * u - 1)); };
      const dep = (k) => 2.4 + 6 * Math.abs((k - ia) / Math.max(1, ib - ia) * 2 - 1);   // (the ribs deeper towards the springings)
      for (const sd of [-1, 1]) for (let k = ia; k < ib; k++) {
        const o = sd * ribO, a = archY(k), b = archY(k + 1), c0 = [T.px[k] + T.nx[k] * o, T.pz[k] + T.nz[k] * o], c1 = [T.px[k + 1] + T.nx[k + 1] * o, T.pz[k + 1] + T.nz[k + 1] * o], nx = T.nx[k], nz = T.nz[k];
        const Q = (c, y, e) => [c[0] + nx * e, y, c[1] + nz * e], inn = [(c0[0] + c1[0]) / 2, (a + b) / 2 - 1.5, (c0[1] + c1[1]) / 2];
        for (const [ya, yb, cc] of [[a, b, st], [a - dep(k), b - dep(k + 1), stD]]) {   // the top and the bottom chord
          gB.quadO(Q(c0, ya, -0.6), Q(c1, yb, -0.6), Q(c1, yb, 0.6), Q(c0, ya, 0.6), cc, [inn[0], inn[1] - 3, inn[2]]);
          gB.quadO(Q(c0, ya - 0.8, -0.6), Q(c1, yb - 0.8, -0.6), Q(c1, yb - 0.8, 0.6), Q(c0, ya - 0.8, 0.6), stD, [inn[0], inn[1] + 3, inn[2]]);
          for (const e of [-0.6, 0.6]) gB.quadO(Q(c0, ya, e), Q(c1, yb, e), Q(c1, yb - 0.8, e), Q(c0, ya - 0.8, e), cc, inn);
        }
        if ((k - ia) % 2 === 0) { const x = (c0[0] + c1[0]) / 2, z = (c0[1] + c1[1]) / 2, y0 = (a + b) / 2 - (dep(k) + dep(k + 1)) / 2; box(gB, x, y0, z, 0.35, (a + b) / 2 - y0, 0.5, T.hd[k], stD); }   // (the lattice's verticals)
      }
      for (let k = ia + 2; k <= ib - 2; k += 2) {   // the spandrel posts (every ~4 samples) up to the deck's girders, a cross beam on each
        const y0 = archY(k), y1 = T.hy[k] - 3.4; if (y1 - y0 < 0.6) continue;
        for (const sd of [-1, 1]) { const o = sd * ribO, x = T.px[k] + T.nx[k] * o, z = T.pz[k] + T.nz[k] * o; box(gB, x, y0, z, 0.5, y1 - y0, 0.7, T.hd[k], st, null, true); }
        box(gB, T.px[k], y1 - 0.5, T.pz[k], 0.5, 0.5, 2 * ribO + 0.7, T.hd[k], stD, null, true);
        if ((k - ia) % 6 === 0) box(gB, T.px[k], archY(k) - 1.2, T.pz[k], 0.5, 0.5, 2 * ribO, T.hd[k], stD, null, true);   // (the bracing between the ribs)
      }
      for (const [k, y] of [[ia, yA], [ib, yB]]) box(gB, T.px[k], y - 6, T.pz[k], 5, 6.5, 2 * ribO + 3, T.hd[k], stone, null, true);   // the springings' stone seats
      for (const k of [i0, i1]) { const y = gy(k); if (T.hy[k] - y > 1.5) box(gB, T.px[k], y - 2, T.pz[k], 4, T.hy[k] - 1.2 - y + 2, 2 * hw + 1, T.hd[k], stone, null, true); }   // the abutments
      for (const k of [ia, ib]) { const y = Math.min(gy(k), T.hy[k] - 6); if (T.hy[k] - y > 4) for (const sd of [-1, 1]) { const o = sd * ribO; box(gB, T.px[k] + T.nx[k] * o, y, T.pz[k] + T.nz[k] * o, 1.2, T.hy[k] - 1.2 - y, 1.2, T.hd[k], st, null, true); } }   // (the end towers over the springings)
      const fm = new THREE.Mesh(gB.geometry(), matV); fm.castShadow = fm.receiveShadow = true; fm.matrixAutoUpdate = false; root.add(fm);
      out.bridge = fm; out.marks = { Most: [T.px[ic], T.pz[ic]] };
      for (let i = i0; i <= i1; i += 4) exclPush(T.px[i], T.pz[i], 14);
      if (World.znamenitost && mark) World.znamenitost.add('livingstone', root, { x: T.px[ic], z: T.pz[ic], fallback: fm, out });
    }

    /* ---- the railway beside the road (OpenStreetMap, one track of Cape gauge, 15-50 m from the road for most of the way): a bed of ballast
       on the ground and two rails, where it is within ~70 m of the road; where it runs into the road (the bridge's ends) only the rails, at
       the road's height. On the bridge itself it lies in the deck (the rails with the barriers above). Only a look: nothing to hit ---- */
    {
      const bal = [0.43, 0.4, 0.36], balT = [0.5, 0.47, 0.42], GA = 0.535;
      let gr = null, nRow = 0, prevB = -1, prevR = [-1, -1];
      const flush = () => { if (gr) addM(gr, rMat); gr = null; nRow = 0; prevB = -1; prevR = [-1, -1]; };
      for (const r of (LD.rail || [])) { if (r[0]) continue; const p = r[2];
        for (let k = 0; k + 3 < p.length; k += 2) {
          const ax = p[k], az = p[k + 1], ex = p[k + 2] - ax, ez = p[k + 3] - az, l = Math.hypot(ex, ez); if (l < 0.01) continue;
          const nx = -ez / l, nz = ex / l, n = Math.ceil(l / 4);
          for (let q = (k ? 1 : 0); q <= n; q++) {
            const x = ax + ex * q / n, z = az + ez * q / n;
            if (nrDist(x, z) > 70) { flush(); continue; }
            const nn = nrNear(x, z), ni = nn.i;
            if (ni >= 0 && onBr[ni] && nn.d < 12) { flush(); continue; }   // (on the bridge: the rails in the deck, above)
            const onRoad = ni >= 0 && nn.d < T.wAt(ni) + 4, yR = onRoad ? nn.hn : 0;
            if (!gr) gr = new RB();
            const Q = (o, dy) => { const qx = x + nx * o, qz = z + nz * o; return [qx, (onRoad ? yR : nrGround(qx, qz)) + dy, qz]; };
            if (!onRoad) {
              const yT = Math.max(nrGround(x, z), nrGround(x + nx * 1.5, z + nz * 1.5), nrGround(x - nx * 1.5, z - nz * 1.5)) + 0.32;
              const rb = gr.row([Q(-2.7, -0.2), [x - nx * 1.5, yT, z - nz * 1.5], [x + nx * 1.5, yT, z + nz * 1.5], Q(2.7, -0.2)], [bal, balT, balT, bal]);
              if (prevB >= 0) gr.link(prevB, rb, 0, 3); prevB = rb; exclPush(x, z, 3.5);
              [-GA, GA].forEach((e, j) => { const ox = x + nx * e, oz = z + nz * e, rr = gr.row([[ox - nx * 0.04, yT, oz - nz * 0.04], [ox - nx * 0.035, yT + 0.16, oz - nz * 0.035], [ox + nx * 0.035, yT + 0.16, oz + nz * 0.035], [ox + nx * 0.04, yT, oz + nz * 0.04]], [rlS, rlH, rlH, rlS]); if (prevR[j] >= 0) gr.link(prevR[j], rr, 0, 3); prevR[j] = rr; });
            } else {
              prevB = -1;
              [-GA, GA].forEach((e, j) => { const rr = gr.row([Q(e - 0.04, -0.01), Q(e - 0.035, 0.035), Q(e + 0.035, 0.035), Q(e + 0.04, -0.01)], [rlS, rlH, rlH, rlS]); if (prevR[j] >= 0) gr.link(prevR[j], rr, 0, 3); prevR[j] = rr; });
            }
            if (++nRow >= 128) { flush(); q--; }   // (a mesh every ~500 m, the far ones culled; this sample again as the next one's first)
          }
        }
        flush();
      }
    }

    /* ---- the buildings (OSM footprints within 60 m): the houses of the town's edge and the border post, low, whitewashed or cream, with
       roofs of corrugated iron (grey or rusty) or of red tiles; the bigger ones (the border post's sheds) in two floors ---- */
    const WALL = [[0.94, 0.9, 0.82], [0.96, 0.94, 0.9], [0.88, 0.8, 0.66], [0.84, 0.74, 0.6], [0.9, 0.86, 0.78]];
    const ROOF = [[0.62, 0.64, 0.66], [0.56, 0.4, 0.3], [0.66, 0.36, 0.26], [0.7, 0.72, 0.72]];
    const WIN = [[0.26, 0.28, 0.3], [0.34, 0.32, 0.3]];
    const house = (g, bx, bz, Lb, Wb, ang, y0, hh, wc) => {
      box(g, bx, y0 - 0.5, bz, Lb, hh + 0.5, Wb, ang, wc, vary([0.72, 0.68, 0.62], R, 0.05), true);
      for (let f = 1; f <= Math.round(hh / 3.1); f++) box(g, bx, y0 + f * 3.1 - 1.9, bz, Lb + 0.05, 1.0, Wb + 0.05, ang, WIN[Math.floor(crH(bx, bz, 13) * WIN.length)], null, true);   // (the rows of windows)
      const rc = ROOF[Math.floor(crH(bx, bz, 14) * ROOF.length)], ca = Math.cos(ang), sa = Math.sin(ang), rh = Math.min(1.6, Wb * 0.14);   // (a low hipped roof: a box with a lower, wider eave)
      box(g, bx, y0 + hh, bz, Lb + 0.8, 0.25, Wb + 0.8, ang, rc.map(v => v * 0.9), rc); box(g, bx + ca * 0, y0 + hh + 0.25, bz + sa * 0, Lb * 0.8, rh, Wb * 0.5, ang, rc, rc);
    };
    for (const [bx, bz, Lb, Wb, ang, Hb, k0] of LD.bld || []) {
      const ca = Math.cos(ang), sa = Math.sin(ang), corners = [[Lb / 2, Wb / 2], [Lb / 2, -Wb / 2], [-Lb / 2, Wb / 2], [-Lb / 2, -Wb / 2]].map(([a, b]) => [bx + ca * a - sa * b, bz + sa * a + ca * b]);
      let clash = false, y0 = 1e9, y1 = -1e9; for (const [cx, cz] of corners.concat([[bx, bz]])) { const n = nrNear(cx, cz); if (n.i >= 0 && n.dd < 1.2) clash = true; const h = nrGround(cx, cz); y0 = Math.min(y0, h); y1 = Math.max(y1, h); }
      if (clash || y1 - y0 > 5 || Lb < 2.2 || Wb < 2.2) continue;
      const g = scen.get(bx, bz), hk = crH(bx, bz, 11), area = Lb * Wb, big = k0 === 5 || k0 === 6 || k0 === 9 || area > 240;
      const hh = Hb || (big ? 6.2 + hk * 1.2 : 3 + hk * 0.8);
      house(g, bx, bz, Lb, Wb, ang, y0, hh, vary(WALL[Math.floor(crH(bx, bz, 12) * WALL.length)], R, 0.05));
      nBld++; CR.block(bx, bz, Lb, Wb, ang); exclPush(bx, bz, Math.max(Lb, Wb) / 2 + 2);
    }

    /* ---- the start: a banner over the road on two masts at the line (no words), flags along the walls; a banner at the finish too ---- */
    for (const s0 of [sStart, sFin]) {
      const [x, z, h, i] = atS(s0, 0), gy = T.hy[i], g = scen.get(x, z), span = Math.max(T.bl[i], T.br[i]) + 1.2, nx = T.nx[i], nz = T.nz[i];
      for (const sd of [-1, 1]) box(g, x + nx * span * sd, gy - 0.3, z + nz * span * sd, 0.5, 7.6, 0.5, h, [0.86, 0.86, 0.84]);
      box(g, x, gy + 6.2, z, 0.3, 1.3, span * 2 - 0.6, h, [0.92, 0.9, 0.86], [0.16, 0.44, 0.22]);
      box(g, x, gy + 6.0, z, 0.32, 0.2, span * 2 - 0.4, h, [0.9, 0.5, 0.12]);
      exclPush(x, z, span + 4);
    }
    {
      const FL = [[0.16, 0.5, 0.24], [0.86, 0.16, 0.14], [0.1, 0.1, 0.1], [0.94, 0.56, 0.12], [0.95, 0.95, 0.93]];
      for (let d = -100; d < 130; d += 18) for (const side of [-1, 1]) {
        const ii = T.idx(sAt(d)), o = side * ((side > 0 ? T.br[ii] : T.bl[ii]) + 1.6), px = T.px[ii] + T.nx[ii] * o, pz = T.pz[ii] + T.nz[ii] * o, py = nrGround(px, pz), gg = scen.get(px, pz);
        CR.avoid(px, pz, 0.45);
        cyl(gg, px, py, pz, 0.06, 6, 5, [0.86, 0.86, 0.88]); API.flags.add(px, py + 5.6, pz, T.hd[ii], [FL[Math.floor(crH(d, side, 5) * FL.length)]], 1.2, 0.8);   // (waving: js/world-zastave.js)
      }
    }
    let nFans = 0;
    {   // few spectators (fewFans): at the start, at the border post, before the bridge, at the finish
      const runs = [[-100, 120, 2, 0.4], [dFin - 90, dFin + 20, 2, 0.35]];
      const at = { 'Mejni prehod': [40, 1, 0.3] };
      for (const q of T.names) { const a = at[q.n]; if (a) runs.push([q.d - 20, q.d + a[0], a[1], a[2]]); }
      for (const B of BR) runs.push([B.a - 60, B.a - 14, 1, 0.3]);
      for (const [a, b, rows, dens] of runs) for (const side of [-1, 1]) {
        for (let s0 = a; s0 < b; s0 += 30) { const s1 = Math.min(b, s0 + 30), i = T.idx(sAt((s0 + s1) / 2)); if (onBr[i]) continue;
          nFans += crowdRun(CR, sAt(s0), sAt(s0) + (s1 - s0), side, { rows, dens, first: 1.0, excluded }); }
      }
    }

    /* ---- the trees, within 60 m of the road only: mopane, umbrella thorns and baobabs on the grass, bushes on the scrub, a few trees between
       the houses; none in the gorge's walls nor by the river; the ground under the crowns turns to leaf litter (G.cov) ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const WIND = { value: 0 }; out.dyn.wind = WIND;
    tMat.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = WIND;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
        '#ifdef USE_INSTANCING\nfloat wPh = instanceMatrix[3].x * 0.07 + instanceMatrix[3].z * 0.05;\n#else\nfloat wPh = 0.0;\n#endif\n' +
        'float wK = position.y * position.y * 0.014;\ntransformed.x += wK * sin( uWind * 1.1 + wPh );\ntransformed.z += wK * 0.6 * sin( uWind * 0.83 + wPh * 1.7 );');
    };
    tMat.customProgramCacheKey = () => 'lvTreeWind';
    const TK = [new IChunks(lvTreeGeo(0), tMat, 256), new IChunks(lvTreeGeo(1), tMat, 256), new IChunks(lvTreeGeo(2), tMat, 256)];
    let nTrees = 0;
    const NEAR = 60;
    const plant = (sp, x, z, hgt, wid, c) => {   // sp: 0 umbrella thorn, 1 mopane, 2 baobab, 3 a bush (sunk)
      const y = nrGround(x, z) - 0.1, rot = crH(x, z, 21) * TAU;
      if (sp === 3) TK[1].add(x, y - 0.42 * hgt, z, rot, wid * 1.3, hgt * 1.3, c);
      else TK[sp].add(x, y, z, rot, wid, hgt, c);
      nrShade(x, z, wid * (sp === 3 ? 0.4 : 0.42), sp === 3 ? 0.6 : 1); nTrees++; };
    {
      const Lt = NRC * 32, maxT = Math.round(60000 * (opts.density || 1));
      for (let tj = 0; tj < G.ntz && nTrees < maxT; tj++) for (let ti = 0; ti < G.ntx && nTrees < maxT; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt; zz += 6.5) for (let xx = xa; xx < xa + Lt; xx += 6.5) {
          const x = xx + (crH(xx, zz, 22) - 0.5) * 5.6, z = zz + (crH(xx, zz, 23) - 0.5) * 5.6, rd = nrDist(x, z);
          if (rd > NEAR) continue;
          const cl = nrLC(x, z), h1 = crH(x, z, 24);
          const p = cl === 1 ? 0.55 : cl === 2 ? 0.3 : cl === 3 ? 0.08 : 0.06;
          if (h1 > p) continue;
          const nn = nrNear(x, z), ni = nn.i, ndd = nn.dd; if (ni >= 0 && ndd < 3) continue;
          if (excluded(x, z) || (ni >= 0 && brW[ni] > 0) || rvD(x, z) < RVW + 6 || API.nrSlope(x, z) > 0.7) continue;
          const hq = crH(x, z, 25), hs = crH(x, z, 26), cv = 0.86 + crH(x, z, 27) * 0.28, col = [cv * (0.95 + hq * 0.1), cv, cv * (0.94 + hs * 0.1)];
          let sp;
          if (cl === 1) sp = hs < 0.25 ? 0 : hs < 0.92 ? 1 : 2;
          else if (cl === 2) sp = hs < 0.7 ? 3 : hs < 0.9 ? 0 : 1;
          else sp = hs < 0.45 ? 0 : hs < 0.85 ? 1 : 2;
          const hgt = sp === 0 ? 6 + hq * 4 : sp === 1 ? 6 + hq * 5 : sp === 2 ? 10 + hq * 6 : 1.3 + hq * 1.6;
          const wid = sp === 0 ? hgt * (1.3 + hs * 0.3) : sp === 1 ? hgt * (0.8 + hs * 0.2) : sp === 2 ? hgt * (1.0 + hs * 0.2) : hgt * 1.2;
          if (ni >= 0 && ndd < 3 + wid * 0.3 && sp !== 3) continue;   // (no crown over the barriers)
          plant(sp, x, z, hgt, wid, col);
        }
      }
      for (const [x, z] of LD.trees || []) {   // OSM's single trees
        const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 2.5) continue; if (excluded(x, z)) continue;
        const hgt = 9 + crH(x, z, 28) * 5; plant(1, x, z, hgt, hgt * 0.9, [0.95, 1, 0.95]);
      }
    }
    for (const t of TK) t.addTo(root, true);

    /* ---- the walls of OSM by the road (within 30 m; the fences are left out): a whitewashed wall along each line ---- */
    for (const [k, fl] of LD.walls || []) {
      if (k > 2) continue;
      for (let q = 0; q + 3 < fl.length; q += 2) {
        const ax = fl[q], az = fl[q + 1], bx = fl[q + 2], bz = fl[q + 3], len = Math.hypot(bx - ax, bz - az); if (len < 0.6) continue;
        const mx = (ax + bx) / 2, mz = (az + bz) / 2, nn = nrNear(mx, mz); if (nn.i >= 0 && nn.dd < 0.8) continue;
        const y = nrGround(mx, mz), ang = Math.atan2(bz - az, bx - ax), g = scen.get(mx, mz);
        if (k === 2) box(g, mx, y - 0.2, mz, len + 0.3, 1.6, 1.1, ang, vary([0.36, 0.42, 0.22], R, 0.08), [0.4, 0.46, 0.24], true);
        else box(g, mx, y - 0.4, mz, len + 0.2, k === 1 ? 1.8 : 1.5, 0.35, ang, vary([0.94, 0.92, 0.88], R, 0.04), [0.9, 0.88, 0.84], true);
      }
    }

    /* ---- the dark basalt along the gorge's rims (OSM's cliffs) within 60 m of the road ---- */
    {
      const rk = [0.4, 0.36, 0.32]; let nR = 0;
      for (const fl of LD.cliffs || []) for (let q = 0; q + 3 < fl.length; q += 2) {
        const ax = fl[q], az = fl[q + 1], bx = fl[q + 2], bz = fl[q + 3], len = Math.hypot(bx - ax, bz - az);
        for (let t = 0; t < len; t += 4) {
          const x = ax + (bx - ax) * t / len, z = az + (bz - az) * t / len; if (nrDist(x, z) > 60 || crH(x, z, 31) > 0.5) continue;
          const nn = nrNear(x, z); if (nn.i >= 0 && (nn.dd < 3 || brW[nn.i] > 0.5 && nn.dd < 8)) continue;
          const r0 = 1.2 + crH(x, z, 32) * 2.2, y = nrGround(x, z) - r0 * 0.35;
          nrLump(scen.get(x, z), x, y, z, r0, 0.62, vary(rk, R, 0.1), R, 0.25); nR++;
        }
      }
      out.rocks = nR; nStone += nR > 0 ? 1 : 0;
    }

    /* ---- the river at the bottom of the gorge (dark green water, slow; a strip along OSM's line a little wider than the bed) ---- */
    if (RV.length) {
      const WO = { len: 1.6, amp: 0.5, refl: 0.3, shal: 0.4, lap: 0.4 }, gw = new GB(true);
      for (const pts of RV) {
        const ext = pts.slice(); { const [ax, az] = pts[0], [bx, bz] = pts[1], l = Math.hypot(bx - ax, bz - az); ext.unshift([ax - (bx - ax) / l * 120, az - (bz - az) / l * 120]); }
        { const n = pts.length, [ax, az] = pts[n - 2], [bx, bz] = pts[n - 1], l = Math.hypot(bx - ax, bz - az); ext.push([bx + (bx - ax) / l * 120, bz + (bz - az) / l * 120]); }
        for (let k = 0; k + 1 < ext.length; k++) {
          const [ax, az] = ext[k], [bx, bz] = ext[k + 1], l = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / l * (RVW + 4), nz = (bx - ax) / l * (RVW + 4);
          gw.quadUp([ax - nx, rvY, az - nz], [ax + nx, rvY, az + nz], [bx + nx, rvY, bz + nz], [bx - nx, rvY, bz - nz], [W1, W1, W1, W1], [[ax / 20, az / 20], [ax / 20 + 1, az / 20], [bx / 20 + 1, bz / 20], [bx / 20, bz / 20]]);
        }
      }
      if (!gw.empty) { const m = new THREE.Mesh(gw.geometry(), waterMat(tex, Object.assign({ color: 0x48624e }, WO))); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); out.dyn.water = tex.water; out.river = m; }
    }

    /* ---- the far land beyond the corridor (200 m cells): the dry savanna and the woodland, a little lower so its edge hides under the near
       tiles (the far heights are metres above the sea: less the track's zero) ---- */
    {
      const F = LD.far, base = (LD.dem && LD.dem.base) || 0, bin = atob(F.b64), n = F.n, H = (i, j) => F.lo + bin.charCodeAt(clamp(j, 0, n - 1) * n + clamp(i, 0, n - 1)) * F.step - base, gf = new GB();
      const colF = (h, x, z) => { const t = clamp((h + 60) / 120, 0, 1), k = 0.9 + crH(Math.floor(x / 200), Math.floor(z / 200), 3) * 0.15, w = crH(Math.floor(x / 400), Math.floor(z / 400), 9) * 0.5; return [lerp(0.7, 0.54, w) * k * lerp(0.92, 1, t), lerp(0.62, 0.54, w) * k, lerp(0.44, 0.36, w) * k]; };
      const inner = (x, z) => x > P.x0 + 200 && x < P.x1 - 200 && z > P.z0 + 200 && z < P.z1 - 200 && nrDist(x, z) < 560;
      for (let j = 0; j + 1 < n; j++) for (let i = 0; i + 1 < n; i++) {
        const x = F.x0 + (i + 1) * F.cell, z = F.z0 + (j + 1) * F.cell; if (inner(x, z)) continue;
        const q = (a, b) => { const xx = F.x0 + (a + 0.5) * F.cell, zz = F.z0 + (b + 0.5) * F.cell; return [xx, H(a, b) - (inner(xx, zz) ? 14 : 2.5), zz]; };
        const A = q(i, j), B2 = q(i + 1, j), C = q(i + 1, j + 1), Dd = q(i, j + 1);
        gf.quadUp(A, Dd, C, B2, [colF(A[1], A[0], A[2]), colF(Dd[1], Dd[0], Dd[2]), colF(C[1], C[0], C[2]), colF(B2[1], B2[0], B2[2])]);
      }
      const fm = addM(gf, matV); if (fm) fm.castShadow = false;
    }

    /* ---- the terrain tiles and the verges (256 m chunks), coloured now: the leaf litter under the trees ---- */
    let nTiles = 0;
    {
      const grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let k = 0; k < tiles.length; k += 3) { const m = new THREE.Mesh(nrTileGeo(tiles[k], tiles[k + 1], tiles[k + 2] === 1 ? 1 : 4), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); nTiles++; }
      const vg = [0.84, 0.76, 0.6], dirt = [0.86, 0.66, 0.5];
      for (let c0 = 0; c0 < N - 1; c0 += RC) {
        const gv = new RB(true), pv = [-1, -1];
        for (let i = c0; i <= Math.min(c0 + RC, N - 1); i++) {
          if (onBr[i]) { pv[0] = pv[1] = -1; continue; }
          const wr = 0.2 + 0.6 * sstep(0.4, 0.85, P.n7(T.px[i], T.pz[i])), vw = [lerp(vg[0], dirt[0], wr), lerp(vg[1], dirt[1], wr), lerp(vg[2], dirt[2], wr)];
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, vr = vergeRow(i, side), pts = vr.map(([o, h]) => Pt(i, side * o, h)), cols = vr.map(([o], k) => { const p = pts[k]; if (k === 0) return vw; if (k < 3) return vg; const gc = API.nrGCol(p[0], p[2]); return k === 3 ? [lerp(vg[0], gc[0], 0.5), lerp(vg[1], gc[1], 0.5), lerp(vg[2], gc[2], 0.5)] : gc; });
            const ordered = side > 0 ? { p: pts, c: cols } : { p: pts.slice().reverse(), c: cols.slice().reverse() };
            const rv = gv.row(ordered.p, ordered.c, ordered.p.map(p => [p[0] / 14, -p[2] / 14]));
            if (pv[si] >= 0) gv.link(pv[si], rv, 0, 4); pv[si] = rv;
          }
        }
        addM(gv, gMat);
      }
      G.col = G.cov = P.edge = null;   // (build only)
    }

    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    crowdFinish(CR, root, out);
    out.stats = { tiles: nTiles, trees: nTrees, buildings: nBld, stone: nStone, fans: nFans, rocks: out.rocks, river: RV.length ? +rvY.toFixed(1) : null };   // (read by the tests)
    return out;
  }

  World.ext.livingstone = (scene, tex, opts) => buildLivingstone(scene, tex, opts);
})();
