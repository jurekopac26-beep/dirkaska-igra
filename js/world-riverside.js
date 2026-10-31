/* =========================================================================
   WORLD — Riverside (theme 'riverside'): its own builder (World.ext.riverside), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, NRC, NRT, RB, TAU, atS, atSf, box, clamp, crH, crowdCtx, crowdFinish, crowdRun, crowdUV, cyl, gable, lerp, nrDecalTex,
    nrDist, nrGrassTex, nrGround, nrLC, nrLCf, nrNear, nrPrep, nrShade, nrSlope, nrTileGeo, nrTileOn, propFloorTable, rng, roadsideProps, sstep,
    wrapS
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ================= RIVERSIDE (theme 'riverside'): the road circuit of 1960 in the dry hills of southern California =================
     The long layout of 1957-1968 on its ground of 1966 (def.dem: the 1967 map's contours, USGS 3DEP round it) on the Nordschleife's corridor
     helpers (nrPrep and the nr* terrain, its land cover def.lc: dry grass, sage scrub on the hillsides, the houses of Edgemont); the scenery
     of its time, its own: no kerbs, sand and dust past the edges of the road (def.offSurface 'gravel'), a low earth bank along the track's
     limits with hay bales round the outside of the corners, half-buried whitewashed tyres at the apexes, white post-and-rail fences along
     the main straight, chain link in front of the spectators; the pit lane of 1966 on the left of the main straight behind its earth bank
     with the teams' stalls and their cars, the timing stand over the start line, the open grandstand across from the pits, the crowds on
     the hillsides with their cars parked behind them, painted billboards (made-up, of their time: no brands), turn numbers, flag marshals'
     huts; the roads of 1966 (the other layouts' links, the paddock road, the highway north of the circuit, Day Street), lone eucalypts and
     rows of them along the roads, scrub; on the horizon the San Bernardino and San Jacinto Mountains, the San Gabriels and the Santa Anas
     (def.far: real heights), with snow on the peaks in winter. */
  const RS_BAN = [['RIVERSIDE', '#efe6cf', '#8c2216', '#8c2216'], ['START · FINISH', '#16181c', '#f4f0e4', '#c99b3a'], ['PITS', '#efe6cf', '#16181c', '#b5301d'],
    ['TIMING', '#efe6cf', '#16181c', '#16181c'], ['MOTOR OIL', '#e3b22e', '#1b2a58', '#1b2a58'], ['GASOLINE', '#b5301d', '#fbf6e8', '#fbf6e8'], ['SPARK PLUGS', '#1b2a58', '#fbf6e8', '#e3b22e'],
    ['TIRES', '#1c1c1e', '#efe6cf', '#b5301d'], ['ROOT BEER', '#6b2b16', '#fbf6e8', '#fbf6e8'], ['CALIFORNIA', '#2b5a86', '#fbf6e8', '#e3b22e'], ['CITRUS', '#e0781f', '#fbf6e8', '#2c6a2e'],
    ['DRIVE SAFELY', '#efe6cf', '#2a2a2a', '#b5301d'], ['GRANDSTAND', '#efe6cf', '#1b2a58', '#b5301d']];
  const RS_AT = { num: 0, ban: 12 };   // atlas cells: the turn numbers 1-9, then the banners (RS_BAN)
  const RS_SHIRTS = [[0.94, 0.94, 0.9], [0.92, 0.92, 0.86], [0.62, 0.74, 0.86], [0.78, 0.7, 0.52], [0.72, 0.18, 0.14], [0.95, 0.8, 0.3], [0.3, 0.38, 0.55], [0.88, 0.62, 0.5],
    [0.5, 0.56, 0.42], [0.98, 0.96, 0.9], [0.2, 0.22, 0.26], [0.86, 0.4, 0.3]];   // the crowd of 1960: white shirts, pale blue, khaki, a red plaid, yellow
  function rsAtlas() {   // text boards (4 x 16 cells of 256 x 64): the turn numbers (black on white, as painted then), the banners and billboards
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const cell = (k, bg, fg, txt, px, stripe) => { const cx = (k % 4) * 256, cy = Math.floor(k / 4) * 64; x.fillStyle = bg; x.fillRect(cx, cy, 256, 64); if (stripe) { x.fillStyle = stripe; x.fillRect(cx, cy + 57, 256, 7); x.fillRect(cx, cy, 256, 4); }
      x.fillStyle = fg; x.font = '700 ' + px + 'px Georgia, "Times New Roman", serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, cx + 128, cy + 33, 236); };
    for (let k = 1; k <= 9; k++) cell(RS_AT.num + k - 1, '#f2efe6', '#141414', String(k), 54, '#141414');
    RS_BAN.forEach(([t, bg, fg, st], k) => cell(RS_AT.ban + k, bg, fg, t, t.length > 10 ? 32 : 40, st));
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  // the mountains on the horizon: def.far's ring of the highest ground (14 distances x na directions round the circuit) as a band of angles
  // above the horizon, drawn round the camera inside its far clip (onBeforeRender: centred on the camera, its radius 0.74 x the far clip),
  // near rings a little nearer (they hide the far ones behind them). Colours of the land by height (dry foothills, chaparral, the pine
  // forests, rock), the haze of the distance baked in; snow by the season the world is built for. Its colours are its own attribute
  // (aCol: the season code paints vertex colours, not these), tinted by the fog's colour each frame (dusk, night, the rain's grey)
  function rsFar(root, F, season, eyeY, colFn) {   // eyeY: the eye's height in the world (F.base: the world's zero a.s.l.); colFn(h, d): another world's colours (Monterey)
    const bin = atob(F.b64), NA = F.na, RD = F.r, NRg = RD.length, H = (k, a) => F.lo + bin.charCodeAt(k * NA + (a % NA)) * F.step;
    const P = [], C = [], I = [], snowH = F.snow ? F.snow[season] || 1e9 : season === 'winter' ? 1450 : season === 'autumn' ? 2950 : 1e9, SUN = 3.87;   // (F.snow: a range's own snow line per season, m)   // (SUN: the sun's bearing, south-west)
    const col = colFn || ((h, d, a) => {
      let c = h < 650 ? [0.66, 0.58, 0.44] : h < 1500 ? [0.44, 0.43, 0.32] : h < 2700 ? [0.27, 0.32, 0.26] : [0.5, 0.48, 0.45];
      if (h >= 650 && h < 900) { const t = (h - 650) / 250; c = c.map((v, k) => lerp([0.66, 0.58, 0.44][k], v, t)); }
      const sn = sstep(snowH - 150, snowH + 250, h + (crH(a, h | 0, 7) - 0.5) * 260);   // (a ragged snow line)
      c = c.map((v, k) => lerp(v, [0.96, 0.97, 1.0][k], sn));
      const f = (1 - Math.exp(-d / 55000)) * 0.85;   // the haze of the distance (a clear day: the mountains stand out)
      return c.map((v, k) => lerp(v, [0.74, 0.79, 0.88][k], f * (1 - 0.45 * sn)));
    });
    const eyeA = (F.base || 0) + eyeY, ang = (h, d) => Math.atan2(h - eyeA - d * d / (2 * 6371000) * 0.87, d);
    for (let k = NRg - 1; k >= 0; k--) {   // one curtain per ring, its top the ring's silhouette, its foot just below the horizon (the nearer rings 3 % nearer)
      const d = RD[k], rf = 1 - 0.03 * (NRg - 1 - k) / (NRg - 1), b0 = P.length / 3;
      for (let a = 0; a <= NA; a++) {
        const az = a / NA * TAU, h = H(k, a), el = Math.max(-0.02, ang(h, d)), fa = az + Math.PI - SUN, sl = Math.tanh((H(k, a + 1) - H(k, a + NA - 1)) / (2 * d * TAU / NA) * 1.5);
        const lit = clamp(0.84 + 0.2 * Math.cos(fa) + 0.14 * sl * Math.sin(fa) + (crH(k, a, 9) - 0.5) * 0.06, 0.62, 1.12), c = col(h, d, a).map((v) => v * lerp(1, lit, 0.6 + 0.4 * Math.exp(-d / 20000))), cl = col(Math.min(h, 600), d, a).map((v) => v * 0.88);
        for (const [e, cc] of [[el, c], [-0.04, cl]]) { P.push(Math.sin(az) * Math.cos(e) * rf, Math.sin(e) * rf, -Math.cos(az) * Math.cos(e) * rf); C.push(cc[0], cc[1], cc[2]); }   // (az clockwise from north: x east, z south)
      }
      for (let a = 0; a < NA; a++) { const p = b0 + a * 2; I.push(p, p + 1, p + 2, p + 2, p + 1, p + 3); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I);
    const m = new THREE.MeshBasicMaterial({ fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aCol; varying vec3 vRsC;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvRsC = aCol;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vRsC;').replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse * vRsC, opacity );'); };
    m.customProgramCacheKey = () => 'rsFar';
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; mesh.renderOrder = -1; mesh.name = 'rsFar';
    const ref = new THREE.Color(0xd9dfe3), tc = new THREE.Color();
    mesh.onBeforeRender = (rd, sc, cam) => {
      if (!cam.isPerspectiveCamera || cam.far < 50) return;   // (only the game's view: not a pass with a camera of its own)
      mesh.position.set(cam.position.x, cam.position.y - 4, cam.position.z); mesh.scale.setScalar(cam.far * 0.74); mesh.updateMatrix(); mesh.updateMatrixWorld(true);   // (with the camera: its angles are the eye's over the road)
      const Rn = typeof Render !== 'undefined' ? Render : null, wet = Rn && Rn.raining ? 1 : 0;
      if (sc.fog) { tc.setRGB(sc.fog.color.r / ref.r, sc.fog.color.g / ref.g, sc.fog.color.b / ref.b); m.color.setRGB(Math.min(1.1, tc.r), Math.min(1.1, tc.g), Math.min(1.1, tc.b)); }
      if (wet) m.color.lerp(sc.fog ? sc.fog.color : tc.setRGB(0.6, 0.62, 0.65), 0.85);   // (the rain: the mountains in the cloud)
    };
    root.add(mesh); return mesh;
  }
  function buildRiverside(scene, tex, opts) {
    const R = rng(5271), N = T.N, w = T.w, ds = T.ds, dens = opts.density || 1, sStart = T.startS, def = T.def, L = T.len;
    const root = new THREE.Group(); scene.add(root);
    const sea = opts.season === 'winter' || opts.season === 'autumn' ? opts.season : 'summer';   // (the snow on the mountains: built again when the season changes)
    const out = { root, dyn: {}, groundH: nrGround, camFloor: nrGround, props: [], farClip: true, ownTex: [], ownMarks: true, season: 'rs-' + sea, paintFor: (s) => 'rs-' + (s === 'winter' || s === 'autumn' ? s : 'summer'), dust: [0.8, 0.68, 0.5] };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    const dS = (s) => { let d = s - sStart; d = ((d % L) + L) % L; return d > L / 2 ? d - L : d; };   // metres from the start line (-L/2 .. L/2)
    const sAt = (d) => (((sStart + d) % L) + L) % L;
    const hyS = (s) => T.elevAt(wrapS(s)).y;
    const PL = def.pitLane;   // [from, to, offset]: the pit lane (scenery: left of the main straight, behind its earth bank)
    nrPrep();
    const P = API.NR, G = P.G;
    P.seC = [1.16, 1.06, 0.86];   // the yards and lots by the houses: dry, trampled
    P.colMod = (x, z, c) => {   // the open land in the dry season: golden and straw-pale grass, bare sandy patches; the scrub grey-green
      const n = P.n5(x * 0.55 + 700, z * 0.55), m = P.n3(x * 1.6 + 300, z * 1.6), k = 0.97 + (n - 0.5) * 0.22 + (m - 0.5) * 0.12, fm = nrLCf(x, z, 0), fs = nrLCf(x, z, 2);
      c[0] *= k * 1.5; c[1] *= k * 1.16; c[2] *= k * 1.95;   // (the olive grass picture: pale straw)
      const bare = sstep(0.56, 0.82, P.n1(x * 1.15 - 90, z * 1.15 + 40)) * 0.6 * fm, pale = sstep(0.4, 0.75, P.n3(x * 0.8 + 90, z * 0.8 - 40)) * 0.6 * fm;
      c[0] = lerp(c[0], c[0] * 1.1 + 0.06, pale); c[1] = lerp(c[1], c[1] * 1.12 + 0.06, pale); c[2] = lerp(c[2], c[2] * 1.15 + 0.06, pale);
      c[0] = lerp(c[0], 2.0, bare); c[1] = lerp(c[1], 1.62, bare); c[2] = lerp(c[2], 1.5, bare);   // (bare sandy ground)
      c[0] = lerp(c[0], 1.02, fs * 0.85); c[1] = lerp(c[1], 1.06, fs * 0.85); c[2] = lerp(c[2], 1.08, fs * 0.85);   // (the sage scrub: grey-green)
    };
    // level ground: the pit lane, its stalls and the paddock (left of the main straight), the grandstand (right): the terrain pulled to the
    // road's height (the main straight is straight there: a point is projected on its chord)
    const a0 = atS(sAt(PL[0] - 40), 0), b0 = atS(sAt(PL[1] + 20), 0), sa0 = sAt(PL[0] - 40);
    const ux = b0[0] - a0[0], uz = b0[1] - a0[1], Lp = Math.hypot(ux, uz), tx0 = ux / Lp, tz0 = uz / Lp, nx0 = -tz0, nz0 = tx0;
    P.pad = (x, z, h) => { const al = (x - a0[0]) * tx0 + (z - a0[1]) * tz0, lat = (x - a0[0]) * nx0 + (z - a0[1]) * nz0;
      if (al < -40 || al > Lp + 40) return h;
      const fl = lat < 0 ? Math.min(sstep(-11, -14, lat), sstep(-78, -60, lat)) : Math.min(sstep(11, 14, lat), sstep(48, 36, lat));
      const f = Math.min(sstep(-40, 0, al), sstep(Lp + 40, Lp, al), fl); if (!(f > 0)) return h;
      return lerp(h, hyS(sa0 + clamp(al, 0, Lp)) - 0.14, f); };
    out.bounds = { minX: P.x0, maxX: P.x1, minZ: P.z0, maxZ: P.z1 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 64;   // tree exclusion circles (buildings, stands, crowds), hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); } };
    const excluded = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (let k = 0; k < Lc.length; k++) { const e = Lc[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const W1 = [1, 1, 1], CH = 128;

    /* ---- terrain tiles: which ones (built at the end, when the trees have shaded the ground under them) ---- */
    const gMat = new THREE.MeshLambertMaterial({ map: ownTex(nrGrassTex(tex.grass.anisotropy)), vertexColors: true }), tiles = [];
    for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { const on = nrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; tiles.push(ti, tj, on); }

    /* ---- the road: the asphalt of 1960, a little paler and greyer, the oil and rubber of the racing line darker; no kerbs, no lines ---- */
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const offs = [-w, -w * 2 / 3, -w / 3, 0, w / 3, w * 2 / 3, w], tileL = 8;
    const secT = new Float32Array(N), brk = new Float32Array(N);
    for (let i0 = 0, k = 0; i0 < N; k++) { const n = 50 + Math.floor(crH(k, 3, 61) * 80), t = 0.95 + crH(k, 5, 61) * 0.1; for (let i = i0; i < Math.min(N, i0 + n); i++) secT[i] = t; i0 += n; }
    for (const c of T.corners) if (c.sev >= 2) for (let k = -70; k <= 6; k++) { const i = (c.i0 + k + N) % N, f = k < -10 ? sstep(-70, -12, k) : sstep(6, -10, k); if (f > brk[i]) brk[i] = f; }
    const shade = (i, o) => { const rl = T.rl[i]; let k = (0.93 - (0.14 + 0.1 * brk[i]) * Math.exp(-((o - rl) * (o - rl)) / 5)) * secT[i]; if (Math.abs(o) > w * 0.9) k *= 1.04; return [k * 1.01, k, k * 0.97]; };
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB(true); let pr = -1;
      for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
        const i = ii % N, v = ii * ds / tileL;
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o)), offs.map(o => [(o + w) / tileL, v]));
        if (pr >= 0) gr.link(pr, r, 0, offs.length - 1); pr = r;
      }
      addM(gr, aMat);
    }
    /* ---- the edges: sand and dust from the asphalt's edge out past the track's limit (the cars raise it: the surface is dirt there), the
       dry grass taking over beyond; the wider sandy run-offs where the limit stands far out (Core: gravL / gravR) ---- */
    const sandMat = new THREE.MeshLambertMaterial({ map: ownTex(API.rbGravelTex()), vertexColors: true });
    const SAND = [0.98, 0.86, 0.66], SAND2 = [0.92, 0.79, 0.6];
    const verge = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i], lift = (o, h) => { const q = side * o; return [o, Math.max(h, nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.05 - y)]; };
      return [[w, 0.0], [w + 0.6, -0.03], lift(Math.max(w + 1.6, bar - 0.6), -0.08), lift(bar + 2.6, -0.2), lift(bar + 4.5, -0.45)]; };
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gv = new RB(true), pv = [-1, -1];
      for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
        const i = ii % N;
        for (const side of [-1, 1]) {
          const si = side > 0 ? 1 : 0, pr = verge(i, side), gl = (side > 0 ? T.gravR : T.gravL)[i];
          const pts = pr.map(([o, h]) => Pt(i, side * o, h)), n3 = crH(i, side, 5) * 0.08, DRY = [0.86 - n3, 0.76 - n3, 0.56 - n3], STRAW = [0.8, 0.72, 0.52];   // (the sand picture's colours: sand, then the dust settled on the dry grass)
          const cols = [SAND, SAND2, gl ? SAND : DRY, [lerp(DRY[0], STRAW[0], 0.6), lerp(DRY[1], STRAW[1], 0.6), lerp(DRY[2], STRAW[2], 0.6)], STRAW];
          const ord = side > 0 ? { p: pts, c: cols } : { p: pts.slice().reverse(), c: cols.slice().reverse() };
          const rv = gv.row(ord.p, ord.c, ord.p.map(p => [p[0] / 3, -p[2] / 3]));
          if (pv[si] >= 0) gv.link(pv[si], rv, 0, 4); pv[si] = rv;
        }
      }
      addM(gv, sandMat);
    }
    /* ---- on the asphalt: oil and rubber into the slower corners, patches and sealed cracks (the Nordschleife's decal atlas) ---- */
    let nDecals = 0;
    {
      const dTex = ownTex(nrDecalTex()); dTex.anisotropy = tex.asphalt.anisotropy || 4;
      const dMat = new THREE.MeshLambertMaterial({ map: dTex, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
      const RD = rng(5273), dcs = [], put = (i0, n, c, hw, cell, a, lay, fol) => dcs.push([i0, n, c, hw, cell, a, lay, fol]);
      for (let d = 60; d < L - 60; d += 30) { const i = T.idx(sAt(d));
        if (RD() < 0.08) put(i, 5 + Math.floor(RD() * 4), (RD() - 0.5) * 6, 1.2 + RD() * 0.6, 24 + Math.floor(RD() * 2), 0.8, 1);
        if (RD() < 0.08) { const hw = 1.5 + RD() * 1.2; put(i, 2 + Math.floor(RD() * 6), (RD() < 0.5 ? -1 : 1) * (w - 0.8 - hw) * RD(), hw, 28 + Math.floor(RD() * 4), 0.9, 0); } }
      for (const c of T.corners) if (c.sev >= 2) for (let n = 3; n > 0; n--) put((c.i0 - 4 - Math.floor(RD() * 34) + N) % N, 10 + Math.floor(RD() * 7), (RD() - 0.5) * 1.8, 1.25, 26 + (RD() < 0.35 ? 1 : 0), 0.4 + RD() * 0.3, 2, true);
      dcs.sort((a, b) => a[6] - b[6]);
      const rbs = new Map();
      for (const [i0, n, c, hw, cell, a, , fol] of dcs) {
        const key = Math.floor(i0 / CH); let rb = rbs.get(key); if (!rb) rbs.set(key, rb = new RB(true, true));
        const cu = cell % 4, cv = Math.floor(cell / 4), u0 = cu / 4 + 1 / 512, u1 = (cu + 1) / 4 - 1 / 512, vt = 1 - cv / 8 - 1 / 1024, vb = 1 - (cv + 1) / 8 + 1 / 1024, col = [1, 1, 1, a];
        let pr = -1;
        for (let k = 0; k <= n; k++) { const i = (i0 + k) % N, cc = clamp((fol ? T.rl[i] : 0) + c, -(w - 0.7 - hw), w - 0.7 - hw), v = vb + (vt - vb) * k / n;
          const r = rb.row([Pt(i, cc - hw, 0.05), Pt(i, cc + hw, 0.05)], [col, col], [[u0, v], [u1, v]]); if (pr >= 0) rb.link(pr, r, 0, 1); pr = r; }
      }
      for (const rb of rbs.values()) { const m = addM(rb, dMat); if (m) m.renderOrder = 0.45; }   // (ROAD DECAL ORDER: under the road's wear)
      nDecals = dcs.length;
    }
    // the start / finish line (chequered across the road) and the grid
    {
      const gq = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16, wh = [0.93, 0.93, 0.9], HYp = (p) => T.hy[p[3]];
      const a = atSf(sStart - 0.8, -w), b = atSf(sStart - 0.8, w), c = atSf(sStart + 0.8, w), d = atSf(sStart + 0.8, -w);
      gq.quadUp([a[0], HYp(a) + 0.04, a[1]], [b[0], HYp(b) + 0.04, b[1]], [c[0], HYp(c) + 0.04, c[1]], [d[0], HYp(d) + 0.04, d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      for (let k = 1; k <= 14; k++) {
        const sb = sStart - 9 - (k - 1) * 7.5 + 2.6, lat = (k % 2 === 1 ? -1 : 1) * 3.4;
        const p0 = atSf(sb, lat - 1.5), p1 = atSf(sb, lat + 1.5), p2 = atSf(sb + 0.35, lat + 1.5), p3 = atSf(sb + 0.35, lat - 1.5);
        gw.quadUp([p0[0], HYp(p0) + 0.037, p0[1]], [p1[0], HYp(p1) + 0.037, p1[1]], [p2[0], HYp(p2) + 0.037, p2[1]], [p3[0], HYp(p3) + 0.037, p3[1]], [wh, wh, wh, wh]);
      }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw, lMat);
    }

    /* ---- the track's limits: a low earth bank along them (dirt and dry grass), with chain link in front of the spectators and white
       post-and-rail fences along the main straight; hay bales round the outside of the corners, tyres stacked at the hairpins ---- */
    const side2 = (side) => (side > 0 ? 1 : 0);
    const pitAt = (i) => { const d = dS(i * ds); return d >= PL[0] - 6 && d <= PL[1] + 6; };   // (the pit lane's side of the main straight: its own bank)
    const wire = [new Uint8Array(N), new Uint8Array(N)];   // chain link: in front of the spectators
    for (const [a, b, sd] of def.stands || []) for (let d = a - 20; d <= b + 20; d += ds) wire[side2(sd)][T.idx(sAt(d))] = 1;
    for (const [a, b, sd] of def.ga || []) for (let d = a - 8; d <= b + 8; d += ds) wire[side2(sd)][T.idx(sAt(d))] = 1;
    const rail = [new Uint8Array(N), new Uint8Array(N)];   // white post and rail: along the main straight
    for (let d = -330; d <= 140; d += ds) { const i = T.idx(sAt(d)); rail[0][i] = rail[1][i] = 1; }
    const baleOn = [new Uint8Array(N), new Uint8Array(N)], tyreOn = [new Uint8Array(N), new Uint8Array(N)];
    for (const c of T.corners) { if (c.sev < 2) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, si = side2(-c.dir);
      for (let k = c.i0 - 14; k <= i1c + 20; k++) { const ii = ((k % N) + N) % N; (c.sev >= 3 ? tyreOn : baleOn)[si][ii] = 1; if (c.sev >= 3 && (k < c.i0 || k > i1c)) baleOn[si][ii] = 1; } }
    const dirt = [0.9, 0.78, 0.6], dirtT = [0.86, 0.74, 0.52];
    const bermM = sandMat;   // (the bank: dirt and dry grass)
    const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const tyMat = new THREE.MeshLambertMaterial({ map: tex.tires, vertexColors: true });
    const scen = new Chunks(192), fenceG = new GB(true);
    let nBales = 0, nRail = 0;
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gb = new RB(true), gt = new RB(true);
      for (const side of [-1, 1]) {
        let prev = -1, pt = -1, acc = c0 * ds;
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++, acc += ds) {
          const i = ii % N, si = side2(side), bar = side > 0 ? T.br[i] : T.bl[i], pit = side < 0 && pitAt(i);
          const yb = (o) => Math.max(0, nrGround(...Pt(i, side * o, 0).filter((v, k) => k !== 1)) - T.hy[i]);
          // the bank: up from the ground just inside the limit to 0.7 m, down again 2.5 m behind it
          const prof = [[bar - 0.5, yb(bar - 0.5) - 0.05], [bar + 0.2, 0.62], [bar + 1.1, 0.72], [bar + 2.4, yb(bar + 2.4) + 0.05]];
          if (pit) { prev = -1; } else {
            const pts = prof.map(([o, h]) => Pt(i, side * o, h)), cols = [dirt, dirtT, dirtT, dirt], ord = side > 0 ? { p: pts, c: cols } : { p: pts.slice().reverse(), c: cols.slice().reverse() };
            const r = gb.row(ord.p, ord.c, ord.p.map(p => [p[0] / 3, -p[2] / 3])); if (prev >= 0) gb.link(prev, r, 0, 3); prev = r;
          }
          if (tyreOn[si][i] && !pit) {   // tyres stacked three high on the bank's face
            const o = side * (bar - 0.25), o2 = side * (bar + 0.6), p = [Pt(i, o, 0.0), Pt(i, o, 0.95), Pt(i, o2, 0.95)], uv = [[acc / 3, 0.02], [acc / 3, 0.98], [acc / 3, 0.98]], c = [W1, W1, [0.3, 0.3, 0.32]];
            const r = side > 0 ? gt.row(p, c, uv) : gt.row(p.slice().reverse(), c.slice().reverse(), uv.slice().reverse()); if (pt >= 0) gt.link(pt, r, 0, 2); pt = r;
          } else pt = -1;
          if (ii < c0 + CH && !pit) {
            if (baleOn[si][i] && ii % 1 === 0) {   // hay bales on top of the bank, end to end (1.1 m), two high in the corners' runs
              const [x, z] = atSf(i * ds, side * (bar + 0.45)), y = T.hy[i] + 0.62, hd = T.hd[i], g = scen.get(x, z), sh = 0.92 + crH(i, side, 9) * 0.14;
              box(g, x, y, z, 1.95, 0.48, 0.55, hd, [0.84 * sh, 0.72 * sh, 0.42 * sh], [0.92 * sh, 0.8 * sh, 0.48 * sh], true); nBales++;
            }
            if (rail[si][i] && !wire[si][i] && ii % 2 === 0) {   // white post and rail on the bank
              const [x, z] = atSf(i * ds, side * (bar + 0.6)), y = T.hy[i] + 0.66, hd = T.hd[i], g = scen.get(x, z), wc = [0.92, 0.92, 0.88];
              box(g, x, y - 0.3, z, 0.14, 1.45, 0.14, hd, wc, null, true);
              for (const yy of [0.55, 1.0]) box(g, x, y + yy, z, 0.06, 0.12, 4.02, hd + Math.PI / 2, wc, null, true);
              nRail++;
            }
          }
          if (wire[si][i] && !pit) {   // chain link on posts on top of the bank, in front of the crowds
            const j = (i + 1) % N, Q = (k, y) => Pt(k, side * ((side > 0 ? T.br[k] : T.bl[k]) + 0.75), y + 0.62);
            if (wire[si][j]) fenceG.quadO(Q(i, 0.1), Q(j, 0.1), Q(j, 2.0), Q(i, 2.0), [1, 1, 1], Pt(i, side * (bar + 3.75), 1.6), [[acc / 2.5, 0], [(acc + ds) / 2.5, 0], [(acc + ds) / 2.5, 0.8], [acc / 2.5, 0.8]]);
            if (ii % 2 === 0) { const p = Q(i, 0); box(scen.get(p[0], p[2]), p[0], p[1] - 0.3, p[2], 0.07, 2.4, 0.07, T.hd[i], [0.58, 0.59, 0.6]); }
          }
        }
      }
      addM(gb, bermM); addM(gt, tyMat, true);
    }
    // the whitewashed tyres half buried along the inside of the corners, as the clubs marked their apexes then (one instanced ring)
    let nApex = 0;
    {
      const tg = new THREE.TorusGeometry(0.34, 0.13, 5, 10); tg.rotateY(Math.PI / 2); const cc = new Float32Array(tg.attributes.position.count * 3).fill(1); tg.setAttribute('color', new THREE.BufferAttribute(cc, 3));
      const tm = new IChunks(tg, new THREE.MeshLambertMaterial({ vertexColors: true }), 256);
      for (const c of T.corners) {
        const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, side = c.dir, im = Math.round((c.i0 + i1c) / 2);
        for (let k = c.i0 - 4; k <= i1c + 4; k += 3) { const i = ((k % N) + N) % N, [x, z] = atSf(i * ds, side * (w + 0.75)); if (excluded(x, z)) continue;
          tm.add(x, T.hy[i] - 0.06, z, -T.hd[i], 1, 1, [0.95, 0.95, 0.92]); nApex++; }
        if (c.sev >= 2) { const i = ((im % N) + N) % N, [x, z] = atSf(i * ds, side * (w + 2.2)); tm.add(x, T.hy[i] - 0.06, z, -T.hd[i] + 0.6, 1.1, 1.1, [0.95, 0.95, 0.92]); }
      }
      tm.addTo(root, false);
    }

    /* ---- scenery helpers ---- */
    const atlas = ownTex(rsAtlas()), AUV = (k) => { const u0 = (k % 4) / 4, v1 = 1 - Math.floor(k / 4) / 16; return [u0, v1 - 1 / 16, u0 + 0.25, v1]; };
    const ban = new GB(true);
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const board = (cx, cy, cz, tx, tz, Wd, H, cellK) => {   // a painted board (bottom centre cx, cy, cz) facing -t (read by cars driving along +t), a wooden back
      const [u0, v0, u1, v1] = AUV(cellK), ux = tz, uz = -tx, hw = -Wd / 2;
      const A = [cx - ux * hw, cy, cz - uz * hw], B = [cx + ux * hw, cy, cz + uz * hw], C = [B[0], cy + H, B[2]], D = [A[0], cy + H, A[2]];
      ban.quadO(A, B, C, D, W1, [cx + tx, cy + H / 2, cz + tz], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
      box(scen.get(cx, cz), cx + tx * 0.07, cy - 0.04, cz + tz * 0.07, 0.1, H + 0.08, Wd + 0.08, Math.atan2(tz, tx), [0.42, 0.33, 0.24], null, true);
    };
    const signPost = (s, side, extra, cellK, Wd, H, y0) => {   // a board on two wooden posts beside the track, facing the traffic
      const [x, z, i] = onSide(s, side, extra), y = nrGround(x, z), g = scen.get(x, z), nx = T.nx[i], nz = T.nz[i];
      for (const o of [-Wd / 2 + 0.25, Wd / 2 - 0.25]) box(g, x + nx * o + T.tx[i] * 0.16, y - 0.3, z + nz * o + T.tz[i] * 0.16, 0.16, y0 + H + 0.3, 0.16, T.hd[i], [0.46, 0.36, 0.26]);
      board(x, y + y0, z, T.tx[i], T.tz[i], Wd, H, cellK); exclPush(x, z, Wd / 2 + 2);
    };
    const CR = crowdCtx({ gH: nrGround, near: (x, z) => nrNear(x, z).dd, maxSlope: 0.9, shirts: RS_SHIRTS });
    const crowdPts = [], RX = rng(5274), flagL = [], WROT = Math.atan2(API.RB_WIND[1], API.RB_WIND[0]);
    const US = [[0.72, 0.1, 0.14], [0.95, 0.95, 0.93], [0.72, 0.1, 0.14], [0.95, 0.95, 0.93], [0.14, 0.2, 0.46]], CAL = [[0.95, 0.95, 0.93], [0.95, 0.95, 0.93], [0.7, 0.12, 0.12]];   // (the stars and stripes, simplified; California's white over red)
    const flagAt = (x, y, z, h, cols, W) => { W = W || 1.8; cyl(scen.get(x, z), x, y - 0.2, z, 0.05, h + 0.2, 5, [0.86, 0.86, 0.88]); flagL.push([x, y + h, z, WROT + (RX() - 0.5) * 0.3, cols, W, W * 0.6]); };
    const carGeo = (() => { const g = new GB(); box(g, 0, 0.3, 0, 5.0, 0.72, 1.95, 0, [1, 1, 1], [1, 1, 1], true); box(g, -0.25, 1.02, 0, 2.5, 0.55, 1.75, 0, [0.85, 0.87, 0.9], [1, 1, 1], true);
      box(g, 2.35, 0.36, 0, 0.3, 0.28, 1.9, 0, [0.86, 0.86, 0.88], null, true); box(g, -2.35, 0.36, 0, 0.3, 0.28, 1.9, 0, [0.86, 0.86, 0.88], null, true); return g.geometry(); })();   // a 1950s sedan: long, low, chrome bumpers (the paint: instance colour)
    const cars = new IChunks(carGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), 256);
    const CARC = [[0.93, 0.92, 0.86], [0.55, 0.75, 0.78], [0.86, 0.55, 0.55], [0.32, 0.45, 0.62], [0.12, 0.13, 0.14], [0.86, 0.8, 0.5], [0.35, 0.55, 0.4], [0.7, 0.18, 0.16], [0.62, 0.66, 0.7], [0.95, 0.75, 0.62]];
    let nCars = 0;
    const parkRow = (s0, s1, side, extra, rows) => {   // cars nose to tail-gate behind the spectators, on level ground
      for (let s = s0; s < s1; s += 3.2) for (let r = 0; r < rows; r++) { if (R() < 0.25) continue;
        const [x, z, i] = onSide(sAt(s), side, extra + r * 6.5); if (excluded(x, z) || nrSlope(x, z) > 0.22 || nrNear(x, z).dd < 3) continue;
        cars.add(x, nrGround(x, z) - 0.05, z, -(T.hd[i] + side * Math.PI / 2 + (R() - 0.5) * 0.15), 1, 1, CARC[Math.floor(R() * CARC.length)]); nCars++; } };

    /* ---- the pits of 1966 on the left of the main straight (scenery: the cars do not stop here): the lane behind its low earth bank, the
       teams' stalls along its far side (a counter, a fuel drum, a car being worked on), the long pit building behind them, the paddock with
       the transporters, the timing stand over the start line ---- */
    let nStalls = 0;
    {
      const [p0, p1, po] = PL, lw = 4.5;
      const lo = (d) => { const t = Math.min(sstep(p0, p0 + 55, d), sstep(p1, p1 - 45, d)); return lerp(-(w + 2.5), po, t); };   // the lane's centre (left: negative)
      const gl = new RB(true), gk = new RB(true); let pr = -1, pk = -1;
      for (let d = p0; d <= p1 + 0.01; d += ds) {
        const s = sAt(d), i = T.idx(s), o = lo(d), y = hyS(s) + 0.03;
        const r = gl.row([o - lw, o - lw * 0.5, o, o + lw * 0.5, o + lw].map(q => { const [x, z] = atSf(s, q); return [x, y, z]; }), [0, 1, 2, 3, 4].map(k => shade(i, 0)), [o - lw, o - lw * 0.5, o, o + lw * 0.5, o + lw].map(q => [q / 8, d / 8]));
        if (pr >= 0) gl.link(pr, r, 0, 4); pr = r;
        // the earth bank between the circuit and the lane, low and grassy
        const t = Math.min(sstep(p0 + 20, p0 + 60, d), sstep(p1 - 15, p1 - 50, d)), bo = -(w + 1.2), bi = o + lw + 0.6;
        if (t > 0.02 && bi < bo - 1.5) {
          const hb = 0.75 * t, prof = [[bo, 0], [lerp(bo, bi, 0.3), hb], [lerp(bo, bi, 0.7), hb], [bi, 0]];
          const pts = prof.map(([q, h]) => { const [x, z] = atSf(s, q); return [x, y + h, z]; }), cols = [dirt, dirtT, dirtT, dirt];
          const rk = gk.row(pts.slice().reverse(), cols, pts.slice().reverse().map(p => [p[0] / 3, -p[2] / 3])); if (pk >= 0) gk.link(pk, rk, 0, 3); pk = rk;
        } else pk = -1;
      }
      addM(gl, aMat); addM(gk, bermM);
      // the stalls: every 9 m along the full-width stretch, a low wooden counter with a number board, a drum, a car (or none)
      const PC = [[0.1, 0.32, 0.18], [0.75, 0.12, 0.12], [0.12, 0.25, 0.55], [0.9, 0.9, 0.86], [0.85, 0.62, 0.12], [0.16, 0.16, 0.18], [0.3, 0.5, 0.75]];
      const raceCar = (g, x, y, z, hd, c) => {   // a front-engined roadster of the 1950s: a long cigar body, the cowl, the wheels
        const ca = Math.cos(hd), sa = Math.sin(hd);
        box(g, x, y + 0.3, z, 3.9, 0.55, 1.15, hd, c, c, true); box(g, x + ca * 1.4, y + 0.38, z + sa * 1.4, 1.2, 0.42, 0.85, hd, c, c, true);
        box(g, x - ca * 0.5, y + 0.82, z - sa * 0.5, 0.25, 0.25, 0.9, hd, [0.6, 0.7, 0.75], null, true);
        for (const [a, b] of [[1.3, 0.72], [1.3, -0.72], [-1.25, 0.72], [-1.25, -0.72]]) cyl(g, x + ca * a - sa * b, y, z + sa * a + ca * b, 0.34, 0.66, 8, [0.08, 0.08, 0.09], [0.6, 0.6, 0.62]);
      };
      for (let d = p0 + 70, k = 0; d < p1 - 55; d += 9, k++) {
        const s = sAt(d), i = T.idx(s), o = lo(d) - lw - 0.4, [x, z] = atSf(s, o), y = hyS(s), hd = T.hd[i], g = scen.get(x, z), tx = T.tx[i], tz = T.tz[i], nx = -T.nx[i], nz = -T.nz[i];
        box(g, x + nx * 2.4, y, z + nz * 2.4, 6.5, 1.0, 0.6, hd, [0.6, 0.48, 0.34], [0.72, 0.6, 0.44], true);   // the counter
        for (const [a, b] of [[-3.6, 3.0], [3.6, 3.0], [-3.6, 5.8], [3.6, 5.8]]) box(g, x + tx * a + nx * b, y - 0.2, z + tz * a + nz * b, 0.12, 2.75, 0.12, hd, [0.62, 0.6, 0.56]);   // the stall's awning on four posts
        { const ac = k % 2 ? [0.86, 0.22, 0.18] : [0.2, 0.36, 0.62]; for (let q = 0; q < 4; q++) box(g, x + tx * (-2.7 + q * 1.8) + nx * 4.4, y + 2.5, z + tz * (-2.7 + q * 1.8) + nz * 4.4, 1.8, 0.1, 3.3, hd, q % 2 ? [0.95, 0.94, 0.9] : ac); }
        cyl(g, x + nx * 2.4 + tx * 2.9, y, z + nz * 2.4 + tz * 2.9, 0.3, 0.9, 7, [0.72, 0.16, 0.12], [0.3, 0.3, 0.3]);   // a fuel drum
        if (crH(k, 3, 77) < 0.6) raceCar(g, x + nx * 0.6 - tx * 0.5, y + 0.03, z + nz * 0.6 - tz * 0.5, hd, PC[Math.floor(crH(k, 4, 77) * PC.length)]);
        if (k % 2 === 0) board(x + nx * 2.1 + tx * 0.3, y + 1.0, z + nz * 2.1 + tz * 0.3, nx, nz, 1.4, 0.36, RS_AT.num + (k / 2 % 9));   // (the stall's number, facing the lane)
        exclPush(x + nx * 3, z + nz * 3, 6); CR.exclAdd(x + nx * 3, z + nz * 3, 5); nStalls++;
      }
      // the long pit building behind the stalls, white, its flat roof; the paddock beyond it with the transporters and the teams' cars
      { const d0 = (p0 + p1) / 2 - 10, s = sAt(d0), i = T.idx(s), [x, z] = atSf(s, po - 26), y = hyS(s), hd = T.hd[i], g = scen.get(x, z);
        box(g, x, y - 0.3, z, 44, 3.6, 9, hd, [0.92, 0.9, 0.84], [0.62, 0.6, 0.58], true);
        box(g, x + Math.cos(hd) * 0, y + 1.1, z, 44.2, 1.0, 9.2, hd, [0.36, 0.42, 0.48], null, true);   // (a band of windows)
        exclPush(x, z, 25); CR.exclAdd(x, z, 24);
        for (let k = 0; k < 7; k++) {   // transporters and trailers of the time: a cab, a box body
          const dd = d0 - 55 + k * 17 + (crH(k, 1, 79) - 0.5) * 4, s2 = sAt(dd), i2 = T.idx(s2), [x2, z2] = atSf(s2, po - 46 - crH(k, 2, 79) * 10), y2 = nrGround(x2, z2), h2 = T.hd[i2] + Math.PI / 2 + (crH(k, 3, 79) - 0.5) * 0.3, g2 = scen.get(x2, z2), cc = PC[k % PC.length];
          const c2 = Math.cos(h2), s3 = Math.sin(h2);
          box(g2, x2 + c2 * 3.6, y2 + 0.4, z2 + s3 * 3.6, 2.2, 2.0, 2.3, h2, cc, [0.9, 0.9, 0.9], true); box(g2, x2 - c2 * 1.4, y2 + 0.5, z2 - s3 * 1.4, 7.0, 2.8, 2.4, h2, [0.88, 0.87, 0.82], [0.7, 0.7, 0.7], true);
          exclPush(x2, z2, 7);
        }
      }
      // the timing and scoring stand over the start line: two storeys of timber, the upper one glazed all round, a balcony, its flag
      { const s = sStart, i = T.idx(s), [x, z] = atSf(s, po - 13), y = hyS(s), hd = T.hd[i], g = scen.get(x, z), tx = T.tx[i], tz = T.tz[i], nx = T.nx[i], nz = T.nz[i];
        for (const [a, b] of [[-2.6, -1.8], [2.6, -1.8], [-2.6, 1.8], [2.6, 1.8]]) box(g, x + tx * a + nx * b, y - 0.3, z + tz * a + nz * b, 0.3, 3.4, 0.3, hd, [0.55, 0.45, 0.33]);
        box(g, x, y + 3.0, z, 6.2, 0.25, 4.6, hd, [0.6, 0.5, 0.36], [0.66, 0.56, 0.4]);
        box(g, x, y + 3.25, z, 5.6, 2.5, 3.8, hd, [0.9, 0.88, 0.8], null, true); box(g, x, y + 4.0, z, 5.65, 1.1, 3.85, hd, [0.2, 0.26, 0.32], null, true);
        box(g, x, y + 5.75, z, 6.6, 0.3, 5.0, hd, [0.5, 0.46, 0.42], [0.62, 0.6, 0.56]);
        board(x + nx * 2.5, y + 3.55, z + nz * 2.5, -nx, -nz, 5.0, 1.25, RS_AT.ban + 3);   // 'TIMING', facing the track
        flagAt(x - tx * 2.4, y + 6.0, z - tz * 2.4, 4, US, 1.6);
        exclPush(x, z, 6); CR.exclAdd(x, z, 5);
      }
      // the starter's banner across the main straight, on two timber poles
      { const s = sStart + 2, i = T.idx(s), y = hyS(s), sp = w + 2.4, g = scen.get(...atSf(s, 0).slice(0, 2));
        for (const sd of [-1, 1]) { const [x, z] = atSf(s, sd * sp); box(g, x, y - 0.3, z, 0.3, 7.6, 0.3, T.hd[i], [0.5, 0.4, 0.3]); }
        const [cx, cz] = atSf(s, 0); board(cx, y + 5.6, cz, T.tx[i], T.tz[i], sp * 2 - 1, 1.2, RS_AT.ban + 1); }
      // 'PITS' boards at the lane's two ends
      for (const [dd, sd] of [[p0 + 30, -1], [p1 - 25, -1]]) { const s = sAt(dd), i = T.idx(s), [x, z] = atSf(s, lo(dd) - lw - 1.5), y = nrGround(x, z), g = scen.get(x, z);
        for (const o of [-1.1, 1.1]) box(g, x + T.nx[i] * o, y - 0.3, z + T.nz[i] * o, 0.14, 2.6, 0.14, T.hd[i], [0.46, 0.36, 0.26]);
        board(x, y + 1.6, z, T.tx[i], T.tz[i], 2.6, 0.7, RS_AT.ban + 2); }
    }

    /* ---- the grandstand across from the pits: open timber bleachers on a steel frame, the crowd on every tier, a press box on top, flags ---- */
    const crowdMat = ownTex(API.rbCrowdTex(false)), crowdG = new GB(true);
    let nStands = 0;
    for (const [sa, sb, side, rows] of def.stands || []) {
      const dep = 0.9, rise = 0.55, rws = [];
      for (let d = sa; d <= sb + 0.01; d += 5) {
        const s = sAt(d), i = T.idx(s), f0 = (side > 0 ? T.br[i] : T.bl[i]) + 3.2, g0 = hyS(s) + 0.1, prof = [[f0 - 0.3, g0 - 0.6]]; let y = g0;
        for (let k = 0; k < rows; k++) { const o = f0 + k * dep; y = g0 + 0.6 + k * rise; prof.push([o, y], [o + dep, y]); }
        const back = f0 + rows * dep; prof.push([back, y + 1.1], [back + 0.2, y + 1.1], [back + 0.2, g0 - 0.5]);
        rws.push({ s, pts: prof.map(([o, yy]) => { const [x, z] = atSf(s, side * o); return [x, yy, z]; }), prof });
      }
      const timber = [0.66, 0.56, 0.42], timberD = [0.5, 0.42, 0.32];
      for (let m = 0; m + 1 < rws.length; m++) {
        const A = rws[m], B = rws[m + 1], g = scen.get(A.pts[1][0], A.pts[1][2]), n = A.pts.length;
        for (let e = 0; e + 1 < n; e++) { const a0 = A.pts[e], a1 = A.pts[e + 1], b0 = B.pts[e], b1 = B.pts[e + 1], up = Math.abs(a1[1] - a0[1]) < 0.05, om = (A.prof[e][0] + A.prof[e + 1][0]) / 2, ym = (a0[1] + a1[1]) / 2;
          const [ix, iz] = atSf(A.s, side * (up ? om : e >= n - 3 ? om - 1 : om + 1)); g.quadO(a0, a1, b1, b0, up ? timber : e >= n - 3 ? timberD : [0.42, 0.44, 0.48], [ix, up ? ym - 1 : ym, iz]); }
        for (let k = 0; k < rows; k++) { const a0 = A.pts[1 + k * 2], a1 = A.pts[2 + k * 2], b0 = B.pts[1 + k * 2], b1 = B.pts[2 + k * 2], len = Math.hypot(B.pts[1][0] - A.pts[1][0], B.pts[1][2] - A.pts[1][2]), v = (k * 0.11) % 1, u0 = (m * 5) / 12;
          crowdG.quadUp([a0[0], a0[1] + 0.02, a0[2]], [a1[0], a1[1] + 0.02, a1[2]], [b1[0], b1[1] + 0.02, b1[2]], [b0[0], b0[1] + 0.02, b0[2]], [W1, W1, W1, W1], [[u0, v], [u0, v + 0.1], [u0 + len / 12, v + 0.1], [u0 + len / 12, v]]); }
        if (m % 2 === 0) { const [bx, bz] = atSf(A.s, side * (A.prof[A.prof.length - 3][0] - 0.2)), by = nrGround(bx, bz); box(g, bx, by - 0.3, bz, 0.22, A.pts[A.pts.length - 3][1] - by + 0.3, 0.22, T.hd[T.idx(A.s)], [0.4, 0.42, 0.46]); }
      }
      { const M = rws[rws.length >> 1], i = T.idx(M.s), [x, z] = atSf(M.s, side * (M.prof[M.prof.length - 3][0] - 2.4)), y = M.pts[M.pts.length - 3][1], g = scen.get(x, z);   // the press box
        box(g, x, y, z, 12, 2.6, 3.6, T.hd[i], [0.9, 0.88, 0.8], [0.45, 0.42, 0.4], true); box(g, x - side * T.nx[i] * 0.05, y + 1.0, z - side * T.nz[i] * 0.05, 12.05, 1.0, 3.65, T.hd[i], [0.22, 0.27, 0.33], null, true);
        const [nxB, nzB] = [-side * T.nx[i], -side * T.nz[i]];
        board(x + nxB * 1.85, y + 2.65, z + nzB * 1.85, -nxB, -nzB, 9, 1.2, RS_AT.ban + 12); }   // ('GRANDSTAND' on its front, read from the track)
      for (let m = 1; m < rws.length - 1; m += 4) { const A = rws[m], [x, z] = atSf(A.s, side * (A.prof[A.prof.length - 3][0] + 0.15)); flagAt(x, A.pts[A.pts.length - 3][1] + 1.1, z, 5, m % 8 === 1 ? US : CAL); }
      for (const r of rws) { const [x, z] = atSf(r.s, side * (r.prof[0][0] + rows * dep * 0.5)); exclPush(x, z, rows * dep / 2 + 7); CR.exclAdd(x, z, rows * dep / 2 + 4); crowdPts.push(x, z, 0.9); }
      parkRow(sa, sb, side, 3.2 + rows * dep + 14, 3);
      nStands++;
    }
    addM(crowdG, crowdUV(new THREE.MeshLambertMaterial({ map: crowdMat, vertexColors: true }), 1, 0.11, 0.1));

    /* ---- turn numbers, flag marshals' huts, the billboards along the straights ---- */
    const roomSide = (s) => { let l = 0, r = 0; for (let d = -30; d <= 30; d += 6) { const i = T.idx(s + d); l += T.bl[i]; r += T.br[i]; } return r > l ? 1 : -1; };
    (def.turns || []).forEach(([tx0, tz0], k) => {   // a white board with the turn's number before it, on the outside
      const i0 = T.nearestIdx(tx0, tz0), side = T.k[i0] > 0 ? -1 : 1, s = i0 * ds - 55;
      signPost(s, side, 1.6, RS_AT.num + k, 1.3, 1.3, 1.0);
    });
    for (let d = 260, k = 0; d < L - 420; d += 420, k++) {   // a marshal's hut: timber, a tin roof, a flag on a pole
      const s = sAt(d), side = k % 2 ? roomSide(s) : -roomSide(s), [x, z, i] = onSide(s, side, 3.2), y = nrGround(x, z), g = scen.get(x, z);
      if (excluded(x, z) || (side < 0 && pitAt(i))) continue;
      box(g, x, y - 0.2, z, 2.2, 2.3, 2.0, T.hd[i], [0.66, 0.55, 0.4], [0.7, 0.72, 0.74], true);
      box(g, x - T.nx[i] * side * 0.4, y + 1.1, z - T.nz[i] * side * 0.4, 1.4, 0.6, 2.05, T.hd[i], [0.2, 0.24, 0.28], null, true);
      const fx = x + T.tx[i] * 1.7, fz = z + T.tz[i] * 1.7; cyl(g, fx, y, fz, 0.05, 3.6, 5, [0.85, 0.85, 0.87]); box(g, fx + T.tx[i] * 0.45, y + 2.9, fz + T.tz[i] * 0.45, 0.9, 0.6, 0.04, T.hd[i], [0.98, 0.84, 0.1], null, true);
      exclPush(x, z, 5); CR.avoid(x, z, 2.5);
    }
    let nBill = 0;
    for (const [d0, d1, side, step] of [[3250, 4450, 1, 90], [3350, 4500, -1, 130], [-320, -140, 1, 60], [180, 520, 1, 85]]) {   // billboards: on two posts, 7 x 2.5 m, angled to the traffic
      for (let d = d0, k = 0; d < d1; d += step, k++) { const s = sAt(d), [x, z, i] = onSide(s, side, 9 + (k % 2) * 5); if (excluded(x, z) || nrSlope(x, z) > 0.35) continue;
        const y = nrGround(x, z), g = scen.get(x, z), cell = RS_AT.ban + 4 + ((nBill * 3 + (side > 0 ? 0 : 1)) % 8), ang = T.hd[i] + side * 0.35, tx = Math.cos(ang), tz = Math.sin(ang);
        for (const o of [-2.8, 2.8]) box(g, x - tz * o, y - 0.3, z + tx * o, 0.2, 4.4, 0.2, ang, [0.44, 0.35, 0.26]);
        board(x, y + 1.6, z, tx, tz, 7, 2.5, cell); exclPush(x, z, 6); nBill++; }
    }

    /* ---- the roads of 1966 by the circuit: the other layouts' links and the paddock road (asphalt), Eucalyptus Avenue, Day Street, the
       highway: draped on the ground ---- */
    const roadMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
    const roads = new Chunks(256, true);
    const drape = (pts, hw, col, lift) => {   // a strip hw m either side of the polyline, a row every ~4 m, on the ground
      const Pp = []; for (let k = 0; k + 1 < pts.length; k++) { const [x0, z0] = pts[k], [x1, z1] = pts[k + 1], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 4)); for (let q = 0; q < n; q++) Pp.push([x0 + (x1 - x0) * q / n, z0 + (z1 - z0) * q / n]); }
      Pp.push(pts[pts.length - 1]);
      for (let k = 0; k + 1 < Pp.length; k++) {
        const [xa, za] = Pp[k], [xb, zb] = Pp[k + 1], l = Math.hypot(xb - xa, zb - za) || 1, nx = -(zb - za) / l, nz = (xb - xa) / l;
        const q = [[xa - nx * hw, za - nz * hw], [xa + nx * hw, za + nz * hw], [xb + nx * hw, zb + nz * hw], [xb - nx * hw, zb - nz * hw]].map(([x, z]) => { const n = nrNear(x, z); const y = n.i >= 0 && n.dd < 1 ? Math.min(nrGround(x, z), T.hy[n.i] - 0.04) : nrGround(x, z); return [x, y + (lift || 0.07), z]; });
        roads.get(xa, za).quadUp(q[0], q[1], q[2], q[3], [col, col, col, col], q.map(p => [p[0] / 8, p[2] / 8]));
      }
    };
    const asp = [0.86, 0.85, 0.84];
    const RD2 = def.roads || {};
    for (const k of ['oval', 't6t8', 't7']) if (RD2[k]) drape(RD2[k], 4.5, asp);
    if (RD2.paddock) drape(RD2.paddock, 3.5, asp);
    if (RD2.euc) drape(RD2.euc, 3.2, [0.92, 0.9, 0.86]);
    if (def.day) drape(def.day, 3.4, [0.92, 0.9, 0.86]);
    if (def.hwy) { const H = def.hwy; for (const sd of [-1, 1]) drape(H.map((p, k) => { const q = H[Math.min(H.length - 1, k + 1)], r = H[Math.max(0, k - 1)], l = Math.hypot(q[0] - r[0], q[1] - r[1]) || 1; return [p[0] - (q[1] - r[1]) / l * 6.2 * sd, p[1] + (q[0] - r[0]) / l * 6.2 * sd]; }), 3.7, asp, 0.09); }
    roads.addTo(root, roadMat, false, true);

    /* ---- the houses of Edgemont (the land cover's built-up cells): ranch houses of the 1950s, stucco under low roofs ---- */
    let nHouses = 0;
    { const LC = P.L, WALL = [[0.95, 0.92, 0.84], [0.92, 0.88, 0.78], [0.86, 0.9, 0.88], [0.96, 0.9, 0.86], [0.9, 0.86, 0.76]], ROOF = [[0.45, 0.42, 0.4], [0.55, 0.4, 0.32], [0.6, 0.58, 0.55], [0.4, 0.36, 0.3]];
      const hg = new Chunks(256);
      for (let j = 0; j < LC.nz; j++) for (let i = 0; i < LC.nx; i++) {
        if (P.lc[j * LC.nx + i] !== 3 || crH(i, j, 81) > 0.42 || nHouses > 380) continue;
        const x = LC.x0 + (i + 0.3 + crH(i, j, 82) * 0.4) * LC.cell, z = LC.z0 + (j + 0.3 + crH(i, j, 83) * 0.4) * LC.cell, rd = nrDist(x, z);
        if (rd < 60 || rd > 520 || excluded(x, z) || nrSlope(x, z) > 0.2) continue;
        const y = nrGround(x, z), rot = (crH(i, j, 84) < 0.5 ? 0 : Math.PI / 2) + (crH(i, j, 85) - 0.5) * 0.06, g = hg.get(x, z), wc = WALL[Math.floor(crH(i, j, 86) * 5)], rc = ROOF[Math.floor(crH(i, j, 87) * 4)];
        box(g, x, y - 0.3, z, 12, 3.1, 8, rot, wc, wc, true); gable(g, x, y + 2.8, z, 12.6, 8.8, 1.5, rot, rc, wc);
        exclPush(x, z, 9); nHouses++;
      }
      hg.addTo(root, matV, true, true);
    }

    /* ---- spectators on the hillsides and round the hairpins (the people of 1960), their cars parked behind them ---- */
    {
      const M = { first: 2.2, gap: 1.2, excluded, below: 4, above: 30, sit: 0.45, flag: 0, maxSlope: 0.9 };
      for (const [a, b, sd] of def.ga || []) { crowdRun(CR, sStart + a, sStart + b, sd, Object.assign({}, M, { rows: 7, dens: 0.5, gap: 1.35, clump: 0.75, label: 'RS ga' })); parkRow(a + 10, b - 10, sd, 22, 2);
        for (let d = a; d < b; d += 24) { const [x, z] = onSide(sAt(d), sd, 6); crowdPts.push(x, z, 0.6); } }
      for (const sd of [-1, 1]) crowdRun(CR, sStart + 300, sStart + L - 420, sd, Object.assign({}, M, { rows: 2, dens: 0.04, clump: 0.95, strip: false, label: 'RS groups' }));
      for (const e of CR.circ) exclPush(e.x, e.z, e.r);
    }
    cars.addTo(root, true);

    /* ---- trees: lone eucalypts and rows of them along the roads (windbreaks), the sage scrub and chaparral on the hillsides, a few
       bushes in the dry grass ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const tk = [new IChunks(API.auTreeGeo(0), tMat, 192), new IChunks(API.auTreeGeo(1), tMat, 192)];
    const tf = [new IChunks(API.auTreeGeo(2), tMat, 256), new IChunks(API.auTreeGeo(3), tMat, 256)];
    let nTrees = 0;
    const gum = (x, z, hgt) => { if (excluded(x, z)) return; const n = nrNear(x, z); if (n.i >= 0 && n.dd < 6) return; const rd = nrDist(x, z), far = rd > 70, y = nrGround(x, z), wid = hgt * (0.55 + R() * 0.2), cv = 0.86 + R() * 0.24;
      (far ? tf : tk)[0].add(x, y - 0.1, z, R() * TAU, wid, hgt, [cv * 0.98, cv, cv * 1.02]); nrShade(x, z, wid * 0.24, 1); nTrees++; };
    {
      const rowAlong = (pts, gap, off) => { for (let k = 0; k + 1 < pts.length; k++) { const [x0, z0] = pts[k], [x1, z1] = pts[k + 1], l = Math.hypot(x1 - x0, z1 - z0) || 1, nx = -(z1 - z0) / l, nz = (x1 - x0) / l;
        for (let q = R() * gap; q < l; q += gap * (0.8 + R() * 0.4)) for (const sd of [-1, 1]) { if (R() < 0.3) continue; const x = x0 + (x1 - x0) * q / l + nx * off * sd, z = z0 + (z1 - z0) * q / l + nz * off * sd; if (nrDist(x, z) < 270) gum(x, z, 18 + R() * 12); } } };
      if (RD2.euc) rowAlong(RD2.euc, 11, 9);
      if (def.day) rowAlong(def.day.filter((p, k) => k % 2 === 0), 16, 10);
      const groves = [[sAt(PL[0] + 40), -95, 9], [sAt(-30), 70, 7], [sAt(4820), -70, 8], [sAt(2160), 75, 4], [sAt(560), -60, 5], [sAt(3800), 80, 5]];   // groups of shade trees: the paddock, behind the grandstand, Turn 9, Turn 7, the bend of the main straight, the back straight
      for (const [s, lat, n] of groves) { const [cx, cz] = atS(s, lat); for (let k = 0; k < n; k++) gum(cx + (R() - 0.5) * 50, cz + (R() - 0.5) * 50, 16 + R() * 12); }
      const Lt = NRC * NRT, maxT = Math.round(9000 * dens);
      for (let tj = 0; tj < G.ntz && nTrees < maxT; tj++) for (let ti = 0; ti < G.ntx && nTrees < maxT; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt; zz += 7) for (let xx = xa; xx < xa + Lt; xx += 7) {
          const x = xx + (R() - 0.5) * 6, z = zz + (R() - 0.5) * 6, rd = nrDist(x, z), r1 = R(), cl = nrLC(x, z);
          if (rd > 300) continue;
          const p = cl === 2 ? 0.34 : cl === 3 ? 0.03 : 0.012, lone = cl === 0 && r1 < 0.0012;   // (now and then a lone eucalypt out in the grass)
          if (r1 > p) continue;
          if (rd < 40) { const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 4) continue; }
          if (excluded(x, z) || P.pad(x, z, 0) !== 0) continue;
          if (lone) { gum(x, z, 16 + R() * 10); continue; }
          const y = nrGround(x, z), far = rd > 70, hgt = 1.2 + R() * (cl === 2 ? 2.4 : 1.3), wid = hgt * (1.2 + R() * 0.5), cv = 0.8 + R() * 0.25;
          (far ? tf : tk)[1].add(x, y - 0.25, z, R() * TAU, wid, hgt, [cv * 0.94, cv * 0.96, cv * 0.86]); nrShade(x, z, wid * 0.3, 0.6); nTrees++;
        }
      }
    }
    for (const t of tk) t.addTo(root, true);
    for (const t of tf) t.addTo(root, false);

    /* ---- terrain tiles, coloured now (the shade under the trees) ---- */
    let nTiles = 0;
    { const grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let k = 0; k < tiles.length; k += 3) { const m = new THREE.Mesh(nrTileGeo(tiles[k], tiles[k + 1], tiles[k + 2] === 1 ? 1 : 4), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); nTiles++; }
      G.col = G.cov = P.edge = null; }

    // knockable props: posts along the verges, tyre stacks at the exits of the hairpins (not on the grid and the pit straight)
    out.propR = 150;
    out.propFloor = propFloorTable(null, (i, side) => verge(i, side));
    out.propStats = roadsideProps(out.props, { post: [140, 190], postEdge: [1.4, 2.0], exits: 4, apexes: 0, wallEdge: [1.6, 2.2], stacks: [4, 6], rows2: 0.2,
      floor: out.propFloor, skip: (i, side) => { const d = dS(i * ds); return (d > -340 && d < 150) || !!(side > 0 ? T.gravR[i] : T.gravL[i]); } });
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: atlas })); if (bm) bm.castShadow = false;
    addM(fenceG, fMat);
    crowdFinish(CR, root, out);
    if (flagL.length) root.add(API.rbFlags(flagL, CR.U.uTime));
    out.crowdPts = Float32Array.from(crowdPts);
    if (def.far) out.dyn.far = rsFar(root, def.far, sea, hyS(sStart) + 6);
    if (def.minaret) out.dyn.mrFar = API.mrFarTower(root, def.minaret[0], def.minaret[1], def.minaret[2]);   // (the old town's minaret on the horizon to the north)
    out.stats = { tiles: nTiles, trees: nTrees, bales: nBales, rails: nRail, apexTyres: nApex, stalls: nStalls, stands: nStands, cars: nCars, houses: nHouses, billboards: nBill, decals: nDecals, flags: flagL.length };   // (read by the tests)
    return out;
  }

  Object.assign(API, { rsFar });   // (what World and the other worlds use of this one)
  World.ext.riverside = (scene, tex, opts) => buildRiverside(scene, tex, opts);
})();
