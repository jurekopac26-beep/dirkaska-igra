/* Varianta 2 · Mehke oblike in svetloba (tools/ljudje/videz: a look tried out for pictures, injected by slike.mjs as window.LJV; not in the game).
   The same shapes as today, shaded soft and lit. Nothing is added: no vertex, no mesh, no material; only the normals and the colours the bake made.
   - Normals: every part's (box, cylinder, half sphere) normals are bent outwards from its own middle, per vertex: the arms, legs and the torso shade
     like rounded limbs (cylinders: their sides one soft round tone instead of three flat ones, their tops a little domed), the head, the hair and
     the hats like a ball. The people are Lambert (lit per vertex), so a box's face goes smoothly from one corner's light to the next. The side
     faces' normals also lean to the sky the higher they are (the scene's own sky light then brightens the shoulders: it follows the weather and
     the time of day).
   - Light baked into the vertex colours in the body's frame (the rest pose): the sky's light from above (the feet and shins darker, the shoulders
     and the top of the head brighter: the figures stand out of the grass seen from above), shade where the parts meet (the inner sides of the arms
     and the legs, under the chin, the neck, the hem of the shirt, the top of the legs), warm skin with darker hands, a lighter top of the hair or
     the hat, the soles darker (standing on the ground), and each person a small tone of its own on its clothes (a group is no row of clones; the
     colours the scene asked for, the staff's vests and shirts, stay within a few percent). Held things stay as they are.
   - The instanced spectators: the same 112 vertices and 168 indices (bones, colour groups, the flag as the game's), bent normals and the same
     light in the vertex colours (the shader multiplies them by the tint, so it works for every shirt, skin and trousers), and in the shader a soft
     rim (the figure's edges as the camera sees them a little lighter: they stand out of the grass), a few operations per vertex.
   - No shadow disc under the feet: shade(P) can only recolour the vertices there are, and in the one opaque vertex-coloured mesh a disc has one
     colour of its own (a grey mat on the grass, a dark patch on the asphalt) that would also rise with a jump; the sun's shadow map already
     puts their shadows on the ground, the darker soles and shins stand them on it.
   shade(P) runs once per figure while the world is built (~0.3 ms a figure here); nothing per frame. */
