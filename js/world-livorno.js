/* =========================================================================
   WORLD — Livorno (theme 'livorno'): the old road course of 1922-1930 by Livorno on today's roads (docs/proga-livorno.md). Its own builder
   (World.ext.livorno) in a file of its own, on World's shared corridor helpers (World.api: nrPrep's terrain from the track's dem and land cover,
   as the Nordschleife and Bang Saen) and the scenery data of js/data/livorno.js (OpenStreetMap, Copernicus DEM, ESA WorldCover, Meta / WRI canopy).
   The 60 m rule (the user's decision): the detailed things only within ~60 m of the road, as far as the chase camera sees them: the houses and
   villas of Ardenza, Montenero and Antignano in their OSM footprints (ochre and cream walls, terracotta roofs), the castles and the coastal tower,
   the pines (umbrella and maritime), holm oaks, cypresses and the macchia, the low stone walls along the road, the rocks and the sea by the coast
   road, the railway along the shore, the spectators at the hairpins, in the towns and at the start by the seafront terrace. Farther out only the
   terrain from the heights (the woods as their dark canopy colour), the sea to the horizon, the far hills and the town beyond. Only geographic and
   plain names (no people, events, firms or brands).
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

  // ---- the trees (unit height 1, instanced): 0 an umbrella pine (a tall bare trunk, a wide flat crown), 1 a round crown (holm oak; squat and sunk:
  //      the macchia's bushes; tall and narrow: a maritime pine), 2 a cypress ----
  function lvTreeGeo(kind) {
    const g = new GB(), R = rng(1922 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    const bark = [0.42, 0.32, 0.25], pine = [0.24, 0.38, 0.18], pineD = [0.19, 0.32, 0.15];
    if (kind === 0) {
      cyl(g, 0, -0.02, 0, 0.028, 0.76, 4, bark, null, 0.02);
      ico(g, 0, 0.82, 0, 0.46, 0.3, pine, R, 0.16); nrLump(g, 0.16, 0.88, 0.06, 0.26, 0.4, pineD, R, 0.15);
    } else if (kind === 1) {
      cyl(g, 0, -0.02, 0, 0.035, 0.42, 4, bark, null, 0.026);
      ico(g, 0, 0.64, 0, 0.42, 0.72, [0.25, 0.33, 0.18], R, 0.22);
    } else {
      cyl(g, 0, -0.02, 0, 0.02, 0.12, 4, bark, null, 0.018);
      cone(g, 0, 0.05, 0, 0.12, 0.95, 7, [0.16, 0.27, 0.13], [0.2, 0.32, 0.16], 0.3);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function lvGroundTex() {   // the ground under the vertex colours (256 px = 14 m, tileable): a neutral dusty tone with flecks (the colours are the vertex colours')
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), r = rng(1923), img = x.createImageData(S, S), d = img.data;
    const n1 = valueNoise2(1924, 40), n2 = valueNoise2(1925, 9), wr = (f, i, j) => { const u = i / S, v = j / S; return f(i, j) * (1 - u) * (1 - v) + f(i - S, j) * u * (1 - v) + f(i, j - S) * (1 - u) * v + f(i - S, j - S) * u * v; };
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const o = (j * S + i) * 4, k = 0.78 + wr(n1, i, j) * 0.16 + wr(n2, i, j) * 0.1 + (r() - 0.5) * 0.12;
      d[o] = Math.min(255, 196 * k); d[o + 1] = Math.min(255, 192 * k); d[o + 2] = Math.min(255, 182 * k); d[o + 3] = 255; }
    x.putImageData(img, 0, 0);
    for (let k = 0; k < 500; k++) { const px = r() * S, py = r() * S, g = 80 + r() * 60; x.fillStyle = `rgba(${g},${g + 6},${g - 12},0.35)`; x.fillRect(px, py, 1 + r() * 2, 1 + r() * 2); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  }

  function buildLivorno(scene, tex, opts) {
    const R = rng(1922), N = T.N, ds = T.ds, sStart = T.startS, def = T.def, L = T.len, LD = LV_DATA;
    if (!def.dem) { def.dem = LD.dem; def.lc = LD.lc; }   // (nrPrep reads the corridor's terrain and land cover from the track)
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: nrGround, camFloor: (x, z) => Math.max(nrGround(x, z), SEA), props: [], farClip: true, ownTex: [] };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    const dS = (s) => ((s - sStart) % L + L) % L, sAt = (d) => ((sStart + d) % L + L) % L;
    nrPrep();
    const P = API.NR, G = P.G;
    out.bounds = { minX: P.x0, maxX: P.x1, minZ: P.z0, maxZ: P.z1 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const W1 = [1, 1, 1];
    // what keeps the trees off (the buildings, the crowds, the start), hashed circles
    const eh = new Map(), EHC = 32;
    const exclPush = (x, z, r) => { const e = { x, z, r }; for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); } };
    const excluded = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (const e of Lc) if ((x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; return false; };

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
      if (bd > 25 || bd > 1e8) { const sea = nrDem(x, z) < SEA + 0.6; return (bd > 1e8 ? 200 : bd) * (sea ? 1 : -1); }   // (away from the line its side by the heights: past a piece's end the line's own side is unreliable)
      return bd * bs; };
    // the road on its bridges (over the coves and the streams): the ground under them as the land is, not raised to the road
    const BR = (LD.bridges || []).filter(([a, b]) => b - a > 20).map(([a, b]) => [sAt(a), sAt(b)]);
    const BRC = BR.map(([a, b]) => { const i = T.idx((a + b) / 2); return [T.px[i], T.pz[i], ((b - a) / 2 + 40) ** 2]; });   // (a quick test before nrNear)
    out.cestaRob = BR.map(([a, b]) => [a - 4, (b < a ? b + L : b) + 4, 0]);   // (World.cesta: the asphalt's edge whole on the bridges, between their parapets)
    const underBridge = (n) => { if (n.i < 0 || n.dd > 30) return false; const s = n.i * ds; for (const [a, b] of BR) if (s > a - 6 && s < b + 6) return true; return false; };
    P.pad = (x, z, h) => {
      const sd = seaD(x, z);
      if (sd > 0) h = Math.min(h, SEA - 0.6 - Math.min(sd, 70) * 0.07);   // the sea's floor, deeper away from the shore
      for (const [bx, bz, r2] of BRC) if ((x - bx) ** 2 + (z - bz) ** 2 < r2) { if (underBridge(nrNear(x, z))) h = Math.min(h, Math.max(nrDem(x, z) - 0.5, SEA - 2)); break; }
      return h; };
    // on a bridge the ground is its deck (between the parapets and 1.2 m past them): the boards, the cameras and whatever falls stand on it
    const deckH = (x, z) => { for (const [bx, bz, r2] of BRC) if ((x - bx) ** 2 + (z - bz) ** 2 < r2) { const n = nrNear(x, z); if (!underBridge(n)) return null; const i = n.i, lat = n.lat, hn = n.hn;
      return lat > -(T.bl[i] + 1.2) && lat < T.br[i] + 1.2 ? hn - 0.05 : null; } return null; };
    const groundH = (x, z) => { const g = nrGround(x, z), d = BRC.length ? deckH(x, z) : null; return d != null ? Math.max(g, d) : g; };
    out.groundH = groundH; out.camFloor = (x, z) => Math.max(groundH(x, z), SEA);
    // the ground's colours (the dry Tuscan coast): straw and olive in patches, the macchia, the woods' dark canopy farther out and the needles
    // under the trees near the road, the dust of the towns, the sandstone rocks by the sea and on the steep banks, the sand of the beaches
    P.colFn = (x, z, ny, dd, cov, o) => {
      const m = P.n3(x, z), q = P.n4(x, z), fo = nrLCf(x, z, 1), sc = nrLCf(x, z, 2), se = nrLCf(x, z, 3), sd = seaD(x, z), h = nrDem(x, z);
      let r = 0.84 + (m - 0.5) * 0.22, g = 0.86 + (m - 0.5) * 0.14 + (q - 0.5) * 0.08, b = 0.52 + (q - 0.5) * 0.08;
      const gr = sstep(0.55, 0.85, P.n2(x, z)) * 0.5; r -= gr * 0.18; g -= gr * 0.02; b -= gr * 0.06;   // (greener patches)
      r = lerp(r, 0.62, sc * 0.8); g = lerp(g, 0.66, sc * 0.8); b = lerp(b, 0.42, sc * 0.8);
      const cv = clamp(cov, 0, 1), can = fo * (1 - cv);
      r = lerp(r, 0.34 + m * 0.06, can * 0.92); g = lerp(g, 0.45 + m * 0.05, can * 0.92); b = lerp(b, 0.27, can * 0.92);
      r = lerp(r, 0.6, cv * 0.85); g = lerp(g, 0.53, cv * 0.85); b = lerp(b, 0.4, cv * 0.85);
      const k = 0.96 + (q - 0.5) * 0.12; r = lerp(r, 0.95 * k, se * 0.6); g = lerp(g, 0.92 * k, se * 0.6); b = lerp(b, 0.84 * k, se * 0.6);
      const rk = Math.max(sstep(-40, -6, sd) * (h > 1.5 ? 1 : 0.35), sstep(0.9, 0.66, ny) * 0.95);
      r = lerp(r, 0.8 + q * 0.08, rk); g = lerp(g, 0.68 + q * 0.06, rk); b = lerp(b, 0.54 + q * 0.04, rk);
      if (sd > -16 && h < 2.0) { const t = sstep(-16, -6, sd) * sstep(2.0, 1.1, h); r = lerp(r, 1.12, t); g = lerp(g, 1.04, t); b = lerp(b, 0.84, t); }
      if (dd < 4) { const t = sstep(4, 0.5, dd); r = lerp(r, 0.86, t); g = lerp(g, 0.82, t); b = lerp(b, 0.72, t); }
      o[0] = r; o[1] = g; o[2] = b; return o; };
    const gMat = new THREE.MeshLambertMaterial({ map: ownTex(lvGroundTex()), vertexColors: true });
    const tiles = [];
    for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { const on = nrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; tiles.push(ti, tj, on); }

    /* ---- the verges between the asphalt, the walls and the terrain (lifted onto the ground where it rises) ---- */
    const vergeRow = (i, side) => {
      const w = T.wAt(i), bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i], lift = (o, h) => { const q = side * o, g = nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.06 - y; return [o, Math.max(h, g)]; };
      return [[w, 0.0], [w + 0.8, -0.04], lift(Math.max(w + 1.2, bar - 0.3), -0.08), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)];
    };

    /* ---- the side roads for the look (World.cesta's stranske, LD.side from OpenStreetMap): measured here, before the road and the
       walls, whose edge lines and stone leave the mouths open; the strips (over the verges), the barriers and the paint are built
       with the terrain. Nothing of the track's model changes: the invisible barrier stays on the fence line ---- */
    const PtF = (f, o, y) => { const a = Math.floor(f), t = f - a, i = ((a % N) + N) % N; if (t < 1e-4) return Pt(i, o, y); const p = Pt(i, o, y), q = Pt((i + 1) % N, o, y); return [lerp(p[0], q[0], t), lerp(p[1], q[1], t), lerp(p[2], q[2], t)]; };   // (a point at a fractional station)
    const wF = (f) => { const a = Math.floor(f), i = ((a % N) + N) % N; return lerp(T.wAt(i), T.wAt((i + 1) % N), f - a); };
    const barF = (f, side) => { const a = Math.floor(f), i = ((a % N) + N) % N, j = (i + 1) % N; return side > 0 ? lerp(T.br[i], T.br[j], f - a) : lerp(T.bl[i], T.bl[j], f - a); };
    const edgeL = (f, si) => { const w = wF(f); return si ? [PtF(f, w - 0.38, 0.034), PtF(f, w - 0.22, 0.034)] : [PtF(f, -w + 0.22, 0.034), PtF(f, -w + 0.38, 0.034)]; };   // (an edge line's two points)
    const vergeAt = (i, side, d) => { const pr = vergeRow(i, side); for (let k = 1; k < pr.length; k++) if (d <= pr[k][0]) return lerp(pr[k - 1][1], pr[k][1], clamp((d - pr[k - 1][0]) / (pr[k][0] - pr[k - 1][0] || 1), 0, 1)); return -9; };
    const SC = World.cesta && World.cesta.stranske && LD.side ? World.cesta.stranske(T, LD.side, { tla: nrGround, rob: vergeAt, ton: (i) => 0.84 * secT[i] - 0.04, drzava: 'Italija' }) : null;
    const tek = (si, bit, a, b) => (SC ? SC.tek(si, bit, a, b) : [Array.from({ length: b - a + 1 }, (_, k) => a + k)]);
    if (SC) { for (const u of SC.ustja) out.cestaRob.push(u); for (const k of SC.krogi) exclPush(k[0], k[1], k[2]); out.stranske = SC.n; }

    /* ---- the road: asphalt (resurfaced in sections, darker on the racing line), white edge lines and the centre line by the country's
       rules (World.cesta's crte: white, a dash every 12 m, solid before and through the bends); no kerbs (an old road). In the settlements
       the markings across the road where OpenStreetMap has them on the lap's ways (LD.onRoad): the pedestrian crossings' stripes (no
       centre line through them), the stop lines and the give-way lines' triangles, by the country's rules too (World.cesta's precne), in
       the lines' meshes ---- */
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const RC = 128, tileL = 8, secT = new Float32Array(N), CZ = World.cesta ? World.cesta.crte(T, { r: 140, pred: 40 }) : null, CL = CZ ? CZ.at : null;
    const XM = CZ && World.cesta.precne ? World.cesta.precne(T, CZ, (LD.onRoad || []).map(([d, k, x]) => [sAt(d), k, x]), { rob: 0.38, sred: 0.08 }) : { kosi: [], brez: [] }, xk = new Map(), wx = [0.9, 0.9, 0.86];
    for (const [a, b] of XM.brez) for (let i = Math.ceil(a / ds); i <= Math.floor(b / ds); i++) CL[((i % N) + N) % N] = 0;
    for (const q of XM.kosi) { const c = Math.floor((((Math.floor(Math.min(q[0], q[1]) / ds) % N) + N) % N) / RC); if (!xk.has(c)) xk.set(c, []); xk.get(c).push(q); }
    const PtS = (s, o, y) => { const f = (((s % L) + L) % L) / ds, i0 = Math.floor(f) % N, t = f - Math.floor(f), a = Pt(i0, o, y), b = Pt((i0 + 1) % N, o, y); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
    const layX = (gl, [s0, s1, o0, o1, tri]) => {   // (a piece on the road: a rectangle cut at the samples' rows, as the lines are laid, or a triangle)
      if (tri) { const r0 = gl.row([PtS(s0, o0, 0.034), PtS(s0, o1, 0.034)], [wx, wx]), r1 = gl.row([PtS(s1, (o0 + o1) / 2, 0.034)], [wx]); if (s1 > s0) gl.I.push(r0, r0 + 1, r1); else gl.I.push(r0 + 1, r0, r1); return; }
      const S = [s0]; for (let i = Math.floor(s0 / ds) + 1; i * ds < s1 - 0.05; i++) if (i * ds > s0 + 0.05) S.push(i * ds); S.push(s1);
      let pr = -1; for (const s of S) { const r = gl.row([PtS(s, o0, 0.034), PtS(s, o1, 0.034)], [wx, wx]); if (pr >= 0) gl.link(pr, r, 0, 1); pr = r; }
    };
    for (let i0 = 0, k = 0; i0 < N; k++) { const n = 50 + Math.floor(crH(k, 3, 37) * 70), t = 0.9 + crH(k, 5, 37) * 0.15; for (let i = i0; i < Math.min(N, i0 + n); i++) secT[i] = t; i0 += n; }
    const shade = (i, o, w) => { const rl = T.rl[i]; let k = (0.84 - 0.12 * Math.exp(-((o - rl) * (o - rl)) / 5)) * secT[i]; if (Math.abs(o) > w * 0.9) k -= 0.04; return [k, k, k * 1.02]; };
    for (let c0 = 0; c0 < N; c0 += RC) {
      const gr = new RB(true), gl = new RB(); let pr = -1, pl = -1;
      for (let ii = c0; ii <= Math.min(c0 + RC, N); ii++) {
        const i = ii % N, w = T.wAt(i), offs = [-w, -w / 2, 0, w / 2, w], v = ii * ds / tileL;
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o, w)), offs.map(o => [(o + w) / tileL, v])); if (pr >= 0) gr.link(pr, r, 0, 4); pr = r;
        const cl = CL ? CL[i] : 0;
        if (cl) { const l = gl.row([Pt(i, -0.08, 0.034), Pt(i, 0.08, 0.034)], [wx, wx]); if (pl >= 0) gl.link(pl, l, 0, 1); pl = l; } else pl = -1;   // (the centre line, only on the rows it runs over)
      }
      for (const si of [0, 1]) for (const run of tek(si, 2, c0, Math.min(c0 + RC, N))) {   // (the edge lines, open at the side roads' mouths)
        let p = -1;
        for (const f of run) { const l = gl.row(edgeL(f, si), [wx, wx]); if (p >= 0) gl.link(p, l, 0, 1); p = l; }
      }
      if (SC) for (const [f0, f1, sd] of SC.prekinjena(c0, Math.min(c0 + RC, N))) gl.link(gl.row(edgeL(f0, sd > 0 ? 1 : 0), [wx, wx]), gl.row(edgeL(f1, sd > 0 ? 1 : 0), [wx, wx]), 0, 1);   // (and broken across them)
      for (const q of xk.get(c0 / RC) || []) layX(gl, q);
      addM(gr, aMat); addM(gl, lMat);
    }
    {   // the chequered line on the bridge over the Rio Ardenza
      const gq = new GB(true), i = T.startIdx, w = T.wAt(i), uM = Math.round(w * 2 / 0.8) / 16, HYp = (p) => T.hy[p[3]];
      const a = atSf(sStart - 0.8, -w), b = atSf(sStart - 0.8, w), c = atSf(sStart + 0.8, w), d = atSf(sStart + 0.8, -w);
      gq.quadUp([a[0], HYp(a) + 0.04, a[1]], [b[0], HYp(b) + 0.04, b[1]], [c[0], HYp(c) + 0.04, c[1]], [d[0], HYp(d) + 0.04, d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker }));
    }

    /* ---- the barriers (Core's T.bl / T.br) drawn as the coast's low stone walls; concrete parapets on the bridges; at the start a white wall with
       a catch fence and the crowd behind it ---- */
    const bridgeAt = new Uint8Array(N); for (const [a, b] of BR) for (let s = a - 4; s <= b + 4; s += ds / 2) bridgeAt[T.idx(s)] = 1;
    const startArea = (i) => { const d = dS(i * ds); return d > L - 320 || d < 140; };
    const kindAt = (i) => (bridgeAt[i] ? 2 : startArea(i) ? 1 : 0);   // 0 stone wall, 1 white wall and fence, 2 parapet
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const stone = [0.8, 0.72, 0.6], stoneD = [0.62, 0.55, 0.46], stoneT = [0.86, 0.8, 0.7], wh = [0.92, 0.92, 0.9], whD = [0.74, 0.74, 0.72], par = [0.82, 0.8, 0.76];
    const wallRow = (gr, f, side, k) => {
      const i = ((Math.floor(f) % N) + N) % N, bar = barF(f, side), o = side * (bar + 0.1), o2 = side * (bar + 0.5), h = k === 1 ? 1.15 : k === 2 ? 1.05 : 0.85, tone = 0.92 + crH(i >> 3, side, 71) * 0.16;
      const c0 = k === 1 ? whD : k === 2 ? whD : stoneD.map(v => v * tone), c1 = k === 1 ? wh : k === 2 ? par : stone.map(v => v * tone), c2 = k === 0 ? stoneT : k === 1 ? wh : par;
      let p = [PtF(f, o, -0.5), PtF(f, o, h - 0.08), PtF(f, o, h), PtF(f, o2, h)], c = [c0, c1, c2, c2];
      if (side < 0) { p = p.reverse(); c = c.slice().reverse(); }
      return gr.row(p, c);
    };
    const wallCap = (gr, f, side, k) => {   // (the wall's end at a side road's mouth)
      const bar = barF(f, side), o = side * (bar + 0.1), o2 = side * (bar + 0.5), h = k === 1 ? 1.15 : k === 2 ? 1.05 : 0.85, cA = k === 0 ? stoneD : whD, cB = k === 0 ? stone : k === 1 ? wh : par;
      gr.link(gr.row([PtF(f, o, -0.5), PtF(f, o, h)], [cA, cB]), gr.row([PtF(f, o2, -0.5), PtF(f, o2, h)], [cA, cB]), 0, 1);
    };
    const kindF = (f) => kindAt(((Math.round(f) % N) + N) % N);
    for (let c0 = 0; c0 < N; c0 += RC) {
      const gr = new RB();
      for (const side of [-1, 1]) for (const run of tek(side > 0 ? 1 : 0, 1, c0, Math.min(c0 + RC, N))) {   // (the walls, open at the side roads' mouths)
        let prev = -1, pk = -1;
        for (const f of run) {
          const k = kindF(f);
          if (prev >= 0 && k !== pk) { gr.link(prev, wallRow(gr, f, side, pk), 0, 3); prev = -1; }
          const r = wallRow(gr, f, side, k); if (prev >= 0) gr.link(prev, r, 0, 3); prev = r; pk = k;
        }
        if (run.z0) wallCap(gr, run[0], side, kindF(run[0]));
        if (run.z1) wallCap(gr, run[run.length - 1], side, kindF(run[run.length - 1]));
      }
      addM(gr, rMat, true);
    }
    {   // the catch fence along the start's white walls
      const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide }), gf = new RB(true);
      for (const side of [-1, 1]) { let pr = -1, acc = 0;
        for (let d = -320; d <= 140; d += 2) { const i = T.idx(sAt(d)), bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.15);
          let p = [Pt(i, o, 1.1), Pt(i, o, 3.8)]; if (side < 0) p = p.reverse();
          const r = gf.row(p, [W1, W1], [[acc / 3, 0], [acc / 3, 1]]); if (pr >= 0) gf.link(pr, r, 0, 1); pr = r; acc += 2; } }
      addM(gf, fMat);
    }

    /* ---- scenery chunks (vertex coloured, 128 m) and the spectators ---- */
    const scen = new Chunks(128);
    const CR = crowdCtx({ gH: nrGround, near: (x, z) => nrNear(x, z).dd, maxSlope: 0.7 });
    let nBld = 0, nCast = 0, nLamp = 0, nStop = 0, nPost = 0;
    const BLD = [];   // (the houses that stand: [x, z, half length, half width, cos, sin], for the lamps and the stops)

    /* ---- the buildings (OSM footprints within 60 m): houses and villas in ochre, cream, salmon and white with terracotta roofs, blocks of flats with
       flat roofs, churches with a bell tower, the castles and towers in stone (the landmarks' outlines make the castles of their footprints) ---- */
    const marks = LD.marks.map(([lab, kind, s, d, fl]) => { const pts = []; for (let k = 0; k + 1 < fl.length; k += 2) pts.push([fl[k], fl[k + 1]]); return { lab, kind, s, d, pts }; });
    const castleAt = (x, z) => { for (const m of marks) if ((m.kind === 'castle' || m.kind === 'tower') && Math.abs(m.d) < 150 && m.pts.length > 2 && inPoly(m.pts, x, z)) return m.kind; return null; };
    const WALL = [[0.93, 0.82, 0.6], [0.96, 0.9, 0.76], [0.92, 0.77, 0.62], [0.97, 0.95, 0.9], [0.9, 0.74, 0.56], [0.95, 0.87, 0.7], [0.9, 0.84, 0.74]];
    const ROOF = [[0.7, 0.36, 0.24], [0.64, 0.31, 0.22], [0.76, 0.42, 0.28], [0.68, 0.4, 0.3]];
    const SHUT = [[0.24, 0.38, 0.26], [0.35, 0.3, 0.22], [0.5, 0.55, 0.5]];
    const crenel = (g, x, y, z, Lx, Wz, ang, col) => {   // the battlements round a flat top
      const c = Math.cos(ang), s = Math.sin(ang);
      for (const [lx, lz, len, alongX] of [[0, Wz / 2, Lx, 1], [0, -Wz / 2, Lx, 1], [Lx / 2, 0, Wz, 0], [-Lx / 2, 0, Wz, 0]]) {
        const n = Math.max(2, Math.round(len / 1.6));
        for (let k = 0; k < n; k++) { const t = (k + 0.5) / n - 0.5, ax = alongX ? lx + t * len : lx, az = alongX ? lz : lz + t * len;
          box(g, x + c * ax - s * az, y, z + s * ax + c * az, 0.7, 0.8, 0.7, ang, col, null, true); } }
    };
    for (const [bx, bz, Lb, Wb, ang, Hb, k0] of LD.bld) {
      const ca = Math.cos(ang), sa = Math.sin(ang), corners = [[Lb / 2, Wb / 2], [Lb / 2, -Wb / 2], [-Lb / 2, Wb / 2], [-Lb / 2, -Wb / 2]].map(([a, b]) => [bx + ca * a - sa * b, bz + sa * a + ca * b]);
      let clash = false, y0 = 1e9, sea = false; for (const [cx, cz] of corners.concat([[bx, bz]])) { const n = nrNear(cx, cz); if (n.i >= 0 && n.dd < 1.2) clash = true; y0 = Math.min(y0, nrGround(cx, cz)); if (seaD(cx, cz) > 2) sea = true; }
      if (clash || sea || Lb < 2.2 || Wb < 2.2) continue;
      const g = scen.get(bx, bz), hk = crH(bx, bz, 11), area = Lb * Wb, ck = castleAt(bx, bz);
      const kind = ck === 'castle' ? 3 : ck === 'tower' ? 2 : k0 === 0 && area > 240 ? 9 : k0;
      nBld++; CR.block(bx, bz, Lb, Wb, ang); BLD.push([bx, bz, Lb / 2, Wb / 2, ca, sa]);
      if (kind === 3 || kind === 2 || kind === 8) {   // stone: a castle block, a tower, a ruin
        const sc = vary([0.74, 0.66, 0.55], R, 0.08), hh = kind === 2 ? Math.max(Hb, 13 + hk * 5) : kind === 3 ? Math.max(Hb, 9 + hk * 4) : 2.5 + hk * 2;
        box(g, bx, y0 - 0.5, bz, Lb, hh + 0.5, Wb, ang, sc, vary(sc, R, 0.05), true);
        if (kind !== 8) crenel(g, bx, y0 + hh, bz, Lb - 0.4, Wb - 0.4, ang, sc);
        nCast++; exclPush(bx, bz, Math.max(Lb, Wb) / 2 + 4);
      } else if (kind === 1) {   // a church: cream walls, a terracotta gable, a bell tower at one end
        const hh = Hb || 9 + hk * 3, wc = vary([0.94, 0.88, 0.76], R, 0.04), rc = ROOF[0];
        box(g, bx, y0 - 0.5, bz, Lb, hh + 0.5, Wb, ang, wc, null, true); gable(g, bx, y0 + hh, bz, Lb + 0.4, Wb + 0.4, Math.min(3.5, Wb * 0.3), ang, rc, wc);
        const tx = bx + ca * (Lb / 2 - 1.8), tz = bz + sa * (Lb / 2 - 1.8), th = hh + 8; box(g, tx, y0 - 0.5, tz, 3.4, th + 0.5, 3.4, ang, wc, null, true); cone(g, tx, y0 + th, tz, 2.3, 2.6, 4, rc, rc, ang + Math.PI / 4);
        exclPush(bx, bz, Math.max(Lb, Wb) / 2 + 3);
      } else if (kind === 9 || kind === 5 || kind === 6) {   // flats, shops, a school: three to five floors, a flat roof with its parapet
        const fl = kind === 9 ? 3 + Math.floor(hk * 3) : 2 + Math.floor(hk * 2), hh = Hb || fl * 3.1, wc = vary(WALL[Math.floor(crH(bx, bz, 12) * WALL.length)], R, 0.05);
        box(g, bx, y0 - 0.5, bz, Lb, hh + 0.5, Wb, ang, wc, vary([0.72, 0.68, 0.62], R, 0.05), true);
        box(g, bx, y0 + hh, bz, Lb, 0.5, Wb, ang, wc.map(v => v * 0.92), [0.66, 0.6, 0.54]);
        for (let f = 1; f <= Math.round(hh / 3.1); f++) box(g, bx, y0 + f * 3.1 - 1.8, bz, Lb + 0.05, 0.9, Wb + 0.05, ang, SHUT[Math.floor(crH(bx, bz, 13) * SHUT.length)].map(v => v * 0.75), null, true);   // (the rows of windows and shutters)
        exclPush(bx, bz, Math.max(Lb, Wb) / 2 + 2);
      } else {   // a house or a villa: two floors (one if small), a terracotta roof, its shutters
        const small = area < 45 || kind === 4 || kind === 7, hh = Hb || (small ? 3 + hk : 5.8 + hk * 1.6), wc = kind === 7 ? [0.86, 0.9, 0.88] : vary(WALL[Math.floor(crH(bx, bz, 12) * WALL.length)], R, 0.05);
        box(g, bx, y0 - 0.5, bz, Lb, hh + 0.5, Wb, ang, wc, null, true);
        if (!small) box(g, bx, y0 + hh * 0.55, bz, Lb + 0.04, 1.1, Wb + 0.04, ang, SHUT[Math.floor(crH(bx, bz, 13) * SHUT.length)], null, true);
        gable(g, bx, y0 + hh, bz, Lb + 0.6, Wb + 0.6, Math.min(2.6, Wb * 0.24), ang, ROOF[Math.floor(crH(bx, bz, 14) * ROOF.length)], wc);
        exclPush(bx, bz, Math.max(Lb, Wb) / 2 + 2);
      }
    }
    // the sanctuary on the hill above Montenero (445 m from the road: one simple building for the view, no details)
    for (const m of marks) if (m.kind === 'sanctuary' && m.pts.length > 2) {
      let cx = 0, cz = 0; for (const [x, z] of m.pts) { cx += x; cz += z; } cx /= m.pts.length; cz /= m.pts.length;
      const y = nrGround(cx, cz), g = scen.get(cx, cz), ang = 0.35, wc = [0.95, 0.9, 0.78];
      box(g, cx, y - 1, cz, 34, 15, 14, ang, wc, null, true); gable(g, cx, y + 14, cz, 34.6, 14.6, 4.5, ang, ROOF[0], wc);
      box(g, cx + Math.cos(ang) * 19, y - 1, cz + Math.sin(ang) * 19, 5, 29, 5, ang, wc, null, true); cone(g, cx + Math.cos(ang) * 19, y + 28, cz + Math.sin(ang) * 19, 3.3, 4, 4, ROOF[0], ROOF[0], ang + Math.PI / 4);
      ico(g, cx - Math.cos(ang) * 6, y + 17, cz - Math.sin(ang) * 6, 5, 0.8, [0.6, 0.55, 0.5], R, 0.02);
    }

    /* ---- the railway along the shore (Antignano to Romito, where it runs within 60 m): ballast, two rails, the catenary's masts; the railway's
       bridge over the road in Ardenza ---- */
    {
      const bal = [0.58, 0.54, 0.5], rl = [0.36, 0.33, 0.3];
      for (const [brg, tun, fl] of LD.rail) {
        if (tun) continue;
        const pts = []; for (let k = 0; k + 1 < fl.length; k += 2) pts.push([fl[k], fl[k + 1]]);
        let acc = 0;
        for (let k = 0; k + 1 < pts.length; k++) {
          const [ax, az] = pts[k], [bx, bz] = pts[k + 1], len = Math.hypot(bx - ax, bz - az); if (len < 0.5) continue;
          const mx = (ax + bx) / 2, mz = (az + bz) / 2; if (nrDist(mx, mz) > 62) { acc += len; continue; }
          const ang = Math.atan2(bz - az, bx - ax), y = nrGround(mx, mz), g = scen.get(mx, mz);
          box(g, mx, y - 0.3, mz, len + 0.2, 0.62, 3.2, ang, bal, null, true);
          for (const o of [-0.72, 0.72]) box(g, mx - Math.sin(ang) * o, y + 0.32, mz + Math.cos(ang) * o, len + 0.1, 0.16, 0.08, ang, rl, null, true);
          for (let t = (50 - acc % 50) % 50; t < len; t += 50) { const px = ax + (bx - ax) * t / len - Math.sin(ang) * 2.6, pz = az + (bz - az) * t / len + Math.cos(ang) * 2.6, py = nrGround(px, pz);
            box(g, px, py - 0.2, pz, 0.25, 6.8, 0.25, ang, [0.6, 0.62, 0.64]); box(g, px + Math.sin(ang) * 1.3, py + 6.1, pz - Math.cos(ang) * 1.3, 0.12, 0.12, 2.8, ang, [0.6, 0.62, 0.64]); exclPush(px, pz, 1.5); }
          acc += len;
        }
      }
      for (const [x, z] of def.brU || []) {   // the railway over the road at Ardenza Terra: a steel deck on stone abutments
        const i = T.nearestIdx(x, z), hd = T.hd[i], cx = T.px[i], cz = T.pz[i], y = T.hy[i], span = T.bl[i] + T.br[i] + 6, off = (T.br[i] - T.bl[i]) / 2, g = scen.get(cx, cz);
        const mx = cx + T.nx[i] * off, mz = cz + T.nz[i] * off;
        box(g, mx, y + 5.4, mz, 9, 1.2, span, hd, [0.36, 0.38, 0.4], [0.5, 0.48, 0.44]);
        for (const sd of [-1, 1]) { const o = sd > 0 ? T.br[i] + 2.2 : -(T.bl[i] + 2.2), px = cx + T.nx[i] * o, pz = cz + T.nz[i] * o; box(g, px, y - 0.6, pz, 10, 6.6, 3.2, hd, [0.72, 0.64, 0.52], null, true); }
        exclPush(mx, mz, span / 2 + 6);
      }
    }

    /* ---- the road's bridges over the coves and the streams: a stone deck under the road and its verges, piers down to the ground every ~25 m ---- */
    for (const [a, b] of BR) {
      const gd = new RB(), dk = [0.72, 0.68, 0.6], dkD = [0.56, 0.52, 0.46]; let pr = -1;
      for (let s = a - 3; s <= b + 3.01; s += 2) { const i = T.idx(s), er = T.br[i] + 1.0, el = T.bl[i] + 1.0;
        const r = gd.row([Pt(i, er, -0.05), Pt(i, er, -1.6), Pt(i, -el, -1.6), Pt(i, -el, -0.05)], [dk, dkD, dkD, dk]); if (pr >= 0) gd.link(pr, r, 0, 3); pr = r; }
      addM(gd, rMat, true);
      for (let s = a + 12; s < b - 8; s += 25) { const i = T.idx(s), x = T.px[i], z = T.pz[i], gy = nrGround(x, z), top = T.hy[i] - 1.6; if (top - gy < 2) continue;
        box(scen.get(x, z), x, gy - 0.5, z, 2.6, top - gy + 0.5, Math.min(T.bl[i], T.br[i]) * 2, T.hd[i], dkD, null, true); }
    }

    /* ---- the start: a banner over the road on two masts at the line (no words), flags along the walls; the crowd behind the fences ---- */
    {
      const [x, z, h, i] = atS(sStart, 0), gy = T.hy[i], g = scen.get(x, z), span = Math.max(T.bl[i], T.br[i]) + 1.2, nx = T.nx[i], nz = T.nz[i];
      for (const sd of [-1, 1]) box(g, x + nx * span * sd, gy - 0.3, z + nz * span * sd, 0.5, 7.6, 0.5, h, [0.86, 0.86, 0.84]);
      box(g, x, gy + 6.2, z, 0.3, 1.3, span * 2 - 0.6, h, [0.92, 0.9, 0.86], [0.75, 0.2, 0.18]);
      box(g, x, gy + 6.0, z, 0.32, 0.2, span * 2 - 0.4, h, [0.75, 0.2, 0.18]);
      exclPush(x, z, span + 4);
      const FL = [[0.85, 0.15, 0.13], [0.95, 0.95, 0.93], [0.18, 0.5, 0.25], [0.95, 0.78, 0.15], [0.2, 0.35, 0.75]];
      for (let d = -300; d < 130; d += 18) for (const side of [-1, 1]) {
        const ii = T.idx(sAt(d)), o = side * ((side > 0 ? T.br[ii] : T.bl[ii]) + 1.6), px = T.px[ii] + T.nx[ii] * o, pz = T.pz[ii] + T.nz[ii] * o, py = nrGround(px, pz), gg = scen.get(px, pz);
        if (seaD(px, pz) > -1) continue; CR.avoid(px, pz, 0.45);
        cyl(gg, px, py, pz, 0.06, 6, 5, [0.86, 0.86, 0.88]); API.flags.add(px, py + 5.6, pz, T.hd[ii], [FL[Math.floor(crH(d, side, 5) * FL.length)]], 1.2, 0.8);   // (waving: js/world-zastave.js)
      }
    }
    let nFans = 0;
    {   // the crowd: deep at the start and along the seafront, rows at the hairpins, by the castle in Antignano and in the streets of Ardenza
      const runs = [[-300, 120, 3, 0.55], [-900, -320, 2, 0.22]];
      const at = { 'Ardenza Terra': [60, 2, 0.4], 'Montenero': [60, 2, 0.4], 'Lasnice Savolano': [520, 2, 0.45], 'Stolp Castellaccio': [70, 2, 0.4], 'Castellaccio': [80, 2, 0.45],
        'Vzhodna lasnica': [80, 3, 0.5], 'Lasnici nad Romitom': [320, 2, 0.45], 'Romito': [60, 2, 0.4], 'Calafuria': [90, 2, 0.4], 'Grad Antignano': [110, 3, 0.55] };
      for (const q of T.names) { const a = at[q.n]; if (a) runs.push([q.d - 40, q.d + a[0], a[1], a[2]]); }
      const okSide = (s, side) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 2.5), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; return seaD(x, z) < -3; };
      for (const [a, b, rows, dens] of runs) for (const side of [-1, 1]) {
        for (let s0 = a; s0 < b; s0 += 30) { const s1 = Math.min(b, s0 + 30); if (!okSide(sAt((s0 + s1) / 2), side)) continue;
          nFans += crowdRun(CR, sAt(s0), sAt(s0) + (s1 - s0), side, { rows, dens, first: 1.0, excluded }); }
      }
    }

    /* ---- the trees, within 60 m of the road only: umbrella and maritime pines, holm oaks and cypresses in the woods (pines by the sea, more oaks up
       on the hills), the macchia's bushes on the scrub, garden trees between the houses, umbrella pines in the park by the seafront terrace,
       OSM's single trees (cypresses, olives); the ground under the crowns turns to needles and leaf litter (G.cov) ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const WIND = { value: 0 }; out.dyn.wind = WIND;
    tMat.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = WIND;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
        '#ifdef USE_INSTANCING\nfloat wPh = instanceMatrix[3].x * 0.07 + instanceMatrix[3].z * 0.05;\n#else\nfloat wPh = 0.0;\n#endif\n' +
        'float wK = position.y * position.y * 0.018;\ntransformed.x += wK * sin( uWind * 1.1 + wPh );\ntransformed.z += wK * 0.6 * sin( uWind * 0.83 + wPh * 1.7 );');
    };
    tMat.customProgramCacheKey = () => 'lvTreeWind';
    const TK = [new IChunks(lvTreeGeo(0), tMat, 256), new IChunks(lvTreeGeo(1), tMat, 256), new IChunks(lvTreeGeo(2), tMat, 256)];
    const terrace = marks.find(m => m.kind === 'terrace');
    let nTrees = 0;
    const NEAR = 60;
    const plant = (sp, x, z, hgt, wid, c) => {   // sp: 0 umbrella pine, 1 holm oak, 2 cypress, 3 maritime pine (a tall narrow crown), 4 a bush (sunk)
      const y = nrGround(x, z) - 0.1, rot = crH(x, z, 21) * TAU;
      if (sp === 4) TK[1].add(x, y - 0.42 * hgt, z, rot, wid * 1.3, hgt * 1.3, c);
      else if (sp === 3) TK[0].add(x, y, z, rot, wid, hgt, c);
      else TK[sp].add(x, y, z, rot, wid, hgt, c);
      nrShade(x, z, wid * (sp === 2 ? 0.12 : sp === 4 ? 0.4 : 0.42), sp === 4 ? 0.6 : 1); nTrees++; };
    {
      const Lt = NRC * 32, maxT = Math.round(60000 * (opts.density || 1));
      for (let tj = 0; tj < G.ntz && nTrees < maxT; tj++) for (let ti = 0; ti < G.ntx && nTrees < maxT; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt; zz += 6.5) for (let xx = xa; xx < xa + Lt; xx += 6.5) {
          const x = xx + (crH(xx, zz, 22) - 0.5) * 5.6, z = zz + (crH(xx, zz, 23) - 0.5) * 5.6, rd = nrDist(x, z);
          if (rd > NEAR) continue;
          const cl = nrLC(x, z), h1 = crH(x, z, 24), park = terrace && inPoly(terrace.pts, x, z);
          const p = park ? 0.3 : cl === 1 ? 0.86 : cl === 2 ? 0.5 : cl === 3 ? 0.07 : 0.025;
          if (h1 > p) continue;
          const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 3) continue;
          if (excluded(x, z) || seaD(x, z) > -2) continue;
          const hq = crH(x, z, 25), hs = crH(x, z, 26), cv = 0.86 + crH(x, z, 27) * 0.28, col = [cv * (0.95 + hq * 0.1), cv, cv * (0.94 + hs * 0.1)];
          const coastal = seaD(x, z) > -450 || nrGround(x, z) < 70;
          let sp;
          if (park) sp = 0;
          else if (cl === 1) sp = coastal ? (hs < 0.38 ? 0 : hs < 0.62 ? 3 : hs < 0.92 ? 1 : 2) : (hs < 0.12 ? 0 : hs < 0.5 ? 3 : hs < 0.95 ? 1 : 2);
          else if (cl === 2) sp = hs < 0.7 ? 4 : hs < 0.85 ? 1 : 3;
          else if (cl === 3) sp = hs < 0.4 ? 0 : hs < 0.7 ? 2 : 1;
          else sp = hs < 0.5 ? 0 : hs < 0.8 ? 1 : 2;
          const hgt = sp === 0 ? 11 + hq * 7 : sp === 3 ? 13 + hq * 7 : sp === 1 ? 6.5 + hq * 4.5 : sp === 2 ? 10 + hq * 6 : 1.3 + hq * 1.6;
          const wid = sp === 0 ? hgt * (0.8 + hs * 0.2) : sp === 3 ? hgt * 0.5 : sp === 1 ? hgt * (0.9 + hs * 0.2) : sp === 2 ? hgt * 0.17 : hgt * 1.2;
          if (nn.i >= 0 && nn.dd < 3 + wid * 0.3 && sp !== 4) continue;   // (no crown over the walls)
          plant(sp, x, z, hgt, wid, col);
        }
      }
      for (const [x, z, k] of LD.trees) {   // OSM's single trees
        const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 2.5) continue; if (excluded(x, z)) continue;
        const hq = crH(x, z, 28), sp = k === 'c' ? 2 : k === 'p' ? 0 : 1, hgt = sp === 2 ? 10 + hq * 5 : sp === 0 ? 12 + hq * 5 : 6 + hq * 4, wid = sp === 2 ? hgt * 0.17 : sp === 0 ? hgt * 0.85 : hgt * 0.9;
        plant(sp, x, z, hgt, wid, [0.95, 1, 0.95]);
      }
    }
    for (const t of TK) t.addTo(root, true);

    /* ---- the stone walls and hedges of OSM by the road (within 30 m): a low wall or a hedge along each line ---- */
    for (const [k, fl] of LD.walls) {
      if (k > 2) continue;
      for (let q = 0; q + 3 < fl.length; q += 2) {
        const ax = fl[q], az = fl[q + 1], bx = fl[q + 2], bz = fl[q + 3], len = Math.hypot(bx - ax, bz - az); if (len < 0.6) continue;
        const mx = (ax + bx) / 2, mz = (az + bz) / 2, nn = nrNear(mx, mz); if (nn.i >= 0 && nn.dd < 0.8) continue;
        const y = nrGround(mx, mz), ang = Math.atan2(bz - az, bx - ax), g = scen.get(mx, mz);
        if (k === 2) box(g, mx, y - 0.2, mz, len + 0.3, 1.6, 1.1, ang, vary([0.26, 0.36, 0.2], R, 0.08), [0.3, 0.42, 0.22], true);
        else box(g, mx, y - 0.4, mz, len + 0.2, k === 1 ? 1.6 : 1.3, 0.45, ang, vary(stone, R, 0.06), stoneT, true);
      }
    }

    /* ---- the rocks along the shore within 60 m of the road (sandstone boulders where the land meets the sea) ---- */
    {
      const rk = [0.78, 0.68, 0.55]; let nR = 0;
      for (const [ax, az, bx, bz] of CO) {
        const len = Math.hypot(bx - ax, bz - az);
        for (let t = 0; t < len; t += 3.5) {
          const x = ax + (bx - ax) * t / len, z = az + (bz - az) * t / len; if (nrDist(x, z) > 75 || crH(x, z, 31) > 0.8) continue;
          const r0 = 1.4 + crH(x, z, 32) * 2.8, y = Math.max(SEA - 0.6, nrGround(x, z) - r0 * 0.35);
          nrLump(scen.get(x, z), x, y, z, r0, 0.62, vary(rk, R, 0.1), R, 0.25); nR++;
        }
      }
      out.rocks = nR;
    }

    /* ---- the sea to the horizon, the shore band (foam) along the coast near the road ---- */
    {
      const WO = { len: 2.4, amp: 1.1, refl: 0.42, shal: 0.6, lap: 0.8, surf: 0.7 }, g = new THREE.PlaneGeometry(40000, 40000, 1, 1).rotateX(-Math.PI / 2);
      const sea = new THREE.Mesh(g, waterMat(tex, Object.assign({ color: 0x5b97b8 }, WO))); sea.position.set(P.x0 - 12000, SEA, (P.z0 + P.z1) / 2); sea.receiveShadow = true; sea.matrixAutoUpdate = false; sea.updateMatrix(); root.add(sea);
      out.dyn.water = tex.water; out.sea = sea;
      for (let z = G.z0; z < G.z0 + (G.nz - 1) * NRC; z += 512) for (let x = G.x0; x < G.x0 + (G.nx - 1) * NRC; x += 512) {   // (in 512 m blocks where the coast comes within 250 m of the road: each its own mesh, out of sight not drawn)
        let near = false; for (const [ax, az] of CO) if (ax >= x - 40 && ax < x + 552 && az >= z - 40 && az < z + 552 && nrDist(ax, az) < 250) { near = true; break; }
        if (!near) continue;
        const i0 = Math.max(1, Math.floor((x - G.x0) / NRC)), j0 = Math.max(1, Math.floor((z - G.z0) / NRC)), i1 = Math.min(G.nx - 2, i0 + 64), j1 = Math.min(G.nz - 2, j0 + 64);
        const band = shoreBand(G.x0 + i0 * NRC, G.z0 + j0 * NRC, G.x0 + i1 * NRC, G.z0 + j1 * NRC, SEA + 0.015, waterline(nrGH, G.x0, G.z0, NRC, i0, i1, j0, j1, SEA), 18, { F: 4 });
        if (band && band.attributes.shore.array.some(v => v <= -1.99)) addShore(root, band, sea.material, WO);   // (only a band with a shore in it: reaching 2 m in under the land; no ring of foam round a speck of rock)
      }
    }

    /* ---- the far land beyond the corridor (200 m cells, ±12 km): the hills and the town, a little lower so its edge hides under the near tiles ---- */
    {
      const F = LD.far, bin = atob(F.b64), n = F.n, H = (i, j) => F.lo + bin.charCodeAt(clamp(j, 0, n - 1) * n + clamp(i, 0, n - 1)) * F.step, gf = new GB();
      const colF = (h, x, z) => { const t = clamp(h / 300, 0, 1), k = 0.9 + crH(Math.floor(x / 200), Math.floor(z / 200), 3) * 0.15; return h < SEA + 3 ? [0.82, 0.76, 0.62] : [lerp(0.5, 0.3, t) * k, lerp(0.52, 0.42, t) * k, lerp(0.38, 0.26, t) * k]; };
      const inner = (x, z) => x > P.x0 + 200 && x < P.x1 - 200 && z > P.z0 + 200 && z < P.z1 - 200 && nrDist(x, z) < 560;
      for (let j = 0; j + 1 < n; j++) for (let i = 0; i + 1 < n; i++) {
        const x = F.x0 + (i + 1) * F.cell, z = F.z0 + (j + 1) * F.cell; if (inner(x, z)) continue;
        const q = (a, b) => { const xx = F.x0 + (a + 0.5) * F.cell, zz = F.z0 + (b + 0.5) * F.cell; return [xx, H(a, b) - (inner(xx, zz) ? 14 : 2.5), zz]; };
        const A = q(i, j), B2 = q(i + 1, j), C = q(i + 1, j + 1), Dd = q(i, j + 1); if (Math.max(A[1], B2[1], C[1], Dd[1]) < SEA - 0.5) continue;
        gf.quadUp(A, Dd, C, B2, [colF(A[1], A[0], A[2]), colF(Dd[1], Dd[0], Dd[2]), colF(C[1], C[0], C[2]), colF(B2[1], B2[0], B2[2])]);
      }
      const fm = addM(gf, matV); if (fm) fm.castShadow = false;
    }

    /* ---- the terrain tiles and the verges (256 m chunks), coloured now: the needles under the trees ---- */
    let nTiles = 0;
    {
      const grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let k = 0; k < tiles.length; k += 3) { const m = new THREE.Mesh(nrTileGeo(tiles[k], tiles[k + 1], tiles[k + 2] === 1 ? 1 : 4), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); nTiles++; }
      const vg = [0.94, 0.9, 0.74], dirt = [0.98, 0.86, 0.7];
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
        if (SC) SC.robovi(gv, c0, Math.min(c0 + RC, N), API.nrGCol);
        addM(gv, gMat);
      }
      if (SC) {   // (the side roads' strips, the orange posts across their openings in the wall and the paint)
        const sMat = aMat.clone();
        for (const g of SC.asfalt(RB, API.nrGCol)) { const m = addM(g, sMat); if (m) m.userData.stranska = 1; }
        nPost = SC.predmeti((x, z) => scen.get(x, z)); out.stebricki = SC.stebricki;   // (where the posts stand: read by the tests)
      }
      {   // (OSM's street lamps and bus stops, for the look: behind the fence, off the side roads and the houses, not by a bridge or in the sea)
        const inB = (x, z, m) => { for (const b of BLD) { const dx = x - b[0], dz = z - b[1]; if (Math.abs(dx * b[4] + dz * b[5]) < b[2] + m && Math.abs(dz * b[4] - dx * b[5]) < b[3] + m) return true; } return false; };
        const onS = (x, z, m) => { if (SC) for (const k of SC.krogi) { const r = k[2] - 1.2 + m; if ((x - k[0]) ** 2 + (z - k[1]) ** 2 < r * r) return true; } return false; };
        const spot = (x, z, m) => { const n = nrNear(x, z); return n.i >= 0 && n.dd >= 0.6 + m && !underBridge(n) && seaD(x, z) < -0.5 && !onS(x, z, m) && !inB(x, z, 0.3 + m); };
        const LP = [];
        for (const [lx, lz] of LD.lamps || []) {
          const n = nrNear(lx, lz); if (n.i < 0) continue;
          const i = n.i, sg = n.lat < 0 ? -1 : 1; let x = lx, z = lz, ok = false;
          if (n.dd < 0.9) { const o = sg * ((sg > 0 ? T.br[i] : T.bl[i]) + 1.0); x = T.px[i] + T.nx[i] * o; z = T.pz[i] + T.nz[i] * o; }   // (one that would stand inside the fence goes behind it: 0.6 m or so, less on the inside of a bend)
          for (let k = 0; k < 6 && !(ok = spot(x, z, 0)); k++) { x -= sg * T.nx[i] * 0.5; z -= sg * T.nz[i] * 0.5; }   // (out of a house: towards the road)
          if (!ok || LP.some(q => (q[0] - x) ** 2 + (q[1] - z) ** 2 < 36)) continue;
          LP.push([x, z]); World.cesta.svetilka(scen.get(x, z), x, nrGround(x, z), z, Math.atan2(-sg * T.nz[i], -sg * T.nx[i])); nLamp++;
        }
        for (const [sd, side, dist, shel] of LD.stops || []) {
          for (const k of [0, 3, -3, 6, -6, 9, -9]) {   // (off a side road's mouth: a few metres along the road)
            const i = T.idx(sAt(sd) + k * ds), o = side * Math.max(dist, (side > 0 ? T.br[i] : T.bl[i]) + (shel ? 1.3 : 1.0)), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
            if (!spot(x, z, shel ? 0.3 : 0) || (shel && !(spot(x + T.tx[i] * 1.8, z + T.tz[i] * 1.8, 0) && spot(x - T.tx[i] * 1.8, z - T.tz[i] * 1.8, 0)))) continue;
            World.cesta.postaja(scen.get(x, z), x, nrGround(x, z), z, Math.atan2(-side * T.nz[i], -side * T.nx[i]), shel); nStop++; break;
          }
        }
      }
      G.col = G.cov = P.edge = null;   // (build only)
    }

    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    crowdFinish(CR, root, out);
    out.stats = { tiles: nTiles, trees: nTrees, buildings: nBld, stone: nCast, lamps: nLamp, stops: nStop, mouthPosts: nPost, fans: nFans, rocks: out.rocks };   // (read by the tests)
    return out;
  }

  World.ext.livorno = (scene, tex, opts) => buildLivorno(scene, tex, opts);
})();
