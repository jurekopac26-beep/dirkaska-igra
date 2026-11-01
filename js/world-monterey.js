/* =========================================================================
   WORLD — Monterey (theme 'monterey'): its own builder (World.ext.monterey), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, NRC, NRT, RB, TAU, addShore, atS, atSf, box, clamp, crH, crowdCtx, crowdFinish, crowdRun, crowdUV, cyl, gable, ico,
    lerp, mergeBands, nrDecalTex, nrDist, nrFar, nrGrassTex, nrGround, nrLC, nrLCf, nrLump, nrNear, nrPrep, nrShade, nrSlope, nrTileGeo,
    nrTileOn, propFloorTable, rng, roadsideProps, shoreBand, sstep, waterMat, wrapS
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ================= MONTEREY (theme 'monterey'): the circuit in the dry hills of the county park above Monterey, California =================
     The layout of 1988 at full scale on its real ground (def.dem: USGS 3DEP, def.lc: ESA WorldCover with the car parks of OSM) on the
     Nordschleife's corridor helpers (nrPrep and the nr* terrain). Its own scenery: red and white kerbs, the gravel traps of tan decomposed
     granite round the corners, concrete walls with debris fences along the straights and in front of the crowds, tyre walls on the outside
     of the slow corners, armco elsewhere; the long pit lane on the left (the OSM line: scenery, the cars do not stop there) with the
     teams' canopies and the pit-exit light; the buildings of OSM (their outlines and heights; plain, no names), the aluminium bleachers on
     the grandstands' outlines and the crowds on the grassy banks; the footbridges over the track where OSM has them; the park's roads with
     their junctions as they are in the US (stop signs with the street names, stop bars, a double yellow centre line, lamps, hydrants, the
     signs, all knockable: Core PROPK); the car parks full of cars, the camp grounds with motorhomes and trailers; coast live oaks in the
     woodland and alone in the grass, chaparral on the slopes, the little lake in the infield; the Santa Lucia and Gabilan ranges and
     Monterey Bay on the horizon (def.far). The grass golden in summer, tan in autumn, green after the winter rains (out.ownSeason). */
  const MT_BAN = [['MONTEREY', '#1d3b2a', '#f3ead2', '#c9963a'], ['START · FINISH', '#16181c', '#fff', '#c9963a'], ['CALIFORNIA', '#123a6b', '#fff', '#c9963a'], ['PIT LANE', '#16181c', '#fff', '#e2202c'],
    ['MOTOR OIL', '#c9963a', '#16181c', '#16181c'], ['TYRES', '#16181c', '#f3ead2', '#e2202c'], ['COLD DRINKS', '#123a6b', '#fff', '#fff'], ['RADIO', '#e2202c', '#fff', '#fff'], ['BRAKES', '#f3ead2', '#16181c', '#16181c'], ['SPARK PLUGS', '#1d3b2a', '#fff', '#fff']];
  const MT_AT = { num: 0, brake: 11, ban: 14 };   // atlas cells: the turn numbers 1-11, the braking boards, the banners (MT_BAN)
  const MT_SHIRTS = [[0.92, 0.92, 0.9], [0.14, 0.15, 0.18], [0.12, 0.22, 0.46], [0.72, 0.12, 0.12], [0.82, 0.72, 0.5], [0.95, 0.8, 0.22], [0.3, 0.5, 0.3], [0.6, 0.62, 0.66],
    [0.95, 0.5, 0.18], [0.2, 0.45, 0.72], [0.55, 0.4, 0.3], [0.85, 0.85, 0.82]];   // (a summer crowd: white and black tees, navy, team colours, khaki, hats)
  function mtAtlas() {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const cell = (k, bg, fg, txt, px, stripe) => { const cx = (k % 4) * 256, cy = Math.floor(k / 4) * 64; x.fillStyle = bg; x.fillRect(cx, cy, 256, 64); if (stripe) { x.fillStyle = stripe; x.fillRect(cx, cy + 56, 256, 8); x.fillRect(cx, cy, 256, 4); }
      x.fillStyle = fg; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, cx + 128, cy + 33, 240); };
    for (let k = 1; k <= 11; k++) cell(MT_AT.num + k - 1, '#f4f2ea', '#16181c', String(k), 52, '#c9963a');
    ['300', '200', '100'].forEach((t, k) => cell(MT_AT.brake + k, '#f4f4f0', '#111', t, 50, '#111'));
    MT_BAN.forEach(([t, bg, fg, st], k) => cell(MT_AT.ban + k, bg, fg, t, t.length > 10 ? 30 : 38, st));
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  function mtTreeGeo(kind) {   // unit trees (height 1; instances scale them), soft shaded: 0 a coast live oak (a short dark trunk, a broad dome of dense dark leaves in
    // lumps), 1 a chaparral or coyote brush clump (low, grey-green), 2 a Monterey pine (a dark crown in tiers on a bare trunk); 3, 4 the cheap ones far off
    const g = new GB(), R = rng(930 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    const oak = [0.2, 0.27, 0.13], oakD = [0.15, 0.21, 0.1], oakL = [0.27, 0.33, 0.16], bark = [0.24, 0.21, 0.18];
    if (kind === 0) {
      cyl(g, 0, -0.02, 0, 0.05, 0.42, 5, bark, null, 0.035);
      ico(g, 0, 0.62, 0, 0.42, 0.52, oak, R, 0.22); nrLump(g, 0.24, 0.68, 0.1, 0.27, 0.58, oakD, R, 0.2); nrLump(g, -0.2, 0.72, -0.12, 0.28, 0.56, oakL, R, 0.2);
    } else if (kind === 1) { ico(g, 0, 0.4, 0, 0.42, 0.78, [0.36, 0.38, 0.27], R, 0.25); nrLump(g, 0.18, 0.46, 0.1, 0.28, 0.8, [0.3, 0.33, 0.22], R, 0.2); }
    else if (kind === 2) {
      cyl(g, 0, -0.02, 0, 0.03, 0.72, 5, [0.3, 0.24, 0.2], null, 0.018);
      for (const [y, r] of [[0.5, 0.26], [0.66, 0.24], [0.8, 0.18]]) ico(g, 0, y, 0, r, 0.45, [0.13, 0.2, 0.13], R, 0.3);
    } else if (kind === 3) { cyl(g, 0, -0.02, 0, 0.05, 0.42, 4, bark, null, 0.035); ico(g, 0, 0.62, 0, 0.45, 0.55, oak, R, 0.2); }
    else ico(g, 0, 0.42, 0, 0.42, 0.78, [0.35, 0.37, 0.26], R, 0.2);
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // the horizon (Riverside's rsFar on def.far): the land's colours by height and season (golden foothills, the oak and chaparral of the ranges,
  // green in winter), Monterey Bay's water where the ground is at sea level, the coastal haze
  const mtFarCol = (season) => (h, d) => {
    const win = season === 'winter', foot = win ? [0.42, 0.5, 0.3] : season === 'autumn' ? [0.62, 0.52, 0.36] : [0.7, 0.6, 0.4];
    let c = h <= 1 ? [0.36, 0.48, 0.6] : h < 300 ? foot : h < 900 ? [0.36, 0.4, 0.28] : [0.32, 0.36, 0.28];
    if (h >= 300 && h < 500) { const t = (h - 300) / 200; c = c.map((v, k) => lerp(foot[k], v, t)); }
    const f = (1 - Math.exp(-d / 30000)) * 0.9;
    return c.map((v, k) => lerp(v, [0.76, 0.8, 0.86][k], f));
  };
  const mtIn = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 2; i < P.length; j = i, i += 2) { const xi = P[i], zi = P[i + 1], xj = P[j], zj = P[j + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };   // (a point in a polygon [x, z, ...])
  function mtBox(P) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let k = 0; k < P.length; k += 2) { x0 = Math.min(x0, P[k]); x1 = Math.max(x1, P[k]); z0 = Math.min(z0, P[k + 1]); z1 = Math.max(z1, P[k + 1]); } return [x0, z0, x1, z1]; }

  function buildMonterey(scene, tex, opts) {
    const R = rng(3602), N = T.N, w = T.w, ds = T.ds, dens = opts.density || 1, sStart = T.startS, def = T.def, L = T.len, M = def.mt;
    const root = new THREE.Group(); scene.add(root);
    const sea = opts.season === 'winter' || opts.season === 'autumn' ? opts.season : 'summer';
    const out = { root, dyn: {}, groundH: nrGround, camFloor: nrGround, props: [], farClip: true, ownTex: [], ownMarks: true, season: 'mt-' + sea, ownSeason: true, paintFor: (s) => 'mt-' + (s === 'winter' || s === 'autumn' ? s : 'summer'), dust: [0.78, 0.66, 0.5] };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    const dS = (s) => { let d = s - sStart; d = ((d % L) + L) % L; return d > L / 2 ? d - L : d; };
    const sAt = (d) => (((sStart + d) % L) + L) % L;
    const hyS = (s) => T.elevAt(wrapS(s)).y;
    nrPrep();
    const P = API.NR, G = P.G;
    // the ground's colours: the grass golden in summer (the race season), tan in autumn, green after the winter rains; the oak woodland's floor
    // dark with leaf litter, the chaparral grey-green, the car parks dusty
    P.seC = sea === 'winter' ? [1.0, 1.0, 0.86] : [1.18, 1.06, 0.84];
    const GC = sea === 'winter' ? [0.92, 1.05, 0.86] : sea === 'autumn' ? [1.48, 1.04, 1.8] : [1.62, 1.1, 2.15];   // (the olive grass picture: golden straw in summer, a duller tan in autumn, fresh green in winter)
    P.colMod = (x, z, c) => {
      const n = P.n5(x * 0.55 + 700, z * 0.55), m = P.n3(x * 1.6 + 300, z * 1.6), k = 0.96 + (n - 0.5) * 0.22 + (m - 0.5) * 0.12, fm = nrLCf(x, z, 0), fs = nrLCf(x, z, 2);
      c[0] *= k * GC[0]; c[1] *= k * GC[1]; c[2] *= k * GC[2];
      const pale = sstep(0.4, 0.75, P.n3(x * 0.8 + 90, z * 0.8 - 40)) * 0.55 * fm, green = sstep(0.55, 0.8, P.n1(x * 1.1 - 210, z * 1.1 + 75)) * fm * (sea === 'winter' ? 0.4 : 0.25);
      c[0] = lerp(c[0], c[0] * 1.1 + 0.05, pale); c[1] = lerp(c[1], c[1] * 1.1 + 0.05, pale); c[2] = lerp(c[2], c[2] * 1.12 + 0.05, pale);
      c[0] = lerp(c[0], c[0] * 0.78, green); c[1] = lerp(c[1], c[1] * 1.0, green); c[2] = lerp(c[2], c[2] * 0.8, green);   // (greener in the hollows)
      c[0] = lerp(c[0], 0.98, fs * 0.8); c[1] = lerp(c[1], 1.02, fs * 0.8); c[2] = lerp(c[2], 1.0, fs * 0.8);
    };
    // level ground and water: the lake and ponds of the infield (the ground pulled under their water level)
    const lakes = (M.water || []).map(Pp => { const b = mtBox(Pp); let lo = 1e9; for (let k = 0; k < Pp.length; k += 2) lo = Math.min(lo, nrFar(Pp[k], Pp[k + 1])); return { P: Pp, b, y: lo - 0.4 }; });
    const edgeD = (Pp, x, z) => { let m = 1e9; for (let i = 0, j = Pp.length - 2; i < Pp.length; j = i, i += 2) { const ax = Pp[j], az = Pp[j + 1], bx = Pp[i] - ax, bz = Pp[i + 1] - az, l2 = bx * bx + bz * bz || 1, t = clamp(((x - ax) * bx + (z - az) * bz) / l2, 0, 1); m = Math.min(m, Math.hypot(x - ax - bx * t, z - az - bz * t)); } return m; };
    P.pad = (x, z, h) => { for (const lk of lakes) { const b = lk.b; if (x < b[0] - 6 || x > b[2] + 6 || z < b[1] - 6 || z > b[3] + 6) continue;   // (the ground just above the water at the shore, below it a metre or two in)
      const ed = edgeD(lk.P, x, z), sd = mtIn(lk.P, x, z) ? -ed : ed; if (sd < 10) return Math.min(h, Math.max(lk.y - 1.6, lk.y + 0.3 * sd)); } return h; };
    out.bounds = { minX: P.x0, maxX: P.x1, minZ: P.z0, maxZ: P.z1 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 64;
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); } };
    const excluded = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (let k = 0; k < Lc.length; k++) { const e = Lc[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const W1 = [1, 1, 1], CH = 128, side2 = (side) => (side > 0 ? 1 : 0);
    const inWorld = (x, z) => nrDist(x, z) < 400;   // (the terrain's full tiles reach ~370 m out, its coarse ring a little more)
    // the pit lane (def.mt.pl: [m after the start line, lateral offset] on the left)
    const PL = M.pl, PD0 = M.pit[0], PD1 = M.pit[1];
    const plAt = (d) => { if (d < PL[0][0] || d > PL[PL.length - 1][0]) return null; const k = Math.min(PL.length - 2, Math.floor((d - PL[0][0]) / 8)), t = (d - PL[k][0]) / 8; return lerp(PL[k][1], PL[k + 1][1], clamp(t, 0, 1)); };
    const inPit = (i) => { const d = dS(i * ds); return d >= PD0 - 4 && d <= PD1 + 4; };

    /* ---- terrain tiles: which ones (built at the end, when the trees have shaded the ground under them) ---- */
    const gMat = new THREE.MeshLambertMaterial({ map: ownTex(nrGrassTex(tex.grass.anisotropy)), vertexColors: true }), tiles = [];
    for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { const on = nrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; tiles.push(ti, tj, on); }

    /* ---- the road: asphalt (resurfaced in sections, the racing line rubbered in, darker into the slow corners), white edge lines, red and
       white kerbs in 1 m blocks (inside every bend, outside the tighter ones) ---- */
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true }), cMat = new THREE.MeshLambertMaterial({ map: tex.curb, vertexColors: true });
    const kerb = [new Uint8Array(N), new Uint8Array(N)];
    for (let i = 0; i < N; i++) if (T.curb[i]) { const k = T.k[i]; for (const side of [-1, 1]) { const inside = side * k > 0; if ((inside || Math.abs(k) > 1 / 70) && !(side < 0 && inPit(i) && !inside)) kerb[side2(side)][i] = 1; } }
    const offs = [-w, -w * 2 / 3, -w / 3, 0, w / 3, w * 2 / 3, w], tileL = 8;
    const secT = new Float32Array(N), brk = new Float32Array(N);
    for (let i0 = 0, k = 0; i0 < N; k++) { const n = 60 + Math.floor(crH(k, 3, 36) * 70), t = 0.94 + crH(k, 5, 36) * 0.09; for (let i = i0; i < Math.min(N, i0 + n); i++) secT[i] = t; i0 += n; }
    for (const c of T.corners) if (c.sev >= 2) for (let k = -70; k <= 6; k++) { const i = (c.i0 + k + N) % N, f = k < -10 ? sstep(-70, -12, k) : sstep(6, -10, k); if (f > brk[i]) brk[i] = f; }
    const shade = (i, o) => { const rl = T.rl[i]; let k = (0.84 - (0.16 + 0.12 * brk[i]) * Math.exp(-((o - rl) * (o - rl)) / 5)) * secT[i]; if (Math.abs(o) > w * 0.92) k -= 0.03; return [k * 1.01, k, k * 0.98]; };
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB(true), gl = new RB(), gk = new RB(true);
      let pr = -1, pl = -1; const pk = [-1, -1];
      for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
        const i = ii % N, v = ii * ds / tileL;
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o)), offs.map(o => [(o + w) / tileL, v]));
        if (pr >= 0) gr.link(pr, r, 0, offs.length - 1); pr = r;
        const wl = [0.94, 0.94, 0.9], l = gl.row([Pt(i, -w + 0.2, 0.034), Pt(i, -w + 0.45, 0.034), Pt(i, w - 0.45, 0.034), Pt(i, w - 0.2, 0.034)], [wl, wl, wl, wl]);
        if (pl >= 0) { gl.link(pl, l, 0, 1); gl.link(pl, l, 2, 3); } pl = l;
        for (const side of [-1, 1]) {
          const si = side2(side);
          if (kerb[si][i]) {
            const cw = T.curbW, pf = [[w - 0.02, 0.035], [w + 0.14, 0.078], [w + cw - 0.12, 0.085], [w + cw + 0.02, 0.03]], v2 = ii * ds / 2;
            const sh = [0.84, 1, 1, 0.78].map(k => [k, k, k]), us = [0, 0.1, 0.92, 1], o = side > 0 ? [0, 1, 2, 3] : [3, 2, 1, 0];
            const rk = gk.row(o.map(k => Pt(i, side * pf[k][0], pf[k][1])), o.map(k => sh[k]), o.map(k => [us[k], v2]));
            if (pk[si] >= 0) gk.link(pk[si], rk, 0, 3); pk[si] = rk;
          } else pk[si] = -1;
        }
      }
      addM(gr, aMat); addM(gl, lMat); addM(gk, cMat);
    }
    /* ---- the verges: the gravel traps of tan decomposed granite where the barrier stands far out (Core: gravL / gravR), a strip of dry
       grass and dirt elsewhere, down to the terrain ---- */
    const gvTex = ownTex(API.rbGravelTex()), gvMat = new THREE.MeshLambertMaterial({ map: gvTex, vertexColors: true });
    const GRV = [1.18, 1.0, 0.8], GRV2 = [1.08, 0.92, 0.74], DRY = sea === 'winter' ? [0.62, 0.7, 0.46] : sea === 'autumn' ? [0.92, 0.8, 0.6] : [1.02, 0.88, 0.62];
    const verge = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i], kb = kerb[side2(side)][i] ? T.curbW : 0.05, lift = (o, h) => { const q = side * o; return [o, Math.max(h, nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.04 - y)]; };
      return [[w + kb, 0.02], [w + kb + 0.6, -0.02], lift(Math.max(w + kb + 1.4, bar - 0.4), -0.06), lift(bar + 1.2, -0.12), lift(bar + 3.0, -0.3)]; };
    for (let c0 = 0; c0 < N; c0 += CH) {   // (only the traps and a narrow dirt edge: elsewhere the terrain's grass comes up to the kerb)
      const gv = new RB(true), pv = [-1, -1];
      for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
        const i = ii % N;
        for (const side of [-1, 1]) {
          const si = side2(side), gl = (side > 0 ? T.gravR : T.gravL)[i], n3 = crH(i, side, 5) * 0.06, kb = kerb[si][i] ? T.curbW : 0.05;
          let pr, cols;
          if (gl) { pr = verge(i, side); cols = [GRV, GRV2, GRV, [lerp(GRV[0], DRY[0], 0.5), lerp(GRV[1], DRY[1], 0.5), lerp(GRV[2], DRY[2], 0.5)], DRY]; }
          else { const e = [0.86 - n3, 0.8 - n3, 0.7 - n3]; pr = [[w + kb, 0.02], [w + kb + 0.25, 0.0], [w + kb + 0.5, -0.03], [w + kb + 0.8, -0.06], [w + kb + 1.1, -0.1]]; cols = [e, e, e, DRY, DRY]; }
          const pts = pr.map(([o, h]) => Pt(i, side * o, h)), ord = side > 0 ? { p: pts, c: cols } : { p: pts.slice().reverse(), c: cols.slice().reverse() };
          const rv = gv.row(ord.p, ord.c, ord.p.map(p => [p[0] / 3, -p[2] / 3]));
          if (pv[si] >= 0) gv.link(pv[si], rv, 0, 4); pv[si] = rv;
        }
      }
      addM(gv, gvMat);
    }
    /* ---- on the asphalt: rubber into the slow corners, patches and sealed cracks (the Nordschleife's decal atlas) ---- */
    let nDecals = 0;
    {
      const dTex = ownTex(nrDecalTex()); dTex.anisotropy = tex.asphalt.anisotropy || 4;
      const dMat = new THREE.MeshLambertMaterial({ map: dTex, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
      const RD = rng(3603), dcs = [], put = (i0, n, c, hw, cell, a, lay, fol) => dcs.push([i0, n, c, hw, cell, a, lay, fol]);
      for (let d = 60; d < L - 60; d += 30) { const i = T.idx(sAt(d));
        if (RD() < 0.05) put(i, 5 + Math.floor(RD() * 4), (RD() - 0.5) * 6, 1.2 + RD() * 0.6, 24 + Math.floor(RD() * 2), 0.75, 1);
        if (RD() < 0.05) { const hw = 1.5 + RD() * 1.2; put(i, 2 + Math.floor(RD() * 6), (RD() < 0.5 ? -1 : 1) * (w - 0.8 - hw) * RD(), hw, 28 + Math.floor(RD() * 4), 0.85, 0); } }
      for (const c of T.corners) if (c.sev >= 2) for (let n = c.sev >= 3 ? 5 : 3; n > 0; n--) put((c.i0 - 4 - Math.floor(RD() * 34) + N) % N, 10 + Math.floor(RD() * 7), (RD() - 0.5) * 1.8, 1.25, 26 + (RD() < 0.35 ? 1 : 0), 0.45 + RD() * 0.4, 2, true);
      dcs.sort((a, b) => a[6] - b[6]);
      const rbs = new Map();
      for (const [i0, n, c, hw, cell, a, , fol] of dcs) {
        const key = Math.floor(i0 / CH); let rb = rbs.get(key); if (!rb) rbs.set(key, rb = new RB(true, true));
        const cu = cell % 4, cv = Math.floor(cell / 4), u0 = cu / 4 + 1 / 512, u1 = (cu + 1) / 4 - 1 / 512, vt = 1 - cv / 8 - 1 / 1024, vb = 1 - (cv + 1) / 8 + 1 / 1024, col = [1, 1, 1, a];
        let pr = -1;
        for (let k = 0; k <= n; k++) { const i = (i0 + k) % N, cc = clamp((fol ? T.rl[i] : 0) + c, -(w - 0.7 - hw), w - 0.7 - hw), v = vb + (vt - vb) * k / n;
          const r = rb.row([Pt(i, cc - hw, 0.05), Pt(i, cc + hw, 0.05)], [col, col], [[u0, v], [u1, v]]); if (pr >= 0) rb.link(pr, r, 0, 1); pr = r; }
      }
      for (const rb of rbs.values()) { const m = addM(rb, dMat); if (m) m.renderOrder = 0.45; }   // (ROAD DECAL ORDER: under the road's wear)
      nDecals = dcs.length;
    }
    // the start / finish line and the grid
    {
      const gq = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16, wh = [0.93, 0.93, 0.9], HYp = (p) => T.hy[p[3]];
      const a = atSf(sStart - 0.8, -w), b = atSf(sStart - 0.8, w), c = atSf(sStart + 0.8, w), d = atSf(sStart + 0.8, -w);
      gq.quadUp([a[0], HYp(a) + 0.04, a[1]], [b[0], HYp(b) + 0.04, b[1]], [c[0], HYp(c) + 0.04, c[1]], [d[0], HYp(d) + 0.04, d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      for (let k = 1; k <= 14; k++) {
        const sb = sStart - 9 - (k - 1) * 7.5 + 2.6, lat = (k % 2 === 1 ? 1 : -1) * 3.4;   // (pole on the right: the outside of Turn 1... as the circuit grids)
        const p0 = atSf(sb, lat - 1.5), p1 = atSf(sb, lat + 1.5), p2 = atSf(sb + 0.35, lat + 1.5), p3 = atSf(sb + 0.35, lat - 1.5);
        gw.quadUp([p0[0], HYp(p0) + 0.037, p0[1]], [p1[0], HYp(p1) + 0.037, p1[1]], [p2[0], HYp(p2) + 0.037, p2[1]], [p3[0], HYp(p3) + 0.037, p3[1]], [wh, wh, wh, wh]);
      }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw, lMat);
    }

    /* ---- barriers: concrete walls (the straights, the pit wall, in front of the crowds and where OSM has the walls), tyre walls with their
       belts round the outside of the slow corners, double armco elsewhere; debris fences behind the walls and the tyre walls ---- */
    const wallOn = [new Uint8Array(N), new Uint8Array(N)];
    for (const [a, b, sd] of def.ga || []) for (let d = a - 10; d <= b + 10; d += ds) wallOn[side2(sd)][T.idx(sAt(d))] = 1;
    for (const [a, b, sd] of def.walls || []) for (let d = a - 6; d <= b + 6; d += ds) wallOn[side2(sd)][T.idx(sAt(d))] = 1;
    const tyreOn = [new Uint8Array(N), new Uint8Array(N)];
    for (const c of T.corners) { if (c.sev < 3) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, si = side2(-c.dir);
      for (let k = c.i0 - 10; k <= i1c + 14; k++) { const ii = ((k % N) + N) % N; if ((si ? T.gravR : T.gravL)[ii] && !(si === 0 && inPit(ii))) tyreOn[si][ii] = 1; } }
    const kindAt = (i, side) => {   // 0 armco, 1 concrete wall, 2 tyre wall; -1 none (where the pit lane leaves and joins)
      if (side < 0 && inPit(i)) { const d = dS(i * ds); return d < PD0 + 40 || d > PD1 - 30 ? -1 : 1; }
      if (tyreOn[side2(side)][i]) return 2;
      const d = dS(i * ds); if (d > -300 && d < 120) return 1;
      return wallOn[side2(side)][i] ? 1 : 0;
    };
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const tyMat = new THREE.MeshLambertMaterial({ map: tex.tires, vertexColors: true });
    const postGeo = (() => { const g = new GB(); box(g, 0, 0, 0, 0.13, 1, 0.13, 0, [0.42, 0.43, 0.46], null, true); return g.geometry(); })();
    const posts = new IChunks(postGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), 512);
    const fence = [new Uint8Array(N), new Uint8Array(N)];
    const steel = [0.8, 0.82, 0.85], steelD = [0.5, 0.52, 0.56], conc = [0.78, 0.77, 0.73], concD = [0.64, 0.63, 0.6];
    const railRow = (gr, i, side, k) => {
      const bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.12), h = 1.1, o2 = side * (bar + (k === 0 ? 0.42 : 0.45));
      let p = k === 0 ? [Pt(i, o, 0.32), Pt(i, o, 0.6), Pt(i, o, 0.66), Pt(i, o, 0.95), Pt(i, o2, 0.95)] : [Pt(i, o, -0.4), Pt(i, o, 0.1), Pt(i, o, h - 0.1), Pt(i, o, h), Pt(i, o2, h)];
      let c = k === 0 ? [steel, steelD, steel, [0.9, 0.91, 0.93], [0.72, 0.74, 0.77]] : [concD, conc, conc, [0.88, 0.88, 0.86], [0.82, 0.82, 0.8]];
      if (side < 0) { p = p.reverse(); c = c.slice().reverse(); }
      return gr.row(p, c);
    };
    const BELT = [[0.16, 0.3, 0.62], [0.82, 0.16, 0.14]];   // the conveyor belts over the tyre walls: blue, red at the ends
    const tyreRow = (gt, i, side, u) => { const bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.1), o2 = side * (bar + 0.9), dk = [0.3, 0.3, 0.32];
      let p = [Pt(i, o, -0.1), Pt(i, o, 0.95), Pt(i, o2, 0.95)], uv = [[u, 0.02], [u, 0.98], [u, 0.98]], c = [W1, W1, dk];
      if (side < 0) { p = p.reverse(); uv = uv.slice().reverse(); c = c.slice().reverse(); }
      return gt.row(p, c, uv); };
    const beltG = new Chunks(256);
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB(), gt = new RB(true);
      for (const side of [-1, 1]) {
        let prev = -1, pk = -2, acc = c0 * ds;
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++, acc += ds) {
          const i = ii % N, k = kindAt(i, side);
          if (prev >= 0 && k !== pk) { if (pk === 2) gt.link(prev, tyreRow(gt, i, side, acc / 3), 0, 2); else if (pk >= 0) gr.link(prev, railRow(gr, i, side, pk), 0, 4); prev = -1; }
          if (k < 0) { pk = k; continue; }
          const r = k === 2 ? tyreRow(gt, i, side, acc / 3) : railRow(gr, i, side, k);
          if (prev >= 0) { if (k === 2) gt.link(prev, r, 0, 2); else gr.link(prev, r, 0, 4); } prev = r; pk = k;
          if (k === 0 && ii % 2 === 0 && ii < c0 + CH) { const p = Pt(i, side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.24), 0); posts.add(p[0], p[1] - 0.35, p[2], T.hd[i], 1, 1.25); }
          if (k === 2 && ii < c0 + CH) { const j = (i + 1) % N, bar = side > 0 ? T.br : T.bl, Q = (q, y) => Pt(q, side * (bar[q] + 0.05), y), bc = BELT[(ii >> 3) % 7 === 0 ? 1 : 0];   // (the belt: a band over the tyres' face)
            beltG.get(T.px[i], T.pz[i]).quadO(Q(i, 0.12), Q(j, 0.12), Q(j, 0.98), Q(i, 0.98), bc, Pt(i, side * (bar[i] + 2), 0.5)); }
          if (k >= 1 && k <= 2) fence[side2(side)][i] = k;
        }
      }
      addM(gr, rMat, true); addM(gt, tyMat, true);
    }
    posts.addTo(root, true); beltG.addTo(root, matV, true, true);
    { const sb = new Chunks(256, true);   // the game's own (made-up) sponsors' boards along the concrete walls
      for (const side of [-1, 1]) for (let i = 0, n = 0; i + 2 <= N; i += 2) {
        const j = (i + 2) % N; if (kindAt(i, side) !== 1 || kindAt(j, side) !== 1 || kindAt((i + 1) % N, side) !== 1 || crH(i, side, 41) < 0.35) continue;
        const k = (n++ * 3 + (side > 0 ? 1 : 0)) % 8, u0 = (k % 2) * 0.5, v1 = 1 - Math.floor(k / 2) * 0.25, bar = side > 0 ? T.br : T.bl, o = (q) => side * (bar[q] + 0.1);
        const A = Pt(i, o(i), 0.14), B = Pt(j, o(j), 0.14), Cc = Pt(j, o(j), 0.96), D = Pt(i, o(i), 0.96), uL = side < 0 ? u0 : u0 + 0.5, uR = side < 0 ? u0 + 0.5 : u0;
        sb.get(A[0], A[2]).quadO(A, B, Cc, D, W1, Pt(i, side * (bar[i] + 2), 0.5), [[uL, v1 - 0.25], [uR, v1 - 0.25], [uR, v1], [uL, v1]]); }
      sb.addTo(root, new THREE.MeshLambertMaterial({ map: tex.sponsors }), false, true); }
    const scen = new Chunks(256), ban = new GB(true), fenceG = new GB(true);
    for (const side of [-1, 1]) {
      const fc = fence[side2(side)], bar = side > 0 ? T.br : T.bl; let acc = 0;
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N; if (!fc[i] || !fc[j]) { acc += ds; continue; }
        const e = fc[i] === 2 ? 1.25 : 0.55, Q = (ii, y) => { const o = side * (bar[ii] + e); return [T.px[ii] + T.nx[ii] * o, T.hy[ii] + y, T.pz[ii] + T.nz[ii] * o]; };
        const u0 = acc / 2.5, u1 = (acc + ds) / 2.5, ins = Q(i, 1); ins[0] += T.nx[i] * side * 3; ins[2] += T.nz[i] * side * 3;
        fenceG.quadO(Q(i, 1.0), Q(j, 1.0), Q(j, 4.0), Q(i, 4.0), [1, 1, 1], ins, [[u0, 0], [u1, 0], [u1, 1.25], [u0, 1.25]]);
        if (i % 3 === 0) { const p = Q(i, 0); box(scen.get(p[0], p[2]), p[0], p[1] - 0.2, p[2], 0.1, 4.25, 0.1, T.hd[i], [0.6, 0.61, 0.64]); }
        acc += ds;
      }
    }

    /* ---- scenery helpers ---- */
    const atlas = ownTex(mtAtlas()), AUV = (k) => { const u0 = (k % 4) / 4, v1 = 1 - Math.floor(k / 4) / 16; return [u0, v1 - 1 / 16, u0 + 0.25, v1]; };
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const board = (cx, cy, cz, tx, tz, Wd, H, cellK) => {   // a text board (bottom centre cx, cy, cz) facing -t (read by cars driving along +t), a dark back
      const [u0, v0, u1, v1] = AUV(cellK), ux = tz, uz = -tx, hw = -Wd / 2;
      const A = [cx - ux * hw, cy, cz - uz * hw], B = [cx + ux * hw, cy, cz + uz * hw], Cc = [B[0], cy + H, B[2]], D = [A[0], cy + H, A[2]];
      ban.quadO(A, B, Cc, D, W1, [cx + tx, cy + H / 2, cz + tz], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
      box(scen.get(cx, cz), cx + tx * 0.06, cy - 0.02, cz + tz * 0.06, 0.08, H + 0.04, Wd + 0.04, Math.atan2(tz, tx), [0.3, 0.31, 0.33], null, true);
    };
    const signPost = (s, side, extra, cellK, Wd, H, y0) => {
      const [x, z, i] = onSide(s, side, extra), y = nrGround(x, z), g = scen.get(x, z), nx = T.nx[i], nz = T.nz[i];
      for (const o of [-Wd / 2 + 0.2, Wd / 2 - 0.2]) box(g, x + nx * o + T.tx[i] * 0.16, y - 0.3, z + nz * o + T.tz[i] * 0.16, 0.1, y0 + H + 0.3, 0.1, T.hd[i], [0.55, 0.56, 0.58]);
      board(x, y + y0, z, T.tx[i], T.tz[i], Wd, H, cellK); exclPush(x, z, 3);
    };
    const CR = crowdCtx({ gH: nrGround, near: (x, z) => nrNear(x, z).dd, maxSlope: 0.9, shirts: MT_SHIRTS });
    const crowdPts = [], RX = rng(3604), flagL = [], WROT = Math.atan2(API.RB_WIND[1], API.RB_WIND[0]);
    const US = [[0.72, 0.1, 0.14], [0.95, 0.95, 0.93], [0.72, 0.1, 0.14], [0.95, 0.95, 0.93], [0.14, 0.2, 0.46]], CAL = [[0.95, 0.95, 0.93], [0.95, 0.95, 0.93], [0.7, 0.12, 0.12]];
    const flagAt = (x, y, z, h, cols, Wf) => { Wf = Wf || 1.8; cyl(scen.get(x, z), x, y - 0.2, z, 0.05, h + 0.2, 5, [0.86, 0.86, 0.88]); flagL.push([x, y + h, z, WROT + (RX() - 0.5) * 0.3, cols, Wf, Wf * 0.6]); };

    /* ---- the start gantry with its lights (the renderer drives them: out.dyn.lights), the banner over the line ---- */
    {
      const [x, z, h, i] = atS(sStart, 0), gy = T.hy[i], g = scen.get(x, z), span = Math.max(T.bl[i], T.br[i]) + 1.2, nx = T.nx[i], nz = T.nz[i], gray = [0.2, 0.22, 0.26];
      for (const sd of [-1, 1]) box(g, x + nx * span * sd, gy - 0.3, z + nz * span * sd, 0.8, 7.9, 0.8, h, gray);
      box(g, x, gy + 6.4, z, 1.1, 1.3, span * 2 + 0.8, h, [0.14, 0.15, 0.18], [0.24, 0.25, 0.3]);
      box(g, x, gy + 5.2, z, 0.5, 1.4, 5.2, h, [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, gy + 7.95, z + nz * o); m.rotation.y = -h; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      board(x - T.tx[i] * 0.6, gy + 6.45, z - T.tz[i] * 0.6, T.tx[i], T.tz[i], span * 2 - 2, 1.2, MT_AT.ban + 1);
      exclPush(x, z, span + 6);
    }

    /* ---- the pit lane on the left (def.mt.pl, from OSM; scenery: the cars do not stop here): the lane and its lines, the concrete apron, the
       teams' canopies with their cars, tool chests and tyres, the pit wall's stands; the speed limit board, the light at the exit ---- */
    let nBoxes = 0;
    {
      const gl = new GB(true), gp = new GB(), wl = [0.95, 0.95, 0.94], apC = [0.8, 0.8, 0.77], LWh = 3.25;
      const at = (d, o, y) => { const [x, z] = atSf(sAt(d), o); return [x, hyS(sAt(d)) + y, z]; };
      for (let d = PD0; d < PD1; d += 2) {
        const a = plAt(d), b = plAt(d + 2); if (a == null || b == null) continue;
        const A = at(d, a + LWh, 0.026), B = at(d, a - LWh, 0.026), Cq = at(d + 2, b - LWh, 0.026), D = at(d + 2, b + LWh, 0.026);
        gl.quadUp(A, B, Cq, D, [W1, W1, W1, W1], [A, B, Cq, D].map(p => [p[0] / 8, -p[2] / 8]));
        gp.quadUp(at(d, a - LWh + 0.18, 0.034), at(d, a - LWh, 0.034), at(d + 2, b - LWh, 0.034), at(d + 2, b - LWh + 0.18, 0.034), [wl, wl, wl, wl]);
        if (((d / 2) | 0) % 2 === 0) gp.quadUp(at(d, a + LWh, 0.034), at(d, a + LWh - 0.18, 0.034), at(d + 2, b + LWh - 0.18, 0.034), at(d + 2, b + LWh, 0.034), [wl, wl, wl, wl]);
        const full = d > PD0 + 120 && d < PD1 - 60;
        if (full) gp.quadUp(at(d, a - LWh, 0.022), at(d, a - LWh - 9, 0.022), at(d + 2, b - LWh - 9, 0.022), at(d + 2, b - LWh, 0.022), [apC, apC, apC, apC]);
      }
      addM(gl, aMat); addM(gp, lMat);
      // the teams' boxes: every 12 m on the apron a pop-up canopy in the team's colour, the car (a sports racer: low, a wing), a tool chest, tyres
      const TEAM = [[0.12, 0.16, 0.36], [0.85, 0.12, 0.14], [0.16, 0.46, 0.3], [0.96, 0.52, 0.1], [0.94, 0.94, 0.92], [0.14, 0.14, 0.16], [0.16, 0.36, 0.8], [0.96, 0.78, 0.12], [0.55, 0.26, 0.7], [0.1, 0.62, 0.72]];
      for (let d = PD0 + 140, k = 0; d < PD1 - 80; d += 12, k++) {
        const a = plAt(d); if (a == null) continue;
        const s = sAt(d), i = T.idx(s), o = a - LWh - 4.5, [x, z] = atSf(s, o), y = hyS(s), hd = T.hd[i], g = scen.get(x, z), tc = TEAM[(k * 7 + 3) % TEAM.length], tx = T.tx[i], tz = T.tz[i], nx = -T.nx[i], nz = -T.nz[i];
        if (excluded(x, z)) continue;
        for (const [pa, pb] of [[-2.9, -2.6], [2.9, -2.6], [-2.9, 2.6], [2.9, 2.6]]) box(g, x + tx * pa + nx * pb, y, z + tz * pa + nz * pb, 0.07, 2.6, 0.07, hd, [0.8, 0.8, 0.82], null, true);
        box(g, x, y + 2.6, z, 6.0, 0.08, 5.4, hd, tc, tc); box(g, x, y + 2.68, z, 3.0, 0.5, 5.2, hd, tc, [Math.min(1, tc[0] * 1.15), Math.min(1, tc[1] * 1.15), Math.min(1, tc[2] * 1.15)]);   // (the canopy, its peak)
        if (crH(k, 1, 51) < 0.7) { const cx = x - nx * 0.4, cz = z - nz * 0.4, cc = TEAM[(k * 3 + 1) % TEAM.length];   // the car, nose to the lane
          box(g, cx, y + 0.12, cz, 4.4, 0.55, 1.9, hd + Math.PI / 2, cc, cc, true); box(g, cx + nx * 0.3, y + 0.62, cz + nz * 0.3, 1.6, 0.4, 1.2, hd + Math.PI / 2, [0.12, 0.14, 0.18], cc, true);
          box(g, cx + nx * 2.0, y + 0.9, cz + nz * 2.0, 0.35, 0.06, 1.9, hd + Math.PI / 2, [0.1, 0.1, 0.11], [0.1, 0.1, 0.11], true);
          for (const [wa, wb] of [[1.4, 0.85], [1.4, -0.85], [-1.45, 0.85], [-1.45, -0.85]]) cyl(g, cx - nx * wa + tx * wb, y, cz - nz * wa + tz * wb, 0.33, 0.3, 8, [0.06, 0.06, 0.07], [0.5, 0.5, 0.52]); }
        box(g, x + tx * 2.2 + nx * 2.2, y, z + tz * 2.2 + nz * 2.2, 1.2, 1.0, 0.6, hd, [0.7, 0.12, 0.1], [0.12, 0.12, 0.13], true);   // a tool chest
        for (let q = 0; q < 2; q++) cyl(g, x - tx * 2.3 + nx * (1.8 + q * 0.75), y, z - tz * 2.3 + nz * (1.8 + q * 0.75), 0.33, 1.1, 8, [0.08, 0.08, 0.09], [0.16, 0.16, 0.18]);   // tyres in their stacks
        exclPush(x, z, 5); CR.exclAdd(x, z, 5); nBoxes++;
      }
      // the boards: PIT LANE at the entry, the light at the exit (a red and a green lamp on a grey post, by the blend line)
      { const d = PD0 + 30, a = plAt(d), s = sAt(d), i = T.idx(s); if (a != null) { const [x, z] = atSf(s, a - LWh - 1.5), y = nrGround(x, z), g = scen.get(x, z);
        for (const o of [-1.4, 1.4]) box(g, x + T.tx[i] * o, y - 0.3, z + T.tz[i] * o, 0.12, 2.8, 0.12, T.hd[i], [0.55, 0.56, 0.58]);
        board(x, y + 1.7, z, T.tx[i], T.tz[i], 3.2, 0.8, MT_AT.ban + 3); exclPush(x, z, 3); } }
      { const d = PD1 - 40, a = plAt(d), s = sAt(d), i = T.idx(s); if (a != null) { const [x, z] = atSf(s, a + LWh + 0.9), y = hyS(s), g = scen.get(x, z);
        box(g, x, y - 0.3, z, 0.22, 3.6, 0.22, T.hd[i], [0.45, 0.46, 0.48]); box(g, x, y + 2.6, z, 0.5, 1.2, 0.4, T.hd[i], [0.08, 0.08, 0.09]);
        const lr = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.12), new THREE.MeshBasicMaterial({ color: 0x3a0808 })), lgr = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.12), new THREE.MeshBasicMaterial({ color: 0x18ff60 }));
        for (const [m, yy] of [[lr, 3.45], [lgr, 2.9]]) { m.position.set(x - T.tx[i] * 0.25, y + yy, z - T.tz[i] * 0.25); m.rotation.y = -T.hd[i] + Math.PI / 2; root.add(m); }
        exclPush(x, z, 2); } }
    }

    /* ---- the buildings of OSM (their outlines and heights): stucco and metal under flat roofs; the grandstands (their outlines): aluminium
       bleachers facing the track, full of people ---- */
    let nBld = 0, nStands = 0;
    const crowdMat = ownTex(API.rbCrowdTex(false)), crowdG = new GB(true);
    {
      const WALL = [[0.9, 0.86, 0.76], [0.94, 0.92, 0.86], [0.78, 0.74, 0.66], [0.72, 0.74, 0.74], [0.86, 0.8, 0.68]], ROOF = [[0.62, 0.6, 0.56], [0.52, 0.5, 0.48], [0.7, 0.68, 0.64], [0.44, 0.46, 0.48]];
      const hg = new Chunks(256);
      for (const b of M.bld) {
        const h0 = b[0], kind = b[1], Pp = b.slice(2), n = Pp.length / 2;
        let cx = 0, cz = 0; for (let k = 0; k < n; k++) { cx += Pp[k * 2]; cz += Pp[k * 2 + 1]; } cx /= n; cz /= n;
        if (!inWorld(cx, cz)) continue;
        const nn = nrNear(cx, cz); if (nn.i >= 0 && nn.dd < 1.5) continue;   // (nothing inside the barriers)
        let y0 = 1e9; for (let k = 0; k < n; k++) y0 = Math.min(y0, nrGround(Pp[k * 2], Pp[k * 2 + 1]));
        if (kind === 2) {   // a grandstand: bleachers along its longest side, the tiers rising away from the track
          let best = 0, bk = 0; for (let k = 0; k < n; k++) { const j = (k + 1) % n, l = Math.hypot(Pp[j * 2] - Pp[k * 2], Pp[j * 2 + 1] - Pp[k * 2 + 1]); if (l > best) { best = l; bk = k; } }
          const ax = Pp[bk * 2], az = Pp[bk * 2 + 1], bx = Pp[((bk + 1) % n) * 2], bz = Pp[((bk + 1) % n) * 2 + 1], ux = (bx - ax) / best, uz = (bz - az) / best;
          let vx = -uz, vz = ux, dep = 0; for (let k = 0; k < n; k++) dep = Math.max(dep, Math.abs((Pp[k * 2] - ax) * vx + (Pp[k * 2 + 1] - az) * vz));
          { const q = T.query(cx, cz, nn.i >= 0 ? nn.i : -1, {}); const tq = [T.px[q.i] - cx, T.pz[q.i] - cz]; if (tq[0] * vx + tq[1] * vz > 0) { vx = -vx; vz = -vz; } }   // (the tiers rise away from the track)
          // (the front edge: the side nearest the track)
          let f0 = 1e9; for (let k = 0; k < n; k++) f0 = Math.min(f0, (Pp[k * 2] - cx) * vx + (Pp[k * 2 + 1] - cz) * vz);
          const fx = cx + vx * f0, fz = cz + vz * f0, rows = clamp(Math.round(dep / 0.85), 4, 16), rise = 0.5, dp = Math.min(0.85, dep / rows), Lh = best / 2, g = scen.get(cx, cz), alu = [0.78, 0.8, 0.82], aluD = [0.55, 0.57, 0.6];
          for (let r = 0; r < rows; r++) {   // the tiers: a riser, the seat plank, the crowd on it
            const o = r * dp, y = y0 + 0.4 + r * rise, A = [fx + vx * o - ux * Lh, y, fz + vz * o - uz * Lh], B = [fx + vx * o + ux * Lh, y, fz + vz * o + uz * Lh], Cc = [B[0] + vx * dp, y, B[2] + vz * dp], D = [A[0] + vx * dp, y, A[2] + vz * dp];
            g.quadO(A, B, Cc, D, alu, [cx, y - 3, cz]); g.quadO([A[0], y - rise, A[2]], [B[0], y - rise, B[2]], B, A, aluD, [cx + vx * 30, y, cz + vz * 30]);
            const v = (r * 0.11) % 1; crowdG.quadUp([A[0], y + 0.02, A[2]], [D[0], y + 0.02, D[2]], [Cc[0], y + 0.02, Cc[2]], [B[0], y + 0.02, B[2]], [W1, W1, W1, W1], [[0, v], [0, v + 0.1], [best / 12, v + 0.1], [best / 12, v]]);
          }
          const yb = y0 + 0.4 + (rows - 1) * rise, bkx = fx + vx * rows * dp, bkz = fz + vz * rows * dp;   // the back rail, the steel frame under it
          box(g, bkx, yb, bkz, best, 1.1, 0.06, Math.atan2(uz, ux), aluD, null, true);
          for (let q = -Lh; q <= Lh + 0.01; q += 4) for (const o of [0, rows * dp]) { const px = fx + ux * q + vx * o, pz = fz + uz * q + vz * o; box(g, px, y0 - 0.3, pz, 0.12, 0.7 + (o ? yb - y0 : 0.4), 0.12, 0, aluD); }
          for (let q = -Lh + 6; q < Lh - 4; q += 16) { const px = fx + ux * q + vx * rows * dp, pz = fz + uz * q + vz * rows * dp; flagAt(px, yb + 1.1, pz, 4.5, (q | 0) % 32 < 16 ? US : CAL); }
          exclPush(cx, cz, Math.max(best, dep) / 2 + 3); CR.exclAdd(cx, cz, Math.max(best, dep) / 2 + 2); crowdPts.push(cx, cz, 1); nStands++;
          continue;
        }
        const h = h0 > 0 ? h0 : 3.4 + crH(cx, cz, 61) * 1.6, wc = WALL[Math.floor(crH(cx, cz, 62) * WALL.length)], rc = ROOF[Math.floor(crH(cx, cz, 63) * ROOF.length)], g = hg.get(cx, cz);
        const top = y0 + h, c0 = [cx, y0 + h / 2, cz];
        for (let k = 0; k < n; k++) { const j = (k + 1) % n, a = [Pp[k * 2], y0 - 0.4, Pp[k * 2 + 1]], b2 = [Pp[j * 2], y0 - 0.4, Pp[j * 2 + 1]];
          g.quadO(a, b2, [b2[0], top, b2[2]], [a[0], top, a[2]], wc, c0);
          if (h > 4.5) for (let f = 1.2; f < h - 0.8; f += 3.2) { const sh = [wc[0] * 0.55, wc[1] * 0.6, wc[2] * 0.68], ex = (p) => [p[0] + (p[0] - cx) * 0.004, 0, p[2] + (p[2] - cz) * 0.004];   // (a band of windows on each floor)
            const ea = ex(a), eb = ex(b2); g.quadO([ea[0], y0 + f, ea[2]], [eb[0], y0 + f, eb[2]], [eb[0], y0 + f + 1.1, eb[2]], [ea[0], y0 + f + 1.1, ea[2]], sh, c0); } }
        for (let k = 1; k + 1 < n; k++) g.triO([Pp[0], top, Pp[1]], [Pp[k * 2], top, Pp[k * 2 + 1]], [Pp[(k + 1) * 2], top, Pp[(k + 1) * 2 + 1]], rc, [cx, top - 5, cz]);   // (the flat roof: a fan, the outlines are near convex)
        { const bb = mtBox(Pp); exclPush(cx, cz, Math.hypot(bb[2] - bb[0], bb[3] - bb[1]) / 2 + 2); CR.exclAdd(cx, cz, Math.hypot(bb[2] - bb[0], bb[3] - bb[1]) / 2 + 1); }
        nBld++;
      }
      hg.addTo(root, matV, true, true);
    }
    addM(crowdG, crowdUV(new THREE.MeshLambertMaterial({ map: crowdMat, vertexColors: true }), 1, 0.11, 0.1));

    /* ---- the footbridges over the track (OSM): a steel deck on two pairs of legs beyond the barriers, railings with mesh, stairs down at
       both ends, a banner on each face ---- */
    let nBridges = 0;
    for (const [d, hdg, len] of M.bridges || []) {
      const s = sAt(d), i = T.idx(s), a = hdg * Math.PI / 180, ux = Math.cos(a), uz = Math.sin(a), cx = T.px[i], cz = T.pz[i], y = T.hy[i] + 5.6, Lh = Math.max(len / 2, Math.max(T.bl[i], T.br[i]) + 4), g = scen.get(cx, cz);
      const rot = Math.atan2(uz, ux), st = [0.36, 0.38, 0.42], stL = [0.6, 0.62, 0.66];
      box(g, cx, y, cz, Lh * 2, 0.7, 3.0, rot, st, stL);
      for (const sd of [-1, 1]) { const ox = -uz * 1.45 * sd, oz = ux * 1.45 * sd; box(g, cx + ox, y + 0.7, cz + oz, Lh * 2, 1.1, 0.06, rot, [0.5, 0.52, 0.56], null, true); }
      for (const e of [-1, 1]) { const ex = cx + ux * e * (Lh - 1.5), ez = cz + uz * e * (Lh - 1.5), gy = nrGround(ex, ez);   // the legs, the stairs
        for (const sd of [-1, 1]) box(g, ex - uz * 1.2 * sd, gy - 0.3, ez + ux * 1.2 * sd, 0.35, y - gy + 0.3, 0.35, rot, st);
        const sx = cx + ux * e * (Lh + 4), sz = cz + uz * e * (Lh + 4), sy = nrGround(sx, sz);
        for (let k = 0; k < 8; k++) { const t = (k + 0.5) / 8, px = lerp(cx + ux * e * Lh, sx, t), pz = lerp(cz + uz * e * Lh, sz, t), py = lerp(y, sy, t); box(g, px, py - 0.2, pz, 1.0, 0.25, 2.4, rot, stL); } }
      for (const sd of [-1, 1]) { const ox = -uz * 1.52 * sd, oz = ux * 1.52 * sd, [u0, v0, u1, v1] = AUV(MT_AT.ban + (nBridges % 3 === 1 ? 2 : 0)), bw = Math.min(14, Lh * 1.4), hb = 1.6;
        const A = [cx + ox - ux * bw / 2, y - 0.2, cz + oz - uz * bw / 2], B = [cx + ox + ux * bw / 2, y - 0.2, cz + oz + uz * bw / 2], o2 = sd > 0 ? [A, B] : [B, A];
        ban.quadO(o2[0], o2[1], [o2[1][0], y - 0.2 + hb, o2[1][2]], [o2[0][0], y - 0.2 + hb, o2[0][2]], W1, [cx, y + 0.6, cz], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
      exclPush(cx, cz, Lh + 6); nBridges++;
    }

    /* ---- turn numbers, the braking boards before the slow corners, marshals' posts ---- */
    (def.turns || []).forEach(([tx0, tz0], k) => { const i0 = T.nearestIdx(tx0, tz0), side = T.k[i0] > 0 ? -1 : 1, s = i0 * ds - 60;
      if (side < 0 && inPit(T.idx(s))) return; signPost(s, side, 1.6, MT_AT.num + k, 1.3, 1.3, 1.0); });
    for (const c of T.corners) { if (c.sev < 3) continue; const side = -c.dir;
      for (let k = 0; k < 3; k++) { const s = c.i0 * ds - 100 * (k + 1) - 20, i = T.idx(s); if ((side < 0 && inPit(i)) || T.k[i] * side > 0.004) continue; signPost(s, side, 1.4, MT_AT.brake + (2 - k), 1.2, 0.8, 0.9); } }
    for (let d = 300, k = 0; d < L - 300; d += 360, k++) {
      const s = sAt(d), side = k % 2 ? 1 : -1, [x, z, i] = onSide(s, side, 3.0), y = nrGround(x, z), g = scen.get(x, z);
      if (excluded(x, z) || (side < 0 && inPit(i)) || nrSlope(x, z) > 0.5) continue;
      box(g, x, y - 0.2, z, 2.0, 2.4, 2.0, T.hd[i], [0.92, 0.92, 0.9], [0.8, 0.14, 0.12], true); box(g, x - T.nx[i] * side * 0.3, y + 1.1, z - T.nz[i] * side * 0.3, 1.4, 0.6, 2.05, T.hd[i], [0.2, 0.24, 0.28], null, true);
      exclPush(x, z, 4); CR.avoid(x, z, 2.5);
    }

    /* ---- the park's roads (OSM): asphalt draped on the ground, a double yellow centre line and white edge lines on the two-lane roads,
       dirt for the tracks and the paths; nothing inside the circuit's barriers (the roads pass under the bridges) ---- */
    const roadMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
    const dirtMat = new THREE.MeshLambertMaterial({ map: gvTex, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
    const markMat = new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    const roads = new Chunks(256, true), dirt = new Chunks(256, true), marks = new Chunks(256);
    const RY = (x, z) => nrGround(x, z) + 0.05, ok = (x, z) => { const n = nrNear(x, z); return !(n.i >= 0 && n.dd < 3) && inWorld(x, z); };
    const JR = (M.junc || []).map(([x, z]) => [x, z]);
    const inJ = (x, z, r) => { for (const [jx, jz] of JR) if (Math.abs(x - jx) < r && Math.abs(z - jz) < r && Math.hypot(x - jx, z - jz) < r) return true; return false; };
    const disc = (ch, x, z, r, col) => { if (!ok(x, z)) return; const g = ch.get(x, z), c = [x, RY(x, z), z];   // (the round patch where two pieces of a road meet, and over a junction)
      for (let k = 0; k < 10; k++) { const a0 = k / 10 * TAU, a1 = (k + 1) / 10 * TAU, p0 = [x + Math.cos(a0) * r, 0, z + Math.sin(a0) * r], p1 = [x + Math.cos(a1) * r, 0, z + Math.sin(a1) * r];
        p0[1] = RY(p0[0], p0[2]); p1[1] = RY(p1[0], p1[2]); g.triO(c, p0, p1, col, [x, c[1] - 5, z], col, col, [x / 8, z / 8], [p0[0] / 8, p0[2] / 8], [p1[0] / 8, p1[2] / 8]); } };
    const strip = (ch, pts, o0, o1, col, uv, dash, cut) => {   // a band from o0 to o1 m (+ right) along the polyline, on the ground (cut: not inside the junctions)
      let acc = 0;
      for (let k = 0; k + 1 < pts.length; k++) {
        const [x0, z0] = pts[k], [x1, z1] = pts[k + 1], l = Math.hypot(x1 - x0, z1 - z0) || 1, n = Math.max(1, Math.ceil(l / 4)), nx = -(z1 - z0) / l, nz = (x1 - x0) / l;
        for (let q = 0; q < n; q++, acc += l / n) {
          if (dash && (Math.floor(acc / dash[0]) % 2)) continue;
          const xa = x0 + (x1 - x0) * q / n, za = z0 + (z1 - z0) * q / n, xb = x0 + (x1 - x0) * (q + 1) / n, zb = z0 + (z1 - z0) * (q + 1) / n;
          if (!ok(xa, za) || !ok(xb, zb) || (cut && (inJ(xa, za, cut) || inJ(xb, zb, cut)))) continue;
          const Q = [[xa + nx * o0, za + nz * o0], [xa + nx * o1, za + nz * o1], [xb + nx * o1, zb + nz * o1], [xb + nx * o0, zb + nz * o0]].map(([x, z]) => [x, RY(x, z) + (uv ? 0 : 0.012), z]);
          ch.get(xa, za).quadUp(Q[0], Q[1], Q[2], Q[3], [col, col, col, col], uv ? Q.map(p => [p[0] / 8, p[2] / 8]) : null);
        }
      }
    };
    const asp = [0.82, 0.81, 0.8], dc = [1.06, 0.94, 0.78], YL = [0.95, 0.74, 0.12], WL = [0.92, 0.92, 0.88];
    const RL = (M.roads || []).map(r => { const pts = []; for (let k = 2; k < r.length; k += 2) pts.push([r[k], r[k + 1]]); return { c: r[0], w: r[1], pts }; });
    for (const r of RL) {
      const hw = r.w / 2;
      if (r.c >= 5) { strip(dirt, r.pts, -hw, hw, r.c === 6 ? [1.12, 1.0, 0.84] : dc, true); continue; }
      strip(roads, r.pts, -hw, hw, asp, true);
      for (let k = 1; k + 1 < r.pts.length; k++) disc(roads, r.pts[k][0], r.pts[k][1], hw, asp);
      if (r.c <= 3) { for (const o of [-0.14, 0.14]) strip(marks, r.pts, o - 0.06, o + 0.06, YL, false, null, hw + 4); for (const sd of [-1, 1]) strip(marks, r.pts, sd * (hw - 0.35), sd * (hw - 0.22), WL, false, null, hw + 2.5); }   // the double yellow, the edge lines (not across the junctions)
    }
    for (const [jx, jz] of JR) { let hw = 0; for (const r of RL) if (r.c <= 4 && r.pts.some(p => Math.hypot(p[0] - jx, p[1] - jz) < 1.2)) hw = Math.max(hw, r.w / 2); if (hw) disc(roads, jx, jz, hw + 1.2, asp); }
    roads.addTo(root, roadMat, false, true); dirt.addTo(root, dirtMat, false, true);
    /* ---- the junctions (OSM: where three or more roads meet): as in the US, a stop sign with the street names on top on the approaches of the
       smaller roads (all of them where the roads are alike: an all-way stop), the white stop bar across their lane, a crosswalk where the
       spectators walk, a street lamp, a hydrant, the warning signs on the bigger road, a speed limit sign beyond; all knockable (Core PROPK) ---- */
    let nJunc = 0;
    const furn = (kind, x, z, yaw) => { if (!ok(x, z) || excluded(x, z)) return false; out.props.push({ kind, x, z, yaw, i: nrNear(x, z).i }); return true; };
    const faceYaw = (ux, uz) => Math.atan2(-ux, uz);   // a prop's face (local +z) to the direction (ux, uz)
    const nearCrowd = (x, z) => { for (let k = 0; k < crowdPts.length; k += 3) if (Math.hypot(crowdPts[k] - x, crowdPts[k + 1] - z) < 220) return true; return false; };
    for (const [jx, jz] of M.junc || []) {
      if (!inWorld(jx, jz) || !ok(jx, jz)) continue;
      const arms = [];
      RL.forEach((r, ri) => { if (r.c > 4) return; const p = r.pts;
        for (let k = 0; k < p.length; k++) if (Math.hypot(p[k][0] - jx, p[k][1] - jz) < 1.2) {   // the junction's point on this road: an arm each way (thru: the road goes on through it)
          const thru = k > 0 && k < p.length - 1;
          for (const q of [k - 1, k + 1]) if (q >= 0 && q < p.length) { const dx = p[q][0] - jx, dz = p[q][1] - jz, l = Math.hypot(dx, dz) || 1; arms.push({ ux: dx / l, uz: dz / l, c: r.c, hw: r.w / 2, l, ri, thru }); } } });
      if (arms.length < 3) continue;
      // which arms stop: the road that goes on through the junction (the biggest such) has the right of way; where every road ends here,
      // the biggest road's two arms do, if there is one bigger than the rest; else all of them stop (an all-way stop, as in the park)
      const th = arms.filter(a => a.thru), top = Math.min(...arms.map(a => a.c)), hwJ = Math.max(...arms.map(a => a.hw));
      let pair = null, pc = 1e9;   // (OSM's roads end at their junctions: the through road is the straightest pair of arms of the same, biggest kind)
      for (let p = 0; p < arms.length; p++) for (let q = p + 1; q < arms.length; q++) { const A = arms[p], B = arms[q], dt = A.ux * B.ux + A.uz * B.uz;
        if (A.c === B.c && dt < -0.8 && (A.c < pc || (A.c === pc && dt < pair.dt))) { pair = { a: A, b: B, dt }; pc = A.c; } }
      if (th.length) { const ri = th.reduce((b, a) => (a.c < b.c ? a : b)).ri; pair = { a: th.find(a => a.ri === ri), b: th.filter(a => a.ri === ri)[1] }; }
      const stops = (a) => !pair || (a !== pair.a && a !== pair.b), allWay = arms.every(stops);
      const busy = nearCrowd(jx, jz); let any = false;
      for (const a of arms) {
        const rx = a.uz, rz = -a.ux, dStop = hwJ + 3.5;   // (the approach drives along -u: its right is (uz, -ux))
        if (stops(a)) {
          any = furn('stop', jx + a.ux * dStop + rx * (a.hw + 1.3), jz + a.uz * dStop + rz * (a.hw + 1.3), faceYaw(a.ux, a.uz)) || any;
          const sb = dStop - 1.2, P0 = [[jx + a.ux * sb, jz + a.uz * sb], [jx + a.ux * (sb + 0.45), jz + a.uz * (sb + 0.45)]];   // the stop bar across the approach lane
          strip(marks, P0, 0.1, a.hw - 0.2, WL);
          if (busy) for (let q = -a.hw + 0.4; q < a.hw - 0.3; q += 1.2) { const c0 = dStop - 3.2, Pz = [[jx + a.ux * c0 + rx * q, jz + a.uz * c0 + rz * q], [jx + a.ux * (c0 - 2.6) + rx * q, jz + a.uz * (c0 - 2.6) + rz * q]]; strip(marks, Pz, -0.3, 0.3, WL); }   // (a ladder crosswalk)
        } else if (a.l > 30) {
          furn('warn', jx + a.ux * 55 + rx * (a.hw + 1.4), jz + a.uz * 55 + rz * (a.hw + 1.4), faceYaw(a.ux, a.uz));
          furn('sign', jx + a.ux * 22 - rx * (a.hw + 1.4), jz + a.uz * 22 - rz * (a.hw + 1.4), faceYaw(-a.ux, -a.uz));
        }
      }
      { const a = arms[0], b = arms[1], cx = jx + (a.ux + b.ux) * (hwJ + 2.5) * 0.7, cz = jz + (a.uz + b.uz) * (hwJ + 2.5) * 0.7;   // a lamp on a corner, its arm over the junction
        if (top <= 3 || busy) furn('lamp', cx, cz, Math.atan2(jz - cz, jx - cx)); }
      { const a = arms[arms.length - 1], rx = a.uz, rz = -a.ux; furn('hydrant', jx + a.ux * (hwJ + 6) - rx * (a.hw + 1.6), jz + a.uz * (hwJ + 6) - rz * (a.hw + 1.6), R() * TAU); }
      if (busy) { const a = arms[1], rx = a.uz, rz = -a.ux; furn('bin', jx + a.ux * (hwJ + 5) + rx * (a.hw + 1.5), jz + a.uz * (hwJ + 5) + rz * (a.hw + 1.5), R() * TAU);
        for (let q = 0; q < 3; q++) furn('bollard', jx + a.ux * (hwJ + 1.5 + q * 1.4) - rx * (a.hw + 0.8), jz + a.uz * (hwJ + 1.5 + q * 1.4) - rz * (a.hw + 0.8), 0); }
      if (any && nJunc % 2 === 0) { const a = arms[2], rx = a.uz, rz = -a.ux; furn('cabinet', jx + a.ux * (hwJ + 8) - rx * (a.hw + 2.2), jz + a.uz * (hwJ + 8) - rz * (a.hw + 2.2), faceYaw(-rx, -rz)); }
      exclPush(jx, jz, hwJ + 4); nJunc++;
    }
    marks.addTo(root, markMat, false, true);

    /* ---- the car parks (OSM) full of cars in rows, the camp grounds (OSM) with motorhomes, trailers, pick-ups and tents ---- */
    // (cheap shapes, seen from above: a body and a cabin, no wheels or bottoms; a dark patch under each for its shadow: they cast none)
    const shd = (g, L, Wd) => g.quadUp([-L / 2, 0.03, -Wd / 2], [L / 2, 0.03, -Wd / 2], [L / 2, 0.03, Wd / 2], [-L / 2, 0.03, Wd / 2], [[0.08, 0.08, 0.08], [0.08, 0.08, 0.08], [0.08, 0.08, 0.08], [0.08, 0.08, 0.08]]);
    const carGeo = (() => { const g = new GB(); shd(g, 4.9, 2.1); box(g, 0, 0.12, 0, 4.5, 0.9, 1.8, 0, [1, 1, 1], [1, 1, 1], true); box(g, -0.3, 1.02, 0, 2.3, 0.5, 1.6, 0, [0.3, 0.34, 0.4], [1, 1, 1], true); return g.geometry(); })();
    const rvGeo = (() => { const g = new GB(); shd(g, 10, 2.9); box(g, 0, 0.3, 0, 9.5, 2.9, 2.5, 0, [1, 1, 1], [0.95, 0.95, 0.95], true); box(g, 0.2, 1.5, 0, 6.6, 0.55, 2.52, 0, [0.24, 0.3, 0.36], null, true); return g.geometry(); })();
    const trlGeo = (() => { const g = new GB(); shd(g, 7, 2.7); box(g, 0, 0.3, 0, 6.5, 2.5, 2.3, 0, [0.96, 0.96, 0.94], [0.86, 0.86, 0.86], true); box(g, 0, 1.5, 0, 4, 0.45, 2.32, 0, [0.24, 0.3, 0.36], null, true); return g.geometry(); })();
    const tentGeo = (() => { const g = new GB(); shd(g, 2.9, 2.5); gable(g, 0, 0, 0, 2.6, 2.2, 1.4, 0, [1, 1, 1], [0.9, 0.9, 0.9]); return g.geometry(); })();
    const vMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const cars = new IChunks(carGeo, vMat, 768), rvs = new IChunks(rvGeo, vMat, 768), trls = new IChunks(trlGeo, vMat, 768), tents = new IChunks(tentGeo, vMat, 768);
    const CARC = [[0.95, 0.95, 0.94], [0.12, 0.13, 0.14], [0.6, 0.62, 0.66], [0.72, 0.12, 0.12], [0.2, 0.3, 0.55], [0.85, 0.85, 0.82], [0.35, 0.36, 0.38], [0.15, 0.32, 0.25], [0.78, 0.68, 0.5], [0.3, 0.42, 0.6]];
    let nCars = 0, nCamp = 0;
    const lotFill = (Pp, f, put) => {   // rows across the lot's longest side, 6 m apart, a slot every 2.8 m
      const n = Pp.length / 2; let best = 0, bk = 0; for (let k = 0; k < n; k++) { const j = (k + 1) % n, l = Math.hypot(Pp[j * 2] - Pp[k * 2], Pp[j * 2 + 1] - Pp[k * 2 + 1]); if (l > best) { best = l; bk = k; } }
      const ux = (Pp[((bk + 1) % n) * 2] - Pp[bk * 2]) / best, uz = (Pp[((bk + 1) % n) * 2 + 1] - Pp[bk * 2 + 1]) / best, b = mtBox(Pp), R0 = Math.hypot(b[2] - b[0], b[3] - b[1]) / 2, cx = (b[0] + b[2]) / 2, cz = (b[1] + b[3]) / 2;
      for (let v = -R0; v < R0; v += f[1]) for (let u = -R0; u < R0; u += f[0]) { const x = cx + ux * u - uz * v, z = cz + uz * u + ux * v; if (!mtIn(Pp, x, z) || !ok(x, z) || excluded(x, z) || nrSlope(x, z) > 0.3) continue; put(x, z, Math.atan2(uz, ux)); } };
    for (const Pp of M.park || []) lotFill(Pp, [2.8, 6.2], (x, z, a) => { if (R() < 0.3 || nCars > 2600 || nrDist(x, z) > 260) return; cars.add(x, nrGround(x, z) - 0.04, z, -(a + Math.PI / 2 + (R() < 0.5 ? Math.PI : 0) + (R() - 0.5) * 0.08), 1, 1, CARC[Math.floor(R() * CARC.length)]); nCars++; });
    for (const Pp of M.camp || []) lotFill(Pp, [9.5, 14], (x, z, a) => { if (nCamp > 700 || nrDist(x, z) > 300) return; const r = R(), y = nrGround(x, z) - 0.05, rot = -(a + (R() - 0.5) * 0.4), cc = [0.94 + R() * 0.06, 0.93 + R() * 0.06, 0.9 + R() * 0.08];
      if (r < 0.15) return; if (r < 0.55) rvs.add(x, y, z, rot, 1, 1, cc); else if (r < 0.8) trls.add(x, y, z, rot, 1, 1, cc); else tents.add(x, y, z, rot, 1, 1, [[0.2, 0.42, 0.7], [0.85, 0.4, 0.15], [0.3, 0.55, 0.3], [0.9, 0.8, 0.3]][Math.floor(R() * 4)]);
      if (R() < 0.6) cars.add(x + Math.cos(-rot) * 0 + Math.sin(-rot) * 4.2, y, z - Math.cos(-rot) * 4.2, rot, 1, 1, CARC[Math.floor(R() * CARC.length)]);   // (a pick-up or a car beside it)
      exclPush(x, z, 5); nCamp++; });
    for (const Pp of (M.park || []).concat(M.camp || [])) { const b = mtBox(Pp); CR.exclAdd((b[0] + b[2]) / 2, (b[1] + b[3]) / 2, Math.min(40, Math.hypot(b[2] - b[0], b[3] - b[1]) / 2)); }

    /* ---- the crowds on the banks (def.ga), and groups along the fences ---- */
    {
      const MO = { first: 2.2, gap: 1.2, excluded, below: 4, above: 30, sit: 0.5, flag: 0, maxSlope: 0.95 };
      for (const [a, b, sd] of def.ga || []) { crowdRun(CR, sStart + a, sStart + b, sd, Object.assign({}, MO, { rows: 8, dens: 0.55, gap: 1.3, clump: 0.7, label: 'MT ga' }));
        for (let d = a; d < b; d += 24) { const [x, z] = onSide(sAt(d), sd, 6); crowdPts.push(x, z, 0.7); } }
      for (const sd of [-1, 1]) crowdRun(CR, sStart + 600, sStart + L - 600, sd, Object.assign({}, MO, { rows: 2, dens: 0.04, clump: 0.95, strip: false, label: 'MT groups' }));
      for (const e of CR.circ) exclPush(e.x, e.z, e.r);
    }
    cars.addTo(root, false); rvs.addTo(root, false); trls.addTo(root, false); tents.addTo(root, false);

    /* ---- water: the lake and the ponds of the infield (OSM), at the level of their shore ---- */
    { const gw = new GB(true), V = (p) => new THREE.Vector2(p[0], p[1]);
      for (const lk of lakes) { const Pp = lk.P, pts = []; for (let k = 0; k < Pp.length; k += 2) pts.push([Pp[k], Pp[k + 1]]);
        const Q = (p) => [p[0], lk.y, p[1]], uv = (p) => [p[0] / 16, -p[1] / 16];
        for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(pts.map(V), [])) { const A = pts[a], B = pts[b], Cc = pts[c]; gw.triO(Q(A), Q(B), Q(Cc), W1, [A[0], lk.y - 5, A[1]], W1, W1, uv(A), uv(B), uv(Cc)); }
        exclPush((lk.b[0] + lk.b[2]) / 2, (lk.b[1] + lk.b[3]) / 2, Math.hypot(lk.b[2] - lk.b[0], lk.b[3] - lk.b[1]) / 2); }
      if (!gw.empty) {   // the water, and the shore band round each pond (the shallows, a little foam at the waterline)
        const WO = { len: 0.6, amp: 0.35, refl: 0.45, land: 0.7, shal: 0.7, lap: 0.35, surf: 0 }, wm = new THREE.Mesh(gw.geometry(), waterMat(tex, Object.assign({ color: 0x7f9a86 }, WO)));
        wm.receiveShadow = true; wm.matrixAutoUpdate = false; wm.updateMatrix(); root.add(wm); out.dyn.water = tex.water;
        const bands = lakes.map(lk => shoreBand(lk.b[0] - 6, lk.b[1] - 6, lk.b[2] + 6, lk.b[3] + 6, lk.y + 0.015, (x, z) => (mtIn(lk.P, x, z) ? 1 : -1) * edgeD(lk.P, x, z), 16));
        addShore(root, mergeBands(bands), wm.material, WO); } }

    /* ---- trees: coast live oaks in the woodland (the land cover's class 1) and alone in the golden grass, chaparral on the slopes (class 2), a
       few Monterey pines by the buildings ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const tk = [new IChunks(mtTreeGeo(0), tMat, 512), new IChunks(mtTreeGeo(1), tMat, 512), new IChunks(mtTreeGeo(2), tMat, 512)];
    const tf = [new IChunks(mtTreeGeo(3), tMat, 768), new IChunks(mtTreeGeo(4), tMat, 768)];
    let nTrees = 0;
    const maxT = Math.round(11000 * dens);
    {
      const Lt = NRC * NRT;
      for (let tj = 0; tj < G.ntz && nTrees < maxT; tj++) for (let ti = 0; ti < G.ntx && nTrees < maxT; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt; zz += 6) for (let xx = xa; xx < xa + Lt; xx += 6) {
          const x = xx + (R() - 0.5) * 5, z = zz + (R() - 0.5) * 5, rd = nrDist(x, z), r1 = R(), cl = nrLC(x, z);
          if (rd > 330) continue;
          const p = cl === 1 ? 0.3 : cl === 2 ? 0.22 : cl === 3 ? 0.008 : rd > 45 ? 0.022 : 0.004;   // (the oak savanna: lone oaks out in the grass)
          if (r1 > p) continue;
          if (rd < 40) { const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 5) continue; }
          if (excluded(x, z) || P.pad(x, z, 0) !== 0) continue;
          const y = nrGround(x, z), far = rd > 90, cv = 0.82 + R() * 0.26;
          if (cl === 2 && R() < 0.85) { const hgt = 1.4 + R() * 1.8, wid = hgt * (1.3 + R() * 0.5); (far ? tf[1] : tk[1]).add(x, y - 0.2, z, R() * TAU, wid, hgt, [cv * 0.95, cv, cv * 0.9]); nrShade(x, z, wid * 0.3, 0.5); nTrees++; continue; }
          const pine = cl === 3 && R() < 0.5, hgt = pine ? 14 + R() * 8 : 7 + R() * 7, wid = pine ? hgt * 0.5 : hgt * (1.3 + R() * 0.4);   // (the oaks broader than tall)
          if (pine) tk[2].add(x, y - 0.1, z, R() * TAU, wid, hgt, [cv, cv, cv]); else (far ? tf[0] : tk[0]).add(x, y - 0.15, z, R() * TAU, wid, hgt, [cv * 0.97, cv, cv * 0.94]);
          nrShade(x, z, wid * 0.42, 1); nTrees++;
        }
      }
    }
    for (const t of tk) t.addTo(root, true);
    for (const t of tf) t.addTo(root, false);

    /* ---- terrain tiles, coloured now (the shade under the trees) ---- */
    let nTiles = 0;
    { const grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let k = 0; k < tiles.length; k += 3) { const m = new THREE.Mesh(nrTileGeo(tiles[k], tiles[k + 1], tiles[k + 2] === 1 ? 1 : 4), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); nTiles++; }
      G.col = G.cov = P.edge = null; }

    // knockable props: cones on the noses of the pit lane, tyre stacks at the exits of the slow corners, the junctions' street furniture (above).
    // Their floor: the verge's next to the road, the terrain itself farther out (the junctions)
    out.propR = 150;
    const vf = propFloorTable(null, (i, side) => verge(i, side));
    out.propFloor = (q, near) => (Math.abs(q.d) > w + 11 && q.x !== undefined ? nrGround(q.x, q.z) - (T.hasElev ? T.elevAt(q.s).y : 0) : vf(q, near));
    for (const [d0, dd] of [[PD0 + 20, 4], [PD1 - 20, -4]]) for (let k = 0; k < 3; k++) { const d = d0 + k * dd, a = plAt(d); if (a == null) continue; const o = (a + 3.25 - (w + 0.8)) / 2; if (a + 3.25 + w + 0.8 > -1.5) continue; const [x, z] = atSf(sAt(d), o); out.props.push({ kind: 'cone', x, z, yaw: R() * TAU, col: 0 }); }
    out.propStats = roadsideProps(out.props, { post: null, postEdge: [1.4, 2.0], exits: 4, apexes: 0, wallEdge: [1.6, 2.2], stacks: [4, 6], rows2: 0.2,
      floor: out.propFloor, skip: (i, side) => { const d = dS(i * ds); return (d > -330 && d < 150) || (side < 0 && inPit(i)); } });
    out.propStats.junctions = nJunc;
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: atlas })); if (bm) bm.castShadow = false;
    addM(fenceG, fMat);
    crowdFinish(CR, root, out);
    if (flagL.length) root.add(API.rbFlags(flagL, CR.U.uTime));
    out.crowdPts = Float32Array.from(crowdPts);
    if (def.far) out.dyn.far = API.rsFar(root, def.far, sea, hyS(sStart) + 6, mtFarCol(sea));
    out.stats = { tiles: nTiles, trees: nTrees, buildings: nBld, stands: nStands, bridges: nBridges, boxes: nBoxes, junctions: nJunc, cars: nCars, camp: nCamp, decals: nDecals, flags: flagL.length };   // (read by the tests)
    return out;
  }

  World.ext.monterey = (scene, tex, opts) => buildMonterey(scene, tex, opts);
})();
