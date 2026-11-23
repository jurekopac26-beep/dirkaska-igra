/* =========================================================================
   WORLD — Izoard, France: the furniture along the D902 under the col (docs/proge/izoard.md, »Oprema ob cesti«), on top of the shared world of
   the passes (js/world-prelaz.js, PL_LOOK.izoard; its hooks pre and extra wrapped). Places from OpenStreetMap (ODbL 1.0, read 22. 11. 2026);
   all generic: no names, letters or signs on the plates and the board. At the col: the rack the bicycles hang on
   by the saddle, the walkers' guideposts and the board, the wooden benches and the picnic tables in the larch wood, the small mast on the slope.
   Graphics only, into the scenery's chunks (no new draw calls); the driving, physics and def.hills untouched. The game's road and its barriers
   are wider than the real road: what OpenStreetMap puts inside them is moved out past the barrier (docs/proge/izoard.md, Približki).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK || !World.api.PL_LOOK.izoard) return;
  const API = World.api, LK = API.PL_LOOK.izoard;
  const { box, cyl, caGround, ouRod, vrNear } = API;
  let T; API.sync.push(() => { ({ T } = API); });

  // (a/b: the user's choice, PR #984) false = (a) the rack empty, as OpenStreetMap has it; true = (b) three bicycles hung on it by the saddle
  const BIKES_B = false;

  // [kind, x, z] in the game's metres (x east, z south, from the start line); OpenStreetMap's nodes
  const ITEMS = [
    ['table', -23.1, 148.6],    // n5135009083 leisure=picnic_table, material=wood
    ['table', -26.3, 143.8],    // n5135009084 leisure=picnic_table, material=wood
    ['post', 670.3, 1200.9],    // n4567183933 information=guidepost
    ['mast', 727.2, 1654.7],    // n9953436362 man_made=mast, height=9
    ['bench', 915.1, 1794.2],   // n13898763907 amenity=bench, backrest=no, material=wood
    ['rack', 1004.3, 1902.7],   // n13898761510 amenity=bicycle_parking (the saddle-holder kind)
    ['post', 1052.6, 1903.3],   // n12143630607 information=guidepost
    ['post', 996.4, 1926.7],    // n11212859690 information=guidepost
    ['board', 994.7, 1926.7],   // n12326896488 information=board
    ['bench', 990.3, 1958.7],   // n13898731598 amenity=bench, backrest=no, material=wood
  ];
  const CLEAR = { table: 1.8, post: 0.9, mast: 1.5, bench: 1.2, rack: 1.0, board: 1.2 };   // past the barrier (m)
  const ROOM = { table: 2.6, post: 1.2, mast: 2.0, bench: 1.6, rack: 3.2, board: 1.6 };    // the trees and the houses kept off (m)

  const WOOD = [0.56, 0.43, 0.29], WOOD_T = [0.63, 0.5, 0.34], WOOD_D = [0.42, 0.32, 0.22], PLATE = [0.74, 0.63, 0.45], PANEL = [0.8, 0.77, 0.68];
  const STEEL = [0.62, 0.64, 0.67], MAST = [0.7, 0.71, 0.72], ANT = [0.86, 0.86, 0.84], TYRE = [0.17, 0.17, 0.18], SADDLE = [0.22, 0.22, 0.23];
  const FRAMES = [[0.82, 0.2, 0.16], [0.9, 0.9, 0.88], [0.22, 0.46, 0.8]];

  const near = (x, z) => { const n = vrNear(x, z); if (n.i < 0) return null; return { i: n.i, lat: n.lat, sd: n.lat >= 0 ? 1 : -1 }; };
  const bar = (i, sd) => (sd > 0 ? T.br[i] : T.bl[i]);
  const hitB = (blds, x, z, r) => (blds || []).some((b) => { const c = Math.cos(b.ang), s = Math.sin(b.ang), dx = x - b.x, dz = z - b.z;
    return Math.abs(dx * c + dz * s) < b.L / 2 + r && Math.abs(-dx * s + dz * c) < b.W / 2 + r; });

  let placed = null;
  function place(blds) {
    const out = [];
    for (const [k, x0, z0] of ITEMS) {
      const n = near(x0, z0); if (!n) continue;
      const i = n.i, lim = bar(i, n.sd) + CLEAR[k]; let x = x0, z = z0;
      if (Math.abs(n.lat) < lim) { const d = n.sd * lim - n.lat; x += T.nx[i] * d; z += T.nz[i] * d; }
      const a = Math.atan2(T.tz[i], T.tx[i]), foot = k === 'rack' ? [-2.6, 0, 2.6] : [0];
      const hit = (px, pz) => foot.some((u) => hitB(blds, px + Math.cos(a) * u, pz + Math.sin(a) * u, 0.5));
      if (hit(x, z)) {   // (clear of a house: along the road first, up to 12 m, else farther out)
        let ok = false;
        for (let t = 1; t <= 12 && !ok; t++) for (const sg of [1, -1]) { const xx = x + T.tx[i] * sg * t, zz = z + T.tz[i] * sg * t; if (!hit(xx, zz)) { x = xx; z = zz; ok = true; break; } }
        for (let t = 0; t < 16 && !ok && hit(x, z); t++) { x += T.nx[i] * n.sd * 0.5; z += T.nz[i] * n.sd * 0.5; }
      }
      out.push({ k, x, z, a, sd: n.sd });
    }
    return out;
  }

  const basePre = LK.pre, base = LK.extra;
  LK.pre = function (o) {
    const r = basePre ? basePre.call(this, o) : undefined;
    if (!T) T = API.T; if (!T) return r;
    placed = place(o.blds);
    for (const p of placed) o.exclPush(p.x, p.z, ROOM[p.k]);
    return r;
  };
  LK.extra = function (o) {
    const r = base ? base.call(this, o) : undefined;
    if (!T) T = API.T; if (!T) return r;
    const st = lay(o, placed || place(null));
    if (o.out) { if (o.out.izoard) o.out.izoard.roadside = st; else o.out.izoardRoadside = st; }
    return r;
  };

  function lay({ scen }, list) {
    const st = { table: 0, post: 0, mast: 0, bench: 0, rack: 0, board: 0, bikes: 0 };
    for (const p of list) {
      const { k, x, z, a, sd } = p, c = Math.cos(a), s = Math.sin(a), g = scen.get(x, z), y = caGround(x, z) - 0.04;
      const at = (u, v) => [x + c * u - s * v, z + s * u + c * v];   // (u along the road, v across it: +v the side of OpenStreetMap's +lat)
      st[k]++;
      if (k === 'table') {   // a plank top, a bench on each side, the two trestles
        box(g, x, y + 0.72, z, 1.9, 0.06, 0.78, a, WOOD, WOOD_T);
        for (const v of [-0.62, 0.62]) { const [bx, bz] = at(0, v); box(g, bx, y + 0.42, bz, 1.9, 0.05, 0.26, a, WOOD, WOOD_T); }
        for (const u of [-0.72, 0.72]) { const [lx, lz] = at(u, 0); box(g, lx, y, lz, 0.07, 0.72, 1.4, a, WOOD_D); }
      } else if (k === 'bench') {   // a plank seat on two legs, no backrest
        box(g, x, y + 0.42, z, 1.7, 0.07, 0.38, a, WOOD, WOOD_T);
        for (const u of [-0.64, 0.64]) { const [lx, lz] = at(u, 0); box(g, lx, y, lz, 0.08, 0.42, 0.34, a, WOOD_D); }
      } else if (k === 'post') {   // a wooden post, two or three blank plates pointing the ways
        box(g, x, y, z, 0.12, 2.3, 0.12, a, WOOD_D, WOOD_D);
        const np = 2 + (Math.round(x + z) & 1);
        for (let j = 0; j < np; j++) { const h = a + 0.4 + j * 2.1, ch = Math.cos(h), sh = Math.sin(h);
          box(g, x + ch * 0.37, y + 2.1 - j * 0.24, z + sh * 0.37, 0.62, 0.16, 0.035, h, PLATE, PLATE); }
      } else if (k === 'board') {   // two posts, a blank panel facing the road, a narrow roof of boards
        for (const u of [-0.75, 0.75]) { const [lx, lz] = at(u, 0); box(g, lx, y, lz, 0.1, 2.05, 0.1, a, WOOD_D, WOOD_D); }
        box(g, x, y + 0.9, z, 1.4, 0.95, 0.05, a, PANEL, WOOD_D);
        box(g, x, y + 2.03, z, 1.75, 0.06, 0.5, a, WOOD_D, WOOD);
      } else if (k === 'mast') {   // a steel pole of 9 m, three panel antennas near the top
        cyl(g, x, y, z, 0.22, 9, 8, MAST, MAST, 0.13);
        for (let j = 0; j < 3; j++) { const h = a + j * 2.094, ch = Math.cos(h), sh = Math.sin(h);
          box(g, x + ch * 0.34, y + 6.9, z + sh * 0.34, 0.3, 1.3, 0.1, h + Math.PI / 2, ANT, ANT); }
      } else if (k === 'rack') {   // a steel bar ~1.1 m high on three posts, along the road
        const yb = y + 1.1;
        for (const u of [-2.4, 0, 2.4]) { const [px, pz] = at(u, 0); box(g, px, caGround(px, pz) - 0.04, pz, 0.06, yb - caGround(px, pz) + 0.04, 0.06, a, STEEL, STEEL); }
        const [ax, az] = at(-2.55, 0), [bx, bz] = at(2.55, 0); ouRod(g, [ax, yb, az], [bx, yb, bz], 0.03, STEEL, 4);
        if (BIKES_B) [-1.6, -0.25, 1.25].forEach((u, j) => { bike(g, at, u, sd, y, FRAMES[j]); st.bikes++; });
      }
    }
    return st;
  }

  // a bicycle hung by the saddle on the bar (u along the bar), nose down ~15°: its front wheel on the ground, away from the road
  const PH = 0.26, CP = Math.cos(PH), SP = Math.sin(PH);
  function bike(g, at, u, sd, y, frame) {
    const P = (a, h) => { const a1 = a * CP + h * SP + 0.515, h1 = -a * SP + h * CP, [px, pz] = at(u, sd * a1); return [px, y + h1, pz]; };
    const W = (a, h) => { for (let j = 0; j < 10; j++) { const t0 = j / 10 * 2 * Math.PI, t1 = (j + 1) / 10 * 2 * Math.PI;   // (the tyre: a ring of ten rods)
      ouRod(g, P(a + 0.33 * Math.cos(t0), h + 0.33 * Math.sin(t0)), P(a + 0.33 * Math.cos(t1), h + 0.33 * Math.sin(t1)), 0.022, TYRE, 3); } };
    const R = (a0, h0, a1, h1, r, col) => ouRod(g, P(a0, h0), P(a1, h1), r, col, 3);
    W(-1.0, 0.34); W(0, 0.34);
    R(-1.0, 0.34, -0.6, 0.28, 0.018, frame); R(-0.6, 0.28, -0.75, 0.85, 0.022, frame); R(-1.0, 0.34, -0.75, 0.85, 0.015, frame);
    R(-0.6, 0.28, -0.14, 0.7, 0.025, frame); R(-0.75, 0.85, -0.12, 0.82, 0.022, frame); R(-0.12, 0.82, 0, 0.34, 0.018, frame);
    R(-0.75, 0.85, -0.78, 0.94, 0.014, SADDLE); R(-0.86, 0.95, -0.66, 0.95, 0.035, SADDLE); R(-0.12, 0.82, -0.08, 0.92, 0.016, frame);
    const hb = P(-0.08, 0.92), [ex, ez] = at(1, 0), [ox, oz] = at(0, 0), ux = (ex - ox) * 0.21, uz = (ez - oz) * 0.21;
    ouRod(g, [hb[0] - ux, hb[1], hb[2] - uz], [hb[0] + ux, hb[1], hb[2] + uz], 0.016, SADDLE, 3);
  }
})();
