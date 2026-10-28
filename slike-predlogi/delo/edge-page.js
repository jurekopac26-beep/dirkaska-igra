(() => {
  // (pictures only) where the sky still showed through (the map's south edge beyond the fence, the south-east corner past the sea, a slot at the
  // snow hill's west edge, two small triangles): flat patches in the grass colour round them, just under the ground (the ground stays on top)
  if (window.__EDGEROOT) Render.scene.remove(window.__EDGEROOT);
  const sc = Render.scene, G = new THREE.Group(); G.name = 'edge'; G.userData.keep = true; sc.add(G); window.__EDGEROOT = G; const gnd = (x, z) => __H3.ground(x, z);
  const TXG = Tex.all().grass, TM = (() => { try { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'); g.drawImage(TXG.image, 0, 0, 64, 64); const d = g.getImageData(0, 0, 64, 64).data, s = [0, 0, 0]; for (let i = 0; i < d.length; i += 4) { s[0] += d[i]; s[1] += d[i + 1]; s[2] += d[i + 2]; } return s.map(v => v / (d.length / 4) / 255); } catch (e) { return [1, 1, 1]; } })();
  const P = [ // [x0, z0, x1, z1, colour (as it shows), y: 'g' = 6 cm under the ground there, or a fixed height]
    [-385, 323, 385, 350, [93, 136, 78], -0.15], [343, 285, 385, 350, [93, 136, 78], -0.15],
    [-253.5, -106, -246.5, -83, [96, 146, 74], 'g'], [-351.5, -60, -347.5, -56, [76, 120, 64], 'g'], [-26, -168, -15, -149, [96, 144, 82], 'g']];
  for (const [x0, z0, x1, z1, c, y] of P) { const S = 1, nx = Math.ceil((x1 - x0) / S), nz = Math.ceil((z1 - z0) / S), pos = [], idx = [];
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const x = x0 + i * S, z = z0 + j * S; pos.push(x, y === 'g' ? gnd(x, z) - 0.06 : y, z); }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i; idx.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    // the meadow's look (its grass texture, its mown stripes in step with the terrain's), not a flat colour
    const uvs = [], cols = []; for (let q = 0; q < pos.length; q += 3) { const x = pos[q], z = pos[q + 2], s = 1 + 0.09 * Math.tanh(2.5 * Math.cos(2 * Math.PI * (z - 3.0) / 11.0)) / Math.tanh(2.5); uvs.push(x / 14, -z / 14); cols.push(c[0] / 255 / TM[0] * s, c[1] / 255 / TM[1] * s, c[2] / 255 / TM[2] * s); }
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const m = new THREE.MeshBasicMaterial({ map: TXG, vertexColors: true, fog: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
    const me = new THREE.Mesh(g, m); me.renderOrder = -1; me.frustumCulled = false; me.userData.keep = true; G.add(me); }
  window.__EDGE18 = (k) => { G.visible = k > 0; return k; };
  return 'EDGE ' + P.length;
})()
