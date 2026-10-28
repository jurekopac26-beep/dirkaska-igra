(() => {
  // (pictures only) the circuit's asphalt rows at the forest road crossing by the SW bowl (v 164.27..167.02, narrowed there by one column) rebuilt to the full banked width like the rows before and after (19. 10.)
  const VA = 164.15, VB = 167.15; let moved = 0; Render.scene.updateMatrixWorld(true);
  Render.scene.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position || o.geometry.attributes.position.count !== 34800) return; const g = o.geometry, P = g.attributes.position, UV = g.attributes.uv, N = g.attributes.normal, C = g.attributes.color;
    const c8 = new Map(), ref = new Map();       // the centre (u 0.8) per row; the reference row (v 164.023) per column
    for (let i = 0; i < P.count; i++) { const u5 = Math.round(UV.getX(i) * 5), v4 = Math.round(UV.getY(i) * 4); if (u5 === 4 && !c8.has(v4)) c8.set(v4, [P.getX(i), P.getY(i), P.getZ(i)]); if (v4 === 656 && !ref.has(u5)) ref.set(u5, i); }
    const r0 = ref.get(0), r8 = ref.get(8); if (r0 === undefined || r8 === undefined) return;
    const slope = (P.getY(r8) - P.getY(r0)) / 8;      // the banking per column
    for (let i = 0; i < P.count; i++) { const v = UV.getY(i); if (v < VA || v > VB) continue; const u5 = Math.round(UV.getX(i) * 5), v4 = Math.round(v * 4), c = c8.get(v4), a = c8.get(v4 - 1), b = c8.get(v4 + 1); if (!c || !a || !b) continue;
      let tx = b[0] - a[0], tz = b[2] - a[2]; const tl = Math.hypot(tx, tz); tx /= tl; tz /= tl; let nx = -tz, nz = tx;
      const ux = P.getX(r8) - P.getX(r0), uz = P.getZ(r8) - P.getZ(r0); if (nx * ux + nz * uz < 0) { nx = -nx; nz = -nz; }      // towards growing u
      const k = u5 - 4; P.setXYZ(i, c[0] + nx * 1.6 * k, c[1] + slope * k, c[2] + nz * 1.6 * k); const rr = ref.get(u5);
      if (rr !== undefined) { if (N) N.setXYZ(i, N.getX(rr), N.getY(rr), N.getZ(rr)); if (C) C.setXYZ(i, C.getX(rr), C.getY(rr), C.getZ(rr)); } moved++; }
    P.needsUpdate = true; if (N) N.needsUpdate = true; if (C) C.needsUpdate = true; g.computeBoundingBox(); g.computeBoundingSphere(); });
  return 'XING3 moved ' + moved; })()
