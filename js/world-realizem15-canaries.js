// WORLD — realizem 15: Canaries, Saint Lucia (docs/realizem.md, »Postopek za vse proge«)
// What OpenStreetMap maps within 60 m of the road that the world does not draw yet: the three footpaths that leave the road 1.10, 2.28 and
// 3.29 km after the start line, each as far as the band reaches. Hooked by wrapping PL_LOOK.canaries.pre (their room: no tree, palm or rock on them) and .extra
// (the drawing), loaded after js/world-prelaz.js.
// Drawn (OSM ways, highway=path, no width, no surface mapped): 674452325 (right), 676207396 (right), 676208698 (left).
// Not drawn again (the game has them): the toilets 6837308077 (a house of def.bld), the streams 676207395, 676208705, 676208708, 1162916426,
//   1162916428 and their culverts 1162916427, 1162916429 (def.streams).
// Not drawn at all, said in the pull request: the viewpoints 6167221187 and 9559231587 (bare points); the beach 671531402 (only its tip at
//   55 m); the gallery 6837300825 (a business); the grass, the grassland, the wood and the houses' land (the ground and the forest have them);
//   the names. The tracks, service roads and streets (highway=track, service, residential) are left to the side roads (package E, #779).
// Assumed and said so in the pull request: the paths trodden red-brown volcanic earth, 1 m wide.
// Room (exclPush): every path's line and 1.4 m beside it; none within 2 m of the road's barrier line.
// Drawn into the scenery chunks (scen.get): one 110 m square a path crosses held nothing before, so it has a mesh of its own now (2049 → 2050
//   meshes; the phone's measured draw calls unchanged); elsewhere only vertices. The terrain, the road and the driving are untouched.
// Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK || !World.api.PL_LOOK.canaries) return;
  const API = World.api, L = API.PL_LOOK.canaries;
  const { caGround, lerp, rng, vrNear } = API;
  let T; API.sync.push(() => { ({ T } = API); });

  // the footpaths: [the OSM way, the way's points from the road outwards: x, z in the game's metres (the start line at 0, 0; x east, z south)]
  const PATHS = [
    [674452325, [718.1, 42.0, 729.6, 75.3, 716.1, 96.2, 696.4, 111.0, 651.5, 125.9, 619.0, 125.4]],
    [676207396, [1060.2, -306.5, 1075.3, -300.9, 1093.6, -304.4, 1109.5, -286.2, 1130.2, -258.0]],
    [676208698, [858.1, -1041.6, 824.6, -1032.2, 801.1, -1041.3, 773.1, -1074.4]],
  ];
  const BAND = 60, STEP = 0.5, CLEAR = 2.0, MIN = 6, WIDTH = 1.0;   // (the band by the road; a sample every half metre; this far beyond the barrier line: the road's own verge and ditch end there; no run under 6 m; the width where OSM gives none)
  const EARTH = [0.46, 0.34, 0.25];
  const near = (x, z) => { const v = vrNear(x, z); return v.i >= 0 ? v.dd : 99; };   // (metres beyond the road's barrier line)

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

  // before the terrain: each path's samples beyond the road's verge and in the band (from the road outwards: nothing of a path beyond the band or
  // beyond another leg of the road), and their room (no trees, rocks or people on a path)
  function place({ exclPush }) {
    const paths = [], own = [], N = T.N;
    const inBand = (x, z) => { for (let i = 0; i < N; i++) { const dx = T.px[i] - x, dz = T.pz[i] - z; if (dx * dx + dz * dz <= BAND * BAND) return true; } return false; };
    for (const [, p] of PATHS) {
      const hw = WIDTH / 2, all = line(p), pts = [];
      for (const q of all) { if (near(q.x, q.z) < CLEAR) { if (pts.length) break; continue; } if (!inBand(q.x, q.z)) break; pts.push(q); }
      for (let k = 0; k < pts.length; k += 3) own.push(exclPush(pts[k].x, pts[k].z, hw + 1.4));
      if (pts.length) paths.push({ pts, hw, whole: pts[pts.length - 1] === all[all.length - 1] });
    }
    return { paths, own };
  }

  // a run: a ribbon of trodden earth draped on the ground (a row of five points every half metre; the shade drifts along the path, a paler
  // point where a stone shows), its edges sinking into the ground; narrowing to nothing over its last metres and where another thing's room
  // cut it
  function draw(scen, runs, R) {
    const sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k], mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
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
    const { paths, own } = cur, runs = [], r0 = own.map(e => e.r); cur = null;
    for (const e of own) e.r = 0;   // (what else holds the ground, a house or a plot: asked without the paths' own room)
    for (const { pts, hw, whole } of paths) {
      let run = [], cut = false;   // (cut: the run begins where another thing's room ends)
      const end = last => { if (run.length * STEP >= MIN) runs.push({ pts: run, hw, t0: cut ? 1.5 : 0, t1: last ? (whole ? 2 : 5) : 1.5 }); run = []; };
      for (const q of pts) { if (k.excluded(q.x, q.z)) { if (run.length) end(false); cut = true; } else run.push(q); }
      end(true);
    }
    own.forEach((e, i) => { e.r = r0[i]; });
    draw(k.scen, runs, rng(L.seed + 1503));
  };
})();
