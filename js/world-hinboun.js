/* =========================================================================
   WORLD — Phou Hin Boun (theme 'hinboun'): a mountain road in Laos on today's road 8, up through the limestone karst of Phou Hin Boun and down
   into the valley (docs/proge/hinboun.md). Its own builder (World.ext.hinboun) in a file of its own, on World's shared corridor helpers
   (World.api: nrPrep's terrain from the track's dem and land cover, as Luanda) and the scenery data of js/data/hinboun.js (OpenStreetMap,
   Copernicus DEM, ESA WorldCover, Meta / WRI canopy).
   The 60 m rule: the detailed things only within ~60 m of the road, as far as the chase camera sees them: the tropical forest on the slopes
   (round crowns, tall emergent trees, palms and bushes), the grey limestone boulders and outcrops of the karst, the road's low concrete
   barriers, and by the lookout at the top of the climb the stone forest: a field of grey karst pinnacles (the model of
   assets/landmarks/hinboun.glb, made in Blender by tools/znamenitost/, World.znamenitost; until it has loaded, or if it cannot, the simpler
   one built here). Farther out only the terrain from the heights and the far land. Only geographic and plain names (no people, events,
   firms or brands).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, NRC, RB, TAU, atS, atSf, box, clamp, cone, crH, crowdCtx, crowdFinish, crowdRun, cyl,
    ico, lerp, nrDist, nrGround, nrLC, nrLCf, nrLump, nrNear, nrPrep, nrShade, nrTileGeo, nrTileOn, rng,
    sstep, valueNoise2, vary
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  // ---- the trees (unit height 1, instanced): 0 a palm (by the villages and the clearings), 1 a round crown (the forest's trees; squat and sunk:
  //      the bushes), 2 a tall emergent tree (a slender pale trunk, a high layered crown above the canopy) ----
  function hbTreeGeo(kind) {
    const g = new GB(), R = rng(1675 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    const bark = [0.5, 0.44, 0.36];
    if (kind === 0) {
      const lf = [0.28, 0.5, 0.2], lfD = [0.2, 0.4, 0.15], lean = 0.08;
      cyl(g, 0, -0.02, 0, 0.025, 0.5, 5, bark, null, 0.021); cyl(g, lean * 0.5, 0.48, 0, 0.021, 0.48, 5, [0.56, 0.5, 0.4], null, 0.018);
      const n = 8, tx = lean, ty = 0.95;
      for (let k = 0; k < n; k++) {
        const a = k / n * TAU + R() * 0.3, Lf = 0.24 + R() * 0.06, w = 0.045, c = k % 2 ? lf : lfD;
        const mid = [tx + Math.cos(a) * Lf * 0.5, ty + 0.05, Math.sin(a) * Lf * 0.5], tip = [tx + Math.cos(a) * Lf, ty - 0.12 - R() * 0.06, Math.sin(a) * Lf];
        const pl = [mid[0] - Math.sin(a) * w, mid[1], mid[2] + Math.cos(a) * w], pr = [mid[0] + Math.sin(a) * w, mid[1], mid[2] - Math.cos(a) * w], base = [tx, ty, 0], up = [tx, ty - 1, 0];
        g.triO(base, pl, mid, c, up); g.triO(base, mid, pr, c, up); g.triO(pl, tip, mid, c, up); g.triO(mid, tip, pr, c, up);
      }
    } else if (kind === 1) {
      cyl(g, 0, -0.02, 0, 0.035, 0.42, 4, bark, null, 0.026);
      ico(g, 0, 0.62, 0, 0.44, 0.74, [0.24, 0.38, 0.17], R, 0.24);
    } else {
      cyl(g, 0, -0.02, 0, 0.034, 0.7, 5, [0.66, 0.62, 0.54], null, 0.022);
      ico(g, 0, 0.84, 0, 0.36, 0.3, [0.22, 0.36, 0.16], R, 0.28); nrLump(g, 0.16, 0.74, -0.1, 0.22, 0.42, [0.26, 0.4, 0.18], R, 0.2);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }

  function hbGroundTex() {   // the ground under the vertex colours (256 px = 14 m, tileable): a dark earthy tone with flecks
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), r = rng(1676), img = x.createImageData(S, S), d = img.data;
    const n1 = valueNoise2(1677, 40), n2 = valueNoise2(1678, 9), wr = (f, i, j) => { const u = i / S, v = j / S; return f(i, j) * (1 - u) * (1 - v) + f(i - S, j) * u * (1 - v) + f(i, j - S) * (1 - u) * v + f(i - S, j - S) * u * v; };
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const o = (j * S + i) * 4, k = 0.78 + wr(n1, i, j) * 0.16 + wr(n2, i, j) * 0.1 + (r() - 0.5) * 0.12;
      d[o] = Math.min(255, 186 * k); d[o + 1] = Math.min(255, 178 * k); d[o + 2] = Math.min(255, 150 * k); d[o + 3] = 255; }
    x.putImageData(img, 0, 0);
    for (let k = 0; k < 500; k++) { const px = r() * S, py = r() * S, g = 80 + r() * 60; x.fillStyle = `rgba(${g + 14},${g},${g - 16},0.35)`; x.fillRect(px, py, 1 + r() * 2, 1 + r() * 2); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  }

  function buildHinboun(scene, tex, opts) {
    const R = rng(1675), N = T.N, ds = T.ds, sStart = T.startS, sFin = T.finishS, iE = N - 1, def = T.def, L = T.len, LD = HB_DATA;
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
    // what keeps the trees and the blocks off (the stone forest, the crowds, the start), hashed circles
    const eh = new Map(), EHC = 32;
    const exclPush = (x, z, r) => { const e = { x, z, r }; for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); } };
    const excluded = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (const e of Lc) if ((x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; return false; };


    // ---- the stone forest by the lookout (LD.kras: the model's centre about 50 m from the road towards the lookout, the road's heading there,
    //      its place s on the road) ----
    const KR = LD.kras || null, KRR = 46;   // (m: the reach of the field of pinnacles)
    const inKras = (x, z, m) => !!KR && (x - KR[0]) ** 2 + (z - KR[1]) ** 2 < (KRR + m) ** 2;
    // the ground's colours (the end of the rainy season in the karst of Laos): the red-brown soil, green grass and the rice fields of the valley,
    // the forest's canopy farther out and the leaf litter under the crowns near the road, the grey limestone on the steep banks
    P.colFn = (x, z, ny, dd, cov, o) => {
      const m = P.n3(x, z), q = P.n4(x, z), fo = nrLCf(x, z, 1), sc = nrLCf(x, z, 2), se = nrLCf(x, z, 3);
      let r = 0.62 + (m - 0.5) * 0.14, g = 0.5 + (m - 0.5) * 0.1 + (q - 0.5) * 0.06, b = 0.36 + (q - 0.5) * 0.06;   // (the red-brown soil)
      const gr = sstep(0.35, 0.8, P.n2(x, z)) * 0.8; r = lerp(r, 0.46, gr); g = lerp(g, 0.6, gr); b = lerp(b, 0.28, gr);   // (green grass)
      r = lerp(r, 0.42, sc * 0.6); g = lerp(g, 0.52, sc * 0.6); b = lerp(b, 0.26, sc * 0.6);
      const cv = clamp(cov, 0, 1), can = fo * (1 - cv);
      r = lerp(r, 0.24 + m * 0.05, can * 0.85); g = lerp(g, 0.36 + m * 0.05, can * 0.85); b = lerp(b, 0.18, can * 0.85);
      r = lerp(r, 0.46, cv * 0.8); g = lerp(g, 0.4, cv * 0.8); b = lerp(b, 0.3, cv * 0.8);
      const k = 0.96 + (q - 0.5) * 0.12; r = lerp(r, 0.7 * k, se * 0.5); g = lerp(g, 0.62 * k, se * 0.5); b = lerp(b, 0.52 * k, se * 0.5);
      const rk = sstep(0.9, 0.66, ny) * 0.95;   // (the grey limestone of the steep banks)
      r = lerp(r, 0.66 + q * 0.06, rk); g = lerp(g, 0.65 + q * 0.05, rk); b = lerp(b, 0.62 + q * 0.04, rk);
      if (dd < 4) { const t = sstep(4, 0.5, dd); r = lerp(r, 0.7, t); g = lerp(g, 0.6, t); b = lerp(b, 0.48, t); }
      o[0] = r; o[1] = g; o[2] = b; return o; };
    const gMat = new THREE.MeshLambertMaterial({ map: ownTex(hbGroundTex()), vertexColors: true });
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

    /* ---- the barriers (Core's T.bl / T.br) drawn as the mountain road's low concrete barriers; at the start and at the finish white walls with a catch
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


    /* ---- the stone forest by the lookout: the simple one (one mesh) until the model of assets/landmarks/hinboun.glb has loaded
       (World.znamenitost): grey pointed pinnacles of limestone on the ground, taller towards the middle ---- */
    if (KR) {
      const gK = new GB(), RK = rng(1679), lime = [0.7, 0.7, 0.66], limeD = [0.5, 0.5, 0.47];
      for (let k = 0; k < 26; k++) {
        const a = RK() * TAU, rr = Math.sqrt(RK()) * KRR * 0.85, x = KR[0] + Math.cos(a) * rr, z = KR[1] + Math.sin(a) * rr;
        if (nrDist(x, z) < 14) continue;
        const h = 6 + (1 - rr / KRR) * 12 + RK() * 6, r0 = 1.8 + RK() * 2.4, y = nrGround(x, z) - 2;
        cone(gK, x, y, z, r0, h + 2, 7, vary(limeD, RK, 0.06), vary(lime, RK, 0.06), RK() * TAU);
      }
      const km = new THREE.Mesh(gK.geometry(), matV); km.castShadow = km.receiveShadow = true; km.matrixAutoUpdate = false; root.add(km);
      exclPush(KR[0], KR[1], KRR + 4); nStone++;
      out.kras = km; out.marks = { 'Kamniti gozd': [KR[0], KR[1]] };
      if (World.znamenitost) World.znamenitost.add('hinboun', root, { x: KR[0], z: KR[1], fallback: km, out });
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
        CR.avoid(px, pz, 0.45);
        cyl(gg, px, py, pz, 0.06, 6, 5, [0.86, 0.86, 0.88]); API.flags.add(px, py + 5.6, pz, T.hd[ii], [FL[Math.floor(crH(d, side, 5) * FL.length)]], 1.2, 0.8);   // (waving: js/world-zastave.js)
      }
    }
    let nFans = 0;
    {   // few spectators (fewFans): at the start, by the stone forest, at the finish
      const runs = [[-100, 120, 2, 0.4], [dFin - 90, dFin + 20, 2, 0.35]];
      const at = { 'Kamniti gozd': [80, 2, 0.35] };
      for (const q of T.names) { const a = at[q.n]; if (a) runs.push([q.d - 40, q.d + a[0], a[1], a[2]]); }
      for (const [a, b, rows, dens] of runs) for (const side of [-1, 1]) {
        for (let s0 = a; s0 < b; s0 += 30) { const s1 = Math.min(b, s0 + 30);
          nFans += crowdRun(CR, sAt(s0), sAt(s0) + (s1 - s0), side, { rows, dens, first: 1.0, excluded }); }
      }
    }

    /* ---- the trees, within 60 m of the road only: the tropical forest's round crowns and tall emergent trees, bushes on the scrub,
       palms in the clearings and by the fields; the ground under the crowns turns to leaf litter (G.cov) ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const WIND = { value: 0 }; out.dyn.wind = WIND;
    tMat.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = WIND;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
        '#ifdef USE_INSTANCING\nfloat wPh = instanceMatrix[3].x * 0.07 + instanceMatrix[3].z * 0.05;\n#else\nfloat wPh = 0.0;\n#endif\n' +
        'float wK = position.y * position.y * 0.018;\ntransformed.x += wK * sin( uWind * 1.1 + wPh );\ntransformed.z += wK * 0.6 * sin( uWind * 0.83 + wPh * 1.7 );');
    };
    tMat.customProgramCacheKey = () => 'hbTreeWind';
    const TK = [new IChunks(hbTreeGeo(0), tMat, 256), new IChunks(hbTreeGeo(1), tMat, 256), new IChunks(hbTreeGeo(2), tMat, 256)];
    let nTrees = 0;
    const NEAR = 60;
    const plant = (sp, x, z, hgt, wid, c) => {   // sp: 0 palm, 1 round crown, 2 emergent tree, 3 a bush (sunk)
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
          const p = cl === 1 ? 0.7 : cl === 2 ? 0.4 : cl === 3 ? 0.12 : 0.06;
          if (h1 > p) continue;
          const nn = nrNear(x, z), ni = nn.i, ndd = nn.dd; if (ni >= 0 && ndd < 3) continue;
          if (excluded(x, z) || inKras(x, z, 4)) continue;
          const hq = crH(x, z, 25), hs = crH(x, z, 26), cv = 0.86 + crH(x, z, 27) * 0.28, col = [cv * (0.95 + hq * 0.1), cv, cv * (0.94 + hs * 0.1)];
          let sp;
          if (cl === 1) sp = hs < 0.05 ? 0 : hs < 0.78 ? 1 : 2;
          else if (cl === 2) sp = hs < 0.7 ? 3 : hs < 0.9 ? 1 : 0;
          else if (cl === 3) sp = hs < 0.5 ? 0 : hs < 0.9 ? 1 : 2;
          else sp = hs < 0.3 ? 0 : hs < 0.6 ? 1 : 3;
          const hgt = sp === 0 ? 9 + hq * 6 : sp === 1 ? 6 + hq * 4 : sp === 2 ? 16 + hq * 8 : 1.3 + hq * 1.6;
          const wid = sp === 0 ? hgt * 0.9 : sp === 1 ? hgt * (0.9 + hs * 0.2) : sp === 2 ? hgt * (0.7 + hs * 0.2) : hgt * 1.2;
          if (ni >= 0 && ndd < 3 + wid * 0.3 && sp !== 3) continue;   // (no crown over the barriers)
          plant(sp, x, z, hgt, wid, col);
        }
      }
      for (const [x, z] of LD.trees) {   // OSM's single trees
        const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 2.5) continue; if (excluded(x, z)) continue;
        const hgt = 10 + crH(x, z, 28) * 5; plant(0, x, z, hgt, hgt * 0.9, [0.95, 1, 0.95]);
      }
    }
    for (const t of TK) t.addTo(root, true);

    /* ---- the karst by the road within 60 m: grey limestone boulders and outcrops on the forest floor and the banks (none on the road, the
       barriers or the verges), more of them on the steep ground ---- */
    {
      const lime = [0.66, 0.65, 0.6]; let nR = 0;
      for (let s = 20; s < L - 20; s += 9) for (const side of [-1, 1]) {
        const i = T.idx(s), hk = crH(s, side, 31); if (hk > 0.5) continue;
        const o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 4 + crH(s, side, 32) * 40), x = T.px[i] + T.nx[i] * o + (crH(s, side, 33) - 0.5) * 6, z = T.pz[i] + T.nz[i] * o + (crH(s, side, 34) - 0.5) * 6;
        const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 4) continue; if (excluded(x, z)) continue;
        const r0 = 0.8 + crH(s, side, 35) * (hk < 0.12 ? 3.4 : 1.6), y = nrGround(x, z) - r0 * 0.35;
        nrLump(scen.get(x, z), x, y, z, r0, 0.7 + crH(s, side, 36) * 0.6, vary(lime, R, 0.08), R, 0.3); nR++;
      }
      out.rocks = nR;
    }

    /* ---- the far land beyond the corridor (200 m cells): the forested karst, a little lower so its edge hides under the near tiles ---- */
    {
      const F = LD.far, bin = atob(F.b64), n = F.n, H = (i, j) => F.lo + bin.charCodeAt(clamp(j, 0, n - 1) * n + clamp(i, 0, n - 1)) * F.step, gf = new GB();
      const colF = (h, x, z) => { const t = clamp((h - 200) / 900, 0, 1), k = 0.9 + crH(Math.floor(x / 200), Math.floor(z / 200), 3) * 0.15; return [lerp(0.3, 0.42, t) * k, lerp(0.42, 0.46, t) * k, lerp(0.22, 0.32, t) * k]; };
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
      const vg = [0.78, 0.74, 0.6], dirt = [0.82, 0.62, 0.48];
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

  World.ext.hinboun = (scene, tex, opts) => buildHinboun(scene, tex, opts);
})();
