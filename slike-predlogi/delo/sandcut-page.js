(() => {
  // (pictures only) the old dirt layer (nv20327) by the SW bowl's red-white kerb at the heliport taken away: the sand strip along the kerb and the dark patch beside it (19. 10.); window.__SANDCUT(0/1)
  if (window.__SANDCUT) window.__SANDCUT(0);
  const POLY = [[-136, 57.5], [-123.8, 55.5], [-124.8, 60], [-125.8, 65], [-126.8, 70], [-127.3, 74], [-131, 74], [-136, 68]];
  const inP = (x, z) => { let c = false; for (let i = 0, j = POLY.length - 1; i < POLY.length; j = i++) { const a = POLY[i], b = POLY[j]; if (((a[1] > z) != (b[1] > z)) && (x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0])) c = !c; } return c; };
  const dE = (x, z) => { let d = 1e9; for (let i = 0, j = POLY.length - 1; i < POLY.length; j = i++) { const a = POLY[j], b = POLY[i], ux = b[0] - a[0], uz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * ux + (z - a[1]) * uz) / (ux * ux + uz * uz))); d = Math.min(d, Math.hypot(a[0] + ux * t - x, a[1] + uz * t - z)); } return d; };
  const V = new THREE.Vector3(); let nm = 0, cut = 0; const keep = []; Render.scene.updateMatrixWorld(true);
  Render.scene.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position || o.geometry.attributes.position.count !== 20327) return; const C = o.geometry.attributes.color, P = o.geometry.attributes.position; if (!C || C.itemSize !== 4) return;
    const orig = new Float32Array(C.count), cv = new Float32Array(C.count); let any = false;
    for (let i = 0; i < P.count; i++) { V.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); const a = C.getW(i); orig[i] = cv[i] = a;
      if (V.x > -137 && V.x < -122 && V.z > 54 && V.z < 75 && inP(V.x, V.z)) { const t = Math.min(1, dE(V.x, V.z) / 0.6); cv[i] = a * (1 - t * t * (3 - 2 * t)); any = true; if (t >= 1 && a > 0) cut++; } }
    if (any) { keep.push([C, orig, cv]); nm++; } });
  window.__SANDCUT = (on) => { for (const [C, orig, cv] of keep) { for (let i = 0; i < C.count; i++) C.setW(i, on ? cv[i] : orig[i]); C.needsUpdate = true; } };
  window.__SANDCUT(1); return 'SANDCUT meshes ' + nm + ' cut ' + cut; })()
