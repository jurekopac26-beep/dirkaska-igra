/* WORLD — Furka: the furniture along the road (docs/proge/furka.md, »Oprema ob cesti«), on top of the shared world of the passes (js/world-prelaz.js,
   PL_LOOK.furka; its hooks pre and extra wrapped): what OpenStreetMap maps by the road and the shared world does not draw. The hiking guidepost by
   the Muttbach (its two yellow arrows along the two mountain paths, their tips white-red-white: the Swiss signs of the hiking trails, SN 640 829),
   the three bus stops without a shelter (a pole, its plate on top and a timetable case), the blue place signs of a main road (SSV 4.27) and the
   speed limits of 50 by the hotel (at the place sign the »50 generell« of SSV 2.30.1). Places from OpenStreetMap (ODbL 1.0, read through its API
   22. 11. 2026); all generic: the lettering only hinted (blocks, nothing readable), no names of the stops, of an operator or of the hotel. The
   give-way signs OpenStreetMap maps on the side tracks are left out: the game draws no side tracks, and the guardrail runs past their mouths.
   Graphics only, into the scenery's chunks (vertex colours: no texture, no new draw calls); the driving, the physics and def.hills untouched. The
   game's road and its barriers are wider than the real road: what OpenStreetMap puts inside them is moved out past the barrier (Približki). */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK || !World.api.PL_LOOK.furka) return;
  const API = World.api, LK = API.PL_LOOK.furka;
  const { box, cyl, caGround, vrNear } = API;
  let T; API.sync.push(() => { ({ T } = API); });

  // [kind, x, z, ...]: the game's metres (x east, z south; OpenStreetMap's nodes moved onto the game's road, ~0.1 m); angles in degrees, atan2(dz, dx)
  const ITEMS = [
    ['guide', 30.7, -5.9, [178.9, 9.6]],       // n4442163164 tourism=information, information=guidepost; arrows: the path w366817409 west, the track
                                               // w1318044100 into the path w1318044101 east (both sac_scale=mountain_hiking)
    ['bus', 18.8, -74.1],                      // n983986356 highway=bus_stop, shelter=no, departures_board=timetable
    ['bus', -630.3, -715.2],                   // n12119620158 (the same tags)
    ['bus', -596.0, -698.8],                   // n983983933 (the same tags)
    ['city50', -528.7, -610.5],                // n11105697142 traffic_sign=city_limit;maxspeed, maxspeed=50
    ['city', -475.1, -613.1],                  // n11105697143 traffic_sign=city_limit
    ['v50', -293.8, -565.9],                   // n11105697141 traffic_sign=maxspeed, maxspeed=50
  ];
  // the bus stops' plate: 0 white, 1 yellow. Yellow, as in reality: the SSV (5.46, Art. 79a) sets only the stop's sign on the road and its
  // yellow zigzag, the plate at the stop is the bus operator's, and on the pass road's line those plates are yellow with a black bus
  // (the user chose a white one on 23. 11., »check what colour it really is«: docs/proge/furka.md). Without a logo, a name or any lettering.
  const BUS_PLATE = 1;
  const CLEAR = { guide: 0.9, bus: 1.1, city50: 1.2, city: 1.2, v50: 0.9 };   // past the barrier (m)
  const ROOM = { guide: 1.2, bus: 1.6, city50: 1.4, city: 1.4, v50: 1.0 };    // the shrubs, rocks and houses kept off (m)
  const STEEL = [0.6, 0.61, 0.63], BACK = [0.5, 0.51, 0.53], WHITE = [0.93, 0.93, 0.91], RED = [0.76, 0.09, 0.08], INK = [0.07, 0.07, 0.08],
    BLUE = [0.04, 0.29, 0.58], YELLOW = [0.95, 0.78, 0.1], CASE = [0.4, 0.42, 0.45], PAPER = [0.85, 0.86, 0.83], PICTO = [0.14, 0.17, 0.22];
  const RAD = Math.PI / 180;

  const near = (x, z) => { const n = vrNear(x, z); if (n.i < 0) return null; return { i: n.i, lat: n.lat, sd: n.lat >= 0 ? 1 : -1 }; };
  const bar = (i, sd) => (sd > 0 ? T.br[i] : T.bl[i]);
  const hitB = (blds, x, z, r) => (blds || []).some((b) => { const c = Math.cos(b.ang), s = Math.sin(b.ang), dx = x - b.x, dz = z - b.z;
    return Math.abs(dx * c + dz * s) < b.L / 2 + r && Math.abs(-dx * s + dz * c) < b.W / 2 + r; });

  let placed = null;
  function place(blds) {
    const out = [];
    for (const it of ITEMS) {
      const k = it[0]; let x = it[1], z = it[2];
      const n = near(x, z); if (!n) continue;
      const i = n.i, lim = bar(i, n.sd) + CLEAR[k];
      if (Math.abs(n.lat) < lim) { const d = n.sd * lim - n.lat; x += T.nx[i] * d; z += T.nz[i] * d; }
      if (hitB(blds, x, z, 0.6)) {   // (clear of a house: along the road first, up to 12 m, else farther out)
        let ok = false;
        for (let t = 1; t <= 12 && !ok; t++) for (const sg of [1, -1]) { const xx = x + T.tx[i] * sg * t, zz = z + T.tz[i] * sg * t; if (!hitB(blds, xx, zz, 0.6)) { x = xx; z = zz; ok = true; break; } }
        for (let t = 0; t < 16 && !ok && hitB(blds, x, z, 0.6); t++) { x += T.nx[i] * n.sd * 0.5; z += T.nz[i] * n.sd * 0.5; }
      }
      out.push({ k, x, z, i, sd: n.sd, it });
    }
    return out;
  }
  const basePre = LK.pre, base = LK.extra;
  LK.pre = function (o) { const r = basePre ? basePre.call(this, o) : undefined; if (!T) T = API.T; if (!T) return r;
    placed = place(o.blds); for (const p of placed) o.exclPush(p.x, p.z, ROOM[p.k]); return r; };
  LK.extra = function (o) { const r = base ? base.call(this, o) : undefined; if (!T) T = API.T; if (!T) return r;
    const st = lay(o, placed || place(null));
    if (o.out) { if (o.out.furka) o.out.furka.roadside = st; else o.out.furkaRoadside = st; } return r; };

  // a flat convex shape on a plate: its points (u, v) in metres, u along (ux, uz), v up, from (ox, oy, oz); its front toward (fx, fz), off metres
  // out of the plate's plane
  function poly(g, ox, oy, oz, ux, uz, fx, fz, off, pts, col) {
    const P = (q) => [ox + ux * q[0] + fx * off, oy + q[1], oz + uz * q[0] + fz * off], inn = [ox - fx, oy, oz - fz];
    for (let j = 1; j + 1 < pts.length; j++) g.triO(P(pts[0]), P(pts[j]), P(pts[j + 1]), col, inn);
  }
  const rect = (u0, v0, u1, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
  const circ = (uc, vc, r, n, rv) => Array.from({ length: n }, (_, j) => [uc + Math.cos(j / n * 2 * Math.PI) * r, vc + Math.sin(j / n * 2 * Math.PI) * (rv || r)]);
  // a sign's face toward (fx, fz): u to the right of someone facing it
  const F = (g, x, y, z, fx, fz, off, pts, col) => poly(g, x, y, z, fz, -fx, fx, fz, off, pts, col);
  const ringF = (g, x, y, z, fx, fz, off, uc, vc, r0, r1, n, col, rv0, rv1) => { const a = circ(uc, vc, r0, n, rv0), b = circ(uc, vc, r1, n, rv1);
    for (let j = 0; j < n; j++) { const q = (j + 1) % n; F(g, x, y, z, fx, fz, off, [a[j], b[j], b[q], a[q]], col); } };

  // a line of lettering only hinted: blocks [width, top, bottom] side by side, centred on u = uc (nothing readable: no name)
  const word = (g, x, y, z, fx, fz, off, uc, vb, gl, gap, col, PF) => {
    let u = uc - (gl.reduce((s, q) => s + q[0], 0) + gap * (gl.length - 1)) / 2;
    for (const q of gl) { (PF || F)(g, x, y, z, fx, fz, off, rect(u, vb + (q[2] || 0), u + q[0], vb + q[1]), col); u += q[0] + gap; }
  };
  // the speed limit of 50: a white disc in a red ring, the black figures (k its scale; o0 > 0: on a panel, else its own grey back)
  function limit50(g, x, y, z, fx, fz, k = 1, o0 = 0) {
    if (!o0) F(g, x, y, z, -fx, -fz, 0, circ(0, 0, 0.3, 16), BACK);
    const S = (q) => q.map(([u, v]) => [u * k, v * k]);
    ringF(g, x, y, z, fx, fz, o0 + 0.006, 0, 0, 0.235 * k, 0.3 * k, 16, RED);
    F(g, x, y, z, fx, fz, o0 + 0.006, circ(0, 0, 0.236 * k, 16), WHITE);
    const s = 0.034, a = -0.145, b = -0.02;   // the »5«: its strokes; the »0«: an oval ring
    for (const q of [rect(a, 0.086, b, 0.12), rect(a, 0.0, a + s, 0.12), rect(a, -0.004, b - 0.012, 0.03), rect(b - s, -0.11, b, 0.03), rect(b - s - 0.012, -0.004, b, 0.03),
      rect(a, -0.12, b - 0.012, -0.086), rect(b - s - 0.006, -0.12, b, -0.086)]) F(g, x, y, z, fx, fz, o0 + 0.013, S(q), INK);
    ringF(g, x, y, z, fx, fz, o0 + 0.013, 0.085 * k, 0, 0.026 * k, 0.06 * k, 14, INK, 0.086 * k, 0.12 * k);
  }
  // »50 generell« (SSV 2.30.1: where the general limit of 50 in a place begins): a white panel with a thin black edge, the 50, the word below it
  function generell50(g, x, yb, z, fx, fz) {
    const w = 0.31, H = 0.84, e = 0.018, bw = 0.012;
    F(g, x, yb, z, -fx, -fz, 0, rect(-w, 0, w, H), BACK);
    F(g, x, yb, z, fx, fz, 0.006, rect(-w, 0, w, H), WHITE);
    for (const q of [rect(-w + e, H - e - bw, w - e, H - e), rect(-w + e, e, w - e, e + bw), rect(-w + e, e, -w + e + bw, H - e), rect(w - e - bw, e, w - e, H - e)])
      F(g, x, yb, z, fx, fz, 0.012, q, INK);
    limit50(g, x, yb + 0.52, z, fx, fz, 0.85, 0.006);
    word(g, x, yb, z, fx, fz, 0.012, 0, 0.135, [[0.045, 0.05, -0.022], [0.045, 0.05], [0.045, 0.05], [0.045, 0.05], [0.03, 0.05], [0.045, 0.05], [0.014, 0.075], [0.014, 0.075]], 0.012, INK);
  }
  // the place sign of a main road: blue, a white border, its lettering only hinted (no name); its grey back
  function placeSign(g, x, y, z, fx, fz) {
    const w = 0.6, h = 0.2, e = 0.03, bw = 0.022;
    F(g, x, y, z, -fx, -fz, 0, rect(-w, -h, w, h), BACK);
    F(g, x, y, z, fx, fz, 0.006, rect(-w, -h, w, h), BLUE);
    for (const q of [rect(-w + e, h - e - bw, w - e, h - e), rect(-w + e, -h + e, w - e, -h + e + bw), rect(-w + e, -h + e, -w + e + bw, h - e), rect(w - e - bw, -h + e, w - e, h - e)])
      F(g, x, y, z, fx, fz, 0.012, q, WHITE);
    word(g, x, y, z, fx, fz, 0.012, 0, -0.055, [[0.075, 0.12], [0.06, 0.09], [0.065, 0.09], [0.06, 0.09], [0.06, 0.09], [0.065, 0.09], [0.06, 0.09]], 0.022, WHITE);
  }

  function lay({ scen }, list) {
    const st = { guide: 0, bus: 0, city50: 0, city: 0, v50: 0 };
    for (const p of list) {
      const { k, x, z, i, sd, it } = p, g = scen.get(x, z), y = caGround(x, z) - 0.04, tx = T.tx[i], tz = T.tz[i], hd = Math.atan2(tz, tx);
      st[k]++;
      if (k === 'guide') {   // a grey pole, the arrows one above the other, each along its path, yellow on both faces
        cyl(g, x, y, z, 0.035, 2.45, 6, STEEL, STEEL);
        it[3].forEach((deg, j) => {
          const bx = Math.cos(deg * RAD), bz = Math.sin(deg * RAD), ox = x + bx * 0.04, oz = z + bz * 0.04, oy = y + 2.2 - j * 0.2, L = 0.62, h = 0.07, t = 0.12, m = 0.06;
          for (const sg of [1, -1]) {   // (the front and the back: the same arrow)
            const fx = -bz * sg, fz = bx * sg, o = 0.012;
            poly(g, ox, oy, oz, bx, bz, fx, fz, o, rect(0, -h, L - t - m, h), YELLOW);
            poly(g, ox, oy, oz, bx, bz, fx, fz, o, rect(L - t - m, h / 3, L - t, h), WHITE);
            poly(g, ox, oy, oz, bx, bz, fx, fz, o, rect(L - t - m, -h / 3, L - t, h / 3), RED);
            poly(g, ox, oy, oz, bx, bz, fx, fz, o, rect(L - t - m, -h, L - t, -h / 3), WHITE);
            poly(g, ox, oy, oz, bx, bz, fx, fz, o, [[L - t, h], [L - t, h / 3], [L - t / 3, h / 3]], WHITE);
            poly(g, ox, oy, oz, bx, bz, fx, fz, o, [[L - t, h / 3], [L - t, -h / 3], [L - t / 3, -h / 3], [L, 0], [L - t / 3, h / 3]], RED);
            poly(g, ox, oy, oz, bx, bz, fx, fz, o, [[L - t, -h / 3], [L - t, -h], [L - t / 3, -h / 3]], WHITE);
            const PF = (gg, xx, yy, zz, ffx, ffz, off, pts, col) => poly(gg, xx, yy, zz, bx, bz, ffx, ffz, off, pts, col);   // (the lettering hinted: a place, its time)
            word(g, ox, oy, oz, fx, fz, o + 0.005, 0.15, -0.022, [[0.03, 0.045], [0.022, 0.034], [0.022, 0.034], [0.024, 0.034], [0.022, 0.034], [0.022, 0.034], [0.024, 0.034]], 0.007, INK, PF);
            word(g, ox, oy, oz, fx, fz, o + 0.005, L - t - m - 0.075, -0.022, [[0.018, 0.045], [0.02, 0.034], [0.03, 0.034]], 0.009, INK, PF);
          }
          box(g, ox + bx * (L - t) / 2, oy - h, oz + bz * (L - t) / 2, L - t, 2 * h, 0.022, deg * RAD, YELLOW, YELLOW);   // (the plate's edge)
        });
      } else if (k === 'bus') {   // a steel pole, its plate on top across the road, the same on both faces (a bus drawn on it, no name); the timetable case
        const plate = BUS_PLATE ? YELLOW : WHITE, py = y + 2.42;
        cyl(g, x, y, z, 0.04, py - 0.19 - y, 6, STEEL, STEEL);   // (up into the plate's lower edge: nothing of it across the faces)
        box(g, x, py - 0.2, z, 0.56, 0.4, 0.03, Math.atan2(T.nz[i], T.nx[i]), BACK, BACK);
        for (const sg of [1, -1]) {
          const fx = tx * sg, fz = tz * sg;
          F(g, x, py, z, fx, fz, 0.017, rect(-0.27, -0.19, 0.27, 0.19), plate);
          for (const q of [rect(-0.27, 0.17, 0.27, 0.19), rect(-0.27, -0.19, 0.27, -0.17), rect(-0.27, -0.19, -0.25, 0.19), rect(0.25, -0.19, 0.27, 0.19)]) F(g, x, py, z, fx, fz, 0.022, q, PICTO);
          F(g, x, py, z, fx, fz, 0.022, rect(-0.16, -0.08, 0.16, 0.1), PICTO);   // (the bus: its body, windows, wheels)
          F(g, x, py, z, fx, fz, 0.027, rect(-0.135, 0.02, 0.135, 0.075), plate);
          for (const uc of [-0.09, 0.09]) F(g, x, py, z, fx, fz, 0.022, circ(uc, -0.085, 0.032, 8), PICTO);
        }
        const rx = -T.nx[i] * sd, rz = -T.nz[i] * sd, cx = x + rx * 0.07, cz = z + rz * 0.07;   // (the case on the pole's road side, its front to the road)
        box(g, cx, y + 1.1, cz, 0.38, 0.52, 0.05, hd, CASE, CASE);
        F(g, cx, y + 1.36, cz, rx, rz, 0.029, rect(-0.16, -0.22, 0.16, 0.22), PAPER);
      } else {   // the main road's signs, facing the traffic on whose right they stand: the 50, the place sign, both on one post
        const fx = -tx * sd, fz = -tz * sd, top = k === 'city50' ? 2.8 : k === 'city' ? 2.12 : 2.32;
        box(g, x - fx * 0.05, y - 0.2, z - fz * 0.05, 0.08, top + 0.2, 0.08, hd, STEEL);
        if (k === 'city50') { generell50(g, x, y + 1.98, z, fx, fz); placeSign(g, x, y + 1.72, z, fx, fz); }
        else if (k === 'city') placeSign(g, x, y + 1.9, z, fx, fz);
        else limit50(g, x, y + 2.0, z, fx, fz);
      }
    }
    st.at = list.map((p) => [p.k, Math.round(p.x * 10) / 10, Math.round(p.z * 10) / 10]);   // (tests: where each one stands)
    return st;
  }
})();
