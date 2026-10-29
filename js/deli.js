/* The parts a player buys and fits in the garage (the list: js/data/deli.js, DELI_DATA: 40 elements, 16 options each, 1 the cheapest ..
   16 the dearest). A car's fitted parts: car.deli = { <element id>: <option 1..16> } (an element not in it is the stock one, the car drawn
   exactly as without parts); where a part goes on a vehicle: its def's mounts (js/cars/<id>.js, in the vehicle's units: look units). A
   vehicle without a mount for an element never draws that element's options (the garage does not offer it).
     DELI.build(K, id, n, m, M)  option n of element id drawn by the kit (render.js: K.deli(id, stock) calls it instead of the stock part, in
                                 the stock part's own part ids: it breaks, falls off and dents as the stock one does)
     DELI.wheel(n)               the rims: the wheels' look (look.wheels) of option n, its face drawn by face(h) (render.js: kitWheelGeo)
     DELI.mesh(id, n, M, color)  that part alone (a THREE.Group) where it sits on vehicle M, without the rest of the car (the garage's preview
                                 on the car and its menu's pictures; render.js: Render.deliMesh)
     DELI.effect(id, n)          what it changes, in numbers (from its kaj_nudi): { kg, power, grip, kmh, brake, lower (m; higher: < 0), tint,
                                 tyre: { dry, wet, snow, gravel } } (power, grip, brake: fractions, +0.06 for +6 %); core.js: Car (opts.deli)
                                 applies them (Core.applyDeli)
     DELI.lampLook(n)            head lamp option n's lens and ring colours (a car keeping its own lamp housing colours it after them)
     DELI.option(id, n), DELI.element(id), DELI.has(id), DELI.clean(deli, M), DELI.key(deli, M)
     DELI.add(id, build)         an element's options drawn by a file of its own (js/deli/<group>.js, loaded after this one): build(K, n, m, M)
                                 as DELI.build calls it; DELI.seg(K, k) the segments of a round shape (Normalni 60 %, at least 6)
   Only the fitted option is drawn (never all 16); every option is simple: a few primitives in the body's one material, as the stock parts.
   docs/deli.md: the contract with the garage (garaza.html) */
