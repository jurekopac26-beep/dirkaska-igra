/* =========================================================================
   WORLD — Rio de Janeiro, Brazilija (theme 'rio'): its own parts on the shared builder of js/world-rbring.js (World.ext.rbring), split out of it by
   tools/razdeli-proge.mjs (docs/razdelitev-prog.md) and loaded before it (index.html). What the builder, World and the other worlds use of them
   goes on World.api (API), its look (RB_LOOK.rio) on API.rbLook; World.ext.rio builds it with World.ext.rbring.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { GB, IChunks, NRC, NRT, RB, TAU, WSKY, addShore, atSf, box, clamp, crAt, crH, crowdPut, cyl, ico, inPoly, lerp, nrGH, nrGround, nrLCf, nrNear, nrTileOn, polyDist, puff, rng, shoreBand, sstep, waterMat, waterline } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });
  const sAtS = (d) => (((T.startS + d) % T.len) + T.len) % T.len;   // (metres from the start line -> s)
  // Rio de Janeiro on the same builder (theme 'rio': Jacarepagua in the 1980s): place names only on its boards (no names of the circuit's
  // people, its races or sponsors), 11 turn numbers, the cells after them
  const RIO_BAN = [['RIO DE JANEIRO', '#0a6a3a', '#ffd21f', '#ffd21f'], ['JACAREPAGUA', '#123c8c', '#fff', '#ffd21f'], ['BRASIL', '#0a6a3a', '#fff', '#ffd21f'],
    ['BOXES', '#16181c', '#fff', '#ffd21f']];
  const RIO_AT = { num: 0, brake: 11, ban: 14, rbr: 14, spielberg: 15 };
  const RIO_SHIRTS = [[0.98, 0.84, 0.12], [0.02, 0.56, 0.27], [0.95, 0.95, 0.93], [0.12, 0.26, 0.62], [0.86, 0.16, 0.14], [0.98, 0.84, 0.12], [0.99, 0.6, 0.18], [0.3, 0.7, 0.9],
    [0.02, 0.56, 0.27], [0.95, 0.95, 0.93], [0.72, 0.5, 0.36], [0.98, 0.84, 0.12]];   // the fans' shirts in the summer heat: yellow and green, white, a few in team colours
  /* ---- Rio de Janeiro (theme 'rio'): Jacarepagua in the 1980s on buildRbring (RB_LOOK.rio). Its own parts: the trees of the tropics
     (rioTreeGeo, rioTree: coconut palms, broadleaf trees, mangroves on the marsh by the lagoon), the concrete pit building of the 1970s
     (rioPits), and rioExtra: the lagoon (def.lagoon: its 2012 outline, the water's level), rows of palms and hoardings along the straights,
     and the mountains round the basin on the skyline (def.sky: SRTM's skyline, three bands of distance, drawn round the camera under
     everything else, in the haze's colour: World.update moves it with the camera) ---- */
  const RIO_TP = [0.016, 0.6, 0.5, 0.025];   // the chance of a tree on a spot by the land cover: grass (lone palms), trees, marsh (mangroves), built-up
  function rioTreeGeo(kind) {   // unit trees (height 1, instances scale them): 0 a coconut palm, 1 a broadleaf tree, 2 a mangrove; 3-5 the cheaper ones far from the road
    const g = new GB(), R = rng(820 + kind), k = kind % 3, cheap = kind >= 3;
    const bark = [0.52, 0.45, 0.36], barkD = [0.42, 0.36, 0.29], fr = [0.32, 0.5, 0.18], frD = [0.2, 0.33, 0.12];
    if (k === 0) {   // a slender trunk leaning a little, ringed (two shades), a crown of drooping fronds, coconuts under it
      const lean = 0.05, seg = cheap ? 2 : 4;
      for (let s = 0; s < seg; s++) { const y0 = 0.92 * s / seg, y1 = 0.92 * (s + 1) / seg; cyl(g, lean * y0 * y0, y0, 0, 0.03 - 0.008 * s / seg, y1 - y0 + 0.01, cheap ? 4 : 5, s % 2 ? bark : barkD, null, 0.03 - 0.008 * (s + 1) / seg); }
      const cx = lean * 0.85, n = cheap ? 6 : 10;
      for (let f = 0; f < n; f++) {
        const a = f / n * TAU + (R() - 0.5) * 0.4, c = Math.cos(a), sn = Math.sin(a), up = f % 2 ? 0.05 : 0, L = 0.42 + R() * 0.1, dr = 0.16 + R() * 0.1 - up;
        const B = [cx + c * 0.02, 0.93, sn * 0.02], M = [cx + c * L * 0.5, 0.99 + up, sn * L * 0.5], Tp = [cx + c * L, 0.93 - dr, sn * L], w = 0.065 + R() * 0.02;
        const Ml = [M[0] - sn * w, M[1] - 0.02, M[2] + c * w], Mr = [M[0] + sn * w, M[1] - 0.02, M[2] - c * w];
        for (const [p, q, r] of [[B, Mr, M], [B, M, Ml], [M, Mr, Tp], [M, Tp, Ml]]) { g.tri(p, q, r, fr); g.tri(p, r, q, frD); }   // (both faces: a frond seen from below too)
      }
      if (!cheap) for (let q = 0; q < 4; q++) { const a = q / 4 * TAU + 0.4; ico(g, cx + Math.cos(a) * 0.03, 0.9, Math.sin(a) * 0.03, 0.022, 1, [0.36, 0.28, 0.12], R, 0.2); }
    } else if (k === 1) {   // a broadleaf tree of the tropics (a sea almond, a fig): a short trunk forking into three limbs, a wide crown of flat clumps in two tiers, some lighter, the inside dark
      cyl(g, 0, -0.02, 0, 0.05, 0.42, cheap ? 4 : 6, barkD, null, 0.04);
      if (!cheap) for (const [a, l] of [[0.4, 0.27], [2.5, 0.25], [4.4, 0.23]]) { const c = Math.cos(a), sn = Math.sin(a), w = 0.022, A = [0, 0.36, 0], B = [c * l, 0.6, sn * l], p = [-sn * w, 0, c * w];   // (a limb: a flat bar seen from both sides)
        g.quadO([A[0] - p[0], A[1], A[2] - p[2]], [A[0] + p[0], A[1], A[2] + p[2]], [B[0] + p[0], B[1], B[2] + p[2]], [B[0] - p[0], B[1], B[2] - p[2]], bark, [c * l * 0.5, 0.48, sn * l * 0.5 + 1]);
        g.quadO([A[0] - p[0], A[1], A[2] - p[2]], [A[0] + p[0], A[1], A[2] + p[2]], [B[0] + p[0], B[1], B[2] + p[2]], [B[0] - p[0], B[1], B[2] - p[2]], bark, [c * l * 0.5, 0.48, sn * l * 0.5 - 1]); }
      const LF = [[0.2, 0.37, 0.13], [0.25, 0.44, 0.16], [0.32, 0.5, 0.19], [0.22, 0.41, 0.15]];
      const cl = cheap ? [[0, 0.64, 0, 0.36, 0.6], [0.12, 0.8, 0.05, 0.24, 0.6]]
        : [[0.24, 0.62, 0.12, 0.26, 0.72], [-0.24, 0.63, 0.1, 0.25, 0.72], [-0.02, 0.61, -0.25, 0.26, 0.72], [0.02, 0.66, 0.28, 0.22, 0.72], [0.04, 0.8, 0.02, 0.26, 0.75]];   // (four round the lower tier, one on top)
      cl.forEach(([x, y, z, r, sy], q) => puff(g, x, y, z, r, sy, LF[q % 4], R, 0.22, 0.5, 1.12, !cheap));
    } else {   // a mangrove: arching stilt roots, a few crooked stems, a low dense crown, dark olive
      if (!cheap) for (let q = 0; q < 6; q++) { const a = q / 6 * TAU + R() * 0.5, c = Math.cos(a), sn = Math.sin(a), r0 = 0.32 + R() * 0.12, Tp = [0, 0.3, 0], M = [c * r0 * 0.55, 0.26, sn * r0 * 0.55], Bt = [c * r0, -0.05, sn * r0], w = 0.012;
        for (const [p, q2] of [[Tp, M], [M, Bt]]) { const A = [p[0] - sn * w, p[1], p[2] + c * w], Bq = [p[0] + sn * w, p[1], p[2] - c * w], C = [q2[0] + sn * w, q2[1], q2[2] - c * w], D = [q2[0] - sn * w, q2[1], q2[2] + c * w];
          g.tri(A, Bq, C, barkD); g.tri(A, C, D, barkD); g.tri(A, C, Bq, barkD); g.tri(A, D, C, barkD); } }
      cyl(g, 0, 0.2, 0, 0.04, 0.3, 4, barkD, null, 0.03);
      const cl = cheap ? [[0, 0.62, 0, 0.42]] : [[0, 0.6, 0, 0.4], [0.24, 0.55, 0.12, 0.28], [-0.24, 0.56, -0.08, 0.28], [0.04, 0.72, -0.2, 0.26]];
      cl.forEach(([x, y, z, r], q) => puff(g, x, y, z, r, 0.55, q % 2 ? [0.17, 0.28, 0.12] : [0.2, 0.31, 0.13], R, 0.3, 0.55, 1.05, false));
    }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function rioFlowerGeo() {   // a flowering tree (an ipe, a flame tree: the instance's colour is its bloom): a short dark trunk, a round crown of bloom over a little green
    const g = new GB(), R = rng(861);
    cyl(g, 0, -0.02, 0, 0.05, 0.45, 5, [0.3, 0.26, 0.2], null, 0.035);
    for (const [x, y, z, r] of [[0.18, 0.66, 0.08, 0.26], [-0.18, 0.67, 0.05, 0.25], [0, 0.65, -0.2, 0.25], [0.02, 0.8, 0.04, 0.27]]) puff(g, x, y, z, r, 0.75, [0.95, 0.95, 0.95], R, 0.25, 0.62, 1.1, false);
    for (const [x, y, z, r] of [[0.1, 0.55, 0.22, 0.17], [-0.2, 0.55, -0.12, 0.16]]) puff(g, x, y, z, r, 0.7, [0.3, 0.46, 0.2], R, 0.25, 0.55, 1.05, false);   // (green showing through underneath)
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  const RIO_BLOOM = [[1.0, 0.82, 0.16], [1.0, 0.86, 0.2], [0.82, 0.46, 0.78], [0.95, 0.56, 0.74], [0.92, 0.26, 0.12]];   // yellow and pink ipe, the red flame tree
  function rioTree(cl, R, far) {   // [species, height, width] of a tree on a spot of land cover class cl
    const f = far ? 1.08 : 1;
    if (cl === 2 && R() < 0.85) { const h = (4.5 + R() * 3) * f; return [2, h, h * (1.3 + R() * 0.4)]; }   // mangroves on the marsh
    if (!far && cl !== 2 && R() < 0.2) { const h = (8 + R() * 5) * f; return [3, h, h * (1.05 + R() * 0.25)]; }   // a flowering tree (near the track: seen from it and from above)
    if (R() < (cl === 1 ? 0.4 : 0.75)) { const h = (11 + R() * 9) * f; return [0, h, h * (0.44 + R() * 0.12)]; }   // a coconut palm
    const h = (9 + R() * 8) * f; return [1, h, h * (1.0 + R() * 0.3)];
  }
  let RIO_W = null;   // the lagoon of the last Rio build: its outline and box
  function rioWet(x, z, m) {   // on the lagoon, or within m metres of its shore
    const L = T.def.lagoon; if (!L) return false;
    if (!RIO_W || RIO_W.L !== L) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [a, b] of L.poly) { x0 = Math.min(x0, a); x1 = Math.max(x1, a); z0 = Math.min(z0, b); z1 = Math.max(z1, b); } RIO_W = { L, x0, x1, z0, z1 }; }
    const W = RIO_W; if (x < W.x0 - m || x > W.x1 + m || z < W.z0 - m || z > W.z1 + m) return false;
    return inPoly(L.poly, x, z) || (m > 0 && polyDist(L.poly, x, z) < m);
  }
  // the pit building of the 1970s behind the garages (c: buildRbring's pit helpers): a long block of bare concrete, the garages below (the
  // crews' open, in their team colours, the rest behind grey shutters), two floors of ribbon windows behind concrete fins, a flat roof with a
  // parapet (the podium's place), the race control tower at its end, the paddock behind with the teams' transporters. Returns the podium's place
  function rioPits(c) {
    const { PD, PB, hyS, atSf, kbox, kface, scen, board, AT, exclPush, TEAM, pq0, pq1, CR } = c, sStart = T.startS;
    RIO_PRE = { roof: 0 };
    const CON = [0.8, 0.78, 0.72], CONT = [0.72, 0.7, 0.66], CON2 = [0.86, 0.84, 0.79], GL = [0.17, 0.21, 0.25], SH = [0.66, 0.67, 0.68];
    const RF = [[0.5, 0.49, 0.46], [0.46, 0.45, 0.42], [0.53, 0.51, 0.47], [0.44, 0.44, 0.42], [0.49, 0.47, 0.43]];   // the flat roof, weathered grey bay by bay (the chase camera sees it from above, a wide plane by the straight)
    const gb = (s) => { const p = T.pitAt(s); return p && p.t > 0.999 ? p.o + 12.5 : null; };   // the garages' front (the apron's back edge)
    const crewQ = new Set(); for (let q = pq0, n = 0; q <= pq1 && n < 13; q += 10) { const p = T.pitAt(sStart + q); if (p && p.t >= 0.999) { crewQ.add(q); n++; } }
    let mid = null;
    for (let q = pq0 - Math.floor((pq0 - PB[0]) / 10) * 10; q < PB[1] - 5; q += 10) {   // (the bays line up with the crews' boxes)
      const s0 = sStart + q, f0 = gb(s0 + 5); if (f0 == null) continue;
      const ik = T.idx(s0 + 5), g = scen.get(T.px[ik] + T.nx[ik] * (f0 + 7), T.pz[ik] + T.nz[ik] * (f0 + 7)), crew = crewQ.has(q), k = crew ? ((q - pq0) / 10) | 0 : 0;
      for (const a of [0.12, 9.88]) kbox(g, s0, a, f0 + 4, 0, 0.25, 4.0, 8, CON, null, true);           // the garage's side walls
      kbox(g, s0, 5, f0 + 8, 0, 10.02, 4.0, 0.3, CON, null, true); kbox(g, s0, 5, f0 + 0.15, 3.3, 10.02, 0.7, 0.3, CON, null, true);   // its back wall, the header over the door
      kbox(g, s0, 5, f0 + 11.6, 0, 10.02, 4.0, 7.0, CONT, null, true);                                    // the offices behind
      if (crew) { kbox(g, s0, 5, f0 - 0.02, 3.42, 9.4, 0.5, 0.05, TEAM[k % TEAM.length]); kbox(g, s0, 5, f0 + 4, 0, 9.5, 0.03, 7.6, [0.36, 0.37, 0.38], null, true); }   // open: a band in the team's colour, the floor
      else { kface(g, s0, 0.3, 9.7, f0 + 0.32, 0.02, 3.3, SH); for (let y = 0.45; y < 3.3; y += 0.5) kface(g, s0, 0.3, 9.7, f0 + 0.31, y, y + 0.04, [0.55, 0.56, 0.58]); }   // a grey shutter
      kbox(g, s0, 5, f0 + 7.9, 4.0, 10.02, 8.0, 15.2, CON, CONT);                                         // the two floors above
      for (const y of [4.9, 8.9]) { kface(g, s0, 0.2, 9.8, f0 + 0.28, y, y + 2.4, GL); kbox(g, s0, 5, f0 + 0.2, y - 0.9, 10.02, 0.5, 0.4, CON2, null, true); }   // ribbon windows over a slab edge
      for (let a = 1.25; a < 10; a += 2.5) kbox(g, s0, a, f0 - 0.05, 4.0, 0.16, 8.0, 0.55, CON2, null, true);   // the concrete fins in front of them (against the sun)
      kbox(g, s0, 5, f0 + 7.9, 12.0, 10.02, 0.25, 15.6, CON2, RF[((q / 10) | 0) % RF.length]); kbox(g, s0, 5, f0 + 0.05, 12.25, 10.02, 1.0, 0.18, CON2);   // the roof and its parapet
      kbox(g, s0, 5, f0 - 0.06, 12.4, 10.02, 0.32, 0.05, [0.02, 0.5, 0.26], null, true); kbox(g, s0, 5, f0 - 0.06, 12.72, 10.02, 0.16, 0.05, [0.98, 0.82, 0.1], null, true);   // painted in green and yellow
      kbox(g, s0, 5, f0 + 0.3, 14.1, 10.02, 0.07, 0.07, [0.18, 0.34, 0.66], null, true); kbox(g, s0, 0.1, f0 + 0.3, 13.25, 0.06, 0.9, 0.06, [0.18, 0.34, 0.66], null, true);   // a blue railing over it
      if (((q / 10) | 0) % 4 === 1) { const [tx, tz] = atSf(s0 + 5, f0 + 11), ty = hyS(s0 + 5) + 12.25;   // on the roof: a blue water tank on a stand (as on every roof in Rio), a grey plant box
        box(g, tx, ty, tz, 2.6, 0.5, 2.6, T.hd[ik], [0.6, 0.6, 0.6]); cyl(g, tx, ty + 0.5, tz, 1.05, 1.3, 8, [0.16, 0.36, 0.7], [0.2, 0.42, 0.78], 0.95);
        const [ax, az] = atSf(s0 + 1.5, f0 + 6); box(g, ax, ty, az, 2.2, 1.0, 1.6, T.hd[ik], [0.62, 0.63, 0.64], [0.5, 0.51, 0.52]); }
      exclPush(T.px[ik] + T.nx[ik] * (f0 + 8), T.pz[ik] + T.nz[ik] * (f0 + 8), 12);
      if (q === pq0 + 60) mid = { s: s0 + 5, f0 };
    }
    { const s0 = sStart + PB[0] + 30, f0 = gb(s0); if (f0 != null) { const i = T.idx(s0), [x, z] = atSf(s0, f0 + 0.1), bk = RIO_BAN.findIndex(b => b[0] === 'RIO DE JANEIRO');   // the name on the parapet, towards the straight
      board(x, hyS(s0) + 12.4, z, T.nx[i], T.nz[i], 24, 2.2, AT.ban + bk); } }
    { const q = PB[1] + 2, s0 = sStart + q, f0 = gb(s0 - 20) || 30.5, o = f0 + 6, ik = T.idx(s0 + 5), g = scen.get(T.px[ik] + T.nx[ik] * o, T.pz[ik] + T.nz[ik] * o);   // race control: a concrete tower, a glazed cab on top
      kbox(g, s0, 5, o, 0, 8, 15.5, 8, CON, CONT); kbox(g, s0, 5, o, 15.5, 9.5, 0.4, 9.5, CON2); kbox(g, s0, 5, o, 15.9, 8.4, 3.2, 8.4, GL, CON2); kbox(g, s0, 5, o, 19.1, 9.6, 0.45, 9.6, CON2, [0.7, 0.69, 0.66]);
      { const [tx, tz] = atSf(s0 + 5, o + 1.5); cyl(g, tx, hyS(s0) + 19.55, tz, 1.0, 1.3, 8, [0.16, 0.36, 0.7], [0.2, 0.42, 0.78], 0.9); }   // (its water tank)
      for (let y = 2.5; y < 15; y += 4) kface(g, s0, 1.5, 8.5, o - 4.02, y, y + 1.6, GL);
      exclPush(T.px[ik] + T.nx[ik] * o, T.pz[ik] + T.nz[ik] * o, 12); }
    for (let q = PB[0], k = 0; q < PB[1]; q += 16, k++) {   // the paddock: the teams' box-bodied transporters of the time in rows
      const s0 = sStart + q, f = gb(s0) || 30.5, tc = TEAM[k % TEAM.length], [x, z, hd] = atSf(s0, f + 24), y = hyS(s0), g = scen.get(x, z);
      box(g, x, y + 0.5, z, 11, 3.4, 2.5, hd, [0.93, 0.93, 0.92], tc); box(g, x + Math.cos(hd) * 6.9, y + 0.5, z + Math.sin(hd) * 6.9, 2.4, 2.5, 2.5, hd, tc, tc);
      box(g, x + Math.cos(hd) * 8.1, y + 1.6, z + Math.sin(hd) * 8.1, 0.06, 0.9, 2.2, hd, [0.2, 0.24, 0.28]);   // (the windscreen)
      for (const wa of [-4, -2.8, 6.4]) for (const sd of [-1, 1]) box(g, x + Math.cos(hd) * wa - Math.sin(hd) * sd * 1.05, y, z + Math.sin(hd) * wa + Math.cos(hd) * sd * 1.05, 1.0, 1.0, 0.35, hd, [0.1, 0.1, 0.11]);
      exclPush(x, z, 8);
    }
    // the TV of the time by the race control tower: box vans with a dish on the roof, one with a mast for the link
    for (let k = 0; k < 4; k++) {
      const s0 = sStart + PB[1] - 14 - k * 9, f = gb(s0) || 30.5, [x, z, hd] = atSf(s0, f + 38), y = hyS(s0), g = scen.get(x, z), body = [0.94, 0.93, 0.88], band = [[0.12, 0.3, 0.62], [0.82, 0.16, 0.12], [0.1, 0.5, 0.3], [0.95, 0.7, 0.1]][k];
      box(g, x, y + 0.45, z, 5.6, 2.3, 2.2, hd, body, [0.85, 0.85, 0.82]); box(g, x, y + 1.25, z, 5.62, 0.3, 2.22, hd, band); box(g, x + Math.cos(hd) * 2.85, y + 1.3, z + Math.sin(hd) * 2.85, 0.06, 0.8, 1.9, hd, [0.2, 0.24, 0.28]);
      for (const wa of [-1.8, 1.8]) for (const sd of [-1, 1]) box(g, x + Math.cos(hd) * wa - Math.sin(hd) * sd * 0.95, y, z + Math.sin(hd) * wa + Math.cos(hd) * sd * 0.95, 0.75, 0.75, 0.3, hd, [0.1, 0.1, 0.11]);
      cyl(g, x - Math.cos(hd) * 1.2, y + 2.75, z - Math.sin(hd) * 1.2, 0.08, 0.5, 5, [0.6, 0.6, 0.62]); cyl(g, x - Math.cos(hd) * 1.2, y + 3.2, z - Math.sin(hd) * 1.2, 0.9, 0.12, 10, [0.9, 0.9, 0.9], [0.82, 0.82, 0.84], 0.55);   // the dish
      if (k === 1) { box(g, x + Math.cos(hd) * 1.2, y + 2.75, z + Math.sin(hd) * 1.2, 0.16, 7, 0.16, hd, [0.7, 0.7, 0.72]); box(g, x + Math.cos(hd) * 1.2, y + 9.5, z + Math.sin(hd) * 1.2, 0.6, 0.6, 0.6, hd, [0.9, 0.9, 0.9]); }
      exclPush(x, z, 5);
    }
    // people on the roof (it was full on race day), two rows behind the parapet facing the straight, none round the podium
    { const RR = rng(1983); let n = 0;
      for (let q = PB[0]; q < PB[1]; q += 1.1) { const s0 = sStart + q, f0 = gb(s0); if (f0 == null || (mid && Math.abs(s0 - mid.s) < 9)) continue;
        const i = T.idx(s0), y = hyS(s0) + 12.25;
        for (let r = 0; r < 2; r++) { if (RR() > 0.5 - r * 0.15) continue; const [x, z] = atSf(s0 + (RR() - 0.5) * 0.4, f0 + 0.8 + r * 1.05); if (crowdPut(CR, x, y, z, -T.nx[i], -T.nz[i], { flag: 0.14 }, r)) n++; } }
      RIO_PRE.roof = n; }
    return mid;
  }
  // the scenery round the circuit that buildRbring does not make: the lagoon, palms along the straights, hoardings, the mountains
  function rioExtra(scene, root, out, ownTex, tex, excluded, exclPush) {
    const def = T.def, L = def.lagoon, st = {}, R = rng(5203);
    rioWet(0, 0, 0);   // (the lagoon's box for this build)
    const skyT = def.sky ? rioSkyTex(def.sky, ownTex) : null;   // (the mountains mirrored in the lagoon)
    /* the lagoon: the water flat at its level, a shore band where it meets the terrain (the foam lapping at the waterline) */
    if (L) {
      const WO = { len: 1.4, amp: 0.55, refl: 0.42, land: 0.35, shal: 0.6, lap: 0.35, surf: 0, sky: skyT && { tex: skyT, col: scene.fog ? scene.fog.color : new THREE.Color(0xd3dfe6) } }, wMat = waterMat(tex, Object.assign({ color: 0x5a5e38 }, WO));   // (a murky green-brown lagoon, the mountains in it)
      const shape = L.poly.map(([x, z]) => new THREE.Vector2(x, z)), tri = THREE.ShapeUtils.triangulateShape(shape, []), g = new GB(true), W1 = [1, 1, 1];
      for (const [a, b, c] of tri) { const A = L.poly[a], B = L.poly[b], C = L.poly[c], P3 = (q) => [q[0], L.y, q[1]], U = (q) => [q[0] / 30, -q[1] / 30]; g.quadUp(P3(A), P3(B), P3(C), P3(C), [W1, W1, W1, W1], [U(A), U(B), U(C), U(C)]); }
      const m = new THREE.Mesh(g.geometry(), wMat); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m);
      // the shore band only where the terrain is drawn (the tiles near the track) and the shore runs through: the box round those tiles
      const G = API.NR.G, TL = NRC * NRT; let i0 = 1e9, j0 = 1e9, i1 = -1, j1 = -1;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { if (!nrTileOn(ti, tj)) continue;
        const cx = G.x0 + (ti + 0.5) * TL, cz = G.z0 + (tj + 0.5) * TL; if (polyDist(L.poly, cx, cz) > TL * 0.72 + 24) continue;
        i0 = Math.min(i0, ti * NRT); j0 = Math.min(j0, tj * NRT); i1 = Math.max(i1, (ti + 1) * NRT); j1 = Math.max(j1, (tj + 1) * NRT); }
      i1 = Math.min(i1, G.nx - 2); j1 = Math.min(j1, G.nz - 2);
      const band = i1 < 0 ? null : shoreBand(G.x0 + i0 * NRC, G.z0 + j0 * NRC, G.x0 + i1 * NRC, G.z0 + j1 * NRC, L.y + 0.015, waterline(nrGH, G.x0, G.z0, NRC, i0, i1, j0, j1, L.y), 30);
      addShore(root, band, wMat, WO); out.dyn.water = tex.water; st.water = tri.length;
    }
    /* palms in rows: along the paddock behind the pit building and behind the barrier on the infield side of the back straight */
    const pg = [new IChunks(rioTreeGeo(0), new THREE.MeshLambertMaterial({ vertexColors: true }), 128)];
    let nPalm = 0;
    const row = (d0, d1, side, off, step) => { for (let d = d0; d < d1; d += step) {
      const s = ((T.startS + d) % T.len + T.len) % T.len, i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + off), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
      if (excluded(x, z) || rioWet(x, z, 4)) continue; const h = 13 + R() * 5;
      pg[0].add(x, nrGround(x, z) - 0.1, z, R() * TAU, h * 0.5, h, [0.95 + R() * 0.1, 1, 0.95 + R() * 0.1]); exclPush(x, z, 2.5); nPalm++; } };
    if (def.pitBuilding) row(def.pitBuilding[0], def.pitBuilding[1], 1, 62, 14);
    row(1900, 2650, -1, 16, 18); row(300, 560, -1, 22, 20);
    for (const c of pg) c.addTo(root, true); st.palms = nPalm;
    /* the timing pylon of the time past the main stand, facing the pit straight: the running order as rows of car numbers in yellow bulbs
       on black (made-up numbers), the lap counter on top */
    { const [x, z, i] = rioPylon(), y = nrGround(x, z), H = 15, W = 2.8;
      if (!excluded(x, z)) {
        const c = document.createElement('canvas'); c.width = 128; c.height = 640; const q = c.getContext('2d'), RN = rng(1981);
        q.fillStyle = '#0c0d10'; q.fillRect(0, 0, 128, 640); q.fillStyle = '#ffd21f'; q.font = '900 46px "Russo One", "Arial Black", Arial, sans-serif'; q.textAlign = 'center'; q.textBaseline = 'middle';
        q.fillText('2', 64, 40); q.fillStyle = '#e8e8e2'; q.fillRect(10, 72, 108, 4);
        for (let k = 0; k < 10; k++) { q.fillStyle = '#ffd21f'; q.fillText(String(1 + Math.floor(RN() * 30)), 64, 112 + k * 52); }
        const t = ownTex(new THREE.CanvasTexture(c)), g = new GB(true), gp = new GB(), fx = T.nx[i], fz = T.nz[i], rx = -T.tx[i], rz = -T.tz[i];   // (its face towards the track; the reader's right against the traffic)
        const F = (u, v) => [x + fx * 0.62 + rx * (u - 0.5) * W, y + 3 + v * H, z + fz * 0.62 + rz * (u - 0.5) * W];
        g.quadO(F(0, 0), F(1, 0), F(1, 1), F(0, 1), [1, 1, 1], [x, y + 3 + H / 2, z], [[0, 0], [1, 0], [1, 1], [0, 1]]);
        box(gp, x, y + 2.9, z, W + 0.3, H + 0.3, 1.2, T.hd[i], [0.16, 0.17, 0.19], [0.3, 0.31, 0.33]);
        for (const sd of [-1, 1]) box(gp, x + rx * sd * 0.9, y - 0.2, z + rz * sd * 0.9, 0.35, 3.2, 0.35, T.hd[i], [0.62, 0.63, 0.66]);
        const mt = new THREE.Mesh(g.geometry(), new THREE.MeshBasicMaterial({ map: t })), mp = new THREE.Mesh(gp.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true }));
        for (const m of [mt, mp]) { m.castShadow = m === mp; m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
        exclPush(x, z, 5); st.pylon = 1;
      } }
    /* hoardings on posts behind the barrier of the back straight, facing the cars (the game's own invented brands, tex.sponsors) */
    { const gH = new GB(true), gP = new GB(); let n = 0;
      for (let d = 1980, k = 0; d < 2600; d += 90, k++) {
        const s = (T.startS + d) % T.len, i = T.idx(s), side = -1, o = side * (T.bl[i] + 6), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
        if (excluded(x, z)) continue; const y = nrGround(x, z), W = 7, H = 2.2, y0 = y + 2.2, rx = T.tx[i], rz = T.tz[i], cell = (k * 3) % 8, u0 = (cell % 2) * 0.5, v1 = 1 - Math.floor(cell / 2) * 0.25;
        const A = [x - rx * W / 2, y0, z - rz * W / 2], B = [x + rx * W / 2, y0, z + rz * W / 2], C = [B[0], y0 + H, B[2]], D = [A[0], y0 + H, A[2]];
        gH.quadO(B, A, D, C, [1, 1, 1], [x + T.nx[i] * side * 2, y0 + 1, z + T.nz[i] * side * 2], [[u0 + 0.5, v1 - 0.25], [u0, v1 - 0.25], [u0, v1], [u0 + 0.5, v1]]);
        for (const q of [-W / 2 + 0.4, W / 2 - 0.4]) box(gP, x + rx * q + T.nx[i] * side * 0.12, y - 0.2, z + rz * q + T.nz[i] * side * 0.12, 0.14, y0 - y + H + 0.2, 0.14, T.hd[i], [0.5, 0.5, 0.52]);
        box(gP, x + T.nx[i] * side * 0.06, y0 - 0.05, z + T.nz[i] * side * 0.06, W + 0.1, H + 0.1, 0.06, T.hd[i], [0.25, 0.26, 0.28]);   // (its back)
        exclPush(x, z, 5); n++;
      }
      if (n) { const mh = new THREE.Mesh(gH.geometry(), new THREE.MeshLambertMaterial({ map: tex.sponsors })), mp = new THREE.Mesh(gP.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true }));
        for (const m of [mh, mp]) { m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); } }
      st.hoardings = n; }
    /* the mountains round the basin: the skyline of def.sky in three bands (near, the massifs, the far ones) on a ring round the camera, the
       nearest drawn last; the colour is the haze's (the fog's) times a tint, so they fade with the time of day and the rain, a little lighter
       where the skyline is steep (bare granite) and into the haze at the foot */
    if (def.sky) {
      const meshes = [], NB = def.sky.ang.length, TINT = [[0.5, 0.6, 0.55], [0.66, 0.73, 0.72], [0.8, 0.85, 0.9], [0.88, 0.91, 0.95]], ROCK = [0.78, 0.78, 0.76], FOR = [0.36, 0.47, 0.38];
      const RN = rng(7741), fn = [...Array(64)].map(() => RN()), forest = (a) => { const f = a / TAU * 64, k = Math.floor(f), t = f - k; return lerp(fn[k % 64], fn[(k + 1) % 64], t * t * (3 - 2 * t)); };   // (patches of the Atlantic forest on the slopes)
      for (let b = NB - 1; b >= 0; b--) {
        const A0 = def.sky.ang[b], st = b === 1 ? 1 : Math.max(1, Math.round(A0.length / 360)), A = st > 1 ? A0.filter((v, k) => k % st === 0).map((v, k) => Math.max(...A0.slice(k * st, k * st + st))) : A0;   // (the massifs every half degree, the rest every degree)
        const n = A.length, pos = [], col = [], idx = [], tn = TINT[Math.min(b, 3)];
        for (let k = 0; k <= n; k++) {
          const a = (k % n) / n * TAU, sx = Math.sin(a), sz = -Math.cos(a), ang = Math.max(0, A[k % n] / 10) * Math.PI / 180, y = Math.tan(ang);   // (azimuth clockwise from north: north is -z)
          const w = Math.max(1, Math.round(n / 360)), stp = clamp(Math.abs(A[(k + 2 * w) % n] - A[(k + n - 2 * w) % n]) / 10 / (1.6 * 4 * w * 360 / n), 0, 1) * clamp(ang / 0.06, 0, 1), top = [lerp(tn[0], ROCK[0], stp * 0.6), lerp(tn[1], ROCK[1], stp * 0.6), lerp(tn[2], ROCK[2], stp * 0.6)];
          const fo = b < 3 ? (0.35 + 0.65 * forest(a + b)) * (b === 2 ? 0.45 : 0.75) * (1 - stp * 0.7) : 0, mid = [lerp(1, tn[0], 0.75), lerp(1, tn[1], 0.75), lerp(1, tn[2], 0.75)].map((v, q) => lerp(v, FOR[q] / tn[q] * v, fo));
          pos.push(sx, -0.02, sz, sx, y * 0.45, sz, sx, y, sz);
          col.push(1, 1, 1, mid[0], mid[1], mid[2], top[0], top[1], top[2]);
          if (k < n) { const v = k * 3; idx.push(v, v + 3, v + 1, v + 1, v + 3, v + 4, v + 1, v + 4, v + 2, v + 2, v + 4, v + 5); }
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
        const mat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
        const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = -53 + (NB - 1 - b); m.matrixAutoUpdate = false; root.add(m); meshes.push(m);
      }
      /* the band at the foot of it all: the low town and the trees of the plain round the basin (made up: blocks of houses and flats, clumps
         of trees), lower and thinner over the water in the south; drawn last of the skyline, so nothing white shows between the land and the hills */
      { const n = 480, pos = [], col = [], idx = [], RB = rng(7742), cb = [0.86, 0.9, 0.86]; let h = 0.2, kind = 0, left = 0;
        for (let k = 0; k < n; k++) {
          const a0 = k / n * TAU, a1 = (k + 1) / n * TAU, deg = a0 * 180 / Math.PI, sea = sstep(125, 145, deg) * (1 - sstep(225, 245, deg));
          if (--left <= 0) { kind = RB() < 0.45 - 0.3 * sea ? 1 : 0; left = 1 + Math.floor(RB() * (kind ? 3 : 4)); h = kind ? 0.22 + RB() * (0.42 - 0.3 * sea) : 0.14 + RB() * 0.14 - 0.06 * sea; }
          const y = Math.tan((h + (kind ? 0 : 0.03 * Math.sin(k * 2.3))) * Math.PI / 180), c = kind ? [0.9, 0.9, 0.86] : [0.74, 0.81, 0.74], v = pos.length / 3;
          pos.push(Math.sin(a0), -0.03, -Math.cos(a0), Math.sin(a1), -0.03, -Math.cos(a1), Math.sin(a1), y, -Math.cos(a1), Math.sin(a0), y, -Math.cos(a0)); col.push(...cb, ...cb, ...c, ...c);   // (a quad per step: the blocks' sides square)
          idx.push(v, v + 1, v + 2, v, v + 2, v + 3);
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
        const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, depthWrite: false, depthTest: false, side: THREE.DoubleSide })); m.frustumCulled = false; m.renderOrder = -49; m.matrixAutoUpdate = false; root.add(m); meshes.push(m); st.band = n; }
      out.dyn.skyline = { meshes, fog: scene.fog }; st.skyline = meshes.length;
    }
    out.dyn.rio = rioMore(scene, root, out, ownTex, tex, excluded, exclPush, st);   // round 2: the kart track, the convention centre, life on the lagoon, the mist, the heat, the samba
    return st;
  }
  function rioPylon(px, pz) {   // the timing pylon's place (175 m after the start line, 9 m behind the left barrier); with a point: whether a tree there would hide it
    const i = T.idx((T.startS + 175) % T.len), o = -(T.bl[i] + 9), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
    return px == null ? [x, z, i] : Math.hypot(px - x - T.nx[i] * 6, pz - z - T.nz[i] * 6) < 16;   // (a circle round it and towards the track)
  }
  function rioSkyline(S, cam) {   // the mountains' ring round the camera, as big as the view reaches, in the haze's colour
    if (!cam) return;
    const r = cam.far * 0.9;
    for (const m of S.meshes) { m.position.set(cam.position.x, cam.position.y, cam.position.z); m.scale.setScalar(r); m.updateMatrix(); if (S.fog) m.material.color.copy(S.fog.color); }
  }
  /* ---- Rio, round 3: the ground the chase camera sees (it looks down on the flat basin: the road and 80-160 m of land round it, no sky).
     rioGround: the ground's material (the terrain and the verges) paints the open land in patches finer than the terrain's 8 m cells, in
     world space from a small tileable noise map (no more draws): the tropical grass burnt straw-yellow in places, darker lush clumps, the
     pale sand of the old marsh showing through, and the worn verges (rioVerge tints them: the shader reads the tint as dust); rioVerge: the
     grass along the asphalt worn to dust where the wheels run off, more on the outside of the corners' exits ---- */
  const RIO_UU = { s: 6031 };
  function rioOwn(fn) {   // THREE objects made here named without Math.random (generateUUID draws from it: the race with a seed stays the same)
    const r = Math.random; Math.random = () => { RIO_UU.s = (RIO_UU.s * 48271) % 2147483647; return RIO_UU.s / 2147483647; };
    try { return fn(); } finally { Math.random = r; }
  }
  function rioNoiseTex() {   // 128 px, tileable: r, g, b three independent value noises (4, 8 and 16 cells across, summed), a the fine grain
    const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data;
    const oct = (g, seed) => { const r = rng(seed), v = new Float32Array(g * g); for (let k = 0; k < v.length; k++) v[k] = r();
      return (u, w) => { const a = u * g, b = w * g, i = Math.floor(a), j = Math.floor(b), fu = a - i, fv = b - j, su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv), at = (p, q) => v[(q % g) * g + (p % g)];
        return lerp(lerp(at(i, j), at(i + 1, j), su), lerp(at(i, j + 1), at(i + 1, j + 1), su), sv); }; };
    const N = [0, 1, 2].map(ch => [oct(4, 6110 + ch), oct(8, 6120 + ch), oct(16, 6130 + ch)]), g = rng(6140);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const u = i / S, v = j / S, o = (j * S + i) * 4;
      for (let ch = 0; ch < 3; ch++) { const n = N[ch][0](u, v) * 0.5 + N[ch][1](u, v) * 0.3 + N[ch][2](u, v) * 0.2; d[o + ch] = clamp(Math.round((0.5 + (n - 0.5) * 1.7) * 255), 0, 255); }   // (stretched: the sums crowd round the middle)
      d[o + 3] = Math.round(g() * 255);
    }
    x.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.premultiplyAlpha = false; return t;
  }
  function rioGround(m, ownTex) {   // (in place of World's grassLook for this material, with what it does: grassLook leaves a material it has marked)
    const nt = rioOwn(() => ownTex(rioNoiseTex()));
    m.userData.grassLook = true;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uRioN = { value: nt };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vRioW; varying float vRioD;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvRioW = (modelMatrix * vec4(transformed, 1.0)).xz; vRioD = -mvPosition.z;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uRioN;\nvarying vec2 vRioW; varying float vRioD;')
        .replace('#include <color_fragment>', `#include <color_fragment>
        {
          vec4 nA = texture2D(uRioN, vRioW * 0.0071), nB = texture2D(uRioN, vRioW * 0.031 + nA.gb * 0.35), nC = texture2D(uRioN, vRioW * 0.13), nD = texture2D(uRioN, vRioW * 0.47);
          float near = 1.0 - smoothstep(70.0, 160.0, vRioD);
          vec3 cg = diffuseColor.rgb; float gg = clamp((cg.g - max(cg.r, cg.b)) * 8.0, 0.0, 1.0);   // (where it is green)
          cg *= mix(1.0, 0.86 + 0.28 * (nA.b * 0.6 + nB.b * 0.4), gg);   // lighter and darker patches, tens of metres across
          cg *= 1.0 + gg * (nD.r * 0.6 + nC.a * 0.4 - 0.5) * 0.24 * near;   // clumps a metre or two across (near: far away they would shimmer)
          float L = dot(cg, vec3(0.3, 0.59, 0.11)); cg = mix(cg, mix(vec3(L), cg, 0.72) * vec3(1.04, 0.96, 0.86), gg * 0.75);   // the loud green toned down
          float lum = dot(cg, vec3(0.299, 0.587, 0.114));
          float dry = smoothstep(0.5, 0.72, nA.r * 0.55 + nB.g * 0.45) * gg;   // burnt straw-yellow
          float lush = smoothstep(0.58, 0.8, nA.g * 0.45 + nB.b * 0.55) * (1.0 - dry) * gg;   // dark lush clumps
          float sand = smoothstep(0.58, 0.9, nB.r * 0.75 + nC.g * 0.25) * smoothstep(0.2, 0.9, dry) * 0.75;   // bare sand in the dry patches, soft-edged
          float dust = smoothstep(1.16, 1.5, vColor.r / max(vColor.g, 0.05));   // a worn verge (rioVerge's tint)
          sand = max(sand, dust * (0.65 + 0.35 * nD.g));
          cg = mix(cg, vec3(lum) * vec3(1.36, 1.12, 0.62), dry * 0.55);
          cg *= vec3(0.84, 0.91, 0.88) + vec3(0.16, 0.09, 0.12) * (1.0 - lush);
          diffuseColor.rgb = mix(cg, diffuse * vec3(0.8, 0.73, 0.58) * clamp(lum * 2.3, 0.45, 1.15) * (0.86 + 0.28 * nD.b), sand * 0.85);
        }`);
    };
    m.customProgramCacheKey = () => 'rioGroundN';   // (N: its loud green toned down, as grassLook's)
  }
  function rioRoad(i, o, k) {   // the asphalt's tone across the road (k as buildRbring shades it): the old surface of the 1980s in blotches of
    // lighter, sun-bleached and darker, patched binder tens of metres across, and paler along the edges, where the wheels seldom run
    const P = API.NR, x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, a = Math.abs(o) / T.w;
    return k * (1.03 + (P.n3(x * 1.6 + 51, z * 1.6) - 0.5) * 0.26 + (P.n4(x * 1.4 + 17, z * 1.4 - 9) - 0.5) * 0.12 + 0.07 * sstep(0.72, 1, a));
  }
  function rioApron(q) {   // the pit apron's concrete (a 2 m strip at q metres from the start line): grey, weathered, in 6 m slabs of their own tone, darker
    // where the cars stand (towards the lane); in the sun from above a wide pale plane by the straight
    const k = 0.55 + 0.05 * crH(Math.floor(q / 6), 7, 113), a = [k, k, k * 0.95], b = [k * 0.92, k * 0.9, k * 0.85];
    return [b, a, a, b];
  }
  let RIO_EX = null;   // the corners' exits of the last Rio build: per side, how much the verge is worn on the outside
  function rioVerge(cols, pr, nb, i, side) {   // the verge row's colours (pr: [offset, height] across it; up to nb its own strip): dust along the edge
    if (!RIO_EX || RIO_EX.T !== T) {
      const N = T.N, ex = [new Float32Array(N), new Float32Array(N)];
      for (let k = 0; k < N; k++) { const a = Math.abs(T.k[k]); if (a < 1 / 160) continue; const si = T.k[k] > 0 ? 0 : 1, f = sstep(1 / 160, 1 / 60, a);   // (the outside: left of a right-hander)
        for (let q = 0; q < 26; q++) { const j = (k + q) % N, v = f * (1 - q / 26); if (v > ex[si][j]) ex[si][j] = v; } }   // (and 50 m on past it)
      RIO_EX = { T, ex };
    }
    const w = T.w, e = RIO_EX.ex[side > 0 ? 1 : 0][i], wob = 0.5 + 0.5 * Math.sin(i * 0.37 + side) * Math.sin(i * 0.11), dc = [1.42, 0.98, 0.6];
    for (let k = 0; k <= nb; k++) {
      const o = pr[k][0], f = sstep(w + 0.9 + 2.6 * e + 0.5 * wob, w + 0.05, o) * (0.55 + 0.25 * wob + 0.2 * e), c = cols[k];
      if (f > 0.01) cols[k] = [lerp(c[0], dc[0], f), lerp(c[1], dc[1], f), lerp(c[2], dc[2], f)];
    }
  }
  /* ---- Rio, round 2: more round the circuit. rioPre (before the trees and the crowd layer): the kart track's ground kept clear, the samba
     group by the main stand, the people on the banks; rioMore (from rioExtra): the kart track and its karts, the convention centre and its car
     park in the west, boats on the lagoon, egrets wading at its edge and cormorants over it, the mist over the water in the morning and in the
     rain, the heat shimmering over the straights, the samba group's drums; rioStep (World.update): what moves ---- */
  let RIO_PRE = null;   // what rioPits and rioPre placed for rioMore (this build's)
  // the kart track by Turn 3 (the corner was named after it; its shape is not in the open data: a made-up twisty loop of ~0.6 km, 7 m wide):
  // its corners, metres from its centre
  const RIO_KART = [[-27, -92], [25, -92], [30, -75], [8, -55], [8, -35], [28, -20], [28, 35], [10, 48], [-5, 62], [22, 78], [18, 93], [-27, 93], [-30, 60], [-12, 30], [-28, 0], [-28, -40], [-12, -55], [-30, -72]];
  function rioKartLine(cx, cz, a, step) {   // the loop round its corners (Catmull-Rom), about every step metres
    const c = Math.cos(a), s = Math.sin(a), P = RIO_KART.map(([u, v]) => [cx + u * c - v * s, cz + u * s + v * c]), n = P.length, out = [];
    for (let k = 0; k < n; k++) {
      const p0 = P[(k + n - 1) % n], p1 = P[k], p2 = P[(k + 1) % n], p3 = P[(k + 2) % n], m = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
      for (let j = 0; j < m; j++) { const t = j / m, t2 = t * t, t3 = t2 * t, f = (q) => 0.5 * (2 * p1[q] + (p2[q] - p0[q]) * t + (2 * p0[q] - 5 * p1[q] + 4 * p2[q] - p3[q]) * t2 + (3 * p1[q] - p0[q] - 3 * p2[q] + p3[q]) * t3); out.push([f(0), f(1)]); }
    }
    return out;
  }
  // before the trees: the kart track where its loop keeps clear of the circuit (in the free infield west of Turns 2 and 3), the samba group
  // by the main stand (in front of its start, facing the straight: dancers in the colours of the flag), people on the banks at Turns 2, 7, 10
  function rioPre(CR, run, exclPush, sStart) {
    const P = RIO_PRE = Object.assign(RIO_PRE || {}, { kart: null, samba: null, bank: 0 });
    let best = null, bs = -1e9;
    for (const a of [-0.15, 0, 0.15]) for (let cx = -10; cx <= 60; cx += 10) for (let cz = 290; cz <= 420; cz += 10) {
      const L = rioKartLine(cx, cz, a, 6); let m = 1e9;
      for (const [x, z] of L) { m = Math.min(m, nrNear(x, z).dd); if (m < 9 || rioWet(x, z, 10)) { m = -1; break; } }
      const sc = Math.min(m, 24) - 0.03 * Math.hypot(cx - 25, cz - 360);
      if (m >= 9 && sc > bs) { bs = sc; best = { cx, cz, a, clear: m }; }
    }
    if (best) {
      const L = best.line = rioKartLine(best.cx, best.cz, best.a, 1.5), c = Math.cos(best.a), s = Math.sin(best.a);
      for (let k = 0; k < L.length; k += 4) exclPush(L[k][0], L[k][1], 8);
      best.hut = [best.cx + 2 * c - 2 * s, best.cz + 2 * s + 2 * c]; exclPush(best.hut[0], best.hut[1], 10);   // (the timing hut and a small stand inside the loop)
      P.kart = best;
    }
    { const pal = [[0.98, 0.84, 0.1], [0.05, 0.55, 0.25], [0.96, 0.96, 0.93], [0.98, 0.55, 0.1], [0.12, 0.3, 0.7]], spots = []; let cx = 0, cz = 0, hd = 0;   // (on a stage 1.2 m high: over the wall)
      for (let r = 0; r < 3; r++) for (let k = 0; k < 7; k++) {
        const q = crAt(sStart - 282 + k * 1.7 + (r % 2) * 0.85); if (!q) continue;
        const off = q.bl + 5.5 + r * 1.6, x = q.px - q.nx * off, z = q.pz - q.nz * off, nx = q.nx, nz = q.nz;
        if (!hd) hd = Math.atan2(q.tz, q.tx); if (crowdPut(CR, x, nrGround(x, z) + 1.2, z, nx, nz, { pose: r === 0 ? 4 : 1 + ((r + k) % 2), col: pal[(r * 7 + k) % pal.length], flag: 0 }, r)) { spots.push([x, z, r, nx, nz]); cx += x; cz += z; } }
      if (spots.length) { P.samba = { spots, x: cx / spots.length, z: cz / spots.length, hd }; exclPush(P.samba.x, P.samba.z, 10); } }
    P.posts = [];   // the marshals' posts: a hut with an orange roof outside each turn, past its apex (seen from above), clear of the run-off and the crowds
    for (const [ax, az] of T.def.turns || []) { const q = T.query(ax, az, -1, {}); if (!q || q.i < 0) continue; const k0 = T.k[T.idx(q.s)], sd = k0 > 0 ? -1 : 1;
      for (const d of [28, 48, 70]) { const i = T.idx(q.s + d), o = sd * ((sd > 0 ? T.br[i] : T.bl[i]) + 4), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
        if (rioWet(x, z, 4) || nrNear(x, z).dd < 2.5 || P.posts.some(([px, pz]) => Math.hypot(px - x, pz - z) < 30)) continue;
        P.posts.push([x, z, T.hd[i]]); exclPush(x, z, 4.5); break; } }
    for (const [a, b, sd] of [[620, 760, -1], [2940, 3080, 1], [4010, 4150, -1]]) P.bank += run(a, b, sd, { rows: 4, dens: 0.3, gap: 1.3, clump: 0.8, label: 'RIO bank' });
    return P;
  }
  function rioKartGeo() {   // a kart (x forward, 1.8 m): the low frame, the side pods and nose in its colour (white here: the instance's colour tints it), four fat tyres, the driver's helmet
    const g = new GB(), W = [0.95, 0.95, 0.95], K = [0.08, 0.08, 0.09], S = [0.2, 0.2, 0.22];
    box(g, 0, 0.1, 0, 1.5, 0.08, 0.9, 0, S); box(g, 0.78, 0.12, 0, 0.3, 0.2, 0.86, 0, W); for (const sd of [-1, 1]) box(g, -0.05, 0.12, sd * 0.52, 0.8, 0.16, 0.12, 0, W);
    for (const [x, z] of [[0.55, 0.62], [0.55, -0.62], [-0.6, 0.66], [-0.6, -0.66]]) box(g, x, 0.02, z, 0.27, 0.26, z > 0 ? 0.2 : 0.2, 0, K);
    box(g, -0.25, 0.18, 0, 0.5, 0.3, 0.42, 0, [0.15, 0.15, 0.17]); box(g, -0.12, 0.45, 0, 0.3, 0.3, 0.4, 0, [0.22, 0.24, 0.3]); ico(g, -0.06, 0.82, 0, 0.15, 1, W, rng(19), 0.05);
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function rioBoatGeo() {   // a small wooden fishing boat (x forward, 5 m): the hull with a pointed bow, a thwart, a fisherman sitting with his oars, a net in a heap
    const g = new GB(), Wd = [0.95, 0.95, 0.95], In = [0.62, 0.6, 0.55], In2 = [0.5, 0.48, 0.44], H = 0.5, Bm = 0.68;
    const half = (x) => x > 1.2 ? Bm * Math.max(0, (2.5 - x) / 1.3) : Bm;
    const xs = [-2.4, -1.4, -0.2, 0.8, 1.2, 1.7, 2.1, 2.5];
    for (let k = 0; k < xs.length - 1; k++) { const a = xs[k], b = xs[k + 1];
      for (const sd of [-1, 1]) { g.quadO([a, H, sd * half(a)], [b, H + (b > 1.7 ? 0.12 : 0), sd * half(b)], [b, 0, sd * half(b) * 0.55], [a, 0, sd * half(a) * 0.55], Wd, [ (a + b) / 2, 0.3, 0]);   // the sides (white outside: the instance's paint)
        g.quadO([a, H - 0.02, sd * half(a) * 0.97], [b, H - 0.02 + (b > 1.7 ? 0.12 : 0), sd * half(b) * 0.97], [b, 0.08, sd * half(b) * 0.5], [a, 0.08, sd * half(a) * 0.5], In2, [ (a + b) / 2, 0.3, sd * 3]); }   // and inside
      g.quadO([a, 0.08, -half(a) * 0.5], [b, 0.08, -half(b) * 0.5], [b, 0.08, half(b) * 0.5], [a, 0.08, half(a) * 0.5], In, [(a + b) / 2, -1, 0]); }   // the bottom boards
    g.quadO([-2.4, H, -Bm], [-2.4, H, Bm], [-2.4, 0, Bm * 0.55], [-2.4, 0, -Bm * 0.55], Wd, [0, 0.3, 0]);   // the transom
    box(g, -0.3, 0.3, 0, 0.3, 0.06, 1.3, 0, In); box(g, -0.3, 0.36, 0, 0.36, 0.5, 0.4, 0, [0.85, 0.35, 0.2]); ico(g, -0.3, 0.98, 0, 0.13, 1, [0.45, 0.3, 0.2], rng(31), 0.05);   // thwart, the fisherman (a red shirt), his head
    box(g, -0.32, 1.08, 0, 0.36, 0.06, 0.36, 0, [0.85, 0.8, 0.6]);   // (a straw hat)
    for (const sd of [-1, 1]) box(g, 0.1, 0.62, sd * 0.95, 2.6, 0.05, 0.05, sd * 0.25, [0.6, 0.48, 0.32]);   // the oars, shipped
    ico(g, 1.0, 0.2, 0, 0.3, 0.45, [0.3, 0.38, 0.35], rng(32), 0.4);   // the net
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function rioEgretGeo() {   // a great egret (0.9 m tall): a white body, the long S of the neck, a yellow bill, black legs
    const g = new GB(), Wh = [0.96, 0.96, 0.94], K = [0.1, 0.1, 0.1], Y = [0.95, 0.75, 0.15];
    API.ROCK_SMOOTH = true; ico(g, 0, 0.62, 0, 0.17, 0.62, Wh, rng(41), 0.05); API.ROCK_SMOOTH = false;
    box(g, 0.13, 0.66, 0, 0.06, 0.24, 0.06, 0, Wh); box(g, 0.1, 0.86, 0, 0.06, 0.14, 0.06, 0, Wh); box(g, 0.13, 0.98, 0, 0.12, 0.07, 0.07, 0, Wh); box(g, 0.27, 0.99, 0, 0.16, 0.025, 0.025, 0, Y);
    box(g, -0.18, 0.6, 0, 0.16, 0.05, 0.12, 0, Wh); for (const sd of [-0.05, 0.05]) box(g, 0, 0, sd, 0.03, 0.56, 0.03, 0, K);
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function rioCormGeo() {   // a cormorant in flight (x forward, wingspan 1.3 m): black, the long neck stretched out, the wings flat (rioStep's shader beats them)
    const g = new GB(), K = [0.09, 0.09, 0.1], Kb = [0.16, 0.15, 0.13];
    box(g, -0.05, -0.06, 0, 0.6, 0.12, 0.13, 0, K); box(g, 0.36, -0.03, 0, 0.26, 0.06, 0.06, 0, K); box(g, 0.52, -0.02, 0, 0.1, 0.07, 0.07, 0, Kb); box(g, -0.42, -0.05, 0, 0.2, 0.03, 0.14, 0, K);
    for (const sd of [-1, 1]) { const A = [0.1, 0, sd * 0.06], B = [-0.12, 0, sd * 0.06], C = [-0.14, 0.04, sd * 0.65], D = [0.02, 0.04, sd * 0.63]; g.quadO(A, B, C, D, K, [0, -1, sd * 0.5]); g.quadO(A, B, C, D, Kb, [0, 1, sd * 0.5]); }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function rioSkyTex(S, ownTex) {   // the skyline for the water's reflection: per azimuth (512 across, clockwise from north) its height (r: / 10°) and how far the top band is (g)
    const N = 512, D = new Uint8Array(N * 4), nb = S.ang.length, n = S.ang[0].length;
    for (let u = 0; u < N; u++) { const f = u / N * n, k = Math.floor(f), t = f - k; let a = -1, bb = 0;
      for (let b = 0; b < nb; b++) { const A = S.ang[b], v = (A[k % n] * (1 - t) + A[(k + 1) % n] * t) / 10; if (v > a + 0.05) { a = v; bb = b; } }
      D[u * 4] = Math.round(clamp(a / 10, 0, 1) * 255); D[u * 4 + 1] = Math.round(bb / Math.max(1, nb - 1) * 255); D[u * 4 + 3] = 255; }
    const t = ownTex(new THREE.DataTexture(D, N, 1, THREE.RGBAFormat)); t.wrapS = THREE.RepeatWrapping; t.magFilter = t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
    return t;
  }
  // the scenery of round 2 (rioExtra's helpers and data: L the lagoon, st its stats); returns the moving parts for rioStep
  function rioMore(scene, root, out, ownTex, tex, excluded, exclPush, st) {
    const def = T.def, L = def.lagoon, P = RIO_PRE || {}, R = rng(6021), D = { t: 0, tw: -1, mA: 0, hA: 0, mistT: 0, heatT: 0, m4: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(0, 0, 0, 'YXZ'), v: new THREE.Vector3(), sc: new THREE.Vector3(1, 1, 1) };
    const near = new GB(), far = new GB(), matV = new THREE.MeshLambertMaterial({ vertexColors: true }), matI = new THREE.MeshLambertMaterial({ vertexColors: true });   // (matI: the instanced ones, all with their own colours)
    const tdist = (x, z) => { let d = 1e9; for (let i = 0; i < T.N; i += 4) d = Math.min(d, (T.px[i] - x) ** 2 + (T.pz[i] - z) ** 2); return Math.sqrt(d); };   // (metres to the track: for what should be seen from it)
    /* the kart track: the asphalt and its kerbs (one mesh over the ground), tyre walls on the outside of its bends, the timing hut and a little
       stand inside the loop; five karts lapping it */
    const K = P.kart;
    if (K) {
      const Ln = K.line, n = Ln.length, ga = new GB(), Ay = (x, z) => nrGround(x, z) + 0.12, nr = [], cv = [];
      for (let k = 0; k < n; k++) { const a = Ln[(k + n - 1) % n], b = Ln[(k + 1) % n], tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1; nr.push([-tz / l, tx / l]); }
      for (let k = 0; k < n; k++) { const a = nr[(k + n - 1) % n], b = nr[(k + 1) % n], ds = Math.hypot(Ln[(k + 1) % n][0] - Ln[(k + n - 1) % n][0], Ln[(k + 1) % n][1] - Ln[(k + n - 1) % n][1]) || 1; cv.push((a[0] * b[1] - a[1] * b[0]) / ds); }
      const W = 3.6, pt = (k, o, dy) => { const p = Ln[k % n], q = nr[k % n], x = p[0] + q[0] * o, z = p[1] + q[1] * o; return [x, Ay(x, z) + (dy || 0), z]; };
      let tyres = 0;
      for (let k = 0; k < n; k++) {
        const j = (k + 1) % n, sh = 0.3 + 0.025 * Math.sin(k * 0.37) + (R() - 0.5) * 0.02, A1 = [sh, sh, sh * 1.04];
        ga.quadUp(pt(k, -W), pt(j, -W), pt(j, W), pt(k, W), [A1, A1, A1, A1]);
        const c = cv[k], sd = c > 0 ? -1 : 1;   // the kerb on the outside of a bend: red and white
        if (Math.abs(c) > 1 / 22) { const col = Math.floor(k / 2) % 2 ? [0.85, 0.12, 0.1] : [0.95, 0.95, 0.93]; ga.quadUp(pt(k, sd * W, 0.02), pt(j, sd * W, 0.02), pt(j, sd * (W + 0.9), 0.02), pt(k, sd * (W + 0.9), 0.02), [col, col, col, col]);
          if (k % 3 === 0) { const [x, y, z] = pt(k, sd * (W + 3.2)); if (nrNear(x, z).dd > 3) { for (let h = 0; h < 2; h++) cyl(near, x, y - 0.1 + h * 0.26, z, 0.33, 0.26, 6, h % 2 ? [0.12, 0.12, 0.13] : [0.08, 0.08, 0.09], [0.04, 0.04, 0.05]); tyres++; } } }
        if (k === 0) for (let q = -3; q < 3; q++) for (let r = 0; r < 2; r++) { const col = (q + r) % 2 ? [0.08, 0.08, 0.08] : [0.95, 0.95, 0.95], o0 = q * 1.2, o1 = o0 + 1.2;   // the chequered line
          ga.quadUp(pt(k + r, o0, 0.03), pt(k + r + 1, o0, 0.03), pt(k + r + 1, o1, 0.03), pt(k + r, o1, 0.03), [col, col, col, col]); }
      }
      const am = new THREE.Mesh(ga.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 })); am.receiveShadow = true; am.matrixAutoUpdate = false; root.add(am);
      { const [hx, hz] = K.hut, y = nrGround(hx, hz), hd = K.a;   // the hut (white, a flat roof, a window band) and a stand of five steps beside it
        box(near, hx, y, hz, 7, 3, 4, hd, [0.92, 0.9, 0.84], [0.6, 0.58, 0.55]); box(near, hx + Math.cos(hd) * 0.01, y + 1.3, hz, 7.04, 0.9, 4.04, hd, [0.2, 0.26, 0.3]); box(near, hx, y + 3, hz, 7.8, 0.2, 4.8, hd, [0.7, 0.68, 0.64]);
        for (let s = 0; s < 5; s++) box(near, hx - Math.sin(hd) * (6 + s * 0.8), y, hz + Math.cos(hd) * (6 + s * 0.8), 10, 0.4 + s * 0.4, 0.8, hd, [0.74, 0.73, 0.7]); }
      // the karts: the line again every metre (where each is: its distance along it), five of them at their own pace
      const U = [], Hd = []; let acc = 0; U.push(Ln[0]); Hd.push(0);
      for (let k = 1; k <= n && U.length < 5000; k++) { const a = Ln[k - 1], b = Ln[k % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]); acc += l; while (acc >= U.length) { const t = 1 - (acc - U.length) / (l || 1); U.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } }
      for (let k = 0; k < U.length; k++) { const a = U[(k + U.length - 2) % U.length], b = U[(k + 2) % U.length]; Hd[k] = Math.atan2(b[1] - a[1], b[0] - a[0]); }
      const im = new THREE.InstancedMesh(rioKartGeo(), matI, 5), cols = [[0.9, 0.15, 0.12], [0.98, 0.8, 0.1], [0.15, 0.4, 0.85], [0.1, 0.6, 0.3], [0.95, 0.5, 0.1]], c3 = new THREE.Color();
      for (let k = 0; k < 5; k++) { c3.setRGB(...cols[k]); im.setColorAt(k, c3); }
      im.instanceColor.needsUpdate = true; im.castShadow = false; im.frustumCulled = false; root.add(im);
      D.karts = { im, U, Hd, Y: U.map(([x, z]) => Ay(x, z)), v: [13.2, 13.8, 12.6, 14.1, 13.5], o: [0, 21, 45, 66, 90] };
      st.kart = Math.round(acc); st.tyres = tyres;
    }
    /* the convention centre (opened in 1977) west of the circuit: its car park with rows of cars and its five low halls (def.conv: OpenStreetMap
       2012). 1-2 km out, past the view's reach: drawn shrunk towards the camera (rioStep), so it stands on the screen where it really is */
    if (def.conv) {
      const C = def.conv, ga = new GB(), Gr = [0.36, 0.36, 0.37], gy = (x, z) => nrGround(x, z);
      const flat = (poly, y, col) => { const tri = THREE.ShapeUtils.triangulateShape(poly.map(([x, z]) => new THREE.Vector2(x, z)), []); for (const [a, b, c] of tri) ga.triO([poly[a][0], y, poly[a][1]], [poly[b][0], y, poly[b][1]], [poly[c][0], y, poly[c][1]], col, [poly[a][0], y - 5, poly[a][1]]); };
      let y0 = 0, n0 = 0; for (const [x, z] of C.lot) { y0 += gy(x, z); n0++; } y0 /= n0;
      flat(C.lot, y0 + 0.1, Gr);
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of C.lot) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      for (let z = z0 + 8; z < z1 - 4; z += 16) { const P = (x) => [x, y0 + 0.13, z];   // the car park's white lines between the rows (no cars: 1-2 km out they would not show)
        for (let x = x0; x < x1; x += 4) if (inPoly(C.lot, x, z) && inPoly(C.lot, x + 4, z)) ga.quadUp(P(x), P(x + 4), [x + 4, y0 + 0.13, z + 0.25], [x, y0 + 0.13, z + 0.25], [[0.85, 0.85, 0.82], [0.85, 0.85, 0.82], [0.85, 0.85, 0.82], [0.85, 0.85, 0.82]]); }
      for (const [h, poly] of C.halls) {   // a hall: bare concrete walls, a dark band of glass under the eaves, a flat roof a little over them
        let cx = 0, cz = 0; for (const [x, z] of poly) { cx += x; cz += z; } cx /= poly.length; cz /= poly.length; const inn = [cx, y0 + h / 2, cz], n = poly.length;
        for (let k = 0; k < n; k++) { const [ax, az] = poly[k], [bx, bz] = poly[(k + 1) % n];
          ga.quadO([ax, y0, az], [bx, y0, bz], [bx, y0 + h - 2.4, bz], [ax, y0 + h - 2.4, az], [0.84, 0.82, 0.76], inn);
          ga.quadO([ax, y0 + h - 2.4, az], [bx, y0 + h - 2.4, bz], [bx, y0 + h - 0.6, bz], [ax, y0 + h - 0.6, az], [0.24, 0.28, 0.32], inn);
          ga.quadO([ax, y0 + h - 0.6, az], [bx, y0 + h - 0.6, bz], [bx, y0 + h, bz], [ax, y0 + h, az], [0.8, 0.78, 0.74], inn); }
        flat(poly, y0 + h, [0.68, 0.67, 0.64]); }
      const g = ga.geometry(); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, depthWrite: false })); m.renderOrder = -45; m.matrixAutoUpdate = false; root.add(m);   // (drawn first, over the mountains, under everything nearer)
      D.conv = { m, c: g.boundingSphere.center.clone() };
      st.conv = C.halls.length;
    }
    /* boats on the lagoon (seen from the track: 150-650 m out, 30 m off the shore at least), egrets wading at its edge, cormorants flying low over it */
    if (L) {
      const B = []; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of L.poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      for (let k = 0; k < 400 && B.length < 7; k++) { const x = x0 + R() * (x1 - x0), z = z0 + R() * (z1 - z0); if (!inPoly(L.poly, x, z) || polyDist(L.poly, x, z) < 30) continue; const d = tdist(x, z); if (d < 150 || d > 650 || B.some(b => Math.hypot(b.x - x, b.z - z) < 70)) continue;
        B.push({ x, z, h: R() * TAU, r: 4 + R() * 10, w: (R() < 0.5 ? -1 : 1) * (0.01 + R() * 0.015), ph: R() * TAU }); }
      if (B.length) { const im = new THREE.InstancedMesh(rioBoatGeo(), matI, B.length), c3 = new THREE.Color(), PC = [[0.2, 0.45, 0.75], [0.85, 0.3, 0.15], [0.95, 0.95, 0.9], [0.2, 0.55, 0.35], [0.95, 0.8, 0.2]];
        B.forEach((b, k) => { c3.setRGB(...PC[k % PC.length]); im.setColorAt(k, c3); }); im.instanceColor.needsUpdate = true; im.castShadow = false; im.receiveShadow = true; im.frustumCulled = false; root.add(im);
        D.boats = { im, B, y: L.y }; }
      st.boats = B.length;
      const E = [];   // egrets: along the shore near the track, a metre or two into the water
      for (let k = 0, n = L.poly.length; k < n; k++) { const [ax, az] = L.poly[k], [bx, bz] = L.poly[(k + 1) % n], l = Math.hypot(bx - ax, bz - az);
        for (let s = 0; s < l; s += 14) { const t = s / l, x = ax + (bx - ax) * t, z = az + (bz - az) * t, d = tdist(x, z); if (d < 70 || d > 420 || R() > 0.12) continue;
          const nx = -(bz - az) / l, nz = (bx - ax) / l, sd = inPoly(L.poly, x + nx * 2, z + nz * 2) ? 1 : -1, o = 1 + R() * 2, px = x + nx * sd * o, pz = z + nz * sd * o; if (!inPoly(L.poly, px, pz)) continue;
          E.push([px, L.y - 0.25, pz, R() * TAU, 0.95 + R() * 0.3]); } }
      if (E.length) { const im = new THREE.InstancedMesh(rioEgretGeo(), matI, E.length), c3 = new THREE.Color(); E.forEach(([x, y, z, h, s], k) => { D.e.set(0, h, 0); D.q.setFromEuler(D.e); D.v.set(x, y, z); D.sc.setScalar(s); D.m4.compose(D.v, D.q, D.sc); im.setMatrixAt(k, D.m4); c3.setScalar(0.92 + 0.08 * ((k * 7) % 5) / 4); im.setColorAt(k, c3); });
        im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.castShadow = false; im.frustumCulled = false; root.add(im); D.sc.setScalar(1); }
      st.egrets = E.length;
      // cormorants: seven in a loose line along a long loop low over the water, off the shore nearest the track
      let bx = 0, bz = 0, bd = 1e9; for (const [x, z] of L.poly) { const d = tdist(x, z); if (d < bd) { bd = d; bx = x; bz = z; } }
      { let cx = bx, cz = bz; for (let k = 0; k < 30; k++) { const a = k / 30 * TAU, x = bx + Math.cos(a) * 160, z = bz + Math.sin(a) * 160; if (inPoly(L.poly, x, z) && polyDist(L.poly, x, z) > polyDist(L.poly, cx, cz)) { cx = x; cz = z; } }
        const bm = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), uT = { value: 0 };
        bm.onBeforeCompile = (sh) => { sh.uniforms.uBt = uT; sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uBt;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat bPh = instanceMatrix[ 3 ].y * 1.7;\n#else\nfloat bPh = 0.0;\n#endif\ntransformed.y += sin( uBt * 7.5 + bPh ) * 0.42 * smoothstep( 0.08, 0.66, abs( transformed.z ) );'); };
        bm.customProgramCacheKey = () => 'rioBird';
        const im = new THREE.InstancedMesh(rioCormGeo(), bm, 7); im.castShadow = false; im.frustumCulled = false; root.add(im);
        D.birds = { im, cx, cz, rx: 150, rz: 90, y: L.y + 7, uT, n: 7 }; st.birds = 7; }
      /* the mist over the lagoon (the morning, the rain, a little at dusk): two soft layers over the water, thinning towards the shore and a little over the marsh */
      { const n = 44, ax = Math.max(x0, -1400), az = Math.max(z0, -900), bx2 = Math.min(x1, 1600), bz2 = Math.min(z1, 1500), sx = (bx2 - ax) / n, sz = (bz2 - az) / n, Pm = [], Am = [], Im = [];
        for (const [dy, amax] of [[1.2, 0.5], [3.6, 0.38]]) { const base = Pm.length / 3;
          for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const x = ax + i * sx, z = az + j * sz, inn = inPoly(L.poly, x, z), d = polyDist(L.poly, x, z);
            Pm.push(x, L.y + dy, z); Am.push((inn ? 0.35 + 0.65 * sstep(0, 60, d) : 0.35 * (1 - sstep(0, 40, d))) * amax); }
          for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = base + j * (n + 1) + i, b = a + 1, c = a + n + 1, dd = c + 1; if (Am[a - 0] + Am[b] + Am[c] + Am[dd] > 0) Im.push(a, c, b, b, c, dd); } }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(Pm, 3)); g.setAttribute('aA', new THREE.Float32BufferAttribute(Am, 1)); g.setIndex(Im); g.computeBoundingSphere();
        const U = { uT: { value: 0 }, uA: { value: 0 }, uC: { value: new THREE.Color(0xe6e9ea) } };
        const mat = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, U]), transparent: true, depthWrite: false, fog: true,
          vertexShader: '#include <fog_pars_vertex>\nattribute float aA; varying float vA; varying vec2 vW; void main(){ vA = aA; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}',
          fragmentShader: '#include <fog_pars_fragment>\nuniform float uT; uniform float uA; uniform vec3 uC; varying float vA; varying vec2 vW;' +
            ' float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); } float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }' +
            ' void main(){ vec2 p = vW / 70.0 + vec2(uT * 0.011, uT * 0.005); float m = 0.55 * n2(p) + 0.3 * n2(p * 2.3 + 7.0) + 0.15 * n2(p * 5.1 - 3.0); gl_FragColor = vec4(uC, uA * vA * smoothstep(0.2, 0.7, m));\n#include <fog_fragment>\n}' });
        mat.uniforms.uT = U.uT; mat.uniforms.uA = U.uA; mat.uniforms.uC = U.uC;
        const me = new THREE.Mesh(g, mat); me.renderOrder = 3; me.visible = false; me.matrixAutoUpdate = false; root.add(me); D.mist = { me, U }; }
    }
    /* the heat shimmering over the long straights (a dry day): a mirage of the sky's haze on the asphalt 50-500 m ahead, wavering; seen only
       looking along the road, low down */
    { const Pm = [], Em = [], Im = [], hw = def.halfWidth || 6.5;
      for (const [a, b] of [[-330, 380], [1810, 2730]]) { const base = Pm.length / 3;
        let n = 0; for (let d = a; d <= b; d += 6, n++) { const i = T.idx(sAtS(d)); for (const o of [-hw, hw]) { Pm.push(T.px[i] + T.nx[i] * o, T.hy[i] + 0.14, T.pz[i] + T.nz[i] * o); Em.push(o < 0 ? 0 : 1); } }
        for (let k = 0; k < n - 1; k++) { const v = base + k * 2; Im.push(v, v + 2, v + 1, v + 1, v + 2, v + 3); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(Pm, 3)); g.setAttribute('aE', new THREE.Float32BufferAttribute(Em, 1)); g.setIndex(Im); g.computeBoundingSphere();
      const U = { uT: { value: 0 }, uA: { value: 0 }, uHor: WSKY.hor };
      const mat = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
        vertexShader: 'attribute float aE; varying float vE; varying vec3 vW; void main(){ vE = aE; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }',
        fragmentShader: 'uniform float uT; uniform float uA; uniform vec3 uHor; varying float vE; varying vec3 vW;' +
          ' float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); } float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }' +
          ' void main(){ vec3 V = vW - cameraPosition; float d = length(V), dn = -V.y / max(d, 1.0);' +
          ' float k = uA * (1.0 - smoothstep(0.006, 0.03, dn)) * smoothstep(45.0, 120.0, d) * (1.0 - smoothstep(320.0, 520.0, d)) * smoothstep(0.0, 0.18, vE) * smoothstep(0.0, 0.18, 1.0 - vE);' +
          ' float n = n2(vW.xz * 0.11 + vec2(uT * 0.9, -uT * 0.4)) * 0.6 + n2(vW.xz * 0.37 + vec2(-uT * 2.3, uT * 1.7)) * 0.4;' +
          ' gl_FragColor = vec4(uHor * 1.06, k * smoothstep(0.2, 0.75, n) * 0.85); }' });
      const me = new THREE.Mesh(g, mat); me.renderOrder = 1; me.frustumCulled = false; me.visible = false; me.matrixAutoUpdate = false; root.add(me); D.heat = { me, U }; }
    /* the samba group's drums: the front row with snares and tamborims at the waist, two big surdos on stands */
    for (const [x, z, hd] of P.posts || []) { const y = nrGround(x, z);   // the marshals' posts: white, an orange roof, a flag on a short pole
      box(near, x, y - 0.1, z, 2.2, 2.4, 2.2, hd, [0.92, 0.91, 0.87]); box(near, x, y + 2.3, z, 2.8, 0.25, 2.8, hd, [0.95, 0.45, 0.1], [0.98, 0.5, 0.12]);
      cyl(near, x + 1.3, y, z + 1.3, 0.04, 4, 4, [0.8, 0.8, 0.82]); box(near, x + 1.3, y + 3.2, z + 1.55, 0.02, 0.6, 0.5, 0, [0.98, 0.84, 0.1]); }
    st.posts = (P.posts || []).length;
    if (P.samba) { const S = P.samba; let k = 0;
      { const y = nrGround(S.x, S.z); box(near, S.x, y - 0.3, S.z, 14, 1.5, 6.4, S.hd, [0.55, 0.4, 0.26], [0.62, 0.47, 0.3]); box(near, S.x, y + 1.2, S.z, 14.2, 0.06, 6.6, S.hd, [0.95, 0.8, 0.12]);   // the stage: boards on a frame, a yellow skirt
        for (const sd of [-1, 1]) cyl(near, S.x + Math.cos(S.hd) * sd * 7.6, y, S.z + Math.sin(S.hd) * sd * 7.6, 0.06, 3.2, 5, [0.75, 0.75, 0.78]); }   // (two flagpoles)
      for (const [x, z, r, nx, nz] of S.spots) { if (r !== 0) continue; const y = nrGround(x, z) + 1.2, dx = x + nx * 0.45, dz = z + nz * 0.45;
        if (k++ % 3 === 2) { cyl(near, dx, y + 0.1, dz, 0.4, 0.62, 8, [0.88, 0.86, 0.8], [0.95, 0.93, 0.88]); for (const l of [0.13, 0.62]) cyl(near, dx, y + 0.1 + l, dz, 0.41, 0.04, 8, [0.95, 0.8, 0.15]); }   // a surdo (silver, yellow hoops)
        else { cyl(near, dx, y + 0.85, dz, 0.2, 0.16, 8, [0.15, 0.4, 0.75], [0.92, 0.92, 0.9]); } }   // a snare
      out.samba = [S.x, S.z]; st.samba = S.spots.length; }
    if (!near.empty) { const m = new THREE.Mesh(near.geometry(), matV); m.castShadow = m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
    if (!far.empty) { const m = new THREE.Mesh(far.geometry(), matV); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); }
    if (P.roof) st.roof = P.roof; if (P.bank) st.bank = P.bank;
    return D;
  }
  function rioStep(D, t, car, cam) {   // what moves round Rio: the karts, the boats, the cormorants, the mist and the heat (by the weather and the time of day)
    const dt = clamp(t - D.t, 0, 0.25); D.t = t;
    if (!(t < D.tw)) { D.tw = t + 1; const Rn = typeof Render !== 'undefined' ? Render : null, A = Rn && Rn.atmos, tod = A ? A.tod : 'day', rain = !!(Rn && Rn.raining), dawn = tod === 'dawn' || !!(Rn && tod === 'dusk' && Rn.show && Rn.show.dawn);
      D.mistT = dawn ? 1 : rain ? 0.6 : tod === 'dusk' ? 0.3 : tod === 'night' ? 0.2 : 0; D.heatT = !rain && tod === 'day' ? 1 : 0; }
    const ez = 1 - Math.exp(-dt * 0.5); D.mA += (D.mistT - D.mA) * (car ? ez : 1); D.hA += (D.heatT - D.hA) * (car ? ez : 1);
    if (D.mist) { D.mist.U.uA.value = D.mA; D.mist.U.uT.value = t % 1000; D.mist.me.visible = D.mA > 0.01; }
    if (D.heat) { D.heat.U.uA.value = D.hA; D.heat.U.uT.value = t % 1000; D.heat.me.visible = D.hA > 0.01; }
    const { m4, q, e, v, sc } = D;
    if (D.conv && cam) { const C = D.conv, p = cam.position, d = Math.hypot(C.c.x - p.x, C.c.y - p.y, C.c.z - p.z), k = Math.min(1, (cam.far || 700) * 0.62 / Math.max(d, 1));   // (shrunk about the camera: the same on the screen, inside the view's reach)
      C.m.matrix.makeScale(k, k, k); C.m.matrix.setPosition(p.x * (1 - k), p.y * (1 - k), p.z * (1 - k)); C.m.matrixWorldNeedsUpdate = true; }
    else if (D.conv && !car) { D.conv.m.matrix.identity(); D.conv.m.matrixWorldNeedsUpdate = true; }   // (no car followed, no camera: where it stands)
    if (D.karts) { const K = D.karts, n = K.U.length;
      for (let k = 0; k < 5; k++) { const f = ((t * K.v[k] + K.o[k]) % n + n) % n, i = Math.floor(f), j = (i + 1) % n, u = f - i, p = K.U[i], p2 = K.U[j];
        e.set(0, -K.Hd[i], 0); q.setFromEuler(e); v.set(p[0] + (p2[0] - p[0]) * u, K.Y[i], p[1] + (p2[1] - p[1]) * u); m4.compose(v, q, sc); K.im.setMatrixAt(k, m4); }
      K.im.instanceMatrix.needsUpdate = true; }
    if (D.boats) { const Bt = D.boats;
      Bt.B.forEach((b, k) => { const a = b.ph + t * b.w; e.set(Math.sin(t * 1.1 + b.ph) * 0.04, b.h + a * 0.6, Math.sin(t * 0.8 + b.ph * 2) * 0.03); q.setFromEuler(e);
        v.set(b.x + Math.cos(a) * b.r, Bt.y - 0.12 + Math.sin(t * 1.3 + b.ph) * 0.05, b.z + Math.sin(a) * b.r); m4.compose(v, q, sc); Bt.im.setMatrixAt(k, m4); });
      Bt.im.instanceMatrix.needsUpdate = true; }
    if (D.birds) { const Bd = D.birds; Bd.uT.value = t % 1000;
      for (let k = 0; k < Bd.n; k++) { const a = t * 0.07 - k * 0.035, x = Bd.cx + Math.cos(a) * Bd.rx + Math.sin(k * 2.1) * 4, z = Bd.cz + Math.sin(a) * Bd.rz + Math.cos(k * 1.7) * 3, hx = -Math.sin(a) * Bd.rx, hz = Math.cos(a) * Bd.rz;
        e.set(0, -Math.atan2(hz, hx), -0.12); q.setFromEuler(e); v.set(x, Bd.y + k * 0.35 + Math.sin(t * 0.5 + k) * 0.8, z); m4.compose(v, q, sc); Bd.im.setMatrixAt(k, m4); }
      Bd.im.instanceMatrix.needsUpdate = true; }
  }
  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it: tools/razdeli-proge.mjs)
    rio: { ban: RIO_BAN, at: RIO_AT, nums: 11, shirts: RIO_SHIRTS, smoke: false, camps: 0, trees: 'rio', seC: [1.12, 1.04, 0.86], gravel: true, noVid: true, pits80: true, heliFin: true,
      flags: { stand: [{ br: 0.75, tm: 0.25 }, { br: 0.6, gg: 0.2, tm: 0.2 }], ga: { br: 0.8, tm: 0.2 }, camp: { br: 1 }, pole: 'br', podium: 'br' },
      vid: [], poles: [-200, 120, -1], runoff: ['RIO DE JANEIRO', 'JACAREPAGUA', 'BRASIL'], straight: [-230, 160, -1],
      farm: { wall: [0.95, 0.93, 0.86], roof: [0.66, 0.32, 0.2], end: [0.93, 0.9, 0.82], barn: [0.86, 0.82, 0.72], barnRoof: [0.62, 0.3, 0.2], barnEnd: [0.84, 0.8, 0.7] },   // a white house under red tiles
      tvSkip: [3, 6, 7, 9], recov: [0, 4, 10], photo: [0, 4, 10], jets: [[0.97, 0.97, 0.97], [0.97, 0.97, 0.97], [0.97, 0.97, 0.97]],
      screen: { name: ['RIO DE JANEIRO', ''], km: '5,031 km', sub: '11 zavojev', fans: ['#ffd21f', '#0a6a3a', '#f4f4f0', '#123c8c', '#e2202c', '#ff9a2e', '#0a6a3a'], glow: '255,210,31' },
      ground: rioGround, verge: rioVerge, road: rioRoad, apron: rioApron,   // (the ground's patches and the worn verges: rioGround, rioVerge)
      colMod: (P) => (x, z, c) => {   // the tropics in the rainy summer: a lush, deeper green in patches; the marsh by the lagoon olive and muddy
        const n = P.n5(x * 0.55 + 700, z * 0.55), m = P.n3(x * 1.6 + 300, z * 1.6), k = 0.92 + (n - 0.5) * 0.16 + (m - 0.5) * 0.1, mf = nrLCf(x, z, 2);
        c[0] *= k * 0.88; c[1] *= k * 0.94; c[2] *= k * 0.8;
        if (mf > 0) { c[0] = lerp(c[0], 0.7, mf * 0.6); c[1] = lerp(c[1], 0.74, mf * 0.6); c[2] = lerp(c[2], 0.5, mf * 0.6); }
        { const fm = nrLCf(x, z, 0), dry = sstep(0.56, 0.78, P.n3(x * 0.7 + 90, z * 0.7 - 40)) * 0.5 * fm, lush = sstep(0.6, 0.8, P.n1(x * 1.1 - 210, z * 1.1 + 75)) * 0.35 * fm;   // patches burnt dry by the sun, darker lush ones in the hollows
          c[0] = lerp(c[0], c[0] * 1.3 + 0.08, dry); c[1] = lerp(c[1], c[1] * 1.08 + 0.03, dry); c[2] = lerp(c[2], c[2] * 0.7, dry);
          c[0] = lerp(c[0], c[0] * 0.82, lush); c[1] = lerp(c[1], c[1] * 0.95, lush); c[2] = lerp(c[2], c[2] * 0.85, lush); }
      } },
  });
  Object.assign(API, { RIO_TP, rioTreeGeo, rioFlowerGeo, RIO_BLOOM, rioTree, rioWet, rioPits, rioExtra, rioPylon, rioSkyline, rioPre, rioStep });   // (what js/world-rbring.js, World and the other worlds use: tools/razdeli-proge.mjs)
  World.keep('NR', 'rio');   // (its grids kept between its builds; World.build frees the others': tools/razdeli-proge.mjs)
  World.ext.rio = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
