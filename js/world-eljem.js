/* =========================================================================
   WORLD — El Jem (theme 'eljem'): a short town course in the olive country of the Sahel of Tunisia on today's roads (docs/proge/eljem.md).
   Its own builder (World.ext.eljem) in a file of its own, on World's shared corridor helpers (World.api: nrPrep's terrain from the track's
   dem and land cover) and the scenery data of js/data/eljem.js (OpenStreetMap, Copernicus DEM, ESA WorldCover, Meta / WRI canopy).
   The 60 m rule: the detailed things only within ~60 m of the road, as far as the chase camera sees them: the white and sandstone houses of
   the town in their OSM footprints only (flat roofs with their parapets), the olive trees and
   the palms on the dry ochre ground, the concrete barriers, and by the road the Roman amphitheatre (its oval of arcades after its OSM outline:
   the model of assets/landmarks/eljem.glb, made in Blender by tools/znamenitost/, World.znamenitost; until it has loaded, or if it cannot,
   the simpler one built here). Farther out only the terrain from the heights and the far land. Only geographic and plain names.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, NRC, RB, TAU, atS, atSf, box, clamp, cone, crH, crowdCtx, crowdFinish, crowdRun, cyl, gable,
    ico, inPoly, lerp, nrDem, nrDist, nrGH, nrGround, nrLC, nrLCf, nrLump, nrNear, nrPrep, nrShade, nrTileGeo, nrTileOn, rng,
    sstep, valueNoise2, vary
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  // ---- the trees (unit height 1, instanced): 0 a palm (a slender leaning trunk, a crown of fronds), 1 an olive (a round grey-green crown;
  //      squat and sunk: the bushes of the dry scrub), 2 an old olive (a short gnarled trunk, a wide grey-green crown) ----
  function ejTreeGeo(kind) {
    const g = new GB(), R = rng(2895 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
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
      ico(g, 0, 0.64, 0, 0.42, 0.72, [0.42, 0.48, 0.32], R, 0.22);
    } else {
      cyl(g, 0, -0.02, 0, 0.07, 0.5, 6, [0.5, 0.45, 0.38], null, 0.05);
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + R() * 0.5; cyl(g, Math.cos(a) * 0.1, 0.5, Math.sin(a) * 0.1, 0.022, 0.2, 4, [0.58, 0.51, 0.44], null, 0.014); }
      ico(g, 0, 0.74, 0, 0.44, 0.34, [0.44, 0.5, 0.34], R, 0.3); nrLump(g, 0.2, 0.78, -0.12, 0.24, 0.45, [0.38, 0.44, 0.3], R, 0.2);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function ejGroundTex() {   // the ground under the vertex colours (256 px = 14 m, tileable): a warm dusty tone with flecks
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), r = rng(2896), img = x.createImageData(S, S), d = img.data;
    const n1 = valueNoise2(2897, 40), n2 = valueNoise2(2898, 9), wr = (f, i, j) => { const u = i / S, v = j / S; return f(i, j) * (1 - u) * (1 - v) + f(i - S, j) * u * (1 - v) + f(i, j - S) * (1 - u) * v + f(i - S, j - S) * u * v; };
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const o = (j * S + i) * 4, k = 0.78 + wr(n1, i, j) * 0.16 + wr(n2, i, j) * 0.1 + (r() - 0.5) * 0.12;
      d[o] = Math.min(255, 210 * k); d[o + 1] = Math.min(255, 190 * k); d[o + 2] = Math.min(255, 165 * k); d[o + 3] = 255; }
    x.putImageData(img, 0, 0);
    for (let k = 0; k < 500; k++) { const px = r() * S, py = r() * S, g = 80 + r() * 60; x.fillStyle = `rgba(${g + 14},${g},${g - 16},0.35)`; x.fillRect(px, py, 1 + r() * 2, 1 + r() * 2); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  }

  function buildElJem(scene, tex, opts) {
    const R = rng(2895), N = T.N, ds = T.ds, sStart = T.startS, sFin = T.finishS, iE = N - 1, def = T.def, L = T.len, LD = EJ_DATA;
    if (!def.dem) { def.dem = LD.dem; def.lc = LD.lc; }   // (nrPrep reads the corridor's terrain and land cover from the track)
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: nrGround, camFloor: nrGround, props: [], farClip: true, ownTex: [] };
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

    // ---- the amphitheatre (LD.marks 'ruins'): its outline, centre and reach; the ground inside it (and 12 m round) one level terrace,
    //      without the far terrain's noise, so that the model (built on the same heights) stands on it ----
    const marks = LD.marks.map(([lab, kind, s, d, fl]) => { const pts = []; for (let k = 0; k + 1 < fl.length; k += 2) pts.push([fl[k], fl[k + 1]]); return { lab, kind, s, d, pts }; });
    const fort = marks.find(m => m.kind === 'ruins' && m.pts.length > 3);
    let FC = null, FR = 0, FB = null;
    if (fort) {
      const u = fort.pts.slice(0, -1); FC = [u.reduce((a, p) => a + p[0], 0) / u.length, u.reduce((a, p) => a + p[1], 0) / u.length];
      for (const [x, z] of u) FR = Math.max(FR, Math.hypot(x - FC[0], z - FC[1]));
      FB = [Math.min(...u.map(p => p[0])) - 14, Math.max(...u.map(p => p[0])) + 14, Math.min(...u.map(p => p[1])) - 14, Math.max(...u.map(p => p[1])) + 14];
    }
    const segD = (pts, x, z) => { let bd = 1e9; for (let k = 0; k + 1 < pts.length; k++) { const [ax, az] = pts[k], [bx, bz] = pts[k + 1], vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1), 0, 1); bd = Math.min(bd, Math.hypot(x - ax - vx * t, z - az - vz * t)); } return bd; };
    const fortW = (x, z) => { if (!fort || x < FB[0] || x > FB[1] || z < FB[2] || z > FB[3]) return 0; if (inPoly(fort.pts, x, z)) return 1; return sstep(12, 0, segD(fort.pts, x, z)); };
    const inFort = (x, z, m) => !!fort && x > FB[0] + 14 - m && x < FB[1] - 14 + m && z > FB[2] + 14 - m && z < FB[3] - 14 + m && (inPoly(fort.pts, x, z) || segD(fort.pts, x, z) < m);

    const seaD = () => -200;   // (no sea at El Jem: the town lies inland on the plain)
    // (the amphitheatre stands on one level terrace: its ground at the outline's mean height, eased into the town's over 12 m round it)
    const FY = fort ? fort.pts.reduce((a, p) => a + nrDem(p[0], p[1]), 0) / fort.pts.length : 0;
    P.pad = (x, z, h) => {
      const fw = fortW(x, z); if (fw > 0) h = lerp(h, FY, fw);
      return h; };
    // the ground's colours (the dry Sahel of Tunisia): the pale ochre dust and the tilled soil of the olive groves, dry grass in patches, the
    // trees' canopy, the dust of the town, the bare banks
    P.colFn = (x, z, ny, dd, cov, o) => {
      const m = P.n3(x, z), q = P.n4(x, z), fo = nrLCf(x, z, 1), sc = nrLCf(x, z, 2), se = nrLCf(x, z, 3), h = nrDem(x, z);
      let r = 0.94 + (m - 0.5) * 0.14, g = 0.8 + (m - 0.5) * 0.1 + (q - 0.5) * 0.06, b = 0.62 + (q - 0.5) * 0.08;
      const gr = sstep(0.5, 0.85, P.n2(x, z)) * 0.6; r = lerp(r, 0.72, gr); g = lerp(g, 0.7, gr); b = lerp(b, 0.45, gr);   // (dry grass)
      r = lerp(r, 0.66, sc * 0.6); g = lerp(g, 0.62, sc * 0.6); b = lerp(b, 0.4, sc * 0.6);
      const cv = clamp(cov, 0, 1), can = fo * (1 - cv);
      r = lerp(r, 0.36 + m * 0.06, can * 0.85); g = lerp(g, 0.42 + m * 0.05, can * 0.85); b = lerp(b, 0.24, can * 0.85);
      r = lerp(r, 0.62, cv * 0.8); g = lerp(g, 0.5, cv * 0.8); b = lerp(b, 0.38, cv * 0.8);
      const k = 0.96 + (q - 0.5) * 0.12; r = lerp(r, 0.8 * k, se * 0.55); g = lerp(g, 0.66 * k, se * 0.55); b = lerp(b, 0.52 * k, se * 0.55);
      const rk = sstep(0.9, 0.66, ny) * 0.95;
      r = lerp(r, 0.86 + q * 0.06, rk); g = lerp(g, 0.74 + q * 0.05, rk); b = lerp(b, 0.56 + q * 0.04, rk);
      void h;
      if (dd < 4) { const t = sstep(4, 0.5, dd); r = lerp(r, 0.86, t); g = lerp(g, 0.8, t); b = lerp(b, 0.72, t); }
      o[0] = r; o[1] = g; o[2] = b; return o; };
    const gMat = new THREE.MeshLambertMaterial({ map: ownTex(ejGroundTex()), vertexColors: true });
    const tiles = [];
    for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { const on = nrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; tiles.push(ti, tj, on); }

    /* ---- the verges between the asphalt, the barriers and the terrain (lifted onto the ground where it rises) ---- */
    const vergeRow = (i, side) => {
      const w = T.wAt(i), bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i], lift = (o, h) => { const q = side * o, g = nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.06 - y; return [o, Math.max(h, g)]; };
      return [[w, 0.0], [w + 0.8, -0.04], lift(Math.max(w + 1.2, bar - 0.3), -0.08), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)];
    };

    /* ---- the side roads of OpenStreetMap at the road (World.cesta.stranske, as Livorno: look only; T.bl / T.br, the barrier and the driving
       stay as they are): their asphalt up to ~60 m, the mouths with the posts, the edge line and the wall open at each mouth ---- */
    const fA = (f) => Math.min(N - 2, Math.max(0, Math.floor(f)));
    const PtF = (f, o, y) => { const a = fA(f), t = clamp(f - a, 0, 1); if (t < 1e-4) return Pt(a, o, y); if (t > 1 - 1e-4) return Pt(a + 1, o, y); const p = Pt(a, o, y), q = Pt(a + 1, o, y); return [lerp(p[0], q[0], t), lerp(p[1], q[1], t), lerp(p[2], q[2], t)]; };
    const barF = (f, side) => { const a = fA(f), t = clamp(f - a, 0, 1), B = side > 0 ? T.br : T.bl; return t < 1e-4 ? B[a] : t > 1 - 1e-4 ? B[a + 1] : lerp(B[a], B[a + 1], t); };
    const wF = (f) => { const a = fA(f), t = clamp(f - a, 0, 1); return t < 1e-4 ? T.wAt(a) : t > 1 - 1e-4 ? T.wAt(a + 1) : lerp(T.wAt(a), T.wAt(a + 1), t); };
    const edgeL = (f, si) => { const w = wF(f); return si ? [PtF(f, w - 0.38, 0.034), PtF(f, w - 0.22, 0.034)] : [PtF(f, -w + 0.22, 0.034), PtF(f, -w + 0.38, 0.034)]; };
    const vergeAt = (i, side, d) => { const pr = vergeRow(i, side); for (let k = 1; k < pr.length; k++) if (d <= pr[k][0]) return lerp(pr[k - 1][1], pr[k][1], clamp((d - pr[k - 1][0]) / (pr[k][0] - pr[k - 1][0] || 1), 0, 1)); return -9; };
    const GAP = null;   // (main's OSM side streets, js/world-eljem-obcestje.js, are not in this branch)
    const SR = World.cesta && World.cesta.stranske && def.stranske && def.stranske.length ? World.cesta.stranske(T, def.stranske, { tla: nrGround, rob: vergeAt, ton: (i) => 0.84 * secT[i] - 0.04, odprta: true, barva: false }) : null;
    const tek = (si, bit, a, b) => (SR ? SR.tek(si, bit, a, b) : [Array.from({ length: b - a + 1 }, (_, k) => a + k)]);
    const naSR = (x, z) => { if (SR) for (const k of SR.krogi) if ((x - k[0]) ** 2 + (z - k[1]) ** 2 < k[2] * k[2]) return true; return false; };
    let nStb = 0;
    if (SR) { out.cestaRob = (out.cestaRob || []).concat(SR.ustja); for (const k of SR.krogi) exclPush(k[0], k[1], k[2]); out.stranske = SR.n; }

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
        const wl = [0.9, 0.9, 0.86], cl = CL ? CL[i] : 0, e0 = SR ? 0 : 4, lp = SR ? [] : [Pt(i, -w + 0.22, 0.034), Pt(i, -w + 0.38, 0.034), Pt(i, w - 0.38, 0.034), Pt(i, w - 0.22, 0.034)];
        if (cl) lp.push(Pt(i, -0.08, 0.034), Pt(i, 0.08, 0.034));
        if (!lp.length) { pl = -1; pc = 0; continue; }
        const l = gl.row(lp, lp.map(() => wl));
        if (pl >= 0) { if (!SR) { gl.link(pl, l, 0, 1); gl.link(pl, l, 2, 3); } if (cl && pc) gl.link(pl, l, e0, e0 + 1); } pl = l; pc = cl;
      }
      if (SR) for (const si of [0, 1]) for (const run of tek(si, 2, c0, Math.min(c0 + RC, N - 1))) { let p = -1; for (const f of run) { if (GAP && GAP[f] & (si ? 2 : 1)) { p = -1; continue; } const l = gl.row(edgeL(f, si), [wx, wx]); if (p >= 0) gl.link(p, l, 0, 1); p = l; } }   // (open across the roadside's mouths too)
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
    // (does the barrier's line at i run backwards from where it was at j: its step against the road's)
    const back = (j, i, side) => { const oj = side * ((side > 0 ? T.br[j] : T.bl[j]) + 0.1), oi = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.1);
      const dx = T.px[i] + T.nx[i] * oi - T.px[j] - T.nx[j] * oj, dz = T.pz[i] + T.nz[i] * oi - T.pz[j] - T.nz[j] * oj;
      return dx * (T.px[i] - T.px[j]) + dz * (T.pz[i] - T.pz[j]) <= 0; };
    const wallRow = (gr, f, side, k) => {
      const i = Math.floor(f), bar = barF(f, side), o = side * (bar + 0.1), o2 = side * (bar + 0.5), h = k === 1 ? 1.15 : 0.85, tone = 0.94 + crH(i >> 3, side, 71) * 0.1;
      const c0 = k === 1 ? whD : concD.map(v => v * tone), c1 = k === 1 ? wh : conc.map(v => v * tone), c2 = k === 0 ? concT : wh;
      let p = [PtF(f, o, -0.5), PtF(f, o, h - 0.08), PtF(f, o, h), PtF(f, o2, h)], c = [c0, c1, c2, c2];
      if (side < 0) { p = p.reverse(); c = c.slice().reverse(); }
      return gr.row(p, c);
    };
    for (let c0 = 0; c0 < N - 1; c0 += RC) {
      const gr = new RB();
      for (const side of [-1, 1]) for (const run of tek(side > 0 ? 1 : 0, 1, c0, Math.min(c0 + RC, N - 1))) {
        let prev = -1, pk = -1, li = -1;
        for (const f of run) {
          const i = fA(f) + (f >= N - 1 ? 1 : 0), k = kindAt(i);
          if (f === Math.floor(f)) { if (li >= 0 && back(li, i, side)) continue; li = i; }   // (inside a bend tighter than the barrier's offset its line would loop back: left out)
          if (prev >= 0 && k !== pk) { gr.link(prev, wallRow(gr, f, side, pk), 0, 3); prev = -1; }
          const r = wallRow(gr, f, side, k); if (prev >= 0) gr.link(prev, r, 0, 3); prev = r; pk = k;
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
        for (let d = d0; d <= d1; d += 2) { const i = T.idx(sAt(d)), bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.15); if (SR && SR.rez[side > 0 ? 1 : 0][i] & 1) { pr = -1; continue; }
          let p = [Pt(i, o, 1.1), Pt(i, o, 3.8)]; if (side < 0) p = p.reverse();
          const r = gf.row(p, [W1, W1], [[acc / 3, 0], [acc / 3, 1]]); if (pr >= 0) gf.link(pr, r, 0, 1); pr = r; acc += 2; } }
      addM(gf, fMat);
    }

    /* ---- the spectators' context ---- */
    const CR = crowdCtx({ gH: nrGround, near: (x, z) => nrNear(x, z).dd, maxSlope: 0.7 });
    let nBld = 0, nStone = 0;

    /* ---- the amphitheatre: the simple one (one mesh) until the model of assets/landmarks/eljem.glb has loaded (World.znamenitost): its oval
       outer wall along the OSM outline in three storeys of arches (piers and the dark openings between them, a cornice over each storey), a
       stretch of the wall on the west broken down to the first storey, and inside the tiers of seats falling to the arena ---- */
    if (fort) {
      const gF = new GB(), u = fort.pts, st = [0.84, 0.7, 0.5], stT = [0.78, 0.66, 0.48], dk = [0.3, 0.24, 0.18], sand = [0.88, 0.78, 0.6];
      const [cx, cz] = FC, y0 = nrDem(cx, cz) - 1.5, SH = [10.5, 10.5, 9.5];
      // the outline resampled to ~64 arch bays round the oval (each bay ~7 m)
      const per = []; let tot = 0; for (let k = 0; k + 1 < u.length; k++) { const l = Math.hypot(u[k + 1][0] - u[k][0], u[k + 1][1] - u[k][1]); per.push(l); tot += l; }
      const NB = Math.max(24, Math.round(tot / 7)), at = (t) => { let d = t * tot; for (let k = 0; k < per.length; k++) { if (d <= per[k] || k === per.length - 1) { const f = per[k] ? d / per[k] : 0; return [u[k][0] + (u[k + 1][0] - u[k][0]) * f, u[k][1] + (u[k + 1][1] - u[k][1]) * f]; } d -= per[k]; } return u[0]; };
      const ring = []; for (let b = 0; b <= NB; b++) ring.push(at(b / NB));
      for (let b = 0; b < NB; b++) {
        const [ax, az] = ring[b], [bx, bz] = ring[b + 1], len = Math.hypot(bx - ax, bz - az); if (len < 0.5) continue;
        const ang = Math.atan2(bz - az, bx - ax), mx = (ax + bx) / 2, mz = (az + bz) / 2, west = (mx - cx) < -0.55 * FR;   // (the broken stretch)
        const ns = west ? 1 : 3; let y = y0;
        for (let f = 0; f < ns; f++) {
          const h = SH[f] + (f === 0 ? 1.5 : 0);
          box(gF, mx, y, mz, len * 0.95, h, 2.0, ang, dk, null, true);   // (the arch's dark opening behind)
          box(gF, ax + (bx - ax) * 0.08, y, az + (bz - az) * 0.08, len * 0.22, h, 3.0, ang, st, stT, true);   // (the pier)
          box(gF, mx, y + h * 0.78, mz, len + 0.2, h * 0.22, 3.0, ang, st, stT, true);   // (the arch's head and the wall over it)
          box(gF, mx, y + h - 0.2, mz, len + 0.5, 0.6, 3.6, ang, stT, stT, true);   // (the cornice)
          y += h;
        }
        // the tiers of seats inward from the wall down to the arena (a sloped band of three steps)
        const ix = cx - mx, iz = cz - mz, il = Math.hypot(ix, iz) || 1;
        for (let k = 0; k < 3; k++) { const f = 0.12 + k * 0.12, sx = mx + ix * f, sz = mz + iz * f; box(gF, sx, y0, sz, len * (1 - f) + 0.4, (west ? 9 : 24) - k * 7, il * 0.13, ang, stT, sand, true); }
      }
      const fm = new THREE.Mesh(gF.geometry(), matV); fm.castShadow = fm.receiveShadow = true; fm.matrixAutoUpdate = false; root.add(fm);
      exclPush(FC[0], FC[1], FR + 6); nStone++;
      out.fort = fm; out.marks = { Amfiteater: FC.slice() };
      if (World.znamenitost) World.znamenitost.add('eljem', root, { x: FC[0], z: FC[1], fallback: fm, out });
    }

    /* ---- the buildings (OSM footprints within 60 m): houses and blocks whitewashed or in sandstone, almost all with a
       flat roof and its parapet, the shutters blue or brown; the shops and the public buildings in three or four floors ---- */
    const WALL = [[0.97, 0.96, 0.93], [0.95, 0.93, 0.88], [0.9, 0.82, 0.66], [0.93, 0.87, 0.74], [0.98, 0.97, 0.95], [0.86, 0.76, 0.6], [0.96, 0.94, 0.9]];
    const ROOF = [[0.68, 0.36, 0.24], [0.62, 0.32, 0.22], [0.72, 0.42, 0.3]];
    const WIN = [[0.22, 0.36, 0.58], [0.42, 0.36, 0.3], [0.3, 0.32, 0.34]];
    const house = (g, bx, bz, Lb, Wb, ang, y0, hh, flat, wc) => {
      box(g, bx, y0 - 0.5, bz, Lb, hh + 0.5, Wb, ang, wc, vary([0.72, 0.68, 0.62], R, 0.05), true);
      for (let f = 1; f <= Math.round(hh / 3.1); f++) box(g, bx, y0 + f * 3.1 - 1.9, bz, Lb + 0.05, 1.0, Wb + 0.05, ang, WIN[Math.floor(crH(bx, bz, 13) * WIN.length)], null, true);   // (the rows of windows)
      if (flat) box(g, bx, y0 + hh, bz, Lb, 0.6, Wb, ang, wc.map(v => v * 0.92), [0.7, 0.64, 0.58]);
      else gable(g, bx, y0 + hh, bz, Lb + 0.6, Wb + 0.6, Math.min(2.4, Wb * 0.22), ang, ROOF[Math.floor(crH(bx, bz, 14) * ROOF.length)], wc);
    };
    for (const [bx, bz, Lb, Wb, ang, Hb, k0] of LD.bld) {
      if (inFort(bx, bz, 4)) continue;   // (nothing in the amphitheatre)
      const ca = Math.cos(ang), sa = Math.sin(ang), corners = [[Lb / 2, Wb / 2], [Lb / 2, -Wb / 2], [-Lb / 2, Wb / 2], [-Lb / 2, -Wb / 2]].map(([a, b]) => [bx + ca * a - sa * b, bz + sa * a + ca * b]);
      // big footprints (the market halls and the walled yards, 70+ m) left out: they would wall in the view behind the car; the road checked on a grid over the whole footprint, not only at its corners
      if (Math.max(Lb, Wb) > 70) continue;
      let clash = false, y0 = 1e9, sea = false; for (const [cx, cz] of corners.concat([[bx, bz]])) { y0 = Math.min(y0, nrGround(cx, cz)); if (seaD(cx, cz) > 2) sea = true; }
      const nu = Math.ceil(Lb / 4), nv = Math.ceil(Wb / 4);
      for (let u = 0; u <= nu && !clash; u++) for (let v = 0; v <= nv; v++) { const a = (u / nu - 0.5) * Lb, b = (v / nv - 0.5) * Wb, n = nrNear(bx + ca * a - sa * b, bz + sa * a + ca * b); if (n.i >= 0 && n.dd < 1.2) { clash = true; break; } }
      if (clash || sea || Lb < 2.2 || Wb < 2.2) continue;
      const g = scen.get(bx, bz), hk = crH(bx, bz, 11), area = Lb * Wb, big = k0 === 5 || k0 === 6 || k0 === 9 || area > 240;
      const hh = Hb || (big ? (3 + Math.floor(hk * 2)) * 3.1 : area < 45 || k0 === 4 ? 3 + hk : 6.2 + hk * 1.4);
      house(g, bx, bz, Lb, Wb, ang, y0, hh, big || crH(bx, bz, 15) < 0.96, vary(WALL[Math.floor(crH(bx, bz, 12) * WALL.length)], R, 0.05));
      nBld++; CR.block(bx, bz, Lb, Wb, ang); exclPush(bx, bz, Math.max(Lb, Wb) / 2 + 2);
    }
    // (no houses where OpenStreetMap has no footprints: only what is in the map)

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
        if (seaD(px, pz) > -1 || naSR(px, pz)) continue; CR.avoid(px, pz, 0.45);
        cyl(gg, px, py, pz, 0.06, 6, 5, [0.86, 0.86, 0.88]); API.flags.add(px, py + 5.6, pz, T.hd[ii], [FL[Math.floor(crH(d, side, 5) * FL.length)]], 1.2, 0.8);   // (waving: js/world-zastave.js)
      }
    }
    let nFans = 0;
    {   // few spectators (fewFans): at the start, under the fortress, at the finish
      const runs = [[-100, 120, 2, 0.4], [dFin - 90, dFin + 20, 2, 0.35]];
      const at = { 'Amfiteater': [80, 2, 0.35] };
      for (const q of T.names) { const a = at[q.n]; if (a) runs.push([q.d - 40, q.d + a[0], a[1], a[2]]); }
      const okSide = (s, side) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 2.5), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; return seaD(x, z) < -3; };
      for (const [a, b, rows, dens] of runs) for (const side of [-1, 1]) {
        for (let s0 = a; s0 < b; s0 += 30) { const s1 = Math.min(b, s0 + 30); if (!okSide(sAt((s0 + s1) / 2), side)) continue;
          nFans += crowdRun(CR, sAt(s0), sAt(s0) + (s1 - s0), side, { rows, dens, first: 1.0, excluded }); }
      }
    }

    /* ---- the trees, within 60 m of the road only: the olive groves in their rows on the plain, palms, bushes on the scrub,
       palms and olives between the houses; the ground under the crowns turns to leaf litter (G.cov) ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const WIND = { value: 0 }; out.dyn.wind = WIND;
    tMat.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = WIND;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
        '#ifdef USE_INSTANCING\nfloat wPh = instanceMatrix[3].x * 0.07 + instanceMatrix[3].z * 0.05;\n#else\nfloat wPh = 0.0;\n#endif\n' +
        'float wK = position.y * position.y * 0.018;\ntransformed.x += wK * sin( uWind * 1.1 + wPh );\ntransformed.z += wK * 0.6 * sin( uWind * 0.83 + wPh * 1.7 );');
    };
    tMat.customProgramCacheKey = () => 'ejTreeWind';
    const TK = [new IChunks(ejTreeGeo(0), tMat, 256), new IChunks(ejTreeGeo(1), tMat, 256), new IChunks(ejTreeGeo(2), tMat, 256)];
    let nTrees = 0;
    const NEAR = 60;
    const plant = (sp, x, z, hgt, wid, c) => {   // sp: 0 palm, 1 olive, 2 old olive, 3 a bush (sunk)
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
          const p = cl === 1 ? 0.6 : cl === 2 ? 0.35 : cl === 3 ? 0.08 : 0.3;
          if (h1 > p) continue;
          const nn = nrNear(x, z), ni = nn.i, ndd = nn.dd; if (ni >= 0 && ndd < 3) continue;
          if (excluded(x, z) || seaD(x, z) > -2 || inFort(x, z, 6)) continue;
          const hq = crH(x, z, 25), hs = crH(x, z, 26), cv = 0.86 + crH(x, z, 27) * 0.28, col = [cv * (0.95 + hq * 0.1), cv, cv * (0.94 + hs * 0.1)];
          let sp;
          if (cl === 1) sp = hs < 0.3 ? 0 : hs < 0.85 ? 1 : 2;
          else if (cl === 2) sp = hs < 0.7 ? 3 : hs < 0.85 ? 2 : 1;
          else if (cl === 3) sp = hs < 0.5 ? 0 : hs < 0.9 ? 1 : 2;
          else sp = hs < 0.04 ? 0 : hs < 0.75 ? 1 : 2;   // (the olive groves)
          const hgt = sp === 0 ? 9 + hq * 6 : sp === 1 ? 4 + hq * 2.5 : sp === 2 ? 5 + hq * 2 : 1.3 + hq * 1.6;
          const wid = sp === 0 ? hgt * 0.9 : sp === 1 ? hgt * (0.9 + hs * 0.2) : sp === 2 ? hgt * (1.3 + hs * 0.2) : hgt * 1.2;
          if (ni >= 0 && ndd < 3 + wid * 0.3 && sp !== 3) continue;   // (no crown over the barriers)
          plant(sp, x, z, hgt, wid, col);
        }
      }
      for (const [x, z] of LD.trees) {   // OSM's single trees (palms and olives in the town)
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
        const mx = (ax + bx) / 2, mz = (az + bz) / 2, nn = nrNear(mx, mz); if ((nn.i >= 0 && nn.dd < 0.8) || naSR(mx, mz) || naSR(ax, az) || naSR(bx, bz)) continue;
        const y = nrGround(mx, mz), ang = Math.atan2(bz - az, bx - ax), g = scen.get(mx, mz);
        if (k === 2) box(g, mx, y - 0.2, mz, len + 0.3, 1.6, 1.1, ang, vary([0.28, 0.4, 0.2], R, 0.08), [0.32, 0.44, 0.22], true);
        else box(g, mx, y - 0.4, mz, len + 0.2, k === 1 ? 1.8 : 1.5, 0.35, ang, vary([0.94, 0.92, 0.88], R, 0.04), [0.9, 0.88, 0.84], true);
      }
    }

    /* ---- the far land beyond the corridor (200 m cells): the olive groves and the plain, a little lower so its edge hides under the near tiles ---- */
    {
      const F = LD.far, bin = atob(F.b64), n = F.n, H = (i, j) => F.lo + bin.charCodeAt(clamp(j, 0, n - 1) * n + clamp(i, 0, n - 1)) * F.step, gf = new GB();
      const colF = (h, x, z) => { const t = clamp(h / 120, 0, 1), k = 0.9 + crH(Math.floor(x / 200), Math.floor(z / 200), 3) * 0.15; return [lerp(0.78, 0.6, t) * k, lerp(0.7, 0.58, t) * k, lerp(0.52, 0.42, t) * k]; };
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
        if (SR) SR.robovi(gv, c0, Math.min(c0 + RC, N), API.nrGCol);
        addM(gv, gMat);
      }
      if (SR) {
        const sMat = aMat.clone(); for (const g of SR.asfalt(RB, API.nrGCol)) { const m = addM(g, sMat); if (m) m.userData.stranska = 1; }
        nStb = SR.predmeti((x, z) => { const g = scen.get(x, z); return { quadO: (...a) => g.quadO(...a), triO: (...a) => g.triO(...a), quadUp() {}, triUp() {} }; }); out.stebricki = SR.stebricki;
      }
      G.col = G.cov = P.edge = null;   // (build only)
    }

    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    const rob = World.ext.eljemRob ? World.ext.eljemRob({ scen, excluded, root, matV, inFort: (x, z) => fortW(x, z) > 0 }) : null;   // (the roadside ground from the camera behind the car: js/world-realizem-bt4.js)
    scen.addTo(sceneryGroup, matV, true, true);
    crowdFinish(CR, root, out);
    out.stats = { tiles: nTiles, trees: nTrees, buildings: nBld, stone: nStone, fans: nFans, rocks: 0, rob };   // (read by the tests)
    if (SR) Object.assign(out.stats, { stranske: SR.n, stebricki: nStb });
    return out;
  }

  World.ext.eljem = (scene, tex, opts) => buildElJem(scene, tex, opts);
})();
