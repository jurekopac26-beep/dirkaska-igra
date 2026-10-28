(() => {
  // (pictures only) the asphalt roads' wide edge (18. 10.): ribbons along the game's own road lines, a white edge line just inside the asphalt
  // and a 1.6 m shoulder of the same asphalt outside it; colours and where they go read off the top views (edgeband2.py); window.__EDGEB(0/1)
  if (window.__EDGEBROOT) Render.scene.remove(window.__EDGEBROOT);
  const RS = __DATA__, H = window.__H3, G = new THREE.Group(); G.name = 'edgeband'; G.userData.keep = true; Render.scene.add(G); window.__EDGEBROOT = G;
  const dec = (b) => { const s = atob(b), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; };
  let nt = 0;
  RS.forEach(r => { const pb = dec(r.p), p = new Float32Array(pb.buffer), c = dec(r.c), al = dec(r.a), n = r.n, nr = r.nr, pos = new Float32Array(n * nr * 3), col = new Float32Array(n * nr * 4), idx = [];
    for (let q = 0; q < n * nr; q++) { const x = p[q * 2], z = p[q * 2 + 1]; pos[q * 3] = x; pos[q * 3 + 1] = H.ground(x, z) + 0.65; pos[q * 3 + 2] = z;
      col[q * 4] = c[q * 3] / 255; col[q * 4 + 1] = c[q * 3 + 1] / 255; col[q * 4 + 2] = c[q * 3 + 2] / 255; col[q * 4 + 3] = al[q] / 255; }
    for (let q = 0; q < n - 1; q++) for (let k = 0; k < nr - 1; k++) { const a = q * nr + k, b = a + nr; if (al[a] + al[a + 1] + al[b] + al[b + 1] === 0) continue; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    if (!idx.length) return; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 4)); g.setIndex(idx); nt += idx.length / 3;
    // the kerb is a thing on the ground: what stands over it (a kiosk's roof) hides it; the rest is drawn over what lies there
    const m = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, depthTest: r.kind === 'K', fog: false, side: THREE.DoubleSide, polygonOffset: r.kind === 'K', polygonOffsetFactor: -20, polygonOffsetUnits: -20 });
    const me = new THREE.Mesh(g, m); me.renderOrder = r.kind === 'L' ? 5.3 : 5.2; me.userData.keep = true; me.frustumCulled = false; G.add(me); });
  window.__EDGEB = (k) => { G.visible = k > 0; return k; };
  return 'EDGEB ' + RS.length + ' ribbons ' + nt + ' tris';
})()
