(() => {
  // (pictures only) the user's line on the strip between the small circuit and the bend road (from the tip where the two meet north to where the
  // bend road turns away east): a row of the game's red and white plastic barriers down the middle of the strip (2 m pieces, as by the boxes)
  const H = window.__H3, sc = Render.scene, W = H.walls, T = __game.race.track, out = {};
  const B = H.net.find(e => e.id === 'bend'); if (!B || !W || !W.mesh.plastic) return 'no bend road or no fence';
  const cNear = (x, z) => { let b = 1e18, k = 0; for (let i = 0; i < T.px.length; i++) { const d = (T.px[i] - x) ** 2 + (T.pz[i] - z) ** 2; if (d < b) { b = d; k = i; } } return k; };
  // the middle of the strip: halfway between the bend road's edge and the circuit's edge
  let M = []; for (let s = 36; s <= 98; s += 1) { const q = B.cv.getPointAt(s / B.L), k = cNear(q.x, q.z), dx = T.px[k] - q.x, dz = T.pz[k] - q.z, d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d; M.push({ x: (q.x + ux * B.hw + T.px[k] - ux * T.w) / 2, z: (q.z + uz * B.hw + T.pz[k] - uz * T.w) / 2, gap: d - B.hw - T.w }); }
  M = M.filter(p => p.gap > 3.2 && p.z > -100.5);   // (as far north as the user's line goes)
  for (let it = 0; it < 4; it++) M = M.map((p, i) => i === 0 || i === M.length - 1 ? p : { x: (M[i - 1].x + 2 * p.x + M[i + 1].x) / 4, z: (M[i - 1].z + 2 * p.z + M[i + 1].z) / 4, gap: p.gap });
  const cum = [0]; for (let i = 1; i < M.length; i++) cum.push(cum[i - 1] + Math.hypot(M[i].x - M[i - 1].x, M[i].z - M[i - 1].z)); const tot = cum[cum.length - 1];
  const pt = (d) => { let i = 1; while (i < M.length - 1 && cum[i] < d) i++; const f = (d - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]); return [M[i - 1].x + (M[i].x - M[i - 1].x) * f, M[i - 1].z + (M[i].z - M[i - 1].z) * f]; };
  const L = W.dims.plastic.L, P = []; for (let d = 0.5, k = 0; d < tot - 0.6; d += L + 0.04, k++) { const a = pt(d), b = pt(Math.min(tot, d + L)), len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.5) continue; const x = (a[0] + b[0]) / 2, z = (a[1] + b[1]) / 2; P.push({ x, z, y: W.gy ? W.gy(x, z) : H.ground(x, z), ang: Math.atan2(b[1] - a[1], b[0] - a[0]), len, c: k % 2 }); }
  const im0 = W.mesh.plastic, im = new THREE.InstancedMesh(im0.geometry, im0.material, P.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), C = new THREE.Color();
  P.forEach((p, i) => { q.setFromAxisAngle(Y, -p.ang); m4.compose(new THREE.Vector3(p.x, p.y, p.z), q, new THREE.Vector3(p.len / L, 1, 1)); im.setMatrixAt(i, m4); im.setColorAt(i, C.set(p.c ? 0xf4f4f0 : 0xd8282a)); });
  im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; im.userData.keep = true; sc.add(im);
  out.n = P.length; out.len = +tot.toFixed(1); out.ends = [[M[0].x, M[0].z], [M[M.length - 1].x, M[M.length - 1].z]].map(p => p.map(v => +v.toFixed(1))); out.minGap = +Math.min(...M.map(p => p.gap)).toFixed(1); return JSON.stringify(out); })()
