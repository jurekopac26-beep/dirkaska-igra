(() => {
  // (pictures only) the user: the ways over the snow only lightly snowy (the cars drive there, there is not so much snow on them): the packed snow on
  // them thinned: a light dusting in the middle, the wheel tracks nearly clear (the gravel shows), more snow pushed to the edges, in patches.
  // window.__SNOW(k): 0 as it was, 1 lightly snowy (the default), 2 a little more snow (between the two)
  const sc = Render.scene, out = { meshes: 0, verts: 0 }, SC = [-205, -105];
  const sst = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const pat = (x, z) => 0.5 + 0.3 * Math.sin(0.41 * x + 0.23 * z + 1.7) * Math.sin(0.19 * x - 0.37 * z + 0.6) + 0.2 * Math.sin(1.13 * x - 0.71 * z + 2.2);
  const LAY = []; sc.traverse(o => { if (!o.isMesh || o.isInstancedMesh || o.userData.keep) return; const m = Array.isArray(o.material) ? o.material[0] : o.material, g = o.geometry, C = g && g.attributes.color; if (!m || !C || C.itemSize !== 4 || !g.index) return;
    if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld); if (bb.max.x < SC[0] - 75 || bb.min.x > SC[0] + 75 || bb.max.z < SC[1] - 75 || bb.min.z > SC[1] + 75) return;
    // the packed snow layer: whitish vertex colours (0.9, 0.91, 0.95 times a shade), the snow's own material
    let w = 0, n = 0; for (let i = 0; i < C.count; i += 7) { const r = C.getX(i), gg = C.getY(i), b = C.getZ(i); n++; if (r > 0.7 && b > r && b - r < 0.09 && gg >= r) w++; } if (!n || w / n < 0.8) return; LAY.push(o); });
  const st = LAY.map(o => { const g = o.geometry, C = g.attributes.color, P = g.attributes.position, I = g.index, NV = (() => { for (let t = 0; t < I.count; t += 3) { const d = I.getX(t + 2) - I.getX(t); if (d > 2) return d; } return 15; })(), A0 = new Float32Array(C.count), e = o.matrixWorld.elements;
    for (let i = 0; i < C.count; i++) A0[i] = C.getW(i);
    const tgt = (k) => { const A = new Float32Array(C.count); for (let i = 0; i < C.count; i++) { if (k === 0) { A[i] = A0[i]; continue; } const c = i % NV, u = Math.max(0, Math.min(1, (c - 1) / Math.max(1, NV - 3))), ef = 1 - 2 * Math.min(u, 1 - u), ws = C.getX(i) / 0.9, tr = Math.max(0, Math.min(1, (1 - ws) / 0.1)), x = P.getX(i) * e[0] + P.getY(i) * e[4] + P.getZ(i) * e[8] + e[12], z = P.getX(i) * e[2] + P.getY(i) * e[6] + P.getZ(i) * e[10] + e[14];
        const mid = k === 1 ? 0.2 : 0.42, edge = k === 1 ? 0.78 : 0.88, a = (mid + (edge - mid) * sst(0.5, 0.95, ef)) * (1 - (k === 1 ? 0.8 : 0.55) * tr) * Math.max(0.35, Math.min(1.25, 0.55 + 0.9 * pat(x, z))); A[i] = A0[i] * Math.min(1, a); } return A; };
    out.meshes++; out.verts += C.count; return { o, C, A: [0, 1, 2].map(tgt), NV }; });
  window.__SNOW = (k) => { for (const s of st) { for (let i = 0; i < s.C.count; i++) s.C.setW(i, s.A[k][i]); s.C.needsUpdate = true; } return k; };
  window.__SNOW(1); out.NV = st.map(s => s.NV); return JSON.stringify(out); })()
