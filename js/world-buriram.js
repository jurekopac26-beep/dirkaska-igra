/* =========================================================================
   WORLD — Buriram, Tajska (theme 'buriram'): the circuit among the rice fields of the plateau of north-east Thailand by the town of
   Buriram, its own parts on the shared builder of js/world-rbring.js (World.ext.rbring), loaded before it (index.html). Its look
   (RB_LOOK.buriram) goes on API.rbLook; World.ext.buriram builds it with World.ext.rbring. Plan: docs/nove-proge-1-0.md (A15), the track:
   docs/proge/buriram.md.
   Its own parts (the builder's hooks LK.woods, LK.extra, LK.pad, LK.fl, LK.colMod): the trees of the plateau (sugar palms standing alone on
   the paddies, the broad umbrella crowns of the rain trees, bushes: brTreeGeo), the paddies round the circuit in a patchwork of green and
   golden rice, stubble and wet fields, the circuit's watered lawns; the pond inside the lefts of Turns 4-6 (def.sk.lakes: OpenStreetMap) as still water
   in its dug bed and the wetlands by it (def.sk.wet: OpenStreetMap) with tufts of rank grass and reeds; the big main grandstand over the
   pit garages under one long roof, the Thai flags along its front; the service roads round the circuit (def.sk.svc: OpenStreetMap), the
   building behind the pits (def.sk.bld: OpenStreetMap), the flat horizon of the plateau (def.far: Riverside's rsFar), red turn numbers.
   Only place names on its boards (no names of the circuit, its people, races or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { GB, IChunks, NRC, RB, TAU, addShore, atSf, box, clamp, cyl, inPoly, lerp, mergeBands, nrDem, nrDist, nrGH, nrGround, nrLCf, nrNear, polyDist, puff, rng, shoreBand, sstep, tuftGeo, tuftWindMat, waterMat, waterline, wrapS } = API;
  // the text boards: place names (the town and the province, the region, the country, the towns and the districts round it, the old
  // temple's hill), the grandstands' names (def.stands), the start line's, the DRS boards
  const BR_BAN = [['BURIRAM', '#a51931', '#fff', '#fff'], ['ISAN', '#2d2a4a', '#fff', '#a51931'], ['START · FINISH', '#16181c', '#fff', '#a51931'], ['THAILAND', '#a51931', '#fff', '#fff'],
    ['NANG RONG', '#2d2a4a', '#fff', '#fff'], ['PHANOM RUNG', '#3b5d2a', '#fff', '#a51931'], ['SATUEK', '#2d2a4a', '#fff', '#a51931'], ['KRASANG', '#3b5d2a', '#fff', '#fff'],
    ['KHORAT', '#2d2a4a', '#fff', '#fff'], ['DRS', '#101114', '#fff', '#39c84a']];
  const BR_AT = { num: 0, brake: 12, ban: 15, rbr: 15, spielberg: 16 };   // atlas cells: the 12 turn numbers, the braking boards, the banners
  const BR_SHIRTS = [[0.65, 0.1, 0.19], [0.95, 0.95, 0.93], [0.18, 0.17, 0.3], [0.14, 0.14, 0.16], [0.16, 0.36, 0.72], [0.42, 0.44, 0.48], [0.97, 0.8, 0.14], [0.92, 0.92, 0.9],
    [0.95, 0.55, 0.12], [0.2, 0.5, 0.82], [0.55, 0.42, 0.3], [0.8, 0.12, 0.16]];   // the fans' shirts in the tropics: red and white, navy, black and grey, blue, a few yellow and orange
  const TH = [[0.65, 0.1, 0.19], [0.96, 0.96, 0.97], [0.18, 0.17, 0.29], [0.18, 0.17, 0.29], [0.96, 0.96, 0.97], [0.65, 0.1, 0.19]];   // the Thai flag: red, white, a double blue band, white, red (1 : 1 : 2 : 1 : 1)

  // ---- the trees (unit height 1, instanced; LK.woods): 0 a sugar palm (a straight grey trunk, a round crown of stiff fan leaves on short
  //      stalks, both faces, the old leaves hanging brown under it), 1 a rain tree (a short trunk, a wide flat umbrella of soft clumps), 2 a
  //      bush; far from the road (k >= 3) plainer ----
  function brTreeGeo(kind, far) {
    const g = new GB(), R = rng(8111 + kind * 7 + (far ? 1 : 0)), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    const bark = [0.58, 0.55, 0.5], barkD = [0.5, 0.47, 0.43];
    if (kind === 0) {
      const seg = far ? 2 : 4;
      for (let s = 0; s < seg; s++) { const y0 = 0.86 * s / seg, y1 = 0.86 * (s + 1) / seg; cyl(g, 0, y0, 0, 0.027 - 0.007 * s / seg, y1 - y0 + 0.01, far ? 3 : 5, s % 2 ? bark : barkD, null, 0.027 - 0.007 * (s + 1) / seg); }
      const C = [0, 0.89, 0], n = far ? 9 : 13, LF = [0.42, 0.53, 0.33], LFD = [0.3, 0.38, 0.24], DEAD = [0.5, 0.4, 0.27], DEADD = [0.38, 0.3, 0.21];
      const fan = (a, el, st, rf, col, colB) => {   // a fan leaf: its stalk from the crown's middle out along (a, el), the fan spread across it, cupped a little
        const ce = Math.cos(el), d = [ce * Math.cos(a), Math.sin(el), ce * Math.sin(a)], l = [-Math.sin(a), 0, Math.cos(a)], up = [-Math.sin(el) * Math.cos(a), ce, -Math.sin(el) * Math.sin(a)];
        const P = [C[0] + d[0] * st, C[1] + d[1] * st, C[2] + d[2] * st], arc = [];
        for (const t of [-1.4, -0.47, 0.47, 1.4]) { const cu = 0.22 * rf * (1 - Math.cos(t)); arc.push([0, 1, 2].map(k => P[k] + rf * (Math.cos(t) * d[k] + Math.sin(t) * l[k]) + cu * up[k])); }
        for (let q = 0; q + 1 < arc.length; q++) { g.tri(P, arc[q], arc[q + 1], col); g.tri(P, arc[q + 1], arc[q], colB); }
      };
      for (let f = 0; f < n; f++) {   // (on a spiral round the crown: up, out and a little down, a round ball)
        const t = (f + 0.5) / n, el = lerp(1.25, -0.45, t) + (R() - 0.5) * 0.2, a = f * 2.39996 + R() * 0.3;
        fan(a, el, 0.06 + R() * 0.02, 0.1 + R() * 0.025, R() < 0.5 ? LF : [0.37, 0.49, 0.3], LFD);
      }
      if (!far) for (let f = 0; f < 3; f++) fan(f * TAU / 3 + R() * 0.6, -1.15 + R() * 0.2, 0.045, 0.09, DEAD, DEADD);   // (the old leaves, dry and brown, hanging under the crown)
    } else if (kind === 1) {
      cyl(g, 0, -0.02, 0, 0.05, 0.44, far ? 4 : 5, barkD, null, 0.036);
      const LF = [[0.25, 0.39, 0.15], [0.29, 0.44, 0.17], [0.33, 0.49, 0.19], [0.27, 0.42, 0.16]];
      const cl = far ? [[0, 0.62, 0, 0.44, 0.5], [0.04, 0.74, 0.02, 0.32, 0.52]]
        : [[0.3, 0.6, 0.08, 0.28, 0.56], [-0.29, 0.61, 0.12, 0.27, 0.58], [0.02, 0.6, -0.31, 0.27, 0.56], [0.05, 0.62, 0.31, 0.26, 0.58], [0, 0.74, 0, 0.32, 0.6]];   // (four round the edge of the umbrella, one on top)
      cl.forEach(([x, y, z, r, sy], q) => puff(g, x, y, z, r, sy, LF[q % 4], R, 0.22, 0.5, 1.12, !far));
    } else {
      const cl = far ? [[0, 0.45, 0, 0.5, 0.8]] : [[0.12, 0.42, 0.05, 0.42, 0.8], [-0.16, 0.38, -0.06, 0.38, 0.8], [0.02, 0.5, -0.18, 0.34, 0.8]];
      cl.forEach(([x, y, z, r, sy], q) => puff(g, x, y, z, r, sy, q % 2 ? [0.25, 0.37, 0.15] : [0.29, 0.41, 0.17], R, 0.28, 0.55, 1.08, false));
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // on the land cover (0 the lawns and the grass, 1 the trees, 2 the paddies and the wetlands, 3 the car parks and the villages): the tree
  // belts rain trees with palms and bushes among them; on the paddies sugar palms alone or in twos and threes on the bunds, a rain tree here
  // and there; on the lawns a few palms and trees; palms and trees by the houses
  const BR_WOODS = {
    n: 3, geo: (k) => brTreeGeo(k % 3, k >= 3), cr: [0.2, 0.48, 0.42], p: [0.012, 0.55, 0.026, 0.05],
    pick(cl, R, far) {
      const r = R(), r2 = R(), r3 = R();
      const sp = cl === 1 ? (r < 0.6 ? 1 : r < 0.82 ? 0 : 2) : cl === 2 ? (r < 0.84 ? 0 : r < 0.96 ? 1 : 2) : cl === 3 ? (r < 0.5 ? 0 : r < 0.85 ? 1 : 2) : r < 0.4 ? 0 : r < 0.75 ? 1 : 2;
      let h = sp === 0 ? 11 + r2 * 8 : sp === 1 ? 9 + r2 * 8 : 1.6 + r2 * 2; if (far) h *= 1.06;
      return [sp, h, h * (sp === 0 ? 0.95 + r3 * 0.15 : sp === 1 ? 1.05 + r3 * 0.3 : 1.3 + r3 * 0.4)];
    },
  };

  // the service roads round the circuit (def.sk.svc: OSM's highway=service and =unclassified): plain asphalt 5 m wide on the ground, its two
  // edges every 4 m (the terrain under them), 8 cm over it and drawn over it; not inside the barriers nor within 4 m past them (the
  // run-offs are the builder's), the trees and the people off them
  function brWays({ root, exclPush, CR }, S, HW, col, map, name, st) {
    const rb = new RB(true);
    for (let k = 0; k < S.length;) {
      const n = S[k], p = []; for (let q = 0; q < n; q++) p.push([S[k + 1 + q * 2], S[k + 2 + q * 2]]); k += 1 + n * 2;
      const pts = []; for (let q = 0; q + 1 < n; q++) { const [ax, az] = p[q], [bx, bz] = p[q + 1], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 4)); for (let t = 0; t < m; t++) pts.push([lerp(ax, bx, t / m), lerp(az, bz, t / m)]); }
      pts.push(p[n - 1]);
      let prev = -1, along = 0;
      for (let q = 0; q < pts.length; q++) {
        const [x, z] = pts[q], a = pts[Math.max(0, q - 1)], b = pts[Math.min(pts.length - 1, q + 1)], dx = b[0] - a[0], dz = b[1] - a[1], dl = Math.hypot(dx, dz) || 1;
        if (q) along += Math.hypot(x - pts[q - 1][0], z - pts[q - 1][1]);
        const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 4 + HW) { prev = -1; continue; }
        const nx = -dz / dl, nz = dx / dl, row = [-HW, HW].map(o => { const px = x + nx * o, pz = z + nz * o; return [px, nrGround(px, pz) + 0.08, pz]; });   // (left to right in the way's direction: (nx, nz) its right)
        const r = rb.row(row, [col, col], row.map((e, j) => [j * HW / 2, along / 4]));
        if (prev >= 0) rb.link(prev, r, 0, 1); prev = r;
        if (q % 2 === 0) { exclPush(x, z, HW + 1.5); if (nn.i >= 0 && nn.dd < 70) CR.avoid(x, z, HW + 0.5); }
        st.road += 4;
      }
    }
    if (rb.empty) return;
    const m = new THREE.Mesh(rb.geometry(), new THREE.MeshLambertMaterial({ map, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
    m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = name; root.add(m);
  }

  // outlines from the track's file: [x, z, ...] from k0 on, with their boxes
  const brPolys = (arr, k0) => (arr || []).map(a => {
    const p = []; for (let k = k0; k + 1 < a.length; k += 2) p.push([a[k], a[k + 1]]);
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of p) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    return { p, b: [x0, x1, z0, z1] };
  });

  // the pond (def.sk.lakes: [name, x, z, ...]) per build: the outline, its box, the water's level: a little under the ground round its shore
  // (the lowest quarter of the terrain model there), under the road by it (0.9 m below the road within 40 m) (as Biķernieki's lakes)
  let BRL = [];
  function brLakes() {
    const T = API.T, out = [];
    for (const { p: poly, b } of brPolys((T.def.sk || {}).lakes, 1)) {
      const [x0, x1, z0, z1] = b, hs = poly.map(([x, z]) => nrDem(x, z)).sort((u, v) => u - v); let lvl = hs[Math.floor(hs.length / 4)] - 0.3;
      for (let i = 0; i < T.N; i++) { const x = T.px[i], z = T.pz[i]; if (x > x0 - 50 && x < x1 + 50 && z > z0 - 50 && z < z1 + 50 && polyDist(poly, x, z) < 40) lvl = Math.min(lvl, T.hy[i] - 0.9); }
      out.push({ poly, b, lvl });
    }
    return out;
  }
  // LK.pad (the builder's ground round the circuit, before it is built): the pond's bed dug and the land kept above the water, both on one
  // even slope through the shore (0.1 m per metre from the outline), the bed shelving on to 1.5 m, the land back to its own height within
  // 10 m; not inside the barriers, fully only 6 m past them
  function brPad(pad0) {
    BRL = brLakes();
    const NRN = API.NRN;
    return (x, z, h) => {   // (NRN: the nearest road sample of the point being built, its offset and its distance past the barriers: js/world.js nrH)
      h = pad0(x, z, h);
      for (const L of BRL) {
        const b = L.b; if (x < b[0] - 8 || x > b[1] + 8 || z < b[2] - 8 || z > b[3] + 8) continue;
        const d = polyDist(L.poly, x, z), f = sstep(1, 6, NRN.dd);
        if (inPoly(L.poly, x, z)) return lerp(h, Math.min(h, L.lvl - Math.min(1.5, 0.1 * d + 0.02 * d * d)), f);
        if (d < 10) { const t = L.lvl + 0.1 * d; return lerp(h, lerp(t, Math.max(h, t), sstep(0, 10, d)), f); }
      }
      return h;
    };
  }

  // the water: flat at the pond's level (World's waterMat: still water in the open, wavelets, the sky mirrored, darker near the land round
  // it), a shore band round it (the shallows, the foam at the waterline: where the terrain meets the water); nothing stands in it
  function brWater({ root, tex, exclPush, CR, out }, st) {
    if (!BRL.length) return;
    const G = API.NR.G, gw = new GB(true), wc = [1, 1, 1], bands = [], gi = (v, o, n) => clamp(Math.floor((v - o) / NRC), 0, n - 1);
    for (const L of BRL) {
      const y = L.lvl, Q = (p) => [p[0], y, p[1]], uv = (p) => [p[0] / 16, -p[1] / 16];
      for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(L.poly.map(p => new THREE.Vector2(p[0], p[1])), [])) {
        const A = L.poly[a], B = L.poly[b], C = L.poly[c]; gw.triO(Q(A), Q(B), Q(C), wc, [A[0], y - 5, A[1]], wc, wc, uv(A), uv(B), uv(C)); }
      const [x0, x1, z0, z1] = L.b;
      for (let z = z0 + 6; z < z1; z += 12) for (let x = x0 + 6; x < x1; x += 12) if (inPoly(L.poly, x, z) && polyDist(L.poly, x, z) > 4) { exclPush(x, z, 9); CR.avoid(x, z, 8); }   // (no tree, nobody in it)
      for (const [x, z] of L.poly) exclPush(x, z, 2);
      const wl = waterline(nrGH, G.x0, G.z0, NRC, gi(x0 - 14, G.x0, G.nx), gi(x1 + 22, G.x0, G.nx), gi(z0 - 14, G.z0, G.nz), gi(z1 + 22, G.z0, G.nz), y);   // (where the terrain meets the water)
      const sd = (x, z) => { const d = polyDist(L.poly, x, z); return Math.min(inPoly(L.poly, x, z) ? d : -d, wl(x, z)); };
      bands.push(shoreBand(x0 - 6, z0 - 6, x1 + 6, z1 + 6, y + 0.015, sd, 16));
      st.lakes++;
    }
    const WO = { len: 0.9, amp: 0.5, refl: 0.55, land: 0.8, shal: 0.6, lap: 0.4, surf: 0 }, wm = new THREE.Mesh(gw.geometry(), waterMat(tex, Object.assign({ color: 0x5c6f62 }, WO)));   // (a muddy green-grey: a pond of the plain)
    wm.receiveShadow = true; wm.matrixAutoUpdate = false; wm.updateMatrix(); wm.name = 'buriram pond'; root.add(wm); out.dyn.water = tex.water;
    addShore(root, mergeBands(bands), wm.material, WO);
  }

  // the wetlands (def.sk.wet: OSM) and the pond's shore: tufts of rank grass and reeds (World's wind-swayed tufts) on a 2.8 m grid in the
  // wetlands, a ring of them on the pond's margin; within 90 m of the road (thinning out past 45 m: the chase camera sees ~60 m), none
  // within 3 m past the barriers, none in the water
  function brMarsh({ excluded }, st, tu) {
    const sk = API.T.def.sk || {}, R = rng(8123), P = API.NR;
    const near = (x, z) => { const q = nrNear(x, z); return q.i >= 0 && q.dd < 3; }, far = (x, z) => { const d = nrDist(x, z); return d > 90 || (d > 45 && R() < sstep(45, 90, d) * 0.75); };   // (thinning out past 45 m, none past 90 m)
    const wetIn = (x, z) => { for (const L of BRL) if (inPoly(L.poly, x, z) && polyDist(L.poly, x, z) > 0.8) return true; return false; };
    const tuft = (x, z, s) => {
      const dry = P.n3(x * 0.7 + 40, z * 0.7), cv = 0.9 + R() * 0.2, y = nrGround(x, z) - 0.05;
      tu.add(x, y, z, R() * TAU, s * (1 + R() * 0.3), s * (1.1 + R() * 0.5), [lerp(0.4, 0.6, dry) * cv, lerp(0.52, 0.6, dry) * cv, lerp(0.24, 0.3, dry) * cv]); st.reeds++;
    };
    for (const { p, b } of brPolys(sk.wet, 0)) {
      for (let z = b[2]; z <= b[3]; z += 2.8) for (let x = b[0]; x <= b[1]; x += 2.8) {
        const px = x + (R() - 0.5) * 2.2, pz = z + (R() - 0.5) * 2.2; if (!inPoly(p, px, pz) || R() > sstep(0.25, 0.6, P.n2(px * 0.8, pz * 0.8))) continue;   // (in clumps and beds, open water-meadow between)
        if (near(px, pz) || far(px, pz) || excluded(px, pz) || wetIn(px, pz)) continue;
        tuft(px, pz, 1.0 + R() * 0.8);
      }
    }
    for (const L of BRL) {   // the pond's margin: a ring of reeds at the waterline, in stretches with gaps
      const n = L.poly.length;
      for (let k = 0; k < n; k++) {
        const [ax, az] = L.poly[k], [bx, bz] = L.poly[(k + 1) % n], len = Math.hypot(bx - ax, bz - az); if (len < 0.5) continue;
        for (let t = R() * 3; t < len; t += 2.5 + R() * 3) {
          if (P.n1(lerp(ax, bx, t / len) * 2, lerp(az, bz, t / len) * 2) < 0.38) continue;
          const u = t / len, o = (R() - 0.3) * 3, x = lerp(ax, bx, u) - (bz - az) / len * o, z = lerp(az, bz, u) + (bx - ax) / len * o;
          if (near(x, z) || far(x, z) || excluded(x, z)) continue;
          tuft(x, z, 0.9 + R() * 0.6);
        }
      }
    }
  }

  // the main grandstand over the pit garages (OSM: one building over the pits on the left of the main straight, 32 m high): stations every
  // 5 m from 160 m before the finish line to 55 m after it; its 23 tiers of seats rise from over the garages' roof (10 m past the garages'
  // front, the first tier 9.5 m up) 22 m back, 14 m higher; the crowd on every tier; one long roof slab over it all on columns at the back,
  // tilted up towards the track, its fascia white; end walls; the Thai flags on poles along the roof's front
  function brMain({ root, scen, exclPush, CR }, st) {
    const T = API.T, L = T.len, sAt = (d) => (((T.startS + d) % L) + L) % L, hyS = (s) => T.elevAt(wrapS(s)).y, at = (s, o) => atSf(s, -o);   // (the left: negative offsets)
    const ROWS = 23, DEP = 0.95, RISE = 0.62, Y0 = 9.45, CONC = [[0.8, 0.8, 0.78], [0.64, 0.64, 0.62], [0.72, 0.72, 0.7]], W1 = [1, 1, 1], RF = [[0.93, 0.94, 0.95], [0.6, 0.62, 0.66], [0.95, 0.95, 0.96]];
    const cg = new GB(true), rows = [];
    for (let d = -160; d <= 55.01; d += 5) {
      const s = sAt(d), i = T.idx(s), o0 = T.bl[i] + 28, gy = hyS(s), back = o0 + ROWS * DEP, prof = [[o0 - 0.3, gy - 0.6]]; let y = gy;
      for (let k = 0; k < ROWS; k++) { const o = o0 + k * DEP; y = gy + Y0 + k * RISE; prof.push([o, y], [o + DEP, y]); }
      prof.push([back, y + 1.2], [back + 0.35, y + 1.2], [back + 0.35, gy - 0.5]);
      rows.push({ s, gy, prof, pts: prof.map(([o, yy]) => { const [x, z] = at(s, o); return [x, yy, z]; }), o0, back, top: y });
    }
    for (let m = 0; m + 1 < rows.length; m++) {   // the concrete: the front, riser and tread per tier, the back wall; each face looks out of the stand
      const A = rows[m], B = rows[m + 1], g = scen.get(A.pts[1][0], A.pts[1][2]), n = A.pts.length;
      for (let e = 0; e + 1 < n; e++) {
        const a0 = A.pts[e], a1 = A.pts[e + 1], b0 = B.pts[e], b1 = B.pts[e + 1], up = Math.abs(a1[1] - a0[1]) < 0.05, om = (A.prof[e][0] + A.prof[e + 1][0]) / 2, ym = (a0[1] + a1[1]) / 2;
        const [ix, iz] = at(A.s, up ? om : e >= n - 3 ? om - 1 : om + 1);   // (treads: below; risers: behind; the back wall: in front)
        g.quadO(a0, a1, b1, b0, up ? CONC[0] : e >= n - 3 ? CONC[1] : CONC[2], [ix, up ? ym - 1 : ym, iz]);
      }
    }
    for (const [A, B] of [[rows[0], rows[1]], [rows[rows.length - 1], rows[rows.length - 2]]]) {   // the end walls: strips from the profile down to the ground
      const g = scen.get(A.pts[1][0], A.pts[1][2]), n = A.pts.length, ins = B.pts[n >> 1];
      for (let e = 0; e + 2 < n; e++) {
        const a = A.pts[e], b = A.pts[e + 1]; if (Math.hypot(b[0] - a[0], b[2] - a[2]) < 0.01) continue;   // (the risers: no strip)
        g.quadO(a, b, [b[0], A.gy - 0.5, b[2]], [a[0], A.gy - 0.5, a[2]], CONC[1], ins);
      }
    }
    for (let m = 0; m + 1 < rows.length; m++) {   // the crowd on the treads (a strip on each tier)
      const A = rows[m], B = rows[m + 1], len = Math.hypot(B.pts[1][0] - A.pts[1][0], B.pts[1][2] - A.pts[1][2]), u0 = (m * 5) / 12;
      for (let k = 0; k < ROWS; k++) {
        const a0 = A.pts[1 + k * 2], a1 = A.pts[2 + k * 2], b0 = B.pts[1 + k * 2], b1 = B.pts[2 + k * 2], v = (k * 0.11) % 1;
        cg.quadUp([a0[0], a0[1] + 0.02, a0[2]], [a1[0], a1[1] + 0.02, a1[2]], [b1[0], b1[1] + 0.02, b1[2]], [b0[0], b0[1] + 0.02, b0[2]], [W1, W1, W1, W1], [[u0, v], [u0, v + 0.1], [u0 + len / 12, v + 0.1], [u0 + len / 12, v]]);
      }
    }
    const q = (R2, o, y) => { const [x, z] = at(R2.s, o); return [x, y, z]; }, DR = 1.6, TOP = 30.4;   // (the roof: its front TOP m over the road, DR m lower at the back)
    for (let m = 0; m + 1 < rows.length; m++) {   // the roof: a slab from 4 m before the first tier to 1.2 m past the back wall, columns at the back
      const A = rows[m], B = rows[m + 1], g = scen.get(A.pts[1][0], A.pts[1][2]), fa = A.o0 - 4, ba = A.back + 1.2, fb = B.o0 - 4, bb = B.back + 1.2, tA = A.gy + TOP, tB = B.gy + TOP;
      g.quadO(q(A, fa, tA + 0.7), q(B, fb, tB + 0.7), q(B, bb, tB - DR + 0.7), q(A, ba, tA - DR + 0.7), RF[0], q(A, (fa + ba) / 2, tA - 5));   // (seen from above: light)
      g.quadO(q(A, fa, tA), q(B, fb, tB), q(B, bb, tB - DR), q(A, ba, tA - DR), RF[1], q(A, (fa + ba) / 2, tA + 5));
      g.quadO(q(A, fa, tA - 0.9), q(B, fb, tB - 0.9), q(B, fb, tB + 0.9), q(A, fa, tA + 0.9), RF[2], q(A, fa + 3, tA));   // the fascia
      g.quadO(q(A, ba, tA - DR), q(B, bb, tB - DR), q(B, bb, tB - DR + 0.7), q(A, ba, tA - DR + 0.7), RF[1], q(A, ba - 3, tA - DR));
      if (m % 2 === 0) { const [x, z] = at(A.s, A.back + 0.8), y0 = A.gy - 0.3; box(g, x, y0, z, 0.7, tA - DR - y0, 0.7, T.hd[T.idx(A.s)], [0.86, 0.87, 0.9]); }
    }
    for (const [A, B] of [[rows[0], rows[1]], [rows[rows.length - 1], rows[rows.length - 2]]]) {   // the roof's ends
      const g = scen.get(A.pts[1][0], A.pts[1][2]), fa = A.o0 - 4, ba = A.back + 1.2, tA = A.gy + TOP, ins = q(B, (fa + ba) / 2, tA);
      g.quadO(q(A, fa, tA - 0.9), q(A, ba, tA - DR), q(A, ba, tA - DR + 0.7), q(A, fa, tA + 0.9), RF[2], ins);
      const [x, z] = at(A.s, A.back + 0.8), y0 = A.gy - 0.3; box(g, x, y0, z, 0.7, tA - DR - y0, 0.7, T.hd[T.idx(A.s)], [0.86, 0.87, 0.9]);
    }
    const fl = [], WROT = Math.atan2(API.RB_WIND[1], API.RB_WIND[0]), FR = rng(8129);
    for (let m = 1; m < rows.length - 1; m += 4) {   // the Thai flags on poles along the roof's front
      const A = rows[m], [x, z] = at(A.s, A.o0 - 3.2), y = A.gy + TOP + 0.75;
      cyl(scen.get(x, z), x, y - 0.2, z, 0.06, 4.4, 5, [0.88, 0.88, 0.9]); fl.push([x, y + 4.2, z, WROT + (FR() - 0.5) * 0.3, TH, 2.2, 1.45]);
    }
    if (fl.length) root.add(API.rbFlags(fl, CR.U.uTime));
    for (const r of rows) { const [x, z] = at(r.s, (r.o0 + r.back) / 2); exclPush(x, z, ROWS * DEP / 2 + 6); CR.exclAdd(x, z, ROWS * DEP / 2 + 3); }
    const tx = API.rbCrowdTex(false), cm = new THREE.Mesh(cg.geometry(), API.crowdUV(new THREE.MeshLambertMaterial({ map: tx, vertexColors: true }), 1, 0.11, 0.1));
    cm.matrixAutoUpdate = false; cm.updateMatrix(); cm.name = 'buriram main grandstand crowd'; root.add(cm);
    st.main = rows.length; return tx;
  }

  // the horizon (def.far, Riverside's rsFar): the plateau's paddies and tree belts, flat to the edge of sight, in the humid haze
  const brFarCol = (h, d) => {
    const c = h < 185 ? [0.4, 0.46, 0.25] : h < 240 ? [0.32, 0.41, 0.22] : [0.3, 0.37, 0.23], f = (1 - Math.exp(-d / 13000)) * 0.9;
    return c.map((v, k) => lerp(v, [0.8, 0.85, 0.88][k], f));
  };

  // LK.extra: the service roads, the pond and the wetlands, the main grandstand, the building behind the pits (an OSM outline as a box:
  // white render, a grey roof), the horizon; before the crowds and the trees, which keep clear of them
  function brExtra(o) {
    const { scen, exclPush, CR, root, out, tex } = o, sk = API.T.def.sk || {}, R = rng(8137), st = { road: 0, lakes: 0, reeds: 0, main: 0, buildings: 0, far: 0 };
    brWays(o, sk.svc || [], 2.5, [0.9, 0.9, 0.92], tex.asphalt, 'buriram service roads', st);
    brWater(o, st);
    const tm = tuftWindMat(out.dyn.wind || (out.dyn.wind = { value: 0 })), tu = new IChunks(tuftGeo(false), tm, 512);   // (one material, the tufts in big chunks: a few draws)
    brMarsh(o, st, tu); tu.addTo(root, false);
    const ct = brMain(o, st); if (ct && out.ownTex) out.ownTex.push(ct);
    const b6 = sk.bld || [], WALL = [[0.94, 0.93, 0.9], [0.9, 0.88, 0.82]], ROOF = [[0.5, 0.52, 0.54], [0.38, 0.4, 0.42]];
    for (let k = 0; k < b6.length; k += 6) {
      const [x, z, L, W, deg, h] = b6.slice(k, k + 6), rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot);
      let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2));
      box(scen.get(x, z), x, y - 0.4, z, L, h + 0.4, W, rot, WALL[Math.floor(R() * 2)], ROOF[Math.floor(R() * 2)], true);
      exclPush(x, z, Math.hypot(L, W) / 2 + 2); CR.avoid(x, z, Math.hypot(L, W) / 2 + 1); st.buildings++;
    }
    if (API.T.def.far && API.rsFar) { out.dyn.far = API.rsFar(root, API.T.def.far, 'summer', 6, brFarCol); st.far = 1; }   // (World.update: no car, back where it was built)
    return st;
  }

  // the paddies: fields 34-56 m long and 30 m wide in rows on a grid turned 22 degrees from north, each its own: the rice golden and ripe,
  // green and tall, green and young, cut to the pale stubble, or the field wet and bare (the terrain's 8 m vertices: soft bunds between them)
  const PADDY = [[1.66, 1.04, 1.02], [1.54, 0.98, 0.96], [0.8, 0.9, 0.75], [1.0, 1.08, 0.92], [1.8, 1.2, 1.62], [1.08, 0.9, 1.22]];
  const hsh = (a, b) => { let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const PC = Math.cos(0.38), PS = Math.sin(0.38), PQ = [0, 0, 0];
  function paddy(x, z, P) {
    const u = x * PC + z * PS, v = -x * PS + z * PC, row = Math.floor(v / 30), hr = hsh(row, 77), wd = 34 + 22 * hr, col = Math.floor((u + hr * 97) / wd), r = hsh(row * 31 + 7, col);
    const C = PADDY[r < 0.3 ? 0 : r < 0.42 ? 1 : r < 0.64 ? 2 : r < 0.75 ? 3 : r < 0.94 ? 4 : 5], j = 0.95 + 0.1 * hsh(col, row) + (P.n4(x, z) - 0.5) * 0.08;
    PQ[0] = C[0] * j; PQ[1] = C[1] * j; PQ[2] = C[2] * j; return PQ;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    buriram: { ban: BR_BAN, at: BR_AT, nums: 12, numC: ['#a51931', '#fff', '#fff'], shirts: BR_SHIRTS, smoke: false, camps: 0, farms: 0, seC: [1.08, 1.04, 0.92], gravel: false, noVid: true,
      pitBox: [-160, 120, -1], mow: 0.7,   // (the pit garages on the left of the main straight, under the main grandstand; fainter mowing stripes; no farms by the circuit)
      woods: BR_WOODS, extra: brExtra, pad: brPad, lane: true, fl: { th: TH }, ck: 2,   // (ck: chunks twice as big: fewer draws where much of the circuit is in view)
      flags: { stand: [{ th: 0.8, tm: 0.2 }, { th: 0.7, tm: 0.15, rb: 0.15 }], ga: { th: 0.8, tm: 0.2 }, camp: { th: 0.85, tm: 0.15 }, pole: 'th', podium: 'th' },
      vid: [], poles: [-250, 200, 1], runoff: ['BURIRAM', 'ISAN', 'THAILAND'], straight: [-260, 160, 1],
      farm: { wall: [0.94, 0.92, 0.86], roof: [0.62, 0.3, 0.22], end: [0.9, 0.88, 0.82], barn: [0.55, 0.45, 0.35], barnRoof: [0.62, 0.3, 0.22], barnEnd: [0.52, 0.42, 0.32] },
      tvSkip: [1, 10], recov: [0, 2, 11], photo: [0, 2, 4, 8, 11], jets: [TH[0], [0.97, 0.97, 0.97], TH[2]],   // (TV towers at the big corners, not at the two kinks)
      colMod: (P) => {   // the plateau at the end of the rainy season: the circuit's watered lawns an even fresh green; the paddies a patchwork of golden and green rice, stubble and wet fields; the wetlands and the pond's margins rank and dark; the car parks dusty grey
        const sk = API.T.def.sk || {}, WET = brPolys(sk.wet, 0).concat(brPolys(sk.lakes, 1));
        const wet = (x, z) => { let w = 0; for (const { p, b } of WET) { if (x < b[0] - 10 || x > b[1] + 10 || z < b[2] - 10 || z > b[3] + 10) continue; w = Math.max(w, inPoly(p, x, z) ? 1 : sstep(10, 0, polyDist(p, x, z))); } return w; };
        return (x, z, c, dd) => {
          dd = dd == null ? 99 : dd;
          const m = P.n3(x * 1.6 + 300, z * 1.6), v = 0.92 + 0.12 * m, k = 0.95 + (P.n5(x * 0.55 + 700, z * 0.55) - 0.5) * 0.14 + (m - 0.5) * 0.1;
          c[0] *= k; c[1] *= k; c[2] *= k * 0.97;
          const fm = nrLCf(x, z, 0), pd = nrLCf(x, z, 2), se = nrLCf(x, z, 3), far = sstep(6, 22, dd);
          const lawn = fm * sstep(150, 70, dd) * 0.8;   // (the lawns by the track: no fields, no hay)
          if (lawn > 0) { c[0] = lerp(c[0], 0.97 * v, lawn); c[1] = lerp(c[1], 1.07 * v, lawn); c[2] = lerp(c[2], 0.84 * v, lawn); }
          const w = WET.length ? wet(x, z) : 0;
          if (pd > 0) { const t = pd * far * (1 - w); if (t > 0) { const q = paddy(x, z, P); c[0] = lerp(c[0], q[0] * v, t); c[1] = lerp(c[1], q[1] * v, t); c[2] = lerp(c[2], q[2] * v, t); } }
          if (w > 0) { const t = w * 0.8; c[0] = lerp(c[0], 0.64 * v, t); c[1] = lerp(c[1], 0.74 * v, t); c[2] = lerp(c[2], 0.46 * v, t); }
          if (se > 0) { const t = se * 0.8 * far; c[0] = lerp(c[0], 1.75 * v, t); c[1] = lerp(c[1], 1.3 * v, t); c[2] = lerp(c[2], 2.2 * v, t); }
        };
      } },
  });
  World.keep('NR', 'buriram');   // (its grids kept between its builds; World.build frees the others')
  World.ext.buriram = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
