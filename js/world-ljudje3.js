/* =========================================================================
   PEOPLE ALONG THE TRACKS, ROUND THREE — six more groups on World.people's kit (js/world-ljudje.js, World.peopleKit), each busy with its own
   work or game, some of them further back from the road: anglers on a lake's shore (or at a pond of their own), a family bringing in the
   hay, beekeepers at their bee house, old men at bocce under a vine, a game of garden chess, a child's birthday with a bouncy castle. Each
   only where it really is (the user, 3. 11. 2026, OSM): the bocce and the chess have no place yet (no court, no board by a track). The user, 3. 11. 2026: »naredi mi še
   dodatne ljudi … 6 slik novih skupin ljudi, ki delajo različne stvari (lahko tudi, da niso vedno ob cesti) in da imajo različne elemente«.
   A scene type as in js/world-ljudje2.js: S.<name> = { seed, clear: [[a, b, r]], build(C, F, K) } (the frame F: a along the track, + ahead;
   b from the barrier away from the road); its places: site(trackId, [[name, metres after the start line, side]]). Hand-held things are made
   as they look in their pose (inHand: x the person's left, y up, z forwards, for the forearm's angle from hanging), worn hats are HATX.
   ========================================================================= */
(function () {
  'use strict';
  const K = World.peopleKit; if (!K) return;
  const { S, L, ITEMX, POSEX, MOTION, RATE, SITES, HATX, SUMMER, BUSY_HANDS, rnd, pick, box, cyl, sph, grp, bar, pal } = K;
  const site = (id, list) => { (SITES[id] || (SITES[id] = [])).push(...list); };
  const TAU = Math.PI * 2, PI2 = Math.PI / 2;
  const MAT = new Map(), lamOf = (c) => { let m = MAT.get(c); if (!m) MAT.set(c, m = new THREE.MeshLambertMaterial({ color: c })); return m; };
  const shade = (c, f) => (Math.round(((c >> 16) & 255) * f) << 16) | (Math.round(((c >> 8) & 255) * f) << 8) | Math.round((c & 255) * f);
  // a thing in a hand, made as it looks in the pose: the forearm th radians forwards from hanging (the hand's frame: the forearm -y, forwards +z)
  const inHand = (th, ...ch) => { const g = grp(...ch); g.rotation.x = th; return grp(g); };
  // a flat triangle seen from both sides (a flag of the bunting, the umbrella's canopy)
  const tri2 = (A, B, C3, col) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...A, ...B, ...C3, ...A, ...C3, ...B], 3)); return new THREE.Mesh(g, lamOf(col)); };
  // the dir that turns a model's +x (its front) to (fa, fb) in the frame; on a thing put that way, its local z is the frame's b times side
  const fwOf = (F) => (fa, fb) => { const l = Math.hypot(fa, fb) || 1; return [-F.side * fb / l, F.side * fa / l]; };
  // things made in the world's own coordinates (W(a, b, h): the point h over the ground at a, b), baked where they are: a pond's water, a
  // court's sand, a chessboard, a line of bunting (a prop at a0, b0 whose place a child's matrix undoes)
  const _M = new THREE.Matrix4(), _P = new THREE.Vector3(), _Q = new THREE.Quaternion(), _E = new THREE.Euler(), _S1 = new THREE.Vector3(1, 1, 1);
  function inWorld(C, F, a0, b0, fill) {
    const [x0, z0] = F.w(a0, b0), inner = grp(), g = grp(inner);
    _M.compose(_P.set(x0, F.y(a0, b0), z0), _Q.setFromEuler(_E.set(0, C.yawOf(null), 0)), _S1); inner.matrixAutoUpdate = false; inner.matrix.copy(_M).invert();
    fill(inner, (a, b, h) => { const [x, z] = F.w(a, b); return [x, F.y(a, b) + (h || 0), z]; });
    C.prop(g, a0, b0, null);
  }
  // flat shapes on the ground (each part: a colour and its triangles [[a, b, dy] x3]), turned to face up
  function ground(C, F, a0, b0, parts) {
    inWorld(C, F, a0, b0, (g, W) => { for (const { col, tris } of parts) { const P = [];
      for (const t of tris) { const w = t.map(([a, b, dy]) => W(a, b, dy)), ux = w[1][0] - w[0][0], uz = w[1][2] - w[0][2], vx = w[2][0] - w[0][0], vz = w[2][2] - w[0][2];
        if (uz * vx - ux * vz < 0) { const q = w[1]; w[1] = w[2]; w[2] = q; } P.push(...w[0], ...w[1], ...w[2]); }
      if (!P.length) continue; const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.add(new THREE.Mesh(geo, lamOf(col))); } });
  }
  // a rectangle on the ground in cells of about `cell` metres (it follows the ground), as triangles
  function rectTris(a0, a1, b0, b1, dy, cell) {
    const na = Math.max(1, Math.round((a1 - a0) / cell)), nb = Math.max(1, Math.round((b1 - b0) / cell)), out = [];
    for (let i = 0; i < na; i++) for (let j = 0; j < nb; j++) { const A0 = a0 + (a1 - a0) * i / na, A1 = a0 + (a1 - a0) * (i + 1) / na, B0 = b0 + (b1 - b0) * j / nb, B1 = b0 + (b1 - b0) * (j + 1) / nb;
      out.push([[A0, B0, dy], [A1, B0, dy], [A1, B1, dy]], [[A0, B0, dy], [A1, B1, dy], [A0, B1, dy]]); }
    return out;
  }
  // a waved oval: n points round (ca, cb), half axes ra, rb (f: its radius at the angle)
  const oval = (ca, cb, ra, rb, n, f) => { const P = []; for (let k = 0; k < n; k++) { const t = k / n * TAU, r = f ? f(t) : 1; P.push([ca + ra * r * Math.cos(t), cb + rb * r * Math.sin(t), t]); } return P; };
  const smokeAt = (n, h, col, op, spread) => { const o = new THREE.Object3D(); o.userData.smoke = { n, h, col, op, spread }; return o; };

  // worn hats (the head's frame: its top at 0.235, the face +z): a fishing hat, a straw hat, a headscarf, a beekeeper's veiled hat, a flat cap,
  // a party hat
  HATX.bucket = (c) => grp(cyl(0.118, 0.125, 0.1, 8, c, 0, 0.275, -0.005), cyl(0.15, 0.185, 0.035, 8, shade(c, 0.9), 0, 0.225, -0.005));
  HATX.straw = (c) => grp(cyl(0.26, 0.26, 0.016, 10, c, 0, 0.235, 0), cyl(0.112, 0.124, 0.12, 8, c, 0, 0.3, -0.005), cyl(0.126, 0.126, 0.032, 8, 0x5a3a22, 0, 0.258, -0.005));
  HATX.scarf = (c) => grp(box(0.225, 0.075, 0.24, c, 0, 0.215, -0.005), box(0.215, 0.2, 0.05, c, 0, 0.12, -0.105), box(0.016, 0.17, 0.2, c, 0.108, 0.13, -0.01), box(0.016, 0.17, 0.2, c, -0.108, 0.13, -0.01),
    box(0.07, 0.07, 0.05, shade(c, 0.85), 0, 0.03, -0.13));
  HATX.veil = (c) => grp(cyl(0.17, 0.2, 0.3, 9, 0x3e4542, 0, 0.13, 0), cyl(0.23, 0.23, 0.014, 10, c, 0, 0.285, 0), cyl(0.11, 0.12, 0.1, 8, c, 0, 0.34, 0));
  HATX.flat = (c) => grp(box(0.215, 0.05, 0.235, c, 0, 0.255, -0.01), box(0.19, 0.016, 0.07, c, 0, 0.236, 0.135, { rx: 0.12 }));
  HATX.party = (c) => grp(cyl(0.004, 0.075, 0.2, 6, c, 0, 0.33, 0), sph(0.026, 5, 3, 0xf2f2f2, 0, 0.44, 0));

  // seated, waving with the left hand (the right stays in the lap, what it holds in it)
  POSEX.l3_sitWave = (t, s) => ({ hy: 0.5, hp: [1.5, 1.5], kn: [1.5, 1.5], lean: -0.04, shz: [2.35 + 0.25 * s, 0.12], shx: [0.2, 0.35], el: [0.55, 0.9] });
  RATE.l3_sitWave = 7.5;

  /* 1 · Ribiči ob ribniku (K.lake: on the real lake's shore, Ouninpohja and Medvode, no pond; there all stay on the shore, see build): a pond back from the road (reeds and cattails round its far side, water lilies, a muddy
     shore), a small wooden jetty; an angler in a folding chair at its end, his rod out over the water, its line and float; another stands on
     the shore working his lure; a kid crouches at the water with a landing net, a bucket by him; under a green fishing umbrella an old angler
     sits with his coffee, his two rods on their rest before him, his dog by his chair; their car on the grass. As the car comes the kid runs
     to the fence with his net and jumps, the one on the shore walks after him, his rod upright; the two sitting stay with their rods and wave
     from their chairs */
  {
    const WATER = 0x31606a, WATER2 = 0x47788a, MUD = 0x6e5c40, REED = [0x6f8a3c, 0x87a04a, 0x5f7a34, 0x9aa850], CATTAIL = 0x5a3a20;
    const PA = 1.2, PB = 11.3, RA = 4.7, RB = 2.9;   // (the pond: its middle and half axes)
    // the rod (the forearm forwards, th 1.6): forwards and 35° up, 3.3 m, its reel under the hand; o.line: the line down from the tip and
    // the float on it. Upright in a hanging hand, carried (ribic_rodC)
    ITEMX.ribic_rod = (o) => { const Lr = 3.3, ca = Math.cos(0.61), sa = Math.sin(0.61), tip = [0, sa * Lr, ca * Lr];
      const g = [bar([0, -0.3 * sa, -0.3 * ca], [0, sa * 1.3, ca * 1.3], 0.03, 0x2a2c31), bar([0, sa * 1.3, ca * 1.3], tip, 0.016, 0x4a4d52), cyl(0.036, 0.036, 0.04, 6, 0x9ea3aa, 0, -0.07, 0.07, { rz: PI2 })];
      if (o.line) g.push(bar(tip, [0, tip[1] - o.line, tip[2]], 0.01, 0xe6e6dc), sph(0.035, 6, 4, 0xd8262a, 0, tip[1] - o.line + 0.02, tip[2]));
      return inHand(1.6, ...g); };
    ITEMX.ribic_rodC = () => inHand(0.15, bar([0, -0.45, 0.02], [0, 1.05, 0.06], 0.03, 0x2a2c31), bar([0, 1.05, 0.06], [0, 2.75, 0.13], 0.016, 0x4a4d52), cyl(0.036, 0.036, 0.04, 6, 0x9ea3aa, 0, 0.06, 0.07, { rz: PI2 }));
    // the landing net: its pole forwards and down (the arms out before the crouching kid, th 1.55), the hoop and the bag at its end
    ITEMX.ribic_net = () => { const T = [0, -0.62, 1.05], g = [bar([0, 0.12, -0.22], T, 0.026, 0xc9a24a)];
      for (let k = 0; k < 8; k++) { const t0 = k / 8 * TAU, t1 = (k + 1) / 8 * TAU, r = 0.22; g.push(bar([r * Math.cos(t0), T[1], T[2] + 0.22 + r * Math.sin(t0)], [r * Math.cos(t1), T[1], T[2] + 0.22 + r * Math.sin(t1)], 0.02, 0x2a2c31)); }
      g.push(sph(0.2, 6, 3, 0x3e4a40, 0, T[1], T[2] + 0.22, { half: true, rx: Math.PI }));
      return inHand(1.55, ...g); };
    // seated with the rod (the right hand at its reel, the left further up it), its tip bobbing; standing, working the lure; the crouching kid
    POSEX.ribic_sit = (t, s) => ({ hy: 0.5, hp: [1.5, 1.5], kn: [1.45, 1.5], lean: 0.06, nod: 0.06, shz: [0.06, 0.14], shx: [0.95, 0.62 + 0.03 * s], el: [0.72, 0.98], shy: [-0.55, -0.15] });
    POSEX.ribic_sitWave = (t, s) => ({ hy: 0.5, hp: [1.5, 1.5], kn: [1.45, 1.5], lean: 0.0, shz: [2.35 + 0.25 * s, 0.14], shx: [0.2, 0.62], el: [0.55, 0.98], shy: [0, -0.15] });
    POSEX.ribic_cast = (t, s) => ({ shz: [0.08, 0.16], shx: [1.02 + 0.08 * s, 0.72 + 0.1 * s], el: [0.62, 0.88], shy: [-0.6, -0.15], lean: 0.08, hpz: [0.08, 0.08], tw: -0.08 });
    POSEX.ribic_net = (t, s) => ({ hy: 0.5, hp: [1.75, 1.75], kn: [2.1, 2.1], lean: 0.42, hz: -0.15, nod: 0.25, shz: [0.12, 0.1], shx: [1.4 + 0.08 * s, 1.5 + 0.08 * s], el: [0.12, 0.08], shy: [-0.3, -0.1] });
    Object.assign(MOTION, { ribic_sit: { rate: 0.7 }, ribic_cast: { rate: 1.3 }, ribic_net: { rate: 1.1 } });
    RATE.ribic_sitWave = 7.5;

    // a fishing umbrella: its pole, a ten-sided canopy leaning on its hinge towards +x (the coming car sees under it: put with fw)
    function brolly(col) { const top = grp(), R = 1.3;
      for (let k = 0; k < 10; k++) { const t0 = k / 10 * TAU, t1 = (k + 1) / 10 * TAU; top.add(tri2([0, 0.45, 0], [R * Math.cos(t0), 0, R * Math.sin(t0)], [R * Math.cos(t1), 0, R * Math.sin(t1)], k % 2 ? col : shade(col, 0.86))); }
      top.position.set(0.25, 1.9, 0); top.rotation.z = -0.42; return grp(cyl(0.022, 0.022, 2.0, 4, 0x9ea3aa, 0, 1.0, 0), bar([0, 1.75, 0], [0.25, 1.9, 0], 0.03, 0x9ea3aa), top); }
    // the rod rest with two rods out over the water (+z), their bite alarms, their lines down into the water
    function rodPod() { const D = 0x2a2c31, g = grp();
      for (const x of [-0.3, 0.3]) { g.add(bar([x, 0, -0.3], [x, 0.55, -0.3], 0.025, D)); g.add(bar([x, 0, 0.3], [x, 0.75, 0.3], 0.025, D)); }
      g.add(box(0.75, 0.03, 0.03, D, 0, 0.55, -0.3)); g.add(box(0.75, 0.03, 0.03, D, 0, 0.75, 0.3));
      for (const x of [-0.22, 0.22]) { const tip = [x * 1.6, 0.75 + 2.9 * 0.31, 0.3 + 2.9 * 0.95];
        g.add(bar([x, 0.49, -0.5], tip, 0.022, D)); g.add(box(0.05, 0.05, 0.1, 0x15171c, x, 0.8, 0.3)); g.add(box(0.03, 0.02, 0.03, x < 0 ? 0xd8262a : 0x2fd84a, x, 0.83, 0.36, { basic: true }));
        g.add(bar(tip, [tip[0], 0, tip[2] + 0.8], 0.009, 0xe6e6dc)); }
      return g; }
    // the jetty along +z from its foot on the shore: boards (their gaps), posts into the water; a folding chair on its end
    function jetty(len, chairCol) { const g = grp(), H = 0.32, W = 1.0, D = 0x5e4630;
      g.add(box(W, 0.05, len, 0x8f6e48, 0, H - 0.025, len / 2));
      for (let k = 1; k < len / 0.28; k++) g.add(box(W + 0.01, 0.052, 0.016, D, 0, H - 0.025, k * 0.28));
      for (const z of [0.12, len / 2, len - 0.1]) for (const x of [-0.45, 0.45]) g.add(cyl(0.055, 0.055, H + 0.6, 5, D, x, (H - 0.6) / 2, z));
      const ch = L.chair(chairCol); ch.position.set(0, H, len - 0.45); g.add(ch);
      g.add(box(0.36, 0.2, 0.22, 0x2f6b3a, 0.36, H + 0.1, len - 0.9)); g.add(box(0.37, 0.025, 0.23, 0x24552e, 0.36, H + 0.2, len - 0.9));   // (his tackle box)
      return g; }
    function reeds(n) { const g = grp();
      for (let k = 0; k < n; k++) { const x = (rnd() - 0.5) * 0.9, z = (rnd() - 0.5) * 0.6, h = 0.7 + rnd() * 0.95, c = REED[k % REED.length];
        g.add(box(0.035, h, 0.035, c, x, h / 2, z, { rx: (rnd() - 0.5) * 0.25, rz: (rnd() - 0.5) * 0.25 }));
        if (k % 3 === 0) g.add(cyl(0.032, 0.032, 0.2, 5, CATTAIL, x, h + 0.02, z)); }
      return g; }
    const CARS = [0xb8bcc4, 0x2f3f63, 0x7c8a99, 0xd8d8d2, 0x8a2a24, 0x2f5a3a, 0x1d1f25];

    S.ribici = { seed: 307, clear: [[PA, 9.6, 8.6], [9.4, 8.6, 4.2]],
      build(C, F, K) {
        const fw = fwOf(F), wob = rnd() * TAU, wob2 = rnd() * TAU, rf = (t) => 1 + 0.07 * Math.sin(3 * t + wob) + 0.04 * Math.sin(5 * t + wob2);
        // K.lake: at a real lake (the user, 4. 11. 2026: »postavi samo tam, kjer je tudi v resnici«): its shore that many metres beyond the
        // barrier, along the road; no pond of their own, they sit and stand on that shore (its trees cleared, a way for the eye from the road),
        // and stay at their places as the car comes (the fence is far): they wave from there
        const lake = K.lake != null, S0 = lake ? K.lake : 0;
        const at = lake ? { jb: S0 - 1.5, cast: S0 - 1.1, kid: S0 - 0.35, ub: S0 - 1.55, car: S0 - 5.5 } : { jb: 7.4, cast: 7.75, kid: 8.05, ub: 8.55, car: 8.6 };
        if (!lake) {
        // the pond: its water in two rings (the far side lighter: the sky in it), the muddy shore round it
        const O = oval(PA, PB, RA, RB, 20, rf), I = O.map(([a, b]) => [PA + (a - PA) * 0.55, PB + (b - PB) * 0.55]), Ou = O.map(([a, b]) => [PA + (a - PA) * 1.12, PB + (b - PB) * 1.12]);
        const water = [], light = [], mud = [];
        for (let k = 0; k < O.length; k++) { const k2 = (k + 1) % O.length;
          water.push([[PA, PB, 0.06], [I[k][0], I[k][1], 0.06], [I[k2][0], I[k2][1], 0.06]]);
          (O[k][2] < Math.PI && O[k][2] > 0 ? light : water).push([[I[k][0], I[k][1], 0.06], [O[k][0], O[k][1], 0.06], [O[k2][0], O[k2][1], 0.06]], [[I[k][0], I[k][1], 0.06], [O[k2][0], O[k2][1], 0.06], [I[k2][0], I[k2][1], 0.06]]);
          mud.push([[O[k][0], O[k][1], 0.045], [Ou[k][0], Ou[k][1], 0.035], [Ou[k2][0], Ou[k2][1], 0.035]], [[O[k][0], O[k][1], 0.045], [Ou[k2][0], Ou[k2][1], 0.035], [O[k2][0], O[k2][1], 0.045]]); }
        ground(C, F, PA, PB, [{ col: WATER, tris: water }, { col: WATER2, tris: light }, { col: MUD, tris: mud }]);
        // reeds round its far side and its ends, lilies on the water
        for (let k = 0; k < 13; k++) { const t = -0.35 + k / 12 * (Math.PI + 0.7) + (rnd() - 0.5) * 0.12, r = rf(t) * (0.96 + rnd() * 0.12);
          C.prop(reeds(8 + Math.floor(rnd() * 5)), PA + RA * r * Math.cos(t), PB + RB * r * Math.sin(t), rnd() * TAU); }
        for (const [da, db, fl] of [[-1.6, 0.4, 1], [0.9, -0.6, 0], [1.4, 0.9, 0], [2.6, 0.2, 1], [-0.4, 1.3, 0], [3.1, -0.9, 0], [-2.4, -0.2, 0]]) {
          const pad = grp(cyl(0.24, 0.24, 0.012, 7, 0x4f7a34, 0, 0.075, 0), cyl(0.17, 0.17, 0.014, 6, 0x5f8a3e, 0.25, 0.076, 0.12));
          if (fl) pad.add(sph(0.06, 6, 3, fl && da < 0 ? 0xf2f0f4 : 0xf0a8c8, 0.04, 0.1, 0.02, { half: true }));
          C.prop(pad, PA + da, PB + db, rnd() * TAU); }
        } else {   // the lake's shore: clumps of reeds along its edge either side of them
          for (const da of [-9.5, -7.6, -6.1, -4.3, 1.9, 7.6, 8.9, 10.8]) C.prop(reeds(8 + Math.floor(rnd() * 5)), da + (rnd() - 0.5) * 0.4, S0 + 0.15 + rnd() * 0.35, rnd() * TAU);
          C.clear = [[PA, S0, 8.6], [9.4, at.car, 4.2]]; for (let b = S0 - 9; b > 2; b -= 7) C.clear.push([1.5, b, 6]);   // (their place, their car, a way for the eye from the road)
          C.cb = S0 - 2; }
        // the jetty (its foot on the shore, its end over the water) and the angler on it
        const JA = -1.5, JB = at.jb, JL = 3.0, ccol = pick([0x2f5a3a, 0x31406e, 0x5a4a3a]);
        C.prop(jetty(JL, ccol), JA, JB, [0, 1], 'jt');
        const sit = { on: 'jt', a: 0, b: JL - 0.45, y: 0.32 };
        C.man({ shirt: 0x5a6a3a, pants: 0x3a3f33, long: true, hat: 'bucket', hatCol: 0x7a7a52 }, { act: Object.assign({ pose: 'ribic_sit', hold: [['ribic_rod', 1, { line: 2.9 }]] }, sit),
          bliza: { look: 'car' }, run: false, fence: Object.assign({ pose: 'ribic_sitWave', hold: [['ribic_rod', 1, { line: 2.9 }]], look: 'car' }, sit) });
        // the one on the shore, the kid with the net and his bucket
        C.man({ shirt: pick([0x7c4a2e, 0x2f63c9, 0x8a3b8c]), pants: 0x2f3f63, hat: 'cap', hatCol: pick([0x2f5a3a, 0x15171c, 0xd8262a]) }, { act: { a: 3.8, b: at.cast, pose: 'ribic_cast', face: [0.2, 1], hold: [['ribic_rod', 1]] },
          run: lake ? false : { f: 0.62, pose: 'walk', hold: [['ribic_rodC', 0]] }, fence: lake ? { a: 3.8, b: at.cast, pose: 'wave', hold: [['ribic_rodC', 0]], look: 'car' } : { a: 3.2, b: 0.9, pose: 'wave', hold: [['ribic_rodC', 0]], look: 'car' } });
        C.prop(grp(cyl(0.14, 0.12, 0.28, 7, 0x2f63c9, 0, 0.14, 0), bar([-0.13, 0.28, 0], [0.13, 0.28, 0], 0.012, 0x9ea3aa)), 0.15, at.cast);
        C.man({ kid: true, shirt: pick([0xf0c22e, 0xd8262a, 0x22848f]), pants: 0x2f3f63, shorts: true, hat: 'cap', hatCol: pick([0xd8262a, 0x2f63c9]) }, { act: { a: 0.85, b: at.kid, pose: 'ribic_net', face: [0, 1], hold: [['ribic_net', 1]] },
          run: lake ? false : { f: 0.42 }, fence: lake ? { a: 0.85, b: at.kid - 0.3, pose: 'jump', hold: [['ribic_net', 1]], look: 'car' } : { a: 0.9, b: 0.9, pose: 'jump', hold: [['ribic_net', 1]], look: 'car' }, kid: true });
        // under the umbrella: the old angler, his chair, his rods on their rest, his cooler and his dog
        const UA = 5.5, UB = at.ub;
        C.prop(brolly(0x3d5a2e), UA - 0.35, UB - 0.15, fw(1, 0)); C.prop(L.chair(0x2a2c31), UA, UB, [0.25, 1]); C.prop(rodPod(), UA + 0.15, UB + 1.05, [0.2, 1]);
        C.prop(L.cooler(pick([0x2f63c9, 0xd8262a, 0xf2f2f2])), UA - 0.85, UB + 0.15, [1, 0.2]);
        C.man({ shirt: 0x2f5a3a, pants: 0x47494f, long: true, hair: 'bald', hairCol: 0x9a9a98, scale: 0.94 }, { act: { a: UA, b: UB, pose: 'sitDrink', face: [0.25, 1], hold: [['cup', 1, { c: 0x2a2c31 }]] },
          bliza: { look: 'car' }, run: false, fence: { a: UA, b: UB, pose: 'l3_sitWave', face: [0.25, 1], hold: [['cup', 1, { c: 0x2a2c31 }]], look: 'car' } });
        C.pet(L.dog(pick([0x5c3a22, 0xc8a878, 0x2a221c])), { act: { a: UA + 0.85, b: UB - 0.35, face: [-0.6, -1] }, fence: lake ? { a: UA + 0.85, b: UB - 0.35, face: [-1, -0.4] } : { a: UA - 0.6, b: 1.0, face: [1, -0.2] }, run: lake ? false : { f: 1.05 } });   // (by the lake it stays by the old angler: run false; at the fence it runs on after the car, facing the way it goes)
        C.prop(L.car(pick(CARS)), 9.4, at.car, fw(-1, 0.15));
      } };
  }

  /* 2 · Spravilo sena (Vršič, Ouninpohja): on a meadow, its hay raked into windrows (on the meadow's own grass); an old open tractor and a farm wagon with
     ladder sides, a heap of loose hay on it. A man stands on the heap and spreads what his son forks up to him from the windrow; the
     grandfather sits on the tractor; a woman in a headscarf rakes the next windrow; the grandmother rests on a bale with a jug of water, the
     bread in a basket by her, the farm dog with her; a child sits up on the hay. Wrapped round bales lie at the field's end. As the car comes
     the woman walks to the fence with her rake and waves, the dog runs along; the rest stay at their work and look: the one with the fork
     leans on it, the one on the heap waves, the child cheers, the grandfather waves from his seat */
  {
    const HAY = [0xcdbb66, 0xc2b05c, 0xd6c674, 0xb9a85a];
    // an old open tractor along x (front +x): the seat's top at 1.17 (x -0.75), its steering wheel; the hitch at x -1.35, 0.55 high
    function tractor(col) { const g = grp(), T = 0x17181b, RIM = 0xb9bec6, DK = 0x2a2c31;   // (plain colours, grey wheels: no maker's livery)
      g.add(box(1.55, 0.62, 0.66, col, 0.62, 1.12, 0)); g.add(box(0.1, 0.56, 0.58, 0x3a3c40, 1.42, 1.08, 0)); g.add(box(1.25, 0.42, 0.52, 0x3a3c40, 0.55, 0.62, 0));   // (the bonnet, the grille, the engine)
      g.add(box(0.85, 0.52, 0.9, 0x3a3c40, -0.55, 0.74, 0));   // (the gearbox under the seat)
      for (const z of [0.62, -0.62]) {
        g.add(cyl(0.66, 0.66, 0.36, 12, T, -0.72, 0.66, z, { rx: PI2 })); g.add(cyl(0.36, 0.36, 0.38, 8, RIM, -0.72, 0.66, z, { rx: PI2 }));
        g.add(box(0.95, 0.05, 0.42, col, -0.72, 1.38, z)); g.add(box(0.06, 0.5, 0.42, col, -0.25, 1.14, z));   // (the fenders)
        g.add(cyl(0.36, 0.36, 0.2, 9, T, 1.05, 0.36, z * 0.85, { rx: PI2 })); g.add(cyl(0.18, 0.18, 0.22, 6, RIM, 1.05, 0.36, z * 0.85, { rx: PI2 })); }
      g.add(box(0.36, 0.06, 0.4, DK, -0.75, 1.14, 0)); g.add(box(0.06, 0.32, 0.38, DK, -0.97, 1.32, 0, { rz: 0.15 }));   // (the seat, its back)
      g.add(bar([0.3, 1.38, 0], [-0.28, 1.6, 0], 0.04, DK)); g.add(cyl(0.19, 0.19, 0.03, 9, DK, -0.3, 1.61, 0, { rz: 1.1 }));   // (the steering column, its wheel)
      g.add(cyl(0.04, 0.05, 0.75, 5, DK, 1.0, 1.78, 0.2)); const sm = smokeAt(3, 2.6, 0x9a9ca0, 0.3, 1.4); sm.position.set(1.0, 2.18, 0.2); g.add(sm);   // (the exhaust)
      for (const z of [0.5, -0.5]) g.add(bar([-1.12, 1.2, z], [-1.12, 2.35, z], 0.06, DK)); g.add(bar([-1.12, 2.35, 0.53], [-1.12, 2.35, -0.53], 0.06, DK));   // (the roll bar)
      g.add(box(0.22, 0.12, 0.14, DK, -1.3, 0.55, 0));
      return g; }
    // the wagon along x (its drawbar +x): the deck at 0.95, ladder sides; the heap of loose hay on it (its top 2.3 over the ground)
    function wagon() { const g = grp(), W = 0x8a6a45, D = 0x5e4630, T = 0x17181b;
      g.add(box(4.2, 0.08, 1.9, W, 0, 0.95, 0)); for (const z of [0.6, -0.6]) g.add(box(4.0, 0.16, 0.12, D, 0, 0.83, z));
      for (const x of [1.35, -1.35]) for (const z of [0.82, -0.82]) { g.add(cyl(0.42, 0.42, 0.14, 10, T, x, 0.42, z, { rx: PI2 })); g.add(cyl(0.24, 0.24, 0.16, 6, 0xb8262a, x, 0.42, z, { rx: PI2 })); }
      g.add(bar([2.1, 0.72, 0], [3.0, 0.57, 0], 0.08, D));
      for (const z of [0.98, -0.98]) { for (let k = 0; k < 6; k++) { const x = -1.95 + k * 0.78; g.add(bar([x, 0.95, z], [x, 1.65, z * 1.12], 0.06, D)); }
        g.add(bar([-2.1, 1.65, z * 1.12], [2.1, 1.65, z * 1.12], 0.06, D)); g.add(bar([-2.1, 1.28, z * 1.06], [2.1, 1.28, z * 1.06], 0.05, D)); }
      g.add(box(4.0, 0.3, 1.9, HAY[1], 0, 1.1, 0));
      g.add(sph(1, 10, 5, HAY[0], 0, 1.0, 0, { half: true, s: [2.15, 1.3, 1.12] }));
      for (const [x, y, z, r, c] of [[1.1, 1.62, 0.35, 0.55, 2], [-1.2, 1.55, -0.3, 0.6, 3], [0.2, 2.0, -0.2, 0.45, 2], [-0.5, 1.9, 0.45, 0.4, 1]]) g.add(sph(r, 7, 3, HAY[c], x, y, z, { half: true, s: [1.4, 0.8, 1.1] }));
      for (const x of [-1.5, -0.4, 0.8, 1.7]) for (const z of [1.06, -1.06]) g.add(box(0.55 + 0.2 * Math.abs(x) / 1.7, 0.2, 0.18, HAY[(x * 7 + z * 3 & 3)], x, 1.52, z, { rz: 0.1 * x }));   // (wisps over the rails)
      return g; }
    // a pitchfork (both hands on its handle: the forearm th 1.9, the handle forwards and level), its tines with a forkful of hay (o.hay);
    // upright, the hands on its top (seno_forkV); the wooden hay rake drawn over the ground (th 1.35), carried upright (seno_rakeC); a clay jug
    ITEMX.seno_fork = (o) => { const g = [bar([0, 0, -0.45], [0, 0, 1.0], 0.032, 0xb08a5a)];
      for (const x of [-0.07, 0, 0.07]) g.push(bar([x * 0.5, 0, 1.0], [x, 0.03, 1.3], 0.014, 0x8f949b));
      if (o.hay) g.push(sph(0.22, 6, 3, HAY[2], 0, 0.06, 1.24, { s: [1.3, 0.8, 1.15] }));
      return inHand(1.9, ...g); };
    ITEMX.seno_forkV = () => inHand(1.4, bar([0, 0.2, 0.02], [0, -1.0, 0.06], 0.032, 0xb08a5a), ...[-0.07, 0, 0.07].map(x => bar([x * 0.5, -1.0, 0.06], [x, -1.28, 0.08], 0.014, 0x8f949b)));
    ITEMX.seno_rake = () => { const tip = [0, -0.92, 1.18], g = [bar([0, 0.2, -0.26], tip, 0.03, 0xc9a26a), box(0.64, 0.045, 0.045, 0xb08a5a, tip[0], tip[1], tip[2])];
      for (let k = 0; k < 8; k++) g.push(bar([-0.28 + k * 0.08, tip[1], tip[2]], [-0.28 + k * 0.08, tip[1] - 0.09, tip[2] - 0.05], 0.014, 0xd8c08a));
      return inHand(1.35, ...g); };
    ITEMX.seno_rakeC = () => { const top = [0, 1.32, 0.08], g = [bar([0, -0.3, 0.02], top, 0.03, 0xc9a26a), box(0.64, 0.045, 0.045, 0xb08a5a, ...top)];
      for (let k = 0; k < 8; k++) g.push(bar([-0.28 + k * 0.08, top[1], top[2]], [-0.28 + k * 0.08, top[1] - 0.02, top[2] + 0.1], 0.014, 0xd8c08a));
      return inHand(0.2, ...g); };
    ITEMX.seno_jug = () => inHand(1.25, cyl(0.055, 0.07, 0.2, 7, 0x9a4a2a, 0, 0.06, 0.07), cyl(0.035, 0.05, 0.05, 6, 0x9a4a2a, 0, 0.18, 0.07), bar([0, 0.13, 0.0], [0, 0.0, 0.0], 0.02, 0x8a3e22));
    // forking hay up onto the wagon: from the windrow (bent, the fork down) up over the head and back; on the heap, spreading it (bent,
    // turning side to side); leaning on the upright fork; the rake drawn over the ground; on the tractor's seat, the hands on the wheel (and
    // one waving); the child sitting on the hay, cheering
    POSEX.seno_fork = (t) => { const c = Math.cos(t), u0 = 0.5 - 0.5 * c, u = u0 * u0 * (3 - 2 * u0);
      return { shz: [0.15, 0.12], shx: [0.45 + 1.1 * u, 0.65 + 1.25 * u], el: [0.85 + 0.2 * u, 0.55 + 0.25 * u], shy: [-0.45, -0.1], lean: 0.38 - 0.5 * u, hy: 0.88 + 0.04 * u, hp: [0.32 - 0.25 * u, -0.12], kn: [0.32 - 0.22 * u, 0.12], nod: 0.15 - 0.3 * u }; };
    POSEX.seno_spread = (t, s) => ({ shz: [0.15, 0.12], shx: [0.55, 0.65], el: [0.7, 0.55], shy: [-0.45, -0.1], lean: 0.45, hy: 0.86, tw: 0.28 * s, hp: [0.25, 0.1], kn: [0.3, 0.2], nod: 0.2 });
    POSEX.seno_lean = () => ({ shz: [0.12, 0.14], shx: [0.62, 0.55], el: [0.75, 0.85], shy: [-0.35, -0.12], lean: 0.08, hpz: [0.06, 0.06] });
    POSEX.seno_rake = (t, s) => ({ shz: [0.1, 0.1], shx: [0.55 + 0.25 * s, 0.75 + 0.25 * s], el: [0.4, 0.6], shy: [-0.3, -0.1], lean: 0.28, hy: 0.88, tw: 0.12 * s, hp: [0.2, -0.1], kn: [0.25, 0.1] });
    const drive = { hy: 0.5, hp: [1.2, 1.2], kn: [0.95, 0.95], lean: 0.06, shz: [0.1, 0.1], shx: [0.95, 0.95], el: [0.6, 0.6], shy: [-0.35, -0.35] };
    POSEX.seno_drive = (t, s) => Object.assign({}, drive, { tw: 0.04 * s, look: 0.1 * s });
    POSEX.seno_driveWave = (t, s) => Object.assign({}, drive, { shz: [0.1, 2.35 + 0.25 * s], shx: [0.95, 0.2], el: [0.6, 0.55], shy: [-0.35, 0] });
    POSEX.seno_sitCheer = (t, s) => ({ hy: 0.14, hp: [1.45, 1.45], kn: [0.3, 0.3], lean: -0.05, shz: [2.55 + 0.1 * s, 2.6 - 0.1 * s], shx: [0.25, 0.25], el: [0.25, 0.3] });
    Object.assign(MOTION, { seno_fork: { rate: 1.5 }, seno_spread: { rate: 1.3 }, seno_rake: { rate: 2.2 }, seno_drive: { rate: 0.5 } });
    Object.assign(RATE, { seno_driveWave: 7.5, seno_sitCheer: 6.5 });

    S.seno = { seed: 353, clear: [[-1.0, 8.4, 10.5], [6.5, 9.4, 4.5]],
      build(C, F, K) {
        const fw = fwOf(F), side = F.side, lz = (db) => db * side, onYaw = (da, db) => Math.atan2(da, side * db);
        // the windrows (one raked so far, one by the wagon), the wrapped bales at the end, on the meadow's own grass (no mown patch under them:
        // the user, 5. 11. 2026: »zbriši zeleno podlago, ki deluje kot tepih«)
        const row = (b, a0, a1) => { for (let a = a0; a < a1; a += 2.1) { const seg = grp(sph(1, 7, 3, HAY[Math.floor(rnd() * 4)], 0, 0, 0, { half: true, s: [1.2, 0.3, 0.45] }));
          C.prop(seg, a + 1.05 + (rnd() - 0.5) * 0.2, b + (rnd() - 0.5) * 0.18, fw(1, (rnd() - 0.5) * 0.12), null, 0.03); } };
        row(5.0, -11.5, -4.6); row(7.0, -11.5, -0.4); row(11.6, -11.5, -3.0);
        for (const [a, b, r] of [[-8.2, 12.6, 0.3], [-6.6, 12.9, 1.2], [7.6, 12.2, 0.5]]) C.prop(grp(cyl(0.66, 0.66, 1.2, 12, 0xecece4, 0, 0.66, 0, { rx: PI2 }), cyl(0.67, 0.67, 0.06, 12, 0xd2d4cc, 0, 0.66, 0.3, { rx: PI2 })), a, b, r);
        // the wagon and the tractor before it, along the road
        const WA = 0.4, WB = 9.3, tcol = pick([0xc8201c, 0xb3361e, 0x8a8f98, 0xd8722a, 0x31406e]);
        C.prop(wagon(), WA, WB, fw(1, 0), 'wg'); C.prop(tractor(tcol), WA + 4.35, WB, fw(1, 0), 'tr');
        const old = { pants: 0x47494f, long: true, hairCol: 0xc8c8c4 };
        C.man(Object.assign({ shirt: 0x7c8a99, hat: 'cap', hatCol: 0x31406e, scale: 0.94 }, old), { act: { on: 'tr', a: -0.75, b: 0, y: 0.705, yaw: PI2, pose: 'seno_drive' },
          bliza: { look: 'car' }, run: false, fence: { on: 'tr', a: -0.75, b: 0, y: 0.705, yaw: PI2, pose: 'seno_driveWave', look: 'car' } });
        // on the heap: the man spreading the hay and the child sitting up there
        const top = { on: 'wg', a: -0.8, b: lz(-0.28), y: 2.02, yaw: onYaw(0.15, -1) };
        C.man({ shirt: pick([0xefefea, 0xd23a2c, 0x2f63c9]), pants: 0x2f3f63, hat: 'straw', hatCol: 0xe2c77e }, { act: Object.assign({ pose: 'seno_spread', hold: [['seno_fork', 1]] }, top),
          bliza: { pose: 'stand', look: 'car' }, run: false, fence: Object.assign({ pose: 'wave2', hold: [['seno_fork', 1]], look: 'car' }, top) });
        const kidAt = { on: 'wg', a: 0.95, b: lz(-0.4), y: 1.97, yaw: onYaw(-0.35, -1) };
        C.man({ kid: true, shirt: pick([0xf0c22e, 0xd8262a, 0x2f9a48]), pants: 0x2f3f63, shorts: true, hair: pick(['short', 'pony']) }, { act: Object.assign({ pose: 'sitGround' }, kidAt),
          bliza: { look: 'car' }, run: false, fence: Object.assign({ pose: 'seno_sitCheer', look: 'car' }, kidAt), kid: true });
        // the one forking it up from the windrow; the woman raking
        C.man({ shirt: pick([0x2f9a48, 0xb8bcc4, 0x7c4a2e]), pants: 0x3a4a3a, hat: 'cap', hatCol: pick([0xd8262a, 0x15171c]) }, { act: { a: -0.2, b: 7.65, pose: 'seno_fork', face: [0.15, 1], hold: [['seno_fork', 1, { hay: 1 }]] },
          bliza: { pose: 'seno_lean', hold: [['seno_forkV', 1]], look: 'car' }, run: false, fence: { a: -0.2, b: 7.65, pose: 'seno_lean', face: [0.15, 1], hold: [['seno_forkV', 1]], look: 'car' } });
        C.man({ shirt: pick([0xd8d0c0, 0x8a3b8c, 0x22848f]), pants: 0x31406e, long: true, hat: 'scarf', hatCol: pick([0xd8262a, 0x2f63c9, 0xf0c22e]) }, { act: { a: -4.4, b: 5.15, pose: 'seno_rake', face: [-0.9, -0.3], hold: [['seno_rake', 1]] },
          run: { f: 0.62, pose: 'walk', hold: [['seno_rakeC', 0]] }, fence: { a: -3.8, b: 0.9, pose: 'wave', hold: [['seno_rakeC', 0]], look: 'car' } });
        // the grandmother on a bale, her basket, the dog
        C.prop(grp(box(0.85, 0.38, 0.45, HAY[0], 0, 0.19, 0)), -2.9, 6.3, [-0.5, -1]);
        C.prop(grp(cyl(0.2, 0.15, 0.2, 8, 0x9a6a3a, 0, 0.1, 0), box(0.32, 0.04, 0.3, 0xf2f2ee, 0, 0.21, 0), sph(0.1, 6, 3, 0xc08a4a, 0.05, 0.23, 0, { half: true, s: [1.4, 1, 1] })), -2.15, 6.0, 0.4);
        C.man(Object.assign({ shirt: 0x5a3a5a, hat: 'scarf', hatCol: 0x2a2c31, scale: 0.92 }, old), { act: { a: -2.9, b: 6.3, y: -0.08, pose: 'sitDrink', face: [-0.5, -1], hold: [['seno_jug', 1]] },
          bliza: { look: 'car' }, run: false, fence: { a: -2.9, b: 6.3, y: -0.08, pose: 'l3_sitWave', face: [-0.5, -1], hold: [['seno_jug', 1]], look: 'car' } });
        C.pet(L.dog(pick([0x1d1d1f, 0x5c3a22, 0xc8a878])), { act: { a: -1.9, b: 6.7, face: [-1, -0.3] }, fence: { a: -2.6, b: 1.0, face: [1, -0.2] }, run: { f: 1.0 } });
      } };
  }

  /* 3 · Čebelarji (Medvode): a bee house with its hives in three rows, their fronts painted in bright colours (blocks of colour: no
     pictures), a spare stack of hives, flowers before it; two beekeepers in white with veiled hats: one holds a comb up to the light, one
     puffs his smoker at the hives; by the road the grandmother sells their honey (jars on a table under a parasol, a plain board), a child
     licks honey from a spoon, a man looks at the jar he is buying. As the car comes the child runs to the fence and jumps, the man walks after
     him with his jar; the grandmother waves from her chair; the beekeepers stay at their bees and look */
  {
    const FRONT = [0x2f63c9, 0xf0c22e, 0xd8262a, 0x2f9a48, 0xf2efe6, 0xf07a1c, 0x5aa0d8, 0x8a3b8c], PAINT = [0xf2efe6, 0x8a3b8c, 0xf0c22e, 0x2f63c9, 0xd8262a, 0x2f9a48, 0x15171c];
    // the bee house, its front +z: 3 rows of 6 hives (0.5-1.46 m), the wall over them, a gable roof out over the front
    function beeHouse(sd) { const g = grp(), Wd = 0x7a5232, D = 0x5a3a22, wdt = 2.9, dep = 1.9, h0 = 0.5, hh = 0.32, n = 6, rows = 3, H = 2.15, zf = dep / 2;
      g.add(box(wdt, H, 0.08, Wd, 0, H / 2, -zf)); for (const x of [wdt / 2, -wdt / 2]) g.add(box(0.08, H, dep, Wd, x, H / 2, 0));
      g.add(box(wdt, h0, 0.08, D, 0, h0 / 2, zf - 0.04));
      const wh = (wdt - 0.16) / n;
      for (let r = 0; r < rows; r++) for (let k = 0; k < n; k++) {
        const x = -wdt / 2 + 0.08 + (k + 0.5) * wh, y = h0 + (r + 0.5) * hh, c = FRONT[(k * 3 + r * 5 + sd) % FRONT.length], c2 = PAINT[(k * 2 + r * 3 + sd) % PAINT.length];
        g.add(box(wh - 0.03, hh - 0.03, 0.05, c, x, y, zf)); g.add(box(wh * 0.56, hh * 0.42, 0.052, c2 === c ? 0xf2efe6 : c2, x, y + 0.035, zf + 0.002));
        g.add(box(wh * 0.42, 0.022, 0.054, 0x1a1410, x, y - hh / 2 + 0.065, zf + 0.003)); g.add(box(wh * 0.46, 0.016, 0.09, c, x, y - hh / 2 + 0.05, zf + 0.055)); }
      const yt = h0 + rows * hh; g.add(box(wdt, H - yt, 0.06, Wd, 0, (yt + H) / 2, zf - 0.03));
      for (let k = 0; k < 7; k++) g.add(box(0.025, H - yt, 0.065, D, -wdt / 2 + 0.1 + k * (wdt - 0.2) / 6, (yt + H) / 2, zf - 0.025));   // (its boards)
      const span = zf + 0.6, rh = 0.8, sl = Math.hypot(span, rh), ang = Math.atan2(rh, span);
      for (const s2 of [1, -1]) g.add(box(wdt + 0.5, 0.07, sl, 0x8a3a2a, 0, H + rh / 2, s2 * span / 2, { rx: s2 * ang }));
      g.add(box(wdt + 0.52, 0.09, 0.09, 0x6a2a1e, 0, H + rh, 0));
      for (const x of [wdt / 2, -wdt / 2]) g.add(tri2([x, H, -zf], [x, H, zf], [x, H + rh * (1 - 0.0), 0], Wd));
      return g; }
    // the beekeeper's comb in its frame, held up before the face in both hands (the right hand's frame, the forearms up, th 2.4); the
    // smoker (a can, its nozzle, the bellows: th 1.6); a jar of honey; the spoon
    ITEMX.cebelar_frame = () => inHand(2.4, box(0.5, 0.026, 0.026, 0x8a6a45, 0.17, 0.05, 0.05), box(0.43, 0.22, 0.03, 0xc8922a, 0.17, -0.08, 0.05), box(0.28, 0.12, 0.034, 0x9a6418, 0.15, -0.1, 0.05),
      box(0.026, 0.25, 0.03, 0x8a6a45, -0.06, -0.08, 0.05), box(0.026, 0.25, 0.03, 0x8a6a45, 0.4, -0.08, 0.05));
    ITEMX.cebelar_smoker = () => inHand(1.6, cyl(0.06, 0.06, 0.2, 7, 0xb9bec6, 0, 0.06, 0.07), cyl(0.02, 0.05, 0.08, 6, 0xb9bec6, 0, 0.19, 0.1, { rx: 0.5 }), box(0.03, 0.15, 0.1, 0x6b4a2e, 0.08, 0.04, 0.05));
    ITEMX.cebelar_jar = () => inHand(1.3, cyl(0.045, 0.045, 0.11, 6, 0xd99a2a, 0, 0.0, 0.05), cyl(0.048, 0.048, 0.025, 6, 0xd8262a, 0, 0.065, 0.05));
    ITEMX.cebelar_spoon = () => inHand(2.8, bar([0, -0.02, 0.02], [0, 0.11, 0.05], 0.012, 0xc8ccd2), sph(0.022, 5, 3, 0xe0a030, 0, 0.12, 0.055));
    POSEX.cebelar_hold = (t, s) => ({ shz: [0.25, 0.25], shx: [1.35, 1.35], el: [1.05, 1.05], shy: [-0.45, -0.45], nod: -0.06, tz: 0.04 * s, lean: -0.03 });
    POSEX.cebelar_smoke = (t, s) => ({ shz: [0.12, 0.15], shx: [0.8 + 0.08 * s, 0.85], el: [0.95, 0.75], shy: [-0.5, -0.1], lean: 0.15, nod: 0.1 });
    Object.assign(MOTION, { cebelar_hold: { rate: 0.5 }, cebelar_smoke: { rate: 3.0 } });
    const SUIT = { shirt: 0xf2f2ee, pants: 0xeeeee8, long: true, gloves: 0xd8c27a, shoes: 0x3a3027, hat: 'veil', hatCol: 0xeeeae0 };

    S.cebelarji = { seed: 331, clear: [[0.5, 8.4, 7.5], [-4.6, 4.4, 4.2]],
      build(C, F, K) {
        const fw = fwOf(F), BA = 0.6, BB = 9.7;
        C.prop(beeHouse(Math.floor(rnd() * 8)), BA, BB);
        C.prop(L.flowerBed(2.4), BA, BB - 1.55);
        const stack = grp(); for (let k = 0; k < 3; k++) stack.add(box(0.46, 0.3, 0.56, FRONT[(k * 3 + 1) % FRONT.length], 0, 0.15 + k * 0.31, 0)); stack.add(box(0.54, 0.05, 0.64, 0x8a3a2a, 0, 0.95, 0));
        C.prop(stack, BA - 2.3, BB - 0.3, [0.3, -1]);
        C.prop(L.wheelbarrow(pick([0x2f9a48, 0xd8262a])), BA + 2.6, BB - 1.2, fw(-0.3, -1));
        C.man(Object.assign({}, SUIT), { act: { a: BA - 1.3, b: 7.55, pose: 'cebelar_hold', face: [-0.55, -0.8], hold: [['cebelar_frame', 1]] },
          bliza: { look: 'car' }, run: false, fence: { a: BA - 1.3, b: 7.55, pose: 'cebelar_hold', face: [-0.55, -0.8], hold: [['cebelar_frame', 1]], look: 'car' } });
        C.man(Object.assign({}, SUIT), { act: { a: BA + 1.3, b: 7.75, pose: 'cebelar_smoke', face: [0.1, 1], hold: [['cebelar_smoker', 1]] },
          bliza: { look: 'car' }, run: false, fence: { a: BA + 1.3, b: 7.75, pose: 'cebelar_smoke', face: [0.1, 1], hold: [['cebelar_smoker', 1]], look: 'car' } });
        const sm = smokeAt(2, 1.3, 0xe8e8e4, 0.45, 0.8); sm.position.y = 1.05; C.prop(grp(sm), BA + 1.35, 8.35);
        // the honey stand by the road
        const TA = -4.6, TB = 4.4, tb = L.table(1.5, 0.62, { things: false, top: 0xf2f2ee });
        for (let r = 0; r < 2; r++) for (let k = 0; k < 6; k++) { const x = -0.6 + k * 0.24 + r * 0.1, z = -0.12 + r * 0.2, big = r === 1;
          tb.add(cyl(big ? 0.055 : 0.045, big ? 0.055 : 0.045, big ? 0.14 : 0.11, 6, k % 3 === 2 ? 0xb8721e : 0xd99a2a, x, 0.74 + (big ? 0.07 : 0.055), z));
          tb.add(cyl(big ? 0.058 : 0.048, big ? 0.058 : 0.048, 0.025, 6, k % 2 ? 0xd8262a : 0xf2f2ee, x, 0.74 + (big ? 0.15 : 0.12), z)); }
        C.prop(tb, TA, TB, [0, -1]); C.prop(L.parasol(0xf0c22e, 0xf2f2ee), TA + 0.5, TB + 0.25);
        C.prop(grp(bar([0, 0, 0], [0, 1.0, 0], 0.05, 0x8a6a45), box(0.66, 0.46, 0.025, 0x6b4a2e, 0, 1.15, 0.02), box(0.58, 0.38, 0.028, 0xf0c22e, 0, 1.15, 0.035),
          sph(0.09, 6, 4, 0xc87a1e, 0, 1.15, 0.05, { s: [1, 1, 0.3] })), TA - 1.15, TB - 0.85, [0.4, -1]);
        C.prop(L.chair(pick([0x2f9a48, 0xd8262a, 0x2f63c9])), TA, TB + 0.65, [0, -1]);
        C.man({ shirt: pick([0x8a3b8c, 0x22848f, 0x5a3a5a]), pants: 0x47494f, long: true, hair: 'short', hairCol: 0xc8c8c4, scale: 0.92 }, { act: { a: TA, b: TB + 0.65, pose: 'sit', face: [0, -1] },
          bliza: { look: 'car' }, run: false, fence: { a: TA, b: TB + 0.65, pose: 'l3_sitWave', face: [0, -1], look: 'car' } });
        C.man({ kid: true, shirt: pick([0xf0c22e, 0xd8262a, 0x2f9a48, 0xf07a1c]), pants: 0x2f3f63, shorts: true, hair: pick(['short', 'pony']) }, { act: { a: TA + 1.05, b: TB - 0.75, pose: 'drink', face: [-0.6, 0.8], hold: [['cebelar_spoon', 1]] },
          run: { f: 0.4 }, fence: { a: TA + 1.6, b: 0.9, pose: 'jump', look: 'car' }, kid: true });
        C.man({ shirt: pick([0x2f63c9, 0xefefea, 0x7c4a2e]), pants: pick(pal.PANTS), hair: pick(['short', 'bald']) }, { act: { a: TA - 0.75, b: TB - 0.95, pose: 'talk', face: [0.3, 1], hold: [['cebelar_jar', 1]] },
          run: { f: 0.65, pose: 'walk', hold: [['cebelar_jar', 1]] }, fence: { a: TA - 0.2, b: 0.9, pose: 'wave2', hold: [['cebelar_jar', 1]], look: 'car' } });
      } };
  }

  /* 4 · Balinanje (no place yet: no bocce court by a track): a sand court along the road inside its low boards, the balls round the jack at its near end; one
     player bowls from the far end (the swing, the step), one crouches by the jack measuring which ball is nearer; two more wait at the side,
     balls in their hands; behind them a pergola under a vine (bunches of grapes), the old men at its table with wine; a chalk board for the
     score, a bicycle against a post. As the car comes the two waiting walk to the fence; the bowler and the one measuring stop and look, the
     old men raise a hand */
  {
    const SAND = 0xc9b48c, BOARD = 0x8a6a45, RED = 0xb8262a, GRN = 0x2f7a3a;
    ITEMX.balin_ball = (o) => grp(sph(0.055, 7, 5, o.c || RED, 0, -0.05, 0.035));
    ITEMX.balin_meter = () => inHand(1.1, box(0.02, 0.012, 0.62, 0xf0c22e, 0, -0.02, 0.32));
    ITEMX.balin_glass = () => inHand(1.25, cyl(0.03, 0.022, 0.07, 6, 0x7a1424, 0, 0.03, 0.05), cyl(0.006, 0.006, 0.06, 4, 0xd8dcdc, 0, -0.035, 0.05));
    // the underarm bowl: the arm swung back and through, a step forward on the left leg; crouching by the jack, the right hand with the
    // stick to the balls; standing with a ball in each hand
    POSEX.balin_throw = (t) => { const c = Math.cos(t);
      return { shz: [0.5, 0.12], shx: [0.4, 0.25 - 0.85 * c], el: [0.45, 0.15], lean: 0.32 + 0.1 * c, hy: 0.83, hp: [0.7, -0.25], kn: [0.6, 0.15], nod: -0.1 }; };
    POSEX.balin_meri = (t, s) => ({ hy: 0.5, hp: [1.75, 1.75], kn: [2.1, 2.1], lean: 0.55, hz: -0.15, nod: 0.3, shz: [0.2, 0.08], shx: [0.9, 1.0 + 0.05 * s], el: [1.2, 0.1], shy: [-0.3, -0.1] });
    POSEX.balin_hold = (t, s) => ({ shz: [0.2, 0.2], shx: [0.6, 0.6], el: [1.35, 1.35], shy: [-0.5, -0.5], look: 0.1 * s });
    Object.assign(MOTION, { balin_throw: { rate: 1.3 }, balin_meri: { rate: 0.5 }, balin_hold: { rate: 0.4 } });
    // the pergola: four posts, the beams, the vine's leaves over it, bunches of grapes under them (along x, 4.4 x 2.6)
    function pergola() { const g = grp(), W = 0x6b4a2e, LV = [0x4f7a2e, 0x5f8a34, 0x46702a];
      for (const x of [-2.1, 2.1]) for (const z of [-1.2, 1.2]) g.add(box(0.12, 2.35, 0.12, W, x, 1.175, z));
      for (const z of [-1.2, 1.2]) g.add(box(4.6, 0.1, 0.1, W, 0, 2.35, z)); for (let k = 0; k < 6; k++) g.add(box(0.07, 0.07, 2.8, W, -2.1 + k * 0.84, 2.43, 0));
      for (let k = 0; k < 9; k++) g.add(sph(0.75, 7, 3, LV[k % 3], -2.0 + k * 0.5, 2.42, (k % 2 ? 0.55 : -0.5), { half: true, s: [1.1, 0.35, 1.25] }));
      for (const [x, z] of [[-1.5, 0.6], [-0.6, -0.4], [0.4, 0.5], [1.3, -0.7], [1.8, 0.4]]) g.add(sph(0.09, 5, 4, 0x4a2050, x, 2.2, z, { s: [1, 1.5, 1] }));
      return g; }

    S.balinanje = { seed: 389, clear: [[0, 5.5, 9.5], [-1.5, 10.2, 4.5]],
      build(C, F, K) {
        const fw = fwOf(F), A0 = -7.4, A1 = 7.4, B0 = 3.5, B1 = 6.7;
        ground(C, F, 0, (B0 + B1) / 2, [{ col: SAND, tris: rectTris(A0, A1, B0, B1, 0.03, 1.6) }]);
        for (let a = A0; a < A1 - 0.01; a += 2.47) for (const b of [B0, B1]) C.prop(grp(box(2.5, 0.22, 0.08, BOARD, 0, 0.11, 0)), a + 1.235, b, fw(1, 0));
        for (const a of [A0, A1]) C.prop(grp(box(3.28, 0.22, 0.08, BOARD, 0, 0.11, 0)), a, (B0 + B1) / 2, fw(0, 1));
        // the jack and the balls round it (the near end), two by the bowler's feet
        const J = [-5.0, 5.0]; C.prop(grp(sph(0.024, 6, 4, 0xf2e05a, 0, 0.054, 0)), J[0], J[1]);
        for (const [da, db, c] of [[-0.3, 0.22, RED], [0.38, -0.3, RED], [-1.1, 0.5, RED], [1.9, 1.05, RED], [-0.12, -0.38, GRN], [0.62, 0.55, GRN], [-1.6, -0.75, GRN]]) C.prop(grp(sph(0.055, 7, 5, c, 0, 0.085, 0)), J[0] + da, J[1] + db);
        for (const [a, c] of [[6.9, GRN], [7.05, GRN]]) C.prop(grp(sph(0.055, 7, 5, c, 0, 0.085, 0)), a, 5.65);
        const old = () => ({ shirt: pick([0xefefea, 0xb8c8d8, 0xd8ccb0, 0x8a9aa8]), pants: pick([0x47494f, 0x5b5040, 0x6a6f78]), hat: 'flat', hatCol: pick([0x5b5040, 0x47494f, 0x6a5a48, 0x2a2c31]), scale: 0.94 });
        C.man(old(), { act: { a: 6.5, b: 5.15, pose: 'balin_throw', face: [-1, 0], hold: [['balin_ball', 1, { c: GRN }]] },
          bliza: { pose: 'stand', look: 'car' }, run: false, fence: { a: 6.5, b: 5.15, pose: 'wave', face: [-1, -0.2], hold: [['balin_ball', 1, { c: GRN }]], look: 'car' } });
        C.man(old(), { act: { a: J[0] + 0.15, b: J[1] + 0.75, pose: 'balin_meri', face: [-0.15, -1], hold: [['balin_meter', 1]] },
          bliza: { look: 'car' }, run: false, fence: { a: J[0] + 0.15, b: J[1] + 0.75, pose: 'balin_meri', face: [-0.15, -1], hold: [['balin_meter', 1]], look: 'car' } });
        C.man(old(), { act: { a: -2.6, b: 7.35, pose: 'balin_hold', face: [-0.5, -1], hold: [['balin_ball', 0, { c: RED }], ['balin_ball', 1, { c: RED }]] },
          run: { f: 0.6, pose: 'walk' }, fence: { a: -2.8, b: 0.9, pose: 'fence', hold: [['balin_ball', 0, { c: RED }], ['balin_ball', 1, { c: RED }]], look: 'car' } });
        C.man(Object.assign(old(), { hat: null, hair: 'short', hairCol: 0x9a9a98 }), { act: { a: -1.4, b: 7.55, pose: 'talk', face: [-1, -0.4], hold: [['balin_ball', 1, { c: GRN }]] },
          run: { f: 0.7, pose: 'walk' }, fence: { a: -1.4, b: 0.9, pose: 'fenceWave', hold: [['balin_ball', 1, { c: GRN }]], look: 'car' } });
        // the pergola, its table and benches, the old men under it
        const PA = -1.6, PB = 10.4;
        C.prop(pergola(), PA, PB, fw(1, 0));
        const tb = L.table(1.8, 0.8, { things: false, top: 0x8a6a45 }); tb.add(cyl(0.07, 0.09, 0.24, 7, 0x7a1424, 0.1, 0.86, 0.05)); tb.add(cyl(0.025, 0.035, 0.1, 5, 0xd8dcdc, 0.1, 1.02, 0.05));
        for (const [x, z] of [[-0.5, 0.2], [0.55, -0.15], [-0.15, -0.22]]) tb.add(cyl(0.03, 0.022, 0.08, 6, 0x7a1424, x, 0.8, z));
        C.prop(tb, PA, PB, fw(1, 0));
        C.prop(L.bench(0x8a6a45), PA, PB + 0.72, [0, -1]); C.prop(L.bench(0x8a6a45), PA, PB - 0.72, [0, 1]);
        C.man(old(), { act: { a: PA - 0.4, b: PB + 0.72, pose: 'sitDrink', face: [0, -1], hold: [['balin_glass', 1]] }, bliza: { look: 'car' }, run: false,
          fence: { a: PA - 0.4, b: PB + 0.72, pose: 'l3_sitWave', face: [0, -1], hold: [['balin_glass', 1]], look: 'car' } });
        C.man(Object.assign(old(), { hat: null, hair: 'bald', hairCol: 0x9a9a98 }), { act: { a: PA + 0.45, b: PB + 0.72, pose: 'sitLean', face: [0, -1] }, bliza: { pose: 'sit', look: 'car' }, run: false,
          fence: { a: PA + 0.45, b: PB + 0.72, pose: 'sit', face: [0, -1], look: 'car' } });
        C.man(old(), { act: { a: PA + 0.2, b: PB - 0.72, pose: 'sitLean', face: [0, 1] }, bliza: { look: 'car' }, run: false, fence: { a: PA + 0.2, b: PB - 0.72, pose: 'l3_sitWave', face: [0, 1], look: 'car' } });
        // the chalk board for the score (tally strokes, no writing), a bicycle against a post
        const sb = grp(bar([-0.3, 0, 0], [-0.3, 1.5, 0], 0.04, 0x6b4a2e), bar([0.3, 0, 0], [0.3, 1.5, 0], 0.04, 0x6b4a2e), box(0.72, 0.5, 0.03, 0x2a3a2e, 0, 1.3, 0.02));
        for (let k = 0; k < 7; k++) sb.add(box(0.012, 0.12, 0.034, 0xeeeee8, (k < 4 ? -0.24 : 0.08) + (k % 4) * 0.045, 1.38 - (k < 4 ? 0 : 0.18), 0.022, { basic: true }));
        C.prop(sb, 4.4, 7.5, [-0.2, -1]);
        C.prop(L.bike(pick([0x2f63c9, 0xd8262a, 0x2a2c31])), PA - 2.35, PB - 1.55, fw(1, -0.15));
      } };
  }

  /* 5 · Šah v parku (no place yet: no garden chess by a track): a paved square with a garden chessboard (8 x 8 tiles of half a metre) and its knee-high pieces in the
     middle of a game, the taken ones lined up beside it; one player stands at the board's edge, his hand at his chin, the other carries her
     knight across to its square; two old men watch from the far side, one pointing at the move he would make; another reads his paper on a
     bench; a lamp, a bin, low shrubs, the chest the pieces are kept in. As the car comes the two watching walk to the fence; the players and
     the reader look up */
  {
    const LT = 0xe9e4d6, DT = 0x3d3936, WP = 0xf0eee6, BP = 0x2a2b30, PAVE = 0x9a9488, EDGE = 0x77726a;
    // a garden chessman (a pawn 0.46 m … the king 0.9 m): a turned foot, its body, its head; the knight a horse's head, muzzle forwards (+z)
    function piece(k, col) { const g = grp(cyl(0.16, 0.19, 0.08, 7, col, 0, 0.04, 0)), H = { p: 0.46, r: 0.55, n: 0.6, b: 0.7, q: 0.82, k: 0.9 }[k];
      if (k === 'n') { g.add(cyl(0.1, 0.14, 0.26, 7, col, 0, 0.2, 0)); g.add(box(0.13, 0.32, 0.2, col, 0, 0.44, 0.0, { rx: -0.25 })); g.add(box(0.12, 0.11, 0.24, col, 0, 0.55, 0.11, { rx: 0.45 })); g.add(box(0.03, 0.08, 0.05, col, 0.04, 0.63, -0.02)); return g; }
      g.add(cyl(k === 'r' ? 0.12 : 0.07, 0.13, H * 0.62, 7, col, 0, 0.08 + H * 0.31, 0));
      if (k === 'p') g.add(sph(0.1, 7, 4, col, 0, H - 0.09, 0));
      else if (k === 'r') { g.add(cyl(0.155, 0.14, 0.13, 7, col, 0, H - 0.12, 0)); for (let q = 0; q < 4; q++) g.add(box(0.07, 0.07, 0.07, col, 0.11 * Math.cos(q * PI2 + 0.78), H - 0.02, 0.11 * Math.sin(q * PI2 + 0.78))); }
      else if (k === 'b') { g.add(sph(0.1, 7, 4, col, 0, H - 0.17, 0, { s: [1, 1.5, 1] })); g.add(sph(0.035, 5, 3, col, 0, H - 0.02, 0)); }
      else if (k === 'q') { g.add(cyl(0.13, 0.07, 0.15, 7, col, 0, H - 0.15, 0)); for (let q = 0; q < 6; q++) g.add(box(0.04, 0.06, 0.04, col, 0.1 * Math.cos(q * TAU / 6), H - 0.04, 0.1 * Math.sin(q * TAU / 6))); }
      else { g.add(cyl(0.12, 0.07, 0.15, 7, col, 0, H - 0.25, 0)); g.add(box(0.05, 0.17, 0.05, col, 0, H - 0.08, 0)); g.add(box(0.14, 0.05, 0.05, col, 0, H - 0.1, 0)); }
      return g; }
    // the black knight carried before her in both hands (the forearms forwards and up, th 1.8): upright between the hands
    ITEMX.sah_piece = (o) => { const p = piece(o.k || 'n', o.c != null ? o.c : BP); p.position.set(0.13, -0.22, 0.1); p.rotation.y = 0.4; return inHand(1.8, p); };
    // the paper held open before the face on the bench (th 2.25); in the lap (th 1.25) it lies on it, as the pose drops
    ITEMX.sah_paper = () => inHand(2.25, box(0.56, 0.38, 0.006, 0xe8e6de, 0.2, 0.1, 0.08), box(0.012, 0.38, 0.008, 0xb8b6ae, 0.2, 0.1, 0.081), box(0.2, 0.06, 0.008, 0x8a8a86, 0.06, 0.22, 0.082));
    // the hand at the chin, the other arm across the waist; reading the paper (both hands up before the face)
    POSEX.sah_think = (t, s) => ({ shz: [0.25, 0.2], shx: [0.55, 0.35], el: [1.6, 2.35], shy: [-0.8, -0.5], nod: 0.28, tw: 0.05 * s, hpz: [0.05, 0.05] });
    POSEX.sah_read = (t, s) => ({ hy: 0.5, hp: [1.5, 1.5], kn: [1.5, 1.5], lean: -0.04, shz: [0.25, 0.25], shx: [1.1, 1.1], el: [1.15, 1.15], shy: [-0.35, -0.35], nod: 0.12, look: 0.06 * s });
    Object.assign(MOTION, { sah_think: { rate: 0.4 }, sah_read: { rate: 0.3 } });
    // the game: [file 0-7 (across, b), rank 0-7 (along, a: white at -a), piece, white?]
    const GAME = [[0, 0, 'r', 1], [5, 0, 'r', 1], [6, 0, 'k', 1], [3, 1, 'q', 1], [0, 1, 'p', 1], [1, 1, 'p', 1], [5, 1, 'p', 1], [6, 1, 'p', 1], [2, 2, 'p', 1], [5, 2, 'n', 1], [4, 2, 'b', 1], [7, 2, 'p', 1], [3, 3, 'p', 1],
      [0, 7, 'r', 0], [4, 7, 'r', 0], [6, 7, 'k', 0], [3, 6, 'q', 0], [0, 6, 'p', 0], [5, 6, 'p', 0], [6, 6, 'p', 0], [1, 5, 'p', 0], [7, 5, 'p', 0], [4, 5, 'b', 0], [2, 4, 'p', 0], [4, 4, 'p', 0]];

    S.sah = { seed: 401, clear: [[0.6, 7.2, 7.5], [-4.2, 10.6, 3.2], [4.8, 10.6, 3.2]],
      build(C, F, K) {
        const fw = fwOf(F), CA = 0.6, CB = 7.3, T = 0.55, A = (r) => CA + (r - 3.5) * T, B = (f) => CB + (f - 3.5) * T;
        const light = [], dark = [];
        for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) { const a0 = A(r) - T / 2, b0 = B(f) - T / 2; ((r + f) % 2 ? light : dark).push([[a0, b0, 0.034], [a0 + T, b0, 0.034], [a0 + T, b0 + T, 0.034]], [[a0, b0, 0.034], [a0 + T, b0 + T, 0.034], [a0, b0 + T, 0.034]]); }
        ground(C, F, CA, CB, [{ col: PAVE, tris: rectTris(CA - 5.4, CA + 5.4, 3.0, 11.6, 0.016, 1.8) }, { col: EDGE, tris: rectTris(CA - 2.5, CA + 2.5, CB - 2.5, CB + 2.5, 0.026, 1.25) }, { col: LT, tris: light }, { col: DT, tris: dark }]);
        for (const [f, r, k, w] of GAME) C.prop(piece(k, w ? WP : BP), A(r), B(f), [w ? 1 : -1, 0]);
        for (const [i, k, w] of [[0, 'p', 1], [1, 'p', 1], [2, 'n', 1], [3, 'b', 1], [5, 'p', 0], [6, 'p', 0], [7, 'n', 0], [8, 'r', 0]]) C.prop(piece(k, w ? WP : BP), CA - 2.2 + i * 0.55, CB + 2.95, [0, -1]);
        // the players: white at its rank 1 side thinking, black carrying her knight
        C.man({ shirt: pick([0x31406e, 0x7c4a2e, 0x8a9aa8]), pants: 0x47494f, long: true, hair: 'short', hairCol: 0xb8b8b4 }, { act: { a: A(-0.9), b: CB + 0.35, pose: 'sah_think', face: [1, 0] },
          bliza: { look: 'car' }, run: false, fence: { a: A(-0.9), b: CB + 0.35, pose: 'sah_think', face: [1, 0], look: 'car' } });
        C.man({ shirt: pick([0xd23a2c, 0x22848f, 0xf0c22e]), pants: 0x2f3f63, hair: pick(['long', 'pony']) }, { act: { a: A(5.0), b: B(2.9), pose: 'carry', face: [-0.6, -0.8], hold: [['sah_piece', 1, { k: 'n' }]] },
          bliza: { look: 'car' }, run: false, fence: { a: A(5.0), b: B(2.9), pose: 'carry', face: [-0.6, -0.8], hold: [['sah_piece', 1, { k: 'n' }]], look: 'car' } });
        // the two watching from its far side, the reader on his bench
        C.man({ shirt: pick([0xefefea, 0xb8bcc4, 0x5a6a3a]), pants: pick(pal.PANTS), hat: 'flat', hatCol: 0x47494f, scale: 0.94 }, { act: { a: A(2.2), b: CB + 2.55, pose: 'arms', face: [0.15, -1] },
          run: { f: 0.65, pose: 'walk' }, fence: { a: A(1.8), b: 0.9, pose: 'fence', look: 'car' } });
        C.man({ shirt: pick([0x7c8a99, 0x8a3b8c, 0x2f9a48]), pants: pick(pal.PANTS), long: true, hair: 'bald', hairCol: 0x9a9a98, scale: 0.93 }, { act: { a: A(4.2), b: CB + 2.5, pose: 'point', face: [-0.3, -1] },
          run: { f: 0.75, pose: 'walk' }, fence: { a: A(3.6), b: 0.9, pose: 'fenceWave', look: 'car' } });
        C.prop(L.bench(0x6b4a2e), CA - 4.4, 10.7, [0.2, -1]); C.prop(L.bench(0x6b4a2e), CA + 4.3, 10.7, [-0.2, -1]);
        C.man({ shirt: pick([0x5b5040, 0x31406e]), pants: 0x47494f, long: true, hat: 'flat', hatCol: 0x5b5040, scale: 0.93 }, { act: { a: CA - 4.6, b: 10.7, pose: 'sah_read', face: [0.2, -1], hold: [['sah_paper', 1]] },
          bliza: { pose: 'sit', look: 'car' }, run: false, fence: { a: CA - 4.6, b: 10.7, pose: 'sit', face: [0.2, -1], hold: [['sah_paper', 1]], look: 'car' } });
        // a lamp, a bin, the chest for the pieces, low shrubs at the square's corners
        C.prop(grp(cyl(0.06, 0.08, 3.4, 6, 0x2a3a2e, 0, 1.7, 0), box(0.3, 0.42, 0.3, 0x2a3a2e, 0, 3.55, 0), box(0.24, 0.3, 0.24, 0xe8e2c4, 0, 3.52, 0), cyl(0.02, 0.2, 0.14, 6, 0x2a3a2e, 0, 3.83, 0)), CA - 5.0, 3.6);
        C.prop(L.bin(0x2a5a3a), CA + 5.0, 3.7);
        C.prop(grp(box(1.1, 0.55, 0.55, 0x7a5232, 0, 0.275, 0), box(1.14, 0.06, 0.59, 0x5a3a22, 0, 0.58, 0)), CA + 4.1, CB, fw(0, 1));
        for (const [a, b] of [[CA - 5.2, 11.4], [CA + 5.3, 11.3], [CA + 5.2, 5.6]]) C.prop(grp(sph(0.7, 7, 3, 0x3d6a2e, 0, 0, 0, { half: true, s: [1, 0.9, 1] }), sph(0.5, 6, 3, 0x4a7a34, 0.45, 0, 0.2, { half: true })), a, b, rnd() * TAU);
      } };
  }

  /* 6 · Rojstni dan (Longford): a child's birthday on the lawn: a bouncy castle (towers, net walls), three children
     jumping in it; a table with a pink cloth, the cake and its candles, plates, cups, juice, presents beside it; bunches of balloons, a line
     of bunting from the castle to a pole; the father at the grill, the mother filming the castle, the grandfather in a chair with his coffee;
     two more children in party hats, balloons on strings. As the car comes the two run to the fence with their balloons and wave; the ones in
     the castle go on jumping and look; the father waves his tongs, the grandfather from his chair. The other parents: three at their own
     table under a gazebo (drinks by it), two by the castle with a pram, their cars at the back */
  {
    const BAL = [0xd8262a, 0xf0c22e, 0x2f63c9, 0x2f9a48, 0xe85a9a, 0xf07a1c, 0x8a3b8c, 0x5ab0e8];
    // a balloon on its string: held in a hanging hand (th 0.2: the string up); running with it (th 1.45)
    const balloon = (th, c) => inHand(th, bar([0, 0.0, 0.02], [0.05, 1.05, 0.1], 0.006, 0xe8e8e8), sph(0.16, 7, 5, c, 0.05, 1.2, 0.1, { s: [1, 1.18, 1] }), sph(0.025, 4, 3, c, 0.05, 1.02, 0.1));
    ITEMX.rojstni_balloon = (o) => balloon(0.2, o.c || BAL[0]);
    ITEMX.rojstni_balloonR = (o) => balloon(1.45, o.c || BAL[0]);
    // jumping high on the castle's floor, the arms flying
    POSEX.rojstni_hop = (t, s) => { const u = Math.abs(s); return { shz: [0.6 + 1.6 * u, 0.6 + 1.6 * u], shx: [0.3, 0.3], el: [0.4, 0.4], hp: [0.5 * (1 - u), 0.5 * (1 - u)], kn: [0.9 * (1 - u), 0.9 * (1 - u)], hy: 0.92 - 0.12 * (1 - u), dy: 0.45 * u }; };
    MOTION.rojstni_hop = { rate: 4.6 }; RATE.rojstni_hop = 4.6;
    // the castle, 3.6 m square, its open front +z: the base, the floor at 0.5, net walls in puffed frames on three sides, four towers, the arch
    function castle() { const g = grp(), R = 0xd8262a, Bl = 0x2f63c9, Y = 0xf0c22e, G = 0x2f9a48, NET = 0x343a44, h = 1.62;
      g.add(box(3.6, 0.42, 3.6, R, 0, 0.21, 0)); for (const z of [1.8, -1.8]) g.add(cyl(0.21, 0.21, 3.6, 8, R, 0, 0.24, z, { rz: PI2 })); for (const x of [1.8, -1.8]) g.add(cyl(0.21, 0.21, 3.6, 8, R, x, 0.24, 0, { rx: PI2 }));
      g.add(box(3.3, 0.08, 3.3, Bl, 0, 0.46, 0));
      g.add(box(3.0, 1.05, 0.04, NET, 0, 1.0, -h)); g.add(cyl(0.17, 0.17, 3.0, 8, Y, 0, 1.58, -h, { rz: PI2 })); g.add(cyl(0.16, 0.16, 1.1, 7, Y, 0, 1.0, -h));
      for (const x of [h, -h]) { g.add(box(0.04, 1.05, 3.0, NET, x, 1.0, 0)); g.add(cyl(0.17, 0.17, 3.0, 8, Y, x, 1.58, 0, { rx: PI2 })); g.add(cyl(0.16, 0.16, 1.1, 7, Y, x, 1.0, 0)); }
      [[h, h, R], [-h, h, Bl], [h, -h, Bl], [-h, -h, R]].forEach(([x, z, c]) => { g.add(cyl(0.3, 0.3, 2.3, 8, c, x, 1.57, z)); g.add(sph(0.32, 8, 5, Y, x, 2.75, z)); g.add(cyl(0.01, 0.2, 0.42, 8, G, x, 3.18, z)); });
      g.add(cyl(0.22, 0.22, 3.0, 8, Bl, 0, 2.5, h, { rz: PI2 })); for (const x of [-0.9, 0, 0.9]) g.add(box(0.36, 0.3, 0.3, Y, x, 2.82, h));
      g.add(box(3.0, 0.24, 0.6, R, 0, 0.12, 2.05)); g.add(box(0.5, 0.4, 0.4, 0x2a2c31, 2.4, 0.2, -1.4)); g.add(bar([2.2, 0.25, -1.4], [1.8, 0.3, -1.2], 0.12, 0x2a2c31));   // (the step, the blower and its tube)
      return g; }
    // a bunch of balloons on strings from one point (h: their height)
    function bunch(n, h, s0) { const g = grp(); for (let k = 0; k < n; k++) { const t = k / n * TAU + s0, r = 0.18 + 0.08 * (k % 2), x = r * Math.cos(t), z = r * Math.sin(t), y = h + 0.18 * ((k * 7) % 3), c = BAL[(k * 3 + Math.round(s0 * 5)) % BAL.length];
      g.add(bar([0, 0, 0], [x, y - 0.17, z], 0.006, 0xe8e8e8)); g.add(sph(0.17, 7, 5, c, x, y, z, { s: [1, 1.18, 1] })); } return g; }
    function present(c, rib) { return grp(box(0.32, 0.26, 0.32, c, 0, 0.13, 0), box(0.33, 0.27, 0.05, rib, 0, 0.13, 0), box(0.05, 0.27, 0.33, rib, 0, 0.13, 0), box(0.12, 0.06, 0.04, rib, 0.04, 0.29, 0, { rz: 0.5 }), box(0.12, 0.06, 0.04, rib, -0.04, 0.29, 0, { rz: -0.5 })); }

    // a pram: its body and hood, the handle, four wheels (its handle +x)
    function pram(col) { const g = grp(), DK = 0x2a2c31;
      g.add(box(0.72, 0.3, 0.44, col, 0, 0.56, 0)); g.add(sph(0.26, 7, 4, shade(col, 0.82), -0.2, 0.68, 0, { half: true, s: [0.95, 1, 0.85], rz: 0.35 }));
      for (const z of [0.2, -0.2]) { g.add(bar([0.32, 0.62, z], [0.6, 1.02, z], 0.025, DK)); g.add(bar([-0.28, 0.13, z], [0.3, 0.45, z], 0.02, DK)); g.add(bar([0.28, 0.13, z], [-0.25, 0.45, z], 0.02, DK)); }
      g.add(bar([0.6, 1.02, 0.22], [0.6, 1.02, -0.22], 0.03, DK));
      for (const x of [0.28, -0.28]) for (const z of [0.22, -0.22]) g.add(cyl(0.12, 0.12, 0.04, 8, DK, x, 0.12, z, { rx: PI2 }));
      return g; }

    S.rojstnidan = { seed: 419, clear: [[0.4, 7.4, 8.5], [-5.6, 7.6, 3.5], [-9.1, 9.6, 4.2], [7.8, 7.4, 3.2], [-6.2, 13.3, 3], [10.2, 12.7, 3]],
      build(C, F, K) {
        const fw = fwOf(F), CA = 3.9, CB = 9.1;
        C.prop(castle(), CA, CB, null, 'bc');
        for (const [x, z, t] of [[-0.85, -0.55, 0], [0.75, 0.25, 0.9], [0.05, -1.0, 1.9]]) C.man({ kid: true, shirt: pick(BAL), pants: pick([0x2f3f63, 0xe85a9a, 0x2a2c31]), shorts: true, hair: pick(['short', 'pony', 'long']) },
          { act: { on: 'bc', a: x, b: z, y: 0.5, pose: 'rojstni_hop', t }, bliza: { look: 'car' }, run: false, fence: { on: 'bc', a: x, b: z, y: 0.5, pose: 'rojstni_hop', t, look: 'car' }, kid: true });
        // the table: its cloth, the cake (two tiers, five candles burning), plates, cups, the juice; the presents by it
        const TA = -2.6, TB = 6.1, tb = L.table(2.0, 0.8, { things: false, top: 0xf6c6d6 });
        tb.add(box(2.04, 0.2, 0.84, 0xf6c6d6, 0, 0.64, 0));
        tb.add(cyl(0.17, 0.17, 0.12, 9, 0xf4f0e6, 0, 0.8, 0)); tb.add(cyl(0.12, 0.12, 0.1, 9, 0xf0a8c8, 0, 0.91, 0));
        for (let k = 0; k < 5; k++) { const t = k / 5 * TAU, x = 0.07 * Math.cos(t), z = 0.07 * Math.sin(t); tb.add(cyl(0.008, 0.008, 0.07, 4, BAL[k], x, 1.0, z)); tb.add(box(0.014, 0.03, 0.014, 0xffd23a, x, 1.05, z, { basic: true })); }
        for (const x of [-0.75, -0.4, 0.4, 0.75]) { tb.add(cyl(0.1, 0.09, 0.015, 7, 0xf4f4f0, x, 0.75, 0.2)); tb.add(cyl(0.035, 0.03, 0.09, 6, BAL[Math.floor((x + 1) * 3) % 8], x + 0.1, 0.79, -0.15)); }
        for (const x of [-0.55, 0.62]) tb.add(cyl(0.04, 0.04, 0.26, 6, x < 0 ? 0xf07a1c : 0xd8262a, x, 0.87, -0.05));
        tb.add(sph(0.13, 7, 3, 0x2f63c9, -0.2, 0.74, -0.18, { half: true, rx: Math.PI, s: [1, 0.6, 1] })); tb.add(box(0.18, 0.03, 0.18, 0xf0d070, -0.2, 0.76, -0.18));
        C.prop(tb, TA, TB, [0, -1]);
        for (const [da, db, c, r] of [[-1.3, 0.2, 0x2f63c9, 0xf0c22e], [-1.5, 0.75, 0xe85a9a, 0xf2f2f2], [1.25, 0.6, 0x2f9a48, 0xd8262a]]) C.prop(present(c, r), TA + da, TB + db, rnd());
        for (const [da, n, h, s0] of [[-0.95, 5, 1.25, 0.3], [0.95, 4, 1.1, 1.7]]) { const bb = bunch(n, h, s0); bb.position.y = 0.76; C.prop(grp(bb), TA + da, TB - 0.36); }   // (tied to the table's corners)
        // bunting from the castle's front tower to a pole by the table; balloons on the castle's front
        const pole = [TA + 1.45, TB + 1.25], tw = [CA - 1.62, CB - 1.62];
        C.prop(grp(cyl(0.04, 0.05, 2.5, 5, 0xdedede, 0, 1.25, 0)), pole[0], pole[1]);
        inWorld(C, F, pole[0], pole[1], (g, W) => { const P1 = W(pole[0], pole[1], 2.45), P2 = W(tw[0], tw[1], 2.3), n = 13, pt = (u) => [P1[0] + (P2[0] - P1[0]) * u, P1[1] + (P2[1] - P1[1]) * u - 0.45 * 4 * u * (1 - u), P1[2] + (P2[2] - P1[2]) * u];
          for (let k = 0; k < n; k++) { const u0 = k / n, u1 = (k + 0.8) / n, A1 = pt(u0), A2 = pt(u1), m = pt((u0 + u1) / 2); g.add(bar(A1, pt((k + 1) / n), 0.012, 0xe8e8e8));
            g.add(tri2(A1, A2, [m[0], m[1] - 0.26, m[2]], BAL[k % BAL.length])); } });
        for (const x of [-1.62, 1.62]) { const bb = bunch(3, 0.9, x); bb.position.set(x, 1.9, 1.95); const cg = grp(bb); C.prop(cg, CA, CB, null); }
        // the grown-ups: the father at the grill, the mother filming, the grandfather in his chair
        C.prop(L.grillKettle(), -5.6, 7.3);
        C.man({ shirt: pick([0x2f63c9, 0xefefea, 0x2f9a48]), pants: pick([0x5b5040, 0x2f3f63]), shorts: true, hat: 'cap', hatCol: pick([0xd8262a, 0x15171c]) }, { act: { a: -5.6, b: 7.95, pose: 'grill', face: [0, -1], hold: [['tongs', 1]] },
          bliza: { look: 'car' }, run: false, fence: { a: -5.6, b: 7.95, pose: 'wave', face: [0, -1], hold: [['tongs', 1]], look: 'car' } });
        C.man({ shirt: pick([0xe85a9a, 0x22848f, 0xf0c22e]), pants: 0x2f3f63, hair: pick(['long', 'pony']) }, { act: { a: 1.0, b: 6.55, pose: 'phoneUp', face: [0.65, 0.75], hold: [['phone', 1]] },
          bliza: { look: 'car' }, run: false, fence: { a: 1.0, b: 6.55, pose: 'phoneUp', face: [0.2, -1], hold: [['phone', 1]], look: 'car' } });
        C.prop(L.chair(pick([0x2f9a48, 0xd8262a, 0x2f63c9])), -4.1, 7.0, [0.4, -1]);
        C.man({ shirt: pick([0xb8bcc4, 0x7c8a99, 0xefefea]), pants: 0x47494f, long: true, hair: 'short', hairCol: 0xc8c8c4, scale: 0.93 }, { act: { a: -4.1, b: 7.0, pose: 'sitDrink', face: [0.4, -1], hold: [['cup', 1]] },
          bliza: { look: 'car' }, run: false, fence: { a: -4.1, b: 7.0, pose: 'l3_sitWave', face: [0.4, -1], hold: [['cup', 1]], look: 'car' } });
        // the other parents (the user, 4. 11. 2026: »če je otroški rojstni dan, potem je tukaj tudi veliko staršev in še ostali elementi za starše«):
        // three at their own table under a white gazebo, its bottles and plates, a cooler and crates of drinks by it; two by the castle with their
        // cups watching their children, a pram by them; their cars parked at the back. As the car comes those at the table wave from their
        // chairs; one by the castle walks after the children to the fence and stands there with her arms crossed, the other one waves
        const GA = -9.1, GB = 9.6;
        C.prop(L.gazebo(0xefefea, 3.2), GA, GB, [0, -1]);
        C.prop(L.table(1.6, 0.8), GA, GB, [0, -1]);
        C.prop(L.cooler(pick([0x2f63c9, 0xd8262a])), GA + 2.3, GB - 1.4, [1, -0.3]); C.prop(L.crates(4), GA - 2.0, GB - 1.2, [0.3, -1]);
        const look = () => ({ shirt: pick([0xefefea, 0x2f63c9, 0x7c8a99, 0x2f9a48, 0xb8bcc4, 0x8a3b8c, 0xf0c22e]), pants: pick([0x2f3f63, 0x47494f, 0x5b5040, 0xd8d2c0]) });
        for (const [a, b, fa, fb, wo] of [[GA - 0.45, GB + 0.62, 0, -1, 1], [GA + 0.45, GB + 0.62, 0, -1, 0], [GA - 1.12, GB, 1, -0.15, 1]]) {
          C.prop(L.chair(pick([0x2a2c31, 0x2f9a48, 0xd8262a])), a, b, [fa, fb]);
          C.man(Object.assign(look(), wo ? { hair: pick(['long', 'pony', 'long']) } : { hair: pick(['short', 'bald']) }), { act: { a, b, pose: wo ? 'sitDrink' : 'sit', face: [fa, fb], hold: wo ? [['cup', 1]] : [] },
            bliza: { look: 'car' }, run: false, fence: { a, b, pose: 'l3_sitWave', face: [fa, fb], hold: wo ? [['cup', 1]] : [], look: 'car' } }); }
        C.prop(pram(pick([0x2f3f63, 0x5a6a3a, 0x8a3b8c])), 8.6, 6.4, [1, 0.2]);
        C.man(Object.assign(look(), { hair: pick(['long', 'pony']) }), { act: { a: 7.3, b: 7.0, pose: 'talk', face: [-0.85, 0.5], hold: [['cup', 1]] },
          run: { f: 0.3, pose: 'walk', hold: [['cup', 1]] }, fence: { a: 1.5, b: 1.5, pose: 'arms', look: 'car' } });
        C.man(look(), { act: { a: 7.9, b: 8.1, pose: 'talk', face: [-1, -0.2], hold: [['cup', 1]] }, bliza: { look: 'car' }, run: false, fence: { a: 7.9, b: 8.1, pose: 'wave', hold: [['cup', 1]], look: 'car' } });
        const CARS = [0xb8bcc4, 0x2f3f63, 0x7c8a99, 0xd8d8d2, 0x8a2a24, 0x2f5a3a, 0x1d1f25];
        C.prop(L.car(pick(CARS)), -6.2, 13.3, fw(1, 0.05)); C.prop(L.car(pick(CARS)), 10.2, 12.7, fw(-1, 0.1));
        // the two in party hats with their balloons
        const k1 = pick(BAL), k2 = pick(BAL);
        C.man({ kid: true, shirt: pick(BAL), pants: 0x2f3f63, shorts: true, hat: 'party', hatCol: pick(BAL) }, { act: { a: -0.4, b: 5.0, pose: 'wave', face: [0.4, 1], hold: [['rojstni_balloon', 0, { c: k1 }]] },
          run: { f: 0.42, hold: [['rojstni_balloonR', 0, { c: k1 }]] }, fence: { a: -0.5, b: 0.9, pose: 'wave', hold: [['rojstni_balloon', 0, { c: k1 }]], look: 'car' }, kid: true });
        C.man({ kid: true, shirt: pick(BAL), pants: 0xe85a9a, shorts: true, hat: 'party', hatCol: pick(BAL) }, { act: { a: 0.3, b: 5.4, pose: 'talk', face: [-0.9, -0.2], hold: [['rojstni_balloon', 0, { c: k2 }]] },
          run: { f: 0.45, hold: [['rojstni_balloonR', 0, { c: k2 }]] }, fence: { a: 0.6, b: 0.9, pose: 'wave', hold: [['rojstni_balloon', 0, { c: k2 }]], look: 'car' }, kid: true });
      } };
  }

  // their places: where they are in reality (the user, 4. 11. 2026: »postavi samo tam, kjer je tudi v resnici«; OSM): the anglers on the
  // shores of Zbiljsko jezero (Medvode) and of the lake by Ouni (Ouninpohja: the track's own lake, def.lakes), lake: its shore's metres beyond
  // the barrier; the hay on a mown meadow (Vršič: OSM's meadow by the road; Ouninpohja: a field, def.fields); the bocce and the chess have
  // no place: no court or board by any of the tracks (Medvode, Livorno: none within 200 m of the road); the beekeepers and the birthdays
  // where they were (tools/ljudje/mesta.mjs: flat, seen from the chase camera, 250 m from the other groups)
  site('medvode', [['cebelarji', 2144, -1], ['ribici', 3651, 1, { lake: 19.5 }]]);   // (Medvode: the anglers moved with the road at real width, #153: the same shore of Zbilje lake, its barrier further out)
  for (const n of ['ribici', 'seno', 'cebelarji', 'balinanje', 'sah', 'rojstnidan']) { SUMMER.add(n); BUSY_HANDS.add(n); }   // (a summer's day's; their hands full: no umbrellas)
})();
