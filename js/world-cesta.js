/* =========================================================================
   WORLD — the road's look (Realizem E0, the first piece: docs/realizem.md, »E0, prvi kos«; the user's choices of 8. 11. 2026: »črte na
   cesti po pravilih države«, the asphalt worn). Two things, both in the shaders of meshes the builders make anyway: no draw call and no
   vertex more, a world's fingerprint (tests/golden/world.json) as it was.
   1. THE ASPHALT'S WEAR (roadMat): the road is no longer one even grey. Streaks along it (the paver's and the traffic's); by the edges
      dust and grit in a band that wanders (its colour the country's soil), on a circuit wider at the edge the cars keep away from, on an
      open road also down the middle between the two directions; stretches of newer and older asphalt, a whole width or one lane, with a
      straight joint across the road; broad faint blotches; an open road's lanes each with the oil's dark strip down the middle between the
      paler wheel tracks; where the cars brake drips of oil (a circuit: about the racing line; a road: in the lanes). The patches, sealed
      cracks and the rubber of World's roadWear stay as they are (the rubbered line is a theme of its own: docs/zgumirana-linija.md).
   2. THE PAINT'S WEAR (paintMat): the lines on the road are no longer even bands of one colour: the paint is thin in patches a metre or
      so long and chipped, the asphalt showing through, and a little dirty.
   Only the tracks named in PROGE take it (the real tracks on main; test: true and pending: true are frozen, CLAUDE.md, and the tracks of
   open pull requests come later): for every other track finish() returns at once and the world is built as before.
   How the meshes are found (no builder is changed): the road proper is every mesh with the builder's own asphalt material (out.asphaltMat)
   whose UVs are the road's (u = (offset + half width) / 8, v = metres along / 8: every real track's builder lays them so); the lines are
   every mesh of plain vertex colours whose bright part lies on that road (within its width, at its height: measured against the road
   meshes themselves, so a banked bend's lines count too). Each takes a copy of its material with the wear in its shader; whatever else
   shares the material (pit lanes, run-offs, the green bands) keeps the builder's, and in a lines' mesh that holds more than paint
   (Chapman's gutters) only the bright paint wears.
   CRTE: the countries' road markings (the colour and the kind of the centre line and of the edge lines), for the builders:
   World.cesta.crte(T) reads the track's country from its name (»Kraj, Država«) and returns the paint and, for each sample, the centre
   line (none, a dash, solid). Livorno's builder draws its centre line by it.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || typeof THREE === 'undefined') return;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v), lerp = (a, b, t) => a + (b - a) * t, sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const TILE = 8;      // (the builders' road UVs: metres to a tile)
  const NP1 = 2048;    // (the profile's texels along the lap; twice as many with an edge)
  const WMAX = 12, RLMAX = 12;   // (the profile's ranges: the half width, the racing line's offset; m)

  /* ---- the countries' road markings. bela / rumena: the paint (as the builders'); rob: the edge lines' colour; sred: the centre line's
     (between the two directions); crta: a broken centre line's dash and gap, m (the country's standard for a road outside towns, as far
     as its public rules say: checked again when a builder first draws by it; so far Italy's only); dvojna: where overtaking is forbidden
     the centre line is double (else one solid line). A circuit paints its own lines (white edge lines) and has no centre line. Only the
     countries of the real tracks on main: a new track's country gets its row with the track.
     The markings across the road (precne; a country's own sizes when a builder first draws by them, so far Italy's: the highway code's
     regulation, art. 144 and 145): prehod: a pedestrian crossing's stripes along the road [their width, the gap, their length on a town's
     streets, on a main road], m; stop: the stop line's width, m; prednost: the give-way line's triangles [base, height, gap], m ---- */
  const BELA = [0.95, 0.95, 0.92], RUMENA = [0.95, 0.74, 0.14];
  const CRTE = {
    'Italija':      { rob: 'bela', sred: 'bela', crta: [4.5, 7.5], dvojna: false, prehod: [0.5, 0.5, 2.5, 4], stop: 0.5, prednost: [0.5, 0.6, 0.25] },
    'Romunija':     { rob: 'bela', sred: 'bela', crta: [3, 6], dvojna: false },
    'Avstrija':     { rob: 'bela', sred: 'bela', crta: [6, 12], dvojna: false },
    'Nemčija':      { rob: 'bela', sred: 'bela', crta: [4, 8], dvojna: false },
    'Belgija':      { rob: 'bela', sred: 'bela', crta: [2.5, 10], dvojna: false },
    'Kitajska':     { rob: 'bela', sred: 'rumena', crta: [4, 6], dvojna: true },
    'Brazilija':    { rob: 'bela', sred: 'rumena', crta: [4, 12], dvojna: true },
    'Čile':         { rob: 'bela', sred: 'rumena', crta: [4.5, 7.5], dvojna: true },   // (yellow where it snows, as on the Andes' passes: elsewhere in the country the centre line is white)
    'ZDA':          { rob: 'bela', sred: 'rumena', crta: [3, 9], dvojna: true },
    'Kanada':       { rob: 'bela', sred: 'rumena', crta: [3, 6], dvojna: true },
    'Južna Afrika': { rob: 'rumena', sred: 'bela', crta: [3, 9], dvojna: true },
    'Avstralija':   { rob: 'bela', sred: 'bela', crta: [3, 9], dvojna: true },
    'Sveta Lucija': { rob: 'bela', sred: 'bela', crta: [3, 9], dvojna: false },   // (white lines as in Britain: a broken centre line, solid through the bends)
  };
  const PRIVZETO = { rob: 'bela', sred: 'bela', crta: [3, 6], dvojna: false, prehod: [0.5, 0.5, 3, 4], stop: 0.4, prednost: [0.5, 0.6, 0.25] };   // (a country not in the table: white, as most of the world)
  const drzava = (T) => { const n = (T && T.def && T.def.name) || '', k = n.lastIndexOf(','); return k < 0 ? '' : n.slice(k + 1).trim(); };
  // the markings of the track's country and where its centre line runs: at[i] 0 none, 1 a dash, 2 solid (no overtaking: within `pred` m
  // before a bend tighter than `r` m and through it, both ways, as the lines are for the traffic of both directions). o.sred false: the
  // track has no centre line (a circuit)
  function crte(T, o) {
    o = o || {};
    const C = Object.assign({}, PRIVZETO, CRTE[drzava(T)]), N = T.N, ds = T.ds, at = new Uint8Array(N);
    C.barvaRob = (C.rob === 'rumena' ? RUMENA : BELA).slice(); C.barvaSred = (C.sred === 'rumena' ? RUMENA : BELA).slice(); C.drzava = drzava(T);
    if (o.sred !== false) {
      const r = o.r || 160, pred = o.pred || 50, n = Math.max(1, Math.round(pred / ds)), solid = new Uint8Array(N);
      const pn = Math.max(2, Math.round((C.crta[0] + C.crta[1]) / ds)), dn = Math.max(1, Math.round(C.crta[0] / ds));   // (in whole samples: a dash runs over dn + 1 of every pn rows)
      for (let i = 0; i < N; i++) if (Math.abs(T.k[i]) > 1 / r) for (let k = -n; k <= n; k++) { const j = T.open ? clamp(i + k, 0, N - 1) : ((i + k) % N + N) % N; solid[j] = 1; }
      for (let i = 0; i < N; i++) at[i] = solid[i] ? 2 : (i % pn) <= dn ? 1 : 0;
    }
    C.at = at; return C;
  }
  /* ---- the markings across the road by the country's rules (C: crte's), for the builders' lines' meshes. items: [s (the track's own
     metres), kind: 0 a pedestrian crossing (the third: 1 on a main road, its stripes longer), 1 a stop line, 2 a give-way line (the third:
     the lane, 1 the lap's own, -1 the oncoming one)]. o.rob: the inner side of the builder's edge lines (m in from the road's edge),
     o.sred: half its centre line's width. Returns kosi: the pieces on the road [s0, s1, offset0, offset1, 0] a rectangle (s0 < s1),
     [s0, s1, offset0, offset1, 1] a triangle (its base at s0, its point at s1: towards the driver who gives way); brez: [from, to]
     along the road where the centre line is left out (through a crossing).
     A crossing: stripes along the road from edge line to edge line, set about the road's middle. A stop line: across one lane, from
     the centre line to the edge line, its far side at s. A give-way line: a row of triangles across the lane ---- */
  function precne(T, C, items, o) {
    o = o || {}; const rob = o.rob == null ? 0.45 : o.rob, sred = o.sred == null ? 0.08 : o.sred, len = T.len, kosi = [], brez = [];
    for (const [s, kind, x] of items || []) {
      const w = T.wAt(T.idx(((s % len) + len) % len));
      if (kind === 0) {
        const a = C.prehod[0], b = C.prehod[1], L = C.prehod[x ? 3 : 2], half = w - rob - 0.17, n = Math.max(1, Math.floor((2 * half + b) / (a + b)));
        for (let k = 0; k < n; k++) { const oc = (k - (n - 1) / 2) * (a + b); kosi.push([s - L / 2, s + L / 2, oc - a / 2, oc + a / 2, 0]); }
        brez.push([s - L / 2 - 0.5, s + L / 2 + 0.5]);
      } else if (kind === 1 || kind === 2) {
        const sd = x < 0 ? -1 : 1, lo = sd > 0 ? sred + 0.07 : -(w - rob), hi = sd > 0 ? w - rob : -(sred + 0.07);
        if (kind === 1) kosi.push(sd > 0 ? [s - C.stop, s, lo, hi, 0] : [s, s + C.stop, lo, hi, 0]);
        else { const b = C.prednost[0], h = C.prednost[1], g = C.prednost[2], n = Math.max(1, Math.floor((hi - lo + g) / (b + g))), m0 = (lo + hi) / 2 - (n * (b + g) - g) / 2;
          for (let k = 0; k < n; k++) kosi.push([s, s - sd * h, m0 + k * (b + g), m0 + k * (b + g) + b, 1]); }
      }
    }
    return { kosi, brez };
  }

  /* ---- the tracks that take the look. vrsta: 'dirka' a circuit (the stains about the racing line, the dust wider at the edge the cars
     keep away from), 'cesta' an open road of two directions (in each lane the oil's dark strip between the paler wheel tracks, the stains
     in the lanes, dust down the middle too). prah: the dust's colour (the country's soil, dry), kPrah how much of it, sPrah the band's
     width (m; it wanders from under half of it to one and a half). kProge: the streaks along the road (the paver's and the traffic's).
     kMadez: the stains where the cars brake. kOdsek: how far the stretches of newer and older asphalt differ, odsek: their lengths (m,
     from-to). kLise: the broad blotches. kOlje: the lanes' oil strip, kKol: their wheel tracks. barva: how worn the paint is (0-1).
     rob (the second piece, docs/realizem.md »E0, drugi kos«): an open road's asphalt ends in a broken edge, the shoulder's gravel lying
     in its bites: how far in from the road mesh's edge the asphalt is nibbled away all along (m: the room outside the builder's edge
     line; 0 or none: the edge as the builder's, a circuit's kerbs and run-offs). robV: how far in the few deep breaks reach (m: through
     the edge line, which breaks off with the asphalt), kRobV: how many of them (0 none - 1; a well kept road few). bankina: the gravel's
     tint where the builder lays no shoulder of its own beside the road (Livorno: the verge's dry soil); where it does, the tint is read
     from that shoulder, sample by sample ---- */
  const DIRKA = { vrsta: 'dirka', kPrah: 0.5, sPrah: 0.75, kProge: 0.07, kMadez: 0.3, kOdsek: 0.05, odsek: [140, 520], kLise: 0.08, kOlje: 0, kKol: 0, barva: 0.5 };
  const CESTA = { vrsta: 'cesta', kPrah: 0.55, sPrah: 1.0, kProge: 0.08, kMadez: 0.2, kOdsek: 0.07, odsek: [80, 360], kLise: 0.09, kOlje: 0.13, kKol: 0.08, barva: 0.6, rob: 0.27, robV: 0.62, kRobV: 0.6 };
  const P = (base, o) => Object.assign({}, base, o);
  const PROGE = {
    spa:       P(DIRKA, { prah: [0.56, 0.55, 0.47], kOdsek: 0.035, odsek: [220, 700], barva: 0.45 }),   // (the builder's own stretches show already)
    nring:     P(DIRKA, { prah: [0.55, 0.54, 0.45], kPrah: 0.55, sPrah: 0.85, kOdsek: 0.08, odsek: [60, 260], barva: 0.6 }),   // (an old road through the woods: much patched)
    rbring:    P(DIRKA, { prah: [0.57, 0.56, 0.48], kPrah: 0.45, sPrah: 0.7, kOdsek: 0.035, odsek: [240, 700], barva: 0.42 }),
    bathurst:  P(DIRKA, { prah: [0.62, 0.54, 0.42], kPrah: 0.55, sPrah: 0.9, kOdsek: 0.06, barva: 0.55 }),   // (a public road the rest of the year; the hill's ochre soil)
    montreal:  P(DIRKA, { prah: [0.57, 0.56, 0.50], sPrah: 0.75, kOdsek: 0.075, odsek: [70, 300], barva: 0.55 }),   // (a park's road the rest of the year, the winters' frost)
    livorno:   P(CESTA, { prah: [0.62, 0.57, 0.47], sPrah: 0.95, kOdsek: 0, kOlje: 0.11, barva: 0.65, rob: 0.19, robV: 0.52, kRobV: 0.7, bankina: [1.03, 1.07, 1.05] }),   // (the builder's own stretches; no shoulder: the verge's dry soil to the asphalt)
    tianmen:   P(CESTA, { prah: [0.50, 0.50, 0.41], rob: 0.22, robV: 0.55, kRobV: 0.3 }),   // (a show road, well kept)
    rastro:    P(CESTA, { prah: [0.58, 0.46, 0.36], barva: 0.6 }),   // (the serra's red soil)
    chapman:   P(CESTA, { prah: [0.66, 0.60, 0.49], sPrah: 0.95, kOdsek: 0.055, barva: 0.5, kRobV: 0.3 }),   // (sand off the sandstone cliffs)
    canaries:  P(CESTA, { prah: [0.56, 0.44, 0.34], kPrah: 0.55, kOdsek: 0.07, odsek: [50, 240], barva: 0.6, kRobV: 0.75 }),   // (the island's red earth washed onto the road by the rains, many patches, the edges broken)
    balea:     P(CESTA, { prah: [0.58, 0.57, 0.52], kPrah: 0.6, sPrah: 1.05, kOdsek: 0.08, odsek: [60, 280], barva: 0.7, kRobV: 0.85 }),   // (grit after every winter, the frost's patches)
    caracoles: P(CESTA, { prah: [0.67, 0.60, 0.49], kPrah: 0.62, sPrah: 1.1, kRobV: 0.8 }),   // (the dry Andes: dust everywhere; the lorries' road over the pass, its edges broken)
    pikes:     P(CESTA, { prah: [0.62, 0.53, 0.45], kPrah: 0.5, kOdsek: 0.05, kOlje: 0.08, kKol: 0, barva: 0, rob: 0.25, robV: 0.6, kRobV: 0.4 }),   // (the builder's own wheel tracks, patches and faded paint, all in the road's mesh; the granite's pink grit)
  };

  /* ---- the noise both shaders read: one 128 x 128 RGBA tile (it wraps both ways, with mipmaps), made once, seeded (the same on every
     device). R: broad blotches; G: a finer grain; B: blobs (thresholded in the shader: stains, the paint's worn patches); A: streaks, long
     along v and fine across u (the dust's band, the oil line) ---- */
  let NOISE = null;
  function noiseTex() {
    if (NOISE) return NOISE;
    const S = 128, D = new Uint8Array(S * S * 4), R = Core.rng(60611), F = new Float32Array(S * S), X0 = new Uint16Array(S), X1 = new Uint16Array(S), XU = new Float32Array(S);
    const OCT = [[[4, 4, 0.55], [9, 9, 0.3], [20, 20, 0.15]], [[16, 16, 0.45], [37, 37, 0.33], [80, 80, 0.22]], [[6, 6, 0.55], [17, 17, 0.3], [41, 41, 0.15]], [[32, 3, 0.5], [64, 5, 0.3], [13, 2, 0.2]]];   // (per channel: value noise of px x py cells to the tile, its weight)
    for (let c = 0; c < 4; c++) {
      F.fill(0);
      for (const [px, py, wt] of OCT[c]) {
        const g = new Float32Array(px * py); for (let k = 0; k < g.length; k++) g[k] = R() * wt;
        for (let x = 0; x < S; x++) { const fx = x / S * px, x0 = Math.floor(fx), u = fx - x0; X0[x] = x0 % px; X1[x] = (x0 + 1) % px; XU[x] = u * u * (3 - 2 * u); }
        for (let y = 0; y < S; y++) {
          const fy = y / S * py, y0 = Math.floor(fy), v = fy - y0, vv = v * v * (3 - 2 * v), r0 = (y0 % py) * px, r1 = ((y0 + 1) % py) * px, o = y * S;
          for (let x = 0; x < S; x++) { const uu = XU[x], a = g[r0 + X0[x]], b = g[r1 + X0[x]], top = a + (g[r0 + X1[x]] - a) * uu; F[o + x] += top + (b + (g[r1 + X1[x]] - b) * uu - top) * vv; }
        }
      }
      let lo = 1e9, hi = -1e9; for (let k = 0; k < S * S; k++) { const a = F[k]; if (a < lo) lo = a; if (a > hi) hi = a; }
      const q = 255 / (hi - lo); for (let k = 0; k < S * S; k++) D[k * 4 + c] = Math.round((F[k] - lo) * q);   // (each channel over its whole range)
    }
    const t = new THREE.DataTexture(D, S, S, THREE.RGBAFormat);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
    return (NOISE = t);
  }

  /* ---- the road along the lap, for the shader: NP texels, each [the racing line's offset, how hard the cars brake there (0-1), the tone
     of the asphalt's stretch left and right (4 bits each), the half width]. Read unfiltered: a stretch's joint is a straight line across
     the road. With an edge (rob: robData's) twice the texels and a second row: [the shoulder's tint there (RGB, / TMAX), how broken the
     asphalt's edge is left and right (4 bits each; 0: the edge as the builder's)]: over a texel's samples the tint's mean and the least
     broken (a bridge shorter than a texel keeps its clean edge), eased in and out over 4 texels ---- */
  const TMAX = 1.5;
  function profil(T, cfg, seed, rob) {
    const NP = rob ? 2 * NP1 : NP1, N = T.N, ds = T.ds, len = T.len, open = T.open, H = rob ? 2 : 1, D = new Uint8Array(NP * 4 * H), at = (k) => (open ? clamp(k, 0, N - 1) : ((k % N) + N) % N);
    // braking: where the pace falls (the speed profile World's roadWear reads the racing line's rubber from), m/s2, smoothed over 24 m
    const v = T.speedProfile(16.5, 13, 85), a8 = Math.max(1, Math.round(8 / ds)), m12 = Math.max(1, Math.round(12 / ds)), raw = new Float32Array(N), brk = new Float32Array(N);
    for (let i = 0; i < N; i++) { const v0 = v[i], v1 = v[at(i + a8)]; raw[i] = sstep(2.5, 9, (v0 * v0 - v1 * v1) / (2 * a8 * ds)); }
    for (let i = 0; i < N; i++) { let a = 0; for (let k = -m12; k <= m12; k++) a += raw[at(i + k)]; brk[i] = a / (2 * m12 + 1); }
    // the stretches: each its tone (0-15; 7.5 the builder's own), over the whole width or over one lane only (the other keeps its last)
    const R = Core.rng(seed), tone = [new Uint8Array(NP), new Uint8Array(NP)], q = () => clamp(Math.round(7.5 + (R() * 2 - 1) * 7.5), 0, 15);
    let tl = 8, tr = 8;
    for (let s = 0; s < len;) {
      const L = lerp(cfg.odsek[0], cfg.odsek[1], R() * R()), k0 = Math.floor(s / len * NP), k1 = Math.min(NP, Math.max(k0 + 1, Math.floor((s + L) / len * NP))), w = R();
      if (w < 0.6) tl = tr = q(); else if (w < 0.8) tl = q(); else tr = q();
      for (let k = k0; k < k1; k++) { tone[0][k] = tl; tone[1][k] = tr; }
      s += L;
    }
    for (let k = 0; k < NP; k++) {
      const i = at(Math.round((k + 0.5) / NP * len / ds)), rl = T.rl ? T.rl[i] : 0;
      D[k * 4] = Math.round(clamp(rl / (2 * RLMAX) + 0.5, 0, 1) * 255); D[k * 4 + 1] = Math.round(brk[i] * 255);
      D[k * 4 + 2] = tone[0][k] * 16 + tone[1][k]; D[k * 4 + 3] = Math.round(clamp(T.wAt(i) / WMAX, 0, 1) * 255);
    }
    if (rob) {
      const raw = [new Uint8Array(NP), new Uint8Array(NP)], tk = (k) => (open ? clamp(k, 0, NP - 1) : ((k % NP) + NP) % NP);
      for (let k = 0; k < NP; k++) {
        const i0 = Math.floor(k / NP * len / ds), i1 = Math.max(i0 + 1, Math.ceil((k + 1) / NP * len / ds)), q = (NP + k) * 4, c3 = [0, 0, 0]; let a = 1, b = 1;
        for (let i = i0; i < i1; i++) { const j = at(i); for (let c = 0; c < 3; c++) c3[c] += rob.tint[j * 3 + c]; a &= rob.on[0][j]; b &= rob.on[1][j]; }
        for (let c = 0; c < 3; c++) D[q + c] = Math.round(clamp(c3[c] / (i1 - i0) / TMAX, 0, 1) * 255);
        raw[0][k] = a; raw[1][k] = b;
      }
      for (let k = 0; k < NP; k++) { const e = [15, 15];
        for (let si = 0; si < 2; si++) for (let d = -3; d <= 3; d++) if (!raw[si][tk(k + d)]) e[si] = Math.min(e[si], Math.round(Math.abs(d) / 4 * 15));
        D[(NP + k) * 4 + 3] = e[0] * 16 + e[1]; }
    }
    const t = new THREE.DataTexture(D, NP, H, THREE.RGBAFormat);
    t.wrapS = open ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
    return { tex: t, data: D, brk };
  }

  /* ---- the asphalt's wear: a copy of the builder's road material, the wear in its shader (the albedo before the light: the sun, the
     shadows, the rain's darker road and the sheen all fall on it as on the builder's). Road coordinates from the UVs: s = v * 8 m along,
     o = u * 8 - half width across. In the rain the dust darkens with the road and more (ceWet: the material's colour, which Render's
     applyRoad darkens, against its dry colour, uCeD.w): wet dust is dark, the band all but gone.
     V.paint: the builder's road mesh holds its paint, crack seals and patches too (Pikes Peak: its vPaint, 0 on the asphalt): only the
     asphalt wears. V.rob: the edge (an open road). The asphalt ends in a broken line (EDGE: how far in from the mesh's edge it is gone,
     ceE): nibbled all along within the room outside the edge line (uCeE.x m), bites a hand or two deep and a metre or so long, more of
     them on some stretches than on others, small teeth between; and here and there, on the worse stretches, a deep break through the
     edge line (to uCeF.x m more; the line breaks off with it: the paint's shader cuts it by the same EDGE). Outside it lies the
     shoulder's own gravel (the builders' shoulder texture laid on as theirs is beside the road, in the shoulder's tint there: the
     profile's second row), the asphalt's rim a little darker. No vertex moves: the cars drive on the mesh as before. Soft over a pixel
     or so (vCeZ: the distance) ---- */
  const HEAD = (V) => `
  float ceS = vCe.x;
  vec4 ceP = texture2D( uCeP, vec2( ceS * uCeA.x, ${V.rob ? '0.25' : '0.5'} ) );
  float ceW = ceP.a * ${WMAX.toFixed(1)}, ceO = vCe.y - ceW, ceAo = abs( ceO ), ceRl = ( ceP.r - 0.5 ) * ${(2 * RLMAX).toFixed(1)};
  float ceT = floor( ceP.b * 255.0 + 0.5 ), ceTl = floor( ceT / 16.0 );
  ceT = ( ( ceO < 0.0 ? ceTl : ceT - ceTl * 16.0 ) - 7.5 ) / 7.5;
  vec4 ceN1 = texture2D( uCeN, vec2( ceO, ceS ) / 9.7 );
  vec4 ceN2 = texture2D( uCeN, vec2( ceO / 7.3 + 0.31, ceS / 47.0 ) );
  vec4 ceN3 = texture2D( uCeN, vec2( ceO / 2.3 + 0.5, ceS / 6.1 ) );`;
  const EDGE = `
  vec4 ceQ = texture2D( uCeP, vec2( ceS * uCeA.x, 0.75 ) );
  float ceEm = floor( ceQ.a * 255.0 + 0.5 ), ceEl = floor( ceEm / 16.0 );
  ceEm = ( ceO < 0.0 ? ceEl : ceEm - ceEl * 16.0 ) / 15.0;
  float ceEd = ceW - ceAo;
  float ceEb = smoothstep( 0.3, 0.7, ceN2.r ) * ( 0.8 + 0.2 * ceT );
  float ceEc = smoothstep( 0.5, 0.62, ceN3.b );
  float ceEv = smoothstep( uCeF.y, uCeF.y + 0.08, ceN2.r ) * smoothstep( 0.4, 0.56, ceN1.b );
  float ceE = ceEm * ( uCeE.x * clamp( 0.2 + 0.3 * ceEb + 0.55 * ceEc * ( 0.45 + 0.55 * ceEb ) + 0.55 * ( ceN1.g - 0.5 ), 0.06, 1.0 ) + uCeF.x * ceEv * ( 0.85 + 0.4 * ( ceN3.g - 0.5 ) ) );`;
  const roadFrag = (V) => `
{${HEAD(V)}
  float ceK = 1.0 + uCeB.y * ceT + uCeB.z * ( ceN1.r - 0.5 ) * 2.0 + uCeB.w * ( ceN2.a - 0.5 ) * 2.0;
  float ceLane = ceAo - ceW * 0.5;
  float ceLat = mix( ceLane, ceO - ceRl, uCeA.y );
  float ceG = max( ceP.g, uCeC.z );
  float ceSt = smoothstep( 0.74 - 0.16 * ceG, 0.86 - 0.16 * ceG, ceN3.b ) * smoothstep( 0.3, 0.62, ceN1.b ) * ceG * exp( - ceLat * ceLat / mix( 0.45, 2.6, uCeA.y ) );
  ceK *= 1.0 - uCeB.x * ceSt;
  float ceWt = abs( ceLane ) - 0.8;
  ceK *= 1.0 - uCeA.w * ( 1.0 + 0.6 * ceP.g ) * exp( - ceLane * ceLane / 0.22 ) * ( 0.35 + 0.65 * ceN2.a );
  ceK *= 1.0 + uCeC.w * exp( - ceWt * ceWt / 0.07 ) * ( 0.4 + 0.6 * ceN2.r );
${V.paint ? '  float ceA0 = 1.0 - step( 0.03, vPaint );\n  diffuseColor.rgb *= mix( 1.0, ceK, ceA0 );' : '  diffuseColor.rgb *= ceK;'}
  float ceDw = uCeC.x * ( 0.4 + 1.1 * ceN2.a ) * mix( 1.0, clamp( ( ceW - sign( ceO ) * ceRl ) / ceW, 0.35, 2.2 ), uCeA.y );
  float ceDu = 1.0 - smoothstep( 0.0, ceDw, ceW - ceAo );
  ceDu *= 0.35 + 0.65 * ceDu;
  ceDu = max( ceDu, uCeC.y * exp( - ceO * ceO / 0.3 ) * ceN2.a );
  ceDu *= 0.45 + 0.55 * ceN3.g;
  float ceWet = dot( diffuse, vec3( 1.0 ) ) * uCeD.w;
  diffuseColor.rgb = mix( diffuseColor.rgb, uCeD.rgb * ceWet * ceWet, uCeA.z * ceDu${V.paint ? ' * ceA0' : ''} );${V.rob ? EDGE + `
  float ceEs = 0.006 + 0.0016 * vCeZ;
  float ceSh = ( 1.0 - smoothstep( ceE - ceEs, ceE + ceEs, ceEd ) ) * step( 0.03, ceEm );
  diffuseColor.rgb *= 1.0 - 0.3 * ceEm * ( 1.0 - smoothstep( ceE, ceE + 0.05, ceEd ) );
  diffuseColor.rgb = mix( diffuseColor.rgb, texture2D( uCeM, vec2( - ceEd * uCeE.z, ceS * uCeE.w ) ).rgb * ceQ.rgb * ( uCeE.y * ceWet ), ceSh );` : ''}
}`;
  function roadMat(base, T, cfg, P, V) {
    const m = base.clone(), dirka = cfg.vrsta === 'dirka' ? 1 : 0, prev = base.onBeforeCompile, key = 'cesta' + (V.rob ? 'R' : '') + (V.paint ? 'P' : '') + '|' + base.customProgramCacheKey(), frag = roadFrag(V);
    const U = { uCeN: { value: noiseTex() }, uCeP: { value: P.tex }, uCeA: { value: new THREE.Vector4(1 / T.len, dirka, cfg.kPrah, cfg.kOlje) },
      uCeB: { value: new THREE.Vector4(cfg.kMadez, cfg.kOdsek, cfg.kLise, cfg.kProge || 0) }, uCeC: { value: new THREE.Vector4(cfg.sPrah, dirka ? 0 : 0.35, dirka ? 0 : 0.2, cfg.kKol || 0) }, uCeD: { value: new THREE.Vector4(cfg.prah[0], cfg.prah[1], cfg.prah[2], 1 / Math.max(0.01, base.color.r + base.color.g + base.color.b)) } };
    if (V.rob) { U.uCeM = { value: V.rob.tex }; U.uCeE = { value: new THREE.Vector4(cfg.rob, TMAX, V.rob.uv[0], V.rob.uv[1]) };
      U.uCeF = { value: new THREE.Vector4(Math.max(0, (cfg.robV || 0) - cfg.rob), cfg.kRobV > 0 && cfg.robV > cfg.rob ? 0.8 - 0.2 * cfg.kRobV : 2, 0, 0) }; }
    m.onBeforeCompile = (sh, r) => {
      prev.call(m, sh, r);   // (whatever the builder's material has in its shader already)
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vCe;' + (V.rob ? '\nvarying float vCeZ;' : '')).replace('#include <begin_vertex>', `#include <begin_vertex>\nvCe = vec2( uv.y * ${TILE.toFixed(1)}, uv.x * ${TILE.toFixed(1)} );`);
      if (V.rob) sh.vertexShader = sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvCeZ = - mvPosition.z;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uCeN, uCeP; uniform vec4 uCeA, uCeB, uCeC, uCeD; varying vec2 vCe;' + (V.rob ? '\nuniform sampler2D uCeM; uniform vec4 uCeE, uCeF; varying float vCeZ;' : ''))
        .replace('#include <color_fragment>', '#include <color_fragment>' + frag);
    };
    m.customProgramCacheKey = () => key; m.userData.cesta = 'asfalt'; m.userData.ceU = U;
    return m;
  }

  /* ---- the paint's wear: a copy of the builder's line material; by the place in the world (no UVs on the lines): worn patches where the
     asphalt (its tone: uCeU) shows through, chips, the paint a little dirty. R (a road with an edge: the road material's uniforms): the
     paint breaks off with the asphalt: nothing of a line is drawn where the road's own shader has the edge's gravel (the same EDGE, by
     the lines' place on the road: the attribute ceSO finish() gives their meshes, as the road's UVs: metres along, metres from the left
     edge) ---- */
  const PAINT_FRAG = `
{
  float ceM = smoothstep( 0.78, 0.88, max( vColor.r, max( vColor.g, vColor.b ) ) );
  float ceA = texture2D( uCeN, vCeW / 3.7 ).b;
  float ceB = texture2D( uCeN, vCeW / 0.83 + 0.21 ).g;
  float ceWr = smoothstep( 0.4, 0.74, ceA ) * ( 0.4 + 0.6 * ceB ) + 0.3 * smoothstep( 0.55, 0.8, ceB );
  diffuseColor.rgb = mix( diffuseColor.rgb * mix( 1.0, 0.84 + 0.16 * ceB, ceM ), uCeU, ceM * min( 0.92, uCeL * ceWr ) );
}`;
  const PAINT_EDGE = `
{${HEAD({ rob: true })}${EDGE}
  if ( ceE > 0.001 && ceEd < ceE ) discard;
}`;
  function paintMat(base, cfg, under, R) {
    const m = base.clone(), U = { uCeN: { value: noiseTex() }, uCeU: { value: new THREE.Vector3(under[0], under[1], under[2]) }, uCeL: { value: cfg.barva } };
    const prev = base.onBeforeCompile, key = 'cestaBarva' + (R ? 'R' : '') + '|' + base.customProgramCacheKey();
    if (R) for (const k of ['uCeP', 'uCeA', 'uCeE', 'uCeF']) U[k] = R[k];
    m.onBeforeCompile = (sh, r) => {
      prev.call(m, sh, r);
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vCeW;' + (R ? '\nattribute vec2 ceSO; varying vec2 vCe;' : '')).replace('#include <project_vertex>', '#include <project_vertex>\nvCeW = ( modelMatrix * vec4( transformed, 1.0 ) ).xz;' + (R ? '\nvCe = ceSO;' : ''));
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uCeN; uniform vec3 uCeU; uniform float uCeL; varying vec2 vCeW;' + (R ? '\nuniform sampler2D uCeP; uniform vec4 uCeA, uCeE, uCeF; varying vec2 vCe;' : ''))
        .replace('#include <color_fragment>', '#include <color_fragment>' + (R ? PAINT_EDGE : '') + PAINT_FRAG);
    };
    m.customProgramCacheKey = () => key; m.userData.cesta = 'barva'; m.userData.ceU = U;
    return m;
  }

  const TONE = [0.40, 0.41, 0.43];   // (the asphalt texture's average tone, Tex's asphalt(): what shows where the paint is worn through)

  /* ---- at the end of a world's build (World's finish): the track's road and paint take their worn materials ---- */
  function finish(o, tex, T) {
    const cfg = T && T.def && PROGE[T.def.id]; o.cesta = null;
    if (!cfg || !o || !o.root || !o.asphaltMat || !o.asphaltMat.isMeshLambertMaterial || !tex || !tex.asphalt || o.asphaltMat.map !== tex.asphalt) return;
    const N = T.N, ds = T.ds, open = T.open, HY = (i) => T.hy[i];
    let seed = 0; for (const ch of String(T.def.id)) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    // the track's samples in a grid of 12 m cells: the nearest one to a point
    const CELL = 12, grid = new Map(), key = (cx, cz) => cx * 73856093 ^ cz * 19349663;
    for (let i = 0; i < N; i++) { const k = key(Math.floor(T.px[i] / CELL), Math.floor(T.pz[i] / CELL)); let c = grid.get(k); if (!c) grid.set(k, c = []); c.push(i); }
    const near = (x, y, z) => { const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL); let best = -1, bd = 1e9;   // (the height counts fourfold: where the road crosses itself, the sample of the vertex's own level)
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const c = grid.get(key(cx + a, cz + b)); if (!c) continue; for (const i of c) { const dx = x - T.px[i], dz = z - T.pz[i], dy = y - HY(i), d = dx * dx + dz * dz + 4 * dy * dy; if (d < bd) { bd = d; best = i; } } }
      return best; };
    const rows = new Array(N);   // (the road's surface as the builder laid it, per sample: [offset, height, offset, height ...]; a banked bend's too)
    // the builder's road UVs: nearly every vertex where its UV says, between the samples too (Pikes Peak's mesh holds its patches, crack
    // seals and paint, draped between the rows; a chunk that holds a side road's mouth has that street's own UVs on it: Chapman's, Los Caracoles')
    const isRoad = (g) => {
      const P = g.attributes.position, UV = g.attributes.uv; if (!P || !UV || P.count < 4) return false;
      const st = Math.max(1, Math.floor(P.count / 48)); let n = 0, ok = 0;
      for (let k = 0; k < P.count; k += st) {
        n++; const f = UV.getY(k) * TILE / ds, i0 = Math.floor(f + 1e-4), t = Math.max(0, f - i0), i = open ? i0 : ((i0 % N) + N) % N, j = open ? i + 1 : (i + 1) % N; if (i < 0 || i >= N || (t > 0.02 && j >= N)) continue;
        const q = t > 0.02 ? j : i, tt = t > 0.02 ? t : 0, L = (A) => A[i] + (A[q] - A[i]) * tt, oo = UV.getX(k) * TILE - lerp(T.wAt(i), T.wAt(q), tt), dx = P.getX(k) - (L(T.px) + L(T.nx) * oo), dz = P.getZ(k) - (L(T.pz) + L(T.nz) * oo);
        if (dx * dx + dz * dz <= 0.01) ok++;
      }
      return n >= 4 && ok >= 0.8 * n; };
    const addRows = (g) => { const P = g.attributes.position, UV = g.attributes.uv, PA = g.attributes.paint;
      for (let k = 0; k < P.count; k++) { const f = UV.getY(k) * TILE / ds, i0 = Math.round(f), i = open ? i0 : ((i0 % N) + N) % N; if (i < 0 || i >= N || Math.abs(f - i0) > 0.02 || (PA && PA.getX(k) > 0.01)) continue;   // (the asphalt's own rows)
        const oo = UV.getX(k) * TILE - T.wAt(i), y = P.getY(k), r = rows[i] || (rows[i] = []); let q = 0;
        if (Math.abs(oo) > T.wAt(i) + 0.01) continue;
        while (q < r.length && Math.abs(r[q] - oo) > 0.004) q += 2;
        if (q === r.length) r.push(oo, y); else if (y < r[q + 1]) r[q + 1] = y; } };   // (a patch laid over the road in the same mesh: the lower one is the road)
    const roadY = (i, oo) => { const r = rows[i]; if (!r) return T.hy[i] + 0.02;
      let a = -1, b = -1;   // (the row's neighbours left and right of the offset)
      for (let q = 0; q < r.length; q += 2) { if (r[q] <= oo && (a < 0 || r[q] > r[a])) a = q; if (r[q] >= oo && (b < 0 || r[q] < r[b])) b = q; }
      if (a < 0) return r[b + 1]; if (b < 0 || a === b) return r[a + 1];
      return lerp(r[a + 1], r[b + 1], (oo - r[a]) / (r[b] - r[a])); };
    // a vertex: 1 paint on the road's surface (bright, within the width, at the road's height), 2 bright but elsewhere, 0 anything else
    const kind = (P, C, k) => {
      const bright = Math.max(C.getX(k), C.getY(k), C.getZ(k)) >= 0.86, x = P.getX(k), y = P.getY(k), z = P.getZ(k), i = near(x, y, z); if (i < 0) return bright ? 2 : 0;
      const oo = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i], al = (x - T.px[i]) * T.tx[i] + (z - T.pz[i]) * T.tz[i];
      if (Math.abs(oo) > T.wAt(i) + 0.05 || Math.abs(al) > ds * 1.5) return bright ? 2 : 0;
      const j = al >= 0 ? (open ? Math.min(N - 1, i + 1) : (i + 1) % N) : (open ? Math.max(0, i - 1) : (i + N - 1) % N), dy = y - lerp(roadY(i, oo), roadY(j, oo), Math.min(1, Math.abs(al) / ds));
      return dy >= -0.08 && dy <= 0.12 ? (bright ? 1 : 0) : (bright ? 2 : 0); };   // (a marking laid level over a metre or two of a slope is that far off the road)
    // the lines' mesh: nearly half of it or more is paint on the road and nothing else in it is as bright (the shader wears only the bright:
    // the mesh may hold more, Chapman's gutters). A quick look at 8 vertices first: most meshes of plain colours are no lines at all
    const isPaint = (g) => {
      const P = g.attributes.position, C = g.attributes.color; if (!P || !C || P.count < 4) return false;
      let n = 0, on = 0, off = 0;
      for (let k = 0, st = Math.max(1, Math.floor(P.count / 8)); k < P.count; k += st) if (kind(P, C, k) === 1) on++;
      if (on < 2) return false;
      on = 0;
      for (let k = 0, st = Math.max(1, Math.floor(P.count / 240)); k < P.count; k += st) { const q = kind(P, C, k); n++; if (q === 1) on++; else if (q === 2) off++; }
      return on >= 0.4 * n && off <= 0.03 * n; };
    const AC = o.asphaltMat.color, under = [TONE[0] * AC.r * 0.8, TONE[1] * AC.g * 0.8, TONE[2] * AC.b * 0.8];
    const pm = new Map(), info = { id: T.def.id, asfalt: 0, barva: 0, rob: 0 }, road = [], cand = [], shoulder = [];
    o.root.traverse((m) => {   // first the road (the lines are measured against it)
      if (!m.isMesh || !m.geometry || !m.geometry.attributes || Array.isArray(m.material) || !m.material) return;
      const mt = m.material;
      if (mt === o.asphaltMat) { if (isRoad(m.geometry)) { addRows(m.geometry); road.push(m); } }
      else if (mt.isMeshLambertMaterial && mt.vertexColors && !mt.map && !mt.transparent && !mt.userData.cesta && cfg.barva > 0) cand.push(m);
      else if (cfg.rob > 0 && tex.makadam && mt.map === tex.makadam && mt.vertexColors && m.geometry.attributes.uv && m.geometry.attributes.color) shoulder.push(m);
    });
    if (!road.length) { o.cesta = info; return; }
    /* ---- the edge (cfg.rob; an open road): where along the road, left and right, the asphalt's edge is broken (0-15), and the tint of
       the shoulder's gravel there. The builders' shoulder strips are found as the road is: the meshes with the shared gravel texture
       whose inner edge lies on the road's (u = 0 there, v = metres along / their tile): their colour there is the tint, their UVs' scale
       the texture's (the gravel in the bites is the shoulder's own, laid on as beside the road). No shoulder mesh at all (Livorno): the
       verge's soil, cfg.bankina, all along. The edge stays the builder's (clean) on the bridges and in the galleries (def.bridges,
       def.loopBridge, def.galleries: metres after the start line), across the side roads' mouths (T.stubs: World.api.stubGeo's mouths)
       and wherever the builder says (o.cestaRob: [from, to (the track's own metres), side (-1 left, 1 right, 0 both)]) ---- */
    const robData = () => {
      const len = T.len, has = [new Uint8Array(N), new Uint8Array(N)], tint = new Float32Array(N * 3), cnt = new Uint16Array(N), uvs = [1 / 4, 1 / 6], C3 = [0, 0, 0];
      let found = 0;
      for (const m of shoulder) {
        const g = m.geometry, P = g.attributes.position, UV = g.attributes.uv, C = g.attributes.color;
        // the strip's scale along the road: from the vertices at u = 0 whose nearest sample is plainly theirs
        const est = [];
        for (let k = 0, st = Math.max(1, Math.floor(P.count / 400)); k < P.count && est.length < 60; k += st) {
          if (Math.abs(UV.getX(k)) > 1e-4 || UV.getY(k) < 4) continue;
          const x = P.getX(k), y = P.getY(k), z = P.getZ(k), i = near(x, y, z); if (i < 8) continue;
          const oo = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i], al = (x - T.px[i]) * T.tx[i] + (z - T.pz[i]) * T.tz[i];
          if (Math.abs(Math.abs(oo) - T.wAt(i)) < 0.03 && Math.abs(al) < 0.05) est.push(UV.getY(k) / (i * ds));
        }
        if (est.length < 6) continue;
        est.sort((a, b) => a - b); const sv = est[est.length >> 1]; if (!(sv > 0.01 && sv < 2)) continue;
        let su = 0, nu = 0;
        for (let k = 0; k < P.count; k++) {
          const u = UV.getX(k), f = UV.getY(k) / (sv * ds), i0 = Math.round(f); if (Math.abs(f - i0) > 0.02) continue;
          const i = open ? i0 : ((i0 % N) + N) % N; if (i < 0 || i >= N) continue;
          const x = P.getX(k), z = P.getZ(k), w = T.wAt(i), oo = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i], al = (x - T.px[i]) * T.tx[i] + (z - T.pz[i]) * T.tz[i];
          if (Math.abs(al) > 0.05 || Math.abs(P.getY(k) - roadY(i, oo < 0 ? -w : w)) > 0.08) continue;
          const e = Math.abs(oo) - w;
          if (Math.abs(u) <= 1e-4 && Math.abs(e) < 0.03) { has[oo < 0 ? 0 : 1][i] = 1; tint[i * 3] += C.getX(k); tint[i * 3 + 1] += C.getY(k); tint[i * 3 + 2] += C.getZ(k); cnt[i]++; }
          else if (u > 0.02 && e > 0.2 && e < 2 && nu < 400) { su += u / e; nu++; }
        }
        if (nu) { uvs[0] = su / nu; uvs[1] = sv; found++; }
      }
      // the tint: the shoulder's own where there is one, the nearest one's where a sample has none, else the track's (cfg.bankina)
      let n = 0;
      for (let i = 0; i < N; i++) if (cnt[i]) { for (let c = 0; c < 3; c++) { tint[i * 3 + c] /= cnt[i]; C3[c] += tint[i * 3 + c]; } n++; }
      const B = cfg.bankina || (n ? [C3[0] / n, C3[1] / n, C3[2] / n] : [0.62, 0.6, 0.55]);
      if (!found) { has[0].fill(1); has[1].fill(1); }
      for (let i = 0, last = -1; i < N; i++) { if (cnt[i]) { last = i; continue; } const j = last >= 0 && i - last <= 6 ? last : -1; for (let c = 0; c < 3; c++) tint[i * 3 + c] = j >= 0 ? tint[j * 3 + c] : B[c]; }
      // clean: the bridges, the galleries, the side roads' mouths, the builder's own spans
      const clean = [new Uint8Array(N), new Uint8Array(N)], d = T.def, S0 = T.startS || 0;
      const span = (s0, s1, sd) => { for (let s = s0; s <= s1 + ds / 2; s += ds / 2) { if (open && (s < 0 || s > len)) continue; const i = T.idx(((s % len) + len) % len); if (!(sd > 0)) clean[0][i] = 1; if (!(sd < 0)) clean[1][i] = 1; } };
      for (const [a, b] of d.bridges || []) span(S0 + a - 3, S0 + b + 3, 0);
      if (d.loopBridge) span(S0 + d.loopBridge[0] - 1, S0 + d.loopBridge[1] + 1, 0);
      for (const [a, b] of d.galleries || []) span(S0 + a - 2, S0 + b + 2, 0);
      for (const [a, b, sd] of o.cestaRob || []) span(a, b, sd || 0);
      if (T.stubs && T.stubs.length && World.api && World.api.stubGeo) { const M = World.api.stubGeo({}).mouthE; for (let si = 0; si < 2; si++) for (let i = 0; i < N; i++) if (M[si][i]) { clean[si][i] = 1; if (i > 0) clean[si][i - 1] = 1; if (i < N - 1) clean[si][i + 1] = 1; } }
      const on = [new Uint8Array(N), new Uint8Array(N)]; let n1 = 0;   // (per side and sample: the edge broken there; profil() eases it in and out)
      for (let si = 0; si < 2; si++) for (let i = 0; i < N; i++) if (has[si][i] && !clean[si][i]) { on[si][i] = 1; n1++; }
      info.rob = Math.round(n1 / (2 * N) * 100);   // (for the tests: the share of the road's two edges that is broken, %)
      return { tint, on, uv: uvs, tex: tex.makadam, shoulders: found };
    };
    // a line's place on the road, for the paint's shader (a road with an edge): per vertex [metres along, metres from the road's left edge],
    // as the road's own UVs (x 8) are; a vertex that is not on the road's surface: the road's middle (nothing breaks off there)
    const soAttr = (g) => {
      const P = g.attributes.position, n = P.count, A = new Float32Array(n * 2), len = T.len; let lo = 1e9, hi = -1e9, mid = false;
      for (let k = 0; k < n; k++) {
        const x = P.getX(k), y = P.getY(k), z = P.getZ(k), i = near(x, y, z); if (i < 0) { A[k * 2 + 1] = T.wAt(0); continue; }
        const w = T.wAt(i), oo = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i], al = (x - T.px[i]) * T.tx[i] + (z - T.pz[i]) * T.tz[i];
        const onRoad = Math.abs(oo) <= w + 0.05 && Math.abs(al) <= ds * 1.5 && Math.abs(y - roadY(i, oo)) <= 0.15, sv = i * ds + (onRoad ? al : 0);
        A[k * 2] = sv; A[k * 2 + 1] = w + (onRoad ? oo : 0); if (sv < lo) lo = sv; if (sv > hi) hi = sv; if (sv > len * 0.25 && sv < len * 0.75) mid = true;
      }
      if (!open && !mid && hi - lo > len / 2) for (let k = 0; k < n; k++) if (A[k * 2] < len / 2) A[k * 2] += len;   // (a chunk across the lap's seam: its metres run on, as the road's UVs do)
      g.setAttribute('ceSO', new THREE.BufferAttribute(A, 2));
    };
    const V = { paint: road.some(m => !!m.geometry.attributes.paint), rob: cfg.rob > 0 && tex.makadam ? robData() : null };
    const P = profil(T, cfg, seed, V.rob), rm = roadMat(o.asphaltMat, T, cfg, P, V); if (o.ownTex) o.ownTex.push(P.tex);
    for (const m of road) { m.material = rm; info.asfalt++; }
    for (const m of cand) {
      if (!isPaint(m.geometry)) continue;
      const mt = m.material; let c = pm.get(mt); if (!c) pm.set(mt, c = paintMat(mt, cfg, under, V.rob ? rm.userData.ceU : null));
      if (V.rob) soAttr(m.geometry);
      m.material = c; info.barva++;
    }
    o.cesta = info;   // (for the tests: how many meshes took each look)
    o.cestaMat = rm; o.cestaRobData = V.rob;
  }

  World.cesta = { finish, crte, precne, CRTE, PROGE, BELA, RUMENA };
})();
