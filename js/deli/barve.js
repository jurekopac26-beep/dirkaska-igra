/* Deli iz garaže, sklop 3 · barve: barva, crte, stevilke, nalepke, gume, soncni_pas, zatemnitev, luc_pod_avtom, celjusti (the contract:
   docs/deli.md). Loaded after js/deli.js, before the cars.
     Drawn in the body (DELI.add, the car's build calls K.deli(id, stock) where its mounts say):
       crte        racing stripes over the bonnet, the roof and the tailgate (K.strp: the stripes' colour, car.stripeCol or the game's),
                   the stock side stripe kept (the car's around); mounts.crte { z: [in, out] the band they lie in across, beside a
                   bonnet's scoop }
       stevilke    start number panels (K.number: the car's own number) on roundels: the roof (the stock decal then hidden), the doors,
                   the tailgate's glass; mounts.stevilke { roof: [x, z], door: [x, y, h], glass: [x, y, z, lean] }
       nalepke     decals on the sides, the bonnet beside its scoop and the roof (liveries); mounts.nalepke { side: [[x0, x1] ...] the
                   flat side's free stretches, y: [y0, y1] above the stripe, hood: { x: [x0, x1], z: [z0, z1] }, roof: { x: [x0, x1] } }
       soncni_pas  a band across the windscreen's top (texts in a 5 x 7 pixel font: generic or fictional); mounts.soncni_pas { x: [top,
                   foot], w: its half width }
       celjusti    the brake calipers behind the rims' spokes (in the body: they never spin; a steered wheel turns past them a little);
                   mounts.celjusti { r: [r0, r1] (m from the hub), a: [a0, a1] (degrees from forward, up) }
     The car's look (no shape of the body's: DELI.add with nothing to draw, so the vehicle shows them where its mounts have them):
       barva       the paint's finish (the colour stays car.color): gloss, matte, metallic, pearl, chameleon (this car's material: DELI.dress)
       zatemnitev  the glass's tint (and mirror, chameleon films): the material
       luc_pod_avtom   the underglow: a mesh of its own (additive, no texture) under the car, its colours and modes each frame
       gume        the tyres' look: tread blocks, a band round the outer wall (DELI.tyreLook: render.js kitBuild lays it over the wheels)
   DELI.dress(o) (render.js makeCarMesh, a car with parts): the material's finish and tint, the stripes' and decals' sheen (an attribute
   aDl: 1 paint, 0.66 stripe, 0.33 a reflective decal), the underglow, the body lowered (vzmeti), the tyre smoke's colour (dim_gum:
   js/deli/skriti.js); returns { low, step(dt, car, t, night, braking), smoke(k, t) } */
