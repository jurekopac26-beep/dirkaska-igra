// NEW VERSION · TEST 1: the construction site in the new map's south-west corner, as the user chose it in the pictures (15.–18. 10.): all the
// land between the ring road's sand and the map's end, from its west edge to past the hairpins (site-page, pal4-page, site-opts, site-bld,
// sitedark). Its earth darker, with dark ruts along the haul roads (the user's version 3), up to the map's wall; a dark green palisade
// (2.5 m) along the road the whole way, the road's sand up to it and the bank down behind it (version 1); the building going up on an earth
// platform as high as the road, a concrete wall to the map's end, a ramp down to the east for the trucks, the tower crane beside it; an
// excavation in three steps with a puddle, the haul loop round it and a way to the yard; a mound you drive over; the site's offices, toilets,
// a fuel tank, floodlights; heaps, pipes, pallets, rebar, a container; seven machines standing (driving them: later, sklop 10). You drive in at
// its open east end and over all of it (the platform, its ramp and the mound are H3.ground too: lift). Built by js/newmap.js hub4G (before the
// still meshes are merged, js/nvbake.js); the ring road keeps its sand out of it (roStop).
const NVSite = (function () {
  'use strict';
  // the palisade's line (the user's red line, every 4 m): from the map's west edge round the hairpin's outside and on along the ring road
  const FENCE = [[-353.4, 273.1], [-349.6, 276.4], [-345.8, 279.6], [-341.9, 282.8], [-337.6, 285.2], [-332.7, 286.2], [-328.7, 285.9], [-324.8, 285.3], [-320.0, 284.0], [-315.3, 282.1], [-311.0, 279.6], [-307.4, 276.2], [-304.5, 272.1], [-302.0, 267.8], [-299.8, 263.4], [-298.1, 259.7], [-296.3, 255.1], [-295.1, 251.2], [-293.5, 246.5], [-291.3, 243.2], [-287.6, 239.8], [-283.5, 237.0], [-279.3, 234.3], [-274.8, 232.2], [-270.0, 230.9], [-265.0, 230.6], [-261.0, 230.7], [-256.0, 231.1], [-251.1, 231.7], [-246.2, 232.8], [-241.5, 234.6], [-237.2, 236.9], [-233.7, 238.9], [-229.3, 241.3], [-225.0, 243.9], [-221.8, 246.3], [-218.4, 249.9], [-215.3, 253.8], [-212.1, 257.6], [-208.9, 261.5], [-205.8, 265.4], [-202.9, 269.5], [-201.0, 274.0], [-199.3, 278.7], [-197.2, 283.3], [-195.0, 286.6], [-191.8, 290.4], [-188.0, 293.7], [-184.0, 296.6], [-180.6, 298.7], [-176.3, 301.3], [-172.9, 303.4], [-168.4, 305.6], [-163.6, 307.0], [-158.7, 308.1], [-154.8, 308.7], [-150.8, 309.0], [-145.8, 309.4], [-141.8, 309.7], [-136.9, 310.2], [-132.9, 310.6], [-128.9, 310.9], [-124.1, 312.2], [-123.2, 312.7]];
  // the site: inside the palisade down to the map's end; past the palisade's east end a strip of it on between the road's sand and the map's end
  const POLY = FENCE.concat([[-116, 307.5], [-108, 305.5], [-100, 307], [-96, 316.5], [-354, 316.5]]);
  const PIT = [-254, 258], PLAT = { x0: -308, x1: -280, z0: 296, z1: 314, y: 5.4, run: 8.6 }, RAMP = { x1: -248, z0: 299, z1: 306 }, MOUND = [-225, 290, 7, 2.2, 1, 0.85];
  const inPoly = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const segD = (P, x, z, closed) => { let b = 1e9; const n = P.length; for (let i = closed ? 0 : 1; i < n; i++) { const [ax, az] = P[(i - 1 + n) % n], [bx, bz] = P[i], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))); b = Math.min(b, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return b; };
  // how far inside the site (negative: outside); only its edges along the road count (the map's end and west edge do not: the earth goes on to the wall)
  const EDGE = POLY.slice(0, POLY.length - 2);
  const inside = (x, z) => (inPoly(POLY, x, z) ? 1 : -1) * segD(EDGE, x, z, false);
  const sst = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // the ring road's sand stops at the palisade (js/newmap.js nordRoad o.roStop)
  const roStop = (x, z) => x > -356 && x < -94 && z > 226 && inside(x, z) > 0.4;
  // the platform, its ramp and the mound over the ground: the cars drive on them (js/newmap.js adds this to H3.ground)
  const platY = (x, z, g) => { const P = PLAT, dx = Math.max(P.x0 - x, 0, x - P.x1), dz = Math.max(P.z0 - z, 0, z - P.z1); let y = dz > 0 && z > P.z1 ? -1e9 : P.y - Math.hypot(dx, dz) * P.y / P.run;
    if (x >= P.x1 && x <= RAMP.x1 + 2 && z > RAMP.z0 - 1 && z < RAMP.z1 + 1) { const f = Math.min(1, (x - P.x1) / (RAMP.x1 - P.x1)), side = Math.min(1, Math.max(0, Math.min(z - (RAMP.z0 - 1), RAMP.z1 + 1 - z))); y = Math.max(y, (P.y + (g - P.y) * f) * side + (g - 1) * (1 - side)); } return y; };
  const moundH = (x, z) => { const [cx, cz, r, h, ax, az] = MOUND, rr = Math.hypot((x - cx) / (r * ax), (z - cz) / (r * az)); return rr < 1 ? h * (0.5 + 0.5 * Math.cos(Math.PI * rr)) : 0; };
  let G0 = null, anims = [], st = 0, fogIn = null;
  const lift = (x, z) => { if (x < -320 || x > -205 || z < 270 || z > 316) return 0; const g = G0(x, z); return Math.max(0, platY(x, z, g) - g) + moundH(x, z); };

  function build(MK) {
    const H3 = MK.H3, tx = Tex.all(), own = []; G0 = H3.ground;
    const gnd = (x, z) => H3.ground(x, z);
    const MC = new Map(), L = (c, o = {}) => { const k = c + JSON.stringify(o, (key, v) => v && v.isTexture ? 'tex' + v.id : v); let m = MC.get(k); if (!m) MC.set(k, m = new THREE.MeshLambertMaterial(Object.assign({ color: c }, o))); return m; };
    const add = (o, cast = true) => { o.traverse(q => { if (q.isMesh) { q.castShadow = cast; q.receiveShadow = true; } }); MK.add(o); own.push(o); return o; };
    const Grp = (x, y, z, ry = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; return add(g); };
    const B = (g, w, h, d, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
    const C = (g, r0, r1, h, m, x = 0, y = 0, z = 0, seg = 10) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
    const tex = (w, h, f) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; f(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
    const geo = (pos, idx, uv, col, n = 3) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); if (uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); if (col) g.setAttribute('color', new THREE.Float32BufferAttribute(col, n)); g.setIndex(idx); g.computeVertexNormals();
      let up = 0; const N = g.attributes.normal; for (let i = 0; i < N.count; i++) up += N.getY(i); if (up < 0) { for (let t = 0; t < idx.length; t += 3) { const q = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = q; } g.setIndex(idx); g.computeVertexNormals(); } return g; };
    const flat = (g, m, ro) => { const me = new THREE.Mesh(g, m); me.receiveShadow = true; if (ro) me.renderOrder = ro; MK.add(me); own.push(me); return me; };
    // (what moves: a group's own meshes merged into one, vertex colours, not merged with the still ones (js/nvbake.js: dyn); its sub-groups stay;
    // keyframes [[t, v...], ...] eased between them; anim(x, z, y over the ground, radius, objects, its look at t (only in view), its place at t (always))
    const VCM = new THREE.MeshLambertMaterial({ vertexColors: true }); anims = []; H3.movers = [];
    const dynM = (grp, cast) => { grp.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(grp.matrixWorld).invert(), P = [], N = [], Cc = [], ms = grp.children.filter(o => o.isMesh && !o.isInstancedMesh);
      for (const o of ms) { const m = Array.isArray(o.material) ? o.material[0] : o.material, ge = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); ge.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)); if (!ge.attributes.normal) ge.computeVertexNormals();
        const c = m.color || new THREE.Color(1, 1, 1), A = ge.attributes.position.array, Nn = ge.attributes.normal.array; for (let i = 0; i < A.length; i++) { P.push(A[i]); N.push(Nn[i]); } for (let i = 0; i < A.length / 3; i++) Cc.push(c.r, c.g, c.b); ge.dispose(); grp.remove(o); }
      if (!P.length) return null; const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); G.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); G.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); G.computeBoundingSphere();
      const me = new THREE.Mesh(G, VCM); me.castShadow = !!cast; me.receiveShadow = true; me.userData.dyn = true; grp.add(me); return me; };
    const kf = (K, t, per) => { t = ((t % per) + per) % per; for (let i = 0; i < K.length - 1; i++) if (t <= K[i + 1][0]) { let f = (t - K[i][0]) / ((K[i + 1][0] - K[i][0]) || 1); f = f * f * (3 - 2 * f); const a = K[i].slice(1), b = K[i + 1].slice(1), A = a.length === 1 && Array.isArray(a[0]) ? a[0] : a, Bv = b.length === 1 && Array.isArray(b[0]) ? b[0] : b; return A.map((v, j) => v + (Bv[j] - v) * f); } const e = K[K.length - 1].slice(1); return e.length === 1 && Array.isArray(e[0]) ? e[0] : e; };
    const anim = (x, z, y, r, objs, look, place) => { const a = { x, z, y: surf(x, z) + y, r, objs, look, place, near: true }; a.fp = { geometry: { boundingSphere: { center: new THREE.Vector3(a.x, a.y, z), radius: r } }, on: true, get visible() { return this.on; }, set visible(v) { this.on = v; const sh = v && a.near; for (const o of objs) o.visible = sh; } }; anims.push(a); if (look) look(0); if (place) place(0); return a; };
    // the meadow's own surface (its coarse triangles, not the smooth ground): the earth lies over it
    const terY = (() => { const W = Render.world && Render.world.ground; if (!W) return () => null; const g = W.geometry, P = g.attributes.position, I = g.index, n = I ? I.count : P.count, bins = new Map(), key = (i, j) => i * 100000 + j; W.updateMatrixWorld(true); const e = W.matrixWorld.elements;
      for (let t = 0; t < n; t += 3) { const v = []; for (let q = 0; q < 3; q++) { const i = I ? I.getX(t + q) : t + q, px = P.getX(i), py = P.getY(i), pz = P.getZ(i); v.push(px * e[0] + py * e[4] + pz * e[8] + e[12], px * e[1] + py * e[5] + pz * e[9] + e[13], px * e[2] + py * e[6] + pz * e[10] + e[14]); }
        const x0 = Math.min(v[0], v[3], v[6]), x1 = Math.max(v[0], v[3], v[6]), z0 = Math.min(v[2], v[5], v[8]), z1 = Math.max(v[2], v[5], v[8]); if (x1 < -360 || x0 > -90 || z1 < 222 || z0 > 320) continue;
        for (let i = Math.floor(x0 / 6); i <= Math.floor(x1 / 6); i++) for (let j = Math.floor(z0 / 6); j <= Math.floor(z1 / 6); j++) { const k = key(i, j); if (!bins.has(k)) bins.set(k, []); bins.get(k).push(v); } }
      return (x, z) => { const Lb = bins.get(key(Math.floor(x / 6), Math.floor(z / 6))); let best = null; if (Lb) for (const v of Lb) { const d = (v[5] - v[8]) * (v[0] - v[6]) + (v[6] - v[3]) * (v[2] - v[8]); if (Math.abs(d) < 1e-9) continue; const w1 = ((v[5] - v[8]) * (x - v[6]) + (v[6] - v[3]) * (z - v[8])) / d, w2 = ((v[8] - v[2]) * (x - v[6]) + (v[0] - v[6]) * (z - v[8])) / d, w3 = 1 - w1 - w2; if (w1 < -1e-4 || w2 < -1e-4 || w3 < -1e-4) continue; const y = w1 * v[1] + w2 * v[4] + w3 * v[7]; if (best === null || y > best) best = y; } return best; }; })();
    const surf = (x, z) => { const g = gnd(x, z), t = terY(x, z); return t === null ? g : Math.max(g, t); };
    // ---- the earth: version 3 of the user's (darker, the motocross's makadam texture), soft only where it meets the road's sand; 1 m points
    const mkT = (() => { const t = tx.makadam.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
    const EARTH = L(0xffffff, { map: mkT, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
    const X0 = -354, X1 = -95, Z0 = 228, Z1 = 316.5, nx = Math.round(X1 - X0), nz = Math.round(Z1 - Z0), BASE = [0.7, 0.6, 0.47];
    // (the haul roads: the loop round the excavation, a way from it to the yard; their ruts darker)
    const ell = (cx, cz, rx, rz, n = 96) => { const P = []; for (let k = 0; k <= n; k++) { const a = k / n * Math.PI * 2; P.push([cx + Math.cos(a) * rx, cz + Math.sin(a) * rz]); } return P; };
    const HAUL = [ell(PIT[0], PIT[1], 24, 17), [[PIT[0] + 18, PIT[1] + 12], [PIT[0] + 30, PIT[1] + 30], [-200, 303], [-176, 307], [-150, 311.5], [-128, 314], [-104, 312]], [[RAMP.x1 + 2, (RAMP.z0 + RAMP.z1) / 2], [-238, 300], [PIT[0] + 6, PIT[1] + 17]]];
    const haulD = (x, z) => Math.min(...HAUL.map(P => segD(P, x, z, false)));
    { const pos = [], uv = [], col = [], idx = [], vid = new Int32Array((nx + 1) * (nz + 1)).fill(-1);
      for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const x = X0 + i, z = Z0 + j, d = inside(x, z); if (d < -1.5) continue; const n1 = 0.5 + 0.5 * Math.sin(x * 0.11 + Math.sin(z * 0.06) * 2.2) * Math.sin(z * 0.09 + 1.1), s = 0.92 + 0.16 * n1, hd = haulD(x, z), rut = Math.exp(-((hd - 1.6) ** 2) / 0.35) + Math.exp(-((hd + 0) ** 2) / 4) * 0.3, k = s * (1 - 0.3 * Math.min(1, rut)) * (1 - 0.12 * sst(3.5, 0, hd)), a = sst(-0.6, 1.4, d);
        vid[j * (nx + 1) + i] = pos.length / 3; pos.push(x, surf(x, z) + 0.05 + moundH(x, z), z); uv.push(x / 7, z / 7); col.push(BASE[0] * k, BASE[1] * k, BASE[2] * k, a); }
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = vid[j * (nx + 1) + i], b = vid[j * (nx + 1) + i + 1], c = vid[(j + 1) * (nx + 1) + i], d = vid[(j + 1) * (nx + 1) + i + 1]; if (a < 0 || b < 0 || c < 0 || d < 0) continue; if (col[a * 4 + 3] + col[b * 4 + 3] + col[c * 4 + 3] + col[d * 4 + 3] <= 0) continue; idx.push(a, c, b, b, c, d); }
      flat(geo(pos, idx, uv, col, 4), EARTH, 1.5); }
    // ---- the excavation: three steps down painted on the earth (the floor dark, the steps' faces darker), a puddle, a ramp down its east side, cones round it
    { const y0 = surf(PIT[0], PIT[1]) + 0.07, steps = [[13, 9.5, 0xb89070, 0xa07a5a], [10.5, 7.5, 0x8e6a4c, 0x6e4e36], [8, 5.5, 0x5e4230, 0x4a3426]];
      const plane = (w, d, m, x, z, y) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); p.receiveShadow = true; MK.add(p); own.push(p); return p; };
      steps.forEach(([w, d, c, cf], k) => { plane(w * 2, d * 2, L(c, { polygonOffset: true, polygonOffsetFactor: -4 - k, polygonOffsetUnits: -4 - k }), PIT[0], PIT[1], y0 + k * 0.004);
        if (k < 2) { const w2 = steps[k + 1][0], d2 = steps[k + 1][1], fm = L(cf, { polygonOffset: true, polygonOffsetFactor: -5 - k, polygonOffsetUnits: -5 - k }); for (const [bw, bd, ox, oz] of [[w2 * 2 + 1.0, 1.0, 0, d2 + 0.5], [w2 * 2 + 1.0, 1.0, 0, -d2 - 0.5], [1.0, d2 * 2 + 1.0, w2 + 0.5, 0], [1.0, d2 * 2 + 1.0, -w2 - 0.5, 0]]) plane(bw, bd, fm, PIT[0] + ox, PIT[1] + oz, y0 + 0.002 + k * 0.004); } });
      plane(9, 4.5, L(0xa07c5c, { map: mkT, polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -8 }), PIT[0] + 9.5, PIT[1] - 1, y0 + 0.012);
      const pd = new THREE.Mesh(new THREE.CircleGeometry(2.2, 20), L(0x5a6a78, { transparent: true, opacity: 0.85, polygonOffset: true, polygonOffsetFactor: -9, polygonOffsetUnits: -9 })); pd.rotation.x = -Math.PI / 2; pd.scale.set(1.6, 1, 1); pd.position.set(PIT[0] - 3, y0 + 0.02, PIT[1] + 2); MK.add(pd); own.push(pd);
      const CN = []; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.3) continue; CN.push([PIT[0] + Math.cos(a) * 14.5, PIT[1] + Math.sin(a) * 10.6]); }
      const cg = new THREE.ConeGeometry(0.28, 0.75, 10); cg.translate(0, 0.38, 0); const im = new THREE.InstancedMesh(cg, L(0xff8a1f), CN.length), m4 = new THREE.Matrix4(); CN.forEach(([x, z], k) => { m4.makeTranslation(x, surf(x, z) + 0.05, z); im.setMatrixAt(k, m4); }); add(im); }
    // ---- the platform the building stands on, as high as the road (the user: "na zemlji visoki toliko kot je cesta"): its sloped sides to the north,
    // west and east, a concrete wall to the map's end, the ramp down to the east for the trucks (orange kerbs both sides)
    { const P = PLAT, pos = [], uv = [], col = [], idx = [], V = (x, y, z, sh) => { pos.push(x, y, z); uv.push((x + z) / 7, y / 7 + z / 7); col.push(BASE[0] * sh, BASE[1] * sh, BASE[2] * sh); return pos.length / 3 - 1; }, quad = (a, b, c, d) => idx.push(a, b, c, a, c, d);
      const R = P.run, top = [V(P.x0, P.y, P.z0, 1.05), V(P.x1, P.y, P.z0, 1.05), V(P.x1, P.y, P.z1, 1.05), V(P.x0, P.y, P.z1, 1.05)]; quad(top[0], top[3], top[2], top[1]);
      const foot = (x, z, sh) => V(x, surf(x, z) + 0.04, z, sh);
      { const n0 = foot(P.x0 - R, P.z0 - R, 0.92), n1 = foot(P.x1 + R, P.z0 - R, 0.92), t0 = V(P.x0, P.y, P.z0, 0.98), t1 = V(P.x1, P.y, P.z0, 0.98); quad(n0, t0, t1, n1); }
      { const w0 = foot(P.x0 - R, P.z1, 0.86), w1 = foot(P.x0 - R, P.z0 - R, 0.86), t0 = V(P.x0, P.y, P.z1, 0.9), t1 = V(P.x0, P.y, P.z0, 0.9); quad(w0, t0, t1, w1); }
      { const e0 = foot(P.x1 + R, P.z0 - R, 1.0), e1 = foot(P.x1 + R, P.z1, 1.0), t0 = V(P.x1, P.y, P.z0, 1.02), t1 = V(P.x1, P.y, P.z1, 1.02); quad(e0, t0, t1, e1); }
      flat(geo(pos, idx, uv, col), L(0xffffff, { map: mkT, vertexColors: true, side: THREE.DoubleSide })).castShadow = true;
      const con = L(0x9a968e), wall = new THREE.Group(); B(wall, P.x1 - P.x0 + 2 * R, P.y + 0.6, 0.5, con, (P.x0 + P.x1) / 2, P.y / 2 - 0.1, P.z1 + 0.25); add(wall);
      const rp = [], ru = [], ri = [], yB = surf(RAMP.x1, (RAMP.z0 + RAMP.z1) / 2) + 0.06; for (const [x, y] of [[P.x1, P.y + 0.03], [RAMP.x1, yB]]) for (const z of [RAMP.z0, RAMP.z1]) { rp.push(x, y, z); ru.push(x / 6, z / 6); } ri.push(0, 1, 3, 0, 3, 2);
      flat(geo(rp, ri, ru), L(0xe6d2b2, { map: mkT, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      const kl = Math.hypot(RAMP.x1 - P.x1, P.y - yB), ka = Math.atan2(P.y - yB, RAMP.x1 - P.x1); for (const z of [RAMP.z0 - 0.3, RAMP.z1 + 0.3]) { const g = Grp((P.x1 + RAMP.x1) / 2, (P.y + yB) / 2 + 0.3, z); g.rotation.z = -ka; B(g, kl, 0.35, 0.3, L(0xff8a1f)); } }
    // ---- the building going up on the platform (a concrete frame, two floors cast, the third's columns with rebar, scaffolding), the tower crane beside it
    const lat = (rx, ry) => { const t = tex(64, 64, (c) => { c.clearRect(0, 0, 64, 64); c.strokeStyle = '#f2c12e'; c.lineWidth = 8; c.strokeRect(4, 4, 56, 56); c.lineWidth = 6; c.beginPath(); c.moveTo(4, 60); c.lineTo(60, 4); c.stroke(); }); t.repeat.set(rx, ry); return new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide }); };
    const CON = L(0x9a9690), RUST = L(0x6a3a2a), Y = L(0xf2c12e), DK = L(0x2a2a2a);
    { const g = Grp(-297, PLAT.y, 305); for (let f = 0; f < 3; f++) { const y = f * 3.4; for (const xx of [-7, -2.33, 2.33, 7]) for (const zz of [-5, 0, 5]) C(g, 0.24, 0.24, 3.2, CON, xx, y + 1.6, zz, 8); if (f < 2) B(g, 15, 0.28, 11, CON, 0, y + 3.3, 0); }
      for (const xx of [-7, -2.33, 2.33, 7]) for (const zz of [-5, 0, 5]) C(g, 0.03, 0.03, 1.2, RUST, xx, 10.4, zz, 4);
      for (const s of [-1, 1]) B(g, 15.2, 9.6, 0.4, lat(12, 8), 0, 4.8, s * 6.0); B(g, 0.4, 9.6, 11.4, lat(9, 8), -7.9, 4.8, 0); }
    // (the crane turns between the yard by the mixer and the building's top floor, its trolley out and in, the hook with a concrete bucket down and up:
    // its turning part, the trolley, the cable and the hook each one mesh; js/nvsite.js tick)
    { const Hh = 26, g = Grp(-285, PLAT.y, 305); B(g, 3.2, 1.0, 3.2, CON, 0, 0.5, 0); B(g, 1.6, Hh, 1.6, lat(1, Hh / 1.6), 0, 1 + Hh / 2, 0); const sl = new THREE.Group(); sl.position.set(0, 1 + Hh, 0); sl.rotation.y = 2.4; g.add(sl);
      B(sl, 2.4, 0.7, 2.4, Y, 0, 0.35, 0); B(sl, 1.7, 1.6, 1.4, Y, 1.4, 1.5, 1.6); B(sl, 1.72, 0.8, 1.42, L(0x1d2630), 1.45, 1.8, 1.6); B(sl, 0.5, 6.4, 0.5, Y, 0, 3.9, 0);
      B(sl, 30, 1.3, 1.3, lat(24, 1), 15.8, 1.35, 0); B(sl, 11, 1.1, 1.8, lat(9, 1), -5.9, 1.25, 0); for (const k of [0, 1, 2]) B(sl, 0.75, 2.4, 2.0, CON, -8.8 - k * 0.8, 0.1, 0);
      const tro = new THREE.Group(); tro.position.x = 14; sl.add(tro); B(tro, 1.3, 0.4, 1.5, L(0x3a3a3a), 0, 0.55, 0); const cab = new THREE.Group(); tro.add(cab); C(cab, 0.04, 0.04, 1, DK, 0, -0.5, 0, 4);
      const hk = new THREE.Group(); hk.position.y = -11.5; tro.add(hk); B(hk, 0.8, 0.7, 0.55, L(0xd8282a), 0, 0, 0); C(hk, 0.8, 0.45, 1.3, L(0x8a8e94), 0, -1.6, 0, 14); C(hk, 0.84, 0.84, 0.14, DK, 0, -0.95, 0, 14);
      const y0 = PLAT.y + 1 + Hh, tgt = (x, z, y) => ({ th: Math.atan2(-(z - 305), x + 285), r: Math.hypot(x + 285, z - 305), y: y - y0 + 2.6 });
      const P1 = tgt(-258, 289, surf(-258, 289) + 0.2), P2 = tgt(-296, 302.5, PLAT.y + 6.8 + 0.3), hi = -9;
      dynM(sl, true); dynM(tro, false); dynM(cab, false); dynM(hk, true);
      const T = [[0, P1.th, P1.r, P1.y], [2.5, P1.th, P1.r, P1.y], [5, P1.th, P1.r, hi], [11, P2.th, P2.r, hi], [14, P2.th, P2.r, P2.y], [16.5, P2.th, P2.r, P2.y], [18.5, P2.th, P2.r, hi], [23, P1.th, P1.r, hi], [24, P1.th, P1.r, P1.y]];
      anim(-285, 305, y0 - 10, 34, [sl], (t) => { const [th, r, y] = kf(T, t, 24); sl.rotation.y = th; tro.position.x = r; hk.position.y = y; cab.scale.y = Math.max(0.05, -y - 0.35); cab.position.y = 0; }); }
    // ---- the mound you drive over (in the earth's own mesh), the site's offices (containers two high), toilets, a fuel tank; floodlights
    const box = (x, z, w, h, d, m, y = 0, ry = 0) => { const g = Grp(x, surf(x, z) + y, z, ry); B(g, w, h, d, m, 0, h / 2, 0); return g; };
    { const ox = -214, oz = 304; for (const [dx, dy] of [[-3.15, 0], [3.15, 0], [-3.15, 2.6], [3.15, 2.6]]) { const c = box(ox + dx, oz, 6.1, 2.55, 2.45, L(dy ? 0x2a5ab8 : 0xf4f4f0), dy); B(c, 6.12, 0.5, 0.06, L(0x1d2630), 0, 1.5, -1.24); }
      for (let k = 0; k < 2; k++) { const t = box(ox - 10.75 + k * 1.5, oz, 1.2, 2.3, 1.2, L(0x2a8a4a)); B(t, 1.25, 0.12, 1.25, L(0xf4f4f0), 0, 2.36, 0); }
      { const t = Grp(ox + 11, surf(ox + 11, oz), oz); const c = C(t, 1.0, 1.0, 4.4, L(0xf4f4f0), 0, 1.5, 0, 16); c.rotation.z = Math.PI / 2; const b2 = C(t, 1.02, 1.02, 0.5, L(0xd8282a), 0, 1.5, 0, 16); b2.rotation.z = Math.PI / 2; for (const xx of [-1.4, 1.4]) B(t, 0.25, 0.6, 1.3, DK, xx, 0.3, 0); }
      const lightM = new THREE.MeshBasicMaterial({ color: 0xfff6d0 }); for (const [x, z] of [[-322, 296], [-262, 240], [-215, 262], [-180, 304], [-140, 312]]) { const lp = Grp(x, surf(x, z), z); C(lp, 0.1, 0.13, 9, L(0x9aa0a8), 0, 4.5, 0, 6); B(lp, 1.6, 0.5, 0.7, DK, 0, 9.1, 0); for (const sx of [-0.45, 0.45]) B(lp, 0.6, 0.4, 0.06, lightM, sx, 9.0, -0.38); } }
    // ---- the yard: sand, gravel and soil heaps, concrete pipes, pallets of bricks, rebar, a container
    { const pile = (x, z, r, h, c) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 18), L(c, { map: mkT })); m.position.set(x, surf(x, z) + h / 2 - 0.05, z); m.scale.set(1.25, 1, 1); add(m); };
      pile(-178, 307, 3.4, 2.3, 0xc8a070); pile(-166, 311.5, 3.0, 2.0, 0x8e8a84); pile(-240, 282, 2.8, 1.9, 0x6e4a2c);
      for (let k = 0; k < 5; k++) { const p = Grp(-152.2 + (k % 3) * 2.2 + (k >= 3 ? 1.1 : 0), surf(-150, 313) + 0.75 + (k >= 3 ? 1.35 : 0), 313); const c = C(p, 0.75, 0.75, 3.0, CON, 0, 0, 0, 14); c.rotation.x = Math.PI / 2; const ci = C(p, 0.55, 0.55, 3.02, L(0x3a3a3a), 0, 0, 0, 14); ci.rotation.x = Math.PI / 2; }
      for (let k = 0; k < 4; k++) { const r = Grp(-138.4 + k * 1.6, surf(-136, 313.6), 313.6); B(r, 1.2, 0.15, 1.2, L(0x8a6a44), 0, 0.08, 0); B(r, 1.1, 0.9, 1.1, L(0xa8483a), 0, 0.6, 0); }
      { const g = Grp(-103, surf(-103, 312.5), 312.5); for (let k = 0; k < 12; k++) { const c = C(g, 0.03, 0.03, 6, RUST, -0.3 + (k % 6) * 0.12, 0.15 + Math.floor(k / 6) * 0.1, 0, 4); c.rotation.z = Math.PI / 2; } }
      box(-112, 311, 6.1, 2.6, 2.45, L(0xd8282a)); }
    // ---- the machines, standing (the excavator at the pit's edge, a dump truck by it, the wheel loader by the heaps, the bulldozer, the roller on the
    // haul loop, the mixer by the building's ramp, the forklift by the pallets)
    const ORG = L(0xff8a1f), YEL = L(0xf2b418), TY = L(0x161616), GL = L(0x1d2630), WH = L(0xf4f4f0);
    const wheel = (g, r, w, x, y, z) => { const o = C(g, r, r, w, TY, x, y, z, 12); o.rotation.x = Math.PI / 2; };
    const mach = (x, z, hd) => Grp(x, surf(x, z) + 0.04, z, -hd);
    // (the machines move, sklop 10: what moves of each its own mesh; those that drive about are the car's walls, H3.movers, js/nvride.js)
    const mover = (g, hl, hw) => { const m = { x: g.position.x, z: g.position.z, y: g.position.y, h: -g.rotation.y, hl, hw }; (H3.movers || (H3.movers = [])).push(m); return m; };
    const drive = (g, m, x, z, hd) => { const y = surf(x, z) + 0.04; g.position.set(x, y, z); g.rotation.y = -hd; m.x = x; m.z = z; m.y = y; m.h = hd; };
    const MAKE = {
      loader: (g) => { B(g, 3.2, 1.2, 2.2, YEL, -0.3, 1.2, 0); B(g, 1.4, 1.5, 1.6, YEL, -0.6, 2.5, 0); B(g, 1.42, 0.8, 1.62, GL, -0.6, 2.75, 0); for (const xx of [-1.3, 1.2]) for (const z of [-1.05, 1.05]) wheel(g, 0.75, 0.55, xx, 0.75, z);
        const la = new THREE.Group(); la.position.set(0.9, 1.4, 0); g.add(la); for (const z of [-0.7, 0.7]) B(la, 2.0, 0.25, 0.25, YEL, 1.0, 0, z); const bk = new THREE.Group(); bk.position.set(2.1, 0, 0); la.add(bk); B(bk, 0.9, 1.0, 2.6, DK, 0.0, -0.65, 0); g.userData.parts = { la, bk }; },
      dozer: (g) => { for (const z of [-1.05, 1.05]) B(g, 3.6, 0.8, 0.6, DK, 0, 0.4, z); B(g, 3.0, 1.0, 1.6, YEL, -0.2, 1.3, 0); B(g, 1.3, 1.4, 1.4, YEL, -0.8, 2.5, 0); B(g, 1.32, 0.7, 1.42, GL, -0.8, 2.7, 0); B(g, 0.35, 1.2, 3.0, YEL, 2.3, 0.75, 0); },
      roller: (g) => { const d = C(g, 0.75, 0.75, 2.0, YEL, 1.5, 0.75, 0, 16); d.rotation.x = Math.PI / 2; B(g, 2.6, 1.0, 1.8, YEL, -0.6, 1.1, 0); B(g, 1.2, 1.3, 1.4, YEL, -0.9, 2.2, 0); for (const z of [-0.85, 0.85]) wheel(g, 0.7, 0.5, -1.4, 0.7, z); },
      mixer: (g) => { B(g, 7.0, 0.35, 2.0, DK, 0, 0.95, 0); B(g, 1.7, 1.9, 2.3, WH, 2.7, 2.0, 0); B(g, 0.06, 0.8, 2.0, GL, 3.56, 2.5, 0); for (const xx of [2.75, -1.0, -2.3]) for (const z of [-1.05, 1.05]) wheel(g, 0.55, 0.45, xx, 0.55, z); const dg = C(g, 1.1, 1.1, 3.6, L(0xe8452c), -0.9, 2.55, 0, 16); dg.rotation.z = Math.PI / 2 + 0.14; },
      forklift: (g) => { B(g, 2.2, 1.0, 1.3, ORG, 0, 0.75, 0); B(g, 0.9, 0.7, 1.3, L(0x3a3a3a), -1.0, 0.75, 0); for (const [xx, z] of [[0.7, 0.6], [0.7, -0.6], [-0.8, 0.6], [-0.8, -0.6]]) wheel(g, 0.32, 0.25, xx, 0.32, z); B(g, 1.1, 0.08, 1.2, DK, 0.1, 2.85, 0); for (const z of [-0.4, 0.4]) B(g, 0.12, 2.6, 0.12, L(0x3a3a3a), 1.25, 1.4, z); for (const z of [-0.3, 0.3]) B(g, 1.1, 0.06, 0.14, L(0x9aa0a8), 1.85, 0.12, z); } };
    const M5 = {}; for (const [k, x, z, hd] of [['loader', -190, 305, 0], ['dozer', -276, 262, 0.3], ['roller', PIT[0] - 6, PIT[1] + 17, 0], ['mixer', -262, 290, 0.2], ['forklift', -119, 312, 0]]) { const g = mach(x, z, hd); MAKE[k](g); M5[k] = { g, x, z, hd }; }
    machines(M5);
    // ---- the palisade along the road (one ribbon of the dark green bars with three points, 2.5 m; posts every 3.5 m), its foot on the ground there
    // (as high as the road's edge: the bank goes down behind it); solid
    { const palT = tex(512, 366, (c, w, h) => { c.clearRect(0, 0, w, h); for (let i = 3; i < w - 6; i += 17) { const gr = c.createLinearGradient(i, 0, i + 13, 0); gr.addColorStop(0, '#163222'); gr.addColorStop(0.2, '#3f6e50'); gr.addColorStop(0.5, '#24472f'); gr.addColorStop(0.8, '#3f6e50'); gr.addColorStop(1, '#10241a'); c.fillStyle = gr; c.fillRect(i, 16, 13, h - 16);
          c.fillStyle = '#24472f'; c.beginPath(); c.moveTo(i, 18); c.lineTo(i + 1.5, 2); c.lineTo(i + 4.3, 12); c.lineTo(i + 6.5, 0); c.lineTo(i + 8.7, 12); c.lineTo(i + 11.5, 2); c.lineTo(i + 13, 18); c.closePath(); c.fill(); }
        for (const y of [46, h - 58]) { c.fillStyle = '#1f3d29'; c.fillRect(0, y, w, 11); c.fillStyle = '#4d7a5c'; c.fillRect(0, y, w, 3); } }); palT.wrapT = THREE.ClampToEdgeWrapping;
      const PAL = new THREE.MeshLambertMaterial({ map: palT, alphaTest: 0.45, side: THREE.DoubleSide }), HG = 2.5, pos = [], uv = [], idx = [], at = []; let s = 0;
      const pts = FENCE.map(([x, z]) => [x, z, surf(x, z)]); for (let it = 0; it < 2; it++) for (let k = 1; k < pts.length - 1; k++) pts[k][2] = (pts[k - 1][2] + 2 * pts[k][2] + pts[k + 1][2]) / 4;
      pts.forEach(([x, z, y], k) => { if (k) s += Math.hypot(x - pts[k - 1][0], z - pts[k - 1][1]); pos.push(x, y - 0.1, z, x, y + HG, z); uv.push(s / 3.5, 0, s / 3.5, 1); if (k) { const q = (k - 1) * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); } });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); const me = new THREE.Mesh(g, PAL); me.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: palT, alphaTest: 0.45 }); add(me);
      for (let k = 1; k < pts.length; k++) { const [ax, az, ay] = pts[k - 1], [bx, bz, by] = pts[k], L2 = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L2 / 3.5)); for (let i = 0; i < n; i++) { const f = i / n; at.push([ax + (bx - ax) * f, ay + (by - ay) * f, az + (bz - az) * f]); } (H3.solids || (H3.solids = [])).push({ ax, az, bx, bz, r: 0.12 }); }
      const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, HG + 0.2, 0.14), L(0x24472f), at.length), m4 = new THREE.Matrix4(); at.forEach(([x, y, z], i) => { m4.makeTranslation(x, y + HG / 2, z); im.setMatrixAt(i, m4); }); add(im); }
    // ---- how the machines move (sklop 10, the user in the pictures: "na gradbišču naj bo čim več elementov, ki se premikajo: žerjav, bager,
    // kamion, dvigalo"; anim-page): the loader into the sand heap and back, the dozer pushing, the roller rolling the haul loop, the mixer's drum,
    // the forklift's forks, the excavator digging and loading the dump truck, which goes round the haul loop to tip at the soil heap; a hoist
    // on the building
    function machines(M5) {
      // the loader (it drives: a wall), its arms and bucket
      { const o = M5.loader, P = o.g.userData.parts, m = mover(o.g, 2.9, 1.3); dynM(o.g, true); dynM(P.la, true); dynM(P.bk, true);
        const K = [[0, -3, -0.35, 0], [2.2, 3.2, -0.35, 0], [3.0, 3.2, -0.1, 0.8], [4.2, 0, 0.55, 0.8], [5.2, 0, 0.55, -0.9], [6.2, -3, -0.35, 0], [8, -3, -0.35, 0]];
        anim(o.x, o.z, 2, 5, [o.g], (t) => { const [d, a, b] = kf(K, t, 8); P.la.rotation.z = a; P.bk.rotation.z = b; }, (t) => { const [d] = kf(K, t, 8); drive(o.g, m, o.x + d, o.z, o.hd); }); }
      // the dozer pushes forward and back, the roller rolls along the loop's north side
      { const o = M5.dozer, m = mover(o.g, 2.4, 1.6); dynM(o.g, true); const K = [[0, 0], [4, 5], [5, 5], [8, 0], [9, 0]];
        anim(o.x, o.z, 2, 4, [o.g], null, (t) => { const d = kf(K, t, 9)[0]; drive(o.g, m, o.x + Math.cos(o.hd) * d, o.z + Math.sin(o.hd) * d, o.hd); }); }
      { const o = M5.roller, m = mover(o.g, 2.4, 1.1); dynM(o.g, true); const K = [[0, -6], [5, 6], [5.6, 6], [10.6, -6], [11.2, -6]];
        anim(o.x, o.z, 2, 4, [o.g], null, (t) => { const d = kf(K, t, 11.2)[0]; drive(o.g, m, o.x + d, o.z, o.hd); }); }
      // the mixer's drum turning (stripes on it to show it), the forklift's forks up and down
      { const o = M5.mixer; let drum = null; o.g.traverse(q => { if (q.isMesh && q.geometry.parameters && q.geometry.parameters.height === 3.6) drum = q; });
        if (drum) { o.g.remove(drum); const ge = drum.geometry.toNonIndexed(), A = ge.attributes.position, col = []; for (let i = 0; i < A.count; i += 3) { let a = 0; for (let q = 0; q < 3; q++) a += Math.atan2(A.getZ(i + q), A.getX(i + q)) / 3; const c = Math.floor((a + Math.PI) / (Math.PI / 4)) % 2 ? [0.91, 0.27, 0.17] : [0.96, 0.96, 0.94]; for (let q = 0; q < 3; q++) col.push(...c); }
          ge.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); const dm = new THREE.Mesh(ge, VCM); dm.castShadow = true; dm.userData.dyn = true; const piv = new THREE.Group(); piv.position.copy(drum.position); piv.rotation.copy(drum.rotation); piv.add(dm); o.g.add(piv);
          anim(o.x, o.z, 2.5, 5, [piv], (t) => { dm.rotation.y = t * 1.6; }); } }
      { const o = M5.forklift, fk = new THREE.Group(); for (const q of o.g.children.filter(q => q.isMesh && q.position.x > 1.6)) fk.add(q); o.g.add(fk); dynM(fk, false);
        anim(o.x, o.z, 1.5, 3, [fk], (t) => { fk.position.y = 1.2 * (0.5 - 0.5 * Math.cos(t * 0.9)); }); }
      // the excavator at the pit's edge (tracks, the upper part turning, the boom, the arm, the bucket) digs and loads the dump truck
      const EX = { x: PIT[0] + 10, z: PIT[1] - 8, S: 1.35 }, TK = { a0: -0.84, a1: 1.07 };
      { const g = Grp(EX.x, surf(EX.x, EX.z) + 0.04, EX.z); g.scale.setScalar(EX.S); EX.g = g; const D2 = L(0x3a3a3a), SO = L(0x6e4a2c);
        for (const z of [-1.15, 1.15]) { B(g, 4.4, 0.85, 0.8, DK, 0, 0.42, z); for (let k = 0; k < 9; k++) B(g, 0.12, 0.88, 0.84, D2, -2.0 + k * 0.5, 0.42, z); } B(g, 2.0, 0.3, 2.0, DK, 0, 0.95, 0);
        const up = new THREE.Group(); up.position.y = 1.1; g.add(up); B(up, 3.0, 1.1, 2.5, YEL, -0.2, 0.55, 0); B(up, 0.9, 1.1, 2.5, D2, -1.95, 0.6, 0); B(up, 1.1, 1.5, 1.1, YEL, 0.75, 1.85, 0.62); B(up, 1.12, 0.85, 1.12, GL, 0.78, 2.05, 0.62);
        const bm = new THREE.Group(); bm.position.set(1.15, 1.05, -0.3); up.add(bm); B(bm, 3.6, 0.55, 0.5, YEL, 1.8, 0, 0); const arm = new THREE.Group(); arm.position.x = 3.6; bm.add(arm); B(arm, 3.26, 0.42, 0.42, YEL, 1.63, 0, 0);
        const bk = new THREE.Group(); bk.position.x = 3.26; arm.add(bk); B(bk, 0.9, 0.75, 0.8, D2, 0.35, -0.3, 0); const so = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), SO); so.scale.set(1.1, 0.6, 0.95); so.position.set(0.35, 0.08, 0); bk.add(so);
        bk.remove(so); dynM(bk, true); bk.add(so); so.userData.dyn = true; so.castShadow = true; arm.remove(bk); dynM(arm, true); arm.add(bk); bm.remove(arm); dynM(bm, true); bm.add(arm); up.remove(bm); dynM(up, true); up.add(bm);
        const ik = (u, v) => { const L1 = 3.6, L2 = 3.26, dx = u - 1.15, dy = v - 2.15, d = Math.min(L1 + L2 - 0.02, Math.hypot(dx, dy)), ca = (d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2), al = -Math.acos(Math.max(-1, Math.min(1, ca))), be = Math.atan2(dy, dx) - Math.atan2(L2 * Math.sin(al), L1 + L2 * Math.cos(al)); return [be, al]; };
        // (where the truck stands to be loaded, in the excavator's own frame; the pit; the turn to each: to the pit +z, to the truck towards it)
        const ld = [PIT[0] + 24 * Math.cos(TK.a0), PIT[1] + 17 * Math.sin(TK.a0)], toT = Math.atan2(-(ld[1] - EX.z), ld[0] - EX.x), toP = Math.atan2(-(PIT[1] - EX.z), PIT[0] - EX.x), uT = Math.hypot(ld[0] - EX.x, ld[1] - EX.z) / EX.S;
        const K = [[0, [4.4, 3.4, toP, 1.9]], [1.4, [5.6, 0.7, toP, -0.6]], [2.6, [4.3, 0.6, toP, 0.6]], [3.6, [4.9, 2.2, toP, 1.4]], [5.4, [uT, 3.6, toT, 1.9]], [6.4, [uT, 3.6, toT, -1.3]], [8, [4.4, 3.4, toP, 1.9]]];
        anim(EX.x, EX.z, 3, 9, [up], (t) => { const [u, v, ps, w] = kf(K, t, 8), [be, al] = ik(u, v); up.rotation.y = ps; bm.rotation.z = be; arm.rotation.z = al; bk.rotation.z = w - be - al; const tt = ((t % 8) + 8) % 8; so.visible = tt >= 2.4 && tt < 6.2; }); }
      // the dump truck round the haul loop: loaded by the excavator, to the soil heap in the north, tips its bed, round again (a wall for the car)
      { const g = Grp(0, 0, 0), ORG2 = L(0xff8a1f), BED = L(0xe8b018), SO = L(0x7a5232); B(g, 7.0, 0.35, 1.9, DK, 0, 0.95, 0); B(g, 1.9, 2.0, 2.4, ORG2, 2.55, 2.1, 0); B(g, 0.06, 0.85, 2.2, GL, 3.51, 2.55, 0); for (const z of [-1.21, 1.21]) B(g, 1.0, 0.7, 0.06, GL, 2.7, 2.5, z);
        for (const x of [2.55, -0.5, -1.85]) for (const z of [-1.05, 1.05]) wheel(g, 0.55, 0.45, x, 0.55, z);
        const bp = new THREE.Group(); bp.position.set(-3.2, 1.15, 0); g.add(bp); B(bp, 4.6, 0.15, 2.3, BED, 2.3, 0.08, 0); for (const z of [-1.1, 1.1]) B(bp, 4.6, 1.1, 0.12, BED, 2.3, 0.7, z); B(bp, 0.15, 1.5, 2.3, BED, 4.65, 0.85, 0); B(bp, 0.15, 1.0, 2.3, BED, 0.05, 0.6, 0);
        const ldM = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 8), SO); ldM.scale.set(2.0, 0.55, 0.95); ldM.position.set(2.3, 0.95, 0);
        dynM(g, true); dynM(bp, true); bp.add(ldM); ldM.userData.dyn = true; ldM.castShadow = true;
        const N = 360, TA = [], at = (a) => [PIT[0] + 24 * Math.cos(a), PIT[1] + 17 * Math.sin(a)]; let acc = 0; for (let i = 0; i <= N; i++) { const a = TK.a0 + i / N * Math.PI * 2; if (i) { const p = at(a), q = at(a - Math.PI * 2 / N); acc += Math.hypot(p[0] - q[0], p[1] - q[1]); } TA.push([a, acc]); }
        const per = acc, aOf = (s) => { s = ((s % per) + per) % per; let lo = 0, hi = N; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (TA[mid][1] <= s) lo = mid; else hi = mid; } const f = (s - TA[lo][1]) / ((TA[hi][1] - TA[lo][1]) || 1); return TA[lo][0] + (TA[hi][0] - TA[lo][0]) * f; };
        let sT = 0; for (const [a, s2] of TA) if (a <= TK.a0 + ((TK.a1 - TK.a0 + Math.PI * 2) % (Math.PI * 2))) sT = s2;
        const v = 5.5, t1 = 10, t2 = t1 + sT / v, t3 = t2 + 5, t4 = t3 + (per - sT) / v, m = mover(g, 3.6, 1.3);
        const sAt = (t) => { t = ((t % t4) + t4) % t4; if (t < t1) return 0; if (t < t2) return (t - t1) * v; if (t < t3) return sT; return sT + (t - t3) * v; };
        anim(PIT[0], PIT[1], 2, 28, [g], (t) => { const tt = ((t % t4) + t4) % t4, tip = tt >= t2 && tt < t3 ? Math.sin(Math.PI * (tt - t2) / 5) : 0; bp.rotation.z = 0.9 * tip; ldM.visible = tt >= 3 && tt < t2 + 2.2; ldM.scale.set(2.0, 0.55 * Math.min(1, Math.max(0.1, (tt - 3) / 5)), 0.95); },
          (t) => { const a = aOf(sAt(t)), [x, z] = at(a), hd = Math.atan2(17 * Math.cos(a), -24 * Math.sin(a)); drive(g, m, x, z, hd); }); }
      // a hoist on the building's south side: a mast up its three floors, a cage up and down
      { const g = Grp(-293, PLAT.y, 299.1); B(g, 1.7, 0.4, 1.7, CON, 0, 0.2, 0); B(g, 0.8, 13, 0.8, lat(1, 13 / 0.8), 0, 6.9, 0); B(g, 1.1, 0.5, 1.1, Y, 0, 13.6, 0);
        const cg = new THREE.Group(); cg.position.set(0, 0.4, -1.25); g.add(cg); B(cg, 1.5, 2.2, 1.5, L(0xd8d8d0), 0, 1.1, 0); B(cg, 1.52, 0.6, 1.52, GL, 0, 1.55, 0); B(cg, 1.6, 0.12, 1.6, ORG, 0, 2.26, 0); dynM(cg, true);
        anim(-293, 299, PLAT.y + 6, 8, [cg], (t) => { cg.position.y = kf([[0, 0.4], [1.5, 0.4], [4, 7.2], [5.5, 7.2], [8, 0.4]], t, 8)[0]; }); }
    }
    // solid: the building's platform wall, the building and the crane's foot on it, the offices, the container
    for (const [ax, az, bx, bz, r] of [[PLAT.x0 - PLAT.run, PLAT.z1 + 0.25, PLAT.x1 + PLAT.run, PLAT.z1 + 0.25, 0.3], [-304.3, 299.7, -289.7, 299.7, 0.3], [-304.3, 299.7, -304.3, 310.3, 0.3], [-289.7, 299.7, -289.7, 310.3, 0.3], [-285.8, 305, -284.2, 305, 1.6], [-217.2, 304, -210.8, 304, 1.25], [-115, 311, -109, 311, 1.25]]) H3.solids.push({ ax, az, bx, bz, r });
    return { own, inside, lift };
  }
  // every step (js/game.js stepRace): the machines' clock runs while the car is within 300 m of the site; what drives about moves always (it is
  // the car's wall), the rest only in view (js/nvride.js seen); past the fog none of it is drawn
  function tick(dt, car) {
    if (!anims.length) return; if (car && Math.hypot(car.x + 225, car.z - 280) > 300) return; st += dt;
    const W = typeof Render !== 'undefined' && Render.world; if (W && W.cullFog && fogIn !== W.cullFog) { fogIn = W.cullFog; for (const a of anims) W.cullFog.push(a.fp); }
    const seen = typeof NVRide !== 'undefined' && NVRide.seen;
    for (const a of anims) { const nr = !car || (car.x - a.x) ** 2 + (car.z - a.z) ** 2 < 200 * 200; if (nr !== a.near) { a.near = nr; a.fp.visible = a.fp.on; }   // (not drawn further than 200 m from the car)
      if (a.place) a.place(st); if (a.look && a.fp.on && a.near && (!seen || seen(a.x, a.y, a.z, a.r))) a.look(st); }
  }
  const state = () => ({ t: st, n: anims.length, movers: (G0 && window.__H3 && window.__H3.movers || []).map(m => [+m.x.toFixed(2), +m.z.toFixed(2)]) });
  return { FENCE, POLY, inside, roStop, lift, build, tick, state };
})();
