/* =========================================================================
   WORLD — Kanaba, Uganda (docs/proge/kanaba.md): the trees along the road from Kabale over the Kanaba gap, in the shared world of the mountain
   passes (js/world-prelaz.js, buildPrelaz, PL_LOOK.kanaba) with trees of their own (L.treeGeo, L.tree) in place of the shared builder's
   spruce: in the Echuya forest reserve (its bounds from OpenStreetMap, way 711261246; the first half of the track) the montane forest's
   broad-crowned hardwoods (Hagenia, Rapanea) and the thickets of the mountain bamboo (Arundinaria alpina); outside it, on the farmland of the
   western slope, the woodlots of eucalyptus and the black wattle, and a few of them on their own between the fields. The species from the
   sources (README »Zasluge«), their shares estimated; the trees' places the land cover's (the shared builder's), not the real ones; all generic
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK || !World.api.PL_LOOK.kanaba) return;
  const API = World.api;
  const { TAU, rng, vary } = API;
  const LOOK = API.PL_LOOK.kanaba;

  /* ---- the Echuya reserve near the road (OpenStreetMap way 711261246, boundary=protected_area, simplified; game metres: x east, z south from
     the start line; to the east, beyond the world's edge, closed by a box): the track's points 0..523 lie in it ---- */
  const ECHUYA = [[542.7, -1774.1], [542.7, 453.8], [-1018.1, 453.8], [-1089.9, 306.9], [-1265.0, 115.5], [-1303.9, 35.6], [-1316.6, -32.9], [-1327.3, -151.9],
    [-1343.5, -209.3], [-1379.3, -291.0], [-1386.5, -460.6], [-1406.6, -545.8], [-1392.9, -600.5], [-1407.8, -634.0], [-1433.1, -654.9], [-1434.0, -684.3],
    [-1421.4, -745.4], [-1440.2, -775.1], [-1465.5, -796.0], [-1524.3, -822.5], [-1565.7, -881.9], [-1596.5, -968.0], [-1590.3, -1029.3], [-1542.2, -1137.1],
    [-1558.7, -1229.4], [-1614.3, -1367.0], [-1625.0, -1422.2], [-1620.6, -1451.5], [-1624.3, -1539.7], [-1608.0, -1597.0], [-1576.3, -1645.0], [-1486.2, -1718.1],
    [-1472.8, -1774.1]];
  let ex0 = Infinity, ex1 = -Infinity, ez0 = Infinity, ez1 = -Infinity;
  for (const [x, z] of ECHUYA) { ex0 = Math.min(ex0, x); ex1 = Math.max(ex1, x); ez0 = Math.min(ez0, z); ez1 = Math.max(ez1, z); }
  function inEchuya(x, z) {   // (the even-odd rule)
    if (x < ex0 || x > ex1 || z < ez0 || z > ez1) return false;
    let inside = false;
    for (let i = 0, j = ECHUYA.length - 1; i < ECHUYA.length; j = i++) {
      const xi = ECHUYA[i][0], zi = ECHUYA[i][1], xj = ECHUYA[j][0], zj = ECHUYA[j][1];
      if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
    }
    return inside;
  }

  /* ---- the trees in the soft look of the game's trees (Drevesa A, docs/drevesa-a.md: AB, aPuff, aTrunk); unit height 1, the instances
     scale and tint them ---- */
  // a slim tube from a to b (n sides: 2n faces, 2n vertices), radius ra at a and rb at b, darker at a: a limb, a bamboo's culm
  function tube(b, a, e, ra, rb, n, col) {
    const dx = e[0] - a[0], dy = e[1] - a[1], dz = e[2] - a[2], l = Math.hypot(dx, dy, dz) || 1, ux = dx / l, uy = dy / l, uz = dz / l;
    let px = -uz, py = 0, pz = ux, pl = Math.hypot(px, pz); if (pl < 1e-6) { px = 1; pz = 0; pl = 1; } px /= pl; pz /= pl;
    const qx = uy * pz - uz * py, qy = uz * px - ux * pz, qz = ux * py - uy * px, lo = [col[0] * 0.78, col[1] * 0.78, col[2] * 0.78], bot = [], top = [];
    for (let k = 0; k < n; k++) {
      const an = k / n * TAU + 0.3, c = Math.cos(an), s = Math.sin(an), nx = px * c + qx * s, ny = py * c + qy * s, nz = pz * c + qz * s;
      bot.push(b.v(a[0] + nx * ra, a[1] + ny * ra, a[2] + nz * ra, nx, ny, nz, lo)); top.push(b.v(e[0] + nx * rb, e[1] + ny * rb, e[2] + nz * rb, nx, ny, nz, col));
    }
    const i1 = [a[0] + dx / 3, a[1] + dy / 3, a[2] + dz / 3], i2 = [a[0] + dx * 2 / 3, a[1] + dy * 2 / 3, a[2] + dz * 2 / 3];   // (each face turned away from the axis by it)
    for (let k = 0; k < n; k++) { const j = (k + 1) % n; b.t(bot[k], bot[j], top[j], i1); b.t(bot[k], top[j], top[k], i2); }
  }
  function eucGeo() {   // the eucalyptus of the woodlots: a tall pale trunk, bare to half its height, under a narrow loose crown of grey-green clumps (66 vertices)
    const b = new API.AB(), R = rng(5407), col = [0.3, 0.38, 0.27];
    API.aTrunk(b, 0, -0.02, 0, 0.02, 0.78, 5, [0.7, 0.66, 0.58]);
    for (const [x, y, z, r, sy] of [[0, 0.9, 0, 0.13, 0.9], [0.08, 0.78, 0.04, 0.12, 0.95], [-0.07, 0.74, -0.05, 0.12, 0.95], [0.03, 0.64, -0.08, 0.11, 1.0], [-0.04, 0.6, 0.08, 0.1, 1.0]])
      API.aPuff(b, x, y, z, r, sy, vary(col, R, 0.08), R, 0.35, 0.55, 1.15);
    return b.geometry();
  }
  function broadGeo() {   // the broad-crowned hardwood (Hagenia, Rapanea; the black wattle): a short stout trunk forking into two limbs under a wide crown of dark clumps (82 vertices)
    const b = new API.AB(), R = rng(5411), col = [0.14, 0.25, 0.11], bark = [0.38, 0.3, 0.24];
    API.aTrunk(b, 0, -0.02, 0, 0.05, 0.45, 5, bark, 0.035);
    tube(b, [0, 0.36, 0], [0.2, 0.56, 0.05], 0.026, 0.014, 3, bark); tube(b, [0, 0.38, 0], [-0.18, 0.55, -0.08], 0.024, 0.013, 3, bark);
    for (const [x, y, z, r, sy] of [[0, 0.72, 0, 0.3, 0.55], [0.26, 0.62, 0.08, 0.24, 0.55], [-0.25, 0.63, -0.1, 0.24, 0.55], [0.06, 0.6, -0.26, 0.22, 0.6], [-0.08, 0.6, 0.25, 0.22, 0.6]])
      API.aPuff(b, x, y, z, r, sy, vary(col, R, 0.1), R, 0.3, 0.55, 1.12);
    return b.geometry();
  }
  function bambooGeo() {   // a clump of the mountain bamboo: six slim culms leaning out from one foot, their upper half in long plumes of light leaves, the tips bare (96 vertices)
    const b = new API.AB(), R = rng(5413), culm = [0.5, 0.55, 0.28], leaf = [0.34, 0.46, 0.18];
    for (let k = 0; k < 6; k++) {
      const an = (k + R() * 0.6) / 6 * TAU, rt = 0.18 + R() * 0.12, yt = 0.88 + R() * 0.12;
      tube(b, [Math.cos(an) * 0.04, -0.02, Math.sin(an) * 0.04], [Math.cos(an) * rt, yt, Math.sin(an) * rt], 0.009, 0.006, 3, culm);
    }
    for (let k = 0; k < 5; k++) {
      const an = (k + 0.5 + R() * 0.5) / 5 * TAU, rr = 0.12 + R() * 0.06;
      API.aPuff(b, Math.cos(an) * rr, 0.56 + R() * 0.14, Math.sin(an) * rr, 0.1 + R() * 0.025, 1.4, vary(leaf, R, 0.08), R, 0.3, 0.6, 1.15);
    }
    return b.geometry();
  }

  let PP = null, st = null;   // (the build's terrain (its noise) and what it planted: the tests)
  LOOK.pre = ({ P }) => { PP = P; st = { eucalyptus: 0, wattle: 0, hagenia: 0, rapanea: 0, bamboo: 0 }; };
  LOOK.treeGeo = () => [eucGeo(), broadGeo(), bambooGeo()];   // (the kinds own, own + 1, own + 2 of LOOK.tree)

  /* ---- each tree the shared builder plants (its place by the land cover, its random numbers r2..r4: none of our own): in the reserve the
     forest's tall trees (lc 1) are bamboo in its thickets (a slow noise, about a third of the forest), else Hagenia (two in three) and Rapanea;
     outside it the woodlots' trees are eucalyptus (four in five) and black wattle, and a few of the shrubs on the farmland (lc 0) lone trees of
     the two; the shrubs elsewhere as the shared builder's ---- */
  LOOK.tree = (x, z, c, sp, hgt, wid, col, r2, r3, r4, own) => {
    const res = inEchuya(x, z);
    if (c === 1 && sp === 0) {
      const u = r3 / 0.7;   // (sp 0 in the forest: r3 < 0.7)
      if (res) {
        if (PP && PP.n2(x * 0.5 - 130, z * 0.5 + 60) + (r4 - 0.5) * 0.2 > 0.58) { st.bamboo++; const h = 6 + r4 * 5; return [own + 2, h, h * (0.55 + r2 * 0.2), [0.92 + r2 * 0.16, 0.95 + r4 * 0.1, 0.9 + u * 0.12]]; }
        if (u < 0.65) { st.hagenia++; const h = 9 + r4 * 9; return [own + 1, h, h * (0.55 + r2 * 0.15), [0.9 + r2 * 0.18, 0.92 + r4 * 0.14, 0.88 + u * 0.12]]; }
        st.rapanea++; const h = 7 + r4 * 6; return [own + 1, h, h * (0.42 + r2 * 0.08), [0.78 + r2 * 0.12, 0.84 + r4 * 0.1, 0.8 + u * 0.1]];
      }
      if (u < 0.8) { st.eucalyptus++; const h = 14 + r4 * 12; return [own, h, h * (0.38 + r2 * 0.12), [0.92 + r2 * 0.16, 0.95 + r4 * 0.1, 0.92 + u * 0.1]]; }
      st.wattle++; const h = 6 + r4 * 8; return [own + 1, h, h * (0.55 + r2 * 0.15), [0.8 + r2 * 0.12, 0.86 + r4 * 0.1, 0.8 + u * 0.1]];
    }
    if (!res && c === 0 && r2 < 0.15) {   // (a lone tree between the fields)
      const v = r2 / 0.15;
      if (r3 < 0.7) { st.eucalyptus++; const h = 12 + r4 * 10; return [own, h, h * (0.4 + v * 0.12), [0.92 + v * 0.16, 0.95 + r4 * 0.1, 0.92]]; }
      st.wattle++; const h = 5 + r4 * 6; return [own + 1, h, h * (0.6 + v * 0.15), [0.8 + v * 0.12, 0.86 + r4 * 0.1, 0.8]];
    }
    return [sp, hgt, wid, col];
  };
  LOOK.extra = ({ out }) => { out.kanaba = st; };   // (what was planted: the tests)
})();
