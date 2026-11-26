/* =========================================================================
   WORLD — El Castaño, Venezuela (theme 'elcastano'): the data-driven builder of the short roads (World.gore, js/world-gore.js) with this road's
   style; its own things in S.extra. The narrow road up the coastal range from El Castaño (tools/elcastano/build.py): the wet cloud forest close
   on both sides (tall broadleaf trees, the world builder's), the Río Madre Vieja and its streams in their beds (def.riverBeds), parrots in the
   trees, guardrails in the sharp bends, no snow. The road's three short bridges (def.bridges, OpenStreetMap's bridge=yes; js/core.js keeps the
   guardrails off them): a concrete deck with a low concrete parapet on each side, drawn here. The land beyond the corridor: the ridges of the
   range round the road (def.farDem, irFar of js/world-iroha.js). Only geographic names; no signs of firms.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.gore || !World.api) return;
  const API = World.api;
  const { GB, box } = API;
  const CONC = [0.66, 0.65, 0.61], CONC2 = [0.52, 0.51, 0.48];

  // the bridges: along each span (a metre more at each end) the deck's edge under the road and a parapet on both sides, in 2 m pieces
  function bridges(g, T, def) {
    let n = 0;
    for (const [a, b] of def.bridges || []) {
      for (let d = a - 1; d < b + 1; d += 2) {
        const i = T.idx(T.startS + d + 1), x = T.px[i], z = T.pz[i], y = T.hy[i], ang = Math.atan2(T.tz[i], T.tx[i]);
        for (const sd of [-1, 1]) {
          const o = T.w + 0.35, px = x + T.nx[i] * o * sd, pz = z + T.nz[i] * o * sd;
          box(g, px, y - 0.05, pz, 2.05, 0.85, 0.3, ang, CONC, CONC2, true);   // (the parapet, 0.8 m above the deck)
          box(g, x + T.nx[i] * (T.w + 0.1) * sd, y - 0.9, z + T.nz[i] * (T.w + 0.1) * sd, 2.05, 0.85, 0.5, ang, CONC2, CONC2, true);   // (the deck's edge)
        }
        n++;
      }
    }
    return n;
  }

  World.ext.elcastano = (scene, tex, opts) => World.gore.build(scene, tex, opts, {
    seed: 6730, snow: 'none',
    ground: { grass: [0.36, 0.5, 0.22], forest: [0.14, 0.27, 0.11], shrub: [0.26, 0.4, 0.16], built: [0.5, 0.46, 0.4], rock: [0.44, 0.42, 0.38], dry: [0.48, 0.42, 0.28] },
    road: { line: 'none', gravel: [0.5, 0.45, 0.38] },   // (the narrow road without lines; the grey-brown shoulder)
    trees: { kinds: ['broad'], forest: 0.42, open: 0.05, near: 2.0, h: [10, 22] },
    poles: null, posts: true, signs: 'diamond', skiers: 0, nets: false, snowbanks: false, lifts: false,
    boards: { banner: 'HILL CLIMB' },
    animals: [{ kind: 'parrot', n: 10 }],
    extra(ctx) {
      const T = API.T, def = T.def, g = new GB(), nb = bridges(g, T, def);
      if (nb) { const m = new THREE.Mesh(g.geometry(), ctx.out.matV); m.castShadow = m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); ctx.root.add(m); }
      ctx.out.marks = Object.assign(ctx.out.marks || {}, { bridges: nb });
      const FAR = API.irFar ? API.irFar() : null; if (FAR) { FAR.mesh.visible = false; ctx.root.add(FAR.mesh); ctx.out.dyn.irFar = FAR; }   // (hidden until the first World.update)
      if (World.ext.goreRob) World.ext.goreRob(ctx, 'elcastano');   // (the roadside ground from the chase camera: js/world-chase-bt11.js)
    },
  });
})();
