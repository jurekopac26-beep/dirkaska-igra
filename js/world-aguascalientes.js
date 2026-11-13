/* =========================================================================
   WORLD — Aguascalientes, Mehika (theme 'aguascalientes'): the oval on the high plain at 1860 m, on the shared builder of js/world-rbring.js
   (World.ext.rbring), loaded before it (index.html) like js/world-bathurst.js. Its look (RB_LOOK.aguascalientes) goes on API.rbLook: banners
   with the names of the town, the state's places and the country (no names of the circuit, its races, sponsors or the airport), green, white
   and red; the dry grass of the plain, golden with olive patches, mesquite and acacia scrub (the shared 'au' trees), adobe farmsteads; the
   pits inside the front stretch; the horizon (def.far: the low hills and the sierras round the valley) drawn with Riverside's rsFar, which
   the shared builder does not draw itself (World.ext.aguascalientes adds it to its build).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { lerp, nrLCf, sstep } = API;
  const AG_BAN = [['AGUASCALIENTES', '#0b5e3a', '#fff', '#ce1126'], ['START · FINISH', '#16181c', '#fff', '#ce1126'], ['CALVILLO', '#ce1126', '#fff', '#fff'],
    ['MÉXICO', '#0b5e3a', '#fff', '#fff'], ['ASIENTOS', '#16181c', '#fff', '#0b5e3a']];   // (only place names: the town, two towns of the state, the country)
  const AG_AT = { num: 0, brake: 4, ban: 7, rbr: 7, spielberg: 8 };   // atlas cells: 4 turn numbers, the braking boards, the banners (the first two on the stands' glass)
  const AG_SHIRTS = [[0.04, 0.42, 0.28], [0.95, 0.95, 0.93], [0.81, 0.1, 0.12], [0.12, 0.13, 0.16], [0.16, 0.3, 0.7], [0.96, 0.78, 0.14], [0.58, 0.44, 0.3], [0.9, 0.5, 0.12],
    [0.04, 0.42, 0.28], [0.81, 0.1, 0.12], [0.3, 0.32, 0.36], [0.95, 0.95, 0.93]];   // the fans' shirts: green, white and red, dark, denim, straw hats
  API.rbLook = Object.assign(API.rbLook || {}, {
    aguascalientes: { ban: AG_BAN, at: AG_AT, nums: 4, shirts: AG_SHIRTS, smoke: false, camps: 0, trees: 'au', seC: [1.2, 1.08, 0.82],
      pitBox: [-135, 35, -1], vg: [1.0, 0.95, 0.78], edge: [1.12, 1.0, 0.9], mow: 0.25, wear: [140, 200, 2],   // (the pits inside the front stretch; the verge dry and dusty)
      flags: { stand: [{ mx: 0.7, tm: 0.3 }, { mx: 0.6, tm: 0.4 }], ga: { mx: 0.7, tm: 0.3 }, camp: { mx: 1 }, pole: 'mx', podium: 'mx' },
      vid: [], noVid: true, poles: [-130, 30, -1], runoff: ['AGUASCALIENTES', 'CALVILLO', 'MÉXICO'], straight: [-230, 170, 1],
      farm: { wall: [0.82, 0.66, 0.5], roof: [0.66, 0.34, 0.22], end: [0.78, 0.62, 0.46], barn: [0.7, 0.6, 0.48], barnRoof: [0.62, 0.62, 0.6], barnEnd: [0.66, 0.56, 0.44] },   // adobe walls under clay tiles, a shed of corrugated iron
      tvSkip: [1, 3], recov: [0, 2], photo: [0, 2], jets: [[0.04, 0.42, 0.28], [0.95, 0.95, 0.93], [0.81, 0.1, 0.12]],   // (the jets' smoke; their flight is off, World.ext.aguascalientes)
      screen: { name: ['AGUASCALIENTES', ''], km: '1,34 km', sub: '1860 m', fans: ['#0b5e3a', '#f4f4f0', '#ce1126', '#16181c', '#2f5fb0', '#e8c23a', '#0b5e3a'], glow: '206,17,38' },
      colMod: (P) => (x, z, c) => {   // the plain in the dry season: golden grass, olive where it holds green, pale dust patches, greener along the ditches
        const n = P.n5(x * 0.55 + 410, z * 0.55), m = P.n3(x * 1.6 - 220, z * 1.6), k = 0.94 + (n - 0.5) * 0.2 + (m - 0.5) * 0.12, fm = nrLCf(x, z, 0);
        { const L = (c[0] + c[1] + c[2]) / 3; c[0] = lerp(c[0], L, 0.35); c[1] = lerp(c[1], L, 0.35); c[2] = lerp(c[2], L, 0.35); }
        c[0] *= k * 1.06; c[1] *= k; c[2] *= k * 0.86;
        const dry = sstep(0.42, 0.7, P.n3(x * 0.7 + 60, z * 0.7 - 130)) * 0.8 * fm, olive = sstep(0.6, 0.8, P.n1(x * 1.1 - 170, z * 1.1 + 45)) * 0.45 * fm;
        c[0] = lerp(c[0], c[0] * 1.22 + 0.05, dry); c[1] = lerp(c[1], c[1] * 1.1 + 0.03, dry); c[2] = lerp(c[2], c[2] * 1.02 + 0.02, dry);   // (golden and dusty, not orange)
        c[0] = lerp(c[0], c[0] * 0.84, olive); c[2] = lerp(c[2], c[2] * 0.9, olive);
      } },
  });
  // the horizon's colours by height (m a.s.l.) and distance: the dry plain, the scrub on the low hills, the oak woods higher up, the haze
  function agFarCol(h, d) {
    let c = h < 1900 ? [0.68, 0.6, 0.45] : h < 2050 ? [0.55, 0.5, 0.38] : [0.4, 0.42, 0.33];
    if (h >= 1860 && h < 1900) c = c.map((v, k) => lerp(v, [0.55, 0.5, 0.38][k], (h - 1860) / 40 * 0.5));
    const f = (1 - Math.exp(-d / 30000)) * 0.85;   // (the high plain's dry air: the hills stand out, a little haze)
    return c.map((v, k) => lerp(v, [0.76, 0.8, 0.86][k], f));
  }
  World.keep('NR', 'aguascalientes');   // (its grids kept between its builds, as the other worlds on the shared builder)
  World.ext.aguascalientes = (scene, tex, opts) => {   // the shared builder (js/world-rbring.js), and the horizon on top
    const out = World.ext.rbring(scene, tex, opts), F = API.T && API.T.def && API.T.def.far;
    if (F && API.rsFar && out && out.root) out.dyn.far = API.rsFar(out.root, F, 'summer', 6, agFarCol);
    if (out) out.air = null;   // (no jets' intro over the grid on so short an oval: the camera's own flights before the start; the helicopter's pass stays, dyn.air)
    return out;
  };
})();
