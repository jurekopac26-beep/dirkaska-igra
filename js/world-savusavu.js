// WORLD — Savusavu, Fiji: the track's own world (docs/proge/savusavu.md, »Dodelava«), on top of the shared pass (js/world-prelaz.js,
// PL_LOOK.savusavu) and its side streets (js/world-savusavu-obcestje.js). Hooked by wrapping PL_LOOK.savusavu.extra (after the side
// streets' wrapper); loaded after js/world-savusavu-obcestje.js. Changes the shared pass for Savusavu only; graphics only: the terrain,
// the road, its invisible barriers and the driving are untouched.
// What it adds, by the land cover along the road (def.lc: ESA WorldCover 2021) and OpenStreetMap's houses and water:
//   - the open ground and the gardens (lc 0 and 3, or a house within 30 m): coconut palms, leaning, with their nuts (the plateau by the
//     airfield and the town's slope down to the bay), banana and breadfruit beside the houses, a few hibiscus bushes;
//   - the forest on the slope (lc 1) and the bush (lc 2): at its edge tree ferns, wild banana and the African tulip tree (Spathodea
//     campanulata, gone wild over Vanua Levu: its broad crown with the orange flowers on top);
//   - the reeds round the two ponds OpenStreetMap maps by the road (def.lakes);
//   - the mangroves of Nawi island across the bay (OpenStreetMap 1184782367, natural=wetland, wetland=mangrove): a low, dense, dark crown
//     standing in the sea on its roots, seen from the town's slope and the finish.
// Where each plant stands is not the real place of a plant (OSM maps no single tree here): they are spread by the land cover, the slope and
// a hash, as the shared world's trees are; the palms' and the tulip trees' share is an assumption, said in the pull request.
// Drawn only into the scenery chunks the shared world already fills (no new chunks, no new draw calls; the mangroves into the chunk nearest
// to them): only vertices.
// Data: © OpenStreetMap contributors, ODbL 1.0; ESA WorldCover 2021, CC BY 4.0; Copernicus DEM GLO-30 (README.md, »Zasluge«).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK || !World.api.PL_LOOK.savusavu) return;
  const API = World.api, L = API.PL_LOOK.savusavu;
  const { caGround, caSlope, cyl, ico, lerp, rpHash, vrLC, vrNear, vrWater } = API;
  let T; API.sync.push(() => { ({ T } = API); });

  // the far sea: Savusavu bay and the Koro Sea seen from the ridge, open blue water instead of the default grey-blue
  L.far = Object.assign({}, L.far, { wet: [0.06, 0.28, 0.42] });

  // Nawi island's mangroves (OSM way 1184782367), in the game's metres: the edge facing the bay and the town, from its north to its south
  const MANGROVE = [-384, -2433, -357, -2418, -342, -2407, -326, -2402, -290, -2409, -262, -2443, -234, -2469, -199, -2469, -170, -2493, -157, -2527,
    -154, -2575, -159, -2621, -168, -2650, -194, -2679, -221, -2714, -263, -2739];

  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)], sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const PALM = [0.27, 0.5, 0.14], PALM2 = [0.5, 0.58, 0.2], PALMDRY = [0.56, 0.46, 0.24], PTRUNK = [0.45, 0.39, 0.31], NUT = [0.36, 0.4, 0.12];
  const FERN = [0.22, 0.44, 0.12], FERN2 = [0.34, 0.54, 0.17], TRUNK = [0.25, 0.18, 0.12];
  const BAN = [0.33, 0.57, 0.16], BAN2 = [0.5, 0.6, 0.22], BANDRY = [0.55, 0.47, 0.26], STEM = [0.44, 0.5, 0.26];
  const BREAD = [0.12, 0.3, 0.1], TULIP = [0.13, 0.3, 0.1], FLOWER = [[0.93, 0.36, 0.08], [0.86, 0.22, 0.06], [0.96, 0.5, 0.12]];
  const HIBISCUS = [0.17, 0.36, 0.12], HFLOWER = [0.84, 0.12, 0.14], REED = [0.42, 0.52, 0.2], REED2 = [0.6, 0.6, 0.3];
  const MANG = [0.1, 0.24, 0.08], MANG2 = [0.15, 0.32, 0.1], ROOT = [0.3, 0.25, 0.18];

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
  // a coconut palm: a grey trunk in four segments, leaning away (angle a) and curving back up, a crown of ten long drooping fronds (the
  // lowest one or two dry), the bunch of nuts under it
  function palm(g, x, y, z, h, a, lean, q, r_) {
    const ca = Math.cos(a), sa = Math.sin(a), ring = [];
    for (let k = 0; k <= 4; k++) {   // (the trunk's axis: out along a, most of the lean low down, the top coming back up; tapering)
      const f = k / 4, off = lean * (1 - (1 - f) * (1 - f));
      ring.push([x + ca * off, y - 0.3 + (h + 0.3) * f, z + sa * off, 0.22 - 0.08 * f]);
    }
    for (let k = 0; k < 4; k++) {
      const A = ring[k], B = ring[k + 1], inn = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2], col = sh(PTRUNK, 0.92 + 0.05 * k);
      for (let i = 0; i < 5; i++) {
        const a0 = i / 5 * 6.283, a1 = (i + 1) / 5 * 6.283, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        g.quadO([A[0] + c0 * A[3], A[1], A[2] + s0 * A[3]], [B[0] + c0 * B[3], B[1], B[2] + s0 * B[3]], [B[0] + c1 * B[3], B[1], B[2] + s1 * B[3]], [A[0] + c1 * A[3], A[1], A[2] + s1 * A[3]], col, inn);
      }
    }
    const px = ring[4][0], pz = ring[4][2], top = ring[4][1];
    for (let k = 0; k < 10; k++) {
      const dry = k >= 8 && q > 0.35, an = (k + q) / 10 * 6.283 + 0.3 * rpHash(k, q * 113), len = 4 + 1.2 * rpHash(k, q * 59);
      frond(g, px, top, pz, an, len, 0.5, 0.5, dry ? 2.6 : 1.5 + 0.5 * rpHash(k, q * 71), dry ? PALMDRY : PALM, dry ? PALMDRY : PALM2);
    }
    ico(g, px + 0.3, top - 0.4, pz, 0.34, 0.9, NUT, r_, 0.1);
  }
  function treeFern(g, x, y, z, h, r, q) {   // a tree fern: a thin dark trunk, a crown of seven fronds
    cyl(g, x, y - 0.2, z, 0.11, h + 0.2, 4, TRUNK, null, 0.09);
    for (let k = 0; k < 7; k++) frond(g, x, y + h, z, (k + q) / 7 * 6.283, r * (0.85 + 0.3 * rpHash(k, q * 97)), 0.38, 0.25, r * 0.45, FERN, FERN2);
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
  // an African tulip tree: a tall trunk, a broad crown, the orange flowers in three clusters on its top
  function tulip(g, x, y, z, q, r_) {
    const h = 7 + 3 * q;
    cyl(g, x, y - 0.2, z, 0.3, h * 0.6, 5, TRUNK, null, 0.22);
    ico(g, x, y + h * 0.72, z, 3.4 + q, 0.62, sh(TULIP, 0.95 + 0.15 * q), r_, 0.25);
    for (let k = 0; k < 3; k++) {
      const an = k * 2.1 + q * 6, rr = 1.2 + 0.8 * rpHash(k, q * 41);
      ico(g, x + Math.cos(an) * rr, y + h * 0.72 + 1.4 + 0.4 * rpHash(k, q * 43), z + Math.sin(an) * rr, 1.1 + 0.3 * rpHash(k, q * 47), 0.5, FLOWER[k % 3], r_, 0.2);
    }
  }
  function hibiscus(g, x, y, z, q, r_) {   // a hibiscus bush with a few red flowers
    ico(g, x, y + 0.7, z, 1 + 0.3 * q, 0.85, HIBISCUS, r_, 0.3);
    for (let k = 0; k < 2; k++) { const an = k * 3.1 + q * 5; ico(g, x + Math.cos(an) * 0.75, y + 1.2, z + Math.sin(an) * 0.75, 0.16, 1, HFLOWER, r_, 0.1); }
  }
  function reeds(g, x, y, z, q) {   // a clump of reeds: seven thin blades, leaning a little
    for (let k = 0; k < 7; k++) {
      const an = k * 0.9 + q * 6, d = 0.35 * rpHash(k, q * 17), bx = x + Math.cos(an) * d, bz = z + Math.sin(an) * d, h = 1.3 + 0.7 * rpHash(k, q * 19);
      const lx = Math.cos(an) * 0.25, lz = Math.sin(an) * 0.25, wx = -Math.sin(an) * 0.05, wz = Math.cos(an) * 0.05, c = mix(REED, REED2, rpHash(k, q * 23));
      const a = [bx - wx, y - 0.1, bz - wz], b = [bx + wx, y - 0.1, bz + wz], t = [bx + lx, y + h, bz + lz];
      g.tri(a, b, t, REED, REED, c); g.tri(b, a, t, REED, REED, c);
    }
  }
  // a mangrove clump: its arching roots in the water, a low dense crown over them
  function mangrove(g, x, y, z, r, q, r_) {
    for (let k = 0; k < 3; k++) { const an = k * 2.1 + q * 5; cyl(g, x + Math.cos(an) * r * 0.45, y - 0.4, z + Math.sin(an) * r * 0.45, 0.12, 1.5, 4, ROOT, null, 0.08); }
    ico(g, x, y + 1.3 + r * 0.35, z, r, 0.5, mix(MANG, MANG2, q), r_, 0.3);
  }

  const ex0 = L.extra;
  L.extra = function (k) {
    if (ex0) ex0.call(this, k);
    const { scen, excluded, onSide, P } = k, def = T.def;
    // only the scenery chunks the shared world already fills: a new chunk would be a new draw call (and one more in the shadow pass)
    const chunk = (x, z) => { const g = scen.map.get(Math.floor(x / scen.size) + ',' + Math.floor(z / scen.size)); return g && !g.empty ? g : null; };
    let seed = 6791; const r_ = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    // the houses (OpenStreetMap, def.bld) in a 40 m grid, to tell a garden from the bush
    const hg = new Map(); for (const b of def.bld || []) { const key = Math.floor(b[0] / 40) + ',' + Math.floor(b[1] / 40); (hg.get(key) || hg.set(key, []).get(key)).push(b); }
    const nearHouse = (x, z, d) => { for (let a = -1; a <= 1; a++) for (let c = -1; c <= 1; c++) for (const b of hg.get((Math.floor(x / 40) + a) + ',' + (Math.floor(z / 40) + c)) || [])
      if (Math.hypot(b[0] - x, b[1] - z) < d + Math.max(b[2], b[3]) * 0.5) return true; return false; };
    const s0 = T.startS, sF = T.finishS, st = { palm: 0, fern: 0, banana: 0, bread: 0, tulip: 0, hibiscus: 0, reeds: 0, mangrove: 0 };
    const clearOf = (x, z, r) => { const n = vrNear(x, z); return n.i >= 0 && Math.abs(n.lat) > (T.bl[n.i] + T.br[n.i]) * 0.5 + r; };
    const dry = (x, z, r) => !(P.sea !== null && caGround(x, z) < P.sea + 0.5) && vrWater(x, z).e <= -r;
    for (let s = s0 - 40; s < sF + 150; s += 3.1) {
      if (Math.abs(s - s0) < 22 || Math.abs(s - sF) < 30) continue;   // (the start's and the finish's gantries, the marshals, the crowd)
      for (const side of [-1, 1]) {
        const q = rpHash(Math.round(s * 10), side + 31);
        const o = 1.4 + q * q * 18, [x, z] = onSide(s, side, o);
        if (excluded(x, z) || !clearOf(x, z, 1.8) || caSlope(x, z) > 1.1 || !dry(x, z, 1.5)) continue;
        const g = chunk(x, z); if (!g) continue;
        const y = caGround(x, z), c = vrLC(x, z), vil = c === 3 || nearHouse(x, z, 30), q2 = rpHash(Math.round(s * 7), side + 43);
        if (!vil && (c === 1 || c === 2)) {   // the forest's edge and the bush
          if (q2 < 0.3) { treeFern(g, x, y, z, 2.2 + 2.6 * q, 2.2 + q, q2 * 9); st.fern++; }
          else if (q2 < 0.48) { banana(g, x, y, z, 2.3 + q, q2 * 5, 1); st.banana++; }
          else if (q2 < 0.58 && o > 5) { tulip(g, x, y, z, q, r_); st.tulip++; }
        } else if (vil) {   // the gardens by the houses
          if (q2 < 0.22 && o > 3) { palm(g, x, y, z, 8 + 6 * q, q2 * 29, 1.2 + 2 * q, q, r_); st.palm++; }
          else if (q2 < 0.48) { banana(g, x, y, z, 2.1 + q * 0.8, q2 * 5, 0); st.banana++; }
          else if (q2 < 0.58 && o > 6) { breadfruit(g, x, y, z, q, r_); st.bread++; }
          else if (q2 < 0.7) { hibiscus(g, x, y, z, q, r_); st.hibiscus++; }
        } else if (q2 < 0.36) {   // the open ground: coconut palms in ones and twos, a little bush
          if (q2 < 0.2 && o > 3) { palm(g, x, y, z, 9 + 7 * q, q2 * 31, 1 + 2.4 * q, q, r_); st.palm++; }
          else if (q2 < 0.27) { banana(g, x, y, z, 2 + q, q2 * 5, 1); st.banana++; }
          else { hibiscus(g, x, y, z, q, r_); st.hibiscus++; }
        }
      }
    }
    // the reeds round the ponds: along each pond's shore, 1.6 m apart, from its edge to 1 m into the water
    for (const lk of def.lakes || []) {
      for (let j = 1; j + 3 < lk.length; j += 2) {
        const ax = lk[j], az = lk[j + 1], bx = lk[j + 2], bz = lk[j + 3], n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 1.6));
        for (let m = 0; m < n; m++) {
          const t = m / n, h = rpHash(Math.round(ax * 7 + m * 13), Math.round(az * 3));
          if (h < 0.3) continue;
          const x = lerp(ax, bx, t) + (h - 0.6) * 1.4, z = lerp(az, bz, t) + (rpHash(m, Math.round(ax)) - 0.5) * 1.4, g = chunk(x, z);
          if (!g || excluded(x, z) || !clearOf(x, z, 2)) continue;
          reeds(g, x, caGround(x, z), z, h); st.reeds++;
        }
      }
    }
    // Nawi island's mangroves: clumps 7 m apart along the edge OSM maps, a second row 9 m inland, into the nearest chunk the world fills
    if (P.sea !== null) {
      const filled = [...scen.map.entries()].filter(([, g]) => !g.empty).map(([key, g]) => { const [a, b] = key.split(',').map(Number); return [(a + 0.5) * scen.size, (b + 0.5) * scen.size, g]; });
      const nearest = (x, z) => { let best = null, bd = 1e18; for (const f of filled) { const d = (f[0] - x) ** 2 + (f[1] - z) ** 2; if (d < bd) { bd = d; best = f[2]; } } return best; };
      for (let j = 0; j + 3 < MANGROVE.length; j += 2) {
        const ax = MANGROVE[j], az = MANGROVE[j + 1], bx = MANGROVE[j + 2], bz = MANGROVE[j + 3], len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / 7));
        const ix = (bz - az) / len, iz = -(bx - ax) / len;   // (inland: the island's side of its edge)
        for (let m = 0; m < n; m++) for (const row of [0, 9]) {
          const t = m / n, h = rpHash(j * 31 + m, row + 5), x = lerp(ax, bx, t) + ix * row + (h - 0.5) * 3, z = lerp(az, bz, t) + iz * row, g = nearest(x, z);
          if (!g) continue;
          mangrove(g, x, Math.max(caGround(x, z), P.sea), z, 3.2 + 1.6 * h, h, r_); st.mangrove++;
        }
      }
    }
    if (k.out) k.out.savusavu = st;
  };
})();
