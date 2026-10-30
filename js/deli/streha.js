/* Deli iz garaže, sklop 2 · streha: streha, stresna_zajemalka, antena, zaluzije. Each element registers its 16 options with DELI.add(id,
   build(K, n, m, M)) (js/deli.js; the contract: docs/deli.md). Loaded after js/deli.js, before the cars.
     streha             m: { x0, x1 (the roof from its rear end to its front, look units), bead: [x ...] (the roof's edge mouldings: the
                        painted roofs cover them too) }: a wrap, paint or a carbon skin laid over the roof (the stock: nothing, the body's)
     stresna_zajemalka  m: { x (the mouth, at the roof's front), z }: a scoop on the roof, its mouth forward (the stock: none)
     antena             m: { x, z (the rod's foot: the stock aerial's), fin: [x, z] (a shark fin's rear end) } in the aerial's part
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

  // ================================================================ streha: the roof wrapped, painted or skinned in carbon
  function streha(K, n, m) {
    const k = (n - 1) % 4, cat = (n - 1) >> 2;   // (the categories: wrap, paint, carbon skin, carbon roof; four options each)
    const sx = [m.x0].concat(K.body.secs.map(r => r[0]).filter(x => x > m.x0 + 0.02 && x < m.x1 - 0.02), [m.x1]);   // (the sections in it: the panel bends there)
    const xs = (nx) => { const out = []; for (let i = 0; i < sx.length - 1; i++) { const q = Math.max(1, Math.round(nx * (sx[i + 1] - sx[i]) / (m.x1 - m.x0)));
      for (let j = 0; j < q; j++) out.push(lerp(sx[i], sx[i + 1], j / q)); } out.push(m.x1); return out; };
    // the panel: cells over the roof from x0 to x1, across to inset off the roof's edge (at the crown's knee too: it lies flat on the
    // roof), lift over the paint; col(i, j) the cell's colour; bump(t, z) raised (t 0 .. 1 from the rear end)
    const panel = (o) => { const X = xs(o.nx || 1), sub = o.sub || 1;
      const zs = (x) => { const wt = prop(K, x, 4), W = wt - o.inset, kn = 0.38 * wt, mid = []; for (let j = 0; j <= 2 * sub; j++) mid.push(lerp(-kn, kn, j / (2 * sub)));
        const e = o.edge || 1, L = [], R = []; for (let j = 0; j < e; j++) { L.push(lerp(-W, -kn, j / e)); R.unshift(lerp(W, kn, j / e)); } return L.concat(mid, R); };
      const P = X.map(x => zs(x).map(z => [x, K.topY(x, z) + o.lift + (o.bump ? o.bump((x - m.x0) / (m.x1 - m.x0), z) : 0), z]));
      for (let i = 0; i < X.length - 1; i++) for (let j = 0; j < P[i].length - 1; j++) face(K, [P[i][j], P[i + 1][j], P[i + 1][j + 1], P[i][j + 1]], o.col(i, j), [0, 1, 0]);
      return P; };
    const P = K.paint, plain = (c) => () => c, L = DELI.roofLook(K, n);
    // the edge mouldings in the finish too (the user's: the whole roof, the spoiler with it), a carbon skin's left in the paint round it
    const beads = () => { if (m.bead) for (const sd of [-1, 1]) { const path = m.bead.map(x => [x, prop(K, x, 5) - 0.004, sd * (prop(K, x, 4) - 0.004)]), c = L.col(0, 1);
      K.sweep([[0.008, -0.026], [0.026, -0.005], [0.019, 0.019], [-0.005, 0.028], [-0.024, 0.005]].map(([u, v]) => [u * sd, v]), path, (k2, e) => L.col(k2, e), { capA: c, capB: c }); } };
    if (cat === 0) { panel({ inset: 0.014, lift: 0.004, col: k === 3 ? weave([0.1, 0.1, 0.11], [0.135, 0.135, 0.145]) : plain([MAT, WHT, WRAP][k]), nx: k === 3 ? 10 : 1, sub: k === 3 ? 2 : 1, edge: k === 3 ? 2 : 1 }); beads(); }
    else if (cat === 1) { panel({ inset: 0.014, lift: 0.003, col: plain([DK, WHP, LAK, GM][k]) }); beads(); }
    else if (cat === 2) {   // (a carbon skin: a panel inset off the edges, the paint round it; gloss, matt, with a lip along its sides)
      const sh = [[CF, RF], [CF, RFG], [CFM, RFM], [CF, RF]][k], Pn = panel({ inset: 0.07, lift: 0.006, col: weave(sh[0], sh[1]), nx: 9, sub: 2, edge: 1 });
      // its rim: the panel's thin edge all round, dark
      const rim = (pts, out) => { for (let j = 0; j < pts.length - 1; j++) { const a = pts[j], b = pts[j + 1]; face(K, [a, b, [b[0], b[1] - 0.006, b[2]], [a[0], a[1] - 0.006, a[2]]], DK, out); } };
      rim(Pn.map(r => r[0]), [0, 0, -1]); rim(Pn.map(r => r[r.length - 1]), [0, 0, 1]);
      if (k === 3) for (const sd of [-1, 1]) {   // (the lip: a carbon fence along each side of the skin)
        const r = Pn.map(q => q[sd < 0 ? 0 : q.length - 1]), ends = [0, Math.floor(r.length / 2), r.length - 1].map(i => r[i]);
        for (let j = 0; j < ends.length - 1; j++) { const a = ends[j], b = ends[j + 1], up = (p, h, dz) => [p[0], p[1] + h, p[2] + dz];
          face(K, [a, b, up(b, 0.02, sd * 0.004), up(a, 0.02, sd * 0.004)], CF2, [0, 0, -sd]);
          face(K, [up(a, 0.02, sd * 0.004), up(b, 0.02, sd * 0.004), up(b, 0.02, sd * 0.016), up(a, 0.02, sd * 0.016)], CF, [0, 1, 0]);
          face(K, [up(a, 0.02, sd * 0.016), up(b, 0.02, sd * 0.016), up(b, -0.004, sd * 0.016), up(a, -0.004, sd * 0.016)], CF, [0, 0, sd]); } }
    } else {   // (a carbon roof: the whole roof to its edges; painted (its edges carbon); the factory's and the dry one with a double bubble)
      // (the bubbles over the seats, either side of the start number: on the crown's slopes)
      const bubble = k >= 2 ? (t, z) => { const s = Math.sin(Math.PI * Math.min(1, Math.max(0, t))) ** 0.6, d = (Math.abs(z) - 0.365) / 0.135; return 0.022 * s * Math.max(0, 1 - d * d * d * d); } : null;
      const sh = k === 3 ? [[0.065, 0.067, 0.073], [0.12, 0.124, 0.136]] : [CF, RF], W = weave(sh[0], sh[1]), e = k >= 2 ? 4 : 2, s = 2;
      panel({ inset: 0.012, lift: 0.005, col: k === 1 ? (i, j) => (j < e || j >= e + 2 * s ? W(i, j) : P) : W, nx: k === 3 ? 10 : 8, sub: s, edge: e, bump: bubble }); beads();
    }
  }

  // ================================================================ stresna_zajemalka: a scoop on the roof's front, its mouth forward
  function zajemalka(K, n, m) {
    const P = K.paint, W = (k, e) => (k + e) % 2 ? CF : CF2;
    // one scoop: its mouth at x, len back, h tall, w its half width; t / hh / ww its rings back (fractions); rake: the mouth's top forward
    // of its foot (m per m up); col its shell, cap its mouth; mesh, flap in the mouth
    const scoop = (o) => { const z0 = o.z, T = o.t || [0, 0.14, 0.5, 1], H = o.hh || [1, 1, 0.82, 0.1], Wd = o.ww || [1, 1, 0.94, 0.8];
      const ring = (t, i) => { const x = m.x - t * o.len, y = K.topY(x, z0), h = o.h * H[i], w = o.w * Wd[i], cw = Math.min(0.045, w * 0.32), f = i === 0 ? (o.rake || 0) : 0;
        return [[x, y - 0.012, z0 - w], [x + f * h * 0.72, y + h * 0.72, z0 - w + 0.012], [x + f * h, y + h, z0 - w + cw], [x + f * h, y + h, z0 + w - cw], [x + f * h * 0.72, y + h * 0.72, z0 + w - 0.012], [x, y - 0.012, z0 + w]]; };
      K.skin(T.map(ring), o.col, o.cap || BLK, o.col === W ? CF : o.col);
      const x = m.x, y = K.topY(x, z0), f = o.rake || 0;
      if (o.mesh) K.grille(x + f * o.h * 0.5 + 0.003, y + o.h * 0.48, z0, o.w * 1.7, o.h * 0.62, { slats: 3, col: DK, slatCol: [0.3, 0.3, 0.32] });
      if (o.flap) face(K, [[x - 0.004, y + o.h * 0.86, z0 - o.w * 0.8], [x - 0.004, y + o.h * 0.86, z0 + o.w * 0.8], [x + 0.03, y + o.h * 0.36, z0 + o.w * 0.8], [x + 0.03, y + o.h * 0.36, z0 - o.w * 0.8]], o.flap, [1, 0.6, 0]);
    };
    const z = m.z || 0, c = (n - 1) % 4;
    if (n <= 4) scoop({ z, len: 0.3, h: 0.034, w: 0.13, col: [MAT, P, W, MAT][c], cap: DK, mesh: c === 3 });   // (stick-on: low, its mouth closed: dark)
    else if (n <= 8) scoop({ z, len: n === 5 ? 0.38 : 0.42, h: n === 5 ? 0.055 : 0.07, w: 0.15, col: P, rake: n === 5 ? 0 : 0.35, mesh: n === 8, flap: n === 7 ? K.shade(P, 0.7) : null,
      ww: n === 5 ? null : [1, 1, 0.9, 0.7] });
    else if (n <= 12) { if (n === 11) for (const sd of [-1, 1]) scoop({ z: z + sd * 0.1, len: 0.36, h: 0.06, w: 0.075, col: W, rake: 0.3 });
      else scoop({ z, len: n === 12 ? 0.46 : 0.42, h: n === 12 ? 0.045 : n === 10 ? 0.07 : 0.055, w: n === 12 ? 0.19 : 0.15, col: W, rake: n === 10 ? 0.35 : n === 12 ? 0.6 : 0,
        ww: n === 12 ? [1, 1, 0.85, 0.55] : null }); }
    else if (n === 13) scoop({ z, len: 0.5, h: 0.11, w: 0.17, col: P, rake: 0.2, t: [0, 0.12, 0.45, 0.8, 1], hh: [1, 1, 0.85, 0.45, 0.06], ww: [1, 1, 0.95, 0.85, 0.75] });
    else scoop({ z, len: 0.95, h: 0.07, w: 0.21, col: n === 16 ? W : P, rake: 0.25, mesh: n === 15, t: [0, 0.07, 0.3, 0.6, 1], hh: [1, 1, 0.8, 0.42, 0.02], ww: [1, 1, 1.02, 0.92, 0.6] });
  }

  // ================================================================ antena: a rod where the stock one stands, or a shark fin on the roof's rear middle
  function antena(K, n, m) {
    const P = K.paint, W = (k, e) => (k + e) % 2 ? CF : CF2;
    // a rod from its foot (the stock aerial's) len long, raked back a degrees, r thick (r2 at its tip); base: its foot's colour
    const rod = (len, a, r, r2, col, base, tip) => { const x = m.x, z = m.z, y = K.topY(x, z), ca = Math.cos(a * Math.PI / 180), sa = Math.sin(a * Math.PI / 180);
      K.cyl([x, y - 0.004, z], [x, y + 0.02, z], 0.018, base, { n: 8, r2: 0.012, capA: null, capB: base });
      const b = [x - sa * len, y + 0.02 + ca * len, z]; K.bar([x, y + 0.02, z], b, r, col, { n: K.hi ? 6 : 4, r2 });
      if (tip) K.cyl([b[0] + sa * 0.008, b[1] - ca * 0.008, z], [b[0] - sa * 0.012, b[1] + ca * 0.012, z], 0.006, tip, { n: 6, capB: tip }); };
    // a shark fin, its rear end at mount fin: len long, h tall, w its half width; rings from the nose back, its rear face raked
    const fin = (len, h, w, col, o) => { o = o || {}; const [xr, z] = m.fin, T = [0, 0.25, 0.55, 0.82, 1], H = [0.06, 0.48, 0.83, 1, 0.82], Wd = [0.25, 0.75, 1, 0.92, 0.7];
      const rings = T.map((t, i) => { const x = xr + (1 - t) * len, y = K.topY(x, z) - 0.003, hh = h * H[i], ww = w * Wd[i], back = i === T.length - 1 ? 0.35 * hh : 0;
        return [[x, y, z - ww], [x + back * 0.4, y + hh * 0.62, z - ww * 0.82], [x + back, y + hh, z - ww * 0.22], [x + back, y + hh, z + ww * 0.22], [x + back * 0.4, y + hh * 0.62, z + ww * 0.82], [x, y, z + ww]]; });
      K.skin(rings, col, col === W ? CF : col, col === W ? CF : o.cap || col);
      if (o.base) { const x0 = xr - 0.01, x1 = xr + len + 0.012, y = (x) => K.topY(x, z) + 0.002;   // (a pad under it)
        face(K, [[x0, y(x0), z - w - 0.008], [x1, y(x1), z - w * 0.3], [x1, y(x1), z + w * 0.3], [x0, y(x0), z + w + 0.008]], o.base, [0, 1, 0]); }
    };
    switch (n) {
      case 1: rod(0.4, 76, 0.0065, 0.0045, BLK, BLK); break;                              // (rubber: thick, black, raked back)
      case 2: rod(0.14, 40, 0.006, 0.005, BLK, BLK); break;                                // (short)
      case 3: rod(0.14, 40, 0.0065, 0.0055, CF2, CF); break;                               // (short, carbon)
      case 4: rod(0.62, 80, 0.0028, 0.002, [0.55, 0.56, 0.6], BLK, RED); break;            // (racing: a thin steel whip, its red tip)
      case 5: fin(0.17, 0.058, 0.032, BLK); break;
      case 6: fin(0.17, 0.058, 0.032, P); break;
      case 7: fin(0.17, 0.058, 0.032, K.chrome); break;
      case 8: fin(0.17, 0.058, 0.032, W); break;
      case 9: fin(0.19, 0.064, 0.034, BLK, { base: DK }); break;                           // (with the radio: a little bigger, on a pad)
      case 10: fin(0.19, 0.064, 0.034, [0.2, 0.21, 0.23], { base: DK }); break;          // (digital: dark grey)
      case 11: fin(0.19, 0.064, 0.034, W, { base: DK }); break;
      case 12: fin(0.2, 0.052, 0.052, [0.13, 0.13, 0.14], { base: DK }); break;            // (GPS: wide and low)
      case 13: fin(0.23, 0.06, 0.03, DK); break;                                           // (factory: long and low)
      case 14: fin(0.23, 0.06, 0.03, P); break;
      case 15: fin(0.23, 0.06, 0.03, W); break;
      case 16: { const [x, z] = [m.fin[0] + 0.1, m.fin[1]], y = K.topY(x, z);              // (team radio: a whip on a sprung base, raked back)
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

  // the roof's finish on the car's own roof spoiler (the user's: a roof fitted covers the stock spoiler with it): col(k, e) its facets'
  // colour (k across, e round its profile), dark its trailing face's (kolibri.js: K.deli('streha') returns the option, the stock
  // spoiler drawn in it)
  DELI.roofLook = (K, n) => { const k = (n - 1) % 4, cat = (n - 1) >> 2, P = K.paint, W = (a, b) => (i, e) => (i + e) % 2 ? a : b, one = (c) => () => c;
    const col = cat === 0 ? (k === 3 ? W([0.1, 0.1, 0.11], [0.135, 0.135, 0.145]) : one([MAT, WHT, WRAP][k])) : cat === 1 ? one([DK, WHP, LAK, GM][k])
      : cat === 2 ? W(...[[CF, RF], [CF, RFG], [CFM, RFM], [CF, RF]][k]) : k === 1 ? one(P) : k === 3 ? W([0.065, 0.067, 0.073], [0.12, 0.124, 0.136]) : W(CF, RF);
    const c0 = col(0, 0); return { col, dark: c0 === P ? K.shade(P, 0.5) : c0.map(v => v * 0.5) }; };

  DELI.add('streha', streha);
  DELI.add('stresna_zajemalka', zajemalka);
  DELI.add('antena', antena);
  DELI.add('zaluzije', zaluzije);
})();
