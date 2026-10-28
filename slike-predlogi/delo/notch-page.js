(() => {
  // (pictures only) the kerb where the lane leaves the circuit by the SE lot (user's "Popravi"): the circuit's kerb and the lane's corner kerb joined
  // by one smoothly curved piece of the same kerb (same texture and light) along the asphalt's edge, the circuit kerb's stretched last triangle and its next two
  // lengths folded away, the corner kerb without its dark lip, no notch (19. 10.); window.__NOTCH(0/1)
  if (window.__NOTCHROOT) { window.__NOTCH(0); Render.scene.remove(window.__NOTCHROOT); }
  Render.scene.updateMatrixWorld(true);
  const V = new THREE.Vector3(); let K7 = null;
  Render.scene.traverse(o => { if (K7 || !o.isMesh || !o.geometry || !o.geometry.attributes.position || o.geometry.attributes.position.count !== 7548 || o.geometry.index) return; const P = o.geometry.attributes.position;
    for (let i = 0; i < P.count; i++) { V.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); if (Math.abs(V.x - 122.07) < 0.03 && Math.abs(V.z - 61.06) < 0.03) { K7 = o; break; } } });
  if (!K7) return 'NOTCH no kerb';
  // the circuit kerb's triangles past its last whole cross-section (v > 149), only here: folded to a point
  const g7 = K7.geometry, P7 = g7.attributes.position, UV = g7.attributes.uv, keep = []; let nf = 0;
  for (let t = 0; t < P7.count; t += 3) { let inb = true, late = true;
    for (let k = 0; k < 3; k++) { V.fromBufferAttribute(P7, t + k).applyMatrix4(K7.matrixWorld); if (V.x < 117.5 || V.x > 127.5 || V.z < 58 || V.z > 66) inb = false; if (UV.getY(t + k) < 147.29) late = false; }
    if (!inb || !late) continue; keep.push([t, P7.array.slice(t * 3, t * 3 + 9)]); for (let k = 1; k < 3; k++) P7.setXYZ(t + k, P7.getX(t), P7.getY(t), P7.getZ(t)); nf++; }
  P7.needsUpdate = true;
  // the joining piece: from the corner kerb's end on to the circuit kerb's third cross-section, its inner edge a smooth curve on the kerbs' own inner corners
  // (a B-spline: tangent to the corner kerb at its end and to the old kerb where it goes on, never off the asphalt's edge), the outer edge 1.5 m out (its ends
  // exactly on both kerbs' corners); the circuit kerb's two lengths it replaces folded away with the stretched one; u 0 at the asphalt .. 1 outside
  const Ai = [120.05, 59.01], Ao = [118.93, 60.00], Bi = [122.07, 61.06], Ci = [124.61, 62.87], Di = [127.15, 64.13], Do = [126.56, 65.51], N = 24;
  const M = [(Bi[0] + Ci[0]) / 2, (Bi[1] + Ci[1]) / 2], SEG = [[Ai, Bi, M], [M, Ci, Di]], inn = [], tan = [];
  for (let s = 0; s <= N; s++) { const h = s / N * 2, k = Math.min(1, Math.floor(h)), t = h - k, [p0, p1, p2] = SEG[k];
    inn.push([0, 1].map(c => (1 - t) * (1 - t) * p0[c] + 2 * (1 - t) * t * p1[c] + t * t * p2[c])); const d = [0, 1].map(c => 2 * (1 - t) * (p1[c] - p0[c]) + 2 * t * (p2[c] - p1[c])), l = Math.hypot(d[0], d[1]); tan.push([d[0] / l, d[1] / l]); }
  const out = inn.map((p, s) => [p[0] - tan[s][1] * 1.5, p[1] + tan[s][0] * 1.5]), eA = [Ao[0] - out[0][0], Ao[1] - out[0][1]], eD = [Do[0] - out[N][0], Do[1] - out[N][1]];
  for (let s = 0; s <= N; s++) { const t = s / N; out[s][0] += (1 - t) * eA[0] + t * eD[0]; out[s][1] += (1 - t) * eA[1] + t * eD[1]; }
  const L = Math.hypot(Di[0] - Ai[0], Di[1] - Ai[1]), err = Math.hypot(eA[0], eA[1]).toFixed(2) + '/' + Math.hypot(eD[0], eD[1]).toFixed(2);
  // the corner kerb and the lane's kerb it comes from redrawn (same texture and light, their face only: no dark outer lip), 6 cm higher so the lot's paving
  // and strip no longer cut their red: the kerb whole along the lane, the lot beyond it
  let K48 = null, K795 = null; Render.scene.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position || !o.geometry.index) return; const P = o.geometry.attributes.position, n = P.count; if (n !== 48 && n !== 795) return;
    if (n === 48 && K48) return; if (n === 795 && K795) return; const m = o.material; if (!m.map || !m.map.image || m.map.image.width !== 32) return;
    for (let i = 0; i < P.count; i++) { V.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); if (n === 48 && Math.abs(V.x - 120.05) < 0.03 && Math.abs(V.z - 59.01) < 0.03) { K48 = o; break; } if (n === 795 && Math.abs(V.x - 114.97) < 0.05 && Math.abs(V.z - 56.11) < 0.05) { K795 = o; break; } } });
  const pos = [], uv = [], col = [], nor = [], idx = []; let vv = 0, n48 = 0;
  for (const K of [K48, K795]) { if (!K) continue; const P = K.geometry.attributes.position, U = K.geometry.attributes.uv, I = K.geometry.index, b0 = pos.length / 3;
    for (let i = 0; i < P.count; i++) { V.fromBufferAttribute(P, i).applyMatrix4(K.matrixWorld); pos.push(V.x, V.y + 0.06, V.z); uv.push(U.getX(i), U.getY(i)); col.push(1, 1, 1); nor.push(0, 1, 0); }
    for (let t = 0; t < I.count; t += 3) { const a = I.getX(t), b = I.getX(t + 1), c = I.getX(t + 2); if (a % 3 === 2 || b % 3 === 2 || c % 3 === 2) continue; idx.push(b0 + a, b0 + b, b0 + c); n48++; } }
  window.__NOTCH48 = K48;
  const o0 = pos.length / 3; vv = 2.65;
  for (let s = 0; s <= N; s++) { const t = s / N; if (s) vv += Math.hypot(inn[s][0] - inn[s - 1][0], inn[s][1] - inn[s - 1][1]) / 3;
    pos.push(inn[s][0], 0.18 + (0.05 - 0.18) * t, inn[s][1], out[s][0], 0.20 + (0.09 - 0.20) * t, out[s][1]); uv.push(0, vv, 1, vv); col.push(1, 1, 1, 1, 1, 1); nor.push(0, 1, 0, 0, 1, 0);
    if (s) { const a = o0 + (s - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  // (each face wound to look up, as the game's kerbs)
  let nfl = 0; for (let t = 0; t < idx.length; t += 3) { const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3; const cy = (pos[c] - pos[a]) * (pos[b + 2] - pos[a + 2]) - (pos[b] - pos[a]) * (pos[c + 2] - pos[a + 2]);
    if (cy < 0) { const q = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = q; nfl++; } }
  g.setIndex(idx); const ny = nfl;
  const me = new THREE.Mesh(g, K7.material); me.receiveShadow = true; const G = new THREE.Group(); G.name = 'notch'; G.add(me); Render.scene.add(G); window.__NOTCHROOT = G;
  const KS = [K48, K795].filter(Boolean); for (const K of KS) K.layers.set(31); window.__NOTCH = (on) => { G.visible = !!on; if (window.__NKU) window.__NKU.value = on ? 1 : 0; if (window.__NKPK) { for (const [Cc, i, a, f] of window.__NKPK) Cc.setW(i, on ? f : a); for (const [Cc] of window.__NKPK) Cc.needsUpdate = true; } for (const K of KS) { if (on) K.layers.set(31); else K.layers.set(0); } for (const [t, a] of keep) { if (on) for (let k = 1; k < 3; k++) P7.setXYZ(t + k, P7.getX(t), P7.getY(t), P7.getZ(t)); else for (let k = 0; k < 3; k++) P7.setXYZ(t + k, a[k * 3], a[k * 3 + 1], a[k * 3 + 2]); } P7.needsUpdate = true; };
  // the meadow overlay's last grass bits and the lime verge's sliver over the kerb and just outside it (x 94..126): not drawn there (a mask along the kerb, 1.45 m from its middle)
  { const X0 = 94, Z0 = 52, S = 0.1, NX = 320, NZ = 140, A8 = new Uint8Array(NX * NZ), C = [];
    const st = []; for (const K of [K48, K795]) { if (!K) continue; const P = K.geometry.attributes.position; for (let i = 0; i + 1 < P.count; i += 3) { V.fromBufferAttribute(P, i).applyMatrix4(K.matrixWorld); const ax = V.x, az = V.z; V.fromBufferAttribute(P, i + 1).applyMatrix4(K.matrixWorld); st.push([K === K48 ? 0 : 1, (ax + V.x) / 2, (az + V.z) / 2]); } }
    for (let s = 0; s <= N; s++) st.push([2, (inn[s][0] + out[s][0]) / 2, (inn[s][1] + out[s][1]) / 2]);
    for (let k = 0; k + 1 < st.length; k++) { if (st[k][0] !== st[k + 1][0]) continue; const ax = st[k][1], az = st[k][2], bx = st[k + 1][1], bz = st[k + 1][2]; if (Math.max(ax, bx) < X0 - 2 || Math.min(ax, bx) > X0 + NX * S + 2) continue; C.push([ax, az, bx, bz]); }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const x = X0 + (i + 0.5) * S, z = Z0 + (j + 0.5) * S; let d = 9;
      for (const [ax, az, bx, bz] of C) { if (Math.abs(x - ax) > 4 && Math.abs(x - bx) > 4) continue; const vx = bx - ax, vz = bz - az, l2 = vx * vx + vz * vz || 1e-6, t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / l2)); d = Math.min(d, Math.hypot(x - ax - t * vx, z - az - t * vz)); }
      A8[j * NX + i] = d < 1.45 ? 255 : 0; }
    const tex = new THREE.DataTexture(A8, NX, NZ, THREE.RedFormat, THREE.UnsignedByteType); tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
    window.__NKU = window.__NKU || { value: 1 }; const U = window.__NKU, BX = new THREE.Vector4(X0, Z0, NX * S, NZ * S), mats = new Set();
    Render.scene.traverse(o => { if (!o.isMesh || !o.parent || !(o.parent.name === 'gr18' || (o.geometry.attributes.position && o.geometry.attributes.position.count === 6070))) return; const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld);
      if (bb.max.x < X0 || bb.min.x > X0 + NX * S || bb.min.z > Z0 + NZ * S || bb.max.z < Z0) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m)); });
    for (const m of mats) { if (m.userData.__nk) { m.userData.__nkTex.value = tex; continue; } m.userData.__nk = true; m.userData.__nkTex = { value: tex }; const TU = m.userData.__nkTex, prev = m.onBeforeCompile, ck = m.customProgramCacheKey;
      m.onBeforeCompile = function (sh, r) { if (prev && prev !== THREE.Material.prototype.onBeforeCompile) prev.call(this, sh, r);
        sh.uniforms.uNKon = U; sh.uniforms.uNK = TU; sh.uniforms.uNKb = { value: BX };
        sh.vertexShader = 'varying vec2 vNKw;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vNKw = (modelMatrix * vec4(transformed, 1.0)).xz;');
        sh.fragmentShader = 'varying vec2 vNKw;\nuniform float uNKon;\nuniform sampler2D uNK;\nuniform vec4 uNKb;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n  { vec2 q = (vNKw - uNKb.xy) / uNKb.zw; if (uNKon > 0.5 && q.x > 0.0 && q.x < 1.0 && q.y > 0.0 && q.y < 1.0 && texture2D(uNK, q).r > 0.5) discard; }'); };
      m.customProgramCacheKey = function () { return (ck ? ck.call(this) : '') + '|nk'; }; m.needsUpdate = true; }
    // (the green bits there are the old-sand paint layer's: its colour off round the kerb too)
    const dK = (x, z) => { let d = 9; for (const [ax, az, bx, bz] of C) { if (Math.abs(x - ax) > 4 && Math.abs(x - bx) > 4) continue; const vx = bx - ax, vz = bz - az, l2 = vx * vx + vz * vz || 1e-6, t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / l2)); d = Math.min(d, Math.hypot(x - ax - t * vx, z - az - t * vz)); } return d; };
    const PK = []; let npk = 0; Render.scene.traverse(o => { if (!o.isMesh || !o.parent || o.parent.name !== 'paint-oldsand') return; const P = o.geometry.attributes.position, Cc = o.geometry.attributes.color; if (!Cc || Cc.itemSize !== 4) return;
      for (let i = 0; i < P.count; i++) { V.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); if (V.x < X0 - 1 || V.x > X0 + NX * S + 1 || V.z < Z0 - 1 || V.z > Z0 + NZ * S + 1) continue; const a = Cc.getW(i); if (a <= 0) continue; const d = dK(V.x, V.z); if (d >= 1.9) continue; const f = a * Math.min(1, Math.max(0, (d - 1.45) / 0.45)); PK.push([Cc, i, a, f]); Cc.setW(i, f); npk++; }
      Cc.needsUpdate = true; });
    window.__NKPK = PK; window.__NKNPK = npk;
    // (and the lot paving's baked lime streak showing through the strip's soft edge just outside the corner kerb: the paving not drawn on that streak)
    const ms = new Set(); Render.scene.traverse(o => { if (o.isMesh && o.geometry.attributes.position && o.geometry.attributes.position.count === 27470) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => ms.add(m)); });
    for (const m of ms) { if (Array.isArray(m.userData.__ns)) { m.onBeforeCompile = m.userData.__ns[0]; m.customProgramCacheKey = m.userData.__ns[1]; } const prev = m.onBeforeCompile, ck = m.customProgramCacheKey; m.userData.__ns = [prev, ck];
      m.onBeforeCompile = function (sh, r) { if (prev && prev !== THREE.Material.prototype.onBeforeCompile) prev.call(this, sh, r);
        sh.uniforms.uNcon = U; sh.uniforms.uNcs = { value: new THREE.Vector4(115.42, 57.68, 116.2, 58.58) };
        sh.vertexShader = 'varying vec2 vNcw;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vNcw = (modelMatrix * vec4(transformed, 1.0)).xz;');
        sh.fragmentShader = 'varying vec2 vNcw;\nuniform float uNcon;\nuniform vec4 uNcs;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n  { vec2 a = uNcs.xy, v = uNcs.zw - uNcs.xy, p = vNcw - a; float t = clamp(dot(p, v) / dot(v, v), 0.0, 1.0); if (uNcon > 0.5 && length(p - t * v) < 0.3) discard; }'); };
      m.customProgramCacheKey = function () { return (ck ? ck.call(this) : '') + '|nc'; }; m.needsUpdate = true; }
    window.__NSMATS = ms.size;
    window.__NKMATS = mats.size; }
  if (window.__FILLET) window.__FILLET(0);
  return 'NOTCH folded ' + nf + ' kerbs ' + KS.length + ' faces ' + n48 + ' piece ' + N + ' L ' + L.toFixed(2) + ' end err ' + err + ' flipped ' + ny + ' gr18 mats ' + window.__NKMATS + ' paint verts ' + window.__NKNPK + ' lot mats ' + window.__NSMATS;
})()
