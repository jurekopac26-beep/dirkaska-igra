(() => {
  // (pictures only) two sets for the new construction site (bottom left):
  // 1. the iron palisade the user chose, three versions (window.__SPAL(k), k 0..2; -1 the orange mesh panels as now) on the places of the site's fence
  //    panels (the gaps for its gates kept): built from the panels' own segments
  // 2. "E1, ampak v barvah proge enduro, 3 verzije": the site's earth in the colours of the enduro (motocross) track: its texture and colour (window.__SEARTH(k),
  //    k 0..2; -1 as now): 0 as the track, 1 lighter and dustier, 2 darker with dark ruts along the haul roads
  const R = window.__SITEROOT, sc = Render.scene, H = window.__H3, out = {}; if (!R) return 'no site'; sc.updateMatrixWorld(true);
  const gy = (x, z) => { try { return H.ground(x, z); } catch (e) { return 0; } }, Y = new THREE.Vector3(0, 1, 0);
  // ---- the fence's segments: the orange mesh panels' quads (bottom two corners of each)
  let FM = null; R.traverse(o => { if (o.isMesh && o.material && o.material.map && o.material.alphaTest > 0.3 && o.material.map.image && o.material.map.image.width === 64 && o.material.map.image.height === 32) FM = o; });
  if (!FM) return 'no fence mesh'; const P = FM.geometry.attributes.position, F = [];
  for (let q = 0; q + 3 < P.count; q += 4) { const x1 = P.getX(q), z1 = P.getZ(q), x2 = P.getX(q + 1), z2 = P.getZ(q + 1), l = Math.hypot(x2 - x1, z2 - z1); if (l < 0.1) continue; F.push([(x1 + x2) / 2, (z1 + z2) / 2, -Math.atan2(z2 - z1, x2 - x1), l / 3.5]); }
  out.panels = F.length;
  if (window.__SPALG) for (const G of window.__SPALG) G.parent && G.parent.remove(G);
  const tex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'); draw(c, w, h); const t = new THREE.CanvasTexture(cv); t.anisotropy = 8; return t; };
  const PM = (c, o = {}) => new THREE.MeshPhongMaterial(Object.assign({ color: c, shininess: 40, specular: 0x333333 }, o));
  const inst = (geo, mat, list, shadow = true, dm) => { const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length)), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(); list.forEach(([x, y, z, ry, sx = 1, sy = 1, sz = 1], k) => { q.setFromAxisAngle(Y, ry); m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz)); im.setMatrixAt(k, m4); }); im.count = list.length; im.castShadow = shadow; im.receiveShadow = true; if (dm) im.customDepthMaterial = dm; return im; };
  const ends = ([x, z, ry, sx], s, r = 1.75) => [x + Math.cos(-ry) * s * r * sx, z + Math.sin(-ry) * s * r * sx];
  const panels = (G, t, h, lift) => { const m = new THREE.MeshPhongMaterial({ map: t, transparent: true, alphaTest: 0.45, side: THREE.DoubleSide, shininess: 50, specular: 0x444444 }), dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: 0.45 });
    G.add(inst(new THREE.PlaneGeometry(3.5, h), m, F.map(f => [f[0], gy(f[0], f[1]) + lift + h / 2, f[1], f[2], f[3]]), true, dm)); };
  const posts = (G, geo, mat, y, every = 1, off = 0) => { const L2 = []; F.forEach((f, k) => { if ((k + off) % every) return; for (const s of [-1, 1]) { if (s > 0 && (k + off) % every) continue; const [x, z] = ends(f, s); L2.push([x, gy(x, z) + y, z, f[2]]); } }); G.add(inst(geo, mat, L2)); };
  const bar = (c, x, y0, y1, w, base, hi) => { const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, base); g.addColorStop(0.35, hi); g.addColorStop(0.6, base); g.addColorStop(1, '#0a0b0c'); c.fillStyle = g; c.fillRect(x, y0, w, y1 - y0); };
  const rail = (c, y, h, w, base, hi) => { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, hi); g.addColorStop(0.5, base); g.addColorStop(1, '#0a0b0c'); c.fillStyle = g; c.fillRect(0, y, w, h); };
  const V = [];
  { const G = new THREE.Group(), t = tex(512, 336, (c, w, h) => { c.clearRect(0, 0, w, h); for (let i = 6; i < w - 4; i += 21) { bar(c, i, 22, h, 7, '#1b1e21', '#5a6066'); c.fillStyle = '#1b1e21'; c.beginPath(); c.moveTo(i + 3.5, 1); c.quadraticCurveTo(i + 11, 14, i + 3.5, 26); c.quadraticCurveTo(i - 4, 14, i + 3.5, 1); c.fill(); c.fillStyle = '#4c5258'; c.fillRect(i + 2.5, 6, 1.5, 12); }
      rail(c, 38, 9, w, '#1b1e21', '#4c5258'); rail(c, h - 44, 9, w, '#1b1e21', '#4c5258'); rail(c, h - 14, 7, w, '#1b1e21', '#4c5258'); });
    panels(G, t, 2.3, 0.04); posts(G, new THREE.BoxGeometry(0.14, 2.42, 0.14), PM(0x1b1e21), 1.21); posts(G, new THREE.SphereGeometry(0.12, 12, 8), PM(0x1b1e21, { shininess: 80 }), 2.5); V.push(G); }
  { const G = new THREE.Group(), t = tex(512, 366, (c, w, h) => { c.clearRect(0, 0, w, h); for (let i = 3; i < w - 6; i += 17) { const g = c.createLinearGradient(i, 0, i + 13, 0); g.addColorStop(0, '#163222'); g.addColorStop(0.2, '#3f6e50'); g.addColorStop(0.5, '#24472f'); g.addColorStop(0.8, '#3f6e50'); g.addColorStop(1, '#10241a'); c.fillStyle = g; c.fillRect(i, 16, 13, h - 16);
        c.fillStyle = '#24472f'; c.beginPath(); c.moveTo(i, 18); c.lineTo(i + 1.5, 2); c.lineTo(i + 4.3, 12); c.lineTo(i + 6.5, 0); c.lineTo(i + 8.7, 12); c.lineTo(i + 11.5, 2); c.lineTo(i + 13, 18); c.closePath(); c.fill(); }
      rail(c, 46, 11, w, '#1f3d29', '#4d7a5c'); rail(c, h - 58, 11, w, '#1f3d29', '#4d7a5c'); });
    panels(G, t, 2.5, 0.03); posts(G, new THREE.BoxGeometry(0.16, 2.55, 0.12), PM(0x24472f), 1.27); V.push(G); }
  { const G = new THREE.Group(), t = tex(512, 278, (c, w, h) => { c.clearRect(0, 0, w, h); for (let i = 8; i < w - 6; i += 24) { bar(c, i, 20, h, 7, '#1b1e21', '#5a6066'); const g = c.createLinearGradient(i - 4, 0, i + 11, 0); g.addColorStop(0, '#8a6a1c'); g.addColorStop(0.45, '#f0d27a'); g.addColorStop(1, '#7a5a12'); c.fillStyle = g; c.beginPath(); c.moveTo(i + 3.5, 0); c.lineTo(i + 10, 22); c.lineTo(i - 3, 22); c.closePath(); c.fill(); }
      rail(c, 30, 8, w, '#1b1e21', '#4c5258'); rail(c, 70, 8, w, '#1b1e21', '#4c5258'); c.strokeStyle = '#1b1e21'; c.lineWidth = 4; for (let i = 20; i < w; i += 24) { c.beginPath(); c.arc(i, 54, 10, 0, Math.PI * 2); c.stroke(); } rail(c, h - 10, 8, w, '#1b1e21', '#4c5258'); });
    panels(G, t, 1.9, 0.48); const Lp = F.map(f => [f[0], gy(f[0], f[1]) + 0.24, f[1], f[2], f[3] * 1.005]); G.add(inst(new THREE.BoxGeometry(3.5, 0.5, 0.34), PM(0xb9b4aa, { shininess: 8, specular: 0x111111 }), Lp));
    posts(G, new THREE.BoxGeometry(0.12, 1.95, 0.12), PM(0x1b1e21), 0.48 + 0.97); posts(G, new THREE.BoxGeometry(0.62, 2.7, 0.62), PM(0x9a4a32, { shininess: 6, specular: 0x111111 }), 1.35, 4); posts(G, new THREE.BoxGeometry(0.78, 0.16, 0.78), PM(0xd8d4cc, { shininess: 10 }), 2.78, 4); posts(G, new THREE.SphereGeometry(0.16, 12, 8), PM(0xd8b04a, { shininess: 90, specular: 0x886622 }), 3.0, 4); V.push(G); }
  V.forEach(G => { G.visible = false; G.traverse(o => { o.userData.keep = true; }); R.add(G); }); window.__SPALG = V;
  window.__SPAL = (k) => { V.forEach((G, i) => { G.visible = i === k; }); FM.visible = k < 0; return k; };
  // ---- the earth in the enduro track's colours: its texture (read off the track west of the snowy hill) and colour
  let EM = null, haul = [], mnd = []; R.traverse(o => { if (!o.isMesh) return; if (o.renderOrder === 0.5 && o.material.vertexColors && o.geometry.attributes.color && o.geometry.attributes.color.itemSize === 4) EM = o; if (o.renderOrder === 3 && o.material.map && !o.material.vertexColors) haul.push(o); if (o.material && o.material.vertexColors && o.geometry.attributes.color && o.geometry.attributes.color.itemSize === 3 && o.castShadow && o.geometry.attributes.position.count === 529) mnd.push(o); });
  const rc = new THREE.Raycaster(new THREE.Vector3(-326, 120, -62), new THREE.Vector3(0, -1, 0)); const all = []; sc.traverse(o => { if (o.isMesh && o.visible && !o.isInstancedMesh) all.push(o); }); const th = rc.intersectObjects(all, false)[0];
  const TM = th ? (Array.isArray(th.object.material) ? th.object.material[0] : th.object.material) : null; out.track = TM ? [TM.type, TM.map ? TM.map.uuid.slice(0, 6) : null] : null;
  if (!EM) return JSON.stringify(Object.assign(out, { earth: 'none' }));
  const C = EM.geometry.attributes.color, C0 = C.array.slice(), M0 = { map: EM.material.map }, H0 = haul.map(o => [o, o.material.map, o.material.color.getHex()]), MD0 = mnd.map(o => [o, o.geometry.attributes.color.array.slice()]);
  const TMAP = TM && TM.map ? (() => { const t = TM.map.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })() : M0.map;
  const VER = [{ base: [0.76, 0.68, 0.56], var: 0.12, haul: 0xf2e2c8, rut: null }, { base: [0.88, 0.8, 0.66], var: 0.08, haul: 0xfff4e0, rut: null }, { base: [0.7, 0.6, 0.47], var: 0.16, haul: 0x6a5440, rut: true }];
  window.__SEARTH = (k) => { if (k < 0) { C.array.set(C0); C.needsUpdate = true; EM.material.map = M0.map; EM.material.needsUpdate = true; for (const [o, m, c] of H0) { o.material.map = m; o.material.color.setHex(c); o.material.needsUpdate = true; } for (const [o, a] of MD0) { o.geometry.attributes.color.array.set(a); o.geometry.attributes.color.needsUpdate = true; } return -1; }
    const v = VER[k], P2 = EM.geometry.attributes.position; for (let i = 0; i < C.count; i++) { const x = P2.getX(i), z = P2.getZ(i), n = 0.5 + 0.5 * Math.sin(x * 0.11 + Math.sin(z * 0.06) * 2.2) * Math.sin(z * 0.09 + 1.1), s = 1 - v.var / 2 + v.var * n; C.setXYZ(i, v.base[0] * s, v.base[1] * s, v.base[2] * s); } C.needsUpdate = true;
    EM.material.map = TMAP; EM.material.needsUpdate = true; for (const [o] of H0) { o.material.map = TMAP; o.material.color.setHex(v.haul); o.material.needsUpdate = true; }
    for (const [o, a] of MD0) { const cc = o.geometry.attributes.color; for (let i = 0; i < cc.count; i++) { const s = 0.9 + 0.1 * Math.sin(i * 0.37); cc.setXYZ(i, v.base[0] * s * 0.95, v.base[1] * s * 0.95, v.base[2] * s * 0.95); } cc.needsUpdate = true; } return k; };
  out.earth = [C.count, haul.length, mnd.length];
  window.__SPAL(-1); window.__SEARTH(-1); return JSON.stringify(out);
})()
