/* =========================================================================
   RENDER — renderer, cars, particles, skids, cameras
   ========================================================================= */
const Render = (function () {
  'use strict';
  const { clamp, lerp, wrapPi, sstep } = Core;
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
  // the formula car: its shapes are formulaGeometry's; these numbers serve the shared code (the number decal, the pit crew's hubs, nose and tail)
  BODIES.formula = { len: 5.2, wid: 1.96, roofY: 0.576, spoiler: false, decalX: 1.0, hw: 0.8, nose: 2.72, tail: -2.5, secs: [
    [-2.44, 0.1, 0.28, 0.34, 0.05, 0.4, 0.01, 'b'], [2.62, 0.1, 0.18, 0.24, 0.05, 0.29, 0.01, 'b']] };
  // the new cars' bodies (their shapes: muscleGeometry, evGeometry, truckGeometry, lmGeometry). lamps: the head and tail lamps' glow points
  // ([x, y, z] of the right-hand ones), lens: the head lamp lens (h x w, or a round one of radius lensR), wz: the wheels' centres this far in
  // from the car's half width, decalY / decalRz / decalS: the number decal's height, tilt and size (on a bonnet or a nose), cage: a roll
  // cage in the cockpit, engRear: the engine behind the driver (a damaged one smokes there)
  // VIHAR V8, a 1970 fastback: a long bonnet, the roof far back, the fastback sloping down to a short ducktail
  BODIES.muscle = { len: 4.72, wid: 1.88, roofY: 1.3, spoiler: false, decalX: -0.56, wz: 0.1, lamps: [[2.42, 0.68, 0.64], [-2.4, 0.705, 0.41]], lensR: 0.078, secs: [
    [-2.36, 0.86, 0.36, 0.80, 0.80, 0.90, 0.01, 'b'], [-2.26, 0.92, 0.31, 0.83, 0.86, 0.96, 0.02, 'b'], [-1.98, 0.93, 0.29, 0.84, 0.84, 0.92, 0.02, 'gr'],
    [-1.02, 0.93, 0.29, 0.85, 0.70, 1.24, 0.03, 'r'], [-0.12, 0.93, 0.29, 0.85, 0.68, 1.30, 0.03, 'gf'], [0.62, 0.93, 0.29, 0.85, 0.83, 0.93, 0.03, 'b'],
    [1.45, 0.94, 0.29, 0.84, 0.86, 0.91, 0.03, 'b'], [2.12, 0.92, 0.31, 0.81, 0.84, 0.87, 0.02, 'b'], [2.36, 0.88, 0.35, 0.76, 0.78, 0.80, 0.01, 'b']] };
  // STRELA EV, an electric hypercar: low and wide, a glass canopy far forward, strong rear haunches, a short tail with a ducktail lip;
  // the number on the bonnet (decalY: its height there)
  BODIES.ev = { len: 4.62, wid: 2.0, roofY: 1.16, spoiler: false, decalX: 1.42, decalY: 0.772, decalRz: -0.08, decalS: 0.72, wz: 0.14, lamps: [[2.34, 0.465, 0.62], [-2.34, 0.712, 0.7]], lens: [0.03, 0.26], secs: [
    [-2.31, 0.90, 0.30, 0.64, 0.86, 0.78, 0.01, 'b'], [-2.20, 0.98, 0.26, 0.70, 0.93, 0.86, 0.02, 'b'], [-1.72, 1.00, 0.25, 0.72, 0.86, 0.84, 0.03, 'b'],
    [-1.28, 1.00, 0.25, 0.73, 0.64, 0.97, 0.03, 'gr'], [-0.30, 0.97, 0.25, 0.72, 0.58, 1.15, 0.03, 'r'], [0.34, 0.96, 0.25, 0.71, 0.58, 1.13, 0.03, 'gf'],
    [1.10, 0.97, 0.25, 0.71, 0.88, 0.77, 0.03, 'b'], [1.78, 0.97, 0.26, 0.67, 0.88, 0.715, 0.03, 'b'], [2.31, 0.88, 0.28, 0.50, 0.80, 0.55, 0.01, 'b']] };
  // SAMUM 4x4, a trophy truck: a tall cab on a long bonnet, the bed behind it (its top the bed liner, a spare tyre lying in it), high
  // off the ground on big wheels
  BODIES.truck = { len: 5.2, wid: 2.15, roofY: 1.79, spoiler: false, decalX: -0.26, wz: 0.16, lamps: [[2.64, 0.93, 0.62], [-2.63, 1.035, 0.86]], lens: [0.1, 0.24], cage: true, secs: [
    [-2.60, 0.98, 0.64, 1.10, 0.97, 1.20, 0.0, 'b'], [-2.54, 1.00, 0.62, 1.14, 0.99, 1.24, 0.0, 'b'], [-0.88, 1.00, 0.62, 1.14, 0.99, 1.24, 0.0, 'b'],
    [-0.80, 1.00, 0.62, 1.18, 0.86, 1.74, 0.02, 'r'], [0.34, 1.00, 0.62, 1.20, 0.84, 1.76, 0.03, 'gf'], [1.02, 1.01, 0.62, 1.20, 0.95, 1.30, 0.03, 'b'],
    [2.06, 1.01, 0.64, 1.16, 0.95, 1.20, 0.03, 'b'], [2.60, 0.95, 0.70, 1.04, 0.89, 1.08, 0.02, 'b']] };
  // TAIFUN LM, a Le Mans prototype: its shapes are lmGeometry's (like the formula's, hw / nose / tail for the pit crew); these sections only
  // outline it for the shared code (the body's dents, the eye in the cockpit). noLens: its lamps are in the body (a field of 13: fewer draws)
  BODIES.lm = { len: 4.95, wid: 2.0, roofY: 1.07, spoiler: false, decalX: -0.12, decalY: 1.06, decalS: 0.62, hw: 0.83, nose: 2.55, tail: -2.46, engRear: true, noLens: true,
    lamps: [[2.49, 0.3, 0.7], [-2.47, 0.615, 0.62]], lens: [0.035, 0.26], secs: [
    [-2.42, 0.94, 0.18, 0.6, 0.9, 0.7, 0.01, 'b'], [-0.45, 0.98, 0.12, 0.62, 0.48, 1.05, 0.01, 'r'], [0.8, 0.98, 0.12, 0.66, 0.47, 0.97, 0.01, 'gf'], [2.45, 0.9, 0.16, 0.3, 0.8, 0.36, 0.01, 'b']] };
  const GLASS = [0.1, 0.13, 0.19];

  // the shadow of a car's shape on its blob plane (len x 1.25, wid x 1.45): a rounded rectangle the size of the car, dark in the middle, soft at the edge
  function carShadowTex() {
    const S = 64, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), img = g.createImageData(S, S), d = img.data;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const u = Math.abs((i + 0.5) / S * 2 - 1) - 0.6, v = Math.abs((j + 0.5) / S * 2 - 1) - 0.47, r = 0.2, qx = u + r, qy = v + r;
      const sd = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r, t = clamp((sd + 0.22) / 0.46, 0, 1), o = (j * S + i) * 4;
      d[o] = d[o + 1] = d[o + 2] = 0; d[o + 3] = Math.round(255 * 0.62 * (1 - t * t * (3 - 2 * t)));
    }
    g.putImageData(img, 0, 0); return new THREE.CanvasTexture(c);
  }
  function colArr(hex) { return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255]; }
  function stripeFor(hex) {
    const c = colArr(hex); const l = c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11;
    return l > 0.6 ? [0.12, 0.24, 0.75] : [0.96, 0.96, 0.94];
  }

  function wheelInto(g, cx, cy, cz, r, wd, tire, rim) {
    const S = 12, inn = [cx, cy, cz];
    const dark = [rim[0] * 0.38, rim[1] * 0.38, rim[2] * 0.4], hub = [0.15, 0.15, 0.17], lip = rim.map(v => Math.min(1, v * 1.15));
    const p = (a, z, rr) => [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, cz + z];
    for (let i = 0; i < S; i++) {
      const a0 = i / S * Math.PI * 2, a1 = (i + 1) / S * Math.PI * 2;
      g.quadO(p(a0, -wd / 2, r), p(a0, wd / 2, r), p(a1, wd / 2, r), p(a1, -wd / 2, r), tire, inn);
      for (const sd of [-1, 1]) {
        const zf = sd * wd / 2, zr = sd * (wd / 2 + 0.006), out = [cx, cy, cz - sd];
        g.quadO(p(a0, zf, r * 0.68), p(a0, zf, r), p(a1, zf, r), p(a1, zf, r * 0.68), tire, out);          // sidewall
        g.quadO(p(a0, zr, r * 0.54), p(a0, zr, r * 0.68), p(a1, zr, r * 0.68), p(a1, zr, r * 0.54), lip, out); // rim lip (polished)
        g.triO([cx, cy, cz + zf], p(a0, zf, r * 0.54), p(a1, zf, r * 0.54), dark, out);                       // recessed dish
      }
    }
    for (const sd of [-1, 1]) {
      const zs = sd * (wd / 2 + 0.012), out = [cx, cy, cz - sd];
      for (let k = 0; k < 5; k++) for (const e of [-1, 1]) {   // spokes: five, each split in two towards the rim
        const a = k / 5 * Math.PI * 2, a1 = a + e * 0.13, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(a1), sb = Math.sin(a1), w0 = r * 0.045, w1 = r * 0.035, r0 = r * 0.12, r1 = r * 0.56;
        g.quadO([cx + ca * r0 - sa * w0, cy + sa * r0 + ca * w0, cz + zs], [cx + cb * r1 - sb * w1, cy + sb * r1 + cb * w1, cz + zs], [cx + cb * r1 + sb * w1, cy + sb * r1 - cb * w1, cz + zs], [cx + ca * r0 + sa * w0, cy + sa * r0 - ca * w0, cz + zs], rim, out);
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
  /* ---------------- formula car: open wheels, wings, halo ----------------
     x forward from the centre of mass, y up, z right; the axles at M.a / -M.b. The body mesh is the tub (chassis, cockpit, airbox), the
     sidepods, floor, diffuser, crash structure, halo, driver and suspension; the nose, both wings, the engine cover, the mirrors and the
     bargeboards are meshes of their own (fPartMeshes) that a crash knocks off (buildParts); the four wheels too (they steer and spin). */
  const FK = [0.07, 0.07, 0.08], FK2 = [0.15, 0.15, 0.17];
  const F_HUB = { fz: 0.83, rz: 0.78, fr: 0.35, rr: 0.36, fw: 0.3, rw: 0.4 };   // wheel centres (z), radii, widths
  // a shouldered cross-section at x: bottom (yb, half width wb), widest (ym, wm), top (yt, wt) flat over tf x wt: a ring of 10 points
  function fSec(x, yb, wb, ym, wm, yt, wt, tf) {
    const f = tf == null ? 0.5 : tf, r = Math.min(0.06, (yt - ym) * 0.4);
    return [[x, yb, -wb * 0.86], [x, yb + 0.025, -wb], [x, ym, -wm], [x, yt - r, -wt], [x, yt, -wt * f], [x, yt, wt * f], [x, yt - r, wt], [x, ym, wm], [x, yb + 0.025, wb], [x, yb, wb * 0.86]];
  }
  // a skin through rings of points (the same count, in x order); col(k, e): colour of edge e from ring k to k+1; capA / capB: end caps
  function fLoft(g, R, col, capA, capB) {
    const n = R[0].length;
    for (let k = 0; k < R.length - 1; k++) {
      const A = R[k], B = R[k + 1], c = [0, 0, 0];
      for (const p of A.concat(B)) { c[0] += p[0] / (2 * n); c[1] += p[1] / (2 * n); c[2] += p[2] / (2 * n); }
      for (let e = 0; e < n; e++) { const e1 = (e + 1) % n; g.quadO(A[e], B[e], B[e1], A[e1], col(k, e), c); }
    }
    for (const [ring, cc, nb] of [[R[0], capA, R[1]], [R[R.length - 1], capB, R[R.length - 2]]]) {
      if (!cc) continue;
      const m = [0, 0, 0]; for (const p of ring) { m[0] += p[0] / n; m[1] += p[1] / n; m[2] += p[2] / n; }
      const inn = [m[0] + (nb[0][0] - ring[0][0]) * 0.5, m[1], m[2]];   // (toward the next ring: inside)
      for (let e = 0; e < n; e++) g.triO(m, ring[e], ring[(e + 1) % n], cc, inn);
    }
  }
  // a thin square bar from a to b (w: its side): suspension arms, the halo
  function fRod(g, a, b, w, col) {
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]) || 1, u = [d[0] / L, d[1] / L, d[2] / L];
    const s = Math.abs(u[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let p = [s[1] * u[2] - s[2] * u[1], s[2] * u[0] - s[0] * u[2], s[0] * u[1] - s[1] * u[0]]; const pl = Math.hypot(p[0], p[1], p[2]) || 1; p = [p[0] / pl, p[1] / pl, p[2] / pl];
    const q = [u[1] * p[2] - u[2] * p[1], u[2] * p[0] - u[0] * p[2], u[0] * p[1] - u[1] * p[0]], h = w / 2, m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    const C = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([i, j]) => [(p[0] * i + q[0] * j) * h, (p[1] * i + q[1] * j) * h, (p[2] * i + q[2] * j) * h]);
    for (let i = 0; i < 4; i++) { const o0 = C[i], o1 = C[(i + 1) % 4];
      g.quadO([a[0] + o0[0], a[1] + o0[1], a[2] + o0[2]], [b[0] + o0[0], b[1] + o0[1], b[2] + o0[2]], [b[0] + o1[0], b[1] + o1[1], b[2] + o1[2]], [a[0] + o1[0], a[1] + o1[1], a[2] + o1[2]], col, m); }
  }
  // a thin plank from the leading edge (x0, y0) to the trailing edge (x1, y1), th thick, over z0..z1: wing elements
  function fSlab(g, x0, y0, x1, y1, th, z0, z1, col) {
    const P = (x, y, z) => [x, y, z], a0 = P(x0, y0, z0), b0 = P(x1, y1, z0), c0 = P(x1, y1 + th, z0), d0 = P(x0, y0 + th, z0), a1 = P(x0, y0, z1), b1 = P(x1, y1, z1), c1 = P(x1, y1 + th, z1), d1 = P(x0, y0 + th, z1);
    const inn = [(x0 + x1) / 2, (y0 + y1 + th) / 2, (z0 + z1) / 2];
    g.quadO(d0, c0, c1, d1, col, inn); g.quadO(a0, b0, b1, a1, col, inn); g.quadO(a0, d0, d1, a1, col, inn); g.quadO(b0, c0, c1, b1, col, inn);
    g.quadO(a0, b0, c0, d0, col, inn); g.quadO(a1, b1, c1, d1, col, inn);
  }
  // a flat plate in the x-y plane (a convex outline), th thick around z: endplates, the shark fin
  function fPlate(g, pts, z, th, col) {
    const n = pts.length, A = pts.map(p => [p[0], p[1], z - th / 2]), B = pts.map(p => [p[0], p[1], z + th / 2]);
    const c = [pts.reduce((s, p) => s + p[0], 0) / n, pts.reduce((s, p) => s + p[1], 0) / n, z];
    for (let i = 1; i < n - 1; i++) { g.triO(A[0], A[i], A[i + 1], col, [c[0], c[1], z + 1]); g.triO(B[0], B[i], B[i + 1], col, [c[0], c[1], z - 1]); }
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; g.quadO(A[i], A[j], B[j], B[i], col, c); }
  }
  // the driver's helmet: white, a band in the car's colour over the top, a gold visor
  function fHelmet(g, cx, cy, cz, r, col, band) {
    const NA = 8, NB = 5, V = [0.26, 0.17, 0.06];
    const P = (i, j) => { const th = j / NB * Math.PI, ph = i / NA * Math.PI * 2; return [cx + r * Math.sin(th) * Math.cos(ph), cy + r * Math.cos(th), cz + r * Math.sin(th) * Math.sin(ph)]; };
    for (let j = 0; j < NB; j++) for (let i = 0; i < NA; i++) {
      const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1), mx = (a[0] + c[0]) / 2 - cx, my = (a[1] + c[1]) / 2 - cy, mz = (a[2] + c[2]) / 2 - cz;
      const visor = mx > r * 0.3 && my > -r * 0.3 && my < r * 0.42, top = !visor && Math.abs(mz) < r * 0.34 && my > -r * 0.2;
      g.quadO(a, b, c, d, visor ? V : top ? band : col, [cx, cy, cz]);
    }
  }
  function formulaGeometry(M, color) {
    const g = new GB(), P = colArr(color), S = stripeFor(color), K = FK, K2 = FK2, fx = M.a, rx = -M.b;
    // ---- the tub: chassis, the cockpit (a black opening inside a painted rim), headrest, the airbox and its intake over the driver ----
    fLoft(g, [fSec(1.72, 0.2, 0.17, 0.37, 0.21, 0.55, 0.17), fSec(1.2, 0.15, 0.21, 0.38, 0.25, 0.575, 0.21, 0.75), fSec(0.8, 0.1, 0.26, 0.38, 0.29, 0.6, 0.23, 0.75),
      fSec(0.42, 0.09, 0.3, 0.38, 0.33, 0.63, 0.27, 0.8), fSec(-0.1, 0.09, 0.32, 0.4, 0.36, 0.62, 0.3, 0.8), fSec(-0.44, 0.09, 0.33, 0.42, 0.36, 0.66, 0.27, 0.8),
      fSec(-0.62, 0.09, 0.33, 0.5, 0.3, 0.93, 0.14), fSec(-0.86, 0.09, 0.32, 0.52, 0.27, 0.91, 0.12)],
    (k, e) => e === 9 ? K : e === 0 || e === 8 ? K2 : e === 4 && k >= 3 && k <= 5 ? K : P, K2, K2);
    // ---- sidepods: a black inlet, sloping down to the floor at the back; a band in the second colour on the shoulder ----
    const pod = (x, zo, yt, sd) => [[x, 0.1, sd * 0.25], [x, 0.1, sd * (zo - 0.05)], [x, 0.16, sd * zo], [x, yt - 0.08, sd * zo], [x, yt, sd * (zo - 0.12)], [x, yt, sd * 0.25]];
    for (const sd of [-1, 1]) fLoft(g, [pod(0.62, 0.64, 0.5, sd), pod(0.4, 0.71, 0.53, sd), pod(-0.2, 0.71, 0.5, sd), pod(-0.75, 0.62, 0.41, sd), pod(-1.32, 0.44, 0.24, sd)],
      (k, e) => e === 0 ? K : e === 1 ? K2 : e === 3 ? S : P, K, K);
    // ---- floor: a carbon plate between the wheels; the diffuser sweeping up behind the rear axle, with fences ----
    const FL = [[1.1, 0.3], [0.7, 0.6], [0.3, 0.74], [-1.15, 0.74], [-1.48, 0.62], [-1.75, 0.54]], y0 = 0.045, y1 = 0.085;
    for (let k = 0; k < FL.length - 1; k++) {
      const [xa, wa] = FL[k], [xb, wb] = FL[k + 1], xm = (xa + xb) / 2;
      g.quadO([xa, y1, -wa], [xb, y1, -wb], [xb, y1, wb], [xa, y1, wa], K, [xm, 0, 0]); g.quadO([xa, y0, -wa], [xb, y0, -wb], [xb, y0, wb], [xa, y0, wa], K, [xm, 1, 0]);
      for (const sd of [-1, 1]) g.quadO([xa, y0, sd * wa], [xb, y0, sd * wb], [xb, y1, sd * wb], [xa, y1, sd * wa], K2, [xm, 0.065, 0]);
    }
    g.quadO([1.1, y0, -0.3], [1.1, y1, -0.3], [1.1, y1, 0.3], [1.1, y0, 0.3], K2, [0, 0.065, 0]);
    { const xa = -1.75, xb = -2.36, wa = 0.54, wb = 0.5, ya = y1, yb = 0.34;
      for (const up of [1, -1]) g.quadO([xa, ya, -wa], [xb, yb, -wb], [xb, yb, wb], [xa, ya, wa], K, [xa - 0.3 * up, up > 0 ? -1 : 2, 0]);   // the ramp (both faces)
      for (const z of [-wb, -0.24, 0.24, wb]) for (const sd of [-1, 1]) g.quadO([xa, ya - 0.035, z], [xb, yb, z], [xb, 0.06, z], [xa, y0, z], K2, [xa, 0.1, z - sd]); }   // fences
    // ---- gearbox and crash structure behind the engine cover (the rain light at its tip: the tail mesh), beam wing, the rear wing's pylon, exhaust ----
    fLoft(g, [fSec(-2.05, 0.2, 0.14, 0.4, 0.13, 0.52, 0.08), fSec(-2.28, 0.25, 0.09, 0.36, 0.09, 0.46, 0.06), fSec(-2.44, 0.28, 0.05, 0.34, 0.055, 0.4, 0.04)], (k, e) => e >= 3 && e <= 5 ? P : K, K2, K);
    World.box(g, -2.31, 0.44, 0, 0.2, 0.035, 0.92, 0, K);
    World.box(g, -2.3, 0.44, 0, 0.14, 0.45, 0.03, 0, K);
    World.box(g, -2.22, 0.5, 0, 0.18, 0.06, 0.07, 0, [0.52, 0.5, 0.47]);
    // ---- halo: a titanium hoop over the cockpit on a pillar in front of the driver ----
    const H = [[-0.44, 0.645, -0.27], [-0.28, 0.79, -0.285], [-0.02, 0.855, -0.25], [0.18, 0.875, -0.15], [0.28, 0.88, 0], [0.18, 0.875, 0.15], [-0.02, 0.855, 0.25], [-0.28, 0.79, 0.285], [-0.44, 0.645, 0.27]];
    for (let k = 0; k < H.length - 1; k++) fRod(g, H[k], H[k + 1], 0.05, K);
    fRod(g, [0.28, 0.88, 0], [0.46, 0.625, 0], 0.05, K);
    // ---- the driver's helmet, the T-cam (yellow) on the airbox ----
    fHelmet(g, -0.16, 0.755, 0, 0.135, [0.95, 0.95, 0.93], P);
    World.box(g, -0.7, 0.925, 0, 0.13, 0.05, 0.11, 0, [0.96, 0.78, 0.08]);
    // ---- suspension: wishbones, push rods and track rods at the front, drive shafts at the back ----
    for (const sd of [-1, 1]) {
      const hf = sd * (F_HUB.fz - F_HUB.fw / 2 - 0.02), hr = sd * (F_HUB.rz - F_HUB.rw / 2 - 0.02);
      fRod(g, [fx + 0.24, 0.47, sd * 0.19], [fx, 0.5, hf], 0.028, K); fRod(g, [fx - 0.26, 0.47, sd * 0.21], [fx, 0.5, hf], 0.028, K);
      fRod(g, [fx + 0.28, 0.2, sd * 0.15], [fx, 0.2, hf], 0.028, K); fRod(g, [fx - 0.3, 0.2, sd * 0.2], [fx, 0.2, hf], 0.028, K);
      fRod(g, [fx - 0.02, 0.22, hf - sd * 0.03], [fx - 0.08, 0.5, sd * 0.2], 0.026, K);
      fRod(g, [fx + 0.12, 0.32, sd * 0.17], [fx + 0.1, 0.33, hf], 0.022, K);
      fRod(g, [rx + 0.28, 0.48, sd * 0.2], [rx, 0.52, hr], 0.028, K); fRod(g, [rx - 0.22, 0.48, sd * 0.14], [rx, 0.52, hr], 0.028, K);
      fRod(g, [rx + 0.32, 0.18, sd * 0.24], [rx, 0.17, hr], 0.028, K); fRod(g, [rx - 0.26, 0.18, sd * 0.2], [rx, 0.17, hr], 0.028, K);
      fRod(g, [rx, 0.36, sd * 0.14], [rx, 0.36, hr], 0.05, [0.3, 0.3, 0.32]);
    }
    return g.geometry();
  }
  // the parts (each centred on its own origin, so a loose one tumbles about its middle; .parameters tells the debris how to lie)
  function fPartGeo(g, cx, cy, w, h, d) { const geo = g.geometry(); geo.translate(-cx, -cy, 0); geo.parameters = { width: w, height: h, depth: d }; return geo; }
  function fNoseGeo(P, S) {   // the nose cone, from the front bulkhead to the tip (the tip in the second colour)
    const g = new GB();
    fLoft(g, [fSec(1.72, 0.2, 0.172, 0.37, 0.212, 0.552, 0.172), fSec(2.1, 0.205, 0.11, 0.31, 0.14, 0.43, 0.11), fSec(2.4, 0.19, 0.08, 0.27, 0.1, 0.36, 0.075), fSec(2.62, 0.18, 0.05, 0.235, 0.06, 0.29, 0.045)],
      (k, e) => e === 9 ? FK : k === 2 ? S : P, FK2, S);
    return fPartGeo(g, 2.17, 0.35, 0.9, 0.12, 0.42);
  }
  function fWingFGeo(P, S) {   // front wing: carbon main plane, two painted flaps outboard of the nose, endplates
    const g = new GB(), K = FK;
    fSlab(g, 0.26, -0.02, -0.14, 0.02, 0.022, -0.9, 0.9, K);
    for (const sd of [-1, 1]) {
      const z0 = sd * 0.22, z1 = sd * 0.9;
      fSlab(g, -0.02, 0.05, -0.21, 0.115, 0.018, Math.min(z0, z1), Math.max(z0, z1), P);
      fSlab(g, -0.15, 0.125, -0.29, 0.19, 0.016, Math.min(sd * 0.3, z1), Math.max(sd * 0.3, z1), S);
      fPlate(g, [[0.27, -0.03], [-0.31, -0.03], [-0.31, 0.23], [-0.05, 0.2], [0.2, 0.08]], sd * 0.915, 0.02, P);
    }
    return fPartGeo(g, 0, 0, 0.58, 0.1, 1.85);
  }
  function fWingRGeo(P) {   // rear wing: the main plane between two endplates (the DRS flap is its own mesh: fFlapGeo)
    const g = new GB();
    fSlab(g, 0.14, -0.035, -0.12, 0.03, 0.032, -0.49, 0.49, P);
    for (const sd of [-1, 1]) fPlate(g, [[0.18, -0.1], [0.1, -0.42], [-0.26, -0.42], [-0.26, 0.16], [0.14, 0.1]], sd * 0.5, 0.022, P);
    return fPartGeo(g, 0, 0, 0.45, 0.12, 1.02);
  }
  function fFlapGeo(S) {   // the DRS flap, about its trailing edge (its pivot): the leading edge ahead and below
    const g = new GB(); fSlab(g, 0.165, -0.1, 0, 0, 0.018, -0.485, 0.485, S); return g.geometry();
  }
  function fCoverGeo(P, S) {   // the engine cover behind the airbox, down to the gearbox; the shark fin on top
    const g = new GB();
    fLoft(g, [fSec(-0.86, 0.088, 0.322, 0.52, 0.272, 0.912, 0.122), fSec(-1.3, 0.1, 0.28, 0.5, 0.22, 0.78, 0.1), fSec(-1.75, 0.12, 0.2, 0.45, 0.16, 0.63, 0.08), fSec(-2.05, 0.2, 0.142, 0.4, 0.132, 0.522, 0.082)],
      (k, e) => e === 9 ? FK : P, null, null);
    fPlate(g, [[-0.9, 0.9], [-1.95, 0.58], [-1.95, 0.7], [-1.02, 0.99]], 0, 0.016, S);
    return fPartGeo(g, -1.45, 0.5, 1.2, 0.3, 0.64);
  }
  function fEngineGeo() {   // under the engine cover: the power unit (grey), the plenum, turbo and the exhaust pipe
    const g = new GB();
    World.box(g, 0, -0.2, 0, 0.9, 0.3, 0.36, 0, [0.4, 0.41, 0.43]);
    World.box(g, 0.2, 0.1, 0, 0.36, 0.12, 0.2, 0, [0.16, 0.16, 0.18]);
    World.box(g, -0.42, 0.02, 0, 0.3, 0.14, 0.18, 0, [0.62, 0.5, 0.36]);
    fRod(g, [-0.3, 0.1, 0], [-0.78, 0.04, 0], 0.07, [0.62, 0.6, 0.56]);
    const geo = g.geometry(); geo.translate(0, 0.012, 0); return geo;
  }
  // formula wheel (axle along z): a slick with the compound band on the sidewall (red soft, yellow medium, white hard (Core.TYRE_CMP), green
  // on the rain tyres), a dark rim, a flat aero cover with two lighter spokes (so the spin shows) and a gold nut (12 sides: ~200 triangles,
  // a phone draws 52 of them)
  const fWheelCache = new Map(), F_WET = 0x1fa83d, F_SOFT = 0xe02119;
  const tyreCol = (c) => c.ty ? (c.ty.k === 'wet' ? F_WET : c.ty.c ? Core.TYRE_CMP[c.ty.c].col : F_SOFT) : c.wet < 0.9 ? F_WET : F_SOFT;   // (no tyres in the race: wets in the rain, else softs)
  function fWheelGeo(r, wd, col) {
    const key = r + '|' + wd + '|' + col; if (fWheelCache.has(key)) return fWheelCache.get(key);
    const g = new GB(), S = 12, T = [0.075, 0.075, 0.08], B = colArr(col), RIM = [0.22, 0.22, 0.24], CV = [0.13, 0.13, 0.14], CV2 = [0.34, 0.34, 0.36], NUT = [0.86, 0.72, 0.12];
    const h = wd / 2, p = (a, z, rr) => [Math.cos(a) * rr, Math.sin(a) * rr, z];
    for (let i = 0; i < S; i++) {
      const a0 = i / S * Math.PI * 2, a1 = (i + 1) / S * Math.PI * 2;
      g.quadO(p(a0, -h, r), p(a0, h, r), p(a1, h, r), p(a1, -h, r), T, [0, 0, 0]);
      for (const sd of [-1, 1]) {
        const out = [0, 0, -sd * 5], z = sd * h, ring = (r0, r1, col) => g.quadO(p(a0, z, r0), p(a0, z, r1), p(a1, z, r1), p(a1, z, r0), col, out);
        ring(r, r * 0.84, T); ring(r * 0.84, r * 0.77, B); ring(r * 0.77, r * 0.68, RIM);
        g.triO([0, 0, sd * (h - 0.02)], p(a0, sd * (h - 0.012), r * 0.68), p(a1, sd * (h - 0.012), r * 0.68), i % 6 === 0 ? CV2 : CV, out);
      }
    }
    for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) { const a0 = i / 6 * Math.PI * 2, a1 = (i + 1) / 6 * Math.PI * 2; g.triO([0, 0, sd * (h - 0.004)], p(a0, sd * (h - 0.016), 0.05), p(a1, sd * (h - 0.016), 0.05), NUT, [0, 0, -sd * 5]); }
    const geo = g.geometry(); fWheelCache.set(key, geo); return geo;
  }

  /* ---------------- the new cars: VIHAR V8 (a muscle car), STRELA EV (electric) and SAMUM 4x4 (a trophy truck) are section lofts like the
     stock bodies, painted panel by panel and dressed with their own details; the TAIFUN LM prototype is built of parts like the formula ---------------- */
  // a section's ring (as the stock bodies: the bottom tuck, the side up to the belt, the top's edge, the crown) and the loft through the
  // sections: col(k, e, kind) is the colour of panel e (0 the bottom tuck, 1 the side, 2 the upper side, 3 the top's edge, 4 the crown,
  // 5-8 the other side) between sections k and k + 1; capA / capB colour the tail and the nose
  const secRing = (s) => [[s.x, s.yb, s.w * 0.93], [s.x, s.yb + 0.14, s.w], [s.x, s.ybelt, s.w], [s.x, s.yt, s.wt], [s.x, s.yt + s.cr, s.wt * 0.38], [s.x, s.yt + s.cr, -s.wt * 0.38], [s.x, s.yt, -s.wt], [s.x, s.ybelt, -s.w], [s.x, s.yb + 0.14, -s.w], [s.x, s.yb, -s.w * 0.93]];
  const secsOf = (def, M) => { const sx = M.len / def.len, sz = M.wid / def.wid; return def.secs.map(q => ({ x: q[0] * sx, w: q[1] * sz, yb: q[2], ybelt: q[3], wt: q[4] * sz, yt: q[5], cr: q[6], k: q[7] })); };
  function shellInto(g, secs, col, capA, capB) {
    for (let k = 0; k < secs.length - 1; k++) {
      const A = secRing(secs[k]), B = secRing(secs[k + 1]), inside = [(secs[k].x + secs[k + 1].x) / 2, (secs[k].yb + Math.min(secs[k].yt, secs[k + 1].yt)) * 0.5, 0];
      for (let e = 0; e < 9; e++) g.quadO(A[e], B[e], B[e + 1], A[e + 1], col(k, e, secs[k].k), inside);
    }
    for (const [si, dir, cc] of [[0, -1, capA], [secs.length - 1, 1, capB]]) {
      const s = secs[si], rg = secRing(s), cen = [s.x, (s.yb + s.yt) / 2, 0], inn = [s.x - dir * 0.4, cen[1], 0];
      for (let e = 0; e < rg.length; e++) g.triO(cen, rg[e], rg[(e + 1) % rg.length], cc, inn);
    }
  }
  // decals laid on a section loft, cut at every section so they follow its kinks: side(poly in x, y) on the flat side below the belt,
  // top(poly in x, z) on the top at the shell's own height there, band(poly in x, u) on the sloped band from the belt (u 0) to the top's
  // edge (u 1): the side glass, its pillars. sides: [-1, 1] (both, the default) or one of them; lift: how far off the paint
  function decalKit(g, secs) {
    const X = secs.map(q => q.x), last = secs.length - 1;
    const at = (x) => { for (let k = 0; k < last; k++) if (x <= X[k + 1] + 1e-6) return [k, clamp((x - X[k]) / (X[k + 1] - X[k]), 0, 1)]; return [last - 1, 1]; };
    const prop = (x, key) => { const [k, t] = at(x); return lerp(secs[k][key], secs[k + 1][key], t); };
    const topY = (x, z) => { const wt = prop(x, 'wt'); return prop(x, 'yt') + prop(x, 'cr') * clamp((wt - Math.abs(z)) / (wt * 0.62), 0, 1); };   // (the crown, sloping to the edge)
    const clipX = (poly, xa, xb) => {
      const clip = (P, keep, V) => { const out = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], ia = keep(a[0]), ib = keep(b[0]); if (ia) out.push(a); if (ia !== ib) { const t = (V - a[0]) / (b[0] - a[0]); out.push([V, a[1] + (b[1] - a[1]) * t]); } } return out; };
      return clip(clip(poly, x => x >= xa, xa), x => x <= xb, xb);
    };
    const lay = (poly, toP, col, inside) => { for (let k = 0; k < last; k++) { const pc = clipX(poly, X[k], X[k + 1]); if (pc.length < 3) continue; const P = pc.map(toP); for (let i = 1; i < P.length - 1; i++) g.triO(P[0], P[i], P[i + 1], col, inside(P[0])); } };
    return {
      prop, topY,
      side(poly, col, sides, lift) { for (const sd of sides || [-1, 1]) lay(poly, p => [p[0], p[1], sd * (prop(p[0], 'w') + (lift || 0.012))], col, (p) => [p[0], p[1], 0]); },
      top(poly, col, lift) { lay(poly, p => [p[0], topY(p[0], p[1]) + (lift || 0.012), p[1]], col, (p) => [p[0], p[1] - 1, p[2]]); },
      band(poly, col, sides, lift) { for (const sd of sides || [-1, 1]) lay(poly, p => { const u = p[1]; return [p[0], lerp(prop(p[0], 'ybelt'), prop(p[0], 'yt'), u), sd * (lerp(prop(p[0], 'w'), prop(p[0], 'wt'), u) + (lift || 0.012))]; }, col, (p) => [p[0], p[1] - 0.2, 0]); },
    };
  }
  // a flat round disc facing forward (dir 1) or back (dir -1): lamps, exhaust tips
  function discX(g, cx, cy, cz, r, n, col, dir) {
    for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2; g.triO([cx, cy, cz], [cx, cy + Math.cos(a0) * r, cz + Math.sin(a0) * r], [cx, cy + Math.cos(a1) * r, cz + Math.sin(a1) * r], col, [cx - dir, cy, cz]); }
  }
  // a round tube along x from x0 to x1 (n sides), closed at x1: exhaust tips, the truck's bars
  function tubeX(g, x0, x1, cy, cz, r, n, col, capCol) {
    for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, P = (x, a) => [x, cy + Math.cos(a) * r, cz + Math.sin(a) * r];
      g.quadO(P(x0, a0), P(x1, a0), P(x1, a1), P(x0, a1), col, [(x0 + x1) / 2, cy, cz]); }
    if (capCol) discX(g, x1, cy, cz, r, n, capCol, Math.sign(x1 - x0) || 1);
  }

  // ---- VIHAR V8: a 1970 fastback. A long bonnet with a scoop, the fastback's louvred rear window, a ducktail; twin racing stripes from the
  // nose to the tail (black on light paint, white on dark), round lamps in a black grille, three-part tail lamps (the tail mesh), chrome
  // bumpers (the bumper parts, chrome: model.chrome), twin exhausts under the rear one; chrome five-spoke wheels, wider at the back
  function muscleGeometry(M, color, stripe) {
    const def = BODIES.muscle, secs = secsOf(def, M), g = new GB(), D = decalKit(g, secs);
    const P = colArr(color), L = P[0] * 0.3 + P[1] * 0.59 + P[2] * 0.11, S = L > 0.55 ? [0.07, 0.07, 0.08] : [0.95, 0.95, 0.93];   // the stripes
    const K = [0.06, 0.06, 0.07], CH = [0.82, 0.83, 0.86], skirt = P.map(v => v * 0.55), front = secs[secs.length - 1], rear = secs[0];
    shellInto(g, secs, (k, e, kind) => e === 0 || e === 8 ? skirt : (kind === 'gf' && e >= 3 && e <= 5) || ((kind === 'gf' || kind === 'r') && (e === 2 || e === 6)) ? GLASS : P, P, P);
    // the side glass: the door window ends at the B-pillar, the small quarter window tapers into the wide C-pillar
    D.band([[-0.52, 0], [-0.38, 0], [-0.38, 1], [-0.52, 1]], P, null, 0.014);                   // B-pillar
    D.band([[-1.04, 0], [-0.9, 0], [-0.98, 0.72], [-1.04, 1]], P, null, 0.014);                 // the quarter window's back edge
    D.band([[0.46, 0], [0.64, 0], [0.64, 1], [0.34, 1]], P, null, 0.014);                       // A-pillar
    // the fastback's rear window, black louvres over it; the stripes over the bonnet, the roof and the ducktail
    D.top([[-1.9, -0.5], [-1.9, 0.5], [-1.08, 0.56], [-1.08, -0.56]], GLASS, 0.008);
    for (let i = 0; i < 6; i++) { const x = -1.84 + i * 0.13; D.top([[x, -0.5], [x, 0.5], [x + 0.055, 0.5], [x + 0.055, -0.5]], K, 0.02); }
    if (stripe) for (const sd of [-1, 1]) for (const [xa, xb] of [[0.66, 2.35], [-1.0, -0.16], [-2.34, -1.96]]) D.top([[xa, sd * 0.07], [xb, sd * 0.07], [xb, sd * 0.25], [xa, sd * 0.25]], S, 0.012);
    // the sill: a black rocker panel; a black scoop in front of the rear wheel; the V8 badge on the front wing
    D.side([[-1.25, 0.43], [1.2, 0.43], [1.2, 0.5], [-1.25, 0.5]], K);
    D.side([[-1.18, 0.56], [-0.86, 0.56], [-0.86, 0.72], [-1.12, 0.72]], K, null, 0.016);
    D.side([[1.62, 0.66], [1.86, 0.66], [1.86, 0.72], [1.62, 0.72]], CH, null, 0.016);
    // the bonnet scoop: a raised box with a black mouth
    { const x = 1.28, y = D.topY(x, 0) - 0.01; World.box(g, x, y, 0, 0.62, 0.085, 0.44, 0, P); World.box(g, x + 0.315, y + 0.012, 0, 0.012, 0.06, 0.38, 0, K); }
    // the grille: black between the lamps; round headlamps in chrome rings (a big one outside, a small one inside)
    const gx = front.x + 0.012, gy = 0.68;
    World.box(g, gx - 0.03, gy - 0.1, 0, 0.06, 0.2, front.w * 1.7, 0, K);
    for (const sd of [-1, 1]) {
      discX(g, gx + 0.012, gy, sd * 0.64, 0.095, 12, CH, 1); discX(g, gx + 0.02, gy, sd * 0.64, 0.077, 12, [1, 0.97, 0.84], 1);
      discX(g, gx + 0.012, gy - 0.01, sd * 0.4, 0.065, 10, CH, 1); discX(g, gx + 0.02, gy - 0.01, sd * 0.4, 0.05, 10, [1, 0.95, 0.8], 1);
    }
    // the tail: a black panel round the lamps (the lamps are the tail mesh), the chrome fuel cap in the middle; twin exhausts under the bumper
    World.box(g, rear.x - 0.01, 0.62, 0, 0.04, 0.17, rear.w * 1.66, 0, K);
    discX(g, rear.x - 0.035, 0.7, 0, 0.06, 10, CH, -1);
    for (const sd of [-1, 1]) for (const z of [0.5, 0.62]) tubeX(g, rear.x + 0.25, rear.x - 0.07, 0.31, sd * z, 0.042, 8, CH, [0.04, 0.04, 0.045]);
    const r = M.rw, rx = -M.b * (M.len / 4.4) * 0.98;
    for (const sd of [-1, 1]) muscleWheelInto(g, rx, r, sd * (M.wid * 0.5 - 0.13), r, 0.3);   // (the rear wheels in the body; the fronts are meshes of their own)
    return g.geometry();
  }
  function muscleWheelInto(g, cx, cy, cz, r, wd) { wheelInto(g, cx, cy, cz, r, wd, [0.07, 0.07, 0.08], [0.8, 0.81, 0.84]); }

  // ---- STRELA EV: an electric hypercar. A glass canopy with black roof rails and painted pillars, the lower body in carbon with a cyan
  // line along the sills, air intakes behind the doors, vents in the bonnet; a light bar across the nose and the tail (the tail mesh), a
  // splitter and a diffuser; aero wheels with cyan blades
  const EV_CYAN = [0.12, 0.78, 0.95];
  function evGeometry(M, color) {
    const def = BODIES.ev, secs = secsOf(def, M), g = new GB(), D = decalKit(g, secs);
    const P = colArr(color), K = [0.05, 0.05, 0.06], CF = [0.1, 0.1, 0.11], W = [0.95, 0.97, 1.0], front = secs[secs.length - 1], rear = secs[0];
    shellInto(g, secs, (k, e, kind) => e === 0 || e === 8 ? CF : kind !== 'b' && e >= 2 && e <= 6 ? GLASS : P, P, P);
    // the canopy: black rails along its top edges, painted A-pillars at the windscreen, a black blade behind the side glass
    const cx = secs.filter(q => q.x >= -1.28 && q.x <= 1.1).map(q => q.x);
    for (const sd of [-1, 1]) { const edge = cx.map(x => [x, sd * D.prop(x, 'wt')]), inner = cx.map(x => [x, sd * (D.prop(x, 'wt') - 0.07)]).reverse(); D.top(edge.concat(inner), K, 0.006); }
    D.band([[0.92, 0], [1.1, 0], [1.1, 1], [0.8, 1]], P, null, 0.012);
    D.band([[-1.28, 0], [-1.02, 0], [-1.16, 1], [-1.28, 1]], K, null, 0.012);
    // carbon sills with the cyan line over them, the intakes behind the doors; vents in the bonnet; a black lip on the ducktail
    D.side([[-1.6, 0.39], [1.72, 0.39], [1.72, 0.45], [-1.6, 0.45]], CF);
    D.side([[-1.6, 0.45], [1.72, 0.45], [1.72, 0.47], [-1.6, 0.47]], EV_CYAN, null, 0.014);
    D.side([[-1.3, 0.5], [-0.98, 0.5], [-1.04, 0.66], [-1.3, 0.68]], K, null, 0.014);
    for (const sd of [-1, 1]) D.top([[1.9, sd * 0.16], [2.14, sd * 0.2], [2.14, sd * 0.46], [1.9, sd * 0.44]], K, 0.01);
    D.top([[-2.23, -0.88], [-2.16, -0.88], [-2.16, 0.88], [-2.23, 0.88]], K, 0.012);
    // the nose: a light bar right across, the lamp clusters at the corners, a black intake under it, the splitter
    World.box(g, front.x - 0.02, 0.492, 0, 0.05, 0.026, front.w * 1.72, 0, W);
    for (const sd of [-1, 1]) World.box(g, front.x + 0.004, 0.43, sd * 0.62, 0.03, 0.058, 0.3, 0, K);
    World.box(g, front.x - 0.02, 0.29, 0, 0.05, 0.12, 1.24, 0, K);
    World.box(g, front.x - 0.1, 0.21, 0, 0.24, 0.03, front.w * 2.0, 0, CF);
    // the tail: black under the light bar (the tail mesh), the diffuser with its fins
    World.box(g, rear.x - 0.01, 0.62, 0, 0.03, 0.14, rear.w * 1.84, 0, K);
    World.box(g, rear.x + 0.14, 0.19, 0, 0.34, 0.1, 1.5, 0, CF);
    for (let i = -2; i <= 2; i++) World.box(g, rear.x + 0.12, 0.13, i * 0.3, 0.3, 0.2, 0.025, 0, K);
    const r = M.rw, rx = -M.b * (M.len / 4.4) * 0.98;
    for (const sd of [-1, 1]) aeroWheelInto(g, rx, r, sd * (M.wid * 0.5 - 0.13), r, 0.3);
    return g.geometry();
  }
  // the electric car's wheel: a low tyre, a silver rim lip, a dark aero disc with five swept cyan blades (the spin shows), a centre lock
  function aeroWheelInto(g, cx, cy, cz, r, wd) {
    const S = 14, T = [0.07, 0.07, 0.08], LIP = [0.66, 0.67, 0.7], DK = [0.15, 0.16, 0.18], h = wd / 2;
    const p = (a, z, rr) => [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, cz + z];
    for (let i = 0; i < S; i++) {
      const a0 = i / S * Math.PI * 2, a1 = (i + 1) / S * Math.PI * 2;
      g.quadO(p(a0, -h, r), p(a0, h, r), p(a1, h, r), p(a1, -h, r), T, [cx, cy, cz]);
      for (const sd of [-1, 1]) {
        const z = sd * h, out = [cx, cy, cz - sd * 5];
        g.quadO(p(a0, z, r), p(a0, z, r * 0.8), p(a1, z, r * 0.8), p(a1, z, r), T, out);
        g.quadO(p(a0, z + sd * 0.004, r * 0.8), p(a0, z + sd * 0.004, r * 0.73), p(a1, z + sd * 0.004, r * 0.73), p(a1, z + sd * 0.004, r * 0.8), LIP, out);
        g.triO([cx, cy, cz + z + sd * 0.006], p(a0, z + sd * 0.006, r * 0.73), p(a1, z + sd * 0.006, r * 0.73), DK, out);
      }
    }
    for (const sd of [-1, 1]) {
      const z = cz + sd * (h + 0.012), out = [cx, cy, cz - sd * 5];
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * Math.PI * 2, b = a + 0.45, w = r * 0.05, r0 = r * 0.17, r1 = r * 0.7, c0 = Math.cos(a), s0 = Math.sin(a), c1 = Math.cos(b), s1 = Math.sin(b);
        g.quadO([cx + c0 * r0 - s0 * w, cy + s0 * r0 + c0 * w, z], [cx + c1 * r1 - s1 * w, cy + s1 * r1 + c1 * w, z], [cx + c1 * r1 + s1 * w, cy + s1 * r1 - c1 * w, z], [cx + c0 * r0 + s0 * w, cy + s0 * r0 - c0 * w, z], EV_CYAN, out);
      }
      for (let i = 0; i < 6; i++) { const a0 = i / 6 * Math.PI * 2, a1 = (i + 1) / 6 * Math.PI * 2; g.triO([cx, cy, z + sd * 0.004], p(a0, z - cz, r * 0.12), p(a1, z - cz, r * 0.12), LIP, out); }
    }
  }

  // ---- SAMUM 4x4: a trophy truck. Black flares over the big wheels, a livery slash in the second colour down the side, a black bed liner
  // with a spare tyre lying in it under a tube cage from the roof to the tail, a light bar on the roof, a snorkel up the A-pillar, a skid
  // plate, the coil-overs to be seen in the wheel arches
  function truckGeometry(M, color, stripe) {
    const def = BODIES.truck, secs = secsOf(def, M), g = new GB(), D = decalKit(g, secs);
    const P = colArr(color), S = stripe ? stripeFor(color) : P.map(v => v * 0.7), K = [0.06, 0.06, 0.065], K2 = [0.13, 0.13, 0.14], LN = [0.17, 0.17, 0.18];
    const front = secs[secs.length - 1], rear = secs[0], r = M.rw, fx = M.a * (M.len / 4.4) * 0.98 + 0.05, rx = -M.b * (M.len / 4.4) * 0.98, hz = M.wid * 0.5 - def.wz;
    shellInto(g, secs, (k, e, kind) => e === 0 || e === 8 ? K : k <= 1 && e >= 3 && e <= 5 ? LN : (kind === 'gf' && e >= 3 && e <= 5) || ((kind === 'gf' || kind === 'r') && (e === 2 || e === 6)) ? GLASS : P, P, P);
    // the cab: the pillars (a wide one at the back: a single cab), the small rear window; the livery down the sides
    D.band([[-0.8, 0], [-0.42, 0], [-0.5, 1], [-0.8, 1]], P, null, 0.014);
    D.band([[0.84, 0], [1.02, 0], [1.02, 1], [0.7, 1]], P, null, 0.014);
    { const xw = (y) => secs[2].x + (y - secs[2].yt) / (secs[3].yt - secs[2].yt) * (secs[3].x - secs[2].x) - 0.012;   // (on the cab's sloping back wall)
      for (const sd of [-1, 1]) g.quadO([xw(1.3), 1.3, sd * 0.58], [xw(1.62), 1.62, sd * 0.52], [xw(1.62), 1.62, 0], [xw(1.3), 1.3, 0], GLASS, [0, 1.4, 0]); }
    D.side([[-2.5, 0.76], [-1.2, 0.76], [0.6, 1.1], [-0.3, 1.1], [-2.5, 0.96]], S);
    D.side([[0.9, 0.76], [2.55, 0.76], [2.55, 0.9], [1.3, 0.9]], S);
    // the bonnet's vents, the grille with its lamps, the skid plate under the nose
    for (const sd of [-1, 1]) D.top([[1.2, sd * 0.2], [1.56, sd * 0.2], [1.56, sd * 0.5], [1.2, sd * 0.5]], K, 0.01);
    World.box(g, front.x - 0.01, 0.84, 0, 0.04, 0.18, 1.0, 0, K);
    for (const sd of [-1, 1]) World.box(g, front.x + 0.01, 0.87, sd * 0.62, 0.03, 0.13, 0.28, 0, K2);
    World.box(g, front.x - 0.18, 0.5, 0, 0.5, 0.05, 1.3, 0, K2);
    // the tail: the lamps' black surrounds (the lamps are the tail mesh), the exhaust out of the side in front of the rear wheel
    for (const sd of [-1, 1]) World.box(g, rear.x - 0.012, 0.92, sd * 0.85, 0.03, 0.23, 0.16, 0, K);
    tubeX(g, rx + 0.95, rx + 0.62, 0.66, M.wid * 0.5 - 0.1, 0.055, 8, [0.62, 0.62, 0.64], [0.04, 0.04, 0.045]);
    // the flares over the wheels, the coil-overs in the arches; the rear wheels (the fronts are meshes of their own)
    for (const x of [fx, rx]) for (const sd of [-1, 1]) {
      flareInto(g, x, r, r + 0.07, r + 0.17, sd * 0.86, sd * (M.wid * 0.5 + 0.04), K);
      fRod(g, [x + 0.08, r + 0.1, sd * (hz - 0.2)], [x - 0.1, 1.08, sd * 0.7], 0.07, [0.74, 0.74, 0.77]);
      fRod(g, [x + 0.05, r + 0.3, sd * (hz - 0.23)], [x - 0.05, 0.86, sd * 0.74], 0.1, S);   // (its spring)
    }
    for (const sd of [-1, 1]) knobWheelInto(g, rx, r, sd * hz, r, 0.36);
    // the bed: the spare lying in it, the cage from the roof down to the tail; the light bar on the roof; the snorkel
    knobWheelInto(g, -1.72, 1.24 + 0.17, 0, 0.44, 0.34, 'y');
    const cg = [0.1, 0.1, 0.11];
    for (const sd of [-1, 1]) {
      fRod(g, [-0.78, 1.72, sd * 0.78], [-2.2, 1.62, sd * 0.84], 0.06, cg); fRod(g, [-2.2, 1.62, sd * 0.84], [-2.52, 1.24, sd * 0.9], 0.06, cg);
      fRod(g, [-2.2, 1.62, sd * 0.84], [-1.45, 1.24, sd * 0.94], 0.05, cg);
    }
    fRod(g, [-2.2, 1.62, -0.84], [-2.2, 1.62, 0.84], 0.06, cg); fRod(g, [-1.35, 1.68, -0.8], [-1.35, 1.68, 0.8], 0.05, cg);
    World.box(g, 0.26, 1.8, 0, 0.12, 0.11, 1.56, 0, K);
    for (let i = 0; i < 6; i++) World.box(g, 0.325, 1.815, (i - 2.5) * 0.25, 0.012, 0.08, 0.19, 0, [1, 0.96, 0.82]);
    for (const sd of [-1, 1]) fRod(g, [0.24, 1.77, sd * 0.6], [0.24, 1.8, sd * 0.6], 0.05, K);
    fRod(g, [1.0, 1.22, M.wid * 0.5 - 0.1], [0.62, 1.8, M.wid * 0.5 - 0.2], 0.1, K); World.box(g, 0.6, 1.76, M.wid * 0.5 - 0.2, 0.14, 0.12, 0.12, 0, K);
    return g.geometry();
  }
  // a wheel-arch flare: a thick arc over the wheel (centre cx, cy) from radius r0 to r1, from z0 (in) to z1 (out)
  function flareInto(g, cx, cy, r0, r1, z0, z1, col) {
    const n = 9, A0 = 0.16, A1 = Math.PI - 0.16, P = (a, r, z) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z];
    for (let i = 0; i < n; i++) {
      const a0 = A0 + (A1 - A0) * i / n, a1 = A0 + (A1 - A0) * (i + 1) / n, am = (a0 + a1) / 2;
      g.quadO(P(a0, r1, z0), P(a1, r1, z0), P(a1, r1, z1), P(a0, r1, z1), col, [cx, cy, (z0 + z1) / 2]);   // the top
      g.quadO(P(a0, r0, z1), P(a1, r0, z1), P(a1, r1, z1), P(a0, r1, z1), col, [cx, cy, z0]);   // the outer face
      g.quadO(P(a0, r0, z0), P(a1, r0, z0), P(a1, r0, z1), P(a0, r0, z1), col, P(am, r0 + 1, (z0 + z1) / 2));   // the underside, over the tyre
    }
    for (const a of [A0, A1]) g.quadO(P(a, r0, z0), P(a, r1, z0), P(a, r1, z1), P(a, r0, z1), col, P(a === A0 ? a + 0.3 : a - 0.3, (r0 + r1) / 2, (z0 + z1) / 2));
  }
  // the truck's wheel: a big knobbly tyre (the tread's blocks stand proud in turn, the shoulders stepped with them), a tall sidewall, a
  // silver beadlock ring round a small dark rim; the axle along z (a wheel on the car) or y (the spare lying in the bed)
  function knobWheelInto(g, cx, cy, cz, r, wd, ax) {
    const S = 16, T = [0.08, 0.08, 0.085], T2 = [0.13, 0.13, 0.135], RIM = [0.16, 0.16, 0.17], BL = [0.74, 0.75, 0.78], h = wd / 2;
    const W = ax === 'y' ? (u, v, w) => [cx + u, cy + w, cz + v] : (u, v, w) => [cx + u, cy + v, cz + w];   // (u, v across the wheel, w along its axle)
    const p = (a, w, rr) => W(Math.cos(a) * rr, Math.sin(a) * rr, w), C = W(0, 0, 0), out = (sd) => W(0, 0, -sd * 5);
    for (let i = 0; i < S; i++) {
      const a0 = i / S * Math.PI * 2, a1 = (i + 1) / S * Math.PI * 2, hi = i % 2 === 1, rk = hi ? r : r * 0.95;
      g.quadO(p(a0, -h, rk), p(a0, h, rk), p(a1, h, rk), p(a1, -h, rk), hi ? T : T2, C);
      g.quadO(p(a1, -h, r * 0.95), p(a1, h, r * 0.95), p(a1, h, r), p(a1, -h, r), T, p(hi ? a1 - 0.1 : a1 + 0.1, 0, r * 0.98));   // (the block's end)
      for (const sd of [-1, 1]) {
        const w = sd * h;
        g.quadO(p(a0, w, rk), p(a0, w, r * 0.84), p(a1, w, r * 0.84), p(a1, w, rk), T, out(sd));
        g.quadO(p(a0, w - sd * 0.015, r * 0.84), p(a0, w - sd * 0.015, r * 0.56), p(a1, w - sd * 0.015, r * 0.56), p(a1, w - sd * 0.015, r * 0.84), T2, out(sd));
        g.quadO(p(a0, w - sd * 0.01, r * 0.56), p(a0, w - sd * 0.01, r * 0.48), p(a1, w - sd * 0.01, r * 0.48), p(a1, w - sd * 0.01, r * 0.56), BL, out(sd));
        g.triO(W(0, 0, w - sd * 0.06), p(a0, w - sd * 0.03, r * 0.48), p(a1, w - sd * 0.03, r * 0.48), RIM, out(sd));
        if (i % 2 === 0) { const ab = (a0 + a1) / 2; g.triO(p(ab, w - sd * 0.004, r * 0.53), p(ab - 0.04, w - sd * 0.004, r * 0.51), p(ab + 0.04, w - sd * 0.004, r * 0.51), [0.3, 0.3, 0.32], out(sd)); }   // (the beadlock's bolts)
      }
    }
  }

  /* ---------------- TAIFUN LM: a Le Mans prototype, built of lofts like the formula: a central tub with the cockpit's canopy on it, a pontoon
     down each side with humps over the wheels (the wheels show under them), the floor and the diffuser. Its nose, splitter, engine cover
     with the fin, rear wing (with its DRS flap), mirrors and fender louvres are meshes of their own that a crash knocks off (lmPartMeshes);
     the four wheels too (they steer and spin; the pit crew changes them) ---------------- */
  const LM_HUB = { fz: 0.83, rz: 0.82, fr: 0.355, rr: 0.36, fw: 0.3, rw: 0.34 };
  // a pontoon's cross-section at x (sd: the side): from zi (inside) to zo (outside), yb up to yt, the top rounded toward the outside
  const lmPod = (x, zi, zo, yb, yt, sd) => [[x, yb, sd * zi], [x, yb, sd * (zo - 0.04)], [x, yb + 0.05, sd * zo], [x, yt - 0.1, sd * zo], [x, yt - 0.02, sd * (zo - 0.07)], [x, yt, sd * (zo - 0.2)], [x, yt - 0.03, sd * (zi + 0.12)], [x, yt - 0.12, sd * zi]];
  // x, zi, zo, yb, yt: the nose; the front fender's hump over the wheel (its underside the arch); the sidepod; the rear hump; the tail
  const LM_POD = [[2.45, 0.42, 0.9, 0.16, 0.36], [2.2, 0.4, 0.98, 0.12, 0.62], [1.95, 0.4, 1.0, 0.34, 0.8], [1.55, 0.42, 1.0, 0.44, 0.87], [1.15, 0.44, 1.0, 0.36, 0.8],
    [0.95, 0.46, 0.99, 0.12, 0.7], [0.55, 0.5, 0.98, 0.12, 0.6], [-0.6, 0.5, 0.98, 0.12, 0.64], [-0.95, 0.46, 0.99, 0.14, 0.78], [-1.1, 0.44, 1.0, 0.36, 0.86],
    [-1.45, 0.42, 1.0, 0.46, 0.92], [-1.85, 0.42, 1.0, 0.38, 0.88], [-2.1, 0.42, 0.98, 0.2, 0.8], [-2.42, 0.4, 0.94, 0.18, 0.7]];
  function lmGeometry(M, color) {
    const g = new GB(), P = colArr(color), S = stripeFor(color), K = FK, K2 = FK2, W = [0.95, 0.97, 1.0];
    // ---- the floor and the diffuser with its fences ----
    World.box(g, 0.2, 0.045, 0, 4.2, 0.035, 1.3, 0, K);
    for (const up of [1, -1]) g.quadO([-1.8, 0.08, -0.66], [-2.44, 0.34, -0.66], [-2.44, 0.34, 0.66], [-1.8, 0.08, 0.66], K, [-2.1 - 0.3 * up, up > 0 ? -1 : 2, 0]);
    for (const z of [-0.62, -0.3, 0.3, 0.62]) World.box(g, -2.18, 0.06, z, 0.5, 0.2, 0.02, 0, K2);
    // ---- the tub under the canopy (the nose and the engine cover are parts), the canopy: windscreen, side glass, a painted roof ----
    fLoft(g, [fSec(1.3, 0.08, 0.46, 0.34, 0.5, 0.54, 0.44, 0.7), fSec(0.9, 0.08, 0.52, 0.38, 0.56, 0.58, 0.5, 0.7), fSec(-0.4, 0.08, 0.56, 0.4, 0.6, 0.6, 0.54, 0.7), fSec(-1.05, 0.08, 0.54, 0.4, 0.58, 0.6, 0.5, 0.7)],
      (k, e) => e === 9 ? K : P, K2, K2);
    fLoft(g, [fSec(1.28, 0.5, 0.42, 0.56, 0.44, 0.6, 0.36, 0.7), fSec(0.8, 0.52, 0.47, 0.76, 0.48, 0.97, 0.36, 0.7), fSec(0.22, 0.52, 0.48, 0.86, 0.49, 1.07, 0.38, 0.75),
      fSec(-0.45, 0.52, 0.48, 0.84, 0.47, 1.05, 0.36, 0.75), fSec(-1.05, 0.52, 0.42, 0.72, 0.38, 0.87, 0.28, 0.7)],
    (k, e) => (k <= 1 && e >= 3 && e <= 5) || ((k === 1 || k === 2) && (e === 2 || e === 6)) ? GLASS : e === 9 ? K : P, P, P);
    // ---- the pontoons: black underneath and inside, the humps' tops in the second colour; an intake at the front of each sidepod ----
    for (const sd of [-1, 1]) {
      fLoft(g, LM_POD.map(([x, zi, zo, yb, yt]) => lmPod(x, zi, zo, yb, yt, sd)), (k, e) => e <= 1 || e === 7 ? K : e === 4 && (k === 2 || k === 3 || k === 9 || k === 10) ? S : P, P, K);
      g.quadO([0.92, 0.2, sd * 1.0], [0.62, 0.2, sd * 0.99], [0.62, 0.5, sd * 0.99], [0.92, 0.6, sd * 1.0], K, [0.8, 0.4, 0]);
      World.box(g, 2.45, 0.27, sd * 0.68, 0.03, 0.045, 0.34, 0, W);   // (the head lamp: a strip of LEDs)
    }
    // ---- the gearbox's crash structure between the pontoons at the back, black round the tail lamp (the tail mesh) ----
    World.box(g, -2.3, 0.16, 0, 0.28, 0.34, 0.62, 0, K);
    World.box(g, -2.435, 0.585, 0, 0.02, 0.06, 1.8, 0, K);
    return g.geometry();
  }
  // the prototype's wheel (axle along z): a slick with the compound band on the sidewall (as the formula's: tyreCol), a black rim with ten
  // silver spokes and a red centre-lock nut
  const lmWheelCache = new Map();
  function lmWheelGeo(r, wd, col) {
    const key = r + '|' + wd + '|' + col; if (lmWheelCache.has(key)) return lmWheelCache.get(key);
    const g = new GB(), S = 12, T = [0.075, 0.075, 0.08], B = colArr(col), RIM = [0.1, 0.1, 0.11], SP = [0.66, 0.67, 0.7], NUT = [0.86, 0.14, 0.1];
    const h = wd / 2, p = (a, z, rr) => [Math.cos(a) * rr, Math.sin(a) * rr, z];
    for (let i = 0; i < S; i++) {
      const a0 = i / S * Math.PI * 2, a1 = (i + 1) / S * Math.PI * 2;
      g.quadO(p(a0, -h, r), p(a0, h, r), p(a1, h, r), p(a1, -h, r), T, [0, 0, 0]);
      for (const sd of [-1, 1]) {
        const out = [0, 0, -sd * 5], z = sd * h, ring = (r0, r1, col) => g.quadO(p(a0, z, r0), p(a0, z, r1), p(a1, z, r1), p(a1, z, r0), col, out);
        ring(r, r * 0.86, T); ring(r * 0.86, r * 0.82, B); ring(r * 0.82, r * 0.7, T);
        g.triO([0, 0, sd * (h - 0.03)], p(a0, sd * (h - 0.01), r * 0.7), p(a1, sd * (h - 0.01), r * 0.7), RIM, out);
      }
    }
    for (const sd of [-1, 1]) {
      const z = sd * (h - 0.004), out = [0, 0, -sd * 5];
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, w = 0.014, c = Math.cos(a), s = Math.sin(a), r0 = 0.06, r1 = r * 0.68;
        g.quadO([c * r0 - s * w, s * r0 + c * w, z], [c * r1 - s * w, s * r1 + c * w, z], [c * r1 + s * w, s * r1 - c * w, z], [c * r0 + s * w, s * r0 - c * w, z], SP, out); }
      for (let i = 0; i < 6; i++) { const a0 = i / 6 * Math.PI * 2, a1 = (i + 1) / 6 * Math.PI * 2; g.triO([0, 0, z + sd * 0.006], p(a0, z + sd * 0.002, 0.055), p(a1, z + sd * 0.002, 0.055), NUT, out); }
    }
    const geo = g.geometry(); lmWheelCache.set(key, geo); return geo;
  }
  // the prototype's parts, each centred on its own origin (.parameters: how a loose one lies): the splitter with its dive planes (bumperF),
  // the nose between the pontoons (hood), the rear wing on its swan necks with the DRS flap (bumperR), the engine cover with the fin
  // (trunk), the mirrors, the louvre panels on the front fenders (fenderL / fenderR)
  function lmPartMeshes(car, bodyG) {
    const P = colArr(car.color), S = stripeFor(car.color), K = FK, parts = {};
    const add = (name, geo, x, y, z, noShadow) => { const m = new THREE.Mesh(geo, matCar); m.position.set(x, y, z); m.castShadow = !noShadow; bodyG.add(m); parts[name] = m; return m; };
    { const g = new GB(); fSlab(g, 0.26, 0, -0.26, 0.012, 0.024, -0.97, 0.97, K);
      for (const sd of [-1, 1]) { fSlab(g, 0.1, 0.24, -0.12, 0.28, 0.014, Math.min(sd * 0.93, sd * 1.06), Math.max(sd * 0.93, sd * 1.06), P); fPlate(g, [[0.26, -0.02], [-0.26, -0.02], [-0.2, 0.08], [0.2, 0.06]], sd * 0.975, 0.016, K); }
      add('bumperF', fPartGeo(g, 0, 0, 0.52, 0.06, 1.95), 2.3, 0.06, 0); }
    { const g = new GB();
      fLoft(g, [fSec(1.3, 0.1, 0.46, 0.34, 0.5, 0.545, 0.44, 0.7), fSec(1.8, 0.1, 0.4, 0.3, 0.44, 0.465, 0.38, 0.7), fSec(2.2, 0.1, 0.34, 0.24, 0.38, 0.37, 0.32, 0.7), fSec(2.52, 0.1, 0.22, 0.18, 0.25, 0.26, 0.2, 0.7)],
        (k, e) => e === 9 ? K : k === 2 ? S : P, FK2, S);
      add('hood', fPartGeo(g, 1.9, 0.32, 1.2, 0.3, 0.9), 1.9, 0.32, 0); }
    { const g = new GB(); fSlab(g, 0.2, -0.035, -0.18, 0.03, 0.032, -0.9, 0.9, P);
      for (const sd of [-1, 1]) { fPlate(g, [[0.26, -0.3], [-0.3, -0.3], [-0.3, 0.16], [0.2, 0.1]], sd * 0.92, 0.02, P); fRod(g, [0.04, -0.4, sd * 0.24], [0.06, -0.06, sd * 0.24], 0.04, K); fRod(g, [0.06, -0.06, sd * 0.24], [0.0, 0.035, sd * 0.24], 0.035, K); }
      const rw = add('bumperR', fPartGeo(g, 0, 0, 0.5, 0.12, 1.86), -2.22, 1.0, 0), flap = new THREE.Group(), fg = new GB();
      fSlab(fg, 0.16, -0.09, 0, 0, 0.018, -0.88, 0.88, S); flap.position.set(-0.2, 0.17, 0); flap.add(new THREE.Mesh(fg.geometry(), matCar)); rw.add(flap); parts._flap = flap; }
    { const g = new GB();
      fLoft(g, [fSec(-1.0, 0.5, 0.42, 0.72, 0.38, 0.875, 0.28, 0.7), fSec(-1.6, 0.5, 0.38, 0.66, 0.34, 0.785, 0.24, 0.7), fSec(-2.1, 0.5, 0.34, 0.6, 0.3, 0.705, 0.2, 0.7), fSec(-2.4, 0.48, 0.3, 0.56, 0.26, 0.645, 0.16, 0.7)],
        (k, e) => e === 9 ? K : P, null, FK2);
      fPlate(g, [[-0.5, 1.03], [-2.26, 0.99], [-2.26, 0.66], [-1.0, 0.86]], 0, 0.018, S);
      add('trunk', fPartGeo(g, -1.7, 0.75, 1.4, 0.3, 0.84), -1.7, 0.75, 0); }
    for (const [name, sd] of [['mirrorL', -1], ['mirrorR', 1]]) {
      const g = new GB(); World.box(g, 0, -0.03, 0, 0.1, 0.06, 0.17, 0, P); World.box(g, 0.02, -0.14, -sd * 0.05, 0.03, 0.12, 0.03, 0, K);
      add(name, fPartGeo(g, 0, 0, 0.1, 0.06, 0.17), 1.0, 0.9, sd * 0.8, true);
    }
    for (const [name, sd] of [['fenderL', -1], ['fenderR', 1]]) {
      const g = new GB(); World.box(g, 0, 0, 0, 0.42, 0.012, 0.26, 0, K); for (let i = 0; i < 5; i++) World.box(g, -0.16 + i * 0.08, 0.004, 0, 0.022, 0.02, 0.24, 0, [0.22, 0.22, 0.24]);
      add(name, fPartGeo(g, 0, 0, 0.42, 0.03, 0.26), 1.55, 0.868, sd * 0.72, true);
    }
    const flap = parts._flap; delete parts._flap;
    return { parts, flap, lm: true };
  }
  // the prototype's parts become its detachable parts: under the nose its crash box, under the engine cover the engine, under a louvre the hole
  function lmParts(v, parts, under) {
    Object.assign(parts, v.fp.parts); v.drsFlap = v.fp.flap;
    for (const [name, geo, mat] of [['hood', new THREE.BoxGeometry(0.5, 0.2, 0.44).translate(-0.4, -0.06, 0), matUnder], ['trunk', fEngineGeo().translate(-0.3, 0.02, 0), matCar],
      ['fenderL', new THREE.BoxGeometry(0.38, 0.01, 0.22), matUnder], ['fenderR', new THREE.BoxGeometry(0.38, 0.01, 0.22), matUnder]]) {
      const m = parts[name], u = new THREE.Group(); u.add(new THREE.Mesh(geo, mat)); u.position.set(m.position.x, m.position.y - 0.012, m.position.z); u.visible = false; v.bodyG.add(u); under[name] = u;
    }
  }

  // the new section-loft bodies: shape (the body mesh), wheel (a front wheel at the origin, radius r: its own mesh, it steers), tail (the tail
  // lamps: the mesh that lights up under braking)
  const NEW_BODY = {
    muscle: { shape: muscleGeometry, wheel: (g, r) => muscleWheelInto(g, 0, 0, 0, r, 0.25),
      tail: (g, M) => { const x = BODIES.muscle.secs[0][0] * (M.len / BODIES.muscle.len) - 0.035; for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) World.box(g, x, 0.645, sd * (0.22 + i * 0.19), 0.03, 0.12, 0.16, 0, [1, 1, 1]); } },
    ev: { shape: evGeometry, wheel: (g, r) => aeroWheelInto(g, 0, 0, 0, r, 0.27),
      tail: (g, M) => { const d = BODIES.ev, x = d.secs[0][0] * (M.len / d.len) - 0.03; World.box(g, x, 0.695, 0, 0.03, 0.034, 1.66 * (M.wid / d.wid), 0, [1, 1, 1]); } },
    truck: { shape: truckGeometry, wheel: (g, r) => knobWheelInto(g, 0, 0, 0, r, 0.36),
      tail: (g, M) => { const d = BODIES.truck, x = d.secs[0][0] * (M.len / d.len) - 0.03; for (const sd of [-1, 1]) World.box(g, x, 0.95, sd * 0.85 * (M.wid / d.wid), 0.02, 0.17, 0.11, 0, [1, 1, 1]); } },
  };
  const newWheelCache = new Map();
  function newWheelGeo(M) { const key = M.id + '|' + M.rw; if (!newWheelCache.has(key)) { const g = new GB(); NEW_BODY[M.body].wheel(g, M.rw); newWheelCache.set(key, g.geometry()); } return newWheelCache.get(key); }

  // soft shading in the body's lower part (ambient occlusion, once per model and colour, in its vertex colours): lower down the body darker
  // (the sills, under the bumpers: the ground and the body itself hide the sky there), the faces turned to the ground darker still
  function carAO(geo) {
    const P = geo.attributes.position, C = geo.attributes.color, N = geo.attributes.normal; if (!P || !C || !N) return geo;
    const glass = (r, g, b) => (Math.abs(r - 0.1) < 0.025 && Math.abs(g - 0.13) < 0.025 && Math.abs(b - 0.19) < 0.025) || (Math.abs(r - 0.04) < 0.025 && Math.abs(g - 0.05) < 0.025 && Math.abs(b - 0.08) < 0.025);
    for (let i = 0; i < P.count; i++) {
      if (glass(C.getX(i), C.getY(i), C.getZ(i))) continue;   // (the panes keep their colour: findGlass knows them by it)
      let k = 0.8 + 0.2 * Core.sstep(0.12, 0.62, P.getY(i));
      if (N.getY(i) < -0.3) k *= 0.78;
      C.setXYZ(i, C.getX(i) * k, C.getY(i) * k, C.getZ(i) * k);
    }
    C.needsUpdate = true; return geo;
  }
  function carGeometry(bodyKey, M, color, stripe) {
    const key = bodyKey + '|' + M.id + '|' + color + '|' + stripe;
    if (geoCache.has(key)) return geoCache.get(key);
    const done = (geo) => { carAO(geo); geoCache.set(key, geo); return geo; };
    if (bodyKey === 'rally') return done(smoothNormals(rallyGeometry(M, color), 38));
    if (bodyKey === 'formula') return done(smoothNormals(formulaGeometry(M, color), 38));
    if (NEW_BODY[bodyKey]) return done(smoothNormals(NEW_BODY[bodyKey].shape(M, color, stripe), 38));
    if (bodyKey === 'lm') return done(smoothNormals(lmGeometry(M, color), 38));
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
    return done(smoothNormals(g.geometry(), 38));
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
    if (bodyKey === 'formula') { const g = new GB(); World.box(g, -2.455, 0.305, 0, 0.03, 0.07, 0.085, 0, [1, 1, 1]); const geo = g.geometry(); tailGeoCache.set(key, geo); return geo; }   // the rain light
    if (NEW_BODY[bodyKey]) { const g = new GB(); NEW_BODY[bodyKey].tail(g, M); const geo = g.geometry(); tailGeoCache.set(key, geo); return geo; }
    if (bodyKey === 'lm') { const g = new GB(); World.box(g, -2.452, 0.595, 0, 0.02, 0.04, 1.7, 0, [1, 1, 1]); const geo = g.geometry(); tailGeoCache.set(key, geo); return geo; }   // (a red bar right across the tail)
    const def = BODIES[bodyKey], sx = M.len / def.len, sz = M.wid / def.wid;
    const rear = def.secs[0];
    const x = rear[0] * sx, w = rear[1] * sz, y = rear[3] - 0.16;
    const g = new GB();
    for (const sd of [-1, 1]) World.box(g, x - 0.01, y, sd * w * 0.6, 0.1, 0.15, 0.42, 0, [1, 1, 1]);
    const geo = g.geometry(); tailGeoCache.set(key, geo); return geo;
  }

  /* ---------------- materials (shared) ---------------- */
  let matCar, matWheel, matTailOff, matTailOn, matBlob, matBlobS, matMarker, matScOn, matScOff;
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
  /* the sun on the paint and the glass (every car on every track, the garage too): a clear coat that mirrors more of the sky at a glancing
     angle (fresnel), its sky in the colour of the race's sky (a warm dusk, a dark night, a grey rain: the fog's colour), and a sharp glint of
     the sun with a broad sheen round it and a rim on the sun side, sharper and brighter on the glass (the body's panes by their colour, the
     Peugeot's glass by its material). One patch after what a material already does (the dirt, which dulls it, and the scratches); the sun
     and the sky are shared uniforms set every frame (cgSet) */
  const CGU = { sun: { value: new THREE.Vector3(0, 1, 0) }, sunC: { value: new THREE.Color(0, 0, 0) }, env: { value: new THREE.Color(1, 1, 1) } }, cgOb = new WeakMap();
  const CG_COMMON = '#include <common>\nuniform vec3 uCgSun;\nuniform vec3 uCgSunC;\nuniform vec3 uCgEnv;\nuniform float uCgG;\n#ifndef CG_D\n#define CG_D\nfloat cgD = 0.0;\n#endif';
  const CG_ENV = (() => { const c = THREE.ShaderChunk.envmap_fragment, e = c.replace('#ifdef ENVMAP_BLENDING_MULTIPLY', 'envColor.rgb *= uCgEnv;\n#ifdef ENVMAP_BLENDING_MULTIPLY').replace(/specularStrength \* reflectivity/g, 'specularStrength * cgR');
    return ['float cgG = uCgG;', '#ifdef USE_COLOR', 'cgG = max(cgG, 1.0 - step(0.05, min(distance(vColor.rgb, vec3(0.1, 0.13, 0.19)), distance(vColor.rgb, vec3(0.04, 0.05, 0.08)))));', '#endif',
      'vec3 cgN = normalize(normal), cgV = normalize(vViewPosition);', 'float cgFr = pow(1.0 - clamp(dot(cgN, cgV), 0.0, 1.0), 5.0);',
      '#ifdef USE_ENVMAP', 'float cgR = min(1.0, reflectivity + cgG * 0.2 + cgFr * mix(0.3, 0.5, cgG)) * (1.0 - cgD * 0.8);', '#endif',
      e.includes('cgR') && e.includes('uCgEnv') ? e : c].join('\n'); })();
  const CG_GLINT = ['{ vec3 cgL = normalize((viewMatrix * vec4(uCgSun, 0.0)).xyz), cgH = normalize(cgL + cgV);',
    '  float cgNl = max(dot(cgN, cgL), 0.0), cgNh = max(dot(cgN, cgH), 0.0);',
    '  float cg = (pow(cgNh, mix(40.0, 140.0, cgG)) * mix(2.6, 4.0, cgG) + pow(cgNh, 8.0) * 0.4) * smoothstep(0.0, 0.25, cgNl) + cgFr * 0.6 * cgNl;',
    '  outgoingLight += uCgSunC * cg * (1.0 - cgD); }',
    'gl_FragColor = vec4( outgoingLight, diffuseColor.a );'].join('\n');
  function cgPatch(sh, ug, glint) {
    Object.assign(sh.uniforms, { uCgSun: CGU.sun, uCgSunC: CGU.sunC, uCgEnv: CGU.env, uCgG: ug });
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', CG_COMMON).replace('#include <envmap_fragment>', CG_ENV);
    if (glint) sh.fragmentShader = sh.fragmentShader.replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );', CG_GLINT);
  }
  function cgMat(m, glass, key) {
    const ob = m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile ? m.onBeforeCompile : null, ug = { value: glass ? 1 : 0 };
    cgOb.set(m, ob);   // (Pikes Peak's own layer goes on what was there before this one: see pkCarMat)
    m.onBeforeCompile = (sh, r) => { if (ob) ob(sh, r); cgPatch(sh, ug, true); };
    m.customProgramCacheKey = () => key;
    return m;
  }
  // the sun and the sky of the view: the race's (its sun's direction, colour and strength, the fog's colour against the clear day the
  // paint's sky picture was made for) or the garage's key light
  function cgSet(show) {
    if (show) { CGU.sun.value.set(-6, 10, 7).normalize(); CGU.sunC.value.setHex(0xfff2dd).multiplyScalar(0.55); CGU.env.value.setRGB(1, 1, 1); return; }
    CGU.sun.value.set(sunOff[0], sunOff[1], sunOff[2]).normalize(); CGU.sunC.value.copy(sun.color).multiplyScalar(Math.min(1.2, sun.intensity * 0.6));
    const f = scene.fog.color; CGU.env.value.setRGB(Math.min(1.1, f.r / 0.74), Math.min(1.1, f.g / 0.83), Math.min(1.1, f.b / 0.89));
  }
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
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vLp;\nuniform float uDirt;\nuniform float uScr;\n#ifndef CG_D\n#define CG_D\nfloat cgD = 0.0;\n#endif').replace('#include <color_fragment>',
        '#include <color_fragment>\n{ float n = fract(sin(dot(floor(vLp * 7.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453);\n  float low = 1.0 - smoothstep(0.2, 1.0, vLp.y + (n - 0.5) * 0.35);\n  float d = clamp(uDirt * (0.22 + 0.95 * low) * (0.7 + 0.6 * n), 0.0, 0.8);\n  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.5, 0.4, 0.29), d); cgD = d; }');   // (cgD: the dirt dulls the sun's glint)
      sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n' + SCRATCH_GLSL);
    };
    return cgMat(m, false, 'dirtyCarCg');
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
      const chrome = cgMat(new THREE.MeshPhongMaterial({ color: 0x2c2e33, shininess: 90, specular: 0x777777, envMap: envTex, combine: THREE.MixOperation, reflectivity: 0.45 }), true, 'carCg');   // (the glass: its sharper glint)
      p206Mats = { black: new THREE.MeshLambertMaterial({ color: 0x1b1c20 }), chrome, grey: new THREE.MeshLambertMaterial({ color: 0x55575c }),
        light: new THREE.MeshLambertMaterial({ color: 0xd9d9d6 }), darkred: new THREE.MeshLambertMaterial({ color: 0x7a1510 }),
        lamp: new THREE.MeshBasicMaterial({ color: 0xfff4dc }) };
    }
    return p206Geo;
  }
  // builds the model into a car view: body into bodyG (rolls/pitches), wheels into grp (steer/spin like the stock wheels)
  function addP206(car, bodyG, grp, wf, wr) {
    let bodyH = null;
    const paint = cgMat(new THREE.MeshPhongMaterial({ color: car.color, shininess: 80, specular: 0x505050, envMap: envTex, combine: THREE.MixOperation, reflectivity: 0.2 }), false, 'carCg');
    const tail = new THREE.MeshLambertMaterial({ color: 0x8a0d08, emissive: 0x3a0000 });
    for (const n of p206Parts()) {
      const holder = new THREE.Group(); holder.position.set(n.t[0], n.t[1], n.t[2]);
      const inner = new THREE.Group(); holder.add(inner); if (n.mirror) inner.scale.z = -1;   // spin/steer stay on the holder
      for (const p of n.prims) {
        const m = new THREE.Mesh(p.g, p.mat === 'paint' ? paint : p.mat === 'red' ? tail : p206Mats[p.mat]);
        m.castShadow = true; inner.add(m);
      }
      if (n.name === 'body') { bodyG.add(holder); bodyH = holder; }
      else { grp.add(holder); (n.t[0] > 0 ? wf : wr).push(holder); }
    }
    return { paint, tail, bodyH };
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
    if (M.body === 'formula') { dec.scale.set(0.36, 1, 0.36); dec.rotation.z = -0.075; }   // (on the chassis in front of the cockpit)
    if (def.decalY != null) dec.position.y = def.decalY + 0.012; if (def.decalRz) dec.rotation.z = def.decalRz; if (def.decalS) dec.scale.set(def.decalS, 1, def.decalS);   // (the new bodies: on a sloping bonnet or nose)
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
    let glb = null, fp = null;
    if (M.glb === 'p206') {   // real model: the stock body stays as an invisible stand-in (dents, glass) and the model is drawn instead
      body.visible = false; tail.visible = false; dec.visible = false;
      glb = addP206(car, bodyG, grp, wf, wr);
    } else if (M.body === 'formula') {
      fp = fPartMeshes(car, bodyG);
      for (const sd of [-1, 1]) {   // open wheels: all four separate (they steer and spin; the pit crew changes them)
        const f = new THREE.Mesh(fWheelGeo(F_HUB.fr, F_HUB.fw, tyreCol(car)), matWheel), r = new THREE.Mesh(fWheelGeo(F_HUB.rr, F_HUB.rw, tyreCol(car)), matWheel);
        f.position.set(M.a, F_HUB.fr, sd * F_HUB.fz); r.position.set(-M.b, F_HUB.rr, sd * F_HUB.rz); f.castShadow = r.castShadow = !!car.isPlayer;   // (a field of 13: the rivals' wheels cast none)
        grp.add(f, r); wf.push(f); wr.push(r);
      }
    } else if (M.body === 'lm') {
      fp = lmPartMeshes(car, bodyG);
      for (const sd of [-1, 1]) {   // all four wheels separate, as the formula's (under the pontoons' humps)
        const f = new THREE.Mesh(lmWheelGeo(LM_HUB.fr, LM_HUB.fw, tyreCol(car)), matWheel), r = new THREE.Mesh(lmWheelGeo(LM_HUB.rr, LM_HUB.rw, tyreCol(car)), matWheel);
        f.position.set(M.a, LM_HUB.fr, sd * LM_HUB.fz); r.position.set(-M.b, LM_HUB.rr, sd * LM_HUB.rz); f.castShadow = r.castShadow = !!car.isPlayer;
        grp.add(f, r); wf.push(f); wr.push(r);
      }
    } else for (const sd of [-1, 1]) { const w = new THREE.Mesh(NEW_BODY[M.body] ? newWheelGeo(M) : getWheelGeo(M.body === 'rally'), matWheel); w.position.set(fx, M.rw, sd * (M.wid * 0.5 - (def.wz != null ? def.wz : 0.1))); grp.add(w); wf.push(w); }
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
    if (dB.lamps) dB.lamps.forEach(([x, y, z], k) => { lights[k * 2].set(x * sxB, y, -z * szB); lights[k * 2 + 1].set(x * sxB, y, z * szB); });   // (the new bodies: where their lamps are)
    const noHead = M.body === 'formula';   // the formula: no headlamps, one rain light at the tip of the crash structure
    if (noHead) { lights[0].set(2.62, 0.26, -0.05); lights[1].set(2.62, 0.26, 0.05); lights[2].set(-2.49, 0.34, -0.02); lights[3].set(-2.49, 0.34, 0.02); }
    return { grp, bodyG, body, tail, dec, wf, wr, glb, fp, blob, marker, lights, noHead, dirtU: bodyMat.userData && bodyMat.userData.dirt || null, scrU: bodyMat.userData && bodyMat.userData.scr || null };
  }

  /* ---------------- ghost of the best run (time trials) ---------------- */
  // A see-through copy of the player's car, posed by the game (js/game.js replays the stored best run). Only drawn: not a car of the
  // race (no physics, no collisions, no sound, no shadow, no glows or dust). One material for all its parts, kept for the whole visit.
  // Two of them: the player's own (0: bluish, setGhost) and a friend's shared one (1: orange with the friend's name over it, setGhostF).
  const GV = [null, null], GMAT = [null, null], GCOL = [[0xcfe4ff, 0x2b4a72], [0xffc98a, 0x7a3a08]];
  function ghostDrop(k) { const v = GV[k]; if (!v) return; scene.remove(v.grp); freeOwn(v.grp, new Set([GMAT[k]])); if (v.tag) { v.tag.material.map.dispose(); v.tag.material.dispose(); } GV[k] = null; }
  // g: null hides it (drop: also frees the mesh); else { M, color, stripe, x, y, z, h, d (steer), p (pitch), r (roll), op (opacity 0..1), tag (a name over it) }
  function ghostSet(k, g, drop) {
    let v = GV[k];
    if (!g) { if (drop) ghostDrop(k); else if (v) v.grp.visible = false; return; }
    if (!scene) return;
    if (!GMAT[k]) GMAT[k] = new THREE.MeshLambertMaterial({ color: GCOL[k][0], emissive: GCOL[k][1], transparent: true, opacity: 0.4 });
    const mat = GMAT[k];
    if (v && (v.M !== g.M || v.color !== g.color || (v.tagTxt || '') !== (g.tag || ''))) { ghostDrop(k); v = null; }
    if (!v) {
      v = makeCarMesh({ m: g.M, color: g.color, stripe: g.stripe !== false, num: 0 }, { noDirt: true, noBlob: true, noMarker: true });
      const sh = sharedCarRes();
      v.bodyG.remove(v.dec); freeOwn(v.dec);   // no start number (also the rally's side decals: they share its material)
      v.grp.traverse(o => { if (!o.isMesh) return; if (o.material === v.dec.material) o.visible = false;
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (m && !sh.m.has(m) && m !== mat && m !== v.dec.material) m.dispose();
        o.material = mat; o.castShadow = false; o.receiveShadow = false; o.renderOrder = 2; });
      if (v.body.visible) v.body.renderOrder = 3;   // (the body over the wheels it hides)
      if (g.tag) {   // the friend's name over the car
        const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const x = cv.getContext('2d');
        x.fillStyle = 'rgba(10,14,20,0.6)'; x.fillRect(0, 8, 256, 48); x.font = 'bold 30px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#ffd08a'; x.fillText(g.tag, 128, 33, 244);
        v.tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false })); v.tag.scale.set(4, 1, 1); v.tag.position.y = 2.4; v.tag.renderOrder = 4; v.grp.add(v.tag);
      }
      v.M = g.M; v.color = g.color; v.tagTxt = g.tag || ''; v.spin = 0; v.lx = g.x; v.lz = g.z;
      scene.add(v.grp); GV[k] = v;
    }
    const M = g.M;
    v.grp.visible = g.op > 0.01; mat.opacity = 0.42 * clamp(g.op, 0, 1); if (v.tag) v.tag.material.opacity = clamp(g.op, 0, 1);
    v.grp.position.set(g.x, g.y, g.z);
    v.grp.rotation.set(0, -g.h, g.p || 0, 'YZX');
    v.bodyG.rotation.set(g.r || 0, 0, 0); v.bodyG.position.y = Math.abs(g.r || 0) * 0.4;
    const mv = Math.hypot(g.x - v.lx, g.z - v.lz); v.lx = g.x; v.lz = g.z;
    if (mv < 5) v.spin += mv / M.rw;   // (wheels roll with the distance moved; not across a jump back in the replay)
    for (const w of v.wf) w.rotation.set(0, -(g.d || 0), -v.spin);
    for (const w of v.wr) w.rotation.set(0, 0, -v.spin);
  }
  const setGhost = (g, drop) => ghostSet(0, g, drop), setGhostF = (g, drop) => ghostSet(1, g, drop);

  /* ---------------- particles ---------------- */
  // smoke, dust and spray puffs: a 2 x 2 atlas of soft cloudy blobs (alpha = density, fading to nothing at the rim), drawn once; a
  // particle takes one of the four by its seed and turns it (so no two puffs look alike and a cloud is not made of discs)
  let puffTexC = null;
  function puffTex() {
    if (puffTexC) return puffTexC;
    const N = 128, H = N / 2, cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d');
    let sd = 7331; const R = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };   // (a fixed pattern: the same puffs every time)
    for (let k = 0; k < 4; k++) {
      const ox = (k % 2) * H, oy = Math.floor(k / 2) * H, cx = ox + H / 2, cy = oy + H / 2;
      g.save(); g.beginPath(); g.rect(ox, oy, H, H); g.clip();
      for (let n = 0; n < 11; n++) {   // overlapping soft blobs: denser in the middle, lumpy at the edge
        const a = R() * Math.PI * 2, d = Math.pow(R(), 0.8) * H * 0.2, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, r = H * (0.15 + R() * 0.16);
        const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,' + (0.4 + R() * 0.25).toFixed(3) + ')'); gr.addColorStop(0.55, 'rgba(255,255,255,' + (0.18 + R() * 0.12).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(ox, oy, H, H);
      }
      g.globalCompositeOperation = 'destination-in';   // (a round rim: nothing past it, however the puff is turned)
      const m = g.createRadialGradient(cx, cy, 0, cx, cy, H * 0.48); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(0.62, 'rgba(0,0,0,0.9)'); m.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = m; g.fillRect(ox, oy, H, H); g.restore();
    }
    puffTexC = new THREE.CanvasTexture(cv); puffTexC.minFilter = THREE.LinearFilter; puffTexC.generateMipmaps = false;
    return puffTexC;
  }
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
      if (additive) this.mat = new THREE.ShaderMaterial({   // sparks and flames: glowing dots
        uniforms: { uScale: { value: 400 } },
        vertexShader: 'attribute float psize; attribute vec4 pcolor; uniform float uScale; varying vec4 vC; void main(){ vC = pcolor; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = psize * uScale / max(1.0, -mv.z); gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'varying vec4 vC; void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d,d)*4.0; if (r > 1.0) discard; float a = vC.a * (1.0 - r) * (1.0 - r * 0.3); gl_FragColor = vec4(vC.rgb, a); }',
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      else {   // smoke, dust, spray: puffs from the atlas, each turned its own way and slowly turning as it grows; lit from above (a darker
        // underside), and darker with the light of the scene (uLit: dusk, night, a grey rainy day)
        this.info = new Float32Array(max * 2);   // (per particle: its seed 0..1, its age 0..1)
        for (let i = 0; i < max; i++) { const h = Math.sin(i * 12.9898 + 78.233) * 43758.5453; this.info[i * 2] = h - Math.floor(h); }   // (a fixed seed per slot: no random numbers drawn)
        this.aInfo = new THREE.BufferAttribute(this.info, 2); this.aInfo.setUsage(THREE.DynamicDrawUsage); g.setAttribute('pinfo', this.aInfo);
        this.mat = new THREE.ShaderMaterial({
          uniforms: { uScale: { value: 400 }, uPuff: { value: puffTex() }, uLit: { value: new THREE.Vector3(1, 1, 1) } },
          vertexShader: 'attribute float psize; attribute vec4 pcolor; attribute vec2 pinfo; uniform float uScale; varying vec4 vC; varying vec2 vI; void main(){ vC = pcolor; vI = pinfo; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = psize * uScale / max(1.0, -mv.z); gl_Position = projectionMatrix * mv; }',
          fragmentShader: ['uniform sampler2D uPuff; uniform vec3 uLit; varying vec4 vC; varying vec2 vI;',
            'void main(){',
            '  vec2 d = gl_PointCoord - 0.5; if (dot(d, d) > 0.25) discard;',
            '  float an = vI.x * 6.2832 + vI.y * (vI.x - 0.5) * 2.4, cs = cos(an), sn = sin(an);',
            '  vec2 q = clamp(vec2(cs * d.x - sn * d.y, sn * d.x + cs * d.y) + 0.5, 0.0, 1.0);',
            '  float k = floor(vI.x * 3.999); vec2 cell = vec2(mod(k, 2.0), floor(k * 0.5)) * 0.5;',
            '  float a = vC.a * min(1.0, texture2D(uPuff, cell + q * 0.5).a * 1.4);',
            '  if (a < 0.004) discard;',
            '  gl_FragColor = vec4(vC.rgb * uLit * (1.05 - 0.15 * gl_PointCoord.y), a);',
            '}'].join('\n'),
          transparent: true, depthWrite: false, blending: THREE.NormalBlending,
        });
      }
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
      const n = this.max, I = this.info;
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
        if (I) I[i * 2 + 1] = t;
      }
      this.aPos.needsUpdate = true; this.aCol.needsUpdate = true; this.aSize.needsUpdate = true; if (I) this.aInfo.needsUpdate = true;
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
      if (!this.pkIn && curTrack && curTrack.def.theme === 'pikes') return;   // (Pikes Peak lays its own marks: pkMarks)
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

  /* ---------------- rain: streaks falling in a box around the view centre. The shader wraps each drop into the box (its place
     moves only with the time), so nothing is updated per drop; the box fades out towards its sides, top and bottom ---------------- */
  class Rain {
    constructor(n) {
      const P = new Float32Array(n * 6), E = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) { const x = Math.random(), y = Math.random(), z = Math.random(); P.set([x, y, z, x, y, z], i * 6); E[i * 2 + 1] = 1; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aEnd', new THREE.BufferAttribute(E, 1));
      this.mat = new THREE.ShaderMaterial({
        uniforms: { uT: { value: 0 }, uC: { value: new THREE.Vector3() }, uBox: { value: new THREE.Vector3(80, 36, 80) }, uV: { value: new THREE.Vector3(1.8, -13, 1.1) },
          uLen: { value: 0.075 }, uA: { value: 0.5 }, uCol: { value: new THREE.Color(0xe2e8ee) } },
        vertexShader: [
          'attribute float aEnd; uniform float uT; uniform vec3 uC; uniform vec3 uBox; uniform vec3 uV; uniform float uLen; varying float vA;',
          'void main(){',
          '  vec3 o = uC - 0.5 * uBox, p = o + mod(position * uBox + uV * uT - o, uBox) - uV * (uLen * aEnd);',   // the head wrapped into the box, the tail up along the fall
          '  vec3 d = abs(p - uC) / (0.5 * uBox);',
          '  vA = (1.0 - smoothstep(0.55, 1.0, max(d.x, d.z))) * (1.0 - smoothstep(0.6, 1.0, d.y)) * (1.0 - 0.75 * aEnd);',
          '  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);',
          '}'].join('\n'),
        fragmentShader: 'uniform vec3 uCol; uniform float uA; varying float vA; void main(){ gl_FragColor = vec4(uCol, uA * vA); }',
        transparent: true, depthWrite: false,
      });
      this.mesh = new THREE.LineSegments(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 8; this.mesh.visible = false;
    }
  }

  /* ---------------- the wet road's mirror (race.water): the lights' reflections, soft streaks on the road running from under each lamp
     towards the camera (the tail and brake lights, the headlights; at night the floodlights), broken up by the rain's ripples. Instanced
     quads turned to the camera in the shader, additive; one draw call, none on a dry road ---------------- */
  class Streaks {
    constructor(max) {
      this.max = max; this.n = 0;
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      this.P = new Float32Array(max * 3); this.C = new Float32Array(max * 4); this.S = new Float32Array(max * 3);
      this.at = [[this.P, 3, 'iPos'], [this.C, 4, 'iCol'], [this.S, 3, 'iSize']].map(([a, n, k]) => { const b = new THREE.InstancedBufferAttribute(a, n); b.setUsage(THREE.DynamicDrawUsage); g.setAttribute(k, b); return b; });
      g.instanceCount = 0;
      this.mat = new THREE.ShaderMaterial({
        uniforms: { uT: { value: 0 }, uFog: { value: new THREE.Vector2(80, 400) } },
        vertexShader: ['attribute vec3 iPos; attribute vec4 iCol; attribute vec3 iSize; uniform vec2 uFog; varying vec2 vQ; varying vec4 vC; varying float vS;',
          'void main(){',
          '  vec2 d = cameraPosition.xz - iPos.xz; float l = length(d); d = l > 0.01 ? d / l : vec2(0.0, 1.0);',   // (along the ground, towards the camera)
          '  vec3 w = iPos + vec3(-d.y, 0.0, d.x) * position.x * iSize.x + vec3(d.x, 0.0, d.y) * (position.y * iSize.y - 0.3);',
          '  vec4 mv = viewMatrix * vec4(w, 1.0); gl_Position = projectionMatrix * mv;',
          '  vQ = position.xy; vS = iSize.z; vC = vec4(iCol.rgb, iCol.a * (1.0 - smoothstep(uFog.x, uFog.y, -mv.z)));',   // (fading into the fog: to nothing, it is light)
          '}'].join('\n'),
        fragmentShader: ['uniform float uT; varying vec2 vQ; varying vec4 vC; varying float vS;',
          'void main(){',
          '  float a = exp(-vQ.x * vQ.x * 14.0) * smoothstep(0.0, 0.12, vQ.y) * pow(1.0 - vQ.y, 1.4);',
          '  a *= 0.7 + 0.3 * sin(vQ.y * 31.0 + vS * 17.0 - uT * 5.0) * sin(vQ.y * 11.0 - vS * 5.0 + uT * 2.3);',   // (the ripples break it up)
          '  gl_FragColor = vec4(vC.rgb, a * vC.a);',
          '}'].join('\n'),
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      });
      this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 2; this.mesh.visible = false;
    }
    begin() { this.n = 0; }
    add(x, y, z, r, g, b, a, w, L, seed) {   // w, L: the streak's width and length (m)
      if (this.n >= this.max || a < 0.004) return; const i = this.n++;
      this.P[i * 3] = x; this.P[i * 3 + 1] = y; this.P[i * 3 + 2] = z; this.C[i * 4] = r; this.C[i * 4 + 1] = g; this.C[i * 4 + 2] = b; this.C[i * 4 + 3] = a;
      this.S[i * 3] = w; this.S[i * 3 + 1] = L; this.S[i * 3 + 2] = seed;
    }
    end() { this.mesh.geometry.instanceCount = this.n; this.mesh.visible = this.n > 0; if (this.n) for (const b of this.at) { b.updateRange.offset = 0; b.updateRange.count = this.n * b.itemSize; b.needsUpdate = true; } }
  }
  /* ---------------- the rain's splashes on the road: rings spreading from where a drop falls, a bright point at first (a little crown),
     round the view's centre; flattened to the view (a ring on the ground seen from low is an ellipse). One Points draw call; each slot
     keeps its place and the time it fell, the shader does the rest ---------------- */
  class Splashes {
    constructor(n) {
      this.n = n; this.k = 0; this.acc = 0; this.P = new Float32Array(n * 3); this.T = new Float32Array(n).fill(-99);
      const g = new THREE.BufferGeometry(); this.aP = new THREE.BufferAttribute(this.P, 3); this.aT = new THREE.BufferAttribute(this.T, 1);
      this.aP.setUsage(THREE.DynamicDrawUsage); this.aT.setUsage(THREE.DynamicDrawUsage); g.setAttribute('position', this.aP); g.setAttribute('aT0', this.aT);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      this.mat = new THREE.ShaderMaterial({
        uniforms: { uT: { value: 0 }, uLife: { value: 0.45 }, uScale: { value: 400 }, uCol: { value: new THREE.Color(0xdde6ee) }, uA: { value: 0.5 } },
        vertexShader: ['attribute float aT0; uniform float uT; uniform float uLife; uniform float uScale; varying float vAge; varying float vE;',
          'void main(){',
          '  vAge = (uT - aT0) / uLife; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;',
          '  vE = clamp(abs(normalize(cameraPosition - position).y), 0.2, 1.0);',
          '  gl_PointSize = (vAge < 0.0 || vAge > 1.0) ? 0.0 : clamp(uScale * (0.16 + 0.44 * vAge) / max(1.0, -mv.z), 2.0, 56.0);',
          '}'].join('\n'),
        fragmentShader: ['uniform vec3 uCol; uniform float uA; varying float vAge; varying float vE;',
          'void main(){',
          '  vec2 q = (gl_PointCoord - 0.5) * 2.0; q.y /= vE; float r = length(q);',
          '  float ring = smoothstep(0.22, 0.0, abs(r - (0.3 + 0.65 * vAge))) * (1.0 - vAge), dot0 = smoothstep(0.5, 0.0, r) * (1.0 - smoothstep(0.0, 0.25, vAge));',
          '  float a = uA * max(ring * (1.0 - vAge), dot0); if (a < 0.01) discard;',
          '  gl_FragColor = vec4(uCol, a);',
          '}'].join('\n'),
        transparent: true, depthWrite: false,
      });
      this.mesh = new THREE.Points(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 3; this.mesh.visible = false;
    }
    put(x, y, z, t) { const i = this.k; this.k = (this.k + 1) % this.n; this.P[i * 3] = x; this.P[i * 3 + 1] = y; this.P[i * 3 + 2] = z; this.T[i] = t; this.dirty = true; }
    flush() { if (!this.dirty) return; this.dirty = false; this.aP.needsUpdate = true; this.aT.needsUpdate = true; }
    clear() { this.T.fill(-99); this.dirty = true; }
  }

  /* ---------------- birds: now and then a small flock flies across the view a little above the trees (gulls by the sea), its shadows
     sweeping over the ground; the wings beat, then the birds glide a while. Not in the rain. One mesh: three triangles a bird, written
     every frame ---------------- */
  class Birds {
    constructor(n) {
      this.n = n; this.pos = new Float32Array(n * 27);
      const g = new THREE.BufferGeometry(); this.attr = new THREE.BufferAttribute(this.pos, 3); this.attr.setUsage(THREE.DynamicDrawUsage); g.setAttribute('position', this.attr);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      this.mat = new THREE.MeshBasicMaterial({ color: 0x2a2c31, side: THREE.DoubleSide });
      this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false; this.mesh.castShadow = true; this.mesh.visible = false;
      this.flocks = [0, 1].map((k) => ({ on: false, wait: 3 + k * 7 + Math.random() * 5, m: [] }));
    }
    reset(gull) { this.gull = !!gull; this.mat.color.setHex(gull ? 0xe6e9ec : 0x2a2c31); for (const f of this.flocks) { f.on = false; f.wait = 2 + Math.random() * 8; } this.vx = this.vz = 0; this.cx = this.cz = null; this.pos.fill(0); this.attr.needsUpdate = true; }
    update(dt, cx, cz, gH) {
      const P = this.pos; let b = 0;
      // the view moves as fast as the cars: a new flock appears ahead of it (the cars then pass under it), else anywhere around
      if (dt > 0) { const k = Math.min(1, dt * 2); this.vx = (this.vx || 0) + ((cx - (this.cx == null ? cx : this.cx)) / dt - (this.vx || 0)) * k; this.vz = (this.vz || 0) + ((cz - (this.cz == null ? cz : this.cz)) / dt - (this.vz || 0)) * k; }
      this.cx = cx; this.cz = cz;
      for (const f of this.flocks) {
        if (!f.on) { f.wait -= dt; if (f.wait > 0 || !(dt > 0)) continue;
          const vv = Math.hypot(this.vx, this.vz), moving = vv > 8, a = moving ? Math.atan2(this.vz, this.vx) + (Math.random() - 0.5) * 0.9 : Math.random() * Math.PI * 2;
          const r = moving ? 70 + Math.min(90, vv * 1.6) * Math.random() : 75 + Math.random() * 25, tx = cx + (Math.random() - 0.5) * 60, tz = cz + (Math.random() - 0.5) * 60;
          f.x = cx + Math.cos(a) * r; f.z = cz + Math.sin(a) * r; f.h = moving ? a + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1) + (Math.random() - 0.5) * 0.8 : Math.atan2(tz - f.z, tx - f.x);   // (ahead of the view: flying across the cars' way)
          f.turn = 0; f.sp = this.gull ? 9 + Math.random() * 3 : 11 + Math.random() * 4;
          f.alt = 15 + Math.random() * 11; f.y = gH(f.x, f.z) + f.alt; f.on = true;
          const n = 4 + Math.floor(Math.random() * 4); f.m = [];
          for (let k = 0; k < n; k++) f.m.push({ fw: -Math.abs(k - (n - 1) / 2) * (1.6 + Math.random() * 1.2) + (Math.random() - 0.5), sd: (k - (n - 1) / 2) * (1.3 + Math.random() * 0.8), up: (Math.random() - 0.5) * 1.5, ph: Math.random() * 6.3, fl: Math.random() * 2, bob: Math.random() * 6.3 });
        }
        if (f.on) {
          if (Math.random() < dt * 0.4) f.turn = (Math.random() - 0.5) * 0.35;   // (a lazy change of course now and then)
          f.h += f.turn * dt; f.x += Math.cos(f.h) * f.sp * dt; f.z += Math.sin(f.h) * f.sp * dt;
          f.y += (gH(f.x, f.z) + f.alt - f.y) * Math.min(1, dt * 0.8);   // (over the hills: they keep their height above the ground)
          if (Math.hypot(f.x - cx, f.z - cz) > 180) { f.on = false; f.wait = 3 + Math.random() * 9; continue; }
          const ch = Math.cos(f.h), sh = Math.sin(f.h), sc = this.gull ? 2.1 : 1.8, span = (this.gull ? 0.75 : 0.62) * sc;   // (a little larger than life: they are seen from far above)
          for (const m of f.m) {
            if (b >= this.n) break;
            m.fl -= dt; if (m.fl < -1.6) m.fl = 1 + Math.random() * 1.6;   // beating (fl > 0), then gliding
            const flap = m.fl > 0 ? Math.sin(m.ph += dt * (this.gull ? 9 : 13)) * 0.55 : 0.12, lift = Math.sin(flap) * span;
            const x = f.x + ch * m.fw - sh * m.sd, z = f.z + sh * m.fw + ch * m.sd, y = f.y + m.up + Math.sin((m.bob += dt * 1.3)) * 0.25;
            const pt = (fw, sd, up, o) => { P[o] = x + ch * fw - sh * sd; P[o + 1] = y + up; P[o + 2] = z + sh * fw + ch * sd; };
            const o = b * 27;
            pt(0.34 * sc, 0, 0, o); pt(-0.3 * sc, -0.06 * sc, 0, o + 3); pt(-0.3 * sc, 0.06 * sc, 0, o + 6);                     // body
            pt(0.13 * sc, 0.04 * sc, 0, o + 9); pt(-0.15 * sc, 0.04 * sc, 0, o + 12); pt(-0.08 * sc, span, lift, o + 15);          // right wing
            pt(0.13 * sc, -0.04 * sc, 0, o + 18); pt(-0.15 * sc, -0.04 * sc, 0, o + 21); pt(-0.08 * sc, -span, lift, o + 24);      // left wing
            b++;
          }
        }
      }
      for (let k = b * 27; k < this.n * 27; k++) P[k] = 0;
      this.attr.needsUpdate = true;
    }
  }

  /* ---------------- module state ---------------- */
  let envTex = null, renderer, scene, camera, sun, hemi, tex, world = null, sparkP = null, glows = null, curTrack = null, curRace = null;
  const DUST0 = { rate: 1, life: 1, size: 1, s0: 1, rise: 1, alpha: 1, drag: 1, col: [0.84, 0.69, 0.48] };
  const SNOW_DUST = [0.93, 0.95, 0.99];   // (winter: the powder snow off a gravel road)   // the dust cloud off gravel and dirt (a track's def.dust overrides it)
  let dust = null;
  const debrisMeshes = [];
  let particles, skids, views = [];
  let rain = null, wet = -1, wetW = -1, dryLn = null, themeId = 'lake', birds = null, streaks = null, splash = null, pud = null;   // rain streaks; the weather drawn now (race.rain, the rain, and race.water, the water on the road; -1: not applied yet), the dry racing line, the world's theme
  let basePR = 1, dynScale = 1, saverK = 1;   // (saverK: the battery saver's lower resolution, setSaver)
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
    cgMat(matCar, false, 'carCg');   // (and the sun's glint)
    // the wheels: matte rubber, metal rims (grey and light: the sky in them, in the colour of the race's sky, and a glint of the sun)
    matWheel = new THREE.MeshPhongMaterial({ vertexColors: true, envMap: envTex, combine: THREE.MixOperation, reflectivity: 0.4, specular: 0x8c8c8c, shininess: 60 });
    matWheel.onBeforeCompile = (sh) => {
      sh.uniforms.uCgEnv = CGU.env;
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uCgEnv;')
        .replace('#include <specularmap_fragment>', '#include <specularmap_fragment>\nspecularStrength = smoothstep(0.22, 0.5, dot(vColor.rgb, vec3(0.3333))) * (1.0 - smoothstep(0.08, 0.2, max(vColor.r, max(vColor.g, vColor.b)) - min(vColor.r, min(vColor.g, vColor.b))));')
        .replace('#include <envmap_fragment>', THREE.ShaderChunk.envmap_fragment.replace('#ifdef ENVMAP_BLENDING_MULTIPLY', 'envColor.rgb *= uCgEnv;\n#ifdef ENVMAP_BLENDING_MULTIPLY'));
    };
    matWheel.customProgramCacheKey = () => 'wheelRim';
    matTailOff = new THREE.MeshLambertMaterial({ color: 0x6a1212 });
    matTailOn = new THREE.MeshBasicMaterial({ color: 0xff2a1a });
    matBlob = new THREE.MeshBasicMaterial({ map: tex.blob, transparent: true, depthWrite: false, opacity: 0.8 });
    matBlobS = new THREE.MeshBasicMaterial({ map: carShadowTex(), transparent: true, depthWrite: false, opacity: 0.9 });   // (no shadow maps: the car's own shadow, see updateCars)
    matMarker = new THREE.MeshBasicMaterial({ color: 0xffd23f });
    matScOn = new THREE.MeshBasicMaterial({ color: 0xffa21a }); matScOff = new THREE.MeshLambertMaterial({ color: 0x4a3312 });   // (the safety car's lamps)
    particles = new Particles(2400); scene.add(particles.points);
    sparkP = new Particles(700, true); scene.add(sparkP.points);
    glows = new Glows(10 * 16 + 240); scene.add(glows.points);   // (the race's cars, up to three points a lamp at night; the open road's traffic and patrol cars)
    skids = new Skids(8000); scene.add(skids.mesh);
    rain = new Rain(3200); scene.add(rain.mesh);
    streaks = new Streaks(420); scene.add(streaks.mesh); splash = new Splashes(360); scene.add(splash.mesh);   // (the wet road: the lights' reflections, the drops' splashes)
    snow = new Snow(2600); scene.add(snow.mesh);
    birds = new Birds(16); scene.add(birds.mesh);
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
    world = World.build(scene, track, tex, { density, season: atmos.season });   // (a world may paint itself for the season: Vršič)
    if (!world.farClip && camera.far !== 700) { camera.far = 700; camera.updateProjectionMatrix(); }
    applyTheme((track.def && track.def.theme) || 'lake'); wet = wetW = -1;   // (the weather again on the new world's road)
    curTrack = track; seasonWorld(); floodlights(); litWindows(); asphaltWorld();   // (the season and the time of day on the new world; the asphalt's sheen)
    if (dryLn) { scene.remove(dryLn); dryLn.geometry.dispose(); dryLn.material.dispose(); dryLn = null; }
    if (pud) { scene.remove(pud); pud.geometry.dispose(); pud.material.dispose(); pud = null; } splash.clear();
    birds.reset(!!(track.def && (track.def.sea || track.def.theme === 'monaco')));   // (gulls by the sea)
    valleyFog(); rainbow(false); setMarks(null);   // (the morning mist, no rainbow or school marks from the last world)
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
  function floorAt(x, z, hint) { const T = curRace && curRace.track, f = curRace && curRace.propFloor; if (!T || (!T.hasElev && !f)) return 0; const q = T.query(x, z, (T.cross.length || T.stubs) && hint >= 0 ? hint : -1, _fq); return q.k >= 0 && q.fb > 0 ? q.y : (T.hasElev ? T.elevAt(q.s).y : 0) + (f ? f(q) : 0); }   // particle floor: the road height there (0 on the flat circuits; the verge's where it lies lower; a side road's own)
  function syncProps() {
    if (!curRace || !curRace.props) return;
    const E = curRace.propEvents;
    if (E && E.length) {   // a puff where something got knocked: straw for bales, dust and rubber crumbs for tyres, a little dust for the rest
      for (const e of E) { const k = e.kind, straw = k === 'bale' || k === 'bstack' || k === 'rbale' || k === 'rbstack', rub = k === 'tyre' || k === 'tstack', n = straw ? 14 : rub ? 8 : 4, sp = Math.min(6, 1.5 + e.v * 0.15), fy = floorAt(e.x, e.z, e.i);
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
    renderer.setPixelRatio(basePR * dynScale * saverK);
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
    ouni:     { fog: 0xc4d3dc, sun: 0xffe9c6, sunI: 1.18, sky: 0xcfe1f5, gnd: 0x4a5a2e, hemiI: 0.56, tint: [1.02, 1.0, 0.97], sat: 1.1, sunOff: [-88, 72, 58] },   // Ouninpohja: a clear Finnish August afternoon, a warm sun lower in the west (the forest's long shadows across the road), soft haze over the lakes
    vrsic:    { fog: 0xc6d4e0, sun: 0xffe8c4, sunI: 1.16, sky: 0xcfe0f4, gnd: 0x55603a, hemiI: 0.58, tint: [1.02, 1.0, 0.96], sat: 1.12, sunOff: [-84, 70, 56] },   // Vršič: a clear afternoon in the Julian Alps, a lower sun (long shadows across the hairpins), a crisp blue haze (in autumn the season's warmer light)
    katu:     { fog: 0xc9d5dd, sun: 0xfff0d4, sunI: 1.2, sky: 0xc9dcf3, gnd: 0x6b6040, hemiI: 0.58, tint: [1.03, 1.0, 0.96], sat: 1.12, sunOff: [96, 76, 18] },   // Katu-Jaryk: a clear Altai summer morning, the sun in the east over the canyon (the hairpins' shadows falling down the slope), a light blue haze
    pikes:    { fog: 0xdfd0cc, sun: 0xffcc8f, sunI: 1.58, sky: 0x9fbbf1, gnd: 0x70604e, hemiI: 0.75, tint: [1.05, 1.0, 0.925], sat: 1.13, haze: 0.25, hazeCol: [1, 0.77, 0.48], sunOff: [104, 48, -60] },   // early morning on race day: a low golden sun from the east-north-east (long shadows down the slopes, its warm glow at the edge of the view when it is ahead), cool blue shade from the clear sky, a light warm haze over the valleys
    nring:    { fog: 0xb7c7cc, sun: 0xfff0d8, sunI: 1.1, sky: 0xcadcf0, gnd: 0x3e4a2a, hemiI: 0.6, tint: [1.03, 1.0, 0.95], sat: 1.04, sunOff: [-80, 76, 70] },   // the Eifel: a summer afternoon over the 'green hell' (a lower sun: longer shadows)
    spa:      { fog: 0xc3ced7, sun: 0xfff1de, sunI: 0.98, sky: 0xd0dde9, gnd: 0x43522f, hemiI: 0.64, tint: [0.99, 1.0, 1.01], sat: 1.1 },   // the Ardennes: a little greyer, softer daylight (Spa's changeable weather)
    rbring:   { fog: 0xc6daea, sun: 0xfff1d8, sunI: 1.12, sky: 0xcfe3fb, gnd: 0x46602c, hemiI: 0.6, tint: [1.02, 1.0, 0.97], sat: 1.06, sunOff: [-86, 78, 52] },   // Styria in early summer, an afternoon sun (longer shadows): clear alpine air, fresh meadows, dark spruce woods
    harju:    { fog: 0xcdd5dc, sun: 0xffcf96, sunI: 1.65, sky: 0xbad0ee, gnd: 0x58553f, hemiI: 0.58, tint: [1.02, 1.0, 0.97], sat: 1.1, haze: 0.16, hazeCol: [1, 0.82, 0.6], sunOff: [-100, 33, -8], skyTop: 0x3d74c4, skyK: 0.72, skyWarm: 0xf3dcb2, skyWarmK: 0.7, sunDist: 190 },   // Harju at 19:05 on a late-July evening: the sun 18 degrees up just north of west (as on 31 July), shadows three times as long as the pines and the blocks across the streets, a warm sun and cool shade, the clear blue sky of a Finnish summer evening with a warm glow towards the sun
    suzuka:   { fog: 0xc8d9e6, sun: 0xfff1dc, sunI: 1.06, sky: 0xd5e7fa, gnd: 0x4f5c34, hemiI: 0.62, tint: [1.01, 1.0, 0.99], sat: 1.12 },   // Suzuka: a clear spring day in Mie
    caracoles: { fog: 0xc2d3e8, sun: 0xfff3de, sunI: 1.32, sky: 0xb4cdf2, gnd: 0x6e5e4c, hemiI: 0.6, tint: [1.02, 1.0, 0.97], sat: 1.07, sunOff: [-72, 98, -62] },   // Los Caracoles: a clear afternoon of the Andean summer, the thin air's strong sun from the north-west (the southern hemisphere), a cool blue haze
    bathurst: { fog: 0xcfdbe6, sun: 0xfff0d2, sunI: 1.22, sky: 0xc6dcf6, gnd: 0x6b6a3c, hemiI: 0.6, tint: [1.03, 1.0, 0.95], sat: 1.05, sunOff: [-74, 86, -56] },   // Bathurst: a clear spring afternoon in New South Wales, the sun from the north-west (the southern hemisphere), the dry pastures' golden light
    chapman:  { fog: 0xc9dbe8, sun: 0xfff0d6, sunI: 1.24, sky: 0xbcd6f4, gnd: 0x5e5a40, hemiI: 0.62, tint: [1.02, 1.0, 0.97], sat: 1.1, sunOff: [-92, 74, -40] },   // Chapman's Peak: a clear late-summer afternoon at the Cape, the sun low over the Atlantic in the west-north-west, a soft sea haze
    bigsur:   { fog: 0xc8d6e2, sun: 0xfff0d8, sunI: 1.14, sky: 0xc6dcf2, gnd: 0x5c6040, hemiI: 0.62, tint: [1.02, 1.0, 0.97], sat: 1.08, sunOff: [-86, 74, 58] },   // Big Sur: a clear afternoon on the coast, the sun over the Pacific in the south-west, a soft sea haze
    tianmen:  { fog: 0xc9d2d4, sun: 0xfff0dc, sunI: 1.02, sky: 0xd4dfe6, gnd: 0x4a5636, hemiI: 0.68, tint: [1.0, 1.0, 0.99], sat: 1.04, haze: 0.12, hazeCol: [0.92, 0.95, 1.0], sunOff: [-70, 92, 60] },   // Tianmen: a humid subtropical day, the sun veiled by the mist, a pale grey-green haze over the cliffs
    sani:     { fog: 0xc8d6e4, sun: 0xfff0d8, sunI: 1.28, sky: 0xb8d0f0, gnd: 0x5e5a40, hemiI: 0.6, tint: [1.02, 1.0, 0.97], sat: 1.08, sunOff: [-70, 92, -58] },   // Sani Pass: a clear afternoon in the Drakensberg, the high sun in the north (the southern hemisphere)
    iroha:    { fog: 0xc9d6df, sun: 0xffecc8, sunI: 1.12, sky: 0xd0e0f0, gnd: 0x4c5a32, hemiI: 0.6, tint: [1.02, 1.0, 0.97], sat: 1.12, sunOff: [-80, 74, 60] },   // Irohazaka: a clear afternoon above Nikko, a lower sun through the woods (long shadows across the hairpins), a soft blue haze over the valley
    mulholland: { fog: 0xd8d4c8, sun: 0xfff0d2, sunI: 1.4, sky: 0xb8d2f0, gnd: 0x7a6a48, hemiI: 0.62, tint: [1.04, 1.0, 0.94], sat: 1.06, sunOff: [-70, 104, 48] },   // Mulholland Highway: a hot, clear Californian summer afternoon, a strong high sun from the south-west, a warm dusty haze over the canyons
    beartooth: { fog: 0xc6d7e8, sun: 0xfff1da, sunI: 1.26, sky: 0xb3cdf0, gnd: 0x4c5636, hemiI: 0.6, tint: [1.01, 1.0, 0.98], sat: 1.08, sunOff: [-84, 90, 58] },   // Beartooth: a clear summer afternoon in the northern Rockies, the sun from the south-west (shadows across the switchbacks), thin blue mountain haze
    rastro:   { fog: 0xc4d0d0, sun: 0xfff0d8, sunI: 1.1, sky: 0xc2d4e6, gnd: 0x4a5a32, hemiI: 0.66, tint: [1.0, 1.01, 0.98], sat: 1.08, sunOff: [-66, 92, -64] },   // Serra do Rio do Rastro: a humid afternoon over the rainforest, the sun from the north-west (the southern hemisphere), a soft green-grey haze
    moki:     { fog: 0xc9d6e6, sun: 0xffeccc, sunI: 1.3, sky: 0x8fb6ee, gnd: 0x8a5a3c, hemiI: 0.62, tint: [1.03, 1.0, 0.96], sat: 1.1, sunOff: [-86, 82, 46] },   // the Moki Dugway: a clear afternoon over the Utah desert, a deep blue sky, the warm sun from the south-west (the cliff's red light bounced into the shade)
    riverside: { fog: 0xd6dde4, sun: 0xfff0d6, sunI: 1.3, sky: 0xbcd4f2, gnd: 0x8a7650, hemiI: 0.62, tint: [1.02, 1.0, 0.96], sat: 1.05, haze: 0.06, hazeCol: [1, 0.88, 0.72], sunOff: [-70, 74, 78] },   // Riverside: a clear, dry afternoon in southern California, the sun from the south-west, a little dust in the warm haze
  };
  // each track's own grade on top (high quality, the post pass): its shadows and its highlights tinted apart, a little (split toning:
  // [shadows], [highlights]); cool shade and a warm sun mostly, the Riviera's teal and gold, Toskana's golden light, Spa's greyer air
  const SPLIT = {
    lake: [[0.97, 1.0, 1.05], [1.03, 1.0, 0.96]], city: [[0.95, 1.0, 1.05], [1.05, 1.0, 0.93]], ljubljana: [[0.98, 0.99, 1.04], [1.04, 1.0, 0.95]], forest: [[0.98, 1.0, 1.03], [1.02, 1.0, 0.98]],
    italia: [[1.0, 0.98, 1.02], [1.05, 1.01, 0.92]], kamp: [[0.98, 1.0, 1.03], [1.03, 1.0, 0.96]], monaco: [[0.95, 1.0, 1.05], [1.05, 1.0, 0.93]], mountain: [[0.95, 0.99, 1.06], [1.02, 1.0, 0.97]],
    ouni: [[0.97, 1.01, 1.03], [1.03, 1.0, 0.96]], vrsic: [[0.96, 0.99, 1.06], [1.04, 1.0, 0.94]], pikes: [[0.96, 0.99, 1.06], [1.03, 1.0, 0.95]], nring: [[0.97, 1.01, 1.02], [1.02, 1.0, 0.97]],
    spa: [[0.97, 1.0, 1.04], [1.01, 1.0, 0.99]], rbring: [[0.96, 1.0, 1.05], [1.03, 1.0, 0.96]], suzuka: [[0.98, 1.0, 1.03], [1.03, 1.0, 0.97]], caracoles: [[0.95, 0.99, 1.07], [1.04, 1.0, 0.95]], bathurst: [[0.96, 1.0, 1.05], [1.05, 1.01, 0.93]],
    chapman: [[0.96, 1.0, 1.06], [1.04, 1.0, 0.95]],
    tianmen: [[0.97, 1.0, 1.03], [1.02, 1.0, 0.98]],
    sani: [[0.96, 1.0, 1.05], [1.04, 1.0, 0.95]],
    moki: [[0.95, 0.99, 1.07], [1.05, 1.0, 0.94]],
    riverside: [[0.96, 0.99, 1.05], [1.06, 1.01, 0.92]] };
  THEMES.uncompahgre = { fog: 0xbfcfe0, sun: 0xfff0d8, sunI: 1.24, sky: 0xb8d0f0, gnd: 0x4c5236, hemiI: 0.6, tint: [1.02, 1.0, 0.97], sat: 1.1, sunOff: [-70, 92, 62] };   // the Uncompahgre Gorge: a clear afternoon in the San Juans, the sun from the south-west over the cliffs, a crisp blue haze
  SPLIT.uncompahgre = [[0.96, 0.99, 1.06], [1.04, 1.0, 0.95]];
  SPLIT.iroha = [[0.96, 0.99, 1.05], [1.04, 1.0, 0.95]];   // (Irohazaka: cool shade under the maples, a warm autumn sun)
  const _c1 = new THREE.Color(), _c2 = new THREE.Color();
  // The time of day as one number, todK: 0 day, 0.5 dusk, 1 night (setAtmos sets it from the setting; an endurance race moves it with its
  // clock: setTodK). The light, the fog and the grade are blended between the day's (the theme's), the dusk's and the night's; dawn (the
  // morning: 'dawn') is a dusk of its own, a low cool-pink sun from the other side and mist in the valleys
  let todK = 0, dawn = false;
  const _st = () => ({ fog: new THREE.Color(), sky: new THREE.Color(), gnd: new THREE.Color(), sunC: new THREE.Color(), hemiI: 0, sunI: 0, off: [0, 0, 0], tint: [1, 1, 1], sat: 1, uHaze: 0, postHaze: 0, hazeCol: [1, 0.8, 0.6],
    shT: [1, 1, 1], hiT: [1, 1, 1], bloom: 0, bThr: 0.8, lit: [1, 1, 1] });   // (split toning: the shadows' and the highlights' tint; the lights' glow; the smoke's light)
  const TD = [_st(), _st(), _st()];
  function blendSt(a, b, u, o) {   // o = a..b at u
    o.fog.copy(a.fog).lerp(b.fog, u); o.sky.copy(a.sky).lerp(b.sky, u); o.gnd.copy(a.gnd).lerp(b.gnd, u); o.sunC.copy(a.sunC).lerp(b.sunC, u);
    const L = (x, y) => x + (y - x) * u;
    o.hemiI = L(a.hemiI, b.hemiI); o.sunI = L(a.sunI, b.sunI); o.sat = L(a.sat, b.sat); o.uHaze = L(a.uHaze, b.uHaze); o.postHaze = L(a.postHaze, b.postHaze); o.bloom = L(a.bloom, b.bloom); o.bThr = L(a.bThr, b.bThr);
    for (let k = 0; k < 3; k++) { o.off[k] = L(a.off[k], b.off[k]); o.tint[k] = L(a.tint[k], b.tint[k]); o.hazeCol[k] = L(a.hazeCol[k], b.hazeCol[k]); o.shT[k] = L(a.shT[k], b.shT[k]); o.hiT[k] = L(a.hiT[k], b.hiT[k]); o.lit[k] = L(a.lit[k], b.lit[k]); }
    return o;
  }
  const _bl = _st();
  function applyTheme(id) {
    const t = THEMES[id] || THEMES.lake, r = Math.max(0, wet); themeId = id;
    // rain: an overcast sky (grey haze, a weak sun, more light from the whole sky), a cooler, paler grade
    const mix = (hex, to, k) => _c1.setHex(hex).lerp(_c2.setHex(to), k * r), [D, K, N] = TD, s0 = t.sunOff || [-80, 96, 70];   // (low evening sun where the theme asks for it: long shadows)
    D.fog.copy(mix(t.fog, 0x949ea7, 0.75)); D.sky.copy(mix(t.sky, 0xaab4bd, 0.7)); D.gnd.copy(mix(t.gnd, 0x3a4032, 0.5)); D.sunC.copy(mix(t.sun, 0xe8eef4, 0.8));
    D.hemiI = t.hemiI * (1 + 0.3 * r); D.sunI = t.sunI * (1 - 0.62 * r); D.off = s0.slice(); D.tint = [t.tint[0] - 0.03 * r, t.tint[1], t.tint[2] + 0.03 * r]; D.sat = t.sat * (1 - 0.2 * r);
    D.uHaze = 0; D.postHaze = (t.haze || 0) * (1 - r); D.hazeCol = t.hazeCol ? t.hazeCol.slice() : [1, 0.8, 0.6];
    { const S = SPLIT[id] || SPLIT.lake, k = 1 - 0.6 * r; for (let i = 0; i < 3; i++) { D.shT[i] = 1 + (S[0][i] - 1) * k; D.hiT[i] = 1 + (S[1][i] - 1) * k; } }   // (the track's own grade; the rain's grey: flatter)
    D.bloom = 0; D.bThr = 0.8; D.lit = [1, 1, 1];
    // dusk: a low orange sun and a warm haze, the shade lit by the rosy sky (a little cooler than the sun, not black); dawn: a low pink-gold sun
    // from the other side of the sky, a cool mist; night: a dark blue sky and a weak moon (the floodlights and headlights do the rest). At dusk
    // and at night the lights glow (only what is brighter than the sky at dusk), the smoke and dust warm at dusk, dark and blue at night
    const to = (c, hex, k) => c.lerp(_c2.setHex(hex), k);
    K.fog.copy(D.fog); K.sky.copy(D.sky); K.gnd.copy(D.gnd); K.sunC.copy(D.sunC); K.sat = D.sat; K.postHaze = D.postHaze; K.bThr = 0.8;
    if (dawn) {
      to(K.fog, 0xd9c6cf, 0.5); to(K.sky, 0xd2c4e6, 0.35); to(K.sunC, 0xffc58e, 0.6); K.hemiI = D.hemiI * 0.82; K.sunI = D.sunI * 0.8;
      K.off = [-s0[0] * 1.6, 34, -s0[2] * 1.6]; K.tint = [1.02, 0.98, 1.04]; K.uHaze = 0.24 * (1 - r); K.hazeCol = [1, 0.74, 0.62];
      K.shT = [0.98, 0.97, 1.04]; K.hiT = [1.04, 0.99, 0.97]; K.bloom = 0.2; K.lit = [0.98, 0.9, 0.88];
    } else {
      to(K.fog, 0xeea070, 0.55); to(K.sky, 0xc49ab8, 0.34); to(K.gnd, 0x6a4430, 0.3); to(K.sunC, 0xff8a40, 0.74); K.hemiI = D.hemiI * 0.84; K.sunI = D.sunI;
      K.off = [s0[0] * 1.6, 30, s0[2] * 1.6]; K.tint = [1.1, 0.97, 0.86]; K.uHaze = 0.34 * (1 - r); K.hazeCol = [1, 0.6, 0.32];
      K.shT = [0.97, 0.96, 1.04]; K.hiT = [1.07, 0.99, 0.88]; K.bloom = 0.5; K.lit = [0.97, 0.85, 0.74];
    }
    N.fog.setHex(0x070b16); N.sky.setHex(0x26324f); N.gnd.setHex(0x06080b); N.sunC.setHex(0x93aaff); N.hemiI = 0.55; N.sunI = 0.2 * (1 - 0.6 * r);
    N.off = [-40, 110, 60]; N.tint = [0.86, 0.93, 1.12]; N.sat = D.sat * 0.85; N.uHaze = 0; N.postHaze = 0; N.hazeCol = K.hazeCol.slice();   // (no sun glow at night, not even Pikes Peak's)
    N.shT = [1, 1, 1]; N.hiT = [1.02, 1.0, 0.97]; N.bloom = 1.05 + 0.25 * r; N.bThr = 0.62; N.lit = [0.36, 0.4, 0.5];   // (the lamps' light a little warm)
    const B = todK <= 0.5 ? blendSt(D, K, todK / 0.5, _bl) : blendSt(K, N, (todK - 0.5) / 0.5, _bl);
    scene.fog.color.copy(B.fog); hemi.color.copy(B.sky); hemi.groundColor.copy(B.gnd); hemi.intensity = B.hemiI; sun.color.copy(B.sunC); sun.intensity = B.sunI; sunOff = B.off.slice();
    let sat = B.sat, tint = B.tint.slice();
    // the season on top: winter a paler, colder light (by day and at dusk), an autumn day a warmer sun
    const A = atmos, wW = todK <= 0.5 ? 1 : 1 - (todK - 0.5) / 0.5, wA = todK < 0.5 ? 1 - todK / 0.5 : 0;
    if (A.season === 'winter' && wW > 0) { to(scene.fog.color, 0xdfe6ee, 0.4 * wW); to(sun.color, 0xeef3ff, 0.5 * wW); hemi.intensity *= 1 + 0.12 * wW; sat *= 1 - 0.12 * wW; }
    if (A.season === 'autumn' && wA > 0 && !t.season) { to(sun.color, 0xffd9a8, 0.3 * wA); for (let k = 0; k < 3; k++) tint[k] += ([1.04, 0.99, 0.93][k] - tint[k]) * wA; }
    renderer.setClearColor(scene.fog.color, 1);
    if (post) { const U = post.mat.uniforms; U.uTint.value.set(tint[0], tint[1], tint[2]); U.uSat.value = sat; post.haze = B.postHaze; post.hk = 0; U.uHaze.value = B.uHaze; U.uHazeCol.value.set(B.hazeCol[0], B.hazeCol[1], B.hazeCol[2]);
      U.uShT.value.set(B.shT[0], B.shT[1], B.shT[2]); U.uHiT.value.set(B.hiT[0], B.hiT[1], B.hiT[2]); post.bloom = B.bloom; post.bl.bright.uniforms.uThr.value = B.bThr; }
    if (particles && particles.mat.uniforms.uLit) particles.mat.uniforms.uLit.value.set(B.lit[0], B.lit[1], B.lit[2]);
    storm.base = { fog: scene.fog.color.clone(), hemiI: hemi.intensity }; storm.f = 0;   // (a lightning flash lights up from this)
  }
  // the weather of the race on screen (race.rain 0..1): the sky and the streaks
  function applyWeather(r) {
    wet = r; applyTheme(themeId); rain.mesh.visible = r > 0 && atmos.season !== 'winter'; rain.mat.uniforms.uA.value = 0.5 * Math.min(1, r * 1.5);
    snow.mesh.visible = r > 0 && atmos.season === 'winter';
    birds.mesh.visible = !(r > 0); if (r > 0) birds.reset(birds.gull);   // (no birds in the rain)
    if (!world || !world.root) return;
    if (world.dyn.clouds) world.dyn.clouds.K.value = world.dyn.clouds.k0 * (1 - r);   // (no cloud shadows under the rain's overcast)
  }
  // the water on the road (race.water 0..1: with the rain, or still wet after it, see Race._weather): a darker road (asphalt, paving, kerbs,
  // makadam: every material of the world with one of those textures, back to its own colour when dry)
  function applyRoad(w) {
    wetW = w;
    if (!world || !world.root) return;
    if (!world.wetMats) {   // (found once per world)
      const maps = [tex.asphalt, tex.paving, tex.curb, tex.makadam].filter(Boolean), L = world.wetMats = [];
      world.root.traverse(o => { for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) {
        if (!m.color || !(maps.includes(m.map) || m.userData.wear) || L.includes(m)) continue;   // (and the road's wear: its patches and cracks)
        if (!m.userData.dry) m.userData.dry = m.color.clone();
        L.push(m); } });
    }
    for (const m of world.wetMats) m.color.copy(m.userData.dry).multiplyScalar(1 - (m.map === tex.curb ? 0.22 : 0.36) * w);
    const W = world.dyn.wet;   // (a gravel stage with a road of its own, Ouninpohja: its puddles show, the gravel darkens and glistens, the verges darken)
    if (W) { W.puddles.visible = w > 0; W.road.color.setScalar((1 - 0.36 * w) * (atmos.season === 'winter' ? 0.86 : 1)); W.road.shininess = w > 0 ? 28 : W.base.sh; W.road.specular.setHex(w > 0 ? 0x3c3e40 : W.base.sp); W.ground.color.setScalar(1 - 0.2 * w); }
  }
  // the dry line (a changing weather, Race opts weather: after the rain the racing line dries first): a band of dry road along it, as light as
  // the line is drier than the rest of the road. One mesh along the whole lap, built the first time it shows
  function dryLine(R) {
    const W = R && R.wst, T = R && R.track, k = W && W.wx && T && !T.open && T.rl ? clamp((W.water - W.line) * 2.4, 0, 1) : 0;
    if (k > 0.01 && !dryLn && world) {
      const N = T.N, st = N > 6000 ? 2 : 1, n = Math.ceil(N / st) + 1, O = [-1.7, -0.95, 0.95, 1.7], A = [0, 1, 1, 0];
      const pos = new Float32Array(n * 12), col = new Float32Array(n * 16), uv = new Float32Array(n * 8), idx = [], bk = { dy: 0, sl: 0 };
      for (let j = 0; j < n; j++) {
        const i = (j * st) % N, s = i * T.ds, rl = T.rl[i];
        for (let v = 0; v < 4; v++) {
          const o = rl + O[v], b = j * 4 + v; let y = (T.hasElev && T.hy ? T.hy[i] : 0) + 0.03;
          if (T.bank) y += T.bankAt(s, o, bk).dy;
          pos[b * 3] = T.px[i] + T.nx[i] * o; pos[b * 3 + 1] = y; pos[b * 3 + 2] = T.pz[i] + T.nz[i] * o;
          col[b * 4] = col[b * 4 + 1] = col[b * 4 + 2] = 0.95; col[b * 4 + 3] = A[v];
          uv[b * 2] = o / 7; uv[b * 2 + 1] = j * st * T.ds / 7;
        }
        if (j < n - 1) for (let v = 0; v < 3; v++) { const a = j * 4 + v, c = a + 4; idx.push(a, a + 1, c, a + 1, c + 1, c); }   // (facing up)
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 4)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
      g.computeVertexNormals();
      const base = world.asphaltMat, m = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
      if (base) m.color.copy(base.userData.dry || base.color); asphaltLook(m);
      dryLn = new THREE.Mesh(g, m); dryLn.receiveShadow = true; dryLn.renderOrder = 1; dryLn.matrixAutoUpdate = false; scene.add(dryLn);
    }
    if (dryLn) { dryLn.visible = k > 0.01; dryLn.material.opacity = k; }
  }

  // the rain's splashes (Splashes) on the road round the view's centre: so many drops a second as it rains, where they fall on the road
  // (the track's own height there); not in the snow. Their places from a generator of their own (Math.random is left to the race)
  const _bk = { dy: 0, sl: 0 }, _sq = {}; let spR = 91;
  const spRnd = () => (spR = (spR * 16807) % 2147483647) / 2147483647;
  function rainFx(dt, target) {
    const T = curTrack, on = rain.mesh.visible && !!T && !!target;
    splash.mesh.visible = on; if (!on) return;
    const U = splash.mat.uniforms, R = lastMode === 'cockpit' ? 12 : lastMode === 'chase' ? 22 : 30, cx = cam.vcx || 0, cz = cam.vcz || 0;
    U.uT.value = time; U.uScale.value = particles.mat.uniforms.uScale.value; U.uA.value = 0.62 * Math.min(1, wet * 1.5) * (atmos.tod === 'night' ? 0.55 : atmos.tod === 'dusk' ? 0.8 : 1);
    splash.acc = Math.min(40, splash.acc + dt * 300 * Math.min(1, wet * 1.3) * (R / 22) ** 2);
    const hint = target.q && target.q.a >= 0 ? target.q.a : -1;
    for (; splash.acc >= 1; splash.acc -= 1) {
      const x = cx + (spRnd() - 0.5) * 2 * R, z = cz + (spRnd() - 0.5) * 2 * R, q = T.query(x, z, hint, _sq);
      if (Math.abs(q.d) > T.w + 0.6) continue;   // (on the road only)
      let y = T.hasElev && T.hy ? T.hy[q.a] : 0; if (T.bank) y += T.bankAt(q.s, q.d, _bk).dy;
      splash.put(x, y + 0.04, z, time);
    }
    splash.flush();
  }
  // puddles on a circuit's tarmac in the rain: along the edges (the water runs off the camber) and now and then in a dip, a sheet of water
  // mirroring the sky (light by day, dark at night: the lights' reflections do the rest), growing in as the road gets wetter and gone when
  // it dries. One mesh along the whole lap, built the first time the road is wet enough; not on a gravel road (Ouninpohja: its own)
  let pudTex = null;
  function puddleTex() {   // four puddle shapes (a 2 x 2 atlas): a ragged edge, a little lighter towards it
    const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), img = g.createImageData(S, S), d = img.data;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const k = (i >> 6) + 2 * (j >> 6), u = ((i & 63) + 0.5) / 32 - 1, v = ((j & 63) + 0.5) / 32 - 1, a = Math.atan2(v, u), r = Math.hypot(u, v), o = (j * S + i) * 4;
      const e = 0.7 + 0.1 * Math.sin(a * 2 + k * 1.7) + 0.07 * Math.sin(a * 5 + k * 2.9) + 0.035 * Math.sin(a * 11 + k * 0.7), al = clamp((e - r) / 0.1, 0, 1);
      d[o] = d[o + 1] = d[o + 2] = Math.round(255 * (0.86 + 0.14 * Math.min(1, r / e))); d[o + 3] = Math.round(255 * al);
    }
    g.putImageData(img, 0, 0); return new THREE.CanvasTexture(c);
  }
  function buildPuddles(T) {
    const pos = [], uv = [], idx = [], P = (s, o) => { const i = T.idx(s); let y = (T.hasElev && T.hy ? T.hy[i] : 0) + 0.035; if (T.bank) y += T.bankAt(s, o, _bk).dy; pos.push(T.px[i] + T.nx[i] * o, y, T.pz[i] + T.nz[i] * o); };
    for (let s = 7; s < T.len - 7; s += 8) {
      const h = hash3(s * 0.137 + 5); if (h < 0.45) continue;
      const mid = hash3(s * 0.71 + 3) < 0.12, sd = hash3(s * 0.29 + 1) < 0.5 ? -1 : 1, L = 1.8 + 4 * hash3(s * 0.53 + 7), W = Math.min(0.8 + 1.4 * hash3(s * 0.91 + 2), T.w * 0.5);
      const o = mid ? (hash3(s * 0.37 + 9) - 0.5) * T.w * 0.7 : sd * (T.w - 0.25 - W / 2 - 0.8 * hash3(s * 0.43 + 4)), b = pos.length / 3, k = Math.floor(hash3(s * 0.19 + 8) * 4), cu = (k & 1) * 0.5, cv = (k >> 1) * 0.5;
      P(s - L / 2, o - W / 2); P(s - L / 2, o + W / 2); P(s + L / 2, o + W / 2); P(s + L / 2, o - W / 2);
      uv.push(cu, cv, cu + 0.5, cv, cu + 0.5, cv + 0.5, cu, cv + 0.5);
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);   // (facing up)
    }
    if (!pudTex) pudTex = puddleTex();
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeBoundingSphere();
    // the water: a dark mirror (looking down into it, the wet asphalt under a film of water; towards the horizon the sky, more of it the
    // flatter the view: Fresnel), the drops' rings spreading on it while it rains (two layers of cells, a drop in each now and then)
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -3, fog: true,
      uniforms: Object.assign({ tMap: { value: pudTex }, uK: { value: 0 }, uHor: { value: new THREE.Color() }, uTop: { value: new THREE.Color() }, uDark: { value: new THREE.Color(0.055, 0.06, 0.068) }, uT: { value: 0 }, uRain: { value: 0 } }, THREE.UniformsLib.fog),
      vertexShader: '#include <fog_pars_vertex>\nvarying vec2 vUv; varying vec3 vW;\nvoid main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}',
      fragmentShader: '#include <fog_pars_fragment>\nuniform sampler2D tMap; uniform float uK; uniform vec3 uHor; uniform vec3 uTop; uniform vec3 uDark; uniform float uT; uniform float uRain; varying vec2 vUv; varying vec3 vW;\n' +
        'float pH(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }\n' +
        'float pRing(vec2 q, float t) { vec2 c = floor(q), f = fract(q) - 0.5 - (vec2(pH(c), pH(c + 7.3)) - 0.5) * 0.3; float h = pH(c + 3.1), ph = fract(t * (0.55 + 0.5 * h) + h), r = ph * 0.42;\n' +
        '  return smoothstep(0.05, 0.0, abs(length(f) - r)) * (1.0 - ph) * step(0.35, pH(c + floor(t * (0.55 + 0.5 * h) + h) * 1.7)); }\n' +
        'void main(){ vec4 t = texture2D(tMap, vUv); vec3 V = normalize(cameraPosition - vW); float cs = clamp(V.y, 0.0, 1.0), F = 0.04 + 0.96 * pow(1.0 - cs, 5.0);\n' +
        '  vec3 refl = mix(uHor, uTop, smoothstep(0.0, 0.6, cs));\n' +
        '  float rg = (pRing(vW.xz / 0.38, uT) + pRing(vW.xz / 0.3 + 11.7, uT * 1.13)) * uRain;\n' +
        '  vec3 c = mix(uDark, refl, clamp(F + 0.3 + rg * 0.4, 0.0, 1.0)) * (0.92 + 0.12 * t.r);\n' +
        '  gl_FragColor = vec4(c, t.a * uK);\n#include <fog_fragment>\n}' });
    const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 1; mesh.matrixAutoUpdate = false; mesh.visible = false; scene.add(mesh); return mesh;
  }
  function puddles(R) {
    const T = R && R.track, on = !!T && !T.open && T.def.roadSurface !== 'makadam' && !!world && wetW > 0.15;
    if (on && !pud) pud = buildPuddles(T);
    if (!pud) return;
    const k = on ? clamp((wetW - 0.15) / 0.45, 0, 1) : 0, night = atmos.tod === 'night';
    pud.visible = k > 0.01; if (!pud.visible) return;
    const U = pud.material.uniforms; U.uK.value = 0.88 * k; U.uT.value = time % 600; U.uRain.value = clamp(wet * 1.5, 0, 1);
    U.uHor.value.copy(scene.fog.color).multiplyScalar(night ? 0.8 : 1); skyTop(U.uTop.value);   // (the sky in the water)
  }

  /* ---------------- Pikes Peak's light (theme 'pikes'): softer shadows (the same shadow box and casters as elsewhere: no extra draw calls;
     a softer edge: a coarser map on high (PCF-soft), a wider PCF radius on normal; the bias set so the low sun leaves no acne on the slopes
     and no gap under the car) and the tone of the altitude: as the car climbs the air clears and the light cools (a whiter sun, a bluer sky and shade, a cooler, clearer fog, less of the low sun's warm haze); in the snow flurries near the summit a
     flatter, greyer light. Every frame from the road height, on top of what applyTheme set (the season, the time of day, the rain: taken
     again whenever applyTheme has run); half of it at dusk (the alpenglow stays), none at night. No draw calls ---------------- */
  const pkL = { on: false, T: null, y0: 0, y1: 1, b: null, w: [-1, -1, -1, -1, -1], t: 0 };
  function pkLight(target) {
    const on = themeId === 'pikes' && !!curTrack && !!world && !!curTrack.hy, S = sun.shadow;
    if (on !== pkL.on) { pkL.on = on; pkL.b = null;
      if (on) { S.bias = -0.0005; S.normalBias = 0.045; S.radius = 2.5; }
      else { S.bias = -0.0006; S.normalBias = 0.03; S.radius = 1; if (post) post.mat.uniforms.uCon.value = 1.04; pkRays(0); pkFlare(0); } }
    const ms = on ? (settings.quality === 'high' ? 1536 : 1024) : settings.quality === 'high' ? 2048 : 1024;   // (high: a softer PCF-soft edge, ~0.12 m texels)
    if (S.mapSize.x !== ms) { S.mapSize.set(ms, ms); if (S.map) { S.map.dispose(); S.map = null; } }
    if (!on) return;
    const T = curTrack, U = post && post.mat.uniforms, W = pkL.w, dt = clamp(time - pkL.t, 0, 0.25); pkL.t = time;
    if (pkL.T !== T) { pkL.T = T; pkL.y0 = T.hy[T.idx(T.startS)]; pkL.y1 = Math.max(pkL.y0 + 1, T.hy[T.idx(T.finishS)]); }
    if (!pkL.b || scene.fog.color.getHex() !== W[0] || sun.color.getHex() !== W[1] || hemi.color.getHex() !== W[2] || hemi.groundColor.getHex() !== W[3] || sun.intensity !== W[4])   // (applyTheme has run since)
      pkL.b = { fog: scene.fog.color.clone(), sun: sun.color.clone(), sunI: sun.intensity, sky: hemi.color.clone(), gnd: hemi.groundColor.clone(), hemiI: hemi.intensity, haze: post ? post.haze : 0, tint: U ? U.uTint.value.clone() : null, sat: U ? U.uSat.value : 1 };
    const b = pkL.b, A = atmos, tw = A.tod === 'night' ? 0 : A.tod === 'dusk' ? 0.45 : 1, gy = cam.gy || 0, u = clamp((gy - pkL.y0) / (pkL.y1 - pkL.y0), 0, 1), r = Math.max(0, wet);
    const k = u * (0.6 + 0.4 * u) * tw * (1 - 0.6 * r), sn = (world.dyn.pkWx ? world.dyn.pkWx.sU.uD.value : 0) * tw;   // k: the altitude's share (a little more towards the top); sn: the summit's snow flurries
    // (round 7) the run's weather on the way up (World's pkWeatherUpdate, from the race's seed, the season and the rain handed over here): mi the band of mist
    // the car is in (a greyer, closer haze, a veiled sun), fl the flurries up high (also at night: a closer haze)
    const wx = world.dyn.pkWx, mi = wx ? wx.mist || 0 : 0, fl = wx ? wx.fl || 0 : 0;
    if (wx) { const e = wx.env || (wx.env = {}); e.seed = curRace && curRace.opts ? curRace.opts.seed | 0 : 0; e.win = A.season === 'winter'; e.r = r; }
    // (round 6, by day only, fading out as the rain sets in) a warmer, softer, hazier valley morning and a colder, clearer, crisper summit:
    // lo the valley's share, hi the summit's
    const dW = A.tod === 'day' ? 1 - clamp(r * 4, 0, 1) : 0, lo = (1 - u) * (1 - u) * dW, hi = u * Math.sqrt(u) * dW * (1 - 0.7 * sn);
    // (dusk) the alpenglow: high up the setting sun turns pink-orange on the rocks and the snow (the faces towards it the most: the sun's own
    // light), the shade and the far valleys below a cool violet
    const ag = A.tod === 'dusk' ? Core.sstep(250, 325, gy) * (1 - clamp(r * 2, 0, 1)) : 0;
    scene.fog.color.copy(b.fog).lerp(_c2.setHex(A.season === 'winter' ? 0xd2def0 : 0xc6d8f0), 0.7 * k).lerp(_c2.setHex(0xd8dee6), 0.3 * sn);
    if (lo > 0) scene.fog.color.lerp(_c2.setHex(0xe8cdb4), 0.3 * lo); if (hi > 0) scene.fog.color.lerp(_c2.setHex(A.season === 'winter' ? 0xc4d6f2 : 0xb4cff4), 0.35 * hi);
    if (ag > 0) scene.fog.color.lerp(_c2.setHex(0xb49ab8), 0.4 * ag);
    if (mi > 0) scene.fog.color.lerp(_c2.setHex(A.tod === 'night' ? 0x1b2333 : A.tod === 'dusk' ? 0xbdb6ba : A.season === 'winter' ? 0xe4e8ec : 0xd8dde1), 0.75 * mi);
    renderer.setClearColor(scene.fog.color, 1);
    sun.color.copy(b.sun).lerp(_c2.setHex(0xfff7ee), 0.6 * k); sun.intensity = b.sunI * (1 + 0.06 * k) * (1 - 0.2 * sn);
    if (lo > 0) sun.color.lerp(_c2.setHex(0xffb466), 0.4 * lo); if (hi > 0) { sun.color.lerp(_c2.setHex(0xf2f6ff), 0.45 * hi); sun.intensity *= 1 + 0.1 * hi; }
    if (ag > 0) { sun.color.lerp(_c2.setHex(0xff8270), 0.6 * ag); sun.intensity *= 1 + 0.5 * ag; }
    hemi.color.copy(b.sky).lerp(_c2.setHex(0x84acf6), 0.5 * k); hemi.groundColor.copy(b.gnd).lerp(_c2.setHex(0x535f7c), 0.4 * k); hemi.intensity = b.hemiI * (1 + 0.1 * sn);   // (the shade: the sky's light, bluer)
    if (lo > 0) { hemi.color.lerp(_c2.setHex(0xd8c4b0), 0.3 * lo); hemi.groundColor.lerp(_c2.setHex(0x7a5c3e), 0.3 * lo); }
    if (hi > 0) { hemi.color.lerp(_c2.setHex(0x5c8ef0), 0.4 * hi); hemi.groundColor.lerp(_c2.setHex(0x3f4f78), 0.35 * hi); hemi.intensity *= 1 - 0.08 * hi; }   // (deeper blue shade under the thin air's dark sky)
    if (ag > 0) { hemi.color.lerp(_c2.setHex(0xa88cc0), 0.4 * ag); hemi.groundColor.lerp(_c2.setHex(0x7a4c5c), 0.35 * ag); hemi.intensity *= 1 + 0.12 * ag; }
    if (mi > 0) { sun.intensity *= 1 - 0.4 * mi; hemi.intensity *= 1 + 0.1 * mi; }   // (in the mist: the sun veiled, the light from all round)
    if (post) { post.haze = b.haze * (1 - 0.65 * k) * (1 + 0.35 * lo) * (1 - 0.3 * hi);
      if (b.tint) U.uTint.value.set(b.tint.x - 0.035 * k + 0.045 * lo - 0.02 * hi + 0.05 * ag, b.tint.y - 0.01 * lo - 0.03 * ag, b.tint.z + 0.045 * k - 0.05 * lo + 0.035 * hi - 0.02 * ag);
      U.uSat.value = b.sat * (1 + 0.1 * hi + 0.08 * ag); U.uCon.value = 1.04 + 0.07 * hi - 0.02 * lo; }
    if (post && (mi > 0 || sn > 0)) { post.haze *= 1 - 0.6 * mi; U.uSat.value *= 1 - 0.16 * mi; U.uCon.value += 0.035 * sn - 0.05 * mi; if (b.tint) U.uTint.value.x -= 0.02 * sn, U.uTint.value.z += 0.03 * sn; }   // (the mist: flat and grey; the flurries: a colder, harsher light)
    if (target) scene.fog.near *= 1 + 0.3 * k + 0.4 * hi;   // (the clear air up high: the haze starts further off; the far end, and so the far clip, stay)
    if (target && (mi > 0 || fl > 0)) { scene.fog.near *= (1 - 0.6 * mi) * (1 - 0.3 * fl); scene.fog.far *= (1 - 0.42 * mi) * (1 - 0.2 * fl); }   // (the mist, the flurries: a closer haze; the far clip stays)
    if (wx) {   // the colours of the mist, the spindrift and the flakes in the light of the moment
      const L = _c1.copy(sun.color).multiplyScalar(0.55 * sun.intensity).add(_c2.copy(hemi.color).multiplyScalar(0.6 * hemi.intensity)), mx = Math.max(L.r, L.g, L.b, 1e-3);
      if (mx > 1) L.multiplyScalar(1 / mx); L.r = Math.max(L.r, 0.16); L.g = Math.max(L.g, 0.19); L.b = Math.max(L.b, 0.27);
      wx.sU.uCol.value.copy(L); if (wx.dm) wx.dU.uCol.value.copy(L); if (wx.mm) { const M = wx.mU.uCol.value.copy(scene.fog.color).lerp(L, 0.25), g = M.r * 0.3 + M.g * 0.59 + M.b * 0.11; M.lerp(_c2.setRGB(g, g, g * 1.04), 0.45); }   // (the mist greyer than the haze: no sandstorm at dusk)
    }
    W[0] = scene.fog.color.getHex(); W[1] = sun.color.getHex(); W[2] = hemi.color.getHex(); W[3] = hemi.groundColor.getHex(); W[4] = sun.intensity;
    pkRays(settings.quality === 'high' && A.tod === 'day' && r <= 0 ? (1 - Core.sstep(170, 200, gy)) * (1 - mi) : 0, dt);
    pkFlare(A.tod !== 'night' && r < 0.5 && (lastMode === 'cockpit' || (lastMode === 'tv' && !cam.shot)) ? 1 - 2 * r : 0, dt);
  }

  /* ---------------- Pikes Peak's shafts of sun through the forest (the 'high' quality only, by day, below the tree line): a dozen long soft
     quads leaning along the sun's rays, anchored on the ground on a hashed 9 m grid round the view (they stay put as the view moves), each
     turned about its own axis to face the camera, fading in along its length, at the view's edge and close to the camera, breathing gently.
     One mesh, one draw call (none when hidden), its 48 corners written on the CPU ---------------- */
  const pkR = { mesh: null, N: 12, c: [], v: new WeakMap() };
  const _rV = new THREE.Vector3(), _rS = new THREE.Vector3(), _rM = new THREE.Vector3(), _rQ = new THREE.Quaternion();
  function pkRays(a, dt) {
    if (!pkR.mesh) {
      if (!(a > 0)) return;
      const N = pkR.N, g = new THREE.BufferGeometry(), aw = new Float32Array(N * 12), idx = [];
      for (let n = 0; n < N; n++) { for (let v = 0; v < 4; v++) { aw[(n * 4 + v) * 3] = v & 1 ? 1 : -1; aw[(n * 4 + v) * 3 + 1] = v >> 1; aw[(n * 4 + v) * 3 + 2] = 0; }
        const o = n * 4; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 12), 3)); g.setAttribute('aw', new THREE.BufferAttribute(aw, 3)); g.setIndex(idx);
      const m = new THREE.ShaderMaterial({ uniforms: { uC: { value: new THREE.Color() } }, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        vertexShader: 'attribute vec3 aw; varying vec3 vW; void main(){ vW = aw; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform vec3 uC; varying vec3 vW; void main(){ float x = vW.x, y = vW.y; float c = (1.0 - x * x) * (0.75 + 0.25 * cos(x * 5.0));' +
          ' float l = smoothstep(0.0, 0.12, y) * pow(1.0 - y, 1.6); gl_FragColor = vec4(uC, c * l * vW.z); }' });
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 5; mesh.visible = false; scene.add(mesh); pkR.mesh = mesh;
    }
    const M = pkR.mesh; if (!(a > 0.01) || !world || !world.groundH) { M.visible = false; return; }
    const G = world.groundH, N = pkR.N, R = 40, C = 9, cx = cam.vcx || 0, cz = cam.vcz || 0, cp = camera.position, sl = Math.hypot(sunOff[0], sunOff[1], sunOff[2]);
    const dx = sunOff[0] / sl, dy = sunOff[1] / sl, dz = sunOff[2] / sl, hl = Math.hypot(dx, dz) || 1, qx = -dz / hl, qz = dx / hl;   // (d: towards the sun; q: across it, on the ground)
    const L = pkR.c; L.length = 0;
    // only in the forest (World's pkWood: the trees' density round the foot of the shaft) and never over the road: the shaft's foot and its trace on the ground
    // towards the sun (as far as it shows: its lower part) clear of the road and its verge; each cell's verdict kept per world (the sun stays put)
    const Wd = world.pkWood; let E = pkR.v.get(world); if (!E || E.sun !== sunOff) pkR.v.set(world, E = { sun: sunOff, m: new Map() }); const V = E.m;
    for (let i = Math.floor((cx - R) / C); i <= Math.floor((cx + R) / C); i++) for (let j = Math.floor((cz - R) / C); j <= Math.floor((cz + R) / C); j++) {
      const h = hash3(i * 7919 + j * 104729 + 0.5); if (h > 0.5) continue;
      const x = (i + hash3(i * 31 + j * 57 + 1.3)) * C, z = (j + hash3(i * 91 + j * 13 + 2.7)) * C, d = Math.hypot(x - cx, z - cz); if (d > R) continue;
      if (Wd) { const key = i * 65536 + j; let ok = V.get(key);
        if (ok === undefined) { let wd = 0; ok = true;
          for (const [a, b] of [[0, 0], [5, 0], [-5, 0], [0, 5], [0, -5]]) { const p = Wd(x + a, z + b); if (p < 0) ok = false; else wd += p / 5; }
          for (let t = 3; t <= 15 && ok; t += 3) for (const sd of [-2, 2]) if (Wd(x + dx / hl * t + qx * sd, z + dz / hl * t + qz * sd, 1) < 0) ok = false;
          ok = ok && h < 0.5 * Core.sstep(0.2, 0.5, wd); V.set(key, ok); }
        if (!ok) continue; }
      L.push([d, x, z, h * 5]); }
    L.sort((p, q) => p[0] - q[0]);
    const P = M.geometry.attributes.position.array, AW = M.geometry.attributes.aw.array; let n = 0;
    for (; n < N && n < L.length; n++) {
      const [d, x0, z0, s] = L[n], sw = Math.sin(time * 0.09 + s * 6.3) * 1.6, x = x0 + qx * sw, z = z0 + qz * sw, y = G(x, z) - 0.5, len = 24 + 16 * hash3(s + 3.1), w = 1.1 + 1.8 * hash3(s + 7.7);
      _rM.set(x + dx * len * 0.4, y + dy * len * 0.4, z + dz * len * 0.4); const dc = _rM.distanceTo(cp);
      _rS.set(dx, dy, dz).cross(_rV.copy(cp).sub(_rM)).normalize().multiplyScalar(w);
      const al = a * (1 - Core.sstep(R * 0.6, R, d)) * Core.sstep(8, 22, dc) * (0.55 + 0.45 * Math.sin(time * (0.35 + 0.2 * hash3(s + 5.5)) + s * 11));
      for (let v = 0; v < 4; v++) { const sd = v & 1 ? 1 : -1, t = (v >> 1) * len, o = (n * 4 + v) * 3;
        P[o] = x + dx * t + _rS.x * sd; P[o + 1] = y + dy * t + _rS.y * sd; P[o + 2] = z + dz * t + _rS.z * sd; AW[o + 2] = al; } }
    for (; n < N; n++) for (let v = 0; v < 4; v++) AW[(n * 4 + v) * 3 + 2] = 0;
    M.geometry.attributes.position.needsUpdate = true; M.geometry.attributes.aw.needsUpdate = true;
    M.material.uniforms.uC.value.copy(sun.color).multiplyScalar(0.26 * Math.min(1.4, sun.intensity)); M.visible = true;
  }

  /* ---------------- Pikes Peak's lens flare (the cockpit and the replay's TV cameras, when the low sun is in the picture): a soft bloom disc and
     a star of light on the sun, rings and ghosts along the line from the sun through the middle of the picture. Hidden when the sun is behind
     the mountain (the ground's height sampled along the ray to it, as the TV cameras' pkLos does; the forest below the tree line too), fading in
     and out. One mesh drawn straight in the screen's space, last, one draw call (none when hidden) ---------------- */
  const pkF = { mesh: null, vis: 0, n: 0, blk: false, sx: 0, sy: 0 };
  function pkFlare(a, dt) {
    if (!pkF.mesh) {
      if (!(a > 0)) return;
      // [t along the line (0 the sun, 1 the middle, 2 the opposite point), half width, half height (of the picture's height), kind (0 soft disc, 1 ring, 2 small hard disc), r, g, b]
      const S = [[0, 0.55, 0.55, 0, 1, 0.78, 0.5], [0, 0.11, 0.11, 0, 1, 0.96, 0.85], [0, 0.8, 0.012, 0, 1, 0.85, 0.65], [0.28, 0.035, 0.035, 2, 1, 0.6, 0.3],
        [0.5, 0.08, 0.08, 0, 0.5, 0.9, 0.55], [0.7, 0.025, 0.025, 2, 0.5, 0.7, 1], [0.92, 0.15, 0.15, 1, 0.85, 0.55, 1], [1.16, 0.05, 0.05, 2, 1, 0.55, 0.25], [1.42, 0.22, 0.22, 1, 0.5, 0.75, 1]];
      const N = S.length, g = new THREE.BufferGeometry(), pos = new Float32Array(N * 12), aS = new Float32Array(N * 16), col = new Float32Array(N * 12), idx = [];
      S.forEach((q, n) => { for (let v = 0; v < 4; v++) { const o = n * 4 + v; pos[o * 3] = v & 1 ? 1 : -1; pos[o * 3 + 1] = v >> 1 ? 1 : -1; aS.set(q.slice(0, 4), o * 4); col.set(q.slice(4), o * 3); }
        idx.push(n * 4, n * 4 + 1, n * 4 + 2, n * 4 + 1, n * 4 + 3, n * 4 + 2); });
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(aS, 4)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
      const m = new THREE.ShaderMaterial({ uniforms: { uSun: { value: new THREE.Vector2() }, uAsp: { value: 1 }, uA: { value: 0 }, uTint: { value: new THREE.Color() } },
        transparent: true, depthWrite: false, depthTest: false, fog: false, blending: THREE.AdditiveBlending,
        vertexShader: 'attribute vec4 aS; attribute vec3 color; uniform vec2 uSun; uniform float uAsp; varying vec2 vC; varying vec3 vCol; varying float vK;' +
          ' void main(){ vC = position.xy; vCol = color; vK = aS.w; vec2 c = uSun * (1.0 - aS.x); gl_Position = vec4(c + position.xy * vec2(aS.y / uAsp, aS.z), 0.0, 1.0); }',
        fragmentShader: 'uniform float uA; uniform vec3 uTint; varying vec2 vC; varying vec3 vCol; varying float vK; void main(){ float r = length(vC), f;' +
          ' if (vK < 0.5) f = pow(max(0.0, 1.0 - r), 2.4); else if (vK < 1.5) f = exp(-pow((r - 0.82) * 9.0, 2.0)) * 0.2 + max(0.0, 0.8 - r) * 0.06; else f = smoothstep(1.0, 0.75, r) * 0.4;' +
          ' gl_FragColor = vec4(vCol * uTint, f * uA); }' });
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 1000; mesh.visible = false; scene.add(mesh); pkF.mesh = mesh;
    }
    const M = pkF.mesh; let goal = 0;
    if (a > 0.01 && world && world.groundH) {
      // the sun in the camera's view: its direction turned into the camera's frame, then onto the picture
      const sl = Math.hypot(sunOff[0], sunOff[1], sunOff[2]), dx = sunOff[0] / sl, dy = sunOff[1] / sl, dz = sunOff[2] / sl;
      _rV.set(dx, dy, dz).applyQuaternion(_rQ.copy(camera.quaternion).invert());
      if (_rV.z < -0.05) { const ty = Math.tan(camera.fov * Math.PI / 360), sx = pkF.sx = _rV.x / -_rV.z / (ty * camera.aspect), sy = pkF.sy = _rV.y / -_rV.z / ty;
        const e = Math.max(Math.abs(sx), Math.abs(sy));
        if (e < 1.3) { goal = a * (1 - Core.sstep(0.95, 1.3, e)) * (0.65 + 0.35 * (1 - clamp(Math.hypot(sx, sy) / 1.3, 0, 1)));
          if ((pkF.n = (pkF.n + 1) % 3) === 0 || pkF.vis < 0.01) {   // (the mountain in the way: the ground along the ray, every 3rd frame)
            const G = world.groundH, p = camera.position; let blk = false;
            for (let j = 0, d = 4, dm = Math.min(camera.far * 0.9, 2500); j < 22 && d < dm && !blk; j++, d *= 1.33) {   // (only as far as the world is drawn)
              const x = p.x + dx * d, z = p.z + dz * d, gh = G(x, z); if (p.y + dy * d < gh + (d < 10 ? 0.3 : gh < 180 ? Math.min(4, 0.06 * d) : 1.2)) blk = true; }
            pkF.blk = blk; }
          if (pkF.blk) goal = 0; } }
    }
    pkF.vis += (goal - pkF.vis) * Math.min(1, (dt || 0) * 5 + (goal < pkF.vis ? 0.05 : 0));
    if (pkF.vis < 0.005) { M.visible = false; return; }
    const U = M.material.uniforms; U.uSun.value.set(pkF.sx, pkF.sy); U.uAsp.value = camera.aspect; U.uA.value = pkF.vis * (atmos.tod === 'dusk' ? 1.3 : 1); U.uTint.value.copy(sun.color);
    M.visible = true;
  }

  /* ---------------- the sun on every other world (Pikes Peak has its own, pkLight): its rays slanting down between the trees of a wood
     (quality 'high', by day and stronger in the evening, dry; Pikes Peak's shafts: pkRays, where sunWood finds the trees thick) and its
     lens flare in the cockpit, the TV cameras and the shots with the sky (pkFlare) ---------------- */
  // the woods of a world: a 10 m grid of how many trees stand there, from the world's trees (the swaying ones of the default builder, the
  // instanced trees of the others: an instanced shape at least 4 m tall and no wider than 14 m, of 20 or more), found once per world;
  // as Pikes Peak's pkWood: -1 on and by the road, else how thick the wood is (0..1)
  function sunWood() {
    const T = curTrack; if (!T || !world || !world.root) return null;
    const C = 10, cnt = new Map(), add = (x, z) => { const k = Math.floor(x / C) * 65536 + Math.floor(z / C); cnt.set(k, (cnt.get(k) || 0) + 1); }, v = new THREE.Vector3(), M4 = new THREE.Matrix4();
    world.root.traverse(o => {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
      const g = o.geometry, P = g.attributes.position;
      if (o.isInstancedMesh) {
        if (o.count < 20) return; if (!g.boundingBox) g.computeBoundingBox(); const b = g.boundingBox;
        if (b.max.y - b.min.y < 4 || b.max.x - b.min.x > 14 || b.max.z - b.min.z > 14) return;
        for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, M4); v.setFromMatrixPosition(M4).applyMatrix4(o.matrixWorld); add(v.x, v.z); }
      } else if (g.attributes.aSway) {   // (one tree's vertices in a run: a vertex that sways a lot, its crown, counted once in ~40)
        const S = g.attributes.aSway; for (let i = 0; i < P.count; i += 40) if (S.getX(i) > 0.3) { v.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); add(v.x, v.z); }
      }
    });
    if (!cnt.size) return null;
    const q = {};
    return (x, z, road) => { const qq = T.query(x, z, sunHint, q); if (Math.abs(qq.d) < T.w + 3) return -1; if (road) return 0;   // (the followed car's place on the road: the search starts there)
      return clamp((cnt.get(Math.floor(x / C) * 65536 + Math.floor(z / C)) || 0) / 5, 0, 1); };
  }
  let sunT = 0, sunHint = -1;
  function sunFx(target) {
    if (themeId === 'pikes' || !world) return;
    const dt = clamp(time - sunT, 0, 0.25), r = Math.max(0, wet); sunT = time; sunHint = target && target.q && target.q.a >= 0 ? target.q.a : -1;
    let rays = settings.quality === 'high' && r <= 0 && !['city', 'monaco', 'ljubljana'].includes(themeId) ? (0.75 + 0.45 * sstep(0, 0.5, todK)) * (1 - sstep(0.5, 0.7, todK)) : 0;   // (by todK: the low sun's the strongest)
    if (rays > 0 && world.pkWood === undefined) world.pkWood = sunWood();
    if (!world.pkWood) rays = 0;
    pkRays(rays, dt);
    pkFlare(r < 0.5 && (lastMode === 'cockpit' || (lastMode === 'tv' && !cam.shot) || !!(cam.shot && cam.shot.sky)) ? (1 - 2 * r) * 0.8 * (1 - sstep(0.55, 0.75, todK)) : 0, dt);
  }

  /* ---------------- the season and the time of day (setAtmos({ season: 'summer' | 'autumn' | 'winter', tod: 'day' | 'dusk' | 'night' })):
     autumn turns the leaves and the grass yellow, orange and red; winter puts snow on the ground and the trees (the tarmac cleared, a gravel
     road packed with snow) and makes the rain fall as snow; dusk a low orange sun; night a dark sky, floodlights along the track (pools of
     light on the road, lamps on poles) and the cars' headlights on the road ahead. The world's colours are changed from the ones it was
     built with (kept, so every change starts from them) ---------------- */
  let atmos = { season: 'summer', tod: 'day' }, snowTex = null, lampTex = null, beamTex = null, flood = null, snow = null;
  function setAtmos(a, force) {   // (force: also when the setting is the same, e.g. after an endurance race moved the time of day)
    const n = { season: ['autumn', 'winter'].includes(a && a.season) ? a.season : 'summer', tod: ['dusk', 'night', 'dawn'].includes(a && a.tod) ? a.tod : 'day' };
    if (n.season === atmos.season && n.tod === atmos.tod && (!force || todK === (n.tod === 'night' ? 1 : n.tod === 'day' ? 0 : 0.5))) return;
    atmos = n; dawn = n.tod === 'dawn'; todK = n.tod === 'night' ? 1 : n.tod === 'dusk' || dawn ? 0.5 : 0;
    applyTheme(themeId); seasonWorld(); todLights(true); valleyFog();
  }
  // an endurance race's time of day (0 day .. 0.5 dusk .. 1 night), moved on with its clock: the light blended, the lamps coming on
  function setTodK(k) {
    k = clamp(k, 0, 1); if (Math.abs(k - todK) < 0.002 && !dawn && !(k === 1 && todK < 1)) return;   // (the full night always, not one small step short)
    const was = atmos.tod; todK = k; dawn = false; atmos = { season: atmos.season, tod: k >= 0.75 ? 'night' : k >= 0.25 ? 'dusk' : 'day' };
    applyTheme(themeId); todLights(atmos.tod !== was);
  }
  // the lights of the time of day: the floodlights (from late dusk), the windows, the headlight beams and the cars' glow (by todK); build: the floodlights again
  function todLights(build) { if (build || (todK > 0.6) !== !!flood) floodlights(); if (flood) flood.pools.material.opacity = 0.56 * sstep(0.6, 0.9, todK); litWindows(); for (const v of views) { beams(v); carGlow(v); } }
  function carGlow(v) { const m = v.body && v.body.material; if (m && m.emissive) m.emissive.setScalar(0.16 * sstep(0.5, 1, todK)); }   // (at night the cars stay in sight under the floodlights)
  // dusk and night: lights in the buildings' windows (the facade pictures, tex.facade and tex.facadeBal: the glass is the blue in them).
  // Some of the windows lit, each with a warm light of its own (now and then a television's cold blue), by a hash of the window (its bay
  // and floor, the wall's colour); the facade materials get it in their shader at the first dusk or night (winU 0 by day: as built)
  const winU = { value: 0 };
  const WIN_GLSL = ['#include <emissivemap_fragment>',
    '{ vec4 wt = texture2D( map, vUv ); float wg = smoothstep( 0.05, 0.13, wt.b - wt.r ); vec3 ws = vec3( floor( vUv ), 0.0 );',
    '#ifdef USE_COLOR', '  ws.z = floor( dot( vColor.rgb, vec3( 7.1, 3.7, 5.3 ) ) * 4.0 + 0.5 );', '#endif',   // (whole numbers: the hash of an interpolated colour would sparkle)
    '  float wh = fract( sin( dot( ws, vec3( 12.9898, 78.233, 37.719 ) ) ) * 43758.5453 );',
    '  vec3 wc = wh > 0.965 ? vec3( 0.5, 0.68, 1.0 ) : mix( vec3( 1.0, 0.62, 0.28 ), vec3( 1.0, 0.85, 0.58 ), fract( wh * 7.3 ) );',
    '  totalEmissiveRadiance += wc * wg * step( 0.56, wh ) * ( 0.42 + 0.38 * fract( wh * 13.7 ) ) * uWinK; }'].join('\n');
  function litWindows() {
    winU.value = (todK >= 1 ? 1 : todK <= 0.5 ? 0.8 * todK : 0.4 + 1.2 * (todK - 0.5)) * (dawn ? 0.75 : 1);   // (day 0, dusk 0.4, night 1: with the time of day, also as it moves on in an endurance race; in the morning a few)
    if (!winU.value || !world || !world.root || world.winLit) return;
    world.winLit = true;
    const maps = [tex.facade, tex.facadeBal].filter(Boolean);
    world.root.traverse(o => { for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) {
      if (!m.map || !maps.includes(m.map) || m.userData.win) continue;
      const prev = m.onBeforeCompile, key = m.customProgramCacheKey(); m.userData.win = true;   // (on top of what the material's shader has already: Ouninpohja's cut-out)
      m.onBeforeCompile = (sh, r) => { prev.call(m, sh, r); sh.uniforms.uWinK = winU;
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uWinK;').replace('#include <emissivemap_fragment>', WIN_GLSL); };
      m.customProgramCacheKey = () => key + '|win'; m.needsUpdate = true;
    } });
  }
  const _hsl = { h: 0, s: 0, l: 0 }, _sc = new THREE.Color();
  const hash3 = (a) => { const x = Math.sin(a * 91.37 + 17.1) * 43758.5453; return x - Math.floor(x); };
  // a colour of the world in the season: plants (greens) and soil (browns) change, the rest stays. ground: a surface facing up (grass,
  // fields: straw in autumn, deep snow in winter), else leaves (autumn colours, some still green; in winter a little snow on them); seed: to vary the leaves
  let seaW = 'summer';   // (the season the world is painted in: seasonWorld)
  /* ---------------- the asphalt's sheen: a dry road catches a little of the sun towards it (a broad lobe about the sun's mirror
     direction: brightest where the camera looks into the sun, warm and stronger in the low evening sun; none in the shade, at night or
     under the rain's cloud). Every material with the shared asphalt texture and the road's wear decals; own programs ---------------- */
  const asU = { uAsS: { value: new THREE.Vector3(0, 1, 0) }, uAsC: { value: new THREE.Color(0, 0, 0) } };
  function asphaltLook(m) {
    if (!m || m.userData.asLook || !m.isMeshLambertMaterial) return;
    m.userData.asLook = true;
    const prev = m.onBeforeCompile, key = 'asph|' + m.customProgramCacheKey();
    m.onBeforeCompile = (sh, r) => {
      prev.call(m, sh, r);
      sh.uniforms.uAsS = asU.uAsS; sh.uniforms.uAsC = asU.uAsC;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vAsW;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvAsW = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uAsS; uniform vec3 uAsC; varying vec3 vAsW;')
        .replace('reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();', 'float asSm = getShadowMask();\nreflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * asSm;')
        .replace('#include <envmap_fragment>', '{ vec3 asV = normalize( cameraPosition - vAsW ); float asL = max( dot( vec3( -asV.x, asV.y, -asV.z ), uAsS ), 0.0 ), asQ = asL * asL;\n' +
          '  outgoingLight += uAsC * ( asQ * asQ * asL * asSm ); }\n#include <envmap_fragment>');
    };
    m.customProgramCacheKey = () => key; m.needsUpdate = true;
  }
  function asphaltWorld() {
    if (!world || !world.root) return;
    world.root.traverse(o => { if (!o.isMesh || !o.material) return; for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (m.map === tex.asphalt || m.userData.wear) asphaltLook(m); });
  }
  function asStep() {   // (every frame: the sun, the time of day, the rain)
    const r = Math.max(0, wet), k = (0.065 + 0.085 * sstep(0, 0.5, todK)) * (1 - sstep(0.5, 0.8, todK)) * (1 - r);   // (by todK: stronger in the low sun, gone into the night)
    asU.uAsS.value.set(sunOff[0], sunOff[1], sunOff[2]).normalize(); asU.uAsC.value.copy(sun.color).multiplyScalar(k);
  }
  function seasonCol(c, seed, out, ground) {
    out.copy(c); if (seaW === 'summer') return out;
    c.getHSL(_hsl); const { h, s, l } = _hsl, plant = h > 0.14 && h < 0.47 && s > 0.1 && l > 0.04, soil = h > 0.04 && h <= 0.14 && s > 0.12 && l > 0.08 && l < 0.7;
    if (seaW === 'autumn') {
      if (!plant) return out;
      if (ground) return out.setHSL(0.13 + (h - 0.14) * 0.3, s * 0.72, l * 0.97);   // (a meadow: straw and olive)
      const u = hash3(seed);
      if (u < 0.25) return out.setHSL(h * 0.88, s, l);   // (some leaves still green)
      return out.setHSL([0.02, 0.05, 0.08, 0.12][Math.floor(u * 7) % 4], Math.min(1, s * 1.25 + 0.15), Math.min(0.6, l * 1.05 + 0.03));
    }
    if (!plant && !soil && !(s < 0.12 && l > 0.25 && l < 0.8)) return out;   // (winter: plants, soil and grey rock take the snow)
    const k = ground ? (plant || soil ? 0.88 : 0.5) : plant ? 0.4 : soil ? 0.6 : 0.3;
    return out.lerp(_sc.setRGB(0.92, 0.95, 0.99), k);
  }
  // the average colour of a texture's picture (cached): is it grass?
  const toneOf = new WeakMap(), colOrig = new WeakMap();   // (three r128 textures have no userData; the colour attributes as built)
  function texTone(t) {
    if (!t || !t.image) return null; if (toneOf.has(t)) return toneOf.get(t);
    let tone = null; try { const c = document.createElement('canvas'); c.width = c.height = 4; const g = c.getContext('2d'); g.drawImage(t.image, 0, 0, 4, 4); const d = g.getImageData(0, 0, 4, 4).data; let r = 0, gg = 0, b = 0; for (let i = 0; i < 64; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; } tone = [r / 16, gg / 16, b / 16]; } catch (_) { tone = [0, 0, 0]; }
    toneOf.set(t, tone); return tone;
  }
  function snowTexture(src) {
    if (!snowTex) {
      const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), img = g.createImageData(S, S), d = img.data;
      for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const n = 0.9 + 0.06 * Math.sin(i * 0.19 + Math.sin(j * 0.13) * 2) * Math.sin(j * 0.23 + i * 0.05) + (hash3(i * 131 + j) - 0.5) * 0.08, o = (j * S + i) * 4, sp = hash3(i * 7 + j * 911) > 0.995 ? 1.08 : 1;
        d[o] = Math.min(255, 232 * n * sp); d[o + 1] = Math.min(255, 238 * n * sp); d[o + 2] = Math.min(255, 247 * n * sp); d[o + 3] = 255; }
      g.putImageData(img, 0, 0); snowTex = new THREE.CanvasTexture(c); snowTex.wrapS = snowTex.wrapT = THREE.RepeatWrapping;
    }
    const t = snowTex.clone(); t.needsUpdate = true; if (src) { t.repeat.copy(src.repeat); t.offset.copy(src.offset); t.anisotropy = src.anisotropy; } return t;
  }
  function seasonWorld() {
    const sea = world && (world.ownSeason || (world.season === 'autumn' && atmos.season !== 'winter')) ? 'summer' : atmos.season;   // (a world painted for every season itself (world.ownSeason: Sani Pass) is as built; a world painted for a season of its own (world.season: Vršič's autumn look) is as built in autumn; the winter snows it over)
    if (!world || !world.root || world.seasonKey === sea) return;
    if (!world.seasonKey && sea === 'summer') { world.seasonKey = 'summer'; return; }   // (a new world in summer: as built)
    world.seasonKey = seaW = sea;
    const roads = new Set([tex.asphalt, tex.curb, tex.paving].filter(Boolean)), mats = new Set(), cols = new Map(), inst = new Set();   // (colour attributes: some are shared by several meshes, each is changed once)
    world.root.traverse(o => { for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) mats.add(m); const g = o.geometry; if (g && g.attributes && g.attributes.color && !cols.has(g.attributes.color)) cols.set(g.attributes.color, g.attributes.normal || null); if (o.isInstancedMesh && o.instanceColor) inst.add(o.instanceColor); });
    let n = 0;
    for (const m of mats) {
      if (!m.color || roads.has(m.map)) continue;
      const U = m.userData; if (!U.c0) { U.c0 = m.color.clone(); U.map0 = m.map || null; if (U.dry) U.dry0 = U.dry.clone(); }
      const tone = texTone(U.map0), grassy = !!(U.map0 && U.map0.dryGrass) || (tone && tone[1] > tone[0] * 1.08 && tone[1] > tone[2] * 1.2), gravel = U.map0 && (U.map0 === tex.makadam || (world.dyn.wet && m === world.dyn.wet.road));
      if (sea === 'winter' && (grassy || gravel)) {   // (grass under snow; a gravel road packed with snow)
        if (!U.snowMap) U.snowMap = snowTexture(U.map0);
        m.map = U.snowMap; m.color.copy(gravel ? _sc.setRGB(0.86, 0.87, 0.9) : _sc.setRGB(1, 1, 1));
      } else {
        if (m.map !== U.map0) m.map = U.map0;
        seasonCol(U.c0, n++, m.color, grassy);
        if (sea === 'autumn' && grassy && !U.map0.dryGrass) m.color.multiply(_sc.setRGB(1.18, 0.92, 0.62));   // (a green grass picture: drier, browner)
      }
      if (U.dry) U.dry.copy(m.color);   // (the wet road darkens from this colour)
      m.needsUpdate = true;
    }
    for (const [a, nrm] of cols) {
      if (!colOrig.has(a)) colOrig.set(a, a.array.slice());
      const src = colOrig.get(a), dst = a.array, is = a.itemSize, N = nrm ? nrm.array : null;
      for (let i = 0, v = 0; i < src.length; i += is, v++) { _c1.setRGB(src[i], src[i + 1], src[i + 2]); seasonCol(_c1, v * 0.37, _c2, !!N && N[v * 3 + 1] > 0.8); dst[i] = _c2.r; dst[i + 1] = _c2.g; dst[i + 2] = _c2.b; }   // (facing up: ground)
      a.needsUpdate = true;
    }
    for (const a of inst) {
      if (!colOrig.has(a)) colOrig.set(a, a.array.slice());
      const src = colOrig.get(a), dst = a.array;
      for (let i = 0; i < src.length; i += 3) { _c1.setRGB(src[i], src[i + 1], src[i + 2]); seasonCol(_c1, i * 0.53, _c2, !!a.ground); dst[i] = _c2.r; dst[i + 1] = _c2.g; dst[i + 2] = _c2.b; }   // (a.ground: grass, e.g. the verges' clumps)
      a.needsUpdate = true;
    }
    wetW = -1;   // (the road's wet colour again)
  }
  function radialTex(stops) {   // a soft round spot (the floodlights' pools): [radius 0..1, alpha] stops
    const S = 64, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    for (const [r, a] of stops) gr.addColorStop(r, 'rgba(255,255,255,' + a + ')'); g.fillStyle = gr; g.fillRect(0, 0, S, S);
    return new THREE.CanvasTexture(c);
  }
  // night: floodlights on poles along the track (every 30 m, alternating sides), each a pool of warm light on the road (brightest under the
  // lamp, fading out softly) and a glow round the lamp (the glows' points: one draw call for all of them)
  function floodlights() {
    if (flood) { for (const o of [flood.pools, flood.poles, flood.heads, flood.halo]) { scene.remove(o); o.geometry.dispose(); } flood = null; }
    const T = curTrack; if (todK <= 0.6 || !T || !world) return;
    if (!lampTex) lampTex = radialTex([[0, 1], [0.18, 0.86], [0.42, 0.46], [0.68, 0.16], [1, 0]]);
    const L = T.len, n = Math.floor(L / 30), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), rn = new THREE.Vector3();
    const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: lampTex, color: 0xffd9a6, transparent: true, opacity: 0.56, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), n);
    const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.12, 9, 5).translate(0, 4.5, 0), new THREE.MeshLambertMaterial({ color: 0x3a3d42 }), n);
    const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.3, 0.5), new THREE.MeshBasicMaterial({ color: 0xfff1cf }), n);
    const hp = new Float32Array(n * 3), hc = new Float32Array(n * 4), hs = new Float32Array(n), fp = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) {
      const s = k * 30 + 10, i = T.idx(s), sd = k % 2 ? 1 : -1, y = T.hasElev && T.hy ? T.hy[i] : 0, e = sd > 0 ? (T.br ? T.br[i] : T.w) : (T.bl ? T.bl[i] : T.w), d = sd * (Math.max(T.w, Math.min(e, T.w + 6)) + 1.2);
      const gr = T.hasElev && T.grade ? T.grade[i] : 0; rn.set(-gr * T.tx[i], 1, -gr * T.tz[i]).normalize();   // (the pool in the road's plane: on a climb a level one would cut into the road ahead and float above it behind)
      p.set(T.px[i] + T.nx[i] * sd * T.w * 0.35, y + 0.07, T.pz[i] + T.nz[i] * sd * T.w * 0.35); q.setFromUnitVectors(up, rn); sc.set(T.w * 3.2, 1, T.w * 3.2); m4.compose(p, q, sc); pools.setMatrixAt(k, m4); q.identity();
      fp[k * 3] = p.x; fp[k * 3 + 1] = p.y - 0.03; fp[k * 3 + 2] = p.z;
      p.set(T.px[i] + T.nx[i] * d, y, T.pz[i] + T.nz[i] * d); sc.set(1, 1, 1); m4.compose(p, q, sc); poles.setMatrixAt(k, m4);
      p.y += 9; q.setFromAxisAngle(up, -Math.atan2(T.nz[i], T.nx[i])); m4.compose(p, q, sc); heads.setMatrixAt(k, m4);
      hp[k * 3] = p.x - T.nx[i] * sd * 0.3; hp[k * 3 + 1] = p.y - 0.3; hp[k * 3 + 2] = p.z - T.nz[i] * sd * 0.3;   // (the glow just under the lamp, towards the road)
      hc[k * 4] = 1; hc[k * 4 + 1] = 0.84; hc[k * 4 + 2] = 0.6; hc[k * 4 + 3] = 0.5; hs[k] = 5.5;
    }
    const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.BufferAttribute(hp, 3)); hg.setAttribute('pcolor', new THREE.BufferAttribute(hc, 4)); hg.setAttribute('psize', new THREE.BufferAttribute(hs, 1));
    const halo = new THREE.Points(hg, glows.mat); halo.renderOrder = 7;   // (the car lights' glow material: no program of its own)
    pools.renderOrder = 1; pools.frustumCulled = false; poles.frustumCulled = false; heads.frustumCulled = false; halo.frustumCulled = false;
    scene.add(pools); scene.add(poles); scene.add(heads); scene.add(halo); flood = { pools, poles, heads, halo, fp };
  }
  // dusk and night: the headlights' beam on the road ahead of a car (additive): the two lamps' cones, each widening and fading with the
  // distance (a soft edge all round, the brightest a few metres ahead), merging into one warm fan further out
  function beamTexture() {
    const W = 64, H = 128, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const x = ((i + 0.5) / W - 0.5) * 9, y = (j + 0.5) / H * 22, dy = y - 0.3, o = (j * W + i) * 4;   // (metres: x across, y ahead from the plane's near edge, the lamps 0.3 m in)
      let a = 0;
      if (dy > 0) {
        const along = (1 - Math.exp(-dy / 1.4)) / (1 + (dy / 10) ** 2) * Math.min(1, (22 - y) / 5), sx = 0.22 + 0.16 * dy;
        for (const xl of [-0.62, 0.62]) a += Math.exp(-((x - xl) ** 2) / (2 * sx * sx)) * along;
        a += 0.22 * Math.exp(-(x * x) / (2 * (0.8 + 0.3 * dy) ** 2)) * along;   // (the spill round the cones)
        a = (1 - Math.exp(-1.5 * a)) * Math.min(1, (4.5 - Math.abs(x)) / 1.2);
      }
      d[o] = d[o + 1] = d[o + 2] = 255; d[o + 3] = Math.round(255 * clamp(a, 0, 1));
    }
    g.putImageData(img, 0, 0); return new THREE.CanvasTexture(c);
  }
  function beams(v) {
    const on = todK > 0.2;
    if (!on) { if (v.beam) v.beam.visible = false; return; }
    if (!v.beam) {
      if (!beamTex) beamTex = beamTexture();
      const M = v.car.m, g = new THREE.PlaneGeometry(9, 22); g.rotateX(-Math.PI / 2); g.rotateY(-Math.PI / 2); g.translate(M.len * 0.5 + 10.5, 0.08, 0);
      v.beam = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: beamTex, color: 0xffe9c6, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      v.beam.renderOrder = 1; v.grp.add(v.beam);
    }
    v.beam.visible = true; v.beam.material.opacity = todK <= 0.5 ? 0.18 * sstep(0.2, 0.5, todK) : 0.18 + 0.18 * (todK - 0.5) / 0.5;   // (dusk 0.18, night 0.36)
  }
  // winter: snowflakes instead of the rain's streaks (a box of flakes around the view centre, drifting down)
  class Snow {
    constructor(n) {
      const P = new Float32Array(n * 3); for (let i = 0; i < n * 3; i++) P[i] = Math.random();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3));
      this.mat = new THREE.ShaderMaterial({
        uniforms: { uT: { value: 0 }, uC: { value: new THREE.Vector3() }, uBox: { value: new THREE.Vector3(80, 36, 80) }, uA: { value: 0.9 }, uScale: { value: 400 } },
        vertexShader: ['uniform float uT; uniform vec3 uC; uniform vec3 uBox; uniform float uScale; varying float vA;',
          'void main(){',
          '  vec3 v = vec3(0.7 + 0.8 * sin(position.x * 40.0 + uT * 0.6), -1.7, 0.5 + 0.7 * cos(position.z * 37.0 + uT * 0.5));',
          '  vec3 o = uC - 0.5 * uBox, p = o + mod(position * uBox + v * uT - o, uBox);',
          '  vec3 d = abs(p - uC) / (0.5 * uBox); vA = (1.0 - smoothstep(0.55, 1.0, max(d.x, d.z))) * (1.0 - smoothstep(0.6, 1.0, d.y));',
          '  vec4 mv = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(uScale * 0.09 / -mv.z, 1.0, 9.0);',
          '}'].join('\n'),
        fragmentShader: 'uniform float uA; varying float vA; void main(){ vec2 q = gl_PointCoord - 0.5; float r = dot(q, q); if (r > 0.25) discard; gl_FragColor = vec4(0.96, 0.97, 1.0, uA * vA * (1.0 - r * 3.2)); }',
        transparent: true, depthWrite: false,
      });
      this.mesh = new THREE.Points(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 8; this.mesh.visible = false;
    }
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
      uniforms: { tD: { value: rt.texture }, uRes: { value: new THREE.Vector2(4, 4) }, uMB: { value: 0 }, uMF: { value: new THREE.Vector2(0.5, 1) }, uMC: { value: new THREE.Vector2(0.5, 0.3) }, uHeat: { value: 0 }, uHorY: { value: 2 }, uTm: { value: 0 }, uFocus: { value: 0.45 }, uBand: { value: 0.22 }, uBlur: { value: 0.8 }, uGam: { value: 0.88 },
        uTint: { value: new THREE.Vector3(1, 1, 1) }, uSat: { value: 1.1 }, uCon: { value: 1.04 }, uVig: { value: 0.17 },
        uSun: { value: new THREE.Vector2(0, 1.2) }, uHaze: { value: 0 }, uHazeCol: { value: new THREE.Vector3(1, 0.8, 0.6) }, tB: { value: null }, uBloom: { value: 0 }, uShT: { value: new THREE.Vector3(1, 1, 1) }, uHiT: { value: new THREE.Vector3(1, 1, 1) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: [
        'uniform sampler2D tD; uniform vec2 uRes; uniform float uFocus; uniform float uBand; uniform float uBlur; uniform float uGam; uniform vec3 uTint; uniform float uSat; uniform float uCon; uniform float uVig; uniform vec2 uSun; uniform float uHaze; uniform vec3 uHazeCol; uniform sampler2D tB; uniform float uBloom; uniform vec3 uShT; uniform vec3 uHiT; varying vec2 vUv;',
        'float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }',
        'uniform float uMB; uniform vec2 uMF; uniform vec2 uMC; uniform float uHeat; uniform float uHorY; uniform float uTm;',
        'void main(){',
        // the summer's heat over the far asphalt: the picture just under the horizon trembles (a low camera: the cockpit, the TV cameras)
        '  vec2 uv = vUv; if (uHeat > 0.0) { float hb = uHeat * smoothstep(0.12, 0.0, uHorY - vUv.y) * step(vUv.y, uHorY); uv.x += sin(vUv.y * 310.0 + uTm * 8.0 + sin(vUv.x * 37.0 + uTm * 2.3) * 2.0) * 0.0011 * hb; }',
        '  vec2 px = 1.0 / uRes; vec3 c = texture2D(tD, uv).rgb;',
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
        // speed: away from the followed car the picture streaks out from the point it drives towards (the edges the most)
        '  if (uMB > 0.0) { vec2 as = vec2(uRes.x / uRes.y, 1.0); float m = uMB * smoothstep(0.1, 0.5, length((vUv - uMF) * as) * 0.6) * smoothstep(0.07, 0.24, length((vUv - uMC) * as));',
        '    if (m > 0.01) { vec2 st = (vUv - uMF) * 0.022 * m; vec3 s = c + texture2D(tD, vUv - st).rgb + texture2D(tD, vUv - st * 2.0).rgb + texture2D(tD, vUv - st * 3.0).rgb + texture2D(tD, vUv + st).rgb; c = s * 0.2; } }',
        '  c *= uTint; c *= mix(uShT, uHiT, smoothstep(0.12, 0.72, lum(c))); float l = lum(c); c = mix(vec3(l), c, uSat); c = (c - 0.5) * uCon + 0.5; c = pow(max(c, vec3(0.0)), vec3(uGam));',
        '  if (uHaze > 0.0) { vec2 sd = (vUv - uSun) * vec2(uRes.x / uRes.y, 1.0); float hg = exp(-dot(sd, sd) * 2.2); c = 1.0 - (1.0 - c) * (1.0 - uHazeCol * (uHaze * hg)); }',   // warm glow of the low sun just off screen (as in the reference)
        '  if (uBloom > 0.0) { vec3 bl = min(texture2D(tB, vUv).rgb * uBloom, vec3(1.0)); c = 1.0 - (1.0 - c) * (1.0 - bl); }',   // the lights' glow (dusk and night: bloomPass)
        '  vec2 q = vUv - 0.5; c *= 1.0 - uVig * dot(q, q) * 1.8;',
        '  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);',
        '}'].join('\n'),
      depthTest: false, depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); quad.frustumCulled = false;
    const sc = new THREE.Scene(); sc.add(quad);
    // the glow of the lights at dusk and at night (bloomPass): what is bright in the picture, at a quarter of its size, blurred twice
    // (a wide, soft halo), screened over it in the grade. Two small targets; drawn only when post.bloom > 0 (by day nothing of it runs)
    const bOpt = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: false, stencilBuffer: false };
    const bA = new THREE.WebGLRenderTarget(4, 4, bOpt), bB = new THREE.WebGLRenderTarget(4, 4, bOpt); bA.texture.generateMipmaps = bB.texture.generateMipmaps = false;
    const vs = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }', opt = { depthTest: false, depthWrite: false };
    const bright = new THREE.ShaderMaterial({ ...opt, uniforms: { tD: { value: rt.texture }, uPx: { value: new THREE.Vector2(0.25, 0.25) }, uThr: { value: 0.55 } }, vertexShader: vs,
      fragmentShader: 'uniform sampler2D tD; uniform vec2 uPx; uniform float uThr; varying vec2 vUv;' +
        'vec3 bp(vec2 o){ vec3 c = texture2D(tD, vUv + o * uPx).rgb; return c * smoothstep(uThr, uThr + 0.3, max(c.r, max(c.g, c.b))); }' +
        'void main(){ gl_FragColor = vec4((bp(vec2(-1.0, -1.0)) + bp(vec2(1.0, -1.0)) + bp(vec2(-1.0, 1.0)) + bp(vec2(1.0, 1.0))) * 0.25, 1.0); }' });
    const blurFs = 'uniform sampler2D tD; uniform vec2 uDir; varying vec2 vUv;' +
      'void main(){ vec3 s = texture2D(tD, vUv).rgb * 0.227 + (texture2D(tD, vUv + uDir * 1.385).rgb + texture2D(tD, vUv - uDir * 1.385).rgb) * 0.316 + (texture2D(tD, vUv + uDir * 3.231).rgb + texture2D(tD, vUv - uDir * 3.231).rgb) * 0.07; gl_FragColor = vec4(s, 1.0); }';
    const blur = [0, 1, 2, 3].map(() => new THREE.ShaderMaterial({ ...opt, uniforms: { tD: { value: null }, uDir: { value: new THREE.Vector2() } }, vertexShader: vs, fragmentShader: blurFs }));   // (one a pass: its own uniforms)
    mat.uniforms.tB.value = bA.texture;
    post = { rt, mat, sc, quad, cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), focus: 0.45, bloom: 0, bl: { a: bA, b: bB, bright, blur, w: 1, h: 1 } };
  }
  function bloomPass() {
    const B = post.bl, q = post.quad, pass = (m, to) => { q.material = m; renderer.setRenderTarget(to); renderer.render(post.sc, post.cam); };
    pass(B.bright, B.a);
    [[B.a, B.b, 1, 0], [B.b, B.a, 0, 1], [B.a, B.b, 2.2, 0], [B.b, B.a, 0, 2.2]].forEach(([from, to, x, y], k) => { const U = B.blur[k].uniforms; U.tD.value = from.texture; U.uDir.value.set(x / B.w, y / B.h); pass(B.blur[k], to); });
    q.material = post.mat;
  }
  function sizePost() {
    if (!post) return; renderer.getDrawingBufferSize(_v2); post.rt.setSize(_v2.x, _v2.y); post.mat.uniforms.uRes.value.set(_v2.x, _v2.y);
    const B = post.bl; B.w = Math.max(1, Math.floor(_v2.x / 4)); B.h = Math.max(1, Math.floor(_v2.y / 4)); B.a.setSize(B.w, B.h); B.b.setSize(B.w, B.h); B.bright.uniforms.uPx.value.set(1 / _v2.x, 1 / _v2.y);
  }
  function postOn() { return !!post && settings.quality === 'high' && settings.post !== false; }

  function updatePointScale() {
    const hpx = renderer.domElement.height;
    const ps = hpx / (2 * Math.tan(camera.fov * Math.PI / 360));
    particles.mat.uniforms.uScale.value = ps; if (sparkP) sparkP.mat.uniforms.uScale.value = ps; if (glows) glows.mat.uniforms.uScale.value = ps;
  }
  function setDynScale(k) { k = clamp(k, 0.55, 1); if (Math.abs(k - dynScale) > 0.01) { dynScale = k; resize(); } }
  function getDynScale() { return dynScale; }
  // the battery saver (game.js: 30 frames a second): the picture drawn at 0.7 of the resolution
  function setSaver(on) { const k = on ? 0.7 : 1; if (k !== saverK) { saverK = k; resize(); } }
  // the new world's shaders compiled at once, while the loading screen is up (else in its first frames, or mid-race as each comes in view)
  function precompile() { try { renderer.compile(scene, camera); } catch (_) { } }

  /* ---------------- race attach ---------------- */
  // the pieces every car shares (cached body / tail / wheel / Peugeot geometry, the common materials): never freed with a car
  function sharedCarRes() {
    const g = new Set([wheelGeo, wheelGeoW, ...geoCache.values(), ...tailGeoCache.values(), ...fWheelCache.values(), ...newWheelCache.values(), ...lmWheelCache.values()]);
    if (p206Geo) for (const n of p206Geo) for (const p of n.prims) g.add(p.g);
    const m = new Set([matCar, matWheel, matTailOff, matTailOn, matBlob, matBlobS, matMarker, matUnder, matEngine, matLens, matLensBroken, matScOn, matScOff]);
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
  function disposeView(v, keep) { scene.remove(v.grp); if (v.tag) { v.tag.material.map.dispose(); v.tag.material.dispose(); v.tag = null; } disposeCarMesh(v, keep); }
  // geometry and materials the loose panels on the track are drawn with
  function debrisRes() { const s = new Set(); for (const d of debrisMeshes) if (d.mesh && d.mesh.traverse) d.mesh.traverse(o => { if (o.geometry) s.add(o.geometry); if (o.material) s.add(o.material); }); return s; }
  function makeView(c) {
    if (c.stripe === undefined) c.stripe = (c.id * 7) % 3 !== 0;
    const v = makeCarMesh(c);
    v.body.geometry = v.body.geometry.clone(); v.ownGeo = true; v.smokeAcc = 0;   // own copy: dents stay on this car
    v.car = c; v.roll = 0; v.pitch = 0; v.gpitch = 0; v.spin = 0; v.sk = [null, null, null, null]; v.acc = [0, 0, 0, 0]; v.repairN = c.repairN || 0;
    v.grp.rotation.order = 'YXZ';   // yaw first, then pitch about the car's own lateral axis (slopes/jumps)
    buildParts(v);
    if (atmos.tod !== 'day') beams(v);
    carGlow(v);
    if (curTrack && curTrack.def.theme === 'pikes') pkCarDress(v);   // Pikes Peak: dust + morning glint on the paint
    if (c.chr && c.chr.rival) nameTag(v, c.name, '#ff8a7a');   // the player's standing rival (the career): its name over the car
    scene.add(v.grp); return v;
  }
  function nameTag(v, txt, col) {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const x = cv.getContext('2d');
    x.fillStyle = 'rgba(10,14,20,0.6)'; x.fillRect(0, 8, 256, 48); x.font = 'bold 30px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col; x.fillText(txt, 128, 33, 244);
    v.tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false })); v.tag.scale.set(4, 1, 1); v.tag.position.y = 2.6; v.tag.renderOrder = 4; v.grp.add(v.tag);
  }
  /* ---------------- flags (race.fl, see Race._flags): the safety car, a car of its own with a light bar on the roof (the two lamps flash
     orange while it leads the field, off when it goes in), and a marshal's waving yellow flag beside the track before a yellow zone ---------------- */
  let scView = null;
  function scDrop() { if (!scView) return; const k = views.indexOf(scView); if (k >= 0) views.splice(k, 1); disposeView(scView); scView = null; }
  // the marshals with their flags: two instanced meshes for all of them (the marshal with his pole in one geometry, the cloth that waves)
  let flagInst = null;
  function flagMeshes() {
    const parts = [[new THREE.CylinderGeometry(0.035, 0.035, 2.3, 6).translate(0, 1.15, 0), [0.85, 0.85, 0.85]], [new THREE.CylinderGeometry(0.2, 0.24, 1.55, 8).translate(0.15, 0.78, 0.25), [1, 0.48, 0.1]],   // (the pole; the marshal in orange overalls)
      [new THREE.SphereGeometry(0.14, 8, 6).translate(0.15, 1.7, 0.25), [0.95, 0.95, 0.95]]];
    const pos = [], nrm = [], col = [];
    for (const [g0, c] of parts) { const g = g0.toNonIndexed(), P = g.attributes.position.array, N = g.attributes.normal.array; for (let i = 0; i < P.length; i++) { pos.push(P[i]); nrm.push(N[i]); col.push(c[i % 3]); } g.dispose(); g0.dispose(); }
    const body = new THREE.BufferGeometry(); body.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); body.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); body.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const men = new THREE.InstancedMesh(body, new THREE.MeshLambertMaterial({ vertexColors: true }), 4);
    const cloth = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.95, 0.62).translate(0.5, 0, 0), new THREE.MeshLambertMaterial({ color: 0xffd21f, side: THREE.DoubleSide }), 4);
    for (const m of [men, cloth]) { m.count = 0; m.frustumCulled = false; scene.add(m); }
    return { men, cloth };
  }
  function updateFlags() {
    const R = curRace, F = R && R.fl, X = F && F.sc ? F.sc.car : null, T = R && R.track;
    if (scView && scView.car !== X) scDrop();
    if (X && !scView) {
      scView = makeView(X); views.push(scView); scView.dec.visible = false;
      const bar = new THREE.Group(), dx = scView.dec.position.x, y = scView.dec.position.y + 0.05, w = X.m.wid * 0.62;
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, w), new THREE.MeshLambertMaterial({ color: 0x1a1a1a })); bar.add(base);
      scView.lamps = [-1, 1].map(sd => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, w * 0.34), matScOff); l.position.set(0, 0.08, sd * w * 0.3); bar.add(l); return l; });
      bar.position.set(dx, y, 0); scView.bodyG.add(bar);
    }
    if (scView) { const on = F.sc.state === 'out', ph = (time * 2.6) % 1 < 0.5; scView.lamps[0].material = on && ph ? matScOn : matScOff; scView.lamps[1].material = on && !ph ? matScOn : matScOff; }
    const Y = F && T && !T.open ? F.yel : [], n = Math.min(4, Y.length);
    if (!F && !flagInst) return;
    // (made with the first race that has flags, not at its first yellow, and drawn all through such a race (no yellow: count 0, nothing
    // drawn): the marshals' shaders compile and their geometry loads at the start, never in the middle of a race)
    if (!flagInst) flagInst = flagMeshes();
    const { men, cloth } = flagInst; men.count = cloth.count = n; men.visible = cloth.visible = !!F;
    for (let k = 0; k < n; k++) {
      const y = Y[k], i = T.idx(y.s - 110), br = T.br ? T.br[i] : T.w, d = br + 1.6, j = (i + 1) % T.N;
      const yaw = -Math.atan2(T.pz[j] - T.pz[i], T.px[j] - T.px[i]) + Math.PI / 2;
      _fp.set(T.px[i] + T.nx[i] * d, (T.hasElev && T.hy ? T.hy[i] : 0), T.pz[i] + T.nz[i] * d); _fe.set(0, yaw, 0); _flq.setFromEuler(_fe); _fm.compose(_fp, _flq, _fs); men.setMatrixAt(k, _fm);
      _fe.set(0, yaw + Math.sin(time * 7 + k) * 0.9, Math.sin(time * 5.3 + k) * 0.25, 'YXZ'); _flq.setFromEuler(_fe); _fp.y += 1.95; _fm.compose(_fp, _flq, _fs); cloth.setMatrixAt(k, _fm);   // (waving)
    }
    men.instanceMatrix.needsUpdate = true; cloth.instanceMatrix.needsUpdate = true;
  }
  const _fp = new THREE.Vector3(), _flq = new THREE.Quaternion(), _fe = new THREE.Euler(), _fm = new THREE.Matrix4(), _fs = new THREE.Vector3(1, 1, 1);
  function attachRace(race) {
    scDrop();
    const old = views;
    views = []; curTrack = race.track; curRace = race; clearDebris(); dust = race.track.def.dust ? Object.assign({}, DUST0, race.track.def.dust) : null;
    birds.reset(birds.gull);   // (a new race, a fresh sky: nothing left over from the frames before it, so a race stepped from a seeded start draws the same)
    if (world && world.props && world.props.length && race.setProps && !race.props) race.setProps(world.props, world.propFloor);
    setupProps(race);
    for (const c of race.cars) views.push(makeView(c));
    for (const v of old) disposeView(v);   // (after the new cars exist: their shaders are reused, not compiled again)
    setupRoad(race);   // (the open road: its traffic, people and patrol cars)
    setupCrew(race);
    { const D = world && world.dyn; if (D && D.vrFin) D.vrFin.visible = !race.pol; if (D && D.vrHide) { D.vrHide.grp.visible = !!race.pol; hideDoor(D.vrHide, 0); D.vrHide.t = 0; } }   // (Vršič: the race's finish, or the building the run from the police ends in, its door up)
    particles.clear(); sparkP.clear(); skids.clear(); cam.init = false;
  }
  // the run from the police over: the player has driven into the building at the top (pol.goal, the event 'hideout'): a TV camera outside, down
  // the road from its door and over to the road's side, looks at it as the car disappears inside and the roller door comes down (rdDoor); the
  // scenery is not cut away round the car for it (World.view). The game's camera again: setShot(null)
  function goalShot(G) {
    if (!G) return;
    const ch = Math.cos(G.h), sh = Math.sin(G.h), sd = G.side || 1, at = (lx, lz) => [G.x + ch * lx - sh * lz, G.z + sh * lx + ch * lz];
    const [px, pz] = at(-G.len / 2 - 15.5, -sd * 4.6), [tx, tz] = at(-G.len / 2 + 1.2, -sd * 0.5);
    setShot({ px, py: G.y + 2.4, pz, tx, ty: G.y + 1.6, tz, fov: 40, fogD: 70, floor: true, near: 0.3, sky: true, noCut: true });
  }

  /* ---------------- Pikes Peak: the car gathers dust on the climb, the low morning sun glints on the paint ----------------
     Only the cars of a Pikes race (makeView dresses them; the ghost and every other track are untouched). The paint materials of the car
     (the body, its panels, the Peugeot's paint and glass) get one shader patch with a stable program key: a dusty tan layer that settles
     low (sills, arches, the tail) by a per-car amount that grows with the distance driven (4x on the gravel verge), and a warm specular +
     fresnel glint towards the theme's sun. The amount lives with the car (a pit repair keeps it; a new race starts clean).
     Round 6: the same layer also takes mud (a wet road: splashes low, in the arches) and snow / slush (the snow zone, winter: clumps on
     the bumpers and sills), and the wheels get it too (the stock rear wheels drawn with the body, and every separate wheel: an own copy of
     its material, Phong for the wet sheen); a wet road makes the tyres dark and glossy. The formula's parts share the stock paint: they get
     an own patched copy. Amounts: [dust, mud, snow] per car. */
  const pkCarDust = new WeakMap(), PKU = { sun: { value: new THREE.Vector3() }, sunC: { value: new THREE.Color() } };
  const PK_V = ['#include <common>\nuniform mat4 uPkInv;\nvarying vec3 vPk;\nvarying vec3 vPkN;', '#include <project_vertex>\n{ mat4 pkM = uPkInv * modelMatrix; vPk = (pkM * vec4(transformed, 1.0)).xyz; vPkN = mat3(pkM) * objectNormal; }'];
  const PK_F = ['#include <common>\nuniform float uPkD;\nuniform float uPkGl;\nuniform float uPkWh;\nuniform vec4 uPkX;\nuniform vec4 uPkW;\nuniform vec3 uPkSun;\nuniform vec3 uPkSunC;\nvarying vec3 vPk;\nvarying vec3 vPkN;',
    'float pkH(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }',
    'float pkNz(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); const vec2 o = vec2(1.0, 0.0);',
    '  return mix(mix(mix(pkH(i), pkH(i + o.xyy), f.x), mix(pkH(i + o.yxy), pkH(i + o.xxy), f.x), f.y), mix(mix(pkH(i + o.yyx), pkH(i + o.xyx), f.x), mix(pkH(i + o.yxx), pkH(i + o.xxx), f.x), f.y), f.z); }'].join('\n');
  const PK_DUST = ['#include <color_fragment>', 'float pkD = 0.0, pkG = uPkGl, pkTy = 0.0, pkWt = 0.0;',
    '{ vec3 p = vPk, n = normalize(vPkN);',
    '#ifdef USE_COLOR',
    '  pkG = max(pkG, 1.0 - step(0.05, min(distance(vColor, vec3(0.1, 0.13, 0.19)), distance(vColor, vec3(0.04, 0.05, 0.08)))));',   // the body's glass panes
    '#endif',
    '  float nz = pkNz(p * vec3(3.2, 5.5, 3.2)) * 0.6 + pkNz(p * vec3(10.0, 17.0, 10.0)) * 0.4, n2 = pkNz(p * vec3(8.0, 11.0, 8.0));',
    '  float low = 1.0 - smoothstep(0.15, 0.72, p.y + (nz - 0.5) * 0.3);',   // sills and the lower body
    '  float ar = min(length(p.xy - uPkW.xz), length(p.xy - uPkW.yz));',
    '  float arch = (1.0 - smoothstep(uPkW.z + 0.08, uPkW.z + 0.45, ar)) * smoothstep(0.35, 0.75, abs(n.z));',   // round the wheel arches
    '  float rear = smoothstep(0.25, 0.8, -n.x) * (1.0 - smoothstep(-0.75, -0.25, p.x / uPkW.w));',   // the tail (the dust swirls in behind the car)
    '  float off = smoothstep(uPkW.z * 0.9, uPkW.z + 0.03, ar), bm = (1.0 - uPkWh) * off * mix(1.0, 0.3, pkG);',   // (the body: not on the wheels themselves)
    '  if (uPkX.w > 150.0) { float fa = abs(p.z);',   // the formula (all of it low): only its floor and diffuser, the sidepods' lower half (and the wheels)
    '    float fl = (1.0 - smoothstep(0.1, 0.16, p.y - max(0.0, -1.75 - p.x) * 0.42)) * step(-2.4, p.x) * step(p.x, 1.15) * step(fa, 0.8);',
    '    float fs = smoothstep(0.36, 0.46, fa) * step(fa, 0.75) * (1.0 - smoothstep(0.24, 0.32, p.y + (nz - 0.5) * 0.08)) * step(-1.35, p.x) * step(p.x, 0.66);',
    '    bm *= max(fl, fs); }',
    '  float wb = max(uPkWh, (1.0 - off) * step(uPkX.w, abs(p.z))), wl = wb * (1.0 - 0.5 * smoothstep(uPkW.z * 0.5, uPkW.z * 1.7, p.y));',   // a wheel (its own mesh, or a stock rear wheel in the body), dirtier low down
    '  pkTy = wb * (1.0 - smoothstep(0.115, 0.14, dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11))));',   // its rubber (the rims and hubs are lighter)
    '  float w = max((max(max(low, arch), rear) + smoothstep(0.55, 0.95, n.y) * 0.12) * bm, wl * (0.75 - 0.3 * pkTy));',
    '  pkD = clamp(uPkD * w * (0.5 + 0.95 * nz) * 1.4, 0.0, 0.86);',
    '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.66, 0.53, 0.4) * (0.86 + 0.28 * nz), pkD);',
    // mud off a wet road: dark blotchy splashes, low down, in the arches, on the tail and the wheels
    '  float pm = uPkX.x * max(max(1.0 - smoothstep(0.1, 0.62, p.y + (nz - 0.5) * 0.4), max(arch, rear * 0.7)) * bm, wl * (0.6 - 0.45 * pkTy));',   // (less on the tread: it keeps rolling it off)
    '  pm = clamp(pm * smoothstep(0.62, 0.3, n2 * 0.55 + nz * 0.45 - pm * 0.35) * 1.6, 0.0, 0.92);',
    '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.3, 0.23, 0.16) * (0.72 + 0.5 * n2), pm);',
    // snow and slush: clumps on the bumpers (front and back faces at the ends), along the sills, in the arches and on the wheels
    '  float bp = smoothstep(0.35, 0.8, abs(n.x)) * smoothstep(0.55, 0.85, abs(p.x) / uPkW.w) * (1.0 - smoothstep(0.3, 0.8, p.y));',
    '  float ps = uPkX.y * max(max(max(1.0 - smoothstep(0.12, 0.45, p.y + (n2 - 0.5) * 0.25), bp), arch * 0.8) * bm, wl * (0.5 - 0.25 * pkTy));',
    '  ps = clamp(ps * smoothstep(0.66, 0.38, n2 * 0.5 + nz * 0.5 - ps * 0.3) * 1.7, 0.0, 0.95);',
    '  diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.66, 0.69, 0.73), vec3(0.93, 0.95, 0.98), smoothstep(0.25, 0.75, n2)), ps);',
    // a wet road: the tyres dark and glossy (not where the dirt sits)
    '  pkWt = uPkX.z * pkTy * (1.0 - 0.8 * max(pkD, max(pm, ps)));',
    '  diffuseColor.rgb *= 1.0 - 0.45 * pkWt;',
    '  pkD = max(pkD, max(pm * 0.5, ps)); }'].join('\n');
  const PK_GLINT = ['{ vec3 pn = normalize(normal), pv = normalize(vViewPosition), pl = normalize((viewMatrix * vec4(uPkSun, 0.0)).xyz), ph = normalize(pl + pv);',
    '  float ndl = max(dot(pn, pl), 0.0), nh = max(dot(pn, ph), 0.0), fr = pow(1.0 - max(dot(pn, pv), 0.0), 3.0);',
    '  float gl = (pow(nh, mix(36.0, 120.0, pkG)) * mix(2.4, 4.2, pkG) + pow(nh, 8.0) * 0.4) * smoothstep(0.0, 0.3, ndl) + fr * mix(1.2, 1.8, pkG) * ndl;',   // a sharp glint, a broad warm sheen and a rim on the sun side
    '  gl *= 1.0 - pkTy * (0.85 - 0.85 * pkWt);',   // (dry rubber hardly shines)
    '  outgoingLight += uPkSunC * gl * (1.0 - pkD) + pkWt * (vec3(0.5, 0.56, 0.64) * 0.3 * fr + uPkSunC * pow(nh, 50.0) * 1.6); }',   // a wet tyre: the sky and a sharp sun glint in the water film
    'gl_FragColor = vec4( outgoingLight, diffuseColor.a );'].join('\n');
  function pkCarMat(m, u, gl, key, wh) {   // add the dust + glint to a paint material (keeps what it already did: the body's scratches; of the common sun's glint only its clear coat, cgPatch); wh: a wheel's own material
    const ob = cgOb.has(m) ? cgOb.get(m) : m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile ? m.onBeforeCompile : null, ug = { value: gl }, uw = { value: wh ? 1 : 0 };
    m.onBeforeCompile = (sh, r) => {
      if (ob) ob(sh, r);
      cgPatch(sh, ug, false);
      Object.assign(sh.uniforms, { uPkInv: u.inv, uPkD: u.d, uPkW: u.w, uPkX: u.x, uPkGl: ug, uPkWh: uw, uPkSun: PKU.sun, uPkSunC: PKU.sunC });
      sh.vertexShader = sh.vertexShader.replace('#include <common>', PK_V[0]).replace('#include <project_vertex>', PK_V[1]);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', PK_F).replace('#include <color_fragment>', PK_DUST)
        .replace('#include <specularmap_fragment>', '#include <specularmap_fragment>\nspecularStrength *= (1.0 - pkD * 0.85) * (1.0 + 1.2 * pkWt);')   // dust dulls the shine and the reflections, water on a tyre adds to it
        .replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );', PK_GLINT);
    };
    m.customProgramCacheKey = () => key;
    m.needsUpdate = true;
    return m;
  }
  function pkCarDress(v) {
    const c = v.car, M = c.m, sc = M.len / 4.4, A = pkCarDust.get(c) || [0, 0, 0];
    const u = { inv: { value: new THREE.Matrix4() }, d: { value: A[0] }, w: { value: new THREE.Vector4(M.a * sc * 0.98 + 0.05, -M.b * sc * 0.98, M.rw, M.len / 2) },
      x: { value: new THREE.Vector4(A[1], A[2], 0, v.fp ? 199 : v.wr.length ? 99 : M.wid * 0.5 - 0.24) } };   // (mud, snow, the tyres' wetness, the inner face of the stock rear wheels drawn with the body; 199: the formula)
    if (v.wf.length && v.wr.length) u.w.value.set(v.wf[0].position.x, v.wr[0].position.x, v.wf[0].position.y, M.len / 2);   // (the Peugeot, the formula: real wheels of their own)
    pkCarMat(v.body.material, u, 0, 'pkCarB'); v.dirtU = null;   // the stock dirt stays off: this layer replaces it here
    if (v.partMats) { pkCarMat(v.partMats[0], u, 0, 'pkCarP');
      const t0 = v.partMats[1], tm = v.partMats[1] = pkCarMat(new THREE.MeshPhongMaterial({ color: t0.color, shininess: 12, specular: 0x141518 }), u, 0, 'pkCarT', 0);   // the bumpers (dark trim): an own Phong copy, so the snow and the dirt settle on them too
      v.bodyG.traverse(o => { if (o.isMesh && o.material === t0) o.material = tm; }); t0.dispose(); }
    else if (v.fp) {   // the formula: its parts share the stock paint (an own patched copy for this car) and the side fenders have their own
      let pm = null; v.bodyG.traverse(o => { if (o.isMesh && o.material === matCar) o.material = pm = pm || pkCarMat(matCar.clone(), u, 0, 'pkCarP'); });
      const fm = v.fp.parts.fenderL && v.fp.parts.fenderL.material; if (fm && fm !== matCar && fm !== pm) pkCarMat(fm, u, 0, 'pkCarP');   // (the prototype's louvre panels: the stock paint, patched above)
    }
    const wm = new Map();   // the separate wheels: an own Phong copy of each material (the shared ones stay as they are)
    for (const w of v.wf.concat(v.wr)) w.traverse(o => { if (!o.isMesh || !o.material || Array.isArray(o.material)) return; let m = wm.get(o.material);
      if (!m) { m = pkCarMat(new THREE.MeshPhongMaterial({ color: o.material.color, vertexColors: o.material.vertexColors, shininess: 45, specular: 0x2c2d30 }), u, 0, 'pkWheel', 1); wm.set(o.material, m); }
      o.material = m; });
    if (v.glb) {
      pkCarMat(v.glb.paint, u, 0, 'pkCarP');
      let gm = null;   // the Peugeot's glass: its own glinting copy (the shared one stays as it is)
      v.bodyG.traverse(o => { if (o.isMesh && o.material === p206Mats.chrome) o.material = gm = gm || pkCarMat(o.material.clone(), u, 1, 'pkCarP'); });
    }
    v.pk = u; v.pkS = { mk: [null, null, null, null], x: [0, 0, 0, 0], z: [0, 0, 0, 0], fw: [0, 0, 0, 0], la: 0, sp: [0, 0, 0, 0] };
  }
  function pkCarTick(v, c, dt, opt) {
    const u = v.pk, X = u.x.value, S = v.pkS, live = !(opt && opt.noFx) && dt > 0; u.inv.value.copy(v.grp.matrixWorld).invert();
    PKU.sun.value.set(sunOff[0], sunOff[1], sunOff[2]).normalize(); PKU.sunC.value.copy(sun.color).multiplyScalar(Math.min(1.2, sun.intensity * 0.6));
    if (live) {
      // where the wheels touch the road (for the marks, the dust and the spray) and which of them run through the melt water below the snow banks
      const me = v.grp.matrixWorld.elements, W = u.w.value, wz = v.wf.length ? Math.abs(v.wf[0].position.z) : c.m.wid * 0.5 - 0.1, G = pkWetGrid();
      let fw = 0;
      for (let k = 0; k < 4; k++) { const lx = k < 2 ? W.x : W.y, lz = (k % 2 ? 1 : -1) * wz; S.x[k] = me[12] + me[0] * lx + me[8] * lz; S.z[k] = me[14] + me[2] * lx + me[10] * lz;
        S.fw[k] = G && G.has(pkCell(S.x[k], S.z[k])) ? 1 : 0; fw += S.fw[k]; }
      const gy = c.roadY != null ? c.roadY : c.y || 0, sn = atmos.season === 'winter' || (!!snow && snow.mesh.visible) ? 1 : Core.sstep(322, 350, gy) * 0.5;   // (snow: winter, falling, the snow zone's slush off the banks)
      const wt = Math.max(wetW > 0.1 ? wetW : 0, fw / 4);   // a wet road: the rain's water or the melt water under the wheels
      if (!c.air && c.speed > 0.5) {
        const sr = c.q && c.q.k >= 0 && curTrack && curTrack.stubs ? curTrack.stubs[c.q.k] : null;   // (a side road: a gravel one, or its verge, is the verge)
        const off = c.q && (sr ? sr.grav || Math.abs(c.q.u) > curTrack.stubHw(sr, c.q.st) : Math.abs(c.q.d || 0) > ((curTrack && curTrack.def.halfWidth) || 7)), k = Math.abs(c.speed) * dt * (off ? 4 : 1);   // (on the gravel verge: 4x as fast)
        u.d.value = Math.min(1, u.d.value + k / 7000 * (1 - wt) * (1 - sn)); X.x = Math.min(1, X.x + k / 2600 * wt); X.y = Math.min(1, X.y + k / 2400 * sn);
        pkCarDust.set(c, [u.d.value, X.x, X.y]);
      }
      const tw = Math.max(wetW > 0.1 ? Math.min(1, wetW * 1.3) : 0, fw ? 1 : 0, sn * 0.35);   // the tyres: wet at once, drying off over some seconds
      X.z += (tw - X.z) * Math.min(1, dt * (tw > X.z ? 2.5 : 0.15));
    }
    pkFx(v, c, dt, live);
    pkMarks(v, c, dt, live);
  }
  // the melt-water film of the world (World's pkWeather: its mesh, material key 'pkWet'): the 1.5 m cells it wets, found once per world
  const pkWetG = new WeakMap(), pkCell = (x, z) => (Math.floor(x / 1.5) + 32768) * 65536 + Math.floor(z / 1.5) + 32768;
  function pkWetGrid() {
    if (!world || !world.root) return null;
    if (pkWetG.has(world)) return pkWetG.get(world);
    let G = null;
    world.root.traverse(o => { const m = o.material; if (G || !o.isMesh || !m || Array.isArray(m) || !m.customProgramCacheKey || !/(^|\|)pkWet$/.test(m.customProgramCacheKey())) return;   // (the cloud shadows prefix the key)
      G = new Set(); const P = o.geometry.attributes.position.array, C = o.geometry.attributes.color, I = o.geometry.index, n = I ? I.count : P.length / 3;
      const a = (i) => C && C.itemSize === 4 ? C.array[i * 4 + 3] : 1;
      for (let t = 0; t < n; t += 3) { const i0 = I ? I.getX(t) : t, i1 = I ? I.getX(t + 1) : t + 1, i2 = I ? I.getX(t + 2) : t + 2; if (Math.max(a(i0), a(i1), a(i2)) < 0.3) continue;   // (the feathered rims stay dry)
        for (let q = 0; q <= 6; q++) for (let r = 0; r <= 6 - q; r++) { const b0 = q / 6, b1 = r / 6, b2 = 1 - b0 - b1; G.add(pkCell(P[i0 * 3] * b0 + P[i1 * 3] * b1 + P[i2 * 3] * b2, P[i0 * 3 + 2] * b0 + P[i1 * 3 + 2] * b1 + P[i2 * 3 + 2] * b2)); } } });
    pkWetG.set(world, G); return G;
  }

  /* ---------------- Pikes Peak round 6: tyre marks, a lingering dust trail, spray off the melt water (only the cars of a Pikes race) ----------------
     The shared skid mesh (Skids: Pikes lays only these): dark rubber on the asphalt in a slide, a lock-up or hard braking (never on a wet road),
     lighter wider ruts wherever a wheel runs on the gravel verge, grey-white tracks where the verge is under snow (winter, the snow zone);
     dust that hangs in the air behind the car for a few seconds off the dry verge and drifts off with the wind; spray off every wheel in the
     melt water (the rain's is the stock spray, the front wheels added). Into the shared particle pool: no draw calls of their own. */
  function pkMarks(v, c, dt, live) {
    const S = v.pkS; if (!live) return;
    if (c.air || c.speed < 2.5) { S.mk.fill(null); S.la = 0; return; }
    const spd = c.speed, R = Math.random, me = v.grp.matrixWorld.elements, fx = me[0], fz = me[2], y = c.y || 0, gy = c.roadY != null ? c.roadY : y;
    const winter = atmos.season === 'winter', zone = Core.sstep(322, 350, gy), rainy = wetW > 0.1;
    const slide = (c.arcade ? Core.sstep(0.26, 0.62, Math.abs(c.beta || 0)) * 1.2 : Math.max(0, c.latR - 1.0) / 3.5) + c.spin * 0.9 + (c.lock ? 0.55 : 0);
    const hb = c.inBrk > 0.7 && c.vl > 14 && !c.lock ? Core.sstep(0.7, 1, c.inBrk) : 0;   // hard braking without a lock: faint marks (the ABS at work)
    const am = world && world.dyn.pkAmb, wv = am ? am.pU.uW.value : null, ws = 1.1 + 1.4 * Core.sstep(190, 420, gy), dc = (world && world.dust) || [0.86, 0.76, 0.62];   // (the wind of pkAmbient)
    skids.pkIn = true;
    for (let k = 0; k < 4; k++) {
      const front = k < 2, surf = c.ws[k], px = S.x[k], pz = S.z[k], verge = surf >= 2, wetK = rainy || S.fw[k] > 0, snowy = verge && winter, sz = snowy ? 1 : zone * 0.5;   // (the snow zone's verge: gravel, slushy)
      const it = front ? (c.lock ? 0.5 : 0) + Math.max(0, c.slipF - 0.3) * 1.4 : slide;
      let a = 0, wd = 0.2, cr = 0.035, cg = 0.035, cb = 0.04;
      if (!verge) { if (!wetK) a = it > 0.14 ? clamp(0.4 + it * 0.4, 0.4, 0.86) : hb * (front ? 0.26 : 0.16); }
      else { a = 0.4 + Math.min(0.3, it * 0.4); wd = 0.26;
        if (wetK && !snowy) { cr = 0.26; cg = 0.2; cb = 0.15; } else { cr = 0.44 + 0.04 * sz; cg = 0.36 + 0.16 * sz; cb = 0.31 + 0.29 * sz; a *= 0.85 + 0.45 * sz; } }   // (ruts in the gravel; grey-white tracks in the snow)
      const last = S.mk[k], gH = verge && a > 0 && world.groundH ? world.groundH(px, pz) : NaN, yk = Number.isFinite(gH) ? Math.max(y, gH) + 0.02 : y;   // (on the verge: over its ground)
      if (a <= 0) S.mk[k] = null;
      else if (!last) S.mk[k] = [px, pz, yk];
      else { const d = Math.hypot(px - last[0], pz - last[1]);
        if (d > (verge ? 0.8 : 0.45) && d < 4) { skids.add(last[0], last[1], px, pz, wd, cr, cg, cb, a * 0.9, a, last[2], yk); last[0] = px; last[1] = pz; last[2] = yk; }
        else if (d >= 4) S.mk[k] = [px, pz, yk]; }
      // spray: off every wheel in the melt water; in the rain off the front wheels (the stock spray has the rear ones)
      if (wetK && !verge && spd > 6 && (S.fw[k] || front)) {
        S.sp[k] += (clamp(spd / 36, 0, 1.4) + it * 0.7) * (S.fw[k] ? (front ? 16 : 26) : 10 * wetW) * dt;
        while (S.sp[k] >= 1) { S.sp[k] -= 1; const sh = 0.9 + R() * 0.1, sp = 0.35 + R() * 0.15;
          particles.emit(px - fx * 0.3, 0.3 + y, pz - fz * 0.3, c.vx * sp + (R() - 0.5) * 2.4, 0.6 + R() * 1.0, c.vz * sp + (R() - 0.5) * 2.4, 0.55 + R() * 0.4, 0.7, 3 + R() * 2, 0.9 * sh, 0.93 * sh, 0.96 * sh, S.fw[k] ? 0.3 : 0.2, -0.12, 1.7, y);
          if (S.fw[k] && R() < 0.3) particles.emit(px, 0.2 + y, pz, c.vx * 0.3 + (R() - 0.5) * 3, 1.5 + R() * 1.5, c.vz * 0.3 + (R() - 0.5) * 3, 0.4 + R() * 0.2, 0.2, 0.14, 0.78, 0.82, 0.88, 0.7, 9, 0.5, y); }   // (droplets)
      } else S.sp[k] = 0;
      // dust that lingers: off the dry verge behind the rear wheels, a thin cloud hanging in the air, drifting off with the wind
      if (!front && verge && !wetK && !snowy && spd > 5) {
        S.la += 6 * clamp(spd / 20, 0.4, 1.5) * (1 - sz) * dt;
        while (S.la >= 1) { S.la -= 1; const sh = 0.94 + R() * 0.1, wx = wv ? wv.x : -0.59, wzz = wv ? wv.y : 0.81;
          particles.emit(px - fx * 0.8 + (R() - 0.5), gy + 0.5 + R() * 0.5, pz - fz * 0.8 + (R() - 0.5), wx * ws + c.vx * 0.1 + (R() - 0.5) * 0.8, 0.2 + R() * 0.3, wzz * ws + c.vz * 0.1 + (R() - 0.5) * 0.8, 3.5 + R() * 2.5, 2.2, 7 + R() * 4, dc[0] * sh, dc[1] * sh, dc[2] * sh, 0.15, -0.04, 0.1, gy); }
      }
    }
    skids.pkIn = false;
  }

  /* ---------------- Pikes Peak: driving effects (only the cars of a Pikes race; read from the car's state, nothing simulated changes) ----------------
     Into the shared pools (no draw calls of their own): pink granite gravel sprayed off the rear wheels on the verge, extra tyre smoke
     (the fronts locking, lighter wisps in a slide) and powder snow thrown up in the snow zone (above ~330 m of road height), in winter and
     while it snows. (The sparks along the rail, the exhaust's flames and the glowing brake discs: carFx, every car's.) */
  const _pkE = new THREE.Vector3();
  function pkFx(v, c, dt, live) {   // live: emit particles (not in a paused frame, the replay or the photo)
    const f = v.pkFx || (v.pkFx = { acc: [0, 0, 0, 0] });
    const M = c.m, W = v.pk.w.value, me = v.grp.matrixWorld.elements, spd = c.speed, yb = c.y || 0, gy = c.roadY != null ? c.roadY : yb, R = Math.random;
    const fx = me[0], fz = me[2], lx = me[8], lz = me[10];   // forward, right (local z)
    const at = (ax, ay, az) => _pkE.set(ax, ay, az).applyMatrix4(v.grp.matrixWorld);
    const wz = v.wf.length ? Math.abs(v.wf[0].position.z) : M.wid * 0.5 - 0.1;
    const winter = atmos.season === 'winter', snowing = !!snow && snow.mesh.visible, zone = Core.sstep(322, 350, gy), sn = winter || snowing ? 1 : zone * 0.6;
    const slide = Math.max(0, c.latR - 1.0) / 3.5 + c.spin * 0.9 + (c.lock ? 0.55 : 0);
    if (!live) return;
    if (c.air || spd < 2) { f.acc.fill(0); return; }
    // wheels: gravel spray (rear, on the verge), tyre smoke (fronts locking, light wisps in a slide), powder snow
    for (let k = 0; k < 4; k++) {
      const front = k < 2, sd = k % 2 ? 1 : -1, surf = c.ws[k], wx = front ? W.x : W.y;
      let rate = 0, kind = 0;
      if (surf >= 2 && !front && spd > 4) { rate = (20 + slide * 20 + c.inThr * 10) * clamp(spd / 22, 0.3, 1.3); kind = 1; }
      else if (surf < 2 && spd > 4 && (front ? c.lock || c.slipF > 0.45 : slide > 0.1 && slide <= 0.22)) { rate = front ? 16 : 10; kind = 2; }
      if (sn > 0 && spd > 6) { const r2 = sn * (surf >= 2 ? 16 : winter || snowing ? 7 : 2.5) * clamp(spd / 25, 0.3, 1.4) * (front ? 0.6 : 1) * (1 + slide); if (!kind) { rate = r2; kind = 3; } else if (R() < dt * r2) pkPowder(at(wx, 0.25, sd * wz), c, gy); }
      if (!kind) { f.acc[k] = 0; continue; }
      f.acc[k] += rate * dt;
      while (f.acc[k] >= 1) {
        f.acc[k] -= 1; at(wx - 0.2, 0.22, sd * wz);
        if (kind === 1) {   // chips of pink granite (in winter: clumps of snow), thrown back and out, falling fast
          const t = R(), s = 0.68 + R() * 0.55, o = 1 + R() * 2.5, snowy = winter && R() < 0.6, mud = !snowy && surf >= 5 && wetW > 0.1;   // (the historic gravel road in the rain: mud)
          const cr = snowy ? 0.9 : mud ? (0.3 + t * 0.06) * s : (0.64 + t * 0.06) * s, cg = snowy ? 0.92 : mud ? (0.24 + t * 0.03) * s : (0.46 + t * 0.03) * s, cb = snowy ? 0.96 : mud ? (0.19 + t * 0.02) * s : (0.37 + t * 0.03) * s;
          particles.emit(_pkE.x, _pkE.y, _pkE.z, c.vx * 0.3 - fx * (1 + R() * 2) + lx * sd * o, 2.2 + R() * 3.2, c.vz * 0.3 - fz * (1 + R() * 2) + lz * sd * o, 0.45 + R() * 0.35, 0.42 + R() * 0.25, 0.3, cr, cg, cb, 1, 15, 0.35, gy);
          if (R() < 0.35) particles.emit(_pkE.x, _pkE.y, _pkE.z, c.vx * 0.2 + lx * sd * o, 0.8 + R() * 0.8, c.vz * 0.2 + lz * sd * o, 0.8 + R() * 0.5, 0.6, 2.2 + R(), cr * 1.1, cg * 1.1, cb * 1.1, 0.35, -0.05, 1.6, gy);   // (a low fan of fine grit)
        } else if (kind === 2) {   // tyre smoke: pale, a little blue in the thin air
          const g = 0.86 + R() * 0.1;
          particles.emit(_pkE.x, _pkE.y + 0.1, _pkE.z, c.vx * 0.15 + (R() - 0.5) * 1.4, 0.4 + R() * 0.5, c.vz * 0.15 + (R() - 0.5) * 1.4, 1.2 + R() * 0.8, 0.8, 3.6 + R() * 1.4, g, g, g + 0.04, front ? 0.3 : 0.24, -0.05, 1.3, gy);
        } else pkPowder(_pkE, c, gy);
      }
    }
  }
  /* ---------------- every car (read from its state, nothing simulated changes; into the shared pools, no draw calls of their own): the brake
     discs glowing orange after a hard stop (cooling over a few seconds; brightest at night), flames popping from the exhaust on a lift at high
     revs and on a gear change, a stream of sparks while the car scrapes along the barrier (the stock burst covers the hits) and, a formula
     at speed, sparks from its plank touching the road (in bursts, more over a kerb, a shower on landing). The particles only for the cars
     round the view ---------------- */
  function carFx(v, c, dt, live) {
    const f = v.cfx || (v.cfx = { heat: [0, 0], thr: 0, pop: 0, pt: 0, sh: false, sc: 0, pl: 0 }), M = c.m, R = Math.random;
    if (!v.axW) { const sc = M.len / 4.4; v.axW = v.pk ? v.pk.w.value : v.wf.length && v.wr.length ? { x: v.wf[0].position.x, y: v.wr[0].position.x, z: v.wf[0].position.y } : { x: M.a * sc * 0.98 + 0.05, y: -M.b * sc * 0.98, z: M.rw }; }
    const W = v.axW, me = v.grp.matrixWorld.elements, spd = c.speed, gy = c.roadY != null ? c.roadY : c.y || 0;
    const fx = me[0], fz = me[2], lx = me[8], lz = me[10], X = me[12], Z = me[14];   // forward, right (local z) and the car's origin
    const at = (ax, ay, az) => _pkE.set(ax, ay, az).applyMatrix4(v.grp.matrixWorld);
    const wz = v.wf.length ? Math.abs(v.wf[0].position.z) : M.wid * 0.5 - 0.1, night = atmos.tod === 'night' ? 1 : atmos.tod === 'dusk' ? 0.85 : 0.65;
    // brake discs: heat from hard braking at speed (front 60 %), cooling off over ~4 s; drawn as glows on the wheels' outer faces
    const bk = c.inBrk > 0.3 && c.vl > 6 && !c.air ? c.inBrk * (c.vl - 6) * dt * 0.04 : 0;
    for (let a = 0; a < 2; a++) {
      if (dt > 0) f.heat[a] = Math.min(1.25, f.heat[a] * Math.exp(-dt / 2.6) + bk * (a ? 0.7 : 1));
      const g = Core.sstep(0.25, 0.95, f.heat[a]); if (g <= 0.01) continue;
      const ax = a ? W.y : W.x;
      for (const sd of [-1, 1]) { at(ax, W.z, sd * (wz + 0.2)); glows.add(_pkE.x, _pkE.y, _pkE.z, 1.1 + 0.6 * g, 1.0, 0.28 + 0.14 * g, 0.04, g * night); glows.add(_pkE.x, _pkE.y, _pkE.z, 0.5, 1.0, 0.55 + 0.25 * g, 0.2, g * g * night); }
    }
    if (!live) return;
    const near = c.isPlayer || (X - (cam.vcx || 0)) ** 2 + (Z - (cam.vcz || 0)) ** 2 < 150 * 150;
    // exhaust: a string of pops after lifting off at high revs, a flame on every gear change
    const hiRev = c.rpm > M.redline * 0.7, pipe = !M.ev;   // (the electric car: no exhaust, no flames)
    if (pipe && c.inThr < 0.2 && f.thr > 0.6 && hiRev && spd > 12) { f.pop = 0.35 + R() * 0.35; f.thr = 0; }
    if (c.shiftT > 0 && !f.sh && spd > 8) f.pt = 0;   // (a shift: pop at once)
    f.sh = c.shiftT > 0; f.thr = f.pop > 0 ? 0 : Math.max(c.inThr, f.thr - dt * 2.5);   // (the throttle's recent peak: a quick lift counts)
    if (pipe && (f.pop > 0 || c.shiftT > 0) && near) {
      f.pop -= dt; f.pt -= dt;
      if (f.pt <= 0) {
        f.pt = 0.05 + R() * 0.09;
        const big = 0.7 + R() * 0.6; if (v.noHead) at(-M.len * 0.5 - 0.1, 0.55, 0); else at(-M.len * 0.5 - 0.3, 0.34, 0.35);   // (just out behind the bumper: under it the body hides the flame)
        const bx = _pkE.x - c.vx * dt, bz = _pkE.z - c.vz * dt;   // (the pool moves them on this frame still: start them a frame back, level with the car)
        for (let k = 0; k < 5; k++) { const d = k * 0.25 * big, sp = 3 + R() * 3, t = k / 4; sparkP.emit(bx - fx * d, _pkE.y + t * 0.08, bz - fz * d, c.vx * 0.96 - fx * sp + (R() - 0.5), 0.3 + R() * 0.4, c.vz * 0.96 - fz * sp + (R() - 0.5), 0.07 + R() * 0.07, (0.75 - t * 0.35) * big, (1.1 - t * 0.3) * big, 1, 0.78 - t * 0.4, 0.3 - t * 0.22, 1, -1, 2, gy); }   // a tongue of flame: yellow at the pipe, orange at the tip
        sparkP.emit(bx, _pkE.y, bz, c.vx * 0.95 - fx * 2, 0.1, c.vz * 0.95 - fz * 2, 0.05, 0.3 * big, 0.45, 0.65, 0.75, 1, 0.9, 0, 2, gy);   // the blue-white core
        glows.add(_pkE.x - fx * 0.3, _pkE.y, _pkE.z - fz * 0.3, 1.6 * big, 1, 0.5, 0.15, 0.45 * night + 0.2);
      }
    } else if (f.pop > 0) f.pop -= dt;
    if (c.air || spd < 2 || !near) { f.sc = f.pl = 0; return; }
    // the barrier: a stream of sparks from the corner that rubs along it (and a burst for a light knock the stock sparks leave out)
    const q = c.q, T = curRace && curRace.track;
    if (q && q.br != null && spd > 3 && !(q.k >= 0 && (q.deep || T.gap[q.d > 0 ? 1 : 0][q.a]))) {   // (in a side road, or in its mouth: no rail beside the car)
      const nx = q.nx, nz = q.nz, fn = fx * nx + fz * nz, ln = lx * nx + lz * nz, L = M.len * 0.5, H = M.wid * 0.5, e = L * Math.abs(fn) + H * Math.abs(ln);
      const gR = q.br - (q.d + e), gL = q.bl - (-q.d + e), side = gR < gL ? 1 : -1, gap = Math.min(gR, gL);
      if (gap < 0.12 || (c.fxWall > 0 && c.fxWall <= 2.5)) {
        const sx = Math.sign(fn * side) * L, sz = Math.sign(ln * side) * H, px = X + fx * sx + lx * sz + nx * side * Math.max(0, gap), pz = Z + fz * sx + lz * sz + nz * side * Math.max(0, gap);
        f.sc += (c.fxWall > 0 ? 8 : 0) + clamp(spd / 18, 0.3, 1.6) * 110 * dt;
        while (f.sc >= 1) { f.sc -= 1; sparkP.emit(px, gy + 0.35 + R() * 0.3, pz, c.vx * 0.55 + (R() - 0.5) * 3 - nx * side * R() * 2, 1 + R() * 3, c.vz * 0.55 + (R() - 0.5) * 3 - nz * side * R() * 2, 0.2 + R() * 0.3, 0.85, 0.2, 1, 0.72 + R() * 0.2, 0.3, 1, 11, 1.2, gy); }
        glows.add(px, gy + 0.5, pz, 1.4, 1, 0.7, 0.3, 0.3 + 0.3 * night);
      } else f.sc = 0;
    }
    // a formula's plank on the road at speed (the prototype's too): bursts of sparks from under its floor, trailing behind (more over a kerb; a shower on landing)
    if (v.noHead || (v.fp && v.fp.lm)) {
      const vs = spd - 42, bump = 0.3 + 0.7 * Math.max(0, Math.sin(time * 7.3 + c.id * 1.7) * Math.sin(time * 2.9 + c.id * 0.6));   // (a trickle, and bursts over the bumps)
      f.pl += dt * ((vs > 0 ? vs * 2.6 * bump : 0) + (c.onCurb && spd > 25 ? 26 : 0)) + (v.landed && spd > 15 ? 14 : 0);
      for (; f.pl >= 1; f.pl -= 1) {
        at(-0.4 - R() * 1.3, 0.05, (R() - 0.5) * 0.7); const sp = 2 + R() * 5;
        sparkP.emit(_pkE.x - c.vx * dt, gy + 0.06, _pkE.z - c.vz * dt, c.vx * 0.72 - fx * sp + (R() - 0.5) * 2.4, 0.5 + R() * 1.8, c.vz * 0.72 - fz * sp + (R() - 0.5) * 2.4, 0.16 + R() * 0.24, 0.42, 0.1, 1, 0.8 + R() * 0.16, 0.36 + R() * 0.3, 1, 11, 0.5, gy);
      }
    }
  }
  function pkPowder(p, c, gy) {   // a soft puff of powder snow behind a wheel
    const R = Math.random, w = 0.93 + R() * 0.06;
    particles.emit(p.x, p.y + 0.1, p.z, c.vx * 0.3 + (R() - 0.5) * 2.2, 0.6 + R() * 0.9, c.vz * 0.3 + (R() - 0.5) * 2.2, 0.9 + R() * 0.6, 0.9, 3.4 + R() * 1.6, w, w + 0.02, w + 0.06, 0.4, -0.03, 1.5, gy);
  }

  /* ---------------- pit crews (the circuits with pits: Bakreni gozd, Toskana, Gromski rt, Spa; on a hill every box stands at its road's height, bx.y) ----------------
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
      const m = { id, role: role || 'idle', act, act0: act, bx, team: bx.col, x, y: bx.y || 0, z, yaw, hx: x, hz: z, hyaw: yaw, gx: x, gz: z, gyaw: yaw, style: 'walk', spd: 0, ph: h2 * 6, t0: h3 * 50, h1, h2,
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
    boxes.forEach((bx, j) => { const [ax, az] = bpt(bx, -4.7, bx.base + 8.93), [bx2, bz2] = bpt(bx, 4.7, bx.base + 8.93), by = (bx.y || 0) + 3.7; crSetRod(M.rod, rb + j, ax, by, az, bx2, by, bz2, 0.04, 0.5); M.rod.setColorAt(rb + j, bx.col); });   // (bx.y: the box floor's height, where the pit lane is not at 0)
    for (const im of meshes) if (im.instanceColor) im.instanceColor.needsUpdate = true;
    scene.add(grp);
    crew = { grp, meshes, mats: [mat, matS], M, men, roles, tyres, P: roles ? P : null, pb, cx, cz, rad, mode: 'home', frame: null, lift: 0, liftP: 0, liftF: 0, liftR: 0, gunOn: false, clearT: 0, dim: roles ? crDims(P) : null };
    for (const m of men) crPose(m, 0, m.O, m.H);   // (start in the pose, not standing up from it)
  }
  function crDims(P) {   // the car's hubs, nose and tail (car frame: forward, right), as the car mesh builds them
    const M = P.m, d = BODIES[M.body], sx = M.len / d.len, fx = M.a * (M.len / 4.4) * 0.98 + 0.05, rx = -M.b * (M.len / 4.4) * 0.98, hw = M.wid * 0.5 - 0.1;
    if (d.nose != null) return { fx: M.a, rx: -M.b, hw: d.hw, rw: M.rw, wid: M.wid, nose: d.nose, tail: d.tail, wb: M.a + M.b };   // (the formula: its own wheels)
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
    if (t.mode === 'floor') { _cQ.setFromEuler(_ce.set(0, yawM, Math.PI / 2, 'YXZ')); out.compose(_cv.set(m.hx + Math.cos(m.hyaw) * 0.5, m.y + 0.14, m.hz + Math.sin(m.hyaw) * 0.5), _cQ, _cS); return true; }
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
        crSetRod(M.rod, m.wheel * 2, _cv.x, _cv.y, _cv.z, bx, m.y + 0.03, bz, 0.032); crSetRod(M.rod, m.wheel * 2 + 1, bx, m.y + 0.03, bz, m.air[0], m.y + 0.03, m.air[1], 0.032); }
      if (m.jack && M.jack) { const j = m.jack, fx = Math.cos(m.yaw), fz = Math.sin(m.yaw), dj = 0.52 + 1.3 * Math.cos(CR_B0), ax = m.x + fx * dj, az = m.z + fz * dj, ji = m.role === 'JF' ? 0 : 1;
        _cQ.setFromEuler(_ce.set(0, Math.PI / 2 - m.yaw, 0, 'YXZ')); _cM2.compose(_cv.set(ax, m.y, az), _cQ, _cS); M.jack.setMatrixAt(ji, _cM2);
        const px = ax - fx * 0.1, pz = az - fz * 0.1, gl = 0.1 + 1.3 * Math.cos(j.beta), gx = ax - fx * gl, gz = az - fz * gl, gy = m.y + 0.14 + 1.3 * Math.sin(j.beta), lx = Math.sin(m.yaw) * 0.24, lz = -Math.cos(m.yaw) * 0.24;
        crSetRod(M.rod, 8 + ji, px, m.y + 0.14, pz, gx, gy, gz, 0.045); crSetRod(M.rod, 10 + ji, gx - lx, gy, gz - lz, gx + lx, gy, gz + lz, 0.035); }
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

  /* ---------------- the open road (race.tf: Vršič's duel in the traffic, and race.pol: the run from the police) ----------------
     The traffic: one instanced mesh per kind of vehicle for all of them (the cars on the game's own bodies, hatchbacks, saloons and coupés,
     each in a colour of its own; vans, buses, motorbikes, bicycles), their lights (headlights and tail lights at dusk and at night, the brake
     lights, the hazard lights of a wreck). The people and the riders: the pit crew's rig in everyday clothes (a shirt, trousers, hair; a
     backpack on a hiker, a helmet on a rider): walking, waiting, running away, thrown, lying, getting up, pedalling. The patrol cars: cars
     of the race's own kind (makeView) in white with a blue band along both sides reading POLICIJA and a light bar flashing blue; an
     officer in a yellow vest by each parked one. The spike strips across the road. ---------------- */
  let road = null;
  const RD_CAR = [0xf4f4f2, 0xc9ccd0, 0x9aa0a6, 0x2b2e33, 0x121417, 0x1f3f7a, 0x8c1c1c, 0xb52a1f, 0x2e5a3a, 0x6b4a2b, 0x9fb6c9, 0xd9c7a0, 0x3a4b63, 0x7a1f3d, 0xe8e8e4, 0x5a5f66];
  const RD_VAN = [0xf2f2f0, 0xf2f2f0, 0xdcdcd6, 0x2f5fa8, 0xc9ccd0, 0xd8b020, 0x8c1c1c];
  const RD_TRUCK = [0xf2f2f0, 0xc0281c, 0x1f4f9a, 0xe0a020, 0x2a2c30, 0x2d6a3a, 0xd8d8d4, 0x8a1c1c];   // (the trucks' cabs)
  const RD_BUS = [0x19a7a4, 0xf2f2ee, 0x19a7a4], RD_MOTO = [0xd8261c, 0x151515, 0x1b5fb8, 0xf2f2f2, 0xe86a10], RD_BIKE = [0xd8261c, 0x1b5fb8, 0x151515, 0xf2f2f2, 0x2aa05a, 0xe8b400];
  const RD_SHIRT = [0xc0392b, 0x2e6fb5, 0xf2f2ee, 0x3c7a3e, 0xe0a526, 0x5b3a82, 0x1f2a36, 0xd46a8f, 0x7a8b99, 0x9b2d20, 0x4aa3a0, 0xecd9b0], RD_TROU = [0x2b3a55, 0x1c1c20, 0x4a4f57, 0x6e5a42, 0x33415c, 0x8a7d66];
  const RD_HAIR = [0x2a1d14, 0x4a3222, 0x6b4a2e, 0xb8925a, 0x1a1a1a, 0x8c8c8c, 0xd9c29a], RD_PACK = [0xc0392b, 0x2e6fb5, 0xe0a526, 0x3c7a3e, 0x303438];
  const RD_MG = [1, 0, 1];   // (the colour code the instance's own colour replaces, as crewMaterial does)
  const rdPick = (a, u) => a[Math.min(a.length - 1, Math.floor(u * a.length))];
  function rdMaterial() {   // glossy paint for the traffic, the instance's colour where the vertices carry the code (see crewMaterial)
    const m = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 60, specular: 0x3a3a3a });
    m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <color_vertex>', '#include <color_vertex>\n#ifdef USE_INSTANCING_COLOR\n  { vec3 c0 = color.rgb; vColor.rgb = c0;\n    if (c0.g < 0.002 && abs(c0.r - c0.b) < 0.002 && c0.r > 0.004) vColor.rgb = instanceColor.rgb * c0.r;\n  }\n#endif'); };
    m.customProgramCacheKey = () => 'road-paint'; return m;
  }
  function rdMerge(geos) {   // non-indexed geometries (position, normal, colour) into one
    const gs = geos.map(g => g.index ? g.toNonIndexed() : g), n = gs.reduce((a, g) => a + g.attributes.position.count, 0), P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3);
    let o = 0; for (const g of gs) { P.set(g.attributes.position.array, o); N.set(g.attributes.normal.array, o); C.set(g.attributes.color.array, o); o += g.attributes.position.count * 3; }
    gs.forEach((g, k) => { if (g !== geos[k]) g.dispose(); });
    const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(N, 3)); out.setAttribute('color', new THREE.BufferAttribute(C, 3)); out.computeBoundingSphere(); return out;
  }
  function rdRod(g, a, b, t, col) {   // a square tube from a to b, t thick (x forward, y up, z right)
    let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const L = Math.hypot(dx, dy, dz) || 1; dx /= L; dy /= L; dz /= L;
    let ux = 0, uy = 0, uz = 1; if (Math.abs(dz) > 0.9) { ux = 0; uy = 1; uz = 0; }
    let px = dy * uz - dz * uy, py = dz * ux - dx * uz, pz = dx * uy - dy * ux; const pl = Math.hypot(px, py, pz) || 1; px *= t / 2 / pl; py *= t / 2 / pl; pz *= t / 2 / pl;
    const qx = dy * pz - dz * py, qy = dz * px - dx * pz, qz = dx * py - dy * px;
    const c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], P = (e, f, s, r) => [e[0] + f * px + s * qx, e[1] + f * py + s * qy, e[2] + f * pz + s * qz];
    for (const [f0, s0, f1, s1] of [[1, 1, 1, -1], [1, -1, -1, -1], [-1, -1, -1, 1], [-1, 1, 1, 1]]) g.quadO(P(a, f0, s0), P(b, f0, s0), P(b, f1, s1), P(a, f1, s1), col, c);
  }
  function rdCarGeo(body, id) {   // a car of the traffic: the game's body (the colour code for its paint, no stripe) and its front wheels
    const M = Core.MODELS.find(m => m.id === id), g = new GB(), fx = M.a * (M.len / 4.4) * 0.98 + 0.05;
    for (const sd of [-1, 1]) wheelInto(g, fx, M.rw, sd * (M.wid * 0.5 - 0.1), M.rw, 0.24, [0.08, 0.08, 0.09], [0.62, 0.64, 0.68]);
    return rdMerge([carGeometry(body, M, 0xff00ff, false), g.geometry()]);
  }
  function rdVanGeo(col) {   // a van: the box, the bonnet, the windscreen, side windows by the cab, lights, bumpers, wheels (5.3 x 2.0 m); col: its paint (else the colour code)
    const g = new GB(), B = col || RD_MG, W = 2.0, hw = W / 2, K = [0.08, 0.08, 0.09], GL = GLASS;
    World.box(g, -0.35, 0.32, 0, 4.6, 1.73, W, 0, B, [0.92, 0, 0.92]); World.box(g, 2.25, 0.32, 0, 0.8, 0.8, W * 0.98, 0, B);
    g.quadO([2.35, 1.12, -hw * 0.97], [2.35, 1.12, hw * 0.97], [1.95, 2.02, hw * 0.97], [1.95, 2.02, -hw * 0.97], GL, [1.2, 1.2, 0]);
    for (const sd of [-1, 1]) { const z = sd * (hw + 0.004); g.triO([1.95, 1.12, sd * hw * 0.97], [2.35, 1.12, sd * hw * 0.97], [1.95, 2.02, sd * hw * 0.97], B, [2.1, 1.5, 0]);
      g.quadO([1.0, 1.22, z], [1.9, 1.22, z], [1.9, 1.9, z], [1.0, 1.9, z], GL, [1.4, 1.5, 0]);
      World.box(g, 2.63, 0.64, sd * 0.68, 0.05, 0.17, 0.3, 0, [1, 0.97, 0.82]); World.box(g, -2.67, 0.72, sd * 0.86, 0.05, 0.32, 0.16, 0, [0.72, 0.06, 0.05]);
      for (const x of [1.75, -1.85]) wheelInto(g, x, 0.36, sd * (hw - 0.12), 0.36, 0.26, K, [0.6, 0.62, 0.65]); }
    g.quadO([-2.656, 1.25, -0.8], [-2.656, 1.25, 0.8], [-2.656, 1.85, 0.8], [-2.656, 1.85, -0.8], GL, [-2, 1.5, 0]);
    World.box(g, 2.62, 0.28, 0, 0.14, 0.22, W, 0, K); World.box(g, -2.7, 0.28, 0, 0.14, 0.22, W, 0, K);
    return g.geometry();
  }
  function rdBusGeo() {   // a coach (11.8 x 2.5 m): the body, a band of windows, the windscreen, the door on the right, lights, the route board, wheels
    const g = new GB(), B = RD_MG, W = 2.5, hw = W / 2 + 0.005, K = [0.08, 0.08, 0.09], GL = [0.12, 0.16, 0.21];
    World.box(g, 0, 0.36, 0, 11.8, 2.8, W, 0, B, [0.86, 0, 0.86]);
    for (const sd of [-1, 1]) { g.quadO([-5.5, 1.45, sd * hw], [5.1, 1.45, sd * hw], [5.1, 2.8, sd * hw], [-5.5, 2.8, sd * hw], GL, [0, 1.8, 0]);
      World.box(g, 5.88, 0.62, sd * 0.9, 0.05, 0.2, 0.36, 0, [1, 0.97, 0.82]); World.box(g, -5.92, 0.8, sd * 1.05, 0.05, 0.4, 0.16, 0, [0.72, 0.06, 0.05]);
      for (const x of [3.9, -3.4]) wheelInto(g, x, 0.52, sd * (W / 2 - 0.22), 0.52, 0.36, K, [0.62, 0.64, 0.68]); }
    g.quadO([5.905, 1.1, -1.18], [5.905, 1.1, 1.18], [5.905, 3.0, 1.18], [5.905, 3.0, -1.18], GL, [5, 1.8, 0]);
    g.quadO([-5.905, 1.9, -1.0], [-5.905, 1.9, 1.0], [-5.905, 2.9, 1.0], [-5.905, 2.9, -1.0], GL, [-5, 1.8, 0]);
    g.quadO([3.7, 0.42, hw + 0.002], [4.7, 0.42, hw + 0.002], [4.7, 2.75, hw + 0.002], [3.7, 2.75, hw + 0.002], [0.16, 0.18, 0.2], [4.2, 1.5, 0]);
    g.quadO([5.91, 2.98, -0.8], [5.91, 2.98, 0.8], [5.91, 3.1, 0.8], [5.91, 3.1, -0.8], [1, 0.62, 0.1], [5, 3, 0]);
    World.box(g, 5.9, 0.34, 0, 0.12, 0.3, W, 0, K); World.box(g, -5.92, 0.34, 0, 0.12, 0.3, W, 0, K);
    return g.geometry();
  }
  function rdTruckGeo() {   // a truck and its semi-trailer (16.5 x 2.55 m: Los Caracoles' traffic): the cab in its colour with the sleeper on top, the windscreen, the
    // grille and bumper, lights, the trailer's box (white-grey), the wheels of the tractor's three axles and the trailer's three
    const g = new GB(), B = RD_MG, W = 2.55, hw = W / 2, K = [0.08, 0.08, 0.09], GL = [0.12, 0.16, 0.21], TR = [0.86, 0.86, 0.84];
    World.box(g, 7.05, 0.62, 0, 2.3, 2.3, W - 0.06, 0, B, [0.92, 0, 0.92]); World.box(g, 6.75, 2.92, 0, 1.7, 0.6, W - 0.2, 0, B);
    g.quadO([8.205, 1.75, -hw * 0.88], [8.205, 1.75, hw * 0.88], [8.205, 2.75, hw * 0.88], [8.205, 2.75, -hw * 0.88], GL, [7, 2.2, 0]);
    World.box(g, 8.2, 0.62, 0, 0.08, 1.0, W * 0.78, 0, [0.7, 0.72, 0.75]); World.box(g, 8.2, 0.3, 0, 0.14, 0.3, W, 0, K);
    for (const sd of [-1, 1]) { World.box(g, 8.24, 0.7, sd * 1.0, 0.04, 0.18, 0.3, 0, [1, 0.97, 0.82]); World.box(g, -8.24, 0.85, sd * 1.1, 0.04, 0.3, 0.16, 0, [0.72, 0.06, 0.05]);
      g.quadO([6.0, 1.75, sd * (hw - 0.025)], [7.6, 1.75, sd * (hw - 0.025)], [7.6, 2.6, sd * (hw - 0.025)], [6.0, 2.6, sd * (hw - 0.025)], GL, [7, 2.2, 0]);
      for (const x of [7.3, 5.0, 3.85, -4.7, -5.95, -7.2]) wheelInto(g, x, 0.52, sd * (hw - 0.2), 0.52, 0.34, K, [0.6, 0.62, 0.65]); }
    World.box(g, 4.6, 0.75, 0, 2.6, 0.35, W - 0.5, 0, K);   // (the chassis under the coupling)
    World.box(g, -1.1, 1.08, 0, 14.2, 2.9, W, 0, TR, [0.8, 0.8, 0.78]); World.box(g, -1.1, 0.86, 0, 14.2, 0.22, W - 0.1, 0, [0.22, 0.22, 0.24]);
    return g.geometry();
  }
  function rdMotoGeo(col) {   // a motorbike: two wheels, the tank in its colour, the seat, the engine, the fork and bars, the lights; col: its paint (else the colour code)
    const g = new GB(), B = col || RD_MG, K = [0.08, 0.08, 0.09], S = [0.62, 0.64, 0.68];
    wheelInto(g, 0.72, 0.31, 0, 0.31, 0.12, K, S); wheelInto(g, -0.72, 0.31, 0, 0.31, 0.15, K, S);
    World.box(g, 0.08, 0.64, 0, 0.62, 0.26, 0.32, 0, B); World.box(g, -0.44, 0.72, 0, 0.6, 0.12, 0.28, 0, K); World.box(g, -0.02, 0.3, 0, 0.52, 0.36, 0.28, 0, [0.3, 0.3, 0.33]);
    rdRod(g, [0.72, 0.31, 0], [0.52, 1.0, 0], 0.07, S); World.box(g, 0.5, 1.0, 0, 0.05, 0.05, 0.72, 0, K);
    World.box(g, 0.64, 0.84, 0, 0.08, 0.14, 0.16, 0, [1, 0.97, 0.82]); World.box(g, -0.78, 0.78, 0, 0.04, 0.08, 0.14, 0, [0.72, 0.06, 0.05]); World.box(g, -0.62, 0.34, 0.16, 0.5, 0.08, 0.08, 0, S);
    return g.geometry();
  }
  function rdBikeGeo() {   // a road bicycle: thin wheels, the frame in its colour, the saddle, the bars
    const g = new GB(), B = RD_MG, K = [0.06, 0.06, 0.07], S = [0.72, 0.74, 0.77];
    wheelInto(g, 0.52, 0.34, 0, 0.34, 0.035, K, S); wheelInto(g, -0.5, 0.34, 0, 0.34, 0.035, K, S);
    const bb = [0.02, 0.32, 0], st = [-0.12, 0.84, 0], ht = [0.42, 0.8, 0], fa = [0.52, 0.34, 0], ra = [-0.5, 0.34, 0];
    rdRod(g, st, ht, 0.04, B); rdRod(g, ht, bb, 0.045, B); rdRod(g, bb, st, 0.04, B); rdRod(g, bb, ra, 0.03, B); rdRod(g, st, ra, 0.03, B); rdRod(g, ht, fa, 0.035, S);
    World.box(g, -0.15, 0.88, 0, 0.26, 0.05, 0.12, 0, K); rdRod(g, ht, [0.4, 0.98, 0], 0.03, S); World.box(g, 0.44, 0.97, 0, 0.1, 0.04, 0.44, 0, K);
    return g.geometry();
  }
  // a dog (x forward, y up, z right; from its feet, its legs ~0.3 m): the body, the chest, the neck and the head with its snout, nose, eyes and
  // ears, the tail up, a red collar; the coat the instance's colour (the code), the ears darker. Its legs on their own (rdDogLegGeo: from the
  // hip down, swinging as it trots, folded when it sits)
  function rdDogGeo() {
    const g = new GB(), C = RD_MG, D = [0.55, 0, 0.55], K = [0.05, 0.04, 0.04];
    World.box(g, -0.03, 0.27, 0, 0.48, 0.19, 0.2, 0, C); World.box(g, 0.18, 0.25, 0, 0.16, 0.23, 0.21, 0, C);
    World.box(g, 0.3, 0.38, 0, 0.12, 0.14, 0.13, 0, C); World.box(g, 0.37, 0.45, 0, 0.17, 0.15, 0.15, 0, C); World.box(g, 0.49, 0.45, 0, 0.1, 0.08, 0.09, 0, C);
    World.box(g, 0.54, 0.49, 0, 0.025, 0.035, 0.045, 0, K);
    for (const sd of [-1, 1]) { World.box(g, 0.335, 0.59, sd * 0.05, 0.05, 0.08, 0.03, 0, D); World.box(g, 0.45, 0.51, sd * 0.065, 0.025, 0.025, 0.025, 0, K); }
    rdRod(g, [-0.26, 0.42, 0], [-0.43, 0.57, 0], 0.035, C);
    World.box(g, 0.285, 0.38, 0, 0.04, 0.16, 0.16, 0, [0.75, 0.1, 0.08]);
    return g.geometry();
  }
  function rdDogLegGeo() { const g = new GB(); World.box(g, 0, -0.29, 0, 0.065, 0.29, 0.065, 0, RD_MG); World.box(g, 0.015, -0.3, 0, 0.085, 0.035, 0.07, 0, [0.55, 0, 0.55]); return g.geometry(); }
  // a pool of blood (on the ground under someone run over, growing): an irregular dark red blob, soft lobes round a full middle, a few drops
  // round its edge (its own random numbers: always the same)
  function rdBloodTex() {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d'); let s = 7;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const blob = (x, y, r, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(104,7,9,${a})`); gr.addColorStop(0.72, `rgba(88,5,7,${a * 0.9})`); gr.addColorStop(1, 'rgba(70,3,5,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); };
    blob(64, 64, 42, 0.96);
    for (let k = 0; k < 16; k++) { const a = rnd() * 6.2832, d = 12 + rnd() * 28, r = 9 + rnd() * 17; blob(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, Math.min(r, 62 - d), 0.92); }
    for (let k = 0; k < 12; k++) { const a = rnd() * 6.2832, d = 46 + rnd() * 12; blob(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 1.5 + rnd() * 3.5, 0.9); }
    return new THREE.CanvasTexture(cv);
  }
  function rdSpikeGeo() {   // a metre of a spike strip (laid across the road, z along it): steel scissor links, yellow reflectors at the joints, spikes up
    const g = new GB(), K = [0.12, 0.12, 0.13], S = [0.9, 0.92, 0.96], Y = [1.0, 0.8, 0.08], hw = 0.28, y = 0.05;
    for (const z of [0, 0.5]) for (const sg of [1, -1]) rdRod(g, [hw * sg, y, z], [-hw * sg, y, z + 0.5], 0.07, K);
    for (const z of [0, 0.5]) for (const sg of [1, -1]) World.box(g, hw * sg, 0.01, z + 0.02, 0.14, 0.085, 0.14, 0, Y);
    for (const z of [0.125, 0.375, 0.625, 0.875]) for (const x of [-hw / 2, hw / 2]) World.cyl(g, x, 0.07, z, 0.03, 0.12, 4, S, S, 0.002);
    return g.geometry();
  }
  // the police's van: white, a blue band with yellow edges along both sides and across the back, the light bar on the roof (its two lamps
  // flash as glows, see updateRoad)
  const RD_PW = [0.94, 0.95, 0.96], RD_PB = [0.1, 0.24, 0.6], RD_PY = [0.86, 0.9, 0.22];
  function rdPolVanGeo() {
    const g = new GB(), hw = 1.006;
    for (const sd of [-1, 1]) { const z = sd * hw;
      g.quadO([-2.64, 0.92, z], [1.9, 0.92, z], [1.9, 1.2, z], [-2.64, 1.2, z], RD_PB, [0, 1, 0]);
      g.quadO([-2.64, 0.88, z], [1.9, 0.88, z], [1.9, 0.92, z], [-2.64, 0.92, z], RD_PY, [0, 1, 0]); g.quadO([-2.64, 1.2, z], [1.9, 1.2, z], [1.9, 1.24, z], [-2.64, 1.24, z], RD_PY, [0, 1, 0]); }
    g.quadO([-2.662, 0.92, -0.99], [-2.662, 0.92, 0.99], [-2.662, 1.2, 0.99], [-2.662, 1.2, -0.99], RD_PB, [0, 1, 0]);
    World.box(g, 1.1, 2.05, 0, 0.34, 0.09, 1.3, 0, [0.1, 0.1, 0.11]);
    for (const sd of [-1, 1]) World.box(g, 1.1, 2.12, sd * 0.36, 0.28, 0.12, 0.46, 0, [0.12, 0.2, 0.55]);
    return rdMerge([rdVanGeo(RD_PW), g.geometry()]);
  }
  // the police motorbike: white, a blue stripe on the tank, a tall screen, panniers, a blue lamp either side of the headlight and at the back
  function rdPolMotoGeo() {
    const g = new GB(), K = [0.08, 0.08, 0.09];
    World.box(g, 0.1, 0.78, 0, 0.5, 0.06, 0.33, 0, RD_PB);
    g.quadO([0.56, 1.05, -0.2], [0.56, 1.05, 0.2], [0.44, 1.42, 0.17], [0.44, 1.42, -0.17], [0.55, 0.62, 0.7], [0, 1.2, 0]);
    for (const sd of [-1, 1]) { World.box(g, -0.62, 0.42, sd * 0.27, 0.46, 0.36, 0.16, 0, RD_PW); World.box(g, -0.62, 0.62, sd * 0.36, 0.44, 0.08, 0.012, 0, RD_PB);
      World.box(g, 0.66, 0.92, sd * 0.12, 0.05, 0.07, 0.07, 0, [0.12, 0.2, 0.55]); }
    World.box(g, -0.84, 0.86, 0, 0.05, 0.08, 0.2, 0, [0.12, 0.2, 0.55]); World.box(g, -0.3, 0.3, 0, 0.3, 0.2, 0.3, 0, K);
    return rdMerge([rdMotoGeo(RD_PW), g.geometry()]);
  }
  // a log: a unit cylinder along x (radius 1, 1 long; scaled per instance), the bark round it, the pale sawn wood at its ends
  function rdLogGeo() {
    const geo = new THREE.CylinderGeometry(1, 1, 1, 10, 1).rotateZ(Math.PI / 2).toNonIndexed(), n = geo.attributes.position.count, N = geo.attributes.normal.array, C = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) C.set(Math.abs(N[i * 3]) > 0.9 ? [0.8, 0.64, 0.42] : [0.29 + 0.04 * ((i >> 2) % 3), 0.21, 0.14], i * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(C, 3)); return geo;
  }
  // a stake (1.3 m, from its foot): the one at the road's edge that holds a log pile back painted in red and white bands with a reflector
  function rdStakeGeo(bands) {
    const g = new GB(), W = [0.45, 0.33, 0.22];
    if (!bands) World.box(g, 0, 0, 0, 0.11, 1.3, 0.11, 0, W);
    else for (let k = 0; k < 5; k++) World.box(g, 0, k * 0.26, 0, 0.11, 0.26, 0.11, 0, k % 2 ? [0.95, 0.95, 0.95] : [0.78, 0.1, 0.08]);
    if (bands) World.box(g, 0, 1.08, 0, 0.13, 0.1, 0.13, 0, [1, 0.72, 0.15]);
    return g.geometry();
  }
  // the traffic checkpoint's things (Race.pol.chk): the officer's STOP paddle (from his grip along +y: the black handle, a round sign facing
  // +-z: a red ring, white inside, a red bar across), a traffic cone (from its foot: orange, a white band), the folding board on the road's
  // edge before it (STOP over POLICIJA on a canvas of its own, on two legs; uv: the board's picture, the legs on its dark corner) and the box
  // the officer sends the driver to park in (a yellow line round it, painted on the road: its height there along it)
  function rdPaddleGeo() {
    const g = new GB(), RED = [0.86, 0.08, 0.07], WH = [0.97, 0.97, 0.95], n = 14, R = 0.14, r = 0.1, c0 = 0.46, t = 0.008;
    World.box(g, 0, 0, 0, 0.03, 0.33, 0.03, 0, [0.08, 0.08, 0.09]);
    const p = (rr, a, z) => [Math.cos(a) * rr, c0 + Math.sin(a) * rr, z];
    for (let k = 0; k < n; k++) { const a0 = k / n * Math.PI * 2, a1 = (k + 1) / n * Math.PI * 2;
      g.quadO(p(R, a0, -t), p(R, a1, -t), p(R, a1, t), p(R, a0, t), RED, [0, c0, 0]);
      for (const z of [-t, t]) { g.quadO(p(R, a0, z), p(R, a1, z), p(r, a1, z), p(r, a0, z), RED, [0, c0, -z * 9]); g.triO(p(r, a0, z), p(r, a1, z), [0, c0, z], WH, [0, c0, -z * 9]); } }
    for (const z of [-t - 0.002, t + 0.002]) g.quadO([-0.075, c0 - 0.02, z], [0.075, c0 - 0.02, z], [0.075, c0 + 0.02, z], [-0.075, c0 + 0.02, z], RED, [0, c0, -z * 9]);
    return g.geometry();
  }
  function rdConeGeo() {
    const g = new GB(), OR = [1, 0.4, 0.07];
    World.box(g, 0, 0, 0, 0.4, 0.04, 0.4, 0, [0.12, 0.12, 0.13]);
    World.cyl(g, 0, 0.04, 0, 0.15, 0.2, 10, OR, null, 0.105); World.cyl(g, 0, 0.24, 0, 0.105, 0.12, 10, [0.96, 0.96, 0.94], null, 0.08); World.cone(g, 0, 0.36, 0, 0.08, 0.2, 10, OR, OR, 0);
    return g.geometry();
  }
  function rdSignMesh() {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 192; const x = cv.getContext('2d');
    x.fillStyle = '#202224'; x.fillRect(0, 0, 128, 192); x.fillStyle = '#f4f4f0'; x.fillRect(4, 4, 120, 168); x.strokeStyle = '#c8170f'; x.lineWidth = 7; x.strokeRect(8, 8, 112, 160);
    x.fillStyle = '#c8170f'; x.beginPath(); for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * Math.PI * 2; x.lineTo(64 + Math.cos(a) * 46, 66 + Math.sin(a) * 46); } x.closePath(); x.fill();
    x.fillStyle = '#fff'; x.font = '900 30px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('STOP', 64, 68, 84);
    x.fillStyle = '#1b3f95'; x.fillRect(12, 124, 104, 40); x.fillStyle = '#fff'; x.font = '900 19px Arial, sans-serif'; x.fillText('POLICIJA', 64, 145, 98);
    const map = new THREE.CanvasTexture(cv); map.anisotropy = 4;
    const g = new GB(true), W1 = [1, 1, 1], K0 = [[0.02, 0.02], [0.05, 0.02], [0.05, 0.05], [0.02, 0.05]], hw = 0.36, y0 = 0.36, y1 = 1.4, uvB = [[0.03, 0.12], [0.97, 0.12], [0.97, 0.98], [0.03, 0.98]];
    for (const f of [-1, 1]) g.quadO([f * 0.025, y0, f * hw], [f * 0.025, y0, -f * hw], [f * 0.025, y1, -f * hw], [f * 0.025, y1, f * hw], W1, [-f, 0.9, 0], uvB);   // (both faces read from the front)
    for (const sz of [-1, 1]) for (const sx of [-1, 1]) { const a = [sx * 0.03, 1.32, sz * (hw - 0.05)], b = [sx * 0.42, 0, sz * (hw - 0.02)], q = [sx * 0.03, 1.32, sz * (hw - 0.09)], d = [sx * 0.42, 0, sz * (hw - 0.06)];
      for (const f of [-1, 1]) g.quadO(a, b, d, q, W1, [0, 0.6, sz * (hw - 0.06) + f * 0.5], K0); }
    const m = new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ map, vertexColors: true })); m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false;
    return m;
  }
  function rdBoxMesh(T, B) {
    const g = new GB(), Y = [1, 1, 1], q = {}, lw = 0.16, ch = Math.cos(B.h), sh = Math.sin(B.h), hl = B.len / 2, hw = B.wid / 2;
    const at = (lx, lz) => { const x = B.x + ch * lx - sh * lz, z = B.z + sh * lx + ch * lz; return [x, T.yAt(T.query(x, z, T.idx(B.s), q)) + 0.045, z]; };
    const strip = (a, e, b, n) => { for (let k = 0; k < n; k++) { const u0 = k / n, u1 = (k + 1) / n, L = (u, o) => at(a[0] + (b[0] - a[0]) * u + o * e[0], a[1] + (b[1] - a[1]) * u + o * e[1]);   // (from a to b, e wide)
      g.quadUp(L(u0, 0), L(u1, 0), L(u1, 1), L(u0, 1), [Y, Y, Y, Y]); } };
    strip([-hl, -hw], [0, lw], [hl, -hw], 6); strip([-hl, hw], [0, -lw], [hl, hw], 6);
    strip([-hl, -hw + lw], [lw, 0], [-hl, hw - lw], 3); strip([hl - lw, -hw + lw], [lw, 0], [hl - lw, hw - lw], 3);
    const m = new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ color: 0xffc81e, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
    m.visible = false; m.renderOrder = 2; m.receiveShadow = true; m.matrixAutoUpdate = false;
    return m;
  }
  // the people: the crew's rig, other clothes (see crewGeos; the trunk carries the trousers in the skin channel: crewSkin is the trousers' colour there)
  function pedGeos() {
    const G = () => new GB(), out = {}, TM = CR_TM, SK = CR_SK, K = CR_K;
    let g = G();   // trunk (from the hip joint): the trousers' top, a belt, the shirt
    crTBox(g, -0.13, 0.05, 0.32, 0.2, 0.33, 0.21, [SK, SK, SK, null, SK]); crTBox(g, 0.04, 0.1, 0.338, 0.215, 0.342, 0.22, [K]);
    crTBox(g, 0.1, 0.34, 0.32, 0.205, 0.36, 0.22, [TM]); crTBox(g, 0.34, 0.55, 0.36, 0.22, 0.4, 0.21, [TM]); crTBox(g, 0.55, 0.62, 0.4, 0.21, 0.19, 0.13, [TM, TM, TM, TM]);
    out.trunk = g.geometry();
    g = G();   // head (from the neck): the neck and the face (skin), the hair (the team channel: its colour)
    World.cyl(g, 0, -0.04, 0.005, 0.056, 0.12, 6, SK); crBall(g, 0, 0.165, 0.008, 0.092, 0.112, 0.103, 6, 4, SK);
    World.cyl(g, 0, 0.19, -0.012, 0.1, 0.1, 7, TM, TM, 0.075); World.box(g, 0, 0.1, -0.075, 0.18, 0.12, 0.05, 0, TM);
    out.head = g.geometry();
    g = G(); crTBox(g, 0.035, -0.3, 0.115, 0.117, 0.088, 0.092, [TM]); out.uarm = g.geometry();   // upper arm: the sleeve
    g = G(); crTBox(g, 0.01, -0.24, 0.082, 0.085, 0.068, 0.07, [SK]); crTBox(g, -0.235, -0.33, 0.072, 0.078, 0.058, 0.09, [SK, SK, SK, SK, SK], 0, 0.01); out.farm = g.geometry();   // forearm, hand
    g = G(); crTBox(g, 0.06, -0.46, 0.15, 0.165, 0.12, 0.128, [TM]); out.thigh = g.geometry();
    g = G(); crTBox(g, 0.02, -0.38, 0.118, 0.128, 0.098, 0.102, [TM]); crTBox(g, -0.47, -0.36, 0.1, 0.25, 0.098, 0.19, [K, K, K, K, K], 0.045, 0.02); out.shin = g.geometry();   // shin and shoe
    g = G(); crBall(g, 0, 0.17, 0.012, 0.13, 0.14, 0.145, 8, 4, (ux, uy) => uy < -0.45 ? CR_TD : (Math.abs(ux) < 0.2 && uy > 0.3 ? CR_W : TM));
    crTBox(g, 0.1, 0.215, 0.17, 0.03, 0.17, 0.03, [[0.05, 0.07, 0.1], null, null, [0.05, 0.07, 0.1], [0.05, 0.07, 0.1]], 0.142, 0.146); out.helmet = g.geometry();
    g = G(); World.box(g, 0, 0.12, -0.2, 0.3, 0.46, 0.17, 0, TM, [0.2, 0.2, 0.22]); out.pack = g.geometry();   // a hiker's backpack
    return out;
  }
  function setupRoad(race) {
    if (road) { scene.remove(road.grp); for (const m of road.meshes) { m.geometry.dispose(); if (m.dispose) m.dispose(); } road.mats.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
      if (road.heli) road.heli.heli.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      for (const o of road.extra) { o.geometry.dispose(); if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
      road = null; }
    if (!race || !race.tf) return;
    const grp = new THREE.Group(), matP = rdMaterial(), mat = crewMaterial(false), matS = crewMaterial(true), matL = new THREE.MeshLambertMaterial({ vertexColors: true }), meshes = [];
    const mk = (geo, n, mt, cast) => { const im = new THREE.InstancedMesh(geo, mt, n); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.castShadow = !!cast; im.receiveShadow = true;
      for (let i = 0; i < n; i++) { im.setMatrixAt(i, _zero); im.setColorAt(i, _pc.setRGB(1, 1, 1)); } im.instanceColor.setUsage(THREE.DynamicDrawUsage); im.count = 0; grp.add(im); meshes.push(im); return im; };   // (the colours before the count goes to 0: three sizes them by it)
    const V = { car: [mk(rdCarGeo('hatch', 'pico'), 40, matP, true), mk(rdCarGeo('sedan', 'vortex'), 40, matP, true), mk(rdCarGeo('coupe', 'kaze'), 24, matP, true)],
      van: mk(rdVanGeo(), 24, matP, true), bus: mk(rdBusGeo(), 8, matP, true), truck: mk(rdTruckGeo(), 20, matP, true), moto: mk(rdMotoGeo(), 12, matP, true), bike: mk(rdBikeGeo(), 64, matP, false),
      pvan: mk(rdPolVanGeo(), 4, matP, true), pmoto: mk(rdPolMotoGeo(), 6, matP, true) };   // (the police's van and motorbikes)
    const NP = 140, PG = pedGeos();
    PG.trunk.setAttribute('crewSkin', new THREE.InstancedBufferAttribute(new Float32Array(NP * 3), 3)); PG.head.setAttribute('crewSkin', new THREE.InstancedBufferAttribute(new Float32Array(NP * 3), 3));
    PG.farm.setAttribute('crewSkin', new THREE.InstancedBufferAttribute(new Float32Array(NP * 6), 3));
    const P = { trunk: mk(PG.trunk, NP, matS, true), head: mk(PG.head, NP, matS, true), uarm: mk(PG.uarm, NP * 2, mat, true), farm: mk(PG.farm, NP * 2, matS, false), thigh: mk(PG.thigh, NP * 2, mat, true), shin: mk(PG.shin, NP * 2, mat, true),
      helmet: mk(PG.helmet, NP, mat, false), pack: mk(PG.pack, NP, mat, false) };
    const S = mk(rdSpikeGeo(), 64, mat, false), LG = mk(rdLogGeo(), 48, matL, true), SK = mk(rdStakeGeo(false), 16, matL, true), SKB = mk(rdStakeGeo(true), 8, matL, true);
    // the dogs (32 at most), their legs, the leashes (two lengths each, sagging), the pools of blood under the dead (32 at most: on the
    // ground, drawn over the asphalt without fighting it)
    const matLs = new THREE.MeshLambertMaterial({ color: 0x8c1d14 }), matB = new THREE.MeshPhongMaterial({ color: 0xb8b8b8, map: rdBloodTex(), transparent: true, depthWrite: false, shininess: 70, specular: 0x2a0a0a, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    const DG = mk(rdDogGeo(), 32, mat, true), DL = mk(rdDogLegGeo(), 128, mat, true), LS = mk(new THREE.BoxGeometry(1, 1, 1).translate(0, 0, 0.5), 64, matLs, false), BL = mk(new THREE.CircleGeometry(1, 24).rotateX(-Math.PI / 2), 32, matB, false);
    BL.renderOrder = 2;
    let heli = null; const extra = [];
    if (race.pol && World.heli) {   // the police helicopter (the TV helicopter's model), hidden until it comes; its searchlight
      heli = World.heli(grp); heli.heli.visible = false; heli.pit = 0; heli.rol = 0;
      const add = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xfff0cc };
      heli.cone = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 1, 1, 20, 1, true).translate(0, -0.5, 0), new THREE.MeshBasicMaterial(Object.assign({ opacity: 0.1, side: THREE.DoubleSide }, add)));
      heli.pool = new THREE.Mesh(new THREE.CircleGeometry(1, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial(Object.assign({ map: rdPoolTex(), opacity: 0.8 }, add)));
      for (const o of [heli.cone, heli.pool]) { o.visible = false; o.frustumCulled = false; o.renderOrder = 6; grp.add(o); extra.push(o); }
    }
    // the traffic checkpoint (the run from the police: pol.chk): the officer's paddle, the cones by the road's edge before him (a taper towards
    // him) and behind his car, the board STOP POLICIJA 45 m before him, the box he sends the driver to park in
    let ck = null;
    if (race.pol && race.pol.chk) {
      const K = race.pol.chk, T = race.track, w = T.w, sign = rdSignMesh(), box = rdBoxMesh(T, K.box);
      grp.add(sign); grp.add(box); extra.push(sign, box);
      const put = (s, d) => { const a = atS2(T, s, K.side * d), i = T.idx(s); return { x: a[0], z: a[1], s, h: T.hd[i], tp: 0, a: 0, vx: 0, vz: 0 }; };
      const c0 = atS2(T, K.s, K.side * (w - 2.2));
      ck = { PD: mk(rdPaddleGeo(), 1, mat, true), CN: mk(rdConeGeo(), 8, mat, true), sign, box, op: 0, pa: Math.PI, cw: null, dw: null, on: true, cx: c0[0], cz: c0[1],
        cones: [[-32, 0.45], [-26, 0.75], [-20, 1.05], [-14, 1.35], [-8, 1.6], [8.4, 0.55], [8.4, 1.75]].map(([o, e]) => put(K.s + o, w - e)), board: put(K.s - 45, w - 0.42) };
    }
    scene.add(grp);
    road = { grp, meshes, mats: [matP, mat, matS, matL, matLs, matB], V, P, NP, S, LG, SK, SKB, DG, DL, LS, BL, heli, extra, ck, men: new Map(), pol: new Map(), n: { veh: 0, ped: 0, off: 0, grp: 0, cgrp: 0, yld: 0, ind: 0, dead: 0, cop: 0, drv: 0 }, arrest: null };
  }
  function rdPoolTex() {   // the searchlight's pool of light: a soft disc
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
    gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
  }
  const _rm = new THREE.Matrix4(), _rq = new THREE.Quaternion(), _re = new THREE.Euler(), _rv = new THREE.Vector3(), _rs = new THREE.Vector3(1, 1, 1), _rm2 = new THREE.Matrix4(), _rm3 = new THREE.Matrix4(), _rax = new THREE.Vector3(), _down = new THREE.Vector3(0, -1, 0);
  const RD_JOINTS = ['pel', 'neck', 'shL', 'elL', 'hdL', 'shR', 'elR', 'hdR', 'hipL', 'knL', 'hipR', 'knR'];
  function rdTilt(m, ax, az, a, py) {   // the whole rig turned by a about the horizontal axis (ax, 0, az) through the point py above its feet
    if (!a) return;
    _rax.set(ax, 0, az); _rm2.makeRotationAxis(_rax, a);
    _rm.makeTranslation(m.x, m.y + py, m.z).multiply(_rm2).multiply(_rm3.makeTranslation(-m.x, -(m.y + py), -m.z));
    for (const k of RD_JOINTS) CRM[k].premultiply(_rm);
  }
  // one person on the road: where they are, what they do (st: the Core's state, or 'ride' / 'moto' / 'signal' / 'talk' / 'stand'), how fast
  function rdMan(key, look, kind) {
    let m = road.men.get(key);
    if (!m) { const h1 = crHash(look * 91.7 + 3.1), h2 = crHash(look * 37.3 + 9.7), h3 = crHash(look * 11.9 + 1.3);
      m = { x: 0, y: 0, z: 0, yaw: 0, sc: kind === 2 ? 0.72 : 0.94 + h1 * 0.12, bulk: 0.9 + h2 * 0.22, O: new Float32Array(CR_STAND), H: new Float32Array(CR_RELAX), ph: h2 * 6, t0: h3 * 50, h1, h2, act: 'stand', look: 0, spd: 0, lie: h1 > 0.5 ? 1 : -1, seen: 0,
        shirt: new THREE.Color(rdPick(RD_SHIRT, h1)), trou: new THREE.Color(rdPick(RD_TROU, h2)), hair: new THREE.Color(rdPick(RD_HAIR, h3)), skin: CR_SKINS[Math.min(4, (h3 * 3.2) | 0)], pack: new THREE.Color(rdPick(RD_PACK, h2)) };
      road.men.set(key, m); }
    m.seen = time; return m;
  }
  function rdPose(m, x, y, z, yaw, st, spd, dt, t, roll, lean) {
    m.x = x; m.y = y; m.z = z; m.yaw += wrapPi(yaw - m.yaw) * Math.min(1, dt * 9); m.spd = spd; m.ph += spd * dt / (spd > 2.2 ? 2.4 : 1.4) * CR_TAU;
    m.act = st === 'signal' || st === 'talk' ? st : st === 'zwait' || st === 'xwait' || st === 'stop' || st === 'stand2' ? (m.h1 > 0.55 ? 'cross' : m.h1 > 0.3 ? 'hips' : 'stand') : 'stand';
    crPose(m, time, _cO, _cH);
    const walk = clamp(spd / 0.8, 0, 1), run = clamp((spd - 2) / 1.6, 0, 1);
    if (walk > 0 && st !== 'ride' && st !== 'moto') { crGait(m, run, _cO2, _cH2); for (let k = 0; k < 12; k++) { _cO[k] += (_cO2[k] - _cO[k]) * walk; _cH[k] += (_cH2[k] - _cH[k]) * walk; } }
    let tilt = 0, py = 0.9;
    if (st === 'ride' || st === 'moto') {   // on the saddle: leaning to the bars, pedalling (a motorbike: the knees up, still)
      const mo = st === 'moto', s = Math.sin(m.ph), c = Math.cos(m.ph);
      _cO[0] = mo ? 0.8 : 0.95; _cO[1] = mo ? 0.32 : 0.62; _cO[2] = 0; _cO[3] = 0; _cO[4] = mo ? -0.15 : -0.45; _cO[5] = 0;
      if (mo) { _cO[6] = -1.4; _cO[7] = 0.22; _cO[8] = 1.95; _cO[9] = -1.4; _cO[10] = -0.22; _cO[11] = 1.95; }
      else { _cO[6] = -1.05 + 0.42 * s; _cO[7] = 0.04; _cO[8] = 1.35 + 0.5 * c; _cO[9] = -1.05 - 0.42 * s; _cO[10] = -0.04; _cO[11] = 1.35 - 0.5 * c; }
      const hy = mo ? 0.98 : 1.0, hz = mo ? 0.5 : 0.56, hx = mo ? 0.3 : 0.21;
      _cH[0] = hx; _cH[1] = hy; _cH[2] = hz; _cH[3] = -hx; _cH[4] = hy; _cH[5] = hz; _cH[6] = 1; _cH[7] = -0.2; _cH[8] = -0.6; _cH[9] = -1; _cH[10] = -0.2; _cH[11] = -0.6;
    } else if (st === 'fly') { tilt = roll; _cH[0] = 0.35; _cH[1] = 1.9; _cH[2] = 0.1; _cH[3] = -0.35; _cH[4] = 1.85; _cH[5] = 0.2; _cO[6] = -0.5; _cO[8] = 0.9; _cO[9] = 0.3; _cO[11] = 0.4; }   // thrown: tumbling, the arms flung up
    else if (st === 'down' || st === 'up') {   // lying (face down or up), then getting up
      const k = st === 'down' ? 1 : 1 - crSS(0.15, 1.2, t); tilt = m.lie * 1.52 * k; py = 0.12;
      _cH[0] = 0.55; _cH[1] = 1.3; _cH[2] = 0.1; _cH[3] = -0.55; _cH[4] = 1.25; _cH[5] = 0.05;
      if (st === 'up' && k < 0.8 && k > 0.1) for (let n = 0; n < 12; n++) _cO[n] += (CR_KNEEL[n] - _cO[n]) * 0.6;
    } else if (st === 'hit' || st === 'dead') {   // run over: down onto the road (over the first 0.3 s), then lying flat for good, the limbs splayed, the head turned
      const k = st === 'dead' ? 1 : crSS(0, 0.3, t), sd = m.h1 > 0.5 ? 1 : -1; tilt = m.lie * 1.53 * k; py = 0.1;
      _cH[0] = 0.62; _cH[1] = 1.5; _cH[2] = 0.22; _cH[3] = -0.72; _cH[4] = 1.08; _cH[5] = -0.12;   // (one arm flung up past the head, the other out to the side)
      _cO[0] = 0.92; _cO[1] = 0; _cO[2] = 0.1 * sd; _cO[3] = 0.1 * sd; _cO[4] = 0; _cO[5] = 0.85 * sd; _cO[6] = 0.12; _cO[7] = 0.34; _cO[8] = 0.08; _cO[9] = -0.18; _cO[10] = -0.3; _cO[11] = 0.3;
    } else if (m.leash) {   // the leash in one hand (1 left, 2 right), a little forward
      const k = m.leash === 1 ? 0 : 3; _cH[k] = m.leash === 1 ? 0.24 : -0.24; _cH[k + 1] = 0.98; _cH[k + 2] = 0.2;
    }
    const ko = 1 - Math.exp(-dt * (st === 'fly' || st === 'down' || st === 'hit' || st === 'dead' ? 30 : walk > 0.3 ? 24 : 12)), kh = 1 - Math.exp(-dt * 14);
    for (let k = 0; k < 12; k++) { m.O[k] += (_cO[k] - m.O[k]) * ko; m.H[k] += (_cH[k] - m.H[k]) * kh; }
    crRig(m);
    if (tilt) rdTilt(m, Math.sin(m.yaw), -Math.cos(m.yaw), tilt, py);
    if (lean) rdTilt(m, Math.cos(m.yaw), Math.sin(m.yaw), lean, 0);
  }
  // a dog at slot i (road.DG, its legs road.DL): where the Core has it, its gait phase kept in its owner's man (m.dph); trotting (the legs two by
  // two, diagonally; quicker and wider as it runs), sitting (sit 0..1: the body up at the front about its hind hips, the front legs straight
  // down, the hind ones folded under it) -> the body's matrix
  const _dgM = new THREE.Matrix4(), _dgL = new THREE.Matrix4(), _dgT = new THREE.Matrix4();
  function rdDog(i, m, D, y, dt) {
    const Q = road, sz = D.sz, k = D.sit || 0;
    m.dph = (m.dph || 0) + D.v * dt / (0.42 * sz) * Math.PI;   // (a stride every ~0.8 m)
    _re.set(0, -D.h, 0, 'YXZ'); _rq.setFromEuler(_re); _rv.set(D.x, y, D.z); _rs.set(sz, sz, sz); _dgM.compose(_rv, _rq, _rs); _rs.set(1, 1, 1);
    if (k > 0) { _dgT.makeTranslation(-0.2, 0.3 - 0.18 * k, 0).multiply(_dgL.makeRotationZ(0.55 * k)).multiply(_rm3.makeTranslation(0.2, -0.3, 0)); _dgM.multiply(_dgT); }
    Q.DG.setMatrixAt(i, _dgM); Q.DG.setColorAt(i, _pc.setHex(D.col));
    const A = Math.min(0.7, 0.15 + 0.22 * D.v) * (1 - k), ph = m.dph;
    for (let j = 0; j < 4; j++) { const fr = j < 2, sd = j % 2 ? 1 : -1, sw = D.v > 0.1 ? A * Math.sin(ph + (fr === (sd > 0) ? 0 : Math.PI)) : 0, rot = fr ? sw - 0.55 * k : sw + 1.1 * k;
      _dgL.makeRotationZ(rot).setPosition(fr ? 0.19 : -0.2, 0.3, sd * 0.07); _dgT.multiplyMatrices(_dgM, _dgL); Q.DL.setMatrixAt(i * 4 + j, _dgT); Q.DL.setColorAt(i * 4 + j, _pc.setHex(D.col)); }
    return _dgM;
  }
  function rdPut(m, i, gear) {   // the rig's parts into the instanced meshes at slot i; gear: 1 a helmet, 2 a backpack
    const P = road.P, rel = (im, k, src) => im.setMatrixAt(k, src);
    _cM.copy(CRM.pel); { const e = _cM.elements, bz = 0.6 + 0.4 * m.bulk; e[0] *= m.bulk; e[1] *= m.bulk; e[2] *= m.bulk; e[8] *= bz; e[9] *= bz; e[10] *= bz; } rel(P.trunk, i, _cM);
    rel(P.head, i, CRM.neck); rel(P.helmet, i, gear === 1 ? CRM.neck : _zero); rel(P.pack, i, gear === 2 ? CRM.pel : _zero);
    rel(P.uarm, i * 2, CRM.shL); rel(P.uarm, i * 2 + 1, CRM.shR); rel(P.farm, i * 2, CRM.elL); rel(P.farm, i * 2 + 1, CRM.elR);
    rel(P.thigh, i * 2, CRM.hipL); rel(P.thigh, i * 2 + 1, CRM.hipR); rel(P.shin, i * 2, CRM.knL); rel(P.shin, i * 2 + 1, CRM.knR);
    P.trunk.setColorAt(i, m.shirt); P.uarm.setColorAt(i * 2, m.shirt); P.uarm.setColorAt(i * 2 + 1, m.shirt); P.head.setColorAt(i, m.hair); P.pack.setColorAt(i, m.pack); P.helmet.setColorAt(i, m.helm || m.shirt);
    for (const k of ['thigh', 'shin']) { P[k].setColorAt(i * 2, m.trou); P[k].setColorAt(i * 2 + 1, m.trou); }
    P.trunk.geometry.attributes.crewSkin.setXYZ(i, m.trou.r, m.trou.g, m.trou.b); P.head.geometry.attributes.crewSkin.setXYZ(i, m.skin[0], m.skin[1], m.skin[2]);
    const fs = P.farm.geometry.attributes.crewSkin; fs.setXYZ(i * 2, m.skin[0], m.skin[1], m.skin[2]); fs.setXYZ(i * 2 + 1, m.skin[0], m.skin[1], m.skin[2]);
  }
  // the patrol cars' look (on the views of Race.pol's cars): the number off, a blue band on both sides reading POLICIJA, the light bar
  let polTex = null, polKey = '', matPolBand = null, matPolOn = null, matPolOff = null, matPolBar = null;
  function polGear(v) {
    const c = v.car, M = c.m, def = BODIES[M.body];
    const PL = (curTrack && curTrack.def.police) || {}, pk = (PL.label || '') + (PL.band || '');   // (a road's own police: def.police, the label and the colour of the band)
    if (polTex && polKey !== pk) { polTex.dispose(); [matPolBand, matPolOn, matPolOff, matPolBar].forEach(m => m && m.dispose()); polTex = null; }
    if (!polTex) { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 64; const g = cv.getContext('2d'); g.fillStyle = PL.band || '#1b3f95'; g.fillRect(0, 0, 512, 64); g.fillStyle = PL.text || '#f4f6fa';
      g.font = 'bold 44px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(PL.label || 'POLICIJA', 256, 34, 480); g.fillStyle = '#d8e43a'; g.fillRect(0, 0, 512, 5); g.fillRect(0, 59, 512, 5);
      polTex = new THREE.CanvasTexture(cv); polKey = pk; matPolBand = new THREE.MeshLambertMaterial({ map: polTex }); matPolOn = new THREE.MeshBasicMaterial({ color: 0x3a78ff }); matPolOff = new THREE.MeshLambertMaterial({ color: 0x0e1c3c }); matPolBar = new THREE.MeshLambertMaterial({ color: 0x1a1a1a }); }
    v.dec.visible = false;
    const L = M.len * 0.62, hb = new THREE.PlaneGeometry(L, L / 8), y = def.secs ? (def.secs[Math.floor(def.secs.length / 2)][2] + def.secs[Math.floor(def.secs.length / 2)][3]) * 0.5 + 0.06 : 0.62;
    for (const sd of [-1, 1]) { const b = new THREE.Mesh(hb, matPolBand); b.position.set(-0.05, y, sd * (M.wid * 0.5 + 0.015)); b.rotation.y = sd > 0 ? 0 : Math.PI; v.bodyG.add(b); }
    const bar = new THREE.Group(), w = M.wid * 0.6; bar.add(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.07, w), matPolBar));
    v.polLamps = [-1, 1].map(sd => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, w * 0.4), matPolOff); l.position.set(0, 0.08, sd * w * 0.27); bar.add(l); return l; });
    bar.position.set(v.dec.position.x, v.dec.position.y + 0.04, 0); v.bodyG.add(bar); v.polBar = bar; v.polBand = hb;
  }
  function updateRoad(dt) {
    const Q = road, R = curRace; if (!Q || !R || !R.tf) return;
    const tf = R.tf, T = R.track, cx = cam.vcx || 0, cz = cam.vcz || 0, far = 250 * 250, near2 = 150 * 150, dusk = atmos.tod !== 'day', rl = atmos.tod === 'night' ? 1.5 : 1.25;
    // the vehicles
    const V = Q.V, cnt = new Map(); let nv = 0, nyl = 0, nind = 0; const cg = new Map();
    const put = (im, v, col, roll, lift) => { const i = cnt.get(im) || 0; if (i >= im.instanceMatrix.count) return false; cnt.set(im, i + 1);
      const pitch = v.st === 0 ? Math.atan((T.grade ? T.grade[v.i] || 0 : 0) * v.dir) : 0, y = (world && world.groundH && v.st > 0 ? Math.max(v.y, world.groundH(v.x, v.z)) : v.y) + (lift || 0);
      _re.set(roll || 0, -v.h, pitch, 'YZX'); _rq.setFromEuler(_re); _rv.set(v.x, y, v.z); _rm.compose(_rv, _rq, _rs); im.setMatrixAt(i, _rm); im.setColorAt(i, _pc.setHex(col)); return true; };
    for (const v of tf.veh) {
      if (v.off) continue; const dx = v.x - cx, dz = v.z - cz, d2 = dx * dx + dz * dz; if (d2 > far) continue;
      const K = v.kind, u = v.col, lay = v.st > 0 && K >= 3;
      const ok = K === 0 ? put(V.car[Math.floor(u * 7.3) % 3], v, rdPick(RD_CAR, (u * 13.7) % 1)) : K === 1 ? put(V.van, v, rdPick(RD_VAN, u)) : K === 2 ? (v.p === 5 ? put(V.truck, v, rdPick(RD_TRUCK, u)) : put(V.bus, v, rdPick(RD_BUS, u))) :
        put(K === 3 ? V.moto : V.bike, v, rdPick(K === 3 ? RD_MOTO : RD_BIKE, u), lay ? 1.45 * (u > 0.5 ? 1 : -1) : v.lean, lay ? 0.05 : 0);
      if (!ok) continue; nv++;
      if (v.grp) cg.set(v.grp, (cg.get(v.grp) || 0) + 1); if (v.yl === 1) nyl++;
      // the lights: headlights and tail lights at dusk and at night (the brake lights always), the hazard lights of a wreck, the indicators
      // (amber, blinking on the side it moves over to: pulling over for the police, back into its lane, round something)
      if (d2 < 120 * 120 && K < 4) { const ch = Math.cos(v.h), sh = Math.sin(v.h), hl = v.len / 2 - 0.05, hw = K === 3 ? 0 : v.wid * 0.36, hy = v.y + (K === 2 ? 0.75 : 0.62);
        const at = (lx, lz) => [v.x + ch * lx - sh * lz, v.z + sh * lx + ch * lz], haz = v.st > 0 && K < 3 && time % 0.9 < 0.45;
        for (const sd of K === 3 ? [0] : [-1, 1]) {
          if (dusk && v.st === 0) { const [x, z] = at(hl, sd * hw); glows.add(x, hy, z, 0.95, 1.0, 0.88, 0.62, 0.17 * rl); }
          if (v.brake || dusk || haz) { const [x, z] = at(-hl, sd * hw); glows.add(x, hy + 0.1, z, v.brake ? 1.6 : 0.9, 1.0, 0.15, 0.08, v.brake ? 0.85 : 0.28 * rl); }
          if (haz) for (const e of [hl, -hl]) { const [x, z] = at(e, sd * (hw + 0.1)); glows.add(x, hy, z, 1.3, 1.0, 0.55, 0.08, 0.9); }
        }
        if (v.ind && v.st === 0) { nind++; if ((time + v.id * 0.137) % 0.7 < 0.38) { const sd = v.ind * v.dir, lw = K === 3 ? 0.14 : v.wid / 2 + 0.04; for (const e of [hl + 0.03, -hl - 0.03]) { const [x, z] = at(e, sd * lw); glows.add(x, hy + 0.06, z, 1.1, 1.0, 0.6, 0.0, 1.0); } } } }
    }
    for (const im of [...V.car, V.van, V.bus, V.truck, V.moto, V.bike]) { im.count = cnt.get(im) || 0; if (im.count) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; } }
    // the people: the Core's (on foot; a rider thrown off), the riders on their bicycles and motorbikes, an officer by each parked patrol car
    const P = Q.P, NP = Q.NP; let np = 0, nd = 0, nl = 0, nb = 0, ndead = 0; const pg = new Map();
    const gy = (x, z, y) => world && world.groundH ? Math.max(y - 0.5, world.groundH(x, z)) : y;
    const pedY = (p, x, z) => rdGroundY(T, p.s, p.d, x, z, p.y);
    for (const p of tf.ped) {
      if (np >= NP) break; if (p.off) continue; const dx = p.x - cx, dz = p.z - cz; if (dx * dx + dz * dz > near2) continue;
      const m = rdMan(p.id, p.look, p.kind), fly = p.st === 'fly', y = fly ? p.y : pedY(p, p.x, p.z), D = p.dog, dead = p.st === 'dead' || p.st === 'hit';
      if (p.pol) { m.shirt.setHex(0xd8e43a); m.trou.setHex(0x1c2842); m.helm = m.helm || new THREE.Color(0xf4f5f7); }   // (a police motorcyclist)
      if (p.kind === 3) m.helm = m.helm || new THREE.Color(rdPick(RD_BIKE, m.h2));
      m.leash = D ? ((D.x - p.x) * Math.sin(m.yaw) - (D.z - p.z) * Math.cos(m.yaw) > 0 ? 1 : 2) : 0;   // (the hand on the dog's side)
      rdPose(m, p.x, y, p.z, p.h, p.st, p.v2 || 0, dt, p.t, p.roll, 0);
      if (p.grp) pg.set(p.grp, (pg.get(p.grp) || 0) + 1);
      if (dead && nb < 32) {   // the pool of blood: under the body (between the hips and the neck), on the ground, as large as the Core has it grown
        ndead++; _cv.setFromMatrixPosition(CRM.pel); _cv2.setFromMatrixPosition(CRM.neck); const bx = (_cv.x + _cv2.x) / 2, bz = (_cv.z + _cv2.z) / 2, r = Math.max(0.05, p.bl || 0.1);
        _re.set(0, (p.id * 2.39) % 6.283, 0, 'YXZ'); _rq.setFromEuler(_re); _rv.set(bx, pedY(p, bx, bz) + 0.04, bz); _rs.set(r, 1, r * (0.85 + 0.15 * Math.sin(p.id))); _rm.compose(_rv, _rq, _rs); _rs.set(1, 1, 1);
        Q.BL.setMatrixAt(nb, _rm); Q.BL.setColorAt(nb++, _pc.setRGB(0.78 + 0.22 * Math.abs(Math.sin(p.id * 1.7)), 0.85, 0.85));
      }
      if (D && nd < 32) {   // the dog: trotting (its legs in a trot, two by two), sitting (the front up, the hind legs folded); its leash from the hand to its collar, sagging
        const dg = rdDog(nd++, m, D, pedY(p, D.x, D.z), dt);
        if (m.leash && nl < 63) { _cv.set(0, 0, 0.03).applyMatrix4(m.leash === 1 ? CRM.hdL : CRM.hdR); _cv2.set(0.3, 0.46, 0).applyMatrix4(dg);
          const L = Math.hypot(_cv2.x - _cv.x, _cv2.y - _cv.y, _cv2.z - _cv.z), sag = Math.sqrt(Math.max(0, 0.81 - L * L / 4)) * 0.75, mx = (_cv.x + _cv2.x) / 2, my = Math.max((_cv.y + _cv2.y) / 2 - sag, y + 0.04), mz = (_cv.z + _cv2.z) / 2;
          crSetRod(Q.LS, nl++, _cv.x, _cv.y, _cv.z, mx, my, mz, 0.014); crSetRod(Q.LS, nl++, mx, my, mz, _cv2.x, _cv2.y, _cv2.z, 0.014); }
      }
      rdPut(m, np++, p.kind === 3 ? 1 : p.kind === 1 ? 2 : 0);
    }
    Q.DG.count = nd; Q.DL.count = nd * 4; Q.LS.count = nl; Q.BL.count = nb;
    for (const im of [Q.DG, Q.DL, Q.LS, Q.BL]) if (im.count) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
    let ngp = 0, ncg = 0; for (const n of pg.values()) if (n > 1) ngp++; for (const n of cg.values()) if (n > 1) ncg++;
    Q.n.grp = ngp; Q.n.cgrp = ncg; Q.n.yld = nyl; Q.n.ind = nind; Q.n.dead = ndead;
    for (const v of tf.veh) {
      if (np >= NP) break; if (v.off || v.kind < 3 || v.st > 0 || v.rider) continue; const dx = v.x - cx, dz = v.z - cz; if (dx * dx + dz * dz > near2) continue;
      const m = rdMan('r' + v.id, v.col, 0); m.helm = m.helm || new THREE.Color(rdPick(v.kind === 3 ? RD_MOTO : RD_BIKE, (v.col * 7.1) % 1));
      rdPose(m, v.x, v.y, v.z, v.h, v.kind === 3 ? 'moto' : 'ride', v.v, dt, 0, 0, v.lean); rdPut(m, np++, 1);
    }
    const PC = R.pol ? R.pol.cars : [], Pl = R.player;
    for (const c of PC) {   // an officer in a yellow vest beside each parked patrol car, waving when the player comes (not by the van, not at an ambush; the checkpoint's: its own, below)
      if (np >= NP || c.pol.mode !== 'park' || c.pol.kind === 'van' || c.pol.chk) continue; const dx = c.x - cx, dz = c.z - cz; if (dx * dx + dz * dz > near2) continue;
      const q = c.q, sd = q.d > 0 ? -1 : 1, x = c.x + T.nx[q.i] * sd * 1.6 + T.tx[q.i] * 2.2, z = c.z + T.nz[q.i] * sd * 1.6 + T.tz[q.i] * 2.2;
      const m = rdMan('o' + c.id, (c.id * 0.37) % 1, 0); m.shirt.setHex(0xd8e43a); m.trou.setHex(0x1c2842); m.hair.setHex(0x1c2842);
      const wave = Pl && Math.hypot(Pl.x - x, Pl.z - z) < 110;
      rdPose(m, x, gy(x, z, c.y), z, Math.atan2(-T.tz[q.i], -T.tx[q.i]), wave ? 'signal' : 'stand', 0, dt, 0, 0, 0); rdPut(m, np++, 0);
    }
    if (Q.ck && R.pol) np = rdCheck(Q, R, T, Pl, np, dt, cx, cz);   // (the traffic checkpoint)
    // the police motorbikes (one instance each, white; leaning into the bends; on their side once down) and their riders (a yellow jacket, a
    // white helmet), the blue lamps flashing
    let nvn = 0, nmo = 0;
    const flash = (id, k) => { const ph = (time * 1.7 + id * 0.31) % 1; return k ? (ph > 0.5 && ph < 0.62) || (ph > 0.7 && ph < 0.82) : ph < 0.12 || (ph > 0.2 && ph < 0.32); };
    const lamp = (x, y, z, big) => glows.add(x, y, z, (dusk ? 3.0 : 2.0) * (big || 1), 0.25, 0.45, 1.0, dusk ? 1 : 0.85);
    for (const c of PC) {
      const K = c.pol.kind; if (K !== 'moto' && K !== 'van') continue;
      const dx = c.x - cx, dz = c.z - cz; if (dx * dx + dz * dz > far) continue;
      const m = c.pol.mode, lit = m === 'chase' || m === 'search' || m === 'park', ch = Math.cos(c.h), sh = Math.sin(c.h), gr = T.grade ? T.grade[c.q.i] || 0 : 0;
      if (K === 'van') {
        if (nvn >= 4) continue;
        _re.set(0, -c.h, Math.atan(gr * (ch * T.tx[c.q.i] + sh * T.tz[c.q.i])), 'YZX'); _rq.setFromEuler(_re); _rv.set(c.x, c.y, c.z); _rm.compose(_rv, _rq, _rs); V.pvan.setMatrixAt(nvn++, _rm);
        if (lit) for (const k of [0, 1]) if (flash(c.id, k)) { const lz = (k ? 1 : -1) * 0.36; lamp(c.x + ch * 1.1 - sh * lz, c.y + 2.2, c.z + sh * 1.1 + ch * lz); }
        continue;
      }
      if (nmo >= 6) continue;
      const down = m === 'down', lean = down ? 1.45 * c.pol.side : clamp(-(c.w || 0) * c.speed / 9.8, -0.75, 0.75);
      c.pol.lean = (c.pol.lean || 0) + (lean - (c.pol.lean || 0)) * Math.min(1, dt * (down ? 12 : 5));
      _re.set(c.pol.lean, -c.h, down ? 0 : Math.atan(gr * (ch * T.tx[c.q.i] + sh * T.tz[c.q.i])), 'YZX'); _rq.setFromEuler(_re); _rv.set(c.x, c.y + (down ? 0.05 : 0), c.z); _rm.compose(_rv, _rq, _rs); V.pmoto.setMatrixAt(nmo++, _rm);
      if (!down && np < NP && dx * dx + dz * dz < near2) {
        const r = rdMan('pm' + c.id, 0.37, 0); r.shirt.setHex(0xd8e43a); r.trou.setHex(0x1c2842); r.helm = r.helm || new THREE.Color(0xf4f5f7);
        rdPose(r, c.x, c.y, c.z, c.h, 'moto', c.speed, dt, 0, 0, c.pol.lean); rdPut(r, np++, 1);
      }
      if (lit && !down) { const up = Math.cos(c.pol.lean);
        for (const k of [0, 1]) if (flash(c.id, k)) { const lz = (k ? 1 : -1) * 0.13, s = Math.sin(c.pol.lean); lamp(c.x + ch * 0.68 - sh * (lz + s * 0.9), c.y + 0.92 * up, c.z + sh * 0.68 + ch * (lz + s * 0.9), 0.7); }
        if (flash(c.id, 0) || flash(c.id, 1)) lamp(c.x - ch * 0.86, c.y + 0.9 * up, c.z - sh * 0.86, 0.6); }
    }
    V.pvan.count = nvn; V.pmoto.count = nmo; for (const im of [V.pvan, V.pmoto]) if (im.count) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
    // busted: two officers get out of the nearest patrol car and walk to the player's car (one to the driver's door, one in front of it); not
    // after the arrest at the checkpoint (arrestK 'chk': its officer and the driver, rdCheck)
    let noff = 0;
    if (R.pol && R.pol.busted && R.pol.arrestK !== 'chk' && Pl) {
      if (!Q.arrest) { let best = null, bd = 60; for (const c of PC) { if (c.pol.kind === 'van' || c.pol.kind === 'moto' || c.pol.mode === 'down') continue; const d = Math.hypot(c.x - Pl.x, c.z - Pl.z); if (d < bd) { bd = d; best = c; } } Q.arrest = { c: best, t: 0 }; }
      const A = Q.arrest; A.t += dt;
      if (A.c) for (let k = 0; k < 2 && np < NP; k++) {
        const c = A.c, ch = Math.cos(c.h), sh = Math.sin(c.h), sd = k ? 1 : -1, x0 = c.x + ch * 0.2 - sh * sd * 1.3, z0 = c.z + sh * 0.2 + ch * sd * 1.3;   // (at its doors)
        const pc = Math.cos(Pl.h), ps = Math.sin(Pl.h), x1 = k ? Pl.x + pc * 2.9 - ps * 0.8 : Pl.x + pc * 0.25 + ps * 1.6, z1 = k ? Pl.z + ps * 2.9 + pc * 0.8 : Pl.z + ps * 0.25 - pc * 1.6;   // (the driver's door on the left, in front on the right)
        const L = Math.max(1, Math.hypot(x1 - x0, z1 - z0)), go = clamp((A.t - 0.9 - k * 0.35) * 1.5 / L, 0, 1), walk = go > 0 && go < 1;
        const x = x0 + (x1 - x0) * go, z = z0 + (z1 - z0) * go, yaw = walk ? Math.atan2(z1 - z0, x1 - x0) : go >= 1 ? Math.atan2(Pl.z - z, Pl.x - x) : c.h;
        const m = rdMan('ar' + k, 0.21 + k * 0.5, 0); m.shirt.setHex(0x22324f); m.trou.setHex(0x1c2842); m.hair.setHex(0x1a1a1a); m.helm = m.helm || new THREE.Color(0x1c2842);
        rdPose(m, x, gy(x, z, Pl.y), z, yaw, go >= 1 ? 'signal' : 'stand', walk ? 1.5 : 0, dt, 0, 0, 0); rdPut(m, np++, 1); noff++;
      }
    } else Q.arrest = null;
    for (const k in P) { const im = P[k]; im.count = k === 'uarm' || k === 'farm' || k === 'thigh' || k === 'shin' ? np * 2 : np; if (np) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; } }
    if (np) for (const k of ['trunk', 'head', 'farm']) P[k].geometry.attributes.crewSkin.needsUpdate = true;
    if (Q.men.size > 400) for (const [k, m] of Q.men) if (time - m.seen > 5) Q.men.delete(k);
    Q.n.veh = nv; Q.n.ped = np; Q.n.off = noff;
    // the patrol cars (and the unmarked car): a view each (as the race's cars); a patrol car's gear, its lamps flashing blue (two quick flashes
    // a side) while it chases, searches or stands at a strip or a roadblock (dark while it waits in an ambush); the unmarked car's hidden
    // lamps behind its grille and its windscreen once it has shown itself
    if (R.pol) {
      for (const c of PC) if (!Q.pol.has(c) && (c.pol.kind === 'car' || c.pol.kind === 'uc')) { const v = makeView(c); if (c.pol.kind === 'car') polGear(v); else v.dec.visible = false; views.push(v); Q.pol.set(c, v); }
      for (const [c, v] of Q.pol) if (PC.indexOf(c) < 0) { const k = views.indexOf(v); if (k >= 0) views.splice(k, 1); disposeView(v); Q.pol.delete(c); }
      for (const [c, v] of Q.pol) {
        const m = c.pol.mode, on = m === 'chase' || m === 'search' || m === 'park' || m === 'out', a = on && flash(c.id, 0), b = on && flash(c.id, 1), near = Math.hypot(c.x - cx, c.z - cz) < 180;
        if (v.polLamps) { v.polLamps[0].material = a ? matPolOn : matPolOff; v.polLamps[1].material = b ? matPolOn : matPolOff;
          if ((a || b) && near) { v.polBar.updateMatrixWorld(true); _rv.setFromMatrixPosition(v.polLamps[a ? 0 : 1].matrixWorld); glows.add(_rv.x, _rv.y + 0.05, _rv.z, dusk ? 3.2 : 2.2, 0.25, 0.45, 1.0, dusk ? 1 : 0.85); } }
        else if ((a || b) && near && m !== 'out') { const ch = Math.cos(c.h), sh = Math.sin(c.h), hl = c.m.len / 2, lz = (a ? -1 : 1) * 0.32;
          lamp(c.x + ch * (hl - 0.05) - sh * lz, c.y + 0.58, c.z + sh * (hl - 0.05) + ch * lz, 0.75); lamp(c.x + ch * 0.55 + sh * lz, c.y + 1.12, c.z + sh * 0.55 - ch * lz, 0.55); }
      }
      // the spike strips (only while laid), a metre at a time (the last one shortened)
      let ns = 0; for (const sp of R.pol.spikes) { if (!sp.on) continue; const i = T.idx(sp.s), L = sp.d1 - sp.d0; _re.set(0, -T.hd[i], 0, 'YZX'); _rq.setFromEuler(_re);
        for (let k = 0; k < L && ns < 64; k++) { const a = atS2(T, sp.s, sp.d0 + k); _rv.set(a[0], T.hy[i] + 0.02, a[1]); _rs.set(1, 1, Math.min(1, L - k)); _rm.compose(_rv, _rq, _rs); Q.S.setMatrixAt(ns++, _rm); } }
      _rs.set(1, 1, 1);
      Q.S.count = ns; if (ns) Q.S.instanceMatrix.needsUpdate = true;
      // the log piles: stacked on the bank behind two stakes, the red and white one at the road's edge that holds them; let go: the logs
      // rolling down and across the road (turning as they go), the stakes knocked flat
      let nl = 0, nk = 0, nb = 0;
      const putLog = (x, z, y, yaw, roll, len, r) => { if (nl >= 48) return; _re.set(roll, -yaw, 0, 'YXZ'); _rq.setFromEuler(_re); _rv.set(x, y, z); _rs.set(len, r, r); _rm.compose(_rv, _rq, _rs); Q.LG.setMatrixAt(nl++, _rm); _rs.set(1, 1, 1); };
      const putStake = (im, x, z, y, yaw, tilt) => { _re.set(tilt, -yaw, 0, 'YXZ'); _rq.setFromEuler(_re); _rv.set(x, y, z); _rm.compose(_rv, _rq, _rs); im.setMatrixAt(im === Q.SKB ? nb++ : nk++, _rm); };
      for (const L of R.pol.traps || []) {
        if (L.st === 2 || !Pl || Math.abs(L.s - Pl.q.s) > 420) continue;
        const i = T.idx(L.s), hd = Math.atan2(T.tz[i], T.tx[i]), w = T.w, sd = L.side, yr = T.hy[i], down = L.st > 0;
        { const a = atS2(T, L.s, sd * (w + 0.9)); putStake(Q.SKB, a[0], a[1], gy(a[0], a[1], yr) - 0.05, hd + (down ? 0.6 : 0), down ? -sd * 1.45 : 0); }
        for (const o of [-2.3, 2.3]) { const a = atS2(T, L.s + o, sd * (w + 2.35)); putStake(Q.SK, a[0], a[1], gy(a[0], a[1], yr) - 0.05, hd + o * 0.1, down ? -sd * 1.3 : 0); }
        if (!down) {   // the stack: three logs, two on them, one on top, along the road
          const lay = [[-0.5, 0], [0, 0], [0.5, 0], [-0.25, 1], [0.25, 1], [0, 2]], r = 0.24;
          for (let k = 0; k < 6; k++) { const a = atS2(T, L.s + (k % 2 ? 0.2 : -0.2), sd * (w + 3.0 + lay[k][0])); putLog(a[0], a[1], gy(a[0], a[1], yr) + r + lay[k][1] * r * 1.74, hd, 0, 5.4 + (k % 3) * 0.4, r); }
        } else for (const g of L.logs) { const on = Math.abs(g.d) <= w + 0.2, y = on ? T.hy[T.idx(g.s)] : gy(g.x, g.z, yr); putLog(g.x, g.z, y + g.r, hd + g.a, g.rl, g.len, g.r); }
      }
      Q.LG.count = nl; Q.SK.count = nk; Q.SKB.count = nb; for (const im of [Q.LG, Q.SK, Q.SKB]) if (im.count) im.instanceMatrix.needsUpdate = true;
      // the helicopter: where the Core flies it, leaning into its acceleration, the rotors turning, a red beacon and a white strobe; at dusk and
      // at night the searchlight on the player's car (a cone of light and the pool it makes on the ground)
      const H = R.pol.heli, HM = Q.heli;
      if (HM) {
        HM.heli.visible = !!H; HM.cone.visible = HM.pool.visible = false;
        if (H) {
          const ch = Math.cos(H.h), sh = Math.sin(H.h), af = H.ax * ch + H.az * sh, ar = -H.ax * sh + H.az * ch, k = Math.min(1, dt * 3);
          HM.pit += (clamp(-af * 0.028, -0.3, 0.3) - HM.pit) * k; HM.rol += (clamp(ar * 0.034, -0.35, 0.35) - HM.rol) * k;
          HM.heli.position.set(H.x, H.y, H.z); HM.heli.rotation.set(HM.rol, -H.h, HM.pit); HM.rotor.rotation.y += dt * 44; HM.tail.rotation.z += dt * 75;
          HM.heli.updateMatrixWorld(true);
          if (time % 1.1 < 0.12) { _rv.set(-8.2, 3.35, 0).applyMatrix4(HM.heli.matrixWorld); glows.add(_rv.x, _rv.y, _rv.z, 2.4, 1, 0.12, 0.08, 1); }
          if ((time + 0.5) % 0.9 < 0.07) { _rv.set(0.2, 0.3, 0).applyMatrix4(HM.heli.matrixWorld); glows.add(_rv.x, _rv.y, _rv.z, 3.2, 1, 1, 1, 1); }
          if (dusk && H.st === 'track' && Pl) {
            _rv.set(2.6, 0.5, 0).applyMatrix4(HM.heli.matrixWorld);
            const tx = Pl.x + Math.sin(time * 0.9) * 1.2, tz = Pl.z + Math.cos(time * 0.7) * 1.2, ty = gy(tx, tz, Pl.roadY || Pl.y), dx = tx - _rv.x, dy = ty - _rv.y, dz = tz - _rv.z, L = Math.hypot(dx, dy, dz);
            if (L > 5 && L < 160) { const R0 = L * 0.1; _rax.set(dx / L, dy / L, dz / L); HM.cone.quaternion.setFromUnitVectors(_down, _rax); HM.cone.position.copy(_rv); HM.cone.scale.set(R0, L, R0); HM.cone.visible = true;
              HM.pool.position.set(tx, ty + 0.12, tz); HM.pool.scale.set(R0 * 1.15, 1, R0 * 1.15); HM.pool.visible = true; glows.add(_rv.x, _rv.y, _rv.z, 4.5, 1, 0.95, 0.8, 1); }
          }
        }
      }
      const VH = world && world.dyn.vrHide;
      if (VH && R.pol.goal) { rdDoor(VH, R.pol, Pl, dt);   // (the building at the top: its door; at dusk and at night the lamp over it and the light inside)
        if (dusk && VH.grp.visible && Math.hypot(VH.x - cx, VH.z - cz) < 300) { glows.add(VH.lamp[0], VH.lamp[1], VH.lamp[2], 1.3, 1, 0.84, 0.56, 0.95); if (VH.k < 1) glows.add(VH.lit[0], VH.lit[1], VH.lit[2], 3.2, 1, 0.82, 0.5, 0.45); } }
    }
    glows.end();
  }
  // the traffic checkpoint (pol.chk, Q.ck: setupRoad): its officer in the yellow vest with the STOP paddle in his left hand (up while he stops
  // the traffic, else hanging from it; lying on the road by him once he is knocked down), walking round to the driver's window, talking there,
  // running back to his car once the player is off; the driver out of the car (in his own clothes) walking to the patrol car. After the arrest
  // the core is done with them: here they walk on to where they were going. While the checkpoint stands (after the player fled: until it is
  // out of sight, no popping): the cones and the board (knocked over by the player's car: tipped, pushed the way it went, sliding to a
  // stop); the box to park in, painted (pulsing) while the officer sends the driver there and once parked. Returns the people's count
  const _ckq = {};
  function rdCheck(Q, R, T, Pl, np, dt, cx, cz) {
    const C = Q.ck, K = R.pol.chk, done = K.st === 'done', hint = T.idx(K.s);
    if (done && !C.cw) { const c = K.cop, d = K.drv; C.cw = { x: c.x, z: c.z, h: c.h, wp: c.wp, act: c.act, v: 1.4 }; C.dw = d && { x: d.x, z: d.z, h: d.h, wp: d.wp, act: d.act, v: 1.3 }; }
    if (!done) C.cw = C.dw = null;
    else for (const o of [C.cw, C.dw]) if (o && o.wp) { const dx = o.wp[0] - o.x, dz = o.wp[1] - o.z, d = Math.hypot(dx, dz);
      if (d < o.v * dt + 0.05) { o.x = o.wp[0]; o.z = o.wp[1]; o.wp = null; o.act = 'stand'; } else { o.x += dx / d * o.v * dt; o.z += dz / d * o.v * dt; o.h = Math.atan2(dz, dx); o.act = 'walk'; } }
    const cop = C.cw || K.cop, drv = done ? C.dw : K.drv, yAt = (x, z) => { const q = T.query(x, z, hint, _ckq); return rdGroundY(T, q.s, q.d, x, z, T.yAt(q)); }, far = (x, z) => (x - cx) * (x - cx) + (z - cz) * (z - cz) > 150 * 150;
    let nP = 0; Q.n.cop = Q.n.drv = 0;
    if (cop.act !== 'gone' && np < Q.NP && !far(cop.x, cop.z)) {
      const m = rdMan('chk', 0.62, 0), a = cop.act, y = yAt(cop.x, cop.z); m.shirt.setHex(0xd8e43a); m.trou.setHex(0x1c2842); m.hair.setHex(0x1c2842);
      rdPose(m, cop.x, y, cop.z, cop.h, a === 'signal' || a === 'talk' || a === 'down' ? a : 'stand', a === 'walk' ? 1.4 : a === 'run' ? 4.2 : 0, dt, 9, 0, 0);
      const fx = Math.cos(m.yaw), fz = Math.sin(m.yaw);
      if (a === 'down') { _cM.set(-fz, fx, 0, cop.x + fz * 0.75, 0, 0, 1, y + 0.03, fx, fz, 0, cop.z - fx * 0.75, 0, 0, 0, 1); }   // (the paddle on the road beside him, face up)
      else {   // in his hand: tilted from straight up (0) to hanging down (pi) about his right-hand axis; its face the way he looks
        C.pa += ((a === 'signal' ? 0 : Math.PI) - C.pa) * Math.min(1, dt * 7); const c = Math.cos(C.pa), s = Math.sin(C.pa);
        _cv.setFromMatrixPosition(CRM.hdL); _cM.set(fz, fx * s, fx * c, _cv.x, 0, c, -s, _cv.y, -fx, fz * s, fz * c, _cv.z, 0, 0, 0, 1); }
      C.PD.setMatrixAt(0, _cM); nP = 1; rdPut(m, np++, 0); Q.n.cop = 1;
    }
    C.PD.count = nP; if (nP) C.PD.instanceMatrix.needsUpdate = true;
    if (drv && np < Q.NP && !far(drv.x, drv.z)) { const m = rdMan('chkD', 0.83, 0); rdPose(m, drv.x, yAt(drv.x, drv.z), drv.z, drv.h, 'stand', drv.act === 'walk' ? 1.3 : 0, dt, 0, 0, 0); rdPut(m, np++, 0); Q.n.drv = 1; }
    // the cones and the board (once the player has fled: gone as soon as they are out of sight; after the arrest the scene stays as it is)
    if (K.st === 'fled' && C.on && (C.cx - cx) * (C.cx - cx) + (C.cz - cz) * (C.cz - cz) > 200 * 200) C.on = false;
    const on = C.on && !far(C.cx, C.cz);
    let nc = 0;
    const put = (o) => {
      if (!o.tp && Pl) { const ch = Math.cos(Pl.h), sh = Math.sin(Pl.h), dx = o.x - Pl.x, dz = o.z - Pl.z;
        if (Pl.speed > 1 && Math.abs(dx * ch + dz * sh) < Pl.m.len / 2 + 0.2 && Math.abs(-dx * sh + dz * ch) < Pl.m.wid / 2 + 0.2) { o.tp = 0.01; o.vx = Pl.vx * 0.75; o.vz = Pl.vz * 0.75; o.a = Math.atan2(Pl.vz, Pl.vx); } }
      if (o.tp) { o.tp = Math.min(1, o.tp + dt * 5); o.x += o.vx * dt; o.z += o.vz * dt; const v = Math.hypot(o.vx, o.vz), k = v > 0 ? Math.max(0, v - 7 * dt) / v : 0; o.vx *= k; o.vz *= k; }
      _re.set(0, -(o.tp ? o.a : o.h), -o.tp * Math.PI / 2, 'YZX'); _rq.setFromEuler(_re); _rv.set(o.x, yAt(o.x, o.z) - 0.02 + o.tp * 0.12, o.z); _rm.compose(_rv, _rq, _rs);
      if (o === C.board) { C.sign.matrix.copy(_rm); C.sign.matrixWorldNeedsUpdate = true; } else C.CN.setMatrixAt(nc++, _rm);
    };
    if (on) { for (const o of C.cones) put(o); put(C.board); }
    C.CN.count = nc; if (nc) C.CN.instanceMatrix.needsUpdate = true; C.sign.visible = on;
    // the box (fading in; pulsing while the driver is to park in it)
    const want = K.st === 'park' || K.st === 'parked' ? 1 : 0; C.op += (want - C.op) * Math.min(1, dt * 3); if (Math.abs(want - C.op) < 0.01) C.op = want;
    C.box.material.opacity = C.op * (K.st === 'park' ? 0.72 + 0.28 * Math.sin(time * 5) : 0.9); C.box.visible = C.op > 0.01;
    return np;
  }
  // the roller door of the building at the top (world.dyn.vrHide): down once the player is in (pol.escaped), from 0.9 s on, over 2.4 s; it
  // waits while anything is in the doorway (the player's car not quite in, a patrol car)
  function rdDoor(H, pol, Pl, dt) {
    if (!pol.escaped) { if (H.k || H.t) hideDoor(H, 0); H.t = 0; return; }
    H.t = (H.t || 0) + dt; if (H.t < 0.9 || H.k >= 1) return;
    const G = pol.goal, ch = Math.cos(G.h), sh = Math.sin(G.h), x0 = -G.len / 2;
    for (let n = -1; n < pol.cars.length; n++) { const c = n < 0 ? Pl : pol.cars[n]; if (!c) continue;
      const dx = c.x - G.x, dz = c.z - G.z, lx = dx * ch + dz * sh, lz = -dx * sh + dz * ch, a = c.h - G.h, ex = Math.abs(Math.cos(a)) * c.m.len / 2 + Math.abs(Math.sin(a)) * c.m.wid / 2;
      if (lx - ex < x0 + 0.4 && lx + ex > x0 - 0.4 && Math.abs(lz) < G.door / 2 + 1.2) return; }
    hideDoor(H, Math.min(1, H.k + dt / 2.4));
  }
  function hideDoor(H, k) { H.k = k; H.door.scale.y = Math.max(0.02, k); H.door.updateMatrix(); }
  // the ground someone stands on at (x, z), s and d along and across the road, y the road's height there (the Core's): inside the barriers
  // (the asphalt, its sidewalks, the shoulders) the road's own surface, unless the bank is higher; beyond them the terrain (world.groundH
  // under the road lies below its surface: the people would sink into it)
  function rdGroundY(T, s, d, x, z, y) {
    const i = T.idx(s), G = world && world.groundH;
    return Math.abs(d) < (d > 0 ? T.br[i] : T.bl[i]) ? Math.max(y + 0.02, G ? G(x, z) : -1e9) : G ? Math.max(y - 0.5, G(x, z)) : y;
  }
  function atS2(T, s, d) { const f = clamp(s / T.ds, 0, T.N - 1.001), i = Math.floor(f), t = f - i, j = i + 1; return [T.px[i] + (T.px[j] - T.px[i]) * t + (T.nx[i] + (T.nx[j] - T.nx[i]) * t) * d, T.pz[i] + (T.pz[j] - T.pz[i]) * t + (T.nz[i] + (T.nz[j] - T.nz[i]) * t) * d]; }
  function roadInfo() { return road ? { veh: road.n.veh, ped: road.n.ped, pol: road.pol.size, spikes: road.S.count, lampOn: [...road.pol.values()].some(v => v.polLamps && v.polLamps.some(l => l.material === matPolOn)),
    heli: !!road.heli && road.heli.heli.visible, beam: !!road.heli && road.heli.cone.visible, vans: road.V.pvan.count, motos: road.V.pmoto.count, logs: road.LG.count, officers: road.n.off,
    bikes: road.V.bike.count, blood: road.BL.count, dead: road.n.dead, dogs: road.DG.count, leashes: road.LS.count / 2, groups: road.n.grp, cycGroups: road.n.cgrp, yielding: road.n.yld, indicators: road.n.ind,
    chk: road.ck ? { cop: road.n.cop, drv: road.n.drv, paddle: road.ck.PD.count, cones: road.ck.CN.count, board: road.ck.sign.visible, box: road.ck.box.visible ? +road.ck.box.material.opacity.toFixed(2) : 0 } : null,
    door: world && world.dyn.vrHide ? +(world.dyn.vrHide.k || 0).toFixed(2) : null } : null; }   // (tests)

  // the crowd's excitement (World's spectators and grandstands: they cheer, jump and put flags up): the lights going out, an overtake by the
  // player, the finish (held a while), dying away over ~4 s; as the crowd's sound does (Sfx)
  const hype = { v: 0, pos: 0, state: '', fin: false, hold: 0 };
  function hypeStep(dt) {
    const R = curRace, P = R && R.player, U = world && world.dyn.crowd;
    if (!U || !U.uHype) return;
    if (!P) { hype.v = 0; U.uHype.value = 0; return; }
    if (R.state !== hype.state) { if (R.state === 'racing') hype.v = 1; hype.state = R.state; }
    if (R.state === 'racing' && P.pos < hype.pos && !P.finished) hype.v = 1;
    hype.pos = P.pos || 0;
    if (P.finished && !hype.fin) { hype.fin = true; hype.v = 1; hype.hold = 8; } else if (!P.finished) hype.fin = false;
    if (hype.hold > 0) hype.hold -= dt; else hype.v = Math.max(0, hype.v - dt / 4);
    U.uHype.value = hype.v;
  }

  /* ---------------- per-frame ---------------- */
  const tmp = { x: 0, z: 0 }, _sunN = new THREE.Vector3();
  function wheelWorld(c, lx, lz, x, z, h) { const ch = Math.cos(h), sh = Math.sin(h); tmp.x = x + lx * ch - lz * sh; tmp.z = z + lx * sh + lz * ch; return tmp; }

  function updateCars(dt, alpha, opt) {
    const markerOn = opt && opt.marker, wk = wetW > 0.05 ? Math.min(1, wetW * 1.4) : 0;   // wk: how much the wet road mirrors the lights
    _sunN.set(sunOff[0], sunOff[1], sunOff[2]).normalize();
    const sk = (atmos.tod === 'night' ? 0 : atmos.tod === 'dusk' ? 0.8 : 1) * (1 - Math.min(1, Math.max(0, wet) * 1.6)) * Math.min(1, sun.intensity);   // sk: the sun's glint on the paint
    glows.begin(); streaks.begin();
    for (const v of views) {
      const c = v.car, M = c.m;
      const x = lerp(c.px, c.x, alpha), z = lerp(c.pz, c.z, alpha), h = c.ph + wrapPi(c.h - c.ph) * alpha;
      const y = lerp(c.py, c.y, alpha), jk = crew && c === crew.P;   // jk: the player's car, maybe up on the jacks in its pit box
      v.grp.position.set(x, y + (jk ? crew.lift : 0), z);
      const lat = clamp(c.w * c.speed, -16, 16), sw = M.sway || 1;   // (sway: the truck's soft, tall body rolls and pitches more)
      v.roll += (clamp(-lat * 0.0042 * sw, -0.06 * sw, 0.06 * sw) - v.roll) * Math.min(1, dt * 7);
      v.pitch += (clamp(c.axF * 0.0035 * sw, -0.045 * sw, 0.04 * sw) - v.pitch) * Math.min(1, dt * 7);
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
      if (c.isPlayer && c.speed > 8 && !c.air && c.ws && (c.ws[0] === 1 || c.ws[1] === 1 || c.ws[2] === 1 || c.ws[3] === 1)) shake(0.1 + clamp(c.speed / 60, 0, 1) * 0.14);   // (the kerbs' ridges: the view trembles while a wheel runs on them)
      v.spin += c.vl * dt / M.rw;
      for (const w of v.wf) { w.rotation.set(0, -c.delta, -v.spin); }
      for (const w of v.wr) { w.rotation.set(0, 0, -v.spin); }
      if ((v.noHead || (v.fp && v.fp.lm)) && c.ty) { const tk = c.ty.k + (c.ty.c || ''); if (v.tyreK !== tk) {   // new tyres after a pit stop: their band on the sidewalls
        const col = tyreCol(c), lm = !v.noHead, [W, H] = lm ? [lmWheelGeo, LM_HUB] : [fWheelGeo, F_HUB]; v.tyreK = tk;   // (the formula's wheels, the prototype's)
        for (const w of v.wf) w.geometry = W(H.fr, H.fw, col); for (const w of v.wr) w.geometry = W(H.rr, H.rw, col); } }
      const braking = (c.inBrk > 0.08 && c.vl > 0.5 && c.gear !== -1) || c.gear === -1 || c.inHand > 0.5;
      const rainL = v.noHead && (wet > 0 || (braking && time % 0.25 < 0.125));   // the formula's rain light: on in the rain, blinking while it brakes (harvesting)
      v.tail.material = (v.noHead ? rainL : braking) ? matTailOn : matTailOff;
      if (v.glb) v.glb.tail.emissive.setHex(braking ? 0xff1a0a : 0x3a0000);
      if (v.drsFlap) { v.drsK = (v.drsK || 0) + ((c.drs ? 1 : 0) - (v.drsK || 0)) * Math.min(1, dt * 12); v.drsFlap.rotation.z = 0.5 * v.drsK; }   // the rear wing's flap opens with DRS
      // light glows: soft warm headlights, red tail lights that flare when braking; at dusk and at night a bright lamp in a wide, faint halo
      v.grp.updateMatrixWorld(true);
      const nt = todK, rl = (1 + Math.max(0, wet) * 0.9) * (1 + 0.5 * nt);   // (rain, dusk, night: the lights stand out more in the gloom)
      const gy = (c.roadY != null ? c.roadY : y) + 0.03;   // (the road under the car: the lamps' reflections on it when it is wet)
      for (let k = 0; k < 4 && c !== ck.car; k++) {   // (not the lamps of the car the cockpit camera sits in)
        if (v.lightBroken && v.lightBroken[k]) continue;   // smashed lamp: no glow
        _lv.copy(v.lights[k]).applyMatrix4(v.grp.matrixWorld);
        if (v.noHead) { if (k === 2 && rainL) { glows.add(_lv.x, _lv.y, _lv.z, 1.5, 1.0, 0.15, 0.08, 0.9); if (wk) streaks.add(_lv.x, gy, _lv.z, 1.0, 0.16, 0.08, 0.6 * wk, 0.5, 5.5, c.id * 0.37 + k); } }
        else if (k < 2) { glows.add(_lv.x, _lv.y, _lv.z, 0.95, 1.0, 0.88, 0.62, 0.17 * rl);
          if (nt) { glows.add(_lv.x, _lv.y, _lv.z, 0.42, 1.0, 0.97, 0.9, 0.85 * nt); glows.add(_lv.x, _lv.y, _lv.z, 2.8, 1.0, 0.86, 0.66, 0.085 * nt * rl); }
          if (wk) streaks.add(_lv.x, gy, _lv.z, 1.0, 0.9, 0.72, 0.3 * wk * (0.35 + 0.65 * nt), 0.6, 5, c.id * 0.37 + k); }
        else { glows.add(_lv.x, _lv.y, _lv.z, braking ? 1.8 : 0.95, 1.0, 0.15, 0.08, braking ? 0.95 : 0.3 * rl);
          if (nt) glows.add(_lv.x, _lv.y, _lv.z, braking ? 3.4 : 2.1, 1.0, 0.12, 0.06, (braking ? 0.24 : 0.1) * nt * rl);
          if (wk) streaks.add(_lv.x, gy, _lv.z, 1.0, 0.16, 0.08, (braking ? 0.75 : 0.36) * wk * (0.5 + 0.5 * nt), 0.55, braking ? 6.5 : 5, c.id * 0.37 + k); }
      }
      if (wk && c !== ck.car) { const pc = v.pc || (v.pc = colArr(c.color || 0x888888)); streaks.add(x, gy, z, pc[0], pc[1], pc[2], 0.2 * wk * (1 - 0.7 * nt), M.wid * 1.05, M.len * 1.1, c.id * 0.61); }   // (the car itself, a blur of its paint in the water)
      const e = v.grp.matrixWorld.elements;   // (the car's forward, up and right)
      if (sk > 0 && c !== ck.car) {   // the sun's glint on the paint: a soft glare where the curved roof mirrors the sun into the camera (the paint's own highlight is small and sharp)
        const ry = (BODIES[M.body] || BODIES.coupe).roofY * (v.noHead ? 0.9 : 0.97), cp = camera.position;
        let vx = cp.x - x, vy = cp.y - y - ry, vz = cp.z - z; const vl = Math.hypot(vx, vy, vz) || 1; vx = vx / vl + _sunN.x; vy = vy / vl + _sunN.y; vz = vz / vl + _sunN.z;
        const hl = Math.hypot(vx, vy, vz) || 1, d = (vx * e[4] + vy * e[5] + vz * e[6]) / hl, ox = (vx / hl - e[4] * d) * 2.6, oz = (vz / hl - e[6] * d) * 2.6;   // (half-way vector; where on a roof curved ~2.6 m its normal is that)
        const al = ox * e[0] + oz * e[2], ac = ox * e[8] + oz * e[10], k = 1 - (al / (M.len * 0.36)) ** 2 - (ac / (M.wid * 0.3)) ** 2;
        if (k > 0 && d > 0) glows.add(x + e[0] * al + e[8] * ac, y + ry - 0.08 * (1 - k), z + e[2] * al + e[10] * ac, 1.1 + 0.9 * k, sun.color.r, sun.color.g, sun.color.b, 0.5 * k * k * sk);
      }
      if (v.blob) {   // without shadow maps: a shadow of the car's shape, cast a little away from the sun (with them: the soft contact shadow only)
        const off = !settings.shadows; if (v.blobOff !== off) { v.blobOff = off; v.blob.material = off ? matBlobS : matBlob; }
        let bx = 0, bz = 0; if (off && atmos.tod !== 'night') { const f = 0.55 / Math.max(0.25, _sunN.y), sx = -_sunN.x * f, sz = -_sunN.z * f, l = Math.hypot(sx, sz), q = l > 1.3 ? 1.3 / l : 1; bx = (sx * e[0] + sz * e[2]) * q; bz = (sx * e[8] + sz * e[10]) * q; }
        v.blob.position.x = bx; v.blob.position.z = bz;
      }
      // dirt builds up while driving on grass/gravel/makadam, faster in the rain (mud; never washes off during a race)
      if (v.scrU) v.scrU.value = Core.sstep(0.3, 0.9, c.dmg || 0);
      if (v.dirtU && !(opt && opt.noFx) && !c.air && dt > 0) {
        let loose = 0; for (let k = 0; k < 4; k++) { const sf = c.ws[k]; if (sf === 2 || sf === 3 || sf === 5 || sf === 6) loose++; }   // (the cobbles, 7 and 8, are no dirt)
        if (loose) v.dirtU.value = Math.min(1, v.dirtU.value + dt * loose * (1 + 1.5 * Math.max(0, wetW)) * 0.012 * clamp(c.speed / 12, 0.2, 1.5));   // (rain: mud, two and a half times as fast)
      }
      if (v.pk) pkCarTick(v, c, dt, opt);
      carFx(v, c, dt, !(opt && opt.noFx) && dt > 0);
      if (v.marker) { v.marker.visible = !!markerOn; v.marker.position.y = 4 + Math.sin(time * 5) * 0.3; v.marker.rotation.y = time * 2; }
      // --- effects ---
      if (!opt || !opt.noFx) emitFx(v, c, dt, x, z, h);
      v.wasAir = !!c.air;
      if (c.dents && c.dents.length) { for (const d of c.dents) applyDent(v, d); c.dents.length = 0; }
      if (v.parts) updateParts(v, c, x, y, z, h);
      if (c.dmg > 0.45 && (!opt || !opt.noFx) && !dbg.noSmoke) {   // damaged engine smokes: grey, turning black when badly hurt
        v.smokeAcc += (c.dmg - 0.4) * (10 + 16 * (c.inThr || 0)) * dt;
        const dark = Core.sstep(0.5, 0.95, c.dmg), gc = 0.84 - 0.4 * dark, ek = v.noHead || BODIES[M.body].engRear ? -0.36 : 0.32, fx = Math.cos(h) * M.len * ek, fz = Math.sin(h) * M.len * ek;   // (the formula's and the prototype's engine is behind the driver)
        while (v.smokeAcc >= 1) {
          v.smokeAcc -= 1;
          particles.emit(x + fx + (Math.random() - 0.5) * 0.5, y + 0.95, z + fz + (Math.random() - 0.5) * 0.5, c.vx * 0.35 + (Math.random() - 0.5) * 0.6, 0.9 + Math.random() * 0.6, c.vz * 0.35 + (Math.random() - 0.5) * 0.6, 1.7 + Math.random() * 0.9, 0.7, 3.8 + Math.random() * 1.6, gc, gc, gc * 1.02, 0.52 + dark * 0.2, -0.3, 0.9, y);
        }
      }
    }
    glows.end();
    if (wk && flood && flood.fp) {   // (at night the floodlights too: those round the view)
      const F = flood.fp, cx = cam.vcx || 0, cz = cam.vcz || 0;
      for (let k = 0; k < F.length; k += 3) { const dx = F[k] - cx, dz = F[k + 2] - cz; if (dx * dx + dz * dz < 160 * 160) streaks.add(F[k], F[k + 1], F[k + 2], 1.0, 0.8, 0.52, 0.38 * wk, 1.8, 12, k * 0.13); }
    }
    streaks.end(); if (streaks.n) { const U = streaks.mat.uniforms; U.uT.value = time % 1000; U.uFog.value.set(scene.fog.near, scene.fog.far); }
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
    const parts = {}, under = {};
    if (v.fp) (v.fp.lm ? lmParts : fParts)(v, parts, under);   // the formula, the prototype: their own parts (built with the mesh)
    else {
      const paint = cgMat(new THREE.MeshPhongMaterial({ color: c.color, shininess: 80, specular: 0x505050, envMap: envTex, combine: THREE.MixOperation, reflectivity: 0.2 }), false, 'carCg');
      const trim = M.chrome ? cgMat(new THREE.MeshPhongMaterial({ color: 0xc4c8ce, shininess: 110, specular: 0xffffff, envMap: envTex, combine: THREE.MixOperation, reflectivity: 0.55 }), true, 'carCg')   // (the V8's chrome bumpers: the glass's sharper glint)
        : new THREE.MeshLambertMaterial({ color: 0x2b2e34 });
      v.partMats = [paint, trim];
      const add = (name, geo, mat, x, y, z, rz, uGeo, uMat, extra) => {
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
    }
    v.parts = parts; v.under = under;
    v.glassTris = findGlass(v); v.winBroken = [0, 0, 0, 0]; v.roofStep = 0;
    if (v.glb) {   // real model: no stock panels to knock off, no stock glass to crack
      for (const k in parts) parts[k].visible = false;
      v.glassTris = [[], [], [], []];
    }
    // head lamp lenses (they go dark when smashed); tail lamps get a dark cover when smashed
    v.lens = []; v.lightBroken = [0, 0, 0, 0];
    const lz = dB.lens || [0.11, 0.28];   // (the new bodies: their own lens, or a round one)
    for (let k = 0; k < 2; k++) { const L = v.lights[k], m = new THREE.Mesh(dB.lensR ? new THREE.CylinderGeometry(dB.lensR, dB.lensR, 0.02, 12).rotateZ(Math.PI / 2) : new THREE.BoxGeometry(0.045, lz[0], lz[1]), matLens); m.position.set(L.x - 0.02, L.y, L.z); m.visible = !v.glb && !v.noHead && !dB.noLens; v.bodyG.add(m); v.lens.push(m); }
  }
  // the formula's parts, built with the car's mesh (the garage and the ghost show them too): front wing (bumperF), nose (hood), rear wing with the
  // DRS flap (bumperR), engine cover (trunk), mirrors, bargeboards (fenderL/R). Each is centred on its own origin (a loose one tumbles about
  // its middle; its geometry's .parameters say how it lies on the track)
  function fPartMeshes(car, bodyG) {
    const P = colArr(car.color), S = stripeFor(car.color), parts = {};
    const paint = cgMat(new THREE.MeshPhongMaterial({ color: car.color, shininess: 80, specular: 0x505050, envMap: envTex, combine: THREE.MixOperation, reflectivity: 0.2 }), false, 'carCg');
    const add = (name, geo, mat, x, y, z, noShadow) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = !noShadow; bodyG.add(m); parts[name] = m; return m; };
    add('bumperF', fWingFGeo(P, S), matCar, 2.44, 0.1, 0);
    add('hood', fNoseGeo(P, S), matCar, 2.17, 0.35, 0);
    const rw = add('bumperR', fWingRGeo(P), matCar, -2.36, 0.9, 0), flap = new THREE.Group(), fm = new THREE.Mesh(fFlapGeo(S), matCar);
    flap.position.set(-0.235, 0.175, 0); flap.add(fm); rw.add(flap);   // (it opens on the DRS straights: see frame)
    add('trunk', fCoverGeo(P, S), matCar, -1.45, 0.5, 0);
    for (const [name, sd] of [['mirrorL', -1], ['mirrorR', 1]]) {   // the housing on its stalk (one mesh: small parts are cheap draws, and cast no shadow)
      const g = new GB(); World.box(g, 0, -0.0325, 0, 0.09, 0.065, 0.17, 0, P); World.box(g, 0.02, -0.185, -sd * 0.04, 0.025, 0.17, 0.025, 0, FK);
      add(name, fPartGeo(g, 0, 0, 0.09, 0.065, 0.17), matCar, 0.34, 0.74, sd * 0.56, true);
    }
    for (const [name, sd] of [['fenderL', -1], ['fenderR', 1]]) add(name, new THREE.BoxGeometry(0.42, 0.22, 0.02), paint, 0.86, 0.3, sd * 0.63, true);
    return { parts, flap };
  }
  // a race car's formula parts become its detachable parts; under the nose the front bulkhead, under the engine cover the power unit
  function fParts(v, parts, under) {
    Object.assign(parts, v.fp.parts); v.drsFlap = v.fp.flap;
    for (const [name, geo, mat] of [['hood', new THREE.BoxGeometry(0.06, 0.3, 0.34).translate(-0.42, 0.03, 0), matUnder], ['trunk', fEngineGeo(), matCar]]) {
      const m = parts[name], u = new THREE.Group(); u.add(new THREE.Mesh(geo, mat)); u.position.set(m.position.x, m.position.y - 0.012, m.position.z); u.visible = false; v.bodyG.add(u); under[name] = u;
    }
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
        let loose = 0; for (let k = 0; k < 4; k++) { const sf = c.ws[k]; if (sf >= 2 && sf !== 4 && sf < 7) loose++; }
        const dirt = loose >= 2, n = Math.min(26, 8 + hard * 2.2), wetL = wetW > 0;   // (in the rain: a splash of muddy water)
        for (let k = 0; k < n; k++) {
          const a = k / n * Math.PI * 2 + Math.random() * 0.4, sp = (2.5 + Math.random() * 3) * Math.min(1.6, hard / 6);
          const cr = wetL ? 0.66 : dirt ? 0.8 : 0.78, cg = wetL ? 0.67 : dirt ? 0.66 : 0.77, cb = wetL ? 0.68 : dirt ? 0.46 : 0.75;
          particles.emit(x + Math.cos(a) * 1.3, gy + 0.3, z + Math.sin(a) * 1.3, Math.cos(a) * sp + c.vx * 0.3, 0.6 + Math.random() * 0.8, Math.sin(a) * sp + c.vz * 0.3, 1.0 + Math.random() * 0.7, 1.1, 5 + Math.random() * 2.5, cr, cg, cb, 0.5, -0.08, 2.2, gy);
        }
        if (dirt) for (let k = 0; k < 8; k++) { const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 3; particles.emit(x, gy + 0.3, z, Math.cos(a) * sp + c.vx * 0.4, 3 + Math.random() * 2.5, Math.sin(a) * sp + c.vz * 0.4, 0.8 + Math.random() * 0.4, 0.3, 0.26, 0.34, 0.27, 0.2, 0.95, 14, 0.4, gy); }
      }
    }
    const slide = Math.max(0, c.latR - 1.0) / 3.5 + c.spin * 0.9 + (c.lock ? 0.55 : 0) + (c.inHand > 0.5 && spd > 5 ? 0.45 : 0);
    const rainy = wetW > 0.1, near = !rainy || Math.hypot(x - (cam.vcx || 0), z - (cam.vcz || 0)) < 140;   // (rain: spray only where it can be seen, the particles are shared)
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
      const onHard = surf <= 1 || (rainy && surf === 4) || surf >= 7;   // (rain: the paving sprays like the asphalt; the cobbles are a road)
      const skidOn = intens > 0.14 && spd > 2.5 && !(rainy && onHard);   // (no rubber laid on a wet road)
      if (skidOn) {
        const last = v.sk[k];
        if (last) {
          const d = Math.hypot(px - last[0], pz - last[1]);
          if (d > 0.45 && d < 4) {
            const a = clamp(0.4 + intens * 0.4, 0.4, 0.86);
            if (onHard) skids.add(last[0], last[1], px, pz, 0.2, 0.035, 0.035, 0.04, a * 0.92, a, last[2], yb);
            else if (surf === 6 || (rainy && surf === 5)) skids.add(last[0], last[1], px, pz, 0.22, 0.17, 0.14, 0.1, a * 0.9, a, last[2], yb);   // (wet gravel, a puddle: dark, muddy)
            else if (surf === 3 || surf === 5) skids.add(last[0], last[1], px, pz, 0.22, 0.42, 0.27, 0.14, a * 0.85, a * 0.95, last[2], yb);
            else skids.add(last[0], last[1], px, pz, 0.22, 0.14, 0.2, 0.07, a * 0.75, a * 0.85, last[2], yb);
            v.sk[k] = [px, pz, yb];
          } else if (d >= 4) v.sk[k] = [px, pz, yb];
        } else v.sk[k] = [px, pz, yb];
      } else v.sk[k] = null;
      // smoke / dust (rain: spray, mud)
      if (front) continue;
      if (rainy && onHard) {   // a wet road: a mist of spray off the rear tyres at speed, thicker in a slide (no tyre smoke)
        if (spd > 7 && near) {
          const fast = clamp((spd - 18) / 25, 0, 1);   // (at speed: a long, thicker tail of mist hanging behind the car, and the tyres throw water up)
          v.acc[k] += (clamp(spd / 36, 0, 1.4) + intens * 0.7) * 26 * (1 + 0.7 * fast) * wetW * dt;
          while (v.acc[k] >= 1) {
            v.acc[k] -= 1;
            const sh = 0.9 + Math.random() * 0.1, sp = 0.35 + Math.random() * 0.15;
            particles.emit(px, 0.3 + yb, pz, c.vx * sp + (Math.random() - 0.5) * 2.4, 0.6 + Math.random() * 1.0, c.vz * sp + (Math.random() - 0.5) * 2.4, (0.55 + Math.random() * 0.4) * (1 + 0.8 * fast), 0.8, (3.4 + Math.random() * 2.0) * (1 + 0.45 * fast), 0.9 * sh, 0.93 * sh, 0.96 * sh, 0.22 + 0.04 * fast, -0.12, 1.7, yb);
            if (fast > 0.2 && Math.random() < 0.25) particles.emit(px, 0.25 + yb, pz, c.vx * 0.55 + (Math.random() - 0.5) * 1.2, 1.6 + Math.random() * 1.6, c.vz * 0.55 + (Math.random() - 0.5) * 1.2, 0.35 + Math.random() * 0.2, 0.3, 1.1, 0.86, 0.9, 0.95, 0.3, 6, 2.2, yb);   // (the tyre's plume)
          }
        } else v.acc[k] = 0;
      } else if (surf === 6 && spd > 4) {   // into a puddle (in the rain): a burst of muddy water and clods
        v.acc[k] += (clamp(spd / 20, 0.2, 1.5) * 3.2 + intens * 0.4) * 24 * dt;
        while (v.acc[k] >= 1) {
          v.acc[k] -= 1;
          const vxs = c.vx * 0.3 + (Math.random() - 0.5) * 3.5, vzs = c.vz * 0.3 + (Math.random() - 0.5) * 3.5, sh = 0.9 + Math.random() * 0.12;
          particles.emit(px, 0.25 + yb, pz, vxs, 1.8 + Math.random() * 2.6, vzs, 0.45 + Math.random() * 0.35, 0.5, 2.6 + Math.random(), 0.8 * sh, 0.83 * sh, 0.86 * sh, 0.5, 7, 1.4, yb);
          if (Math.random() < 0.22) particles.emit(px, 0.2 + yb, pz, -c.vx * 0.05 + (Math.random() - 0.5) * 2, 1.5 + Math.random() * 2, -c.vz * 0.05 + (Math.random() - 0.5) * 2, 0.5, 0.2, 0.14, 0.2, 0.16, 0.11, 1, 12, 0.4, yb);   // clods of mud
        }
      } else if (rainy && spd > 4) {   // wet grass / gravel: clods and splashes of mud, no dust cloud
        v.acc[k] += (0.5 * clamp(spd / 20, 0.2, 1.4) + intens * 0.5) * 22 * dt;
        while (v.acc[k] >= 1) {
          v.acc[k] -= 1;
          const vxs = c.vx * 0.25 + (Math.random() - 0.5) * 2.4, vzs = c.vz * 0.25 + (Math.random() - 0.5) * 2.4, sh = 0.8 + Math.random() * 0.3;
          particles.emit(px, 0.3 + yb, pz, vxs, 1.2 + Math.random() * 1.6, vzs, 0.5 + Math.random() * 0.3, 0.35, 0.6, 0.34 * sh, 0.29 * sh, 0.2 * sh, 0.8, 9, 0.6, yb);
          if (Math.random() < 0.4) particles.emit(px, 0.3 + yb, pz, vxs * 0.6, 0.5 + Math.random() * 0.5, vzs * 0.6, 0.5 + Math.random() * 0.3, 0.8, 2.4, 0.62, 0.62, 0.58, 0.2, -0.05, 1.8, yb);
        }
      } else if (onHard && intens > 0.22 && spd > 3) {
        v.acc[k] += Math.min(1.3, intens) * 42 * dt * (c.latR < 1.5 && spd < 18 ? 0.4 : 1);   // (wheelspin getting away, the car straight: a light haze, not the drift's cloud)
        while (v.acc[k] >= 1) {
          v.acc[k] -= 1;
          const vxs = c.vx * 0.12 + (Math.random() - 0.5) * 1.6, vzs = c.vz * 0.12 + (Math.random() - 0.5) * 1.6;
          const g = 0.88 + Math.random() * 0.1;
          particles.emit(px, 0.35 + yb, pz, vxs, 0.5 + Math.random() * 0.6, vzs, 1.6 + Math.random() * 1.0, 0.9, 4.4 + Math.random() * 1.8, g, g, g + 0.02, 0.4, -0.05, 1.2, yb);
        }
      } else if (!onHard && spd > 4) {
        const amt = (surf === 3 || surf === 5 ? 1.0 : 0.45) * clamp(spd / 20, 0.2, 1.4) + intens * 0.5, D = dust || DUST0;
        v.acc[k] += amt * 26 * dt * (surf === 3 || surf === 5 ? D.rate : 1);
        while (v.acc[k] >= 1) {
          v.acc[k] -= 1;
          const vxs = c.vx * 0.25 + (Math.random() - 0.5) * 2.4, vzs = c.vz * 0.25 + (Math.random() - 0.5) * 2.4;
          if (surf === 3 || surf === 5) {
            // big, lingering dust cloud on dirt/gravel (the classic rally rooster tail)
            const sh = 0.92 + Math.random() * 0.12, dc = atmos.season === 'winter' ? SNOW_DUST : world && world.dust;   // (a track may raise its own cloud, def.dust: Ouninpohja's; a world may give its own dust colour: Pikes Peak's pale granite; winter: powder snow)
            if (dust && atmos.season === 'winter') particles.emit(px, 0.35 + yb, pz, vxs, (0.7 + Math.random() * 0.9) * D.rise, vzs, (1.5 + Math.random() * 0.9) * D.life, 1.1 * D.s0, (5.2 + Math.random() * 2.6) * D.size, dc[0] * sh, dc[1] * sh, dc[2] * sh, 0.5 * D.alpha, -0.04, 1.3 * D.drag, yb);
            else if (dust) particles.emit(px, 0.35 + yb, pz, vxs, (0.7 + Math.random() * 0.9) * D.rise, vzs, (1.5 + Math.random() * 0.9) * D.life, 1.1 * D.s0, (5.2 + Math.random() * 2.6) * D.size, D.col[0] * sh, D.col[1] * sh, D.col[2] * sh, 0.42 * D.alpha, -0.04, 1.3 * D.drag, yb);
            else if (dc) particles.emit(px, 0.35 + yb, pz, vxs, 0.8 + Math.random() * 1.1, vzs, 1.8 + Math.random() * 1.0, 1.2, 6 + Math.random() * 3, dc[0] * sh, dc[1] * sh, dc[2] * sh, 0.55, -0.05, 1.2, yb);
            else particles.emit(px, 0.35 + yb, pz, vxs, 0.7 + Math.random() * 0.9, vzs, 1.5 + Math.random() * 0.9, 1.1, 5.2 + Math.random() * 2.6, 0.84 * sh, 0.69 * sh, 0.48 * sh, 0.42, -0.04, 1.3, yb);
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
    if (cam.shot && cam.shot.gy != null) cam.gy = cam.shot.gy; else cam.gy += ((c.roadY || 0) - cam.gy) * (1 - Math.exp(-dt * 5));   // (a shot may say how high its view is: Pikes Peak's flyover, for the altitude's light and the sun's shadow box)
    const baseY = cam.gy;
    const k1 = 1 - Math.exp(-dt * 2.0), k2 = 1 - Math.exp(-dt * 1.4);
    let px, py, pz, tx, ty, tz;
    const shot = cam.shot;
    let qc = null, near = 4;   // qc: the camera's own turn (the cockpit), else it looks at (tx, ty, tz); near: its near plane
    if (shot) {   // a TV shot the world directs (setShot: the Red Bull Ring's fly-over before the start, the podium; the photo mode): a camera of its own
      px = shot.px; py = shot.py; pz = shot.pz; tx = shot.tx; ty = shot.ty; tz = shot.tz; near = shot.near || 4;
      if (camera.fov !== shot.fov) { camera.fov = shot.fov; camera.updateProjectionMatrix(); updatePointScale(); }
      if (shot.floor && world) { const gH = world.groundH ? world.groundH(px, pz) : NaN, gf = Math.max(Number.isFinite(gH) ? gH : -1e9, c.roadY != null ? c.roadY - 3 : -1e9) + 0.35; if (py < gf) py = gf; }   // (the photo mode: never under the ground)
    } else if (mode === 'cockpit' && viewOf(c)) {
      // the driver's eyes (eyeOf) in the car as drawn (its slope and bank; the body's roll only in the cockpit round them), the head a
      // little down, looking into the corner and along a slide, swaying with the corner's pull
      const v = viewOf(c), E = eyeOf(c.m), kL = 1 - Math.exp(-dt * 4), kS = 1 - Math.exp(-dt * 6);
      ck.look += (clamp((c.w || 0) * 0.12, -0.2, 0.2) + clamp(c.beta || 0, -1, 1) * 0.3 - ck.look) * kL;
      ck.sway += (clamp(-(c.w || 0) * spd * 0.0025, -0.04, 0.04) - ck.sway) * kS;
      _ckE.set(E.x, E.y, ck.sway).applyMatrix4(v.grp.matrixWorld); px = _ckE.x; py = _ckE.y; pz = _ckE.z;
      qc = _ckQ.setFromRotationMatrix(v.grp.matrixWorld).multiply(_ckQ2.setFromEuler(_ckEu.set(-E.tilt, -Math.PI / 2 - ck.look, 0, 'YXZ')));
      _ckF.set(0, 0, -1).applyQuaternion(qc); tx = px + _ckF.x * 70; ty = py + _ckF.y * 70; tz = pz + _ckF.z * 70;   // (70 m ahead: the fog, the sun's shadows, the rain round there)
      near = E.near; ck.car = c;
      { const fv = 58 + 7 * clamp(((c.speed || 0) - 25) / 45, 0, 1);   // (at speed the view widens a little: the world rushes past at the edges)
        if (Math.abs(camera.fov - fv) > 0.05) { camera.fov = fv; camera.updateProjectionMatrix(); updatePointScale(); } }
    } else if (mode === 'chase') {
      // in a drift, look along the direction of travel, with a lazy swing (Circuit Superstars: the view reads the drift along the
      // travel, so a sliding car shows its angle)
      const hv = h + clamp(c.beta || 0, -1.2, 1.2) * 0.85;
      cam.hs += wrapPi(hv - cam.hs) * (1 - Math.exp(-dt * 2.8));
      cam.zoom += (pitZ * (1 + 0.25 * clamp(spd / 55, 0, 1)) - cam.zoom) * k2;
      // phone held upright: higher camera, wider lens, long view ahead, car in the lower part of the screen
      const portrait = camera.aspect < 1;
      const D = (portrait ? 46 : 30) * cam.zoom * cam.userZoom, pitch = portrait ? 0.98 : 0.9;
      const ahead = (portrait ? 13 : 8.5) * (1 - 0.8 * clamp((1 - cam.zoom) / 0.38, 0, 1)), fov = portrait ? 58 : 46;   // (in the pit box, zoomed in: look at the car and its crew)
      const fx = Math.cos(cam.hs), fz = Math.sin(cam.hs);
      tx = x + fx * ahead; tz = z + fz * ahead; ty = baseY;
      px = tx - fx * D * Math.cos(pitch); pz = tz - fz * D * Math.cos(pitch); py = baseY + D * Math.sin(pitch);
      if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); updatePointScale(); }
    } else if (mode === 'tv' && curTrack.def.theme === 'pikes' && world && world.groundH && curTrack.hy) {
      // Pikes Peak's own TV cameras (pkTv): the helicopter over the open road, fixed cameras at the famous places, the summit's view
      const o = pkTv(c, dt, x, z); px = o.px; py = o.py; pz = o.pz; tx = x; ty = (c.y || 0) + 0.7; tz = z;
      if (cam.tvK !== o.key) { cam.tvK = o.key; cam.tx = tx; cam.tz = tz; }
      cam.tx += (tx - cam.tx) * (1 - Math.exp(-dt * 9)); cam.tz += (tz - cam.tz) * (1 - Math.exp(-dt * 9)); tx = cam.tx; tz = cam.tz;
      const d = Math.hypot(px - tx, py - ty, pz - tz), fov = Core.clamp(2 * Math.atan(o.half / Math.max(1, d)) * 180 / Math.PI, 3, 55);
      if (Math.abs(camera.fov - fov) > 0.05) { camera.fov = fov; camera.updateProjectionMatrix(); updatePointScale(); }
      cam.gy = (c.y || 0);
    } else if (mode === 'tv') {
      // the replay's TV cameras: on posts every 170 m beside the track (on the outside of the bends), 9 m up; the one ahead of the car
      // until it has gone 60 m past it, then a cut to the next; zoomed so the car fills about the same part of the picture
      const C = tvCams(curTrack), s = c.q && Number.isFinite(c.q.s) ? c.q.s : 0, L = curTrack.len, n = C.length;
      let k = Math.floor(s / 170) % n; if (curTrack.open) k = Core.clamp(k, 0, n - 1);
      const P = tvPost(curTrack, k); px = P.x; py = P.y; pz = P.z; tx = x; ty = (c.y || 0) + 0.7; tz = z;
      if (cam.tvK !== k) { cam.tvK = k; cam.tx = tx; cam.tz = tz; }
      cam.tx += (tx - cam.tx) * (1 - Math.exp(-dt * 9)); cam.tz += (tz - cam.tz) * (1 - Math.exp(-dt * 9)); tx = cam.tx; tz = cam.tz;   // (a camera operator's smooth pan)
      const d = Math.hypot(px - tx, py - ty, pz - tz), fov = Core.clamp(2 * Math.atan(6.5 / Math.max(1, d)) * 180 / Math.PI, 4, 55);
      if (Math.abs(camera.fov - fov) > 0.05) { camera.fov = fov; camera.updateProjectionMatrix(); updatePointScale(); }
      cam.gy = (c.y || 0);
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
    if (world && world.camFloor && !shot && !qc) { const gf = world.camFloor(px, pz) + 4; if (py < gf) py = gf; }   // mountain worlds: never under the slope behind the car
    if (cam.shake > 0) { const k = qc ? 0.15 : 1; px += (Math.random() - 0.5) * cam.shake * k; py += (Math.random() - 0.5) * cam.shake * k; pz += (Math.random() - 0.5) * cam.shake * k; cam.shake = Math.max(0, cam.shake - dt * 3); }   // (in the cockpit: a jolt, not a leap)
    if (camera.near !== near) { camera.near = near; camera.updateProjectionMatrix(); }
    camera.position.set(px, py, pz); if (qc) camera.quaternion.copy(qc); else camera.lookAt(tx, ty, tz); cam.vcx = qc ? px + (tx - px) * 0.25 : tx; cam.vcz = qc ? pz + (tz - pz) * 0.25 : tz; cam.vd = Math.hypot(px - tx, py - ty, pz - tz);   // (the cockpit's view centre, for the rain round it: 18 m ahead)
    cam.ck = !!qc; if (!qc) ck.car = null;
    { const dC = shot ? shot.fogD : Math.hypot(px - tx, py - ty, pz - tz), r = Math.max(0, wet); scene.fog.near = dC * (1.35 - 0.4 * r); scene.fog.far = dC * (5.5 - 1.6 * r); }   // (rain: a closer haze)
    if (world && world.farClip) { const f = Math.min(700, scene.fog.far + 40); if (Math.abs(camera.far - f) > 6) { camera.far = f; camera.updateProjectionMatrix(); } }   // long corridor worlds: nothing past the fog is drawn
    // sun/shadow follows view center
    lastMode = qc ? 'cockpit' : mode;
    const sx = qc ? px + (tx - px) * 0.65 : mode === 'kino' ? tx + Math.sin(camYaw) * 8 : tx, sz = qc ? pz + (tz - pz) * 0.65 : mode === 'chase' ? tz : mode === 'kino' ? tz - Math.cos(camYaw) * 8 : tz - 8;   // (the cockpit: the shadows round 45 m ahead)
    const texel = 160 / sun.shadow.mapSize.x;
    const cx = Math.round(sx / texel) * texel, cz = Math.round(sz / texel) * texel;
    sun.target.position.set(cx, baseY, cz);
    const thm = THEMES[themeId], sd = thm && thm.sunDist ? thm.sunDist / Math.hypot(sunOff[0], sunOff[1], sunOff[2]) : 1;   // (theme.sunDist: a low sun placed further up its ray, so the long shadows of casters far up-sun reach the view)
    sun.position.set(cx + sunOff[0] * sd, baseY + sunOff[1] * sd, cz + sunOff[2] * sd);
    sun.target.updateMatrixWorld();
  }
  let sunOff = [-80, 96, 70], camYaw = 0, lastMode = 'iso';
  // TV camera posts (the replay): every 170 m, 40 m past the start of its stretch, on the outside of the bend there (else alternating
  // sides), 14 m beyond the road's edge and 9 m above it (over the fences; higher where the ground beside the road is)
  function tvCams(T) {
    if (T._tv) return T._tv;
    const out = [], n = Math.max(1, Math.floor(T.len / 170));
    for (let k = 0; k < n; k++) {
      const s = k * 170 + 110, i = T.idx(s); let ks = 0; for (let d = -40; d <= 40; d += 8) ks += T.k[T.idx(s + d)] || 0;
      const side = Math.abs(ks) > 0.004 ? (ks > 0 ? -1 : 1) : (k % 2 ? 1 : -1), off = side * ((T.br ? Math.max(T.w, side > 0 ? T.br[i] : (T.bl ? T.bl[i] : T.w)) : T.w) + 14);
      const x = T.px[i] + T.nx[i] * off, z = T.pz[i] + T.nz[i] * off; let y = (T.hasElev && T.hy ? T.hy[i] : 0) + 9;
      if (world && world.groundH) { const g = world.groundH(x, z); if (Number.isFinite(g)) y = Math.max(y, g + 5); }
      out.push({ x, y, z, s, side, i });
    }
    return (T._tv = out);
  }
  // a post has to see the road where the car comes to it from (trees, stands and buildings, a bank in the way): the first time it films, the
  // place above is checked with rays into the world, else the other side of the track, nearer the barrier, higher up; the first that sees
  // the road 100 m and 45 m before it and 30 m past it is kept (none: the place above)
  let _tvRc = null;
  function tvSees(x, y, z, tx, ty, tz) {
    if (!world || !world.root) return true;
    if (!_tvRc) _tvRc = { rc: new THREE.Raycaster(), o: new THREE.Vector3(), d: new THREE.Vector3() };
    const R = _tvRc; R.o.set(x, y, z); R.d.set(tx - x, ty - y, tz - z); const len = R.d.length(); if (len < 6) return true;
    R.rc.set(R.o, R.d.multiplyScalar(1 / len)); R.rc.near = 0.5; R.rc.far = len - 3;
    for (const h of R.rc.intersectObject(world.root, true)) { const m = h.object.material; if (!m || m.transparent || m.alphaTest > 0 || !h.object.visible) continue; return false; }   // (fences and other see-through meshes: seen through)
    return true;
  }
  function tvPost(T, k) {
    const P = tvCams(T)[k]; if (P.ok) return P; P.ok = true;
    const gy = (i) => (T.hasElev && T.hy ? T.hy[i] : 0), road = [-100, -45, 30].map(d => { const j = T.idx(P.s + d); return [T.px[j], gy(j) + 0.8, T.pz[j]]; });
    const at = (side, ex, up) => { const i = P.i, bar = T.br ? (side > 0 ? T.br[i] : (T.bl ? T.bl[i] : T.w)) : T.w, off = side * (Math.max(T.w, bar) + ex), x = T.px[i] + T.nx[i] * off, z = T.pz[i] + T.nz[i] * off;
      let y = gy(i) + up; if (world && world.groundH) { const g = world.groundH(x, z); if (Number.isFinite(g)) y = Math.max(y, g + up - 4); } return { x, y, z }; };
    for (const [sd, ex, up] of [[1, 14, 9], [1, 5, 9], [-1, 14, 9], [-1, 5, 9], [1, 5, 15], [-1, 5, 15]]) {
      const c = at(sd * P.side, ex, up);
      if (road.every(r => tvSees(c.x, c.y, c.z, r[0], r[1], r[2]))) { P.x = c.x; P.y = c.y; P.z = c.z; break; }
    }
    return P;
  }
  // Pikes Peak's TV cameras (the replay, 'tv'): a helicopter's high tracking shot over the open road (over the lower ground beside the car,
  // a little behind it), fixed cameras at the famous places (Engineer's Corner, the W's seen from high up, Devil's Playground, Bottomless
  // Pit, Boulder Park) and the summit's view down at the finish. The fixed ones are placed once per track (16 directions x distances x
  // heights round the spot) where the ground, and the forest's trees below the tree line, leave the car in sight over the most of their
  // stretch; the cut goes to one when the car comes into its sight (after 2.5 s of the helicopter), back to the helicopter when it leaves it
  const PK_TV = [[578, 470, 700, 1], [3165, 2905, 3425, 2], [4050, 3950, 4160, 1], [4466, 4370, 4570, 1], [5360, 5255, 5470, 1], [6175, 5935, 6222, 3]];   // [d of the spot, its stretch from, to, kind: 1 trackside, 2 the W's (high up, afar), 3 the summit (above the finish, looking down)]
  function pkLos(G, ax, ay, az, bx, by, bz) {   // the camera a sees the car b: the ray clear of the ground (by the car), of the trees below the tree line and of the boulders (further off)
    const L = Math.hypot(ax - bx, az - bz); if (ay - by < 0.4 * L) return false;   // (looking down at it at 22 deg or more: over the marshals, the bales and the flags by the road)
    for (let j = 1; j < 16; j++) { const u = j / 16, x = bx + (ax - bx) * u, z = bz + (az - bz) * u, g = G(x, z), dc = L * u;
      if (by + (ay - by) * u - g < (dc < 14 ? 0.7 : g < 196 ? 4 + 10 * clamp((dc - 14) / 16, 0, 1) : 3.5)) return false; }
    return true;
  }
  function pkTvBuild(T) {   // a job placing the fixed cameras a slice (one camera's one direction) at a time, ~4 ms a frame: no hitch at the replay's start
    const G = world.groundH, s0 = T.startS, q = {}, out = [], yF = T.hy[T.idx(T.finishS)];
    let m = 0, n = 0, V = null;
    const setup = () => { const [d, a, b, kind] = PK_TV[m], i = T.idx(s0 + d), P = [];
      for (let s = s0 + a; s <= s0 + b; s += 5) { const j = T.idx(s); P.push(T.px[j], T.hy[j] + 1.1, T.pz[j]); }
      let cx = T.px[i], cz = T.pz[i]; if (kind === 2) { cx = cz = 0; for (let k = 0; k < P.length; k += 3) { cx += P[k]; cz += P[k + 2]; } cx /= P.length / 3; cz /= P.length / 3; }   // (the W's: round the middle of their stretch)
      V = { i, P, cx, cz, kind, sA: s0 + a, best: null, kc: Math.round((d - a) / 5),
        R: kind === 2 ? [70, 100, 135] : kind === 3 ? [16, 28, 44] : [24, 38, 56], H: kind === 2 ? [30, 45, 62, 80] : kind === 3 ? [10, 17, 26, 36] : [8, 14, 22, 32, 44] }; };
    const slice = () => {   // one direction n round camera m
      const { i, P, cx, cz, kind, sA, R, H, kc } = V;
      for (const r of R) {
        const x = cx + Math.cos(n * Math.PI / 8) * r, z = cz + Math.sin(n * Math.PI / 8) * r, g = G(x, z), Q = T.query(x, z, i, q);
        if (!Number.isFinite(g) || Math.abs(Q.d) < (Q.d > 0 ? T.br : T.bl)[Q.i] + 9 || (kind === 3 && g < yF - 4)) continue;   // (off the road, well beyond its barriers; the summit's up on the top)
        for (const h of H) {
          if (h < (g < 196 ? 16 : 7)) continue;   // (above the trees, the boulders)
          const y = g + h, ok = new Uint8Array(P.length / 3); let cov = 0, dd = 0;
          for (let k = 0; k < ok.length; k++) { const D = Math.hypot(P[k * 3] - x, P[k * 3 + 1] - y, P[k * 3 + 2] - z); if (D < 170 && pkLos(G, x, y, z, P[k * 3], P[k * 3 + 1], P[k * 3 + 2])) { ok[k] = 1; cov++; dd += D; } }
          const sc = cov + (ok[kc] ? 20 : 0) - (cov ? dd / cov : 0) * 0.06 + (kind === 3 ? 0.1 : -0.05) * h;   // (the most of the stretch, the spot itself, not too far; the summit's from high up)
          if (cov && (!V.best || sc > V.best.sc)) V.best = { x, y, z, ok, sc, sA, kind };
        }
      }
    };
    return { out, done: false, step(ms) {   // work for up to ms milliseconds; out fills camera by camera (in PK_TV's order)
      const t0 = performance.now();
      while (!this.done && performance.now() - t0 < ms) {
        if (!V) setup();
        slice(); if (++n === 16) { if (V.best) out.push(V.best); V = null; n = 0; if (++m === PK_TV.length) this.done = true; }
      }
      return out; } };
  }
  const pkTvO = { px: 0, py: 0, pz: 0, half: 7, key: -1 };
  function pkTv(c, dt, x, z) {
    const T = curTrack, G = world.groundH, C = (T._pkTv || (T._pkTv = pkTvBuild(T))).step(T._pkTv.done ? 0 : 4), s = c.q && Number.isFinite(c.q.s) ? c.q.s : 0, cy = (c.y || 0) + 1.1, o = pkTvO;
    const st = cam.pkTv || (cam.pkTv = { k: -1, t: 0, s: -1e9, car: null, init: false, hx: 0, hy: 0, hz: 0, dx: 0, dz: 0 }), e = (k) => 1 - Math.exp(-dt * k);
    const sees = (k) => { const F = C[k], j = Math.round((s - F.sA) / 5); return j >= 0 && j < F.ok.length && (F.ok[j] || F.ok[j - 1] || F.ok[j + 1]) && pkLos(G, F.x, F.y, F.z, x, cy, z); };
    const jump = !(Math.abs(s - st.s) < 60) || st.car !== c; st.s = s; st.car = c; st.t += dt;
    let want = -1; for (let n = 0; n < C.length; n++) if ((n === st.k || want < 0) && sees(n)) want = n;
    if (jump) { st.k = want; st.t = 0; st.init = false; }
    else if (st.k >= 0 && want !== st.k) { st.k = want; st.t = 0; }   // (the car out of its sight: cut)
    else if (st.k < 0 && want >= 0 && st.t > 2.5) { st.k = want; st.t = 0; }
    if (st.k >= 0) { const F = C[st.k]; o.px = F.x; o.py = F.y; o.pz = F.z; o.half = F.kind === 3 ? 10 : F.kind === 2 ? 9 : 7; o.key = st.k; st.init = false; return o; }
    // the helicopter: downhill from the car (the ground's slope over +-40 m, smoothed), 62 m out, 16 m behind, ~44 m up; higher where the
    // ground under it or between rises, or while the car is out of its sight
    let gx = G(x - 40, z) - G(x + 40, z), gz = G(x, z - 40) - G(x, z + 40), gl = Math.hypot(gx, gz);
    if (gl < 2) { const i = T.idx(s); gx = T.nx[i]; gz = T.nz[i]; gl = 1; }
    if (!st.init) { st.dx = gx / gl; st.dz = gz / gl; } else { st.dx += (gx / gl - st.dx) * e(0.7); st.dz += (gz / gl - st.dz) * e(0.7); }
    const dl = Math.hypot(st.dx, st.dz) || 1, ux = st.dx / dl, uz = st.dz / dl, hx = x + ux * 62 - Math.cos(c.h) * 16, hz = z + uz * 62 - Math.sin(c.h) * 16;
    let hy = Math.max(cy + 44, G(hx, hz) + 30, G((hx + x) / 2, (hz + z) / 2) + 24);
    for (let n = 0; n < 3 && !pkLos(G, hx, hy, hz, x, cy, z); n++) hy += 22;
    if (!st.init) { st.hx = hx - x; st.hy = hy - cy; st.hz = hz - z; st.init = true; }   // (kept as the offset from the car, eased: it keeps up at any replay speed)
    else { const k = e(1.3); st.hx += (hx - x - st.hx) * k; st.hz += (hz - z - st.hz) * k; st.hy += (hy - cy - st.hy) * e(hy - cy > st.hy ? 2.5 : 1); }
    o.px = x + st.hx; o.pz = z + st.hz; o.py = Math.max(cy + st.hy, G(o.px, o.pz) + 24) + 0.6 * Math.sin(time * 0.7); o.half = 9.5; o.key = -1; return o;
  }
  /* ---------------- the course flyover (prelet proge) before a fresh time trial on Pikes Peak (up the mountain to the summit) and on Katu-Jaryk
     (down from the plateau to the valley, def.fly: its places): a TV sweep from the start line to the finish, a camera high over the road looking
     down at it (the course's middle line: the road's points averaged over +-150 m, so the view follows the climb or the descent, not every
     hairpin), slowing at the famous places (their captions) and at the two ends. The path is made once per
     track (points every 40 m: over the ground as the TV cameras keep it, world.groundH, with the ground and the trees clear between the
     camera and the road; the heights smoothed), then a Catmull-Rom spline through them. game.js asks for it (pkFly.at(t): the shot for
     Render.setShot, filled in place, and the caption on screen) during the race's intro, before the lights: the race is not touched.
     The view is kept short (fogD: the far clip ~600 m), so it draws not much more than the kino camera does and streams the world in gently ---------------- */
  const pkFly = (() => {
    const DUR = 11.5, STEP = 40, PL = [[0, 'START'], [578, "Engineer's Corner"], [1000, 'Halfway Picnic Grounds'], [2688, 'Glen Cove'], [2918, "The W's"], [4050, "Devil's Playground"], [4466, 'Bottomless Pit'], [5360, 'Boulder Park'], [-1, 'CILJ']];
    const places = (T) => (T && T.def.fly) || (themeId === 'pikes' ? PL : null);   // ([metres after the start line (-1: the finish), caption]: Pikes Peak's above, a track's own def.fly)
    const shot = { px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0, fov: 50, fogD: 80, near: 2, gy: 0 }, res = { shot, k: -1, a: 0 };
    function build(T) {
      const PL = places(T), TL = themeId === 'pikes' ? 196 : Infinity;   // TL: the tree line, metres above the start (Pikes Peak's; elsewhere trees all the way)
      const G = world.groundH, s0 = T.startS, s1 = T.finishS, n = Math.ceil((s1 - s0) / STEP) + 1, sAt = (j) => Math.min(s1, s0 + j * STEP);
      const road = (s) => { const f = clamp(s, 0, T.len - 1) / T.ds, i = Math.min(T.N - 2, Math.floor(f)), u = f - i; return [lerp(T.px[i], T.px[i + 1], u), lerp(T.hy[i], T.hy[i + 1], u), lerp(T.pz[i], T.pz[i + 1], u)]; };
      const mid = (s) => {   // the course's middle line: the road averaged over +-150 m (less towards the ends: there the start line, the finish itself)
        const W = 150 * Math.min(Core.sstep(s0, s0 + 450, s), Core.sstep(s1, s1 - 450, s)); if (W < 2) return road(s);
        let x = 0, y = 0, z = 0, w = 0; for (let d = -2 * W; d <= 2 * W; d += 10) { const p = road(s + d), q = Math.exp(-(d * d) / (W * W)); x += p[0] * q; y += p[1] * q; z += p[2] * q; w += q; }
        return [x / w, y / w, z / w]; };
      const Tg = [], C = [], dirAt = (s) => { const a = mid(Math.max(s0, s - 220)), b = mid(Math.min(s1, s + 220)); let dx = b[0] - a[0], dz = b[2] - a[2]; const dl = Math.hypot(dx, dz) || 1; return [dx / dl, dz / dl]; };
      // a descent (def.descent): the camera out over the slope below the road (down the fall line of the ground there, smoothed along the course,
      // the farther out the steeper the face), a little behind and above, looking back across and up at the road: the face, its hairpins and
      // the depth of the valley in one view (on the flat ends behind the road as on a climb)
      const desc = !!T.def.descent, fall = [];
      if (desc) {
        const raw = []; for (let j = 0; j < n; j++) { const t = mid(sAt(j)), gx = (G(t[0] + 40, t[2]) - G(t[0] - 40, t[2])) / 80, gz = (G(t[0], t[2] + 40) - G(t[0], t[2] - 40)) / 80; raw.push(Number.isFinite(gx) && Number.isFinite(gz) ? [-gx, -gz] : [0, 0]); }
        for (let j = 0; j < n; j++) { let fx = 0, fz = 0, q = 0; for (let d = -5; d <= 5; d++) { const k = clamp(j + d, 0, n - 1), f = Math.exp(-(d * d) / 10); fx += raw[k][0] * f; fz += raw[k][1] * f; q += f; }
          fx /= q; fz /= q; const sl = Math.hypot(fx, fz); fall.push(sl > 1e-4 ? [fx / sl, fz / sl, sl] : [0, 0, 0]); }
      }
      for (let j = 0; j < n; j++) {
        const s = sAt(j), t = mid(s), [dx, dz] = dirAt(s);
        const e = Math.min(Core.sstep(s0, s0 + 600, s), Core.sstep(s1, s1 - 700, s));
        let x, z, y;
        if (desc) { const F = fall[j], f = e * clamp(F[2] / 0.3, 0, 1), D = 135 * f, B = lerp(j ? 50 : 40, 25, f), H = lerp(j ? 30 : 24, 46, e); x = t[0] + F[0] * D - dx * B; z = t[2] + F[1] * D - dz * B; y = t[1] + H; }
        else { const B = lerp(j ? 55 : 42, 80, e), H = lerp(j ? 34 : 26, 112, e); x = t[0] - dx * B; z = t[2] - dz * B; y = t[1] + H; }   // (low over the start line and the finish, high between, ~55 deg down: the view ends on the ground, not far off in the haze)
        const g = G(x, z); if (Number.isFinite(g)) y = Math.max(y, g + (g < TL ? 38 : 24));   // (over the trees below the tree line)
        for (let it = 0; it < 12; it++) {   // the ground (and the trees) clear between the camera and the road it looks at
          let ok = true; for (let q = 1; q < 12 && ok; q++) { const u = q / 12, px = x + (t[0] - x) * u, pz = z + (t[2] - z) * u, gh = G(px, pz), ly = y + (t[1] - y) * u; if (Number.isFinite(gh) && ly < gh + (u > 0.85 ? 2 : desc && u > 0.6 ? 8 : gh < TL ? 16 : 6)) ok = false; }   // (a descent: the road's verges clear near it)
          if (ok) break; y += 12; }
        Tg.push(t); C.push([x, y, z]);
      }
      for (let r = 0; r < 3; r++) for (let j = 1; j < n - 1; j++) C[j][1] = Math.max(C[j][1], (C[j - 1][1] + C[j][1] * 2 + C[j + 1][1]) / 4);   // (the heights smoothed, only ever up: no dips into a ridge)
      // the time along the road: slower at the places (a bump each) and at the two ends
      const ps = PL.map(([d]) => d < 0 ? s1 : s0 + d), M = 400, cum = new Float32Array(M + 1);
      const w = (s) => { let v = 1 + 14 * Math.exp(-(((s - s0) / 80) ** 2)) + 5.5 * Math.exp(-(((s - s1) / 140) ** 2)); for (let k = 1; k < PL.length - 1; k++) v += 0.9 * Math.exp(-(((s - ps[k]) / 150) ** 2)); return v; };
      for (let m = 1; m <= M; m++) cum[m] = cum[m - 1] + w(s0 + (s1 - s0) * (m - 0.5) / M);
      for (let m = 0; m <= M; m++) cum[m] *= DUR / cum[M];
      const tOf = (s) => { const f = clamp((s - s0) / (s1 - s0), 0, 1) * M, m = Math.min(M - 1, Math.floor(f)); return lerp(cum[m], cum[m + 1], f - m); };
      // the captions: from a little before each place, at least 1.1 s each (the next waits), at most 1.6 s; the finish's to the end
      const cap = []; for (let k = 0; k < PL.length; k++) { const t0 = k ? Math.max(tOf(ps[k] - (k === PL.length - 1 ? 260 : 150)), cap[k - 1][0] + 1.1) : 0.15; cap.push([t0, 0]); }
      for (let k = 0; k < cap.length; k++) cap[k][1] = k < cap.length - 1 ? Math.min(cap[k + 1][0] - 0.05, cap[k][0] + 1.6) : DUR + 1;
      return { T, s0, s1, n, Tg, C, cum, M, cap, ps };
    }
    const cr = (a, b, c, d, u) => { const u2 = u * u, u3 = u2 * u; return 0.5 * (2 * b + (c - a) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (3 * b - a - 3 * c + d) * u3); };   // (Catmull-Rom)
    function at(t) {   // the shot at t s into the flyover (null: a track without one)
      const T = curTrack; if (!T || !world || !world.groundH || !T.hy || !places(T)) return null;
      const F = T._pkFly || (T._pkFly = build(T)), M = F.M, tt = clamp(t, 0, DUR);
      let lo = 0, hi = M; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (F.cum[m] <= tt) lo = m; else hi = m; }
      const s = F.s0 + (F.s1 - F.s0) * (lo + clamp((tt - F.cum[lo]) / Math.max(1e-6, F.cum[hi] - F.cum[lo]), 0, 1)) / M;
      const f = clamp((s - F.s0) / STEP, 0, F.n - 1.0001), j = Math.floor(f), u = f - j, P = (A, k) => A[clamp(k, 0, F.n - 1)], sp = (A, c) => cr(P(A, j - 1)[c], P(A, j)[c], P(A, j + 1)[c], P(A, j + 2)[c], u);
      shot.px = sp(F.C, 0); shot.py = sp(F.C, 1); shot.pz = sp(F.C, 2); shot.tx = sp(F.Tg, 0); shot.ty = sp(F.Tg, 1); shot.tz = sp(F.Tg, 2); shot.gy = shot.ty;
      const g = world.groundH(shot.px, shot.pz); if (Number.isFinite(g) && shot.py < g + 12) shot.py = g + 12;   // (never low over the ground, whatever the spline does)
      res.k = -1; res.a = 0; for (let k = 0; k < F.cap.length; k++) { const [t0, t1] = F.cap[k]; if (t >= t0 && t < t1) { res.k = k; res.a = Math.min(1, (t - t0) / 0.25, (t1 - t) / 0.25); } }
      cull(true); res.s = s; return res;
    }
    let crowd = null;
    function cull(on) {   // the spectators' 40 m cells (one draw call each) far from the view's centre out of the picture (the camera's layer: nothing else changes): ~30 calls less over the W's
      if (!crowd || crowd.W !== world) { crowd = { W: world, list: [] }; const g = world && world.root.getObjectByName('crowds'); if (g) g.traverse(o => { if (o.name === 'crowd') crowd.list.push(o); }); }
      for (const o of crowd.list) o.layers.mask = !on || Math.hypot(o.position.x - shot.tx, o.position.z - shot.tz) < 100 ? 1 : 2;
    }
    function end() { if (crowd) cull(false); crowd = null; }
    function warm() {   // the world's shaders compiled in one go (game.js: before the first frame of the flyover), not one by one as it flies over new ground
      const t0 = performance.now(), n0 = renderer.info.programs.length; renderer.compile(scene, camera); return [Math.round(performance.now() - t0), n0, renderer.info.programs.length]; }
    return { at, end, DUR, warm, get caps() { const T = curTrack, F = T && T._pkFly; return (places(T) || PL).map(([d, n], k) => ({ n, s: F ? F.ps[k] : 0 })); } };
  })();
  function shake(a) { cam.shake = Math.max(cam.shake, Math.min(1.2, a)); }
  function resetCam() { cam.init = false; }
  // a TV shot: { px, py, pz (the camera), tx, ty, tz (where it looks), fov, fogD (the fog as for a camera this far from its target) },
  // updated by its owner every frame; null: back to the game's camera (from scratch)
  function setShot(s) { if (!s && cam.shot) cam.init = false; cam.shot = s || null; }

  /* ---------------- the sky: a dome round the camera for the views that look out to the horizon (the cockpit, the replay's TV cameras,
     the photo mode): the fog's colour at the horizon (the far world fades into it), a deeper colour overhead, a soft glow round the sun
     (by day and at dusk; the moon's at night) ---------------- */
  let sky = null;
  // the sky overhead: the fog's colour (the horizon's) deepened towards the time of day's blue (less under the rain's overcast)
  const _skA = new THREE.Color(), _skB = new THREE.Color();
  function skyTop(out) {   // (day blue .. dusk blue .. night: by todK; a theme's own zenith by day: theme.skyTop, skyK)
    const r = Math.max(0, wet), T = THEMES[themeId] || {}, own = T.skyTop != null && atmos.season !== 'winter';
    _skA.setHex(own ? T.skyTop : atmos.season === 'winter' ? 0x86a6d0 : 0x3f7cd0);
    if (todK > 0) { if (todK <= 0.5) _skA.lerp(_skB.setHex(0x34497f), todK / 0.5); else _skA.setHex(0x34497f).lerp(_skB.setHex(0x010207), (todK - 0.5) / 0.5); }
    const k = own ? T.skyK + (0.55 - T.skyK) * Math.min(1, todK / 0.5) : 0.55;   // (the theme's own share by day, the usual one from dusk on)
    return out.copy(scene.fog.color).lerp(_skA, (k + 0.25 * sstep(0.5, 1, todK)) * (1 - 0.8 * r));
  }
  function skyStep(on) {
    if (!sky) {
      if (!on) return;
      const u = { uBot: { value: new THREE.Color() }, uTop: { value: new THREE.Color() }, uSun: { value: new THREE.Vector3(0, 1, 0) }, uSunC: { value: new THREE.Color() }, uSunA: { value: 0 }, uStar: { value: 0 }, uWarm: { value: new THREE.Color() }, uWarmK: { value: 0 },
        uCl: { value: 0 }, uCO: { value: new THREE.Vector2() }, uCL: { value: new THREE.Color() }, uCD: { value: new THREE.Color() }, uOv: { value: 0 } };
      const mat = new THREE.ShaderMaterial({ uniforms: u, depthWrite: false, depthTest: false, fog: false, side: THREE.BackSide,
        vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform vec3 uBot; uniform vec3 uTop; uniform vec3 uSun; uniform vec3 uSunC; uniform float uSunA; uniform float uStar; uniform vec3 uWarm; uniform float uWarmK; varying vec3 vD;' +
          'uniform float uCl; uniform vec2 uCO; uniform vec3 uCL; uniform vec3 uCD; uniform float uOv;' +
          // the clouds (quality 'high'): a layer 450 m up, the same noise as the cloud shadows on the ground (World's CLOUD_VB, the same drift):
          // a cloud seen in the sky casts the shadow the ground shows, along the sun's rays. Puffy edges from a finer noise; lit on the side
          // towards the sun, in their own shade on the far side, their edges shining round the sun; into the haze far away
          'float clHash(vec2 i, float n) { i = mod(i, n); return fract(sin(dot(i, vec2(12.9898, 78.233))) * 43758.5453); }' +
          'float clVN(vec2 p, float n) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(clHash(i, n), clHash(i + vec2(1.0, 0.0), n), f.x), mix(clHash(i + vec2(0.0, 1.0), n), clHash(i + 1.0, n), f.x), f.y); }' +
          'float clF(vec2 q) { return 0.65 * clVN(q, 64.0) + 0.35 * clVN(q * 2.0 + vec2(17.0, 5.0), 128.0); }' +
          'void main(){ vec3 d = normalize(vD); vec3 c = mix(uBot, uTop, pow(smoothstep(0.0, 0.85, d.y), 0.75)); float s = max(dot(d, uSun), 0.0);' +
          ' if (uWarmK > 0.0) { float hl = length(d.xz), sl = length(uSun.xz); float a = hl > 1e-4 && sl > 1e-4 ? max(dot(d.xz / hl, uSun.xz / sl), 0.0) : 0.0;' +   // (a warm band low over the horizon towards the sun)
          ' c = mix(c, uWarm, uWarmK * pow(a, 3.0) * smoothstep(-0.01, 0.05, d.y) * (1.0 - smoothstep(0.0, 0.55, d.y))); }' +
          ' c += uSunC * uSunA * (pow(s, 90.0) * 0.8 + pow(s, 8.0) * 0.15);' +
          ' float D = 0.0;' +
          ' if (uCl > 0.0 && d.y > 0.008) {' +
          '  vec2 q = (cameraPosition.xz + (d.xz / d.y - uSun.xz / max(uSun.y, 0.1)) * 450.0) / 110.0 - uCO;' +
          '  float n = clF(q), e = clVN(q * 4.7 + vec2(3.1, 7.9), 300.8) - 0.5;' +
          '  D = max(smoothstep(0.52, 0.72, n + e * 0.08), uOv * (0.8 + 0.4 * e)) * smoothstep(0.01, 0.16 - 0.12 * uOv, d.y) * uCl;' +
          '  float lit = clamp(0.6 + (n - clF(q + uSun.xz * 0.3)) * 2.6 + e * 0.5, 0.0, 1.0);' +
          '  vec3 cc = mix(uCD, uCL, lit) + uSunC * uSunA * pow(s, 6.0) * 0.5 * (1.0 - smoothstep(0.3, 1.0, D));' +
          '  c = mix(c, mix(cc, uBot, smoothstep(0.3, 0.02, d.y) * 0.6), D); }' +
          // the night's stars: one in a few hundred cells of the sky a star (a hash of the cell), of its own brightness and tint, fewer and
          // fainter down in the haze towards the horizon; none behind a cloud
          ' if (uStar > 0.0) { vec3 p = d * 150.0, cl = floor(p); float h = fract(sin(dot(cl, vec3(127.1, 311.7, 74.7))) * 43758.5453);' +
          '  if (h > 0.972) { vec3 o = vec3(fract(h * 17.13), fract(h * 71.71), fract(h * 37.37)); float b = (h - 0.972) / 0.028;' +
          '   float k = smoothstep(0.34, 0.06, length(p - cl - 0.2 - 0.6 * o)) * (0.35 + 0.65 * b * b) * smoothstep(0.03, 0.3, d.y);' +
          '   c += mix(vec3(1.0, 0.86, 0.7), vec3(0.78, 0.88, 1.0), o.x) * k * uStar * (1.0 - D); } }' +
          ' gl_FragColor = vec4(c, 1.0); }' });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), mat); mesh.frustumCulled = false; mesh.renderOrder = -100;   // (drawn first, under everything)
      scene.add(mesh); sky = { mesh, u };
    }
    sky.mesh.visible = !!on;
    if (!on) { sky.u.uStar.value = 0; return; }   // (no stars seen)
    const r = Math.max(0, wet), U = sky.u;
    U.uBot.value.copy(scene.fog.color); skyTop(U.uTop.value);
    const T = THEMES[themeId] || {}, own = T.skyTop != null && atmos.season !== 'winter';   // (theme.skyWarm, skyWarmK: the glow towards the sun by day, gone by dusk as the theme's own zenith)
    U.uWarmK.value = own && T.skyWarm != null ? T.skyWarmK * (1 - r) * (1 - Math.min(1, todK / 0.5)) : 0; if (U.uWarmK.value > 0) U.uWarm.value.setHex(T.skyWarm);
    const sl = Math.hypot(sunOff[0], sunOff[1], sunOff[2]); U.uSun.value.set(sunOff[0] / sl, sunOff[1] / sl, sunOff[2] / sl);
    U.uSunC.value.copy(sun.color); U.uSunA.value = (todK <= 0.5 ? 1 + 0.6 * todK : 1.3 - 1.9 * (todK - 0.5)) * (1 - 0.85 * r); U.uStar.value = 0.9 * sstep(0.7, 1, todK) * (1 - 0.95 * r);   // (the rain's clouds hide them)
    // the clouds (quality 'high'): white by day (a touch of the sun's colour), pink and orange at dusk and at dawn, dark at night, grey and
    // closed under the rain; by todK, as the time of day moves on in an endurance race
    const cw = world && world.dyn.clouds; if (cw) U.uCO.value.copy(cw.O.value);
    U.uCl.value = settings.quality === 'high' ? 1 : 0; U.uOv.value = clamp(r * 1.3, 0, 1);
    const kD = todK <= 0.5 ? todK / 0.5 : 1, kN = todK > 0.5 ? (todK - 0.5) / 0.5 : 0, nk = 1 - 0.7 * sstep(0.5, 1, todK);
    U.uCL.value.setRGB(1, 1, 1).lerp(sun.color, 0.22).lerp(_c1.setRGB(1.0, 0.7, 0.56).lerp(sun.color, 0.35), kD).lerp(_c1.setRGB(0.19, 0.21, 0.27), kN);
    U.uCD.value.copy(U.uTop.value).lerp(_c2.setRGB(0.66, 0.68, 0.72), 0.7).lerp(_c1.setRGB(0.44, 0.37, 0.5), kD).lerp(_c1.setRGB(0.05, 0.06, 0.09), kN);
    if (r > 0) { U.uCL.value.lerp(_c2.setRGB(0.7, 0.72, 0.75).multiplyScalar(nk), r); U.uCD.value.lerp(_c2.setRGB(0.42, 0.44, 0.47).multiplyScalar(nk), r); }
    sky.mesh.position.copy(camera.position); sky.mesh.scale.setScalar(camera.far * 0.8);
  }

  /* ---------------- the sky's show: the stars and the moon at night, a rainbow after the rain, a thunderstorm's lightning, the lights on a wet
     road at night, the morning's mist in the valleys, the windows lit at dusk and at night ---------------- */
  // the moon (low in the moonlight's direction, its phase the real one of today; the stars are the sky dome's)
  const nsky = { moon: null, halo: null };
  function moonPhase() {   // today's moon: [its age as a share of the lunar month 0..1, the lit share 0..1]
    const P = 29.530588853, age = (((Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000) % P + P) % P / P;
    return [age, (1 - Math.cos(age * Math.PI * 2)) / 2];
  }
  function moonTex() {   // the disc: the lit part (never thinner than a fifth, so it is always there), the earthshine, grey seas and craters
    let [age, f] = moonPhase(); if (f < 0.2) { const a = Math.acos(1 - 2 * 0.2) / (Math.PI * 2); age = age < 0.5 ? a : 1 - a; }
    const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), img = g.createImageData(S, S), d = img.data, ph = age * Math.PI * 2, R = Core.rng(77);
    const spots = []; for (let k = 0; k < 16; k++) spots.push([R() * 1.6 - 0.8, R() * 1.6 - 0.8, 0.08 + R() * 0.22, 0.1 + R() * 0.18]);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const x = (i + 0.5) / S * 2 - 1, y = (j + 0.5) / S * 2 - 1, r2 = x * x + y * y, o = (j * S + i) * 4; if (r2 > 1) { d[o + 3] = 0; continue; }
      const xt = Math.cos(ph) * Math.sqrt(1 - y * y), lit = age < 0.5 ? x > xt : x < -xt;
      let k = 1; for (const s of spots) { const q = ((x - s[0]) ** 2 + (y - s[1]) ** 2) / (s[2] * s[2]); if (q < 1) k -= s[3] * (1 - q); }
      const v = lit ? 235 * k : 30 * k, e = Math.min(1, (1 - Math.sqrt(r2)) * S * 0.5);   // (a soft rim)
      d[o] = v * 0.97; d[o + 1] = v * 0.98; d[o + 2] = v; d[o + 3] = 255 * e;
    }
    g.putImageData(img, 0, 0); return new THREE.CanvasTexture(c);
  }
  function nightSky(on) {   // the moon (the stars: in the sky dome, skyStep)
    if (!nsky.moon) {
      if (!on) return;
      const mm = new THREE.MeshBasicMaterial({ map: moonTex(), transparent: true, depthWrite: false, fog: false, color: 0xe6ecff });
      nsky.moon = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mm); nsky.moon.frustumCulled = false; nsky.moon.renderOrder = -98; scene.add(nsky.moon);
      nsky.halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: radialTex([[0, 1], [0.08, 0.3], [1, 0]]), color: 0x6f7fa8, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
      nsky.halo.frustumCulled = false; nsky.halo.renderOrder = -98; scene.add(nsky.halo);
    }
    const a = on ? sstep(0.55, 0.95, todK) * (1 - 0.9 * clamp(wet * 1.5, 0, 1)) : 0;   // (the rain's overcast hides it)
    nsky.moon.visible = nsky.halo.visible = a > 0.01; if (a <= 0.01) return;
    const D = camera.far * 0.72, p = camera.position, sl = Math.hypot(-40, 60), md = _v3a.set(-40 / sl * Math.cos(0.42), Math.sin(0.42), 60 / sl * Math.cos(0.42));   // (the moon 24 degrees up, in the moonlight's direction)
    nsky.moon.position.copy(p).addScaledVector(md, D * 0.99); nsky.moon.quaternion.copy(camera.quaternion); nsky.moon.scale.setScalar(D * 0.05); nsky.moon.material.opacity = a;
    nsky.halo.position.copy(nsky.moon.position); nsky.halo.quaternion.copy(camera.quaternion); nsky.halo.scale.setScalar(D * 0.36); nsky.halo.material.opacity = 0.55 * a;
  }
  const _v3a = new THREE.Vector3(), _v3b = new THREE.Vector3();
  // the view looks out over the horizon (the chase and kino cameras at dusk, at night and in the morning: the sky dome with its colours and stars)
  function horizonSeen() { camera.getWorldDirection(_v3a); return Math.asin(clamp(_v3a.y, -1, 1)) + camera.fov * Math.PI / 360 > -0.02; }


  // a rainbow after the rain (a race of changing weather, when it stops by day): an arc 42 degrees round the point opposite the sun (never
  // under the horizon here: the sun's height taken at most 20 degrees), far out in front of the land, fading in and after a minute away
  const bow = { mesh: null, a: 0, want: 0, t: 0 };
  function rainbow(on) { bow.want = on && todK < 0.6 ? 1 : 0; bow.t = 0; if (!on) bow.a = 0; }
  function bowStep(dt) {
    if (!bow.want && bow.a <= 0) { if (bow.mesh) bow.mesh.visible = false; return; }
    if (!bow.mesh) {
      const m = new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 } }, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform float uA; varying vec2 vU; vec3 hue(float h){ return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }' +
          ' void main(){ float r = vU.y; vec3 c = hue(0.78 * (1.0 - r)); float e = smoothstep(0.0, 0.18, r) * smoothstep(1.0, 0.82, r); float f = smoothstep(0.0, 0.25, vU.x) * smoothstep(1.0, 0.75, vU.x);' +
          ' gl_FragColor = vec4(c * uA * e * f * 0.55, 1.0); }' });
      bow.mesh = new THREE.Mesh(new THREE.RingGeometry(1, 1.075, 96, 1, 0, Math.PI), m); bow.mesh.frustumCulled = false; bow.mesh.renderOrder = 5; scene.add(bow.mesh);
      const uv = bow.mesh.geometry.attributes.uv, pos = bow.mesh.geometry.attributes.position;   // (uv: x along the arc, y across its band: 0 inside .. 1 outside)
      for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i); uv.setXY(i, 1 - Math.atan2(y, x) / Math.PI, (Math.hypot(x, y) - 1) / 0.075); }
      uv.needsUpdate = true;
    }
    bow.t += dt; if (bow.want && bow.t > 70) bow.want = 0;
    bow.a += ((bow.want ? 1 : 0) - bow.a) * Math.min(1, dt * (bow.want ? 0.35 : 0.12)); if (!bow.want && bow.a < 0.01) bow.a = 0;
    const m = bow.mesh, D = camera.far * 0.7, sl = Math.hypot(sunOff[0], sunOff[2]), el = Math.min(Math.atan2(sunOff[1], sl), 0.35);
    const ax = -sunOff[0] / sl * Math.cos(el), ay = -Math.sin(el), az = -sunOff[2] / sl * Math.cos(el);   // (the point opposite the sun)
    m.visible = bow.a > 0.01; m.material.uniforms.uA.value = bow.a * (1 - clamp(wet * 2, 0, 1)) * (1 - sstep(0.4, 0.6, todK));
    m.position.set(camera.position.x + ax * D, camera.position.y + ay * D, camera.position.z + az * D);
    m.lookAt(camera.position); m.scale.setScalar(D * Math.tan(42 * Math.PI / 180));
    m.rotateZ(Math.atan2(0, 1));   // (the arc's flat side down: RingGeometry's half from 0 to pi is the upper half)
  }

  // a thunderstorm (the weather Nevihta): now and then lightning, a flash over the world (two or three flickers) and, when it strikes within
  // sight, its bolt far out over the land; the thunder after it, later the farther it struck (onThunder: the game plays it)
  const storm = { on: false, t: 0, next: 6, f: 0, pulses: [], bolt: null, boltT: 0, base: null, n: 0, onThunder: null };
  function setStorm(on) { storm.on = !!on; storm.t = 0; storm.next = 3 + Math.random() * 6; storm.pulses = []; storm.f = 0; if (storm.bolt) storm.bolt.visible = false; }
  function boltGeo(len) {   // a jagged line with a branch or two, as thin quads (in the bolt's own plane: x across, y down)
    const P = [], seg = (a, b, w) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l * w, ny = dx / l * w; P.push(a[0] - nx, a[1] - ny, 0, a[0] + nx, a[1] + ny, 0, b[0] + nx, b[1] + ny, 0, a[0] - nx, a[1] - ny, 0, b[0] + nx, b[1] + ny, 0, b[0] - nx, b[1] - ny, 0); };
    const line = (x, y, n, dl, w, br) => { let p = [x, y]; for (let k = 0; k < n; k++) { const q = [p[0] + (Math.random() - 0.5) * dl * 0.9, p[1] - dl * (0.6 + Math.random() * 0.5)]; seg(p, q, w); if (br && Math.random() < 0.18) line(q[0], q[1], 4 + (Math.random() * 4 | 0), dl * 0.6, w * 0.6, false); p = q; } };
    line(0, 0, 14, len / 14, len * 0.004, true);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); return g;
  }
  function strike() {
    storm.n++; storm.t = 0; storm.next = 6 + Math.random() * 16;
    const k = 2 + (Math.random() * 2 | 0); storm.pulses = []; for (let i = 0; i < k; i++) storm.pulses.push(i * (0.07 + Math.random() * 0.1));
    camera.getWorldDirection(_v3a); const a = Math.atan2(_v3a.z, _v3a.x) + (Math.random() - 0.5) * 1.6, far = camera.far * 0.8, dist = 250 + Math.random() * 1800;
    if (dist < far) {   // within sight: its bolt out there over the land
      if (storm.bolt) { scene.remove(storm.bolt); storm.bolt.geometry.dispose(); } else storm.boltMat = new THREE.MeshBasicMaterial({ color: 0xeef2ff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
      const H = 260 + Math.random() * 160; storm.bolt = new THREE.Mesh(boltGeo(H), storm.boltMat); storm.bolt.frustumCulled = false;
      const gx = camera.position.x + Math.cos(a) * dist, gz = camera.position.z + Math.sin(a) * dist, gy = world && world.groundH ? world.groundH(gx, gz) : 0;
      storm.bolt.position.set(gx, (Number.isFinite(gy) ? gy : 0) + H, gz); storm.bolt.lookAt(camera.position.x, storm.bolt.position.y, camera.position.z); scene.add(storm.bolt);
    } else if (storm.bolt) storm.bolt.visible = false;
    storm.boltT = 0.35; if (storm.bolt) storm.bolt.visible = dist < far;
    if (storm.onThunder) storm.onThunder(dist / 343, clamp(1.2 - dist / 2200, 0.25, 1));   // (the sound: at the speed of sound)
  }
  function stormStep(dt) {
    if (!storm.base) return;
    let f = 0;
    if (storm.on && curRace) { storm.t += dt; if (storm.t >= storm.next) strike(); for (const p of storm.pulses) { const q = storm.t - p; if (q >= 0) f = Math.max(f, Math.exp(-q * 16) * (p === 0 ? 1 : 0.75)); } }
    if (storm.bolt && storm.bolt.visible) { storm.boltT -= dt; storm.boltMat.opacity = clamp(f * 1.4, 0, 1); if (storm.boltT <= 0) storm.bolt.visible = false; }
    if (f < 0.002 && storm.f < 0.002) return;
    storm.f = f; storm.fMax = Math.max(storm.fMax || 0, f); const B = storm.base;   // the flash over the theme's light
    scene.fog.color.copy(B.fog).lerp(_c2.setHex(0xaab4d0), f * 0.45); renderer.setClearColor(scene.fog.color, 1); hemi.intensity = B.hemiI + f * 1.6;
  }

  // the morning mist (the time of day Jutro): where the ground lies low round the track, three soft layers of mist over the valleys (none on
  // a flat world); its top a little over the lowest land, thinning where the land rises through it, drifting
  let vfog = null;
  /* ---------------- the racing line for beginners (setLine): a ribbon on the road ahead of the followed car along the ideal line (the
     AI's), 150 m of it, coloured by the speed the car would carry along it from its speed now (as fast as it picks up speed, never
     faster than the AI's profile there): green where it rises, red where it must fall (the braking zone; its first metres white: the
     braking point), yellow where it holds (the slowest part of a corner, or flat out). Unlit (it glows at night), under the fog ---------------- */
  const rline = { on: false, mesh: null, n: 60, ds: 2.5, red: 0, green: 0, yellow: 0, brakes: 0 }, _bkL = {};
  function setLine(on) { rline.on = !!on; if (!rline.on && rline.mesh) rline.mesh.visible = false; }
  function lineStep(c) {
    const R = curRace, T = R && R.track, vp = R && R.vprof;
    if (!rline.on || !c || !T || !vp || !T.rl || !scene) { if (rline.mesh) rline.mesh.visible = false; return; }
    const n = rline.n, ds = rline.ds;
    if (!rline.mesh) {
      const g = new THREE.BufferGeometry(), idx = [];
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((n + 1) * 6), 3)); g.setAttribute('aC', new THREE.BufferAttribute(new Float32Array((n + 1) * 8), 4)); g.setAttribute('aL', new THREE.BufferAttribute(new Float32Array((n + 1) * 2), 1));
      for (let k = 0; k < n; k++) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } g.setIndex(idx);
      const m = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
        vertexShader: '#include <fog_pars_vertex>\nattribute vec4 aC; attribute float aL; varying vec4 vC; varying float vL; void main(){ vC = aC; vL = aL; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}',
        fragmentShader: '#include <fog_pars_fragment>\nvarying vec4 vC; varying float vL; void main(){ float d = fract(vL / 3.0); gl_FragColor = vec4(vC.rgb, vC.a * (0.55 + 0.45 * step(0.4, d)));\n#include <fog_fragment>\n}' });
      rline.mesh = new THREE.Mesh(g, m); rline.mesh.frustumCulled = false; rline.mesh.renderOrder = 2; scene.add(rline.mesh);
    }
    const P = rline.mesh.geometry.attributes.position.array, C = rline.mesh.geometry.attributes.aC.array, A = rline.mesh.geometry.attributes.aL.array, L = T.len, s0 = c.q.s + 4;
    const vAt = (s) => { const f = ((s % L) + L) % L / T.ds, i = Math.floor(f) % T.N, j = (i + 1) % T.N; return lerp(vp[i], vp[j], f - Math.floor(f)); };
    let prevRed = true, vs = Math.max(5, c.speed || 0); rline.red = rline.green = rline.yellow = rline.brakes = 0;
    for (let k = 0; k <= n; k++) {
      let s = s0 + k * ds; if (T.open) s = Math.min(s, L - 1);
      const f = ((s % L) + L) % L / T.ds, i = Math.floor(f) % T.N, j = (i + 1) % T.N, t = f - Math.floor(f);
      const nx = lerp(T.nx[i], T.nx[j], t), nz = lerp(T.nz[i], T.nz[j], t), off = lerp(T.rl[i], T.rl[j], t), cx = lerp(T.px[i], T.px[j], t) + nx * off, cz = lerp(T.pz[i], T.pz[j], t) + nz * off;
      let y = T.hasElev ? T.elevAt(s).y : 0; if (T.bank) { T.bankAt(s, off, _bkL); y += _bkL.dy || 0; } y += 0.07;
      P[k * 6] = cx - nx * 0.55; P[k * 6 + 1] = y; P[k * 6 + 2] = cz - nz * 0.55; P[k * 6 + 3] = cx + nx * 0.55; P[k * 6 + 4] = y; P[k * 6 + 5] = cz + nz * 0.55;
      const vn = k ? Math.min(vAt(s), Math.sqrt(vs * vs + 2 * Math.max(0.3, 5 - 0.075 * vs) * ds)) : vs, dv = vn - vs; vs = vn;   // (the speed it can carry there)
      const red = dv < -0.05, grn = dv > 0.08, brk = red && !prevRed;   // (the braking point: where the red starts)
      if (brk) rline.brakes++; prevRed = red; if (red) rline.red++; else if (grn) rline.green++; else rline.yellow++;
      const col = brk ? [1, 1, 1] : red ? [0.95, 0.18, 0.12] : grn ? [0.2, 0.9, 0.35] : [1, 0.82, 0.15], a = 0.8 * Math.min(1, k * ds / 10) * Math.min(1, (n - k) * ds / 30);
      for (const e of [0, 1]) { C.set([col[0], col[1], col[2], a], (k * 2 + e) * 4); A[k * 2 + e] = s; }
    }
    rline.mesh.geometry.attributes.position.needsUpdate = true; rline.mesh.geometry.attributes.aC.needsUpdate = true; rline.mesh.geometry.attributes.aL.needsUpdate = true;
    rline.mesh.visible = true;
  }
  /* ---------------- the driving school's marks (setMarks): a STOP line across the road (red and white) with its sign, boards at the
     roadside (150, 100, 50: the metres to the line); null or [] clears them ---------------- */
  let marks = null;
  function markTex(txt, bg, fg) { const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128; const x = cv.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, 128, 128); x.strokeStyle = fg; x.lineWidth = 8; x.strokeRect(6, 6, 116, 116);
    x.fillStyle = fg; x.font = 'bold ' + (txt.length > 3 ? 40 : 56) + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 64, 68); const t = new THREE.CanvasTexture(cv); return t; }
  function setMarks(list) {
    if (marks) { scene.remove(marks); marks.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); marks = null; }
    const T = curTrack; if (!list || !list.length || !T || !scene) return;
    marks = new THREE.Group();
    for (const e of list) {
      const s = e.s, f = ((s % T.len) + T.len) % T.len / T.ds, i = Math.floor(f) % T.N, x = T.px[i], z = T.pz[i], nx = T.nx[i], nz = T.nz[i], y = T.hasElev ? T.elevAt(s).y : 0;
      if (e.kind === 'stop') {   // the line: 0.8 m deep, across the whole road, in red and white squares
        const cv = document.createElement('canvas'); cv.width = 256; cv.height = 16; const cx = cv.getContext('2d'); for (let q = 0; q < 16; q++) { cx.fillStyle = q % 2 ? '#ffffff' : '#d8261c'; cx.fillRect(q * 16, 0, 16, 16); }
        const tex = new THREE.CanvasTexture(cv), m = new THREE.Mesh(new THREE.PlaneGeometry(T.w * 2, 0.8), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
        m.rotation.order = 'YXZ'; m.rotation.set(-Math.PI / 2, Math.atan2(-nz, nx), 0); m.position.set(x, y + 0.04, z); marks.add(m);   // (flat on the road, its long side across it)
      }
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: markTex(e.label, e.kind === 'stop' ? '#d8261c' : '#1d4fa8', '#ffffff') }));   // the sign on the right, 2.2 m up
      sp.scale.set(1.6, 1.6, 1); sp.position.set(x + nx * (T.w + 1.6), y + 2.2, z + nz * (T.w + 1.6)); marks.add(sp);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.5, 6), new THREE.MeshLambertMaterial({ color: 0x9aa3ad })); post.position.set(sp.position.x, y + 0.75, sp.position.z); marks.add(post);
    }
    scene.add(marks);
  }

  function valleyFog() {
    if (vfog) { for (const m of vfog.meshes) { scene.remove(m); m.geometry.dispose(); } vfog.mat.dispose(); vfog = null; }
    const T = curTrack; if (!dawn || !T || !world || !world.groundH) return;
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < T.N; i++) { x0 = Math.min(x0, T.px[i]); x1 = Math.max(x1, T.px[i]); z0 = Math.min(z0, T.pz[i]); z1 = Math.max(z1, T.pz[i]); }
    const pad = 380, n = 56, ax = x0 - pad, az = z0 - pad, sx = (x1 - x0 + 2 * pad) / n, sz = (z1 - z0 + 2 * pad) / n, H = new Float32Array((n + 1) * (n + 1));
    let lo = 1e9, hi = -1e9;
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { let h = world.groundH(ax + i * sx, az + j * sz); if (!Number.isFinite(h)) h = NaN; H[j * (n + 1) + i] = h; if (h === h) { lo = Math.min(lo, h); hi = Math.max(hi, h); } }
    if (!(hi - lo >= 30)) return;   // (a flat world: no valleys to fill)
    const top = lo + (hi - lo) * 0.3 + 5, U = { uT: { value: 0 }, uC: { value: new THREE.Color(0xe2dde6) } };
    const mat = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, U]), transparent: true, depthWrite: false, fog: true,
      vertexShader: '#include <fog_pars_vertex>\nattribute float aA; varying float vA; varying vec2 vW; void main(){ vA = aA; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}',
      fragmentShader: '#include <fog_pars_fragment>\nuniform float uT; uniform vec3 uC; varying float vA; varying vec2 vW;' +
        ' float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); } float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }' +
        ' void main(){ vec2 p = vW / 90.0 + vec2(uT * 0.012, uT * 0.004); float m = 0.55 * n2(p) + 0.3 * n2(p * 2.3 + 7.0) + 0.15 * n2(p * 5.1 - 3.0); gl_FragColor = vec4(uC, vA * smoothstep(0.25, 0.75, m));\n#include <fog_fragment>\n}' });
    mat.uniforms.uC = U.uC; mat.uniforms.uT = U.uT;
    const meshes = [];
    for (const [dy, amax] of [[0, 0.22], [-4, 0.26], [-8, 0.3]]) {
      const y = top + dy, P = [], A = [], I = [];
      for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const h = H[j * (n + 1) + i]; P.push(ax + i * sx, y, az + j * sz); A.push(h === h ? clamp((y - h) / 14, 0, 1) * amax : 0); }
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i, b = a + 1, c = a + n + 1, d = c + 1; if (A[a] + A[b] + A[c] + A[d] > 0) I.push(a, c, b, b, c, d); }
      if (!I.length) continue;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aA', new THREE.Float32BufferAttribute(A, 1)); g.setIndex(I);
      const me = new THREE.Mesh(g, mat); me.renderOrder = 3; me.frustumCulled = false; scene.add(me); meshes.push(me);
    }
    vfog = { meshes, mat, U, top, lo, hi };
  }

  /* ---------------- the cockpit (the 'cockpit' camera): the view from the driver's seat. The world is seen from the driver's eyes (the
     car's own bonnet, and the formula's nose, halo and front wheels, are the world's: seen from inside the car, its roof and sides are
     not drawn); the cockpit round them in a pass of its own after the world (its own camera, the day's light): a closed car's dashboard
     with a rev counter, a speedometer and the gear, the steering wheel turning with the front wheels, the windscreen's pillars, the roof
     and the mirror; the formula's wheel with its display and shift lights ---------------- */
  // the driver's eyes in the car (x forward from the centre, y up): inside the formula driver's helmet; in a closed car behind the
  // windscreen, a little under the roof. near: the camera's near plane there (the halo is right in front of the helmet)
  function eyeOf(M) {
    if (M.body === 'formula') return { x: -0.1, y: 0.8, near: 0.1, tilt: 0.03, formula: true };
    if (M.body === 'lm') return { x: 0.02, y: 0.9, near: 0.15, tilt: 0.04, formula: false, race: true };   // (the prototype: low in its canopy, the formula's wheel)
    const d = BODIES[M.body] || BODIES.coupe, sx = M.len / d.len, gf = d.secs.find(s => s[7] === 'gf');
    return { x: (gf ? gf[0] : 0) * sx - 0.5, y: d.roofY - 0.22, near: 0.25, tilt: 0.05, formula: false };
  }
  const ck = { scene: null, cam: null, key: '', grp: null, look: 0, sway: 0, car: null, parts: null, hemi: null, dir: null };
  const _ckE = new THREE.Vector3(), _ckQ = new THREE.Quaternion(), _ckQ2 = new THREE.Quaternion(), _ckEu = new THREE.Euler(), _ckF = new THREE.Vector3();
  const viewOf = (c) => { for (const v of views) if (v.car === c) return v; return null; };
  // a dial's face on a canvas: ticks and numbers round 270 degrees (the needle's sweep, from the bottom left over the top), a red zone
  function ckDial(max, step, red, label) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d');
    x.fillStyle = '#0b0c0f'; x.beginPath(); x.arc(128, 128, 127, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#8a8f98'; x.lineWidth = 5; x.stroke();
    const ang = (u) => Math.PI * 0.75 + u * Math.PI * 1.5;
    if (red != null) { x.strokeStyle = '#e0261c'; x.lineWidth = 14; x.beginPath(); x.arc(128, 128, 103, ang(red), ang(1)); x.stroke(); }
    x.strokeStyle = x.fillStyle = '#f4f3ee'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = 'bold 30px sans-serif';
    for (let k = 0; k <= Math.round(max / step) * 2; k++) { const v = k * step / 2, a = ang(v / max), big = k % 2 === 0;
      x.lineWidth = big ? 6 : 3; x.beginPath(); x.moveTo(128 + Math.cos(a) * (big ? 90 : 100), 128 + Math.sin(a) * (big ? 90 : 100)); x.lineTo(128 + Math.cos(a) * 113, 128 + Math.sin(a) * 113); x.stroke();
      if (big) x.fillText(String(Math.round(v)), 128 + Math.cos(a) * 66, 128 + Math.sin(a) * 66); }
    x.font = 'bold 20px sans-serif'; x.fillStyle = '#a4aab3'; x.fillText(label, 128, 192);
    return new THREE.CanvasTexture(cv);
  }
  // a small screen on a canvas (the gear; the formula's gear and speed), drawn again when what it shows changes
  function ckScreen(w, h) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const t = new THREE.CanvasTexture(cv); return { cv, x: cv.getContext('2d'), t, txt: null }; }
  function ckScreenSet(S, big, small, col) {
    const k = big + '|' + small; if (S.txt === k) return; S.txt = k;
    const x = S.x, w = S.cv.width, h = S.cv.height; x.fillStyle = '#05070a'; x.fillRect(0, 0, w, h);
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col || '#ffd23f'; x.font = 'bold ' + Math.round(h * (small ? 0.62 : 0.8)) + 'px sans-serif'; x.fillText(big, w / 2, small ? h * 0.4 : h * 0.54);
    if (small) { x.fillStyle = '#e8eef4'; x.font = 'bold ' + Math.round(h * 0.26) + 'px sans-serif'; x.fillText(small, w / 2, h * 0.84); }
    S.t.needsUpdate = true;
  }
  // a bar from a to b (w x d across it)
  function ckBar(a, b, w, d, mat) {
    const dir = _ckF.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = dir.length(), m = new THREE.Mesh(new THREE.BoxGeometry(w, L, d), mat);
    m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); m.quaternion.setFromUnitVectors(_ckE.set(0, 1, 0), dir.normalize()); return m;
  }
  function ckBuild(c) {
    const M = c.m, E = eyeOf(M), key = M.id + '|' + c.color;   // (the car: its body, its rev counter, its colour)
    if (ck.key === key) return;
    if (ck.grp) { ck.grp.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); ck.scene.remove(ck.grp); }
    if (!ck.scene) {
      ck.scene = new THREE.Scene(); ck.cam = new THREE.PerspectiveCamera(50, 1, 0.03, 6); ck.scene.add(ck.cam);
      ck.hemi = new THREE.HemisphereLight(0xffffff, 0x404040, 0.6); ck.dir = new THREE.DirectionalLight(0xffffff, 0.8); ck.scene.add(ck.hemi, ck.dir, ck.dir.target);
    }
    ck.key = key; const g = ck.grp = new THREE.Group(); ck.scene.add(g); const P = {}; ck.parts = P;
    const body = colArr(c.color), paint = new THREE.Color(body[0], body[1], body[2]);
    const trim = new THREE.MeshLambertMaterial({ color: 0x1d1e21 }), dark = new THREE.MeshLambertMaterial({ color: 0x111214 }), metal = new THREE.MeshLambertMaterial({ color: 0x5a5e66 });
    const wheel = new THREE.Group(), turn = new THREE.Group(); wheel.add(turn); g.add(wheel); P.turn = turn;
    if (E.formula || E.race) {
      // the formula's wheel (the prototype's too): a carbon plate with two grips, the display in the middle, the shift lights along the top, knobs
      wheel.position.set(0, E.race ? -0.25 : -0.19, E.race ? -0.44 : -0.42); wheel.lookAt(0, 0.02, 0);
      turn.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.11, 0.028), dark));
      for (const sd of [-1, 1]) { const gr = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.13, 10), new THREE.MeshLambertMaterial({ color: 0x0a0a0b })); gr.position.set(sd * 0.115, -0.005, 0); gr.rotation.z = sd * 0.12; turn.add(gr); }
      const scr = P.scr = ckScreen(128, 80), disp = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.044), new THREE.MeshBasicMaterial({ map: scr.t })); disp.position.set(0, 0.004, 0.0145); turn.add(disp);
      P.leds = []; const LC = [0x19e05a, 0x19e05a, 0x19e05a, 0x19e05a, 0x19e05a, 0xff2a1a, 0xff2a1a, 0xff2a1a, 0xff2a1a, 0xff2a1a, 0x3a6bff, 0x3a6bff, 0x3a6bff, 0x3a6bff, 0x3a6bff];
      for (let k = 0; k < 15; k++) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.0085, 0.0085, 0.004), new THREE.MeshBasicMaterial({ color: 0x1a1c20 })); l.position.set((k - 7) * 0.0112, 0.045, 0.0145); l.userData.on = new THREE.Color(LC[k]); turn.add(l); P.leds.push(l); }
      for (const [x, y, col] of [[-0.062, -0.03, 0xffd23f], [0.062, -0.03, 0x19a7ff], [-0.062, 0.018, 0xff5a1f], [0.062, 0.018, 0xe8e8e8]]) { const kb = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.01, 10), new THREE.MeshLambertMaterial({ color: col })); kb.rotation.x = Math.PI / 2; kb.position.set(x, y, 0.017); turn.add(kb); }
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 8), dark); col.rotation.x = Math.PI / 2; col.position.set(0, E.race ? -0.36 : -0.3, -0.62); g.add(col);   // (the column, under the wheel)
    }
    if (!E.formula) {
      // a closed car: the dashboard (its top from the wheel to the windscreen), the instruments, the wheel; the windscreen's pillars, the
      // roof's edge with the mirror, the doors' tops in the car's colour (the prototype: the formula's wheel and no instruments of its own)
      const dash = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.5, 0.62), new THREE.MeshLambertMaterial({ color: E.race ? 0x1c1d20 : 0x34363b })); dash.position.set(0, -0.565, -0.76); g.add(dash);
      const lip = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.03, 0.08), dark); lip.position.set(0, -0.31, -1.03); g.add(lip);
      if (!E.race) {
        // the instruments facing the driver: a dark panel, the rev counter and the speedometer, the gear between them, a visor over them
        // (the electric car: a power meter in kW instead of the rev counter, D for the gear)
        const clu = new THREE.Group(); clu.position.set(0, -0.258, -0.655); clu.lookAt(0, 0, 0); g.add(clu);
        clu.add(new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.118), new THREE.MeshLambertMaterial({ color: 0x0b0c0e })));
        const vis = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.012, 0.085), dark); vis.position.set(0, 0.064, 0.036); vis.rotation.x = 0.22; clu.add(vis);
        const red = (M.redline || 7000), tMax = Math.ceil(red / 1000 + 0.5), kMax = Math.ceil(M.kw / 100) * 100;
        P.dials = []; P.ev = !!M.ev;
        for (const [x, max, step, rz, lab] of [M.ev ? [-0.06, kMax, 100, null, 'kW'] : [-0.06, tMax, 1, (red / 1000) / tMax, 'x1000 RPM'], [0.06, 260, 40, null, 'KM/H']]) {
          const d = new THREE.Mesh(new THREE.CircleGeometry(0.047, 36), new THREE.MeshBasicMaterial({ map: ckDial(max, step, rz, lab), color: 0xdddddd })); d.position.set(x, 0, 0.002); clu.add(d);
          const n = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.0028, 0.001).translate(0.016, 0, 0), new THREE.MeshBasicMaterial({ color: 0xff3b1f })); n.position.z = 0.002; d.add(n);
          const hub = new THREE.Mesh(new THREE.CircleGeometry(0.0055, 12), new THREE.MeshBasicMaterial({ color: 0x2a2c30 })); hub.position.z = 0.003; d.add(hub);
          P.dials.push({ n, max: x < 0 ? (M.ev ? kMax : tMax * 1000) : 260 });
        }
        const scr = P.scr = ckScreen(64, 64), gd = new THREE.Mesh(new THREE.PlaneGeometry(0.022, 0.022), new THREE.MeshBasicMaterial({ map: scr.t })); gd.position.set(0, -0.03, 0.002); clu.add(gd);
        wheel.position.set(0, -0.375, -0.47); wheel.lookAt(0, 0.1, 0);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.019, 8, 40), new THREE.MeshLambertMaterial({ color: 0x151517 })); turn.add(rim);
        const mark = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.042, 0.04), new THREE.MeshLambertMaterial({ color: 0xffc21a })); mark.position.set(0, 0.18, 0); turn.add(mark);   // (the top of the wheel: a racing wheel's marker)
        for (const a of [0, Math.PI, -Math.PI / 2]) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.034, 0.012).translate(0.085, 0, 0), metal); sp.rotation.z = a; turn.add(sp); }
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.035, 18), dark); hub.rotation.x = Math.PI / 2; hub.position.z = 0.01; turn.add(hub);
        const badge = new THREE.Mesh(new THREE.CircleGeometry(0.022, 18), new THREE.MeshLambertMaterial({ color: paint })); badge.position.z = 0.029; turn.add(badge);
      }
      for (const sd of [-1, 1]) {
        g.add(ckBar([sd * 0.8, -0.31, -1.0], [sd * 0.64, 0.33, -0.48], 0.075, 0.06, trim));   // the pillars
        const door = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 1.3), new THREE.MeshLambertMaterial({ color: paint.clone().multiplyScalar(0.7) })); door.position.set(sd * 0.74, -0.37, -0.4); g.add(door);
      }
      if (M.body === 'rally' || (BODIES[M.body] || {}).cage) {   // the rally car's roll cage (the truck's too): tubes up the pillars and over the windscreen
        const cage = new THREE.MeshLambertMaterial({ color: 0xc9ccd1 }), T2 = 0.034;
        for (const sd of [-1, 1]) g.add(ckBar([sd * 0.7, -0.33, -0.9], [sd * 0.56, 0.3, -0.42], T2, T2, cage));
        g.add(ckBar([-0.56, 0.3, -0.42], [0.56, 0.3, -0.42], T2, T2, cage));
      }
      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.2), trim); roof.position.set(0, 0.3, -0.5); g.add(roof);
      const mcv = document.createElement('canvas'); mcv.width = 64; mcv.height = 32; const mx = mcv.getContext('2d'), mg = mx.createLinearGradient(0, 0, 0, 32);
      mg.addColorStop(0, '#9fb6c8'); mg.addColorStop(0.48, '#c9d6de'); mg.addColorStop(0.52, '#4a4d50'); mg.addColorStop(1, '#2a2c2e'); mx.fillStyle = mg; mx.fillRect(0, 0, 64, 32);
      const mir = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.055, 0.018), dark); mir.position.set(0, 0.215, -0.52); mir.lookAt(0, 0, 0); g.add(mir);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.195, 0.042), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(mcv), color: 0xb0b0b0 })); glass.position.z = 0.0095; mir.add(glass);
      g.add(ckBar([0, 0.265, -0.5], [0, 0.23, -0.515], 0.02, 0.02, dark));
      { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.76, -0.3, -0.99, 0.76, -0.3, -0.99, 0.6, 0.3, -0.49, -0.6, 0.3, -0.49], 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); geo.setIndex([0, 1, 2, 0, 2, 3]);
        const sm = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uRain: { value: 0 }, uSpd: { value: 0 }, uSky: { value: new THREE.Color() } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
          vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: CK_RAIN_FS });
        const scr = P.rain = new THREE.Mesh(geo, sm); scr.renderOrder = 5; scr.visible = false; g.add(scr); }
    }
    P.formula = E.formula || E.race; P.open = E.formula;
  }
  // the rain on a closed car's windscreen (the cockpit camera): drops gather on the glass and creep up it at speed; two wipers sweep
  // them off in turn (the time since a blade last passed each point of the glass, from the blades' swing: the drops come back after
  // it), the blades and their arms dark across the view. The glass between the pillars, 1.5 x 0.85 m, one quad of the cockpit
  const CK_RAIN_FS = [
    'uniform float uT; uniform float uRain; uniform float uSpd; uniform vec3 uSky; varying vec2 vUv;',
    'float cH(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }',
    'const float A0 = 0.08, A1 = 1.86, PW = 1.25, LB = 0.62;',
    'float wiped(vec2 p, vec2 pv, float ph, out float blade) {',   // seconds since this blade last passed p (99: out of its reach); blade: on the blade now
    '  vec2 d = p - pv; float r = length(d), th = atan(d.y, d.x), w = A0 + (A1 - A0) * (0.5 - 0.5 * cos(ph));',
    '  vec2 bd = vec2(cos(w), sin(w)); float along = clamp(dot(d, bd), 0.0, LB); blade = smoothstep(0.012, 0.004, length(d - bd * along)) * step(0.02, along);',
    '  if (r > LB || th < A0 || th > A1) return 99.0;',
    '  float pt = acos(clamp(1.0 - 2.0 * (th - A0) / (A1 - A0), -1.0, 1.0)), m = mod(ph, 6.2831853);',
    '  return min(mod(m - pt, 6.2831853), mod(m - (6.2831853 - pt), 6.2831853)) * PW / 6.2831853; }',
    'void main() {',
    '  vec2 p = vec2(vUv.x * 1.5, vUv.y * 0.85); float ph = uT / PW * 6.2831853, b1, b2;',
    '  float age = min(wiped(p, vec2(0.4, -0.05), ph, b1), wiped(p, vec2(0.98, -0.05), ph - 0.35, b2));',
    '  vec2 q = p / vec2(0.03, 0.05), c = floor(q), f = fract(q);',   // a drop in each cell now and then: when it landed after the wipe, where, how big
    '  float h = cH(c), arr = h * 2.6 / max(uRain, 0.15), on = step(arr, age) * step(0.25, cH(c + 5.3));',
    '  float cr = 0.2 + 0.16 * cH(c + 9.1), up = clamp((age - arr) * uSpd * 0.2, 0.0, 0.45);',   // (at speed the air pushes it up the glass)
    '  vec2 dc = vec2(0.5 + (cH(c + 2.7) - 0.5) * 0.3, 0.3 + 0.15 * cH(c + 4.4) + up);',
    '  vec2 e = (f - dc) * vec2(1.0, 0.6 / (1.0 + uSpd * 0.05)); float dd = length(e) / cr;',
    '  float drop = on * smoothstep(1.0, 0.8, dd) * step(dc.y + cr * 0.6, 1.0);',
    '  vec3 col = mix(uSky * 1.25, vec3(0.05, 0.06, 0.07), smoothstep(-0.7, 0.7, e.y / cr)) + smoothstep(0.32, 0.1, length(e / cr - vec2(-0.3, 0.35))) * 0.6;',   // (a little lens: the sky low in it, dark on top, a bright fleck)
    '  float a = drop * 0.72 * uRain + 0.05 * uRain;',
    '  col = mix(mix(uSky * 0.8, col, drop), vec3(0.02), max(b1, b2)); a = max(a, max(b1, b2) * 0.95);',
    '  gl_FragColor = vec4(col, a); }'].join('\n');
  // the cockpit as the car is now: the wheel turned with the front wheels, the needles, the gear, the shift lights; lit as the world is
  function ckStep(c, v) {
    ckBuild(c);
    const P = ck.parts, rpm = c.rpm || 0, red = c.m.redline || 7000;
    P.turn.rotation.z = -clamp((c.delta || 0) * 9, -2.4, 2.4);
    const gear = c.gear === -1 ? 'R' : c.gear === 0 ? 'N' : P.ev ? 'D' : String(c.gear || 1);
    if (P.formula) {
      ckScreenSet(P.scr, gear, String(Math.round((c.speed || 0) * 3.6)));
      const n = Math.round(clamp((rpm / red - 0.72) / 0.26, 0, 1) * 15);
      for (let k = 0; k < 15; k++) P.leds[k].material.color.set(k < n ? P.leds[k].userData.on : 0x1a1c20);
    } else {
      const kwNow = P.ev ? (c.inThr || 0) * c.m.kw * clamp((c.speed || 0) / 6, 0.25, 1) : 0;   // (the electric car: the power it draws)
      P.dials[0].n.rotation.z = -(0.75 + 1.5 * clamp((P.ev ? kwNow : rpm) / P.dials[0].max, 0, 1)) * Math.PI;
      P.dials[1].n.rotation.z = -(0.75 + 1.5 * clamp((c.speed || 0) * 3.6 / P.dials[1].max, 0, 1)) * Math.PI;
      ckScreenSet(P.scr, gear, null, '#7ff0ff');
    }
    // the light: the world's sky and ground light; the sun from its side of the car (a closed car's roof shades the cabin)
    ck.hemi.color.copy(hemi.color); ck.hemi.groundColor.copy(hemi.groundColor); ck.hemi.intensity = hemi.intensity;
    ck.dir.color.copy(sun.color); ck.dir.intensity = sun.intensity * (P.open ? 1 : 0.45);
    _ckF.set(sunOff[0], sunOff[1], sunOff[2]).normalize().applyQuaternion(_ckQ2.copy(camera.quaternion).invert()); ck.dir.position.copy(_ckF).multiplyScalar(3);   // (the sun as the camera sees it)
    if (P.rain) { const r = Math.max(0, wet), U = P.rain.material.uniforms; P.rain.visible = r > 0.03;   // (the rain on the windscreen)
      if (P.rain.visible) { U.uT.value = time % 600; U.uRain.value = clamp(r * 1.4, 0, 1); U.uSpd.value = c.speed || 0; U.uSky.value.copy(scene.fog.color).multiplyScalar(1 - 0.5 * sstep(0.5, 1, todK)); } }
    ck.cam.fov = camera.fov; ck.cam.aspect = camera.aspect; ck.cam.updateProjectionMatrix();
    ck.cam.position.set(ck.sway, 0, 0); ck.cam.rotation.set(-eyeOf(c.m).tilt - (v ? v.pitch : 0), -ck.look, v ? v.roll : 0, 'YXZ');
  }

  // the feel of speed (quality 'high', the post pass): from about 110 km/h the picture streaks out from the point the followed car drives
  // towards, the more the faster and the farther from the car (it stays sharp); not in the photo mode, a TV shot or the cockpit. And the summer's
  // heat: by day, dry, the air over the far asphalt trembles just under the horizon (seen from a low camera)
  const _mf = new THREE.Vector3();
  function speedLook(target, alpha, U) {
    let mb = 0;
    if (target && !cam.shot && !cam.ck && (lastMode === 'chase' || lastMode === 'kino')) {   // (not from the cockpit: the car's inside, at the edges of the picture, goes with the driver)
      const sp = target.speed || 0; mb = clamp((sp - 30) / 45, 0, 1) * 0.75;
      if (mb > 0) { const x = lerp(target.px, target.x, alpha), z = lerp(target.pz, target.z, alpha), y = target.y || 0, v = Math.hypot(target.vx || 0, target.vz || 0) || 1;
        _mf.set(x + (target.vx || 0) / v * 150, y, z + (target.vz || 0) / v * 150).project(camera); U.uMF.value.set(clamp(_mf.x * 0.5 + 0.5, -0.5, 1.5), clamp(_mf.y * 0.5 + 0.5, -0.5, 1.5));
        _mf.set(x, y + 0.6, z).project(camera); U.uMC.value.set(_mf.x * 0.5 + 0.5, _mf.y * 0.5 + 0.5); }
    }
    U.uMB.value = mb;
    const heat = atmos.season === 'summer' && todK < 0.2 && !dawn && wet <= 0 && themeId !== 'pikes' ? 1 : 0;   // (a summer's day: not in the morning)
    U.uHeat.value = 0; if (heat) { camera.getWorldDirection(_mf); const h = Math.hypot(_mf.x, _mf.z) || 1; _mf.set(camera.position.x + _mf.x / h * 900, camera.position.y, camera.position.z + _mf.z / h * 900).project(camera);
      const hy = _mf.y * 0.5 + 0.5; if (hy > 0.05 && hy < 1.1) { U.uHeat.value = heat; U.uHorY.value = hy; U.uTm.value = time % 600; } }
  }
  function frame(dt, alpha, target, mode, opt) {
    time += dt;
    updateCrew(dt);   // (first: it sets how far the player's car is up on the jacks)
    updateFlags();
    updateCars(dt, alpha, opt);
    hypeStep(Math.min(dt, 0.1));
    updateRoad(dt);
    syncDebris(); syncProps();
    for (let k = 0; k < views.length; k++) { const v = views[k], c = v.car; if ((c.repairN || 0) !== v.repairN) {   // repaired in the pits: a fresh car (and a burst of sparkle)
      const nv = makeView(c); nv.sk = v.sk; nv.acc = v.acc; disposeView(v, debrisRes()); views[k] = nv;   // (its loose panels on the track stay drawable)
      for (let n = 0; n < 12; n++) sparkP.emit(c.x + (Math.random() - 0.5) * 3, (c.y || 0) + 0.4 + Math.random() * 1.2, c.z + (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2, 1 + Math.random() * 2, (Math.random() - 0.5) * 2, 0.4 + Math.random() * 0.3, 0.45, 0.8, 1, 0.95, 0.7, 0.7, -1, 1.2, c.y || 0); } }
    particles.update(dt); sparkP.update(dt);
    if (world && world.dyn.bsMist) world.dyn.bsMist.on = curRace && curRace.opts && curRace.opts.mist ? 1 : 0;   // (Big Sur: the marine layer of this run)
    World.update(world, time, target, camera);
    if (target) updateCamera(dt, target, mode, alpha);
    lineStep(target);   // (the racing line helper, from the followed car's place of this frame)
    if (world && world.dyn.afterCam) world.dyn.afterCam(camera, target);   // (what depends on the camera of this very frame: Pikes Peak, which scenery chunks cast shadows)
    World.view(world, camera, cam.shot && cam.shot.noCut ? null : target, alpha);   // (Ouninpohja: the forest between the camera and the car fades out; not for a shot that looks at a building as it is)
    { const R = curRace, q = (v) => v > 0 ? Math.max(0.05, Math.round(v * 20) / 20) : 0;   // (a changing weather: in steps of 5 %)
      const r = R ? q(R.rain || 0) : 0, w = R ? q(R.water != null ? R.water : R.rain || 0) : 0;
      if (r !== wet) applyWeather(r); if (w !== wetW) applyRoad(w); dryLine(R); puddles(R); }
    pkLight(target);   // (Pikes Peak: its shadows and the light of the altitude, on top of the theme's)
    sunFx(target);   // (every other world: the sun's rays in the woods, its lens flare)
    stormStep(dt); bowStep(dt); winU.value = sstep(0.3, 0.85, todK);
    if (vfog) { vfog.U.uT.value = time; vfog.U.uC.value.copy(scene.fog.color).lerp(_c2.setRGB(1, 0.97, 0.96), 0.55); }
    if (birds.mesh.visible && target && world) birds.update(Math.min(dt, 0.1), cam.vcx || 0, cam.vcz || 0, world.groundH || (() => 0));
    if (snow.mesh.visible) { const U = snow.mat.uniforms, B = lastMode === 'cockpit' ? [28, 12, 28] : lastMode === 'chase' ? [62, 30, 62] : [80, 36, 80]; U.uBox.value.set(B[0], B[1], B[2]); U.uC.value.set(cam.vcx || 0, (cam.gy || 0) + B[1] * 0.42, cam.vcz || 0); U.uT.value = time % 600; U.uA.value = 0.9 * Math.min(1, wet * 1.5); U.uScale.value = particles.mat.uniforms.uScale.value; }
    if (rain.mesh.visible) {   // the box of streaks around the view centre (the iso camera sees the most ground, the chase camera the least)
      const U = rain.mat.uniforms, B = lastMode === 'cockpit' ? [28, 12, 28] : lastMode === 'chase' ? [62, 30, 62] : lastMode === 'kino' ? [72, 34, 72] : [86, 38, 86];   // (the cockpit: the streaks close round the car)
      U.uBox.value.set(B[0], B[1], B[2]); U.uC.value.set(cam.vcx || 0, (cam.gy || 0) + B[1] * 0.42, cam.vcz || 0); U.uT.value = time % 600;
      const sn = world && world.dyn.pkWx ? world.dyn.pkWx.sU.uD.value : 0;   // (Pikes Peak: it snows near the summit, the rain fades out there)
      U.uA.value = 0.5 * Math.min(1, wet * 1.5) * (1 - clamp(sn * 1.5, 0, 1));
    }
    rainFx(Math.min(dt, 0.1), target);
    // tunnel roof (and the hotel above it) fades out while the followed car is inside, so you can see it (Suzuka: the bridge, while it drives underneath)
    if (world && world.dyn.tunnel && target && target.q) {   // (not from the cockpit: from inside the car the tunnel is a tunnel)
      const tn = world.dyn.tunnel, sq = target.q.s, inside = !cam.ck && (tn.ranges ? tn.ranges.some(r => sq > r[0] - 30 && sq < r[1] + 12) : sq > tn.s0 - 30 && sq < tn.s1 + 12), goal = inside ? 0.14 : 1;   // (ranges: more than one, Los Caracoles' galleries)
      tn.mat.opacity += (goal - tn.mat.opacity) * Math.min(1, dt * 5 + 0.02);
      const tr = tn.mat.opacity < 0.985; if (tn.mat.transparent !== tr) { tn.mat.transparent = tr; tn.mat.needsUpdate = true; } tn.mat.depthWrite = !tr;
      if (tn.mats) for (const m of tn.mats) if (m !== tn.mat) { m.opacity = tn.mat.opacity; if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; } m.depthWrite = !tr; }   // (Suzuka: everything on the bridge)
    }
    { const on = !!(cam.ck || (lastMode === 'tv' && !cam.shot) || (cam.shot && cam.shot.sky) || ((todK >= 0.3 || dawn) && lastMode !== 'iso' && !cam.shot && horizonSeen()));   // (dusk, night, the morning: the sky over the horizon)
      skyStep(on); nightSky(on); } cgSet(false);
    { const W = World.waterSky; W.hor.value.copy(scene.fog.color); skyTop(W.top.value); }   // (the sky the water mirrors)
    asStep();
    const ckOn = cam.ck && ck.car; if (ckOn) ckStep(ck.car, viewOf(ck.car));
    { const cv = ckOn ? viewOf(ck.car) : null;   // (the Peugeot's own model has its inside, seats and all: from the seat, the plain body round the driver)
      if (ck.glbV && ck.glbV !== cv) { ck.glbV.glb.bodyH.visible = true; ck.glbV.body.visible = false; ck.glbV = null; }
      if (cv && cv.glb && cv.glb.bodyH && !ck.glbV) { cv.glb.bodyH.visible = false; cv.body.visible = true; ck.glbV = cv; }
      if (ck.litV && ck.litV !== cv) { carGlow(ck.litV); ck.litV = null; }   // (and it does not glow in the night round the driver: carGlow is for the others to see it)
      if (cv) { const m = cv.body.material; if (m && m.emissive && m.emissive.r) m.emissive.setScalar(0); ck.litV = cv; } }
    if (postOn()) {
      if (target) {   // keep the sharp band of the tilt-shift on the followed car
        _pv.set(lerp(target.px, target.x, alpha), (target.y || 0) + 0.6, lerp(target.pz, target.z, alpha)).project(camera);
        const fy = clamp(_pv.y * 0.5 + 0.5, 0.1, 0.9);
        const fc = (fy + 0.5) / 2;                              // midpoint car <-> look-ahead (screen centre)
        post.focus += (fc - post.focus) * Math.min(1, dt * 6 + 0.02);
        post.span = Math.abs(fy - 0.5) / 2;
      }
      if (post.haze > 0) {   // where the low sun is on (or just off) the screen; nothing when it is behind the camera
        camera.getWorldDirection(_sunV); const sl = Math.hypot(sunOff[0], sunOff[1], sunOff[2]), front = (_sunV.x * sunOff[0] + _sunV.y * sunOff[1] + _sunV.z * sunOff[2]) / sl;
        if (front > 0.02) { _pv.set(cam.vcx + sunOff[0] * 20, (cam.gy || 0) + sunOff[1] * 20, cam.vcz + sunOff[2] * 20).project(camera);
          const asp = camera.aspect, px = _pv.x * asp, py = _pv.y, pl = Math.hypot(px, py) || 1, far = pl > 1.15;   // the sun far off screen: put the glow just outside the edge, in its direction
          const ex = far ? px / pl * 1.15 : px, ey = far ? py / pl * 1.15 : py;
          post.mat.uniforms.uSun.value.set((ex / asp) * 0.5 + 0.5, ey * 0.5 + 0.5); }
        post.hk += ((front > 0.02 ? 1 : 0) - post.hk) * Math.min(1, dt * 3); post.mat.uniforms.uHaze.value = post.hk > 0.005 ? post.haze * post.hk : 0; }   // (fades in and out as a turning view brings the sun round: no pop)
      const U = post.mat.uniforms; U.uFocus.value = post.focus; U.uBand.value = (lastMode === 'kino' ? 0.3 : camera.aspect < 1 ? 0.2 : 0.24) + (post.span || 0); U.uBlur.value = lastMode === 'kino' ? 0.7 : 0.8;   // kino: a soft depth of field only towards the edges, as in the reference
      if (cam.ck) U.uBlur.value = 0; else if (cam.shot && cam.shot.blur != null) { U.uBlur.value = cam.shot.blur; if (cam.shot.blur > 0) U.uBand.value = 0.06; }   // (no miniature look from the driver's seat; the photo mode's own: a narrow sharp band on the car)
      speedLook(target, alpha, U);
      renderer.setRenderTarget(post.rt); renderer.render(scene, camera); if (ckOn) ckDraw();
      if (post.bloom > 0) bloomPass(); U.uBloom.value = post.bloom;
      renderer.setRenderTarget(null); renderer.render(post.sc, post.cam);
    } else { renderer.render(scene, camera); if (ckOn) ckDraw(); }
  }
  // a still of the view as it is now (the photo mode): drawn again at a higher resolution (the long side up to maxSide pixels, never less
  // than on the screen), copied to a 2D canvas at once (a WebGL canvas keeps its picture only until the page shows it)
  function snapshot(target, mode, maxSide) {
    const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight), pr = Math.max(basePR * dynScale, Math.min(2.5, (maxSide || 1920) / Math.max(w, h)));
    renderer.setPixelRatio(pr); renderer.setSize(w, h, false); sizePost(); updatePointScale();
    frame(0, 1, target, mode, { noFx: true });
    const src = renderer.domElement, out = document.createElement('canvas'); out.width = src.width; out.height = src.height;
    out.getContext('2d').drawImage(src, 0, 0);
    resize();
    return out;
  }
  function clearSparks() { if (sparkP) { sparkP.clear(); sparkP.update(0); } }   // (the photo mode: no contact's flash frozen in the picture)
  function ckDraw() { const a = renderer.autoClear; renderer.autoClear = false; renderer.clearDepth(); renderer.render(ck.scene, ck.cam); renderer.autoClear = a; }   // (the cockpit over the world)

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
    cgSet(true); renderer.render(showScene, showCam);
  }

  // debug: render the showroom car from a fixed camera (used for visual checks)
  function debugShot(px, py, pz, tx, ty, tz, rotY, fov) {
    if (!showScene || !showCar) return;
    showCar.grp.rotation.y = rotY || 0;
    const f = showCam.fov; if (fov) { showCam.fov = fov; showCam.updateProjectionMatrix(); }
    showCam.position.set(px, py, pz); showCam.lookAt(tx, ty, tz);
    cgSet(true); renderer.render(showScene, showCam);
    if (fov) { showCam.fov = f; showCam.updateProjectionMatrix(); }
  }
  function info() { return renderer ? renderer.info : null; }
  const dbg = { noSmoke: false };
  function setDebug(o) { Object.assign(dbg, o); }
  function fxStats() { let n = 0, sp = 0; for (let i = 0; i < particles.max; i++) if (particles.life[i] > 0) n++; for (let i = 0; i < sparkP.max; i++) if (sparkP.life[i] > 0) sp++; return { alive: n, emitted: particles.cur, sparks: sp }; }
  function winCount() { let n = 0; if (world && world.root) world.root.traverse(o => { const m = o.material; if (m && !Array.isArray(m) && m.userData && m.userData.win) n++; }); return n; }   // (tests: the materials with the lit windows)
  function lookInfo() {   // (tests) the look of the moment: the night's lights, the post pass's glow, the stars, the crowd's excitement
    let win = 0; if (world && world.root) world.root.traverse(o => { const m = o.material; if (m && !Array.isArray(m) && m.userData && m.userData.win) win++; });
    return { tod: atmos.tod, bloom: post ? post.bloom : 0, bloomOn: postOn() && post.bloom > 0, halos: flood ? flood.halo.geometry.attributes.position.count : 0, windows: win, winK: winU.value, stars: sky ? sky.u.uStar.value : 0, hype: +hype.v.toFixed(3) };
  }
  function look2Info() {   // (tests) round two: the asphalt's sheen, the sky's clouds, the contact shading, the worn grass, the grass's tone, the sun's rays and flare, the rain on the glass, the speed's streaks
    let ao = 0, worn = 0, nat = 0, asph = 0; if (world && world.root) world.root.traverse(o => { if (o.name === 'ao') ao += o.geometry.attributes.position.count; if (o.name === 'worn') worn += o.geometry.attributes.position.count;
      const m = o.material; if (m && !Array.isArray(m) && m.userData) { if (m.userData.grassLook && /N$/.test(m.customProgramCacheKey())) nat++; if (m.userData.asLook) asph++; } });
    const sc = asU.uAsC.value, U = post && post.mat.uniforms;
    return { sheen: +Math.max(sc.r, sc.g, sc.b).toFixed(3), asphalt: asph, clouds: sky ? sky.u.uCl.value : 0, overcast: sky ? +sky.u.uOv.value.toFixed(2) : 0, moon: nsky.moon && nsky.moon.visible ? +nsky.moon.material.opacity.toFixed(2) : 0, skyOn: !!(sky && sky.mesh.visible),
      ao, worn, natGrass: nat, rays: !!(pkR.mesh && pkR.mesh.visible), flare: +pkF.vis.toFixed(3), wipers: !!(cam.ck && ck.parts && ck.parts.rain && ck.parts.rain.visible),
      speedBlur: U && postOn() ? +U.uMB.value.toFixed(3) : 0, heat: U && postOn() ? U.uHeat.value : 0, puddleK: pud && pud.visible ? +pud.material.uniforms.uK.value.toFixed(3) : 0 };
  }
  function wetFx() { return { streaks: streaks.n, splashes: splash.mesh.visible ? splash.T.filter(t => time - t < 0.45).length : 0, puddles: pud && pud.visible ? +pud.material.uniforms.uK.value.toFixed(3) : 0, water: wetW }; }   // (tests)
  function flagInfo() { return { sc: !!scView && !!scView.car, scCar: scView ? scView.car : null, lampOn: !!scView && scView.lamps.some(l => l.material === matScOn), flags: flagInst ? flagInst.men.count : 0 }; }   // (tests)
  return { setDebug, fxStats, wetFx, lookInfo, look2Info, flagInfo, roadInfo, setAtmos, snapshot, clearSparks, get cockpit() { return cam.ck && ck.parts ? { car: ck.car, key: ck.key, formula: ck.parts.formula, open: !!ck.parts.open, gear: ck.parts.scr && ck.parts.scr.txt ? ck.parts.scr.txt.split('|')[0] : null, wheel: ck.parts.turn.rotation.z, near: camera.near, sky: !!sky && sky.mesh.visible } : null; }, get skyOn() { return !!sky && sky.mesh.visible; }, get atmos() { return atmos; }, get worldStale() { return !!(world && world.paintFor && world.paintFor(atmos.season) !== world.season); }, setGhost, pkFly, setGhostF, get ghostF() { return GV[1] ? { visible: GV[1].grp.visible, tag: GV[1].tagTxt, x: GV[1].grp.position.x, z: GV[1].grp.position.z } : null; }, init, buildWorld, applySettings, resize, attachRace, frame, setStartLights, shake, resetCam, setShot, goalShot, setShowCar, renderShowroom, debugShot, setDynScale, getDynScale, setSaver, precompile, setTodK, rainbow, setStorm, setLine, setMarks, set onThunder(f) { storm.onThunder = f; }, get show() { return { todK, dawn, stars: !!sky && sky.mesh.visible && sky.u.uStar.value > 0, moon: !!nsky.moon && nsky.moon.visible, sky: !!sky && sky.mesh.visible, warm: sky ? sky.u.uWarmK.value : 0, win: winU.value, winMats: winCount(), bow: bow.a, storm: storm.on, strikes: storm.n, flash: storm.f, flashMax: storm.fMax || 0, flood: !!flood, bolt: !!storm.bolt && storm.bolt.visible, streaks: streaks ? streaks.n : 0, mist: vfog ? vfog.meshes.length : 0, mistTop: vfog ? vfog.top : null, tags: views.filter(v => v.tag).map(v => v.car.name), line: rline.mesh && rline.mesh.visible ? { red: rline.red, green: rline.green, yellow: rline.yellow, brakes: rline.brakes } : null, marks: marks ? marks.children.length : 0 }; }, get pixelRatio() { return renderer.getPixelRatio(); }, info, cam, get scene() { return scene; }, get camera() { return camera; }, get world() { return world; }, get skidCount() { return skids ? skids.cur : 0; }, get crew() { return crew; }, get raining() { return !!rain && rain.mesh.visible; }, get birds() { return birds; } };
})();

