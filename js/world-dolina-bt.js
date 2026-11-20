/* =========================================================================
   WORLD — the valley below the edge, from the camera behind the car (chase), on the real mountain roads where the view goes over the
   edge: Killar, Tianmen, Katu-Yaryk, Santo Antão, Sa Calobra, Ella, Llogara. The near world ends in the fog some 230 m from the camera,
   and the far views (API.irFar) leave out everything within 800 m of the road, so the slope under the road and the valley's floor were a
   blank in the fog's colour. Here one more mesh a track: the track's own terrain (the world's groundH over def.dem, so the same real
   elevation model the road is laid on) on a coarse grid, drawn the way the far views are (its nodes on the camera's lines of sight just
   inside the far plane, behind every part of the near world), hazed towards the fog's colour: all the way where the near world's own
   fog ends, clearer farther out. Its colours are the track's far view's own where it has one (so the two meet), else the land's by
   height and slope after the track's description (docs/proge/<id>.md). No objects, nothing driven on, no physics: one draw a track,
   and only the named tracks change (each wraps its own builder, World.ext.<id>).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext) return;
  const API = World.api, { lerp, sstep } = API;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
  const inPoly = (P, x, z) => { let c = false; for (let k = 0, n = P.length, j = n - 2; k < n; j = k, k += 2) if ((P[k + 1] > z) !== (P[j + 1] > z) && x < (P[j] - P[k]) * (z - P[k + 1]) / (P[j + 1] - P[k + 1]) + P[k]) c = !c; return c; };
  const lineD = (L, o, x, z) => { let m = 1e18; for (let k = o; k + 3 < L.length; k += 2) { const ax = L[k], az = L[k + 1], bx = L[k + 2] - ax, bz = L[k + 3] - az, t = clamp(((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz || 1), 0, 1), dx = x - ax - bx * t, dz = z - az - bz * t, d = dx * dx + dz * dz; if (d < m) m = d; } return Math.sqrt(m); };

  /* the land's colours where the track has no far view to take them from: (A: the height above the sea, sl: the slope, q: noise -0.5..0.5,
     x, z, def) -> [r, g, b]; hz: the haze's [floor, rise] with the distance */
  const LAND = {
    // Killar (Pangi, the Chenab's gorge): dry olive and straw slopes, grey-brown schist and scree on the steep faces, the silty river below
    killar: { hz: [0.3, 0.5], col(A, sl, q, x, z, def) {
      let c = mix3([0.4, 0.39, 0.25], [0.5, 0.45, 0.3], clamp(0.5 + q * 1.6, 0, 1));
      c = mix3(c, [0.27, 0.33, 0.19], sstep(2260, 2120, A) * 0.6);   // (greener towards the river: the fields and trees of the valley's floor)
      c = mix3(c, [0.43 + q * 0.06, 0.39 + q * 0.05, 0.34], sstep(0.55, 1.05, sl));
      const R = def.creeks && def.creeks[1]; if (R && lineD(R, 1, x, z) < 34) c = [0.44, 0.52, 0.5];   // (the Chenab: grey-green with silt)
      return c; } },
    // Tianmen: dense subtropical forest, the limestone walls grey (the colours of the world's own far mountains)
    tianmen: { hz: [0.3, 0.5], col(A, sl, q) { const k = 0.92 + q * 0.2, rk = sstep(0.7, 1.3, sl); return [lerp(0.2, 0.58, rk) * k, lerp(0.3, 0.58, rk) * k, lerp(0.16, 0.54, rk) * k]; } },
    // Katu-Yaryk (the Chulyshman's canyon): steppe and straw grass on the sunny slopes, grey-brown rock walls, larches on the floor, the
    // glacial river green-blue inside its banks (def.river)
    katu: { hz: [0.3, 0.5], col(A, sl, q, x, z, def) {
      let c = mix3([0.47, 0.45, 0.28], [0.36, 0.42, 0.22], clamp(0.5 + q * 1.8, 0, 1));
      c = mix3(c, [0.26, 0.36, 0.18], sstep(760, 700, A) * 0.55);
      c = mix3(c, [0.5 + q * 0.06, 0.46 + q * 0.05, 0.41], sstep(0.6, 1.1, sl));
      const R = def.river; if (R && R.polys) for (const P of R.polys) if (inPoly(P, x, z)) { c = [0.33, 0.47, 0.46]; break; }
      return c; } },
  };
  const IDS = ['killar', 'tianmen', 'katu', 'santoantao', 'sacalobra', 'ella', 'llogara'];

  function material() {   // (the far views' own material and program: API.irFar)
    const U = { uHz: { value: new THREE.Color(0xc8d6e2) } }, m = new THREE.MeshLambertMaterial({ vertexColors: true, fog: false });
    m.onBeforeCompile = (sh) => { sh.uniforms.uHz = U.uHz;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aHz;\nvarying float vHz;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHz = aHz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uHz;\nvarying float vHz;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb = mix( gl_FragColor.rgb, uHz, vHz );'); };
    m.customProgramCacheKey = () => 'irFar';
    return [m, U];
  }
  const roadD = (T, x, z, st) => { let m = 1e18; for (let q = 0; q < T.N; q += st) { const dx = x - T.px[q], dz = z - T.pz[q], d = dx * dx + dz * dz; if (d < m) m = d; } return Math.sqrt(m); };

  /* the valley's mesh. F: the track's far view (API.irFar's object) or null. With one, the grid reaches 1000 m past the road's box and
     only the part within 880 m of the road is kept (the far view starts at 470 m; the two overlap, this one in front), its heights past
     def.dem's box the far model's own; without, def.dem's box, fading into the haze at its edge */
  function valley(T, out, F) {
    const def = T.def, D = def.dem, FD = F && def.farDem; if (!D || !out.groundH) return null;
    const dx1 = D.x0 + (D.nx - 1) * D.cell, dz1 = D.z0 + (D.nz - 1) * D.cell, st = Math.max(1, Math.round(T.N / 700));
    let x0 = D.x0, z0 = D.z0, x1 = dx1, z1 = dz1;
    if (FD) { x0 = z0 = 1e18; x1 = z1 = -1e18; for (let q = 0; q < T.N; q += st) { x0 = Math.min(x0, T.px[q]); x1 = Math.max(x1, T.px[q]); z0 = Math.min(z0, T.pz[q]); z1 = Math.max(z1, T.pz[q]); } x0 -= 1000; z0 -= 1000; x1 += 1000; z1 += 1000; }
    const cell = Math.max(40, Math.ceil(Math.max(x1 - x0, z1 - z0) / 96)), nx = Math.floor((x1 - x0) / cell) + 1, nz = Math.floor((z1 - z0) / cell) + 1, n = nx * nz;
    // the far model's heights and colours (bilinear on its grid), where there is one
    let fH = null, fC = null;
    if (FD) { const fc = F.mesh.geometry.attributes.color.array, fp = F.P0;
      const at = (x, z, f) => { const gx = clamp((x - FD.x0) / FD.cell, 0, FD.nx - 1.001), gz = clamp((z - FD.z0) / FD.cell, 0, FD.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, k = j * FD.nx + i;
        return (f(k) * (1 - u) + f(k + 1) * u) * (1 - v) + (f(k + FD.nx) * (1 - u) + f(k + FD.nx + 1) * u) * v; };
      fH = (x, z) => at(x, z, k => fp[k * 3 + 1]); fC = (x, z) => [0, 1, 2].map(c => at(x, z, k => fc[k * 3 + c])); }
    const H = new Float32Array(n), dr = new Float32Array(n), P0 = new Float32Array(n * 3), C = new Float32Array(n * 3), rim = new Float32Array(n), I = [];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i, x = x0 + i * cell, z = z0 + j * cell;
      const e = Math.min(x - D.x0, dx1 - x, z - D.z0, dz1 - z);   // (how far inside def.dem's box)
      let h = e > 0 || !fH ? out.groundH(clamp(x, D.x0, dx1), clamp(z, D.z0, dz1)) : 0;
      if (fH) h = lerp(fH(x, z), h, sstep(0, 120, e));
      H[k] = h; dr[k] = roadD(T, x, z, st); rim[k] = fH ? 0 : sstep(260, 0, e); }
    const land = LAND[def.id], rock = [0.45, 0.42, 0.38];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i, x = x0 + i * cell, z = z0 + j * cell, h = H[k], q = hash(i, j) - 0.5;
      const sl = Math.hypot(H[j * nx + Math.min(nx - 1, i + 1)] - H[j * nx + Math.max(0, i - 1)], H[Math.min(nz - 1, j + 1) * nx + i] - H[Math.max(0, j - 1) * nx + i]) / (2 * cell);
      let c;
      if (fC) { c = fC(x, z); const w = sstep(880, 560, dr[k]), v = 1 + q * 0.1 * w; c = mix3([c[0] * v, c[1] * v, c[2] * v], rock, sstep(0.75, 1.3, sl) * 0.4 * w); }   // (the far view's own colour of the place, the steep faces a little barer; towards this mesh's edge the far view's colour alone)
      else c = land ? land.col(h + D.base, sl, q, x, z, def) : rock;
      P0[k * 3] = x; P0[k * 3 + 1] = h; P0[k * 3 + 2] = z; C[k * 3] = c[0]; C[k * 3 + 1] = c[1]; C[k * 3 + 2] = c[2]; }
    for (let j = 0; j + 1 < nz; j++) for (let i = 0; i + 1 < nx; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      if (fH && Math.min(dr[a], dr[b], dr[c], dr[d]) > 880) continue; I.push(a, c, b, b, c, d); }
    if (!I.length) return null;
    const g = new THREE.BufferGeometry(), [m, U] = material();
    g.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(P0), 3)); g.setAttribute('color', new THREE.BufferAttribute(C, 3));
    g.setAttribute('aHz', new THREE.BufferAttribute(new Float32Array(n).fill(1), 1)); g.setIndex(I); g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = -49; mesh.matrixAutoUpdate = false; mesh.name = 'dolina'; mesh.visible = false;
    mesh.onBeforeRender = (r, sc) => { if (sc && sc.fog) U.uHz.value.copy(sc.fog.color); };
    out.root.add(mesh);
    const hz = (F && F.hz) || (land && land.hz) || [0.3, 0.5];
    return { mesh, P0, rim, cx: 1e9, cy: 0, cz: 0, cf: 0, hz };
  }

  /* the haze of a node D m from the camera: the fog's own colour where the near world's fog ends (cam.far - 40, js/render.js), clearing
     over the next 260 m to the far views' haze (its floor and its rise with the distance) */
  const haze = (D, far, H0, H1) => { const s = sstep(far - 90, far + 170, D); return 1 - s * (1 - (H0 + H1 * (1 - Math.exp(-Math.max(0, D - 500) / 5000)))); };

  // each frame (World.update): the nodes onto the camera's lines of sight, 5 m in front of where the far view puts a node as far away
  function update(V, cam) {
    if (!cam) { V.mesh.visible = false; V.cx = 1e9; return; }   // (the world test's pose: no camera, no valley)
    V.mesh.visible = true;
    const c = cam.position; if (Math.abs(c.x - V.cx) + Math.abs(c.y - V.cy) + Math.abs(c.z - V.cz) < 0.5 && cam.far === V.cf) return;
    V.cx = c.x; V.cy = c.y; V.cz = c.z; V.cf = cam.far;
    const g = V.mesh.geometry, p = g.attributes.position.array, hz = g.attributes.aHz.array, P0 = V.P0, R0 = cam.far - 75, R1 = cam.far - 11, H0 = V.hz[0], H1 = V.hz[1];
    for (let v = 0, k = 0; k < P0.length; v++, k += 3) { const dx = P0[k] - c.x, dy = P0[k + 1] - c.y, dz = P0[k + 2] - c.z, D = Math.max(1, Math.hypot(dx, dy, dz));
      if (D < 170) { p[k] = c.x; p[k + 1] = c.y - R0; p[k + 2] = c.z; hz[v] = 1; continue; }   // (round the camera, where the near world stands: gathered into one point under it, all haze; else a cell under the camera, its corners on every side, would cut across the view)
      const r = R0 + (R1 - R0) * (1 - Math.exp(-Math.max(0, D - 400) / 3000)), f = r / D;
      p[k] = c.x + dx * f; p[k + 1] = c.y + dy * f; p[k + 2] = c.z + dz * f; hz[v] = Math.max(V.rim[v], haze(D, cam.far, H0, H1)); }
    g.attributes.position.needsUpdate = true; g.attributes.aHz.needsUpdate = true;
  }

  /* a track with a far view: its ring of full haze round the road (800–1400 m) goes, the valley's mesh fills the hole, and the far
     view's nodes near the camera take the valley's haze, so the two meet without a step */
  function join(T, out, F) {
    const prev = F.upd || API.irFarUpdate; let V = null, near = null, tried = false;
    F.upd = (F2, cam) => {
      const a = F.cx, b = F.cy, c = F.cz, f = F.cf; prev(F, cam);
      if (!cam) { if (V) update(V, null); return; }
      if (!tried) { tried = true;   // (built after the far view's first frame: Llogara colours its sea then)
        try { V = valley(T, out, F); } catch (e) { V = null; if (typeof console !== 'undefined') console.warn('dolina', e); }
        if (V) { F.rim.fill(0); near = []; const st = Math.max(1, Math.round(T.N / 700)); for (let k = 0; k < F.rim.length; k++) if (roadD(T, F.P0[k * 3], F.P0[k * 3 + 2], st) < 1500) near.push(k); F.cx = 1e9; prev(F, cam); } }
      if (!V) return;
      update(V, cam);
      if (F.cx !== a || F.cy !== b || F.cz !== c || F.cf !== f) {   // (the far view moved its nodes and set their haze anew)
        const hz = F.mesh.geometry.attributes.aHz.array, P0 = F.P0, p = cam.position, H0 = V.hz[0], H1 = V.hz[1];
        for (const k of near) { const D = Math.hypot(P0[k * 3] - p.x, P0[k * 3 + 1] - p.y, P0[k * 3 + 2] - p.z); hz[k] = Math.max(hz[k], haze(D, cam.far, H0, H1)); }
        F.mesh.geometry.attributes.aHz.needsUpdate = true; }
    };
  }

  for (const id of IDS) {
    const orig = World.ext[id]; if (typeof orig !== 'function') continue;
    World.ext[id] = function (scene, tex, opts, api) {
      const out = orig.apply(this, arguments);
      try {
        const T = (api && api.T) || API.T;
        if (out && out.dyn && out.root && T && T.def && T.def.id === id && !T.def.test && !T.def.pending) {
          if (out.dyn.irFar) join(T, out, out.dyn.irFar);
          else { const V = valley(T, out, null); if (V) { V.upd = update; out.dyn.irFar = V; } }
        }
      } catch (e) { if (typeof console !== 'undefined') console.warn('dolina', e); }
      return out;
    };
  }
})();
