(() => {
  // (pictures only) where the stage and its pad stood (x 54.5..86.5, z -59..-51) the park's grass layer (gr18) had a hole - the bare lighter ground
  // showed as a band: a patch of the same grass layer laid over it (its material, its world texture mapping x/14, -z/14, colour and height read off
  // the grass round it, edges eased out over 1 m); and the grass decal round the two removed trees on the beach (x 102..112, z -79..-68) cleared ;
  // window.__STGR(0/1)
  if (window.__STGRROOT) Render.scene.remove(window.__STGRROOT);
  const G = new THREE.Group(); G.name = 'stagegrass'; Render.scene.add(G); window.__STGRROOT = G;
  const src = []; let M = null;
  Render.scene.traverse(o => { if (!o.isMesh || !o.parent || o.parent.name !== 'gr18') return; const P = o.geometry.attributes.position, C = o.geometry.attributes.color;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i); if (x > 46 && x < 95 && z > -67 && z < -43 && C.getW(i) > 0.6) { src.push([x, P.getY(i), z, C.getX(i), C.getY(i), C.getZ(i)]); if (!M) M = o.material; } } });
  if (!M) return 'STGR no grass';
  const X0 = 52.5, X1 = 88.5, Z0 = -61.5, Z1 = -48.5, S = 0.5, nx = Math.round((X1 - X0) / S), nz = Math.round((Z1 - Z0) / S);
  const pos = [], col = [], uv = [], nor = [], idx = [];
  // (not over the park path west of the stage: Park lane 1, half width 3.25; the patch eases in from its edge)
  const PL = [[40.1, -33.1], [43.3, -40.4], [46.9, -47.6], [51.4, -55.2], [55.5, -63], [58.6, -71], [61.1, -79.1]];
  const dPath = (x, z) => { let m = 1e9; for (let k = 0; k + 1 < PL.length; k++) { const ax = PL[k][0], az = PL[k][1], bx = PL[k + 1][0] - ax, bz = PL[k + 1][1] - az; const t = Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz))); m = Math.min(m, Math.hypot(x - ax - t * bx, z - az - t * bz)); } return m; };
  const inner = (x, z) => Math.max(54.3 - x, x - 86.7, -59.3 - z, z + 50.7);      // (signed distance-like: <= 0 inside the hole)
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const x = X0 + i * S, z = Z0 + j * S; let sw = 0, sy = 0, sr = 0, sg = 0, sb = 0;
    for (const p of src) { const d2 = (p[0] - x) ** 2 + (p[2] - z) ** 2; if (d2 > 49) continue; const w = 1 / (d2 + 0.5); sw += w; sy += w * p[1]; sr += w * p[3]; sg += w * p[4]; sb += w * p[5]; }
    if (!sw) { sw = 1; sy = 0.34; sr = 0.77; sg = 0.84; sb = 1.2; }
    const e = inner(x, z), dp = dPath(x, z) - 3.25, a = (e <= 0.4 ? 1 : Math.max(0, 1 - (e - 0.4) / 1.2)) * Math.max(0, Math.min(1, (dp + 0.1) / 0.7));
    pos.push(x, sy / sw + 0.004, z); col.push(sr / sw, sg / sw, sb / sw, a); uv.push(x / 14, -z / 14); nor.push(0, 1, 0); }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  const me = new THREE.Mesh(g, M); me.renderOrder = 3.5; me.receiveShadow = true; G.add(me);
  // the grass decal round the removed beach trees
  let cleared = 0; Render.scene.traverse(o => { if (!o.isMesh || !o.parent || o.parent.name !== 'gr18') return; const P = o.geometry.attributes.position, C = o.geometry.attributes.color; let ch = 0;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i); if (x > 101.5 && x < 112.5 && z > -79.5 && z < -67.5 && C.getW(i) > 0) { if (!o.userData.__stgA) o.userData.__stgA = []; o.userData.__stgA.push([i, C.getW(i)]); C.setW(i, 0); ch++; } }
    if (ch) { C.needsUpdate = true; cleared += ch; } });
  window.__STGR = (on) => { G.visible = !!on; };
  return 'STGR patch verts ' + pos.length / 3 + ' src ' + src.length + ' beach grass verts cleared ' + cleared; })()
