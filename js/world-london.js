/* =========================================================================
   WORLD — London (theme 'london'): a city race through the centre of London (docs/proge/london.md). Its own builder (World.ext.london) in a
   file of its own, on World's shared corridor helpers (World.api: nrPrep's terrain from the track's dem and land cover) and the scenery data of
   js/data/london.js (OpenStreetMap, Copernicus DEM, ESA WorldCover, Meta / WRI canopy).
   The 60 m rule: the detail only within ~60 m of the road, as the chase camera sees it: the stone blocks along the streets in their OSM
   footprints (pale stone, brick, rows of windows, flat roofs and slate), the river wall of the embankment with its parapet and lamps, the plane
   trees, the street race's concrete blocks and catch fences. The famous buildings only as generic shapes, with no inscriptions, signs, statues
   or names: the clock tower and the palace by the river, its south tower, the abbey and the church by it, the domed hall, the column on the
   square (nothing on top), the gallery and the church on the square, the arch, the guards' house and the hall on Whitehall, the arched bridge,
   the railway bridge with its footbridges, the wheel and the hall across the river. Farther out only the town's roofs (the surface model).
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
  const RIVER = 1.0;   // the Thames in the game (m above the sea, as the track's heights): about half tide at Westminster

  // ---- the trees (unit height 1, instanced): 0 a London plane (a tall clear trunk, a broad high crown), 1 a smaller round tree of the gardens ----
  function lnTreeGeo(kind) {
    const g = new GB(), R = rng(5108 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    const bark = [0.52, 0.5, 0.42];
    if (kind === 0) { cyl(g, 0, -0.02, 0, 0.032, 0.5, 5, bark, null, 0.022); ico(g, 0, 0.68, 0, 0.42, 0.78, [0.3, 0.42, 0.2], R, 0.22); }
    else { cyl(g, 0, -0.02, 0, 0.035, 0.36, 4, [0.36, 0.31, 0.26], null, 0.026); ico(g, 0, 0.62, 0, 0.44, 0.74, [0.27, 0.4, 0.19], R, 0.2); }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function lnGroundTex() {   // the paving under the vertex colours (256 px = 14 m, tileable): pale grey slabs of ~0.9 m in courses, flecks
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), r = rng(5101), img = x.createImageData(S, S), d = img.data;
    const n1 = valueNoise2(5102, 40), wr = (f, i, j) => { const u = i / S, v = j / S; return f(i, j) * (1 - u) * (1 - v) + f(i - S, j) * u * (1 - v) + f(i, j - S) * (1 - u) * v + f(i - S, j - S) * u * v; };
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const o = (j * S + i) * 4, row = Math.floor(j / 16), ii = (i + (row % 2) * 8) % S, joint = ii % 16 === 0 || j % 16 === 0;
      const k = (joint ? 0.8 : 0.9 + crH(Math.floor(ii / 16), row, 7) * 0.06) + wr(n1, i, j) * 0.08 + (r() - 0.5) * 0.04;
      d[o] = Math.min(255, 198 * k); d[o + 1] = Math.min(255, 197 * k); d[o + 2] = Math.min(255, 193 * k); d[o + 3] = 255; }
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
  function disc(g, cx, cy, cz, nx, nz, r, col, n) {   // a vertical disc facing (nx, nz): a fan of n triangles (the clock faces)
    const ux = -nz, uz = nx, c = [cx, cy, cz], inside = [cx - nx, cy, cz - nz]; let pv = [cx + ux * r, cy, cz + uz * r];
    for (let k = 1; k <= n; k++) { const a = k / n * TAU, p = [cx + ux * Math.cos(a) * r, cy + Math.sin(a) * r, cz + uz * Math.cos(a) * r]; g.triO(c, pv, p, col, inside); pv = p; }
  }
  function beam(g, a, b, w, col) {   // a square beam w wide from a to b in any direction (no end caps): the wheel, the trusses, the pylons and cables
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dx, dy, dz); if (l < 0.01) return;
    let ux = -dz, uz = dx; const ul = Math.hypot(ux, uz); if (ul < 1e-6) { ux = w / 2; uz = 0; } else { ux *= w / 2 / ul; uz *= w / 2 / ul; }
    let vx = dy * uz, vy = dz * ux - dx * uz, vz = -dy * ux; const vl = Math.hypot(vx, vy, vz) || 1; vx *= w / 2 / vl; vy *= w / 2 / vl; vz *= w / 2 / vl;
    const P = (p, su, sv) => [p[0] + ux * su + vx * sv, p[1] + vy * sv, p[2] + uz * su + vz * sv], inn = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    for (const [s1, t1, s2, t2] of [[1, 1, 1, -1], [1, -1, -1, -1], [-1, -1, -1, 1], [-1, 1, 1, 1]]) g.quadO(P(a, s1, t1), P(a, s2, t2), P(b, s2, t2), P(b, s1, t1), col, inn);
  }
  function flatRoof(g, pts, y, col) {   // a flat roof over any footprint (triangulated)
    let tris; try { tris = THREE.ShapeUtils.triangulateShape(pts.map(([x, z]) => new THREE.Vector2(x, z)), []); } catch (e) { return; }
    for (const [a, b, c] of tris) g.triUp([pts[a][0], y, pts[a][1]], [pts[b][0], y, pts[b][1]], [pts[c][0], y, pts[c][1]], [col, col, col]);
  }

  function buildLondon(scene, tex, opts) {
    const R = rng(5100), N = T.N, ds = T.ds, sStart = T.startS, def = T.def, L = T.len, LD = LN_DATA;
    if (!def.dem) { def.dem = LD.dem; def.lc = LD.lc; }   // (nrPrep reads the corridor's terrain and land cover from the track)
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: nrGround, camFloor: (x, z) => Math.max(nrGround(x, z), RIVER), props: [], farClip: true, ownTex: [] };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    const sAt = (d) => ((sStart + d) % L + L) % L;
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

    /* ---- the Thames: a 2 m mask of its ring (build.py joins OSM's two banks) and the distance to its banks (+ on the water) ---- */
    const DM = LD.dem, MC = 2, MX0 = DM.x0, MZ0 = DM.z0, MNX = Math.ceil(DM.nx * DM.cell / MC), MNZ = Math.ceil(DM.nz * DM.cell / MC), mask = new Uint8Array(MNX * MNZ);
    const RINGS = LD.water.map(([nm, fl]) => flat2(fl));
    for (const pts of RINGS) for (let j = 0; j < MNZ; j++) {
      const z = MZ0 + (j + 0.5) * MC, xs = [];
      for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) { const [xa, za] = pts[a], [xb, zb] = pts[b]; if ((za > z) !== (zb > z)) xs.push(xa + (z - za) / (zb - za) * (xb - xa)); }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) { const i0 = Math.max(0, Math.ceil((xs[k] - MX0) / MC - 0.5)), i1 = Math.min(MNX - 1, Math.floor((xs[k + 1] - MX0) / MC - 0.5)); for (let i = i0; i <= i1; i++) mask[j * MNX + i] = 1; }
    }
    const isWater = (x, z) => { const i = Math.floor((x - MX0) / MC), j = Math.floor((z - MZ0) / MC); return i >= 0 && j >= 0 && i < MNX && j < MNZ ? mask[j * MNX + i] === 1 : nrDem(x, z) < RIVER - 0.5; };
    const ED = [], CH = 32, chash = new Map();   // the banks' edges (the land's side along the normal: +1 = +n)
    for (const pts of RINGS) for (let k = 0; k < pts.length; k++) { const [ax, az] = pts[k], [bx, bz] = pts[(k + 1) % pts.length], len = Math.hypot(bx - ax, bz - az); if (len < 0.05 || len > 80) continue;
      const mx = (ax + bx) / 2, mz = (az + bz) / 2, nx = -(bz - az) / len, nz = (bx - ax) / len;
      const w1 = isWater(mx + nx * 3, mz + nz * 3), w2 = isWater(mx - nx * 3, mz - nz * 3); if (w1 === w2) continue;
      ED.push([ax, az, bx, bz, w1 ? -1 : 1]); }
    ED.forEach((e, n) => { const x0 = Math.floor(Math.min(e[0], e[2]) / CH), x1 = Math.floor(Math.max(e[0], e[2]) / CH), z0 = Math.floor(Math.min(e[1], e[3]) / CH), z1 = Math.floor(Math.max(e[1], e[3]) / CH);
      for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) { const k = i + ',' + j; let Lc = chash.get(k); if (!Lc) chash.set(k, Lc = []); Lc.push(n); } });
    const edgeD = (x, z) => {
      let bd = 1e9; const i0 = Math.floor(x / CH), j0 = Math.floor(z / CH);
      for (let r = 0; r <= 3 && bd > r * CH - CH; r++) for (let i = i0 - r; i <= i0 + r; i++) for (let j = j0 - r; j <= j0 + r; j++) {
        if (Math.max(Math.abs(i - i0), Math.abs(j - j0)) !== r) continue; const Lc = chash.get(i + ',' + j); if (!Lc) continue;
        for (const k of Lc) { const [ax, az, bx, bz] = ED[k], vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1), 0, 1), d = Math.hypot(x - ax - vx * t, z - az - vz * t); if (d < bd) bd = d; } }
      return Math.min(bd, 120); };
    const seaD = (x, z) => edgeD(x, z) * (isWater(x, z) ? 1 : -1);
    P.pad = (x, z, h) => { if (isWater(x, z)) h = Math.min(h, RIVER - 2.2 - Math.min(edgeD(x, z), 40) * 0.04); return h; };
    const groundMin = (pts) => { let y = 1e9; for (const [x, z] of pts) y = Math.min(y, isWater(x, z) ? RIVER + 2 : nrGround(x, z)); return y; };
    // the ground's colours: the pale grey paving of the streets and squares, the lawns of the gardens and under the planes
    P.colFn = (x, z, ny, dd, cov, o) => {
      const m = P.n3(x, z), q = P.n4(x, z), fo = nrLCf(x, z, 1), pk = nrLCf(x, z, 2), se = nrLCf(x, z, 3);
      let r = 0.82 + (m - 0.5) * 0.07, g = 0.81 + (m - 0.5) * 0.07, b = 0.78 + (q - 0.5) * 0.05;
      const gr = clamp(pk * 0.9 + fo * 0.6 - se * 0.3, 0, 1) * (1 - clamp(cov, 0, 1) * 0.4);
      r = lerp(r, 0.44 + m * 0.08, gr); g = lerp(g, 0.58 + m * 0.06, gr); b = lerp(b, 0.3, gr);
      if (dd < 6) { const t = sstep(6, 1, dd); r = lerp(r, 0.79, t); g = lerp(g, 0.78, t); b = lerp(b, 0.76, t); }
      o[0] = r; o[1] = g; o[2] = b; return o; };
    const gTex = ownTex(lnGroundTex()), gMat = new THREE.MeshLambertMaterial({ map: gTex, vertexColors: true });
    const tiles = [];
    for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { const on = nrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; tiles.push(ti, tj, on); }

    /* ---- the road: asphalt in sections, white edge lines ---- */
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const RC = 128, tileL = 8, secT = new Float32Array(N);
    for (let i0 = 0, k = 0; i0 < N; k++) { const n = 30 + Math.floor(crH(k, 3, 51) * 50), t = 0.9 + crH(k, 5, 51) * 0.14; for (let i = i0; i < Math.min(N, i0 + n); i++) secT[i] = t; i0 += n; }
    const shade = (i, o, w) => { const rl = T.rl[i]; let k = (0.78 - 0.1 * Math.exp(-((o - rl) * (o - rl)) / 5)) * secT[i]; if (Math.abs(o) > w * 0.9) k -= 0.04; return [k, k, k * 1.02]; };
    for (let c0 = 0; c0 < N; c0 += RC) {
      const gr = new RB(true), gl = new RB(); let pr = -1, pl = -1;
      for (let ii = c0; ii <= Math.min(c0 + RC, N); ii++) {
        const i = ii % N, w = T.wAt(i), offs = [-w, -w / 2, 0, w / 2, w], v = ii * ds / tileL;
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o, w)), offs.map(o => [(o + w) / tileL, v])); if (pr >= 0) gr.link(pr, r, 0, 4); pr = r;
        const wl = [0.9, 0.9, 0.86], l = gl.row([Pt(i, -w + 0.22, 0.034), Pt(i, -w + 0.36, 0.034), Pt(i, w - 0.36, 0.034), Pt(i, w - 0.22, 0.034)], [wl, wl, wl, wl]);
        if (pl >= 0) { gl.link(pl, l, 0, 1); gl.link(pl, l, 2, 3); } pl = l;
      }
      addM(gr, aMat); addM(gl, lMat);
    }
    {   // the chequered line on Whitehall
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
    let nBld = 0, nMark = 0, nLamp = 0;
    const lamp = (g, x, y, z, h) => { cyl(g, x, y, z, 0.1, h, 5, [0.12, 0.12, 0.13]); box(g, x, y + h, z, 0.42, 0.62, 0.42, 0, [0.92, 0.88, 0.72], [0.12, 0.12, 0.13]); nLamp++; };

    /* ---- the bridges over the Thames ---- */
    const STONE = [0.86, 0.84, 0.78], STONED = [0.72, 0.7, 0.65], HONEY = [0.84, 0.76, 0.58], HONEYD = [0.7, 0.63, 0.47], LEAD = [0.42, 0.44, 0.46];
    const SLATE = [0.3, 0.32, 0.35], GILT = [0.86, 0.7, 0.32], DARK = [0.12, 0.12, 0.13], WHITE = [0.9, 0.9, 0.9], GREEN = [0.24, 0.4, 0.32];
    let nBridge = 0; const bands = [];   // (the bridges' bands over the water: no boats under them; [ax, az, ux, uz, len, half width])
    const inBand = (x, z, pad) => bands.some(([ax, az, ux, uz, len, hw]) => { const u = (x - ax) * ux + (z - az) * uz, v = -(x - ax) * uz + (z - az) * ux; return u > -pad && u < len + pad && Math.abs(v) < hw + pad; });
    {   // the arched bridge at the lap's south-east corner: seven green arches on stone piers, a parapet each side, lamps on it
      const wb = flat2(LD.wb), A = wb[0], B = wb[wb.length - 1], len = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / len, uz = (B[1] - A[1]) / len, ang = Math.atan2(uz, ux), Wb = 26;
      let tw0 = -1, tw1 = -1; for (let t = 0; t <= len; t += 1) if (isWater(A[0] + ux * t, A[1] + uz * t)) { if (tw0 < 0) tw0 = t; tw1 = t; }
      const yA = nrGround(A[0], A[1]), yB = Math.max(RIVER + 3, nrGround(B[0], B[1])), deck = (t) => lerp(yA, yB, t / len) + 4.5 * Math.sin(Math.PI * t / len);   // (the deck rises ~4.5 m to its middle)
      const SP = 7, spL = (tw1 - tw0) / SP, rd = [0.38, 0.38, 0.39];
      bands.push([A[0], A[1], ux, uz, len, Wb / 2]);
      for (let t = 0; t < len; t += 3) {
        const tm = t + 1.5, x = A[0] + ux * tm, z = A[1] + uz * tm, top = deck(tm), g = scen.get(x, z);
        const off = (v) => { const px = x - uz * v, pz = z + ux * v, nn = nrNear(px, pz); return nn.i >= 0 && nn.dd < 1.5 ? null : [px, pz]; };   // (the deck kept off the lap's corner)
        for (let k = 0; k < 4; k++) { const v = (k - 1.5) * Wb / 4, q = off(v); if (!q) continue; let bot;
          if (tw0 >= 0 && tm > tw0 && tm < tw1) { const u = ((tm - tw0) / spL) % 1; bot = Math.min(RIVER + 1.8 + 3.8 * Math.sin(Math.PI * u), top - 1.4); }
          else bot = Math.min(top - 1.2, nrGround(q[0], q[1]) - 0.5);
          box(g, q[0], bot, q[1], 3.05, top - bot, Wb / 4 + 0.02, ang, GREEN, rd, true); }
        for (const sd of [-1, 1]) { const q = off(sd * (Wb / 2 - 0.2)); if (!q) continue; box(g, q[0], top, q[1], 3.05, 1.1, 0.4, ang, [0.27, 0.36, 0.3], [0.32, 0.4, 0.34], true);
          if (Math.floor(t / 3) % 8 === 4) lamp(g, q[0], top + 1.1, q[1], 4.2); }
      }
      for (let k = 0; k < 4; k++) { const v = (k - 1.5) * Wb / 4;   // (its road on to the lap: from its west end each quarter of its width as far as the barrier, at most 33 m)
        for (let t = -1.5; t > -33; t -= 3) { const x = A[0] + ux * t - uz * v, z = A[1] + uz * t + ux * v, nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 1.5) break;
          const y0 = nrGround(x, z); box(scen.get(x, z), x, y0 - 0.4, z, 3.05, Math.max(y0, yA) + 0.15 - (y0 - 0.4), Wb / 4 + 0.02, ang, rd, rd, true); } }
      if (tw0 >= 0) for (let k = 1; k < SP; k++) { const t = tw0 + k * spL, x = A[0] + ux * t, z = A[1] + uz * t;
        box(scen.get(x, z), x, RIVER - 3.6, z, 6.5, 3.6 + 2.0, Wb + 3, ang, [0.66, 0.65, 0.61], [0.7, 0.69, 0.65]); }
      nBridge++;
    }
    const markRaw = LD.marks.map(([lab, kind, s, d, fl]) => ({ lab, kind, s, d, pts: flat2(fl) })).filter(m => m.pts.length > 2);
    {   // the railway bridge (from its OSM outline and the rails on it): a deck on brick piers, lattice girders each side; a footbridge each side
        // of it on slim white pylons leaning out, with their cables
      const mk = markRaw.find(m => m.kind === 'bridge');
      if (mk) {
        const o = obb(mk.pts), ux = o.c, uz = o.s, vx = -uz, vz = ux, ang = o.ang, uv = (x, z) => [(x - o.x) * ux + (z - o.z) * uz, (x - o.x) * vx + (z - o.z) * vz];
        let vs = []; for (const fl of LD.rail) for (const [x, z] of flat2(fl)) { const [u, v] = uv(x, z); if (Math.abs(u) < o.L / 2 && Math.abs(v) < o.W / 2 + 4) vs.push(v); }
        const v0 = vs.length ? Math.min(...vs) - 2.5 : -o.W / 2, v1 = vs.length ? Math.max(...vs) + 2.5 : o.W / 2, vc = (v0 + v1) / 2, hw = (v1 - v0) / 2;
        const at = (u, v, y) => [o.x + ux * u + vx * v, y, o.z + uz * u + vz * v], YD = 11.2, BR2 = [0.56, 0.38, 0.3], GIR = [0.3, 0.29, 0.28];
        let fo = vc + hw + 10; for (const [hw2, , , brg, fl] of LD.roads) { if (!brg || !/foot/.test(hw2)) continue; const p = flat2(fl); if (p.length < 2) continue;
          const lenF = Math.hypot(p[p.length - 1][0] - p[0][0], p[p.length - 1][1] - p[0][1]); if (lenF < 150) continue; fo = (uv(...p[0])[1] + uv(...p[p.length - 1])[1]) / 2; }
        const u0 = -o.L / 2, u1 = o.L / 2;
        bands.push([...at(u0, vc, 0).filter((_, k) => k !== 1), ux, uz, o.L, Math.abs(fo - vc) + 4]);
        for (let u = u0; u < u1; u += 6) {
          const um = u + 3, [x, , z] = at(um, vc, 0), nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 2) continue; const g = scen.get(x, z);
          box(g, x, YD, z, 6.05, 1.6, hw * 2, ang, GIR, [0.34, 0.32, 0.3], false);
          for (const sd of [-1, 1]) { const vv = vc + sd * (hw - 0.3), a = at(u, vv, YD + 1.6), b = at(u + 6, vv, YD + 1.6), aT = at(u, vv, YD + 6), bT = at(u + 6, vv, YD + 6);
            beam(g, aT, bT, 0.5, GIR); beam(g, a, aT, 0.35, GIR); beam(g, a, bT, 0.3, GIR); }
          if (Math.floor((u - u0) / 6) % 7 === 3 && isWater(x, z)) box(g, x, RIVER - 3.6, z, 4.2, YD + 3.6 - RIVER, hw * 2 + 1, ang, BR2, BR2);
        }
        const footbridge = (vf) => {   // a deck 4.5 m wide at ~10 m, a rail each side; the pylons on its outer side every 46 m, a fan of cables
          const so = Math.sign(vf - vc) || 1, YF = 10.0;
          for (let u = u0; u < u1; u += 6) { const [x, , z] = at(u + 3, vf, 0), nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 2) continue; const g = scen.get(x, z);
            box(g, x, YF - 0.7, z, 6.05, 0.7, 4.6, ang, [0.66, 0.67, 0.68], [0.6, 0.6, 0.6], false);
            for (const sd of [-1, 1]) { const [px, , pz] = at(u + 3, vf + sd * 2.2, 0); box(g, px, YF, pz, 6.05, 1.1, 0.1, ang, [0.78, 0.8, 0.8], null, true); } }
          for (let u = u0 + 26; u < u1 - 20; u += 46) { const [x, , z] = at(u, vf, 0); if (!isWater(x, z)) continue; const g = scen.get(x, z), base = at(u, vf + so * 3.2, YF - 0.6), topP = at(u, vf + so * 9, YF + 24);
            beam(g, base, topP, 0.9, WHITE); for (const du of [-20, -11, 11, 20]) beam(g, topP, at(u + du, vf + so * 2.3, YF + 0.2), 0.07, [0.7, 0.72, 0.74]);
            box(g, base[0], RIVER - 3.6, base[2], 2.2, YF - 0.6 - RIVER + 3.6, 2.2, ang, [0.7, 0.7, 0.7]); }
        };
        footbridge(fo); footbridge(2 * vc - fo);
        nBridge += 3;
      }
    }

    /* ---- the embankment: the granite river wall within ~90 m of the road, its parapet, the lamps on it; a paved strip behind it ---- */
    let nQuay = 0; const quayStrips = [];   // (the paving behind the river wall: built with the terrain tiles, in their colours)
    {
      const st = [0.62, 0.61, 0.58], stD = [0.47, 0.46, 0.44], cop = [0.74, 0.73, 0.7], gq = new Chunks(256); let accL = 0;
      for (const [ax, az, bx, bz, ls] of ED) {
        const mx = (ax + bx) / 2, mz = (az + bz) / 2; if (nrDist(mx, mz) > 90) continue;
        const len = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / len * ls, nz = (bx - ax) / len * ls;   // (n toward the land)
        const yl = (x, z) => Math.max(RIVER + 3, nrGround(x + nx * 9, z + nz * 9)) + 0.04;
        const ya = yl(ax, az), yb = yl(bx, bz), g = gq.get(mx, mz);
        const ia = [ax - nx * 0.4, az - nz * 0.4], ib = [bx - nx * 0.4, bz - nz * 0.4], inside = [mx + nx * 4, -5, mz + nz * 4];
        g.quadO([ia[0], RIVER - 3.4, ia[1]], [ib[0], RIVER - 3.4, ib[1]], [ib[0], yb, ib[1]], [ia[0], ya, ia[1]], vary(stD, R, 0.04), inside, null, [stD, stD, st, st]);
        const nA = nrNear(ax, az), nB = nrNear(bx, bz), wA = clamp(Math.min(9, nA.dd - 0.8), 0, 9), wB = clamp(Math.min(9, nB.dd - 0.8), 0, 9);
        if (wA > 0.5 || wB > 0.5) quayStrips.push([[ia[0], ya, ia[1]], [ia[0] + nx * wA, ya, ia[1] + nz * wA], [ib[0] + nx * wB, yb, ib[1] + nz * wB], [ib[0], yb, ib[1]]]);
        box(g, mx - nx * 0.2, Math.min(ya, yb) - 0.05, mz - nz * 0.2, len + 0.1, 1.0 + Math.abs(ya - yb), 0.6, Math.atan2(bz - az, bx - ax), stD, cop);   // (the parapet)
        accL += len; if (accL > 27 && nrDist(mx, mz) < 70 && !inBand(mx, mz, 2)) { accL = 0; lamp(scen.get(mx, mz), mx - nx * 0.2, Math.max(ya, yb) + 0.9, mz - nz * 0.2, 3.6); }
        nQuay++;
      }
      gq.addTo(root, matV, true, true);
    }

    const facC = new Chunks(256, true), gplain = new Chunks(256), roofs = new Chunks(256);   // (the walls with windows, the plain ground floors, the roofs)
    /* ---- the buildings' walls: rows of windows (tex.facade), a plainer ground floor on the shops' and the offices' fronts ---- */
    function wallsOf(g, pts, y0, H, col, bay, shop) {
      const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cz = pts.reduce((a, p) => a + p[1], 0) / pts.length, inside = [cx, y0 + H / 2, cz], G0 = shop ? 4.4 : 0;
      const base = col.map(v => v * 0.8), fl = (H - G0) / 3.6;
      for (let k = 0; k < pts.length; k++) {
        const a = pts[k], b = pts[(k + 1) % pts.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.4) continue;
        const bays = Math.max(1, Math.round(len / bay));
        if (shop) gplain.get(cx, cz).quadO([a[0], y0 - 0.5, a[1]], [b[0], y0 - 0.5, b[1]], [b[0], y0 + G0, b[1]], [a[0], y0 + G0, a[1]], base, inside);
        g.quadO([a[0], y0 + G0, a[1]], [b[0], y0 + G0, b[1]], [b[0], y0 + H, b[1]], [a[0], y0 + H, a[1]], col, inside, [[0, 0], [bays, 0], [bays, Math.max(1, Math.round(fl))], [0, Math.max(1, Math.round(fl))]]);
      }
    }

    /* ---- the landmarks: plain shapes from their OSM outlines (the town's own houses inside them left out), no words, signs or statues ---- */
    const marks = markRaw.filter(m => m.kind !== 'bridge');
    const inMark = (x, z) => markRaw.some(m => inPoly(m.pts, x, z));
    const colM = marks.find(m => m.kind === 'column'), colO = colM ? obb(colM.pts) : null;
    const faceTo = (pts, tx, tz) => {   // the point of an outline nearest (tx, tz) and the way from it toward there (the front facing the square or the street)
      let bd = 1e9, bx = 0, bz = 0;
      for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length], vx = b[0] - a[0], vz = b[1] - a[1], t = clamp(((tx - a[0]) * vx + (tz - a[1]) * vz) / (vx * vx + vz * vz || 1), 0, 1), x = a[0] + vx * t, z = a[1] + vz * t, d = Math.hypot(tx - x, tz - z); if (d < bd) { bd = d; bx = x; bz = z; } }
      const l = Math.hypot(tx - bx, tz - bz) || 1; return { x: bx, z: bz, nx: (tx - bx) / l, nz: (tz - bz) / l };
    };
    const roadOf = (m) => { const [x, z] = atS(sAt(m.s - sStart), 0); return [x, z]; };   // (the road's point by the landmark)
    const portico = (g, f, y, n, W, H, col) => {   // n columns before the wall at f, W wide and H tall, the entablature and the pediment over them
      const tx = -f.nz, tz = f.nx, D = 4.8, ang = Math.atan2(f.nz, f.nx), cx = f.x + f.nx * (D / 2 - 0.5), cz = f.z + f.nz * (D / 2 - 0.5);
      for (let k = 0; k < n; k++) { const u = (k / (n - 1) - 0.5) * (W - 1.6); cyl(g, f.x + f.nx * (D - 1.0) + tx * u, y, f.z + f.nz * (D - 1.0) + tz * u, 0.6, H, 8, col, col); }
      box(g, cx, y + H, cz, D, 2.0, W, ang, col); gable(g, cx, y + H + 2.0, cz, D, W + 0.3, Math.min(4.2, W * 0.18), ang, col, col);
      box(g, cx, y - 0.4, cz, D + 0.6, 0.9, W + 0.6, ang, STONED);
    };
    const corners4 = (o, s, f) => [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([u, v]) => [o.x + (o.c * u - o.s * v) * s / 2 * f, o.z + (o.s * u + o.c * v) * s / 2 * f]);
    const clockFaces = (g, x, y, z, ang, hs, r, dirs) => { for (const [u, v] of dirs) { const c = Math.cos(ang), s = Math.sin(ang), nx = c * u - s * v, nz = s * u + c * v, fx = x + nx * hs, fz = z + nz * hs;
      disc(g, fx, y, fz, nx, nz, r * 1.1, [0.22, 0.2, 0.18], 18); disc(g, fx + nx * 0.05, y, fz + nz * 0.05, nx, nz, r, [0.95, 0.93, 0.84], 18);
      const hx = fx + nx * 0.12, hz = fz + nz * 0.12, tx = -nz, tz = nx;
      beam(g, [hx, y, hz], [hx + tx * Math.cos(0.5) * r * 0.55, y + Math.sin(0.5) * r * 0.55, hz + tz * Math.cos(0.5) * r * 0.55], 0.22, DARK);
      beam(g, [hx, y, hz], [hx - tx * Math.cos(1.2) * r * 0.85, y + Math.sin(1.2) * r * 0.85, hz - tz * Math.cos(1.2) * r * 0.85], 0.16, DARK); } };
    const SIDES4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const m of marks) {
      const o = obb(m.pts), g = scen.get(o.x, o.z), y = groundMin(m.pts) - 0.3, lab = m.lab, fac = facC.get(o.x, o.z), rf = roofs.get(o.x, o.z);
      nMark++; if (m.kind !== 'wheel' && Math.max(o.L, o.W) < 60) exclPush(o.x, o.z, Math.max(o.L, o.W) / 2 + 3);
      if (lab === 'Urni stolp') {   // the clock tower: a pale golden shaft with buttressed corners, the clock stage with four plain faces, the belfry, the spire
        const s = Math.max(o.L, o.W);
        box(g, o.x, y, o.z, s, 56.3, s, o.ang, HONEY); for (const [x, z] of corners4(o, s, 1)) box(g, x, y, z, 1.3, 57, 1.3, o.ang, HONEYD);
        box(g, o.x, y + 56, o.z, s + 1.4, 10.5, s + 1.4, o.ang, HONEY, HONEYD); clockFaces(g, o.x, y + 61.2, o.z, o.ang, (s + 1.4) / 2 + 0.05, 3.3, SIDES4);
        box(g, o.x, y + 66.5, o.z, s + 0.4, 8, s + 0.4, o.ang, HONEYD); for (const [x, z] of corners4(o, s + 0.4, 1)) cone(g, x, y + 74.5, z, 0.8, 6, 4, HONEY, HONEY, o.ang);
        cone(g, o.x, y + 74.5, o.z, (s + 0.4) * 0.72, 21.5, 4, SLATE, GILT, o.ang + Math.PI / 4);
      } else if (lab === 'Južni stolp palače') {   // the palace's south tower: a great square tower with four corner turrets, a flagstaff (no flag)
        const s = Math.min(o.L, o.W);
        box(g, o.x, y, o.z, s, 90, s, o.ang, HONEY); for (const [x, z] of corners4(o, s, 0.92)) { box(g, x, y + 88, z, 3, 10, 3, o.ang, HONEY); cone(g, x, y + 98, z, 2.1, 6, 4, HONEYD, GILT, o.ang + Math.PI / 4); }
        cyl(g, o.x, y + 90, o.z, 0.15, 16, 4, WHITE);
      } else if (m.kind === 'castle') {   // the palace by the river: Gothic walls of pale golden stone, a row of pinnacles on the parapet, the long roof, the central spire
        const H = 24; wallsOf(fac, m.pts, y, H, HONEY, 2.9, false); flatRoof(rf, m.pts, y + H - 0.6, [0.4, 0.4, 0.41]);
        gable(g, o.x, y + H - 0.6, o.z, o.L * 0.86, 16, 8, o.ang, [0.3, 0.33, 0.34], HONEY);
        let acc = 0; for (let k = 0; k < m.pts.length; k++) { const a = m.pts[k], b = m.pts[(k + 1) % m.pts.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          for (let t = 11 - acc; t < len; t += 11) { const x = a[0] + (b[0] - a[0]) * t / len, z = a[1] + (b[1] - a[1]) * t / len; cone(g, x, y + H, z, 0.55, 4.2, 4, HONEY, HONEY, 0); }
          acc = (acc + len) % 11; }
        cyl(g, o.x, y + H - 1, o.z, 6.5, 35, 8, HONEY, HONEY); cone(g, o.x, y + H + 34, o.z, 6.7, 33, 8, SLATE, GILT, 0);
      } else if (lab === 'Opatija') {   // the abbey: high stone walls, the long lead roof and the transept's, the low tower over the crossing, two west towers
        const H = 28, wE = (o.x + o.c * o.L / 2 < o.x - o.c * o.L / 2) ? 1 : -1, ct = [o.x - o.c * o.L * 0.06 * wE, o.z - o.s * o.L * 0.06 * wE];
        wallsOf(fac, m.pts, y, H, [0.8, 0.78, 0.72], 5.5, false); flatRoof(rf, m.pts, y + H - 0.5, LEAD);
        gable(g, o.x, y + H - 0.5, o.z, o.L * 0.8, 26, 11, o.ang, LEAD, [0.8, 0.78, 0.72]); gable(g, ct[0], y + H - 0.5, ct[1], Math.min(o.W * 0.95, 64), 22, 10, o.ang + Math.PI / 2, LEAD, [0.8, 0.78, 0.72]);
        box(g, ct[0], y + H, ct[1], 15, 15, 15, o.ang, [0.78, 0.76, 0.7]);
        for (const sd of [-1, 1]) { const x = o.x + o.c * o.L * 0.43 * wE - o.s * sd * 10, z = o.z + o.s * o.L * 0.43 * wE + o.c * sd * 10;
          box(g, x, y, z, 10, 62, 10, o.ang, [0.8, 0.78, 0.72]); for (const [px, pz] of corners4({ x, z, c: o.c, s: o.s }, 10, 0.9)) cone(g, px, y + 62, pz, 0.9, 7, 4, [0.8, 0.78, 0.72], GILT, o.ang); }
      } else if (lab === 'Cerkev ob opatiji') {   // the small church by the abbey: a nave under a slate roof, a square tower at the west end
        const H = 13, wE = (o.x + o.c * o.L / 2 < o.x - o.c * o.L / 2) ? 1 : -1; wallsOf(fac, m.pts, y, H, [0.82, 0.78, 0.7], 4.5, false); flatRoof(rf, m.pts, y + H - 0.4, SLATE);
        gable(g, o.x, y + H - 0.4, o.z, o.L * 0.92, o.W * 0.75, 6, o.ang, SLATE, [0.82, 0.78, 0.7]);
        const x = o.x + o.c * (o.L / 2 - 4) * wE, z = o.z + o.s * (o.L / 2 - 4) * wE; box(g, x, y, z, 7.5, 26, 7.5, o.ang, [0.8, 0.76, 0.68]);
        for (const [px, pz] of corners4({ x, z, c: o.c, s: o.s }, 7.5, 0.9)) cone(g, px, y + 26, pz, 0.6, 3.5, 4, [0.8, 0.76, 0.68], null, o.ang);
      } else if (m.kind === 'hall' && lab === 'Kupolasta dvorana') {   // the domed hall: a stone block, a drum and a lead dome, a small lantern
        const H = 24; wallsOf(fac, m.pts, y, H, STONE, 4.2, true); flatRoof(rf, m.pts, y + H, LEAD);
        cyl(g, o.x, y + H, o.z, 13, 6, 12, STONE, STONE); ico(g, o.x, y + H + 6, o.z, 13.6, 0.72, LEAD, R, 0); cyl(g, o.x, y + H + 15.4, o.z, 1.8, 4, 8, STONE, LEAD); cone(g, o.x, y + H + 19.4, o.z, 2, 3, 8, LEAD, GILT, 0);
      } else if (m.kind === 'column') {   // the column on the square: steps, a pedestal, a tall plain granite shaft and its capital, nothing on top
        box(g, o.x, y, o.z, 24, 1.2, 24, o.ang, [0.72, 0.71, 0.68]); box(g, o.x, y + 1.2, o.z, 9.5, 9.2, 9.5, o.ang, [0.66, 0.65, 0.62]); box(g, o.x, y + 10.4, o.z, 6, 3, 6, o.ang, [0.7, 0.69, 0.66]);
        cyl(g, o.x, y + 13.4, o.z, 2.0, 30, 12, [0.74, 0.73, 0.7], null, 1.75); box(g, o.x, y + 43.4, o.z, 5, 2.6, 5, o.ang, [0.32, 0.29, 0.22]); cyl(g, o.x, y + 46, o.z, 1.5, 1.8, 10, [0.7, 0.69, 0.66], [0.7, 0.69, 0.66]);
        CR.block(o.x, o.z, 24, 24, o.ang);
      } else if (m.kind === 'museum') {   // the gallery: a long stone front to the square, a portico of eight columns, a small dome behind it
        const H = 18, f = colO ? faceTo(m.pts, colO.x, colO.z) : { x: o.x, z: o.z, nx: 0, nz: 1 };
        wallsOf(fac, m.pts, y, H, STONE, 5, false); flatRoof(rf, m.pts, y + H, LEAD); portico(g, f, y, 8, 26, 12, STONE);
        const dx = f.x - f.nx * 14, dz = f.z - f.nz * 14; cyl(g, dx, y + H, dz, 6, 5, 12, STONE, STONE); ico(g, dx, y + H + 5, dz, 6.4, 0.9, LEAD, R, 0); cone(g, dx, y + H + 10.5, dz, 1.2, 3.5, 6, LEAD, GILT, 0);
      } else if (lab === 'Cerkev ob trgu') {   // the church on the square: a portico of six columns to the square, the steeple over it
        const H = 17, f = colO ? faceTo(m.pts, colO.x, colO.z) : { x: o.x, z: o.z, nx: -1, nz: 0 };
        wallsOf(fac, m.pts, y, H, STONE, 4.2, false); flatRoof(rf, m.pts, y + H - 0.4, SLATE); gable(g, o.x, y + H - 0.4, o.z, o.L * 0.98, o.W + 0.4, 5.5, o.ang, SLATE, STONE);
        portico(g, f, y, 6, Math.min(o.W * 0.8, 20), 12, STONE);
        const sx = f.x - f.nx * 6, sz = f.z - f.nz * 6, a = Math.atan2(f.nz, f.nx);
        box(g, sx, y + H - 1, sz, 7, 14, 7, a, STONE); box(g, sx, y + H + 13, sz, 5.6, 8, 5.6, a, STONE); cyl(g, sx, y + H + 21, sz, 2.7, 6, 8, STONE, STONE); cone(g, sx, y + H + 27, sz, 2.7, 15, 8, STONED, GILT, 0);
        clockFaces(g, sx, y + H + 9, sz, a, 3.55, 1.5, SIDES4);
      } else if (lab === 'Stražarnica') {   // the guards' house: a pale stone front, a small clock tower and its cupola in the middle
        const H = 16, [rx, rz] = roadOf(m), f = faceTo(m.pts, rx, rz), a = Math.atan2(f.nz, f.nx);
        wallsOf(fac, m.pts, y, H, STONE, 4.4, false); flatRoof(rf, m.pts, y + H, SLATE);
        box(g, o.x, y + H - 0.5, o.z, 8.5, 10, 8.5, a, STONE); clockFaces(g, o.x, y + H + 6, o.z, a, 4.3, 1.9, [[1, 0], [-1, 0]]);
        cyl(g, o.x, y + H + 9.5, o.z, 3.4, 4.5, 8, STONE, LEAD); cone(g, o.x, y + H + 14, o.z, 3.8, 5.5, 8, LEAD, GILT, 0);
      } else if (lab === 'Dvorana na Whitehallu') {   // the hall on Whitehall: two storeys of tall windows in pale stone, a flat roof behind a balustrade
        const H = 17; wallsOf(fac, m.pts, y, H, [0.88, 0.86, 0.8], 4.4, false); flatRoof(rf, m.pts, y + H - 0.8, LEAD);
        for (const [u, v, l, w] of [[1, 0, o.W, 0.5], [-1, 0, o.W, 0.5], [0, 1, o.L, 0.5], [0, -1, o.L, 0.5]]) {
          const x = o.x + (o.c * u * o.L - o.s * v * o.W) / 2, z = o.z + (o.s * u * o.L + o.c * v * o.W) / 2; box(g, x, y + H, z, u ? w : l, 1.1, u ? l : w, o.ang, [0.86, 0.84, 0.78]); }
      } else if (m.kind === 'arch') {   // the arch building at the square's corner: a curved stone block, three dark arches toward the square
        const H = 21, f = colO ? faceTo(m.pts, colO.x, colO.z) : { x: o.x, z: o.z, nx: 1, nz: 0 }, a = Math.atan2(f.nz, f.nx), tx = -f.nz, tz = f.nx;
        wallsOf(fac, m.pts, y, H, STONE, 4.2, false); flatRoof(rf, m.pts, y + H, LEAD);
        for (const [u, w, h] of [[0, 7.5, 12.5], [-11.5, 5.5, 10], [11.5, 5.5, 10]]) box(g, f.x + f.nx * 0.2 + tx * u, y, f.z + f.nz * 0.2 + tz * u, 1.2, h, w, a, DARK);
      } else if (m.kind === 'wheel') {   // the wheel across the river: a double rim of white steel, spokes to the hub, the capsules on the rim, the A-frame on the land side
        const ux = o.c, uz = o.s, ax = -uz, az = ux, yb = Math.max(RIVER + 3, nrGround(o.x, o.z)), hub = [o.x, yb + 72, o.z], Rw = 60, NS = 40;
        const land = isWater(o.x + ax * 30, o.z + az * 30) ? -1 : 1, rimP = (k, sd) => { const t = k / NS * TAU; return [o.x + ux * Rw * Math.cos(t) + ax * sd * 2, hub[1] + Rw * Math.sin(t), o.z + uz * Rw * Math.cos(t) + az * sd * 2]; };
        for (const sd of [-1, 1]) for (let k = 0; k < NS; k++) { beam(g, rimP(k, sd), rimP(k + 1, sd), 0.8, WHITE); if (k % 2 === 0) beam(g, [hub[0] + ax * sd * 2, hub[1], hub[2] + az * sd * 2], rimP(k, sd), 0.18, [0.82, 0.83, 0.85]); }
        for (let k = 0; k < 32; k++) { const t = k / 32 * TAU, x = o.x + ux * (Rw + 2.2) * Math.cos(t), z = o.z + uz * (Rw + 2.2) * Math.cos(t); box(g, x, hub[1] + (Rw + 2.2) * Math.sin(t) - 1.4, z, 3.2, 2.8, 7, o.ang, [0.82, 0.86, 0.9], WHITE); }
        cyl(g, hub[0] - ax * 4, hub[1] - 2, hub[2] - az * 4, 2.4, 4, 8, WHITE, WHITE);
        for (const sd of [-1, 1]) beam(g, [hub[0] + ax * land * 3, hub[1], hub[2] + az * land * 3], [o.x + ax * land * 52 + ux * sd * 22, yb, o.z + az * land * 52 + uz * sd * 22], 2.2, WHITE);
      } else {   // the halls across the river and the rest: a big stone block, red tiles on its roof
        const H = 24; wallsOf(fac, m.pts, y, H, STONE, 4.4, true); flatRoof(rf, m.pts, y + H, [0.56, 0.32, 0.26]);
      }
    }

    /* ---- the buildings (OSM within 150 m): offices and houses of pale stone, brick or stucco with rows of windows (tex.facade), a plainer
       ground floor on the fronts by the road, flat roofs behind a parapet on the big blocks, slate on the small ---- */
    const PAL = [[0.88, 0.86, 0.8], [0.84, 0.82, 0.76], [0.9, 0.88, 0.83], [0.8, 0.78, 0.72], [0.86, 0.85, 0.8], [0.74, 0.64, 0.5], [0.66, 0.42, 0.34], [0.92, 0.91, 0.88], [0.78, 0.74, 0.66]];
    const outOf = new Map(LD.out.map(([k, fl]) => [k, flat2(fl)]));
    const BH = new Map(), BHC = 24;   // the footprints built, hashed (where the street trees and the lamps may not stand)
    const bhPush = (pts) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      for (let a = Math.floor(x0 / BHC); a <= Math.floor(x1 / BHC); a++) for (let b = Math.floor(z0 / BHC); b <= Math.floor(z1 / BHC); b++) { const k = a + ',' + b; let Lc = BH.get(k); if (!Lc) BH.set(k, Lc = []); Lc.push(pts); } };
    const inBld = (x, z) => { const Lc = BH.get(Math.floor(x / BHC) + ',' + Math.floor(z / BHC)); if (!Lc) return false; for (const p of Lc) if (inPoly(p, x, z)) return true; return false; };
    LD.bld.forEach(([bx, bz, Lb, Wb, ang, Hb, kind], n) => {
      if (inMark(bx, bz) || isWater(bx, bz)) return;
      const ca = Math.cos(ang), sa = Math.sin(ang);
      let pts = outOf.get(n) || [[Lb / 2, Wb / 2], [-Lb / 2, Wb / 2], [-Lb / 2, -Wb / 2], [Lb / 2, -Wb / 2]].map(([a, b]) => [bx + ca * a - sa * b, bz + sa * a + ca * b]);
      // a house that reaches over the race's barriers (the race is wider than some pavements): cut back along the road, 1.2 m behind the barrier
      let cutB = false;
      for (let it = 0; it < 4 && pts.length > 2; it++) {
        let worst = null;
        for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.ceil(len / 3));
          for (let q = 0; q < m; q++) { const x = a[0] + (b[0] - a[0]) * q / m, z = a[1] + (b[1] - a[1]) * q / m, nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 1 && (!worst || nn.dd < worst.dd)) worst = nn; } }
        if (!worst) break;
        const i = worst.i, sd = worst.lat >= 0 ? 1 : -1, keep = (sd > 0 ? T.br[i] : T.bl[i]) + 1.2, f = (p) => ((p[0] - T.px[i]) * T.nx[i] + (p[1] - T.pz[i]) * T.nz[i]) * sd - keep, o2 = [];
        for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length], fa = f(a), fb = f(b);
          if (fa >= 0) o2.push(a); if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); o2.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } }
        pts = o2; cutB = true;
      }
      let ar = 0; for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length]; ar += a[0] * b[1] - b[0] * a[1]; }
      if (pts.length < 3 || Math.abs(ar) / 2 < 20 || Lb < 2.5 || Wb < 2.5) return;
      let y0 = 1e9; for (const [cx, cz] of pts) y0 = Math.min(y0, nrGround(cx, cz));
      const hk = crH(bx, bz, 11), area = Lb * Wb, small = kind === 4 || area < 40;
      const H = Hb > 3 ? Hb : small ? 4 + hk * 3 : kind === 5 ? 24 + hk * 8 : kind === 6 ? 22 + hk * 6 : kind === 1 ? 16 : 18 + hk * 8;
      const pi = crH(bx, bz, 12), col = vary(PAL[Math.floor(pi * PAL.length)], R, 0.04), shop = !small && (kind === 5 || kind === 6 || nrDist(bx, bz) < 30);
      y0 -= 0.2; wallsOf(facC.get(bx, bz), pts, y0, H, col, kind === 5 ? 4.0 : 3.6, shop);
      const o = outOf.has(n) || cutB ? obb(pts) : { x: bx, z: bz, L: Lb, W: Wb, ang }, rg = roofs.get(bx, bz);
      if (area > 500 || !small && crH(bx, bz, 15) < 0.6) { flatRoof(rg, pts, y0 + H - 0.8, [0.46, 0.46, 0.47]); if (area > 900) box(rg, o.x, y0 + H - 0.8, o.z, o.L * 0.5, 2.6, o.W * 0.5, o.ang, [0.44, 0.45, 0.46], [0.4, 0.4, 0.42]); }
      else gable(rg, o.x, y0 + H, o.z, o.L + 0.4, o.W + 0.4, Math.min(5, o.W * 0.3), o.ang, vary(SLATE, R, 0.05), col);
      bhPush(pts); CR.block(o.x, o.z, o.L, o.W, o.ang); exclPush(o.x, o.z, Math.max(o.L, o.W) / 2 + 1.5); nBld++;
    });
    const facMat = hjCutMat(new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true }), cut), matB = hjCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    facC.addTo(root, facMat, true, true); gplain.addTo(root, matB, true, true); roofs.addTo(root, matB, true, true);

    /* ---- the other streets within 70 m: asphalt ribbons on the paving (cut away inside the race's barriers) ---- */
    {
      const gs = new Chunks(256), asp = [0.42, 0.42, 0.43];
      for (const [hw, lanes, wd, brg, fl] of LD.roads) {
        if (brg || /foot|path|cycle|steps|pedestrian|track/.test(hw)) continue;
        const pts = flat2(fl), W = (parseFloat(wd) || (hw === 'service' ? 4 : hw === 'residential' ? 6 : 9)) / 2, lift = 0.05 + (crH(pts[0][0], pts[0][1], 4)) * 0.02;
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
      const runs = [[-60, 40, 1, 0.35]];
      const at = { 'Trafalgarski trg': [50, 1, 0.3], 'Westminstrski most': [40, 1, 0.3], 'Parlamentarni trg': [40, 1, 0.3] };
      for (const q of T.names) { const a = at[q.n]; if (a) runs.push([q.d - 30, q.d + a[0], a[1], a[2]]); }
      const okSide = (s, side) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 2.5), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; return !isWater(x, z) && !inBld(x, z); };
      for (const [a, b, rows, dens] of runs) for (const side of [-1, 1]) for (let s0 = a; s0 < b; s0 += 30) { const s1 = Math.min(b, s0 + 30); if (!okSide(sAt((s0 + s1) / 2), side)) continue;
        nFans += crowdRun(CR, sAt(s0), sAt(s0) + (s1 - s0), side, { rows, dens, first: 1.0, excluded }); }
    }

    /* ---- the lamps of OSM within 60 m: black posts with a lantern ---- */
    for (const [x, z] of LD.lamps) { if (nrDist(x, z) > 60 || isWater(x, z) || inBld(x, z)) continue; const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 0.8) continue;
      lamp(scen.get(x, z), x, nrGround(x, z), z, 4.6); CR.avoid(x, z, 0.4); }

    /* ---- the trees: OSM's (the planes along the embankment and the avenue), the gardens' from the land cover, within 60 m ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const WIND = { value: 0 }; out.dyn.wind = WIND;
    tMat.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = WIND;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
        '#ifdef USE_INSTANCING\nfloat wPh = instanceMatrix[3].x * 0.07 + instanceMatrix[3].z * 0.05;\n#else\nfloat wPh = 0.0;\n#endif\n' +
        'float wK = position.y * position.y * 0.014;\ntransformed.x += wK * sin( uWind * 1.1 + wPh );\ntransformed.z += wK * 0.6 * sin( uWind * 0.83 + wPh * 1.7 );');
    };
    tMat.customProgramCacheKey = () => 'lnTreeWind';
    const TK = [new IChunks(lnTreeGeo(0), tMat, 256), new IChunks(lnTreeGeo(1), tMat, 256)];
    let nTrees = 0;
    const TG = new Set(), tgK = (x, z) => Math.floor(x / 5) + ',' + Math.floor(z / 5);
    const nearTree = (x, z) => { for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (TG.has(tgK(x + a * 5, z + b * 5))) return true; return false; };
    const plant = (sp, x, z, hgt, wid, c) => { TG.add(tgK(x, z)); const y = nrGround(x, z) - 0.1; TK[sp].add(x, y, z, crH(x, z, 21) * TAU, wid, hgt, c); nrShade(x, z, wid * 0.42, 1); nTrees++; };
    const noTree = (x, z) => isWater(x, z) || inMark(x, z) || inBld(x, z) || inBand(x, z, 3);
    for (const [x, z] of LD.trees) {
      if (nrDist(x, z) > 70 || noTree(x, z)) continue; const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 1.5) continue;
      const hq = crH(x, z, 28), hgt = 14 + hq * 8; plant(0, x, z, hgt, hgt * 0.66, [0.95, 1, 0.95]); exclPush(x, z, 3);
    }
    {
      const Lt = NRC * 32;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt; zz += 7) for (let xx = xa; xx < xa + Lt; xx += 7) {
          const x = xx + (crH(xx, zz, 22) - 0.5) * 5, z = zz + (crH(xx, zz, 23) - 0.5) * 5; if (nrDist(x, z) > 60) continue;
          const cl = nrLC(x, z), p = cl === 1 ? 0.7 : cl === 2 ? 0.2 : 0; if (crH(x, z, 24) > p) continue;
          const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 2.5) continue; if (excluded(x, z) || nearTree(x, z) || noTree(x, z) || seaD(x, z) > -3) continue;
          const hq = crH(x, z, 25), cv = 0.86 + crH(x, z, 27) * 0.26, sp = crH(x, z, 26) < 0.6 ? 0 : 1, hgt = sp ? 9 + hq * 6 : 13 + hq * 8;
          plant(sp, x, z, hgt, hgt * (sp ? 0.8 : 0.66), [cv, cv, cv * 0.96]);
        }
      }
    }
    for (const t of TK) t.addTo(root, true);

    /* ---- OSM's walls and railings by the road (within 40 m): low stone walls and black railings ---- */
    for (const [k, fl] of LD.walls) {
      if (k === 4) continue;
      const pts = flat2(fl);
      for (let q = 0; q + 1 < pts.length; q++) {
        const [ax, az] = pts[q], [bx, bz] = pts[q + 1], len = Math.hypot(bx - ax, bz - az); if (len < 0.6) continue;
        const mx = (ax + bx) / 2, mz = (az + bz) / 2, nn = nrNear(mx, mz); if (nn.i >= 0 && nn.dd < 0.8 || nrDist(mx, mz) > 40 || isWater(mx, mz)) continue;
        const y = nrGround(mx, mz), ang = Math.atan2(bz - az, bx - ax), g = scen.get(mx, mz);
        if (k === 2) box(g, mx, y - 0.2, mz, len + 0.3, 1.4, 1.0, ang, vary([0.26, 0.36, 0.2], R, 0.08), [0.3, 0.42, 0.22], true);
        else if (k === 3) box(g, mx, y, mz, len + 0.1, 1.2, 0.08, ang, [0.12, 0.12, 0.13], null, true);
        else box(g, mx, y - 0.4, mz, len + 0.2, 1.4, 0.45, ang, [0.72, 0.7, 0.65], [0.78, 0.76, 0.72], true);
      }
    }

    /* ---- the boats moored along the embankment (within ~80 m of the road): long white river boats with a deckhouse ---- */
    let nBoat = 0;
    for (let z = Math.ceil(P.z0 / 14) * 14; z < P.z1; z += 14) for (let x = Math.ceil(P.x0 / 14) * 14; x < P.x1; x += 14) {
      if (crH(x, z, 41) > 0.2) continue; const bx = x + (crH(x, z, 42) - 0.5) * 8, bz = z + (crH(x, z, 43) - 0.5) * 8;
      const rd = nrDist(bx, bz); if (rd < 24 || rd > 80 || !isWater(bx, bz) || inBand(bx, bz, 20)) continue; const ed = edgeD(bx, bz); if (ed < 7 || ed > 14) continue;
      let bdx = 0, bdz = 0, bl = 1e9; for (const [ax, az, cx, cz] of ED) { const d = Math.hypot((ax + cx) / 2 - bx, (az + cz) / 2 - bz); if (d < bl) { bl = d; bdx = cx - ax; bdz = cz - az; } }
      const g = scen.get(bx, bz), L0 = 18 + crH(x, z, 44) * 14, rot = Math.atan2(bdz, bdx);
      box(g, bx, RIVER - 0.6, bz, L0, 1.6, 5.2, rot, [0.94, 0.94, 0.92], [0.6, 0.5, 0.4]); box(g, bx, RIVER + 1.0, bz, L0 * 0.7, 2.2, 4.2, rot, [0.9, 0.9, 0.88], [0.8, 0.8, 0.78]);
      box(g, bx, RIVER + 1.6, bz, L0 * 0.68, 0.9, 4.25, rot, [0.2, 0.24, 0.28]);
      nBoat++;
    }

    /* ---- the river to the horizon ---- */
    {
      const WO = { len: 2.2, amp: 0.7, refl: 0.45, shal: 0.4, lap: 0.45, surf: 0.3 }, g = new THREE.PlaneGeometry(40000, 40000, 1, 1).rotateX(-Math.PI / 2);
      const sea = new THREE.Mesh(g, waterMat(tex, Object.assign({ color: 0x56706a }, WO))); sea.position.set(0, RIVER, 0); sea.receiveShadow = true; sea.matrixAutoUpdate = false; sea.updateMatrix(); root.add(sea);
      out.dyn.water = tex.water; out.sea = sea;
      const WB = Object.assign({}, WO, { surf: 0.12, lap: 0.3 });
      for (let z = G.z0; z < G.z0 + (G.nz - 1) * NRC; z += 512) for (let x = G.x0; x < G.x0 + (G.nx - 1) * NRC; x += 512) {
        let near = false; for (const e of ED) if (e[0] >= x - 40 && e[0] < x + 552 && e[1] >= z - 40 && e[1] < z + 552 && nrDist(e[0], e[1]) < 250) { near = true; break; }
        if (!near) continue;
        const i0 = Math.max(1, Math.floor((x - G.x0) / NRC)), j0 = Math.max(1, Math.floor((z - G.z0) / NRC)), i1 = Math.min(G.nx - 2, i0 + 64), j1 = Math.min(G.nz - 2, j0 + 64);
        const band = shoreBand(G.x0 + i0 * NRC, G.z0 + j0 * NRC, G.x0 + i1 * NRC, G.z0 + j1 * NRC, RIVER + 0.015, waterline(nrGH, G.x0, G.z0, NRC, i0, i1, j0, j1, RIVER), 18, { F: 4 });
        if (band && band.attributes.shore.array.some(v => v <= -1.99)) addShore(root, band, sea.material, WB);
      }
    }

    /* ---- the town beyond the corridor (400 m cells, ±12 km): the roofs of the surface model, grey and brown ---- */
    {
      const F = LD.far, bin = atob(F.b64), n = F.n, H = (i, j) => F.lo + bin.charCodeAt(clamp(j, 0, n - 1) * n + clamp(i, 0, n - 1)) * F.step, gf = new GB();
      const colF = (h, x, z) => { const k = 0.88 + crH(Math.floor(x / 400), Math.floor(z / 400), 3) * 0.16, t = clamp(h / 40, 0, 1); return [lerp(0.5, 0.62, t) * k, lerp(0.5, 0.6, t) * k, lerp(0.46, 0.57, t) * k]; };
      const inner = (x, z) => x > P.x0 + 200 && x < P.x1 - 200 && z > P.z0 + 200 && z < P.z1 - 200 && nrDist(x, z) < 560;
      for (let j = 0; j + 1 < n; j++) for (let i = 0; i + 1 < n; i++) {
        const x = F.x0 + (i + 1) * F.cell, z = F.z0 + (j + 1) * F.cell; if (inner(x, z)) continue;
        const q = (a, b) => { const xx = F.x0 + (a + 0.5) * F.cell, zz = F.z0 + (b + 0.5) * F.cell, hv = H(a, b); return [xx, hv <= F.lo + 1.01 ? RIVER - 3 : hv - (inner(xx, zz) ? 14 : 0.3), zz]; };
        const A = q(i, j), B2 = q(i + 1, j), C = q(i + 1, j + 1), Dd = q(i, j + 1); if (Math.max(A[1], B2[1], C[1], Dd[1]) < RIVER - 0.5) continue;
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
    out.stats = { tiles: nTiles, trees: nTrees, buildings: nBld, landmarks: nMark, bridges: nBridge, quays: nQuay, lamps: nLamp, boats: nBoat, fans: nFans };   // (read by the tests)
    return out;
  }

  World.ext.london = (scene, tex, opts) => buildLondon(scene, tex, opts);
})();
