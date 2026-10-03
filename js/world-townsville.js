/* World of the Townsville street circuit (theme 'townsville'), built in a file of its own: World.ext.townsville(scene, tex, opts, api), called by
   World.build for this theme (api: the shared helpers of world.js, see extAPI there). Reid Park and the streets beside it in tropical North
   Queensland on a race afternoon: the real ground (def.tsv.g: Copernicus DEM), the land cover (def.tsv.lc: ESA WorldCover under OpenStreetMap's
   parks, pitches, car parks, water and railways), the streets with their kerbs, footpaths and white lines, the buildings in their real
   outlines and heights (def.tsv.bld: houses on stilts with metal roofs, shops, the towers of the city centre), palms, figs and mangroves,
   Ross Creek and the sea, the railway by the station, the power poles along the streets; Castle Hill, the ranges and Magnetic Island on the
   horizon (def.tsv.far), all from OpenStreetMap and the open models. The circuit: concrete blocks with catch fences, set back into the mouths
   of the side roads at the junctions, whose corners keep the city's street furniture (traffic signals on their posts and on mast arms over
   the big junction, their controllers' cabinets, give way and keep left signs, bollards, bins, street lights): all of it loose props the cars
   knock over (Core's PROPK). The seasons are the tropics' (out.ownSeason): green in the wet season (summer, autumn), dry and golden in the dry
   season (winter, spring), never snow. No names of events, sponsors or firms anywhere: the banners name the city, the state and the country. */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.ext) return;
  World.ext.townsville = function (scene, tex, opts, W) {
    const { T, GB, RB, Chunks, IChunks, box, cyl, cone, puff, vary, rng, clamp, lerp, sstep, TAU, atSf, crAt, inPoly, crowdCtx, crowdRun, crowdFinish, crowdUV,
      waterMat, shoreBand, waterline, addShore } = W;
    const R = rng(4810), N = T.N, ds = T.ds, def = T.def, D = def.tsv, L = T.len, sStart = T.startS, w = T.w, WA = T.wa || new Float64Array(N).fill(w);
    const season = opts && opts.season ? opts.season : 'summer', WET = season === 'summer' || season === 'autumn';   // (the wet season greens the town; the dry season browns it)
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, props: [], ownTex: [], farClip: true, propR: 170, winMaps: [], ownSeason: true, season: WET ? 'wet' : 'dry', paintFor: (s) => (s === 'summer' || s === 'autumn' ? 'wet' : 'dry') };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    const dS = (s) => { let d = s - sStart; d = ((d % L) + L) % L; return d > L / 2 ? d - L : d; };   // metres from the start line (-L/2 .. L/2)
    const sAt = (d) => (((sStart + d) % L) + L) % L;
    const i16 = (b) => { const s = atob(b), n = s.length >> 1, a = new Int16Array(n); for (let k = 0; k < n; k++) { const v = s.charCodeAt(2 * k) | (s.charCodeAt(2 * k + 1) << 8); a[k] = v > 32767 ? v - 65536 : v; } return a; };

    /* ---- the data: the ground's heights (16 m cells), the land cover (6 m cells, run-length coded) ---- */
    const GD = D.g, GZ = (() => { const b = atob(GD.b64), a = new Float32Array(b.length); for (let k = 0; k < b.length; k++) a[k] = GD.lo + b.charCodeAt(k) * GD.step; return a; })();
    const demH = (x, z) => { const gx = clamp((x - GD.x0) / GD.cell, 0, GD.nx - 1.001), gz = clamp((z - GD.z0) / GD.cell, 0, GD.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, n = GD.nx;
      return (GZ[j * n + i] * (1 - u) + GZ[j * n + i + 1] * u) * (1 - v) + (GZ[(j + 1) * n + i] * (1 - u) + GZ[(j + 1) * n + i + 1] * u) * v; };
    const LCD = D.lc, LCA = (() => { const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', dg = new Int8Array(128); for (let k = 0; k < 64; k++) dg[A.charCodeAt(k)] = k;
      const s = LCD.rle, a = new Uint8Array(LCD.nx * LCD.nz); let p = 0, k = 0;
      while (k < s.length && p < a.length) { const c = dg[s.charCodeAt(k++)], cl = c >> 3; let r = (c & 7) + 1; if (r === 8) { for (;;) { const d = dg[s.charCodeAt(k++)]; r += d; if (d < 63) break; } } a.fill(cl, p, p + r); p += r; }
      return a; })();
    const lcAt = (x, z) => { const i = Math.floor((x - LCD.x0) / LCD.cell), j = Math.floor((z - LCD.z0) / LCD.cell); return i < 0 || j < 0 || i >= LCD.nx || j >= LCD.nz ? 0 : LCA[j * LCD.nx + i]; };
    const WY = -2.7;   // the water (Ross Creek at mid tide, the sea) above the start line (3.2 m a.s.l. in the model)
    const inWater = (x, z) => lcAt(x, z) === 3;

    /* ---- the nearest sample of the circuit (an 8 m hash of the samples): i, the signed offset lat (+ right), dd = metres past the asphalt's edge ---- */
    const NH = new Map(), NHC = 8;
    for (let i = 0; i < N; i++) { const k = Math.floor(T.px[i] / NHC) * 4096 + Math.floor(T.pz[i] / NHC); let Lc = NH.get(k); if (!Lc) NH.set(k, Lc = []); Lc.push(i); }
    const NQ = { i: -1, lat: 0, dd: 1e9, d2: 1e18 };
    const near = (x, z, rad) => {
      const r = Math.ceil((rad || 40) / NHC), cx = Math.floor(x / NHC), cz = Math.floor(z / NHC); let bi = -1, bd = 1e18;
      for (let a = cx - r; a <= cx + r; a++) for (let b = cz - r; b <= cz + r; b++) { const Lc = NH.get(a * 4096 + b); if (Lc) for (const i of Lc) { const dx = x - T.px[i], dz = z - T.pz[i], d = dx * dx + dz * dz; if (d < bd) { bd = d; bi = i; } } }
      NQ.i = bi; NQ.d2 = bd; if (bi < 0) { NQ.lat = 0; NQ.dd = 1e9; return NQ; }
      NQ.lat = (x - T.px[bi]) * T.nx[bi] + (z - T.pz[bi]) * T.nz[bi]; NQ.dd = Math.abs(NQ.lat) - WA[bi]; return NQ; };
    const barO = (i, sd) => (sd > 0 ? T.br[i] : T.bl[i]);

    /* ---- the ground: the real terrain, level with the circuit to its barriers and blended out over 30 m; the beds of the creek and the sea ---- */
    const groundH = (x, z) => {
      let h = demH(x, z); const q = near(x, z, 40);
      if (q.i >= 0) { const bar = barO(q.i, q.lat > 0 ? 1 : -1), f = sstep(Math.max(4, bar - WA[q.i] + 1.5), 30, q.dd); h = lerp(T.hy[q.i] - 0.02, h, f); }
      return h;
    };
    out.groundH = groundH; out.camFloor = groundH;
    out.propFloor = (q) => groundH(q.x, q.z) - (T.hasElev ? T.elevAt(q.s).y : 0);   // (the props off the road: the ground's height)
    out.bounds = { minX: LCD.x0, maxX: LCD.x0 + LCD.nx * LCD.cell, minZ: LCD.z0, maxZ: LCD.z0 + LCD.nz * LCD.cell };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const addM = (g, mat, cast, grp) => { if (!g || g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; (grp || root).add(m); return m; };
    const gritTex = (() => { const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), img = g.createImageData(S, S), r = rng(77);
      for (let k = 0; k < S * S; k++) { const v = 200 + (r() - 0.5) * 46 + (r() < 0.04 ? -40 : 0); img.data[k * 4] = img.data[k * 4 + 1] = img.data[k * 4 + 2] = clamp(v, 0, 255); img.data[k * 4 + 3] = 255; }
      g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return ownTex(t); })();
    const noise = W.valueNoise2(31, 26), noise2 = W.valueNoise2(57, 90), noise3 = W.valueNoise2(91, 11);
    // land-cover colours: 0 the town's yards, 1 lawn, 2 lawn under trees, 3 creek bed, 4 sand and bare earth, 5 car park, 6 sports field, 7 ballast
    const LCC = WET ? [[0.5, 0.55, 0.36], [0.4, 0.56, 0.22], [0.31, 0.44, 0.19], [0.36, 0.36, 0.3], [0.78, 0.69, 0.52], [0.5, 0.52, 0.42], [0.32, 0.58, 0.22], [0.47, 0.43, 0.39]]
      : [[0.6, 0.58, 0.42], [0.66, 0.62, 0.36], [0.48, 0.47, 0.3], [0.38, 0.37, 0.31], [0.8, 0.7, 0.52], [0.58, 0.57, 0.46], [0.38, 0.58, 0.24], [0.47, 0.43, 0.39]];
    const gCol = (x, z) => {
      const c = [0, 0, 0]; let pitch = 0, grass = 0;
      for (const [ox, oz] of [[-3, -3], [3, -3], [-3, 3], [3, 3], [0, 0]]) { const k = lcAt(x + ox, z + oz), C = LCC[k]; c[0] += C[0] / 5; c[1] += C[1] / 5; c[2] += C[2] / 5; if (k === 6) pitch++; if (k === 1 || k === 0) grass++; }
      const n = 0.9 + noise(x, z) * 0.16 + (noise2(x, z) - 0.5) * 0.12, dry = grass ? (noise3(x, z) - 0.5) * (WET ? 0.18 : 0.3) + (noise(x * 2.3, z * 2.3) > 0.72 ? (WET ? 0.12 : 0.2) : 0) : 0;   // (patchy: the dry spots and the worn ones)
      if (pitch) { const st = (Math.floor((x * 0.6 + z * 0.8) / 7) & 1) ? 1.06 : 0.94; c[0] *= st; c[1] *= st; c[2] *= st; }   // (mown stripes on the fields)
      return [c[0] * n * (1 + dry), c[1] * n * (1 + dry * 0.6), c[2] * n];
    };
    const GC = 16, GX0 = LCD.x0, GZ0 = LCD.z0, GNX = Math.floor(LCD.nx * LCD.cell / GC) + 1, GNZ = Math.floor(LCD.nz * LCD.cell / GC) + 1, GY = new Float32Array(GNX * GNZ);
    for (let j = 0; j < GNZ; j++) for (let i = 0; i < GNX; i++) {
      const x = GX0 + i * GC, z = GZ0 + j * GC; let y = groundH(x, z), wet = 0;
      for (const [ox, oz] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) if (inWater(x + ox, z + oz)) wet++;
      const q = near(x, z, 20), onTrk = q.i >= 0 && q.dd < barO(q.i, q.lat > 0 ? 1 : -1) - WA[q.i] + 1;
      if (wet === 4) y = Math.min(y, WY - 1.6); else if (wet && !onTrk) y = Math.min(y, WY + 0.4 - wet * 0.45);   // (the creek's bed and its muddy banks; under a bridge too: the deck is the circuit's asphalt)
      GY[j * GNX + i] = y;
    }
    const gyAt = (i, j) => GY[clamp(j, 0, GNZ - 1) * GNX + clamp(i, 0, GNX - 1)];
    const gMat = new THREE.MeshLambertMaterial({ map: gritTex, vertexColors: true });
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const TILE = 384, stCh = new Map(), stG = (x, z, k) => { const TL = k === 'a' ? 768 : TILE, key = k + ':' + Math.floor((x - GX0) / TL) + ',' + Math.floor((z - GZ0) / TL); let g = stCh.get(key); if (!g) stCh.set(key, g = new RB(true)); return g; };
    {
      const TS = TILE / GC;
      for (let tj = 0; tj < GNZ - 1; tj += TS) for (let ti = 0; ti < GNX - 1; ti += TS) {
        const nx = Math.min(TS, GNX - 1 - ti) + 1, nz = Math.min(TS, GNZ - 1 - tj) + 1;
        const g = stG(GX0 + (ti + 1) * GC, GZ0 + (tj + 1) * GC, 'w'); let prev = -1;
        let far = true; for (let b = 0; b < nz && far; b += 4) for (let a = 0; a < nx; a += 4) { const q = near(GX0 + (ti + a) * GC, GZ0 + (tj + b) * GC, 200); if (q.i >= 0) { far = false; break; } }
        const st = far ? 2 : 1, cols0 = []; for (let a = 0; a < nx; a += st) cols0.push(a); if (cols0[cols0.length - 1] !== nx - 1) cols0.push(nx - 1);
        const rows0 = []; for (let b = nz - 1; b >= 0; b -= st) rows0.push(b); if (rows0[rows0.length - 1] !== 0) rows0.push(0);
        for (const b of rows0) { const pts = [], cols = [], uvs = [];
          for (const a of cols0) { const i = ti + a, j = tj + b, x = GX0 + i * GC, z = GZ0 + j * GC; pts.push([x, gyAt(i, j), z]); cols.push(gCol(x, z)); uvs.push([x / 7, -z / 7]); }
          const r = g.row(pts, cols, uvs); if (prev >= 0) g.link(prev, r, 0, cols0.length - 1); prev = r; }
      }
    }

    /* ---- the streets round the circuit (OpenStreetMap; kinds 0 road, 1 service, 2 footway, 3 cycleway, 5 pedestrian): asphalt with a kerb and a
       concrete footpath on the roads (cut where it would lie on another carriageway: the corners of the junctions), the paths in the park ---- */
    const ST = []; { const v = i16(D.st); let k = 0; while (k < v.length) { const kind = v[k], hw = v[k + 1] / 4, fl = v[k + 2], n = v[k + 3], P = []; for (let m = 0; m < n; m++) P.push([v[k + 4 + 2 * m] / 2, v[k + 5 + 2 * m] / 2]); k += 4 + 2 * n; ST.push({ k: ST.length, kind, hw, fl, P }); } }
    for (const S of ST) { S.sc = S.P.map(([x, z]) => { const q = near(x, z, 14); return S.kind !== 2 && S.kind !== 3 && q.i >= 0 && q.dd < 3; }); S.circ = false; }   // (the stretches the circuit runs on: its own surface stands for them)
    const SH = new Map(), SHC = 16;
    for (const S of ST) for (let m = 0; m + 1 < S.P.length; m++) { const [ax, az] = S.P[m], [bx, bz] = S.P[m + 1], r = S.hw + 1;
      for (let a = Math.floor((Math.min(ax, bx) - r) / SHC); a <= Math.floor((Math.max(ax, bx) + r) / SHC); a++) for (let b = Math.floor((Math.min(az, bz) - r) / SHC); b <= Math.floor((Math.max(az, bz) + r) / SHC); b++) {
        const key = a * 4096 + b; let Lc = SH.get(key); if (!Lc) SH.set(key, Lc = []); Lc.push(S.k, m); } }
    const segD = (x, z, ax, az, bx, bz) => { const vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1e-9), 0, 1); return Math.hypot(x - ax - vx * t, z - az - vz * t); };
    const CURB = 1.6;   // the circuit's own kerb line past the track's edge
    const onRoad = (x, z, self, pad) => {   // on a carriageway (not a path): another street's, or the circuit's (to its kerb line)
      const q = near(x, z, 14); if (q.i >= 0 && q.dd < CURB + (pad || 0)) return true;
      const Lc = SH.get(Math.floor(x / SHC) * 4096 + Math.floor(z / SHC)); if (!Lc) return false;
      for (let k = 0; k < Lc.length; k += 2) { const S = ST[Lc[k]], m = Lc[k + 1]; if (S.k === self || (S.sc[m] && S.sc[m + 1]) || S.kind === 2 || S.kind === 3) continue; const a = S.P[m], b = S.P[m + 1]; if (segD(x, z, a[0], a[1], b[0], b[1]) < S.hw + (pad || 0)) return true; }
      return false; };
    const streetAt = (x, z) => {   // the carriageway at (x, z) (not the circuit's): its direction, half width, height
      const Lc = SH.get(Math.floor(x / SHC) * 4096 + Math.floor(z / SHC)); if (!Lc) return null; let best = null, bd = 1e9;
      for (let k = 0; k < Lc.length; k += 2) { const S = ST[Lc[k]], m = Lc[k + 1]; if ((S.sc[m] && S.sc[m + 1]) || (S.kind !== 0 && S.kind !== 1)) continue; const a = S.P[m], b = S.P[m + 1], d = segD(x, z, a[0], a[1], b[0], b[1]); if (d < S.hw && d < bd) { bd = d; const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; best = { S, m, ux: (b[0] - a[0]) / l, uz: (b[1] - a[1]) / l, hw: S.hw, y: groundH(x, z) + 0.035 }; } }
      if (best) { const key = best.S.k * 4096 + best.m; best.used = usedLegs.has(key); usedLegs.add(key); } return best; };
    const usedLegs = new Set();
    const scen = new Chunks(512), scenN = new Chunks(700);   // vertex-coloured scenery: casting shadows, and the thin or low things not
    const wl = [0.95, 0.95, 0.92], yl = [0.96, 0.78, 0.15];
    const conc = [0.86, 0.85, 0.81], concK = [0.66, 0.65, 0.62], asph = [0.82, 0.82, 0.84], pathC = WET ? [0.82, 0.8, 0.74] : [0.84, 0.8, 0.72];
    let nStreet = 0, nHyd = 0; const stMarks = [], kerbCars = [];
    for (const S of ST) {
      if (S.circ) continue;
      const P = S.P, pts = [];
      for (let m = 0; m + 1 < P.length; m++) { const [ax, az] = P[m], [bx, bz] = P[m + 1], l = Math.hypot(bx - ax, bz - az), qa = near(ax, az, 60), st = qa.i >= 0 && qa.dd < 60 ? 3.5 : 9, n = Math.max(1, Math.ceil(l / st));
        for (let k = 0; k < n; k++) pts.push([ax + (bx - ax) * k / n, az + (bz - az) * k / n]); }
      pts.push(P[P.length - 1]); if (pts.length < 2) continue;
      const nr = pts.map((p, k) => { const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; });
      const road = S.kind === 0 || S.kind === 1, sw = S.kind === 0 ? 1.8 : 0, hw = S.hw;
      const yOff = S.kind === 0 ? 0.035 + Math.min(hw, 7) * 0.002 : S.kind === 1 ? 0.03 : 0.04;
      const col = S.kind === 2 || S.kind === 3 ? pathC : S.kind === 5 ? conc : asph, mat = road ? 'a' : 'w';
      let prev = -1, prevS = [-1, -1];
      const g = stG(pts[0][0], pts[0][1], mat), gs = stG(pts[0][0], pts[0][1], 'w');
      for (let k = 0; k < pts.length; k++) {
        const [x, z] = pts[k], [nx, nz] = nr[k];
        const q = near(x, z, 16), inC = q.i >= 0 && q.dd < Math.min(CURB - 0.2, barO(q.i, q.lat > 0 ? 1 : -1) - WA[q.i] + 0.4);   // (under the circuit's own asphalt: it covers the mouth; in the junctions' pockets the street goes on to the fence)
        const y = groundH(x, z) + yOff;
        if (inC) { prev = -1; prevS = [-1, -1]; continue; }
        const uv = (o) => [(x + nx * o) / 6, -(z + nz * o) / 6];
        const r = g.row([[x - nx * hw, y, z - nz * hw], [x + nx * hw, y, z + nz * hw]], [col, col], [uv(-hw), uv(hw)]);
        if (prev >= 0) g.link(prev, r, 0, 1); prev = r;
        if (sw) for (const sd of [-1, 1]) {   // the kerb (15 cm) and the footpath, cut where it would lie on another carriageway
          const o0 = hw, o1 = hw + 0.2, o2 = hw + 0.2 + sw, mx = x + nx * sd * (o1 + sw / 2), mz = z + nz * sd * (o1 + sw / 2), si = sd > 0 ? 1 : 0;
          if (onRoad(mx, mz, S.k, 0.2) || onRoad(x + nx * sd * (o2 - 0.2), z + nz * sd * (o2 - 0.2), S.k, 0)) { prevS[si] = -1; continue; }
          const yg = groundH(x + nx * sd * o2, z + nz * sd * o2), yt = Math.max(y + 0.15, yg + 0.03);
          let pp = [[x + nx * sd * o0, y - 0.01, z + nz * sd * o0], [x + nx * sd * o0, yt, z + nz * sd * o0], [x + nx * sd * o2, yt, z + nz * sd * o2]], cc = [concK, conc, conc];
          if (sd < 0) { pp = pp.reverse(); cc = cc.slice().reverse(); }
          const rs = gs.row(pp, cc, pp.map(p => [p[0] / 6, -p[2] / 6])); if (prevS[si] >= 0) gs.link(prevS[si], rs, 0, 2); prevS[si] = rs;
        }
      }
      // the lines (Australia: white): a broken centre line on the two-way roads, a continuous one into the junctions, edge lines on the wide ones
      if (S.kind === 0 && hw >= 3.4 && !(S.fl & 2)) { let acc = 0;
        for (let k = 0; k + 1 < pts.length; k++) { const [x, z] = pts[k], [x2, z2] = pts[k + 1], [nx, nz] = nr[k], l = Math.hypot(x2 - x, z2 - z), y = groundH(x, z) + yOff + 0.012, y2 = groundH(x2, z2) + yOff + 0.012; acc += l;
          const q = near(x, z, 16); if ((q.i >= 0 && q.dd < barO(q.i, q.lat > 0 ? 1 : -1) - WA[q.i] + 3) || onRoad(x, z, S.k, 1) || onRoad(x2, z2, S.k, 1)) continue;
          const L4 = (o0, o1, c) => stMarks.push([[x + nx * o0, y, z + nz * o0], [x + nx * o1, y, z + nz * o1], [x2 + nx * o1, y2, z2 + nz * o1], [x2 + nx * o0, y2, z2 + nz * o0], c]);
          const nearJ = onRoad(x + (x2 - x) * 4 / l, z + (z2 - z) * 4 / l, S.k, 6) || onRoad(x - (x2 - x) * 4 / l, z - (z2 - z) * 4 / l, S.k, 6);
          if (hw > 4.2 && (nearJ || Math.floor(acc / 3) % 3 === 0)) L4(-0.06, 0.06, wl);
          if (hw >= 6) for (const o of [-hw + 0.3, hw - 0.42]) L4(o, o + 0.12, wl);
          if (hw >= 4 && hw < 6 && R() < l / 22 && !nearJ) { const f = R(), sd = R() < 0.5 ? -1 : 1; kerbCars.push([x + (x2 - x) * f + nx * sd * (hw - 1.15), y - 0.012, z + (z2 - z) * f + nz * sd * (hw - 1.15), -Math.atan2(z2 - z, x2 - x) + (sd < 0 ? Math.PI : 0)]); } } }
      // the fire hydrants (in Queensland under the footpath's lid): a blue reflector on the road's centre line, a white marker post with a blue
      // plate at the kerb, every ~90 m on the streets
      if (S.kind === 0 && hw >= 3 && !(S.fl & 2)) { let acc = 30 + R() * 40;
        for (let k = 0; k + 1 < pts.length; k++) { const [x, z] = pts[k], [x2, z2] = pts[k + 1], [nx, nz] = nr[k], l = Math.hypot(x2 - x, z2 - z); acc += l; if (acc < 90) continue; acc = 0;
          const q = near(x, z, 20); if (q.i >= 0 && q.dd < barO(q.i, q.lat > 0 ? 1 : -1) - WA[q.i] + 3) continue;
          const y = groundH(x, z) + yOff, bl = [0.15, 0.35, 0.85]; stMarks.push([[x - 0.12, y + 0.02, z - 0.12], [x + 0.12, y + 0.02, z - 0.12], [x + 0.12, y + 0.02, z + 0.12], [x - 0.12, y + 0.02, z + 0.12], bl]);
          const sd = k % 2 ? 1 : -1, px = x + nx * sd * (hw + 0.8), pz = z + nz * sd * (hw + 0.8), g = scenN.get(px, pz), gy = groundH(px, pz); if (onRoad(px, pz, S.k, 0.1)) continue;
          box(g, px, gy, pz, 0.08, 0.95, 0.08, 0, [0.94, 0.94, 0.92]); box(g, px, gy + 0.7, pz, 0.2, 0.22, 0.03, Math.atan2(nz, nx) + Math.PI / 2, bl); nHyd++; } }
      nStreet++;
    }

    /* ---- the circuit's surface: the asphalt out to the barriers, darker on the racing line; the old lines of the streets it runs on (Boundary
       Street's lanes and the line between its carriageways, Charters Towers Road's) faint under the rubber ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const pitAtI = (i) => (def.pit ? T.pitAt(i * ds) : null);
    const JP = [new Uint8Array(N), new Uint8Array(N)];   // (the samples in a junction's pocket, per side [left, right]: the corners there are the city's; a pocket without a road is a run-off: the circuit's asphalt)
    for (const [a, b, sd, off, e] of def.walls) { if (off < 6) continue; let road = false;
      for (let d = a; d <= b && !road; d += 1) { const i = T.idx(sAt(d)), p = Pt(i, sd * (WA[i] + CURB + 1.4), 0); if (onRoad(p[0], p[2], -1, 0)) road = true; }
      if (road) for (let d = a - (e || 20); d <= b + (e || 20); d += ds / 2) JP[sd > 0 ? 1 : 0][T.idx(sAt(d))] = 1; }
    {
      const CH = 192;
      for (let c0 = 0; c0 < N; c0 += CH) {
        const i0 = c0 % N, ga = stG(T.px[i0], T.pz[i0], 'a'); let pa = -1;
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
          const i = ii % N, wi = WA[i], rl = T.rl[i], v = ii * ds / 8;
          const eo = (sd) => { const b = barO(i, sd); return b - wi > 3.2 && JP[sd > 0 ? 1 : 0][i] ? wi + CURB : Math.max(b + 0.5, wi + CURB); }, oL = -eo(-1), oR = eo(1);   // (a junction's pocket: the circuit's asphalt to its kerb line, the corner beyond)
          const offs = [oL, -wi, -wi * 0.45, 0, wi * 0.45, wi, oR];
          const sh = (o) => { let k = 0.88 - 0.16 * Math.exp(-((o - rl) * (o - rl)) / 5); if (Math.abs(o) > wi) k = 0.94; return [k, k, k * 1.01]; };
          const r = ga.row(offs.map(o => Pt(i, o, 0.02)), offs.map(sh), offs.map(o => [(o + 20) / 8, v])); if (pa >= 0) ga.link(pa, r, 0, offs.length - 1); pa = r;
        }
      }
    }
    {   // the corners of the junctions (the pockets of the barriers): the kerb (15 cm), the footpath or the islands' concrete to the fence
      const CH = 192;
      for (let c0 = 0; c0 < N; c0 += CH) { const i0 = c0 % N, gs = stG(T.px[i0], T.pz[i0], 'w'); const ps = [-1, -1];
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) { const i = ii % N, wi = WA[i];
          for (const sd of [-1, 1]) { const si = sd > 0 ? 1 : 0, b = barO(i, sd), o0 = wi + CURB, o2 = Math.min(b + 0.3, o0 + 3.4);
            if (b - wi <= 3.2 || !JP[si][i] || (sd > 0 && pitAtI(i))) { ps[si] = -1; continue; }
            const mid = Pt(i, sd * (o0 + 0.9), 0);
            const far2 = Pt(i, sd * (o2 - 0.3), 0); if ((onRoad(mid[0], mid[2], -1, 0.1) && !(near(mid[0], mid[2], 10).dd < CURB - 0.1)) || onRoad(far2[0], far2[2], -1, 0.1)) { ps[si] = -1; continue; }
            let pp = [Pt(i, sd * o0, 0.0), Pt(i, sd * o0, 0.15), Pt(i, sd * (o0 + 0.3), 0.15), Pt(i, sd * o2, 0.15)], cc = [concK, conc, conc, conc];
            if (sd < 0) { pp = pp.reverse(); cc = cc.slice().reverse(); }
            const rs = gs.row(pp, cc, pp.map(p => [p[0] / 6, -p[2] / 6])); if (ps[si] >= 0) gs.link(ps[si], rs, 0, 3); ps[si] = rs; } } }
    }
    for (const [key, g] of stCh) { if (g.empty) continue; addM(g, key[0] === 'a' ? aMat : gMat, false); }
    // the kerbs at the apexes (red and white, low): the inside of the corners
    {
      const cMat = new THREE.MeshLambertMaterial({ map: tex.curb, vertexColors: true }), CH = 720;
      for (let c0 = 0; c0 < N; c0 += CH) { const g = new RB(true); const pk = [-1, -1];
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) { const i = ii % N;
          let km = 0; for (let d = -6; d <= 6; d++) km = Math.max(km, Math.abs(T.k[(i + d + N) % N]));
          for (const sd of [-1, 1]) { const si = sd > 0 ? 1 : 0, inside = sd * T.k[i] > 0;
            if (!(km > 1 / 45 && inside)) { pk[si] = -1; continue; }
            const wi = WA[i], u = ii * ds / 3; let pp = [Pt(i, sd * (wi - 0.02), 0.03), Pt(i, sd * (wi + 1.1), 0.07)], uu = [[0, u], [1, u]];
            if (sd < 0) { pp = pp.reverse(); uu = uu.reverse(); }
            const r = g.row(pp, [[1, 1, 1], [1, 1, 1]], uu); if (pk[si] >= 0) g.link(pk[si], r, 0, 1); pk[si] = r; } }
        addM(g, cMat); }
    }
    const lineG = new GB();
    for (const [a, b, c, d, col] of stMarks) lineG.quadUp(a, b, c, d, [col, col, col, col]);
    const strip = (s0, s1, o0, o1, col, y) => { const a = atSf(s0, o0), b = atSf(s0, o1), c = atSf(s1, o1), d = atSf(s1, o0), Y = (p) => T.hy[p[3]] + (y || 0.034);
      lineG.quadUp([a[0], Y(a), a[1]], [b[0], Y(b), b[1]], [c[0], Y(c), c[1]], [d[0], Y(d), d[1]], [col, col, col, col]); };
    const fwl = [0.74, 0.74, 0.72];   // (the old lines: worn, greyer)
    {   // the start line and the grid boxes
      const gq = new GB(true), W1 = [1, 1, 1], wS = WA[T.startIdx], uM = Math.round(wS * 2 / 0.8) / 16;
      const a = atSf(sStart - 0.8, -wS), b = atSf(sStart - 0.8, wS), c = atSf(sStart + 0.8, wS), d = atSf(sStart + 0.8, -wS), Y = (p) => T.hy[p[3]] + 0.04;
      gq.quadUp([a[0], Y(a), a[1]], [b[0], Y(b), b[1]], [c[0], Y(c), c[1]], [d[0], Y(d), d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker }));
      for (let k = 1; k <= 14; k++) { const sb = sStart - 9 - (k - 1) * 7.5 + 2.6, lat = (k % 2 === 1 ? -1 : 1) * 3.4; strip(sb, sb + 0.35, lat - 1.5, lat + 1.5, wl, 0.037); strip(sb - 1.6, sb + 0.35, lat - 1.5, lat - 1.25, wl, 0.037); }
    }
    for (let s = 0; s < L; s += 2) {   // the streets' old lines on the circuit: Boundary Street (the two carriageways: two lanes each, the dividing line), Charters Towers Road
      const d = dS(s), i = T.idx(s), wi = WA[i]; if (d > -125 && d < 6) continue;
      const bnd = d > -300 && d < 600, ctr = d > 700 && d < 950; if (!bnd && !ctr) continue;
      if (bnd && wi > 6.6) { strip(s, s + 2, -0.08, 0.08, fwl, 0.033); if (Math.floor(s / 3) % 3 === 0) for (const o of [-wi / 2, wi / 2]) strip(s, s + 1.2, o - 0.06, o + 0.06, fwl, 0.033); }
      else if (Math.floor(s / 3) % 3 === 0) strip(s, s + 1.4, -0.06, 0.06, fwl, 0.033);
    }

    /* ---- the barriers: concrete blocks with a catch fence on posts above them all the way round, open where the pit lane leaves and rejoins;
       the pit wall between the track and the lane ---- */
    const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const postGeo = (() => { const g = new GB(); box(g, 0, 0, 0, 0.09, 1, 0.09, 0, [0.5, 0.51, 0.53], null, true); return g.geometry(); })();
    const posts = new IChunks(postGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), 384);
    const gapAt = (i, sd) => { if (sd < 0 || !def.pit) return false; const p = pitAtI(i); return !!p && p.gap; };
    const wallRow = (g, i, sd, bar) => {
      const shade = 0.93 + 0.07 * Math.sin(Math.floor(i * ds / 3.8) * 2.1), c0 = [0.62 * shade, 0.62 * shade, 0.6 * shade], c1 = [0.82 * shade, 0.82 * shade, 0.8 * shade], c2 = [0.88, 0.88, 0.86];
      let p = [Pt(i, sd * (bar - 0.02), -0.05), Pt(i, sd * (bar + 0.06), 0.28), Pt(i, sd * (bar + 0.2), 0.84), Pt(i, sd * (bar + 0.42), 0.84), Pt(i, sd * (bar + 0.62), -0.05)], c = [c0, c1, c1, c2, c0];
      if (sd < 0) { p = p.reverse(); c = c.slice().reverse(); }
      return g.row(p, c);
    };
    {
      const CH = 360;
      for (let c0 = 0; c0 < N; c0 += CH) {
        const g = new RB(), gf = new RB(true);
        for (const sd of [-1, 1]) { let pw = -1, pf = -1;
          for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) { const i = ii % N, bar = barO(i, sd);
            if (gapAt(i, sd)) { pw = pf = -1; continue; }
            const r = wallRow(g, i, sd, bar); if (pw >= 0) g.link(pw, r, 0, 4); pw = r;
            const u = ii * ds / 2.5, fa = Pt(i, sd * (bar + 0.31), 0.84), fb = Pt(i, sd * (bar + 0.31), 3.9);
            const rf = gf.row(sd > 0 ? [fa, fb] : [fb, fa], [[1, 1, 1], [1, 1, 1]], sd > 0 ? [[u, 0], [u, 1.25]] : [[u, 1.25], [u, 0]]); if (pf >= 0) gf.link(pf, rf, 0, 1); pf = rf;
            if (ii < c0 + CH && ii % 2 === 0) { const p = Pt(i, sd * (bar + 0.36), 0); posts.add(p[0], p[1] + 0.6, p[2], -T.hd[i], 1, 3.4); } } }
        addM(g, matV, false); addM(gf, fMat, false);   // (the low blocks: their shadow is hardly seen, two draws saved)
      }
    }
    // the decks of the two bridges (Boundary Street over the arm of Ross Creek at Turn 1, the raceway's bridge over the creek): their faces over the water
    {
      const g = new GB();
      for (let ii = 0; ii < N; ii++) { const i = ii, j = (ii + 1) % N;
        for (const sd of [-1, 1]) { const o = barO(i, sd) + 0.62, o2 = barO(j, sd) + 0.62, a = Pt(i, sd * o, 0), b = Pt(j, sd * o2, 0);
          if (!inWater(a[0], a[2]) && !inWater(a[0] + T.nx[i] * sd * 3, a[2] + T.nz[i] * sd * 3)) continue;
          const lo = Math.min(a[1], b[1]) - 1.4; g.quadO([a[0], lo, a[2]], [b[0], lo, b[2]], b, a, [0.7, 0.69, 0.66], Pt(i, 0, -0.7)); } }
      addM(g, matV);
    }

    /* ---- the pit lane on the right of the straight: its asphalt, the apron, the garages (the pit building of the park: concrete, roller doors,
       the teams' colours), the teams' stands on the pit wall; the crews are the renderer's (out.pitBoxes, the player's out.pitBox) ---- */
    if (def.pit) {
      const P0 = def.pit, sd = 1, gl = new RB(true), gp = new GB(), [pq0, pq1] = def.pitRow, apron = [0.76, 0.76, 0.73];
      const at = (k, o, y) => Pt(k, sd * o, y);
      let pl = -1;
      for (let q = P0[1]; q <= P0[2]; q += 2) {
        const i = T.idx(sStart + q), p = T.pitAt(sStart + q); if (!p) { pl = -1; continue; }
        const a0 = p.gap ? WA[i] : p.wall + 0.3, a1 = p.lout + 0.6;
        const pp = [at(i, a0, 0.022), at(i, a1, 0.022)], uu = pp.map(v => [v[0] / 8, -v[2] / 8]);
        const r = gl.row(pp, [[0.92, 0.92, 0.94], [0.92, 0.92, 0.94]], uu); if (pl >= 0) gl.link(pl, r, 0, 1); pl = r;
        if (!p.gap && p.t > 0.999) { const j = T.idx(sStart + q + 2); gp.quadUp(at(i, p.lout, 0.03), at(i, p.lout + 9, 0.03), at(j, p.lout + 9, 0.03), at(j, p.lout, 0.03), [apron, apron, apron, apron]);
          if (((q / 2) | 0) % 2 === 0) gp.quadUp(at(i, p.lin + 0.15, 0.035), at(i, p.lin + 0.3, 0.035), at(j, p.lin + 0.3, 0.035), at(j, p.lin + 0.15, 0.035), [wl, wl, wl, wl]); }
      }
      addM(gl, aMat);
      const TEAM = [[0.85, 0.16, 0.13], [0.16, 0.36, 0.8], [0.95, 0.95, 0.94], [0.18, 0.62, 0.3], [0.96, 0.72, 0.12], [0.14, 0.14, 0.16], [0.95, 0.45, 0.1], [0.5, 0.26, 0.7], [0.1, 0.62, 0.72], [0.85, 0.2, 0.5], [0.4, 0.42, 0.46], [0.2, 0.3, 0.55], [0.7, 0.1, 0.1]];
      const WH = [0.9, 0.9, 0.88], CON = [0.78, 0.77, 0.74], FR = [0.62, 0.63, 0.66];
      let k = 0;
      for (let q = pq0; q <= pq1 - 10; q += 12, k++) {
        const s0 = sStart + q, i = T.idx(s0 + 6), p = T.pitAt(s0 + 6); if (!p || p.t < 0.999) continue;
        const tx = T.tx[i], tz = T.tz[i], nx = T.nx[i] * sd, nz = T.nz[i] * sd, hd = T.hd[i], base = p.o + 3.5, oc = atSf(s0 + 6, 0), tc = TEAM[k % TEAM.length];
        const B = (a, o, y, sx, sy, sz, col, top) => { const x = oc[0] + tx * (a - 6) + nx * o, z = oc[1] + tz * (a - 6) + nz * o; box(scen.get(x, z), x, T.hy[i] + y, z, sx, sy, sz, hd, col, top); };
        { const A = atSf(s0, sd * base), Bq = atSf(s0, sd * (base + 9)), y = T.hy[i] + 0.04; gp.quadUp([A[0] - tx * 0.09, y, A[1] - tz * 0.09], [A[0] + tx * 0.09, y, A[1] + tz * 0.09], [Bq[0] + tx * 0.09, y, Bq[1] + tz * 0.09], [Bq[0] - tx * 0.09, y, Bq[1] - tz * 0.09], [wl, wl, wl, wl]); }
        // the permanent building: a concrete frame bay, the roller door up, the roof with an overhang over the apron, the team's colour inside
        B(6, base + 15, 4.6, 12.2, 0.35, 13, [0.66, 0.67, 0.68], [0.84, 0.85, 0.86]); B(6, base + 21.4, 0, 12, 4.6, 0.3, CON);
        for (const a of [0.1, 11.9]) B(a, base + 15.5, 0, 0.3, 4.6, 11.6, WH);
        B(6, base + 9.8, 3.7, 11.6, 0.9, 0.2, [0.52, 0.53, 0.55]); B(6, base + 20.9, 0.3, 11, 2.6, 0.2, tc);
        B(2, base + 19.6, 0, 1.2, 1.0, 0.6, [0.2, 0.21, 0.24], [0.12, 0.12, 0.13]); B(10, base + 19.6, 0, 1.2, 1.0, 0.6, [0.78, 0.14, 0.12], [0.12, 0.12, 0.13]);
        for (const a of [4.6, 7.4]) for (let l = 0; l < 3; l++) { const x = oc[0] + tx * (a - 6) + nx * (base + 19), z = oc[1] + tz * (a - 6) + nz * (base + 19); cyl(scen.get(x, z), x, T.hy[i] + l * 0.3, z, 0.34, 0.28, 8, [0.12, 0.12, 0.13], [0.2, 0.2, 0.21]); }
        { const o = (p.wall + p.lin) / 2; B(6, o, 0.95, 2.4, 0.06, 1.0, [0.3, 0.31, 0.34]); B(6, o, 2.4, 2.6, 0.07, 1.4, [0.22, 0.23, 0.26], [0.3, 0.31, 0.35]); for (const a of [4.9, 7.1]) B(a, o, 0, 0.08, 2.4, 0.08, FR); B(6, o - 0.35, 1.05, 2.0, 0.38, 0.05, [0.16, 0.24, 0.38]); }
        const mine = Math.abs(q + 6 - P0[3]) < 6.1;
        if (mine && !out.pitBox) { const sb = s0 + 6, yc = [0.98, 0.82, 0.12];
          out.pitBox = { s: sb, x: oc[0] + nx * (base + 4.2), z: oc[1] + nz * (base + 4.2), hd, tx, tz, nx, nz, lane: p.o, wallO: p.wall, apron0: base, garage0: base + 9, stop: atSf(sb, sd * p.o), y: T.hy[i] };
          for (const [d0, d1, l0, l1] of [[-3.2, 3.2, p.o - 2.6, p.o - 2.35], [-3.2, 3.2, p.o + 2.35, p.o + 2.6], [-3.2, -2.95, p.o - 2.6, p.o + 2.6], [2.95, 3.2, p.o - 2.6, p.o + 2.6]]) strip(sb + d0, sb + d1, sd * l0, sd * l1, yc, 0.04); }
        (out.pitBoxes = out.pitBoxes || []).push({ k, s: s0 + 6, ox: oc[0], oz: oc[1], tx, tz, nx, nz, hd, base, lane: p.o, wall: p.wall, team: tc, mine: mine && out.pitBox && out.pitBox.s === s0 + 6, y: T.hy[i] });
      }
      const pbs = out.pitBoxes; T.pitStands = null;
      if (pbs && pbs.length) T.pitStands = [dS(pbs[0].s) - 1.35, dS(pbs[pbs.length - 1].s) + 1.35];
      { const g = new RB(); let pw = -1;   // the lane's outer wall where there are no garages
        for (let q = P0[1]; q <= P0[2]; q += 2) { const i = T.idx(sStart + q), p = T.pitAt(sStart + q); if (!p) { pw = -1; continue; }
          const o = p.t > 0.999 ? p.lout + 9.6 + (q > pq0 - 8 && q < pq1 + 2 ? 13 : 0) : p.lout + 0.6, r = wallRow(g, i, sd, o); if (pw >= 0) g.link(pw, r, 0, 4); pw = r; }
        addM(g, matV, true); }
      addM(gp, matV);
    }

    /* ---- the start gantry over the straight: a truss on two towers, the start lights (out.dyn.lights) ---- */
    {
      const [x, z, h, i] = atSf(sStart, 0), gy = T.hy[i], g = scen.get(x, z), span = WA[i] + 2.4, nx = T.nx[i], nz = T.nz[i], gray = [0.24, 0.25, 0.28];
      for (const sdd of [-1, 1]) box(g, x + nx * span * sdd, gy - 0.3, z + nz * span * sdd, 0.9, 8.1, 0.9, h, gray);
      box(g, x, gy + 6.4, z, 1.2, 1.4, span * 2 + 0.9, h, [0.16, 0.17, 0.2], [0.26, 0.27, 0.3]);
      box(g, x, gy + 5.1, z, 0.5, 1.3, 5.6, h, [0.07, 0.07, 0.08]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, gy + 7.95, z + nz * o); m.rotation.y = -h; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
    }

    /* ---- the buildings: OpenStreetMap's (and Microsoft's) outlines and heights. The houses: timber on stilts (lattice between the stumps, a
       verandah), weatherboard walls in pale colours, hipped or gabled metal roofs (galvanised, cream, white, green, red, blue); shops and halls
       with flat metal roofs and awnings over the footpath; the city's offices; sheds of corrugated iron ---- */
    const facTex = (draw) => { const c = document.createElement('canvas'); c.width = c.height = 64; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; out.winMaps.push(t); return ownTex(t); };
    const FW = facTex((g) => {   // weatherboard with a louvred window (a house)
      g.fillStyle = '#f2efe6'; g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(0,0,0,0.09)'; for (let y = 0; y < 64; y += 4) g.fillRect(0, y, 64, 1);
      g.fillStyle = '#e8e4da'; g.fillRect(18, 14, 28, 30); g.fillStyle = '#56687a'; g.fillRect(21, 17, 22, 24); g.fillStyle = 'rgba(255,255,255,0.35)'; for (let y = 19; y < 40; y += 4) g.fillRect(21, y, 22, 1); g.fillStyle = '#e8e4da'; g.fillRect(31, 17, 2, 24); });
    const FS = facTex((g) => {   // a shopfront: rendered wall, a big window, the awning's shadow
      g.fillStyle = '#ece6da'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#4c5d6e'; g.fillRect(6, 22, 52, 34); g.fillStyle = '#7c8fa2'; g.fillRect(9, 25, 20, 14); g.fillStyle = '#d9d2c4'; g.fillRect(31, 22, 2, 34); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 16, 64, 6); });
    const FG = facTex((g) => {   // a curtain wall: green-blue glass, pale mullions
      g.fillStyle = '#c9ced3'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#4f7280'; g.fillRect(2, 2, 60, 50); g.fillStyle = '#7397a3'; g.fillRect(4, 4, 26, 20); g.fillStyle = '#5f8490'; g.fillRect(34, 26, 26, 24); g.fillStyle = '#3d4a52'; g.fillRect(0, 52, 64, 12); g.fillStyle = '#c9ced3'; g.fillRect(31, 2, 2, 50); });
    const FC = facTex((g) => {   // corrugated iron (a shed)
      g.fillStyle = '#c4c6c4'; g.fillRect(0, 0, 64, 64); for (let x = 0; x < 64; x += 4) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, 0, 2, 64); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 2, 0, 1, 64); } });
    const facMats = [FW, FS, FG, FC].map(m => new THREE.MeshLambertMaterial({ map: m, vertexColors: true }));
    const fac = facMats.map(() => new Chunks(512, true));
    const BAY = [3.2, 6.0, 3.2, 4.0], FLH = [3.0, 4.2, 3.6, 6.0];
    const BG = new Map(), BGC = 8, bldMark = (x, z) => BG.set(Math.floor(x / BGC) * 8192 + Math.floor(z / BGC), 1);
    const onBld = (x, z) => BG.has(Math.floor(x / BGC) * 8192 + Math.floor(z / BGC));
    const pitZone = (x, z) => { if (!def.pit) return false; const q = near(x, z, 60); if (q.i < 0 || q.lat < 0) return false; const p = T.pitAt(q.i * ds); return !!p && Math.abs(q.lat) < p.lout + 26; };
    const ROOF = [[0.72, 0.74, 0.76], [0.66, 0.68, 0.7], [0.62, 0.22, 0.17], [0.34, 0.45, 0.36], [0.27, 0.36, 0.5], [0.9, 0.9, 0.87], [0.48, 0.38, 0.3], [0.84, 0.8, 0.66], [0.42, 0.44, 0.45]];   // galvanised, grey, red, green, blue, white, brown, cream, dark grey
    const WALL = [[1, 1, 1], [0.98, 0.95, 0.84], [0.88, 0.94, 0.95], [0.92, 0.96, 0.88], [0.98, 0.92, 0.86], [0.95, 0.95, 0.95]];
    const hip = (g, P, y, h, col, sideC) => {   // a hipped roof over a quadrilateral (its long axis): two sloped trapezoids, two triangles
      const e = (a, b) => Math.hypot(P[b][0] - P[a][0], P[b][1] - P[a][1]), long0 = e(0, 1) + e(2, 3) >= e(1, 2) + e(3, 0);
      const Q = long0 ? P : [P[1], P[2], P[3], P[0]], cx = (Q[0][0] + Q[1][0] + Q[2][0] + Q[3][0]) / 4, cz = (Q[0][1] + Q[1][1] + Q[2][1] + Q[3][1]) / 4;
      const m03 = [(Q[0][0] + Q[3][0]) / 2, (Q[0][1] + Q[3][1]) / 2], m12 = [(Q[1][0] + Q[2][0]) / 2, (Q[1][1] + Q[2][1]) / 2], dep = (e(1, 2) + e(3, 0)) / 2 * (long0 ? 1 : 1), len = Math.hypot(m12[0] - m03[0], m12[1] - m03[1]) || 1;
      const ux = (m12[0] - m03[0]) / len, uz = (m12[1] - m03[1]) / len, inset = Math.min(len * 0.45, dep * 0.5), r0 = [m03[0] + ux * inset, y + h, m03[1] + uz * inset], r1 = [m12[0] - ux * inset, y + h, m12[1] - uz * inset];
      const v = (p) => [p[0], y, p[1]], inn = [cx, y - 3, cz];
      g.quadO(v(Q[0]), v(Q[1]), r1, r0, col, inn); g.quadO(v(Q[2]), v(Q[3]), r0, r1, col.map(c => c * 0.88), inn); g.triO(v(Q[1]), v(Q[2]), r1, sideC || col, inn); g.triO(v(Q[3]), v(Q[0]), r0, sideC || col.map(c => c * 0.94), inn);
    };
    let nBld = 0;
    {
      const v = i16(D.bld); let k = 0;
      while (k < v.length) {
        const kind = v[k], h = v[k + 1] / 4, mh = v[k + 2] / 4, rs = v[k + 3], n = v[k + 4], P = []; for (let m = 0; m < n; m++) P.push([v[k + 5 + 2 * m] / 4, v[k + 6 + 2 * m] / 4]); k += 5 + 2 * n;
        if (n < 3 || kind === 5) continue;   // (the pit building: the garages above)
        let cx = 0, cz = 0, ar = 0; for (let m = 0; m < n; m++) { const [ax, az] = P[m], [bx, bz] = P[(m + 1) % n]; ar += ax * bz - bx * az; cx += ax / n; cz += az / n; }
        ar /= 2; const sg = ar > 0 ? 1 : -1, area = Math.abs(ar);
        let clash = false; for (const [x, z] of P.concat([[cx, cz]])) { const q = near(x, z, 30); if ((q.i >= 0 && q.dd < barO(q.i, q.lat > 0 ? 1 : -1) - WA[q.i] + 1.5) || pitZone(x, z)) { clash = true; break; } }
        if (clash) continue;
        let y0 = 1e9; for (const [x, z] of P) y0 = Math.min(y0, groundH(x, z)); y0 -= 0.25;
        const house = kind === 0, fk = house ? 0 : kind === 2 ? 2 : kind === 3 ? 3 : 1, hr = rng(Math.round(cx * 13) ^ Math.round(cz * 7));
        const stilts = house && area < 260 && hr() < 0.7, yb = y0 + (stilts ? 2.1 : 0) + mh, roofP = house ? Math.min(2.4, Math.sqrt(area) * 0.22) : 0, yt = y0 + Math.max(stilts ? 4.8 : 3, h - roofP);
        let col = fk === 0 ? WALL[Math.floor(hr() * WALL.length)] : fk === 3 ? vary([0.95, 0.96, 0.95], hr, 0.1) : fk === 2 ? vary([1, 1, 1.02], hr, 0.1) : vary([1, 0.98, 0.94], hr, 0.12);
        const gF = fac[fk].get(cx, cz), bw = BAY[fk], fh = FLH[fk];
        let acc = 0;
        for (let m = 0; m < n; m++) {
          const [ax, az] = P[m], [bx, bz] = P[(m + 1) % n], l = Math.hypot(bx - ax, bz - az); if (l < 0.05) continue;
          const ox = sg * (bz - az) / l, oz = -sg * (bx - ax) / l, inn = [(ax + bx) / 2 - ox, (yb + yt) / 2, (az + bz) / 2 - oz];
          const u0 = Math.round(acc / bw), u1 = u0 + Math.max(1, Math.round(l / bw)), v0 = 0, v1 = Math.max(1, Math.round((yt - yb) / fh));
          gF.quadO([ax, yb, az], [bx, yb, bz], [bx, yt, bz], [ax, yt, az], col, inn, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); acc += l;
          if (stilts) { const g = scenN.get(ax, az); g.quadO([ax, y0, az], [bx, y0, bz], [bx, yb, bz], [ax, yb, az], [0.42, 0.4, 0.36], inn); }   // (the lattice under the house: dark, open)
        }
        const g = scen.get(cx, cz), rc = rs & 7, roofC = rc ? ROOF[rc] : house ? ROOF[[0, 0, 0, 1, 5, 7, 3, 2, 4, 8][Math.floor(hr() * 10)]] : kind === 3 ? ROOF[hr() < 0.7 ? 0 : 1] : kind === 2 ? [0.55, 0.56, 0.57] : ROOF[[0, 1, 5, 7][Math.floor(hr() * 4)]];
        const rk = vary(roofC, hr, 0.08);
        if (n === 4 && (house || area < 600)) hip(g, P, yt, house ? roofP : Math.min(1.6, Math.sqrt(area) * 0.08), rk, (rs >> 3) === 2 ? col.map(c => c * 0.9) : null);
        else {
          const tri = THREE.ShapeUtils.triangulateShape(P.map(([x, z]) => new THREE.Vector2(x, z)), []);
          const yr = yt + (house ? 0.6 : 0.1);
          for (const [a, bq, c] of tri) g.triO([P[a][0], yr, P[a][1]], [P[bq][0], yr, P[bq][1]], [P[c][0], yr, P[c][1]], rk, [cx, yr - 5, cz]);
          if (house) for (let m = 0; m < n; m++) { const [ax, az] = P[m], [bx, bz] = P[(m + 1) % n]; g.quadO([ax, yt, az], [bx, yt, bz], [bx, yr, bz], [ax, yr, az], rk.map(c => c * 0.8), [cx, yt, cz]); }
          if (area > 900 && h > 6) { const nU = Math.min(6, Math.floor(area / 1400) + 1); for (let u = 0; u < nU; u++) { const px = cx + (hr() - 0.5) * Math.sqrt(area) * 0.5, pz = cz + (hr() - 0.5) * Math.sqrt(area) * 0.5; if (!inPoly(P, px, pz)) continue; box(g, px, yr, pz, 2.2 + hr() * 2.5, 1.1 + hr() * 0.9, 1.6 + hr() * 2, hr() * TAU, [0.74, 0.75, 0.76], [0.8, 0.81, 0.82]); } }
          if (kind === 1 && area > 150 && hr() < 0.5) {   // an awning over the footpath on the side nearest a street
            let bm = -1, bd = 1e9; for (let m = 0; m < n; m++) { const [ax, az] = P[m], [bx, bz] = P[(m + 1) % n], mx = (ax + bx) / 2, mz = (az + bz) / 2, l = Math.hypot(bx - ax, bz - az); if (l < 6) continue; for (const S of ST) { if (S.kind !== 0) continue; for (let t = 0; t + 1 < S.P.length; t++) { const d = segD(mx, mz, S.P[t][0], S.P[t][1], S.P[t + 1][0], S.P[t + 1][1]); if (d < bd) { bd = d; bm = m; } } } if (bd < 12 && bm === m) break; }
            if (bm >= 0 && bd < 14) { const [ax, az] = P[bm], [bx, bz] = P[(bm + 1) % n], l = Math.hypot(bx - ax, bz - az), ox = sg * (bz - az) / l * 2.6, oz = -sg * (bx - ax) / l * 2.6, ya = y0 + 3.1;
              g.quadO([ax, ya, az], [bx, ya, bz], [bx + ox, ya - 0.2, bz + oz], [ax + ox, ya - 0.2, az + oz], [0.72, 0.74, 0.75], [(ax + bx) / 2, ya - 3, (az + bz) / 2]); }
          }
        }
        let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
        for (let x = x0; x <= x1; x += BGC / 2) for (let z = z0; z <= z1; z += BGC / 2) if (inPoly(P, x, z)) bldMark(x, z);
        nBld++;
      }
    }

    for (const cp of D.cp || []) { const Pp = []; for (let k = 1; k < cp.length; k += 2) Pp.push([cp[k] / 2, cp[k + 1] / 2]); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of Pp) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      for (let x = x0; x <= x1; x += BGC / 2) for (let z = z0; z <= z1; z += BGC / 2) if (inPoly(Pp, x, z)) bldMark(x, z); }   // (the car parks: no trees on them)

    /* ---- the trees of the tropics: coconut and royal palms, fan palms, the wide umbrellas of the rain trees and figs, dark round mangoes;
       poincianas (in the wet season red with flowers); mangroves along the creek (instanced, in chunks) ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const palmGeo = (kind, lo) => {   // a palm 1 high: a slender, slightly leaning trunk, a crown of drooping fronds (kind 0 coconut, 1 royal / fan)
      const g = new GB(), r = rng(700 + kind), tr = kind ? [0.62, 0.6, 0.56] : [0.5, 0.44, 0.36], lf = kind ? [0.27, 0.42, 0.2] : [0.32, 0.46, 0.2], lean = kind ? 0 : 0.06;
      for (let k = 0; k < 3; k++) { const y0 = k / 3 * 0.86, y1 = (k + 1) / 3 * 0.86; cyl(g, lean * y0 * y0 * 1.6, y0, 0, kind ? 0.03 : 0.022, y1 - y0, 4, tr, null, kind ? 0.026 : 0.02); }
      const hx = lean * 0.86 * 0.86 * 1.6, hy = 0.88, nF = lo ? 7 : kind ? 10 : 11;
      for (let f = 0; f < nF; f++) { const a = f / nF * TAU + r() * 0.3, droop = (kind ? 0.16 : 0.26) * (0.8 + r() * 0.4), len = (kind ? 0.32 : 0.38) * (0.85 + r() * 0.3), ca = Math.cos(a), sa = Math.sin(a), px = -sa, pz = ca, wd = 0.045;
        const p0 = [hx, hy, 0], p1 = [hx + ca * len * 0.5, hy + 0.06, sa * len * 0.5], p2 = [hx + ca * len, hy - droop, sa * len];
        const c1 = vary(lf, r, 0.15), c2 = c1.map(v => v * 0.82);
        g.tri(p0, [p1[0] + px * wd, p1[1], p1[2] + pz * wd], [p1[0] - px * wd, p1[1], p1[2] - pz * wd], c1, c1, c2);
        g.tri([p1[0] + px * wd, p1[1], p1[2] + pz * wd], p2, [p1[0] - px * wd, p1[1], p1[2] - pz * wd], c1, c2, c1);
        g.tri(p0, [p1[0] - px * wd, p1[1], p1[2] - pz * wd], [p1[0] + px * wd, p1[1], p1[2] + pz * wd], c2, c2, c2);
        g.tri([p1[0] - px * wd, p1[1], p1[2] - pz * wd], p2, [p1[0] + px * wd, p1[1], p1[2] + pz * wd], c2, c2, c2); }
      if (!kind && !lo) for (let c = 0; c < 4; c++) { const a = c / 4 * TAU; box(g, hx + Math.cos(a) * 0.03, hy - 0.06, Math.sin(a) * 0.03, 0.035, 0.035, 0.035, 0, [0.45, 0.4, 0.2]); }   // (the coconuts)
      const geo = g.geometry(); geo.computeBoundingSphere(); return geo; };
    const broadGeo = (kind, lo) => {   // a broadleaf tree 1 high (kind 0 rain tree / fig: a wide umbrella; 1 mango: dense and round; 2 poinciana: a flat umbrella)
      const g = new GB(), r = rng(800 + kind), tr = [0.36, 0.31, 0.26];
      const lf = kind === 0 ? [0.26, 0.42, 0.17] : kind === 1 ? [0.18, 0.33, 0.14] : (season === 'summer' ? [0.64, 0.24, 0.15] : [0.36, 0.46, 0.2]);   // (the poincianas flower in the summer)
      cyl(g, 0, 0, 0, 0.05, kind === 1 ? 0.4 : 0.5, 5, tr, null, 0.035);
      const cl = kind === 0 ? [[0, 0.62, 0, 0.42, 0.55], [0.3, 0.6, 0.1, 0.3, 0.5], [-0.28, 0.6, -0.1, 0.3, 0.5]] : kind === 1 ? [[0, 0.62, 0, 0.36, 0.95], [0.12, 0.8, 0.05, 0.24, 0.9]] : [[0, 0.66, 0, 0.44, 0.35], [0.28, 0.64, 0.12, 0.28, 0.35], [-0.26, 0.64, -0.14, 0.28, 0.35]];
      (lo ? [[0, cl[0][1] + 0.04, 0, cl[0][3] * 1.25, cl[0][4]]] : cl).forEach(([x, y, z, rr, sy], k) => puff(g, x, y, z, rr, sy, k % 2 ? lf.map(v => v * 0.84) : lf, r, 0.22, 0.6, 1.14, false));
      const geo = g.geometry(); geo.computeBoundingSphere(); return geo; };
    const mangroveGeo = (() => { const g = new GB(), r = rng(911); for (let k = 0; k < 3; k++) puff(g, (r() - 0.5) * 0.6, 0.35, (r() - 0.5) * 0.6, 0.42, 0.65, [0.2, 0.34, 0.16], r, 0.3, 0.55, 1.1, false); for (let k = 0; k < 5; k++) { const a = r() * TAU; cyl(g, Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3, 0.02, 0.3, 3, [0.4, 0.34, 0.28]); } const geo = g.geometry(); geo.computeBoundingSphere(); return geo; })();
    const TG = [palmGeo(0), palmGeo(1), broadGeo(0), broadGeo(1), broadGeo(2), mangroveGeo], TGF = [palmGeo(0, true), palmGeo(1, true), broadGeo(0, true), broadGeo(1, true), broadGeo(2, true), mangroveGeo];
    const TCH = TG.map(gg => new IChunks(gg, tMat, 720)), TCF = TGF.map(gg => new IChunks(gg, tMat, 1000));   // (TCH: within 120 m of the circuit, with shadows; TCF: farther, simpler, none)   // (TCH: within 120 m of the circuit, with shadows; TCF: farther, none)
    let nTrees = 0;
    const treeOk = (x, z, r) => { if (onBld(x, z) || inWater(x, z) || pitZone(x, z)) return false; const q = near(x, z, 24); if (q.i >= 0 && q.dd < barO(q.i, q.lat > 0 ? 1 : -1) - WA[q.i] + (r || 2.5)) return false; return !onRoad(x, z, -1, 0.8); };
    const plant = (x, z, kind, ht) => { const h = ht || (kind < 2 ? 9 + R() * 8 : kind === 2 ? 9 + R() * 7 : kind === 3 ? 7 + R() * 4 : 6 + R() * 3);
      const sx = kind < 2 ? h : kind === 2 ? h * 1.25 : kind === 4 ? h * 1.3 : h * 0.95, crown = kind < 2 ? sx * 0.36 : sx * 0.5;   // (the crown's reach: kept off the track's fence)
      if (!treeOk(x, z, kind < 2 ? Math.max(1.5, crown - 2) : crown + 1)) return false;
      const nearT = near(x, z, 130).dd < 120, fk = nearT ? kind : kind < 2 ? 0 : kind === 5 ? 5 : 2;   // (farther off: one palm, one broad crown; the poincianas by their colour)
      let col = kind === 4 || kind === 5 ? vary([1, 1, 1], R, 0.12) : vary([1, 1, 1], R, WET ? 0.14 : 0.2).map((c, q) => c * (WET ? 1 : [1.1, 1.0, 0.85][q]));
      if (kind === 4 && !nearT) col = col.map((c, q) => c * (season === 'summer' ? [2.45, 0.57, 0.88] : [1.38, 1.1, 1.18])[q]);
      (nearT ? TCH : TCF)[fk].add(x, groundH(x, z) - 0.1, z, R() * TAU, sx, h, col); nTrees++; return true; };
    const pick = () => { const u = R(); return u < 0.32 ? 0 : u < 0.46 ? 1 : u < 0.9 ? 2 : 4; };
    { const Tr = i16(D.trees); for (let k = 0; k < Tr.length; k += 2) plant(Tr[k] / 2, Tr[k + 1] / 2, pick()); }
    for (let j = 0; j < LCD.nz; j += 2) for (let i = 0; i < LCD.nx; i += 2) {   // WorldCover's trees: one per ~12 m square; the yards of the town: a palm or a mango now and then
      const c = LCA[j * LCD.nx + i], x = LCD.x0 + (i + R()) * LCD.cell * 2 - LCD.cell / 2, z = LCD.z0 + (j + R()) * LCD.cell * 2 - LCD.cell / 2;
      if (c === 2 && R() < 0.4) plant(x, z, pick());
      else if (c === 0 && R() < 0.035) plant(x, z, R() < 0.5 ? 0 : R() < 0.5 ? 2 : 1);
      else if (c === 1 && R() < (noise2(x, z) > 0.55 ? 0.16 : 0.04)) plant(x, z, R() < 0.55 ? 2 : R() < 0.5 ? 4 : 0);   // (the park's trees: in groves here and there, single ones on the open lawns)
      else if (c === 3 && R() < 0.5) { let edge = 0; for (const [ox, oz] of [[-8, 0], [8, 0], [0, -8], [0, 8]]) if (!inWater(x + ox, z + oz)) edge++; if (edge && R() < 0.8) { const a = R() * TAU; for (let m = 0; m < 3; m++) { const mx = x + Math.cos(a + m) * 3, mz = z + Math.sin(a + m) * 3; if (!inWater(mx, mz) || edge > 1) { if (treeOk(mx, mz, 3)) { TCF[5].add(mx, Math.max(WY, groundH(mx, mz)) - 0.2, mz, R() * TAU, 3 + R() * 2, 2.6 + R() * 1.6, vary([1, 1, 1], R, 0.1)); nTrees++; } } } } }   // (mangroves on the creek's banks)
    }
    // palms along the start straight's median strip ends and the park's edge by Boundary Street (as in the town: a row along the road)
    for (let d = -300; d < 320; d += 14) { const i = T.idx(sAt(d)); for (const sd of [-1, 1]) { const [x, z] = atSf(sAt(d), sd * (barO(i, sd) + 6 + R() * 2)); if (R() < 0.6) plant(x, z, sd > 0 ? 1 : 0, 8 + R() * 4); } }

    /* ---- parked cars: in the car parks (rows), along the kerbs of the streets (instanced, no shadows) ---- */
    const carGeo = (() => { const g = new GB(); box(g, 0, 0.18, 0, 4.5, 0.74, 1.82, 0, [1, 1, 1], [0.95, 0.95, 0.95]); box(g, -0.2, 0.9, 0, 2.4, 0.58, 1.62, 0, [0.22, 0.26, 0.32], [1, 1, 1]); return g.geometry(); })();
    const utesGeo = (() => { const g = new GB(); box(g, 0, 0.3, 0, 5.2, 0.8, 1.9, 0, [1, 1, 1], [0.95, 0.95, 0.95]); box(g, 0.75, 1.1, 0, 1.9, 0.62, 1.7, 0, [0.22, 0.26, 0.32], [1, 1, 1]); box(g, -1.4, 1.1, 0, 2.2, 0.1, 1.9, 0, [0.3, 0.3, 0.3]); return g.geometry(); })();   // (a utility: the cab and the tray)
    const cars = new IChunks(carGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), 384), utes = new IChunks(utesGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), 384);
    const CARC = [[0.95, 0.95, 0.95], [0.12, 0.12, 0.13], [0.66, 0.67, 0.7], [0.75, 0.1, 0.1], [0.16, 0.26, 0.5], [0.85, 0.85, 0.8], [0.35, 0.36, 0.38], [0.92, 0.92, 0.92], [0.22, 0.4, 0.3]];
    let nCars = 0;
    const park = (x, y, z, rot) => { (R() < 0.22 ? utes : cars).add(x, y, z, rot, 1, 1, CARC[Math.floor(R() * CARC.length)]); nCars++; };
    for (const [x, y, z, rot] of kerbCars) { const q = near(x, z, 20); if (q.i < 0 || q.dd > barO(q.i, q.lat > 0 ? 1 : -1) - WA[q.i] + 4) park(x, y, z, rot); }
    {   // the car parks (OpenStreetMap's outlines): asphalt, the bays' white lines in double rows along the long side, cars in most bays
      const lg = new GB(), cpg = new Chunks(900, true);
      for (const cp of D.cp || []) {
        const ang = cp[0] / 1000, Pp = []; for (let k = 1; k < cp.length; k += 2) Pp.push([cp[k] / 2, cp[k + 1] / 2]);
        let cx = 0, cz = 0; for (const [x, z] of Pp) { cx += x / Pp.length; cz += z / Pp.length; }
        const tri = THREE.ShapeUtils.triangulateShape(Pp.map(([x, z]) => new THREE.Vector2(x, z)), []), y0 = groundH(cx, cz) + 0.045, ac = [0.8, 0.8, 0.82];
        const g = cpg.get(cx, cz); for (const [a, b, c] of tri) g.triO([Pp[a][0], y0, Pp[a][1]], [Pp[b][0], y0, Pp[b][1]], [Pp[c][0], y0, Pp[c][1]], ac, [cx, y0 - 5, cz], ac, ac, [Pp[a][0] / 6, -Pp[a][1] / 6], [Pp[b][0] / 6, -Pp[b][1] / 6], [Pp[c][0] / 6, -Pp[c][1] / 6]);
        const ux = Math.cos(ang), uz = Math.sin(ang); let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const [x, z] of Pp) { const u = x * ux + z * uz, v = -x * uz + z * ux; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
        const at = (u, v) => [u * ux - v * uz, u * uz + v * ux];
        for (let v = v0 + 2.8; v < v1 - 2.6; v += 16.4) for (const dv of [0, 5.4]) {
          const vv = v + dv; for (let u = u0 + 1.6; u < u1 - 1.4; u += 2.6) {
            const [x, z] = at(u, vv); if (!inPoly(Pp, x, z) || !inPoly(Pp, ...at(u, vv + (dv ? 2.6 : -2.6)))) continue;
            const [lx, lz] = at(u - 1.3, vv), [ex, ez] = at(u - 1.3, vv + (dv ? 2.7 : -2.7)); lg.quadUp([lx - ux * 0.05, y0 + 0.012, lz - uz * 0.05], [lx + ux * 0.05, y0 + 0.012, lz + uz * 0.05], [ex + ux * 0.05, y0 + 0.012, ez + uz * 0.05], [ex - ux * 0.05, y0 + 0.012, ez - uz * 0.05], [wl, wl, wl, wl]);
            if (R() < 0.68 && nCars < 1100) { const [px, pz] = at(u, vv + (dv ? 1.3 : -1.3)); park(px, y0, pz, -(ang + Math.PI / 2) + (R() - 0.5) * 0.06 + (R() < 0.5 ? Math.PI : 0)); } } }
      }
      out.carParks = (D.cp || []).length; addM(lg, matV, false); cpg.addTo(root, aMat, false, true);
    }

    /* ---- the water: Ross Creek, the river and the sea (OpenStreetMap), the shore band (mud, shallows) where the ground meets it; the open sea
       to the north-east under the haze ---- */
    {
      const WO = { len: 1.8, amp: 0.25, refl: 0.28, land: 0.5, shal: 0.4, lap: 0.2, surf: 0 }, wMat = waterMat(tex, Object.assign({ color: 0x4d6a5c }, WO)), g = new GB(true), W1 = [1, 1, 1];
      const U = (p) => [p[0] / 40, -p[1] / 40], P3 = (p, y) => [p[0], y, p[1]];
      for (const poly of D.wat) {
        const pr = (a) => { const o = []; for (let k = 0; k < a.length; k += 2) o.push([a[k], a[k + 1]]); return o; }, outer = pr(poly[0]), holes = poly.slice(1).map(pr);
        const tri = THREE.ShapeUtils.triangulateShape(outer.map(([x, z]) => new THREE.Vector2(x, z)), holes.map(h => h.map(([x, z]) => new THREE.Vector2(x, z)))), all = outer.concat(...holes);
        for (const [a, b, c] of tri) g.quadUp(P3(all[a], WY), P3(all[b], WY), P3(all[c], WY), P3(all[c], WY), [W1, W1, W1, W1], [U(all[a]), U(all[b]), U(all[c]), U(all[c])]);
      }
      const wm = new THREE.Mesh(g.geometry(), wMat); wm.receiveShadow = true; wm.matrixAutoUpdate = false; root.add(wm);
      const sd = waterline((i, j) => gyAt(i, j), GX0, GZ0, GC, 0, GNX - 1, 0, GNZ - 1, WY);
      const band = shoreBand(out.bounds.minX, out.bounds.minZ, out.bounds.maxX, out.bounds.maxZ, WY + 0.015, sd, 40, { F: 8 });
      addShore(root, band, wMat, WO); out.dyn.water = tex.water;
    }

    /* ---- the railway by the station (OpenStreetMap: the main line and the yard): two rails a track on the ballast; a train at the platform
       (stainless steel, generic) ---- */
    {
      const gr = new RB(); let best = null, bl = 0;
      for (const r of D.rail) {
        const P = []; for (let k = 0; k < r.length; k += 2) P.push([r[k] / 2, r[k + 1] / 2]);
        const pr = [-1, -1]; let len = 0;
        for (let k = 0; k < P.length; k++) {
          const [x, z] = P[k], a = P[Math.max(0, k - 1)], b = P[Math.min(P.length - 1, k + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
          const q = near(x, z, 12); if (q.i >= 0 && q.dd < 3) { pr[0] = pr[1] = -1; continue; }
          const y = groundH(x, z) + 0.12; if (k) len += Math.hypot(x - P[k - 1][0], z - P[k - 1][1]);
          for (const [m, o] of [[0, -0.72], [1, 0.72]]) { const rr = gr.row([[x + nx * (o - 0.04), y + 0.13, z + nz * (o - 0.04)], [x + nx * (o + 0.04), y + 0.13, z + nz * (o + 0.04)]], [[0.42, 0.4, 0.38], [0.6, 0.6, 0.62]]); if (pr[m] >= 0) gr.link(pr[m], rr, 0, 1); pr[m] = rr; }
        }
        let dmin = 1e9; for (const [x, z] of P) dmin = Math.min(dmin, Math.hypot(x + 420, z + 260));   // (the station: by Turn 3)
        if (len > 120 && dmin < bl - 0 || (len > 120 && !best)) { if (!best || dmin < bl) { best = P; bl = dmin; } }
      }
      addM(gr, matV);
      if (best) {   // a passenger train of four cars standing on the track nearest the station
        let m = 0, bd = 1e9; for (let k = 0; k < best.length; k++) { const d = Math.hypot(best[k][0] + 420, best[k][1] + 260); if (d < bd) { bd = d; m = k; } }
        const k1 = Math.min(best.length - 1, m + 1), k0 = Math.max(0, m - 1), h = Math.atan2(best[k1][1] - best[k0][1], best[k1][0] - best[k0][0]), [x, z] = best[m], y = groundH(x, z) + 0.6, ux = Math.cos(h), uz = Math.sin(h), gg = scen.get(x, z);
        const ss = [0.78, 0.8, 0.82], st = [0.2, 0.34, 0.56], gl = [0.18, 0.22, 0.26];
        for (let c = 0; c < 4; c++) { const o = (c - 1.5) * 22.6, cx = x + ux * o, cz = z + uz * o; if (near(cx, cz, 12).dd < 8) continue;
          box(gg, cx, y, cz, 22, 3.2, 2.9, h, ss, [0.7, 0.72, 0.74]); box(gg, cx, y + 1.3, cz, 22.05, 0.9, 2.95, h, gl, gl); box(gg, cx, y + 0.5, cz, 22.05, 0.25, 2.95, h, st, st); }
      }
    }

    /* ---- power poles along the streets (Australia: tall poles with a cross arm, the wires slung between them, a street light on every other
       one), the town's own lights; static, outside the barriers ---- */
    {
      const wire = new Chunks(512), poleC = [0.5, 0.47, 0.43], armC = [0.36, 0.33, 0.3];
      for (const S of ST) {
        if (S.circ || S.kind !== 0 || S.hw < 3.4 || S.hw > 7.5) continue;
        let acc = 18 + R() * 20, prev = null; const sd = S.k % 2 ? 1 : -1;
        for (let m = 0; m + 1 < S.P.length; m++) { const [ax, az] = S.P[m], [bx, bz] = S.P[m + 1], l = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / l, nz = (bx - ax) / l;
          for (let t = acc; t < l; t += 56) { const o = S.hw + 1.2, x = ax + (bx - ax) * t / l + nx * sd * o, z = az + (bz - az) * t / l + nz * sd * o, q = near(x, z, 20);
            if ((q.i >= 0 && q.dd < barO(q.i, q.lat > 0 ? 1 : -1) - WA[q.i] + 2) || onRoad(x, z, S.k, 0.3) || onBld(x, z)) { prev = null; continue; }
            const y = groundH(x, z), top = y + 10.5, a = Math.atan2(nz, nx), g = scenN.get(x, z), gw = wire.get(x, z);
            cyl(g, x, y, z, 0.16, 10.6, 4, poleC, null, 0.12); box(g, x, top - 0.6, z, 0.14, 0.14, 2.2, a - Math.PI / 2, armC);
            if ((Math.round(t) + m) % 2 === 0) { box(g, x - nx * sd * 1.1, y + 8.6, z - nz * sd * 1.1, 2.2, 0.08, 0.08, a, [0.4, 0.41, 0.43]); box(g, x - nx * sd * 2.2, y + 8.45, z - nz * sd * 2.2, 0.62, 0.16, 0.3, a, [0.5, 0.52, 0.54], [0.95, 0.92, 0.82]); }
            if (prev) for (const wo of [-0.9, 0, 0.9]) { const px = prev[0] - nz * wo, pz = prev[2] + nx * wo, cx = x - nz * wo, cz = z + nx * wo, ya = prev[1], yb = top - 0.62, sag = 0.7;
              const mx = (px + cx) / 2, mz = (pz + cz) / 2, my = (ya + yb) / 2 - sag;
              for (const [p1, p2] of [[[px, ya, pz], [mx, my, mz]], [[mx, my, mz], [cx, yb, cz]]]) gw.quadO([p1[0], p1[1], p1[2]], [p2[0], p2[1], p2[2]], [p2[0], p2[1] + 0.035, p2[2]], [p1[0], p1[1] + 0.035, p1[2]], [0.12, 0.12, 0.13], [mx, my - 3, mz]); }
            prev = [x, top - 0.62, z]; }
          acc = Math.max(0, acc - l) % 56; }
      }
      wire.addTo(root, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), false, false);
    }

    /* ---- the far view: Castle Hill (a granite dome over the town), the ranges to the south and west and Magnetic Island in the bay as a coarse
       terrain of the DEM, the sea round them, and the town's taller buildings beyond the area, drawn behind everything and pulled in onto a
       sphere just inside the camera's far plane (farUpdate), faded into the haze ---- */
    let FAR = null;
    {
      const P0 = [], C = [], I = [], HZ = [];
      const inner = (x, z, m) => x > out.bounds.minX + m && x < out.bounds.maxX - m && z > out.bounds.minZ + m && z < out.bounds.maxZ - m;
      const grid = (F, skip) => {   // a grid of the DEM (heights above the start line), its cells skipped where skip(x, z) for all four corners
        const Hh = (() => { const b = atob(F.b64), a = new Float32Array(b.length); for (let k = 0; k < b.length; k++) a[k] = F.lo + b.charCodeAt(k) * F.step; return a; })(), v0 = P0.length / 3;
        for (let j = 0; j < F.nz; j++) for (let i = 0; i < F.nx; i++) { const x = F.x0 + i * F.cell, z = F.z0 + j * F.cell, h = Hh[j * F.nx + i], sea = h <= WY - 0.5, d = Math.hypot(x, z);
          const granite = h > 12 && Math.hypot(x + 850, z + 1520) < 1400, k = clamp((h - 20) / 300, 0, 1);
          const hN = (di, dj) => Hh[clamp(j + dj, 0, F.nz - 1) * F.nx + clamp(i + di, 0, F.nx - 1)], sl = Math.hypot(hN(1, 0) - hN(-1, 0), hN(0, 1) - hN(0, -1)) / (2 * F.cell);   // (the slope)
          const vn = noise(x * 1.7, z * 1.7), scrub = granite ? clamp(1.2 - sl * 1.6 + (vn - 0.5) * 1.2, 0, 1) : 0;   // (the granite dome: bare pink rock on the steep faces, grey-green scrub in the gullies and on the gentler ground)
          const rock = [0.62 + (vn - 0.5) * 0.12, 0.47 + (vn - 0.5) * 0.08, 0.4], veg = WET ? [0.3, 0.38, 0.22] : [0.44, 0.43, 0.3];
          const col = sea ? [0.38, 0.55, 0.6] : granite ? [lerp(rock[0], veg[0], scrub), lerp(rock[1], veg[1], scrub), lerp(rock[2], veg[2], scrub)] : WET ? [lerp(0.33, 0.4, k), lerp(0.42, 0.44, k), lerp(0.24, 0.3, k)] : [lerp(0.5, 0.44, k), lerp(0.48, 0.44, k), lerp(0.32, 0.32, k)];
          P0.push(x, sea ? WY - 0.4 : h, z); C.push(col[0], col[1], col[2]); HZ.push(clamp((d - 1500) / 14000, 0, 1) * 0.5); }
        for (let j = 0; j + 1 < F.nz; j++) for (let i = 0; i + 1 < F.nx; i++) { const x = F.x0 + i * F.cell, z = F.z0 + j * F.cell;
          if (skip(x, z) && skip(x + F.cell, z) && skip(x, z + F.cell) && skip(x + F.cell, z + F.cell)) continue;
          const a = v0 + j * F.nx + i, b = a + 1, d2 = a + F.nx, e = d2 + 1; I.push(a, d2, b, b, d2, e); } };
      const Hp = D.far.hill, inHill = (x, z) => x >= Hp.x0 && x <= Hp.x0 + (Hp.nx - 1) * Hp.cell && z >= Hp.z0 && z <= Hp.z0 + (Hp.nz - 1) * Hp.cell;
      grid(D.far, (x, z) => inner(x, z, 200) || inHill(x, z));
      grid(Hp, (x, z) => inner(x, z, 120));
      // the taller buildings of the city (OpenStreetMap heights): boxes
      const quad = (a, b, cc, d, col) => { const v = P0.length / 3; for (const p of [a, b, cc, d]) { P0.push(p[0], p[1], p[2]); C.push(col[0], col[1], col[2]); HZ.push(0.1); } I.push(v, v + 1, v + 2, v, v + 2, v + 3); };
      for (const [x, z, Lb, Wb, ang, h] of D.sky) {
        const y0 = demH(clamp(x, out.bounds.minX, out.bounds.maxX), clamp(z, out.bounds.minZ, out.bounds.maxZ)) - 1, cs = Math.cos(ang), sn = Math.sin(ang), Pp = (u, v, y) => [x + cs * u - sn * v, y, z + sn * u + cs * v];
        const col = h > 30 ? vary([0.56, 0.66, 0.7], R, 0.18) : vary([0.84, 0.82, 0.78], R, 0.12), cr = [[-Lb / 2, -Wb / 2], [Lb / 2, -Wb / 2], [Lb / 2, Wb / 2], [-Lb / 2, Wb / 2]];
        for (let e = 0; e < 4; e++) { const [u0, v0] = cr[e], [u1, v1] = cr[(e + 1) % 4], kk = 0.82 + 0.18 * Math.abs(Math.cos(ang + e * Math.PI / 2 + 0.6)); quad(Pp(u0, v0, y0), Pp(u1, v1, y0), Pp(u1, v1, y0 + h), Pp(u0, v0, y0 + h), col.map(q => q * kk)); }
        quad(Pp(-Lb / 2, -Wb / 2, y0 + h), Pp(Lb / 2, -Wb / 2, y0 + h), Pp(Lb / 2, Wb / 2, y0 + h), Pp(-Lb / 2, Wb / 2, y0 + h), col.map(q => q * 0.9));
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P0), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3)); g.setAttribute('aHz', new THREE.BufferAttribute(new Float32Array(HZ), 1));
      g.setIndex(I); g.computeVertexNormals();
      const Uh = { uHz: { value: new THREE.Color(0xc9d8e6) } }, m = new THREE.MeshLambertMaterial({ vertexColors: true, fog: false });
      m.onBeforeCompile = (sh) => { sh.uniforms.uHz = Uh.uHz;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aHz;\nvarying float vHz;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHz = aHz;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uHz;\nvarying float vHz;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb = mix( gl_FragColor.rgb, uHz, vHz );'); };
      m.customProgramCacheKey = () => 'tsvFar';
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = -50; mesh.matrixAutoUpdate = false; mesh.name = 'tsvFar';
      mesh.onBeforeRender = (r, sc) => { if (sc && sc.fog) Uh.uHz.value.copy(sc.fog.color); };
      root.add(mesh); FAR = { mesh, P0: Float32Array.from(P0), HZ0: Float32Array.from(HZ), cx: 1e9, cy: 0, cz: 0, cf: 0 };
    }
    const farUpdate = (cam) => {   // (no camera: the far view in its own places, the world test's pose)
      const F = FAR, g = F.mesh.geometry, p = g.attributes.position.array, hz = g.attributes.aHz.array, P0 = F.P0;
      if (!cam) { if (F.cx !== 1e9) { p.set(P0); hz.set(F.HZ0); g.attributes.position.needsUpdate = g.attributes.aHz.needsUpdate = true; F.cx = 1e9; } return; }
      const c = cam.position; if (Math.abs(c.x - F.cx) + Math.abs(c.y - F.cy) + Math.abs(c.z - F.cz) < 9 && cam.far === F.cf) return;
      F.cx = c.x; F.cy = c.y; F.cz = c.z; F.cf = cam.far;
      const R0 = cam.far - 60, R1 = cam.far - 6;
      for (let v = 0, k = 0; k < P0.length; v++, k += 3) { const dx = P0[k] - c.x, dy = P0[k + 1] - c.y, dz = P0[k + 2] - c.z, Dd = Math.max(1, Math.hypot(dx, dy, dz)), r = R0 + (R1 - R0) * (1 - Math.exp(-Math.max(0, Dd - 400) / 3000)), f = r / Dd;
        p[k] = c.x + dx * f; p[k + 1] = c.y + dy * f; p[k + 2] = c.z + dz * f; hz[v] = F.HZ0[v] + 0.32 + 0.3 * (1 - Math.exp(-Math.max(0, Dd - 1500) / 5000)); }
      g.attributes.position.needsUpdate = true; g.attributes.aHz.needsUpdate = true;
    };
    farUpdate(null);

    /* ---- the street furniture: loose props (Core's PROPK) the cars knock over. At the junctions inside the barriers (the pockets of def.walls) the
       corners get an Australian junction: the signals on their posts at every corner (lanterns both ways, the pedestrian lantern and the
       button), mast arms over the big junction of Turn 2, the controller's cabinet, keep left signs on the islands' noses, give way signs on
       the quiet ones, bollards on the corners' tips, a bin and a street light; OpenStreetMap's signals, cabinets and give way signs where they
       stand inside the barriers ---- */
    const props = out.props, PQ = {};
    const prop = (kind, x, z, yaw, col) => { const q = T.query(x, z, -1, PQ); props.push({ kind, x, z, yaw: yaw || 0, col: col || 0, i: q.i }); };
    const free = (x, z, r) => { const q = near(x, z, 30); if (q.i < 0) return false; const bar = barO(q.i, q.lat > 0 ? 1 : -1), a = Math.abs(q.lat);
      return q.dd > 0.6 && a < bar - (r || 0.4) && !pitZone(x, z) && !onBld(x, z); };
    const cnt = {};
    const put = (kind, x, z, yaw, col) => { if (!free(x, z, kind === 'cabinet' ? 0.7 : 0.35)) return false; prop(kind, x, z, yaw, col); cnt[kind] = (cnt[kind] || 0) + 1; return true; };
    const F = {}; for (const k in D.furn) { const a = i16(D.furn[k]), o = []; for (let m = 0; m < a.length; m += 2) o.push([a[m] / 10, a[m + 1] / 10]); F[k] = o; }
    const nearPt = (arr, x, z, r) => (arr || []).some(([px, pz]) => (px - x) ** 2 + (pz - z) ** 2 < r * r);
    // OpenStreetMap's own signals, cabinets and signs inside the barriers
    for (const [x, z] of F.sig || []) put('tlight', x, z, R() * TAU);
    for (const [x, z] of F.cab || []) put('cabinet', x, z, R() * TAU);
    for (const [x, z] of (F.give || []).concat(F.stop || [])) put('sign', x, z, R() * TAU);
    let nJ = 0;
    for (const [a, b, sd, off] of def.walls) {
      if (off < 6) continue;
      const latS = (i) => WA[i] + CURB + 1.4;
      let sa = null, sb = null;
      for (let d = a - 4; d <= b + 4; d += 0.5) { const i = T.idx(sAt(d)), p = Pt(i, sd * latS(i), 0); if (onRoad(p[0], p[2], -1, 0)) { if (sa === null) sa = d; sb = d; } }
      if (sa === null) continue;   // (not a junction: a run-off)
      const sm = (sa + sb) / 2, im = T.idx(sAt(sm)), pm = Pt(im, sd * (WA[im] + CURB + 2), 0), sig = nearPt(F.sig, pm[0], pm[2], 60) || off >= 14;
      const corner = (d, dl) => { const i = T.idx(sAt(d)), o = sd * (WA[i] + CURB + dl), [x, z] = atSf(sAt(d), o); return [x, z, i]; };
      const across = Math.atan2(T.nz[im] * -sd, T.nx[im] * -sd), along = Math.atan2(T.tz[im], T.tx[im]);
      const room = (d) => barO(T.idx(sAt(d)), sd) - WA[T.idx(sAt(d))];
      if (sig) {
        const c1 = corner(sa - 1.6, 0.8), c2 = corner(sb + 1.6, 0.8);
        put('tlight', c1[0], c1[1], along + Math.PI / 2); put('tlight', c2[0], c2[1], along - Math.PI / 2);
        if (off >= 14) { const m1 = corner(sa + (sb - sa) * 0.3, Math.min(room(sm) - 2.5, 9)); put('signal', m1[0], m1[1], along); const m2 = corner(sa + (sb - sa) * 0.7, Math.min(room(sm) - 2.5, 9)); put('tlight', m2[0], m2[1], across); }   // (a mast arm over the far legs; a post on the island between them)
        const k1 = corner(sa - 4.2, 2.2); put('cabinet', k1[0], k1[1], along);
        const s2 = corner(sb + 5.5, 0.9); put('sign', s2[0], s2[1], along);
      } else { for (const [d, dl] of [[sa - 1.4, 1.0], [sb + 1.4, 1.0]]) { const p = corner(d, dl); put('sign', p[0], p[1], across + Math.PI / 2); } }
      for (const [d, dl] of [[sa - 0.6, 0.35], [sb + 0.6, 0.35], [sa - 2.6, 0.35], [sb + 2.6, 0.35]]) { const p = corner(d, dl); put('bollard', p[0], p[1], 0); }
      if (room(sm) > 9) for (let d = sa + 3; d <= sb - 3; d += 7) { const p = corner(d, room(d) * 0.55); put(R() < 0.5 ? 'sign' : 'bollard', p[0], p[1], across); }   // (the islands' noses: keep left signs and bollards)
      { const p = corner(sb + 8.5, 0.7); put('lamp', p[0], p[1], across); }
      { const p = corner(sa - 7, 1.8); if (R() < 0.7) put('bin', p[0], p[1], R() * TAU); }
      // the crossing over the side road's mouth: two white lines along the circuit's footpath line (a signalised crossing), or a zebra
      if (sb - sa < 26) for (let d = sa + 0.4; d < sb - 0.4; d += sig ? 0.5 : 1.1) { const i = T.idx(sAt(d)), o0 = WA[i] + CURB + 0.2, o1 = o0 + 3;
        if (sig) { strip(sAt(d), sAt(d + 0.5), sd * o0, sd * (o0 + 0.15), wl, 0.036); strip(sAt(d), sAt(d + 0.5), sd * (o1 - 0.15), sd * o1, wl, 0.036); } else strip(sAt(d), sAt(d + 0.55), sd * o0, sd * o1, wl, 0.036); }
      // the side road beyond the fence: its stop line and the crossing (two lines) where the street leaves the pocket
      for (let d = sa; d <= sb; d += 1) { const i = T.idx(sAt(d)), o = barO(i, sd) + 2.5, [x, z] = atSf(sAt(d), sd * o), st = streetAt(x, z); if (!st || st.used) continue; st.used = true;
        const { ux, uz, hw, y } = st, dirOut = Math.sign((x - T.px[i]) * ux + (z - T.pz[i]) * uz) || 1, vx = -uz, vz = ux, Lq = (a0, a1, b0, b1, c) => { const P4 = [[a0, b0], [a1, b0], [a1, b1], [a0, b1]].map(([a, b]) => [x + ux * dirOut * a + vx * b, y + 0.05, z + uz * dirOut * a + vz * b]); lineG.quadUp(P4[0], P4[1], P4[2], P4[3], [c, c, c, c]); };
        Lq(1.0, 1.15, -hw + 0.3, hw - 0.3, wl); Lq(3.6, 3.75, -hw + 0.3, hw - 0.3, wl); Lq(4.4, 4.75, -hw + 0.3, 0, wl); Lq(4.4, 4.75, 0, hw - 0.3, wl); }
      nJ++;
    }
    // the bus stops on Boundary Street by the school (a sign at the kerb) and OpenStreetMap's where they are inside the barriers
    for (const [x, z] of F.bus || []) put('sign', x, z, R() * TAU);
    out.propStats = Object.assign({ junctions: nJ }, cnt);

    /* ---- the grandstands (steel stands behind the fence, a canopy over the back rows): along the start straight opposite the pits, outside Turn 2,
       by the chicane and outside the hairpin; packed with fans (the crowd picture); spectators on the grass in the park elsewhere ---- */
    const CR = crowdCtx({ gH: groundH, near: (x, z) => near(x, z, 40).dd, maxSlope: 0.8 });
    CR.excluded = (x, z) => onBld(x, z) || inWater(x, z);
    CR.water = (x, z) => inWater(x, z);
    const STANDS = [[-215, 30, -1, 2.4, 15, 1], [450, 520, -1, 2.4, 12, 0], [1640, 1700, -1, 2.2, 12, 0], [2150, 2260, -1, 2.4 + 12, 13, 1], [2330, 2440, 1, 2.4, 12, 0]];   // [from, to, side, metres past the barrier, depth, roof]
    {
      const gs = new GB(), gc = new RB(true), stC = [0.58, 0.6, 0.64], stD = [0.44, 0.46, 0.5], stT = [0.7, 0.72, 0.76], roofC = [0.86, 0.88, 0.9], roofU = [0.66, 0.68, 0.72];
      for (const [d0, d1, sd, f0, depth, roof] of STANDS) {
        let prev = null, pc = -1;
        for (let d = d0; d <= d1; d += 3) {
          const s = sAt(d), q = Object.assign({}, crAt(s)), front = (sd > 0 ? q.br : q.bl) + f0, P2 = (o, h) => [q.px + q.nx * sd * o, h, q.pz + q.nz * sd * o];
          const y0 = groundH(q.px + q.nx * sd * front, q.pz + q.nz * sd * front) - 0.1, top = y0 + 1.3 + depth * 0.5;
          const cs = [P2(front, y0), P2(front, y0 + 1.3), P2(front + 1.0, y0 + 1.3), P2(front + depth, top), P2(front + depth, y0)];
          if (prev) { const inn = P2(front + depth / 2, y0 + 1); for (let m = 0; m < 4; m++) gs.quadO(prev.cs[m], prev.cs[m + 1], cs[m + 1], cs[m], m === 2 ? stT : m === 1 ? stC : stD, inn); }
          else { const inn = P2(front + depth / 2, y0 + 1); gs.quadO(cs[0], cs[1], cs[3], cs[4], stD, [inn[0] + q.tx * 3, inn[1], inn[2] + q.tz * 3]); }
          const cp = [P2(front + 1.1, y0 + 1.37), P2(front + depth - 0.2, top + 0.02)], u = s / 12, cuv = [[u, 0.004], [u, 0.996 * Math.min(1, depth / 15)]];
          const rc = gc.row(sd > 0 ? cp : cp.slice().reverse(), [[1, 1, 1], [1, 1, 1]], sd > 0 ? cuv : cuv.slice().reverse()); if (pc >= 0) gc.link(pc, rc, 0, 1); pc = rc;
          if (roof) { const rp = [P2(front + depth + 0.3, top + 3.6), P2(front + depth * 0.45, top + 2.7)], rcol = Math.round(d / 3) % 4 === 0 ? roofU : roofC;
            if (prev && prev.rp) { gs.quadO(prev.rp[0], prev.rp[1], rp[1], rp[0], rcol, P2(front + depth / 2, top - 5)); gs.quadO(prev.rp[0], prev.rp[1], rp[1], rp[0], [0.4, 0.41, 0.44], P2(front + depth / 2, top + 9)); }
            if (Math.round(d / 3) % 4 === 0) { const [bx, , bz] = P2(front + depth - 0.3, 0); box(scen.get(bx, bz), bx, y0, bz, 0.4, top + 3.6 - y0, 0.4, q.tx ? Math.atan2(q.tz, q.tx) : 0, [0.8, 0.81, 0.84]); }
            prev = { cs, rp }; } else prev = { cs };
          const [cx, , cz] = P2(front + depth / 2, 0); CR.exclAdd(cx, cz, depth / 2 + 2); for (let o = front - 1; o < front + depth + 1; o += 4) { const [x, , z] = P2(o, 0); bldMark(x, z); }
        }
        if (prev) { const qe = crAt(sAt(d1)), inn = [prev.cs[2][0] - qe.tx * 3, prev.cs[2][1], prev.cs[2][2] - qe.tz * 3]; gs.quadO(prev.cs[0], prev.cs[1], prev.cs[3], prev.cs[4], stD, inn); }
      }
      addM(gs, matV, true); addM(gc, crowdUV(new THREE.MeshLambertMaterial({ map: tex.crowd, vertexColors: true }), 1, 0.06, 0.06));
    }
    /* ---- along the fences in the park: the grass worn by the fans' feet (a band 0.6-4.5 m past the fence); the marshals' posts (a hut, a
       marshal in orange, the flag), TV camera towers at Turns 2, 7 and 11; tyre bundles at the ends of the walls by the junctions (loose props) ---- */
    {
      const gw = new RB(), worn = WET ? [0.5, 0.52, 0.32] : [0.66, 0.6, 0.42];
      for (const sd of [-1, 1]) { let pr = -1;
        for (let i = 0; i <= N; i++) { const ii = i % N, b = barO(ii, sd), a0 = Pt(ii, sd * (b + 0.65), 0), a1 = Pt(ii, sd * (b + 4.5), 0), c = lcAt(a1[0], a1[2]);
          if ((c !== 1 && c !== 2) || onRoad(a1[0], a1[2], -1, 1) || pitZone(a1[0], a1[2]) || inWater(a1[0], a1[2])) { pr = -1; continue; }
          a0[1] = groundH(a0[0], a0[2]) + 0.03; a1[1] = groundH(a1[0], a1[2]) + 0.03; const n = 0.94 + noise(a1[0], a1[2]) * 0.12, cc = worn.map(v => v * n), cg = gCol(a1[0], a1[2]);
          let pp = [a0, a1], cl = [cc, cg]; if (sd < 0) { pp = pp.reverse(); cl = cl.reverse(); }
          const r = gw.row(pp, cl); if (pr >= 0) gw.link(pr, r, 0, 1); pr = r; } }
      addM(gw, matV, false);
      const g = scen, OR = [0.98, 0.48, 0.1];
      for (let d = 120; d < L - 60; d += 190) {   // the marshals' posts
        const i = T.idx(sAt(d)), sd = T.k[i] > 0 ? -1 : 1, b = barO(i, sd); if (b - WA[i] > 4 || gapAt(i, sd)) continue;
        const [x, z] = atSf(sAt(d), sd * (b + 2.4)), y = groundH(x, z), h = Math.atan2(T.tz[i], T.tx[i]), gg = g.get(x, z); if (onBld(x, z) || inWater(x, z) || onRoad(x, z, -1, 0.5)) continue;
        box(gg, x, y, z, 2.2, 2.3, 1.6, h, [0.92, 0.92, 0.9], [0.95, 0.45, 0.12]); box(gg, x - T.nx[i] * sd * 1.3, y, z - T.nz[i] * sd * 1.3, 0.45, 1.75, 0.35, h, OR, [0.9, 0.75, 0.6]);
        box(gg, x + T.tx[i] * 1.4, y, z + T.tz[i] * 1.4, 0.05, 2.6, 0.05, 0, [0.5, 0.5, 0.52]); box(gg, x + T.tx[i] * 1.7, y + 2.05, z + T.tz[i] * 1.7, 0.6, 0.45, 0.02, h, [0.95, 0.85, 0.1]); bldMark(x, z); }
      for (const d of [700, 1700, 2300]) {   // the TV towers: scaffolding, a platform with a roof, the camera and its operator
        const i = T.idx(sAt(d)), sd = T.k[i] > 0 ? -1 : 1, b = barO(i, sd), [x, z] = atSf(sAt(d), sd * (b + 5)), y = groundH(x, z), h = Math.atan2(T.tz[i], T.tx[i]), gg = g.get(x, z), st = [0.66, 0.67, 0.7];
        if (onBld(x, z) || inWater(x, z)) continue;
        for (const [a, c] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) box(gg, x + Math.cos(h) * a * 1.1 - Math.sin(h) * c * 1.1, y, z + Math.sin(h) * a * 1.1 + Math.cos(h) * c * 1.1, 0.1, 6.2, 0.1, 0, st);
        for (const yy of [2, 4]) box(gg, x, y + yy, z, 2.4, 0.08, 2.4, h, st); box(gg, x, y + 6.2, z, 2.6, 0.12, 2.6, h, [0.5, 0.5, 0.52]); box(gg, x, y + 8.4, z, 2.8, 0.1, 2.8, h, [0.2, 0.22, 0.26], [0.9, 0.9, 0.9]);
        box(gg, x - T.nx[i] * sd * 0.6, y + 6.3, z - T.nz[i] * sd * 0.6, 0.5, 1.7, 0.4, h, [0.15, 0.3, 0.6]); box(gg, x - T.nx[i] * sd * 0.6, y + 7.1, z - T.nz[i] * sd * 0.6, 0.7, 0.45, 0.4, h, [0.12, 0.12, 0.13]); bldMark(x, z); }
      for (const [a, b, sd, off] of def.walls) {   // tyre bundles where a wall steps back (the cars meet its end first)
        if (off < 6) continue;
        for (const [d, dir] of [[a - 3, 1], [b + 3, -1]]) { const i = T.idx(sAt(d)), bb = barO(i, sd), wi = WA[i]; if (bb - wi < 1.6) continue;
          for (let k = 0; k < 3; k++) { const [x, z] = atSf(sAt(d + dir * k * 0.9), sd * (bb - 0.55 - (k === 2 ? 0.95 : 0))); prop('tstack', x, z, 0, 1); } }
      }
    }

    /* ---- the race's village in the park: white marquees (pyramid roofs and long ones), food vans, rows of portable toilets, umbrellas, on the
       lawns 25-140 m off the track (static) ---- */
    {
      const g = scen, wh = [0.95, 0.95, 0.94], whS = [0.82, 0.83, 0.84], FV = [[0.95, 0.95, 0.93], [0.86, 0.2, 0.16], [0.18, 0.4, 0.7], [0.96, 0.76, 0.16]];
      let nV = 0;
      const okV = (x, z, r) => { if (lcAt(x, z) !== 1 || onBld(x, z) || inWater(x, z) || pitZone(x, z) || onRoad(x, z, -1, 2)) return false; const q = near(x, z, 150); return q.i >= 0 && q.dd > barO(q.i, q.lat > 0 ? 1 : -1) - WA[q.i] + 6 + r && q.dd < 140; };
      for (let k = 0; k < 900 && nV < 70; k++) {
        const i = Math.floor(R() * N), sd = R() < 0.5 ? -1 : 1, o = barO(i, sd) + 10 + R() * 90, x = T.px[i] + T.nx[i] * sd * o, z = T.pz[i] + T.nz[i] * sd * o, a = Math.atan2(T.tz[i], T.tx[i]), u = R();
        if (!okV(x, z, 6)) continue;
        const y = groundH(x, z) - 0.05, gg = g.get(x, z);
        if (u < 0.45) {   // a marquee 6 x 6 (or 3 x 3), white walls half up, a pyramid roof
          const hs = u < 0.3 ? 3 : 1.5, c = Math.cos(a), sn = Math.sin(a), Pq = (lx, lz, yy) => [x + lx * c - lz * sn, yy, z + lx * sn + lz * c], top = Pq(0, 0, y + 2.4 + hs * 0.7);
          for (const [ax, az, bx, bz] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) { gg.triO(Pq(ax * hs, az * hs, y + 2.4), Pq(bx * hs, bz * hs, y + 2.4), top, wh, [x, y, z]); gg.quadO(Pq(ax * hs, az * hs, y + 1.2), Pq(bx * hs, bz * hs, y + 1.2), Pq(bx * hs, bz * hs, y + 2.4), Pq(ax * hs, az * hs, y + 2.4), whS, [x, y + 1.8, z]); }
          for (const [ax, az] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const p = Pq(ax * hs, az * hs, y); box(gg, p[0], y, p[2], 0.08, 2.4, 0.08, 0, [0.7, 0.71, 0.73]); }
          bldMark(x, z); nV++;
        } else if (u < 0.65) {   // a long marquee 10 x 20 with a gabled roof (the hospitality)
          if (!okV(x + Math.cos(a) * 10, z + Math.sin(a) * 10, 6) || !okV(x - Math.cos(a) * 10, z - Math.sin(a) * 10, 6)) continue;
          box(gg, x, y, z, 20, 2.6, 10, a, whS, wh); W.gable(gg, x, y + 2.6, z, 20.2, 10.2, 1.8, a, wh, whS); for (let t = -9; t <= 9; t += 6) bldMark(x + Math.cos(a) * t, z + Math.sin(a) * t); nV++;
        } else if (u < 0.82) {   // food vans in a row, an awning out
          for (let m = 0; m < 3; m++) { const px = x + Math.cos(a) * m * 6, pz = z + Math.sin(a) * m * 6, col = FV[Math.floor(R() * FV.length)]; if (!okV(px, pz, 3)) continue; box(gg, px, y + 0.3, pz, 5, 2.4, 2.3, a, col, [0.9, 0.9, 0.9]); box(gg, px - Math.sin(a) * 1.6, y + 2.3, pz + Math.cos(a) * 1.6, 4, 0.08, 1.2, a, [0.86, 0.85, 0.8]); bldMark(px, pz); }
          nV++;
        } else {   // portable toilets: a row of blue boxes
          for (let m = 0; m < 6; m++) { const px = x + Math.cos(a) * m * 1.3, pz = z + Math.sin(a) * m * 1.3; box(gg, px, y, pz, 1.15, 2.3, 1.15, a, [0.16, 0.36, 0.66], [0.85, 0.86, 0.88]); }
          bldMark(x, z); nV++;
        }
      }
      out.village = nV;
    }
    for (const [d0, d1, sd, rows, dens] of [[1060, 1140, 1, 3, 0.5], [1300, 1380, 1, 3, 0.55], [1440, 1520, -1, 3, 0.5], [1720, 1780, 1, 3, 0.45], [1960, 2060, 1, 3, 0.45], [2080, 2140, -1, 3, 0.5], [700, 780, 1, 2, 0.4]])
      crowdRun(CR, sAt(d0), sAt(d0) + (d1 - d0), sd, { rows, dens, first: 1.1, below: 1.2, above: 2, minClear: 1.4 });

    /* ---- the banners on the fences (the city, the state, the country, the region) and the turn numbers' boards ---- */
    const atlas = (() => { const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d');
      const B = [['TOWNSVILLE', '#7a1f2b', '#ffffff', '#f0b323'], ['QUEENSLAND', '#f4f2ec', '#7a1f2b', '#7a1f2b'], ['AUSTRALIA', '#0a6b3d', '#ffd23c', '#ffd23c'], ['NORTH QUEENSLAND', '#14365e', '#ffffff', '#f0b323']];
      B.forEach(([t, bg, fg, ac], k) => { const y0 = k * 64; x.fillStyle = bg; x.fillRect(0, y0, 1024, 64); x.fillStyle = ac; x.fillRect(0, y0 + 56, 1024, 8);
        x.fillStyle = fg; x.font = '900 36px "Russo One", "Arial Black", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; for (const cx of [256, 768]) x.fillText(t, cx, y0 + 30); });
      for (let n = 1; n <= 13; n++) { const cx = ((n - 1) % 8) * 128, cy = 256 + Math.floor((n - 1) / 8) * 128; x.fillStyle = '#f4f2ec'; x.fillRect(cx + 4, cy + 4, 120, 120); x.fillStyle = '#16171a'; x.fillRect(cx + 10, cy + 10, 108, 108);
        x.fillStyle = '#f4f2ec'; x.font = '900 72px "Russo One", "Arial Black", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n), cx + 64, cy + 68); }
      return ownTex(new THREE.CanvasTexture(c)); })();
    const ban = new GB(true);
    for (let d = 40; d < L - 40; d += 9) {
      const i = T.idx(sAt(d)); if (Math.abs(T.k[i]) > 1 / 120) continue;
      const k = Math.floor(d / 9) % 4, sd = (Math.floor(d / 36) % 2) ? 1 : -1; if (gapAt(i, sd)) continue;
      const j = T.idx(sAt(d + 7.6)), bi = barO(i, sd), bj = barO(j, sd); if (Math.abs(bi - bj) > 0.3 || bi - WA[i] > 3) continue;
      const v0 = 1 - (k + 1) * 0.125 + 0.004, v1 = 1 - k * 0.125 - 0.004, A = Pt(i, sd * (bi + 0.28), 1.05), Bq = Pt(j, sd * (bj + 0.28), 1.05), Cq = Pt(j, sd * (bj + 0.28), 2.0), Dq = Pt(i, sd * (bi + 0.28), 2.0), inn = Pt(i, sd * (bi + 3), 1.5);
      ban.quadO(A, Bq, Cq, Dq, [1, 1, 1], inn, sd > 0 ? [[0.5, v0], [0, v0], [0, v1], [0.5, v1]] : [[0, v0], [0.5, v0], [0.5, v1], [0, v1]]);
    }
    def.turns.forEach(([tx, tz], k) => {   // the turn's number on a board 40 m before it, on the outside
      const it = T.nearestIdx(tx, tz), sb = it * ds - 40, i = T.idx(sb), sd = T.k[it] > 0 ? -1 : 1, b0 = barO(i, sd), p = Pt(i, sd * (b0 + 0.8), 0), y = groundH(p[0], p[2]);
      const u0 = (k % 8) / 8, v0 = 0.5 - Math.floor(k / 8) * 0.25 - 0.25, fx = -T.tx[i], fz = -T.tz[i], hw = 0.6, nx = T.nx[i], nz = T.nz[i];
      ban.quadO([p[0] - nx * hw, y + 2.2, p[2] - nz * hw], [p[0] + nx * hw, y + 2.2, p[2] + nz * hw], [p[0] + nx * hw, y + 3.4, p[2] + nz * hw], [p[0] - nx * hw, y + 3.4, p[2] - nz * hw], [1, 1, 1], [p[0] - fx, y + 2.8, p[2] - fz],
        [[u0 + 0.125, v0], [u0, v0], [u0, v0 + 0.25], [u0 + 0.125, v0 + 0.25]]);
      box(scenN.get(p[0], p[2]), p[0] - fx * 0.05, y, p[2] - fz * 0.05, 0.1, 3.4, 0.1, 0, [0.4, 0.41, 0.44]);
    });

    /* ---- benches and bus shelters (OpenStreetMap's, and a shelter by each bus stop sign) outside the barriers: static ---- */
    {
      const g = scenN; const sh = (x, z, a) => { const y = groundH(x, z), gg = g.get(x, z); box(gg, x, y + 2.3, z, 3.6, 0.1, 1.8, a, [0.62, 0.64, 0.66], [0.82, 0.84, 0.86]); for (const o of [-1.6, 1.6]) box(gg, x + Math.cos(a) * o, y, z + Math.sin(a) * o, 0.1, 2.3, 0.1, 0, [0.5, 0.52, 0.55]);
        box(gg, x - Math.sin(a) * 0.8, y, z + Math.cos(a) * 0.8, 3.4, 2.2, 0.06, a, [0.62, 0.7, 0.74]); box(gg, x, y + 0.45, z, 2.6, 0.06, 0.5, a, [0.46, 0.32, 0.2]); bldMark(x, z); };
      for (const [x, z] of F.bus || []) { const q = near(x, z, 30); if (q.i >= 0 && Math.abs(q.lat) < barO(q.i, q.lat > 0 ? 1 : -1) + 2) continue; sh(x, z, R() * TAU); }
      for (const [x, z] of F.bench || []) { const q = near(x, z, 30); if (q.i >= 0 && Math.abs(q.lat) < barO(q.i, q.lat > 0 ? 1 : -1) + 1.2) continue; const a = R() * TAU, y = groundH(x, z), gg = g.get(x, z); box(gg, x, y + 0.42, z, 1.8, 0.06, 0.45, a, [0.46, 0.32, 0.2]); }
    }

    /* ---- finish the meshes ---- */
    matV.name = 'tsvV'; aMat.name = 'tsvAsph'; gMat.name = 'tsvGround'; fMat.name = 'tsvFence'; facMats.forEach((m, k) => { m.name = 'tsvFac' + k; }); tMat.name = 'tsvTree';
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true); scenN.addTo(sceneryGroup, matV, false, true);
    fac.forEach((ch, k) => ch.addTo(sceneryGroup, facMats[k], k === 2, true));   // (the walls of the low buildings cast no shadow of their own: their roofs do)
    addM(lineG, new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
    addM(ban, new THREE.MeshLambertMaterial({ map: atlas }), false);
    posts.addTo(root, true);
    TCH.forEach((c, k) => { c.addTo(root, k < 3); }); TCF.forEach((c) => { c.addTo(root, false); });
    cars.addTo(root, false); utes.addTo(root, false);
    crowdFinish(CR, root, out);
    out.dyn.ext = (t, car, cam) => { farUpdate(car ? cam : null); };
    out.stats = { buildings: nBld, trees: nTrees, cars: nCars, streets: nStreet, hydrants: nHyd, props: props.length, junctions: nJ, crowd: out.crowdN };   // (read by the tests)
    return out;
  };
})();
