/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the fourth group of the real tracks (after
   js/world-realizem-bt3.js's): Luanda, Mombasa, El Jem. These have their own builders (js/world-<id>.js), so each calls its hook here
   (World.ext.<id>Rob) just before its scenery chunks are closed; what is added goes into those chunks (scen.get), so no draw is added,
   and only the named tracks change. What stands where follows each track's description (docs/proge/<id>.md). Nothing here is driven
   on: all of it is behind the barriers, off the built ground, the sea and what the build keeps clear.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, { TAU, lerp, rng, rock, vary, cone, sstep } = API;
  const side = (T, s, sd, o) => { const i = T.idx(s), d = sd * ((sd > 0 ? T.br[i] : T.bl[i]) + o); return [T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d]; };
  const tuft = (g, x, y, z, w, h, col, R) => cone(g, x, y - 0.08, z, w, h, 5, [col[0] * 0.62, col[1] * 0.66, col[2] * 0.6], col, R() * TAU);
  const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const soil = (scen, gH, gx, gz, rr, col, R) => {   // bare ground: a low irregular patch lying on the terrain
    const k = 7, a0 = R() * TAU, rim = [col[0] * 0.9 + 0.05, col[1] * 0.9 + 0.07, col[2] * 0.9 + 0.03], g = scen.get(gx, gz), ctr = [gx, gH(gx, gz) + 0.07, gz], P = [];
    for (let q = 0; q < k; q++) { const a = a0 + q / k * TAU, r = rr * (0.65 + R() * 0.6), x = gx + Math.cos(a) * r, z = gz + Math.sin(a) * r * 0.75; P.push([x, gH(x, z) + 0.05, z]); }
    for (let q = 0; q < k; q++) g.triO(ctr, P[q], P[(q + 1) % k], col, [gx, ctr[1] - 5, gz], rim, rim); };

  /* the common walk: every `step` m on both sides a group's place to `reach` m behind the barriers; ok(x, z): the strength there (0–1;
     0 = nothing stands), given the builder's own tests (excluded, the sea, the fortress); each(gx, gz, k, R) plants the group */
  const walk = (ctx, seed, step, reach, o0, ok, each) => {
    const T = API.T, { nrGround, nrNear, NR: P } = API; if (!T || !P || !nrGround || !T.br) return null;
    const R = rng(seed), smooth0 = API.ROCK_SMOOTH, { excluded, seaD, inFort } = ctx;
    const free = (x, z, r) => { const q = nrNear(x, z); return !(q.i >= 0 && q.dd < r) && !excluded(x, z) && !(seaD && seaD(x, z) > -3) && !(inFort && inFort(x, z, 6)); };
    for (let s = 0; s < T.len; s += step) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(), o = o0 + Math.pow(r1, 1.4) * reach, [gx, gz] = side(T, s + (r2 - 0.5) * step, sd, o);
      if (!free(gx, gz, 2.5)) continue;
      const k = ok(gx, gz); if (!(k > 0.05) || r0 > k) continue;
      each(gx, gz, k, R, free);
    }
    API.ROCK_SMOOTH = smooth0; return true;
  };
  /* the ground's share by OSM's land cover: open ground and scrub whole, under the trees and between the houses (the builder's own
     `excluded` keeps the houses, the yards and the squares clear) less */
  const open = (x, z) => { const c = API.nrLC(x, z); return c === 0 || c === 2 ? 1 : c === 1 ? 0.6 : 0.7; };

  /* Luanda: docs/proge/luanda.md: »palme, drevesa z okroglimi krošnjami in baobabi na suhih rdečih tleh«. Between the trees the dry
     red ground was a colour on smooth terrain from the camera behind the car. So on the open ground within ~30 m of the barriers
     tufts of dry grass stand in loose groups (straw to dry olive), and here and there the red earth lies bare in a low patch. */
  World.ext.luandaRob = (ctx) => {
    const { nrGround, nrSlope, NR: P } = API, { scen } = ctx, straw = [0.8, 0.68, 0.42], pale = [0.86, 0.74, 0.5], olive = [0.56, 0.54, 0.3], red = [0.74, 0.44, 0.3]; let n = 0, m = 0;
    const ok = (x, z) => open(x, z) * (0.45 + 0.45 * sstep(0.35, 0.7, P.n3(x * 0.7 + 30, z * 0.7 - 80)));
    API.ROCK_SMOOTH = true;
    walk(ctx, 9471, 4, 28, 2.5, ok, (gx, gz, k, R, free) => {
      const ol = sstep(0.55, 0.8, P.n1(gx * 1.1 - 60, gz * 1.1 + 210));
      if (R() < 0.16 && nrSlope(gx, gz) < 0.4 && free(gx, gz, 5)) { soil(scen, nrGround, gx, gz, 1.2 + R() * 1.6, vary(red, R, 0.03), R); m++; }
      for (let q = 0, cnt = 4 + Math.floor(R() * 5); q < cnt; q++) {
        const x = gx + (R() - 0.5) * 7, z = gz + (R() - 0.5) * 7, h = R(), a = R();
        if (!free(x, z, 2.4)) { R(); continue; }
        const col = a < 0.5 * ol ? olive : mix3(straw, pale, a);
        tuft(scen.get(x, z), x, nrGround(x, z), z, 0.45 + h * 0.55, 0.32 + h * 0.42, vary(col, R, 0.03), R); n++; }
    });
    return { sopi: n, prst: m };
  };

  /* Mombasa: docs/proge/mombasa.md: »palme in drevesa na rdečkastih tleh«, the fortress »na koralnem grebenu«, »okraste koralne
     skale«. The reddish ground was a colour on smooth terrain from the camera behind the car. So on the open ground within ~30 m of
     the barriers tufts of the coast's grass stand in loose groups (green to straw), and within ~70 m of the shore the island's own
     ochre coral rock shows in loose low stones. */
  World.ext.mombasaRob = (ctx) => {
    const { nrGround, NR: P } = API, { scen, seaD } = ctx, green = [0.42, 0.52, 0.24], lime = [0.56, 0.6, 0.3], straw = [0.72, 0.66, 0.4];
    const coral = [[0.78, 0.68, 0.5], [0.7, 0.6, 0.44], [0.84, 0.76, 0.6], [0.62, 0.55, 0.43]]; let n = 0, m = 0;
    const ok = (x, z) => open(x, z) * (0.45 + 0.45 * sstep(0.35, 0.7, P.n3(x * 0.7 - 120, z * 0.7 + 50)));
    API.ROCK_SMOOTH = true;
    walk(ctx, 9473, 4, 28, 2.5, ok, (gx, gz, k, R, free) => {
      const dry = sstep(0.5, 0.8, P.n1(gx * 1.1 + 140, gz * 1.1 - 30));
      for (let q = 0, cnt = 4 + Math.floor(R() * 5); q < cnt; q++) {
        const x = gx + (R() - 0.5) * 7, z = gz + (R() - 0.5) * 7, h = R(), a = R();
        if (!free(x, z, 2.4)) { R(); continue; }
        const col = a < 0.55 * dry ? straw : mix3(green, lime, a);
        tuft(scen.get(x, z), x, nrGround(x, z), z, 0.45 + h * 0.6, 0.34 + h * 0.46, vary(col, R, 0.03), R); n++; }
    });
    API.ROCK_SMOOTH = false;
    const okS = (x, z) => { if (API.nrLC(x, z) >= 3) return 0; const d = seaD ? seaD(x, z) : -1e9; return d > -70 ? 0.25 + 0.3 * sstep(-70, -15, d) : 0; };
    walk(ctx, 9479, 7, 26, 3, okS, (gx, gz, k, R, free) => {
      for (let q = 0, cnt = 3 + Math.floor(R() * 5); q < cnt; q++) {
        const x = gx + (R() - 0.5) * 6, z = gz + (R() - 0.5) * 6, w = 0.2 + Math.pow(R(), 2.2) * 0.75;
        if (API.nrLC(x, z) >= 3 || !free(x, z, 2.2 + w)) { R(); R(); continue; }
        rock(scen.get(x, z), x, nrGround(x, z) + w * 0.14, z, w * 1.4, w * 0.55, w, R() * TAU, vary(coral[Math.floor(R() * coral.length)], R, 0.03), R, 0.34, 0.35); m++; }
    });
    return { sopi: n, kamni: m };
  };
  /* El Jem: docs/proge/eljem.md: »oljke in palme na suhih okrastih tleh«. Between the olives the dry ochre ground of the Sahel was a
     colour on smooth terrain from the camera behind the car. So on the open ground within ~30 m of the barriers, where the ground's
     own colour already shows dry grass (the same noise as the builder's colFn), sparse tufts of it stand in loose groups (straw to
     pale ochre), thinner elsewhere, and here and there the pale dust lies bare in a low patch. */
  World.ext.eljemRob = (ctx) => {
    const { nrGround, nrSlope, NR: P } = API, { scen } = ctx, straw = [0.72, 0.68, 0.42], pale = [0.84, 0.74, 0.5], dust = [0.86, 0.72, 0.54]; let n = 0, m = 0;
    const ok = (x, z) => open(x, z) * (0.38 + 0.5 * sstep(0.45, 0.8, P.n2(x, z)));
    API.ROCK_SMOOTH = true;
    walk(ctx, 9483, 3, 28, 2.5, ok, (gx, gz, k, R, free) => {
      if (R() < 0.1 && nrSlope(gx, gz) < 0.4 && free(gx, gz, 5)) { soil(scen, nrGround, gx, gz, 0.9 + R() * 1.1, vary(dust, R, 0.03), R); m++; }
      for (let q = 0, cnt = 3 + Math.floor(R() * 5); q < cnt; q++) {
        const x = gx + (R() - 0.5) * 7, z = gz + (R() - 0.5) * 7, h = R(), a = R();
        if (!free(x, z, 2.4)) { R(); continue; }
        tuft(scen.get(x, z), x, nrGround(x, z), z, 0.45 + h * 0.5, 0.3 + h * 0.4, vary(mix3(straw, pale, a), R, 0.03), R); n++; }
    });
    return { sopi: n, prst: m };
  };
})();
