(() => {
  // (pictures only) the beach's extension (map 3) as the beach: its umbrellas and their shadows too (copies of the beach's own: pole, towel, the
  // canopies in their colours), spaced as on the beach, 7-26 m from the water, off the road; window.__BXP(1) / 0
  if (window.__BXPROOT) Render.scene.remove(window.__BXPROOT); const sc = Render.scene; sc.updateMatrixWorld(true);
  const G = new THREE.Group(); G.name = 'bxp'; G.userData.keep = true; sc.add(G); window.__BXPROOT = G; const V = new THREE.Vector3();
  const near = (x, z, r, test) => { const L = []; sc.traverse(o => { if (!o.isMesh || o.isInstancedMesh || o.userData.keep || !o.parent || o.parent.name !== 'nv-baked') return; const g = o.geometry; if (!g || !g.attributes.position) return; if (!g.boundingBox) g.computeBoundingBox(); const b = g.boundingBox.clone().applyMatrix4(o.matrixWorld), c = b.getCenter(V); if (Math.hypot(c.x - x, c.z - z) < r && test(g.attributes.position.count, b)) L.push([o, c.x, c.z]); }); return L; };
  const base = near(93.8, -257.3, 1.2, (n, b) => n === 40 || n === 96);   // the pole and the towel
  const CAN = [[93.8, -257.3], [102.4, -250], [118.9, -236.5], [132.9, -217.7], [139, -189.3], [136.8, -149.1], [145, -140.7]].map(([x, z]) => near(x, z, 1.2, (n) => n === 34)[0]).filter(Boolean);
  const PS = [[82.0, -255.0], [69.0, -263.0], [52.0, -274.0], [85.0, -243.0], [41.0, -279.0], [56.0, -261.0], [55.0, -297.0]], gnd = (x, z) => __H3.ground(x, z), out = { base: base.length, can: CAN.length, put: 0 };
  const put = (o, cx, cz, tx, tz, rot) => { const c = o.clone(); c.matrixAutoUpdate = true; c.applyMatrix4(o.matrixWorld); c.position.x -= cx; c.position.z -= cz; c.position.y -= gnd(cx, cz); const w = new THREE.Group(); w.position.set(tx, gnd(tx, tz), tz); w.rotation.y = rot; w.add(c); c.castShadow = o.castShadow; c.receiveShadow = o.receiveShadow; G.add(w); };
  PS.forEach(([tx, tz], k) => { const rot = (k * 2.39) % (Math.PI * 2); for (const [o] of base) put(o, 93.8, -257.3, tx, tz, rot); const cn = CAN[(k + 1) % CAN.length]; if (cn) put(cn[0], cn[1], cn[2], tx, tz, rot); out.put++; });
  window.__BXP = (k) => { G.visible = k > 0; return k; };
  return 'BXP ' + JSON.stringify(out);
})()