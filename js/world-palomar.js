/* =========================================================================
   WORLD — Palomar Mountain (theme 'palomar'): its own builder (World.ext.palomar), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, TAU, VRC, VRT, atSf, box, caGCol, caGround, caSlope, caTileGeo, caTileOn, clamp, cone, crowdCtx, crowdFinish, crowdPut,
    crowdRun, cyl, gable, ico, lerp, ouCutMat, pkGroundMat, propFloorTable, rng, roadsideProps, rock, rpHash, sstep, starCone, stubExcl, stubGeo,
    stubProps, stubVerge, tuftWindMat, valueNoise2, vary, vrDist, vrFar, vrGritTex, vrHouse, vrLC, vrLCf, vrNear, vrPrep, vrStubAt, vrStubs
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ================= PALOMAR MOUNTAIN (theme 'palomar') =================
     Palomar Mountain (San Diego County, California): the South Grade Road (S6) up the mountain's south face from Pauma Valley, its ladder of
     thirteen hairpins, on a clear, hot summer afternoon. The vegetation follows the height as on the real mountain: golden grass and dense dark
     chaparral (chamise, scrub oak) on the low slopes, coast live oaks in the hollows, chaparral yuccas on the sunny banks, sycamores along the dry
     creek beds (def.creeks: the washes traced down the terrain model); higher up (from ~1100 m) California black oaks (golden in autumn), Coulter
     pines and incense cedars, the oak and pine woods of the summit plateau. Granite in boulders and outcrops, the decomposed granite of the banks;
     dry-stone and masonry retaining walls where the road is cut into the slope or held above it, galvanised guardrails on timber posts, yellow
     hairpin signs with the advisory speed, chevrons, mileposts, the turnout (def.turnout), the side roads (Track.stubs: stubGeo, stubProps),
     the houses at the foot (def.bld) and two water tanks (def.tanks). Built on Vršič's corridor (vrPrep) and Los Caracoles' terrain blend (caH,
     caGround, its tiles coloured by plCol through VR.col). Painted for the season (PLS): summer, or the autumn look (golden black oaks, straw grass),
     which winter's season code snows over. Every board and sign generic; no names but the places'. */
  let PLS = 'summer';
  const PLCOL = [0, 0, 0];
  let PLCK = null;   // the dry creek beds' points in a 32 m hash (plCreekD)
  function plCreekD(x, z) {
    if (!PLCK) return 1e9; let d = 1e9; const a0 = Math.floor(x / 32), b0 = Math.floor(z / 32);
    for (let a = a0 - 1; a <= a0 + 1; a++) for (let b = b0 - 1; b <= b0 + 1; b++) { const L = PLCK.get(a * 65536 + b); if (!L) continue; for (let k = 0; k < L.length; k += 2) { const dx = x - L[k], dz = z - L[k + 1], q = dx * dx + dz * dz; if (q < d) d = q; } }
    return Math.sqrt(d);
  }
  function plCol(x, z, h, ny, sz, dd) {   // ground colour (times the grey grit map): golden summer grass (lc 0), the dark floor of the chaparral (lc 1), the woods'
    // floor (lc 2: dark olive under the oaks and the tall chaparral low down, needles and oak leaves higher up), dusty yards (lc 3), granite (lc 4 and every
    // steep face: grey with a warm tint and dark lichen), the pale sand and cobbles of the dry creek beds, a verge of decomposed granite
    const P = API.VR, A = h + P.D.base, m = P.c1(x, z), q = P.c2(x, z), f = P.n4(x, z), up = sstep(1080, 1330, A), au = PLS !== 'summer';
    const ch = vrLCf(x, z, 1), wd = vrLCf(x, z, 2), se = vrLCf(x, z, 3), rk = vrLCf(x, z, 4);
    let R = au ? 0.7 : 0.72, G = au ? 0.63 : 0.62, B = au ? 0.46 : 0.42;   // the dry grass (autumn: greyer straw)
    R = lerp(R, 0.7, sstep(0.55, 0.85, m) * 0.6); G = lerp(G, 0.64, sstep(0.55, 0.85, m) * 0.6);
    R = lerp(R, 0.6, sstep(0.6, 0.86, q) * 0.5); G = lerp(G, 0.55, sstep(0.6, 0.86, q) * 0.5); B = lerp(B, 0.36, sstep(0.6, 0.86, q) * 0.5);
    // the chaparral and the woods seen from above: a mottled blanket of dark olive crowns (the shrubs themselves stand on it), grey-green where the
    // sage and the manzanita grow, the gaps between them brown
    const mot = P.n2(x * 1.6, z * 1.6), gap = sstep(0.68, 0.86, P.c5(x * 1.3, z * 1.3)), sage = sstep(0.6, 0.8, P.c3(x * 2.2, z * 2.2)) * (1 - up);
    const cr = lerp(0.26, 0.33, mot), cg = lerp(0.28, 0.33, mot), cb = lerp(0.17, 0.2, mot);
    const ar = lerp(lerp(cr, 0.4, sage * 0.6), 0.45, gap * 0.7), ag = lerp(lerp(cg, 0.42, sage * 0.6), 0.39, gap * 0.7), ab = lerp(lerp(cb, 0.33, sage * 0.6), 0.26, gap * 0.7);
    R = lerp(R, ar, ch * 0.92); G = lerp(G, ag, ch * 0.92); B = lerp(B, ab, ch * 0.92);
    const lit = sstep(0.45, 0.8, P.c5(x, z)), wr = lerp(cr * 0.95, lerp(0.3, au ? 0.46 : 0.4, lit), up), wg = lerp(cg * 0.98, lerp(0.29, au ? 0.33 : 0.31, lit), up), wb = lerp(cb, lerp(0.18, 0.2, lit), up);   // (higher up: the shade of the oaks and pines, brown needles and leaves in the gaps)
    R = lerp(R, lerp(wr, 0.42, gap * 0.4 * (1 - up)), wd * 0.92); G = lerp(G, lerp(wg, 0.37, gap * 0.4 * (1 - up)), wd * 0.92); B = lerp(B, lerp(wb, 0.25, gap * 0.4 * (1 - up)), wd * 0.92);
    R = lerp(R, 0.68, se * 0.6); G = lerp(G, 0.62, se * 0.6); B = lerp(B, 0.52, se * 0.6);
    R += (f - 0.5) * 0.08; G += (f - 0.5) * 0.07; B += (f - 0.5) * 0.05;
    const st = Math.max(sstep(0.8, 0.55, ny), rk * 0.85);
    if (st > 0) { const bl = sstep(0.45, 0.78, P.c4(x * 1.5, z * 1.5)), li = sstep(0.62, 0.85, P.c5(x * 2, z * 2)) * 0.5;
      R = lerp(R, lerp(0.74, 0.64, bl) - li * 0.2, st); G = lerp(G, lerp(0.7, 0.62, bl) - li * 0.18, st); B = lerp(B, lerp(0.62, 0.58, bl) - li * 0.16, st); }
    const cd = plCreekD(x, z); if (cd < 6) { const t = sstep(6, 1.5, cd) * 0.75 * (1 - st * 0.5); R = lerp(R, 0.78, t); G = lerp(G, 0.73, t); B = lerp(B, 0.62, t); }
    if (dd < 4) { const t = sstep(4, 0.5, dd) * 0.45 * sstep(T.w + 8, T.w + 2.5, vrDist(x, z)); R = lerp(R, 0.68, t); G = lerp(G, 0.63, t); B = lerp(B, 0.54, t); }   // (not inside a hairpin, where the barrier stands far off)
    PLCOL[0] = R; PLCOL[1] = G; PLCOL[2] = B; return PLCOL;
  }
  let plATex = null, plAKey = '', plA2Tex = null;   // (the board atlases, made once and reused by every build of the road)
  function plAtlas(cps, finA) {   // text boards (8 rows of 1024 x 128): START, FINISH, CP1-CP4 with the altitude, the summit board, the race's banner
    const key = cps.join('|') + '|' + finA; if (plATex && plAKey === key) return plATex;
    if (plATex) plATex.dispose(); plAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 100, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(262, 142, 500, 100); txt('FINISH', 512, 196, 92, '#111', 470);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#2f5a3a'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffe08a', 520); });
    x.fillStyle = '#6b4a2a'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#f2ead8'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);   // (a brown place board)
    txt('PALOMAR MOUNTAIN', 512, 814, 60, '#f2ead8', 900); txt(finA, 512, 864, 44, '#f2ead8', 900);
    x.fillStyle = '#efe6cf'; x.fillRect(0, 896, 1024, 128); x.fillStyle = '#2f5a3a'; x.fillRect(0, 896, 1024, 10); x.fillRect(0, 1014, 1024, 10);
    txt('PALOMAR MOUNTAIN', 512, 934, 58, '#2a2418', 980); txt('SOUTH GRADE · SAN DIEGO COUNTY', 512, 990, 38, '#2f5a3a', 900);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (plATex = t);
  }
  // the boards of the second atlas (rows 2-7, two a row, 512 x 128): [text, background]
  const PL_BOARDS = [['PAUMA VALLEY', '#6b4a2a'], ['TRUCKS OVER 30 FT NOT ADVISED', '#f4f4f0'], ['SLOWER TRAFFIC USE TURNOUTS', '#f4f4f0'], ['TURNOUT', '#f4f4f0'],
    ['WATCH FOR BICYCLISTS', '#f1c21b'], ['MOTORCYCLISTS USE CAUTION', '#f1c21b'], ['ELEV 3000 FT', '#f4f4f0'], ['ELEV 4000 FT', '#f4f4f0'],
    ['OBSERVATORY ↑', '#6b4a2a'], ['PALOMAR MOUNTAIN', '#6b4a2a'], ['SPEED LIMIT 35', '#f4f4f0'], ['NEXT 7 MILES', '#f1c21b']];
  function plAtlas2() {   // the small signs: row 0 (128 x 128): the hairpin warnings (left, right), the curve warnings (left, right), the chevrons (right, left), the
    // advisory speed (15 MPH), the bike warning; row 1: the mileposts 1-6 (a green paddle, the mile in white); rows 2-7 the boards (PL_BOARDS)
    if (plA2Tex) return plA2Tex;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 470); };
    const diamond = (x0, y0) => { x.save(); x.translate(x0 + 64, y0 + 64); x.rotate(Math.PI / 4); x.fillStyle = '#16181c'; x.fillRect(-44, -44, 88, 88); x.fillStyle = '#f1c21b'; x.fillRect(-40, -40, 80, 80); x.restore(); };
    for (let k = 0; k < 8; k++) { const x0 = k * 128, y0 = 0; x.strokeStyle = '#16181c'; x.fillStyle = '#16181c'; x.lineCap = 'butt';
      if (k < 2) {   // the hairpin: the arrow up, round and back down (left or right)
        diamond(x0, y0); const dir = k ? 1 : -1; x.lineWidth = 9; x.beginPath(); x.moveTo(x0 + 64 - 13 * dir, y0 + 98); x.lineTo(x0 + 64 - 13 * dir, y0 + 56);
        x.arc(x0 + 64, y0 + 56, 13, Math.PI, 0, dir < 0); x.lineTo(x0 + 64 + 13 * dir, y0 + 74); x.stroke();
        x.beginPath(); x.moveTo(x0 + 64 + 13 * dir - 11, y0 + 72); x.lineTo(x0 + 64 + 13 * dir + 11, y0 + 72); x.lineTo(x0 + 64 + 13 * dir, y0 + 90); x.closePath(); x.fill();
      } else if (k < 4) {   // a bend (left or right)
        diamond(x0, y0); const dir = k === 3 ? 1 : -1; x.lineWidth = 9; x.beginPath(); x.moveTo(x0 + 64, y0 + 98); x.lineTo(x0 + 64, y0 + 66); x.quadraticCurveTo(x0 + 64, y0 + 46, x0 + 64 + 22 * dir, y0 + 40); x.stroke();
        x.beginPath(); x.moveTo(x0 + 64 + 34 * dir, y0 + 38); x.lineTo(x0 + 64 + 16 * dir, y0 + 26); x.lineTo(x0 + 64 + 16 * dir, y0 + 52); x.fill();
      } else if (k < 6) {   // the chevrons: black on yellow, pointing the way the road turns
        const dir = k === 4 ? 1 : -1; x.fillStyle = '#f1c21b'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#16181c';
        x.beginPath(); const cx = x0 + 64; x.moveTo(cx - 20 * dir, y0 + 18); x.lineTo(cx + 22 * dir, y0 + 64); x.lineTo(cx - 20 * dir, y0 + 110); x.lineTo(cx - 44 * dir, y0 + 110); x.lineTo(cx - 2 * dir, y0 + 64); x.lineTo(cx - 44 * dir, y0 + 18); x.closePath(); x.fill();
      } else if (k === 6) {   // the advisory speed plate
        x.fillStyle = '#16181c'; x.fillRect(x0 + 6, y0 + 6, 116, 116); x.fillStyle = '#f1c21b'; x.fillRect(x0 + 10, y0 + 10, 108, 108); txt('15', x0 + 64, y0 + 52, 60, '#16181c', 100); txt('MPH', x0 + 64, y0 + 98, 28, '#16181c', 100);
      } else {   // a bicycle on a yellow diamond
        diamond(x0, y0); x.lineWidth = 6; for (const u of [-18, 18]) { x.beginPath(); x.arc(x0 + 64 + u, y0 + 74, 13, 0, TAU); x.stroke(); }
        x.beginPath(); x.moveTo(x0 + 46, y0 + 74); x.lineTo(x0 + 58, y0 + 54); x.lineTo(x0 + 76, y0 + 54); x.lineTo(x0 + 82, y0 + 74); x.moveTo(x0 + 58, y0 + 54); x.lineTo(x0 + 66, y0 + 74); x.lineTo(x0 + 76, y0 + 54); x.stroke(); } }
    for (let k = 0; k < 6; k++) { const x0 = k * 128, y0 = 128; x.fillStyle = '#1d6b3c'; x.fillRect(x0 + 24, y0, 80, 128); x.strokeStyle = '#f2f2ee'; x.lineWidth = 5; x.strokeRect(x0 + 29, y0 + 5, 70, 118);
      txt(String(k + 1), x0 + 64, y0 + 66, 64, '#f2f2ee', 70); }
    PL_BOARDS.forEach(([n, bg], k) => { const x0 = (k % 2) * 512, y0 = 256 + Math.floor(k / 2) * 128, light = bg === '#f4f4f0' || bg === '#f1c21b';
      x.fillStyle = bg; x.fillRect(x0, y0, 512, 128); x.strokeStyle = light ? '#16181c' : '#f2f2ee'; x.lineWidth = 6; x.strokeRect(x0 + 8, y0 + 8, 496, 112);
      txt(n, x0 + 256, y0 + 66, n.length > 22 ? 34 : n.length > 16 ? 42 : 54, light ? '#16181c' : '#f2f2ee', 470); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (plA2Tex = t);
  }
  function plTreeGeo(kind) {   // unit trees (height 1; the instances scale and tint them): 0 a California black oak (a dark trunk, an open, rounded crown of clumps:
    // fresh green in summer, gold and orange in autumn), 1 a Coulter or ponderosa pine (a tall bare trunk, an open crown of dark blue-green needle tufts
    // high up), 2 an incense cedar (a reddish, flared trunk, a dense narrow cone of warm green sprays)
    const g = new GB(), R = rng(870 + kind), rs = API.ROCK_SMOOTH, au = PLS !== 'summer';
    if (kind === 0) {
      cyl(g, 0, -0.02, 0, 0.05, 0.4, 5, [0.2, 0.18, 0.16], null, 0.035);
      cyl(g, 0.05, 0.36, 0.02, 0.032, 0.24, 4, [0.22, 0.19, 0.17], null, 0.02); cyl(g, -0.05, 0.36, -0.03, 0.03, 0.22, 4, [0.22, 0.19, 0.17], null, 0.02);
      API.ROCK_SMOOTH = true; const col = au ? [0.7, 0.52, 0.17] : [0.2, 0.31, 0.12];
      ico(g, 0, 0.7, 0, 0.32, 0.72, col, R, 0.3);
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + R() * 0.6, d = 0.26 + R() * 0.1; ico(g, Math.cos(a) * d, 0.58 + R() * 0.16, Math.sin(a) * d, 0.2 + R() * 0.07, 0.8, vary(au && k % 2 ? [0.72, 0.4, 0.14] : col, R, 0.25), R, 0.3); }
    } else if (kind === 1) {
      cyl(g, 0, -0.02, 0, 0.022, 0.84, 4, [0.42, 0.28, 0.2], null, 0.012);
      API.ROCK_SMOOTH = true; const col = [0.15, 0.24, 0.14];
      for (let k = 0; k < 4; k++) { const y = 0.47 + k * 0.12, r = 0.16 - k * 0.03, n = k < 3 ? 2 : 1, a0 = R() * TAU;   // (four tiers of needle tufts, the top one alone)
        for (let q = 0; q < n; q++) { const a = a0 + q / n * TAU, d = n > 1 ? r * (0.75 + R() * 0.35) : 0; ico(g, Math.cos(a) * d, y, Math.sin(a) * d, 0.12 + R() * 0.04 - k * 0.012, 0.66, vary(col, R, 0.25), R, 0.35); } }
    } else if (kind === 3) {   // a chaparral shrub (chamise, scrub oak): a tight, dark grey-olive mound of two lumps (light: thousands of them)
      API.ROCK_SMOOTH = true; const col = [0.27, 0.3, 0.17];
      ico(g, 0, 0.46, 0, 0.5, 0.9, col, R, 0.32); ico(g, 0.34, 0.3, 0.12, 0.3, 0.95, vary(col, R, 0.25), R, 0.35);
    } else if (kind === 4) {   // a granite stone
      API.ROCK_SMOOTH = false; rock(g, 0, 0.04, 0, 0.17, 0.12, 0.15, R() * TAU, [0.68, 0.66, 0.6], R, 0.3);
    } else if (kind === 5) {   // a coast live oak, light (Mulholland Highway's in fewer clumps): a short trunk splitting low, a broad, low, dark dome
      cyl(g, 0, -0.02, 0, 0.06, 0.32, 4, [0.25, 0.22, 0.19], null, 0.045);
      API.ROCK_SMOOTH = true; const col = [0.17, 0.25, 0.1];
      ico(g, 0, 0.62, 0, 0.46, 0.62, col, R, 0.25);
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + R() * 0.5, d = 0.38 + R() * 0.1; ico(g, Math.cos(a) * d, 0.5 + R() * 0.12, Math.sin(a) * d, 0.27 + R() * 0.08, 0.72, vary(col, R, 0.3), R, 0.3); }
    } else {
      cyl(g, 0, -0.02, 0, 0.03, 0.3, 5, [0.5, 0.28, 0.17], null, 0.018);
      const col = [0.19, 0.31, 0.13], tip = [0.29, 0.42, 0.18];
      [[0.06, 0.2, 0.34], [0.3, 0.16, 0.3], [0.52, 0.12, 0.26], [0.7, 0.08, 0.22]].forEach(([y, r, h], k) => starCone(g, 0, y, 0, r, h, 6, k % 2 ? [col[0] * 1.08, col[1] * 1.08, col[2] * 1.08] : col, tip, k * 0.5, 0.02));
      cone(g, 0, 0.86, 0, 0.04, 0.14, 4, col, tip, 0.3);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // the knockable roadside posts: white with a black top (as Mulholland Highway's)
  function plProps(out, spots, prof) {
    out.propR = 150;
    out.propFloor = propFloorTable(null, prof);
    const sA = T.startS + 30, sB = T.finishS - 30;
    return out.propStats = roadsideProps(out.props, { spots, postEdge: [1.2, 1.6], postCol: () => 0, exits: 0, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
      floor: out.propFloor, skip: (i) => { const s = i * T.ds; return s < sA || s > sB; } });
  }
  function buildPalomar(scene, tex, opts) {
    const R = rng(3711), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    PLS = opts.season === 'autumn' || opts.season === 'winter' ? 'autumn' : 'summer';   // (as Vršič: the autumn colours; winter snows them over)
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: caGround, camFloor: caGround, props: [], farClip: true, ownTex: [], dust: [0.78, 0.7, 0.56], season: PLS, paintFor: (s) => (s === 'autumn' || s === 'winter' ? 'autumn' : 'summer') };
    vrPrep(); vrStubs();
    const P = API.VR, iE = N - 1, sStart = T.startS, sFin = T.finishS, base = P.D.base;
    P.c1 = valueNoise2(741, 140); P.c2 = valueNoise2(742, 70); P.c3 = valueNoise2(743, 190); P.c4 = valueNoise2(744, 90); P.c5 = valueNoise2(745, 24);
    P.fin = [T.px[T.finishIdx], T.pz[T.finishIdx]]; P.col = plCol;   // (caTileGeo, caGCol: this road's colours)
    PLCK = new Map();   // the dry creek beds (def.creeks): their points every ~4 m in a 32 m hash
    for (const c of def.creeks || []) for (let k = 0; k + 3 < c.length; k += 2) { const L = Math.hypot(c[k + 2] - c[k], c[k + 3] - c[k + 1]), n = Math.max(1, Math.ceil(L / 4));
      for (let q = 0; q < n; q++) { const x = lerp(c[k], c[k + 2], q / n), z = lerp(c[k + 1], c[k + 3], q / n), key = Math.floor(x / 32) * 65536 + Math.floor(z / 32); let A = PLCK.get(key); if (!A) PLCK.set(key, A = []); A.push(x, z); } }
    const altAt = (i) => T.hy[i] + base;
    // the buildings (def.bld [x, z, length, width, angle, height, kind]: 0 a house, 3 a shed): clear of the road and the side roads; big blocks cut down
    const blds = [];
    for (const b of def.bld || []) {
      let [x, z, L, W, ang, hgt, kind] = b; L = Math.min(L, 36); W = Math.min(W, 20);
      if (L < 2.5 || W < 2.5) continue;
      const c = Math.cos(ang), s = Math.sin(ang), clear = () => { for (const [u, v] of [[0, 0], [-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]]) { const px = x + c * u - s * v, pz = z + s * u + c * v, n = vrNear(px, pz);
        if ((n.i >= 0 && n.dd < 1.5) || vrStubAt(px, pz, 0.8)) return false; } return true; };
      if (clear()) blds.push({ x, z, L, W, ang, hgt, kind });
    }
    // the turnout (def.turnout [metres after the start line, x, z, side]: OpenStreetMap's car park beside the road): a level gravel plot at the road's height,
    // reached through the barrier moved out along it (def.wide); the car park past the finish
    const tq = def.turnout, ti = tq ? T.idx(sStart + tq[0]) : -1, padT = tq ? { x: tq[1], z: tq[2], r: 12, b: 12, h: T.hy[ti] - 0.22, i: ti, sd: tq[3] } : null; if (padT) P.pads.push(padT);
    const padBeside = (s, r) => { const i = T.idx(s), gd = (sd) => Math.abs(vrFar(T.px[i] + T.nx[i] * sd * r, T.pz[i] + T.nz[i] * sd * r) - T.hy[i]), sd = gd(1) < gd(-1) ? 1 : -1, o = (sd > 0 ? T.br[i] : T.bl[i]) + r + 1;
      return { x: T.px[i] + T.nx[i] * sd * o, z: T.pz[i] + T.nz[i] * sd * o, r, b: 16, h: T.hy[i] - 0.25, sd, i }; };
    const padF = padBeside(sFin + 60, 13); P.pads.push(padF);
    const pull = new Uint8Array(N);   // (the samples along the turnout: no rail, the gravel apron)
    for (const [a, b] of def.wide || []) for (let s = a - 4; s <= b + 4; s += T.ds / 2) pull[T.idx(sStart + s)] = 1;
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the trees, houses and boulders between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (buildings, crowds, plots) for the plants and the boulders, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    for (const b of blds) exclPush(b.x, b.z, Math.hypot(b.L, b.W) / 2 + 2.5);
    for (const [x, z, r] of def.tanks || []) exclPush(x, z, Math.max(r, 3) + 3);
    exclPush(padF.x, padF.z, padF.r + 4); if (padT) exclPush(padT.x, padT.z, padT.r + 3);
    stubExcl(exclPush);   // (nothing grows or stands on the side roads)
    out.marks = {};   // (where the landmarks stand: the tests look for them)
    if (padT) out.marks.turnout = [padT.x, padT.z];

    /* ---- terrain tiles ---- */
    let nFar = 0;
    const tMat = pkGroundMat(), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti2 = 0; ti2 < G.ntx; ti2++) {
        const on = caTileOn(ti2, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti2] = 1; else nFar++;
        const m = new THREE.Mesh(caTileGeo(ti2, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
    }

    /* ---- the road: asphalt with white edge lines and a double yellow centre line (no passing on the grade), a shoulder of decomposed granite, then the verge
       out to a ditch past the barrier line, up or down onto the ground; where the ground falls away below the barrier a masonry wall holds the road (its top
       flush with the verge); at a side road's mouth the verge at its surface; along the turnout a gravel apron (120 m chunks) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.04, shininess: 5, specular: 0x14110d, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const sw = 0.6, tarCh = new Chunks(110), roadCh = new Chunks(120, true), lineCh = new Chunks(120), shCh = new Chunks(120, true);   // (the road's ribbons by place, the side roads' in them; tarCh: the tar snakes, drawn with the scenery's chunks: no draw calls of their own)
    const SB = stubGeo({ gCol: caGCol, paveC: [0.8, 0.8, 0.8], gravC: [0.7, 0.66, 0.58], shC: [0.68, 0.64, 0.56], line: 'solid' });   // the side roads: the street at the foot, the driveways, the tracks (their surfaces in the road's chunks)
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w;
      const ms = stubVerge(SB, i, side, e + sw, bar); if (ms) return ms;   // (a side road's mouth: no ditch, the verge at its surface)
      const y = T.hy[i], gAt = (o) => { const q = side * o; return caGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      if (pull[i] && side === (padT ? padT.sd : 0)) return [[e + sw, -0.02], [bar - 0.7, -0.08], [bar + 0.45, Math.max(-0.2, gAt(bar + 0.45) + 0.03)], [bar + 1.15, gAt(bar + 1.15) + 0.03], [bar + 1.9, gAt(bar + 1.9) + 0.03]];   // (the turnout: level, no ditch)
      if (gAt(bar + 0.45) < -2.6) return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, gAt(bar + 0.42) - 0.08], [bar + 1.15, gAt(bar + 1.15) + 0.03], [bar + 1.9, gAt(bar + 1.9) + 0.03]];   // (a retaining wall: its top flush with the verge)
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    {
      const offs = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8;
      const shade = (i, o) => { const rl = T.rl[i]; let k = 0.82 - 0.12 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.88) k += 0.03; return [k, k * 0.99, k * 0.97]; };   // (sun-bleached grey, the wheel tracks darker)
      const wht = [0.95, 0.95, 0.92], ylw = [0.96, 0.76, 0.16], gc = [0.64, 0.63, 0.6], grav = [0.7, 0.67, 0.61];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          const wl = vp[si][i][2][1] < -2.6 && !SB.mouthV[si][i]; if (wl && (k === 1 || k === 2)) { const q = 0.9 + 0.14 * rpHash(i >> 1, 47 + si); return k === 1 ? [0.68 * q, 0.66 * q, 0.62 * q] : [0.52 * q, 0.5 * q, 0.46 * q]; }   // (the wall's granite coping, its face)
          if (pull[i] && padT && side === padT.sd && k <= 2) { const q = 0.94 + 0.1 * rpHash(i, 61); return [grav[0] * q, grav[1] * q, grav[2] * q]; }   // (the turnout's gravel apron)
          if (k === 4) return caGCol(x, z);
          const sl = k === 2 ? caSlope(x, z) : 0, l = Math.sqrt(1 + sl * sl); return plCol(x, z, T.hy[i] + y, 1 / l, 0, Math.max(0, o - bar)).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, s0 = i * T.ds / 6, s1 = j * T.ds / 6, gr = roadCh.get(T.px[i], T.pz[i]), gl = lineCh.get(T.px[i], T.pz[i]), gs = shCh.get(T.px[i], T.pz[i]);
          for (let c = 0; c < offs.length - 1; c++) { const o0 = offs[c], o1 = offs[c + 1];
            gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shade(i, o0), shade(i, o1), shade(j, o1), shade(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
          for (const [o0, o1] of SB.edges(i, j, [[-(w - 0.3), -(w - 0.45)], [w - 0.45, w - 0.3]])) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [wht, wht, wht, wht]);
          for (const [o0, o1] of [[-0.21, -0.09], [0.09, 0.21]]) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [ylw, ylw, ylw, ylw]);
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j];
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [gc, gc, gc, gc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              if (k === 1 && (qi[2][1] < -2.6 || qj[2][1] < -2.6) && !(SB.mouthV[si][i] || SB.mouthV[si][j])) gv.quadO(a, b, c, d, null, Pt(i, 0, Math.min(qi[2][1], qj[2][1]) * 0.5), [wuv(a), wuv(b), wuv(c), wuv(d)], [ci[k], ci[k + 1], cj[k + 1], cj[k]]);   // (the wall's face: out, towards the slope below)
              else gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
        }
        SB.emit(c0, c0 + 60, roadCh.get(T.px[c0], T.pz[c0]), shCh.get(T.px[c0], T.pz[c0]), lineCh.get(T.px[c0], T.pz[c0]));   // (the side roads whose junctions are in this chunk)
        addM(gv, gMat);
      }
      // the tar snakes: cracks in the old asphalt sealed with black tar, wandering along the lanes and across them (as Mulholland Highway's)
      { const RS = rng(3791), ts = tarCh, tc = [0.075, 0.075, 0.085], P2 = (s, o) => { const f = clamp(s / T.ds, 0, N - 1.001), i = Math.floor(f), u = f - i, j = i + 1;
          return [lerp(T.px[i] + T.nx[i] * o, T.px[j] + T.nx[j] * o, u), lerp(T.hy[i], T.hy[j], u) + 0.031, lerp(T.pz[i] + T.nz[i] * o, T.pz[j] + T.nz[j] * o, u)]; };
        for (let s = sStart - 40; s < sFin + 40; s += 11) { if (RS() > 0.55) continue;
          const across = RS() < 0.3, L = across ? 2 * w * (0.4 + RS() * 0.55) : 4 + RS() * 10, n = Math.ceil(L / 0.6), ph = RS() * 6, amp = 0.15 + RS() * 0.35;
          const a = s + RS() * 8, o = across ? -w + 0.3 + RS() * (2 * w - L) * 0.9 : (RS() - 0.5) * 2 * (w - 0.8); const pts = [];
          for (let k = 0; k <= n; k++) { const t = k / n * L, wig = Math.sin(t * 1.7 + ph) * amp + Math.sin(t * 4.3 + ph * 2) * amp * 0.35;
            pts.push(across ? P2(a + wig, clamp(o + t, -w + 0.2, w - 0.2)) : P2(a + t, clamp(o + wig, -w + 0.2, w - 0.2))); }
          const g = ts.get(pts[0][0], pts[0][2]);
          for (let k = 0; k < n; k++) { const A = pts[k], B = pts[k + 1], dx = B[0] - A[0], dz = B[2] - A[2], l = Math.hypot(dx, dz) || 1, hx = -dz / l * 0.07, hz = dx / l * 0.07;
            g.quadUp([A[0] - hx, A[1], A[2] - hz], [A[0] + hx, A[1], A[2] + hz], [B[0] + hx, B[1], B[2] + hz], [B[0] - hx, B[1], B[2] - hz], [tc, tc, tc, tc]); } }
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
    const scen = tarCh, fac = new Chunks(110, true), ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];   // (fac: the walls with windows; ban: the race's boards, ban2: the signs)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.84, 0.14, 0.14], [0.95, 0.95, 0.95], [0.14, 0.24, 0.6], [0.12, 0.13, 0.16], [0.96, 0.78, 0.18], [0.2, 0.5, 0.62], [0.95, 0.5, 0.14], [0.5, 0.32, 0.22], [0.3, 0.55, 0.3], [0.82, 0.82, 0.84]];
    const CR = crowdCtx({ gH: caGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: () => false, shirts: fans }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1; tilt leans its top towards +t
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const board = (k) => { const v1 = 1 - (2 + Math.floor(k / 2)) / 8; return [v1 - 1 / 8, v1, (k % 2) * 0.5, (k % 2) * 0.5 + 0.5]; };   // a board of the second atlas: [v0, v1, u0, u1]
    const sign = (s, side, k, H, face) => {   // a board on two steel posts beside the road, facing the cars coming up (face -1: down the road)
      const [bx, bz, bi] = onSide(s, side, 1.4); if (excluded(bx, bz) || vrStubAt(bx, bz, 1)) return;
      const by = caGround(bx, bz), [v0, v1, u0, u1] = board(k), gb = scen.get(bx, bz), f = face || 1;
      for (const o of [-1.2, 1.2]) box(gb, bx + T.nx[bi] * o, by - 0.2, bz + T.nz[bi] * o, 0.1, (H || 1.6) + 0.95, 0.1, T.hd[bi], [0.6, 0.61, 0.63]);
      bannerQ(bx, by + (H || 1.6), bz, -T.tx[bi] * f, -T.tz[bi] * f, 3.2, 0.8, v0, v1, u0, u1, ban2); exclPush(bx, bz, 2); CR.avoid(bx, bz, 1.6); };
    const small = (s, side, cell, rowK, W, Hh, H) => {   // a small sign on one post (atlas 2, rows 0-1: 128 px cells), facing the cars coming up
      const [px, pz, ii] = onSide(s, side, 0.9); if (excluded(px, pz) || vrStubAt(px, pz, 1)) return null;
      const py = caGround(px, pz), g = scen.get(px, pz), v1 = 1 - rowK / 8;
      box(g, px, py - 0.2, pz, 0.08, H + Hh + 0.2, 0.08, T.hd[ii], [0.6, 0.61, 0.63]);
      bannerQ(px, py + H, pz, -T.tx[ii], -T.tz[ii], W, Hh, v1 - 1 / 8, v1, cell / 8, (cell + 1) / 8, ban2); exclPush(px, pz, 1.5); CR.avoid(px, pz, 0.8); return [px, py, pz, ii]; };
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road: two posts at the barriers, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = Math.min(T.bl[i], w + 3.4) + 0.9, L2 = Math.min(T.br[i], w + 3.4) + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 11.5, 1.45, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, col) => crowdPut(CR, x, caGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: col || fans[Math.floor(R() * fans.length)] }, 1);
    const flagUS = (g, x, y, z, rot, h) => {   // a pole with the stars and stripes (as Mulholland Highway's)
      cyl(g, x, y - 0.2, z, 0.06, h + 0.2, 5, [0.92, 0.92, 0.9], [0.85, 0.75, 0.3]);
      const c = Math.cos(rot), s = Math.sin(rot), fw = 1.9, fh = 1.0, y0 = y + h - fh - 0.15, at = (u) => [x + c * (u + 0.06), z + s * (u + 0.06)];
      for (let k = 0; k < 7; k++) { const [fx, fz] = at(fw / 2); box(g, fx, y0 + k * fh / 7, fz, fw, fh / 7, 0.04, rot, k % 2 ? [0.95, 0.95, 0.93] : [0.75, 0.12, 0.16]); }
      const [cx, cz] = at(fw * 0.2); box(g, cx, y0 + fh * 0.46, cz, fw * 0.4 + 0.004, fh * 0.54, 0.05, rot, [0.12, 0.17, 0.42]);
    };
    const car = (g, x, y, z, rot, col) => {   // a parked car
      const c = Math.cos(rot), s = Math.sin(rot);
      box(g, x, y + 0.25, z, 4.5, 0.8, 1.85, rot, col, null, true); box(g, x - c * 0.35, y + 1.05, z - s * 0.35, 2.4, 0.62, 1.62, rot, [0.16, 0.2, 0.26], col, true);
      for (const [a, b] of [[1.4, 0.8], [1.4, -0.8], [-1.4, 0.8], [-1.4, -0.8]]) box(g, x + c * a - s * b, y, z + s * a + c * b, 0.66, 0.66, 0.24, rot, [0.08, 0.08, 0.09], null, true);
    };
    const moto = (g, x, y, z, rot, col) => {   // a parked motorbike on its side stand
      const c = Math.cos(rot), s = Math.sin(rot);
      for (const a of [-0.7, 0.7]) cyl(g, x + c * a, y, z + s * a, 0.32, 0.12, 6, [0.08, 0.08, 0.09]);
      box(g, x, y + 0.45, z, 1.3, 0.35, 0.35, rot, col, null, true); box(g, x - c * 0.35, y + 0.75, z - s * 0.35, 0.6, 0.12, 0.3, rot, [0.1, 0.1, 0.11]); box(g, x + c * 0.55, y + 0.9, z + s * 0.55, 0.08, 0.08, 0.7, rot, [0.6, 0.6, 0.62]);
    };

    /* ---- the houses and the ranches at the foot of the grade: stucco walls with windows, red tile or grey shingle roofs; sheds and barns in wood or
       metal; the water tanks (def.tanks): round steel tanks, painted green-grey ---- */
    let nBld = 0;
    {
      const RB = rng(3721), walls = [[0.95, 0.92, 0.84], [0.92, 0.84, 0.7], [0.88, 0.86, 0.8], [0.84, 0.74, 0.6], [0.96, 0.95, 0.92]], roofs = [[0.62, 0.3, 0.2], [0.68, 0.36, 0.24], [0.36, 0.36, 0.38], [0.44, 0.4, 0.36]], woods = [[0.46, 0.32, 0.2], [0.52, 0.38, 0.24]];
      const lowHigh = (b) => { const c = Math.cos(b.ang), s = Math.sin(b.ang); let lo = 1e9, hi = -1e9; for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const y = caGround(b.x + c * u - s * v, b.z + s * u + c * v); lo = Math.min(lo, y); hi = Math.max(hi, y); } return [lo, hi]; };
      for (const b of blds) {
        const g = scen.get(b.x, b.z), [lo, hi] = lowHigh(b);
        if (b.kind === 3) {
          const mc = vary([[0.5, 0.36, 0.24], [0.66, 0.66, 0.64], [0.56, 0.3, 0.2]][Math.floor(RB() * 3)], RB, 0.12);
          box(g, b.x, lo - 0.3, b.z, b.L, hi - lo + 0.3 + 2.6, b.W, b.ang, mc, null, true); gable(g, b.x, hi + 2.3, b.z, b.L + 0.5, b.W + 0.5, Math.min(b.L, b.W) * 0.18, b.ang, vary([0.55, 0.55, 0.56], RB, 0.15), mc);
        } else vrHouse(g, fac.get(b.x, b.z), b.x, lo, hi, b.z, b.ang, b.L, b.W, b.L * b.W > 220 ? 2 : 1, { wall: walls[Math.floor(RB() * walls.length)], wood: vary(woods[Math.floor(RB() * 2)], RB, 0.1), roof: vary(roofs[Math.floor(RB() * roofs.length)], RB, 0.1) });
        CR.block(b.x, b.z, b.L + 1, b.W + 1, b.ang);
        nBld++;
      }
      for (const [x, z, r0] of def.tanks || []) { const r = Math.max(r0, 3.5), y = caGround(x, z), g = scen.get(x, z);   // (OpenStreetMap maps them small: drawn as the usual ~7 m tank)
        cyl(g, x, y - 0.5, z, r, 6.2, 12, [0.5, 0.56, 0.5], [0.58, 0.62, 0.58]); cone(g, x, y + 5.7, z, r + 0.15, 0.9, 12, [0.56, 0.6, 0.56], [0.6, 0.64, 0.6], 0);
        box(g, x + r * 0.7, y - 0.2, z + r * 0.7, 0.4, 6.3, 0.08, 0.8, [0.36, 0.38, 0.36]); nBld++; }
    }
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- START (at the foot of the grade): gantry with the start lights, the timing hut, flags along the grid, the road closed behind it ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i];
      box(scen.get(x, z), x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 5, -1, 3.2), hy = caGround(hx, hz), gh = scen.get(hx, hz);   // the timing hut
      box(gh, hx, hy, hz, 4.0, 2.7, 2.8, T.hd[i], [0.94, 0.9, 0.8], [0.5, 0.3, 0.2], true); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.3, 0.42], null, true); gable(gh, hx, hy + 2.7, hz, 4.4, 3.2, 1.0, T.hd[i], [0.62, 0.3, 0.2], [0.94, 0.9, 0.8]);
      exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]);
      for (let s = 8; s < sStart + 50; s += 12) for (const side of [-1, 1]) { const [px, pz, ii] = onSide(s, side, 1.3); if ((excluded(px, pz) && s > sStart - 8) || vrStubAt(px, pz, 1)) continue; flagUS(scen.get(px, pz), px, caGround(px, pz), pz, T.hd[ii], 6); }
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road: plastic water barriers across it, orange and white
      for (let o = -Math.min(T.bl[0], w + 3); o < Math.min(T.br[0], w + 3); o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.6, 0.9, 1.95, T.hd[0], (Math.round(o) & 2) ? [0.95, 0.95, 0.93] : [0.95, 0.45, 0.1]); }
      { const [bx, bz, bi] = onSide(sStart + 16, 1, 1.6), by = caGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the race's banner beside the road after the line
        for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        bannerQ(bx, by + 1.5, bz, -T.nx[bi], -T.nz[bi], 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); }
    }

    /* ---- the checkpoints: a forest-green gantry "CPn  altitude" ---- */
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.9, 0.88, 0.84], [0.18, 0.34, 0.22]));

    /* ---- FINISH (on the mountain): chequered gantry and flags, the brown board, the car park with cars and motorbikes, the road closed farther on ---- */
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      for (const side of [-1, 1]) for (let s = sFin - 28; s < sFin + 12; s += 7) { const [px, pz, ii] = onSide(s, side, 1.4); if (excluded(px, pz) || vrStubAt(px, pz, 1)) continue; const py = caGround(px, pz), gg = scen.get(px, pz);
        cyl(gg, px, py, pz, 0.06, 5, 5, [0.9, 0.9, 0.92]);
        for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) box(gg, px + T.tx[ii] * (0.36 + a * 0.55), py + 3.8 + b * 0.55, pz + T.tz[ii] * (0.36 + a * 0.55), 0.55, 0.55, 0.05, T.hd[ii], (a + b) % 2 ? [0.08, 0.08, 0.08] : [0.96, 0.96, 0.96], null, true); }
      const sdP = padF.sd, [sx, sz, si] = onSide(sFin + 22, -sdP, 1.6), sy = caGround(sx, sz), gs = scen.get(sx, sz);   // the brown board on two posts
      for (const o of [-2.6, 2.6]) box(gs, sx + T.nx[si] * o, sy - 0.2, sz + T.nz[si] * o, 0.16, 3.9, 0.16, T.hd[si], [0.6, 0.61, 0.63]);
      { const [v0, v1] = row(6); bannerQ(sx, sy + 2.3, sz, -T.tx[si], -T.tz[si], 6.4, 0.8, v0, v1); } exclPush(sx, sz, 4);
      const hh = T.hd[padF.i], c = Math.cos(hh), sn = Math.sin(hh), RT = rng(3741), cols = [[0.86, 0.86, 0.84], [0.12, 0.13, 0.15], [0.62, 0.12, 0.1], [0.24, 0.34, 0.56], [0.7, 0.7, 0.72], [0.92, 0.9, 0.86]];
      for (let k = 0; k < 10; k++) { const a = -12 + (k % 5) * 6, b = (k < 5 ? -4.5 : 4.5) * sdP, px = padF.x - sn * b + c * a, pz = padF.z + c * b + sn * a; if (vrNear(px, pz).dd < 1.5) continue;
        if (k % 3 === 1) for (const m of [-1.4, 0, 1.4]) moto(scen.get(px, pz), px + c * m, caGround(px + c * m, pz + sn * m), pz + sn * m, hh + PI / 2 + 0.3, vary(cols[Math.floor(RT() * cols.length)], RT, 0.2));
        else car(scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2, vary(cols[Math.floor(RT() * cols.length)], RT, 0.15)); }
      for (let k = 0; k < 16; k++) { const px = padF.x + (R() - 0.5) * 22, pz = padF.z + (R() - 0.5) * 22; if (vrNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); }
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;   // the end of the road: water barriers across it
      for (let o = -Math.min(T.bl[iE], w + 3); o <= Math.min(T.br[iE], w + 3); o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.6, 0.9, 1.95, T.hd[iE], (Math.round(o) & 2) ? [0.95, 0.95, 0.93] : [0.95, 0.45, 0.1]); }
    }

    /* ---- the turnout: a gravel plot with parked motorbikes and a car, riders looking out over the valley ---- */
    if (padT) { const hh = T.hd[padT.i], c = Math.cos(hh), sn = Math.sin(hh), RT = rng(3751);
      for (let k = 0; k < 5; k++) { const a = -8 + k * 4, px = padT.x + c * a, pz = padT.z + sn * a; if (vrNear(px, pz).dd < 1.2) continue;
        if (k % 2 === 0) moto(scen.get(px, pz), px, caGround(px, pz), pz, hh + PI / 2 + 0.25, vary([[0.12, 0.13, 0.15], [0.7, 0.1, 0.08], [0.85, 0.85, 0.82]][k % 3], RT, 0.3)); else car(scen.get(px, pz), px, caGround(px, pz), pz, hh, vary([0.8, 0.78, 0.74], RT, 0.3)); }
      for (let k = 0; k < 7; k++) { const px = padT.x + (R() - 0.5) * 14, pz = padT.z + (R() - 0.5) * 14; if (vrNear(px, pz).dd < 1) continue; person(px, pz, R() * TAU); } }

    /* ---- guardrails where the ground falls away and round the outside of the hairpins (galvanised W-beam on timber posts); dry-stone retaining walls of
       granite where the road is cut deep into the slope; a delineator post every ~50 m where there is neither (knockable where it fits); the side roads'
       mouths open ---- */
    let nRail = 0, nWall = 0;
    {
      const mkPosts = [], need = [new Uint8Array(N), new Uint8Array(N)], wall = [new Float32Array(N), new Float32Array(N)];
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 8); k <= Math.min(N - 1, c.i1 + 8); k++) need[sd][k] = 1; }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i], si = side > 0 ? 1 : 0, gA = (d) => { const o = side * (bar + d); return caGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) - T.hy[i]; };
        for (const d of [4, 8, 13, 19, 26]) if (gA(d) < -(d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[si][i] = 1; if (i + 1 < N) need[si][i + 1] = 1; break; }
        const rise = Math.max(gA(2.5), gA(5) - 1.2); if (rise > 2.6) { wall[si][i] = rise; if (i + 1 < N) wall[si][i + 1] = rise; } }
      const iS0 = T.idx(sStart + 40), iS1 = T.idx(sFin - 40), steel = [0.78, 0.8, 0.82], steelB = [0.56, 0.58, 0.6], postW = [0.4, 0.31, 0.22];
      for (const side of [-1, 1]) {
        const si = side > 0 ? 1 : 0, nd = need[si], wl = wall[si], bar = side > 0 ? T.br : T.bl, gp = T.gap ? T.gap[si] : null;
        for (let i = 0; i < N; i++) { if (i < iS0 || i > iS1) { nd[i] = 0; wl[i] = 0; } if (wl[i] > 0) nd[i] = 0; if (pull[i] && padT && side === padT.sd) { nd[i] = 0; wl[i] = 0; } }
        for (const a of [nd, wl]) {
          for (let i = 1, last = -1; i < N; i++) { if (a[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) a[k] = a[k] || a[last]; last = i; } }   // close short gaps
          for (let i = 0; i < N;) { if (!a[i]) { i++; continue; } let j = i; while (j < N && a[j]) j++; if (j - i < 8) for (let k = i; k < j; k++) a[k] = 0; i = j; }   // drop tiny bits
        }
        if (gp) for (let i = 0; i < N; i++) if (gp[i]) { nd[i] = 0; wl[i] = 0; }   // a side road's mouth: open
        { const sm = Float32Array.from(wl); for (let i = 0; i < N; i++) if (wl[i]) { let s = 0, n = 0; for (let k = -6; k <= 6; k++) { const v = wl[clamp(i + k, 0, N - 1)]; if (v) { s += v; n++; } } sm[i] = s / n; } wl.set(sm); }   // (the wall's height eased along it)
        nRail += nd.reduce((a, b) => a + b, 0); nWall += wl.reduce((a, b) => a + (b > 0 ? 1 : 0), 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          const g = scen.get(T.px[i], T.pz[i]);
          if (wl[i] > 0 && wl[i + 1] > 0) {   // the dry-stone wall: up from the ditch to the slope behind, leaning back; four courses of grey-tan granite
            const hi = clamp(wl[i] * 0.9 + 0.5, 1.6, 6), hj = clamp(wl[i + 1] * 0.9 + 0.5, 1.6, 6), at = (k, f, h) => Q(k, -0.45 + h * f, 0.25 + 0.3 * h * f);
            for (let r = 0; r < 4; r++) { const f0 = r / 4, f1 = (r + 1) / 4, q = rpHash(i >> 1, r * 7 + side + 3), dk = ((i >> 1) + r) % 2 ? 0.9 : 1;
              g.quadO(at(i, f0, hi), at(i + 1, f0, hj), at(i + 1, f1, hj), at(i, f1, hi), [(0.6 + q * 0.1) * dk, (0.57 + q * 0.09) * dk, (0.51 + q * 0.08) * dk], Q(i, hi / 2, 4)); }
            const tA = at(i, 1, hi), tB = at(i + 1, 1, hj), off = (p) => [p[0] + T.nx[i] * side * 0.5, p[1] + 0.05, p[2] + T.nz[i] * side * 0.5];
            g.quadO(tA, tB, off(tB), off(tA), [0.5, 0.48, 0.43], [tA[0], tA[1] - 3, tA[2]]);   // (its top, the soil behind)
          } else if (nd[i] && nd[i + 1]) {   // galvanised W-beam: a front and a back face, a timber post every 4 m
            const a = Q(i, 0.45), b = Q(i + 1, 0.45), c = Q(i + 1, 0.8), d = Q(i, 0.8), ins = Q(i, 0.6, 3), ino = Q(i, 0.6, -3);
            g.quadO(a, b, c, d, steel, ins); g.quadO(a, b, c, d, steelB, ino);
            if (i % 2 === 0) { const p = Q(i, -0.35, 0.16); box(g, p[0], p[1], p[2], 0.18, 1.12, 0.18, T.hd[i], postW, null, true); }
          } else if (!nd[i] && !wl[i] && !(gp && gp[i]) && !(pull[i] && padT && side === padT.sd) && i % 25 === 0 && i > 2 && i < iE - 2) mkPosts.push([i, side]);
        }
      }
      const kp = plProps(out, mkPosts, (i, side) => vp[side > 0 ? 1 : 0][i]).spots;
      for (const sp of mkPosts) { if (kp.has(sp)) continue;
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]);
        box(g, p[0], p[1] - 0.2, p[2], 0.13, 1.2, 0.13, T.hd[i], [0.94, 0.94, 0.92], null, true); box(g, p[0], p[1] + 0.72, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.1, 0.1, 0.1], null, true);
      }
      // the warnings: a hairpin sign with the 15 MPH plate 90 m before every hairpin, a curve sign 60 m before the other tight bends (on the right); the
      // chevrons on the outside of the hairpins and of the tightest bends
      const hpS = (def.hairpins || []).map(h => sStart + h[0]);
      for (const c of T.corners) { if (c.sev < 2) continue; const s0 = c.i0 * T.ds, s1 = c.i1 * T.ds, mid = (s0 + s1) / 2; if (s0 < sStart + 30 || s1 > sFin - 20) continue;
        const turn = c.dir > 0 ? 1 : -1, isHp = hpS.some(s => s > s0 - 20 && s < s1 + 20), cell = isHp ? (turn > 0 ? 1 : 0) : (turn > 0 ? 3 : 2);
        const q = small(s0 - (isHp ? 90 : 60), 1, cell, 0, 0.9, 0.9, 1.75); if (q && isHp) bannerQ(q[0], q[1] + 1.12, q[2], -T.tx[q[3]], -T.tz[q[3]], 0.55, 0.55, 7 / 8, 1, 6 / 8, 7 / 8, ban2);   // (the advisory speed under the diamond)
        if (c.sev < 3 && !isHp) continue;
        const cc = turn > 0 ? 4 : 5;
        for (const o of isHp ? [-16, -8, 0, 8, 16] : [-10, 0, 10]) { const [cx, cz, ci] = onSide(mid + o, -turn, 0.7); if (excluded(cx, cz) || vrStubAt(cx, cz, 1)) continue;
          const cy = caGround(cx, cz), g = scen.get(cx, cz), fx = T.px[ci] - cx, fz = T.pz[ci] - cz, fl = Math.hypot(fx, fz) || 1, tx = -T.tx[ci] * 0.75 + fx / fl * 0.25, tz = -T.tz[ci] * 0.75 + fz / fl * 0.25, tl = Math.hypot(tx, tz);
          box(g, cx, cy - 0.2, cz, 0.08, 1.5, 0.08, T.hd[ci], [0.6, 0.61, 0.63]); bannerQ(cx, cy + 0.75, cz, tx / tl, tz / tl, 0.7, 0.7, 7 / 8, 1, cc / 8, (cc + 1) / 8, ban2); CR.avoid(cx, cz, 0.6); }
      }
      // the mileposts (def.mileposts: the county road's miles from State Route 76): a green paddle on the right
      for (const [d, m] of def.mileposts || []) if (m <= 6) small(sStart + d, 1, m - 1, 1, 0.42, 0.65, 0.9);
    }
    { // the boards: the valley at the start, the trucks' warning, the riders' and cyclists' warnings, the turnout, the elevation signs (at the road's real
      // 3000 ft and 4000 ft), the speed limit, the observatory's way on and the mountain's board past the finish
      const sAt = (alt) => { for (let i = T.startIdx; i < T.finishIdx; i++) if (altAt(i) >= alt) return i * T.ds; return -1; };
      sign(sStart + 70, 1, 0); sign(sStart + 260, 1, 1); sign(sStart + 460, 1, 10); sign(sStart + 620, 1, 11); sign(sStart + 1350, 1, 4); sign(sStart + 2400, 1, 5); sign(sStart + 5300, 1, 4); sign(sStart + 6900, 1, 5);
      if (tq) { sign(sStart + tq[0] - 420, 1, 2); sign(sStart + tq[0] - 90, 1, 3); }
      for (const [ft, k] of [[3000, 6], [4000, 7]]) { const s = sAt(ft * 0.3048); if (s > 0) sign(s, 1, k); }
      sign(sFin + 34, 1, 8); sign(sFin + 50, -1, 9, 1.6, -1);
    }

    /* ---- the culverts (def.culverts: where a dry creek bed passes under the road): on the low side a concrete headwall with the pipe's dark mouth, cobbles
       below it ---- */
    {
      for (const d of def.culverts || []) { const i = T.idx(sStart + d); if (i < 2 || i > iE - 2) continue;
        const lo = caGround(T.px[i] + T.nx[i] * 14, T.pz[i] + T.nz[i] * 14) < caGround(T.px[i] - T.nx[i] * 14, T.pz[i] - T.nz[i] * 14) ? 1 : -1, bar = lo > 0 ? T.br[i] : T.bl[i];
        const o = lo * (bar + 2.4), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o, y = caGround(x, z), g = scen.get(x, z);
        box(g, x, y - 0.6, z, 3.6, 1.9, 0.35, T.hd[i], [0.72, 0.71, 0.68]); box(g, x + T.nx[i] * lo * 0.2, y + 0.05, z + T.nz[i] * lo * 0.2, 0.95, 0.95, 0.06, T.hd[i], [0.08, 0.08, 0.08]);
        for (let k = 0; k < 7; k++) { const a = (R() - 0.5) * 3, b = 1 + R() * 3, px = x + T.tx[i] * a + T.nx[i] * lo * b, pz = z + T.tz[i] * a + T.nz[i] * lo * b, r = 0.2 + R() * 0.3; rock(g, px, caGround(px, pz) + r * 0.2, pz, r, r * 0.7, r, R() * TAU, vary([0.66, 0.64, 0.58], R, 0.15), R, 0.3); }
        exclPush(x, z, 3); }
    }

    /* ---- spectators: the start and the finish, the checkpoints, the turnout, groups on the outside of the hairpins ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.6, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.3, flag: 0.12, keepBar: 1.6 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 70, sStart + 70, sd, { rows: 3, dens: 0.6, label: 'PL start' }); run(sFin - 70, sFin + 14, sd, { rows: 3, dens: 0.6, label: 'PL finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 24, s0 + 20, side, { rows: 2, dens: 0.55, label: 'PL cp+' }); run(s0 - 20, s0 + 16, -side, { rows: 2, dens: 0.4, label: 'PL cp-' }); });
      (def.hairpins || []).forEach((h, k) => { if (k % 3 !== 1) return; const sm = sStart + h[0]; run(sm - 18, sm + 18, -h[2], { rows: 2, dens: 0.45, label: 'PL hairpin' }); });
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the side roads (Track.stubs): Vršič's, with this road's ground and boards ---- */
    out.stubStats = stubProps({ scen, out, root, gH: caGround, loc: { closed: 'ROAD CLOSED', gate: 'PRIVATE ROAD' }, posts: 'corners' });   // (the knockable posts at the open barrier's corners, the cones, the rail or the gate at each end)
    for (const [ch, mat] of [[roadCh, aMat], [lineCh, lMat], [shCh, sMat]]) for (const g of ch.map.values()) addM(g, mat);   // (the road and the side roads: one mesh a chunk and material)

    /* ---- the plants (instanced per 96-128 m chunk), by the land cover and the height: golden grass, the chaparral, coast live oaks, chaparral yuccas on
       the sunny banks low down; from ~1100 m black oaks, Coulter pines and incense cedars; sycamores and oaks along the dry creek beds; granite boulders;
       none on the road, the side roads or the steepest faces ---- */
    const pMat = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const wMat = tuftWindMat(out.dyn.wind || (out.dyn.wind = { value: 0 })), wB = wMat.onBeforeCompile; ouCutMat(wMat, cut);   // (the grass: in the wind, and the cut)
    { const cB = wMat.onBeforeCompile; wMat.onBeforeCompile = (sh) => { wB(sh); cB(sh); }; wMat.customProgramCacheKey = () => 'tuftWindCut'; wMat.side = THREE.FrontSide; }
    // 0 grass, 1 chaparral, 2 live oak, 3 sycamore, 4 boulder, 5 stones, 6 yucca (Mulholland Highway's plants), 7 black oak, 8 pine, 9 incense cedar
    const pk = [0, 1, 2, 3, 4, 5, 6].map(k => new IChunks(k === 1 ? plTreeGeo(3) : k === 5 ? plTreeGeo(4) : k === 2 ? plTreeGeo(5) : API.mhPlantGeo(k), k === 0 ? wMat : pMat, k === 1 ? 96 : k === 0 || k === 2 || k === 5 ? 128 : 192)).concat([0, 1, 2].map(k => new IChunks(plTreeGeo(k), pMat, 192)));
    let nPlants = 0, nTrees = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(110000 * dens), RT = rng(3771), SP = 3.0 / Math.sqrt(dens);
      const granite = (k, r) => [0.84 * k, (0.92 + r * 0.04) * k, (1.08 + r * 0.06) * k];   // (the instance tint: Mulholland's tan boulder to grey-tan granite)
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti2 = 0; ti2 < G.ntx; ti2++) {
        if (!G.on[tj * G.ntx + ti2]) continue;
        const xa = G.x0 + ti2 * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > 240) continue;
          if (hd > 80 && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;   // (farther out every other spot)
          if (hd > 120 && r4 < 0.45) continue;   // (and fewer still beyond 120 m, in the haze)
          const c = vrLC(x, z), y0 = caGround(x, z), sl = caSlope(x, z), A = y0 + base, up = sstep(1080, 1330, A), cd = plCreekD(x, z);
          let kind = -1;
          if (cd < 10 && r1 < 0.06) kind = A < 1250 && r2 < 0.55 ? 3 : 2;
          else if (cd < 3.5 && r1 < 0.1) kind = r2 < 0.5 ? 5 : 4;
          else if (c === 0) kind = r1 < 0.55 ? 0 : r1 < 0.562 + up * 0.02 ? (up > r2 ? 7 : 2) : r1 < 0.6 ? 1 : r1 < 0.606 ? 4 : r1 < 0.612 && sl > 0.25 && A < 1150 ? 6 : r1 < 0.616 + up * 0.006 && up > r3 ? 8 : -1;
          else if (c === 1) kind = r1 < 0.38 ? 1 : r1 < 0.43 ? 0 : r1 < 0.436 ? 4 : r1 < 0.45 && sl > 0.2 && A < 1150 ? 6 : r1 < 0.455 + up * 0.01 ? (up > r2 ? 8 : 2) : -1;
          else if (c === 2) {   // the woods: low down the tall, dense chaparral with live oaks in it; higher up the oaks and the conifers, the shrubs thinning
            const tr = lerp(0.035, 0.11, up);
            if (r1 < tr) { const q = r2; kind = up < 0.15 ? 2 : q < 0.3 * up ? 8 : q < 0.5 * up ? 9 : q < 0.5 * up + 0.25 + 0.15 * up ? 7 : 2; if (kind === 7 && up < 0.3) kind = 2; }
            else kind = r1 < tr + lerp(0.33, 0.15, up) ? 1 : r1 < tr + lerp(0.37, 0.23, up) ? 0 : r1 < tr + lerp(0.375, 0.24, up) ? 4 : -1;
          }
          else if (c === 3) kind = r1 < 0.02 ? 2 : r1 < 0.12 ? 0 : -1;
          else if (c === 4) kind = r1 < 0.08 ? 4 : r1 < 0.14 ? 0 : -1;
          if (kind < 0) continue;
          if (sl > (kind === 4 || kind === 5 || kind === 6 ? 1.2 : kind === 0 ? 0.95 : 0.85)) continue;
          const nn = vrNear(x, z), low = kind === 0 || kind === 1 || kind === 5 || kind === 6; if (nn.i >= 0 && (low ? nn.d < w + 2.6 || (nn.dd < 1.6 && nn.dd > 0) : nn.dd < (kind === 4 ? 1.6 : 4))) continue;   // (the grass, the shrubs and the stones also inside the barrier line where it stands far from the asphalt: inside the hairpins)
          if (excluded(x, z)) continue;
          if (kind === 0) pk[0].add(x, y0 - 0.05, z, r2 * TAU, 0.8 + r3 * 0.7, 0.6 + r4 * 0.5, [0.92 + r2 * 0.16, 0.9 + r3 * 0.14, 0.86 + r4 * 0.16]);
          else if (kind === 1) pk[1].add(x, y0 - 0.12, z, r2 * TAU, 1.8 + r3 * 1.8, 1.2 + r4 * 1.5, r2 < 0.16 ? [1.22 + r3 * 0.12, 1.24 + r3 * 0.1, 1.42 + r4 * 0.12] : r2 < 0.3 ? [1.02, 1.08, 1.12] : [0.88 + r2 * 0.24, 0.9 + r3 * 0.18, 0.88 + r4 * 0.16]);   // (some grey-green: the sage and the manzanita among the chamise)
          else if (kind === 6) pk[6].add(x, y0 - 0.05, z, r2 * TAU, 0.8 + r3 * 0.6, 0.7 + r4 * 0.5, [0.92 + r2 * 0.16, 0.95 + r3 * 0.1, 0.95 + r4 * 0.1]);
          else if (kind === 2) { pk[2].add(x, y0 - 0.15, z, r2 * TAU, 9 + r3 * 7, 7 + r4 * 5, [0.9 + r2 * 0.2, 0.92 + r3 * 0.16, 0.9]); nTrees++; }
          else if (kind === 3) { pk[3].add(x, y0 - 0.15, z, r2 * TAU, 11 + r3 * 6, 13 + r4 * 7, [0.92 + r2 * 0.16, 0.95 + r3 * 0.1, 0.9]); nTrees++; }
          else if (kind === 7) { const h = 10 + r3 * 6; pk[7].add(x, y0 - 0.15, z, r2 * TAU, h * (0.75 + r4 * 0.2), h, PLS === 'summer' ? [0.9 + r2 * 0.2, 0.92 + r3 * 0.16, 0.9] : [0.95 + r2 * 0.12, 0.85 + r3 * 0.3, 0.8 + r4 * 0.3]); nTrees++; }
          else if (kind === 8) { const h = 15 + r3 * 10; pk[8].add(x, y0 - 0.2, z, r2 * TAU, h * (0.85 + r4 * 0.2), h, [0.9 + r2 * 0.2, 0.92 + r3 * 0.14, 0.94 + r4 * 0.12]); nTrees++; }
          else if (kind === 9) { const h = 12 + r3 * 8; pk[9].add(x, y0 - 0.2, z, r2 * TAU, h * (0.9 + r4 * 0.2), h, [0.9 + r2 * 0.2, 0.92 + r3 * 0.12, 0.9]); nTrees++; }
          else if (kind === 5) { const k = 0.9 + r3 * 0.2, sc = 1 + r1 * 1.4; pk[5].add(x, y0 - 0.04, z, r2 * TAU, sc, sc * 0.9, granite(k, r4)); }
          else { const k = 0.86 + r3 * 0.28; pk[4].add(x, y0 - 0.2, z, r4 * TAU, 0.8 + r3 * 2.4, 0.6 + r4 * 1.8, granite(k, r2)); }
          if (++nPlants >= maxT) break grid;
        }
      }
    }
    {   // stones strewn beside the road, thickest at its edge
      const RS = rng(3777), maxS = Math.round(9000 * dens); let nS = 0;
      edge: for (let s = 12; s < T.len - 12; s += 2.2 / dens) for (const side of [-1, 1]) {
        const o = 1.7 + Math.pow(RS(), 2) * 34, [x, z] = onSide(s, side, o), r1 = RS(), r2 = RS(), r3 = RS();
        if (vrNear(x, z).dd < 1.2 || excluded(x, z)) continue;
        const y0 = caGround(x, z), sl = caSlope(x, z); if (sl > 1.15 || (vrLC(x, z) === 0 && r1 < 0.5)) continue;
        const k = 0.86 + r3 * 0.24, sc = 0.8 + r1 * 1.1; pk[5].add(x, y0 - 0.04, z, r2 * TAU, sc, sc * (0.8 + r3 * 0.5), [k * 0.86, k * 0.94, k * 1.1]);
        if (++nS >= maxS) break edge;
      }
    }
    for (let k = 0; k < pk.length; k++) pk[k].addTo(root, k === 2 || k === 3 || k >= 7);

    /* ---- the road cuts and the slopes: granite boulders at the foot of the cuts, outcrops of rounded granite where the slope is steep ---- */
    {
      const RV = rng(3781), rockC = [[0.66, 0.64, 0.58], [0.72, 0.69, 0.62], [0.6, 0.59, 0.55], [0.7, 0.64, 0.54], [0.56, 0.55, 0.52]];
      for (let s = 10; s < T.len - 10; s += 7) for (const side of [-1, 1]) {
        if (RV() > 0.3) continue;
        const o = 1.6 + Math.pow(RV(), 1.5) * 34, [x, z] = onSide(s, side, o), sz = 0.4 + RV() * 1.2; if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z)) continue;
        const y = caGround(x, z), sl = caSlope(x, z); if (sl < 0.35 && vrLC(x, z) !== 4) continue;
        rock(scen.get(x, z), x, y + sz * 0.3, z, sz * 1.2, sz, sz, RV() * TAU, vary(rockC[Math.floor(RV() * rockC.length)], RV, 0.1), RV, 0.32);
      }
      for (let s = 16; s < T.len - 16; s += 16) for (const side of [-1, 1]) {   // outcrops where the slope is steep: piles of big rounded granite boulders
        if (RV() < 0.45) continue;
        const [x, z] = onSide(s, side, 8 + RV() * 70); if (excluded(x, z) || vrNear(x, z).dd < 6) continue;
        const sl = caSlope(x, z); if (sl < 0.7) continue;
        const g = scen.get(x, z), n = 2 + Math.floor(RV() * 3), b0 = vary(rockC[Math.floor(RV() * rockC.length)], RV, 0.08);
        for (let q = 0; q < n; q++) { const r0 = 1.8 + RV() * 3.2, qx = x + (RV() - 0.5) * 8, qz = z + (RV() - 0.5) * 8, qy = caGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 1) continue;
          rock(g, qx, qy + r0 * 0.35, qz, r0, r0 * (0.6 + RV() * 0.4), r0 * (0.75 + RV() * 0.35), RV() * TAU, vary(b0, RV, 0.08), RV, 0.24, true); }
      }
    }

    /* ---- finish the meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    fac.addTo(sceneryGroup, ouCutMat(new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true }), cut), true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: plAtlas(cpAlt, 'ELEV ' + String(Math.round(T.altAt(T.hy[T.finishIdx]) / 0.3048)).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' FT'), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: plAtlas2(), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    crowdFinish(CR, root, out);
    out.stats = { plants: nPlants, trees: nTrees, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, rails: +(nRail / (2 * N)).toFixed(3), walls: +(nWall / (2 * N)).toFixed(3), sideRoads: out.stubStats.n };   // (read by the tests)
    return out;
  }

  World.ext.palomar = (scene, tex, opts) => buildPalomar(scene, tex, opts);
})();
