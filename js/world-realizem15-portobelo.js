// WORLD — realizem 15: Portobelo, Panama (docs/realizem.md, »Postopek za vse proge«)
// What OpenStreetMap maps within 60 m of the road and the track's own world (js/world-portobelo.js) does not draw yet.
// Hooked by wrapping the track's own builder (World.ext.portobelo): loaded right after it.
// Drawn:
//   - the concrete football pitch right of the road in the town (way 668708896: leisure=pitch, sport=soccer, surface=concrete), a slab laid on
//     the ground, with a goal frame at each end;
//   - the two squares (ways 668708897 and 668708898: place=square), paved slabs: the one beside the pitch and the one toward the bay, left of
//     the road;
//   - the four streams that cross the road (waterway=stream; ways 1348398295 and 1348398312 · 1348398305 · 604025447 · 604027997), their open
//     stretches from 0.8 m behind the barriers to 60 m from the road: a narrow ribbon of water between two low banks, on the ground as it is.
// Kept open (two hooks in js/world-portobelo.js, World.api.pbFree and World.api.pbOpen): the track's world fills the built-up land cover with
//   houses of its own and plants trees by the land cover; neither stands on the pitch, on the squares, on the volleyball pitch (way 668708899)
//   or in a stream's bed any more, and no house of its own in the park (way 1396647624: leisure=park) or over a stream. The buildings that
//   OpenStreetMap maps are not touched.
// Not drawn again (the world has them): the buildings, the fort, the coast and the sea, the trees by the land cover, the road's two bridges.
// Not drawn at all, said in the pull request: the culverts and the two short stretches of stream beside them (ways 1348398314, 1348398320:
//   inside the barrier line or within 4 m of it), the old stone bridge and its cobbled approaches (inside the barrier line), the two benches
//   (at the barrier line, behind the wall), the pier (it starts 50 m from the road), the fitness station (no equipment mapped), the car park
//   and the volleyball pitch (no surface mapped), the grass pitch (beyond 60 m), the side roads and paths (#779), the information board,
//   the names.
// Assumed and said so in the pull request: the streams' width (1.6 m of water, less between houses that stand closer; no width is mapped), the
//   first stream's last 4 m (OpenStreetMap's stream ends at its coastline, the game's shore lies 2 m farther), the goals (3 m by 2 m, from sport=soccer
//   on a pitch of 32 m by 15 m; no goal is mapped), the squares' paving (no surface is mapped); the slabs follow the game's ground.
// Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.portobelo) return;
  const A = World.api, { Chunks, box, inPoly, nrDist, nrGround, nrNear, rng, vary } = A;

  // game metres from the first point of the road (x east, z south); the areas' corners in ring order, the streams' nodes downstream, cut 66 m
  // from the road's centre line
  const PITCH = [[1739.27, -681.07], [1771.57, -682.61], [1772.30, -667.52], [1740.00, -665.98]];    // way 668708896 (32.3 m by 15.1 m)
  const SQ1 = [[1771.57, -682.61], [1798.54, -683.99], [1799.34, -668.88], [1772.30, -667.52]];      // way 668708897 (27 m by 15.1 m, the pitch's east side is its west side)
  const SQ2 = [[1877.02, -735.81], [1902.23, -737.08], [1903.52, -711.95], [1878.30, -710.67]];      // way 668708898 (25 m by 25 m)
  const PARK = [[1754.76, -733.31], [1788.17, -740.80], [1796.58, -706.83], [1762.86, -702.60]];     // way 1396647624
  const VOLLEY = [[2037.21, -676.55], [2055.55, -676.19], [2055.33, -664.93], [2036.99, -665.29]];   // way 668708899
  const STREAMS = [
    [[242.87, -117.19], [226.92, -144.32], [201.63, -160.60]],     // way 1348398295 (the first stream, above the road)
    [[176.54, -176.75], [154.10, -191.19], [150.74, -193.35]],     // way 1348398312 (the same, below the road; the last 4 m on along its line, to the game's shore)
    [[1035.30, -542.54], [1050.64, -603.64]],                      // way 1348398305 (the second, above the road)
    [[1874.02, -608.75], [1871.84, -623.06], [1869.43, -631.11], [1865.92, -637.98], [1861.30, -649.44], [1854.40, -657.45], [1852.29, -665.54], [1851.07, -671.54], [1844.63, -683.18],
      [1840.23, -723.75], [1835.54, -747.29], [1832.61, -764.50]],                                    // way 604025447 (the third, under the road's first bridge)
    [[2099.81, -565.55], [2098.74, -570.89], [2095.16, -579.29], [2090.28, -586.94], [2087.46, -591.77], [2084.64, -597.89], [2084.39, -602.97], [2086.44, -608.58], [2084.43, -615.56],
      [2085.74, -619.66], [2083.01, -626.94], [2087.45, -650.63], [2087.09, -670.82], [2090.05, -679.99], [2089.24, -698.72]]   // way 604027997 (the fourth, under the second bridge)
  ];
  const HW = 0.8, CREST = 0.95, FOOT = 1.7;   // a stream across: half the water, the banks' crests and their feet in the ground (m from its line)

  const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = dx * dx + dz * dz, t = l ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l)) : 0; return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
  const lineD = (L, x, z) => { let d = 1e9; for (let k = 0; k + 1 < L.length; k++) d = Math.min(d, segD(x, z, L[k], L[k + 1])); return d; };
  const areaD = (P, x, z) => { if (inPoly(P, x, z)) return 0; let d = 1e9; for (let i = 0, j = P.length - 1; i < P.length; j = i++) d = Math.min(d, segD(x, z, P[j], P[i])); return d; };
  const bil = (P, u, v) => [0, 1].map((q) => P[0][q] * (1 - u) * (1 - v) + P[1][q] * u * (1 - v) + P[2][q] * u * v + P[3][q] * (1 - u) * v);
  // a stream's line: its corners cut round (up to 3 m each side of a node), then a point every `step` metres
  const soften = (L) => {
    const o = [L[0]];
    for (let k = 1; k + 1 < L.length; k++) {
      const p = L[k], a = L[k - 1], b = L[k + 1], ca = Math.min(3, 0.45 * len(a, p)) / len(a, p), cb = Math.min(3, 0.45 * len(b, p)) / len(b, p);
      const a0 = [p[0] + (a[0] - p[0]) * ca, p[1] + (a[1] - p[1]) * ca], b0 = [p[0] + (b[0] - p[0]) * cb, p[1] + (b[1] - p[1]) * cb];
      for (let q = 0; q <= 4; q++) { const t = q / 4, u = 1 - t; o.push([u * u * a0[0] + 2 * u * t * p[0] + t * t * b0[0], u * u * a0[1] + 2 * u * t * p[1] + t * t * b0[1]]); }
    }
    o.push(L[L.length - 1]); return o;
  };
  const every = (L, step) => {
    const o = [L[0]]; let t = step;
    for (let k = 0; k + 1 < L.length; k++) { const a = L[k], b = L[k + 1], l = len(a, b); for (; t <= l; t += step) o.push([a[0] + (b[0] - a[0]) * t / l, a[1] + (b[1] - a[1]) * t / l]); t -= l; }
    return o;
  };
  const LINES = STREAMS.map((L) => every(soften(L), 1.25));

  // the two hooks of the track's world: the circles nothing of its own is planted or built in (the areas a little past their edges, the
  // streams 2.6 m each side of their lines), and where no house of its own goes (its centre 8 m from an area: its far corner off it; 6.5 m
  // from a stream)
  const FREE = [];
  for (const P of [PITCH, SQ1, SQ2, VOLLEY]) {
    const lu = len(P[0], P[1]), lv = len(P[0], P[3]), nu = Math.ceil((lu - 4.4) / 3), nv = Math.ceil((lv - 4.4) / 3);
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const [x, z] = bil(P, (2.2 + (lu - 4.4) * i / nu) / lu, (2.2 + (lv - 4.4) * j / nv) / lv); FREE.push([x, z, 4]); }
  }
  for (const L of LINES) for (let k = 0; k < L.length; k += 2) FREE.push([L[k][0], L[k][1], 2.6]);
  A.pbFree = () => FREE;
  A.pbOpen = (x, z) => [PITCH, SQ1, SQ2, PARK, VOLLEY].some((P) => areaD(P, x, z) < 8) || LINES.some((L) => lineD(L, x, z) < 6.5);

  const CONCRETE = [0.66, 0.65, 0.62], CONCRETE_EDGE = [0.5, 0.49, 0.47], PAVING = [0.63, 0.59, 0.53], PAVING_EDGE = [0.48, 0.45, 0.4], GOAL = [0.92, 0.92, 0.88];
  const WATER = [0.23, 0.33, 0.32], WET = [0.3, 0.29, 0.24], BANK = [0.45, 0.41, 0.33];

  function add(out) {
    if (!out || !out.root || !out.matV) return;
    const ch = new Chunks(512), R = rng(15507), bld = typeof PB_DATA !== 'undefined' && PB_DATA.bld || [];
    const clear = (x, z) => { const n = nrNear(x, z); return n.i < 0 || n.dd >= 0.8; };   // (nothing on the road: at least 0.8 m behind the barrier)
    const B = bld.map(([bx, bz, Lb, Wb, ang]) => [bx, bz, Lb / 2, Wb / 2, Math.cos(ang), Math.sin(ang)]);
    const bldD = (x, z) => { let d = 1e9; for (const [bx, bz, hl, hw, ca, sa] of B) { const dx = x - bx, dz = z - bz; d = Math.min(d, Math.hypot(Math.max(Math.abs(dx * ca + dz * sa) - hl, 0), Math.max(Math.abs(dz * ca - dx * sa) - hw, 0))); } return d; };   // (metres to the nearest mapped building)

    // a slab on the ground: cells of at most 1.5 m, 12 cm over the terrain, a kerb's height of side round what is drawn of it
    const slab = (P, col, edge) => {
      const nu = Math.ceil(len(P[0], P[1]) / 1.5), nv = Math.ceil(len(P[0], P[3]) / 1.5), V = [];
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const [x, z] = bil(P, i / nu, j / nv), y = nrGround(x, z); V.push({ p: [x, y + 0.12, z], f: [x, y - 0.15, z], c: vary(col, R, 0.07), ok: clear(x, z) }); }
      const at = (i, j) => V[j * (nu + 1) + i];
      const cell = (i, j) => i >= 0 && j >= 0 && i < nu && j < nv && at(i, j).ok && at(i + 1, j).ok && at(i + 1, j + 1).ok && at(i, j + 1).ok;
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        if (!cell(i, j)) continue;
        const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1), g = ch.get(a.p[0], a.p[2]), mid = [(a.p[0] + c.p[0]) / 2, a.p[1] - 1, (a.p[2] + c.p[2]) / 2];
        g.quadUp(a.p, b.p, c.p, d.p, [a.c, b.c, c.c, d.c]);
        const side = (u, v) => g.quadO(u.p, v.p, v.f, u.f, edge, mid);
        if (!cell(i, j - 1)) side(a, b);
        if (!cell(i + 1, j)) side(b, c);
        if (!cell(i, j + 1)) side(c, d);
        if (!cell(i - 1, j)) side(d, a);
      }
    };
    slab(PITCH, CONCRETE, CONCRETE_EDGE);
    slab(SQ1, PAVING, PAVING_EDGE);
    slab(SQ2, PAVING, PAVING_EDGE);

    // the goals: two posts and a crossbar in the middle of each short side of the pitch, 3 m wide and 2 m high
    for (const [p, q, r] of [[PITCH[0], PITCH[3], PITCH[1]], [PITCH[1], PITCH[2], PITCH[0]]]) {
      const l = len(p, q), ex = (q[0] - p[0]) / l, ez = (q[1] - p[1]) / l, li = len(p, r), cx = (p[0] + q[0]) / 2 + (r[0] - p[0]) / li * 0.4, cz = (p[1] + q[1]) / 2 + (r[1] - p[1]) / li * 0.4;
      if (!clear(cx, cz)) continue;
      const top = nrGround(cx, cz) + 2.12, rot = Math.atan2(ez, ex), g = ch.get(cx, cz);
      for (const s of [-1.5, 1.5]) { const x = cx + ex * s, z = cz + ez * s, y = nrGround(x, z) - 0.1; box(g, x, y, z, 0.12, top - y, 0.12, rot, GOAL, GOAL, true); }
      box(g, cx, top - 0.12, cz, 3.12, 0.12, 0.12, rot, GOAL);
    }

    // the streams: six points across each 1.25 m (the banks' feet in the ground, their crests 20 cm over it, the water level between them),
    // drawn where the stream is on land and within 60 m of the road and all six are behind the barriers, in stretches of at least 7.5 m;
    // narrower where a mapped building stands closer than a bank's foot (to 0.3 of the width; closer than that the stream is not drawn)
    const OFF = [-FOOT, -CREST, -HW, HW, CREST, FOOT];
    for (const L of LINES) {
      const n = L.length, rows = [];
      for (let k = 0; k < n; k++) {
        const [x, z] = L[k], a = L[Math.max(0, k - 1)], b = L[Math.min(n - 1, k + 1)], dl = len(a, b) || 1, nx = -(b[1] - a[1]) / dl, nz = (b[0] - a[0]) / dl, y0 = nrGround(x, z);
        const f = Math.min(1, (bldD(x, z) - 0.1) / FOOT);
        let ok = f >= 0.3 && nrDist(x, z) <= 60 && y0 > 0.05;
        const row = OFF.map((o) => { const px = x + nx * o * f, pz = z + nz * o * f; if (!clear(px, pz)) ok = false; return [px, nrGround(px, pz), pz]; });
        if (!ok) { rows.push(null); continue; }
        const w = Math.max(row[2][1], y0, row[3][1]) + 0.06;
        row[0][1] -= 0.12; row[5][1] -= 0.12; row[1][1] = Math.max(row[1][1] + 0.2, w + 0.12); row[4][1] = Math.max(row[4][1] + 0.2, w + 0.12); row[2][1] = row[3][1] = w;
        rows.push(row);
      }
      for (let k = 0; k < n; k++) {
        if (!rows[k]) continue;
        let e = k; while (e + 1 < n && rows[e + 1]) e++;
        if (e - k >= 6) {
          for (const q of [k, e]) for (const p of rows[q]) p[1] = nrGround(p[0], p[2]) - 0.12;   // (a stretch begins and ends in the ground)
          const cb = []; for (let q = k; q <= e; q++) cb.push([vary(BANK, R, 0.12), vary(BANK, R, 0.12)]);
          for (let q = k; q < e; q++) {
            const r0 = rows[q], r1 = rows[q + 1], g = ch.get(r0[2][0], r0[2][2]), c0 = cb[q - k], c1 = cb[q + 1 - k];
            g.quadUp(r0[0], r0[1], r1[1], r1[0], [c0[0], c0[0], c1[0], c1[0]]);
            g.quadUp(r0[1], r0[2], r1[2], r1[1], [WET, WET, WET, WET]);
            g.quadUp(r0[2], r0[3], r1[3], r1[2], [WATER, WATER, WATER, WATER]);
            g.quadUp(r0[3], r0[4], r1[4], r1[3], [WET, WET, WET, WET]);
            g.quadUp(r0[4], r0[5], r1[5], r1[4], [c0[1], c0[1], c1[1], c1[1]]);
          }
        }
        k = e;
      }
    }
    ch.addTo(out.root, out.matV, false, true);
  }

  const base = World.ext.portobelo;
  World.ext.portobelo = (...a) => { const out = base(...a); add(out); return out; };
})();
