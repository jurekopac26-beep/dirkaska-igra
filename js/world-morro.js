/* =========================================================================
   WORLD — Santiago de Cuba, Cuba (theme 'morro'): the last 0.76 km of the coast road out to the El Morro fortress at the mouth of the bay.
   The short-road builder (js/world-gore.js) gives the terrain, the road, the palms and the scrub; here: the sea round the headland (the
   Caribbean to the south and west, the bay channel under the fort) and the fortress itself, its outline from OpenStreetMap: the terraces
   stepping down the cliff to the sea, battered stone walls with a cordon and a parapet with merlons, sentry boxes on the salient corners,
   the gate on the land side with the bridge over the dry moat, the low wall of the glacis, a small light tower, the guns on the lower
   battery. No inscriptions, no statues. The camera behind the car sees it from the road's last bends and the turning space at its end.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.gore) return;
  const API = World.api;
  const { GB, VRC, VRT, addShore, box, clamp, cone, cyl, inPoly, lerp, ouRod, rng, shoreBand, sstep, vary, vrFar, vrGH, vrGround, waterMat, waterline } = API;

  const Y0 = -13.23;   // the sea's level (world y; the track's base is 14.23 m above it)

  // the fortress (OpenStreetMap outlines, metres: x east, z south) and the level of each terrace's top (world y)
  const PARTS = [
    { top: 57, gar: 1, poly: [[-770.3, 113.3], [-768.4, 112.9], [-746.3, 108.3], [-747.1, 105], [-731.7, 101.2], [-722.9, 99.7], [-724.1, 119.5], [-731.9, 120.4], [-731.2, 134.1], [-730.6, 147.1], [-722.4, 147.1], [-716.5, 169.6], [-730.2, 166.7], [-737, 172.5], [-745.7, 161.4], [-759.2, 155.5], [-757.1, 145], [-754.4, 145.5], [-755.3, 126.6], [-755.5, 121.8], [-767.9, 121]] },   // the main body (the gate in its east face)
    { top: 48, poly: [[-770.3, 113.3], [-768.4, 112.9], [-768.7, 107.6], [-780.1, 107.3], [-779.8, 121.1], [-768.9, 121.3], [-766.9, 125.3], [-755.3, 126.6], [-755.5, 121.8], [-767.9, 121]] },
    { top: 41, poly: [[-781.8, 127.3], [-771, 127.6], [-771, 132.7], [-757.1, 145], [-759.2, 155.5], [-772.1, 141.8], [-781.6, 141.7]] },
    { top: 34, gar: 1, poly: [[-780.1, 107.3], [-799.2, 122.3], [-787.7, 132.2], [-787.2, 141.9], [-781.6, 141.7], [-781.8, 127.3], [-771, 127.6], [-771, 132.7], [-757.1, 145], [-754.4, 145.5], [-755.3, 126.6], [-766.9, 125.3], [-768.9, 121.3], [-779.8, 121.1]] },
    { top: 14, gar: 1, guns: 1, poly: [[-791.2, 165.4], [-793, 153.8], [-819.4, 134.4], [-815.8, 125.9], [-784, 95.5], [-787, 94.3], [-813.3, 112], [-839, 128.8], [-839.7, 135.8]] },   // the lower battery over the water
    { top: 6, poly: [[-832.9, 113.9], [-828.2, 117.8], [-842.1, 127.1], [-843.1, 136.2], [-836.5, 141.1], [-842.7, 145.8], [-854, 137.3], [-854.6, 129.4]] },
    { top: 1, poly: [[-847.1, 110], [-842.9, 119.6], [-856.2, 128.1], [-855.6, 135.7], [-866, 127.5], [-861.3, 118.4]] },
  ];
  const GLACIS = [[-729, 91.1], [-706.7, 79.7], [-711.7, 120.3], [-694.4, 134.3], [-711.7, 149], [-704.2, 172.5], [-709.7, 186.8], [-716.4, 181.3], [-710.2, 170.9], [-716.3, 146.2], [-700.7, 134.3], [-716.4, 122.7], [-713.7, 94], [-718.7, 90.8], [-726.1, 94.1]];
  const PATH = [[-691.7, 142], [-701.5, 144.1], [-708.6, 148.7], [-710.4, 144.8], [-715.1, 134.1]];   // the footway from the road's end to the bridge
  const GATE = { x: -731.2, z: 134.1, deck: 52 };

  const STONE = [0.84, 0.72, 0.53], CORD = [0.92, 0.84, 0.68], TOPC = [0.74, 0.68, 0.58], CLIFF = [0.62, 0.57, 0.5], DARK = [0.08, 0.07, 0.06], IRON = [0.1, 0.1, 0.11];

  function seaAndFort(ctx) {
    const { out, root, scen, P } = ctx, T = API.T, iE = T.N - 1, R = rng(4242);

    /* ---- the sea: 40 m cells over the water near the coast (the colour of its depth), big sheets beyond out to the horizon (west and south),
       its waves; along the coast line a band with the paler shallows and the foam at the foot of the cliffs ---- */
    {
      const G = P.G, X0 = G.x0, Z0 = G.z0, X1 = G.x0 + G.ntx * VRC * VRT, Z1 = G.z0 + G.ntz * VRC * VRT, C = 40, g = new GB(true), uv = (x, z) => [x / 22, -z / 22];
      const deepC = [0.16, 0.4, 0.6], seaC = (x, z) => { const t = sstep(1.5, 25, Y0 - vrFar(x, z)); return [lerp(0.36, deepC[0], t), lerp(0.74, deepC[1], t), lerp(0.74, deepC[2], t)]; };   // (turquoise over the shelf, deep blue farther out)
      const quad = (xa, za, xb, zb, far) => g.quadUp([xa, Y0, za], [xb, Y0, za], [xb, Y0, zb], [xa, Y0, zb], far ? [deepC, deepC, deepC, deepC] : [seaC(xa, za), seaC(xb, za), seaC(xb, zb), seaC(xa, zb)], [uv(xa, za), uv(xb, za), uv(xb, zb), uv(xa, zb)]);
      const wet = (x, z) => vrFar(x, z) < Y0 + 0.5, C3 = 3 * C;
      for (let zb = Z0; zb < Z1; zb += C3) for (let xb = X0; xb < X1; xb += C3) {
        const cells = [];
        for (let z = zb; z < Math.min(Z1, zb + C3); z += C) for (let x = xb; x < Math.min(X1, xb + C3); x += C) {
          if (!(wet(x, z) || wet(x + C, z) || wet(x, z + C) || wet(x + C, z + C) || wet(x + C / 2, z + C / 2))) continue;
          cells.push([x, z, vrFar(x, z) < Y0 - 22 && vrFar(x + C, z + C) < Y0 - 22 && vrFar(x + C, z) < Y0 - 22 && vrFar(x, z + C) < Y0 - 22]); }
        if (cells.length === 9 && cells.every(c => c[2]) && zb + C3 <= Z1 && xb + C3 <= X1) quad(xb, zb, xb + C3, zb + C3, 1);
        else for (const [x, z] of cells) quad(x, z, x + C, z + C);
      }
      const F = 9000, xs = Math.min(T.px[iE], T.px[0]) - 120;   // (the open sea: everything west of the grid, and south of it on the fort's side)
      quad(X0 - F, Z0 - F, X0, Z1 + F, 1); quad(X0, Z1, xs, Z1 + F, 1);
      const WO = { len: 2.4, amp: 1.2, refl: 0.34, shal: 0.75, lap: 1, surf: 1 }, sea = new THREE.Mesh(g.geometry(), waterMat(ctx.tex, Object.assign({ color: 0xffffff, vc: true }, WO)));
      sea.receiveShadow = true; sea.matrixAutoUpdate = false; root.add(sea); out.dyn.water = ctx.tex.water;
      const nI = Math.floor((G.nx - 1) / 2), nJ = Math.floor((G.nz - 1) / 2), HG = new Float32Array((nI + 1) * (nJ + 1));
      for (let j = 0; j <= nJ; j++) for (let i = 0; i <= nI; i++) { const ii = i * 2, jj = j * 2, ti = Math.min(G.ntx - 1, Math.floor(ii / VRT)), tj = Math.min(G.ntz - 1, Math.floor(jj / VRT));
        HG[j * (nI + 1) + i] = G.on[tj * G.ntx + ti] ? vrGH(ii, jj) : vrFar(G.x0 + ii * VRC, G.z0 + jj * VRC); }
      const wl = waterline((i, j) => HG[clamp(j, 0, nJ) * (nI + 1) + clamp(i, 0, nI)], G.x0, G.z0, 10, 0, nI, 0, nJ, Y0 - 0.05);
      addShore(root, shoreBand(G.x0, G.z0, G.x0 + nI * 10, G.z0 + nJ * 10, Y0 + 0.015, wl, 22, { F: 4, col: seaC }), sea.material, WO);
    }

    /* ---- the fortress ---- */
    const cen = (poly) => { let x = 0, z = 0; for (const p of poly) { x += p[0]; z += p[1]; } return [x / poly.length, z / poly.length]; };
    const g = scen.get(-760, 132), gd = scen.get(-830, 130);
    const area = (poly) => { let a = 0; for (let k = 0; k < poly.length; k++) { const p = poly[k], q = poly[(k + 1) % poly.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
    const outN = (poly) => { const s = area(poly) > 0 ? 1 : -1; return poly.map((p, k) => { const q = poly[(k + 1) % poly.length], dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1; return [s * dz / l, -s * dx / l]; }); };
    const offset = (poly, en, d) => poly.map((p, k) => { const a = en[(k + poly.length - 1) % poly.length], b = en[k], dt = Math.max(0.35, 1 + a[0] * b[0] + a[1] * b[1]), dk = typeof d === 'function' ? d(k) : d;
      return [p[0] + (a[0] + b[0]) * dk / dt, p[1] + (a[1] + b[1]) * dk / dt]; });
    const shade = (c, k) => c.map(v => v * k);
    const guns = [], garitas = [];
    for (const part of PARTS) {
      const poly = part.poly, n = poly.length, en = outN(poly), [cx, cz] = cen(poly), sg = part.top < 20 ? gd : g;
      // the top: above all the ground under the outline
      let gMax = -1e9; const eMin = poly.map((p, k) => { const q = poly[(k + 1) % n], e = en[k], L = Math.hypot(q[0] - p[0], q[1] - p[1]), m = Math.max(1, Math.ceil(L / 2)); let lo = 1e9;   // (the lowest ground along each edge, a little outside it: the wall's foot under it all)
        for (let q2 = 0; q2 <= m; q2++) { const x = lerp(p[0], q[0], q2 / m) + e[0] * 2, z = lerp(p[1], q[1], q2 / m) + e[1] * 2; lo = Math.min(lo, vrGround(x, z)); } return lo; });
      const gAt = poly.map((p, k) => Math.min(eMin[k], eMin[(k + n - 1) % n]));
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      for (let x = x0; x <= x1; x += 3) for (let z = z0; z <= z1; z += 3) if (inPoly(poly, x, z)) gMax = Math.max(gMax, vrGround(x, z));
      for (const [x, z] of poly) gMax = Math.max(gMax, vrGround(x, z));
      const top = Math.max(part.top, gMax + 1.2), yc = top - 2.2, par = top + 0.95;
      const base = gAt.map(h => Math.max(Y0 - 0.8, Math.min(h, top) - 1.5)), bat = base.map(b => Math.min(3, (yc - b) * 0.12));
      const ringB = offset(poly, en, (k) => bat[k]), ringC = offset(poly, en, 0.28);
      const inPt = (k, y) => { const p = poly[k], q = poly[(k + 1) % n], e = en[k]; return [(p[0] + q[0]) / 2 - e[0] * 2, y, (p[1] + q[1]) / 2 - e[1] * 2]; };
      for (let k = 0; k < n; k++) { const k2 = (k + 1) % n, a = poly[k], b = poly[k2], e = en[k], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (L < 0.3) continue;
        // the battered lower wall (the cliff's rock at its foot), the cordon, the upright wall to the parapet and its inner face
        const cA = vary(STONE, R, 0.06), cB = vary(STONE, R, 0.06), low = (y) => y < yc - 12 ? lerp(1, 0, clamp((yc - 12 - y) / 8, 0, 1)) : 1;
        const colAt = (c, y) => { const t = low(y), w = y < Y0 + 0.5 ? 0.6 : 1; return [lerp(CLIFF[0], c[0], t) * w, lerp(CLIFF[1], c[1], t) * w, lerp(CLIFF[2], c[2], t) * w]; };   // (wet and dark where it stands in the sea)
        const bA = [ringB[k][0], base[k], ringB[k][1]], bB = [ringB[k2][0], base[k2], ringB[k2][1]], tA = [a[0], yc, a[1]], tB = [b[0], yc, b[1]];
        sg.quadO(bA, bB, tB, tA, null, inPt(k, (yc + base[k]) / 2), null, [colAt(shade(cA, 0.82), base[k]), colAt(shade(cB, 0.82), base[k2]), cB, cA]);
        const rA = ringC[k], rB = ringC[k2];
        sg.quadO([rA[0], yc - 0.05, rA[1]], [rB[0], yc - 0.05, rB[1]], [rB[0], yc + 0.35, rB[1]], [rA[0], yc + 0.35, rA[1]], CORD, inPt(k, yc));
        sg.quadO([rA[0], yc + 0.35, rA[1]], [rB[0], yc + 0.35, rB[1]], [b[0], yc + 0.35, b[1]], [a[0], yc + 0.35, a[1]], shade(CORD, 1.05), [cx, yc - 3, cz]);
        sg.quadO([a[0], yc + 0.35, a[1]], [b[0], yc + 0.35, b[1]], [b[0], par, b[1]], [a[0], par, a[1]], null, inPt(k, top), null, [cA, cB, shade(cB, 1.04), shade(cA, 1.04)]);
        const ia = [a[0] - (e[0] + en[(k + n - 1) % n][0]) * 0.55, a[1] - (e[1] + en[(k + n - 1) % n][1]) * 0.55], ib = [b[0] - (e[0] + en[k2][0]) * 0.55, b[1] - (e[1] + en[k2][1]) * 0.55];
        sg.quadO([a[0], par, a[1]], [b[0], par, b[1]], [ib[0], par, ib[1]], [ia[0], par, ia[1]], shade(CORD, 0.96), [cx, par - 3, cz]);
        sg.quadO([ia[0], top, ia[1]], [ib[0], top, ib[1]], [ib[0], par, ib[1]], [ia[0], par, ia[1]], shade(STONE, 0.8), [(a[0] + b[0]) / 2 + e[0] * 3, top, (a[1] + b[1]) / 2 + e[1] * 3]);
        // the merlons: 3.2 m of wall, 0.8 m embrasures (none on the shortest edges)
        if (L > 5) { const m = Math.max(1, Math.round(L / 4)), st = L / m, rot = Math.atan2(b[1] - a[1], b[0] - a[0]);
          for (let q = 0; q < m; q++) { const t = (q + 0.5) * st / L, mx = lerp(a[0], b[0], t) - e[0] * 0.5, mz = lerp(a[1], b[1], t) - e[1] * 0.5;
            box(sg, mx, par - 0.02, mz, st - 0.8, 0.75, 1.0, rot, vary(STONE, R, 0.05), shade(CORD, 0.96), true); } }
        if (part.guns && L > 20 && e[0] < 0.2) for (let t = 6; t < L - 4; t += 8) guns.push([lerp(a[0], b[0], t / L), lerp(a[1], b[1], t / L), e, top]);   // (the guns on the battery's seaward faces)
      }
      // the paved top
      const shp = poly.map(p => new THREE.Vector2(p[0], p[1])), tris = THREE.ShapeUtils.triangulateShape(shp, []);
      for (const [i, j, k] of tris) sg.triUp([poly[i][0], top, poly[i][1]], [poly[j][0], top, poly[j][1]], [poly[k][0], top, poly[k][1]], [vary(TOPC, R, 0.04), vary(TOPC, R, 0.04), vary(TOPC, R, 0.04)]);
      // the sentry boxes on the salient corners
      if (part.gar) for (let k = 0; k < n; k++) { const a = en[(k + n - 1) % n], b = en[k], cr = a[0] * b[1] - a[1] * b[0], turn = Math.acos(clamp(a[0] * b[0] + a[1] * b[1], -1, 1));
        if (turn < 0.6 || cr * (area(poly) > 0 ? 1 : -1) > 0) continue;
        const d = Math.hypot(a[0] + b[0], a[1] + b[1]) || 1; garitas.push({ x: poly[k][0] + (a[0] + b[0]) / d * 0.5, z: poly[k][1] + (a[1] + b[1]) / d * 0.5, y: par, ox: (a[0] + b[0]) / d, oz: (a[1] + b[1]) / d, t: turn, sg }); }
    }
    garitas.sort((p, q) => q.t - p.t);
    for (const s of garitas.slice(0, 14)) {
      cyl(s.sg, s.x, s.y - 1.6, s.z, 0.35, 1.6, 8, shade(STONE, 0.9), null, 0.95);   // (the corbel under it)
      cyl(s.sg, s.x, s.y, s.z, 0.95, 2.3, 8, vary(STONE, R, 0.05));
      cone(s.sg, s.x, s.y + 2.3, s.z, 1.08, 0.95, 8, shade(CORD, 0.98), shade(CORD, 1.05), 0);
      box(s.sg, s.x + s.ox * 0.93, s.y + 1.1, s.z + s.oz * 0.93, 0.16, 0.7, 0.18, Math.atan2(s.oz, s.ox), DARK, null, true);   // (the slit)
    }
    // the guns: dark barrels over the parapet, out to sea
    for (const [x, z, e, top] of guns) { const y = top + 0.75; ouRod(gd, [x - e[0] * 1.2, y - 0.1, z - e[1] * 1.2], [x + e[0] * 1.6, y + 0.12, z + e[1] * 1.6], 0.17, IRON, 6);
      box(gd, x - e[0] * 1.3, top, z - e[1] * 1.3, 1.4, 0.6, 1.2, Math.atan2(e[1], e[0]), [0.24, 0.2, 0.16], null, true); }

    // the gate in the east face (a dark arched opening on the batter) and the bridge over the dry moat
    {
      const { x, z, deck } = GATE, fx = (y) => x + 0.12 + Math.max(0, (57 - 2.2 - y) * 0.12), w = 1.6, h = 3.2, nA = 8, pts = [];
      for (let q = 0; q <= nA; q++) { const a = q / nA * Math.PI; pts.push([Math.cos(a) * w, h + Math.sin(a) * w * 0.85]); }
      const fr = (o, sc) => pts.map(([u, v]) => [fx(deck + v * sc) + o, deck + v * sc, z + u * sc]);
      const outer = fr(0.02, 1.25), inner = fr(0.06, 1);
      const P0 = [fx(deck) + 0.06, deck, z - w], P1 = [fx(deck) + 0.06, deck, z + w];
      const ins = [x - 2, deck + 2, z];
      g.quadO(P0, P1, inner[0], inner[nA], DARK, ins);
      for (let q = 0; q < nA; q++) g.triO([fx(deck + h) + 0.06, deck + h, z], inner[q], inner[q + 1], DARK, ins);
      for (let q = 0; q < nA; q++) g.quadO(outer[q], outer[q + 1], inner[q + 1], inner[q], CORD, ins);   // (the arch's dressed stones)
      g.quadO([fx(deck) + 0.03, deck, z - w * 1.25], [fx(deck) + 0.03, deck, z - w], inner[nA], outer[nA], CORD, ins);
      g.quadO([fx(deck) + 0.03, deck, z + w], [fx(deck) + 0.03, deck, z + w * 1.25], outer[0], inner[0], CORD, ins);
      // the bridge: a stone deck on two piers, low parapets
      const xa = -715.1, xb = fx(deck) + 0.1, mx = (xa + xb) / 2, Lb = xa - xb, BW = 3.6;
      box(g, mx, deck - 0.9, z, Lb, 0.9, BW, 0, shade(STONE, 0.92), [0.55, 0.5, 0.43]);
      for (const s of [-1, 1]) box(g, mx, deck, z + s * (BW / 2 - 0.15), Lb, 0.85, 0.3, 0, vary(STONE, R, 0.04), shade(CORD, 0.96), true);
      for (const px of [mx - Lb * 0.22, mx + Lb * 0.22]) { const gy = Math.min(vrGround(px, z - 1.5), vrGround(px, z + 1.5)) - 0.5; box(g, px, gy, z, 2.2, deck - 0.9 - gy, BW - 0.2, 0, shade(STONE, 0.86), null, true); }
      // the footway from the road's end
      const pv = [0.56, 0.52, 0.46];
      for (let k = 0; k + 1 < PATH.length; k++) { const a = PATH[k], b = PATH[k + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l * 1.5, nz = dx / l * 1.5;
        const st = Math.max(1, Math.ceil(l / 3));
        for (let q = 0; q < st; q++) { const p0 = [lerp(a[0], b[0], q / st), lerp(a[1], b[1], q / st)], p1 = [lerp(a[0], b[0], (q + 1) / st), lerp(a[1], b[1], (q + 1) / st)], y = (p) => (p[0] < -713 ? deck : vrGround(p[0], p[1])) + 0.06;
          const A = [p0[0] - nx, 0, p0[1] - nz], B = [p0[0] + nx, 0, p0[1] + nz], Cc = [p1[0] + nx, 0, p1[1] + nz], D = [p1[0] - nx, 0, p1[1] - nz];
          for (const v of [A, B, Cc, D]) v[1] = y([v[0], v[2]]);
          g.quadUp(A, B, Cc, D, [pv, pv, pv, pv]); } }
    }
    // the glacis: a low stone wall along its outline
    for (let k = 0; k < GLACIS.length; k++) { const a = GLACIS[k], b = GLACIS[(k + 1) % GLACIS.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), rot = Math.atan2(b[1] - a[1], b[0] - a[0]), m = Math.max(1, Math.ceil(L / 4));
      for (let q = 0; q < m; q++) { const t = (q + 0.5) / m, x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t), y = vrGround(x, z);
        box(g, x, y - 1, z, L / m + 0.1, 2.1, 0.7, rot, vary(STONE, R, 0.05), shade(CORD, 0.95), true); } }
    // on the main body: a small light tower with its lantern and two low barrack blocks
    { const tx = -746, tz = 140, ty = 57; box(g, tx, ty, tz, 3.2, 8, 3.2, 0.2, [0.86, 0.83, 0.76], [0.7, 0.66, 0.6]);
      cyl(g, tx, ty + 8, tz, 1.05, 1.6, 8, [0.2, 0.24, 0.26], null); cone(g, tx, ty + 9.6, tz, 1.3, 0.9, 8, [0.3, 0.3, 0.3], [0.2, 0.2, 0.2], 0);
      box(g, tx, ty + 8, tz, 3.6, 0.2, 3.6, 0.2, [0.7, 0.66, 0.6]);
      box(g, -741, ty, 124, 9, 3.4, 5, 0.05, vary(STONE, R, 0.05), [0.62, 0.57, 0.5]); box(g, -738, ty, 156, 7, 3.0, 5, 1.2, vary(STONE, R, 0.05), [0.62, 0.57, 0.5]); }
  }

  World.ext.morro = (scene, tex, opts) => World.gore.build(scene, tex, opts, {
    seed: 1717, snow: 'none', seaY: Y0,
    ground: { grass: [0.5, 0.52, 0.28], forest: [0.28, 0.36, 0.18], shrub: [0.38, 0.42, 0.22], built: [0.62, 0.58, 0.5], rock: [0.6, 0.55, 0.46], dry: [0.66, 0.58, 0.4] },
    road: { line: 'white' },
    trees: { kinds: ['palm', 'broad'], forest: 0.12, open: 0.02, near: 3, h: [7, 13] },
    poles: false, nets: false, snowbanks: false, lifts: false, skiers: 0, animals: [], dryLakes: true,
    clear: [[-745, 135, 45], [-790, 125, 30], [-815, 130, 30], [-850, 128, 18], [-712, 135, 30]],
    prep(P) {   // the sea floor: the coast's shallow model cells deepened (the noise of the far terrain would lift it over the water), the dry moat's floor
      const b = P.D.base; for (let k = 0; k < P.dem.length; k++) if (P.dem[k] + b < 1) P.dem[k] = -b - 8;
      for (const L of P.lakes) if (L.cx > -745 && L.cx < -700 && L.cz > 95 && L.cz < 185) L.h = 44.5;
      P.G.h.fill(NaN);
    },
    extra(ctx) { seaAndFort(Object.assign({ tex }, ctx)); },
  });
})();
