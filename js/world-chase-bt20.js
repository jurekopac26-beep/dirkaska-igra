/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the twentieth group of the real tracks: Medeu (the world of the
   passes, js/world-prelaz.js: the look's own L.extra chained after its landmarks in js/world-medeu.js, as js/world-chase-bt6.js) and
   Ngorongoro (its own builder, js/world-ngorongoro.js: it calls World.ext.goreRob after placing the animals, with its own ground, slope
   and a land cover that marks the streams' green margins as class 6, and keeps the animals' places and the stream beds free).
   What is added goes into meshes of its own (softScen: 256 m chunks, no shadow), so only these two tracks change; nothing is driven on,
   all of it is behind the barrier line. What stands where follows docs/proge/<id>.md.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, sstep } = API;
  if (!BT || !BT.tuft) return;
  const { tuft, cushion, mix3, karst, chain } = BT;

  /* Medeu: docs/proge/medeu.md: late summer in the Ile Alatau: the Tian Shan spruce on the shady slopes, the sunny ones yellowing
     meadow with wild apple, hawthorn and juniper scrub, grey granite with a pink cast in crags and boulder fields. Behind the barriers
     the meadow was a colour on smooth terrain from the camera behind the car. So within ~22 m of them the meadow's grass stands in
     tussocks in loose groups (green going to straw), dark low cushions of the juniper and the young apple and hawthorn among them,
     the granite comes out of the ground in low ribs along the hillside, more of it on the boulder fields; under the spruces only a few
     ribs and the tufts thinner. Nothing in the town, on the dam's works or in the water (karst leaves classes 3, 5 and 6 free). */
  const LK = API.PL_LOOK;
  if (LK && LK.medeu && karst && chain) chain(LK.medeu, (ctx) => {
    const L = LK.medeu, P = API.VR, f = (x, z) => 0.5 + 0.5 * sstep(0.3, 0.7, P.c2(x * 1.3 - 75, z * 1.3 + 140));   // (in loose groups, not an even carpet)
    ctx.out.rob = karst(ctx, 20101, { step: 3, reach: 22, rocky: 0.22, scree: 0.75, wood: 0.12, slab: 0.18, tufts: 4, scrub: 0.2, maxSl: 1.3, woodTufts: true, pale: 1.02, sides: 4, soft: true,
      rock: L.rockCols, bare: [0.52, 0.47, 0.42], dry: L.grass, gold: L.grassDry, shrub: [0.17, 0.27, 0.14],
      share: (c, x, z) => (c === 1 ? 0.3 : c === 4 ? 0.6 : 0.75) * f(x, z) });
    // (knee-high grass throws no shadow worth a second draw of it in the shadow pass: as Bâlea)
    if (ctx.root) for (const g of ctx.root.children) if (g.isGroup) for (const m of g.children) if (m.userData.rob && m.name === 'rob') m.castShadow = false;
  });

  /* Ngorongoro: docs/proge/ngorongoro.md: the dry season on the crater's wall: the grass yellow-brown, straw where it is dry and
     greener in the hollows, the red-brown volcanic soil bare in patches, darker shrubs, the rim's forest, green strips along the
     streams, grey-brown rock on the steep ground. At the barrier's foot the tawny grass in tussocks; behind them more tussocks with
     the red soil bare between, the dark shrubs' low cushions where the map has shrubland and under the rim's trees; by the streams
     (class 6) the greener grass; farther out the taller tussocks in loose groups and a low shrub now and then. Nothing on the built
     ground, the bare rock's steep parts, the stream beds or where the animals graze, lie or cross (the builder's o.bad). */
  if (World.ext && World.ext.goreRob && World.ext.goreRob.LOOK) World.ext.goreRob.LOOK.ngorongoro = { seed: 20201, st: ['sopi', 'grmi', 'prst'],
    edge: { ok: (c, sl) => (c === 0 || c === 2 || c === 6) && sl < 0.9 ? 0.75 : c === 4 && sl < 0.7 ? 0.3 : 0, n: [2, 4],
      put: (S, x, y, z, h, R) => { const c = S.c, g = S.g(x, z), wet = S.lc(x, z) === 6;
        tuft(g, x, y - 0.04, z, 0.28 + h * 0.2, 0.36 + h * 0.34, vary(wet ? mix3(c.green, c.tawny, R() * 0.4) : mix3(c.tawny, c.straw, R()), R, 0.03), R, 5); S.st.sopi++; } },
    mid: { ok: (c, sl, x, z, w) => (c === 3 || c === 5 || sl > 1.0) ? 0 : c === 4 ? 0.25 : c === 2 || c === 1 || w > 0.3 ? 0.8 : 0.6, n: [2, 4], litter: 0.4, lit: 'soil', lr: [1.0, 2.0], ln: 'prst', wood: true,
      put: (S, x, y, z, h, R, w) => { const c = S.c, g = S.g(x, z), k = S.lc(x, z);
        if ((k === 2 || k === 1 || w > 0.3) && R() < 0.5) { cushion(g, x, y - 0.04, z, 0.6 + h * 0.6, 0.4 + h * 0.4, vary(R() < 0.6 ? c.shrub : c.shrub2, R, 0.025), R); S.st.grmi++; }
        else { tuft(g, x, y - 0.04, z, 0.34 + h * 0.26, 0.45 + h * 0.4, vary(k === 6 ? c.green : mix3(c.tawny, c.straw, R() * 0.7), R, 0.03), R, 5); S.st.sopi++; } } },
    far: { ok: (c, sl, x, z, w) => (c === 0 || c === 2 || c === 6) && sl < 0.85 ? 0.45 * (1 - w * 0.6) : 0, n: [2, 4],
      put: (S, x, y, z, h, R) => { const c = S.c, g = S.g(x, z);
        if (R() < 0.15) { cushion(g, x, y - 0.04, z, 0.8 + h * 0.6, 0.5 + h * 0.4, vary(c.shrub, R, 0.025), R); S.st.grmi++; }
        else { tuft(g, x, y - 0.04, z, 0.45 + h * 0.3, 0.6 + h * 0.45, vary(mix3(c.tawny, c.straw, R() * 0.6), R, 0.03), R, 5); S.st.sopi++; } } },
    col: { tawny: [0.58, 0.49, 0.29], straw: [0.68, 0.61, 0.39], green: [0.4, 0.48, 0.22], shrub: [0.24, 0.3, 0.15], shrub2: [0.3, 0.33, 0.17], soil: [0.52, 0.34, 0.24] } };
})();
