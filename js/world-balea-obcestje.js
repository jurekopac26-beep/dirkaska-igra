/* =========================================================================
   WORLD — Bâlea, Romania: what stands along the Transfăgărășan under the lake (docs/proge/balea.md, »Obcestje«), on top of the shared
   world of the passes (js/world-prelaz.js, PL_LOOK.balea; its hooks pre and extra wrapped). Places and lines from OpenStreetMap
   (ODbL 1.0, read 23. 11. 2026), only within 60 m of the road; all generic: no names, letters or signs. The walkers' paths
   (highway=footway/path) as trodden strips of earth, the bicycle stands, the metal cross on the slope (no name on it), the memorial
   plaque on its stone, the small book cabinet by the car park. Graphics only, into the scenery's chunks (no new draw calls); the driving,
   physics and def.hills untouched. The game's road and its barriers are wider than the real road: what OpenStreetMap puts inside them is
   moved out past the barrier, and a path is cut where it meets the barrier (docs/proge/balea.md, Približki).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK || !World.api.PL_LOOK.balea) return;
  const API = World.api, LK = API.PL_LOOK.balea;
  const { box, cyl, caGround, ouRod, vrNear } = API;
  let T; API.sync.push(() => { ({ T } = API); });

  // [kind, x, z] in the game's metres (x east, z south, from the start line); OpenStreetMap's nodes
  const ITEMS = [
    ['rack', 298.0, 549.9],      // n9986772617 amenity=bicycle_parking
    ['cross', -64.2, 723.2],     // n13114836890 historic=wayside_cross, material=metal (its name left out)
    ['plaque', 9.1, 884.1],      // n13114836891 historic=memorial, memorial=plaque (its text left out)
    ['bookcase', 2.9, 703.0],    // n9979086463 amenity=public_bookcase
  ];
  const CLEAR = { rack: 1.2, cross: 1.4, plaque: 1.2, bookcase: 1.2 };   // past the barrier (m)
  const ROOM = { rack: 2.4, cross: 1.4, plaque: 1.2, bookcase: 1.4 };    // the trees and the rocks kept off (m)

  // the walkers' paths: [OpenStreetMap way, informal, x0, z0, x1, z1, ...] (clipped to 60 m from the road, points ~4–7 m apart)
  const PATHS = [
    [26153224, 0, [-58.9, 867.2, -59.4, 860.8, -60.3, 852.8, -60.5, 846.5, -60.8, 840.3, -61.1, 834.0, -61.2, 827.7, -61.2, 821.5, -61.1, 815.2, -61.1, 808.9, -61.1, 802.7, -61.0, 796.4, -61.0, 790.2, -60.9, 783.9, -60.9, 777.7, -59.1, 773.5, -55.8, 771.3]],
    [37339526, 0, [196.2, 609.3, 196.7, 614.6, 197.3, 621.2, 199.1, 627.6]],
    [59275139, 0, [-6.9, 865.5, -1.2, 862.7, 6.9, 858.9]],
    [73965147, 0, [-48.0, 885.1, -41.9, 882.2, -33.9, 879.7, -28.1, 876.5, -22.9, 873.1, -17.7, 869.9, -11.0, 866.9, -6.9, 865.5]],
    [131301824, 0, [-159.5, 517.5, -156.2, 512.1, -152.8, 506.6, -151.1, 503.9]],
    [336263710, 0, [282.1, 591.2, 275.8, 592.5, 271.4, 594.8, 266.3, 599.2, 264.1, 605.3]],
    [650346754, 0, [-281.1, 23.7, -275.4, 27.5, -269.1, 27.3, -263.5, 24.1, -258.0, 21.0, -252.4, 17.8, -249.7, 11.9, -247.1, 6.0, -244.4, 0.2, -241.8, -5.7, -239.1, -11.6, -236.5, -17.4, -231.5, -21.2, -226.5, -24.9, -221.5, -28.7, -219.0, -30.5]],
    [692985177, 0, [392.9, 570.1, 397.8, 565.9, 402.1, 566.0, 406.8, 562.6, 408.9, 556.3, 407.9, 549.4, 406.8, 542.4, 408.6, 536.7, 410.4, 530.9, 412.6, 524.7, 415.2, 518.0, 417.6, 512.6, 421.3, 509.8, 426.6, 507.2]],
    [692985180, 0, [140.5, 214.1, 146.7, 216.5, 152.3, 219.7, 157.1, 223.5, 163.4, 228.0, 169.8, 231.6, 176.2, 234.5, 179.1, 238.1, 176.6, 242.0, 168.9, 244.2, 162.2, 246.4, 156.4, 248.5, 150.6, 250.6, 144.1, 252.6, 137.1, 254.4, 132.8, 255.5, 128.6, 256.6, 121.9, 257.4, 118.8, 260.4, 120.3, 266.9, 126.7, 270.1, 132.2, 273.4]],
    [692985180, 0, [158.5, 317.3, 164.5, 318.5, 170.4, 319.7, 176.4, 319.5, 182.5, 317.9, 188.6, 316.3, 194.6, 314.7, 199.2, 310.5, 202.7, 304.7, 205.9, 309.8, 211.9, 308.8, 211.1, 315.1, 211.9, 321.5, 215.1, 327.0, 219.5, 332.5, 223.7, 336.8, 228.3, 341.0, 232.9, 345.2, 237.5, 349.5, 242.1, 353.7, 247.3, 357.3, 253.0, 360.3, 258.8, 363.3, 264.9, 365.4, 270.9, 367.5]],
    [692985180, 0, [408.8, 421.5, 413.1, 424.8, 419.9, 425.2, 420.6, 429.9]],
    [698259072, 0, [211.9, 308.8, 219.4, 306.8, 223.9, 311.9, 228.3, 317.1, 232.8, 322.2, 238.4, 325.3, 245.2, 326.3, 252.0, 327.3, 258.9, 327.8, 265.9, 327.6, 272.9, 327.4, 276.4, 327.3]],
    [698259073, 0, [420.6, 429.9, 420.0, 437.3, 419.4, 444.7, 419.6, 451.2, 421.9, 457.4, 426.2, 463.2, 432.9, 466.5, 439.5, 470.7, 442.8, 473.1, 440.1, 478.6, 437.3, 484.1, 436.0, 486.8]],
    [698467201, 0, [436.0, 486.8, 442.4, 487.7, 448.8, 488.5, 455.8, 488.9, 463.5, 488.9, 464.3, 493.8, 460.3, 499.4, 456.3, 505.0, 453.7, 511.5, 451.0, 518.0, 447.7, 523.5, 443.7, 528.2, 439.7, 532.8, 435.7, 537.4, 431.7, 542.0, 427.7, 546.6, 423.7, 551.2, 419.7, 555.8, 415.7, 560.4, 411.7, 565.1, 407.8, 569.7, 403.7, 570.1, 400.7, 566.0]],
    [712355976, 0, [123.2, 620.6, 129.2, 622.8, 135.1, 625.0, 141.1, 627.4, 146.9, 630.1, 152.8, 632.9, 158.6, 636.5, 165.3, 638.3, 173.0, 638.4, 179.7, 641.4, 186.1, 644.1]],
    [1111063109, 0, [180.6, 594.6, 177.9, 599.7, 178.3, 607.1, 179.7, 611.2, 181.1, 615.2, 183.4, 620.9, 186.3, 626.8, 188.2, 632.9, 188.7, 639.1]],
    [1426667924, 1, [1.7, 861.4, 3.3, 865.2, 4.6, 869.3, 5.9, 873.4, 7.9, 877.3, 7.0, 881.8, 2.2, 884.9, -1.6, 887.2, -3.9, 894.1, -6.1, 900.5, -8.4, 907.7, -9.5, 911.7, -10.0, 917.5, -12.3, 920.8, -13.8, 924.5, -8.1, 925.0, -5.5, 930.0, -3.9, 934.2, -1.8, 939.4, -0.7, 946.3, 2.0, 952.4, 3.6, 956.4, -1.2, 956.9, -0.8, 964.7]],
  ];
  const PATH_W = 0.8, PATH_CUT = 0.5;   // the strip's width; how far past the barrier a path starts again (m)

  const STEEL = [0.62, 0.64, 0.67], IRON = [0.44, 0.45, 0.47], STONE = [0.6, 0.59, 0.56], STONE_T = [0.67, 0.66, 0.62], BRONZE = [0.55, 0.46, 0.3];
  const WOOD = [0.56, 0.43, 0.29], WOOD_D = [0.42, 0.32, 0.22], GLASS = [0.6, 0.68, 0.72];
  const EARTH = [0.5, 0.44, 0.35], EARTH_I = [0.5, 0.47, 0.37];   // (a mapped path; an informal one, half grown over)

  const near = (x, z) => { const n = vrNear(x, z); if (n.i < 0) return null; return { i: n.i, lat: n.lat, sd: n.lat >= 0 ? 1 : -1 }; };
  const bar = (i, sd) => (sd > 0 ? T.br[i] : T.bl[i]);
  const onRoad = (x, z) => { const n = near(x, z); return !!n && Math.abs(n.lat) < bar(n.i, n.sd) + PATH_CUT; };
  const hitB = (blds, x, z, r) => (blds || []).some((b) => { const c = Math.cos(b.ang), s = Math.sin(b.ang), dx = x - b.x, dz = z - b.z;
    return Math.abs(dx * c + dz * s) < b.L / 2 + r && Math.abs(-dx * s + dz * c) < b.W / 2 + r; });

  let placed = null;
  function place(blds) {
    const out = [];
    for (const [k, x0, z0] of ITEMS) {
      const n = near(x0, z0); if (!n) continue;
      const i = n.i, lim = bar(i, n.sd) + CLEAR[k]; let x = x0, z = z0;
      if (Math.abs(n.lat) < lim) { const d = n.sd * lim - n.lat; x += T.nx[i] * d; z += T.nz[i] * d; }
      const a = Math.atan2(T.tz[i], T.tx[i]);
      if (hitB(blds, x, z, 0.8)) {   // (clear of a house: along the road first, up to 12 m, else farther out)
        let ok = false;
        for (let t = 1; t <= 12 && !ok; t++) for (const sg of [1, -1]) { const xx = x + T.tx[i] * sg * t, zz = z + T.tz[i] * sg * t; if (!hitB(blds, xx, zz, 0.8)) { x = xx; z = zz; ok = true; break; } }
        for (let t = 0; t < 16 && !ok && hitB(blds, x, z, 0.8); t++) { x += T.nx[i] * n.sd * 0.5; z += T.nz[i] * n.sd * 0.5; }
      }
      out.push({ k, x, z, a, sd: n.sd });
    }
    return out;
  }

  const basePre = LK.pre, base = LK.extra;
  LK.pre = function (o) {
    const r = basePre ? basePre.call(this, o) : undefined;
    if (!T) T = API.T; if (!T) return r;
    placed = place(o.blds);
    for (const p of placed) o.exclPush(p.x, p.z, ROOM[p.k]);
    for (const [, , L] of PATHS) for (let j = 0; j < L.length; j += 2) if (!onRoad(L[j], L[j + 1])) o.exclPush(L[j], L[j + 1], 1.2);   // (no tree or rock on the path)
    return r;
  };
  LK.extra = function (o) {
    const r = base ? base.call(this, o) : undefined;
    if (!T) T = API.T; if (!T) return r;
    const st = lay(o, placed || place(null));
    st.paths = paths(o);
    if (o.out) { if (o.out.balea) o.out.balea.roadside = st; else o.out.baleaRoadside = st; }
    return r;
  };

  // the paths: a strip of earth 0.8 m wide a few cm over the ground, cut where it reaches the road's barrier
  function paths({ scen }) {
    let segs = 0, m = 0;
    for (const [, inf, L] of PATHS) {
      const col = inf ? EARTH_I : EARTH, cols = [col, col, col, col];
      for (let j = 0; j + 3 < L.length; j += 2) {
        const x0 = L[j], z0 = L[j + 1], x1 = L[j + 2], z1 = L[j + 3];
        if (onRoad(x0, z0) || onRoad(x1, z1) || onRoad((x0 + x1) / 2, (z0 + z1) / 2)) continue;
        const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz); if (len < 0.2) continue;
        const px = -dz / len * PATH_W / 2, pz = dx / len * PATH_W / 2;
        const y0 = caGround(x0, z0) + 0.06, y1 = caGround(x1, z1) + 0.06;
        scen.get((x0 + x1) / 2, (z0 + z1) / 2).quadUp([x0 - px, y0, z0 - pz], [x1 - px, y1, z1 - pz], [x1 + px, y1, z1 + pz], [x0 + px, y0, z0 + pz], cols);
        segs++; m += len;
      }
    }
    return { segs, m: Math.round(m) };
  }

  function lay({ scen }, list) {
    const st = { rack: 0, cross: 0, plaque: 0, bookcase: 0 };
    for (const p of list) {
      const { k, x, z, a } = p, c = Math.cos(a), s = Math.sin(a), g = scen.get(x, z), y = caGround(x, z) - 0.04;
      const at = (u, v) => [x + c * u - s * v, z + s * u + c * v];   // (u along the road, v across it)
      st[k]++;
      if (k === 'rack') {   // four steel hoops in a row, across the road, the wheel goes in between
        for (const u of [-1.2, -0.4, 0.4, 1.2]) {
          const [ax, az] = at(u, -0.35), [bx, bz] = at(u, 0.35), ya = caGround(ax, az) - 0.04, yb = caGround(bx, bz) - 0.04, yt = y + 0.82;
          ouRod(g, [ax, ya, az], [ax, yt, az], 0.025, STEEL, 4); ouRod(g, [bx, yb, bz], [bx, yt, bz], 0.025, STEEL, 4); ouRod(g, [ax, yt, az], [bx, yt, bz], 0.025, STEEL, 4);
        }
      } else if (k === 'cross') {   // a metal cross ~2.4 m on a low stone base
        box(g, x, y, z, 0.7, 0.35, 0.7, a, STONE, STONE_T);
        box(g, x, y + 0.35, z, 0.09, 2.1, 0.09, a, IRON, IRON);
        box(g, x, y + 1.75, z, 0.09, 0.09, 0.95, a, IRON, IRON);
      } else if (k === 'plaque') {   // a rough stone with a blank plate on the road's side
        box(g, x, y, z, 0.8, 0.95, 0.55, a + 0.2, STONE, STONE_T);
        const [px, pz] = at(0, -p.sd * 0.29); box(g, px, y + 0.42, pz, 0.42, 0.3, 0.025, a, BRONZE, BRONZE);
      } else if (k === 'bookcase') {   // a small wooden cabinet with a glass door, a little roof, on one post
        box(g, x, y, z, 0.12, 1.0, 0.12, a, WOOD_D, WOOD_D);
        box(g, x, y + 1.0, z, 0.7, 0.8, 0.4, a, WOOD, WOOD);
        const [gx, gz] = at(0, -p.sd * 0.205); box(g, gx, y + 1.08, gz, 0.56, 0.64, 0.02, a, GLASS, GLASS);
        box(g, x, y + 1.8, z, 0.86, 0.06, 0.56, a, WOOD_D, WOOD_D);
      }
    }
    return st;
  }
})();
