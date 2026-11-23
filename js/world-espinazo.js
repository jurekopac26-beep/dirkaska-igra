/* =========================================================================
   WORLD — Espinazo del Diablo (theme 'espinazo'): its own builder (World.ext.espinazo). What it uses of World comes from World.api: the helpers
   bound here once, the state that changes as API.<name>, the track being built and its theme (LOD, T) copied in at each build. Built on
   Vršič's corridor (vrPrep and Los Caracoles' terrain helpers caH / caGround read the same forms: def.dem, def.lc), as Ella; js/world-prelaz.js
   is not used (the hairpin's legs lie 40 m apart: no walls between them).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    AB, Chunks, GB, IChunks, TAU, VRC, VRT, aPuff, aTier, aTrunk, atSf, box, caCar, caGH, caGround, caSlope, caTileOn, clamp, crowdCtx,
    crowdFinish, crowdPut, crowdRun, cyl, gable, lerp, ouCutMat, parkOn, pkGroundMat, propFloorTable, rng, roadsideProps, rock, rpHash, sstep,
    valueNoise2, vary, vrDist, vrFar, vrGritTex, vrLC, vrLCf, vrNear, vrPrep
  } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ================= ESPINAZO DEL DIABLO (theme 'espinazo') =================
     The old federal road 40 along the Espinazo del Diablo, the narrow crest between two deep canyons in the Sierra Madre Occidental (Durango,
     Mexico), from the crest at the start past the viewpoint, the homesteads and a roadside restaurant, round the one hairpin to the edge of
     El Palmito, on a clear, dry morning. A look of its own: the ground's colours (eCol: the olive grass with its golden patches, the rusty
     pine-needle litter under the forest, the bare tan earth of the yards, the pinkish-grey volcanic tuff of the cliffs and the cuts), the
     plants of the pine-oak forest (eTreeGeo: tall pines, oaks, agaves on the rocky slopes, young pines, shrubs, tufts of bunch grass), the
     crags along OpenStreetMap's cliffs (def.cliffs), the homesteads (def.bld: plastered or adobe walls under roofs of corrugated sheet, a
     black water tank on the roof, a shed beside; generic), the roadside restaurant (a porch on the road side with plastic tables under it; no
     name or sign), the pickups parked by them, the metal guardrails on the drops, the yellow centre line (double through the bends) and the
     white edge lines, the chevrons, the viewpoint terrace (def.views) and the pull-outs (def.parks), the power line's wooden poles
     (def.power), the land beyond the corridor (irFar: the forested ridges one behind the other, the canyons' floors far below). Only
     geographic names on the boards. */
  const ECOL = [0, 0, 0];
  function eCol(x, z, h, ny, dd) {   // ground colour (times the grey grit map): the olive grass of the open slopes (lc 0) with golden patches and
    // greener hollows, the rusty pine-needle litter of the forest (lc 1), the oak woodland's grass and leaves (lc 6), the scrub (lc 2), the
    // bare tan earth of the yards (lc 3), the pinkish-grey tuff (lc 4), the pastures (lc 7); on the steep faces the tuff and the brown earth
    // of the cuts; the dust worn bare along the shoulder (dd: metres from it)
    const P = API.VR, f = P.n4(x, z), q = P.c2(x, z), m = P.c1(x, z);
    let R = 0.37, G = 0.37, B = 0.18;
    const lu = sstep(0.34, 0.12, q) * 0.4; R = lerp(R, 0.27, lu); G = lerp(G, 0.32, lu); B = lerp(B, 0.14, lu);   // (the greener hollows)
    const dry = sstep(0.56, 0.86, q) * 0.5; R = lerp(R, 0.56, dry); G = lerp(G, 0.48, dry); B = lerp(B, 0.25, dry);   // (the golden patches)
    const fo = vrLCf(x, z, 1) * 0.85; R = lerp(R, 0.3, fo); G = lerp(G, 0.25, fo); B = lerp(B, 0.15, fo);
    const wo = vrLCf(x, z, 6) * 0.7; R = lerp(R, 0.4, wo); G = lerp(G, 0.36, wo); B = lerp(B, 0.19, wo);
    const sh = vrLCf(x, z, 2) * 0.7; R = lerp(R, 0.33, sh); G = lerp(G, 0.34, sh); B = lerp(B, 0.17, sh);
    const se = vrLCf(x, z, 3) * 0.6; R = lerp(R, 0.57, se); G = lerp(G, 0.47, se); B = lerp(B, 0.34, se);
    const cl = vrLCf(x, z, 7) * 0.8; if (cl > 0) { const pt = P.c5(x * 1.4, z * 1.4); R = lerp(R, lerp(0.36, 0.52, pt), cl); G = lerp(G, lerp(0.43, 0.47, pt), cl); B = lerp(B, lerp(0.18, 0.25, pt), cl); }
    const ba = Math.max(vrLCf(x, z, 4), sstep(0.72, 0.92, m) * 0.2); R = lerp(R, 0.6, ba); G = lerp(G, 0.53, ba); B = lerp(B, 0.49, ba);
    R += (f - 0.5) * 0.07; G += (f - 0.5) * 0.06; B += (f - 0.5) * 0.04;
    const st = sstep(0.7, 0.42, ny) * (dd < 30 ? 0.9 : 0.5) * (1 - 0.5 * fo);   // the steep faces: the tuff, the brown earth of the cuts
    if (st > 0) { const gn = sstep(0.45, 0.8, P.c3(x, z)), k = 0.9 + 0.12 * P.n2(x * 2, z * 2);
      R = lerp(R, lerp(0.45, 0.55, gn) * k, st); G = lerp(G, lerp(0.36, 0.48, gn) * k, st); B = lerp(B, lerp(0.27, 0.44, gn) * k, st); }
    if (dd < 1.6) { const t = sstep(1.6, 0.1, dd) * 0.5; R = lerp(R, 0.57, t); G = lerp(G, 0.49, t); B = lerp(B, 0.38, t); }   // (the dust beside the shoulder)
    ECOL[0] = R; ECOL[1] = G; ECOL[2] = B; return ECOL;
  }
  function eGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (as caGCol, coloured by eCol)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = caGH(ii, jj);
      const nx = -(caGH(ii + 1, jj) - caGH(ii - 1, jj)) / (2 * VRC), nz = -(caGH(ii, jj + 1) - caGH(ii, jj - 1)) / (2 * VRC), l = Math.hypot(nx, 1, nz), c = eCol(G.x0 + ii * VRC, G.z0 + jj * VRC, h, 1 / l, G.dd[jj * G.nx + ii]);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function eTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex), as caTileGeo, coloured by eCol
    const G = API.VR.G, m = VRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * VRT, j0 = tj * VRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * VRC, z = G.z0 + j * VRC, h = caGH(i, j);
      let nx = -(caGH(i + st, j) - caGH(i - st, j)) / (2 * VRC * st), nz = -(caGH(i, j + st) - caGH(i, j - st)) / (2 * VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = eCol(x, z, h, ny, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)]);
      if (st > 1) { const fo = vrLCf(x, z, 1) * 0.85, wo = vrLCf(x, z, 6) * 0.6;   // (the coarse ring has no plants and lies beyond the camera's far plane: the menu's model
        // sees it from above, so its forest is the canopy's green)
        c[0] = lerp(lerp(c[0], 0.24, wo), 0.16, fo); c[1] = lerp(lerp(c[1], 0.29, wo), 0.23, fo); c[2] = lerp(lerp(c[2], 0.14, wo), 0.11, fo); }
      col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
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
  function eFarCol(A, sl, q) {   // the land beyond the corridor (irFar): the pines dark on the high ridges, oak and pine below them, the dry forest
    // of the canyons' floors olive and tan far below, the pinkish-grey tuff on the steepest faces
    const rk = sstep(0.95, 1.6, sl) * 0.45, low = sstep(1300, 800, A) * 0.5, hi = sstep(1700, 2200, A);
    let c = [0.21 + q * 0.05, 0.27 + q * 0.05, 0.14 + q * 0.03];
    c = [lerp(c[0], 0.15, hi), lerp(c[1], 0.23, hi), lerp(c[2], 0.13, hi)];
    c = [lerp(c[0], 0.42, low), lerp(c[1], 0.4, low), lerp(c[2], 0.24, low)];
    return [lerp(c[0], 0.44, rk), lerp(c[1], 0.4, rk), lerp(c[2], 0.36, rk)];
  }
  let eATex = null, eAKey = '', eA2Tex = null;   // (the board atlases, made once and reused by every build of the road)
  function eAtlas(cps, finA) {   // text boards (8 rows of 1024 x 128): START, FINISH, CP1-CP4 with the altitude, El Palmito's board at the finish, the race's banner
    const key = cps.join('|') + '|' + finA; if (eATex && eAKey === key) return eATex;
    if (eATex) eATex.dispose(); eAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 100, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(262, 142, 500, 100); txt('FINISH', 512, 196, 92, '#111', 470);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#1e5b3e'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(240,196,70,0.95)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#f0c446', 520); });
    x.fillStyle = '#1c6b3a'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#f2f2ee'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);
    txt('EL PALMITO', 512, 812, 60, '#f6f4ec', 900); txt(finA, 512, 862, 46, '#f6f4ec', 900);
    x.fillStyle = '#7d1f24'; x.fillRect(0, 896, 1024, 128); x.fillStyle = '#e3a92c'; x.fillRect(0, 956, 1024, 8);
    txt('ESPINAZO DEL DIABLO', 512, 930, 52, '#fff', 980); txt('DURANGO · SIERRA MADRE', 512, 994, 44, '#f0c446', 900);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (eATex = t);
  }
  const GREEN = '#1c6b3a', BLUE = '#1d4f9a', WARN = '#f2c21c';
  const E_BOARDS = [['EL PALMITO', GREEN], ['DURANGO', GREEN], ['MAZATLÁN', GREEN], ['MIRADOR', BLUE], ['CURVA PELIGROSA', WARN], ['DESPACIO', WARN], ['ESPINAZO DEL DIABLO', BLUE], ['CONCORDIA', GREEN]];
  function eAtlas2() {   // the small signs: cells 30-31 the chevrons (black on yellow, pointing the way the road turns); rows 4-7, the boards (two a row, 512 x 128):
    // the places green, the viewpoint and the ridge blue, the warnings black on yellow
    if (eA2Tex) return eA2Tex;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 470); };
    for (const [k, dir] of [[30, 1], [31, -1]]) {
      const x0 = (k % 8) * 128, y0 = Math.floor(k / 8) * 128; x.fillStyle = '#f2c21c'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#141414';
      for (const o of [-26, 14]) { x.beginPath(); const cx = x0 + 64 + o * dir; x.moveTo(cx - 14 * dir, y0 + 22); x.lineTo(cx + 18 * dir, y0 + 64); x.lineTo(cx - 14 * dir, y0 + 106); x.lineTo(cx - 34 * dir, y0 + 106); x.lineTo(cx - 2 * dir, y0 + 64); x.lineTo(cx - 34 * dir, y0 + 22); x.closePath(); x.fill(); } }
    E_BOARDS.forEach(([n, bg], k) => { const x0 = (k % 2) * 512, y0 = 512 + Math.floor(k / 2) * 128, warn = bg === WARN;
      x.fillStyle = bg; x.fillRect(x0, y0, 512, 128); x.strokeStyle = warn ? '#141414' : '#f2f2ee'; x.lineWidth = warn ? 10 : 6; x.strokeRect(x0 + 8, y0 + 8, 496, 112);
      txt(n, x0 + 256, y0 + 66, 52, warn ? '#141414' : '#f2f2ee', 470); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (eA2Tex = t);
  }
  // a leaf of the soft plants (AB): from its base along a, rising, then (droop > 0) falling to its tip or (droop < 0) still rising; both faces
  function aFrond(b, cx, cy, cz, a, L, lift, droop, wd, col, tip) {
    const ux = Math.cos(a), uz = Math.sin(a), px = -uz * wd, pz = ux * wd, mx = cx + ux * L * 0.5, mz = cz + uz * L * 0.5, my = cy + lift, up = 0.8, k = Math.hypot(0.25, up);
    const i0 = b.v(cx, cy, cz, ux * 0.25 / k, up / k, uz * 0.25 / k, col), i1 = b.v(mx + px, my, mz + pz, 0, 1, 0, col), i2 = b.v(mx - px, my, mz - pz, 0, 1, 0, col), i3 = b.v(cx + ux * L, cy + lift - droop, cz + uz * L, ux * 0.3, 0.95, uz * 0.3, tip);
    const above = [mx, my + 1, mz], below = [mx, my - 1, mz];
    b.t(i0, i1, i3, below); b.t(i0, i3, i2, below); b.t(i0, i1, i3, above); b.t(i0, i3, i2, above);
  }
  function eTreeGeo(kind) {   // unit plants (height 1; the instances scale and tint them) in the soft look A (AB, docs/drevesa-a.md): 0 a tall pine of
    // the sierra (a long straight trunk of rusty bark, its crown of dark blue-green clumps up the top half), 1 an oak (a short trunk, a broad
    // dark olive crown of three clumps), 2 an agave (a rosette of stiff blue-grey leaves rising from the ground), 3 a young pine (three tiers),
    // 4 a shrub (a low rounded clump), 5 a tuft of bunch grass (golden)
    const b = new AB(), R = rng(1980 + kind), sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
    if (kind === 0) {   // (41 vertices)
      aTrunk(b, 0, -0.02, 0, 0.028, 0.8, 4, [0.42, 0.29, 0.21]);
      const cs = [0.12, 0.22, 0.13]; aPuff(b, 0, 0.86, 0, 0.17, 0.75, cs, R, 0.35, 0.5, 1.25); aPuff(b, 0.07, 0.7, 0.04, 0.2, 0.6, sh(cs, 1.06), R, 0.35, 0.5, 1.25, -0.3);
      aPuff(b, -0.08, 0.55, -0.03, 0.18, 0.55, sh(cs, 0.94), R, 0.35, 0.5, 1.25, -0.3);
    } else if (kind === 1) {   // (41 vertices)
      aTrunk(b, 0, -0.02, 0, 0.05, 0.42, 4, [0.33, 0.28, 0.22]);
      const cs = [0.19, 0.25, 0.11]; aPuff(b, 0, 0.64, 0, 0.36, 0.62, cs, R, 0.3, 0.55, 1.25); aPuff(b, 0.26, 0.55, 0.1, 0.27, 0.66, sh(cs, 1.08), R, 0.3, 0.55, 1.25, -0.3);
      aPuff(b, -0.24, 0.56, -0.12, 0.27, 0.66, sh(cs, 0.93), R, 0.3, 0.55, 1.25, -0.3);
    } else if (kind === 2) {   // (36 vertices)
      for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + R() * 0.35, inn = k % 3 === 0;
        aFrond(b, 0, 0.02, 0, a, inn ? 0.2 : 0.42, inn ? 0.42 : 0.3, inn ? -0.4 : -0.22, 0.06, k % 2 ? [0.33, 0.43, 0.37] : [0.39, 0.49, 0.41], [0.52, 0.5, 0.36]); }
    } else if (kind === 3) {   // (23 vertices)
      aTrunk(b, 0, -0.02, 0, 0.04, 0.3, 4, [0.4, 0.3, 0.22]);
      const cb = [0.11, 0.21, 0.12], ct = [0.2, 0.32, 0.18];
      aTier(b, 0, 0.16, 0, 0.42, 0.42, 6, cb, ct, R()); aTier(b, 0, 0.4, 0, 0.32, 0.38, 6, sh(cb, 1.05), ct, R()); aTier(b, 0, 0.62, 0, 0.2, 0.38, 5, sh(cb, 1.1), ct, R());
    } else if (kind === 4) {   // (24 vertices)
      const cs = [0.25, 0.31, 0.14]; aPuff(b, 0, 0.42, 0, 0.55, 0.75, cs, R, 0.4, 0.6, 1.3); aPuff(b, 0.32, 0.32, 0.14, 0.34, 0.8, sh(cs, 1.1), R, 0.4, 0.6, 1.3, -0.3);
    } else {   // (12 vertices)
      const cs = [0.5, 0.46, 0.24], tp = [0.74, 0.66, 0.4];
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + R() * 0.6, d = k ? 0.16 : 0; aTier(b, Math.cos(a) * d, 0, Math.sin(a) * d, 0.24, 1 - d * 0.8, 3, cs, tp, a); }
    }
    return b.geometry();
  }
  // a single-pitch roof of corrugated sheet over walls Lw x Dw (its low eave at cy on the local -z side, h higher at +z; ov: the overhang all
  // round), with the walls' triangles at the ends and the strip along the high side in the walls' colour
  function leanTo(g, cx, cy, cz, Lw, Dw, ov, h, rot, roofC, wallC) {
    const c = Math.cos(rot), s = Math.sin(rot), P = (lx, ly, lz) => [cx + lx * c - lz * s, cy + ly, cz + lx * s + lz * c], k = h / Dw;
    const L2 = Lw / 2 + ov, D2 = Dw / 2 + ov, inn = [cx, cy - 2, cz], c2 = [roofC[0] * 0.8, roofC[1] * 0.8, roofC[2] * 0.8];
    const a = P(-L2, -ov * k, -D2), b = P(L2, -ov * k, -D2), cc = P(L2, h + ov * k, D2), d = P(-L2, h + ov * k, D2);
    g.quadO(a, b, cc, d, roofC, inn); g.quadO(d, cc, b, a, c2, [cx, cy + 9, cz]);   // (its top and, seen from under the eaves, its underside)
    const w0 = P(-Lw / 2, 0, -Dw / 2), w1 = P(-Lw / 2, 0, Dw / 2), w2 = P(-Lw / 2, h, Dw / 2), w3 = P(Lw / 2, 0, -Dw / 2), w4 = P(Lw / 2, 0, Dw / 2), w5 = P(Lw / 2, h, Dw / 2), mid = [cx, cy, cz];
    g.triO(w0, w1, w2, wallC, mid); g.triO(w3, w4, w5, wallC, mid); g.quadO(w1, w4, w5, w2, wallC, mid);
  }
  // a pickup (generic: no make, no badges): x along it, the cab at +x; 5.3 x 1.85 m
  const PK_BLACK = [0.07, 0.07, 0.08], PK_GLASS = [0.28, 0.36, 0.42];
  function pickup(g, x, y, z, rot, col) {
    const c = Math.cos(rot), s = Math.sin(rot), at = (u, v) => [x + c * u - s * v, z + s * u + c * v], dk = [col[0] * 0.82, col[1] * 0.82, col[2] * 0.82];
    let p = at(0, 0); box(g, p[0], y + 0.36, p[1], 5.3, 0.6, 1.85, rot, dk, col, true);   // the body up to the waist
    p = at(0.55, 0); box(g, p[0], y + 0.96, p[1], 1.9, 0.72, 1.76, rot, col, col, true);   // the cab
    p = at(1.51, 0); box(g, p[0], y + 1.02, p[1], 0.06, 0.58, 1.6, rot, PK_GLASS, null, true);   // the windscreen
    for (const v of [-0.88, 0.88]) { p = at(-1.5, v); box(g, p[0], y + 0.96, p[1], 2.2, 0.3, 0.08, rot, col, col, true); }   // the bed's sides
    p = at(-2.61, 0); box(g, p[0], y + 0.96, p[1], 0.08, 0.3, 1.85, rot, col, col, true);   // the tailgate
    for (const [u, v] of [[1.75, -0.8], [1.75, 0.8], [-1.65, -0.8], [-1.65, 0.8]]) { p = at(u, v); box(g, p[0], y, p[1], 0.74, 0.74, 0.3, rot, PK_BLACK, null, true); }
  }
  // the knockable roadside posts: white with a black top
  function eProps(out, spots, prof) {
    out.propR = 150;
    out.propFloor = propFloorTable(null, prof);
    const sA = T.startS + 30, sB = T.finishS - 30;
    return out.propStats = roadsideProps(out.props, { spots, postEdge: [1.2, 1.6], postCol: () => 0, exits: 0, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
      floor: out.propFloor, skip: (i) => { const s = i * T.ds; return s < sA || s > sB; } });
  }

  function buildEspinazo(scene, tex, opts) {
    const R = rng(6113), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: caGround, camFloor: caGround, props: [], farClip: true, ownTex: [], dust: [0.58, 0.5, 0.4] };
    vrPrep();
    API.caBank = null;   // (no walls between legs, no ravines: caH as the corridor gives it)
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS;
    P.c1 = valueNoise2(941, 150); P.c2 = valueNoise2(942, 64); P.c3 = valueNoise2(943, 90); P.c4 = valueNoise2(944, 120); P.c5 = valueNoise2(945, 26);
    P.fin = [T.px[T.finishIdx], T.pz[T.finishIdx]];
    // the buildings (def.bld: the homesteads, their sheds and the restaurant): clear of the road; where one comes within 1.6 m of the barrier
    // (on the outside of a bend the barrier lies farther out than the real verge) it is moved out across the road's line, 8 m at most; the
    // restaurant with its porch
    const blds = [];
    for (const b of def.bld || []) {
      let [x, z, L, W0, ang, kind, lv] = b; const W = Math.min(W0, 16); if (L < 3.5 || W < 3) continue; if (vrDist(x, z) > 285) continue;
      const c = Math.cos(ang), s = Math.sin(ang), Wc = kind === 5 ? W + 7 : W;
      const minDd = () => { let m = 1e9; for (const [u, v] of [[0, 0], [-L / 2, -Wc / 2], [L / 2, -Wc / 2], [L / 2, Wc / 2], [-L / 2, Wc / 2], [0, -Wc / 2], [0, Wc / 2]]) { const nn = vrNear(x + c * u - s * v, z + s * u + c * v); if (nn.i >= 0) m = Math.min(m, nn.dd); } return m; };
      let ok = false, moved = 0;
      for (let k = 0; k < 5 && moved <= 8; k++) { const m = minDd(); if (m >= 1.6) { ok = true; break; }
        const ni = T.nearestIdx(x, z), sd = (x - T.px[ni]) * T.nx[ni] + (z - T.pz[ni]) * T.nz[ni] >= 0 ? 1 : -1, push = 2 - m; x += T.nx[ni] * sd * push; z += T.nz[ni] * sd * push; moved += push; }
      if (ok) blds.push({ x, z, L, W, ang, kind, lv, d: vrDist(x, z) });
    }
    const nearBld = (x, z, m) => blds.some(b => Math.abs((x - b.x) * Math.cos(b.ang) + (z - b.z) * Math.sin(b.ang)) < b.L / 2 + m && Math.abs(-(x - b.x) * Math.sin(b.ang) + (z - b.z) * Math.cos(b.ang)) < b.W / 2 + (b.kind === 5 ? 3.6 : 0) + m);
    // the level plots: the viewpoint's terrace (def.views within ~25 m of the barrier), the pull-outs (def.parks: moved out beside the road where
    // OpenStreetMap's area lies on it), the cars' park past the finish
    const views = [], parks = [];
    for (const [x, z] of def.views || []) { const n = vrNear(x, z); if (n.i < 0 || n.dd > 25) continue; const i = n.i, s = i * T.ds; if (s < sStart + 20 || s > sFin - 20) continue;
      const pad = { x, z, r: 6, b: 8, h: T.hy[i] - 0.15, i }; P.pads.push(pad); views.push(pad); }
    for (const [x0, z0, r0] of def.parks || []) { const n = vrNear(x0, z0); if (n.i < 0 || n.dd > 30) continue; const i = n.i;
      const lat = (x0 - T.px[i]) * T.nx[i] + (z0 - T.pz[i]) * T.nz[i], vw = views.find(v => Math.abs(v.i - i) * T.ds < 60);
      const sd = vw ? ((vw.x - T.px[i]) * T.nx[i] + (vw.z - T.pz[i]) * T.nz[i] > 0 ? 1 : -1) : lat >= 0 ? 1 : -1, r = clamp(r0, 5, 8), bar = sd > 0 ? T.br[i] : T.bl[i], o = Math.max(Math.abs(lat), bar + 0.6 + r * 0.55);
      const pad = { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r, b: 10, h: T.hy[i] - 0.2, i, sd }; P.pads.push(pad); parks.push(pad); }
    const padBeside = (s, r) => { const i = T.idx(s), gd = (sd) => Math.abs(vrFar(T.px[i] + T.nx[i] * sd * r, T.pz[i] + T.nz[i] * sd * r) - T.hy[i]), sd = gd(1) < gd(-1) ? 1 : -1, o = (sd > 0 ? T.br[i] : T.bl[i]) + r + 1;
      return { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r, b: 14, h: T.hy[i] - 0.25, sd, i }; };
    const padF = padBeside(sFin + 60, 11); P.pads.push(padF);
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the trees and buildings between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (buildings, crowds, plots) for the plants and the rocks, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    for (const b of blds) exclPush(b.x, b.z, Math.hypot(b.L, b.W) / 2 + 2.5);
    for (const p of views) {   // the terrace and the path to it from the road (no trees on it)
      exclPush(p.x, p.z, p.r + 2); const i = p.i, ex = T.px[i], ez = T.pz[i], l = Math.hypot(p.x - ex, p.z - ez) || 1;
      for (let t = 0; t < l; t += 3) exclPush(ex + (p.x - ex) * t / l, ez + (p.z - ez) * t / l, 2.6); }
    for (const p of parks) exclPush(p.x, p.z, p.r + 2);
    exclPush(padF.x, padF.z, padF.r + 4);
    out.marks = {}; if (views.length) out.marks.view = [views[0].x, views[0].z];   // (where the landmarks stand: the tests look for them)

    /* ---- terrain tiles ---- */
    let nFar = 0;
    const tMat = pkGroundMat();
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        // (as Los Caracoles, and a coarse ring on out to ~650 m: the ridge's road bends round so that the menu's model, cut round the line's convex
        // hull, takes in land that far from it; in the game the chase camera's far plane (~270 m) never reaches it, so these tiles cost no drawing)
        let on = caTileOn(ti, tj); if (!on && vrDist(G.x0 + (ti + 0.5) * VRC * VRT, G.z0 + (tj + 0.5) * VRC * VRT) < 650) on = 2;
        if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(eTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
    }

    /* ---- the road: asphalt with the yellow centre line (dashed, double and solid through the bends) and white edge lines, a strip of gravel,
       then the verge (worn dust beside it, then grass or needles) out to a ditch past the barrier line (a concrete drain where the slope rises
       beside it); where the ground falls far below, the masonry wall that holds the road (its face out over the drop) (120 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true }), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const sw = 0.5;
    const gAt = (i, side, o) => { const q = side * o; return caGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - T.hy[i]; };
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w, lift = (o, h) => [o, Math.max(h, gAt(i, side, o) + 0.05)];   // (six points out from the shoulder)
      if (gAt(i, side, bar + 0.45) < -2.6) return [[e + sw, -0.02], [bar + 0.2, -0.04], [bar + 0.2, -0.04], [bar + 0.42, -0.05], [bar + 0.42, gAt(i, side, bar + 0.42) - 0.08], [bar + 1.9, gAt(i, side, bar + 1.9) + 0.03]];   // (a retaining wall: the verge, its coping flush with it, its face down to the ground)
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.3, Math.min(e + sw + 1.2, bar - 1.0)), -0.06), lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(i, side, bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(i, side, bar + 1.9) + 0.03]]; };   // (the verge; the ditch)
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    const hairS = (def.curves || []).map(([d]) => sStart + d);
    const bendS = T.corners.filter(c => c.sev >= 1).map(c => [c.i0 * T.ds - 25, c.i1 * T.ds + 25]);
    let nWall = 0;
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.8 - 0.12 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.86) k -= 0.05; k *= 0.96 + 0.08 * P.n2(T.px[i] * 0.5 + o, T.pz[i] * 0.5); return [k, k, k * 0.98]; };
      const wht = [0.94, 0.93, 0.88], yel = [0.93, 0.72, 0.16], gc = [0.56, 0.5, 0.42], wallC = [0.5, 0.45, 0.42], copeC = [0.66, 0.62, 0.58], conc = [0.64, 0.63, 0.6];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i], up = gAt(i, side, bar + 1.9) > 0.35;
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          const wl = vp[si][i][4][1] < -2.6; if (wl && k >= 2 && k <= 4) { const q = 0.92 + 0.12 * rpHash(i >> 2, 51 + si); return k < 4 ? [copeC[0] * q, copeC[1] * q, copeC[2] * q] : [wallC[0] * 0.85 * q, wallC[1] * 0.85 * q, wallC[2] * 0.85 * q]; }
          if (up && (k === 2 || k === 3)) { const q = (k === 3 ? 0.72 : 0.95) * (0.94 + 0.08 * rpHash(i >> 2, 91 + si)); return [conc[0] * q, conc[1] * q, conc[2] * q]; }   // (the concrete drain on the cut's side)
          if (k === 5) return eGCol(x, z);
          const sl = k === 3 ? caSlope(x, z) : 0, l = Math.sqrt(1 + sl * sl); return eCol(x, z, T.hy[i] + y, 1 / l, Math.max(0, o - w - sw)).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      const solid = (s) => hairS.some(h => Math.abs(s - h) < 55) || bendS.some(([a, b]) => s > a && s < b), dashOn = (s) => (s % 10) < 4;
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), gl = new GB(), gs = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / 6, s1 = j * T.ds / 6;
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
            gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
          if (i * T.ds > 3 && j < N - 2) {
            const s = i * T.ds, ln = (a, b) => gl.quadUp(Pt(i, a, 0.036), Pt(i, b, 0.036), Pt(j, b, 0.036), Pt(j, a, 0.036), [yel, yel, yel, yel]);
            if (solid(s)) { ln(-0.2, -0.08); ln(0.08, 0.2); } else if (dashOn(s)) ln(-0.06, 0.06);
            for (const sd of [-1, 1]) { const a = sd * (w - 0.32), b = sd * (w - 0.2); gl.quadUp(Pt(i, Math.min(a, b), 0.034), Pt(i, Math.max(a, b), 0.034), Pt(j, Math.max(a, b), 0.034), Pt(j, Math.min(a, b), 0.034), [wht, wht, wht, wht]); }
          }
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j];
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [gc, gc, gc, gc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            for (let k = 0; k < 5; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              if (k === 3 && (qi[4][1] < -2.6 || qj[4][1] < -2.6)) { gv.quadO(a, b, c, d, null, Pt(i, 0, Math.min(qi[4][1], qj[4][1]) * 0.5), [wuv(a), wuv(b), wuv(c), wuv(d)], [ci[k], ci[k + 1], cj[k + 1], cj[k]]); nWall++; }   // (the wall's face: out, over the drop)
              else gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
        }
        addM(gr, aMat); addM(gl, lMat); addM(gs, sMat); addM(gv, gMat);
      }
      const gq = new GB(true), gw2 = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1];   // chequered start and finish lines, a white line at each checkpoint
      for (const s0 of [sStart, sFin]) { const a = atSf(s0 - 0.8, -w), b = atSf(s0 - 0.8, w), c = atSf(s0 + 0.8, w), d = atSf(s0 + 0.8, -w), y = (p) => T.hy[p[3]] + 0.045;
        gq.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]); }
      for (const s0 of T.cpS) { const a = atSf(s0 - 0.25, -w + 0.1), b = atSf(s0 - 0.25, w - 0.1), c = atSf(s0 + 0.25, w - 0.1), d = atSf(s0 + 0.25, -w + 0.1), y = (p) => T.hy[p[3]] + 0.042;
        gw2.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [wht, wht, wht, wht]); }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw2, lMat);
    }

    /* ---- scenery (vertex coloured, 110 m chunks) ---- */
    const scen = new Chunks(110), ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];   // (ban: the race's boards, ban2: the signs)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.94, 0.94, 0.92], [0.82, 0.18, 0.16], [0.18, 0.42, 0.3], [0.95, 0.74, 0.2], [0.2, 0.36, 0.66], [0.6, 0.22, 0.42], [0.14, 0.15, 0.2], [0.88, 0.52, 0.28], [0.5, 0.7, 0.86], [0.8, 0.78, 0.7]];
    const CR = crowdCtx({ gH: caGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, shirts: fans }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1; tilt leans its top towards +t
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const board = (k) => { const v1 = 1 - (4 + Math.floor(k / 2)) / 8; return [v1 - 1 / 8, v1, (k % 2) * 0.5, (k % 2) * 0.5 + 0.5]; };   // a board of the second atlas: [v0, v1, u0, u1]
    const signAt = (s, side, k, o) => { const [bx, bz, bi] = onSide(s, side, o || 1.4); if (excluded(bx, bz)) return;   // a board on a post, facing the cars coming up
      const by = caGround(bx, bz), [v0, v1, u0, u1] = board(k); box(scen.get(bx, bz), bx, by - 0.2, bz, 0.1, 2.6, 0.1, T.hd[bi], [0.6, 0.61, 0.63]); bannerQ(bx, by + 1.7, bz, -T.tx[bi], -T.tz[bi], 3.2, 0.8, v0, v1, u0, u1, ban2); exclPush(bx, bz, 2); };
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road: two posts at the barriers, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.9, L2 = T.br[i] + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 12.8, 1.6, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, col) => crowdPut(CR, x, caGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: col || fans[Math.floor(R() * fans.length)] }, 1);
    const carCols = [[0.92, 0.92, 0.9], [0.62, 0.62, 0.6], [0.16, 0.16, 0.18], [0.66, 0.1, 0.1], [0.8, 0.76, 0.64], [0.2, 0.3, 0.5], [0.95, 0.95, 0.94]];
    const pkCols = [[0.94, 0.94, 0.92], [0.58, 0.6, 0.62], [0.12, 0.13, 0.15], [0.56, 0.12, 0.1], [0.18, 0.28, 0.5], [0.74, 0.7, 0.6], [0.3, 0.36, 0.26]];
    const park = (g, x, z, rot, k) => { const y = caGround(x, z); if (k % 2) pickup(g, x, y, z, rot, vary(pkCols[k % pkCols.length], R, 0.08)); else parkOn(caCar, caGround, 4.4, g, x, y, z, rot, vary(carCols[k % carCols.length], R, 0.2)); };

    /* ---- the buildings: the homesteads (plastered walls in white, cream, ochre, pale pink, blue or green, some of bare adobe, on a plinth into
       the slope; low gabled or single-pitch roofs of corrugated sheet, grey, rusty or painted red, some of clay tile; a black water tank on the
       roof; small dark windows and a door on the side to the road), the sheds (grey-brown planks under a single-pitch sheet roof), the
       restaurant (long and low, a band of strong colour along its foot, a porch on the road side with plastic tables under it; no name, no
       sign) ---- */
    let nBld = 0, nTables = 0, nParked = 0;
    {
      const RB = rng(6121), sheet = [[0.6, 0.61, 0.62], [0.52, 0.34, 0.24], [0.55, 0.2, 0.16], [0.68, 0.69, 0.7]], tile = [[0.62, 0.3, 0.2], [0.68, 0.36, 0.22]], win = [0.12, 0.11, 0.1], plinth = [0.4, 0.37, 0.34];
      const plaster = [[0.93, 0.91, 0.84], [0.92, 0.84, 0.64], [0.88, 0.68, 0.52], [0.7, 0.8, 0.84], [0.76, 0.86, 0.7], [0.96, 0.94, 0.9], [0.9, 0.76, 0.42]], adobe = [0.62, 0.5, 0.38], plank = [0.46, 0.38, 0.29];
      const band = [[0.7, 0.14, 0.12], [0.14, 0.42, 0.26], [0.16, 0.32, 0.62]], tabC = [[0.86, 0.2, 0.16], [0.94, 0.94, 0.92], [0.2, 0.36, 0.7]];
      for (const b of blds) {
        const c = Math.cos(b.ang), s = Math.sin(b.ang), near = b.d < 75; let lo = 1e9;
        for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) lo = Math.min(lo, caGround(b.x + c * u - s * v, b.z + s * u + c * v));
        const g = scen.get(b.x, b.z), shed = b.kind === 7, rest = b.kind === 5, H = shed ? 2.5 : rest ? 3.3 : 2.9;
        const ni = T.nearestIdx(b.x, b.z), sd = ((T.px[ni] - b.x) * -s + (T.pz[ni] - b.z) * c) > 0 ? 1 : -1;   // (the side to the road: local z = sd)
        const col = shed ? vary(plank, RB, 0.06) : !rest && RB() < 0.25 ? vary(adobe, RB, 0.05) : vary(plaster[Math.floor(RB() * plaster.length)], RB, 0.04), dk = [col[0] * 0.86, col[1] * 0.86, col[2] * 0.86];
        const roofC = vary(!shed && !rest && RB() < 0.2 ? tile[Math.floor(RB() * tile.length)] : sheet[Math.floor(RB() * sheet.length)], RB, 0.05);
        box(g, b.x, lo - 1.2, b.z, b.L + 0.1, 1.6, b.W + 0.1, b.ang, plinth, plinth, true);   // (the plinth, down into the slope)
        box(g, b.x, lo + 0.4, b.z, b.L, H - 0.4, b.W, b.ang, col, dk, true);
        if (rest) { const bc = band[Math.floor(RB() * band.length)]; box(g, b.x, lo + 0.4, b.z, b.L + 0.06, 0.9, b.W + 0.06, b.ang, bc, bc, true); }   // (the band of colour along its foot)
        const ov = 0.45;
        if (shed || rest || RB() < 0.3) leanTo(g, b.x, lo + H, b.z, b.L, b.W, ov, Math.min(b.W, 8) * 0.12 + 0.2, b.ang + (sd > 0 ? PI : 0), roofC, col);   // (the low eave to the road)
        else gable(g, b.x, lo + H, b.z, b.L + 2 * ov, b.W + 2 * ov, Math.min(b.W, 10) * 0.16 + 0.3, b.ang, roofC, dk);
        if (!shed && !rest && RB() < 0.8) {   // the black water tank on its stand of blocks at one end of the house
          const u = (RB() < 0.5 ? -1 : 1) * (b.L / 2 + 0.95), px = b.x + c * u, pz = b.z + s * u, gy = caGround(px, pz);
          box(g, px, gy - 0.4, pz, 1.3, 2.2, 1.3, b.ang, [0.6, 0.59, 0.56], [0.64, 0.63, 0.6], true); cyl(g, px, gy + 1.8, pz, 0.55, 1.1, 8, [0.09, 0.09, 0.1], [0.14, 0.14, 0.15]); }
        if (near && !shed) {
          for (let u = -b.L / 2 + 1.6; u < b.L / 2 - 1.2; u += 3.4) for (const q of [-1, 1]) {   // the windows on the long sides, the door to the road
            const door = q === sd && Math.abs(u) < 1.8, px = b.x + c * u - s * (q * (b.W / 2 + 0.02)), pz = b.z + s * u + c * (q * (b.W / 2 + 0.02));
            box(g, px, lo + (door ? 0.4 : 1.2), pz, door ? 1.0 : 0.9, door ? 2.1 : 1.0, 0.1, b.ang, win, win, true); }
        }
        if (rest) {   // the porch on the road side: its sheet roof on slim posts, a concrete floor, the plastic tables and chairs under it
          const vd = 3.2, ox = -s * sd * (b.W / 2 + vd / 2), oz = c * sd * (b.W / 2 + vd / 2), pc = [0.62, 0.6, 0.58];
          box(g, b.x + ox, lo - 0.3, b.z + oz, b.L, 0.42, vd + 0.2, b.ang, pc, [0.68, 0.66, 0.63], true);
          leanTo(g, b.x + ox, lo + 2.6, b.z + oz, b.L - 0.2, vd, 0.2, 0.3, b.ang + (sd > 0 ? PI : 0), roofC, col);
          for (const u of [-b.L / 2 + 0.3, -b.L / 6, b.L / 6, b.L / 2 - 0.3]) box(g, b.x + ox + c * u - s * sd * (vd / 2 - 0.15), lo, b.z + oz + s * u + c * sd * (vd / 2 - 0.15), 0.12, 2.6, 0.12, b.ang, [0.32, 0.3, 0.3]);
          for (let k = 0; k < 4; k++) { const u = -b.L / 2 + 1.8 + k * (b.L - 3.6) / 3, tc = tabC[(k + nBld) % tabC.length], tx = b.x + ox + c * u, tz = b.z + oz + s * u;
            box(g, tx, lo + 0.12, tz, 0.8, 0.62, 0.8, b.ang, tc, tc); nTables++;
            for (const v of [-0.75, 0.75]) box(g, tx + c * v, lo + 0.12, tz + s * v, 0.42, 0.85, 0.42, b.ang, tc, tc); }
          for (let k = 0; k < 2; k++) { const u = (k - 0.5) * 3.4, px = b.x + ox + c * u + s * sd * 0.4, pz = b.z + oz + s * u - c * sd * 0.4; crowdPut(CR, px, lo + 0.12, pz, -s * sd, c * sd, { col: fans[Math.floor(R() * fans.length)] }, 1); }
        }
        CR.block(b.x, b.z, b.L + 1, b.W + (rest ? 8 : 1), b.ang); nBld++;
      }
    }
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- START (on the crest): gantry with the start lights, the timing hut, the road closed behind it ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i];
      box(scen.get(x, z), x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 5, -1, 3.2), hy = caGround(hx, hz), gh = scen.get(hx, hz);   // the timing hut: plastered, under a sheet roof
      box(gh, hx, hy - 0.4, hz, 4.0, 3.1, 2.8, T.hd[i], [0.93, 0.91, 0.84], [0.82, 0.8, 0.74]); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.26, 0.3], null, true);
      leanTo(gh, hx, hy + 2.7, hz, 4.0, 2.8, 0.4, 0.5, T.hd[i], [0.6, 0.61, 0.62], [0.93, 0.91, 0.84]);
      exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]);
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road: concrete blocks across it
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      { const [bx, bz, bi] = onSide(sStart + 16, 1, 1.6), by = caGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        bannerQ(bx, by + 1.5, bz, -T.nx[bi], -T.nz[bi], 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); }
      signAt(sStart + 30, -1, 4);   // CURVA PELIGROSA (the sharp bend just after the line)
      signAt(sStart - 60, 1, 1);   // DURANGO (behind, for the cars coming the other way)
      signAt(sStart + 150, -1, 0);   // EL PALMITO ahead
      signAt(sStart + 420, -1, 6);   // ESPINAZO DEL DIABLO
    }

    /* ---- the checkpoints: a green gantry "CPn  altitude" ---- */
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.92, 0.92, 0.9], [0.12, 0.36, 0.24]));

    /* ---- FINISH (on the way into El Palmito): chequered gantry, El Palmito's board, the cars' park with cars and pickups, people about; the
       road closed farther on ---- */
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      const sdP = padF.sd, [sx, sz, si] = onSide(sFin + 18, sdP, 3.2), sy = caGround(sx, sz), gs = scen.get(sx, sz), tl = 0.9, W2 = 7, H2 = W2 / 8;   // El Palmito's board: on posts, leaning back
      for (const o of [-2.9, 2.9]) { const px = sx + T.nx[si] * o, pz = sz + T.nz[si] * o; box(gs, px, sy, pz, 0.26, 1.3, 0.26, T.hd[si], [0.4, 0.4, 0.42]); box(gs, px + T.tx[si] * H2 * Math.sin(tl), sy, pz + T.tz[si] * H2 * Math.sin(tl), 0.26, 1.25 + H2 * Math.cos(tl), 0.26, T.hd[si], [0.4, 0.4, 0.42]); }
      box(gs, sx + T.tx[si] * 0.35, sy - 0.3, sz + T.tz[si] * 0.35, 1.5, 0.65, W2 + 1.1, T.hd[si], [0.56, 0.5, 0.46], [0.62, 0.56, 0.5]);
      { const [v0, v1] = row(6); bannerQ(sx, sy + 1.2, sz, T.tx[si], T.tz[si], W2, H2, v0, v1, 0, 1, null, tl); }
      exclPush(sx, sz, 5);
      signAt(sFin + 120, -sdP, 2);   // MAZATLÁN ahead
      signAt(sFin + 185, -sdP, 7);   // CONCORDIA
      const hh = T.hd[padF.i], c = Math.cos(hh), sn = Math.sin(hh);
      for (let k = 0; k < 10; k++) { const a = -12 + (k % 5) * 6, b = (k < 5 ? -4.5 : 4.5) * sdP, px = padF.x - sn * b + c * a, pz = padF.z + c * b + sn * a; if (vrNear(px, pz).dd < 1.5 || k === 2 || k === 7) continue;
        park(scen.get(px, pz), px, pz, hh + PI / 2, k); nParked++; }
      for (let k = 0; k < 8; k++) { const px = padF.x + (R() - 0.5) * 20, pz = padF.z + (R() - 0.5) * 20; if (vrNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;   // the end of the road: concrete blocks across it
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[iE], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      out.marks.finish = [padF.x, padF.z];
    }

    /* ---- the viewpoint (def.views): a level terrace of tuff flags at the end of its path, a low stone wall with a metal rail round its outer
       half, a few people looking out over the canyons; the pull-outs (def.parks) with cars and pickups along the road ---- */
    {
      const st = [0.6, 0.55, 0.51], top = [0.7, 0.66, 0.62], rail = [0.36, 0.38, 0.4];
      for (const v of views) {
        const g = scen.get(v.x, v.z), y = v.h, rx = v.x - T.px[v.i], rz = v.z - T.pz[v.i], rl = Math.hypot(rx, rz) || 1, oa = Math.atan2(rz / rl, rx / rl), rr = v.r;
        box(g, v.x, y - 0.25, v.z, 2 * rr - 1, 0.32, 2 * rr - 1, oa, [0.44, 0.41, 0.38], [0.5, 0.47, 0.43], true);   // (the terrace's flags, weathered)
        for (let k = -5; k <= 5; k++) { const a = oa + k / 5 * 1.3, px = v.x + Math.cos(a) * rr, pz = v.z + Math.sin(a) * rr; if (vrNear(px, pz).dd < 1.2) continue;
          box(g, px, y - 0.4, pz, 0.5, 1.0, 1.6, a, st, top); box(g, px, y + 0.6, pz, 0.06, 0.45, 1.65, a, rail, rail, true); }
        for (let k = 0; k < 3; k++) { const a = oa + (R() - 0.5) * 1.6, d = rr - 1 - R(); const px = v.x + Math.cos(a) * d, pz = v.z + Math.sin(a) * d; if (vrNear(px, pz).dd < 1.5) continue;
          crowdPut(CR, px, y + 0.07, pz, Math.cos(a), Math.sin(a), { col: fans[Math.floor(R() * fans.length)] }, 1); }
        CR.block(v.x, v.z, 2 * rr, 2 * rr, 0);
      }
      for (const p of parks) { const hh = T.hd[p.i], c = Math.cos(hh), sn = Math.sin(hh), n = Math.min(4, Math.floor(p.r / 2));
        for (let k = 0; k < n; k++) { const a = (k - (n - 1) / 2) * 6.2, px = p.x + c * a, pz = p.z + sn * a; if (vrNear(px, pz).dd < 1.2 || nearBld(px, pz, 2.8) || R() < 0.3) continue;
          park(scen.get(px, pz), px, pz, hh + (k % 2 ? PI : 0), k + 1); nParked++; } }
    }

    /* ---- the metal guardrails where the ground falls away and round the outside of the bends (a galvanised W-beam on posts), a marker post
       every ~50 m where there is none (knockable where it fits: eProps); chevrons on the outside of both sharp bends ---- */
    let nRail = 0;
    {
      const mkPosts = [], need = [new Uint8Array(N), new Uint8Array(N)];
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0, side = sd ? 1 : -1;   // (the outside of the bend, where it is not against a cut)
        for (let k = Math.max(0, c.i0 - 8); k <= Math.min(N - 1, c.i1 + 8); k++) if (gAt(k, side, (side > 0 ? T.br[k] : T.bl[k]) + 6) < -0.6) need[sd][k] = 1; }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];
        for (const d of [4, 8, 13, 19, 26]) { const o = side * (bar + d);
          if (caGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      const iS0 = T.idx(sStart + 30), iS1 = T.idx(sFin - 30), steel = [0.7, 0.72, 0.74], steelB = [0.52, 0.53, 0.55], postC = [0.46, 0.47, 0.49];
      const nearPad = (i) => { for (const p of views.concat(parks)) if (Math.hypot(T.px[i] - p.x, T.pz[i] - p.z) < p.r + 5) return true; return false; };
      for (const side of [-1, 1]) {
        const si = side > 0 ? 1 : 0, nd = need[si], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1 || nearPad(i)) nd[i] = 0;
        for (let i = 1, last = -1; i < N; i++) { if (nd[i] === 1) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) if (!nd[k]) nd[k] = 1; last = i; } }
        for (let i = 0; i < N;) { if (nd[i] !== 1) { i++; continue; } let j = i; while (j < N && nd[j] === 1) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; }
        for (let i = 0; i < N; i++) if (nd[i]) nRail++;
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.15 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        let pAcc = 0;
        for (let i = 0; i < N - 1; i++) {
          if (nd[i] && nd[i + 1]) {   // the beam (its face to the road bright, its back darker, a narrow top), a post behind it every ~4 m
            const g = scen.get(T.px[i], T.pz[i]), a = Q(i, 0.42), b = Q(i + 1, 0.42), c = Q(i + 1, 0.78), d = Q(i, 0.78), a2 = Q(i, 0.42, 0.08), b2 = Q(i + 1, 0.42, 0.08), c2 = Q(i + 1, 0.78, 0.08), d2 = Q(i, 0.78, 0.08), inn = Q(i, 0.6, 0.04);
            g.quadO(a, b, c, d, steel, inn); g.quadO(a2, b2, c2, d2, steelB, inn); g.quadO(d, c, c2, d2, steel, inn);
            pAcc += T.ds; if (pAcc >= 4) { pAcc = 0; const p = Q(i, 0, 0.22); box(g, p[0], T.hy[i] - 0.5, p[2], 0.12, 1.25, 0.12, T.hd[i], postC, null, true); }
          } else if (!nd[i] && i % 25 === 0 && i > 2 && i < iE - 2) mkPosts.push([i, side]);
        }
      }
      const kp = eProps(out, mkPosts, (i, side) => vp[side > 0 ? 1 : 0][i]).spots;
      for (const sp of mkPosts) { if (kp.has(sp)) continue;
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]);
        box(g, p[0], p[1] - 0.2, p[2], 0.13, 1.2, 0.13, T.hd[i], [0.94, 0.94, 0.92], null, true); box(g, p[0], p[1] + 0.72, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.1, 0.1, 0.11], null, true);
      }
      (def.curves || []).forEach(([d, , turn]) => {   // three chevrons on the outside of each sharp bend, facing the cars coming up
        const c = T.corners.find(q => sStart + d >= q.i0 * T.ds - 6 && sStart + d <= q.i1 * T.ds + 6); if (!c || c.sev < 2) return;
        const out_ = -turn, cell = turn > 0 ? 30 : 31, u0 = (cell % 8) / 8, v1 = 1 - Math.floor(cell / 8) / 8;
        for (const o of [-10, 0, 10]) { const [cx, cz, ci] = onSide(sStart + d + o, out_, 0.9); if (excluded(cx, cz)) continue;
          const cy = caGround(cx, cz), g = scen.get(cx, cz), fx = T.px[ci] - cx, fz = T.pz[ci] - cz, fl = Math.hypot(fx, fz) || 1, tx = -T.tx[ci] * 0.75 + fx / fl * 0.25, tz = -T.tz[ci] * 0.75 + fz / fl * 0.25, tl = Math.hypot(tx, tz);
          box(g, cx, cy - 0.2, cz, 0.08, 1.5, 0.08, T.hd[ci], [0.6, 0.61, 0.63]);
          bannerQ(cx, Math.max(cy, T.hy[ci]) + 0.75, cz, tx / tl, tz / tl, 0.7, 0.7, v1 - 1 / 8, v1, u0, u0 + 1 / 8, ban2); CR.avoid(cx, cz, 0.6); }
      });
      { const nm = (n) => T.names.find(q => q.n.startsWith(n)), hp = nm('Lasnica');
        if (hp) { signAt(sStart + hp.d - 170, -1, 4); signAt(sStart + hp.d - 95, -1, 5); }   // CURVA PELIGROSA, DESPACIO before the hairpin
        if (views.length) { const s = views[0].i * T.ds; signAt(s - 70, -1, 3); } }   // MIRADOR
    }

    /* ---- the power line's wooden poles (def.power: a pole every ~45 m, its cross-arm; the wires too thin to see from the road) ---- */
    let nPoles = 0;
    for (const L of def.power || []) for (let k = 0; k + 3 < L.length; k += 2) {
      const ax = L[k], az = L[k + 1], bx = L[k + 2], bz = L[k + 3], n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 45)), ang = Math.atan2(bz - az, bx - ax), wood = [0.36, 0.28, 0.2];
      for (let q = 0; q <= n; q++) { if (q === n && k + 4 < L.length) continue; const x = ax + (bx - ax) * q / n, z = az + (bz - az) * q / n;
        if (vrDist(x, z) > LOD.cap(240) || vrNear(x, z).dd < 2 || excluded(x, z)) continue;
        const y = caGround(x, z), g = scen.get(x, z); box(g, x, y - 0.5, z, 0.26, 9.5, 0.26, ang, wood); box(g, x, y + 8.3, z, 0.14, 0.14, 2.3, ang, wood); exclPush(x, z, 1.5); nPoles++; }
    }

    /* ---- spectators, few (fewFans): the start and the finish, the checkpoints, the inside of the hairpin ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.6, gap: 1.1, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.3, flag: 0.1, keepBar: 1.6 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 50, sStart + 40, sd, { rows: 2, dens: 0.45, label: 'E start' }); run(sFin - 50, sFin + 14, sd, { rows: 2, dens: 0.45, label: 'E finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 16, s0 + 14, side, { rows: 1, dens: 0.4, label: 'E cp' }); });
      const hp = (def.curves || []).reduce((a, q) => (!a || q[0] > a[0] ? q : a), null);   // (the hairpin: the last of the sharp bends)
      if (hp) { const sm = sStart + hp[0]; run(sm - 14, sm + 14, hp[2], { rows: 1, dens: 0.4, label: 'E hairpin' }); }
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the plants (instanced per 96 m chunk): the pine-oak forest (tall pines, oaks, young pines, shrubs under them by the road), the low
       open woodland (oaks, young pines, shrubs, bunch grass), the open slopes (bunch grass, shrubs, agaves, a few oaks and pines), the scrub,
       agaves and grass on the bare rock; thinner farther out ---- */
    const tMatT = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const tk = [0, 1, 2, 3, 4, 5].map(k => new IChunks(eTreeGeo(k), tMatT, 96));
    let nTrees = 0, nShrubs = 0, nAgave = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(50000 * dens), RT = rng(6141), SP = 4.4 / Math.sqrt(dens);   // (the cap only a safety: ~44,000 at full detail)
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > LOD.radius(250)) continue;
          const c = vrLC(x, z), far = sstep(40, 180, hd);
          const p = c === 1 ? 0.78 - 0.56 * far : c === 6 ? 0.5 - 0.36 * far : c === 2 ? 0.52 - 0.38 * far : c === 0 ? 0.32 - 0.26 * far : c === 3 ? 0.26 - 0.18 * far : c === 4 ? 0.14 - 0.08 * far : c === 7 ? 0.07 - 0.04 * far : 0.01;
          if (r1 > p) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 2.4) continue; if (nn.i >= 0 && nn.dd < 6 && r2 < 0.3) continue;
          if (excluded(x, z)) continue;
          const sl = caSlope(x, z); if (sl > 1.8 || (sl > 1.0 && r2 < (sl - 1.0) / 0.8)) continue;
          let sp, hgt, wid, col;
          if (c === 1) sp = r3 < 0.55 ? 0 : r3 < 0.8 ? 1 : r3 < 0.9 ? 3 : (hd < 40 ? 4 : 0);
          else if (c === 6) sp = r3 < 0.42 ? 1 : r3 < 0.56 ? 3 : r3 < 0.72 ? 4 : r3 < 0.84 ? (hd < 90 ? 5 : 4) : sl > 0.45 ? 2 : 0;
          else if (c === 0) sp = hd > 120 ? (r3 < 0.6 ? 1 : 4) : r3 < 0.52 ? 5 : r3 < 0.68 ? 4 : r3 < 0.8 ? 2 : r3 < 0.92 ? 1 : 0;
          else if (c === 2) sp = r3 < 0.55 ? 4 : r3 < 0.75 ? 5 : r3 < 0.88 ? 2 : 1;
          else if (c === 3) sp = r3 < 0.35 ? 1 : r3 < 0.55 ? 3 : r3 < 0.8 ? 4 : 2;
          else if (c === 4) sp = r3 < 0.5 ? 2 : r3 < 0.8 ? 5 : 3;
          else sp = r3 < 0.6 ? 5 : 4;
          if (sp === 5 && hd > 90) continue;   // (the tufts only where the camera sees them)
          if (sp === 0) { hgt = 12 + r4 * 10; wid = hgt * (0.42 + r2 * 0.12); col = [0.92 + r2 * 0.12, 0.96 + r3 * 0.08, 0.94]; }
          else if (sp === 1) { hgt = 7 + r4 * 6; wid = hgt * (0.9 + r2 * 0.25); col = [0.94 + r2 * 0.12, 0.97 + r3 * 0.06, 0.92]; }
          else if (sp === 2) { hgt = 0.9 + r4 * 0.6; wid = 1.4 + r2 * 0.8; col = [0.94 + r3 * 0.1, 1, 0.96]; nAgave++; }
          else if (sp === 3) { hgt = 3 + r4 * 4; wid = hgt * (0.5 + r2 * 0.12); col = [0.95 + r2 * 0.1, 1, 0.95]; }
          else if (sp === 4) { hgt = 1.0 + r4 * 1.4; wid = hgt * (1.1 + r2 * 0.4); col = [0.92 + r3 * 0.16, 1, 0.92]; nShrubs++; }
          else { hgt = 0.6 + r4 * 0.6; wid = 0.7 + r2 * 0.6; col = [0.92 + r3 * 0.16, 0.95 + r4 * 0.1, 0.9]; nShrubs++; }
          tk[sp].add(x, caGround(x, z) - 0.12, z, r1 * 70, wid, hgt, col);
          if (++nTrees >= maxT) break grid;
        }
      }
    }
    tk.forEach((t, k) => t.addTo(root, LOD.tier > 0 || k < 4 && k !== 2));   // (NIZKA: the agaves, the shrubs and the tufts cast no shadow)

    /* ---- the stones: pinkish-grey tuff, blocks at the foot of the cuts, crags where the slope is steep and along OpenStreetMap's cliffs ---- */
    let nCrag = 0;
    {
      const RW = rng(6151), tuff = [[0.6, 0.54, 0.5], [0.55, 0.5, 0.47], [0.5, 0.47, 0.45], [0.64, 0.58, 0.52]];
      const rockC = () => tuff[Math.floor(RW() * tuff.length)];
      API.ROCK_SMOOTH = false;
      for (let s = 10; s < T.len - 10; s += 7) for (const side of [-1, 1]) {   // blocks at the foot of the cuts
        if (RW() > 0.3) continue;
        const o = 1.6 + Math.pow(RW(), 1.5) * 30, [x, z] = onSide(s, side, o), sz = 0.5 + RW() * 1.2; if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z) || vrDist(x, z) > LOD.cap(90)) continue;
        const y = caGround(x, z), sl = caSlope(x, z); if (sl < 0.4) continue;
        rock(scen.get(x, z), x, y + sz * 0.3, z, sz * 1.2, sz, sz, RW() * TAU, vary(rockC(), RW, 0.08), RW, 0.3);
      }
      const crag = (x, z, n, rMin, rSpan) => { const g = scen.get(x, z), b0 = vary(rockC(), RW, 0.06);
        for (let q = 0; q < n; q++) { const r0 = rMin + RW() * rSpan, qx = x + (RW() - 0.5) * 9, qz = z + (RW() - 0.5) * 9, qy = caGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 1 || excluded(qx, qz)) continue;
          rock(g, qx, qy + r0 * 0.35, qz, r0, r0 * (0.8 + RW() * 0.7), r0 * (0.7 + RW() * 0.4), RW() * TAU, vary(b0, RW, 0.07), RW, 0.35); nCrag++; } };
      for (let s = 16; s < T.len - 16; s += 14) for (const side of [-1, 1]) {   // crags where the slope is steep
        if (RW() < 0.4) continue;
        const [x, z] = onSide(s, side, 8 + RW() * 110); if (excluded(x, z) || vrNear(x, z).dd < 6 || vrDist(x, z) > LOD.cap(110)) continue;
        if (caSlope(x, z) < 0.85) continue; crag(x, z, 2 + Math.floor(RW() * 2), 1.8, 3.5);
      }
      for (const L of def.cliffs || []) for (let k = 0; k + 3 < L.length; k += 2) {   // along the cliffs: bigger outcrops of tuff
        const ax = L[k], az = L[k + 1], bx = L[k + 2], bz = L[k + 3], l = Math.hypot(bx - ax, bz - az);
        for (let t = RW() * 6; t < l; t += 13) { const x = ax + (bx - ax) * t / l, z = az + (bz - az) * t / l; if (RW() < 0.3 || vrDist(x, z) > LOD.cap(170) || vrNear(x, z).dd < 7) continue; crag(x, z, 2, 2.4, 3.2); }
      }
    }

    /* ---- the view beyond the corridor (def.farDem: the ridges and the canyons round the crest; irFar, World.update moves it with the camera); finish the meshes ---- */
    const FAR = API.irFar ? API.irFar(eFarCol) : null; if (FAR) { FAR.mesh.visible = false; root.add(FAR.mesh); out.dyn.irFar = FAR; }   // (hidden until the first World.update)
    if (FAR) {   // (its hole round the corridor out to the tiles' coarse ring above, ~720 m: no far land under the tiles in the menu's model, where both
      // lie at their own places; in the game the far land lies behind everything and is all haze within ~800 m of the road, so nothing changes there)
      const F = def.farDem, nx = F.nx, nz = F.nz, dr = new Float32Array(nx * nz), I = [];
      for (let k = 0; k < nx * nz; k++) { const x = FAR.P0[3 * k], z = FAR.P0[3 * k + 2]; let m = 1e18; for (let q = 0; q < N; q += 5) { const dx = x - T.px[q], dz = z - T.pz[q], d = dx * dx + dz * dz; if (d < m) m = d; } dr[k] = Math.sqrt(m); }
      for (let j = 0; j + 1 < nz; j++) for (let i = 0; i + 1 < nx; i++) { const a = j * nx + i, b2 = a + 1, c = a + nx, d = c + 1; if (Math.min(dr[a], dr[b2], dr[c], dr[d]) < 720) continue; I.push(a, c, b2, b2, c, d); }
      FAR.mesh.geometry.setIndex(I);
    }
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: eAtlas(cpAlt, fmtAlt(T.altAt(T.hy[T.finishIdx]))), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: eAtlas2(), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    crowdFinish(CR, root, out);
    out.stats = { trees: nTrees, shrubs: nShrubs, agaves: nAgave, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, tables: nTables, rails: +(nRail / (2 * N)).toFixed(3), walls: nWall,
      poles: nPoles, crags: nCrag, views: views.length, parks: parks.length, parked: nParked, far: !!FAR };   // (read by the tests)
    return out;
  }

  World.keep('VR', 'espinazo');   // (its grids kept between its builds; World.build frees the others': tools/razdeli-proge.mjs)
  World.ext.espinazo = (scene, tex, opts) => buildEspinazo(scene, tex, opts);
})();
