/* Deli iz garaže, sklop 2 · zadaj: zadnje_luci, auspuh, prtljaznik, vlecne_kljuke, lovilci_blata. Each element registers its 16 options
   with DELI.add(id, build(K, n, m, M)) (js/deli.js; the contract: docs/deli.md). Loaded after js/deli.js, before the cars. Every option
   simple: a few primitives in the body's one material; round shapes in DELI.seg(K, k) segments (fewer on Normalni). The mounts (look units,
   js/cars/<id>.js):
     zadnje_luci: { x, zc, yc, w, h, hosts, bar }   the tail lamps' room on each side: the stock lamp's x (its lit face 2.3 cm behind it), its
                  middle (zc out from the car's middle, yc), w x h the room (KOLIBRI: the lamp strip, 0.14 x 0.30 m); hosts [left, right] the
                  lamps' parts; bar { x, y, w, h, part }: the band across the tail between them (KOLIBRI: the tailgate's garnish, half width w)
     auspuh:      { x, y, z, r, len, part }   the stock tip's end (x), height, |z| (the stock pipe on the left), radius, length; part: the pipes'
     prtljaznik:  { x: [x0, x1], glass, w, part }   the lid: the main loft's top from x0 (its rear edge) to x1 (its front edge; a hatch: the
                  tailgate's panel under its window), glass: where the window above it ends (a hatch's: its frame, the lexan; none: a boot lid),
                  w its half width; part: the lid's
     vlecne_kljuke: { f: [x, y, z], r: [x, y, z] }   the tow points on the bumpers' faces (front: bumperF, rear: bumperR)
     lovilci_blata: { x: [front, rear], z: [in, out], y: [top, foot], part }   the flaps behind the wheels (x), across (|z|), up */
