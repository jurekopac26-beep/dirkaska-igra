/* ===================================================================================================================================
   WORLD — Isuna, Bhutan: the place itself (dodelava O-28-11, 28. 11. 2026), laid over the gore world js/world-isuna.js builds and the
   roadside js/world-isuna-obcestje.js adds. This track's own builder, not a shared template.
   -----------------------------------------------------------------------------------------------------------------------------------
   How: World.ext.isuna is wrapped (as js/world-isuna-obcestje.js does); while it runs, World.gore.build gets this file's ownBld (every
   house of def.bld is drawn here, gore keeps its collision block), keepOut (no trees on the terraces, the temple's plot) and extra.
   Drawn:
     the houses (def.bld, OpenStreetMap): the Paro valley's farmhouse (research in docs/proge/isuna.md): a stone plinth, the ground floor
     of whitewashed rammed earth or stone with small windows, the upper floor wider, with a timber bay of windows (rabsel) on the side
     facing the road, a painted cornice (red-brown), the open loft under a low gable roof of corrugated metal (grey, green, red, blue-
     grey) standing on posts, a small white flag on the ridge of some; small ones (under 45 m²) one storey; two or three storeys by size
     (OSM gives no levels here: assumed);
     the chorten by the village (OSM w1117014047, building=chorten): stepped white base, a red band, the white dome, gilded spire;
     the village lhakhang (OSM w977067470, building=lhakhang) and Tamchog Lhakhang above the chain bridge (OSM node 4502255223,
     amenity=place_of_worship, buddhist; a node, no outline: 14 × 10 m and two storeys assumed): white walls, the red-ochre band (kemar)
     under the roof, a raised roof lantern and a gilded pinnacle (serto), on a stone terrace;
     prayer flags (not in OSM: placed by the custom at sacred places, an approximation): strings of five-coloured flags (lungta: blue,
     white, red, green, yellow) and tall upright banners on poles (darchor, waving: js/world-zastave.js) by the bridge's car park, below
     the temple (white ones, manidar), by the chorten and the lhakhang;
     terraced fields where ESA WorldCover 2021 (10 m, CC BY 4.0) has cropland (class 40), sampled to strips about 8 m × 18 m: each strip
     cut into level fields stepping down the slope (harvested rice and wheat stubble, ploughed earth, some green), earth and stone risers.
   Not changed: driving, physics, def.sideRoads, def.hills, js/world-isuna.js, js/world-isuna-obcestje.js, js/world-gore.js.
   Data: © OpenStreetMap contributors, ODbL 1.0; ESA WorldCover 2021 (CC BY 4.0) (README.md, »Zasluge«)
   =================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.gore || !World.ext || typeof World.ext.isuna !== 'function') return;
  const API = World.api, { box, cyl, gable, clamp, vrGround, vrNear } = API;

  // ---- the data: x east, z south, metres from the start line ----
  const CHORTEN = [-3175.2, 258.6], LHAKHANG = [-3225.5, 314.7];   // (def.bld's own: OSM's building=chorten and building=lhakhang)
  const TAMCHOG = { x: -1421, z: 89, L: 14, W: 10 };               // (OSM node 4502255223; its outline assumed)
  const PARK = [-1419.9, 257.1];                                   // (the car park by the chain bridge: def.pulls)
  const GATE = [-1385.3, 261.2];                                   // (the bridge's near gatehouse, js/world-isuna.js)
  // the cropland strips (ESA WorldCover 2021, class 40): [x west end, x east end, z middle] (18.4 m deep in z), flat
  const CROP = [-3600.3,-3559.1,119.8,-3559.1,-3526.1,119.8,-3616.8,-3575.6,138.2,-3575.6,-3534.4,138.2,-3616.8,-3575.6,156.6,-3575.6,-3550.9,156.6,-3616.8,-3592.1,175,-3443.7,-3402.5,193.5,-3402.5,-3377.8,193.5,-3583.8,-3542.6,211.9,-3542.6,-3526.1,211.9,-3468.5,-3427.3,211.9,-3427.3,-3386,211.9,-3386,-3344.8,211.9,-3344.8,-3303.6,211.9,-3303.6,-3287.2,211.9,-3608.6,-3567.3,230.3,-3567.3,-3534.4,230.3,-3476.7,-3435.5,230.3,-3435.5,-3394.3,230.3,-3394.3,-3353.1,230.3,-3353.1,-3311.9,230.3,-3311.9,-3270.7,230.3,-3592.1,-3567.3,248.8,-3476.7,-3435.5,248.8,-3435.5,-3394.3,248.8,-3394.3,-3353.1,248.8,-3353.1,-3311.9,248.8,-3311.9,-3270.7,248.8,-3616.8,-3575.6,267.2,-3575.6,-3534.4,267.2,-3534.4,-3493.2,267.2,-3493.2,-3452,267.2,-3452,-3410.8,267.2,-3410.8,-3369.6,267.2,-3369.6,-3328.4,267.2,-3328.4,-3287.2,267.2,-3105.9,-3064.6,267.2,-3064.6,-3039.9,267.2,-3616.8,-3575.6,285.6,-3575.6,-3534.4,285.6,-3534.4,-3493.2,285.6,-3493.2,-3452,285.6,-3452,-3410.8,285.6,-3410.8,-3369.6,285.6,-3369.6,-3328.4,285.6,-3105.9,-3064.6,285.6,-3064.6,-3023.4,285.6,-3023.4,-2982.2,285.6,-3616.8,-3575.6,304,-3575.6,-3534.4,304,-3534.4,-3493.2,304,-3493.2,-3452,304,-3452,-3410.8,304,-3410.8,-3369.6,304,-3369.6,-3328.4,304,-3188.3,-3147.1,304,-3147.1,-3105.9,304,-3081.1,-3039.9,304,-3039.9,-2998.7,304,-2998.7,-2957.5,304,-3616.8,-3575.6,322.5,-3575.6,-3534.4,322.5,-3534.4,-3493.2,322.5,-3493.2,-3452,322.5,-3452,-3410.8,322.5,-3410.8,-3369.6,322.5,-3196.5,-3155.3,322.5,-3155.3,-3114.1,322.5,-3114.1,-3097.6,322.5,-3048.2,-3007,322.5,-3007,-2965.8,322.5,-2965.8,-2941,322.5,-3616.8,-3575.6,340.9,-3550.9,-3509.7,340.9,-3509.7,-3468.5,340.9,-3468.5,-3427.3,340.9,-3427.3,-3386,340.9,-3204.7,-3163.5,340.9,-3163.5,-3122.3,340.9,-3122.3,-3089.4,340.9,-3616.8,-3600.3,359.3,-3575.6,-3542.6,359.3,-3534.4,-3493.2,359.3,-3493.2,-3452,359.3,-3452,-3410.8,359.3,-3410.8,-3369.6,359.3,-3369.6,-3353.1,359.3,-3237.7,-3196.5,359.3,-3196.5,-3155.3,359.3,-3155.3,-3114.1,359.3,-3114.1,-3072.9,359.3,-3616.8,-3600.3,377.8,-3592.1,-3550.9,377.8,-3550.9,-3509.7,377.8,-3509.7,-3468.5,377.8,-3468.5,-3427.3,377.8,-3427.3,-3386,377.8,-3386,-3344.8,377.8,-3344.8,-3311.9,377.8,-3295.4,-3254.2,377.8,-3254.2,-3213,377.8,-3213,-3171.8,377.8,-3171.8,-3130.6,377.8,-3130.6,-3089.4,377.8,-3608.6,-3567.3,396.2,-3567.3,-3526.1,396.2,-3526.1,-3484.9,396.2,-3484.9,-3443.7,396.2,-3443.7,-3402.5,396.2,-3402.5,-3361.3,396.2,-3361.3,-3320.1,396.2,-3320.1,-3278.9,396.2,-3278.9,-3237.7,396.2,-3237.7,-3196.5,396.2,-3196.5,-3155.3,396.2,-2743.2,-2710.3,396.2,-3616.8,-3575.6,414.6,-3575.6,-3534.4,414.6,-3534.4,-3493.2,414.6,-3493.2,-3452,414.6,-3452,-3410.8,414.6,-3410.8,-3369.6,414.6,-3369.6,-3328.4,414.6,-3328.4,-3287.2,414.6,-3287.2,-3262.4,414.6,-3229.5,-3196.5,414.6,-2751.5,-2710.3,414.6,-2710.3,-2693.8,414.6,-3616.8,-3575.6,433,-3575.6,-3534.4,433,-3534.4,-3493.2,433,-3493.2,-3452,433,-3452,-3410.8,433,-3410.8,-3369.6,433,-3369.6,-3328.4,433,-3122.3,-3081.1,433,-3081.1,-3064.6,433,-2743.2,-2702,433,-2702,-2685.6,433,-3616.8,-3575.6,451.5,-3575.6,-3534.4,451.5,-3534.4,-3493.2,451.5,-3493.2,-3452,451.5,-3452,-3427.3,451.5,-3122.3,-3081.1,451.5,-3081.1,-3039.9,451.5,-2743.2,-2702,451.5,-2702,-2669.1,451.5,-3616.8,-3575.6,469.9,-3575.6,-3534.4,469.9,-3534.4,-3493.2,469.9,-3493.2,-3476.7,469.9,-3130.6,-3089.4,469.9,-3089.4,-3048.2,469.9,-3048.2,-3023.4,469.9,-2726.8,-2685.6,469.9,-2685.6,-2652.6,469.9,-2471.3,-2430.1,469.9,-2430.1,-2413.6,469.9,-3616.8,-3575.6,488.3,-3575.6,-3534.4,488.3,-3534.4,-3517.9,488.3,-3130.6,-3089.4,488.3,-3089.4,-3048.2,488.3,-3048.2,-3007,488.3,-3007,-2982.2,488.3,-2710.3,-2669.1,488.3,-2652.6,-2619.6,488.3,-2529,-2487.8,488.3,-2487.8,-2446.6,488.3,-2446.6,-2413.6,488.3,-3616.8,-3583.8,506.8,-3114.1,-3072.9,506.8,-3015.2,-2982.2,506.8,-2660.8,-2619.6,506.8,-2619.6,-2578.4,506.8,-2578.4,-2537.2,506.8,-2537.2,-2496,506.8,-2496,-2454.8,506.8,-2454.8,-2413.6,506.8,-3089.4,-3072.9,525.2,-3015.2,-2990.5,525.2,-2644.4,-2603.1,525.2,-2603.1,-2561.9,525.2,-2561.9,-2520.7,525.2,-2520.7,-2479.5,525.2,-2479.5,-2438.3,525.2,-2438.3,-2421.8,525.2,-2627.9,-2586.7,543.6,-2586.7,-2553.7,543.6,-2545.5,-2504.3,543.6,-2504.3,-2463,543.6,-2463,-2446.6,543.6,-2586.7,-2561.9,562,-2545.5,-2504.3,562,-2504.3,-2479.5,562];
  const DEEP = 18.4;

  // ---- colours ----
  const WHITE = [0.9, 0.88, 0.82], STONE = [0.5, 0.48, 0.44], TIMBER = [0.46, 0.28, 0.16], CORNICE = [0.5, 0.2, 0.12], DARK = [0.12, 0.1, 0.09];
  const KEMAR = [0.62, 0.24, 0.12], GOLD = [0.86, 0.66, 0.22], LOFT = [0.18, 0.14, 0.11];
  const ROOFS = [[0.6, 0.62, 0.64], [0.6, 0.62, 0.64], [0.3, 0.44, 0.32], [0.55, 0.2, 0.16], [0.4, 0.46, 0.54]];
  const LUNGTA = [[0.16, 0.34, 0.78], [0.93, 0.93, 0.9], [0.82, 0.16, 0.12], [0.16, 0.58, 0.26], [0.95, 0.8, 0.16]];
  const FIELDS = [[0.42, 0.52, 0.24], [0.48, 0.57, 0.27], [0.38, 0.47, 0.22], [0.55, 0.52, 0.3], [0.5, 0.45, 0.29]], RISER = [0.4, 0.36, 0.3];

  const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const tint = (c, f) => [c[0] * f, c[1] * f, c[2] * f];
  const st = { houses: 0, temples: 0, flags: 0, banners: 0, fields: 0 };

  // the footprint's lowest and highest ground
  const lowHigh = (x, z, L, W, ang) => { const c = Math.cos(ang), s = Math.sin(ang); let lo = 1e9, hi = -1e9;
    for (const [u, v] of [[-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2], [0, 0]]) { const y = vrGround(x + c * u - s * v, z + s * u + c * v); lo = Math.min(lo, y); hi = Math.max(hi, y); }
    return [lo, hi]; };
  // the face (0: +z, 1: -z, 2: +x, 3: -x in the house's own frame) that looks most towards (tx, tz)
  const faceTo = (x, z, ang, tx, tz) => { const c = Math.cos(ang), s = Math.sin(ang), dx = tx - x, dz = tz - z, pz = -s * dx + c * dz, px = c * dx + s * dz;
    return Math.abs(pz) >= Math.abs(px) ? (pz >= 0 ? 0 : 1) : (px >= 0 ? 2 : 3); };
  // a flat panel on a face (a window, a bay's panes): u along the face, y up, out from the wall
  function panel(g, x, z, ang, L, W, face, u, y, w, h, out, col) {
    const c = Math.cos(ang), s = Math.sin(ang), P = (lx, ly, lz) => [x + lx * c - lz * s, ly, z + lx * s + lz * c];
    const sd = face === 0 || face === 2 ? 1 : -1, d = (face < 2 ? W : L) / 2 + out;
    const at = face < 2 ? (a, b) => P(a, b, sd * d) : (a, b) => P(sd * d, b, a);
    const inn = face < 2 ? P(u, y + h / 2, sd * (d - 1)) : P(sd * (d - 1), y + h / 2, u);
    g.quadO(at(u - w / 2, y), at(u + w / 2, y), at(u + w / 2, y + h), at(u - w / 2, y + h), col, inn);
  }
  // a box standing out of a face (the rabsel)
  function bay(g, x, z, ang, L, W, face, y, w, h, d, col, colTop) {
    const c = Math.cos(ang), s = Math.sin(ang), sd = face === 0 || face === 2 ? 1 : -1;
    if (face < 2) { const o = sd * (W / 2 + d / 2); box(g, x - o * s, y, z + o * c, w, h, d, ang, col, colTop); }
    else { const o = sd * (L / 2 + d / 2); box(g, x + o * c, y, z + o * s, d, h, w, ang, col, colTop); }
  }

  // ---- the farmhouse ----
  function house(g, b, i, T) {
    const { x, z, ang } = b, L = b.L, W = b.W, A = L * W, [lo, hi] = lowHigh(x, z, L, W, ang);
    const r = (k) => hash(i * 7.3 + k, x * 0.01 + z * 0.013);
    const fl = b.hgt ? clamp(Math.round(b.hgt / 2.9), 1, 3) : A < 45 ? 1 : A < 110 ? 2 : r(1) < 0.35 ? 3 : 2;
    const wall = tint(WHITE, 0.93 + 0.1 * r(2)), base = hi + 0.45, FH = 2.75;
    box(g, x, lo - 0.3, z, L + 0.3, base - lo + 0.3, W + 0.3, ang, tint(STONE, 0.9 + 0.2 * r(3)), null, true);
    box(g, x, base, z, L, FH, W, ang, wall, null, true);
    let top = base + FH, Lu = L, Wu = W;
    if (fl > 1) { Lu = L + 0.4; Wu = W + 0.4; box(g, x, top, z, Lu, FH * (fl - 1), Wu, ang, tint(wall, 0.98), null, true); top += FH * (fl - 1); }
    box(g, x, top, z, Lu + 0.2, 0.4, Wu + 0.2, ang, tint(CORNICE, 0.9 + 0.2 * r(4)), null, true); top += 0.4;
    // the open loft: posts at the corners and the gap's dark inside
    box(g, x, top, z, Lu - 0.5, 1.0, Wu - 0.5, ang, LOFT, null, true);
    const n = vrNear(x, z), tx = n.i >= 0 ? T.px[n.i] : x, tz = n.i >= 0 ? T.pz[n.i] : z + 1, f = faceTo(x, z, ang, tx, tz);
    const fw = f < 2 ? L : W, bw = f < 2 ? W : L;
    // the windows: small ones below, a row above; the rabsel on the face to the road
    for (const ff of [0, 1, 2, 3]) {
      const wl = ff < 2 ? L : W, nW = Math.max(1, Math.floor(wl / 4));
      for (let k = 0; k < nW; k++) { const u = (k + 0.5) * wl / nW - wl / 2;
        panel(g, x, z, ang, L, W, ff, u, base + 0.9, 0.8, 1.0, 0.03, DARK);
        if (fl > 1 && !(ff === f && fw > 5)) panel(g, x, z, ang, Lu, Wu, ff, u, top - 0.4 - 1.9, 1.2, 1.2, 0.03, DARK); }
    }
    if (fl > 1 && fw > 5) { const w = Math.min(fw * 0.6, 9), y = top - 0.4 - 2.3;
      bay(g, x, z, ang, Lu, Wu, f, y, w, 2.1, 0.6, tint(TIMBER, 0.9 + 0.2 * r(5)), CORNICE);
      panel(g, x, z, ang, Lu, Wu, f, 0, y + 0.55, w - 0.6, 1.2, 0.61, DARK); }
    // the roof: low, wide eaves, the ridge along the longer side
    const along = L >= W, rL = (along ? Lu : Wu) + 2.6, rD = (along ? Wu : Lu) + 2.6, rh = 0.22 * Math.min(Lu, Wu) + 0.4;
    const roof = tint(ROOFS[Math.floor(r(6) * ROOFS.length)], 0.92 + 0.14 * r(7)), ra = along ? ang : ang + Math.PI / 2;
    gable(g, x, top + 1.0, z, rL, rD, rh, ra, roof, LOFT);
    if (r(8) < 0.5) { const c = Math.cos(ra), s = Math.sin(ra), o = rL * 0.3 * (r(9) < 0.5 ? 1 : -1), px = x + c * o, pz = z + s * o, py = top + 1.0 + rh;
      cyl(g, px, py - 0.2, pz, 0.04, 2.6, 4, TIMBER);
      flag2(g, [px, py + 2.3, pz], [px + 0.55 * s, py + 2.3, pz - 0.55 * c], 0.4, r(10) < 0.6 ? LUNGTA[1] : LUNGTA[Math.floor(r(11) * 5)]); }
    st.houses++; void bw;
  }

  // a cloth seen from both sides: its top edge a → b, h down
  function flag2(g, a, b, h, col) {
    const a2 = [a[0], a[1] - h, a[2]], b2 = [b[0], b[1] - h, b[2]], m = [(a[0] + b[0]) / 2, a[1] - h / 2, (a[2] + b[2]) / 2];
    const dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
    g.quadO(a, b, b2, a2, col, [m[0] + nx, m[1], m[2] + nz]); g.quadO(a, a2, b2, b, col, [m[0] - nx, m[1], m[2] - nz]);
  }
  // a string of lungta from a (on a pole) to b (on a pole or a stake), sagging
  function lungta(ctx, a, b, poles) {
    const L = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.max(2, Math.floor(L / 0.62)), sag = 0.05 * L + 0.2, g = ctx.scen.get((a[0] + b[0]) / 2, (a[2] + b[2]) / 2);
    const at = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t];
    for (let k = 0; k < n; k++) { const t0 = (k + 0.1) / n, t1 = (k + 0.68) / n; flag2(g, at(t0), at(t1), 0.42, LUNGTA[k % 5]); st.flags++; }
    for (const p of poles || []) cyl(ctx.scen.get(p[0], p[2]), p[0], vrGround(p[0], p[2]) - 0.2, p[2], 0.06, p[1] - vrGround(p[0], p[2]) + 0.4, 5, TIMBER);
  }
  // a darchor: a tall pole, an upright banner on it that waves (white, or one of the five colours)
  function darchor(ctx, x, z, h, col, rot) {
    const y = vrGround(x, z), g = ctx.scen.get(x, z);
    cyl(g, x, y - 0.3, z, 0.08, h + 0.6, 5, tint(WHITE, 0.95), null, 0.05);
    cyl(g, x, y + h + 0.2, z, 0.14, 0.4, 5, GOLD, GOLD, 0.02);
    if (!(API.flags && API.flags.add(x, y + h - 0.2, z, rot, [col], 0.9, Math.min(5, h * 0.62)))) {
      const c = Math.cos(rot), s = Math.sin(rot); flag2(g, [x, y + h - 0.2, z], [x + c * 0.9, y + h - 0.2, z + s * 0.9], Math.min(5, h * 0.62), col); }
    st.banners++;
  }

  // ---- the temple: white walls, the kemar band, a raised lantern and the serto on top; on a stone terrace ----
  function lhakhang(g, x, z, L, W, ang, fl, terrace) {
    const [lo, hi] = lowHigh(x, z, L + 2 * terrace, W + 2 * terrace, ang), base = hi + 0.5, FH = 3.2;
    box(g, x, lo - 0.5, z, L + 2 * terrace, base - lo + 0.5, W + 2 * terrace, ang, STONE, tint(STONE, 1.15), true);
    box(g, x, base, z, L, FH * fl - 1.0, W, ang, WHITE, null, true);
    let top = base + FH * fl - 1.0;
    box(g, x, top, z, L + 0.1, 1.0, W + 0.1, ang, KEMAR, null, true); top += 1.0;
    box(g, x, top, z, L + 0.3, 0.3, W + 0.3, ang, CORNICE, null, true); top += 0.3;
    for (const ff of [0, 1, 2, 3]) { const wl = ff < 2 ? L : W, nW = Math.max(1, Math.floor(wl / 3.5));
      for (let k = 0; k < nW; k++) { const u = (k + 0.5) * wl / nW - wl / 2;
        panel(g, x, z, ang, L, W, ff, u, base + 1.2, 0.7, 1.1, 0.03, DARK);
        if (fl > 1) panel(g, x, z, ang, L, W, ff, u, base + FH + 0.6, 1.0, 1.3, 0.03, DARK); } }
    box(g, x, top, z, L - 1.0, 0.8, W - 1.0, ang, LOFT, null, true);
    const along = L >= W, rL = Math.max(L, W) + 2.4, rD = Math.min(L, W) + 2.4, ra = along ? ang : ang + Math.PI / 2, rh = 0.2 * Math.min(L, W) + 0.5;
    gable(g, x, top + 0.8, z, rL, rD, rh, ra, [0.58, 0.6, 0.6], LOFT);
    // the lantern (jabju) astride the ridge, its own little roof, the serto
    const yl = top + 0.8 + rh - 0.3, Ll = Math.min(L, W) * 0.4;
    box(g, x, yl, z, Ll, 1.3, Ll, ang, WHITE); box(g, x, yl + 1.0, z, Ll + 0.1, 0.35, Ll + 0.1, ang, KEMAR);
    gable(g, x, yl + 1.35, z, Ll + 1.4, Ll + 1.4, 0.7, ra, [0.58, 0.6, 0.6], LOFT);
    cyl(g, x, yl + 1.9, z, 0.32, 0.5, 8, GOLD); cyl(g, x, yl + 2.4, z, 0.26, 1.3, 8, GOLD, GOLD, 0.03);
    st.temples++;
    return { lo, hi, top: yl + 3.6, base };
  }

  // ---- the chorten: three white steps, the red band, the dome, the gilded spire ----
  function chorten(g, x, z, S, ang) {
    const [lo, hi] = lowHigh(x, z, S, S, ang); let y = hi + 0.1;
    box(g, x, lo - 0.3, z, S, y - lo + 0.3 + 0.9, S, ang, WHITE, null, true); y += 0.9;
    box(g, x, y, z, S * 0.82, 0.8, S * 0.82, ang, tint(WHITE, 0.97)); y += 0.8;
    box(g, x, y, z, S * 0.66, 0.45, S * 0.66, ang, KEMAR); y += 0.45;
    box(g, x, y, z, S * 0.6, 0.5, S * 0.6, ang, WHITE); y += 0.5;
    cyl(g, x, y, z, S * 0.3, 1.2, 10, WHITE, WHITE, S * 0.2); y += 1.2;
    box(g, x, y, z, S * 0.22, 0.4, S * 0.22, ang, KEMAR); y += 0.4;
    cyl(g, x, y, z, S * 0.09, 1.9, 8, GOLD, GOLD, 0.03);
    st.temples++;
    return { lo, top: y + 1.9 };
  }

  // ---- the terraces ----
  function fieldCells(ctx) {
    const T = API.T, cells = [];
    for (let k = 0; k < CROP.length; k += 3) {
      const x0 = CROP[k], x1 = CROP[k + 1], zc = CROP[k + 2], nx = Math.max(1, Math.round((x1 - x0) / 13)), lx = (x1 - x0) / nx;
      for (let a = 0; a < nx; a++) for (let b = 0; b < 3; b++) {
        const cx = x0 + (a + 0.5) * lx, cz = zc + (b - 1) * DEEP / 3, n = vrNear(cx, cz);
        if (n.i < 0 || n.dd > 230) continue;
        const w = Math.max(T.bl[n.i], T.br[n.i]); if (n.dd < w + 4.5) continue;
        cells.push({ x: cx, z: cz, lx: lx - 0.25, lz: DEEP / 3 - 0.2, k: k / 3, a, b });
      }
    }
    return cells;
  }
  function terraces(ctx, cells) {
    const blds = ctx.blds || [], pads = (API.VR && API.VR.pads) || [];
    const stub = API.vrStubAt || (() => false);
    for (const c of cells) {
      if (blds.some(b => Math.abs(b.x - c.x) < (Math.max(b.L, b.W) / 2 + c.lx / 2 + 1.5) && Math.abs(b.z - c.z) < (Math.max(b.L, b.W) / 2 + c.lz / 2 + 1.5))) continue;
      if (pads.some(p => Math.hypot(p.x - c.x, p.z - c.z) < p.r + p.b * 0.5 + c.lx / 2)) continue;
      let lo = 1e9, hi = -1e9, bad = false;
      for (const [u, v] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5], [0, 0]]) { const px = c.x + u * c.lx, pz = c.z + v * c.lz, y = vrGround(px, pz);
        lo = Math.min(lo, y); hi = Math.max(hi, y); if (stub(px, pz, 1.5)) bad = true; }
      if (bad || hi - lo > 2.4) continue;
      const h = hash(c.k * 3.1 + c.a, c.b + 7), fc = tint(FIELDS[Math.floor(hash(c.k, c.a * 0.7) * FIELDS.length)], 0.92 + 0.14 * h);
      const top = (lo + hi) / 2 + 0.08;   // (cut and fill: the uphill half into the slope, a riser of at most ~1.2 m on the downhill side)
      box(ctx.scen.get(c.x, c.z), c.x, lo - 0.3, c.z, c.lx, top - lo + 0.3, c.lz, 0, tint(RISER, 0.9 + 0.2 * h), fc, true);
      st.fields++;
    }
  }

  // ---- this file's part of the build ----
  let CELLS = null;
  function keepOut(push) {
    CELLS = fieldCells();
    for (const c of CELLS) push(c.x, c.z, Math.max(c.lx, c.lz) * 0.6);
    push(TAMCHOG.x, TAMCHOG.z, 24);
    push(CHORTEN[0], CHORTEN[1], 8);
  }
  const near = (b, p, d) => Math.hypot(b.x - p[0], b.z - p[1]) < d;
  function ownBld() { return true; }

  function extra(ctx) {
    const T = API.T, blds = ctx.blds || [];
    let ch = null, lh = null;
    blds.forEach((b, i) => {
      if (!b.own) return;
      const g = ctx.scen.get(b.x, b.z);
      if (near(b, CHORTEN, 2)) { ch = chorten(g, b.x, b.z, Math.min(b.L, b.W), b.ang); ch.x = b.x; ch.z = b.z; return; }
      if (near(b, LHAKHANG, 2)) { lh = lhakhang(g, b.x, b.z, b.L, b.W, b.ang, 2, 0.6); lh.x = b.x; lh.z = b.z; lh.b = b; return; }
      house(g, b, i, T);
    });
    // Tamchog Lhakhang, facing down to the river and the road
    const n = vrNear(TAMCHOG.x, TAMCHOG.z), ang = n.i >= 0 ? Math.atan2(T.pz[n.i] - TAMCHOG.z, T.px[n.i] - TAMCHOG.x) - Math.PI / 2 : 0;
    const tm = lhakhang(ctx.scen.get(TAMCHOG.x, TAMCHOG.z), TAMCHOG.x, TAMCHOG.z, TAMCHOG.L, TAMCHOG.W, ang, 2, 2.5);
    if (ctx.CR) ctx.CR.block(TAMCHOG.x, TAMCHOG.z, TAMCHOG.L + 6, TAMCHOG.W + 6, ang);
    // its flags: strings from the lantern down to poles around it, white manidar in an arc below it towards the river
    const c = Math.cos(ang), s = Math.sin(ang), P = (u, v) => [TAMCHOG.x + u * c - v * s, TAMCHOG.z + u * s + v * c];
    for (const [u, v] of [[-14, 9], [14, 9], [-15, -7], [15, -7]]) { const [px, pz] = P(u, v), ph = vrGround(px, pz) + 5.5;
      lungta(ctx, [TAMCHOG.x, tm.top - 1.2, TAMCHOG.z], [px, ph, pz], [[px, ph, pz]]); }
    for (let k = 0; k < 11; k++) { const t = (k / 10 - 0.5) * 2.1, [px, pz] = P(Math.sin(t) * 18, 6 + Math.cos(t) * 9);
      darchor(ctx, px, pz, 7 + 1.5 * hash(k, 3), LUNGTA[1], ang + Math.PI / 2 + 0.3); }
    // the car park by the chain bridge: a row of darchor along its far edge, strings to the gatehouse
    {
      const nn = vrNear(PARK[0], PARK[1]);
      if (nn.i >= 0) {
        const rx = T.px[nn.i], rz = T.pz[nn.i], l = Math.hypot(PARK[0] - rx, PARK[1] - rz) || 1, ux = (PARK[0] - rx) / l, uz = (PARK[1] - rz) / l, tx = T.tx[nn.i], tz = T.tz[nn.i];
        const R = 12.5;
        for (let k = 0; k < 6; k++) { const o = (k - 2.5) * 3.2, px = PARK[0] + ux * R + tx * o, pz = PARK[1] + uz * R + tz * o;
          if (vrNear(px, pz).dd < Math.max(T.bl[nn.i], T.br[nn.i]) + 3) continue;
          darchor(ctx, px, pz, 7.5 + hash(k, 9), LUNGTA[k % 5], Math.atan2(tz, tx)); }
        const a0 = [PARK[0] + ux * R + tx * 10, 0, PARK[1] + uz * R + tz * 10]; a0[1] = vrGround(a0[0], a0[2]) + 6;
        const gx = GATE[0] - a0[0], gz = GATE[1] - a0[2], gl = Math.hypot(gx, gz) || 1;
        for (const off of [-2.5, 2.5]) { const b0 = [GATE[0] - gx / gl * 4 - gz / gl * off, 0, GATE[1] - gz / gl * 4 + gx / gl * off]; b0[1] = vrGround(b0[0], b0[2]) + 4.5;
          lungta(ctx, a0, b0, [b0]); }
        cyl(ctx.scen.get(a0[0], a0[2]), a0[0], a0[1] - 6.3, a0[2], 0.08, 6.6, 5, TIMBER);
      }
    }
    // the village: strings from the chorten's spire, darchor by the lhakhang
    if (ch) for (let k = 0; k < 4; k++) { const t = k * Math.PI / 2 + 0.6, px = ch.x + Math.cos(t) * 11, pz = ch.z + Math.sin(t) * 11, ph = vrGround(px, pz) + 4;
      if (vrNear(px, pz).dd < 6) continue; lungta(ctx, [ch.x, ch.top - 0.6, ch.z], [px, ph, pz], [[px, ph, pz]]); }
    if (lh) { const b = lh.b, c2 = Math.cos(b.ang), s2 = Math.sin(b.ang);
      for (let k = 0; k < 4; k++) { const u = (k - 1.5) * 3, v = b.W / 2 + 4, px = b.x + u * c2 - v * s2, pz = b.z + u * s2 + v * c2;
        if (vrNear(px, pz).dd < 6) continue; darchor(ctx, px, pz, 8, LUNGTA[k % 5], b.ang); } }
    terraces(ctx, CELLS || fieldCells());
    World.isunaKraj = { stats: Object.assign({}, st), tamchog: { x: TAMCHOG.x, z: TAMCHOG.z, ang, y: tm.base }, vas: lh ? { x: lh.x, z: lh.z, y: lh.base } : null };
  }

  // ---- the hook: World.ext.isuna runs as before, gore.build handed this file's ownBld, keepOut and extra after its own ----
  const ext = World.ext, baseExt = ext.isuna;
  ext.isuna = function (scene, tex, opts) {
    const gore = World.gore, build = gore.build;
    for (const k in st) st[k] = 0;
    gore.build = function (sc, tx, op, S) {
      gore.build = build;
      const S2 = Object.assign({}, S, {
        ownBld: (x, z, L, W) => (typeof S.ownBld === 'function' && S.ownBld(x, z, L, W)) || ownBld(x, z, L, W),
        keepOut: (push) => { if (typeof S.keepOut === 'function') S.keepOut(push); keepOut(push); },
        extra: (ctx) => { const r = typeof S.extra === 'function' ? S.extra(ctx) : undefined; extra(ctx); return r; },
      });
      return build.call(this, sc, tx, op, S2);
    };
    try { return baseExt.apply(this, arguments); } finally { gore.build = build; }
  };
})();
