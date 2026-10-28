(() => {
  // (pictures only) [also: the stray tapes and rods left from the removed loop north-east of the snow hill, folded] gaps in two fences that ran across the new makadam roads (map 3: the palisade along the loop road's west edge at the new road's
  // mouth; map 2/3: the curved field fence across the north farm road): what stands over the ground there folded away; window.__GAP(1) / 0
  const sc = Render.scene; sc.updateMatrixWorld(true); const REC = [], out = { tris: 0, inst: 0 };
  const B = [[-53.5, -45.5, -231, -206], [-96, -83, -380, -363], [-144, -136, -140, -127], [-163, -153, -101, -88], [-127, -119, -89, -75]], inB = (x, z) => B.some(b => x > b[0] && x < b[1] && z > b[2] && z < b[3]), gnd = (x, z) => __H3.ground(x, z);
  const M4 = new THREE.Matrix4(), V = new THREE.Vector3(), Z = new THREE.Matrix4().makeScale(0, 0, 0);
  sc.traverse(o => { if (!o.isMesh || o.userData.keep) return; let vis = true; for (let p = o; p; p = p.parent) if (!p.visible) vis = false; if (!vis) return; const g = o.geometry; if (!g || !g.attributes.position) return;
    if (o.isInstancedMesh) { let ch = 0; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M4); V.setFromMatrixPosition(M4).applyMatrix4(o.matrixWorld); if (inB(V.x, V.z) && V.y > gnd(V.x, V.z) - 0.5) { REC.push(['i', o, i, M4.clone()]); o.setMatrixAt(i, Z); ch++; } } if (ch) { o.instanceMatrix.needsUpdate = true; out.inst += ch; } return; }
    if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld); if (!B.some(b => !(bb.max.x < b[0] || bb.min.x > b[1] || bb.max.z < b[2] || bb.min.z > b[3]))) return;
    const P = g.attributes.position, I = g.index, e = o.matrixWorld.elements, n = I ? I.count : P.count, ix = (k) => I ? I.getX(k) : k, arr = I ? I.array : P.array, before = arr.slice(); let c = 0;
    for (let t = 0; t + 2 < n; t += 3) { let x = 0, y = 0, z = 0; for (let q = 0; q < 3; q++) { const v = ix(t + q); x += (P.getX(v) * e[0] + P.getY(v) * e[4] + P.getZ(v) * e[8] + e[12]) / 3; y += (P.getX(v) * e[1] + P.getY(v) * e[5] + P.getZ(v) * e[9] + e[13]) / 3; z += (P.getX(v) * e[2] + P.getY(v) * e[6] + P.getZ(v) * e[10] + e[14]) / 3; }
      if (!inB(x, z) || y < gnd(x, z) + 0.15) continue; c++; if (I) { arr[t + 1] = arr[t]; arr[t + 2] = arr[t]; } else for (const v of [t + 1, t + 2]) P.setXYZ(v, P.getX(t), P.getY(t), P.getZ(t)); }
    if (c) { REC.push(['f', arr, before, arr.slice(), I || P]); (I || P).needsUpdate = true; out.tris += c; } });
  window.__GAP = (k) => { for (const r of REC) { if (r[0] === 'i') { r[1].setMatrixAt(r[2], k > 0 ? Z : r[3]); r[1].instanceMatrix.needsUpdate = true; } else { r[1].set(k > 0 ? r[3] : r[2]); r[4].needsUpdate = true; } } return k; };
  return 'GAP ' + JSON.stringify(out);
})()
