// NEW VERSION · TEST 1: the new map on a phone. js/newmap.js builds it out of some 20 000 small meshes and a few instanced ones (the
// tyre walls, the tufts: every instance drawn every frame), a draw call each, twice with the shadows. Once it is built, its still meshes
// and instances are merged here: by material and by a grid of cells. The many one-colour materials of a kind become one, their colours
// (and the instances' colours) vertex colours; only what stands up (walls, roofs, trees, posts) casts a shadow, not the flat things (the
// ground, the paths, the marks) nor the small ones. Every frame a cell past the fog is not drawn (js/render.js cullByDistance,
// world.cullFog): the haze hides it anyway.
// Loaded with the new map (js/game.js nvStart).
const NVBake = (function () {
  'use strict';
  const CELL = 64;   // (m: the cells' size)
  const hooked = (m) => m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile;   // (kept as they are, unless m.userData.bake: a shader of its own that only needs the world position, the one meadow's)
  // a merge key: one-colour materials by their kind (the colour goes into the vertices), the rest by the material itself
  function keyOf(o, m, ic) {
    const tag = [m.type, m.side, m.depthWrite, m.depthTest, m.polygonOffset ? m.polygonOffsetFactor + '/' + m.polygonOffsetUnits : 0, m.fog, m.flatShading, m.alphaTest, o.renderOrder].join('|');
    const plain = !m.map && !m.alphaMap && !m.transparent && !m.vertexColors && !m.envMap && !m.bumpMap && !m.normalMap && !m.emissiveMap && !m.specularMap;
    if (plain && (m.isMeshLambertMaterial || m.isMeshBasicMaterial || m.isMeshPhongMaterial || m.isMeshStandardMaterial)) {
      const ex = m.emissive ? m.emissive.getHex() + '|' + (m.emissiveIntensity || 1) : '', sp = m.isMeshPhongMaterial ? m.specular.getHex() + '|' + m.shininess : '', st = m.isMeshStandardMaterial ? m.roughness + '|' + m.metalness : '';
      return { key: 'vc|' + tag + '|' + ex + '|' + sp + '|' + st + '|' + m.opacity, vc: true };
    }
    return { key: (ic ? 'mi|' : 'm|') + m.uuid + '|' + o.renderOrder, vc: false };   // (mi: the instances' colours become vertex colours)
  }
  // the shared material of a vertex-colour group: a copy of the first one's, white, its colours from the vertices
  function vcMat(m) { const n = m.clone(); if (n.color) n.color.setRGB(1, 1, 1); n.vertexColors = true; n.needsUpdate = true; return n; }
  const _b = new THREE.Box3(), _s = new THREE.Box3(), _n = new THREE.Matrix3(), _i = new THREE.Matrix4(), _c = new THREE.Color();
  let last = null, cells = [];
  // a big group's triangles by the cell of their middle: an index list per cell
  function split(P, I, cell) {
    const by = new Map();
    for (let t = 0; t < I.length; t += 3) {
      const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3, x = (P[a] + P[b] + P[c]) / 3, z = (P[a + 2] + P[b + 2] + P[c + 2]) / 3;
      const k = Math.floor(x / cell) + ',' + Math.floor(z / cell); let l = by.get(k); if (!l) by.set(k, l = []); l.push(I[t], I[t + 1], I[t + 2]);
    }
    const Big = I instanceof Uint32Array ? Uint32Array : Uint16Array;
    return [...by.values()].map(l => Big.from(l));
  }
  // the bounds of the vertices an index list draws
  function sphereOf(P, ix) {
    const b = new THREE.Box3(), v = new THREE.Vector3();
    for (let i = 0; i < ix.length; i++) { const j = ix[i] * 3; b.expandByPoint(v.set(P[j], P[j + 1], P[j + 2])); }
    const s = new THREE.Sphere(); b.getCenter(s.center); let r = 0;
    for (let i = 0; i < ix.length; i++) { const j = ix[i] * 3; r = Math.max(r, v.set(P[j], P[j + 1], P[j + 2]).distanceToSquared(s.center)); }
    s.radius = Math.sqrt(r); return s;
  }
  function bake(scene, opt = {}) {
    const cell = opt.cell || CELL, groups = new Map(), done = [];
    let n = 0, ni = 0, kept = 0; const whys = {}, src = {};
    scene.updateMatrixWorld(true);
    const tops = scene.children.filter(c => c.userData.mk);
    const shown = (o) => { for (let p = o; p && p !== scene; p = p.parent) if (!p.visible) return false; return true; };
    // one mesh (or one instance) into its group (an instance's colour: a copied material is white, its own colour goes into the vertices too)
    const put = (o, m, g, mw, box, ic, k) => {
      const hgt = box.max.y - box.min.y, wide = Math.max(box.max.x - box.min.x, box.max.z - box.min.z);
      // (a big one, the ground of the whole map, a long path: in its own group, so that the cells stay small and the camera's
      // frustum culls those out of view)
      const at = wide > cell * 1.5 ? 'big' : Math.floor((box.min.x + box.max.x) / 2 / cell) + ',' + Math.floor((box.min.z + box.max.z) / 2 / cell);
      const cast = o.castShadow && hgt > 0.6 && hgt > 0.08 * wide && Math.max(hgt, wide) > 1.2;   // (stands up, for its size, and is not small: not the ground, a long fence)
      const gk = k.key + '|' + at + '|' + (cast ? 1 : 0) + (o.receiveShadow ? 1 : 0);
      let G = groups.get(gk); if (!G) groups.set(gk, G = { m, vc: k.vc, ic: !!ic, big: at === 'big', cast, recv: o.receiveShadow, ro: o.renderOrder, items: [], nv: 0, ni: 0 });
      const nv = g.attributes.position.count; const sk = (o.isInstancedMesh ? 'inst ' : '') + g.type + ' ' + nv, si = g.index ? g.index.count : nv; src[sk] = (src[sk] || 0) + si; G.items.push({ g, mw, col: k.vc ? (ic ? new THREE.Color().copy(m.color).multiply(ic) : m.color) : ic ? (m.vertexColors || !m.color ? ic : ic.clone().multiply(m.color)) : null }); G.nv += nv; G.ni += g.index ? g.index.count : nv;
    };
    for (const top of tops) top.traverse(o => {
      if (!o.isMesh || o.isSkinnedMesh || o.userData.dyn) return;   // (dyn: what moves, the walls' pieces of fence, js/nvwalls.js)
      const m = o.material, g = o.geometry;
      // (a geometry's face groups only count with an array of materials: one material draws the whole of it)
      let why = Array.isArray(m) ? 'multi' : !g || !g.attributes.position ? 'nogeo' : g.morphAttributes.position ? 'morph' : m.aoMap || m.lightMap ? 'uv2' : hooked(m) && !m.userData.bake ? 'shader' : !shown(o) ? 'hidden' : isFinite(g.drawRange.count) && g.drawRange.count < (g.index ? g.index.count : g.attributes.position.count) ? 'range' : '';
      if (!why && !o.isInstancedMesh) { _b.setFromObject(o); if (![_b.min.x, _b.min.y, _b.min.z, _b.max.x, _b.max.y, _b.max.z].every(Number.isFinite)) why = 'nan'; }
      if (why) { kept++; whys[why] = (whys[why] || 0) + 1; return; }
      if (o.isInstancedMesh) {   // every instance on its own: its matrix, its colour
        if (!g.boundingBox) g.computeBoundingBox();
        const ic = o.instanceColor, k = keyOf(o, m, ic);
        for (let i = 0; i < o.count; i++) {
          o.getMatrixAt(i, _i); const mw = new THREE.Matrix4().multiplyMatrices(o.matrixWorld, _i);
          _s.copy(g.boundingBox).applyMatrix4(mw); if (![_s.min.x, _s.max.x, _s.min.z, _s.max.z].every(Number.isFinite)) continue;
          put(o, m, g, mw, _s, ic ? (o.getColorAt(i, _c), _c.clone()) : null, k); ni++;
        }
      } else put(o, m, g, o.matrixWorld, _b, null, keyOf(o, m, null));
      done.push(o); n++;
    });
    const root = new THREE.Group(); root.name = 'nv-baked'; root.userData.mk = 1;
    const mats = new Map(); cells = [];
    for (const G of groups.values()) {
      const m = G.m, uv = !!m.map, nrm = !m.isMeshBasicMaterial, col = G.vc || G.ic || !!m.vertexColors;
      const cs = !G.vc && m.vertexColors && G.items.some(it => it.g.attributes.color && it.g.attributes.color.itemSize === 4) ? 4 : 3;   // (RGBA: the soft edges' alpha in the vertices)
      const P = new Float32Array(G.nv * 3), N = nrm ? new Float32Array(G.nv * 3) : null, U = uv ? new Float32Array(G.nv * 2) : null, C = col ? new Float32Array(G.nv * cs) : null;
      const I = G.nv > 65535 ? new Uint32Array(G.ni) : new Uint16Array(G.ni);
      let v0 = 0, i0 = 0;
      for (const it of G.items) {
        const g = it.g, pa = g.attributes.position, cnt = pa.count, mw = it.mw;
        let na = g.attributes.normal; if (nrm && !na) { if (!g.userData.nv) { const c2 = g.clone(); c2.computeVertexNormals(); g.userData.nv = c2.attributes.normal; } na = g.userData.nv; }
        _n.getNormalMatrix(mw); const e = mw.elements, ne = _n.elements, flip = mw.determinant() < 0;
        for (let i = 0; i < cnt; i++) {
          const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), j = (v0 + i) * 3;
          P[j] = e[0] * x + e[4] * y + e[8] * z + e[12]; P[j + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; P[j + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
          if (N) { const a = na.getX(i), b = na.getY(i), c = na.getZ(i); const nx = ne[0] * a + ne[3] * b + ne[6] * c, ny = ne[1] * a + ne[4] * b + ne[7] * c, nz = ne[2] * a + ne[5] * b + ne[8] * c; const l = Math.hypot(nx, ny, nz) || 1; N[j] = nx / l; N[j + 1] = ny / l; N[j + 2] = nz / l; }
        }
        if (U) { const ua = g.attributes.uv; for (let i = 0; i < cnt; i++) { U[(v0 + i) * 2] = ua ? ua.getX(i) : 0; U[(v0 + i) * 2 + 1] = ua ? ua.getY(i) : 0; } }
        if (C) { const ca = !G.vc && m.vertexColors && g.attributes.color, a4 = ca && ca.itemSize === 4, c = it.col; for (let i = 0; i < cnt; i++) { const j = (v0 + i) * cs; let r = 1, gg = 1, b = 1; if (ca) { r = ca.getX(i); gg = ca.getY(i); b = ca.getZ(i); } if (c) { r *= c.r; gg *= c.g; b *= c.b; } C[j] = r; C[j + 1] = gg; C[j + 2] = b; if (cs === 4) C[j + 3] = a4 ? ca.getW(i) : 1; } }
        if (g.index) { const ix = g.index.array, nn = g.index.count; for (let i = 0; i < nn; i += 3) { I[i0 + i] = ix[i] + v0; I[i0 + i + 1] = ix[flip ? i + 2 : i + 1] + v0; I[i0 + i + 2] = ix[flip ? i + 1 : i + 2] + v0; } i0 += nn; }
        else { for (let i = 0; i < cnt; i += 3) { I[i0 + i] = v0 + i; I[i0 + i + 1] = v0 + (flip ? i + 2 : i + 1); I[i0 + i + 2] = v0 + (flip ? i + 1 : i + 2); } i0 += cnt; }
        v0 += cnt;
      }
      const att = { position: new THREE.BufferAttribute(P, 3) }; if (N) att.normal = new THREE.BufferAttribute(N, 3); if (U) att.uv = new THREE.BufferAttribute(U, 2); if (C) att.color = new THREE.BufferAttribute(C, cs);
      let mat = m; if (G.vc || (G.ic && !m.vertexColors)) { const vk = G.vc ? keyOf({ renderOrder: G.ro }, m, null).key : 'mi|' + m.uuid; mat = mats.get(vk); if (!mat) mats.set(vk, mat = vcMat(m)); }
      // a big group (the ground's layers, the long paths): its triangles dealt out to the cells, so that the camera's frustum and the
      // fog cull them too (the cells share the group's vertices, each its own index and bounds)
      const parts = G.big ? split(P, I, cell) : [I];
      for (const ix of parts) {
        const geo = new THREE.BufferGeometry(); for (const k in att) geo.setAttribute(k, att[k]);
        geo.setIndex(new THREE.BufferAttribute(ix, 1)); geo.boundingSphere = sphereOf(P, ix);
        const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = G.cast; mesh.receiveShadow = G.recv; mesh.renderOrder = G.ro; mesh.matrixAutoUpdate = false; mesh.updateMatrix();
        root.add(mesh); cells.push(mesh);
      }
    }
    for (const o of done) if (o.parent) o.parent.remove(o);
    // (the groups left empty: out of the scene)
    const empty = (o) => !o.isMesh && !o.isSprite && !o.isLine && !o.isPoints && !o.isLight && o.children.length === 0;
    for (const top of tops) { const rm = []; top.traverse(o => { if (o !== top && empty(o)) rm.push(o); }); for (const o of rm) if (o.parent) o.parent.remove(o); if (empty(top)) scene.remove(top); }
    scene.add(root);
    if (opt.world) opt.world.cullFog = cells;   // (js/render.js cullByDistance: every frame, the cells past the fog not drawn, nor in the shadows)
    let nv = 0; const seen = new Set(); for (const c of cells) { const a = c.geometry.attributes.position; if (!seen.has(a)) { seen.add(a); nv += a.count; } }
    return (last = { merged: n, instances: ni, kept, whys, meshes: cells.length, kverts: Math.round(nv / 1000), mats: mats.size, src: Object.entries(src).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => Math.round(v / 1000) + 'k ' + k) });   // (src: what the indices come from, the most first)
  }
  return { bake, stats: () => last };   // (stats: the tests)
})();
