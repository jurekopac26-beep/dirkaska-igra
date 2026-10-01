/* =========================================================================
   RENDER — renderer, cars, particles, skids, cameras
   ========================================================================= */
const Render = (function () {
  'use strict';
  const { clamp, lerp, wrapPi } = Core;
  const GB = World.GB;

  // the morning mist (dawn, mistStep): every fogged material's fog thickened near the ground, the lower the thicker (MIST: x how much, y the
  // height it lies at, z how fast it thins upward, w from how far off it starts: not on the cars round the camera). The fog's own chunks are
  // patched before anything is compiled, the uniform shared by every built-in material (a plain object: three copies it by reference)
  const MIST = { x: 0, y: 0, z: 6, w: 45 };
  (function mistFog() {
    const C = THREE.ShaderChunk, F = '#ifdef USE_FOG';
    C.fog_pars_vertex = C.fog_pars_vertex.replace(F, F + '\n\tvarying float vFogWY;');
    C.fog_vertex = C.fog_vertex.replace(F, F + '\n\tvFogWY = dot( viewMatrix[ 1 ].xyz, mvPosition.xyz - viewMatrix[ 3 ].xyz );');   // (the height in the world: the view's rotation transposed)
    C.fog_pars_fragment = C.fog_pars_fragment.replace(F, F + '\n\tvarying float vFogWY;\n\tuniform vec4 uMist;');
    C.fog_fragment = C.fog_fragment.replace('\tgl_FragColor.rgb = mix', '\tfogFactor = max( fogFactor, uMist.x * exp( - max( vFogWY - uMist.y, 0.0 ) / uMist.z ) * smoothstep( uMist.w, uMist.w * 4.0, fogDepth ) );\n\tgl_FragColor.rgb = mix');
    for (const k in THREE.ShaderLib) { const U = THREE.ShaderLib[k].uniforms; if (U && U.fogColor) U.uMist = { value: MIST }; }
  })();

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
  // formula wheel (axle along z): a slick with the compound band on the sidewall (red soft; green intermediate in the rain), a dark rim,
  // a flat aero cover with two lighter spokes (so the spin shows) and a gold nut (12 sides: ~200 triangles, a phone draws 52 of them)
  const fWheelCache = new Map();
  function fWheelGeo(r, wd, wet) {
    const key = r + '|' + wd + '|' + (wet ? 1 : 0); if (fWheelCache.has(key)) return fWheelCache.get(key);
    const g = new GB(), S = 12, T = [0.075, 0.075, 0.08], B = wet ? [0.12, 0.66, 0.24] : [0.88, 0.13, 0.1], RIM = [0.22, 0.22, 0.24], CV = [0.13, 0.13, 0.14], CV2 = [0.34, 0.34, 0.36], NUT = [0.86, 0.72, 0.12];
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
  function carGeometry(bodyKey, M, color, stripe) {
    const key = bodyKey + '|' + M.id + '|' + color + '|' + stripe;
    if (geoCache.has(key)) return geoCache.get(key);
    if (bodyKey === 'rally') { const geo = smoothNormals(rallyGeometry(M, color), 38); geoCache.set(key, geo); return geo; }
    if (bodyKey === 'formula') { const geo = smoothNormals(formulaGeometry(M, color), 38); geoCache.set(key, geo); return geo; }
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
    if (bodyKey === 'formula') { const g = new GB(); World.box(g, -2.455, 0.305, 0, 0.03, 0.07, 0.085, 0, [1, 1, 1]); const geo = g.geometry(); tailGeoCache.set(key, geo); return geo; }   // the rain light
    const def = BODIES[bodyKey], sx = M.len / def.len, sz = M.wid / def.wid;
    const rear = def.secs[0];
    const x = rear[0] * sx, w = rear[1] * sz, y = rear[3] - 0.16;
    const g = new GB();
    for (const sd of [-1, 1]) World.box(g, x - 0.01, y, sd * w * 0.6, 0.1, 0.15, 0.42, 0, [1, 1, 1]);
    const geo = g.geometry(); tailGeoCache.set(key, geo); return geo;
  }

  /* ---------------- materials (shared) ---------------- */
  let matCar, matWheel, matTailOff, matTailOn, matBlob, matMarker, matScOn, matScOff;
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
    const faces = [mkFace(side), mkFace(side), mkFace(() => sky(0)), mkFace(() => [58, 60, 56]), mkFace(side), mkFace(side)];
    const t = new THREE.CubeTexture(faces); envFaces.studio = faces; envUsed = 'studio';
    t.needsUpdate = true; return t;
  }
  // the cube's two looks: the studio above (the showroom) and in the world the sky of this time of day and weather (envDraw, from applyTheme):
  // the sky dome's colours from the zenith to the horizon, a bright band at the horizon by day (the glossy look), the ground (snow in winter,
  // dark at night), the sun's glint (low and orange at dusk, the moon's at night) and at night the floodlights round the horizon. Before
  // this the paint mirrored a blue day sky at night and in the rain too. The same cube texture for every car's paint, chrome and glass:
  // envUse swaps its six faces (an upload of six small canvases, only when the showroom and the world take turns)
  const ENV_S = 48, envFaces = { studio: null, sky: null }, _eB = new THREE.Color(), _eT = new THREE.Color(), _eG = new THREE.Color(), _eS = new THREE.Vector3();
  let envUsed = '';
  function envUse(k) {
    if (k === envUsed || !envTex || !envFaces[k]) return;
    envUsed = k; envTex.image = k === 'sky' ? envFaces.sky.map(F => F.cv) : envFaces.studio; envTex.needsUpdate = true;
  }
  // the world direction of texel (i, j) of cube face f (the face order +x -x +y -y +z -z; three.js mirrors x in a cube texture's lookup)
  function envDir(f, i, j, out) {
    const sc = (i + 0.5) / ENV_S * 2 - 1, tc = (j + 0.5) / ENV_S * 2 - 1;
    let x, y, z;
    if (f === 0) { x = 1; y = -tc; z = -sc; } else if (f === 1) { x = -1; y = -tc; z = sc; } else if (f === 2) { x = sc; y = 1; z = tc; }
    else if (f === 3) { x = sc; y = -1; z = -tc; } else if (f === 4) { x = sc; y = -tc; z = 1; } else { x = -sc; y = -tc; z = -1; }
    const l = Math.hypot(x, y, z); out[0] = -x / l; out[1] = y / l; out[2] = z / l; return out;
  }
  // the floodlights round the horizon at night (azimuth, elevation): where a car's paint catches them
  const ENV_LAMPS = Array.from({ length: 14 }, (_, k) => [k / 14 * Math.PI * 2 + Math.sin(k * 7.3) * 0.2, 0.05 + 0.07 * (0.5 + 0.5 * Math.sin(k * 3.1))]).map(([a, e]) => [Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)]);
  function envDraw() {
    if (!envTex) return;
    if (!envFaces.sky) envFaces.sky = [0, 1, 2, 3, 4, 5].map(() => { const cv = document.createElement('canvas'); cv.width = cv.height = ENV_S; const g = cv.getContext('2d'); return { cv, g, img: g.createImageData(ENV_S, ENV_S) }; });
    const r = Math.max(0, wet), wn = whiteNight(), night = atmos.tod === 'night' && !wn, dusk = atmos.tod === 'dusk' || atmos.tod === 'dawn', winter = atmos.season === 'winter';   // (dawn: a low sun as at dusk)
    skyCols(_eB, _eT);
    const B = [_eB.r * 255, _eB.g * 255, _eB.b * 255], Z = [_eT.r * 255, _eT.g * 255, _eT.b * 255];
    const band = night ? 0 : (dusk ? 0.45 : 0.75) * (1 - 0.7 * r);
    if (winter) _eG.setRGB(0.78, 0.82, 0.88); else _eG.copy(hemi.groundColor).lerp(_c2.setRGB(0.3, 0.31, 0.3), 0.45);
    _eG.multiplyScalar(night ? 0.12 : wn ? 0.55 : dusk ? 0.7 : 1);
    const G = [_eG.r * 255, _eG.g * 255, _eG.b * 255], H = [(B[0] + G[0]) * 0.5, (B[1] + G[1]) * 0.5, (B[2] + G[2]) * 0.5];
    const sl = Math.hypot(sunOff[0], sunOff[1], sunOff[2]); _eS.set(sunOff[0] / sl, sunOff[1] / sl, sunOff[2] / sl);
    const sunK = (night ? 0.3 : dusk ? 1.6 : 1.1) * (1 - 0.85 * r), SC = [sun.color.r * 255, sun.color.g * 255, sun.color.b * 255];
    const lamps = atmos.tod === 'night' && !wn && curTrack && world ? (1 - 0.5 * r) : 0;
    const d = [0, 0, 0];
    for (let f = 0; f < 6; f++) {
      const F = envFaces.sky[f], a = F.img.data;
      for (let j = 0; j < ENV_S; j++) for (let i = 0; i < ENV_S; i++) {
        envDir(f, i, j, d); const y = d[1];
        let R, Gc, Bc;
        if (y >= 0) {   // the sky: as the dome draws it, the bright band low over the horizon
          const u = Math.min(1, y / 0.85), e = u * u * (3 - 2 * u), q = Math.sqrt(e), t = q * Math.sqrt(q), b = band * Math.max(0, 1 - y / 0.1);   // (the dome's pow(smoothstep, 0.75))
          R = B[0] + (Z[0] - B[0]) * t; Gc = B[1] + (Z[1] - B[1]) * t; Bc = B[2] + (Z[2] - B[2]) * t;
          R += (250 - R) * b; Gc += (250 - Gc) * b; Bc += (250 - Bc) * b;
        } else {   // the ground: from the hazy horizon down to the ground's own colour
          const t = Math.min(1, -y / 0.3); R = H[0] + (G[0] - H[0]) * t; Gc = H[1] + (G[1] - H[1]) * t; Bc = H[2] + (G[2] - H[2]) * t;
          if (band > 0 && y > -0.06) { const b = band * 0.6 * (1 + y / 0.06); R += (240 - R) * b; Gc += (240 - Gc) * b; Bc += (240 - Bc) * b; }
        }
        const s = d[0] * _eS.x + d[1] * _eS.y + d[2] * _eS.z;
        if (s > 0.8) { const k = sunK * (Math.pow(s, 400) * 2.5 + Math.pow(s, 24) * 0.3); R += SC[0] * k; Gc += SC[1] * k; Bc += SC[2] * k; }   // (further off the glow is nothing)
        if (lamps && y > -0.05 && y < 0.25) for (const L of ENV_LAMPS) { const q = d[0] * L[0] + d[1] * L[1] + d[2] * L[2]; if (q > 0.995) { const k = lamps * (q - 0.995) / 0.005; R += 255 * k; Gc += 236 * k; Bc += 200 * k; } }
        const o = (j * ENV_S + i) * 4; a[o] = R; a[o + 1] = Gc; a[o + 2] = Bc; a[o + 3] = 255;
      }
      F.g.putImageData(F.img, 0, 0);
    }
    envUsed = ''; envUse('sky');
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

  // grime on a car (every track but Pikes Peak, which has its own dust): dust rises from the sills lap by lap, fans out behind the wheels
  // and swirls onto the tail; mud splashes in the rain; winter: slush below, snow on the roof, bonnet and boot (blown off from the front
  // edge with speed). In the car's own space (uCgInv: the inverse of the car's matrix), so the loose panels (bonnet, wings, bumpers) and
  // the Peugeot's paint match the body. uCgA: dust, mud, snow, wet; uCgW: front and rear hub x, wheel radius, half length
  const CG_V = ['#include <common>\nuniform mat4 uCgInv;\nvarying vec3 vCg;\nvarying vec3 vCgN;',
    '#include <project_vertex>\n{ mat4 cgM = uCgInv * modelMatrix; vCg = (cgM * vec4(transformed, 1.0)).xyz; vCgN = mat3(cgM) * objectNormal; }'];
  const CG_F = ['#include <common>\nuniform vec4 uCgA;\nuniform vec3 uCgDC;\nuniform vec3 uCgMC;\nuniform vec4 uCgW;\nvarying vec3 vCg;\nvarying vec3 vCgN;',
    'float cgH(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }',
    'float cgNz(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); const vec2 o = vec2(1.0, 0.0);',
    '  return mix(mix(mix(cgH(i), cgH(i + o.xyy), f.x), mix(cgH(i + o.yxy), cgH(i + o.xxy), f.x), f.y), mix(mix(cgH(i + o.yyx), cgH(i + o.xyx), f.x), mix(cgH(i + o.yxx), cgH(i + o.xxx), f.x), f.y), f.z); }'].join('\n');
  const CG_GLSL = ['float cgD = 0.0;',   // (how much the grime dulls the shine and the reflections)
    'if (uCgA.x + uCgA.y + uCgA.z > 0.002) {',
    '  vec3 p = vCg, n = normalize(vCgN); float gl = 0.0;',
    '#ifdef USE_COLOR',
    '  gl = 1.0 - smoothstep(0.015, 0.03, min(distance(vColor, vec3(0.1, 0.13, 0.19)), distance(vColor, vec3(0.04, 0.05, 0.08))));',   // the body's glass panes (exactly those colours)
    '#endif',
    '#ifdef CG_GLASS',
    '  gl = 1.0 - smoothstep(0.8, 0.9, n.y);',   // the Peugeot's glass and chrome (its roof too): only what lies flat takes snow
    '#endif',
    '  float nz = cgNz(p * vec3(1.8, 7.5, 3.0)) * 0.6 + cgNz(p * vec3(6.0, 22.0, 9.0)) * 0.4;',   // (streaks along the car: the airflow)
    '  float ar = min(length(p.xy - uCgW.xz), length(p.xy - uCgW.yz)), sd = smoothstep(0.35, 0.75, abs(n.z)), off = smoothstep(uCgW.z * 0.9, uCgW.z + 0.03, ar);',
    '  float arch = (1.0 - smoothstep(uCgW.z + 0.08, uCgW.z + 0.5, ar)) * sd;',   // round the wheel arches
    '  float fan = (exp(-pow((p.x - uCgW.x + 0.6) * 2.0, 2.0)) + exp(-pow((p.x - uCgW.y + 0.6) * 2.0, 2.0))) * (1.0 - smoothstep(0.3, 0.95, p.y)) * sd;',   // thrown back by each wheel
    '  float rear = smoothstep(0.25, 0.8, -n.x) * (1.0 - smoothstep(-0.8, -0.3, p.x / uCgW.w)), top = smoothstep(0.55, 0.95, n.y);',   // the tail (the swirl behind the car); what faces up
    '  float lvl = 0.25 + 0.5 * uCgA.x, low = (1.0 - smoothstep(lvl - 0.3, lvl + 0.15, p.y + (nz - 0.5) * 0.35)) * (1.0 - 0.75 * top);',   // from the sills up, higher as it builds up
    '  float w = (max(max(low, arch), max(fan * 0.85, rear)) + top * 0.15) * mix(1.0, 0.35, gl) * off;',
    '  float dd = clamp(pow(uCgA.x, 0.6) * w * (0.62 + 0.75 * nz) * 1.25, 0.0, 0.88);',
    '  diffuseColor.rgb = mix(diffuseColor.rgb, uCgDC * (1.0 - 0.3 * uCgA.w) * (0.86 + 0.28 * nz), dd);',   // (wet: darker)
    '  float mw = max(1.0 - smoothstep(0.2, 0.35 + 0.5 * uCgA.y, p.y + (nz - 0.5) * 0.25), max(arch, fan) + rear * 0.6);',
    '  float dn = clamp(uCgA.y * (0.1 + 1.15 * mw), 0.0, 1.0) * off, sp = cgNz(p * vec3(11.0, 13.0, 11.0));',
    '  float md = smoothstep(1.0 - dn, 1.06 - dn, sp * 0.75 + nz * 0.25) * mix(1.0, 0.45, gl);',   // mud: blobs, denser low down and behind the wheels
    '  diffuseColor.rgb = mix(diffuseColor.rgb, uCgMC * (0.8 + 0.4 * nz), md * 0.94);',
    '  float st = uCgA.z * 1.3 - (0.5 + 0.5 * p.x / uCgW.w) * 0.45 - smoothstep(0.6, 0.92, abs(p.z) / 0.9) * 0.3 + (nz - 0.5) * 0.3, sn = top * (1.0 - gl) * smoothstep(0.0, 0.18, st);',
    '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.93, 0.97) * (0.95 + 0.1 * nz) * (1.0 - 0.16 * (1.0 - smoothstep(0.12, 0.4, st))), sn);',   // snow: goes from the front and the edges first (thin and grey at its edge)
    '  cgD = max(max(dd, md * (0.8 - 0.6 * uCgA.w)), sn); }'].join('\n');   // (wet mud still shines)
  function cgUniforms(M) {
    const sc = M.len / 4.4;
    return { inv: { value: new THREE.Matrix4() }, a: { value: new THREE.Vector4() }, dc: { value: new THREE.Color(0.66, 0.54, 0.39) }, mc: { value: new THREE.Color(0.36, 0.28, 0.19) },
      w: { value: new THREE.Vector4(M.a * sc * 0.98 + 0.05, -M.b * sc * 0.98, M.rw, M.len / 2) } };
  }
  // the paint's reflection with a Fresnel term (in place of three.js's envmap chunk): weak where the paint faces the camera, strong at a
  // glancing angle: the sky of the time of day (envDraw) along the car's flanks and over the bonnet seen from the cockpit
  const ENV_FR = ['#ifdef USE_ENVMAP',
    '  vec3 frV = normalize( vWorldPosition - cameraPosition ), frN = inverseTransformDirection( normal, viewMatrix ), frR = reflect( frV, frN );',
    '  vec4 envColor = envMapTexelToLinear( textureCube( envMap, vec3( flipEnvMap * frR.x, frR.yz ) ) );',
    '  float frF = pow( 1.0 - clamp( dot( -frV, frN ), 0.0, 1.0 ), 4.0 );',
    '  outgoingLight = mix( outgoingLight, envColor.xyz, clamp( specularStrength * reflectivity * ( 0.7 + 2.3 * frF ), 0.0, 0.8 ) );',
    '#endif'].join('\n');
  function cgPatch(sh, u, glass) {   // the grime layer into a car material's shaders (after what it already does to the colour)
    Object.assign(sh.uniforms, { uCgInv: u.inv, uCgA: u.a, uCgDC: u.dc, uCgMC: u.mc, uCgW: u.w });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', CG_V[0]).replace('#include <project_vertex>', CG_V[1]);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', (glass ? '#define CG_GLASS\n' : '') + CG_F).replace('#include <color_fragment>', '#include <color_fragment>\n' + CG_GLSL)
      .replace('#include <specularmap_fragment>', '#include <specularmap_fragment>\nspecularStrength *= 1.0 - cgD * 0.85;').replace('#include <envmap_fragment>', ENV_FR);
  }
  function cgMat(m, u, key, glass) { m.onBeforeCompile = (sh) => cgPatch(sh, u, glass); m.customProgramCacheKey = () => key; return m; }
  function dirtyCarMat(cg) {       // clone of the shared car paint + the scratches (uScr) + the grime layer
    const m = matCar.clone(), us = { value: 0 };
    m.userData.scr = us; m.userData.cg = cg;
    m.onBeforeCompile = (sh) => {
      cgPatch(sh, cg); sh.uniforms.uScr = us;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLp;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLp = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vLp;\nuniform float uScr;')
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + SCRATCH_GLSL);   // (the scratches first, the grime over them)
    };
    m.customProgramCacheKey = () => 'dirtyCar3';
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
    let bodyH = null;
    const paint = new THREE.MeshPhongMaterial({ color: car.color, shininess: 80, specular: 0x505050, envMap: envTex, combine: THREE.MixOperation, reflectivity: 0.2 });
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
    const cg = (opts && opts.noDirt) ? null : cgUniforms(M), bodyMat = cg ? dirtyCarMat(cg) : matCar;   // (the grime layer's uniforms: one set for all of the car's paint)
    const body = new THREE.Mesh(carGeometry(M.body, M, car.color, car.stripe !== false), bodyMat);
    body.castShadow = true; body.receiveShadow = false; bodyG.add(body);
    const tail = new THREE.Mesh(tailGeo(M.body, M), matTailOff); bodyG.add(tail);
    const def = BODIES[M.body];
    const dec = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.86), new THREE.MeshLambertMaterial({ map: numTex(car.num || 0), transparent: true }));
    dec.geometry.rotateX(-Math.PI / 2); dec.geometry.rotateY(-Math.PI / 2);
    dec.position.set(def.decalX != null ? def.decalX * (M.len / def.len) : def.secs.find(s => s[7] === 'r')[0] * (M.len / def.len) + 0.3 * (M.len / def.len), def.roofY + 0.012, 0);
    bodyG.add(dec);
    if (M.body === 'formula') { dec.scale.set(0.36, 1, 0.36); dec.rotation.z = -0.075; }   // (on the chassis in front of the cockpit)
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
      if (cg) {
        cgMat(glb.paint, cg, 'cgPaint'); cg.w.value.set(wf[0].position.x, wr[0].position.x, wf[0].position.y, M.len / 2);
        let gm = null;   // (its glass and chrome, the roof with them: this car's own copy, for the snow on the roof)
        bodyG.traverse(o => { if (o.isMesh && o.material === p206Mats.chrome) { o.material = gm = gm || cgMat(o.material.clone(), cg, 'cgGlass', true); gm.userData.p206Chrome = true; } });
      }
    } else if (M.body === 'formula') {
      fp = fPartMeshes(car, bodyG);
      for (const sd of [-1, 1]) {   // open wheels: all four separate (they steer and spin; the pit crew changes them)
        const f = new THREE.Mesh(fWheelGeo(F_HUB.fr, F_HUB.fw, car.wet < 1), matWheel), r = new THREE.Mesh(fWheelGeo(F_HUB.rr, F_HUB.rw, car.wet < 1), matWheel);
        f.position.set(M.a, F_HUB.fr, sd * F_HUB.fz); r.position.set(-M.b, F_HUB.rr, sd * F_HUB.rz); f.castShadow = r.castShadow = !!car.isPlayer;   // (a field of 13: the rivals' wheels cast none)
        grp.add(f, r); wf.push(f); wr.push(r);
      }
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
    const noHead = M.body === 'formula';   // the formula: no headlamps, one rain light at the tip of the crash structure
    if (noHead) { lights[0].set(2.62, 0.26, -0.05); lights[1].set(2.62, 0.26, 0.05); lights[2].set(-2.49, 0.34, -0.02); lights[3].set(-2.49, 0.34, 0.02); }
    return { grp, bodyG, body, tail, dec, wf, wr, glb, fp, blob, marker, lights, noHead, cg, scrU: bodyMat.userData && bodyMat.userData.scr || null };
  }

  /* ---------------- ghost of the best run (time trials) ---------------- */
  // A see-through copy of the player's car, posed by the game (js/game.js replays the stored best run). Only drawn: not a car of the
  // race (no physics, no collisions, no sound, no shadow, no glows or dust). One material for all its parts, kept for the whole visit.
  let ghostV = null, ghostMat = null;
  function ghostDrop() { if (!ghostV) return; scene.remove(ghostV.grp); freeOwn(ghostV.grp, new Set([ghostMat])); ghostV = null; }
  // g: null hides it (drop: also frees the mesh); else { M, color, stripe, x, y, z, h, d (steer), p (pitch), r (roll), op (opacity 0..1) }
  function setGhost(g, drop) {
    if (!g) { if (drop) ghostDrop(); else if (ghostV) ghostV.grp.visible = false; return; }
    if (!scene) return;
    if (!ghostMat) ghostMat = new THREE.MeshLambertMaterial({ color: 0xcfe4ff, emissive: 0x2b4a72, transparent: true, opacity: 0.4 });
    if (ghostV && (ghostV.M !== g.M || ghostV.color !== g.color)) ghostDrop();
    if (!ghostV) {
      const v = makeCarMesh({ m: g.M, color: g.color, stripe: g.stripe !== false, num: 0 }, { noDirt: true, noBlob: true, noMarker: true });
      const sh = sharedCarRes();
      v.bodyG.remove(v.dec); freeOwn(v.dec);   // no start number (also the rally's side decals: they share its material)
      v.grp.traverse(o => { if (!o.isMesh) return; if (o.material === v.dec.material) o.visible = false;
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (m && !sh.m.has(m) && m !== ghostMat && m !== v.dec.material) m.dispose();
        o.material = ghostMat; o.castShadow = false; o.receiveShadow = false; o.renderOrder = 2; });
      if (v.body.visible) v.body.renderOrder = 3;   // (the body over the wheels it hides)
      v.M = g.M; v.color = g.color; v.spin = 0; v.lx = g.x; v.lz = g.z;
      scene.add(v.grp); ghostV = v;
    }
    const v = ghostV, M = g.M;
    v.grp.visible = g.op > 0.01; ghostMat.opacity = 0.42 * clamp(g.op, 0, 1);
    v.grp.position.set(g.x, g.y, g.z);
    v.grp.rotation.set(0, -g.h, g.p || 0, 'YZX');
    v.bodyG.rotation.set(g.r || 0, 0, 0); v.bodyG.position.y = Math.abs(g.r || 0) * 0.4;
    const mv = Math.hypot(g.x - v.lx, g.z - v.lz); v.lx = g.x; v.lz = g.z;
    if (mv < 5) v.spin += mv / M.rw;   // (wheels roll with the distance moved; not across a jump back in the replay)
    for (const w of v.wf) w.rotation.set(0, -(g.d || 0), -v.spin);
    for (const w of v.wr) w.rotation.set(0, 0, -v.spin);
  }

  /* ---------------- particles ---------------- */
  // the followed car's headlights in the air (dusk, night): the rain, the snowflakes, the dust and the smoke in its beam light up (HLB: the
  // lamps' point and strength, the car's heading; set each frame from the car the camera follows, w 0 by day)
  const HLB = { uHB: { value: new THREE.Vector4() }, uHD: { value: new THREE.Vector3(1, 0, 0) } };
  const HB_GLSL = 'uniform vec4 uHB; uniform vec3 uHD;\nfloat hbeam(vec3 p) { vec3 q = p - uHB.xyz; float t = dot(q, uHD); vec3 r = q - uHD * t; float rh = 0.6 + 0.29 * t, rv = 0.15 + 0.1 * t, ry = r.y + 0.026 * t;\n' +
    '  return uHB.w * step(0.2, t) * (1.0 - smoothstep(14.0, 26.0, t)) * (1.0 - smoothstep(0.25, 1.0, dot(r.xz, r.xz) / (rh * rh) + ry * ry / (rv * rv))); }\n';
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
        uniforms: { uScale: { value: 400 }, uLit: { value: 1 }, uHB: HLB.uHB, uHD: HLB.uHD },
        vertexShader: 'attribute float psize; attribute vec4 pcolor; uniform float uScale; uniform float uLit; varying vec4 vC;\n' + HB_GLSL + 'void main(){ vC = vec4(pcolor.rgb * min(1.2, uLit + hbeam(position) * 1.1), pcolor.a); vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = psize * uScale / max(1.0, -mv.z); gl_Position = projectionMatrix * mv; }',
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

  /* ---------------- autumn leaves and Suzuka's cherry petals (in spring): they drift down round the view with the wind, swaying, the cars
     kick them up off the road and they swirl behind them; landed, they lie a few seconds and fade. A point each: the leaf (or the petal)
     drawn in it, turned by its spin, narrowed as it tumbles edge-on (lying flat once landed) ---------------- */
  class Leaves {
    constructor(max) {
      this.max = max; this.cur = 0; this.n = 0;
      this.pos = new Float32Array(max * 3); this.vel = new Float32Array(max * 3); this.col = new Float32Array(max * 4); this.rot = new Float32Array(max * 2); this.size = new Float32Array(max);
      this.life = new Float32Array(max); this.ml = new Float32Array(max); this.floor = new Float32Array(max); this.ph = new Float32Array(max); this.sp = new Float32Array(max); this.vt = new Float32Array(max); this.land = new Uint8Array(max);
      const g = new THREE.BufferGeometry(), A = (arr, n) => { const b = new THREE.BufferAttribute(arr, n); b.setUsage(THREE.DynamicDrawUsage); return b; };
      this.aPos = A(this.pos, 3); this.aCol = A(this.col, 4); this.aRot = A(this.rot, 2); this.aSize = A(this.size, 1);
      g.setAttribute('position', this.aPos); g.setAttribute('lcol', this.aCol); g.setAttribute('lrot', this.aRot); g.setAttribute('lsize', this.aSize);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      this.mat = new THREE.ShaderMaterial({ uniforms: { uScale: { value: 400 }, uLit: { value: 1 }, uPetal: { value: 0 } },
        vertexShader: 'attribute vec4 lcol; attribute vec2 lrot; attribute float lsize; uniform float uScale; uniform float uLit; varying vec4 vC; varying vec2 vR;' +
          'void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vC = vec4(lcol.rgb * uLit, lcol.a * smoothstep(2.5, 7.0, -mv.z)); vR = lrot; gl_PointSize = clamp(lsize * uScale / max(1.0, -mv.z), 0.0, 30.0); gl_Position = projectionMatrix * mv; }',   // (none right in front of the camera)
        fragmentShader: 'uniform float uPetal; varying vec4 vC; varying vec2 vR;' +
          'void main(){ vec2 d = gl_PointCoord - 0.5; float c = cos(vR.x), s = sin(vR.x); vec2 q = vec2(c * d.x - s * d.y, s * d.x + c * d.y) * 2.0;' +   // (turned by its spin)
          ' q.y /= max(0.12, vR.y);' +   // (narrowed as it tumbles)
          ' float m = uPetal > 0.5 ? 1.0 - length(q * vec2(1.0, 1.25) + vec2(0.0, 0.15 * abs(q.x))) : 1.0 - (q.y * q.y) / max(0.01, 0.42 * (1.0 - q.x * q.x)) - step(1.0, abs(q.x));' +
          ' if (m <= 0.0 || vC.a <= 0.0) discard; float vein = uPetal > 0.5 ? 0.0 : smoothstep(0.08, 0.0, abs(q.y)) * 0.35;' +
          ' gl_FragColor = vec4(vC.rgb * (1.0 - vein) * (0.85 + 0.15 * smoothstep(0.0, 0.5, m)), vC.a); }',
        transparent: true, depthWrite: false });
      this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false; this.points.renderOrder = 5; this.points.visible = false;
    }
    emit(x, y, z, vx, vy, vz, life, size, r, g, b, floor, vt) {
      const i = this.cur, o = i * 3; this.cur = (this.cur + 1) % this.max;
      this.pos[o] = x; this.pos[o + 1] = y; this.pos[o + 2] = z; this.vel[o] = vx; this.vel[o + 1] = vy; this.vel[o + 2] = vz;
      this.life[i] = this.ml[i] = life; this.size[i] = size; this.col[i * 4] = r; this.col[i * 4 + 1] = g; this.col[i * 4 + 2] = b; this.col[i * 4 + 3] = 1;
      this.floor[i] = floor + 0.04; this.ph[i] = Math.random() * 6.28; this.sp[i] = (Math.random() - 0.5) * 6; this.vt[i] = vt; this.land[i] = 0; this.rot[i * 2] = Math.random() * 6.28; this.rot[i * 2 + 1] = 1;
    }
    update(dt, wx, wz) {
      let n = 0;
      for (let i = 0; i < this.max; i++) {
        if (this.life[i] <= 0) { if (this.size[i]) { this.size[i] = 0; this.col[i * 4 + 3] = 0; } continue; }
        n++; this.life[i] -= dt; const o = i * 3;
        if (!this.land[i]) {
          this.ph[i] += dt * (2.2 + (i % 7) * 0.25);
          let vx = this.vel[o], vy = this.vel[o + 1], vz = this.vel[o + 2]; const k = Math.min(1, dt * 1.6), sw = Math.sin(this.ph[i]) * 0.55;
          vx += (wx - vx) * k; vz += (wz - vz) * k;   // (carried by the wind)
          if (vy > -this.vt[i]) vy -= dt * 5; else vy += (-this.vt[i] - vy) * Math.min(1, dt * 3);   // (kicked up: it rises and slows; then it floats down)
          this.vel[o] = vx; this.vel[o + 1] = vy; this.vel[o + 2] = vz;
          this.pos[o] += (vx - wz * sw) * dt; this.pos[o + 1] += vy * dt; this.pos[o + 2] += (vz + wx * sw) * dt;   // (swaying across the wind)
          this.rot[i * 2] += this.sp[i] * dt; this.rot[i * 2 + 1] = Math.abs(Math.cos(this.ph[i] * 0.7));
          if (this.pos[o + 1] <= this.floor[i]) { this.pos[o + 1] = this.floor[i]; this.land[i] = 1; this.rot[i * 2 + 1] = 1; this.life[i] = this.ml[i] = Math.min(this.life[i], 4 + Math.random() * 5); }   // (landed)
        }
        this.col[i * 4 + 3] = this.land[i] ? Math.min(1, this.life[i] / Math.max(0.1, this.ml[i]) * 3) : 1;
      }
      this.n = n; this.aPos.needsUpdate = this.aCol.needsUpdate = this.aRot.needsUpdate = this.aSize.needsUpdate = true;
    }
    clear() { this.life.fill(0); this.size.fill(0); }
  }
  // the leaves' colours (autumn: yellow, orange, red, brown) and the petals' (pale pink)
  const LEAF_C = [[0.92, 0.72, 0.16], [0.9, 0.48, 0.1], [0.68, 0.22, 0.1], [0.52, 0.34, 0.15], [0.82, 0.6, 0.2]], PETAL_C = [[1, 0.72, 0.84], [1, 0.84, 0.91], [0.96, 0.62, 0.78]];
  const _lfD = new THREE.Vector3();
  const leafCol = (petal) => { const L = petal ? PETAL_C : LEAF_C, c = L[(Math.random() * L.length) | 0], k = 0.85 + Math.random() * 0.25; return [c[0] * k, c[1] * k, c[2] * k]; };

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

  /* ---------------- rain: streaks falling in a box around the view centre. The shader wraps each drop into the box (its place
     moves only with the time), so nothing is updated per drop; the box fades out towards its sides, top and bottom ---------------- */
  class Rain {
    constructor(n) {
      const P = new Float32Array(n * 6), E = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) { const x = Math.random(), y = Math.random(), z = Math.random(); P.set([x, y, z, x, y, z], i * 6); E[i * 2 + 1] = 1; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aEnd', new THREE.BufferAttribute(E, 1));
      this.mat = new THREE.ShaderMaterial({
        uniforms: { uT: { value: 0 }, uO: { value: new THREE.Vector3() }, uC: { value: new THREE.Vector3() }, uBox: { value: new THREE.Vector3(80, 36, 80) }, uV: { value: new THREE.Vector3(1.8, -13, 1.1) },
          uLen: { value: 0.075 }, uA: { value: 0.5 }, uCol: { value: new THREE.Color(0xe2e8ee) }, uLit: { value: 1 }, uHB: HLB.uHB, uHD: HLB.uHD },
        vertexShader: [
          'attribute float aEnd; uniform vec3 uO; uniform vec3 uC; uniform vec3 uBox; uniform vec3 uV; uniform float uLen; varying float vA; varying float vB;', HB_GLSL,
          'void main(){',
          '  vec3 o = uC - 0.5 * uBox, p = o + mod(position * uBox + uO - o, uBox) - uV * (uLen * aEnd);',   // the head wrapped into the box (uO: how far the rain has fallen, uV integrated), the tail up along the fall
          '  vec3 d = abs(p - uC) / (0.5 * uBox);',
          '  vA = (1.0 - smoothstep(0.55, 1.0, max(d.x, d.z))) * (1.0 - smoothstep(0.6, 1.0, d.y)) * (1.0 - 0.75 * aEnd); vB = min(1.0, hbeam(p));',
          '  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);',
          '}'].join('\n'),
        fragmentShader: 'uniform vec3 uCol; uniform float uA; uniform float uLit; varying float vA; varying float vB; void main(){ gl_FragColor = vec4(uCol * mix(0.55 + 0.45 * uLit, 1.5, vB), min(1.0, uA * vA * (1.0 + 4.0 * vB))); }',   // (at night dimmer, bright in the beam)
        transparent: true, depthWrite: false,
      });
      this.mesh = new THREE.LineSegments(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 8; this.mesh.visible = false;
    }
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
  const HAZE_W = [0.71, -0.56];   // (the wind the hanging dust drifts with, m/s: World's cloud shadows drift the same way)
  const SNOW_DUST = [0.93, 0.95, 0.99];   // (winter: the powder snow off a gravel road)   // the dust cloud off gravel and dirt (a track's def.dust overrides it)
  let dust = null;
  const debrisMeshes = [];
  let particles, hazeP = null, hazeT = -1, skids, views = [], leaves = null;
  const leafK = { on: false, petal: false, rate: 0, R: 50, acc: 0, litter: null };   // (the leaves now: whether, petals, how many a second, how far round the view)
  // the thunderstorm (stormStep): on (race.sky.storm while it rains), the next strike (s), the strokes of the one now (seq: [t, strength], t: its clock), the
  // flash now (f), the bolt's mesh, what the flash wrote into the light last frame (w) over its base, the wind's strength (World.wind), the strikes so far
  const stm = { on: false, next: 5, t: 0, seq: null, f: 0, bolt: null, boltOn: false, w: null, base: { hi: 0, hc: new THREE.Color(), fog: new THREE.Color() }, wind: 1, n: 0, cb: null };
  let rain = null, wet = -1, wetW = -1, dryLn = null, themeId = 'lake', birds = null;   // rain streaks; the weather drawn now (race.rain, the rain, and race.water, the water on the road; -1: not applied yet), the dry racing line, the world's theme
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
    matCar.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <envmap_fragment>', ENV_FR); }; matCar.customProgramCacheKey = () => 'carFr';
    matWheel = new THREE.MeshLambertMaterial({ vertexColors: true });
    matTailOff = new THREE.MeshLambertMaterial({ color: 0x6a1212 });
    matTailOn = new THREE.MeshBasicMaterial({ color: 0xff2a1a });
    matBlob = new THREE.MeshBasicMaterial({ map: tex.blob, transparent: true, depthWrite: false, opacity: 0.8 });
    matMarker = new THREE.MeshBasicMaterial({ color: 0xffd23f });
    matScOn = new THREE.MeshBasicMaterial({ color: 0xffa21a }); matScOff = new THREE.MeshLambertMaterial({ color: 0x4a3312 });   // (the safety car's lamps)
    particles = new Particles(2400); scene.add(particles.points);
    sparkP = new Particles(700, true); scene.add(sparkP.points);
    hazeP = new Particles(420); hazeP.mat.uniforms.uLit = particles.mat.uniforms.uLit; hazeP.points.renderOrder = 4; scene.add(hazeP.points);   // (the dust left hanging over the gravel: its own ring, long-lived)
    glows = new Glows(4 * 16); scene.add(glows.points);
    skids = new Skids(8000); scene.add(skids.mesh);
    rain = new Rain(3200); scene.add(rain.mesh);
    snow = new Snow(2600); scene.add(snow.mesh);
    leaves = new Leaves(700); scene.add(leaves.points);
    rain.mat.uniforms.uLit = snow.mat.uniforms.uLit = particles.mat.uniforms.uLit;   // (as dark as the dust and the smoke at night)
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
    world = World.build(scene, track, tex, { density });
    World.seeThrough(world);   // (what stands between the camera and the car fades out: World.view, every frame)
    if (!world.farClip && camera.far !== 700) { camera.far = 700; camera.updateProjectionMatrix(); }
    applyTheme((track.def && track.def.theme) || 'lake'); wet = wetW = -1;   // (the weather again on the new world's road)
    curTrack = track; seasonWorld(); floodlights(); todWorld();   // (the season and the time of day on the new world)
    leafK.litter = null; leafSet();   // (the leaves: the litter is the new world's, made when needed)
    roadMarks(track);   // (the rubber, the marbles, the standing water, the oil, the sausage kerbs: see roadMarksStep)
    liveBuild(track);   // (the timing pylon, the screens' live layer: see liveStep)
    ledBuild(track);   // (the LED boards: sponsors, the flags)
    farBuild(track);   // (wind turbines, a power line, the red warning lights)
    pitLBuild(track);   // (the pit board at the wall, the paddock's people)
    mistAt(track);   // (where the morning mist lies)
    if (dryLn) { scene.remove(dryLn); dryLn.geometry.dispose(); dryLn.material.dispose(); dryLn = null; }
    birds.reset(!!(track.def && (track.def.sea || track.def.theme === 'monaco')));   // (gulls by the sea)
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
  function floorAt(x, z, hint) { const T = curRace && curRace.track, f = curRace && curRace.propFloor; if (!T || (!T.hasElev && !f)) return 0; const q = T.query(x, z, T.cross.length && hint >= 0 ? hint : -1, _fq); return (T.hasElev ? T.elevAt(q.s).y : 0) + (f ? f(q) : 0); }   // particle floor: the road height there (0 on the flat circuits; the verge's where it lies lower)
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
    renderer.setPixelRatio(basePR * dynScale);
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (showCam) { showCam.aspect = w / h; showCam.updateProjectionMatrix(); }
    updatePointScale(); sizePost();
  }
  const THEMES = {
    lake:     { fog: 0xbcd3e4, sun: 0xfff0d6, sunI: 0.98, sky: 0xd3e7ff, gnd: 0x5d6b35, hemiI: 0.62, tint: [1.02, 1.0, 0.97], sat: 1.1, clouds: 0.45 },
    city:     { fog: 0xd8e3ea, sun: 0xffe5bd, sunI: 1.04, sky: 0xdcecff, gnd: 0x86785a, hemiI: 0.6, tint: [1.05, 1.0, 0.93], sat: 1.12, clouds: 0.35 },
    ljubljana: { fog: 0xcadbe9, sun: 0xffe6c2, sunI: 1.04, sky: 0xd8e9ff, gnd: 0x7a6e56, hemiI: 0.6, tint: [1.04, 1.0, 0.95], sat: 1.13, clouds: 0.45 },
    forest:   { fog: 0x9a90c6, sun: 0xff9e5e, sunI: 2.26, sky: 0x6d8cec, gnd: 0x1c357f, hemiI: 0.7, tint: [1.0, 0.95, 1.04], sat: 1.06, sunOff: [-55, 64, -106], clouds: 0.3 },   // low sun in the NNW, in front of the kino camera: back-lit, long shadows falling towards the lower right (measured from the reference)   // warm key light, navy-blue shadows (as in the reference)   // warm evening: peach sun, lavender haze
    italia:   { fog: 0xa4a6d0, sun: 0xffb47c, sunI: 2.2, sky: 0x7090ea, gnd: 0x6e5a78, hemiI: 0.7, tint: [1.0, 0.96, 1.03], sat: 1.06, sunOff: [-100, 70, -58], clouds: 0.3 },   // Toskana: the forest's warm key light and navy shadows, a little less orange, the sun in the west-north-west (measured from the reference)
    kamp:     { fog: 0xa4a8d0, sun: 0xff9468, sunI: 1.33, sky: 0xc6ceff, gnd: 0x7a7338, hemiI: 1.0, tint: [1.0, 0.96, 1.03], sat: 1.06, sunOff: [-100, 80, 30], clouds: 0.35 },   // Gromski rt: sun in the west-south-west, a warm bright ambient: softer shadows, as in the reference
    monaco:   { fog: 0xcfe2f1, sun: 0xfff0d6, sunI: 1.08, sky: 0xd8ebff, gnd: 0x8a7c62, hemiI: 0.6, tint: [1.03, 1.0, 0.95], sat: 1.14, clouds: 0.3 },
    mountain: { fog: 0xb4cadf, sun: 0xfff2e0, sunI: 1.0, sky: 0xc8dcff, gnd: 0x4d5c33, hemiI: 0.6, tint: [0.98, 1.0, 1.03], sat: 1.12, clouds: 0.55 },
    ouni:     { fog: 0xc4d3dc, sun: 0xffe9c6, sunI: 1.18, sky: 0xcfe1f5, gnd: 0x4a5a2e, hemiI: 0.56, tint: [1.02, 1.0, 0.97], sat: 1.1, sunOff: [-88, 72, 58], clouds: 0.45 },   // Ouninpohja: a clear Finnish August afternoon, a warm sun lower in the west (the forest's long shadows across the road), soft haze over the lakes
    pikes:    { fog: 0xdfd0cc, sun: 0xffcc8f, sunI: 1.58, sky: 0x9fbbf1, gnd: 0x70604e, hemiI: 0.75, tint: [1.05, 1.0, 0.925], sat: 1.13, haze: 0.25, hazeCol: [1, 0.77, 0.48], sunOff: [104, 48, -60], clouds: 0.2 },   // early morning on race day: a low golden sun from the east-north-east (long shadows down the slopes, its warm glow at the edge of the view when it is ahead), cool blue shade from the clear sky, a light warm haze over the valleys
    nring:    { fog: 0xb7c7cc, sun: 0xfff0d8, sunI: 1.1, sky: 0xcadcf0, gnd: 0x3e4a2a, hemiI: 0.6, tint: [1.03, 1.0, 0.95], sat: 1.04, sunOff: [-80, 76, 70], clouds: 0.6 },   // the Eifel: a summer afternoon over the 'green hell' (a lower sun: longer shadows)
    spa:      { fog: 0xc3ced7, sun: 0xfff1de, sunI: 0.98, sky: 0xd0dde9, gnd: 0x43522f, hemiI: 0.64, tint: [0.99, 1.0, 1.01], sat: 1.1, clouds: 0.75 },   // the Ardennes: a little greyer, softer daylight (Spa's changeable weather)
    rbring:   { fog: 0xc6daea, sun: 0xfff1d8, sunI: 1.12, sky: 0xcfe3fb, gnd: 0x46602c, hemiI: 0.6, tint: [1.02, 1.0, 0.97], sat: 1.06, sunOff: [-86, 78, 52], clouds: 0.5 },   // Styria in early summer, an afternoon sun (longer shadows): clear alpine air, fresh meadows, dark spruce woods
    suzuka:   { fog: 0xc8d9e6, sun: 0xfff1dc, sunI: 1.06, sky: 0xd5e7fa, gnd: 0x4f5c34, hemiI: 0.62, tint: [1.01, 1.0, 0.99], sat: 1.12, clouds: 0.4 },   // Suzuka: a clear spring day in Mie
    holjes:   { fog: 0xc9d8e2, sun: 0xfff0da, sunI: 1.1, sky: 0xcfe0f4, gnd: 0x44552e, hemiI: 0.6, tint: [1.01, 1.0, 0.98], sat: 1.08, sunOff: [-91, 78, 42], north: true, clouds: 0.5, shadowR: 46 },   // Höljes: a clear northern summer afternoon, the sun low in the south-west over the forest (long shadows), cool clean air, fair-weather clouds; the chase view's shadows sharper
  };
  const _c1 = new THREE.Color(), _c2 = new THREE.Color();
  function applyTheme(id) {
    const t = THEMES[id] || THEMES.lake, r = Math.max(0, wet); themeId = id;
    sunOff = t.sunOff || [-80, 96, 70];   // low evening sun where the theme asks for it (long shadows)
    // rain: an overcast sky (grey haze, a weak sun, more light from the whole sky), a cooler, paler grade
    const mix = (hex, to, k) => _c1.setHex(hex).lerp(_c2.setHex(to), k * r);
    scene.fog.color.copy(mix(t.fog, 0x949ea7, 0.75)); renderer.setClearColor(scene.fog.color, 1);
    hemi.color.copy(mix(t.sky, 0xaab4bd, 0.7)); hemi.groundColor.copy(mix(t.gnd, 0x3a4032, 0.5)); hemi.intensity = t.hemiI * (1 + 0.3 * r);
    sun.color.copy(mix(t.sun, 0xe8eef4, 0.8)); sun.intensity = t.sunI * (1 - 0.62 * r);
    if (post) { post.mat.uniforms.uTint.value.set(t.tint[0] - 0.03 * r, t.tint[1], t.tint[2] + 0.03 * r); post.mat.uniforms.uSat.value = t.sat * (1 - 0.2 * r); post.haze = (t.haze || 0) * (1 - r); post.hk = 0; post.mat.uniforms.uHaze.value = 0; if (t.hazeCol) post.mat.uniforms.uHazeCol.value.set(t.hazeCol[0], t.hazeCol[1], t.hazeCol[2]); }
    if (stm.on) {   // a thunderstorm: the clouds darker still, less light (the flashes: stormStep)
      scene.fog.color.lerp(_c2.setHex(0x59606a), 0.5); renderer.setClearColor(scene.fog.color, 1); hemi.color.lerp(_c2.setHex(0x7d8794), 0.4); hemi.intensity *= 0.8; sun.intensity *= 0.6;
      if (post) { post.mat.uniforms.uSat.value *= 0.88; post.mat.uniforms.uTint.value.multiplyScalar(0.97); }
    }
    // the time of day and the season on top (setAtmos): dusk a low orange sun and warm haze; night a dark blue sky and a weak moon (the
    // floodlights and headlights do the rest); winter a paler, colder light
    const A = atmos, to = (c, hex, k) => c.lerp(_c2.setHex(hex), k);
    if (A.tod === 'dusk') {
      sunOff = [sunOff[0] * 1.6, 30, sunOff[2] * 1.6];
      to(scene.fog.color, 0xe9a47c, 0.45); renderer.setClearColor(scene.fog.color, 1); to(hemi.color, 0xffc29a, 0.35); hemi.intensity *= 0.75;
      to(sun.color, 0xff9a52, 0.65); sun.intensity *= 0.85;
      if (post) { post.mat.uniforms.uTint.value.set(1.08, 0.97, 0.88); post.mat.uniforms.uHaze.value = 0.32 * (1 - r); post.mat.uniforms.uHazeCol.value.set(1, 0.62, 0.35); }
    } else if (A.tod === 'dawn') {   // dawn: the sun just up on the other side of the sky, a cool pink light, the haze pale gold (the mist in the valleys: mistStep)
      sunOff = [-sunOff[0] * 1.5, 26, -sunOff[2] * 1.5];
      to(scene.fog.color, 0xf2cdb9, 0.65); renderer.setClearColor(scene.fog.color, 1); to(hemi.color, 0xc9c6ea, 0.35); hemi.intensity *= 0.82;
      to(sun.color, 0xffc79a, 0.65); sun.intensity *= 0.88;
      if (post) { post.mat.uniforms.uTint.value.set(1.05, 0.99, 0.96); post.mat.uniforms.uHaze.value = 0.3 * (1 - r); post.mat.uniforms.uHazeCol.value.set(1, 0.78, 0.6); }
    } else if (A.tod === 'night') {
      sunOff = [-40, 110, 60];
      scene.fog.color.setHex(0x070b16); renderer.setClearColor(scene.fog.color, 1); hemi.color.setHex(0x26324f); hemi.groundColor.setHex(0x06080b); hemi.intensity = 0.55;
      sun.color.setHex(0x93aaff); sun.intensity = 0.2 * (1 - 0.6 * r);
      if (post) { post.mat.uniforms.uTint.value.set(0.86, 0.93, 1.12); post.mat.uniforms.uSat.value *= 0.85; post.mat.uniforms.uHaze.value = 0; post.haze = 0; }   // (no sun glow at night, not even Pikes Peak's)
    }
    if (A.season === 'winter' && A.tod !== 'night') { to(scene.fog.color, 0xdfe6ee, 0.4); renderer.setClearColor(scene.fog.color, 1); to(sun.color, 0xeef3ff, 0.5); hemi.intensity *= 1.12; if (post) post.mat.uniforms.uSat.value *= 0.88; }
    if (A.season === 'autumn' && A.tod === 'day') { to(sun.color, 0xffd9a8, 0.3); if (post) post.mat.uniforms.uTint.value.set(1.04, 0.99, 0.93); }
    // a northern world (theme.north: Höljes, 61 degrees north): the white night of midsummer (the sun just under the northern horizon, the
    // sky pale all night, no floodlights), the winter sun low in the south all day (long, blue shadows, a pink light), and on a winter
    // night the aurora over the forest (the sky's curtains, their green glow on the snow: aurora(), World frame)
    aur.on = false;
    if (t.north && whiteNight()) {
      sunOff = [14, 9, -120];
      scene.fog.color.setHex(0xa9b3cb); scene.fog.color.lerp(_c2.setHex(0x949ea7), 0.6 * r); renderer.setClearColor(scene.fog.color, 1);
      hemi.color.setHex(0xb9c3de); hemi.groundColor.setHex(0x3b4035); hemi.intensity = 0.66; sun.color.setHex(0xffc39a); sun.intensity = 0.34 * (1 - 0.6 * r);
      if (post) { post.mat.uniforms.uTint.value.set(0.99, 0.97, 1.05); post.mat.uniforms.uSat.value = t.sat * 0.9; post.mat.uniforms.uHaze.value = 0.16 * (1 - r); post.mat.uniforms.uHazeCol.value.set(1, 0.7, 0.6); }
    } else if (t.north && A.season === 'winter' && A.tod === 'day') {
      sunOff = [-118, 24, 74]; to(sun.color, 0xffd6b4, 0.55); sun.intensity *= 0.92; to(hemi.color, 0xbcd0ec, 0.3);
    } else if (t.north && A.season === 'winter' && A.tod === 'night') {
      scene.fog.color.setHex(0x071321); renderer.setClearColor(scene.fog.color, 1); hemi.color.setHex(0x2c4a52); hemi.intensity = 0.62; sun.color.setHex(0x9fb8ff); sun.intensity = 0.24 * (1 - 0.6 * r);
      aur.on = r < 0.3; aur.base.copy(hemi.color);
    }
    const lit = A.tod === 'night' ? (whiteNight() ? 0.82 : 0.42) : A.tod === 'dusk' ? 0.84 : A.tod === 'dawn' ? 0.88 : 1;   // (the dust and the smoke as dark as the world round them)
    if (particles) particles.mat.uniforms.uLit.value = lit; World.smokeLit.value = lit;
    if (leaves) leaves.mat.uniforms.uLit.value = lit;
    // the sun's shafts through the trees (the post-processing, where the sky is drawn and the sun is in front: the low sun of dusk, of the
    // north's white night and winter; a little by day)
    if (post) post.rays = (A.tod === 'night' ? (t.north && whiteNight() ? 0.8 : 0) : A.tod === 'dusk' || A.tod === 'dawn' ? 1 : t.north && A.season === 'winter' ? 0.6 : t.haze ? 0.6 : 0.35) * (1 - r);
    if (post) { post.flare = (A.tod === 'night' ? (whiteNight() ? 0.5 : 0) : A.tod === 'dusk' || A.tod === 'dawn' ? 1 : 0.75) * (1 - r); post.mat.uniforms.uFlC.value.set(sun.color.r, sun.color.g * 0.95, sun.color.b * 0.85); }   // (the lens flare: none at night or in the rain)
    if (post) { const nt = A.tod === 'night' && !whiteNight(); post.bloom = (nt ? 1.25 : A.tod === 'dusk' || whiteNight() ? 0.85 : A.tod === 'dawn' ? 0.7 : A.season === 'winter' ? 0.2 : 0.4) * (1 + 0.2 * r); post.bThr = nt ? 0.76 : A.tod === 'dusk' ? 0.8 : A.tod === 'dawn' ? 0.84 : 0.9; }   // (bloom: by night the lamps, the fires and the screens glow; by day only what is very bright: the sun, glints; snow hardly)
    envDraw();   // (the cars' reflections: this sky)
  }
  // the aurora (a northern world's winter night): its curtains in the sky dome (the cockpit, the TV views), its green glow on the snow (the
  // sky light pulsing green and violet: every frame, from the colour applyTheme left)
  const aur = { on: false, base: new THREE.Color(), g: new THREE.Color(0x1f8a5a), v: new THREE.Color(0x5a3a8a) };
  const whiteNight = () => { const t = THEMES[themeId]; return !!(t && t.north) && atmos.tod === 'night' && atmos.season === 'summer'; };
  function aurora(t) {
    if (!aur.on) return;
    const a = 0.5 + 0.5 * Math.sin(t * 0.23) * Math.sin(t * 0.071 + 1.3), b = 0.5 + 0.5 * Math.sin(t * 0.17 + 2.1);
    hemi.color.copy(aur.base).lerp(aur.g, 0.25 + 0.3 * a).lerp(aur.v, 0.12 * b);
  }
  // the weather of the race on screen (race.rain 0..1): the sky and the streaks
  function applyWeather(r) {
    wet = r; applyTheme(themeId); rain.mesh.visible = r > 0 && atmos.season !== 'winter'; rain.mat.uniforms.uA.value = 0.5 * Math.min(1, r * 1.5);
    snow.mesh.visible = r > 0 && atmos.season === 'winter';
    birds.mesh.visible = !(r > 0); if (r > 0) birds.reset(birds.gull);   // (no birds in the rain)
    World.crowdRain(r, atmos.season === 'winter'); if (world && world.dyn.umb) for (const g of world.dyn.umb) g.visible = r > 0;   // (umbrellas up, raincoats on)
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
        if (!m.color || !maps.includes(m.map) || L.includes(m)) continue;
        if (!m.userData.dry) m.userData.dry = m.color.clone();
        L.push(m); } });
    }
    for (const m of world.wetMats) m.color.copy(m.userData.dry).multiplyScalar(1 - (m.map === tex.curb ? 0.22 : 0.36) * w);
    const W = world.dyn.wet, pud = W ? W.puddles : world.dyn.pud;   // (a gravel stage with a road of its own, Ouninpohja: its puddles show, the gravel darkens and glistens, the verges darken; Höljes: the puddles on its gravel)
    if (pud) { pud.visible = w > 0; const k = atmos.tod === 'night' ? (whiteNight() ? 0.75 : 0.22) : atmos.tod === 'dusk' ? 0.62 : atmos.tod === 'dawn' ? 0.78 : 1;   // (they mirror the sky: dark at night; frozen in winter)
      if (atmos.season === 'winter') pud.material.color.setRGB(1.12 * k, 1.18 * k, 1.28 * k); else pud.material.color.setScalar(k); }
    if (W) { W.road.color.setScalar((1 - 0.36 * w) * (atmos.season === 'winter' ? 0.86 : 1)); W.road.shininess = w > 0 ? 28 : W.base.sh; W.road.specular.setHex(w > 0 ? 0x3c3e40 : W.base.sp); W.ground.color.setScalar(1 - 0.2 * w); }
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
      if (base) m.color.copy(base.userData.dry || base.color);
      dryLn = new THREE.Mesh(g, m); dryLn.receiveShadow = true; dryLn.renderOrder = 1; dryLn.matrixAutoUpdate = false; scene.add(dryLn);
    }
    if (dryLn) { dryLn.visible = k > 0.01; dryLn.material.opacity = k; }
  }

  /* ---------------- the season and the time of day (setAtmos({ season: 'summer' | 'autumn' | 'winter', tod: 'day' | 'dusk' | 'night' | 'dawn' })):
     autumn turns the leaves and the grass yellow, orange and red; winter puts snow on the ground and the trees (the tarmac cleared, a gravel
     road packed with snow) and makes the rain fall as snow; dusk a low orange sun; dawn a low pink sun on the other side, the mist lying in the
     valleys and lifting, dew glinting in the grass; night a dark sky, floodlights along the track (pools of
     light on the road, lamps on poles) and the cars' headlights on the road ahead. The world's colours are changed from the ones it was
     built with (kept, so every change starts from them) ---------------- */
  let atmos = { season: 'summer', tod: 'day' }, snowTex = null, lampTex = null, beamTex = null, flood = null, snow = null;
  // whether leaves fly now: autumn on every track; Suzuka's cherry petals in spring (the summer setting: its race is in April); not in winter
  function leafSet() {
    if (!leaves) return;
    const T = curTrack, petal = atmos.season === 'summer' && !!(T && T.def && T.def.id === 'suzuka'), on = !!T && (atmos.season === 'autumn' || petal);
    if (on !== leafK.on || petal !== leafK.petal) leaves.clear();
    leafK.on = on; leafK.petal = petal; leafK.rate = petal ? 24 : 14; leaves.points.visible = on; leaves.mat.uniforms.uPetal.value = petal ? 1 : 0;
    const want = on && !petal;   // (the leaves fallen at the road's edges: autumn)
    if (want && !leafK.litter && world && T) leafK.litter = makeLitter(T);
    if (leafK.litter) leafK.litter.visible = want;
  }
  // the leaves fallen at the road's edges in autumn: flat patches of leaves between the road and the barriers (up to 3.5 m out), one
  // instanced mesh (made the first autumn on a track)
  let litterTex = null;
  function makeLitter(T) {
    if (!litterTex) { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d');
      for (let k = 0; k < 34; k++) { const c = LEAF_C[k % LEAF_C.length], px = 20 + Math.random() * 88, py = 20 + Math.random() * 88, L = 13 + Math.random() * 10;
        x.save(); x.translate(px, py); x.rotate(Math.random() * Math.PI); x.fillStyle = 'rgb(' + (c[0] * 255 | 0) + ',' + (c[1] * 255 | 0) + ',' + (c[2] * 255 | 0) + ')'; x.beginPath(); x.ellipse(0, 0, L, L * 0.42, 0, 0, Math.PI * 2); x.fill();
        x.strokeStyle = 'rgba(60,30,10,0.5)'; x.lineWidth = 1; x.beginPath(); x.moveTo(-L, 0); x.lineTo(L, 0); x.stroke(); x.restore(); }
      litterTex = new THREE.CanvasTexture(cv); }
    const N = T.N, step = Math.max(1, Math.round(2.5 / T.ds), Math.ceil(N * 1.6 / 6000)), list = [], G = world.groundH;   // (spread over the whole lap: on a long one sparser, ~6000 patches at most)
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {
      if (Math.random() > 0.8) continue;
      const bar = sd > 0 ? (T.br ? T.br[i] : T.w + 4) : (T.bl ? T.bl[i] : T.w + 4), e0 = T.w + 0.35, e1 = Math.min(bar - 0.5, T.w + 3.5); if (e1 - e0 < 0.4) continue;
      const lat = e0 + Math.random() * (e1 - e0), x = T.px[i] + T.nx[i] * sd * lat, z = T.pz[i] + T.nz[i] * sd * lat, yr = T.hy ? T.hy[i] : 0, gh = G ? G(x, z) : NaN;
      list.push([x, (Number.isFinite(gh) && gh > yr && gh - yr < 1.2 ? gh : yr) + 0.04, z, Math.random() * 6.283, 1.5 + Math.random() * 1.3]);   // (the road's height: the terrain under the verge's strips lies lower)
    }
    const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), mat = new THREE.MeshLambertMaterial({ map: litterTex, alphaTest: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length)), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    list.forEach(([x, y, z, a, s2], k) => { q.setFromAxisAngle(up, a); sc.set(s2, 1, s2); p.set(x, y, z); m4.compose(p, q, sc); mesh.setMatrixAt(k, m4); });
    mesh.count = list.length; mesh.receiveShadow = true; mesh.name = 'leafLitter'; mesh.frustumCulled = false; world.root.add(mesh);   // (one mesh along the whole lap: r128 would cull it by the plane's own sphere at the origin)
    return mesh;
  }
  /* ---------------- the race's marks on an asphalt road (Race.road, see Core roadGrip): the rubber laid along the racing line (two dark wheel
     tracks, darkest where the tyres scrub: in the bends and the braking before them) and the marbles off it in the corners, as dark as the
     race has laid them (road.mb); the standing water of heavy rain (Track.pools: each grows from its middle with Track.poolK, as the physics
     has it); the oil from crashes and the cement the marshals put on it; the sausage kerbs at the chicanes (Track.saus). Built with the world
     (roadMarks), drawn as the race is now (roadMarksStep) ---------------- */
  let rmk = null;
  const _rbk = { dy: 0, sl: 0 };
  function rmTex(kind) {
    const cv = document.createElement('canvas'), x = cv.getContext('2d'), R = (a, b) => a + Math.random() * (b - a);
    if (kind === 'rub') {   // across: two wheel tracks; along: streaks
      cv.width = 64; cv.height = 256;
      for (const c0 of [0.25, 0.75]) for (let k = 0; k < 90; k++) { const u = (c0 + R(-0.13, 0.13)) * 64, a = R(0.12, 0.4) * (1 - Math.abs(u / 64 - c0) / 0.16); x.fillStyle = 'rgba(8,8,9,' + Math.max(0, a).toFixed(3) + ')'; x.fillRect(u, R(-20, 256), R(1, 3), R(30, 140)); }
    } else if (kind === 'mb') {   // the marbles: little black balls of rubber
      cv.width = cv.height = 128;
      for (let k = 0; k < 420; k++) { const r = R(0.6, 2.2); x.fillStyle = 'rgba(10,10,10,' + R(0.55, 0.95).toFixed(2) + ')'; x.beginPath(); x.arc(R(0, 128), R(0, 128), r, 0, Math.PI * 2); x.fill(); }
    } else if (kind === 'oil') {   // a spot of oil: dark and glossy, a rainbow sheen at its edge
      cv.width = cv.height = 128;
      const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
      g.addColorStop(0, 'rgba(34,28,22,0.72)'); g.addColorStop(0.55, 'rgba(30,26,22,0.62)'); g.addColorStop(0.7, 'rgba(90,60,130,0.42)'); g.addColorStop(0.78, 'rgba(50,120,100,0.36)'); g.addColorStop(0.86, 'rgba(160,130,50,0.3)'); g.addColorStop(1, 'rgba(30,26,22,0)');
      x.fillStyle = g; x.beginPath(); for (let k = 0; k <= 24; k++) { const a = k / 24 * Math.PI * 2, r = 50 + 10 * Math.sin(a * 3 + 1) * Math.cos(a * 2); x.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } x.fill();
    } else {   // cement: pale grey powder, thicker in the middle, swept edges
      cv.width = cv.height = 128;
      for (let k = 0; k < 900; k++) { const a = Math.random() * Math.PI * 2, r = Math.pow(Math.random(), 0.7) * 60, c = R(200, 238) | 0; x.fillStyle = 'rgba(' + c + ',' + c + ',' + (c - 6) + ',' + R(0.25, 0.7).toFixed(2) + ')'; x.beginPath(); x.arc(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, R(1.5, 4), 0, Math.PI * 2); x.fill(); }
    }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  }
  function rmDrop() { if (!rmk) return; for (const m of rmk.meshes) { if (m.parent) m.parent.remove(m); m.geometry.dispose(); if (m.material.map) m.material.map.dispose(); m.material.dispose(); } rmk = null; }   // (the pictures too: made for each world)
  function roadMarks(T) {
    rmDrop();
    if (!T || T.open || !world) return;
    const N = T.N, ds = T.ds, w = T.w, meshes = [], Y = (i, o) => (T.hasElev && T.hy ? T.hy[i] : 0) + (T.bank ? T.bankAt(i * ds, o, _rbk).dy : 0), P = (i, o) => [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o];
    const ribbon = (rows, mat, name) => {   // rows: per sample [[off, alpha, u], ...] (null: none); quads between neighbouring rows of the same length
      const pos = [], col = [], uv = [], idx = []; let prev = -1, prevN = 0;
      for (let j = 0; j < rows.length; j++) {
        const r = rows[j]; if (!r) { prev = -1; continue; }
        const i = r.i, base = pos.length / 3;
        for (const [o, a, u] of r.v) { const [x, z] = P(i, o); pos.push(x, Y(i, o) + 0.028, z); col.push(1, 1, 1, a); uv.push(u, i * ds / r.L); }
        if (prev >= 0 && prevN === r.v.length && !r.cut) for (let v = 0; v < r.v.length - 1; v++) { const a = prev + v, c = base + v; idx.push(a, c, a + 1, a + 1, c, c + 1); }
        prev = base; prevN = r.v.length;
      }
      if (!idx.length) return null;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      const m = new THREE.Mesh(g, mat); m.name = name; m.receiveShadow = true; m.renderOrder = 1; m.matrixAutoUpdate = false; m.frustumCulled = false; scene.add(m); meshes.push(m); return m;
    };
    const decal = (map) => new THREE.MeshLambertMaterial({ map, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2, opacity: 0, side: THREE.DoubleSide });   // (only ever seen from above)
    let rub = null, mbm = null;
    if (T.mbI) {
      // the rubber: darker in the bends and in the 70 m of braking before each
      const ri = new Float32Array(N).fill(0.45);
      for (const c of T.corners) { const k = clamp(28 / Math.max(15, c.minR), 0.35, 1); for (let d = -35; d <= (((c.i1 - c.i0 + N) % N) + 3); d++) { const i = (c.i0 + d + N) % N, f = d < 0 ? 1 + d / 36 : 1; ri[i] = Math.max(ri[i], 0.45 + 0.55 * k * f); } }
      const st = N > 6000 ? 2 : 1, rows = [], rowsM = [];
      for (let j = 0; j <= Math.ceil(N / st); j++) {
        const i = (j * st) % N, rl = T.rl[i];
        rows.push(T.srf && T.srf[i] === 5 ? null : { i, L: 12, v: [[rl - 1.35, ri[i], 0], [rl + 1.35, ri[i], 1]] });
        const m = T.mbI[i], sd = m > 0 ? 1 : -1, am = Math.abs(m);
        if (am < 0.03) { rowsM.push(null); continue; }
        const cl = (u) => clamp(rl + sd * u, -w + 0.05, w - 0.05), us = [[1.4, 0], [2.2, am], [4.4, am], [5.4, 0]];
        rowsM.push({ i, L: 3, cut: j > 0 && Math.sign(T.mbI[((j - 1) * st) % N] || 0) !== sd, v: us.map(([u, a]) => { const o = cl(u); return [o, Math.abs(o - (rl + sd * u)) > 0.3 ? a * 0.3 : a, o / 3]; }) });
      }
      rub = ribbon(rows, decal(rmTex('rub')), 'rubberLine');
      mbm = ribbon(rowsM, decal(rmTex('mb')), 'marbles');
    }
    // the standing water: an ellipse per pool (its radial coordinate aR: the shader shows it out to poolK)
    let pools = null;
    if (T.pools && T.pools.length) {
      const pos = [], ar = [], idx = [], n = 22, PP = (s, d) => { const f = s / ds, i0 = Math.floor(f), t = f - i0, a = ((i0 % N) + N) % N, b = (a + 1) % N, nx = lerp(T.nx[a], T.nx[b], t), nz = lerp(T.nz[a], T.nz[b], t);
        return [lerp(T.px[a], T.px[b], t) + nx * d, lerp(Y(a, d), Y(b, d), t) + 0.035, lerp(T.pz[a], T.pz[b], t) + nz * d]; };
      for (const [s0, d0, hl, hw] of T.pools) {
        const c = pos.length / 3; pos.push(...PP(s0, d0)); ar.push(0);
        for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; pos.push(...PP(s0 + Math.cos(a) * hl, d0 + Math.sin(a) * hw)); ar.push(1); idx.push(c, c + 1 + k, c + 1 + (k + 1) % n); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aR', new THREE.Float32BufferAttribute(ar, 1)); g.setIndex(idx);
      const mat = new THREE.ShaderMaterial({ uniforms: { uK: { value: 0 }, uSky: { value: new THREE.Color(0.6, 0.65, 0.7) }, uT: { value: 0 }, uLit: { value: 1 } }, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -3, side: THREE.DoubleSide,
        vertexShader: 'attribute float aR; varying float vR; varying vec3 vW; void main(){ vR = aR; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: 'uniform float uK; uniform vec3 uSky; uniform float uT; uniform float uLit; varying float vR; varying vec3 vW;' +
          'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }' +
          'void main(){ if (vR > uK) discard; float e = smoothstep(uK, uK * 0.7, vR);' +
          ' vec2 c = floor(vW.xz * 1.6), f = fract(vW.xz * 1.6) - 0.5; float ph = fract(uT * 0.9 + h(c)), r = length(f - (vec2(h(c + 3.1), h(c + 7.7)) - 0.5) * 0.5);' +   // (rings from the rain drops)
          ' float ring = smoothstep(0.03, 0.0, abs(r - ph * 0.45)) * (1.0 - ph);' +
          ' vec3 V = normalize(cameraPosition - vW); float fr = pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0);' +   // (a mirror of the sky, the more the flatter the view)
          ' vec3 col = mix(vec3(0.03, 0.035, 0.04), uSky, 0.16 + 0.72 * fr) + ring * 0.14; gl_FragColor = vec4(col * uLit, e * 0.9); }' });
      pools = new THREE.Mesh(g, mat); pools.name = 'standingWater'; pools.renderOrder = 2; pools.frustumCulled = false; pools.visible = false; pools.matrixAutoUpdate = false; scene.add(pools); meshes.push(pools);
    }
    // the oil and the cement (instanced quads, as many as the race has spots)
    const spot = (map, name, gloss) => { const g = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2); g.setAttribute('color', new THREE.Float32BufferAttribute(new Array(12).fill(1), 3));
      const o = { map, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -4 };
      const m = new THREE.InstancedMesh(g, gloss ? new THREE.MeshPhongMaterial(Object.assign(o, { shininess: 60, specular: 0x2a2a2a })) : new THREE.MeshLambertMaterial(o), 32);
      m.count = 0; m.name = name; m.renderOrder = 2; m.frustumCulled = false; m.receiveShadow = true; scene.add(m); meshes.push(m); return m; };
    const oil = spot(rmTex('oil'), 'oil', true), cem = spot(rmTex('cem'), 'cement');   // (the oil glossy: it catches the light)
    // the sausage kerbs: a yellow hump (half an ellipse across, 0.6 m wide, 0.16 m high) in 1.2 m pieces, a black stripe on each
    let saus = null;
    if (T.saus) {
      const pos = [], col = [], idx = [], X = 7;
      for (const z of T.saus) {
        const n = ((z.i1 - z.i0 + N) % N), oc = z.side * (z.d0 + z.d1) / 2, hw = (z.d1 - z.d0) / 2;
        for (let k = 0; k <= n; k++) {
          const i = (z.i0 + k) % N, s = k * ds, seg = (s % 1.2) / 1.2, yel = seg < 0.75, cc = yel ? [0.98, 0.8, 0.08] : [0.08, 0.08, 0.08], base = pos.length / 3;
          for (let a = 0; a <= X; a++) { const t = a / X, ang = Math.PI * t, o = oc + Math.cos(ang) * hw * -z.side, y = Math.sin(ang) * 0.16, [x0, z0] = P(i, o); pos.push(x0, Y(i, o) + 0.02 + y, z0); col.push(cc[0] * (0.75 + 0.25 * Math.sin(ang)), cc[1] * (0.75 + 0.25 * Math.sin(ang)), cc[2]); }
          if (k > 0) for (let a = 0; a < X; a++) { const p = base - (X + 1) + a, q = base + a; idx.push(p, q, p + 1, p + 1, q, q + 1); }
        }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
      saus = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); saus.name = 'sausageKerbs'; saus.castShadow = true; saus.receiveShadow = true; saus.matrixAutoUpdate = false; scene.add(saus); meshes.push(saus);
    }
    rmk = { T, rub, mbm, pools, oil, cem, saus, meshes, n: -1 };
  }
  const _rmM = new THREE.Matrix4(), _rmQ = new THREE.Quaternion(), _rmS = new THREE.Vector3(), _rmP = new THREE.Vector3(), _rmU = new THREE.Vector3(0, 1, 0);
  function roadMarksStep() {
    if (!rmk) return;
    const R = curRace, T = rmk.T, RD = R && R.track === T ? R.road : null, wt = Math.max(0, wetW);
    const lit = atmos.tod === 'night' ? (whiteNight() ? 0.8 : 0.35) : atmos.tod === 'dusk' ? 0.75 : atmos.tod === 'dawn' ? 0.85 : 1;
    if (rmk.rub) { rmk.rub.material.opacity = (0.32 + 0.4 * (RD ? RD.mb : 0)) * (1 - 0.55 * wt); rmk.rub.visible = rmk.rub.material.opacity > 0.01; }
    if (rmk.mbm) { rmk.mbm.material.opacity = RD ? RD.mb * 0.9 : 0; rmk.mbm.visible = rmk.mbm.material.opacity > 0.01; }
    if (rmk.pools) { const k = T.poolK || 0, U = rmk.pools.material.uniforms; rmk.pools.visible = k > 0.01; U.uK.value = k; U.uT.value = time % 1000; U.uSky.value.copy(scene.fog.color); U.uLit.value = lit; }
    const L = RD ? RD.oil : [], key = L.length * 100 + L.filter(o => o.cem).length;
    if (key !== rmk.n) {   // (a spot added, or covered)
      rmk.n = key; let no = 0, nc = 0;
      for (const o of L) {
        const i = T.idx(o.s), M = o.cem ? rmk.cem : rmk.oil, k = o.cem ? nc++ : no++;
        _rmP.set(o.x, (T.hasElev && T.hy ? T.hy[i] : 0) + 0.04, o.z); _rmQ.setFromAxisAngle(_rmU, (o.s * 7.3) % 6.283); _rmS.set(o.r * 2.3, 1, o.r * (o.cem ? 2.5 : 2.1)); _rmM.compose(_rmP, _rmQ, _rmS); M.setMatrixAt(k, _rmM);
      }
      rmk.oil.count = no; rmk.cem.count = nc; rmk.oil.visible = no > 0; rmk.cem.visible = nc > 0; rmk.oil.instanceMatrix.needsUpdate = rmk.cem.instanceMatrix.needsUpdate = true;
    }
  }
  function setAtmos(a) {
    const n = { season: ['autumn', 'winter'].includes(a && a.season) ? a.season : 'summer', tod: ['dusk', 'night', 'dawn'].includes(a && a.tod) ? a.tod : 'day' };
    if (n.season === atmos.season && n.tod === atmos.tod) return;
    atmos = n; applyTheme(themeId); seasonWorld(); floodlights(); todWorld(); for (const v of views) { beams(v); carGlow(v); }
    leafSet();
    if (wet > 0 && rain) applyWeather(wet);   // (rain or snow: the season changed while it falls)
    wetW = -1;   // (the wet road again: the puddles mirror the sky of this time of day)
  }
  // a world's own lights and air for the time of day (world.dyn.tod: Höljes' campfires, string lights, mist, the screens' glow, the
  // cameras flashing in the crowd)
  function todWorld() { if (world && world.dyn && world.dyn.tod) world.dyn.tod(atmos.tod, atmos.season, whiteNight()); }
  function carGlow(v) { const m = v.body && v.body.material; if (m && m.emissive) m.emissive.setScalar(atmos.tod === 'night' ? 0.16 : 0); }   // (at night the cars stay in sight under the floodlights)
  const _hsl = { h: 0, s: 0, l: 0 }, _sc = new THREE.Color();
  const hash3 = (a) => { const x = Math.sin(a * 91.37 + 17.1) * 43758.5453; return x - Math.floor(x); };
  // a colour of the world in the season: plants (greens) and soil (browns) change, the rest stays. ground: a surface facing up (grass,
  // fields: straw in autumn, deep snow in winter), else leaves (autumn colours, some still green; in winter a little snow on them); seed: to vary the leaves
  function seasonCol(c, seed, out, ground) {
    out.copy(c); if (atmos.season === 'summer') return out;
    c.getHSL(_hsl); const { h, s, l } = _hsl, plant = h > 0.14 && h < 0.47 && s > 0.1 && l > 0.04, soil = h > 0.04 && h <= 0.14 && s > 0.12 && l > 0.08 && l < 0.7;
    if (atmos.season === 'autumn') {
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
    if (!world || !world.root || world.seasonKey === atmos.season) return;
    if (!world.seasonKey && atmos.season === 'summer') { world.seasonKey = 'summer'; return; }   // (a new world in summer: as built)
    world.seasonKey = atmos.season;
    const roads = new Set([tex.asphalt, tex.curb, tex.paving].filter(Boolean)), mats = new Set(), cols = new Map(), inst = new Set();   // (colour attributes: some are shared by several meshes, each is changed once)
    world.root.traverse(o => { for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) mats.add(m); const g = o.geometry; if (g && g.attributes && g.attributes.color && !cols.has(g.attributes.color)) cols.set(g.attributes.color, g.attributes.normal || null); if (o.isInstancedMesh && o.instanceColor) inst.add(o.instanceColor); });
    let n = 0;
    for (const m of mats) {
      if (!m.color || roads.has(m.map)) continue;
      const U = m.userData; if (!U.c0) { U.c0 = m.color.clone(); U.map0 = m.map || null; if (U.dry) U.dry0 = U.dry.clone(); }
      const tone = texTone(U.map0), grassy = tone && tone[1] > tone[0] * 1.08 && tone[1] > tone[2] * 1.2, gravel = U.map0 && (U.map0 === tex.makadam || (world.dyn.wet && m === world.dyn.wet.road));
      if (atmos.season === 'winter' && (grassy || gravel)) {   // (grass under snow; a gravel road packed with snow)
        if (!U.snowMap) U.snowMap = snowTexture(U.map0);
        m.map = U.snowMap; m.color.copy(gravel ? _sc.setRGB(0.86, 0.87, 0.9) : _sc.setRGB(1, 1, 1));
      } else {
        if (m.map !== U.map0) m.map = U.map0;
        seasonCol(U.c0, n++, m.color, grassy);
        if (atmos.season === 'autumn' && grassy) m.color.multiply(_sc.setRGB(1.18, 0.92, 0.62));   // (a green grass picture: drier, browner)
      }
      if (U.dry) U.dry.copy(m.color);   // (the wet road darkens from this colour)
      m.needsUpdate = true;
    }
    for (const [a, nrm] of cols) {
      if (a.ownSeason) continue;   // (the world colours it itself: world.dyn.season below)
      if (!colOrig.has(a)) colOrig.set(a, a.array.slice());
      const src = colOrig.get(a), dst = a.array, is = a.itemSize, N = nrm ? nrm.array : null;
      if (a.evergreen && atmos.season === 'autumn') { dst.set(src); a.needsUpdate = true; continue; }   // (spruce and pine: green all year)
      for (let i = 0, v = 0; i < src.length; i += is, v++) { _c1.setRGB(src[i], src[i + 1], src[i + 2]); seasonCol(_c1, v * 0.37, _c2, !!N && N[v * 3 + 1] > 0.8); dst[i] = _c2.r; dst[i + 1] = _c2.g; dst[i + 2] = _c2.b; }   // (facing up: ground)
      a.needsUpdate = true;
    }
    for (const a of inst) {
      if (!colOrig.has(a)) colOrig.set(a, a.array.slice());
      const src = colOrig.get(a), dst = a.array;
      for (let i = 0; i < src.length; i += 3) { _c1.setRGB(src[i], src[i + 1], src[i + 2]); seasonCol(_c1, i * 0.53, _c2, false); dst[i] = _c2.r; dst[i + 1] = _c2.g; dst[i + 2] = _c2.b; }
      a.needsUpdate = true;
    }
    if (world.dyn.season) world.dyn.season(atmos.season);   // (a world's own: Höljes' ground under snow, its snowbanks)
    wetW = -1;   // (the road's wet colour again)
  }
  function radialTex(inner, soft) {   // a soft round spot (floodlight pools, lamp heads)
    const S = 64, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(inner, 'rgba(255,255,255,' + soft + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, S, S);
    return new THREE.CanvasTexture(c);
  }
  // night: floodlights on poles along the track (every 30 m, alternating sides), each a pool of warm light on the road
  function floodlights() {
    if (flood) { for (const m of [flood.pools, flood.poles, flood.heads, flood.halos, flood.cones]) { scene.remove(m); m.geometry.dispose(); if (m === flood.halos || m === flood.cones || m === flood.pools) m.material.dispose(); } flood = null; }
    const T = curTrack; if (atmos.tod !== 'night' || !T || !world || whiteNight()) return;   // (a white night: light enough)
    if (!lampTex) lampTex = radialTex(0.35, 0.55);
    const L = T.len, n = Math.floor(L / 30), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    const PG = [], PU = [], PI = [], PC = [], bk = { dy: 0, sl: 0 }, GP = 6;   // the pools of light: a grid under each lamp following the road (a flat square was cut off where the road climbs)
    const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.12, 9, 5).translate(0, 4.5, 0), new THREE.MeshLambertMaterial({ color: 0x3a3d42 }), n);
    const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.3, 0.5), new THREE.MeshBasicMaterial({ color: 0xfff1cf }), n);
    const HP = [];   // (where each lamp's light falls on the road, and how high the lamp is: its reflection in the wet road, wetRefl)
    for (let k = 0; k < n; k++) {
      const s = k * 30 + 10, i = T.idx(s), sd = k % 2 ? 1 : -1, y = T.hasElev && T.hy ? T.hy[i] : 0, e = sd > 0 ? (T.br ? T.br[i] : T.w) : (T.bl ? T.bl[i] : T.w), d = sd * (Math.max(T.w, Math.min(e, T.w + 6)) + 1.2);
      p.set(T.px[i] + T.nx[i] * sd * T.w * 0.35, y + 0.07, T.pz[i] + T.nz[i] * sd * T.w * 0.35); PC.push(p.x, p.y, p.z);
      { const S = T.w * 3.2, lat0 = sd * T.w * 0.35, b0 = PG.length / 3;
        for (let a = 0; a <= GP; a++) for (let b = 0; b <= GP; b++) { const j = T.idx(s + (a / GP - 0.5) * S), o = lat0 + (b / GP - 0.5) * S; let h = (T.hasElev && T.hy ? T.hy[j] : 0) + 0.07; if (T.bank) h += T.bankAt(j * T.ds, o, bk).dy;
          PG.push(T.px[j] + T.nx[j] * o, h, T.pz[j] + T.nz[j] * o); PU.push(a / GP, b / GP); }
        for (let a = 0; a < GP; a++) for (let b = 0; b < GP; b++) { const q0 = b0 + a * (GP + 1) + b; PI.push(q0, q0 + 1, q0 + GP + 2, q0, q0 + GP + 2, q0 + GP + 1); } }
      if (!(T.srf && T.srf[i] === 5)) HP.push(p.x, y, p.z, 9);   // (not on gravel)
      p.set(T.px[i] + T.nx[i] * d, y, T.pz[i] + T.nz[i] * d); sc.set(1, 1, 1); m4.compose(p, q, sc); poles.setMatrixAt(k, m4);
      p.y += 9; q.setFromAxisAngle(up, -Math.atan2(T.nz[i], T.nx[i])); m4.compose(p, q, sc); heads.setMatrixAt(k, m4);
    }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(PG, 3)); pg.setAttribute('uv', new THREE.Float32BufferAttribute(PU, 2)); pg.setIndex(PI); pg.computeBoundingSphere();
    const pools = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ map: lampTex, color: 0xffe2b0, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    pools.renderOrder = 1; pools.matrixAutoUpdate = false; pools.name = 'floodPools'; pools.userData.n = n; poles.frustumCulled = false; heads.frustumCulled = false;   // (n: how many lamps; the tests)
    // the lamps' halos (in the damp night air) and their cones of light down onto the road, dust drifting in them
    const HL = [], CP = [], CV = [], CN = [], CI = [], NS = 10, _h = new THREE.Vector3(), _b = new THREE.Vector3(), _a = new THREE.Vector3(), _u = new THREE.Vector3(), _w = new THREE.Vector3();
    for (let k = 0; k < n; k++) {
      heads.getMatrixAt(k, m4); _h.setFromMatrixPosition(m4); _b.set(PC[k * 3], PC[k * 3 + 1], PC[k * 3 + 2]);
      HL.push([_h.x, _h.y - 0.1, _h.z, 3.2, 1, 0.88, 0.66, 0.5, 0, 0]);
      const A = [_h.x, _h.y - 0.2, _h.z], ax = _a.set(_b.x - A[0], _b.y - A[1], _b.z - A[2]), L = ax.length(), R = T.w * 1.25; ax.normalize();
      _u.set(0, 1, 0).cross(ax).normalize(); _w.copy(ax).cross(_u).normalize();
      for (let q = 0; q <= NS; q++) { const an = q / NS * Math.PI * 2, cs = Math.cos(an), sn = Math.sin(an), nx = _u.x * cs + _w.x * sn, ny = _u.y * cs + _w.y * sn, nz = _u.z * cs + _w.z * sn, b0 = CP.length / 3;
        CP.push(A[0] + nx * 0.25, A[1] + ny * 0.25, A[2] + nz * 0.25, A[0] + ax.x * L + nx * R, A[1] + ax.y * L + ny * R, A[2] + ax.z * L + nz * R); CV.push(0, 1); CN.push(nx, ny, nz, nx, ny, nz);
        if (q < NS) CI.push(b0, b0 + 1, b0 + 3, b0, b0 + 3, b0 + 2); }
    }
    const halos = World.glowQuads(HL, null);
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(CP, 3)); cg.setAttribute('normal', new THREE.Float32BufferAttribute(CN, 3)); cg.setAttribute('aV', new THREE.Float32BufferAttribute(CV, 1)); cg.setIndex(CI); cg.computeBoundingSphere();
    const cones = new THREE.Mesh(cg, new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uA: { value: 0.3 } }]), transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      vertexShader: ['attribute float aV;', 'varying float vV;', 'varying vec3 vN;', 'varying vec3 vP;', 'varying vec3 vW;', '#include <fog_pars_vertex>',
        'void main() { vV = aV; vN = normalize(normalMatrix * normal); vW = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); vP = mvPosition.xyz; gl_Position = projectionMatrix * mvPosition;', '  #include <fog_vertex>', '}'].join('\n'),
      fragmentShader: ['uniform float uA;', 'varying float vV;', 'varying vec3 vN;', 'varying vec3 vP;', 'varying vec3 vW;', '#include <fog_pars_fragment>',
        'void main() { float e = abs(dot(normalize(vN), normalize(-vP))), d = 0.7 + 0.3 * sin(vW.x * 1.7 + vW.y * 2.3) * sin(vW.z * 1.9 - vW.y * 1.3);',   // (soft edges; motes of dust)
        '  float a = uA * e * e * (1.0 - 0.7 * vV) * smoothstep(0.0, 0.1, vV) * d, up = abs(dot(normalize(vP), normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz)));',
        '  a *= 1.0 - 0.8 * up * up;',   // (seen from above, as the game's cameras do, the beams are faint: they show against the night sky)
        '  #ifdef USE_FOG', '  a *= 1.0 - smoothstep(fogNear, fogFar, fogDepth);', '  #endif',
        '  gl_FragColor = vec4(1.0, 0.9, 0.72, a); }'].join('\n') }));
    cones.renderOrder = 6; cones.matrixAutoUpdate = false;
    scene.add(pools); scene.add(poles); scene.add(heads); scene.add(halos); scene.add(cones); flood = { pools, poles, heads, halos, cones, hp: new Float32Array(HP) };
  }
  // dusk and night: the headlights' beam on the road ahead of a car (a soft fan, additive)
  function beams(v) {
    const on = atmos.tod !== 'day';
    if (!on) { if (v.beam) v.beam.visible = false; return; }
    if (!v.beam) {
      if (!beamTex) { const W = 64, H = 128, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data;
        for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const u = (i + 0.5) / W - 0.5, t = j / H, w = 0.12 + 0.38 * t, a = Math.max(0, 1 - Math.abs(u) / w) * Math.min(1, t * 6) * (1 - t) ** 1.2, o = (j * W + i) * 4; d[o] = d[o + 1] = d[o + 2] = 255; d[o + 3] = Math.round(255 * Math.min(1, a * 1.4)); }
        g.putImageData(img, 0, 0); beamTex = new THREE.CanvasTexture(c); }
      const M = v.car.m, g = new THREE.PlaneGeometry(9, 22); g.rotateX(-Math.PI / 2); g.rotateY(-Math.PI / 2); g.translate(M.len * 0.5 + 10.5, 0.08, 0);
      v.beam = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: beamTex, color: 0xfff0d0, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      v.beam.renderOrder = 1; v.grp.add(v.beam);
    }
    v.beam.visible = true; v.beam.material.opacity = atmos.tod === 'night' ? 0.55 : atmos.tod === 'dawn' ? 0.12 : 0.22;
  }
  // the wet road (race.water): the lights mirrored in it, long streaks down the road towards the camera, brightest where the mirror image
  // is, broken up by the rain's ripples: the floodlights at night, the cars' headlights at dusk and night, their tail lights (by day only
  // when they brake). One instanced mesh, additive; not on gravel or grass, only near the camera
  let wrc = null;
  const WR_N = 96, _wq = new THREE.Matrix4();
  function wrMake() {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 0, 1, -0.5, 0, 1], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); g.setIndex([0, 2, 1, 0, 3, 2]);
    const aC = new THREE.InstancedBufferAttribute(new Float32Array(WR_N * 4), 4); aC.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aC', aC);
    const mat = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uA: { value: 1 }, uT: { value: 0 } }]), transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
      vertexShader: ['attribute vec4 aC;', 'varying vec4 vC;', 'varying vec2 vUv;', 'varying vec3 vW;', '#include <fog_pars_vertex>',
        'void main() { vC = aC; vUv = uv; vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;', '  #include <fog_vertex>', '}'].join('\n'),
      fragmentShader: ['uniform float uA;', 'uniform float uT;', 'varying vec4 vC;', 'varying vec2 vUv;', 'varying vec3 vW;', '#include <fog_pars_fragment>',
        'void main() { float x = (vUv.x - 0.5) * 2.0, v = vUv.y, pk = vC.a, al = v < pk ? smoothstep(0.0, pk, v) : 1.0 - smoothstep(pk, 1.0, v);',
        '  float rip = 0.74 + 0.26 * sin(vW.x * 3.1 + vW.z * 2.3 + uT * 1.3) * sin(vW.z * 4.7 - vW.x * 1.9 - uT * 2.1) + 0.14 * sin(vW.x * 7.3 - vW.z * 5.9 + uT * 3.1);',   // (the rain's ripples)
        '  float a = uA * al * al * exp(-x * x * 3.5) * rip;',
        '  #ifdef USE_FOG', '  a *= 1.0 - smoothstep(fogNear, fogFar, fogDepth);', '  #endif',
        '  gl_FragColor = vec4(vC.rgb, a); }'].join('\n') });
    const mesh = new THREE.InstancedMesh(g, mat, WR_N); mesh.count = 0; mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh); wrc = { mesh, aC, n: 0 };
  }
  // one streak: from the point under the light (x, y, z: on the road) towards the camera; w wide, as long as the light is high (h), peaking at
  // the mirror point; colour r, g, b (times its strength)
  function wrAdd(x, y, z, h, w, r, g, b) {
    if (wrc.n >= WR_N) return;
    const cx = camera.position.x - x, cz = camera.position.z - z, D = Math.hypot(cx, cz); if (D < 1.5 || D > 140) return;
    const ax = cx / D, az = cz / D, H = Math.max(0.5, camera.position.y - y), m = D * h / (h + H), L = Math.min(D * 0.92, Math.max(2.2, m * 2.2 + h * 0.8)), s0 = Math.min(0.6, h * 0.1);
    _wq.set(az * w, 0, ax * L, x + ax * s0, 0, 1, 0, y + 0.03, -ax * w, 0, az * L, z + az * s0, 0, 0, 0, 1);
    wrc.mesh.setMatrixAt(wrc.n, _wq); wrc.aC.setXYZW(wrc.n, r, g, b, clamp(m / L, 0.12, 0.8)); wrc.n++;
  }
  function wetRefl() {
    const on = wetW > 0.15 && curRace && world; if (!on) { if (wrc) wrc.mesh.visible = false; return; }
    if (!wrc) wrMake();
    wrc.n = 0; wrc.mesh.visible = true; wrc.mesh.material.uniforms.uT.value = time % 1000; wrc.mesh.material.uniforms.uA.value = Math.min(1, (wetW - 0.15) * 1.6);
    const night = atmos.tod === 'night' && !whiteNight(), dim = atmos.tod !== 'day';
    for (const v of views) {
      const c = v.car; let hard = 0; for (let q = 0; q < 4; q++) { const sf = c.ws[q]; if (sf === 0 || sf === 1 || sf === 4) hard++; } if (hard < 2) continue;   // (on asphalt, a kerb, paving)
      if (Math.abs(camera.position.x - c.x) > 90 || Math.abs(camera.position.z - c.z) > 90) continue;
      const y = c.roadY != null ? c.roadY : (c.y || 0);
      for (let k = 0; k < 4; k++) {
        if (v.lightBroken && v.lightBroken[k]) continue;
        const head = k < 2; if (v.noHead && head) continue;
        const kk = head ? (night ? 0.55 : dim ? 0.3 : 0) : (v.brk ? 1.0 : night ? 0.35 : dim ? 0.2 : 0); if (kk <= 0) continue;
        _lv.copy(v.lights[k]).applyMatrix4(v.grp.matrixWorld);
        if (head) wrAdd(_lv.x, y, _lv.z, Math.max(0.3, _lv.y - y), 0.42, 1.0 * kk, 0.93 * kk, 0.78 * kk); else wrAdd(_lv.x, y, _lv.z, Math.max(0.3, _lv.y - y), 0.36, 1.0 * kk, 0.1 * kk, 0.05 * kk);
      }
    }
    if (flood && flood.hp) { const P = flood.hp, cx = camera.position.x, cz = camera.position.z;   // (the floodlights: the nearest first is not needed, the list is short near the camera)
      for (let k = 0; k < P.length; k += 4) { if (Math.abs(P[k] - cx) > 120 || Math.abs(P[k + 2] - cz) > 120) continue; wrAdd(P[k], P[k + 1], P[k + 2], P[k + 3], 1.5, 0.8, 0.7, 0.52); } }
    wrc.mesh.count = wrc.n; wrc.mesh.instanceMatrix.needsUpdate = true; wrc.aC.needsUpdate = true;
  }
  // dusk and night: the headlights' beams in the air ahead of each car (one instanced mesh for the field: a flat cone, wide and low, dipping
  // to the road 24 m ahead; additive, soft at its edges, motes drifting in it). Faint in clear air, strong in the dust off the gravel, in the
  // rain and in a snowfall (aI: each car's own, from its lamps, its dust and the weather; the car the cockpit sits in: less)
  let hlc = null;
  const _hm = new THREE.Matrix4(), _hm2 = new THREE.Matrix4(), HL_N = 16;
  function hlMake() {
    const NS = 14, P = [], N = [], V = [], I = [];
    const ring = (d, rz, ry, yc, v) => { for (let q = 0; q <= NS; q++) { const a = q / NS * Math.PI * 2, cs = Math.cos(a), sn = Math.sin(a), nl = Math.hypot(cs / rz, sn / ry); P.push(d, yc + sn * ry, cs * rz); N.push(0, sn / ry / nl, cs / rz / nl); V.push(v); } };
    ring(0.15, 0.62, 0.1, 0, 0); ring(24, 7.5, 2.4, -0.62, 1);
    for (let q = 0; q < NS; q++) I.push(q, q + 1, NS + 2 + q, q, NS + 2 + q, NS + 1 + q);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aV', new THREE.Float32BufferAttribute(V, 1)); g.setIndex(I);
    const aI = new THREE.InstancedBufferAttribute(new Float32Array(HL_N), 1); aI.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aI', aI);
    const mat = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uA: { value: 0.3 }, uT: { value: 0 } }]), transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      vertexShader: ['attribute float aV;', 'attribute float aI;', 'varying float vV;', 'varying float vI;', 'varying vec3 vN;', 'varying vec3 vP;', 'varying vec3 vW;', '#include <fog_pars_vertex>',
        'void main() { vV = aV; vI = aI; vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0); vW = wp.xyz;',
        '  vN = normalize((viewMatrix * modelMatrix * instanceMatrix * vec4(normal, 0.0)).xyz); vec4 mvPosition = viewMatrix * wp; vP = mvPosition.xyz; gl_Position = projectionMatrix * mvPosition;', '  #include <fog_vertex>', '}'].join('\n'),
      fragmentShader: ['uniform float uA;', 'uniform float uT;', 'varying float vV;', 'varying float vI;', 'varying vec3 vN;', 'varying vec3 vP;', 'varying vec3 vW;', '#include <fog_pars_fragment>',
        'void main() { float e = abs(dot(normalize(vN), normalize(-vP))), d = 0.65 + 0.35 * sin(vW.x * 1.3 + uT * 0.7 + vW.y * 2.1) * sin(vW.z * 1.1 - uT * 0.5);',   // (soft edges; motes drifting)
        '  float a = uA * vI * e * e * pow(1.0 - vV, 1.6) * smoothstep(0.0, 0.06, vV) * d, up = abs(dot(normalize(vP), normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz)));',
        '  a *= 1.0 - 0.65 * up * up;',   // (from above: fainter)
        '  #ifdef USE_FOG', '  a *= 1.0 - smoothstep(fogNear, fogFar, fogDepth);', '  #endif',
        '  gl_FragColor = vec4(1.0, 0.94, 0.8, a); }'].join('\n') });
    const mesh = new THREE.InstancedMesh(g, mat, HL_N); mesh.count = 0; mesh.frustumCulled = false; mesh.renderOrder = 6; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh); hlc = { mesh, aI, n: 0 };
  }
  function hlBegin() {   // -> how strong the beams are at this time of day (0: by day, none drawn)
    const k = atmos.tod === 'night' ? (whiteNight() ? 0.35 : 1) : atmos.tod === 'dusk' ? 0.5 : atmos.tod === 'dawn' ? 0.3 : 0;
    if (!k) { if (hlc) hlc.mesh.visible = false; return 0; }
    if (!hlc) hlMake();
    hlc.n = 0; hlc.mesh.visible = true; hlc.mesh.material.uniforms.uT.value = time % 1000; return k;
  }
  function hlAdd(v, c, dt, k) {
    v.hlI = 0; if (v.noHead || hlc.n >= HL_N) return;
    let loose = 0; for (let q = 0; q < 4; q++) { const sf = c.ws[q]; if (sf === 2 || sf === 3 || sf === 5 || sf === 6) loose++; }
    const dT = loose >= 2 && c.speed > 6 && !c.air ? 1 : 0, d0 = v.hlD || 0; v.hlD = d0 + (dT - d0) * Math.min(1, dt * (dT > d0 ? 1.5 : 0.35));   // (the dust hangs on a while)
    const lb = v.lightBroken ? (v.lightBroken[0] ? 0.5 : 0) + (v.lightBroken[1] ? 0.5 : 0) : 0; if (lb >= 1) return;
    const I = k * (0.22 + 0.85 * v.hlD + 0.75 * Math.max(0, wet)) * (1 - lb), L0 = v.lights[0], L1 = v.lights[1]; v.hlI = I;
    if (c === ck.car) return;   // (the cockpit's own car: no cone round the driver's eyes; the rain, the snow and the dust light up in its beam, HLB)
    _hm.makeTranslation((L0.x + L1.x) / 2 - 0.25, (L0.y + L1.y) / 2, 0); _hm2.multiplyMatrices(v.grp.matrixWorld, _hm);
    hlc.mesh.setMatrixAt(hlc.n, _hm2); hlc.aI.array[hlc.n] = Math.min(1.6, I); hlc.n++;
  }
  function hlEnd() { if (!hlc || !hlc.mesh.visible) return; hlc.mesh.count = hlc.n; hlc.mesh.instanceMatrix.needsUpdate = true; hlc.aI.needsUpdate = true; }
  // winter: snowflakes instead of the rain's streaks (a box of flakes around the view centre, drifting down)
  class Snow {
    constructor(n) {
      const P = new Float32Array(n * 3); for (let i = 0; i < n * 3; i++) P[i] = Math.random();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3));
      this.mat = new THREE.ShaderMaterial({
        uniforms: { uT: { value: 0 }, uC: { value: new THREE.Vector3() }, uBox: { value: new THREE.Vector3(80, 36, 80) }, uA: { value: 0.9 }, uScale: { value: 400 }, uLit: { value: 1 }, uO: { value: new THREE.Vector3() }, uHB: HLB.uHB, uHD: HLB.uHD },
        vertexShader: ['uniform float uT; uniform vec3 uC; uniform vec3 uBox; uniform float uScale; uniform vec3 uO; varying float vA; varying float vB;', HB_GLSL,
          'void main(){',
          '  vec3 v = vec3(0.7 + 0.8 * sin(position.x * 40.0 + uT * 0.6), -1.7, 0.5 + 0.7 * cos(position.z * 37.0 + uT * 0.5));',
          '  vec3 o = uC - 0.5 * uBox, p = o + mod(position * uBox + v * uT + uO - o, uBox);',   // (uO: the gale's drift, integrated)
          '  vec3 d = abs(p - uC) / (0.5 * uBox); vA = (1.0 - smoothstep(0.55, 1.0, max(d.x, d.z))) * (1.0 - smoothstep(0.6, 1.0, d.y)); vB = min(1.0, hbeam(p));',
          '  vec4 mv = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(uScale * 0.09 / -mv.z, 1.0, 9.0);',
          '}'].join('\n'),
        fragmentShader: 'uniform float uA; uniform float uLit; varying float vA; varying float vB; void main(){ vec2 q = gl_PointCoord - 0.5; float r = dot(q, q); if (r > 0.25) discard; gl_FragColor = vec4(vec3(0.96, 0.97, 1.0) * mix(0.5 + 0.5 * uLit, 1.2, vB), min(1.0, uA * vA * (1.0 - r * 3.2) * (1.0 + 1.5 * vB))); }',   // (at night dimmer, bright in the beam)
        transparent: true, depthWrite: false,
      });
      this.mesh = new THREE.Points(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 8; this.mesh.visible = false;
    }
  }

  /* ---------------- the drops on a TV camera's lens in the rain (lensStep: the TV and kino views, the intro's, the podium's shots; not the
     photo mode, not from the cockpit, not the chase cameras): two layers of cells across the screen, a drop in some of them (as many as uDrop
     says, 0..1), each landing, staying a while and drying off in its own rhythm (14 s); another pattern after every cut (uDSd). In the snow,
     flakes melting on the glass. High quality: in the post pass, each drop a lens showing the picture behind it blurred and turned round; else
     drawn over the picture (lensDraw) ---------------- */
  const LENS_U = { uDrop: { value: 0 }, uDT: { value: 0 }, uDSd: { value: 0 }, uDSnow: { value: 0 }, uDAs: { value: new THREE.Vector2(1, 1) } };
  const lens = { k: 0, sd: 0, p: new THREE.Vector3(1e9, 0, 0), sc: null, cam: null, mat: null };
  // dropAt(uv): the thickest drop at a point of the screen: its normal across the drop (xy, -1..1) and its thickness (z; 0 outside any)
  const DROP_GLSL = [
    'uniform float uDrop; uniform float uDT; uniform float uDSd; uniform float uDSnow; uniform vec2 uDAs;',
    'float dH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + uDSd * 17.13) * 43758.5453); }',
    'vec3 dropAt(vec2 uv) { vec3 best = vec3(0.0);',
    '  for (int L = 0; L < 2; L++) { float S = L == 0 ? 6.0 : 11.0; vec2 p = uv * uDAs * S, c = floor(p); float h = dH(c + float(L) * 31.7);',
    '    if (fract(h * 3.17) > uDrop) continue;',
    '    float ph = fract(uDT / 14.0 + h * 7.1), life = smoothstep(0.0, 0.015, ph) * smoothstep(0.92, 0.7, ph); if (life <= 0.0) continue;',   // (it lands, stays, dries off)
    '    vec2 ctr = c + 0.28 + 0.44 * vec2(fract(h * 13.7), fract(h * 29.3)); float R = (0.1 + 0.16 * fract(h * 5.9)) * (L == 0 ? 1.0 : 0.75) * (0.55 + 0.45 * life) * (1.0 - 0.35 * uDSnow);',
    '    vec2 d = (p - ctr) / R; d.y *= 0.8 + 0.3 * fract(h * 9.7); float r2 = dot(d, d);',
    '    if (r2 < 1.0) { float th = sqrt(1.0 - r2) * life; if (th > best.z) best = vec3(d, th); } }',
    '  return best; }'].join('\n');
  function lensStep(dt) {
    const view = !cam.ck && (lastMode === 'tv' || lastMode === 'kino' || !!(cam.shot && !cam.shot.floor));   // (a TV camera's view: else no lens, no drops)
    if (lens.p.distanceToSquared(camera.position) > 900) lens.sd = (lens.sd + 1) % 97; lens.p.copy(camera.position);   // (a cut: another camera, its own drops)
    const want = view && wet > 0 ? Math.min(1, wet * 1.2) * (stm.on ? 1 : 0.8) : 0;
    if (!view) lens.k = 0; else { lens.k += (want - lens.k) * Math.min(1, dt * (want > lens.k ? 0.3 : 0.5)); if (lens.k < 0.02 && want === 0) lens.k = 0; }   // (the rain over: they dry off)
    LENS_U.uDrop.value = lens.k > 0.003 ? lens.k * 0.7 : 0; LENS_U.uDT.value = time % 1000; LENS_U.uDSd.value = lens.sd; LENS_U.uDSnow.value = atmos.season === 'winter' ? 1 : 0; LENS_U.uDAs.value.set(camera.aspect, 1);
  }
  function lensDraw() {   // (without the post pass) the drops over the picture: lighter where they turn the sky into it, a highlight, a darker rim
    if (!lens.sc) {
      lens.mat = new THREE.ShaderMaterial({ uniforms: Object.assign({ uDCol: { value: new THREE.Color() } }, LENS_U), transparent: true, depthTest: false, depthWrite: false,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: [DROP_GLSL, 'uniform vec3 uDCol; varying vec2 vUv;',
          'void main(){ vec3 dr = dropAt(vUv); float dk = smoothstep(0.0, 0.2, dr.z); if (dk <= 0.0) discard;',
          '  vec3 nn = normalize(vec3(dr.xy, max(dr.z, 0.05))); float hl = pow(max(dot(nn, normalize(vec3(-0.45, 0.6, 0.66))), 0.0), 24.0), rim = 1.0 - smoothstep(0.0, 0.5, dr.z);',
          '  if (uDSnow > 0.5) { gl_FragColor = vec4(vec3(0.93, 0.95, 1.0) * (0.55 + 0.45 * length(uDCol)), smoothstep(0.0, 0.7, dr.z) * 0.55); return; }',   // (a flake melting on the glass: a soft white blot)
          '  vec3 col = mix(uDCol * 0.55, uDCol * 1.15, smoothstep(0.4, -0.7, dr.y)) * mix(1.0, 0.7, rim) + hl * 0.7;',   // (the drop shows the world upside down: the sky at its bottom, the ground at its top)
          '  gl_FragColor = vec4(col, clamp(dk * (0.34 + 0.3 * rim + 0.6 * hl), 0.0, 0.85)); }'].join('\n') });
      const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), lens.mat); q.frustumCulled = false; lens.sc = new THREE.Scene(); lens.sc.add(q); lens.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    }
    lens.mat.uniforms.uDCol.value.copy(scene.fog.color);
    const a = renderer.autoClear; renderer.autoClear = false; renderer.render(lens.sc, lens.cam); renderer.autoClear = a;
  }

  /* ---------------- post-processing (high quality): tilt-shift miniature look, edge smoothing, colour grade, vignette ---------------- */
  let post = null;
  const _lv = new THREE.Vector3(), _pv = new THREE.Vector3(), _v2 = new THREE.Vector2(), _sunV = new THREE.Vector3();
  function initPost() {
    const rtOpt = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: true, stencilBuffer: false };
    // WebGL2: 4x multisampled target, so the edges are really anti-aliased (the shader's edge blur only softens them)
    const rt = renderer.capabilities.isWebGL2 && THREE.WebGLMultisampleRenderTarget ? new THREE.WebGLMultisampleRenderTarget(4, 4, rtOpt) : new THREE.WebGLRenderTarget(4, 4, rtOpt);
    if (rt.isWebGLMultisampleRenderTarget) { rt.samples = 4; rt.depthTexture = new THREE.DepthTexture(4, 4, THREE.UnsignedIntType); }   // (24-bit depth: three's default 16 bits z-fight far off, e.g. the water against a gently sloping shore)
    rt.texture.generateMipmaps = false;
    const mat = new THREE.ShaderMaterial({
      uniforms: { tD: { value: rt.texture }, uRes: { value: new THREE.Vector2(4, 4) }, uFocus: { value: 0.45 }, uBand: { value: 0.22 }, uBlur: { value: 0.8 }, uGam: { value: 0.88 },
        uTint: { value: new THREE.Vector3(1, 1, 1) }, uSat: { value: 1.1 }, uCon: { value: 1.04 }, uVig: { value: 0.17 },
        uSun: { value: new THREE.Vector2(0, 1.2) }, uHaze: { value: 0 }, uHazeCol: { value: new THREE.Vector3(1, 0.8, 0.6) }, uRays: { value: 0 }, uSunR: { value: new THREE.Vector2(0.5, 1.2) },
        tB: { value: null }, uBloom: { value: 0 }, tFv: { value: null }, uFlare: { value: 0 }, uFlC: { value: new THREE.Vector3(1, 0.9, 0.75) }, uHeat: { value: 0 }, uHz: { value: 2 }, uHt: { value: 0 }, ...LENS_U },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: [
        'uniform sampler2D tD; uniform vec2 uRes; uniform float uFocus; uniform float uBand; uniform float uBlur; uniform float uGam; uniform vec3 uTint; uniform float uSat; uniform float uCon; uniform float uVig; uniform vec2 uSun; uniform float uHaze; uniform vec3 uHazeCol; uniform float uRays; uniform vec2 uSunR; uniform sampler2D tB; uniform float uBloom; varying vec2 vUv;',
        'uniform sampler2D tFv; uniform float uFlare; uniform vec3 uFlC; uniform float uHeat; uniform float uHz; uniform float uHt;', DROP_GLSL,
        'float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }',
        'void main(){',
        // the heat haze (a hot summer's day, high quality): the band of the picture just below the horizon (uHz) wavers
        '  vec2 tc = vUv; if (uHeat > 0.0) { float hm = smoothstep(uHz - 0.16, uHz - 0.03, vUv.y) * (1.0 - smoothstep(uHz - 0.006, uHz + 0.012, vUv.y)) * uHeat;',
        '    tc.x += (sin(vUv.y * 430.0 + uHt * 9.0) * 0.6 + sin(vUv.y * 171.0 - uHt * 5.3 + vUv.x * 37.0) * 0.4) * 0.0014 * hm; tc.y += sin(vUv.x * 250.0 + uHt * 6.7 + vUv.y * 90.0) * 0.0009 * hm; }',
        // a drop on the lens (the rain, TV views): it bends the picture behind it round (and blurs it, below)
        '  float dk = 0.0; vec3 dr = vec3(0.0); if (uDrop > 0.0) { dr = dropAt(vUv); dk = smoothstep(0.0, 0.2, dr.z); tc -= dr.xy * (0.022 + 0.02 * dr.z) * dk * (1.0 - 0.7 * uDSnow); }',
        '  vec2 px = 1.0 / uRes; vec3 c = texture2D(tD, tc).rgb;',
        '  float b = max(uBlur * smoothstep(uBand, uBand + 0.4, abs(vUv.y - uFocus)), dk * 0.85);',
        '  if (b > 0.02) {',
        '    vec2 o = px * (1.0 + 5.5 * b); vec3 s = c * 0.18;',
        '    s += (texture2D(tD, tc + vec2(1.0, 0.0) * o).rgb + texture2D(tD, tc - vec2(1.0, 0.0) * o).rgb + texture2D(tD, tc + vec2(0.0, 1.0) * o).rgb + texture2D(tD, tc - vec2(0.0, 1.0) * o).rgb) * 0.1;',
        '    s += (texture2D(tD, tc + vec2(1.4, 1.4) * o).rgb + texture2D(tD, tc + vec2(-1.4, 1.4) * o).rgb + texture2D(tD, tc + vec2(1.4, -1.4) * o).rgb + texture2D(tD, tc - vec2(1.4, 1.4) * o).rgb) * 0.06;',
        '    s += (texture2D(tD, tc + vec2(2.6, 0.0) * o).rgb + texture2D(tD, tc - vec2(2.6, 0.0) * o).rgb + texture2D(tD, tc + vec2(0.0, 2.6) * o).rgb + texture2D(tD, tc - vec2(0.0, 2.6) * o).rgb) * 0.045;',
        '    c = mix(c, s, clamp(b * 1.6, 0.0, 1.0));',
        '  } else {',
        '    float lC = lum(c), lN = lum(texture2D(tD, tc + vec2(0.0, px.y)).rgb), lS = lum(texture2D(tD, tc - vec2(0.0, px.y)).rgb), lE = lum(texture2D(tD, tc + vec2(px.x, 0.0)).rgb), lW = lum(texture2D(tD, tc - vec2(px.x, 0.0)).rgb);',
        '    float mx = max(max(max(lN, lS), max(lE, lW)), lC), mn = min(min(min(lN, lS), min(lE, lW)), lC);',
        '    if (mx - mn > 0.08) { vec2 dir = vec2(lS - lN, lE - lW); dir = dir / (length(dir) + 1e-4) * px * 0.9; c = mix(c, 0.5 * (texture2D(tD, tc + dir).rgb + texture2D(tD, tc - dir).rgb), 0.55); }',
        '  }',
        // shafts of sunlight: the bright sky round the sun smeared towards it, cut into rays by the trees and hills in front of it
        '  if (dk > 0.0) { vec3 nn = normalize(vec3(dr.xy, max(dr.z, 0.05))); float hl = pow(max(dot(nn, normalize(vec3(-0.45, 0.6, 0.66))), 0.0), 24.0);',   // (the drop: lighter inside, a highlight, a darker rim; snow: a white flake melting)
        '    if (uDSnow > 0.5) c = mix(c, vec3(0.93, 0.95, 1.0) * (0.75 + 0.3 * lum(c)), smoothstep(0.0, 0.7, dr.z) * 0.6);',
        '    else { c *= 0.92 + 0.16 * dr.z; c += hl * 0.35 * dk; c *= 1.0 - 0.3 * dk * (1.0 - smoothstep(0.0, 0.45, dr.z)); } }',
        '  if (uRays > 0.0) { vec2 as = vec2(uRes.x / uRes.y, 1.0), dv = uSunR - vUv, q2 = vUv; float L = length(dv * as), acc = 0.0, wt = 1.0; vec2 dl = dv * min(1.0, 0.34 / max(L, 1e-3)) / 20.0;',   // (at most a third of the screen towards the sun)
        '    for (int i = 0; i < 20; i++) { q2 += dl; vec2 sd2 = (q2 - uSunR) * as; acc += smoothstep(0.78, 1.0, lum(texture2D(tD, q2).rgb)) * exp(-dot(sd2, sd2) * 12.0) * wt; wt *= 0.95; }',
        '    c += uHazeCol * min(acc * 0.045, 0.45) * uRays * exp(-L * L * 5.0); }',
        '  if (uBloom > 0.0) c += texture2D(tB, vUv).rgb * uBloom;',   // the glow round the bright things (lamps, fires, screens, the sun)
        // the sun's lens flare (where the sky is drawn and the sun shows: tFv, how much of it is not hidden by trees, hills, the cockpit's
        // pillars): a glare round it with a thin streak sideways, and ghosts (soft discs, a ring) along the line from it through the middle
        '  if (uFlare > 0.0) { float fv = texture2D(tFv, vec2(0.5)).r * uFlare;',
        '    if (fv > 0.003) { vec2 as = vec2(uRes.x / uRes.y, 1.0), ax = vec2(0.5) - uSunR, sd = (vUv - uSunR) * as; float sr = length(sd);',
        '      vec3 fl = uFlC * (exp(-sr * sr * 300.0) * 0.25 + exp(-abs(sd.y) * 420.0) * exp(-abs(sd.x) * 3.0) * 0.2);',
        '      fl += vec3(0.35, 0.6, 0.4) * smoothstep(0.045, 0.03, length((vUv - uSunR - ax * 0.45) * as)) * 0.16;',
        '      fl += vec3(0.6, 0.4, 0.8) * smoothstep(0.075, 0.05, length((vUv - uSunR - ax * 0.8) * as)) * 0.11;',
        '      fl += vec3(0.9, 0.6, 0.3) * smoothstep(0.022, 0.012, length((vUv - uSunR - ax * 1.15) * as)) * 0.24;',
        '      fl += vec3(0.4, 0.55, 0.95) * smoothstep(0.012, 0.0, abs(length((vUv - uSunR - ax * 1.5) * as) - 0.11)) * 0.1;',
        '      fl += vec3(0.5, 0.8, 0.6) * smoothstep(0.06, 0.035, length((vUv - uSunR - ax * 1.85) * as)) * 0.1;',
        '      fl += vec3(0.85, 0.5, 0.45) * smoothstep(0.03, 0.018, length((vUv - uSunR - ax * 2.1) * as)) * 0.16;',
        '      c += fl * fv; } }',
        '  c *= uTint; float l = lum(c); c = mix(vec3(l), c, uSat); c = (c - 0.5) * uCon + 0.5; c = pow(max(c, vec3(0.0)), vec3(uGam));',
        '  if (uHaze > 0.0) { vec2 sd = (vUv - uSun) * vec2(uRes.x / uRes.y, 1.0); float hg = exp(-dot(sd, sd) * 2.2); c = 1.0 - (1.0 - c) * (1.0 - uHazeCol * (uHaze * hg)); }',   // warm glow of the low sun just off screen (as in the reference)
        '  vec2 q = vUv - 0.5; c *= 1.0 - uVig * dot(q, q) * 1.8;',
        '  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);',
        '}'].join('\n'),
      depthTest: false, depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); quad.frustumCulled = false;
    const sc = new THREE.Scene(); sc.add(quad);
    post = { rt, mat, sc, cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), focus: 0.45, rays: 0, sIn: 0, bloom: 0, bThr: 0.8 };
    // bloom: what is bright (over a threshold, softly) taken down to a quarter of the size, blurred twice (wider the second time), added
    // back in the pass above. How much and from how bright by the time of day (applyTheme: post.bloom, post.bThr)
    const bo = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: false, stencilBuffer: false };
    const bA = new THREE.WebGLRenderTarget(4, 4, bo), bB = new THREE.WebGLRenderTarget(4, 4, bo); bA.texture.generateMipmaps = bB.texture.generateMipmaps = false;
    const vs = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
    const bright = new THREE.ShaderMaterial({ uniforms: { tD: { value: rt.texture }, uPx: { value: new THREE.Vector2() }, uThr: { value: 0.8 } }, vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: ['uniform sampler2D tD; uniform vec2 uPx; uniform float uThr; varying vec2 vUv;',
        'vec3 bp(vec2 o){ vec3 c = texture2D(tD, vUv + o * uPx).rgb; return c * smoothstep(uThr, uThr + 0.18, dot(c, vec3(0.299, 0.587, 0.114))); }',
        'void main(){ gl_FragColor = vec4((bp(vec2(-1.5, -1.5)) + bp(vec2(1.5, -1.5)) + bp(vec2(-1.5, 1.5)) + bp(vec2(1.5, 1.5))) * 0.25, 1.0); }'].join('\n') });
    const blur = new THREE.ShaderMaterial({ uniforms: { tD: { value: null }, uDir: { value: new THREE.Vector2() } }, vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: ['uniform sampler2D tD; uniform vec2 uDir; varying vec2 vUv;',
        'void main(){ vec3 c = texture2D(tD, vUv).rgb * 0.227;',
        '  c += (texture2D(tD, vUv + uDir).rgb + texture2D(tD, vUv - uDir).rgb) * 0.194 + (texture2D(tD, vUv + uDir * 2.0).rgb + texture2D(tD, vUv - uDir * 2.0).rgb) * 0.121;',
        '  c += (texture2D(tD, vUv + uDir * 3.0).rgb + texture2D(tD, vUv - uDir * 3.0).rgb) * 0.054 + (texture2D(tD, vUv + uDir * 4.0).rgb + texture2D(tD, vUv - uDir * 4.0).rgb) * 0.016;',
        '  gl_FragColor = vec4(c, 1.0); }'].join('\n') });
    const bq = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bright); bq.frustumCulled = false; const bsc = new THREE.Scene(); bsc.add(bq);
    post.bl = { A: bA, B: bB, bright, blur, q: bq, sc: bsc }; mat.uniforms.tB.value = bA.texture;
    // the flare's visibility: how much of the sun shows (bright samples in a small disc round it on the screen), in a 1x1 target the flare reads
    const fvT = new THREE.WebGLRenderTarget(1, 1, bo); fvT.texture.generateMipmaps = false;
    const fvM = new THREE.ShaderMaterial({ uniforms: { tD: { value: rt.texture }, uSunR: mat.uniforms.uSunR, uAs: { value: new THREE.Vector2(1, 1) } }, vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: ['uniform sampler2D tD; uniform vec2 uSunR; uniform vec2 uAs; varying vec2 vUv;',
        'void main(){ float v = 0.0; for (int i = 0; i < 12; i++) { float a = float(i) * 2.3998, r = 0.003 + 0.01 * fract(float(i) * 0.618); vec2 q = uSunR + vec2(cos(a), sin(a)) * r / uAs;',
        '  v += smoothstep(0.9, 0.99, dot(texture2D(tD, q).rgb, vec3(0.299, 0.587, 0.114))) * step(0.0, q.x) * step(q.x, 1.0) * step(0.0, q.y) * step(q.y, 1.0); }',
        '  gl_FragColor = vec4(v / 12.0, 0.0, 0.0, 1.0); }'].join('\n') });
    const fvQ = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fvM); fvQ.frustumCulled = false; const fvS = new THREE.Scene(); fvS.add(fvQ);
    post.fv = { rt: fvT, mat: fvM, sc: fvS }; mat.uniforms.tFv.value = fvT.texture; post.flare = 0; post.fk = 0;
  }
  function sizePost() {
    if (!post) return; renderer.getDrawingBufferSize(_v2); post.rt.setSize(_v2.x, _v2.y); post.mat.uniforms.uRes.value.set(_v2.x, _v2.y);
    const B = post.bl, w = Math.max(1, Math.round(_v2.x / 4)), h = Math.max(1, Math.round(_v2.y / 4)); B.A.setSize(w, h); B.B.setSize(w, h); B.bright.uniforms.uPx.value.set(1 / _v2.x, 1 / _v2.y); B.w = w; B.h = h;
  }
  function bloomPass() {   // (after the scene is in post.rt): the bright parts into bl.A, blurred there
    const B = post.bl, U = B.blur.uniforms;
    B.bright.uniforms.uThr.value = post.bThr; B.q.material = B.bright; renderer.setRenderTarget(B.A); renderer.render(B.sc, post.cam);
    B.q.material = B.blur;
    for (const k of [1, 2]) {
      U.tD.value = B.A.texture; U.uDir.value.set(k / B.w, 0); renderer.setRenderTarget(B.B); renderer.render(B.sc, post.cam);
      U.tD.value = B.B.texture; U.uDir.value.set(0, k / B.h); renderer.setRenderTarget(B.A); renderer.render(B.sc, post.cam);
    }
  }
  function postOn() { return !!post && settings.quality === 'high' && settings.post !== false; }

  function updatePointScale() {
    const hpx = renderer.domElement.height;
    const ps = hpx / (2 * Math.tan(camera.fov * Math.PI / 360));
    particles.mat.uniforms.uScale.value = ps; if (sparkP) sparkP.mat.uniforms.uScale.value = ps; if (hazeP) hazeP.mat.uniforms.uScale.value = ps; if (glows) glows.mat.uniforms.uScale.value = ps; if (leaves) leaves.mat.uniforms.uScale.value = ps;
  }
  function setDynScale(k) { k = clamp(k, 0.55, 1); if (Math.abs(k - dynScale) > 0.01) { dynScale = k; resize(); } }
  function getDynScale() { return dynScale; }

  /* ---------------- race attach ---------------- */
  // the pieces every car shares (cached body / tail / wheel / Peugeot geometry, the common materials): never freed with a car
  function sharedCarRes() {
    const g = new Set([wheelGeo, wheelGeoW, ...geoCache.values(), ...tailGeoCache.values(), ...fWheelCache.values()]);
    if (p206Geo) for (const n of p206Geo) for (const p of n.prims) g.add(p.g);
    const m = new Set([matCar, matWheel, matTailOff, matTailOn, matBlob, matMarker, matUnder, matEngine, matLens, matLensBroken, matScOn, matScOff]);
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
    if (atmos.tod !== 'day') beams(v);
    carGlow(v);
    if (curTrack && curTrack.def.theme === 'pikes') pkCarDress(v);   // Pikes Peak: dust + morning glint on the paint
    if (v.cg && atmos.season === 'winter' && !(c.repairN > 0)) v.cg.a.value.z = 0.8;   // (a winter race: snow on the roof and the bonnet; not after a repair)
    scene.add(v.grp); return v;
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
    const men = new THREE.InstancedMesh(body, new THREE.MeshLambertMaterial({ vertexColors: true }), 8);
    // the cloths: yellow, blue (a car about to be lapped), the oil flag (red and yellow stripes)
    const cg = new THREE.PlaneGeometry(0.95, 0.62).translate(0.5, 0, 0), cv = document.createElement('canvas'); cv.width = 64; cv.height = 8;
    { const x = cv.getContext('2d'); for (let k = 0; k < 8; k++) { x.fillStyle = k % 2 ? '#d8202a' : '#ffd21f'; x.fillRect(k * 8, 0, 8, 8); } }
    const cloth = new THREE.InstancedMesh(cg, new THREE.MeshLambertMaterial({ color: 0xffd21f, side: THREE.DoubleSide }), 8);
    const blue = new THREE.InstancedMesh(cg, new THREE.MeshLambertMaterial({ color: 0x1f5fe0, side: THREE.DoubleSide }), 8);
    const oil = new THREE.InstancedMesh(cg, new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(cv), side: THREE.DoubleSide }), 8);
    for (const m of [men, cloth, blue, oil]) { m.count = 0; m.frustumCulled = false; scene.add(m); }
    return { men, cloth, blue, oil };
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
    // the marshals: yellow 110 m before a stopped car, the oil flag 110 m before the first spot of a leak, blue at the next post ahead of a
    // car about to be lapped (8 at most)
    const L = [];
    if (F && T && !T.open) { for (const y of F.yel) L.push([y.s - 110, 0]); for (const o of F.oil) L.push([o.s - 110, 2]); for (const b of F.blue) L.push([b.s, 1]); }
    const n = Math.min(8, L.length);
    if (!n && !flagInst) return;
    if (!flagInst) flagInst = flagMeshes();
    const { men } = flagInst, CL = [flagInst.cloth, flagInst.blue, flagInst.oil], cn = [0, 0, 0]; men.count = n; men.visible = n > 0;
    for (let k = 0; k < n; k++) {
      const [s0, kind] = L[k], i = T.idx(s0), br = T.br ? T.br[i] : T.w, d = br + 1.6, j = (i + 1) % T.N;
      const yaw = -Math.atan2(T.pz[j] - T.pz[i], T.px[j] - T.px[i]) + Math.PI / 2;
      _fp.set(T.px[i] + T.nx[i] * d, (T.hasElev && T.hy ? T.hy[i] : 0), T.pz[i] + T.nz[i] * d); _fe.set(0, yaw, 0); _flq.setFromEuler(_fe); _fm.compose(_fp, _flq, _fs); men.setMatrixAt(k, _fm);
      _fe.set(0, yaw + Math.sin(time * 7 + k) * 0.9, Math.sin(time * 5.3 + k) * 0.25, 'YXZ'); _flq.setFromEuler(_fe); _fp.y += 1.95; _fm.compose(_fp, _flq, _fs); CL[kind].setMatrixAt(cn[kind]++, _fm);   // (waving)
    }
    men.instanceMatrix.needsUpdate = true;
    CL.forEach((m, k) => { m.count = cn[k]; m.visible = cn[k] > 0; m.instanceMatrix.needsUpdate = true; });
  }
  const _fp = new THREE.Vector3(), _flq = new THREE.Quaternion(), _fe = new THREE.Euler(), _fm = new THREE.Matrix4(), _fs = new THREE.Vector3(1, 1, 1);
  /* ---------------- the recovery of a retired car (Race._retire: c.out): two marshals run to it along the barrier with extinguishers and
     spray it; the recovery truck (yellow, a crane on its back, amber beacons) drives up behind the barrier, swings its boom over, lifts the car
     on its hook over the barrier onto its bed and drives off with it ---------------- */
  const recov = new Map();
  const _rv = new THREE.Vector3(), _ry = new THREE.Vector3(0, 1, 0);
  function recovDrop() { for (const R of recov.values()) { scene.remove(R.grp); R.grp.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); } recov.clear(); }
  function recovMake(c) {
    const T = curTrack, o = c.out, i = T.idx(o.s), sd = Math.abs(o.d) > 1.5 ? Math.sign(o.d) : (T.br[i] < T.bl[i] ? 1 : -1), bar = sd > 0 ? T.br[i] : T.bl[i];
    const grp = new THREE.Group(), L = (col) => new THREE.MeshLambertMaterial({ color: col }), yel = L(0xf2b81c), dark = L(0x23262b), glass = L(0x3a4a58);
    const box = (w, h, d, m, x, y, z, g) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; (g || grp).add(b); return b; };
    const truck = new THREE.Group(); grp.add(truck);
    box(7.2, 0.5, 2.4, dark, -0.4, 0.75, 0, truck); box(5.2, 0.25, 2.4, yel, -1.4, 1.12, 0, truck);   // (chassis, bed)
    box(2.0, 1.9, 2.4, yel, 2.6, 1.95, 0, truck); box(0.08, 0.8, 2.1, glass, 3.62, 2.3, 0, truck);   // (cab, windscreen)
    const bc = [-1.2, 1.2].map(z => box(0.25, 0.18, 0.3, L(0xff9a1a), 2.3, 3.0, z, truck));   // (the amber beacons)
    for (const x of [-3, -1.6, 2.4]) for (const z of [-1.1, 1.1]) { const wl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 14).rotateX(Math.PI / 2), dark); wl.position.set(x, 0.5, z); truck.add(wl); }
    const tur = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.7, 12), yel); tur.position.set(1.0, 1.6, 0); truck.add(tur);
    const boom = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1, 0.42).translate(0, 0.5, 0), yel); boom.castShadow = true; grp.add(boom);
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 5).translate(0, -0.5, 0), dark); grp.add(cable);
    const hook = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 1.6), dark); grp.add(hook);   // (the spreader bar the car hangs from)
    const men = [0, 1].map(k => { const m = new THREE.Group(); box(0.42, 1.0, 0.32, L(0xff7a14), 0, 0.95, 0, m); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), L(0xf0f0f0)); hd.position.y = 1.62; m.add(hd);
      box(0.16, 0.85, 0.14, L(0x22242a), 0, 0.43, 0, m); const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 8), L(0xd01e1e)); ex.position.set(0.12, 0.95, 0.3); m.add(ex); grp.add(m); return m; });
    scene.add(grp);
    return { grp, truck, boom, cable, hook, men, bc, sd, bar, i, gy: null };
  }
  // where things are, from the car's spot: s m along the road, o m out from the centre line (+ the retired car's side), on the ground there
  function recovPt(R, c, s, o, out) {
    const T = curTrack, i = T.idx(s), j = (i + 1) % T.N, f = s / T.ds - Math.floor(s / T.ds), x = lerp(T.px[i], T.px[j], f) + lerp(T.nx[i], T.nx[j], f) * o * R.sd, z = lerp(T.pz[i], T.pz[j], f) + lerp(T.nz[i], T.nz[j], f) * o * R.sd;
    const yr = T.hasElev && T.hy ? T.hy[i] : 0, g = world && world.groundH ? world.groundH(x, z) : NaN;
    return out.set(x, Number.isFinite(g) && Math.abs(g - yr) < 4 ? g : yr, z);
  }
  function recoverCar(v, c, dt) {
    const o = c.out; let R = recov.get(c);
    if (!R) { if (o.t > 30 || !curTrack) { v.grp.visible = false; return; } R = recovMake(c); recov.set(c, R); }
    const t = o.t, T = curTrack, V = () => new THREE.Vector3(), ss = (a, b) => clamp((t - a) / (b - a), 0, 1), sm = (a, b) => { const u = ss(a, b); return u * u * (3 - 2 * u); };
    if (t > 30) { v.grp.visible = false; R.grp.visible = false; return; }
    // the truck: up from 70 m back (3-11 s), behind the barrier; off up the road with the car (21-30 s)
    const tl = R.bar + 3.6, sT = o.s - 70 * (1 - sm(3, 11)) + 95 * sm(21, 30), hd = T.hd[T.idx(sT)];
    recovPt(R, c, sT, tl, R.truck.position); R.truck.rotation.set(0, -hd, 0); R.grp.visible = true;
    const fwd = V().set(Math.cos(hd), 0, Math.sin(hd)), piv = V().copy(R.truck.position).addScaledVector(fwd, 1.0); piv.y += 1.95;   // (the turret's top)
    // the car: lifted (13.5-15 s), over the barrier onto the bed (15-17 s), down on it (17-18.5 s), then with the truck
    const rest = V().set(o.x, o.y, o.z), bed = recovPt(R, c, sT - 1.6, tl, V()); bed.y += 1.28;
    const up = sm(13.5, 15), over = sm(15, 17), down = sm(17, 18.5), cp = V().lerpVectors(rest, bed, over);
    cp.y = lerp(rest.y, bed.y, over) + 4.2 * up * (1 - down) + (over > 0 && over < 1 ? 0.6 * Math.sin(over * Math.PI) : 0);
    if (t > 18.5) cp.copy(bed);
    v.grp.position.copy(cp); v.grp.rotation.set(0, -(t > 15 ? lerp(o.h, hd, over) : o.h), Math.sin(t * 2.3) * 0.05 * up * (1 - down), 'YZX');
    if (v.blob) v.blob.visible = t < 13.5;
    // the hook over the car's roof (the boom swings over 11-13.5 s from its rest along the truck)
    const restH = V().copy(piv).addScaledVector(fwd, 3.2); restH.y += 0.4;
    const hook = V().copy(cp); hook.y += 1.55;
    const tip = V().lerpVectors(restH, V().set(hook.x, hook.y + 2.2, hook.z), t > 13.5 ? 1 : sm(11, 13.5));
    const bd = V().subVectors(tip, piv), bl = bd.length();
    R.boom.position.copy(piv); R.boom.quaternion.setFromUnitVectors(_ry, bd.normalize()); R.boom.scale.set(1, bl, 1);
    const hk = t > 13.5 ? hook : V().lerpVectors(V().set(tip.x, tip.y - 0.6, tip.z), hook, sm(12.5, 13.5));
    R.cable.position.copy(tip); R.cable.scale.set(1, Math.max(0.05, tip.y - hk.y), 1);
    R.hook.position.copy(hk); R.hook.rotation.set(0, -o.h, 0);
    // the beacons blink (at dusk and at night they glow)
    const on = (time * 3) % 1 < 0.5; R.bc[0].material.color.setHex(on ? 0xffc040 : 0x7a4a10); R.bc[1].material.color.setHex(on ? 0x7a4a10 : 0xffc040);
    if (atmos.tod !== 'day') R.bc.forEach((b, k) => { b.getWorldPosition(_rv); glows.add(_rv.x, _rv.y, _rv.z, 1.0, 1.0, 0.7, 0.2, on === (k === 0) ? 0.5 : 0.05); });
    // the marshals: from 25 m back behind the barrier (2-6 s) to the car's outer side, spraying it (6-11 s), back to the barrier (11-13 s),
    // away along it (22-26 s)
    const dl = o.d * R.sd, by = Math.min(dl + 1.7, R.bar - 0.5);   // (the car's place across the road from its side; beside it, towards the barrier)
    R.men.forEach((m, k) => {
      const run = sm(2 + k * 0.4, 6 + k * 0.4), back = sm(11, 13), gone = sm(22, 26), sl = o.s - 25 * (1 - run) + (k ? -2.2 : 1.2) * run - 20 * gone;
      recovPt(R, c, sl, back > 0 ? lerp(by, R.bar - 0.6, back) : lerp(R.bar + 1, by, run), m.position);
      const moving = (t > 2 && t < 6.4) || (t > 11 && t < 13) || (t > 22 && t < 26); m.position.y += moving ? Math.abs(Math.sin(t * 9 + k)) * 0.12 : 0;
      m.lookAt(rest.x, m.position.y, rest.z); m.visible = t < 26;
      if (t > 6.2 && t < 11 && Math.random() < dt * 30) {   // (the powder cloud)
        const dx = rest.x - m.position.x, dz = rest.z - m.position.z, dd = Math.hypot(dx, dz) || 1;
        particles.emit(m.position.x + dx / dd * 0.5, m.position.y + 0.9, m.position.z + dz / dd * 0.5, dx / dd * 3.5 + (Math.random() - 0.5), 0.3 + Math.random() * 0.5, dz / dd * 3.5 + (Math.random() - 0.5), 0.9 + Math.random() * 0.5, 0.5, 3, 0.95, 0.95, 0.96, 0.5, -0.1, 1.6, m.position.y);
      }
    });
  }
  /* ---------------- the race live (round 5): the timing pylon by the start straight of every circuit (the order by car number, the lap) and
     the big screens of the worlds that have them (Spa, the Red Bull Ring, Höljes: their materials marked userData.live), the standings and the
     lap over their picture; at high quality the picture is the race itself, from the TV camera on the followed car (a small render, every third
     frame, while a screen is near) ---------------- */
  let live = null;
  const LV_W = 512, LV_H = 288;
  function liveDrop() { if (!live) return; for (const m of live.own) { if (m.parent) m.parent.remove(m); m.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); } for (const e of live.mats) e.orig.dispose(); if (live.rt) live.rt.dispose(); live.texO.dispose(); live.texP.dispose(); live = null; }   // (the pylon's parts; the screens' own materials, replaced by the live ones)
  function liveBuild(T) {
    liveDrop();
    if (!world || !T || T.open) return;
    const cvO = document.createElement('canvas'); cvO.width = LV_W; cvO.height = LV_H;
    const cvP = document.createElement('canvas'); cvP.width = 128; cvP.height = 512;
    const texO = new THREE.CanvasTexture(cvO), texP = new THREE.CanvasTexture(cvP); texO.anisotropy = texP.anisotropy = 4;
    live = { T, cvO, cvP, texO, texP, mats: [], own: [], key: '', t: -9, rt: null, cam: null, n: 0, near: false, scr: [] };
    // the screens: their own material, the original picture under the live layer (or the race from the TV camera)
    world.root.traverse(o => {
      if (!o.isMesh || !o.material || !o.material.userData || !o.material.userData.live) return;
      const orig = o.material, L = orig.userData.live;
      const m = new THREE.ShaderMaterial({ uniforms: { tOrig: { value: orig.map }, tOver: { value: texO }, tFeed: { value: null }, uFeed: { value: 0 }, uU: { value: new THREE.Vector2(L.u0, L.u1) }, uB: { value: 1 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform sampler2D tOrig; uniform sampler2D tOver; uniform sampler2D tFeed; uniform float uFeed; uniform vec2 uU; uniform float uB; varying vec2 vUv;' +
          'void main(){ vec2 q = vec2((vUv.x - uU.x) / (uU.y - uU.x), vUv.y);' +   // (across the screen 0..1, whatever part of its picture the mesh maps)
          ' vec3 c = uFeed > 0.5 ? texture2D(tFeed, q).rgb : texture2D(tOrig, vec2(uU.x + q.x * (uU.y - uU.x), q.y)).rgb; vec4 o = texture2D(tOver, q);' +
          ' c = mix(c, o.rgb, o.a); vec2 px = fract(q * vec2(256.0, 144.0)); c *= 0.86 + 0.14 * step(0.2, px.x) * step(0.2, px.y);' +   // (the LEDs' grid)
          ' gl_FragColor = vec4(c * uB, 1.0); }' });
      o.material = m; live.mats.push({ m, orig }); o.updateMatrixWorld(true);
      const P = o.geometry.attributes.position; for (let k = 0; k < P.count; k += 2) live.scr.push(new THREE.Vector3(P.getX(k), P.getY(k), P.getZ(k)).applyMatrix4(o.matrixWorld));   // (the screens' corners: one mesh holds all of them)
    });
    // the timing pylon: 50 m before the start line, behind the barrier on the side away from the pit lane (or the roomier one), its face to the
    // cars coming down the straight
    if (T.def.id !== 'holjes') {
      const i = T.idx(T.startS - 50), pit = T.def.pit, sd = pit ? (pit[0] > 0 ? -1 : 1) : (T.br[i] > T.bl[i] ? 1 : -1), bar = sd > 0 ? T.br[i] : T.bl[i], o = sd * (bar + 1.8);
      const x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, g = world.groundH ? world.groundH(x, z) : NaN, yr = T.hasElev && T.hy ? T.hy[i] : 0, y = Number.isFinite(g) && Math.abs(g - yr) < 3 ? g : yr;
      const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = -T.hd[i] + Math.PI / 2 - sd * 0.28;   // (facing back down the straight, turned a little to the road)
      const dark = new THREE.MeshLambertMaterial({ color: 0x1c1e22 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 8.4, 0.7), dark); body.position.y = 5.1; body.castShadow = true; grp.add(body);
      for (const lx of [-0.55, 0.55]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.0, 0.5), dark); leg.position.set(lx, 0.5, 0); grp.add(leg); }
      const face = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 7.6), new THREE.MeshBasicMaterial({ map: texP })); face.position.set(0, 5.1, 0.36); grp.add(face);
      const face2 = face.clone(); face2.rotation.y = Math.PI; face2.position.z = -0.36; grp.add(face2);   // (and to the cars coming the other way past the pits' end)
      scene.add(grp); live.own.push(grp); live.pylon = grp;
    }
  }
  const _lvV = new THREE.Vector3();
  function liveDraw(R) {   // the live layer of the screens and the pylon's face: the order, the lap
    const L = live, T = L.T, O = R.order.filter(c => !c.out), lead = O[0], lap = Math.max(1, Math.min(R.laps, lead ? lead.lap : 1));
    const nm = (c) => c.isPlayer ? 'TI' : (c.name.split(' ').pop() || '').slice(0, 3).toUpperCase(), col = (c) => '#' + (c.color >>> 0).toString(16).padStart(6, '0');
    const gap = (c) => { if (c === lead) return ''; const d = lead.dist - c.dist; if (d > T.len * 0.98) return '+' + Math.floor(d / T.len) + ' KR'; return '+' + (d / Math.max(15, (c.speed + lead.speed) / 2)).toFixed(1); };
    { const x = L.cvO.getContext('2d'); x.clearRect(0, 0, LV_W, LV_H); x.textBaseline = 'middle'; const F = '"Russo One", "Arial Black", Arial, sans-serif';
      const n = Math.min(6, O.length); x.fillStyle = 'rgba(8,10,18,0.84)'; x.fillRect(10, 10, 196, 16 + n * 28);
      for (let k = 0; k < n; k++) { const c = O[k], yy = 30 + k * 28; x.font = '900 20px ' + F; x.fillStyle = c.isPlayer ? '#ffd21f' : '#fff'; x.textAlign = 'right'; x.fillText(String(k + 1), 36, yy);
        x.fillStyle = col(c); x.fillRect(44, yy - 10, 6, 20); x.textAlign = 'left'; x.fillStyle = c.isPlayer ? '#ffd21f' : '#fff'; x.fillText(nm(c), 58, yy); x.font = '900 16px ' + F; x.fillStyle = '#ffd21f'; x.textAlign = 'right'; x.fillText(gap(c), 198, yy); }
      x.fillStyle = '#d8202a'; x.fillRect(LV_W - 118, 12, 106, 30); x.fillStyle = '#fff'; x.font = '900 18px ' + F; x.textAlign = 'center'; x.fillText('V ŽIVO', LV_W - 65, 28);
      x.fillStyle = 'rgba(8,10,18,0.84)'; x.fillRect(0, LV_H - 40, LV_W, 40); x.fillStyle = '#fff'; x.textAlign = 'left'; x.font = '900 20px ' + F; x.fillText((T.def.name || '').toUpperCase(), 14, LV_H - 19);
      x.textAlign = 'right'; x.fillStyle = '#ffd21f'; x.fillText(R.state === 'done' || (lead && lead.finished) ? 'CILJ' : 'KROG ' + lap + '/' + R.laps, LV_W - 14, LV_H - 19);
      L.texO.needsUpdate = true; }
    { const x = L.cvP.getContext('2d'), F = '"Russo One", "Arial Black", Arial, sans-serif'; x.fillStyle = '#08090c'; x.fillRect(0, 0, 128, 512); x.textBaseline = 'middle';
      x.fillStyle = '#ffd21f'; x.font = '900 20px ' + F; x.textAlign = 'center'; x.fillText(lead && lead.finished ? 'CILJ' : 'KROG ' + lap, 64, 22); x.fillStyle = '#ffd21f'; x.fillRect(10, 40, 108, 3);
      const n = Math.min(12, O.length);
      for (let k = 0; k < n; k++) { const c = O[k], yy = 62 + k * 37; x.fillStyle = '#9aa0aa'; x.font = '900 22px ' + F; x.textAlign = 'right'; x.fillText(String(k + 1), 34, yy);
        x.fillStyle = col(c); x.fillRect(42, yy - 14, 7, 28); x.fillStyle = c.isPlayer ? '#ffd21f' : '#fff'; x.font = '900 28px ' + F; x.textAlign = 'right'; x.fillText(String(c.num), 118, yy); }
      L.texP.needsUpdate = true; }
  }
  function liveStep(target, dt) {
    const L = live, R = curRace; if (!L) return;
    const on = !!(R && R.track === L.T && R.order && R.order.length);
    if (on) { const key = R.order.map(c => c.id).join(',') + '|' + (R.order[0] ? R.order[0].lap : 0); if (key !== L.key || time - L.t > 1) { L.key = key; L.t = time; liveDraw(R); } }
    // the live picture: high quality, a screen within 320 m of the camera and in front of it, the followed car on the track
    let near = false; for (const p of L.scr) { if (p.distanceTo(camera.position) < 320) { _lvV.copy(p).project(camera); if (_lvV.z < 1 && Math.abs(_lvV.x) < 1.3 && Math.abs(_lvV.y) < 1.3) { near = true; break; } } }
    const feed = near && on && settings.quality === 'high' && !!target && !!L.mats.length;
    for (const e of L.mats) { e.m.uniforms.uFeed.value = feed ? 1 : 0; e.m.uniforms.tOrig.value = e.orig.map; e.m.uniforms.uB.value = atmos.tod === 'night' && !whiteNight() ? 1.15 : 1; }
    if (!feed) return;
    if (!L.rt) { L.rt = new THREE.WebGLRenderTarget(256, 144, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat }); L.rt.texture.generateMipmaps = false; L.cam = new THREE.PerspectiveCamera(20, 16 / 9, 0.5, 600); for (const e of L.mats) e.m.uniforms.tFeed.value = L.rt.texture; }
    if ((L.n++ % 3) !== 0) return;
    const C = tvCams(L.T), s = target.q && Number.isFinite(target.q.s) ? target.q.s : 0, n = C.length; let k = Math.floor(s / 170) % n; if (k < 0) k += n;
    const P = C[k], d = Math.hypot(P.x - target.x, P.y - (target.y || 0), P.z - target.z);
    L.cam.position.set(P.x, P.y, P.z); L.cam.lookAt(target.x, (target.y || 0) + 0.7, target.z); L.cam.fov = clamp(2 * Math.atan(6.5 / Math.max(1, d)) * 180 / Math.PI, 4, 55); L.cam.far = camera.far; L.cam.updateProjectionMatrix();
    const au = renderer.shadowMap.autoUpdate, prev = renderer.getRenderTarget(); renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(L.rt); renderer.render(scene, L.cam); renderer.setRenderTarget(prev); renderer.shadowMap.autoUpdate = au;
  }
  /* ---------------- the LED boards (round 5): digital boards on posts behind the barrier every 300 m, turned to the cars coming: the game's own
     sponsors in turn, and the flags as the marshals show them: yellow (flashing) in a yellow zone, SC while the safety car is out, green for
     6 s at the start and when the race goes green again, blue where a car is about to be lapped, the oil flag before oil. One instanced mesh
     for the posts and frames, one for the faces (state and sponsor per board: aSt) ---------------- */
  let led = null;
  function ledDrop() { if (!led) return; for (const m of [led.frame, led.face]) { scene.remove(m); m.geometry.dispose(); m.material.dispose(); } led.flags.dispose(); led = null; }
  function ledBuild(T) {
    ledDrop();
    if (!world || !T || T.open) return;
    const L = [];
    for (let s0 = 140, k = 0; s0 < T.len - 60; s0 += 300, k++) {
      const s = (T.startS + s0) % T.len, i = T.idx(s); if (T.def.pit && (T.pitAt(s) || T.pitAt(s + 40) || T.pitAt(s - 40))) continue;
      const sd = k % 2 ? 1 : -1, bar = sd > 0 ? T.br[i] : T.bl[i], o = sd * (bar + 0.7), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
      const g = world.groundH ? world.groundH(x, z) : NaN, yr = T.hasElev && T.hy ? T.hy[i] : 0, y = Number.isFinite(g) && Math.abs(g - yr) < 3 ? g : yr;
      L.push({ s, x, y, z, yaw: -T.hd[i] + Math.PI / 2 - sd * 0.45, k });
    }
    if (!L.length) return;
    const pos = [], nrm = [];
    for (const g0 of [new THREE.BoxGeometry(2.3, 1.3, 0.22).translate(0, 2.25, -0.06), new THREE.BoxGeometry(0.16, 1.7, 0.16).translate(0, 0.85, -0.1)]) { const g = g0.toNonIndexed(); pos.push(...g.attributes.position.array); nrm.push(...g.attributes.normal.array); g.dispose(); g0.dispose(); }   // (the frame and its post)
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    const frame = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0x1a1b1f }), L.length);
    const cv = document.createElement('canvas'); cv.width = 640; cv.height = 64; const x = cv.getContext('2d'), F = '"Russo One", "Arial Black", Arial, sans-serif';   // (the flags: yellow, SC, green, blue, oil)
    const cell = (k) => k * 128;
    x.fillStyle = '#ffd21f'; x.fillRect(cell(0), 0, 128, 64);
    x.fillStyle = '#ffd21f'; x.fillRect(cell(1), 0, 128, 64); x.fillStyle = '#111'; x.font = '900 44px ' + F; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('SC', cell(1) + 64, 34);
    x.fillStyle = '#19c23a'; x.fillRect(cell(2), 0, 128, 64);
    x.fillStyle = '#1f5fe0'; x.fillRect(cell(3), 0, 128, 64);
    for (let k = 0; k < 8; k++) { x.fillStyle = k % 2 ? '#d8202a' : '#ffd21f'; x.fillRect(cell(4) + k * 16, 0, 16, 64); }
    const flags = new THREE.CanvasTexture(cv);
    const fa = new THREE.PlaneGeometry(2.05, 1.08).translate(0, 2.25, 0.06), aSt = new THREE.InstancedBufferAttribute(new Float32Array(L.length * 2), 2); aSt.setUsage(THREE.DynamicDrawUsage); fa.setAttribute('aSt', aSt);
    const mat = new THREE.ShaderMaterial({ uniforms: { tAds: { value: tex.sponsors }, tFl: { value: flags }, uT: { value: 0 }, uB: { value: 1 } },
      vertexShader: 'attribute vec2 aSt; varying vec2 vUv; varying vec2 vSt; void main(){ vUv = uv; vSt = aSt; vec4 p = vec4(position, 1.0);\n#ifdef USE_INSTANCING\np = instanceMatrix * p;\n#endif\ngl_Position = projectionMatrix * modelViewMatrix * p; }',
      fragmentShader: 'uniform sampler2D tAds; uniform sampler2D tFl; uniform float uT; uniform float uB; varying vec2 vUv; varying vec2 vSt;' +
        'void main(){ float st = floor(vSt.x + 0.5), c0 = floor(vSt.y + 0.5); vec3 c;' +
        ' if (st < 0.5) { vec2 o = vec2(mod(c0, 2.0) * 0.5, 1.0 - (floor(c0 / 2.0) + 1.0) * 0.25); c = texture2D(tAds, o + vUv * vec2(0.5, 0.25)).rgb; }' +   // (a sponsor: a cell of the 2 x 4 atlas)
        ' else { c = texture2D(tFl, vec2((st - 1.0 + vUv.x) / 5.0, vUv.y)).rgb; if (st < 1.5 || (st > 3.5 && st < 4.5)) c *= 0.35 + 0.65 * step(0.45, fract(uT * 1.7)); }' +   // (yellow and blue flash)
        ' vec2 g = fract(vUv * vec2(72.0, 38.0)) - 0.5; c *= 0.5 + 0.6 * smoothstep(0.5, 0.15, length(g));' +   // (the LEDs)
        ' gl_FragColor = vec4(c * uB, 1.0); }' });
    const face = new THREE.InstancedMesh(fa, mat, L.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    L.forEach((b, k) => { q.setFromAxisAngle(up, b.yaw); p.set(b.x, b.y, b.z); m4.compose(p, q, one); frame.setMatrixAt(k, m4); face.setMatrixAt(k, m4); aSt.setXY(k, 0, k % 8); });
    frame.castShadow = true; frame.receiveShadow = true; frame.name = 'ledFrames'; face.name = 'ledFaces';
    for (const m of [frame, face]) { m.frustumCulled = false; m.matrixAutoUpdate = false; scene.add(m); }
    led = { T, L, frame, face, aSt, flags, green: -99, ev: -1 };
  }
  function ledStep() {
    if (!led) return;
    const R = curRace, F = R && R.track === led.T ? R.fl : null, T = led.T, Ln = T.len;
    led.face.material.uniforms.uT.value = time % 1000; led.face.material.uniforms.uB.value = atmos.tod === 'night' && !whiteNight() ? 1.25 : atmos.tod === 'dusk' || atmos.tod === 'dawn' ? 1.1 : 1;
    if (F && F.ev !== led.ev) { if (led.ev >= 0 && F.evK === 'green') led.green = time; led.ev = F.ev; }
    const start = R && R.state === 'racing' && R.time < 6, green = start || time - led.green < 6, sc = !!(F && F.sc && F.sc.state !== 'gone');
    const fwd = (a, b) => ((b - a) % Ln + Ln) % Ln;   // (m from a on to b)
    led.L.forEach((b, k) => {
      let st = 0;
      if (F) {
        if (sc) st = 2;
        else if (F.yel.length && R._yelAt(b.s)) st = 1;
        else if (F.oil.some(o => fwd(b.s, o.s) < 300)) st = 5;
        else if (F.blue.some(o => fwd(b.s, o.s) < 160)) st = 4;
      }
      if (!st && green && R) st = 3;
      led.aSt.setXY(k, st, (k + Math.floor(time / 5)) % 8);
    });
    led.aSt.needsUpdate = true;
  }
  /* ---------------- far out (round 5): wind turbines on the high ground 250-480 m from the road (the Nordschleife, Spa, Toskana, Suzuka,
     Höljes), their blades turning, and a power line on lattice pylons across the land 150-300 m out (the Nordschleife, the Red Bull Ring, the
     mountain stage, Jezero, Toskana, Spa). At dusk and at night red warning lights blink on the turbines, the pylons and the world's own tall
     things (world.dyn.redL: Monaco's TV cranes), all together ---------------- */
  const FAR_SPEC = { nring: [6, 1], spa: [3, 1], toskana: [3, 1], suzuka: [2, 0], holjes: [3, 0], rbring: [0, 1], gora: [0, 1], jezero: [0, 1] };
  let farX = null;
  function farDrop() { if (!farX) return; for (const o of farX.own) { scene.remove(o); o.traverse(q => { if (q.geometry) q.geometry.dispose(); if (q.material) q.material.dispose(); }); } farX = null; }
  function farBuild(T) {
    farDrop();
    const spec = T && FAR_SPEC[T.def.id]; farX = { own: [], rot: [], red: (world && world.dyn.redL ? world.dyn.redL.slice() : []) };
    if (!spec || !world || !world.groundH) return;
    const R = Core.rng(4711 + T.N), G = (x, z) => { const g = world.groundH(x, z); return Number.isFinite(g) ? g : NaN; }, B = world.bounds;
    const inB = (x, z) => !B || (x > B.minX + 40 && x < B.maxX - 40 && z > B.minZ + 40 && z < B.maxZ - 40);
    const near = (x, z) => { let d = 1e9; for (let i = 0; i < T.N; i += 4) d = Math.min(d, Math.hypot(T.px[i] - x, T.pz[i] - z)); return d; };
    const white = new THREE.MeshLambertMaterial({ color: 0xe8eaec, fog: false }); farX.white = white;   // (out of the fog: pale in the haze instead, see farStep, so they stand on the skyline)
    // the turbines: the highest of many tries, 160 m apart
    const tb = [];
    for (let t = 0; t < 260 && spec[0]; t++) {
      const i = Math.floor(R() * T.N), sd = R() < 0.5 ? -1 : 1, o = sd * (250 + R() * 230), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
      if (!inB(x, z)) continue; const y = G(x, z); if (!Number.isFinite(y) || near(x, z) < 230) continue;
      tb.push({ x, z, y });
    }
    tb.sort((a, b) => b.y - a.y);
    const pick = []; for (const c of tb) { if (pick.length >= spec[0]) break; if (pick.every(p => Math.hypot(p.x - c.x, p.z - c.z) > 160)) pick.push(c); }
    for (const p of pick) {
      const grp = new THREE.Group(); grp.name = 'turbine'; grp.position.set(p.x, p.y - 1, p.z); grp.rotation.y = 0.6 + R() * 0.5;   // (all facing the same wind, roughly)
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 2.4, 80, 12, 1).translate(0, 40, 0), white); grp.add(tower);
      const nac = new THREE.Mesh(new THREE.BoxGeometry(9, 3.4, 3.4).translate(1.5, 81, 0), white); grp.add(nac);
      const hub = new THREE.Group(); hub.position.set(-3.4, 81, 0); grp.add(hub);
      const nose = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 8), white); hub.add(nose);
      for (let b = 0; b < 3; b++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 38, 2.2).translate(0, 19.5, 0), white); bl.rotation.x = b / 3 * Math.PI * 2; hub.add(bl); }
      scene.add(grp); farX.own.push(grp); farX.rot.push({ hub, w: 0.9 + R() * 0.25, ph: R() * 6.28 });
      farX.red.push([p.x, p.y + 84, p.z]);
    }
    // the power line: along a stretch of the lap, 150-300 m out, pylons every 260 m, the wires sagging between them
    if (spec[1]) for (let t = 0; t < 40; t++) {
      const i0 = Math.floor(R() * T.N), sd = R() < 0.5 ? -1 : 1, off = sd * (150 + R() * 150), n = 6, pts = [];
      for (let k = 0; k < n; k++) { const i = (i0 + Math.round(k * 260 / T.ds)) % T.N, x = T.px[i] + T.nx[i] * off, z = T.pz[i] + T.nz[i] * off, y = G(x, z); if (!inB(x, z) || !Number.isFinite(y) || near(x, z) < 120) break; pts.push([x, y, z]); }
      if (pts.length < 4) continue;
      const steel = new THREE.MeshLambertMaterial({ color: 0x8a8f96 }), H = 30, grp = new THREE.Group(), wires = []; grp.name = 'powerLine';
      const arms = [[-6, H - 6], [6, H - 6], [-4.5, H - 1], [4.5, H - 1]];
      pts.forEach((q, k) => {
        const nx = (pts[Math.min(k + 1, pts.length - 1)][0] - pts[Math.max(k - 1, 0)][0]), nz = (pts[Math.min(k + 1, pts.length - 1)][2] - pts[Math.max(k - 1, 0)][2]), a = Math.atan2(nz, nx);
        const P = new THREE.Group(); P.position.set(q[0], q[1] - 0.5, q[2]); P.rotation.y = -a + Math.PI / 2;
        for (const [lx, lz] of [[-2.2, -2.2], [2.2, -2.2], [2.2, 2.2], [-2.2, 2.2]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, H, 4), steel); leg.position.set(lx * 0.55, H / 2, lz * 0.55); leg.rotation.set(-lz * 0.035, 0, lx * 0.035); P.add(leg); }
        for (let hb = 6; hb < H; hb += 6) { const br = new THREE.Mesh(new THREE.BoxGeometry(2.6 - hb * 0.04, 0.12, 0.12), steel); br.position.y = hb; P.add(br); const br2 = br.clone(); br2.rotation.y = Math.PI / 2; P.add(br2); }
        for (const yy of [H - 6, H - 1]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(yy > H - 2 ? 9.5 : 12.5, 0.3, 0.3), steel); arm.position.y = yy; P.add(arm); }
        grp.add(P); P.updateMatrixWorld(true);
        wires.push(arms.map(([ax, ay]) => new THREE.Vector3(ax, ay - 1.2, 0).applyMatrix4(P.matrixWorld)));
        farX.red.push([q[0], q[1] + H + 0.6, q[2]]);
      });
      const W = [];   // (the wires: a sagging curve between neighbouring pylons, 10 pieces)
      for (let k = 0; k + 1 < wires.length; k++) for (let a = 0; a < arms.length; a++) { const A = wires[k][a], C = wires[k + 1][a];
        for (let j = 0; j < 10; j++) { const t0 = j / 10, t1 = (j + 1) / 10, sg = (t) => 6 * 4 * t * (1 - t); W.push(lerp(A.x, C.x, t0), lerp(A.y, C.y, t0) - sg(t0), lerp(A.z, C.z, t0), lerp(A.x, C.x, t1), lerp(A.y, C.y, t1) - sg(t1), lerp(A.z, C.z, t1)); } }
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(W, 3));
      grp.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0x2a2c30 })));
      scene.add(grp); farX.own.push(grp);
      break;
    }
  }
  function farStep() {
    if (!farX) return;
    for (const r of farX.rot) r.hub.rotation.x = r.ph + time * r.w;
    if (farX.white) { const k = atmos.tod === 'night' && !whiteNight() ? 0.25 : atmos.tod === 'dusk' ? 0.75 : atmos.tod === 'dawn' ? 0.82 : 1; farX.white.color.setRGB(0.91 * k, 0.92 * k, 0.93 * k).lerp(scene.fog.color, 0.55); farX.white.emissive.copy(scene.fog.color).multiplyScalar(0.25 * k); }   // (pale in the haze)
    if (atmos.tod === 'day' || !farX.red.length) return;
    const on = (time % 1.6) < 0.8;   // (the warning lights blink together)
    if (on) { for (const p of farX.red) glows.add(p[0], p[1], p[2], 3.2, 1.0, 0.08, 0.05, 0.85); glows.end(); }   // (after the cars' glows of this frame)
  }
  /* ---------------- the pit wall and the paddock (round 5, a track with pits): the player's crew man at the pit wall beside its box holds the
     pit board out over the wall as the player comes down the straight (the place, the gap to the car ahead, the lap: the board as he saw the
     player the lap before); mechanics carry tyres along the garages and a scooter rides up and down beside them ---------------- */
  let pitL = null;
  function pitLDrop() { if (!pitL) return; scene.remove(pitL.grp); pitL.grp.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); pitL = null; }
  function pitLBuild(T) {
    pitLDrop();
    const P = T && T.def.pit; if (!P || P[3] == null || !world) return;
    const grp = new THREE.Group(); grp.name = 'pitLife'; scene.add(grp);
    const L = (c) => new THREE.MeshLambertMaterial({ color: c }), team = L(0x1f6fd0), dark = L(0x202226), skin = L(0xd9a27a), tyreM = L(0x141416);
    const person = (shirt) => { const m = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.62, 0.3), shirt); b.position.y = 1.18; m.add(b);
      const lg = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.86, 0.26), dark); lg.position.y = 0.43; m.add(lg); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), skin); hd.position.y = 1.65; m.add(hd);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), shirt); cap.position.y = 1.68; m.add(cap); grp.add(m); return m; };
    const at = (s, o, out) => { const i = T.idx(s), j = (i + 1) % T.N, f = s / T.ds - Math.floor(s / T.ds); return out.set(lerp(T.px[i], T.px[j], f) + lerp(T.nx[i], T.nx[j], f) * o, T.hasElev && T.hy ? lerp(T.hy[i], T.hy[j], f) : 0, lerp(T.pz[i], T.pz[j], f) + lerp(T.nz[i], T.nz[j], f) * o); };
    const sd = P[0] > 0 ? 1 : -1, sBox = T.startS + P[3] + 8, pz = T.pitAt(sBox); if (!pz) { scene.remove(grp); return; }
    // the board man and his board
    const man = person(team), cv = document.createElement('canvas'); cv.width = 128; cv.height = 96; const bt = new THREE.CanvasTexture(cv);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 5).translate(0, 0.8, 0), L(0x9a9ea6)); grp.add(pole);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.75), new THREE.MeshBasicMaterial({ map: bt, side: THREE.DoubleSide })); grp.add(board);
    // the walkers with tyres, the scooter
    const row = T.def.pitRow || [P[1] + 60, P[2] - 40], walk = [0, 1, 2].map(k => { const m = person(k === 1 ? L(0xe8e8e8) : team); const ty = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.27, 12).rotateX(Math.PI / 2), tyreM); ty.position.set(0.32, 1.0, 0); m.add(ty); return { m, ph: k * 0.37, v: 1.2 + k * 0.2 }; });
    const sc = new THREE.Group(); { const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 0.4), L(0xd8202a)); body.position.y = 0.45; sc.add(body); for (const x of [-0.5, 0.5]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 10).rotateX(Math.PI / 2), tyreM); w.position.set(x, 0.2, 0); sc.add(w); }
      const rider = person(team); grp.remove(rider); rider.position.set(-0.1, 0.25, 0); rider.scale.setScalar(0.92); sc.add(rider); } grp.add(sc);
    const c0 = at(sBox, 0, new THREE.Vector3());
    pitL = { T, grp, man, pole, board, cv, bt, at, sd, sBox, pz, walk, sc, row, ext: 0, key: '', P, seen: null, cx: c0.x, cz: c0.z, _w: new THREE.Vector3() };
  }
  function pitLStep(dt) {
    const L = pitL; if (!L) return;
    const R = curRace, T = L.T, Pl = R && R.track === T ? R.player : null, near = Math.hypot((cam.vcx || 0) - L.cx, (cam.vcz || 0) - L.cz) < 360;
    L.grp.visible = near; if (!near) return;
    const wall = L.pz.wall, len = T.len;
    // the board: out as the player comes (250 m before the box to 15 m past it); what it shows: as the player crossed the line the lap before
    let dP = Pl ? ((L.sBox - Pl.q.s) % len + len) % len : 1e9; if (dP > len - 15) dP -= len;
    const want = Pl && !Pl.finished && !Pl.inPit && dP < 250 && dP > -15 ? 1 : 0; L.ext += (want - L.ext) * Math.min(1, dt * 3);
    if (Pl && (want && !L.seen)) { const O = R.order, k = O.indexOf(Pl), ah = k > 0 ? O[k - 1] : null, g = ah ? (ah.dist - Pl.dist) / Math.max(15, Pl.speed) : 0; L.seen = { p: k + 1, g, lap: Math.min(R.laps, Math.max(1, Pl.lap)) }; }
    if (!want && L.ext < 0.05) L.seen = null;
    const S = L.seen, key = S ? S.p + '|' + S.g.toFixed(1) + '|' + S.lap : '';
    if (key !== L.key) { L.key = key; const x = L.cv.getContext('2d'); x.fillStyle = '#0c0d10'; x.fillRect(0, 0, 128, 96); x.strokeStyle = '#ffd21f'; x.lineWidth = 3; x.strokeRect(2, 2, 124, 92);
      if (S) { x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#ffd21f'; x.font = '900 34px Arial, sans-serif'; x.fillText('P' + S.p, 64, 24); x.fillStyle = '#fff'; x.font = '900 24px Arial, sans-serif'; x.fillText(S.p > 1 ? '+' + S.g.toFixed(1) : 'VODIŠ', 64, 54); x.fillStyle = '#9ad'; x.font = '900 18px Arial, sans-serif'; x.fillText('KROG ' + S.lap, 64, 80); }
      L.bt.needsUpdate = true; }
    const hd = T.hd[T.idx(L.sBox)], mo = L.sd * (wall + 0.75);
    L.at(L.sBox, mo, L.man.position); L.man.rotation.y = -hd + Math.PI / 2 + L.sd * 0.6;   // (on the lane's side of the wall, turned to the straight)
    const lean = 0.25 + 0.95 * L.ext;   // (the pole leans out over the wall)
    L.pole.position.copy(L.man.position).add(L._w.set(0, 1.25, 0)); L.pole.rotation.set(0, -hd, L.sd * lean, 'YXZ');
    const tip = L._w.set(0, 1.6, 0).applyEuler(L.pole.rotation).add(L.pole.position); L.board.position.copy(tip); L.board.rotation.set(0, -hd + Math.PI / 2, 0); L.board.visible = L.ext > 0.08;
    // the walkers along the garages and the scooter (back and forth)
    const a = T.startS + L.row[0], b = T.startS + L.row[1], span = Math.max(10, b - a);
    L.walk.forEach((w, k) => { const u = ((time * w.v / span + w.ph) % 2 + 2) % 2, f = u < 1 ? u : 2 - u, s = a + span * f, pzw = T.pitAt(s); if (!pzw) return;
      L.at(s, L.sd * (pzw.lout + 1.3 + k * 0.5), w.m.position); w.m.position.y += Math.abs(Math.sin(time * 7 + k)) * 0.04; w.m.rotation.y = -T.hd[T.idx(s)] + (u < 1 ? 0 : Math.PI); });
    { const span2 = Math.max(20, (T.startS + L.P[2] - 30) - (T.startS + L.P[1] + 40)), u = ((time * 4 / span2) % 2 + 2) % 2, f = u < 1 ? u : 2 - u, s = T.startS + L.P[1] + 40 + span2 * f, pzs = T.pitAt(s);
      if (pzs) { L.at(s, L.sd * (pzs.lout + 2.6), L.sc.position); L.sc.rotation.y = -T.hd[T.idx(s)] + (u < 1 ? 0 : Math.PI); } }
  }
  // the crowd's moments (World.crowdWave / World.crowdBurst): the wave along with the leader of the race; a burst of cheering round a car that
  // has just overtaken (the two within 15 m) or has been badly hit (its damage up by 0.08 at once), one every 1.5 s at most
  const crm = { order: null, dm: new Map(), t: -9 };
  function crowdMoments() {
    const R = curRace; if (!R || !world || !world.dyn.crowd) return;
    const lead = R.order ? R.order.find(c => !c.finished && !c.out) : null, on = !!lead && R.state === 'racing';
    World.crowdWave(on ? lead.x : 1e6, on ? lead.z : 1e6, on ? Math.cos(lead.h) : 1, on ? Math.sin(lead.h) : 0, on);
    if (!on || !R.order) { crm.order = null; return; }
    let at = null;
    if (crm.order && time - crm.t > 1.5) {
      const O = R.order;
      for (let k = 0; k < O.length - 1 && !at; k++) { const a = O[k], b = O[k + 1], ia = crm.order.indexOf(a), ib = crm.order.indexOf(b); if (ia > ib && ib >= 0 && !a.inPit && !b.inPit && Math.hypot(a.x - b.x, a.z - b.z) < 15) at = a; }
      if (!at) for (const c of R.cars) { const d0 = crm.dm.get(c); if (d0 != null && c.dmg - d0 > 0.08) { at = c; break; } }
    }
    for (const c of R.cars) crm.dm.set(c, c.dmg);
    crm.order = R.order;
    if (at) { crm.t = time; World.crowdBurst(at.x, at.z, 75, time); }
  }
  function attachRace(race) {
    scDrop();
    const old = views;
    views = []; curTrack = race.track; curRace = race; clearDebris(); dust = race.track.def.dust ? Object.assign({}, DUST0, race.track.def.dust) : null;
    birds.reset(birds.gull);   // (a new race, a fresh sky: nothing left over from the frames before it, so a race stepped from a seeded start draws the same)
    bow.on = false; bow.a = 0; bow.t = 0; bow.prev = race.rain || 0;   // (no rainbow left over from the race before)
    ckG.idle = ckG.dustS = ckG.wash = ckG.snow = 0; ckG.dustP = 0; ckG.tc = 1.15;   // (a clean windscreen, the wipers at rest)
    if (leaves) { leaves.clear(); leafSet(); }
    if (rmk) rmk.n = -1;   // (the new race's oil)
    recovDrop();   // (no recovery left over from the race before)
    crm.order = null; crm.dm.clear(); crm.t = -9;
    stm.seq = null; stm.next = 5; stm.wind = 1; lens.k = 0;   // (no strike, no gale, no drops left over: a race from a seeded start draws the same)
    if (stm.w) { hemi.intensity = stm.base.hi; hemi.color.copy(stm.base.hc); scene.fog.color.copy(stm.base.fog); renderer.setClearColor(scene.fog.color, 1); stm.w = null; } stm.f = 0; if (stm.bolt) stm.bolt.visible = false;
    if (world && world.props && world.props.length && race.setProps && !race.props) race.setProps(world.props, world.propFloor);
    setupProps(race);
    for (const c of race.cars) views.push(makeView(c));
    for (const v of old) disposeView(v);   // (after the new cars exist: their shaders are reused, not compiled again)
    setupCrew(race);
    particles.clear(); sparkP.clear(); hazeP.clear(); hazeT = -1; skids.clear(); cam.init = false;
  }

  /* ---------------- Pikes Peak: the car gathers dust on the climb, the low morning sun glints on the paint ----------------
     Only the cars of a Pikes race (makeView dresses them; the ghost and every other track are untouched). The paint materials of the car
     (the body, its panels, the Peugeot's paint and glass) get one shader patch with a stable program key: a dusty tan layer that settles
     low (sills, arches, the tail) by a per-car amount that grows with the distance driven (4x on the gravel verge), and a warm specular +
     fresnel glint towards the theme's sun. The amount lives with the car (a pit repair keeps it; a new race starts clean). */
  const pkCarDust = new WeakMap(), PKU = { sun: { value: new THREE.Vector3() }, sunC: { value: new THREE.Color() } };
  const PK_V = ['#include <common>\nuniform mat4 uPkInv;\nvarying vec3 vPk;\nvarying vec3 vPkN;', '#include <project_vertex>\n{ mat4 pkM = uPkInv * modelMatrix; vPk = (pkM * vec4(transformed, 1.0)).xyz; vPkN = mat3(pkM) * objectNormal; }'];
  const PK_F = ['#include <common>\nuniform float uPkD;\nuniform float uPkGl;\nuniform vec4 uPkW;\nuniform vec3 uPkSun;\nuniform vec3 uPkSunC;\nvarying vec3 vPk;\nvarying vec3 vPkN;',
    'float pkH(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }',
    'float pkNz(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); const vec2 o = vec2(1.0, 0.0);',
    '  return mix(mix(mix(pkH(i), pkH(i + o.xyy), f.x), mix(pkH(i + o.yxy), pkH(i + o.xxy), f.x), f.y), mix(mix(pkH(i + o.yyx), pkH(i + o.xyx), f.x), mix(pkH(i + o.yxx), pkH(i + o.xxx), f.x), f.y), f.z); }'].join('\n');
  const PK_DUST = ['#include <color_fragment>', 'float pkD = 0.0, pkG = uPkGl;',
    '{ vec3 p = vPk, n = normalize(vPkN);',
    '#ifdef USE_COLOR',
    '  pkG = max(pkG, 1.0 - step(0.05, min(distance(vColor, vec3(0.1, 0.13, 0.19)), distance(vColor, vec3(0.04, 0.05, 0.08)))));',   // the body's glass panes
    '#endif',
    '  float nz = pkNz(p * vec3(3.2, 5.5, 3.2)) * 0.6 + pkNz(p * vec3(10.0, 17.0, 10.0)) * 0.4;',
    '  float low = 1.0 - smoothstep(0.15, 0.72, p.y + (nz - 0.5) * 0.3);',   // sills and the lower body
    '  float ar = min(length(p.xy - uPkW.xz), length(p.xy - uPkW.yz));',
    '  float arch = (1.0 - smoothstep(uPkW.z + 0.08, uPkW.z + 0.45, ar)) * smoothstep(0.35, 0.75, abs(n.z));',   // round the wheel arches
    '  float rear = smoothstep(0.25, 0.8, -n.x) * (1.0 - smoothstep(-0.75, -0.25, p.x / uPkW.w));',   // the tail (the dust swirls in behind the car)
    '  float w = (max(max(low, arch), rear) + smoothstep(0.55, 0.95, n.y) * 0.12) * mix(1.0, 0.3, pkG) * smoothstep(uPkW.z * 0.9, uPkW.z + 0.03, ar);',   // (not on the wheels themselves)
    '  pkD = clamp(uPkD * w * (0.5 + 0.95 * nz) * 1.4, 0.0, 0.86);',
    '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.66, 0.53, 0.4) * (0.86 + 0.28 * nz), pkD); }'].join('\n');
  const PK_GLINT = ['{ vec3 pn = normalize(normal), pv = normalize(vViewPosition), pl = normalize((viewMatrix * vec4(uPkSun, 0.0)).xyz), ph = normalize(pl + pv);',
    '  float ndl = max(dot(pn, pl), 0.0), nh = max(dot(pn, ph), 0.0), fr = pow(1.0 - max(dot(pn, pv), 0.0), 3.0);',
    '  float gl = (pow(nh, mix(36.0, 120.0, pkG)) * mix(2.4, 4.2, pkG) + pow(nh, 8.0) * 0.4) * smoothstep(0.0, 0.3, ndl) + fr * mix(1.2, 1.8, pkG) * ndl;',   // a sharp glint, a broad warm sheen and a rim on the sun side
    '  outgoingLight += uPkSunC * gl * (1.0 - pkD); }',
    'gl_FragColor = vec4( outgoingLight, diffuseColor.a );'].join('\n');
  function pkCarMat(m, u, gl, key) {   // add the dust + glint to a paint material (keeps what it already did: the body's scratches)
    const ob = m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile ? m.onBeforeCompile : null, ug = { value: gl };
    m.onBeforeCompile = (sh, r) => {
      if (ob) ob(sh, r);
      Object.assign(sh.uniforms, { uPkInv: u.inv, uPkD: u.d, uPkW: u.w, uPkGl: ug, uPkSun: PKU.sun, uPkSunC: PKU.sunC });
      sh.vertexShader = sh.vertexShader.replace('#include <common>', PK_V[0]).replace('#include <project_vertex>', PK_V[1]);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', PK_F).replace('#include <color_fragment>', PK_DUST)
        .replace('#include <specularmap_fragment>', '#include <specularmap_fragment>\nspecularStrength *= 1.0 - pkD * 0.85;')   // dust dulls the shine and the reflections
        .replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );', PK_GLINT);
    };
    m.customProgramCacheKey = () => key;
    m.needsUpdate = true;
    return m;
  }
  function pkCarDress(v) {
    const c = v.car, M = c.m, sc = M.len / 4.4;
    const u = { inv: { value: new THREE.Matrix4() }, d: { value: pkCarDust.get(c) || 0 }, w: { value: new THREE.Vector4(M.a * sc * 0.98 + 0.05, -M.b * sc * 0.98, M.rw, M.len / 2) } };
    if (v.glb && v.wf.length && v.wr.length) u.w.value.set(v.wf[0].position.x, v.wr[0].position.x, v.wf[0].position.y, M.len / 2);
    pkCarMat(v.body.material, u, 0, 'pkCarB'); if (v.cg) v.cg.pk = true;   // the stock dust and mud stay off: this layer replaces them here (the winter snow stays)
    pkCarMat(v.partMats[0], u, 0, 'pkCarPc');
    if (v.glb) {
      pkCarMat(v.glb.paint, u, 0, 'pkCarPc');   // (with the grime layer: not the glass's program)
      let gm = null;   // the Peugeot's glass: its own glinting copy (the shared one stays as it is)
      v.bodyG.traverse(o => { if (o.isMesh && (o.material === p206Mats.chrome || o.material.userData.p206Chrome)) o.material = gm = gm || (o.material.userData.p206Chrome ? pkCarMat(o.material, u, 1, 'pkCarG') : pkCarMat(o.material.clone(), u, 1, 'pkCarP')); });   // (the car's own copy already: the glint goes onto it)
    }
    v.pk = u;
  }
  function pkCarTick(v, c, dt, opt) {
    const u = v.pk; u.inv.value.copy(v.grp.matrixWorld).invert();
    PKU.sun.value.set(sunOff[0], sunOff[1], sunOff[2]).normalize(); PKU.sunC.value.copy(sun.color).multiplyScalar(Math.min(1.2, sun.intensity * 0.6));
    if (!(opt && opt.noFx) && !c.air && dt > 0 && c.speed > 0.5) {
      const off = c.q && Math.abs(c.q.d || 0) > ((curTrack && curTrack.def.halfWidth) || 7);   // on the gravel verge: 4x as fast
      u.d.value = Math.min(1, u.d.value + Math.abs(c.speed) * dt * (off ? 4 : 1) / 7000);
      pkCarDust.set(c, u.d.value);
    }
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

  /* ---------------- per-frame ---------------- */
  const tmp = { x: 0, z: 0 };
  function wheelWorld(c, lx, lz, x, z, h) { const ch = Math.cos(h), sh = Math.sin(h); tmp.x = x + lx * ch - lz * sh; tmp.z = z + lx * sh + lz * ch; return tmp; }

  // the grime of a car (see CG_GLSL): dust builds up on gravel, makadam and grass (the ground's own colour), mud in the rain (and a grey film
  // off a wet road), winter: slush (also off Höljes' snowy asphalt). Never washes off in a race: a repair in the pits or a new race cleans
  // the car. The snow on the roof (a winter race starts with it) blows off with speed and settles again while slow in a snowfall
  const CG_GRASS = [0.34, 0.33, 0.21], CG_GMUD = [0.25, 0.23, 0.15], CG_SLUSH = [0.8, 0.82, 0.86], CG_GREY = [0.6, 0.61, 0.64], CG_FILM = [0.32, 0.3, 0.27], CG_MUDK = [0.5, 0.46, 0.42], _cgc = [0, 0, 0];
  function cgMix(C, col, have, add) { const k = add / Math.max(1e-4, have + add); C.r += (col[0] - C.r) * k; C.g += (col[1] - C.g) * k; C.b += (col[2] - C.b) * k; }
  function cgTick(v, c, dt) {
    const u = v.cg, A = u.a.value, winter = atmos.season === 'winter', wetR = winter ? 0 : Math.max(0, wetW);   // (winter: the road's "water" is snow)
    A.w += (wetR - A.w) * Math.min(1, dt * 0.5);   // (the dust darkens as it gets wet)
    if (!u.pk && !c.air && c.speed > 0.5) {
      let loose = 0, grass = 0, road = 0; for (let k = 0; k < 4; k++) { const sf = c.ws[k]; if (sf === 2) grass++; else if (sf === 3 || sf === 5 || sf === 6) loose++; else road++; }   // (7, standing water on the asphalt: the road)
      const sp = clamp(c.speed / 12, 0.2, 1.5) * dt, dc = (world && world.dust) || (dust || DUST0).col;
      const dA = ((loose * 0.0016 + grass * 0.002) * (1 - 0.75 * wetR) + (winter && world && world.snowRoad ? road * 0.0005 : 0)) * sp;
      if (dA > 0) {
        if (winter) cgMix(u.dc.value, loose + grass ? CG_SLUSH : CG_GREY, A.x, dA);
        else if (loose >= grass) { for (let q = 0; q < 3; q++) _cgc[q] = dc[q] * 0.8; cgMix(u.dc.value, _cgc, A.x, dA); }
        else cgMix(u.dc.value, CG_GRASS, A.x, dA);
        A.x = Math.min(1, A.x + dA * (1 - 0.5 * A.x));
      }
      const mA = ((loose + grass) * 0.0022 + road * 0.00022) * wetR * sp;
      if (mA > 0) {
        if (loose >= grass && loose) { for (let q = 0; q < 3; q++) _cgc[q] = dc[q] * CG_MUDK[q]; cgMix(u.mc.value, _cgc, A.y, mA); }
        else cgMix(u.mc.value, grass ? CG_GMUD : CG_FILM, A.y, mA);
        A.y = Math.min(1, A.y + mA * (1 - 0.5 * A.y));
      }
    }
    if (winter) {
      if (c.speed > 8) A.z = Math.max(0, A.z - dt * (c.speed - 8) * 0.0022);
      if (wet > 0) A.z = Math.min(0.85, A.z + dt * wet * (c.speed < 8 ? 0.025 : 0.006));   // (snowing)
    } else if (A.z > 0) A.z = Math.max(0, A.z - dt * 0.4);   // (the season changed: it melts)
  }
  function updateCars(dt, alpha, opt) {
    const markerOn = opt && opt.marker, hlK = hlBegin();
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
      if (c.out) recoverCar(v, c, dt);   // (a retired car: the marshals, the recovery crane)
      v.landed = !!(v.wasAir && !c.air);   // landing this frame (dust ring is emitted in emitFx)
      if (v.landed && c.isPlayer && c.speed > 3) shake(0.15 + clamp(-(c.impactVY || 0) / 8, 0, 1) * 0.45);
      v.spin += c.vl * dt / M.rw;
      for (const w of v.wf) { w.rotation.set(0, -c.delta, -v.spin); }
      for (const w of v.wr) { w.rotation.set(0, 0, -v.spin); }
      const braking = (c.inBrk > 0.08 && c.vl > 0.5 && c.gear !== -1) || c.gear === -1 || c.inHand > 0.5; v.brk = braking;
      const rainL = v.noHead && (wet > 0 || (braking && time % 0.25 < 0.125));   // the formula's rain light: on in the rain, blinking while it brakes (harvesting)
      v.tail.material = (v.noHead ? rain : braking) ? matTailOn : matTailOff;
      if (v.glb) v.glb.tail.emissive.setHex(braking ? 0xff1a0a : 0x3a0000);
      if (v.drsFlap) { v.drsK = (v.drsK || 0) + ((c.drs ? 1 : 0) - (v.drsK || 0)) * Math.min(1, dt * 12); v.drsFlap.rotation.z = 0.5 * v.drsK; }   // the rear wing's flap opens with DRS
      // light glows: soft warm headlights, red tail lights that flare when braking
      v.grp.updateMatrixWorld(true);
      for (let k = 0; k < 4 && c !== ck.car; k++) {   // (not the lamps of the car the cockpit camera sits in)
        if (v.lightBroken && v.lightBroken[k]) continue;   // smashed lamp: no glow
        _lv.copy(v.lights[k]).applyMatrix4(v.grp.matrixWorld);
        const rl = (1 + Math.max(0, wet) * 0.9) * (atmos.tod === 'night' ? 1.5 : atmos.tod === 'dusk' ? 1.25 : atmos.tod === 'dawn' ? 1.15 : 1);   // (rain, dusk, night: the lights stand out more in the gloom)
        if (v.noHead) { if (k === 2 && rainL) glows.add(_lv.x, _lv.y, _lv.z, 1.5, 1.0, 0.15, 0.08, 0.9); }
        else if (k < 2) glows.add(_lv.x, _lv.y, _lv.z, 0.95, 1.0, 0.88, 0.62, 0.17 * rl);
        else glows.add(_lv.x, _lv.y, _lv.z, braking ? 1.8 : 0.95, 1.0, 0.15, 0.08, braking ? 0.95 : 0.3 * rl);
      }
      if (hlK) hlAdd(v, c, dt, hlK);   // (the beams in the air)
      if (v.scrU) v.scrU.value = Core.sstep(0.3, 0.9, c.dmg || 0);
      if (v.cg) { v.cg.inv.value.copy(v.grp.matrixWorld).invert(); if (!(opt && opt.noFx) && dt > 0) cgTick(v, c, dt); }   // (the grime layer: in the car's space)
      if (v.pk) pkCarTick(v, c, dt, opt);
      if (v.marker) { v.marker.visible = !!markerOn; v.marker.position.y = 4 + Math.sin(time * 5) * 0.3; v.marker.rotation.y = time * 2; }
      // --- effects ---
      if (!opt || !opt.noFx) emitFx(v, c, dt, x, z, h);
      v.wasAir = !!c.air;
      if (c.dents && c.dents.length) { for (const d of c.dents) applyDent(v, d); c.dents.length = 0; }
      if (v.parts) updateParts(v, c, x, y, z, h);
      if (c.dmg > 0.45 && (!opt || !opt.noFx) && !dbg.noSmoke) {   // damaged engine smokes: grey, turning black when badly hurt
        v.smokeAcc += (c.dmg - 0.4) * (10 + 16 * (c.inThr || 0)) * dt;
        const dark = Core.sstep(0.5, 0.95, c.dmg), gc = 0.84 - 0.4 * dark, ek = v.noHead ? -0.36 : 0.32, fx = Math.cos(h) * M.len * ek, fz = Math.sin(h) * M.len * ek;   // (the formula's engine is behind the driver)
        while (v.smokeAcc >= 1) {
          v.smokeAcc -= 1;
          particles.emit(x + fx + (Math.random() - 0.5) * 0.5, y + 0.95, z + fz + (Math.random() - 0.5) * 0.5, c.vx * 0.35 + (Math.random() - 0.5) * 0.6, 0.9 + Math.random() * 0.6, c.vz * 0.35 + (Math.random() - 0.5) * 0.6, 1.7 + Math.random() * 0.9, 0.7, 3.8 + Math.random() * 1.6, gc, gc, gc * 1.02, 0.52 + dark * 0.2, -0.3, 0.9, y);
        }
      }
    }
    glows.end(); hlEnd();
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
    if (v.fp) fParts(v, parts, under);   // the formula: its own parts (built with its mesh)
    else {
      const paint = new THREE.MeshPhongMaterial({ color: c.color, shininess: 80, specular: 0x505050, envMap: envTex, combine: THREE.MixOperation, reflectivity: 0.2 });
      const trim = new THREE.MeshLambertMaterial({ color: 0x2b2e34 });
      v.partMats = [paint, trim];
      if (v.cg) { cgMat(paint, v.cg, 'cgPaint'); cgMat(trim, v.cg, 'cgTrim'); }   // (the bonnet, boot, wings, mirrors and bumpers get dirty with the body)
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
    for (let k = 0; k < 2; k++) { const L = v.lights[k], m = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.11, 0.28), matLens); m.position.set(L.x - 0.02, L.y, L.z); m.visible = !v.glb && !v.noHead; v.bodyG.add(m); v.lens.push(m); }
  }
  // the formula's parts, built with the car's mesh (the garage and the ghost show them too): front wing (bumperF), nose (hood), rear wing with the
  // DRS flap (bumperR), engine cover (trunk), mirrors, bargeboards (fenderL/R). Each is centred on its own origin (a loose one tumbles about
  // its middle; its geometry's .parameters say how it lies on the track)
  function fPartMeshes(car, bodyG) {
    const P = colArr(car.color), S = stripeFor(car.color), parts = {};
    const paint = new THREE.MeshPhongMaterial({ color: car.color, shininess: 80, specular: 0x505050, envMap: envTex, combine: THREE.MixOperation, reflectivity: 0.2 });
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
    // the dust left hanging over the gravel after the cars pass: big faint puffs behind the car that drift off with the wind (the way the
    // cloud shadows go) and rise a little, for 9-15 s (not in the rain; winter: powder snow)
    if (spd > 8 && !c.air && wetW < 0.3) {
      let loose = 0; for (let k = 0; k < 4; k++) { const sf = c.ws[k]; if (sf === 3 || sf === 5) loose++; }
      if (loose >= 2) {
        v.hz = (v.hz || 0) + dt * clamp(spd / 20, 0.5, 1.5) * (settings.quality === 'high' ? 2.2 : 1.2); hazeT = time + 16;   // (hazeT: drawn while any of it lives)
        const D = dust || DUST0, dc = atmos.season === 'winter' ? SNOW_DUST : dust ? D.col : (world && world.dust) || D.col;
        while (v.hz >= 1) { v.hz -= 1;
          const sh = 0.95 + Math.random() * 0.1, b = 2 + Math.random() * 4, wk = 0.6 + Math.random() * 0.5;
          hazeP.emit(x - Math.cos(h) * b + (Math.random() - 0.5) * 3, yb + 0.6 + Math.random() * 0.8, z - Math.sin(h) * b + (Math.random() - 0.5) * 3, HAZE_W[0] * wk, 0.12 + Math.random() * 0.1, HAZE_W[1] * wk,
            9 + Math.random() * 6, 5, 14 + Math.random() * 6, dc[0] * sh, dc[1] * sh, dc[2] * sh, 0.13 * (D.alpha || 1), 0, 0, yb);
        }
      }
    }
    // landing after a jump: a ring of dust (and stones on loose ground) bursting out from under the car
    if (v.landed) {
      const hard = -(c.impactVY || 0), gy = c.roadY || 0;
      if (hard > 2.2) {
        let loose = 0; for (let k = 0; k < 4; k++) { const sf = c.ws[k]; if (sf >= 2 && sf !== 4 && sf !== 7) loose++; }
        const dirt = loose >= 2, n = Math.min(26, 8 + hard * 2.2), wetL = wetW > 0;   // (in the rain: a splash of muddy water)
        for (let k = 0; k < n; k++) {
          const a = k / n * Math.PI * 2 + Math.random() * 0.4, sp = (2.5 + Math.random() * 3) * Math.min(1.6, hard / 6);
          const cr = wetL ? 0.66 : dirt ? 0.8 : 0.78, cg = wetL ? 0.67 : dirt ? 0.66 : 0.77, cb = wetL ? 0.68 : dirt ? 0.46 : 0.75;
          particles.emit(x + Math.cos(a) * 1.3, gy + 0.3, z + Math.sin(a) * 1.3, Math.cos(a) * sp + c.vx * 0.3, 0.6 + Math.random() * 0.8, Math.sin(a) * sp + c.vz * 0.3, 1.0 + Math.random() * 0.7, 1.1, 5 + Math.random() * 2.5, cr, cg, cb, 0.5, -0.08, 2.2, gy);
        }
        if (dirt) for (let k = 0; k < 8; k++) { const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 3; particles.emit(x, gy + 0.3, z, Math.cos(a) * sp + c.vx * 0.4, 3 + Math.random() * 2.5, Math.sin(a) * sp + c.vz * 0.4, 0.8 + Math.random() * 0.4, 0.3, 0.26, 0.34, 0.27, 0.2, 0.95, 14, 0.4, gy); }
      }
    }
    const slide = (c.arcade ? Core.sstep(0.26, 0.62, Math.abs(c.beta || 0)) * 1.2 : Math.max(0, c.latR - 1.0) / 3.5) + c.spin * 0.9 + (c.lock ? 0.55 : 0) + (c.inHand > 0.5 && spd > 5 ? 0.45 : 0);
    const rainy = wetW > 0.1, near = !rainy || Math.hypot(x - (cam.vcx || 0), z - (cam.vcz || 0)) < 140;   // (rain: spray only where it can be seen, the particles are shared)
    const snowR = atmos.season === 'winter' && !!(world && world.snowRoad);   // (a winter road under a film of snow and ice: Höljes)
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
      const onHard = surf <= 1 || (rainy && surf === 4);   // (rain: the paving sprays like the asphalt)
      const skidOn = intens > 0.14 && spd > 2.5 && !(rainy && onHard) && surf !== 7;   // (no rubber laid on a wet road, nor in standing water)
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
          v.acc[k] += (clamp(spd / 36, 0, 1.4) + intens * 0.7) * 26 * wetW * dt;
          while (v.acc[k] >= 1) {
            v.acc[k] -= 1;
            const sh = 0.9 + Math.random() * 0.1, sp = 0.35 + Math.random() * 0.15;
            particles.emit(px, 0.3 + yb, pz, c.vx * sp + (Math.random() - 0.5) * 2.4, 0.6 + Math.random() * 1.0, c.vz * sp + (Math.random() - 0.5) * 2.4, 0.55 + Math.random() * 0.4, 0.8, 3.4 + Math.random() * 2.0, 0.9 * sh, 0.93 * sh, 0.96 * sh, 0.24, -0.12, 1.7, yb);
          }
        } else v.acc[k] = 0;
      } else if (surf === 7 && spd > 4) {   // into standing water on the asphalt (heavy rain): a sheet of white water off the tyre, the higher the faster
        v.acc[k] += (clamp(spd / 18, 0.3, 2) * 3.4 + intens * 0.4) * 26 * dt;
        while (v.acc[k] >= 1) {
          v.acc[k] -= 1;
          const up = clamp(spd / 25, 0.5, 1.6), vxs = c.vx * 0.35 + (Math.random() - 0.5) * 4, vzs = c.vz * 0.35 + (Math.random() - 0.5) * 4, sh = 0.92 + Math.random() * 0.08;
          particles.emit(px, 0.2 + yb, pz, vxs, (1.6 + Math.random() * 2.8) * up, vzs, 0.5 + Math.random() * 0.4, 0.55, 3 + Math.random() * 1.6, 0.86 * sh, 0.9 * sh, 0.95 * sh, 0.45, 6, 1.5, yb);
        }
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
      } else if (snowR && onHard && spd > 5) {   // a snowy winter road: no tyre smoke, the tyres throw up powder snow (a light mist at speed, a cloud in a slide)
        v.acc[k] += (0.3 * clamp(spd / 30, 0, 1.4) + Math.min(1.3, intens)) * 24 * dt;
        while (v.acc[k] >= 1) {
          v.acc[k] -= 1;
          const sh = 0.95 + Math.random() * 0.05, sp = 0.3 + Math.random() * 0.2;
          particles.emit(px, 0.3 + yb, pz, c.vx * sp + (Math.random() - 0.5) * 2.2, 0.5 + Math.random() * 0.8, c.vz * sp + (Math.random() - 0.5) * 2.2, 0.8 + Math.random() * 0.6, 0.8, 3.6 + Math.random() * 2, 0.93 * sh, 0.95 * sh, 0.99 * sh, 0.24 + 0.2 * Math.min(1, intens), -0.05, 1.5, yb);
        }
      } else if (onHard && intens > 0.22 && spd > 3) {
        v.acc[k] += Math.min(1.3, intens) * 42 * dt;
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
            if (Math.random() < 0.3 + 0.3 * Math.min(1, intens)) {   // flying stones: flung up off the tyre and back from it the more it spins, grey and brown (winter: clods of snow), bouncing where they land
              const kb = 1 + 5 * Math.min(1, intens), u = Math.random(), sc = atmos.season === 'winter' ? [0.86, 0.88, 0.92] : u < 0.45 ? [0.44, 0.42, 0.39] : u < 0.8 ? [0.33, 0.27, 0.2] : [0.58, 0.55, 0.5];
              particles.emit(px, 0.2 + yb, pz, c.vx * 0.12 - Math.cos(h) * kb + (Math.random() - 0.5) * 2.6, 2 + Math.random() * 3, c.vz * 0.12 - Math.sin(h) * kb + (Math.random() - 0.5) * 2.6, 0.6 + Math.random() * 0.5, 0.32 + Math.random() * 0.14, 0.26, sc[0], sc[1], sc[2], 1, 14, 0.3, yb);
            }
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
    // winter: the exhaust's vapour in the cold air, a white puff trailing behind every car near the view (thicker standing still)
    if (atmos.season === 'winter' && Math.random() < dt * (spd < 6 ? 16 : 7) && Math.hypot(x - (cam.vcx || 0), z - (cam.vcz || 0)) < 110) {
      const p = wheelWorld(c, -M.len * 0.5 - 0.15, 0.35, x, z, h), sh = 0.94 + Math.random() * 0.06;
      particles.emit(p.x, 0.34 + yb, p.z, c.vx * 0.6 - Math.cos(h) * 1.4 + (Math.random() - 0.5) * 0.5, 0.2 + Math.random() * 0.35, c.vz * 0.6 - Math.sin(h) * 1.4 + (Math.random() - 0.5) * 0.5, 1.2 + Math.random() * 0.9, 0.3, 1.9 + Math.random() * 1.1, 0.9 * sh, 0.92 * sh, 0.95 * sh, spd < 6 ? 0.3 : 0.2, -0.15, 1.3, yb);
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
      if (camera.fov !== 58) { camera.fov = 58; camera.updateProjectionMatrix(); updatePointScale(); }
    } else if (mode === 'chase') {
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
    } else if (mode === 'tv') {
      // the replay's TV cameras: on posts every 170 m beside the track (on the outside of the bends), 9 m up; the one ahead of the car
      // until it has gone 60 m past it, then a cut to the next; zoomed so the car fills about the same part of the picture
      const C = tvCams(curTrack), s = c.q && Number.isFinite(c.q.s) ? c.q.s : 0, L = curTrack.len, n = C.length;
      let k = Math.floor(s / 170) % n; if (curTrack.open) k = Core.clamp(k, 0, n - 1);
      const P = C[k]; px = P.x; py = P.y; pz = P.z; tx = x; ty = (c.y || 0) + 0.7; tz = z;
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
    // the sun's shadows: a box 160 m across round the view; in the chase view on a landscape screen, where the theme asks for it (shadowR:
    // Höljes), a smaller one round the ground that view sees (from ~15 m behind its target to ~30 m past it): sharper shadows round the car
    const th = THEMES[themeId], sR = th && th.shadowR && mode === 'chase' && !qc && !shot && camera.aspect >= 1 ? th.shadowR : 80, chS = sR < 80;
    if (sR !== shR) { shR = sR; const S = sun.shadow.camera; S.left = S.bottom = -sR; S.right = S.top = sR; S.updateProjectionMatrix(); }
    const sx = qc ? px + (tx - px) * 0.65 : chS ? tx + Math.cos(cam.hs) * 6 : mode === 'kino' ? tx + Math.sin(camYaw) * 8 : tx, sz = qc ? pz + (tz - pz) * 0.65 : chS ? tz + Math.sin(cam.hs) * 6 : mode === 'chase' ? tz : mode === 'kino' ? tz - Math.cos(camYaw) * 8 : tz - 8;   // (the cockpit: the shadows round 45 m ahead)
    const texel = 2 * sR / sun.shadow.mapSize.x;
    const cx = Math.round(sx / texel) * texel, cz = Math.round(sz / texel) * texel;
    sun.target.position.set(cx, baseY, cz);
    sun.position.set(cx + sunOff[0], baseY + sunOff[1], cz + sunOff[2]);
    sun.target.updateMatrixWorld();
  }
  let sunOff = [-80, 96, 70], camYaw = 0, lastMode = 'iso', shR = 80;
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
      out.push({ x, y, z, s });
    }
    return (T._tv = out);
  }
  function shake(a) { cam.shake = Math.max(cam.shake, Math.min(1.2, a)); }
  function resetCam() { cam.init = false; }
  // a TV shot: { px, py, pz (the camera), tx, ty, tz (where it looks), fov, fogD (the fog as for a camera this far from its target) },
  // updated by its owner every frame; null: back to the game's camera (from scratch)
  function setShot(s) { if (!s && cam.shot) cam.init = false; cam.shot = s || null; }

  /* ---------------- the sky: a dome round the camera for the views that look out to the horizon (the cockpit, the replay's TV cameras,
     the photo mode): the fog's colour at the horizon (the far world fades into it), a deeper colour overhead, a soft glow round the sun
     (by day and at dusk; the moon's at night); where the theme asks for them (clouds: how many), fair-weather clouds drifting on a deck
     overhead, lit on the sun's side, thinning into the haze at the horizon (by day and at dusk, not in the rain) ---------------- */
  let sky = null;
  // the Milky Way: a great circle tilted across the sky (its plane's normal and two directions in it)
  const MW_N = new THREE.Vector3(0.3, 0.55, 0.78).normalize(), MW_T1 = new THREE.Vector3().crossVectors(MW_N, new THREE.Vector3(0, 1, 0)).normalize(), MW_T2 = new THREE.Vector3().crossVectors(MW_N, MW_T1);
  // the rainbow after the rain (frame): a: how strong (0..1), t: how long it has been out
  const bow = { a: 0, t: 0, prev: 0, on: false };
  // the sky's colours at the horizon (bot) and at the zenith (top): the dome's, and the cars' reflections (envDraw)
  function skyCols(bot, top) {
    const r = Math.max(0, wet), night = atmos.tod === 'night', dusk = atmos.tod === 'dusk', dawn = atmos.tod === 'dawn', wn = whiteNight();
    bot.copy(scene.fog.color);
    top.copy(scene.fog.color).lerp(_c2.setHex(wn ? 0x6f86c0 : night ? 0x010207 : dusk ? 0x34497f : dawn ? 0x5a7cb8 : atmos.season === 'winter' ? 0x86a6d0 : 0x3f7cd0), (night && !wn ? 0.8 : 0.55) * (1 - 0.8 * r));
  }
  /* ---------------- the thunderstorm (race.sky.storm, while it rains): a darker sky (applyTheme), lightning now and then (stormStrike:
     a few strokes tens of ms apart, each a flash lighting the world and the sky; when it strikes the ground not too far off in front of the
     camera, its bolt from the clouds down to the horizon: a glowing ribbon behind everything else, round the camera as the sky is), the
     thunder after the light (stm.cb: Sfx.thunder, 3 s a km), and the gale (World.wind: the trees and the grass in its gusts; the rain
     slanting with it). In winter a snowstorm: the gale, no lightning ---------------- */
  // the mist at dawn (not in the rain): it lies in the valleys at first and lifts as the race goes on (the race's clock): thinner, higher; the
  // dew glints in the grass meanwhile (World.dew), drying off. Where it lies: low on the track's own heights (mistAt, a new world)
  const mistK = { y: 0, h: 6 };
  function mistAt(T) {
    let lo = 0, hi = 0; const hy = T && T.hasElev && T.hy ? T.hy : null;
    if (hy) { lo = Infinity; hi = -Infinity; for (let i = 0; i < hy.length; i += 4) { lo = Math.min(lo, hy[i]); hi = Math.max(hi, hy[i]); } }
    const rg = hi - lo; mistK.y = lo + Math.min(rg * 0.18, 30); mistK.h = Math.min(5 + rg * 0.1, 22);
  }
  function mistStep() {
    const R = curRace, on = atmos.tod === 'dawn' && wet <= 0 && !!curTrack, lift = clamp((R ? R.time || 0 : 0) / 240, 0, 1);
    MIST.x = on ? 0.62 - 0.4 * lift : 0; MIST.y = mistK.y; MIST.z = mistK.h * (1 + 0.8 * lift); MIST.w = 45;
    World.dew(on && atmos.season !== 'winter' ? 1 - 0.6 * lift : 0);
  }

  const _stD = new THREE.Vector3();
  function boltBuild(az) {
    // the channel: from the cloud base down below the horizon, at a unit distance (x across the view, y up), each half of a segment pushed
    // aside by a share of its length (the zigzag at every scale); a few branches off it, fainter and thinner
    const sub = (a, b, d, out) => { if (d === 0) { out.push(b); return; } const L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = [(a[0] + b[0]) / 2 + (Math.random() - 0.5) * L * 0.5, (a[1] + b[1]) / 2 + (Math.random() - 0.5) * L * 0.12]; sub(a, m, d - 1, out); sub(m, b, d - 1, out); };
    const top = [(Math.random() - 0.5) * 0.1, 0.38 + Math.random() * 0.14], end = [top[0] + (Math.random() - 0.5) * 0.3, -0.04], main = [top]; sub(top, end, 6, main);
    const lines = [[main, 0.0062, 1]];
    for (let k = 0, nb = 2 + Math.floor(Math.random() * 4); k < nb; k++) {
      const a = main[4 + Math.floor(Math.random() * 44)], L = 0.05 + Math.random() * 0.15, sd = Math.random() < 0.5 ? -1 : 1, br = [a];
      sub(a, [a[0] + sd * L * (0.5 + Math.random() * 0.7), a[1] - L], 4, br); lines.push([br, 0.0034, 0.5]);
    }
    const P = [], G = [], I = [], idx = [], F = [Math.cos(az), 0, Math.sin(az)], Rt = [-Math.sin(az), 0, Math.cos(az)];
    const at = (x, y) => [F[0] + Rt[0] * x, y, F[2] + Rt[2] * x];
    for (const [pts, hw0, k] of lines) for (let i = 0; i + 1 < pts.length; i++) {
      const p = pts[i], q = pts[i + 1], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, hw = hw0 * (k < 1 ? 1 - 0.7 * i / pts.length : 1), nx = -dy / l * hw, ny = dx / l * hw, b = P.length / 3;
      for (const [x, y, g] of [[p[0] - nx, p[1] - ny, -1], [p[0] + nx, p[1] + ny, 1], [q[0] - nx, q[1] - ny, -1], [q[0] + nx, q[1] + ny, 1]]) { P.push(...at(x, y)); G.push(g); I.push(k); }
      idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
    if (!stm.bolt) {
      const mat = new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 } }, depthWrite: false, depthTest: true, fog: false, transparent: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        vertexShader: 'attribute float aG; attribute float aI; varying float vG; varying float vI; void main(){ vG = aG; vI = aI; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform float uA; varying float vG; varying float vI; void main(){ float c = exp(-vG * vG * 16.0) + 0.3 * exp(-vG * vG * 2.5); gl_FragColor = vec4(vec3(0.84, 0.88, 1.0) * c * uA * vI, 1.0); }' });
      stm.bolt = new THREE.Mesh(new THREE.BufferGeometry(), mat); stm.bolt.frustumCulled = false; stm.bolt.renderOrder = -50; stm.bolt.visible = false; stm.bolt.matrixAutoUpdate = true;   // (after the sky, before everything else: what stands in front hides it)
      scene.add(stm.bolt);
    }
    stm.bolt.geometry.dispose(); const g = stm.bolt.geometry = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));   // (a new one every strike: the old one's buffers freed)
    g.setAttribute('aG', new THREE.Float32BufferAttribute(G, 1)); g.setAttribute('aI', new THREE.Float32BufferAttribute(I, 1)); g.setIndex(idx);
  }
  function stormStrike(ahead) {   // (ahead: tests, a bolt right where the camera looks)
    const km = 0.7 + Math.random() * 6.5, A = clamp(1.25 - km / 7, 0.3, 1), n = 1 + Math.floor(Math.random() * 3.6), seq = []; let t = 0;
    for (let k = 0; k < n; k++) { seq.push([t, A * (k ? 0.45 + Math.random() * 0.5 : 1)]); t += 0.05 + Math.random() * 0.11; }   // (the return strokes down the same channel)
    camera.getWorldDirection(_stD); let az = Math.atan2(_stD.z, _stD.x); az += ahead ? (Math.random() - 0.5) * 0.3 : Math.random() < 0.65 ? (Math.random() - 0.5) * 1.3 : Math.random() * 6.283;   // (mostly where the camera looks)
    stm.boltOn = !!ahead || km < 5 && Math.random() < 0.7;   // (to the ground and near enough to be seen; else a flash in the clouds, dimmer)
    if (stm.boltOn) boltBuild(az); else for (const q of seq) q[1] *= 0.55;
    stm.seq = seq; stm.t = 0; stm.n++;
    const e = camera.matrixWorld.elements, pan = clamp(Math.cos(az) * e[0] + Math.sin(az) * e[2], -1, 1) * 0.7;   // (the camera's right)
    if (stm.cb) stm.cb(km / 0.343, clamp(1.15 - km / 6.5, 0.15, 1), pan);
  }
  function stormStep(dt) {
    const R = curRace, rr = R ? R.rain || 0 : 0, on = !!(R && R.sky && R.sky.storm) && rr > 0.05;
    if (on !== stm.on) { stm.on = on; if (wet >= 0) applyTheme(themeId); if (!on) stm.next = 5; }   // (the storm's darker sky)
    // the wind: a storm's gusting gale (the stronger the harder it pours), a breeze in the rain, else calm
    const gu = Math.max(0, Math.sin(time * 0.31) * Math.sin(time * 0.117 + 0.6)), want = on ? 1.4 + rr * (0.5 + 1.0 * gu) : 1 + 0.4 * Math.max(0, wet);
    stm.wind += (want - stm.wind) * Math.min(1, dt * 0.8); World.wind(stm.wind, atmos.season === 'winter' ? 0 : 1);
    // the flash: first undo the last frame's (unless the light has been set anew since: then that is the base)
    const W = stm.w;
    if (W) {
      if (hemi.intensity === W.hi) hemi.intensity = stm.base.hi;
      if (hemi.color.equals(W.hc)) hemi.color.copy(stm.base.hc);
      if (scene.fog.color.equals(W.fog)) { scene.fog.color.copy(stm.base.fog); renderer.setClearColor(scene.fog.color, 1); }
      stm.w = null;
    }
    let f = 0;
    if (on && atmos.season !== 'winter') {
      if (stm.seq) { stm.t += dt; for (const [t0, a] of stm.seq) if (stm.t >= t0) f = Math.max(f, a * Math.exp(-(stm.t - t0) / 0.055)); if (stm.t > stm.seq[stm.seq.length - 1][0] + 0.45) { stm.seq = null; f = 0; } }
      else if ((stm.next -= dt) <= 0) { stm.next = (4 + Math.random() * 12) / (0.6 + 0.4 * rr); stormStrike(); }
    } else stm.seq = null;
    stm.f = f;
    if (stm.bolt) { const B = stm.bolt; B.visible = f > 0.03 && stm.boltOn; if (B.visible) { B.position.copy(camera.position); B.scale.setScalar(camera.far * 0.62); B.material.uniforms.uA.value = Math.min(1.2, f * 1.7); } }
    if (f > 0.005) {
      stm.base.hi = hemi.intensity; stm.base.hc.copy(hemi.color); stm.base.fog.copy(scene.fog.color);
      const nt = atmos.tod === 'night' && !whiteNight();
      hemi.intensity += f * (nt ? 0.9 : 1.15); hemi.color.lerp(_c2.setHex(0xdde4ff), f * 0.6); scene.fog.color.lerp(_c2.setHex(nt ? 0x6f7795 : 0xc6cde4), f * (nt ? 0.6 : 0.55)); renderer.setClearColor(scene.fog.color, 1);
      stm.w = { hi: hemi.intensity, hc: hemi.color.clone(), fog: scene.fog.color.clone() };
    }
  }

  function skyStep(on) {
    if (!sky) {
      if (!on) return;
      const u = { uBot: { value: new THREE.Color() }, uTop: { value: new THREE.Color() }, uSun: { value: new THREE.Vector3(0, 1, 0) }, uSunC: { value: new THREE.Color() }, uSunA: { value: 0 }, uAur: { value: 0 }, uT: { value: 0 },
        uCld: { value: 0 }, uCO: { value: new THREE.Vector2() }, uCB: { value: 1 }, uStar: { value: 0 }, uMoon: { value: new THREE.Vector3(0, 1, 0) }, uMoonA: { value: 0 },
        uMw: { value: 0 }, uMwN: { value: MW_N }, uMwT1: { value: MW_T1 }, uMwT2: { value: MW_T2 }, uBow: { value: 0 }, uBowD: { value: new THREE.Vector3(0, -1, 0) } };
      const mat = new THREE.ShaderMaterial({ uniforms: u, depthWrite: false, depthTest: false, fog: false, side: THREE.BackSide,
        vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform vec3 uBot; uniform vec3 uTop; uniform vec3 uSun; uniform vec3 uSunC; uniform float uSunA; uniform float uAur; uniform float uT; uniform float uCld; uniform vec2 uCO; uniform float uCB; varying vec3 vD;' +
          'uniform float uStar; uniform vec3 uMoon; uniform float uMoonA; uniform float uMw; uniform vec3 uMwN; uniform vec3 uMwT1; uniform vec3 uMwT2; uniform float uBow; uniform vec3 uBowD;' +
          // (the clouds' noise: value noise with a 64-cell period, so the drifting offset wraps without a seam)
          'float cH(vec2 i) { i = mod(i, 64.0); return fract(sin(dot(i, vec2(12.9898, 78.233))) * 43758.5453); }' +
          'float cN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(cH(i), cH(i + vec2(1.0, 0.0)), f.x), mix(cH(i + vec2(0.0, 1.0)), cH(i + 1.0), f.x), f.y); }' +
          'float cF(vec2 p) { return 0.5 * cN(p) + 0.25 * cN(p * 2.0 + 13.0) + 0.125 * cN(p * 4.0 + 7.0) + 0.0625 * cN(p * 8.0 + 3.0); }' +
          // a star: one in each 3D cell the dome passes through (no seams anywhere on it), away from the cell's walls; its brightness, twinkling
          'float sH(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }' +
          'vec3 sH3(vec3 p) { return fract(sin(vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)))) * 43758.5453); }' +
          'float star(vec3 d, float K, float dens, float sz) { vec3 p = d * K, c = floor(p); float h = sH(c); if (h > dens) return 0.0;' +
          '  vec3 q = p - c - (0.25 + 0.5 * sH3(c)); q -= d * dot(q, d); float b = fract(h * 97.31);' +
          '  return exp(-dot(q, q) * sz) * (0.25 + 0.75 * b * b) * (0.75 + 0.25 * sin(uT * (2.0 + 5.0 * b) + h * 811.0)); }' +
          // the rainbow's colours across the bow: violet inside (t 0) to red outside (t 1)
          'vec3 bowCol(float t) { return clamp(abs(fract((1.0 - t) * 0.78 + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }' +
          'void main(){ vec3 d = normalize(vD); vec3 c = mix(uBot, uTop, pow(smoothstep(0.0, 0.85, d.y), 0.75)); float s = max(dot(d, uSun), 0.0);' +
          ' c += uSunC * uSunA * (pow(s, 90.0) * 0.8 + pow(s, 8.0) * 0.15);' +
          // the night sky (behind the clouds): the Milky Way, the stars (more of them in the Milky Way), the moon with its halo; all fainter low down
          ' float hz = smoothstep(0.0, 0.25, d.y), mw = 0.0;' +
          ' if (uMw > 0.0) { float b = dot(d, uMwN); mw = exp(-b * b / 0.02); vec2 mq = vec2(atan(dot(d, uMwT2), dot(d, uMwT1)) * 10.186, b * 26.0);' +
          '  c += vec3(0.5, 0.56, 0.72) * mw * (0.3 + 0.7 * cF(mq * 1.2 + 5.0)) * uMw * 0.16 * hz; }' +
          ' if (uStar > 0.0) c += vec3(0.88, 0.93, 1.0) * (star(d, 170.0, 0.07, 26.0) * 1.2 + star(d, 330.0, 0.05 + 0.3 * mw * uMw, 40.0) * 0.55) * uStar * hz;' +
          ' if (uMoonA > 0.0) { float m = dot(d, uMoon);' +
          '  if (m > 0.99) { vec3 t1 = normalize(cross(uMoon, vec3(0.0, 1.0, 0.0))), t2 = cross(t1, uMoon); vec2 mp = vec2(dot(d, t1), dot(d, t2)) / 0.021; float rr = dot(mp, mp);' +
          '   if (rr < 1.15) { float disc = smoothstep(1.0, 0.86, rr), limb = sqrt(max(0.0, 1.0 - rr)), mar = cF(mp * 2.2 + 7.0);' +
          '    c = mix(c, vec3(1.0, 0.97, 0.88) * (0.72 + 0.28 * limb) * (1.0 - 0.32 * smoothstep(0.42, 0.62, mar)) * 0.98, disc * uMoonA); } }' +
          '  float mh = max(m, 0.0); c += vec3(0.5, 0.58, 0.78) * uMoonA * (pow(mh, 1500.0) * 0.35 + pow(mh, 90.0) * 0.1); }' +
          ' if (uCld > 0.0 && d.y > 0.0) { vec2 q = d.xz / (d.y + 0.12) * 1.6 + uCO; float n = cF(q);' +
          '  float cov = smoothstep(0.62 - 0.22 * uCld, 0.8 - 0.2 * uCld, n) * smoothstep(0.0, 0.2, d.y);' +
          '  float lit = clamp((n - cF(q + uSun.xz * 0.35)) * 3.0 + 0.6, 0.0, 1.0);' +
          '  vec3 cc = mix(vec3(0.64, 0.68, 0.77), vec3(1.0, 0.99, 0.96), lit) * mix(vec3(1.0), uSunC, 0.25) * uCB;' +
          '  c = mix(c, mix(cc, uBot, 1.0 - smoothstep(0.0, 0.35, d.y)), cov); }' +
          // the aurora: curtains in a band over the northern sky (-z), folded along the horizon and drifting; green below, violet at the top
          ' if (uAur > 0.0) { float az = atan(d.x, -d.z), h = d.y, w = sin(az * 3.0 + uT * 0.05) * 0.6 + sin(az * 7.0 - uT * 0.08) * 0.25;' +
          '  float band = smoothstep(0.08, 0.2 + 0.05 * w, h) * (1.0 - smoothstep(0.3 + 0.1 * w, 0.62 + 0.08 * w, h)) * smoothstep(0.15, -0.55, d.z);' +
          '  float ray = 0.55 + 0.45 * sin(az * 55.0 + w * 9.0 + uT * 0.35) * sin(az * 23.0 - uT * 0.21);' +
          '  vec3 ac = mix(vec3(0.12, 0.95, 0.5), vec3(0.62, 0.28, 0.9), smoothstep(0.28, 0.55, h));' +
          '  c += ac * band * ray * uAur * 0.75; }' +
          // the rainbow after the rain (in front of the clouds): round the point opposite the sun, 40-42.6 degrees out, red outside; a faint
          // second bow at 50-53.4 degrees, its colours the other way round
          ' if (uBow > 0.0 && d.y > 0.0) { float a = acos(clamp(dot(d, uBowD), -1.0, 1.0)) * 57.2958, t1 = (a - 40.4) / 2.2, t2 = (53.4 - a) / 3.4; vec3 bc = vec3(0.0);' +
          '  if (t1 > 0.0 && t1 < 1.0) bc += bowCol(t1) * sin(t1 * 3.1416);' +
          '  if (t2 > 0.0 && t2 < 1.0) bc += bowCol(t2) * sin(t2 * 3.1416) * 0.35;' +
          '  c += bc * uBow * 0.32 * smoothstep(0.0, 0.1, d.y); }' +
          ' gl_FragColor = vec4(c, 1.0); }' });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), mat); mesh.frustumCulled = false; mesh.renderOrder = -100;   // (drawn first, under everything)
      scene.add(mesh); sky = { mesh, u };
    }
    sky.mesh.visible = !!on;
    if (!on) return;
    const r = Math.max(0, wet), U = sky.u, night = atmos.tod === 'night', dusk = atmos.tod === 'dusk', dawn = atmos.tod === 'dawn';
    const wn = whiteNight(); skyCols(U.uBot.value, U.uTop.value);
    U.uAur.value = aur.on ? 1 : 0; U.uT.value = time % 1000;
    const th = THEMES[themeId], dark = night && !wn; U.uCld.value = th && th.clouds ? th.clouds * (1 - r) : 0; U.uCB.value = wn ? 0.8 : dark ? 0.09 : dusk ? 0.85 : dawn ? 0.92 : 1;   // (at night dark clouds, the moon lighting their edges, hiding stars)
    U.uCO.value.set((time * 0.004) % 64, (time * 0.0015) % 64);   // (the clouds drift slowly with the wind)
    const sl = Math.hypot(sunOff[0], sunOff[1], sunOff[2]); U.uSun.value.set(sunOff[0] / sl, sunOff[1] / sl, sunOff[2] / sl);
    U.uSunC.value.copy(sun.color); U.uSunA.value = (dark ? 0 : dusk ? 1.3 : dawn ? 1.2 : 1) * (1 - 0.85 * r);   // (at night the moon instead)
    // the night sky: the stars (the first ones at dusk; none by day or in the white night), the Milky Way on a clear night, the moon (at night
    // in the moonlight's direction, low enough to be seen through the windscreen; at dusk and in the white night pale, opposite the sun)
    U.uStar.value = (dark ? 1 : dusk ? 0.15 : dawn ? 0.06 : 0) * (1 - r);   // (dawn: the last stars) U.uMw.value = dark ? (1 - r) * (aur.on ? 0.7 : 1) : 0;
    { const az = Math.atan2(sunOff[2], sunOff[0]) + (dark ? 0 : Math.PI), el = dark ? 0.26 : 0.15;
      U.uMoonA.value = (dark ? 1 : wn ? 0.6 : dusk ? 0.45 : dawn ? 0.35 : 0) * (1 - r); U.uMoon.value.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)); }
    // the rainbow (bow.a, see frame): round the point opposite the sun, as if the sun were low (else, under a high sun, the bow would be under the horizon)
    U.uBow.value = bow.a; if (bow.a > 0) { const az = Math.atan2(sunOff[2], sunOff[0]) + Math.PI, el = -0.17; U.uBowD.value.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)); }
    sky.mesh.position.copy(camera.position); sky.mesh.scale.setScalar(camera.far * 0.8);
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
    if (ck.grp) { ck.grp.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map && !(ckM.rt && o.material.map === ckM.rt.texture)) o.material.map.dispose(); o.material.dispose(); } }); ck.scene.remove(ck.grp); }   // (not the mirror's picture)
    if (!ck.scene) {
      ck.scene = new THREE.Scene(); ck.cam = new THREE.PerspectiveCamera(50, 1, 0.03, 6); ck.scene.add(ck.cam);
      ck.hemi = new THREE.HemisphereLight(0xffffff, 0x404040, 0.6); ck.dir = new THREE.DirectionalLight(0xffffff, 0.8); ck.scene.add(ck.hemi, ck.dir, ck.dir.target);
    }
    ck.key = key; const g = ck.grp = new THREE.Group(); ck.scene.add(g); const P = {}; ck.parts = P;
    const body = colArr(c.color), paint = new THREE.Color(body[0], body[1], body[2]);
    const trim = new THREE.MeshLambertMaterial({ color: 0x1d1e21 }), dark = new THREE.MeshLambertMaterial({ color: 0x111214 }), metal = new THREE.MeshLambertMaterial({ color: 0x5a5e66 });
    const wheel = new THREE.Group(), turn = new THREE.Group(); wheel.add(turn); g.add(wheel); P.turn = turn;
    if (E.formula) {
      // the formula's wheel: a carbon plate with two grips, the display in the middle, the shift lights along the top, knobs
      wheel.position.set(0, -0.19, -0.42); wheel.lookAt(0, 0.02, 0);
      turn.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.11, 0.028), dark));
      for (const sd of [-1, 1]) { const gr = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.13, 10), new THREE.MeshLambertMaterial({ color: 0x0a0a0b })); gr.position.set(sd * 0.115, -0.005, 0); gr.rotation.z = sd * 0.12; turn.add(gr); }
      const scr = P.scr = ckScreen(128, 80), disp = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.044), new THREE.MeshBasicMaterial({ map: scr.t })); disp.position.set(0, 0.004, 0.0145); turn.add(disp);
      P.leds = []; const LC = [0x19e05a, 0x19e05a, 0x19e05a, 0x19e05a, 0x19e05a, 0xff2a1a, 0xff2a1a, 0xff2a1a, 0xff2a1a, 0xff2a1a, 0x3a6bff, 0x3a6bff, 0x3a6bff, 0x3a6bff, 0x3a6bff];
      for (let k = 0; k < 15; k++) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.0085, 0.0085, 0.004), new THREE.MeshBasicMaterial({ color: 0x1a1c20 })); l.position.set((k - 7) * 0.0112, 0.045, 0.0145); l.userData.on = new THREE.Color(LC[k]); turn.add(l); P.leds.push(l); }
      for (const [x, y, col] of [[-0.062, -0.03, 0xffd23f], [0.062, -0.03, 0x19a7ff], [-0.062, 0.018, 0xff5a1f], [0.062, 0.018, 0xe8e8e8]]) { const kb = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.01, 10), new THREE.MeshLambertMaterial({ color: col })); kb.rotation.x = Math.PI / 2; kb.position.set(x, y, 0.017); turn.add(kb); }
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 8), dark); col.rotation.x = Math.PI / 2; col.position.set(0, -0.3, -0.62); g.add(col);   // (the column, under the wheel)
    } else {
      // a closed car: the dashboard (its top from the wheel to the windscreen), the instruments, the wheel; the windscreen's pillars, the
      // roof's edge with the mirror, the doors' tops in the car's colour
      const dash = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.5, 0.62), new THREE.MeshLambertMaterial({ color: 0x34363b })); dash.position.set(0, -0.565, -0.76); g.add(dash);
      const lip = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.03, 0.08), dark); lip.position.set(0, -0.31, -1.03); g.add(lip);
      // the instruments facing the driver: a dark panel, the rev counter and the speedometer, the gear between them, a visor over them
      const clu = new THREE.Group(); clu.position.set(0, -0.258, -0.655); clu.lookAt(0, 0, 0); g.add(clu);
      clu.add(new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.118), new THREE.MeshLambertMaterial({ color: 0x0b0c0e })));
      const vis = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.012, 0.085), dark); vis.position.set(0, 0.064, 0.036); vis.rotation.x = 0.22; clu.add(vis);
      const red = (M.redline || 7000), tMax = Math.ceil(red / 1000 + 0.5);
      P.dials = [];
      for (const [x, max, step, rz, lab] of [[-0.06, tMax, 1, (red / 1000) / tMax, 'x1000 RPM'], [0.06, 260, 40, null, 'KM/H']]) {
        const d = new THREE.Mesh(new THREE.CircleGeometry(0.047, 36), new THREE.MeshBasicMaterial({ map: ckDial(max, step, rz, lab), color: 0xdddddd })); d.position.set(x, 0, 0.002); clu.add(d);
        const n = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.0028, 0.001).translate(0.016, 0, 0), new THREE.MeshBasicMaterial({ color: 0xff3b1f })); n.position.z = 0.002; d.add(n);
        const hub = new THREE.Mesh(new THREE.CircleGeometry(0.0055, 12), new THREE.MeshBasicMaterial({ color: 0x2a2c30 })); hub.position.z = 0.003; d.add(hub);
        P.dials.push({ n, max: x < 0 ? tMax * 1000 : 260 });
      }
      const scr = P.scr = ckScreen(64, 64), gd = new THREE.Mesh(new THREE.PlaneGeometry(0.022, 0.022), new THREE.MeshBasicMaterial({ map: scr.t })); gd.position.set(0, -0.03, 0.002); clu.add(gd);
      wheel.position.set(0, -0.375, -0.47); wheel.lookAt(0, 0.1, 0);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.019, 8, 40), new THREE.MeshLambertMaterial({ color: 0x151517 })); turn.add(rim);
      const mark = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.042, 0.04), new THREE.MeshLambertMaterial({ color: 0xffc21a })); mark.position.set(0, 0.18, 0); turn.add(mark);   // (the top of the wheel: a racing wheel's marker)
      for (const a of [0, Math.PI, -Math.PI / 2]) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.034, 0.012).translate(0.085, 0, 0), metal); sp.rotation.z = a; turn.add(sp); }
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.035, 18), dark); hub.rotation.x = Math.PI / 2; hub.position.z = 0.01; turn.add(hub);
      const badge = new THREE.Mesh(new THREE.CircleGeometry(0.022, 18), new THREE.MeshLambertMaterial({ color: paint })); badge.position.z = 0.029; turn.add(badge);
      for (const sd of [-1, 1]) {
        g.add(ckBar([sd * 0.8, -0.31, -1.0], [sd * 0.64, 0.33, -0.48], 0.075, 0.06, trim));   // the pillars
        const door = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 1.3), new THREE.MeshLambertMaterial({ color: paint.clone().multiplyScalar(0.7) })); door.position.set(sd * 0.74, -0.37, -0.4); g.add(door);
      }
      if (M.body === 'rally') {   // the rally car's roll cage: tubes up the pillars and over the windscreen
        const cage = new THREE.MeshLambertMaterial({ color: 0xc9ccd1 }), T2 = 0.034;
        for (const sd of [-1, 1]) g.add(ckBar([sd * 0.7, -0.33, -0.9], [sd * 0.56, 0.3, -0.42], T2, T2, cage));
        g.add(ckBar([-0.56, 0.3, -0.42], [0.56, 0.3, -0.42], T2, T2, cage));
      }
      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.2), trim); roof.position.set(0, 0.3, -0.5); g.add(roof);
      const mcv = document.createElement('canvas'); mcv.width = 64; mcv.height = 32; const mx = mcv.getContext('2d'), mg = mx.createLinearGradient(0, 0, 0, 32);
      mg.addColorStop(0, '#9fb6c8'); mg.addColorStop(0.48, '#c9d6de'); mg.addColorStop(0.52, '#4a4d50'); mg.addColorStop(1, '#2a2c2e'); mx.fillStyle = mg; mx.fillRect(0, 0, 64, 32);
      const mir = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.055, 0.018), dark); mir.position.set(0, 0.215, -0.52); mir.lookAt(0, 0, 0); g.add(mir);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.195, 0.042), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(mcv), color: 0xb0b0b0 })); glass.position.z = 0.0095; mir.add(glass);
      P.mirG = glass; glass.userData.map0 = glass.material.map;   // (high quality: the view behind on it, ckMirror)
      g.add(ckBar([0, 0.265, -0.5], [0, 0.23, -0.515], 0.02, 0.02, dark));
      g.add(ckGlass());   // (the windscreen: the rain, the snow and the dust on it, the wipers)
    }
    P.formula = E.formula;
    ckHands(P, turn, g, paint, E.formula);
  }
  // the driver's hands on the wheel: gloves gripping the rim at ten to two (the formula's grips), turning with it; the forearms in the suit
  // (the car's colour, darker) from the gloves back to the elbows below the view (ckStep stretches them every frame)
  function ckHands(P, turn, g, paint, formula) {
    const glove = new THREE.MeshLambertMaterial({ color: 0x1b1c1f }), cuff = new THREE.MeshLambertMaterial({ color: paint.clone().multiplyScalar(0.85) }), suit = new THREE.MeshLambertMaterial({ color: paint.clone().multiplyScalar(0.55) });
    P.hands = [];
    for (const sd of [-1, 1]) {
      const h = new THREE.Group();
      if (formula) h.position.set(sd * 0.115, -0.005, 0.012); else { const a = sd < 0 ? Math.PI * 0.83 : Math.PI * 0.17; h.position.set(Math.cos(a) * 0.18, Math.sin(a) * 0.18, 0); h.rotation.z = a - Math.PI / 2 * sd; }
      const fist = new THREE.Mesh(new THREE.SphereGeometry(0.044, 12, 9), glove); fist.scale.set(1.2, 0.9, 1); fist.position.z = 0.014; h.add(fist);   // (the fist round the rim)
      const knuck = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.036, 0.026), glove); knuck.position.set(0, 0.008, 0.04); h.add(knuck);
      const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.014, 0.055, 6), glove); thumb.position.set(-sd * 0.025, 0.027, 0.026); thumb.rotation.z = -sd * 0.9; h.add(thumb);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.037, 0.037, 0.03, 10), cuff); band.position.set(0, -0.004, -0.036); band.rotation.x = Math.PI / 2; h.add(band);
      turn.add(h);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1, 9), suit); g.add(arm);
      P.hands.push({ h, arm, elbow: new THREE.Vector3(sd * (formula ? 0.26 : 0.3), formula ? -0.52 : -0.66, formula ? -0.1 : -0.12) });
    }
  }
  const _hw = new THREE.Vector3(), _hd = new THREE.Vector3(), _hy = new THREE.Vector3(0, 1, 0);
  function ckHandsStep(P) {
    if (!P.hands) return;
    ck.grp.updateMatrixWorld(true);
    for (const H of P.hands) {
      _hw.set(0, -0.004, -0.052).applyMatrix4(H.h.matrixWorld);   // (the wrist, behind the cuff)
      _hd.subVectors(_hw, H.elbow); const L = _hd.length();
      H.arm.position.copy(H.elbow).addScaledVector(_hd, 0.5); H.arm.quaternion.setFromUnitVectors(_hy, _hd.normalize()); H.arm.scale.set(1, L, 1);
    }
  }
  // the rear-view mirror (high quality): the view behind the car drawn into a small picture every other frame (from above its tail, so the
  // car itself is not in it; the shadows as they are), mirrored on the glass. Otherwise its plain picture
  const ckM = { rt: null, cam: null, n: 0 };
  function ckMirror(c, v) {
    const P = ck.parts, G = P && P.mirG; if (!G || !v) return;
    if (settings.quality !== 'high') { if (G.material.map !== G.userData.map0) { G.material.map = G.userData.map0; G.material.color.setHex(0xb0b0b0); G.material.needsUpdate = true; } return; }
    if (!ckM.rt) {
      ckM.rt = new THREE.WebGLRenderTarget(256, 64, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat }); ckM.rt.texture.generateMipmaps = false;
      ckM.rt.texture.repeat.x = -1; ckM.rt.texture.offset.x = 1;   // (a mirror: left and right swapped)
      ckM.cam = new THREE.PerspectiveCamera(12, 4, 0.5, 400);
    }
    if (G.material.map !== ckM.rt.texture) { G.material.map = ckM.rt.texture; G.material.color.setHex(0xffffff); G.material.needsUpdate = true; }
    if ((ckM.n++ & 1) === 0) return;
    const M = c.m; _ckE.set(-M.len * 0.5 - 0.4, 1.3, 0).applyMatrix4(v.grp.matrixWorld); ckM.cam.position.copy(_ckE);
    _ckE.set(-M.len * 0.5 - 40, 0.4, 0).applyMatrix4(v.grp.matrixWorld); ckM.cam.lookAt(_ckE); ckM.cam.far = camera.far;
    const au = renderer.shadowMap.autoUpdate, prev = renderer.getRenderTarget(); renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(ckM.rt); renderer.render(scene, ckM.cam); renderer.setRenderTarget(prev); renderer.shadowMap.autoUpdate = au;
  }
  // the windscreen of a closed car (the cockpit view): drawn over the world through it, between the pillars. On it the rain's drops (beads
  // that settle, blown up the glass the faster the car goes; at speed streaks of water running up it), in the snow flakes that melt after
  // a few seconds and snow piled at the bottom and in the corners, on gravel a film of dust (thicker toward the edges); the two wipers sweep
  // in the rain and the snow (in light rain now and then) and clear their arcs (the corners stay), the washer and the wipers when the dust
  // gets thick. All of it in the shader, in metres on the glass (across, and up its slope from the bottom edge): the wipers' arcs and the
  // time since a blade last passed each point are worked out from their motion
  const ckG = { u: null, tc: 1.15, idle: 0, dustP: 0, dustS: 0, wash: 0, snow: 0 };   // (tc: into the wipers' cycle; 1.15: at rest)
  function ckGlass() {
    if (!ckG.u) ckG.u = { uT: { value: 0 }, uRain: { value: 0 }, uSnow: { value: 0 }, uSpd: { value: 0 }, uWt: { value: 0 }, uWT: { value: 1.15 }, uWC: { value: 1.15 }, uWOn: { value: 0 }, uWIdle: { value: 0 },
      uDustA: { value: 0 }, uDustS: { value: 0 }, uWash: { value: 0 }, uLit: { value: 1 }, uSnowAcc: { value: 0 }, uDustC: { value: new THREE.Color(0.6, 0.53, 0.42) } };
    const geo = new THREE.BufferGeometry(), P4 = [[-0.78, -0.3, -0.985], [0.78, -0.3, -0.985], [0.62, 0.315, -0.49], [-0.62, 0.315, -0.49]];
    geo.setAttribute('position', new THREE.Float32BufferAttribute([...P4[0], ...P4[1], ...P4[2], ...P4[0], ...P4[2], ...P4[3]], 3));
    const m = new THREE.ShaderMaterial({ uniforms: ckG.u, transparent: true, depthWrite: false,
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: CK_GLASS });
    const mesh = new THREE.Mesh(geo, m); mesh.renderOrder = 5; mesh.frustumCulled = false; mesh.name = 'ckGlass';
    return mesh;
  }
  const CK_GLASS = ['uniform float uT; uniform float uRain; uniform float uSnow; uniform float uSpd; uniform float uWt; uniform float uWT; uniform float uWC; uniform float uWOn; uniform float uWIdle;',
    'uniform float uDustA; uniform float uDustS; uniform float uWash; uniform float uLit; uniform float uSnowAcc; uniform vec3 uDustC; varying vec3 vP;',
    'float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'vec2 h2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }',
    'float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h1(i), h1(i + vec2(1.0, 0.0)), f.x), mix(h1(i + vec2(0.0, 1.0)), h1(i + 1.0), f.x), f.y); }',
    // the time since the blade last passed angle phi of its arc: the sweep up and back takes the first uWT of each cycle uWC (the passes
    // up and down at t1 and t2 into it); stopped, the time since then added
    'float since(float phi) {',
    '  float k = clamp(phi / 1.85, 0.0, 1.0), t1 = uWT * acos(1.0 - 2.0 * k) / 6.2832, t2 = uWT - t1, tc = uWt;',
    '  return (tc >= t2 ? tc - t2 : tc >= t1 ? tc - t1 : tc + uWC - t2) + uWIdle; }',
    // a wiper: its arc (the blade from r0 to r1 out from the pivot, 0 to 1.85 rad from lying along the bottom) and the blade where it is now
    'void wiper(vec2 p, vec2 piv, float r0, float r1, inout float sw, inout float bl) {',
    '  vec2 d = p - piv; float r = length(d), a = atan(d.y, d.x);',
    '  if (r > r0 && r < r1 && a >= 0.0 && a <= 1.85) sw = min(sw, since(a));',
    '  float th = uWt < uWT ? 1.85 * (0.5 - 0.5 * cos(6.2832 * uWt / uWT)) : 0.0;',
    '  vec2 dir = vec2(cos(th), sin(th)), nrm = vec2(-dir.y, dir.x); float al = dot(d, dir), ac = dot(d, nrm);',
    '  if (al > r0 && al < r1) bl = max(bl, smoothstep(0.011, 0.006, abs(ac)));',   // (the rubber blade)
    '  if (al > -0.02 && al < r1 * 0.96) bl = max(bl, smoothstep(0.006, 0.003, abs(ac - 0.016)) * 0.9); }',   // (the arm beside it)
    'void main() {',
    '  vec2 p = vec2(vP.x, (vP.y + 0.3) * 1.285);',   // (metres on the glass)
    '  float sw = 1e4, bl = 0.0;',
    '  wiper(p, vec2(-0.55, 0.02), 0.12, 0.64, sw, bl); wiper(p, vec2(0.05, 0.02), 0.1, 0.58, sw, bl);',
    '  float swept = sw < 1e3 ? 1.0 : 0.0, dn = vn(p * 9.0) * 0.6 + vn(p * 23.0) * 0.4;',
    '  float edge = 1.0 - smoothstep(0.0, 0.25, min(min(p.x + 0.78, 0.78 - p.x), min(p.y, 0.79 - p.y)));',
    // the dust: in the wipers' arcs only what has settled since the last wash
    '  vec4 col = vec4(uDustC * (0.4 + 0.6 * uLit), clamp(mix(uDustA, uDustS, swept) * (0.65 + 0.35 * dn) * (0.8 + 0.4 * edge) * 0.75, 0.0, 0.8));',
    '  float fall = uRain + uSnow + uWash;',
    '  if (fall > 0.0) {',
    '    vec2 q = p / 0.028, ci = floor(q), cf = fract(q);',
    '    float per = mix(2.5, 0.9, uSpd) * (0.6 + 0.8 * h1(ci + 7.1)), age = mod(uT + h1(ci) * per, per);',   // (a drop in this cell every per seconds: its age)
    '    if (h1(ci + 3.3) < fall * 0.55 && age < sw) {',   // (one in this cell, landed since a blade last passed)
    '      vec2 mv = vec2((h1(ci + 5.0) - 0.5) * 0.3, 1.0) * uSpd * uSpd * age * age * 1.6, dd = cf - (0.25 + 0.5 * h2(ci)) - mv;',   // (blown up the glass)
    '      float rad = (0.12 + 0.18 * h1(ci + 9.0)) * (uSnow > 0.0 ? 1.3 : 1.0); dd.y /= 1.0 + uSpd * 1.8; float r = length(dd) / rad;',
    '      if (r < 1.0) {',
    '        if (uSnow > 0.0) col = mix(col, vec4(vec3(0.92, 0.95, 1.0) * (0.35 + 0.65 * uLit), 0.85), smoothstep(1.0, 0.4, r) * (1.0 - smoothstep(3.0, 6.0, age)));',   // (a flake: it melts)
    '        else { float rim = smoothstep(0.6, 1.0, r) * smoothstep(1.0, 0.85, r), hl = smoothstep(0.35, 0.0, length(dd / rad - vec2(-0.3, 0.35)));',   // (a bead: a dark rim, a glint)
    '          col = mix(col, vec4(vec3(0.05), 0.35), rim); col.rgb += vec3(0.85, 0.9, 1.0) * hl * (0.25 + 0.75 * uLit); col.a = max(col.a, hl * 0.7 + 0.12); } } }',
    '    if (uRain + uWash > 0.0 && uSpd > 0.3) { float cx = floor(p.x / 0.02), sy = fract(uT * (1.2 + h1(vec2(cx, 1.0))) * uSpd * 2.0 + h1(vec2(cx, 2.0))) * 1.2 - 0.2, ly = p.y / 0.79 - sy;',   // (streaks running up)
    '      if (ly > 0.0 && ly < 0.08 && h1(vec2(cx, 3.0)) < (uRain + uWash) * 0.6) col = mix(col, vec4(vec3(0.75, 0.8, 0.9) * (0.3 + 0.7 * uLit), 0.25), smoothstep(0.12, 0.0, abs(fract(p.x / 0.02) - 0.5)) * (1.0 - ly / 0.08)); }',
    '  }',
    '  if (uSnowAcc > 0.0) { float pile = smoothstep(0.1 * uSnowAcc + 0.01, 0.0, p.y) + (1.0 - swept) * smoothstep(0.15, 0.6, edge) * uSnowAcc * 0.8;',   // (snow piled up)
    '    col = mix(col, vec4(vec3(0.95, 0.97, 1.0) * (0.35 + 0.65 * uLit), 0.95), clamp(pile * (0.7 + 0.3 * dn), 0.0, 1.0)); }',
    '  if (bl > 0.0) col = mix(col, vec4(0.02, 0.02, 0.025, 1.0), bl);',
    '  gl_FragColor = col; }'].join('\n');
  // the windscreen as the weather is: the rain or the snow on it (from the race), the wipers' cycle, the dust from the car's own (its grime),
  // the washer when the dust gets thick, the snow piling up
  function ckGlassStep(c, v, dt) {
    const U = ckG.u; if (!U) return;
    const R = curRace, rr = R ? R.rain || 0 : 0, winter = atmos.season === 'winter', wetR = winter ? 0 : rr, snowR = winter ? rr : 0;
    const dust = v && v.cg ? v.cg.a.value.x : 0; ckG.dustS = Math.min(1, ckG.dustS + Math.max(0, dust - ckG.dustP) * 1.4); ckG.dustP = dust;
    if (ckG.dustS > 0.4 && ckG.wash <= 0 && wetR + snowR < 0.03) ckG.wash = 3.4;   // (the washer: three sweeps)
    if (ckG.wash > 0) { ckG.wash -= dt; ckG.dustS = Math.max(0, ckG.dustS - dt * 0.2); if (ckG.wash <= 0) { ckG.wash = 0; ckG.dustS = 0; } }
    const want = wetR + snowR > 0.03 || ckG.wash > 0, C = rr > 0.15 || ckG.wash > 0 ? 1.15 : 3.3;   // (light rain: a sweep now and then)
    if (want || ckG.tc < 1.15) { ckG.tc += dt; ckG.idle = 0; if (ckG.tc >= C) ckG.tc -= C; if (!want && ckG.tc >= 1.15) ckG.tc = 1.15; }   // (switched off: the sweep finished, they rest)
    else ckG.idle += dt;
    ckG.snow = clamp(ckG.snow + dt * (snowR > 0 ? snowR * 0.012 : -0.004), 0, 0.8);
    U.uT.value = time % 1000; U.uRain.value = wetR; U.uSnow.value = snowR; U.uSpd.value = clamp((c.speed || 0) / 40, 0, 1);
    U.uWt.value = ckG.tc; U.uWC.value = C; U.uWIdle.value = ckG.idle; U.uWOn.value = want ? 1 : 0;
    U.uDustA.value = Math.min(1, dust * 1.1); U.uDustS.value = ckG.dustS; U.uWash.value = ckG.wash > 0 ? 0.35 : 0; U.uSnowAcc.value = ckG.snow;
    if (v && v.cg) U.uDustC.value.copy(v.cg.dc.value);
    U.uLit.value = atmos.tod === 'night' ? (whiteNight() ? 0.8 : 0.3) : atmos.tod === 'dusk' ? 0.75 : atmos.tod === 'dawn' ? 0.85 : 1 - 0.15 * rr;
  }
  // the cockpit as the car is now: the wheel turned with the front wheels, the needles, the gear, the shift lights; lit as the world is
  function ckStep(c, v, dt) {
    ckBuild(c); if (!ck.parts.formula) { ckGlassStep(c, v, dt || 0); ckMirror(c, v); }
    const P = ck.parts, rpm = c.rpm || 0, red = c.m.redline || 7000;
    P.turn.rotation.z = -clamp((c.delta || 0) * 9, -2.4, 2.4);
    ckHandsStep(P);
    const gear = c.gear === -1 ? 'R' : c.gear === 0 ? 'N' : String(c.gear || 1);
    if (P.formula) {
      ckScreenSet(P.scr, gear, String(Math.round((c.speed || 0) * 3.6)));
      const n = Math.round(clamp((rpm / red - 0.72) / 0.26, 0, 1) * 15);
      for (let k = 0; k < 15; k++) P.leds[k].material.color.set(k < n ? P.leds[k].userData.on : 0x1a1c20);
    } else {
      P.dials[0].n.rotation.z = -(0.75 + 1.5 * clamp(rpm / P.dials[0].max, 0, 1)) * Math.PI;
      P.dials[1].n.rotation.z = -(0.75 + 1.5 * clamp((c.speed || 0) * 3.6 / P.dials[1].max, 0, 1)) * Math.PI;
      ckScreenSet(P.scr, gear, null, '#7ff0ff');
    }
    // the light: the world's sky and ground light; the sun from its side of the car (a closed car's roof shades the cabin)
    ck.hemi.color.copy(hemi.color); ck.hemi.groundColor.copy(hemi.groundColor); ck.hemi.intensity = hemi.intensity;
    ck.dir.color.copy(sun.color); ck.dir.intensity = sun.intensity * (P.formula ? 1 : 0.45);
    _ckF.set(sunOff[0], sunOff[1], sunOff[2]).normalize().applyQuaternion(_ckQ2.copy(camera.quaternion).invert()); ck.dir.position.copy(_ckF).multiplyScalar(3);   // (the sun as the camera sees it)
    ck.cam.fov = camera.fov; ck.cam.aspect = camera.aspect; ck.cam.updateProjectionMatrix();
    ck.cam.position.set(ck.sway, 0, 0); ck.cam.rotation.set(-eyeOf(c.m).tilt - (v ? v.pitch : 0), -ck.look, v ? v.roll : 0, 'YXZ');
  }

  function frame(dt, alpha, target, mode, opt) {
    time += dt;
    envUse('sky');   // (after the showroom: the cars mirror the world's sky again)
    updateCrew(dt);   // (first: it sets how far the player's car is up on the jacks)
    updateFlags();
    updateCars(dt, alpha, opt);
    { const v = target && hlc && hlc.mesh.visible ? viewOf(target) : null, I = v && v.hlI ? v.hlI : 0; HLB.uHB.value.w = I;   // (the followed car's beam lights the rain, the snow and the dust)
      if (I) { const L0 = v.lights[0], L1 = v.lights[1]; _lv.set((L0.x + L1.x) / 2, (L0.y + L1.y) / 2, 0).applyMatrix4(v.grp.matrixWorld); HLB.uHB.value.set(_lv.x, _lv.y, _lv.z, I); HLB.uHD.value.set(Math.cos(target.h), 0, Math.sin(target.h)); } }
    syncDebris(); syncProps();
    for (let k = 0; k < views.length; k++) { const v = views[k], c = v.car; if ((c.repairN || 0) !== v.repairN) {   // repaired in the pits: a fresh car (and a burst of sparkle)
      const nv = makeView(c); nv.sk = v.sk; nv.acc = v.acc; disposeView(v, debrisRes()); views[k] = nv;   // (its loose panels on the track stay drawable)
      for (let n = 0; n < 12; n++) sparkP.emit(c.x + (Math.random() - 0.5) * 3, (c.y || 0) + 0.4 + Math.random() * 1.2, c.z + (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2, 1 + Math.random() * 2, (Math.random() - 0.5) * 2, 0.4 + Math.random() * 0.3, 0.45, 0.8, 1, 0.95, 0.7, 0.7, -1, 1.2, c.y || 0); } }
    particles.update(dt); sparkP.update(dt); hazeP.points.visible = time < hazeT; if (hazeP.points.visible) hazeP.update(dt);
    if (leaves && leaves.points.visible) {   // the leaves (the petals): drifting down round the view, upwind of it; kicked up behind the cars (not the petals, not in the rain)
      if (target && dt > 0) {
        const petal = leafK.petal, G = world && world.groundH, y0 = target.y || 0, gy = (x, z) => { const h = G ? G(x, z) : NaN; return Number.isFinite(h) && Math.abs(h - y0) < 6 ? h : y0; };
        camera.getWorldDirection(_lfD); const fl = Math.hypot(_lfD.x, _lfD.z) || 1, ah = cam.ck || lastMode === 'kino' || lastMode === 'tv' ? 25 : 0;   // (round a point ahead in the views that look along the road)
        const cx = (cam.vcx != null ? cam.vcx : target.x) + _lfD.x / fl * ah, cz = (cam.vcz != null ? cam.vcz : target.z) + _lfD.z / fl * ah, T = curTrack;
        let rate = leafK.rate * (1 - 0.7 * Math.max(0, wet));
        if (petal && T) { let d = (target.q ? target.q.s : 0) - T.startS; d = ((d % T.len) + T.len) % T.len; if (!(d < 330 || d > T.len - 420)) rate *= 0.3; }   // (Suzuka: the cherries along the main straight)
        leafK.acc += dt * rate;
        while (leafK.acc >= 1) { leafK.acc -= 1;
          const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * leafK.R, x = cx + Math.cos(a) * r - HAZE_W[0] * 8, z = cz + Math.sin(a) * r - HAZE_W[1] * 8, f = gy(x, z), C = leafCol(petal);
          leaves.emit(x, f + 4 + Math.random() * 9, z, HAZE_W[0], 0, HAZE_W[1], 16 + Math.random() * 8, petal ? 0.3 + Math.random() * 0.15 : 0.28 + Math.random() * 0.17, C[0], C[1], C[2], f, petal ? 0.5 + Math.random() * 0.4 : 0.8 + Math.random() * 0.6);   // (larger than life: to be seen from the camera)
        }
        if (!petal && wet < 0.3 && !(opt && opt.noFx)) for (const v of views) { const c = v.car, sp = c.speed || 0; if (sp < 12 || c.air || Math.abs(c.x - cx) > 70 || Math.abs(c.z - cz) > 70) continue;
          v.lf = (v.lf || 0) + dt * (sp - 10) * 0.3;
          while (v.lf >= 1) { v.lf -= 1; const ch = Math.cos(c.h), sh = Math.sin(c.h), lat = (Math.random() - 0.5) * 2.2, f = c.y || 0, C = leafCol(false);
            leaves.emit(c.x - ch * 2.3 - sh * lat, f + 0.15, c.z - sh * 2.3 + ch * lat, -ch * sp * 0.12 + (Math.random() - 0.5) * 2, 2 + Math.random() * 3, -sh * sp * 0.12 + (Math.random() - 0.5) * 2, 7 + Math.random() * 5, 0.25 + Math.random() * 0.15, C[0], C[1], C[2], f, 0.8 + Math.random() * 0.6); } }
      }
      leaves.update(dt, HAZE_W[0], HAZE_W[1]);
    }
    World.update(world, time, target, camera);
    aurora(time);   // (a winter night in the north: the sky light pulses green)
    if (target) updateCamera(dt, target, mode, alpha);
    wetRefl();   // (the lights mirrored in the wet road: from where the camera is now)
    if (world && world.dyn.afterCam) world.dyn.afterCam(camera, target);   // (what depends on the camera of this very frame: Pikes Peak, which scenery chunks cast shadows)
    // (what stands between the camera and the followed car fades out: not from the driver's seat, nor in the intro's and the podium's
    // shots; in the photo mode toward the car in the picture)
    World.view(world, camera, cam.ck ? null : cam.shot ? (cam.shot.floor ? { x: cam.shot.tx, y: cam.shot.ty - 0.7, z: cam.shot.tz, px: cam.shot.tx, pz: cam.shot.tz } : null) : target, alpha);
    { const R = curRace, q = (v) => v > 0 ? Math.max(0.05, Math.round(v * 20) / 20) : 0;   // (a changing weather: in steps of 5 %)
      const r = R ? q(R.rain || 0) : 0, w = R ? q(R.water != null ? R.water : R.rain || 0) : 0;
      if (r !== wet) applyWeather(r); if (w !== wetW) applyRoad(w); dryLine(R); }
    roadMarksStep();   // (the race's marks on the road: rubber, marbles, standing water, oil)
    crowdMoments();   // (the crowd: the wave along with the leader, cheering at an overtake or a crash)
    liveStep(target, dt);   // (the timing pylon, the big screens: the race live)
    ledStep();   // (the LED boards)
    farStep();   // (the turbines turn, the warning lights blink)
    pitLStep(dt);   // (the pit board, the walkers, the scooter)
    // the rainbow: when the rain eases off by day (not at night, not in the snow), stronger as it stops, for 45 s after the last drop
    { const R = curRace, rr = R ? R.rain || 0 : 0, can = atmos.tod !== 'night' && atmos.season !== 'winter';
      if (rr < bow.prev - 1e-6 && rr < 0.5 && can) { if (!bow.on) bow.t = 0; bow.on = true; }   // (easing off)
      else if (rr > bow.prev + 1e-6) bow.on = false;   // (raining harder again)
      if (bow.on && rr === 0) { bow.t += dt; if (bow.t > 45) bow.on = false; }
      bow.prev = rr;
      const tgt = bow.on && can ? clamp(1 - rr * 1.6, 0, 1) : 0; bow.a += clamp(tgt - bow.a, -dt / 6, dt / 4); if (bow.a < 0.002) bow.a = 0; }
    if (birds.mesh.visible && target && world) birds.update(Math.min(dt, 0.1), cam.vcx || 0, cam.vcz || 0, world.groundH || (() => 0));
    if (snow.mesh.visible) { const U = snow.mat.uniforms, B = lastMode === 'cockpit' ? [28, 12, 28] : lastMode === 'chase' ? [62, 30, 62] : [80, 36, 80]; U.uBox.value.set(B[0], B[1], B[2]); U.uC.value.set(cam.vcx || 0, (cam.gy || 0) + B[1] * 0.42, cam.vcz || 0); U.uT.value = time % 600; U.uA.value = 0.9 * Math.min(1, wet * 1.5); U.uScale.value = particles.mat.uniforms.uScale.value; { const k = Math.max(0, stm.wind - 1), O = U.uO.value; O.x = (O.x + HAZE_W[0] * 6 * k * dt) % B[0]; O.y = (O.y - 0.6 * k * dt) % B[1]; O.z = (O.z + HAZE_W[1] * 6 * k * dt) % B[2]; } }   // (a snowstorm: the flakes driven by the gale)
    if (rain.mesh.visible) {   // the box of streaks around the view centre (the iso camera sees the most ground, the chase camera the least)
      const U = rain.mat.uniforms, B = lastMode === 'cockpit' ? [28, 12, 28] : lastMode === 'chase' ? [62, 30, 62] : lastMode === 'kino' ? [72, 34, 72] : [86, 38, 86];   // (the cockpit: the streaks close round the car)
      U.uBox.value.set(B[0], B[1], B[2]); U.uC.value.set(cam.vcx || 0, (cam.gy || 0) + B[1] * 0.42, cam.vcz || 0); U.uT.value = time % 600;
      const sn = world && world.dyn.pkWx ? world.dyn.pkWx.sU.uD.value : 0;   // (Pikes Peak: it snows near the summit, the rain fades out there)
      U.uA.value = 0.5 * Math.min(1, wet * 1.5) * (1 - clamp(sn * 1.5, 0, 1)) * (stm.on ? 1.35 : 1);
      { const k = Math.max(0, stm.wind - 1), O = U.uO.value; U.uV.value.set(1.8 + HAZE_W[0] * 7 * k, -13 - 3.5 * k, 1.1 + HAZE_W[1] * 7 * k);   // (the wind slants it: a storm's gale drives it)
        O.addScaledVector(U.uV.value, dt); O.set(O.x % B[0], O.y % B[1], O.z % B[2]); }
    }
    // tunnel roof (and the hotel above it) fades out while the followed car is inside, so you can see it (Suzuka: the bridge, while it drives underneath)
    if (world && world.dyn.tunnel && target && target.q) {   // (not from the cockpit: from inside the car the tunnel is a tunnel)
      const tn = world.dyn.tunnel, sq = target.q.s, inside = sq > tn.s0 - 30 && sq < tn.s1 + 12 && !cam.ck, goal = inside ? 0.14 : 1;
      tn.mat.opacity += (goal - tn.mat.opacity) * Math.min(1, dt * 5 + 0.02);
      const tr = tn.mat.opacity < 0.985; if (tn.mat.transparent !== tr) { tn.mat.transparent = tr; tn.mat.needsUpdate = true; } tn.mat.depthWrite = !tr;
      if (tn.mats) for (const m of tn.mats) if (m !== tn.mat) { m.opacity = tn.mat.opacity; if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; } m.depthWrite = !tr; }   // (Suzuka: everything on the bridge)
    }
    stormStep(dt);   // (the storm: its wind, its lightning; before the sky, which takes the flash's colours)
    mistStep();   // (the morning mist, the dew)
    lensStep(dt);   // (the drops on a TV camera's lens)
    skyStep(cam.ck || (lastMode === 'tv' && !cam.shot) || !!(cam.shot && cam.shot.sky));
    const ckOn = cam.ck && ck.car; if (ckOn) ckStep(ck.car, viewOf(ck.car), dt);
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
      const rays = sky && sky.mesh.visible ? post.rays : 0, flare = sky && sky.mesh.visible ? post.flare : 0;   // (the sun's shafts and its lens flare: only where the sky is drawn)
      if (post.haze > 0 || rays > 0 || flare > 0) {   // where the low sun is on (or just off) the screen; nothing when it is behind the camera
        camera.getWorldDirection(_sunV); const sl = Math.hypot(sunOff[0], sunOff[1], sunOff[2]), front = (_sunV.x * sunOff[0] + _sunV.y * sunOff[1] + _sunV.z * sunOff[2]) / sl;
        let sIn = 0;
        if (front > 0.02) { _pv.set(camera.position.x + sunOff[0] * 20, camera.position.y + sunOff[1] * 20, camera.position.z + sunOff[2] * 20).project(camera);
          const asp = camera.aspect, px = _pv.x * asp, py = _pv.y, pl = Math.hypot(px, py) || 1, far = pl > 1.15;   // the sun far off screen: put the glow just outside the edge, in its direction
          const ex = far ? px / pl * 1.15 : px, ey = far ? py / pl * 1.15 : py;
          post.mat.uniforms.uSun.value.set((ex / asp) * 0.5 + 0.5, ey * 0.5 + 0.5); post.mat.uniforms.uSunR.value.set(_pv.x * 0.5 + 0.5, _pv.y * 0.5 + 0.5); sIn = 1 - Core.sstep(1.1, 1.8, Math.max(Math.abs(_pv.x), Math.abs(_pv.y))); }
        post.hk += ((front > 0.02 ? 1 : 0) - post.hk) * Math.min(1, dt * 3); if (post.haze > 0) post.mat.uniforms.uHaze.value = post.hk > 0.005 ? post.haze * post.hk : 0;   // (fades in and out as a turning view brings the sun round: no pop)
        post.sIn += (sIn - post.sIn) * Math.min(1, dt * 3); post.mat.uniforms.uRays.value = rays * post.hk * post.sIn > 0.01 ? rays * post.hk * post.sIn : 0;
        post.mat.uniforms.uFlare.value = flare > 0 && front > 0.02 && sIn > 0 ? flare : 0;   // (how much of the sun shows: the visibility pass, after the scene)
      } else post.mat.uniforms.uRays.value = post.mat.uniforms.uFlare.value = 0;
      const U = post.mat.uniforms; U.uFocus.value = post.focus; U.uBand.value = (lastMode === 'kino' ? 0.3 : camera.aspect < 1 ? 0.2 : 0.24) + (post.span || 0); U.uBlur.value = lastMode === 'kino' ? 0.7 : 0.8;   // kino: a soft depth of field only towards the edges, as in the reference
      if (cam.ck) U.uBlur.value = 0; else if (cam.shot && cam.shot.blur != null) { U.uBlur.value = cam.shot.blur; if (cam.shot.blur > 0) U.uBand.value = 0.06; }   // (no miniature look from the driver's seat; the photo mode's own: a narrow sharp band on the car)
      renderer.setRenderTarget(post.rt); renderer.render(scene, camera); if (ckOn) ckDraw();
      U.uBloom.value = post.bloom * (1 - 0.75 * stm.f); if (U.uBloom.value > 0) bloomPass();   // (a lightning flash: not blown out by the glow)
      { const hot = atmos.season === 'summer' && atmos.tod === 'day' && wet <= 0 && !(curTrack && curTrack.def.theme === 'pikes');   // the heat haze: a dry summer's day (not up on Pikes Peak)
        let hz = 2; if (hot) { camera.getWorldDirection(_sunV); const hl = Math.hypot(_sunV.x, _sunV.z), D = camera.far * 0.85; if (hl > 0.2) { _pv.set(camera.position.x + _sunV.x / hl * D, camera.position.y, camera.position.z + _sunV.z / hl * D).project(camera); if (_pv.z < 1) hz = _pv.y * 0.5 + 0.5; } }   // (the horizon: a point far off at the camera's height, inside its far plane)
        U.uHeat.value = hot && hz < 1.2 ? 1 : 0; U.uHz.value = hz; U.uHt.value = time % 100; }
      if (U.uFlare.value > 0) { post.fv.mat.uniforms.uAs.value.set(camera.aspect, 1); renderer.setRenderTarget(post.fv.rt); renderer.render(post.fv.sc, post.cam); }
      renderer.setRenderTarget(null); renderer.render(post.sc, post.cam);
    } else { renderer.render(scene, camera); if (ckOn) ckDraw(); if (LENS_U.uDrop.value > 0) lensDraw(); }
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
    envUse('studio');
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
  function flagInfo() { return { sc: !!scView && !!scView.car, scCar: scView ? scView.car : null, lampOn: !!scView && scView.lamps.some(l => l.material === matScOn), flags: flagInst ? flagInst.men.count : 0 }; }   // (tests)
  return { setDebug, fxStats, flagInfo, setAtmos, snapshot, clearSparks, get cockpit() { return cam.ck && ck.parts ? { car: ck.car, key: ck.key, formula: ck.parts.formula, wheel: ck.parts.turn.rotation.z, near: camera.near, sky: !!sky && sky.mesh.visible } : null; }, get skyOn() { return !!sky && sky.mesh.visible; }, get atmos() { return atmos; }, setGhost, init, buildWorld, applySettings, resize, attachRace, frame, setStartLights, shake, resetCam, setShot, setShowCar, renderShowroom, debugShot, setDynScale, getDynScale, info, cam, get scene() { return scene; }, get camera() { return camera; }, get world() { return world; }, get skidCount() { return skids ? skids.cur : 0; }, get crew() { return crew; }, get raining() { return !!rain && rain.mesh.visible; }, get storm() { return { on: stm.on, n: stm.n, f: stm.f, wind: stm.wind, bolt: !!stm.bolt && stm.bolt.visible }; }, get windK() { return stm.wind; }, set onThunder(f) { stm.cb = f; }, strike(ahead) { if (stm.on) stormStrike(ahead); } /* (tests: a strike now) */, get airFx() { return { lens: LENS_U.uDrop.value, heat: post ? post.mat.uniforms.uHeat.value : 0, mist: MIST.x }; } /* (tests: the lens drops, the heat haze, the morning mist now) */, get birds() { return birds; } };
})();

