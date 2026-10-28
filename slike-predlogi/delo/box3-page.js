(() => {
  // (pictures only) the user on the motocross box (G): "boks naj bo bližje cesti, da lahko iz ceste zapelješ direkt v boks, brez da bi povozil pesek".
  // The box turned round (its open side faced the motocross; now it faces the ring road), its edge on the road's edge, its gravel lanes gone, a short
  // asphalt drive from the road into it (the road's own material and colour). window.__BOX3(1) / 0
  const sc = Render.scene, H = window.__H3, out = {}, matOf = (o) => Array.isArray(o.material) ? o.material[0] : o.material; sc.updateMatrixWorld(true);
  if (window.__BOX3) window.__BOX3(0); if (window.__BOX3ROOT) sc.remove(window.__BOX3ROOT); const ROOT = new THREE.Group(); ROOT.userData.keep = true; sc.add(ROOT); window.__BOX3ROOT = ROOT;
  let G = null; sc.children.forEach(gr => { if (G || gr.type !== 'Group' || !gr.visible || !gr.userData.keep || gr.children.length < 8 || gr.children.length > 30) return; let orange = 0; gr.traverse(o => { if (o.isMesh && matOf(o) && matOf(o).color && matOf(o).color.getHex() === 0xff6a1a) orange++; }); if (!orange) return; const b = new THREE.Box3().setFromObject(gr); if (b.min.x > -300 || b.max.x < -330 || b.min.z > -255 || b.max.z < -285) return; G = gr; });
  if (!G) return 'no box';
  const kids = G.children.filter(o => { const b = new THREE.Box3().setFromObject(o); if (b.isEmpty()) return false; const c = b.getCenter(new THREE.Vector3()); return b.max.x - b.min.x < 36 && b.max.z - b.min.z < 40 && c.x > -335 && c.x < -288 && c.z > -292 && c.z < -248; });
  const BB = (o) => new THREE.Box3().setFromObject(o);
  let main = null, hmax = 0; kids.forEach(o => { const b = BB(o), m = matOf(o); if (m && !m.transparent && b.max.y - b.min.y > hmax) { hmax = b.max.y - b.min.y; main = o; } }); if (!main) return 'no main';
  const lintel = kids.find(o => { const b = BB(o), m = matOf(o); return m && !m.transparent && b.min.y > 4 && b.max.x - b.min.x < 4; });
  const bm = BB(main), cx = (bm.min.x + bm.max.x) / 2, cz = (bm.min.z + bm.max.z) / 2; out.main = [bm.min.x, bm.max.x, bm.min.z, bm.max.z].map(v => +v.toFixed(1)); out.lintel = lintel ? [BB(lintel).min.x, BB(lintel).max.x].map(v => +v.toFixed(1)) : null;
  const p0 = kids.map(o => o.position.clone()), q0 = kids.map(o => o.quaternion.clone()), vis0 = kids.map(o => o.visible);
  // the gravel lanes: flat see-through kids (not the box's orange floor marking)
  const lane = kids.map(o => { const b = BB(o), m = matOf(o); return !!(m && m.transparent && b.max.y - b.min.y < 0.6 && !(m.color && m.color.getHex() === 0xff6a1a)); }); out.lanes = lane.filter(Boolean).length;
  // the ring road's west edge at z (by the box)
  const NP = H.roads.nord.P2, hw = H.roads.nord.wd / 2;
  const edgeX = (z) => { let b = -1, bd = 1e9; for (let i = 1; i < NP.length - 1; i++) { const p = NP[i]; if (p.x > -280 || p.x < -310) continue; const d = Math.abs(p.z - z); if (d < bd) { bd = d; b = i; } } const p = NP[b], a = NP[b - 1], c = NP[b + 1], tx = c.x - a.x, tz = c.z - a.z, l = Math.hypot(tx, tz) || 1; let nx = -tz / l; if (nx > 0) nx = -nx; return p.x + nx * hw; };
  const qPi = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
  let dx2 = 0, zo = [cz - 4.5, cz + 4.5];
  const apply = (on) => { kids.forEach((o, i) => { o.position.copy(p0[i]); o.quaternion.copy(q0[i]); o.visible = vis0[i]; if (on) { o.position.set(2 * cx - p0[i].x + dx2, p0[i].y, 2 * cz - p0[i].z); o.quaternion.premultiply(qPi); if (lane[i]) o.visible = false; } o.updateMatrixWorld(true); }); };
  // turn, then the shift that puts its (new) east edge 0.15 m inside the road's edge, all along it
  apply(true); { const b = BB(main); let em = 1e9; for (let z = b.min.z; z <= b.max.z; z += 1) em = Math.min(em, edgeX(z)); dx2 = em - 0.15 - b.max.x; apply(true); const b2 = BB(main); out.after = [b2.min.x, b2.max.x, b2.min.z, b2.max.z].map(v => +v.toFixed(1)); out.dx2 = +dx2.toFixed(2); out.edge = +em.toFixed(1);
    if (lintel) { const bl = BB(lintel); zo = [bl.min.z, bl.max.z]; out.opening = [bl.min.x, bl.max.x, bl.min.z, bl.max.z].map(v => +v.toFixed(1)); } }
  // the drive: asphalt from 1.2 m inside the box to 0.5 m onto the road, the opening's width and 1 m more each side
  { let road = null; sc.traverse(o => { if (!road && o.isMesh && o.geometry && o.geometry.attributes.position && o.geometry.attributes.position.count === 34800) road = o; }); out.road = !!road;
    let col = [0.45, 0.45, 0.47]; if (road) { const P = road.geometry.attributes.position, C = road.geometry.attributes.color, V = new THREE.Vector3(); let s = [0, 0, 0], n = 0; for (let i = 0; i < P.count; i++) { V.fromBufferAttribute(P, i).applyMatrix4(road.matrixWorld); if (Math.abs(V.z - (zo[0] + zo[1]) / 2) > 8 || V.x < -300 || V.x > -284) continue; if (C) { s[0] += C.getX(i); s[1] += C.getY(i); s[2] += C.getZ(i); } n++; } if (n && C) col = s.map(v => v / n); out.roadCol = [n, col.map(v => +v.toFixed(2))]; }
    const rc = new THREE.Raycaster(), skip = new Set(kids), surf = (x, z) => { rc.set(new THREE.Vector3(x, 40, z), new THREE.Vector3(0, -1, 0)); rc.far = 80; const h = rc.intersectObjects(sc.children, true).find(q => { if (q.object === road) return true; let p = q.object; while (p) { if (!p.visible || skip.has(p) || p === ROOT) return false; p = p.parent; } const m = matOf(q.object); return m && !m.transparent && q.face && q.face.normal.y > 0.5; }); return h ? h.point.y : H.ground(x, z); };
    const z0 = zo[0] - 1, z1 = zo[1] + 1, NZ = Math.ceil((z1 - z0) / 0.5), pos = [], cl = [], uv = [], idx = [], NX = 6;
    for (let j = 0; j <= NZ; j++) { const z = z0 + (z1 - z0) * j / NZ, xa = edgeX(z) - 0.15 - 1.2 - 0.15, xb = edgeX(z) + 0.5; for (let i = 0; i <= NX; i++) { const x = xa + (xb - xa) * i / NX, edgeSoft = Math.min(1, Math.min(j, NZ - j) / 1.5); pos.push(x, surf(x, z) + 0.035, z); cl.push(col[0], col[1], col[2], i === NX ? 0 : edgeSoft); uv.push(x / 8, z / 8); } }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 4)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); if (g.attributes.normal.getY(0) < 0) { const I = g.index; for (let t = 0; t < I.count; t += 3) { const q = I.getX(t + 1); I.setX(t + 1, I.getX(t + 2)); I.setX(t + 2, q); } g.computeVertexNormals(); }
    const m = road ? matOf(road).clone() : new THREE.MeshLambertMaterial({ color: 0xffffff }); Object.assign(m, { vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 }); m.needsUpdate = true;
    const me = new THREE.Mesh(g, m); me.receiveShadow = true; me.renderOrder = 2.7; ROOT.add(me); out.drive = [NZ, +z0.toFixed(1), +z1.toFixed(1)]; }
  window.__BOX3 = (k) => { const on = k > 0; apply(on); ROOT.visible = on; return k; };
  window.__BOX3(1); return JSON.stringify(out); })()
