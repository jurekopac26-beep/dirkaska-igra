// Lighter drawing of the busiest real circuits (NIZKA, 844x390, the chase camera: the measurements are in the pull request's
// description, tests/golden/perf.json stays as it is), with the picture unchanged pixel for pixel. World.build is wrapped, and on a
// track listed in BY the world's big meshes are marked. When one is drawn (by the camera or into the shadow map), its long list of
// triangles is seen as short runs with their boxes (in the mesh's own space; made at its first drawing, made again if its points
// change), and only the stretch from the first run the view can see to the last one is drawn: what is left out lies wholly beyond one
// side of the view, so it would not have touched a pixel. Only for programs whose vertex shader places points exactly as three.js's
// own does (a material that changes that in onBeforeCompile is drawn whole). The mountain and open roads: js/perf-gore.js.
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.build || typeof THREE === 'undefined') return;
  const BY = {};   // track id -> function (world, track, opts, scene)
  const SH = { MeshBasicMaterial: 'basic', MeshLambertMaterial: 'lambert', MeshPhongMaterial: 'phong', MeshStandardMaterial: 'physical',
    MeshPhysicalMaterial: 'physical', MeshToonMaterial: 'toon', MeshMatcapMaterial: 'matcap', MeshNormalMaterial: 'normal',
    MeshDepthMaterial: 'depth', MeshDistanceMaterial: 'distanceRGBA' };
  const MIN = 6000, PAD = 0.5, BLK = 16;   // the indices a mesh needs at least; m around each run's box; runs in a block
  const OBJ = new WeakSet(), DONE = new WeakSet(), HOOK = new WeakSet(), BOX = new WeakMap(), VER = new WeakMap();
  const PM = { BY, mark, last: null, off: false, n: { draws: 0, cut: 0, skip: 0 } };

  // the stock vertex shaders' placing of points, read at load (a global chunk changed later makes a compiled one differ: drawn whole)
  const A = 'vec3 transformed = vec3( position );', Z = 'gl_Position = projectionMatrix * mvPosition;';
  const BAD = /#define\s+(USE_(DISPLACEMENTMAP|SKINNING|MORPHTARGETS|INSTANCING|LOGDEPTHBUF)|position|transformed|mvPosition|modelViewMatrix|projectionMatrix)\b/;
  const count = (s, t) => s.split(t).length - 1;
  function part(s) {
    const a = s.indexOf(A), z = s.indexOf(Z);
    if (a < 0 || z < a || count(s, A) !== 1 || count(s, Z) !== 1) return null;
    return s.slice(a, z + Z.length).replace(/\s+/g, '');
  }
  const STOCK = {};
  const inc = (s, d) => s.replace(/^[ \t]*#include +<([\w\d./]+)>/gm, (m, n) => {
    const c = THREE.ShaderChunk[n]; if (c === undefined || d > 8) throw new Error(n); return inc(c, d + 1);
  });
  for (const t in SH) {
    const k = SH[t]; if (STOCK[k]) continue;
    try { const L = THREE.ShaderLib[k], s = L && inc(L.vertexShader, 0), p = s && part(s); if (p) STOCK[k] = { p, g: count(s, 'gl_Position') }; } catch (e) { /* that kind is drawn whole */ }
  }

  // a geometry whose triangles can be cut into runs: plain positions, enough of them
  function plain(g) {
    if (!g || !g.isBufferGeometry || g.isInstancedBufferGeometry || Object.keys(g.morphAttributes).length) return false;
    const p = g.attributes.position;
    if (!p || p.isInterleavedBufferAttribute || p.itemSize !== 3 || p.normalized) return false;
    return (g.index ? g.index.count : p.count) >= MIN;
  }
  // a mesh drawn as three.js draws a plain one: one stock material, no skin, morphs or displacement, culled by the view
  function fit(m) {
    if (!m.isMesh || m.isInstancedMesh || m.isSkinnedMesh || !m.frustumCulled || m.customDepthMaterial || m.customDistanceMaterial) return false;
    const t = m.material;
    if (!t || Array.isArray(t) || !SH[t.type] || t.wireframe || t.displacementMap || t.morphTargets || t.skinning) return false;
    return plain(m.geometry);
  }
  // mark the world's big meshes, and see that the renderer drawing this scene gets the cutting (installed at its first frame)
  function mark(w, track, opts, scene) {
    let meshes = 0, tris = 0;
    w.root.traverse((m) => {
      if (!fit(m)) return;
      OBJ.add(m); meshes++; const g = m.geometry; tris += Math.floor((g.index ? g.index.count : g.attributes.position.count) / 3);
    });
    if (scene && scene.isScene && !HOOK.has(scene)) {
      HOOK.add(scene);
      const prev = scene.onBeforeRender;
      scene.onBeforeRender = function (R) { if (R && R.state && !DONE.has(R)) install(R); return prev.apply(this, arguments); };
    }
    return { meshes, tris };
  }

  // does this compiled program place points as the stock shader of the material's kind does? (once per program)
  function ok(gl, p, mat) {
    const k = SH[mat.type]; if (!k || !STOCK[k] || !p) return false;
    let v = VER.get(p); if (!v) VER.set(p, v = {});
    if (v[k] !== undefined) return v[k];
    let r = false;
    try {
      let src = null;
      for (const s of gl.getAttachedShaders(p) || []) if (gl.getShaderParameter(s, gl.SHADER_TYPE) === gl.VERTEX_SHADER) src = gl.getShaderSource(s);
      r = !!(src && !BAD.test(src) && part(src) === STOCK[k].p && count(src, 'gl_Position') === STOCK[k].g);
    } catch (e) { r = false; }
    return (v[k] = r);
  }

  // the runs of a geometry (seg triangles each) with their boxes, and blocks of BLK runs with theirs; null: drawn whole
  function boxes(g) {
    const pos = g.attributes.position, idx = g.index, iv = idx ? idx.version : -1;
    let b = BOX.get(g);
    if (b) {
      if (b.bad) return null;
      if (pos && b.pos === pos && b.idx === idx && b.pv === pos.version && b.iv === iv) return b;
      if (b.k >= 2) { b.bad = true; return null; }   // (points that keep changing: not worth it)
    } else BOX.set(g, b = { k: 0, bad: false });
    if (!plain(g)) { b.bad = true; return null; }
    const P = pos.array, I = idx ? idx.array : null, T = idx ? idx.count : pos.count, nt = Math.floor(T / 3);
    const seg = Math.max(48, Math.ceil(nt / 256)), S = Math.ceil(nt / seg), B = new Float64Array(S * 6), nb = Math.ceil(S / BLK), K = new Float64Array(nb * 6);
    for (let r = 0; r < S; r++) {
      let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
      for (let j = r * 3 * seg, e = r === S - 1 ? T : (r + 1) * 3 * seg; j < e; j++) {
        const o = (I ? I[j] : j) * 3, x = P[o], y = P[o + 1], z = P[o + 2];
        if (x !== x || y !== y || z !== z) { b.bad = true; return null; }
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z;
      }
      const o = r * 6; B[o] = x0 - PAD; B[o + 1] = y0 - PAD; B[o + 2] = z0 - PAD; B[o + 3] = x1 + PAD; B[o + 4] = y1 + PAD; B[o + 5] = z1 + PAD;
    }
    for (let k = 0; k < nb; k++) {
      const o = k * 6; K[o] = K[o + 1] = K[o + 2] = Infinity; K[o + 3] = K[o + 4] = K[o + 5] = -Infinity;
      for (let r = k * BLK, e = Math.min(S, r + BLK); r < e; r++) for (let c = 0; c < 3; c++) {
        if (B[r * 6 + c] < K[o + c]) K[o + c] = B[r * 6 + c];
        if (B[r * 6 + 3 + c] > K[o + 3 + c]) K[o + 3 + c] = B[r * 6 + 3 + c];
      }
    }
    Object.assign(b, { pos, idx, pv: pos.version, iv, T, seg, S, B, K }); b.k++;
    return b;
  }
  // is the box at X[o..o+5] at least partly on the inner side of all six planes P (a plane: nx, ny, nz, d)? (NaN: yes)
  function inview(X, o, P) {
    for (let i = 0; i < 24; i += 4) {
      const nx = P[i], ny = P[i + 1], nz = P[i + 2];
      if (nx * (nx > 0 ? X[o + 3] : X[o]) + ny * (ny > 0 ? X[o + 4] : X[o + 1]) + nz * (nz > 0 ? X[o + 5] : X[o + 2]) + P[i + 3] < 0) return false;
    }
    return true;
  }
  // [start, count] of the indices from the first run in view to the last one; NONE: none in view; null: all of it
  const NONE = [0, 0];
  function win(b, P) {
    const { S, B, K, T, seg } = b, nb = Math.ceil(S / BLK);
    let f = -1, l = -1;
    front: for (let k = 0; k < nb; k++) {
      if (!inview(K, k * 6, P)) continue;
      for (let r = k * BLK, e = Math.min(S, r + BLK); r < e; r++) if (inview(B, r * 6, P)) { f = r; break front; }
    }
    if (f < 0) return NONE;
    back: for (let k = nb - 1; k >= Math.floor(f / BLK); k--) {
      if (!inview(K, k * 6, P)) continue;
      for (let r = Math.min(S, (k + 1) * BLK) - 1, e = Math.max(f, k * BLK); r >= e; r--) if (inview(B, r * 6, P)) { l = r; break back; }
    }
    if (l < f) l = f;
    if (f === 0 && l === S - 1) return null;
    const s = f * 3 * seg, e = l === S - 1 ? T : (l + 1) * 3 * seg;
    return [s, e - s];
  }

  // the renderer's own drawing of one object, wrapped: for a marked mesh the planes of the view (or of the shadow's camera) in the
  // mesh's own space give the window; the program is known only inside the drawing, so the window is set as it is chosen (useProgram)
  // and put back right after
  function install(R) {
    DONE.add(R);
    const st = R.state, gl = R.getContext && R.getContext(), draw = R.renderBufferDirect, use = st && st.useProgram;
    if (typeof draw !== 'function' || typeof use !== 'function' || !gl) return;
    const M = new THREE.Matrix4(), F = new THREE.Frustum(), P = new Float64Array(24); let pend = null;
    st.useProgram = function (p) {
      const q = pend;
      if (q !== null && !q.done) {
        q.done = true;
        if (ok(gl, p, q.mat)) { q.geo.drawRange.start = q.s; q.geo.drawRange.count = q.c; q.set = true; }
      }
      return use.apply(this, arguments);
    };
    R.renderBufferDirect = function (cam, sc, geo, mat, obj, group) {
      if (PM.off || !obj || !OBJ.has(obj) || group !== null || !obj.frustumCulled || !cam || !cam.projectionMatrix || !mat || !SH[mat.type] ||
        mat.wireframe || mat.morphTargets || mat.morphNormals || !geo || geo.drawRange.start !== 0 || geo.drawRange.count !== Infinity) return draw.apply(this, arguments);
      const b = boxes(geo); if (b === null) return draw.apply(this, arguments);
      M.multiplyMatrices(cam.projectionMatrix, obj.modelViewMatrix); F.setFromProjectionMatrix(M);
      for (let i = 0; i < 6; i++) { const pl = F.planes[i]; P[i * 4] = pl.normal.x; P[i * 4 + 1] = pl.normal.y; P[i * 4 + 2] = pl.normal.z; P[i * 4 + 3] = pl.constant; }
      const w = win(b, P); PM.n.draws++;
      if (w === null) return draw.apply(this, arguments);
      const prev = pend, q = pend = { geo, mat, s: w[0], c: w[1], set: false, done: false };
      try { return draw.apply(this, arguments); } finally {
        pend = prev;
        if (q.set) { geo.drawRange.start = 0; geo.drawRange.count = Infinity; if (w[1] === 0) PM.n.skip++; else PM.n.cut++; }
      }
    };
  }

  BY.sepang = BY.zandvoort = BY.sakhir = BY.lombok = mark;

  const build = World.build;
  World.build = function (scene, track, tex, opts) {
    const w = build.apply(this, arguments);
    const id = track && track.def && track.def.id, f = id && BY[id];
    if (f && w && w.root) { try { PM.last = { id, r: f(w, track, opts || {}, scene) }; } catch (e) { console.warn('perf-mesta', id, e); } }
    return w;
  };
  World.perfMesta = PM;
})();
