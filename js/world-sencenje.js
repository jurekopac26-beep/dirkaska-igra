/* ============================================================
   WORLD — the terrain's baked shading (Grafika AAA, SR4a: docs/grafika-aaa.md on raziskava/grafika-aaa, »Pečeno senčenje terena«). A real
   track that asks for it (def.sencenje: { moc: 0..1 }, not a test or pending track) gets three things baked into its terrain's vertex
   colours once, as the world is built (nothing in the race's loop, no new meshes, draws or vertices):
   - the sky's light shut out in hollows, ditches and valleys: the horizon in 8 directions (out to 12 m on the terrain mesh itself, the
     road's cuttings and banks; beyond on the real elevation model, def.dem), above the
     slope's own plane (a slope alone keeps its sky: the scene's hemisphere light already shades it), cosine-weighted (1 − sin² of
     the horizon's angle);
   - the mountains' own shadow from the track's static sun (Render.ext.sonce: the real azimuth, the elevation as the shadow light's,
     never under its MIN_EL; a track without def.sonce: no sun part), marched up to 1.5 km toward it, a soft edge of ±2°; it fades out
     by the road (the road and the cars take the live shadow map's light, the terrain there should not differ from them);
   - less sky under the trees' crowns (G.cov, the canopy over each vertex: the trees put it there as they are placed).
   The factor: (A·ao + D·vis) / (A + D), D the sun's N·L, A the sky's share against it (the themes' hemisphere ~0.55 of the sun), so the
   lit side keeps its colour and the shaded side keeps only its sky. World's nrPrep asks this file for the bake (World.api.sencenje.prep)
   and nrVCol / nrTileGeo multiply each vertex's colour by it.
   ============================================================ */
(function () {
  if (typeof World === 'undefined' || !World.api) return;
  const R = Math.PI / 180, A = 0.55, FLOOR = 0.42;
  const DIRS = 8, AOR = [24, 45, 90, 180, 320], NEAR = [6, 12];   // (the horizon's directions and distances, m: NEAR on the terrain mesh itself, the rest on the elevation model)
  const SUN_STEPS = (() => { const s = []; for (let r = 8; r < 1500; r *= 1.25) s.push(r); return s; })();
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const real = (def) => !!def && !def.test && !def.pending && !!def.sencenje;

  // the bake for the track being built (P: World's NR grid, dem(x, z): the real terrain's height, near(x, z): the terrain mesh's own, with the
  // road's cuttings, banks and ditches, asked only within 100 m of the barriers), or null: as before
  function prep(P, def, dem, near) {
    if (!real(def)) return null;
    const k = def.sencenje.moc != null ? def.sencenje.moc : 1, cs = [], sn = [];
    for (let d = 0; d < DIRS; d++) { cs.push(Math.cos(d / DIRS * 2 * Math.PI)); sn.push(Math.sin(d / DIRS * 2 * Math.PI)); }
    let L = null;
    const S = typeof Render !== 'undefined' && Render.ext && Render.ext.sonce && def.sonce ? Render.ext.sonce.pos(def.sonce) : null;
    if (S) {   // (the shadow light's direction: the real azimuth, its elevation never under MIN_EL, as js/render-sonce.js apply)
      const el = Math.max(Render.ext.sonce.MIN_EL || 28, S.el) * R, hl = Math.hypot(S.d[0], S.d[2]) || 1;
      L = { x: S.d[0] / hl * Math.cos(el), y: Math.sin(el), z: S.d[2] / hl * Math.cos(el), ux: S.d[0] / hl, uz: S.d[2] / hl, el };
    }
    P.bakeL = L;
    // (x, z) the vertex, gx gz the terrain's slope there (dh/dx, dh/dz), dd its distance beyond the barrier, cov the canopy, c its colour (in place)
    return function bake(x, z, gx, gz, dd, cov, c) {
      const h0 = dem(x, z) + 0.5, nb = near && dd < 100, n0 = nb ? near(x, z) + 0.2 : 0;
      let ao = 0;
      for (let d = 0; d < DIRS; d++) {
        const cx = cs[d], cz = sn[d], tp = gx * cx + gz * cz; let t = -1e9;
        if (nb) for (const r of NEAR) { const v = (near(x + cx * r, z + cz * r) - n0) / r; if (v > t) t = v; }
        for (const r of AOR) { const v = (dem(x + cx * r, z + cz * r) - h0) / r; if (v > t) t = v; }
        const th = Math.max(0, Math.atan(t) - Math.atan(tp)), s = Math.sin(th); ao += 1 - s * s;
      }
      ao = ao / DIRS * (1 - 0.35 * Math.min(1, cov));
      let f = ao;
      if (L) {
        const l = Math.hypot(gx, 1, gz), nl = Math.max(0, (-gx * L.x + L.y - gz * L.z) / l);
        let ex = -1e9;   // (the terrain's highest rise above the ray toward the sun, as an angle against the sun's)
        for (const r of SUN_STEPS) { const v = Math.atan((dem(x + L.ux * r, z + L.uz * r) - h0) / r); if (v > ex) ex = v; }
        let vis = sstep(-2 * R, 2 * R, L.el - ex);
        vis = 1 - (1 - vis) * (0.35 + 0.65 * sstep(4, 40, dd));
        f = (A * ao + nl * vis) / (A + nl);
      }
      f = Math.max(FLOOR, 1 - (1 - f) * k);
      c[0] *= f; c[1] *= f; c[2] *= f;
    };
  }

  World.api.sencenje = { prep, real };
})();
