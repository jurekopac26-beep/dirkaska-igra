/* Life in the woods (the user's wish, 1. 11. 2026: »elementi in živali naključno po gozdovih, tudi notri v gozdu, glede na državo proge,
   čim več različnih živali na čim več progah«): on every real track (not test: true) small glades are cut into the woods along the road,
   each with a thing of the place (a hunting stand, a deer feeder, a log pile, a fallen tree, a hut, a painted bee house, a hayrack, a water
   tank, a wind pump, a torii, a stone lantern, a vending machine ...) or a group of 2-5 animals of the region (ZIV: roe deer and boar in the
   Eifel, chamois and ibex on Vršič, moose in Finland, kangaroos and cockatoos at Bathurst, macaques and sika deer at Nikko, capybaras and
   caimans at Rio ...). World.life(o) runs at the end of every build (finish in js/world.js): the woods are read from the instanced trees
   (o.cull: IChunks), the glade's trees are taken out (their instances scaled to nothing), everything is merged into one vertex-coloured
   mesh per 256 m chunk (one draw call per chunk in view, far chunks culled like the plants on the lower tiers). No animation, no sound. */
(function () {
  if (typeof World === 'undefined') return;
  const TAU = Math.PI * 2;

  /* ---------------- the models (built once with THREE, baked into vertex arrays: TPL) ---------------- */
  const MC = new Map(), GC = new Map();
  const lam = (c) => { let m = MC.get(c); if (!m) MC.set(c, m = new THREE.MeshLambertMaterial({ color: c })); return m; };
  const flat = (g) => { const n = g.index ? g.toNonIndexed() : g; n.computeVertexNormals(); return n; };
  const gBox = (w, h, d) => { const k = 'b' + w + ',' + h + ',' + d; let g = GC.get(k); if (!g) GC.set(k, g = new THREE.BoxGeometry(w, h, d)); return g; };
  const gCyl = (rt, rb, h, n) => { const k = 'c' + rt + ',' + rb + ',' + h + ',' + n; let g = GC.get(k); if (!g) GC.set(k, g = flat(new THREE.CylinderGeometry(rt, rb, h, n))); return g; };
  const gSph = (r, w, h, half) => { const k = 's' + r + ',' + w + ',' + h + ',' + half; let g = GC.get(k); if (!g) GC.set(k, g = flat(new THREE.SphereGeometry(r, w, h, 0, TAU, 0, half ? Math.PI / 2 : Math.PI))); return g; };
  const gTBox = (wb, wt, h, db, dt) => { const k = 't' + [wb, wt, h, db, dt]; let g = GC.get(k); if (g) return g;   // a tapered box, its origin at the bottom
    g = new THREE.BoxGeometry(1, 1, 1); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const top = p.getY(i) > 0; p.setXYZ(i, p.getX(i) * (top ? wt : wb), p.getY(i) * h + h / 2, p.getZ(i) * (top ? dt : db)); }
    g.computeVertexNormals(); GC.set(k, g); return g; };
  function mesh(g, c, x, y, z, o) {
    const e = new THREE.Mesh(g, lam(c)); e.position.set(x || 0, y || 0, z || 0);
    if (o) { if (o.rx) e.rotation.x = o.rx; if (o.ry) e.rotation.y = o.ry; if (o.rz) e.rotation.z = o.rz; if (o.s) e.scale.set(o.s[0], o.s[1], o.s[2]); }
    return e;
  }
  const box = (w, h, d, c, x, y, z, o) => mesh(gBox(w, h, d), c, x, y, z, o);
  const tbox = (wb, wt, h, db, dt, c, x, y, z, o) => mesh(gTBox(wb, wt, h, db, dt), c, x, y, z, o);
  const cyl = (rt, rb, h, n, c, x, y, z, o) => mesh(gCyl(rt, rb, h, n), c, x, y, z, o);
  const sph = (r, w, h, c, x, y, z, o) => mesh(gSph(r, w, h, o && o.half), c, x, y, z, o);
  const grp = (...ch) => { const g = new THREE.Group(); for (const c of ch) if (c) g.add(c); return g; };
  const UP = new THREE.Vector3(0, 1, 0);
  function bar(a, b, t, c) {   // a box from a to b (rails, legs, antlers)
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz);
    const e = mesh(gBox(t, L, t), c, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); e.quaternion.setFromUnitVectors(UP, new THREE.Vector3(dx / L, dy / L, dz / L)); return e;
  }

  // A four-legged animal along +z (head forward), its feet at y = 0. o: L (body length), H (shoulder height), W (width), bh (body height), col, belly,
  // legs, head, neck (length), nk (neck angle), hs (head size), snout, ears, tail, horns ('roe' | 'stag' | 'moose' | 'hook' | 'ibex' | 'curl' | 'cow'),
  // rump (the white patch), graze (head down), hump, mane, dewlap
  function beast(o) {
    const g = new THREE.Group(), L = o.L, H = o.H, W = o.W || L * 0.38, lt = o.lt || W * 0.28, col = o.col, legs = o.legs || col, hc = o.head || col, bh = o.bh || W * 0.95;
    g.add(tbox(W, W * 0.9, bh, L, L * 0.96, col, 0, H - 0.02, 0));
    if (o.belly) g.add(box(W * 0.8, 0.04, L * 0.7, o.belly, 0, H - 0.03, 0));
    if (o.rump) g.add(box(W * 0.85, bh * 0.6, 0.04, o.rump, 0, H + bh * 0.4, -L / 2 - 0.01));
    if (o.stripe) g.add(box(W * 0.3, 0.03, L * 0.9, o.stripe, 0, H + bh * 0.9 + 0.01, 0));
    if (o.hump) g.add(sph(W * 0.62, 7, 4, o.humpCol || col, 0, H + bh * 0.95, L * 0.22, { half: true, s: [1, 1, 1.4] }));
    if (o.mane) g.add(box(W * 0.35, bh * 0.5, L * 0.45, o.mane, 0, H + bh + 0.02, L * 0.2));
    if (o.shag) g.add(box(W * 1.08, bh * 0.45, L * 0.95, o.shag, 0, H - 0.2, 0));
    for (const [x, z] of [[W / 2 - lt / 2, L / 2 - lt], [-(W / 2 - lt / 2), L / 2 - lt], [W / 2 - lt / 2, -L / 2 + lt], [-(W / 2 - lt / 2), -L / 2 + lt]]) g.add(box(lt, H, lt * 1.1, legs, x, H / 2, z));
    const nl = o.neck != null ? o.neck : L * 0.45, ang = o.graze ? -0.75 : (o.nk != null ? o.nk : 0.8), hs = o.hs || W * 0.75;
    const n0 = [0, H + bh * 0.62, L / 2 - 0.05], n1 = [0, n0[1] + Math.sin(ang) * nl, n0[2] + Math.cos(ang) * nl];
    if (nl > 0.05) g.add(bar(n0, n1, W * 0.42, o.neckCol || col));
    const head = new THREE.Group(); head.position.set(n1[0], n1[1], n1[2]); head.rotation.x = o.graze ? 0.9 : (o.headTilt || 0.25); g.add(head);
    const sn = o.snout || 0.6;
    head.add(box(hs * 0.7, hs * 0.72, hs, hc, 0, 0, hs * 0.25)); head.add(box(hs * 0.5, hs * 0.45, sn * hs, o.snoutCol || hc, 0, -hs * 0.1, hs * 0.65 + sn * hs * 0.3));
    head.add(box(hs * 0.22, hs * 0.18, 0.03, o.nose || 0x15110e, 0, -hs * 0.05, hs * 0.7 + sn * hs * 0.8));
    const ear = o.ears || 0.35; for (const sd of [1, -1]) head.add(box(hs * 0.14, hs * ear, hs * 0.08, o.earCol || hc, sd * hs * 0.3, hs * 0.38 + hs * ear / 2, hs * 0.05, { rz: -sd * 0.35 }));
    const hn = o.horns, hcol = o.hornCol || 0x6b5a44;
    for (const sd of [1, -1]) {
      if (hn === 'roe') { head.add(bar([sd * hs * 0.15, hs * 0.35, hs * 0.2], [sd * hs * 0.2, hs * 0.9, hs * 0.15], 0.035, hcol)); head.add(bar([sd * hs * 0.18, hs * 0.65, hs * 0.18], [sd * hs * 0.2, hs * 0.75, hs * 0.38], 0.03, hcol)); }
      else if (hn === 'stag') { const b0 = [sd * hs * 0.18, hs * 0.35, hs * 0.15], b1 = [sd * hs * 0.75, hs * 1.4, -hs * 0.25], b2 = [sd * hs * 0.95, hs * 2.1, -hs * 0.05];
        head.add(bar(b0, b1, 0.05, hcol)); head.add(bar(b1, b2, 0.045, hcol)); head.add(bar([sd * hs * 0.4, hs * 0.75, 0], [sd * hs * 0.45, hs * 0.85, hs * 0.5], 0.04, hcol)); head.add(bar(b1, [sd * hs * 0.75, hs * 1.6, hs * 0.35], 0.04, hcol)); head.add(bar(b2, [sd * hs * 1.25, hs * 2.3, -hs * 0.2], 0.035, hcol)); }
      else if (hn === 'moose') { head.add(bar([sd * hs * 0.2, hs * 0.35, 0], [sd * hs * 0.75, hs * 0.55, -hs * 0.05], 0.06, 0xb9a27c)); head.add(box(hs * 0.85, 0.05, hs * 0.75, 0xb9a27c, sd * hs * 1.05, hs * 0.7, -hs * 0.05, { rz: sd * 0.35 })); }
      else if (hn === 'hook') { head.add(bar([sd * hs * 0.12, hs * 0.38, hs * 0.2], [sd * hs * 0.14, hs * 0.8, hs * 0.2], 0.03, 0x15110e)); head.add(bar([sd * hs * 0.14, hs * 0.8, hs * 0.2], [sd * hs * 0.14, hs * 0.75, 0.0], 0.028, 0x15110e)); }
      else if (hn === 'ibex') { head.add(bar([sd * hs * 0.13, hs * 0.38, hs * 0.2], [sd * hs * 0.18, hs * 1.0, -hs * 0.2], 0.06, hcol)); head.add(bar([sd * hs * 0.18, hs * 1.0, -hs * 0.2], [sd * hs * 0.2, hs * 1.2, -hs * 0.8], 0.05, hcol)); }
      else if (hn === 'curl') { const hc2 = o.hornCol || 0xb9a27c; head.add(bar([sd * hs * 0.2, hs * 0.38, hs * 0.1], [sd * hs * 0.55, hs * 0.5, -hs * 0.25], 0.08, hc2)); head.add(bar([sd * hs * 0.55, hs * 0.5, -hs * 0.25], [sd * hs * 0.55, 0, -hs * 0.15], 0.075, hc2)); head.add(bar([sd * hs * 0.55, 0, -hs * 0.15], [sd * hs * 0.5, hs * 0.05, hs * 0.25], 0.07, hc2)); }
      else if (hn === 'cow') head.add(bar([sd * hs * 0.3, hs * 0.38, hs * 0.1], [sd * hs * 0.6, hs * 0.55, hs * 0.2], 0.04, o.hornCol || 0xe9e2cf));
    }
    if (o.dewlap) head.add(box(hs * 0.12, hs * 0.5, hs * 0.2, col, 0, -hs * 0.55, hs * 0.2));
    const tl = o.tail || 'short', tc = o.tailCol || col, t0 = [0, H + bh * 0.75, -L / 2];
    if (tl === 'short') g.add(bar(t0, [0, H + bh * 0.5, -L / 2 - 0.12], 0.06, tc));
    else if (tl === 'long') g.add(bar(t0, [0, H * 0.45, -L / 2 - 0.25], 0.06, tc));
    else if (tl === 'bushy') { g.add(bar(t0, [0, H * 0.75, -L / 2 - L * 0.6], W * 0.4, tc)); if (o.tip) g.add(box(W * 0.42, W * 0.42, 0.12, o.tip, 0, H * 0.72, -L / 2 - L * 0.62)); }
    else if (tl === 'ringed') { for (let k = 0; k < 4; k++) g.add(bar([0, H + bh * 0.7 - k * 0.04, -L / 2 - k * L * 0.18], [0, H + bh * 0.66 - (k + 1) * 0.04, -L / 2 - (k + 1) * L * 0.18], W * 0.28, k % 2 ? o.tip || 0x2a221c : tc)); }
    else if (tl === 'tuft') { g.add(bar(t0, [0, H * 0.6, -L / 2 - 0.05], 0.04, tc)); g.add(box(0.1, 0.18, 0.1, o.tip || 0x15110e, 0, H * 0.55, -L / 2 - 0.06)); }
    else if (tl === 'curly') g.add(sph(0.06, 5, 3, tc, 0, H + bh * 0.8, -L / 2 - 0.03));
    else if (tl === 'croc') { g.add(bar([0, H + bh * 0.4, -L / 2], [0, 0.08, -L / 2 - L * 0.9], W * 0.45, tc)); }
    return g;
  }
  function kangaroo(o) { o = o || {}; const g = new THREE.Group(), c = o.col || 0xa8754a, cb = o.belly || 0xd8b48a;
    g.add(box(0.36, 0.22, 0.6, c, 0, 0.11, 0.05)); for (const sd of [1, -1]) g.add(box(0.13, 0.4, 0.34, c, sd * 0.16, 0.32, -0.05, { rx: 0.5 }));
    g.add(tbox(0.4, 0.26, 0.75, 0.38, 0.24, c, 0, 0.32, -0.04, { rx: -0.25 })); g.add(box(0.22, 0.42, 0.04, cb, 0, 0.62, 0.1, { rx: -0.25 }));
    g.add(box(0.2, 0.22, 0.32, c, 0, 1.12, 0.18)); g.add(box(0.12, 0.12, 0.16, c, 0, 1.08, 0.38)); for (const sd of [1, -1]) g.add(box(0.06, 0.2, 0.05, c, sd * 0.07, 1.32, 0.12, { rz: -sd * 0.2 }));
    for (const sd of [1, -1]) g.add(bar([sd * 0.12, 0.85, 0.16], [sd * 0.1, 0.62, 0.34], 0.05, c));
    g.add(bar([0, 0.25, -0.35], [0, 0.05, -1.15], 0.13, c)); g.scale.setScalar(o.s || 1); return g; }
  function emu() { const g = new THREE.Group(), c = 0x5a4a3c; g.add(sph(0.38, 7, 4, c, 0, 1.0, 0, { s: [0.8, 0.8, 1.15] }));
    for (const sd of [1, -1]) { g.add(bar([sd * 0.1, 0.85, 0], [sd * 0.12, 0.42, 0.05], 0.06, 0x7a6a58)); g.add(bar([sd * 0.12, 0.42, 0.05], [sd * 0.12, 0.02, -0.02], 0.045, 0x7a6a58)); }
    g.add(bar([0, 1.15, 0.28], [0, 1.7, 0.42], 0.08, 0x6a7a8a)); g.add(box(0.12, 0.12, 0.18, 0x3a3a3a, 0, 1.74, 0.48)); return g; }
  function wombat(c) { const g = new THREE.Group(); c = c || 0x7a6a5a; g.add(sph(0.3, 7, 4, c, 0, 0.3, 0, { s: [0.9, 0.75, 1.3] })); g.add(box(0.26, 0.22, 0.22, c, 0, 0.32, 0.38)); g.add(box(0.14, 0.1, 0.06, 0x2a2420, 0, 0.3, 0.5));
    for (const [x, z] of [[0.15, 0.2], [-0.15, 0.2], [0.15, -0.2], [-0.15, -0.2]]) g.add(box(0.1, 0.14, 0.1, c, x, 0.07, z)); return g; }
  function bird(col, o) { o = o || {}; const g = new THREE.Group(), s = o.s || 1, c = col || 0xf2f2ee;
    g.add(sph(0.12 * s, 6, 3, c, 0, 0.14 * s + (o.legs || 0), 0, { s: [0.8, 1.0, 1.3] })); g.add(sph(0.07 * s, 5, 3, o.headCol || c, 0, 0.27 * s + (o.legs || 0) + (o.neck || 0), 0.08 * s));
    g.add(box(0.04 * s, 0.04 * s, (o.beak || 0.06) * s, o.beakCol || 0x2a2420, 0, 0.26 * s + (o.legs || 0) + (o.neck || 0), 0.15 * s + (o.beak || 0.06) * s / 2));
    if (o.crest) g.add(box(0.03, 0.1, 0.06, o.crest, 0, 0.35 + (o.legs || 0), 0.05, { rx: -0.4 }));
    if (o.wing) g.add(box(0.2 * s, 0.06 * s, 0.25 * s, o.wing, 0, 0.16 * s + (o.legs || 0), -0.05 * s));
    if (o.legs) for (const sd of [1, -1]) g.add(box(0.025, o.legs, 0.025, o.legCol || 0xd8262a, sd * 0.04, o.legs / 2, 0));
    if (o.neck) g.add(box(0.05 * s, o.neck + 0.05, 0.05 * s, o.headCol || c, 0, 0.22 * s + (o.legs || 0) + o.neck / 2, 0.08 * s));
    return g; }
  function bear(col) { const g = new THREE.Group(), c = col || 0x5a3c26; g.add(tbox(0.75, 0.7, 0.75, 1.5, 1.3, c, 0, 0.45, 0)); g.add(sph(0.38, 7, 4, c, 0, 1.0, 0.35, { half: true }));
    for (const [x, z] of [[0.25, 0.5], [-0.25, 0.5], [0.25, -0.5], [-0.25, -0.5]]) g.add(box(0.22, 0.5, 0.25, c, x, 0.25, z)); g.add(box(0.42, 0.4, 0.4, c, 0, 0.9, 0.85)); g.add(box(0.22, 0.2, 0.22, 0x8a6a4a, 0, 0.82, 1.1));
    for (const sd of [1, -1]) g.add(box(0.12, 0.12, 0.06, c, sd * 0.17, 1.14, 0.8)); return g; }
  function monkey(col, face) { const g = new THREE.Group(), c = col || 0x8a7a6a; g.add(sph(0.2, 6, 4, c, 0, 0.3, 0, { s: [1, 1.3, 0.9] })); g.add(sph(0.13, 6, 4, c, 0, 0.62, 0.03)); g.add(box(0.14, 0.12, 0.05, face || 0xd86a5a, 0, 0.6, 0.15));
    for (const sd of [1, -1]) { g.add(bar([sd * 0.15, 0.42, 0.05], [sd * 0.12, 0.1, 0.22], 0.06, c)); g.add(box(0.1, 0.1, 0.28, c, sd * 0.12, 0.06, 0.12)); } g.add(bar([0, 0.18, -0.15], [0, 0.05, -0.55], 0.04, c)); return g; }
  function croc() { const g = beast({ L: 1.6, H: 0.12, W: 0.42, bh: 0.2, col: 0x4a5a3a, belly: 0x9aa07a, neck: 0.05, nk: 0, hs: 0.3, snout: 1.6, ears: 0.05, tail: 'croc', lt: 0.1 }); return g; }
  // the species (kind -> model); a group's young as a smaller copy (YOUNG)
  const SPECIES = {
    roe: () => beast({ L: 0.95, H: 0.62, W: 0.3, col: 0x9a5a32, belly: 0xc8a888, rump: 0xf0ece4, legs: 0x8a5a3a, neck: 0.38, nk: 1.0, hs: 0.2, ears: 0.55, horns: 'roe', tail: 'none' }),
    roeF: () => beast({ L: 0.9, H: 0.6, W: 0.28, col: 0x9a5a32, belly: 0xc8a888, rump: 0xf0ece4, legs: 0x8a5a3a, neck: 0.36, nk: 0.9, hs: 0.19, ears: 0.6, tail: 'none', graze: true }),
    stag: () => beast({ L: 1.6, H: 1.0, W: 0.5, col: 0x7a4a2a, neckCol: 0x5a3a24, legs: 0x5a3a24, rump: 0xd8c09a, neck: 0.6, nk: 1.05, hs: 0.32, snout: 0.7, ears: 0.5, horns: 'stag', tail: 'short' }),
    hind: () => beast({ L: 1.45, H: 0.95, W: 0.45, col: 0x8a5a32, legs: 0x6a4a2a, rump: 0xd8c09a, neck: 0.55, nk: 0.5, hs: 0.3, ears: 0.55, tail: 'short', graze: true }),
    boar: () => beast({ L: 1.25, H: 0.42, W: 0.42, bh: 0.5, col: 0x3a322c, legs: 0x2a241f, neck: 0.12, nk: 0.1, hs: 0.36, snout: 1.0, snoutCol: 0x2a241f, nose: 0x8a6a5a, ears: 0.3, tail: 'tuft', mane: 0x2a241f }),
    piglet: () => beast({ L: 0.5, H: 0.2, W: 0.2, bh: 0.2, col: 0x8a6a4a, stripe: 0xd8c09a, neck: 0.04, nk: 0.1, hs: 0.16, snout: 0.9, ears: 0.3, tail: 'short' }),
    fox: () => beast({ L: 0.7, H: 0.38, W: 0.2, bh: 0.22, col: 0xd86a24, belly: 0xf2ece4, legs: 0x2a221c, neck: 0.18, nk: 0.6, hs: 0.17, snout: 0.9, snoutCol: 0xd86a24, ears: 0.7, earCol: 0x2a221c, tail: 'bushy', tip: 0xf2f0ea }),
    hare: () => beast({ L: 0.48, H: 0.2, W: 0.22, bh: 0.26, col: 0x8a7258, neck: 0.08, nk: 1.0, hs: 0.15, snout: 0.5, ears: 1.3, tail: 'curly', tailCol: 0xf2f0ea }),
    moose: () => beast({ L: 2.1, H: 1.35, W: 0.62, bh: 0.75, col: 0x3a2a1e, legs: 0x8a7a68, neck: 0.55, nk: 0.45, hs: 0.42, snout: 1.0, ears: 0.45, horns: 'moose', dewlap: true, tail: 'short', hump: true }),
    mooseF: () => beast({ L: 1.9, H: 1.25, W: 0.56, bh: 0.7, col: 0x4a3626, legs: 0x8a7a68, neck: 0.5, nk: 0.3, hs: 0.4, snout: 1.0, ears: 0.5, dewlap: true, tail: 'short', hump: true, graze: true }),
    chamois: () => beast({ L: 1.05, H: 0.62, W: 0.32, col: 0x5a4632, head: 0xe9e2cf, legs: 0x3a2e24, neck: 0.3, nk: 0.9, hs: 0.2, ears: 0.5, horns: 'hook', tail: 'short' }),
    ibex: () => beast({ L: 1.25, H: 0.72, W: 0.4, col: 0x8a7a64, legs: 0x5a4a3a, neck: 0.3, nk: 0.8, hs: 0.24, ears: 0.4, horns: 'ibex', hornCol: 0x7a6a54, tail: 'short' }),
    goatW: () => beast({ L: 1.3, H: 0.75, W: 0.42, col: 0xf0ede4, legs: 0xe0dccf, neck: 0.3, nk: 0.8, hs: 0.24, ears: 0.4, horns: 'hook', tail: 'short', shag: 0xe6e1d3 }),
    cow: () => beast({ L: 1.9, H: 0.9, W: 0.62, bh: 0.65, col: 0xf2efe6, legs: 0xe9e2cf, neck: 0.25, nk: 0.2, hs: 0.36, snout: 0.7, snoutCol: 0xe8b8a8, ears: 0.3, horns: 'cow', tail: 'long', graze: true, belly: 0x5a3a24 }),
    cowB: () => beast({ L: 1.9, H: 0.9, W: 0.62, bh: 0.65, col: 0x8a5a3a, legs: 0x7a4a2a, neck: 0.25, nk: 0.2, hs: 0.36, snout: 0.7, ears: 0.3, horns: 'cow', tail: 'long' }),
    cowK: () => beast({ L: 1.9, H: 0.9, W: 0.62, bh: 0.65, col: 0x1d1a18, legs: 0x1d1a18, neck: 0.25, nk: 0.2, hs: 0.36, snout: 0.7, ears: 0.3, tail: 'long', graze: true }),
    sheep: () => beast({ L: 1.0, H: 0.48, W: 0.5, bh: 0.5, col: 0xe9e4d6, legs: 0x2a241f, head: 0x2a241f, neck: 0.15, nk: 0.3, hs: 0.2, ears: 0.3, tail: 'short', graze: true }),
    bighorn: () => beast({ L: 1.25, H: 0.78, W: 0.42, col: 0x7a5a3a, legs: 0x6a4a2a, rump: 0xe9e2cf, neck: 0.3, nk: 0.7, hs: 0.26, ears: 0.35, horns: 'curl', tail: 'short' }),
    mouflon: () => beast({ L: 1.1, H: 0.7, W: 0.38, col: 0x8a4a2a, belly: 0xe9e2cf, legs: 0xd8d2c8, neck: 0.3, nk: 0.7, hs: 0.24, ears: 0.35, horns: 'curl', hornCol: 0x8a7a64, tail: 'short' }),
    bison: () => beast({ L: 2.4, H: 1.0, W: 0.85, bh: 0.9, col: 0x4a3222, humpCol: 0x3a2618, legs: 0x2a1c12, neck: 0.15, nk: -0.2, hs: 0.5, snout: 0.5, ears: 0.25, horns: 'cow', hornCol: 0x2a221c, tail: 'tuft', hump: true, mane: 0x2a1c12 }),
    elk: () => beast({ L: 1.75, H: 1.15, W: 0.55, col: 0x8a6a4a, neckCol: 0x4a3222, legs: 0x4a3222, rump: 0xd8c09a, neck: 0.65, nk: 0.95, hs: 0.34, snout: 0.7, ears: 0.5, horns: 'stag', tail: 'short' }),
    muleDeer: () => beast({ L: 1.4, H: 0.9, W: 0.42, col: 0x8a7a68, rump: 0xf0ece4, legs: 0x7a6a58, neck: 0.45, nk: 0.9, hs: 0.27, ears: 0.9, tail: 'short', tailCol: 0x15110e }),
    coyote: () => beast({ L: 0.75, H: 0.45, W: 0.22, bh: 0.24, col: 0xa88a64, belly: 0xd8c8a8, neck: 0.2, nk: 0.6, hs: 0.18, snout: 0.9, ears: 0.6, tail: 'bushy', tip: 0x2a221c }),
    capybara: () => beast({ L: 1.0, H: 0.32, W: 0.45, bh: 0.48, col: 0x8a5a3a, neck: 0.08, nk: 0.2, hs: 0.3, snout: 0.9, ears: 0.2, tail: 'none' }),
    coati: () => beast({ L: 0.55, H: 0.25, W: 0.2, bh: 0.2, col: 0x8a5a32, belly: 0xd8b48a, neck: 0.1, nk: 0.4, hs: 0.15, snout: 1.4, ears: 0.3, tail: 'ringed', tip: 0x2a1a10 }),
    guanaco: () => beast({ L: 1.2, H: 0.9, W: 0.38, col: 0xb07a4a, belly: 0xe9e2cf, head: 0x8a8a8a, neck: 0.75, nk: 1.25, hs: 0.2, snout: 0.8, ears: 0.6, tail: 'short' }),
    camel: () => beast({ L: 2.0, H: 1.3, W: 0.6, bh: 0.6, col: 0xc89a64, neck: 0.85, nk: 0.55, hs: 0.3, snout: 0.9, ears: 0.25, tail: 'tuft', hump: true }),
    donkey: () => beast({ L: 1.3, H: 0.8, W: 0.42, col: 0x8a8278, belly: 0xd8d2c8, neck: 0.4, nk: 0.8, hs: 0.3, snout: 0.8, snoutCol: 0xd8d2c8, ears: 1.0, tail: 'tuft', mane: 0x3a342e }),
    horse: () => beast({ L: 1.9, H: 1.15, W: 0.55, col: 0x6a3e22, legs: 0x3a2214, neck: 0.75, nk: 0.85, hs: 0.3, snout: 1.0, ears: 0.4, tail: 'long', tailCol: 0x2a1a10, mane: 0x2a1a10 }),
    horseG: () => beast({ L: 1.8, H: 1.1, W: 0.55, col: 0xc8c2b8, legs: 0x8a8278, neck: 0.7, nk: 0.4, hs: 0.3, snout: 1.0, ears: 0.4, tail: 'long', tailCol: 0x6a6258, mane: 0x6a6258, graze: true }),
    yak: () => beast({ L: 1.9, H: 0.85, W: 0.7, bh: 0.7, col: 0x2a221c, legs: 0x2a221c, neck: 0.15, nk: 0.0, hs: 0.42, snout: 0.6, ears: 0.25, horns: 'cow', hornCol: 0xe9e2cf, tail: 'long', hump: true, shag: 0x1d1814 }),
    buffalo: () => beast({ L: 2.1, H: 0.85, W: 0.75, bh: 0.75, col: 0x3a3a3c, neck: 0.2, nk: 0.1, hs: 0.42, snout: 0.6, ears: 0.3, horns: 'curl', hornCol: 0x5a5a58, tail: 'tuft' }),
    sika: () => beast({ L: 1.25, H: 0.8, W: 0.38, col: 0x8a5a32, belly: 0xe9e2cf, rump: 0xf2f0ea, stripe: 0x6a3e22, neck: 0.45, nk: 1.0, hs: 0.26, ears: 0.55, horns: 'roe', tail: 'short' }),
    serow: () => beast({ L: 1.15, H: 0.72, W: 0.4, col: 0x3a3632, head: 0x5a5650, neck: 0.25, nk: 0.6, hs: 0.26, ears: 0.6, horns: 'hook', tail: 'short', mane: 0xd8d2c8 }),
    devil: () => beast({ L: 0.6, H: 0.22, W: 0.24, bh: 0.24, col: 0x1d1a18, belly: 0xf2f0ea, neck: 0.06, nk: 0.3, hs: 0.2, snout: 0.6, ears: 0.45, earCol: 0xd88a8a, tail: 'short' }),
    dassie: () => beast({ L: 0.45, H: 0.12, W: 0.24, bh: 0.24, col: 0x7a6a54, neck: 0.04, nk: 0.3, hs: 0.15, snout: 0.5, ears: 0.25, tail: 'none' }),
    eland: () => beast({ L: 2.0, H: 1.25, W: 0.6, bh: 0.7, col: 0xb8946a, legs: 0x9a7a5a, neck: 0.45, nk: 0.7, hs: 0.34, ears: 0.4, horns: 'hook', hornCol: 0x3a2e24, dewlap: true, tail: 'tuft' }),
    kangaroo: () => kangaroo(), joey: () => kangaroo({ s: 0.6, col: 0xb8855a }), wallaby: () => kangaroo({ s: 0.72, col: 0x7a6a5a, belly: 0xb8a890 }), emu,
    wombat: () => wombat(), cockatoo: () => bird(0xf2f2ee, { crest: 0xf2d21a }), galah: () => bird(0xe88aa0, { headCol: 0xf2c8d0, wing: 0x9aa0a8 }), magpie: () => bird(0x15171c, { wing: 0xf2f2ee }),
    stork: () => bird(0xf2f2ee, { s: 2.2, legs: 0.6, neck: 0.25, wing: 0x15171c, beak: 0.2, beakCol: 0xd8262a }), egret: () => bird(0xf8f8f2, { s: 1.8, legs: 0.5, neck: 0.35, beak: 0.16, beakCol: 0xe0b020, legCol: 0x15171c }),
    goose: () => bird(0x8a7a64, { s: 1.6, neck: 0.18, headCol: 0x15171c, beak: 0.08, legs: 0.12, legCol: 0x15171c }),
    bear: () => bear(), blackbear: () => bear(0x1d1a18), macaque: () => monkey(0x8a7a6a, 0xd86a5a), baboon: () => monkey(0x7a6a4a, 0x3a2e24), caiman: croc,
  };
  // the forest things (each faces +z, its foot at y = 0)
  function huntStand() { const g = new THREE.Group(), wd = 0x7a5a3a, H = 3.4;
    for (const [x, z] of [[0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]]) g.add(bar([x * 1.3, 0, z * 1.3], [x, H, z], 0.12, wd));
    g.add(box(1.7, 0.1, 1.7, 0x8a6a45, 0, H, 0)); g.add(box(1.6, 1.0, 1.6, 0x8a6a45, 0, H + 0.55, 0)); g.add(box(1.0, 0.35, 0.06, 0x2a2420, 0, H + 0.85, 0.8));
    g.add(box(2.0, 0.1, 2.0, 0x3a3a3c, 0, H + 1.25, 0, { rx: 0.18 })); for (const sd of [1, -1]) g.add(bar([sd * 0.25, 0, 1.9], [sd * 0.25, H, 0.85], 0.06, wd)); for (let y = 0.4; y < H; y += 0.4) g.add(box(0.5, 0.05, 0.05, wd, 0, y, 1.9 - y / H * 1.05)); return g; }
  function feedRack() { const g = new THREE.Group(), wd = 0x7a5a3a; for (const [x, z] of [[1, 0.6], [-1, 0.6], [1, -0.6], [-1, -0.6]]) g.add(box(0.1, 1.6, 0.1, wd, x, 0.8, z));
    g.add(tbox(1.6, 1.8, 0.7, 0.4, 1.0, 0xc8b070, 0, 0.6, 0)); g.add(box(2.4, 0.08, 1.6, 0x5a4632, 0, 1.75, 0.35, { rx: 0.35 })); g.add(box(2.4, 0.08, 1.6, 0x5a4632, 0, 1.75, -0.35, { rx: -0.35 })); return g; }
  function logPile() { const g = new THREE.Group(), L = 5, cols = [0x9a7a54, 0x8a6a45, 0xa88a5a];
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4 - (r > 1 ? 1 : 0); k++) { const z = (k - 1.5 + r * 0.5) * 0.42; g.add(cyl(0.21, 0.21, L - r * 0.4, 7, cols[(r + k) % 3], 0, 0.21 + r * 0.38, z, { rz: Math.PI / 2 })); g.add(cyl(0.19, 0.19, L - r * 0.4 + 0.02, 7, 0xd8b88a, 0, 0.21 + r * 0.38, z, { rz: Math.PI / 2 })); }
    return g; }
  function fallenTree() { const g = new THREE.Group(), L = 7; g.add(cyl(0.22, 0.32, L, 7, 0x6b5a48, L / 2 - 3, 0.28, 0, { rz: Math.PI / 2 }));
    for (let k = 0; k < 4; k++) g.add(bar([L * (0.4 + k * 0.15) - 3, 0.35, 0], [L * (0.45 + k * 0.15) - 3, 0.9, (k % 2 ? 1 : -1) * 0.7], 0.06, 0x5a4a3a));
    g.add(mesh(flat(new THREE.DodecahedronGeometry(0.5, 0)), 0x5a4632, -3.2, 0.3, 0, { s: [0.7, 0.9, 1.3] })); return g; }
  const stumps = () => grp(...[[0, 0], [1.6, 0.9], [-1.2, 1.4]].map(([x, z], k) => grp(cyl(0.3 - k * 0.04, 0.38 - k * 0.04, 0.45, 8, 0x6b5a48, x, 0.22, z), cyl(0.28 - k * 0.04, 0.28 - k * 0.04, 0.02, 8, 0xc8a878, x, 0.455, z))));
  function cabin(col, roof) { const g = new THREE.Group(); col = col || 0x7a5a3a;
    g.add(box(4.2, 2.4, 3.4, col, 0, 1.2, 0)); for (let y = 0.25; y < 2.4; y += 0.3) g.add(box(4.25, 0.04, 3.45, 0x5a4026, 0, y, 0));
    const sh = new THREE.Shape(); sh.moveTo(-2.1, 0); sh.lineTo(2.1, 0); sh.lineTo(0, 1.5); const rf = new THREE.Mesh(flat(new THREE.ExtrudeGeometry(sh, { depth: 5.0, bevelEnabled: false })), lam(roof || 0x3a3a3c)); rf.position.set(0, 2.4, -2.5); g.add(rf);
    g.add(box(0.9, 1.8, 0.06, 0x3a2a1a, -0.8, 0.9, 1.72)); g.add(box(0.8, 0.6, 0.06, 0x2a3440, 1.0, 1.4, 1.72)); g.add(box(0.45, 1.4, 0.45, 0x6f6a62, 1.3, 3.0, -0.6)); return g; }
  function beehive() { const g = new THREE.Group(), cols = [0xd8262a, 0xf0c22e, 0x2f63c9, 0x2f9a48, 0xf2f2ee, 0xe85a2a];   // a painted bee house (čebelnjak)
    g.add(box(3.2, 1.5, 1.2, 0x7a5a3a, 0, 0.75, 0)); for (let k = 0; k < 6; k++) for (let r = 0; r < 2; r++) g.add(box(0.48, 0.55, 0.04, cols[(k + r * 3) % 6], -1.3 + k * 0.52, 0.45 + r * 0.62, 0.62));
    g.add(box(3.6, 0.1, 1.8, 0x8a3a24, 0, 1.6, 0.1, { rx: -0.15 })); for (const x of [-1.6, 1.6]) g.add(box(0.12, 1.6, 0.12, 0x5a4026, x, 0.8, 0.6)); return g; }
  function hayrack() { const g = new THREE.Group(), wd = 0x6b5034;   // a hayrack (kozolec)
    for (const x of [-3, -1, 1, 3]) g.add(box(0.2, 4.0, 0.2, wd, x, 2.0, 0)); for (let y = 0.6; y < 3.6; y += 0.4) g.add(box(6.4, 0.06, 0.08, wd, 0, y, 0));
    g.add(box(6.0, 1.6, 0.25, 0xc8b070, 0, 1.4, 0.05)); g.add(box(7.0, 0.1, 1.6, 0x8a3a24, 0, 4.15, 0.4, { rx: 0.4 })); g.add(box(7.0, 0.1, 1.6, 0x8a3a24, 0, 4.15, -0.4, { rx: -0.4 })); return g; }
  function waterTank() { const g = new THREE.Group(); g.add(cyl(1.3, 1.3, 2.2, 12, 0xb9bdc4, 0, 1.4, 0)); for (let y = 0.6; y < 2.4; y += 0.4) g.add(cyl(1.32, 1.32, 0.04, 12, 0x9aa0a8, 0, y, 0));
    g.add(cyl(0.2, 1.35, 0.35, 12, 0xb9bdc4, 0, 2.65, 0)); g.add(box(1.2, 0.3, 1.2, 0x8a8478, 0, 0.15, 0)); return g; }
  function windpump() { const g = new THREE.Group(), st = 0x9aa0a8;
    for (const [x, z] of [[0.9, 0.9], [-0.9, 0.9], [0.9, -0.9], [-0.9, -0.9]]) g.add(bar([x, 0, z], [x * 0.2, 8, z * 0.2], 0.08, st)); for (let y = 2; y < 8; y += 2) g.add(box(1.8 - y * 0.18, 0.05, 0.05, st, 0, y, 0.9 - y * 0.09));
    const rotor = new THREE.Group(); rotor.position.set(0, 8.4, 0.3); g.add(rotor); for (let k = 0; k < 12; k++) { const p = new THREE.Group(); p.add(box(0.28, 1.3, 0.03, 0xdcdcd6, 0, 0.9, 0)); p.rotation.z = k / 12 * TAU; rotor.add(p); }
    g.add(box(0.3, 0.3, 1.6, st, 0, 8.4, -0.6)); g.add(box(0.04, 1.0, 1.4, 0xdcdcd6, 0, 8.4, -1.5)); return g; }
  const vending = () => grp(box(1.0, 1.85, 0.75, 0xd8262a, 0, 0.93, 0), box(0.85, 1.1, 0.04, 0xf2f2ee, 0, 1.15, 0.38), box(0.8, 0.12, 0.05, 0x15171c, 0, 0.35, 0.39));
  function torii() { const g = new THREE.Group(), col = 0xd8432a; for (const x of [-1.4, 1.4]) g.add(cyl(0.14, 0.16, 3.2, 8, col, x, 1.6, 0)); g.add(box(4.0, 0.22, 0.32, 0x15171c, 0, 3.3, 0)); g.add(box(3.4, 0.15, 0.22, col, 0, 2.7, 0)); return g; }
  const lantern = () => grp(box(0.5, 0.15, 0.5, 0x9a9a92, 0, 0.07, 0), cyl(0.1, 0.12, 0.7, 6, 0x9a9a92, 0, 0.5, 0), box(0.45, 0.35, 0.45, 0x9a9a92, 0, 1.0, 0), cyl(0.0, 0.42, 0.3, 4, 0x8a8a82, 0, 1.33, 0, { ry: Math.PI / 4 }));
  function cactus() { const g = new THREE.Group(), c = 0x4a7a3a, h = 2.4; g.add(cyl(0.2, 0.22, h, 8, c, 0, h / 2, 0)); g.add(cyl(0.13, 0.13, 0.7, 7, c, 0.42, h * 0.55, 0)); g.add(bar([0.15, h * 0.4, 0], [0.42, h * 0.4, 0], 0.18, c)); g.add(cyl(0.12, 0.12, 0.6, 7, c, -0.38, h * 0.62, 0)); g.add(bar([-0.15, h * 0.48, 0], [-0.38, h * 0.48, 0], 0.16, c)); return g; }
  function mushrooms() { const g = new THREE.Group(); for (let k = 0; k < 7; k++) { const a = k / 7 * TAU; g.add(cyl(0.03, 0.03, 0.12, 5, 0xf2f0ea, Math.cos(a) * 0.6, 0.06, Math.sin(a) * 0.6)); g.add(sph(0.08, 6, 3, 0xc8201c, Math.cos(a) * 0.6, 0.12, Math.sin(a) * 0.6, { half: true })); } return g; }
  function signPost() { const g = new THREE.Group(); g.add(box(0.1, 2.0, 0.1, 0x7a5a3a, 0, 1.0, 0)); g.add(box(0.9, 0.2, 0.04, 0xf2d21a, 0.35, 1.7, 0)); g.add(box(0.8, 0.2, 0.04, 0xf2d21a, -0.3, 1.4, 0, { ry: 0.6 })); return g; }
  function picnic() { const g = new THREE.Group(), wd = 0x8a6a45; g.add(box(2.0, 0.06, 0.8, wd, 0, 0.75, 0)); for (const z of [0.65, -0.65]) g.add(box(2.0, 0.05, 0.28, wd, 0, 0.45, z));
    for (const x of [0.8, -0.8]) { g.add(bar([x, 0, -0.85], [x, 0.75, 0], 0.07, wd)); g.add(bar([x, 0, 0.85], [x, 0.75, 0], 0.07, wd)); } return g; }
  function shrine() { const g = new THREE.Group(); g.add(box(0.12, 1.3, 0.12, 0xb9bdc4, 0, 0.65, 0)); g.add(box(0.9, 0.7, 0.7, 0xf2e6c8, 0, 1.6, 0)); g.add(cyl(0.0, 0.75, 0.45, 4, 0xd8432a, 0, 2.18, 0, { ry: Math.PI / 4 })); g.add(box(0.3, 0.3, 0.04, 0xd8262a, 0, 1.6, 0.36)); return g; }   // a spirit house on its post
  function palmHut() { const g = new THREE.Group(); for (const [x, z] of [[1.2, 1.2], [-1.2, 1.2], [1.2, -1.2], [-1.2, -1.2]]) g.add(box(0.12, 2.0, 0.12, 0x7a5a3a, x, 1.0, z)); g.add(cyl(0.05, 2.1, 1.0, 6, 0xb89a5a, 0, 2.45, 0)); g.add(picnic()); return g; }
  const THINGS = { huntStand, feedRack, logPile, fallenTree, stumps, cabin: () => cabin(), cabinR: () => cabin(0x9b2c22, 0x2b2d31), beehive, hayrack, waterTank, windpump, vending, torii, lantern, cactus, mushrooms, signPost, picnic, shrine, palmHut };
  // the footprint of a thing (the glade's radius: the trees within it go)
  const ROOM = { huntStand: 3.6, feedRack: 3.2, logPile: 4.0, fallenTree: 4.6, stumps: 2.8, cabin: 5.2, cabinR: 5.2, beehive: 3.4, hayrack: 5.0, waterTank: 2.8, windpump: 3.0, vending: 2.0, torii: 3.2, lantern: 1.6, cactus: 1.8, mushrooms: 1.8, signPost: 1.6, picnic: 2.6, shrine: 1.8, palmHut: 3.0 };

  /* ---------------- which life where: the species and the things of each track's country and region ----------------
     a: the animals (a group is one kind, sometimes with its young: YOUNG), t: the things in the woods, open: animals also out on open ground
     (deserts, pastures above the tree line: away from the road and from anything built), city: only the woods of a park, fewer of them,
     nizka: false: none at NIZKA (a track already at the phone budget's edge) */
  const YOUNG = { boar: 'piglet', moose: 'mooseF', kangaroo: 'joey', stag: 'hind', roe: 'roeF', cow: 'cow', cowB: 'cowB', sheep: 'sheep', capybara: 'capybara', elk: 'muleDeer', horse: 'horseG' };
  const ZIV = {
    nring: { a: ['roe', 'stag', 'boar', 'fox', 'hare'], t: ['huntStand', 'feedRack', 'logPile', 'fallenTree', 'stumps', 'mushrooms'] },
    spa: { a: ['roe', 'boar', 'fox', 'cowB', 'hare'], t: ['huntStand', 'logPile', 'fallenTree', 'stumps', 'feedRack'] },
    rbring: { a: ['roe', 'chamois', 'cowB', 'fox'], t: ['huntStand', 'feedRack', 'logPile', 'cabin', 'hayrack'] },
    vrsic: { a: ['chamois', 'ibex', 'roe', 'sheep', 'bear'], t: ['beehive', 'hayrack', 'huntStand', 'feedRack', 'logPile', 'cabin'] },
    medvode: { a: ['roe', 'boar', 'fox', 'bear', 'stork'], t: ['beehive', 'hayrack', 'huntStand', 'feedRack', 'logPile'] },
    cpalace: { a: ['fox', 'magpie', 'goose'], t: ['logPile', 'fallenTree', 'signPost'], city: true },
    ouninpohja: { a: ['moose', 'hare', 'fox'], t: ['cabinR', 'logPile', 'huntStand', 'fallenTree', 'mushrooms'] },
    harju: { a: ['hare', 'fox', 'magpie'], t: ['logPile', 'signPost'], city: true, nizka: false },   // (Harju is on the phone budget's edge: nothing at NIZKA)
    pikes: { a: ['elk', 'bighorn', 'muleDeer'], t: ['cabin', 'logPile', 'signPost', 'picnic'] },
    pikesg: { a: ['elk', 'bighorn', 'muleDeer'], t: ['cabin', 'logPile', 'signPost', 'picnic'] },
    beartooth: { a: ['bison', 'elk', 'goatW', 'moose', 'blackbear'], t: ['cabin', 'logPile', 'signPost'], open: true },
    uncompahgre: { a: ['elk', 'bighorn', 'muleDeer', 'blackbear'], t: ['cabin', 'logPile', 'fallenTree'] },
    baldy: { a: ['bighorn', 'muleDeer', 'coyote', 'blackbear'], t: ['cabin', 'picnic', 'signPost', 'logPile'] },
    bigsur: { a: ['muleDeer', 'coyote', 'cowK'], t: ['picnic', 'signPost', 'fallenTree'] },
    mulholland: { a: ['coyote', 'muleDeer'], t: ['picnic', 'signPost'] },
    palomar: { a: ['muleDeer', 'coyote', 'cowB'], t: ['cabin', 'picnic', 'logPile'] },
    monterey: { a: ['muleDeer', 'coyote', 'cowK'], t: ['picnic', 'signPost'] },
    riverside: { a: ['coyote', 'hare', 'horse'], t: ['windpump', 'waterTank', 'picnic'], open: true },
    moki: { a: ['bighorn', 'coyote', 'cowB'], t: ['signPost'], open: true },
    maunakea: { a: ['mouflon', 'goose'], t: [], open: true },
    detroit: { a: ['goose'], t: [], city: true },
    montreal: { a: ['goose', 'fox'], t: ['picnic'], city: true },
    toronto: { a: ['goose'], t: [], city: true },
    troisrivieres: { a: ['fox', 'goose'], t: ['picnic'], city: true },
    rastro: { a: ['coati', 'cowB', 'horse'], t: ['signPost', 'picnic'] },
    rio: { a: ['capybara', 'caiman', 'egret'], t: ['palmHut'], city: true },
    caracoles: { a: ['guanaco', 'horse'], t: [], open: true },
    chapman: { a: ['baboon', 'dassie'], t: ['signPost', 'picnic'], open: true },
    sani: { a: ['eland', 'horseG', 'cowK', 'baboon'], t: [], open: true },
    marrakesh: { a: ['camel', 'donkey', 'stork'], t: ['palmHut'], city: true },
    iroha: { a: ['macaque', 'sika', 'serow'], t: ['torii', 'lantern', 'vending', 'logPile'] },
    suzuka: { a: ['sika', 'macaque'], t: ['torii', 'lantern', 'vending'] },
    tianmen: { a: ['macaque'], t: ['lantern', 'signPost'] },
    katu: { a: ['yak', 'horse', 'ibex', 'elk'], t: ['cabin', 'logPile'], open: true },
    bangsaen: { a: ['macaque', 'buffalo', 'egret'], t: ['shrine', 'palmHut'], city: true },
    bathurst: { a: ['kangaroo', 'cockatoo', 'galah', 'wombat'], t: ['waterTank', 'windpump', 'logPile', 'fallenTree'] },
    greatalpine: { a: ['wallaby', 'wombat', 'cockatoo', 'emu'], t: ['waterTank', 'logPile', 'fallenTree', 'signPost'] },
    hotham: { a: ['wombat', 'wallaby', 'horse', 'cockatoo'], t: ['cabin', 'logPile', 'waterTank'] },
    longford: { a: ['wallaby', 'wombat', 'devil', 'kangaroo'], t: ['waterTank', 'windpump', 'fallenTree'] },
    newcastle: { a: ['magpie', 'galah'], t: [], city: true },
    townsville: { a: ['wallaby', 'egret'], t: ['palmHut'], city: true },
  };

  /* ---------------- the templates: a model baked once into arrays (its bottom faces dropped: no camera sees them) ---------------- */
  const TPL = new Map();
  function tpl(kind) {
    let t = TPL.get(kind); if (t) return t;
    const make = SPECIES[kind] || THINGS[kind]; if (!make) return null;
    const g = make(); g.updateMatrixWorld(true);
    const P = [], N = [], C = [], v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3();
    g.traverse(m => {
      if (!m.isMesh) return;
      const geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry, pa = geo.attributes.position, na = geo.attributes.normal, c = m.material.color;
      nm.getNormalMatrix(m.matrixWorld);
      for (let i = 0; i + 2 < pa.count; i += 3) {
        n.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); if (n.y < -0.97) continue;   // (a face looking straight down)
        for (let k = 0; k < 3; k++) { v.fromBufferAttribute(pa, i + k).applyMatrix4(m.matrixWorld); n.fromBufferAttribute(na, i + k).applyMatrix3(nm).normalize(); P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z); C.push(c.r, c.g, c.b); }
      }
      if (geo !== m.geometry) geo.dispose();
    });
    t = { P: new Float32Array(P), N: new Float32Array(N), C: new Float32Array(C) }; TPL.set(kind, t); return t;
  }
  // a template into a chunk's geometry builder at (x, y, z), turned by yaw (THREE's rotation.y), scaled by s
  function put(gb, t, x, y, z, yaw, s) {
    const c = Math.cos(yaw), sn = Math.sin(yaw), P = t.P, N = t.N, C = t.C;
    for (let i = 0; i < P.length; i += 3) {
      const px = P[i] * s, pz = P[i + 2] * s, nx = N[i], nz = N[i + 2];
      gb.P.push(x + px * c + pz * sn, y + P[i + 1] * s, z - px * sn + pz * c); gb.N.push(nx * c + nz * sn, N[i + 1], -nx * sn + nz * c); gb.C.push(C[i], C[i + 1], C[i + 2]);
    }
  }

  /* ---------------- the woods (the instanced trees of the world, from o.cull) ---------------- */
  const HCELL = 12;
  function woods(o) {
    const trees = new Map(), m4 = new THREE.Matrix4(), hOf = new Map(), w4 = new THREE.Matrix4(); let n = 0;
    // the instanced plants: those on the vegetation list (o.cull: IChunks), and any other instanced mesh whose shape is mostly green (a world's
    // own forest: Ouninpohja's spruces, Nikko's broadleaves), not the crowds' figures nor the car parks' cars
    const reg = new Set((o.cull || []).map(e => e.m)), list = [];
    o.root.updateMatrixWorld(true);
    o.root.traverse(m => { if (!m.isInstancedMesh || m.name === 'crowd' || m.name === 'life' || !m.geometry.attributes.position) return;
      if (reg.has(m)) { list.push(m); return; }
      const ca = m.geometry.attributes.color; if (!ca) return; let r = 0, g = 0, b = 0; for (let k = 0; k < ca.count; k++) { r += ca.getX(k); g += ca.getY(k); b += ca.getZ(k); }
      if (g > r * 1.08 && g > b * 1.08) list.push(m); });
    for (const im of list) {
      let h0 = hOf.get(im.geometry.attributes.position); if (h0 == null) { const pa = im.geometry.attributes.position.array; let lo = 1e9, hi = -1e9; for (let k = 1; k < pa.length; k += 3) { lo = Math.min(lo, pa[k]); hi = Math.max(hi, pa[k]); } hOf.set(im.geometry.attributes.position, h0 = hi - lo); }
      const el = w4.elements;
      for (let k = 0; k < im.count; k++) {
        im.getMatrixAt(k, m4); w4.multiplyMatrices(im.matrixWorld, m4); const sy = Math.hypot(el[4], el[5], el[6]); if (h0 * sy < 3.2) continue;   // (trees: not bushes, tufts or stones)
        const x = el[12], z = el[14], key = Math.floor(x / HCELL) + ',' + Math.floor(z / HCELL);
        let L = trees.get(key); if (!L) trees.set(key, L = []); L.push(x, z, k, im); n++;
      }
    }
    return { trees, n };
  }
  // the trees within r of (x, z): their count and the nearest's distance (fn: called for each, e.g. to take it out)
  function near(W, x, z, r, fn) {
    let cnt = 0, dmin = 1e9; const a0 = Math.floor((x - r) / HCELL), a1 = Math.floor((x + r) / HCELL), b0 = Math.floor((z - r) / HCELL), b1 = Math.floor((z + r) / HCELL);
    for (let a = a0; a <= a1; a++) for (let b = b0; b <= b1; b++) { const L = W.trees.get(a + ',' + b); if (!L) continue;
      for (let q = 0; q < L.length; q += 4) { const d = Math.hypot(L[q] - x, L[q + 1] - z); if (d < r && L[q + 3]) { cnt++; dmin = Math.min(dmin, d); if (fn) fn(L, q); } } }
    return { cnt, dmin };
  }
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  function cut(W, x, z, r) {   // the glade: the trees within r taken out (their instances scaled to nothing, the record dropped)
    near(W, x, z, r, (L, q) => { const im = L[q + 3]; im.setMatrixAt(L[q + 2], ZERO); im.instanceMatrix.needsUpdate = true; L[q + 3] = null; });
  }

  /* ---------------- the build: World.life(o) at the end of every world's build ---------------- */
  World.life = function (o) {
    const A = World.api, T = A.T, def = T && T.def; if (!def || def.test || !o || !o.root) return null;
    const Z = ZIV[def.id]; if (!Z || (Z.nizka === false && World.api.LOD.tier === 0)) return null;
    const LOD = A.LOD, R = A.rng(1777 + [...def.id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7) % 100000), gH = o.groundH;
    if (typeof gH !== 'function') return null;
    const W = woods(o), chunks = new A.Chunks(256), placed = [], stats = { trees: 0, things: 0, groups: 0, animals: 0, kinds: {}, at: [] };
    stats.trees = W.n;
    const slope = (x, z, r) => { const h0 = gH(x, z), d = Math.max(Math.abs(gH(x + r, z) - h0), Math.abs(gH(x - r, z) - h0), Math.abs(gH(x, z + r) - h0), Math.abs(gH(x, z - r) - h0)); return Number.isFinite(d) ? d / r : 9; };
    const free = (x, z, r) => { for (const p of placed) if ((p[0] - x) ** 2 + (p[1] - z) ** 2 < (p[2] + r + 6) ** 2) return false; return true; };
    const L0 = T.open ? Math.max(0, T.startS - 40) : 0, L1 = T.open ? Math.min(T.len, T.finishS + 60) : T.len;
    const step = (Z.city ? 120 : 64) / LOD.dens;   // (one try every ~64 m of road: in the woods, a glade every 100-150 m; the lower tiers fewer)
    let nStep = 0;
    for (let s = L0 + R() * step; s < L1; s += step * (0.7 + R() * 0.6), nStep++) for (let tr = 0; tr < 4; tr++) {   // (up to four tries at each step: either side, near or farther)
      const deep = nStep % 3 === 2;   // (every third: deep in the woods, 30-70 m in: seen from the TV cameras, the replays and the flyover)
      const i = T.idx(((s + (tr ? (R() - 0.5) * step * 0.6 : 0)) % T.len + T.len) % T.len), side = R() < 0.5 ? -1 : 1, bar = side > 0 ? T.br[i] : T.bl[i];
      const b = deep ? 30 + R() * 40 : 3.5 + Math.pow(R(), 1.5) * 24, off = side * (bar + b), x = T.px[i] + T.nx[i] * off, z = T.pz[i] + T.nz[i] * off;   // (near the road: the chase camera looks steeply down, a glade deep in the woods hides under the crowns)
      const wantThing = Z.t.length && R() < 0.5, kind = wantThing ? Z.t[Math.floor(R() * Z.t.length)] : Z.a[Math.floor(R() * Z.a.length)];
      const rr = wantThing ? ROOM[kind] || 3 : 4.4;
      if (A.clearance(x, z) < rr + 2.5) continue;   // (not on another part of the road, its verges or barriers)
      const h = gH(x, z); if (!Number.isFinite(h) || slope(x, z, rr * 0.7) > (wantThing ? 0.32 : 0.55) || !free(x, z, rr)) continue;
      const N = near(W, x, z, 9);
      const forest = N.cnt >= 2 && N.dmin < 5.5, open = N.cnt === 0 && near(W, x, z, 22).cnt === 0;
      if (!forest && !(open && Z.open && !wantThing && A.clearance(x, z) > 14)) continue;   // (in the woods; out in the open only where the track's country has open land)
      const yaw = Math.atan2(-side * T.nx[i], -side * T.nz[i]) + (R() - 0.5) * 0.9;   // (facing the road, more or less)
      if (forest) {   // the glade, and a window in the trees towards the road (the camera above the road sees into it)
        cut(W, x, z, rr + 3.8);   // (wide enough that the crowns round it, 3-5 m across on tall trees, leave it open to the sky)
        if (!deep) for (const f of [0.25, 0.5, 0.75, 1]) {   // (the window slants back along the road: the chase camera looks at the glade from behind and above)
          const sb = i * T.ds - 24 * f, j = T.idx(((sb % T.len) + T.len) % T.len), bj = side > 0 ? T.br[j] : T.bl[j], ob = side * (bj + Math.max(1.5, b * (1 - f)));
          cut(W, T.px[j] + T.nx[j] * ob, T.pz[j] + T.nz[j] * ob, rr * 0.9 + 2.4);
        }
      }
      const g = chunks.get(x, z);
      if (wantThing) { put(g, tpl(kind), x, h - 0.05, z, yaw, 1); stats.things++; }
      else {   // a group of 2-5 (the young among them), spread over the glade, each turned its own way
        const n = 2 + Math.floor(R() * (kind === 'bear' || kind === 'blackbear' || kind === 'caiman' ? 1 : 4)), young = YOUNG[kind];
        for (let k = 0; k < n; k++) {
          const a = k === 0 ? 0 : R() * TAU, d = k === 0 ? 0 : 0.9 + R() * 2.2, ax = x + Math.cos(a) * d, az = z + Math.sin(a) * d, ah = gH(ax, az);
          const kk = k > 0 && young && R() < 0.5 ? young : kind, sc = kk === kind && k > 0 && !young && R() < 0.3 ? 0.75 : 1;
          if (!Number.isFinite(ah)) continue; put(g, tpl(kk), ax, ah - 0.02, az, yaw + (R() - 0.5) * 2.4, sc * 1.15); stats.animals++; stats.kinds[kk] = (stats.kinds[kk] || 0) + 1;   // (a little bigger than life: they are seen from high above)
        }
        stats.groups++;
      }
      placed.push([x, z, rr]); stats.at.push([Math.round(i * T.ds - (T.startS || 0)), side, Math.round(b), kind]);   // (where: metres after the start, side, metres beyond the barrier, what)
      break;
    }
    const grp = new THREE.Group(); grp.name = 'life'; o.root.add(grp);
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    for (const [key, g] of chunks.map) { if (g.empty) continue; const m = new THREE.Mesh(g.geometry(), mat); m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'life'; grp.add(m);
      const bs = m.geometry.boundingSphere; if (o.cull) o.cull.push({ m, x: bs.center.x, z: bs.center.z, r: bs.radius }); }
    o.lifeStats = stats; return stats;
  };
  World.lifeTable = ZIV;   // (for the tests and the docs)
})();
