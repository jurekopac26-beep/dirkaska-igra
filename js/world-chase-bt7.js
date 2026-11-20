/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the seventh group of the real tracks, all on the shared world of
   the passes (js/world-prelaz.js: the look's own L.extra chained, as js/world-chase-bt6.js): Furka, Izoard, Gudauri, Porto Moniz and
   Kanaba. What is added goes into the builder's own scenery chunks (scen.get) and, for the grass, into meshes of its own that the
   animals' and the people's tests of a free place leave out, so only the named tracks change. What stands where follows each track's
   description (docs/proge/<id>.md). Nothing here is driven on: all of it is behind the barriers; the terrain, the road and the
   fences stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, { sstep } = API, BT = API.chaseBt, LK = API.PL_LOOK;
  if (!BT || !LK) return;
  const { karst, chain } = BT;   // (the sixth group's walk: ribs of rock along the hillside, bare patches, tufts and cushions in meshes of their own)
  const patchy = (P, ox, oz) => (x, z) => 0.5 + 0.5 * sstep(0.3, 0.7, P.c2(x * 1.3 + ox, z * 1.3 + oz));   // (in loose groups, not an even carpet)

  /* Furka: docs/proge/furka.md: »Pobočja so alpski pašniki s šopi trave in nizkim cvetjem, v zaplatah grmičevje«, »Svetlo siv granit
     in gnajs v pečinah, ploščah in balvanih«. Behind the barriers the pasture was a colour on smooth terrain from the camera behind
     the car. So within ~24 m of them tussocks of the pasture's grass stand in loose groups (green, some going to straw), a few low
     dark mats of the shrubs among them, here and there a slab of the ice-worn granite lies bare in the turf and low ribs of it come
     out along the hillside; on the scree and the rock more of the ribs. */
  if (LK.furka) chain(LK.furka, (ctx) => {
    const L = LK.furka, f = patchy(API.VR, 210, -35);
    ctx.out.rob = karst(ctx, 9611, { step: 3, reach: 22, rocky: 0.26, wood: 0.2, slab: 0.26, tufts: 4, scrub: 0.1, maxSl: 1.3, woodTufts: true, pale: 1.08, sides: 4, soft: true,
      rock: L.rockCols, bare: [0.55, 0.55, 0.53], dry: [0.47, 0.56, 0.27], gold: [0.68, 0.65, 0.38], shrub: [0.16, 0.27, 0.14],
      share: (c, x, z) => 0.62 * f(x, z) });
  });
  /* Izoard: docs/proge/izoard.md: »redek gozd macesnov … na travnatih tleh«, više »suhi alpski pašniki z brinom in grmičevjem, bledo
     sivi in okrasti apnenec in dolomit v pečinah, široka melišča pod prelazom«. So within ~24 m of the barriers tufts of the dry
     grass stand in loose groups (straw to gold; thinner on the forest's floor), dark cushions of juniper among them, pale ribs of
     the limestone come out along the hillside and the scree shows in low pale patches. */
  if (LK.izoard) chain(LK.izoard, (ctx) => {
    const L = LK.izoard, f = patchy(API.VR, -75, 160);
    ctx.out.rob = karst(ctx, 9623, { step: 3, reach: 22, rocky: 0.28, wood: 0.08, slab: 0.24, tufts: 4, scrub: 0.14, maxSl: 1.3, woodTufts: true, pale: 1.04, sides: 4, soft: true,
      rock: L.rockCols, bare: [0.6, 0.57, 0.5], dry: [0.6, 0.6, 0.35], gold: [0.76, 0.68, 0.4], shrub: [0.2, 0.3, 0.17],
      share: (c, x, z) => (c === 1 ? 0.35 : 0.8) * f(x, z) });
  });
  /* Gudauri: docs/proge/gudauri.md: »Pobočja so alpski travniki in pašniki, v zaplatah grmovje, … v strminah pečine in melišča«;
     the look: late-summer meadow, yellowing, grazed short, dark grey-brown andesite and shale. So within ~24 m of the barriers (never
     on the village's built ground) short tufts of the yellowing grass stand in loose groups, a few dark cushions of the shrubs, the
     trodden earth shows bare here and there and low dark ribs of the shale come out along the hillside. */
  if (LK.gudauri) chain(LK.gudauri, (ctx) => {
    const L = LK.gudauri, f = patchy(API.VR, 95, 240);
    ctx.out.rob = karst(ctx, 9629, { step: 3, reach: 22, rocky: 0.14, scree: 0.4, ribLen: 0.7, wood: 0.1, slab: 0.22, tufts: 4, scrub: 0.07, maxSl: 1.3, woodTufts: true, pale: 1.0, sides: 4, soft: true,
      rock: L.rockCols, bare: [0.52, 0.46, 0.37], dry: [0.62, 0.6, 0.34], gold: [0.8, 0.7, 0.4], shrub: [0.2, 0.28, 0.15],
      share: (c, x, z) => (c === 1 ? 0.3 : 0.8) * f(x, z) });
  });
  /* Porto Moniz: docs/proge/portomoniz.md: »Strmo pobočje je v terasah: suhi kamniti zidovi teras po plastnicah, med njimi pašniki
     in grmišča«; the look: the green of the terraces, the dark basalt, the red-brown of the tuff. So within ~18 m of the barriers
     lush tufts of the pasture's grass stand in loose groups on the terraces, a few dark cushions of the scrub, here and there the
     red-brown earth shows bare and a low rib of the dark basalt comes out along the hillside (few: the terraces' walls are the
     slope's stone). */
  if (LK.portomoniz) chain(LK.portomoniz, (ctx) => {
    const L = LK.portomoniz, f = patchy(API.VR, -180, -120);
    ctx.out.rob = karst(ctx, 9631, { step: 3, reach: 16, rocky: 0.08, scree: 0.4, ribLen: 0.6, wood: 0.05, slab: 0.14, tufts: 3, scrub: 0.1, maxSl: 1.2, pale: 1.0, sides: 4, soft: true,
      rock: L.rockCols, bare: [0.44, 0.34, 0.27], dry: [0.36, 0.52, 0.22], gold: [0.54, 0.57, 0.29], shrub: [0.15, 0.27, 0.12],
      share: (c, x, z) => (c === 1 ? 0.2 : 0.62) * f(x, z) });
  });
  /* Kanaba: docs/proge/kanaba.md: »zelena polja in pašniki na rdeči prsti, gozdni pasovi in grmičevje, rdeče-rjava preperela kamnina
     v useku«. So within ~22 m of the barriers tufts of the green grass stand in loose groups, the red soil shows bare in low patches
     between them (the paths and the fields' edges), a few dark cushions of the scrub, and only rarely a low red-brown rib of the
     weathered rock (little bare rock here). */
  if (LK.kanaba) chain(LK.kanaba, (ctx) => {
    const L = LK.kanaba, f = patchy(API.VR, 130, -210);
    ctx.out.rob = karst(ctx, 9643, { step: 3, reach: 20, rocky: 0.07, wood: 0.04, slab: 0.3, tufts: 5, scrub: 0.1, maxSl: 1.2, woodTufts: true, pale: 1.0, sides: 4, soft: true,
      rock: L.rockCols, bare: [0.4, 0.26, 0.19], dry: [0.36, 0.52, 0.2], gold: [0.52, 0.57, 0.27], shrub: [0.16, 0.27, 0.11],
      share: (c, x, z) => (c === 1 ? 0.3 : 0.8) * f(x, z) });
  });
})();
