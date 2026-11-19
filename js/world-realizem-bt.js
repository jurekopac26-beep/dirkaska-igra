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
})();
