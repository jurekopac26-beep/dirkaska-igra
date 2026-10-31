/* =========================================================================
   WORLD — Mount Hotham (theme 'hotham'): its own builder (World.ext.hotham), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, TAU, VRC, VRT, atSf, box, caCar, clamp, crowdCtx, crowdFinish, crowdPut, crowdRun, cyl, gable, ico, lerp, ouCutMat,
    ouRod, pkGroundMat, propFloorTable, puff, rng, roadsideProps, rock, rpHash, sstep, stubExcl, stubGeo, stubProps, stubRails, stubVerge,
    tuftWindMat, vary, vrDist, vrFar, vrGH, vrGritTex, vrGround, vrLC, vrLCf, vrNear, vrPrep, vrSlope, vrStubAt, vrStubs, vrWater
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ================= MOUNT HOTHAM (theme 'hotham') =================
     The top of the Great Alpine Road over the Victorian Alps (Australia): from below Mount Little Blowhard (~1495 m) along the ridge past Renes
     Lookout, Mount Blowhard, Danny's Lookout, Little Mount Baldy and the Razorback to the road's highest point under Mount Hotham (~1831 m) and
     down under the ski bridge into the village of Hotham Heights (~1753 m), on a clear afternoon of the southern summer (the sun from the north).
     Built on Vršič's corridor (vrPrep, vrStubs and the terrain helpers read the same forms: def.dem, def.lc, def.bld, def.lakes, def.sideRoads),
     with a look of its own: the snow gum woodland (twisted many-stemmed trees with pale, streaked bark and grey-green crowns, the silver stags the
     bushfires left with their green regrowth at the foot), alpine ash a little lower down, the treeless tops in tussock grass, heath and snow
     daisies, grey rock in tors and boulders; the road with the white lines of Australia (a broken centre line, the double unbroken one through the
     bends), the orange snow poles along both edges, the yellow curve signs with their advisory speeds, green guide boards, guardrails where the
     ground falls away, stone retaining walls under the road; Renes and Danny's lookouts with their car parks, the pull-outs by the road, the
     snowmaking reservoir, the lifts of the resort, the ski bridge over the road and the lodges of Hotham Heights; beyond the corridor the real
     ranges (Mount Feathertop and the valleys: irFar). Only geographic names; the signs and boards are generic. No helicopter, no birds. */
  let HOS = 'summer';   // the season the world is painted in ('summer' or 'autumn': the tussocks golden; winter: the autumn look, the render's season code snows it over)
  const HOCOL = [0, 0, 0];
  function hoCol(x, z, h, ny, dd) {   // ground colour (times the grey grit map): the tussock grass of the tops (silver-green in summer, straw in autumn) with greener
    // herbfield in the hollows, the grassy floor of the snow gum woodland with its grey litter of bark and leaves, the dark olive heath, gravel in the
    // village, grey rock on the tors and every steep face, a gravel verge by the road
    const P = API.VR, m = P.n3(x, z), q = P.n4(x, z), A = h + P.D.base, su = HOS === 'summer';
    const fo = vrLCf(x, z, 1), he = vrLCf(x, z, 2), bu = vrLCf(x, z, 3), rk = vrLCf(x, z, 4);
    let r, g, b;
    if (su) { r = 0.5 + (m - 0.5) * 0.1 + (q - 0.5) * 0.08; g = 0.54 + (m - 0.5) * 0.08 + (q - 0.5) * 0.06; b = 0.33 + (m - 0.5) * 0.05; }   // tussock grass: silver-green
    else { r = 0.66 + (m - 0.5) * 0.12 + (q - 0.5) * 0.1; g = 0.58 + (m - 0.5) * 0.08 + (q - 0.5) * 0.07; b = 0.36 + (m - 0.5) * 0.05; }   // autumn: straw and gold
    const hb = sstep(0.42, 0.74, P.n2(x, z)) * (su ? 0.75 : 0.45); r = lerp(r, su ? 0.36 : 0.5, hb); g = lerp(g, su ? 0.5 : 0.5, hb); b = lerp(b, su ? 0.22 : 0.28, hb);   // herbfield and moist hollows: greener
    const lt = sstep(0.5, 0.8, P.n7(x * 1.4 + 60, z * 1.4)) * 0.6;   // under the snow gums: grass with grey bark and leaf litter
    r = lerp(r, lerp(0.44, 0.5, lt) + m * 0.05, fo * 0.85); g = lerp(g, lerp(0.47, 0.45, lt) + m * 0.04, fo * 0.85); b = lerp(b, lerp(0.29, 0.36, lt), fo * 0.85);
    r = lerp(r, 0.3 + m * 0.05, he * 0.8); g = lerp(g, 0.36 + m * 0.05, he * 0.8); b = lerp(b, 0.22, he * 0.8);   // the heath: dark olive shrubs
    r = lerp(r, 0.6, bu * 0.55); g = lerp(g, 0.58, bu * 0.55); b = lerp(b, 0.53, bu * 0.55);   // the village: gravel yards
    const st = Math.max(rk * 0.9, sstep(0.82, 0.6, ny) * 0.9);   // rock: the tors and every steep face, grey with lichen
    if (st > 0) { const li = sstep(0.55, 0.8, P.n2(x * 1.9, z * 1.9)) * 0.4; r = lerp(r, lerp(0.6, 0.56, li) + m * 0.05, st); g = lerp(g, lerp(0.59, 0.55, li) + m * 0.05, st); b = lerp(b, lerp(0.56, 0.44, li) + m * 0.04, st); }
    if (A > 1790 && su) { const t = sstep(1790, 1830, A) * 0.25; r = lerp(r, 0.56, t); g = lerp(g, 0.56, t); b = lerp(b, 0.38, t); }   // (the windswept top: thinner, paler grass)
    if (dd < 4) { const t = sstep(4, 0.5, dd) * 0.5; r = lerp(r, 0.62, t); g = lerp(g, 0.59, t); b = lerp(b, 0.53, t); }   // the gravel verge
    HOCOL[0] = r; HOCOL[1] = g; HOCOL[2] = b; return HOCOL;
  }
  function hoGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (bilinear over the grid vertices, each coloured as in hoTileGeo)
    const G = API.VR.G, gx = clamp((x - G.x0) / VRC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / VRC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = vrGH(ii, jj);
      const nx = (vrGH(ii + 1, jj) - vrGH(ii - 1, jj)) / (2 * VRC), nz = (vrGH(ii, jj + 1) - vrGH(ii, jj - 1)) / (2 * VRC), c = hoCol(G.x0 + ii * VRC, G.z0 + jj * VRC, h, 1 / Math.hypot(nx, 1, nz), G.dd[jj * G.nx + ii]);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function hoTileOn(ti, tj) {   // 0: none, 1: full tile (5 m cells), 2: coarse outer ring (10 m cells, in the haze); a little wider round the two lookouts
    const G = API.VR.G, L = VRC * VRT, x = G.x0 + (ti + 0.5) * L, z = G.z0 + (tj + 0.5) * L, d = vrDist(x, z);
    let dv = 1e9; for (const v of API.VR.vistas) dv = Math.min(dv, Math.hypot(x - v[0], z - v[1]));
    return d < 290 || dv < 180 ? 1 : d < 430 || dv < 420 ? 2 : 0;
  }
  function hoTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex), as vrTileGeo, coloured by hoCol
    const G = API.VR.G, m = VRT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * VRT, j0 = tj * VRT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * VRC, z = G.z0 + j * VRC, h = vrGH(i, j);
      let nx = -(vrGH(i + st, j) - vrGH(i - st, j)) / (2 * VRC * st), nz = -(vrGH(i, j + st) - vrGH(i, j - st)) / (2 * VRC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = hoCol(x, z, h, ny, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)]); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      uv[k * 2] = x / 10; uv[k * 2 + 1] = -z / 10; stp[k] = sstep(0.78, 0.5, ny);
    }
    if (st === 1) {   // (no cracks against a coarse neighbour: as vrTileGeo)
      const nb = (a, b) => (a >= 0 && b >= 0 && a < G.ntx && b < G.ntz ? hoTileOn(a, b) : 0);
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
  // the view beyond the corridor (irFar): the snow gum woodland grey-green on the slopes, the taller forest of the valleys darker, the treeless tops
  // in tussock (silver-green, straw in autumn), the steep faces grey
  function hoFarCol(A, sl, q) {
    const su = HOS === 'summer';
    let c = [0.24 + q * 0.04, 0.3 + q * 0.04, 0.2];                                             // the snow gum woodland
    const lo = sstep(1300, 900, A); c = [lerp(c[0], 0.14, lo), lerp(c[1], 0.22, lo), lerp(c[2], 0.13, lo)];   // the ash and peppermint forest of the valleys
    const top = sstep(1720, 1840, A) * 0.85, tg = su ? [0.5, 0.52, 0.34] : [0.62, 0.55, 0.36]; c = [lerp(c[0], tg[0], top), lerp(c[1], tg[1], top), lerp(c[2], tg[2], top)];
    const rk = sstep(0.75, 1.15, sl) * 0.6; return [lerp(c[0], 0.46, rk), lerp(c[1], 0.45, rk), lerp(c[2], 0.42, rk)];
  }
  let hoATex = null, hoAKey = '', hoA2Tex = null, hoA3Tex = null, hoA3Key = '';   // (the board atlases, made once and reused by every build of the road)
  function hoAtlas(cps, topA, finA) {   // text boards (8 rows of 1024 x 128): START, FINISH, CP1-CP4 with the altitude, the summit's board, the race's banner
    const key = cps.join('|') + '|' + topA + '|' + finA; if (hoATex && hoAKey === key) return hoATex;
    if (hoATex) hoATex.dispose(); hoAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 100, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(292, 142, 440, 100); txt('FINISH', 512, 196, 92, '#111', 420);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#1d5e46'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffd23a', 520); });
    x.fillStyle = '#5a3a22'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#f1e6cc'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);   // the village's board at the finish (timber brown)
    txt('HOTHAM HEIGHTS', 512, 812, 60, '#f3ead6', 900); txt(finA, 512, 862, 46, '#f3ead6', 900);
    x.fillStyle = '#f2f2ee'; x.fillRect(0, 896, 1024, 64); x.fillStyle = '#1d5e46'; x.fillRect(0, 960, 1024, 64);   // the race's banner
    txt('GREAT ALPINE ROAD', 512, 930, 54, '#16181c', 960); txt('MOUNT HOTHAM · ' + topA, 512, 994, 44, '#fff', 900);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (hoATex = t);
  }
  const HO_BOARDS = [['KEEP LEFT UNLESS OVERTAKING', '#f2f2ee'], ['HOTHAM HEIGHTS  8', '#1d5e46'], ['RENES LOOKOUT', '#6b3e1e'], ["DANNY'S LOOKOUT", '#6b3e1e'], ['CARRY SNOW CHAINS', '#f2f2ee'], ['ICE ON ROAD', '#f1c21b'], ['ALPINE NATIONAL PARK', '#6b3e1e'], ['DINNER PLAIN  →', '#1d5e46']];
  function hoAtlas2() {   // the small signs: row 0 the curve warnings (a yellow diamond with the bent arrow, both ways) and the advisory speeds (35, 45, 55, 65 km/h),
    // the chevrons both ways; row 1 the kilometre plates (1-8: green, white digits); rows 4-7 the road's boards (two a row, 512 x 128)
    if (hoA2Tex) return hoA2Tex;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 470); };
    for (const [k, dir] of [[0, -1], [1, 1]]) {   // the diamond with a curve arrow: up and bending the way the road goes
      const x0 = k * 128; x.fillStyle = '#16181c'; x.beginPath(); x.moveTo(x0 + 64, 2); x.lineTo(x0 + 126, 64); x.lineTo(x0 + 64, 126); x.lineTo(x0 + 2, 64); x.fill();
      x.fillStyle = '#f1c21b'; x.beginPath(); x.moveTo(x0 + 64, 8); x.lineTo(x0 + 120, 64); x.lineTo(x0 + 64, 120); x.lineTo(x0 + 8, 64); x.fill();
      x.strokeStyle = '#16181c'; x.lineWidth = 10; x.lineCap = 'butt'; x.beginPath(); x.moveTo(x0 + 64 - 6 * dir, 100); x.lineTo(x0 + 64 - 6 * dir, 66); x.quadraticCurveTo(x0 + 64 - 6 * dir, 46, x0 + 64 + 16 * dir, 40); x.stroke();
      x.fillStyle = '#16181c'; x.beginPath(); x.moveTo(x0 + 64 + 30 * dir, 37); x.lineTo(x0 + 64 + 12 * dir, 24); x.lineTo(x0 + 64 + 12 * dir, 54); x.fill(); }
    [35, 45, 55, 65].forEach((v, k) => { const x0 = (2 + k) * 128; x.fillStyle = '#16181c'; x.fillRect(x0, 0, 128, 128); x.fillStyle = '#f1c21b'; x.fillRect(x0 + 6, 6, 116, 116); txt(String(v), x0 + 64, 52, 62, '#16181c', 110); txt('km/h', x0 + 64, 100, 30, '#16181c', 110); });
    for (const [k, dir] of [[6, 1], [7, -1]]) {   // the chevrons: black arrows on yellow, pointing the way the road turns
      const x0 = k * 128; x.fillStyle = '#f1c21b'; x.fillRect(x0, 0, 128, 128); x.fillStyle = '#16181c';
      for (const o of [-26, 14]) { x.beginPath(); const cx = x0 + 64 + o * dir; x.moveTo(cx - 14 * dir, 22); x.lineTo(cx + 18 * dir, 64); x.lineTo(cx - 14 * dir, 106); x.lineTo(cx - 34 * dir, 106); x.lineTo(cx - 2 * dir, 64); x.lineTo(cx - 34 * dir, 22); x.closePath(); x.fill(); } }
    for (let k = 0; k < 8; k++) { const x0 = k * 128, y0 = 128; x.fillStyle = '#f2f2ee'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#1d5e46'; x.fillRect(x0 + 10, y0 + 10, 108, 108); txt(String(k + 1), x0 + 64, y0 + 68, 80, '#f2f2ee', 100); }
    HO_BOARDS.forEach(([n, bg], k) => { const x0 = (k % 2) * 512, y0 = 512 + Math.floor(k / 2) * 128, warn = bg === '#f1c21b', reg = bg === '#f2f2ee';
      x.fillStyle = reg ? '#16181c' : bg; x.fillRect(x0, y0, 512, 128); x.fillStyle = bg; x.fillRect(x0 + 6, y0 + 6, 500, 116);
      if (!reg) { x.strokeStyle = warn ? '#16181c' : '#f2f2ee'; x.lineWidth = 6; x.strokeRect(x0 + 12, y0 + 12, 488, 104); }
      txt(n, x0 + 256, y0 + 66, n.length > 20 ? 40 : 54, warn || reg ? '#16181c' : '#f2f2ee', 470); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (hoA2Tex = t);
  }
  function hoAtlas3(names) {   // the side roads' boards (vrAtlas3's layout): row 0 the closure board (ROAD CLOSED), the no-entry roundel and red and white stripes;
    // row 1 the gate's plate (NO ENTRY) and the first street name; then two street names a row (white on green)
    if (hoA3Tex && hoA3Key === names.join('|')) return hoA3Tex;
    if (hoA3Tex) hoA3Tex.dispose(); hoA3Key = names.join('|');
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w, wt) => { x.fillStyle = col; x.font = (wt || 900) + ' ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 470); };
    x.fillStyle = '#f4f3ee'; x.fillRect(0, 0, 512, 128); x.strokeStyle = '#c81e14'; x.lineWidth = 12; x.strokeRect(8, 8, 496, 112); txt('ROAD CLOSED', 256, 68, 62, '#141414', 450);
    x.fillStyle = '#c81e14'; x.beginPath(); x.arc(576, 64, 60, 0, TAU); x.fill(); x.fillStyle = '#f4f3ee'; x.fillRect(536, 54, 80, 20);   // (no entry: a red disc with a white bar)
    x.save(); x.beginPath(); x.rect(640, 0, 384, 128); x.clip(); x.fillStyle = '#f4f3ee'; x.fillRect(640, 0, 384, 128); x.fillStyle = '#d0201a';
    for (let q = -2; q < 14; q++) { x.beginPath(); x.moveTo(640 + q * 64, 128); x.lineTo(640 + q * 64 + 64, 0); x.lineTo(640 + q * 64 + 96, 0); x.lineTo(640 + q * 64 + 32, 128); x.fill(); } x.restore();
    x.fillStyle = '#c81e14'; x.fillRect(0, 128, 512, 128); x.strokeStyle = '#f4f3ee'; x.lineWidth = 8; x.strokeRect(10, 138, 492, 108); txt('NO ENTRY', 256, 194, 68, '#f4f3ee', 450);
    names.forEach((n, k) => { const cell = k + 3, x0 = (cell % 2) * 512, y0 = Math.floor(cell / 2) * 128;
      x.fillStyle = '#1d5e46'; x.fillRect(x0, y0, 512, 128); x.strokeStyle = '#f4f3ee'; x.lineWidth = 7; x.strokeRect(x0 + 9, y0 + 9, 494, 110); txt(n.toUpperCase(), x0 + 256, y0 + 66, n.length > 18 ? 44 : 54, '#f4f3ee', 470, 800); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (hoA3Tex = t);
  }
  function hoTreeGeo(kind) {   // unit trees (height 1; the instances scale and tint them): 0 snow gum (three leaning, crooked stems, pale bark streaked with olive,
    // an open crown of grey-green clumps), 1 a snow gum of the windswept top (low, wide, crooked), 2 the silver stag of a snow gum the fires killed (bare,
    // forked stems) with its green regrowth round the foot, 3 alpine ash (a tall straight trunk, rough grey stocking below, smooth above, the crown in its top third)
    const g = new GB(), R = rng(1940 + kind), rs = API.ROCK_SMOOTH, bark = [0.88, 0.86, 0.78], streak = [0.74, 0.62, 0.44], leaf = [0.42, 0.5, 0.36];
    const stem = (a, b, r, col) => ouRod(g, a, b, r, col, 3);
    if (kind === 0 || kind === 1) {
      const low = kind === 1;
      for (let k = 0; k < 3; k++) {
        const a = k / 3 * TAU + R() * 0.8, lean = low ? 0.36 + R() * 0.16 : 0.13 + R() * 0.12, h1 = low ? 0.36 : 0.46 + R() * 0.1, h2 = low ? 0.6 : 0.8;
        const p1 = [Math.cos(a) * lean * 0.5 + (R() - 0.5) * 0.08, h1, Math.sin(a) * lean * 0.5 + (R() - 0.5) * 0.08], p2 = [Math.cos(a + 0.6) * lean, h2, Math.sin(a + 0.6) * lean];
        stem([Math.cos(a) * 0.03, 0, Math.sin(a) * 0.03], p1, low ? 0.05 : 0.04, k % 2 ? streak : bark); stem(p1, p2, low ? 0.035 : 0.028, bark);
        API.ROCK_SMOOTH = true; puff(g, p2[0], p2[1] + 0.04, p2[2], low ? 0.3 : 0.29, 0.55, vary(leaf, R, 0.15), R, 0.35, 0.62, 1.1); API.ROCK_SMOOTH = rs;
      }
      if (low) { API.ROCK_SMOOTH = true; puff(g, 0, 0.7, 0, 0.3, 0.45, vary(leaf, R, 0.1), R, 0.35, 0.62, 1.1); API.ROCK_SMOOTH = rs; }
    } else if (kind === 2) {
      const s = [0.8, 0.8, 0.78];
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + R() * 0.7, p1 = [Math.cos(a) * 0.08, 0.5, Math.sin(a) * 0.08];
        stem([0, 0, 0], p1, 0.035, s); stem(p1, [Math.cos(a + 0.4) * 0.2, 0.95, Math.sin(a + 0.4) * 0.2], 0.02, s); stem(p1, [Math.cos(a - 0.8) * 0.24, 0.72, Math.sin(a - 0.8) * 0.24], 0.014, s); }
      API.ROCK_SMOOTH = true; for (let k = 0; k < 2; k++) { const a = k * Math.PI + R(); puff(g, Math.cos(a) * 0.1, 0.09, Math.sin(a) * 0.1, 0.16, 0.7, vary([0.32, 0.44, 0.26], R, 0.2), R, 0.35, 0.65, 1.1); } API.ROCK_SMOOTH = rs;
    } else {
      cyl(g, 0, -0.02, 0, 0.022, 0.42, 4, [0.42, 0.4, 0.36], null, 0.018); cyl(g, 0, 0.4, 0, 0.018, 0.4, 4, [0.84, 0.82, 0.74], null, 0.01);
      API.ROCK_SMOOTH = true; const c = [0.3, 0.4, 0.27];
      puff(g, 0, 0.84, 0, 0.17, 0.85, c, R, 0.35, 0.62, 1.08); puff(g, 0.08, 0.7, 0.03, 0.14, 0.7, vary(c, R, 0.12), R, 0.35, 0.6, 1.06);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function hoPlantGeo(kind) {   // unit plants (height 1; the instances scale and tint them): 0 a tussock of snow grass (Poa: fine blades, silver-green with straw tips),
    // 1 a cushion of alpine flowers (white: the instances tint it: snow daisies white, billy buttons yellow, trigger plants pink), 2 a grey boulder,
    // 3 a few stones, 4 an alpine heath shrub (a low dark mound)
    const g = new GB(), R = rng(1960 + kind), rs = API.ROCK_SMOOTH;
    if (kind === 0) { const base = [0.42, 0.48, 0.3], tip = [0.74, 0.72, 0.52];
      for (let k = 0; k < 11; k++) { const a = k / 11 * TAU + R() * 0.6, lean = 0.2 + R() * 0.22, hh = 0.7 + R() * 0.3, bx = Math.cos(a) * 0.06, bz = Math.sin(a) * 0.06, tx = Math.cos(a) * lean, tz = Math.sin(a) * lean, ox = -Math.sin(a) * 0.05, oz = Math.cos(a) * 0.05;
        g.triO([bx - ox, 0, bz - oz], [bx + ox, 0, bz + oz], [tx, hh, tz], base, [tx * 0.5, hh * 0.2, tz * 0.5], base, tip); g.triO([bx - ox, 0, bz - oz], [tx, hh, tz], [bx + ox, 0, bz + oz], base, [-tx, hh * 0.4, -tz], tip, base); }
    } else if (kind === 1) { API.ROCK_SMOOTH = true; ico(g, 0, 0.16, 0, 0.5, 0.4, [0.32, 0.42, 0.22], R, 0.2);
      for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + R() * 0.8, d = 0.15 + R() * 0.25, y = 0.2 + (0.45 - d) * 0.45; ico(g, Math.cos(a) * d, y, Math.sin(a) * d, 0.1, 0.6, [0.98, 0.98, 0.98], R, 0.1); }
    } else if (kind === 2) { API.ROCK_SMOOTH = false; rock(g, 0, 0.3, 0, 0.6, 0.55, 0.5, 0, [0.6, 0.6, 0.58], R, 0.28); }
    else if (kind === 3) { for (let k = 0; k < 2; k++) { API.ROCK_SMOOTH = false; const a = R() * TAU, d = k ? 0.25 + R() * 0.25 : 0, r = k ? 0.1 + R() * 0.08 : 0.17; rock(g, Math.cos(a) * d, r * 0.2, Math.sin(a) * d, r, r * 0.7, r * 0.9, R() * TAU, [0.6, 0.59, 0.57], R, 0.3); } }
    else { API.ROCK_SMOOTH = true; const c = [0.24, 0.32, 0.19]; puff(g, 0, 0.3, 0, 0.44, 0.65, c, R, 0.3, 0.65, 1.08); puff(g, 0.24, 0.22, 0.1, 0.3, 0.6, vary(c, R, 0.18), R, 0.3, 0.65, 1.08); }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // a unit geometry (non-indexed: hoTreeGeo's) copied into the merged scenery, placed as an instance would be (rot about y, sxz across, sy up, col: its tint):
  // the sparse kinds go there instead of meshes of their own (no draw calls of their own)
  function hoPut(g, geo, x, y, z, rot, sxz, sy, col) {
    const P = geo.attributes.position.array, Nn = geo.attributes.normal.array, C = geo.attributes.color.array, c = Math.cos(rot), s = Math.sin(rot);
    for (let k = 0; k < P.length; k += 3) { const u = P[k] * sxz, v = P[k + 2] * sxz; g.P.push(x + u * c - v * s, y + P[k + 1] * sy, z + u * s + v * c);
      const nu = Nn[k] / sxz, nv = Nn[k + 2] / sxz, ny = Nn[k + 1] / sy, l = Math.hypot(nu, ny, nv) || 1; g.N.push((nu * c - nv * s) / l, ny / l, (nu * s + nv * c) / l);
      g.C.push(C[k] * col[0], C[k + 1] * col[1], C[k + 2] * col[2]); }
  }
  // an alpine lodge of Hotham Heights (fl storeys): a concrete base on the slope, walls clad in timber or coloured steel with bands of windows (the facade
  // map), balconies along the long side, a steep steel roof (snow slides off it), a chimney
  function hoLodge(g, fac, x, y0, y1, z, rot, L, D, fl, o) {
    const c = Math.cos(rot), s = Math.sin(rot), P = (u, v, y) => [x + c * u - s * v, y, z + s * u + c * v], yb = y1 + 0.3, H = fl * 2.9;
    box(g, x, y0 - 0.5, z, L + 0.3, yb - y0 + 0.5, D + 0.3, rot, [0.58, 0.57, 0.55], null, true);
    const cs = [[-L / 2, -D / 2], [L / 2, -D / 2], [L / 2, D / 2], [-L / 2, D / 2]];
    for (let e = 0; e < 4; e++) { const [u0, v0] = cs[e], [u1, v1] = cs[(e + 1) % 4], bays = Math.max(1, Math.round(Math.hypot(u1 - u0, v1 - v0) / 3.2));
      fac.quadO(P(u0, v0, yb), P(u1, v1, yb), P(u1, v1, yb + H), P(u0, v0, yb + H), o.wall, [x, yb + H / 2, z], [[0, 0], [bays, 0], [bays, fl], [0, fl]]); }
    if (fl >= 2 && L > 9) for (let f = 1; f < fl; f++) box(g, x + (-s) * (D / 2 + 0.7), yb + f * 2.9 - 0.15, z + c * (D / 2 + 0.7), L * 0.86, 0.15, 1.4, rot, o.trim, null, true);   // the balconies
    const rh = Math.min(D, L) * (o.flat ? 0.12 : 0.42);
    gable(g, x, yb + H, z, L + 1.2, D + 1.4, rh, rot, o.roof, o.wall2 || o.wall);
    box(g, x, yb + H - 0.3, z, L + 0.1, 0.3, D + 0.1, rot, o.trim, null, true);
    if (!o.flat) { const [cx, , cz] = P(L * 0.28, D * 0.12, 0); box(g, cx, yb + H, cz, 0.7, rh + 0.9, 0.7, rot, [0.5, 0.48, 0.46], null, true); }
  }
  // a lift of the resort (def.lifts: bottom to top): the stations (a shed and the bull wheel under its frame), steel towers with a cross arm every ~70 m,
  // the two lines of the cable, the chairs (quad, empty in summer) or the T-bars hanging from it
  function hoLift(g, gH, x0, z0, x1, z1, tbar) {
    const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, px = -uz, pz = ux, rot = Math.atan2(uz, ux), steel = [0.56, 0.58, 0.6], dark = [0.2, 0.21, 0.22], HT = tbar ? 6 : 9.5, gw = tbar ? 1.2 : 2.3;
    const n = Math.max(2, Math.round(L / 70)), tops = [];
    for (let k = 0; k <= n; k++) { const t = k / n, x = x0 + dx * t, z = z0 + dz * t, y = gH(x, z), end = k === 0 || k === n;
      if (end) { box(g, x - ux * 3 * (k ? -1 : 1), y - 0.4, z - uz * 3 * (k ? -1 : 1), 7, 3.6, 5.2, rot, [0.62, 0.56, 0.44], null, true); gable(g, x - ux * 3 * (k ? -1 : 1), y + 3.2, z - uz * 3 * (k ? -1 : 1), 7.6, 5.8, 1.4, rot, [0.36, 0.4, 0.36], [0.62, 0.56, 0.44]);   // the station's shed
        box(g, x, y, z, 0.8, HT * 0.62, 0.8, rot, steel); cyl(g, x, y + HT * 0.62, z, gw, 0.3, 10, dark, dark); tops.push([x, y + HT * 0.62 + 0.15, z]); }
      else { box(g, x, y - 0.3, z, 0.55, HT + 0.3, 0.55, rot, steel); box(g, x, y + HT, z, 0.35, 0.3, gw * 2 + 0.6, rot, steel); tops.push([x, y + HT - 0.1, z]); }
    }
    for (const sd of [-1, 1]) for (let k = 0; k < tops.length - 1; k++) { const a = tops[k], b = tops[k + 1]; ouRod(g, [a[0] + px * gw * sd, a[1], a[2] + pz * gw * sd], [b[0] + px * gw * sd, b[1], b[2] + pz * gw * sd], 0.04, dark, 3); }
    const nc = Math.floor(L / (tbar ? 22 : 28));
    for (let k = 1; k < nc; k++) { const t = k / nc, f = t * (tops.length - 1), a = tops[Math.floor(f)], b = tops[Math.min(tops.length - 1, Math.floor(f) + 1)], u = f - Math.floor(f), sd = k % 2 ? 1 : -1;
      const cx = lerp(a[0], b[0], u) + px * gw * sd, cy = lerp(a[1], b[1], u) - 0.3 * Math.sin(u * Math.PI), cz = lerp(a[2], b[2], u) + pz * gw * sd;
      if (tbar) { ouRod(g, [cx, cy, cz], [cx, cy - 2.4, cz], 0.03, dark, 3); ouRod(g, [cx - ux * 0.45, cy - 2.4, cz - uz * 0.45], [cx + ux * 0.45, cy - 2.4, cz + uz * 0.45], 0.035, dark, 3); }
      else { ouRod(g, [cx, cy, cz], [cx, cy - 2.2, cz], 0.035, dark, 3); box(g, cx, cy - 2.6, cz, 0.6, 0.12, 2.0, rot, [0.24, 0.26, 0.3]); box(g, cx - ux * 0.3, cy - 2.5, cz - uz * 0.3, 0.1, 0.6, 2.0, rot, [0.24, 0.26, 0.3]); }
    }
  }
  function buildHotham(scene, tex, opts) {
    const R = rng(1911), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    const root = new THREE.Group(); scene.add(root);
    HOS = opts.season === 'autumn' || opts.season === 'winter' ? 'autumn' : 'summer';   // (as Vršič: the autumn colours; winter snows them over)
    const out = { root, dyn: {}, groundH: vrGround, camFloor: vrGround, props: [], farClip: true, ownTex: [], dust: [0.66, 0.63, 0.56], noBirds: true, season: HOS, paintFor: (s) => (s === 'autumn' || s === 'winter' ? 'autumn' : 'summer') };
    vrPrep(); vrStubs();
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS, base = P.D.base, su = HOS === 'summer';
    P.vistas = (def.vistas || []).filter(v => v[2]);
    const altAt = (i) => T.hy[i] + base;
    // the buildings (def.bld [x, z, length, width, angle, height (0: unknown), kind]: the lodges, blocks, sheds and huts), clear of the road and the side roads
    const blds = [];
    for (const b of def.bld || []) { const [x, z, L, W, ang, hgt, kind] = b; if (L < 2.5 || W < 2.5) continue;
      const c = Math.cos(ang), s = Math.sin(ang); let ok = true;
      for (const [u, v] of [[0, 0], [-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]]) { const px = x + c * u - s * v, pz = z + s * u + c * v, n = vrNear(px, pz); if ((n.i >= 0 && n.dd < 1.5) || vrStubAt(px, pz, 0.8)) ok = false; }
      if (ok) blds.push({ x, z, L: Math.min(L, 46), W: Math.min(W, 26), ang, hgt, kind }); }
    // the car parks and pull-outs (def.pulls [x, z, radius, distance]): a level gravel plot at the road's height
    const pulls = [];
    for (const [x, z, r] of def.pulls || []) { const n = vrNear(x, z); if (n.i < 0) continue; const i = n.i, s = i * T.ds; if (s < 30 || s > T.len - 30) continue;
      const pad = { x, z, r: Math.max(6, Math.min(r, 24)), b: 12, h: T.hy[i] - 0.25, i }; P.pads.push(pad); pulls.push(pad); }
    const padBeside = (s, r) => { const i = T.idx(s), gd = (sd) => Math.abs(vrFar(T.px[i] + T.nx[i] * sd * (r + 10), T.pz[i] + T.nz[i] * sd * (r + 10)) - T.hy[i]), sd = gd(1) < gd(-1) ? 1 : -1, o = (sd > 0 ? T.br[i] : T.bl[i]) + r + 1;
      return { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r, b: 14, h: T.hy[i] - 0.25, sd, i }; };
    const padS = padBeside(sStart - 40, 12); P.pads.push(padS);   // (the paddock behind the start: the teams' cars and vans)
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the trees, the lodges and the bridge between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (buildings, crowds, plots) for the plants and the trees, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    for (const b of blds) exclPush(b.x, b.z, Math.hypot(b.L, b.W) / 2 + 2.5);
    for (const p of pulls) exclPush(p.x, p.z, p.r + 2);
    exclPush(padS.x, padS.z, padS.r + 3);
    stubExcl(exclPush);   // (nothing grows or stands on the side roads)
    out.marks = {};   // (where the landmarks stand: the tests look for them)
    for (const v of P.vistas) out.marks[v[2]] = [v[0], v[1]];

    /* ---- terrain tiles, the snowmaking reservoir ---- */
    let nFar = 0;
    const tMat = pkGroundMat(), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = hoTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(hoTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
      const wMat = new THREE.MeshPhongMaterial({ map: tex.water, vertexColors: true, shininess: 50, specular: 0x24303a });   // the reservoir: dark mountain water, the sky in it
      const deep = [0.1, 0.2, 0.26], shal = [0.3, 0.38, 0.36], sky = [0.46, 0.58, 0.7];
      for (const L of P.lakes) {
        const cs = 4, x0 = L.x0 - 8, z0 = L.z0 - 8, nx = Math.ceil((L.x1 - L.x0 + 16) / cs) + 1, nz = Math.ceil((L.z1 - L.z0 + 16) / cs) + 1, wet = new Uint8Array(nx * nz);
        for (let b = 0; b < nz; b++) for (let a = 0; a < nx; a++) wet[b * nx + a] = vrGround(x0 + a * cs, z0 + b * cs) < L.h + 0.4 ? 1 : 0;
        const wc = (a, b) => { const x = x0 + a * cs, z = z0 + b * cs, e = vrWater(x, z).e, ks = 0.4 * sstep(0.55, 0.8, P.n2(x * 2.2, z * 2.2)); return [0, 1, 2].map(k => lerp(lerp(shal[k], deep[k], sstep(1, 10, e)), sky[k], ks)); };
        const g = new GB(true), uv = (q) => [q[0] / 14, -q[2] / 14];
        for (let b = 0; b < nz - 1; b++) for (let a = 0; a < nx - 1; a++) {
          if (!(wet[b * nx + a] | wet[b * nx + a + 1] | wet[(b + 1) * nx + a] | wet[(b + 1) * nx + a + 1])) continue;
          const A = [x0 + a * cs, L.h, z0 + b * cs], B = [A[0] + cs, L.h, A[2]], C = [A[0] + cs, L.h, A[2] + cs], D = [A[0], L.h, A[2] + cs];
          g.quadUp(A, B, C, D, [wc(a, b), wc(a + 1, b), wc(a + 1, b + 1), wc(a, b + 1)], [uv(A), uv(B), uv(C), uv(D)]);
        }
        if (!g.empty) { const m = new THREE.Mesh(g.geometry(), wMat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); }
        exclPush(L.cx, L.cz, Math.max(L.x1 - L.x0, L.z1 - L.z0) / 2 + 6);
      }
      if (P.lakes.length) out.dyn.water = tex.water;
    }

    /* ---- the road: asphalt with Australia's white lines (the edge lines; a broken centre line, the double unbroken one through the bends and over the
       crests), a gravel shoulder, then the verge out to a ditch past the barrier line, up or down onto the ground; where the ground drops away below the
       barrier a dry stone retaining wall (120 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const sw = 0.6;
    const SB = stubGeo({ gCol: hoGCol, edge: 'dash', line: 'dash', paveC: [0.8, 0.8, 0.82], gravC: [0.7, 0.62, 0.5], shC: [0.66, 0.6, 0.5] });   // the side roads: their mouths, their surfaces (in the road's chunks below)
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w;
      const ms = stubVerge(SB, i, side, e + sw, bar); if (ms) return ms;   // (a side road's mouth: no ditch, the verge at its surface)
      const y = T.hy[i], gAt = (o) => { const q = side * o; return vrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      if (gAt(bar + 0.45) < -2.6) return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, gAt(bar + 0.42) - 0.08], [bar + 1.15, gAt(bar + 1.15) + 0.03], [bar + 1.9, gAt(bar + 1.9) + 0.03]];   // (a retaining wall: its top flush with the verge)
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    const bendAt = new Uint8Array(N);   // (the double centre line: through the sharper bends and 50 m either side)
    for (const c of T.corners) if (c.sev >= 2) for (let k = Math.max(0, c.i0 - 25); k <= Math.min(N - 1, c.i1 + 25); k++) bendAt[k] = 1;
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.84 - 0.13 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.88) k -= 0.04; return [k, k, k * 1.02]; };
      const wht = [0.95, 0.95, 0.92], gc = [0.66, 0.66, 0.65];   // (the shoulder: grey crushed rock)
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          const wl = vp[si][i][2][1] < -2.6 && !SB.mouthV[si][i]; if (wl && (k === 1 || k === 2)) { const q = 0.9 + 0.14 * rpHash(i >> 1, 53 + si); return k === 1 ? [0.64 * q, 0.62 * q, 0.58 * q] : [0.5 * q, 0.48 * q, 0.45 * q]; }   // (the wall's stone coping, its face)
          if (k === 4) return hoGCol(x, z);
          const sl = k === 2 ? vrSlope(x, z) : 0, l = Math.sqrt(1 + sl * sl); return hoCol(x, z, T.hy[i] + y, 1 / l, Math.max(0, o - bar)).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      for (let c0 = 0; c0 < N - 1; c0 += 80) {
        const gr = new GB(true), gl = new GB(), gs = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 80, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / 6, s1 = j * T.ds / 6;
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
            gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
          const ln = [...SB.edges(i, j, [[-(w - 0.3), -(w - 0.45)], [w - 0.45, w - 0.3]])];
          if (bendAt[i] || bendAt[j]) ln.push([-0.26, -0.14], [0.14, 0.26]);   // (the double unbroken line)
          else if (i % 6 < 2) ln.push([-0.06, 0.06]);   // (the broken line: 4 m dashes, 8 m gaps)
          for (const [o0, o1] of ln) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [wht, wht, wht, wht]);
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j];
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [gc, gc, gc, gc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              if (k === 1 && (qi[2][1] < -2.6 || qj[2][1] < -2.6) && !SB.mouthV[si][i] && !SB.mouthV[si][j]) gv.quadO(a, b, c, d, null, Pt(i, 0, Math.min(qi[2][1], qj[2][1]) * 0.5), [wuv(a), wuv(b), wuv(c), wuv(d)], [ci[k], ci[k + 1], cj[k + 1], cj[k]]);   // (the wall's face)
              else gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
        }
        SB.emit(c0, c0 + 80, gr, gs, gl);   // (the side roads whose junctions are in this chunk)
        addM(gr, aMat); addM(gl, lMat); addM(gs, sMat); addM(gv, gMat);
      }
      // chequered start and finish lines, a white line at each checkpoint
      const gq = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1];
      for (const s0 of [sStart, sFin]) { const a = atSf(s0 - 0.8, -w), b = atSf(s0 - 0.8, w), c = atSf(s0 + 0.8, w), d = atSf(s0 + 0.8, -w), y = (p) => T.hy[p[3]] + 0.045;
        gq.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]); }
      for (const s0 of T.cpS) { const a = atSf(s0 - 0.25, -w + 0.1), b = atSf(s0 - 0.25, w - 0.1), c = atSf(s0 + 0.25, w - 0.1), d = atSf(s0 + 0.25, -w + 0.1), y = (p) => T.hy[p[3]] + 0.042;
        gw.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [wht, wht, wht, wht]); }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw, lMat);
    }

    /* ---- scenery (vertex coloured, 110 m chunks) ---- */
    const scen = new Chunks(130), fac = new Chunks(130, true), ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];   // (fac: the lodges' walls; ban: the race's boards, ban2: the signs)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.84, 0.14, 0.14], [0.95, 0.95, 0.95], [0.14, 0.26, 0.6], [0.2, 0.5, 0.32], [0.95, 0.72, 0.16], [0.46, 0.66, 0.86], [0.12, 0.14, 0.2], [0.9, 0.45, 0.14], [0.06, 0.4, 0.26], [0.98, 0.8, 0.1]];   // (jackets and fleeces, a few in green and gold)
    const CR = crowdCtx({ gH: vrGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: (x, z) => vrWater(x, z).e > -4, shirts: fans }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1; tilt leans its top towards +t
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const board = (k) => { const v1 = 1 - (4 + Math.floor(k / 2)) / 8; return [v1 - 1 / 8, v1, (k % 2) * 0.5, (k % 2) * 0.5 + 0.5]; };   // a road board of the second atlas: [v0, v1, u0, u1]
    const cell = (k) => { const u0 = (k % 8) / 8, v1 = 1 - Math.floor(k / 8) / 8; return [v1 - 1 / 8, v1, u0, u0 + 1 / 8]; };   // a small sign of the second atlas
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road: two posts at the barriers, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.9, L2 = T.br[i] + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 12.8, 1.6, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, col) => crowdPut(CR, x, vrGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: col || fans[Math.floor(R() * fans.length)] }, 1);
    const signPost = (s, side, extra, k, W, H, tall) => {   // a sign of the second atlas on a steel post beside the road, facing the cars coming up
      const [px, pz, ii] = onSide(s, side, extra); if (excluded(px, pz) || vrStubAt(px, pz, 1)) return null; const py = vrGround(px, pz), g = scen.get(px, pz), c = k < 32 ? cell(k) : board(k - 32);
      box(g, px, py - 0.2, pz, 0.08, (tall || 2.1) + 0.2, 0.08, T.hd[ii], [0.6, 0.61, 0.63]);
      bannerQ(px, py + (tall || 2.1) - H * 0.4, pz, -T.tx[ii], -T.tz[ii], W, H, c[0], c[1], c[2], c[3], ban2); exclPush(px, pz, 1.5); CR.avoid(px, pz, 0.8); return [px, py, pz, ii];
    };
    const carCols = [[0.86, 0.86, 0.84], [0.62, 0.12, 0.1], [0.14, 0.26, 0.5], [0.16, 0.16, 0.18], [0.5, 0.52, 0.55], [0.24, 0.36, 0.26], [0.76, 0.66, 0.5], [0.94, 0.94, 0.92]];
    const ute = (g, x, y, z, rot, col) => {   // a four-wheel drive (a dual-cab ute or a wagon, ~5 m, high on its wheels): the cab, the tray or the long roof, the bull bar
      const c = Math.cos(rot), s = Math.sin(rot);
      box(g, x, y + 0.45, z, 5.1, 0.95, 1.9, rot, col, null, true); box(g, x + c * 0.35, y + 1.4, z + s * 0.35, 2.6, 0.75, 1.8, rot, [0.14, 0.17, 0.22], col, true);
      box(g, x + c * 2.6, y + 0.4, z + s * 2.6, 0.2, 0.75, 1.8, rot, [0.1, 0.1, 0.11], null, true);
      for (const [a, b] of [[1.6, 0.85], [1.6, -0.85], [-1.6, 0.85], [-1.6, -0.85]]) box(g, x + c * a - s * b, y, z + s * a + c * b, 0.8, 0.8, 0.3, rot, [0.08, 0.08, 0.09], null, true);
    };
    const parked = (g, x, y, z, rot, k, RC) => { const col = vary(carCols[Math.floor(RC() * carCols.length)], RC, 0.12); if (k % 3 === 1) ute(g, x, y, z, rot, col); else caCar(g, x, y, z, rot, col); };
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));
    let hiI = T.startIdx; for (let i = T.startIdx; i <= T.finishIdx; i++) if (T.hy[i] > T.hy[hiI]) hiI = i;

    /* ---- the buildings: the lodges and apartment blocks of Hotham Heights (timber, coloured steel, rendered blocks; steep steel roofs), the sheds and the
       plant rooms of the resort, the huts by the road; none of them named ---- */
    let nBld = 0;
    {
      const RB = rng(1921), walls = [[0.52, 0.36, 0.22], [0.66, 0.5, 0.32], [0.86, 0.84, 0.78], [0.42, 0.46, 0.4], [0.62, 0.32, 0.22], [0.72, 0.7, 0.64], [0.3, 0.38, 0.34]], roofs = [[0.22, 0.32, 0.26], [0.5, 0.18, 0.14], [0.3, 0.32, 0.34], [0.62, 0.64, 0.66], [0.16, 0.2, 0.26]];
      const lowHigh = (b) => { const c = Math.cos(b.ang), s = Math.sin(b.ang); let lo = 1e9, hi = -1e9; for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const y = vrGround(b.x + c * u - s * v, b.z + s * u + c * v); lo = Math.min(lo, y); hi = Math.max(hi, y); } return [lo, hi]; };
      for (const b of blds) {
        const g = scen.get(b.x, b.z), [lo, hi] = lowHigh(b);
        if (b.kind === 2) {   // a shed or a workshop: a steel box, a low roof
          const col = vary([0.6, 0.62, 0.6], RB, 0.12); box(g, b.x, lo - 0.3, b.z, b.L, hi - lo + 0.3 + 4.2, b.W, b.ang, col, null, true);
          gable(g, b.x, hi + 3.9, b.z, b.L + 0.6, b.W + 0.6, Math.min(b.L, b.W) * 0.14, b.ang, vary(roofs[Math.floor(RB() * roofs.length)], RB, 0.1), col);
        } else if (b.kind === 3) {   // a hut: timber, a steep roof
          const wd = vary([0.5, 0.36, 0.22], RB, 0.12); box(g, b.x, lo - 0.3, b.z, b.L, hi - lo + 0.3 + 2.5, b.W, b.ang, wd, null, true);
          gable(g, b.x, hi + 2.2, b.z, b.L + 0.6, b.W + 0.6, Math.min(b.L, b.W) * 0.4, b.ang, vary(roofs[Math.floor(RB() * roofs.length)], RB, 0.1), wd);
        } else {   // a lodge (kind 0: 2-4 storeys) or a block (kind 1: 3-5, a lower roof)
          const fl = b.kind === 1 ? clamp(Math.round((b.hgt || 12) / 2.9), 3, 5) : b.L * b.W > 220 ? 3 + (RB() < 0.4 ? 1 : 0) : 2 + (RB() < 0.5 ? 1 : 0), wall = vary(walls[Math.floor(RB() * walls.length)], RB, 0.1);
          hoLodge(g, fac.get(b.x, b.z), b.x, lo, hi, b.z, b.ang, b.L, b.W, fl, { wall, wall2: vary(wall, RB, 0.1), roof: vary(roofs[Math.floor(RB() * roofs.length)], RB, 0.1), trim: [0.3, 0.24, 0.18], flat: b.kind === 1 && b.L * b.W > 500 });
        }
        CR.block(b.x, b.z, b.L + 1, b.W + 1, b.ang); nBld++;
      }
    }

    /* ---- START (on the climb below Mount Little Blowhard): gantry with the start lights, the timing hut, pennants along the grid, the teams' paddock behind,
       the road closed behind it ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i];
      box(scen.get(x, z), x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 5, -1, 3.2), hy = vrGround(hx, hz), gh = scen.get(hx, hz);   // the timing hut
      box(gh, hx, hy, hz, 4.0, 2.7, 2.8, T.hd[i], [0.86, 0.84, 0.78], [0.4, 0.28, 0.18], true); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.3, 0.42], null, true); gable(gh, hx, hy + 2.7, hz, 4.4, 3.2, 1.1, T.hd[i], [0.22, 0.32, 0.26], [0.86, 0.84, 0.78]);
      exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]);
      const pc = [[0.06, 0.4, 0.26], [0.98, 0.8, 0.1], [0.95, 0.95, 0.95], [0.14, 0.26, 0.6]];
      for (let s = 8, k = 0; s < sStart + 50; s += 12, k++) for (const side of [-1, 1]) { const [px, pz, ii] = onSide(s, side, 1.3); if ((excluded(px, pz) && s > sStart - 8) || vrStubAt(px, pz, 1)) continue;   // pennants on poles
        const g = scen.get(px, pz), py = vrGround(px, pz); cyl(g, px, py - 0.2, pz, 0.05, 5.2, 5, [0.9, 0.9, 0.92]);
        const tri = (yy, c) => { const a = [px, py + yy, pz], b = [px, py + yy - 1.0, pz], cc = [px + T.tx[ii] * 1.6, py + yy - 0.5, pz + T.tz[ii] * 1.6]; g.triO(a, b, cc, c, [px - T.nx[ii], py + yy, pz - T.nz[ii]]); g.triO(a, cc, b, c, [px + T.nx[ii], py + yy, pz + T.nz[ii]]); };
        tri(4.9, pc[(k + (side > 0 ? 1 : 0)) % 4]); }
      { const RC = rng(1931), hh = T.hd[padS.i], c = Math.cos(hh), sn = Math.sin(hh);   // the paddock: the teams' four-wheel drives and vans
        for (let k = 0; k < 8; k++) { const a = -9 + (k % 4) * 6, b = (k < 4 ? -4 : 4), px = padS.x - sn * b + c * a, pz = padS.z + c * b + sn * a; if (vrNear(px, pz).dd < 1.5) continue; parked(scen.get(px, pz), px, vrGround(px, pz), pz, hh + PI / 2, k, RC); } }
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road: concrete barriers across it
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      { const [bx, bz, bi] = onSide(sStart + 16, 1, 1.6), by = vrGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        bannerQ(bx, by + 1.5, bz, -T.nx[bi], -T.nz[bi], 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); }
    }

    /* ---- the checkpoints: a green gantry "CPn  altitude" ---- */
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.11, 0.37, 0.27]));

    /* ---- FINISH (in Hotham Heights): chequered gantry and flags, the village's board, the road closed farther on ---- */
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      for (const side of [-1, 1]) for (let s = sFin - 28; s < sFin + 12; s += 7) { const [px, pz, ii] = onSide(s, side, 1.4); if (vrStubAt(px, pz, 1)) continue; const py = vrGround(px, pz), gg = scen.get(px, pz);
        cyl(gg, px, py, pz, 0.06, 5, 5, [0.9, 0.9, 0.92]);
        for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) box(gg, px + T.tx[ii] * (0.36 + a * 0.55), py + 3.8 + b * 0.55, pz + T.tz[ii] * (0.36 + a * 0.55), 0.55, 0.55, 0.05, T.hd[ii], (a + b) % 2 ? [0.08, 0.08, 0.08] : [0.96, 0.96, 0.96], null, true); }
      const [sx, sz, si] = onSide(sFin - 40, -1, 3.0), sy = vrGround(sx, sz), gs = scen.get(sx, sz), tl = 0.9, W2 = 7, H2 = W2 / 8;   // the village's board: timber on posts leaning back, on a stone plinth
      if (!excluded(sx, sz)) {
        for (const o of [-2.9, 2.9]) { const px = sx + T.tx[si] * o, pz = sz + T.tz[si] * o; box(gs, px, sy, pz, 0.26, 1.3 + H2, 0.26, T.hd[si], [0.36, 0.24, 0.14]); }
        box(gs, sx, sy - 0.3, sz, W2 + 1.1, 0.65, 1.2, T.hd[si], [0.6, 0.58, 0.55], [0.66, 0.64, 0.6]);
        { const [v0, v1] = row(6); bannerQ(sx, sy + 1.2, sz, -T.nx[si], -T.nz[si], W2, H2, v0, v1, 0, 1, null, 0); }
        exclPush(sx, sz, 5); }
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;   // the end of the road towards Dinner Plain: concrete barriers across it
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[iE], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
    }

    /* ---- the lookouts (Renes, Danny's): the car park beside the road (the nearest of def.pulls) with its cars, a low wall of the grey stone round the edge
       towards the view, a railing on it, an information board, the visitors looking out; the brown board before each turn-off ---- */
    for (const [vx, vz, vn] of P.vistas) {
      const pad = pulls.reduce((a, p) => (!a || Math.hypot(p.x - vx, p.z - vz) < Math.hypot(a.x - vx, a.z - vz) ? p : a), null); if (!pad) continue;
      const RC = rng(1941 + Math.round(vx)), i = pad.i, hh = T.hd[i], c = Math.cos(hh), sn = Math.sin(hh), stone = [0.6, 0.59, 0.56];
      for (let k = 0; k < 6; k++) { const a = -9 + (k % 3) * 6, b = (k < 3 ? -1 : 1) * 3.5, px = pad.x - sn * b + c * a, pz = pad.z + c * b + sn * a; if (vrNear(px, pz).dd < 1.5 || RC() < 0.25) continue; parked(scen.get(px, pz), px, vrGround(px, pz), pz, hh + PI / 2, k, RC); }
      const dx = vx - pad.x, dz = vz - pad.z, L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L, ox = vx - ux * 2, oz = vz - uz * 2, oy = vrGround(ox, oz), g = scen.get(ox, oz);
      const ang = Math.atan2(uz, ux);
      for (let a = -3; a <= 3; a++) { const t = a * 1.6, px = ox - uz * t, pz = oz + ux * t, py = vrGround(px, pz);   // the wall and its railing across the view
        box(g, px, py - 0.4, pz, 0.6, 1.1, 1.65, ang, stone, [0.66, 0.65, 0.62]); ouRod(g, [px, py + 0.7, pz], [px, py + 1.2, pz], 0.03, [0.32, 0.32, 0.34], 4); }
      ouRod(g, [ox + uz * 4.8, oy + 1.2, oz - ux * 4.8], [ox - uz * 4.8, oy + 1.2, oz + ux * 4.8], 0.04, [0.32, 0.32, 0.34], 4);
      { const bx = ox - ux * 2.5 + uz * 4, bz = oz - uz * 2.5 - ux * 4, by = vrGround(bx, bz); for (const u of [-0.6, 0.6]) box(g, bx - uz * u, by - 0.2, bz + ux * u, 0.1, 1.5, 0.1, ang, [0.36, 0.24, 0.14]);   // the information board (its face blank brown)
        box(g, bx, by + 0.9, bz, 0.08, 0.8, 1.5, ang, [0.42, 0.26, 0.14]); }
      exclPush(ox, oz, 6); for (let k = 0; k < 7; k++) { const a = (RC() - 0.5) * 2.4, r = 1.5 + RC() * 2.5; person(ox - ux * r + (-uz) * a * 3, oz - uz * r + ux * a * 3, ang - PI / 2 + (RC() - 0.5)); }
      const bk = vn === 'Renes Lookout' ? 2 : 3;
      signPost(i * T.ds - 160, -1, 1.4, 32 + bk, 3.4, 0.85, 2.6);
    }
    for (const p of pulls) {   // the other car parks and pull-outs: a few cars
      if (P.vistas.some(v => Math.hypot(v[0] - p.x, v[1] - p.z) < 70)) continue;
      const RC = rng(1951 + p.i), hh = T.hd[p.i], c = Math.cos(hh), sn = Math.sin(hh), n = Math.min(6, Math.floor(p.r / 3));
      for (let k = 0; k < n; k++) { if (RC() < 0.45) continue; const a = (k - n / 2) * 5, px = p.x + c * a, pz = p.z + sn * a; if (vrNear(px, pz).dd < 1.5) continue; parked(scen.get(px, pz), px, vrGround(px, pz), pz, hh + PI / 2 + (RC() < 0.5 ? 0 : PI), k, RC); }
    }

    /* ---- the ski bridge over the road before the village (def.skiBridges): a concrete deck on two abutments, the piste over it (grass and gravel in
       summer), a railing along both edges ---- */
    for (const d of def.skiBridges || []) {
      const s0 = sStart + d, i = T.idx(s0), x = T.px[i], z = T.pz[i], y = T.hy[i], hd = T.hd[i], L1 = T.bl[i] + 3.5, L2 = T.br[i] + 3.5, nx = T.nx[i], nz = T.nz[i], g = scen.get(x, z), con = [0.7, 0.69, 0.66], dk = 8.5, cl = 5.4;
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2;
      box(g, cx, y + cl, cz, dk, 0.9, L1 + L2 + 2, hd, con, su ? [0.48, 0.5, 0.36] : [0.6, 0.56, 0.42]);   // the deck, its top the piste's
      for (const [o, L] of [[-L1, L1], [L2, L2]]) { const ax = x + nx * o, az = z + nz * o, gy = vrGround(ax, az); box(g, ax, Math.min(gy, y) - 1, az, dk + 1, Math.max(cl, y + cl - gy) + 1.2, 1.6, hd, con); }   // the abutments
      for (const t of [-dk / 2, dk / 2]) ouRod(g, [cx + T.tx[i] * t - nx * (L1 + 1), y + cl + 1.9, cz + T.tz[i] * t - nz * (L1 + 1)], [cx + T.tx[i] * t + nx * (L2 + 1), y + cl + 1.9, cz + T.tz[i] * t + nz * (L2 + 1)], 0.05, [0.4, 0.42, 0.44], 4);
      for (const t of [-dk / 2, dk / 2]) for (let o = -L1 - 1; o <= L2 + 1; o += 2.5) { const px = cx + T.tx[i] * t + nx * o, pz = cz + T.tz[i] * t + nz * o; ouRod(g, [px, y + cl + 0.9, pz], [px, y + cl + 1.9, pz], 0.04, [0.4, 0.42, 0.44], 4); }
      exclPush(x, z, Math.max(L1, L2) + 6); out.marks['Ski bridge'] = [x, z];
    }

    /* ---- the lifts of the resort (def.lifts) ---- */
    let nLift = 0;
    for (const [x0, z0, x1, z1, tb] of def.lifts || []) { const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2; if (Math.min(vrDist(x0, z0), vrDist(x1, z1), vrDist(mx, mz)) > 420) continue;
      hoLift(scen.get(mx, mz), vrGround, x0, z0, x1, z1, tb === 1); nLift++;
      for (let t = 0; t <= 1; t += 0.1) exclPush(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, 4); }

    /* ---- guardrails where the ground falls away and round the outside of the sharper bends (not in the village), W-beam on steel posts; the orange snow poles
       along both edges every ~30 m just past the barrier line (to find the road's edge when the snow lies deep), the white guide posts with their reflectors
       on the verge every ~50 m (knockable) ---- */
    let nRail = 0, nPole = 0;
    {
      const need = [new Uint8Array(N), new Uint8Array(N)], poleSpots = [], postSpots = [];
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 8); k <= Math.min(N - 1, c.i1 + 8); k++) need[sd][k] = 1; }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];
        for (const d of [4, 8, 13, 19, 26]) { const o = side * (bar + d);
          if (vrGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      const iS0 = T.idx(sStart + 40), iS1 = T.idx(sFin - 40), steel = [0.8, 0.82, 0.84], steelB = [0.56, 0.58, 0.6], postC = [0.56, 0.57, 0.6];
      const near = (i) => { for (const p of pulls) if (Math.hypot(T.px[i] - p.x, T.pz[i] - p.z) < p.r + 6) return true; return false; };
      for (const side of [-1, 1]) {
        const nd = need[side > 0 ? 1 : 0], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1 || near(i) || vrLCf(T.px[i], T.pz[i], 3) > 0.5) nd[i] = 0;
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; }
        stubRails(nd, side);   // (open across the side roads' mouths)
        nRail += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          const g = scen.get(T.px[i], T.pz[i]);
          if (nd[i] && nd[i + 1]) {   // W-beam: a front and a back face, a post every 4 m
            const a = Q(i, 0.45), b = Q(i + 1, 0.45), c = Q(i + 1, 0.8), d = Q(i, 0.8), ins = Q(i, 0.6, 3), ino = Q(i, 0.6, -3);
            g.quadO(a, b, c, d, steel, ins); g.quadO(a, b, c, d, steelB, ino);
            if (i % 2 === 0) { const p = Q(i, -0.35, 0.14); box(g, p[0], p[1], p[2], 0.13, 1.13, 0.13, T.hd[i], postC, null, true); }
          }
          if (i % 15 === (side > 0 ? 0 : 7) && i > 4 && i < iE - 4 && !near(i) && !SB.mouthV[side > 0 ? 1 : 0][i]) poleSpots.push([i, side]);
          if (i % 25 === (side > 0 ? 3 : 15) && i > 4 && i < iE - 4 && !near(i) && !SB.mouthV[side > 0 ? 1 : 0][i]) postSpots.push([i, side]);
        }
      }
      out.propR = 150; out.propFloor = propFloorTable(null, (i, side) => vp[side > 0 ? 1 : 0][i]);
      const sA = sStart + 30, sB = sFin - 30;
      out.propStats = roadsideProps(out.props, { spots: postSpots, postEdge: [1.0, 1.4], postCol: () => 0, exits: 0, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,   // (the white guide posts on the verge: knockable)
        floor: out.propFloor, skip: (i) => { const s = i * T.ds; return s < sA || s > sB; } });
      const poleO = [0.95, 0.4, 0.08], poleK = [0.09, 0.09, 0.1];
      for (const sp of poleSpots) {   // the snow poles just past the barrier line: tall, orange with black bands
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, y0 = Math.min(T.hy[i], vrGround(x, z)) - 0.15, g = scen.get(x, z), H = 3.4;
        for (let b = 0; b < 6; b++) box(g, x, y0 + H * b / 6, z, 0.09, H / 6, 0.09, T.hd[i], b === 5 || b === 3 ? poleK : poleO, null, true);
        nPole++; }
    }

    /* ---- the side roads' cones across their mouths, the rail and the gates at their ends, their names (stubProps) ---- */
    out.stubStats = stubProps({ scen, out, root, gH: vrGround, loc: { closed: 'ROAD CLOSED', gate: 'CLOSED', plate: ['#0f6b3e', '#f4f6f2'] }, posts: 'none' });

    /* ---- the curve signs: 110 m before each main bend a yellow diamond with the bent arrow, its advisory speed under it; chevrons on the outside of the
       sharpest; a few boards and the kilometre plates up the road ---- */
    (def.curves || []).forEach(([d, , turn]) => {
      const c = T.corners.find(q => sStart + d >= q.i0 * T.ds - 8 && sStart + d <= q.i1 * T.ds + 8), sev = c ? c.sev : 1;
      const r = signPost(sStart + d - 110, -1, 0.9, turn > 0 ? 1 : 0, 0.95, 0.95, 2.4);
      if (r) { const [px, py, pz, ii] = r, sp = cell(sev >= 3 ? 2 : sev >= 2 ? 3 : 4); bannerQ(px, py + 0.95, pz, -T.tx[ii], -T.tz[ii], 0.62, 0.62, sp[0], sp[1], sp[2], sp[3], ban2); }
      if (!c || c.sev < 2) return;
      const out_ = -turn, cc = cell(turn > 0 ? 6 : 7);
      for (const o of [-12, 0, 12]) { const [cx, cz, ci] = onSide(sStart + d + o, out_, 0.7); if (excluded(cx, cz) || vrStubAt(cx, cz, 1)) continue;
        const cy = vrGround(cx, cz), g = scen.get(cx, cz), fx = T.px[ci] - cx, fz = T.pz[ci] - cz, fl = Math.hypot(fx, fz) || 1, tx = -T.tx[ci] * 0.75 + fx / fl * 0.25, tz = -T.tz[ci] * 0.75 + fz / fl * 0.25, tl = Math.hypot(tx, tz);
        box(g, cx, cy - 0.2, cz, 0.08, 1.5, 0.08, T.hd[ci], [0.6, 0.61, 0.63]);
        bannerQ(cx, cy + 0.75, cz, tx / tl, tz / tl, 0.7, 0.7, cc[0], cc[1], cc[2], cc[3], ban2); CR.avoid(cx, cz, 0.6); }
    });
    signPost(sStart + 90, -1, 1.4, 32 + 0, 3.6, 0.9, 2.4);   // KEEP LEFT UNLESS OVERTAKING
    signPost(sStart + 260, -1, 1.4, 32 + 1, 3.2, 0.8, 2.4);   // HOTHAM HEIGHTS 8
    signPost(sStart + 1900, -1, 1.4, 32 + 4, 3.2, 0.8, 2.4); signPost(sStart + 4700, -1, 1.4, 32 + 5, 3.0, 0.75, 2.4);   // CARRY SNOW CHAINS, ICE ON ROAD
    signPost(sStart + 2600, 1, 1.4, 32 + 6, 3.4, 0.85, 2.4);   // ALPINE NATIONAL PARK (facing the way down too)
    signPost(sFin + 160, -1, 1.4, 32 + 7, 3.2, 0.8, 2.4);   // DINNER PLAIN ->
    for (let k = 1; k <= 7; k++) signPost(sStart + k * 1000, -1, 0.7, 8 + k - 1, 0.36, 0.36, 1.1);   // the kilometre plates

    /* ---- spectators: the start and the finish, the checkpoints, the lookouts, the outside of the sharper bends, a few groups along the road ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.6, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.25, flag: 0.12, keepBar: 1.6 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 70, sStart + 70, sd, { rows: 3, dens: 0.6, label: 'HO start' }); run(sFin - 80, sFin + 14, sd, { rows: 3, dens: 0.6, label: 'HO finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 24, s0 + 20, side, { rows: 2, dens: 0.55, label: 'HO cp+' }); run(s0 - 20, s0 + 16, -side, { rows: 2, dens: 0.4, label: 'HO cp-' }); });
      (def.curves || []).forEach(([d, , turn], k) => { if (k % 3 !== 1) return; const sm = sStart + d; run(sm - 20, sm + 20, -turn, { rows: 2, dens: 0.45, flag: 0.18, label: 'HO bend ' + (k + 1) }); });
      for (let s = sStart + 500, k = 0; s < sFin - 300; s += 700, k++) { const sd = rpHash(Math.round(s), 9) < 0.5 ? -1 : 1; run(s, s + 24, sd, { rows: 2, dens: 0.35, clump: 0.9, label: 'HO group' }); }
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the snow gum woodland (instanced per 96 m chunk): the many-stemmed snow gums, open and low on the tops, crooked and wind-cropped near the summit, the
       silver stags of the fires here and there with their regrowth, alpine ash below ~1600 m on the sheltered slopes; a few lone snow gums out on the grass;
       none on the rock, the cliffs, the runs or the water ---- */
    const tMatT = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const tk = new IChunks(hoTreeGeo(0), tMatT, 96), tg = [null, null, hoTreeGeo(2), hoTreeGeo(3)];   // (the snow gums instanced; the stags and the ashes, fewer, merged into the scenery)
    let nTrees = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(70000 * dens), RT = rng(1961), SP = 5.4 / Math.sqrt(dens);
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > 215) continue;
          if (hd > 90 && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;   // (farther out every other spot, the trees bigger)
          const c = vrLC(x, z), y = vrGround(x, z), A = y + base, top = sstep(1760, 1830, A);
          const p = c === 1 ? 0.36 - 0.17 * top : c === 2 ? 0.06 : c === 0 ? 0.025 * (1 - top) : c === 3 ? 0.05 : 0;
          if (r1 > p) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 2.4) continue; if (nn.i >= 0 && nn.dd < 6 && r2 < 0.3) continue;
          if (excluded(x, z) || vrWater(x, z).e > -4) continue;
          if (vrSlope(x, z) > 1.2) continue;
          const ash = sstep(1575, 1520, A) * (c === 1 ? 0.25 : 0);
          const sp = r3 < ash ? 3 : r3 < ash + 0.09 ? 2 : (top > 0.4 || r4 < 0.12) ? 1 : 0;
          const far = hd > 90 ? 1.12 : 1, sh = lerp(1, 0.6, top);
          let hgt, wid, col;
          if (sp === 0) { hgt = (6 + r4 * 6) * sh; wid = hgt * (0.85 + r2 * 0.3); col = [0.92 + r2 * 0.16, 0.94 + r4 * 0.12, 0.92 + r3 * 0.14]; }
          else if (sp === 1) { hgt = (3 + r4 * 2.8) * sh; wid = hgt * (1.5 + r2 * 0.5); col = [0.92 + r2 * 0.16, 0.95 + r4 * 0.1, 0.92]; }   // (the windswept ones: the same tree, low and wide)
          else if (sp === 2) { hgt = 5 + r4 * 4; wid = hgt * 0.75; col = [0.95 + r2 * 0.1, 0.96 + r2 * 0.08, 0.96 + r2 * 0.1]; }
          else { hgt = 18 + r4 * 10; wid = hgt * 0.42; col = [0.98 + r2 * 0.12, 1.0 + r4 * 0.08, 0.96]; }
          if (sp < 2) tk.add(x, y - 0.15, z, r1 * 70, wid * far, hgt * far, col); else hoPut(scen.get(x, z), tg[sp], x, y - 0.15, z, r1 * 70, wid * far, hgt * far, col);
          if (++nTrees >= maxT) break grid;
        }
      }
    }
    tk.addTo(root, true);

    /* ---- the alpine plants (instanced per 96 m chunk): the snow grass tussocks, the heath shrubs, the flowers of the summer (white snow daisies, yellow
       billy buttons, pink trigger plants; a few seed heads in autumn), grey boulders; thicker near the road, none on the water or the plots ---- */
    const pMat = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const wMat = tuftWindMat(out.dyn.wind || (out.dyn.wind = { value: 0 })), wB = wMat.onBeforeCompile; ouCutMat(wMat, cut);   // (the tussocks: in the wind, and the cut)
    { const cB = wMat.onBeforeCompile; wMat.onBeforeCompile = (sh) => { wB(sh); cB(sh); }; wMat.customProgramCacheKey = () => 'tuftWindCut'; wMat.side = THREE.FrontSide; }
    const pk = [0, 1, 2, 4].map(k => new IChunks(hoPlantGeo(k), k === 0 ? wMat : pMat, k === 0 || k === 4 ? 96 : 192));   // (pk[3]: the heath; the stones are small boulders)
    const flowerC = su ? [[1, 1, 1], [1, 1, 1], [1.0, 0.86, 0.22], [1.0, 0.6, 0.78], [1, 1, 1]] : [[0.86, 0.8, 0.66], [0.9, 0.86, 0.7], [0.78, 0.62, 0.4]];
    const tusC = su ? [1, 1, 1] : [1.18, 1.06, 0.86];
    let nPlants = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(60000 * dens), RT = rng(1971), SP = 3.8 / Math.sqrt(dens);
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > 200) continue;
          if (hd > 70 && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;
          const c = vrLC(x, z);
          let kind = -1;
          if (c === 0) kind = r1 < 0.46 ? 0 : r1 < (su ? 0.56 : 0.5) ? 1 : r1 < 0.6 ? 4 : r1 < 0.62 ? 2 : -1;
          else if (c === 2) kind = r1 < 0.32 ? 4 : r1 < 0.5 ? 0 : r1 < 0.53 ? 2 : -1;
          else if (c === 1) kind = r1 < 0.2 ? 0 : r1 < 0.24 ? 4 : r1 < 0.26 ? 2 : -1;
          else if (c === 4) kind = r1 < 0.2 ? 2 : r1 < 0.3 ? 0 : -1;
          if (kind < 0) continue;
          const y0 = vrGround(x, z), sl = vrSlope(x, z); if (sl > (kind === 2 ? 1.1 : 0.9)) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 1.6) continue;
          if (excluded(x, z) || vrWater(x, z).e > -3) continue;
          if (kind === 0) pk[0].add(x, y0 - 0.05, z, r2 * TAU, 0.45 + r3 * 0.5, 0.35 + r4 * 0.35, [tusC[0] * (0.92 + r2 * 0.16), tusC[1] * (0.95 + r3 * 0.1), tusC[2] * (0.9 + r4 * 0.16)]);
          else if (kind === 1) pk[1].add(x, y0 - 0.06, z, r2 * TAU, 0.4 + r3 * 0.6, 0.25 + r4 * 0.25, flowerC[Math.floor(r4 * flowerC.length)]);
          else if (kind === 4) pk[3].add(x, y0 - 0.1, z, r2 * TAU, 0.8 + r3 * 1.2, 0.5 + r4 * 0.6, [0.9 + r2 * 0.2, 0.92 + r3 * 0.16, 0.9]);
          else { const k = 0.85 + r3 * 0.3; pk[2].add(x, y0 - 0.15, z, r4 * TAU, 0.6 + r3 * 1.8, 0.45 + r4 * 1.2, [k, k, k * 0.98]); }
          if (++nPlants >= maxT) break grid;
        }
      }
    }
    {   // the stones by the road: little clusters strewn beside it, thickest at its edge, thinning out over ~25 m
      const RS = rng(1977), maxS = Math.round(12000 * dens); let nS = 0;
      edge: for (let s = 12; s < T.len - 12; s += 1.6 / dens) for (const side of [-1, 1]) {
        const o = 1.7 + Math.pow(RS(), 2) * 25, [x, z] = onSide(s, side, o), r1 = RS(), r2 = RS(), r3 = RS();
        if (vrNear(x, z).dd < 1.2 || excluded(x, z)) continue;
        const sl = vrSlope(x, z); if (sl > 1.15 || (vrLC(x, z) !== 4 && r1 < 0.6)) continue;
        const y0 = vrGround(x, z), k = 0.84 + r3 * 0.28, sc = 0.22 + r1 * 0.3; pk[2].add(x, y0 - 0.06, z, r2 * TAU, sc, sc * (0.7 + r3 * 0.5), [k, k, k]);
        if (++nS >= maxS) break edge;
      }
    }
    for (const t of pk) t.addTo(root, false);

    /* ---- the rock: grey tors and boulders at the foot of the cuts and on the steep slopes beside the road ---- */
    {
      const RV = rng(1981), grey = [[0.6, 0.6, 0.58], [0.56, 0.55, 0.52], [0.64, 0.63, 0.6], [0.52, 0.52, 0.5], [0.62, 0.58, 0.52]];
      API.ROCK_SMOOTH = false;
      for (let s = 10; s < T.len - 10; s += 6) for (const side of [-1, 1]) {   // at the foot of the cuts
        if (RV() > 0.3) continue;
        const o = 1.6 + Math.pow(RV(), 1.5) * 32, [x, z] = onSide(s, side, o), sz = 0.4 + RV() * 1.3; if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z)) continue;
        const y = vrGround(x, z), sl = vrSlope(x, z); if (sl < 0.3 && vrLC(x, z) !== 4) continue;
        rock(scen.get(x, z), x, y + sz * 0.3, z, sz * 1.25, sz, sz, RV() * TAU, vary(grey[Math.floor(RV() * grey.length)], RV, 0.1), RV, 0.28);
      }
      for (let s = 16; s < T.len - 16; s += 15) for (const side of [-1, 1]) {   // tors where the slope is steep or the tops are rocky
        if (RV() < 0.45) continue;
        const [x, z] = onSide(s, side, 8 + RV() * 70); if (excluded(x, z) || vrNear(x, z).dd < 6) continue;
        const sl = vrSlope(x, z); if (sl < 0.6 && vrLC(x, z) !== 4) continue;
        const y = vrGround(x, z), g = scen.get(x, z), n = 2 + Math.floor(RV() * 3), b0 = vary(grey[Math.floor(RV() * grey.length)], RV, 0.06);
        for (let q = 0; q < n; q++) { const r0 = 1.5 + RV() * 3.2, qx = x + (RV() - 0.5) * 8, qz = z + (RV() - 0.5) * 8, qy = vrGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 1) continue;
          rock(g, qx, qy + r0 * 0.35, qz, r0 * 1.2, r0 * (0.6 + RV() * 0.6), r0 * (0.8 + RV() * 0.4), RV() * TAU, vary(b0, RV, 0.06), RV, 0.3, 0.4); }
      }
    }

    /* ---- the view beyond the corridor: the ranges and valleys of the Victorian Alps, Mount Feathertop (irFar; World.update moves it with the camera) ---- */
    const FAR = API.irFar(hoFarCol); if (FAR) { FAR.mesh.visible = false; root.add(FAR.mesh); out.dyn.irFar = FAR; }   // (hidden until the first World.update: a view of the world without a camera, the menu's model, would draw it)

    /* ---- finish the meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    fac.addTo(sceneryGroup, ouCutMat(new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true }), cut), true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: hoAtlas(cpAlt, String(Math.round(T.altAt(T.hy[hiI]))) + ' m', String(Math.round(T.altAt(T.hy[T.finishIdx]))) + ' m'), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: hoAtlas2(), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    crowdFinish(CR, root, out);
    out.stats = { trees: nTrees, plants: nPlants, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, rails: +(nRail / (2 * N)).toFixed(3), poles: nPole + out.propStats.posts, lifts: nLift, pulls: pulls.length, sideRoads: out.stubStats.n, far: FAR ? FAR.P0.length / 3 : 0 };   // (read by the tests)
    return out;
  }

  World.ext.hotham = (scene, tex, opts) => buildHotham(scene, tex, opts);
})();
