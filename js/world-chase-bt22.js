/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the twenty-second group of the real tracks: Luanda and Mombasa,
   the two city courses with builders of their own (js/world-luanda.js, js/world-mombasa.js). Each builder calls its World.ext.<id>Rob
   (js/world-realizem-bt4.js: sparse tufts, bare earth, Mombasa's coral stones) just before its scenery is closed; here that hook is
   chained, so the earlier groups' plants stay and the shared bands of js/world-chase-bt11.js (goreRob) are added on the corridor's
   ground, slope, land cover and nearest road (nrGround, nrSlope, nrLC, nrNear). From the camera behind the car both were one even face
   of dusty ground between the concrete barriers and the houses, a few small tufts on it. What stands where follows the tracks'
   descriptions (docs/proge/luanda.md, docs/proge/mombasa.md): nothing on the road, the houses, their yards and squares (the builders'
   own `excluded`), the sea's edge or the fortress; in the built-up parts less than on the open ground. The terrain, the road, the
   barriers, the houses and the trees stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.goreRob || !World.ext.goreRob.LOOK) return;
  const API = World.api, BT = API.chaseBt, { vary } = API;
  if (!BT || !BT.tuft) return;
  const { tuft, cushion, mix3 } = BT, LOOK = World.ext.goreRob.LOOK;

  /* the land cover's share (ESA WorldCover: 0 grass, 1 trees, 2 shrub, 3 built, 4 bare, 5 water): in the city most of the corridor is
     "built", but the builders' `excluded` already keeps the houses and their yards clear, so the ground left there is the dusty strip
     and the waste ground between them: there less than on the open ground */
  const cov = (c, open, wood, built) => c === 0 || c === 2 || c === 4 ? open : c === 1 ? wood : c === 3 ? built : 0;

  /* Luanda: docs/proge/luanda.md: »palme, drevesa z okroglimi krošnjami in baobabi na suhih rdečih tleh«, »betonske ločilne ograje
     mestnih cest«. From the camera behind the car the dry red ground was one even face. So along the barriers' foot the dry season's
     grass in straw tufts on red dust; between them low patches of the bare red earth and, under the round-crowned trees, their fallen
     brown leaves with low grey-green bushes; out on the open ground taller dry tussocks in loose groups, some still olive. */
  LOOK.luanda = { seed: 22101, st: ['trava', 'grmi', 'prst', 'listje'],
    edge: { ok: (c, sl) => sl >= 0.9 ? 0 : cov(c, 0.8, 0.6, 0.45), n: [3, 5],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.3 + h * 0.24, 0.32 + h * 0.3, vary(mix3(S.c.straw, S.c.pale, R()), R, 0.03), R, 5); S.st.trava++; } },
    mid: { ok: (c, sl, x, z, w) => sl > 1.0 ? 0 : cov(c, 0.7, 0.7, 0.4), n: [2, 4], litter: 0.5, lit: 'red', lr: [1.0, 2.2], ln: 'prst', wood: true,
      put: (S, x, y, z, h, R, w) => { if (w > 0.3 ? R() < 0.5 : R() < 0.2) { cushion(S.g(x, z), x, y, z, 0.45 + h * 0.4, 0.3 + h * 0.25, vary(S.c.bush, R, 0.03), R); S.st.grmi++; }
        else { tuft(S.g(x, z), x, y, z, 0.34 + h * 0.26, 0.38 + h * 0.34, vary(mix3(S.c.straw, S.c.olive, R() * 0.6), R, 0.03), R, 5); S.st.trava++; } } },
    far: { ok: (c, sl, x, z, w) => sl > 0.9 ? 0 : cov(c, 0.55, 0.35, 0.25) * (1 - w * 0.4), n: [2, 4], litter: 0.3, lit: 'leaf', lr: [1.0, 2.0], ln: 'listje', litW: true,
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.44 + h * 0.3, 0.5 + h * 0.4, vary(mix3(S.c.straw, S.c.olive, R() < 0.3 ? 0.7 : 0.15), R, 0.03), R, 5); S.st.trava++; } },
    col: { straw: [0.78, 0.66, 0.4], pale: [0.86, 0.76, 0.52], olive: [0.54, 0.53, 0.3], bush: [0.5, 0.56, 0.38], red: [0.62, 0.38, 0.27], leaf: [0.56, 0.42, 0.28] } };

  /* Mombasa: docs/proge/mombasa.md: »palme in drevesa na rdečkastih tleh«, »ločilne ograje mestnih cest«, the coast's island. From the
     camera behind the car the reddish ground was one even face. So along the barriers' foot the coast's green grass in tufts (straw
     where it is dry); between them low patches of the bare reddish earth and, under the trees, low green bushes and their fallen
     leaves; out on the open ground taller grass in loose groups. (The coral stones by the shore are js/world-realizem-bt4.js's.) */
  LOOK.mombasa = { seed: 22201, st: ['trava', 'grmi', 'prst', 'listje'],
    edge: { ok: (c, sl) => sl >= 0.9 ? 0 : cov(c, 0.8, 0.65, 0.45), n: [3, 5],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.3 + h * 0.24, 0.34 + h * 0.32, vary(mix3(S.c.green, S.c.straw, R() < 0.35 ? 0.4 + R() * 0.6 : R() * 0.3), R, 0.03), R, 5); S.st.trava++; } },
    mid: { ok: (c, sl, x, z, w) => sl > 1.0 ? 0 : cov(c, 0.7, 0.75, 0.4), n: [2, 4], litter: 0.45, lit: 'red', lr: [1.0, 2.0], ln: 'prst', wood: true,
      put: (S, x, y, z, h, R, w) => { if (w > 0.3 ? R() < 0.55 : R() < 0.25) { cushion(S.g(x, z), x, y, z, 0.45 + h * 0.45, 0.32 + h * 0.3, vary(mix3(S.c.bush, S.c.green, R() * 0.4), R, 0.03), R); S.st.grmi++; }
        else { tuft(S.g(x, z), x, y, z, 0.34 + h * 0.26, 0.4 + h * 0.36, vary(mix3(S.c.green, S.c.lime, R()), R, 0.03), R, 5); S.st.trava++; } } },
    far: { ok: (c, sl, x, z, w) => sl > 0.9 ? 0 : cov(c, 0.55, 0.4, 0.25) * (1 - w * 0.4), n: [2, 4], litter: 0.3, lit: 'leaf', lr: [1.0, 2.0], ln: 'listje', litW: true,
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.44 + h * 0.3, 0.55 + h * 0.42, vary(mix3(S.c.green, S.c.straw, R() * 0.5), R, 0.03), R, 5); S.st.trava++; } },
    col: { green: [0.42, 0.53, 0.24], lime: [0.55, 0.6, 0.3], straw: [0.74, 0.67, 0.42], bush: [0.34, 0.47, 0.22], red: [0.6, 0.4, 0.3], leaf: [0.54, 0.44, 0.3] } };

  /* each builder's hook chained (after js/world-realizem-bt4.js's): the bands on the corridor's ground, never on the sea's edge or by
     the fortress; what they count in out.stats.rob.robBt22. The builders pass their root and out (matV) for the bands' own meshes. */
  for (const id of ['luanda', 'mombasa']) {
    const key = id + 'Rob', base = World.ext[key];
    World.ext[key] = function (ctx) {
      const r = (base ? base.call(this, ctx) : null) || {};
      try {
        const { nrGround, nrSlope, nrLC, nrNear } = API, { seaD, inFort } = ctx;
        const bad = (x, z) => (seaD && seaD(x, z) > -4) || (inFort && inFort(x, z, 6));
        if (ctx.root && ctx.out) r.robBt22 = World.ext.goreRob({ excluded: ctx.excluded, root: ctx.root, out: ctx.out }, id, { gH: nrGround, slope: nrSlope, lc: nrLC, near: nrNear, bad });
      } catch (e) { console.error('chase-bt22 (' + id + '):', e); }
      return r;
    };
  }
})();
