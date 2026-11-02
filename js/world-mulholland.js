/* =========================================================================
   WORLD — the Santa Monica Mountains road (theme 'mulholland'): its own builder (World.ext.mulholland), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (LOD, T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, TAU, VRC, VRT, atSf, box, parkedCar, caGH, caGround, caSlope, caTileOn, clamp, crowdCtx, crowdFinish, crowdPut, crowdRun, cyl,
    gable, ico, lerp, ouCutMat, ouRod, pkGroundMat, propFloorTable, rng, roadsideProps, rock, rpHash, sstep, stubExcl, stubGeo, stubProps,
    stubRails, stubVerge, tuftWindMat, valueNoise2, vary, vrDist, vrFar, vrGritTex, vrHouse, vrLC, vrLCf, vrNear, vrPrep, vrWater
  } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ================= MULHOLLAND HIGHWAY (theme 'mulholland') =================
     the Santa Monica Mountains road (California): the twisting two-lane road up from Cornell to Kanan Road along the slopes and canyons of the Santa Monica
     Mountains, on a hot, clear summer afternoon: golden dry grass on the open slopes, dense dark chaparral (the low evergreen scrub) over most of
     the hills, coast live oaks in the hollows and on the flats, sycamores with pale trunks along the creeks (def.creeks), outcrops and boulders of
     tan and grey sandstone (Elephant Rock by the road: def.rocks), houses of Cornell and a few ranches (def.bld). Built on Vršič's corridor (vrPrep
     and Los Caracoles' terrain helpers: caH, caGround), with a look of its own: the ground colours (mhCol), the plants (mhPlantGeo), timber and
     steel guardrails where the ground falls away, yellow curve signs before the tight bends; every board and sign generic. */
  const MHCOL = [0, 0, 0];
  function mhCol(x, z, h, ny, dd) {   // ground colour (times the grey grit map): golden summer grass (lc 0), the dark brown-olive floor of the
    // chaparral (lc 1), leaf litter and shade under the oaks (lc 2), dusty yards (lc 3), tan and grey sandstone (lc 4, the steep faces), a dusty verge
    const P = API.VR, m = P.c1(x, z), q = P.c2(x, z), f = P.n4(x, z);
    const ch = vrLCf(x, z, 1), oak = vrLCf(x, z, 2), se = vrLCf(x, z, 3), sa = vrLCf(x, z, 4);
    let R = 0.74, G = 0.61, B = 0.37;   // the dry grass
    R = lerp(R, 0.7, sstep(0.55, 0.85, m) * 0.6); G = lerp(G, 0.62, sstep(0.55, 0.85, m) * 0.6);   // (paler, bleached patches)
    R = lerp(R, 0.62, sstep(0.6, 0.86, q) * 0.5); G = lerp(G, 0.56, sstep(0.6, 0.86, q) * 0.5); B = lerp(B, 0.34, sstep(0.6, 0.86, q) * 0.5);   // (browner patches)
    R = lerp(R, 0.4, ch * 0.85); G = lerp(G, 0.39, ch * 0.85); B = lerp(B, 0.25, ch * 0.85);
    R = lerp(R, 0.36, oak * 0.8); G = lerp(G, 0.32, oak * 0.8); B = lerp(B, 0.2, oak * 0.8);
    R = lerp(R, 0.66, se * 0.6); G = lerp(G, 0.61, se * 0.6); B = lerp(B, 0.52, se * 0.6);
    R += (f - 0.5) * 0.08; G += (f - 0.5) * 0.07; B += (f - 0.5) * 0.05;
    const st = Math.max(sstep(0.82, 0.55, ny), sa * 0.8);   // the steep faces and the bare ground: sandstone in bands, tan with grey
    if (st > 0) { const band = 0.5 + 0.5 * Math.sin(h / 4.5 + P.c3(x * 0.5, z * 0.5) * 6), gr = sstep(0.5, 0.8, P.c4(x, z)), k = 0.84 + 0.16 * band;
      R = lerp(R, lerp(0.78, 0.62, gr) * k, st); G = lerp(G, lerp(0.68, 0.6, gr) * k, st); B = lerp(B, lerp(0.52, 0.56, gr) * k, st); }
    if (dd < 4) { const t = sstep(4, 0.5, dd) * 0.5; R = lerp(R, 0.7, t); G = lerp(G, 0.63, t); B = lerp(B, 0.52, t); }
    MHCOL[0] = R; MHCOL[1] = G; MHCOL[2] = B; return MHCOL;
  }
  function mhGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (bilinear over the grid vertices, each coloured as in mhTileGeo)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = caGH(ii, jj);
      const nx = -(caGH(ii + 1, jj) - caGH(ii - 1, jj)) / (2 * VRC), nz = -(caGH(ii, jj + 1) - caGH(ii, jj - 1)) / (2 * VRC), l = Math.hypot(nx, 1, nz), c = mhCol(G.x0 + ii * VRC, G.z0 + jj * VRC, h, 1 / l, G.dd[jj * G.nx + ii]);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function mhTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex), as caTileGeo, coloured by mhCol
    const G = API.VR.G, m = VRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * VRT, j0 = tj * VRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * VRC, z = G.z0 + j * VRC, h = caGH(i, j);
      let nx = -(caGH(i + st, j) - caGH(i - st, j)) / (2 * VRC * st), nz = -(caGH(i, j + st) - caGH(i, j - st)) / (2 * VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = mhCol(x, z, h, ny, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)]); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
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
  let mhATex = null, mhAKey = '', mhA2Tex = null;   // (the board atlases, made once and reused by every build of the road)
  function mhAtlas(cps, finA) {   // text boards (8 rows of 1024 x 128): START, FINISH, CP1-CP4 with the altitude, the Kanan Road guide sign, the race's banner
    const key = cps.join('|') + '|' + finA; if (mhATex && mhAKey === key) return mhATex;
    if (mhATex) mhATex.dispose(); mhAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 100, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(262, 142, 500, 100); txt('FINISH', 512, 196, 92, '#111', 470);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#b5462a'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffe08a', 520); });
    x.fillStyle = '#1d6b3c'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#f2f2ee'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);   // (a green guide sign, as on the roads there)
    txt('KANAN RD', 512, 814, 60, '#f2f2ee', 900); txt(finA, 512, 864, 44, '#f2f2ee', 900);
    x.fillStyle = '#f0e6cc'; x.fillRect(0, 896, 1024, 128); x.fillStyle = '#b5462a'; x.fillRect(0, 896, 1024, 10); x.fillRect(0, 1014, 1024, 10);
    txt('MULHOLLAND HIGHWAY', 512, 934, 58, '#3a2a1a', 980); txt('SANTA MONICA MOUNTAINS', 512, 990, 40, '#b5462a', 900);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (mhATex = t);
  }
  const MH_BOARDS = [['LA SIERRA CREEK', '#6b4a2a'], ['ELEPHANT ROCK', '#6b4a2a'], ['LA SIERRA CANYON', '#6b4a2a'], ['VISTA POINT', '#6b4a2a'], ['KANAN RD  ½', '#1d6b3c'], ['MULHOLLAND HWY', '#1d6b3c'], ['SPEED LIMIT 45', '#f4f4f0'], ['WATCH FOR MOTORCYCLES', '#f1c21b']];
  function mhAtlas2() {   // the small signs: row 0, the yellow curve warnings (128 x 128: a left and a right bend, a winding road both ways, two chevrons);
    // rows 4-7, the boards (two a row, 512 x 128): brown place boards, green guide signs, a speed limit, a yellow warning
    if (mhA2Tex) return mhA2Tex;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 470); };
    for (let k = 0; k < 6; k++) { const x0 = k * 128, y0 = 0;
      if (k < 4) {   // a diamond: black edge, yellow, a black arrow (bend left / right, winding left / right)
        x.save(); x.translate(x0 + 64, y0 + 64); x.rotate(Math.PI / 4); x.fillStyle = '#16181c'; x.fillRect(-44, -44, 88, 88); x.fillStyle = '#f1c21b'; x.fillRect(-40, -40, 80, 80); x.restore();
        const dir = k % 2 ? 1 : -1; x.strokeStyle = '#16181c'; x.lineWidth = 9; x.beginPath(); x.moveTo(x0 + 64, y0 + 98);
        if (k < 2) { x.lineTo(x0 + 64, y0 + 66); x.quadraticCurveTo(x0 + 64, y0 + 46, x0 + 64 + 22 * dir, y0 + 40); }
        else { x.bezierCurveTo(x0 + 64 - 22 * dir, y0 + 82, x0 + 64 + 22 * dir, y0 + 64, x0 + 64, y0 + 52); x.lineTo(x0 + 64 + 10 * dir, y0 + 38); }
        x.stroke(); x.fillStyle = '#16181c'; x.beginPath();
        if (k < 2) { x.moveTo(x0 + 64 + 34 * dir, y0 + 38); x.lineTo(x0 + 64 + 16 * dir, y0 + 26); x.lineTo(x0 + 64 + 16 * dir, y0 + 52); }
        else { x.moveTo(x0 + 64 + 18 * dir, y0 + 26); x.lineTo(x0 + 64 - 2 * dir, y0 + 34); x.lineTo(x0 + 64 + 18 * dir, y0 + 46); }
        x.fill();
      } else {   // the chevrons: black arrows on yellow, pointing the way the road turns
        const dir = k === 4 ? 1 : -1; x.fillStyle = '#f1c21b'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#16181c';
        x.beginPath(); const cx = x0 + 64; x.moveTo(cx - 20 * dir, y0 + 18); x.lineTo(cx + 22 * dir, y0 + 64); x.lineTo(cx - 20 * dir, y0 + 110); x.lineTo(cx - 44 * dir, y0 + 110); x.lineTo(cx - 2 * dir, y0 + 64); x.lineTo(cx - 44 * dir, y0 + 18); x.closePath(); x.fill(); } }
    MH_BOARDS.forEach(([n, bg], k) => { const x0 = (k % 2) * 512, y0 = 512 + Math.floor(k / 2) * 128, light = bg === '#f4f4f0' || bg === '#f1c21b';
      x.fillStyle = bg; x.fillRect(x0, y0, 512, 128); x.strokeStyle = light ? '#16181c' : '#f2f2ee'; x.lineWidth = 6; x.strokeRect(x0 + 8, y0 + 8, 496, 112);
      txt(n, x0 + 256, y0 + 66, n.length > 16 ? 40 : 52, light ? '#16181c' : '#f2f2ee', 470); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (mhA2Tex = t);
  }
  function mhPlantGeo(kind) {   // unit plants (height 1; the instances scale and tint them): 0 a tuft of dry golden grass, 1 a chaparral shrub (a dense,
    // dark grey-olive mound), 2 a coast live oak (a short, leaning trunk, a broad, low, dark crown of rounded clumps), 3 a sycamore (a tall, pale,
    // mottled trunk, an open light-green crown), 4 a sandstone boulder, 5 a few stones, 6 a yucca's rosette, 7 its dried flower stalk
    const g = new GB(), R = rng(760 + kind), rs = API.ROCK_SMOOTH;
    if (kind === 0) {   // eight thin blades and seed heads, straw-gold
      const base = [0.8, 0.64, 0.3], tip = [1.0, 0.9, 0.58];
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + R() * 0.6, lean = 0.18 + R() * 0.22, hh = 0.7 + R() * 0.3, bx = Math.cos(a) * 0.04, bz = Math.sin(a) * 0.04, tx = Math.cos(a) * lean, tz = Math.sin(a) * lean, ox = -Math.sin(a) * 0.05, oz = Math.cos(a) * 0.05;
        g.triO([bx - ox, 0, bz - oz], [bx + ox, 0, bz + oz], [tx, hh, tz], base, [tx * 0.5, hh * 0.2, tz * 0.5], base, tip); g.triO([bx - ox, 0, bz - oz], [tx, hh, tz], [bx + ox, 0, bz + oz], base, [-tx, hh * 0.4, -tz], tip, base); }
    } else if (kind === 1) {   // five tight lumps
      API.ROCK_SMOOTH = true; const col = [0.27, 0.3, 0.17];
      ico(g, 0, 0.48, 0, 0.45, 0.95, col, R, 0.3);
      for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + R() * 0.7, d = 0.32 + R() * 0.1; ico(g, Math.cos(a) * d, 0.32 + R() * 0.1, Math.sin(a) * d, 0.28 + R() * 0.08, 0.9, vary(col, R, 0.25), R, 0.35); }
    } else if (kind === 2) {   // the oak: dark bark, a trunk splitting low into leaning limbs, a wide dome of clumps
      cyl(g, 0, -0.02, 0, 0.06, 0.32, 5, [0.25, 0.22, 0.19], null, 0.045);
      cyl(g, 0.06, 0.28, 0.02, 0.04, 0.22, 4, [0.27, 0.23, 0.2], null, 0.025); cyl(g, -0.06, 0.28, -0.02, 0.04, 0.2, 4, [0.27, 0.23, 0.2], null, 0.025);
      API.ROCK_SMOOTH = true; const col = [0.17, 0.25, 0.1];
      ico(g, 0, 0.62, 0, 0.44, 0.62, col, R, 0.25);
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + R() * 0.5, d = 0.36 + R() * 0.12; ico(g, Math.cos(a) * d, 0.52 + R() * 0.12, Math.sin(a) * d, 0.24 + R() * 0.08, 0.75, vary(col, R, 0.3), R, 0.3); }
    } else if (kind === 3) {   // the sycamore: a white and grey trunk (leaning), a few airy clumps high up
      cyl(g, 0, -0.02, 0, 0.035, 0.5, 5, [0.82, 0.8, 0.74], [0.7, 0.68, 0.62], 0.025); cyl(g, 0.04, 0.46, 0, 0.022, 0.28, 4, [0.86, 0.84, 0.78], null, 0.012);
      API.ROCK_SMOOTH = true; const col = [0.36, 0.48, 0.2];
      ico(g, 0.05, 0.74, 0, 0.24, 0.9, col, R, 0.35); ico(g, -0.14, 0.62, 0.08, 0.17, 0.9, vary(col, R, 0.2), R, 0.35); ico(g, 0.18, 0.6, -0.08, 0.16, 0.9, vary(col, R, 0.2), R, 0.35); ico(g, 0.02, 0.9, 0.06, 0.15, 0.8, vary(col, R, 0.2), R, 0.3);
    } else if (kind === 4) { API.ROCK_SMOOTH = true; rock(g, 0, 0.3, 0, 0.62, 0.6, 0.5, 0, [0.78, 0.68, 0.52], R, 0.35); }
    else if (kind === 6) {   // a yucca (chaparral yucca): a round rosette of stiff, narrow, blue-grey blades, the dead ones below brown
      const base = [0.36, 0.42, 0.36], tip = [0.66, 0.74, 0.68], dead = [0.5, 0.42, 0.3];
      for (let k = 0; k < 22; k++) { const a = k * 2.399 + R() * 0.3, up = 0.25 + (k / 22) * 1.1 + R() * 0.2, L = 0.95 + R() * 0.15, cx = Math.cos(a), cz = Math.sin(a), ox = -cz * 0.035, oz = cx * 0.035, out = Math.cos(up) * L, hy = Math.sin(up) * L * 0.85, c0 = k < 5 ? dead : base, c1 = k < 5 ? dead : tip;
        g.triO([ox, 0.05, oz], [-ox, 0.05, -oz], [cx * out, 0.05 + hy, cz * out], c0, [cx * out * 0.5, -1, cz * out * 0.5], c0, c1); g.triO([ox, 0.05, oz], [cx * out, 0.05 + hy, cz * out], [-ox, 0.05, -oz], c0, [cx * out * 0.5, 2, cz * out * 0.5], c1, c0); }
    } else if (kind === 7) {   // its dried flower stalk (the plant flowers once, the stalk stands for years): a tall pale cane, the seed pods on its top third
      cyl(g, 0, 0, 0, 0.025, 0.7, 4, [0.62, 0.55, 0.42], null, 0.012);
      API.ROCK_SMOOTH = true; const R2 = rng(777);
      for (let k = 0; k < 9; k++) { const a = k * 2.1, y = 0.7 + k * 0.028; ico(g, Math.cos(a) * 0.035, y, Math.sin(a) * 0.035, 0.04, 1.3, [0.58, 0.48, 0.34], R2, 0.2); }
    }
    else {   // three stones
      API.ROCK_SMOOTH = false; const C = [[0.76, 0.67, 0.52], [0.66, 0.63, 0.58], [0.7, 0.58, 0.44]];
      for (let k = 0; k < 3; k++) { const a = R() * TAU, d = k ? 0.25 + R() * 0.25 : 0, r = k ? 0.1 + R() * 0.08 : 0.17; rock(g, Math.cos(a) * d, r * 0.25, Math.sin(a) * d, r, r * 0.7, r * 0.85, R() * TAU, C[k], R, 0.3); }
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // the knockable roadside posts: white with a black top (as Los Caracoles')
  function mhProps(out, spots, prof) {
    out.propR = 150;
    out.propFloor = propFloorTable(null, prof);
    const sA = T.startS + 30, sB = T.finishS - 30;
    return out.propStats = roadsideProps(out.props, { spots, postEdge: [1.2, 1.6], postCol: () => 0, exits: 0, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
      floor: out.propFloor, skip: (i) => { const s = i * T.ds; return s < sA || s > sB; } });
  }
  function buildMulholland(scene, tex, opts) {
    const R = rng(3111), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: caGround, camFloor: caGround, props: [], farClip: true, ownTex: [], dust: [0.78, 0.7, 0.56] };
    vrPrep();
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS, base = P.D.base;
    P.c1 = valueNoise2(731, 140); P.c2 = valueNoise2(732, 70); P.c3 = valueNoise2(733, 190); P.c4 = valueNoise2(734, 90); P.c5 = valueNoise2(735, 24);
    P.fin = [T.px[T.finishIdx], T.pz[T.finishIdx]];
    // the buildings (def.bld [x, z, length, width, angle, height, kind]: 0 a house, 3 a shed): clear of the road and the ponds; big blocks cut down
    const blds = [];
    for (const b of def.bld || []) {
      let [x, z, L, W, ang, hgt, kind] = b; L = Math.min(L, 40); W = Math.min(W, 22);
      if (L < 2.5 || W < 2.5) continue;
      const c = Math.cos(ang), s = Math.sin(ang), clear = () => { for (const [u, v] of [[0, 0], [-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]]) { const px = x + c * u - s * v, pz = z + s * u + c * v, n = vrNear(px, pz);
        if ((n.i >= 0 && n.dd < 1.5) || vrWater(px, pz).e > -2) return false; } return true; };
      if (clear()) blds.push({ x, z, L, W, ang, hgt, kind });
    }
    // the creeks (def.creeks [x, z, ...]): their points in a 32 m hash, for the sycamores along them
    const ck = new Map(), CKC = 32;
    for (const c of def.creeks || []) for (let k = 0; k + 1 < c.length; k += 2) { const key = Math.floor(c[k] / CKC) + ',' + Math.floor(c[k + 1] / CKC); let L = ck.get(key); if (!L) ck.set(key, L = []); L.push(c[k], c[k + 1]); }
    const creekD = (x, z) => { let d = 1e9; const a0 = Math.floor(x / CKC), b0 = Math.floor(z / CKC);
      for (let a = a0 - 1; a <= a0 + 1; a++) for (let b = b0 - 1; b <= b0 + 1; b++) { const L = ck.get(a + ',' + b); if (!L) continue; for (let k = 0; k < L.length; k += 2) d = Math.min(d, Math.hypot(x - L[k], z - L[k + 1])); } return d; };
    // the car parks: at the finish (beside the road past the line, on the side where the ground lies nearer the road's height) and at the viewpoint
    const padBeside = (s, r) => { const i = T.idx(s), gd = (sd) => Math.abs(vrFar(T.px[i] + T.nx[i] * sd * r, T.pz[i] + T.nz[i] * sd * r) - T.hy[i]), sd = gd(1) < gd(-1) ? 1 : -1, o = (sd > 0 ? T.br[i] : T.bl[i]) + r + 1;
      return { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r, b: 16, h: T.hy[i] - 0.25, sd, i }; };
    const padF = padBeside(sFin + 60, 14); P.pads.push(padF);
    const vq = T.names.find(q => /^Razgled/.test(q.n)), padV = vq ? padBeside(sStart + vq.d, 9) : null; if (padV) P.pads.push(padV);
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the trees, houses and boulders between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (buildings, crowds, plots) for the plants and the boulders, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    for (const b of blds) exclPush(b.x, b.z, Math.hypot(b.L, b.W) / 2 + 2.5);
    exclPush(padF.x, padF.z, padF.r + 4); if (padV) exclPush(padV.x, padV.z, padV.r + 3);
    stubExcl(exclPush);   // (nothing grows or stands on the side roads)
    out.marks = {};   // (where the landmarks stand: the tests look for them)

    /* ---- terrain tiles, the ponds ---- */
    let nFar = 0;
    const tMat = pkGroundMat(), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = caTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(mhTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
      const wMat = new THREE.MeshPhongMaterial({ map: tex.water, vertexColors: true, shininess: 60, specular: 0x2a3a44 });
      for (const L of P.lakes) {   // a 4 m grid, only where the corridor is built: green-brown stock ponds
        const deep = [0.14, 0.24, 0.18], shal = [0.36, 0.42, 0.28], sky = [0.5, 0.64, 0.76];
        const g = new GB(true), uv = (q) => [q[0] / 14, -q[2] / 14];
        const wc = (x, z) => { const e = vrWater(x, z).e, ks = 0.35 * sstep(0.55, 0.8, P.n2(x * 2.2, z * 2.2)); return [0, 1, 2].map(k => lerp(lerp(shal[k], deep[k], sstep(2, 14, e)), sky[k], ks)); };
        for (let zz = Math.floor((L.z0 - 8) / 4) * 4; zz < L.z1 + 8; zz += 4) for (let xx = Math.floor((L.x0 - 8) / 4) * 4; xx < L.x1 + 8; xx += 4) {
          if (vrDist(xx, zz) > 600) continue;
          if (!(caGround(xx, zz) < L.h + 0.4 || caGround(xx + 4, zz) < L.h + 0.4 || caGround(xx, zz + 4) < L.h + 0.4 || caGround(xx + 4, zz + 4) < L.h + 0.4)) continue;
          const A = [xx, L.h, zz], B = [xx + 4, L.h, zz], C = [xx + 4, L.h, zz + 4], D = [xx, L.h, zz + 4];
          g.quadUp(A, B, C, D, [wc(A[0], A[2]), wc(B[0], B[2]), wc(C[0], C[2]), wc(D[0], D[2])], [uv(A), uv(B), uv(C), uv(D)]); }
        if (!g.empty) { const m = new THREE.Mesh(g.geometry(), wMat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); out.dyn.water = tex.water; }
      }
    }

    /* ---- the road: asphalt with white edge lines and a double yellow centre line, a dusty shoulder, then the verge out to a ditch past the barrier
       line, up or down onto the ground (120 m chunks) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const sw = 0.6;
    const SB = stubGeo({ gCol: mhGCol, paveC: [0.82, 0.81, 0.8], gravC: [0.8, 0.73, 0.6], shC: [0.8, 0.73, 0.6], line: 'solid' });   // the side roads: the streets of Cornell, the driveways, the tracks (their surfaces in the road's chunks)   // (the side roads' gravel the colour of the road's own shoulder: gc below)
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w;
      const ms = stubVerge(SB, i, side, e + sw, bar); if (ms) return ms;   // (a side road's mouth: no ditch, the verge at its surface)
      const y = T.hy[i], gAt = (o) => { const q = side * o; return caGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      if (gAt(bar + 0.45) < -2.6) return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, gAt(bar + 0.42) - 0.08], [bar + 1.15, gAt(bar + 1.15) + 0.03], [bar + 1.9, gAt(bar + 1.9) + 0.03]];   // (a fill slope: the verge's edge, then down)
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.84 - 0.12 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.88) k += 0.03; return [k, k * 0.99, k * 0.97]; };   // (sun-bleached grey)
      const wht = [0.95, 0.95, 0.92], ylw = [0.96, 0.76, 0.16], gc = [0.8, 0.73, 0.6];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (k === 4) return mhGCol(x, z);
          const sl = k === 2 ? caSlope(x, z) : 0, l = Math.sqrt(1 + sl * sl); return mhCol(x, z, T.hy[i] + y, 1 / l, Math.max(0, o - bar)).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), gl = new GB(), gs = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / 6, s1 = j * T.ds / 6;
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
            gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
          for (const [o0, o1] of SB.edges(i, j, [[-(w - 0.3), -(w - 0.45)], [w - 0.45, w - 0.3]])) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [wht, wht, wht, wht]);
          for (const [o0, o1] of [[-0.21, -0.09], [0.09, 0.21]]) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [ylw, ylw, ylw, ylw]);
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j];
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [gc, gc, gc, gc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
        }
        SB.emit(c0, c0 + 60, gr, gs, gl);   // (the side roads whose junctions are in this chunk)
        addM(gr, aMat); addM(gl, lMat); addM(gs, sMat); addM(gv, gMat);
      }
      // the tar snakes: the cracks in the old asphalt sealed with black tar, wandering along the lanes and across them (a ribbon 0.14 m wide just
      // above the asphalt, under the painted lines)
      { const RS = rng(3191), ts = new Chunks(110), tc = [0.075, 0.075, 0.085], P2 = (s, o) => { const f = clamp(s / T.ds, 0, N - 1.001), i = Math.floor(f), u = f - i, j = i + 1;
          return [lerp(T.px[i] + T.nx[i] * o, T.px[j] + T.nx[j] * o, u), lerp(T.hy[i], T.hy[j], u) + 0.031, lerp(T.pz[i] + T.nz[i] * o, T.pz[j] + T.nz[j] * o, u)]; };
        for (let s = sStart - 40; s < sFin + 40; s += 9) { if (RS() > 0.6) continue;
          const across = RS() < 0.3, L = across ? 2 * w * (0.4 + RS() * 0.55) : 4 + RS() * 10, n = Math.ceil(L / 0.6), ph = RS() * 6, amp = 0.15 + RS() * 0.35;
          let a = s + RS() * 8, o = across ? -w + 0.3 + RS() * (2 * w - L) * 0.9 : (RS() - 0.5) * 2 * (w - 0.8); const pts = [];
          for (let k = 0; k <= n; k++) { const t = k / n * L, wig = Math.sin(t * 1.7 + ph) * amp + Math.sin(t * 4.3 + ph * 2) * amp * 0.35;
            pts.push(across ? P2(a + wig, clamp(o + t, -w + 0.2, w - 0.2)) : P2(a + t, clamp(o + wig, -w + 0.2, w - 0.2))); }
          const g = ts.get(pts[0][0], pts[0][2]);
          for (let k = 0; k < n; k++) { const A = pts[k], B = pts[k + 1], dx = B[0] - A[0], dz = B[2] - A[2], l = Math.hypot(dx, dz) || 1, hx = -dz / l * 0.07, hz = dx / l * 0.07;
            g.quadUp([A[0] - hx, A[1], A[2] - hz], [A[0] + hx, A[1], A[2] + hz], [B[0] + hx, B[1], B[2] + hz], [B[0] - hx, B[1], B[2] - hz], [tc, tc, tc, tc]); } }
        ts.addTo(root, lMat, false, true); }
      // chequered start and finish lines, a white line at each checkpoint
      const gq = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1];
      for (const s0 of [sStart, sFin]) { const a = atSf(s0 - 0.8, -w), b = atSf(s0 - 0.8, w), c = atSf(s0 + 0.8, w), d = atSf(s0 + 0.8, -w), y = (p) => T.hy[p[3]] + 0.045;
        gq.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]); }
      for (const s0 of T.cpS) { const a = atSf(s0 - 0.25, -w + 0.1), b = atSf(s0 - 0.25, w - 0.1), c = atSf(s0 + 0.25, w - 0.1), d = atSf(s0 + 0.25, -w + 0.1), y = (p) => T.hy[p[3]] + 0.042;
        gw.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [wht, wht, wht, wht]); }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw, lMat);
    }

    /* ---- scenery (vertex coloured, 110 m chunks) ---- */
    const scen = new Chunks(110), fac = new Chunks(110, true), ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];   // (fac: the walls with windows; ban: the race's boards, ban2: the signs)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.84, 0.14, 0.14], [0.95, 0.95, 0.95], [0.14, 0.24, 0.6], [0.12, 0.13, 0.16], [0.96, 0.78, 0.18], [0.2, 0.5, 0.62], [0.95, 0.5, 0.14], [0.5, 0.32, 0.22], [0.3, 0.55, 0.3], [0.82, 0.82, 0.84]];
    const CR = crowdCtx({ gH: caGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: (x, z) => vrWater(x, z).e > -4, shirts: fans }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1; tilt leans its top towards +t
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const board = (k) => { const v1 = 1 - (4 + Math.floor(k / 2)) / 8; return [v1 - 1 / 8, v1, (k % 2) * 0.5, (k % 2) * 0.5 + 0.5]; };   // a board of the second atlas: [v0, v1, u0, u1]
    const sign = (s, side, k, H) => {   // a board on two steel posts beside the road, facing the cars coming up
      const [bx, bz, bi] = onSide(s, side, 1.4); if (excluded(bx, bz)) return;
      const by = caGround(bx, bz), [v0, v1, u0, u1] = board(k), gb = scen.get(bx, bz);
      for (const o of [-1.2, 1.2]) box(gb, bx + T.nx[bi] * o, by - 0.2, bz + T.nz[bi] * o, 0.1, (H || 1.6) + 0.95, 0.1, T.hd[bi], [0.6, 0.61, 0.63]);
      bannerQ(bx, by + (H || 1.6), bz, -T.tx[bi], -T.tz[bi], 3.2, 0.8, v0, v1, u0, u1, ban2); exclPush(bx, bz, 2); CR.avoid(bx, bz, 1.6); };
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road: two posts at the barriers, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.9, L2 = T.br[i] + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 12.8, 1.6, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, col) => crowdPut(CR, x, caGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: col || fans[Math.floor(R() * fans.length)] }, 1);
    const flagUS = (g, x, y, z, rot, h) => {   // a pole with the stars and stripes: seven red and six white stripes, the blue canton with white dots (both faces)
      cyl(g, x, y - 0.2, z, 0.06, h + 0.2, 5, [0.92, 0.92, 0.9], [0.85, 0.75, 0.3]);
      const c = Math.cos(rot), s = Math.sin(rot), fw = 1.9, fh = 1.0, y0 = y + h - fh - 0.15, at = (u) => [x + c * (u + 0.06), z + s * (u + 0.06)];
      for (let k = 0; k < 7; k++) { const [fx, fz] = at(fw / 2); box(g, fx, y0 + k * fh / 7, fz, fw, fh / 7, 0.04, rot, k % 2 ? [0.95, 0.95, 0.93] : [0.75, 0.12, 0.16]); }
      const [cx, cz] = at(fw * 0.2); box(g, cx, y0 + fh * 0.46, cz, fw * 0.4 + 0.004, fh * 0.54, 0.05, rot, [0.12, 0.17, 0.42]);
      for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) { const [sx, sz] = at(fw * (0.07 + a * 0.13)); box(g, sx, y0 + fh * (0.6 + b * 0.22), sz, 0.06, 0.06, 0.06, rot, [0.96, 0.96, 0.96]); }
    };
    const car = (g, x, y, z, rot, col) => {   // a parked car (as Los Caracoles')
      const c = Math.cos(rot), s = Math.sin(rot);
      parkedCar(g, x, y, z, rot, col);   // (the car: parkedCar in js/world.js)
    };
    const moto = (g, x, y, z, rot, col) => {   // a parked motorbike on its side stand
      const c = Math.cos(rot), s = Math.sin(rot);
      for (const a of [-0.7, 0.7]) cyl(g, x + c * a, y, z + s * a, 0.32, 0.12, 6, [0.08, 0.08, 0.09]);
      box(g, x, y + 0.45, z, 1.3, 0.35, 0.35, rot, col, null, true); box(g, x - c * 0.35, y + 0.75, z - s * 0.35, 0.6, 0.12, 0.3, rot, [0.1, 0.1, 0.11]); box(g, x + c * 0.55, y + 0.9, z + s * 0.55, 0.08, 0.08, 0.7, rot, [0.6, 0.6, 0.62]);
    };

    /* ---- the houses of Cornell and the ranches: stucco walls with windows, red tile or grey shingle roofs; sheds and barns in wood or metal ---- */
    let nBld = 0;
    {
      const RB = rng(3121), walls = [[0.95, 0.92, 0.84], [0.92, 0.84, 0.7], [0.88, 0.86, 0.8], [0.84, 0.74, 0.6], [0.96, 0.95, 0.92]], roofs = [[0.62, 0.3, 0.2], [0.68, 0.36, 0.24], [0.36, 0.36, 0.38], [0.44, 0.4, 0.36]], woods = [[0.46, 0.32, 0.2], [0.52, 0.38, 0.24]];
      const lowHigh = (b) => { const c = Math.cos(b.ang), s = Math.sin(b.ang); let lo = 1e9, hi = -1e9; for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const y = caGround(b.x + c * u - s * v, b.z + s * u + c * v); lo = Math.min(lo, y); hi = Math.max(hi, y); } return [lo, hi]; };
      for (const b of blds) {
        const g = scen.get(b.x, b.z), [lo, hi] = lowHigh(b);
        if (b.kind === 3) {   // a shed or barn: weathered wood or corrugated metal
          const mc = vary([[0.5, 0.36, 0.24], [0.66, 0.66, 0.64], [0.56, 0.3, 0.2]][Math.floor(RB() * 3)], RB, 0.12);
          box(g, b.x, lo - 0.3, b.z, b.L, hi - lo + 0.3 + 2.6, b.W, b.ang, mc, null, true); gable(g, b.x, hi + 2.3, b.z, b.L + 0.5, b.W + 0.5, Math.min(b.L, b.W) * 0.18, b.ang, vary([0.55, 0.55, 0.56], RB, 0.15), mc);
        } else vrHouse(g, fac.get(b.x, b.z), b.x, lo, hi, b.z, b.ang, b.L, b.W, b.L * b.W > 220 ? 2 : 1, { wall: walls[Math.floor(RB() * walls.length)], wood: vary(woods[Math.floor(RB() * 2)], RB, 0.1), roof: vary(roofs[Math.floor(RB() * roofs.length)], RB, 0.1) });
        CR.block(b.x, b.z, b.L + 1, b.W + 1, b.ang);
        nBld++;
      }
    }
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- START (at Cornell): gantry with the start lights, the timing hut, flags along the grid, the road closed behind it ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i];
      box(scen.get(x, z), x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 5, -1, 3.2), hy = caGround(hx, hz), gh = scen.get(hx, hz);   // the timing hut
      box(gh, hx, hy, hz, 4.0, 2.7, 2.8, T.hd[i], [0.94, 0.9, 0.8], [0.5, 0.3, 0.2], true); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.3, 0.42], null, true); gable(gh, hx, hy + 2.7, hz, 4.4, 3.2, 1.0, T.hd[i], [0.62, 0.3, 0.2], [0.94, 0.9, 0.8]);
      exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]);
      for (let s = 8; s < sStart + 50; s += 12) for (const side of [-1, 1]) { const [px, pz, ii] = onSide(s, side, 1.3); if (excluded(px, pz) && s > sStart - 8) continue; flagUS(scen.get(px, pz), px, caGround(px, pz), pz, T.hd[ii], 6); }
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road: plastic water barriers across it, orange and white
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.6, 0.9, 1.95, T.hd[0], (Math.round(o) & 2) ? [0.95, 0.95, 0.93] : [0.95, 0.45, 0.1]); }
      { const [bx, bz, bi] = onSide(sStart + 16, 1, 1.6), by = caGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        bannerQ(bx, by + 1.5, bz, -T.nx[bi], -T.nz[bi], 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); }
    }

    /* ---- the checkpoints: a terracotta gantry "CPn  altitude" ---- */
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.9, 0.88, 0.84], [0.55, 0.24, 0.14]));

    /* ---- FINISH (at Kanan Road): chequered gantry and flags, the green guide sign, the car park with cars and motorbikes, the road closed farther on ---- */
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      for (const side of [-1, 1]) for (let s = sFin - 28; s < sFin + 12; s += 7) { const [px, pz, ii] = onSide(s, side, 1.4), py = caGround(px, pz), gg = scen.get(px, pz);
        cyl(gg, px, py, pz, 0.06, 5, 5, [0.9, 0.9, 0.92]);
        for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) box(gg, px + T.tx[ii] * (0.36 + a * 0.55), py + 3.8 + b * 0.55, pz + T.tz[ii] * (0.36 + a * 0.55), 0.55, 0.55, 0.05, T.hd[ii], (a + b) % 2 ? [0.08, 0.08, 0.08] : [0.96, 0.96, 0.96], null, true); }
      const sdP = padF.sd, [sx, sz, si] = onSide(sFin + 22, -sdP, 1.6), sy = caGround(sx, sz), gs = scen.get(sx, sz);   // the guide sign on two posts
      for (const o of [-2.6, 2.6]) box(gs, sx + T.nx[si] * o, sy - 0.2, sz + T.nz[si] * o, 0.16, 3.9, 0.16, T.hd[si], [0.6, 0.61, 0.63]);
      { const [v0, v1] = row(6); bannerQ(sx, sy + 2.3, sz, -T.tx[si], -T.tz[si], 6.4, 0.8, v0, v1); } exclPush(sx, sz, 4);
      const hh = T.hd[padF.i], c = Math.cos(hh), sn = Math.sin(hh), RT = rng(3141), cols = [[0.86, 0.86, 0.84], [0.12, 0.13, 0.15], [0.62, 0.12, 0.1], [0.24, 0.34, 0.56], [0.7, 0.7, 0.72], [0.92, 0.9, 0.86]];
      for (let k = 0; k < 10; k++) { const a = -12 + (k % 5) * 6, b = (k < 5 ? -4.5 : 4.5) * sdP, px = padF.x - sn * b + c * a, pz = padF.z + c * b + sn * a; if (vrNear(px, pz).dd < 1.5) continue;
        if (k % 3 === 1) for (const m of [-1.4, 0, 1.4]) moto(scen.get(px, pz), px + c * m, caGround(px + c * m, pz + sn * m), pz + sn * m, hh + PI / 2 + 0.3, vary(cols[Math.floor(RT() * cols.length)], RT, 0.2));
        else car(scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2, vary(cols[Math.floor(RT() * cols.length)], RT, 0.15)); }
      for (let k = 0; k < 18; k++) { const px = padF.x + (R() - 0.5) * 24, pz = padF.z + (R() - 0.5) * 24; if (vrNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;   // the end of the road: water barriers across it
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.6, 0.9, 1.95, T.hd[iE], (Math.round(o) & 2) ? [0.95, 0.95, 0.93] : [0.95, 0.45, 0.1]); }
    }

    /* ---- the viewpoint: a dirt pull-out with a few parked cars and motorbikes, people looking out over the canyon ---- */
    if (padV) { const hh = T.hd[padV.i], c = Math.cos(hh), sn = Math.sin(hh), RT = rng(3151);
      for (let k = 0; k < 4; k++) { const a = -6 + k * 4, px = padV.x + c * a, pz = padV.z + sn * a; if (vrNear(px, pz).dd < 1.2) continue;
        if (k % 2) moto(scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2 + 0.25, vary([0.12, 0.13, 0.15], RT, 0.3)); else car(scen.get(px, pz), px, caGround(px, pz), pz, hh, vary([0.8, 0.78, 0.74], RT, 0.3)); }
      for (let k = 0; k < 7; k++) { const px = padV.x + (R() - 0.5) * 14, pz = padV.z + (R() - 0.5) * 14; if (vrNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); } }

    /* ---- Elephant Rock and the other sandstone outcrops (def.rocks): a pile of big, rounded, tan boulders ---- */
    {
      const RK = rng(3161), C = [[0.8, 0.7, 0.54], [0.74, 0.66, 0.54], [0.7, 0.68, 0.62]];
      for (const [x, z, r, name] of def.rocks || []) {
        const n = vrNear(x, z), sh = n.i >= 0 && n.dd < r ? (r - n.dd + 2) : 0, ux = n.i >= 0 ? x - T.px[n.i] : 0, uz = n.i >= 0 ? z - T.pz[n.i] : 0, ul = Math.hypot(ux, uz) || 1;
        const cx = x + ux / ul * sh, cz = z + uz / ul * sh, g = scen.get(cx, cz), y = caGround(cx, cz);   // (pushed off the road if it reaches it)
        rock(g, cx, y + r * 0.45, cz, r, r * 0.95, r * 0.8, RK() * TAU, C[0], RK, 0.22);
        for (let k = 0; k < 4; k++) { const a = RK() * TAU, d = r * (0.6 + RK() * 0.4), q = r * (0.35 + RK() * 0.25), px = cx + Math.cos(a) * d, pz = cz + Math.sin(a) * d; if (vrNear(px, pz).dd < q + 1) continue;
          rock(g, px, caGround(px, pz) + q * 0.35, pz, q, q * 0.8, q * 0.9, RK() * TAU, C[k % 3], RK, 0.3); }
        exclPush(cx, cz, r + 3); if (name) out.marks[name] = [cx, cz];
      }
    }

    /* ---- guardrails where the ground falls away and round the outside of the tight bends: steel-backed timber rails (as along the roads of the
       national recreation area) or a galvanised W-beam; yellow chevrons on the outside of the tightest bends, a curve sign before each; a marker
       post every ~50 m where there is neither (knockable where it fits: mhProps) ---- */
    /* ---- the side roads' cones across their mouths, the rails and gates at their ends, the streets' names (stubProps) ---- */
    out.stubStats = stubProps({ scen, out, root, gH: caGround, loc: { closed: 'ROAD CLOSED', gate: 'CLOSED', plate: ['#0f6b3e', '#f4f6f2'] }, posts: 'none' });
    let nRail = 0;
    {
      const mkPosts = [], need = [new Uint8Array(N), new Uint8Array(N)];
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 8); k <= Math.min(N - 1, c.i1 + 8); k++) need[sd][k] = 1; }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];
        for (const d of [4, 8, 13, 19, 26]) { const o = side * (bar + d);
          if (caGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      const iS0 = T.idx(sStart + 40), iS1 = T.idx(sFin - 40), steel = [0.78, 0.8, 0.82], steelB = [0.56, 0.58, 0.6], postC = [0.48, 0.49, 0.52], wood = [0.46, 0.34, 0.22], woodD = [0.36, 0.27, 0.18];
      for (const side of [-1, 1]) {
        const nd = need[side > 0 ? 1 : 0], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1) nd[i] = 0;
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; }
        stubRails(nd, side);   // (open across the side roads' mouths)
        nRail += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0, run = -1, timber = false; i < N - 1; i++) {
          const g = scen.get(T.px[i], T.pz[i]);
          if (nd[i] && nd[i + 1]) {
            if (run < 0) { run = i; timber = rpHash(i, 77 + side) < 0.55; }   // (each run of rail one kind)
            if (timber) {   // a squared timber beam on square timber posts every 2 m
              const a = Q(i, 0.42), b = Q(i + 1, 0.42), c = Q(i + 1, 0.74), d = Q(i, 0.74), ins = Q(i, 0.6, 3), ino = Q(i, 0.6, -3), a2 = Q(i, 0.74, 0.18), b2 = Q(i + 1, 0.74, 0.18);
              g.quadO(a, b, c, d, wood, ins); g.quadO(Q(i, 0.42, 0.18), Q(i + 1, 0.42, 0.18), b2, a2, woodD, ino); g.quadO(d, c, b2, a2, wood, Q(i, 0, 0.09));
              { const p = Q(i, -0.35, 0.3); box(g, p[0], p[1], p[2], 0.22, 1.05, 0.22, T.hd[i], woodD, null, true); }
            } else {   // W-beam: a front and a back face, a post every 4 m
              const a = Q(i, 0.45), b = Q(i + 1, 0.45), c = Q(i + 1, 0.8), d = Q(i, 0.8), ins = Q(i, 0.6, 3), ino = Q(i, 0.6, -3);
              g.quadO(a, b, c, d, steel, ins); g.quadO(a, b, c, d, steelB, ino);
              if (i % 2 === 0) { const p = Q(i, -0.35, 0.14); box(g, p[0], p[1], p[2], 0.13, 1.13, 0.13, T.hd[i], postC, null, true); }
            }
          } else { run = -1; if (!nd[i] && i % 25 === 0 && i > 2 && i < iE - 2 && !SB.mouthV[side > 0 ? 1 : 0][i]) mkPosts.push([i, side]); }
        }
      }
      const kp = mhProps(out, mkPosts, (i, side) => vp[side > 0 ? 1 : 0][i]).spots;
      for (const sp of mkPosts) { if (kp.has(sp)) continue;
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]);
        box(g, p[0], p[1] - 0.2, p[2], 0.13, 1.2, 0.13, T.hd[i], [0.94, 0.94, 0.92], null, true); box(g, p[0], p[1] + 0.72, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.1, 0.1, 0.1], null, true);
      }
      // the curve signs (a yellow diamond 60 m before every tight bend, on the right) and the chevrons on the outside of the tightest
      const u8 = 1 / 8, v1 = 1;
      for (const c of T.corners) { if (c.sev < 2) continue; const s0 = c.i0 * T.ds, s1 = c.i1 * T.ds; if (s0 < sStart + 30 || s1 > sFin - 20) continue;
        const turn = c.dir > 0 ? 1 : -1, k = (c.sev >= 3 ? 2 : 0) + (turn > 0 ? 1 : 0), [px, pz, ii] = onSide(s0 - 60, 1, 0.9);
        if (!excluded(px, pz)) { const py = caGround(px, pz), g = scen.get(px, pz);
          box(g, px, py - 0.2, pz, 0.08, 2.1, 0.08, T.hd[ii], [0.6, 0.61, 0.63]); bannerQ(px, py + 1.3, pz, -T.tx[ii], -T.tz[ii], 0.9, 0.9, v1 - u8, v1, k * u8, (k + 1) * u8, ban2); exclPush(px, pz, 1.5); CR.avoid(px, pz, 0.8); }
        if (c.sev < 3) continue;
        const cell = turn > 0 ? 4 : 5, mid = (s0 + s1) / 2;
        for (const o of [-12, 0, 12]) { const [cx, cz, ci] = onSide(mid + o, -turn, 0.7); if (excluded(cx, cz)) continue;
          const cy = caGround(cx, cz), g = scen.get(cx, cz), fx = T.px[ci] - cx, fz = T.pz[ci] - cz, fl = Math.hypot(fx, fz) || 1, tx = -T.tx[ci] * 0.75 + fx / fl * 0.25, tz = -T.tz[ci] * 0.75 + fz / fl * 0.25, tl = Math.hypot(tx, tz);
          box(g, cx, cy - 0.2, cz, 0.08, 1.5, 0.08, T.hd[ci], [0.6, 0.61, 0.63]); bannerQ(cx, cy + 0.75, cz, tx / tl, tz / tl, 0.7, 0.7, v1 - u8, v1, cell * u8, (cell + 1) * u8, ban2); CR.avoid(cx, cz, 0.6); }
      }
    }
    { const nm = (n) => T.names.find(q => q.n.startsWith(n));   // the boards: brown at the places, the speed limit after the start, the motorcycle warning, the guide signs near the top
      for (const [n, k, o] of [['La Sierra Creek', 0, -30], ['Elephant Rock', 1, -40], ['La Sierra Canyon', 2, -20], ['Razgled', 3, -60], ['Brewster', 4, 40]]) { const q = nm(n); if (q) sign(sStart + q.d + o, 1, k); }
      sign(sStart + 120, 1, 6); sign(sStart + 420, 1, 7); sign(sStart + 2600, 1, 7); sign(sStart + 1500, 1, 5, 2); }

    /* ---- the power line: weathered wooden poles every ~45 m beside the road through Cornell and below the top, a cross arm with three wires
       sagging between them, a grey transformer can on every fourth pole ---- */
    let nPoles = 0;
    {
      const wood = [0.38, 0.29, 0.2], wire = [0.1, 0.1, 0.11];
      for (const [sa, sb, side] of [[sStart - 90, sStart + 760, -1], [sFin - 560, sFin + 220, 1]]) {
        let prev = null, k = 0;
        for (let s = sa; s <= sb; s += 45, k++) {
          const [x, z, i] = onSide(s, side, 3.6), nn = vrNear(x, z);
          if (excluded(x, z) || (nn.i >= 0 && nn.dd < 2) || caSlope(x, z) > 0.9) { prev = null; continue; }
          const y = caGround(x, z), g = scen.get(x, z), H = 10.5, ah = T.hd[i] + Math.PI / 2, ax = Math.cos(ah), az = Math.sin(ah);
          cyl(g, x, y - 0.3, z, 0.15, H + 0.3, 6, wood, null, 0.11); box(g, x, y + H - 0.6, z, 2.4, 0.14, 0.14, ah, wood);
          if (k % 4 === 1) cyl(g, x + T.tx[i] * 0.3, y + H - 2.6, z + T.tz[i] * 0.3, 0.3, 1.0, 7, [0.58, 0.6, 0.62]);
          const tops = [-1.05, 0, 1.05].map(o => [x + ax * o, y + H - 0.48 + (o ? 0 : 0.5), z + az * o]);
          if (prev) for (let q = 0; q < 3; q++) { const a = prev[q], b = tops[q], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.7, (a[2] + b[2]) / 2], gg = scen.get(m[0], m[2]);
            ouRod(gg, a, m, 0.022, wire, 3); ouRod(gg, m, b, 0.022, wire, 3); }
          prev = tops; exclPush(x, z, 1.4); CR.avoid(x, z, 1); nPoles++;
        }
      }
    }

    /* ---- spectators: the start and the finish, the checkpoints, the viewpoint, groups on the outside of the bends ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.6, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.3, flag: 0.12, keepBar: 1.6 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 70, sStart + 70, sd, { rows: 3, dens: 0.6, label: 'MH start' }); run(sFin - 70, sFin + 14, sd, { rows: 3, dens: 0.6, label: 'MH finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 24, s0 + 20, side, { rows: 2, dens: 0.55, label: 'MH cp+' }); run(s0 - 20, s0 + 16, -side, { rows: 2, dens: 0.4, label: 'MH cp-' }); });
      T.corners.filter(c => c.sev >= 3).forEach((c, k) => { if (k % 3) return; const sm = (c.i0 + c.i1) / 2 * T.ds; if (sm < sStart + 100 || sm > sFin - 100) return; run(sm - 20, sm + 20, c.dir > 0 ? -1 : 1, { rows: 2, dens: 0.45, label: 'MH bend' }); });
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the plants (instanced per 96 m chunk): golden grass tufts on the open slopes, the chaparral thick over the hills, coast live oaks in
       the woodland (lc 2) and here and there on the grass, sycamores along the creeks, sandstone boulders; none on the road, the water, the cliffs ---- */
    const pMat = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const wMat = tuftWindMat(out.dyn.wind || (out.dyn.wind = { value: 0 })), wB = wMat.onBeforeCompile; ouCutMat(wMat, cut);   // (the grass: in the wind, and the cut)
    { const cB = wMat.onBeforeCompile; wMat.onBeforeCompile = (sh) => { wB(sh); cB(sh); }; wMat.customProgramCacheKey = () => 'tuftWindCut'; wMat.side = THREE.FrontSide; }
    const pk = [0, 1, 2, 3, 4, 5, 6, 7].map(k => new IChunks(mhPlantGeo(k), k === 0 ? wMat : pMat, k === 5 ? 64 : 96));
    let nPlants = 0, nTrees = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(80000 * dens), RT = rng(3171), SP = 3.0 / Math.sqrt(dens);
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > 240) continue;
          if (hd > 80 && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;   // (farther out every other spot)
          const c = vrLC(x, z), y0 = caGround(x, z), sl = caSlope(x, z), cd = creekD(x, z);
          let kind = -1;
          if (cd < 14 && r1 < 0.05) kind = 3;
          else if (c === 0) kind = r1 < 0.55 ? 0 : r1 < 0.562 ? 2 : r1 < 0.6 ? 1 : r1 < 0.605 ? 4 : r1 < 0.612 && sl > 0.25 ? 6 : -1;
          else if (c === 1) kind = r1 < 0.5 ? 1 : r1 < 0.56 ? 0 : r1 < 0.565 ? 4 : r1 < 0.575 && sl > 0.2 ? 6 : -1;
          else if (c === 2) kind = r1 < 0.03 ? 2 : r1 < 0.45 ? 1 : r1 < 0.52 ? 0 : -1;   // (WorldCover's tree cover here: mostly the tall, dense chaparral, oaks among it)
          else if (c === 3) kind = r1 < 0.02 ? 2 : r1 < 0.12 ? 0 : -1;
          else if (c === 4) kind = r1 < 0.06 ? 4 : r1 < 0.12 ? 0 : -1;
          if (kind < 0) continue;
          if (sl > (kind === 4 || kind === 6 ? 1.2 : kind === 0 ? 0.95 : 0.85)) continue;
          if (vrWater(x, z).e > -3) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < (kind === 2 || kind === 3 ? 4 : 1.6)) continue;
          if (excluded(x, z)) continue;
          if (kind === 0) pk[0].add(x, y0 - 0.05, z, r2 * TAU, 0.8 + r3 * 0.7, 0.6 + r4 * 0.5, [0.92 + r2 * 0.16, 0.9 + r3 * 0.14, 0.86 + r4 * 0.16]);
          else if (kind === 1) pk[1].add(x, y0 - 0.12, z, r2 * TAU, 1.4 + r3 * 1.4, 1.1 + r4 * 1.2, r2 < 0.22 ? [1.5 + r3 * 0.2, 1.5 + r3 * 0.15, 1.95 + r4 * 0.2] : [0.88 + r2 * 0.24, 0.9 + r3 * 0.18, 0.88 + r4 * 0.16]);   // (one in five the grey-green coastal sage among the chaparral)
          else if (kind === 6) { pk[6].add(x, y0 - 0.05, z, r2 * TAU, 0.8 + r3 * 0.6, 0.7 + r4 * 0.5, [0.92 + r2 * 0.16, 0.95 + r3 * 0.1, 0.95 + r4 * 0.1]); if (r4 < 0.35) pk[7].add(x, y0, z, r3 * TAU, 1, 3.2 + r2 * 2.2, [0.9 + r3 * 0.2, 0.9 + r3 * 0.2, 0.9 + r3 * 0.2]); }
          else if (kind === 2) { pk[2].add(x, y0 - 0.15, z, r2 * TAU, 9 + r3 * 7, 7 + r4 * 5, [0.9 + r2 * 0.2, 0.92 + r3 * 0.16, 0.9]); nTrees++; }
          else if (kind === 3) { pk[3].add(x, y0 - 0.15, z, r2 * TAU, 11 + r3 * 6, 13 + r4 * 7, [0.92 + r2 * 0.16, 0.95 + r3 * 0.1, 0.9]); nTrees++; }
          else { const k = 0.86 + r3 * 0.28; pk[4].add(x, y0 - 0.2, z, r4 * TAU, 0.8 + r3 * 2.2, 0.6 + r4 * 1.6, [k, k * (0.97 + r2 * 0.05), k * (0.95 + r2 * 0.08)]); }
          if (++nPlants >= maxT) break grid;
        }
      }
    }
    {   // stones strewn beside the road, thickest at its edge
      const RS = rng(3177), maxS = Math.round(16000 * dens); let nS = 0;
      edge: for (let s = 12; s < T.len - 12; s += 1.3 / dens) for (const side of [-1, 1]) {
        const o = 1.7 + Math.pow(RS(), 2) * 34, [x, z] = onSide(s, side, o), r1 = RS(), r2 = RS(), r3 = RS();
        if (vrNear(x, z).dd < 1.2 || excluded(x, z) || vrWater(x, z).e > -3) continue;
        const y0 = caGround(x, z), sl = caSlope(x, z); if (sl > 1.15 || (vrLC(x, z) === 0 && r1 < 0.5)) continue;
        const k = 0.86 + r3 * 0.24, sc = 0.8 + r1 * 1.1; pk[5].add(x, y0 - 0.04, z, r2 * TAU, sc, sc * (0.8 + r3 * 0.5), [k, k, k]);
        if (++nS >= maxS) break edge;
      }
    }
    for (let k = 0; k < pk.length; k++) pk[k].addTo(root, k === 2 || k === 3);

    /* ---- the road cuts and the slopes: sandstone outcrops where the slope rises steep beside the road, boulders at the foot of the cuts ---- */
    {
      const RV = rng(3181), rockC = [[0.8, 0.7, 0.54], [0.74, 0.65, 0.5], [0.68, 0.66, 0.6], [0.78, 0.62, 0.46], [0.62, 0.6, 0.56]];
      for (let s = 10; s < T.len - 10; s += 7) for (const side of [-1, 1]) {
        if (RV() > 0.3) continue;
        const o = 1.6 + Math.pow(RV(), 1.5) * 34, [x, z] = onSide(s, side, o), sz = 0.4 + RV() * 1.2; if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z) || vrWater(x, z).e > -3) continue;
        const y = caGround(x, z), sl = caSlope(x, z); if (sl < 0.35 && vrLC(x, z) !== 4) continue;
        rock(scen.get(x, z), x, y + sz * 0.3, z, sz * 1.2, sz, sz, RV() * TAU, vary(rockC[Math.floor(RV() * rockC.length)], RV, 0.1), RV, 0.32);
      }
      for (let s = 16; s < T.len - 16; s += 18) for (const side of [-1, 1]) {   // outcrops where the slope is steep: rounded, layered sandstone
        if (RV() < 0.45) continue;
        const [x, z] = onSide(s, side, 8 + RV() * 70); if (excluded(x, z) || vrNear(x, z).dd < 6 || vrDist(x, z) > LOD.cap(90)) continue;
        const sl = caSlope(x, z); if (sl < 0.75) continue;
        const y = caGround(x, z), g = scen.get(x, z), n = 2 + Math.floor(RV() * 3), b0 = vary(rockC[Math.floor(RV() * rockC.length)], RV, 0.08);
        for (let q = 0; q < n; q++) { const r0 = 2 + RV() * 3.5, qx = x + (RV() - 0.5) * 8, qz = z + (RV() - 0.5) * 8, qy = caGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 1) continue;
          rock(g, qx, qy + r0 * 0.35, qz, r0, r0 * (0.6 + RV() * 0.5), r0 * (0.7 + RV() * 0.4), RV() * TAU, vary(b0, RV, 0.08), RV, 0.3, true); }
      }
    }

    /* ---- finish the meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    fac.addTo(sceneryGroup, ouCutMat(new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true }), cut), true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: mhAtlas(cpAlt, fmtAlt(T.altAt(T.hy[T.finishIdx]))), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: mhAtlas2(), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    crowdFinish(CR, root, out);
    out.stats = { plants: nPlants, trees: nTrees, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, rails: +(nRail / (2 * N)).toFixed(3), poles: nPoles, sideRoads: out.stubStats.n };   // (read by the tests)
    return out;
  }

  Object.assign(API, { mhPlantGeo });   // (what World and the other worlds use of this one)
  World.ext.mulholland = (scene, tex, opts) => buildMulholland(scene, tex, opts);
})();
