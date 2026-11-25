/* =========================================================================
   WORLD — Gudauri, Gruzija: the furniture beside the road (docs/proge/gudauri.md, »Ob cesti«), on top of the pass's own world (js/world-prelaz.js,
   PL_LOOK.gudauri; its hooks LK.pre and LK.extra wrapped, a base hook's own work done first where there is one): the paths and the steps from
   the road out to ~60 m (dirt, the steps concrete; over the verge's ditch a little fill on a culvert), the two marked crossings, the bus platform
   beside the road, the two benches, the guidepost with blank boards and the mobile phone mast (TOWER_B: (a) false a lattice tower, (b) true a
   tubular one). The map's streets and service roads that meet the road are not laid here: package E's connectors with the posts are their
   picture (def.stranske, World.cesta.stranske in js/world-prelaz.js; the user's choice 24. 11. 2026: only those). Places, kinds, widths
   and surfaces from OpenStreetMap (© OpenStreetMap contributors, ODbL 1.0, read through the OpenStreetMap API 22. 11. 2026; README.md »Zasluge«;
   the ids by each list); all generic: no names, letters or signs. Graphics only, into the scenery's chunks (no draw call of its own), nothing
   knockable; no def.zebras, no def.sideRoads (the traffic's and the walkers' AI keep to the road as it was); the driving, physics and def.hills
   untouched. The trees, plants and rocks are kept off the new surfaces only past the corner signs', the pennants' and the finish's line (bar +
   1.6 m: what stands within it, its colliders too, stays as it was)
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK) return;
  const API = World.api, LK = API.PL_LOOK.gudauri;
  if (!LK) return;
  const { box, cyl, caGround, vrNear, rpHash } = API;
  let T; API.sync.push(() => { ({ T } = API); });

  const TOWER_B = false;   // (a) false: a lattice tower; (b) true: a tubular one (the user's choice in the PR)

  // the footways from the road (the junction's end first is found here): [OSM way, kind (3 path, 4 steps), surface (1 concrete, 4 dirt),
  // width (dm), x, z, ...], from the junction out to ~60 m from the road (the rest left out): path w1322573247 (surface=dirt), w171224637,
  // w205547597; steps w205388851. Widths and the other surfaces are not on the map: by the kind. The map's roads that meet this one (its
  // streets and service roads) are not laid here: they are package E's connectors with the posts (def.stranske, World.cesta.stranske; the
  // user's choice 24. 11. 2026: only those), and the lift gate that stood on one of them (n1203100412 on w104267450) went with it
  const WAYS = [
    [1322573247, 3, 4, 12, -484.6, -1343.4, -498.5, -1399.3],
    [171224637, 3, 4, 12, -316.5, -770.6, -308.5, -758.8, -300.4, -749.5, -289.8, -745, -269.9, -720.6, -265.8, -712.1],
    [205547597, 3, 4, 12, -155, -222.8, -212.7, -220.4],
    [205388851, 4, 1, 15, -413.1, -578.7, -431, -569.2]];
  // the marked crossings (highway=crossing, crossing=uncontrolled, crossing:markings=yes; the style not on the map: white bars as the game's
  // other crossings): n12864040319, n12864040325
  const ZEBRA = [[-168.4, -41.5], [-395.3, -519.8]];
  const PLATFORM = [-339.4, -430.8];   // (public_transport=platform, bus=yes, n2153320608)
  const BENCH = [[-393.7, -502.5], [-393.3, -503.8]];   // (amenity=bench, n2153508513, n2153508514; their direction not on the map: facing the road)
  const GUIDE = [-298.0, -411.8];   // (tourism=information, information=guidepost, bicycle=yes, mtb=yes, n2153553615)
  const MAST = [-689.7, -1918.9];   // (man_made=tower, tower:type=communication, communication:mobile_phone=yes, n13382152660; its height not on the map)
  const MAST_H = 24, MAST_HALF = 1.9;

  const SURF = [[0.42, 0.42, 0.43], [0.66, 0.65, 0.62], [0.55, 0.53, 0.5], [0.52, 0.49, 0.44], [0.5, 0.42, 0.32]];
  const SKIRT = [0.45, 0.41, 0.35], WOOD = [0.5, 0.36, 0.22], CONC = [0.64, 0.63, 0.6], CONC_T = [0.71, 0.7, 0.67], STEEL = [0.6, 0.61, 0.6];
  const PALE = [0.86, 0.82, 0.64], PANEL = [0.9, 0.9, 0.88], CAB = [0.78, 0.78, 0.75], RED = [0.78, 0.16, 0.13], WHITE = [0.93, 0.92, 0.9];
  const SIGN_LINE = 1.6;   // (no exclusion of trees reaches within bar + this: the corner signs at bar + 0.9 and 1.2, the pennants at 1.3, the finish's at 1.4)

  // the road's frame: the nearest sample, the offset across (+: right), the distance along
  const near = (x, z) => { const n = vrNear(x, z); if (n.i < 0) return null; const i = n.i, u = (x - T.px[i]) * T.tx[i] + (z - T.pz[i]) * T.tz[i];
    return { i, lat: n.lat, sd: n.lat >= 0 ? 1 : -1, s: i * T.ds + u }; };
  const bar = (i, sd) => (sd > 0 ? T.br[i] : T.bl[i]);
  const wAt = (i) => (T.wAt ? T.wAt(i) : T.w);
  // a point at the distance s along the road, o across it, y over the road's height
  const at = (s, o, y) => { const f0 = s / T.ds, i = Math.max(0, Math.min(T.N - 2, Math.floor(f0))), f = f0 - i, j = i + 1, L = (a) => a[i] + (a[j] - a[i]) * f;
    return [L(T.px) + L(T.nx) * o, L(T.hy) + y, L(T.pz) + L(T.nz) * o]; };
  // the distance from a point to a way's middle line
  const dWay = (pa, x, z) => { let m = 1e9; const Q = pa.P; for (let j = 0; j + 1 < Q.length; j++) { const ax = Q[j][0], az = Q[j][1], dx = Q[j + 1][0] - ax, dz = Q[j + 1][1] - az, L2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2)); m = Math.min(m, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return m; };
  const clearOfWays = (x, z, m) => { for (const pa of PATHS) if (dWay(pa, x, z) < pa.W / 2 + m) return false; return true; };

  let PATHS = [], SPOT = null, BLD = [], BLDS = [], PF = null;

  /* ---- the ways' middle lines: the junction's end first; rounded (two passes of corner cutting, the ends kept), but the steps; run in under the
     road until their whole end lies under its top; sampled at 0.3 m across the road's room, 0.6 m to 25 m out, 1.2 m past it ---- */
  function paths() {
    const out = [];
    for (const wy of WAYS) {
      const [id, kind, surf, wd] = wy, W = wd / 10; let Q = [];
      for (let j = 4; j + 1 < wy.length; j += 2) Q.push([wy[j], wy[j + 1]]);
      const onRoad = (p) => { const n = near(p[0], p[1]); return !!n && Math.abs(n.lat) < 6; };
      const a0 = onRoad(Q[0]), a1 = onRoad(Q[Q.length - 1]); if (!a0 && !a1) continue;
      if (!a0) Q.reverse();
      const both = a0 && a1;
      if (kind !== 4) for (let p = 0; p < 2; p++) { const R = [Q[0]];
        for (let j = 0; j + 1 < Q.length; j++) { const a = Q[j], b = Q[j + 1]; R.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); }
        R.push(Q[Q.length - 1]); Q = R; }
      const ext = (first) => { const a = first ? Q[0] : Q[Q.length - 1], b = first ? Q[1] : Q[Q.length - 2], n = near(a[0], a[1]); if (!n) return;
        let dx = a[0] - b[0], dz = a[1] - b[1]; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
        const cs = Math.abs(dx * T.nx[n.i] + dz * T.nz[n.i]), sn = Math.sqrt(Math.max(0, 1 - cs * cs));
        const e = Math.min(8, Math.max(0, (Math.abs(n.lat) + W / 2 * sn - (wAt(n.i) - 0.6)) / Math.max(0.35, cs)));
        if (e > 0.05) { const p = [a[0] + dx * e, a[1] + dz * e]; if (first) Q.unshift(p); else Q.push(p); } };
      if (kind !== 4) { ext(true); if (both) ext(false); }
      const P = [Q[0].slice()]; let j = 0, x = Q[0][0], z = Q[0][1];
      for (;;) { const n = near(x, z), a = n ? Math.abs(n.lat) : 1e9; let st = n && a < bar(n.i, n.sd) + 2.4 ? 0.3 : a < 25 ? 0.6 : 1.2;
        while (j < Q.length - 1) { const bx = Q[j + 1][0], bz = Q[j + 1][1], L = Math.hypot(bx - x, bz - z);
          if (L >= st) { x += (bx - x) * st / L; z += (bz - z) * st / L; st = 0; break; } st -= L; x = bx; z = bz; j++; }
        if (j >= Q.length - 1) { const e = Q[Q.length - 1], l = P[P.length - 1]; if (Math.hypot(e[0] - l[0], e[1] - l[1]) < 0.15) P[P.length - 1] = e.slice(); else P.push(e.slice()); break; }
        P.push([x, z]); }
      out.push({ id, kind, surf, W, P, Q, both });
    }
    return out;
  }

  // a house's footprint grown by h metres all round holds the point
  const inHouse = (x, z, h) => { for (const b of BLDS) if (inBld({ x: b.x, z: b.z, ang: b.ang, L: b.L + 2 * h, W: b.W + 2 * h }, x, z)) return true; return false; };
  // a place past the road's barrier (o: metres beyond it, at least), clear of the ways (m: metres beyond their edge) and of the houses (h: metres
  // beyond their walls), with the points moved with it (more: their offsets) too: the map's point pushed straight out, then further out and along
  // the road in half metres (up to 6 and 4 m) until all is clear
  function spot(x0, z0, o, m, h, more) {
    const n = near(x0, z0); if (!n) return { x: x0, z: z0, n: null, moved: 0 };
    const sd = n.sd, i = n.i, ox = T.nx[i] * sd, oz = T.nz[i] * sd, tx = T.tx[i], tz = T.tz[i], d0 = Math.max(0, bar(i, sd) + o - Math.abs(n.lat)), C = [];
    for (let a = 0; a <= 12; a++) for (let b = -8; b <= 8; b++) C.push([d0 + a * 0.5, b * 0.5, a * 0.5 + Math.abs(b) * 0.5]);
    C.sort((p, q) => p[2] - q[2]);
    const ok = (x, z) => { const nn = near(x, z); return !(nn && Math.abs(nn.lat) < bar(nn.i, nn.sd) + o) && clearOfWays(x, z, m) && !inHouse(x, z, h); };
    for (const [dn, ds] of C) { const x = x0 + ox * dn + tx * ds, z = z0 + oz * dn + tz * ds;
      if (ok(x, z) && (more || []).every(([u, v]) => ok(x + u, z + v))) return { x, z, n: near(x, z), moved: Math.hypot(dn, ds) }; }
    return { x: x0 + ox * d0, z: z0 + oz * d0, n: near(x0 + ox * d0, z0 + oz * d0), moved: d0, stuck: true };
  }

  function spots() {
    const S = { plat: null, bench: [], guide: null, mast: null };
    { const n = near(PLATFORM[0], PLATFORM[1]); if (n) S.plat = n; }
    // the benches: together, out past the verge's ditch (bar + 2.45 m), clear of the street beside them and of the hotel behind them
    { const n0 = near(BENCH[0][0], BENCH[0][1]), n1 = near(BENCH[1][0], BENCH[1][1]);
      if (n0 && n1) { const k = Math.abs(n0.lat) <= Math.abs(n1.lat) ? 0 : 1, o = BENCH[1 - k], p = spot(BENCH[k][0], BENCH[k][1], 2.45, 1.7, 1, [[o[0] - BENCH[k][0], o[1] - BENCH[k][1]]]), dx = p.x - BENCH[k][0], dz = p.z - BENCH[k][1];
        S.bench = BENCH.map(([x, z]) => ({ x: x + dx, z: z + dz, moved: Math.hypot(dx, dz), stuck: !!p.stuck })); } }
    // the guidepost: where the map has it, beside the side street's mouth in the road's wide flat room (graphics only, as the platform), or
    // the nearest place within 4 m off the asphalt's strip (1.2 m) and clear of the ways (0.6 m)
    { const C = []; for (let a = -8; a <= 8; a++) for (let b = -8; b <= 8; b++) if (a * a + b * b <= 64) C.push([a * 0.5, b * 0.5]);
      C.sort((p, q) => Math.hypot(p[0], p[1]) - Math.hypot(q[0], q[1]));
      for (const [dx, dz] of C) { const x = GUIDE[0] + dx, z = GUIDE[1] + dz, n = near(x, z);
        if (n && Math.abs(n.lat) >= wAt(n.i) + 1.2 && clearOfWays(x, z, 0.6) && !inHouse(x, z, 0.5)) { S.guide = { x, z, n, moved: Math.hypot(dx, dz) }; break; } }
      if (!S.guide) S.guide = { x: GUIDE[0], z: GUIDE[1], n: near(GUIDE[0], GUIDE[1]), moved: 0 }; }
    S.mast = spot(MAST[0], MAST[1], 1.9 + MAST_HALF + 0.3, MAST_HALF + 0.5, MAST_HALF + 1.6);
    return S;
  }

  // keeps the trees, plants and rocks off a circle, made smaller until it stays past the signs' line of every part of the road it is near
  function keep(exclPush, x, z, r) {
    for (let rr = r; rr >= 0.45; rr *= 0.8) { let ok = true;
      for (let k = 0; k < 9 && ok; k++) { const a = k * Math.PI / 4, px = k < 8 ? x + Math.cos(a) * rr : x, pz = k < 8 ? z + Math.sin(a) * rr : z, n = near(px, pz);
        if (n && Math.abs(n.lat) - (k < 8 ? 0 : rr) < bar(n.i, n.sd) + SIGN_LINE) ok = false; }
      if (ok) { exclPush(x, z, rr); return rr; } }
    return 0;
  }
  const inBld = (b, x, z) => { const c = Math.cos(b.ang || 0), s = Math.sin(b.ang || 0), dx = x - b.x, dz = z - b.z, u = dx * c + dz * s, v = -dx * s + dz * c;
    return Math.abs(u) < (b.L || 0) / 2 && Math.abs(v) < (b.W || 0) / 2; };

  /* ---- before the terrain: the shared builder's trees, plants and rocks kept off the ways and the furniture's places ---- */
  const basePre = LK.pre;
  LK.pre = function (o) {
    const r = basePre ? basePre.call(this, o) : undefined; if (!T) return r;
    const { exclPush, blds } = o;
    BLDS = blds || []; PATHS = paths(); SPOT = spots(); BLD = [];
    for (const pa of PATHS) { const Q = pa.P; let acc = 99;
      for (let j = 1; j < Q.length; j++) { acc += Math.hypot(Q[j][0] - Q[j - 1][0], Q[j][1] - Q[j - 1][1]); if (acc < 2.5) continue; acc = 0;
        const [x, z] = Q[j], rr = keep(exclPush, x, z, pa.W / 2 + 0.8);
        if (rr < pa.W / 2 + 0.5) { const a = Q[j - 1], L = Math.hypot(x - a[0], z - a[1]) || 1, cx = -(z - a[1]) / L, cz = (x - a[0]) / L;
          for (const sg of [-1, 1]) keep(exclPush, x + cx * sg * pa.W / 2, z + cz * sg * pa.W / 2, 1.1); } }
      if (blds && pa.P.some((p) => blds.some((b) => inBld(b, p[0], p[1])))) BLD.push(pa.id); }
    for (const b of SPOT.bench) keep(exclPush, b.x, b.z, 1.3);
    keep(exclPush, SPOT.guide.x, SPOT.guide.z, 1);
    keep(exclPush, SPOT.mast.x, SPOT.mast.z, 6);
    return r;
  };

  /* ---- the furniture: laid after the road's own landmarks (out.gudauriRoadside: what was built, the tests) ---- */
  const baseX = LK.extra;
  LK.extra = function (o) { const r = baseX ? baseX.call(this, o) : undefined; if (!T || !PATHS.length) return r; PF = o.out.propFloor || null; o.out.gudauriRoadside = lay(o); return r; };

  // the verge's own top at a point within the road's room (between the two samples about it)
  function verge(lat, s) { if (!PF) return 0; const f0 = s / T.ds, i = Math.max(0, Math.min(T.N - 2, Math.floor(f0))), f = f0 - i;
    return PF({ d: lat, i, s: -1 }, true) * (1 - f) + PF({ d: lat, i: i + 1, s: -1 }, true) * f; }
  // a new surface's height at a point (y: lifted against the flicker) over the ground one sees there (b: the verge's top within the road's room,
  // the terrain's past it, caGround's own mesh within 300 m of the road); over the verge's ditch a little fill on a culvert (at most 0.6 m, none
  // where the ditch is deep); on the asphalt under the road's top (hid)
  function hAt(x, z, lift) {
    const g = caGround(x, z), v = vrNear(x, z); if (v.i < 0) return { y: g + lift, b: g, hid: false };
    const i = v.i, lat = v.lat, a = Math.abs(lat), sd = lat >= 0 ? 1 : -1, w = wAt(i), oE = bar(i, sd) + 1.9;
    if (a > oE) return { y: g + lift, b: g, hid: false };
    const s = i * T.ds + (x - T.px[i]) * T.tx[i] + (z - T.pz[i]) * T.tz[i], ry = at(s, 0, 0)[1];
    if (a <= w - 0.3) return { y: ry - 0.06, b: ry, hid: true };
    if (a <= w) return { y: ry + 0.02, b: ry, hid: false };
    const top = Math.max(ry + verge(lat, s), g), E = at(s, sd * oE, 0), gE = Math.max(caGround(E[0], E[2]), ry + verge(sd * oE, s));
    const d = ry + (gE - ry) * (a - w) / (oE - w) - top, f = d <= 0 ? 0 : d <= 0.6 ? d : d * Math.max(0, Math.min(1, (1.2 - d) / 0.6));
    return { y: top + f + lift, b: top, hid: false };
  }

  // where the road has its rails (world-prelaz.js's own rule, as there: the corners from sev 2 on, the drops beside the road; not at the start's
  // and the finish's 30 m nor by the pull-offs; short gaps closed, short pieces dropped): a junction there has no gap in them, so its way starts
  // past the road's room
  function railNeed(pulls) {
    const N = T.N, need = [new Uint8Array(N), new Uint8Array(N)];
    for (const c of T.corners || []) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 8); k <= Math.min(N - 1, c.i1 + 8); k++) need[sd][k] = 1; }
    for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const b = side > 0 ? T.br[i] : T.bl[i];
      for (const d of [4, 8, 13, 19, 26]) { const o = side * (b + d);
        if (caGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
    const iS0 = T.idx(T.startS + 30), iS1 = T.idx(T.finishS - 30), byPull = (i) => { for (const p of pulls) if (Math.hypot(T.px[i] - p.x, T.pz[i] - p.z) < p.r + 6) return true; return false; };
    for (const side of [-1, 1]) { const nd = need[side > 0 ? 1 : 0];
      for (let i = 0; i < N; i++) if (i < iS0 || i > iS1 || byPull(i)) nd[i] = 0;
      for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }
      for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; } }
    return need;
  }

  // a thin square beam from A to B (r: its half-width), its four sides facing away from its axis
  function beam(g, A, B, r, col) {
    const dx = B[0] - A[0], dy = B[1] - A[1], dz = B[2] - A[2], L = Math.hypot(dx, dy, dz) || 1, ex = dx / L, ey = dy / L, ez = dz / L;
    let ux = -ez, uy = 0, uz = ex; if (Math.hypot(ux, uz) < 0.1) { ux = 0; uy = ez; uz = -ey; }
    const l = Math.hypot(ux, uy, uz); ux /= l; uy /= l; uz /= l;
    const vx = ey * uz - ez * uy, vy = ez * ux - ex * uz, vz = ex * uy - ey * ux, M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2];
    const C = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([a, b]) => [(ux * a + vx * b) * r, (uy * a + vy * b) * r, (uz * a + vz * b) * r]);
    for (let k = 0; k < 4; k++) { const p = C[k], q = C[(k + 1) % 4];
      g.quadO([A[0] + p[0], A[1] + p[1], A[2] + p[2]], [B[0] + p[0], B[1] + p[1], B[2] + p[2]], [B[0] + q[0], B[1] + q[1], B[2] + q[2]], [A[0] + q[0], A[1] + q[1], A[2] + q[2]], col, M); }
  }

  function lay({ scen, P }) {
    const st = { ways: 0, ribbon: 0, cells: 0, skirts: 0, cut: [], pads: 0, bld: BLD.slice(), bldCells: 0, steps: 0, zebras: 0, platform: 0, benches: 0, guide: 0, mast: 0, verts: 0,
      at: { bench: SPOT.bench.map((b) => +b.moved.toFixed(2)), guide: +SPOT.guide.moved.toFixed(2), mast: +SPOT.mast.moved.toFixed(2) },
      stuck: [...SPOT.bench.filter((b) => b.stuck).map(() => 'bench'), ...(SPOT.mast.stuck ? ['mast'] : [])] };
    let v0 = 0; for (const g of scen.map.values()) v0 += g.P.length / 3;
    const pads = (P && P.pads) || [], need = railNeed(pads);
    st.rails = +((need[0].reduce((a, b) => a + b, 0) + need[1].reduce((a, b) => a + b, 0)) / (2 * T.N)).toFixed(3);   // (to hold against the builder's own: its out.stats.rails)
    const inPad = (x, z) => { for (const p of pads) if (Math.hypot(x - p.x, z - p.z) < p.r - 0.5) return true; return false; };
    // a house the builder moved back from the road onto a way (L.hotels): the way's cells within its walls (and 0.3 m about them) left out
    const inB = (x, z) => inHouse(x, z, 0.3);
    const quad = (A, B, C, D, col) => scen.get((A[0] + C[0]) / 2, (A[2] + C[2]) / 2).quadUp(A, B, C, D, [col, col, col, col]);
    const wall = (A, B, C, D, col, ins) => scen.get((A[0] + C[0]) / 2, (A[2] + C[2]) / 2).quadO(A, B, C, D, col, ins);
    const inRoom = (x, z) => { const n = near(x, z); return !!n && Math.abs(n.lat) < bar(n.i, n.sd) + 1.95; };
    // a junction on a stretch with rails: the rows within the road's room left out
    const railed = (rows, fromEnd) => { let lo = 1e9, hi = -1, sd = 0; const R = fromEnd ? rows.slice().reverse() : rows;
      for (const row of R) { let any = false; for (const v of row) { const n = near(v[0], v[2]); if (n && Math.abs(n.lat) < bar(n.i, n.sd) + 1.95) { any = true; lo = Math.min(lo, n.i); hi = Math.max(hi, n.i); sd = n.sd; } } if (!any) break; }
      if (hi < 0) return false; const nd = need[sd > 0 ? 1 : 0]; for (let i = Math.max(0, lo - 1); i <= Math.min(T.N - 1, hi + 1); i++) if (nd[i]) return true; return false; };

    // the ways: a ribbon of cells across (4 on a street or a service road, 2 on a path), each corner on the ground one sees, a little over it;
    // where an edge stands over the ground (the culvert's fill, the ground's folds) a bank of earth down to it
    PATHS.forEach((pa, k) => {
      if (pa.kind === 4) return;
      const M = pa.W >= 3 ? 4 : 2, lift = 0.06 + 0.006 * (k % 4), c0 = pa.surf === 4 || pa.surf === 3 ? SURF[pa.surf] : SURF[pa.surf], Q = pa.P;
      let rows = Q.map((p, j) => { const a = Q[Math.max(0, j - 1)], b = Q[Math.min(Q.length - 1, j + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, cx = -(b[1] - a[1]) / L, cz = (b[0] - a[0]) / L, R = [];
        for (let m = 0; m <= M; m++) { const o = -pa.W / 2 + pa.W * m / M, x = p[0] + cx * o, z = p[1] + cz * o, h = hAt(x, z, lift); R.push([x, h.y, z, h.b, h.hid]); } return R; });
      for (const fromEnd of pa.both ? [false, true] : [false]) if (railed(rows, fromEnd)) { st.cut.push(pa.id);
        if (fromEnd) { while (rows.length && rows[rows.length - 1].some((v) => inRoom(v[0], v[2]))) rows.pop(); }
        else { let j = 0; while (j < rows.length && rows[j].some((v) => inRoom(v[0], v[2]))) j++; rows = rows.slice(j); } }
      if (rows.length < 2) return;
      st.ways++;
      for (let j = 0; j + 1 < rows.length; j++) { const A = rows[j], B = rows[j + 1], q = 0.95 + 0.08 * rpHash(j >> 2, 300 + k), col = [c0[0] * q, c0[1] * q, c0[2] * q];
        st.ribbon += Math.hypot(B[M >> 1][0] - A[M >> 1][0], B[M >> 1][2] - A[M >> 1][2]);
        for (let m = 0; m < M; m++) { const a = A[m], b = A[m + 1], c = B[m + 1], d = B[m]; if (a[4] && b[4] && c[4] && d[4]) continue;
          if (inPad((a[0] + c[0]) / 2, (a[2] + c[2]) / 2)) { st.pads++; continue; }
          if (inB((a[0] + c[0]) / 2, (a[2] + c[2]) / 2)) { st.bldCells++; continue; }
          quad([a[0], a[1], a[2]], [b[0], b[1], b[2]], [c[0], c[1], c[2]], [d[0], d[1], d[2]], col); st.cells++; }
        for (const m of [0, M]) { const a = A[m], d = B[m]; if (a[4] || d[4] || Math.max(a[1] - a[3], d[1] - d[3]) <= 0.085) continue;
          if (inPad((a[0] + d[0]) / 2, (a[2] + d[2]) / 2) || inB((a[0] + d[0]) / 2, (a[2] + d[2]) / 2)) continue;
          const c = A[M >> 1]; wall([a[0], a[3] - 0.1, a[2]], [d[0], d[3] - 0.1, d[2]], [d[0], d[1], d[2]], [a[0], a[1], a[2]], SKIRT, [c[0], c[1] - 0.3, c[2]]); st.skirts++; } }
    });
    st.ribbon = Math.round(st.ribbon);

    // the steps: a concrete step every 0.9 m of the way, each a slab on the ground's slope (over the ditch on the culvert's fill); none on the
    // road and its strip, none within the road's room where its rails run
    for (const pa of PATHS) { if (pa.kind !== 4) continue; const Q = pa.Q;
      const n0 = near(Q[0][0], Q[0][1]), cut = !!n0 && need[n0.sd > 0 ? 1 : 0][n0.i] === 1; if (cut) st.cut.push(pa.id);
      for (let j = 0; j + 1 < Q.length; j++) { const x0 = Q[j][0], z0 = Q[j][1], dx = Q[j + 1][0] - x0, dz = Q[j + 1][1] - z0, L = Math.hypot(dx, dz), rot = Math.atan2(dz, dx);
        for (let d = 0.45; d < L; d += 0.9) { const x = x0 + dx * d / L, z = z0 + dz * d / L, n = near(x, z);
          if (n && Math.abs(n.lat) < wAt(n.i) + 0.3) continue; if (cut && inRoom(x, z)) continue;
          const y = hAt(x, z, 0).y; box(scen.get(x, z), x, y - 0.3, z, 0.9, 0.42, pa.W, rot, CONC, CONC_T); st.steps++; } } }

    // the crossings: white bars along the road, 0.5 m wide, 0.5 m apart, 3 m long, the middle one on the centre line (as the game's other crossings)
    for (const [x, z] of ZEBRA) { const n = near(x, z); if (!n) continue; const w = wAt(n.i), s0 = n.s - 1.5, s1 = n.s + 1.5;
      for (let u = -Math.floor(w - 0.6); u <= w - 0.6; u += 1) quad(at(s0, u - 0.25, 0.045), at(s0, u + 0.25, 0.045), at(s1, u + 0.25, 0.045), at(s1, u - 0.25, 0.045), [0.95, 0.95, 0.92]);
      st.zebras++; }

    // the bus platform: a low concrete slab beside the asphalt past its strip (out to just past the map's point), 10 m along the road, its kerb
    // lighter; low (0.1 m over the road), as the cars' wheels may run onto it (graphics only)
    if (SPOT.plat) { const n = SPOT.plat, sd = n.sd, w = wAt(n.i), o0 = w + 0.45, o1 = Math.min(bar(n.i, sd) - 0.3, Math.abs(n.lat) + 0.6), TOP = 0.1, Pp = (s, o, y) => at(s, sd * o, y);
      for (let k = 0; k < 10; k++) { const s0 = n.s - 5 + k, s1 = s0 + 1, ins = at(s0 + 0.5, sd * (o0 + o1) / 2, -1);
        quad(Pp(s0, o0, TOP), Pp(s0, o0 + 0.3, TOP), Pp(s1, o0 + 0.3, TOP), Pp(s1, o0, TOP), CONC_T);
        quad(Pp(s0, o0 + 0.3, TOP), Pp(s0, o1, TOP), Pp(s1, o1, TOP), Pp(s1, o0 + 0.3, TOP), CONC);
        wall(Pp(s0, o0, -0.06), Pp(s1, o0, -0.06), Pp(s1, o0, TOP), Pp(s0, o0, TOP), CONC_T, ins);
        wall(Pp(s0, o1, -0.3), Pp(s1, o1, -0.3), Pp(s1, o1, TOP), Pp(s0, o1, TOP), CONC, ins);
        if (k === 0 || k === 9) { const s = k ? s1 : s0; wall(Pp(s, o0, -0.3), Pp(s, o1, -0.3), Pp(s, o1, TOP), Pp(s, o0, TOP), CONC, ins); } }
      st.platform = 1; }

    // the benches: a wooden seat on the ground and its back, along the road, facing it
    for (const b of SPOT.bench) { const n = near(b.x, b.z); if (!n) continue; const g = scen.get(b.x, b.z), hd = Math.atan2(T.tz[n.i], T.tx[n.i]), ox = T.nx[n.i] * n.sd, oz = T.nz[n.i] * n.sd;
      let lo = 1e9, hi = -1e9; for (const [u, v] of [[-0.8, -0.25], [0.8, -0.25], [0.8, 0.25], [-0.8, 0.25]]) { const y = caGround(b.x + T.tx[n.i] * u + ox * v, b.z + T.tz[n.i] * u + oz * v); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      box(g, b.x, lo - 0.05, b.z, 1.6, hi - lo + 0.5, 0.42, hd, WOOD);
      box(g, b.x + ox * 0.18, hi + 0.45, b.z + oz * 0.18, 1.6, 0.42, 0.07, hd, WOOD);
      st.benches++; }

    // the guidepost: a post with two blank boards, one along the road, one along the side street by it
    { const p = SPOT.guide, g = scen.get(p.x, p.z), y = hAt(p.x, p.z, 0).b, n = p.n; let hs = n ? Math.atan2(T.tz[n.i], T.tx[n.i]) : 0, hw = hs + Math.PI / 2;
      let bw = null, bd = 1e9; for (const pa of PATHS) { const d = dWay(pa, p.x, p.z); if (d < bd) { bd = d; bw = pa; } }
      if (bw && bd < 30) { const a = bw.P[0], b = bw.P[Math.min(bw.P.length - 1, 40)]; hw = Math.atan2(b[1] - a[1], b[0] - a[0]); }
      box(g, p.x, y - 0.2, p.z, 0.11, 2.8, 0.11, hs, [0.62, 0.6, 0.56]);
      box(g, p.x + Math.cos(hs) * 0.38, y + 2.2, p.z + Math.sin(hs) * 0.38, 0.85, 0.2, 0.03, hs, PALE);
      box(g, p.x + Math.cos(hw) * 0.38, y + 1.9, p.z + Math.sin(hw) * 0.38, 0.85, 0.2, 0.03, hw, PALE);
      st.guide = 1; }

    // the mast: a concrete base, (a) a lattice tower (four legs drawing in, a ring and crossed braces in each panel) or (b) a tubular one, the
    // antennas' three panels near the top on a platform, the cabinet beside it; out past the verge's ditch
    { const p = SPOT.mast, n = p.n, g = scen.get(p.x, p.z), rot = n ? Math.atan2(T.tz[n.i], T.tx[n.i]) : 0, ca = Math.cos(rot), sa = Math.sin(rot), H = MAST_H;
      const loc = (u, v) => [p.x + ca * u - sa * v, p.z + sa * u + ca * v];
      let lo = 1e9, hi = -1e9; for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 0]]) { const [x, z] = loc(u * MAST_HALF, v * MAST_HALF), y = caGround(x, z); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      const y0 = hi + 0.15;
      box(g, p.x, lo - 0.3, p.z, 2 * MAST_HALF, y0 - lo + 0.3, 2 * MAST_HALF, rot, CONC, CONC_T);
      { const [x, z] = loc(0, -(MAST_HALF + 0.9)); box(g, x, caGround(x, z) - 0.1, z, 1.3, 1.75, 0.7, rot, CAB, CAB); }
      let rTop;
      if (!TOWER_B) { const b0 = 1.55, b1 = 0.5, NP = 7, bAt = (h) => b0 + (b1 - b0) * h / H, cor = (h, k) => { const b = bAt(h), [x, z] = loc((k === 0 || k === 3 ? -1 : 1) * b, (k < 2 ? -1 : 1) * b); return [x, y0 + h, z]; };
        for (let lv = 0; lv < NP; lv++) { const h0 = H * lv / NP, h1 = H * (lv + 1) / NP;
          for (let k = 0; k < 4; k++) { const k2 = (k + 1) % 4; beam(g, cor(h0, k), cor(h1, k), 0.07, STEEL); beam(g, cor(h1, k), cor(h1, k2), 0.04, STEEL);
            beam(g, cor(h0, k), cor(h1, k2), 0.03, STEEL); beam(g, cor(h0, k2), cor(h1, k), 0.03, STEEL); } }
        rTop = b1 + 0.35; }
      else { cyl(g, p.x, y0, p.z, 0.5, H, 12, STEEL, STEEL, 0.28); rTop = 0.75; }
      cyl(g, p.x, y0 + H - 2.4, p.z, rTop + 0.2, 0.12, 10, STEEL, STEEL);
      for (let k = 0; k < 3; k++) { const a = rot + k * Math.PI * 2 / 3 + Math.PI / 6, x = p.x + Math.cos(a) * rTop, z = p.z + Math.sin(a) * rTop;
        box(g, x, y0 + H - 2.2, z, 0.32, 1.5, 0.13, a + Math.PI / 2, PANEL, PANEL); }
      cyl(g, p.x, y0 + H, p.z, 0.05, 1.6, 5, STEEL, STEEL, 0.02);
      st.mast = TOWER_B ? 2 : 1; }

    st.inHouse = [['guide', SPOT.guide], ['mast', SPOT.mast], ...SPOT.bench.map((q) => ['bench', q])].filter(([, q]) => inB(q.x, q.z)).map(([k]) => k);
    for (const g of scen.map.values()) st.verts += g.P.length / 3; st.verts -= v0;
    return st;
  }
})();
