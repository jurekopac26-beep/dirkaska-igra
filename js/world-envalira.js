/* =========================================================================
   WORLD — Envalira, Andora (theme 'envalira'): the ice circuit at 2,370 m under the Port d'Envalira (2,408 m), above Pas de la Casa, its own parts on
   the shared builder of js/world-rbring.js (World.ext.rbring), loaded before it (index.html). Its look (RB_LOOK.envalira) goes on API.rbLook;
   World.ext.envalira builds it with World.ext.rbring. The track: docs/proge/envalira.md (data: tools/envalira/).
   Its own parts: snow all round it in every season (out.forceSeason: the render paints the world in winter), the banks of ploughed snow
   along both edges of the ice instead of walls (LK.allWall, LK.wallLook), the road's ice pale blue-white, the few buildings by it (def.sk.bld:
   OpenStreetMap) under snow; no trees (above the tree line), no grandstands, no pits, hardly anyone watching; the Andorran flag on the
   podium. Only place names on its boards (no names of the circuit, its people, races or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { box, lerp, nrGround, rng } = API;
  // the text boards: place names only (the pass, the village below it, the country), the start line's
  const EV_BAN = [['ENVALIRA', '#1d3f8e', '#fff', '#f2c21a'], ['PORT D\'ENVALIRA', '#1d3f8e', '#fff', '#d0103a'], ['START', '#16181c', '#fff', '#d0103a'], ['ANDORRA', '#d0103a', '#fff', '#f2c21a'],
    ['PAS DE LA CASA', '#1d3f8e', '#fff', '#f2c21a'], ['GRAU ROIG', '#1d3f8e', '#fff', '#d0103a'], ['CANILLO', '#245a8a', '#fff', '#fff'], ['PIRINEUS', '#245a8a', '#fff', '#f2c21a']];
  const EV_AT = { num: 0, brake: 0, ban: 3, rbr: 3, spielberg: 4 };   // atlas cells: the braking boards (no turn numbers), the banners
  const EV_SHIRTS = [[0.86, 0.14, 0.18], [0.95, 0.95, 0.93], [0.2, 0.36, 0.72], [0.95, 0.78, 0.12], [0.3, 0.6, 0.86], [0.92, 0.45, 0.12], [0.62, 0.64, 0.68], [0.8, 0.2, 0.5]];   // (ski jackets: bright)
  const AD = { grid: [[0, 8 / 25, 17 / 25, 1], [0, 1], [[[0.07, 0.24, 0.62], [0.98, 0.82, 0.08], [0.82, 0.06, 0.2]]]] };   // the Andorran flag: blue, yellow (a little wider), red, the blue at the pole
  // the banks of ploughed snow along the ice (LK.wallLook): white with a blue shade at the foot, a little higher in the corners' outsides
  const SNOW = [[0.78, 0.82, 0.9], [0.9, 0.92, 0.97], [0.95, 0.96, 0.99], [0.99, 0.99, 1], [0.96, 0.97, 1]];
  // the road's ice: pale blue-white, worn darker where the cars run (the tint of the asphalt's material: the render leaves the road's
  // materials alone in every season)
  const ICE = [2.0, 2.2, 2.55];   // (over the asphalt's dark picture: brighter than 1)

  // LK.extra: the buildings by the circuit (OSM outlines as boxes: render and stone, roofs under snow)
  function evExtra({ scen, exclPush, CR }) {
    const T = API.T, sk = T.def.sk || {}, R = rng(7231), st = { buildings: 0 };
    const b6 = sk.bld || [], WALL = [[0.88, 0.86, 0.82], [0.62, 0.58, 0.52], [0.72, 0.66, 0.58], [0.8, 0.8, 0.8]], ROOF = [0.94, 0.95, 0.98];
    for (let k = 0; k < b6.length; k += 6) {
      const [x, z, L, W, deg, h] = b6.slice(k, k + 6), rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot);
      let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2));
      box(scen.get(x, z), x, y - 0.6, z, L, h + 0.6, W, rot, WALL[Math.floor(R() * WALL.length)], ROOF, true);
      exclPush(x, z, Math.hypot(L, W) / 2 + 2); CR.avoid(x, z, Math.hypot(L, W) / 2 + 1); st.buildings++;
    }
    return st;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    envalira: { ban: EV_BAN, at: EV_AT, nums: 0, shirts: EV_SHIRTS, smoke: false, camps: 0, farms: 0, seC: [1.0, 1.0, 1.02], gravel: true, noVid: true, noAds: true,
      vg: [0.98, 0.99, 1.0], edge: [1.0, 1.0, 1.02], mow: 1e-3, ck: 2,   // (mow: no mowing stripes on the snow; ck: the short circuit much in view: bigger chunks, fewer draws)
      woods: { n: 1, geo: (k) => API.hjTreeGeo(1, k > 0), cr: [0.26, 0.33, 0.3], p: [0, 0, 0, 0], pick: () => [1, 6, 3] },   // (above the tree line: none)
      extra: evExtra, fl: { ad: AD },
      flags: { stand: [{ ad: 1 }], ga: { ad: 1 }, camp: { ad: 1 }, pole: 'ad', podium: 'ad' },
      vid: [], poles: [0, 0, -1], runoff: [], straight: [-8, 8, -1], fence: { sides: [], col: [1, 1, 1], top: 2 },
      allWall: true, wallLook: () => ({ c: SNOW, h: 1.0 }),
      farm: { wall: [0.88, 0.86, 0.82], roof: [0.94, 0.95, 0.98], end: [0.86, 0.84, 0.8], barn: [0.6, 0.56, 0.5], barnRoof: [0.94, 0.95, 0.98], barnEnd: [0.58, 0.54, 0.48] },
      tvSkip: [], recov: [], photo: [], jets: [[0.97, 0.97, 0.97], [0.97, 0.97, 0.97], [0.97, 0.97, 0.97]], air: false,
      colMod: (P) => (x, z, c) => {   // the snow over the pass: white, a blue shade in the hollows' noise, wind-blown ridges a little brighter
        const n = P.n5(x * 0.4 + 300, z * 0.4 - 120), m = P.n3(x * 1.4 - 80, z * 1.4 + 60), v = 0.94 + (n - 0.5) * 0.08 + (m - 0.5) * 0.05;
        c[0] = lerp(c[0], 0.93 * v, 0.85); c[1] = lerp(c[1], 0.95 * v, 0.85); c[2] = lerp(c[2], 1.0 * v, 0.85);
      } },
  });
  World.keep('NR', 'envalira');   // (its grids kept between its builds; World.build frees the others')
  World.ext.envalira = (scene, tex, opts) => {
    const out = World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
    if (out) {
      out.forceSeason = 'winter';   // (snow all year: js/render.js seasonWorld)
      if (out.asphaltMat && out.asphaltMat.color) out.asphaltMat.color.setRGB(ICE[0], ICE[1], ICE[2]);
    }
    return out;
  };
})();
