// Rekviziti za slog »topli diorama«: debele gume (črne in prebarvane), sodi, betonske pregrade, stožci, kanistri, orodni voziček,
// šopi trave in barvna tla boksov z belimi vogali in krogom »STOP«. Vse je procedurno (brez prevzetih modelov ali tekstur) in se doda
// v prizor samo ob posnetku. Uporaba: window.__slog.props.place([...]) (glej spodaj), window.__slog.props.clear().
(() => {
  'use strict';
  const S = window.__slog; if (!S) throw new Error('najprej slog.js');
  const T = THREE, ST = S.ST;

  /* ---------------- pomočniki za geometrijo ---------------- */
  const rng = (seed) => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  // geometrija -> neindeksirana, z barvami oglišč fn(x, y, z, nx, ny, nz) -> [r, g, b]
  function paint(geo, fn) {
    const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position, n = g.attributes.normal, c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const col = fn(p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i)); c[i * 3] = col[0]; c[i * 3 + 1] = col[1]; c[i * 3 + 2] = col[2]; }
    g.setAttribute('color', new T.BufferAttribute(c, 3)); return g;
  }
  function merge(list) {
    let n = 0; for (const g of list) n += g.attributes.position.count;
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3); let o = 0;
    for (const g of list) { const k = g.attributes.position.count; P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); C.set(g.attributes.color ? g.attributes.color.array : new Float32Array(k * 3).fill(1), o * 3); o += k; }
    const r = new T.BufferGeometry(); r.setAttribute('position', new T.BufferAttribute(P, 3)); r.setAttribute('normal', new T.BufferAttribute(N, 3)); r.setAttribute('color', new T.BufferAttribute(C, 3)); r.computeBoundingSphere(); return r;
  }
  const xf = (geo, pos, rot, sc) => { const m = new T.Matrix4().compose(new T.Vector3(...(pos || [0, 0, 0])), new T.Quaternion().setFromEuler(new T.Euler(...(rot || [0, 0, 0]))), new T.Vector3(...(sc || [1, 1, 1]))); return geo.clone().applyMatrix4(m); };

  /* ---------------- modeli ---------------- */
  const KIT = {};
  // pnevmatika: debela, rahlo sploščena (R 0,27, cev 0,17), obrabljena stranica, zgornja ploskev lahko prebarvana (barva)
  KIT.tire = (barva) => {
    const g = new T.TorusGeometry(0.28, 0.17, 12, 22); g.rotateX(Math.PI / 2); g.scale(1, 1.05, 1);
    return paint(g, (x, y, z, nx, ny, nz) => {
      const r = Math.hypot(x, z), top = Math.max(0, Math.min(1, (ny - 0.30) / 0.45)), inner = r < 0.28 ? 1 : 0;
      let c = [0.085, 0.085, 0.09]; const band = 0.5 + 0.5 * Math.sin(Math.atan2(z, x) * 26);   // (profil: rahle proge po obodu)
      if (Math.abs(ny) < 0.55) { const k = 0.8 + 0.4 * band; c = [c[0] * k, c[1] * k, c[2] * k]; }
      if (barva) { const pk = Math.max(top, 0.82 - 0.25 * band * (1 - top)); c = [c[0] + (barva[0] * 0.95 - c[0]) * pk, c[1] + (barva[1] * 0.95 - c[1]) * pk, c[2] + (barva[2] * 0.95 - c[2]) * pk]; }
      if (inner && ny > 0) { const d = Math.max(0.25, (r - 0.1) / 0.18); c = [c[0] * d, c[1] * d, c[2] * d]; }
      return c;
    });
  };
  // sod: rebra, rob, pokrov (barva z instance)
  KIT.barrel = () => {
    const pts = [[0, 0], [0.27, 0], [0.30, 0.03], [0.30, 0.06], [0.285, 0.09], [0.285, 0.30], [0.30, 0.33], [0.30, 0.37], [0.285, 0.40], [0.285, 0.50], [0.30, 0.53], [0.30, 0.57], [0.285, 0.60], [0.285, 0.80], [0.30, 0.83], [0.30, 0.86], [0.275, 0.89], [0.25, 0.89], [0.25, 0.87], [0, 0.87]].map(p => new T.Vector2(p[0], p[1]));
    const g = new T.LatheGeometry(pts, 20);
    return paint(g, (x, y, z, nx, ny) => { const ring = (Math.abs(y - 0.35) < 0.05 || Math.abs(y - 0.55) < 0.05 || y > 0.82 || y < 0.07) ? 0.78 : 1.0; const top = ny > 0.8 ? 0.62 : 1; return [ring * top, ring * top, ring * top]; });
  };
  // betonska pregrada (profil New Jersey) 3 m, z režo in ušesi
  KIT.barrier = () => {
    const sh = new T.Shape(); [[-0.32, 0], [0.32, 0], [0.32, 0.11], [0.17, 0.52], [0.115, 0.84], [-0.115, 0.84], [-0.17, 0.52], [-0.32, 0.11]].forEach((p, i) => i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1]));
    const e = new T.ExtrudeGeometry(sh, { depth: 3.0, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }); e.translate(0, 0, -1.5);
    const body = paint(e, (x, y, z, nx, ny) => { const k = 0.80 + 0.14 * Math.min(1, Math.max(0, ny)) + 0.05 * Math.min(1, y); return [k * 0.97, k * 0.95, k * 0.90]; });
    const slot = paint(new T.BoxGeometry(2.4, 0.07, 0.04), () => [0.30, 0.29, 0.28]); const s1 = xf(slot, [0, 0.62, 0.15], [0, Math.PI / 2, 0]), s2 = xf(slot, [0, 0.62, -0.15], [0, Math.PI / 2, 0]);
    const lug = paint(new T.TorusGeometry(0.06, 0.012, 6, 10, Math.PI), () => [0.12, 0.12, 0.13]);
    return merge([body, xf(lug, [0, 0.86, 1.15], [0, 0, 0]), xf(lug, [0, 0.86, -1.15], [0, 0, 0])]);
  };
  KIT.cone = () => {
    const c = paint(new T.ConeGeometry(0.17, 0.70, 14, 3), (x, y) => { const band = (y > 0.0 && y < 0.14) ? 1 : 0; return band ? [0.95, 0.95, 0.92] : [1, 0.42, 0.10]; });
    const b = paint(new T.BoxGeometry(0.48, 0.045, 0.48), () => [0.16, 0.16, 0.17]);
    return merge([xf(c, [0, 0.40, 0]), xf(b, [0, 0.0225, 0])]);
  };
  KIT.can = () => {   // kanister za gorivo
    const b = paint(new T.BoxGeometry(0.36, 0.44, 0.17), (x, y, z, nx, ny) => ny > 0.7 ? [0.8, 0.8, 0.8] : [1, 1, 1]);
    const h = paint(new T.BoxGeometry(0.12, 0.10, 0.17), () => [0.85, 0.85, 0.85]), cap = paint(new T.CylinderGeometry(0.035, 0.04, 0.05, 10), () => [0.12, 0.12, 0.13]);
    return merge([xf(b, [0, 0.22, 0]), xf(h, [-0.12, 0.49, 0]), xf(cap, [0.10, 0.465, 0])]);
  };
  KIT.chest = () => {   // orodni voziček s predali (barva z instance)
    const body = paint(new T.BoxGeometry(1.15, 0.92, 0.55), (x, y, z, nx, ny, nz) => ny > 0.7 ? [0.5, 0.5, 0.52] : [1, 1, 1]);
    const parts = [xf(body, [0, 0.55, 0])];
    for (let k = 0; k < 4; k++) parts.push(xf(paint(new T.BoxGeometry(1.0, 0.012, 0.01), () => [0.18, 0.18, 0.2]), [0, 0.30 + k * 0.19, 0.28]));
    parts.push(xf(paint(new T.BoxGeometry(0.5, 0.025, 0.02), () => [0.75, 0.75, 0.78]), [0, 0.39, 0.285]), xf(paint(new T.BoxGeometry(0.5, 0.025, 0.02), () => [0.75, 0.75, 0.78]), [0, 0.77, 0.285]));
    for (const sx of [-0.5, 0.5]) parts.push(xf(paint(new T.CylinderGeometry(0.06, 0.06, 0.05, 10), () => [0.08, 0.08, 0.09]), [sx, 0.06, 0.2], [Math.PI / 2, 0, 0]), xf(paint(new T.CylinderGeometry(0.06, 0.06, 0.05, 10), () => [0.08, 0.08, 0.09]), [sx, 0.06, -0.2], [Math.PI / 2, 0, 0]));
    return merge(parts);
  };
  KIT.jack = () => {   // dvigalo (rdeče)
    const p = [xf(paint(new T.CylinderGeometry(0.03, 0.05, 0.5, 8), () => [0.9, 0.12, 0.1]), [0, 0.3, 0]), xf(paint(new T.BoxGeometry(0.34, 0.05, 0.34), () => [0.8, 0.1, 0.08]), [0, 0.03, 0]), xf(paint(new T.CylinderGeometry(0.09, 0.07, 0.06, 8), () => [0.15, 0.15, 0.16]), [0, 0.58, 0])];
    return merge(p);
  };
  // šop trave: dve pokončni ploskvi (ukrivljene lističe riše platno), normale gor, da jih sonce osvetli kot tla
  function tuftTexture() {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d'), R = rng(5);
    x.clearRect(0, 0, 128, 128);
    for (let k = 0; k < 11; k++) {
      const bx = 20 + R() * 88, h = 62 + R() * 60, bend = (R() - 0.5) * 56, w = 6 + R() * 6, l = 0.5 + R() * 0.5;
      const gr = x.createLinearGradient(0, 128, 0, 128 - h); gr.addColorStop(0, `rgb(${Math.round(70 + 40 * l)},${Math.round(104 + 50 * l)},${Math.round(36 + 14 * l)})`); gr.addColorStop(1, `rgb(${Math.round(150 + 90 * l)},${Math.round(176 + 70 * l)},${Math.round(70 + 40 * l)})`);
      x.fillStyle = gr;
      x.beginPath(); x.moveTo(bx - w, 128); x.quadraticCurveTo(bx - w * 0.3 + bend * 0.2, 128 - h * 0.55, bx + bend, 128 - h); x.quadraticCurveTo(bx + w * 0.3 + bend * 0.2, 128 - h * 0.5, bx + w, 128); x.fill();
    }
    const t = new T.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  KIT.tuft = () => {
    const a = new T.PlaneGeometry(0.62, 0.5), b = a.clone().rotateY(Math.PI / 2 * 0.95), c = a.clone().rotateY(Math.PI / 3.2);
    const g = merge([paint(xf(a, [0, 0.24, 0]), () => [1, 1, 1]), paint(xf(b, [0, 0.24, 0]), () => [1, 1, 1]), paint(xf(c, [0, 0.24, 0]), () => [1, 1, 1])].map(q => q));
    const nn = g.attributes.normal.array; for (let i = 0; i < nn.length; i += 3) { nn[i] = 0; nn[i + 1] = 1; nn[i + 2] = 0; }
    // uv: vsaka ploskev svoj 0..1
    const uv = new Float32Array(g.attributes.position.count * 2); for (let q = 0; q < 3; q++) for (let i = 0; i < 4; i++) { const k = (q * 4 + i); const idx = [[0, 1], [1, 1], [0, 0], [1, 0]][i]; uv[k * 2] = idx[0]; uv[k * 2 + 1] = idx[1]; }
    return { g, uv };
  };

  /* ---------------- instance ---------------- */
  const mats = {};
  const lam = () => mats.lam || (mats.lam = new T.MeshLambertMaterial({ vertexColors: true }));
  function inst(geo, n, mat, shadow) {
    const m = new T.InstancedMesh(geo, mat || lam(), n); m.frustumCulled = false; m.castShadow = shadow !== false; m.receiveShadow = true; m.count = 0; m.userData.stil = true; return m;
  }
  const _m = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _v = new T.Vector3(), _s = new T.Vector3(), _c = new T.Color();
  function add(m, x, y, z, yaw, sc, color, tilt) {
    const i = m.count++; if (i >= m.instanceMatrix.count) { m.count--; return; }
    _e.set(tilt ? tilt[0] : 0, yaw || 0, tilt ? tilt[1] : 0, 'YXZ'); _q.setFromEuler(_e); _v.set(x, y, z); const k = sc == null ? 1 : sc; _s.set(Array.isArray(k) ? k[0] : k, Array.isArray(k) ? k[1] : k, Array.isArray(k) ? k[2] : k);
    _m.compose(_v, _q, _s); m.setMatrixAt(i, _m); if (color) m.setColorAt(i, _c.setRGB(color[0], color[1], color[2])); else m.setColorAt(i, _c.setRGB(1, 1, 1));
  }
  const geoCache = {};
  const geo = (k, a) => geoCache[k + (a ? JSON.stringify(a) : '')] || (geoCache[k + (a ? JSON.stringify(a) : '')] = KIT[k](a));

  /* ---------------- postavitev ---------------- */
  const ctx = () => { const g = window.__game, T0 = g.race.track, P = g.race.player; return { g, T: T0, P, i0: T0.nearestIdx(P.x, P.z), W: Render.world }; };
  // točka ob progi: s = metri od avta po poti (negativno: za njim), side +1 desno / -1 levo (kot smer vožnje), off = razdalja od sredine proge
  function at(c, s, side, off) {
    const Tk = c.T, N = Tk.N, f = c.i0 + s / Tk.ds, fl = Math.floor(f), t = f - fl;
    const ix = (k) => Tk.open ? Math.max(0, Math.min(N - 1, k)) : ((k % N) + N) % N, ia = ix(fl), ib = ix(fl + 1), L = (a, b) => a + (b - a) * t;
    const cx = L(Tk.px[ia], Tk.px[ib]), cz = L(Tk.pz[ia], Tk.pz[ib]), hy = L(Tk.hy[ia], Tk.hy[ib]); let tx = L(Tk.tx[ia], Tk.tx[ib]), tz = L(Tk.tz[ia], Tk.tz[ib]); const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    const nx = -tz, nz = tx, x = cx + nx * side * off, z = cz + nz * side * off;
    let y = c.W.groundH ? c.W.groundH(x, z) : hy; if (!Number.isFinite(y)) y = hy;
    return { x, z, y, hy, i: ia, yaw: Math.atan2(tz, tx), tx, tz, nx, nz };
  }
  const PAL = { red: [0.80, 0.14, 0.11], green: [0.18, 0.50, 0.22], rust: [0.55, 0.26, 0.14], blue: [0.16, 0.34, 0.66], yellow: [0.92, 0.70, 0.14], teal: [0.12, 0.55, 0.52], white: [0.92, 0.92, 0.9], grey: [0.5, 0.52, 0.55], orange: [0.95, 0.45, 0.12] };
  const col = (k) => Array.isArray(k) ? k : PAL[k] || PAL.red;
  // barve tal v boksih (kot na slikah: modrozelena, rdeča, vijolična, rumena, zelena, oranžna, modra); 0..255
  const PADPAL = [[34, 176, 164], [228, 84, 66], [160, 96, 186], [240, 190, 56], [108, 178, 92], [244, 136, 48], [72, 130, 206], [214, 76, 130]];

  function group() { const g = new T.Group(); g.userData.stil = true; Render.scene.add(g); ST.added.push(g); return g; }
  let GRP = null;
  const grp = () => GRP || (GRP = group());

  // Vrste: { t: 'tires', s0, s1, side, off, step, rows, high, paint: 'white'|'red'|'black'|'mix' }, 'barrels', 'barrier', 'cones', 'cans', 'chests', 'tufts', 'pitPaint', 'marker'
  const MAKE = {
    tires(c, o) {
      const R = rng(o.seed || 3), plain = inst(geo('tire', null), 1400, null), white = inst(geo('tire', PAL.white), 1400, null), red = inst(geo('tire', PAL.red), 600, null);
      const step = o.step || 0.95, rows = o.rows || 1, hi = o.high || 3;
      for (let s = o.s0; s <= o.s1; s += step) for (let r = 0; r < rows; r++) {
        const p = at(c, s, o.side, o.off + r * 0.98 * (o.side < 0 ? 1 : 1)); const col0 = o.paint === 'mix' ? (Math.floor((s - o.s0) / step / 2 + r) % 2 ? white : plain) : o.paint === 'white' ? white : o.paint === 'red' ? red : plain;
        const h = Math.max(1, Math.round(hi + (R() - 0.5) * (o.vary == null ? 1 : o.vary) * 2)) - (r > 0 ? 1 : 0);
        for (let k = 0; k < h; k++) add(col0, p.x + (R() - 0.5) * 0.06, p.y + 0.17 + k * 0.34, p.z + (R() - 0.5) * 0.06, R() * 6.28, 1, null);
      }
      return [plain, white, red];
    },
    barrels(c, o) {
      const R = rng(o.seed || 4), m = inst(geo('barrel'), 400, null), keys = o.colors || ['red', 'green', 'rust', 'blue', 'yellow'];
      for (let s = o.s0; s <= o.s1; s += o.step || 2.2) { const p = at(c, s + (R() - 0.5) * 0.8, o.side, o.off + (R() - 0.5) * (o.jit == null ? 1.2 : o.jit)); const n = o.group || 1;
        for (let k = 0; k < n; k++) add(m, p.x + (k ? (R() - 0.5) * 1.3 : 0), p.y, p.z + (k ? (R() - 0.5) * 1.3 : 0), R() * 6.28, 1, col(keys[Math.floor(R() * keys.length)]), (R() < 0.12 && k) ? [(R() - 0.5) * 1.2, (R() - 0.5) * 0.4] : null); }
      return [m];
    },
    barrier(c, o) {
      const R = rng(o.seed || 5), m = inst(geo('barrier'), 300, null);
      for (let s = o.s0; s <= o.s1; s += 3.05) { const p = at(c, s, o.side, o.off); add(m, p.x, p.y, p.z, -p.yaw + Math.PI / 2 + (R() - 0.5) * 0.02, 1, [0.92 + R() * 0.1, 0.92 + R() * 0.1, 0.9 + R() * 0.1]); }
      return [m];
    },
    cones(c, o) {
      const R = rng(o.seed || 6), m = inst(geo('cone'), 200, null);
      for (let s = o.s0; s <= o.s1; s += o.step || 4) { const p = at(c, s, o.side, o.off + (R() - 0.5) * (o.jit || 0.4)); add(m, p.x, p.y, p.z, R() * 6.28, 1, null, R() < 0.06 ? [1.2, 0] : null); }
      return [m];
    },
    cans(c, o) { const R = rng(o.seed || 7), m = inst(geo('can'), 80, null);
      for (let s = o.s0; s <= o.s1; s += o.step || 5) { const p = at(c, s, o.side, o.off + (R() - 0.5) * 0.8); add(m, p.x, p.y, p.z, R() * 6.28, 1, col(o.color || 'red')); } return [m]; },
    chests(c, o) { const R = rng(o.seed || 8), m = inst(geo('chest'), 40, null), keys = o.colors || ['teal', 'red'];
      let n = 0; for (let s = o.s0; s <= o.s1; s += o.step || 10) { const p = at(c, s, o.side, o.off); add(m, p.x, p.y, p.z, -p.yaw + (o.face || 0), 1, col(keys[n++ % keys.length])); } return [m]; },
    tufts(c, o) {
      const R = rng(o.seed || 9), k = KIT.tuft(), gg = k.g; gg.setAttribute('uv', new T.BufferAttribute(k.uv, 2));
      if (!mats.tuft) mats.tuft = new T.MeshLambertMaterial({ map: tuftTexture(), alphaTest: 0.45, side: T.DoubleSide, vertexColors: true });
      const m = new T.InstancedMesh(gg, mats.tuft, o.n || 2500); m.frustumCulled = false; m.castShadow = false; m.receiveShadow = true; m.count = 0; m.userData.stil = true;
      const tint = o.tint || [[1.0, 1.12, 0.75], [1.25, 1.18, 0.7], [0.9, 1.05, 0.7]];
      for (let q = 0; q < (o.n || 2500); q++) { const s = o.s0 + R() * (o.s1 - o.s0), off = o.off0 + R() * (o.off1 - o.off0), sd = o.side === 0 ? (R() < 0.5 ? -1 : 1) : o.side; const p = at(c, s, sd, off);
        const t = tint[Math.floor(R() * tint.length)], sz = (o.size || 0.8) * (0.7 + R() * 0.8); add(m, p.x, p.y - 0.02, p.z, R() * 6.28, [sz, sz * (0.8 + R() * 0.7), sz], t); }
      return [m];
    },
    // barvna tla boksov (Bathurst): ob vsakem boksu tlorisna barva garaže, beli vogali, krog STOP
    pitPaint(c, o) {
      const B = (c.W.pitBoxes || []).filter(b => !b.mine || o.mine); const meshes = [];
      const R = rng(o.seed || 11);
      for (let k = 0; k < B.length; k++) {
        const b = B[k], e = B[k + 1] || null, e0 = B[k - 1] || null;
        const dyds = e ? (e.y - b.y) / 10 : e0 ? (b.y - e0.y) / 10 : 0;
        const ln = o.len || 9.2, d0 = o.d0 != null ? o.d0 : b.lane - 1.2, d1 = o.d1 != null ? o.d1 : b.lane + 4.6;
        const tex = padTexture(b, R, o);
        const corner = (a, d) => { const x = b.ox + b.tx * a + b.nx * d, z = b.oz + b.tz * a + b.nz * d; return [x, b.y + dyds * a + (o.lift == null ? 0.05 : o.lift), z]; };
        const P = [corner(-ln / 2, d0), corner(ln / 2, d0), corner(ln / 2, d1), corner(-ln / 2, d1)];
        const geom = new T.BufferGeometry(); geom.setAttribute('position', new T.BufferAttribute(new Float32Array(P.flat()), 3));
        geom.setAttribute('uv', new T.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2)); geom.setAttribute('normal', new T.BufferAttribute(new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]), 3)); geom.setIndex([0, 2, 1, 0, 3, 2]);
        const mat = new T.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 });
        const m = new T.Mesh(geom, mat); m.receiveShadow = true; m.frustumCulled = false; m.userData.stil = true; m.renderOrder = 2; meshes.push(m);
      }
      return meshes;
    },
    // betonske pregrade med boksi: pravokotno na vozni pas, od d0 do d1 (po 3 m)
    partitions(c, o) {
      const B = (c.W.pitBoxes || []), m = inst(geo('barrier'), 200, null), R = rng(o.seed || 12);
      for (const b of B) { if (o.skipMine && b.mine) continue; if (o.skipK && o.skipK.includes(b.k)) continue; const a = (o.shift == null ? -4.7 : o.shift);
        for (let d = o.d0 + 1.5; d < o.d1; d += 3.05) { const x = b.ox + b.tx * a + b.nx * d, z = b.oz + b.tz * a + b.nz * d; add(m, x, b.y + (b.dyds || 0) * a + 0.02, z, Math.atan2(b.nx, b.nz), 1, [0.92 + R() * 0.1, 0.92 + R() * 0.1, 0.9 + R() * 0.1]); } }
      return [m];
    },
    // vsebina boksov: orodni vozički, kanistri, gume, sodi ob steni garaže (d), na vsakem boksu po izbiri
    pitStuff(c, o) {
      const B = (c.W.pitBoxes || []), R = rng(o.seed || 13), chest = inst(geo('chest'), 40, null), tire = inst(geo('tire', null), 400, null), tireW = inst(geo('tire', PAL.white), 400, null), can = inst(geo('can'), 60, null), barrel = inst(geo('barrel'), 80, null), jack = inst(geo('jack'), 60, null), cone = inst(geo('cone'), 120, null);
      const P = (b, a, d) => [b.ox + b.tx * a + b.nx * d, b.y + 0.02, b.oz + b.tz * a + b.nz * d];
      for (const b of B) {
        const yaw = Math.atan2(b.nx, b.nz), r = R(), dd = o.d || 25.0;
        if (r < 0.55) { const p = P(b, -3.6 + R() * 1.5, dd); add(chest, p[0], p[1], p[2], yaw + Math.PI / 2, 1, col(r < 0.28 ? 'teal' : 'red')); }
        // kup pnevmatik (2 do 4), bele in črne
        const nt = 2 + Math.floor(R() * 3), tp = P(b, 2.2 + R() * 1.6, dd - 0.6 + R() * 0.6);
        for (let k = 0; k < nt; k++) add(R() < 0.45 ? tireW : tire, tp[0] + (R() - 0.5) * 0.05, tp[1] + 0.17 + k * 0.34, tp[2] + (R() - 0.5) * 0.05, R() * 6.3, 1, null);
        if (R() < 0.6) { const p = P(b, 3.8 + R() * 1.0, dd - 0.2); add(barrel, p[0], p[1], p[2], R() * 6, 1, col(['red', 'green', 'rust', 'blue'][Math.floor(R() * 4)])); const p2 = P(b, 4.6 + R() * 0.6, dd - 1.3); add(can, p2[0], p2[1], p2[2], R() * 6, 1, col('red')); }
        if (R() < 0.7) { const p = P(b, -1.2 + R() * 1.0, dd - 1.2); add(jack, p[0], p[1], p[2], R() * 6, 1, null); }
        const cp = P(b, 4.7, (o.d0 || 17.0) - 0.4); add(cone, cp[0], cp[1], cp[2], 0, 0.9, null); const cp2 = P(b, -4.7, (o.d0 || 17.0) - 0.4); add(cone, cp2[0], cp2[1], cp2[2], 0, 0.9, null);
      }
      return [chest, tire, tireW, can, barrel, jack, cone];
    },
    // sledi gum: trakovi po vozni črti (po dva vzporedna, rahlo vijugasta), prosojna tekstura z risanimi lisami
    skids(c, o) {
      const R = rng(o.seed || 14), cv = document.createElement('canvas'); cv.width = 1024; cv.height = 128; const x = cv.getContext('2d');
      // dva pasova (leva in desna kolesa), vsak iz mehkih odsekov različne prosojnosti in širine (gradient čez pas)
      for (const vv of [0.28, 0.72]) for (let k = 0; k < 70; k++) {
        const u = R() * 1024, len = 60 + R() * 260, a = 0.10 + R() * 0.26, h = 14 + R() * 20, cy = vv * 128 + (R() - 0.5) * 6;
        const gr = x.createLinearGradient(0, cy - h / 2, 0, cy + h / 2); gr.addColorStop(0, 'rgba(12,10,10,0)'); gr.addColorStop(0.5, `rgba(12,10,10,${a})`); gr.addColorStop(1, 'rgba(12,10,10,0)');
        x.fillStyle = gr; x.fillRect(u, cy - h / 2, len, h); if (u + len > 1024) x.fillRect(u - 1024, cy - h / 2, len, h);
      }
      const tex = new T.CanvasTexture(cv); tex.wrapS = T.RepeatWrapping; tex.anisotropy = 8;
      const meshes = [];
      for (const ln of o.lines || [{ lat: 0, w: 2.6 }]) {
        const pos = [], uv = [], idx = [], step = 1.0, n = Math.round((o.s1 - o.s0) / step);
        for (let k = 0; k <= n; k++) { const s = o.s0 + k * step, wob = (ln.wob == null ? 0.5 : ln.wob) * Math.sin(s / 31 + (ln.ph || 0)) + 0.25 * Math.sin(s / 11 + (ln.ph || 0) * 2);
          for (const e of [-1, 1]) { const p = at(c, s, 1, ln.lat + wob + e * ln.w / 2); pos.push(p.x, p.hy + (o.lift == null ? 0.05 : o.lift), p.z); uv.push(s / (ln.rep || 12), e < 0 ? 0 : 1); }
          if (k) { const a = (k - 1) * 2, b = k * 2; idx.push(a, b, a + 1, a + 1, b, b + 1); } }
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setAttribute('normal', new T.Float32BufferAttribute(new Float32Array(pos.length).map((v, i) => i % 3 === 1 ? 1 : 0), 3)); g.setIndex(idx);
        const m = new T.Mesh(g, new T.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5, opacity: o.opacity == null ? 0.9 : o.opacity }));
        m.frustumCulled = false; m.receiveShadow = true; m.userData.stil = true; m.renderOrder = 1; meshes.push(m);
      }
      return meshes;
    },
    // nočne luči: tople točkovne luči ob svetilkah, ki jih igra že pozna (Render.show.lamps), najbližje središču pogleda
    lamps(c, o) {
      const L = (Render.show && Render.show.lamps) || [], cx = Render.cam.vcx, cz = Render.cam.vcz, lst = L.map(l => ({ l, d: Math.hypot(l[0] - cx, l[2] - cz) })).sort((a, b) => a.d - b.d).slice(0, o.n || 12), out = [];
      for (const { l } of lst) { const pl = new T.PointLight(o.color || 0xffc98a, o.i || 1.5, o.dist || 30, o.decay || 1.6); pl.position.set(l[0], l[1] + (o.h || 6.5), l[2]); pl.userData.stil = true; out.push(pl); }
      return out;
    },
    marker(c, o) { const m = inst(geo('cone'), 100, null); for (const d of o.offs) { const p = at(c, o.s || 0, o.side || 1, d); add(m, p.x, p.y, p.z, 0, o.sc || 1.4, col(o.color || 'yellow')); } return [m]; },
  };
  // platno za tla boksa: barva ekipe (iz vrat garaže), obrabljena, madeži peska, beli vogali za avto in krog STOP ob progi
  function padTexture(b, R, o) {
    const W = 768, H = 640, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
    const base = (o.colors || PADPAL)[b.k % (o.colors || PADPAL).length];
    // barva: nasičena, malo zmehčana
    const sat = (v) => Math.round(Math.max(0, Math.min(255, v)));
    const hsv = (r, g, bl) => { const m = (r + g + bl) / 3; const k = 1.12, b = 1.3; return [sat((m + (r - m) * k) * b), sat((m + (g - m) * k) * b), sat((m + (bl - m) * k) * b)]; };
    const bc = hsv(...base);
    x.fillStyle = `rgb(${bc[0]},${bc[1]},${bc[2]})`; x.fillRect(0, 0, W, H);
    // obrabljenost: tisoč lis različnih odtenkov
    for (let q = 0; q < 1100; q++) { const px = R() * W, py = R() * H, r = 2 + R() * 22, a = 0.03 + R() * 0.08, d = R() < 0.38; x.fillStyle = d ? `rgba(30,22,16,${a})` : `rgba(255,244,225,${a})`; x.beginPath(); x.ellipse(px, py, r, r * (0.4 + R() * 0.8), R() * 3, 0, 6.3); x.fill(); }
    // madeži peska ob robovih
    for (let q = 0; q < 9; q++) { const px = R() < 0.5 ? R() * W * 0.25 : W - R() * W * 0.25, py = R() * H, r = 60 + R() * 110; const gr = x.createRadialGradient(px, py, 0, px, py, r); gr.addColorStop(0, 'rgba(214,190,150,0.55)'); gr.addColorStop(0.6, 'rgba(214,190,150,0.25)'); gr.addColorStop(1, 'rgba(214,190,150,0)'); x.fillStyle = gr; x.fillRect(px - r, py - r, r * 2, r * 2); }
    // razpoke
    x.strokeStyle = 'rgba(25,18,14,0.35)'; x.lineWidth = 1.5; for (let q = 0; q < 5; q++) { let px = R() * W, py = R() * H; x.beginPath(); x.moveTo(px, py); for (let t = 0; t < 14; t++) { px += (R() - 0.5) * 50; py += (R() - 0.2) * 38; x.lineTo(px, py); } x.stroke(); }
    // beli vogali (mesto avta) in krog STOP
    x.strokeStyle = 'rgba(247,244,238,0.96)'; x.lineWidth = 15; x.lineCap = 'butt';
    const ax0 = W * 0.16, ax1 = W * 0.84, ay0 = H * 0.13, ay1 = H * 0.62, L = 92;
    for (const [cx, cy, sx, sy] of [[ax0, ay0, 1, 1], [ax1, ay0, -1, 1], [ax0, ay1, 1, -1], [ax1, ay1, -1, -1]]) { x.beginPath(); x.moveTo(cx + sx * L, cy); x.lineTo(cx, cy); x.lineTo(cx, cy + sy * L); x.stroke(); }
    // krog STOP ob robu proti progi (v. d0)
    const sx0 = W * 0.5, sy0 = H * 0.83, sr = 74; x.fillStyle = 'rgba(205,40,36,0.97)'; x.beginPath(); x.arc(sx0, sy0, sr, 0, 6.3); x.fill();
    x.strokeStyle = 'rgba(248,246,240,0.97)'; x.lineWidth = 9; x.beginPath(); x.arc(sx0, sy0, sr - 4, 0, 6.3); x.stroke();
    x.fillStyle = 'rgba(248,246,240,0.97)'; x.font = 'bold 50px Arial, Helvetica, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('STOP', sx0, sy0 + 2);
    // robna črta
    x.fillStyle = 'rgba(245,242,235,0.85)'; x.fillRect(0, H - 9, W, 9);
    // še enkrat rahla obrabljenost čez belo
    for (let q = 0; q < 260; q++) { x.fillStyle = `rgba(${bc[0]},${bc[1]},${bc[2]},${0.10 + R() * 0.25})`; const px = R() * W, py = R() * H; x.beginPath(); x.ellipse(px, py, 1 + R() * 8, 1 + R() * 4, R() * 3, 0, 6.3); x.fill(); }
    const t = new T.CanvasTexture(cv); t.anisotropy = 8; t.encoding = T.LinearEncoding; return t;
  }

  // razprševanje po zaslonu: iz globine in barve zadnjega okvirja (ST.grabbed) izberemo točke na tleh določene barve in jim dodamo šope
  //   vrste: { t: 'grass', n, size, maxD, minD } (zelena tla), { t: 'stones', n, size } (rjava/siva tla, kamenčki), { t: 'flowers', n } (barvne pike na travi)
  function scatter(list) {
    const G = ST.grabbed; if (!G) return 0;
    const { w, h, depth, color, near, far, fov, aspect, mw } = G, tan = Math.tan(fov * Math.PI / 360), R = rng(77), W = Render.world, out = [];
    const dz = (i) => { const d = (depth[i] * (1 / 16777216) + depth[i + 1] * (1 / 65536) + depth[i + 2] * (1 / 256) + depth[i + 3]) / 255 * (255 / 256) * 255 / 255; return d; };
    // (three: unpackRGBAToDepth = dot(rgba01, (255/256) / (256^3, 256^2, 256, 1)): A je najpomembnejši bajt)
    const lin = (i) => { const r = depth[i] / 255, g = depth[i + 1] / 255, b = depth[i + 2] / 255, a = depth[i + 3] / 255, d = (r / 16777216 + g / 65536 + b / 256 + a) * (255 / 256); return (near * far) / (far - (far - near) * d); };
    const V = new T.Vector3();
    const world = (px, py, z) => { V.set(((px + 0.5) / w * 2 - 1) * tan * aspect * z, ((py + 0.5) / h * 2 - 1) * tan * z, -z).applyMatrix4(mw); return V; };
    for (const o of list) {
      const kind = o.t || 'grass', N = o.n || 3000, tries = N * 40, pts = [];
      let zmax = 1; for (let q = 0; q < 400; q++) { const i = (Math.floor(R() * h) * w + Math.floor(R() * w)) * 4; zmax = Math.max(zmax, Math.min(lin(i), o.maxD || 120)); }
      for (let q = 0; q < tries && pts.length < N; q++) {
        const px = Math.floor(R() * w), py = Math.floor(R() * h), i = (py * w + px) * 4, z = lin(i);
        if (z > far * 0.9 || z > (o.maxD || 120) || z < (o.minD || 6)) continue;
        if (R() > (z / zmax) * (z / zmax)) continue;   // (enakomerna gostota na tleh: oddaljene točke so gostejše na zaslonu)
        const r = color[i], g = color[i + 1], b = color[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = (mx - mn) / Math.max(1, mx);
        let ok = false;
        if (kind === 'grass') ok = g > r * 1.06 && g > b * 1.2 && sat > 0.22 && mx > 40;
        else if (kind === 'stones') ok = r > b * 1.12 && sat > 0.12 && sat < 0.5 && mx > 70 && g < r * 1.12;
        else if (kind === 'flowers') ok = g > r * 1.06 && g > b * 1.2 && sat > 0.22;
        if (!ok) continue;
        const p = world(px, py, z), gh = W.groundH ? W.groundH(p.x, p.z) : p.y;
        if (Number.isFinite(gh) && Math.abs(p.y - gh) > 0.45) continue;   // (samo na tleh: ne na krošnjah, strehah, avtih)
        pts.push([p.x, p.y, p.z, z]);
      }
      if (kind === 'grass') {
        const k = KIT.tuft(), gg = k.g; gg.setAttribute('uv', new T.BufferAttribute(k.uv, 2));
        if (!mats.tuft) mats.tuft = new T.MeshLambertMaterial({ map: tuftTexture(), alphaTest: 0.45, side: T.DoubleSide, vertexColors: true });
        const m = new T.InstancedMesh(gg, mats.tuft, pts.length || 1); m.frustumCulled = false; m.castShadow = false; m.receiveShadow = true; m.count = 0; m.userData.stil = true;
        const tint = o.tint || [[1.0, 1.1, 0.75], [1.2, 1.15, 0.7], [0.88, 1.02, 0.7]];
        for (const p of pts) { const t = tint[Math.floor(R() * tint.length)], sz = (o.size || 0.8) * (0.7 + R() * 0.8); add(m, p[0], p[1] - 0.02, p[2], R() * 6.28, [sz, sz * (0.8 + R() * 0.7), sz], t); }
        m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; if (m.count) { grp().add(m); out.push(m); }
      } else if (kind === 'stones') {
        const sg = paint(new T.IcosahedronGeometry(0.5, 0), (x, y, z, nx, ny) => { const k = 0.7 + 0.3 * ny; return [k, k * 0.97, k * 0.92]; }), m = inst(sg, pts.length || 1, null);
        for (const p of pts) { const sz = (o.size || 0.12) * (0.5 + R() * 1.1); const cc = 0.55 + R() * 0.45; add(m, p[0], p[1] + sz * 0.1, p[2], R() * 6.28, [sz, sz * 0.6, sz * (0.8 + R() * 0.5)], [cc * 0.95, cc * 0.9, cc * 0.82]); }
        m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; if (m.count) { grp().add(m); out.push(m); }
      } else if (kind === 'flowers') {
        const fg = paint(new T.CircleGeometry(0.5, 7).rotateX(-Math.PI / 2), () => [1, 1, 1]), m = inst(fg, pts.length || 1, null, false); const pal = o.palette || [[1, 0.95, 0.4], [1, 1, 1], [0.95, 0.5, 0.8], [0.6, 0.7, 1]];
        for (const p of pts) { const sz = (o.size || 0.12) * (0.6 + R() * 0.9); add(m, p[0], p[1] + 0.05, p[2], R() * 6.28, sz, pal[Math.floor(R() * pal.length)]); }
        m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; if (m.count) { grp().add(m); out.push(m); }
      }
    }
    return out.reduce((a, m) => a + m.count, 0);
  }

  function place(list) {
    const c = ctx(), out = [];
    for (const o of list) {
      const f = MAKE[o.t]; if (!f) { console.warn('neznan rekvizit ' + o.t); continue; }
      for (const m of f(c, o)) {
        if (m.isLight) { grp().add(m); out.push(m); continue; }
        if (m.isInstancedMesh) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; if (m.count === 0) continue; }
        grp().add(m); out.push(m);
      }
    }
    return out.length;
  }
  function clear() { if (GRP) { Render.scene.remove(GRP); const i = ST.added.indexOf(GRP); if (i >= 0) ST.added.splice(i, 1); GRP = null; } }
  S.props = { place, clear, scatter, KIT, at, ctx };
})();
