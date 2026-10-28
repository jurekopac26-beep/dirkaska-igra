(() => {
  // (pictures only) the user: "startno rampo za motokros prestavi tam, kjer sem narisal" (Mapa 2): the start gate (its 7 slats, 2 posts,
  // the orange banner and its shadow decal) moved ~12 m west to the start of the motocross lane, same facing, at the ground's height there
  if (window.__GATEMOVED) return 'GATE already moved';
  const sc = Render.scene, H = window.__H3; sc.updateMatrixWorld(true); const box = new THREE.Box3(), c = new THREE.Vector3(), s = new THREE.Vector3();
  const near = (x, z, r) => Math.abs(c.x - x) < r && Math.abs(c.z - z) < r;
  const picks = []; sc.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.visible) return; const v = o.geometry.attributes.position.count, m = Array.isArray(o.material) ? o.material[0] : o.material, col = m && m.color ? m.color.getHexString() : '';
    box.setFromObject(o); box.getCenter(c); box.getSize(s);
    if ((v === 24 && col === 'b8bcc2' && near(-305.4, -240.2, 6) && s.y < 1) || (v === 52 && col === '3a3e42' && near(-305.4, -240.2, 7) && s.y > 3) ||
        (v === 24 && col === 'ff6a1a' && near(-305.4, -240.2, 3) && s.z > 8) || (v === 4 && col === 'ffffff' && near(-301.2, -236.6, 2) && s.x > 5 && s.x < 6.5 && s.z > 7.5 && s.z < 9)) picks.push(o); });
  const DX = -12.1, DZ = -0.9, dy = H.ground(-305.4 + DX, -240.2 + DZ) - H.ground(-305.4, -240.2);
  const w = new THREE.Vector3();
  picks.forEach(o => { o.getWorldPosition(w); w.x += DX; w.z += DZ; w.y += dy; o.parent.worldToLocal(w); o.position.copy(w); o.updateMatrixWorld(true); });
  window.__GATEMOVED = picks; return 'GATE moved ' + picks.length + ' parts, dy ' + dy.toFixed(2);
})()
