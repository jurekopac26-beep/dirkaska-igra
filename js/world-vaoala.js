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
    if (k.out) k.out.vaoala = st;
  };
})();
