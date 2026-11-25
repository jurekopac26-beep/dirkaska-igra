/* ===================================================================================================================================
   WORLD — Isuna, Bhutan: the roadside by the chain bridge from OpenStreetMap (22. 11. 2026), laid over the gore world js/world-isuna.js
   builds
   -----------------------------------------------------------------------------------------------------------------------------------
   How: World.ext.isuna is wrapped; while it runs, World.gore.build gets this file's keepOut (no trees on the ways and the wall) and extra
   (their meshes) after its own. js/world-isuna.js and js/tracks/isuna.js (its def.sideRoads too) are not changed.
   Drawn (OSM):
     the two service roads the game has as side roads (def.sideRoads 0 and 1: drivable 60 m, drawn to about 99 m and fading there) on
     past where they fade: w1173883697 up the slope in its switchbacks (about 260 m more, out to some 120 m from the road) and
     w452848829 on into the car park (w1476784171, the game's pull there); their width as the side roads' own, by OSM's class (service,
     no width nor lanes tagged: 4.8 m, as tools/proga-uvoz.mjs gives them), asphalt as theirs; laid on their drawn ends first, so the
     asphalt runs on where they fade into the ground;
     the paths w452848826 (from the car park to the footbridge) and w452848828 (on the far bank, from the footbridge up, the first 115 m):
     highway=path with no width nor surface tagged: 1.2 m of earth (the class);
     the wall w1476784170 (barrier=wall, no height nor material tagged) along the car park's river side: a stone wall 1 m high and
     0.45 m through (assumed), a) drawn where it stands off the game's car park (the round plot covers OSM's corner of it), b) not drawn
     (World.isunaObcestje.wall).
   Where a way meets the car park it stops at its edge; its other ends and where it is not drawn further fade into the ground.
   Not drawn: the footbridge w452848827 (bridge=yes, layer=1, about 10 m from the chain bridge js/world-isuna.js draws), the paths past
   the finish (w1117014045, the secondary road w1117014046 and the parking w1117014041 are beyond the road's end).
   No new def.sideRoads, stubs or gaps: driving, physics and def.hills are unchanged.
   Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«), 22. 11. 2026
   =================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.gore || !World.ext || typeof World.ext.isuna !== 'function') return;
  const API = World.api, { GB, clamp, vrGround, vrNear } = API;

  // ---- the data: x east, z south, metres from the track's origin (the start line); flat x, z lists ----
  // [kind, the side road it carries on (its index in def.sideRoads, its own line from T0 m on) or -1, x, z, ...]
  const WAYS = [
    [0, 0, -1179.4, 337.9, -1175.2, 339.3, -1171.7, 339.2, -1169.0, 337.0, -1154.2, 317.6, -1146.1, 304.4, -1141.9, 300.8, -1139.5, 300.4, -1138.1, 301.9,
      -1137.5, 305.2, -1135.7, 321.3, -1136.2, 324.3, -1137.5, 327.0, -1146.8, 334.7, -1149.6, 337.9, -1150.7, 341.3, -1149.5, 344.5, -1146.9, 347.3,
      -1144.0, 349.0, -1141.7, 349.3, -1135.3, 345.0, -1124.3, 334.7, -1121.7, 333.4, -1115.4, 333.0, -1112.9, 333.9, -1112.4, 336.2, -1113.7, 339.5,
      -1118.9, 345.9, -1122.3, 348.8, -1135.1, 355.7, -1138.4, 359.2],   // w1173883697 past side road 0
    [0, 1, -1410.5, 256.5],   // w452848829 past side road 1, into the car park
    [1, -1, -1410.5, 256.5, -1406.2, 263.1, -1398.5, 267.6, -1387.9, 270.7, -1377.9, 268.6],   // w452848826
    [1, -1, -1335.3, 256.6, -1332.1, 255.2, -1335.4, 243.3, -1339.9, 236.6, -1344.8, 221.0, -1355.8, 209.0, -1364.9, 201.3, -1384.9, 195.8, -1399.6, 183.9,
      -1415.0, 171.7] ];   // w452848828
  const WALL = [-1443.3, 246.5, -1422.6, 248.2, -1421.9, 248.3, -1407.4, 253.0, -1401.3, 261.3, -1395.8, 264.0];   // w1476784170
  // the ways' kinds: half width, the soft edge beyond it, colour (times the map), on the asphalt map, metres drawn from the way's start
  const WK = [[2.4, 0.45, [0.8, 0.8, 0.81], 1, 400], [0.6, 0.3, [0.5, 0.45, 0.36], 0, 115]];
  const T0 = 56, FADE = 8, TILE = 400, FILL_T = [0.43, 0.39, 0.3], FILL_B = [0.4, 0.42, 0.28];
  // the wall: its cross-section (across -1..1, up 0..1), height, width; its stone at the foot and at the top
  const WP = [[-1, 0], [-0.82, 1], [0.82, 1], [1, 0]], WALL_H = 1.0, WALL_W = 0.45, WB = [0.4, 0.39, 0.36], WT = [0.6, 0.59, 0.55];
  const CO = World.isunaObcestje = { wall: 'a', keepOut, extra, stats: null };
  const wallOn = () => CO.wall !== 'b';

  // ---- helpers (no rng: the world's own random sequence stays as it was) ----
  const hash = (i, j) => { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const patch = (x, z) => { const u = x / 9, v = z / 9, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv);
    const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1); return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv; };
  const tone = (c, x, z) => { const f = 0.95 + 0.08 * patch(x + 500, z); return [c[0] * f, c[1] * f, c[2] * f]; };
  const segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(px - ax - dx * t, pz - az - dz * t); };
  const sm = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const ss = (a, b, x) => sm((x - a) / (b - a));
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
  // a way's line: a side road's carrying on starts on that side road's own (smoothed) line T0 m from the road and runs to its end, then
  // OSM's; S the side road (Track.stubs), t0 where on it the line starts, sEnd the metres of the line along it
  const wayLine = (W, T) => {
    const L = W.slice(2), S = W[1] >= 0 && T && T.stubs ? T.stubs[W[1]] : null;
    if (!S || !S.x || S.n < 3) return { L, S: null, t0: 0, sEnd: -1 };
    const D = S.Lend / (S.n - 1), j0 = clamp(Math.round(T0 / D), 1, S.n - 2), P = [];
    let sEnd = 0; for (let j = j0; j < S.n; j++) { P.push(S.x[j], S.z[j]); if (j > j0) sEnd += Math.hypot(S.x[j] - S.x[j - 1], S.z[j] - S.z[j - 1]); }
    return { L: P.concat(L), S, t0: j0 * D, sEnd };
  };
  // the verge's height at offset o from sample i on a side: js/world-gore.js vProf without snow or side-road mouths
  const vergeY = (T, i, side, o) => {
    const bar = side > 0 ? T.br[i] : T.bl[i], e = T.wAt ? T.wAt(i) : T.w, y = T.hy[i];
    const gAt = (q) => vrGround(T.px[i] + T.nx[i] * side * q, T.pz[i] + T.nz[i] * side * q) - y, lift = (q, h) => [q, Math.max(h, gAt(q) + 0.05)];
    const Q = [[e + 0.6, -0.02], lift(Math.max(e + 1.2, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]];
    let k = 0; while (k < Q.length - 2 && Q[k + 1][0] < o) k++;
    const a = Q[k], b = Q[k + 1]; return y + a[1] + (b[1] - a[1]) * clamp((o - a[0]) / Math.max(1e-3, b[0] - a[0]), 0, 1);
  };

  // ---- no trees (nor rocks) on what is drawn here: gore.build calls this before it plants them (after vrPrep) ----
  function keepOut(push) {
    const T = API.T;
    for (const W of WAYS) { const [hw, , , , maxL] = WK[W[0]]; along(wayLine(W, T).L, 3, maxL + 4, (x, z) => push(x, z, hw + 1.2)); }
    if (wallOn()) along(WALL, 2, 1e9, (x, z) => push(x, z, 1.5));
  }

  // ---- the meshes: gore.build calls this (ctx: its scenery chunks, root, car parks, buildings, crowd) after its own extra ----
  function extra(ctx, tex) {
    const st = CO.stats = { wall: wallOn() ? 'a' : 'b', ways: 0, wayM: 0, stubRows: 0, fills: 0, meshes: 0, wallRings: 0, wallDropped: 0, wallM: 0 };
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
    U.base = (x, z) => { const g = vrGround(x, z) - 0.15, v = U.verge(x, z); return isNaN(v) ? g : Math.min(g, v - 0.1); };   // where the wall's foot goes
    lay(ctx, tex, st, U);
    if (wallOn()) wall(ctx, st, U);
  }

  // the ways: rows across every 1.25 m (both soft edges, the half widths, the middle of the wide ones), on the ground; one mesh per 400 m
  // square for the opaque middle and one see-through for the soft edges and the fading stretches, per map
  function lay(ctx, tex, st, U) {
    const T = U.T, R0 = (T.w || 3.8) + 0.05, tiles = new Map();
    const grit = typeof API.vrGritTex === 'function' ? API.vrGritTex() : null, asphT = (tex && tex.asphalt) || grit;
    const onRoad = (x, z) => { const nr = vrNear(x, z); return nr.i >= 0 && nr.d < R0; };
    const hard = (x, z) => onRoad(x, z) || U.inPad(x, z, 0.3);   // the cuts the ways run up to without fading: the asphalt, the car park
    const gbAt = (x, z, asph, fade) => { const key = (asph ? 'a' : 'g') + (fade ? 'f' : 'o') + Math.floor(x / TILE) + ',' + Math.floor(z / TILE);
      let t = tiles.get(key); if (!t) tiles.set(key, t = { g: new GB(true, fade), asph, fade }); return t.g; };
    const joined = (W, x, z) => { for (const V of WAYS) if (V !== W) for (let q = 2; q + 3 < V.length; q += 2) if (segD(x, z, V[q], V[q + 1], V[q + 2], V[q + 3]) < 1.5) return true; return false; };
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
    // over a side road's drawn end: its surface as js/world-vrsic.js stubGeo draws it (+ 0.055, sunk 0.12 m over its last 6 m), 3 cm
    // up; the ground under it is levelled 0.15 m below it (vrStubH), so that is the check (and the fallback) when the query strays
    const QQ = {}, SP = { S: null, j: -1, f: 0, t: 0, u: 0, kx: 1, kz: 0 };
    const stubT = (S, x, z, tg) => { if (typeof T._stubProj !== 'function') return tg; SP.S = null; return T._stubProj(S, x, z, SP) && SP.t > 0 ? SP.t : tg; };
    const stubTop = (S, x, z, t) => {
      const tEnd = S.end === 2 ? S.L + 0.5 : S.Lend, tt = Math.min(t, tEnd), sink = tEnd > S.L + 10 ? ss(tEnd - 6, tEnd, tt) * 0.12 : 0, ref = vrGround(x, z) + 0.205 - sink;
      let y = ref;
      if (typeof T.query === 'function' && typeof T.yAt === 'function' && typeof T.stubHint === 'function') { const v = T.yAt(T.query(x, z, T.stubHint(S.k, tt), QQ)) + 0.055 - sink; if (Math.abs(v - ref) < 0.5) y = v; }
      return y + 0.03;
    };
    // a free end (not on another way) short of the asphalt but within 8 m of the road's middle (OSM's node is off the road's line):
    // carried on to the middle, so it is cut at the asphalt's edge like the others and does not fade out on the verge
    const toRoad = (W, x, z) => { if (joined(W, x, z)) return null; const nr = vrNear(x, z); return nr.i >= 0 && nr.d >= R0 && nr.d < 8 ? [x - T.nx[nr.i] * nr.lat, z - T.nz[nr.i] * nr.lat] : null; };
    for (const W of WAYS) {
      const WL = wayLine(W, T), S = WL.S;
      let L = WL.L; if (!S) { const a = toRoad(W, L[0], L[1]); if (a) L = a.concat(L); } if (L.length >= 4) { const b = toRoad(W, L[L.length - 2], L[L.length - 1]); if (b) L = L.concat(b); }
      if (L.length < 4) continue;
      const [hw, e, col, asph, maxL] = WK[W[0]], Q = resample(L, 1.25), n = Q.length / 2, F = frame(Q);
      const OF = hw > 1 ? [-hw - e, -hw, 0, hw, hw + e] : [-hw - e, -hw, hw, hw + e], AX = hw > 1 ? [0, 1, 1, 1, 0] : [0, 1, 1, 0];
      const s = [0], H = [], Sf = [], fd = new Float64Array(n), lift = new Float64Array(OF.length);
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
        const f = F[k], x = Q[2 * k], z = Q[2 * k + 1], aL = sm(fd[k] / FADE), onStub = S && s[k] <= WL.sEnd + 0.01, t = onStub ? stubT(S, x, z, WL.t0 + s[k]) : 0;
        // near a hard cut each vertex slides along the way to its edge, so the end follows the asphalt's (or the car park's) edge
        let dir = 0, pull = false;
        for (let j = 1; j <= 6 && !dir; j++) { if (k - j >= 0 && H[k - j]) { dir = 1; pull = j === 1; } else if (k + j < n && H[k + j]) { dir = -1; pull = j === 1; } }
        const c3 = tone(col, x, z), p = [], cl = [], uv = [], vb = [];
        for (let q = 0; q < OF.length; q++) {
          const o = OF[q] * f.mi; let vx = x + f.nx * o, vz = z + f.nz * o;
          if (dir) {
            const ux = f.tx * dir * 0.1, uz = f.tz * dir * 0.1;
            if (hard(vx, vz)) { for (let m = 0; m < 60 && hard(vx, vz); m++) { vx += ux; vz += uz; } }
            else if (pull) { for (let m = 0; m < 15 && !hard(vx - ux, vz - uz); m++) { vx -= ux; vz -= uz; } }
          }
          const gr = ground(vx, vz); let y = gr[0];
          if (onStub) { y = Math.max(y, stubTop(S, vx, vz, t)); lift[q] = y - gr[0]; }
          else if (S && s[k] < WL.sEnd + 4) y += lift[q] * (1 - (s[k] - WL.sEnd) / 4);   // (off its end: down onto the ground over 4 m)
          p.push([vx, y, vz]); vb.push(gr[1]); cl.push([c3[0], c3[1], c3[2], AX[q] * aL]); uv.push(asph ? [(OF[q] + 4) / 8, s[k] / 8] : [OF[q] / 3, s[k] / 3]);
        }
        if (onStub) st.stubRows++;
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

  // the wall: a tube of the cross-section every 1.5 m (wider at the corners), its foot in the ground; left out where it would stand inside
  // the barrier line, on the car park or in a building, closed with a lid where it stops
  function wall(ctx, st, U) {
    const Q = resample(WALL, 1.5), n = Q.length / 2, F = frame(Q), R = [], np = WP.length;
    for (let k = 0; k < n; k++) {
      const x = Q[2 * k], z = Q[2 * k + 1], dd = U.dd(x, z);
      if (dd < WALL_W / 2 + 0.4 || U.inPad(x, z, WALL_W / 2 + 0.4) || U.inBld(x, z, WALL_W / 2 + 0.2)) { R.push(null); st.wallDropped++; continue; }
      const f = F[k], gc = vrGround(x, z), Hk = WALL_H * (0.94 + 0.12 * patch(x * 0.6 + 40, z * 0.6)), Wk = WALL_W / 2 * f.mi, tn = 0.9 + 0.2 * patch(x * 0.8 + 200, z * 0.8);
      const ring = [], cols = [];
      for (let j = 0; j < np; j++) {
        const o = WP[j][0] * Wk, py = WP[j][1], vx = x + f.nx * o, vz = z + f.nz * o, v = tn * (0.96 + 0.08 * hash(k, j + 31));
        ring.push([vx, (1 - py) * U.base(vx, vz) + py * (gc + Hk), vz]);
        cols.push([(WB[0] + (WT[0] - WB[0]) * py) * v, (WB[1] + (WT[1] - WB[1]) * py) * v, (WB[2] + (WT[2] - WB[2]) * py) * v]);
      }
      R.push({ x, z, gc, Hk, ring, cols }); st.wallRings++;
      if (U.CR && k % 2 === 0 && dd < 60) U.CR.avoid(x, z, WALL_W / 2 + 0.6);
    }
    for (let k = 1; k < n; k++) {
      const A = R[k - 1], B = R[k]; if (!A || !B) continue;
      const g = ctx.scen.get((A.x + B.x) / 2, (A.z + B.z) / 2), inside = [(A.x + B.x) / 2, (A.gc + B.gc) / 2 + 0.45 * (A.Hk + B.Hk) / 2, (A.z + B.z) / 2];
      for (let j = 0; j + 1 < np; j++) g.quadO(A.ring[j], B.ring[j], B.ring[j + 1], A.ring[j + 1], A.cols[j], inside, null, [A.cols[j], B.cols[j], B.cols[j + 1], A.cols[j + 1]]);
      st.wallM += Math.hypot(B.x - A.x, B.z - A.z);
    }
    for (let k = 0; k < n; k++) {   // the lids
      const A = R[k]; if (!A) continue;
      const pv = k > 0 && R[k - 1], nx = k < n - 1 && R[k + 1]; if (!pv === !nx) continue;
      const nb = pv || nx, dx = nb.x - A.x, dz = nb.z - A.z, l = Math.hypot(dx, dz) || 1, g = ctx.scen.get(A.x, A.z);
      const inside = [A.x + dx / l * 0.5, A.gc + A.Hk * 0.45, A.z + dz / l * 0.5], ctr = [A.x, A.gc + A.Hk * 0.4, A.z], cc = A.cols[1];
      for (let j = 0; j < np; j++) { const j1 = (j + 1) % np; g.triO(ctr, A.ring[j], A.ring[j1], cc, inside, A.cols[j], A.cols[j1]); }
    }
  }

  // ---- the hook: World.ext.isuna runs as before, with gore.build handed this file's keepOut and extra after its own ----
  const ext = World.ext, baseExt = ext.isuna;
  ext.isuna = function (scene, tex, opts) {
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
