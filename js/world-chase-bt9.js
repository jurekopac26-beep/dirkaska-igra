/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the ninth group of the real tracks: Spa (its own builder calls
   World.ext.spaRob just before its build-only caches are dropped, as Hiva's World.ext.hivaRob: js/world-chase-bt6.js). What is added
   goes into meshes of its own (the sixth group's softScen: 256 m chunks that cast no shadow and that the animals' and the people's
   tests of a free place leave out), so only Spa changes. What stands where follows docs/proge/spa.md. Nothing here is driven on: all
   of it is behind the barriers, off what the build keeps clear, never by the brook nor on the pit's side; the terrain, the road, the
   mown stripes and the fences stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, sstep } = API;
  if (!BT || !BT.walk) return;
  const { walk, tuft, cushion, soil, softScen, rbEnv, mix3 } = BT;
  World.ext = World.ext || {};
  const hh = (i, j) => { const t = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return t - Math.floor(t); };
  const vn = (x, z) => { const i = Math.floor(x), j = Math.floor(z), u = x - i, v = z - j, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v);   // (a smooth value noise of its own)
    return (hh(i, j) * (1 - a) + hh(i + 1, j) * a) * (1 - b) + (hh(i, j + 1) * (1 - a) + hh(i + 1, j + 1) * a) * b; };

  /* Spa: docs/proge/spa.md: »sveži zeleni pašniki in senožeti … smreka v ravnih vrstah na strmih ardenskih pobočjih, posekane jase z
     orlovo praprotjo, brezami in mladim drevjem … tla pod smrekami rjava od iglic … trava za ograjami pokošena v svetlih in temnih
     pasovih«. From the camera behind the car the ground behind the barriers was one smooth mown green up to the trees. So the mower
     leaves a strip of the taller grass uncut at the barrier's foot on the open land, at the edge of the woods and in the scrub of the
     felled glades the fresh green bracken stands in clumps on the brown of the needles, and out past the mown bands (over ~26 m) the
     hay meadow's taller grass stands in loose groups. */
  World.ext.spaRob = (ctx) => {
    const { nrLC, nrGround: gH, nrSlope, nrGCol } = API, st = { sopi: 0, praprot: 0, iglice: 0, seno: 0 };
    if (!nrLC || !gH || !API.T) return st;
    const { excluded, inBrook, root, matV } = ctx, soft = softScen(root, matV);
    const env = rbEnv((x, z) => excluded(x, z) || inBrook(x, z, 2.5));
    const f = (x, z, ox, oz) => 0.5 + 0.5 * sstep(0.3, 0.7, vn((x + ox) / 23, (z + oz) / 23));   // (in loose groups, not an even carpet)
    const wood = (x, z) => { let a = 0; for (const [u, v] of [[14, 0], [-14, 0], [0, 14], [0, -14], [10, 10], [-10, -10], [10, -10], [-10, 10]]) if (nrLC(x + u, z + v) === 1) a++; return a / 8; };
    const up = (c, k) => [Math.min(1, c[0] * k), Math.min(1, c[1] * k), Math.min(1, c[2] * k)];   // (the tuft's foot is a third darker: its tip lighter, so the whole reads as grass, not stone)
    const gc = (x, z) => { const c = nrGCol ? nrGCol(x, z) : [0.4, 0.55, 0.3]; return [c[0] * 0.95, c[1] * 1.02, c[2] * 0.9]; };
    const GR = [0.36, 0.56, 0.2], SEED = [0.66, 0.66, 0.38], FERN = [0.34, 0.56, 0.14], NEED = [0.36, 0.29, 0.2];
    // the uncut strip at the barrier's foot (0.5-4 m behind it), on the open land only (the walk's groups 2.6-3.6 m out)
    walk(env, 9701, 1.6, 1.0, 2.6, (x, z) => { const c = nrLC(x, z); return c === 0 && nrSlope(x, z) < 0.6 ? 0.75 * f(x, z, 30, -70) : 0; }, (gx, gz, k, R, free) => {
      for (let q = 0, n = 3 + Math.floor(R() * 4); q < n; q++) {
        const x = gx + (R() - 0.5) * 3.6, z = gz + (R() - 0.5) * 3.6, h = R();
        if (!free(x, z, 0.5) || free(x, z, 4)) continue;   // (the strip: 0.5-4 m behind the barrier)
        tuft(soft.get(x, z), x, gH(x, z), z, 0.32 + h * 0.3, 0.5 + h * 0.45, vary(up(mix3(mix3(gc(x, z), GR, 0.6), SEED, R() * 0.55), 1.35), R, 0.03), R, 4); st.sopi++;
      }
    });
    // the edge of the woods and the felled glades: the bracken on the needles' brown
    walk(env, 9711, 3, 26, 2, (x, z) => { const c = nrLC(x, z); if (c === 3 || nrSlope(x, z) > 1.0) return 0; const e = c === 2 ? 1 : c === 1 ? 0.8 : wood(x, z); return e > 0.2 ? Math.min(1, e) * 0.8 : 0; }, (gx, gz, k, R, free) => {
      const c = nrLC(gx, gz);
      if ((c === 1 || R() < 0.35) && free(gx, gz, 3.5)) { soil(soft, gH, gx, gz, 1.4 + R() * 1.8, vary(NEED, R, 0.02), R, 0.05); st.iglice++; }
      for (let q = 0, n = 3 + Math.floor(R() * 4); q < n; q++) {
        const x = gx + (R() - 0.5) * 5, z = gz + (R() - 0.5) * 5, h = R();
        if (!free(x, z, 1.8)) continue;
        cushion(soft.get(x, z), x, gH(x, z), z, 0.7 + h * 0.6, 0.6 + h * 0.45, vary(mix3(FERN, gc(x, z), 0.15), R, 0.03), R); st.praprot++;
      }
    });
    // the hay meadow out past the mown bands
    walk(env, 9721, 4, 14, 26, (x, z) => nrLC(x, z) === 0 && nrSlope(x, z) < 0.7 ? 0.55 * f(x, z, -120, 45) * (1 - wood(x, z)) : 0, (gx, gz, k, R, free) => {
      for (let q = 0, n = 3 + Math.floor(R() * 4); q < n; q++) {
        const x = gx + (R() - 0.5) * 6, z = gz + (R() - 0.5) * 6, h = R();
        if (!free(x, z, 20)) continue;
        tuft(soft.get(x, z), x, gH(x, z), z, 0.45 + h * 0.45, 0.35 + h * 0.35, vary(up(mix3(gc(x, z), SEED, 0.2 + R() * 0.3), 1.3), R, 0.03), R, 4); st.seno++;
      }
    });
    soft.done();
    if (root) for (const g of root.children) if (g.isGroup) for (const m of g.children) if (m.userData.rob && m.name === 'rob') m.castShadow = false;   // (knee-high grass: no second draw in the shadow pass)
    return st;
  };
})();
