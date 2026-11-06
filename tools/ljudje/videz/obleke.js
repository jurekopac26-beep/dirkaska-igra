// 3 · Oblačila, lasje in pokrivala (tools/ljudje/videz, docs/ljudje-predlogi.md): what is ON the body, seen from the chase camera.
// Scene people (World.people): the same joints and limb lengths as person0, every part a box with only the faces anyone can see (6 vertices a
// face once baked), so the savings on hidden faces pay for: hair with shapes readable from above (crop, side part, buzz, curls, bob, long, bun,
// ponytail with its band, a bald patch for some older men), caps with a brim forward or backward, sun hats, cheaper police caps and helmets;
// garment colour blocks (an open jacket over a shirt, a hoodie with its hood on the back, a polo collar, raglan sleeves, a tank top with bare
// shoulders, a skirt or a dress for some 'long' / 'pony' looks: its own joint, P.xJ, turned as the legs on average), shorts on a summer's
// day, cyclists' jerseys with a band, belts, white sneakers or dark boots, backpacks and bum bags, sunglasses; the staff stay what the scene
// asked (its shirt, trousers, vest and hat colours) and get clearer: hi-vis vests with two bands and braces over the shoulders, overalls with a
// collar and a zip, reflective bands on the marshals' and firefighters' arms and legs, mechanics' two-tone overalls.
// The scene's random stream is left exactly as person0 leaves it (the same draws in the same order; its next value is read and put back), so
// every scene keeps its layout and colours; this look's own choices come from that value. Instanced crowd (crowdGeo): the same 28 quads (168
// index vertices), the arms' inner faces (against the body or turned away) traded for a cap's brim and a second colour on the shirt's front;
// a second colour per vertex split sharply in the fragment shader (sleeves, shoes or shorts, the hair line). No writing, no logos, no brands.
window.LJV = {
  people(K) {
    const THREE = K.THREE;
    /* ---------- geometry: hexahedra with only the faces named (mask), quads, fans; cached by shape ---------- */
    const PX = 1, NX = 2, PY = 4, PZ = 16, NZ = 32, SIDES = PX | NX | PZ | NZ, BOX5 = SIDES | PY;
    const FACES = [[PX, [1, 3, 7, 5]], [NX, [0, 4, 6, 2]], [PY, [2, 6, 7, 3]], [PZ, [4, 5, 7, 6]], [NZ, [0, 2, 3, 1]]];   // (corner i = ix + 2 iy + 4 iz)
    const GC = new Map();
    const keyOf = (a) => a.map(v => Math.round(v * 4000)).join(',');
    function quadTo(pos, a, b, c, d, out) {   // two triangles, their front side towards `out`
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      if (nx * out[0] + ny * out[1] + nz * out[2] < 0) { const t = b; b = d; d = t; }
      pos.push(...a, ...b, ...c, ...a, ...c, ...d);
    }
    function hexGeo(C, mask) {
      const key = 'h' + mask + ':' + keyOf(C.flat()); let g = GC.get(key); if (g) return g;
      const ctr = [0, 0, 0]; for (const p of C) { ctr[0] += p[0] / 8; ctr[1] += p[1] / 8; ctr[2] += p[2] / 8; }
      const pos = [];
      for (const [bit, f] of FACES) { if (!(mask & bit)) continue; const q = f.map(i => C[i]);
        const fc = [0, 1, 2].map(k => (q[0][k] + q[1][k] + q[2][k] + q[3][k]) / 4); quadTo(pos, q[0], q[1], q[2], q[3], [fc[0] - ctr[0], fc[1] - ctr[1], fc[2] - ctr[2]]); }
      g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); GC.set(key, g); return g;
    }
    function quadGeo(a, b, c, d, out) {
      const key = 'q' + keyOf([...a, ...b, ...c, ...d, ...out]); let g = GC.get(key); if (g) return g;
      const pos = []; quadTo(pos, a, b, c, d, out); g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); GC.set(key, g); return g;
    }
    function fanGeo(n, r, y, x0, z0, zb) {   // a flat disc (a brim) facing up: n triangles round (x0, y, z0); zb: the back half's reach (fire helmets)
      const key = 'f' + keyOf([n, r, y, x0, z0, zb || r]); let g = GC.get(key); if (g) return g;
      const pos = [];
      for (let k = 0; k < n; k++) { const a0 = (k + 0.5) / n * Math.PI * 2, a1 = (k + 1.5) / n * Math.PI * 2;
        const p = (a) => { const s = Math.sin(a), c = Math.cos(a); return [x0 + s * r, y, z0 + c * (c < 0 ? (zb || r) : r)]; };
        pos.push(x0, y, z0, ...p(a0), ...p(a1)); }
      g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); GC.set(key, g); return g;
    }
    const mesh = (g, col) => new THREE.Mesh(g, K.lam(col));
    // an axis box (x0..x1, y0..y1, z0..z1) and a frustum (bottom and top rectangles, their own heights at the back and the front)
    const cube = (x0, x1, y0, y1, z0, z1) => [[x0, y0, z0], [x1, y0, z0], [x0, y1, z0], [x1, y1, z0], [x0, y0, z1], [x1, y0, z1], [x0, y1, z1], [x1, y1, z1]];
    const frust = (bx, bz0, bz1, by0, by1, tx, tz0, tz1, ty0, ty1, bx1, tx1) => {   // bx: bottom half-width (bx1: the front's), by0/by1: bottom y at the back/front
      const fx = bx1 != null ? bx1 : bx, gx = tx1 != null ? tx1 : tx;
      return [[-bx, by0, bz0], [bx, by0, bz0], [-tx, ty0, tz0], [tx, ty0, tz0], [-fx, by1, bz1], [fx, by1, bz1], [-gx, ty1, tz1], [gx, ty1, tz1]]; };
    const tbx = (wb, wt, h, db, dt, y) => frust(wb / 2, -db / 2, db / 2, y, y, wt / 2, -dt / 2, dt / 2, y + h, y + h);   // gTBox's shape, its bottom at y
    const add = (par, C, mask, col) => { par.add(mesh(hexGeo(C, mask), col)); };
    const addQ = (par, a, b, c, d, out, col) => { par.add(mesh(quadGeo(a, b, c, d, out), col)); };

    /* ---------- colours ---------- */
    const rgb = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
    const hex = (r, g, b) => (Math.round(Math.max(0, Math.min(255, r))) << 16) | (Math.round(Math.max(0, Math.min(255, g))) << 8) | Math.round(Math.max(0, Math.min(255, b)));
    const shade = (c, f) => { const [r, g, b] = rgb(c); return hex(r * f, g * f, b * f); };
    const mix = (c1, c2, t) => { const a = rgb(c1), b = rgb(c2); return hex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t); };
    const lum = (c) => { const [r, g, b] = rgb(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
    const sat = (c) => { const [r, g, b] = rgb(c); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx ? (mx - mn) / mx : 0; };
    const hiVis = (c) => { const [r, g, b] = rgb(c); return (r > 190 && g > 70 && g < 200 && b < 70) || (g > 190 && r > 140 && b < 90); };   // (orange, yellow, lime)
    const away = (c, cands, R) => { const ok = cands.filter(x => Math.abs(lum(x) - lum(c)) > 0.28); const L = ok.length ? ok : cands; return L[Math.floor(R() * L.length)]; };
    const WHITE = 0xefefea, BLACK = 0x23252b, GREY = 0xa9adb5, NAVY = 0x2a3550;
    const INNER = [WHITE, WHITE, BLACK, GREY, 0x9fb8d8, 0xe8dcc0];   // (the shirt under an open jacket)
    const SNEAK = [0xf2f2ee, 0xf2f2ee, 0xf2f2ee, 0xd9dde2, 0x2a2c31, 0x24262b, 0x5a3a24, 0x7a5432, 0x2f63c9, 0xd23a2c];   // (white sneakers most, dark shoes, brown boots, a few bright ones)
    const BAND = [0xe85a9a, 0xd23a2c, 0x2f63c9, 0xf0c22e, 0xf2f2ee, 0x22848f, 0x15171c];   // (hair bands)
    const PACK = [0x2a3d6b, 0x1d1f25, 0x8a2a24, 0x4a5a3a, 0xd8662a, 0x6a6f78, 0x22848f];
    const SUN = [0xd8c8a0, 0xeeeae0, 0xb8a27a, 0x6a7a50, 0xc8a878, 0x2a3550];   // (sun hats: straw, white, khaki, olive, sand, navy)

    /* ---------- the scene's random stream, read and put back (K.rnd's next value; 16807's inverse mod 2^31 - 1) ---------- */
    const MOD = 2147483647n, INV = 1407677000n;
    function peek() { const r = K.rnd(), cur = Math.round(r * 2147483647); K.seed(Number(BigInt(cur) * INV % MOD) - 1); return r; }
    function rng(u) { let a = (Math.floor(u * 4294967296) ^ 0x9e3779b9) >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    const wpick = (R, list) => { let s = 0; for (const e of list) s += e[1]; let u = R() * s; for (const e of list) if ((u -= e[1]) < 0) return e[0]; return list[list.length - 1][0]; };

    /* ---------- which scene is being built (a staff scene's people keep their work clothes): the kinds' builds wrapped; this look is made at
       the first person of the first scene, so that one is found from the track's places (a hook would be cleaner: the scene's name in o) ---------- */
    let CUR = null; const KIT = K.kit || {}, STAFFS = KIT.STAFF_SCENES || new Set();
    const SUMMERS = new Set(['piknik', 'kolesarji', 'plaza', 'badminton', 'nogomet', 'karte', 'glasba', 'zmaj', 'motoristi']);   // (the summer's scenes: shorts for some)
    if (KIT.S) {
      for (const name of Object.keys(KIT.S)) { const d = KIT.S[name]; if (!d || typeof d.build !== 'function' || d.build.ljv) continue;
        const b = d.build, w = function (...a) { CUR = name; try { return b.apply(this, a); } finally { CUR = null; } }; w.ljv = true; d.build = w; }
      try { const T = World.api.T, list = (World.peopleSites || {})[T.def.id] || [];
        for (const [name, at] of list) { if (!KIT.S[name]) continue; const s0 = T.startS + at; if (T.open && (s0 < 0 || s0 > T.len)) continue; CUR = name; break; } } catch (e) { CUR = null; }
    }

    /* ---------- the torso's shape (person0's tapered box: bottom 0.31 x 0.2 at y -0.02, top 0.41 x 0.225 at y 0.48) ---------- */
    const TY0 = -0.02, TY1 = 0.48, tw = (y) => 0.155 + 0.05 * (y - TY0) / 0.5, td = (y) => 0.1 + 0.0125 * (y - TY0) / 0.5;
    const front = (par, x0b, x1b, x0t, x1t, y0, y1, col, dz) => { dz = dz || 0.004; addQ(par, [x0b, y0, td(y0) + dz], [x1b, y0, td(y0) + dz], [x1t, y1, td(y1) + dz], [x0t, y1, td(y1) + dz], [0, 0, 1], col); };
    const back = (par, x0b, x1b, x0t, x1t, y0, y1, col, dz) => { dz = dz || 0.004; addQ(par, [x0b, y0, -td(y0) - dz], [x1b, y0, -td(y0) - dz], [x1t, y1, -td(y1) - dz], [x0t, y1, -td(y1) - dz], [0, 0, -1], col); };
    const ring = (y0, y1, g) => frust(tw(y0) + g, -td(y0) - g, td(y0) + g, y0, y0, tw(y1) + g, -td(y1) - g, td(y1) + g, y1, y1);   // a band round the torso, g out

    /* ---------- hair and hats (the head's frame: the head 0.19 x 0.21 at y 0, 0.175 x 0.2 at its top 0.23, the face +z) ---------- */
    function hair(head, style, col, R, lite) {
      const S = (p) => frust(p.sx, p.bz, p.fz, p.by, p.fy, p.tx, p.bzt, p.fzt, p.ty, p.tyf != null ? p.tyf : p.ty, p.sxf, p.txf);
      const fringe = (y0, y1, x, z) => addQ(head, [-x, y0, z], [x, y0, z], [x * 0.95, y1, z - 0.004], [-x * 0.95, y1, z - 0.004], [0, 0, 1], col);
      switch (style) {
        case 'crop': add(head, S({ sx: 0.101, bz: -0.113, by: 0.085, sxf: 0.097, fz: 0.104, fy: 0.185, tx: 0.092, bzt: -0.106, fzt: 0.098, ty: 0.262 }), BOX5, col); return { top: true };
        case 'side': { const C = S({ sx: 0.102, bz: -0.114, by: 0.08, sxf: 0.098, fz: 0.105, fy: 0.178, tx: 0.093, bzt: -0.106, fzt: 0.099, ty: 0.258 });
          const s = R() < 0.5 ? 1 : -1; for (const i of [2, 6, 3, 7]) if (Math.sign(C[i][0]) === s) { C[i][1] += 0.022; C[i][0] += s * 0.006; }   // (the parting: one side up, its volume over)
          add(head, C, BOX5, col); return { top: true }; }
        case 'buzz': add(head, S({ sx: 0.098, bz: -0.108, by: 0.06, sxf: 0.093, fz: 0.103, fy: 0.2, tx: 0.089, bzt: -0.103, fzt: 0.099, ty: 0.243 }), BOX5, col); return { top: true };
        case 'curls': add(head, S({ sx: 0.113, bz: -0.125, by: 0.07, sxf: 0.107, fz: 0.112, fy: 0.17, tx: 0.1, bzt: -0.116, fzt: 0.104, ty: 0.288 }), BOX5, col);
          if (!lite) add(head, cube(-0.062, 0.062, 0.27, 0.318, -0.078, 0.05), BOX5, shade(col, 1.12)); return { top: true };
        case 'bob': add(head, S({ sx: 0.116, bz: -0.123, by: 0.02, sxf: 0.112, fz: 0.086, fy: 0.035, tx: 0.095, bzt: -0.11, fzt: 0.098, ty: 0.266 }), PX | NX | PY | NZ, col);
          fringe(0.19, 0.266, 0.092, 0.105); return { top: true, back: true };
        case 'long': add(head, S({ sx: 0.114, bz: -0.126, by: -0.13, sxf: 0.11, fz: 0.07, fy: -0.06, tx: 0.095, bzt: -0.11, fzt: 0.098, ty: 0.266 }), PX | NX | PY | NZ, col);
          fringe(0.2, 0.266, 0.09, 0.105); return { top: true, back: true };
        case 'bun': add(head, S({ sx: 0.1, bz: -0.112, by: 0.07, sxf: 0.096, fz: 0.103, fy: 0.2, tx: 0.09, bzt: -0.104, fzt: 0.098, ty: 0.256 }), BOX5, col);
          add(head, cube(-0.052, 0.052, 0.235, 0.322, -0.128, -0.03), BOX5, shade(col, 1.08)); return { top: true };
        case 'pony': { add(head, S({ sx: 0.1, bz: -0.112, by: 0.075, sxf: 0.096, fz: 0.103, fy: 0.2, tx: 0.09, bzt: -0.104, fzt: 0.098, ty: 0.256 }), BOX5, col);
          const bc = BAND[Math.floor(R() * BAND.length)], high = R() < 0.5;
          if (high) { add(head, cube(-0.042, 0.042, 0.235, 0.283, -0.135, -0.055), PX | NX | PY | NZ, bc);
            if (!lite) add(head, frust(0.04, -0.175, -0.125, -0.02, 0.0, 0.034, -0.14, -0.09, 0.24, 0.25, 0.034, 0.03), PX | NX | NZ, col); }
          else { add(head, cube(-0.042, 0.042, 0.17, 0.215, -0.17, -0.098), PX | NX | PY | NZ, bc);
            if (!lite) add(head, frust(0.03, -0.198, -0.148, -0.05, -0.04, 0.034, -0.168, -0.118, 0.172, 0.172), PX | NX | NZ, col); }
          return { top: true }; }
        case 'ring': add(head, S({ sx: 0.101, bz: -0.113, by: 0.075, sxf: 0.098, fz: 0.07, fy: 0.135, tx: 0.094, bzt: -0.108, fzt: 0.07, ty: 0.19 }), PX | NX | NZ, col); return { top: false };   // (a bald patch: the hair round the back)
        default: return { top: false };
      }
    }
    // the hats: their crown, its brim; { top: covers the head's top, back: covers its back }
    function hat(head, kind, hc, o, R, hairCol, hs) {
      switch (kind) {
        case 'cap': { const back = !!o._capBack;
          add(head, frust(0.106, -0.118, 0.108, 0.19, 0.2, 0.091, -0.1, 0.088, 0.272, 0.272), BOX5, hc);
          if (back) { addQ(head, [-0.088, 0.196, -0.116], [0.088, 0.196, -0.116], [0.08, 0.186, -0.215], [-0.08, 0.186, -0.215], [0, 1, 0], shade(hc, 0.92));
            if (hs && hs !== 'bald') addQ(head, [-0.09, 0.19, 0.106], [0.09, 0.19, 0.106], [0.088, 0.205, 0.105], [-0.088, 0.205, 0.105], [0, 0, 1], hairCol); }
          else addQ(head, [-0.088, 0.205, 0.106], [0.088, 0.205, 0.106], [0.08, 0.19, 0.212], [-0.08, 0.19, 0.212], [0, 1, 0], shade(hc, 0.92));
          if (hs && hs !== 'bald' && !o.lite) addQ(head, [-0.088, 0.1, -0.119], [0.088, 0.1, -0.119], [0.09, 0.19, -0.12], [-0.09, 0.19, -0.12], [0, 0, -1], hairCol);   // (hair under it at the back)
          return { top: true }; }
        case 'beanie': { add(head, frust(0.108, -0.118, 0.11, 0.155, 0.165, 0.074, -0.08, 0.07, 0.3, 0.3), BOX5, hc);
          add(head, frust(0.112, -0.122, 0.114, 0.15, 0.16, 0.111, -0.121, 0.113, 0.2, 0.205), SIDES, shade(hc, 0.8));
          if (!o.lite && R() < 0.5) add(head, cube(-0.032, 0.032, 0.29, 0.345, -0.035, 0.03), BOX5, R() < 0.5 ? WHITE : shade(hc, 1.25));
          return { top: true }; }
        case 'helmet': { add(head, frust(0.113, -0.142, 0.12, 0.17, 0.185, 0.07, -0.1, 0.085, 0.3, 0.3), BOX5, hc);
          for (const s of [1, -1]) addQ(head, [s * 0.018, 0.302, -0.09], [s * 0.045, 0.302, -0.09], [s * 0.045, 0.302, 0.075], [s * 0.018, 0.302, 0.075], [0, 1, 0], 0x23252b);
          return { top: true }; }
        case 'hard': add(head, frust(0.11, -0.125, 0.125, 0.165, 0.165, 0.068, -0.08, 0.085, 0.3, 0.3), BOX5, hc);
          head.add(mesh(fanGeo(8, 0.165, 0.165, 0, 0.02), hc)); return { top: true };
        case 'fire': add(head, frust(0.112, -0.13, 0.125, 0.165, 0.17, 0.07, -0.085, 0.085, 0.305, 0.305), BOX5, hc);
          head.add(mesh(fanGeo(8, 0.19, 0.163, 0, 0.0, 0.25), hc));
          addQ(head, [-0.058, 0.19, 0.13], [0.058, 0.19, 0.13], [0.05, 0.27, 0.11], [-0.05, 0.27, 0.11], [0, 0.3, 1], 0xd9dde2); return { top: true };
        case 'police': add(head, frust(0.106, -0.116, 0.116, 0.2, 0.2, 0.136, -0.142, 0.14, 0.31, 0.31), BOX5, hc);
          add(head, frust(0.108, -0.118, 0.118, 0.198, 0.198, 0.112, -0.122, 0.122, 0.238, 0.238), SIDES, 0x15171c);
          addQ(head, [-0.09, 0.21, 0.118], [0.09, 0.21, 0.118], [0.085, 0.192, 0.205], [-0.085, 0.192, 0.205], [0, 1, 0], 0x111111); return { top: true };
        case 'sun': { add(head, frust(0.108, -0.115, 0.11, 0.19, 0.2, 0.094, -0.1, 0.095, 0.29, 0.29), BOX5, hc);
          head.add(mesh(fanGeo(8, 0.215, 0.2, 0, 0.0), shade(hc, 0.94))); add(head, frust(0.11, -0.117, 0.112, 0.2, 0.205, 0.106, -0.113, 0.108, 0.232, 0.232), SIDES, shade(hc, 0.55));
          return { top: true }; }
        default: if (K.HATX[kind]) { head.add(K.HATX[kind](hc, o)); return { top: false, x: true }; }
          return { top: false, x: true };
      }
    }

    /* ---------- the person (the same joints as person0) ---------- */
    function person(o) {
      o = o || {};
      // person0's draws, in its order (skin, shirt, trousers, hair colour, hair style when no hat and none asked, the hat's colour)
      const skin = o.skin != null ? o.skin : K.pick(K.SKIN), shirt = o.shirt != null ? o.shirt : K.pick(K.SHIRT), pants = o.pants != null ? o.pants : K.pick(K.PANTS);
      const hairC = o.hairCol != null ? o.hairCol : K.pick(K.HAIR);
      const hs0 = o.hat ? null : (o.hair || K.pick(['short', 'short', 'short', 'long', 'bald', 'pony']));
      const hc = o.hatCol != null ? o.hatCol : K.pick(K.SHIRT);
      const R = rng(peek()), lite = !!o.lite, kid = !!o.kid, long = !!o.long;
      const root = new THREE.Group(), P = { root, o, sh: [], el: [], hand: [], hp: [], kn: [] };
      P.sc = (o.scale || 0.97) * (kid ? 0.62 : 1);
      const hips = P.hips = new THREE.Group(); hips.position.y = 0.92; root.add(hips);
      const torso = P.torso = new THREE.Group(); torso.position.y = 0.06; hips.add(torso);
      const head = P.head = new THREE.Group(); head.position.y = 0.56; torso.add(head); if (kid) head.scale.setScalar(1.22);

      // who: the staff (a hi-vis vest, overalls, a uniform's hat, work gloves) keep the scene's colours; the others are dressed by this look
      const vest = o.vest != null, plainVest = vest && o.stripes != null && o.stripes === o.vest, hiVest = vest && !plainVest;
      const overall = long && o.shirt != null && o.shirt === o.pants, uniHat = o.hat === 'police' || o.hat === 'fire' || o.hat === 'hard';
      const staff = !kid && (hiVest || overall || uniHat || (o.gloves != null && long) || (CUR != null && STAFFS.has(CUR)));
      const bare = o.shirt != null && o.shirt === skin;   // (a bare chest: the swimmers)
      const rider = !kid && o.hat === 'helmet' && !!o.shorts && !long, summer = CUR != null && SUMMERS.has(CUR);   // (a cyclist: a jersey)
      const greyHair = lum(hairC) > 0.45 && sat(hairC) < 0.12;
      // the top: tee / polo / raglan / tank (short sleeves), long / jacket / hoodie / zip (long sleeves)
      let top = long ? 'long' : 'tee';
      const longish = long || (lite && R() < 0.16);
      if (rider) top = 'jersey';
      else if (!staff && !bare && !plainVest) top = longish ? wpick(R, [['long', 3], ['jacket', 3], ['hoodie', 2], ['zip', 1.5]]) : wpick(R, kid ? [['tee', 5], ['raglan', 3], ['tank', 1]] : [['tee', 5], ['polo', 2], ['raglan', 2.5], ['tank', lite ? 1 : 1.6]]);
      else if (staff && !vest && !overall && !bare) top = long ? 'long' : 'polo';   // (an official's or an engineer's shirt: a collar)
      if (bare) top = 'bare';
      const band = top === 'jersey' ? away(shirt, [WHITE, BLACK, NAVY, 0xd23a2c, 0xf0c22e, 0x2f63c9, 0x2f9a48], R) : null;   // (the jersey's band and sleeves)
      const sleeve = top === 'raglan' ? away(shirt, [WHITE, BLACK, GREY, NAVY], R) : band != null ? band : shirt;
      const inner = top === 'jacket' || top === 'zip' ? away(shirt, INNER, R) : null;
      // the bottom: trousers (or shorts), a skirt (in the trousers' colour) or a dress (the shirt's) for some long-haired and pony-tailed
      let bottom = 'trousers';
      if (!staff && !bare && !lite && (hs0 === 'long' || hs0 === 'pony') && R() < (kid ? 0.3 : 0.42)) bottom = R() < 0.55 || long ? 'skirt' : 'dress';
      const shorts = !!o.shorts || (summer && !staff && !bare && !kid && !lite && bottom === 'trousers' && R() < 0.4);   // (a summer's day: shorts for some)
      const lower = bottom === 'dress' ? shirt : pants, shins = shorts || bottom !== 'trousers' ? skin : pants;
      // the head: the hair's shape by its kind (short: crop, side part, buzz, curls, a bald patch for some older men), a cap or a sun hat for some
      let hk = o.hat || null;
      if (!hk && o.hair == null && !staff && !bare) { const u = R(); hk = u < 0.2 ? 'cap' : !kid && u < (summer ? 0.32 : 0.27) ? 'sun' : null; }
      if (hk === 'cap' && !staff && !kid && R() < 0.28) o = Object.assign({}, o, { _capBack: true });
      else if (hk === 'cap' && kid && R() < 0.4) o = Object.assign({}, o, { _capBack: true });
      let hstyle = null;
      if (!hk && hs0) {
        if (hs0 === 'short') hstyle = greyHair && !kid && R() < 0.45 ? 'ring' : wpick(R, kid ? [['crop', 3], ['side', 2], ['buzz', 1], ['curls', 1]] : [['crop', 4], ['side', 3], ['buzz', 1.6], ['curls', lite ? 0.6 : 1.1], ['ring', 0.7]]);
        else if (hs0 === 'long') hstyle = wpick(R, [['long', 4], ['bob', 3], ['bun', lite ? 0.8 : 1.6], ['curls', 0.8]]);
        else if (hs0 === 'pony') hstyle = wpick(R, kid ? [['pony', 1]] : [['pony', 3], ['bun', 1.4]]);
        else if (hs0 === 'bald') hstyle = R() < 0.55 && !kid ? 'ring' : 'bald';
        else hstyle = 'crop';
      }
      const hairCol = hstyle === 'buzz' ? mix(hairC, skin, 0.22) : hairC;
      const shoes = o.shoes != null ? o.shoes : staff ? (R() < 0.7 ? 0x1d1f23 : 0x3a2a1e) : SNEAK[Math.floor(R() * SNEAK.length)];
      const hands = o.gloves != null ? o.gloves : skin;
      const extra = !staff && !bare && !kid && !lite ? R() : 1, pack = extra < 0.09 ? 'pack' : extra < 0.16 ? 'bum' : null;
      const shades = !staff && !bare && !kid && R() < (hk === 'helmet' ? 0.6 : 0.2);
      const belt = o.belt != null ? o.belt : !staff && !bare && !lite && bottom === 'trousers' && !shorts && R() < 0.22 ? (R() < 0.6 ? 0x3a2a1c : 0x15171c) : null;

      /* hips */
      if (!lite) add(hips, cube(-0.165, 0.165, -0.09, 0.09, -0.1, 0.1), BOX5, lower);
      /* torso */
      const hiOverall = overall && hiVis(shirt), mech = overall && !hiOverall && !uniHat && o.vest == null;
      const topCol = top === 'bare' ? skin : shirt;
      if (hiVest) {   // the hi-vis vest over the shirt: its shell, two bands round, braces over the shoulders (the scene's vest and stripes colours)
        const vc = o.vest, sc = o.stripes != null ? o.stripes : 0xd9dde2, g = 0.012;
        add(torso, frust(tw(TY0) + g, -td(TY0) - g, td(TY0) + g, TY0, TY0, tw(0.49) + g, -td(0.49) - g, td(0.49) + g, 0.49, 0.49), BOX5, vc);
        if (!lite) {
          for (const y of [0.11, 0.25]) add(torso, ring(y, y + 0.04, g + 0.006), SIDES, sc);
          for (const s of [1, -1]) { const a = s * 0.065, b = s * 0.11;
            front(torso, a, b, a, b, 0.29, 0.49, sc, g + 0.006); back(torso, a, b, a, b, 0.29, 0.49, sc, g + 0.006);
            addQ(torso, [a, 0.497, -td(0.49) - g - 0.006], [b, 0.497, -td(0.49) - g - 0.006], [b, 0.497, td(0.49) + g + 0.006], [a, 0.497, td(0.49) + g + 0.006], [0, 1, 0], sc); }
        }
      } else if (top === 'tank') {   // bare shoulders: the top's middle strip only
        add(torso, tbx(0.31, 0.41, 0.5, 0.2, 0.225, TY0), SIDES, shirt);
        addQ(torso, [-0.1, TY1, -0.1125], [0.1, TY1, -0.1125], [0.1, TY1, 0.1125], [-0.1, TY1, 0.1125], [0, 1, 0], shirt);
        for (const s of [1, -1]) addQ(torso, [s * 0.1, TY1, -0.1125], [s * 0.205, TY1, -0.1125], [s * 0.205, TY1, 0.1125], [s * 0.1, TY1, 0.1125], [0, 1, 0], skin);
      } else add(torso, tbx(0.31, 0.41, 0.5, 0.2, 0.225, TY0), BOX5, topCol);
      if (inner) front(torso, -0.052, 0.052, -0.072, 0.072, 0.0, 0.47, inner);   // (the open jacket's shirt)
      if (top === 'zip') front(torso, -0.004, 0.004, -0.004, 0.004, 0.0, 0.47, shade(shirt, 0.55), 0.006);
      if ((top === 'hoodie' || top === 'zip') && !lite) {   // the hood down on the back, a front pocket
        add(torso, frust(0.112, -0.17, -0.09, 0.32, 0.32, 0.122, -0.155, -0.085, 0.505, 0.505), PX | NX | PY | NZ, shade(shirt, 0.88));
        if (top === 'hoodie') front(torso, -0.1, 0.1, -0.09, 0.09, 0.03, 0.16, shade(shirt, 0.78));
      } else if (top === 'hoodie' || top === 'zip') add(torso, frust(0.11, -0.16, -0.09, 0.36, 0.36, 0.12, -0.15, -0.09, 0.5, 0.5), PX | NX | PY | NZ, shade(shirt, 0.88));
      if ((top === 'polo' || overall || (staff && top === 'long' && !vest)) && !lite) add(torso, frust(0.07, -0.064, 0.064, 0.465, 0.465, 0.079, -0.071, 0.071, 0.525, 0.525), BOX5, overall ? shade(shirt, 0.82) : R() < 0.5 ? shirt : away(shirt, [WHITE, BLACK, NAVY], R));
      if (overall && !lite) front(torso, -0.009, 0.009, -0.009, 0.009, 0.06, 0.465, shade(shirt, 0.62));   // (the zip)
      if (hiOverall && !lite) add(torso, ring(0.26, 0.305, 0.006), SIDES, 0xd9dde2);   // (the marshal's chest band)
      if (mech && !lite) add(torso, frust(tw(0.3) + 0.007, -td(0.3) - 0.007, td(0.3) + 0.007, 0.3, 0.3, tw(TY1) + 0.007, -td(TY1) - 0.007, td(TY1) + 0.007, TY1 + 0.006, TY1 + 0.006), BOX5, shade(shirt, 0.32));   // (the mechanic's dark yoke)
      if (plainVest && !lite) {
        if (lum(o.vest) > 0.7) addQ(torso, [-0.16, -0.36, 0.118], [0.16, -0.36, 0.118], [0.13, 0.4, 0.122], [-0.13, 0.4, 0.122], [0, 0, 1], o.vest);   // (a cook's apron, to the thighs)
        else { const C = ring(TY0, 0.45, 0.01); add(torso, C, PX | NX | NZ, o.vest); for (const s of [1, -1]) front(torso, s * 0.05, s * (tw(TY0) + 0.01), s * 0.09, s * (tw(0.45) + 0.01), TY0, 0.45, o.vest, 0.01); }   // (a waistcoat, open)
      }
      if (belt != null) add(torso, ring(-0.025, 0.025, 0.004), SIDES, belt);
      if (band != null) add(torso, ring(0.2, 0.3, 0.005), SIDES, band);   // (the jersey's band across the chest)
      if (pack === 'pack') { const pc = PACK[Math.floor(R() * PACK.length)], st = 0x2a2c31;
        add(torso, frust(0.12, -0.215, -0.1, 0.1, 0.1, 0.11, -0.2, -0.105, 0.4, 0.425), PX | NX | PY | NZ, pc);
        for (const s of [1, -1]) { const a = s * 0.07, b = s * 0.105; front(torso, a, b, a, b, 0.2, 0.475, st, 0.005);
          addQ(torso, [a, TY1 + 0.004, -0.113], [b, TY1 + 0.004, -0.113], [b, TY1 + 0.004, 0.115], [a, TY1 + 0.004, 0.115], [0, 1, 0], st); } }
      else if (pack === 'bum') add(torso, cube(-0.085, 0.085, -0.015, 0.065, 0.09, 0.15), PX | NX | PY | PZ, wpick(R, [[0x15171c, 3], [NAVY, 2], [0xc8a878, 1], [0xe85a9a, 1], [0xc8e04a, 1]]));
      if (!lite) add(torso, cube(-0.05, 0.05, 0.49, 0.57, -0.05, 0.05), SIDES, skin);   // the neck
      /* head */
      let cov = { top: false };
      if (hk) cov = hat(head, hk, hk === 'sun' && !o.hat ? SUN[Math.floor(R() * SUN.length)] : hc, o, R, hairC, hs0 || (o.hair || 'short'));
      if (!hk || hk === 'party') { const hc2 = hstyle || (hk === 'party' ? 'crop' : null); if (hc2) { const c2 = hair(head, hc2, hairCol, R, lite); cov = hk ? { top: c2.top } : c2; } }
      add(head, tbx(0.19, 0.175, 0.23, 0.21, 0.2, 0), PX | NX | PZ | (cov.back ? 0 : NZ) | (cov.top ? 0 : PY), skin);
      if (shades) addQ(head, [-0.078, 0.122, 0.106], [0.078, 0.122, 0.106], [0.076, 0.158, 0.105], [-0.076, 0.158, 0.105], [0, 0, 1], 0x15171c);
      /* arms: shoulder, elbow, hand */
      const bareArm = top === 'tank' || top === 'bare', longArm = long || top === 'long' || top === 'jacket' || top === 'hoodie' || top === 'zip';
      for (const sd of [1, -1]) {
        const sh = new THREE.Group(); sh.position.set(sd * 0.245, 0.45, 0); torso.add(sh); sh.rotation.order = 'ZXY';
        const el = new THREE.Group(); el.position.y = -0.29; sh.add(el);
        const hd = new THREE.Group(); hd.position.y = -0.3; el.add(hd);
        if (lite) { add(sh, cube(-0.0525, 0.0525, -0.29, 0.01, -0.055, 0.055), BOX5, bareArm ? skin : sleeve); add(el, cube(-0.045, 0.045, -0.24, 0, -0.0475, 0.0475), SIDES, longArm ? sleeve : skin); }
        else if (longArm) { add(sh, cube(-0.0525, 0.0525, -0.29, 0.01, -0.055, 0.055), BOX5, sleeve); add(el, cube(-0.045, 0.045, -0.24, 0, -0.0475, 0.0475), SIDES, sleeve);
          add(el, cube(-0.04, 0.04, -0.33, -0.24, -0.03, 0.03), SIDES, hands); }
        else if (bareArm) { add(sh, cube(-0.05, 0.05, -0.29, 0.01, -0.0525, 0.0525), BOX5, skin); add(el, cube(-0.045, 0.045, -0.24, 0, -0.0475, 0.0475), SIDES, skin);
          add(el, cube(-0.04, 0.04, -0.33, -0.24, -0.03, 0.03), SIDES, hands); }
        else { add(sh, cube(-0.0575, 0.0575, -0.125, 0.005, -0.06, 0.06), BOX5, sleeve); add(sh, cube(-0.044, 0.044, -0.295, -0.105, -0.0475, 0.0475), SIDES, skin);
          add(el, cube(-0.045, 0.045, -0.24, 0, -0.0475, 0.0475), SIDES, skin); add(el, cube(-0.04, 0.04, -0.33, -0.24, -0.03, 0.03), SIDES, hands); }
        if ((hiOverall || o.hat === 'fire') && !lite) add(el, cube(-0.051, 0.051, -0.2, -0.155, -0.0535, 0.0535), SIDES, o.hat === 'fire' ? (o.stripes || 0xe8d84a) : 0xd9dde2);   // (reflective bands)
        P.sh.push(sh); P.el.push(el); P.hand.push(hd);
      }
      /* legs: hip, knee */
      for (const sd of [1, -1]) {
        const hp = new THREE.Group(); hp.position.set(sd * 0.09, -0.05, 0); hips.add(hp);
        const kn = new THREE.Group(); kn.position.y = -0.41; hp.add(kn);
        add(hp, cube(-0.075, 0.075, -0.415, 0.015, -0.085, 0.085), SIDES, bottom === 'trousers' ? pants : skin);   // (the thigh: bare under a skirt)
        add(kn, cube(-0.0625, 0.0625, -0.38, 0, -0.0675, 0.0675), SIDES, shins);
        if (!lite) add(kn, cube(-0.0575, 0.0575, -0.46, staff ? -0.33 : -0.37, -0.09, 0.18), BOX5, shoes);
        if ((hiOverall || o.hat === 'fire') && !lite) add(kn, cube(-0.066, 0.066, -0.25, -0.205, -0.0715, 0.0715), SIDES, o.hat === 'fire' ? (o.stripes || 0xe8d84a) : 0xd9dde2);
        if (mech && !lite) { const x = sd * 0.0775; addQ(hp, [x, -0.4, -0.013], [x, -0.4, 0.013], [x, 0.0, 0.013], [x, 0.0, -0.013], [sd, 0, 0], 0xeeeeea);
          const x2 = sd * 0.065; addQ(kn, [x2, -0.36, -0.012], [x2, -0.36, 0.012], [x2, 0.0, 0.012], [x2, 0.0, -0.012], [sd, 0, 0], 0xeeeeea); }   // (white stripes down the overall's legs)
        P.hp.push(hp); P.kn.push(kn);
      }
      if (bottom !== 'trousers') {   // the skirt (or the dress's): its own joint on the hips, turned as the two legs on average (down when walking, forward when sitting)
        const sk = P.skirt = new THREE.Group(); sk.position.y = -0.05; hips.add(sk); P.xJ = [sk];
        add(sk, frust(0.212, -0.148, 0.148, -0.375, -0.375, 0.17, -0.106, 0.106, 0.045, 0.045), SIDES, lower);
      }
      return P;
    }
    function setJ(P, J, setJ0) { setJ0(P, J); const s = P.skirt; if (s) s.rotation.x = (P.hp[0].rotation.x + P.hp[1].rotation.x) * 0.5; }
    return { person, setJ };
  },

  /* ---------- the instanced crowd: the same 28 quads (168 index vertices), bones and colour groups; new groups 8 (the shoes' toes on the legs,
     the cap's brim on the body) and 9 (the shirt's second colour on its front); a vertex's .5 marks its second colour (the forearm, the head's
     lower back) ---------- */
  crowd(K) {
    const THREE = K.THREE;
    function geo() {
      const P = [], Nm = [], Cl = [], Pa = [], Ix = [], W1 = [1, 1, 1];
      const quad = (a, b, c, d, ins, part, col) => {   // flat quad facing away from 'ins'; part: a code or a function of the vertex
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
        const flip = nx * ((a[0] + c[0]) / 2 - ins[0]) + ny * ((a[1] + c[1]) / 2 - ins[1]) + nz * ((a[2] + c[2]) / 2 - ins[2]) < 0, s = flip ? -1 : 1, k = P.length / 3;
        for (const p of flip ? [a, d, c, b] : [a, b, c, d]) { P.push(p[0], p[1], p[2]); Nm.push(nx * s, ny * s, nz * s); Cl.push(col[0], col[1], col[2]); Pa.push(typeof part === 'function' ? part(p) : part); }
        Ix.push(k, k + 1, k + 2, k, k + 2, k + 3);
      };
      const cub = (x0, x1, y0, y1, z0, z1, f) => {
        const ins = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], F = {
          px: [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], nx: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]],
          py: [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]], ny: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]],
          pz: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], nz: [[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]] };
        for (const k in f) { const q = F[k]; quad(q[0], q[1], q[2], q[3], ins, f[k][0], f[k][1]); }
      };
      cub(-0.17, 0.17, 0, 0.84, -0.11, 0.11, { px: [33, W1], nx: [33, W1], pz: [33, W1], nz: [33, W1], ny: [38, W1] });   // legs; the soles (sitting) or, standing, the shoes' toes (the shader)
      cub(-0.22, 0.22, 0.84, 1.42, -0.13, 0.13, { px: [1, W1], nx: [1, W1], pz: [1, W1], nz: [1, W1], py: [1, W1] });   // torso
      quad([-0.06, 0.86, 0.137], [0.06, 0.86, 0.137], [0.06, 1.41, 0.137], [-0.06, 1.41, 0.137], [0, 1.1, 0], 9, W1);   // the open jacket's shirt, or a band across the chest (the shader)
      const side = (p) => p[1] > 1.6 ? 4 : p[2] > 0 ? 2 : 2.5;   // (the head's sides: hair above, the face's skin below; long hair down the back)
      cub(-0.11, 0.11, 1.44, 1.7, -0.12, 0.12, { px: [side, W1], nx: [side, W1], pz: [2, W1], nz: [(p) => p[1] > 1.6 ? 4 : 4.5, W1], py: [4, W1] });   // head
      quad([-0.09, 1.655, 0.12], [0.09, 1.655, 0.12], [0.085, 1.64, 0.215], [-0.085, 1.64, 0.215], [0, 1.5, 0.15], 8, W1);   // a cap's brim (folded away without a cap)
      for (const sd of [-1, 1]) { const b = sd < 0 ? 10 : 20, x0 = sd < 0 ? -0.32 : 0.22;   // arms (the sleeve's edge drawn by the fragment shader), the hand at the end
        const f = { pz: [b + 5, W1], nz: [b + 5, W1], ny: [b + 2, W1] }; f[sd < 0 ? 'nx' : 'px'] = [b + 5, W1];   // (the inner face, against the body, left out)
        cub(x0, x0 + 0.1, 0.8, 1.4, -0.06, 0.06, f); }
      quad([0.26, 0.82, 0.09], [0.3, 0.82, 0.09], [0.3, -0.68, 0.09], [0.26, -0.68, 0.09], [0.28, 0, 0], 40, [0.84, 0.84, 0.86]);   // flag pole, as the game's
      for (const [y0, y1, cg] of [[-0.955, -0.68, 56], [-1.23, -0.955, 57]]) quad([0.3, y1, 0.09], [1.2, y1, 0.09], [1.2, y0, 0.09], [0.3, y0, 0.09], [0.75, y0, 0], cg, W1);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nm, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(Cl, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(Pa, 1)); g.setIndex(Ix);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.4, 0), 2.4);
      return g;
    }
    // who wears what (the variant's bits as the game's: skin, trousers, hair or cap, sleeves, flag; and four hashes of the phase and variant). Two
    // colours a vertex: vColor and vCrB.rgb, the fragment taking the second where vCrB.a > 0.5 (vCrB.a linear in the part's height: a sharp edge
    // across a face without more vertices): the sleeve's edge, the shoes or bare legs under shorts, the hair line at the head's sides and back
    const COLOR = [
      'float crBone = floor(aPart * 0.1 + 0.01), crCf = aPart - crBone * 10.0, crCg = floor(crCf + 0.01), crSub = crCf - crCg;',
      'float crPose = floor(aCrowd.x), crPh = fract(aCrowd.x) * 6.2832, crV = aCrowd.y;',
      '#ifdef USE_INSTANCING_COLOR', 'vec3 crShirt = instanceColor;', '#else', 'vec3 crShirt = vec3(1.0);', '#endif',
      'vec3 crSkin = crP4(mod(crV, 4.0), vec3(0.96, 0.78, 0.63), vec3(0.86, 0.63, 0.47), vec3(0.66, 0.45, 0.31), vec3(0.42, 0.29, 0.2));',
      'float crHa = mod(floor(crV / 16.0), 8.0), crFl = mod(floor(crV / 256.0), 4.0);',
      'float crU1 = fract(crPh * 1.917 + crV * 0.01237), crU2 = fract(crPh * 3.141 + crV * 0.00731), crU3 = fract(crPh * 0.731 + crV * 0.02113), crU4 = fract(crPh * 2.371 + crV * 0.02917);',
      'float crHV = ((crShirt.r > 0.75 && crShirt.g > 0.3 * crShirt.r && crShirt.g < 0.75 * crShirt.r && crShirt.b < 0.25 * crShirt.r) || (crShirt.g > 0.66 && crShirt.r > 0.55 && crShirt.b < 0.3 * crShirt.g)) ? 1.0 : 0.0;',   // (hi-vis: the marshals)
      'float crCap = crHa > 3.5 ? 1.0 : 0.0, crCapBk = crCap * step(0.8, crU4);',   // (a cap; a fifth of them turned back)
      'float crJk = crHV < 0.5 && crU1 < 0.34 ? 1.0 : 0.0, crSt = crHV < 0.5 && crU1 > 0.93 ? 1.0 : 0.0;',   // (an open jacket over a shirt; a band across the chest)
      'float crLH = crCap < 0.5 && crU3 < 0.3 ? 1.0 : 0.0, crBald = crHa > 2.5 && crHa < 3.5 && crLH < 0.5 && crU3 > 0.5 ? 1.0 : 0.0;',   // (long hair; grey: a bald top for some)
      'float crSl = crHV > 0.5 || crJk > 0.5 || mod(floor(crV / 128.0), 2.0) > 0.5 ? 2.0 : crU2 < 0.22 ? 0.0 : 1.0;',   // (sleeves: long, short, none)
      'float crSho = crHV < 0.5 && crJk < 0.5 && fract(crU3 * 7.31 + crU1 * 3.7) < 0.38 ? 1.0 : 0.0;',   // (shorts)
      'float crSitC = abs(crPose - 6.0) < 0.5 ? 1.0 : 0.0;',
      'vec3 crHairC = crP4(crHa < 3.5 ? crHa : mod(floor(crU2 * 7.0), 3.0), vec3(0.1, 0.08, 0.06), vec3(0.3, 0.19, 0.11), vec3(0.68, 0.52, 0.28), vec3(0.56, 0.55, 0.53));',
      'vec3 crCapC = crHa < 4.5 ? vec3(0.05) : crHa < 5.5 ? crShirt : crHa < 6.5 ? vec3(0.94) : vec3(0.08, 0.1, 0.18);',
      'vec3 crTop = crCap > 0.5 ? crCapC : crHairC;',
      'float crSL = dot(crShirt, vec3(0.299, 0.587, 0.114));',
      'vec3 crIn = crSL > 0.45 ? (crU4 < 0.5 ? vec3(0.1, 0.1, 0.12) : vec3(0.12, 0.15, 0.3)) : crU4 < 0.45 ? vec3(0.93, 0.93, 0.9) : crU4 < 0.75 ? vec3(0.62, 0.72, 0.86) : vec3(0.72, 0.73, 0.76);',
      'vec3 crShoe = crU2 < 0.5 ? vec3(0.93, 0.93, 0.91) : crU2 < 0.75 ? vec3(0.1, 0.1, 0.11) : crU2 < 0.9 ? vec3(0.36, 0.23, 0.14) : vec3(0.55, 0.56, 0.6);',
      'vec3 crTint = vec3(1.0), crT2 = vec3(1.0); float crA = 0.0;',
      'if (crCg > 0.5 && crCg < 1.5) crTint = crShirt;',
      'else if (crCg > 1.5 && crCg < 2.5) { crTint = crSkin;',   // the face; the sides: hair (or the cap) on their top 38 %, all hair when long
      '  if (abs(normal.x) > 0.5) { if (crLH > 0.5) crTint = crHairC; else { crT2 = crTop; crA = (position.y - 1.44) * 3.1; } } }',
      'else if (crCg > 2.5 && crCg < 3.5) { crTint = crP4(mod(floor(crV / 4.0), 4.0), vec3(0.19, 0.27, 0.44), vec3(0.1, 0.1, 0.12), vec3(0.5, 0.44, 0.33), vec3(0.33, 0.34, 0.37));',
      '  if (crSho > 0.5) { crT2 = crSkin; crA = (0.84 - position.y) * 1.32; } else { crT2 = crShoe; crA = (0.84 - position.y) * 0.66; } }',   // (bare below the knee; or shoes, the bottom 9 %)
      'else if (crCg > 3.5 && crCg < 4.5) {',   // the head's top (hair, a cap, a bald crown) and back (hair, the cap's back above it)
      '  if (normal.y > 0.5) crTint = crCap > 0.5 ? crCapC : crBald > 0.5 ? crSkin * 0.96 : crHairC;',
      '  else { crTint = crHairC; if (crCap > 0.5) { crT2 = crCapC; crA = (position.y - 1.44) * 3.1; } } }',
      'else if (crCg > 4.5 && crCg < 5.5) { crTint = crSl > 0.5 ? crShirt : crSkin; crT2 = crSl > 1.5 ? crShirt : crSkin; crA = (1.4 - position.y) * 2.5; }',   // (the sleeve's edge a third down)
      'else if (crCg > 5.5 && crCg < 7.5) crTint = crCg < 6.5 ? crP4(crFl, vec3(0.95), vec3(0.84, 0.1, 0.12), vec3(0.1, 0.33, 0.78), vec3(0.1, 0.5, 0.22)) : crP4(crFl, vec3(0.84, 0.1, 0.12), vec3(0.95), vec3(0.98, 0.8, 0.1), vec3(0.95));',
      'else if (crCg > 7.5 && crCg < 8.5) crTint = crBone > 2.5 ? crShoe * (crSitC > 0.5 ? 0.72 : 1.0) : crCapC * 0.88;',
      'else if (crCg > 8.5) crTint = crHV > 0.5 ? vec3(0.86, 0.87, 0.9) : crSt > 0.5 ? (crSL > 0.45 ? vec3(0.1, 0.1, 0.12) : vec3(0.93, 0.93, 0.9)) : crIn;',
      'vColor = color * crTint; vCrB = vec4(color * crT2, crA);'].join('\n');
    // where: the brim (none without a cap, at the back for some), the front's second colour (an open jacket's shirt, a band), long hair, the toes
    const POS = [
      'if (crBone < 0.5) {',
      '  if (crCg > 7.5 && crCg < 8.5) { if (crCap < 0.5) transformed = vec3(0.0, 1.6, 0.0); else if (crCapBk > 0.5) transformed.xz = -transformed.xz; }',
      '  else if (crCg > 8.5) { if (crHV > 0.5 || crSt > 0.5) transformed = vec3(transformed.x * 3.62, transformed.y < 1.1 ? (crHV > 0.5 ? 1.11 : 1.14) : (crHV > 0.5 ? 1.18 : 1.22), 0.137); else if (crJk < 0.5) transformed = vec3(0.0, 1.1, 0.0); }',
      '  else if (crSub > 0.25 && crLH > 0.5) { transformed.y -= 0.19; transformed.z = -0.148; }',
      '}',
      'else if (crBone > 2.5 && crBone < 3.5 && crCg > 7.5 && crSitC < 0.5) transformed = vec3(transformed.x * 0.94, transformed.z < 0.0 ? 0.0 : 0.09, transformed.z < 0.0 ? 0.2 : 0.11);'].join('\n');
    const NORM = [
      'if (crBone > 2.5 && crBone < 3.5 && crCg > 7.5 && crSitC < 0.5) objectNormal = vec3(0.0, 0.747, 0.665);',   // (the toes' slope)
      'if (crBone < 0.5 && crCg > 7.5 && crCg < 8.5 && crCapBk > 0.5) objectNormal.xz = -objectNormal.xz;'].join('\n');
    function shader(S) {
      const at = 'if (crBone < 4.5) objectNormal = crM * objectNormal;', b0 = 'vec3 transformed = vec3(position);';
      if (S.CR_VS_NORMAL.indexOf(at) < 0 || S.CR_VS_POS.indexOf(b0) < 0) return S;   // (the game's chunks changed: keep them)
      return { CR_VS_HEAD: S.CR_VS_HEAD + '\nvarying vec4 vCrB;', CR_VS_COLOR: COLOR, CR_VS_NORMAL: S.CR_VS_NORMAL.replace(at, NORM + '\n' + at), CR_VS_POS: S.CR_VS_POS.replace(b0, b0 + '\n' + POS),
        frag: (f) => f.indexOf('#include <color_fragment>') < 0 ? f : f.replace('#include <common>', '#include <common>\nvarying vec4 vCrB;').replace('#include <color_fragment>', 'diffuseColor.rgb *= vCrB.a > 0.5 ? vCrB.rgb : vColor;') };
    }
    return { geo, shader };
  },
};
