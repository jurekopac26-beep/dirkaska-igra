/* =========================================================================
   WORLD — Irohazaka (theme 'iroha'): its own builder (World.ext.iroha), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (LOD, T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, TAU, VRC, VRT, atSf, box, parkedCar, clamp, crowdCtx, crowdFinish, crowdLayer, crowdPut, crowdRun, crowdSub, cyl, gable, ico, lerp,
    ouCutMat, pkGroundMat, rng, rock, rpHash, sstep, vary, vrCol, vrDist, vrFar, vrGCol, vrGritTex, vrGround, vrLC, vrNear, vrPrep, vrSlope,
    vrStubs, vrTileGeo, vrTileOn, vrTreeGeo, vrsicProps
  } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ================= IROHAZAKA (theme 'iroha') =================
     The second Irohazaka above Nikko (Japan): the one-way road up 18 of its 20 numbered curves (は, curve 3, to ね, curve 20), from ~920 m
     past the Kurokamidaira lookout to ~1240 m, 1 km below Akechidaira. Vršič's corridor helpers (vrPrep and the rest: the real terrain round the road from def.dem, the land
     cover def.lc) with Nikko's own look: a dense broadleaf forest of Japanese maples, oaks and beeches (red, orange and gold in autumn: VRS, the
     season the world is painted in, as on Vršič; winter snows the autumn look over), hemlocks and cedars among them, sasa (bamboo grass) under
     the trees; retaining walls of stone or concrete where the slope rises beside the road, white guardrails where it falls away and round the
     outside of the hairpins; before every hairpin a sign with its letter of the Iroha poem (hiragana, drawn as strokes: no Japanese font
     needed on the phone) and its number; the Kurokamidaira lookout's car park by the road. Beyond the corridor the real view (def.farDem: Mount Nantai,
     the Daiya valley, Lake Chūzenji, the Kegon falls) is drawn behind everything (irFar). No names of firms or brands anywhere. */
  // the letters of the road's signs: strokes in a 100 x 100 box (y down), each a flat list of points, drawn as round-capped lines through
  // the midpoints (a smooth brush)
  const IR_KANA = { 'い': [[26,22,24,44,27,64,33,76,38,72],[66,32,74,46,78,62]], 'ろ': [[30,20,64,20,60,26,32,58,50,48,68,50,76,62,72,76,58,84,42,84]], 'は': [[22,18,20,48,24,84],[42,38,82,36],[64,16,64,74,60,84,46,84,42,76,52,70,66,72,84,84]], 'に': [[24,18,22,48,26,84],[50,32,76,28],[48,62,50,72,60,76,80,74]], 'ほ': [[22,18,20,48,24,84],[44,22,80,22],[46,44,78,42],[62,22,62,74,58,84,44,84,40,76,50,70,64,72,84,84]], 'へ': [[14,62,34,38,44,40,86,74]], 'と': [[38,16,46,46],[74,30,44,50,32,64,36,78,56,84,80,82]], 'ち': [[22,30,76,26],[48,14,36,58,56,48,74,54,78,68,66,80,44,84]], 'り': [[32,22,30,46,36,58],[64,16,68,40,64,64,46,86]], 'ぬ': [[30,26,46,70],[62,18,50,48,34,72,22,66,30,48,56,40,76,50,78,70,66,80,56,74,66,66,84,80]], 'る': [[30,20,66,20,28,62,52,48,72,56,74,74,58,84,44,80,50,70,62,76,66,84]], 'を': [[30,24,64,22],[48,12,30,50,50,40,56,52,54,64],[80,42,48,62,44,76,56,84,80,84]], 'わ': [[36,12,34,88],[18,36,44,30,24,64],[30,56,52,40,72,44,78,62,68,78,52,84]], 'か': [[18,40,56,34,60,48,56,70,48,82,40,76],[40,14,24,86],[72,32,84,52]], 'よ': [[50,16,50,70,44,82,28,80,28,68,52,66,80,82],[50,40,74,38]], 'た': [[16,32,54,28],[38,14,22,84],[56,48,80,46],[54,66,60,80,84,80]], 'れ': [[30,12,30,88],[14,36,40,32,20,66],[30,56,52,40,62,44,62,74,72,84,86,74]] };
  function irKana(x, ch, x0, y0, sz, col, lw) {   // one letter on a 2D context, its box at (x0, y0), sz px square
    const S = IR_KANA[ch]; if (!S) return;
    x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round';
    const p = (a, k) => [x0 + a[k] * sz / 100, y0 + a[k + 1] * sz / 100];
    for (const a of S) { x.beginPath(); let [px, py] = p(a, 0); x.moveTo(px, py);
      for (let k = 2; k + 2 < a.length; k += 2) { const [qx, qy] = p(a, k), [rx, ry] = p(a, k + 2); x.quadraticCurveTo(qx, qy, (qx + rx) / 2, (qy + ry) / 2); }
      [px, py] = p(a, a.length - 2); x.lineTo(px, py); x.stroke(); }
  }
  let irATex = null, irAKey = '', irA2Tex = null, irA2Key = '';   // (made once and reused by every build, as Vršič's)
  function irAtlas(cps, lkA) {   // text boards (8 rows of 1024 x 128): START, GOAL, CP1-CP4 with the altitude, the lookout's sign and the road's on to Akechidaira, the race's banner
    const key = cps.join('|') + lkA; if (irATex && irAKey === key) return irATex;
    if (irATex) irATex.dispose(); irAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 104, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(312, 142, 400, 100); txt('GOAL', 512, 196, 96, '#111', 380);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#8c1d1d'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffd23a', 520); });
    x.fillStyle = '#4a2f1c'; x.fillRect(0, 768, 512, 128); x.strokeStyle = '#efe3c8'; x.lineWidth = 7; x.strokeRect(7, 775, 498, 114);
    txt('KUROKAMIDAIRA', 256, 812, 50, '#f3ead6', 470); txt(lkA, 256, 860, 40, '#f3ead6', 470);
    x.fillStyle = '#1d4f9a'; x.fillRect(512, 768, 512, 128); x.strokeStyle = '#f4f3ee'; x.lineWidth = 7; x.strokeRect(519, 775, 498, 114);   // (the blue road sign: on to Akechidaira)
    txt('AKECHIDAIRA', 768, 812, 54, '#f4f3ee', 470); txt('\u2191 1 km', 768, 860, 42, '#f4f3ee', 470);
    x.fillStyle = '#f2f0ea'; x.fillRect(0, 896, 1024, 128); x.fillStyle = '#c4161c'; x.fillRect(0, 900, 1024, 10); x.fillRect(0, 1010, 1024, 10);
    txt('IROHAZAKA HILL CLIMB', 512, 962, 76, '#c4161c', 960);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (irATex = t);
  }
  function irAtlas2(cv) {   // the curves' signs (128 x 128 each, 8 a row): a white board in a blue rim, the letter (hiragana strokes) and its number of the 20
    const key = cv.map(c => c[3]).join(''); if (irA2Tex && irA2Key === key) return irA2Tex;
    if (irA2Tex) irA2Tex.dispose(); irA2Key = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d');
    cv.forEach((q, k) => { const x0 = (k % 8) * 128, y0 = Math.floor(k / 8) * 128;
      x.fillStyle = '#1d4f9a'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#f6f5f0'; x.fillRect(x0 + 8, y0 + 8, 112, 112);
      irKana(x, q[3], x0 + 22, y0 + 10, 84, '#16181c', 11);
      x.fillStyle = '#1d4f9a'; x.font = '700 21px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText((k + 1) + ' / 20', x0 + 64, y0 + 106, 100); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (irA2Tex = t);
  }
  function irTreeGeo(kind) {   // unit trees (height 1; the instances scale and tint them): 0 Japanese maple (a broad, layered crown: scarlet in autumn,
    // the instances tint it crimson, orange or yellow), 1 oak (russet), 2 beech (Vršič's: copper and gold), 3 hemlock (Vršič's spruce), 4 birch
    if (kind === 2) return vrTreeGeo(2); if (kind === 3) return vrTreeGeo(0); if (kind === 4) return vrTreeGeo(4);
    const g = new GB(), R = rng(870 + kind), rs = API.ROCK_SMOOTH, su = API.VRS === 'summer'; API.ROCK_SMOOTH = true;
    if (kind === 0) {
      cyl(g, 0, -0.02, 0, 0.026, 0.3, 4, [0.3, 0.24, 0.2], null, 0.02); cyl(g, 0.05, 0.22, 0.02, 0.016, 0.24, 3, [0.3, 0.24, 0.2], null, 0.01);
      const col = su ? [0.24, 0.42, 0.13] : [0.84, 0.15, 0.07];
      [[0, 0.62, 0, 0.36, 0.42], [0.2, 0.5, 0.12, 0.24, 0.5], [-0.2, 0.5, -0.1, 0.25, 0.5], [0.06, 0.46, -0.24, 0.22, 0.5], [-0.08, 0.48, 0.22, 0.22, 0.5], [0.02, 0.78, 0.04, 0.22, 0.55]].forEach(([x, y, z, r, sy]) => ico(g, x, y, z, r, sy, vary(col, R, 0.18), R, 0.35));
    } else {
      cyl(g, 0, -0.02, 0, 0.032, 0.42, 4, [0.32, 0.29, 0.26], null, 0.022);
      const col = su ? [0.2, 0.34, 0.12] : [0.6, 0.38, 0.13];
      ico(g, 0, 0.64, 0, 0.3, 0.75, col, R, 0.32); ico(g, 0.15, 0.52, 0.06, 0.2, 0.8, vary(col, R, 0.2), R, 0.35); ico(g, -0.14, 0.55, -0.08, 0.21, 0.8, vary(col, R, 0.2), R, 0.35);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // the view beyond the corridor (def.farDem, the real terrain on a 200 m grid; the lake; the Kegon falls at def.far.kegon): one mesh, its
  // nodes kept in world coordinates (P0) and drawn on the camera's lines of sight at a distance of their own between 70 m and 6 m inside the
  // camera's far plane (nearer ones nearer: the ridges cover what lies behind them), so the distant mountains show above the haze of the near
  // world and behind every part of it; hazed towards the fog's colour with their real distance (and all the way near the corridor's edge); not
  // where the corridor is (the nodes within 470 m of the road). irFarUpdate moves it with the camera (World.update)
  function irFar(colFn) {   // (colFn(A, slope, q): a road's own colours of the land, Mount Hotham's; else Nikko's)
    const F = T.def.farDem; if (!F) return null;
    const nx = F.nx, nz = F.nz, n = nx * nz, b = atob(F.b64), base = API.VR.D.base, H = new Float32Array(n), wet = new Uint8Array(n), dr = new Float32Array(n);
    for (let k = 0; k < n; k++) H[k] = 400 + (b.charCodeAt(2 * k) * 256 + b.charCodeAt(2 * k + 1)) / 2 - base;
    for (let k = 0, p = 0, v = 0; k < F.lake.length; k++) { if (v) wet.fill(1, p, p + F.lake[k]); p += F.lake[k]; v ^= 1; }
    const lakeH = T.def.far && T.def.far.lake ? T.def.far.lake[2] - base : 0;
    for (let k = 0; k < n; k++) if (wet[k]) H[k] = lakeH;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = F.x0 + i * F.cell, z = F.z0 + j * F.cell; let m = 1e18;
      for (let q = 0; q < T.N; q += 5) { const dx = x - T.px[q], dz = z - T.pz[q], d = dx * dx + dz * dz; if (d < m) m = d; } dr[j * nx + i] = Math.sqrt(m); }
    const P0 = [], C = [], I = [], su = API.VRS === 'summer';
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const k = j * nx + i, h = H[k], A = h + base, sl = Math.hypot(H[j * nx + Math.min(nx - 1, i + 1)] - H[j * nx + Math.max(0, i - 1)], H[Math.min(nz - 1, j + 1) * nx + i] - H[Math.max(0, j - 1) * nx + i]) / (2 * F.cell), q = rpHash(i, j) - 0.5;
      let c;
      if (wet[k]) c = [0.18, 0.27, 0.3];
      else if (colFn) c = colFn(A, sl, q);
      else {
        c = su ? [0.2 + q * 0.04, 0.33 + q * 0.05, 0.14] : [0.5 + q * 0.12, 0.3 + q * 0.06, 0.14];   // the broadleaf woods (green; autumn's reds and browns)
        const cf = sstep(1500, 1900, A); c = [lerp(c[0], 0.13, cf), lerp(c[1], 0.24, cf), lerp(c[2], 0.13, cf)];   // higher up the firs and hemlocks
        const top = sstep(2150, 2400, A) * 0.8 + sstep(0.65, 1.0, sl) * 0.6; c = [lerp(c[0], 0.42, Math.min(1, top)), lerp(c[1], 0.38, Math.min(1, top)), lerp(c[2], 0.33, Math.min(1, top))];   // scrub and bare rock near the summit, the cliffs
      }
      P0.push(F.x0 + i * F.cell, h, F.z0 + j * F.cell); C.push(c[0], c[1], c[2]);
    }
    for (let j = 0; j + 1 < nz; j++) for (let i = 0; i + 1 < nx; i++) { const a = j * nx + i, b2 = a + 1, c = a + nx, d = c + 1;
      if (Math.min(dr[a], dr[b2], dr[c], dr[d]) < 470) continue; I.push(a, c, b2, b2, c, d); }
    // the Kegon falls: a white ribbon down the cliff below the lake's outlet (97 m), a little out from the model's face, towards the road
    const K = T.def.far.kegon; if (K) { const cx = (API.VR.bx0 + API.VR.bx1) / 2, cz = (API.VR.bz0 + API.VR.bz1) / 2, dx = cx - K[0], dz = cz - K[1], l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l, px = -uz, pz = ux, o = 24, hw = 9, y0 = K[2] - base;
      const v0 = P0.length / 3; for (const [u, y] of [[-hw, y0], [hw, y0], [hw * 1.4, y0 - 97], [-hw * 1.4, y0 - 97]]) { P0.push(K[0] + ux * o + px * u, y, K[1] + uz * o + pz * u); C.push(0.93, 0.95, 0.98); }
      I.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3, v0, v0 + 2, v0 + 1, v0, v0 + 3, v0 + 2); }
    const g = new THREE.BufferGeometry(), nv = P0.length / 3;
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P0), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
    g.setAttribute('aHz', new THREE.BufferAttribute(new Float32Array(nv).fill(0.5), 1)); g.setIndex(I); g.computeVertexNormals();
    const U = { uHz: { value: new THREE.Color(0xc8d6e2) } }, m = new THREE.MeshLambertMaterial({ vertexColors: true, fog: false });
    m.onBeforeCompile = (sh) => { sh.uniforms.uHz = U.uHz;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aHz;\nvarying float vHz;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHz = aHz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uHz;\nvarying float vHz;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb = mix( gl_FragColor.rgb, uHz, vHz );'); };
    m.customProgramCacheKey = () => 'irFar';
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = -50; mesh.matrixAutoUpdate = false; mesh.name = 'irFar';
    mesh.onBeforeRender = (r, sc) => { if (sc && sc.fog) U.uHz.value.copy(sc.fog.color); };   // (the haze: the fog's colour, by the time of day and the weather)
    const rim = new Float32Array(nv); for (let k = 0; k < n; k++) rim[k] = sstep(1400, 800, dr[k]);   // (round the corridor's hole: into the haze, no ragged edge)
    return { mesh, P0: Float32Array.from(P0), rim, cx: 1e9, cy: 0, cz: 0, cf: 0 };
  }
  function irFarUpdate(F, cam) {   // (no camera: back to the nodes' own places, the world test's pose)
    F.mesh.visible = true;
    if (!cam) { if (F.cx !== 1e9) { F.mesh.geometry.attributes.position.array.set(F.P0); F.mesh.geometry.attributes.aHz.array.fill(0.5); F.mesh.geometry.attributes.position.needsUpdate = F.mesh.geometry.attributes.aHz.needsUpdate = true; F.cx = 1e9; } return; }
    const c = cam.position; if (Math.abs(c.x - F.cx) + Math.abs(c.y - F.cy) + Math.abs(c.z - F.cz) < (F.th || 0.5) && cam.far === F.cf) return;   // (F.th: a world's own step, Mount Baldy's)
    F.cx = c.x; F.cy = c.y; F.cz = c.z; F.cf = cam.far;
    const g = F.mesh.geometry, p = g.attributes.position.array, hz = g.attributes.aHz.array, P0 = F.P0, R0 = cam.far - 70, R1 = cam.far - 6;
    for (let v = 0, k = 0; k < P0.length; v++, k += 3) { const dx = P0[k] - c.x, dy = P0[k + 1] - c.y, dz = P0[k + 2] - c.z, D = Math.max(1, Math.hypot(dx, dy, dz)), r = R0 + (R1 - R0) * (1 - Math.exp(-Math.max(0, D - 400) / 3000)), f = r / D;
      p[k] = c.x + dx * f; p[k + 1] = c.y + dy * f; p[k + 2] = c.z + dz * f; hz[v] = Math.max(F.rim[v], 0.3 + 0.5 * (1 - Math.exp(-Math.max(0, D - 500) / 5000))); }
    g.attributes.position.needsUpdate = true; g.attributes.aHz.needsUpdate = true;
  }
  function buildIroha(scene, tex, opts) {
    const R = rng(8611), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    const root = new THREE.Group(); scene.add(root);
    API.VRS = opts.season === 'autumn' || opts.season === 'winter' ? 'autumn' : 'summer';   // (as Vršič: the autumn colours; winter snows them over)
    const out = { root, dyn: {}, groundH: vrGround, camFloor: vrGround, props: [], farClip: true, ownTex: [], season: API.VRS, paintFor: (s) => (s === 'autumn' || s === 'winter' ? 'autumn' : 'summer') };
    vrPrep(); vrStubs();
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS, base = P.D.base, CV = def.curves || [];
    // the Kurokamidaira lookout's car park (by its name on the HUD), on the side where the ground lies nearer the road's height and no other leg
    // of the ladder is near; a lay-by just past the line (the race's people and their cars)
    const lk = T.names.find(q => q.n === 'Razgledišče Kurokamidaira'), padL = lk ? (() => { const i = T.idx(sStart + lk.d); let best = null;
      for (const sd of [-1, 1]) { const o = (sd > 0 ? T.br[i] : T.bl[i]) + 12, x = T.px[i] + T.nx[i] * sd * o, z = T.pz[i] + T.nz[i] * sd * o, nn = vrNear(x, z);
        if (nn.i >= 0 && Math.abs(nn.i - i) * T.ds > 60) continue;
        const e = Math.abs(vrFar(x, z) - T.hy[i]); if (!best || e < best.e) best = { x, z, e, sd }; }
      return best && { x: best.x, z: best.z, r: 11, b: 14, h: T.hy[i] - 0.25, sd: best.sd, i }; })() : null;
    if (padL) P.pads.push(padL);
    const iF = T.idx(sFin + 34), sdP = (() => { const gd = (sd) => Math.abs(vrFar(T.px[iF] + T.nx[iF] * sd * 26, T.pz[iF] + T.nz[iF] * sd * 26) - T.hy[iF]); return gd(1) < gd(-1) ? 1 : -1; })();
    const oP = (sdP > 0 ? T.br[iF] : T.bl[iF]) + 13, padP = { x: T.px[iF] + T.nx[iF] * sdP * oP, z: T.pz[iF] + T.nz[iF] * sdP * oP, r: 12, b: 16, h: T.hy[iF] - 0.25 };
    P.pads.push(padP);
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (ouCutMat: the trees between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // tree exclusion circles, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    exclPush(padP.x, padP.z, padP.r + 4); if (padL) exclPush(padL.x, padL.z, padL.r + 4);
    out.marks = padL ? { Kurokamidaira: [padL.x, padL.z] } : {};   // (where the landmarks stand: the tests look for them)

    /* ---- terrain tiles ---- */
    let nFar = 0;
    const tMat = pkGroundMat(), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = vrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(vrTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
    }

    /* ---- the road: asphalt, the white dashed line between the two lanes and the solid white edge lines (Japan's markings), a gravel shoulder,
       then the verge out to a ditch past the barrier line; on a bridge the deck out to its parapets (120 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const addM = (g, mat, cast, grp) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; (grp || root).add(m); return m; };
    const finG = new THREE.Group(); finG.name = 'vrFin'; root.add(finG); out.dyn.vrFin = finG;   // (the race's finish: the gantry, the line, the flags, the crowd)
    const onBr = new Uint8Array(N), sw = 0.6;
    for (const [a, b] of def.bridges || []) for (let s = sStart + a - 3; s <= sStart + b + 3; s += T.ds / 2) { const i = T.idx(s); if (i > 0 && i < iE) onBr[i] = 1; }
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w;
      if (onBr[i]) return [[e + sw, -0.02], [bar - 0.45, -0.02], [bar + 0.58, -0.02], [bar + 0.62, -1.3], [bar + 0.68, -1.4]];
      const y = T.hy[i], gAt = (o) => { const q = side * o; return vrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.86 - 0.13 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.88) k -= 0.04; return [k, k, k * 1.02]; };
      const wht = [0.95, 0.95, 0.92], gc = [0.8, 0.78, 0.74], deck = [0.64, 0.63, 0.6];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (onBr[i]) return k < 3 ? deck : [0.52, 0.51, 0.49];
          if (k === 4) return vrGCol(x, z);
          const sl = k === 2 ? vrSlope(x, z) : 0; return vrCol(x, z, T.hy[i] + y, 1 / Math.sqrt(1 + sl * sl), Math.max(0, o - bar)).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), gl = new GB(), gs = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / 6, s1 = j * T.ds / 6;
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
            gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
          const ln = [[w - 0.45, w - 0.3], [-(w - 0.3), -(w - 0.45)]];   // (the edge lines)
          if (Math.floor(i / 2) % 4 < 2) ln.push([-0.07, 0.07]);   // (between the lanes: 4 m dashes, 4 m gaps)
          for (const [o0, o1] of ln) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [wht, wht, wht, wht]);
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j], sc = onBr[i] ? deck : gc;
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [sc, sc, sc, sc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
        }
        addM(gr, aMat); addM(gl, lMat); addM(gs, sMat); addM(gv, gMat);
      }
      // chequered start and finish lines (the finish's in its group), a white line at each checkpoint
      const gq = new GB(true), gqF = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1];
      for (const s0 of [sStart, sFin]) { const a = atSf(s0 - 0.8, -w), b = atSf(s0 - 0.8, w), c = atSf(s0 + 0.8, w), d = atSf(s0 + 0.8, -w), y = (p) => T.hy[p[3]] + 0.045;
        (s0 === sFin ? gqF : gq).quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]); }
      for (const s0 of T.cpS) { const a = atSf(s0 - 0.25, -w + 0.1), b = atSf(s0 - 0.25, w - 0.1), c = atSf(s0 + 0.25, w - 0.1), d = atSf(s0 + 0.25, -w + 0.1), y = (p) => T.hy[p[3]] + 0.042;
        gw.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [wht, wht, wht, wht]); }
      tex.checker.repeat.set(1, 1); const qMat = new THREE.MeshLambertMaterial({ map: tex.checker }); addM(gq, qMat); addM(gqF, qMat, false, finG); addM(gw, lMat);
    }

    /* ---- scenery (vertex coloured, 110 m chunks) ---- */
    const scen = new Chunks(110), ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];   // (ban: the race's boards, ban2: the curves' signs)
    const finS = new GB(), finB = new GB(true);
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.86, 0.14, 0.12], [0.96, 0.82, 0.2], [0.16, 0.36, 0.78], [0.95, 0.95, 0.95], [0.2, 0.6, 0.3], [1, 0.55, 0.1], [0.12, 0.14, 0.2], [0.55, 0.3, 0.6]];
    const CR = crowdCtx({ gH: vrGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: () => false }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1; tilt leans its top towards +t
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const arch = (s, rowK, postCol, beamCol, G, B) => {   // gantry over the road: two posts at the barriers, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.9, L2 = T.br[i] + 0.9, g = G || scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], Math.min(12.8, L1 + L2 - 1), 1.6 * Math.min(12.8, L1 + L2 - 1) / 12.8, v0, v1, 0, 1, B);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, col) => crowdPut(CR, x, vrGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: col || fans[Math.floor(R() * fans.length)] }, 1);
    const carPk = (x, z, rot, col) => { const g = scen.get(x, z), y = vrGround(x, z), c = Math.cos(rot), s = Math.sin(rot);   // parked car
      parkedCar(g, x, y, z, rot, col); };   // (the car: parkedCar in js/world.js)
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)]))), lkAlt = fmtAlt(T.altAt(padL ? T.hy[padL.i] : T.hy[T.finishIdx]));

    /* ---- START (Umagaeshi): gantry with the start lights, the timing tent, pennants along the grid, the road closed behind it ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i], g = scen.get(x, z);
      box(g, x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);   // light panel on top of the beam
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 5, -1, 3.2), hy = vrGround(hx, hz), gh = scen.get(hx, hz);   // the timing tent: white, on four legs
      for (const [a, b] of [[-1.9, -1.4], [1.9, -1.4], [1.9, 1.4], [-1.9, 1.4]]) { const c = Math.cos(T.hd[i]), s = Math.sin(T.hd[i]); box(gh, hx + c * a - s * b, hy - 0.2, hz + s * a + c * b, 0.08, 2.5, 0.08, T.hd[i], [0.75, 0.76, 0.78]); }
      box(gh, hx, hy + 2.25, hz, 4.0, 0.3, 3.0, T.hd[i], [0.95, 0.95, 0.94]); gable(gh, hx, hy + 2.5, hz, 4.1, 3.1, 0.7, T.hd[i], [0.95, 0.95, 0.94], [0.95, 0.95, 0.94]);
      box(gh, hx, hy, hz, 2.4, 0.8, 0.7, T.hd[i], [0.3, 0.3, 0.32]);
      exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3.2, T.hd[i]);
      for (let s = sStart - 60; s < sStart + 50; s += 10) for (const side of [-1, 1]) { const [px, pz] = onSide(s, side, 1.3); if (excluded(px, pz) && s > sStart - 8) continue;   // pennants on poles
        const gp = scen.get(px, pz), py = vrGround(px, pz), col = fans[Math.floor(rpHash(Math.round(s), side + 3) * fans.length)]; cyl(gp, px, py - 0.2, pz, 0.05, 5.2, 4, [0.9, 0.9, 0.92]);
        const ii = T.idx(s); box(gp, px + T.tx[ii] * 0.45, py + 4.2, pz + T.tz[ii] * 0.45, 0.9, 1.6, 0.04, T.hd[ii], col); }
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road behind: concrete blocks across it
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      { const [bx, bz, bi] = onSide(sStart + 16, -1, 1.6), by = vrGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        bannerQ(bx, by + 1.5, bz, T.nx[bi], T.nz[bi], 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); }
    }

    /* ---- checkpoints: a red gantry "CPn  altitude" ---- */
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.55, 0.12, 0.12]));

    /* ---- the car parks (padL: the Kurokamidaira lookout, its sign facing the arriving cars and a railing over the valley; padP: the lay-by past
       the finish): parked cars and people ---- */
    const park = (pd, i, sd, rail, n) => {
      const hh = T.hd[i], c = Math.cos(hh), sn = Math.sin(hh), cars = [[0.95, 0.95, 0.94], [0.12, 0.12, 0.14], [0.62, 0.64, 0.66], [0.72, 0.1, 0.1], [0.2, 0.32, 0.55], [0.9, 0.9, 0.88]];
      for (let k = 0; k < 8; k++) { const a = -12 + (k % 4) * 6.5, b = (k < 4 ? -4 : 4) * sd, px = pd.x - sn * b + c * a, pz = pd.z + c * b + sn * a; if (vrNear(px, pz).dd < 1.5) continue; carPk(px, pz, hh + PI / 2, vary(cars[k % cars.length], R, 0.1)); }
      for (let k = 0; k < n; k++) { const px = pd.x + (R() - 0.5) * 20, pz = pd.z + (R() - 0.5) * 20; if (vrNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
      if (rail) for (let a = -12; a < 12; a += 2) { const b = 9 * sd, px = pd.x - sn * b + c * a, pz = pd.z + c * b + sn * a, py = vrGround(px, pz), g = scen.get(px, pz);   // (timber posts and two rails along its far edge)
        box(g, px, py - 0.2, pz, 0.14, 1.3, 0.14, hh, [0.4, 0.3, 0.2]); for (const yy of [0.55, 1.0]) box(g, px + c, py + yy, pz + sn, 2.0, 0.09, 0.09, hh, [0.46, 0.34, 0.22]); }
    };
    const signAt = (s, sd, u0, u1) => {   // a board on posts leaning back, facing the arriving cars (atlas row 6, the half u0..u1)
      const [sx, sz, si] = onSide(s, sd, 3.2), sy = vrGround(sx, sz), gs = scen.get(sx, sz), tl = 0.9, W2 = 4.4, H2 = W2 / 4;
      for (const o of [-1.8, 1.8]) { const px = sx + T.nx[si] * o, pz = sz + T.nz[si] * o; box(gs, px, sy, pz, 0.22, 1.3, 0.22, T.hd[si], [0.36, 0.24, 0.14]); box(gs, px + T.tx[si] * H2 * Math.sin(tl), sy, pz + T.tz[si] * H2 * Math.sin(tl), 0.22, 1.25 + H2 * Math.cos(tl), 0.22, T.hd[si], [0.36, 0.24, 0.14]); }
      box(gs, sx + T.tx[si] * 0.3, sy - 0.3, sz + T.tz[si] * 0.3, 1.3, 0.6, W2 + 0.9, T.hd[si], [0.5, 0.49, 0.47], [0.58, 0.57, 0.55]);
      { const [v0, v1] = row(6); bannerQ(sx, sy + 1.2, sz, T.tx[si], T.tz[si], W2, H2, v0, v1, u0, u1, null, tl); }
      exclPush(sx, sz, 4);
    };
    if (padL) { park(padL, padL.i, padL.sd, true, 14); signAt(padL.i * T.ds - 14, padL.sd, 0, 0.5); }

    /* ---- FINISH (just past curve ね): chequered gantry and flags (finG), the blue sign on to Akechidaira, the lay-by with the race's cars and
       people, the road closed farther on ---- */
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12], finS, finB);
      for (const side of [-1, 1]) for (let s = sFin - 28; s < sFin + 12; s += 7) { const [px, pz, ii] = onSide(s, side, 1.4), py = vrGround(px, pz), gg = finS;
        cyl(gg, px, py, pz, 0.06, 5, 5, [0.9, 0.9, 0.92]);
        for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) box(gg, px + T.tx[ii] * (0.36 + a * 0.55), py + 3.8 + b * 0.55, pz + T.tz[ii] * (0.36 + a * 0.55), 0.55, 0.55, 0.05, T.hd[ii], (a + b) % 2 ? [0.08, 0.08, 0.08] : [0.96, 0.96, 0.96], null, true); }
      signAt(sFin + 18, -sdP, 0.5, 1); park(padP, iF, sdP, false, 18);
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;   // the end of the road drawn: concrete blocks across it
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[iE], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
    }

    /* ---- retaining walls where the slope rises steeply beside the road (stone masonry, the stones laid on the diagonal, or concrete with weep
       holes, by stretches), white guardrails where the ground falls away and round the outside of the hairpins, concrete parapets on the
       bridges; a delineator post every ~50 m where there is neither (knockable where it fits) ---- */
    let nRail = 0, nWall = 0;
    {
      const mkPosts = [], need = [new Uint8Array(N), new Uint8Array(N)], wall = [new Float32Array(N), new Float32Array(N)];
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 8); k <= Math.min(N - 1, c.i1 + 8); k++) need[sd][k] = 1; }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i], si = side > 0 ? 1 : 0, gA = (d) => { const o = side * (bar + d); return vrGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) - T.hy[i]; };
        for (const d of [4, 8, 13, 19, 26]) if (gA(d) < -(d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[si][i] = 1; if (i + 1 < N) need[si][i + 1] = 1; break; }
        const rise = Math.max(gA(2.5), gA(5) - 1); if (rise > 2.2) { wall[si][i] = rise; if (i + 1 < N) wall[si][i + 1] = rise; } }
      const iS0 = T.idx(sStart + 40), iS1 = T.idx(sFin - 40), white = [0.92, 0.92, 0.9], whiteB = [0.72, 0.72, 0.7], postC = [0.86, 0.86, 0.84];
      for (const side of [-1, 1]) {
        const si = side > 0 ? 1 : 0, nd = need[si], wl = wall[si], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) { if (i < iS0 || i > iS1 || onBr[i]) { nd[i] = 0; wl[i] = 0; } if (wl[i] > 0) nd[i] = 0; }
        for (const a of [nd, wl]) {
          for (let i = 1, last = -1; i < N; i++) { if (a[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) a[k] = a[k] || a[last]; last = i; } }   // close short gaps
          for (let i = 0; i < N;) { if (!a[i]) { i++; continue; } let j = i; while (j < N && a[j]) j++; if (j - i < 8) for (let k = i; k < j; k++) a[k] = 0; i = j; }   // drop tiny bits
        }
        { const sm = Float32Array.from(wl); for (let i = 0; i < N; i++) if (wl[i]) { let s = 0, n = 0; for (let k = -6; k <= 6; k++) { const v = wl[clamp(i + k, 0, N - 1)]; if (v) { s += v; n++; } } sm[i] = s / n; } wl.set(sm); }   // (the wall's height eased along it)
        nRail += nd.reduce((a, b) => a + b, 0); nWall += wl.reduce((a, b) => a + (b > 0 ? 1 : 0), 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          const g = scen.get(T.px[i], T.pz[i]);
          if (onBr[i] && onBr[i + 1]) {   // a bridge: a concrete parapet
            const a = Q(i, -0.1, -0.05), b = Q(i + 1, -0.1, -0.05), c = Q(i + 1, 0.95, -0.05), d = Q(i, 0.95, -0.05), a2 = Q(i, -0.1, 0.4), b2 = Q(i + 1, -0.1, 0.4), c2 = Q(i + 1, 0.95, 0.4), d2 = Q(i, 0.95, 0.4), inn = Q(i, 0.4, 0.18);
            g.quadO(a, b, c, d, [0.7, 0.69, 0.66], inn); g.quadO(a2, b2, c2, d2, [0.6, 0.59, 0.56], inn); g.quadO(d, c, c2, d2, [0.78, 0.77, 0.74], inn);
          } else if (wl[i] > 0 && wl[i + 1] > 0) {   // the retaining wall: up from the ditch to the slope behind, leaning back a little; three courses (stone) or lifts (concrete)
            const stone = rpHash(Math.floor(i / 45), side + 11) < 0.55, hi = clamp(wl[i] * 0.95 + 0.6, 1.8, 8), hj = clamp(wl[i + 1] * 0.95 + 0.6, 1.8, 8);
            const at = (k, f, h) => Q(k, -0.45 + h * f, 0.25 + 0.22 * h * f);
            for (let r = 0; r < 3; r++) { const f0 = r / 3, f1 = (r + 1) / 3, q = rpHash(i, r * 7 + side);
              const col = stone ? (((i + r) % 2) ? [0.56 + q * 0.08, 0.54 + q * 0.07, 0.5 + q * 0.06] : [0.5 + q * 0.07, 0.48 + q * 0.06, 0.45 + q * 0.06]) : [0.7 + q * 0.03 - r * 0.02, 0.7 + q * 0.03 - r * 0.02, 0.68 + q * 0.03 - r * 0.02];
              g.quadO(at(i, f0, hi), at(i + 1, f0, hj), at(i + 1, f1, hj), at(i, f1, hi), col, Q(i, hi / 2, 4)); }
            const tA = at(i, 1, hi), tB = at(i + 1, 1, hj), off = (p) => [p[0] + T.nx[i] * side * 0.45, p[1] + 0.05, p[2] + T.nz[i] * side * 0.45];
            g.quadO(tA, tB, off(tB), off(tA), stone ? [0.52, 0.5, 0.46] : [0.74, 0.74, 0.72], [tA[0], tA[1] - 3, tA[2]]);   // (its top)
            if (!stone && i % 4 === 0 && hi > 2.4) { const p = Q(i, 0.6, 0.25 + 0.22 * 1.05 - 0.02); box(g, p[0], p[1], p[2], 0.2, 0.2, 0.06, T.hd[i] + PI / 2, [0.18, 0.18, 0.18]); }   // (a weep hole)
          } else if (nd[i] && nd[i + 1]) {   // the white W-beam guardrail: a front and a back face, a post every 4 m
            const a = Q(i, 0.45), b = Q(i + 1, 0.45), c = Q(i + 1, 0.8), d = Q(i, 0.8), ins = Q(i, 0.6, 3), ino = Q(i, 0.6, -3);
            g.quadO(a, b, c, d, white, ins); g.quadO(a, b, c, d, whiteB, ino);
            if (i % 2 === 0) { const p = Q(i, -0.35, 0.14); box(g, p[0], p[1], p[2], 0.13, 1.13, 0.13, T.hd[i], postC, null, true); }
          } else if (!onBr[i] && i % 25 === 0 && i > 2 && i < iE - 2) mkPosts.push([i, side]);
        }
      }
      const kp = vrsicProps(out, mkPosts, (i, side) => vp[side > 0 ? 1 : 0][i]).spots;   // knockable where they fit on the verge; the rest stay fixed beside the barrier line
      for (const sp of mkPosts) { if (kp.has(sp)) continue;
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]);
        box(g, p[0], p[1] - 0.2, p[2], 0.13, 1.2, 0.13, T.hd[i], [0.94, 0.94, 0.92], null, true); box(g, p[0], p[1] + 0.72, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.9, 0.5, 0.1], null, true); }
    }

    /* ---- the curves' signs (the letter and its number) 25 m before each, on the left (Japan's side of the road), facing the cars coming up ---- */
    CV.forEach(([d], k) => {
      const [px, pz, ii] = onSide(sStart + d - 25, -1, 0.9); if (excluded(px, pz)) return;
      const py = vrGround(px, pz), g = scen.get(px, pz), u0 = (k % 8) / 8, v1 = 1 - Math.floor(k / 8) / 4;
      box(g, px, py - 0.2, pz, 0.08, 2.2, 0.08, T.hd[ii], [0.6, 0.61, 0.63]);
      bannerQ(px, py + 1.25, pz, -T.tx[ii], -T.tz[ii], 0.9, 0.9, v1 - 1 / 4, v1, u0, u0 + 1 / 8, ban2);
      exclPush(px, pz, 1.5); CR.avoid(px, pz, 0.8);
    });

    /* ---- spectators: the start and the finish (the finish's in a layer of its own, CRF: finG), the checkpoints, every third hairpin ---- */
    const CRF = crowdSub(CR);
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.6, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.25, flag: 0.1, keepBar: 1.6 };
      const run = (sa, sb, side, o, C) => crowdRun(C || CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 70, sStart + 70, sd, { rows: 3, dens: 0.6, label: 'IR start' }); run(sFin - 70, sFin + 14, sd, { rows: 3, dens: 0.6, label: 'IR finish' }, CRF); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 24, s0 + 20, side, { rows: 2, dens: 0.55, label: 'IR cp+' }); run(s0 - 20, s0 + 16, -side, { rows: 2, dens: 0.4, label: 'IR cp-' }); });
      CV.forEach(([d, , turn], k) => { if (k % 3 !== 1) return; const sm = sStart + d; for (const sd of [-1, 1]) run(sm - 22, sm + 22, sd, { rows: 3, dens: sd === turn ? 0.5 : 0.35, flag: 0.15, label: 'IR hairpin ' + (k + 1) }); });
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);   // the trees keep clear of the crowds

    /* ---- the forest (instanced per 96 m chunk): maples, oaks and beeches, hemlocks and a few cedars among them (more beeches and birches higher
       up), right up to the ditch, thinner and bigger farther out; in autumn the maples scarlet, crimson, orange and yellow, the oaks russet,
       the beeches gold ---- */
    const tMatT = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const tk = [0, 1, 2, 3, 4].map(k => new IChunks(irTreeGeo(k), tMatT, 96));
    let nTrees = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(110000 * dens), RT = rng(8641), SP = 5.4 / Math.sqrt(dens), su = API.VRS === 'summer';
      const MAPLE = su ? [[1, 1, 1], [0.92, 1.05, 0.9], [1.1, 1.02, 1.05], [0.95, 0.95, 1]] : [[1, 1, 1], [0.8, 0.55, 0.9], [1.08, 2.7, 1.3], [1.1, 4.0, 1.6], [0.6, 3.1, 2.0], [1.02, 1.6, 1.0]];   // (autumn: scarlet, crimson, orange, yellow, still green, red-orange)
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > LOD.radius(250)) continue;
          if (hd > LOD.radius(90) && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;   // farther out every other spot (bigger trees)
          const c = vrLC(x, z), p = c === 1 ? 0.95 : c === 2 ? 0.55 : c === 0 ? 0.12 : c === 3 ? 0.06 : 0.03;
          if (r1 > p) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 2.2) continue; if (nn.i >= 0 && nn.dd < 5 && r2 < 0.15) continue;
          if (excluded(x, z)) continue;
          const y = vrGround(x, z), A = y + base, up = sstep(950, 1200, A); if (vrSlope(x, z) > 1.3) continue;   // (none on the cliffs)
          const pM = lerp(0.36, 0.3, up) + (nn.i >= 0 && nn.dd < 16 ? 0.12 : 0), pO = lerp(0.26, 0.16, up), pB = lerp(0.1, 0.24, up), pH = 0.17, sp = r3 < pM ? 0 : r3 < pM + pO ? 1 : r3 < pM + pO + pB ? 2 : r3 < pM + pO + pB + pH ? 3 : 4;   // (more maples by the road, where the light is)
          const far = hd > 90 ? 1.15 : 1;
          let hgt, wid, col;
          if (sp === 0) { hgt = 9 + r4 * 7; wid = hgt * (0.85 + r2 * 0.3); col = MAPLE[Math.floor(r2 * 997) % MAPLE.length]; }
          else if (sp === 1) { hgt = 15 + r4 * 8; wid = hgt * (0.72 + r2 * 0.2); col = su ? [0.95 + r2 * 0.1, 1, 0.95] : (r2 < 0.3 ? [1.2, 1.25, 1.1] : r2 < 0.75 ? [1, 1, 1] : [0.8, 0.7, 0.8]); }
          else if (sp === 2) { hgt = 15 + r4 * 9; wid = hgt * (0.8 + r2 * 0.25); col = su ? [1, 1, 1] : (r2 < 0.4 ? [1.08, 1.2, 0.95] : r2 < 0.8 ? [1, 1, 1] : [0.86, 0.74, 0.66]); }
          else if (sp === 3) { const cedar = r2 < 0.3; hgt = (cedar ? 24 : 18) + r4 * 10; wid = hgt * (cedar ? 0.3 : 0.45 + r2 * 0.1); col = [0.88 + r3 * 0.2, 0.92 + r4 * 0.14, 0.9]; }
          else { hgt = 10 + r4 * 6; wid = hgt * (0.6 + r2 * 0.2); col = [1, 1, 1]; }
          tk[sp].add(x, y - 0.15, z, r1 * 70, wid * far, hgt * far, col);
          if (++nTrees >= maxT) break grid;
        }
      }
    }
    for (const t of tk) t.addTo(root, true);

    /* ---- the verges: sasa (dwarf bamboo, green the year round) under the trees behind the barrier, shrubs in their autumn colours, grey andesite
       boulders and crags where the slope is steep ---- */
    {
      const RV = rng(8651), su = API.VRS === 'summer', sasa = [[0.24, 0.4, 0.14], [0.28, 0.44, 0.16], [0.21, 0.36, 0.13]], bushC = su ? [[0.3, 0.44, 0.16], [0.26, 0.4, 0.14]] : [[0.78, 0.3, 0.1], [0.72, 0.56, 0.16], [0.6, 0.2, 0.12], [0.5, 0.4, 0.15]];
      const andes = [[0.5, 0.49, 0.47], [0.44, 0.43, 0.42], [0.56, 0.54, 0.5]];
      API.ROCK_SMOOTH = true;
      for (let s = 4; s < T.len - 4; s += 2.8) for (const side of [-1, 1]) {
        const r = RV(), [x, z] = onSide(s, side, 1.2 + RV() * 7);
        if (vrNear(x, z).dd < 0.8 || excluded(x, z)) continue;
        const y = vrGround(x, z), g = scen.get(x, z);
        if (r < 0.32) { const col = vary(sasa[Math.floor(RV() * 3)], RV, 0.15); for (let q = 0; q < 3; q++) ico(g, x + (RV() - 0.5) * 1.6, y + 0.2, z + (RV() - 0.5) * 1.6, 0.5 + RV() * 0.4, 0.55, col, RV, 0.4); }
        else if (r < 0.44) ico(g, x, y + 0.4, z, 0.7 + RV() * 0.7, 0.8, vary(bushC[Math.floor(RV() * bushC.length)], RV, 0.15), RV, 0.3);
      }
      for (let s = 10; s < T.len - 10; s += 7) for (const side of [-1, 1]) {   // boulders at the foot of the slopes
        if (RV() > 0.25) continue;
        const o = 1.6 + Math.pow(RV(), 1.5) * 40, [x, z] = onSide(s, side, o), sz = 0.5 + RV() * 1.2; if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z) || vrDist(x, z) > LOD.cap(90)) continue;
        const y = vrGround(x, z), sl = vrSlope(x, z); if (sl < 0.4) continue;
        rock(scen.get(x, z), x, y + sz * 0.3, z, sz * 1.2, sz, sz, RV() * TAU, vary(andes[Math.floor(RV() * 3)], RV, 0.1), RV, 0.3);
      }
      API.ROCK_SMOOTH = false;
      for (let s = 16; s < T.len - 16; s += 18) for (const side of [-1, 1]) {   // crags where the slope is steep
        if (RV() < 0.5) continue;
        const [x, z] = onSide(s, side, 8 + RV() * 60); if (excluded(x, z) || vrNear(x, z).dd < 6 || vrDist(x, z) > LOD.cap(90)) continue;
        if (vrSlope(x, z) < 0.75) continue;
        const g = scen.get(x, z), n = 2 + Math.floor(RV() * 3), b0 = vary(andes[Math.floor(RV() * 3)], RV, 0.08);
        for (let q = 0; q < n; q++) { const r0 = 2 + RV() * 3.2, qx = x + (RV() - 0.5) * 7, qz = z + (RV() - 0.5) * 7, qy = vrGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 1) continue;
          rock(g, qx, qy + r0 * 0.4, qz, r0, r0 * (0.8 + RV() * 0.8), r0 * (0.7 + RV() * 0.4), RV() * TAU, vary(b0, RV, 0.08), RV, 0.35); }
      }
    }

    /* ---- the view: Mount Nantai, the valley, the lake and the Kegon falls beyond the corridor (irFar; World.update moves it with the camera) ---- */
    const FAR = irFar(); if (FAR) { root.add(FAR.mesh); out.dyn.irFar = FAR; }

    /* ---- finish the meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const banMat = new THREE.MeshLambertMaterial({ map: irAtlas(cpAlt, lkAlt), side: THREE.FrontSide });
    const bm = addM(ban, banMat, true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: irAtlas2(CV), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    addM(finS, matV, true, finG); addM(finB, banMat, false, finG);
    crowdFinish(CR, root, out);
    out.crowdN += crowdLayer(CRF, finG);
    out.stats = { trees: nTrees, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, rails: +(nRail / (2 * N)).toFixed(3), walls: +(nWall / (2 * N)).toFixed(3), signs: CV.length, far: FAR ? FAR.P0.length / 3 : 0 };   // (read by the tests)
    return out;
  }

  Object.assign(API, { irFar, irFarUpdate });   // (what World and the other worlds use of this one)
  World.ext.iroha = (scene, tex, opts) => buildIroha(scene, tex, opts);
})();
