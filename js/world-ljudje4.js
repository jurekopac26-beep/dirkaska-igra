/* =========================================================================
   LJUDJE OB PROGI 4: pet večjih skupin gledalcev z rekviziti (izbira uporabnika 17. in 18. 11. 2026,
   docs/ljudje-predlogi.md, »Skupine gledalcev in dejavnosti v ozadju v slikah«): osem starodobnikov,
   iz prtljažnikov in kesonov, na hlodih, terasa na zabojnikih, balon na vroč zrak.
   Po ena skupina na vsaki pravi progi, ki ni dirkališče (SITES spodaj, mesta iz tools/ljudje/mesta.mjs).
   Sledi gum od ceste do vozil, fotografi (osebje) na zabojnikih in ob ograji, balon ~40 m od ceste.
   Na World.peopleKit kot js/world-ljudje3.js; brez imen, napisov in znamk.
   ========================================================================= */
(function () {
  'use strict';
  const K = World.peopleKit; if (!K) return;
  const { S, L, ITEMX, POSEX, MOTION, RATE, SITES, STAFF_SCENES, HATX, rnd, pick, box, cyl, sph, grp, bar, pal } = K;
  const site = (id, list) => { (SITES[id] || (SITES[id] = [])).push(...list); };
    const TAU = Math.PI * 2, PI2 = Math.PI / 2, TYRE = 0x16171a;
    const MAT = new Map(), lamOf = (c) => { let m = MAT.get(c); if (!m) MAT.set(c, m = new THREE.MeshLambertMaterial({ color: c })); return m; };
    const shade = (c, f) => (Math.min(255, Math.round(((c >> 16) & 255) * f)) << 16) | (Math.min(255, Math.round(((c >> 8) & 255) * f)) << 8) | Math.min(255, Math.round((c & 255) * f));
    const tri2 = (A, B, C3, col) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...A, ...B, ...C3, ...A, ...C3, ...B], 3)); return new THREE.Mesh(g, lamOf(col)); };
    const quad2 = (A, B, C3, D, col) => grp(tri2(A, B, C3, col), tri2(A, C3, D, col));
    const smokeAt = (n, h, col, op, spread, x, y, z) => { const o = new THREE.Object3D(); o.userData.smoke = { n, h, col, op, spread }; o.position.set(x || 0, y || 0, z || 0); return o; };
    const wheelX = (r, w, x, y, z, hub) => grp(cyl(r, r, w, 12, TYRE, x, y, z, { rz: PI2 }), cyl(r * 0.52, r * 0.52, w + 0.03, 8, hub || 0xb9bec6, x, y, z, { rz: PI2 }));   // (its axle along x)
    const wheelZ = (r, w, x, y, z, hub) => grp(cyl(r, r, w, 12, TYRE, x, y, z, { rx: PI2 }), cyl(r * 0.52, r * 0.52, w + 0.03, 8, hub || 0xb9bec6, x, y, z, { rx: PI2 }));   // (its axle along z)
    const at = (g, x, y, z, ry) => { g.position.set(x || 0, y || 0, z || 0); if (ry) g.rotation.y = ry; return g; };
    const P_ = (base, extra) => Object.assign({}, base, extra);
    // a line of little flags from A to B (it sags), in the colours
    function bunting(A, B, cols, sag, step) {
      const g = grp(), L0 = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]), n = Math.max(2, Math.round(L0 / (step || 0.4)));
      const Pt = (u) => [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u - (sag == null ? 0.25 : sag) * 4 * u * (1 - u), A[2] + (B[2] - A[2]) * u];
      for (let k = 0; k < n; k++) { const p = Pt(k / n), q = Pt((k + 1) / n); g.add(bar(p, q, 0.014, 0x3a3d42)); g.add(tri2(p, q, [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2 - 0.3, (p[2] + q[2]) / 2], cols[k % cols.length])); }
      return g;
    }
    const BUNT = [0xd8262a, 0xf2c21a, 0x2f63c9, 0xf2f2ee, 0x2f9a48];
    const SITB = { hy: 0.5, hp: [1.5, 1.5], kn: [1.5, 1.5] };
    // sitting and watching: a wave, both arms up, pointing, a flag waved, binoculars (on the head: at the eyes)
    POSEX.m_sitWave = (t, s) => P_(SITB, { lean: -0.05, shz: [0.12, 2.35 + 0.25 * s], shx: [0.35, 0.2], el: [0.9, 0.55] });
    POSEX.m_sitCheer = (t, s) => P_(SITB, { lean: -0.08, shz: [2.5 + 0.1 * s, 2.55 - 0.1 * s], shx: [0.25, 0.25], el: [0.3, 0.35] });
    POSEX.m_sitPoint = () => P_(SITB, { lean: 0.05, shz: [0.12, 0.3], shx: [0.35, 1.4], el: [0.9, 0.1] });
    POSEX.m_sitFlagWave = (t, s) => P_(SITB, { lean: -0.03, shz: [0.12, 2.0 + 0.4 * s], shx: [0.35, 0.6], el: [0.9, 0.45] });
    POSEX.m_sitDalj = () => P_(SITB, { lean: 0.02, shz: [0.3, 0.3], shx: [1.35, 1.35], el: [1.75, 1.75], shy: [-0.4, -0.4] });
    POSEX.m_dalj = () => ({ shz: [0.3, 0.3], shx: [1.35, 1.35], el: [1.75, 1.75], shy: [-0.4, -0.4] });
    ITEMX.m_dalj = () => grp(cyl(0.032, 0.036, 0.13, 6, 0x15171c, 0.036, -0.012, 0.03, { rx: PI2 }), cyl(0.032, 0.036, 0.13, 6, 0x15171c, -0.036, -0.012, 0.03, { rx: PI2 }), box(0.05, 0.03, 0.05, 0x2a2c31, 0, -0.012, 0));
    Object.assign(RATE, { m_sitWave: 7.5, m_sitCheer: 6.5, m_sitFlagWave: 6.5 });
    POSEX.m_sitNazdrav = (t, s) => P_(SITB, { lean: -0.04, shz: [0.12, 0.45], shx: [0.35, 2.25 + 0.12 * s], el: [0.9, 0.3] });
    Object.assign(RATE, { m_sitNazdrav: 5 });
    const strip = (x, w, y1, z1, y2, z2, col, t) => { const dy = y2 - y1, dz = z2 - z1; return box(w, t || 0.04, Math.hypot(dy, dz) + 0.02, col, x, (y1 + y2) / 2, (z1 + z2) / 2, { rx: -Math.atan2(dy, dz) }); };
    // flat shapes on the ground in the scene's frame (as js/world-ljudje3.js): a prop at a0, b0 whose child undoes its place
    const _M = new THREE.Matrix4(), _P = new THREE.Vector3(), _Q = new THREE.Quaternion(), _E = new THREE.Euler(), _S1 = new THREE.Vector3(1, 1, 1);
    function ground(C, F, a0, b0, parts) {
      const [x0, z0] = F.w(a0, b0), inner = grp(), g = grp(inner);
      _M.compose(_P.set(x0, F.y(a0, b0), z0), _Q.setFromEuler(_E.set(0, C.yawOf(null), 0)), _S1); inner.matrixAutoUpdate = false; inner.matrix.copy(_M).invert();
      const W = (a, b, h) => { const [x, z] = F.w(a, b); return [x, F.y(a, b) + (h || 0), z]; };
      for (const { col, tris } of parts) { const P = [];
        for (const t of tris) { const w = t.map(([a, b, dy]) => W(a, b, dy)), ux = w[1][0] - w[0][0], uz = w[1][2] - w[0][2], vx = w[2][0] - w[0][0], vz = w[2][2] - w[0][2];
          if (uz * vx - ux * vz < 0) { const q = w[1]; w[1] = w[2]; w[2] = q; } P.push(...w[0], ...w[1], ...w[2]); }
        if (!P.length) continue; const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); inner.add(new THREE.Mesh(geo, lamOf(col))); }
      C.prop(g, a0, b0, null);
    }
    // the tyre tracks of the vehicles that drove in from the field's gate (ea, eb in the frame) to where they stand: each vehicle [a, b, dir (its +z,
    // null: to the road), the local z of its axle nearer the road, its half track, its wheelbase]; they came in nose or tail first along their axis
    // (the curve ends straight under the car, to its far axle); two shades of pressed earth, one mesh each
    const RUT = 0x5d5440, RUT2 = 0x6e6650;
    function ruts(C, F, ea, eb, list) {
      const t1 = [], t2 = [];
      list.forEach(([a, b, dir, zw, hw, wb], k) => {
        let ua = dir ? dir[0] : 0, ub = dir ? dir[1] : -1; const n = Math.hypot(ua, ub) || 1; ua /= n; ub /= n;
        const la = -ub, lb = ua, ta = a + ua * zw, tb = b + ub * zw;
        for (const s of [-hw, hw]) {
          const Wa = ta + la * s, Wb = tb + lb * s, d = Math.max(0.6, Wb - eb) * 0.8, P0 = [ea + s * 0.6 + (k % 3 - 1) * 0.35, eb + (k % 2) * 0.3], P1 = [Wa + ua * d, Wb + ub * d], P2 = [Wa - ua * (wb + 0.3), Wb - ub * (wb + 0.3)];
          const pt = (t) => { const u = 1 - t; return [u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0], u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1]]; };
          const N = 12, out = (k + (s > 0 ? 1 : 0)) % 2 ? t2 : t1; let prev = null;
          for (let i = 0; i <= N; i++) { const p = pt(i / N), q = pt(Math.min(1, i / N + 0.02)), r = pt(Math.max(0, i / N - 0.02)), ga = q[0] - r[0], gb = q[1] - r[1], gl = Math.hypot(ga, gb) || 1,
            w = 0.12 + 0.03 * Math.sin(i * 1.7 + k), na = -gb / gl * w, nb = ga / gl * w, Lp = [p[0] + na, p[1] + nb, 0.03], Rp = [p[0] - na, p[1] - nb, 0.03];
            if (prev) out.push([prev[0], prev[1], Rp], [prev[0], Rp, Lp]); prev = [Lp, Rp]; }
        }
      });
      ground(C, F, 0, 1, [{ col: RUT, tris: t1 }, { col: RUT2, tris: t2 }]);
    }
    ITEMX.m_krpa = () => grp(box(0.13, 0.04, 0.17, 0xf0c22e, 0, -0.04, 0.03));
    POSEX.m_vozi = (t, s) => P_(SITB, { lean: 0.04, shz: [0.15, 0.15], shx: [1.05, 1.05], el: [0.45, 0.45], shy: [-0.2, -0.2], tw: 0.06 * s });
    Object.assign(MOTION, { m_vozi: { rate: 1.6 } });
    POSEX.m_tlaCheer = (t, s) => ({ hy: 0.14, hp: [1.45, 1.45], kn: [0.25, 0.25], lean: -0.05, shz: [2.5 + 0.1 * s, 2.55 - 0.1 * s], shx: [0.25, 0.25], el: [0.3, 0.35] });
    Object.assign(RATE, { m_tlaCheer: 6.5 });
    const NEAR = { look: 'car' }, SK = pal.SKIN, X = (...o) => Object.assign({}, ...o);
    const SH = [0xd23a2c, 0xf0c22e, 0x2f63c9, 0x2f9a48, 0xefefea, 0x8a3b8c, 0xf07a1c, 0x22848f, 0x262a33, 0xb8bcc4, 0xd8a8c8, 0x7c4a2e, 0x4a78b0, 0xe6d3a0, 0x2f5a3a];
    const PA = [0x2f3f63, 0x1d1f25, 0x47494f, 0x5b5040, 0x3a4a3a, 0x31406e, 0x8a3b3b, 0xcfc6ad];
    const HR = ['short', 'long', 'pony', 'short', 'bald', 'long', 'short', 'pony'];
    const HT = [null, ['cap', 0xefefea], null, ['straw', 0xd8c08a], null, ['cap', 0xd23a2c], ['flat', 0x6a6f78], null, ['bucket', 0xe6d3a0], null, ['cap', 0x2f63c9]];
    // a varied look by a number (the same number: the same look)
    const lk = (i, o) => { const h = HT[i % HT.length], kid = o && o.kid;
      return X({ shirt: SH[i % SH.length], pants: PA[(i * 3 + 1) % PA.length], hair: HR[(i * 5 + 2) % HR.length] }, h && { hat: h[0], hatCol: h[1] }, i % 4 === 2 && { long: true }, (i % 5 === 1 || (kid && i % 2)) && { shorts: true }, o); };
    // a standing watcher: o.act / o.fen poses, o.hold / o.fhold, o.to [a, b, y] (its place as the car passes), o.f (walks there), o.on (on a thing), o.yaw / o.fyaw, o.face / o.fface
    function st(C, i, a, b, o) {
      o = o || {}; const kid = !!o.kid, on = o.on ? { on: o.on } : null, to = o.to || [a, b, o.y];
      const act = X(on, { a, b, pose: o.act || 'relax' }, o.y != null && { y: o.y }, o.face && { face: o.face }, o.yaw != null && { yaw: o.yaw }, o.hold && { hold: o.hold }, o.head && { head: o.head }, o.look != null && { look: o.look });
      const fen = X(on, { a: to[0], b: to[1], pose: o.fen || 'cheer', look: 'car' }, to[2] != null && { y: to[2] }, (o.fhold || o.hold) && { hold: o.fhold || o.hold }, o.head && { head: o.head }, o.fyaw != null && { yaw: o.fyaw }, o.fface && { face: o.fface });
      return C.man(lk(i, X(kid && { kid: true }, o.lk)), X({ act, bliza: o.bl || NEAR, run: o.f ? { f: o.f } : false, fence: fen }, kid && { kid: true }));
    }
    // a seated watcher on a seat whose top is o.h above o.y0 (or its root at o.y): it waves from its seat, or stands up (o.up true: on its seat; [a, b, y]: there)
    function se(C, i, a, b, o) {
      o = o || {}; const kid = !!o.kid, on = o.on ? { on: o.on } : null, h = o.h == null ? 0.45 : o.h, y0 = o.y0 || 0, y = o.y != null ? o.y : y0 + h - (kid ? 0.28 : 0.45);
      const dir = X(o.face && { face: o.face }, o.yaw != null && { yaw: o.yaw }), fdir = o.fyaw != null ? { yaw: o.fyaw } : o.fface ? { face: o.fface } : null;
      const act = X(on, dir, { a, b, y, pose: o.act || 'sit' }, o.hold && { hold: o.hold }, o.head && { head: o.head }, o.look != null && { look: o.look });
      const fh = o.fhold || o.hold, u = o.up === true ? [a, b, o.y != null ? o.y + (kid ? 0.28 : 0.45) : y0 + h] : o.up;
      const fen = u ? X(on, fdir || (on ? dir : null), { a: u[0], b: u[1], y: u[2] || 0, pose: o.fen || 'cheer', look: 'car' }, fh && { hold: fh }, o.head && { head: o.head })
        : X(on, fdir || dir, { a, b, y, pose: o.fen || 'm_sitWave', look: 'car' }, fh && { hold: fh }, o.head && { head: o.head });
      return C.man(lk(i, X(kid && { kid: true }, o.lk)), X({ act, bliza: o.bl || NEAR, run: false, fence: fen }, kid && { kid: true }));
    }
    // the kinds of seated watchers (what they do before the car, what as it passes)
    const kinds = (fl) => ({
      flag: { act: 'sitFlag', hold: [['flag', 1, { cols: fl }]], up: true, fen: 'flagWave' },
      eat: { act: 'sitEat', hold: [['hotdog', 1]], up: true, fen: 'cheer', fhold: [] },
      burger: { act: 'sitEat', hold: [['burger', 1]], fen: 'm_sitCheer', fhold: [] },
      dalj: { act: 'm_sitDalj', head: [['m_dalj']], look: 0.45, fen: 'm_sitDalj' },
      can: { act: 'sitDrink', hold: [['can', 1]], up: true, fen: 'wave2' },
      cup: { act: 'sitDrink', hold: [['cup', 1]], fen: 'm_sitWave', fhold: [['cup', 0]] },
      toast: { act: 'sitDrink', hold: [['cup', 1]], fen: 'm_sitNazdrav' },
      phone: { act: 'sitPhone', hold: [['phone', 1]], fen: 'm_sitCheer', fhold: [] },
      film: { act: 'sitText', hold: [['phone', 1]], up: true, fen: 'phoneUp' },
      lean: { act: 'sitLean', fen: 'm_sitWave' },
      sit: { act: 'sit', fen: 'm_sitPoint' },
      cheer: { act: 'sit', up: true, fen: 'cheer' },
      sofa: { act: 'sofa', fen: 'm_sitWave' },
      kid: { kid: true, act: 'sit', up: true, fen: 'jump' },
      ice: { kid: true, act: 'sitEat', hold: [['icecream', 1]], up: true, fen: 'jump' },
      kflag: { kid: true, act: 'sit', hold: [['mflag', 1, { c: fl[1] }]], fen: 'm_sitFlagWave' },
    });
    // a pole and a line of little flags to the next pole (the last one: its end pole too)
    const POLE = 0xdedede;
    const buntSeg = (Lx, h, cols, last) => { const g = grp(cyl(0.035, 0.045, h + 0.1, 5, POLE, -Lx / 2, (h + 0.1) / 2, 0), bunting([-Lx / 2, h, 0], [Lx / 2, h, 0], cols || BUNT, 0.35, 0.44));
      if (last) g.add(cyl(0.035, 0.045, h + 0.1, 5, POLE, Lx / 2, (h + 0.1) / 2, 0)); return g; };
    // a folding camping chair (its seat's top 0.435), a high director's chair (0.655), a sun lounger (its feet +z, the seat 0.325), a beach windbreak
    const campChair = (col) => { const D = 0x3a3d42; return grp(box(0.5, 0.03, 0.46, col, 0, 0.42, 0.02), box(0.5, 0.42, 0.03, col, 0, 0.7, -0.24, { rx: -0.12 }),
      bar([-0.25, 0, 0.22], [-0.25, 0.9, -0.26], 0.025, D), bar([0.25, 0, 0.22], [0.25, 0.9, -0.26], 0.025, D), bar([-0.25, 0, -0.2], [-0.25, 0.44, 0.24], 0.025, D), bar([0.25, 0, -0.2], [0.25, 0.44, 0.24], 0.025, D),
      box(0.04, 0.02, 0.44, D, -0.27, 0.62, 0), box(0.04, 0.02, 0.44, D, 0.27, 0.62, 0)); };
    const dirChair = (col) => { const W = 0x8a6a45; return grp(box(0.5, 0.03, 0.42, col, 0, 0.64, 0), box(0.5, 0.26, 0.03, col, 0, 1.0, -0.22),
      bar([-0.27, 0, 0.2], [-0.27, 0.86, -0.2], 0.035, W), bar([0.27, 0, 0.2], [0.27, 0.86, -0.2], 0.035, W), bar([-0.27, 0, -0.2], [-0.27, 0.86, 0.2], 0.035, W), bar([0.27, 0, -0.2], [0.27, 0.86, 0.2], 0.035, W),
      box(0.045, 0.03, 0.46, W, -0.27, 0.87, 0), box(0.045, 0.03, 0.46, W, 0.27, 0.87, 0), box(0.5, 0.03, 0.1, W, 0, 0.26, 0.2), bar([-0.27, 0.86, -0.2], [-0.27, 1.14, -0.22], 0.03, W), bar([0.27, 0.86, -0.2], [0.27, 1.14, -0.22], 0.03, W)); };
    const lounger = (c1, c2) => { const D = 0xdedede, g = grp(box(0.62, 0.05, 1.25, c1, 0, 0.3, 0.37), box(0.62, 0.05, 0.78, c1, 0, 0.3 + 0.39 * Math.sin(0.75), -0.25 - 0.39 * Math.cos(0.75), { rx: 0.75 }));
      for (const x of [-0.27, 0.27]) for (const z of [-0.2, 0.9]) g.add(box(0.04, 0.28, 0.04, D, x, 0.14, z));
      for (let k = 0; k < 3; k++) g.add(box(0.63, 0.054, 0.14, c2, 0, 0.3, k * 0.42));
      g.add(bar([0, 0.02, -0.78], [0, 0.74, -0.74], 0.03, D)); return g; };
    const windbreak = (Lx, cols) => { const g = grp(), n = Math.round(Lx / 1.0); for (let k = 0; k <= n; k++) g.add(cyl(0.02, 0.025, 1.3, 4, 0xc9a56a, -Lx / 2 + k * Lx / n, 0.65, 0));
      for (let k = 0; k < n; k++) cols.forEach((c, j) => g.add(box(Lx / n, 0.3, 0.012, c, -Lx / 2 + (k + 0.5) * Lx / n, 0.3 + j * 0.3, 0))); return g; };
    const blanket = (c1, c2) => grp(box(1.9, 0.015, 1.5, c1, 0, 0.012, 0), box(1.9, 0.017, 0.2, c2, 0, 0.013, -0.4), box(1.9, 0.017, 0.2, c2, 0, 0.013, 0.4), box(0.2, 0.019, 1.5, c2, -0.5, 0.014, 0), box(0.2, 0.019, 1.5, c2, 0.5, 0.014, 0));
    const lightsOn = (Lx, h) => grp(L.stringLights(Lx, h - 0.05), cyl(0.03, 0.04, h, 5, 0x8a6a45, -Lx / 2, h / 2, 0), cyl(0.03, 0.04, h, 5, 0x8a6a45, Lx / 2, h / 2, 0));
    // lying on a lounger (reading, a drink), waving from it; a low seat (the knees up)
    const LEZ = { hy: 0.14, hp: [1.5, 1.4], kn: [0.1, 0.35] };
    POSEX.m_lezi = () => P_(LEZ, { lean: -0.8, shz: [0.25, 0.25], shx: [0.9, 0.9], el: [1.6, 1.6], shy: [-0.3, -0.3], nod: 0.5 });
    POSEX.m_leziPije = () => P_(LEZ, { lean: -0.8, shz: [0.2, 0.3], shx: [0.2, 0.5], el: [0.4, 2.2], nod: 0.5 });
    POSEX.m_leziMaha = (t, s) => P_(LEZ, { lean: -0.45, shz: [0.15, 2.3 + 0.25 * s], shx: [0.3, 0.2], el: [0.6, 0.5], nod: 0.2 });
    POSEX.m_leziNazdrav = (t, s) => P_(LEZ, { lean: -0.5, shz: [0.15, 0.45], shx: [0.3, 2.25 + 0.12 * s], el: [0.6, 0.3], nod: 0.25 });
    POSEX.m_nizko = () => ({ hy: 0.5, hp: [1.85, 1.85], kn: [1.95, 1.95], lean: 0.1, shz: [0.15, 0.15], shx: [0.8, 0.8], el: [0.6, 0.6] });
    POSEX.m_nizkoMaha = (t, s) => ({ hy: 0.5, hp: [1.85, 1.85], kn: [1.95, 1.95], lean: 0, shz: [0.12, 2.35 + 0.25 * s], shx: [0.5, 0.2], el: [0.9, 0.55] });
    Object.assign(RATE, { m_leziMaha: 7.5, m_leziNazdrav: 5, m_nizkoMaha: 7.5 });
    const GL = 0x27313c, DKv = 0x1d1f25, ear = [['delavci_glusniki']], phone = [['phone', 1]];
    const cup = [['cup', 1]], can = [['can', 1]], WD = 0xa67c52, WDD = 0x6b4a2e, STEEL = 0x9aa0a8, DK = 0x3a3d42;
    /* ---------------- 9b. OSEM STARODOBNIKOV ---------------- */
    function oldCar(col, o) {   // generic cars of the early days, lighter than the first round's: the front +z; o.type roadster | tourer | saloon | pickup (the seats' top 1.11, the floor 0.5)
      o = o || {}; const g = grp(), T = o.type || 'roadster', DKc = 0x1d1f25, CH = 0xc8c9cc, LE = o.leather || 0x6b3f22, FN = o.fender || 0x15171c, HUB = o.hub || 0xe9e0c4, GL = 0x27313c, RF = o.roof || 0x1d1f25, WD = 0xa67c52;
      for (const x of [-0.74, 0.74]) for (const z of [1.2, -1.15]) { g.add(cyl(0.36, 0.36, 0.13, 8, TYRE, x, 0.36, z, { rz: PI2 })); g.add(cyl(0.19, 0.19, 0.15, 6, HUB, x, 0.36, z, { rz: PI2 })); }
      g.add(box(1.0, 0.12, 3.5, DKc, 0, 0.44, 0));
      g.add(box(0.78, 0.5, 1.5, col, 0, 0.77, 0.93)); g.add(box(0.5, 0.06, 1.5, col, 0, 1.04, 0.93)); g.add(box(0.74, 0.62, 0.07, CH, 0, 0.8, 1.7));
      for (const x of [-0.5, 0.5]) g.add(cyl(0.1, 0.1, 0.12, 7, CH, x, 0.9, 1.66, { rx: PI2 }));
      g.add(box(1.2, 0.05, 0.05, CH, 0, 0.5, 1.82));
      for (const x of [-0.76, 0.76]) { g.add(strip(x, 0.24, 0.56, 0.72, 0.8, 1.05, FN)); g.add(strip(x, 0.24, 0.8, 1.05, 0.6, 1.68, FN)); g.add(strip(x, 0.24, 0.5, 0.72, 0.5, -0.62, FN)); g.add(strip(x, 0.24, 0.5, -0.62, 0.8, -0.95, FN)); g.add(strip(x, 0.24, 0.8, -0.95, 0.6, -1.64, FN)); }
      const screen = (z) => { g.add(box(1.08, 0.4, 0.012, 0xa9c4cf, 0, 1.25, z, { rx: -0.19 })); g.add(box(1.12, 0.03, 0.03, CH, 0, 1.46, z - 0.04)); };
      if (T === 'roadster') {
        g.add(box(1.24, 0.52, 1.35, col, 0, 0.76, -0.47)); g.add(box(1.04, 0.16, 0.5, LE, 0, 1.03, -0.62)); g.add(box(1.04, 0.42, 0.13, LE, 0, 1.22, -0.93, { rx: -0.15 })); screen(0.16);
        g.add(box(1.1, 0.42, 0.72, col, 0, 0.74, -1.45)); g.add(cyl(0.3, 0.3, 0.12, 8, TYRE, 0, 0.86, -1.88, { rx: PI2 })); g.add(cyl(0.16, 0.16, 0.14, 6, HUB, 0, 0.86, -1.88, { rx: PI2 }));
      } else if (T === 'tourer') {
        g.add(box(1.3, 0.55, 2.17, col, 0, 0.775, -0.865)); screen(0.16);
        for (const z of [-0.45, -1.4]) { g.add(box(1.1, 0.16, 0.46, LE, 0, 1.03, z)); g.add(box(1.1, 0.4, 0.1, LE, 0, 1.24, z - 0.28, { rx: -0.12 })); }
        g.add(box(1.3, 0.2, 0.3, 0x2a2018, 0, 1.17, -1.9));
      } else {
        const zc = T === 'saloon' ? -0.86 : -0.34, Lc = T === 'saloon' ? 2.15 : 1.1;   // (the closed cabin)
        g.add(box(1.3, 0.55, Lc, col, 0, 0.775, zc)); g.add(box(1.2, 0.5, Lc - 0.12, GL, 0, 1.3, zc)); g.add(box(1.34, 0.07, Lc + 0.06, RF, 0, 1.585, zc));
        for (const x of [-0.62, 0.62]) for (const z of T === 'saloon' ? [zc + Lc / 2 - 0.05, zc, zc - Lc / 2 + 0.05] : [zc + Lc / 2 - 0.05, zc - Lc / 2 + 0.05]) g.add(box(0.07, 0.5, 0.08, col, x, 1.3, z));
        if (T === 'pickup') { g.add(box(1.3, 0.06, 1.1, WD, 0, 0.73, -1.42)); for (const x of [-0.63, 0.63]) g.add(box(0.05, 0.34, 1.1, WD, x, 0.93, -1.42)); g.add(box(1.3, 0.34, 0.05, WD, 0, 0.93, -1.95)); }
        else g.add(box(1.0, 0.3, 0.22, col, 0, 0.72, -2.0));
      }
      for (const x of [-0.48, 0.48]) g.add(box(0.1, 0.07, 0.03, 0xb01515, x, 0.82, T === 'roadster' ? -1.82 : -2.0));
      return g;
    }
    S.m_staro8 = { seed: 933, r: 30, clear: [[-8, 5, 9], [0, 5, 9], [8, 5, 9]],
      build(C, F, K2) {
        const fl = K2.flag, D = [-0.28, -1], flag = [['flag', 1, { cols: fl }]], cup = [['cup', 1]];
        const CARS = [['roadster', 0x1f4a33, {}], ['tourer', 0xe9e0c4, { leather: 0x8a2a22, hub: 0xb9bec6 }], ['saloon', 0x7a1f26, {}], ['pickup', 0x23375e, { hub: 0xd23a2c }],
          ['roadster', 0x1d1f25, { leather: 0x8a2a22, hub: 0xd23a2c }], ['tourer', 0x7fa6c4, { leather: 0xd8c9a8 }], ['saloon', 0x2f4f3a, { roof: 0xe9e0c4 }], ['pickup', 0xb5312a, {}]];
        const ca = (i) => -9.45 + i * 2.7;
        CARS.forEach(([type, col, o], i) => C.prop(oldCar(col, X(o, { type })), ca(i), 5.3, D, 'c' + i));
        ruts(C, F, -15, 1.4, CARS.map((c, i) => [ca(i), 5.3, D, 1.2, 0.74, 2.35]));   // (they backed in from the gate at the left end)
        for (let k = 0; k < 3; k++) C.prop(buntSeg(6.6, 3.3, BUNT, k === 2), -6.6 + k * 6.6, 8.1, null);
        // at the cars: one polishes his bonnet, a couple in the open tourer, one leans on his saloon, one in the pickup's bed, one stands in his car,
        // a boy at the wheel and his mother who takes his picture, one on the running board, one looks under the bonnet
        C.man(lk(2, { vest: 0x47494f, hat: 'flat', hatCol: 0x6a6f78, long: true }), { act: { on: 'c0', a: 0.8, b: 0.95, y: 0, yaw: -PI2, pose: 'fixHood', hold: [['m_krpa', 1]] }, bliza: { pose: 'stand', look: 'car' }, run: false, fence: { on: 'c0', a: 0.85, b: 1.0, y: 0, pose: 'wave2', hold: [['m_krpa', 1]], look: 'car' } });
        se(C, 5, -0.3, -0.42, { on: 'c1', y: 0.66, act: 'm_vozi', fen: 'm_sitWave', lk: { hat: 'flat', hatCol: 0x7a5232, long: true } });
        se(C, 8, 0.3, -0.42, { on: 'c1', y: 0.66, act: 'sit', fen: 'm_sitCheer', lk: { hat: 'straw', hatCol: 0xe6d3a0, hair: 'long' } });
        st(C, 11, -1.05, 0.5, { on: 'c2', y: 0, yaw: 0.2, act: 'arms', fen: 'thumbs', fyaw: 0.2 });
        st(C, 14, 0, -1.2, { on: 'c3', y: 0.76, act: 'fence', fen: 'fenceWave' });
        st(C, 17, -0.3, -0.3, { on: 'c4', y: 0.5, act: 'hips', fen: 'cheer', lk: { hat: 'flat', hatCol: 0x47494f } });
        se(C, 20, -0.3, -0.42, { on: 'c5', kid: true, y: 0.83, act: 'm_vozi', up: [-0.3, -0.42, 1.11], fen: 'jump', lk: { hat: 'cap', hatCol: 0xd23a2c } });
        st(C, 23, ca(5) + 1.0, 3.1, { act: 'phone', hold: [['phone', 1]], face: [-0.7, 1], fen: 'phoneUp', lk: { hair: 'long' } });
        se(C, 26, 0.82, -0.1, { on: 'c6', y: 0.07, yaw: PI2, act: 'sitDrink', hold: cup, fen: 'm_sitWave', fhold: [['cup', 0]] });
        st(C, 29, -0.9, 1.0, { on: 'c7', y: 0, yaw: PI2, act: 'bend', fen: 'point', fyaw: 0.3, lk: { hair: 'bald', long: true } });
        // in front of the cars: two picnic tables, a lady under her sunshade
        const tbl = (c) => grp(L.table(1.3, 0.8), box(1.34, 0.012, 0.84, c, 0, 0.746, 0));
        C.prop(tbl(0xd23a2c), -6.4, 2.3, null); C.prop(L.chair(0x2f63c9), -7.35, 2.35, [1, -0.5]); C.prop(L.chair(0x2f63c9), -5.45, 2.35, [-1, -0.5]);
        se(C, 32, -7.35, 2.35, { h: 0.44, face: [1, -0.5], fface: [0.3, -1], act: 'sitEat', hold: [['plate', 1]], fen: 'm_sitWave', fhold: [] });
        se(C, 35, -5.45, 2.35, { h: 0.44, face: [-1, -0.5], fface: [-0.3, -1], act: 'sitDrink', hold: cup, fen: 'm_sitCheer', fhold: [] });
        C.prop(tbl(0x2f63c9), 2.6, 2.3, null); C.prop(L.chair(0xf2f2ee), 1.65, 2.35, [1, -0.5]); C.prop(L.chair(0xf2f2ee), 3.55, 2.35, [-1, -0.5]); C.prop(L.parasol(0xefe6cf, 0xd23a2c), 2.6, 3.15);
        se(C, 38, 1.65, 2.35, { h: 0.44, face: [1, -0.5], fface: [0.3, -1], act: 'sitDrink', hold: cup, fen: 'm_sitNazdrav', lk: { hat: 'flat', hatCol: 0x6a6f78, long: true } });
        se(C, 41, 3.55, 2.35, { h: 0.44, face: [-1, -0.5], act: 'sitEat', hold: [['plate', 1]], up: [3.5, 1.45, 0], fen: 'wave', fhold: [], lk: { hat: 'straw', hatCol: 0xe6d3a0, hair: 'long', long: true } });
        C.prop(L.chair(0xf2f2ee), -2.3, 2.4, [-0.2, -1]); C.prop(L.parasol(0xd8a8c8, 0xf2f2ee), -1.55, 2.95);
        se(C, 44, -2.3, 2.4, { h: 0.44, face: [-0.2, -1], act: 'sitDrink', hold: cup, up: [-2.45, 1.55, 0], fen: 'wave', fhold: [['cup', 0]], lk: { shirt: 0xd8a8c8, long: true, pants: 0xefe6cf, hat: 'straw', hatCol: 0xe6d3a0, hair: 'long' } });
        // the photographer, a couple at the fence, a father and his boy with a little flag, one with the big flag, one who comes from the cars
        C.man(lk(47, { hair: 'short' }), { act: { a: -9.9, b: 3.0, pose: 'crouchCam', hold: [['camera', 1]], face: [1, 0.9] }, bliza: NEAR, run: false, fence: { a: -9.9, b: 3.0, pose: 'cam', hold: [['camera', 1]], look: 'car' } });
        st(C, 50, 0.1, 1.05, { act: 'talk', face: [1, 0.2], fen: 'wave' }); st(C, 53, 0.85, 1.1, { act: 'hips', face: [-1, 0.1], fen: 'cheer', lk: { hair: 'long' } });
        st(C, 56, -4.2, 1.1, { act: 'point', face: [0.3, -1], fen: 'point' }); st(C, 59, -3.55, 0.95, { kid: true, act: 'relax', hold: [['mflag', 1, { c: fl[1] }]], fen: 'flagWave' });
        st(C, 62, 7.3, 1.1, { act: 'flagHold', hold: flag, fen: 'flagWave' });
        st(C, 65, 5.9, 2.5, { act: 'hips', face: [0.2, 1], fen: 'thumbs', to: [5.8, 1.15], f: 0.35 });
      } };

    /* ---------------- 11. IZ PRTLJAŽNIKOV IN KESONOV ---------------- */
    // generic boxy vehicles, their rear +z (to the road): no marks, plain colours
    function vBase(g, col, Lz, W, o) {   // the wheels, the lower body (its top o.top), the bumpers, the lights
      const r = o.r || 0.36, top = o.top, x0 = W / 2 - 0.1;
      for (const x of [-x0, x0]) for (const z of [-Lz / 2 + 0.85, Lz / 2 - 0.95]) { g.add(cyl(r, r, 0.24, 8, TYRE, x, r, z, { rz: PI2 })); g.add(cyl(r * 0.55, r * 0.55, 0.26, 6, 0xb9bec6, x, r, z, { rz: PI2 })); }
      g.add(box(W, top - 0.3, Lz, col, 0, (top + 0.3) / 2, 0));
      for (const s of [-1, 1]) g.add(box(W + 0.04, 0.14, 0.12, DKv, 0, 0.36, s * (Lz / 2 + 0.03)));
      for (const x of [-(W / 2 - 0.16), W / 2 - 0.16]) { g.add(box(0.24, 0.1, 0.03, 0xf6f2dc, x, top - 0.14, -Lz / 2 - 0.01, { basic: true })); g.add(box(0.14, 0.2, 0.03, 0xb01515, x, top - 0.16, Lz / 2 + 0.01)); }
    }
    function ute(col) {   // a pickup: the bed's floor 0.88, the tailgate down (its top 0.89, z 2.5..3.02)
      const g = grp(); vBase(g, col, 5.0, 1.8, { top: 0.87 });
      g.add(box(1.74, 0.26, 1.25, col, 0, 1.0, -1.85)); g.add(box(1.8, 0.26, 1.3, col, 0, 1.0, -0.65)); g.add(box(1.66, 0.5, 1.2, GL, 0, 1.38, -0.65)); g.add(box(1.72, 0.07, 1.3, col, 0, 1.665, -0.65));
      for (const x of [-0.82, 0.82]) for (const z of [-1.25, -0.05]) g.add(box(0.08, 0.5, 0.08, col, x, 1.38, z));
      for (const x of [-0.865, 0.865]) g.add(box(0.07, 0.42, 2.5, col, x, 1.08, 1.25)); g.add(box(1.8, 0.42, 0.07, col, 0, 1.08, 0.03));
      g.add(box(1.66, 0.06, 0.52, col, 0, 0.86, 2.76)); for (const x of [-0.83, 0.83]) g.add(bar([x, 1.29, 2.45], [x, 0.88, 3.0], 0.015, 0x9aa0a8));
      g.add(box(1.66, 0.012, 2.4, 0x2a2c31, 0, 0.876, 1.25));
      return g;
    }
    function estate(col, Lz) {   // an estate car, the boot open under its raised hatch (the boot's floor 0.75, its edge z Lz/2)
      Lz = Lz || 4.6; const g = grp(), W = 1.78, R = Lz / 2, zb = R - 1.2; vBase(g, col, Lz, W, { top: 0.75, r: 0.33 });
      g.add(box(1.72, 0.3, 1.2, col, 0, 0.9, -R + 0.6)); g.add(box(W, 0.34, Lz - 2.4, col, 0, 0.92, (-R + 1.2 + zb) / 2));
      g.add(box(1.64, 0.46, Lz - 2.5, GL, 0, 1.32, (-R + 1.25 + zb) / 2));
      for (const x of [-0.85, 0.85]) { g.add(box(0.08, 0.34, 1.2, col, x, 0.92, zb + 0.6)); g.add(box(0.03, 0.46, 1.1, GL, x * 0.976, 1.32, zb + 0.55)); g.add(box(0.08, 0.46, 0.08, col, x * 0.965, 1.32, R - 0.1)); g.add(box(0.08, 0.46, 0.08, col, x * 0.965, 1.32, zb)); }
      g.add(box(1.7, 0.06, Lz - 1.3, col, 0, 1.58, 0.55));
      g.add(box(1.6, 0.05, 1.05, col, 0, 1.58 + 0.5 * Math.sin(0.5), R - 0.1 + 0.5 * Math.cos(0.5), { rx: -0.5 })); g.add(box(1.4, 0.04, 0.5, GL, 0, 1.6 + 0.62 * Math.sin(0.5), R - 0.1 + 0.62 * Math.cos(0.5), { rx: -0.5 }));
      g.add(box(1.6, 0.012, 1.15, 0x3a3d42, 0, 0.757, zb + 0.6));
      return g;
    }
    function suv(col) {   // a boxy 4x4: a wooden deck on its roof (its top 2.01, z -0.45..2.05), a ladder and the spare wheel at the back
      const g = grp(), W = 1.85, Lz = 4.5, R = Lz / 2, WD = 0xa67c52; vBase(g, col, Lz, W, { top: 0.98, r: 0.41 });
      g.add(box(1.8, 0.27, 1.25, col, 0, 1.115, -R + 0.62)); g.add(box(W, 0.27, Lz - 1.25, col, 0, 1.115, 0.625));
      g.add(box(1.7, 0.55, Lz - 1.4, GL, 0, 1.525, 0.65)); g.add(box(1.78, 0.07, Lz - 1.3, col, 0, 1.835, 0.65));
      for (const x of [-0.86, 0.86]) for (const z of [-R + 1.3, 0.6, R - 0.06]) g.add(box(0.09, 0.55, 0.09, col, x, 1.525, z));
      g.add(cyl(0.36, 0.36, 0.2, 8, TYRE, 0.35, 1.2, R + 0.12, { rx: PI2 }));
      for (const x of [-0.7, 0.7]) for (const z of [-0.3, 1.9]) g.add(box(0.05, 0.1, 0.05, 0x2a2c31, x, 1.92, z));
      g.add(box(1.6, 0.05, 2.5, WD, 0, 1.985, 0.8)); for (const x of [-0.78, 0.78]) g.add(box(0.04, 0.2, 2.5, 0x2a2c31, x, 2.1, 0.8)); g.add(box(1.6, 0.2, 0.04, 0x2a2c31, 0, 2.1, -0.45));
      for (const x of [-0.75, -0.4]) g.add(bar([x, 0.3, R + 0.25], [x, 2.05, R + 0.06], 0.035, 0x9aa0a8)); for (let k = 1; k <= 5; k++) g.add(box(0.35, 0.03, 0.03, 0x9aa0a8, -0.575, 0.3 + k * 0.3, R + 0.25 - k * 0.032));
      return g;
    }
    function vanOpen(col, col2) {   // the kit's minibus turned its rear +z, its rear doors open (the sill to sit on 0.6, z 2.3)
      const v = L.van(col, col2); v.rotation.y = PI2;
      const g = grp(v, box(1.5, 1.45, 0.03, 0x15171c, 0, 1.3, 2.215), box(1.5, 0.05, 0.3, 0x3a3d42, 0, 0.58, 2.3));
      for (const x of [-0.95, 0.95]) g.add(box(0.05, 1.45, 0.8, col2 || col, x, 1.3, 2.6));
      return g;
    }
    S.m_prtljazniki = { seed: 941, r: 30, clear: [[-8, 5, 9], [0, 5, 9], [8, 5, 9]],
      build(C, F, K2) {
        const fl = K2.flag, KD = kinds(fl), flag = [['flag', 1, { cols: fl }]], A = [-8.25, -4.95, -1.65, 1.65, 4.95, 8.25];
        // a pickup, its tailgate down: two sit on it, a boy stands in the bed
        C.prop(ute(0xb5312a), A[0], 5.25, null, 'u1');
        se(C, 1, -0.4, 2.8, { on: 'u1', h: 0.89, act: 'sitDrink', hold: [['can', 1]], fen: 'm_sitNazdrav' }); se(C, 4, 0.4, 2.8, X(KD.burger, { on: 'u1', h: 0.89 }));
        st(C, 7, 0.1, 1.4, { on: 'u1', kid: true, y: 0.88, act: 'relax', hold: [['mflag', 1, { c: fl[1] }]], fen: 'flagWave' });
        // an estate car: a couple in the open boot
        C.prop(estate(0xb9bec6), A[1], 4.75, null, 'e1');
        se(C, 10, -0.38, 2.35, X(KD.cup, { on: 'e1', h: 0.75 })); se(C, 13, 0.38, 2.35, X(KD.phone, { on: 'e1', h: 0.75 }));
        // a second pickup: two camping chairs in the bed, the flag on a pole, one stands beside it
        C.prop(grp(ute(0xefefea), at(campChair(0x2f63c9), -0.42, 0.88, 1.35), at(campChair(0xd23a2c), 0.42, 0.88, 1.35), at(L.flagPole(fl, 3.4), 0.72, 0.88, 0.3)), A[2], 5.25, null, 'u2');
        se(C, 16, -0.42, 1.35, X(KD.flag, { on: 'u2', y0: 0.88, h: 0.435, up: [-0.42, 1.95, 0.88] })); se(C, 19, 0.42, 1.35, X(KD.dalj, { on: 'u2', y0: 0.88, h: 0.435 }));
        st(C, 22, 1.45, 2.4, { on: 'u2', y: 0, act: 'drink', hold: [['can', 1]], fen: 'wave2' });
        // a minibus, its rear doors open: one eats in the doorway, one on a chair beside it, one films
        C.prop(vanOpen(0x2f63c9, 0xf2f2ee), A[3], 5.2, null, 'v1'); C.prop(campChair(0xf0c22e), A[3] + 1.55, 2.6, [-0.2, -1]);
        se(C, 25, 0, 2.35, X(KD.eat, { on: 'v1', h: 0.605, up: [0, 3.0, 0] })); se(C, 28, A[3] + 1.55, 2.6, X(KD.lean, { h: 0.435, face: [-0.2, -1] }));
        st(C, 31, A[3] - 1.25, 1.2, { act: 'phone', hold: phone, fen: 'phoneUp' });
        // a 4x4 with a deck on its roof: two sit on its edge, one stands with binoculars
        C.prop(suv(0x5b6b3a), A[4], 4.7, null, 'j1');
        se(C, 34, -0.4, 1.95, { on: 'j1', h: 2.01, act: 'sit', fen: 'm_sitCheer' }); se(C, 37, 0.4, 1.95, { on: 'j1', h: 2.01, act: 'sitFlag', hold: flag, fen: 'm_sitFlagWave' });
        st(C, 40, 0, 0.5, { on: 'j1', y: 2.01, act: 'm_dalj', head: [['m_dalj']], fen: 'm_dalj' });
        // a small estate: two children in the boot, their mother with a cup
        C.prop(estate(0xf0c22e, 4.0), A[5], 4.45, null, 'e2');
        se(C, 43, -0.36, 2.05, X(KD.ice, { on: 'e2', h: 0.75, up: [-0.36, 2.75, 0] })); se(C, 46, 0.36, 2.05, X(KD.kflag, { on: 'e2', h: 0.75 }));
        st(C, 49, A[5] + 1.45, 2.3, { act: 'drink', hold: [['cup', 1]], fen: 'wave2', lk: { hair: 'long' } });
        // between the cars: coolers, a little table, two at the fence
        C.prop(L.cooler(0x2f63c9), A[0] + 1.6, 2.7, [0.2, -1]); C.prop(L.table(0.8, 0.6), A[1] + 1.65, 2.9, null); C.prop(L.cooler(0xd23a2c), A[4] + 1.6, 2.6, [-0.2, -1]);
        st(C, 52, A[0] + 1.75, 1.3, { act: 'talk', face: [-1, 0.3], fen: 'cheer' }); st(C, 55, A[1] + 1.7, 1.15, { kid: true, act: 'fence', fen: 'jump' });
        // their tracks from the gate at the right end: each backed in (the rear axle nearer the road)
        ruts(C, F, 14, 1.4, [[A[0], 5.25, null, 1.55, 0.8, 3.2], [A[1], 4.75, null, 1.35, 0.79, 2.8], [A[2], 5.25, null, 1.55, 0.8, 3.2], [A[3], 5.2, null, 1.45, 0.85, 2.9], [A[4], 4.7, null, 1.3, 0.825, 2.7], [A[5], 4.45, null, 1.05, 0.79, 2.2]]);
      } };

    /* ---------------- 13. NA HLODIH ---------------- */
    function logStack(Lx) {   // a stack of felled trunks along x, +z to the road: 5 + 4 + 3 (the top logs' top 1.2), their ends sawn unevenly (the bark, the pale
      // sapwood, the darker heart: the rings the camera sees), a few thinner ones and one longer, four stakes holding them
      const g = grp(), r = 0.22, BARK = [0x6b4a2e, 0x7a5636, 0x5e4128, 0x84694a], SAP = [0xd9b77e, 0xe2c590, 0xcfa86c], HEART = 0xa8763f, ROWS = [[-0.88, -0.44, 0, 0.44, 0.88], [-0.66, -0.22, 0.22, 0.66], [-0.44, 0, 0.44]];
      ROWS.forEach((zs, k) => zs.forEach((z, n) => { const rr = r * (n % 3 === 1 ? 0.88 : 1), l = Lx + (rnd() - 0.5) * 0.5 + (k === 0 && n === 2 ? 0.9 : 0), x = (rnd() - 0.5) * 0.3, y = rr + k * r * 1.732;
        g.add(cyl(rr, rr * 1.04, l, 8, pick(BARK), x, y, z, { rz: PI2 }));
        for (const e of [-1, 1]) { const xe = x + e * (l / 2 + 0.006); g.add(cyl(rr - 0.025, rr - 0.025, 0.014, 8, pick(SAP), xe, y, z, { rz: PI2 })); g.add(cyl(rr * 0.42, rr * 0.42, 0.02, 6, HEART, xe + e * 0.002, y, z, { rz: PI2 })); } }));
      for (const x of [-Lx / 2 + 0.7, Lx / 2 - 0.7]) for (const z of [-1.12, 1.12]) g.add(box(0.1, 1.2, 0.1, 0x5b4630, x, 0.6, z, { rz: z > 0 ? 0.04 : -0.04 }));
      return g;
    }
    ITEMX.m_sekira = () => grp(bar([0, 0.08, 0.03], [0, -0.72, 0.08], 0.035, 0x9a7546), box(0.035, 0.14, 0.2, 0x8f949b, 0, -0.7, 0.16));
    S.m_hlodi = { seed: 943, r: 30, clear: [[-7, 4, 8], [0, 4, 8], [7, 4, 8]],
      build(C, F, K2) {
        const fl = K2.flag, KD = kinds(fl), TOP = 1.2, A = [-6.6, 0, 6.6];
        const PLAN = [[[-1.6, 'can'], [-0.55, 'kid'], [0.5, 'eat'], [1.6, 'lean']], [[-1.65, 'dalj'], [-0.6, 'burger'], [0.55, 'phone'], [1.6, 'ice']], [[-1.5, 'cup'], [-0.4, 'cheer'], [0.7, 'kflag'], [1.65, 'sit']]];
        A.forEach((a0, m) => { C.prop(logStack(4.5), a0, 3.6, null, 'h' + m); PLAN[m].forEach(([x, kind], j) => se(C, 2 + m * 12 + j * 3, x, 0.3, X(KD[kind], { on: 'h' + m, h: TOP }))); });
        st(C, 40, 0.0, -0.22, { on: 'h1', y: TOP, act: 'flagHold', hold: [['flag', 1, { cols: fl }]], fen: 'flagWave' });
        // the woodcutter between the stacks, two hikers on a log, a dog
        C.prop(L.chopBlock(), -3.3, 3.3); C.prop(L.woodpile(1.4), -3.3, 4.7, [0.2, -1]);
        C.man({ shirt: 0xd23a2c, long: true, pants: 0x3a4a3a, hat: 'hard', hatCol: 0xf07a1c }, { act: { a: -3.3, b: 2.2, pose: 'relax', face: [0.3, -1], hold: [['m_sekira', 1]], head: ear }, bliza: NEAR, run: false,
          fence: { a: -3.3, b: 2.2, pose: 'wave2', hold: [['m_sekira', 1]], head: ear, look: 'car' } });
        C.prop(L.logBench(1.9), 3.3, 2.6, null); C.prop(L.bag(0x2f63c9), 2.25, 3.3, [0.3, -1]); C.prop(L.bag(0xd23a2c), 4.35, 3.3, [-0.3, -1]);
        se(C, 44, 2.9, 2.6, { y: -0.07, act: 'm_nizko', fen: 'm_nizkoMaha', lk: { hat: 'bucket', hatCol: 0xd8c08a, shorts: true } }); se(C, 47, 3.7, 2.6, { y: -0.07, act: 'm_nizko', fen: 'm_nizkoMaha', lk: { hair: 'pony', shorts: true } });
        C.pet(L.dog(0x8a6a45), { act: { a: 4.7, b: 2.1, face: [-1, -0.3] }, fence: { a: 4.5, b: 1.1, face: [-0.3, -1] }, run: { f: 1.0 } });
        C.prop(L.flagPole(fl, 5.5), -9.6, 4.2); C.prop(L.flagPole(fl, 5.5), 9.6, 4.2);
      } };

    /* ---------------- 18. TERASA NA ZABOJNIKIH ---------------- */
    const DECK = 2.65;
    function container(col, first, last) {   // a plain container along x (6.06 x 2.59 x 2.44), +z to the road: its corrugated side, the rails and corner castings,
      // the doors and their locking bars at the ends; a wooden deck (2.65) and a railing on it; no marks
      const g = grp(box(5.9, 2.4, 2.3, col, 0, 1.295, 0)), d = shade(col, 0.82), e = shade(col, 0.62), CC = 0x3a3d42;
      for (let k = 0; k < 23; k++) g.add(box(0.13, 2.38, 0.07, k % 2 ? d : col, -2.75 + k * 0.25, 1.295, 1.17));   // (the side's ribs, in and out)
      for (const y of [0.08, 2.51]) for (const z of [-1.17, 1.17]) g.add(box(6.06, 0.16, 0.1, e, 0, y, z));   // (the bottom and top rails)
      for (const x of [-2.97, 2.97]) { for (const z of [-1.15, 1.15]) g.add(box(0.12, 2.59, 0.14, e, x, 1.295, z));
        for (const y of [0.09, 2.5]) for (const z of [-1.13, 1.13]) g.add(box(0.18, 0.18, 0.18, CC, x * 1.005, y, z));   // (the corner castings)
        const xs = x * 1.012; g.add(box(0.02, 2.3, 2.2, d, xs, 1.295, 0)); g.add(box(0.03, 2.3, 0.03, CC, xs * 1.002, 1.295, 0));   // (the two doors, their seam)
        for (const z of [-0.75, -0.3, 0.3, 0.75]) { g.add(box(0.035, 2.36, 0.035, STEEL, xs * 1.004, 1.295, z)); g.add(box(0.05, 0.1, 0.07, CC, xs * 1.005, 1.1, z)); } }
      g.add(box(6.06, 0.06, 2.44, WD, 0, 2.62, 0));
      for (const x of [-2.9, -1.45, 0, 1.45, 2.9]) g.add(box(0.05, 1.0, 0.05, DK, x, 3.15, 1.17));
      g.add(box(6.06, 0.05, 0.05, DK, 0, 3.65, 1.17)); g.add(box(6.06, 0.04, 0.04, DK, 0, 3.2, 1.17));
      for (const x of [-2.9, 0, 2.9]) g.add(box(0.05, 1.0, 0.05, DK, x, 3.15, -1.17)); g.add(box(6.06, 0.05, 0.05, DK, 0, 3.65, -1.17));
      if (last) { g.add(box(0.05, 0.05, 2.34, DK, 3.0, 3.65, 0)); g.add(box(0.05, 0.04, 2.34, DK, 3.0, 3.2, 0)); }
      if (first) g.add(box(0.05, 0.05, 1.3, DK, -3.0, 3.65, -0.52));
      return g;
    }
    function stairs() {   // ten steps up along +x to the deck at x 0
      const g = grp(); for (let k = 1; k <= 10; k++) g.add(box(0.3, 0.04, 0.9, STEEL, -(10 - k) * 0.3 - 0.15, k * 0.265 - 0.02, 0));
      for (const z of [-0.47, 0.47]) { g.add(bar([-3.0, 0.2, z], [0, 2.6, z], 0.05, DK)); g.add(bar([-3.0, 1.25, z], [0, 3.65, z], 0.04, DK));
        for (const x of [-2.9, -1.5, -0.1]) g.add(box(0.04, 1.05, 0.04, DK, x, (x + 3.0) / 3.0 * 2.4 + 0.72, z)); }
      return g;
    }
    S.m_zabojniki = { seed: 953, r: 32, clear: [[-7, 5, 9], [1, 5, 9], [9, 5, 9]],
      build(C, F, K2) {
        const fl = K2.flag, KD = kinds(fl), A = [-4.56, 1.5, 7.56], B0 = 4.8, PH = { shirt: 0x2a2d33, pants: 0x1d1f25, hat: 'cap', hatCol: 0x15171c, long: true }, flag = [['flag', 1, { cols: fl }]];
        C.prop(grp(container(0x2c5fa8, true), at(stairs(), -3.03, 0, 0.65), at(L.parasol(0xf0c22e, 0xf2f2ee), 1.9, DECK, -0.35), at(dirChair(0xd23a2c), 1.45, DECK, 0.3), at(dirChair(0x2f63c9), 2.35, DECK, 0.3), at(L.flagPole(fl, 3.2), -2.8, DECK, -1.0)), A[0], B0, null, 'k0');
        C.prop(container(0xb5482a), A[1], B0, null, 'k1');
        C.prop(grp(container(0x3d7a4a, false, true), at(L.parasol(0xd23a2c, 0xf2f2ee), 1.7, DECK, -0.35), at(L.beanBag(0xf0c22e), 1.5, DECK, 0.1), at(L.flagPole(fl, 3.2), 2.8, DECK, -1.0)), A[2], B0, null, 'k2');
        const dk = (n, key, x, o) => st(C, n, x, 0.85, X({ on: key, y: DECK }, o));
        // on the deck: at the railing, under the sunshades
        dk(1, 'k0', -2.2, { act: 'fence', fen: 'fenceWave' }); dk(4, 'k0', -1.0, { act: 'm_dalj', head: [['m_dalj']], fen: 'm_dalj' }); dk(7, 'k0', 0.2, { act: 'flagHold', hold: flag, fen: 'flagWave' });
        se(C, 10, 1.45, 0.3, X(KD.cup, { on: 'k0', y0: DECK, h: 0.655 })); se(C, 13, 2.35, 0.3, X(KD.phone, { on: 'k0', y0: DECK, h: 0.655 }));
        dk(16, 'k1', -2.3, { act: 'fence', fen: 'cheer' }); dk(19, 'k1', -1.1, { kid: true, act: 'fence', fen: 'jump' }); dk(22, 'k1', 0.1, { act: 'phone', hold: phone, fen: 'phoneUp' });
        dk(25, 'k1', 1.3, { act: 'drink', hold: can, fen: 'wave2' }); dk(28, 'k1', 2.4, { act: 'arms', fen: 'thumbs' });
        dk(31, 'k2', -1.9, { act: 'fence', fen: 'fenceWave' }); dk(34, 'k2', -0.7, { act: 'talk', yaw: 0.9, fen: 'cheer' }); C.man(PH, { act: { on: 'k2', a: 0.4, b: 0.85, y: DECK, pose: 'cam', hold: [['camera', 1]] }, bliza: NEAR, run: false, fence: { on: 'k2', a: 0.4, b: 0.85, y: DECK, pose: 'cam', hold: [['camera', 1]], look: 'car' } });
        se(C, 40, 1.5, 0.18, { on: 'k2', y: DECK + 0.05, act: 'sofa', fen: 'm_sitWave' });
        // on the stairs, at the foot: the high tables, a bench, the big flag
        st(C, 43, -4.68, 0.65, { on: 'k0', y: 1.325, act: 'relax', yaw: PI2, fyaw: 0, fen: 'wave' });
        [[A[1] - 1.7, 2.35, 0xf2f2ee], [A[1] + 1.9, 2.3, 0xf0c22e]].forEach(([a, b, col], k) => { C.prop(L.highTable(col), a, b);
          st(C, 46 + k * 6, a - 0.62, b + 0.1, { act: k ? 'talk' : 'drink', hold: k ? null : cup, face: [1, -0.35], fen: k ? 'cheer' : 'wave2' });
          st(C, 49 + k * 6, a + 0.62, b + 0.05, { act: k ? 'drink' : 'talk', hold: k ? can : null, face: [-1, -0.35], fen: k ? 'wave2' : 'point' }); });
        C.prop(L.bench(0x8a6a45), A[2] + 0.4, 3.25, null);
        se(C, 58, A[2] + 0.0, 3.25, X(KD.lean, { h: 0.48 })); se(C, 61, A[2] + 0.8, 3.25, X(KD.kid, { h: 0.48 }));
        st(C, 64, A[0] - 4.4, 1.3, { act: 'flagHold', hold: flag, fen: 'flagWave' });
        // the photographers (the staff: they stay at their places; a plain dark shirt, no marks): the one on the green deck above, one crouching at the fence
        C.man(X(PH, { hat: 'beanie', hatCol: 0x31406e }), { act: { a: A[2] + 3.4, b: 0.9, pose: 'crouchCam', hold: [['camera', 1]], face: [-0.8, 1] }, bliza: NEAR, run: false, fence: { a: A[2] + 3.4, b: 0.9, pose: 'crouchCam', hold: [['camera', 1]], look: 'car' } });
        C.prop(L.cooler(0xd23a2c), A[0] + 1.5, 3.25, [0.2, -1]); C.prop(L.crates(2), A[0] + 2.6, 3.3, [-0.2, -1]);
      } };

    /* ---------------- 19. BALON NA VROČ ZRAK ---------------- */
    const BY = 3.0;   // (the basket's floor above the ground: the balloon hovers on its ropes)
    function balloon(cols) {
      const g = grp(), PR = [[0.9, 6.4], [3.2, 8.3], [5.0, 10.3], [6.0, 12.3], [6.3, 14.3], [5.8, 16.3], [4.6, 18.0], [2.9, 19.3], [0.9, 20.0]], N = 12;
      const pt = (k, j) => { const [r, y] = PR[k], t = j / N * TAU; return [r * Math.cos(t), y, r * Math.sin(t)]; };
      for (let k = 0; k < PR.length - 1; k++) for (let j = 0; j < N; j++) g.add(quad2(pt(k, j), pt(k, j + 1), pt(k + 1, j + 1), pt(k + 1, j), cols[(j + k) % cols.length]));
      for (let j = 0; j < N; j++) g.add(tri2(pt(PR.length - 1, j), pt(PR.length - 1, j + 1), [0, 20.15, 0], cols[0]));
      // the basket, the burner on its frame, the cords to the envelope's mouth
      g.add(box(1.5, 0.08, 1.2, WDD, 0, BY - 0.04, 0));
      for (const z of [-0.6, 0.6]) { g.add(box(1.5, 1.05, 0.06, WD, 0, BY + 0.525, z)); g.add(box(1.56, 0.07, 0.1, WDD, 0, BY + 1.07, z)); }
      for (const x of [-0.75, 0.75]) { g.add(box(0.06, 1.05, 1.2, WD, x, BY + 0.525, 0)); g.add(box(0.1, 0.07, 1.2, WDD, x, BY + 1.07, 0)); }
      for (const x of [-0.7, 0.7]) for (const z of [-0.55, 0.55]) g.add(bar([x, BY + 1.05, z], [x * 0.55, BY + 2.75, z * 0.55], 0.025, STEEL));
      g.add(box(0.9, 0.05, 0.7, STEEL, 0, BY + 2.75, 0)); g.add(box(0.3, 0.3, 0.3, DK, 0, BY + 2.95, 0)); g.add(cyl(0.02, 0.22, 0.7, 6, 0xf59a2a, 0, BY + 3.45, 0, { basic: true }));
      for (let j = 0; j < 8; j++) { const t = (j + 0.5) / 8 * TAU; g.add(bar([0.42 * Math.cos(t), BY + 2.75, 0.33 * Math.sin(t)], [0.9 * Math.cos(t), 6.4, 0.9 * Math.sin(t)], 0.012, DK)); }
      return g;
    }
    POSEX.m_gorilnik = () => ({ shz: [0.15, 2.9], shx: [0.1, 0.15], el: [0.2, 0.1] });
    POSEX.m_gorilnikMaha = (t, s) => ({ shz: [2.3 + 0.25 * s, 2.9], shx: [0.2, 0.15], el: [0.55, 0.1] });
    RATE.m_gorilnikMaha = 7.5;
    S.m_balon = { seed: 954, r: 34, clear: [[0, 40, 14], [-7, 5, 8], [7, 5, 8]],
      build(C, F, K2) {
        const fl = K2.flag, KD = kinds(fl), BA = 0.5, BB = 40, ROPE = 0xe8e2c8, CREW = { shirt: 0xd23a2c, hat: 'cap', hatCol: 0xd23a2c, pants: 0x2a2f3a };
        C.cb = BB / 2;   // (the people's middle: between the fence and the balloon)
        const g = balloon([0xd23a2c, 0xf0c22e, 0x2f63c9, 0xf2f2ee]);
        // the ropes: to the crew's pickup, to a stake in front, to a stake behind
        g.add(bar([-0.75, BY, 0.6], [-4.4, 0.95, 0.5], 0.02, ROPE)); g.add(bar([0.75, BY, 0.6], [5.5, 0.05, 2.0], 0.02, ROPE)); g.add(bar([0, BY, -0.6], [0.5, 0.05, -6.5], 0.02, ROPE));
        g.add(box(0.07, 0.4, 0.07, WDD, 5.5, 0.2, 2.0)); g.add(box(0.07, 0.4, 0.07, WDD, 0.5, 0.2, -6.5));
        // the fan that filled it
        g.add(cyl(0.55, 0.55, 0.3, 10, DK, 3.6, 0.7, -1.4, { rx: PI2 })); g.add(cyl(0.45, 0.45, 0.32, 8, 0xb9bec6, 3.6, 0.7, -1.4, { rx: PI2 })); g.add(box(0.9, 0.12, 0.6, 0xd23a2c, 3.6, 0.1, -1.4));
        C.prop(g, BA, BB, null, 'bl');
        C.prop(ute(0xf2f2ee), -6.5, BB - 0.5, [1, 0], 'ut'); C.prop(L.gasBottle(), -4.9, BB - 2.0); C.prop(L.gasBottle(), -4.5, BB - 2.2); C.prop(L.gasBottle(), -5.3, BB - 2.3);
        // in the basket: three passengers and the pilot at the burner
        st(C, 1, -0.48, 0.28, { on: 'bl', y: BY, act: 'fence', fen: 'fenceWave' }); st(C, 4, 0.0, 0.3, { on: 'bl', y: BY, act: 'phone', hold: phone, fen: 'phoneUp', lk: { hair: 'long' } });
        st(C, 7, 0.48, 0.28, { on: 'bl', y: BY, act: 'point', fen: 'cheer' });
        C.man(X(lk(10), CREW), { act: { on: 'bl', a: 0.05, b: -0.25, y: BY, pose: 'm_gorilnik' }, bliza: NEAR, run: false, fence: { on: 'bl', a: 0.05, b: -0.25, y: BY, pose: 'm_gorilnikMaha', look: 'car' } });
        // the crew: at the pickup with a radio, at the front rope, under the basket
        C.man(X(lk(13), CREW), { act: { a: -3.4, b: BB - 1.3, pose: 'radio', face: [1, 0.6] }, bliza: NEAR, run: false, fence: { a: -3.4, b: BB - 1.3, pose: 'wave2', look: 'car' } });
        C.man(X(lk(16), CREW), { act: { a: 6.3, b: BB - 2.2, pose: 'carry', face: [-1, 0.5] }, bliza: NEAR, run: false, fence: { a: 6.3, b: BB - 2.2, pose: 'thumbs', look: 'car' } });
        C.man(X(lk(19), CREW), { act: { a: 2.6, b: BB - 1.9, pose: 'direct', face: [-0.7, 1] }, bliza: NEAR, run: false, fence: { a: 2.6, b: BB - 1.9, pose: 'wave', look: 'car' } });
        // the onlookers along the fence: they watch the balloon, then the car
        st(C, 22, -8.6, 1.1, { act: 'point', face: [0.6, 1], fen: 'cheer' }); st(C, 25, -7.7, 1.2, { act: 'phoneUp', hold: phone, face: [0.5, 1], fen: 'phoneUp', lk: { hair: 'long' } });
        C.prop(blanket(0x2f63c9, 0xf2f2ee), -5.0, 2.9, null);
        C.man(lk(28), { act: { a: -5.45, b: 2.9, pose: 'sitGround' }, bliza: NEAR, run: false, fence: { a: -5.45, b: 2.9, pose: 'm_tlaCheer', look: 'car' } });
        C.man(lk(31, { hair: 'pony' }), { act: { a: -4.55, b: 2.95, pose: 'sitGround' }, bliza: NEAR, run: false, fence: { a: -4.55, b: 2.95, pose: 'm_tlaCheer', look: 'car' } });
        st(C, 34, -3.0, 1.3, { kid: true, act: 'point', face: [0.4, 1], fen: 'jump' }); st(C, 37, -2.2, 1.2, { act: 'relax', face: [0.3, 1], fen: 'wave' });
        st(C, 40, 1.0, 1.1, { act: 'fence', fen: 'fenceWave' }); st(C, 43, 1.9, 1.15, { act: 'hips', fen: 'cheer' });
        st(C, 46, 4.6, 1.2, { act: 'cam', hold: [['camera', 1]], face: [-0.4, 1], fen: 'cam' });
        st(C, 49, 7.0, 1.1, { act: 'm_dalj', head: [['m_dalj']], face: [-0.6, 1], fen: 'm_dalj', lk: { hat: 'flat', hatCol: 0x6a6f78, long: true } });
        C.prop(campChair(0x2f63c9), 8.6, 2.5, null); C.prop(campChair(0xd23a2c), 9.4, 2.5, null); C.prop(L.cooler(0xf2f2ee), 10.2, 2.6, [-0.2, -1]);
        se(C, 52, 8.6, 2.5, X(KD.cup, { h: 0.435 })); se(C, 55, 9.4, 2.5, X(KD.flag, { h: 0.435, up: [9.4, 1.3, 0] }));
      } };

  // their places: one group on each real track that is not a circuit (the user, 18. 11. 2026), found with tools/ljudje/mesta.mjs (seen from the
  // chase camera, 250 m from the other groups, no buildings or other roads in the way); on Katu, Harju, Chapman's Peak and Rio do Rastro the ground
  // falls 4 m across the place (the flattest there is: mountain roads and cliffs); Tianmen has none (the cliff road: no ground beyond the barrier)
  site('pikes', [['m_prtljazniki', 2368, -1]]);
  site('pikesg', [['m_hlodi', 4672, 1]]);
  site('caracoles', [['m_zabojniki', 5664, 1]]);
  site('balea', [['m_hlodi', 848, 1]]);
  site('katu', [['m_balon', 4678, 1]]);
  site('harju', [['m_staro8', 2440, -1]]);
  site('chapman', [['m_staro8', 4496, 1]]);
  site('rastro', [['m_prtljazniki', 1256, 1]]);
})();
