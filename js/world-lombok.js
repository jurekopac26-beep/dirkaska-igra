/* =========================================================================
   WORLD — Lombok, Indonezija (theme 'lombok'): the circuit by the beaches of the south coast of Lombok near Kuta, its own parts on the
   shared builder of js/world-rbring.js (World.ext.rbring), loaded before it (index.html). Its look (RB_LOOK.lombok) goes on API.rbLook;
   World.ext.lombok builds it with World.ext.rbring. Plan: docs/nove-proge-1-0.md (A14), the track: docs/proge/lombok.md.
   Its own parts (the builder's hooks LK.woods, LK.extra, LK.ground, LK.fl, LK.colMod, LK.pad, LK.padTrees): the streams of the plain in shallow swales
   (def.sk.str: OpenStreetMap) with their beds, the culverts' concrete headwalls and the bridges' parapets, the trees of the coastal plain (coconut palms, the broadleaf
   trees, the bushes of the dry scrub: lbTreeGeo), the plain's grass straw-green at the end of the dry season with the red earth bare in
   patches and the circuit's watered lawns green by the track (the ground's own material with its grain, clods and ragged edges: lbGround;
   tussocks of dry grass thick over the open land: lbVeg), the sand of the beaches, the sea to the south with the surf along the shore
   (def.sk.sea: its level, the terrain's sea lowered under it), the hills on the horizon (def.far: Riverside's rsFar), the service roads and
   the dirt tracks round the circuit (def.sk.svc, sk.trk: OpenStreetMap) as plain asphalt and earth on the ground, the long building past
   the end of the pit lane (def.sk.bld: OpenStreetMap), the Indonesian flag among the fans' flags, red turn numbers. Only place names on its
   boards (no names of the circuit, its people, races or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { Chunks, GB, IChunks, NRC, RB, TAU, addShore, atSf, box, brookMat, clamp, cyl, ico, lerp, nrDem, nrDist, nrGH, nrGround, nrLC, nrLCf, nrNear, puff, rng, shoreBand, sstep, waterMat, waterline } = API;
  // the text boards: place names (the island, the village by the circuit, the country, the province's towns and villages, the bays, the hill
  // and the cape by the circuit, the volcano), the grandstands' names (def.stands), the start line's, the DRS boards
  const LB_BAN = [['LOMBOK', '#ce1126', '#fff', '#fff'], ['KUTA', '#0f3d5e', '#fff', '#ce1126'], ['START · FINIS', '#16181c', '#fff', '#ce1126'], ['INDONESIA', '#ce1126', '#fff', '#fff'],
    ['PRAYA', '#0f3d5e', '#fff', '#fff'], ['PUJUT', '#1f6f8b', '#fff', '#fff'], ['SEGER', '#1f6f8b', '#fff', '#ce1126'], ['SENGKOL', '#2b4a2e', '#fff', '#fff'],
    ['GERUPUK', '#0f3d5e', '#fff', '#ce1126'], ['MERESE', '#2b4a2e', '#fff', '#ce1126'], ['TANJUNG', '#1f6f8b', '#fff', '#fff'], ['RINJANI', '#2b4a2e', '#fff', '#fff'],
    ['DRS', '#101114', '#fff', '#39c84a']];
  const LB_AT = { num: 0, brake: 17, ban: 20, rbr: 20, spielberg: 21 };   // atlas cells: the 17 turn numbers, the braking boards, the banners
  const LB_SHIRTS = [[0.84, 0.08, 0.12], [0.95, 0.95, 0.93], [0.8, 0.07, 0.12], [0.13, 0.13, 0.15], [0.16, 0.2, 0.36], [0.42, 0.44, 0.48], [0.97, 0.8, 0.14], [0.12, 0.42, 0.62],
    [0.92, 0.92, 0.9], [0.55, 0.42, 0.3], [0.18, 0.5, 0.3], [0.86, 0.1, 0.16]];   // the fans' shirts in the tropics: lots of red and white, black, navy and grey, a few yellow, blue and green
  const ID = [[0.81, 0.07, 0.12], [0.96, 0.96, 0.95]];   // the Indonesian flag: red over white

  // ---- the trees (unit height 1, instanced; LK.woods): 0 a coconut palm (a slender ringed trunk leaning a little, a crown of drooping
  //      fronds, both faces), 1 a broadleaf tree of the dry tropics (a short trunk, a wide crown of soft clumps in two tiers), 2 a bush of the
  //      scrub (low grey-green clumps); far from the road (k >= 3) plainer ----
  function lbTreeGeo(kind, far) {
    const g = new GB(), R = rng(7331 + kind * 7 + (far ? 1 : 0)), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    const bark = [0.52, 0.45, 0.36], barkD = [0.41, 0.35, 0.28];
    if (kind === 0) {
      const lean = 0.06, seg = far ? 2 : 4;
      for (let s = 0; s < seg; s++) { const y0 = 0.9 * s / seg, y1 = 0.9 * (s + 1) / seg; cyl(g, lean * y0 * y0, y0, 0, 0.028 - 0.008 * s / seg, y1 - y0 + 0.01, far ? 3 : 5, s % 2 ? bark : barkD, null, 0.028 - 0.008 * (s + 1) / seg); }
      const cx = lean * 0.81, n = far ? 6 : 9, fr = [0.36, 0.5, 0.19], frD = [0.23, 0.34, 0.13];
      for (let f = 0; f < n; f++) {
        const a = f / n * TAU + (R() - 0.5) * 0.4, c = Math.cos(a), sn = Math.sin(a), up = f % 2 ? 0.05 : 0, L = 0.4 + R() * 0.1, dr = 0.17 + R() * 0.1 - up;
        const B = [cx + c * 0.02, 0.91, sn * 0.02], M = [cx + c * L * 0.5, 0.97 + up, sn * L * 0.5], Tp = [cx + c * L, 0.91 - dr, sn * L], w = 0.06 + R() * 0.02;
        const Ml = [M[0] - sn * w, M[1] - 0.02, M[2] + c * w], Mr = [M[0] + sn * w, M[1] - 0.02, M[2] - c * w];
        for (const [p, q, r] of [[B, Mr, M], [B, M, Ml], [M, Mr, Tp], [M, Tp, Ml]]) { g.tri(p, q, r, fr); g.tri(p, r, q, frD); }
      }
      if (!far) for (let q = 0; q < 3; q++) { const a = q / 3 * TAU + 0.5; ico(g, cx + Math.cos(a) * 0.03, 0.88, Math.sin(a) * 0.03, 0.022, 1, [0.4, 0.33, 0.14], R, 0.2); }   // (the coconuts)
    } else if (kind === 1) {
      cyl(g, 0, -0.02, 0, 0.05, 0.46, far ? 4 : 5, barkD, null, 0.04);
      const LF = [[0.22, 0.36, 0.14], [0.27, 0.42, 0.16], [0.31, 0.46, 0.18], [0.24, 0.39, 0.15]];
      const cl = far ? [[0, 0.64, 0, 0.38, 0.6], [0.1, 0.8, 0.05, 0.26, 0.6]]
        : [[0.24, 0.62, 0.1, 0.27, 0.7], [-0.22, 0.63, 0.12, 0.26, 0.7], [0, 0.62, -0.25, 0.26, 0.7], [0.02, 0.67, 0.26, 0.23, 0.7], [0.04, 0.8, 0.02, 0.27, 0.72]];   // (four round the lower tier, one on top)
      cl.forEach(([x, y, z, r, sy], q) => puff(g, x, y, z, r, sy, LF[q % 4], R, 0.22, 0.5, 1.12, !far));
    } else {
      const cl = far ? [[0, 0.45, 0, 0.5, 0.8]] : [[0.12, 0.42, 0.05, 0.42, 0.8], [-0.16, 0.38, -0.06, 0.38, 0.8], [0.02, 0.5, -0.18, 0.34, 0.8]];
      cl.forEach(([x, y, z, r, sy], q) => puff(g, x, y, z, r, sy, q % 2 ? [0.3, 0.37, 0.18] : [0.34, 0.41, 0.2], R, 0.28, 0.55, 1.08, false));
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // on the land cover (0 the grass and the bare earth, 1 the trees, 2 the scrub, 3 the villages and the car parks): the groves broadleaf trees
  // and palms with bushes under them; the scrub bushes, a tree here and there; lone palms, trees and bushes on the open plain; palms by the houses
  const LB_WOODS = {
    n: 3, geo: (k) => lbTreeGeo(k % 3, k >= 3), cr: [0.3, 0.44, 0.42], p: [0.012, 0.6, 0.32, 0.03],
    pick(cl, R, far) {
      const r = R(), r2 = R(), r3 = R();
      const sp = cl === 1 ? (r < 0.45 ? 1 : r < 0.8 ? 0 : 2) : cl === 2 ? (r < 0.85 ? 2 : r < 0.95 ? 1 : 0) : cl === 3 ? (r < 0.7 ? 0 : 1) : r < 0.4 ? 0 : r < 0.6 ? 1 : 2;
      let h = sp === 0 ? 10 + r2 * 7 : sp === 1 ? 7 + r2 * 6 : 1.4 + r2 * 1.8; if (far) h *= 1.06;
      return [sp, h, h * (sp === 0 ? 0.42 + r3 * 0.12 : sp === 1 ? 1.05 + r3 * 0.3 : 1.3 + r3 * 0.4)];
    },
  };

  // the service roads and the dirt tracks round the circuit (def.sk.svc, sk.trk: OSM's highway=service and =track): plain asphalt 5 m wide
  // and compacted red-brown earth 3.5 m wide on the ground, three points across every 4 m (the terrain under it), 8 cm over it and drawn over
  // it; not inside the barriers nor within 4 m past them (the run-offs are the builder's), the trees and the people off them
  function lbWays({ root, exclPush, CR }, S, HW, col, map, name, st) {
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
        const nx = -dz / dl, nz = dx / dl, row = [-HW, 0, HW].map(o => { const px = x + nx * o, pz = z + nz * o; return [px, nrGround(px, pz) + 0.08, pz]; });   // (left to right in the way's direction: (nx, nz) its right)
        const r = rb.row(row, [col, col, col], row.map((e, j) => [j * HW / 4, along / 4]));
        if (prev >= 0) rb.link(prev, r, 0, 2); prev = r;
        if (q % 2 === 0) { exclPush(x, z, HW + 1.5); if (nn.i >= 0 && nn.dd < 70) CR.avoid(x, z, HW + 0.5); }
        st.road += 4;
      }
    }
    if (rb.empty) return;
    const m = new THREE.Mesh(rb.geometry(), new THREE.MeshLambertMaterial({ map, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
    m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = name; root.add(m);
  }

  // ---- the streams (def.sk.str: OSM's waterway=stream, [points, culvert (1: in its pipe under a road, 0: open), x, z, ...]) in shallow
  //      swales cut into the plain (LK.pad: LB_DEEP deep, a flat bottom 2 * LB_R1 wide, 2 * LB_R at the top; narrower toward the barriers,
  //      none within 1.5 m past them, under the grandstands and their concourses, end paths and gates, or by the service roads and dirt
  //      tracks, which cross them on low embankments; ending at the culverts' mouths), their beds (LB_STR), concrete headwalls at the
  //      culverts' mouths, low parapets where the roads cross them on bridges (def.sk.brg: OSM's bridge=yes) ----
  const LB_STR = 'a';   // (awaiting the choice, docs/slike/lombok/po-*: a a dry bed of sand and pebbles at the end of the dry season, damp edges; b a trickle of brown water on a muddy bed; c the trickle, greener banks, bushes)
  const LB_R = 12, LB_R1 = 3.5, LB_DEEP = 1, LB_C = 16, LB_NONE = [];
  const lbKey = (ci, cj) => (ci + 2048) * 4096 + (cj + 2048);
  const lbHash = () => { const m = new Map(); return {
    add(x0, z0, x1, z1, v) { for (let i = Math.floor(x0 / LB_C); i <= Math.floor(x1 / LB_C); i++) for (let j = Math.floor(z0 / LB_C); j <= Math.floor(z1 / LB_C); j++) { const k = lbKey(i, j); let a = m.get(k); if (!a) m.set(k, a = []); a.push(v); } },
    at(x, z) { return m.get(lbKey(Math.floor(x / LB_C), Math.floor(z / LB_C))) || LB_NONE; } }; };
  const lbPolys = (S, hd) => { const o = []; for (let k = 0; k < S.length;) { const n = S[k], c = hd ? S[k + 1] : 0, p = []; for (let q = 0; q < n; q++) p.push([S[k + 1 + hd + q * 2], S[k + 2 + hd + q * 2]]); k += 1 + hd + n * 2; o.push({ p, c }); } return o; };
  const lbRes = (p, step) => { const o = []; for (let q = 0; q + 1 < p.length; q++) { const [ax, az] = p[q], [bx, bz] = p[q + 1], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step)); for (let t = 0; t < m; t++) o.push([lerp(ax, bx, t / m), lerp(az, bz, t / m)]); } o.push(p[p.length - 1]); return o; };
  const lbSegD = (x, z, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, t = l2 > 0 ? clamp(((x - ax) * dx + (z - az) * dz) / l2, 0, 1) : 0; return Math.hypot(x - ax - dx * t, z - az - dz * t); };
  const lbHs = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
  let LBS = null, lbPad0 = null;
  function lbStrPrep() {   // once per track definition (the terrain grid is kept between builds: the same swales every time)
    const T = API.T, def = T.def; if (LBS && LBS.def === def) return LBS;
    const sk = def.sk || {}, L = T.len, sAt = (d) => (((T.startS + d) % L) + L) % L;
    const all = lbPolys(sk.str || [], 1), ways = lbHash(), stands = lbHash(), samp = lbHash(), segs = [];
    for (const [S, hw] of [[sk.svc || [], 2.5], [sk.trk || [], 1.75]]) for (const { p } of lbPolys(S, 0)) for (let q = 0; q + 1 < p.length; q++) {   // (the ways' half widths: lbWays')
      const s = [p[q][0], p[q][1], p[q + 1][0], p[q + 1][1], hw], e = hw + 5; segs.push(s);
      ways.add(Math.min(s[0], s[2]) - e, Math.min(s[1], s[3]) - e, Math.max(s[0], s[2]) + e, Math.max(s[1], s[3]) + e, s); }
    const wayF = (x, z) => { let f = 1; for (const [ax, az, bx, bz, hw] of ways.at(x, z)) f = Math.min(f, sstep(hw + 1, hw + 5, lbSegD(x, z, ax, az, bx, bz))); return f; };
    const wayGap = (x, z) => { let g = 1e9; for (const [ax, az, bx, bz, hw] of ways.at(x, z)) g = Math.min(g, lbSegD(x, z, ax, az, bx, bz) - hw); return g; };
    const RS = LB_R + 4, foot = (x, z) => stands.add(x - RS, z - RS, x + RS, z + RS, [x, z]);
    const strip = (x0, z0, ux, uz, len, hw) => { const l = Math.hypot(ux, uz) || 1; ux /= l; uz /= l; for (let a = -4; a <= len + 4; a += 3) for (let w = -hw - 4; w <= hw + 4; w += 3) foot(x0 + ux * a - uz * w, z0 + uz * a + ux * w); };
    for (const [sa, sb, side, rows, , secs] of def.stands || []) {   // (the grandstands' footprints and 4 m round them: their rows from the barrier out, World.people's concourse behind them with its kiosks and toilets, its paths off their ends and out to their gates, which follow the ground)
      const bk = (d) => { const s = sAt(d), i = T.idx(s); return [s, (side > 0 ? T.br[i] : T.bl[i]) + 2.6 + rows * 0.95]; };   // (its back row)
      const pt = (d, o) => { const [s, f] = bk(d); return atSf(s, side * (f + o)); }, out = (d) => { const a = pt(d, 0), b = pt(d, 1); return [b[0] - a[0], b[1] - a[1]]; };
      for (let d = sa - 16; d <= sb + 16; d += 4) { const [s, f] = bk(d); for (let g = f - rows * 0.95 - 4; g <= f + 15; g += 4) { const [x, z] = atSf(s, side * g); foot(x, z); } }
      // its sections (world-rbring's, 3 m apart): World.people joins those whose fronts meet into one stand with its own end paths and gate (mergeChains), so each run of them one maybe
      const n = Math.max(1, secs || 1), sl = (sb - sa) / n, gp = n > 1 ? 3 : 0;
      for (let i = 0; i < n; i++) for (let j = i; j < n; j++) {
        const a = sa + i * sl + gp / 2, b = sa + (j + 1) * sl - gp / 2, p0 = pt(a, 0), p1 = pt(b, 0), cl = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1, tx = (p1[0] - p0[0]) / cl, tz = (p1[1] - p0[1]) / cl;   // (its chord: the way its end paths turn)
        for (const [d, e] of [[a, -1], [b, 1]]) { const [nx, nz] = out(d), [x, z] = pt(d, 3.65); strip(x + tx * e * 5, z + tz * e * 5, tx * e + nx, tz * e + nz, 22, 1.5); }   // (45° out, up to 22 m)
        let tot = 0; const cum = []; for (let d = a; d <= b + 1e-6; d += 2) { if (d > a) { const u = pt(d - 2, 0), v = pt(d, 0); tot += Math.hypot(v[0] - u[0], v[1] - u[1]); } cum.push([d, tot]); }
        const dm = cum.find(([, c]) => c >= tot / 2)[0], [nx, nz] = out(dm), [x, z] = pt(dm, 6.9); strip(x, z, nx, nz, 27, 5.5); }   // (from the middle of its back: up to 26 m, the gate, its ticket booth)
    }
    const standD = (x, z) => { let m = 1e9; for (const [sx, sz] of stands.at(x, z)) m = Math.min(m, Math.hypot(x - sx, z - sz)); return m; };
    const ends = all.map(({ p }) => [p[0], p[p.length - 1]]);
    const join = (k, e) => { const A = ends[k][e]; for (let m = 0; m < all.length; m++) if (m !== k) for (const B of ends[m]) if (Math.hypot(A[0] - B[0], A[1] - B[1]) < 1) return m; return -1; };
    const streams = [], mouths = [];
    all.forEach(({ p, c }, k) => {
      if (c) return;
      const jA = join(k, 0), jB = join(k, 1), pts = lbRes(p, 3), n = pts.length, al = [0];
      let tot = 0; for (let q = 1; q < n; q++) al.push(tot += Math.hypot(pts[q][0] - pts[q - 1][0], pts[q][1] - pts[q - 1][1]));
      const cap = (e) => { const m = e ? jB : jA; if (m < 0 || !all[m].c) return null; const a = pts[e ? n - 1 : 0], b = pts[e ? n - 2 : 1], l = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1; return [a[0], a[1], (a[0] - b[0]) / l, (a[1] - b[1]) / l]; };   // (a culvert at that end: its mouth, the way into the pipe)
      const cA = cap(0), cB = cap(1), S = [];
      for (const cp of [cA, cB]) if (cp) mouths.push({ x: cp[0], z: cp[1], ix: -cp[2], iz: -cp[3] });
      for (let q = 0; q < n; q++) {
        const [x, z] = pts[q], nn = nrNear(x, z), dd = nn.i >= 0 ? nn.dd : 1e9, sc = clamp((dd - 1.5) / LB_R, 0, 1);
        const f = (jA >= 0 ? 1 : sstep(0, 12, al[q])) * (jB >= 0 ? 1 : sstep(0, 12, tot - al[q])) * sc * sstep(LB_R, LB_R + 4, standD(x, z));
        const R = LB_R * sc, R1 = LB_R1 * sc, cp = cA && al[q] < 16 ? cA : cB && tot - al[q] < 16 ? cB : null;
        if (f > 0) samp.add(x - R - 4, z - R - 4, x + R + 4, z + R + 4, [x, z, f, R, R1, cp]);
        S.push({ x, z, dd, f, sc, al: al[q] }); }
      streams.push(S); });
    return (LBS = { def, samp, wayF, wayGap, streams, mouths, segs, brg: lbPolys(sk.brg || [], 0) });
  }
  function lbCarve(x, z, ex) {   // 0..1: how deep the swale is here (ex > 0: the band round it, for the colours); no nrNear (the pad runs inside nrH)
    const S = LBS; if (!S) return 0; let c = 0;
    for (const [sx, sz, f, R, R1, cp] of S.samp.at(x, z)) { const d = Math.hypot(x - sx, z - sz); if (d >= R + ex) continue;
      let v = f * sstep(R + ex, ex ? R1 * 0.6 : R1, d);
      if (cp) { const pr = (x - cp[0]) * cp[2] + (z - cp[1]) * cp[3]; if (pr > 0) v *= sstep(4, 0, pr); }   // (past a culvert's mouth: the bank rises to the plain behind the headwall)
      if (v > c) c = v; }
    return c > 0 ? c * S.wayF(x, z) : 0;
  }
  function lbPad(pad0) { lbPad0 = pad0; lbStrPrep(); return (x, z, h) => { const h0 = pad0(x, z, h); if (h0 !== h) return h0; const c = lbCarve(x, z, 0); return c > 0 ? h - LB_DEEP * c : h; }; }
  function lbWaterMat(U) { const m = brookMat(U), ob = m.onBeforeCompile; m.onBeforeCompile = (sh, r) => { ob(sh, r); sh.fragmentShader = sh.fragmentShader.replace('sky * fr * 0.6', 'mix(sky, vec3(0.32, 0.27, 0.18), 0.55) * fr * 0.42'); }; m.customProgramCacheKey = () => 'brook1lb'; return m; }   // (Spa's brook, the sky in it muddier: a trickle of brown water)
  function lbStreams({ root, scen, exclPush, excluded, CR, out }, st) {
    const S = lbStrPrep(), A = LB_STR === 'a', ON = [-2.6, -1.5, 0, 1.5, 2.6], OY = [-0.06, 0.06, 0.08, 0.06, -0.06];
    const CON = [0.76, 0.74, 0.69], CONT = [0.84, 0.82, 0.77], DARK = [0.1, 0.1, 0.09], RS = rng(7351);
    const W = A ? null : new Chunks(512, true), U = { uT: { value: 0 } };
    for (const P of S.streams) {   // the beds (and the water), 5 points across every 3 m on the swale's bottom
      let prev = null, prevW = null, along = 0;
      for (let q = 0; q < P.length; q++) {
        const p = P[q], a = P[Math.max(0, q - 1)], b = P[Math.min(P.length - 1, q + 1)], dx = b.x - a.x, dz = b.z - a.z, dl = Math.hypot(dx, dz) || 1, nx = -dz / dl, nz = dx / dl;
        if (q) along += Math.hypot(p.x - P[q - 1].x, p.z - P[q - 1].z);
        if (!(p.f >= 0.2 && p.dd >= 6 && nrDist(p.x, p.z) < 400 && !excluded(p.x, p.z) && S.wayGap(p.x, p.z) >= 0.5)) { prev = prevW = null; continue; }
        const w = p.sc, h = lbHs(p.x, p.z), cur = ON.map((o, j) => { const px = p.x + nx * o * w, pz = p.z + nz * o * w; return [px, nrGround(px, pz) + OY[j], pz]; });
        const bank = A ? [0.42, 0.4, 0.27] : [0.34, 0.36, 0.2], edge = A ? [0.56, 0.5, 0.4].map(v => v * (0.94 + 0.12 * h)) : [0.42, 0.36, 0.26];
        const mid = A ? [0, 1, 2].map(k => lerp([0.74, 0.68, 0.56][k], [0.62, 0.59, 0.53][k], h)) : [0.38, 0.31, 0.22], cols = [bank, edge, mid, edge, bank];
        if (prev) { const g = scen.get(p.x, p.z); for (let j = 0; j < 4; j++) g.quadUp(prev.r[j], prev.r[j + 1], cur[j + 1], cur[j], [prev.c[j], prev.c[j + 1], cols[j + 1], cols[j]]); st.str += 3; }
        prev = { r: cur, c: cols };
        if (W) { const ww = Math.max(0.6, w), wr = [-0.9, 0, 0.9].map(o => { const px = p.x + nx * o * ww, pz = p.z + nz * o * ww; return [px, nrGround(px, pz) + 0.11, pz]; });
          if (prevW) { const g = W.get(p.x, p.z), C0 = [0.4, 0.31, 0.2], C1 = [0.26, 0.2, 0.13], a0 = prevW.al, a1 = along;
            g.quadUp(prevW.r[0], prevW.r[1], wr[1], wr[0], [C0, C1, C1, C0], [[0, a0], [0.5, a0], [0.5, a1], [0, a1]]);
            g.quadUp(prevW.r[1], prevW.r[2], wr[2], wr[1], [C1, C0, C0, C1], [[0.5, a0], [1, a0], [1, a1], [0.5, a1]]); }
          prevW = { r: wr, al: along }; }
      }
    }
    if (W) { W.addTo(root, lbWaterMat(U), false, true); out.dyn.brook = U; }   // (World.update makes it flow, downstream: OSM draws the streams that way)
    const wall = (mx, mz, ix, iz, cM) => {   // a culvert's headwall across the swale's end, its dark opening, wing walls along the sides
      const rot = Math.atan2(ix, -iz), ax = Math.cos(rot), az = Math.sin(rot), g = scen.get(mx, mz);
      const ya = nrGround(mx + ax * 2.3, mz + az * 2.3), yb0 = nrGround(mx - ax * 2.3, mz - az * 2.3), yc = nrGround(mx, mz), yb = Math.min(ya, yb0, yc);
      const top = Math.max(yc + LB_DEEP * cM + 0.45, Math.max(ya, yb0) + 0.4);   // (its top a little above the plain, as by the roads)
      box(g, mx, yb - 0.3, mz, 4.6, top - yb + 0.3, 0.35, rot, CON, CONT);
      box(g, mx + ix * 0.19, yb - 0.05, mz + iz * 0.19, 0.9, Math.min(0.65, LB_DEEP * cM + 0.1) + 0.05, 0.04, rot, DARK, DARK);
      for (const sd of [-1, 1]) { const wx = mx + ax * sd * 2.15 + ix * 0.9, wz = mz + az * sd * 2.15 + iz * 0.9; box(g, wx, Math.min(nrGround(wx, wz), yb) - 0.3, wz, 1.8, top - yb + 0.2, 0.3, rot + Math.PI / 2, CON, CONT); }
      exclPush(mx, mz, 4); CR.avoid(mx, mz, 3); st.culverts++; };
    for (const m of S.mouths) {
      if (S.brg.some(({ p }) => p.some((q, k) => k && lbSegD(m.x, m.z, p[k - 1][0], p[k - 1][1], q[0], q[1]) < 8))) continue;   // (at a bridge: its parapets)
      const nn = nrNear(m.x, m.z), cM = lbCarve(m.x + m.ix * 0.5, m.z + m.iz * 0.5, 0);
      if ((nn.i >= 0 && nn.dd < 2) || S.wayGap(m.x, m.z) < 1 || cM < 0.3) continue;   // (none in the run-offs, on the ways, where the swale is too shallow)
      wall(m.x, m.z, m.ix, m.iz, cM); }
    for (const { p } of S.brg) for (let k = 1; k < p.length; k++) {   // the bridges: low concrete parapets along the road's edges over the stream
      const [ax, az] = p[k - 1], [bx, bz] = p[k], cx = (ax + bx) / 2, cz = (az + bz) / 2, L = Math.hypot(bx - ax, bz - az) || 1, tx = (bx - ax) / L, tz = (bz - az) / L;
      if (!S.streams.some(P => P.some(q => Math.hypot(q.x - cx, q.z - cz) < 6 + L / 2))) continue;
      let hw = 2.5, best = 1e9; for (const [sx0, sz0, sx1, sz1, h] of S.segs) { const d = lbSegD(cx, cz, sx0, sz0, sx1, sz1); if (d < best) { best = d; hw = h; } }
      for (const sd of [-1, 1]) { const px = cx - tz * sd * (hw + 0.3), pz = cz + tx * sd * (hw + 0.3); box(scen.get(px, pz), px, nrGround(px, pz) - 0.12, pz, L + 1, 0.75, 0.25, Math.atan2(tz, tx), CON, CONT); }
      st.bridges++; }
    for (const P of S.streams) P.forEach((p, q) => { if (p.f < 0.05) return; exclPush(p.x, p.z, 3.4 * Math.max(0.5, p.sc)); if (q % 2 === 0 && p.dd < 70) CR.avoid(p.x, p.z, 3); });   // (no trees or people in the beds)
    if (LB_STR === 'c') { const BU = new IChunks(lbTreeGeo(2, false), new THREE.MeshLambertMaterial({ vertexColors: true }), 512);   // bushes along the banks
      for (const P of S.streams) for (let q = 1; q + 1 < P.length; q++) { if (RS() < 0.45) continue;
        const p = P[q], a = P[q - 1], b = P[q + 1], dl = Math.hypot(b.x - a.x, b.z - a.z) || 1, o = (RS() < 0.5 ? -1 : 1) * (3.2 + RS() * 4), x = p.x - (b.z - a.z) / dl * o, z = p.z + (b.x - a.x) / dl * o, nn = nrNear(x, z);
        if (excluded(x, z) || (nn.i >= 0 && nn.dd < 4) || S.wayGap(x, z) < 2 || nrDist(x, z) > 400) continue;
        const h = 1.4 + RS() * 1.8; BU.add(x, nrGround(x, z) - 0.1, z, RS() * TAU, h * (1.3 + RS() * 0.4), h, [0.8, 1.05, 0.8]); exclPush(x, z, 1.5); st.bushes++; }
      BU.addTo(root, false); }
  }

  // the sea (def.sk.sea: y its level, z0 the plane's north edge): one plane south of the coast out past the far clip (north of z0 the land; the
  // terrain hides it where it stands above the water), the surf along the shore (the band at the waterline of the terrain grid: the shallows'
  // colour, the foam); the trees and the people off the water and the beach
  function lbSea({ root, tex, exclPush, out }, st) {
    const S = (API.T.def.sk || {}).sea, G = API.NR && API.NR.G; if (!S || !G) return;
    const Y = S.y, WO = { len: 2.4, amp: 1.1, refl: 0.42, shal: 0.85, lap: 1, surf: 0.85 };
    const g = new THREE.PlaneGeometry(9000, 4600, 1, 1).rotateX(-Math.PI / 2);
    const sea = new THREE.Mesh(g, waterMat(tex, Object.assign({ color: 0x5aaabb }, WO))); sea.position.set(S.x, Y, S.z0 + 2300); sea.receiveShadow = true; sea.matrixAutoUpdate = false; sea.updateMatrix(); sea.name = 'lombok sea'; root.add(sea);
    out.dyn.water = tex.water;
    addShore(root, shoreBand(G.x0, G.z0, G.x0 + (G.nx - 1) * NRC, G.z0 + (G.nz - 1) * NRC, Y + 0.015, waterline(nrGH, G.x0, G.z0, NRC, 0, G.nx - 1, 0, G.nz - 1, Y), 22, { F: 4 }), sea.material, WO);
    for (let j = 0; j < G.nz; j += 3) for (let i = 0; i < G.nx; i += 3) {
      const x = G.x0 + i * NRC, z = G.z0 + j * NRC; if (nrGH(i, j) < Y + 0.8 && nrDist(x, z) < 320) { exclPush(x, z, NRC * 2.3); st.sea++; }
    }
  }

  // the horizon (def.far, Riverside's rsFar): the sea's blue, the plain's dry grass, the wooded hills of the south of the island, in the haze
  // off the sea
  const lbFarCol = (h, d) => {
    const c = h < 1.5 ? [0.34, 0.52, 0.6] : h < 40 ? [0.4, 0.44, 0.26] : h < 160 ? [0.29, 0.38, 0.2] : [0.31, 0.36, 0.22], f = (1 - Math.exp(-d / 22000)) * 0.85;
    return c.map((v, k) => lerp(v, [0.78, 0.84, 0.88][k], f));
  };

  // The plain's own ground (LK.ground: the builder's ground material for the terrain, the verges and the mown bands). Its texture: 256 px,
  // tileable, a fresh one per build (the world owns and frees it): r the dry grass's grain (pale stalks, dark gaps: a speck is a texel or
  // two), g the relief (clods and small tufts as domes, a few mounds: the sun-side emboss and the tint read it), b the bare earth's grit
  // with pale pebbles, a soft blotches (4..16 cells across the tile)
  function lbGTex() {
    const S = 256, d = new Uint8Array(S * S * 4), R = rng(7341);
    const lat = (P, seed) => { const r = rng(seed), v = new Float32Array(P * P); for (let k = 0; k < v.length; k++) v[k] = r();
      return (x, y) => { const a = x * P / S, b = y * P / S, i = Math.floor(a), j = Math.floor(b), fu = a - i, fv = b - j, su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv), at = (p, q) => v[(q % P) * P + (p % P)];
        return lerp(lerp(at(i, j), at(i + 1, j), su), lerp(at(i, j + 1), at(i + 1, j + 1), su), sv); }; };
    const f32 = lat(32, 7342), f64 = lat(64, 7343), f128 = lat(128, 7344), e64 = lat(64, 7345), e128 = lat(128, 7346), a4 = lat(4, 7347), a8 = lat(8, 7348), a16 = lat(16, 7349);
    const H = new Float32Array(S * S), PB = new Float32Array(S * S), G = new Float32Array(S * S);
    const dome = (A, cx, cy, r, h, pw) => { const r0 = Math.ceil(r); for (let dy = -r0; dy <= r0; dy++) for (let dx = -r0; dx <= r0; dx++) { const q = (dx * dx + dy * dy) / (r * r); if (q >= 1) continue;
      const k = (((Math.round(cy) + dy) % S + S) % S) * S + ((Math.round(cx) + dx) % S + S) % S, v = h * Math.pow(1 - q, pw); if (v > A[k]) A[k] = v; } };
    const spot = (A, cx, cy, r, v) => { const r0 = Math.ceil(r); for (let dy = -r0; dy <= r0; dy++) for (let dx = -r0; dx <= r0; dx++) { const q = (dx * dx + dy * dy) / (r * r); if (q >= 1) continue;
      const k = (((Math.round(cy) + dy) % S + S) % S) * S + ((Math.round(cx) + dx) % S + S) % S; A[k] += (v - A[k]) * (1 - q); } };
    for (let k = 0; k < 60; k++) dome(H, R() * S, R() * S, 4 + R() * 3.5, 0.5 + R() * 0.5, 0.7);        // mounds
    for (let k = 0; k < 1500; k++) dome(H, R() * S, R() * S, 1.1 + R() * 2.1, 0.25 + R() * 0.6, 0.8);   // clods and small tufts
    for (let k = 0; k < 900; k++) spot(G, R() * S, R() * S, 0.8 + R() * 1.3, R() < 0.55 ? -0.3 : 0.32);   // the grain's specks: gaps and pale stalks
    for (let k = 0; k < 420; k++) dome(PB, R() * S, R() * S, 1 + R() * 1.5, 0.5 + R() * 0.5, 0.6);   // pale pebbles
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const k = y * S + x, o = k * 4;
      d[o] = clamp(0.5 + (f64(x, y) - 0.5) * 0.3 + (f128(x, y) - 0.5) * 0.4 + (R() - 0.5) * 0.2 + G[k], 0, 1) * 255;
      d[o + 1] = clamp(0.12 + H[k] * 0.7 + (f128(x, y) - 0.5) * 0.14 + (f32(x, y) - 0.5) * 0.1, 0, 1) * 255;
      d[o + 2] = clamp(0.42 + (e64(x, y) - 0.5) * 0.45 + (e128(x, y) - 0.5) * 0.5 + PB[k] * 0.5, 0, 1) * 255;
      d[o + 3] = clamp(0.5 + (a4(x, y) - 0.5) * 0.9 + (a8(x, y) - 0.5) * 0.55 + (a16(x, y) - 0.5) * 0.3, 0, 1) * 255; }
    const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat, THREE.UnsignedByteType);   // (a DataTexture: a canvas would premultiply the alpha)
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true;
    return t;
  }
  // The ground's look, by the vertex colours' hue (so the seasons' repainting switches it off by itself): the watered lawns keep the shared
  // grassLook's look (the same numbers, its noises from the texture); the dry grass gets blotches, paler straw in patches, and a grit as the
  // gravel hills' ground has (three scales of the texture: 120 m, 23 m turned against the first - a texel 9 cm, what the camera behind the
  // car sees - and 5 m near the car): earth dark between pale clods and tufts, lit from the sun's side; the red earth bare with crisp,
  // ragged edges inside the vertex colours' soft patches
  function lbGround(m, ownTex) {
    const t = ownTex(lbGTex()), nat = API.T.def.grassNat || 0;
    m.userData.grassLook = true;   // (the shared grassLook keeps off this material: its look is done here)
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uLbT = { value: t }; sh.uniforms.uLbN = { value: nat }; sh.uniforms.uPat = m.userData.uPat || (m.userData.uPat = { value: 1 });
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vLbW; varying float vLbD;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvLbW = (modelMatrix * vec4(transformed, 1.0)).xz; vLbD = -mvPosition.z;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vLbW; varying float vLbD; uniform sampler2D uLbT; uniform float uLbN; uniform float uPat;')
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + [
          'float lbE = 0.0;',
          '{ vec3 gc = diffuseColor.rgb, vc = vColor.rgb;',
          '  float gg = clamp((gc.g - max(gc.r, gc.b)) * 8.0, 0.0, 1.0);',
          '  vec2 lbUB = vec2(vLbW.x * 0.8 - vLbW.y * 0.6, vLbW.x * 0.6 + vLbW.y * 0.8) * 0.043;',
          '  vec4 lA = texture2D(uLbT, vLbW * 0.0083), lB = texture2D(uLbT, lbUB), lC = texture2D(uLbT, vLbW * 0.19);',
          '  float rg = vc.r / max(vc.g, 0.01), bg = vc.b / max(vc.g, 0.01), pale = smoothstep(1.15, 1.3, bg);',
          '  float dry = smoothstep(1.03, 1.2, rg + (lB.a - 0.5) * 0.14) * (1.0 - pale), rr = clamp((rg - 1.42) / 0.3, 0.0, 1.0) * (1.0 - pale);',
          '  float nearM = 1.0 - smoothstep(90.0, 200.0, vLbD), nearF = 1.0 - smoothstep(22.0, 60.0, vLbD);',
          '  float lw = gg * (1.0 - dry);',
          '  if (lw > 0.0) {',
          '    gc *= mix(1.0, 0.84 + 0.3 * lA.a, lw * uPat);',
          '    gc = mix(gc, gc * vec3(1.12, 1.04, 0.7), lw * smoothstep(0.62, 0.95, lA.a * 0.5 + lB.a * 0.5) * 0.6 * uPat);',
          '    gc *= 1.0 + lw * (lC.a - 0.5) * 0.22 * (1.0 - smoothstep(70.0, 160.0, vLbD));',
          '    if (uLbN > 0.0) { float L = dot(gc, vec3(0.3, 0.59, 0.11)); gc = mix(gc, mix(vec3(L), gc, 0.72) * vec3(1.04, 0.96, 0.86), lw * uLbN); } }',
          '  if (dry > 0.0) {',
          '    float bl = lB.a * 0.6 + lA.a * 0.4;',
          '    gc *= mix(1.0, 0.86 + 0.3 * bl, dry);',
          '    float L = dot(gc, vec3(0.3, 0.59, 0.11));',
          '    gc = mix(gc, L * vec3(1.2, 1.0, 0.62), dry * 0.5 * smoothstep(0.35, 0.7, bl));',
          '    float hh = mix(lB.g, lB.g * 0.45 + lC.g * 0.55, nearF);',
          '    gc *= mix(vec3(1.0), mix(vec3(0.8, 0.71, 0.62), vec3(1.2, 1.15, 1.0), smoothstep(0.1, 0.6, hh)), dry * nearM);',
          '    gc *= 1.0 + dry * ((lB.r - 0.5) * 0.55 * nearM + (lC.r - 0.5) * 0.3 * nearF); }',
          '  float e = 0.0;',
          '  if (rr > 0.0) {',
          '    e = smoothstep(-0.08, 0.08, rr - (0.35 + (lB.a - 0.5) * 0.9 + (lC.b - 0.5) * 0.25)) * smoothstep(0.02, 0.12, rr);',
          '    gc *= mix(vec3(1.0), vec3(0.87, 1.15, 1.22), rr * (1.0 - e));',
          '    vec3 earth = mix(vec3(0.6, 0.35, 0.25), vec3(0.68, 0.5, 0.36), lA.a) * (0.78 + 0.24 * lB.b + 0.2 * lC.b) * diffuse;',
          '    gc = mix(gc, earth, e); }',
          '  #if NUM_DIR_LIGHTS > 0',
          '  { vec3 lbL = ( vec4( directionalLights[ 0 ].direction, 0.0 ) * viewMatrix ).xyz; vec2 lbO = vec2( lbL.x, lbL.z ); float lbOl = length( lbO ); lbO /= max( lbOl, 1e-3 );',
          '    float eM = ( lB.g - texture2D( uLbT, lbUB + vec2( lbO.x * 0.8 - lbO.y * 0.6, lbO.x * 0.6 + lbO.y * 0.8 ) * 0.0045 ).g ) * 1.9 * nearM;',
          '    float eF = ( lC.g - texture2D( uLbT, vLbW * 0.19 + lbO * 0.012 ).g ) * 1.3 * nearF;',
          '    lbE = ( eM + eF ) * min( lbOl / max( lbL.y, 0.2 ), 2.5 ) * ( dry * ( 1.0 - e ) + e * 0.4 ); }',
          '  #endif',
          '  diffuseColor.rgb = gc; }',
        ].join('\n'))
        .replace('reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();', 'reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask() * clamp( 1.0 + lbE, 0.4, 1.7 );');
    };
    m.customProgramCacheKey = () => 'lbGroundN';   // (ends in N as the shared look's key of the natural grass: render.js look2Info)
    m.needsUpdate = true;
  }

  // The plain's low growth (from lbExtra): tussocks of dry grass thick on the open land (the land cover's classes 0 and 2: grass, scrub) from
  // the lawns' edge outwards (pale dry ones and olive ones side by side), tall dark clumps among them in the scrub; a stray one on the bare
  // red earth and on the mown strip by the barriers; none on the roads, round the buildings, on the paved car park (LB_PARK), in the streams'
  // swales, on the beaches, by the pits. One clump geometry, an InstancedMesh per 32 m chunk under a THREE.LOD (gone past
  // LBV_FAR, each clump shrinking into the ground before that), casting no shadows
  const LBV_FAR = 125, LBV_C = 32, LBV_G = 8;
  const LB_PARK = [396.1, -152.8, 448.1, -166.1, 445.5, -180.1, 447.3, -201.5, 438.9, -195.4, 392.5, -181.6, 391.1, -177.7, 387.3, -176.6];   // (the paved car park's outline, OSM way 1194049492, x and z by pairs: no grass through its slab)
  function lbClumpGeo() {   // a star of 10 broad blades from a small ring (7 leaning far out, 3 steeper inside them): 10 triangles; the normals nearly upright (lit as the ground under them), dark at the foot (as its own shadow), pale at the tips
    const P = [], N = [], C = [], R = rng(7351);
    for (let k = 0; k < 10; k++) { const lo = k < 7, a = (lo ? k / 7 : (k - 7) / 3 + 0.07) * TAU + (R() - 0.5) * 0.5, c = Math.cos(a), s = Math.sin(a);
      const r0 = lo ? 0.06 : 0.03, rt = lo ? 0.4 + R() * 0.16 : 0.12 + R() * 0.1, ht = lo ? 0.3 + R() * 0.2 : 0.6 + R() * 0.25, hw = lo ? 0.1 : 0.08, n = Math.hypot(c * 0.45, 1, s * 0.45);
      P.push(c * r0 - s * hw, 0, s * r0 + c * hw, c * r0 + s * hw, 0, s * r0 - c * hw, c * rt, ht, s * rt);
      for (let v = 0; v < 3; v++) { const sh = v < 2 ? 0.42 : 1.15; N.push(c * 0.45 / n, 1 / n, s * 0.45 / n); C.push(sh, sh, sh); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), LBV_C * 0.75 + 8);   // (a whole chunk's: the instances lie round the chunk's centre)
    return g;
  }
  function lbVegMat() {
    const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\n{ vec4 lbP = modelViewMatrix * instanceMatrix * vec4( 0.0, 0.0, 0.0, 1.0 ); transformed *= 1.0 - smoothstep( ' + (LBV_FAR * 0.72).toFixed(1) + ', ' + LBV_FAR.toFixed(1) + ', length( lbP.xyz ) ); }\n#endif');   // (the clump's distance in view space: a Lambert material is not handed cameraPosition)
      sh.fragmentShader = sh.fragmentShader.replace('( gl_FrontFacing ) ? vLightFront : vLightBack', 'vLightFront').replace('( gl_FrontFacing ) ? vIndirectFront : vIndirectBack', 'vIndirectFront');   // (both faces lit as the front: no dark backs of the blades)
    };
    m.customProgramCacheKey = () => 'lbVeg';
    return m;
  }
  function lbVeg(o, st) {
    const { root, excluded } = o, T = API.T, def = T.def, P = API.NR, SY = ((def.sk || {}).sea || {}).y, pd = def.pit, pitSide = pd ? (pd[0] < 0 ? -1 : 1) : 0, R = rng(7353);
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < T.N; i++) { x0 = Math.min(x0, T.px[i]); x1 = Math.max(x1, T.px[i]); z0 = Math.min(z0, T.pz[i]); z1 = Math.max(z1, T.pz[i]); }
    x0 = Math.floor((x0 - 72) / LBV_C) * LBV_C; z0 = Math.floor((z0 - 72) / LBV_C) * LBV_C; x1 += 72; z1 += 72;
    // the distance beyond the barriers on an 8 m lattice, filled as it is asked for (nrNear is dear), read bilinearly; by the pits: none
    const gw = Math.ceil((x1 - x0) / LBV_G) + 2, gh = Math.ceil((z1 - z0) / LBV_G) + 2, DD = new Float32Array(gw * gh).fill(-1);
    const ddOf = (x, z) => { const nn = nrNear(x, z); return nn.i < 0 || (pitSide && Math.sign(nn.lat) === pitSide && T.pitAt(nn.i * T.ds)) ? 99 : nn.dd; };
    const node = (a, b) => { const k = b * gw + a; let v = DD[k]; if (v < 0) v = DD[k] = ddOf(x0 + a * LBV_G, z0 + b * LBV_G); return v; };
    // (where the barrier's line crosses the cell the lattice would smear it: asked exactly there; 'far': the caller wants only the land past the bands)
    const ddAt = (x, z, far) => { const fx = (x - x0) / LBV_G, fz = (z - z0) / LBV_G, a = Math.floor(fx), b = Math.floor(fz), u = fx - a, v = fz - b, n0 = node(a, b), n1 = node(a + 1, b), n2 = node(a, b + 1), n3 = node(a + 1, b + 1), lo = Math.min(n0, n1, n2, n3);
      if (lo > 0.01) return lerp(lerp(n0, n1, u), lerp(n2, n3, u), v);
      return Math.max(n0, n1, n2, n3) <= 0.01 || far ? 0 : ddOf(x, z); };
    const pk = LB_PARK, pkB = [1e9, 1e9, -1e9, -1e9]; for (let k = 0; k < pk.length; k += 2) { pkB[0] = Math.min(pkB[0], pk[k]); pkB[1] = Math.min(pkB[1], pk[k + 1]); pkB[2] = Math.max(pkB[2], pk[k]); pkB[3] = Math.max(pkB[3], pk[k + 1]); }
    const inPark = (x, z) => { if (x < pkB[0] - 3 || x > pkB[2] + 3 || z < pkB[1] - 3 || z > pkB[3] + 3) return false;   // (inside the outline or within 3 m of it)
      let ins = false, dm = 1e9;
      for (let k = 0, n = pk.length; k < n; k += 2) { const ax = pk[k], az = pk[k + 1], ex = pk[(k + 2) % n] - ax, ez = pk[(k + 3) % n] - az, t = clamp(((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez), 0, 1);
        dm = Math.min(dm, Math.hypot(x - ax - ex * t, z - az - ez * t));
        if ((az > z) !== (az + ez > z) && x < ax + (z - az) / ez * ex) ins = !ins; }
      return ins || dm < 3; };
    const SC = 16, NS = 9, STEP = SC / NS, chunks = new Map();
    for (let cz = z0; cz < z1; cz += SC) for (let cx = x0; cx < x1; cx += SC) {
      const dC = nrDist(cx + SC / 2, cz + SC / 2); if (dC > 64 + 50 + 12 || dC < 3) continue;
      for (let b = 0; b < NS; b++) for (let a = 0; a < NS; a++) {
        const x = cx + (a + R()) * STEP, z = cz + (b + R()) * STEP, lc = nrLC(x, z), u = R(), u2 = R(), u3 = R(), u4 = R(), u5 = R();   // (the same draws whatever is kept)
        if (lc !== 0 && lc !== 2) continue;
        const dryN = sstep(0.35, 0.7, P.n3(x * 0.7 + 90, z * 0.7 - 40));
        let dens = 0.55 + 0.45 * dryN;
        if (lc === 0) dens *= 1 - 0.94 * sstep(0.66, 0.76, P.n1(x * 1.3 + 40, z * 1.3 - 510));   // (the red earth bare but for a stray clump, thinning toward its edge: lbGround)
        if (u > dens) continue;
        const dd = ddAt(x, z, u > dens * 0.8); if (dd < 0.5 || dd >= 52) continue;
        // (unmown at the barrier's foot, a stray one on the mown strip beyond it, thick from the lawns' edge on, thinning far out)
        if (u > dens * (dd < 2.2 ? 0.8 : Math.max(0.05, sstep(5, 10, dd)) * (1 - 0.88 * sstep(32, 52, dd)))) continue;
        if (excluded(x, z) || inPark(x, z) || (LBS && lbCarve(x, z, 2) > 0) || (SY != null && nrDem(x, z) - SY < 2.2)) continue;
        // (olive clumps and pale dry ones side by side, more of the pale where the land is paler; lusher by the watered lawns; the scrub's tall clumps dark)
        const q = sstep(0.3, 0.75, P.n1(x * 0.9 - 210, z * 0.9 + 75)), wet = sstep(14, 6, dd), big = lc === 2 && u2 < 0.14, pal = !big && u2 > lerp(0.62, 0.45, q) + 0.2 * wet;
        const s = big ? 1.6 + u3 * 0.6 : 0.85 + u3 * 0.65, j = 0.88 + u4 * 0.24;
        const key = Math.floor((x - x0) / LBV_C) * 4096 + Math.floor((z - z0) / LBV_C); let L = chunks.get(key); if (!L) chunks.set(key, L = []);
        L.push(x, nrGround(x, z), z, u5 * TAU, s, s * (0.7 + u4 * 0.5), (big ? 0.3 : pal ? lerp(0.86, 0.94, q) : lerp(0.4, 0.34, wet)) * j, (big ? 0.4 : pal ? lerp(0.76, 0.82, q) : lerp(0.47, 0.52, wet)) * j, (big ? 0.16 : pal ? lerp(0.46, 0.54, q) : lerp(0.19, 0.17, wet)) * j);
      }
    }
    const geo = lbClumpGeo(), mat = lbVegMat(), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), C = new THREE.Color();
    for (const [key, L] of chunks) {
      const n = L.length / 9, cx = x0 + (Math.floor(key / 4096) + 0.5) * LBV_C, cz = z0 + (key % 4096 + 0.5) * LBV_C; let cy = 0; for (let q = 1; q < L.length; q += 9) cy += L[q]; cy /= n;
      const mesh = new THREE.InstancedMesh(geo, mat, n);
      for (let k = 0, q = 0; k < n; k++, q += 9) { M.compose(V.set(L[q] - cx, L[q + 1] - cy - 0.03, L[q + 2] - cz), Q.setFromAxisAngle(UP, L[q + 3]), S.set(L[q + 4], L[q + 5], L[q + 4]));
        mesh.setMatrixAt(k, M); mesh.setColorAt(k, C.setRGB(L[q + 6], L[q + 7], L[q + 8])); }
      mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.instanceColor.ground = true;   // (the seasons paint the clumps as grass)
      mesh.name = 'lombok tussocks'; mesh.castShadow = false; mesh.receiveShadow = true; mesh.matrixAutoUpdate = false; mesh.frustumCulled = true;   // (an InstancedMesh is not culled unless asked: the geometry's sphere is the chunk's)
      const lod = new THREE.LOD(); lod.name = 'lombok tussocks'; lod.addLevel(mesh, 0); lod.addLevel(new THREE.Object3D(), LBV_FAR + LBV_C * 0.75);
      root.add(lod); lod.position.set(cx, cy, cz); lod.matrixAutoUpdate = false; lod.updateMatrix(); lod.updateMatrixWorld(true);
      st.tufts += n; st.tuftChunks++;
    }
  }

  // LK.extra: the service roads and the dirt tracks, the building past the pit lane (an OSM outline as a box: white render, a grey roof), the
  // sea, the horizon, the low growth; before the crowds and the trees, which keep clear of them
  function lbExtra(o) {
    const { scen, exclPush, CR, root, out, tex } = o, sk = API.T.def.sk || {}, R = rng(7337), st = { road: 0, buildings: 0, sea: 0, far: 0, str: 0, culverts: 0, bridges: 0, bushes: 0, tufts: 0, tuftChunks: 0 };
    lbWays(o, sk.svc || [], 2.5, [0.9, 0.9, 0.92], tex.asphalt, 'lombok service roads', st);
    lbWays(o, sk.trk || [], 1.75, [0.98, 0.8, 0.66], tex.sand, 'lombok dirt tracks', st);
    const b6 = sk.bld || [], WALL = [[0.94, 0.93, 0.9], [0.9, 0.88, 0.82]], ROOF = [[0.5, 0.52, 0.54], [0.38, 0.4, 0.42]];
    for (let k = 0; k < b6.length; k += 6) {
      const [x, z, L, W, deg, h] = b6.slice(k, k + 6), rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot);
      let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2));
      box(scen.get(x, z), x, y - 0.4, z, L, h + 0.4, W, rot, WALL[Math.floor(R() * 2)], ROOF[Math.floor(R() * 2)], true);
      exclPush(x, z, Math.hypot(L, W) / 2 + 2); CR.avoid(x, z, Math.hypot(L, W) / 2 + 1); st.buildings++;
    }
    lbStreams(o, st);
    lbVeg(o, st);
    lbSea(o, st);
    if (API.T.def.far && API.rsFar) { out.dyn.far = API.rsFar(root, API.T.def.far, 'summer', 6, lbFarCol); st.far = 1; }   // (World.update: no car, back where it was built)
    return st;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    lombok: { ban: LB_BAN, at: LB_AT, nums: 17, numC: ['#ce1126', '#fff', '#fff'], shirts: LB_SHIRTS, smoke: false, camps: 0, farms: 0, seC: [1.12, 1.02, 0.86], gravel: false, noVid: true,
      pitBox: [-230, 190, -1], mow: 0.4,   // (the pit building on the left of the main straight, its garages from the pit entry's end to Turn 1's brakes; fainter mowing stripes; no farms by the circuit)
      woods: LB_WOODS, extra: lbExtra, ground: lbGround, lane: true, fl: { id: ID }, ck: 2,   // (ck: chunks twice as big: fewer draws where much of the circuit is in view)
      pad: lbPad, padTrees: (x, z) => !!lbPad0 && lbPad0(x, z, 0) === 0,   // (the streams' swales cut into the plain; trees on their banks, not on the pit complex's pad)
      flags: { stand: [{ id: 0.8, rb: 0.2 }, { id: 0.7, tm: 0.15, rb: 0.15 }], ga: { id: 0.8, tm: 0.2 }, camp: { id: 0.85, tm: 0.15 }, pole: 'id', podium: 'id' },
      vid: [], poles: [-240, 130, 1], runoff: ['LOMBOK', 'KUTA', 'INDONESIA'], straight: [-300, 140, 1],
      farm: { wall: [0.94, 0.92, 0.86], roof: [0.6, 0.3, 0.2], end: [0.9, 0.88, 0.82], barn: [0.55, 0.45, 0.35], barnRoof: [0.6, 0.3, 0.2], barnEnd: [0.52, 0.42, 0.32] },
      tvSkip: [3, 5, 8, 11, 13], recov: [0, 9, 15], photo: [0, 2, 9, 15, 16], jets: [ID[0], [0.97, 0.97, 0.97], ID[0]],   // (TV towers at the big corners, not at the kinks and the second parts of the double corners)
      colMod: (P) => {   // the south coast of Lombok at the end of the dry season: the plain's grass straw-green, paler and browner in patches, the red earth bare in places; the circuit's watered lawns green by the track; the scrub's ground dark olive; the car parks dusty grey; the beaches' pale sand
        const SY = ((API.T.def.sk || {}).sea || {}).y; lbStrPrep();
        return (x, z, c, dd) => {
          const n = P.n5(x * 0.55 + 700, z * 0.55), m = P.n3(x * 1.6 + 300, z * 1.6), k = 0.95 + (n - 0.5) * 0.16 + (m - 0.5) * 0.1;
          const fm = nrLCf(x, z, 0), sc = nrLCf(x, z, 2), se = nrLCf(x, z, 3), far = sstep(3, 15, dd == null ? 99 : dd), v = 0.92 + 0.12 * m;   // (the lawns by the track watered: green, to a few metres beyond the barriers)
          c[0] *= k; c[1] *= k; c[2] *= k * 0.96;
          const dry = (0.7 + 0.3 * sstep(0.35, 0.7, P.n3(x * 0.7 + 90, z * 0.7 - 40))) * (fm + sc) * far;
          if (dry > 0) { const q = sstep(0.3, 0.75, P.n1(x * 0.9 - 210, z * 0.9 + 75));   // (straw-green, paler and browner in patches)
            c[0] = lerp(c[0], lerp(1.45, 1.8, q) * v, dry); c[1] = lerp(c[1], lerp(1.18, 1.3, q) * v, dry); c[2] = lerp(c[2], lerp(1.05, 1.45, q) * v, dry); }
          const red = sstep(0.64, 0.82, P.n1(x * 1.3 + 40, z * 1.3 - 510)) * fm * far * 0.75;   // (the red earth bare in patches)
          if (red > 0) { c[0] = lerp(c[0], 1.95 * v, red); c[1] = lerp(c[1], 1.02 * v, red); c[2] = lerp(c[2], 0.95 * v, red); }
          if (sc > 0) { const t = sc * 0.5; c[0] = lerp(c[0], 1.2 * v, t); c[1] = lerp(c[1], 1.0 * v, t); c[2] = lerp(c[2], 0.9 * v, t); }
          if (se > 0) { const t = se * 0.85 * far; c[0] = lerp(c[0], 1.8 * v, t); c[1] = lerp(c[1], 1.24 * v, t); c[2] = lerp(c[2], 2.4 * v, t); }
          if (SY != null) { const sand = sstep(1.8, 0.6, nrDem(x, z) - SY) * far;   // (the beaches: pale sand down to the water)
            if (sand > 0) { c[0] = lerp(c[0], 2.3 * v, sand); c[1] = lerp(c[1], 1.75 * v, sand); c[2] = lerp(c[2], 2.3 * v, sand); } }
          if (LBS) { const w = lbCarve(x, z, 4) * far;   // (the streams' swales: damp ground, greener along the banks)
            if (w > 0) { const C = LB_STR === 'c', t = Math.min(1, w * 1.4) * (C ? 0.8 : 0.6), g = C ? [0.85, 1.05, 0.72] : [1.0, 1.05, 0.82];
              c[0] = lerp(c[0], g[0] * v, t); c[1] = lerp(c[1], g[1] * v, t); c[2] = lerp(c[2], g[2] * v, t); } }
        };
      } },
  });
  World.keep('NR', 'lombok');   // (its grids kept between its builds; World.build frees the others')
  World.ext.lombok = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
