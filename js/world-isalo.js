/* =========================================================================
   WORLD — Isalo (theme 'isalo'): the RN7 across the grass plain at the foot of the Isalo sandstone massif in the south of Madagascar, past
   the rock called the Queen of Isalo (docs/proge/isalo.md). Its own builder (World.ext.isalo) in a file of its own, on World's shared corridor
   helpers (World.api: nrPrep's terrain from the track's dem and land cover, as Luanda) and the scenery data of js/data/isalo.js
   (OpenStreetMap, Copernicus DEM, ESA WorldCover, Meta / WRI canopy).
   The 60 m rule: the detailed things only within ~60 m of the road, as far as the chase camera sees them: the golden grass and the red earth
   of the plain, the eroded sandstone outcrops where the ground rises (their pale ochre, pink and grey blocks, stacked and weathered), the
   fan palms and the small round-crowned trees of the plain, the tufts of the tall grass, white marker posts along the verges, and by the road
   on the left the Queen of Isalo, a sandstone rock like a seated figure with a crown (the model of assets/landmarks/isalo.glb, made in
   Blender by tools/znamenitost/, World.znamenitost; until it has loaded, or if it cannot, the simpler one built here). Farther out only the
   terrain from the heights and the far land with the massif. Only geographic and plain names (no people, events, firms or brands).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, NRC, RB, TAU, atS, atSf, box, clamp, crH, crowdCtx, crowdFinish, crowdRun, cyl, ico, lerp, nrDem, nrDist,
    nrGround, nrLC, nrLCf, nrLump, nrNear, nrPrep, nrShade, nrTileGeo, nrTileOn, rng, sstep, valueNoise2, vary
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });
  const QUEEN = [-1700.6, 851.4];   // the Queen of Isalo (the rock's OSM node, natural=rock), 30 m left of the road at 2.0 km

  // ---- the trees (unit height 1, instanced): 0 a fan palm (a stout grey trunk, a round head of stiff fan leaves), 1 a small round-crowned
  //      tree of the plain, 2 a tuft of the tall dry grass (squat, sunk) ----
  function isTreeGeo(kind) {
    const g = new GB(), R = rng(2210 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    if (kind === 0) {
      const bark = [0.56, 0.54, 0.5], lf = [0.6, 0.68, 0.62], lfD = [0.48, 0.56, 0.5];
      cyl(g, 0, -0.02, 0, 0.05, 0.62, 6, bark, null, 0.042);
      const n = 14, ty = 0.66;
      for (let k = 0; k < n; k++) {   // (the fans: stiff blades all round, a little drooping, bluish grey-green)
        const a = k / n * TAU + R() * 0.2, el = (k % 3 - 1) * 0.35 + 0.25, Lf = 0.3 + R() * 0.05, c = k % 2 ? lf : lfD;
        const dx = Math.cos(a) * Math.cos(el), dz = Math.sin(a) * Math.cos(el), dy = Math.sin(el), w = 0.14;
        const base = [0, ty, 0], tip = [dx * Lf, ty + dy * Lf, dz * Lf], pl = [dx * Lf * 0.75 - dz * w, ty + dy * Lf * 0.75 + 0.03, dz * Lf * 0.75 + dx * w], pr = [dx * Lf * 0.75 + dz * w, ty + dy * Lf * 0.75 + 0.03, dz * Lf * 0.75 - dx * w];
        const up = [0, ty - 1, 0]; g.triO(base, pl, tip, c, up); g.triO(base, tip, pr, c, up);
      }
      for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.4; cyl(g, Math.cos(a) * 0.05, 0.46, Math.sin(a) * 0.05, 0.02, 0.2, 4, [0.62, 0.56, 0.44], null, 0.012); }   // (the old leaf bases under the head)
    } else if (kind === 1) {
      cyl(g, 0, -0.02, 0, 0.04, 0.45, 5, [0.36, 0.3, 0.26], null, 0.028);
      ico(g, 0, 0.66, 0, 0.42, 0.62, [0.3, 0.38, 0.18], R, 0.24); nrLump(g, 0.16, 0.7, 0.1, 0.24, 0.6, [0.34, 0.42, 0.2], R, 0.2);
    } else {
      ico(g, 0, 0.42, 0, 0.5, 0.9, [0.78, 0.66, 0.4], R, 0.32);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function isGroundTex() {   // the ground under the vertex colours (256 px = 14 m, tileable): straw with streaks of the grass and red flecks
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), r = rng(2213), img = x.createImageData(S, S), d = img.data;
    const n1 = valueNoise2(2214, 40), n2 = valueNoise2(2215, 9), wr = (f, i, j) => { const u = i / S, v = j / S; return f(i, j) * (1 - u) * (1 - v) + f(i - S, j) * u * (1 - v) + f(i, j - S) * (1 - u) * v + f(i - S, j - S) * u * v; };
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const o = (j * S + i) * 4, k = 0.78 + wr(n1, i, j) * 0.16 + wr(n2, i, j) * 0.1 + (r() - 0.5) * 0.12;
      d[o] = Math.min(255, 214 * k); d[o + 1] = Math.min(255, 196 * k); d[o + 2] = Math.min(255, 160 * k); d[o + 3] = 255; }
    x.putImageData(img, 0, 0);
    for (let k = 0; k < 900; k++) { const px = r() * S, py = r() * S, g = 150 + r() * 70; x.strokeStyle = `rgba(${g + 20},${g},${g - 50},0.35)`; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 3, py - 2 - r() * 4); x.stroke(); }
    for (let k = 0; k < 300; k++) { const px = r() * S, py = r() * S; x.fillStyle = `rgba(${150 + r() * 40},${70 + r() * 30},${40},0.3)`; x.fillRect(px, py, 1 + r() * 2, 1 + r() * 2); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  }

  function buildIsalo(scene, tex, opts) {
    const R = rng(2210), N = T.N, ds = T.ds, sStart = T.startS, sFin = T.finishS, iE = N - 1, def = T.def, L = T.len, LD = IS_DATA;
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
    // what keeps the trees and the rocks off (the Queen, the crowds, the start), hashed circles
    const eh = new Map(), EHC = 32;
    const exclPush = (x, z, r) => { const e = { x, z, r }; for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); } };
    const excluded = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (const e of Lc) if ((x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; return false; };

    // ---- the ground under the Queen (14 m round) as the heights are, without the far terrain's noise, so that the model (built on the
    //      same heights) stands on it ----
    const [QX, QZ] = QUEEN, QR = 14;
    const queenW = (x, z) => { const d = Math.hypot(x - QX, z - QZ); return d > QR + 10 ? 0 : sstep(QR + 10, QR, d); };
    P.pad = (x, z, h) => { const w = queenW(x, z); return w > 0 ? lerp(h, nrDem(x, z), w) : h; };
    // the ground's colours (the dry season on the plain under the massif): the golden grass in patches of straw and paler, the red earth where
    // the grass is thin, the greener scrub and the trees' canopy in the gullies, the sandstone of the steep slopes (pale ochre and pink)
    P.colFn = (x, z, ny, dd, cov, o) => {
      const m = P.n3(x, z), q = P.n4(x, z), fo = nrLCf(x, z, 1), sc = nrLCf(x, z, 2);
      let r = 0.98 + (m - 0.5) * 0.16, g = 0.82 + (m - 0.5) * 0.12 + (q - 0.5) * 0.06, b = 0.5 + (q - 0.5) * 0.08;
      const pale = sstep(0.55, 0.85, P.n2(x, z)) * 0.5; r = lerp(r, 1.04, pale); g = lerp(g, 0.94, pale); b = lerp(b, 0.66, pale);   // (the paler grass)
      const red = sstep(0.62, 0.86, P.n7(x, z)) * 0.7; r = lerp(r, 0.86, red); g = lerp(g, 0.5, red); b = lerp(b, 0.34, red);   // (the red earth)
      r = lerp(r, 0.7, sc * 0.5); g = lerp(g, 0.68, sc * 0.5); b = lerp(b, 0.38, sc * 0.5);
      const cv = clamp(cov, 0, 1), can = fo * (1 - cv);
      r = lerp(r, 0.4 + m * 0.06, can * 0.8); g = lerp(g, 0.44 + m * 0.05, can * 0.8); b = lerp(b, 0.24, can * 0.8);
      r = lerp(r, 0.66, cv * 0.7); g = lerp(g, 0.56, cv * 0.7); b = lerp(b, 0.38, cv * 0.7);
      const rk = sstep(0.92, 0.7, ny) * 0.95;
      r = lerp(r, 0.9 + q * 0.06, rk); g = lerp(g, 0.7 + q * 0.06, rk); b = lerp(b, 0.54 + q * 0.04, rk);
      if (dd < 4) { const t = sstep(4, 0.5, dd); r = lerp(r, 0.9, t); g = lerp(g, 0.7, t); b = lerp(b, 0.52, t); }   // (the red dust of the verges)
      o[0] = r; o[1] = g; o[2] = b; return o; };
    // another module's colours for the same structure (js/world-realizem9.js): World.isaloHooks.colFn(P, opts) returns a colFn or nothing
    { const H = World.isaloHooks; const f = H && typeof H.colFn === 'function' ? H.colFn(P, opts) : null; if (typeof f === 'function') P.colFn = f; }
    const gMat = new THREE.MeshLambertMaterial({ map: ownTex(isGroundTex()), vertexColors: true });
    const tiles = [];
    for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { const on = nrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; tiles.push(ti, tj, on); }

    /* ---- the verges between the asphalt, the barriers and the terrain (lifted onto the ground where it rises) ---- */
    const vergeRow = (i, side) => {
      const w = T.wAt(i), bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i], lift = (o, h) => { const q = side * o, g = nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.06 - y; return [o, Math.max(h, g)]; };
      return [[w, 0.0], [w + 0.8, -0.04], lift(Math.max(w + 1.2, bar - 0.5), -0.08), lift(bar + 2.6, -0.2), lift(bar + 4.2, -0.4)];
    };

    /* ---- the side roads of OpenStreetMap at the road (World.cesta.stranske, as Livorno: look only; T.bl / T.br, the bank and the driving
       stay as they are): their asphalt up to ~60 m, the mouths with the posts, the edge line and the bank open at each mouth ---- */
    const fA = (f) => Math.min(N - 2, Math.max(0, Math.floor(f)));
    const PtF = (f, o, y) => { const a = fA(f), t = clamp(f - a, 0, 1); if (t < 1e-4) return Pt(a, o, y); if (t > 1 - 1e-4) return Pt(a + 1, o, y); const p = Pt(a, o, y), q = Pt(a + 1, o, y); return [lerp(p[0], q[0], t), lerp(p[1], q[1], t), lerp(p[2], q[2], t)]; };
    const barF = (f, side) => { const a = fA(f), t = clamp(f - a, 0, 1), B = side > 0 ? T.br : T.bl; return t < 1e-4 ? B[a] : t > 1 - 1e-4 ? B[a + 1] : lerp(B[a], B[a + 1], t); };
    const wF = (f) => { const a = fA(f), t = clamp(f - a, 0, 1); return t < 1e-4 ? T.wAt(a) : t > 1 - 1e-4 ? T.wAt(a + 1) : lerp(T.wAt(a), T.wAt(a + 1), t); };
    const edgeL = (f, si) => { const w = wF(f); return si ? [PtF(f, w - 0.36, 0.034), PtF(f, w - 0.22, 0.034)] : [PtF(f, -w + 0.22, 0.034), PtF(f, -w + 0.36, 0.034)]; };
    const vergeAt = (i, side, d) => { const pr = vergeRow(i, side); for (let k = 1; k < pr.length; k++) if (d <= pr[k][0]) return lerp(pr[k - 1][1], pr[k][1], clamp((d - pr[k - 1][0]) / (pr[k][0] - pr[k - 1][0] || 1), 0, 1)); return -9; };
    const SR = World.cesta && World.cesta.stranske && def.stranske && def.stranske.length ? World.cesta.stranske(T, def.stranske, { tla: nrGround, rob: vergeAt, ton: (i) => 0.82 * secT[i] - 0.03, odprta: true, barva: false }) : null;
    const tek = (si, bit, a, b) => (SR ? SR.tek(si, bit, a, b) : [Array.from({ length: b - a + 1 }, (_, k) => a + k)]);
    const naSR = (x, z) => { if (SR) for (const k of SR.krogi) if ((x - k[0]) ** 2 + (z - k[1]) ** 2 < k[2] * k[2]) return true; return false; };
    let nStb = 0;
    if (SR) { out.cestaRob = (out.cestaRob || []).concat(SR.ustja); for (const k of SR.krogi) exclPush(k[0], k[1], k[2]); out.stranske = SR.n; }

    /* ---- the road: asphalt (patched in sections, darker on the racing line), white edge lines and the centre line by the country's rules
       (World.cesta's crte); the chequered lines at the start and at the finish ---- */
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const RC = 128, tileL = 8, secT = new Float32Array(N), CZ = World.cesta ? World.cesta.crte(T, { r: 140, pred: 40 }) : null, CL = CZ ? CZ.at : null;
    for (let i0 = 0, k = 0; i0 < N; k++) { const n = 50 + Math.floor(crH(k, 3, 41) * 70), t = 0.88 + crH(k, 5, 41) * 0.16; for (let i = i0; i < Math.min(N, i0 + n); i++) secT[i] = t; i0 += n; }
    const shade = (i, o, w) => { const rl = T.rl[i]; let k = (0.82 - 0.1 * Math.exp(-((o - rl) * (o - rl)) / 5)) * secT[i]; if (Math.abs(o) > w * 0.9) k -= 0.03; return [k * 1.02, k, k * 0.97]; };
    for (let c0 = 0; c0 < N - 1; c0 += RC) {
      const gr = new RB(true), gl = new RB(); let pr = -1, pl = -1, pc = 0;
      for (let i = c0; i <= Math.min(c0 + RC, N - 1); i++) {
        const w = T.wAt(i), offs = [-w, -w / 2, 0, w / 2, w], v = i * ds / tileL;
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o, w)), offs.map(o => [(o + w) / tileL, v])); if (pr >= 0) gr.link(pr, r, 0, 4); pr = r;
        const wl = [0.9, 0.9, 0.86], cl = CL ? CL[i] : 0, e0 = SR ? 0 : 4, lp = SR ? [] : [Pt(i, -w + 0.22, 0.034), Pt(i, -w + 0.36, 0.034), Pt(i, w - 0.36, 0.034), Pt(i, w - 0.22, 0.034)];
        if (cl) lp.push(Pt(i, -0.07, 0.034), Pt(i, 0.07, 0.034));
        if (!lp.length) { pl = -1; pc = 0; continue; }
        const l = gl.row(lp, lp.map(() => wl));
        if (pl >= 0) { if (!SR) { gl.link(pl, l, 0, 1); gl.link(pl, l, 2, 3); } if (cl && pc) gl.link(pl, l, e0, e0 + 1); } pl = l; pc = cl;
      }
      if (SR) { const wx = [0.9, 0.9, 0.86]; for (const si of [0, 1]) for (const run of tek(si, 2, c0, Math.min(c0 + RC, N - 1))) { let p = -1; for (const f of run) { const l = gl.row(edgeL(f, si), [wx, wx]); if (p >= 0) gl.link(p, l, 0, 1); p = l; } } }
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

    /* ---- the barriers (Core's T.bl / T.br): on the open plain a low earth bank with white marker posts on it (the posts every 25 m, the bank
       keeps the car on the road as the walls do elsewhere); at the start and at the finish white walls with a catch fence and the crowd behind
       it; a barrier across the road at both its ends ---- */
    const finA = dFin + 60, startArea = (i) => { const d = dS(i * ds); return d < 140 || (d > dFin - 100 && d < finA); };   // (the walls end 60 m past the line: the plain beyond it has the bank)
    const kindAt = (i) => (startArea(i) ? 1 : 0);   // 0 the low bank, 1 white wall and fence
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const bank = [0.8, 0.6, 0.42], bankT = [0.86, 0.74, 0.48], wh = [0.92, 0.92, 0.9], whD = [0.74, 0.74, 0.72];
    const wallRow = (gr, f, side, k) => {
      const i = Math.floor(f), bar = barF(f, side), tone = 0.94 + crH(i >> 3, side, 73) * 0.1;
      let p, c;
      if (k === 1) { const o = side * (bar + 0.1), o2 = side * (bar + 0.5); p = [PtF(f, o, -0.5), PtF(f, o, 1.07), PtF(f, o, 1.15), PtF(f, o2, 1.15)]; c = [whD, wh, wh, wh]; }
      else { const o = side * (bar - 0.4), o1 = side * (bar + 0.2), o2 = side * (bar + 1.4); p = [PtF(f, o, -0.1), PtF(f, o1, 0.62), PtF(f, o2, 0.62), PtF(f, side * (bar + 2.4), -0.3)]; c = [bank.map(v => v * tone), bankT.map(v => v * tone), bankT.map(v => v * tone), bank.map(v => v * tone * 0.9)]; }
      if (side < 0) { p = p.reverse(); c = c.slice().reverse(); }
      return gr.row(p, c);
    };
    for (let c0 = 0; c0 < N - 1; c0 += RC) {
      const gr = new RB();
      for (const side of [-1, 1]) for (const run of tek(side > 0 ? 1 : 0, 1, c0, Math.min(c0 + RC, N - 1))) {
        let prev = -1, pk = -1;
        for (const f of run) {
          const i = fA(f) + (f >= N - 1 ? 1 : 0), k = kindAt(i);
          if (prev >= 0 && k !== pk) { gr.link(prev, wallRow(gr, f, side, pk), 0, 3); prev = -1; }
          const r = wallRow(gr, f, side, k); if (prev >= 0) gr.link(prev, r, 0, 3); prev = r; pk = k;
        }
      }
      addM(gr, rMat, true);
    }
    const scen = new Chunks(128);
    for (let d = 140; d < L - sStart - 2; d += 25) if (d < dFin - 100 || d > finA) for (const side of [-1, 1]) {   // the white marker posts on the bank (a red band on top)
      const i = T.idx(sAt(d)), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.4), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, g = scen.get(x, z), y = T.hy[i] + 0.5;
      if (naSR(x, z) || (SR && SR.rez[side > 0 ? 1 : 0][i] & 1)) continue;
      box(g, x, y, z, 0.18, 0.75, 0.18, T.hd[i], [0.94, 0.94, 0.92]); box(g, x, y + 0.75, z, 0.19, 0.18, 0.19, T.hd[i], [0.78, 0.16, 0.14]);
    }
    for (const [i, dir] of [[0, -1], [iE, 1]]) {   // (the barrier across the road at each end: Core's invisible end walls made visible)
      const eX = T.px[i] + T.tx[i] * 1.2 * dir, eZ = T.pz[i] + T.tz[i] * 1.2 * dir;
      for (let o = -T.bl[i]; o <= T.br[i]; o += 2.05) { const bx = eX + T.nx[i] * o, bz = eZ + T.nz[i] * o; box(scen.get(bx, bz), bx, T.hy[i] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[i], [0.78, 0.77, 0.74], [0.86, 0.85, 0.82]); }
    }
    {   // the catch fence along the white walls at the start and the finish
      const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide }), gf = new RB(true);
      for (const [d0, d1] of [[-110, 140], [dFin - 100, finA]]) for (const side of [-1, 1]) { let pr = -1, acc = 0;
        for (let d = d0; d <= d1; d += 2) { const i = T.idx(sAt(d)), bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.15); if (SR && SR.rez[side > 0 ? 1 : 0][i] & 1) { pr = -1; continue; }
          let p = [Pt(i, o, 1.1), Pt(i, o, 3.8)]; if (side < 0) p = p.reverse();
          const r = gf.row(p, [W1, W1], [[acc / 3, 0], [acc / 3, 1]]); if (pr >= 0) gf.link(pr, r, 0, 1); pr = r; acc += 2; } }
      addM(gf, fMat);
    }

    const CR = crowdCtx({ gH: nrGround, near: (x, z) => nrNear(x, z).dd, maxSlope: 0.7 });
    let nStone = 0;

    /* ---- the Queen of Isalo: the simple one (one mesh) until the model of assets/landmarks/isalo.glb has loaded (World.znamenitost): a
       weathered sandstone block, on it the seated figure's body and shoulders, the head and its knobs (the crown), a scree of blocks at
       its foot ---- */
    {
      const gQ = new GB(), y = nrDem(QX, QZ), sa = [0.86, 0.68, 0.5], saD = [0.7, 0.54, 0.42], saG = [0.62, 0.58, 0.52], Rq = rng(2220), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = false;
      ico(gQ, QX, y + 1.2, QZ, 5.6, 0.45, saD, Rq, 0.18);   // (the block)
      ico(gQ, QX + 0.4, y + 4.6, QZ - 0.3, 3.2, 1.0, sa, Rq, 0.14);   // (the body)
      ico(gQ, QX - 1.6, y + 5.6, QZ + 0.2, 1.6, 0.8, saD, Rq, 0.15); ico(gQ, QX + 2.4, y + 5.6, QZ - 0.6, 1.6, 0.8, saD, Rq, 0.15);   // (the shoulders)
      ico(gQ, QX + 0.4, y + 8.6, QZ - 0.3, 1.5, 1.15, sa, Rq, 0.1);   // (the head)
      for (let k = 0; k < 3; k++) ico(gQ, QX + 0.4 + (k - 1) * 0.8, y + 10.3 + (k === 1 ? 0.3 : 0), QZ - 0.3, 0.45, 1.5, saG, Rq, 0.1);   // (the crown)
      for (let k = 0; k < 9; k++) { const a = Rq() * TAU, d = 5 + Rq() * 4, bx = QX + Math.cos(a) * d, bz = QZ + Math.sin(a) * d; nrLump(gQ, bx, nrDem(bx, bz) - 0.3, bz, 0.6 + Rq() * 1.1, 0.7, vary(saD, Rq, 0.08), Rq, 0.25); }
      API.ROCK_SMOOTH = rs;
      const qm = new THREE.Mesh(gQ.geometry(), matV); qm.castShadow = qm.receiveShadow = true; qm.matrixAutoUpdate = false; root.add(qm);
      exclPush(QX, QZ, QR); nStone++;
      out.queen = qm; out.marks = { 'Kraljica Isala': QUEEN.slice() };
      if (World.znamenitost) World.znamenitost.add('isalo', root, { x: QX, z: QZ, fallback: qm, out });
    }

    /* ---- the sandstone outcrops within 60 m of the road: where the ground rises steeply (the massif's foot) and in patches on the plain,
       groups of weathered blocks, stacked, pale ochre and pink with grey crusts ---- */
    {
      const RK = [[0.86, 0.66, 0.5], [0.88, 0.72, 0.58], [0.74, 0.62, 0.54], [0.66, 0.6, 0.54]], Lt = NRC * 32; let nR = 0;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt; zz += 14) for (let xx = xa; xx < xa + Lt; xx += 14) {
          const x = xx + (crH(xx, zz, 51) - 0.5) * 10, z = zz + (crH(xx, zz, 52) - 0.5) * 10, rd = nrDist(x, z);
          if (rd < 9 || rd > 60 || excluded(x, z)) continue;
          const e = 3, sl = Math.hypot(nrDem(x + e, z) - nrDem(x - e, z), nrDem(x, z + e) - nrDem(x, z - e)) / (2 * e);
          const p = sl > 0.35 ? 0.8 : sl > 0.2 ? 0.35 : sstep(0.66, 0.9, P.n2(x, z)) * 0.18;
          if (crH(x, z, 53) > p) continue;
          const g = scen.get(x, z), big = sl > 0.25 && rd > 18, r0 = (big ? 2.2 : 1.0) + crH(x, z, 54) * (big ? 3.2 : 1.6), y = nrGround(x, z), c = RK[Math.floor(crH(x, z, 55) * RK.length)];
          nrLump(g, x, y - r0 * 0.3, z, r0, big ? 0.9 : 0.6, vary(c, R, 0.06), R, 0.28);
          if (big && crH(x, z, 56) < 0.6) ico(g, x + (crH(x, z, 57) - 0.5) * r0, y + r0 * 0.7, z + (crH(x, z, 58) - 0.5) * r0, r0 * 0.6, 0.8, vary(RK[(Math.floor(crH(x, z, 59) * 4))], R, 0.06), R, 0.2);
          exclPush(x, z, r0 + 1); nR++;
        }
      }
      out.rocks = nR;
    }

    /* ---- the start: a banner over the road on two masts at the line (no words), flags along the walls; a banner at the finish too ---- */
    for (const s0 of [sStart, sFin]) {
      const [x, z, h, i] = atS(s0, 0), gy = T.hy[i], g = scen.get(x, z), span = Math.max(T.bl[i], T.br[i]) + 1.2, nx = T.nx[i], nz = T.nz[i];
      for (const sd of [-1, 1]) box(g, x + nx * span * sd, gy - 0.3, z + nz * span * sd, 0.5, 7.6, 0.5, h, [0.86, 0.86, 0.84]);
      box(g, x, gy + 6.2, z, 0.3, 1.3, span * 2 - 0.6, h, [0.92, 0.9, 0.86], [0.12, 0.5, 0.26]);
      box(g, x, gy + 6.0, z, 0.32, 0.2, span * 2 - 0.4, h, [0.78, 0.16, 0.14]);
      exclPush(x, z, span + 4);
    }
    {
      const FL = [[0.95, 0.95, 0.93], [0.8, 0.12, 0.12], [0.12, 0.52, 0.26], [0.95, 0.78, 0.15], [0.2, 0.4, 0.7]];
      for (let d = -100; d < 130; d += 18) for (const side of [-1, 1]) {
        const ii = T.idx(sAt(d)), o = side * ((side > 0 ? T.br[ii] : T.bl[ii]) + 1.6), px = T.px[ii] + T.nx[ii] * o, pz = T.pz[ii] + T.nz[ii] * o, py = nrGround(px, pz), gg = scen.get(px, pz);
        if (naSR(px, pz)) continue; CR.avoid(px, pz, 0.45);
        cyl(gg, px, py, pz, 0.06, 6, 5, [0.86, 0.86, 0.88]); API.flags.add(px, py + 5.6, pz, T.hd[ii], [FL[Math.floor(crH(d, side, 5) * FL.length)]], 1.2, 0.8);   // (waving: js/world-zastave.js)
      }
    }
    let nFans = 0;
    {   // few spectators (fewFans): at the start, by the Queen, at the finish
      const runs = [[-100, 120, 2, 0.4], [dFin - 90, dFin + 20, 2, 0.35]];
      const at = { 'Kraljica Isala': [60, 1, 0.3] };
      for (const q of T.names) { const a = at[q.n]; if (a) runs.push([q.d - 40, q.d + a[0], a[1], a[2]]); }
      for (const [a, b, rows, dens] of runs) for (const side of [-1, 1]) for (let s0 = a; s0 < b; s0 += 30) {
        const s1 = Math.min(b, s0 + 30); nFans += crowdRun(CR, sAt(s0), sAt(s0) + (s1 - s0), side, { rows, dens, first: 1.0, excluded });
      }
    }

    /* ---- the trees, within 60 m of the road only: fan palms and small round-crowned trees standing alone on the grass, more of them in the
       gullies and on the scrub, tufts of the tall grass; the ground under the crowns turns darker (G.cov) ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const WIND = { value: 0 }; out.dyn.wind = WIND;
    tMat.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = WIND;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
        '#ifdef USE_INSTANCING\nfloat wPh = instanceMatrix[3].x * 0.07 + instanceMatrix[3].z * 0.05;\n#else\nfloat wPh = 0.0;\n#endif\n' +
        'float wK = position.y * position.y * 0.018;\ntransformed.x += wK * sin( uWind * 1.1 + wPh );\ntransformed.z += wK * 0.6 * sin( uWind * 0.83 + wPh * 1.7 );');
    };
    tMat.customProgramCacheKey = () => 'isTreeWind';
    const TK = [new IChunks(isTreeGeo(0), tMat, 256), new IChunks(isTreeGeo(1), tMat, 256), new IChunks(isTreeGeo(2), tMat, 256)];
    let nTrees = 0;
    const NEAR = 60;
    const plant = (sp, x, z, hgt, wid, c) => {   // sp: 0 fan palm, 1 round tree, 2 grass tuft
      const y = nrGround(x, z) - 0.1, rot = crH(x, z, 21) * TAU;
      if (sp === 2) TK[2].add(x, y - 0.25 * hgt, z, rot, wid, hgt, c);
      else TK[sp].add(x, y, z, rot, wid, hgt, c);
      if (sp !== 2) nrShade(x, z, wid * (sp === 0 ? 0.3 : 0.42), 1); nTrees++; };
    {
      const Lt = NRC * 32, maxT = Math.round(30000 * (opts.density || 1));
      for (let tj = 0; tj < G.ntz && nTrees < maxT; tj++) for (let ti = 0; ti < G.ntx && nTrees < maxT; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt; zz += 6) for (let xx = xa; xx < xa + Lt; xx += 6) {
          const x = xx + (crH(xx, zz, 22) - 0.5) * 5.2, z = zz + (crH(xx, zz, 23) - 0.5) * 5.2, rd = nrDist(x, z);
          if (rd > NEAR) continue;
          const cl = nrLC(x, z), h1 = crH(x, z, 24);
          const p = cl === 1 ? 0.45 : cl === 2 ? 0.25 : 0.1;
          if (h1 > p) continue;
          const nn = nrNear(x, z), ni = nn.i, ndd = nn.dd; if (ni >= 0 && ndd < 3) continue;
          if (excluded(x, z)) continue;
          const hq = crH(x, z, 25), hs = crH(x, z, 26), cv = 0.86 + crH(x, z, 27) * 0.28, col = [cv * (0.95 + hq * 0.1), cv, cv * (0.94 + hs * 0.1)];
          let sp;
          if (cl === 1) sp = hs < 0.35 ? 0 : hs < 0.8 ? 1 : 2;
          else if (cl === 2) sp = hs < 0.15 ? 0 : hs < 0.35 ? 1 : 2;
          else sp = hs < 0.06 ? 0 : hs < 0.12 ? 1 : 2;
          const hgt = sp === 0 ? 6 + hq * 5 : sp === 1 ? 4 + hq * 3 : 0.8 + hq * 0.7;
          const wid = sp === 0 ? hgt * 0.8 : sp === 1 ? hgt * (1.0 + hs * 0.3) : hgt * 1.4;
          if (ni >= 0 && ndd < 3 + wid * 0.3 && sp !== 2) continue;   // (no crown over the barriers)
          plant(sp, x, z, hgt, wid, col);
        }
      }
    }
    for (const t of TK) t.addTo(root, true);

    /* ---- the far land beyond the corridor (200 m cells): the golden plain and the massif's sandstone, a little lower so its edge hides under
       the near tiles ---- */
    {
      const F = LD.far, bin = atob(F.b64), n = F.n, H = (i, j) => F.lo + bin.charCodeAt(clamp(j, 0, n - 1) * n + clamp(i, 0, n - 1)) * F.step, gf = new GB();
      const colF = (h, x, z, sl) => { const t = clamp((h - 820) / 260, 0, 1), k = 0.9 + crH(Math.floor(x / 200), Math.floor(z / 200), 3) * 0.15, rk = clamp(sl * 2.5, 0, 1) * 0.8;
        return [lerp(lerp(0.82, 0.62, t), 0.84, rk) * k, lerp(lerp(0.7, 0.54, t), 0.62, rk) * k, lerp(lerp(0.42, 0.38, t), 0.48, rk) * k]; };
      const inner = (x, z) => x > P.x0 + 200 && x < P.x1 - 200 && z > P.z0 + 200 && z < P.z1 - 200 && nrDist(x, z) < 560;
      for (let j = 0; j + 1 < n; j++) for (let i = 0; i + 1 < n; i++) {
        const x = F.x0 + (i + 1) * F.cell, z = F.z0 + (j + 1) * F.cell; if (inner(x, z)) continue;
        const q = (a, b) => { const xx = F.x0 + (a + 0.5) * F.cell, zz = F.z0 + (b + 0.5) * F.cell; return [xx, H(a, b) - (inner(xx, zz) ? 14 : 2.5), zz]; };
        const A = q(i, j), B2 = q(i + 1, j), C = q(i + 1, j + 1), Dd = q(i, j + 1), sl = (Math.max(A[1], B2[1], C[1], Dd[1]) - Math.min(A[1], B2[1], C[1], Dd[1])) / F.cell;
        gf.quadUp(A, Dd, C, B2, [colF(A[1], A[0], A[2], sl), colF(Dd[1], Dd[0], Dd[2], sl), colF(C[1], C[0], C[2], sl), colF(B2[1], B2[0], B2[2], sl)]);
      }
      const fm = addM(gf, matV); if (fm) fm.castShadow = false;
    }

    /* ---- the terrain tiles and the verges (256 m chunks), coloured now: the shade under the trees ---- */
    let nTiles = 0;
    {
      const grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let k = 0; k < tiles.length; k += 3) { const m = new THREE.Mesh(nrTileGeo(tiles[k], tiles[k + 1], tiles[k + 2] === 1 ? 1 : 4), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); nTiles++; }
      const vg = [0.9, 0.72, 0.52], dirt = [0.94, 0.66, 0.46];
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
    scen.addTo(sceneryGroup, matV, true, true);
    crowdFinish(CR, root, out);
    if (World.ext && World.ext.goreRob) World.ext.goreRob({ excluded, root, out }, 'isalo', { gH: nrGround, slope: API.nrSlope, lc: nrLC, near: nrNear });   // (the roadside ground for the chase camera: js/world-chase-bt14.js)
    out.stats = { tiles: nTiles, trees: nTrees, stone: nStone, fans: nFans, rocks: out.rocks };   // (read by the tests)
    if (SR) Object.assign(out.stats, { stranske: SR.n, stebricki: nStb });
    return out;
  }

  World.ext.isalo = (scene, tex, opts) => buildIsalo(scene, tex, opts);
})();
