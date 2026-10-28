(() => {
  // (pictures only) the circuit's asphalt at the forest road crossing by the SW bowl: every hidden (moved) corner inside the box back at its cell's real place (19. 10.)
  const X0 = -182, X1 = -146, Z0 = 46, Z1 = 84; let moved = 0; Render.scene.updateMatrixWorld(true);
  Render.scene.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position || o.geometry.attributes.position.count !== 34800) return; const g = o.geometry, P = g.attributes.position, UV = g.attributes.uv, N = g.attributes.normal, C = g.attributes.color;
    const key = (i) => Math.round(UV.getX(i) * 5) + ':' + Math.round(UV.getY(i) * 4); const votes = new Map();
    for (let i = 0; i < P.count; i++) { const k = key(i), p = P.getX(i).toFixed(2) + ',' + P.getZ(i).toFixed(2); let m = votes.get(k); if (!m) votes.set(k, m = new Map()); const e = m.get(p); if (e) e[0]++; else m.set(p, [1, i]); }
    const canon = new Map(); for (const [k, m] of votes) { let best = null; for (const e of m.values()) if (!best || e[0] > best[0]) best = e; canon.set(k, best[1]); }
    for (let i = 0; i < P.count; i++) { const c = canon.get(key(i)); if (c === undefined || c === i) continue; const cx = P.getX(c), cz = P.getZ(c); if (cx < X0 || cx > X1 || cz < Z0 || cz > Z1) continue;
      if (Math.abs(P.getX(i) - cx) + Math.abs(P.getZ(i) - cz) + Math.abs(P.getY(i) - P.getY(c)) < 1e-3) continue;
      P.setXYZ(i, cx, P.getY(c), cz); if (N) N.setXYZ(i, N.getX(c), N.getY(c), N.getZ(c)); if (C) C.setXYZ(i, C.getX(c), C.getY(c), C.getZ(c)); moved++; }
    P.needsUpdate = true; if (N) N.needsUpdate = true; if (C) C.needsUpdate = true; g.computeBoundingBox(); g.computeBoundingSphere(); });
  return 'XING2 moved ' + moved; })()
