(() => {
  // (pictures only) 21. 10., the small marks of sheets 43-2..43-8 ("popravi nepravilnosti", "popravi prehode v mivki"): vertex alpha of single layers
  // taken off in small polygons (a soft edge), or blurred over a box (soft sand transitions), a few meshes hidden, the game's painted line stubs dropped
  // (as lstub) ; window.__FIX21 report
  if (window.__FIX21ROOT) { Render.scene.remove(window.__FIX21ROOT); window.__FIX21ROOT = null; }
  const OPS = __OPS__, H = window.__H3, out = [];
  const inP = (x, z, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const dSeg = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz); };
  const dPoly = (x, z, P) => { let d = 1e9; for (let i = 0, j = P.length - 1; i < P.length; j = i++) d = Math.min(d, dSeg(x, z, P[j], P[i])); return inP(x, z, P) ? -d : d; };
  const sst = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const top = (o) => { let p = o; while (p.parent && p.parent !== Render.scene) p = p.parent; return p; };
  const meshes = (sel) => { const L = []; Render.scene.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return; const nv = o.geometry.attributes.position.count, g = top(o).name;
      if (sel.groups) { let ok = false, p = o; while (p && !ok) { if (sel.groups.includes(p.name)) ok = true; p = p.parent; } if (!ok) return; } if (sel.nv && !sel.nv.includes(nv)) return; if (sel.ro != null && Math.abs(o.renderOrder - sel.ro) > 1e-3) return; L.push(o); }); return L; };
  const bbHit = (o, x0, z0, x1, z1) => { const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const b = g.boundingBox.clone().applyMatrix4(o.matrixWorld); return b.max.x > x0 && b.min.x < x1 && b.max.z > z0 && b.min.z < z1; };
  const V = new THREE.Vector3();
  for (const op of OPS) { let n = 0;
    if (op.t === 'alpha0' || op.t === 'alpha1') { const P = op.poly, s = op.soft || 0.4, xs = P.map(p => p[0]), zs = P.map(p => p[1]), x0 = Math.min(...xs) - s, x1 = Math.max(...xs) + s, z0 = Math.min(...zs) - s, z1 = Math.max(...zs) + s;
      for (const o of meshes(op)) { const C = o.geometry.attributes.color; if (!C || C.itemSize < 4 || !bbHit(o, x0, z0, x1, z1)) continue; const A = o.geometry.attributes.position; let ch = 0;
        for (let i = 0; i < A.count; i++) { V.fromBufferAttribute(A, i).applyMatrix4(o.matrixWorld); if (V.x < x0 || V.x > x1 || V.z < z0 || V.z > z1) continue; const w = 1 - sst(-s, 0, dPoly(V.x, V.z, P)); if (w <= 0) continue;
          const a = C.getW(i), na = op.t === 'alpha0' ? a * (1 - w) : a + (1 - a) * w; if (Math.abs(na - a) > 1e-4) { C.setW(i, na); ch++; } }
        if (ch) { C.needsUpdate = true; n += ch; } } }
    else if (op.t === 'blur') { const [x0, z0, x1, z1] = op.box, r = op.r, S = 0.5, fall = op.fall || 4;
      for (const o of meshes(op)) { const C = o.geometry.attributes.color; if (!C || C.itemSize < 4 || !bbHit(o, x0 - fall, z0 - fall, x1 + fall, z1 + fall)) continue; const A = o.geometry.attributes.position, pts = [];
        for (let i = 0; i < A.count; i++) { V.fromBufferAttribute(A, i).applyMatrix4(o.matrixWorld); if (V.x > x0 - fall - r && V.x < x1 + fall + r && V.z > z0 - fall - r && V.z < z1 + fall + r) pts.push([i, V.x, V.z, C.getW(i)]); }
        const cell = new Map(), key = (x, z) => Math.floor(x / 2) + ',' + Math.floor(z / 2); for (const p of pts) { const k = key(p[1], p[2]); let l = cell.get(k); if (!l) cell.set(k, l = []); l.push(p); }
        const R = Math.ceil(r / 2) + 1, na = [];
        for (const p of pts) { const [i, x, z, a] = p; const w = sst(-fall, 0, Math.min(x - x0, x1 - x, z - z0, z1 - z)); if (w <= 0) continue; let sw = 0, sa = 0; const ci = Math.floor(x / 2), cj = Math.floor(z / 2);
          for (let di = -R; di <= R; di++) for (let dj = -R; dj <= R; dj++) { const l = cell.get((ci + di) + ',' + (cj + dj)); if (!l) continue; for (const q of l) { const d2 = (q[1] - x) ** 2 + (q[2] - z) ** 2; if (d2 > r * r) continue; const ww = Math.exp(-d2 / (r * r / 4)); sw += ww; sa += ww * q[3]; } }
          if (sw) na.push([i, a + (sa / sw * (op.scale != null ? op.scale : 1) - a) * w]); }
        for (const [i, a] of na) C.setW(i, a); if (na.length) { C.needsUpdate = true; n += na.length; } } }
    else if (op.t === 'hide') { for (const o of meshes(op)) { if (op.near && !bbHit(o, op.near[0] - 1, op.near[1] - 1, op.near[0] + 1, op.near[1] + 1)) continue; if (op.maxExt) { const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const b = g.boundingBox; if (Math.max(b.max.x - b.min.x, b.max.z - b.min.z) > op.maxExt) continue; } o.visible = false; n++; } }
    else if (op.t === 'lift') { // (vertex colours lifted towards a level inside a polygon (soft edge inside it), the hue kept: the asphalt's dark racing-line band by the kerb)
      const P = op.poly, s = op.soft || 0.4, xs = P.map(p => p[0]), zs = P.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
      for (const o of meshes(op)) { const C = o.geometry.attributes.color; if (!C || (op.near && !bbHit(o, op.near[0] - 1, op.near[1] - 1, op.near[0] + 1, op.near[1] + 1)) || !bbHit(o, x0, z0, x1, z1)) continue; const A = o.geometry.attributes.position; let ch = 0;
        for (let i = 0; i < A.count; i++) { V.fromBufferAttribute(A, i).applyMatrix4(o.matrixWorld); if (V.x < x0 || V.x > x1 || V.z < z0 || V.z > z1) continue; const w = 1 - sst(-s, 0, dPoly(V.x, V.z, P)); if (w <= 0) continue;
          const r = C.getX(i); if (r >= op.to || r <= 0) continue; const k = 1 + (op.to / r - 1) * w; C.setXYZ(i, r * k, C.getY(i) * k, C.getZ(i) * k); ch++; }
        if (ch) { C.needsUpdate = true; n += ch; } } }
    else if (op.t === 'recolor') { for (const o of meshes(op)) { if (op.near && !bbHit(o, op.near[0] - 1, op.near[1] - 1, op.near[0] + 1, op.near[1] + 1)) continue; if (!o.material || !o.material.color) continue; if (!o.userData.__f21c) { const m = o.material.clone(); m.onBeforeCompile = o.material.onBeforeCompile; m.customProgramCacheKey = o.material.customProgramCacheKey; o.material = m; o.userData.__f21c = true; } o.material.color.set(op.color); n++; } }
    else if (op.t === 'lstub') { let root = null; for (const c of Render.scene.children) if (c.name === 'nv-baked') root = c; const seen = new Set(), [x0, x1, z0, z1] = op.box;
      root.traverse(o => { if (!o.isMesh || !o.geometry || seen.has(o.geometry.attributes.position)) return; const P = o.geometry.attributes.position, C = o.geometry.attributes.color; seen.add(P); if (!C) return; let ch = 0;
        for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i); if (x < x0 || x > x1 || z < z0 || z > z1 || Math.min(C.getX(i), C.getY(i), C.getZ(i)) < 0.8) continue; P.setY(i, P.getY(i) - 5); ch++; }
        if (ch) { P.needsUpdate = true; n += ch; } }); }
    else if (op.t === 'cut') { // (a discard in the shaders of the chosen layers' meshes inside axis-aligned boxes [x0, z0, x1, z1]; skipRo: render orders left alone)
      const B = op.boxes.map(b => new THREE.Vector4(b[0], b[1], b[2], b[3])), key = '__f21' + op.id, U = window.__F21U || (window.__F21U = { value: 1 });
      while (B.length < 4) B.push(new THREE.Vector4(1e6, 1e6, 1e6, 1e6));
      for (const o of meshes(op)) { if (!op.boxes.some(b => bbHit(o, b[0], b[1], b[2], b[3]))) continue; if (op.skipRo && op.skipRo.some(r => Math.abs(o.renderOrder - r) < 1e-3)) continue; const m = o.material; if (!m || Array.isArray(m) || m.userData[key]) continue; m.userData[key] = true; n++;
        const prev = m.onBeforeCompile, ck = m.customProgramCacheKey, un = 'uF21' + op.id.replace(/[^A-Za-z0-9]/g, '');
        m.onBeforeCompile = function (sh, r) { if (prev && prev !== THREE.Material.prototype.onBeforeCompile) prev.call(this, sh, r);
          sh.uniforms[un] = { value: B }; sh.uniforms.uF21on = U;
          if (sh.vertexShader.indexOf('vF21w') < 0) sh.vertexShader = 'varying vec2 vF21w;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vF21w = (modelMatrix * vec4(transformed, 1.0)).xz;');
          sh.fragmentShader = (sh.fragmentShader.indexOf('vF21w') < 0 ? 'varying vec2 vF21w;\nuniform float uF21on;\n' : '') + 'uniform vec4 ' + un + '[4];\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n  if (uF21on > 0.5) for (int i = 0; i < 4; i++) { vec4 b = ' + un + '[i]; if (vF21w.x > b.x && vF21w.x < b.z && vF21w.y > b.y && vF21w.y < b.w) discard; }'); };
        m.customProgramCacheKey = function () { return (ck ? ck.call(this) : '') + '|' + un; }; m.needsUpdate = true; } }
    else if (op.t === 'patch') { // (a convex polygon of another surface's own material, its texture mapping fitted, at its height or dy over the ground)
      let src = null; Render.scene.traverse(o => { if (!src && o.isMesh && o.geometry && o.geometry.attributes.position && o.geometry.attributes.position.count === op.src && bbHit(o, op.near[0] - 0.5, op.near[1] - 0.5, op.near[0] + 0.5, op.near[1] + 0.5)) src = o; });
      if (src) { const g0 = src.geometry, P0 = g0.attributes.position, U0 = g0.attributes.uv; let S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], bu = [0, 0, 0], bv = [0, 0, 0], sy = 0, ny = 0;
        for (let k = 0; k < P0.count; k++) { V.fromBufferAttribute(P0, k).applyMatrix4(src.matrixWorld); if (k % 7 === 0) { sy += V.y - H.ground(V.x, V.z); ny++; } if (!U0) continue; const r = [V.x, V.z, 1]; for (let a = 0; a < 3; a++) { for (let b = 0; b < 3; b++) S[a][b] += r[a] * r[b]; bu[a] += r[a] * U0.getX(k); bv[a] += r[a] * U0.getY(k); } }
        let uvA = null; if (U0) { const inv = new THREE.Matrix3().set(S[0][0], S[0][1], S[0][2], S[1][0], S[1][1], S[1][2], S[2][0], S[2][1], S[2][2]).invert().elements, mul = (b) => [0, 1, 2].map(r => inv[r] * b[0] + inv[r + 3] * b[1] + inv[r + 6] * b[2]); uvA = [mul(bu), mul(bv)]; }
        const dy = op.dy != null ? op.dy : sy / ny, pos = [], uv = [], nor = [], idx = [];
        for (const [x, z] of op.poly) { pos.push(x, H.ground(x, z) + dy, z); uv.push(uvA ? uvA[0][0] * x + uvA[0][1] * z + uvA[0][2] : x / 8, uvA ? uvA[1][0] * x + uvA[1][1] * z + uvA[1][2] : z / 8); nor.push(0, 1, 0); }
        for (let k = 1; k + 1 < op.poly.length; k++) idx.push(0, k, k + 1);
        for (let t = 0; t < idx.length; t += 3) { const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3; if ((pos[c] - pos[a]) * (pos[b + 2] - pos[a + 2]) - (pos[b] - pos[a]) * (pos[c + 2] - pos[a + 2]) < 0) { const sw = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = sw; } }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
        const C0 = g0.attributes.color; if (C0) { const cs = C0.itemSize, mc = new Array(cs).fill(0); for (let k = 0; k < C0.count; k++) for (let q = 0; q < cs; q++) mc[q] += C0.array[k * cs + q] / C0.count; if (cs === 4) mc[3] = 1; const ca = []; for (let k = 0; k < op.poly.length; k++) ca.push(...mc); g.setAttribute('color', new THREE.Float32BufferAttribute(ca, cs)); }
        const m = src.material.clone(); m.onBeforeCompile = src.material.onBeforeCompile; m.customProgramCacheKey = src.material.customProgramCacheKey; m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; if (op.dw) m.depthWrite = true; m.needsUpdate = true;   // (dw: writes depth, so the sea's plane under the ground cannot show through)
        let G = window.__FIX21ROOT; if (!G) { G = new THREE.Group(); G.name = 'fix21'; Render.scene.add(G); window.__FIX21ROOT = G; }
        const me = new THREE.Mesh(g, m); me.receiveShadow = true; me.renderOrder = op.ro != null ? op.ro : src.renderOrder; me.userData.keep = true; G.add(me); n = 1; } }
    out.push(op.id + ':' + n); }
  return 'FIX21 ' + out.join(' '); })()
