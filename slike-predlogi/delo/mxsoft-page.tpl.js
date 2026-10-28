(() => {
  // (pictures only) soft blend between the two sand colours (light run-off sand / darker motocross dirt and makadam), read off a close top
  // view (mxsoft.py): the colour runs over several metres, every sand pixel keeps its own grain, tracks and shadows; drawn over what lies there
  if (window.__MXSROOT) Render.scene.remove(window.__MXSROOT);
  const RS = __DATA__, H = window.__H3, G = new THREE.Group(); G.name = 'mxsoft'; G.userData.keep = true; Render.scene.add(G); window.__MXSROOT = G;
  const dec = (b) => { const s = atob(b), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; };
  const out = RS.map(r => { const c = dec(r.c), al = dec(r.a), nx = r.nx, nz = r.nz, pos = new Float32Array(nx * nz * 3), col = new Float32Array(nx * nz * 4), idx = [];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const q = j * nx + i, x = r.x0 + i * r.S, z = r.z0 + j * r.S;
      pos[q * 3] = x; pos[q * 3 + 1] = H.ground(x, z) + 0.6; pos[q * 3 + 2] = z; col[q * 4] = c[q * 3] / 255; col[q * 4 + 1] = c[q * 3 + 1] / 255; col[q * 4 + 2] = c[q * 3 + 2] / 255; col[q * 4 + 3] = al[q] / 255; }
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i; if (al[a] + al[a + 1] + al[a + nx] + al[a + nx + 1] === 0) continue; idx.push(a, a + nx, a + 1, a + 1, a + nx, a + nx + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 4)); g.setIndex(idx);
    const m = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, depthTest: false, fog: false });
    const me = new THREE.Mesh(g, m); me.renderOrder = 5; me.userData.keep = true; me.frustumCulled = false; G.add(me); return idx.length / 3; });
  window.__MXS = (k) => { G.visible = k > 0; return k; };
  return 'MXS ' + JSON.stringify(out);
})()
