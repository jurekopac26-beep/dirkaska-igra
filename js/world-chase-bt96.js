/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the ninety-sixth group of the real tracks: Mapileng (the short
   roads' builder, js/world-kratke.js: it calls World.ext.kratkeRob just before its scenery chunks are closed; its first pass) and Lusail
   (the shared circuit builder, js/world-rbring.js: the look's own LK.extra chained; its third pass, after js/world-chase-bt16.js and
   js/world-chase-bt45.js). What stands where follows each track's description (docs/proge/<id>.md). Nothing here is driven on: all of it
   is behind the barriers, off the built ground and what the builds keep clear; the terrain, the road and the fences stay as they are.
   No people. Only the two named tracks change.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt; if (!BT) return;
  const { TAU, vary, sstep } = API, { karst, chain, walk, softScen, rbEnv } = BT;

  /* ---- Mapileng: docs/proge/mapileng.md: »travnata pobočja, iz katerih v zaplatah gleda siv apnenec«, »sive skalne igle in balvani«,
     »grmičevje«, »ob ozkem asfaltu pas gramoza«. Beside the road the plateau was one green on smooth terrain from the camera behind the
     car. So within ~24 m of the barriers ribs of the grey limestone come out of the grass along the hillside (more on the scree and the
     rock of the land cover, few in the woods), a patch of bare rock lies here and there on the gentler ground, and between them stand
     tufts of the grass going dry and a few dark cushions of the scrub; a thinner band of the same reaches to ~60 m. Never on the fields
     of maize, the built ground or the paths (the shared pass leaves the land cover's 3, 5 and 6 out), nor where the build keeps clear
     (the houses, the walls, the view points, the signs: the builder's own excluded). ---- */
  const MP = { rock: [[0.62, 0.62, 0.6], [0.68, 0.68, 0.65], [0.56, 0.57, 0.56], [0.72, 0.71, 0.68]], bare: [0.6, 0.6, 0.58], dry: [0.6, 0.58, 0.4], gold: [0.5, 0.55, 0.3], shrub: [0.3, 0.4, 0.2] };
  const mapileng = (ctx) => {
    const P = API.VR, n2 = P && P.c2 ? (x, z) => sstep(0.3, 0.7, P.c2(x * 1.3 + 40, z * 1.3 - 90)) : () => 0.5;
    const C = { rocky: 0.3, scree: 0.7, wood: 0.1, slab: 0.26, tufts: 4, scrub: 0.16, maxSl: 1.3, woodTufts: true, pale: 1.0, sides: 4, soft: true, rock: MP.rock, bare: MP.bare, dry: MP.dry, gold: MP.gold, shrub: MP.shrub };
    const near = karst(ctx, 96101, Object.assign({ step: 3, reach: 22, share: (c, x, z) => (c === 1 ? 0.5 : 0.8) * (0.5 + 0.5 * n2(x, z)) }, C));
    const far = karst(ctx, 96102, Object.assign({}, C, { step: 6, reach: 58, tufts: 3, ribLen: 1.25, share: (c, x, z) => (c === 1 ? 0.3 : 0.6) * (0.4 + 0.6 * n2(x, z)) }));
    return { near, far };
  };
  const E = World.ext = World.ext || {}, baseK = E.kratkeRob;
  E.kratkeRob = function (ctx) {
    const r = baseK ? baseK.call(this, ctx) : null;
    if (ctx && ctx.id === 'mapileng' && ctx.out) try { ctx.out.robBt96 = mapileng(ctx); } catch (e) { console.error('chase-bt96 (mapileng):', e); }
    return r;
  };

  /* ---- Lusail: docs/proge/lusail.md: past the lawns the desert, »siva prodnata ravnina v velikih lisah, svetlejši in toplejši nanosi
     peska«, »nizko sivo grmičevje v puščavi«. The forty-fifth group's patches end ~12 m past the fences (its far band was left out for
     the vertices: LU_FAR); beyond, the plain was one colour to the horizon from the camera behind the car. So from ~12 to ~55 m a thin
     band of wide low patches lies on the plain (the darker and the lighter gravel, a drift of warmer sand; five corners each, 15
     vertices; the scrub itself stands since the sixteenth group). Never on the lawns or the paved ground (the land cover's 1 and 3), nor
     along the pits. Thin on purpose: Lusail's busiest place had ~4k vertices to spare under CLAUDE.md's 900k. ---- */
  const LU = { grav: [0.6, 0.56, 0.5], gravD: [0.5, 0.47, 0.42], drift: [0.79, 0.71, 0.53] };
  const patch5 = (g, gH, gx, gz, rr, col, R) => {   // (as the sixth group's soil, five corners)
    const k = 5, a0 = R() * TAU, rim = [col[0] * 0.9 + 0.05, col[1] * 0.9 + 0.07, col[2] * 0.9 + 0.03], ctr = [gx, gH(gx, gz) + 0.08, gz], Q = [];
    for (let q = 0; q < k; q++) { const a = a0 + q / k * TAU, r = rr * (0.65 + R() * 0.6), x = gx + Math.cos(a) * r, z = gz + Math.sin(a) * r * 0.75; Q.push([x, gH(x, z) + 0.06, z]); }
    for (let q = 0; q < k; q++) g.triO(ctr, Q[q], Q[(q + 1) % k], col, [gx, ctr[1] - 5, gz], rim, rim); };
  const lusail = (ctx) => {
    const { nrGround, nrLC, nrSlope } = API, st = { lise: 0 }; if (!nrGround || !nrLC || !ctx.root || !ctx.matV) return st;
    const soft = softScen(ctx.root, ctx.matV), ex = ctx.excluded || (() => false);
    const ok = (x, z) => { const c = nrLC(x, z); return c === 1 || c === 3 || (nrSlope && nrSlope(x, z) > 0.6) ? 0 : 0.5; };
    walk(rbEnv(ex), 96201, 8, 43, 12, ok, (gx, gz, k, R, free) => {
      if (!free(gx, gz, 9)) return;
      const u = R(), c = nrLC(gx, gz), col = c === 2 || u < 0.3 ? LU.drift : u < 0.72 ? LU.gravD : LU.grav;
      patch5(soft.get(gx, gz), nrGround, gx, gz, 3 + R() * 3, vary(col, R, 0.02), R); st.lise++;
    });
    soft.done();
    return st;
  };
  const L = API.rbLook || {};
  if (L.lusail) chain(L.lusail, (ctx) => { try { if (ctx.out) ctx.out.pasBt96 = lusail(ctx); } catch (e) { console.error('chase-bt96 (lusail):', e); } });
})();
