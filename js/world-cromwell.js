/* =========================================================================
   WORLD — Cromwell, Nova Zelandija (theme 'cromwell'): the circuit on the river terrace south of Cromwell in Central Otago, 216 m above
   the sea, a builder of its own (World.ext.cromwell) on the corridor terrain of js/world.js (nrPrep and the nr* helpers: the Copernicus
   heights of def.dem, the land cover def.lc of OpenStreetMap, ESA WorldCover and the canopy). The fourth of the five circuits with a builder
   of their own (plan: docs/dirkalisca-celine.md, »Novih pet«; the pattern: js/world-parnu.js, js/world-houli.js, js/world-tocancipa.js;
   the track: docs/proge/cromwell.md). Its own: the figure of eight's bridge (Core: T.cross; the upper leg on an embankment, a concrete deck
   with parapets that fades while the followed car drives under it, Render's dyn.tunnel; the lower leg between retaining walls, the ground
   behind them on a patch of its own, finer than the terrain's grid); the pit lane on the left of the start straight (def.pit) and the pit
   building behind it (13 crews' garages, a roof terrace, the race control's glass over the start line), the paddock behind it, the covered
   grandstand across the straight; the terrace's dry golden grass with tussock and wild thyme, stony patches, the circuit's irrigated
   lawns; the radiata pine plantations, the shelter belts of Lombardy poplars, pines and macrocarpa, broom and briar; the orchards' and
   vineyards' rows on the farmland (lc 2, in blocks of 160 m; few by the circuit); the pond in the west loop (def.sk.sea: API.rbSea) with flax and
   rushes; the circuit's other ways (sk.lk), the speedway's clay oval (sk.dt), the karting track (sk.kart); weatherboard and brick bungalows
   with corrugated iron roofs, sheds and halls of sheet (sk.bld, sk.hs); farther out the power lines (sk.lm), the ranges round the Cromwell
   basin on the horizon (def.far: Riverside's rsFar, Central Otago's colours, Lake Dunstan); New Zealand's flags (rbFlags). Of the shared
   parts only the low-level ones (terrain, crowds, flags, the horizon); the composition and the look its own.
   Only place names on its boards (no names of the circuit, its people, races, sponsors or the firms).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, NRC, NRN, NRT, RB, TAU, atS, atSf, box, clamp, cone, crH, crowdCtx, crowdFinish, crowdPut, crowdRun, crowdUV,
    cyl, gable, ico, lerp, nrAUV, nrDist, nrEdge, nrGCol, nrGround, nrLC, nrLCf, nrLump, nrNear, nrPN, nrPrep, nrShade, nrSlope, nrTileGeo,
    nrTileOn, parkedCar, pitExcl, pitKerbs, pitLaneScenery, pitOpen, pixAvg, propFloorTable, rng, roadsideProps, sstep, vary
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  const NZ = [[0.0, 0.14, 0.49]]; NZ.canton = [[0.78, 0.76, 0.86], [0.8, 0.07, 0.15]];   // New Zealand's flag: the blue field, the Union Jack in the canton (its red cross in the middle; rbFlags)
  const TEAM = [[0.85, 0.16, 0.13], [0.16, 0.36, 0.8], [0.95, 0.95, 0.94], [0.18, 0.62, 0.3], [0.96, 0.72, 0.12], [0.14, 0.14, 0.16], [0.95, 0.45, 0.1], [0.5, 0.26, 0.7], [0.1, 0.62, 0.72], [0.85, 0.2, 0.5], [0.4, 0.42, 0.46], [0.2, 0.3, 0.55], [0.7, 0.1, 0.1]];
  const CW_SEA = { color: 0x3f5a52, wo: { len: 1.0, amp: 0.2, refl: 0.55, land: 0.5, shal: 0.6, lap: 0.3, surf: 0 } };   // the pond: still, dark green, the willows' and the sky's reflections

  // the terrace's grass under the vertex colours (256 px = 14 m, tileable): dry olive-tan grass, green and straw blades in it, the pink of
  // wild thyme in flower, chips of schist, pale seed heads
  function cwGrassTex(aniso) {
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data, r = rng(6201);
    const n1 = nrPN(8, 6202), n2 = nrPN(24, 6203), n3 = nrPN(64, 6204);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const u = i / S, v = j / S, n = n1(u, v) * 0.3 + n2(u, v) * 0.4 + n3(u, v) * 0.3, k = 0.86 + n * 0.26 + (r() - 0.5) * 0.14, y = n2(u + 0.31, v + 0.57) - 0.5, o = (j * S + i) * 4;
      d[o] = clamp((122 + y * 16) * k, 0, 255); d[o + 1] = clamp((124 + y * 6) * k, 0, 255); d[o + 2] = clamp((72 - y * 6) * k, 0, 255); d[o + 3] = 255;
    }
    x.putImageData(img, 0, 0); const avg = pixAvg(d);
    x.lineWidth = 1.3;
    for (const [st, n] of [['rgba(64,86,36,0.36)', 620], ['rgba(204,184,118,0.34)', 680], ['rgba(150,128,78,0.3)', 300]]) {   // the blades (drawn across the edges too: tileable)
      x.strokeStyle = st; x.beginPath();
      for (let k = 0; k < n; k++) { const px = r() * S, py = r() * S, dx = (r() - 0.5) * 3, dy = -(1.2 + r() * 2.6);
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const qx = px + a * S, qy = py + b * S; if (qx > -6 && qx < S + 6 && qy > -6 && qy < S + 6) { x.moveTo(qx, qy); x.lineTo(qx + dx, qy + dy); } } }
      x.stroke(); }
    for (const [st, n, sz] of [['#9b7fa6', 26, 2], ['#8d877b', 40, 2], ['#ddd0a0', 34, 1], ['#5b6a3a', 30, 2]]) { x.fillStyle = st; for (let k = 0; k < n; k++) x.fillRect(Math.floor(r() * (S - sz)), Math.floor(r() * (S - sz)), sz, sz); }   // thyme, schist, seed heads, darker tufts
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso || 4; t.grassPic = true; t.avgCol = avg; return t;
  }
  // unit trees (height 1, instances scale them): 0 a Lombardy poplar (a narrow column: the shelter belts), 1 a radiata pine (the
  // plantations: a tall bare trunk, a broad irregular dark crown), 2 a macrocarpa (a dense dark dome from near the ground), 3 a shrub of the
  // dry terrace (sweet briar, broom, matagouri: grey-olive, a few yellow flowers), 4 a willow by the pond, 5, 6 the poplar and the pine far
  // from the road (cheaper), 7 an orchard's tree (a short trunk, a small round crown)
  function cwTreeGeo(kind) {
    const g = new GB(), R = rng(6210 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;   // (smooth normals; the flag restored below)
    const pop = [0.34, 0.45, 0.2], pn = [0.15, 0.24, 0.13], mc = [0.13, 0.2, 0.13], wl = [0.42, 0.52, 0.26], orc = [0.24, 0.37, 0.15], sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
    if (kind === 0) {
      cyl(g, 0, -0.02, 0, 0.035, 0.2, 5, [0.42, 0.4, 0.34], null, 0.03);
      ico(g, 0, 0.56, 0, 0.32, 1.5, pop, R, 0.2);   // (one column: the near poplars are many, their shadows full)
    } else if (kind === 1) {
      cyl(g, 0, -0.02, 0, 0.03, 0.62, 5, [0.36, 0.28, 0.22], null, 0.016);
      ico(g, 0, 0.72, 0, 0.36, 0.55, pn, R, 0.28);
      for (let q = 0; q < 4; q++) { const a = q / 4 * TAU + R() * 0.9, dd = 0.2 + R() * 0.12; nrLump(g, Math.cos(a) * dd, 0.66 + R() * 0.2, Math.sin(a) * dd, 0.2 + R() * 0.06, 0.6, sh(pn, 0.9 + R() * 0.22), R, 0.3); }
    } else if (kind === 2) {
      cyl(g, 0, -0.02, 0, 0.05, 0.16, 4, [0.3, 0.24, 0.19]);
      ico(g, 0, 0.5, 0, 0.48, 1.0, mc, R, 0.2); nrLump(g, 0.15, 0.72, 0.05, 0.3, 0.9, sh(mc, 1.1), R, 0.22); nrLump(g, -0.18, 0.64, -0.1, 0.28, 0.9, sh(mc, 1.05), R, 0.22);
    } else if (kind === 3) {
      ico(g, 0, 0.4, 0, 0.5, 0.75, [0.33, 0.35, 0.2], R, 0.32);
      for (let q = 0; q < 5; q++) { const a = q / 5 * TAU + R() * 0.7; nrLump(g, Math.cos(a) * 0.3, 0.46 + R() * 0.22, Math.sin(a) * 0.3, 0.13 + R() * 0.05, 0.8, q < 2 ? [0.82, 0.72, 0.18] : [0.38, 0.4, 0.24], R, 0.3); }
    } else if (kind === 4) {
      cyl(g, 0, -0.02, 0, 0.05, 0.36, 5, [0.36, 0.32, 0.26], null, 0.035);
      ico(g, 0, 0.56, 0, 0.46, 0.62, wl, R, 0.22);
      for (let q = 0; q < 5; q++) { const a = q / 5 * TAU + R() * 0.6; nrLump(g, Math.cos(a) * 0.32, 0.36 + R() * 0.12, Math.sin(a) * 0.32, 0.2 + R() * 0.05, 0.9, sh(wl, 0.92 + R() * 0.16), R, 0.25); }   // (the hanging twigs)
    } else if (kind === 5) {
      cyl(g, 0, -0.02, 0, 0.035, 0.2, 3, [0.42, 0.4, 0.34], null, 0.03); ico(g, 0, 0.55, 0, 0.32, 1.45, pop, R, 0.18);
    } else if (kind === 6) {
      cyl(g, 0, -0.02, 0, 0.03, 0.6, 3, [0.36, 0.28, 0.22], null, 0.016); ico(g, 0, 0.74, 0, 0.42, 0.62, pn, R, 0.28);
    } else {
      cyl(g, 0, -0.02, 0, 0.06, 0.3, 4, [0.34, 0.28, 0.22], null, 0.05); ico(g, 0, 0.6, 0, 0.42, 0.85, orc, R, 0.22);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function cwTussockGeo() {   // a tussock (unit height): a tuft of thin golden blades
    const g = new GB(), R = rng(6220);
    for (let q = 0; q < 7; q++) { const a = R() * TAU, d = R() * 0.28, h = 0.55 + R() * 0.45; cone(g, Math.cos(a) * d, -0.05, Math.sin(a) * d, 0.09 + R() * 0.04, h, 3, [0.5, 0.44, 0.26], [0.84, 0.76, 0.5], R() * TAU); }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function cwFlaxGeo() {   // flax on the pond's bank (unit height): a fan of long sword-shaped leaves, bronze at their tips
    const g = new GB(), R = rng(6224), dk = [0.18, 0.27, 0.15], tip = [0.46, 0.4, 0.22];
    for (let q = 0; q < 9; q++) { const a = q / 9 * TAU + R() * 0.5, lean = 0.2 + R() * 0.32, h = 0.7 + R() * 0.3, ca = Math.cos(a), sa = Math.sin(a), px = -sa * 0.05, pz = ca * 0.05;
      g.triO([px, 0, pz], [-px, 0, -pz], [ca * lean, h, sa * lean], dk, [-ca * 0.3, h * 0.4, -sa * 0.3], dk, tip); }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function cwRushGeo() {   // a tuft of rushes in the shallows (unit height): thin blades, pale at the tips
    const g = new GB(), R = rng(6226);
    for (let q = 0; q < 7; q++) { const a = R() * TAU, d = R() * 0.3, h = 0.6 + R() * 0.4; cone(g, Math.cos(a) * d, -0.05, Math.sin(a) * d, 0.07, h, 3, [0.3, 0.38, 0.2], [0.62, 0.62, 0.42], R() * TAU); }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function cwVineGeo() {   // one bay of a vineyard's row (real size, 6.8 m along x): the canopy along the trellis' wires, the post at its end
    const g = new GB(), vg = [0.3, 0.42, 0.17], vt = [0.36, 0.47, 0.19];
    box(g, 0, 0.62, 0, 6.8, 0.92, 0.55, 0, vg, vt, true); box(g, 3.4, -0.1, 0, 0.09, 1.75, 0.09, 0, [0.5, 0.44, 0.36], null, true);
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  let cwATex = null;
  function cwAtlas() {   // text boards (4 x 16 cells of 256 x 64): place names, the start line's, the game's sponsors
    if (cwATex) cwATex.dispose();
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const cell = (k, bg, fg, txt, px, stripe) => { const cx = (k % 4) * 256, cy = Math.floor(k / 4) * 64; x.fillStyle = bg; x.fillRect(cx, cy, 256, 64); if (stripe) { x.fillStyle = stripe; x.fillRect(cx, cy + 56, 256, 8); x.fillRect(cx, cy, 256, 4); }
      x.fillStyle = fg; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, cx + 128, cy + 33, 240); };
    cell(4, '#00247d', '#fff', 'CROMWELL', 42, '#cc142b'); cell(5, '#f4f4f0', '#00247d', 'NEW ZEALAND', 34, '#cc142b'); cell(6, '#16181c', '#fff', 'START · FINISH', 28, '#cc142b');
    cell(7, '#efe6cf', '#3b4a2e', 'CENTRAL OTAGO', 30, '#c99b3b');
    const SP = (typeof Tex !== 'undefined' && Tex.SPONSORS) || [['HITROLET', '#101418', '#ffd23f']];
    for (let k = 0; k < 8; k++) { const [txt, bg, fg] = SP[k % SP.length]; cell(40 + k, bg, fg, txt, 40, 'rgba(255,255,255,.14)'); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (cwATex = t);
  }
  const AT = { cro: 4, nz: 5, start: 6, otago: 7, sp: 40 };
  // the glass (512 x 256 px = 12 x 7.6 m: four bays of two panes, two floors): Central Otago's deep blue sky in the panes, darker below,
  // blinds here and there, the frames in white (u = metres along / 12, v = metres up / 7.6)
  function cwGlassTex() {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d'), r = rng(6260);
    x.fillStyle = '#e2e4e4'; x.fillRect(0, 0, 512, 256);
    for (let fl = 0; fl < 2; fl++) for (let b = 0; b < 8; b++) {
      const px = b * 64 + 4, py = fl * 128 + 20, pw = 56, ph = 102, gr = x.createLinearGradient(0, py, 0, py + ph), t = r();
      gr.addColorStop(0, 'rgb(' + (140 + t * 20 | 0) + ',' + (168 + t * 18 | 0) + ',' + (204 + t * 14 | 0) + ')'); gr.addColorStop(0.5, 'rgb(' + (76 + t * 14 | 0) + ',' + (94 + t * 14 | 0) + ',' + (118 + t * 12 | 0) + ')');
      gr.addColorStop(1, 'rgb(' + (46 + t * 10 | 0) + ',' + (54 + t * 10 | 0) + ',' + (66 + t * 10 | 0) + ')');
      x.fillStyle = gr; x.fillRect(px, py, pw, ph);
      if (r() < 0.25) { x.fillStyle = 'rgba(222,220,208,0.85)'; x.fillRect(px, py, pw, ph * (0.2 + r() * 0.5)); }   // the blinds
      x.fillStyle = 'rgba(255,255,255,0.15)'; x.beginPath(); x.moveTo(px + pw * 0.2, py); x.lineTo(px + pw * 0.45, py); x.lineTo(px + pw * 0.1, py + ph); x.lineTo(px, py + ph); x.lineTo(px, py + ph * 0.6); x.closePath(); x.fill();   // a reflection
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  }
  // the horizon (def.far, Riverside's rsFar; heights above the sea): the basin's dry golden terraces and Lake Dunstan, the ranges' tussock,
  // tan to olive-brown higher up, the grey-brown rock and the pale tops of the Pisa and the Dunstan Range; the clear air's light haze
  const FAR_BANDS = [[230, [0.62, 0.55, 0.36]], [600, [0.56, 0.49, 0.33]], [1000, [0.47, 0.43, 0.31]], [1400, [0.5, 0.47, 0.4]], [1800, [0.63, 0.61, 0.57]]];
  const cwFarCol = (h, d) => {
    let c = FAR_BANDS[FAR_BANDS.length - 1][1];
    if (h <= FAR_BANDS[0][0]) c = FAR_BANDS[0][1];
    else for (let k = 1; k < FAR_BANDS.length; k++) if (h < FAR_BANDS[k][0]) { const t = (h - FAR_BANDS[k - 1][0]) / (FAR_BANDS[k][0] - FAR_BANDS[k - 1][0]); c = FAR_BANDS[k - 1][1].map((v, j) => lerp(v, FAR_BANDS[k][1][j], t)); break; }
    const lk = sstep(199, 196, h); if (lk > 0) c = c.map((v, k) => lerp(v, [0.32, 0.44, 0.5][k], lk));   // (Lake Dunstan and the rivers' level)
    const f = (1 - Math.exp(-d / 18000)) * 0.82;
    return c.map((v, k) => lerp(v, [0.74, 0.8, 0.88][k], f));
  };
  // a square bar from a to b (any direction; r its half width): the pylons
  function beam(g, a, b, r, col) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dx, dy, dz) || 1, ux = dx / l, uy = dy / l, uz = dz / l;
    let px = -uz, py = 0, pz = ux; if (Math.abs(uy) > 0.95) { px = 1; pz = 0; }
    const pl = Math.hypot(px, py, pz); px /= pl; py /= pl; pz /= pl;
    const qx = uy * pz - uz * py, qy = uz * px - ux * pz, qz = ux * py - uy * px, c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    const cr = (p, s, t) => [p[0] + (px * s + qx * t) * r, p[1] + (py * s + qy * t) * r, p[2] + (pz * s + qz * t) * r], S = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    for (let k = 0; k < 4; k++) { const [s0, t0] = S[k], [s1, t1] = S[(k + 1) % 4]; g.quadO(cr(a, s0, t0), cr(b, s0, t0), cr(b, s1, t1), cr(a, s1, t1), col, c); }
  }

  function buildCromwell(scene, tex, opts) {
    const R = rng(6230), N = T.N, w = T.w, ds = T.ds, dens = opts.density || 1, sStart = T.startS, def = T.def, L = T.len, sk = def.sk || {}, LM = sk.lm || {};
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: nrGround, camFloor: nrGround, props: [], farClip: true, ownTex: [] };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    const dS = (s) => { let d = s - sStart; d = ((d % L) + L) % L; return d; };   // metres after the start line along the lap
    const dSs = (s) => { const d = dS(s); return d > L / 2 ? d - L : d; };      // (the same, before the start line negative)
    const sAt = (d) => ((sStart + d) % L + L) % L;
    const nameD = (n) => { const f = T.names.find(q => q.n === n); return f ? f.d : null; };
    const side2 = (side) => (side > 0 ? 1 : 0);
    const Y = (s) => T.elevAt(s).y;
    nrPrep();
    const P = API.NR, G = P.G, sea = API.rbSea, PP = def.pit, ST = def.stands || [];
    const SD = PP && PP[0] < 0 ? -1 : 1;   // the pit lane's side (def.pit[0]: its offset; Cromwell's on the left of the cars)
    // the main straight's own frame: metres from the start line along it (md) and out from it towards the pits (ml); the pit building, the
    // paddock and the grandstand are laid out in it
    const MA = atSf(sAt(-90), 0), MB = atSf(sAt(90), 0), mLn = Math.hypot(MB[0] - MA[0], MB[1] - MA[1]), mtx = (MB[0] - MA[0]) / mLn, mtz = (MB[1] - MA[1]) / mLn;
    const S0 = atSf(sStart, 0), iS = S0[3], msg = (-mtz * T.nx[iS] + mtx * T.nz[iS]) > 0 ? 1 : -1, mnx = -mtz * msg * SD, mnz = mtx * msg * SD;
    const mD = (x, z) => (x - S0[0]) * mtx + (z - S0[1]) * mtz, mL = (x, z) => (x - S0[0]) * mnx + (z - S0[1]) * mnz;
    const mainD = (i) => { const d = dSs(i * ds); return d > -260 && d < 160; };   // (a sample on the main straight)
    // the paddock behind the pit building (metres along the straight and out from it, on the pits' side): asphalt from the building's back
    const PAD = { d0: -78, d1: 78, o0: 38, o1: 86 };
    const paddock = (x, z) => { const d = mD(x, z), l = mL(x, z); return d > PAD.d0 && d < PAD.d1 && l > PAD.o0 && l < PAD.o1; };

    /* ---- the bridge (Core: T.cross, the lower leg under the upper one). The upper leg's road on its deck from D0 to D1 (14 m either side
       of the crossing), on an embankment beyond it; the lower leg between retaining walls (trench(i): 30 m either side of the crossing).
       The terrain's 8 m grid cannot hold a wall: under the lower leg it lies on its floor (FT x FU m in its frame), and the ground behind
       the walls is a patch of its own (PT x PU m, rows along the lower leg) on the heights DV the terrain would have there (the embankment
       added, nothing over the deck's slab) ---- */
    const CX = (T.cross || [])[0] || null, XC = CX ? [CX.x, CX.z] : [1e9, 1e9];
    const cdI = (i, c) => { const a = Math.abs(i - c); return Math.min(a, N - a) * ds; };
    const cdLo = (i) => CX ? cdI(i, CX.lo) : 1e9, cdUp = (i) => CX ? cdI(i, CX.up) : 1e9;
    const iu = CX ? Math.round(CX.up) % N : -1, D0 = iu - 7, D1 = iu + 7, sLo = CX ? CX.lo * ds : 0;
    const onDeck = (i) => !!CX && (((i - D0) % N) + N) % N < D1 - D0;   // (the segment from sample i to i + 1 on the deck)
    const trench = (i) => cdLo(i) <= 30;
    const frame = (c, x, z) => {   // a leg's frame by the crossing (c: its fractional sample there): [metres along it from the crossing, metres to its right, the sample]
      const i0 = Math.round(c) % N, t = (x - XC[0]) * T.tx[i0] + (z - XC[1]) * T.tz[i0], i = ((Math.round(c + t / ds) % N) + N) % N;
      return [t, (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i], i]; };
    const FT = 38, FU = 32, PT = 50, PU = 44, ZONE = 82;
    const DV = P.cwDV || (P.cwDV = new Map());   // (per grid vertex; kept with the grids between builds: World.keep)
    const embAt = (x, z) => {   // the embankment: level with the upper road out to 3.6 m past its barriers, then down 1 in 1.5; gone 40-60 m along it
      const [t, u, i] = frame(CX.up, x, z), at = Math.abs(t); if (at > 60) return -1e9;
      const bar = u > 0 ? T.br[i] : T.bl[i]; return T.hy[i] - 0.3 - Math.max(0, Math.abs(u) - bar - 3.6) / 1.5 - sstep(40, 60, at) * 30; };
    const capAt = (x, z) => { const [t, u, i] = frame(CX.up, x, z); return Math.abs(t) < 14.6 && Math.abs(u) < (u > 0 ? T.br[i] : T.bl[i]) + 0.9 ? T.hy[i] - 1.35 : 1e9; };   // (under the deck: below its slab)
    const padX = (x, z, h) => {
      const dx = x - XC[0], dz = z - XC[1]; if (dx * dx + dz * dz > ZONE * ZONE) return h;
      const dv = Math.min(Math.max(h, embAt(x, z)), capAt(x, z)), gi = Math.round((x - G.x0) / NRC), gj = Math.round((z - G.z0) / NRC);
      if (Math.abs(G.x0 + gi * NRC - x) < 0.01 && Math.abs(G.z0 + gj * NRC - z) < 0.01) DV.set(gj * G.nx + gi, dv);
      const [t, u, i] = frame(CX.lo, x, z);
      return Math.abs(t) < FT && Math.abs(u) < FU ? Math.min(dv, T.hy[i] - 0.3) : dv; };
    const dvGet = (i, j) => { i = clamp(i, 0, G.nx - 1); j = clamp(j, 0, G.nz - 1); const k = j * G.nx + i; let v = DV.get(k);
      if (v === undefined) { nrGround(G.x0 + i * NRC + 0.01, G.z0 + j * NRC + 0.01); v = DV.get(k); if (v === undefined) v = G.h[k]; } return v; };
    const patchH = (x, z) => {   // the ground behind the walls: DV on the terrain's two triangles per cell
      const gx = clamp((x - G.x0) / NRC, 0, G.nx - 1.001), gz = clamp((z - G.z0) / NRC, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
      if (u + v <= 1) { const a = dvGet(i, j); return a + u * (dvGet(i + 1, j) - a) + v * (dvGet(i, j + 1) - a); }
      const d = dvGet(i + 1, j + 1); return d + (1 - u) * (dvGet(i, j + 1) - d) + (1 - v) * (dvGet(i + 1, j) - d); };
    const inPatch = (x, z) => { if (!CX) return false; const dx = x - XC[0], dz = z - XC[1]; if (dx * dx + dz * dz > 4900) return false;
      const [t, u, i] = frame(CX.lo, x, z); if (Math.abs(t) > PT || Math.abs(u) > PU) return false;
      return Math.abs(u) > (u > 0 ? T.br[i] : T.bl[i]) + (trench(i) ? 0.5 : 3.0); };
    const cwGround = (x, z) => inPatch(x, z) ? patchH(x, z) : nrGround(x, z);
    out.groundH = out.camFloor = cwGround;
    // the ground level with the road from the pit wall out behind the pit building and the paddock (the cars in the lane run at the road's
    // height), easing into the land beyond; the same under the grandstand across the straight; the pond dug in (API.rbSea), the bridge's
    // embankment and the floor under it last
    { const pad0 = (x, z, h) => { const i = NRN.i; if (i < 0) return h;
        const md = mD(x, z), ml = mL(x, z); if (md < -260 || md > 200 || Math.abs(ml) > 120) return h;
        const fo = mainD(i) ? 1 : sstep(12, 30, NRN.dd), fd = Math.min(sstep(-255, -225, md), sstep(195, 165, md)); if (fo * fd <= 0) return h;   // (by another part of the track: its own ground)
        let f = 0;
        if (ml > 0) { const reach = 30 + 62 * Math.min(sstep(-110, -84, md), sstep(100, 76, md)); f = 1 - sstep(reach, reach + 14, ml); }
        else for (const [a, b] of ST) f = Math.max(f, Math.min(sstep(a - 30, a - 10, md), sstep(b + 30, b + 10, md)) * (1 - sstep(44, 58, -ml)));
        f *= fo * fd; return f > 0 ? lerp(h, Y(sAt(md)) - 0.06, f) : h; };
      const seaPad = sea.pad(pad0); P.pad = CX ? (x, z, h) => padX(x, z, seaPad(x, z, h)) : seaPad; }
    // inside the circuit (the lap's outline on 16 m cells): its own irrigated lawns, no shelter belts there
    const ICC = 16; let icx0 = 1e9, icx1 = -1e9, icz0 = 1e9, icz1 = -1e9;
    for (let i = 0; i < N; i++) { icx0 = Math.min(icx0, T.px[i]); icx1 = Math.max(icx1, T.px[i]); icz0 = Math.min(icz0, T.pz[i]); icz1 = Math.max(icz1, T.pz[i]); }
    const icNx = Math.ceil((icx1 - icx0) / ICC) + 1, icNz = Math.ceil((icz1 - icz0) / ICC) + 1, icM = new Uint8Array(icNx * icNz), icLast = (N - 1) - ((N - 1) % 2);
    for (let b = 0; b < icNz; b++) for (let a = 0; a < icNx; a++) { const x = icx0 + (a + 0.5) * ICC, z = icz0 + (b + 0.5) * ICC; let c = false;
      for (let i = 0, j = icLast; i < N; j = i, i += 2) { const zi = T.pz[i], zj = T.pz[j]; if ((zi > z) !== (zj > z) && x < (T.px[j] - T.px[i]) * (z - zi) / (zj - zi) + T.px[i]) c = !c; }
      icM[b * icNx + a] = c ? 1 : 0; }
    const inCircuit = (x, z) => { const a = Math.floor((x - icx0) / ICC), b = Math.floor((z - icz0) / ICC); return a >= 0 && b >= 0 && a < icNx && b < icNz && icM[b * icNx + a] === 1; };
    // the ground's colours (multiplying the grass map): the terrace's dry golden grass, browner in patches, stony where it is steep or
    // thin; the circuit's irrigated lawns along the track and in its infield; the orchards' mown grass, the vineyards' soil, the fields
    // (lc 2, in blocks of 160 m); the plantations' floor of needles (the trees' canopy, G.cov; beyond 250 m the land cover alone); the
    // yards and their gardens; the paddock's asphalt
    const gTex = ownTex(cwGrassTex(tex.grass.anisotropy)), AV = gTex.avgCol;
    const ab = (r, g, b) => [r / AV[0], g / AV[1], b / AV[2]];   // (an absolute colour as the vertex colour that makes it on the map)
    const ASPH = ab(0.36, 0.36, 0.35), YARD = ab(0.56, 0.54, 0.5), LAWN = ab(0.29, 0.43, 0.17), ORCH = ab(0.33, 0.45, 0.2), DRY = ab(0.68, 0.59, 0.35), DRY2 = ab(0.55, 0.49, 0.32);
    const STONE = ab(0.6, 0.57, 0.5), SOIL = ab(0.46, 0.39, 0.3), NEED = ab(0.43, 0.34, 0.24), STUB = ab(0.7, 0.63, 0.4);
    const blockT = (x, z) => crH(Math.floor(x / 160), Math.floor(z / 160), 301);   // (lc 2's blocks: below 0.55 an orchard, below 0.8 a vineyard, else a field)
    const irr = (x, z, dd, rd) => Math.max(1 - sstep(10, 30, dd), inCircuit(x, z) ? (1 - sstep(55, 90, rd)) * (0.75 + 0.25 * P.n4(x, z)) : 0);   // (the irrigated lawns: 1)
    P.colFn = (x, z, ny, dd, cov, o) => {
      const m = P.n3(x, z), q = P.n4(x, z), fo = nrLCf(x, z, 1), fi = nrLCf(x, z, 2), se = nrLCf(x, z, 3), rd = nrDist(x, z), k = 0.94 + m * 0.12 + (q - 0.5) * 0.06;
      const t = P.n5(x, z), st = clamp(sstep(0.6, 0.8, P.n6(x, z)) * 0.6 + (1 - ny) * 2.5, 0, 0.8);
      let r = lerp(lerp(DRY2[0], DRY[0], t), STONE[0], st) * k, g = lerp(lerp(DRY2[1], DRY[1], t), STONE[1], st) * k, b = lerp(lerp(DRY2[2], DRY[2], t), STONE[2], st) * k;
      const ir = irr(x, z, dd, rd); if (ir > 0) { const kk = 0.92 + m * 0.16; r = lerp(r, LAWN[0] * kk, ir); g = lerp(g, LAWN[1] * kk, ir); b = lerp(b, LAWN[2] * kk, ir); }
      if (fi > 0.02) { const p = blockT(x, z), kq = 0.95 + q * 0.1; let c;
        if (p < 0.55) c = [ORCH[0] * kq, ORCH[1] * kq, ORCH[2] * kq];   // the orchards' mown grass between the rows
        else if (p < 0.8) { const f = 0.35 + m * 0.35; c = [lerp(SOIL[0], ORCH[0], f), lerp(SOIL[1], ORCH[1], f), lerp(SOIL[2], ORCH[2], f)]; }   // the vineyards: bare soil, grass in some rows
        else c = P.n6(x, z) < 0.5 ? [LAWN[0] * 1.04, LAWN[1] * 1.04, LAWN[2] * 1.04] : [STUB[0] * kq, STUB[1] * kq, STUB[2] * kq];   // an irrigated pasture, stubble
        const kk = fi * 0.92; r = lerp(r, c[0], kk); g = lerp(g, c[1], kk); b = lerp(b, c[2], kk); }
      const fl = Math.max(clamp(cov, 0, 1), fo * lerp(0.4, 1, sstep(225, 250, rd)));   // the plantations' floor
      if (fl > 0) { const kk = 0.92 + m * 0.16; r = lerp(r, NEED[0] * kk, fl); g = lerp(g, NEED[1] * kk, fl); b = lerp(b, NEED[2] * kk, fl); }
      if (se > 0.02) { const kk = se * 0.7, gd = sstep(0.45, 0.7, m); r = lerp(r, lerp(YARD[0], LAWN[0], gd), kk); g = lerp(g, lerp(YARD[1], LAWN[1], gd), kk); b = lerp(b, lerp(YARD[2], LAWN[2], gd), kk); }   // the yards, their gardens
      if (paddock(x, z)) { r = ASPH[0]; g = ASPH[1]; b = ASPH[2]; }   // the paddock (its asphalt drawn over it: no green at its edge)
      o[0] = r; o[1] = g; o[2] = b; return o;
    };
    out.bounds = { minX: P.x0, maxX: P.x1, minZ: P.z0, maxZ: P.z1 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 64;   // tree exclusion circles (buildings, stands, crowds), hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); } };
    const excluded = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (let k = 0; k < Lc.length; k++) { const e = Lc[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    if (CX) { exclPush(XC[0], XC[1], 46); for (const c of [CX.lo, CX.up]) for (let d = -64; d <= 64; d += 16) { const i = ((Math.round(c + d / ds) % N) + N) % N; exclPush(T.px[i], T.pz[i], 24); } }   // (nothing on the bridge's ground)

    /* ---- terrain tiles: which ones (they are built at the end, when the trees have darkened the ground under them) ---- */
    const gMat = new THREE.MeshLambertMaterial({ map: gTex, vertexColors: true }), tiles = [];
    for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { const on = nrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; tiles.push(ti, tj, on); }

    /* ---- road: asphalt (a darker rubbered line, more so in the braking zones), white edge lines, red and white kerbs; none on the deck
       (its own meshes below) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true }), cMat = new THREE.MeshLambertMaterial({ map: tex.curb, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const kerb = [new Uint8Array(N), new Uint8Array(N)];   // inside of every bend, outside in the tighter ones
    for (let i = 0; i < N; i++) if (T.curb[i]) { const k = T.k[i]; for (const side of [-1, 1]) { const inside = side * k > 0; if (inside || Math.abs(k) > 1 / 60) kerb[side2(side)][i] = 1; } }
    pitKerbs(kerb);   // (none on the pit lane's side where it joins the circuit)
    const CH = 256, offs = [-w, -w * 2 / 3, -w / 3, 0, w / 3, w * 2 / 3, w], tileL = 8;   // (512 m chunks: the road, its lines and kerbs, the barriers, the verges)
    const brk = new Float32Array(N);
    for (const c of T.corners) if (c.sev >= 2) for (let k = -60; k <= 6; k++) { const i = (c.i0 + k + N) % N, f = k < -10 ? sstep(-60, -12, k) : sstep(6, -10, k); if (f > brk[i]) brk[i] = f; }
    const shade = (i, o) => { const rl = T.rl[i]; let k = 0.8 - (0.12 + 0.12 * brk[i]) * Math.exp(-((o - rl) * (o - rl)) / 5); if (Math.abs(o) > w * 0.92) k -= 0.04; return [k, k, k * 1.01]; };
    const wl = [0.95, 0.95, 0.92], lineRow = (gl, i) => gl.row([Pt(i, -w + 0.15, 0.034), Pt(i, -w + 0.45, 0.034), Pt(i, w - 0.45, 0.034), Pt(i, w - 0.15, 0.034)], [wl, wl, wl, wl]);
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB(true), gl = new RB(), gk = new RB(true);
      let pr = -1, pl = -1; const pk = [-1, -1];
      for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
        const i = ii % N, v = ii * ds / tileL, dk = onDeck((i - 1 + N) % N);
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o)), offs.map(o => [(o + w) / tileL, v]));
        if (pr >= 0 && !dk) gr.link(pr, r, 0, offs.length - 1); pr = r;
        const l = lineRow(gl, i);
        if (pl >= 0 && !dk) { gl.link(pl, l, 0, 1); gl.link(pl, l, 2, 3); } pl = l;
        for (const side of [-1, 1]) {
          const si = side2(side);
          if (kerb[si][i] && !onDeck(i)) {   // a red and white kerb in 1 m blocks: a sloped inner edge, a flat top, a low outer lip
            const cw = T.curbW, pf = [[w - 0.02, 0.035], [w + 0.14, 0.075], [w + cw - 0.12, 0.08], [w + cw + 0.02, 0.03]], vv = ii * ds / 2;
            const shk = [0.84, 1, 1, 0.78].map(k => [k, k, k]), us = [0, 0.1, 0.92, 1], o = side > 0 ? [0, 1, 2, 3] : [3, 2, 1, 0];
            const rk = gk.row(o.map(k => Pt(i, side * pf[k][0], pf[k][1])), o.map(k => shk[k]), o.map(k => [us[k], vv]));
            if (pk[si] >= 0) gk.link(pk[si], rk, 0, 3); pk[si] = rk;
          } else pk[si] = -1;
        }
      }
      addM(gr, aMat); addM(gl, lMat); addM(gk, cMat);
    }
    /* ---- run-offs: pale asphalt from the kerb (or the edge) to just before the barrier where the barriers stand far out (Core: T.gravL /
       gravR; with def.runoffTarmac the cars drive on asphalt there), tapering in and out; a green painted band along the track limit ---- */
    {
      const rc = new Chunks(256, true), gb = new Chunks(256), grn = [0.2, 0.52, 0.3];
      const roC = (p) => { const k = 1.02 + (P.n4(p[0], p[2]) - 0.5) * 0.06; return [k, k, k * 1.02]; };
      for (const side of [-1, 1]) {
        const flag = side > 0 ? T.gravR : T.gravL, bar = side > 0 ? T.br : T.bl, K = kerb[side2(side)];
        for (let i = 0; i < N; i++) {
          const j = (i + 1) % N; if ((!flag[i] && !flag[j]) || onDeck(i)) continue;
          const fi = flag[i] ? 1 : 0, fj = flag[j] ? 1 : 0, inI = w + (K[i] ? T.curbW : 0.05), inJ = w + (K[j] ? T.curbW : 0.05);
          const outI = lerp(inI + 0.1, bar[i] - 0.7, fi), outJ = lerp(inJ + 0.1, bar[j] - 0.7, fj);
          if (outI < inI + 0.05 && outJ < inJ + 0.05) continue;
          const uvp = (p) => [p[0] / 8, -p[2] / 8], a = Pt(i, side * inI, 0.028), b = Pt(i, side * outI, 0.028), c = Pt(j, side * outJ, 0.028), d = Pt(j, side * inJ, 0.028);
          rc.get(a[0], a[2]).quadUp(a, b, c, d, [roC(a), roC(b), roC(c), roC(d)], [uvp(a), uvp(b), uvp(c), uvp(d)]);
          const g0 = w + T.curbW + 0.5;   // the green band just past the kerbs' width (at the same distance with a kerb or without one)
          if (fi && fj && outI > g0 + 0.6 && outJ > g0 + 0.6) gb.get(a[0], a[2]).quadUp(Pt(i, side * g0, 0.034), Pt(i, side * Math.min(outI, g0 + 1.3), 0.034), Pt(j, side * Math.min(outJ, g0 + 1.3), 0.034), Pt(j, side * g0, 0.034), [grn, grn, grn, grn]);
        }
      }
      rc.addTo(root, new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }), false, true); gb.addTo(root, lMat, false, true);
    }
    // the chequered start / finish line and the grid boxes (a box for every car, staggered)
    {
      const gq = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1], wh = [0.93, 0.93, 0.9], HYp = (p) => T.hy[p[3]], nBox = Math.max(14, (def.rivals || 0) + 1);
      const a = atSf(sStart - 0.8, -w), b = atSf(sStart - 0.8, w), c = atSf(sStart + 0.8, w), d = atSf(sStart + 0.8, -w);
      gq.quadUp([a[0], HYp(a) + 0.04, a[1]], [b[0], HYp(b) + 0.04, b[1]], [c[0], HYp(c) + 0.04, c[1]], [d[0], HYp(d) + 0.04, d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      for (let k = 1; k <= nBox; k++) {
        const sb = sStart - 9 - (k - 1) * 7.5 + 2.6, lat = (k % 2 === 1 ? -1 : 1) * 3.2;
        const p0 = atSf(sb, lat - 1.5), p1 = atSf(sb, lat + 1.5), p2 = atSf(sb + 0.35, lat + 1.5), p3 = atSf(sb + 0.35, lat - 1.5);
        gw.quadUp([p0[0], HYp(p0) + 0.037, p0[1]], [p1[0], HYp(p1) + 0.037, p1[1]], [p2[0], HYp(p2) + 0.037, p2[1]], [p3[0], HYp(p3) + 0.037, p3[1]], [wh, wh, wh, wh]);
        const q0 = atSf(sb - 1.6, lat - 1.5), q1 = atSf(sb + 0.35, lat - 1.5), q2 = atSf(sb + 0.35, lat - 1.25), q3 = atSf(sb - 1.6, lat - 1.25);
        gw.quadUp([q0[0], HYp(q0) + 0.037, q0[1]], [q1[0], HYp(q1) + 0.037, q1[1]], [q2[0], HYp(q2) + 0.037, q2[1]], [q3[0], HYp(q3) + 0.037, q3[1]], [wh, wh, wh, wh]);
      }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw, lMat);
    }
    const atlas = cwAtlas();
    /* ---- the bridge's deck (the upper leg from D0 to D1): its road, lines, a flat concrete verge to the parapets, the parapets, the slab's
       sides and underside, the place's name on its side towards the lower leg's traffic; its own materials, faded while the followed car
       drives under it (Render: dyn.tunnel; Sfx: the engine rings under it) ---- */
    let nDeck = 0;
    if (CX) {
      const dA = aMat.clone(), dL = lMat.clone(), dC = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), dB = new THREE.MeshLambertMaterial({ map: atlas });
      const gr = new RB(true), gl = new RB(), gc = new RB(), gb = new GB(true), CON = [0.8, 0.79, 0.76], TOP = [0.88, 0.88, 0.86], OUT = [0.84, 0.84, 0.82], COND = [0.62, 0.61, 0.59], UND = [0.44, 0.44, 0.43];
      let pr = -1, pl = -1, pu = -1; const pc = [-1, -1];
      for (let ii = D0; ii <= D1; ii++) {
        const i = ((ii % N) + N) % N, v = ii * ds / tileL;
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o)), offs.map(o => [(o + w) / tileL, v])); if (pr >= 0) gr.link(pr, r, 0, offs.length - 1); pr = r;
        const l = lineRow(gl, i); if (pl >= 0) { gl.link(pl, l, 0, 1); gl.link(pl, l, 2, 3); } pl = l;
        for (const side of [-1, 1]) {
          const bar = side > 0 ? T.br[i] : T.bl[i], o = bar + 0.12, o2 = bar + 0.45;
          let pts = [[w, 0.012], [o - 0.02, 0.012], [o, 1.0], [o + 0.06, 1.1], [o2, 1.1], [o2, -1.3]].map(([q, y]) => Pt(i, side * q, y)), cols = [CON, CON, CON, TOP, OUT, COND];
          if (side < 0) { pts = pts.reverse(); cols = cols.slice().reverse(); }
          const rc = gc.row(pts, cols), si = side2(side); if (pc[si] >= 0) gc.link(pc[si], rc, 0, 5); pc[si] = rc;
        }
        const ru = gc.row([Pt(i, T.br[i] + 0.45, -1.3), Pt(i, -(T.bl[i] + 0.45), -1.3)], [UND, UND]); if (pu >= 0) gc.link(pu, ru, 0, 1); pu = ru;   // (right to left: facing down)
        nDeck++;
      }
      { const sm = iu * ds, [bx, bz] = atSf(sm, T.br[iu] + 0.47), [u0, v0, u1, v1] = nrAUV(AT.otago), tx = -T.nx[iu], tz = -T.nz[iu], ux = tz, uz = -tx, hw = -7, cy = T.hy[iu] - 1.18;   // (the lower leg's cars come from the deck's right)
        const A = [bx - ux * hw, cy, bz - uz * hw], B = [bx + ux * hw, cy, bz + uz * hw];
        gb.quadO(A, B, [B[0], cy + 0.95, B[2]], [A[0], cy + 0.95, A[2]], [1, 1, 1], [bx + tx, cy + 0.5, bz + tz], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
      addM(gr, dA); addM(gl, dL); addM(gc, dC, true); addM(gb, dB);
      const under = (car, m) => { const s = car && car.q ? car.q.s : -1e9; let d = ((s - sLo) % L + L) % L; if (d > L / 2) d -= L; return m != null ? d > -10 - m && d < 10 + m : d > -16 && d < 26; };   // (the fade: from just before the deck until the camera behind is past it; the ring: m, under it)
      out.dyn.tunnel = { mat: dC, mats: [dA, dL, dC, dB], s0: sLo - 10, s1: sLo + 10, test: under };
    }

    /* ---- barriers: concrete along the pit wall and the straight's right (in front of the grandstand), on the bridge's embankment and by
       the walls under it, the retaining walls of the lower leg under the bridge (as tall as the ground behind them), tyre walls round the
       outside of the slower corners' run-offs, armco on posts elsewhere; none where the pit lane leaves and joins the circuit ---- */
    const lw = (i) => { const d = dSs(i * ds); return d > -160 && d < 120; };   // the main straight's right
    const tyreOn = [new Uint8Array(N), new Uint8Array(N)];
    for (const c of T.corners) { if (c.sev < 2) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, si = side2(-c.dir);
      for (let k = c.i0 - 8; k <= i1c + 12; k++) { const ii = ((k % N) + N) % N; if ((si ? T.gravR : T.gravL)[ii]) tyreOn[si][ii] = 1; } }
    const kindAt = (i, side) => {   // -1 none, 0 armco, 1 concrete wall, 2 tyre wall, 3 a retaining wall
      if (onDeck(i)) return -1;
      if (side === SD && PP) { if (pitOpen(i)) return -1; const p = T.pitAt(i * ds); if (p) return p.gap ? -1 : 1; }
      if (trench(i)) return 3;
      if (cdLo(i) <= 46 || cdUp(i) <= 52) return 1;
      if (side === -SD && lw(i)) return 1;
      return tyreOn[side2(side)][i] ? 2 : 0;
    };
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const tyMat = new THREE.MeshLambertMaterial({ map: tex.tires, vertexColors: true });
    const postGeo = (() => { const g = new GB(); box(g, 0, 0, 0, 0.12, 1, 0.12, 0, [0.46, 0.47, 0.5], null, true); return g.geometry(); })();
    const posts = new IChunks(postGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), 512);
    const fence = [new Uint8Array(N), new Uint8Array(N)];   // catch fences (1: behind a rail or a wall, 2: behind a tyre wall)
    const steel = [0.8, 0.82, 0.85], steelD = [0.5, 0.52, 0.56], conc = [0.82, 0.82, 0.8], concD = [0.66, 0.66, 0.64], W1 = [1, 1, 1], ret = [0.74, 0.72, 0.68], retD = [0.6, 0.58, 0.55];
    const wallTop = (i, side) => { const q = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.55); return Math.max(1.05, patchH(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - T.hy[i] + 0.3); };
    let nWall = 0;
    const railRow = (gr, i, side, k) => {   // armco / wall cross-section at sample i (rows run so that the faces look at the road)
      const bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.12), h = 1.1, o2 = side * (bar + (k === 0 ? 0.42 : k === 3 ? 0.55 : 0.45));
      let p, c;
      if (k === 3) { const tp = wallTop(i, side); p = [Pt(i, o, -0.4), Pt(i, o, 0.1), Pt(i, o, tp - 0.12), Pt(i, o, tp), Pt(i, o2, tp), Pt(i, o2, tp - 0.7)]; c = [retD, ret, ret, [0.86, 0.85, 0.82], [0.8, 0.79, 0.76], retD]; nWall++; }
      else if (k === 0) { p = [Pt(i, o, 0.32), Pt(i, o, 0.6), Pt(i, o, 0.66), Pt(i, o, 0.95), Pt(i, o2, 0.95)]; c = [steel, steelD, steel, [0.9, 0.91, 0.93], [0.72, 0.74, 0.77]]; }
      else { p = [Pt(i, o, -0.4), Pt(i, o, 0.1), Pt(i, o, h - 0.1), Pt(i, o, h), Pt(i, o2, h)]; c = [concD, conc, conc, [0.9, 0.9, 0.88], [0.84, 0.84, 0.82]]; }
      if (side < 0) { p = p.reverse(); c = c.slice().reverse(); }
      return gr.row(p, c);
    };
    const lastPt = (k) => k === 3 ? 5 : 4;
    const tyreRow = (gt, i, side, u) => {   // a tyre wall: the belted face towards the road, a dark top
      const bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.1), o2 = side * (bar + 0.9), dk = [0.3, 0.3, 0.32];
      let p = [Pt(i, o, -0.1), Pt(i, o, 0.95), Pt(i, o2, 0.95)], uv = [[u, 0.02], [u, 0.98], [u, 0.98]], c = [W1, W1, dk];
      if (side < 0) { p = p.reverse(); uv = uv.slice().reverse(); c = c.slice().reverse(); }
      return gt.row(p, c, uv);
    };
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB(), gt = new RB(true);
      for (const side of [-1, 1]) {
        let prev = -1, pk = -2, acc = c0 * ds;
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++, acc += ds) {
          const i = ii % N, k = kindAt(i, side);
          if (prev >= 0 && k !== pk) { if (pk === 2) gt.link(prev, tyreRow(gt, i, side, acc / 3), 0, 2); else if (pk >= 0) gr.link(prev, railRow(gr, i, side, pk), 0, lastPt(pk)); prev = -1; }
          if (k < 0) { pk = k; continue; }
          const r = k === 2 ? tyreRow(gt, i, side, acc / 3) : railRow(gr, i, side, k);
          if (prev >= 0) { if (k === 2) gt.link(prev, r, 0, 2); else gr.link(prev, r, 0, lastPt(k)); } prev = r; pk = k;
          if (k === 0 && ii % 2 === 0 && ii < c0 + CH) { const p = Pt(i, side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.24), 0); posts.add(p[0], p[1] - 0.35, p[2], T.hd[i], 1, 1.25); }
          if ((k === 1 || k === 2) && cdLo(i) > 50 && cdUp(i) > 64) fence[side2(side)][i] = k;
        }
      }
      addM(gr, rMat, true); addM(gt, tyMat, true);
    }
    const nPosts = posts.addTo(root, false);   // (thin posts: no shadows)
    // the verge's cross-section beyond the road edge ([offset, height above the road]), lifted onto the ground where it rises; in the lower
    // leg's trench level to the retaining walls. The verges and the knocked props' floor use the same rows
    const cwVerge = (i, side) => {
      const bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i];
      if (trench(i)) return [[w, 0.0], [w + 1.2, -0.03], [bar - 0.4, -0.06], [bar, -0.08], [bar + 0.12, -0.08]];
      const lift = (o, h) => { const q = side * o; return [o, Math.max(h, cwGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.06 - y)]; };
      return [[w, 0.0], [w + 1.2, -0.04], lift(Math.max(w + 1.8, bar - 0.4), -0.1), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)];
    };
    // knockable props: tyre stacks at the corner exits and apexes, 2.2-3 m past the edge, not on the pit straight nor by the bridge. Drawn out to 150 m
    out.propR = 150;
    out.propFloor = propFloorTable(null, (i, side) => cwVerge(i, side));
    out.propStats = roadsideProps(out.props, { exits: 10, apexes: 4, wallEdge: [2.2, 3.0], stacks: [5, 7], rows2: 0.3, floor: out.propFloor, skip: (i) => { const d = dSs(i * ds); return (d > -190 && d < 110) || cdLo(i) < 50 || cdUp(i) < 40; } });
    // the game's sponsors on the concrete walls (tex.sponsors: 4 m boards, read from the road)
    { const sb = new Chunks(256, true);
      for (const side of [-1, 1]) for (let i = 0, n = 0; i + 2 <= N; i += 2) {
        const j = (i + 2) % N; if (kindAt(i, side) !== 1 || kindAt(j, side) !== 1 || kindAt((i + 1) % N, side) !== 1) continue;
        const k = (n++ * 3 + (side > 0 ? 1 : 0)) % 8, u0 = (k % 2) * 0.5, v1 = 1 - Math.floor(k / 2) * 0.25, bar = side > 0 ? T.br : T.bl, o = (ii) => side * (bar[ii] + 0.1);
        const A = Pt(i, o(i), 0.14), B = Pt(j, o(j), 0.14), C = Pt(j, o(j), 0.96), D = Pt(i, o(i), 0.96), uL = side < 0 ? u0 : u0 + 0.5, uR = side < 0 ? u0 + 0.5 : u0;
        sb.get(A[0], A[2]).quadO(A, B, C, D, W1, Pt(i, side * (bar[i] + 2), 0.5), [[uL, v1 - 0.25], [uR, v1 - 0.25], [uR, v1], [uL, v1]]); }
      sb.addTo(root, new THREE.MeshLambertMaterial({ map: tex.sponsors }), false, true); }

    /* ---- scenery helpers (vertex coloured, 128 m chunks near the road, 512 m ones farther out without shadows), the glass (its own map),
       the text boards, New Zealand's flags ---- */
    const scen = new Chunks(128), farB = new Chunks(512), glass = new Chunks(256, true), ban = new GB(true), crowdG = new GB(true), flagL = [];
    const glassTex = ownTex(cwGlassTex());
    const glassWall = (x0, z0, x1, z1, yb, yt, inside, col, u0) => {   // a wall of glass from (x0, z0) to (x1, z1) between the heights yb and yt, facing away from inside
      const l = Math.hypot(x1 - x0, z1 - z0), ua = (u0 || 0) / 12, ub = ua + l / 12, vt = (yt - yb) / 7.6;
      glass.get(x0, z0).quadO([x0, yb, z0], [x1, yb, z1], [x1, yt, z1], [x0, yt, z0], col || W1, inside, [[ua, 0], [ub, 0], [ub, vt], [ua, vt]]); };
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const CR = crowdCtx({ gH: cwGround, near: (x, z) => nrNear(x, z).dd, maxSlope: 0.8 });   // spectators, marshals, the crews' men (instanced)
    const board = (cx, cy, cz, tx, tz, Wd, H, cellK) => {   // a text board (bottom centre cx, cy, cz) facing -t, a dark back behind it
      const [u0, v0, u1, v1] = nrAUV(cellK), ux = tz, uz = -tx, hw = -Wd / 2;
      const A = [cx - ux * hw, cy, cz - uz * hw], B = [cx + ux * hw, cy, cz + uz * hw], C = [B[0], cy + H, B[2]], D = [A[0], cy + H, A[2]];
      ban.quadO(A, B, C, D, W1, [cx + tx, cy + H / 2, cz + tz], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
      box(scen.get(cx, cz), cx + tx * 0.06, cy - 0.02, cz + tz * 0.06, 0.08, H + 0.04, Wd + 0.04, Math.atan2(tz, tx), [0.3, 0.31, 0.33], null, true);
    };
    const signPost = (s, side, extra, cellK, Wd, H, y0) => {   // a board on two posts beside the track, facing the traffic
      const [x, z, i] = onSide(s, side, extra), y = cwGround(x, z), g = scen.get(x, z), nx = T.nx[i], nz = T.nz[i];
      for (const o of [-Wd / 2 + 0.2, Wd / 2 - 0.2]) box(g, x + nx * o + T.tx[i] * 0.16, y - 0.3, z + nz * o + T.tz[i] * 0.16, 0.1, y0 + H + 0.3, 0.1, T.hd[i], [0.55, 0.56, 0.58]);
      board(x, y + y0, z, T.tx[i], T.tz[i], Wd, H, cellK); exclPush(x, z, 3);
    };
    const flagPole = (x, y, z, rot, H) => { cyl(scen.get(x, z), x, y - 0.2, z, 0.05, H + 0.25, 5, [0.86, 0.86, 0.88]); flagL.push([x, y + H, z, rot, NZ, 1.8, 0.9]); CR.avoid(x, z, 0.45); };
    const roomSide = (s) => { let l = 0, r = 0; for (let d = -30; d <= 30; d += 6) { const i = T.idx(s + d); l += T.bl[i]; r += T.br[i]; } return r > l ? 1 : -1; };
    const person = (x, y, z, fx, fz, col, pose, staff) => crowdPut(CR, x, y, z, fx, fz, { col, pose, staff: !!staff }, 1);
    const groundMin = (x, z, Lb, Wb, ang) => { let y0 = 1e9; for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 0]]) { const cx = x + Math.cos(ang) * a * Lb / 2 - Math.sin(ang) * b * Wb / 2, cz = z + Math.sin(ang) * a * Lb / 2 + Math.cos(ang) * b * Wb / 2; y0 = Math.min(y0, cwGround(cx, cz)); } return y0; };

    /* ---- START / FINISH: the gantry with the start lights over the line, its banner ---- */
    {
      const [x, z, h, i] = atS(sStart, 0), gy = T.hy[i], g = scen.get(x, z), nx = T.nx[i], nz = T.nz[i], gray = [0.86, 0.87, 0.88];
      const oL = -(T.bl[i] + (SD < 0 ? 0.45 : 1.0)), oR = T.br[i] + (SD > 0 ? 0.45 : 1.0), span = (oR - oL) / 2, oc = (oR + oL) / 2;   // (the pit wall's post on the wall)
      for (const o of [oL, oR]) box(g, x + nx * o, gy - 0.3, z + nz * o, 0.7, 7.9, 0.7, h, gray);
      box(g, x + nx * oc, gy + 6.4, z + nz * oc, 1.0, 1.2, span * 2 + 0.7, h, [0.14, 0.15, 0.18], [0.24, 0.25, 0.3]);
      box(g, x, gy + 5.2, z, 0.5, 1.3, 5.2, h, [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, gy + 7.85, z + nz * o); m.rotation.y = -h; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      board(x + nx * oc - T.tx[i] * 0.55, gy + 6.4, z + nz * oc - T.tz[i] * 0.55, T.tx[i], T.tz[i], span * 2 - 2, 1.15, AT.start);
      exclPush(x, z, span + 6);
    }

    /* ---- the pit lane left of the start straight and the crews' boxes (World's: the lane, its lines and apron, the crews' kit, the stands on the
       pit wall, the player's box for the renderer's crew), the pit building our own (garages: false) ---- */
    let nGar = 0;
    const At = (s, o) => atSf(s, SD * o);   // (o metres out towards the pits)
    if (PP) {
      pitLaneScenery({ R, scen, prop: (kind, x, z, yaw, col) => out.props.push({ kind, x, z, yaw: yaw || 0, col: col || 0 }), excl: exclPush, root, out, ownTex, Y, garages: false });
      for (let d = -170; d <= 90; d += 8) for (const o of [22, 34, 48, 62, 76]) {   // no trees, no crowd from the pit wall out over the building and the paddock
        if (o > 30 && (d < -86 || d > 78)) continue; const [x, z] = At(sAt(d), o); exclPush(x, z, 10); }
      pitExcl(exclPush);
      nGar = pitBuilding();
    }
    // the pit building: 144 m along the lane, the start line in its middle. The ground floor, 5 m: the crews' 13 garages (10 m, open: World's
    // measures, out.pitBoxes[].gar, so that the renderer's team colours, door and flags fit; def.pitRow), offices at either end, a corridor
    // behind them with roller doors and windows to the paddock; on its flat roof a terrace behind white railings; over the start line the
    // race control, two floors of glass on the roof, the place's name on it, New Zealand's flags
    function pitBuilding() {
      const pm = T.pitAt(sStart), PO = pm ? pm.o : 14, F = PO + 12.5, b0 = PO + 19.7, BK = b0 + 3.2, RF = 5.0, PR = def.pitRow || [-65, 55], B0 = PR[0], B1 = PR[1] + 10, E = 7;   // (B1: the last box's garage's end, World's boxes from pitRow[0] to pitRow[1] + 10)
      const WALL = [0.94, 0.94, 0.92], DOOR = [0.74, 0.76, 0.78], SLAB = [0.95, 0.95, 0.94], ROOF = [0.62, 0.62, 0.6], RAIL = [0.96, 0.96, 0.95];
      const kb = (g, s, o, y, sx, sy, sz, col, top, nb) => { const [x, z, hd] = At(s, o); box(g, x, Y(s) + y, z, sx, sy, sz, hd, col, top, nb); };
      const kf = (g, d0, d1, o, y0, y1, col, dir) => { const [x0, z0] = At(sAt(d0), o), [x1, z1] = At(sAt(d1), o), sm = sAt((d0 + d1) / 2), [xb, zb] = At(sm, o - (dir || -1) * 0.2), dy = Y(sm);   // a flat panel facing the lane (dir -1) or the paddock (+1)
        g.quadO([x0, dy + y0, z0], [x1, dy + y0, z1], [x1, dy + y1, z1], [x0, dy + y1, z0], col, [xb, dy + (y0 + y1) / 2, zb]); };
      const CAB = [[0.2, 0.21, 0.24], [0.78, 0.14, 0.12], [0.15, 0.3, 0.62]], BLK = [0.13, 0.13, 0.15], SIL = [0.66, 0.68, 0.72], SCR = [0.16, 0.24, 0.38], CMP = [[0.86, 0.14, 0.12], [0.95, 0.8, 0.14], [0.92, 0.92, 0.9]];
      let k = 0;
      for (let a = B0; a < B1 - 0.1; a += 10, k++) {   // the crews' garages, open to the apron: the front pillars, the header over the door, the floor, the inside (World's measures)
        const sm = sAt(a + 5), g = scen.get(...At(sm, 28).slice(0, 2)), o = (F + b0) / 2;
        kb(g, sm, b0 - 0.15, 0, 10.02, RF, 0.3, WALL, null, true);
        for (const sd of [-1, 1]) { kb(g, sAt(a + 5 + sd * 4.885), o, 0, 0.25, RF, 7.2, WALL, null, true); kb(g, sAt(a + 5 + sd * 4.56), F + 0.15, 0, 0.9, 3.3, 0.3, WALL, null, true); }
        kb(g, sm, F + 0.15, 3.3, 10.02, RF - 3.3, 0.3, WALL);
        kb(g, sm, F - 0.02, 3.45, 9.4, 0.5, 0.05, [0.2, 0.21, 0.24]);                                              // the band (the renderer's team colour over it)
        kb(g, sm, o, 0, 9.52, 0.03, 6.9, [0.42, 0.44, 0.47], [0.5, 0.52, 0.55], true);                              // the epoxy floor
        kf(g, a + 0.25, a + 9.75, b0 - 0.302, 0.03, 1.28, [0.3, 0.31, 0.35]);
        kb(g, sm, b0 - 0.33, 1.7, 1.5, 0.85, 0.04, [0.07, 0.07, 0.08], null, true); kf(g, a + 4.31, a + 5.69, b0 - 0.352, 1.75, 2.5, SCR);   // the timing screen
        for (const ca of [1.3, 2.5, 7.5, 8.7]) { const s = sAt(a + ca); kb(g, s, b0 - 0.64, 0, 1.1, 0.1, 0.55, [0.08, 0.08, 0.09], null, true); kb(g, s, b0 - 0.64, 0.1, 1.15, 1.0, 0.6, CAB[(k + ca | 0) % 3], [0.1, 0.1, 0.11]);
          for (let dw = 0; dw < 4; dw++) { const y = 0.1 + (0.22 + dw * 0.2); kf(g, a + ca - 0.5, a + ca + 0.5, b0 - 0.945, y, y + 0.025, SIL); } }
        for (const ta of [0.85, 9.15]) { const s = sAt(a + ta), cmp = CMP[(k + (ta > 5 ? 1 : 0)) % 3]; const [x, z] = At(s, o - 0.6); cyl(g, x, Y(s) + 0.03, z, 0.36, 1.38, 8, BLK, [0.17, 0.17, 0.19]);
          for (let l = 0; l < 3; l++) cyl(g, x, Y(s) + 0.03 + (l + 0.42) * 0.46, z, 0.366, 0.074, 8, cmp); }
        for (const la of [-1.9, 1.9]) kb(g, sAt(a + 5 + la), o, RF - 0.1, 0.28, 0.07, 5.8, [0.98, 0.98, 0.94]);   // the strip lights
        kb(g, sm, (b0 + BK) / 2, 0, 10.02, RF, BK - b0 - 0.3, WALL, null, true);                                  // the corridor behind it
        if (k % 2 === 0) kf(g, a + 3.4, a + 6.6, BK + 0.02, 0, 3.6, DOOR, 1);                                      // a roller door to the paddock
        else kf(g, a + 0.8, a + 9.2, BK + 0.02, 2.4, 3.6, [0.24, 0.3, 0.38], 1);                                    // the high windows
      }
      for (const [d0, d1] of [[B0 - E, B0], [B1, B1 + E]]) {   // the offices at either end: white walls, windows to the lane and the paddock
        const sm = sAt((d0 + d1) / 2), g = scen.get(...At(sm, 28).slice(0, 2)), ym = Y(sm), [cx, cz] = At(sm, (F + BK) / 2);
        kb(g, sm, (F + BK) / 2, 0, d1 - d0, RF, BK - F, WALL, null, true);
        for (const o of [F - 0.04, BK + 0.04]) { const [x0, z0] = At(sAt(d0 + 0.8), o), [x1, z1] = At(sAt(d1 - 0.8), o); glassWall(x0, z0, x1, z1, ym + 1.0, ym + 3.6, [cx, ym + 2, cz]); }
      }
      // the flat roof over all of it in 8 m lengths: its slab, the terrace's white railings at the front and the back, the race control's two
      // floors of glass over the start line
      for (let a = B0 - E; a < B1 + E - 0.01; a += 8) {
        const e = Math.min(B1 + E, a + 8), sm = sAt((a + e) / 2), g = scen.get(...At(sm, 28).slice(0, 2));
        kb(g, sm, (F + BK) / 2, RF, e - a + 0.02, 0.35, BK - F + 0.5, SLAB, ROOF);
        for (const o of [F - 0.1, BK + 0.1]) { kb(g, sm, o, RF + 1.0, e - a + 0.02, 0.07, 0.07, RAIL); kb(g, sm, o, RF + 0.55, e - a + 0.02, 0.05, 0.05, RAIL);
          for (let p = a; p < e - 0.01; p += 2) kb(g, sAt(p), o, RF + 0.35, 0.06, 0.7, 0.06, RAIL, null, true); }
      }
      { const C0 = -10, C1 = 10, FH = 3.4, y1 = RF + 0.35, top = y1 + 2 * FH, sm = sAt(0), g = scen.get(...At(sm, 28).slice(0, 2)), ym = Y(sm), f0 = F + 1.2, f1 = BK - 1.0, [cx, cz] = At(sm, (f0 + f1) / 2), ins = [cx, ym + y1 + FH, cz];
        const c = [[C0, f0], [C1, f0], [C1, f1], [C0, f1]].map(([d, o]) => At(sAt(d), o));
        for (let q = 0; q < 4; q++) { const A = c[q], B = c[(q + 1) % 4]; glassWall(A[0], A[1], B[0], B[1], ym + y1, ym + top, ins); }
        for (let f = 0; f <= 2; f++) kb(g, sm, (f0 + f1) / 2, y1 - 0.3 + f * FH, C1 - C0 + 0.3, 0.32, f1 - f0 + 0.3, SLAB, f === 2 ? ROOF : SLAB);   // the slabs' edges, the roof
        kb(g, sm, f0 + 0.1, top + 0.02, C1 - C0 + 0.3, 0.8, 0.2, SLAB, null, true);   // the parapet
        const i = T.idx(sm), [bx, bz] = At(sm, f0 - 0.3); board(bx, ym + top + 0.7, bz, SD * T.nx[i], SD * T.nz[i], 14, 2.2, AT.cro);
        for (const da of [-60, -30, 30, 60]) { const ss = sAt(da), [px, pz] = At(ss, F + 1.0); flagPole(px, Y(ss) + RF + 0.35, pz, T.hd[T.idx(ss)] + Math.PI * 0.5, 5); } }
      for (let d = B0 - E; d <= B1 + E; d += 8) { const [x, z] = At(sAt(d), (F + BK) / 2); CR.block(x, z, 9, BK - F + 2, T.hd[T.idx(sAt(d))]); }
      return Math.round((B1 - B0) / 10);
    }

    /* ---- the paddock behind the pit building: its asphalt, the teams' trucks with their trailers (awnings out on the building's side),
       vans and motorhomes in a row behind them, cars ---- */
    let nTrucks = 0, nCars = 0;
    if (PP) {
      const gp = new RB(true), pc = [1, 1, 1]; let pr = -1;
      const at = (d, o) => [S0[0] + mtx * d + mnx * o, S0[1] + mtz * d + mnz * o];   // (the straight's frame; o out towards the pits)
      for (let d = PAD.d0; d <= PAD.d1 + 0.01; d += 4) { let ps = [PAD.o0 - 1, (PAD.o0 + PAD.o1) / 2, PAD.o1].map(o => { const [x, z] = at(d, o); return [x, cwGround(x, z) + 0.05, z]; });
        if (SD < 0) ps = ps.reverse();   // (rows from left to right: facing up)
        const r = gp.row(ps, [pc, pc, pc], ps.map(p => [p[0] / 8, -p[2] / 8])); if (pr >= 0) gp.link(pr, r, 0, 2); pr = r; }
      addM(gp, new THREE.MeshLambertMaterial({ map: tex.asphalt, color: 0xc8c8c4 }));
      const hdM = Math.atan2(mtz, mtx), sg = -msg * SD;   // (sg: the trucks' side towards the building)
      const truck = (d, o, col) => {   // a tractor and its trailer, its side towards the building: the awning out over a table on that side
        const [x, z] = at(d, o), y = cwGround(x, z), g = scen.get(x, z), hd = hdM, c = Math.cos(hd), sn = Math.sin(hd), aw = (a, b) => [x + c * a - sn * b * sg, z + sn * a + c * b * sg];
        const [tx, tz] = aw(-1.6, 0); box(g, tx, y + 0.9, tz, 13.2, 3.1, 2.55, hd, col, [0.9, 0.9, 0.9]);
        const [cx, cz] = aw(6.6, 0); box(g, cx, y + 0.6, cz, 2.6, 3.0, 2.5, hd, vary(col, R, 0.08), [0.2, 0.22, 0.25]);
        box(g, tx, y + 0.25, tz, 12.4, 0.65, 2.3, hd, [0.14, 0.14, 0.15], null, true);
        const [ax, az] = aw(-1.6, 2.55); box(g, ax, y + 3.7, az, 11, 0.08, 2.6, hd, [0.9, 0.9, 0.88]);
        for (const a of [-6.6, 3.4]) { const [px, pz] = aw(a, 3.75); box(g, px, y, pz, 0.08, 3.72, 0.08, hd, [0.7, 0.71, 0.73], null, true); }
        const [bx, bz] = aw(-1.6, 2.3); box(g, bx, y + 0.72, bz, 1.8, 0.05, 0.8, hd, [0.92, 0.92, 0.9]);
        CR.block(x, z, 17, 6.5, hd); nTrucks++;
      };
      const vanAt = (d, o, col, kind) => { const [x, z] = at(d, o), y = cwGround(x, z), g = scen.get(x, z), hd = hdM;
        if (kind === 0) { box(g, x, y + 0.35, z, 5.6, 2.1, 2.0, hd, col, [0.88, 0.88, 0.88]); box(g, x + Math.cos(hd) * 2.3, y + 1.15, z + Math.sin(hd) * 2.3, 0.9, 0.7, 2.02, hd, [0.16, 0.2, 0.26], null, true); }
        else { box(g, x, y + 0.4, z, 8.2, 2.8, 2.45, hd, [0.95, 0.95, 0.93], [0.84, 0.84, 0.82]); box(g, x, y + 1.2, z, 8.22, 0.35, 2.47, hd, col, null, true); box(g, x + Math.cos(hd) * 3.4, y + 1.7, z + Math.sin(hd) * 3.4, 1.2, 0.8, 2.47, hd, [0.16, 0.2, 0.26], null, true); }
        CR.block(x, z, kind ? 8.6 : 6, 2.8, hd); nCars++; };
      for (let d = -68, k = 0; d < 62; d += 15, k++) { if (crH(d, 7, 61) < 0.15) continue; truck(d, 44, TEAM[(k * 5 + 2) % TEAM.length]); }   // the trucks along the back of the building
      for (let d = -72, k = 0; d < 66; d += 9.5, k++) { if (crH(d, 8, 62) < 0.25) continue; vanAt(d, 59, TEAM[(k * 3 + 1) % TEAM.length], crH(d, 9, 63) < 0.55 ? 1 : 0); }   // motorhomes and vans in the row behind
      for (let d = -74; d < 66; d += 5.2) { if (crH(d, 10, 64) < 0.3) continue; const [x, z] = at(d, 76 + (crH(d, 11, 65) - 0.5) * 1.5), y = cwGround(x, z);
        parkedCar(scen.get(x, z), x, y, z, hdM + Math.PI / 2 + (crH(d, 12, 66) - 0.5) * 0.2, vary([[0.92, 0.92, 0.9], [0.12, 0.13, 0.15], [0.62, 0.64, 0.66], [0.62, 0.12, 0.1], [0.18, 0.28, 0.5]][Math.floor(crH(d, 13, 67) * 5)], R, 0.05)); nCars++; }
      for (let d = PAD.d0; d <= PAD.d1; d += 12) for (const o of [50, 72]) { const [x, z] = at(d, o); exclPush(x, z, 15); }
      for (let d = -60, k = 0; d < 60; d += 15, k++) { if (crH(d, 14, 68) < 0.4) continue; const [x, z] = at(d + 2, 40.5); person(x, cwGround(x, z), z, mnx, mnz, TEAM[(k * 5 + 2) % TEAM.length], 0, true); }   // a few mechanics by the trucks
      for (const d of [-76, 76]) { const [x, z] = at(d, 39); flagPole(x, cwGround(x, z), z, hdM + Math.PI * 0.5, 8); }
    }

    /* ---- the buildings by the circuit (sk.bld, OSM, as boxes): the circuit's own near the track (dark cladding, a band of glass), the
       halls and the sheds (sheet walls, low roofs of corrugated iron), the larger buildings (a base of schist, cladding above, a flat roof),
       the houses ---- */
    let nBld = 0, nHouse = 0;
    const WB = [[0.95, 0.94, 0.9], [0.93, 0.9, 0.8], [0.84, 0.86, 0.86], [0.76, 0.82, 0.86], [0.9, 0.88, 0.84]], BRK = [[0.64, 0.4, 0.28], [0.7, 0.46, 0.32], [0.58, 0.36, 0.26]];   // weatherboards (white, cream, pale grey, pale blue), the newer houses' brick
    const IRON = [[0.6, 0.16, 0.12], [0.22, 0.34, 0.24], [0.2, 0.21, 0.23], [0.66, 0.68, 0.7]], SHEET = [[0.82, 0.83, 0.82], [0.62, 0.66, 0.6], [0.88, 0.86, 0.8], [0.7, 0.72, 0.74]], SCHIST = [0.56, 0.53, 0.47];   // corrugated iron: red, green, charcoal, zincalume
    const bungalow = (g, x, z, y0, Lb, Wb, ang, near) => {   // a bungalow: weatherboard (or brick) walls, a gable roof of corrugated iron, a chimney
      const brick = crH(x, z, 42) < 0.35, wc = brick ? BRK[Math.floor(crH(x, z, 43) * BRK.length)] : WB[Math.floor(crH(x, z, 43) * WB.length)], rc = IRON[Math.floor(crH(x, z, 44) * IRON.length)];
      box(g, x, y0 - 0.4, z, Lb, 3.2, Wb, ang, wc, null, true); gable(g, x, y0 + 2.8, z, Lb + 0.8, Wb + 1.0, Math.min(2.4, Wb * 0.32), ang, rc, wc);
      if (near && crH(x, z, 45) < 0.5) { const c = Math.cos(ang), s = Math.sin(ang), a = Lb * 0.28, b = Wb * 0.18; box(g, x + c * a - s * b, y0 + 2.4, z + s * a + c * b, 0.6, 2.6, 0.6, ang, brick ? BRK[1] : SCHIST, [0.3, 0.3, 0.3]); }
    };
    const shed = (g, x, z, y0, Lb, Wb, ang) => {   // a shed or a store: walls and roof of sheet
      const wc = SHEET[Math.floor(crH(x, z, 53) * SHEET.length)]; box(g, x, y0 - 0.4, z, Lb, 3.6, Wb, ang, wc, null, true); gable(g, x, y0 + 3.2, z, Lb + 0.6, Wb + 0.8, 1.0, ang, IRON[Math.floor(crH(x, z, 54) * IRON.length)], wc);
    };
    const B7 = sk.bld || [];
    for (let k = 0; k + 6 < B7.length; k += 7) {
      const x = B7[k], z = B7[k + 1], Lb = B7[k + 2], Wb = B7[k + 3], ang = B7[k + 4] * Math.PI / 180, H = B7[k + 5] || 6, kind = B7[k + 6], rd = nrDist(x, z);
      if (paddock(x, z) || excluded(x, z)) continue;
      { const bd = mD(x, z), bl = mL(x, z); if (PP && bl > 18 && bl < 42 && bd > -72 - Lb / 2 && bd < 72 + Lb / 2) continue; }   // (by the pit building: ours)
      const g = rd < 170 ? scen.get(x, z) : farB.get(x, z), y0 = groundMin(x, z, Lb, Wb, ang), c = Math.cos(ang), s = Math.sin(ang), at = (a, b) => [x + c * a - s * b, z + s * a + c * b];
      if (rd < 70 && Lb * Wb < 900) {   // the circuit's own (the offices, the workshops, the kiosks): dark cladding, a band of windows, a flat roof
        const Hb = clamp(H, 3.6, 8), ins = [x, y0 + Hb / 2, z];
        box(g, x, y0 - 0.4, z, Lb, Hb + 0.4, Wb, ang, [0.22, 0.23, 0.25], [0.5, 0.5, 0.5]);
        box(g, x, y0 + Hb, z, Lb + 0.1, 0.45, Wb + 0.1, ang, [0.16, 0.16, 0.18], [0.46, 0.46, 0.46]);
        for (const b of [-1, 1]) { const [x0, z0] = at(-Lb / 2 + 1, b * (Wb / 2 + 0.04)), [x1, z1] = at(Lb / 2 - 1, b * (Wb / 2 + 0.04)); glassWall(x0, z0, x1, z1, y0 + 0.9, y0 + Math.min(2.7, Hb - 0.6), ins); }
      } else if (kind === 4 || kind === 5 || Lb * Wb > 600) {   // a hall: walls of sheet, a low roof of corrugated iron, skylights high up
        const sc = IRON[Math.floor(crH(x, z, 47) * IRON.length)], wc = SHEET[Math.floor(crH(x, z, 48) * SHEET.length)], Hb = Math.max(4, H);
        box(g, x, y0 - 0.4, z, Lb, Hb + 0.4 - 0.8, Wb, ang, wc, null, true); gable(g, x, y0 + Hb - 0.8, z, Lb + 0.5, Wb + 0.5, Math.min(1.8, Wb * 0.1), ang, sc, wc);
        if (Lb > 40 && rd < 400) { const ins = [x, y0 + Hb / 2, z]; for (const b of [-1, 1]) { const [x0, z0] = at(-Lb / 2 + 3, b * (Wb / 2 + 0.04)), [x1, z1] = at(Lb / 2 - 3, b * (Wb / 2 + 0.04)); glassWall(x0, z0, x1, z1, y0 + Hb - 2.6, y0 + Hb - 1.4, ins, [0.8, 0.84, 0.88]); } }
      } else if (kind === 6 || kind === 9 || Lb * Wb > 260) {   // a larger building: a base of schist, cladding above, a flat roof, bands of windows
        const Hb = Math.max(H, 5), floors = Math.max(1, Math.floor((Hb - 1) / 3.2)), ins = [x, y0 + Hb / 2, z], wc = WB[Math.floor(crH(x, z, 49) * WB.length)];
        box(g, x, y0 - 0.4, z, Lb, Hb + 0.4, Wb, ang, wc, [0.6, 0.6, 0.59]); box(g, x, y0 - 0.4, z, Lb + 0.06, 1.6, Wb + 0.06, ang, SCHIST, null, true);
        for (const b of [-1, 1]) { const [x0, z0] = at(-Lb / 2 + 1.2, b * (Wb / 2 + 0.05)), [x1, z1] = at(Lb / 2 - 1.2, b * (Wb / 2 + 0.05));
          for (let f = 0; f < floors; f++) glassWall(x0, z0, x1, z1, y0 + 1.4 + f * 3.2, y0 + 2.8 + f * 3.2, ins); }
        box(g, x, y0 + Hb, z, Lb + 0.1, 0.6, Wb + 0.1, ang, wc, [0.6, 0.6, 0.59]);
      } else if (Lb * Wb > 140 && crH(x, z, 46) < 0.4) shed(g, x, z, y0, Lb, Wb, ang);
      else bungalow(g, x, z, y0, Lb, Wb, ang, rd < 170);
      CR.block(x, z, Lb + 2, Wb + 2, ang); exclPush(x, z, Math.hypot(Lb, Wb) / 2 + 2); nBld++;
    }
    // the houses (def.sk.hs: WorldCover's built-up, a house in a 16 m cell): bungalows (most), sheds; their rows the same way in a block of 48 m
    { const H2 = sk.hs || [];
      for (let k = 0; k + 1 < H2.length; k += 2) {
        const x = H2[k], z = H2[k + 1]; if (excluded(x, z) || paddock(x, z)) continue;
        const rd = nrDist(x, z); if (rd < 30) continue;
        const near = rd < 170, g = near ? scen.get(x, z) : farB.get(x, z), t = crH(x, z, 41), ang = crH(Math.floor(x / 48), Math.floor(z / 48), 31) * Math.PI + (crH(x, z, 49) - 0.5) * 0.1;
        let Lb, Wb;
        if (t < 0.78) { Lb = 11 + crH(x, z, 50) * 6; Wb = 8 + crH(x, z, 51) * 3; bungalow(g, x, z, groundMin(x, z, Lb, Wb, ang), Lb, Wb, ang, rd < 110); }
        else { Lb = 12 + crH(x, z, 50) * 8; Wb = 7 + crH(x, z, 51) * 4; shed(g, x, z, groundMin(x, z, Lb, Wb, ang), Lb, Wb, ang); }
        exclPush(x, z, Math.hypot(Lb, Wb) / 2 + 1); CR.block(x, z, Lb + 1, Wb + 1, ang); nHouse++;
      } }

    // the roads round the circuit (OSM: the highway and the lanes, the circuit's service roads; not on the track itself): asphalt ribbons on
    // the ground; the circuit's other ways (sk.lk: the links of its shorter layouts) its asphalt; the speedway's clay oval (sk.dt) in red-brown
    // clay; the karting track (sk.kart), asphalt with white edges and red and white kerbs in its bends
    let nKart = 0, nLink = 0, nDirt = 0;
    { const gr = new GB(true), gd = new GB(true), one = [0.92, 0.92, 0.9], dirt = [0.98, 0.76, 0.6];
      const strip = (g, xs, k0, hw, col, y) => {   // a ribbon along the points xs[k0], xs[k0 + 1], ... (half width hw), cut where it meets the circuit
        for (let k = k0; k + 3 < xs.length; k += 2) { const ax = xs[k], az = xs[k + 1], bx = xs[k + 2], bz = xs[k + 3], l = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(l / 6));
          for (let m = 0; m < n; m++) { const x0 = ax + (bx - ax) * m / n, z0 = az + (bz - az) * m / n, x1 = ax + (bx - ax) * (m + 1) / n, z1 = az + (bz - az) * (m + 1) / n, nx = -(z1 - z0) / (l / n), nz = (x1 - x0) / (l / n);
            if (nrNear(x0, z0).dd < 1.5 || nrNear(x1, z1).dd < 1.5 || paddock(x0, z0)) continue;
            const P0 = [x0 - nx * hw, cwGround(x0 - nx * hw, z0 - nz * hw) + y, z0 - nz * hw], P1 = [x0 + nx * hw, cwGround(x0 + nx * hw, z0 + nz * hw) + y, z0 + nz * hw], P2 = [x1 + nx * hw, cwGround(x1 + nx * hw, z1 + nz * hw) + y, z1 + nz * hw], P3 = [x1 - nx * hw, cwGround(x1 - nx * hw, z1 - nz * hw) + y, z1 - nz * hw];
            const uv = (p) => [p[0] / 8, -p[2] / 8]; g.quadUp(P0, P1, P2, P3, [col, col, col, col], [uv(P0), uv(P1), uv(P2), uv(P3)]);
            if (m % 3 === 0) { exclPush((x0 + x1) / 2, (z0 + z1) / 2, hw + 2.5); CR.block((x0 + x1) / 2, (z0 + z1) / 2, l / n + 1, hw * 2 + 2, Math.atan2(z1 - z0, x1 - x0)); } } } };
      for (const rr of sk.road || []) strip(gr, rr, 1, rr[0] / 2, one, 0.06);
      for (const l of sk.lk || []) { strip(gr, l, 0, 4.6, one, 0.07); nLink++; }
      for (const l of sk.dt || []) { strip(gd, l, 0, 6, dirt, 0.05); nDirt++; }
      const gl = new GB(), gk = new GB(true);
      for (const kt of sk.kart || []) {
        const closed = kt[0] === 1, pts = []; for (let k = 1; k + 1 < kt.length; k += 2) pts.push([kt[k], kt[k + 1]]);
        const n = pts.length, hw = closed ? 4 : 3, last = closed ? n : n - 1;
        const nrm = (k) => { const a = pts[closed ? (k - 1 + n) % n : Math.max(0, k - 1)], b = pts[closed ? (k + 1) % n : Math.min(n - 1, k + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; };
        const turn = (k) => { if (!closed && (k === 0 || k === n - 1)) return 0; const a = pts[(k - 1 + n) % n], b = pts[k], c = pts[(k + 1) % n], u = Math.atan2(b[1] - a[1], b[0] - a[0]), v = Math.atan2(c[1] - b[1], c[0] - b[0]); let t = v - u; while (t > Math.PI) t -= TAU; while (t < -Math.PI) t += TAU; return t; };
        let acc = 0;
        for (let k = 0; k < last; k++) {
          const j = (k + 1) % n, A = pts[k], B = pts[j], na = nrm(k), nb = nrm(j), l = Math.hypot(B[0] - A[0], B[1] - A[1]);
          const Q = (p, nn, o, h) => [p[0] + nn[0] * o, cwGround(p[0] + nn[0] * o, p[1] + nn[1] * o) + h, p[1] + nn[1] * o], uv = (p) => [p[0] / 8, -p[2] / 8];
          const a0 = Q(A, na, -hw, 0.07), a1 = Q(A, na, hw, 0.07), b1 = Q(B, nb, hw, 0.07), b0 = Q(B, nb, -hw, 0.07);
          gr.quadUp(a0, a1, b1, b0, [one, one, one, one], [uv(a0), uv(a1), uv(b1), uv(b0)]);
          for (const sd of [-1, 1]) gl.quadUp(Q(A, na, sd * (hw - 0.35), 0.085), Q(A, na, sd * (hw - 0.15), 0.085), Q(B, nb, sd * (hw - 0.15), 0.085), Q(B, nb, sd * (hw - 0.35), 0.085), [wl, wl, wl, wl]);
          const ta = turn(k), tb = turn(j);
          if (Math.abs(ta) > 0.3 || Math.abs(tb) > 0.3) { const sd = (ta + tb) > 0 ? 1 : -1, v0 = acc / 2, v1 = (acc + l) / 2;   // the kerb on the inside of the bend
            const c0 = Q(A, na, sd * hw, 0.09), c1 = Q(A, na, sd * (hw + 1.0), 0.06), c2 = Q(B, nb, sd * (hw + 1.0), 0.06), c3 = Q(B, nb, sd * hw, 0.09);
            gk.quadUp(c0, c1, c2, c3, [W1, W1, W1, W1], [[0, v0], [1, v0], [1, v1], [0, v1]]); }
          acc += l; if (k % 2 === 0) exclPush((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, hw + 4); CR.block((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, l + 1, hw * 2 + 3, Math.atan2(B[1] - A[1], B[0] - A[0]));
        }
        nKart++;
      }
      addM(gr, aMat); addM(gl, lMat); addM(gk, cMat);
      addM(gd, new THREE.MeshLambertMaterial({ map: tex.makadam || tex.asphalt, vertexColors: true })); }

    /* ---- the grandstand across the straight from the pits (def.stands): its rows climbing away from the track behind the wall, three
       sections, the crowd on the seats, the hall under its back rows, a roof on pillars at the back reaching out over the rows, the place's
       name on its fascia ---- */
    let nStands = 0;
    for (const [a0, a1, sd, rowsMax, roof, secs] of ST) {
      const sec = (a1 - a0) / secs, dep = 0.85, seat = [0.12, 0.2, 0.46];
      let mid = null;
      for (let q = 0; q < secs; q++) {
        const d0 = a0 + q * sec + (q ? 0.7 : 0), d1 = a0 + (q + 1) * sec - (q < secs - 1 ? 0.7 : 0);
        for (let d = d0; d < d1 - 0.01; d += 6) {
          const e = Math.min(d1, d + 6), dm = (d + e) / 2, s0 = sAt(d), s1 = sAt(e), sm = sAt(dm), i = T.idx(sm), bar = sd > 0 ? T.br[i] : T.bl[i];
          const o0 = bar + 2.4, far = o0 + rowsMax * dep + 2, rows = Math.min(rowsMax, Math.floor((far - o0 - 2.5) / dep)); if (rows < 3) continue;
          const g = scen.get(...atSf(sm, sd * (o0 + 6)).slice(0, 2)), y0 = Y(sm) - 0.1;
          for (let t = 0; t < rows; t++) { const oa = o0 + t * dep, ob = oa + dep, hgt = 0.7 + t * 0.42, [x, z, hd] = atSf(sm, sd * (oa + dep / 2));
            box(g, x, y0, z, e - d + 0.02, hgt, dep, hd, [0.62, 0.63, 0.66], seat);
            const A = atSf(s0, sd * oa), Bq = atSf(s1, sd * oa), C = atSf(s1, sd * ob), D = atSf(s0, sd * ob), yy = y0 + hgt + 0.02, u1 = (e - d) / 12;
            const pts = sd < 0 ? [D, C, Bq, A] : [A, Bq, C, D];
            crowdG.quadUp(...pts.map(p => [p[0], yy, p[1]]), [W1, W1, W1, W1], [[0, t * 0.11], [u1, t * 0.11], [u1, t * 0.11 + 0.1], [0, t * 0.11 + 0.1]]); }
          const top = 0.7 + rows * 0.42, ob = o0 + rows * dep, back = Math.max(ob + 0.5, far), [bx, bz, bh] = atSf(sm, sd * (ob + back) / 2);
          box(g, bx, y0, bz, e - d + 0.02, top + 0.5, back - ob, bh, [0.86, 0.86, 0.84], [0.7, 0.7, 0.69]);   // the hall under the back rows
          if (roof) { const ry = y0 + top + 3.0, r0 = o0 + rows * dep * 0.22, r1 = back + 0.6, [rx, rz] = atSf(sm, sd * (r0 + r1) / 2);
            box(g, rx, ry, rz, e - d + 0.04, 0.35, r1 - r0, bh, [0.9, 0.91, 0.92], [0.72, 0.74, 0.76]);
            const [px, pz] = atSf(sm, sd * (back - 0.4)); box(g, px, y0 + top, pz, 0.4, ry - y0 - top, 0.4, bh, [0.84, 0.85, 0.87]);
            if (!mid || Math.abs(dm - (a0 + a1) / 2) < Math.abs(mid.dm - (a0 + a1) / 2)) mid = { dm, r0, ry, rows }; }
        }
      }
      for (let d = a0; d <= a1; d += 6) { const [x, z, i] = onSide(sAt(d), sd, 4); CR.block(x, z, 7, rowsMax * dep + 6, T.hd[i]); exclPush(...atSf(sAt(d), sd * 14).slice(0, 2), 16); }
      if (mid) { const sm = sAt(mid.dm), i = T.idx(sm), [fx, fz] = atSf(sm, sd * (mid.r0 - 0.15)); board(fx, mid.ry - 1.3, fz, T.nx[i] * sd, T.nz[i] * sd, 16, 1.6, AT.cro);
        for (const dd of [-28, 28]) { const s = sAt(mid.dm + dd), [px, pz] = atSf(s, sd * (mid.r0 + 1)); flagPole(px, mid.ry + 0.35, pz, T.hd[T.idx(s)] + Math.PI * 0.5, 5); } }
      for (let ii = T.idx(sAt(a0 - 8)), n = 0; n < (a1 - a0 + 16) / ds; n++, ii = (ii + 1) % N) fence[side2(sd)][ii] = 1;
      nStands++;
    }

    /* ---- marshal posts (white huts on the outside of the corners, two marshals in orange by each, one with a flag), the TV towers at the
       loops and the hairpins, place names by the straights (the braking boards are World's: brakeBoards), the sponsors over the rails ---- */
    let nPosts2 = 0, nTV = 0;
    {
      const free = (x, z, r) => !excluded(x, z) && nrSlope(x, z) < 0.45 && nrNear(x, z).dd > r && sea.d(x, z) < -4;
      const place = (d0, side, extra, r) => { for (const dd of [0, 10, -10, 20, -20, 34, -34]) { const p = onSide(sAt(d0 + dd), side, extra); if (free(p[0], p[1], r)) return p; } return null; };
      const outside = (d) => { let k = 0; for (let e = -40; e <= 40; e += 4) k += T.k[T.idx(sAt(d + e))]; return k > 0 ? -1 : 1; };
      const hut = (x, z, i, side) => { const y = cwGround(x, z), g = scen.get(x, z), hd = T.hd[i], nx = T.nx[i] * side, nz = T.nz[i] * side;
        box(g, x, y - 0.3, z, 2.1, 0.5, 1.9, hd, [0.55, 0.56, 0.58]); box(g, x, y + 0.2, z, 1.9, 2.1, 1.7, hd, [0.95, 0.95, 0.93], null, true);
        box(g, x - nx * 0.2, y + 2.3, z - nz * 0.2, 2.3, 0.14, 2.3, hd, [0.16, 0.3, 0.22], [0.2, 0.34, 0.26]);
        box(g, x - nx * 0.86, y + 1.0, z - nz * 0.86, 1.3, 0.7, 0.06, hd, [0.18, 0.24, 0.32], null, true); exclPush(x, z, 3.5); CR.avoid(x, z, 1.6); };
      const marked = [];
      for (const c of T.corners) { if (c.sev < 2) continue; const d = dS(c.i0 * ds); if (marked.some(m => Math.abs(m - d) < 160 || Math.abs(m - d) > L - 160)) continue;
        const side = outside(d + 10), p = place(d + 10, side, 3.0, 2.5); if (!p) continue; marked.push(d);
        const [x, z, i] = p; hut(x, z, i, side); nPosts2++;
        const fx = -T.nx[i] * side, fz = -T.nz[i] * side, [mx, mz] = onSide(i * ds, side, 1.1), y = cwGround(mx, mz);
        person(mx + T.tx[i] * 2.4, y, mz + T.tz[i] * 2.4, fx, fz, [0.98, 0.5, 0.08], 5, true); person(mx - T.tx[i] * 1.0, y, mz - T.tz[i] * 1.0, fx, fz, [0.98, 0.5, 0.08], 0, true); }
      const grey = [0.6, 0.62, 0.64], dark = [0.17, 0.18, 0.2], plank = [0.42, 0.34, 0.24];
      for (const [n, dd] of [['Jugovzhodna zanka', 20], ['Zanka ob kartingu', 10], ['Zahodna lasnica', 10], ['Severna lasnica', 10]]) {   // the TV towers
        const d = nameD(n); if (d == null) continue;
        let side = outside(d + dd), p = place(d + dd, side, 6.0, 4);
        if (!p) { side = -side; p = place(d + dd, side, 6.0, 4); } if (!p) continue;
        const [x, z, i] = p, g = scen.get(x, z), y = cwGround(x, z), H = 4.2, hd = T.hd[i], c = Math.cos(hd), sn = Math.sin(hd), at = (a, b) => [x + c * a - sn * b, z + sn * a + c * b];
        for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const [lx, lz] = at(a, b); cyl(g, lx, y - 0.1, lz, 0.07, H + 1.15, 5, grey); }
        for (const hy of [1.4, 2.8]) for (const [a, b, rot] of [[0, -1, 0], [0, 1, 0], [-1, 0, Math.PI / 2], [1, 0, Math.PI / 2]]) { const [lx, lz] = at(a, b); box(g, lx, y + hy, lz, 2.0, 0.07, 0.07, hd + rot, grey); }
        box(g, x, y + H, z, 2.6, 0.16, 2.6, hd, plank, [0.5, 0.41, 0.3]);
        for (const [a, b, rot] of [[0, -1.25, 0], [0, 1.25, 0], [-1.25, 0, Math.PI / 2], [1.25, 0, Math.PI / 2]]) { const [lx, lz] = at(a, b); box(g, lx, y + H + 0.95, lz, 2.5, 0.06, 0.06, hd + rot, grey); }
        { const [lx, lz] = at(0.6, 0.6 * side); cyl(g, lx, y + H, lz, 0.04, 2.5, 4, grey); cone(g, lx, y + H + 2.15, lz, 1.35, 0.5, 8, [0.92, 0.94, 0.95], [0.1, 0.12, 0.2], 0); }   // the parasol
        const tf = -side, [cx, cz] = at(0, 0.55 * tf), [mx, mz] = at(0.1, -0.35 * tf), ny = T.nx[i] * tf, nz = T.nz[i] * tf;
        for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; cyl(g, cx + Math.cos(a) * 0.28, y + H + 0.08, cz + Math.sin(a) * 0.28, 0.025, 1.25, 3, dark, null, 0.02); }
        box(g, cx, y + H + 1.3, cz, 0.72, 0.36, 0.3, Math.atan2(nz, ny), dark, [0.25, 0.26, 0.28]);
        person(mx, y + H + 0.08, mz, ny, nz, [0.1, 0.12, 0.16], 3, true);
        exclPush(x, z, 4.5); CR.avoid(x, z, 2.4); nTV++;
      }
      for (const [d0, cell] of [[760, AT.cro], [1720, AT.otago], [3860, AT.nz]]) { const s = sAt(d0), side = roomSide(s); signPost(s, side, 1.8, cell, 3.6, 0.9, 1.3); }
      for (const [a, b] of [[760, 980], [1680, 1940], [3800, 3960]]) for (const side of [-1, 1]) for (let dd = a, k = 0; dd < b; dd += 15, k++) {   // the sponsors over the rails along the straights
        const s = sAt(dd), i = T.idx(s); if (kindAt(i, side) !== 0) continue;
        const [x, z] = onSide(s, side, 0.35), y = T.hy[i] + 0.78;
        board(x, y, z, T.nx[i] * side, T.nz[i] * side, 9.6, 0.82, AT.sp + ((k + (side > 0 ? 3 : 0) + Math.floor(a / 7)) % 8));
      }
    }

    /* ---- the pond in the west loop (def.sk.sea: World's water from js/world-rbring.js), flax on its banks, rushes in the shallows ---- */
    const wst = { water: 0, reeds: 0, flax: 0 };
    sea.water({ root, tex, exclPush, CR, out }, wst, CW_SEA);
    const rc = new IChunks(cwRushGeo(), new THREE.MeshLambertMaterial({ vertexColors: true }), 256), fx = new IChunks(cwFlaxGeo(), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), 256);
    { const S = sk.sea;
      if (S) { const x1 = S.x0 + (S.nx - 1) * S.cell, z1 = S.z0 + (S.nz - 1) * S.cell, clump = nrPN(24, 6240);
        for (let z = S.z0; z < z1; z += 2.0) for (let x = S.x0; x < x1; x += 2.0) {
          const px = x + (R() - 0.5) * 2, pz = z + (R() - 0.5) * 2, d = sea.d(px, pz);
          if (d < -4 || d > 7 || nrDist(px, pz) > 170 || clump((px - S.x0) / 800, (pz - S.z0) / 800) < 0.3 || wst.reeds + wst.flax > 900) continue;
          const gy = nrGround(px, pz); if (gy > S.lv + 0.6 || gy < S.lv - 1.2 || nrNear(px, pz).dd < 3) continue;
          if (d < 0.4) { if (R() > 0.4) continue; const h = 1.2 + R() * 0.7, cv = 0.9 + R() * 0.15; fx.add(px, gy - 0.05, pz, R() * TAU, h * 1.5, h, [cv, cv, cv * 0.95]); wst.flax++; }   // flax on the bank
          else { const h = 1.5 + R() * 0.9, cv = 0.9 + R() * 0.15; rc.add(px, Math.max(gy, S.lv) - 0.3, pz, R() * TAU, h * 1.3, h, [cv, cv, cv * 0.95]); wst.reeds++; } } } }
    rc.addTo(root, false); fx.addTo(root, false);

    /* ---- spectators: a few groups on the grass at the chicane, the esses and the hairpins (World's fewFans keeps few of them on a real
       circuit); chain link in front of them ---- */
    let nFans = 0;
    { const hard = (x, z) => excluded(x, z) || sea.d(x, z) > -3;
      const M = { first: 2.2, gap: 1.2, excluded: hard, below: 3, above: 8, sit: 0.3, flag: 0.08 };
      const run = (d0, d1, side, o) => { const n = crowdRun(CR, sAt(d0), sAt(d1), side, Object.assign({}, M, o));
        if (n) for (let ii = T.idx(sAt(d0 - 6)), k = 0; k < (d1 - d0 + 12) / ds; k++, ii = (ii + 1) % N) if (!fence[side2(side)][ii]) fence[side2(side)][ii] = 1; nFans += n || 0; return n; };
      for (const [n, half, rows] of [['Šikana', 30, 2], ['Esi', 24, 1], ['Južna lasnica', 24, 1], ['Severna lasnica', 26, 2]]) { const d = nameD(n); if (d == null) continue;
        const side = roomSide(sAt(d)); run(d - half, d + half, side, { rows, dens: 0.45, label: 'CW ' + n }); }
      for (const e of CR.circ) exclPush(e.x, e.z, e.r); }
    // catch fences (chain link on posts) behind the walls, the tyre walls and wherever the spectators stand
    const fenceC = new Chunks(256, true);
    for (const side of [-1, 1]) {
      const fcs = fence[side2(side)], bar = side > 0 ? T.br : T.bl; let acc = 0;
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N, kI = kindAt(i, side), kJ = kindAt(j, side);
        if (!fcs[i] || !fcs[j] || kI < 0 || kJ < 0 || kI === 3 || kJ === 3 || (side === SD && PP && T.pitAt(i * ds))) { acc += ds; continue; }
        const e = fcs[i] === 2 ? 1.25 : 0.55, Q = (ii, y) => { const o = side * (bar[ii] + e); return [T.px[ii] + T.nx[ii] * o, T.hy[ii] + y, T.pz[ii] + T.nz[ii] * o]; };
        const u0 = acc / 2.5, u1 = (acc + ds) / 2.5, ins = Q(i, 1); ins[0] += T.nx[i] * side * 3; ins[2] += T.nz[i] * side * 3;
        const q0 = Q(i, 0.9); fenceC.get(q0[0], q0[2]).quadO(q0, Q(j, 0.9), Q(j, 3.8), Q(i, 3.8), W1, ins, [[u0, 0], [u1, 0], [u1, 1.15], [u0, 1.15]]);
        if (i % 3 === 0) { const p = Q(i, 0); box(scen.get(p[0], p[2]), p[0], p[1] - 0.2, p[2], 0.1, 4.05, 0.1, T.hd[i], [0.6, 0.61, 0.64]); }
        acc += ds;
      }
    }

    /* ---- the trees: the plantations (radiata pine, copses of poplars, broom and briar along their edges, the cheaper crowns farther than
       60 m from the road), the shelter belts of poplars, pines and macrocarpa along the paddocks' and the orchards' edges, a briar now and
       then on the dry grass, willows by the pond, the yards' trees; the orchards' rows of small trees and the vineyards' rows (lc 2, in
       blocks of 160 m). The ground under the crowns turns to needles (G.cov) ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const WIND = { value: 0 }; out.dyn.wind = WIND;   // the crowns sway a little, each tree in its own rhythm (the higher up, the more)
    tMat.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = WIND;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
        '#ifdef USE_INSTANCING\nfloat wPh = instanceMatrix[3].x * 0.07 + instanceMatrix[3].z * 0.05;\n#else\nfloat wPh = 0.0;\n#endif\n' +
        'float wK = position.y * position.y * 0.02;\ntransformed.x += wK * sin( uWind * 1.1 + wPh );\ntransformed.z += wK * 0.6 * sin( uWind * 0.83 + wPh * 1.7 );');
    };
    tMat.customProgramCacheKey = () => 'nrTreeWind';
    const TG = [cwTreeGeo(0), cwTreeGeo(1), cwTreeGeo(2), null, cwTreeGeo(4)], ich = (g) => g && new IChunks(g, tMat, 128);
    const tk = TG.map(ich), tn = TG.map(ich);   // near the road: poplar, pine, macrocarpa, -, willow (tk within 30 m of the road casting shadows, tn farther out without)
    const tb = new IChunks(cwTreeGeo(3), tMat, 128);   // the shrubs (no shadows)
    const tf = [new IChunks(cwTreeGeo(5), tMat, 192), new IChunks(cwTreeGeo(6), tMat, 192)];   // farther out: poplar, pine
    const to = new IChunks(cwTreeGeo(7), tMat, 192);   // the orchards' trees
    const tv = new IChunks(cwVineGeo(), new THREE.MeshLambertMaterial({ vertexColors: true }), 256);   // the vineyards' rows
    let nTrees = 0, nOrch = 0, nVine = 0;
    {
      const Lt = NRC * NRT, maxT = Math.round(60000 * dens), CRW = [0.3, 0.36, 0.45, 0.5, 0.45, 0, 0, 0];   // (crown radius / width)
      const plant = (sp, far, x, z, hgt, wid, c) => {
        if (excluded(x, z) || paddock(x, z) || sea.d(x, z) > -1.5) return false;
        const y = cwGround(x, z) - 0.1, rot = crH(x, z, 88) * TAU;
        if (sp === 3) tb.add(x, y, z, rot, wid, hgt, c); else if (sp === 7) to.add(x, y, z, rot, wid, hgt, c); else if (far && sp < 3) tf[sp ? 1 : 0].add(x, y, z, rot, wid, hgt, c); else (nrDist(x, z) < 30 ? tk : tn)[sp].add(x, y, z, rot, wid, hgt, c);   // (a macrocarpa far out: the far pine's crown)
        if (CRW[sp]) nrShade(x, z, wid * CRW[sp], sp === 1 || sp === 2 ? 0.9 : 0.6); nTrees++; return true; };
      const nearOk = (x, z, rd, r2) => { if (rd >= 48) return true; const nn = nrNear(x, z); return !(nn.i >= 0 && (nn.dd < 3.4 || (nn.dd < 7 && r2 < 0.4))); };
      const copse = nrPN(12, 6270);   // (where the woods are poplars instead of pines: patches)
      const brkU = (x, z) => (x * 0.8 + z * 0.6) / 120, brkV = (x, z) => (-x * 0.6 + z * 0.8) / 80;   // (the paddocks' shelter belts: 120 x 80 m)
      const onBreak = (x, z) => { const u = brkU(x, z), v = brkV(x, z), fu = (u - Math.floor(u)) * 120, fv = (v - Math.floor(v)) * 80;
        if ((fu < 1.7 || fu > 118.3) && crH(Math.round(u), Math.floor(v), 77) < 0.45) return true; return (fv < 1.7 || fv > 78.3) && crH(Math.floor(u), Math.round(v), 78) < 0.35; };
      for (let tj = 0; tj < G.ntz && nTrees < maxT; tj++) for (let ti = 0; ti < G.ntx && nTrees < maxT; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za + 1.7; zz < za + Lt; zz += 3.4) for (let xx = xa + 1.7; xx < xa + Lt; xx += 3.4) {
          const rd = nrDist(xx, zz); if (rd > 250) continue;
          const cl = nrLC(xx, zz), far = rd > 60, h1 = crH(xx, zz, 81), jx = xx + (crH(xx, zz, 82) - 0.5) * 2.2, jz = zz + (crH(xx, zz, 83) - 0.5) * 2.2;
          if (cl === 1) {   // the woods: radiata pine at most spots (far out every other one), poplars in patches, shrubs at the edges
            if (h1 > 0.6 || (far && (Math.round(xx / 3.4) + Math.round(zz / 3.4)) & 1) || !nearOk(jx, jz, rd, h1)) continue;
            const e = nrEdge(xx, zz), pc = copse((xx - G.x0) / 900, (zz - G.z0) / 900) > (inCircuit(xx, zz) ? 0.45 : 0.64), cv = 0.88 + crH(xx, zz, 86) * 0.22;
            if (!far && crH(xx, zz, 89) < e * 0.35) { const hgt = 1.6 + crH(xx, zz, 85) * 1.2; plant(3, false, jx, jz, hgt, hgt * 1.4, [1, 1, 1]); continue; }
            if (pc) { const hgt = 16 + crH(xx, zz, 85) * 8; plant(0, far, jx, jz, hgt, hgt * 0.25, [cv, cv, cv * 0.96]); continue; }
            const hgt = 16 + crH(xx, zz, 85) * 10; plant(1, far, jx, jz, hgt, hgt * 0.5, [cv, cv, cv]);
            continue;
          }
          if (far && rd > 170) continue;
          { const sd = sea.d(xx, zz); if (sd > -16 && sd < -4 && h1 < 0.1 && nearOk(jx, jz, rd, 1)) { const hgt = 8 + crH(xx, zz, 90) * 5; plant(4, false, jx, jz, hgt, hgt * 1.0, [1, 1, 1]); continue; } }   // the willows by the pond
          if ((cl === 0 || cl === 2) && rd > 26 && onBreak(xx, zz) && !inCircuit(xx, zz) && nearOk(jx, jz, rd, 1)) {   // the shelter belts: poplars, pines, macrocarpa
            const t = crH(xx, zz, 87);
            if (t < 0.55) { const hgt = 18 + crH(xx, zz, 88) * 8; plant(0, far, xx, zz, hgt, hgt * 0.24, [1, 1, 1]); }
            else if (t < 0.85) { const hgt = 14 + crH(xx, zz, 88) * 8; plant(1, far, xx, zz, hgt, hgt * 0.5, [1, 1, 1]); }
            else { const hgt = 11 + crH(xx, zz, 88) * 6; plant(2, far, xx, zz, hgt, hgt * 0.8, [1, 1, 1]); }
            continue; }
          if (far) continue;
          const e = cl === 0 || cl === 2 ? nrEdge(xx, zz) : 0;
          if (e > 0 && h1 < e * 0.1 && nearOk(jx, jz, rd, h1 * 6)) {   // the woods' edge: macrocarpa, pines, shrubs
            const t = crH(xx, zz, 87), sp = t < 0.35 ? 2 : t < 0.6 ? 1 : 3, hgt = sp === 2 ? 10 + crH(xx, zz, 88) * 6 : sp === 1 ? 14 + crH(xx, zz, 88) * 8 : 1.6 + crH(xx, zz, 88) * 1.2;
            plant(sp, false, jx, jz, hgt, hgt * [0, 0.5, 0.8, 1.4][sp], [1, 1, 1]); continue; }
          if (cl === 0 && h1 > 0.985 && rd > 16 && !inCircuit(xx, zz) && nearOk(jx, jz, rd, 1)) { const hgt = 1.2 + crH(xx, zz, 93) * 1.2; plant(3, false, jx, jz, hgt, hgt * 1.5, [1, 1, 1]); continue; }   // a briar on the dry grass
          if (cl === 3 && h1 < 0.03 && nearOk(jx, jz, rd, 1)) { const t = crH(xx, zz, 94), hgt = t < 0.4 ? 9 + crH(xx, zz, 95) * 6 : t < 0.7 ? 8 + crH(xx, zz, 95) * 4 : 16 + crH(xx, zz, 95) * 6;   // the yards' trees
            plant(t < 0.4 ? 2 : t < 0.7 ? 4 : 0, false, jx, jz, hgt, t < 0.4 ? hgt * 0.8 : t < 0.7 ? hgt : hgt * 0.24, [1, 1, 1]); }
        }
      }
      // the orchards and the vineyards: rows along a block's side (east-west or north-south), headlands of 4 m round it; the orchards' trees
      // 3.6 m apart in rows 6.4 m apart (beyond 60 m from the road every other one), the vines' bays of 6.8 m in rows 2.8 m apart (to 90 m)
      const BKS = 160, bx0 = Math.floor(P.x0 / BKS), bx1 = Math.floor(P.x1 / BKS), bz0 = Math.floor(P.z0 / BKS), bz1 = Math.floor(P.z1 / BKS), maxV = Math.round(3200 * dens);
      for (let b = bz0; b <= bz1; b++) for (let a = bx0; a <= bx1; a++) {
        const p = crH(a, b, 301); if (p >= 0.8) continue;
        const orch = p < 0.55, ori = crH(a, b, 302) < 0.5, rs = orch ? 6.4 : 2.8, ps = orch ? 3.6 : 6.8, lim = orch ? 120 : 90;
        if (nrDist((a + 0.5) * BKS, (b + 0.5) * BKS) > lim + 116) continue;
        for (let r = 4 + rs / 2, ri = 0; r < BKS - 4; r += rs, ri++) for (let q = 4 + ps / 2, qi = 0; q < BKS - 4; q += ps, qi++) {
          const x = a * BKS + (ori ? r : q), z = b * BKS + (ori ? q : r);
          if (nrLC(x, z) !== 2) continue; const rd = nrDist(x, z); if (rd < 20 || rd > lim) continue;
          if (excluded(x, z) || paddock(x, z) || sea.d(x, z) > -2 || nrSlope(x, z) > 0.3) continue;
          if (orch) { if (rd > 60 && (ri + qi) & 1) continue; const hgt = 3.2 + crH(x, z, 303) * 1.3, cv = 0.9 + crH(x, z, 304) * 0.2; if (plant(7, false, x + (crH(x, z, 305) - 0.5) * 0.3, z + (crH(x, z, 306) - 0.5) * 0.3, hgt, hgt * 0.95, [cv, cv, cv * 0.95])) nOrch++; }
          else if (nVine < maxV) { const cv = 0.88 + crH(x, z, 307) * 0.22; tv.add(x, cwGround(x, z) - 0.05, z, ori ? Math.PI / 2 : 0, 1, 0.9 + crH(x, z, 308) * 0.2, [cv, cv, cv * 0.95]); nVine++; }
        }
      }
    }
    for (const t of tk) if (t) t.addTo(root, true);
    for (const t of tn) if (t) t.addTo(root, false);
    tb.addTo(root, false);
    for (const t of tf) t.addTo(root, false);
    to.addTo(root, true); tv.addTo(root, false);
    // the tussock on the dry open grass, 5-100 m from the road (not on the circuit's irrigated lawns, the yards or the fields), in clumps
    let nTus = 0;
    { const tus = new IChunks(cwTussockGeo(), new THREE.MeshLambertMaterial({ vertexColors: true }), 256), clump = nrPN(16, 6280), Lt = NRC * NRT, maxU = Math.round(4000 * dens);
      for (let tj = 0; tj < G.ntz && nTus < maxU; tj++) for (let ti = 0; ti < G.ntx && nTus < maxU; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za + 1.5; zz < za + Lt; zz += 3.0) for (let xx = xa + 1.5; xx < xa + Lt; xx += 3.0) {
          const rd = nrDist(xx, zz); if (rd < 5 || rd > 100 || nrLC(xx, zz) !== 0) continue;
          const h1 = crH(xx, zz, 401); if (h1 > 0.1 + 0.36 * sstep(0.35, 0.7, clump((xx - G.x0) / 700, (zz - G.z0) / 700))) continue;
          const jx = xx + (crH(xx, zz, 402) - 0.5) * 2.4, jz = zz + (crH(xx, zz, 403) - 0.5) * 2.4;
          if (excluded(jx, jz) || paddock(jx, jz) || sea.d(jx, jz) > -3) continue;
          const nn = nrNear(jx, jz); if (nn.i >= 0 && nn.dd < 4) continue;
          if (irr(jx, jz, nn.i >= 0 ? nn.dd : 99, rd) > 0.35 || nrLCf(jx, jz, 3) > 0.1) continue;
          const s = 0.55 + crH(xx, zz, 404) * 0.6, cv = 0.86 + crH(xx, zz, 405) * 0.24;
          tus.add(jx, cwGround(jx, jz) - 0.04, jz, crH(xx, zz, 406) * TAU, s * 1.3, s, [cv, cv * 0.98, cv * 0.94]); nTus++;
        }
      }
      tus.addTo(root, false); }

    /* ---- terrain tiles and the grass verges out past the barriers (256 m chunks), coloured now: the verge mown short and green by the road,
       easing into the land's own colour behind the barrier; the patch of ground behind the lower leg's walls under the bridge ---- */
    let nTiles = 0, nPatch = 0;
    {
      const grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let k = 0; k < tiles.length; k += 3) { const m = new THREE.Mesh(nrTileGeo(tiles[k], tiles[k + 1], tiles[k + 2] === 1 ? 1 : 4), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); nTiles++; }
      const vA = [LAWN[0] * 1.02, LAWN[1] * 1.02, LAWN[2] * 1.02], vB = [LAWN[0] * 0.97, LAWN[1] * 0.97, LAWN[2] * 0.97];
      for (let c0 = 0; c0 < N; c0 += CH) {
        const gv = new RB(true), pv = [-1, -1];
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
          const i = ii % N, dk = onDeck((i - 1 + N) % N);
          for (const side of [-1, 1]) {
            const si = side2(side), vr = cwVerge(i, side), pts = vr.map(([o, h]) => Pt(i, side * o, h)), nL = pts.length;
            const g3 = nrGCol(pts[nL - 2][0], pts[nL - 2][2]).slice(), g4 = nrGCol(pts[nL - 1][0], pts[nL - 1][2]).slice();
            const cols = [vA, vA, vB, [lerp(vB[0], g3[0], 0.5), lerp(vB[1], g3[1], 0.5), lerp(vB[2], g3[2], 0.5)], g4];
            const ordered = side > 0 ? { p: pts, c: cols } : { p: pts.slice().reverse(), c: cols.slice().reverse() };
            const rv = gv.row(ordered.p, ordered.c, ordered.p.map(p => [p[0] / 14, -p[2] / 14]));
            if (pv[si] >= 0 && !dk) gv.link(pv[si], rv, 0, nL - 1); pv[si] = rv;
          }
        }
        addM(gv, gMat);
      }
      if (CX) {   // the patch: rows along the lower leg 50 m either side of the crossing, from the wall's back (or 3 m past the barrier) out to 44 m
        const pMat = gMat.clone(); pMat.polygonOffset = true; pMat.polygonOffsetFactor = -1; pMat.polygonOffsetUnits = -2;
        const gp = new RB(true), PF = [0, 0.04, 0.1, 0.18, 0.28, 0.4, 0.54, 0.7, 0.85, 1], il = Math.round(CX.lo);
        for (const side of [-1, 1]) {
          let pr = -1;
          for (let k = -PT / 2; k <= PT / 2; k++) {
            const i = ((il + k) % N + N) % N, bar = side > 0 ? T.br[i] : T.bl[i], uIn = bar + (trench(i) ? 0.5 : 3.0);
            let pts = PF.map(f => { const u = uIn + (PU - uIn) * f, x = T.px[i] + T.nx[i] * side * u, z = T.pz[i] + T.nz[i] * side * u; return [x, patchH(x, z), z]; });
            let cols = pts.map(p => nrGCol(p[0], p[2]).slice()), uvs = pts.map(p => [p[0] / 14, -p[2] / 14]);
            if (side < 0) { pts = pts.reverse(); cols = cols.reverse(); uvs = uvs.reverse(); }
            const r = gp.row(pts, cols, uvs); if (pr >= 0) gp.link(pr, r, 0, PF.length - 1); pr = r; nPatch++;
          }
        }
        const pm = addM(gp, pMat); if (pm) pm.renderOrder = 1;
      }
      G.col = G.cov = P.edge = null;   // (build only)
    }

    /* ---- farther out (sk.lm): the power lines, lattice towers and concrete poles. Most of them beyond what the camera draws (out.farClip:
       the fog's far edge): in the vertex shader each point farther than 0.7 of the camera's far plane is drawn on that sphere in its own
       direction (the same place and size in the picture: before the horizon's ring, rsFar, at 0.72-0.74; the nearer things drawn over it),
       in the fog of that distance. One mesh, never culled ---- */
    const lms = { pylons: 0, poles: 0 };
    { const fg = new GB(), FX = def.far ? def.far.x : 0, FZ = def.far ? def.far.z : 0;
      for (const pl of LM.pw || []) {   // the pylons: lattice towers, the legs narrowing to the waist, the cross-arms for the conductors; the poles (within 2.6 km)
        const cab = pl[0], tw = []; for (let k = 1; k + 2 < pl.length; k += 3) tw.push([pl[k], pl[k + 1], pl[k + 2]]);
        const H = 42, st = [0.6, 0.62, 0.65];
        tw.forEach((p, k) => {
          if (Math.hypot(p[0] - FX, p[1] - FZ) > 2600) return;
          const a = tw[Math.max(0, k - 1)], b = tw[Math.min(tw.length - 1, k + 1)], dl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, lx = (b[0] - a[0]) / dl, lz = (b[1] - a[1]) / dl, cx = -lz, cz = lx;   // (along the line, across it)
          const [x, z, y] = p;
          if (cab < 6) { cyl(fg, x, y - 1, z, 0.22, 12.5, 6, [0.74, 0.73, 0.7], null, 0.13); box(fg, x, y + 10.8, z, 3.0, 0.16, 0.14, Math.atan2(cz, cx), [0.62, 0.6, 0.56]); lms.poles++; return; }
          const b0 = H * 0.1, wst = 1.4, yw = y + H * 0.66, yt = y + H, C = (s, t, r, yy) => [x + (lx * s + cx * t) * r, yy, z + (lz * s + cz * t) * r];
          for (const [s, t] of [[1, 1], [1, -1], [-1, -1], [-1, 1]]) { beam(fg, C(s, t, b0, y - 1), C(s, t, wst, yw), 0.18, st); beam(fg, C(s, t, wst, yw), C(s, t, 0.5, yt), 0.14, st); }
          for (const [s0, t0, s1, t1] of [[1, 1, -1, -1], [1, -1, -1, 1]]) { beam(fg, C(s0, t0, b0 * 0.75, y + H * 0.08), C(s1, t1, b0 * 0.45, y + H * 0.36), 0.1, st); beam(fg, C(s0, -t0, b0 * 0.75, y + H * 0.08), C(s1, -t1, b0 * 0.45, y + H * 0.36), 0.1, st); }
          for (const f of [0.7, 0.82, 0.94]) { const ya = y + H * f, aw = H * (f > 0.9 ? 0.15 : 0.2); beam(fg, [x - cx * aw, ya, z - cz * aw], [x + cx * aw, ya, z + cz * aw], 0.2, st); }
          lms.pylons++;
        });
      }
      if (!fg.empty) {
        const FR = { value: 480 }, FC = { value: new THREE.Vector3() }, fm = new THREE.MeshLambertMaterial({ vertexColors: true });   // (the camera's place our own uniform: three r128 gives cameraPosition to a Lambert material only with an envMap)
        fm.onBeforeCompile = (sh) => { sh.uniforms.uFarR = FR; sh.uniforms.uFarC = FC;
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uFarR;\nuniform vec3 uFarC;').replace('#include <begin_vertex>', '#include <begin_vertex>\n{ vec3 cwV = transformed - uFarC; float cwD = length( cwV ); if ( cwD > uFarR ) transformed = uFarC + cwV * ( uFarR / cwD ); }'); };
        fm.customProgramCacheKey = () => 'cwFar';
        const m = new THREE.Mesh(fg.geometry(), fm); m.frustumCulled = false; m.matrixAutoUpdate = false; m.name = 'cwFar';
        m.onBeforeRender = (rd, sc, cam) => { if (cam && cam.isPerspectiveCamera && cam.far > 50) { FR.value = cam.far * 0.7; FC.value.setFromMatrixPosition(cam.matrixWorld); } };
        root.add(m);
      }
    }
    if (def.far && API.rsFar) out.dyn.far = API.rsFar(root, def.far, 'summer', 6, cwFarCol);   // the ranges on the horizon (World.update: no car, back where it was built)

    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    farB.addTo(sceneryGroup, matV, false, true);
    glass.addTo(sceneryGroup, new THREE.MeshLambertMaterial({ map: glassTex, vertexColors: true }), false, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: atlas })); if (bm) bm.castShadow = false;
    addM(crowdG, crowdUV(new THREE.MeshLambertMaterial({ map: tex.crowd, vertexColors: true }), 1, 0.11, 0.1));
    fenceC.addTo(root, fMat, false, true);
    if (flagL.length) root.add(API.rbFlags(flagL, CR.U.uTime));
    crowdFinish(CR, root, out);
    out.stats = { tiles: nTiles, trees: nTrees, posts: nPosts, garages: nGar, buildings: nBld, houses: nHouse, stands: nStands, trucks: nTrucks, cars: nCars, fans: nFans, marshals: nPosts2, tv: nTV,
      flags: flagL.length, kart: nKart, links: nLink, dirt: nDirt, water: wst.water, reeds: wst.reeds, flax: wst.flax, pylons: lms.pylons, poles: lms.poles,
      deck: nDeck, walls: nWall, patch: nPatch, orchard: nOrch, vines: nVine, tussock: nTus };   // (read by the tests)
    return out;
  }

  World.keep('NR', 'cromwell');   // (its grids kept between its builds; World.build frees the others': tools/razdeli-proge.mjs)
  World.ext.cromwell = (scene, tex, opts) => buildCromwell(scene, tex, opts);
})();
