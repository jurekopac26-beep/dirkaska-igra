/* =========================================================================
   WORLD — Mombasa (theme 'mombasa'): a city course on the island of Mombasa on today's roads: the town centre, the old town, under the west wall of the old fortress and along the shore road above the Likoni channel (docs/proge/mombasa.md). Its own builder (World.ext.mombasa)
   in a file of its own, on World's shared corridor helpers (World.api: nrPrep's terrain from the track's dem and land cover, as Livorno) and the
   scenery data of js/data/mombasa.js (OpenStreetMap, Copernicus DEM, ESA WorldCover, Meta / WRI canopy).
   The 60 m rule: the detailed things only within ~60 m of the road, as far as the chase camera sees them: the houses and blocks of the city in
   their OSM footprints and more of the same between them where the land is built up (pastel walls, flat roofs with their parapets), the palms,
   the round-crowned trees and the baobabs on the red ground, the concrete barriers of the city's roads, the coral rock of the shore,
   and by the road the old fortress of coral stone (its walls and bastions after its OSM outline: the model of assets/landmarks/mombasa.glb, made
   in Blender by tools/znamenitost/, World.znamenitost; until it has loaded, or if it cannot, the simpler one built here). Farther out only
   the terrain from the heights, the sea to the horizon and the far land. Only geographic and plain names (no people, events, firms or brands).
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
  const SEA = 0;   // the sea's level: the track's heights are metres above the sea

  // ---- the trees (unit height 1, instanced): 0 a palm (a slender leaning trunk, a crown of fronds), 1 a round crown (the city's shade trees;
  //      squat and sunk: the bushes of the dry scrub), 2 a baobab (a thick short trunk, a sparse wide flat crown) ----
  function moTreeGeo(kind) {
    const g = new GB(), R = rng(1698 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
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
  function moGroundTex() {   // the ground under the vertex colours (256 px = 14 m, tileable): a warm dusty tone with flecks
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), r = rng(1576), img = x.createImageData(S, S), d = img.data;
    const n1 = valueNoise2(1577, 40), n2 = valueNoise2(1578, 9), wr = (f, i, j) => { const u = i / S, v = j / S; return f(i, j) * (1 - u) * (1 - v) + f(i - S, j) * u * (1 - v) + f(i, j - S) * (1 - u) * v + f(i - S, j - S) * u * v; };
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const o = (j * S + i) * 4, k = 0.78 + wr(n1, i, j) * 0.16 + wr(n2, i, j) * 0.1 + (r() - 0.5) * 0.12;
      d[o] = Math.min(255, 210 * k); d[o + 1] = Math.min(255, 190 * k); d[o + 2] = Math.min(255, 165 * k); d[o + 3] = 255; }
    x.putImageData(img, 0, 0);
    for (let k = 0; k < 500; k++) { const px = r() * S, py = r() * S, g = 80 + r() * 60; x.fillStyle = `rgba(${g + 14},${g},${g - 16},0.35)`; x.fillRect(px, py, 1 + r() * 2, 1 + r() * 2); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  }

  function buildMombasa(scene, tex, opts) {
    const R = rng(1698), N = T.N, ds = T.ds, sStart = T.startS, sFin = T.finishS, iE = N - 1, def = T.def, L = T.len, LD = MO_DATA;
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
    // what keeps the trees and the blocks off (the buildings, the fortress, the crowds, the start), hashed circles
    const eh = new Map(), EHC = 32;
    const exclPush = (x, z, r) => { const e = { x, z, r }; for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); } };
    const excluded = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (const e of Lc) if ((x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; return false; };

    // ---- the fortress on the hill (LD.marks 'castle'): its outline, centre and reach; the ground inside it (and 12 m round) as the heights are,
    //      without the far terrain's noise, so that the model (built on the same heights) stands on it ----
    const marks = LD.marks.map(([lab, kind, s, d, fl]) => { const pts = []; for (let k = 0; k + 1 < fl.length; k += 2) pts.push([fl[k], fl[k + 1]]); return { lab, kind, s, d, pts }; });
    const fort = marks.find(m => m.kind === 'castle' && m.pts.length > 3);
    let FC = null, FR = 0, FB = null;
    if (fort) {
      const u = fort.pts.slice(0, -1); FC = [u.reduce((a, p) => a + p[0], 0) / u.length, u.reduce((a, p) => a + p[1], 0) / u.length];
      for (const [x, z] of u) FR = Math.max(FR, Math.hypot(x - FC[0], z - FC[1]));
      FB = [Math.min(...u.map(p => p[0])) - 14, Math.max(...u.map(p => p[0])) + 14, Math.min(...u.map(p => p[1])) - 14, Math.max(...u.map(p => p[1])) + 14];
    }
    const segD = (pts, x, z) => { let bd = 1e9; for (let k = 0; k + 1 < pts.length; k++) { const [ax, az] = pts[k], [bx, bz] = pts[k + 1], vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1), 0, 1); bd = Math.min(bd, Math.hypot(x - ax - vx * t, z - az - vz * t)); } return bd; };
    const fortW = (x, z) => { if (!fort || x < FB[0] || x > FB[1] || z < FB[2] || z > FB[3]) return 0; if (inPoly(fort.pts, x, z)) return 1; return sstep(12, 0, segD(fort.pts, x, z)); };
    // the view of the fortress from the road: the open ground in front of it (the lawns and the square between the road and the walls) keeps
    // the buildings and the trees off a 40 m wide corridor from the road's nearest point to the walls
    let FV = null;
    if (fort) { let bi = 0, bd = 1e9; for (let i = 0; i < N; i++) { const d = Math.hypot(T.px[i] - FC[0], T.pz[i] - FC[1]); if (d < bd) { bd = d; bi = i; } } FV = [[T.px[bi], T.pz[bi]], FC]; }
    const inView = (x, z, m) => !!FV && segD(FV, x, z) < 20 + m;
    const inFort = (x, z, m) => !!fort && x > FB[0] + 14 - m && x < FB[1] - 14 + m && z > FB[2] + 14 - m && z < FB[3] - 14 + m && (inPoly(fort.pts, x, z) || segD(fort.pts, x, z) < m);

    // ---- the coast: the signed distance to OSM's coastline (+ on the sea: the land lies on the left of each line), the sea's floor under the shore ----
    const CO = [], CH = 48, chash = new Map();
    for (const fl of LD.coast) { for (let k = 0; k + 3 < fl.length; k += 2) CO.push([fl[k], fl[k + 1], fl[k + 2], fl[k + 3]]); }
    CO.forEach((e, n) => { const x0 = Math.floor(Math.min(e[0], e[2]) / CH), x1 = Math.floor(Math.max(e[0], e[2]) / CH), z0 = Math.floor(Math.min(e[1], e[3]) / CH), z1 = Math.floor(Math.max(e[1], e[3]) / CH);
      for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) { const k = i + ',' + j; let Lc = chash.get(k); if (!Lc) chash.set(k, Lc = []); Lc.push(n); } });
    const seaD = (x, z) => {
      let bd = 1e9, bs = 1; const i0 = Math.floor(x / CH), j0 = Math.floor(z / CH);
      for (let r = 0; r <= 3 && bd > r * CH - CH; r++) for (let i = i0 - r; i <= i0 + r; i++) for (let j = j0 - r; j <= j0 + r; j++) {
        if (Math.max(Math.abs(i - i0), Math.abs(j - j0)) !== r) continue; const Lc = chash.get(i + ',' + j); if (!Lc) continue;
        for (const k of Lc) { const [ax, az, bx, bz] = CO[k], vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1), 0, 1), dx = x - ax - vx * t, dz = z - az - vz * t, d = Math.hypot(dx, dz);
          if (d < bd) { bd = d; bs = (dx * vz - dz * vx) > 0 ? -1 : 1; } } }
      if (bd > 25 || bd > 1e8) { const sea = nrDem(x, z) < SEA + 0.6; return (bd > 1e8 ? 200 : bd) * (sea ? 1 : -1); }   // (away from the line its side by the heights)
      return bd * bs; };
    P.pad = (x, z, h) => {
      const sd = seaD(x, z);
      if (sd > 0) h = Math.min(h, SEA - 0.6 - Math.min(sd, 70) * 0.07);   // the sea's floor, deeper away from the shore
      else if (sd > -30) h = Math.max(h, SEA + 0.4 + Math.min(-sd, 30) * 0.03);   // (the shore stays above the water)
      const fw = fortW(x, z); if (fw > 0) h = lerp(h, nrDem(x, z), fw);
      return h; };
    // the ground's colours (the coast of Kenya): the red earth and ochre dust, dry grass in patches, the trees' canopy farther
    // out and the leaf litter under the crowns near the road, the dust of the town, the red rock of the steep banks, the sand of the beaches
    P.colFn = (x, z, ny, dd, cov, o) => {
      const m = P.n3(x, z), q = P.n4(x, z), fo = nrLCf(x, z, 1), sc = nrLCf(x, z, 2), se = nrLCf(x, z, 3), sd = seaD(x, z), h = nrDem(x, z);
      let r = 0.92 + (m - 0.5) * 0.18, g = 0.74 + (m - 0.5) * 0.12 + (q - 0.5) * 0.06, b = 0.56 + (q - 0.5) * 0.08;
      const gr = sstep(0.5, 0.85, P.n2(x, z)) * 0.6; r = lerp(r, 0.72, gr); g = lerp(g, 0.7, gr); b = lerp(b, 0.45, gr);   // (dry grass)
      r = lerp(r, 0.66, sc * 0.6); g = lerp(g, 0.62, sc * 0.6); b = lerp(b, 0.4, sc * 0.6);
      const cv = clamp(cov, 0, 1), can = fo * (1 - cv);
      r = lerp(r, 0.36 + m * 0.06, can * 0.85); g = lerp(g, 0.42 + m * 0.05, can * 0.85); b = lerp(b, 0.24, can * 0.85);
      r = lerp(r, 0.62, cv * 0.8); g = lerp(g, 0.5, cv * 0.8); b = lerp(b, 0.38, cv * 0.8);
      const k = 0.96 + (q - 0.5) * 0.12; r = lerp(r, 0.8 * k, se * 0.55); g = lerp(g, 0.66 * k, se * 0.55); b = lerp(b, 0.52 * k, se * 0.55);
      const rk = sstep(0.9, 0.66, ny) * 0.95;
      r = lerp(r, 0.82 + q * 0.06, rk); g = lerp(g, 0.56 + q * 0.05, rk); b = lerp(b, 0.42 + q * 0.04, rk);
      if (sd > -22 && h < 3.0) { const t = sstep(-22, -6, sd) * sstep(3.0, 1.2, h); r = lerp(r, 1.1, t); g = lerp(g, 1.0, t); b = lerp(b, 0.82, t); }
      if (dd < 4) { const t = sstep(4, 0.5, dd); r = lerp(r, 0.86, t); g = lerp(g, 0.8, t); b = lerp(b, 0.72, t); }
      o[0] = r; o[1] = g; o[2] = b; return o; };
    const OB = World.ext.mombasaOb ? World.ext.mombasaOb({ eh, EHC, exclPush, seaD, inFort, root, tex }) : null;   // (the car parks, the parks, the golf course and its ponds of OSM, laid on the ground: js/world-mombasa-obcestje.js)
    const gMat = new THREE.MeshLambertMaterial({ map: ownTex(moGroundTex()), vertexColors: true });
    const tiles = [];
    const loop = [];   // (a tile inside the road's convex hull that the corridor leaves out gets the coarse ring's tile: no hole of far land in the menu's model or from the hill)
    { const pts = []; for (let i = 0; i < T.N; i += 8) pts.push([T.px[i], T.pz[i]]); pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = [];
      for (const p of pts) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
      for (let k = pts.length - 1; k >= 0; k--) { const p = pts[k]; while (hi.length > 1 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
      loop.push(...lo.slice(0, -1), ...hi.slice(0, -1)); }
    for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { const on = nrTileOn(ti, tj) || ([[0.5, 0.5], [0, 0], [1, 0], [0, 1], [1, 1]].some(([a, b]) => inPoly(loop, G.x0 + (ti + a) * NRC * 32, G.z0 + (tj + b) * NRC * 32)) ? 2 : 0); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; tiles.push(ti, tj, on); }

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

    /* ---- the barriers (Core's T.bl / T.br) drawn as the city's low concrete barriers; at the start and at the finish white walls with a catch
       fence and the crowd behind it; a barrier across the road at both its ends ---- */
    const startArea = (i) => { const d = dS(i * ds); return d < 140 || d > dFin - 100; };
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

    /* ---- the fortress on the hill: the simple one (one mesh) until the model of assets/landmarks/mombasa.glb has loaded (World.znamenitost):
       its walls along the outline, battered, ochre, a white cordon under the parapet, the parapet's merlons, and the four buildings of
       the OSM outlines in the yard, white and flat-roofed ---- */
    if (fort) {
      const gF = new GB(), u = fort.pts, och = [0.86, 0.68, 0.46], ochT = [0.8, 0.64, 0.46], wht = [0.95, 0.94, 0.9];
      let area = 0; for (let k = 0; k + 1 < u.length; k++) area += u[k][0] * u[k + 1][1] - u[k + 1][0] * u[k][1];
      const ori = Math.sign(area) || 1;
      for (let k = 0; k + 1 < u.length; k++) {
        const [ax, az] = u[k], [bx, bz] = u[k + 1], len = Math.hypot(bx - ax, bz - az); if (len < 0.5) continue;
        const ang = Math.atan2(bz - az, bx - ax), mx = (ax + bx) / 2, mz = (az + bz) / 2, ys = [nrDem(ax, az), nrDem(bx, bz), nrDem(mx, mz)], y0 = Math.min(...ys), top = Math.max(...ys) + 7.5;
        box(gF, mx, y0 - 1.5, mz, len + 2.6, top - y0 + 1.5, 3.4, ang, och, ochT, true);
        box(gF, mx, top - 1.5, mz, len + 2.8, 0.35, 3.7, ang, wht, wht, true);
        const nx = -Math.sin(ang) * ori, nz = Math.cos(ang) * ori, ox = mx - nx * 1.3, oz = mz - nz * 1.3, n = Math.max(1, Math.round(len / 2.4));   // (the parapet on the outer edge)
        for (let q = 0; q < n; q++) { const t = (q + 0.5) / n - 0.5; box(gF, ox + Math.cos(ang) * t * len, top, oz + Math.sin(ang) * t * len, len / n - 0.7, 0.9, 0.8, ang, och, ochT, true); }
      }
      // the yard's buildings as OSM draws them (way id: centre x, z, length, width, angle; tools/znamenitost/mombasa.py, YARD), white, flat-roofed
      for (const [x, z, lx, lz, la] of [[1306.0, 110.9, 47.7, 11.6, -0.393] /* w99904283 */, [1227.0, 84.7, 10.6, 6.5, -0.586] /* w263829114 */,
                                        [1275.0, 136.5, 13.9, 7.3, -0.417] /* w263829119 */, [1305.1, 60.5, 12.1, 5.7, -0.364] /* w263829120 */]) {
        if (!inPoly(fort.pts, x, z)) continue;
        const y = nrDem(x, z); box(gF, x, y - 1, z, lx, 6.5, lz, la, wht, wht, true);
      }
      const fm = new THREE.Mesh(gF.geometry(), matV); fm.castShadow = fm.receiveShadow = true; fm.matrixAutoUpdate = false; root.add(fm);
      exclPush(FC[0], FC[1], FR + 6); nStone++;
      { const [[ax, az], [bx, bz]] = FV, n = Math.ceil(Math.hypot(bx - ax, bz - az) / 10); for (let k = 0; k <= n; k++) exclPush(ax + (bx - ax) * k / n, az + (bz - az) * k / n, 20); }   // (the view: no trees, no fill)
      out.fort = fm; out.marks = { Trdnjava: FC.slice() };
      if (World.znamenitost) World.znamenitost.add('mombasa', root, { x: FC[0], z: FC[1], fallback: fm, out });
    }

    /* ---- the buildings (OSM footprints within 60 m): houses and blocks in pastel ochre, pink, cream, pale blue and green and white, most with
       a flat roof and its parapet, some old houses with a tiled roof; the shops and the public buildings in three or four floors ---- */
    const WALL = [[0.93, 0.8, 0.58], [0.95, 0.78, 0.74], [0.96, 0.92, 0.8], [0.78, 0.86, 0.9], [0.8, 0.88, 0.76], [0.97, 0.96, 0.93], [0.92, 0.74, 0.56]];
    const ROOF = [[0.68, 0.36, 0.24], [0.62, 0.32, 0.22], [0.72, 0.42, 0.3]];
    const WIN = [[0.3, 0.32, 0.34], [0.42, 0.36, 0.3], [0.36, 0.44, 0.48]];
    const house = (g, bx, bz, Lb, Wb, ang, y0, hh, flat, wc) => {
      box(g, bx, y0 - 0.5, bz, Lb, hh + 0.5, Wb, ang, wc, vary([0.72, 0.68, 0.62], R, 0.05), true);
      for (let f = 1; f <= Math.round(hh / 3.1); f++) box(g, bx, y0 + f * 3.1 - 1.9, bz, Lb + 0.05, 1.0, Wb + 0.05, ang, WIN[Math.floor(crH(bx, bz, 13) * WIN.length)], null, true);   // (the rows of windows)
      if (flat) box(g, bx, y0 + hh, bz, Lb, 0.6, Wb, ang, wc.map(v => v * 0.92), [0.7, 0.64, 0.58]);
      else gable(g, bx, y0 + hh, bz, Lb + 0.6, Wb + 0.6, Math.min(2.4, Wb * 0.22), ang, ROOF[Math.floor(crH(bx, bz, 14) * ROOF.length)], wc);
    };
    for (const [bx, bz, Lb, Wb, ang, Hb, k0] of LD.bld) {
      if (inFort(bx, bz, 4) || inView(bx, bz, Math.max(Lb, Wb) / 2)) continue;   // (the fortress's own buildings are its model's; the view of it stays open)
      const ca = Math.cos(ang), sa = Math.sin(ang), corners = [[Lb / 2, Wb / 2], [Lb / 2, -Wb / 2], [-Lb / 2, Wb / 2], [-Lb / 2, -Wb / 2]].map(([a, b]) => [bx + ca * a - sa * b, bz + sa * a + ca * b]);
      let clash = false, y0 = 1e9, sea = false; for (const [cx, cz] of corners.concat([[bx, bz]])) { const n = nrNear(cx, cz); if (n.i >= 0 && n.dd < 1.2) clash = true; y0 = Math.min(y0, nrGround(cx, cz)); if (seaD(cx, cz) > 2) sea = true; }
      if (clash || sea || Lb < 2.2 || Wb < 2.2) continue;
      const g = scen.get(bx, bz), hk = crH(bx, bz, 11), area = Lb * Wb, big = k0 === 5 || k0 === 6 || k0 === 9 || area > 240;
      const hh = Hb || (big ? (3 + Math.floor(hk * 2)) * 3.1 : area < 45 || k0 === 4 ? 3 + hk : 6.2 + hk * 1.4);
      house(g, bx, bz, Lb, Wb, ang, y0, hh, big || crH(bx, bz, 15) < 0.7, vary(WALL[Math.floor(crH(bx, bz, 12) * WALL.length)], R, 0.05));
      nBld++; CR.block(bx, bz, Lb, Wb, ang); exclPush(bx, bz, Math.max(Lb, Wb) / 2 + 2);
    }
    // more of the city where the land cover says it is built up and OpenStreetMap has no footprints (15-55 m from the road, square to it)
    {
      const Lt = NRC * 32;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt; zz += 18) for (let xx = xa; xx < xa + Lt; xx += 18) {
          if (crH(xx, zz, 40) > 0.55) continue;
          const x = xx + (crH(xx, zz, 41) - 0.5) * 6, z = zz + (crH(xx, zz, 42) - 0.5) * 6, rd = nrDist(x, z);
          if (rd < 15 || rd > 55 || nrLCf(x, z, 3) < 0.5) continue;
          const Lb = 9 + crH(x, z, 43) * 7, Wb = 8 + crH(x, z, 44) * 6;
          if (rd < 0.6 * Math.hypot(Lb, Wb) + 9 || excluded(x, z) || seaD(x, z) > -8 || inFort(x, z, 18)) continue;
          const nn = nrNear(x, z), ni = nn.i, ndd = nn.dd; if (ni < 0 || ndd < 4) continue;
          const ang = T.hd[ni], ca = Math.cos(ang), sa = Math.sin(ang);
          let lo = 1e9, hi = -1e9; for (const [a, b] of [[Lb / 2, Wb / 2], [Lb / 2, -Wb / 2], [-Lb / 2, Wb / 2], [-Lb / 2, -Wb / 2]]) { const h = nrGround(x + ca * a - sa * b, z + sa * a + ca * b); lo = Math.min(lo, h); hi = Math.max(hi, h); }
          if (hi - lo > 4) continue;
          const fl = 2 + Math.floor(crH(x, z, 45) * 4);
          house(scen.get(x, z), x, z, Lb, Wb, ang, lo, fl * 3.1, crH(x, z, 46) < 0.85, vary(WALL[Math.floor(crH(x, z, 47) * WALL.length)], R, 0.05));
          nFill++; CR.block(x, z, Lb, Wb, ang); exclPush(x, z, Math.max(Lb, Wb) / 2 + 2);
        }
      }
    }

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
    if (OB) OB.open();   // (the lawns open again to the crowd and the trees)
    let nFans = 0;
    {   // few spectators (fewFans): at the start, under the fortress, at the finish
      const runs = [[-60, 80, 1, 0.35], [dFin - 60, dFin + 20, 1, 0.3]];   // (one row: the start and the finish are inland, both sides dry)
      const at = { 'Trdnjava': [50, 1, 0.3] };
      for (const q of T.names) { const a = at[q.n]; if (a) runs.push([q.d - 40, q.d + a[0], a[1], a[2]]); }
      const okSide = (s, side) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 2.5), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; return seaD(x, z) < -3; };
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
    tMat.customProgramCacheKey = () => 'moTreeWind';
    const TK = [new IChunks(moTreeGeo(0), tMat, 256), new IChunks(moTreeGeo(1), tMat, 256), new IChunks(moTreeGeo(2), tMat, 256)];
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
          if (excluded(x, z) || seaD(x, z) > -2 || inFort(x, z, 6)) continue;
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

    /* ---- the rocks along the shore within 60 m of the road (the grey and ochre coral rock where the land meets the sea, not on the beaches) ---- */
    {
      const rk = [0.72, 0.55, 0.44]; let nR = 0;
      for (const [ax, az, bx, bz] of CO) {
        const len = Math.hypot(bx - ax, bz - az);
        for (let t = 0; t < len; t += 3.5) {
          const x = ax + (bx - ax) * t / len, z = az + (bz - az) * t / len; if (nrDist(x, z) > 75 || crH(x, z, 31) > 0.5) continue;
          const r0 = 1.2 + crH(x, z, 32) * 2.2, y = Math.max(SEA - 0.6, nrGround(x, z) - r0 * 0.35);
          nrLump(scen.get(x, z), x, y, z, r0, 0.62, vary(rk, R, 0.1), R, 0.25); nR++;
        }
      }
      out.rocks = nR;
    }

    /* ---- the sea to the horizon (the channel and the ocean), the shore band (foam) along the coast near the road ---- */
    {
      const WO = { len: 2.2, amp: 0.7, refl: 0.42, shal: 0.6, lap: 0.6, surf: 0.5 }, g = new THREE.PlaneGeometry(40000, 40000, 1, 1).rotateX(-Math.PI / 2);
      const sea = new THREE.Mesh(g, waterMat(tex, Object.assign({ color: 0x4f93b0 }, WO))); sea.position.set((P.x0 + P.x1) / 2, SEA, (P.z0 + P.z1) / 2); sea.receiveShadow = true; sea.matrixAutoUpdate = false; sea.updateMatrix(); root.add(sea);
      out.dyn.water = tex.water; out.sea = sea;
      for (let z = G.z0; z < G.z0 + (G.nz - 1) * NRC; z += 512) for (let x = G.x0; x < G.x0 + (G.nx - 1) * NRC; x += 512) {
        let near = false; for (const [ax, az] of CO) if (ax >= x - 40 && ax < x + 552 && az >= z - 40 && az < z + 552 && nrDist(ax, az) < 250) { near = true; break; }
        if (!near) continue;
        const i0 = Math.max(1, Math.floor((x - G.x0) / NRC)), j0 = Math.max(1, Math.floor((z - G.z0) / NRC)), i1 = Math.min(G.nx - 2, i0 + 64), j1 = Math.min(G.nz - 2, j0 + 64);
        const band = shoreBand(G.x0 + i0 * NRC, G.z0 + j0 * NRC, G.x0 + i1 * NRC, G.z0 + j1 * NRC, SEA + 0.015, waterline(nrGH, G.x0, G.z0, NRC, i0, i1, j0, j1, SEA), 18, { F: 4 });
        if (band && band.attributes.shore.array.some(v => v <= -1.99) && band.attributes.shore.array.some(v => v >= 9.99)) addShore(root, band, sea.material, WO);
      }
    }

    /* ---- the far land beyond the corridor (200 m cells): the island's town and the coastal bush, a little lower so its edge hides under the near tiles ---- */
    {
      const F = LD.far, bin = atob(F.b64), n = F.n, H = (i, j) => F.lo + bin.charCodeAt(clamp(j, 0, n - 1) * n + clamp(i, 0, n - 1)) * F.step, gf = new GB();
      const colF = (h, x, z) => { const t = clamp(h / 120, 0, 1), k = 0.9 + crH(Math.floor(x / 200), Math.floor(z / 200), 3) * 0.15; return h < SEA + 3 ? [0.9, 0.82, 0.66] : [lerp(0.72, 0.52, t) * k, lerp(0.62, 0.5, t) * k, lerp(0.44, 0.34, t) * k]; };
      // (under the near tiles: a far cell is left out only where the near tiles cover all four of its corners, else the sea shows through the gap)
      const LT = NRC * 32, onT = new Set(); for (let k = 0; k < tiles.length; k += 3) onT.add(tiles[k] + ',' + tiles[k + 1]);
      const inG = (x, z) => x > G.x0 + NRC && x < G.x0 + (G.nx - 2) * NRC && z > G.z0 + NRC && z < G.z0 + (G.nz - 2) * NRC;   // (inside the corridor's grid: the near terrain's own height and colour, so a gap between the near tiles (inside the loop) matches them)
      const inner = (x, z) => onT.has(Math.floor((x - G.x0) / LT) + ',' + Math.floor((z - G.z0) / LT));
      for (let j = 0; j + 1 < n; j++) for (let i = 0; i + 1 < n; i++) {
        const xa = F.x0 + (i + 0.5) * F.cell, za = F.z0 + (j + 0.5) * F.cell, xb = xa + F.cell, zb = za + F.cell;
        if (inner(xa, za) && inner(xb, za) && inner(xa, zb) && inner(xb, zb)) continue;
        const q = (a, b) => { const xx = F.x0 + (a + 0.5) * F.cell, zz = F.z0 + (b + 0.5) * F.cell; return [xx, (inG(xx, zz) ? nrGround(xx, zz) : H(a, b)) - (inner(xx, zz) ? 14 : 2.5), zz]; };
        const A = q(i, j), B2 = q(i + 1, j), C = q(i + 1, j + 1), Dd = q(i, j + 1); if (Math.max(A[1], B2[1], C[1], Dd[1]) < SEA - 0.5) continue;
        const cf = (p) => inG(p[0], p[2]) && p[1] > SEA + 1 ? API.nrGCol(p[0], p[2]).map(c => c * 0.72) : colF(p[1], p[0], p[2]);
        gf.quadUp(A, Dd, C, B2, [cf(A), cf(Dd), cf(C), cf(B2)]);
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

  World.ext.mombasa = (scene, tex, opts) => buildMombasa(scene, tex, opts);
})();
