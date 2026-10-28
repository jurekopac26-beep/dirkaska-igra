(() => {
  // (pictures only) grass under the removed path stub by the SW bowl (the ground had a hole there) (19. 10.); window.__FILLER(0/1)
  if (window.__FILLROOT) Render.scene.remove(window.__FILLROOT);
  const TX = Tex.all(), X0 = -138, X1 = -125, Z0 = 56, Z1 = 69, S = 0.5, NX = Math.round((X1 - X0) / S) + 1, NZ = Math.round((Z1 - Z0) / S) + 1;
  const terr = [], stub = []; Render.scene.updateMatrixWorld(true);
  Render.scene.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.geometry || !o.geometry.attributes.position) return; const nv = o.geometry.attributes.position.count, m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (nv === 8554 && m.map && TX.grass && m.map.image === TX.grass.image) terr.push(o); if (nv === 1036) stub.push(o); });
  const rc = new THREE.Raycaster(), DN = new THREE.Vector3(0, -1, 0), O = new THREE.Vector3();
  const hitY = (arr, x, z) => { O.set(x, 30, z); rc.set(O, DN); const h = rc.intersectObjects(arr, false); return h.length ? h[0].point.y : null; };
  const Y = new Float32Array(NX * NZ), ok = new Uint8Array(NX * NZ); let nh = 0, nt = 0, ns = 0;
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const x = X0 + i * S, z = Z0 + j * S, k = j * NX + i, t = hitY(terr, x, z);
    if (t !== null) { Y[k] = t - 0.06; ok[k] = 1; nt++; continue; } const s = hitY(stub, x, z); if (s !== null) { Y[k] = s - 0.03; ok[k] = 1; ns++; continue; } nh++; }
  for (let it = 0; it < 40; it++) { let left = 0; for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const k = j * NX + i; if (ok[k]) continue; let s = 0, c = 0;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= NX || b >= NZ) continue; const q = b * NX + a; if (ok[q] === 1) { s += Y[q]; c++; } }
    if (c) { Y[k] = s / c; ok[k] = 2; } else left++; } for (let k = 0; k < ok.length; k++) if (ok[k] === 2) ok[k] = 1; if (!left) break; }
  const pos = [], uv = [], col = [], idx = [];
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const x = X0 + i * S, z = Z0 + j * S; pos.push(x, Y[j * NX + i], z); uv.push(x / 14, -z / 14); col.push(0.8, 0.87, 1.27); }
  for (let j = 0; j < NZ - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  let sy = 0; const N = g.attributes.normal; for (let i = 0; i < N.count; i++) sy += N.getY(i); if (sy < 0) { for (let i = 0; i < idx.length; i += 3) { const q = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = q; } g.setIndex(idx); g.computeVertexNormals(); }
  const me = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: TX.grass, vertexColors: true })); me.receiveShadow = true;
  const G = new THREE.Group(); G.name = 'filler'; G.add(me); Render.scene.add(G); window.__FILLROOT = G; window.__FILLER = (on) => { G.visible = !!on; };
  return 'FILLER terr ' + nt + ' stub ' + ns + ' hole ' + nh + ' terrMeshes ' + terr.length; })()
