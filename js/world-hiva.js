/* =========================================================================
   WORLD — Hiva (theme 'hiva'): a city course in Khiva round the walls of the old town, Itchan Kala, on today's streets (docs/proge/hiva.md).
   A closed lap (no open road: the indices and the distances wrap, as Livorno's). Its own builder (World.ext.hiva) in a file of its own, on
   World's shared corridor helpers (World.api: nrPrep's terrain from the track's dem and land cover) and the scenery data of js/data/hiva.js
   (OpenStreetMap, Copernicus DEM, ESA WorldCover, Meta / WRI canopy).
   The 60 m rule: the detailed things only within ~60 m of the road, as far as the chase camera sees them: the flat-roofed houses of the oasis
   town in mud-brick and loess plaster in their OSM footprints (none where OSM has none), the poplars,
   the mulberries and the elms, the low concrete barriers of the streets, and the landmark: the mud-brick walls of the old town with their
   round towers and battlements, the gates, and over them the two minarets (the short wide one in green and blue tiles and the tall slender
   one): the model of assets/landmarks/hiva.glb when it is there (made in Blender by tools/znamenitost/, World.znamenitost; HAS_GLB below),
   until then, or if it cannot load, the simpler one built here after OSM's outline of the walls. Farther out only the terrain from the
   heights and the far land. Only geographic and plain names (no people, events, firms or brands; the streets bear people's names: none here).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, NRC, RB, TAU, atS, atSf, box, clamp, cone, crH, crowdCtx, crowdFinish, crowdRun, cyl,
    ico, inPoly, lerp, nrDem, nrDist, nrGround, nrLC, nrLCf, nrNear, nrPrep, nrShade, nrTileGeo, nrTileOn, rng,
    sstep, valueNoise2, vary
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });
  const HAS_GLB = false;   // (true once assets/landmarks/hiva.glb and hiva-far.glb are in the repository: then World.znamenitost fetches them)
  // the two minarets inside the walls (OSM nodes, the track's frame: metres from the start line, x east, z south): [x, z, height, base radius]
  const MINARETS = [[153.6, -109.7, 29, 7.0, 'short'], [332.6, 84.3, 45, 4.8, 'tall']];

  // ---- the trees (unit height 1, instanced): 0 a poplar (a slim tall column), 1 a round crown (the mulberries and elms of the streets and
  //      the gardens; squat and sunk: the bushes), 2 a wide elm (a short trunk, a broad flattened crown over the yards) ----
  function hvTreeGeo(kind) {
    const g = new GB(), R = rng(1850 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    const bark = [0.5, 0.44, 0.36];
    if (kind === 0) {
      cyl(g, 0, -0.02, 0, 0.022, 0.2, 4, bark, null, 0.018);
      ico(g, 0, 0.58, 0, 0.13, 0.46, [0.3, 0.42, 0.2], R, 0.18);
    } else if (kind === 1) {
      cyl(g, 0, -0.02, 0, 0.035, 0.42, 4, bark, null, 0.026);
      ico(g, 0, 0.64, 0, 0.42, 0.72, [0.32, 0.42, 0.2], R, 0.22);
    } else {
      cyl(g, 0, -0.02, 0, 0.06, 0.46, 5, [0.46, 0.4, 0.33], null, 0.045);
      ico(g, 0, 0.7, 0, 0.5, 0.4, [0.3, 0.4, 0.2], R, 0.26);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function hvGroundTex() {   // the ground under the vertex colours (256 px = 14 m, tileable): pale loess dust with flecks
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), r = rng(1851), img = x.createImageData(S, S), d = img.data;
    const n1 = valueNoise2(1852, 40), n2 = valueNoise2(1853, 9), wr = (f, i, j) => { const u = i / S, v = j / S; return f(i, j) * (1 - u) * (1 - v) + f(i - S, j) * u * (1 - v) + f(i, j - S) * (1 - u) * v + f(i - S, j - S) * u * v; };
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const o = (j * S + i) * 4, k = 0.8 + wr(n1, i, j) * 0.14 + wr(n2, i, j) * 0.1 + (r() - 0.5) * 0.1;
      d[o] = Math.min(255, 212 * k); d[o + 1] = Math.min(255, 196 * k); d[o + 2] = Math.min(255, 170 * k); d[o + 3] = 255; }
    x.putImageData(img, 0, 0);
    for (let k = 0; k < 500; k++) { const px = r() * S, py = r() * S, g = 90 + r() * 60; x.fillStyle = `rgba(${g + 12},${g + 4},${g - 12},0.32)`; x.fillRect(px, py, 1 + r() * 2, 1 + r() * 2); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  }

  function buildHiva(scene, tex, opts) {
    const R = rng(1850), N = T.N, ds = T.ds, sStart = T.startS, def = T.def, L = T.len, LD = HV_DATA;
    if (!def.dem) { def.dem = LD.dem; def.lc = LD.lc; }   // (nrPrep reads the corridor's terrain and land cover from the track)
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: nrGround, camFloor: nrGround, props: [], farClip: true, ownTex: [] };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    const dS = (s) => ((s - sStart) % L + L) % L, sAt = (d) => ((sStart + d) % L + L) % L;   // (a closed lap: the distances wrap)
    const wrapI = (i) => ((i % N) + N) % N;
    nrPrep();
    const P = API.NR, G = P.G;
    out.bounds = { minX: P.x0, maxX: P.x1, minZ: P.z0, maxZ: P.z1 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const Pt = (i, o, y) => { i = wrapI(i); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
    const W1 = [1, 1, 1];
    // what keeps the trees and the blocks off (the buildings, the walls, the minarets, the crowds, the start), hashed circles
    const eh = new Map(), EHC = 32;
    const exclPush = (x, z, r) => { const e = { x, z, r }; for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); } };
    const excluded = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (const e of Lc) if ((x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; return false; };

    // ---- the walls of the old town (LD.cwall: OSM's city_wall lines, [height, [x, z, ...]]): their segments hashed for the distance to them ----
    const WS = [], WH = 32, whash = new Map();
    // (most are closed outlines of the wall's footprint, ~7 m thick: each segment knows its outward side, sd; the open lines have both, 0)
    for (const [hgt, fl] of LD.cwall || []) {
      const n = fl.length / 2, closed = n > 3 && Math.hypot(fl[0] - fl[fl.length - 2], fl[1] - fl[fl.length - 1]) < 0.5;
      let ar = 0; if (closed) for (let k = 0; k + 3 < fl.length; k += 2) ar += fl[k] * fl[k + 3] - fl[k + 2] * fl[k + 1];
      const sd = !closed ? 0 : ar > 0 ? -1 : 1;
      for (let k = 0; k + 3 < fl.length; k += 2) WS.push([fl[k], fl[k + 1], fl[k + 2], fl[k + 3], hgt || 9, sd]);
    }
    WS.forEach((e, n) => { const x0 = Math.floor((Math.min(e[0], e[2]) - 20) / WH), x1 = Math.floor((Math.max(e[0], e[2]) + 20) / WH), z0 = Math.floor((Math.min(e[1], e[3]) - 20) / WH), z1 = Math.floor((Math.max(e[1], e[3]) + 20) / WH);
      for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) { const k = i + ',' + j; let Lc = whash.get(k); if (!Lc) whash.set(k, Lc = []); Lc.push(n); } });
    const wallD = (x, z) => { const Lc = whash.get(Math.floor(x / WH) + ',' + Math.floor(z / WH)); if (!Lc) return 1e9; let bd = 1e9;
      for (const n of Lc) { const [ax, az, bx, bz] = WS[n], vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1), 0, 1); bd = Math.min(bd, Math.hypot(x - ax - vx * t, z - az - vz * t)); }
      return bd; };
    let WC = [0, 0];
    if (WS.length) { let sx = 0, sz = 0; for (const e of WS) { sx += e[0] + e[2]; sz += e[1] + e[3]; } WC = [sx / WS.length / 2, sz / WS.length / 2]; }
    const TOW = LD.towers || [], GATES = LD.gates || [];
    const nearLandmark = (x, z, m) => wallD(x, z) < m || MINARETS.some(([mx, mz, , r]) => Math.hypot(x - mx, z - mz) < r + m) ||
      GATES.some(([, fl]) => { for (let k = 0; k < fl.length; k += 2) if (Math.hypot(x - fl[k], z - fl[k + 1]) < m + 3) return true; return false; });

    // the ground's colours (the dry autumn of the Khorezm oasis): pale loess dust, the dry grass of the verges in patches, the green of the
    // irrigated gardens and the trees' canopy farther out, the leaf litter under the crowns near the road, the trodden earth of the town
    P.colFn = (x, z, ny, dd, cov, o) => {
      const m = P.n3(x, z), q = P.n4(x, z), fo = nrLCf(x, z, 1), sc = nrLCf(x, z, 2), se = nrLCf(x, z, 3);
      let r = 0.9 + (m - 0.5) * 0.14, g = 0.8 + (m - 0.5) * 0.1 + (q - 0.5) * 0.05, b = 0.62 + (q - 0.5) * 0.08;
      const gr = sstep(0.5, 0.85, P.n2(x, z)) * 0.55; r = lerp(r, 0.7, gr); g = lerp(g, 0.7, gr); b = lerp(b, 0.46, gr);   // (dry grass)
      r = lerp(r, 0.56, sc * 0.6); g = lerp(g, 0.6, sc * 0.6); b = lerp(b, 0.36, sc * 0.6);   // (the gardens)
      const cv = clamp(cov, 0, 1), can = fo * (1 - cv);
      r = lerp(r, 0.36 + m * 0.06, can * 0.85); g = lerp(g, 0.44 + m * 0.05, can * 0.85); b = lerp(b, 0.24, can * 0.85);
      r = lerp(r, 0.6, cv * 0.8); g = lerp(g, 0.52, cv * 0.8); b = lerp(b, 0.38, cv * 0.8);
      const k = 0.96 + (q - 0.5) * 0.1; r = lerp(r, 0.84 * k, se * 0.5); g = lerp(g, 0.74 * k, se * 0.5); b = lerp(b, 0.58 * k, se * 0.5);
      if (dd < 4) { const t = sstep(4, 0.5, dd); r = lerp(r, 0.86, t); g = lerp(g, 0.8, t); b = lerp(b, 0.7, t); }
      o[0] = r; o[1] = g; o[2] = b; return o; };
    const gMat = new THREE.MeshLambertMaterial({ map: ownTex(hvGroundTex()), vertexColors: true });
    const tiles = [];
    for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { const on = nrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; tiles.push(ti, tj, on); }

    /* ---- the road: asphalt (resurfaced in sections, darker on the racing line), white edge lines and the centre line by the country's rules
       (World.cesta's crte), the markings across the road where OpenStreetMap has them (World.cesta's precne); the chequered line at the start ---- */
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const RC = 128, tileL = 8, secT = new Float32Array(N), CZ = World.cesta ? World.cesta.crte(T, { r: 140, pred: 40 }) : null, CL = CZ ? CZ.at : null;
    const XM = CZ && World.cesta.precne ? World.cesta.precne(T, CZ, (LD.onRoad || []).map(([d, k, x]) => [sAt(d), k, x]), { rob: 0.38, sred: 0.08 }) : { kosi: [], brez: [] }, xk = new Map(), wx = [0.9, 0.9, 0.86];
    if (CL) for (const [a, b] of XM.brez) for (let i = Math.ceil(a / ds); i <= Math.floor(b / ds); i++) CL[wrapI(i)] = 0;
    for (const q of XM.kosi) { const c = Math.floor(wrapI(Math.floor(Math.min(q[0], q[1]) / ds)) / RC); if (!xk.has(c)) xk.set(c, []); xk.get(c).push(q); }
    const PtS = (s, o, y) => { const f = (((s % L) + L) % L) / ds, i0 = Math.floor(f) % N, t = f - Math.floor(f), a = Pt(i0, o, y), b = Pt((i0 + 1) % N, o, y); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
    const layX = (gl, [s0, s1, o0, o1, tri]) => {
      if (tri) { const r0 = gl.row([PtS(s0, o0, 0.034), PtS(s0, o1, 0.034)], [wx, wx]), r1 = gl.row([PtS(s1, (o0 + o1) / 2, 0.034)], [wx]); if (s1 > s0) gl.I.push(r0, r0 + 1, r1); else gl.I.push(r0 + 1, r0, r1); return; }
      const S = [s0]; for (let i = Math.floor(s0 / ds) + 1; i * ds < s1 - 0.05; i++) if (i * ds > s0 + 0.05) S.push(i * ds); S.push(s1);
      let pr = -1; for (const s of S) { const r = gl.row([PtS(s, o0, 0.034), PtS(s, o1, 0.034)], [wx, wx]); if (pr >= 0) gl.link(pr, r, 0, 1); pr = r; }
    };
    for (let i0 = 0, k = 0; i0 < N; k++) { const n = 50 + Math.floor(crH(k, 3, 37) * 70), t = 0.9 + crH(k, 5, 37) * 0.15; for (let i = i0; i < Math.min(N, i0 + n); i++) secT[i] = t; i0 += n; }
    const shade = (i, o, w) => { const rl = T.rl[i]; let k = (0.84 - 0.12 * Math.exp(-((o - rl) * (o - rl)) / 5)) * secT[i]; if (Math.abs(o) > w * 0.9) k -= 0.04; return [k, k, k * 1.02]; };
    for (let c0 = 0; c0 < N; c0 += RC) {
      const gr = new RB(true), gl = new RB(); let pr = -1, pl = -1, pc = 0;
      for (let ii = c0; ii <= Math.min(c0 + RC, N); ii++) {
        const i = ii % N, w = T.wAt(i), offs = [-w, -w / 2, 0, w / 2, w], v = ii * ds / tileL;
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o, w)), offs.map(o => [(o + w) / tileL, v])); if (pr >= 0) gr.link(pr, r, 0, 4); pr = r;
        const wl = [0.9, 0.9, 0.86], cl = CL ? CL[i] : 0, lp = [Pt(i, -w + 0.22, 0.034), Pt(i, -w + 0.38, 0.034), Pt(i, w - 0.38, 0.034), Pt(i, w - 0.22, 0.034)];
        if (cl) lp.push(Pt(i, -0.08, 0.034), Pt(i, 0.08, 0.034));
        const l = gl.row(lp, lp.map(() => wl));
        if (pl >= 0) { gl.link(pl, l, 0, 1); gl.link(pl, l, 2, 3); if (cl && pc) gl.link(pl, l, 4, 5); } pl = l; pc = cl;
      }
      for (const q of xk.get(c0 / RC) || []) layX(gl, q);
      addM(gr, aMat); addM(gl, lMat);
    }
    {   // the chequered line: the start and the finish of each lap
      const gq = new GB(true), HYp = (p) => T.hy[p[3]];
      const w = T.wAt(T.idx(sStart)), uM = Math.round(w * 2 / 0.8) / 16;
      const a = atSf(sAt(-0.8), -w), b = atSf(sAt(-0.8), w), c = atSf(sAt(0.8), w), d = atSf(sAt(0.8), -w);
      gq.quadUp([a[0], HYp(a) + 0.04, a[1]], [b[0], HYp(b) + 0.04, b[1]], [c[0], HYp(c) + 0.04, c[1]], [d[0], HYp(d) + 0.04, d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker }));
    }

    /* ---- the barriers (Core's T.bl / T.br) drawn as the town's low concrete barriers; by the start white walls with a catch fence and the
       crowd behind it (a closed lap: no barriers across the road) ---- */
    const startArea = (i) => { const d = dS(i * ds); return d < 140 || d > L - 120; };
    const kindAt = (i) => (startArea(i) ? 1 : 0);   // 0 concrete, 1 white wall and fence
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const conc = [0.84, 0.82, 0.78], concD = [0.64, 0.62, 0.58], concT = [0.9, 0.88, 0.84], wh = [0.92, 0.92, 0.9], whD = [0.74, 0.74, 0.72];
    const wallRow = (gr, i, side, k) => {
      const bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.1), o2 = side * (bar + 0.5), h = k === 1 ? 1.15 : 0.85, tone = 0.94 + crH(i >> 3, side, 71) * 0.1;
      const c0 = k === 1 ? whD : concD.map(v => v * tone), c1 = k === 1 ? wh : conc.map(v => v * tone), c2 = k === 0 ? concT : wh;
      let p = [Pt(i, o, -0.5), Pt(i, o, h - 0.08), Pt(i, o, h), Pt(i, o2, h)], c = [c0, c1, c2, c2];
      if (side < 0) { p = p.reverse(); c = c.slice().reverse(); }
      return gr.row(p, c);
    };
    for (let c0 = 0; c0 < N; c0 += RC) {
      const gr = new RB();
      for (const side of [-1, 1]) {
        let prev = -1, pk = -1;
        for (let ii = c0; ii <= Math.min(c0 + RC, N); ii++) {
          const i = ii % N, k = kindAt(i);
          if (prev >= 0 && k !== pk) { gr.link(prev, wallRow(gr, i, side, pk), 0, 3); prev = -1; }
          const r = wallRow(gr, i, side, k); if (prev >= 0) gr.link(prev, r, 0, 3); prev = r; pk = k;
        }
      }
      addM(gr, rMat, true);
    }
    const scen = new Chunks(128);
    {   // the catch fence along the white walls by the start
      const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide }), gf = new RB(true);
      for (const side of [-1, 1]) { let pr = -1, acc = 0;
        for (let d = -110; d <= 140; d += 2) { const i = T.idx(sAt(d)), bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.15);
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
    let nBld = 0, nStone = 0;

    /* ---- the landmark, the simple one (one mesh) until the model of assets/landmarks/hiva.glb has loaded (World.znamenitost), all after
       OpenStreetMap (tools/hiva/obzidje.py): the walls of the old town along the outlines of their footprints (battered mud brick, the
       rounded battlements on the outer edges), the round towers at OSM's defensive towers, the four gates as blocks in their footprints with
       a parapet, the two minarets (the short wide one banded in green and blue tiles, the tall slender one in bands of brick and tile with its
       lantern) ---- */
    if (WS.length) {
      const gF = new GB(), mud = [0.8, 0.66, 0.48], mudD = [0.7, 0.56, 0.4], mudT = [0.86, 0.73, 0.55];
      const gH = (x, z) => nrGround(x, z);
      for (const [ax, az, bx, bz, hgt, os] of WS) {
        const len = Math.hypot(bx - ax, bz - az); if (len < 0.5) continue;
        const ang = Math.atan2(bz - az, bx - ax), mx = (ax + bx) / 2, mz = (az + bz) / 2, y0 = Math.min(gH(ax, az), gH(bx, bz), gH(mx, mz)) - 1;
        box(gF, mx, y0, mz, len + 1.2, hgt * 0.55 + 1, 7.5, ang, mudD, mud, true);   // (the battered foot)
        box(gF, mx, y0, mz, len + 0.8, hgt + 1, 5, ang, mud, mudT, true);
        const n = Math.max(1, Math.round(len / 2.6)), ca = Math.cos(ang), sa = Math.sin(ang);
        for (const sd of os ? [os] : [-1, 1]) for (let q = 0; q < n; q++) { const t = (q + 0.5) / n - 0.5, px = mx + ca * t * len - sa * 2.1 * sd, pz = mz + sa * t * len + ca * 2.1 * sd;
          box(gF, px, y0 + hgt + 1, pz, len / n - 0.9, 1.1, 0.7, ang, mud, mudT, true); }
      }
      // the round towers where OSM has them (tower:type=defensive), a little higher than the wall
      for (const [x, z] of TOW) { const y = gH(x, z) - 1; cyl(gF, x, y, z, 3.6, 9 + 2.2, 10, mud, mudT, 3.1); }
      // the gates: a block in each footprint (its smallest bounding rectangle), the height from OSM, a parapet round the top
      for (const [h, fl] of GATES) {
        const P2 = []; for (let k = 0; k < fl.length; k += 2) P2.push([fl[k], fl[k + 1]]);
        let best = null;
        for (let k = 0; k + 1 < P2.length; k++) {
          const a = Math.atan2(P2[k + 1][1] - P2[k][1], P2[k + 1][0] - P2[k][0]), ca = Math.cos(a), sa = Math.sin(a);
          let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
          for (const [x, z] of P2) { const u = x * ca + z * sa, v = -x * sa + z * ca; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
          if (!best || (u1 - u0) * (v1 - v0) < best.ar) best = { ar: (u1 - u0) * (v1 - v0), a, ca, sa, u: (u0 + u1) / 2, v: (v0 + v1) / 2, Lb: u1 - u0, Wb: v1 - v0 };
        }
        if (!best) continue;
        const cx = best.u * best.ca - best.v * best.sa, cz = best.u * best.sa + best.v * best.ca;
        let y0 = 1e9; for (const [x, z] of P2) y0 = Math.min(y0, gH(x, z)); y0 -= 1;
        box(gF, cx, y0, cz, best.Lb, h + 1, best.Wb, best.a, mud, mudT, true);
        for (const [du, dv, l, w] of [[0, best.Wb / 2 - 0.35, best.Lb, 0.7], [0, -best.Wb / 2 + 0.35, best.Lb, 0.7], [best.Lb / 2 - 0.35, 0, 0.7, best.Wb], [-best.Lb / 2 + 0.35, 0, 0.7, best.Wb]])
          box(gF, cx + du * best.ca - dv * best.sa, y0 + h + 1, cz + du * best.sa + dv * best.ca, l, 1.1, w, best.a, mud, mudT, true);
        nStone++;
      }
      // the minarets
      const tile = [[0.24, 0.6, 0.58], [0.2, 0.42, 0.66], [0.9, 0.88, 0.8], [0.7, 0.56, 0.4]];
      for (const [x, z, h, r0, kind] of MINARETS) {
        const y = gH(x, z) - 0.5, n = kind === 'short' ? 9 : 14, r1 = kind === 'short' ? r0 * 0.78 : r0 * 0.5;
        for (let k = 0; k < n; k++) {
          const t0 = k / n, t1 = (k + 1) / n, ra = lerp(r0, r1, t0), rb = lerp(r0, r1, t1);
          const c = kind === 'short' ? tile[k % 2] : (k % 3 === 2 ? tile[(k / 3 | 0) % 2] : tile[3]);
          cyl(gF, x, y + h * t0, z, ra, h / n + 0.02, 16, c, null, rb);
        }
        if (kind === 'tall') { cyl(gF, x, y + h, z, r1 * 1.5, 0.6, 16, tile[2], null, r1 * 1.5); cyl(gF, x, y + h + 0.6, z, r1 * 1.2, 3.2, 16, tile[3], null, r1 * 1.2); cone(gF, x, y + h + 3.8, z, r1 * 1.25, 2.6, 16, tile[0], tile[0], 0); }
        else { cyl(gF, x, y + h, z, r1 * 1.04, 0.5, 16, tile[2], null, r1 * 1.04); }
        exclPush(x, z, r0 + 6); nStone++;
      }
      const fm = new THREE.Mesh(gF.geometry(), matV); fm.castShadow = fm.receiveShadow = true; fm.matrixAutoUpdate = false; root.add(fm);
      out.landmarkFallback = fm; out.marks = { Obzidje: WC.slice() };
      if (HAS_GLB && World.znamenitost) World.znamenitost.add('hiva', root, { x: WC[0], z: WC[1], fallback: fm, out });
    }

    /* ---- the buildings (OSM footprints within 60 m): the flat-roofed houses of the oasis in mud brick and loess plaster, a low parapet on the
       roof; the bigger ones in two or three floors ---- */
    const WALL = [[0.84, 0.72, 0.54], [0.88, 0.78, 0.62], [0.8, 0.68, 0.52], [0.92, 0.86, 0.74], [0.76, 0.64, 0.48], [0.94, 0.92, 0.86]];
    const WIN = [[0.3, 0.28, 0.26], [0.36, 0.32, 0.28], [0.28, 0.36, 0.4]];
    const house = (g, bx, bz, Lb, Wb, ang, y0, hh, wc) => {
      box(g, bx, y0 - 0.5, bz, Lb, hh + 0.5, Wb, ang, wc, vary([0.72, 0.66, 0.56], R, 0.05), true);
      for (let f = 1; f <= Math.round(hh / 3.1); f++) box(g, bx, y0 + f * 3.1 - 1.9, bz, Lb + 0.05, 0.9, Wb + 0.05, ang, WIN[Math.floor(crH(bx, bz, 13) * WIN.length)], null, true);   // (the rows of windows)
      box(g, bx, y0 + hh, bz, Lb, 0.5, Wb, ang, wc.map(v => v * 0.93), [0.72, 0.64, 0.52]);
    };
    for (const [bx, bz, Lb, Wb, ang, Hb, k0] of LD.bld) {
      if (nearLandmark(bx, bz, Math.max(Lb, Wb) / 2 + 4)) continue;   // (the walls and the minarets are the landmark's)
      const ca = Math.cos(ang), sa = Math.sin(ang), corners = [[Lb / 2, Wb / 2], [Lb / 2, -Wb / 2], [-Lb / 2, Wb / 2], [-Lb / 2, -Wb / 2]].map(([a, b]) => [bx + ca * a - sa * b, bz + sa * a + ca * b]);
      let clash = false, y0 = 1e9; for (const [cx, cz] of corners.concat([[bx, bz]])) { const n = nrNear(cx, cz); if (n.i >= 0 && n.dd < 1.2) clash = true; y0 = Math.min(y0, nrGround(cx, cz)); }
      if (clash || Lb < 2.2 || Wb < 2.2) continue;
      const g = scen.get(bx, bz), hk = crH(bx, bz, 11), area = Lb * Wb, big = k0 === 5 || k0 === 6 || k0 === 9 || area > 240;
      const hh = Hb || (big ? (2 + Math.floor(hk * 2)) * 3.1 : area < 45 || k0 === 4 ? 3 + hk : 3.4 + hk * 2.6);
      house(g, bx, bz, Lb, Wb, ang, y0, hh, vary(WALL[Math.floor(crH(bx, bz, 12) * WALL.length)], R, 0.05));
      nBld++; CR.block(bx, bz, Lb, Wb, ang); exclPush(bx, bz, Math.max(Lb, Wb) / 2 + 2);
    }
    // (no houses beyond OpenStreetMap's footprints: where it has none, the town is left to the land cover's colour and the trees)

    /* ---- the start: a banner over the road on two masts at the line (no words), flags along the walls ---- */
    {
      const [x, z, h, i] = atS(sStart, 0), gy = T.hy[i], g = scen.get(x, z), span = Math.max(T.bl[i], T.br[i]) + 1.2, nx = T.nx[i], nz = T.nz[i];
      for (const sd of [-1, 1]) box(g, x + nx * span * sd, gy - 0.3, z + nz * span * sd, 0.5, 7.6, 0.5, h, [0.86, 0.86, 0.84]);
      box(g, x, gy + 6.2, z, 0.3, 1.3, span * 2 - 0.6, h, [0.92, 0.9, 0.86], [0.16, 0.42, 0.62]);
      box(g, x, gy + 6.0, z, 0.32, 0.2, span * 2 - 0.4, h, [0.16, 0.42, 0.62]);
      exclPush(x, z, span + 4);
    }
    {
      const FL = [[0.16, 0.48, 0.72], [0.95, 0.95, 0.93], [0.2, 0.6, 0.3], [0.9, 0.2, 0.16], [0.95, 0.78, 0.15]];
      for (let d = -100; d < 130; d += 18) for (const side of [-1, 1]) {
        const ii = T.idx(sAt(d)), o = side * ((side > 0 ? T.br[ii] : T.bl[ii]) + 1.6), px = T.px[ii] + T.nx[ii] * o, pz = T.pz[ii] + T.nz[ii] * o, py = nrGround(px, pz), gg = scen.get(px, pz);
        CR.avoid(px, pz, 0.45);
        cyl(gg, px, py, pz, 0.06, 6, 5, [0.86, 0.86, 0.88]); API.flags.add(px, py + 5.6, pz, T.hd[ii], [FL[Math.floor(crH(d, side, 5) * FL.length)]], 1.2, 0.8);   // (waving: js/world-zastave.js)
      }
    }
    let nFans = 0;
    {   // few spectators (fewFans): at the start, under the tall minaret
      const runs = [[-100, 120, 2, 0.4]];
      const at = { 'Pod minaretom': [70, 2, 0.3] };
      for (const q of T.names) { const a = at[q.n]; if (a) runs.push([dS(q.d !== undefined ? q.d : 0) - 30, dS(q.d !== undefined ? q.d : 0) + a[0], a[1], a[2]]); }
      for (const [a, b, rows, dens] of runs) for (const side of [-1, 1]) {
        for (let s0 = a; s0 < b; s0 += 30) { const s1 = Math.min(b, s0 + 30);
          nFans += crowdRun(CR, sAt(s0), sAt(s0) + (s1 - s0), side, { rows, dens, first: 1.0, excluded }); }
      }
    }

    /* ---- the trees, within 60 m of the road only: the poplars in lines along the streets and the ditches, the mulberries and the elms in the
       yards and the gardens, bushes on the scrub; the ground under the crowns turns to leaf litter (G.cov) ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const WIND = { value: 0 }; out.dyn.wind = WIND;
    tMat.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = WIND;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
        '#ifdef USE_INSTANCING\nfloat wPh = instanceMatrix[3].x * 0.07 + instanceMatrix[3].z * 0.05;\n#else\nfloat wPh = 0.0;\n#endif\n' +
        'float wK = position.y * position.y * 0.018;\ntransformed.x += wK * sin( uWind * 1.1 + wPh );\ntransformed.z += wK * 0.6 * sin( uWind * 0.83 + wPh * 1.7 );');
    };
    tMat.customProgramCacheKey = () => 'hvTreeWind';
    const TK = [new IChunks(hvTreeGeo(0), tMat, 256), new IChunks(hvTreeGeo(1), tMat, 256), new IChunks(hvTreeGeo(2), tMat, 256)];
    let nTrees = 0;
    const NEAR = 60;
    const plant = (sp, x, z, hgt, wid, c) => {   // sp: 0 poplar, 1 round crown, 2 wide elm, 3 a bush (sunk)
      const y = nrGround(x, z) - 0.1, rot = crH(x, z, 21) * TAU;
      if (sp === 3) TK[1].add(x, y - 0.42 * hgt, z, rot, wid * 1.3, hgt * 1.3, c);
      else TK[sp].add(x, y, z, rot, wid, hgt, c);
      nrShade(x, z, wid * (sp === 0 ? 0.3 : sp === 3 ? 0.4 : 0.42), sp === 3 ? 0.6 : 1); nTrees++; };
    {
      const Lt = NRC * 32, maxT = Math.round(60000 * (opts.density || 1));
      for (let tj = 0; tj < G.ntz && nTrees < maxT; tj++) for (let ti = 0; ti < G.ntx && nTrees < maxT; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt; zz += 6.5) for (let xx = xa; xx < xa + Lt; xx += 6.5) {
          const x = xx + (crH(xx, zz, 22) - 0.5) * 5.6, z = zz + (crH(xx, zz, 23) - 0.5) * 5.6, rd = nrDist(x, z);
          if (rd > NEAR) continue;
          const cl = nrLC(x, z), h1 = crH(x, z, 24);
          const p = cl === 1 ? 0.6 : cl === 2 ? 0.3 : cl === 3 ? 0.1 : 0.05;
          if (h1 > p) continue;
          const nn = nrNear(x, z), ni = nn.i, ndd = nn.dd; if (ni >= 0 && ndd < 3) continue;
          if (excluded(x, z) || nearLandmark(x, z, 9)) continue;
          const hq = crH(x, z, 25), hs = crH(x, z, 26), cv = 0.86 + crH(x, z, 27) * 0.28, col = [cv * (0.95 + hq * 0.1), cv, cv * (0.94 + hs * 0.1)];
          let sp;
          if (cl === 1) sp = hs < 0.35 ? 0 : hs < 0.8 ? 1 : 2;
          else if (cl === 2) sp = hs < 0.6 ? 3 : hs < 0.85 ? 1 : 0;
          else if (cl === 3) sp = hs < 0.4 ? 0 : hs < 0.85 ? 1 : 2;
          else sp = hs < 0.5 ? 0 : hs < 0.8 ? 1 : 3;
          const hgt = sp === 0 ? 14 + hq * 8 : sp === 1 ? 6 + hq * 4 : sp === 2 ? 8 + hq * 4 : 1.3 + hq * 1.6;
          const wid = sp === 0 ? hgt * (0.9 + hs * 0.2) : sp === 1 ? hgt * (0.9 + hs * 0.2) : sp === 2 ? hgt * (1.1 + hs * 0.2) : hgt * 1.2;
          if (ni >= 0 && ndd < 3 + (sp === 0 ? 1 : wid * 0.3) && sp !== 3) continue;   // (no crown over the barriers)
          plant(sp, x, z, hgt, wid, col);
        }
      }
    }
    for (const t of TK) t.addTo(root, true);

    /* ---- the walls of OSM by the road (within 30 m; the fences are left out): a mud-brick wall along each line ---- */
    for (const [k, fl] of LD.walls) {
      if (k > 2) continue;
      for (let q = 0; q + 3 < fl.length; q += 2) {
        const ax = fl[q], az = fl[q + 1], bx = fl[q + 2], bz = fl[q + 3], len = Math.hypot(bx - ax, bz - az); if (len < 0.6) continue;
        const mx = (ax + bx) / 2, mz = (az + bz) / 2, nn = nrNear(mx, mz); if (nn.i >= 0 && nn.dd < 0.8) continue;
        const y = nrGround(mx, mz), ang = Math.atan2(bz - az, bx - ax), g = scen.get(mx, mz);
        if (k === 2) box(g, mx, y - 0.2, mz, len + 0.3, 1.6, 1.1, ang, vary([0.3, 0.4, 0.2], R, 0.08), [0.32, 0.44, 0.22], true);
        else box(g, mx, y - 0.4, mz, len + 0.2, k === 1 ? 2.2 : 1.8, 0.45, ang, vary([0.82, 0.7, 0.54], R, 0.04), [0.86, 0.75, 0.58], true);
      }
    }

    /* ---- the far land beyond the corridor (200 m cells): the oasis's fields and gardens and the town, a little lower so its edge hides under
       the near tiles ---- */
    {
      const F = LD.far, bin = atob(F.b64), n = F.n, H = (i, j) => F.lo + bin.charCodeAt(clamp(j, 0, n - 1) * n + clamp(i, 0, n - 1)) * F.step, gf = new GB();
      const colF = (h, x, z) => { const k = 0.9 + crH(Math.floor(x / 200), Math.floor(z / 200), 3) * 0.15, gr = crH(Math.floor(x / 200), Math.floor(z / 200), 4); return gr < 0.45 ? [0.56 * k, 0.6 * k, 0.4 * k] : [0.82 * k, 0.74 * k, 0.58 * k]; };
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
      const vg = [0.9, 0.82, 0.68], dirt = [0.94, 0.82, 0.64];
      for (let c0 = 0; c0 < N; c0 += RC) {
        const gv = new RB(true), pv = [-1, -1];
        for (let ii = c0; ii <= Math.min(c0 + RC, N); ii++) {
          const i = ii % N, wr = 0.2 + 0.6 * sstep(0.4, 0.85, P.n7(T.px[i], T.pz[i])), vw = [lerp(vg[0], dirt[0], wr), lerp(vg[1], dirt[1], wr), lerp(vg[2], dirt[2], wr)];
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
    out.stats = { tiles: nTiles, trees: nTrees, buildings: nBld, stone: nStone, fans: nFans, wall: WS.length };   // (read by the tests)
    return out;
  }

  World.ext.hiva = (scene, tex, opts) => buildHiva(scene, tex, opts);
})();
