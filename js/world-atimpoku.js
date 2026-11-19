/* =========================================================================
   WORLD — Atimpoku (theme 'atimpoku'): a road by the Volta river in Ghana on today's roads (docs/proge/atimpoku.md). Its own builder
   (World.ext.atimpoku) in a file of its own, on World's shared corridor helpers (World.api: nrPrep's terrain from the track's dem and land
   cover, as Luanda) and the scenery data of js/data/atimpoku.js (OpenStreetMap, Copernicus DEM, ESA WorldCover, Meta / WRI canopy).
   The 60 m rule: the detailed things only within ~60 m of the road, as far as the chase camera sees them: the houses of Atimpoku and of the
   east bank in their OSM footprints and more of the same between them where the land is built up (pastel walls, tin roofs), the palms, the
   round-crowned trees and the odd baobab on the green land, the concrete barriers of the road, and over the river the Adomi bridge (its steel
   arch, the hangers and the deck: the model of assets/landmarks/atimpoku.glb, made in Blender by tools/znamenitost/, World.znamenitost; until
   it has loaded, or if it cannot, the simpler one built here). Farther out only the terrain from the heights, the river (the water's edge from
   the heights and ESA WorldCover: AT_DATA.water) and the far land. Only geographic and plain names (no people, events, firms or brands).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, NRC, RB, TAU, addShore, atS, atSf, box, clamp, cone, crH, crowdCtx, crowdFinish, crowdRun, cyl, gable,
    ico, inPoly, lerp, nrDem, nrDist, nrGH, nrGround, nrLC, nrLCf, nrLump, nrNear, nrPrep, nrShade, nrTileGeo, nrTileOn, rng, shoreBand,
    sstep, valueNoise2, vary, waterMat, waterline
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });
  const SEA = 14.6;   // the Volta's level below the bridge (the lake's tailwater, m above the sea, as the track's heights)

  // ---- the trees (unit height 1, instanced): 0 a palm (a slender leaning trunk, a crown of fronds), 1 a round crown (the shade trees and the
  //      bush; squat and sunk: the scrub), 2 a baobab (a thick short trunk, a sparse wide flat crown) ----
  function atTreeGeo(kind) {
    const g = new GB(), R = rng(2316 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    const bark = [0.52, 0.44, 0.34];
    if (kind === 0) {
      const lf = [0.3, 0.52, 0.2], lfD = [0.22, 0.42, 0.16], lean = 0.08;
      cyl(g, 0, -0.02, 0, 0.025, 0.5, 5, bark, null, 0.021); cyl(g, lean * 0.5, 0.48, 0, 0.021, 0.48, 5, [0.58, 0.5, 0.38], null, 0.018);
      const n = 8, tx = lean, ty = 0.95;
      for (let k = 0; k < n; k++) {
        const a = k / n * TAU + R() * 0.3, Lf = 0.24 + R() * 0.06, w = 0.045, c = k % 2 ? lf : lfD;
        const mid = [tx + Math.cos(a) * Lf * 0.5, ty + 0.05, Math.sin(a) * Lf * 0.5], tip = [tx + Math.cos(a) * Lf, ty - 0.12 - R() * 0.06, Math.sin(a) * Lf];
        const pl = [mid[0] - Math.sin(a) * w, mid[1], mid[2] + Math.cos(a) * w], pr = [mid[0] + Math.sin(a) * w, mid[1], mid[2] - Math.cos(a) * w], base = [tx, ty, 0], up = [tx, ty - 1, 0];
        g.triO(base, pl, mid, c, up); g.triO(base, mid, pr, c, up); g.triO(pl, tip, mid, c, up); g.triO(mid, tip, pr, c, up);
      }
    } else if (kind === 1) {
      cyl(g, 0, -0.02, 0, 0.035, 0.42, 4, bark, null, 0.026);
      ico(g, 0, 0.64, 0, 0.42, 0.72, [0.3, 0.4, 0.2], R, 0.22);
    } else {
      cyl(g, 0, -0.02, 0, 0.1, 0.56, 6, [0.6, 0.53, 0.46], null, 0.075);
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + R() * 0.5; cyl(g, Math.cos(a) * 0.1, 0.5, Math.sin(a) * 0.1, 0.022, 0.2, 4, [0.58, 0.51, 0.44], null, 0.014); }
      ico(g, 0, 0.74, 0, 0.44, 0.34, [0.36, 0.44, 0.22], R, 0.3); nrLump(g, 0.2, 0.78, -0.12, 0.24, 0.45, [0.3, 0.38, 0.18], R, 0.2);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function atGroundTex() {   // the ground under the vertex colours (256 px = 14 m, tileable): a green-brown tone with flecks
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), r = rng(2317), img = x.createImageData(S, S), d = img.data;
    const n1 = valueNoise2(2318, 40), n2 = valueNoise2(2319, 9), wr = (f, i, j) => { const u = i / S, v = j / S; return f(i, j) * (1 - u) * (1 - v) + f(i - S, j) * u * (1 - v) + f(i, j - S) * (1 - u) * v + f(i - S, j - S) * u * v; };
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const o = (j * S + i) * 4, k = 0.78 + wr(n1, i, j) * 0.16 + wr(n2, i, j) * 0.1 + (r() - 0.5) * 0.12;
      d[o] = Math.min(255, 196 * k); d[o + 1] = Math.min(255, 198 * k); d[o + 2] = Math.min(255, 160 * k); d[o + 3] = 255; }
    x.putImageData(img, 0, 0);
    for (let k = 0; k < 500; k++) { const px = r() * S, py = r() * S, g = 80 + r() * 60; x.fillStyle = `rgba(${g + 14},${g},${g - 16},0.35)`; x.fillRect(px, py, 1 + r() * 2, 1 + r() * 2); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  }

  function buildAtimpoku(scene, tex, opts) {
    const R = rng(2316), N = T.N, ds = T.ds, sStart = T.startS, sFin = T.finishS, iE = N - 1, def = T.def, L = T.len, LD = AT_DATA;
    if (!def.dem) { def.dem = LD.dem; def.lc = LD.lc; }   // (nrPrep reads the corridor's terrain and land cover from the track)
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: nrGround, camFloor: (x, z) => Math.max(nrGround(x, z), SEA), props: [], farClip: true, ownTex: [] };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    const dS = (s) => s - sStart, sAt = (d) => clamp(sStart + d, 0, L - 0.01), dFin = sFin - sStart;   // (an open road: no wrapping)
    nrPrep();
    const P = API.NR, G = P.G;
    out.bounds = { minX: P.x0, maxX: P.x1, minZ: P.z0, maxZ: P.z1 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const W1 = [1, 1, 1];
    // what keeps the trees and the blocks off (the buildings, the bridge, the crowds, the start), hashed circles
    const eh = new Map(), EHC = 32;
    const exclPush = (x, z, r) => { const e = { x, z, r }; for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); } };
    const excluded = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (const e of Lc) if ((x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; return false; };

    // ---- the river: the signed distance to the water's edge (+ on the water, metres; AT_DATA.water, 32 m cells, bilinear), far out by the heights ----
    const WG = LD.water, wbin = atob(WG.b64);
    const seaD = (x, z) => {
      const gx = (x - WG.x0) / WG.cell - 0.5, gz = (z - WG.z0) / WG.cell - 0.5;
      if (gx < 0 || gz < 0 || gx > WG.nx - 1 || gz > WG.nz - 1) return nrDem(x, z) < SEA + 0.2 ? 20 : -200;
      const i = Math.min(WG.nx - 2, Math.floor(gx)), j = Math.min(WG.nz - 2, Math.floor(gz)), u = gx - i, v = gz - j, at = (a, b) => -(WG.lo + wbin.charCodeAt(b * WG.nx + a) * WG.step);
      return lerp(lerp(at(i, j), at(i + 1, j), u), lerp(at(i, j + 1), at(i + 1, j + 1), u), v); };
    // ---- the Adomi bridge: its span on the road (AT_DATA.bridges: the s of its two ends), the arch over the middle of it (245 m), the deck's height ----
    const BR = (LD.bridges || [])[0] || [0, 0], sB0 = BR[0], sB1 = BR[1], onBridge = (s) => s > sB0 - 2 && s < sB1 + 2;
    let sW0 = 1e9, sW1 = -1e9; for (let s = sB0; s <= sB1; s += 2) { const p = atS(s, 0); if (seaD(p[0], p[1]) > 0) { sW0 = Math.min(sW0, s); sW1 = Math.max(sW1, s); } }
    if (sW1 < sW0) { sW0 = sB0 + 40; sW1 = sB1 - 40; }
    const sAc = clamp((sW0 + sW1) / 2, sB0 + 125, sB1 - 125), sA0 = sAc - 122.5, sA1 = sAc + 122.5;   // (the arch's two springings)
    const brW = (x, z) => { const n = nrNear(x, z); if (n.i < 0 || n.dd > 70) return 0; const s = n.i * ds; return Math.min(sstep(sB0 - 6, sB0 + 10, s), sstep(sB1 + 6, sB1 - 10, s)) * sstep(70, 40, n.dd); };
    // the ground: the riverbed under the water (deeper away from the edge), the banks above it; under the bridge the land as it is (not lifted to the
    // deck), the river away from the road only (the road by the water keeps its embankment)
    P.pad = (x, z, h) => {
      const sd = seaD(x, z), bw = sd > -40 ? brW(x, z) : 0;
      if (bw > 0) h = lerp(h, Math.min(h, Math.max(nrDem(x, z), SEA + 0.6 + Math.max(0, -sd) * 0.12)), bw);
      if (sd > 0) { const dd = nrDist(x, z); if (dd > 12 || bw > 0.5) h = lerp(h, Math.min(h, SEA - 0.8 - Math.min(sd, 40) * 0.06), bw > 0.5 ? 1 : sstep(12, 24, dd)); }
      else if (sd > -30) h = Math.max(h, SEA + 0.4 + Math.min(-sd, 30) * 0.03);   // (the bank stays above the water)
      return h; };
    // the ground's colours (the green Volta valley after the rains): lush grass in patches, the trees' canopy farther out and the leaf litter under
    // the crowns near the road, the red laterite of the paths, the steep banks and the town, the brown mud and grey sand at the water's edge
    P.colFn = (x, z, ny, dd, cov, o) => {
      const m = P.n3(x, z), q = P.n4(x, z), fo = nrLCf(x, z, 1), sc = nrLCf(x, z, 2), se = nrLCf(x, z, 3), sd = seaD(x, z), h = nrDem(x, z);
      let r = 0.62 + (m - 0.5) * 0.14, g = 0.74 + (m - 0.5) * 0.12 + (q - 0.5) * 0.06, b = 0.4 + (q - 0.5) * 0.08;
      const gr = sstep(0.55, 0.85, P.n2(x, z)) * 0.5; r = lerp(r, 0.8, gr); g = lerp(g, 0.74, gr); b = lerp(b, 0.46, gr);   // (paler, drier grass)
      r = lerp(r, 0.5, sc * 0.5); g = lerp(g, 0.62, sc * 0.5); b = lerp(b, 0.34, sc * 0.5);
      const cv = clamp(cov, 0, 1), can = fo * (1 - cv);
      r = lerp(r, 0.3 + m * 0.06, can * 0.85); g = lerp(g, 0.42 + m * 0.05, can * 0.85); b = lerp(b, 0.22, can * 0.85);
      r = lerp(r, 0.56, cv * 0.75); g = lerp(g, 0.5, cv * 0.75); b = lerp(b, 0.34, cv * 0.75);
      const k = 0.96 + (q - 0.5) * 0.12; r = lerp(r, 0.9 * k, se * 0.6); g = lerp(g, 0.66 * k, se * 0.6); b = lerp(b, 0.5 * k, se * 0.6);   // (the town's red dust)
      const rk = sstep(0.9, 0.66, ny) * 0.95;
      r = lerp(r, 0.86 + q * 0.06, rk); g = lerp(g, 0.56 + q * 0.05, rk); b = lerp(b, 0.4 + q * 0.04, rk);
      if (sd > -14) { const t = sstep(-14, -3, sd) * sstep(SEA + 4, SEA + 1, h); r = lerp(r, 0.7, t); g = lerp(g, 0.64, t); b = lerp(b, 0.5, t); }
      if (dd < 4) { const t = sstep(4, 0.5, dd); r = lerp(r, 0.9, t); g = lerp(g, 0.72, t); b = lerp(b, 0.56, t); }
      o[0] = r; o[1] = g; o[2] = b; return o; };
    const gMat = new THREE.MeshLambertMaterial({ map: ownTex(atGroundTex()), vertexColors: true });
    const tiles = [];
    for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { const on = nrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; tiles.push(ti, tj, on); }

    /* ---- the road: asphalt (resurfaced in sections, darker on the racing line), white edge lines and the centre line by the country's rules
       (World.cesta's crte), the markings across the road where OpenStreetMap has them (World.cesta's precne); the chequered lines at the start
       and at the finish ---- */
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const RC = 128, tileL = 8, secT = new Float32Array(N), CZ = World.cesta ? World.cesta.crte(T, { r: 140, pred: 40 }) : null, CL = CZ ? CZ.at : null;
    const XM = CZ && World.cesta.precne ? World.cesta.precne(T, CZ, (LD.onRoad || []).map(([d, k, x]) => [sAt(d), k, x]), { rob: 0.38, sred: 0.08 }) : { kosi: [], brez: [] }, xk = new Map(), wx = [0.9, 0.9, 0.86];
    for (const [a, b] of XM.brez) for (let i = Math.max(0, Math.ceil(a / ds)); i <= Math.min(N - 1, Math.floor(b / ds)); i++) CL[i] = 0;
    for (const q of XM.kosi) { const c = Math.floor(clamp(Math.floor(Math.min(q[0], q[1]) / ds), 0, N - 1) / RC); if (!xk.has(c)) xk.set(c, []); xk.get(c).push(q); }
    const PtS = (s, o, y) => { const f = clamp(s, 0, L) / ds, i0 = Math.min(N - 2, Math.floor(f)), t = clamp(f - i0, 0, 1), a = Pt(i0, o, y), b = Pt(i0 + 1, o, y); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
    const layX = (gl, [s0, s1, o0, o1, tri]) => {
      if (tri) { const r0 = gl.row([PtS(s0, o0, 0.034), PtS(s0, o1, 0.034)], [wx, wx]), r1 = gl.row([PtS(s1, (o0 + o1) / 2, 0.034)], [wx]); if (s1 > s0) gl.I.push(r0, r0 + 1, r1); else gl.I.push(r0 + 1, r0, r1); return; }
      const S = [s0]; for (let i = Math.floor(s0 / ds) + 1; i * ds < s1 - 0.05; i++) if (i * ds > s0 + 0.05) S.push(i * ds); S.push(s1);
      let pr = -1; for (const s of S) { const r = gl.row([PtS(s, o0, 0.034), PtS(s, o1, 0.034)], [wx, wx]); if (pr >= 0) gl.link(pr, r, 0, 1); pr = r; }
    };
    for (let i0 = 0, k = 0; i0 < N; k++) { const n = 50 + Math.floor(crH(k, 3, 37) * 70), t = 0.9 + crH(k, 5, 37) * 0.15; for (let i = i0; i < Math.min(N, i0 + n); i++) secT[i] = t; i0 += n; }
    const shade = (i, o, w) => { const rl = T.rl[i]; let k = (0.84 - 0.12 * Math.exp(-((o - rl) * (o - rl)) / 5)) * secT[i]; if (Math.abs(o) > w * 0.9) k -= 0.04; return [k, k, k * 1.02]; };
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
      for (const q of xk.get(c0 / RC) || []) layX(gl, q);
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

    /* ---- the barriers (Core's T.bl / T.br) drawn as the road's low concrete barriers, on the bridge its steel parapet; at the start and at the finish white walls with a catch
       fence and the crowd behind it; a barrier across the road at both its ends ---- */
    const startArea = (i) => { const d = dS(i * ds); return d < 140 || d > dFin - 100; };
    const kindAt = (i) => (onBridge(i * ds) ? 2 : startArea(i) ? 1 : 0);   // 0 concrete, 1 white wall and fence, 2 the bridge's steel parapet (painted grey-green)
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const par = [0.55, 0.6, 0.58], parD = [0.42, 0.47, 0.45], parT = [0.62, 0.67, 0.65];
    const conc = [0.84, 0.82, 0.78], concD = [0.64, 0.62, 0.58], concT = [0.9, 0.88, 0.84], wh = [0.92, 0.92, 0.9], whD = [0.74, 0.74, 0.72];
    const wallRow = (gr, i, side, k) => {
      const bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.1), o2 = side * (bar + 0.5), h = k === 1 ? 1.15 : k === 2 ? 1.1 : 0.85, tone = 0.94 + crH(i >> 3, side, 71) * 0.1;
      const c0 = k === 1 ? whD : k === 2 ? parD : concD.map(v => v * tone), c1 = k === 1 ? wh : k === 2 ? par : conc.map(v => v * tone), c2 = k === 0 ? concT : k === 2 ? parT : wh;
      let p = [Pt(i, o, -0.5), Pt(i, o, h - 0.08), Pt(i, o, h), Pt(i, o2, h)], c = [c0, c1, c2, c2];
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
      addM(gr, rMat, true);
    }
    const scen = new Chunks(128);
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

    /* ---- the verges between the asphalt, the barriers and the terrain (lifted onto the ground where it rises) ---- */
    const vergeRow = (i, side) => {
      const w = T.wAt(i), bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i], lift = (o, h) => { const q = side * o, g = nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.06 - y; return [o, Math.max(h, g)]; };
      return [[w, 0.0], [w + 0.8, -0.04], lift(Math.max(w + 1.2, bar - 0.3), -0.08), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)];
    };

    /* ---- the spectators' context ---- */
    const CR = crowdCtx({ gH: nrGround, near: (x, z) => nrNear(x, z).dd, maxSlope: 0.7 });
    let nBld = 0, nFill = 0, nStone = 0;

    /* ---- the Adomi bridge: the simple one (one mesh) until the model of assets/landmarks/atimpoku.glb has loaded (World.znamenitost): the deck
       under the road with its edge girders, the two steel arch ribs over the river (245 m between their feet) braced across at the top, the
       hangers down to the deck, the concrete piers under the approach spans and the abutments at both ends ---- */
    if (sB1 > sB0 + 40) {
      const gF = new GB(), stl = [0.62, 0.66, 0.66], stlT = [0.7, 0.74, 0.74], stlD = [0.48, 0.52, 0.52], cnc = [0.74, 0.72, 0.68], cncT = [0.8, 0.78, 0.74];
      const I = (s) => T.idx(clamp(s, 0, L - 0.01)), half = (s, side) => (side > 0 ? T.br[I(s)] : T.bl[I(s)]) + 0.9;
      const yD = (s) => PtS(s, 0, 0)[1];
      // a straight beam from a to b (its section bw wide along the horizontal (lx, lz), bh high)
      const beam = (a, b, lx, lz, bw, bh, col, colT) => {
        const hw = bw / 2, hh = bh / 2, q = (p, sx, sy) => [p[0] + lx * hw * sx, p[1] + hh * sy, p[2] + lz * hw * sx];
        const a00 = q(a, -1, -1), a10 = q(a, 1, -1), a11 = q(a, 1, 1), a01 = q(a, -1, 1), b00 = q(b, -1, -1), b10 = q(b, 1, -1), b11 = q(b, 1, 1), b01 = q(b, -1, 1);
        const ins = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
        gF.quadO(a01, a11, b11, b01, colT || col, ins); gF.quadO(a00, b00, b10, a10, col, ins); gF.quadO(a00, a01, b01, b00, col, ins); gF.quadO(a10, b10, b11, a11, col, ins);
      };
      // the deck: one slab with its edge girders under the road, 2.4 m deep
      for (let s = sB0 - 4; s < sB1 + 4; s += 6) {
        const s2 = Math.min(s + 6, sB1 + 4), i = I(s), oc = (half(s, 1) - half(s, -1)) / 2, wd = half(s, 1) + half(s, -1);
        beam(PtS(s, oc, -1.3), PtS(s2, oc, -1.3), T.nx[i], T.nz[i], wd, 2.4, stlD, stlD);
      }
      // the two arch ribs and what joins them
      const RISE = 45, rib = (s) => { const t = clamp((s - sA0) / (sA1 - sA0), 0, 1); return yD(s) - 3 + (RISE + 3) * 4 * t * (1 - t); };
      const ribO = (s, side) => side * (half(s, side) + 1.2), NS = 40;
      for (const side of [-1, 1]) for (let k = 0; k < NS; k++) {
        const s0 = sA0 + (sA1 - sA0) * k / NS, s1 = sA0 + (sA1 - sA0) * (k + 1) / NS, i = I(s0), a = PtS(s0, ribO(s0, side), 0), b = PtS(s1, ribO(s1, side), 0);
        a[1] = rib(s0); b[1] = rib(s1); beam(a, b, T.nx[i], T.nz[i], 1.6, 3.2, stl, stlT);
      }
      for (let s = sA0 + 20; s < sA1 - 19; s += 16) {   // (the bracing over the road where the ribs are high enough)
        const y = rib(s); if (y - yD(s) < 9) continue;
        const i = I(s), a = PtS(s, ribO(s, -1), 0), b = PtS(s, ribO(s, 1), 0); a[1] = b[1] = y + 0.6;
        beam(a, b, T.tx[i], T.tz[i], 0.9, 1.1, stl, stlT);
      }
      for (let s = sA0 + 8; s < sA1 - 7; s += 8) for (const side of [-1, 1]) {   // the hangers
        const y = rib(s) - 1.6, yd = yD(s) - 0.4; if (y - yd < 1) continue;
        const p = PtS(s, ribO(s, side), 0); box(gF, p[0], yd, p[2], 0.3, y - yd, 0.3, T.hd[I(s)], stlD);
      }
      // the piers: at the arch's feet, under the approach spans, the abutments at the ends (down into the ground)
      const pier = (s, ln, top) => {
        const i = I(s), p = PtS(s, 0, 0), wd = half(s, 1) + half(s, -1) + 1.5, oc = (half(s, 1) - half(s, -1)) / 2, x = p[0] + T.nx[i] * oc, z = p[2] + T.nz[i] * oc;
        const g = Math.min(nrDem(x, z), nrGround(x, z)) - 2; if (top - g < 1.5) return;
        box(gF, x, g, z, ln, top - g, wd, T.hd[i], cnc, cncT);
      };
      pier(sA0, 7, yD(sA0) - 2.5); pier(sA1, 7, yD(sA1) - 2.5); pier(sB0 - 2, 5, yD(sB0) - 0.2); pier(sB1 + 2, 5, yD(sB1) - 0.2);
      for (let s = sB0 + 28; s < sA0 - 15; s += 28) pier(s, 2.2, yD(s) - 2.5);
      for (let s = sB1 - 28; s > sA1 + 15; s -= 28) pier(s, 2.2, yD(s) - 2.5);
      const fm = new THREE.Mesh(gF.geometry(), matV); fm.castShadow = fm.receiveShadow = true; fm.matrixAutoUpdate = false; root.add(fm);
      for (let s = sB0; s <= sB1; s += 12) { const p = atS(s, 0); exclPush(p[0], p[1], 16); }
      nStone++;
      const pc = atS(sAc, 0);
      out.bridge = fm; out.marks = { 'Most Adomi': [pc[0], pc[1]] };
      // (for tools/znamenitost/atimpoku-tla.mjs: the road over the bridge every 2 m, as the model in Blender is built on it)
      out.bridgeTool = () => {
        const r = { c: [pc[0], pc[1]], s: [sB0, sB1, sA0, sA1], p: [] };
        for (let s = sB0 - 8; s <= sB1 + 8.01; s += 2) {
          const i = I(s), p = PtS(s, 0, 0), oc = (half(s, 1) - half(s, -1)) / 2, x = p[0] + T.nx[i] * oc, z = p[2] + T.nz[i] * oc;
          r.p.push([s, p[0], p[1], p[2], T.nx[i], T.nz[i], half(s, -1), half(s, 1), Math.min(nrDem(x, z), nrGround(x, z))]);
        }
        return r;
      };
      if (World.znamenitost) World.znamenitost.add('atimpoku', root, { x: pc[0], z: pc[1], fallback: fm, out });
    }

    /* ---- the buildings (OSM footprints within 60 m): houses and blocks in pastel ochre, pink, cream, pale blue and green and white, most with
       a flat roof and its parapet, some old houses with a tiled roof; the shops and the public buildings in three or four floors ---- */
    const WALL = [[0.93, 0.8, 0.58], [0.95, 0.78, 0.74], [0.96, 0.92, 0.8], [0.78, 0.86, 0.9], [0.8, 0.88, 0.76], [0.97, 0.96, 0.93], [0.92, 0.74, 0.56]];
    const ROOF = [[0.6, 0.6, 0.58], [0.55, 0.38, 0.28], [0.5, 0.52, 0.5]];   // (corrugated iron: bare, rusted, painted)
    const WIN = [[0.3, 0.32, 0.34], [0.42, 0.36, 0.3], [0.36, 0.44, 0.48]];
    const house = (g, bx, bz, Lb, Wb, ang, y0, hh, flat, wc) => {
      box(g, bx, y0 - 0.5, bz, Lb, hh + 0.5, Wb, ang, wc, vary([0.72, 0.68, 0.62], R, 0.05), true);
      for (let f = 1; f <= Math.round(hh / 3.1); f++) box(g, bx, y0 + f * 3.1 - 1.9, bz, Lb + 0.05, 1.0, Wb + 0.05, ang, WIN[Math.floor(crH(bx, bz, 13) * WIN.length)], null, true);   // (the rows of windows)
      if (flat) box(g, bx, y0 + hh, bz, Lb, 0.6, Wb, ang, wc.map(v => v * 0.92), [0.7, 0.64, 0.58]);
      else gable(g, bx, y0 + hh, bz, Lb + 0.6, Wb + 0.6, Math.min(2.4, Wb * 0.22), ang, ROOF[Math.floor(crH(bx, bz, 14) * ROOF.length)], wc);
    };
    for (const [bx, bz, Lb, Wb, ang, Hb, k0] of LD.bld) {
      const ca = Math.cos(ang), sa = Math.sin(ang), corners = [[Lb / 2, Wb / 2], [Lb / 2, -Wb / 2], [-Lb / 2, Wb / 2], [-Lb / 2, -Wb / 2]].map(([a, b]) => [bx + ca * a - sa * b, bz + sa * a + ca * b]);
      let clash = false, y0 = 1e9, sea = false; for (const [cx, cz] of corners.concat([[bx, bz]])) { const n = nrNear(cx, cz); if (n.i >= 0 && n.dd < 1.2) clash = true; y0 = Math.min(y0, nrGround(cx, cz)); if (seaD(cx, cz) > 2) sea = true; }
      if (clash || sea || Lb < 2.2 || Wb < 2.2) continue;
      const g = scen.get(bx, bz), hk = crH(bx, bz, 11), area = Lb * Wb, big = k0 === 5 || k0 === 6 || k0 === 9 || area > 240;
      const hh = Hb || (big ? (3 + Math.floor(hk * 2)) * 3.1 : area < 45 || k0 === 4 ? 3 + hk : 6.2 + hk * 1.4);
      house(g, bx, bz, Lb, Wb, ang, y0, hh, big || crH(bx, bz, 15) < 0.7, vary(WALL[Math.floor(crH(bx, bz, 12) * WALL.length)], R, 0.05));
      nBld++; CR.block(bx, bz, Lb, Wb, ang); exclPush(bx, bz, Math.max(Lb, Wb) / 2 + 2);
    }
    // (no houses beyond OSM's footprints: what OpenStreetMap does not have is not made up; stats.fill stays 0)

    /* ---- the start: a banner over the road on two masts at the line (no words), flags along the walls; a banner at the finish too ---- */
    for (const s0 of [sStart, sFin]) {
      const [x, z, h, i] = atS(s0, 0), gy = T.hy[i], g = scen.get(x, z), span = Math.max(T.bl[i], T.br[i]) + 1.2, nx = T.nx[i], nz = T.nz[i];
      for (const sd of [-1, 1]) box(g, x + nx * span * sd, gy - 0.3, z + nz * span * sd, 0.5, 7.6, 0.5, h, [0.86, 0.86, 0.84]);
      box(g, x, gy + 6.2, z, 0.3, 1.3, span * 2 - 0.6, h, [0.92, 0.9, 0.86], [0.78, 0.16, 0.14]);
      box(g, x, gy + 6.0, z, 0.32, 0.2, span * 2 - 0.4, h, [0.78, 0.16, 0.14]);
      exclPush(x, z, span + 4);
    }
    {
      const FL = [[0.8, 0.12, 0.12], [0.1, 0.1, 0.1], [0.95, 0.78, 0.15], [0.95, 0.95, 0.93], [0.2, 0.4, 0.7]];
      for (let d = -100; d < 130; d += 18) for (const side of [-1, 1]) {
        const ii = T.idx(sAt(d)), o = side * ((side > 0 ? T.br[ii] : T.bl[ii]) + 1.6), px = T.px[ii] + T.nx[ii] * o, pz = T.pz[ii] + T.nz[ii] * o, py = nrGround(px, pz), gg = scen.get(px, pz);
        if (seaD(px, pz) > -1) continue; CR.avoid(px, pz, 0.45);
        cyl(gg, px, py, pz, 0.06, 6, 5, [0.86, 0.86, 0.88]); API.flags.add(px, py + 5.6, pz, T.hd[ii], [FL[Math.floor(crH(d, side, 5) * FL.length)]], 1.2, 0.8);   // (waving: js/world-zastave.js)
      }
    }
    let nFans = 0;
    {   // few spectators (fewFans): at the start, in Atimpoku, off the bridge on the east bank, at the finish
      const runs = [[-100, 120, 2, 0.4], [dFin - 90, dFin + 20, 2, 0.35]];
      const at = { 'Atimpoku': [80, 2, 0.35], 'Vzhodni breg': [50, 2, 0.3] };
      for (const q of T.names) { const a = at[q.n]; if (a) runs.push([q.d - 40, q.d + a[0], a[1], a[2]]); }
      const okSide = (s, side) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 2.5), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; return seaD(x, z) < -3 && !onBridge(s); };
      for (const [a, b, rows, dens] of runs) for (const side of [-1, 1]) {
        for (let s0 = a; s0 < b; s0 += 30) { const s1 = Math.min(b, s0 + 30); if (!okSide(sAt((s0 + s1) / 2), side)) continue;
          nFans += crowdRun(CR, sAt(s0), sAt(s0) + (s1 - s0), side, { rows, dens, first: 1.0, excluded }); }
      }
    }

    /* ---- the trees, within 60 m of the road only: palms, round-crowned shade trees and baobabs on the dry ground, bushes on the scrub, palms
       and shade trees between the houses; the ground under the crowns turns to leaf litter (G.cov) ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const WIND = { value: 0 }; out.dyn.wind = WIND;
    tMat.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = WIND;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
        '#ifdef USE_INSTANCING\nfloat wPh = instanceMatrix[3].x * 0.07 + instanceMatrix[3].z * 0.05;\n#else\nfloat wPh = 0.0;\n#endif\n' +
        'float wK = position.y * position.y * 0.018;\ntransformed.x += wK * sin( uWind * 1.1 + wPh );\ntransformed.z += wK * 0.6 * sin( uWind * 0.83 + wPh * 1.7 );');
    };
    tMat.customProgramCacheKey = () => 'atTreeWind';
    const TK = [new IChunks(atTreeGeo(0), tMat, 256), new IChunks(atTreeGeo(1), tMat, 256), new IChunks(atTreeGeo(2), tMat, 256)];
    let nTrees = 0;
    const NEAR = 60;
    const plant = (sp, x, z, hgt, wid, c) => {   // sp: 0 palm, 1 shade tree, 2 baobab, 3 a bush (sunk)
      const y = nrGround(x, z) - 0.1, rot = crH(x, z, 21) * TAU;
      if (sp === 3) TK[1].add(x, y - 0.42 * hgt, z, rot, wid * 1.3, hgt * 1.3, c);
      else TK[sp].add(x, y, z, rot, wid, hgt, c);
      nrShade(x, z, wid * (sp === 0 ? 0.25 : sp === 3 ? 0.4 : 0.42), sp === 3 ? 0.6 : 1); nTrees++; };
    {
      const Lt = NRC * 32, maxT = Math.round(60000 * (opts.density || 1));
      for (let tj = 0; tj < G.ntz && nTrees < maxT; tj++) for (let ti = 0; ti < G.ntx && nTrees < maxT; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt; zz += 6.5) for (let xx = xa; xx < xa + Lt; xx += 6.5) {
          const x = xx + (crH(xx, zz, 22) - 0.5) * 5.6, z = zz + (crH(xx, zz, 23) - 0.5) * 5.6, rd = nrDist(x, z);
          if (rd > NEAR) continue;
          const cl = nrLC(x, z), h1 = crH(x, z, 24);
          const p = cl === 1 ? 0.6 : cl === 2 ? 0.35 : cl === 3 ? 0.1 : 0.04;
          if (h1 > p) continue;
          const nn = nrNear(x, z), ni = nn.i, ndd = nn.dd; if (ni >= 0 && ndd < 3) continue;
          if (excluded(x, z) || seaD(x, z) > -2) continue;
          const hq = crH(x, z, 25), hs = crH(x, z, 26), cv = 0.86 + crH(x, z, 27) * 0.28, col = [cv * (0.95 + hq * 0.1), cv, cv * (0.94 + hs * 0.1)];
          let sp;
          if (cl === 1) sp = hs < 0.3 ? 0 : hs < 0.85 ? 1 : 2;
          else if (cl === 2) sp = hs < 0.7 ? 3 : hs < 0.85 ? 2 : 1;
          else if (cl === 3) sp = hs < 0.5 ? 0 : hs < 0.9 ? 1 : 2;
          else sp = hs < 0.4 ? 0 : hs < 0.8 ? 1 : 2;
          const hgt = sp === 0 ? 9 + hq * 6 : sp === 1 ? 6 + hq * 4 : sp === 2 ? 9 + hq * 5 : 1.3 + hq * 1.6;
          const wid = sp === 0 ? hgt * 0.9 : sp === 1 ? hgt * (0.9 + hs * 0.2) : sp === 2 ? hgt * (1.0 + hs * 0.2) : hgt * 1.2;
          if (ni >= 0 && ndd < 3 + wid * 0.3 && sp !== 3) continue;   // (no crown over the barriers)
          plant(sp, x, z, hgt, wid, col);
        }
      }
      for (const [x, z] of LD.trees) {   // OSM's single trees (palms by the seafront)
        const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 2.5) continue; if (excluded(x, z)) continue;
        const hgt = 10 + crH(x, z, 28) * 5; plant(0, x, z, hgt, hgt * 0.9, [0.95, 1, 0.95]);
      }
    }
    for (const t of TK) t.addTo(root, true);

    /* ---- the walls of OSM by the road (within 30 m; the fences are left out): a whitewashed wall along each line ---- */
    for (const [k, fl] of LD.walls) {
      if (k > 2) continue;
      for (let q = 0; q + 3 < fl.length; q += 2) {
        const ax = fl[q], az = fl[q + 1], bx = fl[q + 2], bz = fl[q + 3], len = Math.hypot(bx - ax, bz - az); if (len < 0.6) continue;
        const mx = (ax + bx) / 2, mz = (az + bz) / 2, nn = nrNear(mx, mz); if (nn.i >= 0 && nn.dd < 0.8) continue;
        const y = nrGround(mx, mz), ang = Math.atan2(bz - az, bx - ax), g = scen.get(mx, mz);
        if (k === 2) box(g, mx, y - 0.2, mz, len + 0.3, 1.6, 1.1, ang, vary([0.28, 0.4, 0.2], R, 0.08), [0.32, 0.44, 0.22], true);
        else box(g, mx, y - 0.4, mz, len + 0.2, k === 1 ? 1.8 : 1.5, 0.35, ang, vary([0.94, 0.92, 0.88], R, 0.04), [0.9, 0.88, 0.84], true);
      }
    }

    out.rocks = 0;   // (the Volta's banks: grass and mud, no rocks)

    /* ---- the river (the Volta below the dam: calm), its plane at SEA under the whole map; the shore band along the banks near the road ---- */
    {
      const WO = { len: 1.6, amp: 0.3, refl: 0.4, shal: 0.5, lap: 0.35, surf: 0.2 }, g = new THREE.PlaneGeometry(40000, 40000, 1, 1).rotateX(-Math.PI / 2);
      const sea = new THREE.Mesh(g, waterMat(tex, Object.assign({ color: 0x5f8a7e }, WO))); sea.position.set((P.x0 + P.x1) / 2, SEA, (P.z0 + P.z1) / 2); sea.receiveShadow = true; sea.matrixAutoUpdate = false; sea.updateMatrix(); root.add(sea);
      out.dyn.water = tex.water; out.sea = sea;
      for (let z = G.z0; z < G.z0 + (G.nz - 1) * NRC; z += 512) for (let x = G.x0; x < G.x0 + (G.nx - 1) * NRC; x += 512) {
        let near = false; for (let az = z; az < z + 512 && !near; az += 32) for (let ax = x; ax < x + 512; ax += 32) if (Math.abs(seaD(ax, az)) < 20 && nrDist(ax, az) < 250) { near = true; break; }
        if (!near) continue;
        const i0 = Math.max(1, Math.floor((x - G.x0) / NRC)), j0 = Math.max(1, Math.floor((z - G.z0) / NRC)), i1 = Math.min(G.nx - 2, i0 + 64), j1 = Math.min(G.nz - 2, j0 + 64);
        const band = shoreBand(G.x0 + i0 * NRC, G.z0 + j0 * NRC, G.x0 + i1 * NRC, G.z0 + j1 * NRC, SEA + 0.015, waterline(nrGH, G.x0, G.z0, NRC, i0, i1, j0, j1, SEA), 18, { F: 4 });
        if (band && band.attributes.shore.array.some(v => v <= -1.99) && band.attributes.shore.array.some(v => v >= 9.99)) addShore(root, band, sea.material, WO);
      }
    }

    /* ---- the far land beyond the corridor (200 m cells): the green hills of the Volta, a little lower so its edge hides under the near tiles ---- */
    {
      const F = LD.far, bin = atob(F.b64), n = F.n, H = (i, j) => F.lo + bin.charCodeAt(clamp(j, 0, n - 1) * n + clamp(i, 0, n - 1)) * F.step, gf = new GB();
      const colF = (h, x, z) => { const t = clamp(h / 120, 0, 1), k = 0.9 + crH(Math.floor(x / 200), Math.floor(z / 200), 3) * 0.15; return h < SEA + 3 ? [0.62, 0.62, 0.44] : [lerp(0.5, 0.36, t) * k, lerp(0.62, 0.5, t) * k, lerp(0.34, 0.34, t) * k]; };
      const inner = (x, z) => x > P.x0 + 200 && x < P.x1 - 200 && z > P.z0 + 200 && z < P.z1 - 200 && nrDist(x, z) < 560;
      for (let j = 0; j + 1 < n; j++) for (let i = 0; i + 1 < n; i++) {
        const x = F.x0 + (i + 1) * F.cell, z = F.z0 + (j + 1) * F.cell; if (inner(x, z)) continue;
        const q = (a, b) => { const xx = F.x0 + (a + 0.5) * F.cell, zz = F.z0 + (b + 0.5) * F.cell; return [xx, H(a, b) - (inner(xx, zz) ? 14 : 2.5), zz]; };
        const A = q(i, j), B2 = q(i + 1, j), C = q(i + 1, j + 1), Dd = q(i, j + 1); if (Math.max(A[1], B2[1], C[1], Dd[1]) < SEA - 0.5) continue;
        gf.quadUp(A, Dd, C, B2, [colF(A[1], A[0], A[2]), colF(Dd[1], Dd[0], Dd[2]), colF(C[1], C[0], C[2]), colF(B2[1], B2[0], B2[2])]);
      }
      const fm = addM(gf, matV); if (fm) fm.castShadow = false;
    }

    /* ---- the terrain tiles and the verges (256 m chunks), coloured now: the leaf litter under the trees ---- */
    let nTiles = 0;
    {
      const grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let k = 0; k < tiles.length; k += 3) { const m = new THREE.Mesh(nrTileGeo(tiles[k], tiles[k + 1], tiles[k + 2] === 1 ? 1 : 4), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); nTiles++; }
      const vg = [0.92, 0.82, 0.68], dirt = [0.96, 0.78, 0.6];
      for (let c0 = 0; c0 < N - 1; c0 += RC) {
        const gv = new RB(true), pv = [-1, -1];
        for (let i = c0; i <= Math.min(c0 + RC, N - 1); i++) {
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
    out.stats = { tiles: nTiles, trees: nTrees, buildings: nBld, fill: nFill, stone: nStone, fans: nFans, rocks: out.rocks };   // (read by the tests)
    return out;
  }

  World.ext.atimpoku = (scene, tex, opts) => buildAtimpoku(scene, tex, opts);
})();
