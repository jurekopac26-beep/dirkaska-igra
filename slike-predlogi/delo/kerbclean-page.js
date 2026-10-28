(() => {
  // (pictures only) no grass over any kerb round the smaller circuit and along the lane (the user: "still green grass here, a bit over the kerbs"):
  // a mask of every kerb's face seen from above (the game's kerbs, the tricolour ones redrawn, the circuit's own kerb ribbons where drawn) 0.2 m round;
  // the meadow overlay (gr18) is not drawn there and the old-sand paint's colour goes off there (19. 10.); window.__KCLEAN(0/1)
  if (window.__KCLEAN) window.__KCLEAN(0);
  const X0 = -216, Z0 = -264, S = 0.2, NX = 1985, NZ = 2140, M = new Uint8Array(NX * NZ); let ntri = 0, nmesh = 0;
  Render.scene.updateMatrixWorld(true); const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
  const raster = (o) => { const g = o.geometry, P = g.attributes.position, I = g.index, Cc = g.attributes.color, a4 = Cc && Cc.itemSize === 4, cnt = I ? I.count : P.count;
    for (let t = 0; t < cnt; t += 3) { const ia = I ? I.getX(t) : t, ib = I ? I.getX(t + 1) : t + 1, ic = I ? I.getX(t + 2) : t + 2;
      if (a4 && Cc.getW(ia) < 0.5 && Cc.getW(ib) < 0.5 && Cc.getW(ic) < 0.5) continue;
      A.fromBufferAttribute(P, ia).applyMatrix4(o.matrixWorld); B.fromBufferAttribute(P, ib).applyMatrix4(o.matrixWorld); C.fromBufferAttribute(P, ic).applyMatrix4(o.matrixWorld);
      const ar = (B.x - A.x) * (C.z - A.z) - (C.x - A.x) * (B.z - A.z); if (Math.abs(ar) < 0.02) continue;
      const x0 = Math.max(0, Math.floor((Math.min(A.x, B.x, C.x) - X0) / S) - 1), x1 = Math.min(NX - 1, Math.ceil((Math.max(A.x, B.x, C.x) - X0) / S) + 1), z0 = Math.max(0, Math.floor((Math.min(A.z, B.z, C.z) - Z0) / S) - 1), z1 = Math.min(NZ - 1, Math.ceil((Math.max(A.z, B.z, C.z) - Z0) / S) + 1);
      if (x0 > x1 || z0 > z1 || (x1 - x0) * (z1 - z0) > 40000) continue; ntri++;
      for (let j = z0; j <= z1; j++) for (let i = x0; i <= x1; i++) { const px = X0 + (i + 0.5) * S, pz = Z0 + (j + 0.5) * S;
        const w0 = ((B.x - px) * (C.z - pz) - (C.x - px) * (B.z - pz)) / ar, w1 = ((C.x - px) * (A.z - pz) - (A.x - px) * (C.z - pz)) / ar, w2 = 1 - w0 - w1;
        if (w0 >= -0.05 && w1 >= -0.05 && w2 >= -0.05) M[j * NX + i] = 255; } } };
  Render.scene.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return; let vis = o.visible && (o.layers.mask & 1), p = o.parent; while (p) { vis = vis && p.visible; p = p.parent; } if (!vis) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material, n = o.geometry.attributes.position.count;
    const kerb = (m && m.map && m.map.image && m.map.image.width === 32 && m.map.image.height === 64) || o.name === 'trikerb' || (o.parent && (o.parent.name === 'notch' || o.parent.name === 'widek')) || (o.parent && (o.parent.name === 'edgeband' || o.parent.name === 'kerbjoin') && m.isMeshLambertMaterial && Math.abs(o.renderOrder - 5.25) < 0.001);
    if (!kerb) return; nmesh++; raster(o); });
  // 0.2 m round
  const D = new Uint8Array(NX * NZ); for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { if (!M[j * NX + i]) continue; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const jj = j + dj, ii = i + di; if (jj >= 0 && jj < NZ && ii >= 0 && ii < NX) D[jj * NX + ii] = 255; } }
  const tex = new THREE.DataTexture(D, NX, NZ, THREE.RedFormat, THREE.UnsignedByteType); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.needsUpdate = true;
  window.__KCU = window.__KCU || { value: 1 }; const U = window.__KCU, BX = new THREE.Vector4(X0, Z0, NX * S, NZ * S), mats = new Set();
  Render.scene.traverse(o => { if (o.isMesh && o.parent && o.parent.name === 'gr18') (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m)); });
  for (const m of mats) { if (m.userData.__kc) { m.userData.__kcTex.value = tex; continue; } m.userData.__kc = true; m.userData.__kcTex = { value: tex }; const TU = m.userData.__kcTex, prev = m.onBeforeCompile, ck = m.customProgramCacheKey;
    m.onBeforeCompile = function (sh, r) { if (prev && prev !== THREE.Material.prototype.onBeforeCompile) prev.call(this, sh, r);
      sh.uniforms.uKCon = U; sh.uniforms.uKC = TU; sh.uniforms.uKCb = { value: BX };
      sh.vertexShader = 'varying vec2 vKCw;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vKCw = (modelMatrix * vec4(transformed, 1.0)).xz;');
      sh.fragmentShader = 'varying vec2 vKCw;\nuniform float uKCon;\nuniform sampler2D uKC;\nuniform vec4 uKCb;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n  { vec2 q = (vKCw - uKCb.xy) / uKCb.zw; if (uKCon > 0.5 && q.x > 0.0 && q.x < 1.0 && q.y > 0.0 && q.y < 1.0 && texture2D(uKC, q).r > 0.5) discard; }'); };
    m.customProgramCacheKey = function () { return (ck ? ck.call(this) : '') + '|kc'; }; m.needsUpdate = true; }
  // the old-sand paint: its colour off where the mask is (its cells 0.25 m)
  const PK = []; const V = new THREE.Vector3();
  Render.scene.traverse(o => { if (!o.isMesh || !o.parent || o.parent.name !== 'paint-oldsand') return; const P = o.geometry.attributes.position, Cc = o.geometry.attributes.color; if (!Cc || Cc.itemSize !== 4) return; let ch = false;
    for (let i = 0; i < P.count; i++) { const a = Cc.getW(i); if (a <= 0) continue; V.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); const ii = Math.floor((V.x - X0) / S), jj = Math.floor((V.z - Z0) / S); if (ii < 0 || jj < 0 || ii >= NX || jj >= NZ || !D[jj * NX + ii]) continue; PK.push([Cc, i, a]); Cc.setW(i, 0); ch = true; }
    if (ch) Cc.needsUpdate = true; });
  window.__KCLEAN = (on) => { U.value = on ? 1 : 0; for (const [Cc, i, a] of PK) Cc.setW(i, on ? 0 : a); for (const [Cc] of PK) Cc.needsUpdate = true; };
  return 'KCLEAN kerb meshes ' + nmesh + ' tris ' + ntri + ' gr18 mats ' + mats.size + ' paint verts ' + PK.length; })()
