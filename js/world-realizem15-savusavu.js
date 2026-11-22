// WORLD — realizem 15: Savusavu, Fiji (docs/realizem.md, »Postopek za vse proge«)
// What OpenStreetMap maps within 60 m of the road that the world does not draw yet: the bus stop's shelter 0.74 km after the start line, the
// football pitch at 1.39 km and two footpaths (at 0.39 and 2.62 km). Hooked by wrapping PL_LOOK.savusavu.pre (their room: no palm, tree or rock on them)
// and .extra (the drawing), loaded after js/world-prelaz.js.
// Drawn (OSM):
//   the bus stop 13908734237 (highway=bus_stop, shelter=yes; left, 9.5 m from the centre line): its shelter, 0.4 m further back (the game's
//   road is wider than the real one);
//   the pitch 1232624466 (leisure=pitch, sport=soccer; left, 9–40 m): its ground from 2 m beyond the road's barrier line on (the game's road
//   and its verge cover the near third: the barrier line is 15.7 m out there) and the goal on its far short side (the near one is in the verge);
//   the path 401660090 (highway=path; left, from the road back along it) and the footway 1434987933 (highway=footway; left: its dead end at 44 m, then
//   away from the road), each as far as the band reaches.
// Not drawn again (the game has them): the pond 401702121 (def.lakes), the place of worship 9521194202 and the airport's terminal (houses of def.bld).
// Not drawn at all, said in the pull request: the fuel station 13916593878 (a business; the game has its house); the aprons 239496775 and
//   239496776 (slivers at 47–60 m); the aerodrome's area 223937115 and its names; a bench at the stop (not mapped); the names.
// Assumed and said so in the pull request (OSM maps no form, size, surface or material): the shelter a slab with a back wall away from the
//   road, two posts in front and a flat roof of corrugated iron (L.roofs), 3.6 × 1.8 m; the pitch mown grass (no lines: none mapped) and its
//   goal 5 × 2 m white tubes without a net; the paths trodden red-brown earth 1 m wide (no width, no surface mapped).
// Room (exclPush): the shelter's footprint and the pitch with 1.5 m round them, every path's line and 1.4 m beside it; the shelter's front
//   0.5 m beyond the road's barrier line, nothing else within 2 m of it.
// Drawn into the scenery chunks (scen.get): no new draw calls, only vertices. The terrain, the road and the driving are untouched.
// Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK || !World.api.PL_LOOK.savusavu) return;
  const API = World.api, L = API.PL_LOOK.savusavu;
  const { box, caGround, caH, cyl, lerp, rng, vrNear, vrWater } = API;
  let T; API.sync.push(() => { ({ T } = API); });

  const STOP = [-88.4, -712.2];   // the bus stop (node 13908734237): x, z in the game's metres (the start line at 0, 0; x east, z south)
  const PITCH = [[-256.9, -1231.1], [-278.1, -1229.9], [-280.0, -1261.0], [-258.8, -1262.2]];   // the pitch (way 1232624466): its corners, the far short side first
  // the footpaths: [the OSM way, the way's points from the road outwards (x, z), free: the first point the way's dead end, not the road]
  const PATHS = [
    [401660090, [-79.6, -363.2, -102.4, -356.3, -122.4, -345.5, -149.0, -330.4], false],
    [1434987933, [-138.4, -2163.8, -143.6, -2194.2, -145.6, -2228.6], true],
  ];
  const BAND = 60, STEP = 0.5, CLEAR = 2.0, MIN = 6, WIDTH = 1.0;   // (the band by the road; a path sample every half metre; this far beyond the barrier line: the road's own verge and ditch end there; no run under 6 m; the width where OSM gives none)
  const EARTH = [0.45, 0.35, 0.27], CONC = [0.66, 0.64, 0.6], CONC_TOP = [0.74, 0.72, 0.68], WALL = [0.84, 0.82, 0.76], POST = [0.6, 0.62, 0.64],
    WHITE = [0.94, 0.94, 0.92], TURF = [0.31, 0.43, 0.24];   // (TURF the pitch's mown grass: the island's grass greyed, as a mesh without the ground's texture shows it
  // brighter and greener than the grass beside it)
  const sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k], mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const near = (x, z) => { const v = vrNear(x, z); return v.i >= 0 ? v.dd : 99; };   // (metres beyond the road's barrier line)
  const dry = (x, z, P, r) => !(P.sea !== null && caH(x, z) < P.sea + 0.4) && vrWater(x, z).e <= -r;   // (not in the sea, a pond or a stream; before the
  // terrain, so on caH, which keeps nothing: caGround would fill the terrain's grid before the walls' banks are known)
  const pq = (a, b) => { const [c0, c1, c2, c3] = PITCH, u = [lerp(c0[0], c1[0], a), lerp(c0[1], c1[1], a)], w = [lerp(c3[0], c2[0], a), lerp(c3[1], c2[1], a)];
    return [lerp(u[0], w[0], b), lerp(u[1], w[1], b)]; };   // (a point of the pitch: a across its short sides, b along its long sides, both 0–1)

  // a way's line: a sample every half metre, the corners at the way's points rounded (a mean over ±2 m)
  function line(p) {
    const raw = [];
    for (let k = 0; k + 3 < p.length; k += 2) {
      const n = Math.max(1, Math.round(Math.hypot(p[k + 2] - p[k], p[k + 3] - p[k + 1]) / STEP));
      for (let j = 0; j < n; j++) raw.push([lerp(p[k], p[k + 2], j / n), lerp(p[k + 1], p[k + 3], j / n)]);
    }
    raw.push([p[p.length - 2], p[p.length - 1]]);
    return raw.map((q, i) => { const w = Math.min(4, i, raw.length - 1 - i); let x = 0, z = 0;
      for (let j = i - w; j <= i + w; j++) { x += raw[j][0]; z += raw[j][1]; }
      return { x: x / (2 * w + 1), z: z / (2 * w + 1) }; });
  }

  // before the terrain: what can stand where OSM puts it (beyond the road's verge, on dry ground) and its room
  function place({ P, exclPush }) {
    const own = [], N = T.N, out = { stop: null, pitch: false, paths: [], own };
    const v = vrNear(STOP[0], STOP[1]);
    if (v.i >= 0 && v.dd > 0 && v.dd < 4) {   // (the shelter stands by the road: its front 0.5 m beyond the barrier line; where the game's road,
      // wider than the real one, comes nearer, the shelter steps back that much across the road, 0.4 m here)
      const side = v.lat > 0 ? 1 : -1, sh = Math.max(0, 1.4 - v.dd), x = STOP[0] + T.nx[v.i] * side * sh, z = STOP[1] + T.nz[v.i] * side * sh;
      if (dry(x, z, P, 2)) { out.stop = { x, z, side, rot: Math.atan2(T.tz[v.i], T.tx[v.i]) }; own.push(exclPush(x, z, 2.0 + 1.5)); }
    }
    const [cx, cz] = pq(0.5, 0.5);
    if (dry(cx, cz, P, 11)) {
      out.pitch = true;
      for (let a = 0.1; a < 1; a += 0.2) for (let b = 1 / 12; b < 1; b += 1 / 6) { const [x, z] = pq(a, b); own.push(exclPush(x, z, 3.6)); }   // (circles 4.2 × 5.2 m apart: the pitch and 1.5 m round it)
    }
    const inBand = (x, z) => { for (let i = 0; i < N; i++) { const dx = T.px[i] - x, dz = T.pz[i] - z; if (dx * dx + dz * dz <= BAND * BAND) return true; } return false; };
    for (const [, p, free] of PATHS) {
      const hw = WIDTH / 2, all = line(p), pts = [];
      for (const q of all) { if (near(q.x, q.z) < CLEAR) { if (pts.length) break; continue; } if (!inBand(q.x, q.z)) break; pts.push(q); }
      for (let k = 0; k < pts.length; k += 3) own.push(exclPush(pts[k].x, pts[k].z, hw + 1.4));
      if (pts.length) out.paths.push({ pts, hw, free: free && pts[0] === all[0], whole: pts[pts.length - 1] === all[all.length - 1] });
    }
    return out;
  }

  // the shelter: a concrete slab, a block wall at its back (away from the road), two steel posts in front, a flat roof of corrugated iron
  function shelter(g, o, R) {
    const c = Math.cos(o.rot), s = Math.sin(o.rot), at = (u, v) => [o.x + u * c - v * s, o.z + u * s + v * c], r = o.rot, sd = o.side;
    let lo = 1e9, hi = -1e9;
    for (const [u, v] of [[-1.8, -0.9], [1.8, -0.9], [1.8, 0.9], [-1.8, 0.9], [0, 0]]) { const [x, z] = at(u, v), y = caGround(x, z); lo = Math.min(lo, y); hi = Math.max(hi, y); }
    const top = hi + 0.1, [x, z] = at(0, 0);
    box(g, x, lo - 0.25, z, 3.6, top - lo + 0.25, 1.8, r, CONC, CONC_TOP, true);   // (the slab)
    { const [wx, wz] = at(0, sd * 0.8); box(g, wx, top, wz, 3.6, 2.3, 0.14, r, WALL, WALL, true); }   // (the back wall)
    for (const u of [-1.7, 1.7]) { const [px, pz] = at(u, -sd * 0.78); cyl(g, px, top, pz, 0.045, 2.24, 6, POST, POST); }   // (the posts)
    { const [rx, rz] = at(0, 0); box(g, rx, top + 2.24, rz, 3.9, 0.07, 2.1, r, POST, L.roofs[Math.floor(R() * L.roofs.length)]); }   // (the roof)
  }

  // the pitch: mown grass draped on the ground (a grid of cells of about 1 m), its edges sinking into the ground; a goal on each short side. The
  // road's band reaches into its near end (OSM has the pitch from 9 m from the road's centre line, the game's barrier line is 15.7 m out there):
  // the grass ends 2 m beyond the barrier line, along it, and that end's goal is not drawn
  function pitch(scen, R, excluded) {
    const NA = 21, NB = 31, V = [], cut = [];
    const at = (a, b, dy) => { const [x, z] = pq(a, b); return [x, caGround(x, z) + dy, z]; };
    const room = (a, b) => { const [x, z] = pq(a, b); return near(x, z) >= CLEAR; };
    for (let i = 0; i <= NA; i++) {   // (each column's end along b, from the far side: the pitch's end, or where the road's band begins)
      const a = i / NA; let lo = 0, hi = 1;
      if (room(a, 1)) { cut.push(1); continue; }
      if (!room(a, 0)) { cut.push(0); continue; }
      for (let k = 0; k < 16; k++) { const m = (lo + hi) / 2; if (room(a, m)) lo = m; else hi = m; }
      cut.push(lo);
    }
    for (let j = 0; j <= NB; j++) { const row = []; for (let i = 0; i <= NA; i++) { const a = i / NA, b = cut[i] * j / NB; row.push({ a, b, p: at(a, b, 0.08), c: sh(TURF, 0.95 + R() * 0.1) }); } V.push(row); }
    const cell = (i, j) => { if (Math.min(cut[i], cut[i + 1]) < 0.02) return false; const [x, z] = pq((i + 0.5) / NA, (cut[i] + cut[i + 1]) / 2 * (j + 0.5) / NB); return !excluded(x, z); };
    for (let j = 0; j < NB; j++) for (let i = 0; i < NA; i++) {
      if (!cell(i, j)) continue;
      const a = V[j][i], b = V[j][i + 1], c = V[j + 1][i + 1], d = V[j + 1][i], [mx, mz] = pq((i + 0.5) / NA, (a.b + c.b) / 2);
      scen.get(mx, mz).quadUp(a.p, b.p, c.p, d.p, [a.c, b.c, c.c, d.c]);
    }
    const m = sh(TURF, 0.94), oa = 0.3 / 21.2, ob = 0.3 / 31.1;
    const skirt = (A, B, ua, ub) => {   // (from the grass' edge 0.3 m outwards into the ground; straight down where the road's band cut it)
      const Ao = at(A.a + ua, A.b + ub, -0.07), Bo = at(B.a + ua, B.b + ub, -0.07);
      scen.get(A.p[0], A.p[2]).quadUp(Ao, A.p, B.p, Bo, [m, A.c, B.c, m]);
    };
    for (let i = 0; i < NA; i++) {
      if (cell(i, 0)) skirt(V[0][i], V[0][i + 1], 0, -ob);
      if (cell(i, NB - 1)) { const out = cut[i] === 1 && cut[i + 1] === 1; skirt(V[NB][i], V[NB][i + 1], 0, out ? ob : 0); }
    }
    for (let j = 0; j < NB; j++) {
      if (cell(0, j)) skirt(V[j][0], V[j + 1][0], -oa, 0);
      if (cell(NA - 1, j)) skirt(V[j][NA], V[j + 1][NA], oa, 0);
    }
    for (const b of [0, 1]) {   // (the goals: two posts and a crossbar, 5 × 2 m, on the short side's middle)
      const [p0, p1] = b ? [PITCH[3], PITCH[2]] : [PITCH[0], PITCH[1]], r = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), [x, z] = pq(0.5, b);
      if (near(x, z) < CLEAR + 1 || excluded(x, z)) continue;
      const c = Math.cos(r), s = Math.sin(r), ends = [-2.5, 2.5].map(u => [x + u * c, z + u * s]), gy = ends.map(([px, pz]) => caGround(px, pz)), top = (gy[0] + gy[1]) / 2 + 2.0;
      ends.forEach(([px, pz], k) => cyl(scen.get(px, pz), px, gy[k] - 0.1, pz, 0.06, top - gy[k] + 0.1, 8, WHITE, WHITE));
      box(scen.get(x, z), x, top - 0.12, z, 5.0, 0.12, 0.12, r, WHITE);
    }
  }

  // a path's run: a ribbon of trodden earth draped on the ground (a row of five points every half metre; the shade drifts along the path, a
  // paler point where a stone shows), its edges sinking into the ground; narrowing to nothing over its last metres and where another thing's
  // room cut it
  function paths(scen, runs, R) {
    const stone = mix(EARTH, L.scree, 0.55), side = mix(EARTH, L.grass, 0.5), F = [-1, -0.5, 0, 0.5, 1];
    for (const { pts, hw, t0, t1 } of runs) {
      const n = pts.length, S = [], W = [], D = [];
      for (let k = 0; k <= n * STEP / 3 + 1; k++) { W.push(0.88 + R() * 0.24); D.push(0.93 + R() * 0.14); }   // (the width and the shade: a new value every 3 m)
      for (let k = 0; k < n; k++) {
        const q = pts[k], a = pts[Math.max(0, k - 1)], b = pts[Math.min(n - 1, k + 1)], l = Math.hypot(b.x - a.x, b.z - a.z) || 1, nx = -(b.z - a.z) / l, nz = (b.x - a.x) / l;
        const i = Math.floor(k * STEP / 3), f = k * STEP / 3 - i, d = lerp(D[i], D[i + 1], f);
        const t = Math.min(1, t0 ? 0.15 + k * STEP / t0 : 1, t1 ? 0.15 + (n - 1 - k) * STEP / t1 : 1), w = hw * lerp(W[i], W[i + 1], f) * t, e = w + 0.45 * t;
        const at = (u, dy) => { const x = q.x + nx * u, z = q.z + nz * u; return [x, caGround(x, z) + dy, z]; };
        S.push({ x: q.x, z: q.z, p: F.map(v => at(v * w, 0.09 - 0.03 * Math.abs(v))), lo: at(-e, -0.08), ro: at(e, -0.08),
          c: F.map(v => { const c = sh(R() < 0.12 ? stone : EARTH, d * (0.97 + R() * 0.06)); return Math.abs(v) === 1 ? mix(c, side, 0.4) : c; }), cb: sh(side, d * (0.97 + R() * 0.06)) });
      }
      for (let k = 0; k < n - 1; k++) {
        const a = S[k], b = S[k + 1], g = scen.get((a.x + b.x) / 2, (a.z + b.z) / 2);
        for (let j = 0; j < 4; j++) g.quadUp(a.p[j], a.p[j + 1], b.p[j + 1], b.p[j], [a.c[j], a.c[j + 1], b.c[j + 1], b.c[j]]);
        g.quadUp(a.lo, a.p[0], b.p[0], b.lo, [a.cb, a.c[0], b.c[0], b.cb]); g.quadUp(a.p[4], a.ro, b.ro, b.p[4], [a.c[4], a.cb, b.cb, b.c[4]]);
      }
    }
  }

  const pre0 = L.pre, extra0 = L.extra; let cur = null;
  L.pre = function (k) { if (pre0) pre0.call(this, k); cur = place(k); };
  L.extra = function (k) {
    if (extra0) extra0.call(this, k);
    if (!cur) return;
    const { stop, pitch: hasPitch, paths: ways, own } = cur, runs = [], r0 = own.map(e => e.r); cur = null;
    for (const e of own) e.r = 0;   // (what else holds the ground, a house, a crowd or a plot: asked without these things' own room)
    const R = rng(L.seed + 1503);
    if (stop && !k.excluded(stop.x, stop.z)) shelter(k.scen.get(stop.x, stop.z), stop, R);
    if (hasPitch) pitch(k.scen, R, k.excluded);
    for (const { pts, hw, free, whole } of ways) {
      let run = [], cut = false;   // (cut: the run begins where another thing's room ends; free: the way's dead end, narrowing to it)
      const end = last => { if (run.length * STEP >= MIN) runs.push({ pts: run, hw, t0: cut ? 1.5 : free ? 2 : 0, t1: last ? (whole ? 2 : 5) : 1.5 }); run = []; };
      for (const q of pts) { if (k.excluded(q.x, q.z)) { if (run.length) end(false); cut = true; } else run.push(q); }
      end(true);
    }
    own.forEach((e, i) => { e.r = r0[i]; });
    paths(k.scen, runs, R);
  };
})();
