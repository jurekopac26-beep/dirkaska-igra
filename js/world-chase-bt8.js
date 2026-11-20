/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the eighth group of the real tracks, the rest of the shared
   world of the passes (js/world-prelaz.js: the look's own L.extra chained, as js/world-chase-bt6.js): Bâlea, Sa Calobra, Canaries,
   Savusavu and Koror. What is added goes into the builder's own scenery chunks (scen.get) and, for the grass, into meshes of its own
   that the animals' and the people's tests of a free place leave out, so only the named tracks change. What stands where follows
   each track's description (docs/proge/<id>.md). Nothing here is driven on: all of it is behind the barriers; the terrain, the road
   and the fences stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, { sstep } = API, BT = API.chaseBt, LK = API.PL_LOOK;
  if (!BT || !LK) return;
  const { karst, chain } = BT;   // (the sixth group's walk: ribs of rock along the hillside, bare patches, tufts and cushions in meshes of their own)
  const patchy = (P, ox, oz) => (x, z) => 0.5 + 0.5 * sstep(0.3, 0.7, P.c2(x * 1.3 + ox, z * 1.3 + oz));   // (in loose groups, not an even carpet)

  /* Bâlea: docs/proge/balea.md: »Pobočja ledeniške doline so alpski pašniki s šopi trave in nizkim cvetjem, v zaplatah ruševje in
     brin. Sivo-rjav kristalinski skrilavec v pečinah, ploščah in balvanih, melišča pod stenami«. Behind the barriers the pasture was
     a colour on smooth terrain from the camera behind the car. So within ~24 m of them tussocks of the pasture's grass stand in loose
     groups (green, some going to straw), dark low mats of the dwarf pine and the juniper among them, here and there a slab of the
     schist lies bare in the turf and low ribs of it come out along the hillside; on the scree more of the ribs. */
  if (LK.balea) chain(LK.balea, (ctx) => {
    const L = LK.balea, f = patchy(API.VR, -60, 115);
    ctx.out.rob = karst(ctx, 9661, { step: 3, reach: 22, rocky: 0.24, scree: 0.7, wood: 0.15, slab: 0.24, tufts: 4, scrub: 0.14, maxSl: 1.3, woodTufts: true, pale: 1.05, sides: 4, soft: true,
      rock: L.rockCols, bare: [0.53, 0.51, 0.47], dry: [0.44, 0.55, 0.26], gold: [0.64, 0.63, 0.36], shrub: [0.15, 0.26, 0.13],
      share: (c, x, z) => 0.65 * f(x, z) });
  });
  /* Sa Calobra: docs/proge/sacalobra.md: »Sive apnenčaste stene in skale (ponekod okraste), med njimi suha sredozemska makija (temni
     grmi), šopi trave càrritx na suhi travi, … rdeča zemlja (terra rossa) na brežinah ob cesti«. So within ~22 m of the low stone
     walls pale ribs of the limestone come out of the ground along the hillside, the red earth of the karst shows bare in low patches
     between them, and tufts of the dry grass stand in loose groups with dark cushions of the maquis among them. Few: the legs of the
     serpentines are all in view at once. */
  if (LK.sacalobra) chain(LK.sacalobra, (ctx) => {
    const L = LK.sacalobra, f = patchy(API.VR, 170, 55);
    ctx.out.rob = karst(ctx, 9677, { step: 3, reach: 20, rocky: 0.5, wood: 0.3, slab: 0.3, tufts: 3, scrub: 0.18, maxSl: 1.5, woodTufts: true, pale: 1.03, sides: 4, soft: true,
      rock: L.rockCols, bare: [0.55, 0.4, 0.3], dry: [0.62, 0.59, 0.4], gold: [0.76, 0.68, 0.42], shrub: [0.2, 0.27, 0.15],
      share: (c, x, z) => (c === 1 ? 0.4 : 0.75) * f(x, z) });
  });
  /* The three tropical coast roads: grass and low bush by the road, the red-brown soil bare where the rain washes it, hardly any rock.
     Canaries: docs/proge/canaries.md: »grmovje in trava po rabi tal; rdeče-rjava prst v vsekih, sivo-rjav andezit v pečinah«.
     Savusavu: docs/proge/savusavu.md: »trava na planoti. Rdečerjava vulkanska prst v usekih, temen bazalt v redkih pečinah«.
     Koror: docs/proge/koror.md: »palme in grmovje, trava ob cesti«; its rock (the look's own) is the islands' pale limestone.
     So within ~18 m of the barriers lush tufts of the grass stand in loose groups (thinner on the forest's floor), dark low bushes
     among them, the soil shows bare in low patches and only rarely a low rib of the rock comes out along the hillside. */
  const trop = (id, seed, ox, oz, C) => { if (LK[id]) chain(LK[id], (ctx) => {
    const L = LK[id], f = patchy(API.VR, ox, oz);
    ctx.out.rob = karst(ctx, seed, Object.assign({ step: 3, reach: 16, rocky: 0.05, scree: 0.4, ribLen: 0.6, wood: 0.03, slab: 0.26, tufts: 5, scrub: 0.16, maxSl: 1.2, woodTufts: true, pale: 1.0, sides: 4, soft: true,
      rock: L.rockCols, dry: [0.3, 0.52, 0.18], gold: [0.48, 0.56, 0.25], shrub: [0.12, 0.28, 0.1],
      share: (c, x, z) => (c === 1 ? 0.35 : 0.8) * f(x, z) }, C));
  }); };
  trop('canaries', 9679, 25, 190, { bare: [0.47, 0.3, 0.21] });
  trop('savusavu', 9689, -150, 40, { bare: [0.45, 0.28, 0.2] });
  trop('koror', 9697, 90, -130, { bare: [0.5, 0.36, 0.26], slab: 0.16 });
})();
