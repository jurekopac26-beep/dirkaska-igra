/* =========================================================================
   WORLD — Nürburg (theme 'nring'; its corridor helpers stay in js/world.js): its own builder (World.ext.nring), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (LOD, T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, NRC, NRT, RB, TAU, atS, atSf, box, clamp, cone, crH, crowdAt, crowdCtx, crowdFinish, crowdRun, crowdUV, cyl, gable,
    lerp, nrAUV, nrAtlas, nrBankY, nrConcTex, nrDecalTex, nrDist, nrEdge, nrGCol, nrGrassTex, nrGround, nrLC, nrLump, nrNUV, nrNear, nrNumTex,
    nrPrep, nrShade, nrSlope, nrTileGeo, nrTileOn, nrTreeGeo, nringProps, rng, sstep, vary
  } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  function buildNring(scene, tex, opts) {
    const R = rng(9120), N = T.N, w = T.w, ds = T.ds, dens = opts.density || 1, sStart = T.startS, def = T.def;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: nrGround, camFloor: nrGround, props: [], farClip: true, ownTex: [], ownMarks: true };   // (ownMarks: the decals below paint the tyre marks)
    nrPrep();
    const P = API.NR, G = P.G;
    out.bounds = { minX: P.x0, maxX: P.x1, minZ: P.z0, maxZ: P.z1 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 64;   // tree exclusion circles (buildings, crowds, bridges), hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    const dS = (s) => { let d = s - sStart; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line along the lap
    const sAt = (d) => ((sStart + d) % T.len + T.len) % T.len;
    const nameD = (n) => { const f = T.names.find(q => q.n === n); return f ? f.d : null; };

    /* ---- terrain tiles: which ones (they are built at the end, when the trees have darkened the ground under them) ---- */
    const gMat = new THREE.MeshLambertMaterial({ map: nrGrassTex(tex.grass.anisotropy), vertexColors: true }); out.ownTex.push(gMat.map);
    const tiles = [];
    for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { const on = nrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; tiles.push(ti, tj, on); }

    /* ---- the Karussell: the banked concrete bowl on the inside of the left-hander (lighter slabs on the inner half of the road) ---- */
    const kar = (() => { const d = nameD('Karussell'); if (d == null) return null; let i = T.idx(sAt(d)), a = i, b = i;
      for (let n = 0; n < 60 && T.k[(a - 1 + N) % N] < -1 / 70; n++) a = (a - 1 + N) % N;
      for (let n = 0; n < 60 && T.k[(b + 1) % N] < -1 / 70; n++) b = (b + 1) % N;
      return { a: (a - 6 + N) % N, b: (b + 4) % N }; })();
    const inKar = (i) => kar && (kar.a <= kar.b ? i >= kar.a && i <= kar.b : i >= kar.a || i <= kar.b);

    /* ---- road: asphalt, white edge lines, kerbs, grass verges out past the rails (256 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y + nrBankY(i, o), T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true }), cMat = new THREE.MeshLambertMaterial({ map: tex.curb, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    // kerbs: inside of every bend, outside only in the tighter ones; none on the inside of the banked bowls (concrete there)
    const bowl = (i) => T.bank && T.bank[i] > 0.08;
    const kerb = [new Uint8Array(N), new Uint8Array(N)];
    for (let i = 0; i < N; i++) if (T.curb[i]) { const k = T.k[i]; for (const side of [-1, 1]) { const inside = side * k > 0; if (bowl(i) && side === T.bankSide[i]) continue; if (inside || Math.abs(k) > 1 / 55) kerb[side > 0 ? 1 : 0][i] = 1; } }
    const CH = 128, offs = [-w, -w * 2 / 3, -w / 3, 0, w / 3, w * 2 / 3, w], tileL = 8;
    // asphalt tone: resurfaced sections of 120-260 m (seams across the road), the rubbered racing line, darker still in the braking zones of the slower corners
    const secT = new Float32Array(N), brk = new Float32Array(N);
    for (let i0 = 0, k = 0; i0 < N; k++) { const n = 60 + Math.floor(crH(k, 3, 91) * 70), t = 0.9 + crH(k, 5, 91) * 0.17; for (let i = i0; i < Math.min(N, i0 + n); i++) secT[i] = t; i0 += n; }
    for (const c of T.corners) if (c.sev >= 2) for (let k = -60; k <= 6; k++) { const i = (c.i0 + k + N) % N, f = k < -10 ? sstep(-60, -12, k) : sstep(6, -10, k); if (f > brk[i]) brk[i] = f; }
    const shade = (i, o) => { const rl = T.rl[i]; let k = (0.8 - (0.15 + 0.1 * brk[i]) * Math.exp(-((o - rl) * (o - rl)) / 5)) * secT[i]; if (Math.abs(o) > w * 0.92) k -= 0.03;
      return [k, k, k * 1.02]; };
    const vergeRow = (i, side) => {   // cross-section beyond the road edge: [offset, height above the road], lifted onto the ground where it rises
      const bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i] + nrBankY(i, side * w), lift = (o, h) => { const q = side * o, g = nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.06 - y; return [o, Math.max(h, g)]; };
      return [[w, 0.0], [w + 1.2, -0.04], lift(Math.max(w + 1.8, bar - 0.4), -0.1), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)];
    };
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB(true), gl = new RB(), gk = new RB(true);
      let pr = -1, pl = -1, pk = [-1, -1];
      for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
        const i = ii % N, v = ii * ds / tileL;
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o)), offs.map(o => [(o + w) / tileL, v]));
        if (pr >= 0) gr.link(pr, r, 0, offs.length - 1); pr = r;
        const wl = [0.94, 0.94, 0.9], l = gl.row([Pt(i, -w + 0.2, 0.034), Pt(i, -w + 0.5, 0.034), Pt(i, w - 0.5, 0.034), Pt(i, w - 0.2, 0.034)], [wl, wl, wl, wl]);
        if (pl >= 0) { const bs = bowl(i) ? T.bankSide[i] : 0; if (bs >= 0) gl.link(pl, l, 0, 1); if (bs <= 0) gl.link(pl, l, 2, 3); } pl = l;   // (no edge line along a bowl's concrete)
        for (const side of [-1, 1]) {
          const si = side > 0 ? 1 : 0;
          if (kerb[si][i]) {   // red/white kerb in 1 m blocks: a sloped inner edge, a flat top, a low outer lip
            const cw = T.curbW, pf = [[w - 0.02, 0.035], [w + 0.14, 0.078], [w + cw - 0.12, 0.085], [w + cw + 0.02, 0.03]], v = ii * ds / 2;
            const sh = [0.84, 1, 1, 0.78].map(k => [k, k, k]), us = [0, 0.1, 0.92, 1], o = side > 0 ? [0, 1, 2, 3] : [3, 2, 1, 0];
            const rk = gk.row(o.map(k => Pt(i, side * pf[k][0], pf[k][1])), o.map(k => sh[k]), o.map(k => [us[k], v]));
            if (pk[si] >= 0) gk.link(pk[si], rk, 0, 3); pk[si] = rk;
          } else pk[si] = -1;
        }
      }
      addM(gr, aMat); addM(gl, lMat); addM(gk, cMat);
    }
    // chequered start / finish line and the grid boxes (a box for every car: the player and def.rivals, at least 14, staggered)
    {
      const gq = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1], wh = [0.93, 0.93, 0.9], HYp = (p) => T.hy[p[3]], nBox = Math.max(14, (def.rivals || 0) + 1);
      const a = atSf(sStart - 0.8, -w), b = atSf(sStart - 0.8, w), c = atSf(sStart + 0.8, w), d = atSf(sStart + 0.8, -w);
      gq.quadUp([a[0], HYp(a) + 0.04, a[1]], [b[0], HYp(b) + 0.04, b[1]], [c[0], HYp(c) + 0.04, c[1]], [d[0], HYp(d) + 0.04, d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      for (let k = 1; k <= nBox; k++) {
        const sb = sStart - 9 - (k - 1) * 7.5 + 2.6, lat = (k % 2 === 1 ? -1 : 1) * 3.4;
        const p0 = atSf(sb, lat - 1.5), p1 = atSf(sb, lat + 1.5), p2 = atSf(sb + 0.35, lat + 1.5), p3 = atSf(sb + 0.35, lat - 1.5);
        gw.quadUp([p0[0], HYp(p0) + 0.037, p0[1]], [p1[0], HYp(p1) + 0.037, p1[1]], [p2[0], HYp(p2) + 0.037, p2[1]], [p3[0], HYp(p3) + 0.037, p3[1]], [wh, wh, wh, wh]);
        const q0 = atSf(sb - 1.6, lat - 1.5), q1 = atSf(sb + 0.35, lat - 1.5), q2 = atSf(sb + 0.35, lat - 1.25), q3 = atSf(sb - 1.6, lat - 1.25);
        gw.quadUp([q0[0], HYp(q0) + 0.037, q0[1]], [q1[0], HYp(q1) + 0.037, q1[1]], [q2[0], HYp(q2) + 0.037, q2[1]], [q3[0], HYp(q3) + 0.037, q3[1]], [wh, wh, wh, wh]);
      }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw, lMat);
    }

    /* ---- barriers: double armco on posts nearly everywhere, concrete walls with catch fences along the T13 straight, concrete parapets on the bridges ---- */
    const bridgeI = (def.brO || []).map(([x, z]) => T.nearestIdx(x, z));
    const onBridge = (i) => { for (const b of bridgeI) { let d = Math.abs(i - b); d = Math.min(d, N - d); if (d * ds < 16) return true; } return false; };
    const t13 = (i) => { const d = dS(i * ds); return d > T.len - 230 || d < 170; };   // start / finish area
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const postGeo = (() => { const g = new GB(); box(g, 0, 0, 0, 0.13, 1, 0.13, 0, [0.42, 0.43, 0.46], null, true); return g.geometry(); })();
    const posts = new IChunks(postGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), 256);
    const fence = [new Uint8Array(N), new Uint8Array(N)];   // catch fences (set below where the spectators stand)
    const kind = (i) => (onBridge(i) ? 2 : t13(i) ? 1 : 0);   // 0 armco, 1 wall + fence, 2 parapet
    const steel = [0.8, 0.82, 0.85], steelD = [0.5, 0.52, 0.56], conc = [0.72, 0.72, 0.7], concD = [0.6, 0.6, 0.58];
    const railRow = (gr, i, side, k) => {   // guardrail / wall cross-section at sample i (rows run so that the faces look at the road)
      const bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.12), h = k === 1 ? 1.05 : 1.15;
      const o2 = side * (bar + (k === 0 ? 0.42 : 0.45));   // the top: the rail's back (a W-beam is ~0.3 m deep) / the wall's thickness, seen from the high cameras
      let p = k === 0 ? [Pt(i, o, 0.32), Pt(i, o, 0.6), Pt(i, o, 0.66), Pt(i, o, 0.95), Pt(i, o2, 0.95)] : [Pt(i, o, -0.4), Pt(i, o, 0.1), Pt(i, o, h - 0.1), Pt(i, o, h), Pt(i, o2, h)];
      let c = k === 0 ? [steel, steelD, steel, [0.9, 0.91, 0.93], [0.72, 0.74, 0.77]] : [concD, conc, conc, [0.84, 0.84, 0.82], [0.8, 0.8, 0.78]];
      if (side < 0) { p = p.reverse(); c = c.slice().reverse(); }
      return gr.row(p, c);
    };
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB();
      for (const side of [-1, 1]) {
        let prev = -1, pk = -1;
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
          const i = ii % N, k = kind(i);
          if (prev >= 0 && k !== pk) { gr.link(prev, railRow(gr, i, side, pk), 0, 4); prev = -1; }   // the old kind of barrier runs up to here, the new one starts here
          const r = railRow(gr, i, side, k); if (prev >= 0) gr.link(prev, r, 0, 4); prev = r; pk = k;
          if (k === 0 && ii % 2 === 0 && ii < c0 + CH) { const p = Pt(i, side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.24), 0); posts.add(p[0], p[1] - 0.35, p[2], T.hd[i], 1, 1.25); }
        }
      }
      addM(gr, rMat, true);
    }
    const nPosts = posts.addTo(root, true);
    nringProps(out, t13, onBridge, inKar);   // knockable tyre walls and roadside posts

    /* ---- the banked bowls (Karussell, Kleines Karussell): the inner half of the road in concrete slabs, laid on the road's own quads (the same
       columns and rows, so it cannot cut through), a dirty gutter at the inner edge ---- */
    if (T.bank) {
      const cTex = nrConcTex(); cTex.anisotropy = tex.asphalt.anisotropy || 4; out.ownTex.push(cTex);
      const qMat = new THREE.MeshLambertMaterial({ map: cTex, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
      let gb = null, pb = -1;
      for (let ii = 0; ii <= N; ii++) {   // (one mesh per bowl: culled apart)
        const i = ii % N; if (!bowl(i)) { if (gb) addM(gb, qMat); gb = null; pb = -1; continue; }
        const os = (T.bankSide[i] < 0 ? [0, 1, 2, 3] : [3, 4, 5, 6]).map(k => offs[k]), gu = (o) => { const k = 0.7 + 0.3 * sstep(0.1, 1.6, w - o * T.bankSide[i]); return [k, k, k * 0.98]; };
        if (!gb) gb = new RB(true);
        const r = gb.row(os.map(o => Pt(i, o, 0.024)), os.map(gu), os.map(o => [o / 6, ii * ds / 6]));
        if (pb >= 0) gb.link(pb, r, 0, 3); pb = r;
      }
      if (gb) addM(gb, qMat);
    }

    let nDecals = 0;
    /* ---- on the asphalt: the fans' graffiti and flags (dense at the famous places and along Döttinger Höhe), tar snakes, repair patches, tyre marks
       into the slower corners. One atlas; strips that follow the road 5 cm up, per road chunk, drawn after the road without writing depth ---- */
    {
      const dTex = nrDecalTex(); dTex.anisotropy = tex.asphalt.anisotropy || 4; out.ownTex.push(dTex);
      const dMat = new THREE.MeshLambertMaterial({ map: dTex, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
      const RD = rng(7731), used = new Uint8Array(N), dcs = [];   // (their own random stream: R() is not drawn from)
      const HOT = ['Brünnchen', 'Pflanzgarten', 'Karussell', 'Hohe Acht', 'Wippermann', 'Adenauer Forst', 'Breidscheid', 'Flugplatz', 'Hatzenbach', 'Schwalbenschwanz', 'Eschbach'];
      const hotD = T.names.filter(q => HOT.includes(q.n)).map(q => q.d);
      const hot = (d) => { for (const h of hotD) { const e = Math.abs(d - h); if (Math.min(e, T.len - e) < 170) return 1; } return d > 17900 && d < 19600 ? 0.8 : 0; };
      // a decal: [first sample, samples, lateral centre, half width, cell, alpha, layer, follows the racing line]; paint never overlaps paint
      const put = (i0, n, c, hw, cell, a, lay, fol) => { for (let k = 0; k <= n; k++) { const i = (i0 + k) % N; if (bowl(i) || t13(i) || (lay === 3 && used[i])) return; }
        if (lay === 3) for (let k = -2; k <= n + 2; k++) used[(i0 + k + N) % N] = 1; dcs.push([i0, n, c, hw, cell, a, lay, fol]); };
      for (let d = 260; d < T.len - 260; d += 26) {
        const i = T.idx(sAt(d)), hv = hot(d);
        if (RD() < 0.05 + 0.4 * hv) { const t = RD();
          if (t < 0.7) { const hw = 3.2 + RD() * 1.1; put(i, Math.max(2, Math.round(hw / ds)), (RD() - 0.5) * 1.6, hw, Math.floor(RD() * 16), 0.62 + RD() * 0.33, 3); }   // words (the cell's 2:1)
          else put(i, 1, (RD() - 0.5) * 4, 1.8 + RD() * 0.4, t < 0.85 ? 16 + Math.floor(RD() * 4) : 20 + Math.floor(RD() * 4), 0.7 + RD() * 0.25, 3); }   // signs, flags
        if (RD() < 0.11) put(i, 5 + Math.floor(RD() * 4), (RD() - 0.5) * 6, 1.2 + RD() * 0.6, 24 + Math.floor(RD() * 2), 0.9, 1);   // tar snakes
        if (RD() < 0.07) { const hw = 1.5 + RD() * 1.2; put(i, 2 + Math.floor(RD() * 6), (RD() < 0.5 ? -1 : 1) * (w - 0.8 - hw) * RD(), hw, 28 + Math.floor(RD() * 4), 1, 0); }   // repair patches
      }
      for (const c of T.corners) if (c.sev >= 2) for (let n = RD() < 0.6 ? 2 : 1; n > 0; n--) put((c.i0 - 8 - Math.floor(RD() * 22) + N) % N, 10 + Math.floor(RD() * 5), (RD() - 0.5) * 1.2, 1.25, 26 + (RD() < 0.35 ? 1 : 0), 0.55 + RD() * 0.3, 2, true);   // tyre marks into the corner
      dcs.sort((a, b) => a[6] - b[6]);   // (patches under tar under tyre marks under paint)
      const rbs = new Map();
      for (const [i0, n, c, hw, cell, a, , fol] of dcs) {
        const key = Math.floor(i0 / CH); let rb = rbs.get(key); if (!rb) rbs.set(key, rb = new RB(true, true));
        const cu = cell % 4, cv = Math.floor(cell / 4), u0 = cu / 4 + 1 / 512, u1 = (cu + 1) / 4 - 1 / 512, vt = 1 - cv / 8 - 1 / 1024, vb = 1 - (cv + 1) / 8 + 1 / 1024, col = [1, 1, 1, a];
        let pr = -1;
        for (let k = 0; k <= n; k++) {
          const i = (i0 + k) % N, cc = clamp((fol ? T.rl[i] : 0) + c, -(w - 0.7 - hw), w - 0.7 - hw), v = vb + (vt - vb) * k / n;
          const r = rb.row([Pt(i, cc - hw, 0.05), Pt(i, cc + hw, 0.05)], [col, col], [[u0, v], [u1, v]]);
          if (pr >= 0) rb.link(pr, r, 0, 1); pr = r;
        }
      }
      for (const rb of rbs.values()) { const m = addM(rb, dMat); if (m) m.renderOrder = 0.45; }   // (ROAD DECAL ORDER: under the road's wear)
      nDecals = dcs.length;
    }

    /* ---- scenery (vertex coloured, 128 m chunks) ---- */
    const scen = new Chunks(128), ban = new GB(true), crowdG = new GB(true), fenceC = new Chunks(256, true);   // (the catch fences in 256 m chunks: culled)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.9, 0.2, 0.15], [0.96, 0.82, 0.2], [0.2, 0.45, 0.9], [0.95, 0.95, 0.95], [0.2, 0.7, 0.3], [1, 0.55, 0.1], [0.15, 0.5, 0.55], [0.7, 0.2, 0.5], [0.12, 0.14, 0.2]];
    const CR = crowdCtx({ gH: nrGround, near: (x, z) => nrNear(x, z).dd, maxSlope: 0.8 });   // spectators (instanced)
    const carPk = (x, z, rot, col) => { const g = scen.get(x, z), y = nrGround(x, z), c = Math.cos(rot), s = Math.sin(rot);
      box(g, x, y + 0.25, z, 4.3, 0.8, 1.85, rot, col, null, true); box(g, x - c * 0.35, y + 1.05, z - s * 0.35, 2.3, 0.62, 1.62, rot, [0.16, 0.2, 0.26], col, true);
      for (const [a, b] of [[1.35, 0.8], [1.35, -0.8], [-1.35, 0.8], [-1.35, -0.8]]) box(g, x + c * a - s * b, y, z + s * a + c * b, 0.66, 0.66, 0.24, rot, [0.08, 0.08, 0.09], null, true); };
    const DR = rng(9330);   // (the camp props' own random stream: R() is not drawn from)
    const FLAGS = [[[0.08, 0.08, 0.09], [0.82, 0.1, 0.1], [0.96, 0.78, 0.06]], [[0.76, 0.1, 0.14], [0.95, 0.95, 0.95], [0.12, 0.3, 0.62]], [[0.82, 0.1, 0.12], [0.95, 0.95, 0.95], [0.82, 0.1, 0.12]], [[0.08, 0.08, 0.09], [0.97, 0.82, 0.06], [0.84, 0.12, 0.14]]];   // stripes: German, Dutch, Austrian, Belgian (upright)
    const flagPole = (g, x, y, z, rot, k) => { const c = Math.cos(rot), s = Math.sin(rot), F = FLAGS[k % FLAGS.length]; cyl(g, x, y - 0.2, z, 0.05, 6.4, 5, [0.86, 0.86, 0.88]);
      for (let n = 0; n < 3; n++) { if (k % FLAGS.length === 3) { const a = 0.3 + n * 0.5; box(g, x + c * a, y + 5.2, z + s * a, 0.5, 0.95, 0.04, rot, F[n], null, true); } else box(g, x + c * 0.8, y + 5.84 - n * 0.32, z + s * 0.8, 1.5, 0.32, 0.04, rot, F[n], null, true); } };
    const tent = (x, z, rot, col) => {   // the fans' camp, by hash: a dome tent, a ridge tent, a gazebo or a caravan; now and then a flag on a pole beside it
      const g = scen.get(x, z), y = nrGround(x, z), h = crH(x, z, 31), c = Math.cos(rot), s = Math.sin(rot), dk = [col[0] * 0.72, col[1] * 0.72, col[2] * 0.72], dark = [0.16, 0.2, 0.26];
      if (h < 0.34) nrLump(g, x, y + 0.05, z, 1.5, 0.78, col, DR, 0.05);
      else if (h < 0.56) gable(g, x, y, z, 3.4, 2.4, 1.35, rot, col, dk);
      else if (h < 0.78) { for (const [a, b] of [[1.45, 1.45], [1.45, -1.45], [-1.45, 1.45], [-1.45, -1.45]]) cyl(g, x + c * a - s * b, y - 0.1, z + s * a + c * b, 0.04, 2.25, 4, [0.86, 0.86, 0.88]);
        cone(g, x, y + 2.1, z, 2.2, 0.8, 4, col, [0.97, 0.97, 0.95], rot + Math.PI / 4); }
      else { box(g, x, y + 0.3, z, 5.4, 2.1, 2.2, rot, [0.93, 0.92, 0.88], [0.84, 0.84, 0.82], true); box(g, x, y + 1.05, z, 5.44, 0.22, 2.24, rot, col, null, true);
        for (const [a, L] of [[1.2, 1.3], [-1.4, 0.9]]) box(g, x + c * a, y + 1.55, z + s * a, L, 0.5, 2.26, rot, dark, null, true);
        for (const a of [-1.0, 0.6]) box(g, x + c * a, y, z + s * a, 0.6, 0.6, 2.3, rot, [0.08, 0.08, 0.09], null, true); }
      if (crH(x, z, 32) < 0.3) { const fx = x + c * 2.6 - s * 1.6, fz = z + s * 2.6 + c * 1.6; flagPole(g, fx, nrGround(fx, fz), fz, rot + 1.2, Math.floor(crH(x, z, 33) * 4)); }
    };
    const board = (cx, cy, cz, tx, tz, W, H, cellK) => {   // text board (bottom centre cx, cy, cz) facing -t (read by cars driving along +t), a dark back behind it
      const [u0, v0, u1, v1] = nrAUV(cellK), ux = tz, uz = -tx, hw = -W / 2, W1 = [1, 1, 1];   // (the text's left edge on the driver's left)
      const A = [cx - ux * hw, cy, cz - uz * hw], B = [cx + ux * hw, cy, cz + uz * hw], C = [B[0], cy + H, B[2]], D = [A[0], cy + H, A[2]];
      ban.quadO(A, B, C, D, W1, [cx + tx, cy + H / 2, cz + tz], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
      box(scen.get(cx, cz), cx + tx * 0.06, cy - 0.02, cz + tz * 0.06, 0.08, H + 0.04, W + 0.04, Math.atan2(tz, tx), [0.3, 0.31, 0.33], null, true);
    };
    const signPost = (s, side, extra, cellK, W, H, y0) => {   // a board on two posts beside the track, facing the traffic
      const [x, z, i] = onSide(s, side, extra), y = nrGround(x, z), g = scen.get(x, z), nx = T.nx[i], nz = T.nz[i];
      for (const o of [-W / 2 + 0.2, W / 2 - 0.2]) box(g, x + nx * o + T.tx[i] * 0.16, y - 0.3, z + nz * o + T.tz[i] * 0.16, 0.1, y0 + H + 0.3, 0.1, T.hd[i], [0.55, 0.56, 0.58]);
      board(x, y + y0, z, T.tx[i], T.tz[i], W, H, cellK); exclPush(x, z, 3);
    };
    const roomSide = (s) => { let l = 0, r = 0; for (let d = -30; d <= 30; d += 6) { const i = T.idx(s + d); l += T.bl[i]; r += T.br[i]; } return r > l ? 1 : -1; };
    const nm = T.names.map(q => q.n);
    const atlas = nrAtlas(nm), BAN = 20 + nm.length;

    /* ---- START / FINISH at T13: gantry with the start lights, concrete walls and catch fences, flags, the T13 grandstand ---- */
    {
      const [x, z, h, i] = atS(sStart, 0), gy = T.hy[i], g = scen.get(x, z), span = Math.max(T.bl[i], T.br[i]) + 1.2, nx = T.nx[i], nz = T.nz[i], gray = [0.2, 0.22, 0.26];
      for (const sd of [-1, 1]) box(g, x + nx * span * sd, gy - 0.3, z + nz * span * sd, 0.8, 7.9, 0.8, h, gray);
      box(g, x, gy + 6.4, z, 1.1, 1.3, span * 2 + 0.8, h, [0.14, 0.15, 0.18], [0.24, 0.25, 0.3]);
      box(g, x, gy + 5.2, z, 0.5, 1.4, 5.2, h, [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, gy + 7.95, z + nz * o); m.rotation.y = -h; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      board(x - T.tx[i] * 0.6, gy + 6.45, z - T.tz[i] * 0.6, T.tx[i], T.tz[i], span * 2 - 2, 1.2, BAN);
      exclPush(x, z, span + 6);
      for (let d = -220; d < 160; d += 14) for (const side of [-1, 1]) {   // flag poles behind the walls
        const [px, pz, ii] = onSide(sAt(d), side, 2.2), py = nrGround(px, pz), gg = scen.get(px, pz); CR.avoid(px, pz, 0.45);
        cyl(gg, px, py, pz, 0.06, 6, 5, [0.86, 0.86, 0.88]); box(gg, px + T.tx[ii] * 0.6, py + 4.8, pz + T.tz[ii] * 0.6, 1.2, 0.8, 0.05, T.hd[ii], fans[Math.floor(R() * fans.length)], null, true);
      }
      for (let d = -210, n = 0; d < 150; d += 30, n++) for (const side of [-1, 1]) {   // banners on the walls of the straight: NÜRBURGRING, GRÜNE HÖLLE, NORDSCHLEIFE
        const s0 = sAt(d), a0 = T.idx(s0), b0 = T.idx(s0 + 3.6), [u0, v0, u1, v1] = nrAUV(BAN + 1 + (n + (side > 0 ? 1 : 0)) % 3);
        const Wp = (ii, yy) => { const o = side * ((side > 0 ? T.br[ii] : T.bl[ii]) + 0.1); return [T.px[ii] + T.nx[ii] * o, T.hy[ii] + yy + nrBankY(ii, o), T.pz[ii] + T.nz[ii] * o]; };
        const A = Wp(a0, 0.1), ins = [A[0] + T.nx[a0] * side * 2, A[1], A[2] + T.nz[a0] * side * 2];
        ban.quadO(A, Wp(b0, 0.1), Wp(b0, 0.98), Wp(a0, 0.98), [1, 1, 1], ins, side > 0 ? [[u1, v0], [u0, v0], [u0, v1], [u1, v1]] : [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
      }
    }
    for (let i = 0; i < N; i++) if (t13(i)) { fence[0][i] = 1; fence[1][i] = 1; }

    /* ---- buildings (OpenStreetMap footprints near the track) and the T13 grandstand ---- */
    let nBld = 0; const crB0 = excl.length;
    for (const [bx, bz, L, W, ang, H, k] of def.bld || []) {
      const ca = Math.cos(ang), sa = Math.sin(ang), corners = [[L / 2, W / 2], [L / 2, -W / 2], [-L / 2, W / 2], [-L / 2, -W / 2]].map(([a, b]) => [bx + ca * a - sa * b, bz + sa * a + ca * b]);
      let clash = false, y0 = 1e9; for (const [cx, cz] of corners.concat([[bx, bz]])) { const n = nrNear(cx, cz); if (n.i >= 0 && n.dd < 1.5) clash = true; y0 = Math.min(y0, nrGround(cx, cz)); }
      if (clash) continue;
      const g = scen.get(bx, bz); nBld++; CR.block(bx, bz, L, W, ang);   // (nobody stands inside it)
      if (k === 2) {   // grandstand: tiers climbing away from the track, a crowd on every tier, roof on pillars
        const n = nrNear(bx, bz), i = n.i, tx0 = T.px[i] - bx, tz0 = T.pz[i] - bz, fa = (tx0 * -sa + tz0 * ca) > 0 ? 1 : -1;   // +1: the front faces the local +b axis
        const tiers = 9, dep = W / tiers;
        for (let t = 0; t < tiers; t++) { const b = fa * (W / 2 - (t + 0.5) * dep), cx = bx - sa * b, cz = bz + ca * b, hgt = 0.9 + t * 0.85;
          box(g, cx, y0, cz, L, hgt, dep, ang, [0.62, 0.63, 0.66], [0.52, 0.53, 0.57]);
          const b0 = b - fa * dep * 0.45, b1 = b + fa * dep * 0.1, yy = y0 + hgt + 0.02, A = [bx - ca * L / 2 - sa * b0, yy, bz - sa * L / 2 + ca * b0], B = [bx + ca * L / 2 - sa * b0, yy, bz + sa * L / 2 + ca * b0], C = [bx + ca * L / 2 - sa * b1, yy, bz + sa * L / 2 + ca * b1], D = [bx - ca * L / 2 - sa * b1, yy, bz - sa * L / 2 + ca * b1];
          crowdG.quadUp(A, B, C, D, [[1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]], [[0, t * 0.11], [L / 12, t * 0.11], [L / 12, t * 0.11 + 0.1], [0, t * 0.11 + 0.1]]); }
        const bb = -fa * (W / 2 + 0.3); box(g, bx - sa * bb, y0, bz + ca * bb, L, 9.6, 0.6, ang, [0.55, 0.56, 0.6]);
        for (let a = -L / 2; a <= L / 2 + 0.1; a += L / 8) { const px = bx + ca * a - sa * bb * 0.96, pz = bz + sa * a + ca * bb * 0.96; box(g, px, y0, pz, 0.45, 12.2, 0.45, ang, [0.86, 0.87, 0.9]); }
        const rb = -fa * (W / 2 - W * 0.3); for (let a = -L / 2, st = 0; a < L / 2 - 0.1; a += L / 12, st++) { const px = bx + ca * (a + L / 24) - sa * rb, pz = bz + sa * (a + L / 24) + ca * rb; box(g, px, y0 + 12.2, pz, L / 12 + 0.02, 0.4, W * 0.62, ang, [0.8, 0.82, 0.86], st % 2 ? [0.94, 0.95, 0.96] : [0.14, 0.4, 0.2]); }
        exclPush(bx, bz, Math.max(L, W) / 2 + 8);
      } else if (k === 1) {   // industrial hall: metal walls, flat roof
        const hh = H || 8 + R() * 3, wc = vary([0.62, 0.66, 0.7], R, 0.12);
        box(g, bx, y0 - 0.4, bz, L, hh + 0.4, W, ang, wc, [0.5, 0.52, 0.55]);
        exclPush(bx, bz, Math.max(L, W) / 2 + 4);
      } else {   // house: rendered walls, a pitched roof along the long side
        const hh = H || 5.6 + R() * 2.2, walls = [[0.93, 0.9, 0.84], [0.96, 0.95, 0.92], [0.86, 0.82, 0.74], [0.9, 0.86, 0.8]], roofs = [[0.32, 0.3, 0.32], [0.46, 0.22, 0.16], [0.24, 0.24, 0.27]];
        box(g, bx, y0 - 0.4, bz, L, hh + 0.4, W, ang, vary(walls[Math.floor(R() * walls.length)], R, 0.06), null, true);
        if (L * W < 1500) gable(g, bx, y0 + hh, bz, L + 0.6, W + 0.6, Math.min(4.2, W * 0.42), ang, roofs[Math.floor(R() * roofs.length)], [0.8, 0.78, 0.74]);
        else box(g, bx, y0 + hh, bz, L, 0.5, W, ang, [0.5, 0.5, 0.52]);
        exclPush(bx, bz, Math.max(L, W) / 2 + 3);
      }
    }

    const crB1 = excl.length;
    /* ---- bridges: the track on bridges over the roads (concrete parapets above), and two bridges over the track ---- */
    for (const [x, z] of def.brU || []) {
      const i = T.nearestIdx(x, z), hd = T.hd[i], cx = T.px[i], cz = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L = T.bl[i] + T.br[i] + 14, off = (T.br[i] - T.bl[i]) / 2, g = scen.get(cx, cz);
      const mx = cx + nx * off, mz = cz + nz * off;
      box(g, mx, y + 6.6, mz, 6.5, 1.1, L, hd, [0.64, 0.64, 0.62], [0.52, 0.5, 0.46]);   // deck (a forest road over the track)
      for (const f of [-1, 1]) box(g, mx + T.tx[i] * 3.1 * f, y + 7.7, mz + T.tz[i] * 3.1 * f, 0.25, 1.0, L, hd, [0.7, 0.7, 0.68]);   // parapets
      for (const sd of [-1, 1]) { const o = sd > 0 ? T.br[i] + 3 : -(T.bl[i] + 3), px = cx + nx * o, pz = cz + nz * o, gy = Math.min(nrGround(px, pz), y);   // abutments
        box(g, px, gy - 1, pz, 7, y + 6.6 - gy + 1, 4.5, hd, [0.6, 0.6, 0.58], [0.5, 0.5, 0.48]); }
      board(mx - T.tx[i] * 3.3, y + 6.62, mz - T.tz[i] * 3.3, T.tx[i], T.tz[i], Math.min(16, L - 4), 1.05, BAN + 1);
      exclPush(mx, mz, L / 2 + 6);
    }
    for (const b of P.br) {   // the track on a bridge over a road: the deck under the road and its verges, the abutments, and the road down in its cutting (nrH)
      const i = b.i, hd = T.hd[i], Wd = T.bl[i] + T.br[i] + 7, off = (T.br[i] - T.bl[i]) / 2, cx = b.x + b.nx * off, cz = b.z + b.nz * off, g = scen.get(cx, cz);
      let y = 1e9; for (let k = -4; k <= 4; k++) y = Math.min(y, T.hy[(i + k + N) % N]);   // (the deck stays under the road on a gradient: its top at the lowest point of the span)
      box(g, cx, y - 1.8, cz, 13, 1.3, Wd, hd, [0.6, 0.6, 0.58], [0.56, 0.56, 0.54]);   // (0.5 m under the road: also under the verges' outer slope)
      for (const f of [-1, 1]) box(g, cx + b.tx * 7.3 * f, b.y - 0.6, cz + b.tz * 7.3 * f, 2.6, y - 1.8 - b.y + 0.6, Wd, hd, [0.55, 0.55, 0.53], null, true);
      const rb = new RB(true), e = [0.95, 0.95, 0.92], m = [0.74, 0.74, 0.76]; let pr = -1;
      for (let l = -95; l <= 95.01; l += 4) {   // (rows across the road, from +t to -t: up-facing as the rows advance along +n)
        const pts = [3.6, 3.2, -3.2, -3.6].map(a => { const px = b.x + b.nx * l + b.tx * a, pz = b.z + b.nz * l + b.tz * a; return [px, nrGround(px, pz) + 0.1, pz]; });
        const r = rb.row(pts, [e, m, m, e], [3.6, 3.2, -3.2, -3.6].map(a => [(a + 3.6) / 8, l / 8])); if (pr >= 0) rb.link(pr, r, 0, 3); pr = r;
        if (Math.round(l) % 12 === 1) exclPush(b.x + b.nx * l, b.z + b.nz * l, 8);
      }
      addM(rb, aMat);
    }

    /* ---- marshal posts, km boards, corner-name boards, braking boards, chevrons ---- */
    const numTex = nrNumTex(); out.ownTex.push(numTex); const numC = new Chunks(512, true);
    for (let d = 260, k = 0, np = 0; d < T.len - 250; d += 250, k++) {   // marshal post: a white hut with a pitched roof, its number, two amber warning lights and a flag pole
      const s = sAt(d), side = k % 2 ? roomSide(s) : -roomSide(s), [x, z, i] = onSide(s, side, 2.4), y = nrGround(x, z), g = scen.get(x, z), hd = T.hd[i], tx = T.tx[i], tz = T.tz[i], nx = T.nx[i] * side, nz = T.nz[i] * side;
      if (excluded(x, z)) continue;
      box(g, x, y - 0.2, z, 2.4, 2.5, 2.2, hd, [0.94, 0.94, 0.92], null, true); gable(g, x, y + 2.3, z, 2.8, 2.6, 0.72, hd, [0.3, 0.32, 0.36], [0.92, 0.92, 0.9]);
      box(g, x - nx * 0.4, y + 1.0, z - nz * 0.4, 1.6, 0.6, 2.25, hd, [0.2, 0.28, 0.36], null, true);   // window
      box(g, x - tx * side * 0.78 - nx * 1.13, y + 1.84, z - tz * side * 0.78 - nz * 1.13, 0.5, 0.24, 0.06, hd, [0.1, 0.1, 0.11], null, true);   // the light panel (beside the number)
      for (const a of [-0.12, 0.12]) box(g, x - tx * side * (0.78 + a) - nx * 1.16, y + 1.9, z - tz * side * (0.78 + a) - nz * 1.16, 0.12, 0.12, 0.04, hd, [1, 0.74, 0.12], null, true);
      const [u0, v0, u1, v1] = nrNUV(np++ % 128), lx = tx * side * 0.26, lz = tz * side * 0.26, px = x - nx * 1.13, pz = z - nz * 1.13;   // the number above the window, facing the road
      numC.get(px, pz).quadO([px + lx, y + 1.72, pz + lz], [px - lx, y + 1.72, pz - lz], [px - lx, y + 2.24, pz - lz], [px + lx, y + 2.24, pz + lz], [1, 1, 1], [x, y + 1.9, z], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
      const fx = x + tx * 1.8, fz = z + tz * 1.8; cyl(g, fx, y, fz, 0.05, 4.2, 5, [0.85, 0.85, 0.87]); box(g, fx + tx * 0.45, y + 3.4, fz + tz * 0.45, 0.9, 0.6, 0.04, hd, [0.98, 0.84, 0.1], null, true);
      exclPush(x, z, 5);
    }
    numC.addTo(root, new THREE.MeshLambertMaterial({ map: numTex }), false, true);
    for (let km = 1; km <= 20; km++) { const s = sAt(km * 1000); signPost(s, roomSide(s), 1.4, km - 1, 1.9, 0.48, 1.1); }
    T.names.forEach((q, k) => { const s = sAt(q.d - 55); signPost(s, roomSide(s), 1.6, 20 + k, 3.2, 0.8, 1.2); });
    let lastC = -1e9;
    for (const c of T.corners) {   // braking boards 300, 200, 100 m before the bends at the end of a fast approach (not right after another bend); chevrons round the outside of the tightest ones
      const d0 = dS(c.i0 * ds), prev = lastC; if (c.sev >= 2) lastC = d0; if (c.sev < 2 || d0 < 400 || d0 > T.len - 250) continue;
      let str = 0; for (let k = 20; k <= 160; k += 4) if (Math.abs(T.k[(c.i0 - k + N) % N]) < 1 / 260) str++;
      if (str >= 21 && d0 - prev > 160) { const side = roomSide(sAt(d0 - 200)); [300, 200, 100].forEach((m, n) => signPost(sAt(d0 - m), side, 1.2, BAN + 4 + n, 1.5, 0.42, 0.75)); }
      if (c.minR < 38 && c.i1 > c.i0) for (let s = c.i0 * ds + 6; s < c.i1 * ds; s += 11) signPost(s, c.dir > 0 ? -1 : 1, 0.9, BAN + (c.dir > 0 ? 7 : 8), 1.9, 0.48, 0.35);
    }

    /* ---- spectators, fans' tents and cars at the famous places, catch fences in front of them ---- */
    const FANS = { 'Brünnchen': 3, 'Pflanzgarten': 3, 'Karussell': 3, 'Wippermann': 2, 'Hohe Acht': 2, 'Adenauer Forst': 2, 'Breidscheid': 2, 'Flugplatz': 2, 'Hatzenbach': 2, 'Schwalbenschwanz': 2, 'Kesselchen': 1, 'Galgenkopf': 1, 'Eschbach': 1, 'Metzgesfeld': 1, 'Ex-Mühle': 1, 'Bergwerk': 1, 'Fuchsröhre': 1, 'Aremberg': 1, 'Klostertal': 1, 'Quiddelbacher Höhe': 1, 'Döttinger Höhe': 1 };
    const tcols = [[0.85, 0.16, 0.14], [0.15, 0.36, 0.8], [0.95, 0.75, 0.12], [0.2, 0.62, 0.3], [0.92, 0.92, 0.9], [0.55, 0.3, 0.7]];
    let nFans = 0; const crE0 = excl.length;
    for (const q of T.names) {
      const wgt = FANS[q.n]; if (!wgt) continue;
      const sm = sAt(q.d), side = roomSide(sm), half = 18 + wgt * 12;
      for (let s = sm - half; s < sm + half; s += 1.15) for (let row = 0; row < wgt; row++) {
        if (R() > 0.72 - row * 0.12) continue;
        const ex = 2.4 + row * 1.2 + (R() - 0.5) * 0.4, [x, z] = onSide(s, side, ex); if (nrNear(x, z).dd < 1.2 || nrSlope(x, z) > 0.8) continue;
        const sc = fans[Math.floor(R() * fans.length)]; R();   // (two draws, as the old merged figure)
        crowdAt(CR, s, side, ex, x, z, { col: sc, sit: 0.25, flag: 0.08 }, row, (a, b) => nrNear(a, b).dd >= 1.2 && nrSlope(a, b) <= 0.8); nFans++;
      }
      for (let ii = T.idx(sm - half - 6), n = 0; n < (2 * half + 12) / ds; n++, ii = (ii + 1) % N) fence[side > 0 ? 1 : 0][ii] = 1;
      if (wgt >= 2) for (let k = 0; k < wgt * 5; k++) {   // camping in the woods behind the crowd (the 24 h race tradition)
        const s = sm + (R() - 0.5) * half * 2, [x, z, i] = onSide(s, side, 9 + R() * 22); if (nrSlope(x, z) > 0.45) continue;
        if (R() < 0.55) tent(x, z, T.hd[i] + (R() - 0.5) * 0.6, tcols[Math.floor(R() * tcols.length)]); else carPk(x, z, T.hd[i] + (R() - 0.5) * 0.8, vary(fans[Math.floor(R() * fans.length)], R, 0.2));
      }
      const [ex, ez] = onSide(sm, side, 14); exclPush(ex, ez, half + 10);
    }
    for (const q of T.names) {   // the fans' scaffold towers behind the camps (two at the big three, one at the other big places), a banner in their colours on top
      const wgt = FANS[q.n] || 0; if (wgt < 2) continue; const sm = sAt(q.d), side = roomSide(sm);
      for (const f of wgt >= 3 ? [-1, 1] : [1]) {
        const [x, z, i] = onSide(sm + f * (20 + crH(q.d, f, 41) * 16), side, 10 + crH(q.d, f, 42) * 7); if (nrSlope(x, z) > 0.35 || nrNear(x, z).dd < 4) continue;
        const g = scen.get(x, z), y = nrGround(x, z), hd = T.hd[i], c = Math.cos(hd), sn = Math.sin(hd), st = [0.6, 0.62, 0.66], nx = T.nx[i] * side, nz = T.nz[i] * side;
        for (const [a, b] of [[1.1, 1.1], [1.1, -1.1], [-1.1, 1.1], [-1.1, -1.1]]) box(g, x + c * a - sn * b, y - 0.2, z + sn * a + c * b, 0.09, 6.5, 0.09, hd, st, null, true);
        for (const lv of [2.9, 5.6]) box(g, x, y + lv, z, 2.4, 0.12, 2.4, hd, [0.52, 0.42, 0.3]);
        box(g, x - nx * 1.2, y + 5.72, z - nz * 1.2, 2.4, 0.7, 0.05, hd, fans[Math.floor(crH(q.d, f, 43) * fans.length)], null, true);
        CR.avoid(x, z, 2); exclPush(x, z, 3);
      }
    }
    /* ---- more spectators (instanced, hashed: no draws from R): the far side at the famous places, more rows at the big five, the places that had
       nobody, both sides of the T13 straight, groups along Döttinger Höhe and small groups everywhere; chain link in front of the bigger crowds ---- */
    {
      const fanE = new Set(excl.slice(crE0)), bldE = new Set(excl.slice(crB0, crB1));   // (the famous places' and the buildings' tree exclusions are large; the new crowds may stand inside them, the footprints are culled)
      const hard = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (const e of L) { if (fanE.has(e) || bldE.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 1.2, gap: 1.15, excluded: hard, below: 3, above: 8, sit: 0.3, flag: 0.07 };
      const run = (d0, d1, side, o, fc) => { const n = crowdRun(CR, sStart + d0, sStart + d1, side, Object.assign({}, M, o));
        if (n && fc) for (let ii = T.idx(sStart + d0 - 6), k = 0; k < (d1 - d0 + 12) / ds; k++, ii = (ii + 1) % N) fence[side > 0 ? 1 : 0][ii] = 1; return n; };
      const BIG = { 'Brünnchen': 1, 'Pflanzgarten': 1, 'Karussell': 1, 'Flugplatz': 1, 'Hatzenbach': 1 }, NEW = ['Hocheichen', 'Schwedenkreuz', 'Kallenhard', 'Wehrseifen', 'Eiskurve', 'Hitri S-zavoji', 'Kleines Karussell', 'Antoniusbuche', 'Tiergarten', 'Hohenrain'];
      for (const q of T.names) {
        const wgt = FANS[q.n] || 0, sm = sAt(q.d), side = roomSide(sm), d = q.d;
        if (wgt) { const half = 18 + wgt * 12;
          run(d - half, d + half, -side, { rows: Math.min(3, wgt + 1), dens: 0.62, label: 'NR far ' + q.n }, true);
          if (BIG[q.n]) run(d - half - 24, d + half + 24, side, { first: 2.4 + wgt * 1.2, rows: 2, dens: 0.55, label: 'NR more ' + q.n }); }
        else if (NEW.includes(q.n)) { run(d - 46, d + 40, side, { rows: 3, dens: 0.66, label: 'NR ' + q.n }, true); run(d - 36, d + 30, -side, { rows: 2, dens: 0.5, label: 'NR far ' + q.n }, true); }
      }
      for (const sd of [-1, 1]) run(-220, 160, sd, { rows: 3, gap: 1.0, dens: 0.6, sit: 0, label: 'NR T13' });
      for (const sd of [-1, 1]) run(17900, 19600, sd, { rows: 2, dens: 0.3, clump: 0.85, strip: false, label: 'NR Döttinger Höhe' });   // (no ground strips: under a sparse crowd they read as dark squares)
      for (const sd of [-1, 1]) run(200, T.len - 250, sd, { rows: 2, dens: 0.06, clump: 0.95, strip: false, label: 'NR groups' });
      for (const e of CR.circ) exclPush(e.x, e.z, e.r);   // the forest keeps clear of them
    }
    // Döttinger Höhe: a farm fence along the fields on both sides of the long straight (wooden posts, two rails)
    for (const side of [-1, 1]) { let pv = null;
      for (let d = 17930; d < 19560; d += 4) {
        const [x, z, i] = onSide(sAt(d), side, 10.5); if (nrLC(x, z) === 1 || excluded(x, z) || nrSlope(x, z) > 0.5) { pv = null; continue; }
        const y = nrGround(x, z), g = scen.get(x, z), wd = [0.44, 0.35, 0.25]; box(g, x, y - 0.15, z, 0.12, 1.35, 0.12, T.hd[i], wd, null, true);
        if (pv) { const dx = x - pv[0], dz = z - pv[2], L = Math.hypot(dx, dz), rt = Math.atan2(dz, dx), mx = (x + pv[0]) / 2, mz = (z + pv[2]) / 2, my = (y + pv[1]) / 2;
          for (const hh of [0.5, 0.98]) box(g, mx, my + hh, mz, L, 0.07, 0.05, rt, [0.5, 0.4, 0.29], null, true); }
        pv = [x, y, z]; exclPush(x, z, 1.2);
      }
    }
    // catch fences (chain link on posts) right behind the rails where the fences were asked for, sponsor banners on them
    const spC = new Chunks(256, true);
    for (const side of [-1, 1]) {
      const fc = fence[side > 0 ? 1 : 0], bar = side > 0 ? T.br : T.bl; let acc = 0;
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N, seg = ds; if (!fc[i] || !fc[j]) { acc += seg; continue; }
        const Q = (ii, y) => { const o = side * (bar[ii] + 0.55); return [T.px[ii] + T.nx[ii] * o, T.hy[ii] + y + nrBankY(ii, o), T.pz[ii] + T.nz[ii] * o]; };
        const u0 = acc / 2.5, u1 = (acc + seg) / 2.5, ins = Q(i, 1); ins[0] += T.nx[i] * side * 3; ins[2] += T.nz[i] * side * 3;
        const q0 = Q(i, 0.9); fenceC.get(q0[0], q0[2]).quadO(q0, Q(j, 0.9), Q(j, 3.6), Q(i, 3.6), [1, 1, 1], ins, [[u0, 0], [u1, 0], [u1, 1.1], [u0, 1.1]]);
        const j2 = (i + 2) % N;
        if (i % 13 === 0 && fc[j2]) {   // a sponsor banner on the chain link, 4 m long (tex.sponsors: 8 invented brands), read from the road
          const k = Math.floor(crH(i, side, 51) * 8), su = (k % 2) / 2, sv = 1 - Math.floor(k / 2) / 4, pull = (p, ii) => [p[0] - T.nx[ii] * side * 0.06, p[1], p[2] - T.nz[ii] * side * 0.06];
          const a = pull(Q(i, 0.95), i), b = pull(Q(j2, 0.95), j2);
          spC.get(a[0], a[2]).quadO(a, b, pull(Q(j2, 1.9), j2), pull(Q(i, 1.9), i), [1, 1, 1], ins, side > 0 ? [[su + 0.5, sv - 0.25], [su, sv - 0.25], [su, sv], [su + 0.5, sv]] : [[su, sv - 0.25], [su + 0.5, sv - 0.25], [su + 0.5, sv], [su, sv]]);
        }
        if (i % 3 === 0) { const p = Q(i, 0); box(scen.get(p[0], p[2]), p[0], p[1] - 0.2, p[2], 0.1, 3.8, 0.1, T.hd[i], [0.6, 0.61, 0.64]); }
        acc += seg;
      }
    }

    /* ---- the forest: spruce and beech where OpenStreetMap has woods, bushes on the scrub, lone trees on the meadows; young trees and scrub along the
       edges of the woods and in the strip between the track and the forest behind it (a closed 'green hell' corridor). Stands differ in colour: yellow-green
       larch, fresher or darker beech, grey dead spruce (bark beetle) alone and in patches. The ground under the crowns turns to forest floor (G.cov). ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    // the wind: the crowns sway a little, each tree in its own rhythm (the higher up, the more; the foot of the trunk stays put)
    const WIND = { value: 0 }; out.dyn.wind = WIND;
    tMat.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = WIND;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
        '#ifdef USE_INSTANCING\nfloat wPh = instanceMatrix[3].x * 0.07 + instanceMatrix[3].z * 0.05;\n#else\nfloat wPh = 0.0;\n#endif\n' +
        'float wK = position.y * position.y * 0.018;\ntransformed.x += wK * sin( uWind * 1.1 + wPh );\ntransformed.z += wK * 0.6 * sin( uWind * 0.83 + wPh * 1.7 );');
    };
    tMat.customProgramCacheKey = () => 'nrTreeWind';
    const tk = [new IChunks(nrTreeGeo(0), tMat, 128), new IChunks(nrTreeGeo(1), tMat, 128)];   // near the road: casting shadows (small chunks: the view and the shadow box cull them well)
    const tf = [new IChunks(nrTreeGeo(2), tMat, 192), new IChunks(nrTreeGeo(3), tMat, 192)];   // more than 70 m out: cheaper, no shadows (theirs would fall outside the view), bigger chunks (fewer draws at the top of the view)
    let nTrees = 0, nEdge = 0;
    {
      const L = NRC * NRT, maxT = Math.round(150000 * dens), CR0 = [0.3, 0.33, 0.45];   // (crown radius / width of a spruce, beech, bush: the forest floor under it)
      const tint = (sp, x, z, c) => {   // stand colours (hashed: no draws from R)
        if (sp === 0) { const h = crH(x, z, 3);
          if (P.n6(x, z) > 0.74 && h < 0.7) { c[0] *= 1.4; c[1] *= 1.24; c[2] *= 0.84; }   // larch
          else if (h < 0.02 || (P.n5(x * 1.7 + 900, z * 1.7) > 0.82 && h < 0.25)) { c[0] *= 2.6; c[1] *= 1.3; c[2] *= 1.85; return 0.45; } }   // dead spruce (bark beetle): thin silver-grey crowns
        else if (sp === 1) { const f = P.n6(x + 700, z); c[0] *= lerp(1.14, 0.9, f); c[1] *= lerp(1.1, 0.94, f); c[2] *= lerp(0.8, 1.02, f); }   // fresher or darker beech
        return 1; };
      const clear = (x, z, r) => !excluded(x + r, z) && !excluded(x - r, z) && !excluded(x, z + r) && !excluded(x, z - r);   // (low crowns keep off the spectators, not only their trunks)
      const plant = (sp, far, x, y, z, rot, wid, hgt, c) => { if (sp === 2 && !clear(x, z, wid * 0.4)) return false; const s = tint(sp, x, z, c), K = far ? tf : tk; if (s < 1) wid *= 0.62;   // (a dead spruce: a thin crown)
        if (sp < 2) K[sp].add(x, y, z, rot, wid, hgt, c);
        else { c[0] *= 1.25; c[1] *= 1.11; c[2] *= 1.15; if (far) K[1].add(x, y - 0.35 * hgt, z, rot, wid * 1.36, hgt * 1.16, c); else K[1].add(x, y - 0.49 * hgt, z, rot, wid * 1.32, hgt * 1.33, c); }   // bushes and young trees: a beech crown sunk into the ground (no draws of their own)
        nrShade(x, z, wid * CR0[sp], s * (sp === 2 ? 0.7 : 1)); nTrees++; return true; };
      for (let tj = 0; tj < G.ntz && nTrees < maxT; tj++) for (let ti = 0; ti < G.ntx && nTrees < maxT; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * L, za = G.z0 + tj * L;
        for (let zz = za; zz < za + L; zz += 6.2) for (let xx = xa; xx < xa + L; xx += 6.2) {
          const x = xx + (R() - 0.5) * 5.4, z = zz + (R() - 0.5) * 5.4, rd = nrDist(x, z), r1 = R(), r2 = R();
          if (rd > 250) continue;
          if (rd > LOD.radius(70) && ((Math.floor(xx / 6.2) + Math.floor(zz / 6.2)) & 1)) continue;   // farther out every other spot, bigger trees (a closed canopy from above)
          const cl = nrLC(x, z), far = rd > 70;
          const p = cl === 1 ? 0.92 : cl === 2 ? 0.45 : cl === 3 ? 0.035 : 0.018;
          if (r1 > p) {   // no tree by the land cover: the edge of the woods may still grow here
            if (far || cl === 1 || cl === 3) continue;
            const e = nrEdge(x, z); if (!e || crH(x, z, 5) >= e) continue;
            let dd = 99; if (rd < 48) { const nn = nrNear(x, z); if (nn.i >= 0) dd = nn.dd; } if (dd < 3.2 || (dd < 7 && crH(x, z, 6) < 0.35) || excluded(x, z)) continue;
            const h = crH(x, z, 7), hq = crH(x, z, 8), young = dd < 8 || h < 0.5, sp = young ? (h < 0.3 ? 2 : h < 0.42 ? 0 : 1) : P.n1(x * 2.2 + 500, z * 2.2) < 0.55 ? 0 : 1;
            const hgt = sp === 2 ? Math.min(2.4 + hq * 3.6, (dd - 0.6) * 1.8) : young ? 4.5 + hq * 4 : sp === 0 ? 9 + hq * 5 : 7.5 + hq * 4.5, cv = 0.86 + crH(x, z, 9) * 0.28;   // (a bush by the rails stays clear of them)
            if (sp !== 2 && !clear(x, z, hgt * 0.28)) continue;
            if (plant(sp, false, x, nrGround(x, z) - 0.1, z, crH(x, z, 10) * TAU, hgt * (sp === 2 ? 1.15 : sp === 1 ? 1.05 : 0.95), hgt, [cv, cv, cv * (0.95 + hq * 0.1)])) nEdge++;
            continue;
          }
          if (rd < 48) { const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 3.2) continue; if (nn.i >= 0 && nn.dd < 7 && r2 < 0.35) continue; }   // (farther out no tree can reach the barriers)
          if (excluded(x, z)) continue;
          const y = nrGround(x, z), sp = cl === 1 ? (P.n1(x * 2.2 + 500, z * 2.2) < 0.55 + (R() - 0.5) * 0.3 ? 0 : 1) : cl === 2 ? 2 : 1;
          const hgt = sp === 0 ? (10 + R() * 5.5) * (far ? 1.15 : 1) : sp === 1 ? (8.5 + R() * 4.5) * (far ? 1.2 : 1) : 1.6 + R() * 2.4, wid = hgt * (sp === 0 ? 1 : sp === 1 ? 0.95 + R() * 0.25 : 1.1);
          const cv = 0.86 + R() * 0.28; plant(sp, far, x, y - 0.1, z, R() * TAU, wid, hgt, [cv * (0.95 + R() * 0.1), cv, cv * (0.95 + R() * 0.1)]);
        }
      }
      for (const side of [-1, 1]) for (let d = 17930; d < 19560; d += 13) {   // Döttinger Höhe: a row of poplars and beech along the field edge, both sides
        const [x, z] = onSide(sAt(d + (crH(d, side, 61) - 0.5) * 6), side, 15 + crH(d, side, 62) * 5); if (nrLC(x, z) === 1 || excluded(x, z) || !clear(x, z, 2)) continue;
        const hq = crH(d, side, 63), pop = hq < 0.6, hgt = pop ? 15 + hq * 9 : 10 + hq * 4, cv = 0.9 + crH(d, side, 64) * 0.2;
        plant(1, false, x, nrGround(x, z) - 0.1, z, crH(d, side, 65) * TAU, hgt * (pop ? 0.42 : 0.9), hgt, [cv * (pop ? 0.92 : 1), cv * (pop ? 1.05 : 1), cv * 0.9]);
      }
    }
    for (const t of tk) t.addTo(root, true);
    for (const t of tf) t.addTo(root, false);

    /* ---- terrain tiles and the grass verges (256 m chunks), coloured now: the forest floor under the trees ---- */
    let nTiles = 0;
    {
      const grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let k = 0; k < tiles.length; k += 3) { const m = new THREE.Mesh(nrTileGeo(tiles[k], tiles[k + 1], tiles[k + 2] === 1 ? 1 : 4), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); nTiles++; }
      const vg = [0.96, 1.0, 0.9], dirt = [1.1, 0.84, 0.72];   // the mown verge; worn to earth along the road edge in patches
      for (let c0 = 0; c0 < N; c0 += CH) {
        const gv = new RB(true), pv = [-1, -1];
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
          const i = ii % N, wr = 0.2 + 0.6 * sstep(0.4, 0.85, P.n7(T.px[i], T.pz[i])), vw = [lerp(vg[0], dirt[0], wr), lerp(vg[1], dirt[1], wr), lerp(vg[2], dirt[2], wr)];
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, vr = vergeRow(i, side), pts = vr.map(([o, h]) => Pt(i, side * o, h)), cols = vr.map(([o], k) => { const p = pts[k]; if (k === 0) return vw; if (k < 3) return vg; const gc = nrGCol(p[0], p[2]); return k === 3 ? [lerp(vg[0], gc[0], 0.5), lerp(vg[1], gc[1], 0.5), lerp(vg[2], gc[2], 0.5)] : gc; });
            const ordered = side > 0 ? { p: pts, c: cols } : { p: pts.slice().reverse(), c: cols.slice().reverse() };   // rows run left -> right
            const rv = gv.row(ordered.p, ordered.c, ordered.p.map(p => [p[0] / 14, -p[2] / 14]));   // (the terrain tiles' grass scale: no seam)
            if (pv[si] >= 0) gv.link(pv[si], rv, 0, 4); pv[si] = rv;
          }
        }
        addM(gv, gMat);
      }
      G.col = G.cov = P.edge = null;   // (build only)
    }

    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: atlas })); if (bm) bm.castShadow = false;
    addM(crowdG, crowdUV(new THREE.MeshLambertMaterial({ map: tex.crowd, vertexColors: true }), 1, 0.11, 0.1));
    fenceC.addTo(root, fMat, false, true); spC.addTo(root, new THREE.MeshLambertMaterial({ map: tex.sponsors }), false, true);
    crowdFinish(CR, root, out);
    out.stats = { tiles: nTiles, trees: nTrees, edgeTrees: nEdge, posts: nPosts, buildings: nBld, fans: nFans, decals: nDecals };   // (read by the tests)
    return out;
  }

  World.ext.nring = (scene, tex, opts) => buildNring(scene, tex, opts);
})();