(function () {
  'use strict';
  if (typeof DELI === 'undefined') return;
  const CF = [0.075, 0.078, 0.085], CF2 = [0.11, 0.115, 0.125], AL = [0.74, 0.76, 0.8], AL2 = [0.58, 0.6, 0.64], DK = [0.09, 0.09, 0.1], BLK = [0.035, 0.035, 0.04];
  const CHR = [0.88, 0.89, 0.93], STEEL = [0.46, 0.47, 0.5], HOLE = [0.02, 0.02, 0.025], RED = [0.78, 0.09, 0.07], WHT = [0.93, 0.93, 0.9], YEL = [1, 0.78, 0.1];
  const TI = [0.62, 0.6, 0.58], TIB = [0.36, 0.47, 0.84], TIP = [0.62, 0.38, 0.72], TIG = [0.92, 0.74, 0.38];   // (titanium: bare, its heat colours blue, purple, gold)
  const seg = (K, k) => DELI.seg(K, k);
  const weave = (i) => i % 2 ? CF : CF2;   // (carbon: neighbouring pieces in two shades, the weave catching the light)
  // a flat polygon facing out (its winding turned to the side out points to)
  const faceOut = (K, pts, col, out, o) => { const [a, b, c] = pts, u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; K.face(n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0 ? pts.slice().reverse() : pts, col, o); };

  // ================================================================ zadnje_luci: both tail lamps of option n
  // The lit parts are the tail mesh's (K.tailLamp: dark red, bright when braking); the glass round them, the rings and the details the body's,
  // in the lamps' parts (hosts): a lamp knocked out takes them with it. The band across the tail (bar) in its own part
  function zadnjeLuci(K, n, m) {
    const s = m.s || 1, W = m.w, H = m.h, F = m.x - 0.023, SP = F + 0.003, DP = F - 0.002;   // (F: the lit face; SP: the glass round it; DP: details in front)
    const SMK = [0.1, 0.085, 0.09], LENS = [0.17, 0.025, 0.03], CLR = [0.84, 0.85, 0.88], AMB = [1, 0.58, 0.08], AMBD = [0.36, 0.2, 0.06], HOUS = [0.05, 0.05, 0.055];
    for (const sd of [-1, 1]) {
      const host = m.hosts ? m.hosts[sd < 0 ? 0 : 1] : undefined, o = { host }, Z = (u) => sd * (m.zc + u * s), Y = (v) => m.yc + v * s;
      // a lit block (u out, v up, w x h; back: how far behind the lit face, at most the 5 mm to the body's face), a round one (diameter w)
      const lit = (u, v, w, h, back) => K.tailLamp(F + 0.023 + (back || 0), Y(v), Z(u), w * s, h * s, { host });
      const litR = (u, v, w, back) => K.tailLamp(F + 0.006 + (back || 0), Y(v), Z(u), w * s, w * s, { host, round: true, n: seg(K, 14) });
      const ring = (u, v, w, h, t, back) => { lit(u, v + (h - t) / 2, w, t, back); lit(u, v - (h - t) / 2, w, t, back); lit(u - (w - t) / 2, v, t, h - 2 * t, back); lit(u + (w - t) / 2, v, t, h - 2 * t, back); };   // (an outline of light)
      const glass = (u, v, w, h, col, dx) => K.rect(SP + (dx || 0), Y(v), Z(u), w * s, h * s, col, Object.assign({ dir: '-x' }, o));
      const det = (u, v, w, h, col, dx) => K.rect(DP - (dx || 0), Y(v), Z(u), w * s, h * s, col, Object.assign({ dir: '-x' }, o));
      const disc = (u, v, r, col, x) => K.discX(x, Y(v), Z(u), r * s, seg(K, 14), col, -1, o);
      const tiles = (cells, w, h) => { for (const [u, v] of cells) lit(u, v, w, h); };
      switch (n) {
        case 1:   // rdeče, nadomestne: one tall red lens in a thin chrome frame, its ribs across
          glass(0, 0, W, H, CHR, 0.0005); lit(0, 0, W - 0.012, H - 0.012);
          for (const v of [-0.07, 0, 0.07]) det(0, v, W - 0.014, 0.007, [0.3, 0.03, 0.03]); break;
        case 2:   // dimljene: smoked glass over all of it, the red lamp and the indicator dim behind it
          glass(0, 0, W, H, SMK); lit(0, -0.03, W - 0.04, H * 0.55); det(0, 0.105, W - 0.04, 0.04, AMBD); break;
        case 3:   // prozorne: clear glass, chrome bowls, two round red lamps, the indicator's bulb
          glass(0, 0, W, H, CLR); for (const v of [-0.075, 0.035]) { disc(0, v, 0.052, CHR, SP - 0.001); litR(0, v, 0.08); }
          disc(0, 0.115, 0.022, AMB, DP); break;
        case 4:   // okrogle: four round lamps (two a side) in a black panel, chrome rings
          glass(0, 0, W, H, HOUS); for (const v of [-0.07, 0.07]) { disc(0, v, 0.064, CHR, SP - 0.001); litR(0, v, 0.11); } break;
        case 5: case 6: case 7: case 8:   // LED (dimljene, tekoči smerniki, LED-trak): an outline of light round the lens
          glass(0, 0, W, H, n === 6 ? SMK : LENS); ring(0, 0, W - 0.01, H - 0.01, 0.014);
          if (n === 6) lit(0, 0.02, W - 0.06, 0.012);
          if (n === 7) for (let i = 0; i < 5; i++) det(0, -0.1 + i * 0.03, 0.06, 0.018, AMB);
          if (n === 8 && sd > 0) bar(K, m, LENS, 0.02);
          break;
        case 9: case 10:   // tovarniške LED (dimljene): a dark housing in a chrome rim, three blades of light, an amber blade over them
          glass(0, 0, W + 0.008, H + 0.008, n === 10 ? DK : CHR, 0.0005); glass(0, 0, W - 0.004, H - 0.004, n === 10 ? SMK : HOUS);
          for (const v of [-0.09, -0.03, 0.03]) lit(0, v, W - 0.03, 0.024);
          det(0, 0.095, W - 0.03, 0.024, n === 10 ? AMBD : AMB); break;
        case 11:   // 3D LED: three outlines of light one inside the other (a tunnel of light)
          glass(0, 0, W, H, LENS); ring(0, 0, W - 0.01, H - 0.01, 0.012); ring(0, 0, W * 0.66, H * 0.7, 0.01); ring(0, 0, W * 0.34, H * 0.4, 0.01); break;
        case 12:   // tovarniški LED-trak: two blades, the sequential amber under them, the band across the tail
          glass(0, 0, W, H, HOUS); for (const v of [0.02, 0.08]) lit(0, v, W - 0.02, 0.026);
          for (let i = 0; i < 4; i++) det(-0.045 + i * 0.03, -0.06, 0.022, 0.05, AMB);
          if (sd > 0) bar(K, m, LENS, 0.026, true); break;
        case 13:   // OLED: tiles of light in a black panel
          glass(0, 0, W, H, HOUS); tiles([[-0.032, -0.105], [0.032, -0.105], [-0.032, -0.035], [0.032, -0.035], [-0.032, 0.035], [0.032, 0.035], [-0.032, 0.105], [0.032, 0.105]], 0.054, 0.058); break;
        case 14:   // OLED, dimljene: thin tiles across, smoked
          glass(0, 0, W, H, SMK); for (let i = 0; i < 6; i++) lit(0, -0.115 + i * 0.046, W - 0.024, 0.026); break;
        case 15:   // OLED z animacijo: tiles stepping up and out, a line of light round them
          glass(0, 0, W, H, HOUS); tiles([[-0.04, -0.1], [-0.04, -0.04], [0, -0.07], [0, -0.01], [0.04, -0.04], [0.04, 0.02]], 0.036, 0.05); lit(0, 0.1, W - 0.02, 0.014); lit(0, 0.07, W - 0.06, 0.008); break;
        case 16:   // OLED-trak: tiles, the band across the tail in tiles of light colour
          glass(0, 0, W, H, HOUS); tiles([[-0.032, -0.08], [0.032, -0.08], [-0.032, -0.01], [0.032, -0.01], [-0.032, 0.06], [0.032, 0.06]], 0.054, 0.058);
          if (sd > 0) bar(K, m, LENS, 0.03, false, true); break;
      }
    }
  }
  // the band across the tail (LED-trak): red glass on the garnish in a dark frame (the body's: lit only the lamps), seq: amber at its ends,
  // seg: in tiles
  function bar(K, m, col, h, seq, tiles) {
    const B = m.bar; if (!B) return; const o = { part: B.part, dir: '-x' }, x = B.x - 0.004;
    K.rect(x + 0.0015, B.y, 0, B.w * 2, h + 0.016, BLK, o);
    if (tiles) { const k = 12, w = B.w * 2 / k; for (let i = 0; i < k; i++) K.rect(x, B.y, -B.w + w * (i + 0.5), w - 0.008, h, i % 2 ? col : [0.55, 0.05, 0.05], o); }
    else K.rect(x, B.y, 0, B.w * 2 - 0.01, h, [0.62, 0.05, 0.05], o);
    if (seq) for (const sd of [-1, 1]) K.rect(x - 0.001, B.y, sd * (B.w - 0.07), 0.12, h, [1, 0.58, 0.08], o);
  }

  // ================================================================ auspuh: the exhaust's tips under the tail (and what of the system shows)
  function auspuh(K, n, m) {
    const X = m.x, Y = m.y, Z = m.z, r0 = m.r, L = m.len, q = seg(K, 14);
    K.part(m.part || 'body', () => {
      // a tip at z: radius r, its outer colour, the rim (its end) and, inside, a second wall (inner: its colour) a little out of it
      const tip = (z, r, col, o) => { o = o || {}; const x = X - (o.out || 0), y = Y + (o.dy || 0);
        K.exhaust(x, y, z, r, o.len || L, { col, hole: o.inner ? (o.rim || col) : HOLE, n: q });
        if (o.inner) K.exhaust(x - 0.005, y, z, r * 0.74, 0.04, { col: o.inner, hole: HOLE, n: q }); };
      // an oval tip (rx across, ry up), its end slanted; in its colour, dark inside
      const oval = (z, rx, ry, col, o) => { o = o || {}; const k = seg(K, 12), ring = (x, sc) => Array.from({ length: k }, (_, i) => { const a = i / k * Math.PI * 2; return [x, Y + Math.sin(a) * ry * sc, z + Math.cos(a) * rx * sc]; });
        K.skin([ring(X + (o.len || L), 1), ring(X, 1)], col, null, HOLE);
        faceOut(K, ring(X - 0.0015, 0.8), [0.2, 0.2, 0.22], [-1, 0, 0]); faceOut(K, ring(X - 0.002, 0.66), HOLE, [-1, 0, 0]); };   // (its rim, dark inside)
      // the silencer: a drum across under the tail (rear silencer), along under the floor (forward: a pipe to it)
      const drum = (col, z0, z1) => K.cyl([X + 0.27, Y - 0.065, -Z * (z0 == null ? 1.15 : z0)], [X + 0.27, Y - 0.065, Z * (z1 == null ? 0.3 : z1)], 0.055, col, { n: q });
      const pipe = (z, col, x1) => K.cyl([X + L - 0.01, Y, z], [x1 || 0.6, Y - 0.07, z * 0.4], 0.024, col, { n: 5 });
      const valve = (z) => K.box(X + L * 0.6, Y + 0.025, z, 0.06, 0.045, 0.05, 0, BLK);
      const cut = (w) => K.rect(m.x + 0.03, Y, 0, w, 0.09, HOLE, { dir: '-x' });   // (a centre exit: the valance's cut-out round it)
      const L_ = -Z, R_ = Z;
      switch (n) {
        case 1: drum(STEEL); tip(L_, r0 * 0.95, STEEL); break;                                             // zadnji lonec
        case 2: drum(DK); tip(L_, 0.042, CHR, { inner: DK, rim: CHR }); break;                             // športni
        case 3: drum(DK, 1.15, 1.15); tip(L_, 0.036, CHR); tip(R_, 0.036, CHR); break;                    // dvojni
        case 4: drum(DK, 1.15, 1.15); oval(L_, 0.05, 0.03, CHR); oval(R_, 0.05, 0.03, CHR); valve(L_ * 0.8); break;   // z loputo
        case 5: drum(DK); tip(L_, 0.055, [0.14, 0.14, 0.15], { inner: CHR, rim: [0.25, 0.25, 0.27] }); break;   // dirkalni
        case 6: pipe(L_, STEEL, -0.2); tip(L_, 0.046, STEEL, { len: 0.3, out: 0.02 }); break;             // ravni
        case 7: drum(DK); oval(L_, 0.065, 0.045, CF, { len: 0.22 }); tip(L_, 0.026, TI, { out: 0.006, len: 0.06 }); break;   // karbonski
        case 8: drum(TI); tip(L_, 0.046, TIB, { len: 0.06 }); K.exhaust(X + 0.06, Y, L_, 0.046, 0.06, { col: TIP, n: q }); K.exhaust(X + 0.12, Y, L_, 0.046, 0.1, { col: TIG, n: q }); break;   // titanov
        case 9: drum(DK); pipe(L_, STEEL); tip(L_, 0.05, CHR, { inner: DK, rim: CHR }); break;           // kolektor in lonec
        case 10: drum(DK, 1.15, 1.15); pipe(L_, STEEL); pipe(R_, STEEL); tip(L_, 0.042, CHR, { inner: DK, rim: CHR }); tip(R_, 0.042, CHR, { inner: DK, rim: CHR }); break;   // cel sistem
        case 11: drum(DK, 1.15, 1.15); pipe(L_, STEEL); pipe(R_, STEEL); oval(L_, 0.058, 0.034, CHR); oval(R_, 0.058, 0.034, CHR); valve(L_ * 0.8); valve(R_ * 0.8); break;   // z loputo
        case 12: drum(DK, 0.5, 0.5); pipe(-0.09, STEEL); pipe(0.09, STEEL); cut(0.32); tip(-0.08, 0.045, [0.16, 0.16, 0.17], { inner: CHR, rim: [0.3, 0.3, 0.32], out: 0.02 }); tip(0.08, 0.045, [0.16, 0.16, 0.17], { inner: CHR, rim: [0.3, 0.3, 0.32], out: 0.02 }); break;   // dirkalni, sredinski
        case 13: drum(TI, 1.15, 1.15); pipe(L_, TI); pipe(R_, TI); tip(L_, 0.045, TIB, { inner: TIP, rim: TIG }); tip(R_, 0.045, TIB, { inner: TIP, rim: TIG }); break;   // titanov cel sistem
        case 14: drum(TI, 1.15, 1.15); pipe(L_, TI); pipe(R_, TI); for (const z of [L_ * 0.86, L_ * 1.14, R_ * 0.86, R_ * 1.14]) tip(z, 0.032, TIB, { rim: TIG, inner: TIP }); valve(L_ * 0.6); valve(R_ * 0.6); break;   // titanov z loputo
        case 15: drum(TI, 0.5, 0.5); pipe(0, TI); cut(0.24); tip(0, 0.068, TIB, { inner: TIG, rim: TIP, out: 0.025 }); break;   // titanov, dirkalni
        case 16: drum(TI, 1.15, 1.15); pipe(L_, TI); pipe(R_, TI); for (const z of [L_, R_]) { tip(z, 0.054, CF, { inner: TIB, rim: CF2, len: 0.16 }); K.exhaust(X + 0.16, Y, z, 0.04, 0.08, { col: TI, n: q }); } break;   // titanov s karbonskimi konci
      }
    });
  }

  // ================================================================ prtljaznik: the lid (a hatch: the tailgate) over the stock one's paint
  // The lid's skin laid on the main loft's top a few mm out (K.topY): from its rear edge x0 to x1, across its width; the window above it (a
  // hatch's: glass) framed, edged, its lexan's border; the lid's own lip spoiler at x1; quick-release pins; the garnish (the stock's dark band)
  function prtljaznik(K, n, m) {
    const X0 = m.x[0], X1 = m.x[1], XG = m.glass, W = m.w, P = K.paint;
    // a point of the top at t (0: X0 .. 1: X1; 1 .. 2 the window up to XG) and z, lifted along the surface's normal
    const xs = (t) => t <= 1 ? X0 + (X1 - X0) * t : X1 + ((XG || X1) - X1) * (t - 1);
    const nrm = (t) => { const a = xs(Math.max(0, t - 0.02)), b = xs(Math.min(XG ? 2 : 1, t + 0.02)), dx = b - a, dy = K.topY(b, 0) - K.topY(a, 0), l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
    const pt = (t, z, lift) => { const x = xs(t), nn = nrm(t), k = lift || 0.004; return [x + nn[0] * k, K.topY(x, z) + nn[1] * k, z]; };
    // a patch of the top (t0..t1, z0..z1), in pieces across where the crown bends; out: the side it faces (up the normal)
    const patch = (t0, t1, z0, z1, col, lift) => { const zs = [z0]; for (const z of [-0.38 * W, 0.38 * W]) if (z > z0 + 0.01 && z < z1 - 0.01) zs.push(z); zs.push(z1);
      for (let i = 0; i < zs.length - 1; i++) { const a = pt(t0, zs[i], lift), b = pt(t0, zs[i + 1], lift), c = pt(t1, zs[i + 1], lift), d = pt(t1, zs[i], lift), nn = nrm((t0 + t1) / 2);
        const q = [a, b, c, d], u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]], cx = u[1] * v[2] - u[2] * v[1], cy = u[2] * v[0] - u[0] * v[2];
        K.face(cx * nn[0] + cy * nn[1] < 0 ? q.reverse() : q, typeof col === 'function' ? col(i) : col); } };
    const lid = (col, e) => { e = e || 0.012; patch(0.03, 0.97, -W + e, W - e, col); };
    const garnish = (col) => { if (m.garnish) { const G = m.garnish; K.rect(G[0], G[1], 0, G[2], G[3], col, { dir: '-x' }); } };
    // the window's frame (its sides and top, k wide), a lexan's border (wider, black, rivets on it)
    const frame = (col, k) => { if (!XG) return; patch(1.02, 1.98, -W + 0.004, -W + 0.004 + k, col, 0.005); patch(1.02, 1.98, W - 0.004 - k, W - 0.004, col, 0.005); patch(1.9, 1.98, -W + 0.004, W - 0.004, col, 0.005); };
    const rivets = (col) => { if (!XG) return; for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) { const p = pt(1.12 + i * 0.24, sd * (W - 0.03), 0.007); K.rect(p[0], p[1], p[2], 0.012, 0.012, col, { dir: '-x' }); } };
    // its lip spoiler at the lid's front edge (a hatch: the window's foot), across, its ends tapered
    const lip = (col, big) => { const k = big ? 1.6 : 1.2, rings = [-W + 0.01, -W + 0.06, W - 0.06, W - 0.01].map((z, i) => { const e = i % 3 ? 1 : 0.5, b = pt(0.97, z, 0.002), nn = nrm(0.97), up = [-nn[1], nn[0]];
      return [[b[0] + up[0] * 0.02, b[1] + up[1] * 0.02], [b[0] + nn[0] * 0.05 * k * e, b[1] + nn[1] * 0.05 * k * e + 0.012 * k], [b[0] + nn[0] * 0.044 * k * e + up[0] * 0.03 * k, b[1] + nn[1] * 0.044 * k * e + up[1] * 0.03 * k], [b[0] + up[0] * 0.045, b[1] + up[1] * 0.045]].map(([x, y]) => [x, y, z]); });
      K.skin(rings, col, col, col); };
    // the quick-release pins: a disc and its clip at the lid's lower corners (and the window's upper ones)
    const pins = () => { for (const t of XG ? [0.12, 1.86] : [0.12, 0.88]) for (const sd of [-1, 1]) { const p = pt(t, sd * (W - 0.07), 0.006);
      K.discX(p[0], p[1], p[2], 0.016, seg(K, 8), CHR, -1); K.rect(p[0] - 0.002, p[1] - 0.01, p[2], 0.006, 0.026, RED, { dir: '-x' }); } };
    const lines = (col) => { for (const t of [0.3, 0.55, 0.8]) patch(t - 0.01, t + 0.01, -W + 0.03, W - 0.03, col, 0.0055); };   // (brushed: the grain's lines across)
    K.part(m.part || 'trunk', () => {
      switch (n) {
        case 1: case 2: lid([0.24, 0.25, 0.27]); garnish(DK); if (n === 2) lip([0.24, 0.25, 0.27]); break;   // jekleni (s spojlerjem): bare primer
        case 3: lid(P); garnish(P); patch(0.62, 0.64, -W + 0.05, W - 0.05, CHR, 0.0055); break;           // lakirani: the garnish in paint, a chrome line
        case 4: lid([0.86, 0.85, 0.79]); garnish(DK); break;                                                // steklena vlakna: the gelcoat
        case 5: case 6: lid(AL); lines(AL2); garnish(DK); if (n === 6) lip(AL); break;                     // aluminijast (s spojlerjem)
        case 7: case 8: lid(AL2); garnish(AL2); for (const t of [0.08, 0.92]) for (let i = 0; i < 9; i++) { const p = pt(t, -W + 0.05 + i * (W - 0.05) / 4, 0.006); K.rect(p[0], p[1], p[2], 0.012, 0.012, DK, { dir: '-x' }); }
          if (n === 8) lip(AL2); break;                                                                      // lažji: bare, riveted
        case 9: case 10: lid(weave); frame(weave, 0.04); garnish(DK); if (n === 10) lip(CF); break;      // karbonski (s spojlerjem)
        case 11: lid(weave); frame(weave, 0.05); garnish(CF2); patch(0.6, 0.66, -W + 0.03, W - 0.03, P, 0.0055); break;   // dvostranski: a band in paint
        case 12: lid([0.06, 0.062, 0.066]); frame([0.06, 0.062, 0.066], 0.05); garnish([0.06, 0.062, 0.066]); break;   // suhi: matte
        case 13: case 14: lid(weave); frame(weave, 0.04); garnish(DK); pins(); if (n === 14) lip(CF, true); break;   // dirkalni (s spojlerjem)
        case 15: case 16: lid(weave); frame(BLK, 0.075); rivets(AL); garnish(n === 16 ? CF2 : DK); pins(); if (n === 16) lip(CF, true); break;   // ultralahek, motošport: the lexan's border
      }
    });
  }

  // ================================================================ vlecne_kljuke: the tow points, front and / or rear
  function vlecneKljuke(K, n, m) {
    const q = seg(K, 10);
    // at a tow point (end: 1 the front, -1 the rear; dir: the way out of the face), in the bumper's part
    const at = (end, fn) => { const p = end > 0 ? m.f : m.r; if (p) K.part(end > 0 ? 'bumperF' : 'bumperR', () => fn(p[0], p[1], p[2], end)); };
    // a strap: a loop of webbing out of the bumper, folded flat, down from the tow point; its stitching; its plate
    const strap = (x, y, z, d, w, col) => { K.box(x + d * 0.009, y - 0.1, z, 0.012, 0.12, w, 0, col, col);
      K.rect(x + d * 0.0156, y - 0.005, z, w + 0.004, 0.012, WHT, { dir: d > 0 ? 'x' : '-x' }); K.box(x + d * 0.004, y - 0.012, z, 0.012, 0.03, w + 0.02, 0, BLK); };
    // a ring out of the face (an eye: its stem and its loop standing up), or folded flat against it
    const ring = (x, y, z, d, R, th, col, flat) => { const k = q, pts = [];
      for (let i = 0; i <= k; i++) { const a = i / k * Math.PI * 2; pts.push(flat ? [x + d * (th + 0.003), y - R + Math.cos(a) * R, z + Math.sin(a) * R] : [x + d * (R + 0.03 + Math.cos(a) * R), y + Math.sin(a) * R, z]); }
      K.sweep([[-th, -th], [th, -th], [th, th], [-th, th]], pts, col);
      if (!flat) K.cyl([x, y, z], [x + d * 0.032, y, z], th * 1.3, col, { n: 5 }); else K.box(x + d * 0.006, y - 0.012, z, 0.012, 0.03, 0.05, 0, BLK); };
    // a flat hook: a plate out of the face (up on its edge), its hole
    const plate = (x, y, z, d, l, col) => { K.endplate([[x - d * 0.004, y - 0.022], [x + d * l, y - 0.016], [x + d * (l + 0.012), y], [x + d * l, y + 0.016], [x - d * 0.004, y + 0.022]], z, 0.012, col);
      for (const sd of [-1, 1]) K.face(Array.from({ length: q }, (_, i) => { const a = i / q * Math.PI * 2 * -sd * d; return [x + d * (l - 0.012) + Math.cos(a) * 0.01, y + Math.sin(a) * 0.01, z + sd * 0.0065]; }), HOLE); };
    // the racing rules' arrow: a yellow triangle on the face pointing at the tow point
    const arrow = (x, y, z, d) => faceOut(K, [[x + d * 0.003, y + 0.05, z], [x + d * 0.003, y + 0.1, z - 0.035], [x + d * 0.003, y + 0.1, z + 0.035]], YEL, [d, 0, 0]);   // (over it, pointing down)
    switch (n) {
      case 1: case 2: at(-1, (x, y, z, d) => strap(x, y, z, d, n === 2 ? 0.07 : 0.045, RED)); break;            // vlečni trak (širok): the rear
      case 3: for (const e of [1, -1]) at(e, (x, y, z, d) => strap(x, y, z, d, 0.05, RED)); break;               // spredaj in zadaj
      case 4: at(-1, (x, y, z, d) => { strap(x, y, z, d, 0.05, RED); arrow(x, y, z, d); }); break;                // dirkalni trak
      case 5: for (const e of [1, -1]) at(e, (x, y, z, d) => ring(x, y, z, d, 0.028, 0.006, STEEL)); break;     // kljuke za vleko: steel eyes
      case 6: at(1, (x, y, z, d) => plate(x, y, z, d, 0.06, AL)); break;                                        // aluminijasta
      case 7: at(1, (x, y, z, d) => plate(x, y - 0.01, z, d, 0.035, AL2)); break;                               // ploščata: short, low
      case 8: at(1, (x, y, z, d) => plate(x, y, z, d, 0.06, K.strp)); break;                                    // barvna: the stripe's colour
      case 9: case 10: case 11: case 12: {                                                                       // zložljive: folded down against the bumper
        const col = n === 9 ? [0.16, 0.16, 0.17] : n === 10 ? [0.85, 0.12, 0.1] : n === 11 ? STEEL : CHR;
        at(1, (x, y, z, d) => ring(x, y, z, d, 0.03, 0.006, col, true)); break; }
      case 13: at(1, (x, y, z, d) => { ring(x, y, z, d, 0.034, 0.007, [0.95, 0.4, 0.06]); arrow(x, y, z, d); }); break;   // dirkalna, spredaj
      case 14: case 15: for (const e of [1, -1]) at(e, (x, y, z, d) => { ring(x, y, z, d, 0.034, 0.007, n === 15 ? TIB : [0.95, 0.4, 0.06]); arrow(x, y, z, d); }); break;   // spredaj in zadaj (titanovi)
      case 16: for (const e of [1, -1]) at(e, (x, y, z, d) => { strap(x, y, z, d, 0.05, RED); arrow(x, y, z, d); }); break;   // motošport: straps, the arrows
    }
  }

  // ================================================================ lovilci_blata: the flaps behind the wheels (the rear ones; 11 .. 16 all four)
  function lovilciBlata(K, n, m) {
    const all = n >= 11, P = K.paint, S = K.strp;
    K.part(m.part || 'body', () => {
      for (const [ax, x] of [[0, m.x[0]], [1, m.x[1]]]) { if (ax === 0 && !all) continue;
        for (const sd of [-1, 1]) {
          const z0 = m.z[0], z1 = m.z[1], top = m.y[0], foot = m.y[1], zc = sd * (z0 + z1) / 2, wz = z1 - z0, F = x - 0.006, o = { dir: '-x' };
          // the flap: a slab th thick, its foot at f (the rally ones lower), across wd; a band on its back (v0..v1 up from its foot)
          const flap = (col, th, f, wd) => K.box(x, f, zc, th, top - f, wd || wz, 0, col, col, false);
          const band = (col, v0, v1, f, th) => K.rect(x - (th || 0.008) / 2 - 0.001, f + (v0 + v1) / 2, zc, wz - 0.012, v1 - v0, col, o);
          // a shaped one (made to fit): its top following the arch out, the outer corner cut
          const shaped = (col, f) => { const q = [[top + 0.03, z0], [top, z1], [f + 0.03, z1], [f, z1 - 0.03], [f, z0]].map(([y, z]) => [x, y, sd * z]); K.plate(q, 0.01, col); };
          const bracket = () => { for (const k of [0.25, 0.75]) K.box(x + 0.012, top - 0.02, sd * (z0 + wz * k), 0.03, 0.025, 0.012, 0, AL); };
          switch (n) {
            case 1: flap(BLK, 0.008, foot); break;                                                         // gumijasti, črni
            case 2: flap(BLK, 0.008, foot); band(AL, 0.05, 0.07, foot); break;                             // lovilci blata
            case 3: flap(BLK, 0.008, foot); for (const [v0, v1] of [[0.005, 0.017], [top - foot - 0.017, top - foot - 0.005]]) band(RED, v0, v1, foot);
              for (const e of [-1, 1]) K.rect(F - 0.0005, (top + foot) / 2, zc + e * sd * (wz / 2 - 0.009), 0.012, top - foot - 0.01, RED, o); break;   // z robom
            case 4: flap(BLK, 0.008, foot, wz + 0.05); for (const v of [0.04, 0.09, 0.14]) band([0.09, 0.09, 0.1], v, v + 0.012, foot); break;   // široki, ribbed
            case 5: flap(BLK, 0.008, foot - 0.03); band(WHT, 0.02, 0.07, foot - 0.03); break;             // relijski
            case 6: flap(S, 0.008, foot - 0.03); band(WHT, 0.02, 0.06, foot - 0.03); break;               // barvni: the stripe's colour
            case 7: flap([0.18, 0.18, 0.19], 0.018, foot - 0.03); band(WHT, 0.0, 0.025, foot - 0.03, 0.018); K.box(x, top - 0.03, zc, 0.03, 0.03, wz + 0.01, 0, BLK); break;   // debeli
            case 8: flap(WHT, 0.008, foot - 0.03); if (ax === 1) K.number(F - 0.001, (top + foot - 0.03) / 2 + 0.01, zc, 0.11, { dir: '-x', bg: WHT, w: wz - 0.03 }); break;   // s številko
            case 9: shaped(BLK, foot); break;                                                              // za ta avto
            case 10: shaped(P, foot); break;                                                               // za ta avto, barvni
            case 11: shaped(BLK, foot); break;                                                             // za vsa kolesa
            case 12: shaped(BLK, foot); bracket(); break;                                                  // z nosilci
            case 13: flap(BLK, 0.006, foot - 0.035); band(WHT, 0.02, 0.06, foot - 0.035, 0.006); band(RED, top - foot + 0.005, top - foot + 0.025, foot - 0.035, 0.006); break;   // dirkalni, 4 mm
            case 14: flap([0.75, 0.08, 0.06], 0.01, foot - 0.035); band(WHT, 0.02, 0.05, foot - 0.035, 0.01); break;   // poliuretan
            case 15: flap(BLK, 0.008, foot - 0.035); band(WHT, 0.02, 0.06, foot - 0.035); bracket(); break;   // s ščitniki (the sills' guards below)
            case 16: flap(S, 0.01, foot - 0.035); band(WHT, 0.02, 0.07, foot - 0.035, 0.01); band(P, 0.08, 0.1, foot - 0.035, 0.01); bracket(); break;   // tovarniški relijski
          }
        }
      }
      if (n >= 15 && m.sill) for (const sd of [-1, 1]) { const [xa, xb, y, z] = m.sill;   // (the sills' guards: a black plate along each, between the flaps)
        K.box((xa + xb) / 2, y, sd * z, xb - xa, 0.07, 0.012, 0, n === 16 ? [0.12, 0.12, 0.13] : BLK); }
    });
  }

  DELI.add('zadnje_luci', zadnjeLuci);
  DELI.add('auspuh', auspuh);
  DELI.add('prtljaznik', prtljaznik);
  DELI.add('vlecne_kljuke', vlecneKljuke);
  DELI.add('lovilci_blata', lovilciBlata);
})();
