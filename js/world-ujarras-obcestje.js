/* ===================================================================================================================================
   WORLD — Ujarrás, Costa Rica: the side roads from OpenStreetMap (22. 11. 2026), laid over the gore world js/world-ujarras.js builds
   -----------------------------------------------------------------------------------------------------------------------------------
   How: World.ext.ujarras is wrapped; while it runs, World.gore.build gets this file's keepOut (no trees, rocks nor pennants on the ways)
   and extra (their meshes) after its own. js/world-ujarras.js and js/tracks/ujarras.js (its def.sideRoads too) are not changed.
   Drawn (OSM), all residential with no width nor lanes tagged: 6 m (the class, as tools/proga-uvoz.mjs gives the side roads), asphalt:
     the two side roads the game has (def.sideRoads 0 and 1: drivable 90 m, drawn to 129 m and fading there) on past where they fade:
     w715265997 (side road 0) on along the slope above the road for about 500 m, to where it turns back to the road past the track's
     end; w777199058 (side road 1) on down to its last node, about 205 m more; laid on their drawn ends first, so the asphalt runs on
     where they fade into the ground;
     the two streets at the start line's crossroads (within 30 m of the start, so not side roads the game imports): w69553558 to the
     south (224 m, to w564087207) and w159754479 to the north, its first 165 m; a) drawn, b) not drawn (World.ujarrasObcestje.chiral:
     the start gantry's right post stands in its mouth);
     w564087207 (surface=paved) from 45 m east of w69553558 west for 455 m, 100–210 m south of the road, and w1182074216 on from
     it (unclassified, surface=unpaved: 6 m of gravel), its first 80 m.
   Where a way meets the road it stops at the asphalt's edge; its free ends and where it is not drawn further fade into the ground.
   Not drawn: the track w1182074214 (over 330 m from the road), the park w705644685 (OSM tags nothing of its ground).
   No new def.sideRoads, stubs or gaps: driving, physics and def.hills are unchanged.
   Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«), 22. 11. 2026
   =================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.gore || !World.ext || typeof World.ext.ujarras !== 'function') return;
  const API = World.api, { GB, clamp, vrGround, vrNear } = API;

  // ---- the data: x east, z south, metres from the track's origin (the start line); flat x, z lists ----
  // [kind, the side road it carries on (its index in def.sideRoads, its own line from T0 m on) or -1, x, z, ...]
  const CHIRAL = [0, -1, -3.6, -0.9, 21.2, -17.4, 40.9, -26.5, 48.0, -34.2, 50.3, -43.9, 50.6, -56.8, 45.0, -73.3, 33.8, -90.0, 16.2, -103.2, -2.6, -112.9];   // w159754479
  const WAYS = [
    [0, 0, -219.4, -117.6, -263.7, -122.0, -275.8, -118.2, -303.7, -104.4, -322.5, -94.1, -344.5, -93.8, -368.0, -99.1, -388.3, -103.5, -403.3, -112.3,
      -423.6, -130.5, -444.2, -148.2, -464.7, -160.5, -481.8, -167.3, -496.8, -174.3, -508.2, -184.0, -518.8, -200.5, -541.1, -263.7, -553.5, -288.6,
      -562.0, -300.7, -572.9, -308.6, -585.2, -313.9],   // w715265997 past side road 0
    [0, 1, -707.0, 239.7],   // w777199058 past side road 1
    [0, -1, -3.6, -0.9, -4.8, 85.6, 4.8, 131.7, 5.4, 151.3, 0.4, 170.3, -10.2, 187.2, -21.6, 203.0, -32.5, 208.3],   // w69553558
    CHIRAL,
    [0, -1, 11.9, 207.4, -15.6, 212.7, -32.5, 208.3, -70.6, 187.2, -123.0, 155.4, -141.4, 141.6, -161.5, 121.0, -174.6, 105.8, -185.0, 100.0, -198.9, 98.5,
      -266.6, 105.3, -312.1, 110.6, -359.8, 114.7, -380.0, 115.3, -403.3, 112.1],   // w564087207
    [1, -1, -403.3, 112.1, -430.4, 121.0, -450.9, 126.5, -478.5, 138.4] ];   // w1182074216
  // the ways' kinds: half width, the soft edge beyond it, colour (times the map), on the asphalt map
  const WK = [[3.0, 0.45, [0.8, 0.8, 0.81], 1], [3.0, 0.45, [0.58, 0.53, 0.44], 0]];
  const T0 = 86, FADE = 8, TILE = 400;
  const CO = World.ujarrasObcestje = { chiral: 'a', keepOut, extra, stats: null };
  const ways = () => CO.chiral === 'b' ? WAYS.filter((W) => W !== CHIRAL) : WAYS;

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
  const along = (L, step, fn) => { const Q = resample(L, step); for (let k = 0; k < Q.length; k += 2) fn(Q[k], Q[k + 1]); };
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

  // ---- no trees, rocks nor pennants on what is drawn here: gore.build calls this before it plants them (after vrPrep) ----
  function keepOut(push) {
    const T = API.T;
    for (const W of ways()) { const hw = WK[W[0]][0]; along(wayLine(W, T).L, 3, (x, z) => push(x, z, hw + 1.2)); }
  }

  // ---- the meshes: gore.build calls this (ctx: its scenery chunks, root, car parks, buildings, crowd) after its own extra ----
  function extra(ctx, tex) {
    const st = CO.stats = { chiral: CO.chiral === 'b' ? 'b' : 'a', ways: 0, wayM: 0, stubRows: 0, meshes: 0 };
    if (!ctx || !ctx.scen || !ctx.root) return;
    const T = API.T, pads = (ctx.P && ctx.P.pads) || [], blds = ctx.blds || [], CR = ctx.CR && typeof ctx.CR.avoid === 'function' ? ctx.CR : null;
    const U = {
      T, CR,
      inPad: (x, z, m) => { for (const p of pads) if (Math.hypot(x - p.x, z - p.z) < p.r + m) return true; return false; },
      inBld: (x, z, m) => { for (const b of blds) { const dx = x - b.x, dz = z - b.z, c = Math.cos(b.ang || 0), s = Math.sin(b.ang || 0);
        if (Math.abs(c * dx + s * dz) < b.L / 2 + m && Math.abs(-s * dx + c * dz) < b.W / 2 + m) return true; } return false; },
      dd: (x, z) => { const nr = vrNear(x, z); return nr.i < 0 ? 1e9 : nr.dd; },
    };
    lay(ctx, tex, st, U, ways());
  }

  // the ways: rows across every 1.25 m (both soft edges, the half widths, the middle), on the ground; one mesh per 400 m square for the
  // opaque middle and one see-through for the soft edges and the fading stretches, per map
  function lay(ctx, tex, st, U, WS) {
    const T = U.T, R0 = (T.w || 3.8) + 0.05, tiles = new Map();
    const grit = typeof API.vrGritTex === 'function' ? API.vrGritTex() : null, asphT = (tex && tex.asphalt) || grit;
    const onRoad = (x, z) => { const nr = vrNear(x, z); return nr.i >= 0 && nr.d < R0; };
    const hard = (x, z) => onRoad(x, z) || U.inPad(x, z, 0.3);   // the cuts the ways run up to without fading: the asphalt, a car park
    const gbAt = (x, z, asph, fade) => { const key = (asph ? 'a' : 'g') + (fade ? 'f' : 'o') + Math.floor(x / TILE) + ',' + Math.floor(z / TILE);
      let t = tiles.get(key); if (!t) tiles.set(key, t = { g: new GB(true, fade), asph, fade }); return t.g; };
    const joined = (W, x, z) => { for (const V of WS) if (V !== W) for (let q = 2; q + 3 < V.length; q += 2) if (segD(x, z, V[q], V[q + 1], V[q + 2], V[q + 3]) < 1.5) return true; return false; };
    // the way's height at (x, z): on the ground, or over the verge a straight fill from the road's edge out to the ground past the ditch
    // (its soft edges go down onto the verge, so the fill has no sides to show);
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
    for (const W of WS) {
      const WL = wayLine(W, T), S = WL.S;
      let L = WL.L; if (!S) { const a = toRoad(W, L[0], L[1]); if (a) L = a.concat(L); } if (L.length >= 4) { const b = toRoad(W, L[L.length - 2], L[L.length - 1]); if (b) L = L.concat(b); }
      if (L.length < 4) continue;
      const [hw, e, col, asph] = WK[W[0]], Q = resample(L, 1.25), n = Q.length / 2, F = frame(Q);
      const OF = [-hw - e, -hw, 0, hw, hw + e], AX = [0, 1, 1, 1, 0];
      const s = [0], H = [], Sf = [], fd = new Float64Array(n), lift = new Float64Array(OF.length);
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
        const f = F[k], x = Q[2 * k], z = Q[2 * k + 1], aL = sm(fd[k] / FADE), onStub = S && s[k] <= WL.sEnd + 0.01, t = onStub ? stubT(S, x, z, WL.t0 + s[k]) : 0;
        // near a hard cut each vertex slides along the way to its edge, so the end follows the asphalt's edge
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
          const gr = ground(vx, vz); let y = AX[q] === 0 && !isNaN(gr[1]) ? gr[1] + 0.05 : gr[0];
          if (onStub) { y = Math.max(y, stubTop(S, vx, vz, t)); lift[q] = y - gr[0]; }
          else if (S && s[k] < WL.sEnd + 4) y += lift[q] * (1 - (s[k] - WL.sEnd) / 4);   // (off its end: down onto the ground over 4 m)
          p.push([vx, y, vz]); cl.push([c3[0], c3[1], c3[2], AX[q] * aL]); uv.push(asph ? [(OF[q] + 4) / 8, s[k] / 8] : [OF[q] / 3, s[k] / 3]);
        }
        if (onStub) st.stubRows++;
        rows[k] = { p, cl, uv, aL, x, z };
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

  // ---- the hook: World.ext.ujarras runs as before, with gore.build handed this file's keepOut and extra after its own ----
  const ext = World.ext, baseExt = ext.ujarras;
  ext.ujarras = function (scene, tex, opts) {
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
