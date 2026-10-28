(() => {
  // (pictures only) the park's little train ring (its rails, sleepers and low fence) lifted 0.35 m, so the one grass now over the park does not bury it
  const sc = Render.scene; sc.updateMatrixWorld(true); const out = { m: 0, i: 0 }, B = [58, 86, -51, -11], inB = (x, z) => x > B[0] && x < B[1] && z > B[2] && z < B[3];
  if (window.__LIFT) return 'already';
  const M4 = new THREE.Matrix4(), V = new THREE.Vector3(), up = new THREE.Matrix4().makeTranslation(0, 0.35, 0);
  sc.traverse(o => { if (!o.isMesh || o.userData.keep) return; let v = true; for (let p = o; p; p = p.parent) if (!p.visible) v = false; if (!v) return; const g = o.geometry; if (!g || !g.attributes.position) return;
    if (o.isInstancedMesh) { let c = 0; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M4); V.setFromMatrixPosition(M4).applyMatrix4(o.matrixWorld); if (inB(V.x, V.z) && V.y < __H3.ground(V.x, V.z) + 0.7) { M4.premultiply(up); o.setMatrixAt(i, M4); c++; } } if (c) { o.instanceMatrix.needsUpdate = true; out.i += c; } return; }
    if (!g.boundingBox) g.computeBoundingBox(); const b = g.boundingBox.clone().applyMatrix4(o.matrixWorld); const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2;
    if (!inB(cx, cz) || b.max.x - b.min.x > 30 || b.max.z - b.min.z > 40 || b.max.y > __H3.ground(cx, cz) + 0.7) return; o.position.y += 0.35; o.updateMatrixWorld(true); out.m++; });
  window.__LIFT = 1; return 'LIFT ' + JSON.stringify(out);
})()