var DELI = (function () {
  'use strict';
  const DATA = typeof DELI_DATA !== 'undefined' ? DELI_DATA : { elementi: [] }, EL = {};
  for (const e of DATA.elementi) EL[e.id] = e;
  const element = (id) => EL[id] || null;
  const option = (id, n) => { const e = EL[id]; if (!e || !e.kategorije) return null; let k = 0; for (const c of e.kategorije) for (const o of c.moznosti) if (++k === n) return o; return null; };
  const CF = [0.075, 0.078, 0.085], CF2 = [0.11, 0.115, 0.125], AL = [0.74, 0.76, 0.8], AL2 = [0.58, 0.6, 0.64], DK = [0.09, 0.09, 0.1], RED = [0.78, 0.09, 0.07];
  const rad = (d) => d * Math.PI / 180;
  // ---- shapes in a plane of their own (u, v) ----
  const ellipse = (cu, cv, ru, rv, n, a0) => Array.from({ length: n }, (_, i) => { const a = (a0 || 0) + i / n * Math.PI * 2; return [cu + Math.cos(a) * ru, cv + Math.sin(a) * rv]; });
  const rrect = (cu, cv, w, h, r, k) => { const P = [], q = k || 3; for (const [sx, sy, a0] of [[1, 1, 0], [-1, 1, 90], [-1, -1, 180], [1, -1, 270]]) {
    const ox = cu + sx * (w / 2 - r), oy = cv + sy * (h / 2 - r); for (let i = 0; i <= q; i++) { const a = rad(a0 + 90 * i / q); P.push([ox + Math.cos(a) * r, oy + Math.sin(a) * r]); } } return P; };
  const chamf = (pts, c) => { const out = [], n = pts.length; for (let i = 0; i < n; i++) { const a = pts[(i + n - 1) % n], b = pts[i], d = pts[(i + 1) % n];
    const t = (p, q) => { const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, k = Math.min(c, l / 3) / l; return [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]; };
    out.push(t(b, a), t(b, d)); } return out; };   // (the polygon's corners cut by c)
  const hull = (pts) => { const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1)); };   // (the convex hull, counter-clockwise)

  // ================================================================ krilo: the rear spoiler or wing, in place of the stock one
  // m: { x: the roof's rear edge, w: the roof's half width there, part: the spoiler's part id, s: its size (1: KOLIBRI's; chords,
  // heights, thicknesses), top: [[x, y] ...] the top it stands on along x, flat across (a truck's roof deflector; default: the roof, K.topY) }
  function krilo(K, n, m) {
    const P = K.paint, X0 = m.x, W = m.w, k = m.s || 1, kz = W / 0.565, X = (a) => X0 + a * k, Yo = (b) => Y0 + b * k;   // (k: sizes along and up, kz: across)
    const TOP = m.top, RY = (x, z) => { if (!TOP) return K.topY(x, z || 0); if (x <= TOP[0][0]) return TOP[0][1]; for (let i = 1; i < TOP.length; i++) if (x <= TOP[i][0]) { const a = TOP[i - 1], b = TOP[i]; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } return TOP[TOP.length - 1][1]; };
    const Y0 = RY(X(0.04), 0);
    // an inverted airfoil (downforce): its leading edge (xl, yl), the chord c back (towards -x), its trailing edge a degrees up, t thick
    const foil = (xl, yl, c, a, t) => { const ca = Math.cos(rad(a)), sa = Math.sin(rad(a)), at = (s, nn) => [xl - ca * c * s + sa * nn * t, yl + sa * c * s + ca * nn * t];
      return [at(0, 0), at(0.06, 0.42), at(0.3, 0.55), at(0.65, 0.38), at(1, 0.06), at(1, -0.06), at(0.7, -0.55), at(0.35, -0.95), at(0.08, -0.72)]; };
    const lowerAt = (f, x) => { const lw = [f[5], f[6], f[7], f[8], f[0]]; for (let i = 0; i < lw.length - 1; i++) { const a = lw[i], b = lw[i + 1];
      if ((x - a[0]) * (x - b[0]) <= 0) return a[1] + (b[1] - a[1]) * (x - a[0]) / ((b[0] - a[0]) || 1); } return x > f[0][0] ? f[0][1] : f[5][1]; };
    const scaleAbout = (f, k) => { const c = f.reduce((a, q) => [a[0] + q[0] / f.length, a[1] + q[1] / f.length], [0, 0]); return f.map(q => [c[0] + (q[0] - c[0]) * k, c[1] + (q[1] - c[1]) * k]); };
    const weave = (col) => col === CF ? (k, e) => (e % 2 ? CF : CF2) : col;   // (carbon: its facets in two shades, the weave catching the light)
    // the wing across: rings at its span's ends (tips tapered: tip, tipK); arch: its middle raised in a bow (nR rings)
    const wing = (f, span, col, o) => { o = o || {}; const tip = o.tip || 0, zs = o.arch ? Array.from({ length: 7 }, (_, i) => -span + span * i / 3) : tip ? [-span - tip, -span, span, span + tip] : [-span, span];
      const rings = zs.map(z => (Math.abs(z) > span + 1e-6 ? scaleAbout(f, o.tipK || 0.8) : f).map(q => [q[0], q[1] + (o.arch ? o.arch * (1 - (z / span) ** 2) : 0), z]));
      K.skin(rings, weave(col), col, col); };
    // a pylon: a tapered plate in the x-y plane at z, its foot on the roof (xa front, xb back), its top under the wing (xd front, xc back)
    const pylon = (z, xa, xb, xd, xc, f, col, th) => { const ya = RY(xa, z), yb = RY(xb, z);
      K.endplate(chamf([[xa, ya - 0.006 * k], [xb, yb - 0.006 * k], [xc, lowerAt(f, xc) + 0.006 * k], [xd, lowerAt(f, xd) + 0.006 * k]], 0.01 * k), z, th || 0.014 * k, col);
      K.box((xa + xb) / 2, Math.min(ya, yb) - 0.004 * k, z, Math.abs(xa - xb) + 0.03 * k, 0.012 * k, 0.045 * k, 0, DK); };   // (its foot plate)
    const plate = (pts, z, col, th) => K.endplate(chamf(pts, 0.012 * k), z, th || 0.01 * k, col);
    const gurney = (f, span, col) => { const te = f[4]; K.wingPlank(te[0] + 0.004 * k, te[1] - 0.004 * k, te[0] - 0.002 * k, te[1] + 0.022 * k, 0.005 * k, -span, span, col); };
    const side = (sd) => sd < 0 ? '-z' : 'z';
    switch (n) {
      // ---- SPOJLERJI: on the roof's rear edge ----
      case 1: case 2: {   // rob na pokrovu (a slim lip), račji rep (a ducktail, kicked up, with the high brake lamp)
        const big = n === 2, xf = X(big ? 0.2 : 0.12), xt = X(big ? -0.18 : -0.085), kick = (big ? 0.085 : 0.032) * k;
        const prof = (z, q) => { const y = (x) => RY(Math.max(x, X0), z);
          return [[xf, y(xf) + 0.003], [xf - (xf - xt) * 0.45, y(xf - (xf - xt) * 0.45) + 0.012 * k * q], [xt + 0.03 * k, y(X0) + kick * 0.72 * q], [xt, y(X0) + kick * q],
            [xt - 0.006 * k, y(X0) + kick * q - 0.022 * k], [X(-0.025), y(X0) - 0.012 * k], [X(0.05), y(X(0.05)) - 0.008 * k]].map(([x, yy]) => [x, yy, z]); };
        const zs = big ? [-W, -W + 0.06 * kz, -0.3 * kz, 0.3 * kz, W - 0.06 * kz, W] : [-W, -W + 0.04 * kz, 0, W - 0.04 * kz, W], ks = big ? [0.45, 1, 1, 1, 1, 0.45] : [0.5, 1, 1, 1, 0.5];
        K.skin(zs.map((z, i) => prof(z, ks[i])), (q, e) => e === 4 ? K.shade(P, 0.55) : e === 5 ? DK : P, P, P);
        if (big) K.rect(xt - 0.007 * k, RY(X0) + kick - 0.012 * k, 0, 0.32 * kz, 0.014 * k, K.rgb(0xb0100c), { dir: '-x' });
        break; }
      case 3: case 4: {   // lok: a bow-shaped blade over the roof's edge on two swept legs (karbonski: in carbon, a red line on its legs)
        const col = n === 4 ? CF : P, zl = W - 0.03 * kz, yb = Yo(0.07), f = foil(X(0.03), yb, 0.2 * k, 7, 0.026 * k);
        wing(f, zl, col, { arch: 0.035 * k });
        for (const sd of [-1, 1]) { const z = sd * zl;
          plate([[X(0.26), RY(X(0.24), z) - 0.004], [X(0.02), RY(X(0.02), z) - 0.004], [X(-0.17), yb - 0.035 * k], [X(-0.19), yb + 0.03 * k], [X(0.02), yb + 0.03 * k]], z, col, 0.02 * k);
          if (n === 4) K.rect(X(-0.06), yb + 0.03 * k, sd * (zl + 0.0105 * k), 0.12 * k, 0.008 * k, RED, { dir: side(sd) }); }
        break; }
      // ---- KRILA: a wing on two pylons ----
      case 5: case 6: {   // kratko krilo (nastavljivo: black, with endplates, the angle's holes and a gurney)
        const adj = n === 6, col = adj ? DK : P, span = (adj ? 0.43 : 0.4) * kz, f = foil(X(0.07), Yo(0.1), 0.2 * k, adj ? 9 : 6, 0.026 * k);
        wing(f, span, col, adj ? {} : { tip: 0.03 * kz, tipK: 0.7 });
        for (const sd of [-1, 1]) pylon(sd * 0.25 * kz, X(0.22), X(0.07), X(0.05), X(-0.07), f, adj ? AL2 : DK);
        if (adj) { gurney(f, span, RED);
          for (const sd of [-1, 1]) { plate([[X(0.09), Yo(0.055)], [X(-0.16), Yo(0.075)], [X(-0.16), Yo(0.17)], [X(0.07), Yo(0.14)]], sd * (span + 0.006 * k), DK, 0.008 * k);
            for (let i = 0; i < 4; i++) K.rect(X(-0.02 - i * 0.03), Yo(0.155 - i * 0.004), sd * (span + 0.0105 * k), 0.012 * k, 0.012 * k, AL, { dir: side(sd) }); } }
        break; }
      case 7: case 8: {   // nizko krilo (aluminijasto): the roof's width, low, small endplates
        const al = n === 8, col = al ? AL : P, span = W - 0.01 * kz, f = foil(X(0.085), Yo(0.07), 0.22 * k, 6, 0.026 * k);
        wing(f, span, col);
        for (const sd of [-1, 1]) { pylon(sd * Math.min(0.44 * kz, W - 0.12 * kz), X(0.24), X(0.1), X(0.07), X(-0.08), f, al ? DK : K.shade(P, 0.5));
          plate([[f[0][0] + 0.02 * k, f[0][1] - 0.03 * k], [f[4][0] - 0.02 * k, f[4][1] - 0.035 * k], [f[4][0] - 0.02 * k, f[4][1] + 0.035 * k], [f[0][0], f[0][1] + 0.03 * k]], sd * (span + 0.006 * k), al ? AL2 : col, 0.009 * k); }
        break; }
      // ---- KARBONSKA ----
      case 9: case 10: case 12: {   // karbonsko krilo, GT krilo, GT široko (wider than the roof)
        const gt = n !== 9, wide = n === 12, span = wide ? W + 0.135 * kz : W, c = (gt ? 0.29 : 0.24) * k, h = (gt ? (wide ? 0.21 : 0.19) : 0.14) * k, f = foil(X(0.11), Y0 + h, c, gt ? 9 : 7, 0.03 * k);
        wing(f, span, CF);
        if (gt) gurney(f, span, wide ? RED : CF);
        const zp = (wide ? 0.3 : 0.28) * kz;   // (the pylons clear of KOLIBRI's aerial, z 0.36)
        for (const sd of [-1, 1]) { pylon(sd * zp, X(0.28), X(0.1), X(0.1), X(gt ? -0.1 : -0.07), f, gt ? AL : CF2, 0.016 * k);
          const e0 = f[0][0] + 0.03 * k, e1 = f[4][0] - 0.035 * k, lo = (gt ? 0.1 : 0.06) * k;
          plate(gt ? [[e0, f[0][1] - lo], [e1 + 0.02 * k, f[4][1] - lo - 0.03 * k], [e1, f[4][1] + 0.06 * k], [e0 - 0.02 * k, f[0][1] + 0.05 * k]]
            : [[e0, f[0][1] - lo], [e1, f[4][1] - lo], [e1, f[4][1] + 0.04 * k], [e0 + 0.03 * k, f[0][1] + 0.035 * k]], sd * (span + 0.006 * k), wide ? CF2 : CF, 0.01 * k);
          if (wide) K.rect(e1 - 0.004 * k, f[4][1], sd * (span + 0.0115 * k), 0.008 * k, 0.1 * k, RED, { dir: side(sd) }); }
        break; }
      case 11: {   // GT, labodji vrat: the wing hung from swan necks over it
        const span = W, f = foil(X(0.11), Yo(0.16), 0.29 * k, 9, 0.03 * k), top = f[2][1];
        wing(f, span, CF); gurney(f, span, CF);
        for (const sd of [-1, 1]) { const z = sd * 0.27 * kz, ya = RY(X(0.32), z), yb = RY(X(0.2), z), th = 0.014 * k;
          K.endplate(chamf([[X(0.32), ya - 0.006 * k], [X(0.2), yb - 0.006 * k], [X(0.115), top + 0.085 * k], [X(0.17), top + 0.11 * k]], 0.01 * k), z, th, AL);   // (the neck rising in front of the wing)
          const p1 = [X(0.145), top + 0.095 * k], p2 = [f[2][0] - 0.02 * k, top - 0.004 * k], dx = p2[0] - p1[0], dy = p2[1] - p1[1], l = Math.hypot(dx, dy), nx = -dy / l * 0.019 * k, ny = dx / l * 0.019 * k;
          K.endplate([[p1[0] + nx, p1[1] + ny], [p2[0] + nx, p2[1] + ny], [p2[0] - nx, p2[1] - ny], [p1[0] - nx, p1[1] - ny]], z, th, AL);   // (its hook down onto the wing's top)
          K.box(X(0.26), Math.min(ya, yb) - 0.004 * k, z, 0.15 * k, 0.012 * k, 0.045 * k, 0, DK);
          const e0 = f[0][0] + 0.03 * k, e1 = f[4][0] - 0.035 * k;
          plate([[e0, f[0][1] - 0.1 * k], [e1 + 0.02 * k, f[4][1] - 0.13 * k], [e1, f[4][1] + 0.06 * k], [e0 - 0.02 * k, f[0][1] + 0.05 * k]], sd * (span + 0.006 * k), CF, 0.01 * k); }
        break; }
      // ---- DIRKALNA: two elements ----
      case 13: case 14: case 15: case 16: {   // dvojno (nastavljivo: its flap steeper, red endplates), dirkalno s ploščama, prototipno (on a fin)
        const proto = n === 16, span = proto ? W + 0.095 * kz : W, h = (n === 13 ? 0.15 : n === 14 ? 0.17 : n === 15 ? 0.2 : 0.25) * k, col = n === 13 ? P : CF;
        const f = foil(X(0.1), Y0 + h, (n >= 15 ? 0.27 : 0.23) * k, 7, 0.028 * k), te = f[4];
        const g2 = foil(te[0] + 0.035 * k, te[1] + 0.028 * k, (n >= 15 ? 0.14 : 0.12) * k, n === 13 ? 24 : n === 14 ? 34 : 30, 0.02 * k), te2 = g2[4];
        wing(f, span, col); wing(g2, span, col);
        if (proto) { const xf = X(0.635);   // (a fin along the roof's middle carries it)
          K.endplate([[xf, RY(xf, 0) - 0.004], [X(0.04), RY(X(0.04), 0) - 0.004], [X(-0.06), lowerAt(f, X(-0.06)) + 0.006 * k], [X(0.095), lowerAt(f, X(0.095)) + 0.006 * k]], 0, 0.014 * k, P);
          K.box(X(0.18), RY(X(0.18), 0) - 0.004 * k, 0, 0.12 * k, 0.014 * k, 0.05 * k, 0, DK); }
        else for (const sd of [-1, 1]) pylon(sd * 0.28 * kz, X(0.28), X(0.1), X(0.09), X(-0.08), f, n === 13 ? DK : AL, 0.016 * k);
        const epCol = n === 13 ? P : n === 14 ? RED : CF;
        for (const sd of [-1, 1]) { const z = sd * (span + 0.007 * k), e0 = f[0][0] + 0.03 * k, e1 = te2[0] - 0.025 * k, lo = (n >= 15 ? 0.17 : 0.09) * k, hi = (n >= 15 ? 0.08 : 0.04) * k;
          plate(n >= 15 ? [[e0 + 0.06 * k, f[0][1] - lo], [e1, te2[1] - lo - 0.12 * k], [e1, te2[1] + hi], [e0 - 0.04 * k, f[0][1] + 0.05 * k]]
            : [[e0, f[0][1] - lo], [e1, te2[1] - lo - 0.08 * k], [e1, te2[1] + hi], [e0, f[0][1] + 0.04 * k]], z, epCol, 0.01 * k);
          if (n === 14) for (let i = 0; i < 3; i++) K.rect(te[0] - (0.01 + i * 0.022) * k, te[1] + (0.035 + i * 0.012) * k, z + sd * 0.0055 * k, 0.012 * k, 0.012 * k, AL, { dir: side(sd) });   // (the flap's adjusters)
          if (n >= 15) K.rect(e1 - 0.004 * k, te2[1] - 0.02 * k, z + sd * 0.0055 * k, 0.008 * k, 0.16 * k, proto ? RED : AL, { dir: side(sd) }); }
        break; }
    }
  }

  // ================================================================ platisca: the wheels' look (look.wheels) of option n, face(h) its rim's face
  // h (render.js, kitWheelGeo): { g, p(a, z, r), spokeQ, capF, rr (the rim's radius), r1 (where spokes end), zd (the dish), zo (the face),
  // top (the spokes' outer end), full (the player's / the showroom's detail), out (the point faces drawn with it face away from: outwards) }
  function wheel(n) {
    const lugs = (h, k, rp, col, r) => { for (let i = 0; i < k; i++) { const a = i / k * Math.PI * 2 + Math.PI / 4, cx = Math.cos(a) * h.rr * rp, cy = Math.sin(a) * h.rr * rp, z = h.zd + 0.022;
      for (let j = 0; j < 6; j++) { const b0 = j / 6 * Math.PI * 2, b1 = (j + 1) / 6 * Math.PI * 2, R = h.rr * (r || 0.045);
        h.g.triO([cx, cy, z + 0.008], [cx + Math.cos(b0) * R, cy + Math.sin(b0) * R, z], [cx + Math.cos(b1) * R, cy + Math.sin(b1) * R, z], col, h.out); } } };   // (the wheel nuts)
    // a spoke: tapered (half widths w0 at r0, w1 at r1, in rim radii), a ridge along its middle, its sides down to the dish (the full detail)
    const spoke = (h, a, w0, w1, r0, r1, col, o) => { o = o || {}; const c = Math.cos(a), s = Math.sin(a), nx = -s, ny = c, R0 = h.rr * r0, R1 = h.rr * r1, W0 = h.rr * w0, W1 = h.rr * w1;
      const zA = o.zA != null ? o.zA : h.zd + 0.014, zB = o.zB != null ? o.zB : h.top - 0.002, rg = o.ridge != null ? o.ridge : 0.008;
      const L0 = [c * R0 + nx * W0, s * R0 + ny * W0, zA], L1 = [c * R1 + nx * W1, s * R1 + ny * W1, zB], Q0 = [c * R0 - nx * W0, s * R0 - ny * W0, zA], Q1 = [c * R1 - nx * W1, s * R1 - ny * W1, zB];
      const M0 = [c * R0, s * R0, zA + rg], M1 = [c * R1, s * R1, zB + rg * 0.5];
      h.g.quadO(L0, L1, M1, M0, o.c1 || col, h.out); h.g.quadO(M0, M1, Q1, Q0, o.c2 || col, h.out);
      if (h.full) { const sh = o.side || [col[0] * 0.72, col[1] * 0.72, col[2] * 0.72], dz = (q) => [q[0], q[1], h.zd + 0.002], mid = [c * (R0 + R1) / 2, s * (R0 + R1) / 2, h.zd];
        h.g.quadO(L0, L1, dz(L1), dz(L0), sh, mid); h.g.quadO(Q0, Q1, dz(Q1), dz(Q0), sh, mid); } };
    const disc = (h, r, k, col, z, dome) => h.capF(h.rr * r, k, col, z, dome || 0);
    const ring = (h, r0, r1, k, col, z) => { for (let i = 0; i < k; i++) { const a0 = i / k * Math.PI * 2, a1 = (i + 1) / k * Math.PI * 2; h.g.quadO(h.p(a0, z, h.rr * r0), h.p(a1, z, h.rr * r0), h.p(a1, z, h.rr * r1), h.p(a0, z, h.rr * r1), col, h.out); } };
    const hole = (h, a, r, r0, col, z, k) => { const cx = Math.cos(a) * h.rr * r, cy = Math.sin(a) * h.rr * r, R = h.rr * r0, q = k || 10;
      for (let j = 0; j < q; j++) { const b0 = j / q * Math.PI * 2, b1 = (j + 1) / q * Math.PI * 2; h.g.triO([cx, cy, z], [cx + Math.cos(b0) * R, cy + Math.sin(b0) * R, z], [cx + Math.cos(b1) * R, cy + Math.sin(b1) * R, z], col, h.out); } };
    const slot = (h, a, r0, r1, w, col, z) => h.spokeQ(a, h.rr * w, h.rr * r0, h.rr * r1, col, z, z);
    const mesh = (h, k, col, w, rot) => { for (let i = 0; i < k; i++) for (const s of [-0.34, 0.34]) { const a = i / k * Math.PI * 2 + (rot || 0), c = Math.cos(a), sn = Math.sin(a);   // (crossing spokes)
      const r0 = h.rr * 0.26, r1 = h.r1, a1 = a + s, W = h.rr * w, z0 = h.zd + 0.014, z1 = h.top - 0.002;
      const A = [c * r0, sn * r0], B = [Math.cos(a1) * r1, Math.sin(a1) * r1], dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy), ox = -dy / l * W, oy = dx / l * W;
      h.g.quadO([A[0] + ox, A[1] + oy, z0], [B[0] + ox, B[1] + oy, z1], [B[0] - ox, B[1] - oy, z1], [A[0] - ox, A[1] - oy, z0], col, h.out); } };
    const CHR = [0.88, 0.89, 0.93], BLK = [0.08, 0.08, 0.09], HOLE = [0.02, 0.02, 0.025];
    const T = [
      // 1 jeklena, črna: a pressed steel wheel: a raised ring, eight vent holes, the hub and its nuts
      { rim: [0.1, 0.1, 0.11], dish: 'rim', face: (h) => { ring(h, 0.5, 0.58, 16, [0.15, 0.15, 0.16], h.zd + 0.006); for (let i = 0; i < 8; i++) slot(h, i / 8 * Math.PI * 2 + 0.2, 0.66, 0.82, 0.075, HOLE, h.zd + 0.004);
        disc(h, 0.34, 12, [0.13, 0.13, 0.14], h.zd + 0.012, 0.006); lugs(h, 4, 0.22, [0.55, 0.55, 0.57]); disc(h, 0.09, 8, HOLE, h.zd + 0.03); } },
      // 2 jeklena s pokrovi: a domed silver hubcap over the whole face, turbine slots
      { rim: [0.45, 0.46, 0.5], dish: 'rim', face: (h) => { disc(h, 0.97, 24, [0.74, 0.75, 0.79], h.zd + 0.018, 0.022); ring(h, 0.86, 0.95, 24, [0.62, 0.63, 0.67], h.zd + 0.024);
        for (let i = 0; i < 12; i++) slot(h, i / 12 * Math.PI * 2, 0.5, 0.82, 0.05, [0.16, 0.16, 0.18], h.zd + 0.036); disc(h, 0.22, 12, [0.84, 0.85, 0.89], h.zd + 0.04, 0.01); } },
      // 3 jeklena, reli: white steel, six round holes, black nuts
      { rim: [0.93, 0.93, 0.91], dish: 'rim', face: (h) => { for (let i = 0; i < 6; i++) hole(h, i / 6 * Math.PI * 2 + 0.26, 0.64, 0.14, HOLE, h.zd + 0.004, 10);
        ring(h, 0.36, 0.42, 16, [0.82, 0.82, 0.8], h.zd + 0.008); disc(h, 0.36, 12, [0.95, 0.95, 0.93], h.zd + 0.012, 0.008); lugs(h, 4, 0.22, [0.1, 0.1, 0.11]); disc(h, 0.08, 8, HOLE, h.zd + 0.03); } },
      // 4 jeklena, široka: a deep dish, a wide polished lip, five trapezoid holes
      { deep: true, rim: [0.36, 0.37, 0.4], dish: 'rim', lip: [0.9, 0.91, 0.94], face: (h) => { ring(h, 0.88, 0.96, 24, [0.82, 0.83, 0.87], h.zd + 0.004);
        for (let i = 0; i < 5; i++) spoke(h, i / 5 * Math.PI * 2 + 0.3, 0.07, 0.11, 0.44, 0.66, HOLE, { zA: h.zd + 0.004, zB: h.zd + 0.004, ridge: 0 });
        disc(h, 0.36, 12, [0.44, 0.45, 0.48], h.zd + 0.01, 0.006); lugs(h, 4, 0.22, CHR); disc(h, 0.1, 10, CHR, h.zd + 0.03, 0.01); } },
      // 5 kromirana, 3 kraki: three broad chrome blades
      { rim: CHR, dishC: [0.1, 0.1, 0.11], face: (h) => { for (let i = 0; i < 3; i++) spoke(h, i / 3 * Math.PI * 2 + 0.5, 0.26, 0.36, 0.2, 0.9, CHR, { c2: [0.7, 0.71, 0.74] }); disc(h, 0.3, 12, CHR, h.zd + 0.026, 0.02); } },
      // 6 lita, 5 krakov: silver, tapered spokes
      { rim: [0.76, 0.77, 0.8], dishC: [0.12, 0.12, 0.13], face: (h) => { for (let i = 0; i < 5; i++) spoke(h, i / 5 * Math.PI * 2 + 0.3, 0.17, 0.1, 0.22, 0.91, [0.78, 0.79, 0.82], { c2: [0.6, 0.61, 0.64] });
        disc(h, 0.26, 10, [0.7, 0.71, 0.74], h.zd + 0.02, 0.01); lugs(h, 4, 0.2, [0.86, 0.87, 0.9], 0.04); disc(h, 0.1, 8, [0.2, 0.2, 0.22], h.zd + 0.034, 0.006); } },
      // 7 oranžna, 10 krakov
      { rim: [0.97, 0.46, 0.06], dishC: [0.08, 0.08, 0.09], face: (h) => { for (let i = 0; i < 10; i++) spoke(h, i / 10 * Math.PI * 2, 0.065, 0.05, 0.24, 0.92, [0.98, 0.48, 0.07], { c2: [0.82, 0.36, 0.04] });
        disc(h, 0.27, 12, [0.97, 0.46, 0.06], h.zd + 0.02, 0.01); disc(h, 0.15, 10, BLK, h.zd + 0.034, 0.01); } },
      // 8 črna mreža: a black cross-spoke mesh, a polished lip, its bolts
      { rim: BLK, lip: [0.82, 0.83, 0.87], dishC: [0.03, 0.03, 0.035], face: (h) => { mesh(h, 10, [0.11, 0.11, 0.12], 0.032); ring(h, 0.86, 0.94, 24, [0.12, 0.12, 0.13], h.zd + 0.01);
        for (let i = 0; i < 16; i++) hole(h, i / 16 * Math.PI * 2, 0.9, 0.022, [0.7, 0.71, 0.74], h.zd + 0.014, 6); disc(h, 0.28, 12, [0.12, 0.12, 0.13], h.zd + 0.022, 0.012); disc(h, 0.12, 8, [0.5, 0.51, 0.54], h.zd + 0.036, 0.006); } },
      // 9 kovana, 5 krakov: graphite, each spoke split in two towards the rim, a polished lip
      { rim: [0.3, 0.31, 0.34], lip: [0.84, 0.85, 0.89], dishC: [0.06, 0.06, 0.07], face: (h) => { const C = [0.33, 0.34, 0.37], C2 = [0.22, 0.23, 0.25];
        for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + 0.3; spoke(h, a, 0.14, 0.11, 0.22, 0.56, C, { c2: C2, zB: h.zd + 0.03 });
          for (const s of [-0.16, 0.16]) spoke(h, a + s, 0.06, 0.05, 0.6, 0.92, C, { c2: C2, zA: h.zd + 0.03 }); }
        disc(h, 0.25, 10, C, h.zd + 0.022, 0.01); lugs(h, 4, 0.18, [0.75, 0.76, 0.8], 0.04); } },
      // 10 zlata, 5 krakov: broad gold spokes
      { rim: [0.86, 0.68, 0.22], dishC: [0.07, 0.07, 0.08], face: (h) => { for (let i = 0; i < 5; i++) spoke(h, i / 5 * Math.PI * 2 + 0.3, 0.2, 0.17, 0.22, 0.92, [0.9, 0.72, 0.25], { c2: [0.7, 0.53, 0.15] });
        disc(h, 0.27, 12, [0.86, 0.68, 0.22], h.zd + 0.022, 0.012); disc(h, 0.12, 8, [0.12, 0.12, 0.13], h.zd + 0.036, 0.006); } },
      // 11 kovana, mreža: a silver mesh, a polished lip with its bolts
      { rim: [0.68, 0.69, 0.72], lip: [0.93, 0.94, 0.97], dishC: [0.08, 0.08, 0.09], face: (h) => { mesh(h, 12, [0.74, 0.75, 0.78], 0.028, 0.13); ring(h, 0.86, 0.94, 24, [0.6, 0.61, 0.64], h.zd + 0.01);
        for (let i = 0; i < 18; i++) hole(h, i / 18 * Math.PI * 2, 0.9, 0.022, [0.95, 0.95, 0.98], h.zd + 0.014, 6); disc(h, 0.28, 12, [0.7, 0.71, 0.74], h.zd + 0.024, 0.012); disc(h, 0.12, 8, [0.15, 0.15, 0.17], h.zd + 0.038, 0.006); } },
      // 12 kovana, centralna matica: six spokes, a big centre-lock nut with its red safety clip
      { rim: [0.5, 0.51, 0.55], dishC: [0.07, 0.07, 0.08], face: (h) => { for (let i = 0; i < 6; i++) spoke(h, i / 6 * Math.PI * 2, 0.12, 0.08, 0.22, 0.92, [0.52, 0.53, 0.57], { c2: [0.38, 0.39, 0.42] });
        disc(h, 0.27, 6, [0.8, 0.81, 0.85], h.zd + 0.03, 0.016); disc(h, 0.12, 12, [0.3, 0.3, 0.32], h.zd + 0.05, 0.006); slot(h, 0.4, 0.05, 0.24, 0.035, RED, h.zd + 0.058); } },
      // 13 magnezijeva: bronze, eight straight spokes
      { rim: [0.55, 0.44, 0.27], dishC: [0.07, 0.06, 0.05], face: (h) => { for (let i = 0; i < 8; i++) spoke(h, i / 8 * Math.PI * 2 + 0.2, 0.085, 0.07, 0.24, 0.92, [0.58, 0.47, 0.29], { c2: [0.42, 0.33, 0.2] });
        disc(h, 0.27, 12, [0.55, 0.44, 0.27], h.zd + 0.02, 0.01); lugs(h, 4, 0.18, [0.12, 0.12, 0.13], 0.04); } },
      // 14 magnezijeva, dirkalna: gold-bronze, six broad spokes, a centre lock
      { rim: [0.74, 0.6, 0.28], dishC: [0.06, 0.05, 0.04], face: (h) => { for (let i = 0; i < 6; i++) spoke(h, i / 6 * Math.PI * 2 + 0.52, 0.15, 0.13, 0.22, 0.92, [0.78, 0.63, 0.3], { c2: [0.6, 0.47, 0.2] });
        disc(h, 0.26, 6, [0.86, 0.87, 0.9], h.zd + 0.03, 0.016); disc(h, 0.11, 12, [0.2, 0.2, 0.22], h.zd + 0.05, 0.006); slot(h, 1.2, 0.05, 0.24, 0.035, RED, h.zd + 0.058); } },
      // 15 karbonska: carbon twin spokes, a polished lip
      { rim: [0.07, 0.07, 0.08], lip: [0.78, 0.79, 0.83], dishC: [0.03, 0.03, 0.035], face: (h) => { for (let i = 0; i < 5; i++) for (const s of [-0.11, 0.11]) spoke(h, i / 5 * Math.PI * 2 + 0.3 + s, 0.065, 0.052, 0.24, 0.92, [0.2, 0.205, 0.22], { c2: [0.1, 0.1, 0.11], side: [0.05, 0.05, 0.055] });
        disc(h, 0.27, 12, CF, h.zd + 0.022, 0.012); ring(h, 0.2, 0.25, 12, [0.62, 0.63, 0.67], h.zd + 0.034); disc(h, 0.1, 8, [0.6, 0.61, 0.65], h.zd + 0.04, 0.006); } },
      // 16 karbonska, aero: a flat carbon aero cover, curved slots, an orange ring, a centre lock
      { rim: [0.07, 0.07, 0.08], lip: [0.2, 0.2, 0.22], dishC: [0.03, 0.03, 0.035], face: (h) => { disc(h, 0.93, 24, CF2, h.zd + 0.03, 0.004);
        for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) slot(h, i / 6 * Math.PI * 2 + j * 0.13, 0.48 + j * 0.12, 0.6 + j * 0.12, 0.05, HOLE, h.zd + 0.036);
        ring(h, 0.86, 0.9, 24, [0.98, 0.45, 0.06], h.zd + 0.036); disc(h, 0.22, 6, [0.84, 0.85, 0.89], h.zd + 0.04, 0.014); disc(h, 0.09, 10, [0.98, 0.45, 0.06], h.zd + 0.06, 0.004); } },
    ];
    return T[n - 1] ? Object.assign({}, T[n - 1]) : null;   // (the tyre stays the vehicle's: its style (knobbly, a truck's, white walls) is not the rim's)
  }

  // ================================================================ zarometi: both head lamps of option n (hosts: the lamps' part ids)
  // m: { x: the lamp face's x at y0, lean: its x back per metre up, zc, yc: the lamp's middle (z out from the car's middle), s: the size
  // (1: KOLIBRI's lamp area, 0.36 m wide, 0.24 m tall), hosts: [left, right] (the parts the lamps belong to; none: where they sit), depth:
  // how far the lamp's ring reaches back (default 0.014, flush in a flat face; a housing standing out of a curved wing: more), socket: the
  // part of the dark socket behind each lamp ('body', seen once a lamp that is a part of its own is knocked out; 'host': its lamp's part),
  // shape: the car's own lamp outline (metres round zc, yc; every option takes it, s then sizes its details), bulge: that lens' dome,
  // ringW: its ring's width }.
  // Each lamp: its lens (the sub-range that lights up at night) of its own outline, a ring round it, the details in front of the lens
  function zarometi(K, n, m) {
    const s = m.s || 1, hosts = m.hosts || [undefined, undefined];
    for (const sd of [-1, 1]) zaromet(K, n, sd, hosts[sd < 0 ? 0 : 1], m, s);
  }
  function zaromet(K, n, sd, host, m, s) {
    const o = { host }, WARM = [0.96, 0.93, 0.84], COOL = [0.9, 0.95, 1], YEL = [1, 0.8, 0.16], SMOKE = [0.26, 0.27, 0.3], DARK = [0.14, 0.15, 0.18], AMB = [1, 0.6, 0.1], LAS = [0.22, 0.5, 1], WHITE = [1, 1, 1];
    const xAt = (y) => m.x - (y - m.y0) * m.lean;   // (the lamp face, leaning back)
    // the car's own lamp (m.shape: a convex outline in metres round (zc, yc), its lens bulging m.bulge: PANTER's triangles, JASTREB's round
    // lamps in their pods): every option takes its outline, the option's colour, ring and details inside it, on the dome
    const SH = m.shape || null, BG = SH ? m.bulge || 0 : 0, SC = SH ? [SH.reduce((a, q) => a + q[0], 0) / SH.length, SH.reduce((a, q) => a + q[1], 0) / SH.length] : null;
    const tOut = (u, v) => { let t = 0; for (let i = 0; i < SH.length; i++) { const a = SH[i], b = SH[(i + 1) % SH.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      let nx = (b[1] - a[1]) / l, ny = (a[0] - b[0]) / l, d = (a[0] - SC[0]) * nx + (a[1] - SC[1]) * ny; if (d < 0) { nx = -nx; ny = -ny; d = -d; }
      if (d > 1e-6) t = Math.max(t, ((u - SC[0]) * nx + (v - SC[1]) * ny) / d); } return t; };   // (the share of the way out from the outline's middle)
    const dome = (u, v) => BG ? BG * Math.max(0, 1 - Math.min(1, tOut(u, v)) ** 2) : 0;   // (the lens' height there, as render.js's dome)
    let C = [m.zc, m.yc];   // (this option's lamp middle: set by each option, relative to the mount's; the car's own lamp: the mount's)
    const at0 = (cz, cy) => { if (!SH) C = [m.zc + cz * s, m.yc + cy * s]; };
    // a point of the lamp's plane (u out, v up, in the reference size): off >= 0 in front of the lens' (upright) front by off (on its dome),
    // off < 0 on the body's face round the lamp (a panel, a frame)
    const at = (u, v, off) => [off >= 0 ? xAt(C[1]) + 0.01 + off + dome(u * s, v * s) : xAt(C[1] + v * s) - off * 0.5, C[1] + v * s, sd * (C[0] + u * s)];
    const fwd = (P) => { const a = P[0], b = P[1], c = P[2], nx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]); K.face(nx < 0 ? P.slice().reverse() : P, col0, o); };
    let col0 = null;
    const face = (pts, col, off) => {
      if (SH) { const n0 = pts.length, cu = pts.reduce((a, q) => a + q[0], 0) / n0, cv = pts.reduce((a, q) => a + q[1], 0) / n0;
        if (off < 0 || tOut(cu * s, cv * s) > 0.96) return;   // (the car's own face round its lamp; nothing outside the lamp)
        if (BG) { const R = []; let cut = false;   // (on the dome: every point on it; a long edge in pieces of 3 cm at most, then a fan from the middle)
          for (let i = 0; i < n0; i++) { const a = pts[i], b = pts[(i + 1) % n0], q = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * s / 0.03)); if (q > 1) cut = true;
            for (let j = 0; j < q; j++) R.push(at(a[0] + (b[0] - a[0]) * j / q, a[1] + (b[1] - a[1]) * j / q, off)); }
          col0 = col; if (!cut) { fwd(R); return; }
          const M = at(cu, cv, off); for (let i = 0; i < R.length; i++) fwd([M, R[i], R[(i + 1) % R.length]]); return; } }
      col0 = col; fwd(pts.map(([u, v]) => at(u, v, off))); };   // (facing forward)
    // (round shapes in k segments on Visoki, six in ten of them on Normalni (a phone's: the lamps face away from the camera behind the car))
    const sq = (k) => K.hi ? k : Math.max(6, Math.round(k * 0.6)), ell = (cu, cv, ru, rv, k) => ellipse(cu, cv, ru, rv, sq(k));
    const circ = (cu, cv, r, k) => ell(cu, cv, r, r, k || 14);
    const disc = (cu, cv, r, col, off, k) => face(circ(cu, cv, r, k), col, off);
    const ann = (cu, cv, r0, r1, col, off, k) => { const q = sq(k || 16); for (let i = 0; i < q; i++) { const a0 = i / q * Math.PI * 2, a1 = (i + 1) / q * Math.PI * 2;
      face([[cu + Math.cos(a0) * r0, cv + Math.sin(a0) * r0], [cu + Math.cos(a1) * r0, cv + Math.sin(a1) * r0], [cu + Math.cos(a1) * r1, cv + Math.sin(a1) * r1], [cu + Math.cos(a0) * r1, cv + Math.sin(a0) * r1]], col, off); } };
    const bar = (u0, v0, u1, v1, w, col, off) => { const dx = u1 - u0, dy = v1 - v0, l = Math.hypot(dx, dy), ox = -dy / l * w / 2, oy = dx / l * w / 2;
      face([[u0 + ox, v0 + oy], [u1 + ox, v1 + oy], [u1 - ox, v1 - oy], [u0 - ox, v0 - oy]], col, off); };
    const lamp = (polys, col, ring, ringW) => {
      const PS = SH ? [SH] : polys.map(pp => pp.map(([u, v]) => [u * s, v * s]));   // (metres round its middle)
      for (const pp of PS) { const P = pp.map(([u, v]) => [xAt(C[1] + v) + 0.002, C[1] + v * 1.04, sd * (C[0] + u * 1.04)]), so = m.socket === 'host' ? { host } : { part: m.socket || 'body' };
        const tri = (Q) => { const a = Q[0], b = Q[1], c = Q[2]; K.face(((b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1])) < 0 ? Q.slice().reverse() : Q, [0.05, 0.05, 0.055], so); };
        if (SH) { const M = P.reduce((a, q) => [a[0] + q[0] / P.length, a[1] + q[1] / P.length, a[2] + q[2] / P.length], [0, 0, 0]); for (let i = 0; i < P.length; i++) tri([M, P[i], P[(i + 1) % P.length]]); }
        else tri(P); }   // (the socket; the car's own outline: a fan from its middle, it may have a notch)
      K.headLamp(xAt(C[1]) + 0.006, C[1], sd * C[0], 0.08 * s, { polys: PS, col, ring, ringW: SH ? m.ringW || 0.008 : (ringW || 0.012) * s, ringD: m.depth, bulge: BG, host, d: 0.024 }); };
    const L = 0.0015;   // (the details: just in front of the lens)
    switch (n) {
      case 1: {   // halogenski: a rounded rectangle, fluted glass, a chrome ring
        at0(-0.005, 0); lamp([rrect(0, 0, 0.26, 0.17, 0.04, 3)], WARM, K.chrome, 0.012);
        for (let i = -4; i <= 4; i++) bar(i * 0.027, -0.07, i * 0.027, 0.07, 0.004, [0.84, 0.81, 0.72], L);
        disc(0, 0, 0.032, [0.75, 0.76, 0.8], L + 0.002, 12); break; }
      case 2: {   // prozorni: a trapezoid of clear glass, the chrome reflectors and bulbs seen through it
        at0(0, -0.003); lamp([[[-0.13, -0.075], [0.135, -0.075], [0.14, 0.095], [-0.13, 0.05]]], [0.84, 0.88, 0.93], K.chrome, 0.01);
        for (const [u, r] of [[-0.06, 0.055], [0.065, 0.065]]) { ann(u, 0.005, r * 0.55, r, [0.92, 0.93, 0.96], L, 14); disc(u, 0.005, r * 0.55, [0.7, 0.72, 0.76], L, 12); disc(u, 0.005, 0.016, [1, 0.98, 0.9], L + 0.003, 8); }
        break; }
      case 3: {   // črn okvir: a wide hexagon in a thick black frame, one big reflector
        at0(0, 0); lamp([[[-0.15, 0], [-0.105, -0.078], [0.105, -0.078], [0.15, 0], [0.105, 0.078], [-0.105, 0.078]]], WARM, K.black, 0.024);
        ann(0.01, 0, 0.035, 0.065, [0.86, 0.87, 0.9], L, 16); disc(0.01, 0, 0.035, [0.7, 0.72, 0.75], L, 12); disc(0.01, 0, 0.014, [1, 0.97, 0.88], L + 0.003, 8); break; }
      case 4: {   // okrogli, klasični: two round lamps a side in a black panel, chrome rings, ringed glass
        at0(0, 0); lamp([circ(-0.072, 0, 0.067, 16), circ(0.075, 0, 0.067, 16)], WARM, K.chrome, 0.012);
        face(rrect(0, 0, 0.3, 0.16, 0.03, 2), [0.06, 0.06, 0.065], -0.006);
        for (const u of [-0.072, 0.075]) { ann(u, 0, 0.042, 0.047, [0.82, 0.8, 0.72], L, 16); disc(u, 0, 0.018, [0.86, 0.87, 0.9], L + 0.002, 10); }
        break; }
      case 5: {   // LED: a slim wedge high on the face, a row of LED cubes, a line of light along its top
        at0(0.005, 0.06); lamp([[[-0.165, -0.022], [0.17, -0.04], [0.172, 0.036], [-0.165, 0.016]]], DARK, K.black, 0.01);
        for (let i = 0; i < 5; i++) face(rrect(-0.11 + i * 0.058, -0.006 - i * 0.0025, 0.03, 0.026, 0.005, 1), COOL, L);
        bar(-0.155, 0.011, 0.162, 0.029, 0.007, WHITE, L); break; }
      case 6: {   // rumeni: one big round yellow lamp, a chrome ring, ringed glass
        at0(0, 0); lamp([circ(0, 0, 0.095, 20)], YEL, K.chrome, 0.013);
        for (const r of [0.07, 0.045]) ann(0, 0, r - 0.004, r, [0.88, 0.66, 0.1], L, 18); disc(0, 0, 0.022, [0.86, 0.87, 0.9], L + 0.002, 10); break; }
      case 7: {   // dimljeni: an oval of smoked glass, two dim reflectors behind it
        at0(0, 0); lamp([ell(0, 0, 0.145, 0.085, 20)], SMOKE, K.black, 0.01);
        for (const u of [-0.06, 0.065]) { ann(u, 0, 0.026, 0.05, [0.42, 0.43, 0.47], L, 14); disc(u, 0, 0.013, [0.7, 0.68, 0.6], L + 0.002, 8); } break; }
      case 8: {   // LED z dnevno lučjo: a rounded trapezoid, a C of light round a projector
        at0(0, 0); lamp([chamf([[-0.14, -0.07], [0.15, -0.08], [0.15, 0.085], [-0.14, 0.06]], 0.03)], DARK, K.black, 0.01);
        bar(0.115, -0.05, 0.115, 0.055, 0.012, WHITE, L); bar(-0.1, 0.045, 0.115, 0.055, 0.012, WHITE, L); bar(-0.1, -0.048, 0.115, -0.05, 0.012, WHITE, L);
        ann(0.005, 0.002, 0.03, 0.04, [0.8, 0.81, 0.85], L, 14); disc(0.005, 0.002, 0.03, [0.62, 0.72, 0.85], L, 14); break; }
      case 9: {   // bi-LED: an angry-eyed pentagon (its top falls towards the middle), two projectors, a brow of light
        at0(0, -0.003); lamp([[[-0.165, -0.005], [-0.125, -0.072], [0.155, -0.072], [0.168, 0], [0.152, 0.075]]], DARK, K.black, 0.01);
        bar(-0.15, 0, 0.148, 0.062, 0.011, WHITE, L);
        for (const u of [-0.035, 0.075]) { ann(u, -0.026, 0.03, 0.04, [0.82, 0.83, 0.87], L, 14); disc(u, -0.026, 0.03, [0.55, 0.66, 0.82], L, 14); disc(u + 0.006, -0.02, 0.009, WHITE, L + 0.003, 6); }
        break; }
      case 10: {   // bi-LED, dimljeni: a teardrop pointing in, smoked, one projector in its round end, light along its foot
        at0(-0.005, 0); lamp([hull(ell(0.06, 0, 0.095, 0.085, 14).concat([[-0.17, -0.02]]))], SMOKE, K.black, 0.01);
        ann(0.065, 0.004, 0.044, 0.056, [0.7, 0.71, 0.75], L, 16); disc(0.065, 0.004, 0.044, [0.42, 0.5, 0.62], L, 16); disc(0.075, 0.016, 0.012, WHITE, L + 0.003, 6);
        bar(-0.14, -0.026, 0.07, -0.072, 0.009, WHITE, L); break; }
      case 11: {   // bi-LED, tekoči smerniki: an L (up the outer side, along the foot), the sequential amber in its foot
        at0(-0.005, -0.003); lamp([[[-0.165, -0.08], [0.165, -0.08], [0.165, -0.015], [-0.165, -0.025]], [[0.085, -0.02], [0.165, -0.02], [0.165, 0.09], [0.095, 0.09]]], DARK, K.black, 0.01);
        for (let i = 0; i < 7; i++) face(rrect(-0.14 + i * 0.033, -0.058, 0.026, 0.024, 0.004, 1), AMB, L);
        bar(0.128, 0, 0.13, 0.08, 0.012, WHITE, L);
        ann(0.13, -0.05, 0.022, 0.03, [0.82, 0.83, 0.87], L + 0.001, 12); disc(0.13, -0.05, 0.022, [0.55, 0.66, 0.82], L + 0.001, 12); break; }
      case 12: {   // projektorski: a round housing, a big projector lens in a chrome shroud, a ring of light round it
        at0(0, 0); lamp([circ(0, 0, 0.098, 20)], [0.12, 0.13, 0.15], K.black, 0.012);
        ann(0, 0, 0.082, 0.091, WHITE, L, 20); ann(0, 0, 0.05, 0.068, [0.86, 0.87, 0.91], L, 18); disc(0, 0, 0.05, [0.5, 0.62, 0.8], L, 16); disc(0.014, 0.016, 0.014, [0.92, 0.96, 1], L + 0.003, 8);
        break; }
      case 13: {   // matrični LED: a slanted parallelogram, two rows of LED segments, a line of light under them
        at0(0.005, 0); lamp([[[-0.165, -0.06], [0.13, -0.06], [0.175, 0.06], [-0.12, 0.06]]], [0.13, 0.14, 0.17], K.black, 0.01);
        for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const v = -0.022 + r * 0.04, u = -0.12 + i * 0.045 + v * 0.37; face(chamf([[u - 0.016, v - 0.014], [u + 0.016, v - 0.014], [u + 0.021, v + 0.014], [u - 0.011, v + 0.014]], 0.003), COOL, L); }
        bar(-0.14, -0.048, 0.125, -0.048, 0.007, WHITE, L); break; }
      case 14: {   // matrični, dimljeni: two slits one over the other, smoked: a line of light over the matrix
        at0(0.005, 0.004); lamp([[[-0.165, 0.058], [0.17, 0.068], [0.17, 0.098], [-0.165, 0.082]], [[-0.15, -0.085], [0.165, -0.085], [0.165, 0.042], [-0.15, 0.03]]], [0.2, 0.21, 0.24], K.black, 0.009);
        bar(-0.15, 0.072, 0.158, 0.083, 0.01, WHITE, L);
        for (let i = 0; i < 5; i++) face(rrect(-0.105 + i * 0.058, -0.026, 0.034, 0.05, 0.006, 1), [0.62, 0.66, 0.72], L); break; }
      case 15: {   // laserski: an arrow pointing in, two round LED projectors, the blue laser line along its point
        at0(0.005, 0); lamp([[[-0.17, 0], [-0.075, -0.075], [0.165, -0.075], [0.165, 0.075], [-0.075, 0.075]]], [0.12, 0.13, 0.16], K.black, 0.01);
        bar(-0.15, 0, -0.068, 0.063, 0.01, LAS, L); bar(-0.15, 0, -0.068, -0.063, 0.01, LAS, L); bar(-0.06, 0.063, 0.15, 0.063, 0.008, WHITE, L);
        for (const u of [0, 0.09]) { ann(u, -0.01, 0.027, 0.036, [0.82, 0.83, 0.87], L, 14); disc(u, -0.01, 0.027, [0.5, 0.62, 0.82], L, 14); } break; }
      case 16: {   // laserski, karbonski okvir: a swept kite in a carbon frame, blue laser accents
        at0(0.015, 0); const pts = [[-0.16, 0.075], [0.168, 0.075], [0.168, 0.03], [0.05, -0.078], [-0.16, -0.078]];
        face(chamf(pts.map(([u, v]) => [u * 1.08 + 0.006, v * 1.18]), 0.01), [0.06, 0.06, 0.065], -0.004);
        lamp([pts], [0.12, 0.13, 0.16], CF, 0.02);
        bar(-0.145, 0.058, 0.155, 0.058, 0.009, LAS, L); bar(0.155, 0.04, 0.06, -0.06, 0.008, LAS, L);
        for (const u of [-0.08, 0.02]) { ann(u, -0.012, 0.028, 0.037, [0.82, 0.83, 0.87], L, 14); disc(u, -0.012, 0.028, [0.5, 0.62, 0.82], L, 14); } break; }
    }
  }

  // the lamps' lens and ring colours, option by option (as zaromet draws them): a car that keeps its own lamp housing (JASTREB's glass
  // teardrops and pods) colours it after the option fitted
  const CHR = [0.8, 0.81, 0.84], BLK = [0.02, 0.02, 0.022], LW = [0.96, 0.93, 0.84], LD = [0.14, 0.15, 0.18], LS = [0.26, 0.27, 0.3];
  const LOOKS = [[LW, CHR], [[0.84, 0.88, 0.93], CHR], [LW, BLK], [LW, CHR], [LD, BLK], [[1, 0.8, 0.16], CHR], [LS, BLK], [LD, BLK], [LD, BLK], [LS, BLK],
    [LD, BLK], [[0.12, 0.13, 0.15], BLK], [[0.13, 0.14, 0.17], BLK], [[0.2, 0.21, 0.24], BLK], [[0.12, 0.13, 0.16], BLK], [[0.12, 0.13, 0.16], CF]];
  const lampLook = (n) => LOOKS[n - 1] ? { col: LOOKS[n - 1][0], ring: LOOKS[n - 1][1] } : null;

  // ================================================================ the elements drawn (the others: effects only, for now)
  const BUILD = { krilo, zarometi };
  const add = (id, b) => { if (EL[id] && typeof b === 'function' && id !== 'platisca') BUILD[id] = b; };   // (js/deli/<group>.js: an element's options)
  const seg = (K, k) => K.hi ? k : Math.max(6, Math.round(k * 0.6));   // (a round shape's segments: fewer on Normalni)
  const has = (id) => !!BUILD[id] || id === 'platisca';
  function build(K, id, n, m, M) { const b = BUILD[id]; if (!b || !m) return false; b(K, n, m, M); return true; }
  // a car's fitted parts as a vehicle can show them: an object of the elements DELI knows, options 1..16 (M: only those it has a mount for)
  function clean(deli, M) {
    const out = {}; if (!deli || typeof deli !== 'object') return out;
    const mounts = M && M.def && M.def.mounts;
    for (const id of Object.keys(deli)) { const n = Math.round(+deli[id]); if (EL[id] && n >= 1 && n <= 16 && (!M || (has(id) && mounts && mounts[id]))) out[id] = n; }
    return out;
  }
  // the drawn parts' key (render.js: a car with parts has a body of its own, cached by it): '' when nothing of them shows on M
  const key = (deli, M) => { const c = clean(deli, M); return Object.keys(c).sort().map(id => id + c[id]).join('.'); };
  const mesh = (id, n, M, color) => typeof Render !== 'undefined' && Render.deliMesh ? Render.deliMesh(M, id, n, color) : null;

  // ================================================================ effect: the option's kaj_nudi read into numbers
  function effect(id, n) {
    const o = option(id, n); if (!o) return null;
    const e = { kg: 0, power: 0, grip: 0, kmh: 0, brake: 0, lower: 0, tint: 0, tyre: null }, num = (s) => +String(s).replace('−', '-').replace(',', '.');
    for (const part of String(o.kaj_nudi || '').split(/\s*·\s*/)) {
      const t = part.trim(); let q;
      if ((q = /^([+−-]?\d+(?:[.,]\d+)?)\s*kg$/.exec(t))) e.kg += num(q[1]);
      else if ((q = /^moč\s*([+−-]?\d+(?:[.,]\d+)?)\s*%$/.exec(t))) e.power += num(q[1]) / 100;
      else if ((q = /^oprijem(?: v ovinku)?\s*([+−-]?\d+(?:[.,]\d+)?)\s*%$/.exec(t))) e.grip += num(q[1]) / 100;
      else if ((q = /^([+−-]?\d+(?:[.,]\d+)?)\s*km\/h$/.exec(t))) e.kmh += num(q[1]);
      else if ((q = /^([+−-]?\d+(?:[.,]\d+)?)\s*% zavorne moči$/.exec(t))) e.brake += num(q[1]) / 100;
      else if ((q = /^nižje za\s*(\d+(?:[.,]\d+)?)\s*cm$/.exec(t))) e.lower += num(q[1]) / 100;
      else if ((q = /^višje za\s*(\d+(?:[.,]\d+)?)\s*cm$/.exec(t))) e.lower -= num(q[1]) / 100;
      else if ((q = /^prepusti\s*(\d+)\s*% svetlobe$/.exec(t))) e.tint = 1 - num(q[1]) / 100;
      else if ((q = /^(suho|mokro|sneg|makadam)\s*([+−-]?\d+(?:[.,]\d+)?)$/.exec(t))) { e.tyre = e.tyre || { dry: 0, wet: 0, snow: 0, gravel: 0 }; e.tyre[{ suho: 'dry', mokro: 'wet', sneg: 'snow', makadam: 'gravel' }[q[1]]] = num(q[2]); }
    }
    return e;
  }

  return { DATA, element, option, has, build, add, seg, wheel, mesh, effect, clean, key, lampLook, mounts: (M) => (M && M.def && M.def.mounts) || null };
})();
