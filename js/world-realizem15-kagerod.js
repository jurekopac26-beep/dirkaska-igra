// WORLD — realizem 15: Kågeröd, Švedska (docs/realizem.md, »Postopek za vse proge«)
// What OpenStreetMap maps beside the lap and the circuit's own world (js/world-kagerod.js: the Vege å with its culverts and alders, the
// five buildings, the woods) does not draw: the circuit's service roads and one track. Of their 2.0 km within 66 m of the lap 1.5 km
// are drawn: the rest lies on the lap's own ground (its gravel traps, its barriers and the verge beyond them) or in the pit complex.
//   highway=service (the road on the far bank of the Vege å, the paddock's road outside the lap, the links across the infield and
//     those outside the lap; none of them has a surface in OSM): as pale gravel
//   highway=track (one short piece, no surface in OSM either): as earth
// Every way is cut 66 m from the lap (there it fades into the ground, as it does at a dead end and where it carries on as a way that is
// not drawn), at the lap's own ground (its barriers and the verge beyond them), at the pit complex and the stands of the shared builder
// and at the circuit's buildings. By the Vege å a ribbon keeps off the river's banks, which js/world-kagerod.js draws 5.2 m to each
// side of its middle line: the road on the far bank, 6 to 13 m from that line in OSM, is narrower for the few metres where the two meet.
// The ribbons are draped on the terrain's own triangles into one mesh (one draw call), the service roads over the track. Their ground is
// kept clear before the builder sets up its own furniture and this circuit's world its alders, so what would stand on a way is not set
// up (one marshal post, one camera tower, three photographers, eight of the thirty alders); no trees and no spectators on it either.
// Assumed and said so in the pull request (OSM has neither a width nor a surface on any of the ways drawn): the width
// (3.6 m), the colours, the pale gravel of the untagged service roads, the earth of the untagged track.
// Not drawn, said in the pull request: the tunnel under the lap (way 401177319: the ground is not cut; of its two approaches the outer, way
// 401177309, ends at the lap's verge, and the inner, way 401177315, the only way here with a surface in OSM, asphalt, is 11 m long and
// would be a lone patch in the infield's grass), the paddock's asphalt (the area 401177325, 46 m from the lap at the nearest: the
// land cover colours it), the perimeter fence (way 401177299, 30 m from the lap at the nearest: OSM itself marks its course in the
// woods as uncertain), the four gates (118 m and more from the lap), what the cut leaves shorter than 12 m (of ways 401177314,
// 401177321 and 401177322), the two links that lie from end to end on the lap's own ground or in the pit complex (ways 401177328 and
// 401177329) and everything beyond 66 m. Not drawn again: the lap and the pit lane (the builder's own).
// Realizem E (#779) gives this circuit thirteen side roads (`stranske`): the first 64 m from the lap of seven of these ways. With them
// (the builder then passes naCesti) no ribbon is drawn where a side road lies: where a way carries on beyond a side road's faded end
// its ribbon fades in over the same 6 m, at a side road's flank it ends square. Without them (main today) the whole ways are drawn
// here: no double drawing, whichever lands first.
// No names anywhere: only OSM's way numbers. Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«), the extract of
// 21. 11. 2026; x east and z south of the middle of the start line, in metres.
// Hooked by wrapping two of the look's hooks (API.rbLook.kagerod): build, which the shared builder (js/world-rbring.js) calls before its
// own furniture (the ways' ground is kept clear there), and extra, which it calls with the scenery's chunks before its crowds and
// trees (the ribbons are drawn there). Loaded right after the circuit's own world (js/world-kagerod.js) and before the builder.
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, lk = API.rbLook && API.rbLook.kagerod;
  if (!lk || !lk.extra) return;
  const { GB, clamp, nrGround, nrGCol, nrDist, nrNear } = API;

  // [OSM way, kind, fades at its start, fades at its end, [x, z, ...]]; kinds: 0 service road, 1 track (neither with a surface
  // in OSM)
  const WAYS = [
    [401177306, 0, 0, 1, [-239.4, -327.3, -254.7, -323.7, -264.3, -322.6, -279.0, -322.4]],
    [401177306, 0, 1, 0, [-298.5, -317.5, -298.4, -304.4, -268.8, -305.2, -264.6, -304.0, -259.9, -301.0, -255.3, -291.2]],
    [401177309, 0, 0, 1, [-227.1, -279.4, -225.6, -316.4, -224.0, -331.8, -223.7, -333.5]],
    [401177313, 0, 1, 0, [-107.7, -36.6, -70.2, -8.8, -28.0, 21.6, 22.3, 60.1, 35.6, 69.2, 90.8, 90.4, 117.9, 103.6, 129.0, 107.3, 159.8, 115.6, 179.4, 122.8, 210.5, 129.5, 230.6, 138.2, 243.2, 144.2, 250.0, 145.5, 258.2, 143.8, 271.8, 139.1]],
    [401177316, 0, 0, 1, [356.4, 150.3, 411.2, 183.1]],
    [401177320, 0, 1, 1, [-237.1, -332.3, -239.4, -327.3, -242.0, -309.8, -245.2, -302.2, -249.6, -297.4, -255.3, -291.2, -259.0, -284.5, -268.8, -256.9, -284.6, -228.1, -285.9, -222.7, -284.9, -216.4, -283.2, -210.4, -281.1, -205.8, -277.2, -201.5, -241.7, -179.9]],
    [401177322, 0, 1, 0, [103.5, -126.0, 103.4, -124.1, 101.5, -120.4, 97.0, -116.4, 91.7, -114.3, 85.8, -114.3, 79.1, -116.4, 72.2, -121.3, 19.3, -167.4, -118.6, -255.6, -139.0, -266.1, -160.6, -275.5, -195.0, -290.7, -198.8, -293.5, -202.0, -296.8, -204.3, -301.7, -205.3, -307.7, -204.5, -313.0, -202.5, -318.1, -198.5, -324.4]],
    [401177330, 0, 0, 0, [158.3, 27.3, 176.7, -10.3, 198.7, -55.3, 202.3, -58.8, 214.0, -65.4]],
    [401177332, 0, 0, 0, [372.8, 102.7, 352.9, 117.7, 347.4, 125.0, 331.0, 150.9, 309.9, 183.0, 304.4, 187.8, 295.5, 196.6]],
    [401177334, 0, 0, 0, [176.7, -10.3, 166.4, -7.0, 156.0, -5.6, 147.0, -6.8, 139.0, -10.7, 132.8, -15.3, 123.1, -23.2]],
    [401177335, 0, 0, 0, [210.8, 33.5, 221.0, 36.6, 234.9, 51.5, 242.1, 55.8, 253.8, 59.5, 273.2, 61.9, 284.5, 61.0, 361.6, 42.6]],
    [401177336, 1, 1, 1, [169.8, -116.8, 167.2, -111.6, 163.1, -108.6, 159.0, -107.6, 154.4, -107.6, 150.2, -108.8]],
    [401177337, 0, 0, 1, [270.3, 120.5, 282.2, 127.0, 284.8, 127.6, 287.9, 127.5, 291.0, 125.8, 294.9, 120.0, 297.2, 111.8, 297.2, 102.7]],
    [401177338, 0, 0, 0, [141.0, 17.8, 123.1, -23.2, 85.2, -82.8, 76.9, -90.7, 68.5, -96.8, 62.6, -98.0, 56.8, -97.8, 43.7, -94.8]]
  ];
  const GRAVEL = [1.485, 1.406, 1.247], EARTH = [1.3, 1.1, 0.82];
  const HW = [1.8, 1.8], COL = [GRAVEL, EARTH], LIFT = [0.051, 0.044];   // (half widths, colours over the asphalt's texture, m above the ground: a service road would lie over a track)
  const FADE = 6, STEP = 3.5, EPS = 1e-9, VERGE = 2.9, BANK = 5.5;   // (VERGE: a ribbon ends 0.3 m under the outer edge of the lap's verge; BANK: and 0.3 m short of the river's banks)

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

  // every way's runs: what is free of the lap's ground, the river's banks, the buildings, the pit complex and the stands, and (side) of
  // Realizem E's side roads
  const runs = (T, side) => {
    const def = T.def, sk = def.sk || {};
    const within = (x, z, m) => { const q = nrNear(x, z); return q.i >= 0 && q.dd < m; };
    const rv = sk.river || [];
    const river = (x, z) => {   // m from the middle line of the Vege å
      let best = 1e9;
      for (let k = 0; k + 3 < rv.length; k += 2) {
        const ax = rv[k], az = rv[k + 1], dx = rv[k + 2] - ax, dz = rv[k + 3] - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1);
        best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
      }
      return best;
    };
    // not a ribbon's ground: the lap's own (its barriers and the grass verge beyond them, rbVerge) and the banks of the Vege å
    const taken = (x, z) => within(x, z, VERGE) || river(x, z) < BANK;
    const onSide = (x, z) => !!side && side(x, z);
    // what stands in a way's way: the circuit's buildings (0.6 m around each), the builder's pit complex and stands, Realizem E's side roads
    const bld = [], b6 = sk.bld || [], zones = [];
    for (let k = 0; k + 5 < b6.length; k += 6) { const r = b6[k + 4] * Math.PI / 180; bld.push([b6[k], b6[k + 1], b6[k + 2] / 2 + 0.6, b6[k + 3] / 2 + 0.6, Math.cos(r), Math.sin(r)]); }
    if (lk.pitBox) zones.push([lk.pitBox[0] - 22, lk.pitBox[1] + 22, lk.pitBox[2], 29]);   // [from, to (m from the start line), side, m beyond the barrier]: the apron and the garages
    for (const [a, b, sd, rows] of def.stands || []) zones.push([a - 3, b + 3, sd, rows * 0.95 + 6]);
    const free = (x, z) => {
      for (const b of bld) { const dx = x - b[0], dz = z - b[1]; if (Math.abs(dx * b[4] + dz * b[5]) < b[2] && Math.abs(dz * b[4] - dx * b[5]) < b[3]) return false; }
      if (onSide(x, z)) return false;
      const q = nrNear(x, z); if (q.i < 0 || !zones.length) return true;
      const L = T.len, sd = q.lat < 0 ? -1 : 1, dd = q.dd; let s = q.i * T.ds - T.startS; s = ((s % L) + L) % L;
      for (const [a, b, zs, dep] of zones) if (sd === zs && dd < dep && ((s >= a && s <= b) || (s - L >= a && s - L <= b))) return false;
      return true;
    };
    const pull = (c, e) => {   // an edge point on taken ground pulled toward the middle; the fraction of the half width left
      if (!taken(e[0], e[1])) return 1;
      let lo = 0, hi = 1;
      for (let k = 0; k < 7; k++) { const t = (lo + hi) / 2; if (taken(c[0] + (e[0] - c[0]) * t, c[1] + (e[1] - c[1]) * t)) hi = t; else lo = t; }
      e[0] = c[0] + (e[0] - c[0]) * lo; e[1] = c[1] + (e[1] - c[1]) * lo; return lo;
    };
    const clear = (s) => !taken(s.c[0], s.c[1]) && free(s.c[0], s.c[1]);
    const edge = (g, b) => {   // the last good section between a good one and a bad one
      const at = (t) => ({ u: g.u + (b.u - g.u) * t, c: lerp2(g.c, b.c, t), a: lerp2(g.a, b.a0, t), b: lerp2(g.b, b.b0, t) });
      const fine = (s) => clear(s) && !taken(s.a[0], s.a[1]) && !taken(s.b[0], s.b[1]);
      let lo = 0, hi = 1;
      for (let k = 0; k < 7; k++) { const t = (lo + hi) / 2; if (fine(at(t))) lo = t; else hi = t; }
      return lo > 0.02 ? at(lo) : null;
    };
    // where Realizem E's side roads fade into the ground (the ends that do not meet another side road): a ribbon that carries on from there fades in
    const ends = (def.stranske || []).filter(r => !r[5]).map(r => r[6].slice(-2));
    const fading = (s) => ends.some(([x, z]) => Math.hypot(s.c[0] - x, s.c[1] - z) < 4.5);
    const all = [];
    for (const [, kind, f0, f1, flat] of WAYS) {
      const hw = HW[kind], { S, U } = sections(pts(flat), hw);
      for (const s of S) {
        s.a0 = s.a.slice(); s.b0 = s.b.slice();
        const left = pull(s.c, s.a) + pull(s.c, s.b);
        s.ok = left >= 1 && clear(s);
      }
      let run = [], fa = false;
      const flush = (fb) => {   // (fa, fb: the run's start and its end fade into the ground)
        const n = run.length;
        if (n > 1 && run[n - 1].u - run[0].u >= 3) all.push({ kind, run, fa: fa || (!!f0 && run[0].u < 0.5), fb: fb || (!!f1 && U - run[n - 1].u < 0.5) });
        run = []; fa = false;
      };
      for (let k = 0; k < S.length; k++) {
        const s = S[k], p = k ? S[k - 1] : null;
        if (s.ok) {
          if (p && !p.ok) { const e = edge(s, p); if (e) run.push(e); run.push(s); fa = onSide(p.c[0], p.c[1]) && fading(run[0]); }
          else run.push(s);
        } else if (p && p.ok) { const e = edge(p, s); if (e) run.push(e); flush(onSide(s.c[0], s.c[1]) && fading(run[run.length - 1])); }
      }
      flush(false);
    }
    return all.sort((a, b) => LIFT[a.kind] - LIFT[b.kind]);   // (the track first, so a service road would lie over it)
  };
  // LK.build, which the builder calls before it sets up its own furniture (the marshal posts, the camera towers, the stalls) and before LK.extra,
  // where this world plants its alders: the ways' ground is kept clear here, so all of those, the spectators and the trees stay off it
  const built = lk.build;
  lk.build = (b) => {
    if (built) built(b);
    for (const { kind, run } of runs(b.T, null)) for (const s of run) { const x = s.c[0], z = s.c[1], r = Math.max(HW[kind] + 1.5, 2.4); b.exclPush(x, z, r); if (nrDist(x, z) < 60) b.CR.avoid(x, z, r); }
  };
  // LK.extra: the ribbons (on a side road of Realizem E, 1.8 m inside the builder's keep-off circles, which is its own surface, none)
  const prev = lk.extra;
  lk.extra = (o) => {
    const st = prev(o) || {}, all = runs(API.T, o.naCesti ? (x, z) => o.naCesti(x, z, -1.8) : null);
    const D = { g: new GB(true), G: API.NR.G, n: 0 };   // (all the ribbons in one mesh)
    let metres = 0;
    for (const { kind, run, fa, fb } of all) {
      const base = COL[kind], u0 = run[0].u, u1 = run[run.length - 1].u;
      const vtx = (p, u) => {   // a fading end takes the ground's own colour over its last FADE m
        const w = clamp(Math.max(fa ? 1 - (u - u0) / FADE : 0, fb ? 1 - (u1 - u) / FADE : 0), 0, 1);
        if (w <= 0) return [p[0], p[1], base[0], base[1], base[2]];
        const gc = nrGCol(p[0], p[1]), t = w * w * (3 - 2 * w);
        return [p[0], p[1], base[0] + (gc[0] * 1.2 - base[0]) * t, base[1] + (gc[1] * 1.2 - base[1]) * t, base[2] + (gc[2] * 1.2 - base[2]) * t];
      };
      for (let k = 0; k + 1 < run.length; k++) { const p = run[k], q = run[k + 1]; quad(D, [vtx(p.a, p.u), vtx(q.a, q.u), vtx(q.b, q.u), vtx(p.b, p.u)], LIFT[kind]); }
      metres += u1 - u0;
    }
    st.osmRuns = all.length; st.osmMetres = Math.round(metres); st.osmTris = D.n;
    if (!D.g.empty) {
      const m = new THREE.Mesh(D.g.geometry(), new THREE.MeshLambertMaterial({ map: o.tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
      m.receiveShadow = true; m.matrixAutoUpdate = false; m.name = 'osmWays'; o.root.add(m);
    }
    return st;
  };
})();
