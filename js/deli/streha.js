/* Deli iz garaže, sklop 2 · streha: streha, stresna_zajemalka, antena, zaluzije. Each element registers its 16 options with DELI.add(id,
   build(K, n, m, M)) (js/deli.js; the contract: docs/deli.md). Loaded after js/deli.js, before the cars.
     streha             m: { x0, x1 (the roof from the spoiler's leading edge to the windscreen's top, look units), xf (the front edge of a
                        window over the front seats), xr (the rear bench's middle) }: a sunroof, from a small round pane to the whole roof in glass (the stock: none)
     stresna_zajemalka  m: { x (the mouth, at the roof's front), z }: a scoop on the roof, its mouth forward (the stock: none)
     antena             m: { x, z (the rod's foot: the stock aerial's), fin: [x, z] (a shark fin's rear end), front: [x, z] (a stub at
                        the roof's front) } in the aerial's part
     zaluzije           m: { x0, y0, x1, y1 (the rear window's foot and top, middle), w (its half width) } in the tailgate's part:
                        slats over the glass (the stock: none; the rear wiper goes with them: the car's around) */
(function () {
  'use strict';
  if (typeof DELI === 'undefined') return;
  const CF = [0.075, 0.078, 0.085], CF2 = [0.11, 0.115, 0.125], CFG = [0.15, 0.155, 0.17], CFM = [0.085, 0.087, 0.092];   // (carbon's two shades; gloss, matt)
  const RF = [0.098, 0.101, 0.11], RFG = [0.128, 0.132, 0.145], RFM = [0.093, 0.095, 0.1];   // (a roof's carbon: big cells, so the shades closer)
  const BLK = [0.035, 0.035, 0.04], MAT = [0.06, 0.06, 0.065], WHT = [0.9, 0.9, 0.88], WHP = [0.95, 0.95, 0.94], AL = [0.74, 0.76, 0.8], GM = [0.42, 0.43, 0.46],
    DK = [0.02, 0.02, 0.025], ANO = [0.24, 0.26, 0.32], RED = [0.85, 0.12, 0.08], WRAP = [0.95, 0.7, 0.07], LAK = [0.93, 0.62, 0.05];   // (the colour wrap and paint: yellow, till the garage picks it)
  const lerp = (a, b, t) => a + (b - a) * t;
  // the main loft's sections (look.body.secs rows: x, w, yb, ybelt, wt, yt, cr, kind): field i at x
  const prop = (K, x, i) => { const S = K.body.secs, L = S.length - 1; if (x <= S[0][0]) return S[0][i]; if (x >= S[L][0]) return S[L][i];
    for (let k = 0; k < L; k++) if (x <= S[k + 1][0]) return lerp(S[k][i], S[k + 1][i], (x - S[k][0]) / ((S[k + 1][0] - S[k][0]) || 1)); return S[L][i]; };
  // a flat polygon facing out (its winding turned to the side out points to)
  const face = (K, pts, col, out) => { const [a, b, c] = pts, u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const nn = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; K.face(nn[0] * out[0] + nn[1] * out[1] + nn[2] * out[2] < 0 ? pts.slice().reverse() : pts, col); };
  const weave = (a, b) => (i, j) => (i + j) % 2 ? a : b;   // (carbon: its cells in two shades, the weave catching the light)

  // ================================================================ streha: a sunroof (the user's: windows of every shape and size, not a
  // roof finish), from a small round pane to the whole roof in glass
  const GL = [0.12, 0.15, 0.19], GT = [0.05, 0.055, 0.065], GH = [0.28, 0.34, 0.42], RUB = [0.03, 0.03, 0.033], HOLE = [0.015, 0.015, 0.018];   // (glass, tinted, its sky glint; the seal; an open one's hole)
  function streha(K, n, m) {
    const k = (n - 1) % 4, cat = (n - 1) >> 2;   // (fixed glass, tilting, sliding, panoramic; four options each)
    const knots = K.body.secs.map(r => r[0]);
    // a sheet over the roof from xb (rear) to xa (front), across z0 .. z1, lift(t) over the paint (t 0 at the front, 1 at the rear): its
    // cells bend where the roof does (a section, the crown's knee), so it lies on it
    const sheet = (xa, xb, z0, z1, lift, col) => { const L = typeof lift === 'number' ? () => lift : lift;
      const X = [xa].concat(knots.filter(x => x < xa - 0.01 && x > xb + 0.01).reverse(), [xb]);
      const Z = (x) => { const kn = 0.38 * prop(K, x, 4), a = typeof z0 === 'function' ? z0(x) : z0, b = typeof z1 === 'function' ? z1(x) : z1; return [a].concat([-kn, kn].filter(z => z > a + 0.01 && z < b - 0.01), [b]); };
      const P = X.map(x => Z(x).map(z => [x, K.topY(x, z) + L((xa - x) / (xa - xb)), z]));
      for (let i = 0; i < X.length - 1; i++) { const A = P[i], B = P[i + 1]; if (A.length !== B.length) { face(K, A.concat(B.slice().reverse()), col, [0, 1, 0]); continue; }
        for (let j = 0; j < A.length - 1; j++) face(K, [A[j], B[j], B[j + 1], A[j + 1]], col, [0, 1, 0]); }
      return P; };
    // a pane: its seal round it, the glass, a glint across it; tilt: its rear edge raised (the sides closed, dark); dark: tinted
    const pane = (xm, zm, len, half, o) => { o = o || {}; const xa = xm + len / 2, xb = xm - len / 2, up = o.tilt || 0, b0 = o.lift || 0.004, lf = (t) => b0 + up * t, g = o.dark ? GT : GL;
      sheet(xa + 0.016, xb - 0.016, zm - half - 0.016, zm + half + 0.016, b0 - 0.002, o.frame || RUB);
      sheet(xa, xb, zm - half, zm + half, lf, g);
      sheet(xa - len * 0.18, xa - len * 0.3, zm - half * 0.8, zm + half * 0.8, (t) => lf(0.18 + t * 0.12) + 0.0008, o.dark ? [0.14, 0.16, 0.2] : GH);   // (the glint)
      if (up) for (const sd of [-1, 1]) { const z = zm + sd * half, y = (x) => K.topY(x, z);
        face(K, [[xa, y(xa) + 0.004, z], [xb, y(xb) + 0.004 + up, z], [xb, y(xb) + 0.002, z]], RUB, [0, 0, sd]);
        face(K, [[xb, y(xb) + 0.002, zm - half], [xb, y(xb) + 0.002, zm + half], [xb, y(xb) + 0.004 + up, zm + half], [xb, y(xb) + 0.004 + up, zm - half]], HOLE, [-1, 0, 0]); } };
    // a band of glass across the whole roof from xa back to xb, out to its edges as the roof narrows (the user's: the window in the car's
    // own shape, edge to edge; the edge beads frame it)
    const band = (xa, xb, o) => { o = o || {}; const in0 = 0.03, side = (d) => [(x) => d - prop(K, x, 4), (x) => prop(K, x, 4) - d], L = xa - xb;
      sheet(xa + 0.014, xb - 0.014, ...side(in0 - 0.012), 0.002, o.frame || RUB);
      sheet(xa, xb, ...side(in0), 0.004, o.dark ? GT : GL);
      sheet(xa - L * 0.14, xa - L * 0.22, ...side(in0 + 0.07), 0.0048, o.dark ? [0.14, 0.16, 0.2] : GH); };   // (the glint)
    // sliding: the hole in front, the glass slid back over the roof on its rails
    const slide = (xm, zm, len, half, dark) => { const xa = xm + len / 2, xb = xm - len / 2, back = len * 0.62;
      sheet(xa + 0.016, xb - 0.016, zm - half - 0.016, zm + half + 0.016, 0.002, RUB);
      sheet(xa, xb, zm - half, zm + half, 0.004, HOLE);
      pane(xm - back, zm, len, half, { dark, lift: 0.02 });
      for (const sd of [-1, 1]) { const z = zm + sd * (half + 0.008), y = (x) => K.topY(x, z); face(K, [[xa, y(xa) + 0.003, z], [xb - back, y(xb - back) + 0.003, z], [xb - back, y(xb - back) + 0.022, z], [xa - back, y(xa - back) + 0.022, z]], RUB, [0, 0, sd]); } };
    const F = m.xf, at = (len) => F - len / 2, X0 = m.x0, X1 = m.x1;   // (a window's front edge over the front seats: its middle at(len); the roof from the spoiler's leading edge to the windscreen's top)
    switch (n) {
      case 1: band(F, F - 0.2); break;
      case 2: band(F, F - 0.36); break;
      case 3: band(F, F - 0.6); break;
      case 4: band(F, F - 0.32); band(m.xr + 0.16, m.xr - 0.16); break;   // (over the front seats and over the rear bench)
      case 5: pane(at(0.34), 0, 0.34, 0.17, { tilt: 0.03 }); break;
      case 6: pane(at(0.38), 0, 0.38, 0.22, { tilt: 0.035 }); { const xa = F + 0.02, y = (z) => K.topY(xa, z);   // (the wind deflector: a black lip ahead of it)
        face(K, [[xa, y(-0.25) + 0.002, -0.25], [xa, y(0.25) + 0.002, 0.25], [xa + 0.012, y(0.25) + 0.03, 0.25], [xa + 0.012, y(-0.25) + 0.03, -0.25]], RUB, [1, 0.3, 0]); } break;
      case 7: pane(at(0.38), 0, 0.38, 0.22, { tilt: 0.035, dark: true }); break;
      case 8: pane(at(0.5), 0, 0.5, 0.32, { tilt: 0.045 }); break;
      case 9: slide(at(0.36), 0, 0.36, 0.2); break;
      case 10: slide(at(0.46), 0, 0.46, 0.3); break;
      case 11: for (const z of [-0.27, 0.27]) slide(at(0.34), z, 0.34, 0.13); break;
      case 12: slide(at(0.42), 0, 0.42, 0.26, true); break;
      case 13: case 14: band(X1 - 0.03, X0 + 0.42, { dark: n === 14 }); break;
      case 15: pane((X1 - 0.02 + X0 + 0.06) / 2, 0, X1 - 0.02 - (X0 + 0.06), 0.53); break;
      case 16: { const xm = (X1 - 0.04 + X0 + 0.25) / 2, len = X1 - 0.04 - (X0 + 0.25), CW = weave(CF, RF);   // (a carbon frame, a carbon bow across its middle)
        sheet(xm + len / 2 + 0.035, xm - len / 2 - 0.035, -0.5, 0.5, 0.0015, CW(0, 0)); sheet(xm + len / 2 + 0.035, xm - len / 2 - 0.035, -0.5, -0.47, 0.0025, CW(0, 1)); sheet(xm + len / 2 + 0.035, xm - len / 2 - 0.035, 0.47, 0.5, 0.0025, CW(0, 1));
        pane(xm, 0, len, 0.44, { frame: CF });
        sheet(xm + 0.03, xm - 0.03, -0.46, 0.46, 0.006, CW(1, 0)); break; }
    }
  }

  // ================================================================ stresna_zajemalka: scoops on the roof's front, their mouths forward
  // (the user's: sixteen that differ, with one, two or three inlets)
  function zajemalka(K, n, m) {
    const P = K.paint, W = (k, e) => (k + e) % 2 ? CF : CF2;
    // one scoop: its mouth at x0 (default the mount's), len back, h tall, w its half width; t / hh / ww its rings back (fractions);
    // rake: the mouth's top forward of its foot (m per m up); col its shell, cap its mouth; mesh, flap in the mouth; split: the mouth
    // parted into that many inlets by thin walls
    const scoop = (o) => { const z0 = o.z || 0, x0 = o.x0 != null ? o.x0 : m.x, T = o.t || [0, 0.14, 0.5, 1], H = o.hh || [1, 1, 0.82, 0.1], Wd = o.ww || [1, 1, 0.94, 0.8];
      const ring = (t, i) => { const x = x0 - t * o.len, y = K.topY(x, z0), h = o.h * H[i], w = o.w * Wd[i], cw = Math.min(0.045, w * 0.32), f = i === 0 ? (o.rake || 0) : 0;
        return [[x, y - 0.012, z0 - w], [x + f * h * 0.72, y + h * 0.72, z0 - w + 0.012], [x + f * h, y + h, z0 - w + cw], [x + f * h, y + h, z0 + w - cw], [x + f * h * 0.72, y + h * 0.72, z0 + w - 0.012], [x, y - 0.012, z0 + w]]; };
      K.skin(T.map(ring), o.col, o.cap || BLK, o.col === W ? CF : o.col);
      const y = K.topY(x0, z0), f = o.rake || 0, wc = o.col === W ? [0.3, 0.31, 0.34] : o.col === MAT || o.col === BLK ? [0.26, 0.26, 0.28] : o.col;   // (the walls lighter than the dark mouth)
      if (o.mesh) K.grille(x0 + f * o.h * 0.5 + 0.003, y + o.h * 0.48, z0, o.w * 1.7, o.h * 0.62, { slats: 3, col: DK, slatCol: [0.3, 0.3, 0.32] });
      if (o.flap) face(K, [[x0 - 0.004, y + o.h * 0.86, z0 - o.w * 0.8], [x0 - 0.004, y + o.h * 0.86, z0 + o.w * 0.8], [x0 + 0.03, y + o.h * 0.36, z0 + o.w * 0.8], [x0 + 0.03, y + o.h * 0.36, z0 - o.w * 0.8]], o.flap, [1, 0.6, 0]);
      for (let i = 1; i < (o.split || 1); i++) { const z = z0 - o.w * 0.9 + 1.8 * o.w * i / o.split;   // (the walls between the inlets)
        face(K, [[x0 + 0.004, y - 0.004, z], [x0 + 0.004 + f * o.h, y + o.h - 0.004, z], [x0 - 0.06, y + o.h - 0.004, z], [x0 - 0.06, y - 0.004, z]], wc, [0, 0, 1]);
        face(K, [[x0 + 0.004, y - 0.004, z + 0.012], [x0 + 0.004 + f * o.h, y + o.h - 0.004, z + 0.012], [x0 - 0.06, y + o.h - 0.004, z + 0.012], [x0 - 0.06, y - 0.004, z + 0.012]], wc, [0, 0, -1]);
        face(K, [[x0 + 0.005, y - 0.004, z], [x0 + 0.005, y - 0.004, z + 0.012], [x0 + 0.005 + f * o.h, y + o.h - 0.004, z + 0.012], [x0 + 0.005 + f * o.h, y + o.h - 0.004, z]], wc, [1, 0, 0]); } };
    const LONG = { t: [0, 0.07, 0.3, 0.6, 1], hh: [1, 1, 0.8, 0.42, 0.02], ww: [1, 1, 1.02, 0.92, 0.6] };   // (sculpted: a long fairing into the roof)
    switch (n) {
      case 1: scoop({ len: 0.34, h: 0.03, w: 0.17, col: MAT, cap: DK, ww: [1, 1, 0.9, 0.75] }); break;                                       // (stick-on: a low black wedge)
      case 2: for (const z of [-0.12, 0.12]) scoop({ z, len: 0.24, h: 0.03, w: 0.075, col: P, cap: DK }); break;                              // (two small ones, body colour)
      case 3: scoop({ len: 0.42, h: 0.04, w: 0.1, col: W, cap: DK, t: [0, 0.12, 0.55, 1], hh: [1, 1, 0.75, 0.15], ww: [1, 1, 0.7, 0.18] }); break;   // (a carbon-look teardrop)
      case 4: scoop({ len: 0.3, h: 0.032, w: 0.22, col: MAT, cap: DK, mesh: true, split: 3 }); break;                                         // (three slots behind a mesh)
      case 5: scoop({ len: 0.38, h: 0.055, w: 0.15, col: P }); break;                                                                         // (the classic one)
      case 6: scoop({ len: 0.32, h: 0.1, w: 0.085, col: BLK, rake: 0.45, t: [0, 0.2, 0.55, 1], hh: [1, 1, 0.8, 0.3], ww: [1, 1, 0.95, 0.85] }); break;   // (a rally snorkel: tall, narrow, raked)
      case 7: scoop({ len: 0.42, h: 0.07, w: 0.19, col: P, rake: 0.3, flap: K.shade(P, 0.7) }); break;                                        // (its flap open in the mouth)
      case 8: scoop({ len: 0.44, h: 0.065, w: 0.2, col: P, rake: 0.35, mesh: true, split: 2 }); break;                                        // (a twin mouth behind a mesh)
      case 9: scoop({ len: 0.5, h: 0.035, w: 0.23, col: W, rake: 0.7, ww: [1, 1, 0.85, 0.5] }); break;                                       // (low and wide, its lip sharp)
      case 10: scoop({ len: 0.4, h: 0.075, w: 0.14, col: W, rake: 0.4, split: 2 }); break;                                                    // (tall, its mouth split)
      case 11: for (const z of [-0.36, 0.36]) scoop({ z, len: 0.36, h: 0.05, w: 0.075, col: W, rake: 0.3 }); break;                          // (two, out by the roof's edges)
      case 12: scoop({ len: 0.46, h: 0.05, w: 0.27, col: W, rake: 0.5, split: 3, ww: [1, 1, 0.9, 0.6] }); break;                              // (three inlets)
      case 13: scoop({ len: 0.55, h: 0.12, w: 0.17, col: P, rake: 0.2, t: [0, 0.12, 0.45, 0.8, 1], hh: [1, 1, 0.85, 0.45, 0.06], ww: [1, 1, 0.95, 0.85, 0.75] });
        for (const sd of [-1, 1]) K.endplate([[m.x - 0.05, K.topY(m.x, 0) + 0.12], [m.x - 0.45, K.topY(m.x, 0) + 0.03], [m.x - 0.45, K.topY(m.x, 0) - 0.004], [m.x - 0.05, K.topY(m.x, 0) - 0.004]], sd * 0.175, 0.008, P); break;   // (big, for the engine; fins along its sides)
      case 14: scoop(Object.assign({ len: 0.95, h: 0.07, w: 0.21, col: P, rake: 0.25 }, LONG)); break;
      case 15: scoop(Object.assign({ len: 0.95, h: 0.07, w: 0.24, col: P, rake: 0.25, mesh: true, split: 2 }, LONG)); break;
      case 16: scoop(Object.assign({ len: 1.0, h: 0.075, w: 0.26, col: W, rake: 0.3, split: 3 }, LONG)); break;
    }
  }

  // ================================================================ antena: rods, fins, a puck, a whip (the user's: sixteen that differ in
  // shape, length, place and colour)
  function antena(K, n, m) {
    const P = K.paint, W = (k, e) => (k + e) % 2 ? CF : CF2;
    // a rod from its foot at (x, z), len long, raked back a degrees, r thick (r2 at its tip); base: its foot's colour; tip: a ball on it
    const rod = (x, z, len, a, r, r2, col, base, tip) => { const y = K.topY(x, z), ca = Math.cos(a * Math.PI / 180), sa = Math.sin(a * Math.PI / 180);
      K.cyl([x, y - 0.004, z], [x, y + 0.02, z], 0.018, base, { n: 8, r2: 0.012, capA: null, capB: base });
      const b = [x - sa * len, y + 0.02 + ca * len, z]; K.bar([x, y + 0.02, z], b, r, col, { n: K.hi ? 6 : 4, r2 });
      if (tip) K.cyl([b[0] + sa * 0.008, b[1] - ca * 0.008, z], [b[0] - sa * 0.012, b[1] + ca * 0.012, z], 0.007, tip, { n: 6, capB: tip }); };
    // a shark fin, its rear end at (xr, z): len long, h tall, w its half width; rings from the nose back, its rear face raked; sharp: a
    // blade (a thin ridge)
    const fin = (xr, z, len, h, w, col, o) => { o = o || {}; const T = [0, 0.25, 0.55, 0.82, 1], H = [0.06, 0.48, 0.83, 1, 0.82], Wd = [0.25, 0.75, 1, 0.92, 0.7], ridge = o.sharp ? 0.05 : 0.22;
      const rings = T.map((t, i) => { const x = xr + (1 - t) * len, y = K.topY(x, z) - 0.003, hh = h * H[i], ww = w * Wd[i], back = i === T.length - 1 ? 0.35 * hh : 0;
        return [[x, y, z - ww], [x + back * 0.4, y + hh * 0.62, z - ww * 0.82], [x + back, y + hh, z - ww * ridge], [x + back, y + hh, z + ww * ridge], [x + back * 0.4, y + hh * 0.62, z + ww * 0.82], [x, y, z + ww]]; });
      K.skin(rings, col, col === W ? CF : col, col === W ? CF : o.cap || col);
      if (o.base) { const x0 = xr - 0.01, x1 = xr + len + 0.012, y = (x) => K.topY(x, z) + 0.002;   // (a pad under it)
        face(K, [[x0, y(x0), z - w - 0.008], [x1, y(x1), z - w * 0.3], [x1, y(x1), z + w * 0.3], [x0, y(x0), z + w + 0.008]], o.base, [0, 1, 0]); } };
    // a round puck (a GPS aerial): a low drum, its top domed
    const puck = (x, z, r, h, col) => { const y = K.topY(x, z), q = DELI.seg(K, 12);
      K.cyl([x, y - 0.003, z], [x, y + h * 0.6, z], r, col, { n: q, r2: r * 0.92, capA: null, capB: null });
      K.cyl([x, y + h * 0.6, z], [x, y + h, z], r * 0.92, col, { n: q, r2: r * 0.55, capA: null, capB: col }); };
    const [FX, FZ] = m.fin, F = m.front || [0.02, 0.44];
    switch (n) {
      case 1: rod(m.x, m.z, 0.4, 72, 0.0065, 0.0045, BLK, BLK); break;                                        // (rubber: thick, black, raked back)
      case 2: rod(F[0], F[1], 0.11, 20, 0.006, 0.005, BLK, K.chrome, K.chrome); break;                       // (short, at the roof's front right, a chrome tip)
      case 3: rod(FX + 0.05, FZ, 0.16, 50, 0.007, 0.006, CF2, CF); break;                                    // (short, carbon, on the roof's rear middle)
      case 4: rod(-0.6, F[1], 0.62, 80, 0.0028, 0.002, [0.55, 0.56, 0.6], BLK, RED); break;                 // (racing: a thin steel whip mid-roof on the right, its red tip)
      case 5: fin(FX, FZ, 0.17, 0.058, 0.032, BLK); break;                                                   // (the classic fin)
      case 6: fin(FX + 0.02, FZ, 0.13, 0.042, 0.03, P); break;                                               // (small, in the body's colour)
      case 7: fin(FX, FZ, 0.15, 0.075, 0.022, K.chrome, { sharp: true }); break;                             // (tall and slim, chrome)
      case 8: fin(FX, FZ, 0.2, 0.035, 0.06, W); break;                                                       // (low and wide, carbon look)
      case 9: fin(FX, FZ, 0.18, 0.06, 0.034, BLK, { base: DK }); rod(FX + 0.02, FZ, 0.12, 60, 0.0025, 0.002, BLK, BLK); break;   // (a fin and a short whip behind it)
      case 10: fin(FX, FZ, 0.12, 0.05, 0.03, [0.2, 0.21, 0.23]); fin(FX + 0.16, FZ, 0.1, 0.04, 0.026, [0.2, 0.21, 0.23]); break;   // (two in a row, dark grey)
      case 11: fin(FX, FZ, 0.3, 0.06, 0.034, W, { base: DK }); break;                                        // (long, carbon)
      case 12: puck(FX + 0.12, FZ, 0.055, 0.03, [0.13, 0.13, 0.14]); break;                                 // (GPS: a round puck)
      case 13: case 14: { const c = n === 13 ? DK : P; fin(FX, FZ, 0.24, 0.062, 0.03, c); puck(FX + 0.36, FZ, 0.045, 0.024, c); break; }   // (factory: a long fin, the phone's puck ahead of it)
      case 15: fin(FX, FZ, 0.2, 0.095, 0.028, W, { sharp: true, base: CF }); break;                          // (dry carbon: a tall blade)
      case 16: { const x = FX + 0.1, z = FZ, y = K.topY(x, z);                                               // (team radio: a whip on a sprung base, raked back)
        K.cyl([x, y - 0.004, z], [x, y + 0.012, z], 0.03, DK, { n: 8, capA: null, capB: DK });
        K.cyl([x, y + 0.012, z], [x - 0.012, y + 0.07, z], 0.011, [0.3, 0.3, 0.32], { n: 6, capB: BLK });
        K.bar([x - 0.012, y + 0.07, z], [x - 0.5, y + 0.14, z], 0.003, BLK, { n: 4, r2: 0.002 }); break; }
    }
  }

  // ================================================================ zaluzije: louvres over the rear window
  function zaluzije(K, n, m) {
    const P = K.paint, k = (n - 1) % 4, cat = (n - 1) >> 2;
    const dx = m.x1 - m.x0, dy = m.y1 - m.y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, ox = -uy, oy = ux;   // (u up the glass, o out of it)
    const at = (s, d, z) => [m.x0 + ux * s + ox * d, m.y0 + uy * s + oy * d, z];   // (s up the glass from its foot, d out of it)
    const plastic = [MAT, null, P, K.strp], metal = [AL, P, K.chrome, ANO];
    const ns = n === 15 ? 12 : cat >= 2 ? 9 : 8, s0 = 0.045, s1 = L - 0.06, W = m.w - 0.035, chord = n === 15 ? 0.032 : 0.048, th = 0.006;
    const slatCol = (i) => cat === 0 ? (k === 1 ? (i % 2 ? CF : CF2) : plastic[k]) : cat === 1 ? metal[k] : n === 10 || n === 14 ? (i % 2 ? CF : CFG) : n === 11 ? CFM : (i % 2 ? CF : CF2);
    const frame = cat === 1 && k === 1 ? AL : cat === 0 ? (k === 1 ? CF : MAT) : cat === 1 ? metal[k] : CF;
    // the slats: blades across, each from the glass (2 cm off it) out and down (the rain off, the sun off from above)
    for (let i = 0; i < ns; i++) { const s = lerp(s0, s1, ns === 1 ? 0 : i / (ns - 1)), c = slatCol(i);
      const a = at(s, 0.02, 0), b = at(s - chord * 0.42, 0.02 + chord * 0.9, 0), q = (p, z, dd) => [p[0] + (dd || 0) * ox, p[1] + (dd || 0) * oy - (dd ? 0 : 0), z];
      face(K, [q(a, -W), q(a, W), q(b, W), q(b, -W)], c, [-uy * 0.4 + ox, 1, 0]);                                    // (its top)
      face(K, [q(b, -W), q(b, W), [b[0] - ux * th, b[1] - uy * th, W], [b[0] - ux * th, b[1] - uy * th, -W]], c, [ox, oy, 0]);   // (its edge)
      if (K.hi) face(K, [[a[0] - ux * th, a[1] - uy * th, -W], [a[0] - ux * th, a[1] - uy * th, W], [b[0] - ux * th, b[1] - uy * th, W], [b[0] - ux * th, b[1] - uy * th, -W]], c, [0, -1, 0]); }
    // the frame: a rail up each side, a bar across the top and the foot
    for (const sd of [-1, 1]) K.bar(at(s0 - 0.03, 0.02, sd * (W + 0.008)), at(s1 + 0.02, 0.02, sd * (W + 0.008)), 0.011, frame, { n: 4 });
    for (const s of [s0 - 0.03, s1 + 0.02]) K.bar(at(s, 0.02, -W - 0.008), at(s, 0.02, W + 0.008), 0.009, frame, { n: 4 });
    if (cat >= 2 && k >= 2) K.bar(at(s0 - 0.03, 0.035, 0), at(s1 + 0.02, 0.035, 0), 0.008, frame, { n: 4 });   // (the dearer carbon ones: a spine up the middle)
    if (n === 12 || n === 16) {   // (with the spoiler: a blade along the top, kicked up and back out under the roof's)
      const a = at(s1 + 0.01, 0.025, 0), b = at(s1 + 0.09, n === 16 ? 0.13 : 0.11, 0), c = n === 16 ? CF2 : RF, Z = W + 0.012, e = [b[0] - ux * 0.012, b[1] - uy * 0.012];
      face(K, [[a[0], a[1], -Z], [a[0], a[1], Z], [b[0], b[1], Z], [b[0], b[1], -Z]], c, [-0.6, 1, 0]);                 // (its top)
      face(K, [[b[0], b[1], -Z], [b[0], b[1], Z], [e[0], e[1], Z], [e[0], e[1], -Z]], CF, [ox, oy, 0]);                 // (its trailing edge)
      face(K, [[a[0] - ux * 0.012, a[1] - uy * 0.012, -Z], [a[0] - ux * 0.012, a[1] - uy * 0.012, Z], [e[0], e[1], Z], [e[0], e[1], -Z]], DK, [0, -1, 0]);   // (under it)
      for (const sd of [-1, 1]) face(K, [[a[0], a[1], sd * Z], [b[0], b[1], sd * Z], [e[0], e[1], sd * Z], [a[0] - ux * 0.04, a[1] - uy * 0.04, sd * Z]], CF, [0, 0, sd]); }
  }

  DELI.add('streha', streha);
  DELI.add('stresna_zajemalka', zajemalka);
  DELI.add('antena', antena);
  DELI.add('zaluzije', zaluzije);
})();
