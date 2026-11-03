/* =========================================================================
   WORLD — Sani Pass (theme 'sani'): its own builder (World.ext.sani), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (LOD, T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    CA_SNC, Chunks, GB, IChunks, TAU, VRC, VRT, atSf, box, caCar, caCondorGeo, caCondors, caGH, caGround, caPlantGeo, caSlope, caTileOn, clamp,
    cone, crowdCtx, crowdFinish, crowdPut, crowdRun, cyl, gable, ico, lerp, ouCutMat, ouRoadTex, pkGroundMat, propFloorTable, rng, roadsideProps,
    rock, sstep, tuftWindMat, valueNoise2, vary, vrDist, vrFar, vrGritTex, vrLC, vrLCf, vrNear, vrPrep, parkOn
  } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ================= SANI PASS (theme 'sani') =================
     Sani Pass (the Drakensberg, KwaZulu-Natal and Lesotho): the gravel road up the escarpment, its last 5 km from the valley of the Mkhomazana
     (~2230 m) up the hairpins under the basalt cliffs to the top of the escarpment (~2870 m), where the gravel ends below the border post. Built
     on Vršič's corridor (vrPrep reads def.dem and def.lc) with the terrain of Los Caracoles (caH: the road's blend carried along its grade, the
     real terrain farther out) and a look of its own, painted for the season (SAS, from the game's setting; the world is as built in every
     season, out.ownSeason): grassy slopes, green in summer, golden in autumn, brown in the dry winter with snow on the shady (south-facing)
     slopes up high and the waterfalls frozen; dark basalt faces and crags (the steep ground of the model, OpenStreetMap's cliffs: def.cliffs),
     boulders by the road, the streams in their gullies and the cascades where they fall steeply (def.streams), fords where they cross the
     road (def.fords), at the top the bare plateau with short grass, the stone houses and round huts of Sani Top (def.bld), the kraals' stone
     walls (def.kraals), flocks of sheep and goats, a generic border post with a raised boom (def.border: no signs, flags or names), vultures
     soaring over the road (Los Caracoles' condors' flight). The road: gravel with two wheel tracks (Ouninpohja's), asphalt past the finish
     (def.paved), the puddles in the rain. */
  let SAS = 'summer';                          // the season the world is painted in (buildSani, from opts.season)
  const SACOL = [0, 0, 0];
  function saSnow(x, z, A, ny, sz) {   // the winter's snow at (x, z): on the shady south-facing slopes from ~2650 m, on the plateau in drifts, off the steep faces
    if (SAS !== 'winter') return 0;
    const P = API.VR, line = 2640 - 180 * clamp(sz * 2.2, -1, 1) + (P.c4(x, z) - 0.5) * 220;
    return sstep(line, line + 120, A) * sstep(0.5, 0.72, ny) * sstep(0.45, 0.7, P.c5(x, z) + 0.25 * sstep(line, line + 300, A));
  }
  function saCol(x, z, h, ny, sz, dd, sx) {   // ground colour (times the grey grit map): the grass of the slopes in the season's colour, in patches; the wetlands
    // greener (browner in the winter); the basalt dark grey-brown in bands on the steep faces (lc 1 and the steep ground); shrubs olive; Sani Top's
    // trodden earth; the snow; a trodden gravel verge
    const P = API.VR, A = h + P.D.base, m = P.c1(x, z), q = P.c2(x, z), f = P.n4(x, z);
    const rk = vrLCf(x, z, 1), sh = vrLCf(x, z, 2), vi = vrLCf(x, z, 3), wt = vrLCf(x, z, 4);
    const G0 = SAS === 'summer' ? [0.43, 0.53, 0.25] : SAS === 'autumn' ? [0.66, 0.57, 0.33] : [0.55, 0.45, 0.3], G1 = SAS === 'summer' ? [0.55, 0.58, 0.3] : SAS === 'autumn' ? [0.72, 0.62, 0.38] : [0.6, 0.5, 0.34];
    const k = sstep(0.3, 0.75, m);
    let R = lerp(G0[0], G1[0], k), G = lerp(G0[1], G1[1], k), B = lerp(G0[2], G1[2], k);
    R += (f - 0.5) * 0.08; G += (f - 0.5) * 0.08; B += (f - 0.5) * 0.05;
    const hi = sstep(2780, 2860, A) * 0.35; R = lerp(R, R * 1.06, hi); G = lerp(G, G * 0.96, hi);   // (the plateau's short grass: paler)
    const wc = SAS === 'summer' ? [0.32, 0.46, 0.22] : [0.48, 0.42, 0.28]; R = lerp(R, wc[0], wt * 0.7); G = lerp(G, wc[1], wt * 0.7); B = lerp(B, wc[2], wt * 0.7);
    R = lerp(R, 0.36, sh * 0.5); G = lerp(G, 0.4, sh * 0.5); B = lerp(B, 0.22, sh * 0.5);
    R = lerp(R, 0.56, vi * 0.55); G = lerp(G, 0.48, vi * 0.55); B = lerp(B, 0.37, vi * 0.55);
    const st = Math.max(sstep(0.62, 0.42, ny), rk * sstep(0.9, 0.72, ny) * 0.85), bank = sstep(0.82, 0.6, ny) * (1 - st);   // the basalt: bands along the height; the steep earthy banks between the legs
    R = lerp(R, 0.5, bank * 0.6); G = lerp(G, 0.43, bank * 0.6); B = lerp(B, 0.32, bank * 0.6);
    if (st > 0) { const band = 0.5 + 0.5 * Math.sin(A / 5.5 + q * 6), kk = 0.82 + 0.2 * band; R = lerp(R, 0.37 * kk, st); G = lerp(G, 0.34 * kk, st); B = lerp(B, 0.31 * kk, st); }
    if (sx != null && st < 0.5) { const hz = Math.hypot(sx, sz), fan = sstep(0.18, 0.4, hz) * (1 - st); if (fan > 0) { const u = (z * sx - x * sz) / hz, w = Math.sin(u * 0.2 + P.c5(x, z) * 5) * fan * 0.04; R += w; G += w; B += w * 0.7; } }   // (runnels down the fall line)
    const sn = saSnow(x, z, A, ny, sz); R = lerp(R, CA_SNC[0], sn); G = lerp(G, CA_SNC[1], sn); B = lerp(B, CA_SNC[2], sn);
    if (dd < 4) { const t = sstep(4, 0.5, dd) * 0.5 * (1 - sn); R = lerp(R, 0.6, t); G = lerp(G, 0.54, t); B = lerp(B, 0.45, t); }
    SACOL[0] = R; SACOL[1] = G; SACOL[2] = B; return SACOL;
  }
  function saGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (as caGCol)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = caGH(ii, jj);
      const nx = -(caGH(ii + 1, jj) - caGH(ii - 1, jj)) / (2 * VRC), nz = -(caGH(ii, jj + 1) - caGH(ii, jj - 1)) / (2 * VRC), l = Math.hypot(nx, 1, nz), c = saCol(G.x0 + ii * VRC, G.z0 + jj * VRC, h, 1 / l, nz / l, G.dd[jj * G.nx + ii], nx / l);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function saTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex), as caTileGeo, coloured by saCol
    const G = API.VR.G, m = VRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * VRT, j0 = tj * VRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * VRC, z = G.z0 + j * VRC, h = caGH(i, j);
      let nx = -(caGH(i + st, j) - caGH(i - st, j)) / (2 * VRC * st), nz = -(caGH(i, j + st) - caGH(i, j - st)) / (2 * VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = saCol(x, z, h, ny, nz, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)], nx); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      uv[k * 2] = x / 10; uv[k * 2 + 1] = -z / 10; stp[k] = sstep(0.78, 0.5, ny);
    }
    if (st === 1) {   // (no cracks against a coarse neighbour: as vrTileGeo)
      const nb = (a, b) => (a >= 0 && b >= 0 && a < G.ntx && b < G.ntz ? caTileOn(a, b) : 0);
      const fix = (k0, dk) => { for (let q = 1; q < m; q += 2) { const a = k0 + (q - 1) * dk, b = k0 + (q + 1) * dk; pos[(k0 + q * dk) * 3 + 1] = (pos[a * 3 + 1] + pos[b * 3 + 1]) / 2; } };
      if (nb(ti, tj - 1) === 2) fix(0, 1); if (nb(ti, tj + 1) === 2) fix(m * n, 1); if (nb(ti - 1, tj) === 2) fix(0, n); if (nb(ti + 1, tj) === 2) fix(m, n);
    }
    const idx = new Uint16Array(m * m * 6); k = 0;
    for (let b = 0; b < m; b++) for (let a = 0; a < m; a++) { const p = b * n + a, q = p + 1, c = p + n, d = c + 1; idx[k++] = p; idx[k++] = c; idx[k++] = q; idx[k++] = q; idx[k++] = c; idx[k++] = d; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('steep', new THREE.BufferAttribute(stp, 1)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere(); return g;
  }
  let saATex = null, saAKey = '';   // (the board atlas, made once and reused by every build of the road)
  function saAtlas(cps, finA) {   // text boards (8 rows of 1024 x 128): START, FINISH, CP1-CP4 with the altitude, the pass's board, the chevrons (row 7: two cells of 128)
    const key = cps.join('|') + '|' + finA; if (saATex && saAKey === key) return saATex;
    if (saATex) saATex.dispose(); saAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 100, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(282, 142, 460, 100); txt('FINISH', 512, 196, 92, '#111', 430);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#7a3b1c'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffd23a', 520); });
    x.fillStyle = '#3c3a33'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#efe3c8'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);
    txt('SANI PASS', 512, 812, 58, '#f3ead6', 900); txt(finA, 512, 862, 46, '#f3ead6', 900);
    for (const [k, dir] of [[0, 1], [1, -1]]) {   // the chevrons: black arrows on yellow, pointing the way the road turns
      const x0 = k * 128, y0 = 896; x.fillStyle = '#f1c21b'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#16181c';
      for (const o of [-26, 14]) { x.beginPath(); const cx = x0 + 64 + o * dir; x.moveTo(cx - 14 * dir, y0 + 22); x.lineTo(cx + 18 * dir, y0 + 64); x.lineTo(cx - 14 * dir, y0 + 106); x.lineTo(cx - 34 * dir, y0 + 106); x.lineTo(cx - 2 * dir, y0 + 64); x.lineTo(cx - 34 * dir, y0 + 22); x.closePath(); x.fill(); } }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (saATex = t);
  }
  function saSheepGeo(goat) {   // a sheep (cream fleece, dark face and legs) or a goat (brown and white, small horns): x forward, ~1.2 m long
    const g = new GB(), R = rng(goat ? 3307 : 3301), fl = goat ? [0.46, 0.34, 0.24] : [0.88, 0.85, 0.76], dk = goat ? [0.86, 0.84, 0.8] : [0.14, 0.12, 0.11];
    API.ROCK_SMOOTH = true; ico(g, 0, 0.72, 0, goat ? 0.36 : 0.44, goat ? 0.85 : 0.8, fl, R, 0.15); ico(g, -0.26, 0.7, 0, goat ? 0.3 : 0.38, 0.85, fl, R, 0.15); API.ROCK_SMOOTH = false;
    box(g, 0.56, 0.86, 0, 0.32, 0.22, 0.2, 0, dk);   // the head
    for (const [u, v] of [[0.3, -0.13], [0.3, 0.13], [-0.4, -0.13], [-0.4, 0.13]]) box(g, u, 0, v, 0.08, 0.5, 0.08, 0, dk);
    if (goat) for (const v of [-0.05, 0.05]) box(g, 0.5, 1.02, v, 0.18, 0.04, 0.03, 0.6, [0.3, 0.27, 0.22]);
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function buildSani(scene, tex, opts) {
    const R = rng(3211), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    SAS = opts.season === 'autumn' || opts.season === 'winter' ? opts.season : 'summer';
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: caGround, camFloor: caGround, props: [], farClip: true, ownTex: [], dust: [0.78, 0.69, 0.56], season: SAS, ownSeason: true, paintFor: (s) => (s === 'autumn' || s === 'winter' ? s : 'summer') };
    vrPrep();
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS, base = P.D.base;
    P.c1 = valueNoise2(731, 120); P.c2 = valueNoise2(732, 60); P.c3 = valueNoise2(733, 190); P.c4 = valueNoise2(734, 110); P.c5 = valueNoise2(735, 24);
    P.fin = [T.px[T.finishIdx], T.pz[T.finishIdx]];
    const bord = def.border || [T.px[iE], T.pz[iE], T.len - sStart];
    // the buildings (def.bld [x, z, length, width, angle, kind 0 a stone house / 2 a round hut]): clear of the road
    const blds = [];
    for (const [x, z, L, W, ang, kind] of def.bld || []) {
      const c = Math.cos(ang), s = Math.sin(ang); let ok = true;
      for (const [u, v] of [[0, 0], [-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]]) { const n = vrNear(x + c * u - s * v, z + s * u + c * v); if (n.i >= 0 && n.dd < 1.5) ok = false; }
      if (ok) blds.push({ x, z, L: Math.min(L, 30), W: Math.min(W, 16), ang, kind });
    }
    // the car park past the finish (beside the road, on the side nearer the road's height) and the border post's yard
    const padBeside = (s, r) => { const i = T.idx(s), gd = (sd) => Math.abs(vrFar(T.px[i] + T.nx[i] * sd * r, T.pz[i] + T.nz[i] * sd * r) - T.hy[i]), sd = gd(1) < gd(-1) ? 1 : -1, o = (sd > 0 ? T.br[i] : T.bl[i]) + r + 1;
      return { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r, b: 16, h: T.hy[i] - 0.25, sd, i }; };
    const padF = padBeside(sFin + 45, 12); P.pads.push(padF);
    const iB = T.idx(sStart + bord[2]), sdB = -padF.sd, oB = (sdB > 0 ? T.br[iB] : T.bl[iB]) + 6;
    const padB = { x: T.px[iB] + T.nx[iB] * sdB * oB, z: T.pz[iB] + T.nz[iB] * sdB * oB, r: 7, b: 12, h: T.hy[iB] - 0.2 }; P.pads.push(padB);
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    for (const b of blds) exclPush(b.x, b.z, Math.hypot(b.L, b.W) / 2 + 2);
    exclPush(padF.x, padF.z, padF.r + 4); exclPush(padB.x, padB.z, padB.r + 4);
    out.marks = { border: [padB.x, padB.z] };   // (where the landmarks stand: the tests look for them)

    /* ---- terrain tiles ---- */
    let nFar = 0;
    const tMat = pkGroundMat(), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = caTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(saTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
    }

    /* ---- the road: gravel (Ouninpohja's) with two darker wheel tracks along the driving line and loose gravel on the crown and the shoulders, the
       asphalt past the finish (def.paved), then the verge: a stony shoulder, a shallow ditch past the barrier line, onto the ground (120 m chunks) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const rTex = ouRoadTex(), rMat = new THREE.MeshPhongMaterial({ map: rTex.map, bumpMap: rTex.bump, bumpScale: 0.05, shininess: 4, specular: 0x16130f, vertexColors: true }); out.asphaltMat = rMat;
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i], gAt = (o) => { const q = side * o; return caGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; };
      const lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      return [[w, 0.01], [w + 0.7, -0.03], lift(Math.max(w + 1.3, bar - 0.7), -0.1), [bar + 0.45, Math.min(-0.3, gAt(bar + 0.45) - 0.2)], [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    {
      const tileL = 7, grav = [1.06, 1.0, 0.92], ash = [0.84, 0.84, 0.86], pav = T.pavedAt;
      const cols = (i) => { const rl = clamp(T.rl[i], -w + 1.9, w - 1.9); return [-w, -w + 0.4, rl - 1.6, rl - 1.15, rl - 0.65, rl - 0.25, rl + 0.25, rl + 0.65, rl + 1.15, rl + 1.6, w - 0.4, w]; };
      const shade = (i, o) => { if (pav && pav[i]) return ash; const a = Math.abs(o - T.rl[i]), trk = sstep(0.45, 0.72, a) * sstep(1.45, 1.18, a), ao = Math.abs(o);
        let k = 1.0 - 0.2 * trk + 0.05 * sstep(0.5, 0.2, a);
        const outer = Math.sign(o) === -Math.sign(T.k[i]) ? sstep(1 / 300, 1 / 40, Math.abs(T.k[i])) : 0;
        k += (0.06 + 0.08 * outer) * sstep(w - 1.1 - 1.2 * outer, w - 0.3, ao) * (1 - trk);
        k *= 0.92 + 0.14 * P.n2(T.px[i] * 0.7 + 50, T.pz[i] * 0.7);
        return [grav[0] * k, grav[1] * k, grav[2] * k]; };
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
        if (k === 4) return saGCol(x, z); if (k <= 1) return [0.62, 0.57, 0.5]; const sl = caSlope(x, z), l = Math.sqrt(1 + sl * sl); return saCol(x, z, T.hy[i] + y, 1 / l, 0, k === 2 ? 1 : 3).slice(); })); return a; });
      const wuv = (p) => [p[0] / 9, -p[2] / 9];
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), ga = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, oi = cols(i), oj = cols(j), gg = pav && pav[i] && pav[j] ? ga : gr;
          for (let c = 0; c < oi.length - 1; c++) { const a0 = oi[c], a1 = oi[c + 1], b0 = oj[c], b1 = oj[c + 1];
            gg.quadUp(Pt(i, a0, 0.02), Pt(i, a1, 0.02), Pt(j, b1, 0.02), Pt(j, b0, 0.02), [shade(i, a0), shade(i, a1), shade(j, b1), shade(j, b0)], [[(a0 + w) / tileL, v0], [(a1 + w) / tileL, v0], [(b1 + w) / tileL, v1], [(b0 + w) / tileL, v1]]); }
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, qi = vp[si][i], qj = vp[si][j], ci = vc[si][i], cj = vc[si][j];
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
        }
        addM(gr, rMat); addM(ga, aMat); addM(gv, gMat);
      }
      // a white line across the road at the start and the finish, a thinner one at each checkpoint
      const gl = new GB(), wht = [0.96, 0.96, 0.94];
      for (const [s0, hw] of [[sStart, 0.4], [sFin, 0.4]].concat(T.cpS.map(s => [s, 0.2]))) { const a = atSf(s0 - hw, -w + 0.1), b = atSf(s0 - hw, w - 0.1), c = atSf(s0 + hw, w - 0.1), d = atSf(s0 + hw, -w + 0.1), y = (p) => T.hy[p[3]] + 0.04;
        gl.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [wht, wht, wht, wht]); }
      addM(gl, new THREE.MeshLambertMaterial({ vertexColors: true }));
    }

    /* ---- scenery (vertex coloured, 110 m chunks) ---- */
    const scen = new Chunks(110), ban = new GB(true), W1 = [1, 1, 1];
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.84, 0.12, 0.12], [0.95, 0.95, 0.95], [0.12, 0.36, 0.2], [0.18, 0.3, 0.66], [0.96, 0.72, 0.16], [0.42, 0.26, 0.16], [0.6, 0.12, 0.32], [0.12, 0.14, 0.2]];   // (shirts and the Basotho blankets' colours)
    const CR = crowdCtx({ gH: caGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: () => false, shirts: fans }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, Wd, H, v0, v1, u0, u1, tilt) => {   // double-sided board (as Los Caracoles')
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = Wd / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        ban.quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];
    const arch = (s, rowK, postCol, beamCol) => {   // a gantry over the road: two posts at the barriers, a beam, a board both ways
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.6, L2 = T.br[i] + 0.6, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.5, 7.0, 0.5, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.5, 7.0, 0.5, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 5.8, cz, 0.5, 0.6, L1 + L2 + 0.5, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.1, z, T.tx[i], T.tz[i], 10.4, 1.3, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 5); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro) => crowdPut(CR, x, caGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: fans[Math.floor(R() * fans.length)] }, 1);
    const carCols = [[0.92, 0.92, 0.9], [0.62, 0.6, 0.55], [0.2, 0.22, 0.24], [0.55, 0.12, 0.1], [0.75, 0.68, 0.52], [0.2, 0.3, 0.42]];
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- the buildings of Sani Top: dry-stone round huts under thatched cones, stone houses under low corrugated roofs ---- */
    let nBld = 0;
    {
      const RB = rng(3221), stone = [[0.56, 0.52, 0.47], [0.5, 0.47, 0.43], [0.6, 0.55, 0.48], [0.47, 0.43, 0.39]], thatch = SAS === 'summer' ? [0.6, 0.52, 0.34] : [0.56, 0.48, 0.32], roofs = [[0.5, 0.52, 0.54], [0.44, 0.3, 0.22], [0.6, 0.6, 0.6]];
      for (const b of blds) {
        const g = scen.get(b.x, b.z), c = Math.cos(b.ang), s = Math.sin(b.ang); let lo = 1e9, hi = -1e9;
        for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const y = caGround(b.x + c * u - s * v, b.z + s * u + c * v); lo = Math.min(lo, y); hi = Math.max(hi, y); }
        const sc = vary(stone[Math.floor(RB() * stone.length)], RB, 0.12);
        if (b.kind === 2) { const r = Math.max(1.4, Math.min(3.6, (b.L + b.W) / 4)); cyl(g, b.x, lo - 0.3, b.z, r, hi - lo + 2.4, 9, sc); cone(g, b.x, hi + 2.05, b.z, r * 1.22, r * 1.15, 9, vary(thatch, RB, 0.12), vary(thatch, RB, 0.2), 0); }
        else { box(g, b.x, lo - 0.3, b.z, b.L, hi - lo + 2.9, b.W, b.ang, sc, null, true); gable(g, b.x, hi + 2.55, b.z, b.L + 0.4, b.W + 0.4, Math.min(b.L, b.W) * 0.12, b.ang, vary(roofs[Math.floor(RB() * 3)], RB, 0.12), sc); }
        CR.block(b.x, b.z, b.L + 1, b.W + 1, b.ang); nBld++;
      }
      // the kraals' dry-stone walls (def.kraals: 1) and fences (0): a low wall of stacked stones, or posts and wire
      for (const k of def.kraals || []) { const wall = k[k.length - 1], n = (k.length - 1) / 2;
        for (let q = 0; q < n - 1; q++) { const x0 = k[2 * q], z0 = k[2 * q + 1], x1 = k[2 * q + 2], z1 = k[2 * q + 3], L = Math.hypot(x1 - x0, z1 - z0), steps = Math.max(1, Math.round(L / (wall ? 2.4 : 3)));
          for (let t = 0; t < steps; t++) { const f = (t + 0.5) / steps, x = lerp(x0, x1, f), z = lerp(z0, z1, f); const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 1) continue; const y = caGround(x, z), g = scen.get(x, z);
            if (wall) box(g, x, y - 0.25, z, L / steps + 0.1, 1.25, 0.6, Math.atan2(z1 - z0, x1 - x0), vary(stone[t % 4], RB, 0.1)); else cyl(g, x, y - 0.2, z, 0.06, 1.4, 4, [0.4, 0.32, 0.22]); } } }
    }

    /* ---- START (at the foot of the climb), the checkpoints, FINISH below the border post, the board of the pass, the car park; the border post: a plain
       office, a booth and a raised boom over the road (generic: no signs or flags) ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i];
      box(scen.get(x, z), x, y + 6.45, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.0, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road below: concrete blocks across it
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      for (let k = 0; k < 4; k++) { const [px, pz, ii] = onSide(sStart - 30 - k * 9, k % 2 ? 1 : -1, 3), h = T.hd[ii]; if (excluded(px, pz)) continue; parkOn(caCar, caGround, 4.4, scen.get(px, pz), px, caGround(px, pz), pz, h, vary(carCols[k % carCols.length], R, 0.15)); exclPush(px, pz, 4); }
    }
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.45, 0.2, 0.1]));
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      const [sx, sz, si] = onSide(sFin + 16, padF.sd, 2.6), sy = caGround(sx, sz), gs = scen.get(sx, sz), tl = 0.9, W2 = 6, H2 = W2 / 8;   // the board of the pass, facing the arriving cars
      for (const o of [-2.4, 2.4]) { const px = sx + T.nx[si] * o, pz = sz + T.nz[si] * o; box(gs, px, sy, pz, 0.22, 1.2, 0.22, T.hd[si], [0.3, 0.24, 0.16]); }
      box(gs, sx + T.tx[si] * 0.35, sy - 0.3, sz + T.tz[si] * 0.35, 1.3, 0.6, W2 + 0.9, T.hd[si], [0.36, 0.34, 0.31], [0.42, 0.4, 0.37]);
      { const [v0, v1] = row(6); bannerQ(sx, sy + 1.1, sz, T.tx[si], T.tz[si], W2, H2, v0, v1, 0, 1, tl); }
      exclPush(sx, sz, 4);
      const hh = T.hd[padF.i], c = Math.cos(hh), sn = Math.sin(hh);
      for (let k = 0; k < 8; k++) { const a = -12 + (k % 4) * 8, b = (k < 4 ? -4 : 4) * padF.sd, px = padF.x - sn * b + c * a, pz = padF.z + c * b + sn * a; if (vrNear(px, pz).dd < 1.5 || k === 5) continue;
        parkOn(caCar, caGround, 4.4, scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2, vary(carCols[k % carCols.length], R, 0.2)); }
      // the border post: the office on its yard, a booth by the road, the boom raised over the road
      const g = scen.get(padB.x, padB.z), hb = T.hd[iB];
      box(g, padB.x, padB.h - 0.4, padB.z, 9, 3.4, 5.5, hb, [0.86, 0.84, 0.78], null, true); box(g, padB.x, padB.h + 3.0, padB.z, 9.8, 0.3, 6.3, hb, [0.46, 0.48, 0.5], [0.52, 0.54, 0.56], true);
      for (const u of [-2.5, 0, 2.5]) box(g, padB.x + Math.cos(hb) * u - sdB * T.nx[iB] * 2.8, padB.h + 0.9, padB.z + Math.sin(hb) * u - sdB * T.nz[iB] * 2.8, 1.2, 1.0, 0.06, hb, [0.2, 0.26, 0.32]);   // (windows towards the road)
      const [bx, bz] = onSide(sStart + bord[2] + 4, sdB, 1.2), by = caGround(bx, bz), gb = scen.get(bx, bz);
      box(gb, bx, by - 0.2, bz, 2.0, 2.6, 2.0, hb, [0.9, 0.9, 0.88], [0.46, 0.48, 0.5], true);
      const [px, pz] = onSide(sStart + bord[2], sdB, 0.5), py = caGround(px, pz), gp = scen.get(px, pz); box(gp, px, py - 0.2, pz, 0.35, 1.3, 0.35, hb, [0.3, 0.3, 0.32]);
      for (let k = 0; k < 8; k++) box(gp, px, py + 1.3 + k * 0.6, pz, 0.14, 0.6, 0.14, hb, k % 2 ? [0.95, 0.95, 0.95] : [0.8, 0.12, 0.1]);   // the boom, raised
      exclPush(bx, bz, 3); exclPush(px, pz, 1.5); CR.block(padB.x, padB.z, 10, 7, hb);
      for (let k = 0; k < 14; k++) { const px2 = padF.x + (R() - 0.5) * 22, pz2 = padF.z + (R() - 0.5) * 22; if (vrNear(px2, pz2).dd < 1) continue; person(px2, pz2, R() * TAU); }
    }

    /* ---- chevrons on the outside of every hairpin, facing the cars coming into it; a white-painted stone every ~25 m where the ground falls away
       (no guardrails on Sani Pass) ---- */
    (def.curves || []).forEach(([d, , turn]) => {
      const cell = turn > 0 ? 0 : 1, u0 = cell / 8, v0 = 0, v1 = 1 / 8, out_ = -turn;
      for (const o of [-10, 0, 10]) { const [cx, cz, ci] = onSide(sStart + d + o, out_, 0.6); if (excluded(cx, cz)) continue;
        const cy = caGround(cx, cz), g = scen.get(cx, cz), fx = T.px[ci] - cx, fz = T.pz[ci] - cz, fl = Math.hypot(fx, fz) || 1, tx = -T.tx[ci] * 0.75 + fx / fl * 0.25, tz = -T.tz[ci] * 0.75 + fz / fl * 0.25, tl = Math.hypot(tx, tz);
        box(g, cx, cy - 0.2, cz, 0.08, 1.4, 0.08, T.hd[ci], [0.6, 0.61, 0.63]); bannerQ(cx, cy + 0.65, cz, tx / tl, tz / tl, 0.65, 0.65, v0, v1, u0, u0 + 1 / 8); CR.avoid(cx, cz, 0.6); }
    });
    {
      const spots = [];
      for (let i = T.idx(sStart + 30); i < T.idx(sFin - 30); i += 12) for (const side of [-1, 1]) { const o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 2);
        if (caGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - 2) spots.push([i, side]); }
      out.propR = 150; out.propFloor = propFloorTable(null, (i, side) => vp[side > 0 ? 1 : 0][i]);
      out.propStats = roadsideProps(out.props, { spots, postEdge: [1.2, 1.6], postCol: () => 0, exits: 0, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
        floor: out.propFloor, skip: (i) => { const s = i * T.ds; return s < sStart + 30 || s > sFin - 30; } });
    }

    /* ---- the streams (def.streams) in their gullies: water draped on the ground, white cascades where they fall steeply (ice in the winter), a
       stony ford where one crosses the road (def.fords) ---- */
    let nFall = 0;
    {
      const gw = new GB(true), gc = new GB(), wc = SAS === 'winter' ? [0.62, 0.7, 0.76] : [0.2, 0.27, 0.27], foam = SAS === 'winter' ? [0.86, 0.92, 0.97] : [0.9, 0.93, 0.95];
      for (const st of def.streams || []) {
        const p = st.p, n = p.length / 2;
        for (let q = 0; q < n - 1; q++) {
          const x0 = p[2 * q], z0 = p[2 * q + 1], x1 = p[2 * q + 2], z1 = p[2 * q + 3], L = Math.hypot(x1 - x0, z1 - z0), steps = Math.max(1, Math.round(L / 4));
          for (let t = 0; t < steps; t++) {
            const xa = lerp(x0, x1, t / steps), za = lerp(z0, z1, t / steps), xb = lerp(x0, x1, (t + 1) / steps), zb = lerp(z0, z1, (t + 1) / steps);
            if (vrDist((xa + xb) / 2, (za + zb) / 2) > 430) continue; const na = vrNear(xa, za), nb = vrNear(xb, zb); if ((na.i >= 0 && na.dd < 0.5) || (nb.i >= 0 && nb.dd < 0.5)) continue;
            const ya = caGround(xa, za) + 0.12, yb = caGround(xb, zb) + 0.12, dl = Math.hypot(xb - xa, zb - za) || 1, ux = -(zb - za) / dl, uz = (xb - xa) / dl, steep = Math.abs(yb - ya) / dl, hw = 0.45 + 0.4 * sstep(0.4, 0.05, steep);
            const c = steep > 0.45 ? foam : wc;
            gw.quadUp([xa - ux * hw, ya, za - uz * hw], [xa + ux * hw, ya, za + uz * hw], [xb + ux * hw, yb, zb + uz * hw], [xb - ux * hw, yb, zb - uz * hw], [c, c, c, c], [[0, ya / 6], [0.3, ya / 6], [0.3, yb / 6], [0, yb / 6]]);
            if (steep > 0.8) { nFall++; const g = scen.get(xa, za); rock(g, xa + ux * 2.2, ya + 0.4, za + uz * 2.2, 1.4, 1.1, 1.2, R() * TAU, [0.34, 0.32, 0.3], R, 0.3); rock(g, xa - ux * 2.2, ya + 0.4, za - uz * 2.2, 1.3, 1.0, 1.2, R() * TAU, [0.36, 0.33, 0.31], R, 0.3); }   // (the black rock either side of a cascade)
          }
        }
      }
      for (const [d] of def.fords || []) { const s = sStart + d; if (s < 4 || s > T.len - 4) continue;   // the ford: a darker wet band of stones across the road
        for (let o = -w; o < w; o += 1.0) { const a = atSf(s - 1.0, o), b = atSf(s - 1.0, o + 1), c = atSf(s + 1.0, o + 1), dd = atSf(s + 1.0, o), y = (q) => T.hy[q[3]] + 0.035, col = [0.34, 0.31, 0.27];
          gc.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [dd[0], y(dd), dd[1]], [col, col, col, col]); } }
      if (!gw.empty) { const m = new THREE.Mesh(gw.geometry(), new THREE.MeshPhongMaterial({ map: tex.water, vertexColors: true, shininess: 50, specular: 0x2a3a44 })); m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); out.dyn.water = tex.water; }
      addM(gc, new THREE.MeshLambertMaterial({ vertexColors: true }));
    }

    /* ---- the basalt: crags along OpenStreetMap's cliffs (def.cliffs) and where the slope is steep beside the road, boulders on the verges ---- */
    {
      const RV = rng(3231), bas = [[0.34, 0.32, 0.3], [0.4, 0.37, 0.33], [0.3, 0.29, 0.28], [0.44, 0.4, 0.35]];
      for (const cl of def.cliffs || []) { const n = cl.length / 2;
        for (let q = 0; q < n - 1; q++) { const x0 = cl[2 * q], z0 = cl[2 * q + 1], x1 = cl[2 * q + 2], z1 = cl[2 * q + 3], L = Math.hypot(x1 - x0, z1 - z0), ux = (z1 - z0) / (L || 1), uz = -(x1 - x0) / (L || 1);   // (u: to the right of the line, down the face)
          for (let t = 0; t < L; t += 9) { const f = t / L, x = lerp(x0, x1, f) + ux * 5, z = lerp(z0, z1, f) + uz * 5; if (vrDist(x, z) > 420 || excluded(x, z)) continue; const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 8) continue;
            const y = caGround(x, z), g = scen.get(x, z), r0 = 3 + RV() * 4, c = vary(bas[Math.floor(RV() * bas.length)], RV, 0.1);
            rock(g, x, y + r0 * 0.3, z, r0, r0 * (1.1 + RV() * 0.9), r0 * (0.7 + RV() * 0.3), RV() * TAU, c, RV, 0.3);
            if (SAS === 'winter' && RV() < 0.3) for (let k = 0; k < 4; k++) box(g, x + ux * r0 * 0.8 + (RV() - 0.5) * r0, y - 0.5, z + uz * r0 * 0.8 + (RV() - 0.5) * r0, 0.25, 1.2 + RV() * 2, 0.25, 0, [0.86, 0.92, 0.98]);   // (icicles)
          } } }
      for (let s = 16; s < T.len - 16; s += 14) for (const side of [-1, 1]) {   // crags where the slope is steep
        if (RV() < 0.45) continue;
        const [x, z] = onSide(s, side, 6 + RV() * 60); if (excluded(x, z) || vrNear(x, z).dd < 5) continue;
        const sl = caSlope(x, z); if (sl < 0.75) continue;
        const y = caGround(x, z), g = scen.get(x, z), n = 2 + Math.floor(RV() * 3), b0 = vary(bas[Math.floor(RV() * bas.length)], RV, 0.08);
        for (let q = 0; q < n; q++) { const r0 = 1.8 + RV() * 3.5, qx = x + (RV() - 0.5) * 7, qz = z + (RV() - 0.5) * 7, qy = caGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 1) continue;
          rock(g, qx, qy + r0 * 0.4, qz, r0, r0 * (0.9 + RV() * 0.8), r0 * (0.7 + RV() * 0.4), RV() * TAU, vary(b0, RV, 0.08), RV, 0.35); }
      }
      for (let s = 10; s < T.len - 10; s += 5) for (const side of [-1, 1]) {   // boulders fallen onto the verges
        if (RV() > 0.3) continue;
        const o = 1.2 + Math.pow(RV(), 1.6) * 30, [x, z] = onSide(s, side, o), sz = 0.35 + RV() * 1.2; if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z) || vrDist(x, z) > LOD.cap(90)) continue;
        rock(scen.get(x, z), x, caGround(x, z) + sz * 0.3, z, sz * 1.2, sz, sz, RV() * TAU, vary(bas[Math.floor(RV() * bas.length)], RV, 0.12), RV, 0.32);
      }
    }

    /* ---- spectators: the start, the checkpoints, the finish, a few hairpins ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.2, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.3, flag: 0.06, keepBar: 1.4 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 40, sStart + 40, sd, { rows: 2, dens: 0.5, label: 'SA start' }); run(sFin - 60, sFin + 10, sd, { rows: 2, dens: 0.5, label: 'SA finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 20, s0 + 16, side, { rows: 2, dens: 0.4, label: 'SA cp' }); });
      (def.curves || []).forEach(([d, , turn], k) => { if (k % 3 !== 1) return; run(sStart + d - 18, sStart + d + 18, -turn, { rows: 2, dens: 0.35, label: 'SA hairpin ' + (k + 1) }); });
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the plants (instanced per 96 m chunk): tussocks of grass on the slopes (green, golden or brown with the season), shrubs in the gullies, boulders
       and stones; none on the road, the steep basalt or the snow ---- */
    const pMat = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const wMat = tuftWindMat(out.dyn.wind || (out.dyn.wind = { value: 0 })), wB = wMat.onBeforeCompile; ouCutMat(wMat, cut);
    { const cB = wMat.onBeforeCompile; wMat.onBeforeCompile = (sh) => { wB(sh); cB(sh); }; wMat.customProgramCacheKey = () => 'tuftWindCut'; wMat.side = THREE.FrontSide; }
    const pk = [0, 1, 3, 4].map(k => new IChunks(caPlantGeo(k), k === 0 ? wMat : pMat, k === 4 ? 64 : 96));
    const tuftC = SAS === 'summer' ? [0.62, 0.95, 0.56] : SAS === 'autumn' ? [1.0, 0.96, 0.78] : [0.86, 0.76, 0.62];
    let nPlants = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(60000 * dens), RT = rng(3241), SP = 3.4 / Math.sqrt(dens);
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > LOD.radius(230)) continue;   // (LOD: a shorter plant/tree draw distance on the lower tiers)
          if (hd > LOD.radius(70) && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;
          const c = vrLC(x, z), y0 = caGround(x, z), A = y0 + base, sl = caSlope(x, z);
          let kind = -1;
          if (c === 0 || c === 4) kind = r1 < (A > 2800 ? 0.3 : 0.5) ? 0 : r1 < 0.52 ? 2 : -1;
          else if (c === 2) kind = r1 < 0.35 ? 1 : r1 < 0.6 ? 0 : -1;
          else if (c === 1) kind = r1 < 0.05 ? 2 : r1 < 0.12 ? 0 : -1;
          if (kind < 0) continue;
          if (sl > (kind === 2 ? 1.1 : 0.85)) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 1.6) continue;
          if (excluded(x, z)) continue;
          const ny = 1 / Math.sqrt(1 + sl * sl); if (saSnow(x, z, A, ny, 0) > 0.35) continue;
          if (kind === 0) pk[0].add(x, y0 - 0.05, z, r2 * TAU, 0.5 + r3 * 0.5, 0.4 + r4 * 0.35, [tuftC[0] * (0.92 + r2 * 0.16), tuftC[1] * (0.92 + r3 * 0.12), tuftC[2] * (0.88 + r4 * 0.16)]);
          else if (kind === 1) pk[1].add(x, y0 - 0.1, z, r2 * TAU, 0.6 + r3 * 0.9, 0.5 + r4 * 0.6, [0.82 + r2 * 0.2, 0.95 + r3 * 0.12, 0.8]);
          else { const k = 0.6 + r3 * 0.2; pk[2].add(x, y0 - 0.15, z, r4 * TAU, 0.5 + r3 * 1.3, 0.4 + r4 * 0.9, [k, k * 0.97, k * 0.95]); }
          if (++nPlants >= maxT) break grid;
        }
      }
      const RS = rng(3247), maxS = Math.round(20000 * dens); let nS = 0;   // the stones strewn beside the road
      edge: for (let s = 12; s < T.len - 12; s += 1.0 / dens) for (const side of [-1, 1]) {
        const o = 1.5 + Math.pow(RS(), 2) * 36, [x, z] = onSide(s, side, o), r2 = RS(), r3 = RS();
        if (vrNear(x, z).dd < 1.2 || excluded(x, z)) continue;
        const y0 = caGround(x, z), sl = caSlope(x, z); if (sl > 1.15) continue;
        const k = 0.6 + r3 * 0.22, sc = 0.8 + RS() * 1.1 - 0.006 * o; pk[3].add(x, y0 - 0.04, z, r2 * TAU, sc, sc * (0.8 + r3 * 0.5), [k, k * 0.97, k * 0.94]);
        if (++nS >= maxS) break edge;
      }
    }
    for (const t of pk) t.addTo(root, false);

    /* ---- the flocks: sheep and goats grazing on the plateau and the slopes below it, a herder in a blanket with each ---- */
    let nSheep = 0;
    {
      const RF = rng(3251), sh = new IChunks(saSheepGeo(false), pMat, 96), gt = new IChunks(saSheepGeo(true), pMat, 96);
      const spots = [[sFin + 140, padF.sd, 60], [sFin - 160, -padF.sd, 45], [sStart + 3300, 1, 40], [sStart + 1200, -1, 35]];
      for (const [s, side, off] of spots) {
        if (s < 0 || s > T.len) continue; const [cx, cz] = onSide(s, side, off), n = 10 + Math.floor(RF() * 12);
        let placed = 0;
        for (let k = 0; k < n * 3 && placed < n; k++) { const x = cx + (RF() - 0.5) * 34, z = cz + (RF() - 0.5) * 34; const nn = vrNear(x, z); if ((nn.i >= 0 && nn.dd < 3) || excluded(x, z) || caSlope(x, z) > 0.6) continue;
          (RF() < 0.3 ? gt : sh).add(x, caGround(x, z), z, RF() * TAU, 0.9 + RF() * 0.25, 0.9 + RF() * 0.2, [1, 1, 1]); placed++; nSheep++; }
        person(cx + 6, cz - 4, RF() * TAU);
      }
      sh.addTo(root, true); gt.addTo(root, true);
    }

    /* ---- the puddles of a race in the rain (T.puddles; as Ouninpohja's) ---- */
    if (T.puddles.length) {
      const g = new GB(), PP = (s, d) => { const f = s / T.ds, i = clamp(Math.floor(f), 0, T.N - 2), t = f - i, j = i + 1, nx = lerp(T.nx[i], T.nx[j], t), nz = lerp(T.nz[i], T.nz[j], t);
        return [lerp(T.px[i], T.px[j], t) + nx * d, lerp(T.hy[i], T.hy[j], t) + 0.035, lerp(T.pz[i], T.pz[j], t) + nz * d]; };
      const SKY = [0.55, 0.59, 0.63], MID = [0.4, 0.38, 0.35], RIM = [0.32, 0.27, 0.21], n = 14, RP = rng(7541);
      for (const [s, d, hl, hw] of T.puddles) {
        const c = PP(s, d), below = [c[0], c[1] - 5, c[2]], ph = RP() * TAU, wob = [];
        for (let k = 0; k < n; k++) { const a = k / n * TAU; wob.push([Math.cos(a), Math.sin(a), 0.84 + 0.16 * Math.sin(a * 3 + ph) * Math.cos(a * 2 - ph)]); }
        const ring = (f) => wob.map(([cx, sz, ww]) => PP(s + cx * hl * ww * f, d + sz * hw * ww * f)), I = ring(0.62), O = ring(1);
        for (let k = 0; k < n; k++) { const m = (k + 1) % n; g.triO(c, I[k], I[m], SKY, below); g.triO(I[k], O[k], O[m], MID, below, RIM, RIM); g.triO(I[k], O[m], I[m], MID, below, RIM, MID); }
      }
      const m = new THREE.Mesh(g.geometry(), new THREE.MeshBasicMaterial({ vertexColors: true })); m.matrixAutoUpdate = false; m.visible = false; m.name = 'puddles'; root.add(m);
      out.dyn.wet = { puddles: m, road: rMat, ground: gMat, base: { sh: rMat.shininess, sp: rMat.specular.getHex() } };
    }

    /* ---- finish the meshes; vultures soaring over the road (Los Caracoles' condors' flight) ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: saAtlas(cpAlt, fmtAlt(T.altAt(T.hy[T.finishIdx]))), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    { const geo = caCondorGeo(), mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), i0 = T.idx(sStart), L = [];
      for (const [r, sp, h, ox, oz, ph] of [[52, 0.14, 55, 30, -20, 0], [40, -0.18, 70, -40, 25, 2.1]]) {
        const m = new THREE.Mesh(geo, mat); m.scale.setScalar(1.1); m.castShadow = true; root.add(m); L.push({ m, r, sp, h, ox, oz, ph, bank: 0.3 }); }
      out.dyn.condors = { L, x0: T.px[i0], z0: T.pz[i0], y0: T.hy[i0], ax: T.px[i0], az: T.pz[i0], ay: T.hy[i0], t: null };
      caCondors(out.dyn.condors, 0, null); }
    crowdFinish(CR, root, out);
    out.stats = { plants: nPlants, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, sheep: nSheep, falls: nFall };   // (read by the tests)
    return out;
  }

  World.ext.sani = (scene, tex, opts) => buildSani(scene, tex, opts);
})();
