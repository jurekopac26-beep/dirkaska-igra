/* =========================================================================
   WORLD — Zandvoort, Nizozemska (theme 'zandvoort'): the circuit in the dunes by the North Sea north of Zandvoort (Noord-Holland), its own
   parts on the shared builder of js/world-rbring.js (World.ext.rbring), loaded before it (index.html). Its look (RB_LOOK.zandvoort) goes on
   API.rbLook; World.ext.zandvoort builds it with World.ext.rbring. Plan: docs/nove-proge-1-0.md (N3), the track: docs/proge/zandvoort.md.
   Its own parts (the builder's hooks LK.woods, LK.extra, LK.pad, LK.lane, LK.fl, LK.colMod, LK.verge): the dunes round the circuit in
   their colours (marram grass grey-green and straw, the darker scrub, the sand blown out of them: def.sk.sand, OSM natural=sand), clumps
   of marram grass by the road and the sea buckthorn's grey-green bushes in the dune valleys; the pines, birches and poplars of the dune
   woods (js/world-harju.js's hjTreeGeo, js/world.js's nrTreeGeo); the ponds in the dune valleys (def.sk.pond: OSM natural=water) in
   their beds, reeds round them; the ground under the whole pit lane level with it; the two banked corners (def.bank: the shared builder
   tilts the road, its kerbs, verges and barriers); the buildings by the circuit (def.sk.bld: OpenStreetMap); the Dutch flag and orange
   ones among the fans' flags, the grandstands full of orange. Only place names on its boards (no names of the circuit, its corners'
   people, races or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { GB, IChunks, NRC, NR_A64, TAU, addShore, box, clamp, lerp, mergeBands, nrDist, nrGH, nrGround, nrLC, nrLCf, nrNear, rng, shoreBand, sstep, tuftGeo, tuftWindMat,
    waterMat, waterline } = API;
  // the text boards: place names (the town, the province, the country, the region of the dunes, the sea, the villages and the town inland),
  // the grandstands' names (def.stands) and the start line's
  const ZV_BAN = [['ZANDVOORT', '#e8641a', '#fff', '#fff'], ['NOORD-HOLLAND', '#1d3f6e', '#fff', '#f7a600'], ['START · FINISH', '#16181c', '#fff', '#f36c21'], ['NEDERLAND', '#f36c21', '#fff', '#fff'],
    ['KENNEMERLAND', '#1d3f6e', '#fff', '#f36c21'], ['NOORDZEE', '#245a7a', '#fff', '#fff'], ['BLOEMENDAAL', '#245a3a', '#fff', '#f36c21'], ['HAARLEM', '#b8102c', '#fff', '#fff']];
  const ZV_AT = { num: 0, brake: 0, ban: 3, rbr: 3, spielberg: 4 };   // atlas cells: the braking boards (no turn numbers), the banners
  const ZV_SHIRTS = [[1, 0.47, 0.08], [0.97, 0.55, 0.12], [0.95, 0.4, 0.06], [0.95, 0.95, 0.93], [0.12, 0.18, 0.36], [0.14, 0.14, 0.16], [1, 0.5, 0.1], [0.4, 0.42, 0.46],
    [0.78, 0.1, 0.16], [0.13, 0.28, 0.55], [0.92, 0.92, 0.9], [0.98, 0.62, 0.2]];   // the fans' shirts: orange above all, white, navy, black and grey, the flag's red and blue
  const ZV_SANDC = [2.3, 1.56, 2.7];   // (the dunes' sand over the grass picture: pale, not green, so the grass shader leaves it)
  const ZV_DEPTH = 1.8;   // (a pond's bed: this much under the ground round it)
  let SAND = () => 0, POND = null;   // (the sand's mask and the ponds' of the build under way: colMod makes them, the pad, the verges and LK.extra use them)

  // the sand in the dunes (def.sk.sand: OSM outlines) as a soft mask, 4 m cells: 0 outside .. 1 inside, a cell's blur at the edges
  function zvSand(def) {
    const polys = (def.sk && def.sk.sand) || []; if (!polys.length) return () => 0;
    let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
    for (const p of polys) for (let k = 0; k < p.length; k += 2) { x0 = Math.min(x0, p[k]); x1 = Math.max(x1, p[k]); z0 = Math.min(z0, p[k + 1]); z1 = Math.max(z1, p[k + 1]); }
    const C = 4; x0 -= 2 * C; z0 -= 2 * C; const nx = Math.ceil((x1 - x0) / C) + 3, nz = Math.ceil((z1 - z0) / C) + 3, M = new Float32Array(nx * nz);
    for (let j = 0; j < nz; j++) {   // (scanlines: each outline even-odd across the row through the cells' centres)
      const z = z0 + (j + 0.5) * C;
      for (const p of polys) {
        const xs = []; for (let k = 0, n = p.length; k < n; k += 2) { const ax = p[k], az = p[k + 1], bx = p[(k + 2) % n], bz = p[(k + 3) % n]; if ((az > z) !== (bz > z)) xs.push(ax + (z - az) * (bx - ax) / (bz - az)); }
        xs.sort((a, b) => a - b);
        for (let q = 0; q + 1 < xs.length; q += 2) for (let i = Math.max(0, Math.ceil((xs[q] - x0) / C - 0.5)); i < nx && x0 + (i + 0.5) * C < xs[q + 1]; i++) M[j * nx + i] = 1;
      }
    }
    const B = new Float32Array(nx * nz);   // (a 3 x 3 blur: soft edges between the sand and the grass)
    for (let j = 1; j < nz - 1; j++) for (let i = 1; i < nx - 1; i++) { let s = 0; for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) s += M[(j + b) * nx + i + a]; B[j * nx + i] = s / 9; }
    return (x, z) => { const fx = (x - x0) / C - 0.5, fz = (z - z0) / C - 0.5, i = Math.floor(fx), j = Math.floor(fz); if (i < 0 || j < 0 || i >= nx - 1 || j >= nz - 1) return 0;
      const u = fx - i, v = fz - j, k = j * nx + i; return (B[k] * (1 - u) + B[k + 1] * u) * (1 - v) + (B[k + nx] * (1 - u) + B[k + nx + 1] * u) * v; };
  }

  // the ponds (def.sk.pond: 0 / 1 on 5 m cells, run-length coded as the land cover is, two classes of 32 runs): the mask M, and f(x, z), its
  // soft version (blurred twice over 3 x 3 cells: 0 from 10 m out of a pond .. 1 inside it), the pad's and the ground's colours
  function zvPond(def) {
    const P = def.sk && def.sk.pond; if (!P) return null;
    const { x0, z0, nx, nz, cell: C } = P, n = nx * nz, M = new Uint8Array(n);
    for (let p = 0, k = 0; k < n && p < P.rle.length;) { const v = NR_A64.indexOf(P.rle[p++]); let r = (v & 31) + 1; if ((v & 31) === 31) { let e; do { e = NR_A64.indexOf(P.rle[p++]); r += e; } while (e === 63); } M.fill(v >> 5, k, Math.min(n, k + r)); k += r; }
    let B = Float32Array.from(M);
    for (let it = 0; it < 2; it++) { const O = new Float32Array(n);
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { let s = 0; for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const I = i + a, J = j + b; if (I >= 0 && J >= 0 && I < nx && J < nz) s += B[J * nx + I]; } O[j * nx + i] = s / 9; }
      B = O; }
    const f = (x, z) => { const fx = (x - x0) / C - 0.5, fz = (z - z0) / C - 0.5, i = Math.floor(fx), j = Math.floor(fz); if (i < 0 || j < 0 || i >= nx - 1 || j >= nz - 1) return 0;
      const u = fx - i, v = fz - j, k = j * nx + i; return (B[k] * (1 - u) + B[k + 1] * u) * (1 - v) + (B[k + nx] * (1 - u) + B[k + nx + 1] * u) * v; };
    return { M, f, x0, z0, nx, nz, C };
  }

  // the trees (LK.woods, on the builder's land cover: 0 the circuit's lawns, 1 the dune woods, 2 the dunes, 3 built-up): 0 Scots pine, 1 silver
  // birch (js/world-harju.js's), 2 a broadleaf, the white poplars and oaks of the dune valleys (js/world.js's beech); 3-5 the plainer ones far
  // from the road. The woods low (the wind off the sea), pines in stands of their own (the noise), birches at their edges; a low pine or
  // birch seeded on the dunes here and there, lone trees by the buildings
  const ZV_WOODS = {
    n: 3, geo: (k) => { const sp = k % 3, far = k >= 3; return sp === 2 ? API.nrTreeGeo(far ? 3 : 1) : API.hjTreeGeo(sp === 0 ? 1 : 2, far); },
    cr: [0.3, 0.3, 0.33], p: [0.004, 0.85, 0.01, 0.03],
    pick(cl, R, far, x, z) {
      const P = API.NR, r = R(), r2 = R(); let sp, h;
      if (cl === 1) { const blk = P.n1(x * 0.7 + 260, z * 0.7 - 410); sp = r < 0.16 ? 1 : blk < 0.5 ? 0 : 2; h = sp === 0 ? 10 + r2 * 6 : sp === 1 ? 8 + r2 * 5 : 9 + r2 * 6; }
      else if (cl === 2) { sp = r < 0.6 ? 0 : 1; h = 3 + r2 * 4; }
      else { sp = r < 0.4 ? 2 : r < 0.75 ? 1 : 0; h = 7 + r2 * 6; }
      if (far) h *= 1.08;
      return [sp, h, h * (sp === 0 ? 0.62 + r2 * 0.22 : sp === 1 ? 0.58 + r2 * 0.2 : 0.9 + r2 * 0.25)];
    },
  };

  // LK.pad (the builder's ground round the circuit, before it is built): the ground under the whole pit lane level with it (the builder levels
  // it by the pit building), easing out 10 m past it; the ponds' beds ZV_DEPTH under the ground round them (their soft mask), not inside the
  // barriers, fully only 5 m past them
  function zvPad(pad0) {
    const T = API.T, NRN = API.NRN, pd = T.def.pit, sd = pd && pd[0] < 0 ? -1 : 1;
    return (x, z, h) => {   // (NRN: the nearest road sample of the point being built, its offset and its distance past the barriers: js/world.js nrH)
      h = pad0(x, z, h);
      if (pd && NRN.i >= 0) {
        const s = NRN.i * T.ds, p = T.pitAt(s), q = NRN.lat * sd;
        if (p && q > 0) { const f = sstep(p.o + 14, p.o + 4, q); if (f > 0) h = lerp(h, T.elevAt(API.wrapS(s)).y - 0.14, f); }
      }
      const PO = POND; if (!PO) return h;
      const f = PO.f(x, z); if (!(f > 0.01)) return h;
      return h - ZV_DEPTH * sstep(0.01, 0.55, f) * sstep(1, 5, NRN.dd);
    };
  }

  // the ponds: each its water flat at its level (a little under the lowest ground round it, 15 m out of it, where the pad leaves the ground as
  // it is), over its cells and two more round them where the ground lies under it (the beds' sides cut the water into its shore); reeds round
  // the shore (js/world.js's clumps of grass, tall, brown-green); nobody standing in the water, no tree in it (the trees keep off the pad's
  // ground anyway)
  function zvPonds({ root, tex, out, exclPush, CR, excluded }, st, reed) {
    const PO = POND; if (!PO) return;
    const { M, nx, nz, x0, z0, C } = PO, n = nx * nz, lab = new Int32Array(n).fill(-1), comps = [], X = (i) => x0 + (i + 0.5) * C, Z = (j) => z0 + (j + 0.5) * C;
    for (let s = 0; s < n; s++) {   // (the ponds: the mask's 4-connected parts)
      if (!M[s] || lab[s] >= 0) continue;
      const id = comps.length, cells = [s]; lab[s] = id;
      for (let q = 0; q < cells.length; q++) { const c = cells[q], i = c % nx, j = (c - i) / nx;
        for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const I = i + a, J = j + b; if (I < 0 || J < 0 || I >= nx || J >= nz) continue; const k = J * nx + I; if (M[k] && lab[k] < 0) { lab[k] = id; cells.push(k); } } }
      comps.push(cells);
    }
    const gw = new GB(true), wc = [1, 1, 1], RR = rng(5641), near = new Uint8Array(n), own = new Int32Array(n).fill(-1), inR = new Uint8Array(n), bands = [], G = API.NR.G;
    const NX = nx + 1, CH = new Float32Array(NX * (nz + 1)).fill(NaN), gC = (K) => { let v = CH[K]; if (v !== v) { const I = K % NX; v = CH[K] = nrGround(x0 + I * C, z0 + (K - I) / NX * C); } return v; };   // (the ground at the cells' corners)
    const inner = (K) => { const I = K % NX, J = (K - I) / NX; return I >= 1 && J >= 1 && I < nx && J < nz && inR[(J - 1) * nx + I - 1] && inR[(J - 1) * nx + I] && inR[J * nx + I - 1] && inR[J * nx + I]; };
    const hp = [], hpPush = (e) => { hp.push(e); for (let i = hp.length - 1; i > 0;) { const p = (i - 1) >> 1; if (hp[p][0] <= hp[i][0]) break; [hp[p], hp[i]] = [hp[i], hp[p]]; i = p; } },
      hpPop = () => { const t = hp[0], e = hp.pop(); if (hp.length) { hp[0] = e; for (let i = 0; ;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < hp.length && hp[l][0] < hp[m][0]) m = l; if (r < hp.length && hp[r][0] < hp[m][0]) m = r; if (m === i) break; [hp[m], hp[i]] = [hp[i], hp[m]]; i = m; } } return t; };
    comps.forEach((cells, pid) => {
      const D = new Map();   // (the cells round the pond, 1..3 out of it: their distance, the Chebyshev one)
      for (const c of cells) { const i = c % nx, j = (c - i) / nx;
        for (let b = -3; b <= 3; b++) for (let a = -3; a <= 3; a++) { const I = i + a, J = j + b; if (I < 0 || J < 0 || I >= nx || J >= nz) continue; const k = J * nx + I; if (M[k]) continue;
          const d = Math.max(Math.abs(a), Math.abs(b)), e = D.get(k); if (e == null || d < e) D.set(k, d); } }
      let lo = 1e9, bed = 1e9;
      for (const [k, d] of D) if (d === 3) { const i = k % nx, j = (k - i) / nx; lo = Math.min(lo, nrGround(X(i), Z(j))); }
      for (const c of cells) { const i = c % nx, j = (c - i) / nx; bed = Math.min(bed, nrGround(X(i), Z(j))); }
      if (!(lo < 1e8)) return;
      // its level: under the ground round it, over its bed, and under the lowest pass out of R (its cells and two round them: a minimax
      // flood over their corners from the lowest corner of its bed), so its water never ends over lower ground at the edge of what is drawn
      // (a pond on the slope of a deeper one's hollow, the ridge between them carved by the pad: lower, or dry if its bed lies over the
      // pass); under water the corners the flood reaches below its level, its water over the cells round them (one pond's only)
      const R = [...cells, ...[...D].filter(([, d]) => d <= 2).map(([k]) => k)];
      for (const k of R) inR[k] = 1;
      let s0 = -1;
      for (const c of cells) { const i = c % nx, j = (c - i) / nx; for (const K of [j * NX + i, j * NX + i + 1, (j + 1) * NX + i, (j + 1) * NX + i + 1]) if (s0 < 0 || gC(K) < gC(s0)) s0 = K; }
      const cost = new Map([[s0, gC(s0)]]); let pass = 1e9; hp.length = 0; hpPush([gC(s0), s0]);
      while (hp.length) {
        const [cv, K] = hpPop(); if (cv > cost.get(K)) continue;
        if (!inner(K)) { pass = cv; break; }
        for (const N of [K - 1, K + 1, K - NX, K + NX]) { const nc = Math.max(cv, gC(N)), e = cost.get(N); if (e == null || nc < e) { cost.set(N, nc); hpPush([nc, N]); } }
      }
      for (const k of R) inR[k] = 0;
      const lv = Math.min(Math.max(lo - 0.15, bed + 0.3), pass - 0.03), wet = [];
      for (const [K, cv] of cost) if (cv <= lv) { const I = K % NX, J = (K - I) / NX; for (let b = -1; b <= 0; b++) for (let a = -1; a <= 0; a++) { const k = (J + b) * nx + I + a; if (!near[k]) { near[k] = 1; own[k] = pid; wet.push(k); } } }
      if (!wet.length) return;   // (dry: a hollow)
      for (const k of wet) {
        const i = k % nx, j = (k - i) / nx, xa = x0 + i * C, za = z0 + j * C, xb = xa + C, zb = za + C;
        const Q = (x, z) => [x, lv, z], uv = (x, z) => [x / 16, -z / 16];
        gw.quadUp(Q(xa, zb), Q(xb, zb), Q(xb, za), Q(xa, za), [wc, wc, wc, wc], [uv(xa, zb), uv(xb, zb), uv(xb, za), uv(xa, za)]);
        st.water += C * C;
        if (nrDist(X(i), Z(j)) < 60) CR.avoid(X(i), Z(j), C * 0.75);   // (nobody standing in it: only by the road are there any)
      }
      { // its shore band (the shallows, a little foam lapping at the waterline: js/world.js's shoreBand over the terrain's own triangles at its
        // level), only over the cells of its water: none past it, none over a neighbour's
        let ia = 1e9, ib = -1e9, ja = 1e9, jb = -1e9;
        for (const k of wet) { const i = k % nx, j = (k - i) / nx; ia = Math.min(ia, i); ib = Math.max(ib, i); ja = Math.min(ja, j); jb = Math.max(jb, j); }
        const gi0 = clamp(Math.floor((x0 + (ia - 1) * C - G.x0) / NRC), 2, G.nx - 3), gi1 = clamp(Math.ceil((x0 + (ib + 2) * C - G.x0) / NRC), 2, G.nx - 3),
          gj0 = clamp(Math.floor((z0 + (ja - 1) * C - G.z0) / NRC), 2, G.nz - 3), gj1 = clamp(Math.ceil((z0 + (jb + 2) * C - G.z0) / NRC), 2, G.nz - 3);
        const wl = waterline(nrGH, G.x0, G.z0, NRC, gi0 - 2, gi1 + 2, gj0 - 2, gj1 + 2, lv);
        const sd = (x, z) => { const i = Math.floor((x - x0) / C), j = Math.floor((z - z0) / C); return i >= 0 && j >= 0 && i < nx && j < nz && own[j * nx + i] === pid ? wl(x, z) : -10; };
        if (gi1 > gi0 && gj1 > gj0) bands.push(shoreBand(G.x0 + gi0 * NRC, G.z0 + gj0 * NRC, G.x0 + gi1 * NRC, G.z0 + gj1 * NRC, lv + 0.015, sd, 16));
      }
      for (const k of R) {   // reeds along the shore: where the ground is within 0.3 m of the water, a clump or two in a cell, in stands with gaps
        const i = k % nx, j = (k - i) / nx;
        for (let q = 0; q < 2; q++) {
          const x = x0 + (i + RR()) * C, z = z0 + (j + RR()) * C, y = nrGround(x, z);
          if (Math.abs(y - lv) > 0.3 || API.NR.n2(x * 0.5 + 70, z * 0.5) < 0.38 || nrDist(x, z) > 160 || excluded(x, z)) continue;
          const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 4) continue;
          const hh = 1.4 + RR() * 0.9, cv = 0.86 + RR() * 0.2;
          reed.add(x, Math.max(y, lv) - 0.15, z, RR() * TAU, hh * (0.75 + RR() * 0.3), hh, [0.6 * cv, 0.62 * cv, 0.36 * cv]); st.reeds++;
        }
      }
      st.ponds++;
    });
    if (!gw.empty) {
      const WO = { len: 0.7, amp: 0.35, refl: 0.4, land: 0.8, shal: 0.45, lap: 0.3, surf: 0 }, wm = new THREE.Mesh(gw.geometry(), waterMat(tex, Object.assign({ color: 0x3f5a52 }, WO)));   // (dark, the dunes and the reeds mirrored low round it)
      wm.receiveShadow = true; wm.matrixAutoUpdate = false; wm.updateMatrix(); wm.name = 'ponds'; root.add(wm); out.dyn.water = tex.water;   // (World.update: the ripples)
      const sh = addShore(root, mergeBands(bands), wm.material, WO); if (sh) sh.name = 'pondShores';   // (all the ponds' bands in one draw)
    }
    st.water = Math.round(st.water);
    for (let k = 0; k < n; k += 3) if (near[k]) { const i = k % nx, j = (k - i) / nx; exclPush(X(i), Z(j), C); }   // (no bush in the water)
  }

  // the dunes by the road: clumps of marram grass on them, from 3 m past the barriers to 30 m out (in drifts: the noise; not on the bare sand
  // of a blow-out, nor in the ponds); the sea buckthorn's bushes (js/world.js's beech, sunk into the ground, wider than tall, grey-green) in
  // the dune valleys, in thickets with gaps, from 12 m past the barriers to 140 m out; the trees and the crowds keep clear of them
  function zvDunes({ root, exclPush, excluded, CR }, st, tu) {
    const T = API.T, P = API.NR, R = rng(5647), PO = POND, bush = new IChunks(API.nrTreeGeo(1), new THREE.MeshLambertMaterial({ vertexColors: true }), 512);
    let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
    for (let i = 0; i < T.N; i++) { x0 = Math.min(x0, T.px[i]); x1 = Math.max(x1, T.px[i]); z0 = Math.min(z0, T.pz[i]); z1 = Math.max(z1, T.pz[i]); }
    const dune = (x, z) => nrLC(x, z) === 2 && !(PO && PO.f(x, z) > 0.05) && SAND(x, z) < 0.5;
    for (let z = z0 - 150; z < z1 + 150; z += 7) for (let x = x0 - 150; x < x1 + 150; x += 7) {   // the bushes
      const bx = x + (R() - 0.5) * 6, bz = z + (R() - 0.5) * 6, rr = R(), th = P.n1(bx * 0.9 + 330, bz * 0.9 - 120);
      if (th < 0.52 || rr > sstep(0.52, 0.72, th) * 0.8 || !dune(bx, bz)) continue;
      const q = nrNear(bx, bz); if (q.i < 0 || q.dd < 12 || nrDist(bx, bz) > 140 || excluded(bx, bz) || P.pad(bx, bz, 0) !== 0) continue;
      const h = 1.8 + R() * 1.6, w = h * (1.3 + R() * 0.5), cv = 0.9 + R() * 0.2, y = nrGround(bx, bz);
      bush.add(bx, y - h * 0.32, bz, R() * TAU, w, h, [1.42 * cv, 1.02 * cv, 1.7 * cv]);
      exclPush(bx, bz, w * 0.4); CR.avoid(bx, bz, w * 0.5); st.bushes++;
    }
    bush.addTo(root, false);
    for (let z = z0 - 40; z < z1 + 40; z += 5) for (let x = x0 - 40; x < x1 + 40; x += 5) {   // the marram grass
      const tx = x + (R() - 0.5) * 4.6, tz = z + (R() - 0.5) * 4.6, dr = P.n2(tx * 0.35 - 80, tz * 0.35 + 210);
      if (dr < 0.42 || R() > sstep(0.42, 0.64, dr) * 0.7) continue;
      const q = nrNear(tx, tz); if (q.i < 0 || q.dd < 3 || q.dd > 30 || !dune(tx, tz) || excluded(tx, tz) || P.pad(tx, tz, 0) !== 0) continue;
      const s = 0.8 + R() * 0.5, dry = P.n3(tx * 0.6 + 40, tz * 0.6), cv = 0.92 + R() * 0.16;
      tu.add(tx, nrGround(tx, tz) - 0.05, tz, R() * TAU, s * (1 + R() * 0.3), s * (0.85 + R() * 0.25), [lerp(0.66, 0.84, dry) * cv, lerp(0.72, 0.78, dry) * cv, lerp(0.5, 0.52, dry) * cv]); st.marram++;
    }
  }

  // LK.extra: the ponds, the dunes' grass and bushes, the buildings by the circuit (OSM outlines as boxes: red-brown brick, white render, grey
  // cladding on the big halls; dark tiles, orange pantiles, flat grey roofs); before the crowds and the trees, which keep clear of them
  function zvExtra(o) {
    const { root, scen, exclPush, CR, out } = o, sk = API.T.def.sk || {}, R = rng(5653), st = { ponds: 0, water: 0, reeds: 0, bushes: 0, marram: 0, buildings: 0 };
    const tm = tuftWindMat(out.dyn.wind || (out.dyn.wind = { value: 0 })), tu = new IChunks(tuftGeo(false), tm, 512);   // (one material, the clumps of both in big chunks: a few draws)
    zvPonds(o, st, tu);
    zvDunes(o, st, tu);
    tu.addTo(root, false);
    const b6 = sk.bld || [], WALL = [[0.56, 0.28, 0.2], [0.92, 0.91, 0.87], [0.48, 0.24, 0.18], [0.72, 0.73, 0.74]], ROOF = [[0.18, 0.18, 0.2], [0.62, 0.3, 0.16], [0.36, 0.37, 0.4]];
    for (let k = 0; k < b6.length; k += 6) {
      const [x, z, L, W, deg, h] = b6.slice(k, k + 6), rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot);
      let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2));
      const wc = h > 6 ? WALL[3] : WALL[Math.floor(R() * 3)], rc = ROOF[h > 6 ? 2 : Math.floor(R() * 2)];
      box(scen.get(x, z), x, y - 0.4, z, L, h + 0.4, W, rot, wc, rc, true);
      exclPush(x, z, Math.hypot(L, W) / 2 + 2); CR.avoid(x, z, Math.hypot(L, W) / 2 + 1); st.buildings++;
    }
    return st;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    zandvoort: { ban: ZV_BAN, at: ZV_AT, nums: 0, shirts: ZV_SHIRTS, smoke: false, camps: 0, seC: [1.1, 1.04, 0.9], gravel: true, noVid: true,
      pitBox: [0, 186, 1], mow: 0.7,   // (the pit building on the right of the straight; fainter mowing stripes)
      woods: ZV_WOODS, extra: zvExtra, pad: zvPad, lane: true, ck: 2,   // (ck: chunks twice as big: from the dunes much of the circuit is in view)
      flags: { stand: [{ nl: 0.45, or: 0.45, tm: 0.1 }, { nl: 0.5, or: 0.3, tm: 0.1, rb: 0.1 }], ga: { nl: 0.4, or: 0.5, tm: 0.1 }, camp: { nl: 0.5, or: 0.5 }, pole: 'nl', podium: 'nl' },   // (FL.nl, FL.or: the builder's own)
      vid: [], poles: [-100, 100, -1], runoff: ['ZANDVOORT', 'NOORD-HOLLAND', 'NEDERLAND'], straight: [-150, 120, -1],
      farm: { wall: [0.56, 0.28, 0.2], roof: [0.2, 0.2, 0.22], end: [0.54, 0.27, 0.19], barn: [0.3, 0.3, 0.3], barnRoof: [0.62, 0.3, 0.16], barnEnd: [0.29, 0.29, 0.29] },   // a brick house under dark tiles, a dark barn under orange pantiles
      tvSkip: [1, 3, 4, 6, 7, 8, 10, 11], recov: [0, 9], photo: [0, 2, 5, 12], jets: [[0.8, 0.1, 0.15], [0.97, 0.97, 0.97], [0.1, 0.25, 0.6]],   // (TV towers at the hairpin, the banked left, the right into the valley, the chicane, the last corner)
      colMod: (P) => {   // the dunes at the end of the summer: marram grass grey-green and straw, the scrub darker, sand blown out of them; the circuit's lawns
        const sand = SAND = zvSand(API.T.def); POND = zvPond(API.T.def);
        const PO = POND;
        return (x, z, c, dd) => {
          const n = P.n5(x * 0.55 + 700, z * 0.55), m = P.n3(x * 1.6 + 300, z * 1.6), k = 0.94 + (n - 0.5) * 0.16 + (m - 0.5) * 0.1;
          c[0] *= k; c[1] *= k; c[2] *= k * 0.97;
          { const g0 = nrLCf(x, z, 0) * sstep(5, 18, dd == null ? 99 : dd);   // (the lawns round the circuit: mown grass, not the farmland of the open land elsewhere)
            if (g0 > 0) { c[0] = lerp(c[0], 0.98 * k, g0); c[1] = lerp(c[1], 1.03 * k, g0); c[2] = lerp(c[2], 0.9 * k, g0); } }
          const hf = nrLCf(x, z, 2); let bo = 0;
          if (hf > 0) {   // the dunes: marram grass grey-green, straw where it is dry, the scrub of sea buckthorn and creeping willow darker; blow-outs of sand
            const dry = sstep(0.38, 0.7, P.n1(x * 0.7 + 40, z * 0.7 - 60)), sc = sstep(0.55, 0.78, P.n2(x * 0.9 - 130, z * 0.9 + 70)), v = 0.94 + 0.12 * m;
            let r = lerp(1.42, 1.76, dry), g = lerp(1.03, 1.08, dry), b = lerp(1.62, 1.58, dry);   // (over the olive grass picture: grey-green, straw)
            r = lerp(r, 0.9, sc * 0.75); g = lerp(g, 0.72, sc * 0.75); b = lerp(b, 1.06, sc * 0.75);
            c[0] = lerp(c[0], r * v, hf * 0.85); c[1] = lerp(c[1], g * v, hf * 0.85); c[2] = lerp(c[2], b * v, hf * 0.85);
            bo = sstep(0.7, 0.82, P.n4(x * 0.42 + 900, z * 0.42 - 300)) * hf * 0.85;
          }
          const sa = Math.max(sand(x, z), bo);
          if (sa > 0) { const v = 0.95 + 0.1 * n; c[0] = lerp(c[0], ZV_SANDC[0] * v, sa); c[1] = lerp(c[1], ZV_SANDC[1] * v, sa); c[2] = lerp(c[2], ZV_SANDC[2] * v, sa); }   // the sand
          if (PO) { const f = PO.f(x, z); if (f > 0.02) { const e = sstep(0.02, 0.3, f) * 0.75; c[0] = lerp(c[0], 0.62, e); c[1] = lerp(c[1], 0.76, e); c[2] = lerp(c[2], 0.44, e); } }   // (the wet ground round a pond, its reeds' green)
        };
      },
      verge: (cols, pr, nb, i, side) => {   // the verges inside the barriers sandy where OSM has sand there
        const T = API.T;
        for (let k = 0; k < pr.length; k++) { const o = side * pr[k][0], sa = SAND(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o); if (!(sa > 0)) continue;
          const c = cols[k]; cols[k] = [lerp(c[0], ZV_SANDC[0], sa), lerp(c[1], ZV_SANDC[1], sa), lerp(c[2], ZV_SANDC[2], sa)]; }
      } },
  });
  World.keep('NR', 'zandvoort');   // (its grids kept between its builds; World.build frees the others')
  World.ext.zandvoort = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
