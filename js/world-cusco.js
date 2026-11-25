/* =========================================================================
   WORLD — Cusco, Peru (theme 'cusco'): the data-driven builder of the short roads (World.gore, js/world-gore.js) with this road's style; its own
   things in S.extra: the zigzag terrace walls of Sacsayhuamán above the town, as OpenStreetMap draws them (historic=archaeological_site, the
   walls' ways 689230841 the outer, lower tier, 431479258 the second tier and its turn down the western flank, 431479257 the western end), within
   ~275 m of the road. Each wall is a retaining wall of polygonal, tightly fitted stones (no mortar: the joints show only as the stones' pillowed
   faces turn from the light), leaning back a little, its top a stone coping and a grassy terrace behind. Only from the outside, as the map and
   the elevation model give them: no statue, inscriptions, plaques or names.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.gore || !World.api) return;
  const API = World.api;
  const { clamp, lerp, rng, vrGround } = API;

  // the walls (track frame x, z pairs from OpenStreetMap) with their height above the ground at their foot (m) and the stones' size (m)
  const WALLS = [
    { h: 6.2, big: 1.35, seed: 841, p: [127.4, -255.9, 114, -252.8, 113.6, -259.1, 99.3, -255.7, 96.2, -262.4, 85.3, -255.6, 76.9, -261.5, 75.8, -255, 67.7, -257.6, 68.4, -253.3,
      68.9, -249.5, 49.8, -248.4, 46.9, -257, 29.6, -247.7, 27.3, -255.7, 10.7, -250.8, 9.2, -256.7, -10.1, -252.9, -9.9, -259.6, -28.4, -256.2, -28, -263.7, -45.3, -262.3,
      -44.6, -270.2, -64.3, -269.9, -64.2, -274.1, -64, -277.9, -78.3, -277.3, -78.6, -286.5, -96.7, -284.9, -97.6, -290.3, -111.9, -287.3, -114.5, -293.5, -128.5, -284.9,
      -131.7, -291.5, -142.5, -280.1, -148.4, -285.2, -157.1, -271.5] },
    { h: 5.0, big: 1.1, seed: 258, p: [159.9, -238.5, 143.7, -230.1, 141.2, -239.1, 128.4, -235.6, 127.5, -241.5, 112.5, -238.3, 111.5, -243.8, 98.6, -239.4, 97.1, -245, 88.7, -239.5,
      80.9, -243.4, 79, -239.3, 78, -237.2, 61.1, -232, 59.5, -237.2, 44.8, -233.1, 44.3, -239.1, 24.3, -234.3, 24, -241.5, 5.4, -237.6, 3.1, -242.1, -4.6, -240.3, -18.1, -238.9,
      -17.6, -245.6, -36.9, -246, -36, -251.3, -56.4, -252, -55.7, -257.9, -73.6, -260.2, -74.5, -266.2, -87.1, -267, -87.9, -270.7, -105, -266.3, -108.6, -272.4, -115.4, -269,
      -115.4, -274.7, -126.6, -265.9, -128.4, -271.9, -138.5, -263.2, -145.2, -274.3, -147.4, -262.8, -149.9, -249.2, -153.5, -252.8, -163.4, -222.9, -169.1, -224.9, -169.1, -202.2] },
    { h: 4.2, big: 0.95, seed: 257, p: [-167.8, -268.7, -173.6, -265.5, -175.7, -259.1, -163.4, -254.9, -169.7, -233.2, -178.5, -233.7, -180, -210.5, -186.3, -211, -189.5, -194.7] },
  ];
  const BATTER = 0.13, COPE = 1.6, TERR = 3.2;   // (the face leans back 13 cm a metre; the coping's and the terrace's widths behind the face)

  // the walls' footprints for the trees and the skiers' exclusion (S.keepOut: before the trees are placed), and the open grass between
  // them and the road (the esplanade in front of the walls has no trees: the walls seen from the road)
  function keepOut(push) {
    const T = API.T;
    for (const W of WALLS) for (let k = 0; k + 3 < W.p.length; k += 2) {
      const ax = W.p[k], az = W.p[k + 1], bx = W.p[k + 2], bz = W.p[k + 3], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / 4));
      for (let j = 0; j <= n; j++) {
        const x = lerp(ax, bx, j / n), z = lerp(az, bz, j / n); push(x, z, 6.5);
        let b = 1e9, bi = -1; for (let i = 0; i < T.px.length; i += 2) { const d = Math.hypot(T.px[i] - x, T.pz[i] - z); if (d < b) { b = d; bi = i; } }
        if (b > 95) continue;
        const m = Math.ceil(b / 6); for (let q = 1; q < m; q++) push(lerp(x, T.px[bi], q / m), lerp(z, T.pz[bi], q / m), 8);
      }
    }
  }

  // a stone: the polygon (its corners on the wall's face) as a fan from its centre, pushed out of the face (the pillowed Inca stone)
  function stone(g, poly, ctr, out, col, R) {
    const d = 0.1 + R() * 0.16, c = [ctr[0] + out[0] * d, ctr[1] + d * 0.15, ctr[2] + out[2] * d], inside = [ctr[0] - out[0] * 3, ctr[1], ctr[2] - out[2] * 3];
    const edge = [col[0] * 0.8, col[1] * 0.8, col[2] * 0.79];   // (the stone's rim a little darker: the tight joints read as fine lines)
    for (let i = 0; i < poly.length; i++) g.triO(c, poly[i], poly[(i + 1) % poly.length], col, inside, edge, edge);
  }

  // a wall's end: the quad (front foot, front top, back top, back foot) laid in courses of stones, the joints slanted a little
  function endCap(g, f0, f1, b1, b0, out, big, ston, R) {
    const H = f1[1] - f0[1], P = (u, v) => { const lo = [lerp(f0[0], b0[0], u), lerp(f0[1], b0[1], u), lerp(f0[2], b0[2], u)], hi = [lerp(f1[0], b1[0], u), lerp(f1[1], b1[1], u), lerp(f1[2], b1[2], u)];
      return [lerp(lo[0], hi[0], v), lerp(lo[1], hi[1], v), lerp(lo[2], hi[2], v)]; };
    const dep = Math.hypot(b1[0] - f1[0], b1[2] - f1[2]) || 1;
    let v0 = 1;
    while (v0 > 0.001) {
      let v1 = v0 - big * (0.6 + R() * 0.5) / Math.max(1, H); if (v1 < big * 0.4 / Math.max(1, H)) v1 = 0;
      let u0 = 0, cuts = [];
      while (u0 < 1) { let u1 = u0 + big * (0.9 + R() * 1.4) / dep; if (1 - u1 < big * 0.5 / dep) u1 = 1; cuts.push([u0, u1, (R() - 0.5) * 0.25 * big / dep]); u0 = u1; }
      for (const [a, b, sl] of cuts) {
        const ta = a === 0 ? 0 : a + sl, tb = b === 1 ? 1 : b + sl, poly = [P(a, v1), P(b, v1), P(tb, v0), P(ta, v0)];
        stone(g, poly, P((a + b + ta + tb) / 4, (v0 + v1) / 2), out, ston(), R);
      }
      v0 = v1;
    }
  }

  function wall(scen, W, T) {
    const R = rng(W.seed * 31 + 7), P = [];
    for (let k = 0; k + 1 < W.p.length; k += 2) P.push([W.p[k], W.p[k + 1]]);
    const n = P.length, seg = [];
    for (let i = 0; i + 1 < n; i++) { const dx = P[i + 1][0] - P[i][0], dz = P[i + 1][1] - P[i][1], L = Math.hypot(dx, dz) || 1; seg.push({ L, tx: dx / L, tz: dz / L, nx: dz / L, nz: -dx / L }); }
    // the face's side: the lower ground (the terrace's earth is behind the wall, uphill)
    let lo = 0; for (let i = 0; i < seg.length; i++) { const s = seg[i], mx = (P[i][0] + P[i + 1][0]) / 2, mz = (P[i][1] + P[i + 1][1]) / 2;
      lo += vrGround(mx - s.nx * 7, mz - s.nz * 7) - vrGround(mx + s.nx * 7, mz + s.nz * 7); }
    const sgn = lo >= 0 ? 1 : -1; for (const s of seg) { s.nx *= sgn; s.nz *= sgn; }
    // the corners' mitred normals (outward), the ground in front and behind, the top
    const V = P.map((p, i) => {
      const a = seg[Math.max(0, i - 1)], b = seg[Math.min(seg.length - 1, i)];
      let mx = a.nx + b.nx, mz = a.nz + b.nz; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
      const m = clamp(1 / Math.max(0.35, mx * b.nx + mz * b.nz), 1, 2.2);
      const gF = Math.min(vrGround(p[0] + mx * 1.2, p[1] + mz * 1.2), vrGround(p[0], p[1])), gB = vrGround(p[0] - mx * 5, p[1] - mz * 5);
      return { x: p[0], z: p[1], mx: mx * m, mz: mz * m, foot: gF - 0.7, top: Math.max(gF + W.h, gB + 0.9) };
    });
    for (let i = 1; i < n; i++) V[i].top = Math.max(V[i].top, V[i - 1].top - 1.6 * seg[i - 1].L / 8);   // (the top steps down no steeper than the ground's own fall)
    for (let i = n - 2; i >= 0; i--) V[i].top = Math.max(V[i].top, V[i + 1].top - 1.6 * seg[i].L / 8);
    const ston = () => { const t = 0.56 + R() * 0.16, w = (R() - 0.5) * 0.05, q = R() < 0.12 ? -0.08 : 0; return [t + 0.03 + w + q, t + 0.01 + q, t - 0.04 - w * 0.5 + q]; };
    const cope = [0.6, 0.58, 0.53], grass = [0.46, 0.5, 0.3], earth = [0.4, 0.38, 0.3];
    for (let i = 0; i + 1 < n; i++) {
      const A = V[i], B = V[i + 1], s = seg[i], L = s.L, g = scen.get((A.x + B.x) / 2, (A.z + B.z) / 2), out = [s.nx, 0, s.nz];
      // a point of the face: u along the segment (0..L), d down from the top (the face leans back: lower is further out)
      const at = (u, d) => { const t = clamp(u / L, 0, 1), mx = lerp(A.mx, B.mx, t), mz = lerp(A.mz, B.mz, t), o = d * BATTER;
        return [lerp(A.x, B.x, t) + mx * o, lerp(A.top, B.top, t) - d, lerp(A.z, B.z, t) + mz * o]; };
      // the courses: their boundaries are broken lines (knots every ~0.7-1.6 m, each up or down a little), shared by the stones above and below
      const D = Math.max(A.top - A.foot, B.top - B.foot) + 0.2, rows = [0];
      for (let d = 0; d < D;) { d += W.big * (0.6 + R() * 0.55) * (d > D * 0.5 ? 1.25 : 1); if (D - d < W.big * 0.45) d = D; rows.push(d); }
      const knots = rows.map((d, r) => { const K = []; for (let u = 0; u <= L;) { K.push([u, r === 0 || r === rows.length - 1 ? 0 : (R() - 0.5) * W.big * 0.36]); u += W.big * (0.7 + R() * 0.9); }
        K[K.length - 1][0] = L; if (K.length < 2) K.push([L, 0]); return K; });
      const bd = (r, u) => { const K = knots[r]; let j = 0; while (j + 1 < K.length && K[j + 1][0] < u) j++; const a = K[j], b = K[Math.min(j + 1, K.length - 1)];
        return rows[r] + (b[0] > a[0] ? lerp(a[1], b[1], clamp((u - a[0]) / (b[0] - a[0]), 0, 1)) : a[1]); };
      for (let r = 0; r + 1 < rows.length; r++) {
        // the stones of a course: widths 0.9-2.6 x the course's height, the joints between them slanted (shared by the two neighbours)
        const hgt = rows[r + 1] - rows[r]; let u0t = 0, u0b = 0;
        while (u0t < L - 0.05 || u0b < L - 0.05) {
          const w = hgt * (0.9 + R() * 1.7), sl = (R() - 0.5) * hgt * 0.5;
          let u1t = Math.min(L, u0t + w + sl), u1b = Math.min(L, u0b + w - sl);
          if (L - u1t < hgt * 0.5) u1t = L; if (L - u1b < hgt * 0.5) u1b = L;
          const poly = [];
          poly.push(at(u0b, bd(r + 1, u0b)));
          for (const [ku] of knots[r + 1]) if (ku > u0b + 0.05 && ku < u1b - 0.05) poly.push(at(ku, bd(r + 1, ku)));   // (the bottom edge, along the knots)
          poly.push(at(u1b, bd(r + 1, u1b)), at(u1t, bd(r, u1t)));
          const top = []; for (const [ku] of knots[r]) if (ku > u0t + 0.05 && ku < u1t - 0.05) top.push(at(ku, bd(r, ku)));
          for (let j = top.length - 1; j >= 0; j--) poly.push(top[j]);
          poly.push(at(u0t, bd(r, u0t)));
          const um = (u0t + u1t + u0b + u1b) / 4, ctr = at(um, (rows[r] + rows[r + 1]) / 2);
          // (a course wholly under the ground at both ends of the stone: not drawn)
          const t = clamp(um / L, 0, 1); if (lerp(A.top, B.top, t) - rows[r] < lerp(A.foot, B.foot, t) - 0.3) { u0t = u1t; u0b = u1b; continue; }
          stone(g, poly, ctr, out, ston(), R);
          u0t = u1t; u0b = u1b;
        }
      }
      // the coping (a band of flat stones), the terrace behind it, its back down into the ground
      const tA = [A.x, A.top, A.z], tB = [B.x, B.top, B.z], back = (p, Q, w) => [p[0] - Q.mx * w, p[1], p[2] - Q.mz * w];
      const cA = back(tA, A, COPE), cB = back(tB, B, COPE), eA = back(tA, A, COPE + TERR), eB = back(tB, B, COPE + TERR);
      g.quadUp(tA, tB, cB, cA, [cope, cope, cope, cope]);
      g.quadUp(cA, cB, eB, eA, [grass, grass, grass, grass]);
      const gA = Math.min(A.top, vrGround(eA[0], eA[2]) - 0.5), gB = Math.min(B.top, vrGround(eB[0], eB[2]) - 0.5);
      if (gA < A.top - 0.05 || gB < B.top - 0.05) g.quadO(eA, eB, [eB[0], gB, eB[2]], [eA[0], gA, eA[2]], earth, [(A.x + B.x) / 2, (A.top + B.top) / 2, (A.z + B.z) / 2]);
      // the face's ends at the wall's two ends (the terrace's edge, of stones too: the end seen from the road as the car comes up to it)
      if (i === 0 || i === n - 2) { const E = i === 0 ? A : B, tE = i === 0 ? tA : tB, eE = i === 0 ? eA : eB, sg = i === 0 ? -1 : 1;
        endCap(g, [E.x + E.mx * (E.top - E.foot) * BATTER, E.foot, E.z + E.mz * (E.top - E.foot) * BATTER], tE, eE, [eE[0], E.foot, eE[2]], [s.tx * sg, 0, s.tz * sg], W.big, ston, R); }
    }
  }

  World.ext.cusco = (scene, tex, opts) => World.gore.build(scene, tex, opts, {
    seed: 2121, snow: 'none',
    road: { line: 'yellow' },
    trees: { kinds: ['gum'], forest: 0.14 },
    skiers: 0, nets: false, snowbanks: false,
    animals: [],
    keepOut,
    extra: (ctx) => { for (const W of WALLS) wall(ctx.scen, W, API.T); if (World.ext.goreRob) World.ext.goreRob(ctx, 'cusco'); },   // (the landmark: this one call; a Blender model (.glb in assets/landmarks/, odločitev 15. 11.) replaces wall() here, WALLS and keepOut stay its place)
  });
})();
