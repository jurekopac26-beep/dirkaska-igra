/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the thirty-third group of the real tracks: Aguascalientes and
   Bathurst, a second pass on two circuits of the shared builder (js/world-rbring.js). Their ground so far: the look's colours and the
   tufts of js/world-realizem-bt.js (Bathurst) and js/world-realizem-bt3.js (Aguascalientes) within ~35 m of the fences. From behind the
   car the strip at the walls' foot and the ground past ~35 m were still one even face. Here the eleventh group's three bands
   (World.ext.goreRob: edge 0.5-3.5 m, mid 1-14 m, far 6-30 m, in meshes of their own) with each track's own land cover, and a fourth band
   of loose tussock groups from ~30 to ~60 m in the builder's own scenery chunks (no draw calls of its own). What stands where follows
   docs/proge/aguascalientes.md and docs/proge/bathurst.md: nothing on the road, never on the pits' side along the pits, nothing in the
   build's excluded places (stands, camps, buildings, car parks). The terrain, the road, the walls, the trees and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.goreRob || !World.ext.goreRob.LOOK) return;
  const API = World.api, BT = API.chaseBt, { vary, sstep } = API;
  if (!BT || !BT.tuft || !BT.cushion || !BT.walk || !BT.mix3 || !BT.soil) return;
  const { tuft, cushion, walk, mix3, soil } = BT, LOOK = World.ext.goreRob.LOOK;

  /* the land cover's share (ESA WorldCover: 0 grass, 1 trees, 2 shrub, 3 built, 4 bare, 5 water) */
  const cov = (c, grass, wood, shrub, built, bare) => c === 0 ? grass : c === 1 ? wood : c === 2 ? shrub : c === 3 ? built : c === 4 ? bare : 0;

  /* Aguascalientes: docs/proge/aguascalientes.md: »suha trava planote (zlata z olivnimi krpami, ob jarkih bolj zelena), grmičevje in
     redka drevesa«, »zunaj 1,1 m visok betonski zid tik ob asfaltu«. So at the walls' foot a thin strip of the plateau's golden grass,
     some olive; between, low grey-green scrub cushions and patches of the bare brown earth; out on the open plain taller tussocks in
     loose groups, greener where the ground lies low (the ditches). */
  LOOK.aguascalientes = { seed: 33101, st: ['trava', 'grmi', 'prst'],
    edge: { ok: (c, sl) => sl >= 0.9 ? 0 : cov(c, 0.8, 0.6, 0.7, 0.3, 0.55), n: [3, 5],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.26 + h * 0.2, 0.28 + h * 0.26, vary(mix3(S.c.gold, S.c.olive, R() < 0.3 ? 0.6 + R() * 0.4 : R() * 0.25), R, 0.03), R, 5); S.st.trava++; } },
    mid: { ok: (c, sl) => sl > 1.0 ? 0 : cov(c, 0.65, 0.65, 0.85, 0.3, 0.5), n: [2, 4], litter: 0.5, lit: 'earth', lr: [1.0, 2.4], ln: 'prst',
      put: (S, x, y, z, h, R) => { if (R() < 0.4) { cushion(S.g(x, z), x, y, z, 0.45 + h * 0.4, 0.28 + h * 0.24, vary(S.c.scrub, R, 0.03), R); S.st.grmi++; }
        else { tuft(S.g(x, z), x, y, z, 0.32 + h * 0.24, 0.36 + h * 0.3, vary(mix3(S.c.gold, S.c.tan, R()), R, 0.03), R, 5); S.st.trava++; } } },
    far: { ok: (c, sl) => sl > 0.9 ? 0 : cov(c, 0.55, 0.4, 0.65, 0.2, 0.35), n: [2, 4],
      put: (S, x, y, z, h, R) => { const g = API.nrGround, low = (g(x + 6, z) + g(x - 6, z) + g(x, z + 6) + g(x, z - 6)) / 4 > y + 0.25;   // (a hollow: a ditch)
        tuft(S.g(x, z), x, y, z, 0.42 + h * 0.3, 0.46 + h * 0.4, vary(mix3(S.c.gold, S.c.green, R() < (low ? 0.6 : 0.2) ? 0.6 + R() * 0.4 : R() * 0.2), R, 0.03), R, 5); S.st.trava++; } },
    col: { gold: [0.78, 0.66, 0.38], tan: [0.68, 0.58, 0.38], olive: [0.46, 0.47, 0.25], green: [0.42, 0.5, 0.26], scrub: [0.46, 0.5, 0.34], earth: [0.56, 0.44, 0.32] } };

  /* Bathurst: docs/proge/bathurst.md: »pomladni pašniki so zeleni in olivni, ponekod se že sušijo v slamnato rumeno, v kotanjah so bolj
     zeleni, trava je v šopih (… pegami rdeče-rjave prsti)«, »odprti gozd« of gums, wattles on the scrub, the ridge's concrete walls
     1.5 m off the road. So at the walls' and the fences' foot the uncut pasture grass in tufts, straw where it dries; under the gums
     their grey-brown litter of bark strips and leaves with low wattle cushions; out on the pasture taller tussocks in loose groups,
     greener in the hollows, with the red-brown soil bare between them. */
  LOOK.bathurst = { seed: 33201, st: ['trava', 'blazine', 'listje', 'prst'],
    edge: { ok: (c, sl) => sl >= 0.9 ? 0 : cov(c, 0.9, 0.7, 0.8, 0.35, 0.5), n: [3, 5],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.3 + h * 0.22, 0.34 + h * 0.3, vary(mix3(S.c.grass, S.c.straw, R() < 0.35 ? 0.55 + R() * 0.45 : R() * 0.3), R, 0.03), R, 5); S.st.trava++; } },
    mid: { ok: (c, sl, x, z, w) => sl > 1.0 ? 0 : c === 1 ? 0.75 : Math.max(cov(c, 0.6, 0, 0.8, 0.25, 0.45), w > 0.3 ? 0.6 : 0), n: [2, 3], litter: 0.45, lit: 'bark', lr: [1.0, 2.2], ln: 'listje', wood: true, litW: true,
      put: (S, x, y, z, h, R, w) => { if ((w > 0.3 || API.nrLC(x, z) === 2) && R() < 0.45) { cushion(S.g(x, z), x, y, z, 0.4 + h * 0.4, 0.22 + h * 0.2, vary(mix3(S.c.wattle, S.c.grass, R() * 0.4), R, 0.03), R); S.st.blazine++; }
        else { tuft(S.g(x, z), x, y, z, 0.32 + h * 0.26, 0.36 + h * 0.32, vary(mix3(S.c.grass, S.c.olive, R()), R, 0.03), R, 5); S.st.trava++; } } },
    far: { ok: (c, sl, x, z, w) => sl > 0.9 ? 0 : cov(c, 0.6, 0.35, 0.55, 0.15, 0.35) * (1 - w * 0.4), n: [2, 4], litter: 0.25, lit: 'soil', lr: [1.0, 2.0], ln: 'prst',
      put: (S, x, y, z, h, R) => { const g = API.nrGround, low = (g(x + 6, z) + g(x - 6, z) + g(x, z + 6) + g(x, z - 6)) / 4 > y + 0.3;   // (a hollow: greener)
        tuft(S.g(x, z), x, y, z, 0.4 + h * 0.32, 0.42 + h * 0.4, vary(low ? mix3(S.c.lush, S.c.grass, R() * 0.5) : mix3(S.c.grass, S.c.straw, R() * 0.8), R, 0.03), R, 5); S.st.trava++; } },
    col: { grass: [0.4, 0.5, 0.24], olive: [0.42, 0.45, 0.24], straw: [0.72, 0.66, 0.42], lush: [0.34, 0.5, 0.22], wattle: [0.36, 0.44, 0.22], bark: [0.5, 0.42, 0.33], soil: [0.5, 0.33, 0.22] } };

  /* the fourth band, ~30-60 m past the fences: loose tussock groups (with a bare patch now and then) in the builder's own scenery chunks,
     so the ground the camera sees before the horizon is not one smooth colour; only on grass and scrub, never on slopes */
  const FAR2 = {
    aguascalientes: { seed: 33151, k: 0.45, bare: 0.25, h: [0.4, 0.4], w: [0.45, 0.4], col: (x, z, R) => { const P = API.NR, dry = P ? sstep(0.42, 0.7, P.n3(x * 0.7 + 60, z * 0.7 - 130)) : 0.5;
      return mix3([0.66, 0.58, 0.36], [0.8, 0.68, 0.38], Math.min(1, dry * 0.8 + R() * 0.3)); }, soil: [0.58, 0.46, 0.33] },
    bathurst: { seed: 33251, k: 0.36, bare: 0.2, h: [0.38, 0.4], w: [0.45, 0.45], col: (x, z, R) => { const P = API.NR, dry = P ? sstep(0.5, 0.74, P.n3(x * 0.8 + 90, z * 0.8 - 40)) : 0.3;
      return mix3([0.38, 0.48, 0.22], [0.72, 0.65, 0.4], Math.min(1, dry * 0.9 + R() * 0.2)); }, soil: [0.48, 0.32, 0.21] },
  };
  const far2 = (id, ctx, env, st) => {
    const F = FAR2[id], { nrGround: gH, nrLC, nrSlope } = API, scen = ctx.scen; if (!F || !scen || !gH) return;
    st.dalj = 0; st.daljPrst = 0;
    walk(env, F.seed, 6, 30, 30, (x, z) => { const c = nrLC(x, z); return (c === 0 || c === 2) && nrSlope(x, z) < 0.8 ? F.k : 0; }, (gx, gz, k, R, free) => {
      if (R() < F.bare && free(gx, gz, 4)) { soil(scen, gH, gx, gz, 1.2 + R() * 1.6, vary(F.soil, R, 0.03), R, 0.05); st.daljPrst++; }
      for (let q = 0, n = 3 + Math.floor(R() * 4); q < n; q++) {
        const x = gx + (R() - 0.5) * 7, z = gz + (R() - 0.5) * 7, h = R();
        if (!free(x, z, 3) || env.excluded(x, z) || nrLC(x, z) > 2) continue;
        tuft(scen.get(x, z), x, gH(x, z), z, F.w[0] + h * F.w[1], F.h[0] + h * F.h[1], vary(F.col(x, z, R), R, 0.03), R, 5); st.dalj++;
      } });
  };

  /* each look's own LK.extra chained (after js/world-realizem-bt.js's and js/world-realizem-bt3.js's): never on the pits' side along the
     pits; what they count in out.stats.extra.robBt33 */
  for (const id of ['aguascalientes', 'bathurst']) {
    const L = (API.rbLook || {})[id];
    if (!L) continue;
    const base = L.extra;
    L.extra = function (ctx) {
      const r = (base ? base.call(this, ctx) : null) || {};
      try {
        const T = API.T, pd = T && T.def.pit, ps = pd ? (pd[0] < 0 ? -1 : 1) : 0, { nrGround, nrSlope, nrLC, nrNear } = API;
        const bad = (x, z) => { if (!ps) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === ps && !!T.pitAt(q.i * T.ds); };
        r.robBt33 = World.ext.goreRob({ excluded: ctx.excluded, root: ctx.root, out: ctx.out }, id, { gH: nrGround, slope: nrSlope, lc: nrLC, near: nrNear, bad });
        far2(id, ctx, { near: nrNear, excluded: (x, z) => ctx.excluded(x, z) || bad(x, z), pit: (s, sd) => !!ps && sd === ps && !!T.pitAt(s) }, r.robBt33);
      } catch (e) { console.error('chase-bt33 (' + id + '):', e); }
      return r;
    };
  }
})();
