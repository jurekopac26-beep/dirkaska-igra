/* ===================================================================================================================================
   WORLD — Cusco, Peru: the roadside by the fortress from OpenStreetMap (22. 11. 2026), laid over the gore world js/world-cusco.js builds
   -----------------------------------------------------------------------------------------------------------------------------------
   How: World.ext.cusco is wrapped; while it runs, World.gore.build gets this file's keepOut (no trees on the ways, the hedges and the
   ruins) and extra (their meshes) after its own. js/world-cusco.js is not changed.
   Drawn (OSM):
     the hedges w1039912185, w1039912186, w1039912187, w1039906924, w1039906925 (barrier=hedge), only where they stand past the barrier
     line: OSM has most of the first three 5-12 m from the road's middle, on the verge the game lets one drive on out to its barrier
     line (about 15 m here), and with no collisions (the driving does not change) a car would go through them, so there they are left
     out (all of w1039912185); drawn are w1039912186 from about the finish on, w1039912187 past the road's end and the last two, left of
     the road past the finish, 17-63 m out;
     the side road w29093554 (highway=unclassified, lanes=1, surface=paved, smoothness=bad: patched asphalt), the concrete paths
     w709383930, w709383931, w709383932, the compacted footway w1032037824, the earth footways w68247887 and w1492010506, the service
     way w172247912 (surface=ground);
     the fortress wall's ruins w480271264, w480271265 (barrier=wall, ruins=yes): low courses of stone with gaps.
   Assumed (not in OSM): the hedges a) clipped, 1.3 m high and 1 m wide, or b) grown free, 2.2 m and 1.5 m (World.cuscoObcestje.hedge);
     the ruins up to 1.2 m; the widths: side road 3.4 m, concrete paths 1.6 m, footways 1-1.2 m, service way 3 m.
   Where a way meets the road it stops at the asphalt's edge (and at the car park's), laid over the verge on a low fill of earth (the
   ditch under it); its other ends and where it is not drawn further fade into the ground.
   Not drawn: the locked gate w1120930471 and the gate n6668272936 on the concrete path (both on the game's verge, as the hedges there),
   the track w83070427, the speed bump, the ticket booth, the toilets, the bins, the board, the parking by the street (w709383928).
   No def.sideRoads, stubs or gaps: driving, physics and def.hills are unchanged.
   Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«), 22. 11. 2026
   =================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.gore || !World.ext || typeof World.ext.cusco !== 'function') return;
  const API = World.api, { GB, box, clamp, vrGround, vrNear } = API;

  // ---- the data: x east, z south, metres from the track's origin; flat x, z lists ----
  const HEDGES = [
    [-223.5, -295.2, -209.2, -300.3, -199.1, -312.4],   // w1039912185
    [-196.6, -317.1, -181.5, -344.1, -173.4, -374.8, -165.1, -419.7, -162.2, -453.0, -163.6, -484.1, -172.2, -516.8, -182.1, -538.5, -191.8, -559.5,
      -143.9, -564.5, -70.3, -577.5, -44.2, -578.2],   // w1039912186
    [-10.8, -583.0, -34.6, -587.2, -62.0, -589.0, -86.6, -585.7, -108.3, -582.2, -134.2, -578.8, -148.6, -585.0, -157.3, -592.8],   // w1039912187
    [-193.6, -620.9, -216.9, -607.1, -218.5, -608.3, -250.8, -632.5, -264.5, -640.9],   // w1039906924
    [-218.5, -608.3, -222.1, -649.5, -246.5, -662.5] ];   // w1039906925
  const WAYS = [   // [kind, x, z, ...], each from its end at the road or at another way
    [0, -346.9, -375.0, -352.0, -408.8, -348.6, -439.4, -331.5, -463.3, -309.2, -516.5, -311.2, -528.0, -320.0, -539.6, -330.7, -550.2],   // w29093554
    [1, -271.1, -316.0, -273.0, -314.0, -273.7, -313.2, -274.9, -311.9, -285.1, -299.9],   // w709383930 (from the road)
    [1, -285.1, -299.9, -288.3, -303.0, -291.9, -309.3, -293.0, -314.6, -295.7, -321.3, -300.7, -329.1, -306.5, -336.4, -313.9, -343.8, -316.5, -347.9, -317.5, -354.8],   // w709383931 (to the car park)
    [1, -285.1, -299.9, -287.0, -297.7, -282.3, -293.1, -270.4, -283.5],   // w709383932
    [2, -274.9, -311.9, -261.3, -301.0, -241.3, -292.4, -213.3, -286.8, -201.8, -284.8, -187.0, -283.4, -176.7, -282.5, -171.8, -281.5, -168.4, -279.2, -166.4, -275.9,
      -166.1, -273.0, -167.8, -268.7],   // w1032037824
    [3, -311.3, -264.3, -323.0, -276.4, -336.7, -288.7, -363.4, -334.8, -387.8, -377.5, -408.7, -413.3, -450.6, -438.7],   // w68247887
    [3, -174.1, -607.0, -175.8, -635.1, -176.1, -686.1],   // w1492010506 (from the road)
    [4, -192.3, -604.6, -197.8, -607.5, -205.5, -602.6, -212.0, -583.6, -216.1, -573.4, -227.6, -528.8, -225.5, -523.4, -216.3, -515.6, -206.6, -502.0, -205.0, -494.6,
      -207.2, -488.3, -226.1, -467.2, -235.9, -441.9, -242.9, -419.9] ];   // w172247912 (from the road)
  const RUINS = [[-150.7, -539.2, -143.3, -539.3, -143.1, -517.5, -137.5, -517.6], [-136.2, -565.5, -136.6, -545.6, -128.9, -545.4]];   // w480271264, w480271265
  // the ways' kinds: half width, the soft edge beyond it, colour (times the map), on the asphalt map, metres drawn from the way's start
  const WK = [[1.7, 0.45, [0.74, 0.73, 0.7], 1, 150], [0.8, 0.15, [0.56, 0.555, 0.52], 0, 200], [0.6, 0.3, [0.5, 0.44, 0.34], 0, 200],
    [0.5, 0.35, [0.5, 0.42, 0.3], 0, 130], [1.5, 0.5, [0.53, 0.44, 0.32], 0, 130]];
  // the hedges: their cross-section (across -1..1, up 0..1), height, width, how much the size wanders
  const HP = {
    a: { P: [[-0.92, 0], [-1, 0.25], [-1, 0.85], [-0.85, 1], [0.85, 1], [1, 0.85], [1, 0.25], [0.92, 0]], H: 1.3, W: 1.0, j: 0.05 },
    b: { P: [[-0.8, 0], [-1, 0.3], [-0.95, 0.7], [-0.6, 0.95], [0, 1], [0.6, 0.95], [0.95, 0.7], [1, 0.3], [0.8, 0]], H: 2.2, W: 1.5, j: 0.2 } };
  const HB = [0.17, 0.24, 0.12], HT = [0.3, 0.42, 0.2], FILL_T = [0.43, 0.39, 0.3], FILL_B = [0.4, 0.42, 0.28], FADE = 8;
  const CO = World.cuscoObcestje = { hedge: 'a', keepOut, extra, stats: null };
  const hk = () => HP[CO.hedge === 'b' ? 'b' : 'a'];

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
  const frame = (Q) => {   // per point: the unit normal (to the way's right), the tangent and the mitre (how much wider a corner must be)
    const n = Q.length / 2, F = [];
    const segN = (j) => { const dx = Q[2 * j + 2] - Q[2 * j], dz = Q[2 * j + 3] - Q[2 * j + 1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; };
    for (let k = 0; k < n; k++) {
      const a = k > 0 ? segN(k - 1) : null, b = k < n - 1 ? segN(k) : null, m = a && b ? [a[0] + b[0], a[1] + b[1]] : (a || b), l = Math.hypot(m[0], m[1]) || 1, nx = m[0] / l, nz = m[1] / l;
      F.push({ nx, nz, tx: nz, tz: -nx, mi: a && b ? 1 / Math.max(0.5, nx * a[0] + nz * a[1]) : 1 });
    }
    return F;
  };
  const along = (L, step, maxS, fn) => { const Q = resample(L, step); let s = 0; for (let k = 0; k < Q.length; k += 2) { if (k) s += Math.hypot(Q[k] - Q[k - 2], Q[k + 1] - Q[k - 1]); if (s > maxS) break; fn(Q[k], Q[k + 1]); } };
  // the verge's height at offset o from sample i on a side: js/world-gore.js vProf without snow or side-road mouths (Cusco has neither)
  const vergeY = (T, i, side, o) => {
    const bar = side > 0 ? T.br[i] : T.bl[i], e = T.wAt ? T.wAt(i) : T.w, y = T.hy[i];
    const gAt = (q) => vrGround(T.px[i] + T.nx[i] * side * q, T.pz[i] + T.nz[i] * side * q) - y, lift = (q, h) => [q, Math.max(h, gAt(q) + 0.05)];
    const Q = [[e + 0.6, -0.02], lift(Math.max(e + 1.2, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]];
    let k = 0; while (k < Q.length - 2 && Q[k + 1][0] < o) k++;
    const a = Q[k], b = Q[k + 1]; return y + a[1] + (b[1] - a[1]) * clamp((o - a[0]) / Math.max(1e-3, b[0] - a[0]), 0, 1);
  };

  // a hedge stands only past the barrier line (the verge inside it is driven on): far enough out for its near side to clear it
  const hedgeOut = (x, z, K) => { const nr = vrNear(x, z); return nr.i < 0 || nr.dd >= K.W / 2 + 0.4; };

  // ---- no trees (nor rocks) on what is drawn here: gore.build calls this before it plants them (after vrPrep) ----
  function keepOut(push) {
    const K = hk();
    for (const L of HEDGES) along(L, 3, 1e9, (x, z) => { if (hedgeOut(x, z, K)) push(x, z, K.W / 2 + 1.5); });
    for (const W of WAYS) { const [hw, , , , maxL] = WK[W[0]]; along(W.slice(1), 3, maxL + 4, (x, z) => push(x, z, hw + 1.2)); }
    for (const L of RUINS) along(L, 2, 1e9, (x, z) => push(x, z, 1.8));
  }

  // ---- the meshes: gore.build calls this (ctx: its scenery chunks, root, car parks, buildings, crowd) after its own extra ----
  function extra(ctx, tex) {
    const st = CO.stats = { hedge: CO.hedge === 'b' ? 'b' : 'a', hedgeRings: 0, hedgeDropped: 0, hedgeM: 0, ways: 0, wayM: 0, fills: 0, meshes: 0, stones: 0 };
    if (!ctx || !ctx.scen || !ctx.root) return;
    const T = API.T, pads = (ctx.P && ctx.P.pads) || [], blds = ctx.blds || [], CR = ctx.CR && typeof ctx.CR.avoid === 'function' ? ctx.CR : null;
    const U = {
      T, CR,
      inPad: (x, z, m) => { for (const p of pads) if (Math.hypot(x - p.x, z - p.z) < p.r + m) return true; return false; },
      inBld: (x, z, m) => { for (const b of blds) { const dx = x - b.x, dz = z - b.z, c = Math.cos(b.ang || 0), s = Math.sin(b.ang || 0);
        if (Math.abs(c * dx + s * dz) < b.L / 2 + m && Math.abs(-s * dx + c * dz) < b.W / 2 + m) return true; } return false; },
      dd: (x, z) => { const nr = vrNear(x, z); return nr.i < 0 ? 1e9 : nr.dd; },
      // over the verge (out to 1.9 m past the barrier line): the verge's own height there, else NaN
      verge: (x, z) => { const nr = vrNear(x, z); if (nr.i < 0) return NaN; const i = nr.i, side = nr.lat > 0 ? 1 : -1, o = Math.abs(nr.lat), dh = nr.hn - T.hy[i];
        return o >= (side > 0 ? T.br[i] : T.bl[i]) + 1.9 ? NaN : vergeY(T, i, side, o) + dh; },
    };
    U.base = (x, z) => { const g = vrGround(x, z) - 0.15, v = U.verge(x, z); return isNaN(v) ? g : Math.min(g, v - 0.1); };   // where a hedge's or a stone's foot goes
    lay(ctx, tex, st, U);
    hedges(ctx, st, U);
    ruins(ctx, st, U);
  }

  // the ways: rows across every 1.25 m (both soft edges, the half widths, the middle of the wide ones), on the ground; one mesh per 200 m
  // square for the opaque middle and one see-through for the soft edges and the fading stretches, per map
  function lay(ctx, tex, st, U) {
    const T = U.T, R0 = (T.w || 3.8) + 0.05, TILE = 200, tiles = new Map();
    const grit = typeof API.vrGritTex === 'function' ? API.vrGritTex() : null, asphT = (tex && tex.asphalt) || grit;
    const onRoad = (x, z) => { const nr = vrNear(x, z); return nr.i >= 0 && nr.d < R0; };
    const hard = (x, z) => onRoad(x, z) || U.inPad(x, z, 0.3);   // the cuts the ways run up to without fading: the asphalt, the car park
    const gbAt = (x, z, asph, fade) => { const key = (asph ? 'a' : 'g') + (fade ? 'f' : 'o') + Math.floor(x / TILE) + ',' + Math.floor(z / TILE);
      let t = tiles.get(key); if (!t) tiles.set(key, t = { g: new GB(true, fade), asph, fade }); return t.g; };
    const joined = (W, x, z) => { for (const V of WAYS) if (V !== W) for (let q = 1; q + 3 < V.length; q += 2) if (segD(x, z, V[q], V[q + 1], V[q + 2], V[q + 3]) < 1.5) return true; return false; };
    // the way's height at (x, z): on the ground, or over the verge a straight fill from the road's edge out to the ground past the ditch;
    // [height, the verge's height under it (NaN off the verge)]
    const ground = (x, z) => {
      const nr = vrNear(x, z), gy = vrGround(x, z);
      if (nr.i < 0) return [gy + 0.07, NaN];
      const i = nr.i, side = nr.lat > 0 ? 1 : -1, o = Math.abs(nr.lat), o1 = (side > 0 ? T.br[i] : T.bl[i]) + 1.9, hn = nr.hn, dh = hn - T.hy[i];
      if (o >= o1) return [gy + 0.07, NaN];
      const o0 = (T.wAt ? T.wAt(i) : T.w) + 0.6, yOut = vergeY(T, i, side, o1) + dh, yEdge = hn - 0.02, vb = vergeY(T, i, side, o) + dh;
      return [Math.max(yEdge + (yOut - yEdge) * clamp((o - o0) / Math.max(0.5, o1 - o0), 0, 1), vb) + 0.05, vb];
    };
    // a free end (not on another way) short of the asphalt but within 8 m of the road's middle (OSM's node is off the road's line):
    // carried on to the middle, so it is cut at the asphalt's edge like the others and does not fade out on the verge
    const toRoad = (W, x, z) => { if (joined(W, x, z)) return null; const nr = vrNear(x, z); return nr.i >= 0 && nr.d >= R0 && nr.d < 8 ? [x - T.nx[nr.i] * nr.lat, z - T.nz[nr.i] * nr.lat] : null; };
    for (const W of WAYS) {
      let L = W.slice(1); const a = toRoad(W, L[0], L[1]), b = toRoad(W, L[L.length - 2], L[L.length - 1]); if (a) L = a.concat(L); if (b) L = L.concat(b);
      const [hw, e, col, asph, maxL] = WK[W[0]], Q = resample(L, 1.25), n = Q.length / 2, F = frame(Q);
      const OF = hw > 1 ? [-hw - e, -hw, 0, hw, hw + e] : [-hw - e, -hw, hw, hw + e], AX = hw > 1 ? [0, 1, 1, 1, 0] : [0, 1, 1, 0];
      const s = [0], H = [], Sf = [], fd = new Float64Array(n);
      for (let k = 1; k < n; k++) s.push(s[k - 1] + Math.hypot(Q[2 * k] - Q[2 * k - 2], Q[2 * k + 1] - Q[2 * k - 1]));
      for (let k = 0; k < n; k++) { const x = Q[2 * k], z = Q[2 * k + 1]; H.push(hard(x, z)); Sf.push(!H[k] && (s[k] > maxL || U.inBld(x, z, 0.3))); }
      // how far to the nearest soft cut (a free end, a building, the end of what is drawn): one pass forwards, one back; a hard cut resets it
      let c = !H[0] && !joined(W, Q[0], Q[1]) ? 0 : -1e9;
      for (let k = 0; k < n; k++) { if (H[k]) c = -1e9; else if (Sf[k]) c = s[k]; fd[k] = s[k] - c; }
      c = !H[n - 1] && !joined(W, Q[2 * n - 2], Q[2 * n - 1]) ? s[n - 1] : 1e9;
      for (let k = n - 1; k >= 0; k--) { if (H[k]) c = 1e9; else if (Sf[k]) c = s[k]; fd[k] = Math.min(fd[k], c - s[k]); }
      const rows = new Array(n).fill(null);
      for (let k = 0; k < n; k++) {
        if (H[k] || Sf[k]) continue;
        const f = F[k], x = Q[2 * k], z = Q[2 * k + 1], aL = sm(fd[k] / FADE);
        // near a hard cut each vertex slides along the way to its edge, so the end follows the asphalt's (or the car park's) edge
        let dir = 0, pull = false;
        for (let j = 1; j <= 6 && !dir; j++) { if (k - j >= 0 && H[k - j]) { dir = 1; pull = j === 1; } else if (k + j < n && H[k + j]) { dir = -1; pull = j === 1; } }
        let c3 = tone(col, x, z);
        if (W[0] === 0) { const pf = patch(x * 2.3 + 71, z * 2.3) > 0.7 ? 0.84 : 1; c3 = [c3[0] * pf, c3[1] * pf, c3[2] * pf]; }   // the patches on the worn asphalt
        const p = [], cl = [], uv = [], vb = [];
        for (let q = 0; q < OF.length; q++) {
          const o = OF[q] * f.mi; let vx = x + f.nx * o, vz = z + f.nz * o;
          if (dir) {
            const ux = f.tx * dir * 0.1, uz = f.tz * dir * 0.1;
            if (hard(vx, vz)) { for (let m = 0; m < 60 && hard(vx, vz); m++) { vx += ux; vz += uz; } }
            else if (pull) { for (let m = 0; m < 15 && !hard(vx - ux, vz - uz); m++) { vx -= ux; vz -= uz; } }
          }
          const gr = ground(vx, vz);
          p.push([vx, gr[0], vz]); vb.push(gr[1]); cl.push([c3[0], c3[1], c3[2], AX[q] * aL]); uv.push([OF[q] / 3, s[k] / 3]);
        }
        rows[k] = { p, cl, uv, vb, aL, x, z };
        if (U.CR && k % 2 === 0 && U.dd(x, z) < 60) U.CR.avoid(x, z, hw + 0.4);
      }
      let drawn = false;
      for (let k = 1; k < n; k++) {
        const r0 = rows[k - 1], r1 = rows[k]; if (!r0 || !r1) continue;
        const xm = (r0.x + r1.x) / 2, zm = (r0.z + r1.z) / 2, full = r0.aL > 0.999 && r1.aL > 0.999;
        for (let q = 0; q + 1 < OF.length; q++) {
          const g = gbAt(xm, zm, asph, !(full && AX[q] === 1 && AX[q + 1] === 1));
          g.quadUp(r0.p[q], r1.p[q], r1.p[q + 1], r0.p[q + 1], [r0.cl[q], r1.cl[q], r1.cl[q + 1], r0.cl[q + 1]], [r0.uv[q], r1.uv[q], r1.uv[q + 1], r0.uv[q + 1]]);
        }
        // over the verge: the fill's sides, down into the verge (the ditch under the way)
        for (const q of [0, OF.length - 1]) {
          const a = r0.p[q], b = r1.p[q], ya = isNaN(r0.vb[q]) ? vrGround(a[0], a[2]) : r0.vb[q], yb = isNaN(r1.vb[q]) ? vrGround(b[0], b[2]) : r1.vb[q];
          if (isNaN(r0.vb[q]) && isNaN(r1.vb[q])) continue;
          if (a[1] - ya < 0.08 && b[1] - yb < 0.08) continue;
          ctx.scen.get(xm, zm).quadO(a, b, [b[0], yb - 0.06, b[2]], [a[0], ya - 0.06, a[2]], FILL_T, [xm, (a[1] + b[1]) / 2 - 0.3, zm], null, [FILL_T, FILL_T, FILL_B, FILL_B]);
          st.fills++;
        }
        st.wayM += Math.hypot(r1.x - r0.x, r1.z - r0.z); drawn = true;
      }
      if (drawn) st.ways++;
    }
    const mats = {};
    const mat = (asph, fade) => { const key = (asph ? 'a' : 'g') + (fade ? 'f' : 'o');
      return mats[key] || (mats[key] = new THREE.MeshLambertMaterial(Object.assign({ map: asph ? asphT : grit, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 },
        fade ? { transparent: true, depthWrite: false } : {}))); };
    for (const t of tiles.values()) {
      if (t.g.empty) continue;
      const m = new THREE.Mesh(t.g.geometry(), mat(t.asph, t.fade));
      m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'roadside-ways'; if (t.fade) m.renderOrder = 1;
      ctx.root.add(m); st.meshes++;
    }
  }

  // the hedges: a tube of the cross-section every 1.5 m (wider at the corners), its foot in the ground (in the ditch over the verge);
  // left out where it would stand inside the barrier line, in a building or on a car park, closed with a lid where it stops
  function hedges(ctx, st, U) {
    const K = hk(), PR = K.P, np = PR.length;
    for (let h = 0; h < HEDGES.length; h++) {
      const Q = resample(HEDGES[h], 1.5), n = Q.length / 2, F = frame(Q), R = [];
      for (let k = 0; k < n; k++) {
        const x = Q[2 * k], z = Q[2 * k + 1], dd = U.dd(x, z);
        if (!hedgeOut(x, z, K) || U.inBld(x, z, K.W / 2 + 0.2) || U.inPad(x, z, K.W / 2 + 0.2)) { R.push(null); st.hedgeDropped++; continue; }
        const f = F[k], gc = vrGround(x, z), Hk = K.H * (1 + K.j * (patch(x * 0.9 + 40, z * 0.9) - 0.5) * 2), Wk = K.W / 2 * (1 + K.j * (patch(x * 0.7, z * 0.7 + 90) - 0.5) * 2) * f.mi;
        const ring = [], cols = [], tn = 0.9 + 0.2 * patch(x * 0.5 + 200, z * 0.5);
        for (let j = 0; j < np; j++) {
          const px = PR[j][0], py = PR[j][1], jj = 1 + K.j * 0.6 * (hash(h * 7919 + k, j) - 0.5), o = px * Wk * jj, vx = x + f.nx * o, vz = z + f.nz * o;
          ring.push([vx, (1 - py) * U.base(vx, vz) + py * (gc + Hk * jj), vz]);
          const v = tn * (0.96 + 0.08 * hash(h * 104729 + k, j + 31));
          cols.push([(HB[0] + (HT[0] - HB[0]) * py) * v, (HB[1] + (HT[1] - HB[1]) * py) * v, (HB[2] + (HT[2] - HB[2]) * py) * v]);
        }
        R.push({ x, z, gc, Hk, ring, cols }); st.hedgeRings++;
        if (U.CR && k % 2 === 0 && dd < 60) U.CR.avoid(x, z, K.W / 2 + 0.6);
      }
      for (let k = 1; k < n; k++) {
        const A = R[k - 1], B = R[k]; if (!A || !B) continue;
        const g = ctx.scen.get((A.x + B.x) / 2, (A.z + B.z) / 2), inside = [(A.x + B.x) / 2, (A.gc + B.gc) / 2 + 0.45 * (A.Hk + B.Hk) / 2, (A.z + B.z) / 2];
        for (let j = 0; j + 1 < np; j++) g.quadO(A.ring[j], B.ring[j], B.ring[j + 1], A.ring[j + 1], A.cols[j], inside, null, [A.cols[j], B.cols[j], B.cols[j + 1], A.cols[j + 1]]);
        st.hedgeM += Math.hypot(B.x - A.x, B.z - A.z);
      }
      for (let k = 0; k < n; k++) {   // the lids
        const A = R[k]; if (!A) continue;
        const pv = k > 0 && R[k - 1], nx = k < n - 1 && R[k + 1]; if (!pv === !nx) continue;
        const nb = pv || nx, dx = nb.x - A.x, dz = nb.z - A.z, l = Math.hypot(dx, dz) || 1, g = ctx.scen.get(A.x, A.z);
        const inside = [A.x + dx / l * 0.5, A.gc + A.Hk * 0.45, A.z + dz / l * 0.5], ctr = [A.x, A.gc + A.Hk * 0.4, A.z], cc = A.cols[np >> 1];
        for (let j = 0; j < np; j++) { const j1 = (j + 1) % np; g.triO(ctr, A.ring[j], A.ring[j1], cc, inside, A.cols[j], A.cols[j1]); }
      }
    }
  }

  // the ruins: the fortress wall's stones in courses (0.9 m through, 0.5-1 m long, 0.3-0.5 m high), as many courses as a slow noise along
  // the wall says (none: a gap), up to 1.2 m; the stones' colours as the walls' in js/world-cusco.js (from a hash, not the world's rng)
  function ruins(ctx, st, U) {
    for (let r = 0; r < RUINS.length; r++) {
      const L = RUINS[r];
      for (let q = 0; q + 3 < L.length; q += 2) {
        const ax = L[q], az = L[q + 1], bx = L[q + 2], bz = L[q + 3], len = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len, rot = Math.atan2(uz, ux);
        for (let t = 0, k = 0; t < len - 0.25; k++) {
          const id = r * 1000 + q * 50 + k, sl = Math.min(len - t, 0.5 + 0.5 * hash(id, 1)), cx = ax + ux * (t + sl / 2), cz = az + uz * (t + sl / 2);
          t += sl;
          if (U.dd(cx, cz) < 0.8) continue;
          const nc = Math.floor(0.3 + 3 * patch(cx * 0.8 + 300, cz * 0.8));
          let y = Infinity;
          for (const a of [-0.5, 0.5]) for (const b of [-0.45, 0.45]) y = Math.min(y, U.base(cx + ux * a * sl - uz * b, cz + uz * a * sl + ux * b) + 0.07);
          const y0 = y, g = ctx.scen.get(cx, cz);
          for (let c = 0; c < nc; c++) {
            const sh = 0.3 + 0.2 * hash(id, c + 7); if (y + sh - y0 > 1.2 + 0.15) break;
            const tt = 0.56 + hash(id, c + 13) * 0.16, w = (hash(id, c + 17) - 0.5) * 0.05, qq = hash(id, c + 19) < 0.12 ? -0.08 : 0;
            const col = [tt + 0.03 + w + qq, tt + 0.01 + qq, tt - 0.04 - w * 0.5 + qq], top = [col[0] * 1.06, col[1] * 1.06, col[2] * 1.06];
            const off = (hash(id, c + 23) - 0.5) * 0.08, dep = 0.9 - c * 0.08 - 0.06 * hash(id, c + 29);
            box(g, cx - uz * off, y, cz + ux * off, sl - 0.04 - 0.05 * hash(id, c + 31), sh, dep, rot + (hash(id, c + 37) - 0.5) * 0.06, col, top, c > 0);
            y += sh; st.stones++;
          }
        }
      }
    }
  }

  // ---- the hook: World.ext.cusco runs as before, with gore.build handed this file's keepOut and extra after its own ----
  const ext = World.ext, baseExt = ext.cusco;
  ext.cusco = function (scene, tex, opts) {
    const gore = World.gore, build = gore.build;
    gore.build = function (sc, tx, op, S) {
      gore.build = build;
      const S2 = Object.assign({}, S, {
        keepOut: (push) => { if (typeof S.keepOut === 'function') S.keepOut(push); keepOut(push); },
        extra: (ctx) => { const r = typeof S.extra === 'function' ? S.extra(ctx) : undefined; extra(ctx, tx); return r; },
      });
      return build.call(this, sc, tx, op, S2);
    };
    try { return baseExt.apply(this, arguments); } finally { gore.build = build; }
  };
})();
