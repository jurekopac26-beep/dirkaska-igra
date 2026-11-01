// NEW VERSION · TEST 1: the course for jet skis and boats where the go-kart track was (the new map's step 9; the user on the pictures,
// 27.-30. 10.: "Proga naj gre tako, kot je šla prej gokart steza", then "široka proga s plažami, plaža F · družinska plaža"). The water
// 22 m wide along the go-kart's line (H3.kartPts: its figure eight), a shallow shelf by the banks, family beaches on both banks (umbrellas,
// loungers, volleyball nets, coloured cabins; inflatable rings in the water), three lines of red-white floats, buoys at the bends (red
// inside, yellow outside), a start of chequered floats with two flags, jet skis on the grid and out on the course, a boat; a canal from
// its east end under the ring road (a humped bridge, the road 2.4 m up) to the sea; HOME's way over the water on a wooden bridge
// (1.7 m up, ramps of 8 m) and HOME's pier with two jet skis. The ground there is folded away and drawn anew as one height field (the
// beach, the banks, the bed under the water; the meadow round it the one meadow), the water one surface at the sea's level.
// js/newmap.js hub4G (H3.BOAT): plan() where the go-kart track was planned (no go-kart track, no practice lot, no big lot: they lay
// where the water and the beaches are now), lifts() before the roads are built (the two bridges are ground: H3.crests, so the ring road,
// HOME's way and the car follow them), build() after the rest of the map, before the still meshes are merged (js/nvbake.js).
// Loaded with the new map (js/game.js nvStart).
const NVBoat = (function () {
  'use strict';
  const HW = 11, BEACH = 8, CW = 6, CBEACH = 3;   // (m: the course's half width and its beaches; the canal's half width and its sand)
  const ZF = 9.2, ZM = 10.6;   // (what lay there is folded where the water is nearer than ZF; the ground drawn anew to ZM: it overlaps the meadow round it)
  const NORTH = 168.2, NFOLD = 171.5;   // (not further north: the parking bays along the main straight and the fence behind them stay)
  const HB = 1.7, HR = 8, HWH = 3.4;   // (HOME's wooden bridge: its deck over the water, its ramps, its half width)
  const RB = 2.4, RS = 8, RR = 22, RWALL = 6.8;   // (the ring road's humped bridge: its height, its flat top's half length, its ramps, its walls' offset)
  // the canal: from the course's east end across to the ring road, under it (square to it) and north-east to the sea
  const CANAL = [[108, 221], [122, 220.6], [135, 219], [145.5, 210.3], [152.5, 203.2], [160, 195.6], [167.5, 188], [175, 180.4], [182, 173.3], [192, 164]];
  const UC = [0xd8282a, 0x2a5ab8, 0xf2c12e, 0x3fbf6a, 0xff7a1a], JC = [0xd8282a, 0xf2c12e, 0x2a5ab8, 0x3fbf6a, 0xff7a1a, 0xf4f4f0];
  const sst = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;
  const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
  let P = null;   // (the plan: the course's and the canal's lines, the water's edge; the bridges)

  // a CatmullRom line through pts (as js/newmap.js draws its roads: centripetal) every ~step m: { P: [[x, z]], A: arc lengths, L }
  function sample(pts, closed, step) { const cv = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), closed, 'centripetal'), n = Math.max(8, Math.round(cv.getLength() / step)), Q = [], A = [0];
    for (let i = 0; i <= n; i++) { const q = cv.getPointAt(i / n); Q.push([q.x, q.z]); if (i) A.push(A[i - 1] + Math.hypot(q.x - Q[i - 1][0], q.z - Q[i - 1][1])); } return { P: Q, A, L: A[n] }; }
  // the nearest point of a sampled line, for points up to R m from it (its segments in cells of 8 m): (x, z) => { d, s, i }; d 1e9 further
  function nearIndex(S, R) { const C = 8, Q = S.P, A = S.A; let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const [x, z] of Q) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    x0 -= R + C; z0 -= R + C; const nx = Math.ceil((x1 + R + C - x0) / C), nz = Math.ceil((z1 + R + C - z0) / C), cells = Array.from({ length: nx * nz }, () => []);
    for (let i = 1; i < Q.length; i++) { const [ax, az] = Q[i - 1], [bx, bz] = Q[i], i0 = Math.max(0, Math.floor((Math.min(ax, bx) - R - x0) / C)), i1 = Math.min(nx - 1, Math.floor((Math.max(ax, bx) + R - x0) / C)), j0 = Math.max(0, Math.floor((Math.min(az, bz) - R - z0) / C)), j1 = Math.min(nz - 1, Math.floor((Math.max(az, bz) + R - z0) / C));
      for (let a = i0; a <= i1; a++) for (let b = j0; b <= j1; b++) cells[a * nz + b].push(i); }
    const r = { d: 1e9, s: 0, i: -1 };
    return (x, z) => { const a = Math.floor((x - x0) / C), b = Math.floor((z - z0) / C); r.d = 1e9; r.s = 0; r.i = -1; if (a < 0 || b < 0 || a >= nx || b >= nz) return r;
      for (const i of cells[a * nz + b]) { const [ax, az] = Q[i - 1], [bx, bz] = Q[i], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1e-9, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)), e = Math.hypot(x - ax - dx * t, z - az - dz * t);
        if (e < r.d) { r.d = e; r.s = A[i - 1] + Math.sqrt(l2) * t; r.i = i; } } return r; }; }
  // a point of a sampled line by its arc length (closed: round), its tangent and its normal (left of the way)
  function along(S, s, closed) { const L = S.L; s = closed ? ((s % L) + L) % L : Math.max(0, Math.min(L, s)); let lo = 0, hi = S.A.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S.A[m] <= s) lo = m; else hi = m; }
    const t = (s - S.A[lo]) / ((S.A[hi] - S.A[lo]) || 1), [ax, az] = S.P[lo], [bx, bz] = S.P[hi], l = Math.hypot(bx - ax, bz - az) || 1;
    return { x: ax + (bx - ax) * t, z: az + (bz - az) * t, tx: (bx - ax) / l, tz: (bz - az) / l, nx: -(bz - az) / l, nz: (bx - ax) / l, h: Math.atan2(bz - az, bx - ax) }; }
  const inPoly = (PG, x, z) => { let c = false; for (let i = 0, j = PG.length - 1; i < PG.length; j = i++) { const [xi, zi] = PG[i], [xj, zj] = PG[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };

  // ---- the plan (js/newmap.js hub4G, where the go-kart track was planned): the go-kart's line, the canal, the water's edge
  function plan(MK) {
    const H3 = MK.H3; P = null; if (!H3.kartPts || H3.kartPts.length < 8) return null;
    const K = sample(H3.kartPts, true, 0.9), C = sample(CANAL, false, 1.0), nK = nearIndex(K, 26), nC = nearIndex(C, 26);
    const cw = (x) => CW + 4 * sst(172, 190, x);   // (it opens out where it meets the sea)
    // the water's edge, signed (negative on the water): the course and the canal joined smoothly; kc: how much of it is the canal's
    const parts = (x, z, out) => { const a = nK(x, z), s = a.s, da = a.d - HW, db = nC(x, z).d - cw(x); out.d = smin(da, db, 4); out.kc = sst(-2, 2, da - db); out.s = s; return out; };
    const tmp = { d: 0, kc: 0, s: 0 }, dW = (x, z) => parts(x, z, tmp).d;
    P = { K, C, nK, nC, cw, parts, dW, off: false };
    return (H3.waterCourse = P); }

  // ---- the two bridges as ground (before the roads are built: the ring road and HOME's way are drawn on H3.ground, the car drives on it)
  function lifts(MK) {
    const H3 = MK.H3; if (!P || !H3.crests) return;
    // HOME's way over the water: its line as js/newmap.js dirtPath draws it, where it is on the water (and a metre round), ramps of HR m
    if (H3.forestPts) { const S = sample(H3.forestPts, false, 0.5); let a = 1e9, b = -1e9; S.P.forEach(([x, z], i) => { if (P.dW(x, z) < 1) { a = Math.min(a, S.A[i]); b = Math.max(b, S.A[i]); } });
      if (a < b) { const sa = a - HR, sb = b + HR, near = nearIndex(S, 10), lift = (s) => HB * sst(sa, sa + HR, s) * (1 - sst(sb - HR, sb, s)), bb = [1e9, -1e9, 1e9, -1e9];
        S.P.forEach(([x, z], i) => { if (S.A[i] < sa || S.A[i] > sb) return; bb[0] = Math.min(bb[0], x - 6); bb[1] = Math.max(bb[1], x + 6); bb[2] = Math.min(bb[2], z - 6); bb[3] = Math.max(bb[3], z + 6); });
        P.home = { S, near, sa, sb, a, b, lift, bb };
        H3.crests.push({ bb, f: (x, z) => { if (P.off || x < bb[0] || x > bb[1] || z < bb[2] || z > bb[3]) return 0; const q = near(x, z); return q.d <= HWH + 0.2 && q.s > sa && q.s < sb ? lift(q.s) : 0; } }); } }
    // the ring road over the canal: where its line crosses the canal's, a flat top and ramps; beside it an embankment (2:1) down to the ground
    if (H3.RP && H3.RP.nord) { const S = sample(H3.RP.nord, false, 0.75); let bi = -1, bd = 1e9; S.P.forEach(([x, z], i) => { const d = P.nC(x, z).d; if (d < bd) { bd = d; bi = i; } });
      if (bi > 0 && bd < 3) { const sc = S.A[bi], span = RS + RR + 4, L2 = { P: [], A: [] }; S.P.forEach((p, i) => { if (Math.abs(S.A[i] - sc) <= span) { L2.P.push(p); L2.A.push(S.A[i]); } }); L2.L = L2.A[L2.A.length - 1];
        const near = nearIndex(L2, 16), prof = (s) => 1 - sst(RS, RS + RR, Math.abs(s - sc)), emb = (s, d) => { const p = prof(s); if (p <= 0) return 0; return RB * p * (1 - sst(RWALL, RWALL + 1 + 2 * RB * p, d)); };
        const bb = [1e9, -1e9, 1e9, -1e9]; for (const [x, z] of L2.P) { bb[0] = Math.min(bb[0], x - 14); bb[1] = Math.max(bb[1], x + 14); bb[2] = Math.min(bb[2], z - 14); bb[3] = Math.max(bb[3], z + 14); }
        P.ring = { L2, near, sc, prof, emb, bb };
        // (beside the walls over the canal the water, not the embankment: a car off the bridge falls into it)
        H3.crests.push({ bb, f: (x, z) => { if (P.off || x < bb[0] || x > bb[1] || z < bb[2] || z > bb[3]) return 0; const q = near(x, z); if (q.d > RWALL + 1 + 2 * RB) return 0; const e = emb(q.s, q.d); if (e <= 0) return 0; return q.d > RWALL + 0.3 && P.dW(x, z) < 0.5 ? 0 : e; } }); } }
  }

  // ---- the build (after the rest of the map, before the merging)
  function build(MK) {
    const H3 = MK.H3; if (!P) return null; const t0 = performance.now(), out = {};
    const W = H3.water, WL = W ? W.WL : -0.12, SEA = W && W.poly ? W.poly : null;
    // the grid (1 m) over the course, the canal and the ring road's bridge: the water's edge, the canal's share, the ground as it was
    const X0 = -204, X1 = 206, Z0 = 166, Z1 = 258, NX = X1 - X0, NZ = Z1 - Z0, N1 = NZ + 1, NV = (NX + 1) * N1;
    const D = new Float32Array(NV), KW = new Float32Array(NV), G = new Float32Array(NV), EM = new Float32Array(NV), RD = new Float32Array(NV).fill(1e9), RA = new Float32Array(NV).fill(1e9), SD = new Float32Array(NV).fill(1e9);
    const tmp = { d: 0, kc: 0, s: 0 }; P.off = true;
    // (the sea's edge near the canal's mouth: its polygon's sides within 40 m of the canal's end; SD: metres outside it, negative in the sea)
    const seaSeg = []; if (SEA) for (let i = 0; i < SEA.length; i++) { const a = SEA[i], b = SEA[(i + 1) % SEA.length]; if (Math.min(a[0], b[0]) < 240 && Math.max(a[0], b[0]) > 130 && Math.min(a[1], b[1]) < 230 && Math.max(a[1], b[1]) > 140) seaSeg.push([a, b]); }
    const segD = (x, z) => { let b = 1e9; for (const [[ax, az], [bx, bz]] of seaSeg) { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))); b = Math.min(b, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return b; };
    for (let i = 0; i <= NX; i++) for (let j = 0; j <= NZ; j++) { const q = i * N1 + j, x = X0 + i, z = Z0 + j; P.parts(x, z, tmp); D[q] = tmp.d; KW[q] = tmp.kc; G[q] = H3.ground(x, z);
      if (P.ring) { const r = P.ring.near(x, z); if (r.d < 40) { RD[q] = r.d; RA[q] = Math.abs(r.s - P.ring.sc); EM[q] = P.ring.emb(r.s, r.d); } }
      if (seaSeg.length && x > 130) { const d = segD(x, z); SD[q] = inPoly(SEA, x, z) ? -d : d; } }
    P.off = false;
    const idx = (x, z) => { const i = Math.round(x - X0), j = Math.round(z - Z0); return i < 0 || j < 0 || i > NX || j > NZ ? -1 : i * N1 + j; };
    // ---- what lay there goes: everything where the water and the beaches are now (fold: all), the ground under the ring road where the
    // canal goes under it (fold: low things only, the road stays), HOME's way where its wooden bridge is (its surface); the roads that stay
    // (the parking bays, the ring road, the circuit) and HOME's way off the bridge are kept
    const MF = new Float32Array(NV); for (let q = 0; q < NV; q++) { const j = q % N1, z = Z0 + j; if (z < NFOLD || SD[q] < 0) continue; if (D[q] < ZF) MF[q] = 1e9; if (RD[q] > RWALL && RD[q] < RWALL + 1 + 2 * RB && RA[q] < RS + RR - 0.5) MF[q] = 1e9; }
    const keepAlong = (pts, hw, yMax) => { for (let k = 1; k < pts.length; k++) { const [ax, az] = pts[k - 1], [bx, bz] = pts[k], L = Math.hypot(bx - ax, bz - az); for (let u = 0; u <= L; u += 0.5) { const x = ax + (bx - ax) * u / (L || 1), z = az + (bz - az) * u / (L || 1);
      for (let di = -Math.ceil(hw); di <= Math.ceil(hw); di++) for (let dj = -Math.ceil(hw); dj <= Math.ceil(hw); dj++) { const q = idx(x + di, z + dj); if (q < 0 || Math.hypot(di + Math.round(x) - x, dj + Math.round(z) - z) > hw) continue; MF[q] = yMax(q); } } } };
    for (const e of H3.net || []) { if (e.id === 'kart' || e.id === 'home' || !e.cv) continue; const pts = []; for (let s = 0; s <= e.L; s += 2) { const p = e.cv.getPointAt(Math.min(1, s / e.L)); pts.push([p.x, p.z]); }
      if (!pts.some(([x, z]) => x > X0 - 10 && x < X1 + 10 && z > Z0 - 10 && z < Z1 + 10)) continue;
      // (the ring road where the canal goes under it: the low things under it go, its deck stays)
      keepAlong(pts, e.id === 'nord' ? RWALL + 0.2 : (e.hw || 4) + 0.6, (q) => e.id === 'nord' && D[q] < 2.5 && EM[q] > 0.3 ? 0.6 : 0); }
    { const t = MK.T(); if (t && t.px) { const pts = []; for (let i = 0; i < t.px.length; i += 2) pts.push([t.px[i], t.pz[i]]); keepAlong(pts, t.w + 2.5, () => 0); } }
    if (P.home) { const H = P.home, pts = H.S.P; keepAlong(pts, HWH + 1.2, (q) => { const i = Math.floor(q / N1), x = X0 + i, z = Z0 + (q - i * N1), r = H.near(x, z); return r.s > H.sa - 0.5 && r.s < H.sb + 0.5 && MF[q] > 0 ? H.lift(r.s) + 0.35 : 0; }); }
    const Mq = (x, z) => { const q = idx(x, z); return q < 0 ? 0 : MF[q]; };
    out.fold = foldAll(MK, H3, Mq, [X0, X1, Z0, Z1]);
    // ---- the new ground: one height field (1 m), in pieces of 48 m (merged by cells: js/nvbake.js), the meadow round it the one meadow
    const inFloor = (q) => { const j = q % N1; if (Z0 + j < NORTH) return false; return D[q] < ZM || (RD[q] < RWALL + 5 + 2 * RB && RA[q] < RS + RR + 4); };
    const HT = new Float32Array(NV), COL = new Float32Array(NV * 3), MW = new Float32Array(NV);
    const cA = new THREE.Color(0xd9c08f), cB = new THREE.Color(0x7d8a5e), cC = new THREE.Color(0x2b5566), cD = new THREE.Color(0x163746), wetS = new THREE.Color(0.55, 0.47, 0.34), dryS = new THREE.Color(0.74, 0.64, 0.47).lerp(new THREE.Color(0.9, 0.85, 0.72), 0.5), cc = new THREE.Color(), cb = new THREE.Color();
    const pal = (dep) => { if (dep < 0.35) cc.copy(cA).lerp(cB, dep / 0.35); else if (dep < 1.6) cc.copy(cB).lerp(cC, (dep - 0.35) / 1.25); else cc.copy(cC).lerp(cD, Math.min(1, (dep - 1.6) / 2.5)); return cc; };
    for (let q = 0; q < NV; q++) { const i = Math.floor(q / N1), x = X0 + i, z = Z0 + (q - i * N1), d = D[q], kc = KW[q];
      // (under the ring road's deck a little lower than it: the road is drawn on H3.ground)
      const land = G[q] + 0.01 + EM[q] - (RD[q] < RWALL ? 0.08 : 0), slope = mix(0.05, 0.4, kc); let h;
      if (d >= 0) h = smin(Math.max(land, WL + 0.03 + 0.05 * Math.min(d, 3)), WL + 0.07 * sst(0, 0.8, d) + slope * d, 0.3);
      else { const u = -d, dk = 0.22 * sst(0, 0.8, u) + 2.0 * sst(3, 6.5, u), dc = 0.4 * sst(0, 0.6, u) + 1.4 * sst(1, 3.5, u); h = WL - mix(dk, dc, kc); }
      if (d < 0) { pal(WL - h); if (SD[q] < 12 && W && W.bedAt) { const b = W.bedAt(x, z, cb), f = 1 - sst(0, 12, SD[q]); h = mix(h, Math.min(h, b.y), f); cc.lerp(cb, f); } MW[q] = 0; }
      else { const hA = h - WL, bw = mix(BEACH, CBEACH, kc); cc.copy(wetS).lerp(dryS, sst(0, 0.1, hA)); MW[q] = sst(bw - 1.2, bw + 1.2, d); if (EM[q] > 0.05 && d > 1.5) MW[q] = 1; }
      HT[q] = h; COL[q * 3] = cc.r; COL[q * 3 + 1] = cc.g; COL[q * 3 + 2] = cc.b; }
    out.floor = floorPieces(MK, { X0, Z0, NX, NZ, N1, HT, COL, MW, SD, inFloor, piece: 48 });
    // ---- the water: one surface at the sea's level (2 m cells) over the course and the canal to the sea's edge, a little behind the ground
    const WM = W && W.surf ? W.surf.material.clone() : new THREE.MeshPhongMaterial({ color: 0x2f86b8, transparent: true, opacity: 0.58, shininess: 110, depthWrite: false });
    Object.assign(WM, { polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 6 });
    out.water = waterPieces(MK, { X0, Z0, NX, NZ, N1, D, SD, WL, mat: WM, piece: 48 });
    // ---- the rest: the bridges, the pier, the course's things
    const ROOT = new THREE.Group(); ROOT.userData.nvboat = true; MK.add(ROOT); P.root = ROOT;
    const gy = (x, z) => { const q = idx(x, z); return q >= 0 && inFloor(q) ? bil(HT, x, z) : H3.ground(x, z); };
    const bil = (A, x, z) => { const fx = Math.max(0, Math.min(NX - 0.001, x - X0)), fz = Math.max(0, Math.min(NZ - 0.001, z - Z0)), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, q = i * N1 + j; return (A[q] * (1 - v) + A[q + 1] * v) * (1 - u) + (A[q + N1] * (1 - v) + A[q + N1 + 1] * v) * u; };
    const ctx = { MK, H3, WL, ROOT, gy, Dq: (x, z) => { const q = idx(x, z); return q < 0 ? 1e9 : D[q]; }, ours: (x, z) => Mq(x, z) > 1e8 && z > NFOLD + 2 };
    if (P.home) out.home = homeBridge(ctx);
    if (P.ring) out.ring = ringBridge(ctx);
    out.dress = dress(ctx);
    out.ms = Math.round(performance.now() - t0); P.out = out; return out; }

  // what lay where the course is now (the World's meshes and the map's own: its top groups, userData.mk): a triangle folded when its three
  // corners are in (a big one partly out stays: no hole past the new ground's edge), a small mesh hidden when its middle is in, an instance
  // moved away; Mq(x, z): the height under which things there go (0: they stay)
  function foldAll(MK, H3, Mq, box) {
    const r = { hid: 0, tri: 0, inst: 0 }, skip = new Set(H3.arrows || []), world = Render.world && Render.world.root;
    const V = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), M4 = new THREE.Matrix4(), bx = new THREE.Box3();
    const one = (o, small) => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position || skip.has(o) || (o.parent && skip.has(o.parent))) return; const g = o.geometry;
      if (o.isInstancedMesh) { let ch = false; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M4); V.setFromMatrixPosition(M4).applyMatrix4(o.matrixWorld); const m = Mq(V.x, V.z); if (m > 0 && V.y > -100 && V.y < m) { M4.elements[13] -= 1000; o.setMatrixAt(i, M4); ch = true; r.inst++; } } if (ch) o.instanceMatrix.needsUpdate = true; return; }
      if (!g.boundingBox) g.computeBoundingBox(); bx.copy(g.boundingBox).applyMatrix4(o.matrixWorld); if (bx.max.x < box[0] || bx.min.x > box[1] || bx.max.z < box[2] || bx.min.z > box[3]) return;
      if (small && Math.max(bx.max.x - bx.min.x, bx.max.z - bx.min.z) < 10) { bx.getCenter(V); const m = Mq(V.x, V.z); if (m > 0 && bx.max.y < m) { o.visible = false; r.hid++; } return; }
      const pos = g.attributes.position, ix = g.index, n = (ix ? ix.count : pos.count) / 3, mw = o.matrixWorld; let ch = false;
      for (let t = 0; t < n; t++) { const ia = ix ? ix.getX(t * 3) : t * 3, ib = ix ? ix.getX(t * 3 + 1) : t * 3 + 1, ic = ix ? ix.getX(t * 3 + 2) : t * 3 + 2; A.fromBufferAttribute(pos, ia).applyMatrix4(mw);
        let m = Mq(A.x, A.z); if (m <= 0) continue; B.fromBufferAttribute(pos, ib).applyMatrix4(mw); m = Math.min(m, Mq(B.x, B.z)); if (m <= 0) continue; C.fromBufferAttribute(pos, ic).applyMatrix4(mw); m = Math.min(m, Mq(C.x, C.z));
        if (m <= 0 || Math.max(A.y, B.y, C.y) >= m) continue; ch = true; r.tri++; if (ix) { ix.setX(t * 3 + 1, ia); ix.setX(t * 3 + 2, ia); } else { pos.setXYZ(ib, pos.getX(ia), pos.getY(ia), pos.getZ(ia)); pos.setXYZ(ic, pos.getX(ia), pos.getY(ia), pos.getZ(ia)); } }
      if (ch) { if (ix) ix.needsUpdate = true; pos.needsUpdate = true; } };
    // (the World's: triangle by triangle, its trees too; the map's own: a small one whole)
    if (world) { world.updateMatrixWorld(true); world.traverse(o => one(o, false)); }
    for (const top of Render.scene.children) { if (!top.userData.mk || top.userData.nvboat || top === world) continue; top.updateMatrixWorld(true); top.traverse(o => { if (o.visible) one(o, true); }); }
    return r; }

  // the new ground in pieces: its cells where any corner is in it, cut at the sea's edge (the sea's own bed and water go on from there)
  function floorPieces(MK, o) { let nv = 0, np = 0; const { X0, Z0, NX, NZ, N1, HT, COL, MW, SD, inFloor } = o;
    for (let pi = 0; pi < NX; pi += o.piece) for (let pj = 0; pj < NZ; pj += o.piece) { const pos = [], col = [], mw = [], tri = [], vid = new Map();
      const V = (q) => { let v = vid.get(q); if (v != null) return v; const i = Math.floor(q / N1), j = q - i * N1; v = pos.length / 3; pos.push(X0 + i, HT[q], Z0 + j); col.push(COL[q * 3], COL[q * 3 + 1], COL[q * 3 + 2]); mw.push(MW[q]); vid.set(q, v); return v; };
      // (a point between two grid points, where the sea's edge is)
      const E = (qa, qb) => { const t = SD[qa] / ((SD[qa] - SD[qb]) || 1), i = Math.floor(qa / N1), j = qa - i * N1, i2 = Math.floor(qb / N1), j2 = qb - i2 * N1, v = pos.length / 3;
        pos.push(X0 + mix(i, i2, t), mix(HT[qa], HT[qb], t), Z0 + mix(j, j2, t)); for (let c = 0; c < 3; c++) col.push(mix(COL[qa * 3 + c], COL[qb * 3 + c], t)); mw.push(mix(MW[qa], MW[qb], t)); return v; };
      for (let i = pi; i < Math.min(NX, pi + o.piece); i++) for (let j = pj; j < Math.min(NZ, pj + o.piece); j++) { const a = i * N1 + j, b = a + N1, c = b + 1, d = a + 1;
        if (!(inFloor(a) || inFloor(b) || inFloor(c) || inFloor(d))) continue;
        const ring = [a, b, c, d], sea = ring.map(q => SD[q] < 0); if (sea.every(Boolean)) continue;
        if (!sea.some(Boolean)) { const A2 = V(a), B2 = V(b), C2 = V(c), D2 = V(d); if (Math.abs(HT[a] - HT[c]) <= Math.abs(HT[b] - HT[d])) tri.push(A2, C2, B2, A2, D2, C2); else tri.push(A2, D2, B2, B2, D2, C2); continue; }
        // (cut at the sea's edge: the land side of the cell, a fan)
        const poly = []; for (let k = 0; k < 4; k++) { const q1 = ring[k], q2 = ring[(k + 1) % 4]; if (!sea[k]) poly.push(V(q1)); if (sea[k] !== sea[(k + 1) % 4]) poly.push(E(q1, q2)); }
        for (let k = 1; k + 1 < poly.length; k++) tri.push(poly[0], poly[k + 1], poly[k]); }
      if (!tri.length) continue; MK.landMesh(pos, col, mw, tri); nv += pos.length / 3; np++; }
    return { verts: nv, pieces: np }; }

  // the water: 2 m cells where any corner is near the water, cut at the sea's edge
  function waterPieces(MK, o) { let nv = 0, np = 0; const { X0, Z0, NX, NZ, N1, D, SD, WL } = o, S = 2;
    for (let pi = 0; pi < NX; pi += o.piece) for (let pj = 0; pj < NZ; pj += o.piece) { const pos = [], tri = [], vid = new Map();
      const V = (i, j) => { const k = i * 100000 + j; let v = vid.get(k); if (v != null) return v; v = pos.length / 3; pos.push(X0 + i, WL, Z0 + j); vid.set(k, v); return v; };
      for (let i = pi; i < Math.min(NX, pi + o.piece); i += S) for (let j = pj; j < Math.min(NZ, pj + o.piece); j += S) { const i2 = Math.min(NX, i + S), j2 = Math.min(NZ, j + S), ring = [[i, j], [i2, j], [i2, j2], [i, j2]], q = ring.map(([a, b]) => a * N1 + b);
        if (Math.min(...q.map(k => D[k])) >= 2.5) continue; const sea = q.map(k => SD[k] < 0); if (sea.every(Boolean)) continue;
        if (!sea.some(Boolean)) { const A = V(i, j), B = V(i2, j), C = V(i2, j2), Dd = V(i, j2); tri.push(A, C, B, A, Dd, C); continue; }
        const poly = []; for (let k = 0; k < 4; k++) { const k2 = (k + 1) % 4; if (!sea[k]) poly.push(V(ring[k][0], ring[k][1])); if (sea[k] !== sea[k2]) { const t = SD[q[k]] / ((SD[q[k]] - SD[q[k2]]) || 1), v = pos.length / 3; pos.push(X0 + mix(ring[k][0], ring[k2][0], t), WL, Z0 + mix(ring[k][1], ring[k2][1], t)); poly.push(v); } }
        for (let k = 1; k + 1 < poly.length; k++) tri.push(poly[0], poly[k + 1], poly[k]); }
      if (!tri.length) continue; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((v, k) => k % 3 === 1 ? 1 : 0), 3)); g.setIndex(tri); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, o.mat); m.renderOrder = 2; m.receiveShadow = true; MK.add(m); nv += pos.length / 3; np++; }
    return { verts: nv, pieces: np }; }

  // ---- HOME's wooden bridge: the deck of planks along the way (its surface where the car drives: H3.ground), the beams' ends, posts down
  // to the bed, a rail on both sides; HOME's pier beside its north end with two jet skis
  function homeBridge(c) {
    const { MK, WL, ROOT, gy } = c, H = P.home, wood = woodMat(), lam = MK.lam, pos = [], uv = [], ix = []; let n = 0;
    const dk = (s) => along(H.S, s, false), top = (p) => c.H3.ground(p.x, p.z) + 0.04;
    const side = [], posts = []; for (let s = H.sa; s <= H.sb + 0.01; s += 0.5) { const p = dk(s), y = top(p);
      for (const u of [-HWH, HWH]) { pos.push(p.x + p.nx * u, y, p.z + p.nz * u); uv.push(u > 0 ? 1 : 0, s / 3.5); }
      if (n) ix.push((n - 1) * 2, n * 2, (n - 1) * 2 + 1, (n - 1) * 2 + 1, n * 2, n * 2 + 1); n++; side.push([p, y]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(ix); g.computeVertexNormals(); if (g.attributes.normal.getY(0) < 0) { const I = g.index; for (let t = 0; t < I.count; t += 3) { const q = I.getX(t + 1); I.setX(t + 1, I.getX(t + 2)); I.setX(t + 2, q); } g.computeVertexNormals(); }
    const deck = new THREE.Mesh(g, wood); deck.receiveShadow = true; ROOT.add(deck);
    // (its edge beams down 0.3 m, the rails, posts every 2.5 m: down to the bed or the beach)
    const beam = (sgn) => { const bp = [], bi = []; side.forEach(([p, y], k) => { const x = p.x + p.nx * sgn * HWH, z = p.z + p.nz * sgn * HWH; bp.push(x, y + 0.02, z, x, y - 0.32, z); if (k) bi.push((k - 1) * 2, k * 2, (k - 1) * 2 + 1, (k - 1) * 2 + 1, k * 2, k * 2 + 1); });
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.setIndex(bi); bg.computeVertexNormals(); const m = new THREE.Mesh(bg, lam(0x7a5a3a)); m.material.side = THREE.DoubleSide; ROOT.add(m); };
    beam(-1); beam(1);
    let k = 0; for (let s = H.sa + 0.6; s <= H.sb - 0.5; s += 2.5, k++) { const p = dk(s), y = top(p); for (const u of [-HWH + 0.1, HWH - 0.1]) { const x = p.x + p.nx * u, z = p.z + p.nz * u, rh = 1.0; box(ROOT, 0.14, rh, 0.14, lam(0x6e5236), x, y + rh / 2, z, 0);
        if (k % 2 === 0 && y - 0.3 > gy(x, z) + 0.2) { const yb = Math.min(gy(x, z), WL - 0.3), hh = y - 0.3 - yb; box(ROOT, 0.26, hh, 0.26, lam(0x5a4430), x, yb + hh / 2, z, 0); posts.push([x, z]); } } }
    for (const sgn of [-1, 1]) { const rp = [], ri = []; let m = 0; for (let s = H.sa + 0.6; s <= H.sb - 0.5; s += 1) { const p = dk(s), y = top(p) + 0.95, x = p.x + p.nx * sgn * (HWH - 0.1), z = p.z + p.nz * sgn * (HWH - 0.1); rp.push(x, y, z, x, y + 0.1, z); if (m) ri.push((m - 1) * 2, m * 2, (m - 1) * 2 + 1, (m - 1) * 2 + 1, m * 2, m * 2 + 1); m++; }
      const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setIndex(ri); rg.computeVertexNormals(); const rm = new THREE.Mesh(rg, lam(0x8a6a44)); rm.material.side = THREE.DoubleSide; ROOT.add(rm); }
    // the pier: from the bank beside the bridge's north end (east of it) out into the water, two jet skis tied to it
    let pier = null; { const p = dk(H.b - 1), sx = p.nx, sz = p.nz, pick = (sg) => { let x = p.x + sx * sg * (HWH + 4), z = p.z + sz * sg * (HWH + 4); for (let k = 0; k < 30 && c.Dq(x, z) < 0.6; k++) { x += p.tx * 0.5; z += p.tz * 0.5; } return [x, z]; };
      let [x0, z0] = pick(p.nx > 0 ? 1 : -1); if (!c.ours(x0, z0)) [x0, z0] = pick(p.nx > 0 ? -1 : 1);
      // (out along the way into the water: the way's own direction, back towards the water)
      const dx = -p.tx, dz = -p.tz, L = 10, hd = Math.atan2(dz, dx);
      if (c.Dq(x0 + dx * L, z0 + dz * L) < -1) { const cx = x0 + dx * L / 2, cz = z0 + dz * L / 2, g2 = new THREE.Group(); g2.position.set(cx, WL + 0.45, cz); g2.rotation.y = -hd; ROOT.add(g2);
        const d2 = new THREE.Mesh(new THREE.BoxGeometry(L, 0.18, 2.4), wood); d2.receiveShadow = true; d2.castShadow = true; g2.add(d2);
        for (let i = 0; i <= 4; i++) for (const sg of [-1, 1]) { const pp = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.6, 0.22), lam(0x5a4430)); pp.position.set(-L / 2 + 0.2 + i * (L - 0.4) / 4, -0.7, sg * 1.08); g2.add(pp); }
        const nx2 = -dz, nz2 = dx; for (const [f, sg, col] of [[0.35, 1, 0x2a5ab8], [0.75, 1, 0x3fbf6a]]) jetski(c, x0 + dx * L * f + nx2 * sg * 2.1, z0 + dz * L * f + nz2 * sg * 2.1, hd, col, false);
        pier = [Math.round(cx), Math.round(cz)]; } }
    return { from: Math.round(H.sa), to: Math.round(H.sb), posts: posts.length, pier }; }

  // ---- the ring road's humped bridge: walls on both sides over the canal (down into the bed), a white coping, rails; the deck's underside
  function ringBridge(c) {
    const { MK, WL, ROOT } = c, R = P.ring, lam = MK.lam, conc = lam(0xb9b6ae), white = lam(0xf0eee8);
    const L2 = { P: R.L2.P, A: R.L2.A.map(a => a - R.L2.A[0]), L: R.L2.L - R.L2.A[0] }, sc = R.sc - R.L2.A[0], at = (s) => along(L2, s, false), deckY = (p) => c.H3.ground(p.x, p.z) + 0.04;
    const wall = (sgn) => { const wp = [], wi = [], cp = [], ci = []; let k = 0; for (let s = sc - RS - 1; s <= sc + RS + 1.01; s += 1) { const p = at(s), y = deckY(p), x = p.x + p.nx * sgn * RWALL, z = p.z + p.nz * sgn * RWALL, xo = x + p.nx * sgn * 0.45, zo = z + p.nz * sgn * 0.45;
        wp.push(x, y + 0.55, z, x, WL - 2.6, z, xo, y + 0.55, zo, xo, WL - 2.6, zo); cp.push(x - p.nx * sgn * 0.05, y + 0.56, z - p.nz * sgn * 0.05, xo + p.nx * sgn * 0.05, y + 0.56, zo + p.nz * sgn * 0.05);
        if (k) { const a = (k - 1) * 4, b = k * 4; wi.push(a, a + 1, b, b, a + 1, b + 1, a + 2, b + 2, a + 3, a + 3, b + 2, b + 3); ci.push((k - 1) * 2, k * 2, (k - 1) * 2 + 1, (k - 1) * 2 + 1, k * 2, k * 2 + 1); } k++; }
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setIndex(wi); wg.computeVertexNormals(); const wm = new THREE.Mesh(wg, conc); wm.material.side = THREE.DoubleSide; wm.castShadow = true; wm.receiveShadow = true; ROOT.add(wm);
      const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setIndex(ci); cg.computeVertexNormals(); const cm = new THREE.Mesh(cg, white); cm.material.side = THREE.DoubleSide; ROOT.add(cm);
      for (let s = sc - RS - 6; s <= sc + RS + 6; s += 2) { const p = at(s), y = deckY(p), x = p.x + p.nx * sgn * (RWALL + 0.22), z = p.z + p.nz * sgn * (RWALL + 0.22), base = Math.abs(s - sc) <= RS + 1 ? y + 0.56 : y; box(ROOT, 0.1, 0.95, 0.1, white, x, base + 0.47, z, 0); }
      { const rp = [], ri = []; let m = 0; for (let s = sc - RS - 6; s <= sc + RS + 6.01; s += 1) { const p = at(s), y = deckY(p), base = Math.abs(s - sc) <= RS + 1 ? y + 0.56 : y, x = p.x + p.nx * sgn * (RWALL + 0.22), z = p.z + p.nz * sgn * (RWALL + 0.22); rp.push(x, base + 0.9, z, x, base + 1.0, z); if (m) ri.push((m - 1) * 2, m * 2, (m - 1) * 2 + 1, (m - 1) * 2 + 1, m * 2, m * 2 + 1); m++; }
        const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setIndex(ri); rg.computeVertexNormals(); const rm = new THREE.Mesh(rg, white); rm.material.side = THREE.DoubleSide; ROOT.add(rm); } };
    wall(-1); wall(1);
    // (the deck's underside, seen from the water under it)
    { const up = [], ui = []; let k = 0; for (let s = sc - RS - 1; s <= sc + RS + 1.01; s += 1) { const p = at(s), y = deckY(p) - 0.45; up.push(p.x - p.nx * RWALL, y, p.z - p.nz * RWALL, p.x + p.nx * RWALL, y, p.z + p.nz * RWALL); if (k) ui.push((k - 1) * 2, k * 2, (k - 1) * 2 + 1, (k - 1) * 2 + 1, k * 2, k * 2 + 1); k++; }
      const ug = new THREE.BufferGeometry(); ug.setAttribute('position', new THREE.Float32BufferAttribute(up, 3)); ug.setIndex(ui); ug.computeVertexNormals(); const um = new THREE.Mesh(ug, conc); um.material.side = THREE.DoubleSide; ROOT.add(um); }
    const p = at(sc); return { at: [Math.round(p.x), Math.round(p.z)], top: +(deckY(p)).toFixed(2) }; }

  // ---- the course's things (the user's choice: the wide course with beaches, look F, a family beach)
  function dress(c) {
    const { MK, WL, ROOT, gy } = c, K = P.K, lam = MK.lam, at = (s) => along(K, s, true), out = {};
    const onBeach = (x, z, need = 2) => c.Dq(x, z) >= need && c.ours(x, z) && (!P.home || P.home.near(x, z).d > HWH + 4);
    const curv = (s) => { const a = at(s - 4), b = at(s + 4); let d = b.h - a.h; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d / 8; };
    // the start: the west loop's long straight, its south side
    let s0 = 0, bx = 1e9; K.P.forEach(([x, z], i) => { if (z > 215 && Math.abs(x + 108) < bx) { bx = Math.abs(x + 108); s0 = K.A[i]; } }); out.s0 = Math.round(s0); out.len = Math.round(K.L);
    { const p = at(s0); for (let u = -HW + 0.4, k = 0; u <= HW - 0.4; u += 0.5, k++) box(ROOT, 0.45, 0.12, 0.45, lam(k % 2 ? 0x111111 : 0xf4f4f0), p.x + p.nx * u, WL + 0.04, p.z + p.nz * u, -p.h, true);
      for (const sg of [-1, 1]) flag(c, p.x + p.nx * sg * (HW + 1.6), p.z + p.nz * sg * (HW + 1.6), p.h); }
    // the field: four jet skis on the grid behind the line, four out on the course
    for (let k = 0; k < 4; k++) { const s = s0 - 6 - Math.floor(k / 2) * 5, p = at(s), u = (k % 2 ? 1 : -1) * 2.2; jetski(c, p.x + p.nx * u, p.z + p.nz * u, p.h, JC[k], true); }
    for (const [f, ci, u] of [[0.22, 4, 0.2], [0.41, 5, -0.25], [0.63, 0, 0.3], [0.81, 2, -0.1]]) { const p = at(s0 + f * K.L); if (P.home && P.home.near(p.x, p.z).d < HWH + 6) continue; jetski(c, p.x + p.nx * HW * u, p.z + p.nz * HW * u, p.h, JC[ci], true); }
    // the buoys at the bends: red on the inside, yellow on the outside
    let nb = 0; for (let s = 0; s < K.L; s += 7) { const k = curv(s); if (Math.abs(k) < 0.045) continue; const p = at(s), sg = Math.sign(k);
      for (const [side, col] of [[sg, 0xff3b20], [-sg, 0xf2c12e]]) { const x = p.x + p.nx * side * (HW - 1.3), z = p.z + p.nz * side * (HW - 1.3); if (c.Dq(x, z) > -0.8) continue; buoy(c, x, z, col); } nb++; } out.buoys = nb;
    // three lines of red and white floats along the course
    const fG = new THREE.TetrahedronGeometry(0.24, 0); fG.scale(1, 0.6, 1); let nf = 0;
    for (let s = 0; s < K.L; s += 1.8) { const p = at(s), col = Math.floor(s / 1.8) % 2 ? 0xd8282a : 0xf4f4f0; for (const f of [-0.45, 0, 0.45]) { const x = p.x + p.nx * f * HW, z = p.z + p.nz * f * HW; if (c.Dq(x, z) > -1.5 || (P.home && P.home.near(x, z).d < HWH + 1.5)) continue; const m = new THREE.Mesh(fG, lam(col)); m.position.set(x, WL + 0.05, z); ROOT.add(m); nf++; } } out.floats = nf;
    // the family beach on both banks: umbrellas with loungers, every fourth a volleyball net, every third a coloured cabin
    let nu = 0, nn = 0, nh = 0; for (let s = 9; s < K.L; s += 26) { const p = at(s); for (const sg of [-1, 1]) { const u = sg * (HW + 3.2), x = p.x + p.nx * u, z = p.z + p.nz * u; if (!onBeach(x, z)) continue;
        umbrella(c, x, z, UC[nu % 5]); { const lx = x + p.tx * 1.6, lz = z + p.tz * 1.6; if (onBeach(lx, lz, 1.5)) box(ROOT, 1.9, 0.18, 0.7, lam(0xf4f4f0), lx, gy(lx, lz) + 0.25, lz, -p.h); }
        if (nu % 4 === 1) { const nx = x + p.nx * sg * 3, nz = z + p.nz * sg * 3; if (onBeach(nx + Math.cos(p.h) * 4, nz + Math.sin(p.h) * 4, 1.5) && onBeach(nx - Math.cos(p.h) * 4, nz - Math.sin(p.h) * 4, 1.5)) { net(c, nx, nz, p.h); nn++; } }
        if (nu % 3 === 2) { const hx = x - p.tx * 6 + p.nx * sg * 3.5, hz = z - p.tz * 6 + p.nz * sg * 3.5; if (onBeach(hx, hz, 3)) { hut(c, hx, hz, -p.h, UC[(nu + 2) % 5]); nh++; } }
        nu++; } }
    out.umbrellas = nu; out.nets = nn; out.cabins = nh;
    // inflatable rings in the water near the banks
    let nr = 0; for (let s = 15; s < K.L; s += 23) { const p = at(s), u = (Math.round(s) % 2 ? 1 : -1) * (HW - 2), x = p.x + p.nx * u, z = p.z + p.nz * u; if (c.Dq(x, z) > -0.8) continue; ring(c, x, z, UC[Math.floor(s) % 5]); nr++; } out.rings = nr;
    { const p = at(s0 + K.L * 0.47); if (!P.home || P.home.near(p.x, p.z).d > HWH + 8) boat(c, p.x, p.z, p.h, 0xf4f4f0); }
    return out; }

  // ---- the things
  function box(g, w, h, d, m, x, y, z, ry, flat) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.y = ry || 0; o.castShadow = !flat; o.receiveShadow = true; g.add(o); return o; }
  let WOOD = null, CHK = null, NETM = null, WAKE = null, FLAGM = null;
  const canvas = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t; };
  // (planks across the deck: brown, a dark gap between them, a little different one from another)
  function woodMat() { if (WOOD) return WOOD; const t = canvas(64, 256, (x, w, h) => { for (let k = 0; k < 16; k++) { const v = 0.85 + 0.15 * Math.sin(k * 2.7); x.fillStyle = `rgb(${Math.round(176 * v)},${Math.round(132 * v)},${Math.round(88 * v)})`; x.fillRect(0, k * 16, w, 16); x.fillStyle = 'rgba(40,26,14,0.75)'; x.fillRect(0, k * 16, w, 2); } });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; return (WOOD = new THREE.MeshLambertMaterial({ map: t })); }
  function chk() { return CHK || (CHK = canvas(64, 32, (x) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f0'; x.fillRect(i * 8, j * 8, 8, 8); } })); }
  function flag(c, x, z, h) { const y = c.gy(x, z), lam = c.MK.lam; box(c.ROOT, 0.14, 4.5, 0.14, lam(0xdedede), x, y + 2.25, z, 0);
    if (!FLAGM) FLAGM = new THREE.MeshLambertMaterial({ map: chk(), side: THREE.DoubleSide }); const f = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), FLAGM); f.position.set(x + Math.cos(h) * 0.75, y + 4.0, z + Math.sin(h) * 0.75); f.rotation.y = -h; f.castShadow = true; c.ROOT.add(f); }
  // a jet ski: hull, nose, seat, handlebar, a stripe; a rider (back, helmet) and its wake when it races
  function jetski(c, x, z, h, col, rider) { const lam = c.MK.lam, g = new THREE.Group(); g.position.set(x, c.WL + 0.02, z); g.rotation.y = -h; c.ROOT.add(g);
    const B = (w, hh, d, m, px, py, pz) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m); o.position.set(px, py, pz); o.castShadow = true; g.add(o); return o; };
    B(2.6, 0.42, 0.95, lam(col), 0, 0.12, 0); B(2.62, 0.08, 0.97, lam(0xf4f4f0), 0, 0.3, 0); B(1.0, 0.22, 0.42, lam(0x1c1c1e), -0.3, 0.42, 0); B(0.12, 0.08, 0.7, lam(0x2a2e34), 0.55, 0.62, 0);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.9, 4), lam(col)); nose.rotation.set(Math.PI / 4, 0, -Math.PI / 2); nose.scale.set(1, 1, 0.55); nose.position.set(1.72, 0.12, 0); g.add(nose);
    if (!rider) return g; B(0.42, 0.8, 0.5, lam(0x2a2e34), -0.15, 0.95, 0); const hm = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), lam(col === 0xf2c12e ? 0xd8282a : 0xf2c12e)); hm.position.set(-0.05, 1.5, 0); g.add(hm);
    if (!WAKE) WAKE = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.3, depthWrite: false });
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute([-1.2, 0, 0, -6.5, 0, -1.6, -6.5, 0, 1.6], 3)); wg.setAttribute('color', new THREE.Float32BufferAttribute([1, 1, 1, 0.75, 0.88, 0.95, 0.75, 0.88, 0.95], 3)); wg.setIndex([0, 2, 1, 0, 1, 2]);
    const wk = new THREE.Mesh(wg, WAKE); wk.position.y = -0.04; wk.renderOrder = 3; g.add(wk); return g; }
  function boat(c, x, z, h, col) { const lam = c.MK.lam, g = new THREE.Group(); g.position.set(x, c.WL + 0.02, z); g.rotation.y = -h; c.ROOT.add(g);
    const B = (w, hh, d, m, px, py, pz) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m); o.position.set(px, py, pz); o.castShadow = true; g.add(o); return o; };
    B(4.6, 0.7, 1.8, lam(col), 0, 0.2, 0); B(3.8, 0.06, 1.6, lam(0xd8d2c4), 0, 0.56, 0); B(0.5, 0.6, 0.5, lam(0x2a2e34), -2.5, 0.6, 0); B(0.1, 0.5, 1.5, lam(0x9fd6ef), 0.8, 0.8, 0);
    const bow = new THREE.Mesh(new THREE.ConeGeometry(0.92, 1.6, 4), lam(col)); bow.rotation.set(Math.PI / 4, 0, -Math.PI / 2); bow.scale.set(1, 1, 0.5); bow.position.set(3.0, 0.2, 0); bow.castShadow = true; g.add(bow); return g; }
  function buoy(c, x, z, col) { const m = c.MK.lam(col), a = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.9, 8), m), b = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.4, 8), m); a.position.set(x, c.WL + 0.25, z); b.position.set(x, c.WL + 0.9, z); a.castShadow = b.castShadow = true; c.ROOT.add(a, b); }
  function umbrella(c, x, z, col) { const y = c.gy(x, z); box(c.ROOT, 0.12, 2.4, 0.12, c.MK.lam(0xf4f4f0), x, y + 1.2, z, 0); const u = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.6, 10), c.MK.lam(col)); u.position.set(x, y + 2.4, z); u.castShadow = true; c.ROOT.add(u); }
  function net(c, x, z, h) { const y = c.gy(x, z), lam = c.MK.lam; for (const sg of [-1, 1]) box(c.ROOT, 0.12, 2.4, 0.12, lam(0xf4f4f0), x + Math.cos(h) * sg * 4, y + 1.2, z + Math.sin(h) * sg * 4, 0);
    if (!NETM) NETM = new THREE.MeshLambertMaterial({ color: 0xf4f4f0, transparent: true, opacity: 0.6, side: THREE.DoubleSide }); const n = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.8), NETM); n.position.set(x, y + 2.0, z); n.rotation.y = -h; c.ROOT.add(n); }
  function hut(c, x, z, ry, col) { const y = c.gy(x, z), lam = c.MK.lam; box(c.ROOT, 2.4, 2.2, 2.4, lam(col), x, y + 1.1, z, ry); const r = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.1, 4), lam(0xf4f4f0)); r.position.set(x, y + 2.75, z); r.rotation.y = ry + Math.PI / 4; r.castShadow = true; c.ROOT.add(r); }
  function ring(c, x, z, col) { const m = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.22, 6, 12), c.MK.lam(col)); m.rotation.x = Math.PI / 2; m.position.set(x, c.WL + 0.08, z); c.ROOT.add(m); }

  return { plan, lifts, build, get plan0() { return P; }, HW, BEACH };
})();
