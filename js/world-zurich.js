/* =========================================================================
   WORLD — Zürich (theme 'zurich'): a city race from the lake of Zürich up the hill (docs/proge/zurich.md). Its own builder (World.ext.zurich) in a
   file of its own, on World's shared corridor helpers (World.api: nrPrep's terrain from the track's dem and land cover, as Livorno) and the
   scenery data of js/data/zurich.js (OpenStreetMap, Copernicus DEM, ESA WorldCover, Meta / WRI canopy).
   The 60 m rule: the detailed things only within ~60 m of the road, as far as the chase camera sees them: the town's tall houses in their OSM
   footprints (pastel plaster, window rows, steep brown roofs) from the lake up the hill, the church with the slim spire, a small church, the
   opera house, the art museum and the theatre, the stone quay of the lake, the lime trees, the lamps, the tram's rails and overhead line where
   OSM's trams run, the concrete blocks and catch fences of a street race, boats along the quay. Farther out only the terrain, the lake to the horizon and
   the far hills. Only geographic and plain names (no people, events, firms or brands).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, NRC, RB, TAU, addShore, atS, atSf, box, clamp, cone, crH, crowdCtx, crowdFinish, crowdRun, cyl, gable, hjCutMat,
    ico, inPoly, lerp, nrDem, nrDist, nrGH, nrGround, nrLC, nrLCf, nrNear, nrPrep, nrShade, nrTileGeo, nrTileOn, rng, shoreBand,
    sstep, valueNoise2, vary, waterMat, waterline
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });
  const LAKE = 0;   // the lake's and the Limmat's level: the track's heights are metres above the lake (405.9 m)

  // ---- the trees (unit height 1, instanced): 0 a lime (a round crown on a clear trunk), 1 a plane or chestnut (wider, flatter) ----
  function zhTreeGeo(kind) {
    const g = new GB(), R = rng(1218 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    const bark = [0.38, 0.33, 0.28];
    if (kind === 0) { cyl(g, 0, -0.02, 0, 0.03, 0.4, 4, bark, null, 0.024); ico(g, 0, 0.64, 0, 0.36, 0.95, [0.3, 0.42, 0.2], R, 0.2); }
    else { cyl(g, 0, -0.02, 0, 0.035, 0.36, 4, bark, null, 0.028); ico(g, 0, 0.62, 0, 0.46, 0.7, [0.27, 0.39, 0.19], R, 0.22); }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function zhGroundTex() {   // the paving under the vertex colours (256 px = 14 m, tileable): grey setts and slabs with flecks
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), r = rng(1219), img = x.createImageData(S, S), d = img.data;
    const n1 = valueNoise2(1220, 40), wr = (f, i, j) => { const u = i / S, v = j / S; return f(i, j) * (1 - u) * (1 - v) + f(i - S, j) * u * (1 - v) + f(i, j - S) * (1 - u) * v + f(i - S, j - S) * u * v; };
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const o = (j * S + i) * 4, gx = i % 8, gz = (j + (Math.floor(i / 8) % 2) * 4) % 8, joint = gx === 0 || gz === 0;
      const k = (joint ? 0.8 : 0.88 + crH(Math.floor(i / 8), Math.floor((j + (Math.floor(i / 8) % 2) * 4) / 8), 7) * 0.07) + wr(n1, i, j) * 0.08 + (r() - 0.5) * 0.05;
      d[o] = Math.min(255, 200 * k); d[o + 1] = Math.min(255, 198 * k); d[o + 2] = Math.min(255, 194 * k); d[o + 3] = 255; }
    x.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  }
  const flat2 = (fl) => { const p = []; for (let k = 0; k + 1 < fl.length; k += 2) p.push([fl[k], fl[k + 1]]); return p; };
  function obb(pts) {   // the oriented box of a footprint along its longest wall
    let bl = 0, ba = 0, cx = 0, cz = 0; for (const p of pts) { cx += p[0]; cz += p[1]; } cx /= pts.length; cz /= pts.length;
    for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > bl) { bl = l; ba = Math.atan2(b[1] - a[1], b[0] - a[0]); } }
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; const c = Math.cos(ba), s = Math.sin(ba);
    for (const p of pts) { const u = (p[0] - cx) * c + (p[1] - cz) * s, v = -(p[0] - cx) * s + (p[1] - cz) * c; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    return { x: cx + c * (u0 + u1) / 2 - s * (v0 + v1) / 2, z: cz + s * (u0 + u1) / 2 + c * (v0 + v1) / 2, L: u1 - u0, W: v1 - v0, ang: ba, c, s };
  }

  function buildZurich(scene, tex, opts) {
    const R = rng(1218), N = T.N, ds = T.ds, sStart = T.startS, def = T.def, L = T.len, ZD = ZH_DATA;
    if (!def.dem) { def.dem = ZD.dem; def.lc = ZD.lc; }   // (nrPrep reads the corridor's terrain and land cover from the track)
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: nrGround, camFloor: (x, z) => Math.max(nrGround(x, z), LAKE), props: [], farClip: true, ownTex: [] };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    const dS = (s) => ((s - sStart) % L + L) % L, sAt = (d) => ((sStart + d) % L + L) % L;
    nrPrep();
    const P = API.NR, G = P.G;
    out.bounds = { minX: P.x0, maxX: P.x1, minZ: P.z0, maxZ: P.z1 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) }, uA: { value: new THREE.Vector4(0, 0, -1e6, 1) }, uB: { value: new THREE.Vector4(0, 0, -1e6, 1) } };   // (hjCutMat: what of a building hides the car or the road just ahead of it on the screen fades)
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const W1 = [1, 1, 1];
    const eh = new Map(), EHC = 32;   // what keeps the trees off (the buildings, the start, the landmarks), hashed circles
    const exclPush = (x, z, r) => { const e = { x, z, r }; for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); } };
    const excluded = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (const e of Lc) if ((x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; return false; };

    /* ---- the water (the Limmat, the lake, the moat): a 2 m mask of OSM's rings and the distance to their edges (+ on the water) ---- */
    const DM = ZD.dem, MC = 2, MX0 = DM.x0, MZ0 = DM.z0, MNX = Math.ceil(DM.nx * DM.cell / MC), MNZ = Math.ceil(DM.nz * DM.cell / MC), mask = new Uint8Array(MNX * MNZ);
    const RINGS = ZD.water.map(([nm, fl]) => flat2(fl));
    for (const pts of RINGS) for (let j = 0; j < MNZ; j++) {   // (each ring filled on its own: the Limmat's and the lake's overlap stays water)
      const z = MZ0 + (j + 0.5) * MC, xs = [];
      for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) { const [xa, za] = pts[a], [xb, zb] = pts[b]; if ((za > z) !== (zb > z)) xs.push(xa + (z - za) / (zb - za) * (xb - xa)); }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) { const i0 = Math.max(0, Math.ceil((xs[k] - MX0) / MC - 0.5)), i1 = Math.min(MNX - 1, Math.floor((xs[k + 1] - MX0) / MC - 0.5)); for (let i = i0; i <= i1; i++) mask[j * MNX + i] = 1; }
    }
    const isWater = (x, z) => { const i = Math.floor((x - MX0) / MC), j = Math.floor((z - MZ0) / MC); return i >= 0 && j >= 0 && i < MNX && j < MNZ ? mask[j * MNX + i] === 1 : nrDem(x, z) < LAKE - 0.5; };
    const ED = [], CH = 32, chash = new Map();   // the shore edges (an edge with water on both sides is no shore: where the river meets the lake)
    for (const pts of RINGS) for (let k = 0; k < pts.length; k++) { const [ax, az] = pts[k], [bx, bz] = pts[(k + 1) % pts.length], len = Math.hypot(bx - ax, bz - az); if (len < 0.05 || len > 80) continue;
      const mx = (ax + bx) / 2, mz = (az + bz) / 2, nx = -(bz - az) / len, nz = (bx - ax) / len;
      const w1 = isWater(mx + nx * 3, mz + nz * 3), w2 = isWater(mx - nx * 3, mz - nz * 3); if (w1 === w2) continue;
      ED.push([ax, az, bx, bz, w1 ? -1 : 1]); }   // (the last: the land's side along the normal, +1 = +n)
    ED.forEach((e, n) => { const x0 = Math.floor(Math.min(e[0], e[2]) / CH), x1 = Math.floor(Math.max(e[0], e[2]) / CH), z0 = Math.floor(Math.min(e[1], e[3]) / CH), z1 = Math.floor(Math.max(e[1], e[3]) / CH);
      for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) { const k = i + ',' + j; let Lc = chash.get(k); if (!Lc) chash.set(k, Lc = []); Lc.push(n); } });
    const edgeD = (x, z) => {
      let bd = 1e9; const i0 = Math.floor(x / CH), j0 = Math.floor(z / CH);
      for (let r = 0; r <= 3 && bd > r * CH - CH; r++) for (let i = i0 - r; i <= i0 + r; i++) for (let j = j0 - r; j <= j0 + r; j++) {
        if (Math.max(Math.abs(i - i0), Math.abs(j - j0)) !== r) continue; const Lc = chash.get(i + ',' + j); if (!Lc) continue;
        for (const k of Lc) { const [ax, az, bx, bz] = ED[k], vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1), 0, 1), d = Math.hypot(x - ax - vx * t, z - az - vz * t); if (d < bd) bd = d; } }
      return Math.min(bd, 120); };
    const seaD = (x, z) => edgeD(x, z) * (isWater(x, z) ? 1 : -1);
    // the road on its bridges (none on this lap: kept for the data's bridges): the ground under them the water's floor
    const BR = (ZD.bridges || []).filter(([a, b]) => b - a > 20).map(([a, b]) => [sAt(a), sAt(b)]);
    const BRC = BR.map(([a, b]) => { const i = T.idx((a + b) / 2); return [T.px[i], T.pz[i], ((b - a) / 2 + 40) ** 2]; });
    const onBridgeS = (s) => { for (const [a, b] of BR) if (s > a - 6 && s < b + 6) return true; return false; };
    const underBridge = (n) => n.i >= 0 && n.dd <= 30 && onBridgeS(n.i * ds);
    P.pad = (x, z, h) => { if (isWater(x, z)) h = Math.min(h, LAKE - 1.8 - Math.min(edgeD(x, z), 40) * 0.04); return h; };
    const deckH = (x, z) => { for (const [bx, bz, r2] of BRC) if ((x - bx) ** 2 + (z - bz) ** 2 < r2) { const n = nrNear(x, z); if (!underBridge(n)) return null; const i = n.i, lat = n.lat, hn = n.hn;
      return lat > -(T.bl[i] + 1.2) && lat < T.br[i] + 1.2 ? hn - 0.05 : null; } return null; };
    const groundH = (x, z) => { const g = nrGround(x, z), d = BRC.length ? deckH(x, z) : null; return d != null ? Math.max(g, d) : g; };
    out.groundH = groundH; out.camFloor = (x, z) => Math.max(groundH(x, z), LAKE);
    // the ground's colours: the town's grey-beige paving, the lawns of the parks and under the limes, the quays' stone
    P.colFn = (x, z, ny, dd, cov, o) => {
      const m = P.n3(x, z), q = P.n4(x, z), fo = nrLCf(x, z, 1), pk = nrLCf(x, z, 2), se = nrLCf(x, z, 3);
      let r = 0.84 + (m - 0.5) * 0.08, g = 0.82 + (m - 0.5) * 0.08, b = 0.76 + (q - 0.5) * 0.06;
      const gr = clamp(pk * 0.9 + fo * 0.6 - se * 0.3, 0, 1) * (1 - clamp(cov, 0, 1) * 0.4);
      r = lerp(r, 0.46 + m * 0.08, gr); g = lerp(g, 0.6 + m * 0.06, gr); b = lerp(b, 0.32, gr);
      if (dd < 6) { const t = sstep(6, 1, dd); r = lerp(r, 0.8, t); g = lerp(g, 0.79, t); b = lerp(b, 0.76, t); }
      o[0] = r; o[1] = g; o[2] = b; return o; };
    const gTex = ownTex(zhGroundTex()), gMat = new THREE.MeshLambertMaterial({ map: gTex, vertexColors: true });
    const tiles = [];
    for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { const on = nrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; tiles.push(ti, tj, on); }

    /* ---- the road: asphalt in sections, white edge lines, the two tram tracks in it ---- */
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const RC = 128, tileL = 8, secT = new Float32Array(N);
    for (let i0 = 0, k = 0; i0 < N; k++) { const n = 30 + Math.floor(crH(k, 3, 41) * 50), t = 0.9 + crH(k, 5, 41) * 0.14; for (let i = i0; i < Math.min(N, i0 + n); i++) secT[i] = t; i0 += n; }
    const shade = (i, o, w) => { const rl = T.rl[i]; let k = (0.8 - 0.1 * Math.exp(-((o - rl) * (o - rl)) / 5)) * secT[i]; if (Math.abs(o) > w * 0.9) k -= 0.04; return [k, k, k * 1.02]; };
    const RAIL = [-2.32, -0.88, 0.88, 2.32];   // (two tracks of 1 m gauge, their centres 3.2 m apart)
    const tramI = new Uint8Array(N); for (const [a, b] of (ZD.tram || [])) for (let d = a; d <= b; d += ds * 0.5) tramI[T.idx(sAt(d))] = 1;   // (the samples with the tram's rails: OSM's tram tracks)
    for (let c0 = 0; c0 < N; c0 += RC) {
      const gr = new RB(true), gl = new RB(); let pr = -1, pl = -1, pt = -1;
      for (let ii = c0; ii <= Math.min(c0 + RC, N); ii++) {
        const i = ii % N, w = T.wAt(i), offs = [-w, -w / 2, 0, w / 2, w], v = ii * ds / tileL;
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o, w)), offs.map(o => [(o + w) / tileL, v])); if (pr >= 0) gr.link(pr, r, 0, 4); pr = r;
        const wl = [0.9, 0.9, 0.86], l = gl.row([Pt(i, -w + 0.22, 0.034), Pt(i, -w + 0.36, 0.034), Pt(i, w - 0.36, 0.034), Pt(i, w - 0.22, 0.034)], [wl, wl, wl, wl]);
        if (pl >= 0) { gl.link(pl, l, 0, 1); gl.link(pl, l, 2, 3); } pl = l;
        const rc = [0.5, 0.49, 0.47], rp = [], rcs = []; if (tramI[i]) for (const o of RAIL) { rp.push(Pt(i, o - 0.05, 0.03), Pt(i, o + 0.05, 0.03)); rcs.push(rc, rc); }
        if (tramI[i]) { const t = gl.row(rp, rcs); if (pt >= 0) for (let k = 0; k < 8; k += 2) gl.link(pt, t, k, k + 1); pt = t; } else pt = -1;
      }
      addM(gr, aMat); addM(gl, lMat);
    }
    {   // the chequered line on the Utoquai
      const gq = new GB(true), i = T.startIdx, w = T.wAt(i), uM = Math.round(w * 2 / 0.8) / 16, HYp = (p) => T.hy[p[3]];
      const a = atSf(sStart - 0.8, -w), b = atSf(sStart - 0.8, w), c = atSf(sStart + 0.8, w), d = atSf(sStart + 0.8, -w);
      gq.quadUp([a[0], HYp(a) + 0.04, a[1]], [b[0], HYp(b) + 0.04, b[1]], [c[0], HYp(c) + 0.04, c[1]], [d[0], HYp(d) + 0.04, d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker }));
    }

    /* ---- the barriers (Core's T.bl / T.br): the concrete blocks of a street race, 2 m each in two greys, red and white on the bends; the catch
       fence over them all the way round ---- */
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const CON = [0.74, 0.74, 0.72], COND = [0.58, 0.58, 0.57], RED = [0.78, 0.18, 0.16], WHT = [0.92, 0.92, 0.9];
    const bend = new Uint8Array(N); for (let i = 0; i < N; i++) { const a = T.hd[i], b = T.hd[(i + 4) % N]; let d = Math.abs(b - a); if (d > Math.PI) d = TAU - d; if (d > 0.22) for (let k = -6; k <= 10; k++) bend[(i + k + N) % N] = 1; }
    for (let c0 = 0; c0 < N; c0 += RC) {
      const gr = new RB();
      for (const side of [-1, 1]) for (let ii = c0; ii < Math.min(c0 + RC, N); ii++) {
        const i = ii % N, j = (ii + 1) % N, s0 = ii * ds, blk = Math.floor(s0 / 2) % 2, bi = side > 0 ? T.br[i] : T.bl[i], bj = side > 0 ? T.br[j] : T.bl[j];
        const top = bend[i] ? (blk ? RED : WHT) : (blk ? CON : CON.map(v => v * 0.93)), face = bend[i] ? top : (blk ? COND : COND.map(v => v * 0.95));
        let p = [Pt(i, side * (bi + 0.1), -0.4), Pt(i, side * (bi + 0.1), 0.82), Pt(i, side * (bi + 0.6), 0.82)], q = [Pt(j, side * (bj + 0.1), -0.4), Pt(j, side * (bj + 0.1), 0.82), Pt(j, side * (bj + 0.6), 0.82)];
        if (side < 0) { p = p.reverse(); q = q.reverse(); }
        const c = side < 0 ? [top, face, face] : [face, face, top];
        const ra = gr.row(p, c), rb = gr.row(q, c); gr.link(ra, rb, 0, 2);
      }
      addM(gr, rMat, true);
    }
    {
      const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
      for (let c0 = 0; c0 < N; c0 += RC) { const gf = new RB(true);
        for (const side of [-1, 1]) { let pr = -1;
          for (let ii = c0; ii <= Math.min(c0 + RC, N); ii++) { const i = ii % N, bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.35), acc = ii * ds;
            let p = [Pt(i, o, 0.8), Pt(i, o, 3.4)]; if (side < 0) p = p.reverse();
            const r = gf.row(p, [W1, W1], [[acc / 3, 0], [acc / 3, 1]]); if (pr >= 0) gf.link(pr, r, 0, 1); pr = r; } }
        addM(gf, fMat); }
    }

    /* ---- the verges between the asphalt, the blocks and the pavements (paving, lifted onto the ground where it rises) ---- */
    const vergeRow = (i, side) => {
      const w = T.wAt(i), bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i], lift = (o, h) => { const q = side * o, g = nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.06 - y; return [o, Math.max(h, g)]; };
      return [[w, 0.0], [w + 0.6, 0.0], lift(Math.max(w + 0.9, bar - 0.2), 0.0), lift(bar + 0.8, 0.0), lift(bar + 3.0, -0.12)];
    };

    const scen = new Chunks(192);
    const CR = crowdCtx({ gH: nrGround, near: (x, z) => nrNear(x, z).dd, maxSlope: 0.5 });
    let nBld = 0, nMark = 0;

    /* ---- the quays: stone walls along the Limmat and the lake within ~90 m of the road, a paved strip behind them over the terrain's slope ---- */
    let nQuay = 0; const quayStrips = [];   // (the paving behind the quay walls: built with the terrain tiles, in their colours)
    {
      const st = [0.7, 0.67, 0.6], stD = [0.56, 0.53, 0.48], cop = [0.8, 0.78, 0.74], gq = new Chunks(256);
      for (const [ax, az, bx, bz, ls] of ED) {
        const mx = (ax + bx) / 2, mz = (az + bz) / 2; if (nrDist(mx, mz) > 90) continue;
        const nm = nrNear(mx, mz); if (underBridge(nm) && nm.dd < 2) continue;
        const len = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / len * ls, nz = (bx - ax) / len * ls;   // (n toward the land)
        const yl = (x, z) => Math.max(1.0, nrGround(x + nx * 9, z + nz * 9)) + 0.04;
        const ya = yl(ax, az), yb = yl(bx, bz), g = gq.get(mx, mz);
        const ia = [ax - nx * 0.4, az - nz * 0.4], ib = [bx - nx * 0.4, bz - nz * 0.4], inside = [mx + nx * 4, -5, mz + nz * 4];
        g.quadO([ia[0], -2.2, ia[1]], [ib[0], -2.2, ib[1]], [ib[0], yb, ib[1]], [ia[0], ya, ia[1]], vary(stD, R, 0.04), inside, null, [stD, stD, st, st]);
        const nA = nrNear(ax, az), nB = nrNear(bx, bz), wA = clamp(Math.min(9, nA.dd - 0.8), 0, 9), wB = clamp(Math.min(9, nB.dd - 0.8), 0, 9);
        if (wA > 0.5 || wB > 0.5) { const q4 = [[ia[0], ya, ia[1]], [ia[0] + nx * wA, ya, ia[1] + nz * wA], [ib[0] + nx * wB, yb, ib[1] + nz * wB], [ib[0], yb, ib[1]]];   // (in the ground's own paving and colour)
          quayStrips.push(q4); }
        box(g, mx - nx * 0.2, Math.min(ya, yb) - 0.05, mz - nz * 0.2, len + 0.1, 0.75 + Math.abs(ya - yb), 0.5, Math.atan2(bz - az, bx - ax), stD, cop);   // (a low parapet)
        nQuay++;
      }
      gq.addTo(root, matV, true, true);
    }

    /* ---- the road's bridges: a stone-grey deck under the road and its verges, piers in the water every ~22 m ---- */
    for (const [a, b] of BR) {
      const gd = new RB(), dk = [0.7, 0.68, 0.64], dkD = [0.5, 0.49, 0.47]; let pr = -1;
      for (let s = a - 3; s <= b + 3.01; s += 2) { const i = T.idx(s), er = T.br[i] + 1.0, el = T.bl[i] + 1.0;
        const r = gd.row([Pt(i, er, -0.05), Pt(i, er, -1.4), Pt(i, -el, -1.4), Pt(i, -el, -0.05)], [dk, dkD, dkD, dk]); if (pr >= 0) gd.link(pr, r, 0, 3); pr = r; }
      addM(gd, rMat, true);
      for (let s = a + 11; s < b - 6; s += 22) { const i = T.idx(s), x = T.px[i], z = T.pz[i], top = T.hy[i] - 1.4;
        box(scen.get(x, z), x, -2.4, z, 2.2, top + 2.4, (T.bl[i] + T.br[i]) * 0.9, T.hd[i], dkD, null, true); }
    }
    // the other bridges of OSM over the river (the streets and footbridges): a deck along the line, a parapet each side
    for (const [hw, , wd, brg, fl] of ZD.roads) {
      if (!brg) continue; const pts = flat2(fl); if (pts.length < 2) continue;
      if (!pts.some(([x, z]) => isWater(x, z)) && !isWater((pts[0][0] + pts[pts.length - 1][0]) / 2, (pts[0][1] + pts[pts.length - 1][1]) / 2)) continue;
      const foot = /foot|path|cycle/.test(hw), W = parseFloat(wd) || (foot ? 4 : 12), y0 = Math.max(1.5, nrGround(...pts[0])), y1 = Math.max(1.5, nrGround(...pts[pts.length - 1]));
      let tot = 0; for (let k = 0; k + 1 < pts.length; k++) tot += Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]);
      let acc = 0;
      for (let k = 0; k + 1 < pts.length; k++) {
        const [ax, az] = pts[k], [bx, bz] = pts[k + 1], len = Math.hypot(bx - ax, bz - az); if (len < 0.5) continue;
        const mx = (ax + bx) / 2, mz = (az + bz) / 2, nn = nrNear(mx, mz); acc += len; if (nn.i >= 0 && nn.dd < 1) continue;
        const y = lerp(y0, y1, (acc - len / 2) / (tot || 1)), ang = Math.atan2(bz - az, bx - ax), g = scen.get(mx, mz);
        box(g, mx, y - 1.2, mz, len + 0.3, 1.2, W, ang, [0.56, 0.55, 0.53], [0.44, 0.43, 0.42]);
        for (const sd of [-1, 1]) box(g, mx - Math.sin(ang) * sd * W / 2, y, mz + Math.cos(ang) * sd * W / 2, len + 0.3, 1.0, 0.35, ang, [0.66, 0.65, 0.62], null, true);
        if (isWater(mx, mz) && crH(mx, mz, 3) < 0.5) box(g, mx, -2.4, mz, 2, y + 1.2, W * 0.8, ang, [0.52, 0.51, 0.49], null, true);
      }
    }

    const facC = new Chunks(256, true), gplain = new Chunks(256), roofs = new Chunks(256);   // (the walls with windows, the plain ground floors, the roofs)
    /* ---- the landmarks: built from their OSM outlines (the town's own houses inside them left out) ---- */
    const marks = ZD.marks.map(([lab, kind, s, d, fl]) => ({ lab, kind, s, d, pts: flat2(fl) })).filter(m => m.pts.length > 2);
    const inMark = (x, z) => marks.some(m => m.kind !== 'park' && inPoly(m.pts, x, z));
    const COPPER = [0.38, 0.6, 0.5], TILEB = [0.5, 0.3, 0.22], SLATE = [0.32, 0.33, 0.36];
    const tower = (g, x, y, z, sz, h, ang, col) => box(g, x, y - 1, z, sz, h + 1, sz, ang, col, null, true);
    for (const m of marks) {
      if (m.kind === 'park') continue;
      const o = obb(m.pts), g = scen.get(o.x, o.z), y = Math.min(...m.pts.map(([x, z]) => isWater(x, z) ? -2 : nrGround(x, z))) - 0.3, lab = m.lab;
      const end = (t) => [o.x + o.c * o.L / 2 * t, o.z + o.s * o.L / 2 * t];   // (t = ±1: either end along the long axis)
      // the tower stands at the end nearer the road
      const nE = nrDist(...end(1)) < nrDist(...end(-1)) ? 1 : -1;
      nMark++; exclPush(o.x, o.z, Math.max(o.L, o.W) / 2 + 3);
      if (/vitkim zvonikom/.test(lab)) {   // the church with the slim spire: a pale nave, a tall square tower, a green copper spire
        box(g, o.x, y, o.z, o.L, 17, o.W, o.ang, [0.88, 0.86, 0.8], null, true); gable(g, o.x, y + 17, o.z, o.L + 0.4, o.W + 0.4, Math.min(8, o.W * 0.4), o.ang, SLATE, [0.88, 0.86, 0.8]);
        const [tx, tz] = end(nE * 0.86); tower(g, tx, y, tz, 6.5, 38, o.ang, [0.86, 0.84, 0.78]); cone(g, tx, y + 38, tz, 4.4, 24, 4, COPPER, COPPER, o.ang + Math.PI / 4);
      } else if (/ob reki|Majhna cerkev/.test(lab)) {   // a small church: a late-Gothic hall, a ridge turret
        box(g, o.x, y, o.z, o.L, 12, o.W, o.ang, [0.86, 0.82, 0.74], null, true); gable(g, o.x, y + 12, o.z, o.L + 0.4, o.W + 0.4, Math.min(7, o.W * 0.5), o.ang, TILEB, [0.86, 0.82, 0.74]);
        cone(g, o.x, y + 12 + Math.min(7, o.W * 0.5) - 0.5, o.z, 1.2, 7, 6, COPPER, COPPER, 0);
      } else {   // the opera house, the art museum, the theatre: a pale block with a shallow roof
        const fac = facC.get(o.x, o.z); wallsOf(fac, m.pts, y, 20, [0.94, 0.92, 0.86], 4.6, false);
        box(g, o.x, y + 20, o.z, o.L * 0.96, 2.5, o.W * 0.96, o.ang, [0.5, 0.56, 0.54], [0.45, 0.52, 0.5]);
      }
    }

    /* ---- the buildings (OSM within 140 m): the town's tall houses and the shops, plaster in pastels with rows of windows
       (tex.facade), a stone-coloured ground floor, steep brown tile roofs (copper or slate now and then); the big blocks flat roofed ---- */
    function wallsOf(g, pts, y0, H, col, bay, shop) {
      const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cz = pts.reduce((a, p) => a + p[1], 0) / pts.length, inside = [cx, y0 + H / 2, cz], G0 = shop ? 4.2 : 0;
      const base = col.map(v => v * 0.78), fl = (H - G0) / 3.3;
      for (let k = 0; k < pts.length; k++) {
        const a = pts[k], b = pts[(k + 1) % pts.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.4) continue;
        const bays = Math.max(1, Math.round(len / bay));
        if (shop) gplain.get(cx, cz).quadO([a[0], y0 - 0.5, a[1]], [b[0], y0 - 0.5, b[1]], [b[0], y0 + G0, b[1]], [a[0], y0 + G0, a[1]], base, inside);
        g.quadO([a[0], y0 + G0, a[1]], [b[0], y0 + G0, b[1]], [b[0], y0 + H, b[1]], [a[0], y0 + H, a[1]], col, inside, [[0, 0], [bays, 0], [bays, Math.max(1, Math.round(fl))], [0, Math.max(1, Math.round(fl))]]);
      }
    }
    const PAL = [[0.96, 0.92, 0.84], [0.94, 0.88, 0.76], [0.92, 0.84, 0.74], [0.9, 0.9, 0.86], [0.86, 0.88, 0.84], [0.96, 0.86, 0.8], [0.88, 0.84, 0.8], [0.95, 0.94, 0.9], [0.84, 0.86, 0.9], [0.92, 0.8, 0.66]];
    const RF = [[0.48, 0.27, 0.2], [0.42, 0.24, 0.19], [0.54, 0.32, 0.24], [0.46, 0.3, 0.26], [0.35, 0.36, 0.38], [0.38, 0.56, 0.48]];
    const outOf = new Map(ZD.out.map(([k, fl]) => [k, flat2(fl)]));
    const BH = new Map(), BHC = 24;   // the footprints built, hashed (where the street trees and the poles may not stand)
    const bhPush = (pts) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      for (let a = Math.floor(x0 / BHC); a <= Math.floor(x1 / BHC); a++) for (let b = Math.floor(z0 / BHC); b <= Math.floor(z1 / BHC); b++) { const k = a + ',' + b; let Lc = BH.get(k); if (!Lc) BH.set(k, Lc = []); Lc.push(pts); } };
    const inBld = (x, z) => { const Lc = BH.get(Math.floor(x / BHC) + ',' + Math.floor(z / BHC)); if (!Lc) return false; for (const p of Lc) if (inPoly(p, x, z)) return true; return false; };
    const freeAt = (x, z, r) => !inBld(x, z) && !inBld(x + r, z) && !inBld(x - r, z) && !inBld(x, z + r) && !inBld(x, z - r) && !isWater(x, z);
    ZD.bld.forEach(([bx, bz, Lb, Wb, ang, Hb, kind], n) => {
      if (inMark(bx, bz) || isWater(bx, bz)) return;
      const ca = Math.cos(ang), sa = Math.sin(ang);
      let pts = outOf.get(n) || [[Lb / 2, Wb / 2], [-Lb / 2, Wb / 2], [-Lb / 2, -Wb / 2], [Lb / 2, -Wb / 2]].map(([a, b]) => [bx + ca * a - sa * b, bz + sa * a + ca * b]);
      // a house that reaches over the race's barriers (the street race is wider than the street): cut back along the road, 1 m behind the barrier
      let cut = false;
      for (let it = 0; it < 4 && pts.length > 2; it++) {
        let worst = null;
        for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.ceil(len / 3));
          for (let q = 0; q < m; q++) { const x = a[0] + (b[0] - a[0]) * q / m, z = a[1] + (b[1] - a[1]) * q / m, nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 1 && (!worst || nn.dd < worst.dd)) worst = nn; } }
        if (!worst) break;
        const i = worst.i, sd = worst.lat >= 0 ? 1 : -1, keep = (sd > 0 ? T.br[i] : T.bl[i]) + 1.2, f = (p) => ((p[0] - T.px[i]) * T.nx[i] + (p[1] - T.pz[i]) * T.nz[i]) * sd - keep, o2 = [];
        for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length], fa = f(a), fb = f(b);
          if (fa >= 0) o2.push(a); if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); o2.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } }
        pts = o2; cut = true;
      }
      let ar = 0; for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length]; ar += a[0] * b[1] - b[0] * a[1]; }
      if (pts.length < 3 || Math.abs(ar) / 2 < 20 || Lb < 2.5 || Wb < 2.5) return;
      let y0 = 1e9; for (const [cx, cz] of pts) y0 = Math.min(y0, nrGround(cx, cz));
      const hk = crH(bx, bz, 11), area = Lb * Wb, small = kind === 4 || area < 30;
      const H = Hb > 3 ? Hb : small ? 3.5 + hk * 2 : kind === 5 ? 18 + hk * 6 : kind === 6 ? 16 + hk * 6 : kind === 1 ? 14 : 13 + hk * 6;
      const col = vary(PAL[Math.floor(crH(bx, bz, 12) * PAL.length)], R, 0.04), shop = !small && (kind === 5 || nrDist(bx, bz) < 30);
      y0 -= 0.2; wallsOf(facC.get(bx, bz), pts, y0, H, col, kind === 5 ? 4.2 : 3.4, shop);
      const o = outOf.has(n) || cut ? obb(pts) : { x: bx, z: bz, L: Lb, W: Wb, ang };
      const big = area > 900 || kind === 5 && area > 500, rg = roofs.get(bx, bz);
      if (big) { const rc = [0.5, 0.5, 0.5]; box(rg, o.x, y0 + H - 0.2, o.z, o.L * 0.98, 0.8, o.W * 0.98, o.ang, col.map(v => v * 0.9), rc); box(rg, o.x, y0 + H + 0.6, o.z, o.L * 0.7, 2.6, o.W * 0.7, o.ang, [0.44, 0.45, 0.46], [0.4, 0.4, 0.42]); }
      else { const rc = RF[Math.floor(crH(bx, bz, 14) * (crH(bx, bz, 15) < 0.85 ? 4 : RF.length))]; gable(rg, o.x, y0 + H, o.z, o.L + 0.5, o.W + 0.5, Math.min(8, o.W * (0.38 + hk * 0.12)), o.ang, rc, col); }
      bhPush(pts); CR.block(o.x, o.z, o.L, o.W, o.ang); exclPush(o.x, o.z, Math.max(o.L, o.W) / 2 + 1.5); nBld++;
    });
    const facMat = hjCutMat(new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true }), cut), matB = hjCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    facC.addTo(root, facMat, true, true); gplain.addTo(root, matB, true, true); roofs.addTo(root, matB, true, true);

    /* ---- the other streets within 60 m: asphalt ribbons on the paving (cut away inside the race's barriers) ---- */
    {
      const gs = new Chunks(256), asp = [0.44, 0.44, 0.45];
      for (const [hw, lanes, wd, brg, fl] of ZD.roads) {
        if (brg || /foot|path|cycle|steps|pedestrian|track/.test(hw)) continue;
        const pts = flat2(fl), W = (parseFloat(wd) || (hw === 'service' ? 4 : hw === 'residential' ? 6 : 8.5)) / 2, lift = 0.05 + (crH(pts[0][0], pts[0][1], 4)) * 0.02;
        for (let k = 0; k + 1 < pts.length; k++) {
          const [ax, az] = pts[k], [bx, bz] = pts[k + 1], len = Math.hypot(bx - ax, bz - az); if (len < 0.2) continue;
          const tx = (bx - ax) / len, tz = (bz - az) / len, nx = -tz * W, nz = tx * W;
          for (let t = 0; t < len; t += 3) { const t1 = Math.min(len, t + 3.2), x0 = ax + tx * t, z0 = az + tz * t, x1 = ax + tx * t1, z1 = az + tz * t1, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
            if (nrDist(mx, mz) > 70 || isWater(mx, mz)) continue; const nn = nrNear(mx, mz); if (nn.i >= 0 && nn.dd < W + 0.5) continue;
            const y = (x, z) => nrGround(x, z) + lift, A = [x0 + nx, 0, z0 + nz], B2 = [x0 - nx, 0, z0 - nz], C = [x1 - nx, 0, z1 - nz], D = [x1 + nx, 0, z1 + nz];
            for (const p of [A, B2, C, D]) p[1] = y(p[0], p[2]);
            gs.get(mx, mz).quadUp(A, B2, C, D, [asp, asp, asp, asp]); }
        }
      }
      gs.addTo(root, matV, false, true);
    }

    /* ---- the start: a gantry over the road with its five lights (no words); the crowd behind the fences, few ---- */
    {
      const [x, z, h, i] = atS(sStart, 0), gy = T.hy[i], g = scen.get(x, z), span = Math.max(T.bl[i], T.br[i]) + 1.0, nx = T.nx[i], nz = T.nz[i];
      for (const sd of [-1, 1]) box(g, x + nx * span * sd, gy - 0.3, z + nz * span * sd, 0.5, 7.4, 0.5, h, [0.3, 0.3, 0.32]);
      box(g, x, gy + 6.0, z, 0.6, 1.2, span * 2, h, [0.22, 0.22, 0.24]);
      for (let k = -2; k <= 2; k++) box(g, x + nx * k * 1.1 - T.tx[i] * 0.32, gy + 6.25, z + nz * k * 1.1 - T.tz[i] * 0.32, 0.1, 0.7, 0.7, h, [0.7, 0.08, 0.06]);
      exclPush(x, z, span + 4);
    }
    let nFans = 0;
    {
      const runs = [[-120, 60, 2, 0.4]];
      const at = { 'Paradeplatz': [50, 1, 0.3], 'Bellevue': [60, 1, 0.3], 'Srednji most': [40, 1, 0.3] };
      for (const q of T.names) { const a = at[q.n]; if (a) runs.push([q.d - 30, q.d + a[0], a[1], a[2]]); }
      const okSide = (s, side) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 2.5); return !isWater(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) && !onBridgeS(s); };
      for (const [a, b, rows, dens] of runs) for (const side of [-1, 1]) for (let s0 = a; s0 < b; s0 += 30) { const s1 = Math.min(b, s0 + 30); if (!okSide(sAt((s0 + s1) / 2), side)) continue;
        nFans += crowdRun(CR, sAt(s0), sAt(s0) + (s1 - s0), side, { rows, dens, first: 1.0, excluded }); }
    }

    /* ---- the lamps of OSM within 60 m: dark green posts with a lantern ---- */
    for (const [x, z] of ZD.lamps) { if (nrDist(x, z) > 60 || isWater(x, z)) continue; const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 0.8) continue;
      const y = nrGround(x, z), g = scen.get(x, z); cyl(g, x, y, z, 0.09, 5, 5, [0.2, 0.26, 0.22]); box(g, x, y + 5, z, 0.4, 0.6, 0.4, 0, [0.9, 0.88, 0.76], [0.2, 0.26, 0.22]); CR.avoid(x, z, 0.4); }

    /* ---- the trams' overhead line: a pair of grey poles every ~34 m behind the fences, the span wire across the road and the two contact wires
       along it (thin: seen against the sky from the chase camera) ---- */
    let nPole = 0;
    {
      const pc = [0.42, 0.44, 0.45], wc = [0.16, 0.16, 0.17], HP = 7.2, HW = 6.3, poles = [];
      for (let d = 14; d < L - 10; d += 34) {
        const s0 = sAt(d), i = T.idx(s0); if (onBridgeS(s0) || bend[i] || !tramI[i]) { poles.push(null); continue; }
        const pp = []; for (const side of [-1, 1]) { const o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 1.3), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; pp.push(freeAt(x, z, 0.6) ? [x, z, o] : null); }
        if (!pp[0] || !pp[1]) { poles.push(null); continue; }
        const g = scen.get(T.px[i], T.pz[i]), y = T.hy[i];
        for (const [x, z] of pp) { cyl(g, x, nrGround(x, z) - 0.2, z, 0.14, HP + 0.2, 6, pc, pc); CR.avoid(x, z, 0.5); exclPush(x, z, 1.2); nPole++; }
        box(g, T.px[i] + T.nx[i] * (pp[0][2] + pp[1][2]) / 2, y + HW + 0.25, T.pz[i] + T.nz[i] * (pp[0][2] + pp[1][2]) / 2, 0.05, 0.05, pp[1][2] - pp[0][2], T.hd[i], wc, wc);
        poles.push([i, d]);
      }
      for (let k = 0; k + 1 < poles.length; k++) { const A = poles[k], B = poles[k + 1]; if (!A || !B) continue;   // (the contact wires over the two tracks, between spans)
        for (const o of [-1.6, 1.6]) { const a = Pt(A[0], o, HW), b = Pt(B[0], o, HW), len = Math.hypot(b[0] - a[0], b[2] - a[2]);
          box(scen.get(a[0], a[2]), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, len, 0.04, 0.04, Math.atan2(b[2] - a[2], b[0] - a[0]), wc, wc); } }
    }

    /* ---- the trees: OSM's (the street trees and the quay's), the parks' and the gardens' from the land cover, within 60 m ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const WIND = { value: 0 }; out.dyn.wind = WIND;
    tMat.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = WIND;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
        '#ifdef USE_INSTANCING\nfloat wPh = instanceMatrix[3].x * 0.07 + instanceMatrix[3].z * 0.05;\n#else\nfloat wPh = 0.0;\n#endif\n' +
        'float wK = position.y * position.y * 0.014;\ntransformed.x += wK * sin( uWind * 1.1 + wPh );\ntransformed.z += wK * 0.6 * sin( uWind * 0.83 + wPh * 1.7 );');
    };
    tMat.customProgramCacheKey = () => 'zhTreeWind';
    const TK = [new IChunks(zhTreeGeo(0), tMat, 256), new IChunks(zhTreeGeo(1), tMat, 256)];
    let nTrees = 0;
    const TG = new Set(), tgK = (x, z) => Math.floor(x / 5) + ',' + Math.floor(z / 5);
    const nearTree = (x, z) => { for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (TG.has(tgK(x + a * 5, z + b * 5))) return true; return false; };
    const plant = (sp, x, z, hgt, wid, c) => { TG.add(tgK(x, z)); const y = nrGround(x, z) - 0.1; TK[sp].add(x, y, z, crH(x, z, 21) * TAU, wid, hgt, c); nrShade(x, z, wid * 0.42, 1); nTrees++; };
    for (const [x, z] of ZD.trees) {
      if (nrDist(x, z) > 70 || isWater(x, z) || inMark(x, z)) continue; const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 1.5) continue;
      const hq = crH(x, z, 28), hgt = 9 + hq * 6; plant(0, x, z, hgt, hgt * 0.62, [0.95, 1, 0.95]); exclPush(x, z, 3);
    }
    {
      const Lt = NRC * 32;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt; zz += 7) for (let xx = xa; xx < xa + Lt; xx += 7) {
          const x = xx + (crH(xx, zz, 22) - 0.5) * 5, z = zz + (crH(xx, zz, 23) - 0.5) * 5; if (nrDist(x, z) > 60) continue;
          const cl = nrLC(x, z), p = cl === 1 ? 0.7 : cl === 2 ? 0.22 : 0; if (crH(x, z, 24) > p) continue;
          const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 2.5) continue; if (excluded(x, z) || isWater(x, z) || seaD(x, z) > -3 || inMark(x, z)) continue;
          const hq = crH(x, z, 25), cv = 0.86 + crH(x, z, 27) * 0.26, sp = crH(x, z, 26) < 0.7 ? 0 : 1, hgt = sp ? 11 + hq * 7 : 10 + hq * 6;
          plant(sp, x, z, hgt, hgt * (sp ? 0.85 : 0.62), [cv, cv, cv * 0.96]);
        }
      }
    }
    for (const t of TK) t.addTo(root, true);

    /* ---- OSM's walls and fences by the road (within 40 m): low walls and railings ---- */
    for (const [k, fl] of ZD.walls) {
      if (k === 4) continue;
      const pts = flat2(fl);
      for (let q = 0; q + 1 < pts.length; q++) {
        const [ax, az] = pts[q], [bx, bz] = pts[q + 1], len = Math.hypot(bx - ax, bz - az); if (len < 0.6) continue;
        const mx = (ax + bx) / 2, mz = (az + bz) / 2, nn = nrNear(mx, mz); if (nn.i >= 0 && nn.dd < 0.8 || nrDist(mx, mz) > 40) continue;
        const y = nrGround(mx, mz), ang = Math.atan2(bz - az, bx - ax), g = scen.get(mx, mz);
        if (k === 2) box(g, mx, y - 0.2, mz, len + 0.3, 1.4, 1.0, ang, vary([0.26, 0.36, 0.2], R, 0.08), [0.3, 0.42, 0.22], true);
        else if (k === 3) box(g, mx, y, mz, len + 0.1, 1.1, 0.08, ang, [0.24, 0.26, 0.26], null, true);
        else box(g, mx, y - 0.4, mz, len + 0.2, 1.4, 0.45, ang, [0.7, 0.67, 0.6], [0.78, 0.76, 0.72], true);
      }
    }

    /* ---- boats moored along the quays (the lake and the river, within ~70 m of the road): white hulls, a small cabin on some ---- */
    let nBoat = 0;
    for (let z = Math.ceil(P.z0 / 9) * 9; z < P.z1; z += 9) for (let x = Math.ceil(P.x0 / 9) * 9; x < P.x1; x += 9) {
      if (crH(x, z, 41) > 0.16) continue; const bx = x + (crH(x, z, 42) - 0.5) * 6, bz = z + (crH(x, z, 43) - 0.5) * 6;
      const rd = nrDist(bx, bz); if (rd < 22 || rd > 70 || !isWater(bx, bz)) continue; const ed = edgeD(bx, bz); if (ed < 4 || ed > 16) continue;
      const nn = nrNear(bx, bz); if (underBridge(nn) || nn.dd < 6) continue;
      const g = scen.get(bx, bz), L0 = 5 + crH(x, z, 44) * 4, rot = crH(x, z, 45) * TAU, hull = crH(x, z, 46) < 0.8 ? [0.94, 0.94, 0.92] : [0.3, 0.4, 0.55];
      box(g, bx, -0.35, bz, L0, 0.75, L0 * 0.36, rot, hull, [0.72, 0.6, 0.44]);
      if (crH(x, z, 47) < 0.55) box(g, bx - Math.cos(rot) * L0 * 0.08, 0.4, bz - Math.sin(rot) * L0 * 0.08, L0 * 0.36, 0.8, L0 * 0.26, rot, [0.92, 0.92, 0.9], [0.86, 0.86, 0.84]);
      nBoat++;
    }

    /* ---- the lake and the river to the horizon ---- */
    {
      const WO = { len: 2.2, amp: 0.7, refl: 0.5, shal: 0.5, lap: 0.5, surf: 0.4 }, g = new THREE.PlaneGeometry(40000, 40000, 1, 1).rotateX(-Math.PI / 2);
      const sea = new THREE.Mesh(g, waterMat(tex, Object.assign({ color: 0x4f8a9e }, WO))); sea.position.set(0, LAKE, 6000); sea.receiveShadow = true; sea.matrixAutoUpdate = false; sea.updateMatrix(); root.add(sea);
      out.dyn.water = tex.water; out.sea = sea;
      // the band along the quay walls where the lake comes within 250 m of the road (the water lapping at the stone: little foam)
      const WB = Object.assign({}, WO, { surf: 0.15, lap: 0.35 });
      for (let z = G.z0; z < G.z0 + (G.nz - 1) * NRC; z += 512) for (let x = G.x0; x < G.x0 + (G.nx - 1) * NRC; x += 512) {
        let near = false; for (const e of ED) if (e[0] >= x - 40 && e[0] < x + 552 && e[1] >= z - 40 && e[1] < z + 552 && nrDist(e[0], e[1]) < 250) { near = true; break; }
        if (!near) continue;
        const i0 = Math.max(1, Math.floor((x - G.x0) / NRC)), j0 = Math.max(1, Math.floor((z - G.z0) / NRC)), i1 = Math.min(G.nx - 2, i0 + 64), j1 = Math.min(G.nz - 2, j0 + 64);
        const band = shoreBand(G.x0 + i0 * NRC, G.z0 + j0 * NRC, G.x0 + i1 * NRC, G.z0 + j1 * NRC, LAKE + 0.015, waterline(nrGH, G.x0, G.z0, NRC, i0, i1, j0, j1, LAKE), 18, { F: 4 });
        if (band && band.attributes.shore.array.some(v => v <= -1.99)) addShore(root, band, sea.material, WB);
      }
    }

    /* ---- the far land beyond the corridor (200 m cells, ±12 km): the town on the hills round the lake ---- */
    {
      const F = ZD.far, bin = atob(F.b64), n = F.n, H = (i, j) => F.lo + bin.charCodeAt(clamp(j, 0, n - 1) * n + clamp(i, 0, n - 1)) * F.step, gf = new GB();
      const colF = (h, x, z) => { const t = clamp(h / 300, 0, 1), k = 0.9 + crH(Math.floor(x / 200), Math.floor(z / 200), 3) * 0.15, town = h < 80 ? 0.6 : 0.2;
        return [lerp(lerp(0.44, 0.3, t), 0.66, town) * k, lerp(lerp(0.5, 0.42, t), 0.62, town) * k, lerp(lerp(0.34, 0.27, t), 0.56, town) * k]; };
      const inner = (x, z) => x > P.x0 + 200 && x < P.x1 - 200 && z > P.z0 + 200 && z < P.z1 - 200 && nrDist(x, z) < 560;
      for (let j = 0; j + 1 < n; j++) for (let i = 0; i + 1 < n; i++) {
        const x = F.x0 + (i + 1) * F.cell, z = F.z0 + (j + 1) * F.cell; if (inner(x, z)) continue;
        const q = (a, b) => { const xx = F.x0 + (a + 0.5) * F.cell, zz = F.z0 + (b + 0.5) * F.cell, hv = H(a, b); return [xx, hv <= F.lo + 0.01 ? LAKE - 3 : hv - (inner(xx, zz) ? 14 : 0.3), zz]; };
        const A = q(i, j), B2 = q(i + 1, j), C = q(i + 1, j + 1), Dd = q(i, j + 1); if (Math.max(A[1], B2[1], C[1], Dd[1]) < LAKE - 0.5) continue;
        gf.quadUp(A, Dd, C, B2, [colF(A[1], A[0], A[2]), colF(Dd[1], Dd[0], Dd[2]), colF(C[1], C[0], C[2]), colF(B2[1], B2[0], B2[2])]);
      }
      const fm = addM(gf, matV); if (fm) fm.castShadow = false;
    }

    /* ---- the terrain tiles and the verges ---- */
    let nTiles = 0;
    {
      const grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let k = 0; k < tiles.length; k += 3) { const m = new THREE.Mesh(nrTileGeo(tiles[k], tiles[k + 1], tiles[k + 2] === 1 ? 1 : 4), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); nTiles++; }
      const vg = [0.8, 0.79, 0.76];
      for (let c0 = 0; c0 < N; c0 += RC) {
        const gv = new RB(true), pv = [-1, -1];
        for (let ii = c0; ii <= Math.min(c0 + RC, N); ii++) {
          const i = ii % N;
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, vr = vergeRow(i, side), pts = vr.map(([o, h]) => Pt(i, side * o, h)), cols = vr.map(([o], k) => k === 0 ? [0.7, 0.7, 0.7] : vg);
            const ordered = side > 0 ? { p: pts, c: cols } : { p: pts.slice().reverse(), c: cols.slice().reverse() };
            const rv = gv.row(ordered.p, ordered.c, ordered.p.map(p => [p[0] / 14, -p[2] / 14]));
            if (pv[si] >= 0) gv.link(pv[si], rv, 0, 4); pv[si] = rv;
          }
        }
        addM(gv, gMat);
      }
      const gp = new Chunks(256, true);
      for (const q4 of quayStrips) gp.get(q4[0][0], q4[0][2]).quadUp(q4[0], q4[1], q4[2], q4[3], q4.map(p => API.nrGCol(p[0], p[2]).slice()), q4.map(p => [p[0] / 14, -p[2] / 14]));
      gp.addTo(root, gMat, false, true);
      G.col = G.cov = P.edge = null;   // (build only)
    }

    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    crowdFinish(CR, root, out);
    out.stats = { tiles: nTiles, trees: nTrees, buildings: nBld, landmarks: nMark, quays: nQuay, boats: nBoat, poles: nPole, fans: nFans };   // (read by the tests)
    return out;
  }

  World.ext.zurich = (scene, tex, opts) => buildZurich(scene, tex, opts);
})();