(function () {
  'use strict';
  if (typeof DELI === 'undefined') return;
  const rad = (d) => d * Math.PI / 180, BLK = [0.03, 0.03, 0.035], WHT = [0.95, 0.95, 0.93], RED = [0.78, 0.07, 0.06], YEL = [0.98, 0.8, 0.1], GOLD = [0.86, 0.66, 0.22];
  const CREAM = [0.93, 0.9, 0.8], CHR = [0.86, 0.87, 0.9];

  // ---- shapes in a plane (u, v): triangles for the decal layers (each convex: L.decal lays them in convex pieces) ----
  const area = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
  function earcut(P0) {   // a simple polygon (no holes) into triangles, ear by ear
    const P = area(P0) < 0 ? P0.slice().reverse() : P0.slice(), T = [], idx = P.map((_, i) => i);
    const cr = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const inside = (p, a, b, c) => cr(a, b, p) >= 0 && cr(b, c, p) >= 0 && cr(c, a, p) >= 0;
    let guard = 0;
    while (idx.length > 3 && guard++ < 500) {
      let cut = false;
      for (let i = 0; i < idx.length; i++) { const ia = idx[(i + idx.length - 1) % idx.length], ib = idx[i], ic = idx[(i + 1) % idx.length], a = P[ia], b = P[ib], c = P[ic];
        if (cr(a, b, c) <= 1e-9) continue;
        if (idx.some(j => j !== ia && j !== ib && j !== ic && inside(P[j], a, b, c))) continue;
        T.push([a, b, c]); idx.splice(i, 1); cut = true; break; }
      if (!cut) break;
    }
    if (idx.length === 3) T.push(idx.map(i => P[i]));
    return T;
  }
  const ell = (cu, cv, ru, rv, n, a0) => Array.from({ length: n }, (_, i) => { const a = (a0 || 0) + i / n * Math.PI * 2; return [cu + Math.cos(a) * ru, cv + Math.sin(a) * rv]; });
  const rect = (u0, v0, u1, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
  const star = (cu, cv, R, rot) => { const P = []; for (let i = 0; i < 10; i++) { const a = (rot || 0) + Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * 0.42 : R; P.push([cu + Math.cos(a) * r, cv + Math.sin(a) * r]); }
    return P.map((p, i) => [[cu, cv], p, P[(i + 1) % 10]]); };   // (a fan from its middle)
  const ring = (cu, cv, r0, r1, n, sv) => Array.from({ length: n }, (_, i) => { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, k = sv || 1;
    return [[cu + Math.cos(a0) * r0, cv + Math.sin(a0) * r0 * k], [cu + Math.cos(a1) * r0, cv + Math.sin(a1) * r0 * k], [cu + Math.cos(a1) * r1, cv + Math.sin(a1) * r1 * k], [cu + Math.cos(a0) * r1, cv + Math.sin(a0) * r1 * k]]; });
  // a lightning bolt from (u0, v0) to (u1, v1), w wide
  const bolt = (u0, v0, u1, v1, w) => { const du = u1 - u0, dv = v1 - v0, L = Math.hypot(du, dv), tu = du / L, tv = dv / L, nu = -tv, nv = tu, at = (s, n) => [u0 + tu * L * s + nu * w * n, v0 + tv * L * s + nv * w * n];
    return [at(0, 0.5), at(0.5, 0.9), at(0.44, 0.15), at(1, 0), at(0.5, -0.9), at(0.56, -0.15), at(0, -0.5)]; };
  // flames: tongues from a base line (u0 at the front, v0..v1 tall) licking back towards u1, each a curved tapered tongue
  const flames = (u0, u1, v0, v1, k, seed) => { const T = []; for (let i = 0; i < k; i++) { const f = (i + 0.5) / k, vc = v0 + (v1 - v0) * f, len = (u1 - u0) * (0.55 + 0.45 * Math.abs(Math.sin(i * 2.3 + (seed || 0)))), hw = (v1 - v0) / k * 0.62;
    const P = [], N = 4; for (let j = 0; j <= N; j++) { const s = j / N, w = hw * (1 - s) ** 0.8, c = Math.sin(s * Math.PI) * hw * 0.8 * (i % 2 ? 1 : -1); P.push([u0 + len * s, vc + c + w]); }
    for (let j = N - 1; j >= 0; j--) { const s = j / N, w = hw * (1 - s) ** 0.8, c = Math.sin(s * Math.PI) * hw * 0.8 * (i % 2 ? 1 : -1); P.push([u0 + len * s, vc + c - w]); }
    T.push(P); } return T; };
  const rnd = (seed) => { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };

  // the layers: polygons (any simple polygon, or triangles) laid on the main loft's side (u = x, v = y) or top (u = x, v = z)
  function layer(K) {
    const LD = K.mainDecal();
    const tris = (poly) => poly.length === 3 ? [poly] : poly.length === 4 && area(poly) !== 0 && convex(poly) ? [poly] : earcut(poly);
    // (on the top: a piece cut where the crown's edge starts across, |z| 0.38 of the top's half width (render.js kitDecal topY: flat in the
    // middle, a straight fall outside it): its corners on the bends, never a chord under the crown)
    const cutV = (P, v, keep) => { const out = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], ia = keep(a[1]), ib = keep(b[1]); if (ia) out.push(a); if (ia !== ib) { const t = (v - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * t, v]); } } return out; };
    const fine = (T) => { const out = []; for (const t of T) { const xc = t.reduce((q, p) => q + p[0], 0) / t.length, zk = LD.prop(xc, 'wt') * 0.38;
      for (const [lo, hi] of [[-9, -zk], [-zk, zk], [zk, 9]]) { const P = cutV(cutV(t, lo, (v) => v >= lo), hi, (v) => v <= hi); if (P.length >= 3 && Math.abs(area(P)) > 1e-9) out.push(P); } } return out; };
    const convex = (P) => { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], c = P[(i + 2) % P.length], z = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]); if (Math.abs(z) < 1e-12) continue; if (s && Math.sign(z) !== s) return false; s = Math.sign(z); } return true; };
    return {
      LD,
      side: (poly, col, lift, sides) => { for (const t of tris(poly)) LD.side(t, col, sides, lift || 0.009); },
      top: (poly, col, lift) => { for (const t of fine(tris(poly))) LD.top(t, col, lift || 0.008); },
      topZ: (poly, col, lift) => { for (const t of fine(tris(poly))) { LD.top(t, col, lift || 0.008); LD.top(t.map(([u, v]) => [u, -v]).reverse(), col, lift || 0.008); } },   // (mirrored across)
    };
  }
  // the top's painted runs along x (the main loft's segments that are not glass: the windscreen 'gf', the rear window 'gr')
  function paintRuns(K, x0, x1) {
    const S = K.body.secs, R = []; let a = null;
    for (let j = 0; j < S.length - 1; j++) { const glass = S[j][7] === 'gf' || S[j][7] === 'gr', xa = S[j][0], xb = S[j + 1][0];
      if (!glass) { if (a == null) a = xa; } else if (a != null) { R.push([a, xa]); a = null; }
      if (j === S.length - 2 && a != null) R.push([a, xb]); }
    return R.map(([a, b]) => [Math.max(a, x0 == null ? -1e9 : x0), Math.min(b, x1 == null ? 1e9 : x1)]).filter(([a, b]) => b - a > 0.004);
  }

  // ================================================================ crte: racing stripes over the top
  // each option: its bands across [z0, z1] (mirrored), the colour of each (S: the stripes' own), the sheen (DELI.dress: STRIPE_FIN)
  function crte(K, n, m) {
    const Z = m.z || [0.27, 0.47], S = K.strp, k = (Z[1] - Z[0]) / 0.2, z = (a) => Z[0] + (a - 0.27) * k, ly = layer(K), runs = paintRuns(K);
    const B = {
      1: [[0.34, 0.38, S]], 2: [[0.29, 0.43, S]], 3: [[0.285, 0.3, BLK], [0.3, 0.42, S], [0.42, 0.435, BLK]], 4: [[0.29, 0.36, S], [0.36, 0.43, BLK]],
      5: [[0.31, 0.41, S]], 6: [[0.29, 0.297, S], [0.31, 0.41, S], [0.423, 0.43, S]], 7: [[0.3, 0.42, S]], 8: [[0.3, 0.42, S]],
      9: [[0.32, 0.4, S]], 10: [[0.3, 0.312, BLK], [0.312, 0.408, S], [0.408, 0.42, BLK]], 11: [[0.29, 0.43, S]], 12: [[0.29, 0.43, S]],
      13: [[0.296, 0.302, GOLD], [0.31, 0.41, S], [0.418, 0.424, GOLD]], 14: [[0.29, 0.3, GOLD], [0.3, 0.42, S], [0.42, 0.43, BLK]],
      15: [[0.27, 0.31, S], [0.33, 0.41, S], [0.43, 0.47, S]], 16: [[0.283, 0.29, CHR], [0.29, 0.43, S], [0.43, 0.437, CHR]] }[n] || [];
    for (const [a, b, col] of B) for (const [xa, xb] of runs) ly.topZ(rect(xa, z(a), xb, z(b)), col, 0.007);
  }

  // ================================================================ stevilke: start number panels on roundels
  // each option: where (roof, doors, glass), the roundel's shape and colour, its ring, the digits' colour, the panel's height
  const NUM = {
    1: { at: 'r', disc: null, sq: WHT, col: BLK }, 2: { at: 'd', disc: WHT, col: BLK }, 3: { at: 'g', sq: [0.2, 0.21, 0.23], col: WHT }, 4: { at: 'rd', sq: WHT, col: BLK },
    5: { at: 'rd', disc: WHT, col: BLK }, 6: { at: 'rd', disc: YEL, col: BLK }, 7: { at: 'rd', disc: 's', col: BLK }, 8: { at: 'rd', disc: WHT, ring: BLK, col: BLK },
    9: { at: 'rd', disc: WHT, col: BLK, refl: true }, 10: { at: 'd', sq: WHT, col: BLK, big: 1.45 }, 11: { at: 'rd', disc: WHT, oval: 1.5, col: BLK }, 12: { at: 'rd', disc: WHT, col: BLK, name: true },
    13: { at: 'rd', disc: CREAM, col: BLK }, 14: { at: 'rd', disc: CREAM, ring: 's', col: BLK }, 15: { at: 'rd', disc: BLK, ring: GOLD, col: GOLD }, 16: { at: 'rd', disc: WHT, ring: RED, ring2: BLK, col: BLK } };
  function stevilke(K, n, m) {
    const o = NUM[n]; if (!o) return; const ly = layer(K), LD = ly.LD, c = (q) => q === 's' ? K.strp : q;
    const roundel = (put, cu, cv, h, rk) => {   // the disc (or the oval, the square panel), its rings, in a layer (put: side or top)
      const R = h * 0.95 * (rk || 1), sv = 1 / (o.oval || 1);
      if (o.disc) put(ell(cu, cv, R * (o.oval || 1), R * (o.oval || 1) * sv, K.hi ? 16 : 10), c(o.disc));
      if (o.ring) for (const q of ring(cu, cv, R * (o.oval || 1), R * (o.oval || 1) + h * 0.12, K.hi ? 12 : 10, sv)) put(q, c(o.ring));
      if (o.ring2 && K.hi) for (const q of ring(cu, cv, R + h * 0.12, R + h * 0.18, 12)) put(q, c(o.ring2));
      if (o.name) { put(rect(cu - h * 0.9, cv + R + h * 0.06, cu + h * 0.9, cv + R + h * 0.3), BLK); for (let i = 0; i < 5; i++) put(rect(cu - h * 0.78 + i * h * 0.33, cv + R + h * 0.12, cu - h * 0.6 + i * h * 0.33, cv + R + h * 0.24), WHT); } };
    const bg = (q) => q === 's' ? K.strp : q || [0.95, 0.95, 0.93];
    if (o.at.includes('r') && m.roof) { const [x, z] = m.roof, h = 0.3, y = LD.topY(x, z);
      roundel((poly, col) => ly.top(poly.map(([u, v]) => [u, v]), col, 0.008), x, z, h, 1.05);
      if (o.sq) ly.top(rect(x - h * 0.62, z - h * 0.82, x + h * 0.62, z + h * 0.82), o.sq, 0.008);
      K.number(x, y + 0.011, z, h, { dir: 'y', col: o.col, bg: bg(o.sq || o.disc) }); }
    if (o.at.includes('d') && m.door) { const [x, y, h0] = m.door, h = h0 * (o.big || 1);
      roundel((poly, col) => ly.side(poly, col, 0.009), x, y, h, 1);
      if (o.sq) ly.side(rect(x - h * 0.75, y - h * 0.6, x + h * 0.75, y + h * 0.6), o.sq, 0.009);
      for (const sd of [-1, 1]) K.number(x, y, sd * (LD.prop(x, 'w') + 0.0125), h, { dir: sd < 0 ? '-z' : 'z', col: o.col, bg: bg(o.sq || o.disc), host: sd < 0 ? 'doorL' : 'doorR' }); }
    if (o.at.includes('g') && m.glass) { const [x, y, z, h] = m.glass; K.number(x, y, z, h, { dir: '-x', col: o.col, bg: o.sq, host: 'trunk' }); }
  }

  // ================================================================ nalepke: decals
  function nalepke(K, n, m) {
    const ly = layer(K), S = K.strp, sd = m.side || [[-0.33, 0.77]], Y = m.y || [0.55, 0.84], H = m.hood, RF = m.roof, y0 = Y[0], y1 = Y[1], ym = (y0 + y1) / 2, yh = y1 - y0;
    const door = sd[0], fen = sd[1] || sd[0], qua = sd[2] || sd[0];
    const FL = [[1, 0.86, 0.12], [1, 0.52, 0.06], [0.86, 0.12, 0.04]];   // (flames: yellow at the root, orange, red at the tips)
    const sideFlames = (x0, x1, k) => { flames(x0, x1, y0 + yh * 0.08, y1 - yh * 0.08, k, 1).forEach((P, i) => ly.side(P.map(([u, v]) => [u, v]), FL[i % 3])); };
    const hoodSide = (fn) => { if (!H) return; const zc = (H.z[0] + H.z[1]) / 2, zw = H.z[1] - H.z[0], xc = (H.x[0] + H.x[1]) / 2, xw = H.x[1] - H.x[0]; fn(xc, zc, xw, zw); };
    const chq = (put, u0, u1, v0, v1, nu, nv, c1, c2) => { const du = (u1 - u0) / nu, dv = (v1 - v0) / nv; for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) put(rect(u0 + i * du, v0 + j * dv, u0 + (i + 1) * du, v0 + (j + 1) * dv), (i + j) % 2 ? c1 : c2); };
    switch (n) {
      case 1: for (const t of star((qua[0] + qua[1]) / 2 + 0.1, ym, yh * 0.46, 0)) ly.side(t, S); break;
      case 2: ly.side(bolt(door[0] + 0.1, y1 - 0.02, door[0] + 0.75, y0 + 0.02, 0.12), S); break;
      case 3: chq((p, c) => ly.side(p, c), fen[0] + 0.05, fen[0] + 0.05 + 0.3, ym - 0.08, ym + 0.08, 6, 3, BLK, WHT); break;
      case 4: sideFlames(fen[0] + 0.02, fen[1] - 0.05, 3); break;
      case 5: hoodSide((xc, zc, xw, zw) => { for (const t of star(xc, zc, Math.min(xw, zw) * 0.45, Math.PI / 2)) ly.topZ(t, S); }); break;
      case 6: hoodSide(() => { flames(H.x[1], H.x[0], H.z[0] + 0.02, H.z[1] - 0.01, 3, 2).forEach((P, i) => ly.topZ(P, FL[i % 3])); }); break;
      case 7: hoodSide(() => { chq((p, c) => ly.topZ(p, c), H.x[1] - 0.15, H.x[1] - 0.01, H.z[0], H.z[1], 3, 7, BLK, WHT); }); break;
      case 8: hoodSide(() => ly.topZ(bolt(H.x[1] - 0.04, H.z[0] + 0.03, H.x[0] + 0.05, H.z[1] - 0.03, 0.09).map(([u, v]) => [u, v]), S)); break;
      case 9: sideFlames(door[1] - 0.02, door[0] + 0.02, 5); break;
      case 10: chq((p, c) => ly.side(p, c), qua[0] + 0.05, fen[1] - 0.05, y1 - 0.12, y1 - 0.03, 24, 2, BLK, WHT); break;
      case 11: {   // dirkalni vzorec: an arrow along each side, a wedge on the bonnet
        ly.side([[fen[1] - 0.05, y1 - 0.03], [qua[0] + 0.25, y1 - 0.03], [qua[0] + 0.05, ym + 0.02], [qua[0] + 0.25, y0 + 0.04], [fen[1] - 0.25, y0 + 0.04]], S);
        ly.side([[fen[1] - 0.05, y1 - 0.12], [fen[1] - 0.2, ym], [fen[1] - 0.05, y0 + 0.13], [fen[1] + 0.02, ym]], BLK);
        hoodSide(() => ly.topZ([[H.x[1] - 0.02, H.z[0] + 0.02], [H.x[1] - 0.02, H.z[1] - 0.02], [H.x[0] + 0.1, H.z[0] + 0.06]], S)); break; }
      case 12: for (const [a, b, col] of [[0.06, 0.1, RED], [0.15, 0.19, YEL], [0.24, 0.28, S]]) ly.side(rect(qua[0] + 0.05, y0 + a * yh / 0.34, fen[1] - 0.05, y0 + b * yh / 0.34), col); break;
      case 13: {   // dirkalna podoba: big swept blocks along the sides, over the bonnet's sides and the roof
        ly.side([[fen[1] - 0.02, y0 + 0.02], [fen[1] - 0.02, y1 - 0.02], [door[0] + 0.3, y1 - 0.02], [door[0] - 0.05, y0 + 0.02]], S);
        ly.side([[door[0] - 0.1, y0 + 0.02], [door[0] + 0.25, y1 - 0.02], [door[0] + 0.12, y1 - 0.02], [door[0] - 0.23, y0 + 0.02]], BLK);
        ly.side([[qua[0] + 0.05, y0 + 0.02], [qua[1] - 0.2, y0 + 0.02], [qua[1] - 0.45, y1 - 0.02], [qua[0] + 0.05, y1 - 0.02]], RED);
        hoodSide(() => ly.topZ(rect(H.x[0], H.z[0], H.x[1], H.z[1]), S));
        if (RF) { ly.top(rect(RF.x[0], -0.22, RF.x[1], 0.22), S); ly.topZ(rect(RF.x[0], 0.22, RF.x[1], 0.28), BLK); } break; }
      case 14: {   // kamuflaža: blobs in greens and browns all over
        const R = rnd(14), C = [[0.24, 0.34, 0.14], [0.5, 0.4, 0.22], [0.08, 0.1, 0.06], [0.62, 0.62, 0.42]];
        for (const [x0, x1] of [qua, door, fen]) for (let i = 0; i < 3; i++) { const u = x0 + 0.08 + R() * (x1 - x0 - 0.16), v = y0 + 0.06 + R() * (yh - 0.12); ly.side(ell(u, v, 0.11 + R() * 0.08, 0.06 + R() * 0.05, 5, R() * 3), C[i % 4]); }
        hoodSide(() => { for (let i = 0; i < 3; i++) ly.topZ(ell(H.x[0] + 0.1 + R() * (H.x[1] - H.x[0] - 0.2), H.z[0] + 0.05 + R() * (H.z[1] - H.z[0] - 0.1), 0.08, 0.05, 7, R() * 3), C[(i + 1) % 4]); });
        if (RF) for (let i = 0; i < 4; i++) ly.top(ell(RF.x[0] + 0.1 + R() * (RF.x[1] - RF.x[0] - 0.2), (R() - 0.5) * 0.7, 0.12, 0.07, 7, R() * 3), C[i % 4]); break; }
      case 15: {   // retro dirkalna: a broad band over the roof and the bonnet's sides, a roundel-like disc on the doors, pinstripes along
        if (RF) ly.top(rect(RF.x[0], -0.18, RF.x[1], 0.18), S);
        hoodSide(() => ly.topZ(rect(H.x[0], H.z[0], H.x[1], H.z[0] + 0.12), S));
        ly.side(rect(qua[0] + 0.05, y1 - 0.05, fen[1] - 0.05, y1 - 0.035), GOLD);
        ly.side(ell((door[0] + door[1]) / 2 + 0.25, ym, yh * 0.4, yh * 0.4, K.hi ? 18 : 12), CREAM); break; }
      case 16: {   // po meri: a pattern of triangles in the stripes' colour and black
        const R = rnd(16); for (const [x0, x1] of [qua, door, fen]) for (let i = 0; i < 3; i++) { const u = x0 + 0.06 + i * (x1 - x0 - 0.12) / 3, w = (x1 - x0 - 0.12) / 3;
          ly.side([[u, y0 + 0.03], [u + w * 0.9, y0 + 0.03 + R() * 0.05], [u + w * (0.3 + R() * 0.4), y1 - 0.03]], i % 2 ? BLK : S); }
        hoodSide(() => ly.topZ([[H.x[0] + 0.05, H.z[0]], [H.x[1] - 0.03, (H.z[0] + H.z[1]) / 2], [H.x[0] + 0.05, H.z[1]]], BLK));
        if (RF) ly.topZ([[RF.x[0] + 0.1, 0.05], [RF.x[1] - 0.1, 0.05], [RF.x[1] - 0.3, 0.45]], S); break; }
    }
  }

  // ================================================================ soncni_pas: the band across the windscreen's top
  // a 5 x 7 pixel font (rows top down, '#' lit) for the texts (generic words, the car's start number shown as 07: the band is shared by
  // every car of the model; the garage shows the player's own when it has them)
  const FONT = { A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'], C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
    D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'], E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'], J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
    L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'], N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
    O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'], V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
    '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'], '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
    '-': ['.....', '.....', '.....', '.###.', '.....', '.....', '.....'], ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'] };
  // a text's lit pixels as rectangles (each row's runs, merged down the rows where they match): [c0, r0, c1, r1] in pixels
  function glyphRects(txt) {
    const cols = txt.length * 6 - 1, grid = []; for (let r = 0; r < 7; r++) { let row = ''; for (const ch of txt) row += (FONT[ch] || FONT[' '])[r] + '.'; grid.push(row); }
    const R = [], open = new Map();
    for (let r = 0; r < 7; r++) { const runs = []; let c = 0; while (c < cols) { if (grid[r][c] === '#') { let e = c; while (e < cols && grid[r][e] === '#') e++; runs.push([c, e]); c = e; } else c++; }
      const next = new Map(); for (const [a, b] of runs) { const k = a + ',' + b, q = open.get(k); if (q) { q[3] = r + 1; next.set(k, q); } else { const nq = [a, r, b, r + 1]; R.push(nq); next.set(k, nq); } }
      open.clear(); for (const [k, v] of next) open.set(k, v); }
    return { R, cols };
  }
  const SUN = { 1: { c: BLK }, 2: { c: WHT }, 3: { c: YEL }, 4: { c: 's' }, 5: { c: [0.1, 0.25, 0.75], fade: true }, 6: { c: [0.08, 0.5, 0.2], fade: true }, 7: { c: [0.3, 0.31, 0.33], fade: true },
    8: { rainbow: true }, 9: { c: BLK, txt: '07', tc: WHT }, 10: { c: BLK, txt: 'DRIVER', tc: WHT }, 11: { c: WHT, txt: 'SLOVENIJA', tc: [0.1, 0.25, 0.75] }, 12: { c: BLK, txt: 'DRIVER CO-DRIVER', tc: YEL },
    13: { c: WHT, refl: true }, 14: { c: 's', print: true }, 15: { c: [0.16, 0.16, 0.17], perf: true }, 16: { c: 's', print: true, refl: true } };
  function soncni_pas(K, n, m) {
    const o = SUN[n]; if (!o) return; const ly = layer(K), X = m.x || [0.165, 0.31], W = m.w || 0.56, c = (q) => q === 's' ? K.strp : q, x0 = X[0], x1 = X[1], d = x1 - x0;
    if (o.rainbow) { const RB = [[0.85, 0.12, 0.1], [0.95, 0.55, 0.08], [0.95, 0.85, 0.1], [0.15, 0.6, 0.25], [0.15, 0.35, 0.85]]; RB.forEach((col, i) => ly.top(rect(x0 + d * i / 5 * 0.8, -W, x0 + d * (i + 1) / 5 * 0.8, W), col, 0.006)); return; }
    if (o.fade) { ly.top(rect(x0, -W, x0 + d * 0.5, W), c(o.c), 0.006); ly.top(rect(x0 + d * 0.5, -W, x0 + d * 0.72, W), K.shade(c(o.c), 0.7), 0.006); ly.top(rect(x0 + d * 0.72, -W, x0 + d * 0.86, W), K.shade(c(o.c), 0.45), 0.006); return; }
    if (o.perf) { ly.top(rect(x0, -W, x0 + d * 0.35, W), c(o.c), 0.006); const k = K.hi ? 22 : 14; for (let r = 0; r < 3; r++) for (let i = 0; i < k; i++) { const z = -W + (i + 0.5 + (r % 2) * 0.5) * 2 * W / (k + 0.5), xs = x0 + d * (0.42 + r * 0.17);
      ly.top(rect(xs, z - 0.012, xs + d * 0.09, z + 0.012), c(o.c), 0.006); } return; }
    ly.top(rect(x0, -W, x1, W), c(o.c), 0.006);
    if (o.print) for (let i = 0; i < 8; i++) { const z = -W + (i + 0.5) * 2 * W / 8; ly.top([[x0 + d * 0.15, z - 0.05], [x1 - d * 0.15, z], [x0 + d * 0.15, z + 0.05]], i % 2 ? BLK : WHT, 0.008); }
    if (o.txt) { const G = glyphRects(o.txt), px = Math.min(d * 0.8 / 7, 2 * W * 0.9 / G.cols), zs = G.cols * px / 2, xt = x0 + (d - 7 * px) / 2;   // (read from the front: left to right is the car's right to left)
      for (const [c0, r0, c1, r1] of G.R) ly.top(rect(xt + r0 * px, zs - c1 * px, xt + r1 * px, zs - c0 * px), c(o.tc), 0.009); }
  }

  // ================================================================ celjusti: the brake calipers behind each rim's spokes
  const CAL = { 1: [0.75, 0.06, 0.05], 2: [0.95, 0.76, 0.08], 3: [0.8, 0.62, 0.2], 4: 'p', 5: [0.86, 0.08, 0.06], 6: [1, 0.84, 0.1], 7: [0.9, 0.7, 0.25], 8: 'p',
    9: [0.66, 0.06, 0.05], 10: [0.86, 0.7, 0.07], 11: [0.72, 0.56, 0.18], 12: [0.78, 0.07, 0.06], 13: [0.95, 0.12, 0.2], 14: [0.12, 0.36, 0.95], 15: [0.98, 0.76, 0.26], 16: [0.9, 0.91, 0.94] };
  function celjusti(K, n, m) {
    const col0 = CAL[n]; if (!col0) return; const col = col0 === 'p' ? K.paint : col0, W = K.wheels || {}, R = m.r || [0.075, 0.14], A = m.a || [70, 125];
    const w = W.w || K.rw * 0.68, dish = W.deep || W.style === 'deep' ? 0.07 : W.style === 'slick' ? 0.035 : 0.024, zf = (K.hw * K.sz + w / 2 - dish + 0.0075) / K.sz, th = 0.035 / K.sz, q = K.hi ? 4 : 3;
    const lit = n >= 5 ? (n === 12 ? BLK : [0.95, 0.95, 0.93]) : null;   // (a sprayed or a premium caliper: a light flash across its face (no name on it); the two-tone's black half)
    for (const A0 of K.arches) for (const sd of [-1, 1]) {
      const cx = A0.x, cy = K.rw, P = (a, r, z) => [cx + Math.cos(rad(a)) * r / K.sx, cy + Math.sin(rad(a)) * r, sd * z], zo = zf, zi = zf - th;
      K.at(cx, cy + (R[0] + R[1]) / 2, sd * zo, () => {
        for (let i = 0; i < q; i++) { const a0 = A[0] + (A[1] - A[0]) * i / q, a1 = A[0] + (A[1] - A[0]) * (i + 1) / q, cc = n === 12 && i >= q / 2 ? BLK : col;
          const f = [P(a0, R[0], zo), P(a1, R[0], zo), P(a1, R[1], zo), P(a0, R[1], zo)];
          K.face(sd > 0 ? f.slice().reverse() : f, cc);   // (its face, out)
          const t = [P(a0, R[1], zi), P(a0, R[1], zo), P(a1, R[1], zo), P(a1, R[1], zi)]; K.face(sd > 0 ? t : t.slice().reverse(), K.shade ? (Array.isArray(cc) ? K.shade(cc, 0.75) : K.shade(cc, 0.75)) : cc); }   // (its rim edge)
        for (const a of A) { const e = [P(a, R[0], zi), P(a, R[0], zo), P(a, R[1], zo), P(a, R[1], zi)]; K.face((a === A[0]) === (sd > 0) ? e : e.slice().reverse(), Array.isArray(col) ? K.shade(col, 0.6) : K.shade(col, 0.6)); }
        if (lit && K.hi) { const am = (A[0] + A[1]) / 2, f = [P(am - 9, R[0] + 0.022, zo + 0.0015 / K.sz), P(am + 9, R[0] + 0.022, zo + 0.0015 / K.sz), P(am + 9, R[0] + 0.03, zo + 0.0015 / K.sz), P(am - 9, R[0] + 0.03, zo + 0.0015 / K.sz)];
          K.face(sd > 0 ? f.slice().reverse() : f, lit); }
      }, { part: 'body' });
    }
  }

  // ================================================================ gume: the tyres' look (render.js kitBuild lays it over the wheels)
  // { knob: the tread in blocks, tyre: its rubber's colour, band: a band round the outer wall, bandR: [r0, r1] of the tyre's radius }
  const TYRE = { 1: { tyre: [0.1, 0.1, 0.105] }, 2: { band: [0.42, 0.43, 0.45], bandR: [0.86, 0.875] }, 3: {}, 4: { knob: true, band: [0.62, 0.7, 0.85], bandR: [0.86, 0.875] },
    5: { band: [0.75, 0.76, 0.79], bandR: [0.86, 0.875] }, 6: { knob: true, tyre: [0.075, 0.07, 0.065] }, 7: { knob: true, band: [0.2, 0.62, 0.3] }, 8: { knob: true, band: WHT },
    9: { band: YEL, bandR: [0.85, 0.87] }, 10: { band: YEL }, 11: { knob: true, band: WHT, bandR: [0.83, 0.89] }, 12: { knob: true, band: [0.2, 0.45, 0.95] },
    13: { tyre: [0.045, 0.045, 0.05], band: [0.85, 0.12, 0.1] }, 14: { band: [0.2, 0.45, 0.95], bandR: [0.83, 0.89] }, 15: { tyre: [0.045, 0.045, 0.05], band: [0.85, 0.12, 0.1], bandR: [0.83, 0.89] },
    16: { tyre: [0.045, 0.045, 0.05], band: [1, 0.5, 0.08], bandR: [0.83, 0.89] } };
  DELI.tyreLook = (n) => TYRE[n] ? Object.assign({}, TYRE[n]) : {};

  // ================================================================ the car's look: finish, tint, stripes' sheen, underglow (DELI.dress)
  // barva: spec (the highlight's and the sky's share), matte (no glint), metal (bright facing, dark at a glancing angle), pearl (a pale
  // sheen at a glancing angle), cham (the hue turning with the angle), env (the sky's reflection), jambs (the shut faces in the paint)
  const FIN = { 1: { spec: 0.55, matte: 0.35, env: 0.6 }, 2: { spec: 0.7, matte: 0.2, env: 0.8 }, 3: { spec: 1.1 }, 4: { spec: 1.2, env: 1.1 }, 5: { spec: 0.1, matte: 1, env: 0.15 },
    6: { spec: 1.35, env: 1.25 }, 7: { spec: 1.2, metal: 0.6 }, 8: { spec: 1.2, cham: 0.8 }, 9: { spec: 1.4, env: 1.2 }, 10: { spec: 1.3, metal: 0.85 }, 11: { spec: 1.3, pearl: 0.8 },
    12: { spec: 1.4, env: 1.2, jambs: true }, 13: { spec: 1.5, pearl: 1, env: 1.2 }, 14: { spec: 1.5, cham: 1.25, env: 1.2 }, 15: { spec: 1.8, env: 1.4 }, 16: { spec: 2, env: 1.5, metal: 0.3 } };
  // crte: the stripes' sheen (spec, metal, pearl, refl: they glow back at night)
  const SFIN = { 7: { spec: 1.3, metal: 0.8 }, 8: { refl: 1 }, 9: { spec: 1.3 }, 10: { spec: 1.3 }, 11: { spec: 1.4, metal: 0.9 }, 12: { spec: 1.4, pearl: 1 }, 15: { spec: 1.6 }, 16: { spec: 1.8, metal: 0.4 } };
  // zatemnitev: the glass's tint colour and how much of it, mirror (its sky), cham (a hue turning with the angle)
  const TINT = { 1: { c: [0.03, 0.035, 0.04], a: 0.35 }, 2: { c: [0.03, 0.035, 0.04], a: 0.65 }, 3: { c: [0.015, 0.015, 0.02], a: 0.9 }, 4: { c: [0.18, 0.34, 0.62], a: 0.6, mirror: 1 },
    5: { c: [0.1, 0.1, 0.11], a: 0.4, mirror: 0.4 }, 6: { c: [0.06, 0.06, 0.07], a: 0.7, mirror: 0.4 }, 7: { c: [0.55, 0.57, 0.6], a: 0.65, mirror: 1.2 }, 8: { c: [0.02, 0.02, 0.025], a: 0.9, mirror: 0.4 },
    9: { c: [0.04, 0.04, 0.04], a: 0.35 }, 10: { c: [0.03, 0.03, 0.03], a: 0.65 }, 11: { c: [0.01, 0.01, 0.012], a: 0.9 }, 12: { c: [0.32, 0.16, 0.42], a: 0.55, mirror: 0.6, cham: 1 },
    13: { c: [0.08, 0.1, 0.14], a: 0.12 }, 14: { c: [0.04, 0.05, 0.07], a: 0.35 }, 15: { c: [0.03, 0.035, 0.05], a: 0.65 }, 16: { c: [0.012, 0.014, 0.02], a: 0.9 } };
  // luc_pod_avtom: the colours (hex), the mode (steady, duo: front and rear, brake: brighter red when braking, breath, cycle, rainbow, run:
  // the colours running round the car, blink: amber at the sides when it turns), rings (in the wheels too), k (how bright)
  const GLOW = { 1: { c: [0x2a6dff] }, 2: { c: [0x18e0d0] }, 3: { c: [0xa040ff] }, 4: { c: [0xff2a2a] }, 5: { c: [0x20d0ff, 0xff30c0], mode: 'duo' }, 6: { c: [0x20d0ff, 0xff30c0], mode: 'duo', brake: true },
    7: { c: [0x20d0ff, 0xff30c0], mode: 'duo', k: 1.15 }, 8: { c: [0xa040ff], mode: 'breath' }, 9: { mode: 'cycle' }, 10: { mode: 'rainbow' }, 11: { mode: 'run' }, 12: { c: [0x20d0ff], blink: true },
    13: { c: [0x9fd4ff], k: 1.3 }, 14: { c: [0x2a6dff], rings: true }, 15: { c: [0xff2020], k: 1.3 }, 16: { mode: 'run', rings: true, brake: true, k: 1.2 } };
  DELI.look = { FIN, SFIN, TINT, GLOW };

  const hsv = (h, s, v) => { h = ((h % 1) + 1) % 1; const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s); return [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6]; };
  const hex3 = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];

  // the finish and the tint in the car's own material (dirtyCarMat's copy: render.js), after what it already does
  function dressMat(mat, fin, sfin, tint, decals) {
    const A = { value: [fin.spec || 1, fin.matte || 0, fin.metal || 0, fin.pearl || 0] }, B = { value: [fin.cham || 0, sfin.refl || 0, 0, 0] }, S = { value: [sfin.spec || 1, sfin.metal || 0, sfin.pearl || 0, 0] };
    const G = { value: tint ? [tint.c[0], tint.c[1], tint.c[2], tint.a] : [0, 0, 0, 0] }, G2 = { value: [tint ? tint.mirror || 0 : 0, tint ? tint.cham || 0 : 0, 0, 0] }, N = { value: 0 };
    const ob = mat.onBeforeCompile, key0 = mat.customProgramCacheKey ? mat.customProgramCacheKey() : '';
    mat.onBeforeCompile = (sh, r) => { if (ob) ob(sh, r);
      for (const [k, u] of [['uDlA', A], ['uDlB', B], ['uDlS', S], ['uDlG', G], ['uDlG2', G2]]) sh.uniforms[k] = { value: new THREE.Vector4().fromArray(u.value) };
      sh.uniforms.uDlN = N; mat.userData.dlU = sh.uniforms;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aDl;\nvarying float vDl;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvDl = aDl;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vDl;\nuniform vec4 uDlA;\nuniform vec4 uDlB;\nuniform vec4 uDlS;\nuniform vec4 uDlG;\nuniform vec4 uDlG2;\nuniform float uDlN;\nvec3 dlHue(vec3 c, float a) { vec3 k = vec3(0.57735); float cs = cos(a), sn = sin(a); return c * cs + cross(k, c) * sn + k * dot(k, c) * (1.0 - cs); }')
        .replace('#include <color_fragment>', ['#include <color_fragment>',
          'float dlP = step(0.85, vDl), dlS = step(0.5, vDl) * (1.0 - dlP), dlR = step(0.2, vDl) * (1.0 - step(0.5, vDl));',
          'vec3 dlNn = normalize(vNormal), dlVv = normalize(vViewPosition); float dlF = 1.0 - abs(dot(dlNn, dlVv));',
          'if (uDlB.x * dlP > 0.0) diffuseColor.rgb = max(dlHue(diffuseColor.rgb, (dlF * 2.4 - 0.5) * uDlB.x), vec3(0.0));',
          'float dlM = uDlA.z * dlP + uDlS.y * dlS; diffuseColor.rgb *= mix(1.0, 1.28 - 0.62 * dlF, dlM);',
          'float dlPe = uDlA.w * dlP + uDlS.z * dlS; diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.55 + vec3(0.45, 0.4, 0.47), clamp(dlPe * dlF * dlF * 1.6, 0.0, 1.0));',
          '#ifdef USE_COLOR', 'float dlGl = 1.0 - step(0.05, min(distance(vColor.rgb, vec3(0.1, 0.13, 0.19)), distance(vColor.rgb, vec3(0.04, 0.05, 0.08))));', '#else', 'float dlGl = 0.0;', '#endif',
          '{ vec3 gc = mix(diffuseColor.rgb, uDlG.rgb, uDlG.a); if (uDlG2.y > 0.0) gc = max(dlHue(gc, dlF * 3.0 * uDlG2.y), vec3(0.0)); diffuseColor.rgb = mix(diffuseColor.rgb, gc, dlGl); }'].join('\n'))
        .replace('#include <specularmap_fragment>', '#include <specularmap_fragment>\nspecularStrength *= mix(1.0, uDlA.x, dlP) * mix(1.0, uDlS.x, dlS) * mix(1.0, uDlG2.x > 0.0 ? 1.0 + uDlG2.x * 1.5 : 1.0 - 0.7 * uDlG.a, dlGl);\ncgD = max(cgD, uDlA.y * dlP);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * (uDlB.y * dlS + dlR) * uDlN * 0.7;');
    };
    mat.customProgramCacheKey = () => key0 + '|DL';
    if (fin.env != null) mat.reflectivity = (mat.reflectivity || 0.2) * fin.env;
    return N;
  }
  // the attribute aDl: 1 the paint's vertices, 0.66 the stripes', 0.33 a reflective decal's (its triangles: geo.userData.deli[id]); the
  // paint's shut faces (barva 12: the lining behind a painted panel, its twin) a shade of the paint
  function dressGeo(geo, decals, jambs, color) {
    const U = geo.userData, nv = geo.attributes.position.count, a = new Float32Array(nv);
    for (const i of U.paint.i) if (i < nv) a[i] = 1;
    for (const i of U.strp.i) if (i < nv) a[i] = 0.66;
    for (const id of decals) for (const [s0, s1] of (U.deli && U.deli[id]) || []) for (let i = s0; i < s1 && i < nv; i++) a[i] = 0.33;
    geo.setAttribute('aDl', new THREE.BufferAttribute(a, 1));
    if (jambs && U.twin && U.outerN != null) { const P = new Set(U.paint.i), c = geo.attributes.color.array, k = [((color >> 16) & 255) / 255 * 0.72, ((color >> 8) & 255) / 255 * 0.72, (color & 255) / 255 * 0.72];
      for (let j = 0; j < U.twin.length; j++) { const t = U.twin[j]; if (t >= 0 && P.has(t)) { const o = (U.outerN + j) * 3; c[o] = k[0]; c[o + 1] = k[1]; c[o + 2] = k[2]; } }
      geo.attributes.color.needsUpdate = true; }
  }
  // the underglow: a soft ring of light on the ground round the car's footprint (additive, its colours per vertex: black is nothing), and
  // in the wheels (rings round the rims' lips) when the option has them
  function glowMesh(M, E, wf, wr, g) {
    const N = 28, hl = M.len / 2, hwd = M.wid / 2, P = [], C = [], I = [], seg = [];
    const sq = (a, kx, kz) => { const c = Math.cos(a), s = Math.sin(a), e = 0.25; return [Math.sign(c) * Math.pow(Math.abs(c), e) * kx, Math.sign(s) * Math.pow(Math.abs(s), e) * kz]; };   // (a squircle)
    P.push(0, 0.02, 0); C.push(0, 0, 0); seg.push(-1);
    for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, p0 = sq(a, hl * 0.82, hwd * 0.78), p1 = sq(a, hl + 0.6, hwd + 0.55); P.push(p0[0], 0.02, p0[1], p1[0], 0.02, p1[1]); C.push(0, 0, 0, 0, 0, 0); seg.push(i, -2); }
    for (let i = 0; i < N; i++) { const j = (i + 1) % N, a0 = 1 + i * 2, a1 = 1 + j * 2; I.push(0, a1, a0, a0, a1, a1 + 1, a0, a1 + 1, a0 + 1); }
    if (g.rings) for (const w of wf.concat(wr)) { const base = P.length / 3, sd = Math.sign(w.position.z) || 1, zf = w.position.z + sd * ((E.W.w || M.rw * 0.68) / 2 + 0.006), rr = M.rw * 0.66, n = 16;
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; P.push(w.position.x + Math.cos(a) * rr, w.position.y + Math.sin(a) * rr, zf, w.position.x + Math.cos(a) * (rr + 0.035), w.position.y + Math.sin(a) * (rr + 0.035), zf); C.push(0, 0, 0, 0, 0, 0); seg.push(-3, -3); }
      for (let i = 0; i < n; i++) { const j = (i + 1) % n, a0 = base + i * 2, a1 = base + j * 2; I.push(a0, a1, a1 + 1, a0, a1 + 1, a0 + 1, a0, a1 + 1, a1, a0, a0 + 1, a1 + 1); } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); geo.setIndex(I);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: true }));
    mesh.renderOrder = 2; mesh.name = 'deli:luc_pod_avtom'; mesh.frustumCulled = false;
    return { mesh, seg, N };
  }

  // the dress of a car with parts (render.js makeCarMesh): o { car, M, E (its kit entry), grp, bodyG, body, mat, dec, wf, wr, show }
  DELI.dress = function (o) {
    const D = DELI.clean(o.car.deli, o.M); if (!Object.keys(D).length) return null;
    const out = { low: 0, step: null, smoke: null }, geo = o.body.geometry, dirty = !!(o.mat && o.mat.userData && o.mat.userData.dirt);   // (the shared matCar (noDirt): never touched)
    for (const id of Object.keys(D)) { const e = DELI.effect(id, D[id]); if (e && e.lower) out.low += e.lower; }
    if (out.low) o.bodyG.position.y = -out.low;   // (the showroom's; a race's every frame, updateCars)
    const fin = D.barva ? FIN[D.barva] || {} : {}, sfin = D.crte ? SFIN[D.crte] || {} : {}, tint = D.zatemnitev ? TINT[D.zatemnitev] : null;
    const decals = []; if (D.stevilke === 9) decals.push('stevilke'); if (D.soncni_pas === 13 || D.soncni_pas === 16) decals.push('soncni_pas');
    let night = null;
    if (dirty && (D.barva || D.crte || D.zatemnitev || decals.length)) { night = dressMat(o.mat, fin, sfin, tint, decals); dressGeo(geo, decals, !!fin.jambs, o.car.color); }
    if (o.dec && D.stevilke && /r/.test((NUM[D.stevilke] || {}).at || '')) o.dec.visible = false;   // (a roof number of its own: the stock roundel off)
    let G = null, gl = null;
    if (D.luc_pod_avtom && GLOW[D.luc_pod_avtom]) { G = GLOW[D.luc_pod_avtom]; gl = glowMesh(o.M, o.E, o.wf, o.wr, G); o.grp.add(gl.mesh); }
    const cols = G && G.c ? G.c.map(hex3) : null, col = gl ? gl.mesh.geometry.attributes.color : null;
    let tt = 0, brk = 0;
    out.step = (dt, car, t, nk, braking) => {
      tt = Number.isFinite(t) ? t : tt + (dt || 0); if (night) night.value = Math.max(0, Math.min(1, nk || 0));   // (the race's time: its lights run with it, paused or stepped)
      if (!gl) return;
      brk += ((braking ? 1 : 0) - brk) * Math.min(1, (dt || 0) * 10);
      const I = (G.k || 1) * (o.show ? 0.9 : 0.42 + 0.7 * Math.max(0, Math.min(1, nk || 0))), A = col.array, s = (car && car.delta) || 0;
      for (let v = 0; v < gl.seg.length; v++) {
        const sg = gl.seg[v]; if (sg === -2) { A[v * 3] = A[v * 3 + 1] = A[v * 3 + 2] = 0; continue; }
        const f = sg >= 0 ? sg / gl.N : 0, front = sg >= 0 ? Math.cos(f * Math.PI * 2) : 0, side = sg >= 0 ? Math.sin(f * Math.PI * 2) : 0;
        let c = cols ? cols[0] : [1, 1, 1], k = sg === -1 ? 0.75 : 1;
        if (G.mode === 'duo') { const m = 0.5 + 0.5 * front; c = [cols[1][0] + (cols[0][0] - cols[1][0]) * m, cols[1][1] + (cols[0][1] - cols[1][1]) * m, cols[1][2] + (cols[0][2] - cols[1][2]) * m]; }
        else if (G.mode === 'breath') k *= 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(tt * 2.2));
        else if (G.mode === 'cycle') c = hsv(tt * 0.05, 0.9, 1);
        else if (G.mode === 'rainbow') c = hsv(tt * 0.25, 1, 1);
        else if (G.mode === 'run') c = hsv((sg >= 0 ? f : 0.5) + tt * 0.4, 1, 1);
        if (G.blink && Math.abs(s) > 0.08 && Math.sign(side) === Math.sign(s) && Math.abs(side) > 0.4 && (tt % 0.7) < 0.35) c = [1, 0.55, 0.05];
        if (G.brake && brk > 0.05 && front < 0.2) { const b = brk * (front < -0.3 ? 1 : 0.5); c = [c[0] + (1 - c[0]) * b, c[1] * (1 - b), c[2] * (1 - b)]; }
        A[v * 3] = c[0] * I * k; A[v * 3 + 1] = c[1] * I * k; A[v * 3 + 2] = c[2] * I * k;
      }
      col.needsUpdate = true;
    };
    out.step(0, null, 0, 0, false);
    if (D.dim_gum && DELI.dim) { const S = DELI.dim(D.dim_gum); out.smoke = (k, t) => S.at(k, t); }
    return out;
  };

  // ---- the elements (DELI.add): those drawn in the body, those that are only the car's look (nothing to draw) ----
  for (const [id, b] of [['crte', crte], ['stevilke', stevilke], ['nalepke', nalepke], ['soncni_pas', soncni_pas], ['celjusti', celjusti]]) DELI.add(id, b);
  for (const id of ['barva', 'zatemnitev', 'luc_pod_avtom', 'gume']) DELI.add(id, () => {});
})();
