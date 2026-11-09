/* =========================================================================
   WORLD — Houli, Tajvan (theme 'houli'): the circuit on the Houli terrace north of Taichung, a builder of its own (World.ext.houli) on the
   corridor terrain of js/world.js (nrPrep and the nr* helpers: the Copernicus heights of def.dem on a 16 m grid, the land cover def.lc of
   OpenStreetMap, ESA WorldCover and the canopy). The second of the five circuits with a builder of their own (plan:
   docs/dirkalisca-celine.md, »Novih pet«; the pattern: js/world-parnu.js; the track: docs/proge/houli.md).
   Its own: the subtropical lawns, camphor trees and betel-nut palms in the woods round the circuit, bamboo by the villages, the vineyards and
   pear orchards on their trellises, the flower and rice fields on the terrace's red soil; the long race building over the pits (321 m: the
   crews' 13 garages open in the middle of its ground floor, the others shut, four floors of glass above them reaching out over the apron),
   the paddock behind it with the teams' trucks, the covered grandstand across the straight (its outline: def.sk.gs), the hotels by the
   chicane, the karting track in the infield; asphalt run-offs where the barriers stand far out (def.runoffTarmac), tyre walls round the
   slower corners, armco on posts, concrete along the pit straight; the villages' townhouses with water tanks on their roofs, farmhouses and
   sheds (def.sk.hs, sk.bld); farther out the amusement park's two big wheels and its rides, the high-speed railway on its viaduct and the
   power lines' pylons (sk.lm: drawn at their place in the picture though beyond what the camera draws), the hills on the horizon (def.far:
   Riverside's rsFar); Taiwan's flags (rbFlags: cols.canton). Of the shared parts only the low-level ones (terrain, crowds, flags, the
   horizon); the composition and the look its own. Only place names on its boards (no names of the circuit, its people, races, sponsors,
   the hotels or the park).
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

  const TW = [[0.86, 0.06, 0.09]]; TW.canton = [[0.05, 0.09, 0.52], [0.98, 0.98, 0.96]];   // Taiwan's flag (rbFlags: cols.canton): the red field, the blue canton, the white sun
  const TEAM = [[0.85, 0.16, 0.13], [0.16, 0.36, 0.8], [0.95, 0.95, 0.94], [0.18, 0.62, 0.3], [0.96, 0.72, 0.12], [0.14, 0.14, 0.16], [0.95, 0.45, 0.1], [0.5, 0.26, 0.7], [0.1, 0.62, 0.72], [0.85, 0.2, 0.5], [0.4, 0.42, 0.46], [0.2, 0.3, 0.55], [0.7, 0.1, 0.1]];
  const RIDE = [[0.85, 0.2, 0.15], [0.95, 0.74, 0.14], [0.16, 0.4, 0.8], [0.2, 0.64, 0.36], [0.9, 0.9, 0.92], [0.6, 0.26, 0.7]];

  // the lawn under the vertex colours (256 px = 14 m, tileable): carpet and Bermuda grass, a yellower green than a temperate meadow, short
  // blades, white clover and the yellow flowers of wood sorrel
  function hlGrassTex(aniso) {
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data, r = rng(5901);
    const n1 = nrPN(8, 5902), n2 = nrPN(24, 5903), n3 = nrPN(64, 5904);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const u = i / S, v = j / S, n = n1(u, v) * 0.3 + n2(u, v) * 0.4 + n3(u, v) * 0.3, k = 0.86 + n * 0.26 + (r() - 0.5) * 0.12, y = n2(u + 0.31, v + 0.57) - 0.5, o = (j * S + i) * 4;
      d[o] = clamp((86 + y * 16) * k, 0, 255); d[o + 1] = clamp((134 + y * 6) * k, 0, 255); d[o + 2] = clamp((50 + y * 2) * k, 0, 255); d[o + 3] = 255;
    }
    x.putImageData(img, 0, 0); const avg = pixAvg(d);
    x.lineWidth = 1;
    for (const [st, n] of [['rgba(40,78,26,0.42)', 900], ['rgba(176,192,96,0.36)', 560]]) {   // blades (drawn across the edges too: tileable)
      x.strokeStyle = st; x.beginPath();
      for (let k = 0; k < n; k++) { const px = r() * S, py = r() * S, dx = (r() - 0.5) * 2, dy = -(1.0 + r() * 2.0);
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const qx = px + a * S, qy = py + b * S; if (qx > -6 && qx < S + 6 && qy > -6 && qy < S + 6) { x.moveTo(qx, qy); x.lineTo(qx + dx, qy + dy); } } }
      x.stroke(); }
    for (const [st, n, sz] of [['#f2f2ea', 40, 1], ['#e8d040', 18, 1], ['#4f8a3a', 30, 2]]) { x.fillStyle = st; for (let k = 0; k < n; k++) x.fillRect(Math.floor(r() * (S - sz)), Math.floor(r() * (S - sz)), sz, sz); }   // clover, wood sorrel, clover leaves
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso || 4; t.grassPic = true; t.avgCol = avg; return t;
  }
  // unit trees (height 1, instances scale them): 0 a camphor tree (a short stout trunk, a broad dense crown of dark glossy green in soft
  // lumps), 1 a betel-nut palm (a slender grey trunk, a small tuft of fronds on its green crownshaft), 2 a clump of bamboo (pale culms, a tall
  // feathery mass leaning out), 3 a shrub (the hedges round the yards); 4, 5 the camphor and the palm far from the road (cheaper)
  function hlTreeGeo(kind) {
    const g = new GB(), R = rng(5910 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;   // (smooth normals; the flag restored below)
    const cg = [0.17, 0.3, 0.12], sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k], pg = [0.27, 0.42, 0.15], bb = [0.26, 0.41, 0.14];
    // a palm's crown: n fronds from the top of the crownshaft (y0), each a ridge rising and then drooping to its tip (seen from above: a star)
    const fronds = (n, y0, len, wd) => { for (let k = 0; k < n; k++) {
      const a = (k + R() * 0.5) / n * TAU, dx = Math.cos(a), dz = Math.sin(a), sx = -dz * wd, sz = dx * wd, l = len * (0.85 + R() * 0.3), C = [0, y0, 0];
      const P1 = [dx * l * 0.5, y0 + l * 0.12, dz * l * 0.5], P2 = [dx * l, y0 - l * (0.3 + R() * 0.25), dz * l], L1 = [P1[0] + sx, P1[1] - wd * 0.35, P1[2] + sz], R1 = [P1[0] - sx, P1[1] - wd * 0.35, P1[2] - sz];
      const c0 = sh(pg, 1.1), c1 = sh(pg, 0.95), c2 = sh(pg, 0.78), dn = (p) => [p[0], p[1] - 0.2, p[2]];
      g.triO(C, L1, P1, c0, dn(P1), c1, c0); g.triO(C, P1, R1, c0, dn(P1), c0, c1); g.triO(P1, L1, P2, c0, dn(P1), c1, c2); g.triO(P1, P2, R1, c0, dn(P1), c2, c1); } };
    if (kind === 0) {
      cyl(g, 0, -0.02, 0, 0.035, 0.42, 4, [0.36, 0.31, 0.26], null, 0.025);
      ico(g, 0, 0.6, 0, 0.36, 0.72, cg, R, 0.22); nrLump(g, 0.2, 0.64, 0.1, 0.22, 0.75, sh(cg, 1.12), R, 0.25); nrLump(g, -0.16, 0.8, -0.08, 0.2, 0.7, sh(cg, 1.05), R, 0.25);
    } else if (kind === 1) {
      cyl(g, 0, -0.02, 0, 0.012, 0.88, 4, [0.47, 0.46, 0.41], [0.44, 0.46, 0.38], 0.009);   // the slender ringed trunk
      cyl(g, 0, 0.85, 0, 0.013, 0.08, 4, [0.4, 0.54, 0.22], null, 0.012);   // the green crownshaft
      fronds(8, 0.93, 0.16, 0.035); ico(g, 0, 0.94, 0, 0.035, 0.8, sh(pg, 0.9), R, 0.3);   // the fronds, the young leaves in the middle
    } else if (kind === 2) {   // a clump of bamboo: a vase of foliage from low down, wider at the top, the culms showing at its foot
      for (let q = 0; q < 5; q++) { const a = q / 5 * TAU + R() * 0.5, d = 0.04 + R() * 0.05; cyl(g, Math.cos(a) * d, -0.02, Math.sin(a) * d, 0.009, 0.4 + R() * 0.2, 3, [0.5, 0.56, 0.26], null, 0.007); }
      ico(g, 0, 0.52, 0, 0.17, 2.4, bb, R, 0.3);   // (the culms' foliage leaning out all round: a fountain of green)
      for (let q = 0; q < 4; q++) { const a = (q + 0.3) / 4 * TAU + R() * 0.6, d = 0.17 + R() * 0.05; nrLump(g, Math.cos(a) * d, 0.6 + R() * 0.14, Math.sin(a) * d, 0.17 + R() * 0.04, 1.05, sh(bb, 0.92 + R() * 0.2), R, 0.35); }
    } else if (kind === 3) {
      ico(g, 0, 0.42, 0, 0.52, 0.72, [0.24, 0.4, 0.18], R, 0.3);
    } else if (kind === 4) {
      cyl(g, 0, -0.02, 0, 0.035, 0.42, 3, [0.36, 0.31, 0.26], null, 0.025); ico(g, 0, 0.62, 0, 0.4, 0.75, cg, R, 0.22);
    } else {
      cyl(g, 0, -0.02, 0, 0.013, 0.9, 3, [0.47, 0.46, 0.41], null, 0.01); fronds(5, 0.92, 0.16, 0.04);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function hlTrellisGeo() {   // a vineyard's or a pear orchard's trellis (unit 1 x 1 m, 1 high; the instances 10-13 m square, ~2 m high): the leafy roof on its posts
    const g = new GB(), ps = [0.5, 0.48, 0.44];
    for (const a of [-0.46, 0.46]) for (const b of [-0.46, 0.46]) box(g, a, 0, b, 0.02, 0.86, 0.02, 0, ps, null, true);
    box(g, 0, 0.82, 0, 1.0, 0.16, 1.0, 0, [0.2, 0.3, 0.12], [0.34, 0.48, 0.19]);
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  let hlATex = null;
  function hlAtlas() {   // text boards (4 x 16 cells of 256 x 64): place names, the start line's, the flag, the game's sponsors
    if (hlATex) hlATex.dispose();
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const cell = (k, bg, fg, txt, px, stripe) => { const cx = (k % 4) * 256, cy = Math.floor(k / 4) * 64; x.fillStyle = bg; x.fillRect(cx, cy, 256, 64); if (stripe) { x.fillStyle = stripe; x.fillRect(cx, cy + 56, 256, 8); x.fillRect(cx, cy, 256, 4); }
      x.fillStyle = fg; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, cx + 128, cy + 33, 240); };
    cell(4, '#d7141a', '#fff', 'HOULI', 46, '#fff'); cell(5, '#0b1d6e', '#fff', 'TAIWAN', 44, '#d7141a'); cell(6, '#16181c', '#fff', 'START · FINISH', 28, '#d7141a');
    cell(7, '#f4f4f0', '#0b1d6e', 'TAICHUNG', 40, '#d7141a');
    { const cx = 256, cy = 128; x.fillStyle = '#d7141a'; x.fillRect(cx, cy, 256, 64); x.fillStyle = '#0b1d6e'; x.fillRect(cx, cy, 96, 32);   // cell 9: Taiwan's flag (the paddock's banners)
      x.fillStyle = '#fff'; x.beginPath(); for (let k = 0; k < 24; k++) { const a = k / 24 * TAU, rr = k % 2 ? 6 : 12; x.lineTo(cx + 48 + Math.cos(a) * rr, cy + 16 + Math.sin(a) * rr); } x.fill();
      x.fillStyle = '#0b1d6e'; x.beginPath(); x.arc(cx + 48, cy + 16, 6.2, 0, TAU); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(cx + 48, cy + 16, 5.4, 0, TAU); x.fill(); }
    const SP = (typeof Tex !== 'undefined' && Tex.SPONSORS) || [['HITROLET', '#101418', '#ffd23f']];
    for (let k = 0; k < 8; k++) { const [txt, bg, fg] = SP[k % SP.length]; cell(40 + k, bg, fg, txt, 40, 'rgba(255,255,255,.14)'); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (hlATex = t);
  }
  const AT = { houli: 4, taiwan: 5, start: 6, taichung: 7, flag: 9, sp: 40 };
  // the curtain walls' glass (512 x 256 px = 12 x 7.6 m: four bays of two panes, two floors): the sky's grey-blue in the panes, lighter at
  // the top, blinds half down here and there, the spandrels and the slabs' edges in pale aluminium (u = metres along / 12, v = metres up / 7.6)
  function hlGlassTex() {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d'), r = rng(5960);
    x.fillStyle = '#c4cad0'; x.fillRect(0, 0, 512, 256);
    for (let fl = 0; fl < 2; fl++) for (let b = 0; b < 8; b++) {
      const px = b * 64 + 3, py = fl * 128 + 18, pw = 58, ph = 106, gr = x.createLinearGradient(0, py, 0, py + ph), t = r();
      gr.addColorStop(0, 'rgb(' + (150 + t * 20 | 0) + ',' + (170 + t * 18 | 0) + ',' + (188 + t * 14 | 0) + ')'); gr.addColorStop(0.55, 'rgb(' + (84 + t * 14 | 0) + ',' + (102 + t * 14 | 0) + ',' + (120 + t * 12 | 0) + ')');
      gr.addColorStop(1, 'rgb(' + (58 + t * 10 | 0) + ',' + (70 + t * 10 | 0) + ',' + (84 + t * 10 | 0) + ')');
      x.fillStyle = gr; x.fillRect(px, py, pw, ph);
      if (r() < 0.3) { x.fillStyle = 'rgba(226,224,214,0.85)'; x.fillRect(px, py, pw, ph * (0.2 + r() * 0.5)); }   // the blinds
      x.fillStyle = 'rgba(255,255,255,0.16)'; x.beginPath(); x.moveTo(px + pw * 0.2, py); x.lineTo(px + pw * 0.45, py); x.lineTo(px + pw * 0.1, py + ph); x.lineTo(px, py + ph); x.lineTo(px, py + ph * 0.6); x.closePath(); x.fill();   // a reflection
    }
    x.fillStyle = '#9aa2aa'; for (let fl = 0; fl < 2; fl++) x.fillRect(0, fl * 128, 512, 4);   // the slabs' edges
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  }
  // the verge's cross-section beyond the road edge ([offset, height above the road]), lifted onto the ground where it rises: the verges and
  // the knocked props' floor use the same rows
  function hlVerge(i, side) {
    const w = T.w, bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i], lift = (o, h) => { const q = side * o; return [o, Math.max(h, nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.06 - y)]; };
    return [[w, 0.0], [w + 1.2, -0.04], lift(Math.max(w + 1.8, bar - 0.4), -0.1), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)];
  }
  // the horizon (def.far, Riverside's rsFar): the terrace's farmland and villages, the forested hills to the east, in the humid haze
  const hlFarCol = (h, d) => {
    const c = h < 320 ? [0.34, 0.42, 0.28] : h < 900 ? [0.22, 0.33, 0.2] : [0.26, 0.34, 0.26], f = (1 - Math.exp(-d / 13000)) * 0.9;
    return c.map((v, k) => lerp(v, [0.76, 0.8, 0.84][k], f));
  };
  // a square bar from a to b (any direction; r its half width): the big wheels, the rides, the pylons
  function beam(g, a, b, r, col) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dx, dy, dz) || 1, ux = dx / l, uy = dy / l, uz = dz / l;
    let px = -uz, py = 0, pz = ux; if (Math.abs(uy) > 0.95) { px = 1; pz = 0; }
    const pl = Math.hypot(px, py, pz); px /= pl; py /= pl; pz /= pl;
    const qx = uy * pz - uz * py, qy = uz * px - ux * pz, qz = ux * py - uy * px, c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    const cr = (p, s, t) => [p[0] + (px * s + qx * t) * r, p[1] + (py * s + qy * t) * r, p[2] + (pz * s + qz * t) * r], S = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    for (let k = 0; k < 4; k++) { const [s0, t0] = S[k], [s1, t1] = S[(k + 1) % 4]; g.quadO(cr(a, s0, t0), cr(b, s0, t0), cr(b, s1, t1), cr(a, s1, t1), col, c); }
  }

  function buildHouli(scene, tex, opts) {
    const R = rng(5930), N = T.N, w = T.w, ds = T.ds, dens = opts.density || 1, sStart = T.startS, def = T.def, L = T.len, sk = def.sk || {}, LM = sk.lm || {};
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
    // the main straight's own frame (it is straight from the last corner to the first right: within 0.3 m of its chord): metres from the
    // start line along it (md) and to its right (ml); the race building, the paddock and the grandstand are laid out in it
    const MA = atSf(sAt(-150), 0), MB = atSf(sAt(380), 0), mLn = Math.hypot(MB[0] - MA[0], MB[1] - MA[1]), mtx = (MB[0] - MA[0]) / mLn, mtz = (MB[1] - MA[1]) / mLn;
    const S0 = atSf(sStart, 0), iS = S0[3], msg = (-mtz * T.nx[iS] + mtx * T.nz[iS]) > 0 ? 1 : -1, mnx = -mtz * msg, mnz = mtx * msg;
    const mD = (x, z) => (x - S0[0]) * mtx + (z - S0[1]) * mtz, mL = (x, z) => (x - S0[0]) * mnx + (z - S0[1]) * mnz;
    const mainD = (i) => { const d = dSs(i * ds); return d > -205 && d < 430; };   // (a sample on the main straight)
    // the paddock behind the race building (metres along the straight and out from it): asphalt from the building's back to 100 m out
    const PAD = { d0: -112, d1: 88, o0: 50, o1: 100 };
    const paddock = (x, z) => { const d = mD(x, z), l = mL(x, z); return d > PAD.d0 && d < PAD.d1 && l > PAD.o0 && l < PAD.o1; };
    // the ground level with the road from the pit wall out behind the race building and the paddock (the cars in the lane run at the road's
    // height), easing into the land beyond (the infield rises 12 m to the north straight); the same under the grandstand across the straight
    { const pad0 = (x, z, h) => { const i = NRN.i; if (i < 0) return h;
        const md = mD(x, z), ml = mL(x, z); if (md < -215 || md > 420 || Math.abs(ml) > 135) return h;
        const fo = mainD(i) ? 1 : sstep(12, 30, NRN.dd), fd = Math.min(sstep(-212, -182, md), sstep(415, 385, md)); if (fo * fd <= 0) return h;   // (by another part of the track: its own ground)
        let f = 0;
        if (ml > 0) { const reach = 30 + 74 * Math.min(sstep(-200, -168, md), sstep(282, 252, md)) - 20 * sstep(150, 178, md); f = 1 - sstep(reach, reach + 16, ml); }
        else for (const [a, b] of ST) f = Math.max(f, Math.min(sstep(a - 34, a - 10, md), sstep(b + 34, b + 10, md)) * (1 - sstep(66, 82, -ml)));
        f *= fo * fd; return f > 0 ? lerp(h, Y(sAt(md)) - 0.06, f) : h; };
      P.pad = sea.pad(pad0); }
    // the ground's colours (multiplying the lawn's map): the circuit's mown lawns, the rough grass outside it yellowing in patches (the dry
    // autumn), the woods' floor of leaf litter on the red soil (the trees' canopy, G.cov; beyond 250 m the land cover alone), the fields on
    // the terrace in parcels (rice green and golden, flowers in coloured rows, the vineyards' and orchards' ground under their trellises, bare
    // red soil), the villages' concrete yards, the paddock's asphalt, mown grass behind the barriers
    const gTex = ownTex(hlGrassTex(tex.grass.anisotropy)), AV = gTex.avgCol;
    const ab = (r, g, b) => [r / AV[0], g / AV[1], b / AV[2]];   // (an absolute colour as the vertex colour that makes it on the map)
    const ASPH = ab(0.36, 0.36, 0.35), YARD = ab(0.53, 0.52, 0.49), SOIL = ab(0.56, 0.35, 0.25), GOLD = ab(0.62, 0.56, 0.3), RICE = ab(0.34, 0.52, 0.2);
    const FLW = [ab(0.86, 0.84, 0.8), ab(0.85, 0.5, 0.6), ab(0.86, 0.76, 0.3), ab(0.7, 0.36, 0.42)];
    const parcel = (x, z) => crH(Math.floor((x * 0.8 + z * 0.6) / 34), Math.floor((-x * 0.6 + z * 0.8) / 22), 61);   // (the fields' parcels: 34 x 22 m, on a slant)
    P.colFn = (x, z, ny, dd, cov, o) => {
      const m = P.n3(x, z), q = P.n4(x, z), fo = nrLCf(x, z, 1), fi = nrLCf(x, z, 2), se = nrLCf(x, z, 3), op = 1 - fo - fi - se;
      let r = 1.0 + (m - 0.5) * 0.16 + (q - 0.5) * 0.1, g = 1.0 + (m - 0.5) * 0.12 + (q - 0.5) * 0.06, b = 0.98 + (m - 0.5) * 0.1;
      const dry = sstep(0.55, 0.8, P.n5(x, z)) * 0.55 * sstep(40, 90, nrDist(x, z)) * clamp(op + se, 0, 1); r += dry * 0.3; g += dry * 0.08; b -= dry * 0.16;   // the rough grass yellowing
      if (fi > 0.02) { const p = parcel(x, z), k = fi * 0.9; let c;   // the fields
        if (p < 0.28) c = lerp(0, 1, 0) === 0 ? [lerp(RICE[0], GOLD[0], P.n6(x, z)), lerp(RICE[1], GOLD[1], P.n6(x, z)), lerp(RICE[2], GOLD[2], P.n6(x, z))] : RICE;   // rice, green to golden
        else if (p < 0.5) { const fc = FLW[Math.floor(p * 97) % 4], row = 0.5 + 0.5 * Math.sin((x * 0.6 + z * 0.8) * 3.1); c = [lerp(RICE[0] * 0.9, fc[0], row), lerp(RICE[1] * 0.9, fc[1], row), lerp(RICE[2] * 0.9, fc[2], row)]; }   // flowers in rows
        else if (p < 0.82) c = [lerp(SOIL[0], RICE[0], 0.45) * 0.9, lerp(SOIL[1], RICE[1], 0.45) * 0.9, lerp(SOIL[2], RICE[2], 0.45) * 0.9];   // under the trellises: weeds on the red soil
        else c = [SOIL[0] * (0.94 + m * 0.1), SOIL[1] * (0.94 + m * 0.1), SOIL[2] * (0.94 + m * 0.1)];   // bare red soil, ploughed
        r = lerp(r, c[0], k); g = lerp(g, c[1], k); b = lerp(b, c[2], k); }
      const fl = Math.max(clamp(cov, 0, 1), fo * lerp(0.35, 1, sstep(225, 250, nrDist(x, z))));   // the woods' floor: leaf litter on the red soil
      r = lerp(r, 0.86 + m * 0.14, fl); g = lerp(g, 0.68 + m * 0.1, fl); b = lerp(b, 0.56, fl);
      if (se > 0.02) { const k = se * 0.6; r = lerp(r, YARD[0], k); g = lerp(g, YARD[1], k); b = lerp(b, YARD[2], k); }   // the villages' yards
      if (dd < 5) { const t = sstep(5, 0.5, dd); r = lerp(r, 0.97, t); g = lerp(g, 1.07, t); b = lerp(b, 0.94, t); }   // mown behind the barriers
      if (paddock(x, z)) { r = ASPH[0]; g = ASPH[1]; b = ASPH[2]; }   // the paddock (its asphalt drawn over it: no green at its edge)
      o[0] = r; o[1] = g; o[2] = b; return o;
    };
    out.bounds = { minX: P.x0, maxX: P.x1, minZ: P.z0, maxZ: P.z1 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 64;   // tree exclusion circles (buildings, stands, crowds), hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); } };
    const excluded = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (let k = 0; k < Lc.length; k++) { const e = Lc[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };

    /* ---- terrain tiles: which ones (they are built at the end, when the trees have darkened the ground under them) ---- */
    const gMat = new THREE.MeshLambertMaterial({ map: gTex, vertexColors: true }), tiles = [];
    for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { const on = nrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; tiles.push(ti, tj, on); }

    /* ---- road: asphalt (a darker rubbered line, more so in the braking zones), white edge lines, red and white kerbs ---- */
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
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB(true), gl = new RB(), gk = new RB(true);
      let pr = -1, pl = -1; const pk = [-1, -1];
      for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
        const i = ii % N, v = ii * ds / tileL;
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o)), offs.map(o => [(o + w) / tileL, v]));
        if (pr >= 0) gr.link(pr, r, 0, offs.length - 1); pr = r;
        const wl = [0.95, 0.95, 0.92], l = gl.row([Pt(i, -w + 0.15, 0.034), Pt(i, -w + 0.45, 0.034), Pt(i, w - 0.45, 0.034), Pt(i, w - 0.15, 0.034)], [wl, wl, wl, wl]);
        if (pl >= 0) { gl.link(pl, l, 0, 1); gl.link(pl, l, 2, 3); } pl = l;
        for (const side of [-1, 1]) {
          const si = side2(side);
          if (kerb[si][i]) {   // a red and white kerb in 1 m blocks: a sloped inner edge, a flat top, a low outer lip
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
          const j = (i + 1) % N; if (!flag[i] && !flag[j]) continue;
          const fi = flag[i] ? 1 : 0, fj = flag[j] ? 1 : 0, inI = w + (K[i] ? T.curbW : 0.05), inJ = w + (K[j] ? T.curbW : 0.05);
          const outI = lerp(inI + 0.1, bar[i] - 0.7, fi), outJ = lerp(inJ + 0.1, bar[j] - 0.7, fj);
          if (outI < inI + 0.05 && outJ < inJ + 0.05) continue;
          const uvp = (p) => [p[0] / 8, -p[2] / 8], a = Pt(i, side * inI, 0.028), b = Pt(i, side * outI, 0.028), c = Pt(j, side * outJ, 0.028), d = Pt(j, side * inJ, 0.028);
          rc.get(a[0], a[2]).quadUp(a, b, c, d, [roC(a), roC(b), roC(c), roC(d)], [uvp(a), uvp(b), uvp(c), uvp(d)]);
          if (fi && fj) { const e0 = Math.min(outI, inI + 2.2), e1 = Math.min(outJ, inJ + 2.2);   // the green band just outside the kerb
            gb.get(a[0], a[2]).quadUp(Pt(i, side * (inI + 0.9), 0.034), Pt(i, side * e0, 0.034), Pt(j, side * e1, 0.034), Pt(j, side * (inJ + 0.9), 0.034), [grn, grn, grn, grn]); }
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

    /* ---- barriers: concrete along the pit wall and the whole straight's left (in front of the grandstand), tyre walls round the outside of the
       slower corners' run-offs, armco on posts elsewhere; none where the pit lane leaves and joins the circuit ---- */
    const lw = (i) => { const d = dSs(i * ds); return d > -160 && d < 400; };   // the main straight's left
    const tyreOn = [new Uint8Array(N), new Uint8Array(N)];
    for (const c of T.corners) { if (c.sev < 2) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, si = side2(-c.dir);
      for (let k = c.i0 - 8; k <= i1c + 12; k++) { const ii = ((k % N) + N) % N; if ((si ? T.gravR : T.gravL)[ii]) tyreOn[si][ii] = 1; } }
    const kindAt = (i, side) => {   // -1 none, 0 armco, 1 concrete wall, 2 tyre wall
      if (side > 0 && PP) { if (pitOpen(i)) return -1; const p = T.pitAt(i * ds); if (p) return p.gap ? -1 : 1; }
      if (side < 0 && lw(i)) return 1;
      return tyreOn[side2(side)][i] ? 2 : 0;
    };
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const tyMat = new THREE.MeshLambertMaterial({ map: tex.tires, vertexColors: true });
    const postGeo = (() => { const g = new GB(); box(g, 0, 0, 0, 0.12, 1, 0.12, 0, [0.46, 0.47, 0.5], null, true); return g.geometry(); })();
    const posts = new IChunks(postGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), 512);
    const fence = [new Uint8Array(N), new Uint8Array(N)];   // catch fences (1: behind a rail or a wall, 2: behind a tyre wall)
    const steel = [0.8, 0.82, 0.85], steelD = [0.5, 0.52, 0.56], conc = [0.82, 0.82, 0.8], concD = [0.66, 0.66, 0.64], W1 = [1, 1, 1];
    const railRow = (gr, i, side, k) => {   // armco / wall cross-section at sample i (rows run so that the faces look at the road)
      const bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.12), h = 1.1, o2 = side * (bar + (k === 0 ? 0.42 : 0.45));
      let p = k === 0 ? [Pt(i, o, 0.32), Pt(i, o, 0.6), Pt(i, o, 0.66), Pt(i, o, 0.95), Pt(i, o2, 0.95)] : [Pt(i, o, -0.4), Pt(i, o, 0.1), Pt(i, o, h - 0.1), Pt(i, o, h), Pt(i, o2, h)];
      let c = k === 0 ? [steel, steelD, steel, [0.9, 0.91, 0.93], [0.72, 0.74, 0.77]] : [concD, conc, conc, [0.9, 0.9, 0.88], [0.84, 0.84, 0.82]];
      if (side < 0) { p = p.reverse(); c = c.slice().reverse(); }
      return gr.row(p, c);
    };
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
          if (prev >= 0 && k !== pk) { if (pk === 2) gt.link(prev, tyreRow(gt, i, side, acc / 3), 0, 2); else if (pk >= 0) gr.link(prev, railRow(gr, i, side, pk), 0, 4); prev = -1; }
          if (k < 0) { pk = k; continue; }
          const r = k === 2 ? tyreRow(gt, i, side, acc / 3) : railRow(gr, i, side, k);
          if (prev >= 0) { if (k === 2) gt.link(prev, r, 0, 2); else gr.link(prev, r, 0, 4); } prev = r; pk = k;
          if (k === 0 && ii % 2 === 0 && ii < c0 + CH) { const p = Pt(i, side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.24), 0); posts.add(p[0], p[1] - 0.35, p[2], T.hd[i], 1, 1.25); }
          if (k >= 1) fence[side2(side)][i] = k;
        }
      }
      addM(gr, rMat, true); addM(gt, tyMat, true);
    }
    const nPosts = posts.addTo(root, false);   // (thin posts: no shadows)
    // knockable props: tyre stacks at the corner exits and apexes, 2.2-3 m past the edge, not on the pit straight. Drawn out to 150 m
    out.propR = 150;
    out.propFloor = propFloorTable(null, (i, side) => hlVerge(i, side));
    out.propStats = roadsideProps(out.props, { exits: 10, apexes: 4, wallEdge: [2.2, 3.0], stacks: [5, 7], rows2: 0.3, floor: out.propFloor, skip: (i) => { const d = dSs(i * ds); return d > -210 && d < 290; } });
    // the game's sponsors on the concrete walls (tex.sponsors: 4 m boards, read from the road)
    { const sb = new Chunks(256, true);
      for (const side of [-1, 1]) for (let i = 0, n = 0; i + 2 <= N; i += 2) {
        const j = (i + 2) % N; if (kindAt(i, side) !== 1 || kindAt(j, side) !== 1 || kindAt((i + 1) % N, side) !== 1) continue;
        const k = (n++ * 3 + (side > 0 ? 1 : 0)) % 8, u0 = (k % 2) * 0.5, v1 = 1 - Math.floor(k / 2) * 0.25, bar = side > 0 ? T.br : T.bl, o = (ii) => side * (bar[ii] + 0.1);
        const A = Pt(i, o(i), 0.14), B = Pt(j, o(j), 0.14), C = Pt(j, o(j), 0.96), D = Pt(i, o(i), 0.96), uL = side < 0 ? u0 : u0 + 0.5, uR = side < 0 ? u0 + 0.5 : u0;
        sb.get(A[0], A[2]).quadO(A, B, C, D, W1, Pt(i, side * (bar[i] + 2), 0.5), [[uL, v1 - 0.25], [uR, v1 - 0.25], [uR, v1], [uL, v1]]); }
      sb.addTo(root, new THREE.MeshLambertMaterial({ map: tex.sponsors }), false, true); }

    /* ---- scenery helpers (vertex coloured, 128 m chunks near the road, 512 m ones farther out without shadows), the glass of the curtain
       walls (its own map), the text boards, Taiwan's flags ---- */
    const scen = new Chunks(128), farB = new Chunks(512), glass = new Chunks(256, true), ban = new GB(true), crowdG = new GB(true), flagL = [];
    const glassTex = ownTex(hlGlassTex());
    const glassWall = (x0, z0, x1, z1, yb, yt, inside, col, u0) => {   // a curtain wall from (x0, z0) to (x1, z1) between the heights yb and yt, facing away from inside
      const l = Math.hypot(x1 - x0, z1 - z0), ua = (u0 || 0) / 12, ub = ua + l / 12, vb = 0, vt = (yt - yb) / 7.6;
      glass.get(x0, z0).quadO([x0, yb, z0], [x1, yb, z1], [x1, yt, z1], [x0, yt, z0], col || W1, inside, [[ua, vb], [ub, vb], [ub, vt], [ua, vt]]); };
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const CR = crowdCtx({ gH: nrGround, near: (x, z) => nrNear(x, z).dd, maxSlope: 0.8 });   // spectators, marshals, the crews' men (instanced)
    const atlas = hlAtlas();
    const board = (cx, cy, cz, tx, tz, Wd, H, cellK) => {   // a text board (bottom centre cx, cy, cz) facing -t, a dark back behind it
      const [u0, v0, u1, v1] = nrAUV(cellK), ux = tz, uz = -tx, hw = -Wd / 2;
      const A = [cx - ux * hw, cy, cz - uz * hw], B = [cx + ux * hw, cy, cz + uz * hw], C = [B[0], cy + H, B[2]], D = [A[0], cy + H, A[2]];
      ban.quadO(A, B, C, D, W1, [cx + tx, cy + H / 2, cz + tz], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
      box(scen.get(cx, cz), cx + tx * 0.06, cy - 0.02, cz + tz * 0.06, 0.08, H + 0.04, Wd + 0.04, Math.atan2(tz, tx), [0.3, 0.31, 0.33], null, true);
    };
    const signPost = (s, side, extra, cellK, Wd, H, y0) => {   // a board on two posts beside the track, facing the traffic
      const [x, z, i] = onSide(s, side, extra), y = nrGround(x, z), g = scen.get(x, z), nx = T.nx[i], nz = T.nz[i];
      for (const o of [-Wd / 2 + 0.2, Wd / 2 - 0.2]) box(g, x + nx * o + T.tx[i] * 0.16, y - 0.3, z + nz * o + T.tz[i] * 0.16, 0.1, y0 + H + 0.3, 0.1, T.hd[i], [0.55, 0.56, 0.58]);
      board(x, y + y0, z, T.tx[i], T.tz[i], Wd, H, cellK); exclPush(x, z, 3);
    };
    const flagPole = (x, y, z, rot, H) => { cyl(scen.get(x, z), x, y - 0.2, z, 0.05, H + 0.25, 5, [0.86, 0.86, 0.88]); flagL.push([x, y + H, z, rot, TW, 1.65, 1.1]); CR.avoid(x, z, 0.45); };
    const roomSide = (s) => { let l = 0, r = 0; for (let d = -30; d <= 30; d += 6) { const i = T.idx(s + d); l += T.bl[i]; r += T.br[i]; } return r > l ? 1 : -1; };
    const person = (x, y, z, fx, fz, col, pose, staff) => crowdPut(CR, x, y, z, fx, fz, { col, pose, staff: !!staff }, 1);
    const groundMin = (x, z, Lb, Wb, ang) => { let y0 = 1e9; for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 0]]) { const cx = x + Math.cos(ang) * a * Lb / 2 - Math.sin(ang) * b * Wb / 2, cz = z + Math.sin(ang) * a * Lb / 2 + Math.cos(ang) * b * Wb / 2; y0 = Math.min(y0, nrGround(cx, cz)); } return y0; };

    /* ---- START / FINISH: the gantry with the start lights over the line, its banner ---- */
    {
      const [x, z, h, i] = atS(sStart, 0), gy = T.hy[i], g = scen.get(x, z), nx = T.nx[i], nz = T.nz[i], gray = [0.86, 0.87, 0.88], oL = -(T.bl[i] + 1.0), oR = T.br[i] + 0.45, span = (oR - oL) / 2, oc = (oR + oL) / 2;
      for (const o of [oL, oR]) box(g, x + nx * o, gy - 0.3, z + nz * o, 0.7, 7.9, 0.7, h, gray);
      box(g, x + nx * oc, gy + 6.4, z + nz * oc, 1.0, 1.2, span * 2 + 0.7, h, [0.14, 0.15, 0.18], [0.24, 0.25, 0.3]);
      box(g, x, gy + 5.2, z, 0.5, 1.3, 5.2, h, [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, gy + 7.85, z + nz * o); m.rotation.y = -h; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      board(x + nx * oc - T.tx[i] * 0.55, gy + 6.4, z + nz * oc - T.tz[i] * 0.55, T.tx[i], T.tz[i], span * 2 - 2, 1.15, AT.start);
      exclPush(x, z, span + 6);
    }

    /* ---- the pit lane right of the start straight and the crews' boxes (World's: the lane, its lines and apron, the crews' kit, the stands on the
       pit wall, the player's box for the renderer's crew), the race building our own (garages: false) ---- */
    let nGar = 0;
    if (PP) {
      pitLaneScenery({ R, scen, prop: (kind, x, z, yaw, col) => out.props.push({ kind, x, z, yaw: yaw || 0, col: col || 0 }), excl: exclPush, root, out, ownTex, Y, garages: false });
      for (let d = -168; d <= 262; d += 8) for (const o of [22, 40, 58, 76, 92]) {   // no trees, no crowd from the pit wall out over the building and the paddock
        if (o > 30 && (d < -165 || d > 250)) continue; const [x, z] = atSf(sAt(d), o); exclPush(x, z, 12); }
      pitExcl(exclPush);
      nGar = raceBuilding();
    }
    // the race building: 312 m along the lane from 156 m before the start line to 156 m after it. The ground floor, 5 m: the crews' 13 garages
    // (10 m, open: World's measures, out.pitBoxes[].gar, so that the renderer's team colours, door and flags fit) between 12 shut ones at either
    // end; the rooms behind them to its back, 50.6 m from the centre line (OSM's outline). Four floors of glass over all of it (3.8 m each),
    // reaching out over the apron to 17.4 m from the centre line (OSM: the outline's near edge), white slab edges, the roof's parapet, flags
    // on it, the place's name over the start line; the apron in front of the shut garages where the lane narrows
    function raceBuilding() {
      const pm = T.pitAt(sStart), PO = pm ? pm.o : 13.5, F = PO + 12.5, b0 = PO + 19.7, BK = 50.6, NF = 17.4, RF = 5.0, FH = 3.8, UP = 4, Y1 = RF + 0.45, TOP = Y1 + UP * FH, B0 = -156, B1 = 156;
      const WALL = [0.93, 0.93, 0.91], DOOR = [0.74, 0.76, 0.78], SLAB = [0.95, 0.95, 0.94], SOF = [0.78, 0.79, 0.8];
      const kb = (g, s, o, y, sx, sy, sz, col, top, nb) => { const [x, z, hd] = atSf(s, o); box(g, x, Y(s) + y, z, sx, sy, sz, hd, col, top, nb); };
      const kf = (g, s0, s1, o, y0, y1, col, dir) => { const [x0, z0] = atSf(s0, o), [x1, z1] = atSf(s1, o), [xb, zb] = atSf((s0 + s1) / 2, o - (dir || -1) * 0.2), dy = Y((s0 + s1) / 2);   // a flat panel facing the lane (dir -1) or the paddock (+1)
        g.quadO([x0, dy + y0, z0], [x1, dy + y0, z1], [x1, dy + y1, z1], [x0, dy + y1, z0], col, [xb, dy + (y0 + y1) / 2, zb]); };
      const CAB = [[0.2, 0.21, 0.24], [0.78, 0.14, 0.12], [0.15, 0.3, 0.62]], BLK = [0.13, 0.13, 0.15], SIL = [0.66, 0.68, 0.72], SCR = [0.16, 0.24, 0.38], CMP = [[0.86, 0.14, 0.12], [0.95, 0.8, 0.14], [0.92, 0.92, 0.9]];
      const bays = [], nS = 12, w0 = (-65 - B0) / nS, w1 = (B1 - 65) / nS;   // [from, to (metres after the start line), crew]
      for (let q = 0; q < nS; q++) bays.push([B0 + q * w0, B0 + (q + 1) * w0, false]);
      for (let d = -65; d < 65 - 0.1; d += 10) bays.push([d, d + 10, true]);
      for (let q = 0; q < nS; q++) bays.push([65 + q * w1, 65 + (q + 1) * w1, false]);
      let k = 0;
      for (const [a, b, crew] of bays) {
        const s0 = sAt(a), s1 = sAt(b), sm = sAt((a + b) / 2), Lb = b - a, g = scen.get(...atSf(sm, 34).slice(0, 2));
        kb(g, sm, BK - 0.15, 0, Lb + 0.02, RF, 0.3, WALL, null, true);                                           // the back wall (the paddock side)
        if (k % 2 === 0) kf(g, sAt((a + b) / 2 - 1.6), sAt((a + b) / 2 + 1.6), BK + 0.02, 0, 3.6, DOOR, 1);       // a roller door to the paddock
        else kf(g, sAt(a + 0.8), sAt(b - 0.8), BK + 0.02, 2.4, 3.6, [0.24, 0.3, 0.38], 1);                       // the high windows
        if (crew) {   // a crew's garage, open to the apron: its front pillars, the header over the door, the floor, the inside (World's measures)
          const f0 = F, o = (f0 + b0) / 2;
          kb(g, sAt(a + 5), b0 - 0.15, 0, 10.02, RF, 0.3, WALL, null, true);
          for (const sd of [-1, 1]) { kb(g, sAt(a + 5 + sd * 4.885), o, 0, 0.25, RF, 7.2, WALL, null, true); kb(g, sAt(a + 5 + sd * 4.56), f0 + 0.15, 0, 0.9, 3.3, 0.3, WALL, null, true); }
          kb(g, sAt(a + 5), f0 + 0.15, 3.3, 10.02, RF - 3.3, 0.3, WALL);
          kb(g, sAt(a + 5), f0 - 0.02, 3.45, 9.4, 0.5, 0.05, [0.2, 0.21, 0.24]);                                   // the band (the renderer's team colour over it)
          kb(g, sAt(a + 5), o, 0, 9.52, 0.03, 6.9, [0.42, 0.44, 0.47], [0.5, 0.52, 0.55], true);                   // the epoxy floor
          kf(g, sAt(a + 0.25), sAt(a + 9.75), b0 - 0.302, 0.03, 1.28, [0.3, 0.31, 0.35]);
          kb(g, sAt(a + 5), b0 - 0.33, 1.7, 1.5, 0.85, 0.04, [0.07, 0.07, 0.08], null, true); kf(g, sAt(a + 4.31), sAt(a + 5.69), b0 - 0.352, 1.75, 2.5, SCR);   // the timing screen
          for (const ca of [1.3, 2.5, 7.5, 8.7]) { const s = sAt(a + ca); kb(g, s, b0 - 0.64, 0, 1.1, 0.1, 0.55, [0.08, 0.08, 0.09], null, true); kb(g, s, b0 - 0.64, 0.1, 1.15, 1.0, 0.6, CAB[(k + ca | 0) % 3], [0.1, 0.1, 0.11]);
            for (let dw = 0; dw < 4; dw++) { const y = 0.1 + (0.22 + dw * 0.2); kf(g, sAt(a + ca - 0.5), sAt(a + ca + 0.5), b0 - 0.945, y, y + 0.025, SIL); } }
          for (const ta of [0.85, 9.15]) { const s = sAt(a + ta), cmp = CMP[(k + (ta > 5 ? 1 : 0)) % 3]; const [x, z] = atSf(s, o - 0.6); cyl(g, x, Y(s) + 0.03, z, 0.36, 1.38, 8, BLK, [0.17, 0.17, 0.19]);
            for (let l = 0; l < 3; l++) cyl(g, x, Y(s) + 0.03 + (l + 0.42) * 0.46, z, 0.366, 0.074, 8, cmp); }
          for (const la of [-1.9, 1.9]) kb(g, sAt(a + 5 + la), o, RF - 0.1, 0.28, 0.07, 5.8, [0.98, 0.98, 0.94]);   // the strip lights
          kb(g, sAt(a + 5), (b0 + BK) / 2, 0, 10.02, RF, BK - b0 - 0.3, WALL, null, true);                         // the rooms behind it
        } else {   // a shut garage: a roller door between pillars, the header over it
          kb(g, sm, (F + 0.12 + BK) / 2, 0, Lb, RF, BK - F - 0.12, WALL, null, true);
          kb(g, sm, F + 0.06, 0, Lb - 1.0, 3.3, 0.12, DOOR, null, true);
          for (let dl = 0.45; dl < 3.2; dl += 0.45) kf(g, sAt(a + 0.55), sAt(b - 0.55), F - 0.005, dl, dl + 0.03, [0.6, 0.62, 0.64]);   // its slats
          kb(g, sAt(a + 0.25), F + 0.15, 0, 0.5, 3.3, 0.3, WALL, null, true); kb(g, sAt(b - 0.25), F + 0.15, 0, 0.5, 3.3, 0.3, WALL, null, true);
          kb(g, sm, F + 0.15, 3.3, Lb, RF - 3.3, 0.3, WALL);
          const p = T.pitAt(sm), a1 = p ? p.o + 3.5 : w + 7;   // the apron in front of it where the lane narrows (World's apron is where the lane is full width)
          if (!p || p.t < 0.999) { const A = atSf(s0, a1), Bq = atSf(s0, F), C = atSf(s1, F), D = atSf(s1, a1), cc = [0.74, 0.78, 0.7];
            g.quadUp([A[0], Y(s0) + 0.02, A[1]], [Bq[0], Y(s0) + 0.02, Bq[1]], [C[0], Y(s1) + 0.02, C[1]], [D[0], Y(s1) + 0.02, D[1]], [cc, cc, cc, cc]); }
        }
        k++;
      }
      // the four floors of glass over the ground floor, in 8 m lengths: the block (its underside reaching out over the apron), the curtain
      // walls to the lane and to the paddock, the slabs' white edges, the roof's parapet; its ends glass too
      for (let a = B0; a < B1 - 0.01; a += 8) {
        const e = Math.min(B1, a + 8), sa = sAt(a), se = sAt(e), sm = sAt((a + e) / 2), [cx, cz] = atSf(sm, 34), g = scen.get(cx, cz), ym = Y(sm);
        kb(g, sm, (NF + BK) / 2, Y1, e - a + 0.02, TOP - Y1, BK - NF, SOF, [0.6, 0.61, 0.62]);
        kb(g, sm, (NF + F) / 2, RF, e - a + 0.02, Y1 - RF, F - NF, SOF, null);                                 // the soffit over the apron
        const [fx0, fz0] = atSf(sa, NF - 0.04), [fx1, fz1] = atSf(se, NF - 0.04), [bx0, bz0] = atSf(sa, BK + 0.04), [bx1, bz1] = atSf(se, BK + 0.04);
        glassWall(fx0, fz0, fx1, fz1, ym + Y1, ym + TOP, [cx, ym + 10, cz], null, a - B0);
        glassWall(bx0, bz0, bx1, bz1, ym + Y1, ym + TOP - 0.3, [cx, ym + 10, cz], null, a - B0);
        for (let f = 0; f <= UP; f++) kb(g, sm, NF - 0.18, Y1 - 0.35 + f * FH, e - a + 0.02, 0.38, 0.36, SLAB, SLAB);   // the slabs' edges
        kb(g, sm, NF + 0.1, TOP, e - a + 0.02, 1.1, 0.3, SLAB, [0.8, 0.8, 0.79]); kb(g, sm, BK - 0.1, TOP, e - a + 0.02, 0.9, 0.3, SLAB, [0.8, 0.8, 0.79]);   // the parapets
        if (((a - B0) / 8 | 0) % 3 === 1) kb(g, sm, (NF + BK) / 2 + 6, TOP, 4.5, 1.8, 6, [0.66, 0.67, 0.68], [0.55, 0.56, 0.57]);   // plant on the roof
      }
      for (const [d, sd] of [[B0, -1], [B1, 1]]) {   // the ends
        const s = sAt(d), [x0, z0] = atSf(s + sd * 0.04, NF), [x1, z1] = atSf(s + sd * 0.04, BK), [ix, iz] = atSf(s - sd * 3, 34), ym = Y(s);
        glassWall(x0, z0, x1, z1, ym + Y1, ym + TOP, [ix, ym + 10, iz]);
        const g = scen.get(ix, iz); kb(g, s - sd * 0.1, (F + BK) / 2, 0, 0.3, RF, BK - F, WALL, null, true); }
      { const sm = sAt(0), i = T.idx(sm), [bx, bz] = atSf(sm, NF - 0.5), by = Y(sm) + TOP + 1.2;   // the place's name over the start line, Taiwan's flags on the roof
        board(bx, by, bz, T.nx[i], T.nz[i], 18, 2.4, AT.houli);
        for (const da of [-120, -84, -48, -12, 12, 48, 84, 120]) { const ss = sAt(da), [px, pz] = atSf(ss, NF + 1.5); flagPole(px, Y(ss) + TOP + 0.9, pz, T.hd[T.idx(ss)] + Math.PI * 0.5, 5.5); } }
      for (let d = B0; d <= B1; d += 8) { const [x, z] = atSf(sAt(d), (F + BK) / 2); CR.block(x, z, 9, BK - F + 2, T.hd[T.idx(sAt(d))]); }
      return bays.length;
    }

    /* ---- the paddock behind the race building: its asphalt, the teams' trucks with their trailers (awnings out on the building's side),
       vans and motorhomes in a row behind them, cars ---- */
    let nTrucks = 0, nCars = 0;
    if (PP) {
      const gp = new RB(true), pc = [1, 1, 1]; let pr = -1;
      const at = (d, o) => [S0[0] + mtx * d + mnx * o, S0[1] + mtz * d + mnz * o];   // (the straight's frame)
      for (let d = PAD.d0; d <= PAD.d1 + 0.01; d += 4) { const ps = [PAD.o0 - 1, (PAD.o0 + PAD.o1) / 2, PAD.o1].map(o => { const [x, z] = at(d, o); return [x, nrGround(x, z) + 0.05, z]; });
        const r = gp.row(ps, [pc, pc, pc], ps.map(p => [p[0] / 8, -p[2] / 8])); if (pr >= 0) gp.link(pr, r, 0, 2); pr = r; }
      addM(gp, new THREE.MeshLambertMaterial({ map: tex.asphalt, color: 0xc8c8c4 }));
      const hdM = Math.atan2(mtz, mtx);
      const truck = (d, o, col) => {   // a tractor and its trailer, its side towards the building: the awning out over a table and chairs on that side
        const [x, z] = at(d, o), y = nrGround(x, z), g = scen.get(x, z), hd = hdM, c = Math.cos(hd), sn = Math.sin(hd), sg = -msg, aw = (a, b) => [x + c * a - sn * b * sg, z + sn * a + c * b * sg];
        const [tx, tz] = aw(-1.6, 0); box(g, tx, y + 0.9, tz, 13.2, 3.1, 2.55, hd, col, [0.9, 0.9, 0.9]);
        const [cx, cz] = aw(6.6, 0); box(g, cx, y + 0.6, cz, 2.6, 3.0, 2.5, hd, vary(col, R, 0.08), [0.2, 0.22, 0.25]);
        box(g, tx, y + 0.25, tz, 12.4, 0.65, 2.3, hd, [0.14, 0.14, 0.15], null, true);
        const [ax, az] = aw(-1.6, 2.55); box(g, ax, y + 3.7, az, 11, 0.08, 2.6, hd, [0.9, 0.9, 0.88]);
        for (const a of [-6.6, 3.4]) { const [px, pz] = aw(a, 3.75); box(g, px, y, pz, 0.08, 3.72, 0.08, hd, [0.7, 0.71, 0.73], null, true); }
        const [bx, bz] = aw(-1.6, 2.3); box(g, bx, y + 0.72, bz, 1.8, 0.05, 0.8, hd, [0.92, 0.92, 0.9]);
        CR.block(x, z, 17, 6.5, hd); nTrucks++;
      };
      const vanAt = (d, o, col, kind) => { const [x, z] = at(d, o), y = nrGround(x, z), g = scen.get(x, z), hd = hdM;
        if (kind === 0) { box(g, x, y + 0.35, z, 5.6, 2.1, 2.0, hd, col, [0.88, 0.88, 0.88]); box(g, x + Math.cos(hd) * 2.3, y + 1.15, z + Math.sin(hd) * 2.3, 0.9, 0.7, 2.02, hd, [0.16, 0.2, 0.26], null, true); }
        else { box(g, x, y + 0.4, z, 8.2, 2.8, 2.45, hd, [0.95, 0.95, 0.93], [0.84, 0.84, 0.82]); box(g, x, y + 1.2, z, 8.22, 0.35, 2.47, hd, col, null, true); box(g, x + Math.cos(hd) * 3.4, y + 1.7, z + Math.sin(hd) * 3.4, 1.2, 0.8, 2.47, hd, [0.16, 0.2, 0.26], null, true); }
        CR.block(x, z, kind ? 8.6 : 6, 2.8, hd); nCars++; };
      for (let d = -100, k = 0; d < 80; d += 15, k++) { if (crH(d, 7, 61) < 0.15) continue; truck(d, 57, TEAM[(k * 5 + 2) % TEAM.length]); }   // the trucks along the back of the building
      for (let d = -104, k = 0; d < 84; d += 9.5, k++) { if (crH(d, 8, 62) < 0.25) continue; vanAt(d, 72, TEAM[(k * 3 + 1) % TEAM.length], crH(d, 9, 63) < 0.55 ? 1 : 0); }   // motorhomes and vans in the row behind
      for (let d = -106; d < 84; d += 5.2) { if (crH(d, 10, 64) < 0.3) continue; const [x, z] = at(d, 90 + (crH(d, 11, 65) - 0.5) * 1.5), y = nrGround(x, z);
        parkedCar(scen.get(x, z), x, y, z, hdM + Math.PI / 2 + (crH(d, 12, 66) - 0.5) * 0.2, vary([[0.92, 0.92, 0.9], [0.12, 0.13, 0.15], [0.62, 0.64, 0.66], [0.62, 0.12, 0.1], [0.18, 0.28, 0.5]][Math.floor(crH(d, 13, 67) * 5)], R, 0.05)); nCars++; }
      for (let d = PAD.d0; d <= PAD.d1; d += 12) for (const o of [62, 86]) { const [x, z] = at(d, o); exclPush(x, z, 15); }
      for (let d = -90, k = 0; d < 80; d += 15, k++) { if (crH(d, 14, 68) < 0.4) continue; const [x, z] = at(d + 2, 53); person(x, nrGround(x, z), z, mnx * -msg, mnz * -msg, TEAM[(k * 5 + 2) % TEAM.length], 0, true); }   // a few mechanics by the trucks
      for (const d of [-108, 84]) { const [x, z] = at(d, 52.5); flagPole(x, nrGround(x, z), z, hdM + Math.PI * 0.5, 8); }
    }

    /* ---- the buildings by the circuit (sk.bld, OSM, as boxes): the hotels by the chicane (white frames, glass, a lobby of glass, plant on the
       roof), the circuit's halls and the public buildings (white, flat roofs, bands of windows), the halls and sheds of the works and the farms
       (pale walls, low roofs of blue or grey sheet), the temples (red walls, the orange roof's ridge raised at its ends), the houses ---- */
    let nBld = 0, nHouse = 0;
    const SHEET = [[0.24, 0.42, 0.6], [0.26, 0.5, 0.48], [0.56, 0.58, 0.6], [0.6, 0.34, 0.24]], FAC = [[0.92, 0.9, 0.84], [0.84, 0.83, 0.8], [0.9, 0.8, 0.72], [0.78, 0.82, 0.84], [0.94, 0.93, 0.91], [0.72, 0.64, 0.56]];
    const townhouse = (g, x, z, y0, Lb, Wb, ang, H, near) => {   // a townhouse of the villages: tiled front, a flat concrete roof, a sheet-roofed room and a water tank on it
      const fc = FAC[Math.floor(crH(x, z, 42) * FAC.length)];
      box(g, x, y0 - 0.4, z, Lb, H + 0.4, Wb, ang, fc, [0.56, 0.56, 0.54]);
      const c = Math.cos(ang), s = Math.sin(ang), at = (a, b) => [x + c * a - s * b, z + s * a + c * b];
      if (near) { const [fx, fz] = at(Lb / 2 + 0.03, 0); box(g, fx, y0, fz, 0.06, 2.7, Wb * 0.78, ang, [0.3, 0.31, 0.33], null, true); }   // the roller door of the shop or the garage on the front
      if (crH(x, z, 43) < 0.6) { const [rx, rz] = at(-Lb * 0.18, 0), sc = SHEET[Math.floor(crH(x, z, 44) * SHEET.length)]; box(g, rx, y0 + H, rz, Lb * 0.55, 2.2, Wb, ang, [0.8, 0.8, 0.78], null, true); gable(g, rx, y0 + H + 2.2, rz, Lb * 0.55 + 0.4, Wb + 0.4, 0.6, ang, sc, sc); }
      if (near && crH(x, z, 45) < 0.7) { const [tx, tz] = at(Lb * 0.3, (crH(x, z, 46) - 0.5) * Wb * 0.5); cyl(g, tx, y0 + H + 0.5, tz, 0.62, 1.3, 6, [0.78, 0.8, 0.82], [0.86, 0.87, 0.88]); }
    };
    const B7 = sk.bld || [];
    for (let k = 0; k + 6 < B7.length; k += 7) {
      const x = B7[k], z = B7[k + 1], Lb = B7[k + 2], Wb = B7[k + 3], ang = B7[k + 4] * Math.PI / 180, H = B7[k + 5] || 6, kind = B7[k + 6], rd = nrDist(x, z);
      if (paddock(x, z)) continue;
      const g = rd < 170 ? scen.get(x, z) : farB.get(x, z), y0 = groundMin(x, z, Lb, Wb, ang), c = Math.cos(ang), s = Math.sin(ang), at = (a, b) => [x + c * a - s * b, z + s * a + c * b];
      if (kind === 5 && H >= 12) {   // a hotel: a white frame round the glass, the lobby's glass, the plant on the roof
        box(g, x, y0 - 0.4, z, Lb, H + 0.4, Wb, ang, [0.93, 0.93, 0.91], [0.62, 0.62, 0.61]);
        const ins = [x, y0 + H / 2, z];
        for (const [a0, b0, a1, b1, l] of [[-1, -1, 1, -1, Lb], [1, -1, 1, 1, Wb], [1, 1, -1, 1, Lb], [-1, 1, -1, -1, Wb]]) {
          const [x0, z0] = at(a0 * (Lb / 2 + 0.04), b0 * (Wb / 2 + 0.04)), [x1, z1] = at(a1 * (Lb / 2 + 0.04), b1 * (Wb / 2 + 0.04)), mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, ux = (x1 - x0) / l, uz = (z1 - z0) / l, m = 1.2;
          glassWall(x0 + ux * m, z0 + uz * m, x1 - ux * m, z1 - uz * m, y0 + 4.6, y0 + H - 1.0, ins);
          glassWall(x0 + ux * m * 3, z0 + uz * m * 3, x1 - ux * m * 3, z1 - uz * m * 3, y0 + 0.3, y0 + 3.9, ins, [0.62, 0.66, 0.7]); void mx; void mz; }
        for (const [a, b] of [[-0.2, 0.1], [0.22, -0.15]]) { const [px, pz] = at(a * Lb, b * Wb); box(g, px, y0 + H, pz, Math.min(10, Lb * 0.25), 2.6, Math.min(8, Wb * 0.3), ang, [0.7, 0.71, 0.72], [0.6, 0.61, 0.62]); }
        box(g, x, y0 + H, z, Lb + 0.1, 0.9, Wb + 0.1, ang, [0.93, 0.93, 0.91], [0.62, 0.62, 0.61]);
      } else if (kind === 1) {   // a temple: red walls on a stone plinth, the orange roof, its ridge raised at the ends
        box(g, x, y0 - 0.4, z, Lb + 1, 1.0, Wb + 1, ang, [0.6, 0.58, 0.55]);
        box(g, x, y0 + 0.6, z, Lb, Math.max(3.5, H - 3), Wb, ang, [0.72, 0.2, 0.15], null, true);
        const yr = y0 + 0.6 + Math.max(3.5, H - 3), rh = Math.min(3, Wb * 0.4);
        gable(g, x, yr, z, Lb + 1.8, Wb + 1.8, rh, ang, [0.88, 0.5, 0.16], [0.72, 0.2, 0.15]);
        for (const a of [-1, 1]) { const [px, pz] = at(a * (Lb / 2 + 0.6), 0); box(g, px, yr + rh - 0.2, pz, 1.2, 1.0, 0.5, ang, [0.86, 0.48, 0.16]); }
      } else if (kind === 4 || kind === 5) {   // a hall or a shed: pale walls, a low roof of sheet
        const sc = SHEET[Math.floor(crH(x, z, 47) * SHEET.length)], wc = FAC[Math.floor(crH(x, z, 48) * 3)];
        box(g, x, y0 - 0.4, z, Lb, H + 0.4 - 0.8, Wb, ang, wc, null, true); gable(g, x, y0 + H - 0.8, z, Lb + 0.5, Wb + 0.5, Math.min(1.6, Wb * 0.12), ang, sc, wc);
      } else if (kind === 6 || Lb * Wb > 300) {   // the circuit's halls, the public buildings: white, a flat roof, bands of windows (the curtain walls' glass)
        const Hb = Math.max(H, 7.5), floors = Math.max(1, Math.floor((Hb - 1) / 3.8)), ins = [x, y0 + Hb / 2, z];
        box(g, x, y0 - 0.4, z, Lb, Hb + 0.4, Wb, ang, [0.9, 0.9, 0.88], [0.6, 0.6, 0.59]);
        for (const b of [-1, 1]) { const [x0, z0] = at(-Lb / 2 + 1.5, b * (Wb / 2 + 0.04)), [x1, z1] = at(Lb / 2 - 1.5, b * (Wb / 2 + 0.04));
          for (let f = 0; f < floors; f++) glassWall(x0, z0, x1, z1, y0 + 1.0 + f * 3.8, y0 + 3.0 + f * 3.8, ins); }
        box(g, x, y0 + Hb, z, Lb + 0.1, 0.8, Wb + 0.1, ang, [0.9, 0.9, 0.88], [0.6, 0.6, 0.59]);
      } else townhouse(g, x, z, y0, Lb, Wb, ang, H + 1.5, rd < 170);
      CR.block(x, z, Lb + 2, Wb + 2, ang); exclPush(x, z, Math.hypot(Lb, Wb) / 2 + 2); nBld++;
    }
    // the villages' houses (def.sk.hs: WorldCover's built-up beyond the circuit's grounds, a house in every 16 m cell): townhouses of three or
    // four floors (most), farmhouses with tiled roofs, the sheds of small works; their rows by the lanes, the same way in a block of 48 m
    { const H2 = sk.hs || [];
      for (let k = 0; k + 1 < H2.length; k += 2) {
        const x = H2[k], z = H2[k + 1]; if (excluded(x, z)) continue;
        const rd = nrDist(x, z); if (rd < 30) continue;
        const near = rd < 170, g = near ? scen.get(x, z) : farB.get(x, z), t = crH(x, z, 41), ang = crH(Math.floor(x / 48), Math.floor(z / 48), 31) * Math.PI + (crH(x, z, 49) - 0.5) * 0.1;
        let Lb, Wb;
        if (t < 0.58) { Lb = 12 + crH(x, z, 50) * 5; Wb = 5.5 + crH(x, z, 51) * 2; const y0 = groundMin(x, z, Lb, Wb, ang); townhouse(g, x, z, y0, Lb, Wb, ang, (3 + (crH(x, z, 52) < 0.45 ? 1 : 0)) * 3.2, rd < 110); }
        else if (t < 0.82) { Lb = 13 + crH(x, z, 50) * 5; Wb = 6 + crH(x, z, 51) * 1.5; const y0 = groundMin(x, z, Lb, Wb, ang), wc = crH(x, z, 53) < 0.5 ? [0.66, 0.38, 0.3] : [0.9, 0.88, 0.84];   // a farmhouse: brick or white, a red-tiled roof
          box(g, x, y0 - 0.4, z, Lb, 3.6, Wb, ang, wc, null, true); gable(g, x, y0 + 3.2, z, Lb + 0.8, Wb + 0.8, 1.7, ang, [0.66, 0.32, 0.22], wc); }
        else { Lb = 16 + crH(x, z, 50) * 8; Wb = 10 + crH(x, z, 51) * 4; const y0 = groundMin(x, z, Lb, Wb, ang), sc = SHEET[Math.floor(crH(x, z, 54) * 3)], wc = [0.84, 0.85, 0.86];   // a shed of a small works
          box(g, x, y0 - 0.4, z, Lb, 5.4, Wb, ang, wc, null, true); gable(g, x, y0 + 5.0, z, Lb + 0.5, Wb + 0.5, 1.1, ang, sc, wc); }
        exclPush(x, z, Math.hypot(Lb, Wb) / 2 + 1); CR.block(x, z, Lb + 1, Wb + 1, ang); nHouse++;
      } }

    // the roads round the circuit (OSM: the lanes of the villages and the farms, the circuit's service roads; not on the track itself): asphalt
    // ribbons on the ground; the karting track in the infield (sk.kart: its loop and the link to the circuit), asphalt with white edges and
    // red and white kerbs in its bends
    let nKart = 0;
    { const gr = new GB(true), one = [0.92, 0.92, 0.9];
      for (const r of sk.road || []) { const hw = r[0] / 2;
        for (let k = 1; k + 3 < r.length; k += 2) { const ax = r[k], az = r[k + 1], bx = r[k + 2], bz = r[k + 3], l = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(l / 6));
          for (let m = 0; m < n; m++) { const x0 = ax + (bx - ax) * m / n, z0 = az + (bz - az) * m / n, x1 = ax + (bx - ax) * (m + 1) / n, z1 = az + (bz - az) * (m + 1) / n, nx = -(z1 - z0) / (l / n), nz = (x1 - x0) / (l / n);
            if (nrNear(x0, z0).dd < 1.5 || nrNear(x1, z1).dd < 1.5 || paddock(x0, z0)) continue;
            const P0 = [x0 - nx * hw, nrGround(x0 - nx * hw, z0 - nz * hw) + 0.06, z0 - nz * hw], P1 = [x0 + nx * hw, nrGround(x0 + nx * hw, z0 + nz * hw) + 0.06, z0 + nz * hw], P2 = [x1 + nx * hw, nrGround(x1 + nx * hw, z1 + nz * hw) + 0.06, z1 + nz * hw], P3 = [x1 - nx * hw, nrGround(x1 - nx * hw, z1 - nz * hw) + 0.06, z1 - nz * hw];
            const uv = (p) => [p[0] / 8, -p[2] / 8]; gr.quadUp(P0, P1, P2, P3, [one, one, one, one], [uv(P0), uv(P1), uv(P2), uv(P3)]);
            if (m % 3 === 0) exclPush((x0 + x1) / 2, (z0 + z1) / 2, hw + 2.5); } } }
      const gl = new GB(), gk = new GB(true), wl = [0.95, 0.95, 0.92];
      for (const kt of sk.kart || []) {
        const closed = kt[0] === 1, pts = []; for (let k = 1; k + 1 < kt.length; k += 2) pts.push([kt[k], kt[k + 1]]);
        const n = pts.length, hw = closed ? 4 : 3, last = closed ? n : n - 1;
        const nrm = (k) => { const a = pts[closed ? (k - 1 + n) % n : Math.max(0, k - 1)], b = pts[closed ? (k + 1) % n : Math.min(n - 1, k + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; };
        const turn = (k) => { if (!closed && (k === 0 || k === n - 1)) return 0; const a = pts[(k - 1 + n) % n], b = pts[k], c = pts[(k + 1) % n], u = Math.atan2(b[1] - a[1], b[0] - a[0]), v = Math.atan2(c[1] - b[1], c[0] - b[0]); let t = v - u; while (t > Math.PI) t -= TAU; while (t < -Math.PI) t += TAU; return t; };
        let acc = 0;
        for (let k = 0; k < last; k++) {
          const j = (k + 1) % n, A = pts[k], B = pts[j], na = nrm(k), nb = nrm(j), l = Math.hypot(B[0] - A[0], B[1] - A[1]);
          const Q = (p, nn, o, h) => [p[0] + nn[0] * o, nrGround(p[0] + nn[0] * o, p[1] + nn[1] * o) + h, p[1] + nn[1] * o], uv = (p) => [p[0] / 8, -p[2] / 8];
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
      addM(gr, aMat); addM(gl, lMat); addM(gk, cMat); }

    /* ---- the grandstand across the straight from the pits (def.stands, its outline def.sk.gs: deep along most of its length, narrowing at its
       far end): its rows climbing away from the track behind the wall, six sections, the crowd on the seats, the hall under its back rows to
       the outline's back, a roof on pillars at the back reaching out over the rows, the place's name on its fascia ---- */
    let nStands = 0;
    const gsAt = (d) => { const Gs = sk.gs || []; if (Gs.length < 2) return null; const st = Gs[1][0] - Gs[0][0], q = (d - Gs[0][0]) / st, i0 = Math.floor(q), f = q - i0; if (i0 < 0 || i0 + 1 >= Gs.length) return null;
      const a = Gs[i0], b = Gs[i0 + 1]; if (!a[2] && !b[2]) return null; if (!a[2]) return [b[1], b[2]]; if (!b[2]) return [a[1], a[2]]; return [lerp(a[1], b[1], f), lerp(a[2], b[2], f)]; };
    for (const [a0, a1, sd, rowsMax, roof, secs] of ST) {
      const sec = (a1 - a0) / secs, dep = 0.85, seat = [0.06, 0.3, 0.68];
      let mid = null;
      for (let q = 0; q < secs; q++) {
        const d0 = a0 + q * sec + (q ? 0.7 : 0), d1 = a0 + (q + 1) * sec - (q < secs - 1 ? 0.7 : 0);
        for (let d = d0; d < d1 - 0.01; d += 6) {
          const e = Math.min(d1, d + 6), dm = (d + e) / 2, pr = gsAt(dm), s0 = sAt(d), s1 = sAt(e), sm = sAt(dm), i = T.idx(sm), bar = sd > 0 ? T.br[i] : T.bl[i];
          const o0 = Math.max(bar + 2.4, pr ? pr[0] : bar + 2.4), far = pr ? pr[1] : o0 + rowsMax * dep + 2, rows = Math.min(rowsMax, Math.floor((far - o0 - 2.5) / dep)); if (rows < 3) continue;
          const g = scen.get(...atSf(sm, sd * (o0 + 6)).slice(0, 2)), y0 = Y(sm) - 0.1;
          for (let t = 0; t < rows; t++) { const oa = o0 + t * dep, ob = oa + dep, hgt = 0.7 + t * 0.42, [x, z, hd] = atSf(sm, sd * (oa + dep / 2));
            box(g, x, y0, z, e - d + 0.02, hgt, dep, hd, [0.62, 0.63, 0.66], seat);
            const A = atSf(s0, sd * oa), Bq = atSf(s1, sd * oa), C = atSf(s1, sd * ob), D = atSf(s0, sd * ob), yy = y0 + hgt + 0.02, u1 = (e - d) / 12;
            const pts = sd < 0 ? [D, C, Bq, A] : [A, Bq, C, D];
            crowdG.quadUp(...pts.map(p => [p[0], yy, p[1]]), [W1, W1, W1, W1], [[0, t * 0.11], [u1, t * 0.11], [u1, t * 0.11 + 0.1], [0, t * 0.11 + 0.1]]); }
          const top = 0.7 + rows * 0.42, ob = o0 + rows * dep, back = Math.max(ob + 0.5, far), [bx, bz, bh] = atSf(sm, sd * (ob + back) / 2);
          box(g, bx, y0, bz, e - d + 0.02, top + 0.5, back - ob, bh, [0.86, 0.86, 0.84], [0.7, 0.7, 0.69]);   // the hall under the back rows (to the outline's back)
          if (back - ob > 4) { const [wx, wz] = atSf(sm, sd * (back + 0.03)); glassWall(...atSf(s0, sd * (back + 0.03)).slice(0, 2), ...atSf(s1, sd * (back + 0.03)).slice(0, 2), y0 + 1.0, y0 + Math.min(top, 7.6) - 0.4, [bx, y0 + top / 2, bz]); void wx; void wz; }
          if (roof) { const ry = y0 + top + 3.0, r0 = o0 + rows * dep * 0.22, r1 = back + 0.6, [rx, rz] = atSf(sm, sd * (r0 + r1) / 2);
            box(g, rx, ry, rz, e - d + 0.04, 0.35, r1 - r0, bh, [0.9, 0.91, 0.92], [0.72, 0.74, 0.76]);
            const [px, pz] = atSf(sm, sd * (back - 0.4)); box(g, px, y0 + top, pz, 0.4, ry - y0 - top, 0.4, bh, [0.84, 0.85, 0.87]);
            if (!mid || Math.abs(dm - (a0 + a1) / 2) < Math.abs(mid.dm - (a0 + a1) / 2)) mid = { dm, r0, ry, rows }; }
        }
      }
      for (let d = a0; d <= a1; d += 6) { const pr = gsAt(d), [x, z, i] = onSide(sAt(d), sd, 4); CR.block(x, z, 7, (pr ? pr[1] - pr[0] : rowsMax * dep) + 6, T.hd[i]); exclPush(...atSf(sAt(d), sd * ((pr ? (pr[0] + pr[1]) / 2 : 30))).slice(0, 2), (pr ? (pr[1] - pr[0]) / 2 : 20) + 6); }
      if (mid) { const sm = sAt(mid.dm), i = T.idx(sm), [fx, fz] = atSf(sm, sd * (mid.r0 - 0.15)); board(fx, mid.ry - 1.3, fz, T.nx[i] * sd, T.nz[i] * sd, 16, 1.6, AT.houli);
        for (const dd of [-60, -30, 30, 60]) { const s = sAt(mid.dm + dd), [px, pz] = atSf(s, sd * (mid.r0 + 1)); flagPole(px, mid.ry + 0.35, pz, T.hd[T.idx(s)] + Math.PI * 0.5, 5); } }
      for (let ii = T.idx(sAt(a0 - 8)), n = 0; n < (a1 - a0 + 16) / ds; n++, ii = (ii + 1) % N) fence[side2(sd)][ii] = 1;
      nStands++;
    }

    /* ---- marshal posts (white huts on the outside of the corners, two marshals in orange by each, one with a flag), the TV towers at the
       hairpins and the chicane, place names by the straights (the braking boards are World's: brakeBoards), the sponsors over the rails ---- */
    let nPosts2 = 0, nTV = 0;
    {
      const free = (x, z, r) => !excluded(x, z) && nrSlope(x, z) < 0.45 && nrNear(x, z).dd > r;
      const place = (d0, side, extra, r) => { for (const dd of [0, 10, -10, 20, -20, 34, -34]) { const p = onSide(sAt(d0 + dd), side, extra); if (free(p[0], p[1], r)) return p; } return null; };
      const outside = (d) => { let k = 0; for (let e = -40; e <= 40; e += 4) k += T.k[T.idx(sAt(d + e))]; return k > 0 ? -1 : 1; };
      const hut = (x, z, i, side) => { const y = nrGround(x, z), g = scen.get(x, z), hd = T.hd[i], nx = T.nx[i] * side, nz = T.nz[i] * side;
        box(g, x, y - 0.3, z, 2.1, 0.5, 1.9, hd, [0.55, 0.56, 0.58]); box(g, x, y + 0.2, z, 1.9, 2.1, 1.7, hd, [0.95, 0.95, 0.93], null, true);
        box(g, x - nx * 0.2, y + 2.3, z - nz * 0.2, 2.3, 0.14, 2.3, hd, [0.82, 0.12, 0.12], [0.86, 0.16, 0.14]);
        box(g, x - nx * 0.86, y + 1.0, z - nz * 0.86, 1.3, 0.7, 0.06, hd, [0.18, 0.24, 0.32], null, true); exclPush(x, z, 3.5); CR.avoid(x, z, 1.6); };
      const marked = [];
      for (const c of T.corners) { if (c.sev < 2) continue; const d = dS(c.i0 * ds); if (marked.some(m => Math.abs(m - d) < 160 || Math.abs(m - d) > L - 160)) continue;
        const side = outside(d + 10), p = place(d + 10, side, 3.0, 2.5); if (!p) continue; marked.push(d);
        const [x, z, i] = p; hut(x, z, i, side); nPosts2++;
        const fx = -T.nx[i] * side, fz = -T.nz[i] * side, [mx, mz] = onSide(i * ds, side, 1.1), y = nrGround(mx, mz);
        person(mx + T.tx[i] * 2.4, y, mz + T.tz[i] * 2.4, fx, fz, [0.98, 0.5, 0.08], 5, true); person(mx - T.tx[i] * 1.0, y, mz - T.tz[i] * 1.0, fx, fz, [0.98, 0.5, 0.08], 0, true); }
      const grey = [0.6, 0.62, 0.64], dark = [0.17, 0.18, 0.2], plank = [0.42, 0.34, 0.24];
      for (const [n, dd] of [['Jugozahodna lasnica', 15], ['Šikana pri hotelih', 0], ['Vzhodna lasnica', 10], ['Zadnji ovinek', 0]]) {   // the TV towers
        const d = nameD(n); if (d == null) continue;
        let side = outside(d + dd), p = place(d + dd, side, 6.0, 4);
        if (!p) { side = -side; p = place(d + dd, side, 6.0, 4); } if (!p) continue;
        const [x, z, i] = p, g = scen.get(x, z), y = nrGround(x, z), H = 4.2, hd = T.hd[i], c = Math.cos(hd), sn = Math.sin(hd), at = (a, b) => [x + c * a - sn * b, z + sn * a + c * b];
        for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const [lx, lz] = at(a, b); cyl(g, lx, y - 0.1, lz, 0.07, H + 1.15, 5, grey); }
        for (const hy of [1.4, 2.8]) for (const [a, b, rot] of [[0, -1, 0], [0, 1, 0], [-1, 0, Math.PI / 2], [1, 0, Math.PI / 2]]) { const [lx, lz] = at(a, b); box(g, lx, y + hy, lz, 2.0, 0.07, 0.07, hd + rot, grey); }
        box(g, x, y + H, z, 2.6, 0.16, 2.6, hd, plank, [0.5, 0.41, 0.3]);
        for (const [a, b, rot] of [[0, -1.25, 0], [0, 1.25, 0], [-1.25, 0, Math.PI / 2], [1.25, 0, Math.PI / 2]]) { const [lx, lz] = at(a, b); box(g, lx, y + H + 0.95, lz, 2.5, 0.06, 0.06, hd + rot, grey); }
        { const [lx, lz] = at(0.6, 0.6 * side); cyl(g, lx, y + H, lz, 0.04, 2.5, 4, grey); cone(g, lx, y + H + 2.15, lz, 1.35, 0.5, 8, [0.86, 0.06, 0.09], [0.97, 0.97, 0.95], 0); }
        const tf = -side, [cx, cz] = at(0, 0.55 * tf), [mx, mz] = at(0.1, -0.35 * tf), ny = T.nx[i] * tf, nz = T.nz[i] * tf;
        for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; cyl(g, cx + Math.cos(a) * 0.28, y + H + 0.08, cz + Math.sin(a) * 0.28, 0.025, 1.25, 3, dark, null, 0.02); }
        box(g, cx, y + H + 1.3, cz, 0.72, 0.36, 0.3, Math.atan2(nz, ny), dark, [0.25, 0.26, 0.28]);
        person(mx, y + H + 0.08, mz, ny, nz, [0.13, 0.3, 0.62], 3, true);
        exclPush(x, z, 4.5); CR.avoid(x, z, 2.4); nTV++;
      }
      for (const [d0, cell] of [[560, AT.houli], [1760, AT.taichung], [2620, AT.taiwan]]) { const s = sAt(d0), side = roomSide(s); signPost(s, side, 1.8, cell, 3.6, 0.9, 1.3); }
      for (const [a, b] of [[480, 720], [1620, 1960], [2520, 2760]]) for (const side of [-1, 1]) for (let dd = a, k = 0; dd < b; dd += 15, k++) {   // the sponsors over the rails along the straights
        const s = sAt(dd), i = T.idx(s); if (kindAt(i, side) !== 0) continue;
        const [x, z] = onSide(s, side, 0.35), y = T.hy[i] + 0.78;
        board(x, y, z, T.nx[i] * side, T.nz[i] * side, 9.6, 0.82, AT.sp + ((k + (side > 0 ? 3 : 0) + Math.floor(a / 7)) % 8));
      }
    }

    /* ---- spectators: a few groups on the grass at the hairpins, the chicane and the first right (World's fewFans keeps few of them on a real
       circuit); chain link in front of them ---- */
    let nFans = 0;
    { const M = { first: 2.2, gap: 1.2, excluded, below: 3, above: 8, sit: 0.3, flag: 0.08 };
      const run = (d0, d1, side, o) => { const n = crowdRun(CR, sAt(d0), sAt(d1), side, Object.assign({}, M, o));
        if (n) for (let ii = T.idx(sAt(d0 - 6)), k = 0; k < (d1 - d0 + 12) / ds; k++, ii = (ii + 1) % N) if (!fence[side2(side)][ii]) fence[side2(side)][ii] = 1; nFans += n || 0; return n; };
      for (const [n, half, rows] of [['Prvi desni', 30, 2], ['Jugozahodna lasnica', 34, 2], ['Šikana pri hotelih', 30, 2], ['Vzhodna lasnica', 30, 2], ['Dvojni desni', 24, 1]]) { const d = nameD(n); if (d == null) continue;
        const side = roomSide(sAt(d)); run(d - half, d + half, side, { rows, dens: 0.45, label: 'HL ' + n }); }
      for (const e of CR.circ) exclPush(e.x, e.z, e.r); }
    // catch fences (chain link on posts) behind the walls, the tyre walls and wherever the spectators stand
    const fenceC = new Chunks(256, true);
    for (const side of [-1, 1]) {
      const fcs = fence[side2(side)], bar = side > 0 ? T.br : T.bl; let acc = 0;
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N; if (!fcs[i] || !fcs[j] || kindAt(i, side) < 0 || kindAt(j, side) < 0 || (side > 0 && PP && T.pitAt(i * ds))) { acc += ds; continue; }
        const e = fcs[i] === 2 ? 1.25 : 0.55, Q = (ii, y) => { const o = side * (bar[ii] + e); return [T.px[ii] + T.nx[ii] * o, T.hy[ii] + y, T.pz[ii] + T.nz[ii] * o]; };
        const u0 = acc / 2.5, u1 = (acc + ds) / 2.5, ins = Q(i, 1); ins[0] += T.nx[i] * side * 3; ins[2] += T.nz[i] * side * 3;
        const q0 = Q(i, 0.9); fenceC.get(q0[0], q0[2]).quadO(q0, Q(j, 0.9), Q(j, 3.8), Q(i, 3.8), W1, ins, [[u0, 0], [u1, 0], [u1, 1.15], [u0, 1.15]]);
        if (i % 3 === 0) { const p = Q(i, 0); box(scen.get(p[0], p[2]), p[0], p[1] - 0.2, p[2], 0.1, 4.05, 0.1, T.hd[i], [0.6, 0.61, 0.64]); }
        acc += ds;
      }
    }

    /* ---- the woods round the circuit: camphor trees with betel-nut palms among them in patches, bamboo along their edges, the cheaper crowns
       farther than 60 m from the road; the trellised vineyards and pear orchards in the fields, palms and bamboo by the field edges, the
       villages' yard trees, a lone camphor on the circuit's lawns. The ground under the crowns turns to leaf litter (G.cov) ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const WIND = { value: 0 }; out.dyn.wind = WIND;   // the crowns sway a little, each tree in its own rhythm (the higher up, the more)
    tMat.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = WIND;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
        '#ifdef USE_INSTANCING\nfloat wPh = instanceMatrix[3].x * 0.07 + instanceMatrix[3].z * 0.05;\n#else\nfloat wPh = 0.0;\n#endif\n' +
        'float wK = position.y * position.y * 0.02;\ntransformed.x += wK * sin( uWind * 1.1 + wPh );\ntransformed.z += wK * 0.6 * sin( uWind * 0.83 + wPh * 1.7 );');
    };
    tMat.customProgramCacheKey = () => 'nrTreeWind';
    const tk = [new IChunks(hlTreeGeo(0), tMat, 128), new IChunks(hlTreeGeo(1), tMat, 128), new IChunks(hlTreeGeo(2), tMat, 128)];   // near the road (casting shadows): camphor, palm, bamboo
    const tb = new IChunks(hlTreeGeo(3), tMat, 128);   // the shrubs (no shadows)
    const tf = [new IChunks(hlTreeGeo(4), tMat, 192), new IChunks(hlTreeGeo(5), tMat, 192)];   // farther out: camphor, palm
    const trel = new IChunks(hlTrellisGeo(), new THREE.MeshLambertMaterial({ vertexColors: true }), 192);
    let nTrees = 0, nTrel = 0;
    {
      const Lt = NRC * NRT, maxT = Math.round(70000 * dens), CRW = [0.36, 0.16, 0.3, 0.52];   // (crown radius / width)
      const plant = (sp, far, x, z, hgt, wid, c) => {
        if (excluded(x, z) || paddock(x, z)) return false;
        const y = nrGround(x, z) - 0.1, rot = crH(x, z, 88) * TAU;
        if (sp === 3) tb.add(x, y, z, rot, wid, hgt, c); else if (far && sp < 2) tf[sp].add(x, y, z, rot, wid, hgt, c); else tk[sp].add(x, y, z, rot, wid, hgt, c);
        nrShade(x, z, wid * CRW[sp], sp === 0 ? 0.9 : 0.6); nTrees++; return true; };
      const nearOk = (x, z, rd, r2) => { if (rd >= 48) return true; const nn = nrNear(x, z); return !(nn.i >= 0 && (nn.dd < 3.4 || (nn.dd < 7 && r2 < 0.4))); };
      const palmy = nrPN(12, 5970);   // (where the betel-nut palms grow in the woods: patches)
      for (let tj = 0; tj < G.ntz && nTrees < maxT; tj++) for (let ti = 0; ti < G.ntx && nTrees < maxT; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za + 1.7; zz < za + Lt; zz += 3.4) for (let xx = xa + 1.7; xx < xa + Lt; xx += 3.4) {
          const rd = nrDist(xx, zz); if (rd > 250) continue;
          const cl = nrLC(xx, zz), far = rd > 60, h1 = crH(xx, zz, 81), jx = xx + (crH(xx, zz, 82) - 0.5) * 2.6, jz = zz + (crH(xx, zz, 83) - 0.5) * 2.6;
          if (cl === 1) {   // the woods: a camphor or a palm at most spots (far out every other one, a bigger crown); bamboo along the edges
            if (h1 > 0.6 || (far && (Math.round(xx / 3.4) + Math.round(zz / 3.4)) & 1) || !nearOk(jx, jz, rd, h1)) continue;
            const e = nrEdge(xx, zz), pa = palmy((xx - G.x0) / 900, (zz - G.z0) / 900) > 0.62 && crH(xx, zz, 84) < 0.7, bam = !pa && !far && crH(xx, zz, 89) < 0.04 + e * 0.25, cv = 0.88 + crH(xx, zz, 86) * 0.22;
            if (bam) { const hgt = 8 + crH(xx, zz, 85) * 6; plant(2, false, jx, jz, hgt, hgt * 0.75, [1, 1, 1]); continue; }
            if (pa) { const hgt = 9 + crH(xx, zz, 85) * 6; plant(1, far, jx, jz, hgt, hgt, [cv, cv, cv * 0.96]); continue; }
            if (h1 > 0.42 && !far) continue;   // (the camphors' crowns are broad: fewer of them)
            const hgt = 12 + crH(xx, zz, 85) * 8; plant(0, far, jx, jz, hgt, hgt * (far ? 1.05 : 0.95), [cv * 0.98, cv, cv * 0.94]);
            continue;
          }
          if (cl === 2 && (Math.round(xx / 3.4) % 4 === 0) && (Math.round(zz / 3.4) % 4 === 0) && rd < 220) {   // the fields: a trellis on every 13.6 m where the parcel is a vineyard or an orchard
            const p = parcel(xx, zz); if (p >= 0.5 && p < 0.82 && nrLCf(xx, zz, 2) > 0.7 && nearOk(xx, zz, rd, 1) && nrNear(xx, zz).dd > 12 && !excluded(xx, zz)) {
              const sz = 13.4, hg = 1.9 + crH(xx, zz, 90) * 0.4; trel.add(xx, nrGround(xx, zz) - 0.05, zz, Math.atan2(0.6, 0.8), sz, hg, [0.94 + crH(xx, zz, 91) * 0.12, 1, 0.95]); nTrel++; continue; } }
          if (far) continue;
          const e = cl === 0 || cl === 2 ? nrEdge(xx, zz) : 0;
          if (e > 0 && h1 < e * 0.12 && nearOk(jx, jz, rd, h1 * 6)) { const t = crH(xx, zz, 87), hgt = t < 0.4 ? 9 + crH(xx, zz, 88) * 5 : t < 0.7 ? 8 + crH(xx, zz, 88) * 5 : 3 + crH(xx, zz, 88) * 2;   // the woods' edge: bamboo, palms, shrubs
            plant(t < 0.4 ? 2 : t < 0.7 ? 1 : 3, false, jx, jz, hgt, t < 0.4 ? hgt * 0.75 : t < 0.7 ? hgt : hgt * 1.2, [1, 1, 1]); continue; }
          if (cl === 2 && h1 < 0.006 && nearOk(jx, jz, rd, 1)) { const hgt = 8 + crH(xx, zz, 92) * 6; plant(1, false, jx, jz, hgt, hgt, [1, 1, 1]); continue; }   // a palm by the fields
          if (cl === 0 && h1 > 0.997 && nearOk(jx, jz, rd, 1)) { const hgt = 9 + crH(xx, zz, 93) * 5; plant(0, false, jx, jz, hgt, hgt * 0.95, [1, 1, 1]); continue; }   // a lone camphor on the lawns
          if (cl === 3 && h1 < 0.02 && nearOk(jx, jz, rd, 1)) { const t = crH(xx, zz, 94), hgt = t < 0.5 ? 8 + crH(xx, zz, 95) * 6 : t < 0.75 ? 9 + crH(xx, zz, 95) * 5 : 6 + crH(xx, zz, 95) * 4;   // the yards' trees
            plant(t < 0.5 ? 0 : t < 0.75 ? 1 : 2, false, jx, jz, hgt, t < 0.5 ? hgt * 0.95 : t < 0.75 ? hgt : hgt * 0.75, [1, 1, 1]); }
        }
      }
    }
    for (const t of tk) t.addTo(root, true);
    tb.addTo(root, false);
    for (const t of tf) t.addTo(root, false);
    trel.addTo(root, false);

    /* ---- terrain tiles and the grass verges out past the barriers (256 m chunks), coloured now: the verge mown short and fresh by the road,
       easing into the lawn's own colour behind the barrier ---- */
    let nTiles = 0;
    {
      const grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let k = 0; k < tiles.length; k += 3) { const m = new THREE.Mesh(nrTileGeo(tiles[k], tiles[k + 1], tiles[k + 2] === 1 ? 1 : 4), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); nTiles++; }
      const vA = [0.96, 1.08, 0.92], vB = [0.92, 1.04, 0.88];
      for (let c0 = 0; c0 < N; c0 += CH) {
        const gv = new RB(true), pv = [-1, -1];
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
          const i = ii % N;
          for (const side of [-1, 1]) {
            const si = side2(side), vr = hlVerge(i, side), pts = vr.map(([o, h]) => Pt(i, side * o, h)), nL = pts.length;
            const g3 = nrGCol(pts[nL - 2][0], pts[nL - 2][2]), g4 = nrGCol(pts[nL - 1][0], pts[nL - 1][2]);
            const cols = [vA, vA, vB, [lerp(vB[0], g3[0], 0.5), lerp(vB[1], g3[1], 0.5), lerp(vB[2], g3[2], 0.5)], g4];
            const ordered = side > 0 ? { p: pts, c: cols } : { p: pts.slice().reverse(), c: cols.slice().reverse() };
            const rv = gv.row(ordered.p, ordered.c, ordered.p.map(p => [p[0] / 14, -p[2] / 14]));
            if (pv[si] >= 0) gv.link(pv[si], rv, 0, nL - 1); pv[si] = rv;
          }
        }
        addM(gv, gMat);
      }
      G.col = G.cov = P.edge = null;   // (build only)
    }

    /* ---- farther out (sk.lm): the amusement park's two big wheels and its rides, the high-speed railway's viaduct, the power lines' pylons.
       Most of them beyond what the camera draws (out.farClip: the fog's far edge): in the vertex shader each point farther than 0.7 of the
       camera's far plane is drawn on that sphere in its own direction (the same place and size in the picture: before the horizon's ring,
       rsFar, at 0.72-0.74; the nearer things drawn over it), in the fog of that distance. One mesh, never culled ---- */
    const lms = { wheels: 0, rides: 0, spans: 0, pylons: 0 };
    { const fg = new GB(), CX = def.far ? def.far.x : 0, CZ = def.far ? def.far.z : 0, WH = [0.93, 0.94, 0.95], GD = [[0.85, 0.2, 0.18], [0.95, 0.74, 0.16], [0.18, 0.5, 0.82], [0.25, 0.68, 0.4], [0.9, 0.45, 0.6]];
      for (const [x, z, y, H] of LM.wh || []) {   // a big wheel facing the circuit: two rims, the cross ties and the spokes, the cabins, the legs, the hub, the station
        const Rw = H * 0.46, hy = y + H - Rw - H * 0.03, ul = Math.hypot(x - CX, z - CZ) || 1, ax = (x - CX) / ul, az = (z - CZ) / ul, ex = -az, ez = ax, n = 36, wd = Rw * 0.045, rc = Math.max(0.22, Rw * 0.008);
        const rim = (k, sg, rr) => { const a = k / n * TAU; return [x + ex * Math.cos(a) * rr + ax * sg * wd, hy + Math.sin(a) * rr, z + ez * Math.cos(a) * rr + az * sg * wd]; };
        for (const sg of [-1, 1]) for (let k = 0; k < n; k++) beam(fg, rim(k, sg, Rw), rim(k + 1, sg, Rw), rc, WH);
        for (let k = 0; k < n; k += 2) { beam(fg, rim(k, -1, Rw), rim(k, 1, Rw), rc * 0.7, WH); beam(fg, [x + ax * (k % 4 ? 1 : -1) * wd * 2, hy, z + az * (k % 4 ? 1 : -1) * wd * 2], rim(k, k % 4 ? 1 : -1, Rw), rc * 0.6, WH); }
        for (let k = 1; k < n; k += 2) { const p = rim(k, 0, Rw * 1.02), cs = Rw * 0.055; box(fg, p[0], p[1] - cs * 1.1, p[2], cs, cs * 1.1, cs * 1.2, Math.atan2(ez, ex), GD[(k >> 1) % GD.length]); }
        for (const sg of [-1, 1]) for (const e of [-1, 1]) beam(fg, [x + ex * e * Rw * 0.42 + ax * sg * Rw * 0.22, y - 1, z + ez * e * Rw * 0.42 + az * sg * Rw * 0.22], [x + ax * sg * wd * 1.5, hy, z + az * sg * wd * 1.5], rc * 1.7, WH);
        beam(fg, [x - ax * wd * 3, hy, z - az * wd * 3], [x + ax * wd * 3, hy, z + az * wd * 3], rc * 2.6, [0.7, 0.72, 0.75]);
        box(fg, x - ex * Rw * 0.1, y - 1, z - ez * Rw * 0.1, Rw * 0.5, 5, Rw * 0.3, Math.atan2(ez, ex), [0.88, 0.87, 0.84], [0.5, 0.52, 0.56]);
        lms.wheels++;
      }
      LM.ride && LM.ride.forEach((rp, ri) => {   // the rides: a steel track on its outline, climbing and dropping, on supports
        const pts = []; for (let k = 0; k + 1 < rp.length; k += 2) pts.push([rp[k], rp[k + 1]]); if (pts.length < 3) return;
        let cx = 0, cz = 0; for (const p of pts) { cx += p[0]; cz += p[1]; } cx /= pts.length; cz /= pts.length;
        const path = []; for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.round(l / 6));
          for (let q = 0; q < m; q++) { const t = q / m; path.push([lerp(a[0], b[0], t) * 0.85 + cx * 0.15, lerp(a[1], b[1], t) * 0.85 + cz * 0.15]); } }
        const n = path.length, col = RIDE[ri % RIDE.length], yb = nrGround(cx, cz), hmax = 10 + crH(cx, cz, 71) * 18, ph = crH(cx, cz, 72);
        const hAt = (k) => yb + 3 + hmax * (0.5 - 0.5 * Math.cos(TAU * (k / n + ph))) * (0.75 + 0.25 * Math.sin(TAU * k / n * 3));
        for (let k = 0; k < n; k++) { const a = path[k], b = path[(k + 1) % n], ya = hAt(k), yb2 = hAt((k + 1) % n), dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, ox = -dz / l * 0.6, oz = dx / l * 0.6;
          for (const sg of [-1, 1]) beam(fg, [a[0] + ox * sg, ya, a[1] + oz * sg], [b[0] + ox * sg, yb2, b[1] + oz * sg], 0.16, col);
          if (k % 3 === 0) beam(fg, [a[0], nrGround(a[0], a[1]) - 0.5, a[1]], [a[0], ya - 0.1, a[1]], 0.22, [0.82, 0.83, 0.85]); }
        lms.rides++;
      });
      for (const rl of LM.rail || []) {   // the high-speed railway on its viaduct: the box girder and its noise walls on piers every 30 m (within 2.8 km)
        if (!rl[0]) continue;
        const raw = []; for (let k = 1; k + 2 < rl.length; k += 3) raw.push([rl[k], rl[k + 1], rl[k + 2]]);
        const pts = []; for (let k = 0; k + 1 < raw.length; k++) { const a = raw[k], b = raw[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.round(l / 30));
          for (let q = 0; q < m; q++) { const t = q / m; pts.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]); } }
        if (raw.length) pts.push(raw[raw.length - 1]);
        const ys = pts.map((p, k) => { let s = 0, c = 0; for (let q = Math.max(0, k - 3); q <= Math.min(pts.length - 1, k + 3); q++) { s += pts[q][2]; c++; } return s / c + 13; });
        for (let k = 0; k + 1 < pts.length; k++) {
          const a = pts[k], b = pts[k + 1]; if (Math.hypot(a[0] - CX, a[1] - CZ) > 2800) continue;
          const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, ox = -dz / l * 6.5, oz = dx / l * 6.5, ya = ys[k], yb = ys[k + 1], cg = [0.78, 0.78, 0.76], cd = [0.5, 0.5, 0.49];
          const A0 = [a[0] - ox, ya, a[1] - oz], A1 = [a[0] + ox, ya, a[1] + oz], B1 = [b[0] + ox, yb, b[1] + oz], B0 = [b[0] - ox, yb, b[1] - oz], dn = (p, h) => [p[0], p[1] - h, p[2]], up = (p, h) => [p[0], p[1] + h, p[2]], ins = [(a[0] + b[0]) / 2, (ya + yb) / 2 - 1, (a[1] + b[1]) / 2];
          fg.quadO(A0, A1, B1, B0, [0.7, 0.7, 0.68], [ins[0], ins[1] - 5, ins[2]]);   // the deck
          fg.quadO(dn(A0, 2.4), dn(B0, 2.4), dn(B1, 2.4), dn(A1, 2.4), cd, [ins[0], ins[1] + 5, ins[2]]);   // its underside
          for (const [p, q] of [[A0, B0], [A1, B1]]) fg.quadO(dn(p, 2.4), dn(q, 2.4), up(q, 1.6), up(p, 1.6), cg, ins);   // the girder's sides, the noise walls
          const ga = a[2]; beam(fg, [a[0], ga - 2, a[1]], [a[0], ya - 2.4, a[1]], 1.3, cg);   // the pier
          lms.spans++;
        }
      }
      for (const pl of LM.pw || []) {   // the pylons: lattice towers, the legs narrowing to the waist, the cross-arms for the conductors (within 2.6 km)
        const cab = pl[0], tw = []; for (let k = 1; k + 2 < pl.length; k += 3) tw.push([pl[k], pl[k + 1], pl[k + 2]]);
        const H = cab >= 6 ? 46 : 34, st = [0.6, 0.62, 0.65];
        tw.forEach((p, k) => {
          if (Math.hypot(p[0] - CX, p[1] - CZ) > 2600) return;
          const a = tw[Math.max(0, k - 1)], b = tw[Math.min(tw.length - 1, k + 1)], dl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, lx = (b[0] - a[0]) / dl, lz = (b[1] - a[1]) / dl, cx = -lz, cz = lx;   // (along the line, across it)
          const [x, z, y] = p, b0 = H * 0.1, wst = 1.4, yw = y + H * 0.66, yt = y + H, C = (s, t, r, yy) => [x + (lx * s + cx * t) * r, yy, z + (lz * s + cz * t) * r];
          for (const [s, t] of [[1, 1], [1, -1], [-1, -1], [-1, 1]]) { beam(fg, C(s, t, b0, y - 1), C(s, t, wst, yw), 0.18, st); beam(fg, C(s, t, wst, yw), C(s, t, 0.5, yt), 0.14, st); }
          for (const [s0, t0, s1, t1] of [[1, 1, -1, -1], [1, -1, -1, 1]]) { beam(fg, C(s0, t0, b0 * 0.75, y + H * 0.08), C(s1, t1, b0 * 0.45, y + H * 0.36), 0.1, st); beam(fg, C(s0, -t0, b0 * 0.75, y + H * 0.08), C(s1, -t1, b0 * 0.45, y + H * 0.36), 0.1, st); }
          for (const f of cab >= 6 ? [0.7, 0.82, 0.94] : [0.74, 0.9]) { const ya = y + H * f, aw = H * (f > 0.9 ? 0.15 : 0.2); beam(fg, [x - cx * aw, ya, z - cz * aw], [x + cx * aw, ya, z + cz * aw], 0.2, st); }
          lms.pylons++;
        });
      }
      if (!fg.empty) {
        const FR = { value: 480 }, FC = { value: new THREE.Vector3() }, fm = new THREE.MeshLambertMaterial({ vertexColors: true });   // (the camera's place our own uniform: three r128 gives cameraPosition to a Lambert material only with an envMap)
        fm.onBeforeCompile = (sh) => { sh.uniforms.uFarR = FR; sh.uniforms.uFarC = FC;
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uFarR;\nuniform vec3 uFarC;').replace('#include <begin_vertex>', '#include <begin_vertex>\n{ vec3 hlV = transformed - uFarC; float hlD = length( hlV ); if ( hlD > uFarR ) transformed = uFarC + hlV * ( uFarR / hlD ); }'); };
        fm.customProgramCacheKey = () => 'hlFar';
        const m = new THREE.Mesh(fg.geometry(), fm); m.frustumCulled = false; m.matrixAutoUpdate = false; m.name = 'hlFar';
        m.onBeforeRender = (rd, sc, cam) => { if (cam && cam.isPerspectiveCamera && cam.far > 50) { FR.value = cam.far * 0.7; FC.value.setFromMatrixPosition(cam.matrixWorld); } };
        root.add(m);
      }
    }
    if (def.far && API.rsFar) out.dyn.far = API.rsFar(root, def.far, 'summer', 6, hlFarCol);   // the hills on the horizon (World.update: no car, back where it was built)

    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    farB.addTo(sceneryGroup, matV, false, true);
    glass.addTo(sceneryGroup, new THREE.MeshLambertMaterial({ map: glassTex, vertexColors: true }), false, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: atlas })); if (bm) bm.castShadow = false;
    addM(crowdG, crowdUV(new THREE.MeshLambertMaterial({ map: tex.crowd, vertexColors: true }), 1, 0.11, 0.1));
    fenceC.addTo(root, fMat, false, true);
    if (flagL.length) root.add(API.rbFlags(flagL, CR.U.uTime));
    crowdFinish(CR, root, out);
    out.stats = { tiles: nTiles, trees: nTrees, trellis: nTrel, posts: nPosts, garages: nGar, buildings: nBld, houses: nHouse, stands: nStands, trucks: nTrucks, cars: nCars, fans: nFans, marshals: nPosts2, tv: nTV,
      flags: flagL.length, kart: nKart, wheels: lms.wheels, rides: lms.rides, viaduct: lms.spans, pylons: lms.pylons };   // (read by the tests)
    return out;
  }

  World.keep('NR', 'houli');   // (its grids kept between its builds; World.build frees the others': tools/razdeli-proge.mjs)
  World.ext.houli = (scene, tex, opts) => buildHouli(scene, tex, opts);
})();
