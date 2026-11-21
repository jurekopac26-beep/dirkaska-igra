/* =========================================================================
   WORLD — realizem 15: Kildare, Irska (docs/realizem.md, »Postopek za vse proge«) by OpenStreetMap within 60 m of its lap: the service
   roads and footpaths of the grounds as ribbons laid on the ground (highway=service 3.6 m wide, highway=footway 1.8 m; the one footway
   tagged surface=asphalt in asphalt, the others in pale gravel), the service yard (area:highway=service) in full, the gate
   (barrier=gate) of way 38715379 closed across its road, and the true outlines of two buildings the circuit drew as boxes: the single-storey
   flat-roofed hall (building=retail, building:levels=1, roof:shape=flat) and the carport (building=carport), an open roof on posts.
   OSM has no trees, hedges, fences, walls, ditches or water here, and no surface, width, lanes or lit on the service roads.
   Assumed and said so in the pull request: the widths, the pale gravel of the untagged ways and of the yard (as the roads' package
   draws a service road without a surface), the hall's 4.5 m for its one level, the carport's 2.6 m under its roof and its posts, the
   gate as a galvanised bar gate 4 m wide. A road is cut 66 m from the lap and fades into the ground there; it ends at the lap's grass
   verge, which the shared builder lays over the ground to 3.2 m beyond the barriers (the race closes the road there), and where a
   raceway of the circuit's other layouts runs over it.
   Not drawn: the stretches of the ways on the lap's own ground (within its verge: the service road along the fence south of the
   small buildings among them), the second gate (on way 88611296, inside the lap's barriers, which close that road themselves), the
   grounds' boundary (no barrier on it), the playground (private, nothing mapped in it), the shingle (beyond 60 m but
   for a corner, and under the raceways' gravel), the way 59.6 m and more from the lap, the unpaved track that leaves the band at
   once; the footbridge and its steps and the power line are the circuit's own already.
   No names anywhere: only OSM's way and node numbers.
   Hooked by wrapping the look's extra (API.rbLook.kildare.extra): loaded right after the circuit's own world (js/world-kildare.js)
   and before the shared builder (js/world-rbring.js), which calls it with the scenery's chunks before its crowds and trees.
   Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«); x east and z south of the middle of the start line, in metres.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, lk = API.rbLook && API.rbLook.kildare;
  if (!lk || !lk.extra) return;
  const { GB, box, clamp, inPoly, polyDist, nrGround, nrGCol, nrDist, nrNear } = API;

  // the ways, cut 66 m from the lap: [OSM way, kind (0 service road, 1 footway, 2 asphalt footway), fades at its start, at its end, [x, z, …]]
  const WAYS = [
    [38715379, 0, 1, 0, [1.4, -166.3, -29.8, -157.1, -31.3, -162, -68.5, -279.7, -84.7, -325, -103.7, -319.7, -128.7, -304.7, -145.5, -280.9, -171.6, -217.5, -179.1, -190.5]],
    [87185965, 0, 0, 1, [-29.8, -157.1, -23, -134.5, -9.3, -93.1, 1.7, -62, 18, -27.9, 35.9, -3.9, 44.7, 18.7, 50.6, 28.6, 53.1, 32.7, 68.6, 69.3, 71.9, 79.7, 73.7, 94.9, 73.6, 100.2, 73.9, 100.9]],
    [88611279, 0, 0, 0, [-103.8, 38.7, -105.5, 28.6, -109.5, 17.1, -112.3, 9.4, -116.7, -7.1]],
    [88611291, 0, 1, 0, [76, 9.2, 44.7, 18.7]],
    [88611296, 0, 0, 0, [44.7, 18.7, 28.9, 26.4, 14.8, 33.3]],
    [265528120, 2, 0, 0, [33.1, 34.7, 48.9, 29.2]],
    [265528122, 0, 1, 0, [-148.1, -96.2, -179.2, -108, -209.5, -120.6]],
    [265528123, 0, 0, 1, [-229.8, -67.6, -238.8, -67.1, -258.5, -67.4, -271, -65.7, -336.8, -48.3]],
    [981347880, 0, 0, 1, [-101.7, -209, -119.3, -190.1, -129.5, -177.4, -130.9, -170, -125.3, -156, -90.5, -67.6, -76.9, -35.6, -111.5, -13.3, -116.7, -7.1, -124.2, -7.6, -149.4, -18.3, -154.9, -23.7, -160.3, -36.5, -162.5, -44.9, -162.7, -51.1, -162.3, -52.1]],
    [1323583460, 0, 0, 0, [-109.5, 17.1, -105, 17, -92.4, 31.8, -78.6, 44.6, -72.5, 52.5]],
    [1323583461, 0, 0, 0, [-30.5, -21.7, -55.6, -82.9, -90.5, -67.6]],
    [1323583468, 1, 0, 0, [-265.9, 29.6, -253.5, 27.4]],
    [1323583469, 1, 0, 0, [-268, 18.2, -265.9, 29.6, -262.4, 48.8]],
    [1323583470, 1, 0, 0, [-224.7, -18.6, -224.5, -4.7, -227.8, 5.6]],
    [1323583471, 0, 1, 0, [-374.8, 41.7, -297.2, 22.9, -268.3, 16.4, -228.3, 7.3, -217.7, 2.6, -208.4, -0.6]],
    [1323583472, 0, 0, 0, [-217.5, 20, -209.8, 12.1, -206.9, 6.8, -208.4, -0.6, -217.5, -19.9]],
    [1323583473, 0, 0, 0, [-261.4, 48.5, -251.7, 27.1, -217.5, 20, -213.8, 22.7, -208.9, 36.4]],
    [1323583475, 0, 0, 0, [-23, -134.5, 2, -135.5, 11.6, -132.3, 19.1, -104.7, -9.3, -93.1]],
    [1323583480, 0, 1, 0, [-69.6, -314, -61.5, -301.1, -38.8, -248.7, -26, -220.1, -23.7, -204.3, -26.5, -186.5, -31.3, -162]],
    [1323583483, 1, 0, 0, [-1.8, 50.5, 1.6, 48.9]],
    [1323583484, 1, 0, 0, [-20.2, 41.8, -11.8, 39.6, -8.6, 40.6, -1.8, 50.5, -2, 61.5, -26.2, 69.7, -42.3, 59.7]],
    [1323583485, 0, 0, 0, [-35.8, -20.7, -73.7, -31.1]],
    [1323583486, 0, 0, 0, [-21.5, -23.3, -30.5, -21.7, -35.8, -20.7, -57.7, -8.4]],
    [1323583487, 0, 0, 0, [-112.3, 9.4, -74.7, -2.9, -57.7, -8.4]],
    [1323583488, 0, 0, 0, [-76.9, -35.6, -73.7, -31.1, -57.7, -8.4, -21.9, 42.2, -43.8, 58.8, -72.8, 18.1, -74.1, 12.9, -57.7, -8.4]],
    [1323583489, 0, 0, 1, [-160.3, -36.5, -151.4, -40.3]],
    [1323583489, 0, 1, 0, [-98.6, -63.9, -90.5, -67.6]],
    [1323583490, 0, 0, 1, [-125.3, -156, -131.4, -141.8, -134.3, -127.9]],
  ];
  // the outlines (x, z, …) and their triangles (three indices each): the yard w265528119, the hall w88611304, the carport w88611285
  const YARD = [-339.3, -73.6, -355.7, -71.2, -369.5, -63.3, -382.3, -50.3, -385.5, -45, -371.2, -20.4, -365.5, -14.6, -353.6, -14.9, -306.5, -24.3, -271.8, -37.3, -274.4, -46.9, -277.8, -53.7, -270.3, -63.3, -271, -65.7, -271.6, -68.1, -291.5, -67.3, -305.3, -68.4], YARD_T = [15, 14, 13, 15, 13, 12, 16, 15, 12, 16, 12, 11, 0, 16, 11, 0, 11, 10, 0, 10, 9, 0, 9, 8, 0, 8, 7, 0, 7, 6, 0, 6, 5, 0, 5, 4, 0, 4, 3, 0, 3, 2, 2, 1, 0];
  const HALL = [-61.8, -73.5, -50.3, -47.5, -62.6, -42.1, -68.4, -55.2, -64.6, -56.8, -67.5, -63.4, -81, -57.5, -83.8, -63.8], HALL_T = [0, 1, 2, 2, 3, 4, 0, 2, 4, 0, 4, 5, 7, 0, 5, 5, 6, 7];
  const PORT = [-105.7, -3.6, -104.7, -2.6, -106.7, -0.7, -102.6, 3.7, -100.7, 1.9, -93.8, -4.6, -98.9, -10], PORT_T = [0, 6, 5, 4, 3, 2, 5, 4, 2, 5, 2, 1, 5, 1, 0];
  const GATE = [[28.9, 26.4, -29.9, 14.6], [-145.5, -280.9, -42.9, 87.2]];   // n1028976635 on w88611296 (inside the lap's barriers: not drawn), n458892242 on w38715379: x, z, its way's direction
  const OLD = [[-100.7, -3.1], [-67, -55.7]];   // the middles of the circuit's own boxes for the carport and the hall (def.sk.bld), which the outlines stand in for
  const HW = [1.8, 0.9, 0.9], LIFT = [0.03, 0.036, 0.042], GRAVEL = [1.485, 1.406, 1.247], ASPHALT = [0.95, 0.95, 0.97], GALV = [0.62, 0.64, 0.66];
  const FADE = 6, STEP = 3.5, EPS = 1e-9, VERGE = 2.9;   // (VERGE: a ribbon ends 0.3 m under the outer edge of the lap's verge)

  const pts = (f) => { const P = []; for (let k = 0; k + 1 < f.length; k += 2) P.push([f[k], f[k + 1]]); return P; };
  const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  // --- a flat piece laid on the terrain's own triangles (the mesh has two per 8 m cell: nrGround) ---
  function cut(P, f) {   // both sides of the line f = 0 (a point on it goes to both); a crossing is always worked out from the same end, so neighbours share it bit for bit
    const A = [], B = [];
    for (let k = 0; k < P.length; k++) {
      const p = P[k], q = P[(k + 1) % P.length], fp = f(p), fq = f(q);
      if (fp <= EPS) A.push(p);
      if (fp >= -EPS) B.push(p);
      if ((fp < -EPS && fq > EPS) || (fp > EPS && fq < -EPS)) {
        const sw = p[0] > q[0] || (p[0] === q[0] && p[1] > q[1]), a = sw ? q : p, b = sw ? p : q, fa = sw ? fq : fp, fb = sw ? fp : fq, t = fa / (fa - fb);
        const m = a.map((v, i) => v + (b[i] - v) * t); A.push(m); B.push(m);
      }
    }
    return [A, B];
  }
  function fan(D, P, lift) {   // one part inside one of the terrain's triangles: a fan, lift over the ground (slivers skipped)
    if (P.length < 3) return;
    const V = P.map(p => [p[0], nrGround(p[0], p[1]) + lift, p[1]]), UV = P.map(p => [p[0] / 8, -p[1] / 8]), CL = P.map(p => [p[2], p[3], p[4]]);
    for (let k = 1; k + 1 < P.length; k++) {
      const a2 = (P[k][0] - P[0][0]) * (P[k + 1][1] - P[0][1]) - (P[k][1] - P[0][1]) * (P[k + 1][0] - P[0][0]);
      if (Math.abs(a2) < 2e-6) continue;
      D.g.triUp(V[0], V[k], V[k + 1], [CL[0], CL[k], CL[k + 1]], [UV[0], UV[k], UV[k + 1]]); D.n++;
    }
  }
  function drape(D, P, lift) {   // P: convex, its points [x, z, r, g, b]; by the terrain's columns, then its cells, then each cell's diagonal
    const G = D.G, C = API.NRC || 8; let x0 = 1e9, x1 = -1e9; for (const p of P) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); }
    let rest = P;
    for (let i = Math.floor((x0 - G.x0) / C); rest.length >= 3; i++) {
      const X = G.x0 + C * (i + 1); let col;
      if (X >= x1) { col = rest; rest = []; } else [col, rest] = cut(rest, p => p[0] - X);
      if (col.length < 3) continue;
      let z0 = 1e9, z1 = -1e9; for (const p of col) { z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
      let restZ = col;
      for (let j = Math.floor((z0 - G.z0) / C); restZ.length >= 3; j++) {
        const Z = G.z0 + C * (j + 1); let cell;
        if (Z >= z1) { cell = restZ; restZ = []; } else [cell, restZ] = cut(restZ, p => p[1] - Z);
        if (cell.length < 3) continue;
        const S = G.x0 + G.z0 + C * (i + j + 1);
        for (const part of cut(cell, p => p[0] + p[1] - S)) fan(D, part, lift);
      }
    }
  }
  function quad(D, Q, lift) {   // a ribbon's quad: convex in one piece, otherwise along the diagonal through its reflex corner
    const cr = (k) => { const a = Q[(k + 3) % 4], b = Q[k], c = Q[(k + 1) % 4]; return (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]); };
    const s = [cr(0), cr(1), cr(2), cr(3)], pos = s.filter(v => v > 1e-9).length, neg = s.filter(v => v < -1e-9).length;
    if (!pos || !neg) { drape(D, Q, lift); return; }
    const k = s.findIndex(v => (pos < neg ? v > 1e-9 : v < -1e-9));
    if (k === 1 || k === 3) { drape(D, [Q[0], Q[1], Q[3]], lift); drape(D, [Q[1], Q[2], Q[3]], lift); }
    else { drape(D, [Q[0], Q[1], Q[2]], lift); drape(D, [Q[0], Q[2], Q[3]], lift); }
  }
  function sections(P, hw) {   // a way's cross sections: mitred at its bends, every STEP m between them
    const n = P.length, seg = [], cum = [0];
    for (let k = 0; k + 1 < n; k++) { const dx = P[k + 1][0] - P[k][0], dz = P[k + 1][1] - P[k][1], l = Math.hypot(dx, dz) || 1e-6; seg.push({ l, nx: -dz / l, nz: dx / l }); cum.push(cum[k] + l); }
    const J = [];
    for (let k = 0; k < n; k++) {
      const a = seg[Math.max(0, k - 1)], b = seg[Math.min(n - 2, k)]; let nx = a.nx + b.nx, nz = a.nz + b.nz; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
      const c0 = Math.max(0.625, nx * a.nx + nz * a.nz);
      J.push({ nx, nz, w: hw / c0, back: hw * Math.sqrt(Math.max(0, 1 - c0 * c0)) / c0 });
    }
    const S = [], put = (u, x, z, nx, nz, w) => S.push({ u, c: [x, z], a: [x + nx * w, z + nz * w], b: [x - nx * w, z - nz * w] });
    for (let k = 0; k < n; k++) {
      put(cum[k], P[k][0], P[k][1], J[k].nx, J[k].nz, J[k].w);
      if (k === n - 1) break;
      const s = seg[k], m = Math.max(1, Math.ceil(s.l / STEP));
      for (let q = 1; q < m; q++) {
        const d = s.l * q / m; if (d < J[k].back + 0.2 || d > s.l - J[k + 1].back - 0.2) continue;
        const t = d / s.l; put(cum[k] + d, P[k][0] + (P[k + 1][0] - P[k][0]) * t, P[k][1] + (P[k + 1][1] - P[k][1]) * t, s.nx, s.nz, hw);
      }
    }
    return { S, U: cum[n - 1] };
  }
  function prism(g, P, T, y0, y1, wc, tc, uc) {   // an outline's walls (outward), its top and, if asked, its underside
    let A = 0; for (let k = 0; k < P.length; k++) { const a = P[k], b = P[(k + 1) % P.length]; A += a[0] * b[1] - b[0] * a[1]; }
    const sg = A > 0 ? 1 : -1;
    for (let k = 0; k < P.length; k++) {
      const a = P[k], b = P[(k + 1) % P.length], el = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = sg * (b[1] - a[1]) / el, nz = -sg * (b[0] - a[0]) / el;
      g.quadO([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], wc, [(a[0] + b[0]) / 2 - nx, (y0 + y1) / 2, (a[1] + b[1]) / 2 - nz]);
    }
    for (let k = 0; k + 2 < T.length; k += 3) {
      const a = P[T[k]], b = P[T[k + 1]], c = P[T[k + 2]];
      g.triUp([a[0], y1, a[1]], [b[0], y1, b[1]], [c[0], y1, c[1]], [tc, tc, tc]);
      if (uc) g.triO([a[0], y0, a[1]], [b[0], y0, b[1]], [c[0], y0, c[1]], uc, [a[0], y0 + 5, a[1]]);
    }
  }

  const prev = lk.extra;
  lk.extra = (o) => {
    // the circuit's own part first, without its boxes for the two buildings drawn by their outlines here (their keep-off circles stay)
    let off = null, hit = 0;
    const scen = Object.assign(Object.create(o.scen), { get(x, z) {
      for (const b of OLD) if (Math.abs(x - b[0]) < 0.05 && Math.abs(z - b[1]) < 0.05) { hit++; return off || (off = new GB()); }
      return o.scen.get(x, z); } });
    const st = prev(Object.assign({}, o, { scen })) || {};
    st.osmSwapped = hit;

    const within = (x, z, m) => { const q = nrNear(x, z); return q.i >= 0 && q.dd < m; };
    const inside = (x, z) => within(x, z, 0.25);   // within the lap's barriers
    const onLap = (x, z) => within(x, z, VERGE);   // on the lap's own ground: its barriers and the grass verge beyond them (rbVerge), which would lie over a ribbon
    const keep = (x, z, r) => { o.exclPush(x, z, r); if (nrDist(x, z) < 60) o.CR.avoid(x, z, r); };   // no trees, no spectators
    const yard = pts(YARD), RW = [];   // the raceways' segments with the radius inside which a ribbon ends (1 m inside the raceway's edge)
    for (const [sf, f] of ((API.T.def.sk || {}).race || [])) { const r = (sf === 5 ? 4.5 : 4.1) - 1; for (let k = 0; k + 3 < f.length; k += 2) RW.push([f[k], f[k + 1], f[k + 2], f[k + 3], r]); }
    const onRace = (x, z) => {
      for (const [ax, az, bx, bz, r] of RW) { const dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1); if ((x - ax - dx * t) ** 2 + (z - az - dz * t) ** 2 < r * r) return true; }
      return false;
    };
    const free = (x, z) => !onRace(x, z) && !(inPoly(yard, x, z) && polyDist(yard, x, z) > 1);
    const D = { g: new GB(true), G: API.NR.G, n: 0 };

    // --- the roads and the footpaths ---
    const pull = (c, e) => {   // an edge point on the lap's ground pulled toward the middle; the fraction of the half width left
      if (!onLap(e[0], e[1])) return 1;
      let lo = 0, hi = 1;
      for (let k = 0; k < 7; k++) { const t = (lo + hi) / 2; if (onLap(c[0] + (e[0] - c[0]) * t, c[1] + (e[1] - c[1]) * t)) hi = t; else lo = t; }
      e[0] = c[0] + (e[0] - c[0]) * lo; e[1] = c[1] + (e[1] - c[1]) * lo; return lo;
    };
    const edge = (g, b) => {   // the last good section between a good one and a bad one (toward the bad one's own points)
      const at = (t) => ({ u: g.u + (b.u - g.u) * t, c: lerp2(g.c, b.c, t), a: lerp2(g.a, b.a0, t), b: lerp2(g.b, b.b0, t) });
      const fine = (s) => !onLap(s.c[0], s.c[1]) && !onLap(s.a[0], s.a[1]) && !onLap(s.b[0], s.b[1]) && free(s.c[0], s.c[1]);
      let lo = 0, hi = 1;
      for (let k = 0; k < 7; k++) { const t = (lo + hi) / 2; if (fine(at(t))) lo = t; else hi = t; }
      return lo > 0.02 ? at(lo) : null;
    };
    let runs = 0, metres = 0;
    for (const [, kind, f0, f1, flat] of WAYS) {
      const hw = HW[kind], base = kind === 2 ? ASPHALT : GRAVEL, { S, U } = sections(pts(flat), hw);
      for (const s of S) {
        s.a0 = s.a.slice(); s.b0 = s.b.slice();
        s.ok = !onLap(s.c[0], s.c[1]) && free(s.c[0], s.c[1]) && pull(s.c, s.a) + pull(s.c, s.b) >= 1;
      }
      const vtx = (p, u) => {   // a cut end fades into the ground's own colour over its last FADE m
        const w = clamp(Math.max(f0 ? 1 - u / FADE : 0, f1 ? 1 - (U - u) / FADE : 0), 0, 1);
        if (w <= 0) return [p[0], p[1], base[0], base[1], base[2]];
        const gc = nrGCol(p[0], p[1]), t = w * w * (3 - 2 * w);
        return [p[0], p[1], base[0] + (gc[0] * 1.2 - base[0]) * t, base[1] + (gc[1] * 1.2 - base[1]) * t, base[2] + (gc[2] * 1.2 - base[2]) * t];
      };
      let run = [];
      const flush = () => {
        if (run.length > 1 && run[run.length - 1].u - run[0].u >= 3) {
          for (let k = 0; k + 1 < run.length; k++) { const p = run[k], q = run[k + 1]; quad(D, [vtx(p.a, p.u), vtx(q.a, q.u), vtx(q.b, q.u), vtx(p.b, p.u)], LIFT[kind]); }
          for (const s of run) keep(s.c[0], s.c[1], Math.max(hw + 1.5, 2.4));
          runs++; metres += run[run.length - 1].u - run[0].u;
        }
        run = [];
      };
      for (let k = 0; k < S.length; k++) {
        const s = S[k], p = k ? S[k - 1] : null;
        if (s.ok) { if (p && !p.ok) { const e = edge(s, p); if (e) run.push(e); } run.push(s); }
        else { if (p && p.ok) { const e = edge(p, s); if (e) run.push(e); } flush(); }
      }
      flush();
    }
    st.osmRuns = runs; st.osmMetres = Math.round(metres);

    // --- the service yard ---
    const n0 = D.n;
    for (let k = 0; k + 2 < YARD_T.length; k += 3) drape(D, [YARD_T[k], YARD_T[k + 1], YARD_T[k + 2]].map(i => [yard[i][0], yard[i][1], GRAVEL[0], GRAVEL[1], GRAVEL[2]]), LIFT[0]);
    st.osmYard = D.n - n0;
    {
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of yard) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
      for (let x = x0; x <= x1; x += 4) for (let z = z0; z <= z1; z += 4) if (inPoly(yard, x, z)) keep(x, z, 3);
      for (let k = 0; k < yard.length; k++) {
        const a = yard[k], b = yard[(k + 1) % yard.length], m = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4));
        for (let q = 0; q < m; q++) keep(a[0] + (b[0] - a[0]) * q / m, a[1] + (b[1] - a[1]) * q / m, 2);
      }
    }
    st.osmTris = D.n;
    if (!D.g.empty) {
      const m = new THREE.Mesh(D.g.geometry(), new THREE.MeshLambertMaterial({ map: o.tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
      m.receiveShadow = true; m.matrixAutoUpdate = false; m.name = 'osmWays'; o.root.add(m);
    }

    // --- the gate: five bars between two posts, closed across the road ---
    const rod = API.ouRod; st.osmGates = 0;
    if (rod) for (const [x, z, dx, dz] of GATE) {
      if (inside(x, z)) continue;
      const l = Math.hypot(dx, dz), px = -dz / l, pz = dx / l, W = 2, g = o.scen.get(x, z);
      const ya = nrGround(x - px * W, z - pz * W), yb = nrGround(x + px * W, z + pz * W), Y = (t) => ya + (yb - ya) * (t + W) / (2 * W), at = (t, h) => [x + px * t, Y(t) + h, z + pz * t];
      for (const t of [-W - 0.07, W + 0.07]) box(g, x + px * t, Y(t) - 0.2, z + pz * t, 0.12, 1.55, 0.12, Math.atan2(pz, px), GALV, GALV, true);
      for (const h of [0.22, 0.45, 0.68, 0.91, 1.14]) rod(g, at(-W, h), at(W, h), 0.025, GALV, 4);
      for (const t of [-W, 0, W]) rod(g, at(t, 0.22), at(t, 1.14), 0.025, GALV, 4);
      rod(g, at(-W, 0.22), at(W, 1.14), 0.02, GALV, 4);
      keep(x, z, W + 1); st.osmGates++;
    }

    // --- the hall: its outline, one level under a flat roof, in the circuit's own colours for a hall ---
    {
      const P = pts(HALL), g = o.scen.get(OLD[1][0], OLD[1][1]); let lo = 1e9, hi = -1e9;
      for (const p of P) { const y = nrGround(p[0], p[1]); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      prism(g, P, HALL_T, lo - 0.4, hi + 4.5, [0.55, 0.6, 0.57], [0.4, 0.43, 0.42]);
    }
    // --- the carport: its roof's outline on posts ---
    {
      const P = pts(PORT), g = o.scen.get(OLD[0][0], OLD[0][1]), RT = [0.62, 0.64, 0.66], RU = [0.42, 0.43, 0.45], PC = [0.5, 0.52, 0.54]; let hi = -1e9, mx = 0, mz = 0;
      for (const p of P) { hi = Math.max(hi, nrGround(p[0], p[1])); mx += p[0] / P.length; mz += p[1] / P.length; }
      const yu = hi + 2.6, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      prism(g, P, PORT_T, yu, yu + 0.25, RT, RT, RU);
      for (const p of [P[0], P[2], P[3], P[5], P[6], mid(P[3], P[5]), mid(P[6], P[0])]) {   // a post in from each outer corner and from the middles of the two long sides
        const dl = Math.hypot(mx - p[0], mz - p[1]) || 1, x = p[0] + (mx - p[0]) / dl * 0.45, z = p[1] + (mz - p[1]) / dl * 0.45, y = nrGround(x, z);
        if (inPoly(P, x, z)) box(g, x, y - 0.2, z, 0.14, yu - y + 0.2, 0.14, 0, PC, PC, true);
      }
    }
    return st;
  };
})();
