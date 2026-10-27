/* =========================================================================
   WORLD — Moki Dugway (theme 'moki'): its own builder (World.ext.moki), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (LOD, T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, TAU, VRC, VRT, atSf, box, caCar, caGCol, caGround, caPlantGeo, caProps, caSlope, caTileGeo, caTileOn, clamp, crowdCtx,
    crowdFinish, crowdPut, crowdRun, cyl, gable, ico, lerp, ouCutMat, pkGroundMat, rng, rock, rpHash, sstep, tuftWindMat, valueNoise2, vary,
    vrDist, vrGritTex, vrNear, vrPrep
  } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ================= MOKI DUGWAY (theme 'moki') =================
     The Moki Dugway (Utah, State Route 261): from the Valley of the Gods up the gravel switchbacks cut into the cliff of Cedar Mesa, on a clear
     afternoon in the desert: the valley floor of pale red-brown silt and sand with sagebrush and bunch grass, the cliff in layers (the dark red
     shales low down, red and orange sandstone with cream bands above them, the pale Cedar Mesa sandstone on the rim), talus of fallen blocks at
     its foot, junipers and pinyon pines on the mesa top, sandstone buttes and spires out on the valley floor. Built on Vršič's corridor (vrPrep and
     Los Caracoles' terrain helpers: caNear, caH, caGround and the tiles, coloured by mkCol through VR.col), with a look of its own: the gravel road
     with its paved ends (def.paved), no guardrails on most of it (a low berm of gravel along the edge where the ground falls away, steel only
     round the outside of the switchbacks), the viewpoint over the valley (def.vista), the buttes (def.buttes), generic road signs. */
  const MKCOL = [0, 0, 0];
  function mkCol(x, z, h, ny, sz, dd, sx) {   // ground colour (times the grey grit map): the red-brown silt and sand of the valley floor, the cliff's layers
    // on the steep faces (by height: dark red shale, red and orange sandstone with cream bands, the pale rim), talus fans on the slopes, the pale sandy
    // soil of the mesa top with darker crusts, a dusty verge
    const P = API.VR, A = h + P.D.base, m = P.c1(x, z), q = P.c2(x, z), r = P.c3(x, z), f = P.n4(x, z);
    let R = 0.74 + (m - 0.5) * 0.08, G = 0.55 + (m - 0.5) * 0.06, B = 0.43 + (q - 0.5) * 0.05;   // the valley floor: red-brown silt and sand
    const pale = sstep(0.55, 0.82, q) * 0.6; R = lerp(R, 0.8, pale); G = lerp(G, 0.66, pale); B = lerp(B, 0.52, pale);   // paler sandy washes
    const top = sstep(1915, 1945, A); R = lerp(R, 0.79 + (m - 0.5) * 0.06, top); G = lerp(G, 0.68, top); B = lerp(B, 0.54, top);   // the mesa top: pale sand
    const crust = sstep(0.58, 0.8, r) * (0.35 + 0.4 * top); R = lerp(R, 0.55, crust); G = lerp(G, 0.47, crust); B = lerp(B, 0.38, crust);   // dark soil crusts, under the shrubs
    R += (f - 0.5) * 0.08; G += (f - 0.5) * 0.07; B += (f - 0.5) * 0.06;
    const st = sstep(0.84, 0.5, ny);   // the steep faces: the cliff's layers along the height
    if (st > 0) {
      const w = A + (P.c5(x, z) - 0.5) * 3 + (P.c2(x * 0.3, z * 0.3) - 0.5) * 6, band = 0.5 + 0.5 * Math.sin(w / 3.1), band2 = 0.5 + 0.5 * Math.sin(w / 7.7 + 1.3), up = sstep(1700, 1880, A);
      let cr = lerp(0.62, 0.8, band2), cg = lerp(0.34, 0.47, band2), cb = lerp(0.24, 0.32, band2);   // red and orange sandstone
      const cream = sstep(0.62, 0.9, band) * lerp(0.35, 0.95, up); cr = lerp(cr, 0.88, cream); cg = lerp(cg, 0.78, cream); cb = lerp(cb, 0.62, cream);   // the cream bands, most up on the rim
      const shale = sstep(1720, 1660, A) * 0.7; cr = lerp(cr, 0.56, shale); cg = lerp(cg, 0.33, shale); cb = lerp(cb, 0.27, shale);   // the dark red shale low down
      const k = 0.88 + 0.16 * P.c4(x * 0.8, z * 0.8); R = lerp(R, cr * k, st); G = lerp(G, cg * k, st); B = lerp(B, cb * k, st);
    }
    const hz = Math.hypot(sx || 0, sz), fan = sstep(0.14, 0.4, hz) * (1 - st);   // the talus slopes: fans of fallen rock and darker runnels down the fall line
    if (fan > 0) { const u = (z * (sx || 0) - x * sz) / hz, wv = Math.sin(u * 0.21 + P.c5(x, z) * 6 + P.n2(x, z) * 4), k = wv * fan * (0.05 + 0.08 * P.n3(x, z)); R += k; G += k * 0.9; B += k * 0.8; }
    if (dd < 4) { const t = sstep(4, 0.5, dd) * 0.45; R = lerp(R, 0.8, t); G = lerp(G, 0.66, t); B = lerp(B, 0.54, t); }   // the dusty verge
    MKCOL[0] = R; MKCOL[1] = G; MKCOL[2] = B; return MKCOL;
  }
  let mkATex = null, mkAKey = '', mkA2Tex = null;   // (the board atlases, made once and reused by every build of the road)
  function mkAtlas(cps, finA) {   // text boards (8 rows of 1024 x 128): START, CILJ, CP1-CP4 with the altitude, the sign on the mesa, the chevrons (row 7: two cells)
    const key = cps.join('|') + '|' + finA; if (mkATex && mkAKey === key) return mkATex;
    if (mkATex) mkATex.dispose(); mkAKey = key;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 104, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(312, 142, 400, 100); txt('CILJ', 512, 196, 96, '#111', 380);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#8a3b1e'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffd23a', 520); });
    x.fillStyle = '#5a3a22'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#efe3c8'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);
    txt('CEDAR MESA', 512, 812, 58, '#f3ead6', 900); txt(finA, 512, 862, 46, '#f3ead6', 900);
    for (const [k, dir] of [[0, 1], [1, -1]]) {   // the chevrons: black arrows on yellow, pointing the way the road turns
      const x0 = k * 128, y0 = 896; x.fillStyle = '#f1c21b'; x.fillRect(x0, y0, 128, 128); x.fillStyle = '#16181c';
      for (const o of [-26, 14]) { x.beginPath(); const cx = x0 + 64 + o * dir; x.moveTo(cx - 14 * dir, y0 + 22); x.lineTo(cx + 18 * dir, y0 + 64); x.lineTo(cx - 14 * dir, y0 + 106); x.lineTo(cx - 34 * dir, y0 + 106); x.lineTo(cx - 2 * dir, y0 + 64); x.lineTo(cx - 34 * dir, y0 + 22); x.closePath(); x.fill(); } }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (mkATex = t);
  }
  // the road signs (generic, as along any state road): two a row, 512 x 128
  const MK_BOARDS = [['PAVEMENT ENDS', '#f1c21b'], ['SCENIC VIEW', '#6b4a22'], ['SPEED LIMIT 15', '#f2f2ee'], ['SWITCHBACKS AHEAD', '#f1c21b'], ['CEDAR MESA', '#6b4a22'], ['VALLEY OF THE GODS', '#6b4a22'], ['GRAVEL ROAD', '#f1c21b'], ['MEXICAN HAT', '#1f6b3a']];
  function mkAtlas2() {
    if (mkA2Tex) return mkA2Tex;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d');
    MK_BOARDS.forEach(([n, bg], k) => { const x0 = (k % 2) * 512, y0 = Math.floor(k / 2) * 128, dark = bg === '#f1c21b' || bg === '#f2f2ee';
      x.fillStyle = bg; x.fillRect(x0, y0, 512, 128); x.strokeStyle = dark ? '#16181c' : '#f2f2ee'; x.lineWidth = 6; x.strokeRect(x0 + 8, y0 + 8, 496, 112);
      x.fillStyle = dark ? '#16181c' : '#f2f2ee'; x.font = '900 50px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(n, x0 + 256, y0 + 66, 470); });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (mkA2Tex = t);
  }
  function mkPlantGeo(kind) {   // unit plants (height 1; the instances scale and tint them): 0 a Utah juniper (a short, twisted trunk, a ragged blue-green crown), 1 a pinyon
    // pine (a rounder, darker crown on a short trunk), 2 a sagebrush (a grey-green mound of small clumps)
    const g = new GB(), R = rng(760 + kind), rs = API.ROCK_SMOOTH;
    API.ROCK_SMOOTH = true;
    if (kind === 0) {
      cyl(g, 0, -0.02, 0, 0.05, 0.36, 4, [0.42, 0.34, 0.26], null, 0.035); cyl(g, 0.06, 0.25, 0.02, 0.03, 0.22, 3, [0.45, 0.37, 0.28], null, 0.02);
      const col = [0.3, 0.38, 0.3];
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + R() * 0.6, d = k ? 0.17 + R() * 0.08 : 0; ico(g, Math.cos(a) * d, 0.58 + (k ? -0.08 + R() * 0.16 : 0.14), Math.sin(a) * d, k ? 0.2 : 0.26, 0.9, vary(col, R, 0.18), R, 0.35); }
    } else if (kind === 1) {
      cyl(g, 0, -0.02, 0, 0.045, 0.3, 4, [0.38, 0.29, 0.22], null, 0.03);
      const col = [0.2, 0.3, 0.19];
      ico(g, 0, 0.6, 0, 0.32, 1.0, col, R, 0.25); ico(g, 0.15, 0.48, 0.08, 0.2, 0.9, vary(col, R, 0.15), R, 0.3); ico(g, -0.14, 0.5, -0.1, 0.2, 0.9, vary(col, R, 0.15), R, 0.3);
    } else {
      const col = [0.56, 0.6, 0.5];
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + R() * 0.5, d = k ? 0.3 : 0; ico(g, Math.cos(a) * d, 0.42 - d * 0.4, Math.sin(a) * d, 0.3, 0.85, vary(col, R, 0.16), R, 0.4); }
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // a sandstone butte or spire on the valley floor (x, y, z: the foot; r: the radius of its cliff; hh: its height): a skirt of talus in red shale, the
  // cliff in red and orange bands with cream ones, a pale caprock; the outline wavy (16 sides), rounder at the top
  function mkButte(g, x, y, z, r, hh, R) {
    const n = 16, rn = [], el = 0.75 + R() * 0.5, ea = R() * Math.PI;
    for (let k = 0; k < n; k++) rn.push(1 + (R() - 0.5) * 0.28);
    const sh = [0.6, 0.36, 0.28], rd = [0.7, 0.38, 0.25], or = [0.8, 0.5, 0.31], cr = [0.88, 0.78, 0.62], cap = [0.84, 0.74, 0.6];
    const rings = [[-0.08, 2.4, sh], [0.18, 1.75, sh], [0.36, 1.18, rd], [0.42, 1.0, rd], [0.52, 0.99, or], [0.6, 0.98, cr], [0.66, 0.97, rd], [0.76, 0.96, or], [0.84, 0.95, cr], [0.9, 0.94, cr], [0.94, 0.99, cap], [1.0, 0.97, cap]];
    const pt = (k, f, y_) => { const a = k / n * TAU, rr = r * f * rn[k % n], u = Math.cos(a) * rr * el, v = Math.sin(a) * rr; return [x + u * Math.cos(ea) - v * Math.sin(ea), y + y_, z + u * Math.sin(ea) + v * Math.cos(ea)]; };
    const inn = [x, y + hh * 0.5, z];
    for (let q = 0; q < rings.length - 1; q++) { const [h0, f0, c0] = rings[q], [h1, f1, c1] = rings[q + 1];
      for (let k = 0; k < n; k++) { const a = pt(k, f0, h0 * hh), b = pt(k + 1, f0, h0 * hh), c = pt(k + 1, f1, h1 * hh), d = pt(k, f1, h1 * hh), j = 0.92 + 0.12 * R(), ca = c0.map(v => v * j), cb = c1.map(v => v * j);
        g.quadO(a, b, c, d, ca, inn, null, [ca, ca, cb, cb]); } }
    const tp = [x, y + hh, z]; for (let k = 0; k < n; k++) g.triO(pt(k, 0.97, hh), pt(k + 1, 0.97, hh), tp, cap, [x, y, z]);
  }
  function buildMoki(scene, tex, opts) {
    const R = rng(3911), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: caGround, camFloor: caGround, props: [], farClip: true, ownTex: [], dust: [0.8, 0.64, 0.5] };
    vrPrep();
    const P = API.VR, sStart = T.startS, sFin = T.finishS, base = P.D.base;
    P.c1 = valueNoise2(811, 150); P.c2 = valueNoise2(812, 64); P.c3 = valueNoise2(813, 40); P.c4 = valueNoise2(814, 120); P.c5 = valueNoise2(815, 26);
    P.fin = [T.px[T.finishIdx], T.pz[T.finishIdx]]; P.col = mkCol;   // (caTileGeo, caGCol: this road's colours)
    const paved = T.pavedAt || new Uint8Array(N);
    // the viewpoint (def.vista [metres after the start line, side]): a level gravel plot beside the road
    const vs = def.vista || [0, 1], vi = T.idx(sStart + vs[0]), vsd = vs[1], vo = (vsd > 0 ? T.br[vi] : T.bl[vi]) + 9;
    const padV = { x: T.px[vi] + T.nx[vi] * vsd * vo, z: T.pz[vi] + T.nz[vi] * vsd * vo, r: 10, b: 10, h: T.hy[vi] - 0.2, i: vi, sd: vsd }; P.pads.push(padV);
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (the boulders and trees between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles for the plants and the boulders, hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    exclPush(padV.x, padV.z, padV.r + 3);
    out.marks = { vista: [padV.x, padV.z] };   // (where the landmarks stand: the tests look for them)

    /* ---- terrain tiles ---- */
    let nFar = 0;
    const tMat = pkGroundMat(), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = caTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;
        const m = new THREE.Mesh(caTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
    }

    /* ---- the road: on the paved ends asphalt with white edge lines and a double yellow centre line, between them the gravel (red-brown, two darker
       wheel tracks along the driving line, loose gravel on the crown and at the edges); a gravel shoulder, then the verge out past the barrier line
       up or down onto the ground (120 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const sMat = new THREE.MeshPhongMaterial({ map: tex.makadam, bumpMap: tex.makadamBump, bumpScale: 0.045, shininess: 5, specular: 0x14110d, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const sw = 0.6;
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], e = w;
      const y = T.hy[i], gAt = (o) => { const q = side * o; return caGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; }, lift = (o, h) => [o, Math.max(h, gAt(o) + 0.05)];
      if (gAt(bar + 0.45) < -2.6) return [[e + sw, -0.02], [bar + 0.3, -0.04], [bar + 0.42, gAt(bar + 0.42) - 0.08], [bar + 1.15, gAt(bar + 1.15) + 0.03], [bar + 1.9, gAt(bar + 1.9) + 0.03]];   // (the edge of the cut: straight down onto the slope)
      return [[e + sw, -0.02], lift(Math.max(e + sw + 0.6, bar - 0.7), -0.12), [bar + 0.45, Math.min(-0.42, gAt(bar + 0.45) - 0.25)], lift(bar + 1.15, -0.3), [bar + 1.9, gAt(bar + 1.9) + 0.03]]; };
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    {
      const offsA = [-w, -w * 0.5, 0, w * 0.5, w], tileL = 8, tileG = 7;
      const shadeA = (i, o) => { const rl = T.rl[i]; let k = 0.86 - 0.13 * Math.exp(-((o - rl) * (o - rl)) / 5.5); if (Math.abs(o) > w * 0.88) k -= 0.04; return [k, k, k * 1.02]; };
      const grav = [1.08, 0.93, 0.8];   // (the makadam's grey-beige tinted to the cliff's red-brown sand)
      const colsG = (i) => { const rl = clamp(T.rl[i], -w + 1.9, w - 1.9); return [-w, -w + 0.45, rl - 1.6, rl - 1.15, rl - 0.65, rl - 0.2, rl + 0.2, rl + 0.65, rl + 1.15, rl + 1.6, w - 0.45, w]; };
      const shadeG = (i, o) => { const a = Math.abs(o - T.rl[i]), trk = sstep(0.42, 0.68, a) * sstep(1.4, 1.12, a), ao = Math.abs(o);
        let k = 1.0 - 0.2 * trk + 0.05 * sstep(0.45, 0.18, a);
        const outer = Math.sign(o) === -Math.sign(T.k[i]) ? sstep(1 / 400, 1 / 40, Math.abs(T.k[i])) : 0;   // on the outside of a bend the loose gravel thrown out
        k += (0.06 + 0.08 * outer) * sstep(w - 1.2 - 1.2 * outer, w - 0.3, ao) * (1 - trk);
        k *= 0.94 + 0.12 * P.n2(T.px[i] * 0.7 + 50, T.pz[i] * 0.7);
        return [grav[0] * k, grav[1] * k, grav[2] * k]; };
      const wht = [0.95, 0.95, 0.92], ylw = [0.96, 0.76, 0.16], gc = [0.84, 0.7, 0.58];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (k === 4) return caGCol(x, z);
          const sl = k === 2 ? caSlope(x, z) : 0, l = Math.sqrt(1 + sl * sl); return mkCol(x, z, T.hy[i] + y, 1 / l, 0, Math.max(0, o - bar)).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), gg = new GB(true), gl = new GB(), gs = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1;
          if (paved[i] && paved[j]) {
            const v0 = i * T.ds / tileL, v1 = j * T.ds / tileL;
            for (let c = 0; c < offsA.length - 1; c++) { const o0 = offsA[c], o1 = offsA[c + 1];
              gr.quadUp(Pt(i, o0, 0.02), Pt(i, o1, 0.02), Pt(j, o1, 0.02), Pt(j, o0, 0.02), [shadeA(i, o0), shadeA(i, o1), shadeA(j, o1), shadeA(j, o0)], [[(o0 + w) / tileL, v0], [(o1 + w) / tileL, v0], [(o1 + w) / tileL, v1], [(o0 + w) / tileL, v1]]); }
            for (const [o0, o1] of [[-(w - 0.25), -(w - 0.38)], [w - 0.38, w - 0.25]]) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [wht, wht, wht, wht]);
            for (const [o0, o1] of [[-0.2, -0.09], [0.09, 0.2]]) gl.quadUp(Pt(i, o0, 0.036), Pt(i, o1, 0.036), Pt(j, o1, 0.036), Pt(j, o0, 0.036), [ylw, ylw, ylw, ylw]);
          } else {
            const v0 = i * T.ds / tileG, v1 = j * T.ds / tileG, oi = colsG(i), oj = colsG(j);
            for (let c = 0; c < oi.length - 1; c++) { const a0 = oi[c], a1 = oi[c + 1], b0 = oj[c], b1 = oj[c + 1];
              gg.quadUp(Pt(i, a0, 0.02), Pt(i, a1, 0.02), Pt(j, b1, 0.02), Pt(j, b0, 0.02), [shadeG(i, a0), shadeG(i, a1), shadeG(j, b1), shadeG(j, b0)], [[(a0 + w) / tileG, v0], [(a1 + w) / tileG, v0], [(b1 + w) / tileG, v1], [(b0 + w) / tileG, v1]]); }
          }
          const s0 = i * T.ds / 6, s1 = j * T.ds / 6;
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j];
            gs.quadUp(Pt(i, side * w, 0.012), Pt(i, side * (w + sw), -0.02), Pt(j, side * (w + sw), -0.02), Pt(j, side * w, 0.012), [gc, gc, gc, gc], [[0, s0], [sw / 4, s0], [sw / 4, s1], [0, s1]]);
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
        }
        addM(gr, aMat); addM(gg, sMat); addM(gl, lMat); addM(gs, sMat); addM(gv, gMat);
      }
      // white lines across the road at the start, the finish and each checkpoint
      const gw = new GB();
      for (const [s0, hw] of [[sStart, 0.4], [sFin, 0.4]].concat(T.cpS.map(s => [s, 0.22]))) { const a = atSf(s0 - hw, -w + 0.1), b = atSf(s0 - hw, w - 0.1), c = atSf(s0 + hw, w - 0.1), d = atSf(s0 + hw, -w + 0.1), y = (p) => T.hy[p[3]] + 0.042;
        gw.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [wht, wht, wht, wht]); }
      addM(gw, lMat);
    }

    /* ---- scenery (vertex coloured, 110 m chunks) ---- */
    const scen = new Chunks(110), ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];   // (ban: the boards, ban2: the road signs)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const shirts = [[0.84, 0.12, 0.12], [0.95, 0.95, 0.95], [0.12, 0.24, 0.6], [0.9, 0.62, 0.2], [0.3, 0.5, 0.3], [0.2, 0.2, 0.22], [0.55, 0.75, 0.9], [0.7, 0.3, 0.2]];
    const CR = crowdCtx({ gH: caGround, near: (x, z) => vrNear(x, z).dd, excluded, maxSlope: 0.6, water: () => false, shirts }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const board = (k) => { const v1 = 1 - Math.floor(k / 2) / 4; return [v1 - 1 / 4, v1, (k % 2) * 0.5, (k % 2) * 0.5 + 0.5]; };   // a road sign of the second atlas: [v0, v1, u0, u1]
    const sign = (s, side, k, facing, h) => {   // a road sign on a post beside the road, facing the cars coming up (facing 1) or down (-1)
      const [bx, bz, bi] = onSide(s, side, 1.2); if (excluded(bx, bz)) return; const by = caGround(bx, bz), [v0, v1, u0, u1] = board(k);
      box(scen.get(bx, bz), bx, by - 0.2, bz, 0.1, (h || 2.2) + 0.5, 0.1, T.hd[bi], [0.6, 0.61, 0.63]);
      bannerQ(bx, by + (h || 2.2) - 0.3, bz, -T.tx[bi] * facing, -T.tz[bi] * facing, 2.6, 0.65, v0, v1, u0, u1, ban2); exclPush(bx, bz, 1.5); CR.avoid(bx, bz, 0.8);
    };
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road: two posts at the barriers, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = T.bl[i] + 0.9, L2 = T.br[i] + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 11.2, 1.4, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, col) => crowdPut(CR, x, caGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: col || shirts[Math.floor(R() * shirts.length)] }, 1);
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- the start (on the valley floor past the junction): a gantry with the start lights, a timing hut; the finish on the mesa: a chequered
       gantry, a brown board with the altitude; the checkpoints: gantries "CPn  altitude" ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i], g = scen.get(x, z);
      box(g, x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 6, -1, 3.2), hy = caGround(hx, hz), gh = scen.get(hx, hz);   // the timing hut
      box(gh, hx, hy, hz, 4.0, 2.7, 2.8, T.hd[i], [0.9, 0.86, 0.78], [0.5, 0.3, 0.2], true); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.3, 0.42], null, true); gable(gh, hx, hy + 2.7, hz, 4.4, 3.2, 1.1, T.hd[i], [0.5, 0.26, 0.18], [0.9, 0.86, 0.78]);
      exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]);
      for (let k = 0; k < 8; k++) { const [px, pz] = onSide(sStart - 30 + k * 6, k % 2 ? 1 : -1, 2 + R() * 4); if (vrNear(px, pz).dd < 1 || excluded(px, pz)) continue; person(px, pz, R() * TAU); }
    }
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.5, 0.22, 0.12]));
    {
      arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      const [sx, sz, si] = onSide(sFin + 20, 1, 3), sy = caGround(sx, sz), gs = scen.get(sx, sz), W2 = 6, H2 = W2 / 8;   // the brown board on two posts
      for (const o of [-2.4, 2.4]) { const px = sx + T.nx[si] * o, pz = sz + T.nz[si] * o; box(gs, px, sy - 0.2, pz, 0.24, 2.4, 0.24, T.hd[si], [0.36, 0.24, 0.14]); }
      { const [v0, v1] = row(6); bannerQ(sx, sy + 1.2, sz, -T.tx[si], -T.tz[si], W2, H2, v0, v1); }
      exclPush(sx, sz, 5);
      for (let k = 0; k < 10; k++) { const [px, pz] = onSide(sFin - 40 + k * 8, k % 2 ? 1 : -1, 2 + R() * 5); if (vrNear(px, pz).dd < 1 || excluded(px, pz)) continue; person(px, pz, R() * TAU); }
    }

    /* ---- the road signs: the valley's name at the start, the gravel and its speed limit at the foot of the cliff, the switchbacks, the viewpoint,
       the mesa's name on the rim and the way back down to Mexican Hat ---- */
    {
      const g0 = def.paved && def.paved[0] ? def.paved[0][1] : 1400, g1 = def.paved && def.paved[1] ? def.paved[1][0] : 4700;
      sign(sStart + 40, -1, 5, -1); sign(sStart + 60, 1, 7, -1);
      sign(sStart + g0 - 160, 1, 3, 1); sign(sStart + g0 - 90, 1, 0, 1); sign(sStart + g0 + 30, 1, 2, 1); sign(sStart + g0 + 60, -1, 6, -1);
      sign(sStart + vs[0] - 120, 1, 1, 1);
      sign(sStart + g1 + 40, 1, 4, 1); sign(sStart + g1 - 50, -1, 0, -1);
    }

    /* ---- the viewpoint: a gravel plot beside the road, a low wall of sandstone blocks along its edge, a board, two parked cars, people looking out
       over the valley ---- */
    {
      const g = scen.get(padV.x, padV.z), i = padV.i, ox = T.nx[i] * vsd, oz = T.nz[i] * vsd, hy = padV.h;
      for (let a = -8; a <= 8; a += 1.6) { const bx = padV.x + ox * 9 + T.tx[i] * a, bz = padV.z + oz * 9 + T.tz[i] * a; rock(g, bx, hy + 0.25, bz, 0.8, 0.45, 0.6, T.hd[i] + R() * 0.3, vary([0.8, 0.6, 0.45], R, 0.12), R, 0.2, true); }
      for (const a of [-8.5, 8.5]) for (let o = 1; o < 9; o += 1.6) { const bx = padV.x + ox * o + T.tx[i] * a, bz = padV.z + oz * o + T.tz[i] * a; rock(g, bx, hy + 0.25, bz, 0.7, 0.42, 0.6, T.hd[i] + PI / 2, vary([0.8, 0.6, 0.45], R, 0.12), R, 0.2, true); }
      { const bx = padV.x + ox * 7 - T.tx[i] * 4, bz = padV.z + oz * 7 - T.tz[i] * 4, [v0, v1, u0, u1] = board(1);   // the board, facing the plot
        for (const o of [-1.1, 1.1]) box(g, bx + T.tx[i] * o, hy - 0.2, bz + T.tz[i] * o, 0.12, 1.6, 0.12, T.hd[i], [0.36, 0.24, 0.14]);
        bannerQ(bx, hy + 0.9, bz, -ox, -oz, 2.6, 0.65, v0, v1, u0, u1, ban2, -0.3); }
      for (const [a, o, c] of [[-4, 2.5, [0.72, 0.12, 0.1]], [2, 3, [0.85, 0.85, 0.83]]]) caCar(g, padV.x + T.tx[i] * a + ox * o, hy, padV.z + T.tz[i] * a + oz * o, T.hd[i] + PI / 2, c);
      for (let k = 0; k < 7; k++) { const a = (R() - 0.5) * 12, o = 6.5 + R() * 1.6, px = padV.x + T.tx[i] * a + ox * o, pz = padV.z + T.tz[i] * a + oz * o; person(px, pz, Math.atan2(oz, ox) - PI / 2 + (R() - 0.5) * 0.8); }
    }

    /* ---- no guardrails on most of the road (as on the real one): where the ground falls away past the barrier line a low berm of gravel along
       the edge, steel only round the outside of the switchbacks; a marker post every ~50 m where there is neither (knockable: caProps), chevrons
       on the outside of each switchback ---- */
    let nRail = 0, nBerm = 0;
    {
      const mkPosts = [], drop = [new Uint8Array(N), new Uint8Array(N)], hp = [new Uint8Array(N), new Uint8Array(N)];
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];
        for (const d of [4, 8, 13, 19, 26]) { const o = side * (bar + d);
          if (caGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { drop[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) drop[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      for (const [d, , turn] of def.curves || []) { const sd = -turn > 0 ? 1 : 0; for (let s = sStart + d - 22; s <= sStart + d + 22; s += T.ds / 2) hp[sd][T.idx(s)] = 1; }
      const iS0 = T.idx(sStart + 30), iS1 = T.idx(sFin - 30), steel = [0.8, 0.82, 0.84], steelB = [0.56, 0.58, 0.6], postC = [0.48, 0.49, 0.52], berm = [0.74, 0.58, 0.46];
      for (const side of [-1, 1]) {
        const sd = side > 0 ? 1 : 0, dr = drop[sd], rail = hp[sd], bar = side > 0 ? T.br : T.bl;
        for (let i = 1, last = -1; i < N; i++) { if (dr[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) dr[k] = 1; last = i; } }
        for (let i = 0; i < N; i++) { if (i < iS0 || i > iS1 || (side * T.k[i] > 0 && Math.abs(T.k[i]) * (bar[i] + 1.5) > 0.5)) { dr[i] = 0; rail[i] = 0; } if (!dr[i]) rail[i] = 0; }   // (none on the inside of a bend tighter than its barrier line can follow)
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          const g = scen.get(T.px[i], T.pz[i]);
          if (rail[i] && rail[i + 1]) {   // W-beam: a front and a back face, a post every 4 m
            const a = Q(i, 0.45), b = Q(i + 1, 0.45), c = Q(i + 1, 0.8), d = Q(i, 0.8), ins = Q(i, 0.6, 3), ino = Q(i, 0.6, -3);
            g.quadO(a, b, c, d, steel, ins); g.quadO(a, b, c, d, steelB, ino); nRail++;
            if (i % 2 === 0) { const p = Q(i, -0.35, 0.14); box(g, p[0], p[1], p[2], 0.13, 1.13, 0.13, T.hd[i], postC, null, true); }
          } else if (dr[i] && dr[i + 1]) {   // the berm: a low ridge of gravel, its crest at the barrier line
            const k = 0.92 + 0.12 * rpHash(i >> 2, 71 + sd), cc = [berm[0] * k, berm[1] * k, berm[2] * k], cd = [berm[0] * k * 0.82, berm[1] * k * 0.82, berm[2] * k * 0.82];
            const a0 = Q(i, -0.05, -1.1), b0 = Q(i + 1, -0.05, -1.1), a1 = Q(i, 0.42, -0.1), b1 = Q(i + 1, 0.42, -0.1), a2 = Q(i, -0.35, 0.7), b2 = Q(i + 1, -0.35, 0.7), inn = Q(i, -1.5, -0.2);
            g.quadO(a0, b0, b1, a1, cc, inn); g.quadO(a1, b1, b2, a2, cd, inn); nBerm++;
          } else if (!dr[i] && i % 25 === 0 && i > 2 && i < N - 3) mkPosts.push([i, side]);
        }
      }
      const kp = caProps(out, mkPosts, (i, side) => vp[side > 0 ? 1 : 0][i]).spots;
      for (const sp of mkPosts) { if (kp.has(sp)) continue;
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]);
        box(g, p[0], p[1] - 0.2, p[2], 0.13, 1.2, 0.13, T.hd[i], [0.94, 0.94, 0.92], null, true); box(g, p[0], p[1] + 0.72, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.1, 0.1, 0.1], null, true);
      }
      (def.curves || []).forEach(([d, , turn]) => {   // the chevrons
        const out_ = -turn, [v0, v1] = row(7), u0 = turn > 0 ? 0 : 1 / 8;
        for (const o of [-14, 0, 14]) { const [cx, cz, ci] = onSide(sStart + d + o, out_, 0.7); if (excluded(cx, cz)) continue;
          const cy = caGround(cx, cz), g = scen.get(cx, cz), fx = T.px[ci] - cx, fz = T.pz[ci] - cz, fl = Math.hypot(fx, fz) || 1, tx = -T.tx[ci] * 0.75 + fx / fl * 0.25, tz = -T.tz[ci] * 0.75 + fz / fl * 0.25, tl = Math.hypot(tx, tz);
          box(g, cx, Math.max(cy, T.hy[ci] - 0.5) - 0.2, cz, 0.08, 1.5, 0.08, T.hd[ci], [0.6, 0.61, 0.63]);
          bannerQ(cx, Math.max(cy, T.hy[ci] - 0.5) + 0.75, cz, tx / tl, tz / tl, 0.7, 0.7, v0, v1, u0, u0 + 1 / 8); CR.avoid(cx, cz, 0.6); }
      });
    }

    /* ---- the buttes and spires of the valley floor (def.buttes) ---- */
    {
      const RB = rng(3921);
      for (const [x, z, r, hh] of def.buttes || []) { mkButte(scen.get(x, z), x, caGround(x, z) - 1.5, z, r, hh, RB); exclPush(x, z, r * 2.3); }
    }

    /* ---- spectators: at the start and the finish, the checkpoints, the switchbacks (inside, where there is room), the viewpoint ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
      const M = { first: 2.4, gap: 1.05, below: 1.2, maxSlope: 0.55, excluded: hard, sit: 0.3, flag: 0.08, keepBar: 1.4 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 50, sStart + 40, sd, { rows: 2, dens: 0.5, label: 'MK start' }); run(sFin - 50, sFin + 14, sd, { rows: 2, dens: 0.5, label: 'MK finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 20, s0 + 16, side, { rows: 1, dens: 0.45, label: 'MK cp' }); });
      (def.curves || []).forEach(([d, , turn]) => run(sStart + d - 18, sStart + d + 18, turn, { rows: 2, dens: 0.4, clump: 0.8, label: 'MK switchback' }));
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);

    /* ---- the plants (instanced per 96 m chunk): on the valley floor sagebrush and bunch grass, a juniper here and there; on the talus slopes fallen
       blocks of sandstone, junipers in the gullies; on the mesa top the pinyon and juniper woodland over sagebrush; the scree's stones beside the road ---- */
    const pMat = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut);
    const wMat = tuftWindMat(out.dyn.wind || (out.dyn.wind = { value: 0 })), wB = wMat.onBeforeCompile; ouCutMat(wMat, cut);
    { const cB = wMat.onBeforeCompile; wMat.onBeforeCompile = (sh) => { wB(sh); cB(sh); }; wMat.customProgramCacheKey = () => 'tuftWindCut'; wMat.side = THREE.FrontSide; }
    const pk = [mkPlantGeo(0), mkPlantGeo(1), mkPlantGeo(2), caPlantGeo(0), caPlantGeo(3), caPlantGeo(4)].map((geo, k) => new IChunks(geo, k === 3 ? wMat : pMat, k === 5 ? 64 : 96));
    let nPlants = 0;
    {
      const G = P.G, Lt = VRC * VRT, maxT = Math.round(60000 * dens), RT = rng(3961), SP = 3.6 / Math.sqrt(dens);
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = vrDist(x, z); if (hd > LOD.radius(230)) continue;   // (LOD: a shorter plant/tree draw distance on the lower tiers)
          if (hd > LOD.radius(70) && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;   // (farther out every other spot)
          const y0 = caGround(x, z), A = y0 + base, sl = caSlope(x, z), top = A > 1925, slope = sl > 0.32;
          let kind = -1;
          if (top && !slope) kind = r1 < 0.05 ? 0 : r1 < 0.075 ? 1 : r1 < 0.2 ? 2 : r1 < 0.24 ? 3 : -1;
          else if (slope) kind = r1 < 0.05 ? 4 : r1 < 0.068 ? 0 : r1 < 0.1 ? 2 : -1;
          else kind = r1 < 0.11 ? 2 : r1 < 0.17 ? 3 : r1 < 0.176 ? 0 : r1 < 0.19 ? 4 : -1;
          if (kind < 0 || sl > (kind === 4 ? 1.2 : 0.9)) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 1.6) continue;
          if (excluded(x, z)) continue;
          if (kind === 0) pk[0].add(x, y0 - 0.1, z, r2 * TAU, 2.6 + r3 * 2.6, 2.4 + r4 * 2.8, [0.9 + r2 * 0.2, 0.92 + r3 * 0.14, 0.92 + r4 * 0.12]);
          else if (kind === 1) pk[1].add(x, y0 - 0.1, z, r2 * TAU, 2.8 + r3 * 2.2, 3.0 + r4 * 2.6, [0.9 + r2 * 0.18, 0.94 + r3 * 0.12, 0.9]);
          else if (kind === 2) pk[2].add(x, y0 - 0.08, z, r2 * TAU, 0.6 + r3 * 0.8, 0.5 + r4 * 0.5, [0.92 + r2 * 0.14, 0.95 + r3 * 0.1, 0.95 + r4 * 0.1]);
          else if (kind === 3) pk[3].add(x, y0 - 0.05, z, r2 * TAU, 0.5 + r3 * 0.5, 0.4 + r4 * 0.4, [1.0 + r2 * 0.12, 0.92 + r3 * 0.1, 0.82 + r4 * 0.1]);
          else { const k = 0.85 + r3 * 0.3, rc = r2 < 0.5 ? [1.2, 0.86, 0.68] : r2 < 0.8 ? [1.18, 0.96, 0.78] : [1.25, 1.12, 0.95]; pk[4].add(x, y0 - 0.2, z, r4 * TAU, 0.8 + r3 * 2.2, 0.6 + r4 * 1.6, [rc[0] * k, rc[1] * k, rc[2] * k]); }
          if (++nPlants >= maxT) break grid;
        }
      }
    }
    {   // the stones beside the road, thickest at its edge, thinning out over ~40 m
      const RS = rng(3967), maxS = Math.round(18000 * dens); let nS = 0;
      edge: for (let s = 12; s < T.len - 12; s += 1.1 / dens) for (const side of [-1, 1]) {
        const o = 1.7 + Math.pow(RS(), 2) * 40, [x, z] = onSide(s, side, o), r1 = RS(), r2 = RS(), r3 = RS();
        if (vrNear(x, z).dd < 1.2 || excluded(x, z)) continue;
        const y0 = caGround(x, z), sl = caSlope(x, z); if (sl > 1.15) continue;
        const k = 0.84 + r3 * 0.28, sc = 0.85 + r1 * 1.2 - 0.006 * o; pk[5].add(x, y0 - 0.04, z, r2 * TAU, sc, sc * (0.8 + r3 * 0.5), [k * 1.2, k * 0.9, k * 0.74]);
        if (++nS >= maxS) break edge;
      }
    }
    for (const t of pk) t.addTo(root, false);

    /* ---- fallen blocks of sandstone at the foot of the cuts and out on the talus, crags where the slope rises steep beside the road ---- */
    {
      const RV = rng(3971), rockC = [[0.78, 0.5, 0.36], [0.7, 0.4, 0.3], [0.86, 0.74, 0.58], [0.8, 0.58, 0.4], [0.62, 0.4, 0.32]];
      for (let s = 10; s < T.len - 10; s += 6) for (const side of [-1, 1]) {
        if (RV() > 0.34) continue;
        const o = 1.6 + Math.pow(RV(), 1.5) * 40, [x, z] = onSide(s, side, o), sz = 0.4 + RV() * 1.4; if (vrNear(x, z).dd < sz + 0.6 || excluded(x, z) || vrDist(x, z) > LOD.cap(90)) continue;
        const y = caGround(x, z), sl = caSlope(x, z); if (sl < 0.25 && RV() < 0.6) continue;
        rock(scen.get(x, z), x, y + sz * 0.3, z, sz * 1.3, sz, sz, RV() * TAU, vary(rockC[Math.floor(RV() * rockC.length)], RV, 0.12), RV, 0.25, RV() < 0.5);
      }
      for (let s = 16; s < T.len - 16; s += 14) for (const side of [-1, 1]) {   // crags: ledges of the cliff where the slope is steep
        if (RV() < 0.35) continue;
        const [x, z] = onSide(s, side, 6 + RV() * 70); if (excluded(x, z) || vrNear(x, z).dd < 6 || vrDist(x, z) > LOD.cap(90)) continue;
        const sl = caSlope(x, z); if (sl < 0.75) continue;
        const y = caGround(x, z), g = scen.get(x, z), n = 2 + Math.floor(RV() * 3), A = y + base, b0 = A > 1880 ? [0.86, 0.76, 0.6] : A > 1720 ? [0.78, 0.48, 0.32] : [0.6, 0.36, 0.28];
        for (let q = 0; q < n; q++) { const r0 = 2 + RV() * 4, qx = x + (RV() - 0.5) * 9, qz = z + (RV() - 0.5) * 9, qy = caGround(qx, qz); if (vrNear(qx, qz).dd < r0 + 1) continue;
          rock(g, qx, qy + r0 * 0.35, qz, r0 * 1.2, r0 * (0.6 + RV() * 0.5), r0 * (0.7 + RV() * 0.4), RV() * TAU, vary(b0, RV, 0.1), RV, 0.3, true); }
      }
    }

    /* ---- finish the meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: mkAtlas(cpAlt, fmtAlt(T.altAt(T.hy[T.finishIdx]))), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: mkAtlas2(), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    crowdFinish(CR, root, out);
    out.stats = { plants: nPlants, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, rails: +(nRail / (2 * N)).toFixed(3), berm: +(nBerm / (2 * N)).toFixed(3), buttes: (def.buttes || []).length };   // (read by the tests)
    return out;
  }

  World.ext.moki = (scene, tex, opts) => buildMoki(scene, tex, opts);
})();
