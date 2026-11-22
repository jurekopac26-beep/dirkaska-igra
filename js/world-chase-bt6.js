/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the sixth group of the real tracks: Kotor and Llogara (the shared
   world of the passes, js/world-prelaz.js: the look's own L.extra chained), Zandvoort and Tuzla (the shared circuit builder,
   js/world-rbring.js: the look's own LK.extra chained), Hiva (its own builder calls World.ext.hivaRob just before its scenery chunks
   are closed). What is added goes into the builders' own scenery chunks (scen.get) or, where a track asks for it (C.soft), into meshes of
   its own (softScen: 256 m chunks, a few draws more); only the named tracks
   change. What stands where follows each track's description (docs/proge/<id>.md). Nothing here is driven on: all of it is behind the
   barriers, off the built ground and what the build keeps clear; the terrain, the road and the fences stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, { TAU, lerp, rng, vary, cone, sstep } = API;
  const side = (T, s, sd, o) => { const i = T.idx(s), d = sd * ((sd > 0 ? T.br[i] : T.bl[i]) + o); return [T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d]; };
  const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const dk = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const tuft = (g, x, y, z, w, h, col, R, n) => cone(g, x, y - 0.08, z, w, h, n || 5, [col[0] * 0.62, col[1] * 0.66, col[2] * 0.6], col, R() * TAU);
  const cushion = (g, x, y, z, w, h, col, R) => cone(g, x, y - 0.1, z, w, h, 6, dk(col, 0.7), [col[0] * 1.12, col[1] * 1.14, col[2] * 1.05], R() * TAU);   // a low wide shrub
  const soil = (scen, gH, gx, gz, rr, col, R, lift) => {   // bare ground: a low irregular patch lying on the terrain
    const k = 7, a0 = R() * TAU, rim = [col[0] * 0.9 + 0.05, col[1] * 0.9 + 0.07, col[2] * 0.9 + 0.03], g = scen.get(gx, gz), up = lift || 0.05, ctr = [gx, gH(gx, gz) + up + 0.02, gz], P = [];
    for (let q = 0; q < k; q++) { const a = a0 + q / k * TAU, r = rr * (0.65 + R() * 0.6), x = gx + Math.cos(a) * r, z = gz + Math.sin(a) * r * 0.75; P.push([x, gH(x, z) + up, z]); }
    for (let q = 0; q < k; q++) g.triO(ctr, P[q], P[(q + 1) % k], col, [gx, ctr[1] - 5, gz], rim, rim); };
  /* a rib of limestone: a low sharp ridge of rock out of the ground (six faces), `len` long along (ax, az), `w` wide, `h` high, its crest
     off the middle and uneven, lighter above and darker at the foot */
  const rib = (g, gH, x, z, ax, az, len, w, h, col, R) => {
    const bx = -az, bz = ax, hl = len / 2, hw = w / 2, sk = (R() - 0.5) * 0.6 * hw, lo = dk(col, 0.74), hi = [Math.min(1, col[0] * 1.1), Math.min(1, col[1] * 1.1), Math.min(1, col[2] * 1.1)];
    const pt = (u, v, y) => { const px = x + ax * u + bx * v, pz = z + az * u + bz * v; return [px, gH(px, pz) + y, pz]; };
    const A = pt(-hl, -hw, -0.12), B = pt(hl, -hw, -0.12), C = pt(hl, hw, -0.12), D = pt(-hl, hw, -0.12);
    const E = pt(-hl * (0.35 + R() * 0.4), sk, h * (0.7 + R() * 0.5)), F = pt(hl * (0.35 + R() * 0.4), sk, h * (0.6 + R() * 0.6)), inn = pt(0, 0, -0.5);
    g.triO(A, B, F, lo, inn, lo, hi); g.triO(A, F, E, lo, inn, hi, hi); g.triO(C, D, E, lo, inn, lo, hi); g.triO(C, E, F, lo, inn, hi, hi);
    g.triO(D, A, E, lo, inn, lo, col); g.triO(B, C, F, lo, inn, lo, col); };
  /* the common walk: every `step` m on both sides a group's place to `reach` m behind the barriers; env: the builder's own tests
     (near: the nearest leg and the way past its barrier, excluded, pit: the pit's side along the pits); ok(x, z): the strength there
     (0–1; 0 = nothing stands); each(gx, gz, k, R, free) plants the group */
  const walk = (env, seed, step, reach, o0, ok, each) => {
    const T = API.T; if (!T || !T.br) return false;
    const R = rng(seed), { near, excluded, pit } = env;
    const free = (x, z, r) => { const q = near(x, z); return !(q.i >= 0 && q.dd < r) && !excluded(x, z); };
    for (let s = 0; s < T.len; s += step) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(); if (pit && pit(s, sd)) continue;
      const o = o0 + Math.pow(r1, 1.4) * reach, [gx, gz] = side(T, s + (r2 - 0.5) * step, sd, o);
      if (!free(gx, gz, 2.5)) continue;
      const k = ok(gx, gz); if (!(k > 0.05) || r0 > k) continue;
      each(gx, gz, k, R, free);
    }
    return true;
  };
  /* The tufts and the cushions in meshes of their own (256 m chunks, the scenery's material), which the animals' and the people's
     tests of a free place leave out (userData.rob, userData.lj): grass is no obstacle, a herd and a stand's ways stay where they were. */
  const softScen = (root, matV) => { const ch = new API.Chunks(256); return { get: (x, z) => ch.get(x, z), done() { const grp = new THREE.Group(); ch.addTo(grp, matV, true, true);
    for (const m of grp.children) { m.name = 'rob'; m.userData.rob = m.userData.lj = true; } if (grp.children.length) root.add(grp); } }; };
  const chain = (L, fn) => { const base = L.extra; L.extra = function (ctx) { const r = base ? base.call(this, ctx) : null; try { fn(ctx, r); } catch (e) { console.error('chase-bt6:', e); } return r; }; };
  /* the side roads (ctx.naCesti): ctx.excluded is widened in js/world-rbring.js, right after the looks are gathered, so every part chained
     on a look's LK.extra (js/world-realizem-bt.js, this file and on) reads it; the builder's own extra keeps its test as it was */

  /* ---- the passes: the karst by the road. The slope's way (the contour) from the ground itself, so the ribs lie along the hillside ---- */
  const karst = (ctx, seed, C) => {
    const { caGround, caSlope, vrNear, vrLC } = API, { scen, excluded } = ctx, st = { rebra: 0, plosce: 0, sopi: 0, grmi: 0 }, soft = C.soft && ctx.root && ctx.matV ? softScen(ctx.root, ctx.matV) : scen;
    if (!caGround || !vrNear || !vrLC) return st;
    const env = { near: vrNear, excluded };
    const ok = (x, z) => { const c = vrLC(x, z), sl = caSlope(x, z); if (c === 3 || c === 5 || c === 6 || sl > C.maxSl) return 0; return C.share(c, x, z); };
    walk(env, seed, C.step, C.reach, 1.8, ok, (gx, gz, k, R, free) => {
      const c = vrLC(gx, gz), sl = caSlope(gx, gz), e = 1.2, dx = caGround(gx + e, gz) - caGround(gx - e, gz), dz = caGround(gx, gz + e) - caGround(gx, gz - e), dl = Math.hypot(dx, dz);
      let ax = dl > 0.02 ? -dz / dl : Math.cos(R() * TAU), az = dl > 0.02 ? dx / dl : Math.sin(R() * TAU);   // (along the contour)
      const rocky = c === 4 || c === 7 ? (C.scree == null ? 1 : C.scree) : c === 1 ? C.wood : C.rocky, ra = R(), rb = R(), rk = C.ribLen || 1;   // (C.scree, C.ribLen: the later groups' own measure)
      if (ra < rocky) {   // the ribs: two to four in a row, one behind the other up the slope
        const cnt = 2 + Math.floor(R() * 4), cx = -az, cz = ax;
        for (let q = 0; q < cnt; q++) {
          const u = (R() - 0.5) * 3.2, v = (q - (cnt - 1) / 2) * (1.6 + R() * 1.1), x = gx + ax * u + cx * v, z = gz + az * u + cz * v, len = (2.5 + R() * 4) * rk, w = (1.3 + R() * 1.6) * rk, h = 0.28 + R() * 0.42, t = R();
          if (!free(x, z, 2.2 + len * 0.5)) continue;
          const wob = (R() - 0.5) * 0.5, c0 = Math.cos(wob), s0 = Math.sin(wob);
          rib(scen.get(x, z), caGround, x, z, ax * c0 - az * s0, ax * s0 + az * c0, len, w, h, vary(dk(C.rock[Math.floor(t * C.rock.length)], C.pale), R, 0.025), R); st.rebra++; }
      }
      if (rb < C.slab && sl < 0.38 && c !== 1 && free(gx, gz, 4.5)) { soil(scen, caGround, gx, gz, 1.5 + R() * 2, vary(C.bare, R, 0.025), R, 0.09); st.plosce++; }   // the bare ground
      if (c === 1 && !C.woodTufts) return;
      for (let q = 0, cnt = C.tufts + Math.floor(R() * 3); q < cnt; q++) {   // the dry grass, a dark cushion of scrub among it
        const x = gx + (R() - 0.5) * 6.5, z = gz + (R() - 0.5) * 6.5, h = R(), a = R();
        if (!free(x, z, 2.3) || caSlope(x, z) > 0.95) { R(); continue; }
        if (a < C.scrub) { cushion(soft.get(x, z), x, caGround(x, z), z, 0.7 + h * 0.7, 0.4 + h * 0.4, vary(C.shrub, R, 0.025), R); st.grmi++; }
        else { tuft(soft.get(x, z), x, caGround(x, z), z, 0.42 + h * 0.5, 0.3 + h * 0.4, vary(mix3(C.dry, C.gold, a), R, 0.03), R, C.sides); st.sopi++; }
      }
    });
    if (soft.done) soft.done();
    return st;
  };
  /* Kotor: docs/proge/kotor.md: »Svetlo siv apnenec v rebrih, ploščah in golih kraških tleh, med njimi suho kraško grmovje (temno),
     zaplate suhe trave«. Beside the road the karst was a colour on smooth terrain from the camera behind the car. So within ~24 m of
     the low walls ribs of the pale limestone come out of the ground along the hillside, a slab of bare rock lies here and there on
     the gentler ground, and between them stand tufts of the dry grass and a few dark cushions of the scrub. Few: the legs of the
     serpentines are all in view at once. */
  if (API.PL_LOOK && API.PL_LOOK.kotor) chain(API.PL_LOOK.kotor, (ctx) => {
    const L = API.PL_LOOK.kotor, P = API.VR;
    ctx.out.rob = karst(ctx, 9511, { step: 3, reach: 20, rocky: 0.6, wood: 0.55, slab: 0.3, tufts: 3, scrub: 0.14, maxSl: 1.6, woodTufts: true, pale: 1.03, sides: 4,
      rock: L.rockCols, bare: [0.72, 0.71, 0.66], dry: [0.66, 0.61, 0.42], gold: [0.78, 0.7, 0.44], shrub: [0.22, 0.29, 0.16],
      share: (c, x, z) => (c === 1 ? 0.6 : 0.75) * (0.55 + 0.45 * sstep(0.3, 0.7, P.c2(x * 1.3 + 40, z * 1.3 - 90))) });
  });
  /* Llogara: docs/proge/llogara.md: »Južno pobočje je golo sivo apnenčasto skalovje v rebrih in meliščih, vmes suha trava in temne
     zaplate makije«; the north side is the forest. Beside the road the south face and the open top were a colour on smooth terrain
     from the camera behind the car. So within ~28 m of the barriers ribs of the grey limestone come out of the ground along the
     hillside, the scree lies bare in low patches, and the dry grass stands in tufts going gold; in the forest only a few ribs. */
  if (API.PL_LOOK && API.PL_LOOK.llogara) chain(API.PL_LOOK.llogara, (ctx) => {
    const L = API.PL_LOOK.llogara, P = API.VR;
    ctx.out.rob = karst(ctx, 9521, { step: 3, reach: 22, rocky: 0.6, wood: 0.5, slab: 0.3, tufts: 3, scrub: 0.06, maxSl: 1.2, pale: 1.04, sides: 4, soft: true,
      rock: L.rockCols, bare: [0.7, 0.69, 0.65], dry: [0.66, 0.6, 0.4], gold: [0.82, 0.72, 0.4], shrub: [0.19, 0.26, 0.14],
      share: (c, x, z) => (c === 1 ? 0.16 : 0.8) * (0.55 + 0.45 * sstep(0.3, 0.7, P.c2(x * 1.3 - 140, z * 1.3 + 60))) });
  });

  /* ---- the circuits on the shared builder: all of it behind the fences, never on the pit's side along the pits ---- */
  const rbEnv = (excluded) => { const T = API.T, pd = T.def.pit; return { near: API.nrNear, excluded, pit: (s, sd) => !!pd && sd === (pd[0] < 0 ? -1 : 1) && !!T.pitAt(s) }; };
  /* Zandvoort: docs/proge/zandvoort.md: »sipine s šopi trave, grmi rakitovca in razpihani peščeni žepi«. The builder's own marram
     grass stands in drifts; between the drifts the dunes were a colour on smooth terrain from the camera behind the car. So on the
     dunes within ~40 m of the barriers (never on the mown lawns) more marram stands thinly between the drifts, low dark cushions of
     the scrub where the ground's own colour already shows it (the same noise as the look's colMod), and small pockets of blown sand
     lie bare on the gentler ground. */
  const LZ = (API.rbLook || {}).zandvoort;
  if (LZ) chain(LZ, ({ scen, excluded, root, matV }, r) => {
    const { nrGround, nrLC, nrSlope, NR: P } = API; if (!P || !nrGround) return;
    const soft = root && matV ? softScen(root, matV) : scen;
    const grey = [0.5, 0.56, 0.36], straw = [0.74, 0.7, 0.46], scrub = [0.34, 0.42, 0.25], sand = [0.84, 0.78, 0.6]; let n = 0, m = 0, b = 0;
    const ok = (x, z) => nrLC(x, z) === 2 ? 0.75 : 0;
    walk(rbEnv(excluded), 9533, 5, 32, 3.2, ok, (gx, gz, k, R, free) => {
      const sc = sstep(0.55, 0.78, P.n2(gx * 0.9 - 130, gz * 0.9 + 70)), dry = P.n3(gx * 0.6 + 40, gz * 0.6);
      if (R() < 0.14 && nrSlope(gx, gz) < 0.35 && free(gx, gz, 5)) { soil(scen, nrGround, gx, gz, 1.2 + R() * 1.8, vary(sand, R, 0.025), R); m++; }
      for (let q = 0, cnt = 4 + Math.floor(R() * 4); q < cnt; q++) {
        const x = gx + (R() - 0.5) * 7, z = gz + (R() - 0.5) * 7, h = R(), a = R();
        if (nrLC(x, z) !== 2 || !free(x, z, 2.6)) { R(); continue; }
        if (a < 0.3 * sc) { cushion(soft.get(x, z), x, nrGround(x, z), z, 0.8 + h * 0.9, 0.4 + h * 0.45, vary(scrub, R, 0.025), R); b++; }
        else { tuft(soft.get(x, z), x, nrGround(x, z), z, 0.4 + h * 0.45, 0.42 + h * 0.5, vary(mix3(grey, straw, Math.min(1, dry * 0.8 + a * 0.4)), R, 0.03), R, 3); n++; }
      }
    });
    if (soft.done) soft.done();
    if (r) r.robBt = { sopi: n, grmi: b, pesek: m };
  });
  /* Tuzla: docs/proge/tuzla.md: »suhi travnati griči ob koncu poletja, trava zlata, v lisah bledejša in bolj rjava; tik ob progi (do
     ~25 m za ograjami) zalite zelene trate«, »grmi makije«. Beyond the watered lawns the golden hills were a colour on smooth terrain
     from the camera behind the car. So from ~16 m to ~60 m behind the fences (never on the lawns, the car parks or the service
     roads) tufts of the burnt grass stand in loose groups, paler and browner as the ground's own colour (the same noise as the
     look's colMod), the brown earth shows bare here and there, and on the maquis' ground low dark cushions of it stand between. */
  const LT = (API.rbLook || {}).tuzla;
  if (LT) chain(LT, ({ scen, excluded, root, matV }, r) => {
    const { nrGround, nrLC, nrSlope, NR: P } = API; if (!P || !nrGround) return;
    const soft = root && matV ? softScen(root, matV) : scen;
    const gold = [0.8, 0.66, 0.36], pale = [0.86, 0.78, 0.52], brown = [0.62, 0.48, 0.3], earth = [0.6, 0.47, 0.33], maq = [0.26, 0.3, 0.17]; let n = 0, m = 0, b = 0;
    const ok = (x, z) => { const c = nrLC(x, z); return c === 0 ? 0.7 : c === 2 ? 0.8 : 0; };
    walk(rbEnv(excluded), 9539, 5, 44, 16, ok, (gx, gz, k, R, free) => {
      const q0 = sstep(0.3, 0.75, P.n1(gx * 0.9 - 210, gz * 0.9 + 75)), mq = nrLC(gx, gz) === 2;
      if (R() < 0.13 && nrSlope(gx, gz) < 0.35 && free(gx, gz, 17)) { soil(scen, nrGround, gx, gz, 1.2 + R() * 1.7, vary(earth, R, 0.025), R); m++; }
      for (let q = 0, cnt = 4 + Math.floor(R() * 4); q < cnt; q++) {
        const x = gx + (R() - 0.5) * 6.5, z = gz + (R() - 0.5) * 6.5, h = R(), a = R(), c = nrLC(x, z);
        if ((c !== 0 && c !== 2) || !free(x, z, 15)) { R(); continue; }
        if (mq && a < 0.4) { cushion(soft.get(x, z), x, nrGround(x, z), z, 0.9 + h * 1.0, 0.45 + h * 0.5, vary(maq, R, 0.025), R); b++; }
        else { tuft(soft.get(x, z), x, nrGround(x, z), z, 0.45 + h * 0.55, 0.32 + h * 0.44, vary(a < 0.25 ? brown : mix3(gold, pale, q0 * 0.7 + a * 0.3), R, 0.03), R, 4); n++; }
      }
    });
    if (soft.done) soft.done();
    if (r) r.robBt = { sopi: n, grmi: b, prst: m };
  });

  /* Hiva: docs/proge/hiva.md: »puhlično rumena tla«; the builder's ground: »pale loess dust, the dry grass of the verges in patches«.
     Between the houses and the walls the loess was a colour on flat ground from the camera behind the car. So on the open ground
     within ~30 m of the barriers, where the ground's own colour already shows the dry grass (the same noise as the builder's colFn),
     tufts of it stand in loose groups (straw to pale), thinner elsewhere, and here and there the loess lies in a low patch of paler
     dust or of darker, damp earth. Clear of the houses, the walls and the landmark (the builder's own tests). */
  (World.ext = World.ext || {}).hivaRob = (ctx) => {
    const { nrGround, nrLC, nrNear, NR: P } = API, { scen, excluded, clear } = ctx; if (!P || !nrGround) return null;
    const soft = ctx.root && ctx.matV ? softScen(ctx.root, ctx.matV) : scen;
    const straw = [0.74, 0.68, 0.42], pale = [0.84, 0.77, 0.52], dust = [0.86, 0.74, 0.52], damp = [0.68, 0.55, 0.38]; let n = 0, m = 0;
    const ex = (x, z) => excluded(x, z) || (clear ? !clear(x, z) : false);
    const ok = (x, z) => { const c = nrLC(x, z); return (c >= 3 ? 0.4 : c === 1 ? 0.5 : 0.75) * (0.35 + 0.65 * sstep(0.4, 0.8, P.n2(x, z))); };
    walk({ near: nrNear, excluded: ex }, 9547, 3, 28, 2.6, ok, (gx, gz, k, R, free) => {
      if (R() < 0.2 && free(gx, gz, 4.5)) { soil(scen, nrGround, gx, gz, 1.1 + R() * 1.6, vary(R() < 0.6 ? dust : damp, R, 0.02), R); m++; }
      for (let q = 0, cnt = 3 + Math.floor(R() * 5); q < cnt; q++) {
        const x = gx + (R() - 0.5) * 6.5, z = gz + (R() - 0.5) * 6.5, h = R(), a = R();
        if (!free(x, z, 2.4)) { R(); continue; }
        tuft(soft.get(x, z), x, nrGround(x, z), z, 0.4 + h * 0.5, 0.28 + h * 0.4, vary(mix3(straw, pale, a), R, 0.03), R); n++; }
    });
    if (soft.done) soft.done();
    return { sopi: n, prst: m };
  };
  API.chaseBt = { karst, chain, walk, tuft, cushion, soil, softScen, rbEnv, mix3, dk };   // (the next groups' files build on the same walk: js/world-chase-bt7.js, js/world-chase-bt9.js)
})();
