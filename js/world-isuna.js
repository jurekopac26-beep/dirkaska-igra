/* =========================================================================
   WORLD — Isuna, Butan (theme 'isuna'): the data-driven builder of the short roads (World.gore, js/world-gore.js) with this road's style; its own
   things in S.extra. Made by tools/nova-proga.mjs (the style from tools/predogled/proge.json).
   The road from Chuzom up the valley of the Paro Chhu (PNH 6), blue pine forest on the slopes, the river beside the road (def.riverBeds), and the
   landmark: the old iron chain footbridge over the river below the road (OSM way 452848825), with a whitewashed stone gatehouse at each end
   (a red-brown band under a dark shingled roof, a small gilded pinnacle), the deck hung from the chains, strings of plain coloured flags along
   them (no inscriptions). The model is made in Blender (tools/znamenitost/isuna.py: assets/landmarks/isuna.glb, isuna-far.glb, World.znamenitost);
   until it has loaded, or if it cannot, the simpler one built here (the same measures: BR).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.gore || !World.api) return;
  const API = World.api;
  const { GB, box, cyl, gable, vrGround } = API;
  // the bridge (the game's x, z; tools/znamenitost/isuna.py has the same): the deck's ends (the gatehouses' inner faces) on OSM's line, the
  // gatehouses' size, the deck's level at the ends (above the higher bank) and its sag, the chains' height at the ends and at the middle
  const BR = { a: [-1385.3, 261.2], b: [-1351.5, 232.5], tw: 7, th: 6.6, deck: 0.7, sag: 1.2, ch: 4.2, chM: 1.1, w: 1.5 };
  const WHT = [0.93, 0.92, 0.87], BAND = [0.5, 0.2, 0.14], ROOF = [0.3, 0.22, 0.17], DARK = [0.12, 0.1, 0.09], IRON = [0.22, 0.21, 0.2], GOLD = [0.86, 0.66, 0.22];

  function bridge(g) {
    const [ax, az] = BR.a, [bx, bz] = BR.b, L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, nx = -uz, nz = ux, ang = Math.atan2(uz, ux);
    const yD = Math.max(vrGround(ax, az), vrGround(bx, bz)) + BR.deck;
    const at = (t, o) => [ax + ux * t + nx * o, az + uz * t + nz * o];
    // the gatehouses: whitewashed walls from below the ground, the red-brown band under the eaves, the roof and its pinnacle, the dark doorway the deck goes through
    for (const tc of [-BR.tw / 2, L + BR.tw / 2]) {
      const [cx, cz] = at(tc, 0), h = BR.tw / 2;
      let y0 = Infinity; for (const [p, q] of [[-h, -h], [h, -h], [h, h], [-h, h]]) y0 = Math.min(y0, vrGround(...at(tc + p, q)));
      const top = yD + BR.th;
      box(g, cx, y0 - 1, cz, BR.tw, top - 1 - (y0 - 1), BR.tw, ang, WHT, WHT, true);
      box(g, cx, top - 1, cz, BR.tw + 0.12, 0.9, BR.tw + 0.12, ang, BAND, BAND, true);
      gable(g, cx, top - 0.1, cz, BR.tw + 1.0, BR.tw + 1.0, 1.9, ang, ROOF, BAND);
      cyl(g, cx, top + 1.6, cz, 0.28, 1.1, 6, GOLD, GOLD, 0.06);
      box(g, cx, yD - 0.2, cz, BR.tw + 0.08, 2.9, 1.9, ang, DARK, DARK, true);
    }
    // the deck (planks on iron, hung from the chains: sagging) and the chains: two each side, from high in the gatehouses down towards the deck at the middle;
    // the hangers every 1.5 m; the handrail chain
    const n = Math.ceil(L / 1.5), dy = (u) => yD - BR.sag * (1 - (2 * u - 1) ** 2), cy = (u) => yD + BR.chM + (BR.ch - BR.chM) * (2 * u - 1) ** 2;
    for (let k = 0; k < n; k++) {
      const u0 = k / n, u1 = (k + 1) / n, um = (u0 + u1) / 2, [mx, mz] = at(um * L, 0), seg = L / n + 0.05;
      box(g, mx, dy(um) - 0.18, mz, seg, 0.18, BR.w, ang, ROOF, [0.42, 0.33, 0.24], false);
      for (const sd of [-1, 1]) {
        const [px, pz] = at(um * L, sd * (BR.w / 2 + 0.05));
        box(g, px, cy(um) - 0.08, pz, seg, 0.16, 0.16, ang, IRON, IRON, false);
        box(g, px, dy(um) + 0.95, pz, seg, 0.07, 0.07, ang, IRON, IRON, false);
        if (k % 2 === 0) box(g, px, dy(um), pz, 0.06, cy(um) - dy(um), 0.06, ang, IRON, IRON, true);
      }
    }
    return { ang, mid: at(L / 2, 0), ends: [at(-BR.tw / 2, 0), at(L + BR.tw / 2, 0)], L };
  }

  World.ext.isuna = (scene, tex, opts) => World.gore.build(scene, tex, opts, {
    seed: 1717, snow: 'none',
    road: { line: 'white' },
    trees: { kinds: ['fir', 'fir', 'pine'], forest: 0.3, open: 0.02, h: [8, 16] },
    skiers: 0, nets: false, snowbanks: false,
    animals: [{ kind: 'cow', n: 12 }],
    excl: [[BR.a[0], BR.a[1], 9], [BR.b[0], BR.b[1], 9], [(BR.a[0] + BR.b[0]) / 2, (BR.a[1] + BR.b[1]) / 2, 6]],
    extra(ctx) {
      const g = new GB(), info = bridge(g), m = new THREE.Mesh(g.geometry(), ctx.out.matV);
      m.castShadow = m.receiveShadow = true; m.matrixAutoUpdate = false; ctx.root.add(m);
      ctx.out.bridge = m; ctx.out.marks = Object.assign(ctx.out.marks || {}, { Most: info.mid.slice() });
      if (World.znamenitost) World.znamenitost.add('isuna', ctx.root, { x: info.mid[0], z: info.mid[1], fallback: m, out: ctx.out });
    },
  });
})();
