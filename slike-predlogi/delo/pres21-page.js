(() => {
  // (pictures only) 21. 10., sheet 43-3 (Predsednik): the president box's red carpet ran out of its frame at both ends (over the lane and its mouth):
  // shortened along its own length to the box's blue floor, 0.3 m inside it at each end (in the baked meshes: the red pieces by their colour) ; window.__PRES21
  if (window.__PRES21) return 'PRES21 done already';
  const X0 = -18, X1 = 3, Z0 = -200, Z1 = -181; let root = null; for (const c of Render.scene.children) if (c.name === 'nv-baked') root = c;
  const byP = new Map(); root.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.index) return; const P = o.geometry.attributes.position; let e = byP.get(P); if (!e) byP.set(P, e = { I: [], o }); if (!e.I.includes(o.geometry.index)) e.I.push(o.geometry.index); });
  const comps = (P, IL) => { const n = P.count, par = new Int32Array(n); for (let i = 0; i < n; i++) par[i] = i; const f = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
    for (const I of IL) for (let t = 0; t < I.count; t += 3) { const a = I.getX(t), b = I.getX(t + 1), c = I.getX(t + 2); par[f(b)] = f(a); par[f(c)] = f(a); }
    const M = new Map(); for (let i = 0; i < n; i++) { const x = P.getX(i), z = P.getZ(i); if (x < X0 || x > X1 || z < Z0 || z > Z1) continue; const r = f(i); let q = M.get(r); if (!q) M.set(r, q = []); q.push(i); } return M; };
  const pca = (P, v) => { let sx = 0, sz = 0; for (const i of v) { sx += P.getX(i); sz += P.getZ(i); } const cx = sx / v.length, cz = sz / v.length; let a = 0, b = 0, c = 0; for (const i of v) { const dx = P.getX(i) - cx, dz = P.getZ(i) - cz; a += dx * dx; b += dx * dz; c += dz * dz; }
    const th = 0.5 * Math.atan2(2 * b, a - c), ux = Math.cos(th), uz = Math.sin(th); let lo = 1e9, hi = -1e9; for (const i of v) { const s = (P.getX(i) - cx) * ux + (P.getZ(i) - cz) * uz; lo = Math.min(lo, s); hi = Math.max(hi, s); } return { cx, cz, ux, uz, lo, hi }; };
  // the box's blue floor (its own mesh colour) and the red carpet (its vertex colours) among the baked pieces there
  let floor = null; const reds = [];
  for (const [P, e] of byP) { const C = e.o.geometry.attributes.color, mc = e.o.material && e.o.material.color ? e.o.material.color.getHexString() : ''; const M = comps(P, e.I);
    for (const v of M.values()) { if (v.length < 4) continue; let y0 = 1e9, y1 = -1e9; for (const i of v) { y0 = Math.min(y0, P.getY(i)); y1 = Math.max(y1, P.getY(i)); } if (y1 - y0 > 0.3) continue; const g = pca(P, v); if (g.hi - g.lo < 4) continue;
      if (mc === '1f4aa8') floor = g;
      else if (C) { let rd = 0; for (const i of v) if (C.getX(i) > 0.5 && C.getY(i) < 0.3 && C.getZ(i) < 0.3) rd++; if (rd > v.length * 0.8) reds.push([P, v, g]); }
      else if (mc === 'd8282a' || mc === 'c81e2a' || mc === 'b01e28') reds.push([P, v, g]); } }
  if (!floor || !reds.length) return 'PRES21 floor ' + !!floor + ' reds ' + reds.length;
  let n = 0; for (const [P, v, g] of reds) { // (the floor's extent along the carpet's axis)
    const fl = Math.abs(floor.ux * g.ux + floor.uz * g.uz) > 0.7 ? [floor.lo, floor.hi] : null; const fc = (floor.cx - g.cx) * g.ux + (floor.cz - g.cz) * g.uz;
    const half = fl ? (fl[1] - fl[0]) / 2 - 0.3 : (g.hi - g.lo) * 0.33, len = (g.hi - g.lo) / 2, k = Math.min(1, half / len);
    for (const i of v) { const dx = P.getX(i) - g.cx, dz = P.getZ(i) - g.cz, s = dx * g.ux + dz * g.uz, ns = fc + s * k; P.setX(i, P.getX(i) + (ns - s) * g.ux); P.setZ(i, P.getZ(i) + (ns - s) * g.uz); }
    P.needsUpdate = true; n++; }
  window.__PRES21 = true; return 'PRES21 carpets ' + n + ' floor ' + (floor.hi - floor.lo).toFixed(1) + ' carpet ' + reds.map(r => (r[2].hi - r[2].lo).toFixed(1)).join(','); })()
