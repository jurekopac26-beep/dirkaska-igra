/* =========================================================================
   WORLD — realizem 12: the roadside, seen from the chase camera, of the real tracks no other package covers: Furka (Švica) and Izoard
   (Francija) first. Only what OpenStreetMap (ODbL) maps within 60 m of the asphalt, on the ground of the public elevation model the tracks
   already use (Copernicus GLO-30), each pass its own character:
   - Furka: the metre-gauge rack railway at the tunnel's west end (railway=narrow_gauge, gauge=1000, rack=abt), along the road below the
     start: its ballast, the sleepers, the two rails and the rack between them; the hiking guidepost by the road (the Swiss walking signs:
     yellow plates on a grey pole; blank, no text); the bus stops (shelter=no, departures_board=timetable: a pole, its plate and the
     timetable, blank). Not the milestone of km 55: the map has it set in a wall it does not map.
   - Izoard: the stone walls in the hairpins under the col (two retaining walls holding the road up: barrier=retaining_wall, their low side
     away from the road by the ways' direction; one free-standing wall, barrier=wall: its height is not mapped, 1 m), the picnic tables and
     the benches of wood (backrest=no), the cyclists' rack at the col (bicycle_parking=saddle_holder: a bar on two posts), the notice board,
     the guideposts (wooden posts, light plates, blank), the steel mast (man_made=mast, height=9; no antennas mapped: a plain pole).
   Not drawn: what the passes already have (the houses, the parking places, the obelisk), the gates and the culverts (no side roads or
   streams in the game). Placed along the road (the station from the track's first point, the side, the gap from the OSM road's own edge,
   counted beyond the game's barrier line: the game's road is wider than the real one), so they keep to the verge the game draws; the
   railway by the map's coordinates, pushed out to 2.5 m beyond the barrier line where it runs by the road. Nothing on the passes' own
   houses and level plots, nothing within 0.3 m of a barrier line (the other leg of a hairpin).
   Hooks: a pass's PL_LOOK[theme].pre (their room: no trees or rocks on them) and .extra (js/world-prelaz.js), wrapped: the pass's own
   first, then these. Drawn into the scenery chunks (scen.get): no new draw calls, only vertices.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK) return;
  const API = World.api;
  const { box, caGround, clamp, cyl, lerp, rng, vary, vrNear } = API;
  let T; API.sync.push(() => { ({ T } = API); });

  // ---- the data: [kind, station (m from the track's first point), side (+1 right of travel), gap (m from the OSM road's edge), arg]
  const R12 = {
    furka: {
      // the railway (way 1085608504): the run within ~70 m of the road, in the game's x, z (the map's projection, the track's offset)
      rail: [-166.91, 3.96, -164.89, 3.94, -154.65, 4.82, -121.27, 11.47, -107.34, 14.72, -44.47, 32.21, -24.58, 37.46, 11.34, 45.24, 28.25, 50.67,
        43.65, 57.23, 59.32, 66.67],
      pts: [
        ['post', 190.4, -1, 2.53, 'ch'],   // (node 4442163164, information=guidepost)
        ['stop', 281.0, -1, 1.56], ['stop', 3082.2, -1, 1.57], ['stop', 3127.4, 1, 1.52],   // (nodes 983986356, 12119620158, 983983933: highway=bus_stop, shelter=no, departures_board=timetable)
      ],
    },
    izoard: {
      walls: [   // [station, gap] every ~2 m along the way
        { ret: 1, side: 1, p: [4300.4, 1.2, 4302.1, 1.65, 4304.0, 2.05, 4306.1, 2.41, 4308.2, 2.78, 4310.2, 2.87, 4311.9, 2.95, 4313.7, 2.9, 4315.3, 2.94,
          4316.6, 2.79, 4318.7, 2.82, 4319.5, 2.77, 4321.5, 2.82, 4322.4, 2.75, 4323.2, 2.83, 4325.0, 2.69, 4325.6, 2.76, 4327.2, 2.74, 4327.8, 2.96,
          4329.4, 2.85, 4330.0, 3.03, 4330.6, 2.97, 4332.3, 3.18, 4334.2, 3.17] },   // (way 587253384, barrier=retaining_wall)
        { ret: 0, side: 1, p: [4338.9, 3.02, 4339.0, 2.95, 4340.5, 3.06, 4341.0, 2.88, 4342.7, 2.93, 4343.4, 2.81, 4345.2, 2.79, 4346.1, 2.75, 4347.4, 2.79,
          4348.9, 2.81, 4350.8, 2.91, 4352.6, 3.06, 4354.7, 2.82, 4356.9, 2.86, 4358.9, 2.67, 4360.9, 2.48, 4362.7, 2.28, 4364.4, 2.1, 4366.2, 1.57,
          4368.0, 1.41, 4370.1, 1.61, 4372.2, 1.61, 4374.4, 1.55, 4376.7, 1.36, 4379.2, 1.17, 4381.4, 1.02] },   // (way 1446932418, barrier=wall)
        { ret: 1, side: 1, p: [4894.0, 2.01, 4896.2, 2.1, 4898.2, 2.18, 4900.2, 2.27, 4902.1, 2.39, 4903.8, 2.61, 4905.4, 2.82, 4906.9, 2.93, 4908.8, 3.15,
          4909.6, 3.01, 4911.2, 2.88, 4912.3, 2.89, 4913.1, 2.74, 4915.5, 2.25, 4916.2, 2.16, 4917.1, 2.16, 4919.2, 2.02, 4920.3, 2.18, 4921.2, 1.96,
          4923.1, 1.98, 4924.2, 1.93, 4925.4, 2.22] },   // (way 587253382, barrier=retaining_wall)
      ],
      pts: [
        ['table', 308.6, 1, 0.75], ['table', 314.1, 1, 0.3],   // (nodes 5135009084, 5135009083: leisure=picnic_table, material=wood)
        ['post', 3401.1, -1, 8.96, 'fr'],   // (node 4567183933, information=guidepost)
        ['mast', 3953.6, 1, 48.79, 9],   // (node 9953436362, man_made=mast, height=9)
        ['bench', 4936.9, 1, 41.65], ['bench', 5159.2, 1, 11.06],   // (nodes 13898763907, 13898731598: amenity=bench, backrest=no, material=wood)
        ['post', 5096.3, -1, 37.72, 'fr'],   // (node 12143630607, information=guidepost)
        ['rack', 5101.8, 1, 4.23],   // (node 13898761510, bicycle_parking=saddle_holder)
        ['post', 5126.5, 1, 8.92, 'fr'], ['board', 5126.6, 1, 10.59],   // (nodes 11212859690, information=guidepost; 12326896488, board_type=notice)
      ],
    },
  };
  // [half the depth across the road, the room kept round it, half the length along it]
  const FOOT = { table: [0.8, 1.7, 0.9], bench: [0.2, 1.1, 0.8], rack: [0.1, 1.8, 1.45], board: [0.1, 1.1, 0.65], post: [0.1, 0.7, 0.65], stop: [0.1, 0.8, 0.25],
    mast: [0.2, 1.0, 0.2] };
  const WOOD = [0.55, 0.45, 0.33], WOOD_D = [0.45, 0.37, 0.28], GALV = [0.64, 0.65, 0.66], PLATE = [0.86, 0.84, 0.78], YELLOW = [0.95, 0.74, 0.12];
  const STONE = [0.64, 0.61, 0.56], STONE_TOP = [0.69, 0.67, 0.62];   // (the pale limestone of the hairpins' walls)
  const BALLAST = [0.53, 0.51, 0.48], SLEEPER = [0.36, 0.32, 0.28], RAIL_TOP = [0.7, 0.7, 0.71], RAIL_SIDE = [0.44, 0.32, 0.24], RACK = [0.4, 0.37, 0.33];

  // the place at station s, off metres beyond the barrier line on a side; its height on the road, the road's heading, the side's normal
  const at = (s, side, off) => {
    const f = clamp(s / T.ds, 0, T.N - 1.001), i = Math.floor(f), t = f - i, j = i + 1;
    const nx = lerp(T.nx[i], T.nx[j], t), nz = lerp(T.nz[i], T.nz[j], t), o = side * ((side > 0 ? lerp(T.br[i], T.br[j], t) : lerp(T.bl[i], T.bl[j], t)) + off);
    return { x: lerp(T.px[i], T.px[j], t) + nx * o, z: lerp(T.pz[i], T.pz[j], t) + nz * o, y: lerp(T.hy[i], T.hy[j], t),
      a: Math.atan2(lerp(T.tz[i], T.tz[j], t), lerp(T.tx[i], T.tx[j], t)), ox: nx * side, oz: nz * side };
  };
  const ddAt = (x, z) => { const v = vrNear(x, z); return v.i < 0 ? 99 : v.dd; };   // (how far beyond the nearest barrier line)

  // ---- placed before the terrain (x, z only: the ground is not final yet), drawn after the pass's own scenery
  function place(D, { P, exclPush, blds }) {
    const H = T.def && T.def.hotel;
    const inB = (x, z, m) => {   // (in one of the pass's houses, as it is drawn: its footprint turned by its heading, m metres round it)
      for (const b of blds) { const c = Math.cos(b.ang), s = Math.sin(b.ang), u = (x - b.x) * c + (z - b.z) * s, v = (z - b.z) * c - (x - b.x) * s;
        if (Math.abs(u) < b.L / 2 + m && Math.abs(v) < b.W / 2 + m) return true; }
      return false;
    };
    const plot = (x, z, r) => {   // (off the pass's level plots and its hotel, with the room prelaz keeps round them)
      for (const p of P.pads) { const q = p.r + 3 + r; if ((x - p.x) ** 2 + (z - p.z) ** 2 < q * q) return false; }
      if (H) { const [hx, hz, Lh, Wh, a] = H, c = Math.cos(a), s = Math.sin(a), u = (x - hx) * c + (z - hz) * s, v = (z - hz) * c - (x - hx) * s;
        if (Math.abs(u) < Lh / 2 + 3 + r && Math.abs(v) < Wh / 2 + 3 + r) return false; }
      return true;
    };
    const room = (x, z, r) => !inB(x, z, 0.6 + r) && plot(x, z, r);
    const out = { walls: [], pts: [], rail: [] };
    for (const W of D.walls || []) {   // (the gaps a little smoothed: the map's wiggle, not the wall's)
      const th = W.ret ? 0.55 : 0.45, n = W.p.length / 2, g = k => W.p[2 * clamp(k, 0, n - 1) + 1], smp = [];
      for (let k = 0; k < n; k++) {
        const s = W.p[2 * k], o = clamp((g(k - 1) + 2 * g(k) + g(k + 1)) / 4, 0.5, 3.5), a = at(s, W.side, o), b = at(s, W.side, o + th);
        const ok = ddAt(a.x, a.z) > 0.3 && room((a.x + b.x) / 2, (a.z + b.z) / 2, 0.6);
        smp.push({ s, ok, xi: a.x, zi: a.z, xo: b.x, zo: b.z, y: a.y });
        if (ok) exclPush((a.x + b.x) / 2, (a.z + b.z) / 2, 1.3);
      }
      out.walls.push({ ret: W.ret, smp });
    }
    for (const q of D.pts || []) {
      const [kind, s, side, gap] = q, [half, r, len] = FOOT[kind], p = at(s, side, gap > 6 ? gap : Math.max(gap, 1.5) + half);
      const ca = Math.cos(p.a), sa = Math.sin(p.a);   // (its footprint's corners off the houses: the col's rack and board stand by their walls)
      if ([[0, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]].some(([i, j]) => inB(p.x + ca * i * len + p.ox * j * half, p.z + sa * i * len + p.oz * j * half, 0.4))) continue;
      if (ddAt(p.x, p.z) < half + 0.4 || !plot(p.x, p.z, r)) continue;
      exclPush(p.x, p.z, r); out.pts.push({ kind, x: p.x, z: p.z, a: p.a, ox: p.ox, oz: p.oz, arg: q[4] });
    }
    if (D.rail) {   // (every ~3 m; out to 2.5 m beyond the barrier line where it runs by the road; broken where a house or a plot is)
      const F = D.rail; let cur = [];
      for (let k = 0; k + 3 < F.length; k += 2) {
        const x0 = F[k], z0 = F[k + 1], x1 = F[k + 2], z1 = F[k + 3], n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 3));
        for (let m = k ? 1 : 0; m <= n; m++) {
          let x = lerp(x0, x1, m / n), z = lerp(z0, z1, m / n); const v = vrNear(x, z);
          if (v.i >= 0 && v.dd < 2.5) { const i = v.i, sg = v.lat >= 0 ? 1 : -1, d = 2.5 - v.dd; x += T.nx[i] * sg * d; z += T.nz[i] * sg * d; }
          if (room(x, z, 1.4)) { cur.push({ x, z }); exclPush(x, z, 2.4); } else if (cur.length) { out.rail.push(cur); cur = []; }
        }
      }
      if (cur.length) out.rail.push(cur);
      out.rail = out.rail.filter(R => R.length > 1);
    }
    return out;
  }

  // the walls: the face to the road, the coping, the face away, the ends; a retaining wall's top 0.3 m above the verge (it holds the road
  // up: its face away drops to the ground below), a free-standing wall 1 m above the higher side
  function drawWalls(scen, walls, R) {
    for (const W of walls) {
      const S = W.smp;
      for (const q of S) if (q.ok) {
        const yi = caGround(q.xi, q.zi), yo = caGround(q.xo, q.zo);
        q.top = W.ret ? Math.max(yi, q.y - 0.15) + 0.3 : Math.max(yi, yo) + 1.0;
        q.bi = Math.min(yi, q.top - 0.3) - 0.3; q.bo = Math.min(yo, q.top - 0.3) - 0.3;
      }
      const joined = k => k >= 0 && k < S.length - 1 && S[k].ok && S[k + 1].ok && S[k + 1].s - S[k].s < 3.2;
      for (let k = 0; k < S.length - 1; k++) {
        if (!joined(k)) continue;
        const a = S[k], b = S[k + 1], g = scen.get((a.xi + b.xo) / 2, (a.zi + b.zo) / 2), c = vary(STONE, R, 0.12);
        const ins = [(a.xi + a.xo + b.xi + b.xo) / 4, (a.top + b.top) / 2 - 0.3, (a.zi + a.zo + b.zi + b.zo) / 4];
        g.quadO([a.xi, a.bi, a.zi], [a.xi, a.top, a.zi], [b.xi, b.top, b.zi], [b.xi, b.bi, b.zi], c, ins);
        g.quadO([a.xi, a.top, a.zi], [a.xo, a.top, a.zo], [b.xo, b.top, b.zo], [b.xi, b.top, b.zi], vary(STONE_TOP, R, 0.06), ins);
        g.quadO([a.xo, a.bo, a.zo], [a.xo, a.top, a.zo], [b.xo, b.top, b.zo], [b.xo, b.bo, b.zo], c.map(v => v * 0.86), ins);
        for (const [e, f] of [[a, joined(k - 1)], [b, joined(k + 1)]]) if (!f)   // (an end: the stones' cut face)
          g.quadO([e.xi, e.bi, e.zi], [e.xo, e.bo, e.zo], [e.xo, e.top, e.zo], [e.xi, e.top, e.zi], c.map(v => v * 0.93), ins);
      }
    }
  }

  // the railway: the ballast (2.6 m on top, its shoulders down 1 m), the sleepers every 0.65 m, the rails 1 m apart, the rack between them
  function drawRail(scen, runs, R) {
    for (const Q of runs) {
      const n = Q.length, yg = Q.map(p => caGround(p.x, p.z)), top = [], nrm = [];
      for (let k = 0; k < n; k++) {   // (the bed's top: the ground smoothed over ±6 m, never under the ground)
        let s = 0, c = 0; for (let m = Math.max(0, k - 2); m <= Math.min(n - 1, k + 2); m++) { s += yg[m]; c++; }
        top.push(Math.max(s / c, yg[k]) + 0.25);
        const a = Q[Math.max(0, k - 1)], b = Q[Math.min(n - 1, k + 1)], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
        nrm.push([-dz / l, dx / l]);
      }
      const at3 = (k, t, u, dy) => { const j = Math.min(n - 1, k + 1), x = lerp(Q[k].x, Q[j].x, t), z = lerp(Q[k].z, Q[j].z, t), nx = lerp(nrm[k][0], nrm[j][0], t), nz = lerp(nrm[k][1], nrm[j][1], t);
        return [x + nx * u, lerp(top[k], top[j], t) + dy, z + nz * u]; };
      for (let k = 0; k < n - 1; k++) {
        const g = scen.get((Q[k].x + Q[k + 1].x) / 2, (Q[k].z + Q[k + 1].z) / 2), P0 = (u, dy) => at3(k, 0, u, dy), P1 = (u, dy) => at3(k, 1, u, dy);
        const cb = vary(BALLAST, R, 0.06), inB = at3(k, 0.5, 0, -0.5);
        g.quadO(P0(-1.3, 0), P0(1.3, 0), P1(1.3, 0), P1(-1.3, 0), cb, inB);
        g.quadO(P0(1.3, 0), P0(2.0, -1), P1(2.0, -1), P1(1.3, 0), cb.map(v => v * 0.92), inB);
        g.quadO(P0(-1.3, 0), P0(-2.0, -1), P1(-2.0, -1), P1(-1.3, 0), cb.map(v => v * 0.92), inB);
        const len = Math.hypot(Q[k + 1].x - Q[k].x, Q[k + 1].z - Q[k].z), ns = Math.max(1, Math.round(len / 0.65)), hw = 0.11 / Math.max(len, 0.5);
        for (let m = 0; m < ns; m++) {   // (the sleepers: their tops in the ballast)
          const t = (m + 0.5) / ns, inS = at3(k, t, 0, -0.3);
          g.quadO(at3(k, t - hw, -0.9, 0.07), at3(k, t - hw, 0.9, 0.07), at3(k, t + hw, 0.9, 0.07), at3(k, t + hw, -0.9, 0.07), vary(SLEEPER, R, 0.1), inS);
        }
        for (const [u, w, y0, y1, ct, cs] of [[-0.53, 0.035, 0.07, 0.2, RAIL_TOP, RAIL_SIDE], [0.53, 0.035, 0.07, 0.2, RAIL_TOP, RAIL_SIDE], [0, 0.05, 0.07, 0.25, RACK, RACK]]) {
          const inR = at3(k, 0.5, u, (y0 + y1) / 2);
          g.quadO(P0(u - w, y1), P0(u + w, y1), P1(u + w, y1), P1(u - w, y1), ct, inR);
          g.quadO(P0(u - w, y0), P0(u - w, y1), P1(u - w, y1), P1(u - w, y0), cs, inR);
          g.quadO(P0(u + w, y0), P0(u + w, y1), P1(u + w, y1), P1(u + w, y0), cs, inR);
        }
      }
    }
  }

  // the posts, the benches, the tables, the rack, the board and the mast: wood, galvanised steel, blank plates
  function drawPts(scen, pts, R) {
    for (const q of pts) {
      const g = scen.get(q.x, q.z), y = caGround(q.x, q.z), a = q.a, ca = Math.cos(a), sa = Math.sin(a);
      const W2 = (u, v) => [q.x + ca * u + q.ox * v, q.z + sa * u + q.oz * v];   // (u along the road, v away from it)
      const wd = vary(WOOD, R, 0.1), wdd = vary(WOOD_D, R, 0.1);
      if (q.kind === 'table') {
        box(g, q.x, y + 0.7, q.z, 1.8, 0.05, 0.7, a, wd);
        for (const v of [-0.6, 0.6]) { const [x, z] = W2(0, v); box(g, x, y + 0.42, z, 1.8, 0.05, 0.26, a, wd); }
        for (const u of [-0.7, 0.7]) {
          const [x, z] = W2(u, 0); box(g, x, y + 0.36, z, 0.06, 0.06, 1.46, a, wdd);
          for (const v of [-0.22, 0.22]) { const [lx, lz] = W2(u, v); box(g, lx, y - 0.2, lz, 0.07, 0.9, 0.07, a, wdd, null, true); }
        }
      } else if (q.kind === 'bench') {
        box(g, q.x, y + 0.42, q.z, 1.6, 0.06, 0.32, a, wd);
        for (const u of [-0.6, 0.6]) { const [x, z] = W2(u, 0); box(g, x, y - 0.2, z, 0.08, 0.62, 0.3, a, wdd, null, true); }
      } else if (q.kind === 'rack') {
        box(g, q.x, y + 1.17, q.z, 2.9, 0.05, 0.05, a, GALV);
        for (const u of [-1.4, 1.4]) { const [x, z] = W2(u, 0); box(g, x, y - 0.2, z, 0.06, 1.42, 0.06, a, GALV, null, true); }
      } else if (q.kind === 'board') {
        for (const u of [-0.65, 0.65]) { const [x, z] = W2(u, 0); box(g, x, y - 0.3, z, 0.1, 2.2, 0.1, a, wdd, null, true); }
        box(g, q.x, y + 0.95, q.z, 1.2, 0.85, 0.05, a, PLATE, wd);
      } else if (q.kind === 'post') {
        const ch = q.arg === 'ch', pc = ch ? YELLOW : PLATE;   // (the Swiss: yellow plates on a grey pole; the French: light plates on wood)
        if (ch) cyl(g, q.x, y - 0.2, q.z, 0.035, 2.65, 6, GALV); else box(g, q.x, y - 0.2, q.z, 0.1, 2.5, 0.1, a, wdd, null, true);
        for (const [d, h] of [[0, 2.05], [Math.PI, 1.85]]) {   // (one plate each way along the road)
          const da = a + d, x = q.x + Math.cos(da) * 0.34, z = q.z + Math.sin(da) * 0.34; box(g, x, y + h, z, 0.6, 0.14, 0.025, da, pc);
        }
        if (ch) { const [x, z] = W2(0, -0.04); box(g, x, y + 2.3, z, 0.24, 0.12, 0.025, a, pc); }   // (the place's own plate, on top)
      } else if (q.kind === 'stop') {   // (the stop's pole, its plate across the road to the coming bus, the timetable under it; blank)
        cyl(g, q.x, y - 0.2, q.z, 0.04, 2.6, 6, GALV);
        box(g, q.x, y + 1.95, q.z, 0.03, 0.42, 0.42, a, PLATE); box(g, q.x, y + 1.05, q.z, 0.04, 0.5, 0.34, a, PLATE);
      } else if (q.kind === 'mast') {
        cyl(g, q.x, y - 0.3, q.z, 0.17, (q.arg || 9) + 0.3, 6, GALV, GALV, 0.09);
      }
    }
  }

  for (const th in R12) {
    const L = API.PL_LOOK[th]; if (!L) continue;
    const pre0 = L.pre, extra0 = L.extra; let cur = null;
    L.pre = function (k) { if (pre0) pre0.call(this, k); cur = place(R12[th], k); };
    L.extra = function (k) {
      if (extra0) extra0.call(this, k);
      if (!cur) return;
      const R = rng(L.seed + 1201);
      drawWalls(k.scen, cur.walls, R); drawRail(k.scen, cur.rail, R); drawPts(k.scen, cur.pts, R);
      cur = null;
    };
  }
})();
