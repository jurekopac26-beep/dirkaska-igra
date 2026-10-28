(() => {
  // (pictures only) the user crossed out a spot on the ring road (map picture 2/10, west): "Tam kjer je prekrižan zbriši pesek iz ceste". The sand there
  // is the gravel band the map lays across the asphalt where a dirt way crosses it (newmap.js crossBand: the way's two ends either side, paired);
  // the way's west half is gone since (the motocross hairpin is there now), so the band lies on the road for nothing. It is taken off the road
  // between the motocross junction (north) and the gravel way's mouth on the east side (south), with a soft end each way; the mouth's own sand stays.
  const sc = Render.scene, out = { a: 0, t: 0 }; sc.updateMatrixWorld(true);
  const sst = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const X0 = -293, X1 = -267, Z0 = -222;
  // how much of the sand stays at (x, z): 0 on the road between the junction and the way's mouth, 1 elsewhere (soft over 3-4 m north and south,
  // 1.5 m east and west). The mouth's fan stays on the road's east half only: on its west half the band goes on south to -185
  const cAt = (z) => -280.5 + (z + 208) * 3.5 / 18, endS = (x, z) => { const lat = x - cAt(z); return -196 + 11 * (1 - sst(-1.5, 1.5, lat)); };
  const keep = (x, z) => { const e = endS(x, z); return 1 - sst(Z0 - 3, Z0 + 1, z) * (1 - sst(e - 4, e + 0.5, z)) * sst(X0 - 1.5, X0, x) * (1 - sst(X1, X1 + 1.5, x)); };
  // the circuit's white edge line where it is missing: its offset and width measured on the line's own pieces nearby (white flat meshes along the
  // circuit's edge), then a strip laid at that offset along the circuit's points between two distances along it, on the asphalt (found by a ray down)
  const edgeLine = (x0, x1, z0, z1, sideRef, out, tag, road) => { const T = road || __game.race.track, N = T.px.length, sc = Render.scene, rc = new THREE.Raycaster(); let side = 1; const CL = T.closed !== false;
    const near = []; for (let i = 0; i < N; i++) if (T.px[i] > x0 - 10 && T.px[i] < x1 + 10 && T.pz[i] > z0 - 10 && T.pz[i] < z1 + 10) near.push(i); if (near.length < 2) { out[tag] = 'no track'; return; }
    const nrmAt = (i) => { const a = CL ? (i - 1 + N) % N : Math.max(0, i - 1), c = CL ? (i + 1) % N : Math.min(N - 1, i + 1), tx = T.px[c] - T.px[a], tz = T.pz[c] - T.pz[a], l = Math.hypot(tx, tz) || 1; return [-tz / l, tx / l]; };
    // the signed offset of a point from the circuit's centre (nearest segment)
    const offOf = (x, z) => { let bd = 1e9, bo = 0; for (const i of near) { if (!CL && i === N - 1) continue; const c = (i + 1) % N, ax = T.px[i], az = T.pz[i], dx = T.px[c] - ax, dz = T.pz[c] - az, L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2)), px = ax + dx * t, pz = az + dz * t, d = Math.hypot(x - px, z - pz); if (d < bd) { bd = d; const [nx, nz] = nrmAt(i); bo = (x - px) * nx + (z - pz) * nz; } } return bo; };
    side = Array.isArray(sideRef) ? Math.sign(offOf(sideRef[0], sideRef[1])) || 1 : sideRef;
    const offs = []; sc.updateMatrixWorld(true); sc.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.visible) return; const m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m || !m.color || m.map || !m.isMeshBasicMaterial || m.vertexColors) return; const c = m.color; if (c.r < 0.9 || c.g < 0.9 || c.b < 0.88) return; const P = o.geometry.attributes.position, e = o.matrixWorld.elements;
      for (let i = 0; i < P.count; i++) { const x = P.getX(i) * e[0] + P.getY(i) * e[4] + P.getZ(i) * e[8] + e[12], z = P.getX(i) * e[2] + P.getY(i) * e[6] + P.getZ(i) * e[10] + e[14]; if (x < x0 - 8 || x > x1 + 8 || z < z0 - 8 || z > z1 + 8) continue; const f = offOf(x, z); if (Math.sign(f) === side && Math.abs(f) > T.w - 1.5 && Math.abs(f) < T.w + 0.5) offs.push(Math.abs(f)); } });
    offs.sort((a, b) => a - b); const o0 = offs.length > 4 ? offs[Math.floor(offs.length * 0.05)] : T.w - 0.55, o1 = offs.length > 4 ? offs[Math.floor(offs.length * 0.95)] : T.w - 0.33; out[tag] = [side, offs.length, +o0.toFixed(2), +o1.toFixed(2)];
    // the strip, every 0.5 m along the circuit inside the box
    const ids = near.slice().sort((a, b) => a - b), pos = [], idx = []; let prev = null;
    const yAt = (x, z) => { rc.set(new THREE.Vector3(x, 30, z), new THREE.Vector3(0, -1, 0)); rc.far = 40; const h = rc.intersectObjects(sc.children, true).find(q => { let p = q.object; while (p) { if (!p.visible) return false; p = p.parent; } const m = Array.isArray(q.object.material) ? q.object.material[0] : q.object.material; return m && !m.transparent && q.face && q.face.normal.y > 0.5; }); return h ? h.point.y : 0; };
    for (let k = 0; k < ids.length - 1; k++) { const i = ids[k], c = ids[k + 1]; if (c !== i + 1) continue; const L = Math.hypot(T.px[c] - T.px[i], T.pz[c] - T.pz[i]), n = Math.max(1, Math.ceil(L / 0.5)); const [n0x, n0z] = nrmAt(i), [n1x, n1z] = nrmAt(c);
      for (let s = 0; s < n; s++) { const u = s / n, cx = T.px[i] + (T.px[c] - T.px[i]) * u, cz = T.pz[i] + (T.pz[c] - T.pz[i]) * u, nx = n0x + (n1x - n0x) * u, nz = n0z + (n1z - n0z) * u, l = Math.hypot(nx, nz), ux = nx / l * side, uz = nz / l * side;
        const xa = cx + ux * o0, za = cz + uz * o0, xb = cx + ux * o1, zb = cz + uz * o1; if (xa < x0 || xa > x1 || za < z0 || za > z1) { prev = null; continue; }
        const q = pos.length / 3; pos.push(xa, yAt(xa, za) + 0.02, za, xb, yAt(xb, zb) + 0.02, zb); if (prev !== null) idx.push(prev, prev + 1, q, prev + 1, q + 1, q); prev = q; } }
    if (!idx.length) return null; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); const me = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xf4f4f0, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 })); me.renderOrder = 4; me.userData.keep = true; sc.add(me); return me; };

  const roots = []; sc.children.forEach(c => { if (c.name === 'nv-baked') roots.push(c); });
  for (const R of roots) R.traverse(o => { if (!o.isMesh || o.isInstancedMesh) return; const m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m || !m.transparent) return;
    const g = o.geometry, P = g.attributes.position, C = g.attributes.color; if (!P) return; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld);
    if (bb.max.x < X0 - 2 || bb.min.x > X1 + 2 || bb.max.z < Z0 - 4 || bb.min.z > -182) return;
    const e = o.matrixWorld.elements, W = (i) => [P.getX(i) * e[0] + P.getY(i) * e[4] + P.getZ(i) * e[8] + e[12], P.getX(i) * e[2] + P.getY(i) * e[6] + P.getZ(i) * e[10] + e[14]];
    if (C && C.itemSize === 4) { let hit = false; for (let i = 0; i < P.count; i++) { const [x, z] = W(i), k = keep(x, z); if (k < 0.999) { C.setW(i, C.getW(i) * k); hit = true; out.a++; } } if (hit) C.needsUpdate = true; }
    else { const I = g.index; if (!I) return; let hit = false; for (let t = 0; t < I.count; t += 3) { const a = I.getX(t), b = I.getX(t + 1), c = I.getX(t + 2), A = W(a), B2 = W(b), Cc = W(c), cx = (A[0] + B2[0] + Cc[0]) / 3, cz = (A[1] + B2[1] + Cc[1]) / 3; if (keep(cx, cz) < 0.5) { I.setX(t + 1, a); I.setX(t + 2, a); hit = true; out.t++; } } if (hit) I.needsUpdate = true; } });
  // the circuit's white line on its west edge, where the band had cut it
  { const H = window.__H3, NR = H.roads.nord, NP = NR.P2; edgeLine(-292, -282, -214, -186, [-291, -200], out, 'line', { px: NP.map(p => p.x), pz: NP.map(p => p.z), w: NR.wd / 2, closed: false }); }
  return JSON.stringify(out); })()
