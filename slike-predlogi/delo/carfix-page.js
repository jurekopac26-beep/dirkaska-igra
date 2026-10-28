(() => {
  // (pictures only) the player's car had been folded flat by a page's clean-up (its triangles collapsed, so it was not drawn, only its lamps):
  // a fresh view of it (the game's repair), the wheels (their shared geometry was folded too) made again as tyres with hubs, and the car marked
  // so no clean-up touches it again
  const P = __game.race.player, out = {};
  const deg = (g) => { const A = g.attributes.position.array, N = g.attributes.position.count; let d = 0, t = 0; for (let i = 0; i + 2 < N; i += 3) { t++; const a = i * 3, b = a + 3, c = a + 6; if (A[a] === A[b] && A[a + 1] === A[b + 1] && A[a + 2] === A[b + 2] && A[a] === A[c] && A[a + 2] === A[c + 2]) d++; } return t ? d / t : 0; };
  let v = Render.viewOf(P); if (deg(v.body.geometry) > 0.02) { P.repairN = (P.repairN || 0) + 1; for (let k = 0; k < 2; k++) Render.frame(0.05, 1, P, 'tv', {}); v = Render.viewOf(P); out.repaired = 1; }
  out.body = +deg(v.body.geometry).toFixed(2);
  const W = [...(v.wf || []), ...(v.wr || [])].filter(w => w && w.geometry); const bad = W.filter(w => deg(w.geometry) > 0.02); out.wheels = [W.length, bad.length];
  if (bad.length) { const g0 = bad[0].geometry, A = g0.attributes.position.array, mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let i = 0; i < A.length; i += 9) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], A[i + k]); mx[k] = Math.max(mx[k], A[i + k]); }
    const r = Math.max(mx[0] - mn[0], mx[1] - mn[1]) / 2, w = Math.max(0.12, mx[2] - mn[2]), cx = (mx[0] + mn[0]) / 2, cy = (mx[1] + mn[1]) / 2, cz = (mx[2] + mn[2]) / 2;
    const part = (rr, ww, c) => { const g = new THREE.CylinderGeometry(rr, rr, ww, 22, 1, false).toNonIndexed(); g.rotateX(Math.PI / 2); g.translate(cx, cy, cz); const n = g.attributes.position.count, col = new Float32Array(n * 3); for (let i = 0; i < n; i++) { col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; } g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g; };
    const tyre = part(r, w, [0.07, 0.07, 0.075]), hub = part(r * 0.6, w + 0.03, [0.62, 0.63, 0.66]);
    const pos = new Float32Array([...tyre.attributes.position.array, ...hub.attributes.position.array]), nor = new Float32Array([...tyre.attributes.normal.array, ...hub.attributes.normal.array]), col = new Float32Array([...tyre.attributes.color.array, ...hub.attributes.color.array]);
    const NG = new THREE.BufferGeometry(); NG.setAttribute('position', new THREE.BufferAttribute(pos, 3)); NG.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); NG.setAttribute('color', new THREE.BufferAttribute(col, 3)); NG.computeBoundingSphere();
    for (const wm of bad) wm.geometry = NG; out.wheel = [r, w, cx, cy, cz].map(a => +a.toFixed(2)); }
  v.grp.traverse(o => { o.userData.keep = true; });
  // every other car too (they share the wheels' geometry): no clean-up may touch them
  for (const c of (__game.race.cars || [])) { const w = Render.viewOf(c); if (w && w.grp) w.grp.traverse(o => { o.userData.keep = true; }); }
  // after a repair: its sparkle let die away
  if (out.repaired) for (let k = 0; k < 8; k++) Render.frame(0.4, 1, P, 'tv', {});
  return JSON.stringify(out); })()
