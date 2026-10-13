// Mockup only (carimgs.mjs): a police light bar on the roof of a car, for the "Police chase" picture. The car's length runs along x.
window.policeBar = function (car, THREE) {
  const o = car.obj, rot = o.rotation.y; o.rotation.y = 0; o.updateMatrixWorld(true);
  const parts = car.meshes.filter(m => m.mesh.renderOrder !== 1).map(m => m.mesh), box = new THREE.Box3();
  parts.forEach(m => box.expandByObject(m));
  const top = box.max.y, v = new THREE.Vector3(), xs = [], zs = [];
  parts.forEach(m => { const p = m.geometry.getAttribute('position'); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld); if (v.y > top - 0.06) { xs.push(v.x); zs.push(v.z); } } });
  xs.sort((a, b) => a - b); zs.sort((a, b) => a - b);
  const cx = (xs[0] + xs[xs.length - 1]) / 2, cz = (zs[0] + zs[zs.length - 1]) / 2, W = (box.max.z - box.min.z) * 0.6;
  o.rotation.y = rot;
  const g = new THREE.Group(); g.position.set(cx, top, cz);
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  add(new THREE.BoxGeometry(0.26, 0.06, W * 1.04), new THREE.MeshLambertMaterial({ color: 0x1c2029 }), 0, 0.03, 0);
  add(new THREE.BoxGeometry(0.22, 0.12, W * 0.48), new THREE.MeshBasicMaterial({ color: 0xff3a3a }), 0, 0.12, -W * 0.26);
  add(new THREE.BoxGeometry(0.22, 0.12, W * 0.48), new THREE.MeshBasicMaterial({ color: 0x3a7bff }), 0, 0.12, W * 0.26);
  // a soft glow around each light: a sprite with a round gradient, added on top
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,255,255,.75)'); gr.addColorStop(0.45, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128); const tex = new THREE.CanvasTexture(cv);
  const glow = (c, z, s) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false })); sp.scale.set(s, s, 1); sp.position.set(0, 0.14, z); g.add(sp); };
  glow(0xff3030, -W * 0.26, 1.9); glow(0x3a78ff, W * 0.26, 1.9);
  return g;
};
