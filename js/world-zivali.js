/* Life in the woods (the user's wish, 1. 11. 2026: »elementi in živali naključno po gozdovih, tudi notri v gozdu, glede na državo proge,
   čim več različnih živali na čim več progah«): on every real track (not test: true) small glades are cut into the woods along the road,
   each with a thing of the place (a hunting stand, a deer feeder, a log pile, a fallen tree, a hut, a painted bee house, a hayrack, a water
   tank, a wind pump, a torii, a stone lantern, a vending machine ...) or animals of the region (ZIV: roe deer and boar in the Eifel, chamois
   and ibex on Vršič, moose in Finland, kangaroos and cockatoos at Bathurst, macaques and sika deer at Nikko, capybaras and caimans at Rio ...).
   The user's wishes (1. 11. 2026, later): »na progi naj bo več živali, živali niso vse vedno v skupini, lahko sta po 2 moški in ženska, 3-10
   odvisno katere živali«, »nekatere živali pa naj bodo same ter se sprehajajo ali pa jejo travo«, »12 prizorov različnih živali na različnih
   progah«: how they keep company is the species' own (SOC: alone, a male and a female, or a herd of 3-10 with their young: a red deer stag with
   his hinds, a sow with her piglets, a mob of kangaroos ...); one alone walks to and fro or grazes (LIVE: its own mesh, legs and head moved in
   the vertex shader, World.lifeStep from World.update; from SREDNJA up, as the worlds' other animals), and fifteen tracks have seventeen scenes
   of their own (SCENE: deer at a feeder in the Eifel, chamois on Vršič, a mob of kangaroos at Bathurst, moose at a pond in Finland, koalas in
   the gum trees ...; the farm's animals, the ducks and the stork where they really are, from OSM: pigs at the farm in Zbilje, horses at a farm
   in Ouninpohja, ducks and swans on the lake at Crystal Palace, one stork on its pole in Medvode that flies off as the car comes, flyStep).
   World.life(o) runs at the end of every build (finish in js/world.js): the woods are read from the instanced trees (o.cull: IChunks), the
   glade's trees are taken out (their instances scaled to nothing), the things and the animals that are not live are merged into one
   vertex-coloured mesh per 256 m chunk (one draw call per chunk in view, far chunks culled like the plants on the lower tiers); the animals in
   it move all the same, slowly, posed by the chunk's vertex shader (the user, 2. 11. 2026: »živali naj se premikajo pomalo«: HERD_VS). No
   sound. */
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
  // a beast's body, round over the back (the user, 2. 11. 2026: »izboljšaj grafiko živali«): six sides (the belly, the flanks, the back's two
  // slopes and its top), narrower to the chest and the rump (four rings along it); its origin under its middle, its belly at y = 0
  // lo: the lower flanks alone (the belly's colour, seen from the side), else the rest (the belly's own face looks down: no camera sees it)
  const gBody = (W, bh, L, lo) => { const k = 'B' + [W, bh, L, lo ? 1 : 0]; let g = GC.get(k); if (g) return g;
    const S = [[0.38, 0], [0.5, 0.45], [0.3, 1], [-0.3, 1], [-0.5, 0.45], [-0.38, 0]], RG = [[-0.5, 0.8], [-0.3, 1], [0.32, 1], [0.5, 0.84]];
    const ring = RG.map(([z, f]) => S.map(([sx, sy]) => [sx * W * f, bh * (0.5 + (sy - 0.5) * f), z * L])), pos = [];
    for (let j = 0; j < 3; j++) for (let q = 0; q < 5; q++) { if ((q === 0 || q === 4) !== !!lo) continue;
      const a = ring[j][q], b = ring[j][q + 1], c = ring[j + 1][q + 1], d = ring[j + 1][q]; pos.push(...a, ...b, ...c, ...a, ...c, ...d); }
    if (!lo) for (const [j, back] of [[0, true], [3, false]]) for (let q = 1; q < 5; q++) { const t = [ring[j][0], ring[j][q], ring[j][q + 1]]; if (back) t.reverse(); for (const p of t) pos.push(...p); }   // (the chest and the rump: fans)
    g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); GC.set(k, g); return g; };
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
  const part = (e, k, pivot) => { e.userData.part = k; e.userData.pivot = pivot; return e; };   // a moving part of a beast (LIVE: legs 1-4, neck and head 5) and its joint

  // A four-legged animal along +z (head forward), its feet at y = 0. o: L (body length), H (shoulder height), W (width), bh (body height), col, belly,
  // legs, head, neck (length), nk (neck angle), hs (head size), snout, ears, tail, horns ('roe' | 'stag' | 'moose' | 'hook' | 'ibex' | 'curl' | 'cow'),
  // rump (the white patch), graze (head down), hump, mane, dewlap
  function beast(o) {
    const g = new THREE.Group(), L = o.L, H = o.H, W = o.W || L * 0.38, lt = o.lt || W * 0.28, col = o.col, legs = o.legs || col, hc = o.head || col, bh = o.bh || W * 0.95;
    g.add(mesh(gBody(W, bh, L), col, 0, H - 0.02, 0)); g.add(mesh(gBody(W, bh, L, true), o.belly || col, 0, H - 0.02, 0));   // (the lower flanks in the belly's colour)
    if (o.rump) g.add(box(W * 0.62, bh * 0.5, 0.04, o.rump, 0, H + bh * 0.42, -L / 2 - 0.01));
    if (o.stripe) g.add(box(W * 0.3, 0.03, L * 0.8, o.stripe, 0, H + bh - 0.01, 0));
    if (o.hump) g.add(sph(W * 0.62, 7, 4, o.humpCol || col, 0, H + bh * 0.95, L * 0.22, { half: true, s: [1, 1, 1.4] }));
    if (o.mane) g.add(box(W * 0.35, bh * 0.5, L * 0.45, o.mane, 0, H + bh + 0.02, L * 0.2));
    if (o.shag) g.add(box(W * 1.08, bh * 0.45, L * 0.95, o.shag, 0, H - 0.2, 0));
    [[W / 2 - lt / 2, L / 2 - lt], [-(W / 2 - lt / 2), L / 2 - lt], [W / 2 - lt / 2, -L / 2 + lt], [-(W / 2 - lt / 2), -L / 2 + lt]].forEach(([x, z], k) => g.add(part(tbox(lt * 0.6, lt, H, lt * 0.68, lt * 1.1, legs, x, 0, z), k + 1, [x, H, z])));   // (the legs, thinner to the hoof: parts 1-4, swung from the top in the walk: LIVE)
    const nl = o.neck != null ? o.neck : L * 0.45, ang = o.graze ? -0.75 : (o.nk != null ? o.nk : 0.8), hs = o.hs || W * 0.75;
    const n0 = [0, H + bh * 0.62, L / 2 - 0.05], n1 = [0, n0[1] + Math.sin(ang) * nl, n0[2] + Math.cos(ang) * nl];
    if (nl > 0.05) g.add(part(bar(n0, n1, W * 0.42, o.neckCol || col), 5, n0));
    const head = part(new THREE.Group(), 7, n1); head.position.set(n1[0], n1[1], n1[2]); head.rotation.x = o.graze ? 0.9 : (o.headTilt || 0.25); g.add(head);   // (the neck, part 5, bowed from its foot to graze; the head, part 7, tipped back a little from the neck's top)
    const sn = o.snout || 0.6;
    head.add(box(hs * 0.7, hs * 0.72, hs, hc, 0, 0, hs * 0.25)); head.add(box(hs * 0.5, hs * 0.45, sn * hs, o.snoutCol || hc, 0, -hs * 0.1, hs * 0.65 + sn * hs * 0.3));
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
    const tl = o.tail || 'short', tc = o.tailCol || col, t0 = [0, H + bh * 0.75, -L / 2], tg = part(new THREE.Group(), 6, t0); g.add(tg);   // (the tail, part 6: it swishes about its root, the herds' shader)
    if (tl === 'short') tg.add(bar(t0, [0, H + bh * 0.5, -L / 2 - 0.12], 0.06, tc));
    else if (tl === 'long') tg.add(bar(t0, [0, H * 0.45, -L / 2 - 0.25], 0.06, tc));
    else if (tl === 'bushy') { tg.add(bar(t0, [0, H * 0.75, -L / 2 - L * 0.6], W * 0.4, tc)); if (o.tip) tg.add(box(W * 0.42, W * 0.42, 0.12, o.tip, 0, H * 0.72, -L / 2 - L * 0.62)); }
    else if (tl === 'ringed') { for (let k = 0; k < 4; k++) tg.add(bar([0, H + bh * 0.7 - k * 0.04, -L / 2 - k * L * 0.18], [0, H + bh * 0.66 - (k + 1) * 0.04, -L / 2 - (k + 1) * L * 0.18], W * 0.28, k % 2 ? o.tip || 0x2a221c : tc)); }
    else if (tl === 'tuft') { tg.add(bar(t0, [0, H * 0.6, -L / 2 - 0.05], 0.04, tc)); tg.add(box(0.1, 0.18, 0.1, o.tip || 0x15110e, 0, H * 0.55, -L / 2 - 0.06)); }
    else if (tl === 'curly') tg.add(sph(0.06, 5, 3, tc, 0, H + bh * 0.8, -L / 2 - 0.03));
    else if (tl === 'croc') { tg.add(bar([0, H + bh * 0.4, -L / 2], [0, 0.08, -L / 2 - L * 0.9], W * 0.45, tc)); }
    g.userData.graze = o.graze ? 0 : ang + 1.1; g.userData.n0 = n0; g.userData.len = L;   // (the bow that brings an upright neck's head down to the grass; the neck's foot)
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
  // a koala sitting up (in a tree's fork: World.life's perches), facing +z: its round grey body, the pale chest, the big fluffy ears, the nose
  function koala() { const g = new THREE.Group(), c = 0xa2a29c; g.add(sph(0.2, 7, 4, c, 0, 0.24, 0, { s: [1, 1.2, 0.95] })); g.add(box(0.2, 0.2, 0.06, 0xd8d4c8, 0, 0.26, 0.17));
    g.add(sph(0.15, 7, 4, 0xaeaea8, 0, 0.53, 0.05)); for (const sd of [1, -1]) { g.add(sph(0.085, 6, 3, 0xe6e2da, sd * 0.14, 0.63, 0.02, { s: [1, 1, 0.55] })); g.add(bar([sd * 0.15, 0.36, 0.06], [sd * 0.09, 0.3, 0.24], 0.07, c)); g.add(box(0.09, 0.08, 0.16, c, sd * 0.1, 0.05, 0.1)); }
    g.add(box(0.07, 0.09, 0.05, 0x2a2622, 0, 0.5, 0.19)); return g; }
  // the species (kind -> model; B: a beast of these options, B(...)(over) the same with some changed, e.g. LIVE's: the head up); the young: smaller copies (SOC)
  const B = (o) => { const f = (over) => beast(over ? Object.assign({}, o, over) : o); f.o = o; return f; };
  const SPECIES = {
    roe: B({ L: 0.95, H: 0.62, W: 0.3, col: 0x9a5a32, belly: 0xc8a888, rump: 0xf0ece4, legs: 0x8a5a3a, neck: 0.38, nk: 1.0, hs: 0.2, ears: 0.55, horns: 'roe', tail: 'none' }),
    roeF: B({ L: 0.9, H: 0.6, W: 0.28, col: 0x9a5a32, belly: 0xc8a888, rump: 0xf0ece4, legs: 0x8a5a3a, neck: 0.36, nk: 0.9, hs: 0.19, ears: 0.6, tail: 'none', graze: true }),
    stag: B({ L: 1.6, H: 1.0, W: 0.5, col: 0x7a4a2a, neckCol: 0x5a3a24, legs: 0x5a3a24, rump: 0xd8c09a, neck: 0.6, nk: 1.05, hs: 0.32, snout: 0.7, ears: 0.5, horns: 'stag', tail: 'short' }),
    hind: B({ L: 1.45, H: 0.95, W: 0.45, col: 0x8a5a32, legs: 0x6a4a2a, rump: 0xd8c09a, neck: 0.55, nk: 0.5, hs: 0.3, ears: 0.55, tail: 'short', graze: true }),
    boar: B({ L: 1.25, H: 0.42, W: 0.42, bh: 0.5, col: 0x3a322c, legs: 0x2a241f, neck: 0.12, nk: 0.1, hs: 0.36, snout: 1.0, snoutCol: 0x2a241f, ears: 0.3, tail: 'tuft', mane: 0x2a241f }),
    piglet: B({ L: 0.5, H: 0.2, W: 0.2, bh: 0.2, col: 0x8a6a4a, stripe: 0xd8c09a, neck: 0.04, nk: 0.1, hs: 0.16, snout: 0.9, ears: 0.3, tail: 'short' }),
    fox: B({ L: 0.7, H: 0.38, W: 0.2, bh: 0.22, col: 0xd86a24, belly: 0xf2ece4, legs: 0x2a221c, neck: 0.18, nk: 0.6, hs: 0.17, snout: 0.9, snoutCol: 0xd86a24, ears: 0.7, earCol: 0x2a221c, tail: 'bushy', tip: 0xf2f0ea }),
    hare: B({ L: 0.48, H: 0.2, W: 0.22, bh: 0.26, col: 0x8a7258, neck: 0.08, nk: 1.0, hs: 0.15, snout: 0.5, ears: 1.3, tail: 'curly', tailCol: 0xf2f0ea }),
    moose: B({ L: 2.1, H: 1.35, W: 0.62, bh: 0.75, col: 0x3a2a1e, legs: 0x8a7a68, neck: 0.55, nk: 0.45, hs: 0.42, snout: 1.0, ears: 0.45, horns: 'moose', dewlap: true, tail: 'short', hump: true }),
    mooseF: B({ L: 1.9, H: 1.25, W: 0.56, bh: 0.7, col: 0x4a3626, legs: 0x8a7a68, neck: 0.5, nk: 0.3, hs: 0.4, snout: 1.0, ears: 0.5, dewlap: true, tail: 'short', hump: true, graze: true }),
    chamois: B({ L: 1.05, H: 0.62, W: 0.32, col: 0x5a4632, head: 0xe9e2cf, legs: 0x3a2e24, neck: 0.3, nk: 0.9, hs: 0.2, ears: 0.5, horns: 'hook', tail: 'short' }),
    ibex: B({ L: 1.25, H: 0.72, W: 0.4, col: 0x8a7a64, legs: 0x5a4a3a, neck: 0.3, nk: 0.8, hs: 0.24, ears: 0.4, horns: 'ibex', hornCol: 0x7a6a54, tail: 'short' }),
    goatW: B({ L: 1.3, H: 0.75, W: 0.42, col: 0xf0ede4, legs: 0xe0dccf, neck: 0.3, nk: 0.8, hs: 0.24, ears: 0.4, horns: 'hook', tail: 'short', shag: 0xe6e1d3 }),
    cow: B({ L: 1.9, H: 0.9, W: 0.62, bh: 0.65, col: 0xf2efe6, legs: 0xe9e2cf, neck: 0.25, nk: 0.2, hs: 0.36, snout: 0.7, snoutCol: 0xe8b8a8, ears: 0.3, horns: 'cow', tail: 'long', graze: true }),
    cowB: B({ L: 1.9, H: 0.9, W: 0.62, bh: 0.65, col: 0x8a5a3a, legs: 0x7a4a2a, neck: 0.25, nk: 0.2, hs: 0.36, snout: 0.7, ears: 0.3, horns: 'cow', tail: 'long' }),
    cowK: B({ L: 1.9, H: 0.9, W: 0.62, bh: 0.65, col: 0x1d1a18, legs: 0x1d1a18, neck: 0.25, nk: 0.2, hs: 0.36, snout: 0.7, ears: 0.3, tail: 'long', graze: true }),
    sheep: B({ L: 1.0, H: 0.48, W: 0.5, bh: 0.5, col: 0xe9e4d6, legs: 0x2a241f, head: 0x2a241f, neck: 0.15, nk: 0.3, hs: 0.2, ears: 0.3, tail: 'short', graze: true }),
    bighorn: B({ L: 1.25, H: 0.78, W: 0.42, col: 0x7a5a3a, legs: 0x6a4a2a, rump: 0xe9e2cf, neck: 0.3, nk: 0.7, hs: 0.26, ears: 0.35, horns: 'curl', tail: 'short' }),
    mouflon: B({ L: 1.1, H: 0.7, W: 0.38, col: 0x8a4a2a, belly: 0xe9e2cf, legs: 0xd8d2c8, neck: 0.3, nk: 0.7, hs: 0.24, ears: 0.35, horns: 'curl', hornCol: 0x8a7a64, tail: 'short' }),
    bison: B({ L: 2.4, H: 1.0, W: 0.85, bh: 0.9, col: 0x4a3222, humpCol: 0x3a2618, legs: 0x2a1c12, neck: 0.15, nk: -0.2, hs: 0.5, snout: 0.5, ears: 0.25, horns: 'cow', hornCol: 0x2a221c, tail: 'tuft', hump: true, mane: 0x2a1c12 }),
    elk: B({ L: 1.75, H: 1.15, W: 0.55, col: 0x8a6a4a, neckCol: 0x4a3222, legs: 0x4a3222, rump: 0xd8c09a, neck: 0.65, nk: 0.95, hs: 0.34, snout: 0.7, ears: 0.5, horns: 'stag', tail: 'short' }),
    muleDeer: B({ L: 1.4, H: 0.9, W: 0.42, col: 0x8a7a68, rump: 0xf0ece4, legs: 0x7a6a58, neck: 0.45, nk: 0.9, hs: 0.27, ears: 0.9, tail: 'short', tailCol: 0x15110e }),
    coyote: B({ L: 0.75, H: 0.45, W: 0.22, bh: 0.24, col: 0xa88a64, belly: 0xd8c8a8, neck: 0.2, nk: 0.6, hs: 0.18, snout: 0.9, ears: 0.6, tail: 'bushy', tip: 0x2a221c }),
    capybara: B({ L: 1.0, H: 0.32, W: 0.45, bh: 0.48, col: 0x8a5a3a, neck: 0.08, nk: 0.2, hs: 0.3, snout: 0.9, ears: 0.2, tail: 'none' }),
    coati: B({ L: 0.55, H: 0.25, W: 0.2, bh: 0.2, col: 0x8a5a32, belly: 0xd8b48a, neck: 0.1, nk: 0.4, hs: 0.15, snout: 1.4, ears: 0.3, tail: 'ringed', tip: 0x2a1a10 }),
    guanaco: B({ L: 1.2, H: 0.9, W: 0.38, col: 0xb07a4a, belly: 0xe9e2cf, head: 0x8a8a8a, neck: 0.75, nk: 1.25, hs: 0.2, snout: 0.8, ears: 0.6, tail: 'short' }),
    camel: B({ L: 2.0, H: 1.3, W: 0.6, bh: 0.6, col: 0xc89a64, neck: 0.85, nk: 0.55, hs: 0.3, snout: 0.9, ears: 0.25, tail: 'tuft', hump: true }),
    donkey: B({ L: 1.3, H: 0.8, W: 0.42, col: 0x8a8278, belly: 0xd8d2c8, neck: 0.4, nk: 0.8, hs: 0.3, snout: 0.8, snoutCol: 0xd8d2c8, ears: 1.0, tail: 'tuft', mane: 0x3a342e }),
    horse: B({ L: 1.9, H: 1.15, W: 0.55, col: 0x6a3e22, legs: 0x3a2214, neck: 0.75, nk: 0.85, hs: 0.3, snout: 1.0, ears: 0.4, tail: 'long', tailCol: 0x2a1a10, mane: 0x2a1a10 }),
    horseG: B({ L: 1.8, H: 1.1, W: 0.55, col: 0xc8c2b8, legs: 0x8a8278, neck: 0.7, nk: 0.4, hs: 0.3, snout: 1.0, ears: 0.4, tail: 'long', tailCol: 0x6a6258, mane: 0x6a6258, graze: true }),
    yak: B({ L: 1.9, H: 0.85, W: 0.7, bh: 0.7, col: 0x2a221c, legs: 0x2a221c, neck: 0.15, nk: 0.0, hs: 0.42, snout: 0.6, ears: 0.25, horns: 'cow', hornCol: 0xe9e2cf, tail: 'long', hump: true, shag: 0x1d1814 }),
    buffalo: B({ L: 2.1, H: 0.85, W: 0.75, bh: 0.75, col: 0x3a3a3c, neck: 0.2, nk: 0.1, hs: 0.42, snout: 0.6, ears: 0.3, horns: 'curl', hornCol: 0x5a5a58, tail: 'tuft' }),
    sika: B({ L: 1.25, H: 0.8, W: 0.38, col: 0x8a5a32, belly: 0xe9e2cf, rump: 0xf2f0ea, stripe: 0x6a3e22, neck: 0.45, nk: 1.0, hs: 0.26, ears: 0.55, horns: 'roe', tail: 'short' }),
    serow: B({ L: 1.15, H: 0.72, W: 0.4, col: 0x3a3632, head: 0x5a5650, neck: 0.25, nk: 0.6, hs: 0.26, ears: 0.6, horns: 'hook', tail: 'short', mane: 0xd8d2c8 }),
    devil: B({ L: 0.6, H: 0.22, W: 0.24, bh: 0.24, col: 0x1d1a18, belly: 0xf2f0ea, neck: 0.06, nk: 0.3, hs: 0.2, snout: 0.6, ears: 0.45, earCol: 0xd88a8a, tail: 'short' }),
    dassie: B({ L: 0.45, H: 0.12, W: 0.24, bh: 0.24, col: 0x7a6a54, neck: 0.04, nk: 0.3, hs: 0.15, snout: 0.5, ears: 0.25, tail: 'none' }),
    eland: B({ L: 2.0, H: 1.25, W: 0.6, bh: 0.7, col: 0xb8946a, legs: 0x9a7a5a, neck: 0.45, nk: 0.7, hs: 0.34, ears: 0.4, horns: 'hook', hornCol: 0x3a2e24, dewlap: true, tail: 'tuft' }),
    // the females where the sexes look apart (SOC: a pair is a male and a female; a harem, a stag with his hinds)
    elkF: B({ L: 1.6, H: 1.08, W: 0.5, col: 0x8a6a4a, neckCol: 0x6a4e34, legs: 0x4a3222, rump: 0xd8c09a, neck: 0.6, nk: 0.85, hs: 0.31, snout: 0.7, ears: 0.55, tail: 'short' }),
    ibexF: B({ L: 1.1, H: 0.66, W: 0.36, col: 0x9a8a70, legs: 0x6a5a48, neck: 0.28, nk: 0.8, hs: 0.21, ears: 0.45, horns: 'hook', hornCol: 0x7a6a54, tail: 'short' }),
    bighornF: B({ L: 1.15, H: 0.72, W: 0.38, col: 0x8a6a4a, legs: 0x6a4a2a, rump: 0xe9e2cf, neck: 0.3, nk: 0.75, hs: 0.24, ears: 0.38, horns: 'hook', hornCol: 0x8a7a64, tail: 'short' }),
    sikaF: B({ L: 1.15, H: 0.75, W: 0.36, col: 0x9a6a3e, belly: 0xe9e2cf, rump: 0xf2f0ea, stripe: 0x7a4e2a, neck: 0.42, nk: 0.9, hs: 0.24, ears: 0.6, tail: 'short' }),
    muleBuck: B({ L: 1.5, H: 0.95, W: 0.45, col: 0x8a7a68, rump: 0xf0ece4, legs: 0x7a6a58, neck: 0.48, nk: 0.95, hs: 0.28, ears: 0.9, horns: 'stag', tail: 'short', tailCol: 0x15110e }),
    mouflonF: B({ L: 1.0, H: 0.64, W: 0.35, col: 0x9a6a4a, belly: 0xe9e2cf, legs: 0xd8d2c8, neck: 0.28, nk: 0.7, hs: 0.22, ears: 0.38, tail: 'short' }),
    kangarooF: () => kangaroo({ s: 0.84, col: 0xb8885a }),
    kangaroo: () => kangaroo(), joey: () => kangaroo({ s: 0.6, col: 0xb8855a }), wallaby: () => kangaroo({ s: 0.72, col: 0x7a6a5a, belly: 0xb8a890 }), emu,
    wombat: () => wombat(), cockatoo: () => bird(0xf2f2ee, { crest: 0xf2d21a }), galah: () => bird(0xe88aa0, { headCol: 0xf2c8d0, wing: 0x9aa0a8 }), magpie: () => bird(0x15171c, { wing: 0xf2f2ee }),
    stork: () => bird(0xf2f2ee, { s: 2.2, legs: 0.6, neck: 0.25, wing: 0x15171c, beak: 0.2, beakCol: 0xd8262a }), egret: () => bird(0xf8f8f2, { s: 1.8, legs: 0.5, neck: 0.35, beak: 0.16, beakCol: 0xe0b020, legCol: 0x15171c }),
    goose: () => bird(0x8a7a64, { s: 1.6, neck: 0.18, headCol: 0x15171c, beak: 0.08, legs: 0.12, legCol: 0x15171c }),
    bear: () => bear(), blackbear: () => bear(0x1d1a18), macaque: () => monkey(0x8a7a6a, 0xd86a5a), baboon: () => monkey(0x7a6a4a, 0x3a2e24), caiman: croc,
    // the farm's and the park's (the user, 3. 11. 2026: »6 slik različnih živali z različnimi elementi«): pigs and their piglets, hens, ducks and
    // swans on a pond, koalas in the gum trees
    pig: B({ L: 1.15, H: 0.36, W: 0.5, bh: 0.5, col: 0xe8b4a4, legs: 0xd89c8c, neck: 0.08, nk: 0.1, hs: 0.34, snout: 0.7, snoutCol: 0xe89e8e, ears: 0.45, earCol: 0xe0a494, tail: 'curly', graze: true }),
    pigB: B({ L: 1.15, H: 0.36, W: 0.5, bh: 0.5, col: 0x2e2826, legs: 0x2a2422, neck: 0.08, nk: 0.1, hs: 0.34, snout: 0.7, snoutCol: 0xc8908a, ears: 0.45, tail: 'curly' }),
    pigletP: B({ L: 0.48, H: 0.17, W: 0.21, bh: 0.21, col: 0xf0bcae, neck: 0.04, nk: 0.1, hs: 0.15, snout: 0.7, snoutCol: 0xe8a090, ears: 0.4, tail: 'curly' }),
    hen: () => bird(0xb8642a, { s: 1.15, crest: 0xd8262a, legs: 0.09, legCol: 0xe0b020, beak: 0.05, beakCol: 0xe0b020, wing: 0x8a4a1e }), henW: () => bird(0xf2f0ea, { s: 1.15, crest: 0xd8262a, legs: 0.09, legCol: 0xe0b020, beak: 0.05, beakCol: 0xe0b020 }),
    duck: () => bird(0x9a948a, { s: 1.35, neck: 0.03, headCol: 0x2f6a3a, beak: 0.08, beakCol: 0xe0b020, wing: 0x6a5a48 }), duckF: () => bird(0x8a6e4e, { s: 1.3, neck: 0.03, beak: 0.08, beakCol: 0xd88a2a, wing: 0x6a5238 }),
    swan: () => bird(0xf8f8f4, { s: 2.7, neck: 0.4, beak: 0.1, beakCol: 0xe8742a }), koala,
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
  function trough() { const g = new THREE.Group(), wd = 0x6b5034; g.add(box(2.6, 0.5, 0.7, wd, 0, 0.4, 0)); g.add(box(2.4, 0.04, 0.52, 0x4a6a78, 0, 0.62, 0)); for (const x of [-1.1, 1.1]) g.add(box(0.12, 0.2, 0.8, 0x4a3828, x, 0.1, 0)); return g; }   // (a water trough on a pasture)
  // the new scenes' own things (SCENE: things): a stork's nest on its pole (the nest's rim 6.62 m up), a duck house floating on its raft, a gum
  // tree (its fork 2.6 m up: a koala sits in it), a pig pen with its shed, a horses' paddock (its rails round 16 x 11 m)
  // and their stable
  function storkNest() { const g = new THREE.Group(), tw = 0x7a6248;
    g.add(cyl(0.12, 0.16, 6.2, 6, 0x6b5a48, 0, 3.1, 0)); g.add(cyl(0.62, 0.62, 0.06, 8, 0x5a4632, 0, 6.18, 0)); g.add(cyl(0.74, 0.56, 0.44, 9, tw, 0, 6.4, 0)); g.add(cyl(0.5, 0.5, 0.05, 8, 0x4a3a28, 0, 6.6, 0));
    for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + 0.3, r0 = 0.55, r1 = 0.95 + 0.12 * (k % 3); g.add(bar([Math.cos(a) * r0, 6.45 + 0.08 * (k % 2), Math.sin(a) * r0], [Math.cos(a + 0.25) * r1, 6.32 + 0.12 * (k % 3), Math.sin(a + 0.25) * r1], 0.035, k % 2 ? 0x8a7258 : 0x5a4632)); }
    return g; }
  function duckHouse() { const g = new THREE.Group(), wd = 0x9a7048; g.add(box(1.3, 0.12, 1.3, 0x6b5034, 0, 0.1, 0)); g.add(box(0.8, 0.5, 0.65, wd, 0, 0.41, 0)); g.add(box(0.2, 0.22, 0.04, 0x2a2018, 0, 0.32, 0.33));
    for (const sd of [1, -1]) g.add(box(0.95, 0.05, 0.48, 0x8a3a24, 0, 0.78, sd * 0.19, { rx: sd * 0.6 })); g.add(box(0.12, 0.03, 0.55, 0x6b5034, 0, 0.12, 0.85, { rx: 0.25 })); return g; }
  function eucalyptus() { const g = new THREE.Group(), bk = 0xd6cfc0, bk2 = 0xa89c88, lf = [0x7a8f6a, 0x6a7f5c, 0x86977a];
    g.add(cyl(0.2, 0.3, 2.6, 7, bk, 0, 1.3, 0)); for (const [y, r] of [[0.6, 0.4], [1.3, 2.1], [2.1, 4.0]]) g.add(box(0.2, 0.42, 0.06, bk2, Math.cos(r) * 0.24, y, Math.sin(r) * 0.24, { ry: -r }));
    for (const [x, y, z, t] of [[-1.1, 5.7, -0.3, 0.2], [0.95, 6.0, 0.2, 0.19], [0.1, 6.3, -0.9, 0.15]]) g.add(bar([0, 2.5, 0], [x, y, z], t, bk));
    for (const [x, y, z, r, k] of [[-1.3, 6.2, -0.3, 1.25, 0], [1.1, 6.5, 0.25, 1.15, 1], [0.1, 6.9, -1.0, 1.0, 2], [-0.3, 7.1, 0.5, 0.85, 0], [0.6, 5.6, -0.6, 0.8, 2]]) g.add(sph(r, 7, 4, lf[k], x, y, z, { s: [1, 0.62, 1] }));
    return g; }
  function pigsty() { const g = new THREE.Group(), wd = 0x7a5a3a, W = 7.0, D = 5.5;
    const side = (x0, z0, x1, z1, gap) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 1.75)), ry = Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2;
      for (let k = 0; k <= n; k++) { const f = k / n; g.add(box(0.12, 0.95, 0.12, 0x5a4026, x0 + (x1 - x0) * f, 0.47, z0 + (z1 - z0) * f)); }
      for (const y of [0.32, 0.72]) for (const [f0, f1] of gap ? [[0, 0.38], [0.62, 1]] : [[0, 1]]) { const xm = x0 + (x1 - x0) * (f0 + f1) / 2, zm = z0 + (z1 - z0) * (f0 + f1) / 2; g.add(box(L * (f1 - f0), 0.16, 0.05, wd, xm, y, zm, { ry })); } };
    side(-W / 2, D / 2, W / 2, D / 2, true); side(-W / 2, -D / 2, W / 2, -D / 2); side(-W / 2, -D / 2, -W / 2, D / 2); side(W / 2, -D / 2, W / 2, D / 2);
    g.add(box(2.6, 1.5, 1.7, 0x8a6a45, -1.6, 0.75, -D / 2 + 0.95)); g.add(box(3.0, 0.08, 2.2, 0x8a3a24, -1.6, 1.62, -D / 2 + 0.95, { rx: 0.16 })); g.add(box(0.75, 0.75, 0.04, 0x2a2018, -1.6, 0.38, -D / 2 + 1.81));
    g.add(box(1.4, 0.25, 0.42, 0x6b5034, 1.9, 0.13, -D / 2 + 0.6)); return g; }   // (its shed at the back, the trough by the fence)
  function paddock() { const g = new THREE.Group(), wd = 0xe8e4da, post = 0x8a6a45, W = 16, D = 11;
    const side = (x0, z0, x1, z1, gap) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 2.75)), ry = Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2;
      for (let k = 0; k <= n; k++) { const f = k / n; if (gap && f > 0.42 && f < 0.58) continue; g.add(box(0.13, 1.35, 0.13, post, x0 + (x1 - x0) * f, 0.67, z0 + (z1 - z0) * f)); }
      for (const y of [0.62, 1.15]) for (const [f0, f1] of gap ? [[0, 0.42], [0.58, 1]] : [[0, 1]]) { const xm = x0 + (x1 - x0) * (f0 + f1) / 2, zm = z0 + (z1 - z0) * (f0 + f1) / 2; g.add(box(L * (f1 - f0), 0.12, 0.05, wd, xm, y, zm, { ry })); } };
    side(-W / 2, D / 2, W / 2, D / 2, true); side(-W / 2, -D / 2, W / 2, -D / 2); side(-W / 2, -D / 2, -W / 2, D / 2); side(W / 2, -D / 2, W / 2, D / 2);
    return g; }
  function stable() { const g = new THREE.Group(), col = 0x8a3a24, wh = 0xe8e4da;
    g.add(box(5.2, 2.5, 3.0, col, 0, 1.25, 0)); g.add(box(5.24, 0.12, 3.04, wh, 0, 2.44, 0));
    const sh = new THREE.Shape(); sh.moveTo(-1.75, 0); sh.lineTo(1.75, 0); sh.lineTo(0, 1.25); const rf = new THREE.Mesh(flat(new THREE.ExtrudeGeometry(sh, { depth: 5.8, bevelEnabled: false })), lam(0x4a4a4c)); rf.rotation.y = Math.PI / 2; rf.position.set(-2.9, 2.5, 0); g.add(rf);
    for (const x of [-1.5, 0, 1.5]) { g.add(box(1.1, 1.3, 0.05, 0x6a2a1a, x, 0.9, 1.52)); g.add(box(1.15, 0.06, 0.06, wh, x, 1.57, 1.53)); g.add(bar([x - 0.5, 0.3, 1.54], [x + 0.5, 1.5, 1.54], 0.05, wh)); }
    g.add(box(0.8, 0.5, 0.05, 0x2a3440, -1.5, 2.0, 1.52)); g.add(box(0.8, 0.5, 0.05, 0x2a3440, 1.5, 2.0, 1.52)); return g; }
  const THINGS = { huntStand, feedRack, logPile, fallenTree, stumps, cabin: () => cabin(), cabinR: () => cabin(0x9b2c22, 0x2b2d31), beehive, hayrack, waterTank, windpump, vending, torii, lantern, cactus, mushrooms, signPost, picnic, shrine, palmHut, trough,
    storkNest, duckHouse, eucalyptus, pigsty, paddock, stable };
  // the footprint of a thing (the glade's radius: the trees within it go)
  const ROOM = { huntStand: 3.6, feedRack: 3.2, logPile: 4.0, fallenTree: 4.6, stumps: 2.8, cabin: 5.2, cabinR: 5.2, beehive: 3.4, hayrack: 5.0, waterTank: 2.8, windpump: 3.0, vending: 2.0, torii: 3.2, lantern: 1.6, cactus: 1.8, mushrooms: 1.8, signPost: 1.6, picnic: 2.6, shrine: 1.8, palmHut: 3.0, storkNest: 1.6, duckHouse: 1.2, eucalyptus: 2.4, pigsty: 4.6, paddock: 9.5, stable: 3.4, trough: 2.6 };

  /* ---------------- which life where: the species and the things of each track's country and region ----------------
     a: the animals (each in the company its kind keeps: SOC), t: the things in the woods, open: animals also out on open ground
     (deserts, pastures above the tree line: away from the road and from anything built), city: only the woods of a park, fewer of them,
     nizka: false: none at NIZKA (a track already at the phone budget's edge) */
  /* how each species keeps company (the user: »živali niso vse vedno v skupini, lahko sta po 2 moški in ženska, 3-10 odvisno katere živali«):
     one: the share alone, pair: the share of a male and a female (M, F: their kinds where they look apart), herd: [min, max] the size of a herd
     (the rest of the time), led by lead (default the male), the others rest (one kind or a choice); yp of them young: y (a kind of its own,
     the piglets, the joeys) or a smaller copy of theirs (ys) */
  const SOC = {
    roe: { one: 0.35, pair: 0.35, herd: [3, 5], F: 'roeF', lead: 'roeF', ys: 0.62, yp: 0.5 },   // (a doe with her fawns; a buck and a doe; alone)
    stag: { one: 0.2, pair: 0.15, herd: [4, 10], F: 'hind', ys: 0.62, yp: 0.3 },   // (a stag with his hinds and their calves)
    boar: { one: 0.25, herd: [4, 10], rest: 'boar', y: 'piglet', yp: 0.7 },   // (a sounder: sows and their piglets; an old boar alone)
    fox: { one: 0.7, pair: 0.3 }, hare: { one: 0.65, pair: 0.35 }, coyote: { one: 0.6, pair: 0.4 }, serow: { one: 0.9, pair: 0.1 }, devil: { one: 1 }, wombat: { one: 1 }, wallaby: { one: 0.6, pair: 0.4 },
    moose: { one: 0.4, pair: 0.3, herd: [2, 3], F: 'mooseF', lead: 'mooseF', ys: 0.58, yp: 1 },   // (a cow with her calves)
    chamois: { one: 0.2, herd: [3, 10], ys: 0.6, yp: 0.3 }, goatW: { one: 0.3, herd: [3, 6], ys: 0.55, yp: 0.3 },
    ibex: { one: 0.2, pair: 0.15, herd: [3, 8], F: 'ibexF', ys: 0.6, yp: 0.3 }, bighorn: { one: 0.2, pair: 0.1, herd: [3, 8], F: 'bighornF', ys: 0.6, yp: 0.3 },
    mouflon: { one: 0.15, pair: 0.15, herd: [3, 7], F: 'mouflonF', ys: 0.6, yp: 0.3 }, elk: { one: 0.2, pair: 0.15, herd: [4, 10], F: 'elkF', ys: 0.6, yp: 0.3 },
    muleDeer: { one: 0.3, pair: 0.3, herd: [3, 6], M: 'muleBuck', ys: 0.6, yp: 0.35 }, sika: { one: 0.25, pair: 0.3, herd: [3, 8], F: 'sikaF', ys: 0.6, yp: 0.3 },
    sheep: { herd: [5, 10], ys: 0.6, yp: 0.3 }, cow: { herd: [4, 10], ys: 0.6, yp: 0.2 }, cowB: { herd: [4, 10], ys: 0.6, yp: 0.2 }, cowK: { herd: [4, 10], ys: 0.6, yp: 0.2 },
    bison: { one: 0.15, herd: [4, 10], ys: 0.55, yp: 0.25 }, yak: { herd: [3, 8], ys: 0.55, yp: 0.25 }, buffalo: { one: 0.2, herd: [3, 6], ys: 0.55, yp: 0.25 },
    horse: { one: 0.15, pair: 0.25, herd: [3, 8], rest: ['horse', 'horseG'], ys: 0.6, yp: 0.25 }, horseG: { one: 0.15, pair: 0.25, herd: [3, 8], rest: ['horseG', 'horse'], ys: 0.6, yp: 0.25 },
    donkey: { one: 0.35, pair: 0.4, herd: [3, 4], ys: 0.6, yp: 0.3 }, camel: { one: 0.2, herd: [3, 6], ys: 0.6, yp: 0.25 }, guanaco: { one: 0.15, herd: [4, 10], ys: 0.6, yp: 0.25 },
    eland: { one: 0.1, herd: [3, 10], ys: 0.6, yp: 0.25 }, capybara: { one: 0.1, herd: [3, 8], ys: 0.55, yp: 0.35 }, coati: { herd: [3, 8], ys: 0.65, yp: 0.3 }, dassie: { herd: [3, 8], ys: 0.65, yp: 0.3 },
    kangaroo: { one: 0.15, pair: 0.15, herd: [3, 10], F: 'kangarooF', y: 'joey', yp: 0.3 },   // (a mob: a big male, the females, their joeys)
    emu: { one: 0.2, pair: 0.5, herd: [3, 6], ys: 0.45, yp: 0.5 },   // (a father with his chicks)
    cockatoo: { one: 0.1, herd: [4, 10] }, galah: { one: 0.1, herd: [4, 10] }, magpie: { one: 0.3, pair: 0.6, herd: [3, 5] }, stork: { one: 0.4, pair: 0.6 }, egret: { one: 0.4, herd: [3, 8] },
    goose: { pair: 0.3, herd: [3, 10], ys: 0.55, yp: 0.3 }, bear: { one: 0.7, herd: [3, 3], ys: 0.45, yp: 1 }, blackbear: { one: 0.7, herd: [3, 3], ys: 0.45, yp: 1 },
    macaque: { one: 0.1, herd: [4, 10], ys: 0.6, yp: 0.3 }, baboon: { herd: [4, 10], ys: 0.6, yp: 0.3 }, caiman: { one: 0.5, herd: [2, 4], ys: 0.7, yp: 0.3 },
    pig: { herd: [4, 9], rest: ['pig', 'pig', 'pigB'], y: 'pigletP', yp: 0.5 }, hen: { herd: [4, 8], rest: ['hen', 'henW', 'hen'] }, duck: { pair: 0.4, herd: [4, 9], F: 'duckF', rest: ['duck', 'duckF', 'duckF'] },
    swan: { pair: 1 }, koala: { one: 1 },
  };
  const SOC_DEF = { one: 0.3, pair: 0.3, herd: [3, 5], ys: 0.6, yp: 0.3 };
  const HERD_SP = (size) => 1.05 * size + 1.1;   // (a herd's spacing by its kind's size: loose, a body's length and more between them)
  // one company of kind: [[kind, scale], ...] (the first: the lead); force: 'one' | 'pair' | 'herd' (the scenes), n: the herd's size
  function company(kind, R, force, n) {
    const S = SOC[kind] || SOC_DEF, M = S.M || kind, F = S.F || kind, r = R();
    // (the user: »samo nekatere naj bodo skupaj, ostale pa različno po mapi«: a herd 40 % as often as the species alone would keep one; the rest alone or in pairs)
    const o1 = S.one || 0, p1 = S.pair || 0, h1 = Math.max(0, 1 - o1 - p1) * (S.herd ? 0.4 : 0), sp = 1 - h1, one = o1 + p1 > 0 ? sp * o1 / (o1 + p1) : sp * 0.7;
    const how = force || (r < one ? 'one' : r < sp ? 'pair' : 'herd');
    if (how === 'one') return [[S.F && R() < 0.45 ? F : M, 1]];
    if (how === 'pair') return [[M, 1], [F, F === M ? 0.93 : 1]];
    const h = S.herd || [3, 5], N = n || h[0] + Math.floor(R() * (h[1] - h[0] + 1)), out = [[S.lead || M, 1]];
    for (let k = 1; k < N; k++) { const rest = S.rest || F, kk = Array.isArray(rest) ? rest[Math.floor(R() * rest.length)] : rest;
      out.push(R() < (S.yp || 0) ? (S.y ? [S.y, 1] : [kk, S.ys || 0.6]) : [kk, 0.9 + R() * 0.14]); }
    return out;
  }
  const ZIV = {
  };
  for (const d of (typeof TRACK_DEFS !== 'undefined' ? TRACK_DEFS : [])) if (d.zivali != null && d.id != null && ZIV[d.id] == null) ZIV[d.id] = d.zivali;   // (the real tracks' own: def.zivali in js/tracks/<id>.js, tools/razdeli-proge.mjs)

  /* ---------------- the templates: a model baked once into arrays (its bottom faces dropped: no camera sees them) ---------------- */
  const TPL = new Map();
  // graze: a beast's variant (true: the head down to the grass, false: up; undefined: as its species is); an animal is shaded from the ground
  // up (its legs and belly darker, its back lighter: from above, where the camera sees it, it has a body)
  function tpl(kind, graze) {
    const f0 = SPECIES[kind], key = f0 && f0.o && graze != null ? kind + (graze ? '|g' : '|u') : kind;
    let t = TPL.get(key); if (t) return t;
    const make = SPECIES[kind] || THINGS[kind]; if (!make) return null;
    const g = f0 && f0.o && graze != null ? f0({ graze }) : make(); g.updateMatrixWorld(true);
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
    let lo = 1e9, hi = -1e9, top = 0.01; for (let i = 0; i < P.length; i += 3) { lo = Math.min(lo, P[i], P[i + 2]); hi = Math.max(hi, P[i], P[i + 2]); top = Math.max(top, P[i + 1]); }
    if (f0) for (let i = 0; i < P.length; i += 3) { const k = 0.68 + 0.4 * Math.min(1, Math.max(0, P[i + 1] / top)); C[i] *= k; C[i + 1] *= k; C[i + 2] *= k; }
    t = { P: new Float32Array(P), N: new Float32Array(N), C: new Float32Array(C), size: hi - lo, top }; TPL.set(key, t); return t;   // (size: the footprint's longer side, for the herds' spacing)
  }
  // a template into a chunk's geometry builder at (x, y, z), turned by yaw (THREE's rotation.y), scaled by s
  function put(gb, t, x, y, z, yaw, s, tint) {
    const c = Math.cos(yaw), sn = Math.sin(yaw), P = t.P, N = t.N, C = t.C, k = tint || 1;
    for (let i = 0; i < P.length; i += 3) {
      const px = P[i] * s, pz = P[i + 2] * s, nx = N[i], nz = N[i + 2];
      gb.P.push(x + px * c + pz * sn, y + P[i + 1] * s, z - px * sn + pz * c); gb.N.push(nx * c + nz * sn, N[i + 1], -nx * sn + nz * c); gb.C.push(C[i] * k, C[i + 1] * k, C[i + 2] * k);
    }
  }

  /* ---------------- the live ones (LIVE): an animal alone walks to and fro or grazes (the user: »nekatere živali pa naj bodo same ter se
     sprehajajo ali pa jejo travo«). Its own mesh (one draw call while in view, hidden farther than LIVE_R), its model upright, baked in its own
     frame with each vertex's part and joint (aJ: legs 1-4 swung from their tops, the neck 5 bowed from its foot, the head 7 tipped back a
     little from the neck's top); the vertex shader moves them (uA: the gait's phase, the legs' swing, the neck's bow), World.lifeStep places
     it (World.update, every frame). Kangaroos bound; a bear or a wombat walks as one piece. From SREDNJA up (LOD 'animals', as the worlds'
     other animals); the shadow is the standing pose's ---------------- */
  const SOFT = [0.62, 0.42], SOFTC = [0.03, 0.035, 0.02];   // (its soft shadow: the see-through of its middle and its inner ring, its rim clear; its colour)
  // the upright model with its joints (TPLR: the live ones' meshes and the herds' animals in the chunks): every vertex with its part and its
  // joint (aJ: legs 1-4 swung from their tops, the neck 5 bowed from its foot, the tail 6 swishing about its root, the head 7 tipped back a
  // little from the neck's top; 0 the body), shaded from the ground up as tpl
  const TPLR = new Map();
  function tplRig(kind) {
    if (TPLR.has(kind)) return TPLR.get(kind);
    const f = SPECIES[kind]; if (!f) { TPLR.set(kind, null); return null; }
    const g = f.o ? f({ graze: false }) : f(); g.updateMatrixWorld(true);
    const P = [], N = [], C = [], J = [], D = [], v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3();
    g.traverse(m => {
      if (!m.isMesh) return;
      let q = m, pt = 0, pv = null; while (q && q !== g) { if (q.userData.part) { pt = q.userData.part; pv = q.userData.pivot; break; } q = q.parent; }
      const geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry, pa = geo.attributes.position, na = geo.attributes.normal, c = m.material.color;
      nm.getNormalMatrix(m.matrixWorld);
      for (let i = 0; i + 2 < pa.count; i += 3) {
        n.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); const down = n.y < -0.97; if (down && !pt) continue;   // (a face looking straight down: not the moving parts', which turn)
        for (let k = 0; k < 3; k++) { v.fromBufferAttribute(pa, i + k).applyMatrix4(m.matrixWorld); n.fromBufferAttribute(na, i + k).applyMatrix3(nm).normalize();
          P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z); C.push(c.r, c.g, c.b); J.push(pv ? pv[0] : 0, pv ? pv[1] : 0, pv ? pv[2] : 0, pt); D.push(down ? 1 : 0); }
      }
      if (geo !== m.geometry) geo.dispose();
    });
    let lo = 1e9, hi = -1e9, top = 0.01; for (let i = 0; i < P.length; i += 3) { lo = Math.min(lo, P[i], P[i + 2]); hi = Math.max(hi, P[i], P[i + 2]); top = Math.max(top, P[i + 1]); }
    for (let i = 0; i < P.length; i += 3) { const k = 0.68 + 0.4 * Math.min(1, Math.max(0, P[i + 1] / top)); C[i] *= k; C[i + 1] *= k; C[i + 2] *= k; }   // (shaded from the ground up, as tpl)
    const t = { P: new Float32Array(P), N: new Float32Array(N), C: new Float32Array(C), J: new Float32Array(J), size: hi - lo, top, n0: g.userData.n0 || [0, 0, 0], graze: g.userData.graze || 0,
      len: g.userData.len || 1, rig: !!f.o, hop: /^(kangaroo|kangarooF|wallaby|joey)$/.test(kind) };
    // the herds' copy: without the moving parts' faces looking straight down too (the soles, under the head: the herds sway them less, the
    // camera above never sees them; fewer vertices for the phone)
    const keep = (a, w) => a.filter((_, i) => !D[Math.floor(i / w)]);
    t.herd = Object.assign({}, t, { P: new Float32Array(keep(P, 3)), N: new Float32Array(keep(N, 3)), C: new Float32Array(keep(C, 3)), J: new Float32Array(keep(J, 4)) });
    TPLR.set(kind, t); return t;
  }
  const TPLL = new Map();
  function tplLive(kind) {   // a live one's mesh: the upright model; and its soft shadow (its own see-through mesh under it: it goes with it)
    if (TPLL.has(kind)) return TPLL.get(kind);
    const r = tplRig(kind); if (!r) { TPLL.set(kind, null); return null; }
    const P = Array.from(r.P), N = Array.from(r.N), C = Array.from(r.C), J = Array.from(r.J), br = r.size * 0.36;
    const SP = [], SA = [], at = (f, an) => [Math.cos(an) * br * f, 0.03, Math.sin(an) * br * f * 1.5];   // (its soft shadow: as the herds', flat under it)
    for (let q = 0; q < 8; q++) { const a0 = q / 8 * TAU, a1 = (q + 1) / 8 * TAU, tri = (...v) => { for (const [p, al] of v) { SP.push(p[0], p[1], p[2]); SA.push(SOFTC[0], SOFTC[1], SOFTC[2], al); } };
      tri([[0, 0.03, 0], SOFT[0]], [at(0.5, a1), SOFT[1]], [at(0.5, a0), SOFT[1]]); tri([at(0.5, a0), SOFT[1]], [at(0.5, a1), SOFT[1]], [at(1, a1), 0]); tri([at(0.5, a0), SOFT[1]], [at(1, a1), 0], [at(1, a0), 0]); }
    const soft = new THREE.BufferGeometry(); soft.setAttribute('position', new THREE.Float32BufferAttribute(SP, 3)); const sa = new THREE.Float32BufferAttribute(SA, 4); sa.noSeason = true; soft.setAttribute('color', sa); soft.computeBoundingSphere();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3)); geo.setAttribute('aJ', new THREE.BufferAttribute(new Float32Array(J), 4));
    geo.computeBoundingSphere(); geo.boundingSphere.radius *= 1.25;   // (the legs and the head swing out of the standing pose's sphere)
    const t = { geo, soft, n0: r.n0, graze: r.graze, len: r.len, rig: r.rig, hop: r.hop };
    TPLL.set(kind, t); return t;
  }
  // the stork that flies off its nest (the user, 4. 11. 2026: »štorklja naj bo samo ena in to na drogu, ko prideš z avtom blizu, ona odleti stran od
  // avta, saj se je preplašila«): in flight its neck stretched ahead, its legs trailing, the wings white with their trailing half black, each in
  // two pieces that beat (flyPose: the shoulder and the elbow, on the CPU, only while it flies); J: 0 its body, ±1 a wing's inner piece, ±2 its
  // outer one (the sign: its side)
  function storkFlyGeo() {
    const P = [], N = [], C = [], J = [], v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3(), WH = 0xf2f2ee, BK = 0x15171c, RD = 0xd8262a;
    const bake = (g, j) => { g.updateMatrixWorld(true); g.traverse(m => { if (!m.isMesh) return;
      const geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry, pa = geo.attributes.position, na = geo.attributes.normal, c = m.material.color; nm.getNormalMatrix(m.matrixWorld);
      for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(m.matrixWorld); n.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z); C.push(c.r, c.g, c.b); J.push(j); }
      if (geo !== m.geometry) geo.dispose(); }); };
    bake(grp(sph(0.17, 7, 4, WH, 0, 0, 0, { s: [0.95, 0.85, 2.0] }), box(0.08, 0.08, 0.34, WH, 0, 0.03, 0.47), sph(0.075, 6, 3, WH, 0, 0.04, 0.66), box(0.035, 0.035, 0.28, RD, 0, 0.03, 0.84),
      box(0.2, 0.04, 0.2, WH, 0, 0.02, -0.4), bar([0.05, -0.07, -0.25], [0.05, -0.1, -0.78], 0.03, RD), bar([-0.05, -0.07, -0.25], [-0.05, -0.1, -0.78], 0.03, RD)), 0);
    for (const sd of [1, -1]) {
      bake(grp(box(0.62, 0.03, 0.22, WH, sd * 0.45, 0.05, 0.1), box(0.62, 0.03, 0.2, BK, sd * 0.45, 0.05, -0.11)), sd);
      bake(grp(box(0.58, 0.025, 0.1, WH, sd * 1.05, 0.05, 0.12), box(0.58, 0.025, 0.24, BK, sd * 1.05, 0.05, -0.05)), sd * 2); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N), 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1.7);
    const wing = []; for (let k = 0; k < J.length; k++) if (J[k]) wing.push(k);
    return { geo, P0: new Float32Array(P), N0: new Float32Array(N), J, wing };
  }
  function flyPose(G, ph) {   // the wings at their beat's angle ph (up: +), the outer piece bent on at the elbow
    const p = G.geo.attributes.position.array, q = G.geo.attributes.normal.array, P0 = G.P0, N0 = G.N0;
    for (const k of G.wing) { const j = G.J[k], sd = j > 0 ? 1 : -1, o = k * 3; let x = P0[o], y = P0[o + 1], nx = N0[o], ny = N0[o + 1];
      if (j === 2 || j === -2) { const a = sd * ph * 0.7, c = Math.cos(a), s = Math.sin(a), dx = x - sd * 0.76, dy = y - 0.05, m = nx * c - ny * s; x = sd * 0.76 + dx * c - dy * s; y = 0.05 + dx * s + dy * c; ny = nx * s + ny * c; nx = m; }
      const a = sd * ph, c = Math.cos(a), s = Math.sin(a), dx = x - sd * 0.14, dy = y - 0.05;
      p[o] = sd * 0.14 + dx * c - dy * s; p[o + 1] = 0.05 + dx * s + dy * c; q[o] = nx * c - ny * s; q[o + 1] = nx * s + ny * c; }
    G.geo.attributes.position.needsUpdate = true; G.geo.attributes.normal.needsUpdate = true;
  }
  // the flyer each frame: on its nest until the car comes within 55 m, then up and away from it (away from the road too), climbing slowly, its wings
  // beating hard at first, then gliding with slower beats; out of sight after 16 s. Back on its nest when the time goes back (a replay) or
  // long after, the car far away; without a car on its nest
  function flyStep(F, t, car, cp, far2) {
    if (!cp) { F.st = 0; F.sit.visible = true; F.fly.visible = false; return; }
    const dc = Math.hypot(car.x - F.x, car.z - F.z);
    if (F.st && (t < F.t0 - 0.5 || (t - F.t0 > 30 && dc > 150))) F.st = 0;
    if (!F.st && dc < 55) { F.st = 1; F.t0 = t; const l = dc || 1, ax = (F.x - car.x) / l + F.ax, az = (F.z - car.z) / l + F.az; F.th = Math.atan2(ax, az);
      F.k = 0.004 * (Math.cos(F.th) * F.ax - Math.sin(F.th) * F.az >= 0 ? 1 : -1); }
    F.sit.visible = !F.st && (F.x - cp.x) ** 2 + (F.z - cp.z) ** 2 < far2;
    const u = F.st ? Math.max(0, t - F.t0) : 0; F.fly.visible = !!F.st && u < 16; if (!F.fly.visible) return;
    const d = 11 * (u - 1.5 * (1 - Math.exp(-u / 1.5))), th = F.th + F.k * d, w = SM(2.5, 5, u);
    F.fly.position.set(F.x + (Math.cos(F.th) - Math.cos(th)) / F.k, F.y + 0.45 + 2.5 * (1 - Math.exp(-u / 2)) + 0.35 * u, F.z + (Math.sin(th) - Math.sin(F.th)) / F.k);   // (low over the meadow at first: the chase camera looks down, it stays in sight)
    F.fly.rotation.set(-(0.3 * Math.exp(-u / 1.5) + 0.04), th, -Math.sign(F.k) * 0.18 * w, 'YXZ');
    flyPose(F.G, 0.08 + (0.75 - 0.45 * w) * Math.sin(TAU * (2.2 - 0.6 * w) * u));
  }
  const LIVE_VS_HEAD = 'attribute vec4 aJ;\nuniform vec3 uA;\nuniform vec3 uN0;\nvec3 zvRx( vec3 p, float a ) { float c = cos( a ), s = sin( a ); return vec3( p.x, p.y * c - p.z * s, p.y * s + p.z * c ); }';
  const LIVE_VS_NORMAL = [
    'float zvK = aJ.w, zvLeg = step( 0.5, zvK ) * ( 1.0 - step( 4.5, zvK ) ), zvHd = step( 6.5, zvK ) * ( 1.0 - step( 7.5, zvK ) );',
    'float zvSg = ( step( 0.5, zvK ) * ( 1.0 - step( 1.5, zvK ) ) + step( 3.5, zvK ) * ( 1.0 - step( 4.5, zvK ) ) ) * 2.0 - 1.0;   // (the diagonal pairs swing together)',
    'float zvNk = step( 4.5, zvK ) * ( 1.0 - step( 5.5, zvK ) ) + zvHd;',
    'float zvAL = zvLeg * zvSg * 0.5 * uA.y * sin( uA.x ), zvAH = -0.55 * uA.z * zvHd, zvAN = uA.z * zvNk;',
    'vec3 objectNormal = zvRx( zvRx( vec3( normal ), zvAL + zvAH ), zvAN );',
    '#ifdef USE_TANGENT\nvec3 objectTangent = vec3( tangent.xyz );\n#endif'].join('\n');
  const LIVE_VS_POS = 'vec3 transformed = aJ.xyz + zvRx( position - aJ.xyz, zvAL + zvAH );\ntransformed = uN0 + zvRx( transformed - uN0, zvAN );';
  function liveMat(t) {   // a material of its own (its uniforms are the animal's), one shared program
    const U = { uA: { value: new THREE.Vector3() }, uN0: { value: new THREE.Vector3(t.n0[0], t.n0[1], t.n0[2]) } }, m = new THREE.MeshLambertMaterial({ vertexColors: true });
    m.onBeforeCompile = (sh) => { sh.uniforms.uA = U.uA; sh.uniforms.uN0 = U.uN0;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + LIVE_VS_HEAD).replace('#include <beginnormal_vertex>', LIVE_VS_NORMAL).replace('#include <begin_vertex>', LIVE_VS_POS); };
    m.customProgramCacheKey = () => 'zivLive'; m.userData.U = U; return m;
  }
  const SM = (e0, e1, x) => { const u = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return u * u * (3 - 2 * u); };
  // where a live one is at time t and how it moves: o.x, o.z, o.yaw, o.dy, o.gait (the legs' phase), o.legs (their swing, 0-1), o.head (the neck's bow)
  function liveAt(a, t, o) {
    o.dy = 0;
    if (a.mode === 'graze') {   // on the spot: the head down most of the cycle, up a while, then two steps on round a small circle
      const P = a.per, w = t + a.ph, k = Math.floor(w / P), u = w - k * P, st = SM(P - 2.2, P, u), ang = a.ang0 + (k + st) * 0.55;
      o.x = a.x0 + Math.sin(ang) * a.rad; o.z = a.z0 + Math.cos(ang) * a.rad; o.yaw = ang + Math.PI / 2;
      const up = SM(P * 0.45, P * 0.45 + 0.5, u) * (1 - SM(P * 0.45 + 1.5, P * 0.45 + 2.0, u)), stepping = SM(P - 2.2, P - 1.8, u) * (1 - SM(P - 0.4, P, u));
      o.legs = stepping * 0.7; o.gait = (k + st) * 0.55 * a.rad / a.stride * TAU; o.head = a.gz * (1 - up) * (1 - 0.6 * stepping) + 0.04 * Math.sin(w * 5.3) * (1 - up);
      return o;
    }
    // to and fro along the path (a.L from (x0, z0) along yaw0), a while grazing at either end, turning round
    const Tw = a.L / a.v, Tp = a.pause, Tt = 1.8, H = Tw + Tp + Tt, w = ((t + a.ph) % (2 * H) + 2 * H) % (2 * H), back = w >= H, u = back ? w - H : w;
    let s, dist; o.yaw = a.yaw0 + (back ? Math.PI : 0); o.legs = 0; o.head = 0;
    if (u < Tw) { s = a.v * u; dist = s; o.legs = SM(0, 0.5, u) * (1 - SM(Tw - 0.5, Tw, u)); o.head = 0.06; }
    else if (u < Tw + Tp) { s = a.L; dist = a.L; const g = u - Tw; o.head = a.gz * SM(0.3, 1.0, g) * (1 - SM(Tp - 0.9, Tp - 0.2, g)) * (1 - SM(Tp * 0.5, Tp * 0.5 + 0.4, g) * (1 - SM(Tp * 0.5 + 1.2, Tp * 0.5 + 1.6, g))); }
    else { s = a.L; const f = (u - Tw - Tp) / Tt; dist = a.L + f * 0.9; o.yaw += Math.PI * SM(0, 1, f); o.legs = 0.5 * Math.sin(Math.PI * f); }
    const along = back ? a.L - s : s; o.x = a.x0 + Math.sin(a.yaw0) * along; o.z = a.z0 + Math.cos(a.yaw0) * along; o.gait = dist / a.stride * TAU;
    if (a.hop) { o.dy = 0.3 * Math.abs(Math.sin(o.gait / 2)) * o.legs; o.legs = 0; }   // (a kangaroo bounds: up and down, no legs to swing)
    else if (!a.rig) o.dy = 0.025 * Math.abs(Math.sin(o.gait)) * o.legs;   // (a bear, a wombat: one piece, a little bob)
    return o;
  }
  // every frame (World.update): the live ones near the camera placed and posed; without a car (the world test) all at time 0, as built
  World.lifeStep = function (L, t, car, cam) {
    const o = L.tmp, cp = car && cam ? cam.position : null;
    for (const a of L.live) {
      if (cp) { const vis = (a.cx - cp.x) ** 2 + (a.cz - cp.z) ** 2 < L.far2; a.m.visible = vis; if (!vis) continue; }
      liveAt(a, cp ? t : 0, o);
      const y = L.gH(o.x, o.z); a.m.position.set(o.x, (Number.isFinite(y) ? y : a.y0) - 0.03 + o.dy, o.z); a.m.rotation.y = o.yaw;
      a.U.uA.value.set(o.gait % (TAU * 64), o.legs, o.head);
      if (!cp) { a.m.visible = true; a.m.updateMatrixWorld(true); }
    }
    for (const F of L.fly || []) flyStep(F, t, car, cp, L.far2);
    if (L.U) L.U.value = cp ? t % 3600 : 0;   // (the herds in the chunks: their shader's time; without a car, as built)
  };

  /* ---------------- the herds move (the user, 2. 11. 2026: »izgleda kot da so vse živali pri miru, živali naj se premikajo pomalo«): every
     animal standing in a glade or a scene is baked into its chunk upright, in its own frame (aL: its place and yaw; aJ: its parts' joints as
     the live ones'; aM: its time and kind of moving, its neck's bow to the grass, its way's straight, its stride; aS: its neck's foot, the ground's slope), and the
     chunk's vertex shader moves it slowly by the time (uT, World.lifeStep): it grazes, its head sweeping from side to side, now and then lifts
     its head and looks round, then takes a few steps along its way (a small loop from where it stands: ahead, round, back, round; no longer than the
     room to its neighbours in the herd), its tail swishing; a kangaroo hops, a bird pecks, a bear, a wombat or a monkey shifts as one piece, a crocodile hardly
     at all. On every tier, no draw call more (the chunk is one mesh as before); the shadow map's pass poses them as well (customDepthMaterial).
     Each its own pace (its time from its place: no random draw, the rest of the life as built) ---------------- */
  const HERD_VS = [
    'attribute vec4 aJ;', 'attribute vec4 aL;', 'attribute vec4 aM;', 'attribute vec4 aS;', 'uniform float uT;',
    'float zvMd, zvJx, zvTy, zvNx, zvNy, zvPx, zvYw; vec3 zvOf;',
    'vec3 zvRx( vec3 p, float a ) { float c = cos( a ), s = sin( a ); return vec3( p.x, p.y * c - p.z * s, p.y * s + p.z * c ); }',
    'vec3 zvRy( vec3 p, float a ) { float c = cos( a ), s = sin( a ); return vec3( p.x * c + p.z * s, p.y, -p.x * s + p.z * c ); }',
    'float zvSM( float e0, float e1, float x ) { float u = clamp( ( x - e0 ) / ( e1 - e0 ), 0.0, 1.0 ); return u * u * ( 3.0 - 2.0 * u ); }',
    // (its way: a loop of two straights S and two turns of radius w, from where it stands: ahead, round, back, round; returns x, z, the heading)
    'vec3 zvLoop( float s, float S, float w ) { float C = 3.1415927 * w; s = mod( s, 2.0 * ( S + C ) );',
    '  if ( s < S ) return vec3( 0.0, s, 0.0 );',
    '  if ( s < S + C ) { float a = ( s - S ) / w; return vec3( w - w * cos( a ), S + w * sin( a ), a ); }',
    '  if ( s < 2.0 * S + C ) return vec3( 2.0 * w, 2.0 * S + C - s, 3.1415927 );',
    '  float a = ( s - 2.0 * S - C ) / w; return vec3( w + w * cos( a ), -w * sin( a ), 3.1415927 + a ); }',
    'void zvPose() {',   // (the animal's pose at uT: the same for all its vertices; md 0: a still thing, 1 a beast, 2 one piece, 3 a hopper, 4 a bird, 5 a crocodile)
    '  zvMd = floor( aM.x * 0.01 + 0.001 ); if ( zvMd < 0.5 ) return;',
    '  float ph = aM.x - 100.0 * zvMd, one = step( 1.5, zvMd ) * step( zvMd, 2.5 ), hop = step( 2.5, zvMd ) * step( zvMd, 3.5 ), bird = step( 3.5, zvMd ) * step( zvMd, 4.5 ), lazy = step( 4.5, zvMd );',
    // (a cycle of 7-13 s, four times that for a crocodile: grazing, the head up a while, a few steps at its end)
    '  float P = ( 7.0 + fract( ph * 0.618034 ) * 6.0 ) * ( 1.0 + 3.0 * lazy ), w = uT + ph, k = floor( w / P ), u = w - k * P, s0 = P - 2.2;',
    '  float st = zvSM( s0, P, u ), mv = zvSM( s0, s0 + 0.4, u ) * ( 1.0 - zvSM( P - 0.4, P, u ) );',
    '  float dir = fract( ph * 0.37 ) < 0.5 ? -1.0 : 1.0, S = aM.z, sw = ( k + st ) * max( 0.5 * S, 0.12 );',   // (each cycle's steps half a straight: the way walked)
    '  vec3 lp = zvLoop( sw, S, clamp( 0.3 * S, 0.08, 0.45 ) ); float lx = dir * lp.x, cy = cos( aL.w ), sy = sin( aL.w );',
    '  float up = zvSM( P * 0.38, P * 0.38 + 0.6, u ) * ( 1.0 - zvSM( P * 0.38 + 2.2, P * 0.38 + 2.8, u ) ), eat = ( 1.0 - up ) * ( 1.0 - mv );',
    '  float gait = sw / max( aM.w, 0.2 ) * 6.2831853, pt = aJ.w;',
    '  float leg = step( 0.5, pt ) * step( pt, 4.5 ), sg = ( step( 0.5, pt ) * step( pt, 1.5 ) + step( 3.5, pt ) * step( pt, 4.5 ) ) * 2.0 - 1.0;',   // (the diagonal pairs swing together)
    '  float hd = step( 6.5, pt ) * step( pt, 7.5 ), nk = step( 4.5, pt ) * step( pt, 5.5 ) + hd, sh = step( 8.5, pt ), beast = 1.0 - one - hop - bird;',
    '  float bow = ( aM.y * ( 1.0 - up ) * ( 1.0 - 0.65 * mv ) + 0.05 * sin( w * 4.7 ) * eat * step( 0.01, aM.y ) ) * ( 1.0 - bird );',   // (down to the grass, nibbling)
    '  zvJx = leg * sg * 0.35 * mv * beast * sin( gait ) - 0.55 * bow * hd;',
    '  zvTy = step( 5.5, pt ) * step( pt, 6.5 ) * 0.45 * sin( w * 2.9 + ph * 5.0 ) * zvSM( 0.2, 0.7, sin( w * 0.37 + ph ) ) * ( 1.0 - 0.6 * lazy );',   // (the tail swishes now and then)
    '  zvNx = bow * nk; zvNy = ( 0.28 * sin( w * 0.83 + ph * 2.1 ) * eat + 0.55 * up * sin( k * 2.39 + ph ) ) * nk;',   // (the head sweeps from side to side grazing; up, it looks round)
    '  float pk = fract( w * 0.9 + ph );',
    '  zvPx = bird * eat * aM.y * zvSM( 0.0, 0.12, pk ) * ( 1.0 - zvSM( 0.2, 0.32, pk ) ) * ( 1.0 - sh );',   // (a bird pecks: tipped forward about its feet)
    '  zvYw = aL.w + dir * lp.z;',
    '  float dy = ( hop * 0.3 * abs( sin( st * 9.424778 ) ) + one * 0.03 * abs( sin( gait ) ) + bird * 0.05 * abs( sin( st * 9.424778 ) ) ) * mv * ( 1.0 - sh );',   // (a kangaroo: three hops)
    '  vec2 of = vec2( lx * cy + lp.y * sy, -lx * sy + lp.y * cy );',
    '  zvOf = vec3( of.x, dy + aS.z * of.x + aS.w * of.y, of.y );',   // (on the ground's slope)
    '}',
    'vec3 zvPos( vec3 p ) { vec3 n0 = vec3( 0.0, aS.x, aS.y );',
    '  p = aJ.xyz + zvRx( p - aJ.xyz, zvJx ); p = aJ.xyz + zvRy( p - aJ.xyz, zvTy ); p = n0 + zvRy( zvRx( p - n0, zvNx ), zvNy );',
    '  return aL.xyz + zvOf + zvRy( zvRx( p, zvPx ), zvYw ); }',
    'vec3 zvNrm( vec3 n ) { return zvRy( zvRx( zvRy( zvRx( zvRy( zvRx( n, zvJx ), zvTy ), zvNx ), zvNy ), zvPx ), zvYw ); }',
  ].join('\n');
  const HERD_NORMAL = 'zvPose();\nvec3 objectNormal = zvMd > 0.5 ? zvNrm( vec3( normal ) ) : vec3( normal );\n#ifdef USE_TANGENT\nvec3 objectTangent = vec3( tangent.xyz );\n#endif';
  const HERD_POS = 'vec3 transformed = zvMd > 0.5 ? zvPos( vec3( position ) ) : vec3( position );';
  function herdMats(U) {   // the chunk's material, its shadow map pass's and the animals' soft shadows' (one program each for all the chunks)
    const m = new THREE.MeshLambertMaterial({ vertexColors: true }), d = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    m.onBeforeCompile = (sh) => { sh.uniforms.uT = U;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + HERD_VS).replace('#include <beginnormal_vertex>', HERD_NORMAL).replace('#include <begin_vertex>', HERD_POS); };
    d.onBeforeCompile = (sh) => {   // (the shadow map: the animals none, the things theirs; an animal's shadow is its soft spot)
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aM;').replace('#include <begin_vertex>', 'vec3 transformed = aM.x >= 50.0 ? vec3( 0.0 ) : vec3( position );'); };
    const b = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 });
    b.onBeforeCompile = (sh) => { sh.uniforms.uT = U;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + HERD_VS).replace('#include <begin_vertex>', 'zvPose();\n' + HERD_POS); };
    m.customProgramCacheKey = () => 'zvHerd'; d.customProgramCacheKey = () => 'zvHerdD'; b.customProgramCacheKey = () => 'zvHerdS'; m.userData.herd = true; b.userData.soft = true;
    return { m, d, b };
  }
  const BIRDS = new Set(['emu', 'cockatoo', 'galah', 'magpie', 'stork', 'egret', 'goose', 'hen', 'henW', 'duck', 'duckF', 'swan']);
  const herdMode = (kind, t) => kind === 'caiman' ? 5 : BIRDS.has(kind) ? 4 : t.hop ? 3 : t.rig ? 1 : 2;
  const hash01 = (x, z) => { const h = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return h - Math.floor(h); };
  // one animal into a chunk's builder: its model in its own frame (scaled by s), its soft shadow into the chunk's shadow builder; returns its
  // record (its way's straight S, may be shortened to its neighbours: herdAt)
  function herdPut(gb, gH, kind, t, x, y, z, yaw, s, tint) {
    const a = gb.P.length / 3, P = t.P, N = t.N, C = t.C, k = tint || 1;
    for (let i = 0; i < P.length; i += 3) { gb.P.push(P[i] * s, P[i + 1] * s, P[i + 2] * s); gb.N.push(N[i], N[i + 1], N[i + 2]); gb.C.push(C[i] * k, C[i + 1] * k, C[i + 2] * k); }
    // its shadow (the user, 2. 11. 2026: »naj imajo povsem mehke sence«): a soft dark spot under it, darkest in the middle and fading to
    // nothing at its rim (two rings of eight), draped on the ground where it stands, in the chunk's shadow mesh (gb.bl: its own, see-through);
    // it goes with the animal (part 9: not with its legs or head)
    const r = t.size * s * 0.36, c = Math.cos(yaw), sn = Math.sin(yaw), at = (lx, lz, al) => { const h = gH(x + lx * c + lz * sn, z - lx * sn + lz * c); return [lx, (Number.isFinite(h) ? h : y) + 0.03 - y, lz, al]; };
    const B = gb.bl || (gb.bl = { P: [], A: [] }), ba = B.P.length / 3, ring = (f, al) => { const o = []; for (let q = 0; q < 8; q++) { const an = q / 8 * TAU; o.push(at(Math.cos(an) * r * f, Math.sin(an) * r * f * 1.5, al)); } return o; };
    const c0 = at(0, 0, SOFT[0]), R1 = ring(0.5, SOFT[1]), R2 = ring(1, 0), tri = (...v) => { for (const p of v) { B.P.push(p[0], p[1], p[2]); B.A.push(p[3]); } };
    for (let q = 0; q < 8; q++) { const n = (q + 1) % 8; tri(c0, R1[n], R1[q]); tri(R1[q], R1[n], R2[n]); tri(R1[q], R2[n], R2[q]); }
    const md = herdMode(kind, t), len = t.len * s, sz = t.size * s, sl = (dx, dz) => { const h0 = gH(x - dx, z - dz), h1 = gH(x + dx, z + dz); return Number.isFinite(h0) && Number.isFinite(h1) ? Math.max(-0.7, Math.min(0.7, (h1 - h0) / 2)) : 0; };
    const e = { a, b: gb.P.length / 3, ba, bb: B.P.length / 3, J: t.J, s, x, y, z, yaw, md, len, ph: hash01(x, z) * 60,
      gz: md === 1 ? t.graze : md === 5 ? 0.1 : md === 4 ? (t.top * s > 0.8 ? 0.3 : 0.7) : 0,   // (a beast's bow to the grass; a crocodile hardly lifts its head; a bird's peck, less for a tall one)
      S: md === 3 ? Math.min(2.2, Math.max(0.6, 1.4 * sz)) : md === 4 ? Math.min(0.6, Math.max(0.15, 0.35 * sz + 0.1)) : md === 5 ? 0.4 : md === 2 ? Math.min(1.0, Math.max(0.45, 0.9 * sz)) : Math.min(1.4, Math.max(0.3, 0.55 * sz)),
      stride: Math.max(0.3, len * (md === 3 ? 1.2 : 0.7)), n0: t.n0, gx: sl(1, 0), gzz: sl(0, 1), sz };
    (gb.zv || (gb.zv = [])).push(e); return e;
  }
  // a chunk's geometry: as GB's, with the herds' attributes (zero for the still things: as built) and its sphere in the world (the animals'
  // vertices are in their own frames)
  function herdGeo(gb) {
    const geo = gb.geometry(); if (!gb.zv) return geo;
    const n = gb.P.length / 3, J = new Float32Array(n * 4), AL = new Float32Array(n * 4), AM = new Float32Array(n * 4), AS = new Float32Array(n * 4), mark = new Uint8Array(n);
    const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9], grow = (x, y, z, r) => { lo[0] = Math.min(lo[0], x - r); lo[1] = Math.min(lo[1], y - r); lo[2] = Math.min(lo[2], z - r); hi[0] = Math.max(hi[0], x + r); hi[1] = Math.max(hi[1], y + r); hi[2] = Math.max(hi[2], z + r); };
    for (const e of gb.zv) {
      const nt = e.J.length / 4;
      for (let v = e.a, q = 0; v < e.b; v++, q++) {
        const o = v * 4; mark[v] = 1;
        if (q < nt) { J[o] = e.J[q * 4] * e.s; J[o + 1] = e.J[q * 4 + 1] * e.s; J[o + 2] = e.J[q * 4 + 2] * e.s; J[o + 3] = e.J[q * 4 + 3]; } else J[o + 3] = 9;
        AL[o] = e.x; AL[o + 1] = e.y; AL[o + 2] = e.z; AL[o + 3] = e.yaw;
        AM[o] = e.ph + 100 * e.md; AM[o + 1] = e.gz; AM[o + 2] = e.S; AM[o + 3] = e.stride;
        AS[o] = e.n0[1] * e.s; AS[o + 1] = e.n0[2] * e.s; AS[o + 2] = e.gx; AS[o + 3] = e.gzz;
      }
      grow(e.x, e.y + e.sz * 0.4, e.z, e.sz * 1.2 + e.S + 1.2);
    }
    const P = gb.P; for (let v = 0; v < n; v++) if (!mark[v]) grow(P[v * 3], P[v * 3 + 1], P[v * 3 + 2], 0);
    geo.setAttribute('aJ', new THREE.BufferAttribute(J, 4)); geo.setAttribute('aL', new THREE.BufferAttribute(AL, 4));
    geo.setAttribute('aM', new THREE.BufferAttribute(AM, 4)); geo.setAttribute('aS', new THREE.BufferAttribute(AS, 4));
    const ctr = new THREE.Vector3((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2);
    geo.boundingSphere = new THREE.Sphere(ctr, Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2);
    geo.boundingBox = new THREE.Box3(new THREE.Vector3(lo[0], lo[1], lo[2]), new THREE.Vector3(hi[0], hi[1], hi[2]));
    // the animals' soft shadows (gb.bl): their own see-through mesh, posed by the same shader (part 9), its colour with its see-through
    const B = gb.bl, m = B.P.length / 3, bc = new Float32Array(m * 4), bJ = new Float32Array(m * 4), bL = new Float32Array(m * 4), bM = new Float32Array(m * 4), bS = new Float32Array(m * 4);
    for (const e of gb.zv) for (let v = e.ba; v < e.bb; v++) { const o = v * 4;
      bc[o] = SOFTC[0]; bc[o + 1] = SOFTC[1]; bc[o + 2] = SOFTC[2]; bc[o + 3] = B.A[v]; bJ[o + 3] = 9;
      bL[o] = e.x; bL[o + 1] = e.y; bL[o + 2] = e.z; bL[o + 3] = e.yaw; bM[o] = e.ph + 100 * e.md; bM[o + 1] = e.gz; bM[o + 2] = e.S; bM[o + 3] = e.stride;
      bS[o] = e.n0[1] * e.s; bS[o + 1] = e.n0[2] * e.s; bS[o + 2] = e.gx; bS[o + 3] = e.gzz; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(B.P, 3)); const ca = new THREE.BufferAttribute(bc, 4); ca.noSeason = true; sg.setAttribute('color', ca);
    sg.setAttribute('aJ', new THREE.BufferAttribute(bJ, 4)); sg.setAttribute('aL', new THREE.BufferAttribute(bL, 4)); sg.setAttribute('aM', new THREE.BufferAttribute(bM, 4)); sg.setAttribute('aS', new THREE.BufferAttribute(bS, 4));
    sg.boundingSphere = geo.boundingSphere.clone(); geo.userData.soft = sg;
    return geo;
  }

  /* ---------------- the woods (the instanced trees of the world, from o.cull) ---------------- */
  const HCELL = 12;
  function woods(o) { const g = woodsGen(o, null); let r; do r = g.next(); while (!r.done); return r.value; }
  function* woodsGen(o, late) {   // (in slices when late is given: js/sfx-okolje.js, while the cars wait on the grid)
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
        if (late && (k & 1023) === 1023 && late()) yield;
      }
      if (late && late()) yield;
    }
    return { trees, n, cell: HCELL };
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

  /* ---------------- what stands on the ground (the occupancy grid, 4 m cells): the merged scenery's buildings, cars, stands, fences ..., so
     no herd grazes in a car park nor a scene stands in a paddock. A mesh whose vertices lie on the ground (the terrain, the road) is left
     out, and so is the road's edge (its barriers, posts and signs: within 2 m beyond the barrier) ---------------- */
  function occGrid(o, gH, T) {
    let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
    for (let i = 0; i < T.N; i++) { const x = T.px[i], z = T.pz[i]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
    x0 -= 160; z0 -= 160; x1 += 160; z1 += 160;
    const C = 4, nx = Math.ceil((x1 - x0) / C), nz = Math.ceil((z1 - z0) / C), top = new Float32Array(nx * nz).fill(-1e9), v = new THREE.Vector3();
    o.root.updateMatrixWorld(true);
    const m4 = new THREE.Matrix4(), w4 = new THREE.Matrix4();
    o.root.traverse(m => {   // (the spectators too: no herd among them)
      if (!m.isInstancedMesh || m.name !== 'crowd') return;
      for (let k = 0; k < m.count; k++) { m.getMatrixAt(k, m4); w4.multiplyMatrices(m.matrixWorld, m4); const el = w4.elements, cx = Math.floor((el[12] - x0) / C), cz = Math.floor((el[14] - z0) / C);
        if (cx < 0 || cz < 0 || cx >= nx || cz >= nz) continue; const id = cz * nx + cx; top[id] = Math.max(top[id], el[13] + 1.7); } });
    o.root.traverse(m => {
      if (!m.isMesh || m.isInstancedMesh || m.name === 'life' || !m.geometry || !m.geometry.attributes.position) return;
      const pa = m.geometry.attributes.position; if (pa.isInterleavedBufferAttribute || pa.itemSize !== 3 || pa.count < 3) return;
      const A = pa.array, e = m.matrixWorld.elements, n = pa.count;
      let on = 0, tried = 0;   // (the terrain or the road: a sample of its vertices all on the ground)
      for (let k = 0; k < 24; k++) { const q = Math.floor((k + 0.5) / 24 * n); v.set(A[q * 3], A[q * 3 + 1], A[q * 3 + 2]).applyMatrix4(m.matrixWorld); const h = gH(v.x, v.z); if (!Number.isFinite(h)) continue; tried++; if (Math.abs(v.y - h) < 0.25) on++; }
      const mt = m.material, wet = mt && mt.isMeshPhongMaterial && !!mt.map;   // (water: a stream draped on the ground, a lake, the sea: no place to stand, its cells taken)
      if (wet || (tried && on >= tried * 0.85)) {   // (on the ground: the terrain and the road are left out)
        if (!wet) return;
        const I = m.geometry.index ? m.geometry.index.array : null, nt = I ? I.length / 3 : Math.floor(n / 3), W2 = (q) => [(e[0] * A[q * 3] + e[4] * A[q * 3 + 1] + e[8] * A[q * 3 + 2] + e[12] - x0) / C, (e[2] * A[q * 3] + e[6] * A[q * 3 + 1] + e[10] * A[q * 3 + 2] + e[14] - z0) / C];
        for (let t = 0; t < nt; t++) {   // (each triangle's cells, their centres inside it, and its corners')
          const a = W2(I ? I[t * 3] : t * 3), b = W2(I ? I[t * 3 + 1] : t * 3 + 1), c = W2(I ? I[t * 3 + 2] : t * 3 + 2);
          const ar = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]); if (Math.abs(ar) < 1e-9) continue;
          for (const p of [a, b, c]) { const cx = Math.floor(p[0]), cz = Math.floor(p[1]); if (cx >= 0 && cz >= 0 && cx < nx && cz < nz) top[cz * nx + cx] = 1e6; }
          const i0 = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]))), i1 = Math.min(nx - 1, Math.ceil(Math.max(a[0], b[0], c[0]))), j0 = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]))), j1 = Math.min(nz - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
          if ((i1 - i0 + 1) * (j1 - j0 + 1) > 250000) continue;
          for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const px = i + 0.5, pz = j + 0.5;
            const u = ((b[0] - px) * (c[1] - pz) - (c[0] - px) * (b[1] - pz)) / ar, v = ((c[0] - px) * (a[1] - pz) - (a[0] - px) * (c[1] - pz)) / ar;
            if (u >= -0.02 && v >= -0.02 && u + v <= 1.04) top[j * nx + i] = 1e6; }
        }
        return;
      }
      for (let q = 0; q < n; q++) { const x = A[q * 3], y = A[q * 3 + 1], z = A[q * 3 + 2];
        const X = e[0] * x + e[4] * y + e[8] * z + e[12], Y = e[1] * x + e[5] * y + e[9] * z + e[13], Zw = e[2] * x + e[6] * y + e[10] * z + e[14];
        const cx = Math.floor((X - x0) / C), cz = Math.floor((Zw - z0) / C); if (cx < 0 || cz < 0 || cx >= nx || cz >= nz) continue;
        const id = cz * nx + cx; if (Y > top[id]) top[id] = Y; }
    });
    return { x0, z0, C, nx, nz, top };
  }
  function occupied(G, gH, cl, x, z, r) {   // the cells within r with something standing over the ground (0.5 m), not the road's edge
    let n = 0; const C = G.C;
    for (let a = Math.floor((x - r - G.x0) / C); a <= Math.floor((x + r - G.x0) / C); a++) for (let b = Math.floor((z - r - G.z0) / C); b <= Math.floor((z + r - G.z0) / C); b++) {
      if (a < 0 || b < 0 || a >= G.nx || b >= G.nz) continue; const t = G.top[b * G.nx + a]; if (t < -1e8) continue;
      const cx = G.x0 + (a + 0.5) * C, cz = G.z0 + (b + 0.5) * C; if ((cx - x) ** 2 + (cz - z) ** 2 > (r + C * 0.6) ** 2) continue;
      const h = gH(cx, cz); if (Number.isFinite(h) && t > h + 0.5 && cl(cx, cz) > 2) n++; }
    return n;
  }

  /* ---------------- the seventeen scenes (the user: »12 prizorov različnih živali na različnih progah«, later six more, less the bear at Uncompahgre): on each of these tracks one larger
     company of its own near the road, where the chase camera sees it (a flat open spot after a straight, nothing built there): kind and its
     herd's size n; with: a second company [kind, 'one' | 'pair' | 'herd', n]; thing: a thing of the place among them; pond: a pool;
     live: how many of the herd walk or graze ---------------- */
  const SCENE = {
    nring: { kind: 'stag', n: 8, thing: 'feedRack', live: 2 },   // (red deer at a feeder)
    vrsic: { kind: 'chamois', n: 8, with: ['ibex', 'pair'], live: 1 },   // (chamois, a pair of ibex)
    bathurst: { kind: 'kangaroo', n: 10, live: 2 },   // (a mob of kangaroos)
    ouninpohja: [{ kind: 'horse', n: 5, m: 1690, side: 1, b: 7.5, things: [{ t: 'paddock', a: 0, b: 0.8 }, { t: 'trough', a: 4.2, b: -2.6, ry: 0.3 }], tight: 0.5, room: 10 },   // (horses in their paddock by the farm's barn, its trough: the user, »tam kjer so v resnici«)
      { kind: 'moose', n: 3, with: ['moose', 'one'], pond: true, live: 1 }],   // (a cow moose and her calves at a pool, a bull)
    iroha: { kind: 'macaque', n: 9, thing: 'lantern' },   // (a troop of macaques by a stone lantern)
    caracoles: { kind: 'guanaco', n: 9, live: 2 },   // (guanacos on the slope)
    spa: { kind: 'cowB', n: 8, thing: 'trough', live: 2 },   // (cows at a trough)
    longford: { kind: 'sheep', n: 10, with: ['emu', 'pair'], live: 1 },   // (a flock of sheep, two emus)
    katu: { kind: 'yak', n: 8, with: ['horse', 'herd', 4], live: 1 },   // (yaks and horses on the steppe; not Marrakesh: a street circuit, its open ground paved)
    sani: { kind: 'eland', n: 8, with: ['baboon', 'herd', 5], live: 1 },   // (elands, a troop of baboons)
    beartooth: { kind: 'bison', n: 10, live: 2 },   // (a herd of bison)
    rio: { kind: 'capybara', n: 8, with: ['caiman', 'herd', 2], pond: true },   // (capybaras and caimans at the water)
    // six more (the user, 3. 11. 2026: »6 slik različnih živali z različnimi elementi«; the black bear with her cubs at Uncompahgre went when the
    // US tracks but Pikes Peak became test tracks, the user, 5. 11. 2026), each with things of its own: things [{ t: the thing, a, b
    // (from the spot: along the road, away from it), ry (its turn from facing the road), on: animals perched on it [kind, its x, y, z, scale,
    // turn] (in a nest, in a tree's fork, on a table: they stay there) }]; pond { a, b, r, mud }; at: the herd's middle; tight: its spacing;
    // withAt: the second company's place; room: the spot's radius kept clear of anything built (7 m)
    // medvode: the stork alone on its nest (the user, 4. 11. 2026: »samo ena in to na drogu«: fly, it takes off as the car comes); the pigs and hens
    // at the farm in Zbilje where it really is (OSM: the farm's buildings 30 m off the road, right; m, side, b: a scene's fixed place, metres
    // after the start, its side, metres beyond the barrier: not searched)
    medvode: [{ kind: 'pig', n: 7, m: 2940, side: 1, b: 7.5, things: [{ t: 'pigsty', a: 0, b: 0 }], pond: { a: 1.4, b: 0.3, r: 1.5, mud: true }, tight: 0.42, with: ['hen', 'herd', 6], withAt: [-7.0, 2.0], room: 8 },   // (pigs in their pen round a mud wallow, its shed; hens outside it)
      { kind: 'stork', n: 0, things: [{ t: 'storkNest', a: 2.6, b: 3.2, fly: ['stork', 0.18, 6.62, 0.05, 1, 0.5] }, { t: 'logPile', a: -4.6, b: 3.6, ry: 1.3 }], room: 8 }],   // (one stork on its nest on its pole; a pile of logs)
    cpalace: { kind: 'duck', n: 7, m: 1990, side: 1, b: 8, float: 10.66, with: ['swan', 'pair'], withAt: [1.6, 1.2], things: [{ t: 'duckHouse', a: -1.8, b: 1.6, ry: 0.5 }], tight: 0.45 },   // (ducks and two swans on the park's lake by the road, their duck house: the user, »race postavi v že narejeno vodo«; float: the water's level, they float on it; js/world-cpalace.js cpPrep lowers it under the road, the water from ~4.5 m past the barrier)
    greatalpine: { kind: 'koala', n: 1, at: [-1.2, -0.6], things: [{ t: 'eucalyptus', a: 0.5, b: 1.6, on: [['koala', 0, 2.56, 0.07, 1.4, 0]] }, { t: 'eucalyptus', a: 4.6, b: 3.6, ry: 2.2, on: [['koala', 0, 2.56, 0.07, 1.3, 2.4]] }, { t: 'waterTank', a: -7.0, b: 5.0 }], with: ['emu', 'pair'], withAt: [-4.5, 1.5] },   // (koalas: two in the gum trees' forks, one come down to the ground; two emus)
  };
  function pond(g, gH, x, z, r, R, mud) {   // a pool on the ground (it follows it: the scene's spot is near flat), a muddy rim round it; mud: a wallow
    const n = 14, rim = mud ? [0.42, 0.35, 0.25] : [0.36, 0.3, 0.22], wat = mud ? [0.3, 0.23, 0.15] : [0.16, 0.27, 0.3], pts = [];
    for (let k = 0; k < n; k++) { const a = k / n * TAU, rr = r * (0.82 + 0.3 * R()); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    const at = (px, pz, d) => { const h = gH(x + px, z + pz); return [x + px, (Number.isFinite(h) ? h : 0) + d, z + pz]; };
    for (let k = 0; k < n; k++) { const p = pts[k], q = pts[(k + 1) % n], P0 = at(p[0], p[1], 0.05), Q0 = at(q[0], q[1], 0.05);
      g.triUp(at(0, 0, 0.05), Q0, P0, [wat, wat, wat]);
      const P1 = at(p[0] * 1.22, p[1] * 1.22, 0.03), Q1 = at(q[0] * 1.22, q[1] * 1.22, 0.03);
      g.triUp(P0, Q0, Q1, [rim, rim, rim]); g.triUp(P0, Q1, P1, [rim, rim, rim]); }
  }

  /* ---------------- the build: World.life(o) at the end of every world's build ---------------- */
  const LIVE_R = 150;   // (a live one farther than this from the camera is hidden: one draw call less)
  World.life = function (o) {
    const A = World.api, T = A.T, def = T && T.def; if (!def || def.test || !o || !o.root) return null;
    const Z = ZIV[def.id]; if (!Z || (Z.nizka === false && World.api.LOD.tier === 0)) return null;
    const LOD = A.LOD, R = A.rng(1777 + [...def.id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7) % 100000), gH = o.groundH;
    if (typeof gH !== 'function') return null;
    const W = World.woods(o), G = occGrid(o, gH, T), chunks = new A.Chunks(256), placed = [], live = [], liveOK = LOD.draw('animals'); let softLive = null;
    const stats = { trees: W.n, things: 0, groups: 0, animals: 0, live: 0, fly: 0, kinds: {}, sizes: { one: 0, pair: 0, herd: 0 }, at: [], scene: null, scenes: [] }, fly = [];   // (fly: the bird that flies off, apart from the live ones: no soft shadow of its own)
    const grp = new THREE.Group(); grp.name = 'life'; o.root.add(grp);
    const slope = (x, z, r) => { const h0 = gH(x, z), d = Math.max(Math.abs(gH(x + r, z) - h0), Math.abs(gH(x - r, z) - h0), Math.abs(gH(x, z + r) - h0), Math.abs(gH(x, z - r) - h0)); return Number.isFinite(d) ? d / r : 9; };
    const free = (x, z, r) => { for (const p of placed) if ((p[0] - x) ** 2 + (p[1] - z) ** 2 < (p[2] + r + 6) ** 2) return false; return true; };
    const cl = (x, z) => A.clearance(x, z);
    const L0 = T.open ? Math.max(0, T.startS - 40) : 0, L1 = T.open ? Math.min(T.len, T.finishS + 60) : T.len;
    const peek = (i, side, b, rr) => {   // the window in the trees towards the road: it slants back along the road (the chase camera looks at the glade from behind and above)
      for (const f of [0.25, 0.5, 0.75, 1]) { const sb = i * T.ds - 24 * f, j = T.idx(((sb % T.len) + T.len) % T.len), bj = side > 0 ? T.br[j] : T.bl[j], ob = side * (bj + Math.max(1.5, b * (1 - f)));
        cut(W, T.px[j] + T.nx[j] * ob, T.pz[j] + T.nz[j] * ob, rr * 0.9 + 2.4); } };
    const count = (kk) => { stats.animals++; stats.kinds[kk] = (stats.kinds[kk] || 0) + 1; };
    // one alone walking to and fro (its path: L metres from (x, z) along yaw, clear of the road; else grazing on the spot), its own mesh
    function goLive(kk, sc, x, z, yaw, mode) {
      const t = tplLive(kk); if (!t || !liveOK) return false;
      const k = sc * 1.15, len = t.len * k; let a = null;
      if (mode !== 'graze' && (mode === 'walk' || R() < 0.55)) {
        const L = (t.hop ? 6 : 3.5) + R() * 4.5, ex = x + Math.sin(yaw) * L, ez = z + Math.cos(yaw) * L, eh = gH(ex, ez);
        if (cl(ex, ez) > 3 && Number.isFinite(eh) && Math.abs(eh - gH(x, z)) < L * 0.3 && occupied(G, gH, cl, ex, ez, 2) === 0) {
          for (let f = 0.25; f <= 1.01; f += 0.25) cut(W, x + Math.sin(yaw) * L * f, z + Math.cos(yaw) * L * f, 2.8);
          a = { mode: 'walk', x0: x, z0: z, yaw0: yaw, L, v: t.hop ? 1.7 : 0.55 + R() * 0.45, pause: 4 + R() * 5, ph: R() * 60, stride: Math.max(0.45, len * (t.hop ? 1.2 : 0.7)) };
        }
      }
      if (!a) a = { mode: 'graze', x0: x, z0: z, rad: 0.35 + R() * 0.4, ang0: R() * TAU, per: 9 + R() * 7, ph: R() * 60, stride: Math.max(0.45, len * 0.7) };
      a.gz = t.graze; a.rig = t.rig; a.hop = t.hop;
      const m = new THREE.Mesh(t.geo, liveMat(t)); m.scale.setScalar(k); m.castShadow = false; m.receiveShadow = true; m.name = 'life';   // (no hard shadow: its soft one)
      const sm = A.ownRnd(() => { if (!softLive) { softLive = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 }); softLive.userData.soft = true; }
        return new THREE.Mesh(t.soft, softLive); });
      sm.name = 'lifeShadow'; sm.renderOrder = 1; m.add(sm);
      a.m = m; a.U = m.material.userData.U; a.cx = x + (a.mode === 'walk' ? Math.sin(yaw) * a.L / 2 : 0); a.cz = z + (a.mode === 'walk' ? Math.cos(yaw) * a.L / 2 : 0); a.y0 = gH(x, z);
      grp.add(m); live.push(a); stats.live++; count(kk); return true;
    }
    // a company round (x, z): the lead in the middle, the others on a sunflower spiral, each turned its own way about yaw; liveN of them
    // (not the lead) walk or graze; returns the herd's radius
    function herdAt(g, crew, x, z, yaw, liveN, tight, hf) {   // (hf: the ground's height, or the water's level)
      const sp = HERD_SP((tpl(crew[0][0]) || { size: 1 }).size) * (tight || 1), at = []; let lv = 0;
      crew.forEach(([kk, sc], k) => {
        const d = k ? sp * Math.sqrt(k) * (0.8 + R() * 0.4) : 0, an = k * 2.39996 + yaw * 0.37 + (R() - 0.5) * 0.6, ax = x + Math.cos(an) * d, az = z + Math.sin(an) * d, ah = (hf || gH)(ax, az);
        if (!Number.isFinite(ah)) return;
        const ay = yaw + (R() - 0.5) * 1.8;
        if (k && lv < (liveN || 0) && goLive(kk, sc, ax, az, ay)) { lv++; at.push([ax, az, null]); return; }
        at.push([ax, az, stand(g, kk, sc, ax, ah, az, ay, k ? R() < 0.45 : R() < 0.15, hf)]);
      });
      for (const [ax, az, e] of at) if (e) {   // (each one's way no longer than the room to its nearest neighbour: they do not walk into each other)
        let dn = 1e9; for (const [bx, bz] of at) if (bx !== ax || bz !== az) dn = Math.min(dn, Math.hypot(bx - ax, bz - az));
        e.S = Math.max(0, Math.min(e.S, 0.8 * (dn - 0.55 * e.sz)));
      }
      return sp * Math.sqrt(crew.length);
    }
    function stand(g, kk, sc, x, h, z, yaw, graze, hf) {   // one of a herd or alone: baked into its chunk upright, the chunk's shader moves it (graze: as it was, the random draw kept)
      const r = tplRig(kk), t = r && r.herd; if (!t) return null; const k = sc * 1.15;
      const e = herdPut(g, hf || gH, kk, t, x, h - 0.02, z, yaw, k, 0.9 + R() * 0.16); count(kk); return e;
    }
    const tally = (crew) => { stats.sizes[crew.length === 1 ? 'one' : crew.length === 2 ? 'pair' : 'herd']++; };

    // 1) the track's scenes (sixteen tracks, two on two of them), first: the glades keep away from them. A scene with its place (m, side, b: where
    // it really is) there; the others where the search finds a flat open spot, 200 m or more from the scene before
    const done = [];
    for (const Sc of [].concat(SCENE[def.id] || [])) {
      let c = null;
      if (Sc.m != null) { const s = (T.startS || 0) + Sc.m, i = T.idx(((s % T.len) + T.len) % T.len), bar = Sc.side > 0 ? T.br[i] : T.bl[i], off = Sc.side * (bar + Sc.b);
        c = [0, i, Sc.side, T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, Sc.b]; }
      else {
      const cand = [], r = 7, PS = (World.peopleSites && World.peopleSites[def.id]) || [];   // (the people's scenes, js/world-ljudje.js: their places are fixed, this one keeps 45 m away from them on their side)
      const nearPpl = (s, side) => PS.some(e => e[2] === side && Math.abs((((s - (T.startS || 0) - e[1]) % T.len) + T.len * 1.5) % T.len - T.len / 2) < 45);
      const nearSc = (s) => done.some(m => { let d = Math.abs(s - (T.startS || 0) - m); if (!T.open) d = Math.min(d, T.len - d); return d < 200; });
      for (let s = L0 + 250; s < L1 - 250; s += 12) for (const side of [-1, 1]) for (const b of [9, 12, 15]) {   // (the nearest first: farther only where nearer is taken)
        const i = T.idx(((s % T.len) + T.len) % T.len), bar = side > 0 ? T.br[i] : T.bl[i], off = side * (bar + b), x = T.px[i] + T.nx[i] * off, z = T.pz[i] + T.nz[i] * off;
        if (cl(x, z) < b - 1.5) continue;
        const h = gH(x, z); if (!Number.isFinite(h)) continue; const sl = slope(x, z, r * 0.7); if (sl > (Sc.pond ? 0.1 : 0.3)) continue;
        const ry = T.hy ? T.hy[i] : h; if (Math.abs(h - ry) > 3.5) continue;
        const j = T.idx((((s - 60) % T.len) + T.len) % T.len); let dh = Math.abs(T.hd[i] - T.hd[j]) % TAU; dh = Math.min(dh, TAU - dh);
        const sc0 = -sl * 8 - Math.abs(h - ry) * 0.3 - dh * 2 - (b - 9) * 0.15 + R() * 0.4; if (!nearPpl(s, side) && !nearSc(s)) cand.push([sc0, i, side, x, z, b]);   // (the random draw for every spot as before: the rest of the life as built without the people)
      }
      cand.sort((p, q) => q[0] - p[0]);
      c = cand.slice(0, 400).find(c => occupied(G, gH, cl, c[3], c[4], Sc.room || r) === 0);   // (room: a scene with things farther out, nothing built within it)
      }
      if (c) {
        const [, i, side, x, z, b] = c, toRoad = Math.atan2(-side * T.nx[i], -side * T.nz[i]), along = Math.atan2(T.tx[i], T.tz[i]), g = chunks.get(x, z);
        const nx = T.nx[i] * side, nz = T.nz[i] * side, tx = T.tx[i], tz = T.tz[i], P = (a, bb) => [x + tx * a + nx * bb, z + tz * a + nz * bb];   // (a along the road, bb away from it)
        const hf = Sc.float != null ? () => Sc.float : gH;   // (on the water: its level)
        cut(W, x, z, 13); peek(i, side, b, 9);
        if (Sc.pond) { const po = Sc.pond === true ? { a: -2.5, b: 1.5, r: 2.6 } : Sc.pond, [px, pz] = P(po.a, po.b), pg = new A.GB(); pond(pg, gH, px, pz, po.r, R, po.mud);   // (its own mesh, drawn over the ground: NIZKA's ground covered it in places)
          A.ownRnd(() => { const pm = new THREE.Mesh(pg.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 }));
            pm.receiveShadow = true; pm.matrixAutoUpdate = false; pm.updateMatrix(); pm.name = 'life'; grp.add(pm); }); }
        if (Sc.thing) { const t = tpl(Sc.thing), [px, pz] = P(2.5, 3.5), ph = gH(px, pz); if (t && Number.isFinite(ph)) { put(g, t, px, ph - 0.05, pz, toRoad + (R() - 0.5) * 0.4, 1); stats.things++; } }
        let up = 0;   // (how high the perched ones sit above the thing's foot: the tests)
        for (const th of Sc.things || []) { const t = tpl(th.t), [px, pz] = P(th.a, th.b), ph = hf(px, pz), yw = toRoad + (th.ry || 0); if (!t || !Number.isFinite(ph)) continue;
          put(g, t, px, ph - 0.05, pz, yw, 1); stats.things++;
          const c2 = Math.cos(yw), s2 = Math.sin(yw);
          for (const [kk, lx, ly, lz, sc, ry] of th.on || []) { const e = stand(g, kk, sc, px + lx * c2 + lz * s2, ph - 0.05 + ly, pz - lx * s2 + lz * c2, yw + ry, false); if (e) { e.S = 0; up = Math.max(up, ly); } }   // (perched: it stays where it sits)
          if (th.fly) { const [kk, lx, ly, lz, sc, ry] = th.fly, tl = liveOK && tplLive(kk), k = sc * 1.15, fx = px + lx * c2 + lz * s2, fz = pz - lx * s2 + lz * c2;
            if (tl) {   // (the one that flies off: on its nest its own mesh as it stands, in the air the flyer)
              const fy = ph - 0.05 + ly - 0.02, G = storkFlyGeo(), mat = new THREE.MeshLambertMaterial({ vertexColors: true });
              const sit = new THREE.Mesh(tl.geo, mat); sit.scale.setScalar(k); sit.position.set(fx, fy, fz); sit.rotation.y = yw + ry; sit.name = 'life';
              const fl = new THREE.Mesh(G.geo, mat); fl.scale.setScalar(k); fl.visible = false; fl.name = 'life'; fl.frustumCulled = false;
              grp.add(sit); grp.add(fl); fly.push({ sit, fly: fl, G, x: fx, y: fy, z: fz, ax: nx, az: nz, st: 0, t0: 0, th: 0, k: 0.004 }); stats.fly++; count(kk); up = Math.max(up, ly);
            } else { const e = stand(g, kk, sc, fx, ph - 0.05 + ly, fz, yw + ry, false); if (e) { e.S = 0; up = Math.max(up, ly); } }   // (no live animals, NIZKA: it sits on its nest as the perched ones)
          }
        }
        if (Sc.n) { const crew = company(Sc.kind, R, 'herd', Sc.n), [hx, hz] = Sc.at ? P(Sc.at[0], Sc.at[1]) : [x, z]; tally(crew);
          herdAt(g, crew, hx, hz, along + (R() < 0.5 ? 0 : Math.PI) + (R() - 0.5) * 0.6, Sc.live || 0, Sc.tight || 0.6, hf); stats.groups++; }   // (the scene's herd keeps together)
        if (Sc.with) { const w = company(Sc.with[0], R, Sc.with[1], Sc.with[2]), [wx, wz] = P(...(Sc.withAt || [-7.5, 3])); tally(w); herdAt(g, w, wx, wz, toRoad + (R() - 0.5) * 1.2, 0, Sc.withAt ? Sc.tight || 0.6 : 0.6, hf); stats.groups++; }
        placed.push([x, z, 13]); const sc = { kind: Sc.kind, m: Math.round(i * T.ds - (T.startS || 0)), side, x, z, y: +hf(x, z).toFixed(2), g: +gH(x, z).toFixed(2), up }; if (!stats.scene) stats.scene = sc; stats.scenes.push(sc); done.push(sc.m);   // (y: its herd's foot, g: the ground there, up: its perched ones)
        stats.at.push([Math.round(i * T.ds - (T.startS || 0)), side, b, Sc.kind]);
      }
    }

    // 2) the glades along the road: a thing of the place, or animals as their kind keeps company (alone ones walk or graze)
    const step = (Z.city ? 100 : 36) / LOD.dens;   // (a try every ~36 m of road: a spot every ~50-80 m, most of them one animal or two; the lower tiers fewer)
    let nStep = 0;
    for (let s = L0 + R() * step; s < L1; s += step * (0.7 + R() * 0.6), nStep++) for (let tr = 0; tr < 4; tr++) {   // (up to four tries at each step: either side, near or farther)
      const deep = false;   // (the user: »samo na vidnih mestih«: none deep in the woods any more, all near the road where the chase camera sees them)
      const i = T.idx(((s + (tr ? (R() - 0.5) * step * 0.6 : 0)) % T.len + T.len) % T.len), side = R() < 0.5 ? -1 : 1, bar = side > 0 ? T.br[i] : T.bl[i];
      const b = deep ? 30 + R() * 40 : 3.5 + Math.pow(R(), 1.3) * 16, off = side * (bar + b), x = T.px[i] + T.nx[i] * off, z = T.pz[i] + T.nz[i] * off;   // (near the road: the chase camera looks steeply down, a glade deep in the woods hides under the crowns)
      const wantThing = Z.t.length && R() < 0.34, kind = wantThing ? Z.t[Math.floor(R() * Z.t.length)] : Z.a[Math.floor(R() * Z.a.length)];
      const crew = wantThing ? null : company(kind, R), hr = crew ? HERD_SP((tpl(crew[0][0]) || { size: 1 }).size) * Math.sqrt(crew.length) : 0;
      const alone = crew && crew.length === 1, rr = wantThing ? ROOM[kind] || 3 : Math.max(alone ? 5.2 : 4.4, hr + 2.4);
      if (cl(x, z) < rr + 2.5) continue;   // (not on another part of the road, its verges or barriers)
      const h = gH(x, z); if (!Number.isFinite(h) || slope(x, z, rr * 0.7) > (wantThing ? 0.32 : 0.55) || !free(x, z, rr)) continue;
      if (occupied(G, gH, cl, x, z, rr) > 1) continue;   // (nothing built there)
      const N = near(W, x, z, 9);
      const forest = N.cnt >= 2 && N.dmin < 5.5, open = N.cnt === 0 && near(W, x, z, 22).cnt === 0;
      if (!forest && !(open && Z.open && !wantThing && cl(x, z) > 14)) continue;   // (in the woods; out in the open only where the track's country has open land)
      const yaw = Math.atan2(-side * T.nx[i], -side * T.nz[i]) + (R() - 0.5) * 0.9;   // (facing the road, more or less)
      if (forest) {   // the glade, and a window in the trees towards the road (the camera above the road sees into it)
        cut(W, x, z, rr + 3.8);   // (wide enough that the crowns round it, 3-5 m across on tall trees, leave it open to the sky)
        if (!deep) peek(i, side, b, rr);
      }
      const g = chunks.get(x, z);
      if (wantThing) { put(g, tpl(kind), x, h - 0.05, z, yaw, 1); stats.things++; }
      else {
        tally(crew);
        const walkYaw = Math.atan2(T.tx[i], T.tz[i]) + (R() < 0.5 ? 0 : Math.PI) + (R() - 0.5) * 1.0;   // (one alone walks more or less along the road: the chase camera sees it go)
        if (!(alone && R() < 0.6 && goLive(crew[0][0], crew[0][1], x, z, walkYaw))) herdAt(g, crew, x, z, yaw, 0);   // (three in five of those alone walk or graze; the others stand)
        stats.groups++;
      }
      placed.push([x, z, rr]); stats.at.push([Math.round(i * T.ds - (T.startS || 0)), side, Math.round(b), kind]);   // (where: metres after the start, side, metres beyond the barrier, what)
      break;
    }
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true }), U = { value: 0 }, HM = A.ownRnd(() => herdMats(U)); let herds = 0;   // (ownRnd: the herds' materials do not take the race's random draws)
    for (const [key, g] of chunks.map) { if (g.empty) continue; const m = new THREE.Mesh(herdGeo(g), g.zv ? HM.m : mat); if (g.zv) { m.customDepthMaterial = HM.d; herds++; }
      m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'life'; grp.add(m);
      const bs = m.geometry.boundingSphere; if (o.cull) o.cull.push({ m, x: bs.center.x, z: bs.center.z, r: bs.radius });
      const sg = m.geometry.userData.soft; if (sg) {   // (the animals' soft shadows: drawn after the ground, over it)
        const sm = A.ownRnd(() => new THREE.Mesh(sg, HM.b)); sm.matrixAutoUpdate = false; sm.updateMatrix(); sm.name = 'life'; sm.renderOrder = 1; grp.add(sm);
        if (o.cull) o.cull.push({ m: sm, x: bs.center.x, z: bs.center.z, r: bs.radius }); } }
    if (live.length || herds || fly.length) { o.dyn.life = { live, fly, gH, far2: LOD.radius(LIVE_R) ** 2, tmp: {}, U }; World.lifeStep(o.dyn.life, 0, null, null); }
    o.lifeStats = stats; return stats;
  };
  World.lifeTable = ZIV;   // (for the tests and the docs)
  World.woods = (o) => o.woods || (o.woods = woods(o));   // (the woods once per world: World.life's glades cut from it, and the forest of the ambient sounds, js/sfx-okolje.js)
  World.woodsGen = function* (o, late) { if (!o.woods) { const W = yield* woodsGen(o, late); if (!o.woods) o.woods = W; } return o.woods; };   // (the same, in slices)
  World.lifeSoc = SOC; World.lifeScenes = SCENE;
})();
