(() => {
  // (pictures only) the grey shard fans either side of the gondola station's slab (two baked flat meshes: what lies outside the slab folded away)
  // and the light grey strip south of the lagoon (part of three baked meshes: folded there); window.__FANS(1) / 0
  const sc = Render.scene, out = {}; sc.updateMatrixWorld(true); const REC = [];
  const foldIf = (o, test) => { const g = o.geometry, P = g.attributes.position, I = g.index, e = o.matrixWorld.elements, n = I ? I.count : P.count, ix = (k) => I ? I.getX(k) : k; const arr = I ? I.array : P.array, before = arr.slice(); let c = 0;
    for (let t = 0; t + 2 < n; t += 3) { const a = ix(t), b = ix(t + 1), cc = ix(t + 2); let x = 0, y = 0, z = 0; for (const v of [a, b, cc]) { x += (P.getX(v) * e[0] + P.getY(v) * e[4] + P.getZ(v) * e[8] + e[12]) / 3; y += (P.getX(v) * e[1] + P.getY(v) * e[5] + P.getZ(v) * e[9] + e[13]) / 3; z += (P.getX(v) * e[2] + P.getY(v) * e[6] + P.getZ(v) * e[10] + e[14]) / 3; }
      if (!test(x, y, z)) continue; c++; if (I) { arr[t + 1] = arr[t]; arr[t + 2] = arr[t]; } else for (const v of [t + 1, t + 2]) P.setXYZ(v, P.getX(t), P.getY(t), P.getZ(t)); }
    if (c) { REC.push([arr, before, arr.slice(), I || P]); (I || P).needsUpdate = true; } return c; };
  // found by their size and place (their ids change with every load): [vertices, x0, x1, z0, z1]
  const SIG = { '027646': [288, -143.9, -127.5, 30.1, 49.5], '75FB0C': [312, -131.2, -80.2, 16.6, 45.9], '96A9C7': [2760, -175, 97, 150, 306], '33E8AC': [2760, -175, 97, 150, 306], '2C2C8E': [2760, -175, 97, 150, 306] };
  const byId = {}, taken = new Set(); for (const [k, [n, x0, x1, z0, z1]] of Object.entries(SIG)) { byId[k] = []; sc.traverse(o => { if (!o.isMesh || o.isInstancedMesh || taken.has(o) || byId[k].length) return; const g = o.geometry; if (!g || !g.attributes.position || g.attributes.position.count !== n) return; if (!g.boundingBox) g.computeBoundingBox(); const b = g.boundingBox.clone().applyMatrix4(o.matrixWorld); if (Math.abs(b.min.x - x0) < 1 && Math.abs(b.max.x - x1) < 1 && Math.abs(b.min.z - z0) < 1 && Math.abs(b.max.z - z1) < 1) { byId[k].push(o); taken.add(o); } }); }
  const slab = (x, z) => x > -130.9 && x < -93.7 && z > 16.4 && z < 37.5;
  out.fans = ['027646', '75FB0C'].map(k => (byId[k] || []).reduce((s, o) => s + foldIf(o, (x, y, z) => !slab(x, z) && z < 47 && x > -136), 0));
  out.strip = ['96A9C7', '33E8AC', '2C2C8E'].map(k => (byId[k] || []).reduce((s, o) => s + foldIf(o, (x, y, z) => x > -42 && x < -12 && z > 243.5 && z < 247.5), 0));
  window.__FANS = (k) => { for (const [arr, a0, a1, attr] of REC) { arr.set(k > 0 ? a1 : a0); attr.needsUpdate = true; } return k; };
  return JSON.stringify(out);
})()
