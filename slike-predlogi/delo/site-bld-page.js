(() => {
  // (pictures only, a question to the user) "Stavba na gradbišču naj bo na zemlji visoki toliko kot je cesta": the site's floor there is 5 m under the road on
  // its embankment. window.__SITEBLD(1): the building (and the crane beside it) on an earth platform as high as the road (5.4 m), sloped sides, a concrete
  // wall to the fence, a ramp down to the east for the trucks; what stood where the platform is lifted onto it or hidden. window.__SITEBLD(0): as before.
  const R = window.__SITEROOT, H = window.__H3; if (!R) return 'no site'; const gnd = (x, z) => { try { return H.ground(x, z); } catch (e) { return 0; } };
  const TOPY = 5.4, X0 = -308, X1 = -280, Z0 = 296, Z1 = 314, RUN = 8.6;
  if (!window.__SITEBLDS) { const st = { moved: [], hid: [], adds: new THREE.Group() }; R.add(st.adds); st.adds.visible = false;
    const inTop = (x, z) => x > X0 - 0.5 && x < X1 + 0.5 && z > Z0 - 0.5 && z < Z1 + 0.5, inFoot = (x, z) => x > X0 - RUN && x < X1 + RUN && z > Z0 - RUN && z < Z1 + 3;
    for (const o of R.children) { if (o === st.adds) continue; const p = o.position; if (Math.hypot(p.x, p.z) < 1) continue; if (inTop(p.x, p.z)) st.moved.push([o, p.y]); else if (inFoot(p.x, p.z)) st.hid.push(o); }
    const EM = new THREE.MeshLambertMaterial({ color: 0xffffff, map: (() => { const t = Tex.all().makadam.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })(), vertexColors: true });
    const pos = [], uv = [], col = [], idx = []; const V = (x, y, z, sh) => { pos.push(x, y, z); uv.push((x + z) / 7, y / 7 + z / 7); col.push(0.86 * sh, 0.66 * sh, 0.5 * sh); return pos.length / 3 - 1; };
    const quad = (a, b, c, d) => idx.push(a, b, c, a, c, d);
    // the top, the north, west and east slopes (the east one the ramp's way down beside it), down to the site's floor
    const t = [V(X0, TOPY, Z0, 0.92), V(X1, TOPY, Z0, 0.92), V(X1, TOPY, Z1, 0.92), V(X0, TOPY, Z1, 0.92)]; quad(t[0], t[3], t[2], t[1]);
    const n0 = V(X0 - RUN, gnd(X0 - RUN, Z0 - RUN) + 0.05, Z0 - RUN, 0.8), n1 = V(X1 + RUN, gnd(X1 + RUN, Z0 - RUN) + 0.05, Z0 - RUN, 0.8), t0 = V(X0, TOPY, Z0, 0.84), t1 = V(X1, TOPY, Z0, 0.84); quad(n0, t0, t1, n1);
    const w0 = V(X0 - RUN, gnd(X0 - RUN, Z1) + 0.05, Z1, 0.74), w1 = V(X0 - RUN, gnd(X0 - RUN, Z0 - RUN) + 0.05, Z0 - RUN, 0.74), wt0 = V(X0, TOPY, Z1, 0.78), wt1 = V(X0, TOPY, Z0, 0.78); quad(w0, wt0, wt1, w1);
    const e0 = V(X1 + RUN, gnd(X1 + RUN, Z0 - RUN) + 0.05, Z0 - RUN, 0.9), e1 = V(X1 + RUN, gnd(X1 + RUN, Z1) + 0.05, Z1, 0.9), et0 = V(X1, TOPY, Z0, 0.95), et1 = V(X1, TOPY, Z1, 0.95); quad(e0, et0, et1, e1);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, EM); m.material.side = THREE.DoubleSide; m.castShadow = true; m.receiveShadow = true; st.adds.add(m);
    // the wall to the fence (concrete) and the ramp down to the east (packed gravel, 7 m wide, from the platform's east edge to the floor 30 m away)
    const wall = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0 + 2 * RUN, TOPY + 0.4, 0.5), new THREE.MeshLambertMaterial({ color: 0x9a968e })); wall.position.set((X0 + X1) / 2, TOPY / 2 - 0.1, Z1 + 0.2); wall.castShadow = wall.receiveShadow = true; st.adds.add(wall);
    { const rp = [], ri = [], ru = []; const zA = 299, zB = 306, xA = X1, xB = X1 + 32; for (const [x, y] of [[xA, TOPY + 0.03], [xB, gnd(xB, 302) + 0.08]]) for (const z of [zA, zB]) { rp.push(x, y, z); ru.push(x / 6, z / 6); } ri.push(0, 1, 3, 0, 3, 2);
      const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(ru, 2)); rg.setIndex(ri); rg.computeVertexNormals(); if (rg.attributes.normal.getY(0) < 0) { rg.setIndex([0, 3, 1, 0, 2, 3]); rg.computeVertexNormals(); }
      const rm = new THREE.Mesh(rg, new THREE.MeshLambertMaterial({ color: 0xe6d2b2, map: EM.map, side: THREE.DoubleSide })); rm.receiveShadow = true; st.adds.add(rm);
      for (const z of [zA - 0.3, zB + 0.3]) { const c = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(32, TOPY), 0.35, 0.3), new THREE.MeshLambertMaterial({ color: 0xff8a1f })); c.position.set((xA + xB) / 2, TOPY / 2 + 0.3, z); c.rotation.z = -Math.atan2(TOPY, 32); st.adds.add(c); } }
    window.__SITEBLDS = st; }
  const st = window.__SITEBLDS;
  window.__SITEBLD = (k) => { st.adds.visible = k === 1; for (const [o, y] of st.moved) o.position.y = k === 1 ? TOPY : y; for (const o of st.hid) o.visible = k !== 1; R.updateMatrixWorld(true); return k + ' moved ' + st.moved.length + ' hid ' + st.hid.length; };
  return window.__SITEBLD(0);
})()
