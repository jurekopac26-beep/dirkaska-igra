// WORLD — Koror, Palau: the side streets and driveways that join the road (docs/proge/koror.md, »Ob cesti«)
// What OpenStreetMap maps joining the road between the start line and the finish that the world does not draw yet: 11 ways, each from the
// game's asphalt edge outwards, 70 m from the road at most (120 m along the way). Hooked by wrapping PL_LOOK.koror.pre (their room: no
// palm, tree, rock or crowd on them) and .extra (the slopes at their edges and ends, the posts), and as its .gravel (js/world-prelaz.js asks it
// before it finishes each 120 m chunk of the road's gravel shoulder: their surfaces) and .railGap (asked in railNeed: the rail round a bend's
// outside opens across a mouth); loaded after js/world-prelaz.js. Graphics only: the terrain, the road, its invisible barriers
// (js/core.js, bl and br) and the driving are untouched (not def.sideRoads, which would make them drivable).
// A way ends where the sea, OpenStreetMap's water or a house the world draws begins; a white post standing in a mouth is taken away.
// Drawn (OSM; the way, its class, where it joins: metres after the start line): 181309695 (105) and 23035104 (1985), residential; 376149091
//   (60), 655297251 (780: it ends 15 m short of its end in OSM, where the game's ground beside the causeway's western end falls into the
//   lagoon), 181309698 (795), 376149491 (2260), 376149492 (2525), 376149493 (2715), 376149495 (2940) and 655300152 (2995: its far end 2.5 m
//   short of 376149495, which it meets 31 m from the road), service; the driveway 1564824059 (3150).
// Not drawn, said in the pull request: the service road 15 m behind the start line (181309703, out of the chase camera's sight), the service
//   road beside the causeway's western end that does not reach the road (181309697), the service road at 1055 m (655299344: the game's
//   lagoon begins 8 m past the asphalt there, a stub of it would be all), the ways past the finish; every name.
// Assumed and said so in the pull request (OSM maps no width and no surface on any of the 11): the width by the class (residential 4.5 m,
//   service 3.5 m, driveway 3 m) and 2.5 m more at the mouth, narrowing over its first 6 m beyond the asphalt; drawn as gravel, edge to edge
//   in the picture and colour of the road's own gravel shoulder (L.shoulder on tex.makadam, as the user asked for every side road on
//   2. 11. 2026: docs/igra.md, »Makadam«), the wheel tracks a little lighter (the only side roads OSM tags with a surface round the road, 6
//   service ways, are all unpaved); over the road's ditch the way runs on a fill (its pipe under it not drawn).
// The game's road is wider than the real one: a way begins at the game's asphalt edge (its first metres lie under the road).
// Drawn into the road's own shoulder chunks (the surfaces) and the scenery chunks (scen.get: the slopes): no new draw calls, only vertices.
// Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK || !World.api.PL_LOOK.koror) return;
  const API = World.api, L = API.PL_LOOK.koror;
  const { caGround, caH, clamp, lerp, rpHash, sstep, vrNear, vrWater } = API;
  let T; API.sync.push(() => { ({ T } = API); });

  // the ways: [the OSM way, its class (0 tertiary, 1 unclassified, 2 residential, 3 service, 4 driveway), surface=unpaved tagged (1) or no surface
  // tag (0), the metres skipped at its road end, its points from the road outwards (x, z in the game's metres: the start line at 0, 0; x east, z south)]
  const WAYS = [
    [376149091, 3, 0, 0, [-56.7, 22.3, -66.3, -1.6, -71.7, -18.5, -81.9, -30.7, -96.6, -35.8]],
    [181309695, 2, 0, 0, [-97.3, 41.8, -145.2, 41.8, -210.6, 61.1]],
    [655297251, 3, 0, 0, [-714.6, 316.3, -709.1, 319.8, -702.7, 321.4, -696.5, 321.6, -653.8, 310.3, -620.3, 301.8, -601.4, 293.8, -600.2, 293]],
    [181309698, 3, 0, 0, [-729.3, 322.6, -732.5, 313.3, -732, 310.2, -730.4, 307.4, -683.3, 276.3, -648.8, 248.6]],
    [23035104, 2, 0, 0, [-1023, 1269.1, -1011.2, 1266.2, -990.4, 1265.3, -975.2, 1267.2, -951.5, 1284.1, -942.1, 1291.7, -938.8, 1293.6]],
    [376149491, 3, 0, 0, [-1046.3, 1519.6, -994.2, 1557.6]],
    [376149492, 3, 0, 0, [-1103.5, 1709.3, -1064.1, 1667.3, -1042.7, 1656.4]],
    [376149493, 3, 0, 0, [-1111.7, 1843.3, -1171, 1818.8]],
    [376149495, 3, 0, 0, [-1140.3, 2044.2, -1134.7, 2074.7, -1070.2, 2083.9, -1068.6, 2085.4]],
    [655300152, 3, 0, 0, [-1196.4, 2050.4, -1192.5, 2056.5, -1137.1, 2074]],   // (its far end 2.5 m short of 376149495, which it meets)
    [1564824059, 4, 0, 0, [-1345, 2084.2, -1347.4, 2059.7, -1350.8, 2020.6, -1350.8, 2014.9]],
  ];
  const HW = [2.75, 2.5, 2.25, 1.75, 1.5];   // (half the width by the class)
  const FL = 1.25, LF = 6, STEP = 1.25, F = [-1, -0.5, 0, 0.5, 1];   // (the mouth: this much wider each side, narrowing over LF m; a section every STEP m, five points across)
  const DY = 0.035, LIFT = 0.03, OVER = 0.07, APRON = 0.45;   // (above the asphalt at its edge, above the verge, above the ground; the edges sink this far outwards into the ground)
  const sw = 0.45;   // (the road's gravel shoulder, as js/world-prelaz.js draws it)
  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)], sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  // the gravel's colour on its picture (the shoulder's), the wheel tracks a little lighter; TM the picture's mean (tex.js, makadam), for the
  // slopes drawn without it to meet the gravel in the colour it shows; SKIRT their foot, half into the grass
  const GC = L.shoulder, RUT = sh(GC, 1.06), TM = [0.597, 0.496, 0.388], SKIRT = sh(mix([GC[0] * TM[0], GC[1] * TM[1], GC[2] * TM[2]], L.grass, 0.5), 0.9);
  // the ground dry: no river or lake within r m, and above the sea at the point and a cell of the terrain's mesh (5 m) beyond its edges (beside
  // the causeway the game's ground falls straight to the sea floor, caH in js/world-caracoles.js, and the mesh would pull it down under the way);
  // before the terrain: on caH, as js/world-prelaz.js asks
  const dry = (x, z, P, r) => {
    if (vrWater(x, z).e > -r) return false;
    for (let a = -1; P.sea !== null && a < 8; a++) { const d = a < 0 ? 0 : r + 5; if (caH(x + d * Math.cos(a * Math.PI / 4), z + d * Math.sin(a * Math.PI / 4)) < P.sea + 0.4) return false; }
    return true;
  };

  // a way's line: a sample every STEP m from a0 on, the corners rounded (a mean over ±2 samples), s its metres along the way
  function line(p, a0) {
    const seg = [];
    for (let k = 0; k + 3 < p.length; k += 2) { const l = Math.hypot(p[k + 2] - p[k], p[k + 3] - p[k + 1]); if (l > 0.05) seg.push([p[k], p[k + 1], p[k + 2], p[k + 3], l]); }
    const tot = seg.reduce((a, q) => a + q[4], 0), raw = [];
    for (let s = a0, j = 0, s0 = 0; s <= tot + 1e-6; s += STEP) {
      while (j < seg.length - 1 && s > s0 + seg[j][4]) { s0 += seg[j][4]; j++; }
      const q = seg[j], f = clamp((s - s0) / q[4], 0, 1); raw.push([lerp(q[0], q[2], f), lerp(q[1], q[3], f), s]);
    }
    if (tot - raw[raw.length - 1][2] > 0.3) { const q = seg[seg.length - 1]; raw.push([q[2], q[3], tot]); }
    return raw.map((q, i) => { const w = Math.min(2, i, raw.length - 1 - i); let x = 0, z = 0;
      for (let j = i - w; j <= i + w; j++) { x += raw[j][0]; z += raw[j][1]; }
      return { x: x / (2 * w + 1), z: z / (2 * w + 1), s: q[2] }; });
  }

  // before the terrain: each way's samples from where its mouth (wider where it leaves the asphalt) reaches the asphalt's edge on, as long as
  // the ground is dry and no house of the world's stands on it (OpenStreetMap's houses, where the game drew them); their room
  function place({ P, exclPush, blds }) {
    const w = T.w, out = { ways: [], own: [] };
    const house = (x, z, m) => { for (const h of blds) { const dx = x - h.x, dz = z - h.z, c = Math.cos(h.ang), s = Math.sin(h.ang);
      if (Math.abs(dx * c + dz * s) < h.L / 2 + m && Math.abs(dz * c - dx * s) < h.W / 2 + m) return true; } return false; };
    for (const [id, cls, , a0, p] of WAYS) {
      const pts = line(p, a0), n = pts.length;
      let side = 0;
      for (let k = n - 1; k >= 0 && !side; k--) { const v = vrNear(pts[k].x, pts[k].z); if (v.i >= 0 && Math.abs(v.lat) > w) side = v.lat > 0 ? 1 : -1; }
      if (!side) continue;
      const v0 = vrNear(pts[0].x, pts[0].z), fl = v0.i >= 0 && v0.lat * side < w ? FL : 0;   // (no wider mouth for a way leaving another way, not the road)
      const S = []; let sEdge = null;
      for (let k = 0; k < n; k++) {
        const q = pts[k], v = vrNear(q.x, q.z), o = v.i >= 0 ? v.lat * side : 99;
        if (sEdge === null && o >= w) sEdge = q.s;
        const hw = HW[cls] + (sEdge === null ? fl : fl * (1 - sstep(0, LF, q.s - sEdge)));
        if (o < w - hw - 1.5) continue;   // (under the asphalt: one section kept before the first that reaches its edge)
        if (!dry(q.x, q.z, P, hw) || (o > w + 1 && house(q.x, q.z, hw * 0.8))) break;
        S.push({ x: q.x, z: q.z, s: q.s, hw });
      }
      if (S.length < 3) continue;
      for (let k = 0; k < S.length; k += 2) out.own.push(exclPush(S[k].x, S[k].z, S[k].hw + 1.0));
      out.own.push(exclPush(S[S.length - 1].x, S[S.length - 1].z, S[S.length - 1].hw + 1.0));
      out.ways.push({ id, cls, side, S, dy: a0 > 0 ? -0.06 : 0 });   // (dy: a way leaving another way a little lower, under its edge)
    }
    return out;
  }

  // the verge's profile at sample i on a side, as js/world-prelaz.js draws it (vProf: Koror's verge has no hills or banks, and no way joins on the causeway), with the
  // asphalt and the shoulder before it: [offset from the centre line, height above the road's centre]
  const VP = [new Map(), new Map()];
  function prof(i, side) {
    const m = VP[side > 0 ? 1 : 0]; let a = m.get(i); if (a) return a;
    const w = T.w, bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i];
    const gAt = (o) => { const q = side * o; return caGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
    const wall = gAt(bar + 0.45) < -2.6;
    const v = wall ? [[w + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, gAt(bar + 0.42) - 0.08], [bar + 1.15, gAt(bar + 1.15) + 0.03], [bar + 1.9, gAt(bar + 1.9) + 0.03]]
      : [[w + sw, -0.02], lift(Math.max(w + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]];
    a = { y, bar, wall, end: bar + 1.9, p: [[0, 0.02], [w, 0.02], [w + 0.001, 0.012]].concat(v) }; m.set(i, a); return a;
  }
  const at = (p, o) => { if (o <= p[0][0]) return p[0][1]; for (let k = 1; k < p.length; k++) if (o <= p[k][0]) { const [o0, y0] = p[k - 1], [o1, y1] = p[k]; return o1 > o0 ? y0 + (y1 - y0) * (o - o0) / (o1 - o0) : y1; } return p[p.length - 1][1]; };
  const top = (p, a, b) => { let y = Math.max(at(p, a), at(p, b)); for (const [o, h] of p) if (o > a && o < b) y = Math.max(y, h); return y; };   // (the profile's highest point over [a, b])

  // what the world draws at (x, z) on the way's side: y the verge's highest point within 0.6 m across (or the ground beyond the verge), o the
  // offset from the centre line, ob where the verge ends, yb the verge's height there, hn the road's height across from the point
  const SU = { y: 0, o: 0, ob: 0, yb: 0, hn: 0 };
  function surf(x, z, side, ex) {
    const v = vrNear(x, z), i = v.i;
    if (i < 0) { SU.y = caGround(x, z); SU.o = 99; SU.ob = 0; return SU; }
    const hn = v.hn, N = T.N, al = (x - T.px[i]) * T.tx[i] + (z - T.pz[i]) * T.tz[i], f = clamp(i + al / T.ds, 0, N - 1), i0 = Math.min(N - 2, Math.floor(f)), u = f - i0;
    let y = 0, o = 0, ob = 0, yb = 0, g = null;
    for (let k = 0; k < 2; k++) {
      const j = i0 + k, wt = k ? u : 1 - u, pr = prof(j, side), oj = ((x - T.px[j]) * T.nx[j] + (z - T.pz[j]) * T.nz[j]) * side;
      y += wt * (oj >= pr.end ? (g === null ? (g = caGround(x, z)) : g) : pr.y + (ex ? at(pr.p, oj) : top(pr.p, oj - 0.6, oj + 0.6)));
      o += wt * oj; ob += wt * pr.end; yb += wt * (pr.y + pr.p[pr.p.length - 1][1] - 0.03);
    }
    SU.y = y; SU.o = o; SU.ob = ob; SU.yb = yb; SU.hn = hn; return SU;
  }
  function height(x, z, side, c, edge) {   // a point of the way: c its crown's share (0 at the edges, 1 in the middle); edge: on the asphalt's edge
    const s = surf(x, z, side);
    if (edge) return s.hn + DY;
    if (s.o >= s.ob) return s.y + OVER + 0.03 * c;
    const t = clamp((s.o - T.w) / (s.ob - T.w), 0, 1), lin = s.hn + DY + (s.yb + OVER - s.hn - DY) * t;
    return Math.max(lin, s.y + LIFT) + 0.03 * c * clamp((s.o - T.w) / 2, 0, 1);
  }
  const ground = (x, z, side) => { const s = surf(x, z, side, true); return s.o < T.w ? s.hn + 0.02 : s.y; };   // (where the edges sink to: the asphalt, the verge or the ground)

  // a way's sections: five points across every STEP m, draped over the shoulder, the ditch (on its fill) and the ground, the points that fall
  // on the road moved out onto the asphalt's edge; each point's colour on the gravel's picture (C) and as the gravel shows (CV: C times TM),
  // its place on the picture (U: 4 m across and 6 m along it, as the road's shoulder has it)
  function sections(W, b) {
    const { S, side, dy } = W, n = S.length, w = T.w, sec = [];
    for (let k = 0; k < n; k++) {
      const q = S[k], a = S[Math.max(0, k - 1)], c = S[Math.min(n - 1, k + 1)], l = Math.hypot(c.x - a.x, c.z - a.z) || 1, tx = (c.x - a.x) / l, tz = (c.z - a.z) / l;
      const qv = 0.96 + 0.06 * rpHash(k + 7919 * b, 61), P = [], C = [], CV = [], U = [], E = [];
      for (let j = 0; j < 5; j++) {
        let x = q.x - tz * F[j] * q.hw, z = q.z + tx * F[j] * q.hw, e = false;
        const v = vrNear(x, z);
        if (v.i >= 0 && v.lat * side < w) { const d = w - v.lat * side, i = v.i; x += T.nx[i] * side * d; z += T.nz[i] * side * d; e = true; }
        P.push([x, height(x, z, side, 1 - F[j] * F[j], e) + dy, z]); E.push(e); U.push([F[j] * q.hw / 4, q.s / 6]);
        const cc = sh(j === 1 || j === 3 ? RUT : GC, qv * (0.98 + 0.04 * rpHash(k * 5 + j + 7919 * b, 62)));
        C.push(cc); CV.push([cc[0] * TM[0], cc[1] * TM[1], cc[2] * TM[2]]);
      }
      sec.push({ q, tx, tz, P, C, CV, U, E });
    }
    // the creases of the ground the world draws (the terrain's mesh, a 5 m grid; the verge) kept under the gravel: where one rises above a quad's
    // triangles (as gravel() draws them, the diagonal from A[j] to B[j + 1]), the quad's corners off the asphalt lifted by as much (a lift only
    // raises the quads already checked)
    for (let k = 0; k < n - 1; k++) for (let j = 0; j < 4; j++) {
      const A = sec[k], B = sec[k + 1], Q = [A.P[j], A.P[j + 1], B.P[j + 1], B.P[j]], QE = [A.E[j], A.E[j + 1], B.E[j + 1], B.E[j]];
      if (QE[0] && QE[1] && QE[2] && QE[3]) continue;
      let ex = 0;
      for (const [a, b, c] of [[0, 1, 2], [0, 2, 3]]) for (let u = 0; u <= 4; u++) for (let v = 0; u + v <= 4; v++) {
        const w1 = u / 4, w2 = v / 4, w0 = 1 - w1 - w2; if (w0 === 1 || w1 === 1 || w2 === 1) continue;
        const x = Q[a][0] * w0 + Q[b][0] * w1 + Q[c][0] * w2, z = Q[a][2] * w0 + Q[b][2] * w1 + Q[c][2] * w2, s = surf(x, z, side, true);
        if (s.o >= T.w + 0.3) ex = Math.max(ex, s.y + 0.03 - (Q[a][1] * w0 + Q[b][1] * w1 + Q[c][1] * w2));
      }
      if (ex > 0) for (let m = 0; m < 4; m++) if (!QE[m]) Q[m][1] += ex;
    }
    return sec;
  }
  // its gravel, into a chunk of the road's shoulder mesh (its material: the gravel's picture, as on the shoulder)
  function gravel(gs, sec) {
    for (let k = 0; k < sec.length - 1; k++) {
      const A = sec[k], B = sec[k + 1];
      for (let j = 0; j < 4; j++) {
        if (A.E[j] && A.E[j + 1] && B.E[j] && B.E[j + 1]) continue;   // (all on the asphalt's edge: nothing to draw)
        gs.quadUp(A.P[j], A.P[j + 1], B.P[j + 1], B.P[j], [A.C[j], A.C[j + 1], B.C[j + 1], B.C[j]], [A.U[j], A.U[j + 1], B.U[j + 1], B.U[j]]);
      }
    }
  }
  // the slopes at its two edges and its outer end, sinking into the ground: into the scenery chunks
  function skirts(scen, W, sec) {
    const side = W.side, n = sec.length;
    const apron = (p, ox, oz) => { const x = p[0] + ox * APRON, z = p[2] + oz * APRON; return [x, ground(x, z, side) - 0.06, z]; };
    for (let k = 0; k < n - 1; k++) {
      const A = sec[k], B = sec[k + 1], g = scen.get((A.q.x + B.q.x) / 2, (A.q.z + B.q.z) / 2);
      for (const [j, sg] of [[0, -1], [4, 1]]) {
        if (A.E[j] && B.E[j]) continue;
        const ao = apron(A.P[j], -A.tz * sg, A.tx * sg), bo = apron(B.P[j], -B.tz * sg, B.tx * sg);
        g.quadUp(ao, A.P[j], B.P[j], bo, [SKIRT, A.CV[j], B.CV[j], SKIRT]);
      }
    }
    { const Z = sec[n - 1], g = scen.get(Z.q.x, Z.q.z);   // (the outer end)
      for (let j = 0; j < 4; j++) g.quadUp(Z.P[j], Z.P[j + 1], apron(Z.P[j + 1], Z.tx, Z.tz), apron(Z.P[j], Z.tx, Z.tz), [Z.CV[j], Z.CV[j + 1], SKIRT, SKIRT]); }
  }

  // how far (x, z) lies from a way's edge (below 0: on the way)
  function clear(S, x, z) {
    let best = 1e9;
    for (let k = 0; k < S.length - 1; k++) {
      const a = S[k], b = S[k + 1], dx = b.x - a.x, dz = b.z - a.z, t = clamp(((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1), 0, 1);
      best = Math.min(best, Math.hypot(x - a.x - dx * t, z - a.z - dz * t) - lerp(a.hw, b.hw, t));
    }
    return best;
  }

  const pre0 = L.pre, extra0 = L.extra; let cur = null;
  // a way whose mouth meets the road where the ground drops away under the barrier (the road's retaining wall there) is left out
  const ok = (W) => { const q = W.S.find(p => { const v = vrNear(p.x, p.z); return v.i < 0 || v.lat * W.side >= T.w; }) || W.S[0], i = vrNear(q.x, q.z).i;
    return !(i >= 0 && prof(i, W.side).wall); };
  L.pre = function (k) { if (pre0) pre0.call(this, k); VP[0].clear(); VP[1].clear(); cur = place(k); };
  // a chunk of the road's gravel shoulder (samples c0 to c1, before js/world-prelaz.js finishes it): the gravel of the ways whose mouth is in it
  L.gravel = function (gs, c0, c1) {
    if (!cur) return;
    if (!cur.sec) { cur.ways = cur.ways.filter(ok); cur.sec = true;
      cur.ways.forEach((W, b) => { W.sec = sections(W, b); W.i0 = clamp(vrNear(W.S[0].x, W.S[0].z).i, 0, T.N - 2); }); }
    for (const W of cur.ways) if (W.i0 >= c0 && W.i0 < c1) gravel(gs, W.sec);
  };
  // the game's rails (world-prelaz.js, railNeed: round the bends' outsides, where the ground drops away) open where a way joins the road: none
  // across its mouth (1.5 m clear of its edges), and no stub under 12 m left beside it
  L.railGap = function (need) {
    if (!cur) return;
    const N = T.N; cur.ways = cur.ways.filter(ok);
    for (const W of cur.ways) {
      const nd = need[W.side > 0 ? 1 : 0], bar = W.side > 0 ? T.br : T.bl, cut = [];
      let lo = N, hi = -1;
      for (const p of W.S) { const v = vrNear(p.x, p.z); if (v.i >= 0) { lo = Math.min(lo, v.i); hi = Math.max(hi, v.i); } }
      for (let i = Math.max(0, lo - 8); i <= Math.min(N - 1, hi + 8); i++) {
        if (!nd[i]) continue;
        const o = W.side * (bar[i] + 0.12);
        if (clear(W.S, T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < 1.5) { nd[i] = 0; cut.push(i); }
      }
      for (const i of cut) for (const d of [-1, 1]) { let j = i + d, n = 0; while (j >= 0 && j < N && nd[j]) { j += d; n++; } if (n && n < 6) for (let m = 1; m <= n; m++) nd[i + d * m] = 0; }
    }
  };
  L.extra = function (k) {
    if (extra0) extra0.call(this, k);
    if (!cur) return;
    const ways = cur.ways.filter(ok); cur = null;
    for (const W of ways) if (W.sec) skirts(k.scen, W, W.sec);
    // the white posts (world.js, roadsideProps: every 50 m where no rail stands) not in a mouth
    const props = k.out.props; let gone = 0;
    if (props) for (let n = props.length - 1; n >= 0; n--) { const p = props[n]; if (p.kind === 'post' && ways.some(W => clear(W.S, p.x, p.z) < 0.8)) { props.splice(n, 1); gone++; } }
    if (gone && k.out.propStats) k.out.propStats.posts -= gone;
  };
})();
