/* =========================================================================
   RENDER — renderer, cars, particles, skids, cameras
   ========================================================================= */
const Render = (function () {
  'use strict';
  const { clamp, lerp, wrapPi } = Core;
  const GB = World.GB;

  /* ---------------- car body definitions (x fwd, y up, z right) ---------------- */
  // [x, halfW, yBottom, yBelt, topHalfW, yTop, crown, kindToNext]
  const BODIES = {
    coupe: { len: 4.35, wid: 1.78, roofY: 1.26, spoiler: true, secs: [
      [-2.18, 0.84, 0.32, 0.66, 0.74, 0.72, 0.01, 'b'], [-1.98, 0.88, 0.28, 0.70, 0.80, 0.80, 0.02, 'b'], [-1.30, 0.89, 0.27, 0.72, 0.82, 0.83, 0.03, 'b'],
      [-1.02, 0.89, 0.27, 0.74, 0.76, 0.86, 0.02, 'gr'], [-0.30, 0.89, 0.27, 0.76, 0.64, 1.22, 0.03, 'r'], [0.30, 0.89, 0.27, 0.76, 0.64, 1.24, 0.03, 'gf'],
      [0.98, 0.89, 0.27, 0.74, 0.80, 0.84, 0.03, 'b'], [1.75, 0.88, 0.28, 0.70, 0.80, 0.76, 0.03, 'b'], [2.18, 0.82, 0.33, 0.58, 0.72, 0.62, 0.01, 'b']] },
    sedan: { len: 4.55, wid: 1.80, roofY: 1.4, spoiler: true, secs: [
      [-2.28, 0.84, 0.32, 0.68, 0.76, 0.74, 0.01, 'b'], [-2.05, 0.89, 0.28, 0.72, 0.82, 0.84, 0.02, 'b'], [-1.45, 0.90, 0.27, 0.74, 0.84, 0.87, 0.03, 'b'],
      [-1.18, 0.90, 0.27, 0.76, 0.78, 0.90, 0.02, 'gr'], [-0.55, 0.90, 0.27, 0.78, 0.66, 1.36, 0.03, 'r'], [0.45, 0.90, 0.27, 0.78, 0.66, 1.38, 0.03, 'gf'],
      [1.10, 0.90, 0.27, 0.76, 0.82, 0.88, 0.03, 'b'], [1.85, 0.89, 0.28, 0.72, 0.82, 0.80, 0.03, 'b'], [2.28, 0.83, 0.33, 0.60, 0.74, 0.66, 0.01, 'b']] },
    hatch: { len: 3.95, wid: 1.70, roofY: 1.42, spoiler: false, secs: [
      [-1.98, 0.82, 0.33, 0.70, 0.72, 0.86, 0.01, 'b'], [-1.88, 0.84, 0.30, 0.74, 0.74, 0.90, 0.02, 'gr'], [-1.55, 0.85, 0.29, 0.76, 0.66, 1.34, 0.03, 'r'],
      [0.25, 0.85, 0.29, 0.78, 0.66, 1.40, 0.03, 'gf'], [0.85, 0.85, 0.29, 0.76, 0.78, 0.90, 0.03, 'b'], [1.60, 0.84, 0.30, 0.72, 0.78, 0.82, 0.03, 'b'],
      [1.98, 0.80, 0.34, 0.60, 0.72, 0.68, 0.01, 'b']] },
    wedge: { len: 4.2, wid: 1.82, roofY: 1.14, spoiler: true, secs: [
      [-2.10, 0.88, 0.30, 0.66, 0.80, 0.74, 0.01, 'b'], [-1.90, 0.91, 0.27, 0.72, 0.86, 0.84, 0.02, 'b'], [-0.95, 0.91, 0.26, 0.74, 0.80, 0.88, 0.02, 'gr'],
      [-0.55, 0.91, 0.26, 0.74, 0.62, 1.10, 0.03, 'r'], [0.25, 0.91, 0.26, 0.72, 0.64, 1.12, 0.03, 'gf'], [1.05, 0.90, 0.26, 0.66, 0.80, 0.72, 0.03, 'b'],
      [1.80, 0.86, 0.27, 0.56, 0.78, 0.60, 0.02, 'b'], [2.10, 0.80, 0.30, 0.48, 0.72, 0.50, 0.01, 'b']] },
  };
  // rally hatchback (the player's car from the reference image): boxy 80s profile, flared arches
  BODIES.rally = { len: 3.8, wid: 1.80, roofY: 1.435, spoiler: false, decalX: 0.02, secs: [
    [-1.90, 0.84, 0.36, 0.74, 0.76, 0.96, 0.01, 'b'], [-1.84, 0.88, 0.32, 0.80, 0.78, 1.00, 0.02, 'gr'], [-1.60, 0.91, 0.30, 0.82, 0.70, 1.30, 0.02, 'gr'],
    [-1.45, 0.91, 0.30, 0.82, 0.75, 1.37, 0.03, 'r'], [-0.80, 0.90, 0.30, 0.82, 0.75, 1.39, 0.03, 'r'], [-0.10, 0.89, 0.30, 0.82, 0.75, 1.39, 0.03, 'r'],
    [0.35, 0.89, 0.30, 0.82, 0.75, 1.37, 0.03, 'gf'], [0.72, 0.90, 0.30, 0.80, 0.78, 0.93, 0.03, 'b'], [1.10, 0.92, 0.30, 0.79, 0.80, 0.90, 0.03, 'b'],
    [1.55, 0.92, 0.30, 0.75, 0.80, 0.84, 0.02, 'b'], [1.90, 0.86, 0.32, 0.66, 0.76, 0.74, 0.01, 'b']] };
  const GLASS = [0.1, 0.13, 0.19];

  function colArr(hex) { return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255]; }
  function stripeFor(hex) {
    const c = colArr(hex); const l = c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11;
    return l > 0.6 ? [0.12, 0.24, 0.75] : [0.96, 0.96, 0.94];
  }

  function wheelInto(g, cx, cy, cz, r, wd, tire, rim) {
    const S = 12, inn = [cx, cy, cz];
    const dark = [rim[0] * 0.38, rim[1] * 0.38, rim[2] * 0.4], hub = [0.15, 0.15, 0.17];
    const p = (a, z, rr) => [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, cz + z];
    for (let i = 0; i < S; i++) {
      const a0 = i / S * Math.PI * 2, a1 = (i + 1) / S * Math.PI * 2;
      g.quadO(p(a0, -wd / 2, r), p(a0, wd / 2, r), p(a1, wd / 2, r), p(a1, -wd / 2, r), tire, inn);
      for (const sd of [-1, 1]) {
        const zf = sd * wd / 2, zr = sd * (wd / 2 + 0.006), out = [cx, cy, cz - sd];
        g.quadO(p(a0, zf, r * 0.68), p(a0, zf, r), p(a1, zf, r), p(a1, zf, r * 0.68), tire, out);          // sidewall
        g.quadO(p(a0, zr, r * 0.54), p(a0, zr, r * 0.68), p(a1, zr, r * 0.68), p(a1, zr, r * 0.54), rim, out); // rim lip
        g.triO([cx, cy, cz + zf], p(a0, zf, r * 0.54), p(a1, zf, r * 0.54), dark, out);                       // recessed dish
      }
    }
    for (const sd of [-1, 1]) {
      const zs = sd * (wd / 2 + 0.012), out = [cx, cy, cz - sd];
      for (let k = 0; k < 5; k++) {                       // spokes
        const a = k / 5 * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), ox = -sa * r * 0.075, oy = ca * r * 0.075, r0 = r * 0.12, r1 = r * 0.56;
        g.quadO([cx + ca * r0 + ox, cy + sa * r0 + oy, cz + zs], [cx + ca * r1 + ox, cy + sa * r1 + oy, cz + zs], [cx + ca * r1 - ox, cy + sa * r1 - oy, cz + zs], [cx + ca * r0 - ox, cy + sa * r0 - oy, cz + zs], rim, out);
      }
      for (let i = 0; i < 6; i++) {                       // hub cap
        const a0 = i / 6 * Math.PI * 2, a1 = (i + 1) / 6 * Math.PI * 2;
        g.triO([cx, cy, cz + zs * 1.1], [cx + Math.cos(a0) * r * 0.15, cy + Math.sin(a0) * r * 0.15, cz + zs * 1.04], [cx + Math.cos(a1) * r * 0.15, cy + Math.sin(a1) * r * 0.15, cz + zs * 1.04], hub, out);
      }
    }
  }

  // smooth shading for car bodies: average normals of coincident vertices whose faces differ
  // by less than `deg`, so rounded panels look glossy while sharp creases stay crisp
  function smoothNormals(geo, deg) {
    const pos = geo.attributes.position.array, nor = geo.attributes.normal.array, n = pos.length / 3;
    const cosT = Math.cos(deg * Math.PI / 180), map = new Map(), q = 1e3;
    for (let i = 0; i < n; i++) {
      const key = Math.round(pos[i * 3] * q) + ',' + Math.round(pos[i * 3 + 1] * q) + ',' + Math.round(pos[i * 3 + 2] * q);
      let l = map.get(key); if (!l) { l = []; map.set(key, l); } l.push(i);
    }
    const out = new Float32Array(nor.length);
    for (const l of map.values()) {
      for (const i of l) {
        let x = 0, y = 0, z = 0;
        const ax = nor[i * 3], ay = nor[i * 3 + 1], az = nor[i * 3 + 2];
        for (const j of l) {
          const bx = nor[j * 3], by = nor[j * 3 + 1], bz = nor[j * 3 + 2];
          if (ax * bx + ay * by + az * bz >= cosT) { x += bx; y += by; z += bz; }
        }
        const L = Math.hypot(x, y, z) || 1;
        out[i * 3] = x / L; out[i * 3 + 1] = y / L; out[i * 3 + 2] = z / L;
      }
    }
    geo.setAttribute('normal', new THREE.BufferAttribute(out, 3));
    return geo;
  }
  const geoCache = new Map();
  /* white body with a painted diagonal livery (colour = stripe colour), black engine vents,
     big wing, roof scoop, mud flaps and white rally wheels */
  function rallyGeometry(M, color) {
    const def = BODIES.rally, sx = M.len / def.len, sz = M.wid / def.wid;
    const W = [0.95, 0.95, 0.96], K = [0.07, 0.07, 0.08], GLASS = [0.04, 0.05, 0.08];
    let B = colArr(color); if (B[0] * 0.3 + B[1] * 0.59 + B[2] * 0.11 > 0.78) B = [0.1, 0.26, 0.74];
    const secs = def.secs.map(q => ({ x: q[0] * sx, w: q[1] * sz, yb: q[2], ybelt: q[3], wt: q[4] * sz, yt: q[5], cr: q[6], k: q[7] }));
    const ring = (q) => [[q.x, q.yb, q.w * 0.93], [q.x, q.yb + 0.14, q.w], [q.x, q.ybelt, q.w], [q.x, q.yt, q.wt], [q.x, q.yt + q.cr, q.wt * 0.38], [q.x, q.yt + q.cr, -q.wt * 0.38], [q.x, q.yt, -q.wt], [q.x, q.ybelt, -q.w], [q.x, q.yb + 0.14, -q.w], [q.x, q.yb, -q.w * 0.93]];
    const g = new GB();
    // ---- body shell: white paint, whole glass panes (no small facets -> no sparkle), black louvred engine cover ----
    for (let k = 0; k < secs.length - 1; k++) {
      const A = ring(secs[k]), Bv = ring(secs[k + 1]), kind = secs[k].k;
      const inside = [(secs[k].x + secs[k + 1].x) / 2, (secs[k].yb + Math.min(secs[k].yt, secs[k + 1].yt)) * 0.5, 0];
      for (let e = 0; e < 9; e++) {
        let c = W;
        const top = e >= 3 && e <= 5, upSide = e === 2 || e === 6;
        if (kind === 'gf' && (top || upSide)) c = GLASS;
        else if (kind === 'r' && upSide) c = GLASS;
        else if (kind === 'gr') c = top ? (e === 4 ? K : [0.13, 0.13, 0.15]) : upSide ? GLASS : W;
        if (e === 0 || e === 8) c = c.map(v => v * 0.85);
        g.quadO(A[e], Bv[e], Bv[e + 1], A[e + 1], c, inside);
      }
    }
    for (const [si, dir] of [[0, -1], [secs.length - 1, 1]]) {
      const q = secs[si], rg = ring(q), cen = [q.x, (q.yb + q.yt) / 2, 0], inn = [q.x - dir * 0.4, cen[1], 0];
      for (let e = 0; e < rg.length; e++) g.triO(cen, rg[e], rg[(e + 1) % rg.length], W, inn);
    }
    // ---- livery decals: flat panels clipped per body section so they sit flush on the shell ----
    const lerpN = (a, b, t) => a + (b - a) * t;
    const secAt = (x) => { for (let k = 0; k < secs.length - 1; k++) if (x <= secs[k + 1].x + 1e-6) return [k, clamp((x - secs[k].x) / (secs[k + 1].x - secs[k].x), 0, 1)]; return [secs.length - 2, 1]; };
    const prop = (x, key) => { const [k, t] = secAt(x); return lerpN(secs[k][key], secs[k + 1][key], t); };
    const clipX = (poly, xa, xb) => {
      const clip = (P, keep, X) => { const out = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], ia = keep(a[0]), ib = keep(b[0]); if (ia) out.push(a); if (ia !== ib) { const t = (X - a[0]) / (b[0] - a[0]); out.push([X, a[1] + (b[1] - a[1]) * t]); } } return out; };
      return clip(clip(poly, x => x >= xa, xa), x => x <= xb, xb);
    };
    const emitPoly = (poly, toP, col, inside) => { if (poly.length < 3) return; const P = poly.map(toP); for (let i = 1; i < P.length - 1; i++) g.triO(P[0], P[i], P[i + 1], col, inside); };
    const bounds = secs.map(q => q.x);
    const side = (poly2d, col) => {   // poly in (x, y) on the vertical door band
      for (let k = 0; k < bounds.length - 1; k++) {
        const piece = clipX(poly2d.map(p => [p[0] * sx, p[1]]), bounds[k], bounds[k + 1]);
        for (const sd of [-1, 1]) emitPoly(piece, p => [p[0], p[1], sd * (prop(p[0], 'w') + 0.012)], col, [p0(piece)[0], 0.6, 0]);
      }
    };
    const topD = (poly2d, col) => {   // poly in (x, z) on the roof / hood
      for (let k = 0; k < bounds.length - 1; k++) {
        const piece = clipX(poly2d.map(p => [p[0] * sx, p[1] * sz]), bounds[k], bounds[k + 1]);
        emitPoly(piece, p => [p[0], prop(p[0], 'yt') + prop(p[0], 'cr') * 0.6 + 0.014, p[1]], col, [p0(piece)[0], 0.2, 0]);
      }
    };
    const p0 = (piece) => piece.length ? piece[0] : [0, 0];
    // sides: two bold slashes rising toward the rear, sill band, rear quarter, black air intakes
    side([[1.30, 0.47], [1.62, 0.47], [0.98, 0.79], [0.66, 0.79]], B);
    side([[0.10, 0.47], [0.58, 0.47], [-0.30, 0.79], [-0.78, 0.79]], B);
    side([[-1.45, 0.47], [1.45, 0.47], [1.45, 0.54], [-1.45, 0.54]], B);
    side([[-1.90, 0.52], [-1.52, 0.52], [-1.40, 0.79], [-1.90, 0.79]], B);
    side([[-1.34, 0.52], [-1.08, 0.52], [-1.08, 0.74], [-1.34, 0.74]], K);
    // white door pillars on the side glass (B-pillar, wide rear quarter), laid on the sloped window band
    const glassBand = (xa, xb, col) => {
      for (let k = 0; k < bounds.length - 1; k++) {
        const x0 = Math.max(xa * sx, bounds[k]), x1 = Math.min(xb * sx, bounds[k + 1]);
        if (x1 - x0 < 1e-3) continue;
        for (const sd of [-1, 1]) {
          const P = (x, top) => { const y = top ? prop(x, 'yt') - 0.02 : prop(x, 'ybelt'), w = top ? prop(x, 'wt') : prop(x, 'w'); return [x, y, sd * (w + 0.014)]; };
          g.quadO(P(x0, false), P(x1, false), P(x1, true), P(x0, true), col, [(x0 + x1) / 2, 0.9, 0]);
        }
      }
    };
    glassBand(-0.20, -0.07, W);
    glassBand(-1.45, -1.12, W);
    // hood: V-stripes from the front corners toward the windscreen, plus a black vent
    topD([[1.86, 0.50], [1.86, 0.74], [0.76, 0.40], [0.76, 0.18]], B);
    topD([[1.86, -0.50], [1.86, -0.74], [0.76, -0.40], [0.76, -0.18]], B);
    topD([[1.28, -0.24], [1.28, 0.24], [1.02, 0.24], [1.02, -0.24]], K);
    // roof: blue band at the back and diagonal side flashes
    topD([[-1.44, -0.62], [-1.44, 0.62], [-0.98, 0.62], [-0.98, -0.62]], B);
    topD([[0.30, 0.44], [0.30, 0.62], [-0.30, 0.62], [-0.05, 0.44]], B);
    topD([[0.30, -0.44], [0.30, -0.62], [-0.30, -0.62], [-0.05, -0.44]], B);
    // ---- details ----
    const front = secs[secs.length - 1], rear = secs[0];
    for (const sd of [-1, 1]) {
      World.box(g, front.x - 0.02, 0.5, sd * 0.5, 0.08, 0.15, 0.32, 0, [1, 0.97, 0.84]);
      World.box(g, front.x - 0.02, 0.5, sd * 0.74, 0.08, 0.13, 0.12, 0, [1, 0.55, 0.12]);
    }
    World.box(g, front.x - 0.02, 0.5, 0, 0.07, 0.12, 0.6, 0, K);
    World.box(g, front.x - 0.03, 0.37, 0, 0.07, 0.1, 1.0, 0, K);
    World.box(g, rear.x + 0.02, 0.62, 0, 0.08, 0.2, 0.95, 0, K);
    for (const sd of [-1, 1]) World.box(g, rear.x - 0.02, 0.36, sd * 0.36, 0.1, 0.08, 0.12, 0, [0.2, 0.2, 0.22]);
    // big rear wing over the hatch, on endplates from the roof edge
    const wx0 = -1.62 * sx, wy = 1.56;
    for (const sd of [-1, 1]) World.box(g, wx0 + 0.12, 1.36, sd * 0.62 * sz, 0.14, 0.2, 0.05, 0, K);
    World.box(g, wx0, wy, 0, 0.5, 0.07, 1.84 * sz, 0, B, B);
    for (const sd of [-1, 1]) World.box(g, wx0 + 0.02, wy - 0.08, sd * 0.93 * sz, 0.56, 0.24, 0.04, 0, B, B);
    // roof scoop, antenna, mirrors
    World.box(g, -0.62 * sx, 1.40, 0, 0.4, 0.1, 0.42, 0, B, B);
    World.box(g, -0.44 * sx, 1.43, 0, 0.03, 0.06, 0.34, 0, K);
    World.box(g, 0.05 * sx, 1.40, 0.3, 0.025, 0.55, 0.025, 0, K);
    for (const sd of [-1, 1]) World.box(g, 0.66 * sx, 0.86, sd * (0.9 * sz + 0.07), 0.12, 0.1, 0.12, 0, K);
    // rear wheels (fronts are separate meshes) + mud flaps
    const r = M.rw, fx = M.a * (M.len / 4.4) * 0.98 + 0.05, rx = -M.b * (M.len / 4.4) * 0.98;
    for (const sd of [-1, 1]) {
      wheelInto(g, rx, r, sd * (M.wid * 0.5 - 0.1), r, 0.26, [0.07, 0.07, 0.08], [0.93, 0.93, 0.9]);
      for (const wxp of [fx, rx]) World.box(g, wxp - 0.44, 0.17, sd * (M.wid * 0.5 - 0.08), 0.03, 0.26, 0.2, 0, K);
    }
    return g.geometry();
  }
  function carGeometry(bodyKey, M, color, stripe) {
    const key = bodyKey + '|' + M.id + '|' + color + '|' + stripe;
    if (geoCache.has(key)) return geoCache.get(key);
    if (bodyKey === 'rally') { const geo = smoothNormals(rallyGeometry(M, color), 38); geoCache.set(key, geo); return geo; }
    const def = BODIES[bodyKey];
    const sx = M.len / def.len, sz = M.wid / def.wid;
    const body = colArr(color), skirt = body.map(v => v * 0.62), strp = stripe ? stripeFor(color) : body;
    const secs = def.secs.map(s => ({ x: s[0] * sx, w: s[1] * sz, yb: s[2], ybelt: s[3], wt: s[4] * sz, yt: s[5], cr: s[6], k: s[7] }));
    const ring = (s) => [[s.x, s.yb, s.w * 0.93], [s.x, s.yb + 0.14, s.w], [s.x, s.ybelt, s.w], [s.x, s.yt, s.wt], [s.x, s.yt + s.cr, s.wt * 0.38], [s.x, s.yt + s.cr, -s.wt * 0.38], [s.x, s.yt, -s.wt], [s.x, s.ybelt, -s.w], [s.x, s.yb + 0.14, -s.w], [s.x, s.yb, -s.w * 0.93]];
    const g = new GB();
    for (let k = 0; k < secs.length - 1; k++) {
      const A = ring(secs[k]), Bv = ring(secs[k + 1]), kind = secs[k].k;
      const inside = [(secs[k].x + secs[k + 1].x) / 2, (secs[k].yb + Math.min(secs[k].yt, secs[k + 1].yt)) * 0.5, 0];
      const glassTop = kind === 'gf' || kind === 'gr';
      for (let e = 0; e < 9; e++) {
        let c;
        if (e === 0 || e === 8) c = skirt;
        else if (e === 1 || e === 7) c = body;
        else if (e === 2 || e === 6) c = kind === 'b' ? body : GLASS;
        else if (e === 3 || e === 5) c = glassTop ? GLASS : body;
        else c = glassTop ? GLASS : strp;
        g.quadO(A[e], Bv[e], Bv[e + 1], A[e + 1], c, inside);
      }
    }
    // caps
    for (const [si, dir] of [[0, -1], [secs.length - 1, 1]]) {
      const s = secs[si], rg = ring(s), cen = [s.x, (s.yb + s.yt) / 2, 0], inn = [s.x - dir * 0.4, cen[1], 0];
      for (let e = 0; e < rg.length; e++) g.triO(cen, rg[e], rg[(e + 1) % rg.length], body, inn);
    }
    const front = secs[secs.length - 1], rear = secs[0];
    // headlights & grille
    const hly = (front.yb + front.ybelt) / 2 + 0.03;
    for (const sd of [-1, 1]) World.box(g, front.x - 0.03, hly - 0.07, sd * front.w * 0.6, 0.1, 0.15, 0.34, 0, [1, 0.97, 0.82]);
    World.box(g, front.x - 0.02, hly - 0.12, 0, 0.08, 0.14, front.w * 0.7, 0, [0.08, 0.08, 0.09]);
    // rear bumper dark band
    World.box(g, rear.x + 0.02, rear.yb + 0.02, 0, 0.1, 0.14, rear.w * 1.6, 0, [0.1, 0.1, 0.11]);
    // mirrors
    const ws = secs.find(s => s.k === 'gf');
    for (const sd of [-1, 1]) World.box(g, ws.x + 0.45, ws.ybelt, sd * (ws.w + 0.07), 0.14, 0.1, 0.12, 0, body);
    // spoiler
    if (def.spoiler) {
      const sxp = rear.x + 0.28, top = secs[1].yt + 0.28;
      for (const sd of [-1, 1]) World.box(g, sxp, secs[1].yt - 0.02, sd * rear.w * 0.62, 0.12, 0.3, 0.06, 0, [0.12, 0.12, 0.13]);
      World.box(g, sxp, top, 0, 0.36, 0.06, rear.w * 1.9, 0, stripe ? strp : body);
    }
    // rear wheels
    const r = M.rw, wx = -M.b * (M.len / 4.4) * 0.98;
    for (const sd of [-1, 1]) wheelInto(g, wx, r, sd * (M.wid * 0.5 - 0.1), r, 0.24, [0.08, 0.08, 0.09], [0.62, 0.64, 0.68]);
    const geo = smoothNormals(g.geometry(), 38);
    geoCache.set(key, geo);
    return geo;
  }
  let wheelGeo = null, tailGeoCache = new Map();
  let wheelGeoW = null;
  function getWheelGeo(white) {
    if (white) { if (!wheelGeoW) { const g = new GB(); wheelInto(g, 0, 0, 0, 0.31, 0.26, [0.07, 0.07, 0.08], [0.93, 0.93, 0.9]); wheelGeoW = g.geometry(); } return wheelGeoW; }
    if (wheelGeo) return wheelGeo;
    const g = new GB(); wheelInto(g, 0, 0, 0, 0.31, 0.24, [0.08, 0.08, 0.09], [0.62, 0.64, 0.68]); wheelGeo = g.geometry(); return wheelGeo;
  }
  function tailGeo(bodyKey, M) {
    const key = bodyKey + M.id; if (tailGeoCache.has(key)) return tailGeoCache.get(key);
    const def = BODIES[bodyKey], sx = M.len / def.len, sz = M.wid / def.wid;
    const rear = def.secs[0];
    const x = rear[0] * sx, w = rear[1] * sz, y = rear[3] - 0.16;
    const g = new GB();
    for (const sd of [-1, 1]) World.box(g, x - 0.01, y, sd * w * 0.6, 0.1, 0.15, 0.42, 0, [1, 1, 1]);
    const geo = g.geometry(); tailGeoCache.set(key, geo); return geo;
  }

  /* ---------------- materials (shared) ---------------- */
  let matCar, matWheel, matTailOff, matTailOn, matBlob, matMarker;
  // scratches: thin bright streaks through the paint, mostly lengthwise, patchy; strongest on the roof/upper body
  const SCRATCH_GLSL = [
    '{ vec3 p = vLp;',
    '  float band = fract(p.z * 23.0 + sin(p.x * 3.1) * 0.35 + floor(p.x * 1.7) * 0.37);',
    '  float ln = smoothstep(0.045, 0.0, abs(band - 0.5));',
    '  float band2 = fract(p.x * 17.0 + p.z * 5.0 + sin(p.z * 7.0) * 0.4);',
    '  float ln2 = smoothstep(0.03, 0.0, abs(band2 - 0.5)) * 0.7;',
    '  float patchN = fract(sin(dot(floor(vec2(p.x * 2.3, p.z * 9.0 + p.y * 3.0)), vec2(12.9898, 78.233))) * 43758.5453);',
    '  float top = smoothstep(0.8, 1.15, p.y);',
    '  float s = max(ln, ln2) * step(0.5, patchN) * clamp(uScr * (0.3 + top * 1.3), 0.0, 1.0);',
    '  float L = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));',
    '  vec3 sc = mix(vec3(0.82, 0.82, 0.85), vec3(0.28, 0.28, 0.3), step(0.55, L));',   // dark grime on light paint, bare metal on dark paint
    '  diffuseColor.rgb = mix(diffuseColor.rgb, sc, s * 0.85); }'].join('\n');
  // sky/horizon/ground cube map for glossy paint and glass reflections (generated, no image files)
  function makeEnv() {
    const S = 64, mkFace = (fn) => { const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), img = g.createImageData(S, S);
      for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const col = fn(i / (S - 1), j / (S - 1)), o = (j * S + i) * 4; img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255; }
      g.putImageData(img, 0, 0); return c; };
    const sky = (t) => [lerp(105, 200, t), lerp(155, 224, t), lerp(222, 246, t)];
    const side = (u, v) => v < 0.5 ? sky(v / 0.5) : v < 0.57 ? [238, 240, 242] : [lerp(96, 58, (v - 0.57) / 0.43), lerp(100, 62, (v - 0.57) / 0.43), lerp(90, 56, (v - 0.57) / 0.43)];
    const t = new THREE.CubeTexture([mkFace(side), mkFace(side), mkFace(() => sky(0)), mkFace(() => [58, 60, 56]), mkFace(side), mkFace(side)]);
    t.needsUpdate = true; return t;
  }
  // after a deformation: flat normals on the touched triangles so the crumpled metal catches the light
  function refacet(geo, tris) {
    const p = geo.attributes.position.array, n = geo.attributes.normal.array;
    for (const t of tris) {
      const o = t * 9, ax = p[o + 3] - p[o], ay = p[o + 4] - p[o + 1], az = p[o + 5] - p[o + 2], bx = p[o + 6] - p[o], by = p[o + 7] - p[o + 1], bz = p[o + 8] - p[o + 2];
      let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      for (let q = 0; q < 3; q++) { n[o + q * 3] = nx; n[o + q * 3 + 1] = ny; n[o + q * 3 + 2] = nz; }
    }
    geo.attributes.normal.needsUpdate = true;
  }
  // roof and upper body sag, the roof edges crumple (deterministic per position → no cracks between faces)
  function crumpleRoof(v, amt) {
    const geo = v.body.geometry, pos = geo.attributes.position, a = pos.array, ca = geo.attributes.color ? geo.attributes.color.array : null;
    if (!geo.boundingBox) geo.computeBoundingBox();
    const bb = geo.boundingBox, H = bb.max.y - bb.min.y, y0 = bb.min.y + H * 0.58, hz = Math.max(-bb.min.z, bb.max.z), tris = new Set();
    for (let k = 0; k < pos.count; k++) {
      const x = a[k * 3], y = a[k * 3 + 1], z = a[k * 3 + 2];
      if (y < y0) continue;
      const up = (y - y0) / Math.max(0.1, bb.max.y - y0), h1 = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453, n1 = h1 - Math.floor(h1);
      const h2 = Math.sin(x * 39.34 + z * 11.13) * 24634.63, n2 = h2 - Math.floor(h2), edge = Math.min(1, Math.abs(z) / (hz * 0.72));
      const m = amt * up * (0.35 + 0.65 * n1);
      a[k * 3 + 1] -= m * (0.2 + 0.2 * edge);                    // roof sags, its edges drop most
      a[k * 3 + 2] -= Math.sign(z) * m * (0.04 + 0.26 * (n1 - 0.3)) * edge;   // jagged edge: bits pushed in, bits bulging out
      a[k * 3] += (n2 - 0.5) * m * 0.2;                           // wrinkles along the roof
      if (ca && (n2 > 0.66 || edge > 0.85)) for (let q = 0; q < 3; q++) ca[k * 3 + q] = ca[k * 3 + q] * (1 - 0.42 * amt) + 0.16 * 0.42 * amt;   // dark creases
      tris.add((k / 3) | 0);
    }
    pos.needsUpdate = true; if (ca) geo.attributes.color.needsUpdate = true;
    refacet(geo, tris);
  }
  // glass panes of this car's body, grouped: 0 windscreen, 1 rear window, 2 left, 3 right (found by the glass colours)
  function findGlass(v) {
    const geo = v.body.geometry, p = geo.attributes.position.array, c = geo.attributes.color && geo.attributes.color.array, groups = [[], [], [], []];
    if (!c) return groups;
    const isGlass = (i) => (Math.abs(c[i] - 0.1) < 0.02 && Math.abs(c[i + 1] - 0.13) < 0.02 && Math.abs(c[i + 2] - 0.19) < 0.02) || (Math.abs(c[i] - 0.04) < 0.02 && Math.abs(c[i + 1] - 0.05) < 0.02 && Math.abs(c[i + 2] - 0.08) < 0.02);
    for (let t = 0; t < p.length / 9; t++) {
      const o = t * 9; if (!isGlass(o) || !isGlass(o + 3) || !isGlass(o + 6)) continue;
      const ax = p[o + 3] - p[o], ay = p[o + 4] - p[o + 1], az = p[o + 5] - p[o + 2], bx = p[o + 6] - p[o], by = p[o + 7] - p[o + 1], bz = p[o + 8] - p[o + 2];
      const nx = ay * bz - az * by, nz = ax * by - ay * bx, cx = (p[o] + p[o + 3] + p[o + 6]) / 3;
      const l = Math.hypot(nx, ay * 0 + (az * bx - ax * bz), nz) || 1, ux = nx / l, uz = nz / l;
      groups[Math.abs(uz) > 0.45 ? (uz < 0 ? 2 : 3) : (Math.abs(ux) > 0.3 ? (ux > 0 ? 0 : 1) : (cx > 0 ? 0 : 1))].push(t);
    }
    return groups;
  }
  // a broken pane: frosted glass + crack decal laid on the pane's own triangles, and a spray of shards
  function breakWindow(v, k, c, x, y, z, h) {
    const tris = v.glassTris[k]; if (!tris.length) return;
    const geo = v.body.geometry, p = geo.attributes.position.array, col = geo.attributes.color.array;
    for (const t of tris) for (let q = 0; q < 3; q++) { const i = t * 9 + q * 3; col[i] = col[i] * 0.55 + 0.42 * 0.45; col[i + 1] = col[i + 1] * 0.55 + 0.46 * 0.45; col[i + 2] = col[i + 2] * 0.55 + 0.5 * 0.45; }
    geo.attributes.color.needsUpdate = true;
    const side = k >= 2, P = [], U = [];
    let u0 = 1e9, u1 = -1e9, w0 = 1e9, w1 = -1e9, sx = 0, sy = 0, sz = 0;
    for (const t of tris) for (let q = 0; q < 3; q++) { const i = t * 9 + q * 3, uu = side ? p[i] : p[i + 2], ww = p[i + 1]; u0 = Math.min(u0, uu); u1 = Math.max(u1, uu); w0 = Math.min(w0, ww); w1 = Math.max(w1, ww); sx += p[i]; sy += p[i + 1]; sz += p[i + 2]; }
    const nV = tris.length * 3; sx /= nV; sy /= nV; sz /= nV;
    for (const t of tris) {
      const o = t * 9, ax = p[o + 3] - p[o], ay = p[o + 4] - p[o + 1], az = p[o + 5] - p[o + 2], bx = p[o + 6] - p[o], by = p[o + 7] - p[o + 1], bz = p[o + 8] - p[o + 2];
      let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      if (nx * (p[o] - 0) + ny * (p[o + 1] - sy * 0.6) + nz * p[o + 2] < 0) { nx = -nx; ny = -ny; nz = -nz; }   // point outwards
      for (let q = 0; q < 3; q++) { const i = o + q * 3; P.push(p[i] + nx * 0.014, p[i + 1] + ny * 0.014, p[i + 2] + nz * 0.014); U.push(((side ? p[i] : p[i + 2]) - u0) / Math.max(0.05, u1 - u0), (p[i + 1] - w0) / Math.max(0.05, w1 - w0)); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex.cracks, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }));
    v.bodyG.add(m); (v.decals = v.decals || []).push(m);
    const ch = Math.cos(h), sh = Math.sin(h), wx = x + sx * ch - sz * sh, wz = z + sx * sh + sz * ch;
    for (let n = 0; n < 18; n++) particles.emit(wx, y + sy, wz, c.vx * 0.5 + (Math.random() - 0.5) * 5, 1 + Math.random() * 3, c.vz * 0.5 + (Math.random() - 0.5) * 5, 0.8 + Math.random() * 0.6, 0.16, 0.1, 0.84, 0.9, 0.97, 0.95, 9, 0.6, y);
  }

  function dirtyCarMat() {       // clone of the shared car paint + a dirt uniform (dust/mud climbs up from the sills)
    const m = matCar.clone(), u = { value: 0 }, us = { value: 0 };
    m.userData.dirt = u; m.userData.scr = us;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uDirt = u; sh.uniforms.uScr = us;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLp;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLp = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vLp;\nuniform float uDirt;\nuniform float uScr;').replace('#include <color_fragment>',
        '#include <color_fragment>\n{ float n = fract(sin(dot(floor(vLp * 7.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453);\n  float low = 1.0 - smoothstep(0.2, 1.0, vLp.y + (n - 0.5) * 0.35);\n  float d = clamp(uDirt * (0.22 + 0.95 * low) * (0.7 + 0.6 * n), 0.0, 0.8);\n  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.5, 0.4, 0.29), d); }');
      sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n' + SCRATCH_GLSL);
    };
    m.customProgramCacheKey = () => 'dirtyCar2';
    return m;
  }
  const numTexCache = new Map();
  function numTex(n) { if (!numTexCache.has(n)) numTexCache.set(n, Tex.number(n)); return numTexCache.get(n); }

  /* ---------------- Peugeot 206: real 3D model ---------------- */
  // "Peugeot 206" by Alvier (sketchfab.com), CC BY 4.0; the packed model (and its layout) is in js/data/p206.js
  const P206_HDR = P206_MODEL.hdr, P206_BIN = P206_MODEL.bin;
  let p206Geo = null, p206Mats = null;
  function p206Parts() {
    if (!p206Geo) {
      const raw = atob(P206_BIN), buf = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
      let off = 0;
      p206Geo = P206_HDR.nodes.map(n => ({ name: n.n, t: n.t, g: n.g, prims: n.p.map(([mat, nv, ni]) => {
        const q = new Int16Array(buf.buffer, off, nv * 3); off += nv * 6;
        const nq = new Int8Array(buf.buffer, off, nv * 3); off += nv * 3 + (nv * 3 & 1);
        const idx = new Uint16Array(buf.buffer, off, ni); off += ni * 2;
        const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3);
        for (let i = 0; i < pos.length; i++) { pos[i] = q[i] * P206_HDR.q; nrm[i] = nq[i] / 127; }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
        g.setIndex(new THREE.BufferAttribute(new Uint16Array(idx), 1)); g.computeBoundingSphere();
        return { mat, g };
      }) }));
      for (const n of p206Geo) if (n.g) { const src = p206Geo.find(o => o.name === n.g); n.prims = src.prims; n.mirror = Math.sign(n.t[2]) !== Math.sign(src.t[2]); }
    }
    if (!p206Mats) {
      const chrome = new THREE.MeshPhongMaterial({ color: 0x2c2e33, shininess: 90, specular: 0x777777, envMap: envTex, combine: THREE.MixOperation, reflectivity: 0.45 });
      p206Mats = { black: new THREE.MeshLambertMaterial({ color: 0x1b1c20 }), chrome, grey: new THREE.MeshLambertMaterial({ color: 0x55575c }),
        light: new THREE.MeshLambertMaterial({ color: 0xd9d9d6 }), darkred: new THREE.MeshLambertMaterial({ color: 0x7a1510 }),
        lamp: new THREE.MeshBasicMaterial({ color: 0xfff4dc }) };
    }
    return p206Geo;
  }
  // builds the model into a car view: body into bodyG (rolls/pitches), wheels into grp (steer/spin like the stock wheels)
  function addP206(car, bodyG, grp, wf, wr) {
    const paint = new THREE.MeshPhongMaterial({ color: car.color, shininess: 80, specular: 0x505050, envMap: envTex, combine: THREE.MixOperation, reflectivity: 0.2 });
    const tail = new THREE.MeshLambertMaterial({ color: 0x8a0d08, emissive: 0x3a0000 });
    for (const n of p206Parts()) {
      const holder = new THREE.Group(); holder.position.set(n.t[0], n.t[1], n.t[2]);
      const inner = new THREE.Group(); holder.add(inner); if (n.mirror) inner.scale.z = -1;   // spin/steer stay on the holder
      for (const p of n.prims) {
        const m = new THREE.Mesh(p.g, p.mat === 'paint' ? paint : p.mat === 'red' ? tail : p206Mats[p.mat]);
        m.castShadow = true; inner.add(m);
      }
      if (n.name === 'body') bodyG.add(holder);
      else { grp.add(holder); (n.t[0] > 0 ? wf : wr).push(holder); }
    }
    return { paint, tail };
  }

  function makeCarMesh(car, opts) {
    const M = car.m;
    const grp = new THREE.Group();
    const bodyG = new THREE.Group(); grp.add(bodyG);
    const bodyMat = (opts && opts.noDirt) ? matCar : dirtyCarMat();
    const body = new THREE.Mesh(carGeometry(M.body, M, car.color, car.stripe !== false), bodyMat);
    body.castShadow = true; body.receiveShadow = false; bodyG.add(body);
    const tail = new THREE.Mesh(tailGeo(M.body, M), matTailOff); bodyG.add(tail);
    const def = BODIES[M.body];
    const dec = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.86), new THREE.MeshLambertMaterial({ map: numTex(car.num || 0), transparent: true }));
    dec.geometry.rotateX(-Math.PI / 2); dec.geometry.rotateY(-Math.PI / 2);
    dec.position.set(def.decalX != null ? def.decalX * (M.len / def.len) : def.secs.find(s => s[7] === 'r')[0] * (M.len / def.len) + 0.3 * (M.len / def.len), def.roofY + 0.012, 0);
    bodyG.add(dec);
    if (M.body === 'rally') {
      const sxr = M.len / def.len, szr = M.wid / def.wid;
      for (const sd of [-1, 1]) {
        const dd = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.46), dec.material);
        dd.position.set(-0.28 * sxr, 0.66, sd * (0.90 * szr + 0.02));
        dd.rotation.y = sd > 0 ? 0 : Math.PI;
        bodyG.add(dd);
      }
    }
    const wf = [], wr = [];
    const fx = M.a * (M.len / 4.4) * 0.98 + 0.05;
    let glb = null;
    if (M.glb === 'p206') {   // real model: the stock body stays as an invisible stand-in (dents, glass) and the model is drawn instead
      body.visible = false; tail.visible = false; dec.visible = false;
      glb = addP206(car, bodyG, grp, wf, wr);
    } else for (const sd of [-1, 1]) { const w = new THREE.Mesh(getWheelGeo(M.body === 'rally'), matWheel); w.position.set(fx, M.rw, sd * (M.wid * 0.5 - 0.1)); grp.add(w); wf.push(w); }
    let blob = null;
    if (!opts || !opts.noBlob) {
      blob = new THREE.Mesh(new THREE.PlaneGeometry(M.len * 1.25, M.wid * 1.45), matBlob);
      blob.geometry.rotateX(-Math.PI / 2); blob.position.y = 0.05; blob.renderOrder = 1; grp.add(blob);
    }
    let marker = null;
    if (car.isPlayer && !(opts && opts.noMarker)) {
      marker = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.3, 3), matMarker);
      marker.rotation.x = Math.PI; marker.position.y = 4; grp.add(marker);
    }
    // head/tail light anchor points (for the glow sprites), from the body's front/rear sections
    const dB = BODIES[M.body], sxB = M.len / dB.len, szB = M.wid / dB.wid, rs = dB.secs[0], fs = dB.secs[dB.secs.length - 1];
    const lights = [];
    for (const sd of [-1, 1]) lights.push(new THREE.Vector3(fs[0] * sxB + 0.05, fs[3] - 0.12, sd * fs[1] * szB * 0.62));
    for (const sd of [-1, 1]) lights.push(new THREE.Vector3(rs[0] * sxB - 0.06, rs[3] - 0.16, sd * rs[1] * szB * 0.6));
    if (glb) { lights[0].y = lights[1].y = 0.68; lights[2].y = lights[3].y = 0.86; }
    return { grp, bodyG, body, tail, dec, wf, wr, glb, blob, marker, lights, dirtU: bodyMat.userData && bodyMat.userData.dirt || null, scrU: bodyMat.userData && bodyMat.userData.scr || null };
  }

  /* ---------------- particles ---------------- */
  class Particles {
    constructor(max, additive) {
      this.max = max; this.cur = 0;
      this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 4); this.size = new Float32Array(max);
      this.vel = new Float32Array(max * 3); this.life = new Float32Array(max); this.ml = new Float32Array(max);
      this.floor = new Float32Array(max);
      this.s0 = new Float32Array(max); this.s1 = new Float32Array(max); this.a0 = new Float32Array(max); this.grav = new Float32Array(max); this.drag = new Float32Array(max);
      const g = new THREE.BufferGeometry();
      this.aPos = new THREE.BufferAttribute(this.pos, 3); this.aPos.setUsage(THREE.DynamicDrawUsage);
      this.aCol = new THREE.BufferAttribute(this.col, 4); this.aCol.setUsage(THREE.DynamicDrawUsage);
      this.aSize = new THREE.BufferAttribute(this.size, 1); this.aSize.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('position', this.aPos); g.setAttribute('pcolor', this.aCol); g.setAttribute('psize', this.aSize);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      this.mat = new THREE.ShaderMaterial({
        uniforms: { uScale: { value: 400 } },
        vertexShader: 'attribute float psize; attribute vec4 pcolor; uniform float uScale; varying vec4 vC; void main(){ vC = pcolor; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = psize * uScale / max(1.0, -mv.z); gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'varying vec4 vC; void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d,d)*4.0; if (r > 1.0) discard; float a = vC.a * (1.0 - r) * (1.0 - r * 0.3); gl_FragColor = vec4(vC.rgb, a); }',
        transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      });
      this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false; this.points.renderOrder = additive ? 6 : 5;
    }
    emit(x, y, z, vx, vy, vz, life, s0, s1, r, g, b, a, grav, drag, floor) {
      const i = this.cur; this.cur = (this.cur + 1) % this.max;
      if (i < this.lo) this.lo = i; if (i > this.hi) this.hi = i;
      this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
      this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
      this.life[i] = life; this.ml[i] = life; this.s0[i] = s0; this.s1[i] = s1; this.a0[i] = a; this.grav[i] = grav || 0; this.drag[i] = drag == null ? 1.5 : drag; this.floor[i] = (floor == null ? 0 : floor) + 0.05;
      this.col[i * 4] = r; this.col[i * 4 + 1] = g; this.col[i * 4 + 2] = b; this.col[i * 4 + 3] = a;
    }
    update(dt) {
      const n = this.max;
      for (let i = 0; i < n; i++) {
        if (this.life[i] <= 0) { this.size[i] = 0; this.col[i * 4 + 3] = 0; continue; }
        this.life[i] -= dt;
        const t = 1 - this.life[i] / this.ml[i];
        const dr = Math.max(0, 1 - this.drag[i] * dt);
        this.vel[i * 3] *= dr; this.vel[i * 3 + 2] *= dr; this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * dr - this.grav[i] * dt;
        this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
        if (this.pos[i * 3 + 1] < this.floor[i]) { this.pos[i * 3 + 1] = this.floor[i]; this.vel[i * 3 + 1] *= -0.3; this.vel[i * 3] *= 0.6; this.vel[i * 3 + 2] *= 0.6; }
        this.size[i] = this.s0[i] + (this.s1[i] - this.s0[i]) * Math.sqrt(t);
        this.col[i * 4 + 3] = this.a0[i] * (1 - t) * Math.min(1, t * 8 + 0.2);
      }
      this.aPos.needsUpdate = true; this.aCol.needsUpdate = true; this.aSize.needsUpdate = true;
    }
    clear() { this.life.fill(0); }
  }

  /* ---------------- car light glows ---------------- */
  class Glows {
    constructor(max) {
      this.max = max; this.n = 0;
      this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 4); this.size = new Float32Array(max);
      const g = new THREE.BufferGeometry();
      this.aPos = new THREE.BufferAttribute(this.pos, 3); this.aPos.setUsage(THREE.DynamicDrawUsage);
      this.aCol = new THREE.BufferAttribute(this.col, 4); this.aCol.setUsage(THREE.DynamicDrawUsage);
      this.aSize = new THREE.BufferAttribute(this.size, 1); this.aSize.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('position', this.aPos); g.setAttribute('pcolor', this.aCol); g.setAttribute('psize', this.aSize);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      this.mat = new THREE.ShaderMaterial({
        uniforms: { uScale: { value: 400 } },
        vertexShader: 'attribute float psize; attribute vec4 pcolor; uniform float uScale; varying vec4 vC; void main(){ vC = pcolor; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = psize * uScale / max(1.0, -mv.z); gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'varying vec4 vC; void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; if (r > 1.0) discard; float a = vC.a * pow(1.0 - r, 2.2); gl_FragColor = vec4(vC.rgb, a); }',
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false; this.points.renderOrder = 7;
    }
    begin() { this.n = 0; }
    add(x, y, z, sz, r, g, b, a) {
      if (this.n >= this.max) return; const i = this.n++;
      this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z; this.size[i] = sz;
      this.col[i * 4] = r; this.col[i * 4 + 1] = g; this.col[i * 4 + 2] = b; this.col[i * 4 + 3] = a;
    }
    end() { this.points.geometry.setDrawRange(0, this.n); this.aPos.needsUpdate = true; this.aCol.needsUpdate = true; this.aSize.needsUpdate = true; }
  }

  /* ---------------- skid marks ---------------- */
  class Skids {
    constructor(max) {
      this.max = max; this.cur = 0;
      this.pos = new Float32Array(max * 12); this.col = new Float32Array(max * 16);
      const idx = [];
      for (let i = 0; i < max; i++) { const b = i * 4; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
      const g = new THREE.BufferGeometry();
      this.aPos = new THREE.BufferAttribute(this.pos, 3); this.aPos.setUsage(THREE.DynamicDrawUsage);
      this.aCol = new THREE.BufferAttribute(this.col, 4); this.aCol.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('position', this.aPos); g.setAttribute('color', this.aCol); g.setIndex(idx);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      const m = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
      this.mesh = new THREE.Mesh(g, m); this.mesh.frustumCulled = false; this.mesh.renderOrder = 2;
      this.dirty = false; this.lo = 1e9; this.hi = -1;
    }
    add(x0, z0, x1, z1, wd, r, g, b, a0, a1, y0, y1) {
      const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1;
      const nx = -dz / l * wd, nz = dx / l * wd;
      const i = this.cur; this.cur = (this.cur + 1) % this.max;
      if (i < this.lo) this.lo = i; if (i > this.hi) this.hi = i;
      const p = this.pos, o = i * 12, ya = 0.03 + (y0 || 0), yc = 0.03 + (y1 == null ? (y0 || 0) : y1);
      p[o] = x0 - nx; p[o + 1] = ya; p[o + 2] = z0 - nz; p[o + 3] = x0 + nx; p[o + 4] = ya; p[o + 5] = z0 + nz;
      p[o + 6] = x1 - nx; p[o + 7] = yc; p[o + 8] = z1 - nz; p[o + 9] = x1 + nx; p[o + 10] = yc; p[o + 11] = z1 + nz;
      const c = this.col, q = i * 16;
      for (let k = 0; k < 4; k++) { c[q + k * 4] = r; c[q + k * 4 + 1] = g; c[q + k * 4 + 2] = b; c[q + k * 4 + 3] = k < 2 ? a0 : a1; }
      this.dirty = true;
    }
    flush() {
      if (!this.dirty) return;
      if (this.hi >= this.lo) {
        this.aPos.updateRange.offset = this.lo * 12; this.aPos.updateRange.count = (this.hi - this.lo + 1) * 12;
        this.aCol.updateRange.offset = this.lo * 16; this.aCol.updateRange.count = (this.hi - this.lo + 1) * 16;
      }
      this.aPos.needsUpdate = true; this.aCol.needsUpdate = true; this.dirty = false; this.lo = 1e9; this.hi = -1;
    }
    clear() { this.pos.fill(0); this.col.fill(0); this.dirty = true; this.lo = 1e9; this.hi = -1; this.aPos.updateRange.count = -1; this.aCol.updateRange.count = -1; this.aPos.needsUpdate = true; this.aCol.needsUpdate = true; this.dirty = false; }
  }

  /* ---------------- module state ---------------- */
  let envTex = null, renderer, scene, camera, sun, hemi, tex, world = null, sparkP = null, glows = null, curTrack = null, curRace = null;
  const debrisMeshes = [];
  let particles, skids, views = [];
  let basePR = 1, dynScale = 1;
  let settings = { quality: 'high', shadows: true, camera: 'iso' };
  const cam = { x: 0, z: 0, lx: 0, lz: 0, zoom: 1, hs: 0, shake: 0, init: false, userZoom: 1 };
  let time = 0;
  let showScene = null, showCam = null, showCar = null, showAngle = 0.6;

  function init(canvas) {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false, stencil: false });
    renderer.setClearColor(0x263f1f, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(30, 16 / 9, 4, 700);
    hemi = new THREE.HemisphereLight(0xd8ebff, 0x5d6b35, 0.66); scene.add(hemi);
    sun = new THREE.DirectionalLight(0xfff0d4, 0.92);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera; sc.left = -80; sc.right = 80; sc.top = 80; sc.bottom = -80; sc.near = 10; sc.far = 320;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
    scene.add(sun); scene.add(sun.target);
    tex = Tex.all(renderer.capabilities.getMaxAnisotropy());
    matCar = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 80, specular: 0x505050 });
    envTex = makeEnv(); matCar.envMap = envTex; matCar.combine = THREE.MixOperation; matCar.reflectivity = 0.2;   // glossy paint: sky + bright horizon band
    matWheel = new THREE.MeshLambertMaterial({ vertexColors: true });
    matTailOff = new THREE.MeshLambertMaterial({ color: 0x6a1212 });
    matTailOn = new THREE.MeshBasicMaterial({ color: 0xff2a1a });
    matBlob = new THREE.MeshBasicMaterial({ map: tex.blob, transparent: true, depthWrite: false, opacity: 0.8 });
    matMarker = new THREE.MeshBasicMaterial({ color: 0xffd23f });
    particles = new Particles(2400); scene.add(particles.points);
    sparkP = new Particles(700, true); scene.add(sparkP.points);
    glows = new Glows(4 * 16); scene.add(glows.points);
    skids = new Skids(8000); scene.add(skids.mesh);
    scene.fog = new THREE.Fog(0xbcd3e4, 80, 400);
    initPost();
    return renderer;
  }

  function buildWorld(track, density) {
    camYaw = (track && track.def && track.def.camYaw) || 0;   // fixed heading of the 'kino' camera for this circuit (clockwise from north)
    if (world && world.root) {   // switching tracks: drop and free the previous scenery
      scene.remove(world.root);
      world.root.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); if (o.isInstancedMesh) o.dispose(); });   // (instanced: its instance buffers)
      if (world.ownTex) world.ownTex.forEach(t => t.dispose());   // textures made for that track only (the shared ones stay cached)
      if (skids) skids.clear();
    }
    clearPropMeshes();
    world = World.build(scene, track, tex, { density });
    if (!world.farClip && camera.far !== 700) { camera.far = 700; camera.updateProjectionMatrix(); }
    applyTheme((track.def && track.def.theme) || 'lake');
    return world;
  }

  /* ---------------- knockable trackside props (cones, pylons, tyre stacks, straw bales, crates, roadside posts): one instanced mesh per kind ---------------- */
  let propMeshes = {};
  const PROP_COLS = [[0.88, 0.33, 0.24], [0.95, 0.95, 0.94], [0.27, 0.6, 0.35], [0.2, 0.2, 0.22], [0.92, 0.89, 0.74]];   // instance tint: red / white / green / black / cream (painted tyres, the same as the tyre walls)
  const POST_SNOW = [1, 0.53, 0.13];                              // instance tint of the orange snow poles high up on Pikes Peak (a 'post' with col 1)
  let propMat = null, propMatTyre = null;
  function propGeometry(kind) {
    const W = World, g = new W.GB(kind === 'tyre' || kind === 'tstack'), white = [1, 1, 1], TAU2 = Math.PI * 2;
    const disc = (y, r, n, rim, mid, up) => { for (let k = 0; k < n; k++) { const a0 = k / n * TAU2, a1 = (k + 1) / n * TAU2, c = [0, y, 0], p0 = [Math.cos(a0) * r, y, Math.sin(a0) * r], p1 = [Math.cos(a1) * r, y, Math.sin(a1) * r];
      g.triO(c, p0, p1, mid, [0, y + (up ? -1 : 1), 0], rim, rim); } };
    const tyre = (y0, h, r, vTop) => {   // painted tyre(s) with the tyre texture (the instance colour tints it red or white): textured side band, a ring with a dark hole top and bottom
      const n = 8, rim = (a) => [0.5 + 0.49 * Math.cos(a), 0.25 + 0.245 * Math.sin(a)];
      for (let k = 0; k < n; k++) { const a0 = k / n * TAU2, a1 = (k + 1) / n * TAU2, b0 = [Math.cos(a0) * r, y0, Math.sin(a0) * r], b1 = [Math.cos(a1) * r, y0, Math.sin(a1) * r], t0 = [b0[0], y0 + h, b0[2]], t1 = [b1[0], y0 + h, b1[2]], u0 = k / n * 2, u1 = (k + 1) / n * 2;
        g.quadO(b0, t0, t1, b1, white, [0, y0 + h / 2, 0], [[u0, 0.5], [u0, vTop], [u1, vTop], [u1, 0.5]]);
        g.triO([0, y0 + h, 0], t1, t0, white, [0, y0, 0], white, white, [0.5, 0.25], rim(a1), rim(a0));
        g.triO([0, y0, 0], b0, b1, white, [0, y0 + h, 0], white, white, [0.5, 0.25], rim(a0), rim(a1)); } };
    const bale = (cx, cy, cz) => { const st = [0.8, 0.62, 0.3], tp = [0.9, 0.74, 0.4], tw = [0.46, 0.33, 0.17];
      W.box(g, cx, cy - 0.425, cz, 1.3, 0.85, 0.9, 0, st, tp); for (const bx of [-0.34, 0.34]) W.box(g, cx + bx, cy - 0.435, cz, 0.07, 0.87, 0.92, 0, tw, tw); };
    const rbale = (cx, cy, cz) => { const n = 10, r = 0.43, L = 0.62, st = [0.8, 0.62, 0.3], en = [0.9, 0.74, 0.4], tw = [0.46, 0.33, 0.17], c = [cx, cy, cz];   // round bale on its side, the axis along x
      for (let k = 0; k < n; k++) { const a0 = k / n * TAU2, a1 = (k + 1) / n * TAU2, P = (x, a, rr) => [cx + x, cy + Math.cos(a) * rr, cz + Math.sin(a) * rr];
        g.quadO(P(-L, a0, r), P(-L, a1, r), P(L, a1, r), P(L, a0, r), st, c);
        for (const bx of [-0.3, 0.3]) g.quadO(P(bx - 0.035, a0, r + 0.01), P(bx - 0.035, a1, r + 0.01), P(bx + 0.035, a1, r + 0.01), P(bx + 0.035, a0, r + 0.01), tw, c);
        g.triO(P(L, a0, r), P(L, a1, r), [cx + L, cy, cz], en, c); g.triO(P(-L, a1, r), P(-L, a0, r), [cx - L, cy, cz], en, c); } };
    if (kind === 'cone') {
      W.box(g, 0, -0.17, 0, 0.62, 0.05, 0.62, 0, [0.95, 0.4, 0.08]);
      W.cyl(g, 0, -0.12, 0, 0.25, 0.3, 10, [1, 0.42, 0.08], null, 0.17); W.cyl(g, 0, 0.18, 0, 0.17, 0.13, 10, [0.97, 0.96, 0.93], null, 0.135);
      W.cone(g, 0, 0.31, 0, 0.135, 0.28, 10, [1, 0.42, 0.08], [1, 0.6, 0.3], 0);
    } else if (kind === 'pylon') {
      for (let q = 0; q < 4; q++) W.cyl(g, 0, -0.68 + q * 0.34, 0, 0.36, 0.34, 10, q % 2 ? [0.95, 0.94, 0.92] : [0.86, 0.16, 0.14]);
      disc(0.68, 0.36, 10, [0.86, 0.16, 0.14], [0.2, 0.05, 0.05], true); disc(-0.68, 0.36, 10, [0.86, 0.16, 0.14], [0.3, 0.1, 0.1], false);
    } else if (kind === 'tyre') tyre(-0.13, 0.26, 0.43, 0.6667);   // one band of the texture = one tyre
    else if (kind === 'tstack') tyre(-0.39, 0.78, 0.43, 0.998);      // a column of three
    else if (kind === 'bale') bale(0, 0, 0);   // (bale(cx, cy, cz): cy is the bale's centre)
    else if (kind === 'bstack') { bale(-0.66, -0.425, 0); bale(0.66, -0.425, 0); bale(0, 0.425, 0); }
    else if (kind === 'rbale') rbale(0, 0, 0);
    else if (kind === 'rbstack') { rbale(-0.66, -0.425, 0); rbale(0.66, -0.425, 0); rbale(0, 0.425, 0); }
    else if (kind === 'crate') { const wd = [0.56, 0.38, 0.22], dk = [0.4, 0.26, 0.15]; W.box(g, 0, -0.4, 0, 1.0, 0.8, 0.8, 0, wd, [0.62, 0.43, 0.26]);
      for (const y of [-0.12, 0.14]) W.box(g, 0, y, 0, 1.02, 0.05, 0.82, 0, dk, dk); for (const x of [-0.46, 0.46]) W.box(g, x, -0.41, 0, 0.08, 0.82, 0.82, 0, dk, dk); }
    else if (kind === 'post') {   // roadside post (stebriček): white, a black band with orange reflectors both ways; its foot sits 10 cm in the ground
      const wh = [0.95, 0.95, 0.93], bk = [0.08, 0.08, 0.09], rf = [1, 0.45, 0.08];
      W.box(g, 0, -0.65, 0, 0.14, 1.2, 0.14, 0, wh, wh); W.box(g, 0, 0.18, 0, 0.146, 0.22, 0.146, 0, bk, bk);
      for (const x of [-0.074, 0.074]) W.box(g, x, 0.22, 0, 0.012, 0.12, 0.09, 0, rf, rf); }
    return g.geometry();
  }
  function clearPropMeshes() { for (const k in propMeshes) { const m = propMeshes[k]; scene.remove(m); m.geometry.dispose(); } propMeshes = {}; }
  function setupProps(race) {
    if (!race || !race.props) { for (const k in propMeshes) propMeshes[k].visible = false; return; }
    if (!propMat) { propMat = new THREE.MeshLambertMaterial({ vertexColors: true }); propMatTyre = new THREE.MeshLambertMaterial({ vertexColors: true, map: tex.tyreTex }); }
    const cap = race.propCap || {};
    for (const kind in cap) {
      let m = propMeshes[kind];
      if (!m || m.userData.cap < cap[kind]) {
        if (m) { scene.remove(m); m.geometry.dispose(); }
        m = new THREE.InstancedMesh(propGeometry(kind), kind === 'tyre' || kind === 'tstack' ? propMatTyre : propMat, cap[kind]); m.userData.cap = cap[kind];
        m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
        scene.add(m); propMeshes[kind] = m;
      }
      m.visible = true;
      for (let i = 0; i < cap[kind]; i++) m.setColorAt(i, _pc.setRGB(1, 1, 1));
    }
    for (const k in propMeshes) if (!cap[k]) propMeshes[k].visible = false;
    for (const b of race.props) { b.dirty = true; b.colSet = false; }
    syncProps();
  }
  const _pm4 = new THREE.Matrix4(), _pq4 = new THREE.Quaternion(), _pv3 = new THREE.Vector3(), _ps3 = new THREE.Vector3(1, 1, 1), _pc = new THREE.Color(), _zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const _fq = {};
  function floorAt(x, z) { const T = curRace && curRace.track, f = curRace && curRace.propFloor; if (!T || (!T.hasElev && !f)) return 0; const q = T.query(x, z, -1, _fq); return (T.hasElev ? T.elevAt(q.s).y : 0) + (f ? f(q) : 0); }   // particle floor: the road height there (0 on the flat circuits; the verge's where it lies lower)
  function syncProps() {
    if (!curRace || !curRace.props) return;
    const E = curRace.propEvents;
    if (E && E.length) {   // a puff where something got knocked: straw for bales, dust and rubber crumbs for tyres, a little dust for the rest
      for (const e of E) { const k = e.kind, straw = k === 'bale' || k === 'bstack' || k === 'rbale' || k === 'rbstack', rub = k === 'tyre' || k === 'tstack', n = straw ? 14 : rub ? 8 : 4, sp = Math.min(6, 1.5 + e.v * 0.15), fy = floorAt(e.x, e.z);
        for (let q = 0; q < n; q++) { const a = Math.random() * Math.PI * 2, v = sp * (0.3 + Math.random() * 0.7), y = e.y + (Math.random() - 0.3) * 0.5;
          if (straw) particles.emit(e.x, y, e.z, Math.cos(a) * v, 1.5 + Math.random() * 2.5, Math.sin(a) * v, 0.9 + Math.random() * 0.6, 0.16, 0.1, 0.92, 0.78, 0.42, 1, 7, 1.2, fy);
          else if (rub && q < 3) particles.emit(e.x, y, e.z, Math.cos(a) * v, 1 + Math.random() * 2, Math.sin(a) * v, 0.7, 0.12, 0.08, 0.1, 0.1, 0.11, 1, 9, 1, fy);
          else particles.emit(e.x, (e.y - fy) * 0.5 + 0.2 + fy, e.z, Math.cos(a) * v * 0.5, 0.5 + Math.random(), Math.sin(a) * v * 0.5, 0.8 + Math.random() * 0.5, 0.5, 1.4, 0.62, 0.56, 0.5, 0.42, -0.2, 2.2, fy); } }
      E.length = 0;
    }
    // only the props around the view are drawn (and cast shadows): packed into the front of each instanced mesh every frame
    const cx = cam.vcx || 0, cz = cam.vcz || 0, R = Math.max((world && world.propR) || 95, (cam.vd || 60) * 2.3), R2 = R * R;   // (propR: the long open corridors see farther, so nothing pops in)
    for (const k in propMeshes) propMeshes[k].userData.n = 0;
    for (const b of curRace.props) {
      if (b.hidden || b.slot < 0) continue;
      const m = propMeshes[b.kind]; if (!m) continue;
      const dx = b.x - cx, dz = b.z - cz; if (dx * dx + dz * dz > R2) continue;
      const n = m.userData.n++;
      _pv3.set(b.x, b.y, b.z); _pq4.set(b.qx, b.qy, b.qz, b.qw); _pm4.compose(_pv3, _pq4, _ps3); m.setMatrixAt(n, _pm4);
      const c = (b.kind === 'tyre' || b.kind === 'tstack') ? (PROP_COLS[b.col] || PROP_COLS[1]) : b.kind === 'post' && b.col === 1 ? POST_SNOW : null;   // (col 1 posts: orange snow poles)
      if (c) m.setColorAt(n, _pc.setRGB(c[0], c[1], c[2])); else if (m.instanceColor) m.setColorAt(n, _pc.setRGB(1, 1, 1));
    }
    for (const k in propMeshes) { const m = propMeshes[k]; m.count = m.userData.n; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  }


  function applySettings(s) {
    settings = Object.assign(settings, s);
    const dpr = window.devicePixelRatio || 1;
    basePR = settings.quality === 'retro' ? 0.5 : settings.quality === 'normal' ? 1 : Math.min(dpr, 2);
    renderer.domElement.style.imageRendering = settings.quality === 'retro' ? 'pixelated' : 'auto';
    renderer.shadowMap.enabled = !!settings.shadows;
    renderer.shadowMap.type = settings.quality === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    const ms = settings.quality === 'high' ? 2048 : 1024;
    if (sun.shadow.mapSize.x !== ms) { sun.shadow.mapSize.set(ms, ms); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
    if (!settings.shadows && sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }   // shadows off: free the shadow map
    // every material is rebuilt, so shadow receiving goes in or out of its shader (three.js r128 has no getter for needsUpdate:
    // it has to be set on each material; the shaders are compiled again at the next frame)
    const upd = (o) => { if (o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.needsUpdate = true; };
    scene.traverse(upd); if (showScene) showScene.traverse(upd);
    resize();
  }

  function resize() {
    if (!renderer) return;
    const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
    renderer.setPixelRatio(basePR * dynScale);
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (showCam) { showCam.aspect = w / h; showCam.updateProjectionMatrix(); }
    updatePointScale(); sizePost();
  }
  const THEMES = {
    lake:     { fog: 0xbcd3e4, sun: 0xfff0d6, sunI: 0.98, sky: 0xd3e7ff, gnd: 0x5d6b35, hemiI: 0.62, tint: [1.02, 1.0, 0.97], sat: 1.1 },
    city:     { fog: 0xd8e3ea, sun: 0xffe5bd, sunI: 1.04, sky: 0xdcecff, gnd: 0x86785a, hemiI: 0.6, tint: [1.05, 1.0, 0.93], sat: 1.12 },
    ljubljana: { fog: 0xcadbe9, sun: 0xffe6c2, sunI: 1.04, sky: 0xd8e9ff, gnd: 0x7a6e56, hemiI: 0.6, tint: [1.04, 1.0, 0.95], sat: 1.13 },
    forest:   { fog: 0x9a90c6, sun: 0xff9e5e, sunI: 2.26, sky: 0x6d8cec, gnd: 0x1c357f, hemiI: 0.7, tint: [1.0, 0.95, 1.04], sat: 1.06, sunOff: [-55, 64, -106] },   // low sun in the NNW, in front of the kino camera: back-lit, long shadows falling towards the lower right (measured from the reference)   // warm key light, navy-blue shadows (as in the reference)   // warm evening: peach sun, lavender haze
    italia:   { fog: 0xa4a6d0, sun: 0xffb47c, sunI: 2.2, sky: 0x7090ea, gnd: 0x6e5a78, hemiI: 0.7, tint: [1.0, 0.96, 1.03], sat: 1.06, sunOff: [-100, 70, -58] },   // Toskana: the forest's warm key light and navy shadows, a little less orange, the sun in the west-north-west (measured from the reference)
    kamp:     { fog: 0xa4a8d0, sun: 0xff9468, sunI: 1.33, sky: 0xc6ceff, gnd: 0x7a7338, hemiI: 1.0, tint: [1.0, 0.96, 1.03], sat: 1.06, sunOff: [-100, 80, 30] },   // Gromski rt: sun in the west-south-west, a warm bright ambient: softer shadows, as in the reference
    monaco:   { fog: 0xcfe2f1, sun: 0xfff0d6, sunI: 1.08, sky: 0xd8ebff, gnd: 0x8a7c62, hemiI: 0.6, tint: [1.03, 1.0, 0.95], sat: 1.14 },
    mountain: { fog: 0xb4cadf, sun: 0xfff2e0, sunI: 1.0, sky: 0xc8dcff, gnd: 0x4d5c33, hemiI: 0.6, tint: [0.98, 1.0, 1.03], sat: 1.12 },
    ouni:     { fog: 0xc3d3de, sun: 0xfff1da, sunI: 1.06, sky: 0xd0e2f6, gnd: 0x46552c, hemiI: 0.6, tint: [1.0, 1.0, 1.01], sat: 1.08 },   // Ouninpohja: a clear Finnish August day, soft haze over the forests and lakes
    pikes:    { fog: 0xbfd3e8, sun: 0xfff4e4, sunI: 1.1, sky: 0xcfe0ff, gnd: 0x6b5847, hemiI: 0.6, tint: [1.0, 0.99, 1.02], sat: 1.1 },   // clear, thin high-altitude air: bright sun, pale blue haze over the valleys
    nring:    { fog: 0xc6d4dd, sun: 0xfff0da, sunI: 1.02, sky: 0xd4e4f2, gnd: 0x46552f, hemiI: 0.62, tint: [1.0, 1.01, 0.99], sat: 1.12 },   // the Eifel: soft hazy daylight over the 'green hell'
  };
  function applyTheme(id) {
    const t = THEMES[id] || THEMES.lake;
    sunOff = t.sunOff || [-80, 96, 70];   // low evening sun where the theme asks for it (long shadows)
    scene.fog.color.setHex(t.fog); renderer.setClearColor(t.fog, 1);
    hemi.color.setHex(t.sky); hemi.groundColor.setHex(t.gnd); hemi.intensity = t.hemiI;
    sun.color.setHex(t.sun); sun.intensity = t.sunI;
    if (post) { post.mat.uniforms.uTint.value.set(t.tint[0], t.tint[1], t.tint[2]); post.mat.uniforms.uSat.value = t.sat; post.mat.uniforms.uHaze.value = t.haze || 0; if (t.hazeCol) post.mat.uniforms.uHazeCol.value.set(t.hazeCol[0], t.hazeCol[1], t.hazeCol[2]); }
  }

  /* ---------------- post-processing (high quality): tilt-shift miniature look, edge smoothing, colour grade, vignette ---------------- */
  let post = null;
  const _lv = new THREE.Vector3(), _pv = new THREE.Vector3(), _v2 = new THREE.Vector2(), _sunV = new THREE.Vector3();
  function initPost() {
    const rtOpt = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: true, stencilBuffer: false };
    // WebGL2: 4x multisampled target, so the edges are really anti-aliased (the shader's edge blur only softens them)
    const rt = renderer.capabilities.isWebGL2 && THREE.WebGLMultisampleRenderTarget ? new THREE.WebGLMultisampleRenderTarget(4, 4, rtOpt) : new THREE.WebGLRenderTarget(4, 4, rtOpt);
    if (rt.isWebGLMultisampleRenderTarget) rt.samples = 4;
    rt.texture.generateMipmaps = false;
    const mat = new THREE.ShaderMaterial({
      uniforms: { tD: { value: rt.texture }, uRes: { value: new THREE.Vector2(4, 4) }, uFocus: { value: 0.45 }, uBand: { value: 0.22 }, uBlur: { value: 0.8 }, uGam: { value: 0.88 },
        uTint: { value: new THREE.Vector3(1, 1, 1) }, uSat: { value: 1.1 }, uCon: { value: 1.04 }, uVig: { value: 0.17 },
        uSun: { value: new THREE.Vector2(0, 1.2) }, uHaze: { value: 0 }, uHazeCol: { value: new THREE.Vector3(1, 0.8, 0.6) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: [
        'uniform sampler2D tD; uniform vec2 uRes; uniform float uFocus; uniform float uBand; uniform float uBlur; uniform float uGam; uniform vec3 uTint; uniform float uSat; uniform float uCon; uniform float uVig; uniform vec2 uSun; uniform float uHaze; uniform vec3 uHazeCol; varying vec2 vUv;',
        'float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }',
        'void main(){',
        '  vec2 px = 1.0 / uRes; vec3 c = texture2D(tD, vUv).rgb;',
        '  float b = uBlur * smoothstep(uBand, uBand + 0.4, abs(vUv.y - uFocus));',
        '  if (b > 0.02) {',
        '    vec2 o = px * (1.0 + 5.5 * b); vec3 s = c * 0.18;',
        '    s += (texture2D(tD, vUv + vec2(1.0, 0.0) * o).rgb + texture2D(tD, vUv - vec2(1.0, 0.0) * o).rgb + texture2D(tD, vUv + vec2(0.0, 1.0) * o).rgb + texture2D(tD, vUv - vec2(0.0, 1.0) * o).rgb) * 0.1;',
        '    s += (texture2D(tD, vUv + vec2(1.4, 1.4) * o).rgb + texture2D(tD, vUv + vec2(-1.4, 1.4) * o).rgb + texture2D(tD, vUv + vec2(1.4, -1.4) * o).rgb + texture2D(tD, vUv - vec2(1.4, 1.4) * o).rgb) * 0.06;',
        '    s += (texture2D(tD, vUv + vec2(2.6, 0.0) * o).rgb + texture2D(tD, vUv - vec2(2.6, 0.0) * o).rgb + texture2D(tD, vUv + vec2(0.0, 2.6) * o).rgb + texture2D(tD, vUv - vec2(0.0, 2.6) * o).rgb) * 0.045;',
        '    c = mix(c, s, clamp(b * 1.6, 0.0, 1.0));',
        '  } else {',
        '    float lC = lum(c), lN = lum(texture2D(tD, vUv + vec2(0.0, px.y)).rgb), lS = lum(texture2D(tD, vUv - vec2(0.0, px.y)).rgb), lE = lum(texture2D(tD, vUv + vec2(px.x, 0.0)).rgb), lW = lum(texture2D(tD, vUv - vec2(px.x, 0.0)).rgb);',
        '    float mx = max(max(max(lN, lS), max(lE, lW)), lC), mn = min(min(min(lN, lS), min(lE, lW)), lC);',
        '    if (mx - mn > 0.08) { vec2 dir = vec2(lS - lN, lE - lW); dir = dir / (length(dir) + 1e-4) * px * 0.9; c = mix(c, 0.5 * (texture2D(tD, vUv + dir).rgb + texture2D(tD, vUv - dir).rgb), 0.55); }',
        '  }',
        '  c *= uTint; float l = lum(c); c = mix(vec3(l), c, uSat); c = (c - 0.5) * uCon + 0.5; c = pow(max(c, vec3(0.0)), vec3(uGam));',
        '  if (uHaze > 0.0) { vec2 sd = (vUv - uSun) * vec2(uRes.x / uRes.y, 1.0); float hg = exp(-dot(sd, sd) * 2.2); c = 1.0 - (1.0 - c) * (1.0 - uHazeCol * (uHaze * hg)); }',   // warm glow of the low sun just off screen (as in the reference)
        '  vec2 q = vUv - 0.5; c *= 1.0 - uVig * dot(q, q) * 1.8;',
        '  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);',
        '}'].join('\n'),
      depthTest: false, depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); quad.frustumCulled = false;
    const sc = new THREE.Scene(); sc.add(quad);
    post = { rt, mat, sc, cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), focus: 0.45 };
  }
  function sizePost() { if (!post) return; renderer.getDrawingBufferSize(_v2); post.rt.setSize(_v2.x, _v2.y); post.mat.uniforms.uRes.value.set(_v2.x, _v2.y); }
  function postOn() { return !!post && settings.quality === 'high' && settings.post !== false; }

  function updatePointScale() {
    const hpx = renderer.domElement.height;
    const ps = hpx / (2 * Math.tan(camera.fov * Math.PI / 360));
    particles.mat.uniforms.uScale.value = ps; if (sparkP) sparkP.mat.uniforms.uScale.value = ps; if (glows) glows.mat.uniforms.uScale.value = ps;
  }
  function setDynScale(k) { k = clamp(k, 0.55, 1); if (Math.abs(k - dynScale) > 0.01) { dynScale = k; resize(); } }
  function getDynScale() { return dynScale; }

  /* ---------------- race attach ---------------- */
  // the pieces every car shares (cached body / tail / wheel / Peugeot geometry, the common materials): never freed with a car
  function sharedCarRes() {
    const g = new Set([wheelGeo, wheelGeoW, ...geoCache.values(), ...tailGeoCache.values()]);
    if (p206Geo) for (const n of p206Geo) for (const p of n.prims) g.add(p.g);
    const m = new Set([matCar, matWheel, matTailOff, matTailOn, matBlob, matMarker, matUnder, matEngine, matLens, matLensBroken]);
    if (p206Mats) for (const k in p206Mats) m.add(p206Mats[k]);
    return { g, m };
  }
  // frees what a group built for itself (geometry and materials), except the shared pieces and anything in `keep`
  function freeOwn(root, keep) {
    const sh = sharedCarRes();
    root.traverse(o => {
      if (o.geometry && !sh.g.has(o.geometry) && !(keep && keep.has(o.geometry))) o.geometry.dispose();
      for (const m of Array.isArray(o.material) ? o.material : o.material ? [o.material] : []) if (!sh.m.has(m) && !(keep && keep.has(m))) m.dispose();
    });
  }
  // frees everything a car mesh built for itself: the cloned body, panels, lamps, glass, decals, the shadow blob and marker, and
  // its own materials. keep: what loose panels lying on the track still use (they share their car's panel geometry and paint)
  function disposeCarMesh(v, keep) { freeOwn(v.grp, keep); }
  function disposeView(v, keep) { scene.remove(v.grp); disposeCarMesh(v, keep); }
  // geometry and materials the loose panels on the track are drawn with
  function debrisRes() { const s = new Set(); for (const d of debrisMeshes) if (d.mesh && d.mesh.traverse) d.mesh.traverse(o => { if (o.geometry) s.add(o.geometry); if (o.material) s.add(o.material); }); return s; }
  function makeView(c) {
    if (c.stripe === undefined) c.stripe = (c.id * 7) % 3 !== 0;
    const v = makeCarMesh(c);
    v.body.geometry = v.body.geometry.clone(); v.ownGeo = true; v.smokeAcc = 0;   // own copy: dents stay on this car
    v.car = c; v.roll = 0; v.pitch = 0; v.gpitch = 0; v.spin = 0; v.sk = [null, null, null, null]; v.acc = [0, 0, 0, 0]; v.repairN = c.repairN || 0;
    v.grp.rotation.order = 'YXZ';   // yaw first, then pitch about the car's own lateral axis (slopes/jumps)
    buildParts(v);
    scene.add(v.grp); return v;
  }
  function attachRace(race) {
    const old = views;
    views = []; curTrack = race.track; curRace = race; clearDebris();
    if (world && world.props && world.props.length && race.setProps && !race.props) race.setProps(world.props, world.propFloor);
    setupProps(race);
    for (const c of race.cars) views.push(makeView(c));
    for (const v of old) disposeView(v);   // (after the new cars exist: their shaders are reused, not compiled again)
    setupCrew(race);
    particles.clear(); sparkP.clear(); skids.clear(); cam.init = false;
  }

  /* ---------------- pit crews (Bakreni gozd) ----------------
     Articulated mechanics: every man is a small rig (pelvis and trunk, neck, shoulders, elbows, hips, knees; the arms reach by two-bone IK), and every
     body part and every tool is one InstancedMesh for all the men, so all the crews of the pit lane cost a dozen meshes. Colours per instance:
     a vertex colour (k,0,k) is the team colour x k, (0,k,0) the skin tone x k. The player's crew does a real stop driven by the pit state
     (a jack man at each end, a gun man and two tyre men per wheel, the lollipop man, the engineer on the pit wall; the car goes up on the jacks),
     the other teams idle at their garages (working at the roll cab, checking tyres, talking, waiting). */
  let crew = null;
  const CR_TAU = Math.PI * 2, CR_TM = [1, 0, 1], CR_TD = [0.55, 0, 0.55], CR_SK = [0, 1, 0], CR_W = [0.93, 0.93, 0.91], CR_K = [0.07, 0.07, 0.08];
  const CR_SKINS = [[0.96, 0.8, 0.67], [0.9, 0.72, 0.57], [0.8, 0.6, 0.45], [0.6, 0.42, 0.3], [0.43, 0.3, 0.21]];
  const CR_B0 = 0.62, CR_B1 = 0.3, CR_LIFT = 0.11;   // jack handle angle: ready / pushed down (car up), and how far the car goes up
  const crHash = (a) => { const x = Math.sin(a * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const crSS = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  function crTBox(g, y0, y1, w0, d0, w1, d1, cols, zo0, zo1) {   // tapered box from y0 (w0 x d0) to y1 (w1 x d1) around x = 0; cols = [sides, front (+z), back, y1 end, y0 end]
    zo0 = zo0 || 0; zo1 = zo1 == null ? zo0 : zo1;
    const b = [[-w0 / 2, y0, zo0 - d0 / 2], [w0 / 2, y0, zo0 - d0 / 2], [w0 / 2, y0, zo0 + d0 / 2], [-w0 / 2, y0, zo0 + d0 / 2]];
    const t = [[-w1 / 2, y1, zo1 - d1 / 2], [w1 / 2, y1, zo1 - d1 / 2], [w1 / 2, y1, zo1 + d1 / 2], [-w1 / 2, y1, zo1 + d1 / 2]];
    const inn = [0, (y0 + y1) / 2, (zo0 + zo1) / 2], cs = cols[0];
    g.quadO(b[1], b[2], t[2], t[1], cs, inn); g.quadO(b[0], b[3], t[3], t[0], cs, inn);
    g.quadO(b[2], b[3], t[3], t[2], cols[1] || cs, inn); g.quadO(b[0], b[1], t[1], t[0], cols[2] || cs, inn);
    if (cols[3]) g.quadO(t[0], t[1], t[2], t[3], cols[3], inn);
    if (cols[4]) g.quadO(b[0], b[1], b[2], b[3], cols[4], inn);
  }
  function crBall(g, cx, cy, cz, rx, ry, rz, seg, rings, col) {   // smooth ellipsoid; col = a colour or f(ux, uy, uz) -> colour
    const P = [], N = [], C = [];
    for (let r = 0; r <= rings; r++) { const th = r / rings * Math.PI, st = Math.sin(th), ct = Math.cos(th);
      for (let s = 0; s < seg; s++) { const ph = s / seg * CR_TAU, ux = st * Math.sin(ph), uz = st * Math.cos(ph), nx = ux / rx, ny = ct / ry, nz = uz / rz, l = Math.hypot(nx, ny, nz) || 1;
        P.push([cx + rx * ux, cy + ry * ct, cz + rz * uz]); N.push([nx / l, ny / l, nz / l]); C.push(typeof col === 'function' ? col(ux, ct, uz) : col); } }
    const inn = [cx, cy, cz], I = (r, s) => r * seg + (s % seg);
    for (let r = 0; r < rings; r++) for (let s = 0; s < seg; s++) { const a = I(r, s), b = I(r, s + 1), c = I(r + 1, s + 1), d = I(r + 1, s);
      if (r > 0) g.triON(P[a], P[b], P[c], N[a], N[b], N[c], inn, C[a], C[b], C[c]);
      if (r < rings - 1) g.triON(P[a], P[c], P[d], N[a], N[c], N[d], inn, C[a], C[c], C[d]); }
  }
  function crCylX(g, x0, x1, cy, cz, r, n, col, capCol) {   // closed cylinder along x
    const inn = [(x0 + x1) / 2, cy, cz], p = (x, a) => [x, cy + Math.cos(a) * r, cz + Math.sin(a) * r];
    for (let k = 0; k < n; k++) { const a0 = k / n * CR_TAU, a1 = (k + 1) / n * CR_TAU;
      g.quadO(p(x0, a0), p(x1, a0), p(x1, a1), p(x0, a1), col, inn);
      if (capCol) { g.triO(p(x0, a0), p(x0, a1), [x0, cy, cz], capCol, inn); g.triO(p(x1, a0), p(x1, a1), [x1, cy, cz], capCol, inn); } }
  }
  function crewGeos() {   // the parts, each in its joint's space: +y up, +z forward, +x the man's left; limbs hang from their joint along -y
    const G = () => new World.GB(), out = {}, TM = CR_TM, TD = CR_TD, W = CR_W, K = CR_K, BO = [0.09, 0.09, 0.1];
    let g = G();   // trunk (from the hip joint): overall trousers with dark side panels, black belt, chest, shoulder yoke, a white stripe and badge, the name panel on the back
    crTBox(g, -0.13, 0.05, 0.33, 0.21, 0.335, 0.215, [TD, TM, TM, null, TM]); crTBox(g, 0.04, 0.11, 0.345, 0.222, 0.35, 0.228, [K]);
    crTBox(g, 0.1, 0.34, 0.33, 0.215, 0.38, 0.235, [TD, TM, TM]); crTBox(g, 0.34, 0.55, 0.38, 0.235, 0.42, 0.225, [TD, TM, TM]); crTBox(g, 0.55, 0.63, 0.42, 0.225, 0.2, 0.14, [TM, TM, TM, TM]);
    const patch = (x0, x1, y0, y1, z) => g.quadO([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], W, [0, (y0 + y1) / 2, 0]);   // flat white patches on the overall
    patch(-0.18, 0.18, 0.36, 0.4, 0.121); patch(0.03, 0.13, 0.44, 0.5, 0.119); patch(-0.11, 0.11, 0.32, 0.49, -0.121);
    out.trunk = g.geometry();
    g = G();   // head (from the neck): neck, head, a cap in the team colour with its peak (inside the helmet when he wears one)
    World.cyl(g, 0, -0.04, 0.005, 0.056, 0.12, 6, CR_SK); crBall(g, 0, 0.165, 0.008, 0.092, 0.112, 0.103, 6, 4, CR_SK);
    World.cyl(g, 0, 0.2, 0, 0.1, 0.085, 7, TM, TM, 0.085); g.quadO([-0.085, 0.215, 0.07], [0.085, 0.215, 0.07], [0.075, 0.205, 0.16], [-0.075, 0.205, 0.16], TM, [0, 0.1, 0.1]); g.quadO([-0.085, 0.212, 0.07], [0.085, 0.212, 0.07], [0.075, 0.202, 0.16], [-0.075, 0.202, 0.16], TD, [0, 0.3, 0.1]);   // cap, its peak
    out.head = g.geometry();
    g = G();   // full-face helmet: team colour, white crest, darker rim, dark visor
    crBall(g, 0, 0.17, 0.012, 0.13, 0.14, 0.145, 8, 4, (ux, uy) => uy < -0.45 ? TD : (Math.abs(ux) < 0.2 && uy > 0.3 ? W : TM));
    crTBox(g, 0.1, 0.215, 0.17, 0.03, 0.17, 0.03, [[0.05, 0.07, 0.1], null, null, [0.05, 0.07, 0.1], [0.05, 0.07, 0.1]], 0.142, 0.146);
    out.helmet = g.geometry();
    g = G(); crTBox(g, 0.035, -0.3, 0.118, 0.12, 0.09, 0.095, [TD, TM, TM, TM]); out.uarm = g.geometry();   // upper arm (from the shoulder)
    g = G(); crTBox(g, 0.01, -0.24, 0.094, 0.097, 0.078, 0.08, [TD, TM, TM, TM]); crTBox(g, -0.235, -0.35, 0.082, 0.085, 0.07, 0.1, [K, K, K, K, K], 0, 0.01); out.farm = g.geometry();   // forearm and glove
    g = G(); crTBox(g, 0.06, -0.46, 0.155, 0.18, 0.125, 0.135, [TD, TM, TM, TM]); out.thigh = g.geometry();
    g = G(); crTBox(g, 0.02, -0.38, 0.122, 0.132, 0.1, 0.105, [TD, TM, TM, TM]); crTBox(g, -0.47, -0.36, 0.11, 0.27, 0.105, 0.2, [BO, BO, BO, BO, [0.24, 0.24, 0.25]], 0.045, 0.02); out.shin = g.geometry();   // shin and boot
    g = G();   // wheel gun, in the hand: the socket points on along the forearm (-y), the air hose plugs in at the back (+y)
    { const B = [0.2, 0.21, 0.23], S = [0.7, 0.71, 0.74]; World.cyl(g, 0, -0.2, 0.05, 0.048, 0.26, 8, B, B); World.cyl(g, 0, -0.12, 0.05, 0.053, 0.05, 8, TM, TM); World.cyl(g, 0, -0.29, 0.05, 0.036, 0.09, 8, S, S); World.box(g, 0, -0.06, -0.01, 0.035, 0.1, 0.07, 0, K, K); }
    out.gun = g.geometry();
    g = G();   // wheel and tyre, axle along x: tread, sidewalls with a band in the compound colour (per instance), the rim
    { const n = 10, Wd = 0.135, inn = [0, 0, 0], p = (x, r, a) => [x, Math.cos(a) * r, Math.sin(a) * r], BL = [0.07, 0.07, 0.08], SW = [0.1, 0.1, 0.11];
      for (let k = 0; k < n; k++) { const a0 = k / n * CR_TAU, a1 = (k + 1) / n * CR_TAU;
        g.quadO(p(-Wd, 0.33, a0), p(Wd, 0.33, a0), p(Wd, 0.33, a1), p(-Wd, 0.33, a1), BL, inn);
        for (const x of [-Wd, Wd]) { g.quadO(p(x, 0.33, a0), p(x, 0.33, a1), p(x, 0.275, a1), p(x, 0.275, a0), SW, inn); g.quadO(p(x, 0.275, a0), p(x, 0.275, a1), p(x, 0.255, a1), p(x, 0.255, a0), TM, inn);
          g.quadO(p(x, 0.255, a0), p(x, 0.255, a1), p(x, 0.215, a1), p(x, 0.215, a0), SW, inn); g.triO(p(x * 0.9, 0.215, a0), p(x * 0.9, 0.215, a1), [x * 0.7, 0, 0], k % 2 ? [0.62, 0.63, 0.66] : [0.44, 0.45, 0.48], inn); } } }
    out.tyre = g.geometry();
    g = G();   // lever jack: frame in the team colour on two wheels, the saddle toward +z (the long handle is a rod)
    World.box(g, 0, 0.05, 0.18, 0.26, 0.08, 0.72, 0, TM, TM); for (const sx of [-1, 1]) crCylX(g, sx * 0.13, sx * 0.19, 0.08, 0, 0.08, 8, K, [0.5, 0.5, 0.52]);
    World.box(g, 0, 0.13, 0.46, 0.08, 0.1, 0.08, 0, [0.5, 0.51, 0.54]); World.box(g, 0, 0.23, 0.46, 0.46, 0.05, 0.16, 0, K, [0.12, 0.12, 0.13]);
    out.jack = g.geometry();
    g = G(); World.box(g, 0, -0.5, 0.5, 1, 1, 1, 0, TM, TM); out.rod = g.geometry();   // unit rod along +z (air hoses, jack handles, the lollipop pole)
    g = G();   // the lollipop sign: red disc, white rim, facing +-z
    { const n = 12, R = 0.24, r = 0.19, t = 0.012, inn = [0, 0, 0], p = (rr, a, z) => [Math.cos(a) * rr, Math.sin(a) * rr, z], RED = [0.86, 0.1, 0.08];
      for (let k = 0; k < n; k++) { const a0 = k / n * CR_TAU, a1 = (k + 1) / n * CR_TAU; g.quadO(p(R, a0, -t), p(R, a1, -t), p(R, a1, t), p(R, a0, t), W, inn);
        for (const z of [-t, t]) { g.quadO(p(R, a0, z), p(R, a1, z), p(r, a1, z), p(r, a0, z), W, inn); g.triO(p(r, a0, z), p(r, a1, z), [0, 0, z], RED, inn); } } }
    out.disc = g.geometry();
    return out;
  }
  function crewMaterial(skin) {   // Lambert with vertex colours; the team (and skin) colour codes are resolved per instance in the vertex shader
    const m = new THREE.MeshLambertMaterial({ vertexColors: true });
    m.onBeforeCompile = (sh) => {
      if (skin) sh.vertexShader = 'attribute vec3 crewSkin;\n' + sh.vertexShader;
      sh.vertexShader = sh.vertexShader.replace('#include <color_vertex>', '#include <color_vertex>\n#ifdef USE_INSTANCING_COLOR\n  { vec3 c0 = color.rgb; vColor.rgb = c0;\n    if (c0.g < 0.002 && abs(c0.r - c0.b) < 0.002 && c0.r > 0.004) vColor.rgb = instanceColor.rgb * c0.r;\n' +
        (skin ? '    else if (c0.r < 0.002 && c0.b < 0.002 && c0.g > 0.004) vColor.rgb = crewSkin * c0.g;\n' : '') + '  }\n#endif');
    };
    m.customProgramCacheKey = () => skin ? 'crew-skin' : 'crew';
    return m;
  }
  // poses: O = [hip height, lean, twist, side bend, head nod, head turn, hipL x, hipL z, kneeL, hipR x, hipR z, kneeR]; H = hands (L, R) and elbow poles (L, R), in the man's space
  const CR_STAND = [0.915, 0.03, 0, 0, 0, 0, -0.03, 0.05, 0.06, -0.03, -0.05, 0.06], CR_RELAX = [0.24, 0.86, 0.05, -0.24, 0.86, 0.05, 0.3, -0.2, -1, -0.3, -0.2, -1];
  const CR_KNEEL = [0.5, 0.28, 0, 0, 0.25, 0, -1.45, 0.08, 1.45, 0.05, -0.05, 1.52], CR_SQUAT = [0.66, 0.35, 0, 0, -0.15, 0, -0.95, 0.15, 1.55, -0.95, -0.15, 1.55];
  const CR_CROUCH = [0.8, 0.25, 0, 0, -0.1, 0, -0.55, 0.12, 0.95, -0.55, -0.12, 0.95], CR_LOW = [0.63, 0.55, 0, 0, 0.2, 0, -1.0, 0.15, 1.6, -1.0, -0.15, 1.6];
  const CR_SIT = [0.62, 0.08, 0, 0, 0.12, 0, -1.25, 0.12, 1.05, -1.25, -0.12, 1.05], CR_JACK = [0.86, 0.22, 0, 0, -0.1, 0, -0.4, 0.12, 0.5, 0.18, -0.12, 0.22], CR_PUSH = [0.76, 0.5, 0, 0, -0.25, 0, -0.6, 0.12, 0.95, 0.25, -0.12, 0.45];
  const _cO = new Float32Array(12), _cH = new Float32Array(12), _cO2 = new Float32Array(12), _cH2 = new Float32Array(12);
  function crLocal(m, X, Y, Z, H, k) {   // a world point in the man's space (into H[k..k+2])
    const dx = X - m.x, dz = Z - m.z, sy = Math.sin(m.yaw), cy = Math.cos(m.yaw), s = 1 / m.sc;
    H[k] = (dx * sy - dz * cy) * s; H[k + 1] = (Y - m.y) * s; H[k + 2] = (dx * cy + dz * sy) * s;
  }
  function crPose(m, t, O, H) {   // target pose of the man's current action
    for (let k = 0; k < 12; k++) { O[k] = CR_STAND[k]; H[k] = CR_RELAX[k]; }
    const ph = m.t0, br = Math.sin(t * 1.3 + ph) * 0.012, sway = Math.sin(t * 0.33 + ph * 1.7);
    O[1] += br; O[3] = sway * 0.025; O[2] = Math.sin(t * 0.21 + ph) * 0.06;   // breathing, a slow weight shift, turning a little
    const setO = (A) => { for (let k = 0; k < 12; k++) O[k] = A[k]; }, hand = (s, x, y, z) => { H[s * 3] = x; H[s * 3 + 1] = y; H[s * 3 + 2] = z; }, pole = (s, x, y, z) => { H[6 + s * 3] = x; H[7 + s * 3] = y; H[8 + s * 3] = z; };
    switch (m.act) {
      case 'hips': hand(0, 0.2, 0.97, -0.02); hand(1, -0.2, 0.97, -0.02); pole(0, 1, 0, -0.7); pole(1, -1, 0, -0.7); break;
      case 'cross': hand(0, -0.07, 1.22, 0.2); hand(1, 0.07, 1.19, 0.21); pole(0, 1, -0.6, 0.2); pole(1, -1, -0.6, 0.2); break;
      case 'talk': hand(1, -0.14 + 0.05 * Math.sin(t * 2.3 + ph), 1.12 + 0.07 * Math.sin(t * 3.1 + 1 + ph), 0.3 + 0.04 * Math.sin(t * 1.7)); pole(1, -1, -0.8, -0.2);
        if (m.h2 > 0.5) { hand(0, 0.2, 0.97, -0.02); pole(0, 1, 0, -0.7); } O[4] = 0.06 * Math.sin(t * 2 + ph); break;
      case 'bench': O[0] = 0.9; O[1] = 0.4; O[4] = 0.35; hand(0, 0.18, 1.07, 0.5); hand(1, -0.18 + 0.05 * Math.sin(t * 4 + ph), 1.09 + 0.03 * Math.sin(t * 8), 0.52 + 0.04 * Math.cos(t * 4)); pole(0, 1, -0.5, -0.3); pole(1, -1, -0.5, -0.3); break;
      case 'kneel': setO(CR_KNEEL); hand(0, 0.14, 0.62, 0.52); hand(1, -0.14, 0.6 + 0.03 * Math.sin(t * 2 + ph), 0.54); pole(0, 1, -0.3, 0); pole(1, -1, -0.3, 0); break;
      case 'gun': hand(1, -0.22, 0.95, 0.16); pole(1, -0.6, -0.5, -0.6); break;
      case 'sit': setO(CR_SIT); O[1] += br; hand(0, 0.19, 1.05, 0.42); hand(1, -0.19, 1.05 + 0.012 * Math.max(0, Math.sin(t * 9 + ph)), 0.45); pole(0, 1, -1, 0); pole(1, -1, -1, 0); break;
      case 'ready': setO(CR_SQUAT); hand(1, -0.14, 0.93, 0.44); hand(0, -0.02, 0.96, 0.4); pole(1, -1, -0.6, 0); pole(0, 1, -0.6, 0); break;
      case 'gunK': { setO(CR_KNEEL); const a = m.aim;   // kneeling at the hub: the gun's socket on the wheel nut (the hand stays a gun's length short of it)
        if (a) { crLocal(m, a[0], a[1], a[2], H, 3); const sx = -0.195, sy = O[0] + 0.5, sz = 0.16, dx = H[3] - sx, dy = H[4] - sy, dz = H[5] - sz, l = Math.hypot(dx, dy, dz) || 1, back = 0.3 + (m.aimOff || 0);
          H[3] -= dx / l * back; H[4] -= dy / l * back; H[5] -= dz / l * back; H[0] = H[3] + 0.13; H[1] = H[4] + 0.05; H[2] = H[5] - 0.06; }
        pole(1, -1, -0.8, -0.2); pole(0, 1, -0.8, -0.2); break; }
      case 'signal': hand(1, -0.22, 0.95, 0.16); pole(1, -0.6, -0.5, -0.6); hand(0, 0.28, 2.0, 0.1); pole(0, 1, 0, 0); break;
      case 'readyT': setO(CR_CROUCH); hand(0, 0.28, 0.95, 0.36); hand(1, -0.28, 0.95, 0.36); pole(0, 1, -0.5, -0.3); pole(1, -1, -0.5, -0.3); break;
      case 'grabT': case 'pushT': { setO(CR_LOW); const a = m.aim;   // both hands on the tyre's sides
        if (a) { crLocal(m, a[0], a[1], a[2], H, 0); H[3] = H[0] - 0.29; H[4] = H[1]; H[5] = H[2]; H[0] += 0.29; } pole(0, 1, -0.4, -0.2); pole(1, -1, -0.4, -0.2); break; }
      case 'carry': O[1] = -0.04; hand(0, 0.29, 0.99, 0.4); hand(1, -0.29, 0.99, 0.4); pole(0, 1, -0.5, -0.3); pole(1, -1, -0.5, -0.3); break;
      case 'jackR': case 'jackP': { setO(m.act === 'jackP' ? CR_PUSH : CR_JACK); const b = m.jack ? m.jack.beta : CR_B0, gy = 0.14 + 1.3 * Math.sin(b), gz = 0.42 + 1.3 * (Math.cos(CR_B0) - Math.cos(b));
        hand(0, 0.2, gy, gz); hand(1, -0.2, gy, gz); pole(0, 1, -0.3, -0.4); pole(1, -1, -0.3, -0.4); break; }
      case 'lolliH': hand(1, -0.12, 1.45, 0.5); pole(1, -1, -0.3, -0.3); break;
      case 'lolliU': hand(1, -0.15, 2.05, 0.18); pole(1, -1, 0, 0); break;
      case 'lolliD': hand(1, -0.26, 0.98, 0.12); pole(1, -0.6, -0.5, -0.6); break;
    }
  }
  function crGait(m, run, O, H) {   // walking / running: legs swing, knees fold in the swing, the body bobs, the arms swing against the legs
    const s = Math.sin(m.ph), c = Math.cos(m.ph), A = 0.42 + 0.33 * run, K0 = 0.06 + 0.22 * run, K = 0.85 + 0.8 * run;
    O[0] = (1 - run) * 0.915 * Math.cos(A * Math.abs(s) * 0.75) + run * (0.85 + 0.05 * Math.abs(s)); O[1] = 0.05 + 0.16 * run; O[2] = 0.07 * s; O[3] = 0; O[4] = 0.05 * run; O[5] = 0;
    O[6] = -A * s; O[7] = 0.04; O[8] = K0 + K * Math.max(0, c); O[9] = A * s; O[10] = -0.04; O[11] = K0 + K * Math.max(0, -c);
    const sw = (0.3 + 0.45 * run) * s, re = 0.58 - 0.16 * run, sy = O[0] + 0.53, fz = 0.04 + 0.12 * run;
    H[0] = 0.23; H[1] = sy - re * Math.cos(sw); H[2] = fz - re * Math.sin(sw); H[3] = -0.23; H[4] = sy - re * Math.cos(sw); H[5] = fz + re * Math.sin(sw);
    H[6] = 0.2; H[7] = -0.3; H[8] = -1; H[9] = -0.2; H[10] = -0.3; H[11] = -1;
  }
  // the rig: joint matrices of one man (reused), then the part matrices
  const CRM = {}; for (const k of ['root', 'pel', 'neck', 'shL', 'elL', 'hdL', 'shR', 'elR', 'hdR', 'hipL', 'knL', 'hipR', 'knR', 'tmp', 'loc']) CRM[k] = new THREE.Matrix4();
  const _ce = new THREE.Euler(), _cv = new THREE.Vector3(), _cv2 = new THREE.Vector3(), _cv3 = new THREE.Vector3();
  function crJoint(out, parent, ox, oy, oz, rx, ry, rz) { _ce.set(rx, ry, rz); const L = CRM.loc; L.makeRotationFromEuler(_ce); const e = L.elements; e[12] = ox; e[13] = oy; e[14] = oz; out.multiplyMatrices(parent, L); }
  function crArm(m, side, pe) {   // two-bone IK of one arm in the trunk's space: shoulder -> elbow -> hand toward the target, the elbow toward its pole
    const H = m.H, sx = (side ? -0.195 : 0.195) * (0.6 + 0.4 * m.bulk), sy = 0.53, k = side * 3;
    // target and pole from the man's space into the trunk's (inverse of the trunk rotation, pe = its elements)
    const vx = H[k], vy = H[k + 1] - m.O[0], vz = H[k + 2], px = H[6 + k], py = H[7 + k], pz = H[8 + k];
    const tx = pe[0] * vx + pe[1] * vy + pe[2] * vz, ty = pe[4] * vx + pe[5] * vy + pe[6] * vz, tz = pe[8] * vx + pe[9] * vy + pe[10] * vz;
    const qx0 = pe[0] * px + pe[1] * py + pe[2] * pz, qy0 = pe[4] * px + pe[5] * py + pe[6] * pz, qz0 = pe[8] * px + pe[9] * py + pe[10] * pz;
    let dx = tx - sx, dy = ty - sy, dz = tz; const D0 = Math.hypot(dx, dy, dz) || 1e-4; dx /= D0; dy /= D0; dz /= D0;
    const L1 = 0.3, L2 = 0.31, D = clamp(D0, 0.1, L1 + L2 - 0.002), al = Math.acos(clamp((L1 * L1 + D * D - L2 * L2) / (2 * L1 * D), -1, 1));
    const pd = qx0 * dx + qy0 * dy + qz0 * dz; let qx = qx0 - pd * dx, qy = qy0 - pd * dy, qz = qz0 - pd * dz, ql = Math.hypot(qx, qy, qz);
    if (ql < 1e-4) { qx = 0; qy = -dz; qz = dy; ql = Math.hypot(qy, qz) || 1; } qx /= ql; qy /= ql; qz /= ql;
    const ca = Math.cos(al), sa = Math.sin(al), ux = dx * ca + qx * sa, uy = dy * ca + qy * sa, uz = dz * ca + qz * sa;   // upper arm
    let fx = D * dx - L1 * ux, fy = D * dy - L1 * uy, fz = D * dz - L1 * uz; const fl = Math.hypot(fx, fy, fz) || 1; fx /= fl; fy /= fl; fz /= fl;   // forearm
    const fu = fx * ux + fy * uy + fz * uz; let zx = fx - fu * ux, zy = fy - fu * uy, zz = fz - fu * uz, zl = Math.hypot(zx, zy, zz);
    if (zl < 1e-3) { zx = -qx; zy = -qy; zz = -qz; zl = 1; } zx /= zl; zy /= zl; zz /= zl;
    const yx = -ux, yy = -uy, yz = -uz, xx = yy * zz - yz * zy, xy = yz * zx - yx * zz, xz = yx * zy - yy * zx;
    const L = CRM.loc; L.set(xx, yx, zx, sx, xy, yy, zy, sy, xz, yz, zz, 0, 0, 0, 0, 1);
    const sh = side ? CRM.shR : CRM.shL, el = side ? CRM.elR : CRM.elL, hd = side ? CRM.hdR : CRM.hdL;
    sh.multiplyMatrices(CRM.pel, L); crJoint(el, sh, 0, -0.3, 0, -Math.acos(clamp(fu, -1, 1)), 0, 0); crJoint(hd, el, 0, -0.31, 0.01, 0, 0, 0);
  }
  function crRig(m) {
    const s = m.sc, th = Math.PI / 2 - m.yaw, c = Math.cos(th), sn = Math.sin(th), O = m.O;
    CRM.root.set(c * s, 0, sn * s, m.x, 0, s, 0, m.y, -sn * s, 0, c * s, m.z, 0, 0, 0, 1);
    crJoint(CRM.pel, CRM.root, 0, O[0], 0, O[1], O[2], O[3]);
    crJoint(CRM.neck, CRM.pel, 0, 0.6, 0, O[4] - O[1] * 0.5, O[5], -O[3] * 0.5);
    crJoint(CRM.hipL, CRM.root, 0.095, O[0], 0, O[6], 0, O[7]); crJoint(CRM.knL, CRM.hipL, 0, -0.45, 0, O[8], 0, 0);
    crJoint(CRM.hipR, CRM.root, -0.095, O[0], 0, O[9], 0, O[10]); crJoint(CRM.knR, CRM.hipR, 0, -0.45, 0, O[11], 0, 0);
    _ce.set(O[1], O[2], O[3]); const R = CRM.tmp.makeRotationFromEuler(_ce), pe = R.elements;
    crArm(m, 0, pe); crArm(m, 1, pe);
  }

  function setupCrew(race) {
    if (crew) { scene.remove(crew.grp); for (const m of crew.meshes) { m.geometry.dispose(); if (m.dispose) m.dispose(); } crew.mats.forEach(m => m.dispose()); crew = null; }
    const boxes = world && world.pitBoxes; if (!boxes || !boxes.length || !race) return;
    const P = race.player || null, pb = world.pitBox, ai = race.cars.filter(c => c !== P); let ai0 = 0;
    for (const bx of boxes) bx.col = new THREE.Color().setRGB(...bx.team);   // the teams: the player's box in the player's colour, the others in the AI cars' colours
    for (const bx of boxes) { if (bx.mine && P) bx.col = new THREE.Color(P.color); else if (ai[ai0]) bx.col = new THREE.Color(ai[ai0++].color); }
    const men = [], bpt = (bx, a, w) => [bx.ox + bx.tx * a + bx.nx * w, bx.oz + bx.tz * a + bx.nz * w];
    const man = (bx, a, w, yaw, act, role, helmet) => { const id = men.length + bx.k * 17, h1 = crHash(id * 1.37 + 0.5), h2 = crHash(id * 2.71 + 1.3), h3 = crHash(id * 0.91 + 7.1), [x, z] = bpt(bx, a, w);
      const m = { id, role: role || 'idle', act, act0: act, bx, team: bx.col, x, y: 0, z, yaw, hx: x, hz: z, hyaw: yaw, gx: x, gz: z, gyaw: yaw, style: 'walk', spd: 0, ph: h2 * 6, t0: h3 * 50, h1, h2,
        sc: 0.95 + h1 * 0.1, bulk: 0.92 + h2 * 0.2, skin: CR_SKINS[Math.min(4, (h3 * 5) | 0)], helmet: helmet != null ? helmet : h1 > 0.72, O: new Float32Array(CR_STAND), H: new Float32Array(CR_RELAX), look: 0, carry: false };
      men.push(m); return m; };
    const faceN = (bx, s) => Math.atan2(bx.nz * s, bx.nx * s), faceT = (bx, s) => Math.atan2(bx.tz * s, bx.tx * s);
    // the other teams (and every box in the menu demo): four men busy at the garage, an engineer on the pit wall
    const SLOTS = [[-3.4, 6.85, 1, 'bench'], [2.6, 6.7, 1, 'kneel'], [-1.05, 4.5, 0, 'talk'], [-0.2, 5.15, 0, 'cross'], [0.8, 1.5, -1, 'gun'], [0.6, 9.5, -1, 'hips'], [-1.6, 7.45, 1, 'cross']];
    for (const bx of boxes) { if (bx.mine && P) continue;
      const pick = (bx.mine ? [2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6]).filter(j => crHash(bx.k * 3.3 + j * 1.7) > 0.42 || (j === 3 && crHash(bx.k * 3.3 + 2 * 1.7) > 0.42)).slice(0, 5);   // (the player's box has no kit on its apron)
      for (const j of pick) { const [a, w, f, act] = SLOTS[j], ja = (crHash(bx.k * 5.1 + j) - 0.5) * 0.4, jw = (crHash(bx.k * 7.3 + j) - 0.5) * 0.3, [x, z] = bpt(bx, a + ja, bx.base + w + jw);
        let yaw = f ? faceN(bx, f) : 0;
        if (j === 2 || j === 3) { const o = SLOTS[j === 2 ? 3 : 2], [ox, oz] = bpt(bx, o[0], bx.base + o[1]); yaw = Math.atan2(oz - z, ox - x); }   // the talkers face each other
        const m = man(bx, a + ja, bx.base + w + jw, yaw + (crHash(bx.k + j * 9.1) - 0.5) * 0.4, act); if (act === 'gun') m.gun = true; }
      man(bx, crHash(bx.k * 1.9) < 0.5 ? -0.62 : 0.62, bx.wall + 1.5, faceN(bx, -1), 'sit', null, false); }
    // the player's crew: waits in the garage (two rows), comes out when the car is in the lane
    let roles = null;
    if (P && pb) { const bx = boxes.find(b => b.mine); if (bx) {
      roles = { G: [], O: [], N: [] }; const wA = bx.base + 9.45, wB = bx.base + 10.4, lane = faceN(bx, -1);
      const rowA = [['N', 3], ['G', 3], ['N', 2], ['G', 2], ['G', 0], ['N', 0], ['G', 1], ['N', 1]], rowB = [['O', 3], ['O', 2], ['LP'], ['O', 0], ['O', 1]];
      rowA.forEach(([r, k], j) => { const m = man(bx, -3.5 + j, wA, lane, r === 'G' ? 'gun' : 'stand', r, true); m.wheel = k; roles[r][k] = m; if (r === 'G') m.gun = true; });
      rowB.forEach(([r, k], j) => { const m = man(bx, -2.6 + j * 1.3, wB, lane, r === 'LP' ? 'lolliD' : (j % 2 ? 'cross' : 'talk'), r, true); if (r === 'LP') roles.LP = m; else { m.wheel = k; roles.O[k] = m; } });
      roles.JF = man(bx, 3.9, bx.base + 11.7, faceT(bx, -1), 'stand', 'JF', true); roles.JR = man(bx, -3.9, bx.base + 11.7, faceT(bx, 1), 'stand', 'JR', true);
      roles.ENG = man(bx, -0.62, bx.wall + 1.5, lane, 'sit', 'ENG', false);
      for (const k of ['JF', 'JR']) roles[k].jack = { beta: CR_B0, man: roles[k] };
      for (const m of roles.G) m.air = bpt(bx, (m.hx - bx.ox) * bx.tx + (m.hz - bx.oz) * bx.tz, bx.base + 9.05);   // the air line comes out of the garage front
      roles.bx = bx; } }
    // meshes: every part and tool one InstancedMesh; the bounding sphere covers the whole pit so the frustum culling works
    let cx = 0, cz = 0; for (const b of boxes) { cx += b.ox; cz += b.oz; } cx /= boxes.length; cz /= boxes.length;
    let rad = 0; for (const b of boxes) rad = Math.max(rad, Math.hypot(b.ox - cx, b.oz - cz)); rad += 40;
    const bs = new THREE.Sphere(new THREE.Vector3(cx, 2, cz), rad), geo = crewGeos(), mat = crewMaterial(false), matS = crewMaterial(true), grp = new THREE.Group(), meshes = [], nM = men.length;
    const mk = (g, n, cast, mt) => { if (!n) { g.dispose(); return null; } g.boundingSphere = bs.clone(); const im = new THREE.InstancedMesh(g, mt || mat, n);
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.castShadow = cast; im.receiveShadow = true;
      for (let i = 0; i < n; i++) { im.setMatrixAt(i, _zero); im.setColorAt(i, _pc.setRGB(1, 1, 1)); } grp.add(im); meshes.push(im); return im; };
    const gunMen = men.filter(m => m.gun), nT = roles ? 8 : 0;
    geo.head.setAttribute('crewSkin', new THREE.InstancedBufferAttribute(new Float32Array(nM * 3), 3));
    const M = { trunk: mk(geo.trunk, nM, true), head: mk(geo.head, nM, true, matS), helmet: mk(geo.helmet, nM, false), uarm: mk(geo.uarm, nM * 2, true), farm: mk(geo.farm, nM * 2, true),
      thigh: mk(geo.thigh, nM * 2, true), shin: mk(geo.shin, nM * 2, true), gun: mk(geo.gun, gunMen.length, false), tyre: mk(geo.tyre, nT, true), jack: mk(geo.jack, roles ? 2 : 0, true),
      rod: mk(geo.rod, (roles ? 13 : 0) + boxes.length, false), disc: mk(geo.disc, roles ? 1 : 0, false) };
    const skinA = geo.head.attributes.crewSkin;
    men.forEach((m, i) => { for (const k of ['trunk', 'head', 'helmet']) M[k].setColorAt(i, m.team); for (const k of ['uarm', 'farm', 'thigh', 'shin']) { M[k].setColorAt(i * 2, m.team); M[k].setColorAt(i * 2 + 1, m.team); }
      skinA.setXYZ(i, m.skin[0], m.skin[1], m.skin[2]); });
    gunMen.forEach((m, i) => { m.gunI = i; M.gun.setColorAt(i, m.team); });
    const tyres = [];
    if (roles) { const cmp = [new THREE.Color(0.95, 0.8, 0.14), new THREE.Color(0.86, 0.14, 0.12)];   // new set: yellow bands, the old ones: red
      for (let k = 0; k < 4; k++) { const tn = { i: k, mode: 'floor', man: roles.N[k] }, to = { i: 4 + k, mode: 'hidden', man: roles.O[k] }; tyres.push(tn, to); roles.N[k].tyre = tn; roles.O[k].tyre = to;
        M.tyre.setColorAt(k, cmp[0]); M.tyre.setColorAt(4 + k, cmp[1]); }
      M.jack.setColorAt(0, roles.bx.col); M.jack.setColorAt(1, roles.bx.col);
      for (let i = 0; i < 13; i++) M.rod.setColorAt(i, _pc.setRGB(...(i < 8 ? [0.12, 0.12, 0.13] : i < 12 ? [0.62, 0.63, 0.66] : [0.8, 0.8, 0.78]))); }
    const rb = roles ? 13 : 0;   // the band over each crew's garage door in the team's colour (the rods after the player's)
    boxes.forEach((bx, j) => { const [ax, az] = bpt(bx, -4.7, bx.base + 8.93), [bx2, bz2] = bpt(bx, 4.7, bx.base + 8.93); crSetRod(M.rod, rb + j, ax, 3.7, az, bx2, 3.7, bz2, 0.04, 0.5); M.rod.setColorAt(rb + j, bx.col); });
    for (const im of meshes) if (im.instanceColor) im.instanceColor.needsUpdate = true;
    scene.add(grp);
    crew = { grp, meshes, mats: [mat, matS], M, men, roles, tyres, P: roles ? P : null, pb, cx, cz, rad, mode: 'home', frame: null, lift: 0, liftP: 0, liftF: 0, liftR: 0, gunOn: false, clearT: 0, dim: roles ? crDims(P) : null };
    for (const m of men) crPose(m, 0, m.O, m.H);   // (start in the pose, not standing up from it)
  }
  function crDims(P) {   // the car's hubs, nose and tail (car frame: forward, right), as the car mesh builds them
    const M = P.m, d = BODIES[M.body], sx = M.len / d.len, fx = M.a * (M.len / 4.4) * 0.98 + 0.05, rx = -M.b * (M.len / 4.4) * 0.98, hw = M.wid * 0.5 - 0.1;
    return { fx, rx, hw, rw: M.rw, wid: M.wid, nose: d.secs[d.secs.length - 1][0] * sx + 0.05, tail: d.secs[0][0] * sx - 0.06, wb: fx - rx };
  }

  // ---- the player's crew: what everybody does, from the pit state ----
  function crewLogic(dt) {
    const c = crew, P = c.P, R = c.roles, D = c.dim, T = curTrack; if (!P || !R || !T) return;
    const L = T.len; let dB = c.pb.s - (P.q ? P.q.s : c.pb.s + 999); dB = ((dB % L) + L) % L; if (dB > L / 2) dB -= L;   // metres from the car to its box (along the lane)
    const prev = c.mode; let mode;
    if (P.pitState === 'repair') mode = 'work';
    else if (prev === 'work' || prev === 'clear') mode = P.inPit && dB > -13 && c.clearT < 5 ? 'clear' : 'home';
    else mode = P.inPit && !P.pitDone && dB > -4 ? 'out' : 'home';
    if (mode !== prev) { c.mode = mode; c.clearT = 0;
      if (mode === 'out') { const st = c.pb.stop; c.frame = { x: st[0], z: st[1], h: Math.atan2(c.pb.tz, c.pb.tx) };
        for (const k of [0, 1, 2, 3]) { R.N[k].tyre.mode = 'hands'; R.O[k].tyre.mode = 'hidden'; } }
      if (mode === 'home') for (const m of c.men) if (m.role !== 'idle') m.act = m.act0; }
    if (mode === 'work') c.frame = { x: P.x, z: P.z, h: P.h };
    if (mode === 'clear') c.clearT += dt;
    const F = c.frame, u = mode === 'work' ? clamp(P.pitT / Math.max(0.1, P.pitDur), 0, 1) : mode === 'clear' ? 1 : 0;
    const ch = F ? Math.cos(F.h) : 1, sh = F ? Math.sin(F.h) : 0, Wp = (f, r) => [F.x + ch * f - sh * r, F.z + sh * f + ch * r], yawC = (df, dr) => Math.atan2(sh * df + ch * dr, ch * df - sh * dr);
    const pb = c.pb, wMin = pb.wallO + 0.35;   // (nobody is sent across the pit-wall rail, wherever the car stands)
    const go = (m, p, yaw, style, act) => { const wo = pb.lane + (p[0] - pb.stop[0]) * pb.nx + (p[1] - pb.stop[1]) * pb.nz; if (wo < wMin) p = [p[0] + pb.nx * (wMin - wo), p[1] + pb.nz * (wMin - wo)];
      m.gx = p[0]; m.gz = p[1]; m.gyaw = yaw; m.style = style; m.act = act; };
    const lf = c.liftF, lr = c.liftR, y0 = P.y || 0;
    const hub = (k) => { const f = k < 2 ? D.fx : D.rx, sd = k % 2 ? 1 : -1, [x, z] = Wp(f, sd * D.hw); return [x, y0 + D.rw + (k < 2 ? lf : lr), z]; };
    c.gunOn = false;
    if (mode === 'home') {
      for (const m of c.men) { if (m.role === 'idle') continue; m.gx = m.hx; m.gz = m.hz; m.gyaw = m.hyaw; m.style = 'walk'; m.aim = null;
        const home = Math.hypot(m.x - m.hx, m.z - m.hz) < 0.3;
        if (m.role === 'O') { m.carry = m.tyre.mode === 'hands'; if (home && m.carry) { m.tyre.mode = 'floor'; m.carry = false; } m.act = m.carry ? 'carry' : m.act0; }
        if (m.role === 'N') { if (home && m.tyre.mode !== 'floor') m.tyre.mode = 'floor'; m.carry = false; }
        if (m.role === 'JF' || m.role === 'JR') { m.jack.beta += (CR_B0 - m.jack.beta) * Math.min(1, dt * 6); m.carry = !home; m.act = home ? 'stand' : 'jackR'; }
        if (m.role === 'LP') { m.carry = true; m.act = 'lolliD'; } }
    } else {
      for (let k = 0; k < 4; k++) { const front = k < 2, sd = k % 2 ? 1 : -1, fk = front ? D.fx : D.rx, dO = front ? 1 : -1, G = R.G[k], O = R.O[k], N = R.N[k], tO = O.tyre, tN = N.tyre, hb = hub(k);
        // gun man: kneels outboard of the hub; nut off, (the wheel changes), nut on, then stands and raises a hand
        const gSpot = Wp(fk, sd * (D.hw + 0.72)), gYaw = yawC(0, -sd);
        if (mode === 'out') go(G, gSpot, gYaw, 'jog', 'ready');
        else if (mode === 'work') { const nut = (u > 0.04 && u < 0.2) || (u > 0.47 && u < 0.64);
          if (u < 0.66) { go(G, gSpot, gYaw, 'snap', 'gunK'); G.aim = hb; G.aimOff = nut ? Math.sin(time * 70 + k) * 0.008 : (u > 0.2 && u < 0.47 ? 0.14 : 0.04); if (nut) { c.gunOn = true; crSpark(hb, sd, F, dt); } }
          else go(G, Wp(fk, sd * (D.hw + 0.95)), gYaw, 'snap', 'signal'); }
        else go(G, Wp(fk, sd * (D.hw + 1.25)), gYaw, 'snap', c.clearT < 1 ? 'signal' : 'gun');
        // tyre off: grabs the old wheel, pulls it off and steps back with it
        const oSpot = Wp(fk + dO * 0.66, sd * (D.hw + 0.78)), oYaw = yawC(-dO * 0.55, -sd * 0.78);
        if (mode === 'out' || u < 0.18) { go(O, oSpot, oYaw, mode === 'out' ? 'jog' : 'snap', 'readyT'); O.carry = false; }
        else if (u < 0.24) { go(O, oSpot, oYaw, 'snap', 'grabT'); O.aim = hb; O.carry = false; }
        else if (u < 0.38) { const t2 = crSS(0.24, 0.38, u), back = Wp(fk + dO * (0.66 + 0.55 * t2), sd * (D.hw + 0.78 + 0.45 * t2)); go(O, back, oYaw, 'snap', 'carry'); O.carry = true; tO.mode = 'lerp'; tO.from = hb; tO.t = t2; }
        else { go(O, Wp(fk + dO * 1.21, sd * (D.hw + 1.23 + (mode === 'clear' ? 0.4 : 0))), oYaw, 'snap', 'carry'); O.carry = true; tO.mode = 'hands'; }
        // tyre on: holds the new wheel ready, puts it on the hub, pushes it home, steps back
        const nSpot = Wp(fk - dO * 0.72, sd * (D.hw + 0.86)), nYaw = yawC(dO * 0.6, -sd * 0.86);
        if (mode === 'out' || u < 0.34) { go(N, nSpot, nYaw, mode === 'out' ? 'jog' : 'snap', 'carry'); N.carry = true; tN.mode = 'hands'; }
        else if (u < 0.46) { const t2 = crSS(0.34, 0.46, u); go(N, Wp(fk - dO * (0.72 - 0.3 * t2), sd * (D.hw + 0.86 - 0.25 * t2)), nYaw, 'snap', 'carry'); N.carry = true; tN.mode = 'lerp'; tN.to = hb; tN.t = t2; }
        else if (u < 0.58) { go(N, Wp(fk - dO * 0.42, sd * (D.hw + 0.61)), nYaw, 'snap', 'pushT'); N.aim = hb; N.carry = false; tN.mode = 'hidden'; }
        else { go(N, Wp(fk - dO * 0.8, sd * (D.hw + 1.1 + (mode === 'clear' ? 0.3 : 0))), nYaw, 'snap', 'stand'); N.carry = false; tN.mode = 'hidden'; }
        crewWheel(k, mode === 'work' && u > 0.24 && u < 0.46); }
      // jack men: front one in front of the nose (the car stops before him), rear one steps in behind the tail once it has stopped
      const JF = R.JF, JR = R.JR, dj = 0.52 + 1.3 * Math.cos(CR_B0);
      const fSpot = Wp(D.nose + 0.22 + dj, 0), rSpot = Wp(D.tail - 0.22 - dj, 0);
      if (mode === 'out') { go(JF, fSpot, yawC(-1, 0), 'jog', 'jackR'); go(JR, Wp(D.tail - 0.22 - dj, D.wid * 0.5 + 0.4), yawC(1, 0), 'jog', 'jackR'); }
      else if (mode === 'work') {
        go(JF, u < 0.93 ? fSpot : Wp(D.nose + 0.22 + dj + 0.5 * crSS(0.93, 1, u), 0), yawC(-1, 0), 'snap', u < 0.89 ? 'jackP' : 'jackR');
        go(JR, u < 0.9 ? rSpot : Wp(D.tail - 0.22 - dj - 0.4 * crSS(0.9, 1, u), 0), yawC(1, 0), 'dash', u < 0.86 ? 'jackP' : 'jackR'); }
      else { go(JF, Wp(D.nose + 0.72 + dj, D.wid * 0.5 + 1.6), yawC(-1, 0), 'run', 'jackR'); go(JR, Wp(D.tail - 0.62 - dj, D.wid * 0.5 + 1.2), yawC(1, 0), 'walk', 'jackR'); }
      JF.carry = JR.carry = true;
      const atF = mode === 'work' && Math.hypot(JF.x - fSpot[0], JF.z - fSpot[1]) < 0.15, atR = mode === 'work' && Math.hypot(JR.x - rSpot[0], JR.z - rSpot[1]) < 0.15;
      const bF = atF && u < 0.89 ? CR_B1 : CR_B0, bR = atR && u < 0.86 ? CR_B1 : CR_B0, js = Math.min(1, dt * 9);   // pushing the handle down lifts that end of the car
      JF.jack.beta += (bF - JF.jack.beta) * js; JR.jack.beta += (bR - JR.jack.beta) * js;
      c.liftF = mode === 'work' ? CR_LIFT * clamp((CR_B0 - JF.jack.beta) / (CR_B0 - CR_B1), 0, 1) : 0; c.liftR = mode === 'work' ? CR_LIFT * clamp((CR_B0 - JR.jack.beta) / (CR_B0 - CR_B1), 0, 1) : 0;
      // lollipop: held across in front of the driver, lifted when the car is released
      const LP = R.LP, lpSpot = Wp(D.nose + 0.95, -(D.wid * 0.5 + 0.65)), lpThere = Math.hypot(LP.x - lpSpot[0], LP.z - lpSpot[1]) < 0.6;   // (he carries it upright until he is at his spot)
      go(LP, lpSpot, yawC(0, 1), mode === 'out' ? 'jog' : 'snap', mode === 'clear' ? (c.clearT < 1.8 ? 'lolliU' : 'lolliD') : lpThere ? 'lolliH' : 'lolliD'); LP.carry = true;
    }
    if (mode !== 'work') { c.liftF = 0; c.liftR = 0; }
    c.lift = (c.liftF + c.liftR) / 2; c.liftP = Math.atan2(c.liftF - c.liftR, D.wb);
    // the engineer on the pit wall follows his car
    const E = R.ENG; E.lookAt = Math.hypot(P.x - E.x, P.z - E.z) < 160 ? [P.x, P.z] : null;
    if (mode !== 'work') for (let k = 0; k < 4; k++) crewWheel(k, false);
  }
  function crewWheel(k, hide) {   // the player's car wheel k (0 FL, 1 FR, 2 RL, 3 RR) is off the car while the tyre men swap it (only wheels that are separate meshes)
    const P = crew.P, v = views.find(v => v.car === P); if (!v) return;
    const list = k < 2 ? v.wf : v.wr, want = k % 2 ? 1 : -1;
    for (const w of list) if (Math.sign(w.position.z) === want && w.visible === hide) w.visible = !hide;
  }
  function crSpark(hb, sd, F, dt) {   // a few tiny sparks off the wheel nut while the gun rattles (about 20 a second)
    if (Math.random() > dt * 20) return;
    const rx = -Math.sin(F.h) * sd, rz = Math.cos(F.h) * sd, x = hb[0] + rx * 0.16, z = hb[2] + rz * 0.16;
    sparkP.emit(x, hb[1], z, rx * (1 + Math.random() * 2) + (Math.random() - 0.5) * 2, 0.5 + Math.random() * 1.5, rz * (1 + Math.random() * 2) + (Math.random() - 0.5) * 2, 0.1 + Math.random() * 0.1, 0.07, 0.02, 1, 0.8, 0.45, 0.9, 9, 1.2, 0);
  }

  // ---- every frame ----
  function crewMan(m, dt) {
    const dx = m.gx - m.x, dz = m.gz - m.z, d = Math.hypot(dx, dz);
    const vmax = m.style === 'run' ? 4.4 : m.style === 'dash' ? 3.4 : m.style === 'jog' ? 3.1 : m.style === 'snap' ? 2.4 : 1.45, want = d > 0.015 ? Math.min(vmax, d * 3.5 + 0.25) : 0;
    m.spd = Math.max(0, m.spd + clamp(want - m.spd, -14 * dt, 9 * dt));
    const step = Math.min(d, m.spd * dt); if (d > 1e-5) { m.x += dx / d * step; m.z += dz / d * step; }
    const moving = m.style !== 'snap' && m.style !== 'dash' && m.spd > 0.6 && d > 0.35, face = moving ? Math.atan2(dz, dx) : m.gyaw;
    m.yaw += wrapPi(face - m.yaw) * Math.min(1, dt * (moving ? 7 : 5));
    m.ph += step / (m.spd > 2.2 ? 2.4 : 1.4) * CR_TAU;
    const walk = clamp(m.spd / 0.8, 0, 1), run = clamp((m.spd - 2) / 1.6, 0, 1);
    crPose(m, time, _cO, _cH);
    if (walk > 0) { crGait(m, run, _cO2, _cH2); for (let k = 0; k < 12; k++) _cO[k] += (_cO2[k] - _cO[k]) * walk; if (!m.carry) for (let k = 0; k < 12; k++) _cH[k] += (_cH2[k] - _cH[k]) * walk; }
    // where he looks: his car when it is near (the engineer always), otherwise now and then around
    let lk = null; const P = crew.P;
    if (m.lookAt) lk = m.lookAt; else if (P && m.act !== 'bench' && m.act !== 'kneel' && m.act !== 'gunK' && Math.hypot(P.x - m.x, P.z - m.z) < 45) lk = [P.x, P.z];
    const la = lk ? -wrapPi(Math.atan2(lk[1] - m.z, lk[0] - m.x) - m.yaw) : Math.sin(time * 0.23 + m.t0) * 0.7 * Math.max(0, Math.sin(time * 0.11 + m.t0 * 2));
    m.look += (clamp(la, -1.2, 1.2) - m.look) * Math.min(1, dt * 4); _cO[5] += m.look * (1 - walk * 0.7); _cO[2] += m.look * 0.2;
    const ko = 1 - Math.exp(-dt * (walk > 0.3 ? 24 : 12)), kh = 1 - Math.exp(-dt * 14);
    for (let k = 0; k < 12; k++) { m.O[k] += (_cO[k] - m.O[k]) * ko; m.H[k] += (_cH[k] - m.H[k]) * kh; }
    // the other teams change what they do now and then
    if (m.role === 'idle' && (m.act0 === 'cross' || m.act0 === 'hips' || m.act0 === 'talk')) { const q = Math.floor((time + m.t0 * 7) / (7 + m.h1 * 8)); if (q !== m.q) { m.q = q; const r = crHash(q * 3.1 + m.id); m.act = r < 0.33 ? 'hips' : r < 0.66 ? 'cross' : 'talk'; } }
  }
  const _cM = new THREE.Matrix4(), _cM2 = new THREE.Matrix4(), _cQ = new THREE.Quaternion(), _cS = new THREE.Vector3(1, 1, 1);
  function crSetRod(im, i, ax, ay, az, bx, by, bz, th, thy) {   // a rod from a to b, th thick (thy tall if given)
    let zx = bx - ax, zy = by - ay, zz = bz - az; const L = Math.hypot(zx, zy, zz); if (L < 1e-4) { im.setMatrixAt(i, _zero); return; } zx /= L; zy /= L; zz /= L;
    let ux = 0, uy = 1, uz = 0; if (Math.abs(zy) > 0.95) { ux = 1; uy = 0; }
    let xx = uy * zz - uz * zy, xy = uz * zx - ux * zz, xz = ux * zy - uy * zx; const xl = Math.hypot(xx, xy, xz); xx /= xl; xy /= xl; xz /= xl;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    const ty = thy || th; _cM.set(xx * th, yx * ty, zx * L, ax, xy * th, yy * ty, zy * L, ay, xz * th, yz * ty, zz * L, az, 0, 0, 0, 1); im.setMatrixAt(i, _cM);
  }
  function crTyreMat(t, out) {   // where a tyre is: on the floor, in its man's hands, on the hub, or on the way between
    const m = t.man, yawM = Math.PI / 2 - m.yaw;
    if (t.mode === 'floor') { _cQ.setFromEuler(_ce.set(0, yawM, Math.PI / 2, 'YXZ')); out.compose(_cv.set(m.hx + Math.cos(m.hyaw) * 0.5, 0.14, m.hz + Math.sin(m.hyaw) * 0.5), _cQ, _cS); return true; }
    if (t.mode === 'hidden') return false;
    // in the hands: in front of him at the waist, the axle along his facing
    const fx = Math.cos(m.yaw), fz = Math.sin(m.yaw), s = m.sc; let ang = yawM + Math.PI / 2;
    _cv.set(m.x + fx * 0.42 * s, m.y + 0.99 * s, m.z + fz * 0.42 * s);
    if (t.mode === 'lerp') {   // between his hands and the hub: off the car (from the hub) or onto it (to the hub); the axle turns to the car's
      const hubP = t.from || t.to, k = t.from ? 1 - t.t : t.t, F = crew.frame; let hubA = Math.PI / 2 - F.h; if (Math.abs(wrapPi(hubA - ang)) > Math.PI / 2) hubA += Math.PI;
      _cv.set(_cv.x + (hubP[0] - _cv.x) * k, _cv.y + (hubP[1] - _cv.y) * k, _cv.z + (hubP[2] - _cv.z) * k); ang += wrapPi(hubA - ang) * k; }
    _cQ.setFromEuler(_ce.set(0, ang, 0, 'YXZ')); out.compose(_cv, _cQ, _cS); return true;
  }
  function updateCrew(dt) {
    if (!crew) return;
    const c = crew; crewLogic(dt);
    const near = Math.hypot(cam.vcx - c.cx, cam.vcz - c.cz) < c.rad + 170;
    if (c.grp.visible !== near) c.grp.visible = near;
    if (!near) { for (const m of c.men) { m.x = m.gx; m.z = m.gz; m.yaw = m.gyaw; m.spd = 0; } return; }   // off screen: everybody just is where he is going
    const M = c.M, rel = (im, i, src) => im.setMatrixAt(i, src);
    for (let i = 0; i < c.men.length; i++) { const m = c.men[i];
      crewMan(m, dt); crRig(m);
      _cM.copy(CRM.pel); { const e = _cM.elements, bz = 0.6 + 0.4 * m.bulk; e[0] *= m.bulk; e[1] *= m.bulk; e[2] *= m.bulk; e[8] *= bz; e[9] *= bz; e[10] *= bz; } rel(M.trunk, i, _cM);
      rel(M.head, i, CRM.neck); rel(M.helmet, i, m.helmet ? CRM.neck : _zero);
      rel(M.uarm, i * 2, CRM.shL); rel(M.uarm, i * 2 + 1, CRM.shR); rel(M.farm, i * 2, CRM.elL); rel(M.farm, i * 2 + 1, CRM.elR);
      rel(M.thigh, i * 2, CRM.hipL); rel(M.thigh, i * 2 + 1, CRM.hipR); rel(M.shin, i * 2, CRM.knL); rel(M.shin, i * 2 + 1, CRM.knR);
      if (m.gun) rel(M.gun, m.gunI, CRM.hdR);
      if (m.role === 'G' && M.rod) {   // air hose: gun -> the floor behind him -> the garage
        _cv.set(0, 0.07, 0.05).applyMatrix4(CRM.hdR); const bx = m.x - Math.cos(m.yaw) * 0.55, bz = m.z - Math.sin(m.yaw) * 0.55;
        crSetRod(M.rod, m.wheel * 2, _cv.x, _cv.y, _cv.z, bx, 0.03, bz, 0.032); crSetRod(M.rod, m.wheel * 2 + 1, bx, 0.03, bz, m.air[0], 0.03, m.air[1], 0.032); }
      if (m.jack && M.jack) { const j = m.jack, fx = Math.cos(m.yaw), fz = Math.sin(m.yaw), dj = 0.52 + 1.3 * Math.cos(CR_B0), ax = m.x + fx * dj, az = m.z + fz * dj, ji = m.role === 'JF' ? 0 : 1;
        _cQ.setFromEuler(_ce.set(0, Math.PI / 2 - m.yaw, 0, 'YXZ')); _cM2.compose(_cv.set(ax, 0, az), _cQ, _cS); M.jack.setMatrixAt(ji, _cM2);
        const px = ax - fx * 0.1, pz = az - fz * 0.1, gl = 0.1 + 1.3 * Math.cos(j.beta), gx = ax - fx * gl, gz = az - fz * gl, gy = 0.14 + 1.3 * Math.sin(j.beta), lx = Math.sin(m.yaw) * 0.24, lz = -Math.cos(m.yaw) * 0.24;
        crSetRod(M.rod, 8 + ji, px, 0.14, pz, gx, gy, gz, 0.045); crSetRod(M.rod, 10 + ji, gx - lx, gy, gz - lz, gx + lx, gy, gz + lz, 0.035); }
      if (m.role === 'LP' && M.disc) {   // the lollipop: the pole out of his hand (across, raised or resting upright), the sign at its end facing along the car
        const want = m.act === 'lolliH' ? [Math.cos(m.yaw), 0, Math.sin(m.yaw)] : [0, 1, 0]; m.pd = m.pd || [0, 1, 0];
        for (let k = 0; k < 3; k++) m.pd[k] += (want[k] - m.pd[k]) * Math.min(1, dt * 8); const l = Math.hypot(...m.pd) || 1, d0 = m.pd[0] / l, d1 = m.pd[1] / l, d2 = m.pd[2] / l;
        _cv.setFromMatrixPosition(CRM.hdR); const ex = _cv.x + d0 * 1.35, ey = _cv.y + d1 * 1.35, ez = _cv.z + d2 * 1.35; crSetRod(M.rod, 12, _cv.x, _cv.y, _cv.z, ex, ey, ez, 0.03);
        const nx = Math.sin(m.yaw), nz = -Math.cos(m.yaw);   // the sign's face points along his left-right, i.e. along the car (y = the pole, z = that normal, x = y cross z)
        const xx = d1 * nz, xy = d2 * nx - d0 * nz, xz = -d1 * nx, xl = Math.hypot(xx, xy, xz) || 1;
        _cM.set(xx / xl, d0, nx, ex + d0 * 0.2, xy / xl, d1, 0, ey + d1 * 0.2, xz / xl, d2, nz, ez + d2 * 0.2, 0, 0, 0, 1); M.disc.setMatrixAt(0, _cM); }
    }
    for (const t of c.tyres) M.tyre.setMatrixAt(t.i, crTyreMat(t, _cM) ? _cM : _zero);
    for (const im of c.meshes) im.instanceMatrix.needsUpdate = true;
  }

  /* ---------------- per-frame ---------------- */
  const tmp = { x: 0, z: 0 };
  function wheelWorld(c, lx, lz, x, z, h) { const ch = Math.cos(h), sh = Math.sin(h); tmp.x = x + lx * ch - lz * sh; tmp.z = z + lx * sh + lz * ch; return tmp; }

  function updateCars(dt, alpha, opt) {
    const markerOn = opt && opt.marker;
    glows.begin();
    for (const v of views) {
      const c = v.car, M = c.m;
      const x = lerp(c.px, c.x, alpha), z = lerp(c.pz, c.z, alpha), h = c.ph + wrapPi(c.h - c.ph) * alpha;
      const y = lerp(c.py, c.y, alpha), jk = crew && c === crew.P;   // jk: the player's car, maybe up on the jacks in its pit box
      v.grp.position.set(x, y + (jk ? crew.lift : 0), z);
      const lat = clamp(c.w * c.speed, -16, 16);
      v.roll += (clamp(-lat * 0.0042, -0.06, 0.06) - v.roll) * Math.min(1, dt * 7);
      v.pitch += (clamp(c.axF * 0.0035, -0.045, 0.04) - v.pitch) * Math.min(1, dt * 7);
      // pitch with the road slope (nose up on climbs), or follow the arc while airborne
      const pitchTarget = c.air ? Math.atan2(c.vy, Math.max(Math.abs(c.vl), 6)) * 0.8 : Math.atan(c.gradeNow || 0);
      v.gpitch += (pitchTarget - v.gpitch) * Math.min(1, dt * (c.air ? 9 : 6));
      const bankT = c.bankSl && !c.air ? -Math.atan(c.bankSl * (-Math.sin(h) * c.q.nx + Math.cos(h) * c.q.nz)) : 0;   // a banked corner: tilt with the surface
      v.broll = (v.broll || 0) + (bankT - (v.broll || 0)) * Math.min(1, dt * 10);
      v.grp.rotation.set(v.broll, -h, v.gpitch + (jk ? crew.liftP : 0), 'YZX');   // whole car (incl. separate front wheels) follows the slope (and the bank)
      v.bodyG.rotation.set(v.roll, 0, v.pitch);
      v.bodyG.position.y = Math.abs(v.roll) * 0.4 + (c.onCurb ? Math.sin(time * 60) * 0.015 : 0);
      if (v.blob) v.blob.position.y = (c.roadY - c.y) + 0.05 - (jk ? crew.lift : 0); // shadow stays on the ground during jumps (and on the jacks)
      v.landed = !!(v.wasAir && !c.air);   // landing this frame (dust ring is emitted in emitFx)
      if (v.landed && c.isPlayer && c.speed > 3) shake(0.15 + clamp(-(c.impactVY || 0) / 8, 0, 1) * 0.45);
      v.spin += c.vl * dt / M.rw;
      for (const w of v.wf) { w.rotation.set(0, -c.delta, -v.spin); }
      for (const w of v.wr) { w.rotation.set(0, 0, -v.spin); }
      const braking = (c.inBrk > 0.08 && c.vl > 0.5 && c.gear !== -1) || c.gear === -1 || c.inHand > 0.5;
      v.tail.material = braking ? matTailOn : matTailOff;
      if (v.glb) v.glb.tail.emissive.setHex(braking ? 0xff1a0a : 0x3a0000);
      // light glows: soft warm headlights, red tail lights that flare when braking
      v.grp.updateMatrixWorld(true);
      for (let k = 0; k < 4; k++) {
        if (v.lightBroken && v.lightBroken[k]) continue;   // smashed lamp: no glow
        _lv.copy(v.lights[k]).applyMatrix4(v.grp.matrixWorld);
        if (k < 2) glows.add(_lv.x, _lv.y, _lv.z, 0.95, 1.0, 0.88, 0.62, 0.17);
        else glows.add(_lv.x, _lv.y, _lv.z, braking ? 1.8 : 0.95, 1.0, 0.15, 0.08, braking ? 0.95 : 0.3);
      }
      // dirt builds up while driving on grass/gravel/makadam (never washes off during a race)
      if (v.scrU) v.scrU.value = Core.sstep(0.3, 0.9, c.dmg || 0);
      if (v.dirtU && !(opt && opt.noFx) && !c.air && dt > 0) {
        let loose = 0; for (let k = 0; k < 4; k++) { const sf = c.ws[k]; if (sf === 2 || sf === 3 || sf === 5) loose++; }
        if (loose) v.dirtU.value = Math.min(1, v.dirtU.value + dt * loose * 0.012 * clamp(c.speed / 12, 0.2, 1.5));
      }
      if (v.marker) { v.marker.visible = !!markerOn; v.marker.position.y = 4 + Math.sin(time * 5) * 0.3; v.marker.rotation.y = time * 2; }
      // --- effects ---
      if (!opt || !opt.noFx) emitFx(v, c, dt, x, z, h);
      v.wasAir = !!c.air;
      if (c.dents && c.dents.length) { for (const d of c.dents) applyDent(v, d); c.dents.length = 0; }
      if (v.parts) updateParts(v, c, x, y, z, h);
      if (c.dmg > 0.45 && (!opt || !opt.noFx) && !dbg.noSmoke) {   // damaged engine smokes: grey, turning black when badly hurt
        v.smokeAcc += (c.dmg - 0.4) * (10 + 16 * (c.inThr || 0)) * dt;
        const dark = Core.sstep(0.5, 0.95, c.dmg), gc = 0.84 - 0.4 * dark, fx = Math.cos(h) * M.len * 0.32, fz = Math.sin(h) * M.len * 0.32;
        while (v.smokeAcc >= 1) {
          v.smokeAcc -= 1;
          particles.emit(x + fx + (Math.random() - 0.5) * 0.5, y + 0.95, z + fz + (Math.random() - 0.5) * 0.5, c.vx * 0.35 + (Math.random() - 0.5) * 0.6, 0.9 + Math.random() * 0.6, c.vz * 0.35 + (Math.random() - 0.5) * 0.6, 1.7 + Math.random() * 0.9, 0.7, 3.8 + Math.random() * 1.6, gc, gc, gc * 1.02, 0.52 + dark * 0.2, -0.3, 0.9, y);
        }
      }
    }
    glows.end();
    skids.flush();
  }

  /* ---------------- detachable parts, broken lamps, debris ---------------- */
  // Parts are separate meshes placed from the body's section profile, so each can come off on its own.
  // Underneath each one a dark 'underlay' (engine bay, bare arch, crash beam) appears once it is gone.
  let matUnder = null, matEngine = null, matLens = null, matLensBroken = null;
  function buildParts(v) {
    const c = v.car, M = c.m, dB = BODIES[M.body] || BODIES.coupe, S = dB.secs, sx = M.len / dB.len, sz = M.wid / dB.wid;
    if (!matUnder) { matUnder = new THREE.MeshLambertMaterial({ color: 0x1b1d22 }); matEngine = new THREE.MeshLambertMaterial({ color: 0x5b5f66 }); matLens = new THREE.MeshBasicMaterial({ color: 0xfff1c8 }); matLensBroken = new THREE.MeshLambertMaterial({ color: 0x24272c }); }
    const at = (x) => { const L = S[S.length - 1]; if (x <= S[0][0]) return S[0]; if (x >= L[0]) return L; for (let k = 0; k < S.length - 1; k++) if (x <= S[k + 1][0]) { const t = (x - S[k][0]) / (S[k + 1][0] - S[k][0]); return S[k].map((q, i) => typeof q === 'number' ? q + (S[k + 1][i] - q) * t : q); } return L; };
    const paint = new THREE.MeshPhongMaterial({ color: c.color, shininess: 80, specular: 0x505050, envMap: envTex, combine: THREE.MixOperation, reflectivity: 0.2 });
    const trim = new THREE.MeshLambertMaterial({ color: 0x2b2e34 });
    v.partMats = [paint, trim];
    const parts = {}, under = {}, add = (name, geo, mat, x, y, z, rz, uGeo, uMat, extra) => {
      const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.z = rz || 0; m.castShadow = true; v.bodyG.add(m); parts[name] = m;
      if (uGeo) { const u = new THREE.Group(); const um = new THREE.Mesh(uGeo, uMat || matUnder); u.add(um); if (extra) u.add(extra); u.position.set(x, y - 0.012, z); u.rotation.z = rz || 0; u.visible = false; v.bodyG.add(u); under[name] = u; }
    };
    const nose = S[S.length - 1][0], tail = S[0][0];
    const iGF = S.findIndex(q => q[7] === 'gf'), iGR = S.findIndex(q => q[7] === 'gr');
    // bonnet: from just ahead of the windscreen to the nose, following the slope
    { const x0 = (iGF >= 0 && iGF + 1 < S.length ? S[iGF + 1][0] : nose * 0.4) + 0.06, x1 = nose - 0.14, a = at(x0), b = at(x1);
      const L = (x1 - x0) * sx, W = 2 * Math.min(a[4], b[4]) * sz * 0.88, rz = Math.atan2(b[5] - a[5], L);
      const eng = new THREE.Mesh(new THREE.BoxGeometry(L * 0.46, 0.14, W * 0.44), matEngine); eng.position.set(0, 0.08, 0);
      add('hood', new THREE.BoxGeometry(L, 0.045, W), paint, (x0 + x1) / 2 * sx, (a[5] + b[5]) / 2 + 0.028, 0, rz, new THREE.BoxGeometry(L * 0.94, 0.03, W * 0.92), matUnder, eng); }
    // boot lid (flat deck) or tailgate (hatchback: rear glass reaches the tail)
    { const x1 = (iGR > 0 ? S[iGR - 1][0] : tail * 0.5) - 0.03, x0 = tail + 0.12;
      if (x1 - x0 > 0.35) { const a = at(x0), b = at(x1), L = (x1 - x0) * sx, W = 2 * Math.min(a[4], b[4]) * sz * 0.88, rz = Math.atan2(b[5] - a[5], L);
        add('trunk', new THREE.BoxGeometry(L, 0.045, W), paint, (x0 + x1) / 2 * sx, (a[5] + b[5]) / 2 + 0.028, 0, rz, new THREE.BoxGeometry(L * 0.94, 0.03, W * 0.92)); }
      else { const a = at(tail), H = (a[5] - a[3]) * 0.9 + 0.12, W = 2 * a[4] * sz * 0.86;
        add('trunk', new THREE.BoxGeometry(0.05, H, W), paint, tail * sx - 0.03, a[3] + H / 2 - 0.06, 0, 0, new THREE.BoxGeometry(0.03, H * 0.92, W * 0.9)); } }
    // bumpers
    for (const [name, xs] of [['bumperF', nose], ['bumperR', tail]]) {
      const a = at(xs), H = (a[3] - a[2]) * 0.55, W = 2 * a[1] * sz * 0.97, sg = Math.sign(xs);
      add(name, new THREE.BoxGeometry(0.13, H, W), trim, xs * sx + sg * 0.05, a[2] + H * 0.5 + 0.02, 0, 0, new THREE.BoxGeometry(0.06, 0.09, W * 0.8), matEngine);
    }
    // front wings (fenders) above the front wheels
    { const fx = M.a * (M.len / 4.4) * 0.98 + 0.05, a = at(fx / sx), y0 = M.rw * 1.75, y1 = a[3] - 0.03;
      if (y1 - y0 > 0.08) for (const [name, sd] of [['fenderL', -1], ['fenderR', 1]]) add(name, new THREE.BoxGeometry(1.0, y1 - y0, 0.035), paint, fx, (y0 + y1) / 2, sd * (a[1] * sz + 0.014), 0, new THREE.BoxGeometry(0.96, y1 - y0, 0.02)); }
    // door mirrors at the base of the windscreen
    if (iGF >= 0) { const a = at(S[iGF][0]); for (const [name, sd] of [['mirrorL', -1], ['mirrorR', 1]]) add(name, new THREE.BoxGeometry(0.15, 0.1, 0.2), paint, S[iGF][0] * sx + 0.05, a[3] + 0.1, sd * (a[1] * sz + 0.1), 0); }
    v.parts = parts; v.under = under;
    v.glassTris = findGlass(v); v.winBroken = [0, 0, 0, 0]; v.roofStep = 0;
    if (v.glb) {   // real model: no stock panels to knock off, no stock glass to crack
      for (const k in parts) parts[k].visible = false;
      v.glassTris = [[], [], [], []];
    }
    // head lamp lenses (they go dark when smashed); tail lamps get a dark cover when smashed
    v.lens = []; v.lightBroken = [0, 0, 0, 0];
    for (let k = 0; k < 2; k++) { const L = v.lights[k], m = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.11, 0.28), matLens); m.position.set(L.x - 0.02, L.y, L.z); m.visible = !v.glb; v.bodyG.add(m); v.lens.push(m); }
  }
  function updateParts(v, c, x, y, z, h) {
    // lamps
    for (let k = 0; k < 4; k++) if (c.lightOut[k] && !v.lightBroken[k]) {
      v.lightBroken[k] = 1;
      const L = v.lights[k];
      if (k < 2) v.lens[k].material = matLensBroken;
      else if (!v.glb) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.13, 0.3), matLensBroken); m.position.set(L.x + 0.02, L.y, L.z); v.bodyG.add(m); }
      const ch = Math.cos(h), sh = Math.sin(h), wx = x + L.x * ch - L.z * sh, wz = z + L.x * sh + L.z * ch;
      for (let n = 0; n < 14; n++) particles.emit(wx, y + L.y, wz, c.vx * 0.5 + (Math.random() - 0.5) * 4, 1 + Math.random() * 2.5, c.vz * 0.5 + (Math.random() - 0.5) * 4, 0.7 + Math.random() * 0.5, 0.18, 0.12, 0.86, 0.92, 0.98, 0.95, 9, 0.6, y);   // glass shards
    }
    for (let k = 0; k < 4; k++) if (c.winOut[k] && !v.winBroken[k]) { v.winBroken[k] = 1; breakWindow(v, k, c, x, y, z, h); }
    while (v.roofStep < 4 && c.roofDmg >= (v.roofStep + 1) * 0.25) { v.roofStep++; crumpleRoof(v, 0.25); }
    // parts that just came off: hide the panel, reveal what is underneath, a puff of bits
    for (const name in v.parts) {
      const m = v.parts[name];
      if (!m.visible || !c.lost[name]) continue;
      m.visible = false; if (v.under[name]) v.under[name].visible = true;
      const ch = Math.cos(h), sh = Math.sin(h), px = m.position.x, pz = m.position.z, wx = x + px * ch - pz * sh, wz = z + px * sh + pz * ch;
      for (let n = 0; n < 10; n++) particles.emit(wx, y + m.position.y, wz, c.vx * 0.6 + (Math.random() - 0.5) * 5, 1 + Math.random() * 3, c.vz * 0.6 + (Math.random() - 0.5) * 5, 0.9 + Math.random() * 0.5, 0.22, 0.16, 0.2, 0.2, 0.22, 0.9, 9, 0.7, y);
      for (let n = 0; n < 6; n++) sparkP.emit(wx, y + m.position.y, wz, (Math.random() - 0.5) * 7, 1 + Math.random() * 3, (Math.random() - 0.5) * 7, 0.25 + Math.random() * 0.25, 2.2, 3.2, 1, 0.8, 0.4, 0.9, 0, 0, y);
    }
  }
  function syncDebris() {
    if (!curRace || !curRace.debris) return;
    for (const d of curRace.debris) {
      if (d.mesh || d.dead) continue;
      const v = views.find(q => q.car.id === d.car), src = v && v.parts && v.parts[d.part];
      if (!src) { d.mesh = true; continue; }
      // a loose panel lies on its biggest face: turn the thinnest box dimension upright inside a holder
      const inner = new THREE.Mesh(src.geometry, src.material); inner.castShadow = true; inner.receiveShadow = true;
      const pr = src.geometry.parameters || {}, dims = [pr.width || 1, pr.height || 1, pr.depth || 1], thin = dims.indexOf(Math.min(...dims));
      if (thin === 2) inner.rotation.x = Math.PI / 2; else if (thin === 0) inner.rotation.z = Math.PI / 2;
      const m = new THREE.Group(); m.rotation.order = 'YXZ'; m.add(inner);
      scene.add(m); d.mesh = m; debrisMeshes.push(d);
    }
    for (let i = debrisMeshes.length - 1; i >= 0; i--) {
      const d = debrisMeshes[i];
      if (d.dead) { scene.remove(d.mesh); debrisMeshes.splice(i, 1); continue; }
      d.mesh.position.set(d.x, d.y, d.z); d.mesh.rotation.set(d.rx, -d.yaw, d.rz);
    }
  }
  // loose panels off the track, freed with them (a panel of a car that was repaired in the pits outlives its car's own mesh)
  function clearDebris() { for (const d of debrisMeshes) { scene.remove(d.mesh); if (d.mesh && d.mesh.traverse) freeOwn(d.mesh); } debrisMeshes.length = 0; }

  function applyDent(v, d) {   // push the bodywork in around the hit point (deterministic jitter → no cracks) and scrape the paint
    const geo = v.body.geometry, pos = geo.attributes.position, col = geo.attributes.color, M = v.car.m;
    if (!geo.boundingBox) geo.computeBoundingBox();
    const bb = geo.boundingBox, hx = Math.max(-bb.min.x, bb.max.x), hz = Math.max(-bb.min.z, bb.max.z);
    const cx = d.lx / (M.len * 0.5) * hx, cz = d.lz / (M.wid * 0.5) * hz, cy = bb.min.y + (bb.max.y - bb.min.y) * 0.42;
    const R = 0.55 + Math.min(0.6, d.amt * 1.4), depth = Math.min(0.2, 0.035 + d.amt * 0.42);
    let ix = -cx, iz = -cz; const il = Math.hypot(ix, iz) || 1; ix /= il; iz /= il;
    const a = pos.array, ca = col ? col.array : null, scr = Math.min(1, d.amt * 3 + 0.3);
    const dentTris = new Set();
    for (let k = 0; k < pos.count; k++) {
      const x = a[k * 3], y = a[k * 3 + 1], z = a[k * 3 + 2];
      const dx = x - cx, dy = (y - cy) * 0.6, dz = z - cz, dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist >= R) continue;
      const f = (1 - dist / R) * (1 - dist / R);
      const hs = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453, jit = 0.7 + 0.6 * (hs - Math.floor(hs));
      const m = depth * f * jit;
      a[k * 3] += ix * m; a[k * 3 + 2] += iz * m; a[k * 3 + 1] -= m * 0.25;
      if (ca) { const sK = 1 - 0.38 * f * scr; for (let q = 0; q < 3; q++) ca[k * 3 + q] = ca[k * 3 + q] * sK + 0.21 * (1 - sK); }
      dentTris.add((k / 3) | 0);
    }
    pos.needsUpdate = true; if (col) col.needsUpdate = true;
    refacet(geo, dentTris);
  }

  function emitFx(v, c, dt, x, z, h) {
    const M = c.m, spd = c.speed;
    const tw = M.wid * 0.43, yb = c.y || 0;
    // landing after a jump: a ring of dust (and stones on loose ground) bursting out from under the car
    if (v.landed) {
      const hard = -(c.impactVY || 0), gy = c.roadY || 0;
      if (hard > 2.2) {
        let loose = 0; for (let k = 0; k < 4; k++) { const sf = c.ws[k]; if (sf >= 2 && sf !== 4) loose++; }
        const dirt = loose >= 2, n = Math.min(26, 8 + hard * 2.2);
        for (let k = 0; k < n; k++) {
          const a = k / n * Math.PI * 2 + Math.random() * 0.4, sp = (2.5 + Math.random() * 3) * Math.min(1.6, hard / 6);
          const cr = dirt ? 0.8 : 0.78, cg = dirt ? 0.66 : 0.77, cb = dirt ? 0.46 : 0.75;
          particles.emit(x + Math.cos(a) * 1.3, gy + 0.3, z + Math.sin(a) * 1.3, Math.cos(a) * sp + c.vx * 0.3, 0.6 + Math.random() * 0.8, Math.sin(a) * sp + c.vz * 0.3, 1.0 + Math.random() * 0.7, 1.1, 5 + Math.random() * 2.5, cr, cg, cb, 0.5, -0.08, 2.2, gy);
        }
        if (dirt) for (let k = 0; k < 8; k++) { const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 3; particles.emit(x, gy + 0.3, z, Math.cos(a) * sp + c.vx * 0.4, 3 + Math.random() * 2.5, Math.sin(a) * sp + c.vz * 0.4, 0.8 + Math.random() * 0.4, 0.3, 0.26, 0.34, 0.27, 0.2, 0.95, 14, 0.4, gy); }
      }
    }
    const slide = (c.arcade ? Core.sstep(0.26, 0.62, Math.abs(c.beta || 0)) * 1.2 : Math.max(0, c.latR - 1.0) / 3.5) + c.spin * 0.9 + (c.lock ? 0.55 : 0) + (c.inHand > 0.5 && spd > 5 ? 0.45 : 0);
    const wheels = [[-M.b, -tw, 2], [-M.b, tw, 3], [M.a, -tw, 0], [M.a, tw, 1]];
    for (let k = 0; k < 4; k++) {
      const [lx, lz, wi] = wheels[k];
      if (c.air) { v.sk[k] = null; v.acc[k] = 0; continue; }
      const surf = c.ws[wi];
      const front = k >= 2;
      const p = wheelWorld(c, lx, lz, x, z, h); const px = p.x, pz = p.z;
      let intens = front ? (c.lock ? 0.5 : 0) + Math.max(0, c.slipF - 0.3) * 1.4 : slide;
      if (spd < 2.5) intens = 0;
      // skid marks
      const onHard = surf <= 1;
      const skidOn = intens > 0.14 && spd > 2.5;
      if (skidOn) {
        const last = v.sk[k];
        if (last) {
          const d = Math.hypot(px - last[0], pz - last[1]);
          if (d > 0.45 && d < 4) {
            const a = clamp(0.4 + intens * 0.4, 0.4, 0.86);
            if (onHard) skids.add(last[0], last[1], px, pz, 0.2, 0.035, 0.035, 0.04, a * 0.92, a, last[2], yb);
            else if (surf === 3 || surf === 5) skids.add(last[0], last[1], px, pz, 0.22, 0.42, 0.27, 0.14, a * 0.85, a * 0.95, last[2], yb);
            else skids.add(last[0], last[1], px, pz, 0.22, 0.14, 0.2, 0.07, a * 0.75, a * 0.85, last[2], yb);
            v.sk[k] = [px, pz, yb];
          } else if (d >= 4) v.sk[k] = [px, pz, yb];
        } else v.sk[k] = [px, pz, yb];
      } else v.sk[k] = null;
      // smoke / dust
      if (front) continue;
      if (onHard && intens > 0.22 && spd > 3) {
        v.acc[k] += Math.min(1.3, intens) * 42 * dt;
        while (v.acc[k] >= 1) {
          v.acc[k] -= 1;
          const vxs = c.vx * 0.12 + (Math.random() - 0.5) * 1.6, vzs = c.vz * 0.12 + (Math.random() - 0.5) * 1.6;
          const g = 0.88 + Math.random() * 0.1;
          particles.emit(px, 0.35 + yb, pz, vxs, 0.5 + Math.random() * 0.6, vzs, 1.6 + Math.random() * 1.0, 0.9, 4.4 + Math.random() * 1.8, g, g, g + 0.02, 0.4, -0.05, 1.2, yb);
        }
      } else if (!onHard && spd > 4) {
        const amt = (surf === 3 || surf === 5 ? 1.0 : 0.45) * clamp(spd / 20, 0.2, 1.4) + intens * 0.5;
        v.acc[k] += amt * 26 * dt;
        while (v.acc[k] >= 1) {
          v.acc[k] -= 1;
          const vxs = c.vx * 0.25 + (Math.random() - 0.5) * 2.4, vzs = c.vz * 0.25 + (Math.random() - 0.5) * 2.4;
          if (surf === 3 || surf === 5) {
            // big, lingering dust cloud on dirt/gravel (the classic rally rooster tail)
            const sh = 0.92 + Math.random() * 0.12;
            particles.emit(px, 0.35 + yb, pz, vxs, 0.7 + Math.random() * 0.9, vzs, 1.5 + Math.random() * 0.9, 1.1, 5.2 + Math.random() * 2.6, 0.84 * sh, 0.69 * sh, 0.48 * sh, 0.42, -0.04, 1.3, yb);
            if (Math.random() < 0.28) particles.emit(px, 0.2 + yb, pz, -c.vx * 0.04 + (Math.random() - 0.5) * 2.5, 2 + Math.random() * 2.5, -c.vz * 0.04 + (Math.random() - 0.5) * 2.5, 0.5 + Math.random() * 0.35, 0.3, 0.24, 0.32, 0.26, 0.19, 0.95, 14, 0.4, yb); // flying stones
          }
          else {
            particles.emit(px, 0.3 + yb, pz, vxs, 0.6 + Math.random() * 0.6, vzs, 0.8 + Math.random() * 0.5, 0.7, 2.6, 0.55, 0.52, 0.36, 0.34, 0.1, 1.6, yb);
            if (Math.random() < 0.5) particles.emit(px, 0.3 + yb, pz, vxs * 1.5, 2.5 + Math.random() * 2, vzs * 1.5, 0.5, 0.22, 0.14, 0.3, 0.55, 0.2, 1, 9, 0.8, yb);
          }
        }
      } else v.acc[k] = 0;
    }
    // sparks
    if (c.fxWall > 2.5) { sparks(c.wallX, c.wallZ, c.fxWall, yb); }
    if (c.fxCar > 3) { sparks(c.contactX, c.contactZ, c.fxCar * 0.7, yb); }
    c.fxWall = 0; c.fxCar = 0;
    // backfire on upshift / lift at high rpm
    if (c.shiftT > 0.1 && c.isPlayer && Math.random() < 0.5) {
      const p = wheelWorld(c, -M.len * 0.5 - 0.1, 0.35, x, z, h);
      for (let k = 0; k < 3; k++) particles.emit(p.x, 0.35 + yb, p.z, -Math.cos(h) * 3 + (Math.random() - 0.5), 0.3, -Math.sin(h) * 3 + (Math.random() - 0.5), 0.14, 0.35, 0.8, 1, 0.55 + Math.random() * 0.3, 0.1, 0.95, 0, 3, yb);
    }
  }
  function sparks(x, z, imp, y) {
    if (x == null) return;
    const n = Math.min(40, 12 + imp * 3), y0 = y || 0;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 9;
      sparkP.emit(x, 0.45 + Math.random() * 0.4 + y0, z, Math.cos(a) * sp, 2 + Math.random() * 4.5, Math.sin(a) * sp, 0.28 + Math.random() * 0.34, 0.75, 0.18, 1, 0.8 + Math.random() * 0.15, 0.32, 1, 11, 1.2, y0);
    }
    // a short bright flash at the contact point
    sparkP.emit(x, 0.6 + y0, z, 0, 0.5, 0, 0.16, 3.6, 4.6, 1, 0.82, 0.45, 0.9, 0, 0, y0);
  }

  /* ---------------- camera ---------------- */
  function updateCamera(dt, target, mode, alpha) {
    const c = target;
    const x = lerp(c.px, c.x, alpha), z = lerp(c.pz, c.z, alpha);
    const h = c.ph + wrapPi(c.h - c.ph) * alpha;
    const spd = c.speed, pitZ = crew && c === crew.P && (crew.mode === 'work' || (crew.mode === 'out' && c.pitState === 'stop')) ? 0.62 : 1;   // pitZ: closer while the car pulls into its box and the crew works on it
    if (!cam.init) { cam.lx = 0; cam.lz = 0; cam.zoom = 1; cam.hs = h; cam.gy = c.roadY || 0; cam.init = true; }
    cam.gy += ((c.roadY || 0) - cam.gy) * (1 - Math.exp(-dt * 5));
    const baseY = cam.gy;
    const k1 = 1 - Math.exp(-dt * 2.0), k2 = 1 - Math.exp(-dt * 1.4);
    let px, py, pz, tx, ty, tz;
    if (mode === 'chase') {
      // in a drift, look along the direction of travel; with the 'cs' physics further along it and a lazier swing
      // (Circuit Superstars: the view reads the drift along the travel, so a sliding car shows its angle)
      const cs = c.phys === 'cs', hv = h + clamp(c.beta || 0, -1.2, 1.2) * (cs ? 0.85 : 0.65);
      cam.hs += wrapPi(hv - cam.hs) * (1 - Math.exp(-dt * (cs ? 2.8 : 3.2)));
      cam.zoom += (pitZ * (1 + 0.25 * clamp(spd / 55, 0, 1)) - cam.zoom) * k2;
      // phone held upright: higher camera, wider lens, long view ahead, car in the lower part of the screen
      const portrait = camera.aspect < 1;
      const D = (portrait ? 46 : 30) * cam.zoom * cam.userZoom, pitch = portrait ? 0.98 : 0.9;
      const ahead = (portrait ? 13 : 8.5) * (1 - 0.8 * clamp((1 - cam.zoom) / 0.38, 0, 1)), fov = portrait ? 58 : 46;   // (in the pit box, zoomed in: look at the car and its crew)
      const fx = Math.cos(cam.hs), fz = Math.sin(cam.hs);
      tx = x + fx * ahead; tz = z + fz * ahead; ty = baseY;
      px = tx - fx * D * Math.cos(pitch); pz = tz - fz * D * Math.cos(pitch); py = baseY + D * Math.sin(pitch);
      if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); updatePointScale(); }
    } else if (mode === 'kino') {
      // 'kino': the fixed, lower and closer view of the reference racer: heading set per circuit, ~42 deg tilt, look-ahead along the travel
      const fx = Math.sin(camYaw), fz = -Math.cos(camYaw);
      const sp = Math.max(spd, 1e-3), mag = 11 * Core.sstep(1.5, 16, spd);
      cam.lx += (c.vx / sp * mag - cam.lx) * k1; cam.lz += (c.vz / sp * mag - cam.lz) * k1;
      cam.zoom += (pitZ * (1 + 0.08 * clamp(spd / 60, 0, 1)) - cam.zoom) * k2;
      const zf = cam.zoom * cam.userZoom, D = 38 * zf, pitch = 0.74, ll = Math.hypot(cam.lx, cam.lz), kL = ll > 11 * zf ? 11 * zf / ll : 1;   // as close as the reference camera: the cars about the same size on screen
      tx = x + cam.lx * kL; tz = z + cam.lz * kL; ty = baseY;
      px = tx - fx * D * Math.cos(pitch); pz = tz - fz * D * Math.cos(pitch); py = baseY + D * Math.sin(pitch);
      if (camera.fov !== 30) { camera.fov = 30; camera.updateProjectionMatrix(); updatePointScale(); }
    } else {
      // SWGP2-style (measured from gameplay): north-up view tilted ~47 deg, ~66 m wide on a phone,
      // look-ahead of ~19 m along the direction of travel that saturates already at low speed,
      // so the car sits well off-centre and most of the screen shows the road ahead.
      const sp = Math.max(spd, 1e-3), mag = 19 * Core.sstep(1.5, 16, spd);
      const Lx = c.vx / sp * mag, Lz = c.vz / sp * mag;
      cam.lx += (Lx - cam.lx) * k1; cam.lz += (Lz - cam.lz) * k1;
      cam.zoom += (pitZ * (1 + 0.1 * clamp(spd / 60, 0, 1)) - cam.zoom) * k2;
      const zf = cam.zoom * cam.userZoom;
      const D = 57 * zf, pitch = 0.82;
      tx = x + clamp(cam.lx, -20 * zf, 20 * zf); tz = z + clamp(cam.lz, -10.5 * zf, 15.5 * zf); ty = baseY;
      px = tx; py = baseY + D * Math.sin(pitch); pz = tz + D * Math.cos(pitch);
      if (camera.fov !== 30) { camera.fov = 30; camera.updateProjectionMatrix(); updatePointScale(); }
    }
    if (world && world.camFloor) { const gf = world.camFloor(px, pz) + 4; if (py < gf) py = gf; }   // mountain worlds: never under the slope behind the car
    if (cam.shake > 0) { px += (Math.random() - 0.5) * cam.shake; py += (Math.random() - 0.5) * cam.shake; pz += (Math.random() - 0.5) * cam.shake; cam.shake = Math.max(0, cam.shake - dt * 3); }
    camera.position.set(px, py, pz); camera.lookAt(tx, ty, tz); cam.vcx = tx; cam.vcz = tz; cam.vd = Math.hypot(px - tx, py - ty, pz - tz);
    { const dC = Math.hypot(px - tx, py - ty, pz - tz); scene.fog.near = dC * 1.35; scene.fog.far = dC * 5.5; }
    if (world && world.farClip) { const f = Math.min(700, scene.fog.far + 40); if (Math.abs(camera.far - f) > 6) { camera.far = f; camera.updateProjectionMatrix(); } }   // long corridor worlds: nothing past the fog is drawn
    // sun/shadow follows view center
    lastMode = mode;
    const sx = mode === 'kino' ? tx + Math.sin(camYaw) * 8 : tx, sz = mode === 'chase' ? tz : mode === 'kino' ? tz - Math.cos(camYaw) * 8 : tz - 8;
    const texel = 160 / sun.shadow.mapSize.x;
    const cx = Math.round(sx / texel) * texel, cz = Math.round(sz / texel) * texel;
    sun.target.position.set(cx, baseY, cz);
    sun.position.set(cx + sunOff[0], baseY + sunOff[1], cz + sunOff[2]);
    sun.target.updateMatrixWorld();
  }
  let sunOff = [-80, 96, 70], camYaw = 0, lastMode = 'iso';
  function shake(a) { cam.shake = Math.max(cam.shake, Math.min(1.2, a)); }
  function resetCam() { cam.init = false; }

  function frame(dt, alpha, target, mode, opt) {
    time += dt;
    updateCrew(dt);   // (first: it sets how far the player's car is up on the jacks)
    updateCars(dt, alpha, opt);
    syncDebris(); syncProps();
    for (let k = 0; k < views.length; k++) { const v = views[k], c = v.car; if ((c.repairN || 0) !== v.repairN) {   // repaired in the pits: a fresh car (and a burst of sparkle)
      const nv = makeView(c); nv.sk = v.sk; nv.acc = v.acc; disposeView(v, debrisRes()); views[k] = nv;   // (its loose panels on the track stay drawable)
      for (let n = 0; n < 12; n++) sparkP.emit(c.x + (Math.random() - 0.5) * 3, (c.y || 0) + 0.4 + Math.random() * 1.2, c.z + (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2, 1 + Math.random() * 2, (Math.random() - 0.5) * 2, 0.4 + Math.random() * 0.3, 0.45, 0.8, 1, 0.95, 0.7, 0.7, -1, 1.2, c.y || 0); } }
    particles.update(dt); sparkP.update(dt);
    World.update(world, time, target);
    if (target) updateCamera(dt, target, mode, alpha);
    World.view(world, camera, target, alpha);   // (Ouninpohja: the forest between the camera and the car fades out)
    // tunnel roof (and the hotel above it) fades out while the followed car is inside, so you can see it
    if (world && world.dyn.tunnel && target && target.q) {
      const tn = world.dyn.tunnel, sq = target.q.s, inside = sq > tn.s0 - 30 && sq < tn.s1 + 12, goal = inside ? 0.14 : 1;
      tn.mat.opacity += (goal - tn.mat.opacity) * Math.min(1, dt * 5 + 0.02);
      const tr = tn.mat.opacity < 0.985; if (tn.mat.transparent !== tr) { tn.mat.transparent = tr; tn.mat.needsUpdate = true; } tn.mat.depthWrite = !tr;
    }
    if (postOn()) {
      if (target) {   // keep the sharp band of the tilt-shift on the followed car
        _pv.set(lerp(target.px, target.x, alpha), (target.y || 0) + 0.6, lerp(target.pz, target.z, alpha)).project(camera);
        const fy = clamp(_pv.y * 0.5 + 0.5, 0.1, 0.9);
        const fc = (fy + 0.5) / 2;                              // midpoint car <-> look-ahead (screen centre)
        post.focus += (fc - post.focus) * Math.min(1, dt * 6 + 0.02);
        post.span = Math.abs(fy - 0.5) / 2;
      }
      if (post.mat.uniforms.uHaze.value > 0) {   // where the low sun is on (or just off) the screen; nothing when it is behind the camera
        camera.getWorldDirection(_sunV); const sl = Math.hypot(sunOff[0], sunOff[1], sunOff[2]), front = (_sunV.x * sunOff[0] + _sunV.y * sunOff[1] + _sunV.z * sunOff[2]) / sl;
        if (front > 0.02) { _pv.set(cam.vcx + sunOff[0] * 20, (cam.gy || 0) + sunOff[1] * 20, cam.vcz + sunOff[2] * 20).project(camera);
          const asp = camera.aspect, px = _pv.x * asp, py = _pv.y, pl = Math.hypot(px, py) || 1, far = pl > 1.15;   // the sun far off screen: put the glow just outside the edge, in its direction
          const ex = far ? px / pl * 1.15 : px, ey = far ? py / pl * 1.15 : py;
          post.mat.uniforms.uSun.value.set((ex / asp) * 0.5 + 0.5, ey * 0.5 + 0.5); }
        else post.mat.uniforms.uSun.value.set(0.5, 9); }
      const U = post.mat.uniforms; U.uFocus.value = post.focus; U.uBand.value = (lastMode === 'kino' ? 0.3 : camera.aspect < 1 ? 0.2 : 0.24) + (post.span || 0); U.uBlur.value = lastMode === 'kino' ? 0.7 : 0.8;   // kino: a soft depth of field only towards the edges, as in the reference
      renderer.setRenderTarget(post.rt); renderer.render(scene, camera);
      renderer.setRenderTarget(null); renderer.render(post.sc, post.cam);
    } else renderer.render(scene, camera);
  }

  function setStartLights(n, go) {
    if (!world || !world.dyn.lights) return;
    world.dyn.lights.forEach((m, i) => { m.material.color.setHex(go ? 0x18d84a : (i < n ? 0xff2418 : 0x2a0606)); });
  }

  /* ---------------- showroom ---------------- */
  function initShowroom() {
    showScene = new THREE.Scene();
    showScene.background = new THREE.Color(0x10151d);
    showCam = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.5, 200);
    showScene.add(new THREE.HemisphereLight(0xdfe9ff, 0x303848, 0.75));
    const key = new THREE.DirectionalLight(0xfff2dd, 0.9); key.position.set(-6, 10, 7); showScene.add(key);
    const rim = new THREE.DirectionalLight(0x7fb8ff, 0.55); rim.position.set(6, 4, -8); showScene.add(rim);
    // floor: curb-striped ring + dark disc
    const g = new GB();
    const S = 48;
    for (let i = 0; i < S; i++) {
      const a0 = i / S * Math.PI * 2, a1 = (i + 1) / S * Math.PI * 2;
      const col = [0.16, 0.18, 0.22];
      g.quadUp([0, 0, 0], [Math.cos(a0) * 4.2, 0, Math.sin(a0) * 4.2], [Math.cos(a1) * 4.2, 0, Math.sin(a1) * 4.2], [0, 0, 0], [col, col, col, col]);
      const rc = i % 2 ? [0.85, 0.16, 0.14] : [0.95, 0.95, 0.93];
      g.quadUp([Math.cos(a0) * 4.2, 0.01, Math.sin(a0) * 4.2], [Math.cos(a0) * 4.8, 0.01, Math.sin(a0) * 4.8], [Math.cos(a1) * 4.8, 0.01, Math.sin(a1) * 4.8], [Math.cos(a1) * 4.2, 0.01, Math.sin(a1) * 4.2], [rc, rc, rc, rc]);
      const oc = [0.09, 0.11, 0.14];
      g.quadUp([Math.cos(a0) * 4.8, 0, Math.sin(a0) * 4.8], [Math.cos(a0) * 40, 0, Math.sin(a0) * 40], [Math.cos(a1) * 40, 0, Math.sin(a1) * 40], [Math.cos(a1) * 4.8, 0, Math.sin(a1) * 4.8], [oc, oc, oc, oc]);
    }
    showScene.add(new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })));
  }
  function setShowCar(model, color, num) {
    if (!showScene) initShowroom();
    const prev = showCar;
    const fake = { m: model, color, num, stripe: true, isPlayer: false };
    showCar = makeCarMesh(fake, { noMarker: true });
    showCar.grp.position.set(0, 0, 0);
    showScene.add(showCar.grp);
    if (prev) { showScene.remove(prev.grp); disposeCarMesh(prev); }   // (after the new car exists: its shaders are reused, not compiled again)
  }
  function renderShowroom(dt) {
    if (!showScene) return;
    showAngle += dt * 0.35;
    if (showCar) showCar.grp.rotation.y = showAngle;
    const aspect = window.innerWidth / window.innerHeight;
    const portraitS = aspect < 1;
    const d = portraitS ? 19 : aspect < 1.2 ? 13 : 10.5;
    showCam.position.set(2.2, portraitS ? 4.4 : 3.1, d); showCam.lookAt(aspect > 1.2 ? 3.1 : 0, portraitS ? -2.6 : 0.55, 0);
    renderer.render(showScene, showCam);
  }

  // debug: render the showroom car from a fixed camera (used for visual checks)
  function debugShot(px, py, pz, tx, ty, tz, rotY, fov) {
    if (!showScene || !showCar) return;
    showCar.grp.rotation.y = rotY || 0;
    const f = showCam.fov; if (fov) { showCam.fov = fov; showCam.updateProjectionMatrix(); }
    showCam.position.set(px, py, pz); showCam.lookAt(tx, ty, tz);
    renderer.render(showScene, showCam);
    if (fov) { showCam.fov = f; showCam.updateProjectionMatrix(); }
  }
  function info() { return renderer ? renderer.info : null; }
  const dbg = { noSmoke: false };
  function setDebug(o) { Object.assign(dbg, o); }
  function fxStats() { let n = 0; for (let i = 0; i < particles.max; i++) if (particles.life[i] > 0) n++; return { alive: n, emitted: particles.cur }; }
  return { setDebug, fxStats, init, buildWorld, applySettings, resize, attachRace, frame, setStartLights, shake, resetCam, setShowCar, renderShowroom, debugShot, setDynScale, getDynScale, info, cam, get scene() { return scene; }, get camera() { return camera; }, get world() { return world; }, get skidCount() { return skids ? skids.cur : 0; }, get crew() { return crew; } };
})();

