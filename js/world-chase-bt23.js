/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the twenty-third group of the real tracks: Portobelo and
   Aguascalientes, a second pass from the end of docs/proge-pregled.md (both last had their roadside in the second and third groups).
   Portobelo has a builder of its own (js/world-portobelo.js) that calls World.ext.portobeloRob (js/world-realizem-bt.js: the shore's
   boulders, the forest's undergrowth) just before its scenery is closed; Aguascalientes is on the shared circuit builder
   (js/world-rbring.js), whose look's LK.extra js/world-realizem-bt3.js already uses for the dry tufts by the walls. Both hooks are
   chained here, so the earlier plants stay and the shared bands of js/world-chase-bt11.js (goreRob) are added on the corridor's ground,
   slope, land cover and nearest road (nrGround, nrSlope, nrLC, nrNear). What stands where follows the tracks' descriptions
   (docs/proge/portobelo.md, docs/proge/aguascalientes.md): nothing on the road, the houses, the sea's edge, the fort and its glade
   (Portobelo) or the pits' side along the pits (Aguascalientes). The terrain, the road, the barriers, the walls and the trees stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.goreRob || !World.ext.goreRob.LOOK) return;
  const API = World.api, BT = API.chaseBt, { vary } = API;
  if (!BT || !BT.tuft) return;
  const { tuft, cushion, mix3 } = BT, LOOK = World.ext.goreRob.LOOK;

  /* the land cover's share (ESA WorldCover: 0 grass, 1 trees, 2 shrub, 3 built, 4 bare, 5 water) */
  const cov = (c, grass, wood, shrub, built, bare) => c === 0 ? grass : c === 1 ? wood : c === 2 ? shrub : c === 3 ? built : c === 4 ? bare : 0;

  /* Portobelo: docs/proge/portobelo.md: »palme, temne krošnje deževnega gozda in visoka drevesa nad zelenimi tlemi«, »betonske ograje
     ob robovih«. From the camera behind the car the green ground between the barriers and the forest was one even face. So at the
     barriers' foot the wet tropics' tall green grass in tufts, some broad-leaved; between them, under the forest, low dark-green
     undergrowth and the rainforest's brown fallen leaves on dark soil; out on the open ground taller grass in loose groups, by the
     town less. */
  LOOK.portobelo = { seed: 23101, st: ['trava', 'podrast', 'listje', 'prst'],
    edge: { ok: (c, sl) => sl >= 0.9 ? 0 : cov(c, 0.9, 0.75, 0.85, 0.4, 0.5), n: [4, 6],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.32 + h * 0.24, 0.42 + h * 0.36, vary(mix3(S.c.green, S.c.lime, R()), R, 0.03), R, 5); S.st.trava++; } },
    mid: { ok: (c, sl, x, z, w) => sl > 1.0 ? 0 : cov(c, 0.7, 0.8, 0.75, 0.35, 0.4), n: [3, 5], litter: 0.5, lit: 'leaf', lr: [1.0, 2.2], ln: 'listje', wood: true, litW: true,
      put: (S, x, y, z, h, R, w) => { if (w > 0.3 ? R() < 0.6 : R() < 0.2) { cushion(S.g(x, z), x, y, z, 0.5 + h * 0.45, 0.36 + h * 0.3, vary(mix3(S.c.under, S.c.green, R() * 0.4), R, 0.03), R); S.st.podrast++; }
        else { tuft(S.g(x, z), x, y, z, 0.36 + h * 0.26, 0.5 + h * 0.4, vary(mix3(S.c.green, S.c.deep, R()), R, 0.03), R, 5); S.st.trava++; } } },
    far: { ok: (c, sl, x, z, w) => sl > 0.9 ? 0 : cov(c, 0.6, 0.45, 0.55, 0.2, 0.3) * (1 - w * 0.3), n: [2, 4], litter: 0.3, lit: 'soil', lr: [1.0, 2.0], ln: 'prst',
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.46 + h * 0.3, 0.6 + h * 0.45, vary(mix3(S.c.green, S.c.lime, R() * 0.6), R, 0.03), R, 5); S.st.trava++; } },
    col: { green: [0.3, 0.5, 0.2], lime: [0.46, 0.6, 0.26], deep: [0.24, 0.42, 0.17], under: [0.22, 0.4, 0.16], leaf: [0.5, 0.38, 0.24], soil: [0.42, 0.33, 0.24] } };

  /* Aguascalientes: docs/proge/aguascalientes.md: »suha trava planote (zlata z olivnimi krpami, ob jarkih bolj zelena), grmičevje in
     redka drevesa«, the white concrete wall outside. The wall's foot already has js/world-realizem-bt3.js's dry tufts; from the camera
     behind the car the ground between them was still one even golden face. So at the edges more of the plateau's golden grass, some
     olive; between, low grey-green scrub cushions and patches of the bare brown earth; out on the open ground taller tussocks in
     loose groups, greener where the ground is low (the ditches). */
  LOOK.aguascalientes = { seed: 23201, st: ['trava', 'grmi', 'prst'],
    edge: { ok: (c, sl) => sl >= 0.9 ? 0 : cov(c, 0.75, 0.6, 0.7, 0.3, 0.55), n: [3, 5],
      put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.28 + h * 0.22, 0.3 + h * 0.28, vary(mix3(S.c.gold, S.c.olive, R() < 0.3 ? 0.6 + R() * 0.4 : R() * 0.25), R, 0.03), R, 5); S.st.trava++; } },
    mid: { ok: (c, sl, x, z, w) => sl > 1.0 ? 0 : cov(c, 0.65, 0.65, 0.8, 0.3, 0.5), n: [2, 4], litter: 0.5, lit: 'earth', lr: [1.0, 2.4], ln: 'prst',
      put: (S, x, y, z, h, R) => { if (R() < 0.4) { cushion(S.g(x, z), x, y, z, 0.45 + h * 0.4, 0.3 + h * 0.25, vary(S.c.scrub, R, 0.03), R); S.st.grmi++; }
        else { tuft(S.g(x, z), x, y, z, 0.32 + h * 0.24, 0.36 + h * 0.32, vary(mix3(S.c.gold, S.c.tan, R()), R, 0.03), R, 5); S.st.trava++; } } },
    far: { ok: (c, sl) => sl > 0.9 ? 0 : cov(c, 0.55, 0.4, 0.6, 0.2, 0.35), n: [2, 4],
      put: (S, x, y, z, h, R) => { const g = API.nrGround, low = (g(x + 6, z) + g(x - 6, z) + g(x, z + 6) + g(x, z - 6)) / 4 > y + 0.25;   // (a hollow: a ditch)
        tuft(S.g(x, z), x, y, z, 0.42 + h * 0.3, 0.48 + h * 0.4, vary(mix3(S.c.gold, S.c.green, R() < (low ? 0.6 : 0.2) ? 0.6 + R() * 0.4 : R() * 0.2), R, 0.03), R, 5); S.st.trava++; } },
    col: { gold: [0.78, 0.66, 0.38], tan: [0.68, 0.58, 0.38], olive: [0.46, 0.47, 0.25], green: [0.42, 0.5, 0.26], scrub: [0.46, 0.5, 0.34], earth: [0.56, 0.44, 0.32] } };

  /* Portobelo's builder hook chained (after js/world-realizem-bt.js's): never on the sea's edge, by the fort or in its glade; the
     builder passes its root and out (matV) for the bands' own meshes; what they count in out.stats.rob.robBt23 */
  {
    const base = World.ext.portobeloRob;
    World.ext.portobeloRob = function (ctx) {
      const r = (base ? base.call(this, ctx) : null) || {};
      try {
        const { nrGround, nrSlope, nrLC, nrNear } = API, { seaD, inFort, inGlade } = ctx;
        const bad = (x, z) => (seaD && seaD(x, z) > -4) || (inFort && inFort(x, z, 6)) || (inGlade && inGlade(x, z));
        if (ctx.root && ctx.out) r.robBt23 = World.ext.goreRob({ excluded: ctx.excluded, root: ctx.root, out: ctx.out }, 'portobelo', { gH: nrGround, slope: nrSlope, lc: nrLC, near: nrNear, bad });
      } catch (e) { console.error('chase-bt23 (portobelo):', e); }
      return r;
    };
  }

  /* Aguascalientes' look's LK.extra chained (after js/world-realizem-bt3.js's): never on the pits' side along the pits; what they
     count in out.stats.extra.robBt23 */
  {
    const L = (API.rbLook || {}).aguascalientes;
    if (L) {
      const base = L.extra;
      L.extra = function (ctx) {
        const r = (base ? base.call(this, ctx) : null) || {};
        try {
          const T = API.T, pd = T && T.def.pit, ps = pd ? (pd[0] < 0 ? -1 : 1) : 0, { nrGround, nrSlope, nrLC, nrNear } = API;
          const bad = (x, z) => { if (!ps) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === ps && !!T.pitAt(q.i * T.ds); };
          r.robBt23 = World.ext.goreRob({ excluded: ctx.excluded, root: ctx.root, out: ctx.out }, 'aguascalientes', { gH: nrGround, slope: nrSlope, lc: nrLC, near: nrNear, bad });
        } catch (e) { console.error('chase-bt23 (aguascalientes):', e); }
        return r;
      };
    }
  }
})();