(function () {
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const cl01 = (x) => Math.min(1, Math.max(0, x));
  const hash = (a, b) => { let h = Math.imul((a | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((b | 0) + 0x632be5ab, 0xc2b2ae35); h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15; return (h >>> 0) / 4294967296; };
  // the sky's light by height (body frame, m): the feet in the grass's shade, the shoulders and the head's top in the open sky
  const sky = (y) => 1.05 * (0.9 + 0.1 * ss(0.03, 1.42, y) + 0.08 * ss(1.38, 1.8, y));
  // the side faces' normals tilted to the sky by height (the scene's sky light then brightens the shoulders, the grass's light the shins)
  const lift = (y) => 0.3 * ss(0.4, 1.5, y);
  // how a part's normals are bent: side faces n = face * aS + (dx, dy * vy, dz); caps (tops) n = face * aC + (dx, 0, dz) * hC; d = the vertex's place in
  // its part's box (-1 .. 1 on each axis; a thin axis 0)
  const BEND = { ball: { aS: 0.3, vy: 0.85, aC: 1, hC: 0.75 }, torso: { aS: 0.35, vy: 0.5, aC: 1, hC: 0.55 }, limb: { aS: 0.6, vy: 0.25, aC: 1, hC: 0.5 } };

  // the triangles of a part joined into its pieces (a box, a cylinder: triangles sharing corners) -> a piece index per triangle
  function pieces(Pa) {
    const nt = Pa.length / 9, par = new Int32Array(nt), map = new Map();
    for (let t = 0; t < nt; t++) par[t] = t;
    const find = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
    for (let t = 0; t < nt; t++) for (let c = 0; c < 3; c++) {
      const i = t * 9 + c * 3, key = ((Math.round(Pa[i] * 1e4) + 65536) * 131072 + Math.round(Pa[i + 1] * 1e4) + 65536) * 131072 + Math.round(Pa[i + 2] * 1e4) + 65536, o = map.get(key);   // (0.1 mm, ±6.5 m)
      if (o === undefined) map.set(key, t); else { const ra = find(o), rb = find(t); if (ra !== rb) par[rb] = ra; }
    }
    const id = new Int32Array(nt); for (let t = 0; t < nt; t++) id[t] = find(t);
    return id;
  }
  // a piece's box (min, max) in its joint's frame
  function boxes(Pa, id) {
    const B = new Map();
    for (let t = 0; t < id.length; t++) { let b = B.get(id[t]); if (!b) B.set(id[t], b = { lo: [1e9, 1e9, 1e9], hi: [-1e9, -1e9, -1e9], t0: t, n: 0 }); b.n++;
      for (let c = 0; c < 3; c++) for (let a = 0; a < 3; a++) { const v = Pa[t * 9 + c * 3 + a]; if (v < b.lo[a]) b.lo[a] = v; if (v > b.hi[a]) b.hi[a] = v; } }
    for (const b of B.values()) { b.c = [0, 1, 2].map(a => (b.lo[a] + b.hi[a]) / 2); b.h = [0, 1, 2].map(a => (b.hi[a] - b.lo[a]) / 2); }
    return B;
  }
  // bend the normals of one part (in its joint's frame)
  function bend(pt, id, B, mode, y0) {   // (y0: the joint's height in the body: the lift by height)
    const Pa = pt.P, N = pt.N, m = BEND[mode];
    for (let t = 0; t < id.length; t++) {
      const b = B.get(id[t]), c = b.c, h = b.h;
      for (let k = 0; k < 3; k++) {
        const i = t * 9 + k * 3, fx = N[i], fy = N[i + 1], fz = N[i + 2];
        const dx = h[0] > 0.012 ? (Pa[i] - c[0]) / h[0] : 0, dy = h[1] > 0.012 ? (Pa[i + 1] - c[1]) / h[1] : 0, dz = h[2] > 0.012 ? (Pa[i + 2] - c[2]) / h[2] : 0;
        let nx, ny, nz;
        if (Math.abs(fy) > 0.7) { nx = fx * m.aC + dx * m.hC; ny = fy * m.aC; nz = fz * m.aC + dz * m.hC; }
        else { nx = fx * m.aS + dx; ny = fy * m.aS + dy * m.vy + lift(y0 + Pa[i + 1]) * (1 + m.aS); nz = fz * m.aS + dz; }
        const l = Math.hypot(nx, ny, nz) || 1; N[i] = nx / l; N[i + 1] = ny / l; N[i + 2] = nz / l;
      }
    }
  }

  window.LJV = {
    people(K) {
      const THREE = K.THREE, inv = new THREE.Matrix4(), bm = new THREE.Matrix4(), nm = new THREE.Matrix3(), v = new THREE.Vector3(), n = new THREE.Vector3();
      let who = 0;   // (the figures in the order they are built: deterministic, no draw of the scene's random numbers)
      // the joints (P.J): 0 root, 1 hips, 2 torso, 3 head, 4/7 shoulder (left, right), 5/8 elbow, 6/9 hand, 10/12 hip joint, 11/13 knee, 14.. more
      const ARM = new Set([4, 5, 7, 8]), LEG = new Set([10, 11, 12, 13]);
      function shade(P) {
        const t0 = performance.now(); shade0(P); window.LJV.ms = (window.LJV.ms || 0) + performance.now() - t0;   // (the time it takes, for the tools)
      }
      function shade0(P) {
        const J = P.J, parts = P.parts; if (!J || !parts || !parts.length) return;
        const me = ++who;
        inv.copy(J[0].matrixWorld).invert();
        const jx = J.map(j => { bm.multiplyMatrices(inv, j.matrixWorld); return bm.elements[12]; });   // (each joint's side: + left, - right)
        // the skin: the head's front-most, lowest corner (the chin) is the face's
        let skin = null, best = -1e9;
        for (const pt of parts) if (pt.b === 3 && !pt.k) for (let i = 0; i < pt.P.length; i += 3) { const s = pt.P[i + 2] - pt.P[i + 1]; if (s > best) { best = s; skin = [pt.C[i], pt.C[i + 1], pt.C[i + 2]]; } }
        const isSkin = (C, i) => skin && Math.abs(C[i] - skin[0]) < 0.004 && Math.abs(C[i + 1] - skin[1]) < 0.004 && Math.abs(C[i + 2] - skin[2]) < 0.004;
        for (const pt of parts) {
          if (pt.k) continue;   // (held things stay as they are)
          const b = pt.b, Pa = pt.P, N = pt.N, C = pt.C, id = pieces(Pa), B = boxes(Pa, id);
          bm.multiplyMatrices(inv, J[b].matrixWorld); nm.getNormalMatrix(bm);
          bend(pt, id, B, b === 3 ? 'ball' : b === 2 ? 'torso' : 'limb', bm.elements[13]);
          const side = Math.sign(jx[b]) || 1;
          // what each piece is: the hands (the elbow's lowest piece), the shoes (the knee's lowest), the neck (the torso's skin above its top)
          const role = new Map();
          for (const [k, q] of B) {
            const t0 = q.t0 * 9, sk = isSkin(C, t0);
            let r = sk ? 'skin' : 'cloth';
            if ((b === 5 || b === 8) && q.hi[1] < -0.23) r = 'hand';
            else if ((b === 11 || b === 13) && q.hi[1] < -0.33) r = 'shoe';
            else if (b === 2 && sk && q.lo[1] > 0.4) r = 'neck';
            else if (b === 3) r = sk ? 'face' : 'hair';
            else if (b >= 14) r = sk ? 'skin' : 'other';
            // a tone of the person's own on each colour of its clothes (± a few percent, a little warmer or cooler)
            const h1 = hash(me * 7 + 1, Math.round(C[t0] * 255) * 65536 + Math.round(C[t0 + 1] * 255) * 256 + Math.round(C[t0 + 2] * 255)), h2 = hash(me * 13 + 5, Math.round(C[t0 + 2] * 999));
            role.set(k, { r, tone: 1 + 0.1 * (h1 - 0.5), warm: 0.05 * (h2 - 0.5), lo: q.lo[1], hi: q.hi[1] });
          }
          for (let t = 0; t < id.length; t++) {
            const R = role.get(id[t]);
            for (let k = 0; k < 3; k++) {
              const i = t * 9 + k * 3;
              v.set(Pa[i], Pa[i + 1], Pa[i + 2]).applyMatrix4(bm); n.set(N[i], N[i + 1], N[i + 2]).applyMatrix3(nm).normalize();
              const y = v.y, inward = cl01(-n.x * side);
              let f = sky(y), cr = 1, cg = 1, cb = 1, add = 0;
              if (ARM.has(b)) f *= 1 - 0.3 * inward * (0.55 + 0.45 * ss(1.0, 1.42, y));   // (the inner side of the arm, darkest at the armpit)
              else if (LEG.has(b)) f *= (1 - 0.25 * inward * (0.5 + 0.5 * ss(0.45, 0.86, y))) * (1 - 0.12 * ss(0.74, 0.88, y));   // (between the legs; the top of the legs under the hips)
              else if (b === 2) f *= (1 - 0.2 * ss(1.08, 0.96, y)) * (1 - 0.12 * Math.abs(n.x) * ss(1.08, 1.36, y));   // (the shirt's hem; the sides under the arms)
              else if (b === 1) f *= 1 - 0.18 * ss(0.95, 0.84, y);   // (the hips under the torso)
              f *= 1 + 0.16 * cl01(n.y) * ss(1.15, 1.5, y);   // (the shoulders and the head's top catch the sky)
              if (R.r === 'skin' || R.r === 'face' || R.r === 'neck' || R.r === 'hand') { cr = 1.025; cb = 0.96; }   // (warm skin)
              if (R.r === 'hand') f *= 0.88;
              else if (R.r === 'neck') f *= 0.76;
              else if (R.r === 'face') f *= 1 - 0.16 * ss(R.lo + 0.07, R.lo, Pa[i + 1]);   // (under the chin)
              else if (R.r === 'hair') { const up = cl01(n.y); f *= 1 + 0.12 * up; add = 0.035 * up; }   // (the top of the hair or the hat catches the sky)
              else if (R.r === 'shoe') f *= 0.92 - 0.14 * ss(R.lo + 0.04, R.lo, Pa[i + 1]);   // (the soles darker: standing on the ground)
              else if (R.r === 'cloth') { f *= R.tone; cr = 1 + R.warm; cb = 1 - R.warm; }
              C[i] = C[i] * f * cr + add; C[i + 1] = C[i + 1] * f * cg + add; C[i + 2] = C[i + 2] * f * cb + add;
            }
          }
        }
      }
      return { shade };
    },
    crowd(K) {
      const THREE = K.THREE;
      // the game's figure (js/world.js crowdGeo), quad for quad in the same order: the same vertices, indices, bones and colour groups; only the
      // normals bent per vertex and the vertex colours carrying the light (grey: the shader's tint gives the colour)
      function geo() {
        const P = [], Nm = [], Cl = [], Pa = [], Ix = [], W1 = [1, 1, 1];
        let box = null;   // the box being built: its middle, half sizes, how it bends and its light
        const quad = (a, b, c, d, ins, part, col, plain) => {
          const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
          let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
          const flip = nx * ((a[0] + c[0]) / 2 - ins[0]) + ny * ((a[1] + c[1]) / 2 - ins[1]) + nz * ((a[2] + c[2]) / 2 - ins[2]) < 0, s = flip ? -1 : 1, k = P.length / 3;
          nx *= s; ny *= s; nz *= s;
          for (const p of flip ? [a, d, c, b] : [a, b, c, d]) {
            P.push(p[0], p[1], p[2]); Pa.push(part);
            if (plain || !box) { Nm.push(nx, ny, nz); Cl.push(col[0], col[1], col[2]); continue; }
            const m = BEND[box.mode], dx = (p[0] - box.c[0]) / box.h[0], dy = (p[1] - box.c[1]) / box.h[1], dz = (p[2] - box.c[2]) / box.h[2];
            let ex, ey, ez;
            if (Math.abs(ny) > 0.7) { ex = nx * m.aC + dx * m.hC; ey = ny * m.aC; ez = nz * m.aC + dz * m.hC; }
            else { ex = nx * m.aS + dx; ey = ny * m.aS + dy * m.vy + lift(p[1] * 1.035) * (1 + m.aS); ez = nz * m.aS + dz; }
            const e = Math.hypot(ex, ey, ez) || 1; ex /= e; ey /= e; ez /= e;
            const f = box.light(p, ex, ey, ez, part);
            Nm.push(ex, ey, ez); Cl.push(col[0] * f, col[1] * f, col[2] * f);
          }
          Ix.push(k, k + 1, k + 2, k, k + 2, k + 3);
        };
        const cub = (x0, x1, y0, y1, z0, z1, f, mode, light) => {
          const ins = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], F = {
            px: [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], nx: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]],
            py: [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]], ny: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]],
            pz: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], nz: [[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]] };
          box = { c: ins, h: [(x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2], mode, light };
          for (const k in f) { const q = F[k]; quad(q[0], q[1], q[2], q[3], ins, f[k][0], f[k][1]); }
          box = null;
        };
        const skyC = (y) => sky(y * 1.035);   // (the figure is 1.72 m)
        // legs: the feet dark (shoes), the top of the legs under the torso a little darker; the dark soles as the game's (seen when sitting)
        cub(-0.17, 0.17, 0, 0.84, -0.11, 0.11, { px: [33, W1], nx: [33, W1], pz: [33, W1], nz: [33, W1], ny: [30, [0.12, 0.1, 0.09]] }, 'limb',
          (p) => skyC(p[1]) * (p[1] < 0.01 ? 0.78 : 1) * (1 - 0.1 * ss(0.7, 0.84, p[1])));
        // torso: the hem darker, the shoulders in the sky's light
        cub(-0.22, 0.22, 0.84, 1.42, -0.13, 0.13, { px: [1, W1], nx: [1, W1], pz: [1, W1], nz: [1, W1], py: [1, W1] }, 'torso',
          (p, x, y) => skyC(p[1]) * (1 - 0.14 * ss(0.95, 0.84, p[1])) * (1 + 0.06 * Math.max(0, y)));
        // head: the chin darker, the hair's (or the cap's) top lighter
        cub(-0.11, 0.11, 1.44, 1.7, -0.12, 0.12, { px: [2, W1], nx: [2, W1], pz: [2, W1], nz: [4, W1], py: [4, W1] }, 'ball',
          (p, x, y, z, part) => skyC(p[1]) * (part === 2 ? 1 - 0.14 * ss(1.5, 1.44, p[1]) : 1 + 0.1 * Math.max(0, y)));
        // arms: the inner side darker (at the armpit most), the hand a little darker
        for (const sd of [-1, 1]) { const b = sd < 0 ? 10 : 20, x0 = sd < 0 ? -0.32 : 0.22;
          cub(x0, x0 + 0.1, 0.8, 1.4, -0.06, 0.06, { px: [b + 5, W1], nx: [b + 5, W1], pz: [b + 5, W1], nz: [b + 5, W1], ny: [b + 2, W1] }, 'limb',
            (p, x, y, z, part) => skyC(p[1]) * (1 - 0.28 * Math.max(0, -x * sd) * (0.5 + 0.5 * ss(0.95, 1.4, p[1]))) * (part % 10 === 2 ? 0.9 : 1)); }
        quad([0.26, 0.82, 0.09], [0.3, 0.82, 0.09], [0.3, -0.68, 0.09], [0.26, -0.68, 0.09], [0.28, 0, 0], 40, [0.84, 0.84, 0.86], true);   // flag pole, as the game's
        for (const [y0, y1, cg] of [[-0.955, -0.68, 56], [-1.23, -0.955, 57]]) quad([0.3, y1, 0.09], [1.2, y1, 0.09], [1.2, y0, 0.09], [0.3, y0, 0.09], [0.75, y0, 0], cg, W1, true);   // the cloth
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nm, 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(Cl, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(Pa, 1)); g.setIndex(Ix);
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.4, 0), 2.4);
        return g;
      }
      // a soft rim: the figure's edges as the camera sees them a little lighter (the sky behind the light), per vertex, a few operations
      function shader(S) {
        return Object.assign({}, S, { CR_VS_POS: S.CR_VS_POS + '\n' + [
          '{ vec4 crMv = vec4(transformed, 1.0);',
          '#ifdef USE_INSTANCING', 'crMv = instanceMatrix * crMv;', '#endif',
          'crMv = modelViewMatrix * crMv;',
          'float crRim = 1.0 - max(0.0, dot(normalize(transformedNormal), normalize(-crMv.xyz)));',
          'vColor *= 1.0 + 0.3 * crRim * crRim * crRim; }'].join('\n') });
      }
      return { geo, shader };
    },
  };
})();
