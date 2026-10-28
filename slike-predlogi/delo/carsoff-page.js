(() => {
  // (pictures only) the user: "zbriši vsa avta na velikem parkirišču": the parked vans on the big lot (by the driving school) hidden, with
  // their wheels and the little markers over them; found by their shapes (body 5886 / 900 vertices, wheels 528 / 294, marker 15, the flat shadow quad) on the lot
  const sc = Render.scene; sc.updateMatrixWorld(true); const box = new THREE.Box3(), c = new THREE.Vector3(), s = new THREE.Vector3();
  const SIG = { 5886: 1, 900: 1, 528: 1, 294: 1, 15: 1 }; const hid = window.__CARSOFF || []; let n = 0; const kinds = {};
  sc.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.visible) return; const v = o.geometry.attributes.position.count;
    // and each van's flat shadow under it (a 3 x 6 m quad)
    if (v === 4) { const m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m || m.type !== 'MeshBasicMaterial') return; box.setFromObject(o); box.getCenter(c); box.getSize(s);
      if (c.x < -15 || c.x > 165 || c.z < 55 || c.z > 155 || s.y > 0.05 || c.y > 0.6) return; const a = Math.min(s.x, s.z), b = Math.max(s.x, s.z);
      if (a > 2 && a < 4 && b > 4.5 && b < 7.5) { o.visible = false; hid.push(o); n++; kinds.sh = (kinds.sh || 0) + 1; } return; }
    if (!SIG[v]) return;
    box.setFromObject(o); box.getCenter(c); box.getSize(s);
    if (c.x < -15 || c.x > 165 || c.z < 55 || c.z > 155) return;
    if (s.x > 6 || s.z > 6 || s.y > 3) return;
    if (v === 15 && c.y < 3) return;
    o.visible = false; hid.push(o); n++; kinds[v] = (kinds[v] || 0) + 1; });
  // and what belongs to each van (its plate, its roof sign): small things right at a hidden body
  const vans = hid.filter(o => o.geometry.attributes.position.count === 5886).map(o => { box.setFromObject(o); return box.getCenter(new THREE.Vector3()); });
  sc.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.visible) return; box.setFromObject(o); box.getCenter(c); box.getSize(s);
    if (s.x > 2.5 || s.z > 2.5 || s.y > 1.5 || c.y < 0.3) return;
    if (vans.some(vc => Math.abs(vc.x - c.x) < 1.6 && Math.abs(vc.z - c.z) < 3.2)) { o.visible = false; hid.push(o); n++; kinds.part = (kinds.part || 0) + 1; } });
  window.__CARSOFF = hid; window.__CARS = (k) => { hid.forEach(o => o.visible = !(k > 0)); return k; };
  return 'CARSOFF ' + n + ' ' + JSON.stringify(kinds);
})()
