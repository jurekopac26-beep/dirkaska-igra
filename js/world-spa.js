/* =========================================================================
   WORLD — Spa (theme 'spa'): its own builder (World.ext.spa), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, NRC, NRN, NRT, RB, TAU, atS, atSf, box, parkedCar, brookMat, clamp, cone, crH, crowdAt, crowdCtx, crowdFinish, crowdRun, crowdUV,
    cyl, gable, ico, lerp, nrAUV, nrDist, nrEdge, nrFir, nrGCol, nrGround, nrLC, nrLCf, nrLump, nrNUV, nrNear, nrNumTex, nrPN, nrPrep, nrShade,
    nrSlope, nrTileGeo, nrTileOn, nrTreeGeo, pitLaneScenery, pixAvg, propFloorTable, rng, roadsideProps, spaScreenTex, sstep, vary
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ================= SPA-FRANCORCHAMPS (theme 'spa') =================
     Its own builder on the Nordschleife's corridor terrain (nrPrep and the nr* helpers: the LiDAR bare earth of def.dem on a 16 m grid, the
     OpenStreetMap land cover def.lc), in the Ardennes' own look: fresh grazed pastures, spruce planted in straight rows on the steep valley
     sides (forestry compartments of mature, young and felled spruce and of beech; birches along the edges of the woods), a Formula 1
     circuit's run-offs (asphalt where the barriers stand far out, gravel in a few corners: def.runoffTarmac, def.gravelStrips), red and
     white kerbs, mown stripes on the verges, concrete walls, tyre walls and catch fences, slate-roofed houses, grandstands with coloured
     seats; the pits, the support pits behind their wall, the Eau Rouge brook, the TV towers, the big screens, the sponsors' boards and the
     marshals in orange. */
  function spaGrassTex(aniso) {   // the Ardennes pasture under the vertex colours (256 px = 14 m, tileable): a fresh, cool green grazed short, clover, daisies, a few buttercups
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data, r = rng(4501);
    const n1 = nrPN(8, 4502), n2 = nrPN(24, 4503), n3 = nrPN(64, 4504);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {   // (fine detail only: the vertex colours make the patches)
      const u = i / S, v = j / S, n = n1(u, v) * 0.3 + n2(u, v) * 0.4 + n3(u, v) * 0.3, k = 0.86 + n * 0.26 + (r() - 0.5) * 0.12, y = n2(u + 0.31, v + 0.57) - 0.5, o = (j * S + i) * 4;
      d[o] = clamp((64 + y * 10) * k, 0, 255); d[o + 1] = clamp((126 + y * 6) * k, 0, 255); d[o + 2] = clamp((62 + y * 4) * k, 0, 255); d[o + 3] = 255;
    }
    x.putImageData(img, 0, 0); const avg = pixAvg(d);
    x.lineWidth = 1;
    for (const [st, n] of [['rgba(38,74,34,0.45)', 800], ['rgba(138,178,112,0.35)', 480]]) {   // blades (drawn across the edges too: tileable)
      x.strokeStyle = st; x.beginPath();
      for (let k = 0; k < n; k++) { const px = r() * S, py = r() * S, dx = (r() - 0.5) * 2, dy = -(1.2 + r() * 2.4);
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const qx = px + a * S, qy = py + b * S; if (qx > -6 && qx < S + 6 && qy > -6 && qy < S + 6) { x.moveTo(qx, qy); x.lineTo(qx + dx, qy + dy); } } }
      x.stroke(); }
    for (const [st, n, sz] of [['rgba(46,92,42,0.55)', 90, 3], ['#f2f2ea', 70, 1], ['#e6d24a', 24, 1]]) { x.fillStyle = st; for (let k = 0; k < n; k++) x.fillRect(Math.floor(r() * (S - sz)), Math.floor(r() * (S - sz)), sz, sz); }   // clover, daisies, buttercups
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso || 4; t.grassPic = true; t.avgCol = avg; return t;
  }
  function spaTreeGeo(kind) {   // unit trees (height 1, instances scale them): 0 a plantation spruce (tall and narrow, four drooping tiers, dark blue-green), 1 the same far out (two tiers), 2 a birch (a white trunk, a small light crown)
    const g = new GB(), R = rng(640 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;   // (smooth normals, as nrTreeGeo; the flag restored below)
    const sp = [0.07, 0.17, 0.12], spT = [0.12, 0.26, 0.17], sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
    if (kind === 0) {
      cone(g, 0, -0.02, 0, 0.022, 0.22, 4, [0.26, 0.19, 0.14], null, 0);
      for (let t = 0; t < 4; t++) nrFir(g, 0, 0.14 + t * 0.2, 0, 0.19 * (1 - t * 0.2), 0.3, 5, sh(sp, 0.86 + t * 0.07), spT, t * 1.1, 0.04);
    } else if (kind === 1) {
      nrFir(g, 0, 0.1, 0, 0.18, 0.52, 5, sh(sp, 0.9), spT, 0.3, 0.03); nrFir(g, 0, 0.5, 0, 0.11, 0.5, 5, sp, spT, 1.1, 0.02);
    } else {
      cyl(g, 0, -0.02, 0, 0.022, 0.64, 4, [0.9, 0.9, 0.86], null, 0.016);
      const be = [0.36, 0.52, 0.2]; ico(g, 0, 0.68, 0, 0.19, 1.3, be, R, 0.3); nrLump(g, 0.06, 0.52, 0.04, 0.14, 1.1, sh(be, 1.08), R, 0.25);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  let spaATex = null;
  function spaAtlas(names) {   // text boards (4 x 16 cells of 256 x 64): the braking boards 300-100 m, DRS, the corner names, banners, the game's sponsors (boards on the rails)
    if (spaATex) spaATex.dispose();
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const cell = (k, bg, fg, txt, px, stripe) => { const cx = (k % 4) * 256, cy = Math.floor(k / 4) * 64; x.fillStyle = bg; x.fillRect(cx, cy, 256, 64); if (stripe) { x.fillStyle = stripe; x.fillRect(cx, cy + 56, 256, 8); x.fillRect(cx, cy, 256, 4); }
      x.fillStyle = fg; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, cx + 128, cy + 33, 240); };
    for (let k = 1; k <= 3; k++) cell(k - 1, '#f4f4f0', '#111', String(k * 100), 50, '#c8261f');
    cell(3, '#101114', '#fff', 'DRS', 44, '#39c84a');   // (where a DRS zone opens)
    names.forEach((n, k) => cell(20 + k, '#17306a', '#fff', n.toUpperCase(), n.length > 14 ? 26 : 32, '#e8e8e0'));
    const B = 20 + names.length;
    cell(B, '#16181c', '#fff', 'SPA-FRANCORCHAMPS', 28); cell(B + 1, '#c8261f', '#fff', 'EAU ROUGE', 38); cell(B + 2, '#f2c21a', '#111', 'BELGIQUE · BELGIË', 28); cell(B + 3, '#123f86', '#fff', 'DÉPART · ARRIVÉE', 28);
    const SP = (typeof Tex !== 'undefined' && Tex.SPONSORS) || [['HITROLET', '#101418', '#ffd23f']];
    for (let k = 0; k < 8; k++) { const [txt, bg, fg] = SP[k % SP.length]; cell(40 + k, bg, fg, txt, 40, 'rgba(255,255,255,.14)'); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (spaATex = t);
  }
  // the verge's cross-section beyond the road edge ([offset, height above the road]), lifted onto the ground where it rises: the verges, the
  // concrete strip before the support pits' wall and the knocked props' floor (spaProps) use the same rows
  function spaVerge(i, side) {
    const w = T.w, bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i], lift = (o, h) => { const q = side * o; return [o, Math.max(h, nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.06 - y)]; };
    return [[w, 0.0], [w + 1.2, -0.04], lift(Math.max(w + 1.8, bar - 0.4), -0.1), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)];
  }
  // knockable props: tyre stacks at the corner exits and apexes, 2.2-3 m past the edge (no roadside posts on a grand-prix circuit), not on
  // the pit straight. Drawn out to 150 m
  function spaProps(out, skip) {
    out.propR = 150;
    out.propFloor = propFloorTable(null, (i, side) => spaVerge(i, side));
    return out.propStats = roadsideProps(out.props, { exits: 12, apexes: 4, wallEdge: [2.2, 3.0], stacks: [5, 7], rows2: 0.3, floor: out.propFloor, skip });
  }

  function buildSpa(scene, tex, opts) {
    const R = rng(9120), N = T.N, w = T.w, ds = T.ds, dens = opts.density || 1, sStart = T.startS, def = T.def, L = T.len;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: nrGround, camFloor: nrGround, props: [], farClip: true, ownTex: [] };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    const dS = (s) => { let d = s - sStart; d = ((d % L) + L) % L; return d; };   // metres after the start line along the lap
    const sAt = (d) => ((sStart + d) % L + L) % L;
    const nameD = (n) => { const f = T.names.find(q => q.n === n); return f ? f.d : null; };
    const side2 = (side) => (side > 0 ? 1 : 0);
    nrPrep();
    const P = API.NR, G = P.G;
    // the ground right of the pit straight paved at the road's own height from the rail out behind the garages (the cars in the lane run at the
    // road's height; lane centre + 3.5 lane + 9 apron + 7.2 garages + 2.3), easing into the landscape beyond; the same behind the walls the track
    // sets itself (def.walls: the support pit lane and its garages, out to 30 m from the centre line). (nrH calls it right after its nrNear: NRN
    // holds the nearest sample, the lateral offset and the road's height there)
    { const PP = def.pit, WL = def.walls || [];
      P.pad = (x, z, h) => { const i = NRN.i; if (i < 0) return h;
        const lat = NRN.lat, hn = NRN.hn; let d = i * ds - sStart; d = ((d % L) + L) % L; if (d > L / 2) d -= L;
        if (PP && lat > 0 && d >= PP[1] - 12 && d <= PP[2] + 12) { const p = T.pitAt(i * ds), reach = (p ? p.o : w + 3.6) + 22;
          return lat < reach ? hn - 0.06 : lat < reach + 14 ? lerp(hn - 0.06, h, sstep(reach, reach + 14, lat)) : h; }
        for (const [a, b, sd] of WL) { if (lat * sd <= 0) continue;
          const f = Math.min(sstep(a - 30, a - 10, d), sstep(b + 50, b + 30, d)) * (1 - sstep(30, 44, lat * sd));
          if (f > 0) return lerp(h, hn - 0.06, f); }
        return h; }; }
    // the forestry compartments (the nearest point of a jittered 84 m grid): 0 mature spruce, 1 young spruce, 2 felled (bracken and heather, a few
    // birches and saplings), 3 beech; the spruce planted in rows, their direction and spacing the compartment's own (hashed: no draws from R)
    const CS = 84, CPS = new Map();
    const comp = (x, z) => {
      const ci = Math.floor(x / CS), cj = Math.floor(z / CS); let best = 1e18, bi = 0, bj = 0;
      for (let b = cj - 1; b <= cj + 1; b++) for (let a = ci - 1; a <= ci + 1; a++) { const px = (a + 0.15 + 0.7 * crH(a, b, 71)) * CS, pz = (b + 0.15 + 0.7 * crH(a, b, 72)) * CS, e = (x - px) * (x - px) + (z - pz) * (z - pz); if (e < best) { best = e; bi = a; bj = b; } }
      const id = bi * 65536 + bj; let c = CPS.get(id);
      if (!c) { const h = crH(bi, bj, 73), an = crH(bi, bj, 74) * Math.PI, kind = h < 0.6 ? 0 : h < 0.75 ? 1 : h < 0.83 ? 2 : 3;
        c = { id, kind, ca: Math.cos(an), sa: Math.sin(an), s: kind === 1 ? 3.2 : 4.3 + crH(bi, bj, 75) * 0.7, h: kind === 1 ? 4 + crH(bi, bj, 76) * 6 : 21 + crH(bi, bj, 76) * 9, tint: 0.86 + crH(bi, bj, 77) * 0.24 };
        CPS.set(id, c); }
      return c;
    };
    // the ground's colours (multiplying the pasture map): grazed meadows in fresher and darker patches, a few hay fields, the reddish brown needle
    // floor under the spruce (the trees' canopy, G.cov; beyond 250 m the land cover alone), dry bracken and heather on the felled compartments,
    // scrub, lawns and car parks by the village, earth and slate on the steep banks, mown grass right behind the barriers
    P.colFn = (x, z, ny, dd, cov, o) => {
      const m = P.n3(x, z), q = P.n4(x, z), fo = nrLCf(x, z, 1), sc = nrLCf(x, z, 2), se = nrLCf(x, z, 3);
      let r = 0.97 + (m - 0.5) * 0.14 + (q - 0.5) * 0.12, g = 1.0 + (m - 0.5) * 0.12 + (q - 0.5) * 0.08, b = 0.98 + (m - 0.5) * 0.1;
      const hay = sstep(0.62, 0.8, P.n5(x, z)) * 0.55; r += hay * 0.3; g += hay * 0.1; b -= hay * 0.08;   // a few hay meadows
      const lu = sstep(0.55, 0.8, P.n2(x, z)) * 0.6; r -= lu * 0.12; g -= lu * 0.04;   // lush, darker patches
      let fl = Math.max(clamp(cov, 0, 1), fo * lerp(0.35, 1, sstep(225, 250, nrDist(x, z)))), fr = 0.74 + m * 0.12, fg = 0.52 + m * 0.08, fb = 0.46;   // needles under the spruce
      if (fo > 0.5 && comp(x, z).kind === 2) { fl = Math.max(fl, fo * 0.85); fr = 1.22; fg = 0.8; fb = 0.6; }   // a felled compartment: dry bracken and heather
      r = lerp(r, fr, fl); g = lerp(g, fg, fl); b = lerp(b, fb, fl);
      r = lerp(r, 0.95, sc * 0.5); g = lerp(g, 0.9, sc * 0.5); b = lerp(b, 0.78, sc * 0.5);   // scrub
      r = lerp(r, 1.02, se * 0.6); g = lerp(g, 0.98, se * 0.6); b = lerp(b, 0.96, se * 0.6);   // lawns and car parks
      const st = sstep(0.86, 0.62, ny) * 0.85; r = lerp(r, 1.1, st); g = lerp(g, 0.8, st); b = lerp(b, 0.86, st);   // earth and slate on the steep banks
      if (dd < 5) { const t = sstep(5, 0.5, dd); r = lerp(r, 0.97, t); g = lerp(g, 1.08, t); b = lerp(b, 0.95, t); }   // mown right behind the barriers
      o[0] = r; o[1] = g; o[2] = b; return o;
    };
    out.bounds = { minX: P.x0, maxX: P.x1, minZ: P.z0, maxZ: P.z1 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 64;   // tree exclusion circles (buildings, stands, crowds), hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); } };
    const excluded = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (let k = 0; k < Lc.length; k++) { const e = Lc[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };

    /* ---- terrain tiles: which ones (they are built at the end, when the trees have darkened the ground under them) ---- */
    const gMat = new THREE.MeshLambertMaterial({ map: ownTex(spaGrassTex(tex.grass.anisotropy)), vertexColors: true }), tiles = [];
    for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { const on = nrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; tiles.push(ti, tj, on); }

    /* ---- road: asphalt (resurfaced in 2022: even, the rubbered line darker, more so in the braking zones), white edge lines, red and white
       kerbs (256 m chunks, culled; the grass verges at the end) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true }), cMat = new THREE.MeshLambertMaterial({ map: tex.curb, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const kerb = [new Uint8Array(N), new Uint8Array(N)];   // inside of every bend, outside in the tighter ones
    for (let i = 0; i < N; i++) if (T.curb[i]) { const k = T.k[i]; for (const side of [-1, 1]) { const inside = side * k > 0; if (inside || Math.abs(k) > 1 / 70) kerb[side2(side)][i] = 1; } }
    const CH = 128, offs = [-w, -w * 2 / 3, -w / 3, 0, w / 3, w * 2 / 3, w], tileL = 8;
    const brk = new Float32Array(N);
    for (const c of T.corners) if (c.sev >= 2) for (let k = -70; k <= 6; k++) { const i = (c.i0 + k + N) % N, f = k < -10 ? sstep(-70, -12, k) : sstep(6, -10, k); if (f > brk[i]) brk[i] = f; }
    const shade = (i, o) => { const rl = T.rl[i]; let k = 0.8 - (0.13 + 0.1 * brk[i]) * Math.exp(-((o - rl) * (o - rl)) / 5); if (Math.abs(o) > w * 0.92) k -= 0.03; return [k, k, k * 1.03]; };
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB(true), gl = new RB(), gk = new RB(true);
      let pr = -1, pl = -1; const pk = [-1, -1];
      for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
        const i = ii % N, v = ii * ds / tileL;
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o)), offs.map(o => [(o + w) / tileL, v]));
        if (pr >= 0) gr.link(pr, r, 0, offs.length - 1); pr = r;
        const wl = [0.95, 0.95, 0.92], l = gl.row([Pt(i, -w + 0.2, 0.034), Pt(i, -w + 0.5, 0.034), Pt(i, w - 0.5, 0.034), Pt(i, w - 0.2, 0.034)], [wl, wl, wl, wl]);
        if (pl >= 0) { gl.link(pl, l, 0, 1); gl.link(pl, l, 2, 3); } pl = l;
        for (const side of [-1, 1]) {
          const si = side2(side);
          if (kerb[si][i]) {   // red/white kerb in 1 m blocks: a sloped inner edge, a flat top, a low outer lip
            const cw = T.curbW, pf = [[w - 0.02, 0.035], [w + 0.14, 0.078], [w + cw - 0.12, 0.085], [w + cw + 0.02, 0.03]], vv = ii * ds / 2;
            const sh = [0.84, 1, 1, 0.78].map(k => [k, k, k]), us = [0, 0.1, 0.92, 1], o = side > 0 ? [0, 1, 2, 3] : [3, 2, 1, 0];
            const rk = gk.row(o.map(k => Pt(i, side * pf[k][0], pf[k][1])), o.map(k => sh[k]), o.map(k => [us[k], vv]));
            if (pk[si] >= 0) gk.link(pk[si], rk, 0, 3); pk[si] = rk;
          } else pk[si] = -1;
        }
      }
      addM(gr, aMat); addM(gl, lMat); addM(gk, cMat);
    }
    /* ---- run-offs: asphalt from the kerb (or the edge) to just before the barrier where the barrier stands far out (Core: T.gravL / gravR; with
       def.runoffTarmac the cars drive on asphalt there), tapering in and out: a paler, coarser asphalt than the road's, a green painted band
       along the kerb; in a few corners gravel from the kerb out to the barrier instead (def.gravelStrips: Core's gravel there; def.wide moves
       the barrier back for it at Blanchimont), a pale strip of painted concrete along its edge ---- */
    {
      const rc = new Chunks(128, true), gb = new Chunks(128), grn = [0.3, 0.56, 0.34], GS = T.gstrip;
      const roC = (p) => { const k = 1.06 + P.n3(p[0], p[2]) * 0.1; return [k, k * 0.99, k * 0.97]; };   // (the paler tone, in broad patches)
      for (const side of [-1, 1]) {
        const flag = side > 0 ? T.gravR : T.gravL, bar = side > 0 ? T.br : T.bl, K = kerb[side2(side)], S2 = GS ? GS[side2(side)] : null;
        for (let i = 0; i < N; i++) {
          const j = (i + 1) % N; if (!flag[i] && !flag[j]) continue;
          const fi = flag[i] ? 1 : 0, fj = flag[j] ? 1 : 0, inI = w + (K[i] ? T.curbW : 0.05), inJ = w + (K[j] ? T.curbW : 0.05);
          const outI = lerp(inI + 0.1, bar[i] - 0.7, fi), outJ = lerp(inJ + 0.1, bar[j] - 0.7, fj);
          let sI = inI, sJ = inJ;   // where the pale asphalt starts: past the gravel, or past the green band (side by side, not overlapping)
          if (S2 && S2[i] > 0 && S2[j] > 0) { sI = Math.min(w + T.curbW + S2[i], bar[i] - 0.7); sJ = Math.min(w + T.curbW + S2[j], bar[j] - 0.7); }
          else if (fi && fj) { sI = Math.min(outI, inI + 2.4); sJ = Math.min(outJ, inJ + 2.4); const a = Pt(i, side * inI, 0.028);
            gb.get(a[0], a[2]).quadUp(a, Pt(i, side * sI, 0.028), Pt(j, side * sJ, 0.028), Pt(j, side * inJ, 0.028), [grn, grn, grn, grn]); }
          if (sI > outI - 0.05 && sJ > outJ - 0.05) continue;
          const a = Pt(i, side * sI, 0.028), b = Pt(i, side * outI, 0.028), c = Pt(j, side * outJ, 0.028), d = Pt(j, side * sJ, 0.028), uvp = (p) => [p[0] / 8, -p[2] / 8];
          rc.get(a[0], a[2]).quadUp(a, b, c, d, [roC(a), roC(b), roC(c), roC(d)], [uvp(a), uvp(b), uvp(c), uvp(d)]);
        }
      }
      rc.addTo(root, new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }), false, true); gb.addTo(root, lMat, false, true);
      if (T.gstrip) {
        const gs = new Chunks(128, true), gcl = [1.14, 1.04, 0.86], pc = [0.94, 0.93, 0.9], uvg = (p) => [p[0] / 2.5, -p[2] / 2.5], gp = new GB();
        for (const side of [-1, 1]) {
          const S2 = T.gstrip[side2(side)], bar = side > 0 ? T.br : T.bl, o0 = w + T.curbW;
          for (let i = 0; i < N; i++) {
            const j = (i + 1) % N; if (!(S2[i] > 0) || !(S2[j] > 0)) continue;
            const oI = Math.min(o0 + S2[i], bar[i] - 0.7), oJ = Math.min(o0 + S2[j], bar[j] - 0.7); if (oI < o0 + 1 || oJ < o0 + 1) continue;
            const A = Pt(i, side * (o0 + 0.6), 0.036), B = Pt(i, side * oI, 0.036), C = Pt(j, side * oJ, 0.036), D = Pt(j, side * (o0 + 0.6), 0.036);
            gs.get(A[0], A[2]).quadUp(A, B, C, D, [gcl, gcl, gcl, gcl], [uvg(A), uvg(B), uvg(C), uvg(D)]);
            gp.quadUp(Pt(i, side * o0, 0.038), Pt(i, side * (o0 + 0.6), 0.038), Pt(j, side * (o0 + 0.6), 0.038), Pt(j, side * o0, 0.038), [pc, pc, pc, pc]);   // (the concrete edge)
          }
        }
        gs.addTo(root, new THREE.MeshLambertMaterial({ map: ownTex(API.rbGravelTex()), vertexColors: true }), false, true); addM(gp, lMat);
      }
    }
    // chequered start / finish line and the grid boxes (a box for every car, staggered)
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
    if (T.drs) {   // the DRS lines across the road (def.drs, as on the Red Bull Ring): a solid one at each detection point, a dashed one where the zone opens
      const gd = new GB(), wl = [0.95, 0.95, 0.92], HYp = (p) => T.hy[p[3]];
      for (const z of T.drs) for (const [at, dash] of [[z.det, false], [z.act, true]]) {
        const s0 = sAt(at), s1 = s0 + 0.3;
        for (let o = -w + 0.2; o < w - 0.2 - 1e-6; o += dash ? 1.2 : 2) { const o1 = Math.min(w - 0.2, o + (dash ? 0.7 : 2)), A = atSf(s0, o), B = atSf(s0, o1), C = atSf(s1, o1), D = atSf(s1, o);
          gd.quadUp([A[0], HYp(A) + 0.036, A[1]], [B[0], HYp(B) + 0.036, B[1]], [C[0], HYp(C) + 0.036, C[1]], [D[0], HYp(D) + 0.036, D[1]], [wl, wl, wl, wl]); }
      }
      addM(gd, lMat);
    }

    /* ---- barriers: concrete walls along the pit straight (Bus Stop to La Source), the support pits' wall (def.walls) and in front of the
       grandstands, tyre walls round the outside of the slower corners' run-offs, double armco on posts elsewhere; none where the pit lane
       leaves and joins the circuit ---- */
    const t13 = (i) => { const d = dS(i * ds); return d > L - 320 || d < 225; };   // the pit straight
    const wallOn = [new Uint8Array(N), new Uint8Array(N)];   // the walls the track sets itself, and in front of the grandstands (OpenStreetMap)
    for (const [a, b, sd] of def.walls || []) for (let d = a; d <= b; d += ds) wallOn[side2(sd)][T.idx(sAt(d))] = 1;
    for (const [bx, bz, Lb, Wb, ang, , k] of def.bld || []) { if (k !== 2) continue;
      const i = T.nearestIdx(bx, bz), lat = (bx - T.px[i]) * T.nx[i] + (bz - T.pz[i]) * T.nz[i], bar = lat > 0 ? T.br[i] : T.bl[i]; if (Math.abs(lat) - Math.max(Lb, Wb) / 2 > bar + 40) continue;
      const half = (Math.abs(Math.cos(ang - T.hd[i])) * Lb + Math.abs(Math.sin(ang - T.hd[i])) * Wb) / 2 + 10;
      for (let d = -half; d <= half; d += ds) wallOn[lat > 0 ? 1 : 0][T.idx(i * ds + d)] = 1; }
    const tyreOn = [new Uint8Array(N), new Uint8Array(N)];
    for (const c of T.corners) { if (c.sev < 2) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, si = side2(-c.dir);
      for (let k = c.i0 - 10; k <= i1c + 14; k++) { const ii = ((k % N) + N) % N; if ((si ? T.gravR : T.gravL)[ii]) tyreOn[si][ii] = 1; } }
    const kindAt = (i, side) => {   // -1 none (where the pit lane leaves and joins the circuit), 0 armco, 1 concrete wall, 2 tyre wall
      if (side > 0 && def.pit) { const p = T.pitAt(i * ds); if (p) return p.gap ? -1 : 1; }
      if (tyreOn[side2(side)][i]) return 2;
      return t13(i) || wallOn[side2(side)][i] ? 1 : 0;
    };
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const tyMat = new THREE.MeshLambertMaterial({ map: tex.tires, vertexColors: true });
    const postGeo = (() => { const g = new GB(); box(g, 0, 0, 0, 0.13, 1, 0.13, 0, [0.42, 0.43, 0.46], null, true); return g.geometry(); })();
    const posts = new IChunks(postGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), 256);
    const fence = [new Uint8Array(N), new Uint8Array(N)];   // catch fences (1: behind a rail or a wall, 2: behind a tyre wall); more below where the spectators stand
    const steel = [0.8, 0.82, 0.85], steelD = [0.5, 0.52, 0.56], conc = [0.78, 0.78, 0.76], concD = [0.64, 0.64, 0.62], W1 = [1, 1, 1];
    const railRow = (gr, i, side, k) => {   // armco / wall cross-section at sample i (rows run so that the faces look at the road)
      const bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.12), h = 1.1, o2 = side * (bar + (k === 0 ? 0.42 : 0.45));
      let p = k === 0 ? [Pt(i, o, 0.32), Pt(i, o, 0.6), Pt(i, o, 0.66), Pt(i, o, 0.95), Pt(i, o2, 0.95)] : [Pt(i, o, -0.4), Pt(i, o, 0.1), Pt(i, o, h - 0.1), Pt(i, o, h), Pt(i, o2, h)];
      let c = k === 0 ? [steel, steelD, steel, [0.9, 0.91, 0.93], [0.72, 0.74, 0.77]] : [concD, conc, conc, [0.9, 0.9, 0.88], [0.84, 0.84, 0.82]];
      if (side < 0) { p = p.reverse(); c = c.slice().reverse(); }
      return gr.row(p, c);
    };
    const tyreRow = (gt, i, side, u) => {   // a tyre wall: the belted face towards the road, a dark top
      const bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.1), o2 = side * (bar + 0.9), dk = [0.3, 0.3, 0.32];
      let p = [Pt(i, o, -0.1), Pt(i, o, 0.95), Pt(i, o2, 0.95)], uv = [[u, 0.02], [u, 0.98], [u, 0.98]], c = [W1, W1, dk];
      if (side < 0) { p = p.reverse(); uv = uv.slice().reverse(); c = c.slice().reverse(); }
      return gt.row(p, c, uv);
    };
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB(), gt = new RB(true);
      for (const side of [-1, 1]) {
        let prev = -1, pk = -2, acc = c0 * ds;
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++, acc += ds) {
          const i = ii % N, k = kindAt(i, side);
          if (prev >= 0 && k !== pk) { if (pk === 2) gt.link(prev, tyreRow(gt, i, side, acc / 3), 0, 2); else if (pk >= 0) gr.link(prev, railRow(gr, i, side, pk), 0, 4); prev = -1; }   // the old kind runs up to here
          if (k < 0) { pk = k; continue; }
          const r = k === 2 ? tyreRow(gt, i, side, acc / 3) : railRow(gr, i, side, k);
          if (prev >= 0) { if (k === 2) gt.link(prev, r, 0, 2); else gr.link(prev, r, 0, 4); } prev = r; pk = k;
          if (k === 0 && ii % 2 === 0 && ii < c0 + CH) { const p = Pt(i, side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.24), 0); posts.add(p[0], p[1] - 0.35, p[2], T.hd[i], 1, 1.25); }
          if (k >= 1) fence[side2(side)][i] = k;
        }
      }
      addM(gr, rMat, true); addM(gt, tyMat, true);
    }
    const nPosts = posts.addTo(root, true);
    spaProps(out, (i) => t13(i));   // knockable tyre stacks at the exits and apexes
    // advertising on the concrete walls (the game's own brands, tex.sponsors: 4 m boards, the text read from the road)
    { const sb = new Chunks(128, true);
      for (const side of [-1, 1]) for (let i = 0, n = 0; i + 2 <= N; i += 2) {
        const j = (i + 2) % N; if (kindAt(i, side) !== 1 || kindAt(j, side) !== 1 || kindAt((i + 1) % N, side) !== 1) continue;
        const k = (n++ * 3 + (side > 0 ? 1 : 0)) % 8, u0 = (k % 2) * 0.5, v1 = 1 - Math.floor(k / 2) * 0.25, bar = side > 0 ? T.br : T.bl, o = (ii) => side * (bar[ii] + 0.1);
        const A = Pt(i, o(i), 0.14), B = Pt(j, o(j), 0.14), C = Pt(j, o(j), 0.96), D = Pt(i, o(i), 0.96), uL = side < 0 ? u0 : u0 + 0.5, uR = side < 0 ? u0 + 0.5 : u0;
        sb.get(A[0], A[2]).quadO(A, B, C, D, W1, Pt(i, side * (bar[i] + 2), 0.5), [[uL, v1 - 0.25], [uR, v1 - 0.25], [uR, v1], [uL, v1]]); }
      sb.addTo(root, new THREE.MeshLambertMaterial({ map: tex.sponsors }), false, true); }

    /* ---- scenery helpers (vertex coloured, 128 m chunks) ---- */
    const scen = new Chunks(128), ban = new GB(true), crowdG = new GB(true);
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.9, 0.2, 0.15], [0.96, 0.82, 0.2], [0.2, 0.45, 0.9], [0.95, 0.95, 0.95], [0.2, 0.7, 0.3], [1, 0.55, 0.1], [0.15, 0.5, 0.55], [0.7, 0.2, 0.5], [0.12, 0.14, 0.2]];
    const CR = crowdCtx({ gH: nrGround, near: (x, z) => nrNear(x, z).dd, maxSlope: 0.8 });   // spectators (instanced)
    const carPk = (x, z, rot, col) => { const g = scen.get(x, z), y = nrGround(x, z), c = Math.cos(rot), s = Math.sin(rot);
      parkedCar(g, x, y, z, rot, col); };   // (the car: parkedCar in js/world.js)
    const DR = rng(9331);   // (the camp props' own random stream)
    const BE = [[0.08, 0.08, 0.09], [0.97, 0.82, 0.06], [0.84, 0.12, 0.14]];   // the Belgian flag (upright stripes)
    const flagPole = (g, x, y, z, rot, cols) => { const c = Math.cos(rot), s = Math.sin(rot); cyl(g, x, y - 0.2, z, 0.05, 6.4, 5, [0.86, 0.86, 0.88]);
      for (let n = 0; n < 3; n++) { const a = 0.3 + n * 0.5; box(g, x + c * a, y + 5.2, z + s * a, 0.5, 0.95, 0.04, rot, cols[n], null, true); } };
    const tent = (x, z, rot, col) => {   // the fans' camp, by hash: a dome tent, a ridge tent, a gazebo or a camper van; now and then a Belgian flag beside it
      const g = scen.get(x, z), y = nrGround(x, z), h = crH(x, z, 31), c = Math.cos(rot), s = Math.sin(rot), dk = [col[0] * 0.72, col[1] * 0.72, col[2] * 0.72], dark = [0.16, 0.2, 0.26];
      if (h < 0.34) nrLump(g, x, y + 0.05, z, 1.5, 0.78, col, DR, 0.05);
      else if (h < 0.56) gable(g, x, y, z, 3.4, 2.4, 1.35, rot, col, dk);
      else if (h < 0.78) { for (const [a, b] of [[1.45, 1.45], [1.45, -1.45], [-1.45, 1.45], [-1.45, -1.45]]) cyl(g, x + c * a - s * b, y - 0.1, z + s * a + c * b, 0.04, 2.25, 4, [0.86, 0.86, 0.88]);
        cone(g, x, y + 2.1, z, 2.2, 0.8, 4, col, [0.97, 0.97, 0.95], rot + Math.PI / 4); }
      else { box(g, x, y + 0.3, z, 5.4, 2.1, 2.2, rot, [0.93, 0.92, 0.88], [0.84, 0.84, 0.82], true); box(g, x, y + 1.05, z, 5.44, 0.22, 2.24, rot, col, null, true);
        for (const [a, Lw] of [[1.2, 1.3], [-1.4, 0.9]]) box(g, x + c * a, y + 1.55, z + s * a, Lw, 0.5, 2.26, rot, dark, null, true);
        for (const a of [-1.0, 0.6]) box(g, x + c * a, y, z + s * a, 0.6, 0.6, 2.3, rot, [0.08, 0.08, 0.09], null, true); }
      if (crH(x, z, 32) < 0.3) { const fx = x + c * 2.6 - s * 1.6, fz = z + s * 2.6 + c * 1.6; flagPole(g, fx, nrGround(fx, fz), fz, rot + 1.2, BE); }
    };
    const nm = T.names.map(q => q.n), atlas = spaAtlas(nm), BAN = 20 + nm.length;
    const board = (cx, cy, cz, tx, tz, Wd, H, cellK) => {   // text board (bottom centre cx, cy, cz) facing -t (read by cars driving along +t), a dark back behind it
      const [u0, v0, u1, v1] = nrAUV(cellK), ux = tz, uz = -tx, hw = -Wd / 2;   // (the text's left edge on the driver's left)
      const A = [cx - ux * hw, cy, cz - uz * hw], B = [cx + ux * hw, cy, cz + uz * hw], C = [B[0], cy + H, B[2]], D = [A[0], cy + H, A[2]];
      ban.quadO(A, B, C, D, W1, [cx + tx, cy + H / 2, cz + tz], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
      box(scen.get(cx, cz), cx + tx * 0.06, cy - 0.02, cz + tz * 0.06, 0.08, H + 0.04, Wd + 0.04, Math.atan2(tz, tx), [0.3, 0.31, 0.33], null, true);
    };
    const signPost = (s, side, extra, cellK, Wd, H, y0) => {   // a board on two posts beside the track, facing the traffic
      const [x, z, i] = onSide(s, side, extra), y = nrGround(x, z), g = scen.get(x, z), nx = T.nx[i], nz = T.nz[i];
      for (const o of [-Wd / 2 + 0.2, Wd / 2 - 0.2]) box(g, x + nx * o + T.tx[i] * 0.16, y - 0.3, z + nz * o + T.tz[i] * 0.16, 0.1, y0 + H + 0.3, 0.1, T.hd[i], [0.55, 0.56, 0.58]);
      board(x, y + y0, z, T.tx[i], T.tz[i], Wd, H, cellK); exclPush(x, z, 3);
    };
    const roomSide = (s) => { let l = 0, r = 0; for (let d = -30; d <= 30; d += 6) { const i = T.idx(s + d); l += T.bl[i]; r += T.br[i]; } return r > l ? 1 : -1; };

    /* ---- START / FINISH: the gantry with the start lights, the banner; Belgian flags behind the walls of the pit straight, banners on them ---- */
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
      for (let d = -300; d < 210; d += 14) {   // flag poles behind the wall on the grandstand side: the Belgian flag, the circuit's, the sponsors'
        const [px, pz, ii] = onSide(sAt(d), -1, 2.2), py = nrGround(px, pz), gg = scen.get(px, pz), k = Math.floor(crH(d, 3, 57) * 4); CR.avoid(px, pz, 0.45);
        if (k < 2) flagPole(gg, px, py, pz, T.hd[ii], BE);
        else { cyl(gg, px, py, pz, 0.06, 6, 5, [0.86, 0.86, 0.88]); box(gg, px + T.tx[ii] * 0.6, py + 4.8, pz + T.tz[ii] * 0.6, 1.2, 0.8, 0.05, T.hd[ii], k === 2 ? [0.07, 0.18, 0.42] : fans[Math.floor(crH(d, 4, 57) * fans.length)], null, true); }
      }
      for (let d = -210, n = 0; d < 150; d += 30, n++) for (const side of [-1, 1]) {   // banners on the walls of the straight: EAU ROUGE, BELGIQUE · BELGIË, DÉPART · ARRIVÉE
        const s0 = sAt(d), a0 = T.idx(s0), b0 = T.idx(s0 + 3.6), [u0, v0, u1, v1] = nrAUV(BAN + 1 + (n + (side > 0 ? 1 : 0)) % 3);
        if (kindAt(a0, side) !== 1 || kindAt(b0, side) !== 1) continue;
        const Wp = (ii, yy) => { const o = side * ((side > 0 ? T.br[ii] : T.bl[ii]) + 0.1); return [T.px[ii] + T.nx[ii] * o, T.hy[ii] + yy, T.pz[ii] + T.nz[ii] * o]; };
        const A = Wp(a0, 1.14), ins = [A[0] + T.nx[a0] * side * 2, A[1], A[2] + T.nz[a0] * side * 2];
        ban.quadO(A, Wp(b0, 1.14), Wp(b0, 2.0), Wp(a0, 2.0), W1, ins, side > 0 ? [[u1, v0], [u0, v0], [u0, v1], [u1, v1]] : [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);   // (over the wall, on the fence)
      }
    }

    /* ---- buildings (OpenStreetMap footprints near the track): Ardennes houses (stone or whitewashed walls, dark slate roofs), halls, the grandstands
       (tiers of coloured seats packed with fans, a roof on steel pillars), the support pits' buildings ---- */
    let nBld = 0, nStands = 0; const crB0 = excl.length;
    const pitZone = (x, z) => { if (!def.pit) return false; const i = T.nearestIdx(x, z), lat = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i], d = dS(i * ds), dd = d > L / 2 ? d - L : d;
      return lat > 0 && lat < 80 && dd > def.pit[1] - 20 && dd < def.pit[2] + 20; };
    const SEATS = [[0.14, 0.3, 0.62], [0.72, 0.14, 0.14], [0.9, 0.72, 0.12], [0.2, 0.5, 0.3]];
    for (const [bx, bz, Lb, Wb, ang, H, k] of def.bld || []) {
      if (k === 3 && pitZone(bx, bz)) continue;   // (the pit building on the pit straight is the pit lane's garages, below)
      const ca = Math.cos(ang), sa = Math.sin(ang), corners = [[Lb / 2, Wb / 2], [Lb / 2, -Wb / 2], [-Lb / 2, Wb / 2], [-Lb / 2, -Wb / 2]].map(([a, b]) => [bx + ca * a - sa * b, bz + sa * a + ca * b]);
      let clash = false, y0 = 1e9; for (const [cx, cz] of corners.concat([[bx, bz]])) { const n = nrNear(cx, cz); if (n.i >= 0 && n.dd < 1.5) clash = true; y0 = Math.min(y0, nrGround(cx, cz)); }
      if (clash) continue;
      const g = scen.get(bx, bz); nBld++; CR.block(bx, bz, Lb, Wb, ang);   // (nobody stands inside it)
      if (k === 2) {   // grandstand: tiers climbing away from the track, a crowd on every tier's seats, a roof on steel pillars over the back half
        const n = nrNear(bx, bz), i = n.i >= 0 ? n.i : T.nearestIdx(bx, bz), fa = ((T.px[i] - bx) * -sa + (T.pz[i] - bz) * ca) > 0 ? 1 : -1;   // +1: the front faces the local +b axis
        const tiers = Math.max(6, Math.min(12, Math.round(Wb / 1.6))), dep = Wb / tiers, seat = SEATS[Math.floor(crH(bx, bz, 61) * SEATS.length)];
        for (let t = 0; t < tiers; t++) { const b = fa * (Wb / 2 - (t + 0.5) * dep), cx = bx - sa * b, cz = bz + ca * b, hgt = 0.9 + t * 0.8;
          box(g, cx, y0, cz, Lb, hgt, dep, ang, [0.6, 0.61, 0.64], seat);
          const b0 = b - fa * dep * 0.45, b1 = b + fa * dep * 0.1, yy = y0 + hgt + 0.02, A = [bx - ca * Lb / 2 - sa * b0, yy, bz - sa * Lb / 2 + ca * b0], B = [bx + ca * Lb / 2 - sa * b0, yy, bz + sa * Lb / 2 + ca * b0], C = [bx + ca * Lb / 2 - sa * b1, yy, bz + sa * Lb / 2 + ca * b1], D = [bx - ca * Lb / 2 - sa * b1, yy, bz - sa * Lb / 2 + ca * b1];
          if (crH(bx + t, bz, 62) < 0.9) crowdG.quadUp(A, B, C, D, [W1, W1, W1, W1], [[0, t * 0.11], [Lb / 12, t * 0.11], [Lb / 12, t * 0.11 + 0.1], [0, t * 0.11 + 0.1]]); }
        const top = 0.9 + tiers * 0.8, bb = -fa * (Wb / 2 + 0.3); box(g, bx - sa * bb, y0, bz + ca * bb, Lb, top + 0.6, 0.5, ang, [0.52, 0.53, 0.57]);   // the back wall
        const rb = -fa * (Wb / 2 - Wb * 0.32), rW = Wb * 0.7, ry = y0 + top + 3.2;
        for (let a = -Lb / 2; a <= Lb / 2 + 0.1; a += Lb / Math.max(2, Math.round(Lb / 14))) { const px = bx + ca * a - sa * bb * 0.98, pz = bz + sa * a + ca * bb * 0.98; box(g, px, y0, pz, 0.4, ry - y0, 0.4, ang, [0.84, 0.85, 0.88]); }
        box(g, bx - sa * rb, ry, bz + ca * rb, Lb + 0.6, 0.35, rW, ang, [0.72, 0.74, 0.78], [0.93, 0.94, 0.95]);   // the roof
        box(g, bx - sa * (rb + fa * rW / 2), ry - 0.9, bz + ca * (rb + fa * rW / 2), Lb + 0.6, 0.9, 0.12, ang, [0.07, 0.18, 0.42], null, true);   // its fascia (the circuit's blue)
        exclPush(bx, bz, Math.max(Lb, Wb) / 2 + 8); nStands++;
      } else if (k === 3) {   // the support pits' buildings: garages open to their lane, offices with a glass front above, a flat roof
        const n = nrNear(bx, bz), i = n.i >= 0 ? n.i : T.nearestIdx(bx, bz), fa = ((T.px[i] - bx) * -sa + (T.pz[i] - bz) * ca) > 0 ? 1 : -1;   // +1: the lane side is the local +b side
        const hh = H || 9.2, fb = fa * (Wb / 2 + 0.05), fx = bx - sa * fb, fz = bz + ca * fb;
        box(g, bx, y0 - 0.4, bz, Lb, hh + 0.4, Wb, ang, [0.88, 0.89, 0.9], [0.6, 0.61, 0.64]);
        for (let a = -Lb / 2 + 2.3; a < Lb / 2 - 1.8; a += 4.6) box(g, fx + ca * a, y0, fz + sa * a, 3.6, 3.7, 0.14, ang, [0.16, 0.17, 0.2], null, true);   // garage openings
        box(g, fx, y0 + 5.0, fz, Lb - 0.5, 2.8, 0.14, ang, [0.22, 0.3, 0.4], [0.3, 0.37, 0.46], true);   // the glass front of the first floor
        box(g, bx, y0 + hh, bz, Lb + 0.3, 0.35, Wb + 0.3, ang, [0.72, 0.73, 0.75], [0.66, 0.67, 0.7]);   // roof edge
        exclPush(bx, bz, Math.max(Lb, Wb) / 2 + 4);
      } else if (k === 1) {   // hall: metal walls, a flat roof
        const hh = H || 8 + R() * 3, wc = vary([0.6, 0.64, 0.7], R, 0.12);
        box(g, bx, y0 - 0.4, bz, Lb, hh + 0.4, Wb, ang, wc, [0.46, 0.48, 0.52]);
        exclPush(bx, bz, Math.max(Lb, Wb) / 2 + 4);
      } else {   // an Ardennes house: grey stone or whitewashed walls (now and then red brick), a steep dark slate roof along the long side
        const hh = H || 5.4 + R() * 2.2, walls = [[0.66, 0.64, 0.6], [0.94, 0.93, 0.89], [0.72, 0.7, 0.66], [0.62, 0.38, 0.3]], wc = walls[Math.floor(R() * walls.length)];
        box(g, bx, y0 - 0.4, bz, Lb, hh + 0.4, Wb, ang, vary(wc, R, 0.05), null, true);
        if (Lb * Wb < 1500) gable(g, bx, y0 + hh, bz, Lb + 0.5, Wb + 0.5, Math.min(5, Wb * 0.55), ang, vary([0.2, 0.22, 0.26], R, 0.08), wc);
        else box(g, bx, y0 + hh, bz, Lb, 0.5, Wb, ang, [0.36, 0.37, 0.4]);
        exclPush(bx, bz, Math.max(Lb, Wb) / 2 + 3);
      }
    }
    const crB1 = excl.length;

    /* ---- the pit lane right of the pit straight, the crews' boxes and the pit building's garages (on the road's height) ---- */
    if (def.pit) { pitLaneScenery({ R, scen, prop: (kind, x, z, yaw, col) => out.props.push({ kind, x, z, yaw: yaw || 0, col: col || 0 }), excl: exclPush, root, out, ownTex, Y: (s) => T.elevAt(s).y, spa: true });
      for (let d = def.pit[1]; d <= def.pit[2]; d += 6) { const s = sAt(d), p = T.pitAt(s); if (!p) continue;   // no trees, no crowd from the rail to behind the garages
        const r = (p.o + 20 - p.wall) / 2, [x, z] = onSide(s, 1, r); exclPush(x, z, r + 2); } }
    /* ---- the support pit lane (the endurance series' pits on the way down to Eau Rouge: scenery, behind the pit wall): asphalt from the wall to the
       garages of the pit buildings off the pit straight, a white line along it; the strip between the road and the wall in concrete ---- */
    {
      const edge = [new Float32Array(N), new Float32Array(N)];   // per sample and side: the distance of the garages' front from the centre line (0: none)
      for (const [bx, bz, Lb, Wb, ang, , k] of def.bld || []) { if (k !== 3 || pitZone(bx, bz)) continue;
        const i = T.nearestIdx(bx, bz), lat = (bx - T.px[i]) * T.nx[i] + (bz - T.pz[i]) * T.nz[i], sd = lat > 0 ? 1 : 0, bar = sd ? T.br[i] : T.bl[i];
        const c = Math.abs(Math.cos(ang - T.hd[i])), sn = Math.abs(Math.sin(ang - T.hd[i])), front = Math.abs(lat) - (c * Wb + sn * Lb) / 2, half = (c * Lb + sn * Wb) / 2;
        if (front - bar < 3 || front - bar > 18) continue;
        for (let d = -half; d <= half; d += ds) { const ii = T.idx(i * ds + d); edge[sd][ii] = edge[sd][ii] ? Math.min(edge[sd][ii], front) : front; } }
      const gs = new GB(true), gsl = new GB(), one = [1, 1, 1], wl = [0.94, 0.94, 0.9];
      for (const side of [-1, 1]) { const E = edge[side2(side)], bar = side > 0 ? T.br : T.bl;
        const at = (k, o) => { const q = side * o, x = T.px[k] + T.nx[k] * q, z = T.pz[k] + T.nz[k] * q; return [x, nrGround(x, z) + 0.1, z]; };   // (above the verge)
        for (let i = 0; i < N; i++) { const j = (i + 1) % N; if (!E[i] || !E[j]) continue;
          const A = [bar[i] + 0.3, (bar[i] + 0.3 + E[i] - 0.4) / 2, E[i] - 0.4], B = [bar[j] + 0.3, (bar[j] + 0.3 + E[j] - 0.4) / 2, E[j] - 0.4];   // (from the wall's back)
          const a = A.map(o => at(i, o)), b = B.map(o => at(j, o)), uv = (p) => [p[0] / 8, -p[2] / 8];
          for (let c = 0; c < 2; c++) gs.quadUp(a[c], a[c + 1], b[c + 1], b[c], [one, one, one, one], [uv(a[c]), uv(a[c + 1]), uv(b[c + 1]), uv(b[c])]);
          const l0 = at(i, A[1] - 0.08), l1 = at(i, A[1] + 0.08), l2 = at(j, B[1] + 0.08), l3 = at(j, B[1] - 0.08); for (const p of [l0, l1, l2, l3]) p[1] += 0.012;
          gsl.quadUp(l0, l1, l2, l3, [wl, wl, wl, wl]);
          if (i % 5 === 0) { const [x, , z] = a[1]; exclPush(x, z, (E[i] - bar[i]) / 2 + 3); } } }   // (no trees, no crowd on the lane)
      addM(gs, aMat); addM(gsl, lMat);
      const gc = new GB(true), cc = [1.16, 1.15, 1.12], sw = [new Uint8Array(N), new Uint8Array(N)];
      for (const [a, b, sd] of def.walls || []) for (let d = a; d <= b; d += ds) sw[side2(sd)][T.idx(sAt(d))] = 1;
      for (const side of [-1, 1]) { const SW = sw[side2(side)], bar = side > 0 ? T.br : T.bl;
        const row = (k) => { const vr = spaVerge(k, side), b = bar[k] - 0.2;
          return [w, (w + b) / 2, b].map(o => { let m = 0; while (m < vr.length - 2 && vr[m + 1][0] < o) m++; const p = vr[m], q = vr[m + 1];
            return Pt(k, side * o, p[1] + (q[1] - p[1]) * clamp((o - p[0]) / Math.max(1e-3, q[0] - p[0]), 0, 1) + 0.03); }); };
        for (let i = 0; i < N; i++) { const j = (i + 1) % N; if (!SW[i] || !SW[j]) continue;
          const A = row(i), B = row(j), uv = (p) => [p[0] / 8, -p[2] / 8];
          for (let c = 0; c < 2; c++) gc.quadUp(A[c], A[c + 1], B[c + 1], B[c], [cc, cc, cc, cc], [uv(A[c]), uv(A[c + 1]), uv(B[c + 1]), uv(B[c])]); } }
      addM(gc, aMat);
    }

    /* ---- the Eau Rouge brook (def.brook: its course, rust-brown with iron): water on the valley floor between muddy banks, through culverts under
       the road (concrete headwalls where it goes in and out); only near the track, where the ground is built ---- */
    let inBrook = () => false;   // (x, z, r): within r of the water (the fans' tents and cars keep out of it)
    if (def.brook) {
      const pts = [];   // the course resampled every 3 m
      for (let k = 0; k < def.brook.length - 1; k++) { const [ax, az] = def.brook[k], [bx, bz] = def.brook[k + 1], l = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(l / 3));
        for (let m = 0; m < n; m++) pts.push([ax + (bx - ax) * m / n, az + (bz - az) * m / n]); }
      pts.push(def.brook[def.brook.length - 1]);
      const wg = new Chunks(256, true), bg = new Chunks(256), HW = 1.1, BW = 1.9, mud = [0.36, 0.3, 0.24], mud2 = [0.44, 0.4, 0.3], rust = [0.55, 0.32, 0.18], deep = [0.33, 0.19, 0.12];
      const under = (x, z) => { const n = nrNear(x, z); return n.i >= 0 && n.dd < 2.5; }, far = (x, z) => nrDist(x, z) > 240;
      const cul = []; for (let k = 0; k < pts.length - 1; k++) if (under(pts[k][0], pts[k][1]) !== under(pts[k + 1][0], pts[k + 1][1])) cul.push(pts[k]);   // (the culverts' mouths: white water by them)
      let dist = 0;
      for (let k = 0; k < pts.length - 1; k++) {
        const [ax, az] = pts[k], [bx, bz] = pts[k + 1], ua = under(ax, az), ub = under(bx, bz), d0 = dist; dist += Math.hypot(bx - ax, bz - az);
        if (far(ax, az) || far(bx, bz)) continue;
        if (ua !== ub) {   // a culvert mouth: a concrete headwall across the water where the brook goes under the road
          const [cx, cz] = ua ? [bx, bz] : [ax, az], hd = Math.atan2(bz - az, bx - ax), y = nrGround(cx, cz);
          box(scen.get(cx, cz), cx, y - 0.6, cz, 0.5, 1.5, 4.2, hd, [0.62, 0.62, 0.6], [0.7, 0.7, 0.68]); exclPush(cx, cz, 3); }
        if (ua || ub) continue;
        const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
        const Pb = (x, z, o, dy) => { const X = x + nx * o, Z = z + nz * o; return [X, nrGround(X, Z) + dy, Z]; };
        const g = wg.get(ax, az), w0 = Pb(ax, az, -HW, 0.07), m0 = Pb(ax, az, 0, 0.07), w1 = Pb(ax, az, HW, 0.07), w2 = Pb(bx, bz, HW, 0.07), m1 = Pb(bx, bz, 0, 0.07), w3 = Pb(bx, bz, -HW, 0.07);
        const st = Math.max(clamp((nrGround(ax, az) - nrGround(bx, bz)) / l / 0.1, 0, 1), cul.some(c => (c[0] - ax) ** 2 + (c[1] - az) ** 2 < 49) ? 0.8 : 0), S2 = 2 * Math.round(st * 10), d1 = d0 + l;   // (steep, or by a culvert: white water)
        g.quadUp(w0, m0, m1, w3, [rust, deep, deep, rust], [[S2, d0], [S2 + 0.5, d0], [S2 + 0.5, d1], [S2, d1]]); g.quadUp(m0, w1, w2, m1, [deep, rust, rust, deep], [[S2 + 0.5, d0], [S2 + 1, d0], [S2 + 1, d1], [S2 + 0.5, d1]]);   // (the iron-red shallows at the sides, darker in the middle)
        const b = bg.get(ax, az);
        for (const sd of [-1, 1]) b.quadUp(Pb(ax, az, sd * HW, 0.06), Pb(ax, az, sd * BW, 0.05), Pb(bx, bz, sd * BW, 0.05), Pb(bx, bz, sd * HW, 0.06), [mud, mud2, mud2, mud]);
        if (k % 2 === 0) exclPush(ax, az, BW + 0.8);   // (no tree in the water)
        CR.block((ax + bx) / 2, (az + bz) / 2, l + 0.4, BW * 2 + 0.6, Math.atan2(dz, dx));   // (nobody standing in it)
      }
      out.dyn.brook = { uT: { value: 0 } }; wg.addTo(root, brookMat(out.dyn.brook), false, true);
      bg.addTo(root, matV, false, true);
      const bh = new Map(); for (const [x, z] of pts) { const k = Math.floor(x / 16) + ',' + Math.floor(z / 16); let Lc = bh.get(k); if (!Lc) bh.set(k, Lc = []); Lc.push(x, z); }
      inBrook = (x, z, r) => { for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const Lc = bh.get((Math.floor(x / 16) + a) + ',' + (Math.floor(z / 16) + b)); if (Lc) for (let q = 0; q < Lc.length; q += 2) if ((x - Lc[q]) ** 2 + (z - Lc[q + 1]) ** 2 < (r + BW) ** 2) return true; } return false; };
    }

    /* ---- marshal posts (the real ones, OpenStreetMap: numbered in the order of the lap, moved out behind the barrier where they would stand in front
       of it): a small white cabin on a plinth under an orange roof, its number and two amber lights facing the road; braking boards 300 / 200 / 100 m
       before the heavy stops; the corner names ---- */
    const numTex = ownTex(nrNumTex()), numC = new Chunks(512, true);
    const post = (x, z, i, side, num) => {
      const y = nrGround(x, z), g = scen.get(x, z), hd = T.hd[i], tx = T.tx[i], tz = T.tz[i], nx = T.nx[i] * side, nz = T.nz[i] * side;
      box(g, x, y - 0.3, z, 2.3, 0.75, 2.1, hd, [0.52, 0.53, 0.56]);   // the plinth
      box(g, x, y + 0.45, z, 2.0, 2.0, 1.8, hd, [0.95, 0.95, 0.93], null, true);   // the cabin
      box(g, x - nx * 0.25, y + 2.45, z - nz * 0.25, 2.5, 0.16, 2.5, hd, [0.93, 0.44, 0.09], [0.98, 0.5, 0.12]);   // its roof, overhanging towards the road
      box(g, x - nx * 0.92, y + 1.2, z - nz * 0.92, 1.4, 0.7, 0.06, hd, [0.18, 0.24, 0.32], null, true);   // the window
      for (const a of [-0.12, 0.12]) box(g, x - tx * side * (0.72 + a) - nx * 0.95, y + 2.05, z - tz * side * (0.72 + a) - nz * 0.95, 0.12, 0.12, 0.04, hd, [1, 0.74, 0.12], null, true);   // the amber lights
      const [u0, v0, u1, v1] = nrNUV((num - 1) % 128), lx = tx * side * 0.26, lz = tz * side * 0.26, px = x - nx * 0.93, pz = z - nz * 0.93;   // the number beside them, facing the road
      numC.get(px, pz).quadO([px + lx, y + 1.62, pz + lz], [px - lx, y + 1.62, pz - lz], [px - lx, y + 2.14, pz - lz], [px + lx, y + 2.14, pz + lz], W1, [x, y + 1.8, z], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
      exclPush(x, z, 4); };
    { const ps = (def.posts || []).map(([px, pz]) => { const i = T.nearestIdx(px, pz); return [px, pz, i, dS(i * ds)]; }).sort((a, b) => a[3] - b[3]);
      let np = 0;
      for (const [px, pz, i] of ps) {
        const lat = (px - T.px[i]) * T.nx[i] + (pz - T.pz[i]) * T.nz[i], side = lat > 0 ? 1 : -1, bar = side > 0 ? T.br[i] : T.bl[i];
        const [x, z] = Math.abs(lat) < bar + 2.4 ? onSide(i * ds, side, 2.4) : [px, pz]; scen.get(x, z);
        if (!excluded(x, z)) post(x, z, i, side, ++np);
      } }
    for (const n of ['La Source', 'Les Combes', 'Bruxelles', 'Bus Stop']) { const d = nameD(n); if (d == null) continue;   // braking boards before the heavy stops
      for (let k = 3; k >= 1; k--) { const s = sAt(d - k * 100); signPost(s, roomSide(s), 1.4, k - 1, 1.5, 0.7, 0.9); } }
    T.names.forEach((q, k) => { const s = sAt(q.d - 55); signPost(s, roomSide(s), 1.6, 20 + k, 3.2, 0.8, 1.2); });
    for (const z of T.drs || []) { const s = sAt(z.act), side = roomSide(s); if (side > 0 && def.pit && T.pitAt(s)) continue; signPost(s, side, 1.4, 3, 2.4, 1.0, 1.6); }   // DRS boards where each zone opens

    /* ---- the TV cameras (on a scaffold tower on the outside of the famous corners: the cameraman at his camera under a sunshade), big video
       screens across the track from the grandstands, the game's own sponsors on boards along the rails of the straights, and the marshals in
       orange at their posts, a flag in hand (both of them figures of the instanced crowd: filming, waving a flag) ---- */
    {
      const free = (x, z, r) => !excluded(x, z) && nrSlope(x, z) < 0.45 && nrNear(x, z).dd > r;   // (clear of other scenery, not on a steep bank, not near another leg)
      const place = (d0, side, extra, r) => { for (const dd of [0, 12, -12, 24, -24, 40, -40]) { const p = onSide(sAt(d0 + dd), side, extra); if (free(p[0], p[1], r)) return p; } return null; };
      const outside = (d) => { let k = 0; for (let e = -40; e <= 40; e += 4) k += T.k[T.idx(sAt(d + e))]; return k > 0 ? -1 : 1; };   // (the outside of the bend around d)
      const person = (x, y, z, fx, fz, col, pose) => { CR.ppl.put(x, y, z, Math.atan2(fx, fz), 0.98, 1, col, pose + crH(x, z, 9) * 0.998, Math.floor(crH(x, z, 11) * 4) + 4 * Math.floor(crH(x, z, 10) * 256)); CR.n++; };
      const grey = [0.6, 0.62, 0.64], dark = [0.17, 0.18, 0.2], plank = [0.42, 0.34, 0.24];
      for (const [n, dd] of [['La Source', 10], ['Raidillon', 25], ['Les Combes', 0], ['Pouhon', 0], ['Blanchimont', 30], ['Bus Stop', -25]]) {   // the TV towers
        const d = nameD(n); if (d == null) continue;
        let side = outside(d + dd), p = place(d + dd, side, 6.5, 4);
        if (!p) { side = -side; p = place(d + dd, side, 6.5, 4); } if (!p) continue;
        const [x, z, i] = p, g = scen.get(x, z), y = nrGround(x, z), H = 4.4, hd = T.hd[i], c = Math.cos(hd), sn = Math.sin(hd);
        const at = (a, b) => [x + c * a - sn * b, z + sn * a + c * b];   // a along the track, b across (+b: the track's +n side)
        for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const [lx, lz] = at(a, b); cyl(g, lx, y - 0.1, lz, 0.07, H + 1.15, 5, grey); }   // (the legs run up into the railing)
        for (const hy of [1.4, 2.9]) for (const [a, b, rot] of [[0, -1, 0], [0, 1, 0], [-1, 0, Math.PI / 2], [1, 0, Math.PI / 2]]) { const [lx, lz] = at(a, b); box(g, lx, y + hy, lz, 2.0, 0.07, 0.07, hd + rot, grey); }
        box(g, x, y + H, z, 2.6, 0.16, 2.6, hd, plank, [0.5, 0.41, 0.3]);                                          // the platform
        for (const [a, b, rot] of [[0, -1.25, 0], [0, 1.25, 0], [-1.25, 0, Math.PI / 2], [1.25, 0, Math.PI / 2]]) { const [lx, lz] = at(a, b); box(g, lx, y + H + 0.95, lz, 2.5, 0.06, 0.06, hd + rot, grey); }   // the railing
        { const [lx, lz] = at(0.6, 0.6 * side); cyl(g, lx, y + H, lz, 0.04, 2.5, 4, grey); cone(g, lx, y + H + 2.15, lz, 1.35, 0.5, 8, [0.95, 0.44, 0.1], [0.97, 0.97, 0.95], 0); }   // the sunshade
        const tf = -side, [cx, cz] = at(0, 0.55 * tf), [mx, mz] = at(0.1, -0.35 * tf), ny = T.nx[i] * tf, nz = T.nz[i] * tf;   // the camera on its tripod at the front rail, the cameraman behind it
        for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; cyl(g, cx + Math.cos(a) * 0.28, y + H + 0.08, cz + Math.sin(a) * 0.28, 0.025, 1.25, 3, dark, null, 0.02); }
        box(g, cx, y + H + 1.3, cz, 0.72, 0.36, 0.3, Math.atan2(nz, ny), dark, [0.25, 0.26, 0.28]);
        cyl(g, cx + ny * 0.45, y + H + 1.4, cz + nz * 0.45, 0.12, 0.12, 6, [0.08, 0.08, 0.09]);
        person(mx, y + H + 0.08, mz, ny, nz, [0.13, 0.3, 0.62], 3);
        exclPush(x, z, 4.5); CR.avoid(x, z, 2.4);
      }
      const scrTex = ownTex(spaScreenTex()), scrG = new GB(true);   // the big screens: across the track from the grandstands, facing them
      for (const [d0, sg] of [[1150, -1], [620, -1], [276, -1], [6930, -1]]) {   // (the grandstand's distance and side: Raidillon, the descent, La Source, the pit straight)
        const p = place(d0, -sg, 5.5, 5); if (!p) continue;
        const [x, z, i] = p, g = scen.get(x, z), y = nrGround(x, z), Wsc = 7.2, Hs = 4.05, y0 = y + 3.2, fx = T.nx[i] * sg, fz = T.nz[i] * sg, ux = -fz, uz = fx;
        for (const o of [-Wsc / 2 + 0.5, Wsc / 2 - 0.5]) box(g, x + ux * o - fx * 0.3, y - 0.2, z + uz * o - fz * 0.3, 0.3, y0 - y + Hs + 0.2, 0.3, Math.atan2(uz, ux), dark);
        box(g, x - fx * 0.12, y0 - 0.25, z - fz * 0.12, Wsc + 0.5, Hs + 0.5, 0.35, Math.atan2(uz, ux), dark, [0.25, 0.26, 0.28]);   // the frame
        for (const f of [1, -1]) {   // the picture on both sides (read the right way round from either)
          const o = f > 0 ? 0.07 : -0.31, A = [x + fx * o - ux * f * Wsc / 2, y0, z + fz * o - uz * f * Wsc / 2], B = [x + fx * o + ux * f * Wsc / 2, y0, z + fz * o + uz * f * Wsc / 2];
          scrG.quadO(A, B, [B[0], y0 + Hs, B[2]], [A[0], y0 + Hs, A[2]], W1, [x - fx * f, y0 + Hs / 2, z - fz * f], [[0, 0], [1, 0], [1, 1], [0, 1]]);
        }
        exclPush(x, z, 6); CR.avoid(x, z, 4);
      }
      if (!scrG.empty) { const m = addM(scrG, new THREE.MeshBasicMaterial({ map: scrTex, color: 0xe6e6e6 })); if (m) m.castShadow = false; }
      for (const [a, b, sides] of [[300, 900, [-1]], [1430, 2140, [-1, 1]], [5200, 5640, [-1, 1]], [6250, 6560, [-1, 1]]]) {   // sponsors over the rails along the straights
        for (const side of sides) for (let dd = a, k = 0; dd < b; dd += 14, k++) {
          const s = sAt(dd), i = T.idx(s); if (kindAt(i, side) !== 0) continue;
          const [x, z] = onSide(s, side, 0.35), y = T.hy[i] + 0.78;
          board(x, y, z, T.nx[i] * side, T.nz[i] * side, 9.6, 0.82, 40 + ((k + (side > 0 ? 3 : 0) + Math.floor(a / 7)) % 8));
        }
      }
      for (const [px, pz] of def.posts || []) {   // the marshals at their posts: two in orange, one with a flag
        const i = T.nearestIdx(px, pz), lat = (px - T.px[i]) * T.nx[i] + (pz - T.pz[i]) * T.nz[i], side = lat > 0 ? 1 : -1;
        const [x, z] = onSide(i * ds, side, 1.1), fx = -T.nx[i] * side, fz = -T.nz[i] * side, y = nrGround(x, z);
        if (nrSlope(x, z) > 0.6) continue;
        person(x + T.tx[i] * 2.6, y, z + T.tz[i] * 2.6, fx, fz, [0.98, 0.5, 0.08], 5);
        person(x - T.tx[i] * 1.2, y, z - T.tz[i] * 1.2, fx, fz, [0.98, 0.5, 0.08], 0);
        CR.avoid(x, z, 3.5);
      }
    }

    /* ---- spectators on the grass banks at the famous places, fans' tents and cars in the woods behind the bigger crowds, catch fences in front ---- */
    const FANS = { 'La Source': 3, 'Eau Rouge': 3, 'Raidillon': 3, 'Kemmel': 1, 'Les Combes': 2, 'Malmedy': 1, 'Bruxelles': 2, "Speaker's Corner": 1, 'Pouhon': 3, 'Fagnes': 2, 'Campus': 1, 'Dolgi desni': 2, 'Blanchimont': 2, 'Bus Stop': 3 };
    const tcols = [[0.85, 0.16, 0.14], [0.15, 0.36, 0.8], [0.95, 0.75, 0.12], [0.2, 0.62, 0.3], [0.92, 0.92, 0.9], [0.55, 0.3, 0.7]];
    let nFans = 0; const crE0 = excl.length;
    for (const q of T.names) {
      const wgt = FANS[q.n]; if (!wgt) continue;
      const sm = sAt(q.d), side = roomSide(sm), half = 18 + wgt * 12;
      for (let s = sm - half; s < sm + half; s += 1.15) for (let row = 0; row < wgt; row++) {
        if (R() > 0.72 - row * 0.12) continue;
        const ex = 2.4 + row * 1.2 + (R() - 0.5) * 0.4, [x, z] = onSide(s, side, ex); if (nrNear(x, z).dd < 1.2 || nrSlope(x, z) > 0.8) continue;
        const sc = fans[Math.floor(R() * fans.length)]; R();
        crowdAt(CR, s, side, ex, x, z, { col: sc, sit: 0.25, flag: 0.08 }, row, (a, b) => nrNear(a, b).dd >= 1.2 && nrSlope(a, b) <= 0.8); nFans++;
      }
      for (let ii = T.idx(sm - half - 6), n = 0; n < (2 * half + 12) / ds; n++, ii = (ii + 1) % N) if (!fence[side2(side)][ii]) fence[side2(side)][ii] = 1;
      if (wgt >= 2) for (let k = 0; k < wgt * 5; k++) {   // camping in the woods behind the crowd
        const s = sm + (R() - 0.5) * half * 2, [x, z, i] = onSide(s, side, 9 + R() * 22); if (nrSlope(x, z) > 0.45 || inBrook(x, z, 3)) continue;
        if (R() < 0.55) tent(x, z, T.hd[i] + (R() - 0.5) * 0.6, tcols[Math.floor(R() * tcols.length)]); else carPk(x, z, T.hd[i] + (R() - 0.5) * 0.8, vary(fans[Math.floor(R() * fans.length)], R, 0.2));
      }
      const [ex, ez] = onSide(sm, side, 14); exclPush(ex, ez, half + 10);
    }
    /* ---- more spectators (instanced, hashed): the far side at the famous places, more rows at the big five, the grandstand side of the pit
       straight (the pits are on its right), the Kemmel straight, small groups everywhere; chain link in front of the bigger crowds ---- */
    {
      const fanE = new Set(excl.slice(crE0)), bldE = new Set(excl.slice(crB0, crB1));   // (the famous places' and the buildings' tree exclusions are large; the new crowds may stand inside them)
      const hard = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (const e of Lc) { if (fanE.has(e) || bldE.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 1.2, gap: 1.15, excluded: hard, below: 3, above: 8, sit: 0.3, flag: 0.07 };
      const run = (d0, d1, side, o, fc) => { const n = crowdRun(CR, sStart + d0, sStart + d1, side, Object.assign({}, M, o));
        if (n && fc) for (let ii = T.idx(sStart + d0 - 6), k = 0; k < (d1 - d0 + 12) / ds; k++, ii = (ii + 1) % N) if (!fence[side2(side)][ii]) fence[side2(side)][ii] = 1; return n; };
      const BIG = { 'La Source': 1, 'Eau Rouge': 1, 'Raidillon': 1, 'Pouhon': 1, 'Bus Stop': 1 };
      for (const q of T.names) {
        const wgt = FANS[q.n] || 0, sm = sAt(q.d), side = roomSide(sm), d = q.d; if (!wgt) continue;
        const half = 18 + wgt * 12;
        run(d - half, d + half, -side, { rows: Math.min(3, wgt + 1), dens: 0.62, label: 'SPA far ' + q.n }, true);
        if (BIG[q.n]) run(d - half - 24, d + half + 24, side, { first: 2.4 + wgt * 1.2, rows: 2, dens: 0.55, label: 'SPA more ' + q.n });
      }
      run(-300, 210, -1, { rows: 3, gap: 1.0, dens: 0.6, sit: 0, label: 'SPA pit straight' });
      for (const sd of [-1, 1]) run(1420, 2150, sd, { rows: 2, dens: 0.3, clump: 0.85, strip: false, label: 'SPA Kemmel' });   // (no ground strips: under a sparse crowd they read as dark squares)
      for (const sd of [-1, 1]) run(200, L - 250, sd, { rows: 2, dens: 0.06, clump: 0.95, strip: false, label: 'SPA groups' });
      for (const e of CR.circ) exclPush(e.x, e.z, e.r);   // the forest keeps clear of them
    }
    // catch fences (chain link on posts) behind the walls, the tyre walls and wherever the spectators stand; a sponsor banner on them now and then
    const fenceC = new Chunks(256, true), spC = new Chunks(256, true);
    for (const side of [-1, 1]) {
      const fc = fence[side2(side)], bar = side > 0 ? T.br : T.bl; let acc = 0;
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N; if (!fc[i] || !fc[j] || kindAt(i, side) < 0 || kindAt(j, side) < 0) { acc += ds; continue; }
        const e = fc[i] === 2 ? 1.25 : 0.55, Q = (ii, y) => { const o = side * (bar[ii] + e); return [T.px[ii] + T.nx[ii] * o, T.hy[ii] + y, T.pz[ii] + T.nz[ii] * o]; };
        const u0 = acc / 2.5, u1 = (acc + ds) / 2.5, ins = Q(i, 1); ins[0] += T.nx[i] * side * 3; ins[2] += T.nz[i] * side * 3;
        const q0 = Q(i, 0.9); fenceC.get(q0[0], q0[2]).quadO(q0, Q(j, 0.9), Q(j, 4.2), Q(i, 4.2), W1, ins, [[u0, 0], [u1, 0], [u1, 1.3], [u0, 1.3]]);
        const j2 = (i + 2) % N;
        if (i % 13 === 0 && fc[j2] && fc[i] !== 2) {   // a sponsor banner on the chain link, 4 m long (tex.sponsors), read from the road
          const k = Math.floor(crH(i, side, 51) * 8), su = (k % 2) / 2, sv = 1 - Math.floor(k / 2) / 4, pull = (p, ii) => [p[0] - T.nx[ii] * side * 0.06, p[1], p[2] - T.nz[ii] * side * 0.06];
          const a = pull(Q(i, 2.2), i), b = pull(Q(j2, 2.2), j2);
          spC.get(a[0], a[2]).quadO(a, b, pull(Q(j2, 3.15), j2), pull(Q(i, 3.15), i), W1, ins, side > 0 ? [[su + 0.5, sv - 0.25], [su, sv - 0.25], [su, sv], [su + 0.5, sv]] : [[su, sv - 0.25], [su + 0.5, sv - 0.25], [su + 0.5, sv], [su, sv]]);
        }
        if (i % 3 === 0) { const p = Q(i, 0); box(scen.get(p[0], p[2]), p[0], p[1] - 0.2, p[2], 0.1, 4.45, 0.1, T.hd[i], [0.6, 0.61, 0.64]); }
        acc += ds;
      }
    }

    /* ---- the woods: spruce planted in rows in their compartments (mature, young; a gap now and then), felled compartments with a few birches and
       saplings, beech stands; birches and young spruce along the edges of the woods and on the scrub, lone trees on the pastures and in the village.
       Farther than 70 m from the road every other spruce, cheaper and without shadows. The ground under the crowns turns to needles (G.cov) ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const WIND = { value: 0 }; out.dyn.wind = WIND;   // the crowns sway a little, each tree in its own rhythm (the higher up, the more)
    tMat.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = WIND;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
        '#ifdef USE_INSTANCING\nfloat wPh = instanceMatrix[3].x * 0.07 + instanceMatrix[3].z * 0.05;\n#else\nfloat wPh = 0.0;\n#endif\n' +
        'float wK = position.y * position.y * 0.018;\ntransformed.x += wK * sin( uWind * 1.1 + wPh );\ntransformed.z += wK * 0.6 * sin( uWind * 0.83 + wPh * 1.7 );');
    };
    tMat.customProgramCacheKey = () => 'nrTreeWind';
    const tk = [new IChunks(spaTreeGeo(0), tMat, 128), new IChunks(nrTreeGeo(1), tMat, 128), new IChunks(spaTreeGeo(2), tMat, 128)];   // near the road (casting shadows): spruce, beech, birch
    const tf = [new IChunks(spaTreeGeo(1), tMat, 192), new IChunks(nrTreeGeo(3), tMat, 192)];   // farther out: spruce, broadleaf
    let nTrees = 0, nRows = 0;
    {
      const Lt = NRC * NRT, maxT = Math.round(140000 * dens), seen = new Set(), CRW = [0.14, 0.33, 0.2];   // (crown radius / width: spruce, beech, birch)
      const plant = (sp, far, x, z, hgt, wid, c) => {
        if (excluded(x, z)) return false;
        const y = nrGround(x, z) - 0.1, rot = crH(x, z, 88) * TAU;
        if (far) tf[sp === 0 ? 0 : 1].add(x, y, z, rot, wid, hgt, c); else tk[sp].add(x, y, z, rot, wid, hgt, c);
        nrShade(x, z, wid * CRW[sp], sp === 0 ? 1 : 0.8); nTrees++; return true; };
      const nearOk = (x, z, rd, r2) => { if (rd >= 48) return true; const nn = nrNear(x, z); return !(nn.i >= 0 && (nn.dd < 3.2 || (nn.dd < 7 && r2 < 0.4))); };
      for (let tj = 0; tj < G.ntz && nTrees < maxT; tj++) for (let ti = 0; ti < G.ntx && nTrees < maxT; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za + 1.55; zz < za + Lt; zz += 3.1) for (let xx = xa + 1.55; xx < xa + Lt; xx += 3.1) {
          const rd = nrDist(xx, zz); if (rd > 250) continue;
          const cl = nrLC(xx, zz), far = rd > 70, h1 = crH(xx, zz, 81);
          if (cl === 1) {
            const C = comp(xx, zz);
            if (C.kind === 0 || C.kind === 1) {   // a spruce plantation: the lattice point of this spot's row
              const u = xx * C.ca + zz * C.sa, v = -xx * C.sa + zz * C.ca, iu = Math.round(u / C.s), iv = Math.round(v / C.s), key = C.id + ':' + iu + ':' + iv;
              if (seen.has(key)) continue; seen.add(key);
              if (far && ((iu + iv) & 1)) continue;   // (far out: every other one, a bigger crown)
              const hq = crH(iu * 3 + C.id, iv, 82); if (hq < 0.04) continue;   // (a gap in the rows)
              const uu = iu * C.s + (crH(iu, iv + C.id, 83) - 0.5) * 0.5, vv = iv * C.s + (crH(iu + C.id, iv, 84) - 0.5) * 0.5, x = uu * C.ca - vv * C.sa, z = uu * C.sa + vv * C.ca;
              if (nrLC(x, z) !== 1 || comp(x, z) !== C || !nearOk(x, z, rd, hq)) continue;
              const hgt = C.h * (0.88 + hq * 0.24), cv = C.tint * (0.93 + crH(x, z, 85) * 0.14);
              if (plant(0, far, x, z, hgt, hgt * (far ? 0.82 : 0.7), [cv * 0.96, cv, cv * (0.97 + crH(x, z, 86) * 0.08)])) nRows++;
              continue;
            }
            if (C.kind === 2) {   // felled: a few birches and saplings in the bracken
              if (h1 < 0.035 && nearOk(xx, zz, rd, 1)) { const bi = crH(xx, zz, 87) < 0.5, hgt = bi ? 6 + h1 * 120 : 2 + h1 * 60; plant(bi ? 2 : 0, far, xx + (crH(xx, zz, 89) - 0.5) * 2.5, zz, hgt, hgt * (bi ? 0.75 : 0.72), [1, 1, 1]); }
              continue;
            }
            if (h1 < 0.25 && nearOk(xx, zz, rd, h1 * 4)) {   // a beech stand (a spot in four)
              const hgt = (15 + crH(xx, zz, 90) * 8) * (far ? 1.1 : 1), cv = 0.88 + crH(xx, zz, 91) * 0.24;
              plant(1, far, xx + (crH(xx, zz, 92) - 0.5) * 2.6, zz + (crH(xx, zz, 93) - 0.5) * 2.6, hgt, hgt * (0.9 + crH(xx, zz, 94) * 0.25), [cv * 1.02, cv, cv * 0.9]);
            }
            continue;
          }
          if (far) continue;
          const e = cl === 0 ? nrEdge(xx, zz) : 0;
          if (cl === 2 || e > 0) {   // the edge of the woods and the scrub: birches and young spruce
            if (h1 < (cl === 2 ? 0.1 : e * 0.16) && nearOk(xx, zz, rd, h1 * 6)) { const bi = crH(xx, zz, 95) < 0.6, hgt = bi ? 7 + crH(xx, zz, 96) * 9 : 3 + crH(xx, zz, 96) * 6;
              plant(bi ? 2 : 0, false, xx + (crH(xx, zz, 97) - 0.5) * 2.5, zz + (crH(xx, zz, 98) - 0.5) * 2.5, hgt, hgt * (bi ? 0.75 : 0.72), [1, 1, 1]); }
            continue;
          }
          if (h1 < (cl === 3 ? 0.012 : 0.0035) && nearOk(xx, zz, rd, 1)) {   // lone trees: an oak or a beech on the pasture, the gardens' trees
            const hgt = 11 + crH(xx, zz, 99) * 7; plant(1, false, xx, zz, hgt, hgt * 1.15, [1.02, 1, 0.9]); }
        }
      }
    }
    for (const t of tk) t.addTo(root, true);
    for (const t of tf) t.addTo(root, false);

    /* ---- terrain tiles and the grass verges out past the barriers (256 m chunks), coloured now; mown in stripes along the track (as at the
       Red Bull Ring and Suzuka): MOW_W m bands on the verge inside the barrier, light and dark in turn from 1.2 m past the edge, and MOW_B dark
       bands on the open lawns out past the barrier from 3.5 m behind it (the terrain's own colour and grass, fading out 20-36 m out, 5 cm over
       the ground): not in the woods, the scrub or by the villages, under the stands and buildings, by the brook, where another leg of the track
       is nearer, where the inside of a bend would fold them, nor on the pit lane's side ---- */
    let nTiles = 0;
    {
      const grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let k = 0; k < tiles.length; k += 3) { const m = new THREE.Mesh(nrTileGeo(tiles[k], tiles[k + 1], tiles[k + 2] === 1 ? 1 : 4), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); nTiles++; }
      const vA = [0.93, 1.1, 0.9], vB = [0.82, 0.97, 0.8], MOW_D = vB.map((v, k) => 1 - v / vA[k]);   // the mower's stripes: light, dark (and how much darker)
      const MOW_W = 3, MOW_N = 6, MOW_B = 5, MOW_O = 3.5, bandC = (b) => (b % 2 ? vA : vB), PD = def.pit, pitSd = PD ? Math.sign(PD[0]) : 0;
      const own = (x, z, i) => { const n = nrNear(x, z), d = Math.abs(n.i - i); return n.i >= 0 && Math.min(d, N - d) < 30; };
      const mowPt = (i, side, o) => { const p = Pt(i, side * o, 0), x = p[0], z = p[2]; if (excluded(x, z) || inBrook(x, z, 4) || !own(x, z, i)) return null;
        const f = (1 - nrLCf(x, z, 1)) * (1 - nrLCf(x, z, 2)) * (1 - nrLCf(x, z, 3)) * sstep(36, 20, o - (side > 0 ? T.br[i] : T.bl[i])), c = nrGCol(x, z);
        return f < 0.05 ? null : { p: [x, nrGround(x, z) + 0.05, z], c: c.map((v, k) => v * (1 - MOW_D[k] * f)) }; };
      for (let c0 = 0; c0 < N; c0 += CH) {
        const gv = new RB(true), pv = [-1, -1], pw = [null, null], pm = [new Array(MOW_B).fill(-1), new Array(MOW_B).fill(-1)];
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
          const i = ii % N;
          for (const side of [-1, 1]) {
            const si = side2(side), bar = side > 0 ? T.br[i] : T.bl[i], fold = side * T.k[i] > 0 ? 0.7 / Math.abs(T.k[i]) : 1e9;
            const pit = side === pitSd && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25));
            for (let b = 0; b < MOW_B; b++) {   // the lawns out past the barrier
              const oa = bar + 3.5 + b * 2 * MOW_O, ob = oa + MOW_O, A = !pit && ob < fold ? mowPt(i, side, oa) : null, B = A ? mowPt(i, side, ob) : null;
              if (!B) { pm[si][b] = -1; continue; }
              const q = side > 0 ? [A, B] : [B, A], r = gv.row(q.map(e => e.p), q.map(e => e.c), q.map(e => [e.p[0] / 14, -e.p[2] / 14]));
              if (pm[si][b] >= 0) gv.link(pm[si][b], r, 0, 1); pm[si][b] = r;
            }
            // the verge inside the barrier: its cross-section with the bands' edges on it (each edge twice: a sharp change of colour)
            const vr = spaVerge(i, side), [o1, h1] = vr[1], [o2, h2] = vr[2], band = [], bc = [];
            for (let b = 1; b <= MOW_N; b++) { const o = Math.min(o1 + b * MOW_W, o2), h = h1 + (h2 - h1) * (o - o1) / Math.max(1e-6, o2 - o1); band.push([o, h], [o, h]); bc.push(bandC(b), bandC(b + 1)); }
            const bo = Math.max(1, Math.min(MOW_N + 1, Math.ceil((o2 - o1) / MOW_W - 1e-6)));   // (the band the verge ends in)
            const pr = [vr[0], vr[1], ...band, vr[2], vr[3], vr[4]], pts = pr.map(([o, h]) => Pt(i, side * o, h)), nL = pr.length;
            const g3 = nrGCol(pts[nL - 2][0], pts[nL - 2][2]), g4 = nrGCol(pts[nL - 1][0], pts[nL - 1][2]), vg = bandC(bo);
            const cols = [vA, bandC(1), ...bc, vg, [lerp(vg[0], g3[0], 0.5), lerp(vg[1], g3[1], 0.5), lerp(vg[2], g3[2], 0.5)], g4];
            const ordered = side > 0 ? { p: pts, c: cols } : { p: pts.slice().reverse(), c: cols.slice().reverse() };   // rows run left -> right
            const rv = gv.row(ordered.p, ordered.c, ordered.p.map(p => [p[0] / 14, -p[2] / 14]));   // (the terrain tiles' grass scale: no seam)
            const ow = side > 0 ? pr.map(e => e[0]) : pr.map(e => e[0]).reverse(), qw = pw[si];
            if (pv[si] >= 0) for (let k = 0; k < nL - 1; k++) if (Math.abs(ow[k + 1] - ow[k]) > 1e-3 || Math.abs(qw[k + 1] - qw[k]) > 1e-3) gv.link(pv[si], rv, k, k + 1);   // (not the bands of no width)
            pv[si] = rv; pw[si] = ow;
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
    numC.addTo(root, new THREE.MeshLambertMaterial({ map: numTex }), false, true);
    fenceC.addTo(root, fMat, false, true); spC.addTo(root, new THREE.MeshLambertMaterial({ map: tex.sponsors }), false, true);
    crowdFinish(CR, root, out);
    out.stats = { tiles: nTiles, trees: nTrees, rows: nRows, posts: nPosts, buildings: nBld, stands: nStands, fans: nFans };   // (read by the tests)
    return out;
  }

  World.ext.spa = (scene, tex, opts) => buildSpa(scene, tex, opts);
})();
