(() => {
  // (pictures only) the user's marks of 20. 10.: the two trees on the beach at the park road's east end and the grass decal under them; the stage in
  // the park (and its paved pad); the orange cube (a kiosk on four posts) by the circuit's west edge; three bollards on the road at the NW crossing ;
  // window.__DEL20(0/1)
  if (window.__DEL20) window.__DEL20(0);
  const hid = [], moved = [], V = new THREE.Vector3(), B = new THREE.Box3(); Render.scene.updateMatrixWorld(true);
  const pname = (o) => (o.parent && o.parent.name) || '';
  const cen = (o) => { const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); B.copy(g.boundingBox).applyMatrix4(o.matrixWorld); B.getCenter(V); return [V.x, V.y, V.z, B.max.x - B.min.x, B.max.y - B.min.y, B.max.z - B.min.z]; };
  const SKIP = ['edgeband', 'kerbjoin', 'terr', 'gr18', 'mk18', 'paint-oldsand', 'paint-beach', 'jn', 'verge', 'xing6', 'trikerb', 'notch', 'widek', 'rimfill', 'lawn4'];
  const n = { tree: 0, grass: 0, stage: 0, kiosk: 0, post: 0 };
  Render.scene.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.geometry || !o.geometry.attributes.position) return; const nv = o.geometry.attributes.position.count, pn = pname(o); if (SKIP.includes(pn) && pn !== 'gr18') return;
    const [x, y, z, sx, sy, sz] = cen(o), col = o.material && o.material.color ? o.material.color.getHexString() : '';
    let k = null;
    if (o.parent === Render.scene && (nv === 60 || nv === 40) && (col === '6aa040' || col === '6a4a2a') && [[105.6, -73.5], [105.5, -71.2]].some(p => Math.hypot(x - p[0], z - p[1]) < 0.6)) k = 'tree';
    else if (pn === 'gr18' && nv === 509 && x > 100 && x < 115 && z > -80 && z < -65 && sx < 16 && sz < 16) k = 'grass';
    else if (pn !== 'nv-baked' && !SKIP.includes(pn) && x > 54.5 && x < 86.5 && z > -59.2 && z < -50.8 && sx < 20 && sz < 9) k = 'stage';
    else if (pn !== 'nv-baked' && !SKIP.includes(pn) && x > 89 && x < 95 && z > -43 && z < -37 && sx < 6 && sz < 6 && sy > 0.5) k = 'kiosk';
    else if (pn === 'nv-baked' && (nv === 42 || nv === 248) && Math.hypot(x + 189.5, z - 143.2) < 0.5 && sx < 1) k = 'post';
    if (k) { hid.push([o, o.layers.mask]); o.layers.set(31); n[k]++; return; }
    if (pn === 'nv-baked' && (nv === 210 || nv === 1240 || nv === 120) && sx < 14 && Math.hypot(x + 197.3, z - 148.1) < 3) {      // (the merged bollard row: the three on the road dropped)
      const P = o.geometry.attributes.position; let c = 0;
      for (let i = 0; i < P.count; i++) { V.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); if ([[-192.3, 144.1], [-194.9, 147.1]].some(p => Math.hypot(V.x - p[0], V.z - p[1]) < 0.9) && V.y > -5) { P.setY(i, P.getY(i) - 40); moved.push([P, i]); c++; } }
      if (c) { P.needsUpdate = true; o.geometry.computeBoundingSphere(); n.post += c / P.count; } } });
  window.__DEL20 = (on) => { for (const [o, l] of hid) { if (on) o.layers.set(31); else o.layers.mask = l; } for (const [P, i] of moved) { P.setY(i, P.getY(i) + (on ? -40 : 40)); P.needsUpdate = true; } if (!on) moved.length = on ? moved.length : moved.length; };
  window.__DEL20.on = true;
  return 'DEL20 ' + JSON.stringify(n) + ' hidden ' + hid.length + ' verts dropped ' + moved.length; })()
