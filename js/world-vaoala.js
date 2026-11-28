// WORLD — Vaoala, Samoa: the track's own roadside (docs/proge/vaoala.md, »Ob cesti«), on top of the shared pass (js/world-prelaz.js,
// PL_LOOK.vaoala), which this file changes for Vaoala only. Hooked by wrapping PL_LOOK.vaoala.extra; loaded after js/world-prelaz.js.
// Graphics only: the terrain, the road, its invisible barriers and the driving are untouched.
// What it adds, by the land cover along the road (def.lc: ESA WorldCover 2021, corrected with Sentinel-2) and OpenStreetMap's houses:
//   - the rain forest (lc 1) and the bush (lc 2): its edge against the road a wall of undergrowth, tree ferns, wild banana, and the blankets
//     of the climbing vine (Merremia peltata, the lime-green vine that smothers the forest edges and the clearings of Upolu) over the shrubs;
//   - the open ground (lc 0) and the villages (lc 3, or a house of OpenStreetMap within 30 m): gardens beside the houses, banana and
//     breadfruit, a few clumps of fern and bush between them;
//   - the three hedges OpenStreetMap maps in Vaoala (barrier=hedge), drawn as hedges of croton (red, yellow and green leaves: an assumption,
//     OpenStreetMap gives no species; croton is the common hedge plant of Samoan villages);
//   - the sea seen from the ridge (the far terrain's wet nodes, def.farDem.lake): the deep blue of open water instead of the default grey-blue.
// Where each plant stands is not the real place of a plant: they are spread by the land cover, the slope and a hash, as the shared world's
// trees are. Drawn only into the scenery chunks the shared world already fills (no new chunks); the shared ground-shadow pass adds a
// few footprint strips under the mounds (perf on the phone budget: 150 calls, at most 157, within tests/golden/perf.json).
// Data: © OpenStreetMap contributors, ODbL 1.0; ESA WorldCover 2021, CC BY 4.0; Copernicus DEM GLO-30 (README.md, »Zasluge«).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK || !World.api.PL_LOOK.vaoala) return;
  const API = World.api, L = API.PL_LOOK.vaoala;
  const { caGround, caSlope, clamp, cyl, ico, lerp, rpHash, vrLC, vrNear } = API;
  let T; API.sync.push(() => { ({ T } = API); });

  // the far sea: open water off the north coast of Upolu (the reef's lagoon is too narrow for the far grid's 250 m cells)
  L.far = Object.assign({}, L.far, { wet: [0.07, 0.27, 0.4] });

  // the hedges of OpenStreetMap (tools/vaoala/vaoala.json, walls: barrier=hedge), in the game's metres (the extract's frame + 1.1, -1.1)
  const HEDGES = [
    [-342.6, 487.4, -323, 495.4],
    [-428.7, 445.6, -316.5, 490.8],
    [-339.8, 528.8, -323, 495.4],
  ];

  // more of OpenStreetMap's own, in the same frame: the two shade houses of the market garden behind the produce shops of Letava
  // (landuse=greenhouse_horticulture, ~26 x 6 m each), the two produce shops (shop=greengrocer: their stalls go between the shop and the
  // road; the shops themselves are the shared world's houses), the village's court in Vaoala (leisure=pitch, sport=basketball) and the
  // three rows of trees (natural=tree_row; OpenStreetMap gives no species: breadfruit, the common shade tree of the villages, an assumption)
  const SHADE = [[-81.9, 290.9, -56.2, 276.7, -53.0, 282.5, -78.7, 296.7], [-85.4, 284.5, -59.8, 270.3, -56.5, 276.2, -82.2, 290.4]];
  const SHOPS = [[-91.0, 291.0], [-102.9, 302.0]];
  const COURT = [-371.2, 612.3, -332.4, 628.3, -338.6, 643.5, -377.5, 627.5];
  const ROWS = [[-221.0, 531.7, -241.8, 579.1], [-288.4, 514.7, -297.9, 546.4], [-298.0, 484.1, -315.2, 547.4, -310.0, 564.0]];
  const box = World.box;

  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)], sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const FERN = [0.24, 0.46, 0.13], FERN2 = [0.36, 0.56, 0.18], TRUNK = [0.24, 0.17, 0.12], VINE = [0.42, 0.58, 0.12], VINE2 = [0.34, 0.5, 0.1];
  const BAN = [0.32, 0.56, 0.16], BAN2 = [0.5, 0.6, 0.22], BANDRY = [0.55, 0.47, 0.26], STEM = [0.44, 0.5, 0.26];
  const BREAD = [0.13, 0.31, 0.1], BUSH = [0.16, 0.34, 0.11], CROTON = [[0.62, 0.16, 0.1], [0.78, 0.6, 0.12], [0.22, 0.4, 0.14], [0.55, 0.3, 0.1]];

  // one leaf triangle, wound so it faces up (the chase camera looks down on it)
  function leafTri(g, a, b, c, ca, cc) {
    const ux = b[0] - a[0], uz = b[2] - a[2], vx = c[0] - a[0], vz = c[2] - a[2];
    if (uz * vx - ux * vz >= 0) g.tri(a, b, c, ca, ca, cc); else g.tri(a, c, b, ca, cc, ca);
  }
  // a frond or a leaf: from the base out to the tip at angle a, arching up by rise at its middle and drooping by fall at the tip
  function frond(g, x, y, z, a, len, wid, rise, fall, cb, ct) {
    const c = Math.cos(a), s = Math.sin(a), px = -s, pz = c;
    const m = [x + c * len * 0.5, y + rise, z + s * len * 0.5], t = [x + c * len, y - fall, z + s * len];
    const l = [m[0] + px * wid, m[1], m[2] + pz * wid], r = [m[0] - px * wid, m[1], m[2] - pz * wid], b = [x, y, z];
    leafTri(g, b, l, m, cb, cb); leafTri(g, b, m, r, cb, cb); leafTri(g, l, t, m, cb, ct); leafTri(g, m, t, r, cb, ct);
  }
  function treeFern(g, x, y, z, h, r, q) {   // a tree fern: a thin dark trunk, a crown of nine fronds
    cyl(g, x, y - 0.2, z, 0.11, h + 0.2, 4, TRUNK, null, 0.09);
    for (let k = 0; k < 9; k++) frond(g, x, y + h, z, (k + q) / 9 * 6.283, r * (0.85 + 0.3 * rpHash(k, q * 97)), 0.32, 0.25, r * 0.45, FERN, FERN2);
  }
  function banana(g, x, y, z, h, q, wild) {   // a banana plant: the green pseudostem, six long paddle leaves, one of them dry and torn
    cyl(g, x, y - 0.2, z, 0.13, h + 0.2, 4, STEM, null, 0.1);
    for (let k = 0; k < 6; k++) frond(g, x, y + h, z, (k + q) / 6 * 6.283 + q, 1.7 + 0.5 * rpHash(k, q * 31), 0.34, 0.45, 0.7,
      k === 5 && wild ? BANDRY : BAN, k === 5 && wild ? BANDRY : BAN2);
  }
  function breadfruit(g, x, y, z, q, r_) {   // a breadfruit tree: a short trunk, a broad dark crown
    cyl(g, x, y - 0.2, z, 0.22, 3.6, 4, TRUNK, null, 0.17);
    ico(g, x, y + 5.2, z, 3.1 + q, 0.72, BREAD, r_, 0.25);
  }
  function vine(g, x, y, z, r, q, r_) {   // the vine's blanket over the bush: a low lime-green mound
    ico(g, x, y + r * 0.35, z, r, 0.55, mix(VINE, VINE2, q), r_, 0.3);
  }

  const CLOTH = [0.12, 0.3, 0.17], CLOTH2 = [0.16, 0.36, 0.2], POST = [0.6, 0.6, 0.58], CONC = [0.62, 0.6, 0.56], PAINT = [0.86, 0.86, 0.82];
  const AWN = [[0.2, 0.42, 0.66], [0.72, 0.2, 0.16]], WOOD = [0.5, 0.36, 0.22], FRUIT = [[0.86, 0.76, 0.2], [0.42, 0.6, 0.16], [0.42, 0.3, 0.18], [0.5, 0.36, 0.3]];
  // a quad seen from both sides (the shade cloth: the camera sees its roof from the hill above and its underside from the road)
  function quad2(g, a, b, c, d, col) { g.tri(a, b, c, col, col, col); g.tri(a, c, d, col, col, col); g.tri(a, c, b, col, col, col); g.tri(a, d, c, col, col, col); }
  // a shade house: steel posts every ~4 m, a flat roof and the sides of green shade cloth down to ~0.4 m above the ground
  function shadeHouse(get, p, clear) {
    const A = [p[0], p[1]], B = [p[2], p[3]], D = [p[6], p[7]], ux = B[0] - A[0], uz = B[1] - A[1], vx = D[0] - A[0], vz = D[1] - A[1];
    const nu = Math.max(1, Math.round(Math.hypot(ux, uz) / 4)), nv = Math.max(1, Math.round(Math.hypot(vx, vz) / 3)), H = 2.6;
    const P = (i, j) => [A[0] + ux * i / nu + vx * j / nv, A[1] + uz * i / nu + vz * j / nv];
    let y0 = Infinity; for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const [x, z] = P(i, j); y0 = Math.min(y0, caGround(x, z)); }
    const top = y0 + H; let n = 0;
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const [ax, az] = P(i, j), [bx, bz] = P(i + 1, j), [cx, cz] = P(i + 1, j + 1), [dx, dz] = P(i, j + 1), mx = (ax + cx) / 2, mz = (az + cz) / 2;
      if (!clear(mx, mz, 1.2)) continue; const g = get(mx, mz); if (!g) continue; n++;
      quad2(g, [ax, top, az], [bx, top, bz], [cx, top, cz], [dx, top, dz], (i + j) % 2 ? CLOTH : CLOTH2);
      const side = (x0, z0, x1, z1) => quad2(g, [x0, caGround(x0, z0) + 0.4, z0], [x1, caGround(x1, z1) + 0.4, z1], [x1, top, z1], [x0, top, z0], CLOTH);
      if (j === 0) side(ax, az, bx, bz); if (j === nv - 1) side(dx, dz, cx, cz); if (i === 0) side(ax, az, dx, dz); if (i === nu - 1) side(bx, bz, cx, cz);
      for (const [x, z] of [[ax, az], [bx, bz], [cx, cz], [dx, dz]]) if (clear(x, z, 0.6)) { const y = caGround(x, z); cyl(g, x, y - 0.2, z, 0.05, top - y + 0.2, 4, POST); }
    }
    return n;
  }
  // a produce stall: a trestle table under a striped awning on four poles, the fruit in heaps on it (bananas, coconuts, taro)
  function stall(g, x, y, z, rot, q) {
    const c = Math.cos(rot), s = Math.sin(rot), at = (a, b) => [x + a * c - b * s, z + a * s + b * c];
    box(g, x, y + 0.75, z, 2.4, 0.08, 0.9, rot, WOOD);
    for (const [a, b] of [[-1.1, -0.38], [1.1, -0.38], [-1.1, 0.38], [1.1, 0.38]]) { const [px, pz] = at(a, b); box(g, px, y, pz, 0.07, 0.75, 0.07, rot, WOOD); }
    for (const [a, b] of [[-1.35, -0.7], [1.35, -0.7], [-1.35, 0.7], [1.35, 0.7]]) { const [px, pz] = at(a, b); cyl(g, px, y, pz, 0.04, 2.3, 4, POST); }
    for (let k = 0; k < 4; k++) { const [px, pz] = at(-1.35 + 0.675 * k + 0.3375, 0); box(g, px, y + 2.25, pz, 0.675, 0.05, 1.6, rot, AWN[(k + q) % 2]); }
    for (let k = 0; k < 5; k++) { const [px, pz] = at(-0.9 + 0.45 * k, -0.1 + 0.1 * (k % 2)); ico(g, px, y + 0.88, pz, 0.2, 0.7, FRUIT[(k + q) % 4], null, 0); }
  }
  // the court: a slab of concrete draped over the ground, its white lines, a hoop at each end on a steel post
  function court(get, p) {
    const A = [p[0], p[1]], B = [p[2], p[3]], D = [p[6], p[7]], ux = B[0] - A[0], uz = B[1] - A[1], vx = D[0] - A[0], vz = D[1] - A[1];
    const Lu = Math.hypot(ux, uz), Lv = Math.hypot(vx, vz), nu = 8, nv = 4, cx = A[0] + (ux + vx) / 2, cz = A[1] + (uz + vz) / 2;
    const P = (i, j, e = 0) => { const x = A[0] + ux * i / nu + vx * j / nv, z = A[1] + uz * i / nu + vz * j / nv; return [x, caGround(x, z) + 0.06 + e, z]; };
    const g = get(cx, cz); if (!g) return 0;
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1); leafTri(g, a, b, c, CONC, CONC); leafTri(g, a, c, d, CONC, CONC); }
    const line = (i0, j0, i1, j1) => { const a = P(i0, j0, 0.01), b = P(i1, j1, 0.01), dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1, wx = -dz / l * 0.06, wz = dx / l * 0.06;
      leafTri(g, [a[0] - wx, a[1], a[2] - wz], [b[0] - wx, b[1], b[2] - wz], [b[0] + wx, b[1], b[2] + wz], PAINT, PAINT); leafTri(g, [a[0] - wx, a[1], a[2] - wz], [b[0] + wx, b[1], b[2] + wz], [a[0] + wx, a[1], a[2] + wz], PAINT, PAINT); };
    const m = 0.08 * nv; line(0.5, m, nu - 0.5, m); line(0.5, nv - m, nu - 0.5, nv - m); line(0.5, m, 0.5, nv - m); line(nu - 0.5, m, nu - 0.5, nv - m); line(nu / 2, m, nu / 2, nv - m);
    const rot = Math.atan2(uz, ux);
    for (const e of [0.5, nu - 0.5]) { const [x, y, z] = P(e, nv / 2), k = e < nu / 2 ? 1 : -1, ex = ux / Lu * k, ez = uz / Lu * k;
      cyl(g, x - ex * 0.6, y - 0.2, z - ez * 0.6, 0.07, 3.3, 5, POST);
      box(g, x, y + 2.9, z, 0.05, 1.05, 1.8, rot, PAINT);
      const rx = x + ex * 0.35, rz = z + ez * 0.35; for (let t = 0; t < 8; t++) { const a0 = t / 8 * 6.283, a1 = (t + 1) / 8 * 6.283;
        box(g, rx + Math.cos((a0 + a1) / 2) * 0.23, y + 3.05, rz + Math.sin((a0 + a1) / 2) * 0.23, 0.18, 0.03, 0.03, (a0 + a1) / 2 + 1.571, AWN[1]); } }
    return 1;
  }

  // room for them before the shared world spreads its trees, bushes and rocks (L.pre: exclusion circles over the shade houses and the court)
  const pre0 = L.pre;
  L.pre = function (o) {
    const r = pre0 ? pre0.call(this, o) : undefined;
    for (const p of SHADE.concat([COURT])) { const ux = p[2] - p[0], uz = p[3] - p[1], vx = p[6] - p[0], vz = p[7] - p[1], nu = Math.ceil(Math.hypot(ux, uz) / 3), nv = Math.ceil(Math.hypot(vx, vz) / 3);
      for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) o.exclPush(p[0] + ux * i / nu + vx * j / nv, p[1] + uz * i / nu + vz * j / nv, 2.6); }
    return r;
  };

  const ex0 = L.extra;
  L.extra = function (k) {
    if (ex0) ex0.call(this, k);
    const { scen, excluded, onSide } = k, def = T.def;
    // only the scenery chunks the shared world already fills: a new chunk would be a new draw call (and one more in the shadow pass)
    const chunk = (x, z) => { const g = scen.map.get(Math.floor(x / scen.size) + ',' + Math.floor(z / scen.size)); return g && !g.empty ? g : null; };
    let seed = 7711; const r_ = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    // the houses (OpenStreetMap, def.bld) in a 40 m grid, to tell a village garden from the bush
    const hg = new Map(); for (const b of def.bld || []) { const key = Math.floor(b[0] / 40) + ',' + Math.floor(b[1] / 40); (hg.get(key) || hg.set(key, []).get(key)).push(b); }
    const nearHouse = (x, z, d) => { for (let a = -1; a <= 1; a++) for (let c = -1; c <= 1; c++) for (const b of hg.get((Math.floor(x / 40) + a) + ',' + (Math.floor(z / 40) + c)) || [])
      if (Math.hypot(b[0] - x, b[1] - z) < d + Math.max(b[2], b[3]) * 0.5) return true; return false; };
    const s0 = T.startS, sF = T.finishS, st = { fern: 0, banana: 0, bread: 0, vine: 0, bush: 0, hedge: 0 };
    const clearOf = (x, z, r) => { const n = vrNear(x, z); return n.i >= 0 && Math.abs(n.lat) > (T.bl[n.i] + T.br[n.i]) * 0.5 + r; };
    for (let s = s0 - 40; s < sF + 150; s += 2.6) {
      if (Math.abs(s - s0) < 22 || Math.abs(s - sF) < 30) continue;   // (the start's and the finish's gantries, the marshals, the crowd)
      for (const side of [-1, 1]) {
        const q = rpHash(Math.round(s * 10), side + 7);
        const o = 1.2 + q * q * 16, [x, z] = onSide(s, side, o);
        if (excluded(x, z) || !clearOf(x, z, 1.6) || caSlope(x, z) > 1.1) continue;
        const g = chunk(x, z); if (!g) continue;
        const y = caGround(x, z), c = vrLC(x, z), vil = c === 3 || nearHouse(x, z, 30), q2 = rpHash(Math.round(s * 7), side + 19);
        if (!vil && (c === 1 || c === 2)) {   // the forest's edge and the bush
          if (q2 < 0.34) { treeFern(g, x, y, z, 2.2 + 2.6 * q, 2.2 + q, q2 * 9); st.fern++; }
          else if (q2 < 0.56) { banana(g, x, y, z, 2.3 + q, q2 * 5, 1); st.banana++; }
          else { vine(g, x, y, z, 1.6 + 2.2 * q2, q, r_); st.vine++; }
        } else if (vil) {   // the gardens by the houses
          if (q2 < 0.4) { banana(g, x, y, z, 2.1 + q * 0.8, q2 * 5, 0); st.banana++; }
          else if (q2 < 0.52 && o > 6) { breadfruit(g, x, y, z, q, r_); st.bread++; }
          else if (q2 < 0.62) { ico(g, x, y + 0.5, z, 0.9, 0.8, CROTON[Math.floor(q * 4)], r_, 0.3); st.bush++; }
        } else if (q2 < 0.3) {   // the open ground: a few clumps of fern and bush, banana gone wild
          if (q2 < 0.12) { treeFern(g, x, y, z, 1.6 + 1.5 * q, 1.8, q2 * 9); st.fern++; }
          else if (q2 < 0.2) { banana(g, x, y, z, 2 + q, q2 * 5, 1); st.banana++; }
          else { ico(g, x, y + 0.5, z, 1.1 + q, 0.7, sh(BUSH, 0.9 + 0.3 * q), r_, 0.3); st.bush++; }
        }
      }
    }
    // the hedges: a row of croton clumps, 1.1 m apart
    for (const [ax, az, bx, bz] of HEDGES) {
      const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 1.1));
      for (let j = 0; j <= n; j++) { const x = lerp(ax, bx, j / n), z = lerp(az, bz, j / n); const g = chunk(x, z); if (!g || !clearOf(x, z, 1)) continue;
        ico(g, x, caGround(x, z) + 0.55, z, 0.62, 1.15, CROTON[(j * 7 + 3) % 4], r_, 0.25); st.hedge++; }
    }
    // OpenStreetMap's shade houses, the stalls by the produce shops, the court, the rows of trees
    st.shade = 0; st.stall = 0; st.court = 0; st.row = 0;
    for (const p of SHADE) st.shade += shadeHouse(chunk, p, clearOf);
    SHOPS.forEach(([bx, bz], q) => {   // the stall on the shop's road side, its long side along the road
      const n = vrNear(bx, bz), i = n.i, side = n.lat > 0 ? 1 : -1; if (i < 0) return;   // (vrNear's answer is one shared object: read it at once)
      const [x, z] = onSide(i * T.ds, side, 1.4); if (!clearOf(x, z, 0.9)) return; const g = chunk(x, z); if (!g) return;
      stall(g, x, caGround(x, z), z, Math.atan2(T.nz[i], T.nx[i]) + 1.571, q); st.stall++; });
    st.court = court(chunk, COURT);
    for (const r of ROWS) for (let j = 0; j + 3 < r.length; j += 2) {
      const ax = r[j], az = r[j + 1], bx = r[j + 2], bz = r[j + 3], n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 7));
      for (let i = 0; i <= n; i++) { const x = lerp(ax, bx, i / n), z = lerp(az, bz, i / n); if (!clearOf(x, z, 3)) continue; const g = chunk(x, z); if (!g) continue;
        breadfruit(g, x, caGround(x, z), z, rpHash(i, j + 5) * 0.6, r_); st.row++; }
    }
    if (k.out) k.out.vaoala = st;
  };
})();
