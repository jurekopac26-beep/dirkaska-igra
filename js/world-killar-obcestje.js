/* ===================================================================================================================================
   WORLD — Killar, India: the roads by the track from OpenStreetMap (22. 11. 2026), laid over the world js/world-killar.js builds
   -----------------------------------------------------------------------------------------------------------------------------------
   How: js/world-killar.js (Killar only) hands keepOut its exclusions before it plants trees, rocks, tufts and spectators (nothing
   grows nor stands on the ways), and calls extra before it finishes the crowd (their meshes). js/tracks/killar.js is not changed.
   Drawn (OSM):
     w62102290 (primary, lanes=2, surface=asphalt): 7.0 m of asphalt (lanes=2 × 3.5 m, the national hill road standard's two-lane
     carriageway), nodes 49–175: 3.5 km down to the junction by the track's first point; beside the track's first 470 m (30–60 m from
     it, closer at the junction), then 80–300 m away across the slope, its hairpins too;
     w230880725 (the same tags): its first 83 m east of the junction, behind the start line;
     w272368520 (tertiary, no width nor surface tagged): 6 m by its class (as tools/proga-uvoz.mjs gives the side roads), gravel as the
     game's road, 320 m on past the end blocks (laid from the road's last 8 m, so it starts square at the road's end).
   Where a way meets the road it stops at the asphalt's edge; its free ends and the buildings fade it into the ground.
   No new def.sideRoads, stubs or gaps: driving, physics and def.hills are unchanged.
   Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«), 22. 11. 2026
   =================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, { GB, clamp } = API;

  // ---- the data: x east, z south, metres from the track's origin (the start line); flat x, z lists: [kind (WK), x, z, ...] ----
  const WAYS = [
    [0, -176.7, 301.1, -224.0, 284.2, -245.6, 270.3, -303.2, 247.2, -319.3, 234.3, -335.3, 201.8, -395.2, 165.5, -436.2, 139.1, -470.1, 105.7,
      -492.4, 49.8, -505.7, 33.8, -568.7, 13.0, -607.4, -12.8, -633.2, -27.4, -657.6, -52.3, -691.8, -90.5, -716.2, -126.6, -745.5, -165.4, -775.7,
      -184.5, -800.2, -207.9, -809.9, -237.9, -822.1, -265.3, -854.9, -288.2, -890.8, -325.1, -916.9, -338.9, -938.5, -356.2, -969.2, -372.2, -980.4,
      -384.0, -1016.2, -417.0, -1048.0, -444.1, -1067.3, -460.9, -1077.7, -483.0, -1086.9, -489.3, -1100.0, -494.7, -1116.6, -495.3, -1124.8, -505.1,
      -1132.3, -556.7, -1137.2, -588.6, -1142.1, -597.3, -1149.3, -610.8, -1152.8, -624.0, -1155.3, -649.0, -1152.8, -678.0, -1164.7, -700.0,
      -1172.1, -727.3, -1176.2, -747.5, -1181.3, -769.2, -1191.2, -787.7, -1206.8, -796.0, -1226.2, -802.3, -1243.8, -806.0, -1250.0, -807.6,
      -1253.7, -809.6, -1255.4, -815.5, -1251.0, -818.2, -1241.0, -816.7, -1231.6, -813.6, -1204.2, -807.6, -1188.7, -799.8, -1168.5, -779.7,
      -1145.1, -737.3, -1119.7, -674.7, -1115.9, -652.4, -1113.8, -633.0, -1108.4, -612.3, -1080.1, -554.7, -1055.5, -541.9, -1045.0, -532.5,
      -1031.3, -518.7, -1024.5, -499.8, -1015.6, -489.9, -1001.4, -482.9, -983.9, -470.1, -959.4, -466.5, -929.4, -455.6, -911.3, -449.7, -890.5,
      -434.7, -879.3, -422.2, -861.2, -410.4, -819.5, -400.1, -798.8, -391.0, -790.3, -382.8, -769.2, -370.5, -752.6, -354.4, -744.1, -345.2, -721.8,
      -332.0, -702.9, -314.7, -686.9, -294.6, -657.1, -256.7, -606.8, -211.3, -552.8, -187.3, -525.5, -171.7, -492.8, -149.1, -437.3, -120.3, -423.1,
      -109.1, -409.2, -83.5, -384.8, -66.4, -351.9, -43.8, -334.9, -30.5, -314.7, -7.4, -286.0, 8.5, -273.5, 21.4, -262.0, 39.3, -244.6, 50.5,
      -208.4, 52.2, -195.8, 46.6, -164.5, 45.3, -112.9, 48.2, -94.7, 43.8, -64.5, 46.5, -41.8, 44.7, -11.5, 46.5, 0.6, 41.1, 9.7, 31.8, 19.3, 28.8,
      57.8, 36.4, 107.3, 42.0, 129.7, 41.3, 139.5, 42.3, 146.4, 45.3, 156.1, 46.1, 160.6, 42.4, 158.3, 37.3, 149.4, 35.8, 133.5, 34.3, 130.9, 32.3,
      131.3, 29.6],   // w62102290, nodes 49–175
    [0, 131.3, 29.6, 145.9, 31.4, 159.1, 32.2, 179.0, 33.5, 191.4, 32.9, 212.5, 42.0],   // w230880725, nodes 0–5
    [1, -632.8, -2418.3, -640.7, -2416.8, -722.1, -2398.3, -949.5, -2463.4],   // w272368520 on past the road's end (from its last 8 m)
  ];
  // the ways' kinds: half width, the soft edge beyond it, colour (times the map), the map ('a' asphalt, 'm' the game road's gravel)
  const WK = [[3.5, 0.45, [0.8, 0.8, 0.81], 'a'], [3.0, 0.45, [0.86, 0.86, 0.877], 'm']];
  const FADE = 8, TILE = 400;
  const CO = World.killarObcestje = { keepOut, extra, stats: null };

  // ---- helpers (no rng: the world's own random sequence stays as it was) ----
  const hash = (i, j) => { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const patch = (x, z) => { const u = x / 9, v = z / 9, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv);
    const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1); return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv; };
  const tone = (c, x, z) => { const f = 0.95 + 0.08 * patch(x + 500, z); return [c[0] * f, c[1] * f, c[2] * f]; };
  const segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(px - ax - dx * t, pz - az - dz * t); };
  const sm = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const resample = (L, step) => {   // a flat x, z list -> points at most step m apart, its corners kept
    const out = [L[0], L[1]];
    for (let q = 0; q + 3 < L.length; q += 2) {
      const ax = L[q], az = L[q + 1], bx = L[q + 2], bz = L[q + 3], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
      for (let t = 1; t <= m; t++) out.push(ax + (bx - ax) * t / m, az + (bz - az) * t / m);
    }
    return out;
  };
  const frame = (Q) => {   // per point: the unit normal (to the way's right, as the road's), the tangent and the mitre (how much wider a corner must be)
    const n = Q.length / 2, F = [];
    const segN = (j) => { const dx = Q[2 * j + 2] - Q[2 * j], dz = Q[2 * j + 3] - Q[2 * j + 1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; };
    for (let k = 0; k < n; k++) {
      const a = k > 0 ? segN(k - 1) : null, b = k < n - 1 ? segN(k) : null, m = a && b ? [a[0] + b[0], a[1] + b[1]] : (a || b), l = Math.hypot(m[0], m[1]) || 1, nx = m[0] / l, nz = m[1] / l;
      F.push({ nx, nz, tx: nz, tz: -nx, mi: a && b ? 1 / Math.max(0.5, nx * a[0] + nz * a[1]) : 1 });
    }
    return F;
  };
  const along = (L, step, fn) => { const Q = resample(L, step); for (let k = 0; k < Q.length; k += 2) fn(Q[k], Q[k + 1]); };
  // on the game's road: within its asphalt (the half width and 5 cm), and not before its first nor past its last sample (vrNear's
  // samples reach a sample's spacing beyond them: the road's ends are cut square there, as the road mesh ends)
  const onRoad = (T, x, z) => {
    const nr = API.vrNear(x, z); if (nr.i < 0) return false;
    const i = nr.i, N1 = T.N - 1; if (nr.d >= (T.wAt ? T.wAt(i) : T.w) + 0.05) return false;
    if (i <= 1 && (x - T.px[0]) * T.tx[0] + (z - T.pz[0]) * T.tz[0] < 0) return false;
    return !(i >= N1 - 1 && (x - T.px[N1]) * T.tx[N1] + (z - T.pz[N1]) * T.tz[N1] > 0);
  };
  // the terrain as js/world-killar.js draws it: its tiles (G.on: the full ones near the track, 5 m cells; the ring beyond them every
  // other vertex, 10 m cells), the same two triangles per cell (u + v <= 1); on a full tile's edge against the ring every other vertex
  // halfway between its neighbours (unTileGeo: no cracks). gnd: the terrain's height at a grid vertex (unGround)
  const drawnGround = (gnd) => {
    const G = API.VR && API.VR.G, C = API.VRC || 5, NT = API.VRT || 20;
    if (!G || !G.on) return gnd;
    const full = (a, b) => a >= 0 && b >= 0 && a < G.ntx && b < G.ntz && G.on[b * G.ntx + a] === 1;
    const node = (i, j) => gnd(G.x0 + i * C, G.z0 + j * C);
    const tri = (u, v, a, b, c, d) => (u + v <= 1 ? a + u * (b - a) + v * (c - a) : d + (1 - u) * (c - d) + (1 - v) * (b - d));   // (a: the cell's corner (i, j), b: (i + 1, j), c: (i, j + 1), d: (i + 1, j + 1))
    return (x, z) => {
      const gx = (x - G.x0) / C, gz = (z - G.z0) / C, ti = Math.floor(gx / NT), tj = Math.floor(gz / NT);
      if (!full(ti, tj)) { const i = 2 * Math.floor(gx / 2), j = 2 * Math.floor(gz / 2); return tri((gx - i) / 2, (gz - j) / 2, node(i, j), node(i + 2, j), node(i, j + 2), node(i + 2, j + 2)); }
      const i = Math.floor(gx), j = Math.floor(gz), i0 = ti * NT, j0 = tj * NT;
      const h = (p, q) => {
        if (((q - j0) & 1) && ((p === i0 && !full(ti - 1, tj)) || (p === i0 + NT && !full(ti + 1, tj)))) return (node(p, q - 1) + node(p, q + 1)) / 2;
        if (((p - i0) & 1) && ((q === j0 && !full(ti, tj - 1)) || (q === j0 + NT && !full(ti, tj + 1)))) return (node(p - 1, q) + node(p + 1, q)) / 2;
        return node(p, q);
      };
      return tri(gx - i, gz - j, h(i, j), h(i + 1, j), h(i, j + 1), h(i + 1, j + 1));
    };
  };

  // ---- nothing grows nor stands on the ways: js/world-killar.js calls this with its exclusion circles before it plants anything ----
  function keepOut(push, T) {
    if (typeof push !== 'function' || !T) return;
    for (const W of WAYS) { const hw = WK[W[0]][0]; along(W.slice(1), 3, (x, z) => { if (!onRoad(T, x, z)) push(x, z, hw + 1.2); }); }
  }

  // ---- the meshes: js/world-killar.js calls this (ctx: its root, the track, the terrain's height, buildings, levelled plots) ----
  function extra(ctx, tex) {
    const st = CO.stats = { ways: 0, wayM: 0, meshes: 0, endStep: null };
    if (!ctx || !ctx.root || !ctx.T || typeof ctx.ground !== 'function') return;
    const pads = ctx.pads || [], blds = ctx.blds || [];
    const U = {
      T: ctx.T,
      inPad: (x, z, m) => { for (const p of pads) if (Math.hypot(x - p.x, z - p.z) < p.r + m) return true; return false; },
      inBld: (x, z, m) => { for (const b of blds) { const dx = x - b.x, dz = z - b.z, c = Math.cos(b.ang || 0), s = Math.sin(b.ang || 0);
        if (Math.abs(c * dx + s * dz) < b.L / 2 + m && Math.abs(-s * dx + c * dz) < b.W / 2 + m) return true; } return false; },
    };
    lay(ctx, tex || {}, st, U);
  }

  // the ways: rows across every 1.25 m (both soft edges, the half widths, the middle), on the drawn terrain; one mesh per 400 m square
  // for the opaque middle and one see-through for the soft edges and the fading stretches, per map
  function lay(ctx, tex, st, U) {
    const T = U.T, N1 = T.N - 1, gnd = drawnGround(ctx.ground), tiles = new Map();
    const grit = typeof API.vrGritTex === 'function' ? API.vrGritTex() : null;
    const hard = (x, z) => onRoad(T, x, z) || U.inPad(x, z, 0.3);   // the cuts the ways run up to without fading: the road, a levelled plot
    const gbAt = (x, z, kind, fade) => { const key = kind + (fade ? 'f' : 'o') + Math.floor(x / TILE) + ',' + Math.floor(z / TILE);
      let t = tiles.get(key); if (!t) tiles.set(key, t = { g: new GB(true, fade), kind, fade }); return t.g; };
    const joined = (W, x, z) => { for (const V of WAYS) if (V !== W) for (let q = 1; q + 3 < V.length; q += 2) if (segD(x, z, V[q], V[q + 1], V[q + 2], V[q + 3]) < 1.5) return true; return false; };
    WAYS.forEach((W, wi) => {
      const L = W.slice(1), [hw, e, col, kind] = WK[W[0]], Q = resample(L, 1.25), n = Q.length / 2, F = frame(Q);
      const up = 0.07 + 0.015 * wi;   // (over the drawn terrain; a little more per way, where two meet)
      // the gravel's map runs on from the road's (its u across from the road's left edge, v along: the road's metres at its end)
      const vOff = kind === 'm' ? N1 * T.ds - Math.hypot(T.px[N1] - L[0], T.pz[N1] - L[1]) : 0, uOff = kind === 'm' ? (T.w || 4.5) : 4;
      const OF = [-hw - e, -hw, 0, hw, hw + e], AX = [0, 1, 1, 1, 0];
      const s = [0], H = [], Sf = [], fd = new Float64Array(n);
      for (let k = 1; k < n; k++) s.push(s[k - 1] + Math.hypot(Q[2 * k] - Q[2 * k - 2], Q[2 * k + 1] - Q[2 * k - 1]));
      for (let k = 0; k < n; k++) { const x = Q[2 * k], z = Q[2 * k + 1]; H.push(hard(x, z)); Sf.push(!H[k] && U.inBld(x, z, 0.3)); }
      // how far to the nearest soft cut (a free end, a building): one pass forwards, one back; a hard cut resets it
      let c = !H[0] && !joined(W, Q[0], Q[1]) ? 0 : -1e9;
      for (let k = 0; k < n; k++) { if (H[k]) c = -1e9; else if (Sf[k]) c = s[k]; fd[k] = s[k] - c; }
      c = !H[n - 1] && !joined(W, Q[2 * n - 2], Q[2 * n - 1]) ? s[n - 1] : 1e9;
      for (let k = n - 1; k >= 0; k--) { if (H[k]) c = 1e9; else if (Sf[k]) c = s[k]; fd[k] = Math.min(fd[k], c - s[k]); }
      const rows = new Array(n).fill(null);
      for (let k = 0; k < n; k++) {
        if (H[k] || Sf[k]) continue;
        const f = F[k], x = Q[2 * k], z = Q[2 * k + 1], aL = sm(fd[k] / FADE);
        // near a hard cut each vertex slides along the way to its edge, so the end follows the road's edge
        let dir = 0, pull = false;
        for (let j = 1; j <= 6 && !dir; j++) { if (k - j >= 0 && H[k - j]) { dir = 1; pull = j === 1; } else if (k + j < n && H[k + j]) { dir = -1; pull = j === 1; } }
        const c3 = tone(col, x, z), p = [], cl = [], uv = [];
        for (let q = 0; q < OF.length; q++) {
          const o = OF[q] * f.mi; let vx = x + f.nx * o, vz = z + f.nz * o;
          if (dir) {
            const ux = f.tx * dir * 0.1, uz = f.tz * dir * 0.1;
            if (hard(vx, vz)) { for (let m = 0; m < 60 && hard(vx, vz); m++) { vx += ux; vz += uz; } }
            else if (pull) { for (let m = 0; m < 15 && !hard(vx - ux, vz - uz); m++) { vx -= ux; vz -= uz; } }
          }
          p.push([vx, gnd(vx, vz) + up, vz]); cl.push([c3[0], c3[1], c3[2], AX[q] * aL]); uv.push([(OF[q] + uOff) / 8, (s[k] + vOff) / 8]);
        }
        if (kind === 'm' && st.endStep === null) st.endStep = +(p[2][1] - up - T.hy[N1]).toFixed(2);   // (the first row past the road's end: the terrain under it against the road's end)
        rows[k] = { p, cl, uv, aL, x, z };
      }
      let drawn = false;
      for (let k = 1; k < n; k++) {
        const r0 = rows[k - 1], r1 = rows[k]; if (!r0 || !r1) continue;
        const xm = (r0.x + r1.x) / 2, zm = (r0.z + r1.z) / 2, full = r0.aL > 0.999 && r1.aL > 0.999;
        for (let q = 0; q + 1 < OF.length; q++) {
          const g = gbAt(xm, zm, kind, !(full && AX[q] === 1 && AX[q + 1] === 1));
          g.quadUp(r0.p[q], r1.p[q], r1.p[q + 1], r0.p[q + 1], [r0.cl[q], r1.cl[q], r1.cl[q + 1], r0.cl[q + 1]], [r0.uv[q], r1.uv[q], r1.uv[q + 1], r0.uv[q + 1]]);
        }
        st.wayM += Math.hypot(r1.x - r0.x, r1.z - r0.z); drawn = true;
      }
      if (drawn) st.ways++;
    });
    st.wayM = Math.round(st.wayM);
    const mats = {};
    const mat = (kind, fade) => {
      const key = kind + (fade ? 'f' : 'o'); if (mats[key]) return mats[key];
      const P = Object.assign({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 }, fade ? { transparent: true, depthWrite: false } : {});
      return (mats[key] = kind === 'm'
        ? new THREE.MeshPhongMaterial(Object.assign({ map: tex.makadam || grit, bumpMap: tex.makadamBump || null, bumpScale: 0.05, shininess: 4, specular: 0x14110d }, P))   // (as the road: rMat)
        : new THREE.MeshLambertMaterial(Object.assign({ map: tex.asphalt || grit }, P)));
    };
    for (const t of tiles.values()) {
      if (t.g.empty) continue;
      const m = new THREE.Mesh(t.g.geometry(), mat(t.kind, t.fade));
      m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'roadside-ways'; if (t.fade) m.renderOrder = 1;
      ctx.root.add(m); st.meshes++;
    }
  }
})();
