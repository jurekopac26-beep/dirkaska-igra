/* The ground by the road as the camera behind the car sees it, on the open roads no other file of this kind looks after (Kotor first).
   Nothing of the road, of the driving or of the terrain's heights changes: only what stands on the ground. Each road's own, from its own
   description (docs/proge/<id>.md), with numbers of its own (rng(seed) here, none of the build's own drawn), after the road's own build.

   Kotor: the banks under the low walls between the legs of the hairpins (PL_LOOK.kotor.bkCap) were one smooth dark green face from the
   camera above the car; the real slope there is the karst's pale limestone in ribs and ledges with the scrub between them
   (docs/proge/kotor.md: »svetlo sivi apnenec v rebrih in ploščah«). So ledges of that limestone lie along the bank, in rows down it, in
   the scenery's own chunks (no draw call more), and now and then a block at its foot. */
(function () {
  'use strict';
  const API = World.api, PL = API && API.PL_LOOK; if (!PL) return;
  const { TAU, lerp, rng, rock, vary, vrNear, cone, ico } = API;
  const late = [];   // (the looks of the files loaded after this one: chained at the first build)
  let T; API.sync.push(() => { ({ T } = API); while (late.length) { const [id, fn] = late.pop(); chain(id, fn); } });

  const chain = (id, fn) => { const L = PL[id]; if (!L) return; const base = L.extra;
    L.extra = function (ctx) { if (base) base.call(this, ctx);
      try { fn(L, ctx, (ctx.out.stats = ctx.out.stats || {}).robBt = {}); } catch (e) { console.error('realizem-bt (' + id + '):', e); } }; };

  /* the banks as the pass's build lays them (js/world-prelaz.js, »the retaining walls between the legs«): where a lower leg lies close under
     this one and the wall is kept low, [offset, height under the road] of the bank's top and toe on that side, else null */
  function banks(L) {
    const N = T.px.length, cross = T.cross || [], ds = T.ds;
    const xPair = (i, j) => { for (const c of cross) if (Math.abs(i - c.up) * ds < 40 && Math.abs(j - c.lo) * ds < 40) return true; return false; };
    return [-1, 1].map((side) => { const a = new Array(N).fill(null);
      for (let i = 0; i < N; i++) {
        const o0 = (side > 0 ? T.br[i] : T.bl[i]) + 0.42, y = T.hy[i];
        const other = (o) => { const n = vrNear(T.px[i] + T.nx[i] * side * o, T.pz[i] + T.nz[i] * side * o); return n.i >= 0 && Math.abs(n.i - i) * ds > 40 && T.hy[n.i] < y - 4 && !xPair(i, n.i) ? n : null; };
        if (![1, 6, 12, 18].some(d => { const n = other(o0 + d); return n && n.dd < 3; })) continue;
        let oL = -1, hl = 0;
        for (let o = o0; o < o0 + 26; o += 0.5) { const n = other(o); if (n && n.dd < 0.5) { oL = o; hl = T.hy[n.i]; break; } }
        const H = y - hl; if (oL < 0 || H / Math.max(0.5, oL - o0) < 1.2 || !(H + 0.6 > L.bkCap + 1.5)) continue;
        const cw = L.bkCap, of = Math.max(o0, Math.min(o0 + 0.05 * cw, oL - 0.5)), toe = Math.max(of + 0.6, oL - 0.3);
        a[i] = [[of, -cw], [toe, -H - 0.6]]; }
      for (let i = 1; i < N - 1; i++) if (a[i] && !a[i - 1] && !a[i + 1]) a[i] = null;
      return a; });
  }

  const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];   // (in the bank's shade and weathered: darker than the blocks in the open)

  chain('kotor', (L, { scen }, st) => {
    if (!L.bkCap || !T || !T.br) return;
    const R = rng(L.seed + 9311), rc = L.rockCols, bk = banks(L), N = T.px.length; let n = 0, m = 0;
    for (const [si, side] of [[0, -1], [1, 1]]) {
      let run = 0;   // (how far along this bank: the rows' phase, so a ledge runs on over several steps of the road)
      for (let i = 1; i < N - 1; i++) { const b = bk[si][i]; if (!b) { run = 0; continue; } run++;
        const [t, f] = b, Hb = t[1] - f[1], rot = Math.atan2(T.pz[i + 1] - T.pz[i - 1], T.px[i + 1] - T.px[i - 1]);
        const rows = Math.max(1, Math.round(Hb / 3.6));
        for (let k = 0; k < rows; k++) {   // ledges along the bank: each row at its own height, broken where the scrub grows over it
          const r1 = R(), r2 = R(), r3 = R(), r4 = R(); if (r1 < 0.8 || (run + k * 3) % 7 === 0) continue;
          const u = (k + 0.3 + 0.4 * r2) / rows, o = lerp(t[0], f[0], u) - 0.45, yy = T.hy[i] + lerp(t[1], f[1], u);
          const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o, len = 2.6 + r3 * 3.2, hh = 0.4 + r4 * 0.5;
          rock(scen.get(x, z), x, yy + hh * 0.1, z, len, hh, 0.75 + r2 * 0.45, rot + (r1 - 0.9) * 0.6, shade(vary(rc[Math.floor(r3 * rc.length) % rc.length], R, 0.05), 0.74 + r4 * 0.1), R, 0.24, 0.4); n++; }
        if (R() < 0.05) { const s0 = 0.5 + R() * 0.7, o = f[0] - 0.2, x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;   // a block at the bank's foot
          rock(scen.get(x, z), x, T.hy[i] + f[1] + 0.6 + s0 * 0.3, z, s0 * 1.2, s0, s0, R() * TAU, shade(vary(rc[Math.floor(R() * rc.length)], R, 0.07), 0.8), R, 0.28); m++; }
      }
    }
    st.police = n; st.bloki = m;
  });

  /* Ngorongoro (its own builder, js/world-ngorongoro.js, calls this before it closes its scenery chunks): the walls of the crater and its
     floor beside the road were one even field of grass from the camera above the car. docs/proge/ngorongoro.md: »rumenkasto-rjava trava
     sten, slamnata, kjer je suho«, »šopi trave«, »rdeče-rjava vulkanska prst«. So tussocks of straw grass stand in loose groups within
     ~35 m of the road, thicker on the dry lower wall and the floor, and here and there the red-brown soil shows bare between them. */
  World.ext.ngorongoroRob = ({ scen, excluded, onSide, gH, slope, lc, pathD, out }) => {
    try {
      const R = rng(9347), st = (out.stats = out.stats || {}).robBt = {}; let n = 0, m = 0;
      const free = (x, z, r) => vrNear(x, z).dd > r && !excluded(x, z) && pathD(x, z) > 1.5;
      const straw = [[0.6, 0.54, 0.28], [0.55, 0.5, 0.26], [0.64, 0.58, 0.33], [0.49, 0.48, 0.24]], smooth0 = API.ROCK_SMOOTH;
      API.ROCK_SMOOTH = true;   // (rounded: a tussock is a soft mound from above, not a pyramid)
      for (let s = 8; s < T.len - 8; s += 6) for (const side of [-1, 1]) {
        const dry = 0.45 + 0.55 * Math.min(1, s / (T.len * 0.6)), r0 = R(), r1 = R(), r2 = R();   // (drier the lower the road)
        if (r0 > 0.62 * dry) continue;
        const o = 2.6 + Math.pow(r1, 1.4) * 32, [gx, gz] = onSide(s + (r2 - 0.5) * 8, side, o), c = lc(gx, gz); if (c === 1 || c >= 5) continue;   // (not in the forest, not on built ground)
        if (r2 < 0.16 && o > 4 && slope(gx, gz) < 0.5 && free(gx, gz, 3.4)) {   // the bare soil: a low irregular patch on the ground
          const k = 7, rr = 1.1 + R() * 1.5, a0 = R() * TAU, col = vary([0.43, 0.3, 0.21], R, 0.03), rim = [col[0] * 0.9 + 0.06, col[1] * 0.9 + 0.07, col[2] * 0.9 + 0.03];
          const g = scen.get(gx, gz), ctr = [gx, gH(gx, gz) + 0.07, gz], P = [];
          for (let q = 0; q < k; q++) { const a = a0 + q / k * TAU, r = rr * (0.65 + R() * 0.6), x = gx + Math.cos(a) * r, z = gz + Math.sin(a) * r * 0.75; P.push([x, gH(x, z) + 0.05, z]); }
          for (let q = 0; q < k; q++) g.triO(ctr, P[q], P[(q + 1) % k], col, [gx, ctr[1] - 5, gz], rim, rim);
          m++;
        }
        const cnt = 3 + Math.floor(R() * 6 * dry), green = 1 - dry;
        for (let q = 0; q < cnt; q++) {   // the tussocks of one group: low wide cones, paler at the tips
          const x = gx + (R() - 0.5) * 7, z = gz + (R() - 0.5) * 7, h = 0.35 + R() * 0.4, w = 0.45 + R() * 0.55;
          if (!free(x, z, 2.2 + w) || slope(x, z) > 0.9) { R(); R(); continue; }
          const c0 = straw[Math.floor(R() * straw.length)], col = vary([c0[0] - 0.16 * green, c0[1] - 0.06 * green, c0[2] - 0.05 * green], R, 0.03);
          cone(scen.get(x, z), x, gH(x, z) - 0.08, z, w, h, 6, [col[0] * 0.62, col[1] * 0.66, col[2] * 0.6], col, R() * TAU); n++;
        }
      }
      API.ROCK_SMOOTH = smooth0; st.sopi = n; st.prst = m;
    } catch (e) { console.error('realizem-bt (ngorongoro):', e); }
  };
  /* Gudauri: beside the road's gravel the pasture was one smooth face from the camera above the car. docs/proge/gudauri.md: »alpski
     travniki in pašniki, v zaplatah grmovje«, »v strminah pečine in melišča« (the look's own notes in js/world-prelaz.js: mats of
     Caucasian rhododendron and juniper, dark andesite and shale). So low mats of that scrub lie in patches within ~40 m of the road,
     a few mats to a patch, and where the ground falls steep beside the road the shale lies in small fans of stones. */
  chain('gudauri', (L, { scen, excluded, onSide }, st) => {
    const { caGround, caSlope, vrLC } = API; if (!caGround || !caSlope || !vrLC || !T) return;
    const R = rng(L.seed + 9353), rc = L.rockCols, smooth0 = API.ROCK_SMOOTH; let n = 0, m = 0;
    const free = (x, z, r) => vrNear(x, z).dd > r && !excluded(x, z);
    const mats = [[0.2, 0.28, 0.15], [0.17, 0.25, 0.14], [0.24, 0.31, 0.2], [0.27, 0.32, 0.24]];   // (rhododendron: dark green; juniper: greyer)
    API.ROCK_SMOOTH = true;
    for (let s = 20; s < T.len - 20; s += 9) for (const side of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R();
      const o = 4.5 + Math.pow(r1, 1.3) * 36, [gx, gz] = onSide(s + (r2 - 0.5) * 9, side, o), c = vrLC(gx, gz), sl = caSlope(gx, gz);
      if (c >= 5 || c === 1) continue;
      if (sl > 0.5 && sl < 1.2 && r0 < 0.5) {   // a small fan of shale on the steep ground
        const cnt = 5 + Math.floor(R() * 7);
        for (let q = 0; q < cnt; q++) { const x = gx + (R() - 0.5) * 6, z = gz + (R() - 0.5) * 6, w = 0.22 + R() * 0.42;
          if (!free(x, z, 2 + w)) { R(); R(); continue; }
          rock(scen.get(x, z), x, caGround(x, z) + w * 0.2, z, w * 1.5, w * 0.6, w, R() * TAU, vary(rc[Math.floor(R() * rc.length)], R, 0.05), R, 0.3, 0.3); m++; }
        continue; }
      if (r0 > (c === 2 ? 0.6 : 0.42) || sl > 0.75) continue;
      const cnt = 3 + Math.floor(R() * 5), kind = R() < 0.65 ? 0 : 2;
      for (let q = 0; q < cnt; q++) { const x = gx + (R() - 0.5) * 8, z = gz + (R() - 0.5) * 8, w = 0.6 + R() * 1.1;
        if (!free(x, z, 2.6 + w) || caSlope(x, z) > 0.85) { R(); R(); continue; }
        ico(scen.get(x, z), x, caGround(x, z) + 0.05, z, w, 0.32 + R() * 0.14, vary(mats[kind + Math.floor(R() * 2)], R, 0.03), R, 0.3); n++; }
    }
    API.ROCK_SMOOTH = smooth0; st.blazine = n; st.skrilavec = m;
  });
  /* Llogara: the southern slope beside the road was grass and macchia only from the camera above the car. docs/proge/llogara.md: »Južno
     pobočje je golo sivo apnenčasto skalovje v rebrih in meliščih, vmes suha trava in temne zaplate makije«. So ribs of the grey
     limestone break the ground within ~35 m of the road wherever it is open (not in the fir and pine of the northern side), a few to
     a group, each lying along the slope's contour, with the rubble of a small scree below the steeper ones. */
  const ribs = (seed, slMin, pOf, k) => (L, { scen, excluded, onSide }, st) => {
    const { caGround, caSlope, vrLC } = API; if (!caGround || !caSlope || !vrLC || !T) return;
    const R = rng(L.seed + seed), rc = L.rockCols, smooth0 = API.ROCK_SMOOTH; let n = 0, m = 0;
    const free = (x, z, r) => vrNear(x, z).dd > r && !excluded(x, z);
    API.ROCK_SMOOTH = false;
    for (let s = 20; s < T.len - 20; s += 7) for (const side of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R();
      const o = 4 + Math.pow(r1, 1.3) * 32, [gx, gz] = onSide(s + (r2 - 0.5) * 7, side, o), c = vrLC(gx, gz), sl = caSlope(gx, gz);
      if (c === 1 || c >= 5 || sl > 1.2 || sl < slMin || r0 > pOf(sl)) continue;
      const dx = caGround(gx + 2, gz) - caGround(gx - 2, gz), dz = caGround(gx, gz + 2) - caGround(gx, gz - 2), gl = Math.hypot(dx, dz) || 1;
      const ux = dx / gl, uz = dz / gl, rot = Math.atan2(-ux, uz), cnt = 2 + Math.floor(R() * 3);   // (u: uphill; a rib lies across it)
      for (let q = 0; q < cnt; q++) { const d = (q - (cnt - 1) / 2) * (1.5 + R() * 1.2), a = (R() - 0.5) * 4;
        const x = gx + ux * d - uz * a, z = gz + uz * d + ux * a, len = 1.5 + R() * 2.6, hh = 0.3 + R() * 0.4, col = shade(vary(rc[Math.floor(R() * rc.length)], R, 0.04), k);
        if (!free(x, z, 2.2 + len * 0.7)) { R(); continue; }
        rock(scen.get(x, z), x, caGround(x, z) + hh * 0.12, z, len, hh, 0.55 + R() * 0.5, rot + (R() - 0.5) * 0.35, col, R, 0.26, 0.4); n++;
        if (sl > 0.4 && R() < 0.6) for (let k = 0; k < 4; k++) { const w = 0.16 + R() * 0.3, e = 0.8 + R() * 1.8, f = (R() - 0.5) * len * 1.4, px = x - ux * e - uz * f, pz = z - uz * e + ux * f;
          if (!free(px, pz, 2 + w)) { R(); continue; }
          rock(scen.get(px, pz), px, caGround(px, pz) + w * 0.2, pz, w * 1.4, w * 0.6, w, R() * TAU, [col[0] * 0.95, col[1] * 0.95, col[2] * 0.95], R, 0.3, 0.3); m++; }
      }
    }
    API.ROCK_SMOOTH = smooth0; st.rebra = n; st.grusc = m;
  };
  late.push(['llogara', ribs(9359, 0, sl => 0.25 + Math.min(0.4, sl * 0.6), 1)]);

  /* Porto Moniz: the terraces, their walls, the vineyards and the scrub stand by the road already; only the steep banks between the
     legs of the hairpins were smooth green faces from the camera above the car. The island is basalt (docs/proge/portomoniz.md:
     »bazaltne stene«, »črna lava obale«; the look's own rock colours: the dark grey basalt, the red-brown of the tuff). So ledges of
     that dark rock break the steep banks only (slope over ~0.45) within ~35 m of the road, the pastures and terraces left as they are. */
  late.push(['portomoniz', ribs(9371, 0.45, () => 0.28, 0.92)]);

  /* ---- the circuits on the shared builder (js/world-rbring.js): the look's own LK.extra chained the same way; what it counts joins
     the extra's own counts (out.stats.extra.robBt). All of it stands behind the fences, never on the pit's side along the pits. ---- */
  const { sstep } = API;
  const chainRb = (id, fn) => { const L = (API.rbLook || {})[id]; if (!L) return; const base = L.extra;
    L.extra = function (ctx) { const r = (base ? base.call(this, ctx) : null) || {};
      try { fn(L, ctx, r.robBt = {}); } catch (e) { console.error('realizem-bt (' + id + '):', e); } return r; }; };
  const rbSide = (s, side, o) => { const i = T.idx(s), d = side * ((side > 0 ? T.br[i] : T.bl[i]) + o); return [T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d]; };
  const rbPit = (s, side) => { const pd = T.def.pit; return !!pd && side === (pd[0] < 0 ? -1 : 1) && !!T.pitAt(s); };
  const rbClear = (excluded, x, z, r) => { const q = API.nrNear(x, z); return !(q.i >= 0 && q.dd < r) && !excluded(x, z); };   // (behind every leg's fence by r, off what the build keeps clear)
  const tuft = (g, x, y, z, w, h, col, R) => cone(g, x, y - 0.08, z, w, h, 5, [col[0] * 0.62, col[1] * 0.66, col[2] * 0.6], col, R() * TAU);
  const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const soil = (scen, gH, gx, gz, rr, col, R) => {   // bare ground: a low irregular patch lying on the terrain
    const k = 7, a0 = R() * TAU, rim = [col[0] * 0.9 + 0.05, col[1] * 0.9 + 0.07, col[2] * 0.9 + 0.03], g = scen.get(gx, gz), ctr = [gx, gH(gx, gz) + 0.07, gz], P = [];
    for (let q = 0; q < k; q++) { const a = a0 + q / k * TAU, r = rr * (0.65 + R() * 0.6), x = gx + Math.cos(a) * r, z = gz + Math.sin(a) * r * 0.75; P.push([x, gH(x, z) + 0.05, z]); }
    for (let q = 0; q < k; q++) g.triO(ctr, P[q], P[(q + 1) % k], col, [gx, ctr[1] - 5, gz], rim, rim); };

  /* Bathurst: behind the fences the pasture was one even face of grass from the camera above the car. docs/proge/bathurst.md: »pašniki
     … ponekod se že sušijo v slamnato rumeno«, »trava je v šopih (… suhimi bilkami in pegami rdeče-rjave prsti)«, »Trava ob progi je
     kot na pašnikih«. So tussocks stand in loose groups within ~35 m of the fences, straw where the ground's own colour dries off
     (the same noise as the look's colMod) and olive elsewhere, and here and there the red-brown soil shows bare between them. */
  chainRb('bathurst', (L, { scen, excluded }, st) => {
    const { nrGround, nrLC, nrSlope, NR: P } = API; if (!T || !P || !nrGround) return;
    const R = rng(9377), smooth0 = API.ROCK_SMOOTH, straw = [0.71, 0.65, 0.4], olive = [0.34, 0.4, 0.18]; let n = 0, m = 0;
    API.ROCK_SMOOTH = true;
    for (let s = 0; s < T.len; s += 7) for (const side of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(); if (rbPit(s, side)) continue;
      const o = 3 + Math.pow(r1, 1.5) * 33, [gx, gz] = rbSide(s + (r2 - 0.5) * 7, side, o), dry = sstep(0.42, 0.74, P.n3(gx * 0.8 + 90, gz * 0.8 - 40));
      if (r0 > 0.42 + 0.4 * dry || nrLC(gx, gz) !== 0 || !rbClear(excluded, gx, gz, 2.5)) continue;
      if (r2 < 0.22 && o > 5 && nrSlope(gx, gz) < 0.4 && rbClear(excluded, gx, gz, 4.5)) { soil(scen, nrGround, gx, gz, 1.3 + R() * 1.6, vary([0.47, 0.31, 0.21], R, 0.03), R); m++; }
      for (let q = 0, cnt = 4 + Math.floor(R() * 5); q < cnt; q++) {
        const x = gx + (R() - 0.5) * 8, z = gz + (R() - 0.5) * 8, h = 0.36 + R() * 0.4, w = 0.6 + R() * 0.7, t = Math.min(1, dry * (0.55 + R() * 0.6) + R() * 0.25);
        if (nrLC(x, z) !== 0 || !rbClear(excluded, x, z, 2 + w)) { R(); continue; }
        tuft(scen.get(x, z), x, nrGround(x, z), z, w, h, vary(mix3(olive, straw, t), R, 0.03), R); n++; }
    }
    API.ROCK_SMOOTH = smooth0; st.sopi = n; st.prst = m;
  });

  /* Pembrey: the flat coastal grass behind the fences was one even face from the camera above the car. docs/proge/pembrey.md: »obalna
     trava v suhih in vlažnih lisah«. So tufts of that grass stand in groups within ~32 m of the fences: pale and straw-coloured where
     the ground's own colour is dry and sandy, darker and taller (the rushes) where it is damp (the same noise as the look's colMod),
     the plain green tussock between; clear of the gorse and the buildings (the build's own excluded). */
  chainRb('pembrey', (L, { scen, excluded }, st) => {
    const { nrGround, nrLC, NR: P } = API; if (!T || !P || !nrGround) return;
    const R = rng(9391), smooth0 = API.ROCK_SMOOTH, pale = [0.68, 0.64, 0.4], rush = [0.36, 0.47, 0.22], mid = [0.44, 0.54, 0.25]; let n = 0;
    API.ROCK_SMOOTH = true;
    for (let s = 0; s < T.len; s += 5) for (const side of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(); if (rbPit(s, side)) continue;
      const o = 3 + Math.pow(r1, 1.5) * 30, [gx, gz] = rbSide(s + (r2 - 0.5) * 5, side, o);
      const dry = sstep(0.5, 0.82, P.n3(gx * 0.8 + 340, gz * 0.8 - 120)), wet = sstep(0.55, 0.84, P.n1(gx * 1.2 - 60, gz * 1.2 + 230));
      if (r0 > 0.22 + 0.45 * Math.max(dry, wet) || nrLC(gx, gz) !== 0 || !rbClear(excluded, gx, gz, 2.5)) continue;
      for (let q = 0, cnt = 3 + Math.floor(R() * 4); q < cnt; q++) {
        const x = gx + (R() - 0.5) * 6, z = gz + (R() - 0.5) * 6, k = R(), a = R();
        if (nrLC(x, z) !== 0 || !rbClear(excluded, x, z, 2.4)) { R(); continue; }
        const isRush = wet > dry && a < 0.3 + 0.6 * wet, col = isRush ? rush : mix3(mid, pale, Math.min(1, dry * (0.6 + a * 0.6) + a * 0.2));
        tuft(scen.get(x, z), x, nrGround(x, z), z, isRush ? 0.45 + k * 0.3 : 0.5 + k * 0.55, isRush ? 0.6 + k * 0.4 : 0.32 + k * 0.34, vary(col, R, 0.03), R); n++; }
    }
    API.ROCK_SMOOTH = smooth0; st.sopi = n;
  });

  /* Quezaltepeque: docs/proge/quezaltepeque.md: »ob ravnini za 8. ovinkom stara lava (temna, siva in rjava kamnita tla z nizkim grmovjem)«,
     »zelen hribovit svet s suhimi rumenimi lisami: trate, grmovje«. The lava was a dark colour on smooth ground from the camera above
     the car, the dry patches a colour only. So on the old flow (the look's own qzLava) dark grey and brown stones lie in loose
     groups within ~30 m of the fences, and tufts of the dry season's yellow grass stand where the ground's own colour is dry. */
  chainRb('quezaltepeque', (L, { scen, excluded }, st) => {
    const { nrGround, nrLC, qzLava, NR: P } = API; if (!T || !P || !nrGround || !qzLava) return;
    const R = rng(9397), smooth0 = API.ROCK_SMOOTH, lava = [[0.3, 0.29, 0.28], [0.38, 0.32, 0.27], [0.24, 0.23, 0.23], [0.44, 0.37, 0.3]], dryC = [0.76, 0.7, 0.38], grn = [0.34, 0.46, 0.19]; let n = 0, m = 0;
    for (let s = 0; s < T.len; s += 6) for (const side of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(); if (rbPit(s, side)) continue;
      const o = 3 + Math.pow(r1, 1.4) * 28, [gx, gz] = rbSide(s + (r2 - 0.5) * 6, side, o), c = nrLC(gx, gz), lv = qzLava(gx, gz);
      if (c === 1 || c >= 5 || !rbClear(excluded, gx, gz, 2.5)) continue;
      if (lv > 0.5) {   // the old flow: stones of its rock, a bigger one now and then
        if (r0 > 0.8) continue; API.ROCK_SMOOTH = false;
        for (let q = 0, cnt = 3 + Math.floor(R() * 5); q < cnt; q++) {
          const x = gx + (R() - 0.5) * 7, z = gz + (R() - 0.5) * 7, w = 0.3 + Math.pow(R(), 2) * 0.8;
          if (qzLava(x, z) < 0.5 || !rbClear(excluded, x, z, 2.2 + w)) { R(); R(); continue; }
          rock(scen.get(x, z), x, nrGround(x, z) + w * 0.18, z, w * 1.4, w * 0.7, w, R() * TAU, vary(lava[Math.floor(R() * lava.length)], R, 0.03), R, 0.34, 0.35); m++; }
        continue; }
      if (c !== 0) continue;
      const dry = sstep(0.5, 0.75, P.n3(gx * 0.35 + 90, gz * 0.35 - 40)) * sstep(6, 18, o);   // (as the look's colMod: the dry grass away from the track)
      if (r0 > 0.3 + 0.5 * dry) continue; API.ROCK_SMOOTH = true;
      for (let q = 0, cnt = 4 + Math.floor(R() * 5); q < cnt; q++) {
        const x = gx + (R() - 0.5) * 8, z = gz + (R() - 0.5) * 8, k = R(), a = R();
        if (nrLC(x, z) !== 0 || qzLava(x, z) > 0.3 || !rbClear(excluded, x, z, 2.4)) { R(); continue; }
        tuft(scen.get(x, z), x, nrGround(x, z), z, 0.55 + k * 0.7, 0.4 + k * 0.5, vary(mix3(grn, dryC, Math.min(1, dry * (0.6 + a * 0.5) + a * 0.3)), R, 0.03), R); n++; }
    }
    API.ROCK_SMOOTH = smooth0; st.sopi = n; st.lava = m;
  });

  /* Seoul (its own builder, js/world-seoul.js, calls this before it closes its scenery chunks): under the pines and oaks of the
     mountain the ground beside the road was one smooth face from the camera above the car. docs/proge/seoul.md: »gozd rdečega bora in
     hrasta … (tla iglice in listje z zelenim podrastjem)«. So low clumps of that green undergrowth lie in groups on the forest's
     floor within ~28 m of the road, off the buildings, the landmarks and the road's own crossings. */
  World.ext.seoulRob = ({ scen, noTree, nearCross, out }) => {
    try {
      const { nrGround, nrLC, nrNear } = API, T = API.T, R = rng(9413), smooth0 = API.ROCK_SMOOTH; let n = 0;
      const und = [[0.2, 0.36, 0.16], [0.25, 0.41, 0.18], [0.3, 0.43, 0.2], [0.22, 0.33, 0.2]];
      API.ROCK_SMOOTH = true;
      for (let s = 8; s < T.len - 8; s += 6) for (const side of [-1, 1]) {
        const r0 = R(), r1 = R(), r2 = R(); if (r0 > 0.6 || nearCross(s, 14)) continue;
        const [gx, gz] = rbSideT(T, s + (r2 - 0.5) * 6, side, 2.2 + Math.pow(r1, 1.3) * 26); if (nrLC(gx, gz) !== 1) continue;
        for (let q = 0, cnt = 2 + Math.floor(R() * 4); q < cnt; q++) {
          const x = gx + (R() - 0.5) * 7, z = gz + (R() - 0.5) * 7, w = 0.5 + R() * 0.8, nn = nrNear(x, z);
          if ((nn.i >= 0 && nn.dd < 1.6 + w) || nrLC(x, z) !== 1 || noTree(x, z)) { R(); R(); continue; }
          ico(scen.get(x, z), x, nrGround(x, z) + 0.04, z, w, 0.34 + R() * 0.16, vary(und[Math.floor(R() * und.length)], R, 0.03), R, 0.3); n++; }
      }
      API.ROCK_SMOOTH = smooth0; out.robBt = { podrast: n };
    } catch (e) { console.error('realizem-bt (seoul):', e); }
  };
  const rbSideT = (T, s, side, o) => { const i = T.idx(s), d = side * ((side > 0 ? T.br[i] : T.bl[i]) + o); return [T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d]; };

  /* Portobelo (its own builder, js/world-portobelo.js, calls this the same way): the bank between the road and the bay and the floor
     of the forest were smooth green faces from the camera above the car. docs/proge/portobelo.md: »temne skale ob zalivu«, »temne
     krošnje deževnega gozda in visoka drevesa nad zelenimi tlemi«. So dark boulders lie on the land's last ~12 m above the water
     where the road runs by it, and low green undergrowth grows in groups under the forest within ~22 m of the road; the fort and
     its glade stay as they are. */
  World.ext.portobeloRob = ({ scen, excluded, seaD, inFort, inGlade, out }) => {
    try {
      const { nrGround, nrLC, nrNear } = API, T = API.T, R = rng(9403), smooth0 = API.ROCK_SMOOTH; let n = 0, m = 0;
      const dark = [[0.3, 0.29, 0.27], [0.25, 0.25, 0.24], [0.35, 0.31, 0.27]], und = [[0.17, 0.35, 0.14], [0.21, 0.41, 0.16], [0.26, 0.44, 0.15]];
      const off = (x, z, r) => { const nn = nrNear(x, z); return (nn.i >= 0 && nn.dd < r) || excluded(x, z) || inFort(x, z, 6) || inGlade(x, z); };
      API.ROCK_SMOOTH = true;
      for (let s = 6; s < T.len - 6; s += 4) for (const side of [-1, 1]) {
        const r0 = R(), r1 = R(), r2 = R(), o = 1.8 + r1 * 16, [gx, gz] = rbSideT(T, s + (r2 - 0.5) * 4, side, o), sd = seaD(gx, gz);
        if (sd > -12 && sd < -0.8) {   // the shore's land: the boulders
          if (r0 > 0.55) continue;
          for (let q = 0, cnt = 1 + Math.floor(R() * 3); q < cnt; q++) {
            const x = gx + (R() - 0.5) * 4, z = gz + (R() - 0.5) * 4, w = 0.4 + Math.pow(R(), 1.8) * 0.9, d2 = seaD(x, z);
            if (d2 > -0.6 || d2 < -13 || off(x, z, 1.6 + w)) { R(); R(); continue; }
            rock(scen.get(x, z), x, nrGround(x, z) + w * 0.15, z, w * 1.3, w * 0.75, w, R() * TAU, vary(dark[Math.floor(R() * dark.length)], R, 0.03), R, 0.3, 0.4); m++; }
          continue; }
        if (r0 > 0.5 || sd > -12 || nrLC(gx, gz) !== 1) continue;
        for (let q = 0, cnt = 2 + Math.floor(R() * 3); q < cnt; q++) {   // under the forest: the undergrowth
          const x = gx + (R() - 0.5) * 6, z = gz + (R() - 0.5) * 6, w = 0.5 + R() * 0.8;
          if (seaD(x, z) > -4 || nrLC(x, z) !== 1 || off(x, z, 1.6 + w)) { R(); R(); continue; }
          ico(scen.get(x, z), x, nrGround(x, z) + 0.04, z, w, 0.36 + R() * 0.18, vary(und[Math.floor(R() * und.length)], R, 0.03), R, 0.3); n++; }
      }
      API.ROCK_SMOOTH = smooth0; out.robBt = { skale: m, podrast: n };
    } catch (e) { console.error('realizem-bt (portobelo):', e); }
  };
})();
