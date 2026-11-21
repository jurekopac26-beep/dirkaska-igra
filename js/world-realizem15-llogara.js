// WORLD — realizem 15: Llogara, Albanija (docs/realizem.md, »Postopek za vse proge«)
// What OpenStreetMap maps within 60 m of the road and the pass's own world (js/world-llogara.js, PL_LOOK.llogara) does not draw yet.
// Hooked by wrapping the look's own hooks (PL_LOOK.llogara.pre, .extra): loaded right after the pass's own world.
//
// Drawn: the four footpaths that leave the road (highway=path): way 724489414 at the start line (left, up the slope; surface=ground,
//   width=1.5), way 1319029066 at 1.89 km (right, across the open ground of the pass), way 377745704 at 2.16 km (left, straight up the
//   slope by the guidepost; surface=dirt), way 1226871815 at 2.93 km (left, 60 m long, towards the old pillbox; surface=dirt). Each from
//   where the road's own verge ends (2 m beyond the barrier line) to 60 m from the road or to the way's end.
// Not drawn again (the game has them): the retaining wall between the legs of the triple hairpin (way 1319029074: the passes' own
//   masonry wall stands there), all the buildings (def.bld), the three car parks and the parking place of the lay-bys (ways 234933644,
//   1007784590, 1007784591, node 11333360834: def.pulls), the two springs (nodes 2430538387, 9831171017), the wayside shrine (node
//   9282711683), the monument (node 9282711684), the guidepost (node 9700645641), the four pillboxes (nodes 12207208159, 12207208160,
//   12207208161, 11377037958), the open launch meadow at the finish.
// Left to the side roads' package (Realizem E, def.stranske: no double drawing): the parking aisle (way 312064075), the gravel tracks
//   (ways 234933628, 689680782, 689635166), the driveway (way 1319029068) and the stop sign at the first track's junction (node 6470054941).
// Not drawn at all, said in the pull request: the steps between the legs of the triple hairpin (way 1189458327: the game's road is
//   wider than the real one and takes their ground, the passes' wall stands across them), the car park below the road at 0.23 km (way
//   1189458326: no surface mapped, on a slope, reached only by the side roads' package's aisle), the viewpoint's area at the finish (way
//   689635165: no surface mapped; the game keeps that ground open), the viewpoint and the information point mapped as bare points (nodes
//   4558116748, 6469673664), the summit point (node 5188597048), the grounds and points of the venues, every name.
// Assumed and said so in the pull request: the width where it is not mapped (1.0 m), trodden earth with limestone showing (also on
//   way 1319029066, whose surface is not mapped), slightly uneven edges, the ends narrowing to nothing. The path at the start line
//   begins behind the game's timing hut, which stands on its first metres.
// The paths have their room: the plants and stones the game scatters do not stand on them (so a few maquis bushes by two of the paths
//   stand elsewhere than without the paths); the rocks, the walls and everything else stand where they stood.
// Draped on the terrain into the scenery chunks (scen.get): no new draw calls, only vertices. The terrain, the road and the driving are untouched.
// Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK || !World.api.PL_LOOK.llogara) return;
  const API = World.api, L = API.PL_LOOK.llogara;
  const { caGround, lerp, rng, vrNear } = API;
  let T; API.sync.push(() => { ({ T } = API); });

  // the footpaths: [the OSM way, the mapped width in metres (0: not mapped), the way's points from the road outwards: x, z in the game's metres
  // (the start line at 0, 0; x east, z south)]
  const PATHS = [
    [724489414, 1.5, [0.4, 0.0, 0.1, -16.4, -0.4, -35.7, 7.4, -49.3, 22.5, -66.2]],
    [1319029066, 0, [765.1, 1056.2, 745.6, 1075.1, 736.7, 1086.9, 718.5, 1100.7, 709.9, 1107.6]],
    [377745704, 0, [1017.0, 1097.7, 982.4, 1034.7, 987.5, 1018.5]],
    [1226871815, 0, [1492.7, 1631.7, 1495.7, 1647.2, 1494.1, 1673.7, 1498.0, 1684.5, 1499.8, 1690.1]],
  ];
  const BAND = 60, STEP = 0.5, CLEAR = 2.0, MIN = 6, WIDTH = 1.0;   // (the band by the road; a sample every half metre; this far beyond the barrier line: the road's own verge and ditch end there; no run under 6 m; the width where OSM gives none)
  const EARTH = [0.43, 0.38, 0.3];
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
    for (const [, w, p] of PATHS) {
      const hw = (w || WIDTH) / 2, all = line(p), pts = [];
      for (const q of all) { if (near(q.x, q.z) < CLEAR) { if (pts.length) break; continue; } if (!inBand(q.x, q.z)) break; pts.push(q); }
      for (let k = 0; k < pts.length; k += 3) own.push(exclPush(pts[k].x, pts[k].z, hw + 1.4));
      if (pts.length) paths.push({ pts, hw, whole: pts[pts.length - 1] === all[all.length - 1] });
    }
    return { paths, own };
  }

  // a run: a ribbon of trodden earth draped on the ground (a row of five points every half metre; the shade drifts along the path, a paler
  // point where the limestone shows), its edges sinking into the ground; narrowing to nothing over its last metres and where another thing's
  // room cut it
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
    for (const e of own) e.r = 0;   // (what else holds the ground, a hut or a plot: asked without the paths' own room)
    for (const { pts, hw, whole } of paths) {
      let run = [], cut = false;   // (cut: the run begins where another thing's room ends)
      const end = last => { if (run.length * STEP >= MIN) runs.push({ pts: run, hw, t0: cut ? 1.5 : 0, t1: last ? (whole ? 2 : 5) : 1.5 }); run = []; };
      for (const q of pts) { if (k.excluded(q.x, q.z)) { end(false); cut = true; } else run.push(q); }
      end(true);
    }
    own.forEach((e, i) => { e.r = r0[i]; });
    draw(k.scen, runs, rng(L.seed + 1503));
  };
})();
