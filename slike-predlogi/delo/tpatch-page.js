(() => {
  // (pictures only) the smooth lighter wedge of lot paving lying over the circuit at the south lot's entrance (x -8..28): the circuit's own
  // asphalt laid over it again (a copy of its triangles there, same texture, its UVs and shading, 8 cm up); window.__TPATCH(0/1)
  if (window.__TPATCHROOT) Render.scene.remove(window.__TPATCHROOT);
  const TX = Tex.all(); let tMesh = null; Render.scene.traverse(o => { if (!tMesh && o.isMesh && o.geometry.attributes.position.count === 34800) { const m = Array.isArray(o.material) ? o.material[0] : o.material; if (m && m.map && m.map.image === TX.asphalt.image) tMesh = o; } });
  if (!tMesh) return 'TPATCH no circuit mesh';
  const g = tMesh.geometry, P = g.attributes.position, U = g.attributes.uv, C = g.attributes.color, N = g.attributes.normal, I = g.index, n = I ? I.count : P.count, e = tMesh.matrixWorld;
  const pos = [], uv = [], col = [], nor = [], V = new THREE.Vector3(); let tris = 0;
  for (let t = 0; t < n; t += 3) { const ids = [0, 1, 2].map(k => I ? I.getX(t + k) : t + k); let ok = true;
    for (const i of ids) { V.fromBufferAttribute(P, i).applyMatrix4(e); if (V.x < -8 || V.x > 28 || V.z < 143 || V.z > 160) { ok = false; break; } }
    if (!ok) continue; tris++;
    for (const i of ids) { V.fromBufferAttribute(P, i).applyMatrix4(e); pos.push(V.x, V.y + 0.08, V.z); if (U) uv.push(U.getX(i), U.getY(i)); const fa = Math.min(1, Math.max(0, (V.x + 8) / 4), Math.max(0, (28 - V.x) / 4)); col.push(C ? C.getX(i) : 1, C ? C.getY(i) : 1, C ? C.getZ(i) : 1, fa * fa * (3 - 2 * fa)); if (N) nor.push(N.getX(i), N.getY(i), N.getZ(i)); } }
  const G = new THREE.Group(); G.name = 'tpatch'; G.userData.keep = true; Render.scene.add(G); window.__TPATCHROOT = G;
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); if (uv.length) gg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); gg.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); if (nor.length) gg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); else gg.computeVertexNormals();
  const m = (Array.isArray(tMesh.material) ? tMesh.material[0] : tMesh.material).clone(); m.polygonOffset = true; m.polygonOffsetFactor = -4; m.polygonOffsetUnits = -4; m.vertexColors = true; m.transparent = true; m.depthWrite = false; m.needsUpdate = true;      // (its ends fade out over 4 m into the circuit's own asphalt, the wear marks showing on through)
  const me = new THREE.Mesh(gg, m); me.receiveShadow = true; me.renderOrder = 0.5; me.userData.keep = true; me.frustumCulled = false; G.add(me);
  window.__TPATCH = (k) => { G.visible = k > 0; return k; };
  return 'TPATCH ' + tris + ' tris';
})()
