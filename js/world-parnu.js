/* =========================================================================
   WORLD — Pärnu, Estonija (theme 'parnu'): the circuit on the coastal meadows at Papsaare north-west of Pärnu, a builder of its own
   (World.ext.parnu) on the corridor terrain of js/world.js (nrPrep and the nr* helpers: the Copernicus heights of def.dem on a 16 m grid,
   the land cover def.lc of OpenStreetMap, ESA WorldCover and the canopy). The first of the five circuits with a builder of their own (plan:
   docs/dirkalisca-celine.md, »Novih pet«: the pattern the others follow; the track: docs/proge/parnu.md).
   Its own: the coastal meadows (hay, the wet hollows by the ditches), Scots pines and birches in the woods, junipers and willows on the open
   land, the crop fields; the pit building with its 29 garages (13 open for the crews, the others shut), the upper floor and the race control
   over the start line, the glass pavilion past it, the asphalt paddock behind them with the teams' trucks, vans and motorhomes; the covered
   grandstand across the straight; gravel traps where the barriers stand far out, tyre walls round the slower corners, armco on posts,
   concrete along the pit straight; the pond in the infield (def.sk.sea: the water of js/world-rbring.js, API.rbSea) with reeds, the ditches
   with rushes, the fences round the circuit; Estonian flags (blue, black, white). Of the shared parts only the low-level ones (terrain,
   crowds, flags, water); the composition and the look its own. Only place names on its boards (no names of the circuit, its people, races
   or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, NRC, NRN, NRT, RB, TAU, atS, atSf, box, clamp, cone, crH, crowdCtx, crowdFinish, crowdPut, crowdRun, crowdUV,
    cyl, gable, ico, lerp, nrAUV, nrDist, nrEdge, nrGCol, nrGround, nrLC, nrLCf, nrLump, nrNear, nrPN, nrPrep, nrShade, nrSlope, nrTileGeo,
    nrTileOn, parkedCar, pitExcl, pitKerbs, pitLaneScenery, pitOpen, pixAvg, propFloorTable, rng, roadsideProps, sstep, vary, waterMat
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  const EE = [[0.0, 0.45, 0.81], [0.06, 0.06, 0.07], [0.97, 0.97, 0.95]];   // the Estonian flag: blue, black, white (stripes from the top)
  const TEAM = [[0.85, 0.16, 0.13], [0.16, 0.36, 0.8], [0.95, 0.95, 0.94], [0.18, 0.62, 0.3], [0.96, 0.72, 0.12], [0.14, 0.14, 0.16], [0.95, 0.45, 0.1], [0.5, 0.26, 0.7], [0.1, 0.62, 0.72], [0.85, 0.2, 0.5], [0.4, 0.42, 0.46], [0.2, 0.3, 0.55], [0.7, 0.1, 0.1]];
  const PA_SEA = { color: 0x4d6656, wo: { len: 1.0, amp: 0.25, refl: 0.55, land: 0.5, shal: 0.65, lap: 0.3, surf: 0 } };   // the pond: dark, peaty, still

  // the coastal meadow under the vertex colours (256 px = 14 m, tileable): fescue and bent grass, a warmer green than an inland pasture, with
  // yarrow, knapweed and buttercups
  function paGrassTex(aniso) {
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data, r = rng(5801);
    const n1 = nrPN(8, 5802), n2 = nrPN(24, 5803), n3 = nrPN(64, 5804);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const u = i / S, v = j / S, n = n1(u, v) * 0.3 + n2(u, v) * 0.4 + n3(u, v) * 0.3, k = 0.86 + n * 0.26 + (r() - 0.5) * 0.12, y = n2(u + 0.27, v + 0.61) - 0.5, o = (j * S + i) * 4;
      d[o] = clamp((78 + y * 14) * k, 0, 255); d[o + 1] = clamp((126 + y * 8) * k, 0, 255); d[o + 2] = clamp((56 + y * 4) * k, 0, 255); d[o + 3] = 255;
    }
    x.putImageData(img, 0, 0); const avg = pixAvg(d);
    x.lineWidth = 1;
    for (const [st, n] of [['rgba(44,76,30,0.45)', 820], ['rgba(170,182,108,0.38)', 520]]) {   // blades (drawn across the edges too: tileable)
      x.strokeStyle = st; x.beginPath();
      for (let k = 0; k < n; k++) { const px = r() * S, py = r() * S, dx = (r() - 0.5) * 2, dy = -(1.4 + r() * 2.8);
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const qx = px + a * S, qy = py + b * S; if (qx > -6 && qx < S + 6 && qy > -6 && qy < S + 6) { x.moveTo(qx, qy); x.lineTo(qx + dx, qy + dy); } } }
      x.stroke(); }
    for (const [st, n, sz] of [['#efeee2', 60, 1], ['#8e5aa4', 22, 1], ['#e2cc40', 26, 1]]) { x.fillStyle = st; for (let k = 0; k < n; k++) x.fillRect(Math.floor(r() * (S - sz)), Math.floor(r() * (S - sz)), sz, sz); }   // yarrow, knapweed, buttercups
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso || 4; t.grassPic = true; t.avgCol = avg; return t;
  }
  // unit trees (height 1, instances scale them): 0 a Scots pine (a tall bare trunk, grey below and orange-brown above, a flat open crown
  // high up), 1 a birch (a white trunk, a narrow light crown), 2 a juniper (a dark narrow column), 3 a willow or an alder bush; 4, 5 the
  // pine and a broadleaf far from the road (cheaper)
  function paTreeGeo(kind) {
    const g = new GB(), R = rng(5810 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;   // (smooth normals; the flag restored below)
    const pn = [0.2, 0.29, 0.15], sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k], be = [0.38, 0.53, 0.22];
    if (kind === 0) {
      cyl(g, 0, -0.02, 0, 0.016, 0.76, 4, [0.44, 0.36, 0.3], [0.7, 0.43, 0.27], 0.01);
      ico(g, 0.02, 0.8, 0.02, 0.17, 0.6, pn, R, 0.32); nrLump(g, -0.11, 0.74, -0.05, 0.12, 0.6, sh(pn, 1.07), R, 0.3); nrLump(g, 0.07, 0.9, -0.07, 0.1, 0.62, sh(pn, 1.12), R, 0.25);
    } else if (kind === 1) {
      cyl(g, 0, -0.02, 0, 0.014, 0.66, 4, [0.92, 0.91, 0.87], [0.82, 0.8, 0.76], 0.009);
      ico(g, 0, 0.66, 0, 0.17, 1.55, be, R, 0.3); nrLump(g, 0.06, 0.54, 0.05, 0.12, 1.2, sh(be, 1.08), R, 0.25);
    } else if (kind === 2) {
      cone(g, 0, -0.04, 0, 0.26, 1.04, 6, [0.2, 0.31, 0.19], [0.28, 0.4, 0.25], 0);
    } else if (kind === 3) {
      ico(g, 0, 0.42, 0, 0.52, 0.72, [0.34, 0.47, 0.26], R, 0.32);
    } else if (kind === 4) {
      cyl(g, 0, -0.02, 0, 0.02, 0.74, 3, [0.5, 0.36, 0.28], null, 0.012); ico(g, 0, 0.82, 0, 0.21, 0.62, pn, R, 0.3);
    } else {
      ico(g, 0, 0.6, 0, 0.3, 1.0, be, R, 0.28);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function paReedGeo() {   // a tuft of reed or rushes (unit height): thin blades, pale at the tips
    const g = new GB(), R = rng(5820);
    for (let q = 0; q < 7; q++) { const a = R() * TAU, d = R() * 0.32, h = 0.6 + R() * 0.4; cone(g, Math.cos(a) * d, -0.05, Math.sin(a) * d, 0.08, h, 3, [0.3, 0.38, 0.18], [0.66, 0.62, 0.4], R() * TAU); }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  let paATex = null;
  function paAtlas() {   // text boards (4 x 16 cells of 256 x 64): place names, the start line's, the flag's stripes, the game's sponsors
    if (paATex) paATex.dispose();
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const cell = (k, bg, fg, txt, px, stripe) => { const cx = (k % 4) * 256, cy = Math.floor(k / 4) * 64; x.fillStyle = bg; x.fillRect(cx, cy, 256, 64); if (stripe) { x.fillStyle = stripe; x.fillRect(cx, cy + 56, 256, 8); x.fillRect(cx, cy, 256, 4); }
      x.fillStyle = fg; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, cx + 128, cy + 33, 240); };
    cell(4, '#0072ce', '#fff', 'PÄRNU', 44, '#fff'); cell(5, '#16181c', '#fff', 'EESTI', 44, '#0072ce'); cell(6, '#16181c', '#fff', 'START · FINIŠ', 30, '#0072ce');
    cell(7, '#f4f4f0', '#0072ce', 'PAPSAARE', 38, '#16181c'); cell(8, '#0a3d6e', '#fff', 'PÄRNUMAA', 36, '#fff');
    { const cx = 256, cy = 128; for (let b = 0; b < 3; b++) { x.fillStyle = ['#0072ce', '#000', '#fff'][b]; x.fillRect(cx, cy + b * 64 / 3, 256, 64 / 3 + 0.5); } }   // cell 9: the flag's stripes (the paddock's banners)
    const SP = (typeof Tex !== 'undefined' && Tex.SPONSORS) || [['HITROLET', '#101418', '#ffd23f']];
    for (let k = 0; k < 8; k++) { const [txt, bg, fg] = SP[k % SP.length]; cell(40 + k, bg, fg, txt, 40, 'rgba(255,255,255,.14)'); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (paATex = t);
  }
  const AT = { parnu: 4, eesti: 5, start: 6, papsaare: 7, maakond: 8, flag: 9, sp: 40 };
  // the verge's cross-section beyond the road edge ([offset, height above the road]), lifted onto the ground where it rises: the verges and
  // the knocked props' floor use the same rows
  function paVerge(i, side) {
    const w = T.w, bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i], lift = (o, h) => { const q = side * o; return [o, Math.max(h, nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.06 - y)]; };
    return [[w, 0.0], [w + 1.2, -0.04], lift(Math.max(w + 1.8, bar - 0.4), -0.1), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)];
  }

  function buildParnu(scene, tex, opts) {
    const R = rng(5830), N = T.N, w = T.w, ds = T.ds, dens = opts.density || 1, sStart = T.startS, def = T.def, L = T.len, sk = def.sk || {};
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
    const P = API.NR, G = P.G, sea = API.rbSea, PP = def.pit, PJ = PP ? T.pitJ() : null, ST = def.stands || [];
    // the ditches (sk.ditch: OSM's ditches and drains) in a hash of 32 m cells: the distance to the nearest (the wet meadow along them)
    const DH = new Map(), DC = 32;
    for (const ln of sk.ditch || []) for (let k = 0; k + 3 < ln.length; k += 2) {
      const ax = ln[k], az = ln[k + 1], bx = ln[k + 2], bz = ln[k + 3];
      for (let a = Math.floor((Math.min(ax, bx) - 12) / DC); a <= Math.floor((Math.max(ax, bx) + 12) / DC); a++) for (let b = Math.floor((Math.min(az, bz) - 12) / DC); b <= Math.floor((Math.max(az, bz) + 12) / DC); b++) {
        const key = a * 4096 + b; let Ls = DH.get(key); if (!Ls) DH.set(key, Ls = []); Ls.push(ax, az, bx, bz); } }
    const ditchD = (x, z) => { const Ls = DH.get(Math.floor(x / DC) * 4096 + Math.floor(z / DC)); if (!Ls) return 99; let best = 99;
      for (let q = 0; q < Ls.length; q += 4) { const ax = Ls[q], az = Ls[q + 1], dx = Ls[q + 2] - ax, dz = Ls[q + 3] - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1), e = Math.hypot(x - ax - dx * t, z - az - dz * t); if (e < best) best = e; }
      return best; };
    // the paddock behind the pit building (OSM's car park there): from the building's back to 48 m out, along it
    const PAD = { d0: -108, d1: 104, o0: 46, o1: 92 };
    const paddock = (x, z) => { if (!PP) return false; const n = nrNear(x, z); if (n.i < 0) return false; const lat = (x - T.px[n.i]) * T.nx[n.i] + (z - T.pz[n.i]) * T.nz[n.i], d = dSs(n.i * ds);
      return d > PAD.d0 && d < PAD.d1 && lat > PAD.o0 && lat < PAD.o1 - Math.max(0, d - 40) * 0.25; };
    // the ground level with the road from the pit wall out behind the pit building, the pavilion and the paddock (the cars in the lane run at
    // the road's height), easing into the land beyond; the same under the grandstand across the straight. Then the pond dug in (API.rbSea)
    { const pad0 = (x, z, h) => { const i = NRN.i; if (i < 0) return h;
        const lat = NRN.lat, hn = NRN.hn; let d = i * ds - sStart; d = ((d % L) + L) % L; if (d > L / 2) d -= L;
        if (PJ && lat > 0 && d >= PJ.a - 12 && d <= PJ.b + 12) { const p = T.pitAt(i * ds), reach = (p ? p.o : w + 3.6) + (d > -140 && d < 220 ? 82 : 24);
          return lat < reach ? hn - 0.06 : lat < reach + 16 ? lerp(hn - 0.06, h, sstep(reach, reach + 16, lat)) : h; }
        for (const [a, b, sd] of ST) { if (lat * sd <= 0) continue;
          const f = Math.min(sstep(a - 30, a - 10, d), sstep(b + 30, b + 10, d)) * (1 - sstep(34, 48, lat * sd)); if (f > 0) return lerp(h, hn - 0.06, f); }
        return h; };
      P.pad = sea.pad(pad0); }
    // the ground's colours (multiplying the meadow map): the coastal meadows in patches, hay, the wet hollows along the ditches and round the
    // pond (darker, bluer), the crop fields (straw and young green in drills), the pine woods' floor (needles, moss and heather: the trees'
    // canopy, G.cov; beyond 250 m the land cover alone), trodden yards by the buildings, the paddock's asphalt, mown grass behind the barriers
    const gTex = ownTex(paGrassTex(tex.grass.anisotropy)), AV = gTex.avgCol;
    const ab = (r, g, b) => [r / AV[0], g / AV[1], b / AV[2]];   // (an absolute colour as the vertex colour that makes it on the map)
    const ASPH = ab(0.38, 0.38, 0.37), YARD = ab(0.47, 0.46, 0.4);
    P.colFn = (x, z, ny, dd, cov, o) => {
      const m = P.n3(x, z), q = P.n4(x, z), fo = nrLCf(x, z, 1), fi = nrLCf(x, z, 2), se = nrLCf(x, z, 3);
      let r = 1.0 + (m - 0.5) * 0.16 + (q - 0.5) * 0.1, g = 1.0 + (m - 0.5) * 0.12 + (q - 0.5) * 0.06, b = 0.98 + (m - 0.5) * 0.1;
      const hay = sstep(0.6, 0.8, P.n5(x, z)) * 0.6; r += hay * 0.26; g += hay * 0.06; b -= hay * 0.14;   // the hay meadows
      const wet = Math.max(sstep(9, 1.5, ditchD(x, z)), sstep(-18, -3, sea.d(x, z))) * (1 - fo); r -= wet * 0.22; g -= wet * 0.05; b += wet * 0.03;   // the wet hollows
      if (fi > 0.02) { const t = P.n6(x, z), row = 0.94 + 0.06 * Math.sin((x * 0.6 + z * 0.8) * 2.2), k = fi * 0.85;   // the crop fields
        r = lerp(r, lerp(1.24, 0.9, t) * row, k); g = lerp(g, lerp(1.0, 1.07, t) * row, k); b = lerp(b, lerp(0.6, 0.86, t) * row, k); }
      const fl = Math.max(clamp(cov, 0, 1), fo * lerp(0.35, 1, sstep(225, 250, nrDist(x, z))));   // the pine woods' floor
      r = lerp(r, 0.8 + m * 0.14, fl); g = lerp(g, 0.7 + m * 0.1, fl); b = lerp(b, 0.62, fl);
      if (se > 0.02) { const k = se * 0.55; r = lerp(r, YARD[0], k); g = lerp(g, YARD[1], k); b = lerp(b, YARD[2], k); }   // trodden yards and verges by the buildings
      if (dd < 5) { const t = sstep(5, 0.5, dd); r = lerp(r, 0.96, t); g = lerp(g, 1.06, t); b = lerp(b, 0.95, t); }   // mown behind the barriers
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
    const shade = (i, o) => { const rl = T.rl[i]; let k = 0.82 - (0.12 + 0.12 * brk[i]) * Math.exp(-((o - rl) * (o - rl)) / 5); if (Math.abs(o) > w * 0.92) k -= 0.04; return [k * 1.01, k, k * 0.99]; };
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
    /* ---- gravel traps where the barriers stand far out (Core: T.gravL / gravR, gravel past the kerb): the local gravel, sandy grey, from the kerb
       (or the edge) to just before the barrier, tapering in and out; a strip of short grass along the kerb where the trap opens wide ---- */
    {
      const gs = new Chunks(256, true), gb = new Chunks(256), grn = [0.86, 1.0, 0.82];
      const gc = (p) => { const k = 0.94 + P.n4(p[0], p[2]) * 0.12; return [k * 1.04, k * 1.01, k * 0.94]; };   // (the local granite gravel: grey, a little warm)
      for (const side of [-1, 1]) {
        const flag = side > 0 ? T.gravR : T.gravL, bar = side > 0 ? T.br : T.bl, K = kerb[side2(side)];
        for (let i = 0; i < N; i++) {
          const j = (i + 1) % N; if (!flag[i] && !flag[j]) continue;
          const fi = flag[i] ? 1 : 0, fj = flag[j] ? 1 : 0, inI = w + (K[i] ? T.curbW : 0.05), inJ = w + (K[j] ? T.curbW : 0.05);
          const outI = lerp(inI + 0.1, bar[i] - 0.7, fi), outJ = lerp(inJ + 0.1, bar[j] - 0.7, fj);
          if (outI < inI + 0.05 && outJ < inJ + 0.05) continue;
          const uvp = (p) => [p[0] / 6, -p[2] / 6], a = Pt(i, side * inI, 0.026), b = Pt(i, side * outI, 0.026), c = Pt(j, side * outJ, 0.026), d = Pt(j, side * inJ, 0.026);
          gs.get(a[0], a[2]).quadUp(a, b, c, d, [gc(a), gc(b), gc(c), gc(d)], [uvp(a), uvp(b), uvp(c), uvp(d)]);
          if (fi && fj && !K[i] && !K[j]) { const e = Pt(i, side * (inI + 0.9), 0.03), f = Pt(j, side * (inJ + 0.9), 0.03);   // (the grass edge where no kerb is)
            gb.get(a[0], a[2]).quadUp(Pt(i, side * inI, 0.03), e, f, Pt(j, side * inJ, 0.03), [grn, grn, grn, grn]); }
        }
      }
      gs.addTo(root, new THREE.MeshLambertMaterial({ map: ownTex(API.rbGravelTex()), vertexColors: true }), false, true);
      gb.addTo(root, new THREE.MeshLambertMaterial({ map: gTex, vertexColors: true }), false, true);
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

    /* ---- barriers: concrete along the pit wall and opposite the pits (in front of the grandstand), tyre walls round the outside of the slower
       corners' gravel traps, armco on posts elsewhere; none where the pit lane leaves and joins the circuit ---- */
    const t13 = (i) => { const d = dSs(i * ds); return d > -150 && d < 170; };   // opposite the pits: the start straight's left
    const tyreOn = [new Uint8Array(N), new Uint8Array(N)];
    for (const c of T.corners) { if (c.sev < 2) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, si = side2(-c.dir);
      for (let k = c.i0 - 8; k <= i1c + 12; k++) { const ii = ((k % N) + N) % N; if ((si ? T.gravR : T.gravL)[ii]) tyreOn[si][ii] = 1; } }
    const kindAt = (i, side) => {   // -1 none, 0 armco, 1 concrete wall, 2 tyre wall
      if (side > 0 && PP) { if (pitOpen(i)) return -1; const p = T.pitAt(i * ds); if (p) return p.gap ? -1 : 1; }
      if (tyreOn[side2(side)][i]) return 2;
      return side < 0 && t13(i) ? 1 : 0;
    };
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const tyMat = new THREE.MeshLambertMaterial({ map: tex.tires, vertexColors: true });
    const postGeo = (() => { const g = new GB(); box(g, 0, 0, 0, 0.12, 1, 0.12, 0, [0.46, 0.47, 0.5], null, true); return g.geometry(); })();
    const posts = new IChunks(postGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), 512);
    const fence = [new Uint8Array(N), new Uint8Array(N)];   // catch fences (1: behind a rail or a wall, 2: behind a tyre wall)
    const steel = [0.8, 0.82, 0.85], steelD = [0.5, 0.52, 0.56], conc = [0.8, 0.8, 0.78], concD = [0.64, 0.64, 0.62], W1 = [1, 1, 1];
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
    out.propFloor = propFloorTable(null, (i, side) => paVerge(i, side));
    out.propStats = roadsideProps(out.props, { exits: 10, apexes: 4, wallEdge: [2.2, 3.0], stacks: [5, 7], rows2: 0.3, floor: out.propFloor, skip: (i) => { const d = dSs(i * ds); return d > -200 && d < 260; } });
    // the game's sponsors on the concrete walls (tex.sponsors: 4 m boards, read from the road)
    { const sb = new Chunks(256, true);
      for (const side of [-1, 1]) for (let i = 0, n = 0; i + 2 <= N; i += 2) {
        const j = (i + 2) % N; if (kindAt(i, side) !== 1 || kindAt(j, side) !== 1 || kindAt((i + 1) % N, side) !== 1) continue;
        const k = (n++ * 3 + (side > 0 ? 1 : 0)) % 8, u0 = (k % 2) * 0.5, v1 = 1 - Math.floor(k / 2) * 0.25, bar = side > 0 ? T.br : T.bl, o = (ii) => side * (bar[ii] + 0.1);
        const A = Pt(i, o(i), 0.14), B = Pt(j, o(j), 0.14), C = Pt(j, o(j), 0.96), D = Pt(i, o(i), 0.96), uL = side < 0 ? u0 : u0 + 0.5, uR = side < 0 ? u0 + 0.5 : u0;
        sb.get(A[0], A[2]).quadO(A, B, C, D, W1, Pt(i, side * (bar[i] + 2), 0.5), [[uL, v1 - 0.25], [uR, v1 - 0.25], [uR, v1], [uL, v1]]); }
      sb.addTo(root, new THREE.MeshLambertMaterial({ map: tex.sponsors }), false, true); }

    /* ---- scenery helpers (vertex coloured, 128 m chunks), the text boards, the Estonian flags ---- */
    const scen = new Chunks(128), ban = new GB(true), crowdG = new GB(true), flagL = [];
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const CR = crowdCtx({ gH: nrGround, near: (x, z) => nrNear(x, z).dd, maxSlope: 0.8 });   // spectators, marshals, the crews' men (instanced)
    const atlas = paAtlas();
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
    const flagPole = (x, y, z, rot, H) => { cyl(scen.get(x, z), x, y - 0.2, z, 0.05, H + 0.25, 5, [0.86, 0.86, 0.88]); flagL.push([x, y + H, z, rot, EE, 1.65, 1.05]); CR.avoid(x, z, 0.45); };
    const roomSide = (s) => { let l = 0, r = 0; for (let d = -30; d <= 30; d += 6) { const i = T.idx(s + d); l += T.bl[i]; r += T.br[i]; } return r > l ? 1 : -1; };
    const person = (x, y, z, fx, fz, col, pose, staff) => crowdPut(CR, x, y, z, fx, fz, { col, pose, staff: !!staff }, 1);

    /* ---- START / FINISH: the gantry with the start lights over the line, its banner ---- */
    {
      const [x, z, h, i] = atS(sStart, 0), gy = T.hy[i], g = scen.get(x, z), nx = T.nx[i], nz = T.nz[i], gray = [0.2, 0.22, 0.26], oL = -(T.bl[i] + 1.0), oR = T.br[i] + 0.45, span = (oR - oL) / 2, oc = (oR + oL) / 2;
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
       pit wall, the player's box for the renderer's crew), the pit building our own (garages: false) ---- */
    let nGar = 0;
    if (PP) {
      pitLaneScenery({ R, scen, prop: (kind, x, z, yaw, col) => out.props.push({ kind, x, z, yaw: yaw || 0, col: col || 0 }), excl: exclPush, root, out, ownTex, Y, garages: false });
      for (let d = PP[1]; d <= PP[2]; d += 6) { const s = sAt(d), p = T.pitAt(s); if (!p) continue;   // no trees, no crowd from the pit wall out behind the building
        const r = (p.o + 34 - p.wall) / 2, [x, z] = onSide(s, 1, r); exclPush(x, z, r + 2); }
      pitExcl(exclPush);
      nGar = pitBuilding();
    }
    // the pit building: 29 garages along the lane from 117 m before the start line to 117 m after it, 26.5 m from the centre line (the apron's
    // back edge) to 44 m: in the middle the crews' 13 (10 m wide, open: World's measures, out.pitBoxes[].gar, so that the renderer's team
    // colours, door and flags fit), 8 shut garages of 6.5 m at either end; over the middle the upper floor with a glass front and a balcony,
    // the race control's glass room over the start line, flags on the roof; the apron in front of the shut ones (the lane's own apron is
    // World's where the lane is full width)
    function pitBuilding() {
      const B0 = -117, B1 = 117, F = 26.5, BK = 44, RF = 4.0, WALL = [0.9, 0.9, 0.87], WT = [0.62, 0.63, 0.64], DOOR = [0.74, 0.76, 0.78], GLASS = [0.2, 0.27, 0.34], GT = [0.3, 0.36, 0.42];
      const kb = (g, s, o, y, sx, sy, sz, col, top, nb) => { const [x, z, hd] = atSf(s, o); box(g, x, Y(s) + y, z, sx, sy, sz, hd, col, top, nb); };
      const kf = (g, s0, s1, o, y0, y1, col, dir) => { const [x0, z0] = atSf(s0, o), [x1, z1] = atSf(s1, o), [xb, zb] = atSf((s0 + s1) / 2, o - (dir || -1) * 0.2), dy = Y((s0 + s1) / 2);   // a flat panel facing the lane (dir -1) or the paddock (+1)
        g.quadO([x0, dy + y0, z0], [x1, dy + y0, z1], [x1, dy + y1, z1], [x0, dy + y1, z0], col, [xb, dy + (y0 + y1) / 2, zb]); };
      const CAB = [[0.2, 0.21, 0.24], [0.78, 0.14, 0.12], [0.15, 0.3, 0.62]], BLK = [0.13, 0.13, 0.15], SIL = [0.66, 0.68, 0.72], SCR = [0.16, 0.24, 0.38], CMP = [[0.86, 0.14, 0.12], [0.95, 0.8, 0.14], [0.92, 0.92, 0.9]];
      const bays = [];   // [from, to (metres after the start line), crew]
      for (let d = B0; d < -65 - 0.1; d += 6.5) bays.push([d, d + 6.5, false]);
      for (let d = -65; d < 65 - 0.1; d += 10) bays.push([d, d + 10, true]);
      for (let d = 65; d < B1 - 0.1; d += 6.5) bays.push([d, d + 6.5, false]);
      let k = 0;
      for (const [a, b, crew] of bays) {
        const s0 = sAt(a), s1 = sAt(b), sm = sAt((a + b) / 2), Lb = b - a, g = scen.get(...atSf(sm, 34).slice(0, 2));
        kb(g, sm, (F + BK) / 2, RF, Lb + 0.02, 0.42, BK - F + 0.3, WALL, WT);                                     // the roof
        kb(g, sm, BK - 0.15, 0, Lb + 0.02, RF, 0.3, WALL, null, true);                                           // the back wall (the paddock side)
        if (k % 2 === 0) kf(g, sAt((a + b) / 2 - 0.6), sAt((a + b) / 2 + 0.6), BK + 0.02, 0, 2.2, [0.36, 0.38, 0.42], 1);   // a door to the paddock
        kf(g, sAt(a + 0.6), sAt(b - 0.6), BK + 0.02, 2.6, 3.4, [0.24, 0.3, 0.38], 1);                             // the high windows
        if (crew) {   // a crew's garage, open to the apron: its front pillars, the header over the door, the floor, the inside (World's measures)
          const f0 = F, b0 = 33.7, o = (f0 + b0) / 2;
          kb(g, sAt(a + 5), b0 - 0.15, 0, 10.02, RF, 0.3, WALL, null, true);
          for (const sd of [-1, 1]) { kb(g, sAt(a + 5 + sd * 4.885), o, 0, 0.25, RF, 7.2, WALL, null, true); kb(g, sAt(a + 5 + sd * 4.56), f0 + 0.15, 0, 0.9, 3.3, 0.3, WALL, null, true); }
          kb(g, sAt(a + 5), f0 + 0.15, 3.3, 10.02, 0.7, 0.3, WALL);
          kb(g, sAt(a + 5), f0 - 0.02, 3.45, 9.4, 0.5, 0.05, [0.2, 0.21, 0.24]);                                   // the band (the renderer's team colour over it)
          kb(g, sAt(a + 5), o, 0, 9.52, 0.03, 6.9, [0.42, 0.44, 0.47], [0.5, 0.52, 0.55], true);                   // the epoxy floor
          kf(g, sAt(a + 0.25), sAt(a + 9.75), b0 - 0.302, 0.03, 1.28, [0.3, 0.31, 0.35]);
          kb(g, sAt(a + 5), b0 - 0.33, 1.7, 1.5, 0.85, 0.04, [0.07, 0.07, 0.08], null, true); kf(g, sAt(a + 4.31), sAt(a + 5.69), b0 - 0.352, 1.75, 2.5, SCR);   // the timing screen
          for (const ca of [1.3, 2.5, 7.5, 8.7]) { const s = sAt(a + ca); kb(g, s, b0 - 0.64, 0, 1.1, 0.1, 0.55, [0.08, 0.08, 0.09], null, true); kb(g, s, b0 - 0.64, 0.1, 1.15, 1.0, 0.6, CAB[(k + ca | 0) % 3], [0.1, 0.1, 0.11]);
            for (let dw = 0; dw < 4; dw++) { const y = 0.1 + (0.22 + dw * 0.2); kf(g, sAt(a + ca - 0.5), sAt(a + ca + 0.5), b0 - 0.945, y, y + 0.025, SIL); } }
          for (const ta of [0.85, 9.15]) { const s = sAt(a + ta), cmp = CMP[(k + (ta > 5 ? 1 : 0)) % 3]; const [x, z] = atSf(s, o - 0.6); cyl(g, x, Y(s) + 0.03, z, 0.36, 1.38, 8, BLK, [0.17, 0.17, 0.19]);
            for (let l = 0; l < 3; l++) cyl(g, x, Y(s) + 0.03 + (l + 0.42) * 0.46, z, 0.366, 0.074, 8, cmp); }
          for (const la of [-1.9, 1.9]) kb(g, sAt(a + 5 + la), o, 3.92, 0.28, 0.07, 5.8, [0.98, 0.98, 0.94]);       // the strip lights
          kb(g, sAt(a + 5), (b0 + BK) / 2, 0, 10.02, RF, BK - b0 - 0.3, WALL, null, true);                         // the rooms behind it
        } else {   // a shut garage: a roller door between pillars, the header over it
          kb(g, sm, (F + 0.12 + BK) / 2, 0, Lb, RF, BK - F - 0.12, WALL, null, true);
          kb(g, sm, F + 0.06, 0, Lb - 1.0, 3.3, 0.12, DOOR, null, true);
          for (let dl = 0.45; dl < 3.2; dl += 0.45) kf(g, sAt(a + 0.55), sAt(b - 0.55), F - 0.005, dl, dl + 0.03, [0.6, 0.62, 0.64]);   // its slats
          kb(g, sAt(a + 0.25), F + 0.15, 0, 0.5, 3.3, 0.3, WALL, null, true); kb(g, sAt(b - 0.25), F + 0.15, 0, 0.5, 3.3, 0.3, WALL, null, true);
          kb(g, sm, F + 0.15, 3.3, Lb, 0.7, 0.3, WALL);
          const p = T.pitAt(sm), a1 = p ? p.o + 3.5 : 17.5;   // the apron in front of it where the lane narrows (World's apron is where the lane is full width)
          if (p && p.t < 0.999) { const A = atSf(s0, a1), Bq = atSf(s0, F), C = atSf(s1, F), D = atSf(s1, a1), cc = [0.74, 0.78, 0.7];
            g.quadUp([A[0], Y(s0) + 0.02, A[1]], [Bq[0], Y(s0) + 0.02, Bq[1]], [C[0], Y(s1) + 0.02, C[1]], [D[0], Y(s1) + 0.02, D[1]], [cc, cc, cc, cc]); }
        }
        k++;
      }
      // the upper floor over the middle (from 40 m before the start line to 40 m after it): set back 1.5 m, a glass front, a glass balustrade
      // along the balcony on the garages' roof, the roof slab; the race control's glass room over the start line, its roof, a mast
      for (let a = -40; a < 40; a += 10) {
        const sm = sAt(a + 5), g = scen.get(...atSf(sm, 34).slice(0, 2));
        kb(g, sm, (F + 1.5 + BK - 1) / 2, RF + 0.42, 10.02, 3.2, BK - 1 - F - 1.5, WALL, null, true);
        kb(g, sm, F + 1.46, RF + 0.75, 9.6, 2.5, 0.1, GLASS, GT, true);
        kb(g, sm, F + 0.25, RF + 0.42, 10.02, 1.0, 0.04, [0.62, 0.7, 0.76], null, true);
        kb(g, sm, (F + 0.8 + BK - 0.6) / 2, RF + 3.62, 10.3, 0.3, BK - 0.6 - F - 0.8, [0.86, 0.86, 0.84], [0.7, 0.71, 0.72]);
      }
      { const sm = sAt(0), g = scen.get(...atSf(sm, 34).slice(0, 2)), y0 = RF + 3.92;
        kb(g, sm, 34.5, y0, 12, 3.0, 8, GLASS, GT, true);
        for (const da of [-6, -3, 0, 3, 6]) kb(g, sAt(da), 30.45, y0, 0.12, 3.0, 0.12, [0.9, 0.9, 0.88], null, true);   // its mullions
        kb(g, sm, 34.5, y0 + 3.0, 14, 0.32, 10, [0.94, 0.94, 0.92], [0.78, 0.78, 0.77]);
        const [bx, bz, bh] = atSf(sm, 29.6), by = Y(sm) + y0 + 3.32; board(bx, by, bz, T.nx[T.idx(sm)], T.nz[T.idx(sm)], 9, 1.3, AT.parnu);
        for (const sd of [-1, 1]) { const ss = sAt(sd * 5), [px, pz] = atSf(ss, 37.5); flagPole(px, Y(ss) + y0 + 3.32, pz, T.hd[T.idx(ss)] + Math.PI * 0.5, 6.5); }
        void bh; }
      for (const da of [-100, -70, 70, 100]) { const ss = sAt(da), [px, pz] = atSf(ss, 40); flagPole(px, Y(ss) + RF + 0.42, pz, T.hd[T.idx(ss)] + Math.PI * 0.5, 5.5); }
      for (let d = B0; d <= B1; d += 8) { const [x, z] = atSf(sAt(d), (F + BK) / 2); CR.block(x, z, 9, BK - F + 2, T.hd[T.idx(sAt(d))]); }
      return bays.length;
    }

    /* ---- the buildings by the circuit (sk.bld, OSM: the club's timber house past the pavilion, a barn by the pit entry) and the glass pavilion
       (sk.pav); those by the pit lane moved back with the garages (4.75 m: the game's pit building stands back from the lane by its apron) ---- */
    let nBld = 0;
    const shiftOut = (x, z) => { const i = T.nearestIdx(x, z), d = dSs(i * ds), lat = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i];
      return PP && lat > 0 && lat < 40 && d > PP[1] && d < PP[2] ? [x + T.nx[i] * 4.75, z + T.nz[i] * 4.75] : [x, z]; };
    const B = sk.bld || [];
    for (let k = 0; k + 5 < B.length; k += 6) {
      const [x, z] = shiftOut(B[k], B[k + 1]), Lb = B[k + 2], Wb = B[k + 3], ang = B[k + 4] * Math.PI / 180, H = B[k + 5] || 4.5, g = scen.get(x, z);
      let y0 = 1e9; for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 0]]) { const cx = x + Math.cos(ang) * a * Lb / 2 - Math.sin(ang) * b * Wb / 2, cz = z + Math.sin(ang) * a * Lb / 2 + Math.cos(ang) * b * Wb / 2; y0 = Math.min(y0, nrGround(cx, cz)); }
      const wallC = [[0.86, 0.74, 0.46], [0.56, 0.26, 0.2], [0.8, 0.8, 0.76]][k / 6 % 3], roofC = [0.36, 0.4, 0.38];   // the timber's paint: ochre, barn red, pale grey; a grey sheet roof
      box(g, x, y0 - 0.4, z, Lb, H - 1.2 + 0.4, Wb, ang, vary(wallC, R, 0.04), null, true);
      gable(g, x, y0 + H - 1.2, z, Lb + 0.6, Wb + 0.6, Math.min(3.2, Wb * 0.42), ang, roofC, wallC);
      for (const a of [-0.3, 0.05, 0.35]) box(g, x + Math.cos(ang) * a * Lb, y0 + 0.9, z + Math.sin(ang) * a * Lb, 1.1, 1.2, Wb + 0.06, ang, [0.94, 0.94, 0.92], null, true);   // the windows' white frames
      CR.block(x, z, Lb, Wb, ang); exclPush(x, z, Math.max(Lb, Wb) / 2 + 3); nBld++;
    }
    if (sk.pav) {   // the glass pavilion: two floors of glass between white slabs, the roof overhanging, flags in front
      const [x, z] = shiftOut(sk.pav[0], sk.pav[1]), Lb = sk.pav[2], Wb = sk.pav[3], ang = sk.pav[4] * Math.PI / 180, g = scen.get(x, z), y0 = nrGround(x, z);
      const GL = [0.2, 0.28, 0.36], WH = [0.95, 0.95, 0.93];
      box(g, x, y0 - 0.3, z, Lb + 1.2, 0.5, Wb + 1.2, ang, [0.7, 0.7, 0.68]);
      for (const fl of [0, 1]) { const yb = y0 + 0.2 + fl * 3.6; box(g, x, yb, z, Lb, 3.2, Wb, ang, GL, GL, true); box(g, x, yb + 3.2, z, Lb + 0.4, 0.4, Wb + 0.4, ang, WH, WH); }
      box(g, x, y0 + 7.6, z, Lb + 2.4, 0.35, Wb + 2.4, ang, WH, [0.82, 0.82, 0.8]);
      for (let a = -Lb / 2; a <= Lb / 2 + 0.01; a += Lb / 9) for (const b of [-1, 1]) box(g, x + Math.cos(ang) * a - Math.sin(ang) * b * (Wb / 2 + 0.02), y0 + 0.2, z + Math.sin(ang) * a + Math.cos(ang) * b * (Wb / 2 + 0.02), 0.14, 7.2, 0.14, ang, WH, null, true);   // the mullions
      const i = T.nearestIdx(x, z);
      for (const a of [-0.3, 0, 0.3]) { const fx = x + Math.cos(ang) * a * Lb - T.nx[i] * (Wb / 2 + 4), fz = z + Math.sin(ang) * a * Lb - T.nz[i] * (Wb / 2 + 4); flagPole(fx, nrGround(fx, fz), fz, T.hd[i] + Math.PI * 0.5, 7); }
      CR.block(x, z, Lb + 2, Wb + 2, ang); exclPush(x, z, Lb / 2 + 4); nBld++;
    }

    /* ---- the paddock behind the pit building: its asphalt, the teams' trucks with their trailers (awnings out on the building's side), vans,
       motorhomes in a row behind them, cars; the paddock's lanes and the circuit's service roads (sk.road) as asphalt ---- */
    let nTrucks = 0, nCars = 0;
    if (PP) {
      const gp = new RB(true), pc = [1, 1, 1]; let pr = -1;
      for (let d = PAD.d0; d <= PAD.d1 + 0.01; d += 4) { const s = sAt(d), o1 = PAD.o1 - Math.max(0, d - 40) * 0.25, ps = [PAD.o0 - 2, (PAD.o0 + o1) / 2, o1].map(o => { const [x, z] = atSf(s, o); return [x, nrGround(x, z) + 0.05, z]; });
        const r = gp.row(ps, [pc, pc, pc], ps.map(p => [p[0] / 8, -p[2] / 8])); if (pr >= 0) gp.link(pr, r, 0, 2); pr = r; }
      addM(gp, new THREE.MeshLambertMaterial({ map: tex.asphalt, color: 0xd0d0cc }));
      const truck = (s, o, rot, col) => {   // a tractor and its trailer, its side towards the pits: the awning out over a table and chairs on that side
        const [x, z, hd] = atSf(s, o), y = nrGround(x, z), g = scen.get(x, z), c = Math.cos(hd), sn = Math.sin(hd), at = (a, b) => [x + c * a - sn * b, z + sn * a + c * b];
        const [tx, tz] = at(-1.6, 0); box(g, tx, y + 0.9, tz, 13.2, 3.1, 2.55, hd, col, [0.9, 0.9, 0.9]);
        const [cx, cz] = at(6.6, 0); box(g, cx, y + 0.6, cz, 2.6, 3.0, 2.5, hd, vary(col, R, 0.08), [0.2, 0.22, 0.25]);
        box(g, tx, y + 0.25, tz, 12.4, 0.65, 2.3, hd, [0.14, 0.14, 0.15], null, true);
        const [ax, az] = at(-1.6, -2.55); box(g, ax, y + 3.7, az, 11, 0.08, 2.6, hd, [0.9, 0.9, 0.88]);
        for (const a of [-6.6, 3.4]) { const [px, pz] = at(a, -3.75); box(g, px, y, pz, 0.08, 3.72, 0.08, hd, [0.7, 0.71, 0.73], null, true); }
        const [bx, bz] = at(-1.6, -2.3); box(g, bx, y + 0.72, bz, 1.8, 0.05, 0.8, hd, [0.92, 0.92, 0.9]);
        CR.block(x, z, 17, 6.5, hd); nTrucks++; void rot;
      };
      const vanAt = (s, o, col, kind) => { const [x, z, hd] = atSf(s, o), y = nrGround(x, z), g = scen.get(x, z);
        if (kind === 0) { box(g, x, y + 0.35, z, 5.6, 2.1, 2.0, hd, col, [0.88, 0.88, 0.88]); box(g, x + Math.cos(hd) * 2.3, y + 1.15, z + Math.sin(hd) * 2.3, 0.9, 0.7, 2.02, hd, [0.16, 0.2, 0.26], null, true); }
        else { box(g, x, y + 0.4, z, 8.2, 2.8, 2.45, hd, [0.95, 0.95, 0.93], [0.84, 0.84, 0.82]); box(g, x, y + 1.2, z, 8.22, 0.35, 2.47, hd, col, null, true); box(g, x + Math.cos(hd) * 3.4, y + 1.7, z + Math.sin(hd) * 3.4, 1.2, 0.8, 2.47, hd, [0.16, 0.2, 0.26], null, true); }
        CR.block(x, z, kind ? 8.6 : 6, 2.8, hd); nCars++; };
      for (let d = -96, k = 0; d < 96; d += 15, k++) { if (crH(d, 7, 51) < 0.12) continue; truck(sAt(d), 53, 0, TEAM[(k * 5 + 2) % TEAM.length]); }   // the trucks along the back of the building
      for (let d = -100, k = 0; d < 70; d += 9.5, k++) { if (crH(d, 8, 52) < 0.2) continue; vanAt(sAt(d), 70, TEAM[(k * 3 + 1) % TEAM.length], crH(d, 9, 53) < 0.55 ? 1 : 0); }   // motorhomes and vans in the row behind
      for (let d = -100; d < 50; d += 5.2) { if (crH(d, 10, 54) < 0.35) continue; const [x, z, hd] = atSf(sAt(d), 81 + (crH(d, 11, 55) - 0.5) * 1.5), y = nrGround(x, z);
        parkedCar(scen.get(x, z), x, y, z, hd + Math.PI / 2 + (crH(d, 12, 56) - 0.5) * 0.2, vary([[0.82, 0.82, 0.8], [0.12, 0.13, 0.15], [0.55, 0.57, 0.6], [0.6, 0.12, 0.1], [0.18, 0.28, 0.5]][Math.floor(crH(d, 13, 57) * 5)], R, 0.05)); nCars++; }
      for (let d = PAD.d0; d <= PAD.d1; d += 12) { const [x, z] = atSf(sAt(d), (PAD.o0 + PAD.o1) / 2); exclPush(x, z, 26); }
      // the people in the paddock: a few mechanics by the trucks, in their teams' colours
      for (let d = -90, k = 0; d < 90; d += 15, k++) { if (crH(d, 14, 58) < 0.4) continue; const [x, z, hd] = atSf(sAt(d + 2), 48.5); person(x, nrGround(x, z), z, -Math.sin(hd), Math.cos(hd), TEAM[(k * 5 + 2) % TEAM.length], 0, true); }
    }
    // the service roads (OSM: the paddock's lanes, the ways round the circuit; not on the track itself): asphalt ribbons on the ground
    { const gr = new GB(true), one = [0.94, 0.94, 0.92];
      for (const r of sk.road || []) { const hw = r[0] / 2;
        for (let k = 1; k + 3 < r.length; k += 2) { const ax = r[k], az = r[k + 1], bx = r[k + 2], bz = r[k + 3], l = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(l / 6));
          for (let m = 0; m < n; m++) { const x0 = ax + (bx - ax) * m / n, z0 = az + (bz - az) * m / n, x1 = ax + (bx - ax) * (m + 1) / n, z1 = az + (bz - az) * (m + 1) / n, nx = -(z1 - z0) / (l / n), nz = (x1 - x0) / (l / n);
            if (nrNear(x0, z0).dd < 1.5 || nrNear(x1, z1).dd < 1.5 || paddock(x0, z0)) continue;
            const P0 = [x0 - nx * hw, nrGround(x0 - nx * hw, z0 - nz * hw) + 0.06, z0 - nz * hw], P1 = [x0 + nx * hw, nrGround(x0 + nx * hw, z0 + nz * hw) + 0.06, z0 + nz * hw], P2 = [x1 + nx * hw, nrGround(x1 + nx * hw, z1 + nz * hw) + 0.06, z1 + nz * hw], P3 = [x1 - nx * hw, nrGround(x1 - nx * hw, z1 - nz * hw) + 0.06, z1 - nz * hw];
            const uv = (p) => [p[0] / 8, -p[2] / 8]; gr.quadUp(P0, P1, P2, P3, [one, one, one, one], [uv(P0), uv(P1), uv(P2), uv(P3)]);
            if (m % 3 === 0) exclPush((x0 + x1) / 2, (z0 + z1) / 2, hw + 2.5); } } }
      addM(gr, aMat); }

    /* ---- the grandstand across the straight from the pits (def.stands: its rows climbing away from the track behind the wall, three sections,
       the crowd on the seats, a roof on steel pillars over the back half, its name on the fascia) ---- */
    let nStands = 0;
    for (const [a0, a1, sd, rows, roof, secs] of ST) {
      const sec = (a1 - a0) / secs, dep = 0.85, seat = [0.0, 0.42, 0.74];
      for (let q = 0; q < secs; q++) {
        const d0 = a0 + q * sec + (q ? 0.7 : 0), d1 = a0 + (q + 1) * sec - (q < secs - 1 ? 0.7 : 0);
        for (let d = d0; d < d1 - 0.01; d += 6) {
          const e = Math.min(d1, d + 6), s0 = sAt(d), s1 = sAt(e), sm = sAt((d + e) / 2), i = T.idx(sm), o0 = T.bl[i] + 2.4, g = scen.get(...atSf(sm, sd * (o0 + 3)).slice(0, 2)), y0 = Y(sm) - 0.1;
          for (let t = 0; t < rows; t++) { const oa = o0 + t * dep, ob = oa + dep, hgt = 0.7 + t * 0.42, [x, z, hd] = atSf(sm, sd * (oa + dep / 2));
            box(g, x, y0, z, e - d + 0.02, hgt, dep, hd, [0.62, 0.63, 0.66], seat);
            const A = atSf(s0, sd * oa), Bq = atSf(s1, sd * oa), C = atSf(s1, sd * ob), D = atSf(s0, sd * ob), yy = y0 + hgt + 0.02, u1 = (e - d) / 12;
            const pts = sd < 0 ? [D, C, Bq, A] : [A, Bq, C, D];
            crowdG.quadUp(...pts.map(p => [p[0], yy, p[1]]), [W1, W1, W1, W1], [[0, t * 0.11], [u1, t * 0.11], [u1, t * 0.11 + 0.1], [0, t * 0.11 + 0.1]]); }
          const top = 0.7 + rows * 0.42, ob = o0 + rows * dep, [bx, bz, bh] = atSf(sm, sd * (ob + 0.25));
          box(g, bx, y0, bz, e - d + 0.02, top + 0.5, 0.5, bh, [0.55, 0.56, 0.6]);                                   // the back wall
          if (roof) { const ry = y0 + top + 2.9, [rx, rz] = atSf(sm, sd * (o0 + rows * dep * 0.62));
            box(g, rx, ry, rz, e - d + 0.04, 0.3, rows * dep * 0.85, bh, [0.76, 0.78, 0.8], [0.9, 0.91, 0.92]);
            const [px, pz] = atSf(sm, sd * (ob + 0.1)); box(g, px, y0, pz, 0.3, ry - y0, 0.3, bh, [0.82, 0.83, 0.86]); }
        }
      }
      for (let d = a0; d <= a1; d += 6) { const [x, z, i] = onSide(sAt(d), sd, 4); CR.block(x, z, 7, rows * dep + 3, T.hd[i]); exclPush(x, z, rows * dep + 6); }
      if (roof) { const sm = sAt((a0 + a1) / 2), i = T.idx(sm), o0 = T.bl[i] + 2.4, [fx, fz] = atSf(sm, sd * (o0 + rows * dep * 0.62 - rows * dep * 0.425 - 0.1)), ry = Y(sm) - 0.1 + 0.7 + rows * 0.42 + 2.9;
        board(fx, ry - 1.0, fz, T.nx[i] * sd, T.nz[i] * sd, 12, 1.25, AT.parnu); }
      for (let ii = T.idx(sAt(a0 - 8)), n = 0; n < (a1 - a0 + 16) / ds; n++, ii = (ii + 1) % N) fence[side2(sd)][ii] = 1;
      nStands++;
    }

    /* ---- the pond in the infield (def.sk.sea: World's water from js/world-rbring.js), reeds along its shore and in the shallows; the ditches:
       their still dark water between rushes ---- */
    const wst = { water: 0, reeds: 0, ditch: 0 };
    sea.water({ root, tex, exclPush, CR, out }, wst, PA_SEA);
    const reedMat = new THREE.MeshLambertMaterial({ vertexColors: true }), rc = new IChunks(paReedGeo(), reedMat, 256);
    { const S = sk.sea;
      if (S) { const x1 = S.x0 + (S.nx - 1) * S.cell, z1 = S.z0 + (S.nz - 1) * S.cell, clump = nrPN(24, 5840);
        for (let z = S.z0; z < z1; z += 2.0) for (let x = S.x0; x < x1; x += 2.0) {
          const px = x + (R() - 0.5) * 2, pz = z + (R() - 0.5) * 2, d = sea.d(px, pz);
          if (d < -3 || d > 14 || nrDist(px, pz) > 170 || clump((px - S.x0) / 800, (pz - S.z0) / 800) < 0.25 || wst.reeds > 1400) continue;
          const gy = nrGround(px, pz); if (gy > S.lv + 0.5 || gy < S.lv - 1.2 || nrNear(px, pz).dd < 3) continue;
          const h = 1.7 + R() * 1.0, cv = 0.9 + R() * 0.15;
          rc.add(px, Math.max(gy, S.lv) - 0.3, pz, R() * TAU, h * 1.3, h, [cv, cv, cv * 0.95]); wst.reeds++; } } }
    { const gw = new GB(true), wc = [1, 1, 1];
      for (const ln of sk.ditch || []) for (let k = 0; k + 3 < ln.length; k += 2) {
        const ax = ln[k], az = ln[k + 1], bx = ln[k + 2], bz = ln[k + 3], l = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(l / 4)), nx = -(bz - az) / (l || 1), nz = (bx - ax) / (l || 1);
        for (let m = 0; m < n; m++) {
          const x0 = ax + (bx - ax) * m / n, z0 = az + (bz - az) * m / n, x1 = ax + (bx - ax) * (m + 1) / n, z1 = az + (bz - az) * (m + 1) / n;
          if (nrDist(x0, z0) > 230 || nrNear(x0, z0).dd < 3 || nrNear(x1, z1).dd < 3 || paddock(x0, z0)) continue;
          const y0 = nrGround(x0, z0) + 0.04, y1 = nrGround(x1, z1) + 0.04, hw = 0.55;
          const A = [x0 - nx * hw, y0, z0 - nz * hw], Bq = [x0 + nx * hw, y0, z0 + nz * hw], C = [x1 + nx * hw, y1, z1 + nz * hw], D = [x1 - nx * hw, y1, z1 - nz * hw], uv = (p) => [p[0] / 16, -p[2] / 16];
          gw.quadUp(A, Bq, C, D, [wc, wc, wc, wc], [uv(A), uv(Bq), uv(C), uv(D)]); wst.ditch++;
          for (const sd of [-1, 1]) if (R() < 0.55 && nrDist(x0, z0) < 160) { const o = sd * (0.9 + R() * 0.8), t = R(), px = x0 + (x1 - x0) * t + nx * o, pz = z0 + (z1 - z0) * t + nz * o, h = 1.0 + R() * 0.7;
            rc.add(px, nrGround(px, pz) - 0.12, pz, R() * TAU, h * 1.2, h, [0.95, 0.97, 0.9]); }
          if (m % 2 === 0) { exclPush((x0 + x1) / 2, (z0 + z1) / 2, 2.2); CR.block((x0 + x1) / 2, (z0 + z1) / 2, l / n + 0.4, 2.4, Math.atan2(z1 - z0, x1 - x0)); }
        } }
      if (!gw.empty) { const m = new THREE.Mesh(gw.geometry(), waterMat(tex, Object.assign({ color: 0x55695a }, PA_SEA.wo, { amp: 0.12 }))); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); out.dyn.water = tex.water; } }
    rc.addTo(root, false);

    /* ---- the fences round the circuit (sk.fence, OSM): chain link on posts, 2 m ---- */
    { const fc = new Chunks(256, true);
      for (const ln of sk.fence || []) { let acc = 0;
        for (let k = 0; k + 3 < ln.length; k += 2) { const ax = ln[k], az = ln[k + 1], bx = ln[k + 2], bz = ln[k + 3], l = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(l / 3));
          for (let m = 0; m < n; m++, acc += l / n) { const x0 = ax + (bx - ax) * m / n, z0 = az + (bz - az) * m / n, x1 = ax + (bx - ax) * (m + 1) / n, z1 = az + (bz - az) * (m + 1) / n;
            if (nrNear(x0, z0).dd < 1.5 || nrNear(x1, z1).dd < 1.5 || nrDist(x0, z0) > 240) continue;
            const y0 = nrGround(x0, z0), y1 = nrGround(x1, z1), u0 = acc / 2.5, u1 = (acc + l / n) / 2.5;
            fc.get(x0, z0).quadO([x0, y0 + 0.05, z0], [x1, y1 + 0.05, z1], [x1, y1 + 2.0, z1], [x0, y0 + 2.0, z0], W1, [(x0 + x1) / 2 - (z1 - z0), y0 + 1, (z0 + z1) / 2 + (x1 - x0)], [[u0, 0], [u1, 0], [u1, 0.8], [u0, 0.8]]);
            box(scen.get(x0, z0), x0, y0 - 0.2, z0, 0.07, 2.25, 0.07, 0, [0.56, 0.57, 0.6], null, true); CR.block((x0 + x1) / 2, (z0 + z1) / 2, l / n, 0.6, Math.atan2(z1 - z0, x1 - x0)); } } }
      fc.addTo(root, fMat, false, true); }

    /* ---- marshal posts (white huts on the outside of the corners, two marshals in orange by each, one with a flag), the TV towers at the
       hairpins and the chicane, place names by the straights (the braking boards are World's: brakeBoards) ---- */
    let nPosts2 = 0, nTV = 0;
    {
      const free = (x, z, r) => !excluded(x, z) && nrSlope(x, z) < 0.45 && nrNear(x, z).dd > r && sea.d(x, z) < -4 && ditchD(x, z) > 3;
      const place = (d0, side, extra, r) => { for (const dd of [0, 10, -10, 20, -20, 34, -34]) { const p = onSide(sAt(d0 + dd), side, extra); if (free(p[0], p[1], r)) return p; } return null; };
      const outside = (d) => { let k = 0; for (let e = -40; e <= 40; e += 4) k += T.k[T.idx(sAt(d + e))]; return k > 0 ? -1 : 1; };
      const hut = (x, z, i, side) => { const y = nrGround(x, z), g = scen.get(x, z), hd = T.hd[i], nx = T.nx[i] * side, nz = T.nz[i] * side;
        box(g, x, y - 0.3, z, 2.1, 0.5, 1.9, hd, [0.55, 0.56, 0.58]); box(g, x, y + 0.2, z, 1.9, 2.1, 1.7, hd, [0.95, 0.95, 0.93], null, true);
        box(g, x - nx * 0.2, y + 2.3, z - nz * 0.2, 2.3, 0.14, 2.3, hd, [0.0, 0.42, 0.74], [0.05, 0.46, 0.78]);
        box(g, x - nx * 0.86, y + 1.0, z - nz * 0.86, 1.3, 0.7, 0.06, hd, [0.18, 0.24, 0.32], null, true); exclPush(x, z, 3.5); CR.avoid(x, z, 1.6); };
      const marked = [];
      for (const c of T.corners) { if (c.sev < 2) continue; const d = dS(c.i0 * ds); if (marked.some(m => Math.abs(m - d) < 160 || Math.abs(m - d) > L - 160)) continue;
        const side = outside(d + 10), p = place(d + 10, side, 3.0, 2.5); if (!p) continue; marked.push(d);
        const [x, z, i] = p; hut(x, z, i, side); nPosts2++;
        const fx = -T.nx[i] * side, fz = -T.nz[i] * side, [mx, mz] = onSide(i * ds, side, 1.1), y = nrGround(mx, mz);
        person(mx + T.tx[i] * 2.4, y, mz + T.tz[i] * 2.4, fx, fz, [0.98, 0.5, 0.08], 5, true); person(mx - T.tx[i] * 1.0, y, mz - T.tz[i] * 1.0, fx, fz, [0.98, 0.5, 0.08], 0, true); }
      const grey = [0.6, 0.62, 0.64], dark = [0.17, 0.18, 0.2], plank = [0.42, 0.34, 0.24];
      for (const [n, dd] of [['Leva lasnica', 15], ['Šikana', 0], ['Severna lasnica', 10], ['Zadnji ovinek', 0]]) {   // the TV towers
        const d = nameD(n); if (d == null) continue;
        let side = outside(d + dd), p = place(d + dd, side, 6.0, 4);
        if (!p) { side = -side; p = place(d + dd, side, 6.0, 4); } if (!p) continue;
        const [x, z, i] = p, g = scen.get(x, z), y = nrGround(x, z), H = 4.2, hd = T.hd[i], c = Math.cos(hd), sn = Math.sin(hd), at = (a, b) => [x + c * a - sn * b, z + sn * a + c * b];
        for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const [lx, lz] = at(a, b); cyl(g, lx, y - 0.1, lz, 0.07, H + 1.15, 5, grey); }
        for (const hy of [1.4, 2.8]) for (const [a, b, rot] of [[0, -1, 0], [0, 1, 0], [-1, 0, Math.PI / 2], [1, 0, Math.PI / 2]]) { const [lx, lz] = at(a, b); box(g, lx, y + hy, lz, 2.0, 0.07, 0.07, hd + rot, grey); }
        box(g, x, y + H, z, 2.6, 0.16, 2.6, hd, plank, [0.5, 0.41, 0.3]);
        for (const [a, b, rot] of [[0, -1.25, 0], [0, 1.25, 0], [-1.25, 0, Math.PI / 2], [1.25, 0, Math.PI / 2]]) { const [lx, lz] = at(a, b); box(g, lx, y + H + 0.95, lz, 2.5, 0.06, 0.06, hd + rot, grey); }
        { const [lx, lz] = at(0.6, 0.6 * side); cyl(g, lx, y + H, lz, 0.04, 2.5, 4, grey); cone(g, lx, y + H + 2.15, lz, 1.35, 0.5, 8, [0.0, 0.45, 0.81], [0.97, 0.97, 0.95], 0); }
        const tf = -side, [cx, cz] = at(0, 0.55 * tf), [mx, mz] = at(0.1, -0.35 * tf), ny = T.nx[i] * tf, nz = T.nz[i] * tf;
        for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; cyl(g, cx + Math.cos(a) * 0.28, y + H + 0.08, cz + Math.sin(a) * 0.28, 0.025, 1.25, 3, dark, null, 0.02); }
        box(g, cx, y + H + 1.3, cz, 0.72, 0.36, 0.3, Math.atan2(nz, ny), dark, [0.25, 0.26, 0.28]);
        person(mx, y + H + 0.08, mz, ny, nz, [0.13, 0.3, 0.62], 3, true);
        exclPush(x, z, 4.5); CR.avoid(x, z, 2.4); nTV++;
      }
      for (const [d0, cell] of [[520, AT.papsaare], [1450, AT.maakond], [2560, AT.eesti], [1640, AT.parnu]]) { const s = sAt(d0), side = roomSide(s); signPost(s, side, 1.8, cell, 3.6, 0.9, 1.3); }
      for (const [a, b, sides] of [[480, 640, [-1, 1]], [1380, 1640, [-1, 1]]]) for (const side of sides) for (let dd = a, k = 0; dd < b; dd += 15, k++) {   // the sponsors over the rails along the straights
        const s = sAt(dd), i = T.idx(s); if (kindAt(i, side) !== 0) continue;
        const [x, z] = onSide(s, side, 0.35), y = T.hy[i] + 0.78;
        board(x, y, z, T.nx[i] * side, T.nz[i] * side, 9.6, 0.82, AT.sp + ((k + (side > 0 ? 3 : 0) + Math.floor(a / 7)) % 8));
      }
    }

    /* ---- spectators: a few groups on the grass banks at the hairpins, the chicane and the last corner, the start straight's grass by the
       grandstand (World's fewFans keeps few of them on a real circuit); chain link in front of them ---- */
    let nFans = 0;
    { const hard = (x, z) => excluded(x, z) || sea.d(x, z) > -3 || ditchD(x, z) < 2.5;
      const M = { first: 2.2, gap: 1.2, excluded: hard, below: 3, above: 8, sit: 0.3, flag: 0.08 };
      const run = (d0, d1, side, o) => { const n = crowdRun(CR, sAt(d0), sAt(d1), side, Object.assign({}, M, o));
        if (n) for (let ii = T.idx(sAt(d0 - 6)), k = 0; k < (d1 - d0 + 12) / ds; k++, ii = (ii + 1) % N) if (!fence[side2(side)][ii]) fence[side2(side)][ii] = 1; nFans += n || 0; return n; };
      for (const [n, half, rows] of [['Leva lasnica', 40, 2], ['Šikana', 34, 2], ['Esi', 26, 1], ['Severna lasnica', 36, 2], ['Zadnji ovinek', 30, 2]]) { const d = nameD(n); if (d == null) continue;
        const side = roomSide(sAt(d)); run(d - half, d + half, side, { rows, dens: 0.5, label: 'PA ' + n }); }
      run(-120, -50, -1, { rows: 2, dens: 0.4, label: 'PA straight' }); run(50, 130, -1, { rows: 2, dens: 0.4, label: 'PA straight 2' });
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

    /* ---- the woods: Scots pines with birches among them (more birches along the edges), the cheaper crowns farther than 70 m from the road;
       birches and willows along the woods' edges and the ditches, junipers and a lone birch or willow on the meadows, the yards' trees. The
       ground under the crowns turns to needles (G.cov) ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const WIND = { value: 0 }; out.dyn.wind = WIND;   // the crowns sway a little, each tree in its own rhythm (the higher up, the more)
    tMat.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = WIND;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
        '#ifdef USE_INSTANCING\nfloat wPh = instanceMatrix[3].x * 0.07 + instanceMatrix[3].z * 0.05;\n#else\nfloat wPh = 0.0;\n#endif\n' +
        'float wK = position.y * position.y * 0.02;\ntransformed.x += wK * sin( uWind * 1.1 + wPh );\ntransformed.z += wK * 0.6 * sin( uWind * 0.83 + wPh * 1.7 );');
    };
    tMat.customProgramCacheKey = () => 'nrTreeWind';
    const tk = [new IChunks(paTreeGeo(0), tMat, 128), new IChunks(paTreeGeo(1), tMat, 128)];   // near the road (casting shadows): pine, birch
    const tb = [new IChunks(paTreeGeo(2), tMat, 128), new IChunks(paTreeGeo(3), tMat, 128)];   // the low ones (no shadows): juniper, willow
    const tf = [new IChunks(paTreeGeo(4), tMat, 192), new IChunks(paTreeGeo(5), tMat, 192)];   // farther out: pine, broadleaf
    let nTrees = 0;
    {
      const Lt = NRC * NRT, maxT = Math.round(70000 * dens), CRW = [0.17, 0.17, 0.26, 0.52];   // (crown radius / width)
      const plant = (sp, far, x, z, hgt, wid, c) => {
        if (excluded(x, z) || sea.d(x, z) > -1.5) return false;
        const y = nrGround(x, z) - 0.1, rot = crH(x, z, 88) * TAU;
        if (far && sp < 2) tf[sp].add(x, y, z, rot, wid, hgt, c); else if (sp < 2) tk[sp].add(x, y, z, rot, wid, hgt, c); else tb[sp - 2].add(x, y, z, rot, wid, hgt, c);
        nrShade(x, z, wid * CRW[sp], sp === 0 ? 0.9 : 0.7); nTrees++; return true; };
      const nearOk = (x, z, rd, r2) => { if (rd >= 48) return true; const nn = nrNear(x, z); return !(nn.i >= 0 && (nn.dd < 3.4 || (nn.dd < 7 && r2 < 0.4))); };
      for (let tj = 0; tj < G.ntz && nTrees < maxT; tj++) for (let ti = 0; ti < G.ntx && nTrees < maxT; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za + 1.7; zz < za + Lt; zz += 3.4) for (let xx = xa + 1.7; xx < xa + Lt; xx += 3.4) {
          const rd = nrDist(xx, zz); if (rd > 250) continue;
          const cl = nrLC(xx, zz), far = rd > 70, h1 = crH(xx, zz, 81), jx = xx + (crH(xx, zz, 82) - 0.5) * 2.6, jz = zz + (crH(xx, zz, 83) - 0.5) * 2.6;
          if (cl === 1) {   // the woods: a pine or a birch at most spots (far out every other one, a bigger crown)
            if (h1 > 0.62 || (far && (Math.round(xx / 3.4) + Math.round(zz / 3.4)) & 1) || !nearOk(jx, jz, rd, h1)) continue;
            const e = nrEdge(xx, zz), bi = crH(xx, zz, 84) < 0.18 + e * 0.35, hgt = bi ? 14 + crH(xx, zz, 85) * 8 : 17 + crH(xx, zz, 85) * 9, cv = 0.88 + crH(xx, zz, 86) * 0.22;
            plant(bi ? 1 : 0, far, jx, jz, hgt, hgt * (bi ? 0.62 : 0.72) * (far ? 1.15 : 1), [cv * 0.98, cv, cv * 0.96]);
            continue;
          }
          if (far) continue;
          const e = cl === 0 ? nrEdge(xx, zz) : 0, wd = ditchD(xx, zz);
          if (e > 0 && h1 < e * 0.14 && nearOk(jx, jz, rd, h1 * 6)) { const bi = crH(xx, zz, 87) < 0.65, hgt = bi ? 9 + crH(xx, zz, 88) * 8 : 3 + crH(xx, zz, 88) * 3;   // the woods' edge
            plant(bi ? 1 : 3, false, jx, jz, hgt, hgt * (bi ? 0.62 : 1.1), [1, 1, 1]); continue; }
          if (wd < 5 && h1 < 0.07 && nearOk(jx, jz, rd, 1)) { const hgt = 2.5 + crH(xx, zz, 89) * 3; plant(3, false, jx, jz, hgt, hgt * 1.15, [1, 1, 1]); continue; }   // willows along the ditches
          if (cl === 0 && h1 < 0.006 && nearOk(jx, jz, rd, 1)) { const hgt = 2.2 + crH(xx, zz, 90) * 2.5; plant(2, false, jx, jz, hgt, hgt * 0.9, [1, 1, 1]); continue; }   // junipers on the meadows
          if (cl === 0 && h1 > 0.997 && nearOk(jx, jz, rd, 1)) { const hgt = 11 + crH(xx, zz, 91) * 6; plant(1, false, jx, jz, hgt, hgt * 0.6, [1, 1, 1]); continue; }   // a lone birch
          if (cl === 3 && h1 < 0.01 && nearOk(jx, jz, rd, 1)) { const hgt = 9 + crH(xx, zz, 92) * 6; plant(1, false, jx, jz, hgt, hgt * 0.62, [1, 1, 1]); }   // the yards' trees
        }
      }
    }
    for (const t of tk) t.addTo(root, true);
    for (const t of tb) t.addTo(root, false);
    for (const t of tf) t.addTo(root, false);

    /* ---- terrain tiles and the grass verges out past the barriers (256 m chunks), coloured now: the verge mown short and fresh by the road,
       easing into the meadow's own colour behind the barrier ---- */
    let nTiles = 0;
    {
      const grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let k = 0; k < tiles.length; k += 3) { const m = new THREE.Mesh(nrTileGeo(tiles[k], tiles[k + 1], tiles[k + 2] === 1 ? 1 : 4), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); nTiles++; }
      const vA = [0.95, 1.08, 0.92], vB = [0.9, 1.03, 0.88];
      for (let c0 = 0; c0 < N; c0 += CH) {
        const gv = new RB(true), pv = [-1, -1];
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
          const i = ii % N;
          for (const side of [-1, 1]) {
            const si = side2(side), vr = paVerge(i, side), pts = vr.map(([o, h]) => Pt(i, side * o, h)), nL = pts.length;
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

    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: atlas })); if (bm) bm.castShadow = false;
    addM(crowdG, crowdUV(new THREE.MeshLambertMaterial({ map: tex.crowd, vertexColors: true }), 1, 0.11, 0.1));
    fenceC.addTo(root, fMat, false, true);
    if (flagL.length) root.add(API.rbFlags(flagL, CR.U.uTime));
    crowdFinish(CR, root, out);
    out.stats = { tiles: nTiles, trees: nTrees, posts: nPosts, garages: nGar, buildings: nBld, stands: nStands, trucks: nTrucks, cars: nCars, fans: nFans, marshals: nPosts2, tv: nTV, flags: flagL.length,
      water: wst.water, reeds: wst.reeds, ditch: wst.ditch };   // (read by the tests)
    return out;
  }

  World.keep('NR', 'parnu');   // (its grids kept between its builds; World.build frees the others': tools/razdeli-proge.mjs)
  World.ext.parnu = (scene, tex, opts) => buildParnu(scene, tex, opts);
})();
