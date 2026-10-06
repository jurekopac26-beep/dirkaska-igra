/* World of the Toronto street circuit (theme 'toronto'), built in a file of its own: World.ext.toronto(scene, tex, opts, api), called by
   World.build for this theme (api: the shared helpers of world.js, see extAPI there). The exhibition grounds by Lake Ontario on a July
   afternoon: the real ground (def.tor.g: USGS 3DEP), the land cover (def.tor.lc: OpenStreetMap areas over ESA WorldCover), the streets,
   sidewalks and car parks round the circuit, the buildings in their real outlines and heights (def.tor.bld), the trees (def.tor.trees), the
   lake with the islands and the marina, the elevated expressway, the railway and the streetcar loop, the skyline of the city on the horizon
   (def.tor.sky), all from OpenStreetMap. The circuit: concrete blocks with catch fences, set back into the mouths of the side roads at the
   junctions, whose corners keep the city's street furniture (traffic signals on their poles and mast arms, lights, signs, hydrants, bins,
   cabinets, bollards, bus shelters): all of it loose props the cars knock over (Core's PROPK). No names of the events, the stadium, sponsors
   or firms anywhere: the banners name the city and the province only; the landmarks (the old gates, the dome, the tower) are generic. */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.ext) return;
  World.ext.toronto = function (scene, tex, opts, W) {
    const { T, GB, RB, Chunks, IChunks, box, cyl, cone, ico, puff, hex, vary, rng, clamp, lerp, sstep, TAU, atSf, crAt, inPoly, crowdCtx, crowdRun, crowdFinish, crowdUV,
      waterMat, shoreBand, waterline, addShore } = W;
    const R = rng(2874), N = T.N, ds = T.ds, def = T.def, D = def.tor, L = T.len, sStart = T.startS, w = T.w, WA = T.wa || new Float64Array(N).fill(w);
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, props: [], ownTex: [], farClip: true, propR: 170, winMaps: [] };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    const dS = (s) => { let d = s - sStart; d = ((d % L) + L) % L; return d > L / 2 ? d - L : d; };   // metres from the start line (-L/2 .. L/2)
    const sAt = (d) => (((sStart + d) % L) + L) % L;
    const H2 = (a) => { const o = []; for (let k = 0; k < a.length; k += 2) o.push([a[k] / 2, a[k + 1] / 2]); return o; };   // half-metre pairs -> [x, z]

    /* ---- the data: the ground's heights (16 m, 0.1 m steps), the land cover (6 m cells, run-length coded) ---- */
    const GD = D.g, GZ = (() => { const b = atob(GD.b64), a = new Float32Array(b.length); for (let k = 0; k < b.length; k++) a[k] = GD.lo + b.charCodeAt(k) * GD.step; return a; })();
    const demH = (x, z) => { const gx = clamp((x - GD.x0) / GD.cell, 0, GD.nx - 1.001), gz = clamp((z - GD.z0) / GD.cell, 0, GD.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, n = GD.nx;
      return (GZ[j * n + i] * (1 - u) + GZ[j * n + i + 1] * u) * (1 - v) + (GZ[(j + 1) * n + i] * (1 - u) + GZ[(j + 1) * n + i + 1] * u) * v; };
    const LCD = D.lc, LCA = (() => { const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', dg = new Int8Array(128); for (let k = 0; k < 64; k++) dg[A.charCodeAt(k)] = k;
      const s = LCD.rle, a = new Uint8Array(LCD.nx * LCD.nz); let p = 0, k = 0;
      while (k < s.length && p < a.length) { const c = dg[s.charCodeAt(k++)], cl = c >> 3; let r = (c & 7) + 1; if (r === 8) { for (;;) { const d = dg[s.charCodeAt(k++)]; r += d; if (d < 63) break; } } a.fill(cl, p, p + r); p += r; }
      return a; })();
    const lcAt = (x, z) => { const i = Math.floor((x - LCD.x0) / LCD.cell), j = Math.floor((z - LCD.z0) / LCD.cell); return i < 0 || j < 0 || i >= LCD.nx || j >= LCD.nz ? 3 : LCA[j * LCD.nx + i]; };   // (outside: the lake)
    const WY = -6.3;   // the lake's surface above the start line (74.9 m a.s.l. in the model)

    /* ---- the nearest sample of the circuit (an 8 m hash of the samples): i, the signed offset lat (+ right), dd = metres past the asphalt's edge ---- */
    const NH = new Map(), NHC = 8;
    for (let i = 0; i < N; i++) { const k = Math.floor(T.px[i] / NHC) * 4096 + Math.floor(T.pz[i] / NHC); let Lc = NH.get(k); if (!Lc) NH.set(k, Lc = []); Lc.push(i); }
    const NQ = { i: -1, lat: 0, dd: 1e9, d2: 1e18 };
    const near = (x, z, rad) => {   // within rad m (default 40): else i = -1
      const r = Math.ceil((rad || 40) / NHC), cx = Math.floor(x / NHC), cz = Math.floor(z / NHC); let bi = -1, bd = 1e18;
      for (let a = cx - r; a <= cx + r; a++) for (let b = cz - r; b <= cz + r; b++) { const Lc = NH.get(a * 4096 + b); if (Lc) for (const i of Lc) { const dx = x - T.px[i], dz = z - T.pz[i], d = dx * dx + dz * dz; if (d < bd) { bd = d; bi = i; } } }
      NQ.i = bi; NQ.d2 = bd; if (bi < 0) { NQ.lat = 0; NQ.dd = 1e9; return NQ; }
      NQ.lat = (x - T.px[bi]) * T.nx[bi] + (z - T.pz[bi]) * T.nz[bi]; NQ.dd = Math.abs(NQ.lat) - WA[bi]; return NQ; };

    // within ~200 m of the circuit (a 64 m grid): what lies farther is too far off for either camera to show its small details (the streets' lines)
    const NEAR200 = new Set(); for (let i = 0; i < N; i += 2) { const cx = Math.floor(T.px[i] / 64), cz = Math.floor(T.pz[i] / 64); for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) if (a * a + b * b <= 10) NEAR200.add((cx + a) * 4096 + cz + b); }
    const in200 = (x, z) => NEAR200.has(Math.floor(x / 64) * 4096 + Math.floor(z / 64));

    /* ---- the ground: the real terrain, pulled to the road's height along the circuit (level with it to 4 m past the edge, blended out by 30 m) ---- */
    const groundH = (x, z) => {
      let h = demH(x, z); const q = near(x, z, 40);
      if (q.i >= 0) { const bar = q.lat > 0 ? T.br[q.i] : T.bl[q.i], f = sstep(Math.max(4, bar - WA[q.i] + 1.5), 30, q.dd); h = lerp(T.hy[q.i] - 0.02, h, f); }
      return h;
    };
    out.groundH = groundH; out.camFloor = groundH;
    out.propFloor = (q) => groundH(q.x, q.z) - (T.hasElev ? T.elevAt(q.s).y : 0);   // (the props: where they stand off the road, the ground's height)
    out.bounds = { minX: GD.x0, maxX: GD.x0 + (GD.nx - 1) * GD.cell, minZ: GD.z0, maxZ: GD.z0 + (GD.nz - 1) * GD.cell };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const addM = (g, mat, cast, grp) => { if (!g || g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; (grp || root).add(m); return m; };
    // a neutral grey grit for the ground (the vertex colours make it grass, concrete, asphalt, sand)
    const gritTex = (() => { const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), img = g.createImageData(S, S), r = rng(77);
      for (let k = 0; k < S * S; k++) { const v = 200 + (r() - 0.5) * 46 + (r() < 0.04 ? -40 : 0); img.data[k * 4] = img.data[k * 4 + 1] = img.data[k * 4 + 2] = clamp(v, 0, 255); img.data[k * 4 + 3] = 255; }
      g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return ownTex(t); })();
    const noise = W.valueNoise2(31, 26), noise2 = W.valueNoise2(57, 90);
    // land-cover colours: 0 paved (concrete), 1 lawn, 2 lawn under trees, 3 lake bed, 4 sand, 5 car park (asphalt), 6 sports pitch, 7 rail ballast
    const LCC = [[0.66, 0.66, 0.64], [0.4, 0.55, 0.24], [0.33, 0.47, 0.21], [0.42, 0.44, 0.36], [0.86, 0.79, 0.6], [0.36, 0.36, 0.37], [0.3, 0.58, 0.24], [0.46, 0.42, 0.38]];
    const gCol = (x, z) => {   // the ground's colour at a vertex: the four cells round it blended
      const c = [0, 0, 0]; let pitch = 0;
      for (const [ox, oz] of [[-4, -4], [4, -4], [-4, 4], [4, 4], [0, 0]]) { const k = lcAt(x + ox, z + oz), C = LCC[k]; c[0] += C[0] / 5; c[1] += C[1] / 5; c[2] += C[2] / 5; if (k === 6) pitch++; }
      const n = 0.9 + noise(x, z) * 0.16 + (noise2(x, z) - 0.5) * 0.12;
      if (pitch) { const st = (Math.floor((x * 0.6 + z * 0.8) / 7) & 1) ? 1.06 : 0.94; c[0] *= st; c[1] *= st; c[2] *= st; }   // (mown stripes on the pitches)
      return [c[0] * n, c[1] * n, c[2] * n];
    };
    const inLake = (x, z) => lcAt(x, z) === 3;
    const GC = 10, GX0 = LCD.x0, GZ0 = LCD.z0, GNX = Math.floor(LCD.nx * LCD.cell / GC) + 1, GNZ = Math.floor(LCD.nz * LCD.cell / GC) + 1, GY = new Float32Array(GNX * GNZ);   // (the ground's mesh: 8 m cells)
    for (let j = 0; j < GNZ; j++) for (let i = 0; i < GNX; i++) {
      const x = GX0 + i * GC, z = GZ0 + j * GC; let y = groundH(x, z);
      let wet = 0; for (const [ox, oz] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) if (inLake(x + ox, z + oz)) wet++;
      if (wet === 4) y = Math.min(y, WY - 1.4); else if (wet) y = Math.min(y, WY + 0.25 - wet * 0.35);   // (the lake bed; the shore down to the water)
      GY[j * GNX + i] = y;
    }
    const gyAt = (i, j) => GY[clamp(j, 0, GNZ - 1) * GNX + clamp(i, 0, GNX - 1)];
    const gMat = new THREE.MeshLambertMaterial({ map: gritTex, vertexColors: true });
    // the meshes by 380 m tiles of the ground's grid: 'a' the asphalt (the circuit's and the streets'), 'w' the ground with the sidewalks,
    // kerbs and paths on it (one material: a draw each)
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const swMat = gMat;
    const TILE = 380, stCh = new Map(), stG = (x, z, k) => { const key = k + ':' + Math.floor((x - GX0) / TILE) + ',' + Math.floor((z - GZ0) / TILE); let g = stCh.get(key); if (!g) stCh.set(key, g = new RB(true)); return g; };
    {   // the ground's rows (west -> east) into the tiles' 'w' buffers, linked from south to north (facing up)
      const TS = TILE / GC;
      for (let tj = 0; tj < GNZ - 1; tj += TS) for (let ti = 0; ti < GNX - 1; ti += TS) {
        const nx = Math.min(TS, GNX - 1 - ti) + 1, nz = Math.min(TS, GNZ - 1 - tj) + 1; let dry = false;
        for (let b = 0; b < nz && !dry; b++) for (let a = 0; a < nx; a++) if (gyAt(ti + a, tj + b) > WY - 1) { dry = true; break; }
        if (!dry) continue;   // (open lake: the water covers it)
        const g = stG(GX0 + (ti + 1) * GC, GZ0 + (tj + 1) * GC, 'w'); let prev = -1;
        let far = true; for (let b = 0; b < nz && far; b += 4) for (let a = 0; a < nx; a += 4) { const q = near(GX0 + (ti + a) * GC, GZ0 + (tj + b) * GC, 160); if (q.i >= 0) { far = false; break; } }
        const st = far ? 2 : 1, cols0 = []; for (let a = 0; a < nx; a += st) cols0.push(a); if (cols0[cols0.length - 1] !== nx - 1) cols0.push(nx - 1);   // (a tile 160 m and more off the circuit: 20 m cells)
        const rows0 = []; for (let b = nz - 1; b >= 0; b -= st) rows0.push(b); if (rows0[rows0.length - 1] !== 0) rows0.push(0);
        for (const b of rows0) { const pts = [], cols = [], uvs = [];
          for (const a of cols0) { const i = ti + a, j = tj + b, x = GX0 + i * GC, z = GZ0 + j * GC; pts.push([x, gyAt(i, j), z]); cols.push(gCol(x, z)); uvs.push([x / 7, -z / 7]); }
          const r = g.row(pts, cols, uvs); if (prev >= 0) g.link(prev, r, 0, cols0.length - 1); prev = r; }
      }
    }

    /* ---- the streets round the circuit (OpenStreetMap; kinds 0 road, 1 service, 2 footway, 3 cycleway, 4 motorway, 5 pedestrian): asphalt with a
       kerb and a concrete sidewalk on both sides of the roads, the paths in the parks, the expressway on its deck and piers; a 16 m hash of their
       segments says whether a point lies on a carriageway (the sidewalks stop there: the corners of the junctions) ---- */
    const ST = D.streets.map((a, k) => { const P = H2(a.slice(3)); return { k, kind: a[0], hw: a[1], lv: a[2], P }; });
    for (const S of ST) { let n = 0, m = 0; for (let k = 0; k + 1 < S.P.length; k++) for (let t = 0; t < 1; t += 0.25) { const x = lerp(S.P[k][0], S.P[k + 1][0], t), z = lerp(S.P[k][1], S.P[k + 1][1], t), q = near(x, z, 12); m++; if (q.i >= 0 && q.dd < 2.5) { const dx = S.P[k + 1][0] - S.P[k][0], dz = S.P[k + 1][1] - S.P[k][1], l = Math.hypot(dx, dz) || 1; if (Math.abs(dx * T.tx[q.i] + dz * T.tz[q.i]) / l > 0.8) n++; } }
      S.circ = !S.lv && S.kind !== 2 && S.kind !== 3 && n > 0.55 * m; }   // (the streets the circuit runs on: the circuit's own surface stands for them)
    const SH = new Map(), SHC = 16;
    for (const S of ST) for (let m = 0; m + 1 < S.P.length; m++) { const [ax, az] = S.P[m], [bx, bz] = S.P[m + 1], r = S.hw + 1;
      for (let a = Math.floor((Math.min(ax, bx) - r) / SHC); a <= Math.floor((Math.max(ax, bx) + r) / SHC); a++) for (let b = Math.floor((Math.min(az, bz) - r) / SHC); b <= Math.floor((Math.max(az, bz) + r) / SHC); b++) {
        const key = a * 4096 + b; let Lc = SH.get(key); if (!Lc) SH.set(key, Lc = []); Lc.push(S.k, m); } }
    const segD = (x, z, ax, az, bx, bz) => { const vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1e-9), 0, 1); return Math.hypot(x - ax - vx * t, z - az - vz * t); };
    const CURB = 2.3, swOf = (i) => (WA[i] > 7.2 ? 4 : 3);   // the circuit's own kerb line, metres past the track's edge (the real streets are wider), and its sidewalk
    const onRoad = (x, z, self, pad) => {   // on a carriageway (not a path, not the expressway's deck): another street's, or the circuit's (to its kerb line)
      const q = near(x, z, 14); if (q.i >= 0 && q.dd < CURB + (pad || 0)) return true;
      const Lc = SH.get(Math.floor(x / SHC) * 4096 + Math.floor(z / SHC)); if (!Lc) return false;
      for (let k = 0; k < Lc.length; k += 2) { const S = ST[Lc[k]]; if (S.k === self || S.circ || S.kind === 2 || S.kind === 3 || S.lv) continue; const m = Lc[k + 1], a = S.P[m], b = S.P[m + 1]; if (segD(x, z, a[0], a[1], b[0], b[1]) < S.hw + (pad || 0)) return true; }
      return false; };
    const scen = new Chunks(384), scenU = new Chunks(384, true);   // vertex-coloured scenery (cast shadows); with uvs (the grit): low things
    const wl = [0.94, 0.94, 0.9], yl = [0.95, 0.75, 0.12];
    const conc = [0.92, 0.9, 0.86], concK = [0.66, 0.65, 0.62], asph = [0.82, 0.82, 0.84], path = [0.8, 0.76, 0.68], ped = [0.84, 0.8, 0.72];
    const deckY = (S, x, z) => groundH(x, z) + (S.lv ? 2.8 * S.lv : 0);
    let nStreet = 0; const stMarks = [], traffic = [];   // (the streets' lines and the expressway's traffic: laid out once the line mesh and the cars' are there)
    for (const S of ST) {
      if (S.circ) continue;
      // resample: every 3 m near the circuit, 6 m farther off
      const P = S.P, pts = [];
      for (let m = 0; m + 1 < P.length; m++) { const [ax, az] = P[m], [bx, bz] = P[m + 1], l = Math.hypot(bx - ax, bz - az), qa = near(ax, az, 60), st = qa.i >= 0 && qa.dd < 60 ? 3.5 : 9, n = Math.max(1, Math.ceil(l / st));
        for (let k = 0; k < n; k++) pts.push([ax + (bx - ax) * k / n, az + (bz - az) * k / n]); }
      pts.push(P[P.length - 1]); if (pts.length < 2) continue;
      const nr = pts.map((p, k) => { const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l, dx / l, dz / l]; });
      const road = S.kind === 0 || S.kind === 1 || S.kind === 4 || S.kind === 5, sw = S.kind === 0 ? 2.6 : S.kind === 1 ? 1.6 : 0, hw = S.hw;
      const yOff = S.kind === 4 ? 0.05 : S.kind === 0 ? 0.035 + Math.min(hw, 7) * 0.002 : S.kind === 1 ? 0.03 : 0.04;
      const col = S.kind === 2 || S.kind === 3 ? path : S.kind === 5 ? ped : asph, mat = road && S.kind !== 5 ? 'a' : 'w';
      let prev = -1, prevS = [-1, -1];
      const g = stG(pts[0][0], pts[0][1], mat), gs = stG(pts[0][0], pts[0][1], 'w');   // (one chunk for the whole street: its rows link within one buffer)
      for (let k = 0; k < pts.length; k++) {
        const [x, z] = pts[k], [nx, nz] = nr[k];
        const q = near(x, z, 16), inCircuit = q.i >= 0 && q.dd < (q.lat > 0 ? T.br[q.i] : T.bl[q.i]) - WA[q.i] + 0.4;   // (under the circuit's own asphalt: it covers the mouth)
        const y = deckY(S, x, z) + yOff;
        if (inCircuit && !S.lv) { prev = -1; prevS = [-1, -1]; continue; }
        const uv = (o) => [(x + nx * o) / 6, -(z + nz * o) / 6];
        const r = g.row([[x - nx * hw, y, z - nz * hw], [x + nx * hw, y, z + nz * hw]], [col, col], [uv(-hw), uv(hw)]);
        if (prev >= 0) g.link(prev, r, 0, 1); prev = r;
        if (sw && !S.lv) for (const sd of [-1, 1]) {   // the kerb (15 cm) and the sidewalk, cut where it would lie on another carriageway
          const o0 = hw, o1 = hw + 0.25, o2 = hw + 0.25 + sw, mx = x + nx * sd * (o1 + sw / 2), mz = z + nz * sd * (o1 + sw / 2), si = sd > 0 ? 1 : 0;
          if (onRoad(mx, mz, S.k, 0.2) || onRoad(x + nx * sd * (o2 - 0.2), z + nz * sd * (o2 - 0.2), S.k, 0)) { prevS[si] = -1; continue; }
          const yg = groundH(x + nx * sd * o2, z + nz * sd * o2), yt = Math.max(y + 0.15, yg + 0.03);
          let pp = [[x + nx * sd * o0, y - 0.01, z + nz * sd * o0], [x + nx * sd * o0, yt, z + nz * sd * o0], [x + nx * sd * o2, yt, z + nz * sd * o2]], cc = [concK, conc, conc];
          if (sd < 0) { pp = pp.reverse(); cc = cc.slice().reverse(); }
          const rs = gs.row(pp, cc, pp.map(p => [p[0] / 6, -p[2] / 6])); if (prevS[si] >= 0) gs.link(prevS[si], rs, 0, 2); prevS[si] = rs;
        }
      }
      // the lines: a double yellow down the middle of the two-way streets, white dashes between the expressway's lanes (none in the junctions);
      // the traffic on the expressway (it stays open during the race)
      if ((S.kind === 0 && hw >= 4) || S.kind === 4) { let acc = 0;
        for (let k = 0; k + 1 < pts.length; k++) { const [x, z] = pts[k], [x2, z2] = pts[k + 1], [nx, nz] = nr[k], l = Math.hypot(x2 - x, z2 - z), y = deckY(S, x, z) + yOff + 0.012, y2 = deckY(S, x2, z2) + yOff + 0.012; acc += l;
          const far = !in200(x, z), q = near(x, z, 16); if (!S.lv && ((q.i >= 0 && q.dd < (q.lat > 0 ? T.br[q.i] : T.bl[q.i]) - WA[q.i] + 3) || onRoad(x, z, S.k, 1) || onRoad(x2, z2, S.k, 1))) continue;
          const L4 = (o0, o1, col, f) => far || stMarks.push([[x + nx * o0, y, z + nz * o0], [x + nx * o1, y, z + nz * o1], [x + (x2 - x) * f + nx * o1, lerp(y, y2, f), z + (z2 - z) * f + nz * o1], [x + (x2 - x) * f + nx * o0, lerp(y, y2, f), z + (z2 - z) * f + nz * o0], col]);
          if (S.kind === 0) { L4(-0.2, -0.08, yl, 1); L4(0.08, 0.2, yl, 1); }
          else { if (Math.floor(acc / 6) % 2) for (const o of [-hw / 3, hw / 3]) L4(o - 0.07, o + 0.07, wl, 1);
            if (R() < l / 22) { const f = R(), lane = Math.floor(R() * 3) - 1, big = R() < 0.18; traffic.push([x + (x2 - x) * f + nx * lane * hw / 1.6, lerp(y, y2, f) - 0.02, z + (z2 - z) * f + nz * lane * hw / 1.6, -Math.atan2(z2 - z, x2 - x), big ? 1.7 : 1, big ? [0.92, 0.92, 0.9] : [[0.9, 0.9, 0.9], [0.12, 0.12, 0.13], [0.6, 0.61, 0.64], [0.7, 0.1, 0.1], [0.15, 0.25, 0.5]][Math.floor(R() * 5)]]); } } } }
      nStreet++;
      // the expressway: its deck's edges (parapets) and piers every 32 m
      if (S.lv) { let acc = 0;
        for (let k = 0; k + 1 < pts.length; k++) { const [x, z] = pts[k], [x2, z2] = pts[k + 1], [nx, nz] = nr[k], y = deckY(S, x, z), y2 = deckY(S, x2, z2), g = scen.get(x, z);
          for (const sd of [-1, 1]) { const o = hw + 0.25, a = [x + nx * sd * o, y, z + nz * sd * o], b = [x2 + nx * sd * o, y2, z2 + nz * sd * o];
            g.quadO([a[0], a[1] - 1.4, a[2]], [b[0], b[1] - 1.4, b[2]], [b[0], b[1] + 0.95, b[2]], [a[0], a[1] + 0.95, a[2]], [0.72, 0.72, 0.7], [x - nx * sd * 3, y, z - nz * sd * 3]); }
          g.quadO([x - nx * hw, y - 1.35, z - nz * hw], [x + nx * hw, y - 1.35, z + nz * hw], [x2 + nx * hw, y2 - 1.35, z2 + nz * hw], [x2 - nx * hw, y2 - 1.35, z2 - nz * hw], [0.5, 0.5, 0.49], [x, y + 3, z]);
          const l = Math.hypot(x2 - x, z2 - z);
          for (let t = Math.ceil(acc / 32) * 32 - acc; t < l; t += 32) { const px = x + (x2 - x) * t / l, pz = z + (z2 - z) * t / l, gy = groundH(px, pz), py = lerp(y, y2, t / l) - 1.35;
            if (py - gy > 2) { box(g, px, gy - 0.3, pz, 1.4, py - gy + 0.3, 1.4, 0, [0.66, 0.66, 0.64]); box(g, px, py - 0.9, pz, 1.6, 0.9, hw * 1.6, Math.atan2(nz, nx) + Math.PI / 2, [0.62, 0.62, 0.6]); } }
          acc += l; } }
    }

    /* ---- the circuit's surface: the asphalt out to the barriers (the streets are wider than the track), darker on the racing line; the city's
       kerb line and sidewalks along it (in the pockets of the junctions inside the barriers: the corners), cut at the mouths of the side roads ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const pitAtI = (i) => (def.pit ? T.pitAt(i * ds) : null);
    const barO = (i, sd) => (sd > 0 ? T.br[i] : T.bl[i]);
    {
      const CH = 192;
      for (let c0 = 0; c0 < N; c0 += CH) {
        const i0 = c0 % N, ga = stG(T.px[i0], T.pz[i0], 'a'), gs = stG(T.px[i0], T.pz[i0], 'w'); let pa = -1; const ps = [-1, -1];   // (in the streets' buffers of its first sample's cell: fewer meshes)
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
          const i = ii % N, wi = WA[i], rl = T.rl[i], v = ii * ds / 8;
          const oL = -Math.max(T.bl[i] + 0.5, wi + CURB), oR = Math.max(T.br[i] + 0.5, wi + CURB);
          const offs = [oL, -wi, -wi * 0.45, 0, wi * 0.45, wi, oR];
          const sh = (o) => { let k = 0.9 - 0.16 * Math.exp(-((o - rl) * (o - rl)) / 5); if (Math.abs(o) > wi) k = 0.95; return [k, k, k * 1.01]; };
          const r = ga.row(offs.map(o => Pt(i, o, 0.02)), offs.map(sh), offs.map(o => [(o + 20) / 8, v])); if (pa >= 0) ga.link(pa, r, 0, offs.length - 1); pa = r;
          for (const sd of [-1, 1]) {   // the sidewalk
            const si = sd > 0 ? 1 : 0, o0 = wi + CURB, o2 = o0 + 0.25 + swOf(i), om = (o0 + o2) / 2, P0 = Pt(i, sd * om, 0);
            const pz = sd < 0 ? pitAtI(i) : null;
            if ((pz && pz.o > 0) || onRoad(P0[0], P0[2], -1, 0.2) || onRoad(...Pt(i, sd * (o2 - 0.2), 0).filter((_, k) => k !== 1), -1, 0)) { ps[si] = -1; continue; }
            const yt = 0.17;
            let pp = [Pt(i, sd * o0, 0.0), Pt(i, sd * o0, yt), Pt(i, sd * o2, yt)], cc = [concK, conc, conc];
            if (sd < 0) { pp = pp.reverse(); cc = cc.slice().reverse(); }
            const rs = gs.row(pp, cc, pp.map(p => [p[0] / 6, -p[2] / 6])); if (ps[si] >= 0) gs.link(ps[si], rs, 0, 2); ps[si] = rs;
          }
        }
      }
    }
    for (const [key, g] of stCh) { if (g.empty) continue; addM(g, key[0] === 'a' ? aMat : swMat, false); }
    // the kerbs at the apexes (red and white, low): the inside of the corners
    {
      const cMat = new THREE.MeshLambertMaterial({ map: tex.curb, vertexColors: true }), CH = 384;
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
    // the markings: the start line and the grid, the streets' own lines (Canada: a double yellow line down the middle of the two-way streets,
    // white dashes between the lanes of the boulevards), the zebra crossings and the stop lines at the junctions (OpenStreetMap's crossings)
    const lineG = new GB();
    for (const [a, b, c, d, col] of stMarks) lineG.quadUp(a, b, c, d, [col, col, col, col]);
    const strip = (s0, s1, o0, o1, col, y) => { const a = atSf(s0, o0), b = atSf(s0, o1), c = atSf(s1, o1), d = atSf(s1, o0), Y = (p) => T.hy[p[3]] + (y || 0.034);
      lineG.quadUp([a[0], Y(a), a[1]], [b[0], Y(b), b[1]], [c[0], Y(c), c[1]], [d[0], Y(d), d[1]], [col, col, col, col]); };
    {
      const gq = new GB(true), W1 = [1, 1, 1], wS = WA[T.startIdx], uM = Math.round(wS * 2 / 0.8) / 16;
      const a = atSf(sStart - 0.8, -wS), b = atSf(sStart - 0.8, wS), c = atSf(sStart + 0.8, wS), d = atSf(sStart + 0.8, -wS), Y = (p) => T.hy[p[3]] + 0.04;
      gq.quadUp([a[0], Y(a), a[1]], [b[0], Y(b), b[1]], [c[0], Y(c), c[1]], [d[0], Y(d), d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker }));
      for (let k = 1; k <= 14; k++) { const sb = sStart - 9 - (k - 1) * 7.5 + 2.6, lat = (k % 2 === 1 ? -1 : 1) * 3.4; strip(sb, sb + 0.35, lat - 1.5, lat + 1.5, wl, 0.037); strip(sb - 1.6, sb + 0.35, lat - 1.5, lat - 1.25, wl, 0.037); }
    }
    const xings = [], XF = D.furn.xing || [];
    for (let k = 0; k < XF.length; k += 2) { const x = XF[k] / 10, z = XF[k + 1] / 10, q = near(x, z, 12); if (q.i >= 0 && q.dd < -1) xings.push(q.i * ds + ((x - T.px[q.i]) * T.tx[q.i] + (z - T.pz[q.i]) * T.tz[q.i])); }
    xings.sort((a, b) => a - b);
    const nearX = (s, m) => xings.some(x => Math.abs(dS(x) - dS(s)) < m) || Math.abs(dS(s)) < 14;
    for (let s = 0; s < L; s += 2) {   // the lane lines (not over the crossings, the start line and the grid)
      const i = T.idx(s), wi = WA[i], d = dS(s); if (nearX(s, 6) || (d > -110 && d < 4)) continue;
      const two = !(wi > 7.2), lanes = wi > 7.2 ? 3 : 2;   // (the lakeshore: three lanes one way; the rest: two-way streets with two lanes)
      if (two && wi > 6.2) { strip(s, s + 2, -0.2, -0.08, yl); strip(s, s + 2, 0.08, 0.2, yl); }
      if (Math.floor(s / 2) % 5 < 2) { if (lanes === 3) for (const o of [-wi / 3, wi / 3]) strip(s, s + 2, o - 0.07, o + 0.07, wl); else if (wi > 6.8) for (const o of [-wi / 2, wi / 2]) strip(s, s + 2, o - 0.07, o + 0.07, wl); }
    }
    for (const xs of xings) { const i = T.idx(xs), wi = WA[i];   // a zebra crossing (bars along the road) and a stop line before it, both ways
      for (let o = -wi + 0.4; o < wi - 0.3; o += 1.1) strip(xs - 1.8, xs + 1.8, o, o + 0.55, wl, 0.036);
      strip(xs - 4.2, xs - 3.8, 0, wi - 0.3, wl, 0.036); strip(xs + 3.8, xs + 4.2, -wi + 0.3, 0, wl, 0.036); }

    /* ---- the barriers: concrete blocks (a jersey profile) with a catch fence on posts above them all the way round, open where the pit lane
       leaves and rejoins; the pit wall between the track and the lane ---- */
    const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const POC = [[0.5, 0.51, 0.53]], POQ = [[1, 1], [1, -1], [-1, -1], [-1, 1], [1, 1]].map(([a, b]) => [a * 0.045, b * 0.045]);
    const post = (g, x, y, z, h) => {   // a fence post (0.09 m square, 3.6 m tall) in the blocks' own mesh: its four sides, no draw call of its own
      const c = Math.cos(h), sn = Math.sin(h), ring = (yy) => g.row(POQ.map(([a, b]) => [x + a * c - b * sn, yy, z + a * sn + b * c]), POC.concat(POC, POC, POC, POC));
      g.link(ring(y), ring(y + 3.6), 0, 4);
    };
    const gapAt = (i, sd) => { if (sd > 0 || !def.pit) return false; const p = pitAtI(i); return !!p && p.gap; };
    const wallRow = (g, i, sd, bar) => {   // the block's cross-section at sample i, its faces towards the road (rows left -> right)
      const shade = 0.93 + 0.07 * Math.sin(Math.floor(i * ds / 3.8) * 2.1), c0 = [0.62 * shade, 0.62 * shade, 0.6 * shade], c1 = [0.8 * shade, 0.8 * shade, 0.78 * shade], c2 = [0.86, 0.86, 0.84];
      let p = [Pt(i, sd * (bar - 0.02), -0.05), Pt(i, sd * (bar + 0.06), 0.28), Pt(i, sd * (bar + 0.2), 0.84), Pt(i, sd * (bar + 0.42), 0.84), Pt(i, sd * (bar + 0.62), -0.05)], c = [c0, c1, c1, c2, c0];
      if (sd < 0) { p = p.reverse(); c = c.slice().reverse(); }
      return g.row(p, c);
    };
    {
      const CH = 384, wMat = matV;
      for (let c0 = 0; c0 < N; c0 += CH) {
        const g = new RB(), gf = new RB(true);
        for (const sd of [-1, 1]) { let pw = -1, pf = -1, acc = 0;
          for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) { const i = ii % N, bar = barO(i, sd);
            if (gapAt(i, sd)) { pw = pf = -1; continue; }
            const r = wallRow(g, i, sd, bar); if (pw >= 0) g.link(pw, r, 0, 4); pw = r;
            const u = ii * ds / 2.5, fa = Pt(i, sd * (bar + 0.31), 0.84), fb = Pt(i, sd * (bar + 0.31), 4.1);
            const rf = gf.row(sd > 0 ? [fa, fb] : [fb, fa], [[1, 1, 1], [1, 1, 1]], sd > 0 ? [[u, 0], [u, 1.3]] : [[u, 1.3], [u, 0]]); if (pf >= 0) gf.link(pf, rf, 0, 1); pf = rf;
            if (ii < c0 + CH && ii % 2 === 0) { const p = Pt(i, sd * (bar + 0.36), 0); post(g, p[0], p[1] + 0.6, p[2], T.hd[i]); } } }
        addM(g, wMat, true); addM(gf, fMat, false);
      }
    }

    /* ---- the pit lane (on the left of the straight, def.pit's offset negative): its asphalt between the pit wall and an outer wall, the
       concrete apron with the boxes' lines, a row of temporary garages (white frames, the teams' colours) behind; the crews are the renderer's
       (out.pitBoxes, the player's out.pitBox: their frame turned to the left, nx / nz pointing away from the track) ---- */
    if (def.pit) {
      const P0 = def.pit, sd = P0[0] < 0 ? -1 : 1, gl = new RB(true), gp = new GB(), [pq0, pq1] = def.pitRow, apron = [0.74, 0.74, 0.71];
      const at = (k, o, y) => Pt(k, sd * o, y);
      let pl = -1;
      for (let q = P0[1]; q <= P0[2]; q += 2) {
        const i = T.idx(sStart + q), p = T.pitAt(sStart + q); if (!p) { pl = -1; continue; }
        const a0 = p.gap ? WA[i] : p.wall + 0.3, a1 = p.lout + 0.6;
        let pp = [at(i, a0, 0.022), at(i, a1, 0.022)], uu = pp.map(v => [v[0] / 8, -v[2] / 8]); if (sd < 0) { pp = pp.reverse(); uu = uu.reverse(); }
        const r = gl.row(pp, [[0.92, 0.92, 0.94], [0.92, 0.92, 0.94]], uu); if (pl >= 0) gl.link(pl, r, 0, 1); pl = r;
        if (!p.gap && p.t > 0.999) { const j = T.idx(sStart + q + 2); gp.quadUp(at(i, p.lout, 0.03), at(i, p.lout + 9, 0.03), at(j, p.lout + 9, 0.03), at(j, p.lout, 0.03), [apron, apron, apron, apron]);
          if (((q / 2) | 0) % 2 === 0) gp.quadUp(at(i, p.lin + 0.15, 0.035), at(i, p.lin + 0.3, 0.035), at(j, p.lin + 0.3, 0.035), at(j, p.lin + 0.15, 0.035), [wl, wl, wl, wl]); }
      }
      addM(gl, aMat); 
      const TEAM = [[0.85, 0.16, 0.13], [0.16, 0.36, 0.8], [0.95, 0.95, 0.94], [0.18, 0.62, 0.3], [0.96, 0.72, 0.12], [0.14, 0.14, 0.16], [0.95, 0.45, 0.1], [0.5, 0.26, 0.7], [0.1, 0.62, 0.72], [0.85, 0.2, 0.5], [0.4, 0.42, 0.46], [0.2, 0.3, 0.55], [0.7, 0.1, 0.1]];
      const WH = [0.93, 0.93, 0.92], FR = [0.62, 0.63, 0.66];
      let k = 0;
      for (let q = pq0; q <= pq1; q += 10, k++) {
        const s0 = sStart + q, i = T.idx(s0 + 5), p = T.pitAt(s0 + 5); if (!p || p.t < 0.999) continue;
        const tx = T.tx[i], tz = T.tz[i], nx = T.nx[i] * sd, nz = T.nz[i] * sd, hd = T.hd[i], base = p.o + 3.5, oc = atSf(s0 + 5, 0), tc = TEAM[k % TEAM.length];
        const B = (a, o, y, sx, sy, sz, col, top) => { const x = oc[0] + tx * (a - 5) + nx * o, z = oc[1] + tz * (a - 5) + nz * o; box(scen.get(x, z), x, T.hy[i] + y, z, sx, sy, sz, hd, col, top); };
        { const A = atSf(s0, sd * base), Bq = atSf(s0, sd * (base + 9)), y = T.hy[i] + 0.04; gp.quadUp([A[0] - tx * 0.09, y, A[1] - tz * 0.09], [A[0] + tx * 0.09, y, A[1] + tz * 0.09], [Bq[0] + tx * 0.09, y, Bq[1] + tz * 0.09], [Bq[0] - tx * 0.09, y, Bq[1] - tz * 0.09], [wl, wl, wl, wl]); }   // (the box line)
        // the garage: a white frame open to the apron, a roof, the team's colour along its front and on the back wall
        B(5, base + 13, 3.2, 9.8, 0.25, 7.6, WH, [0.85, 0.86, 0.88]); B(5, base + 16.6, 0, 9.8, 3.2, 0.25, tc);
        for (const a of [0.2, 9.8]) B(a, base + 13, 0, 0.2, 3.2, 7.6, WH);
        B(5, base + 9.3, 2.75, 9.8, 0.45, 0.12, tc, tc);
        B(1.6, base + 15.6, 0, 1.2, 1.0, 0.6, [0.2, 0.21, 0.24], [0.12, 0.12, 0.13]); B(8.4, base + 15.6, 0, 1.2, 1.0, 0.6, [0.78, 0.14, 0.12], [0.12, 0.12, 0.13]);
        for (const a of [3.6, 6.4]) for (let l = 0; l < 3; l++) { const x = oc[0] + tx * (a - 5) + nx * (base + 15.2), z = oc[1] + tz * (a - 5) + nz * (base + 15.2); cyl(scen.get(x, z), x, T.hy[i] + l * 0.3, z, 0.34, 0.28, 8, [0.12, 0.12, 0.13], [0.2, 0.2, 0.21]); }
        // the team's stand on the pit wall side (a desk with screens under a small roof)
        { const o = (p.wall + p.lin) / 2; B(5, o, 0.95, 2.4, 0.06, 1.0, [0.3, 0.31, 0.34]); B(5, o, 2.4, 2.6, 0.07, 1.4, [0.22, 0.23, 0.26], [0.3, 0.31, 0.35]); for (const a of [3.9, 6.1]) B(a, o, 0, 0.08, 2.4, 0.08, FR); B(5, o - 0.35, 1.05, 2.0, 0.38, 0.05, [0.16, 0.24, 0.38]); }
        const mine = Math.abs(q + 5 - P0[3]) < 1;
        if (mine) { const sb = s0 + 5, yc = [0.98, 0.82, 0.12], bp = T.bayPose(P0[3]), ca = Math.cos(bp.a), sa = Math.sin(bp.a);   // (the car stops in its box on the apron, nose in towards the garage: Core's BAY; turned to the left, sd)
          out.pitBox = { s: sb, x: oc[0] + nx * (base + 4.2), z: oc[1] + nz * (base + 4.2), hd, tx, tz, nx, nz, lane: p.o, wallO: p.wall, apron0: base, garage0: base + 9, stop: atSf(sb, sd * bp.o), stopO: bp.o, stopA: sd * bp.a, y: T.hy[i] };
          const bq = (u, v) => { const a = atSf(sb + u * ca - v * sa, sd * (bp.o + u * sa + v * ca)); return [a[0], T.hy[a[3]] + 0.04, a[1]]; };   // (u along the stopped car, v across it to the garage's side)
          for (const [u0, u1, v0, v1] of [[-3.2, 3.2, -1.75, -1.5], [-3.2, 3.2, 1.5, 1.75], [-3.2, -2.95, -1.75, 1.75], [2.95, 3.2, -1.75, 1.75]])   // yellow stop box on the apron, turned in like the car
            lineG.quadUp(bq(u0, v0), bq(u1, v0), bq(u1, v1), bq(u0, v1), [yc, yc, yc, yc]); }
        (out.pitBoxes = out.pitBoxes || []).push({ k, s: s0 + 5, ox: oc[0], oz: oc[1], tx, tz, nx, nz, hd, base, lane: p.o, wall: p.wall, team: tc, mine, y: T.hy[i] });
      }
      const pbs = out.pitBoxes; T.pitStands = null;
      if (pbs && pbs.length) T.pitStands = [dS(pbs[0].s) - 1.35, dS(pbs[pbs.length - 1].s) + 1.35];
      // the lane's outer wall (concrete blocks)
      { const g = new RB(); let pw = -1;
        for (let q = P0[1]; q <= P0[2]; q += 2) { const i = T.idx(sStart + q), p = T.pitAt(sStart + q); if (!p) { pw = -1; continue; }
          const o = p.t > 0.999 ? p.lout + 9.6 : p.lout + 0.6, r = wallRow(g, i, sd, o); if (pw >= 0) g.link(pw, r, 0, 4); pw = r; }
        addM(g, matV, true); }
      addM(gp, matV);
    }

    /* ---- the start gantry over the straight: a truss on two towers, the start lights (out.dyn.lights) ---- */
    {
      const [x, z, h, i] = atSf(sStart, 0), gy = T.hy[i], g = scen.get(x, z), span = WA[i] + 2.4, nx = T.nx[i], nz = T.nz[i], gray = [0.24, 0.25, 0.28];
      for (const sdd of [-1, 1]) box(g, x + nx * span * sdd, gy - 0.3, z + nz * span * sdd, 0.9, 8.1, 0.9, h, gray);
      box(g, x, gy + 6.4, z, 1.2, 1.4, span * 2 + 0.9, h, [0.16, 0.17, 0.2], [0.26, 0.27, 0.3]);
      box(g, x, gy + 5.1, z, 0.5, 1.3, 5.6, h, [0.07, 0.07, 0.08]);
      // the five lamps in one mesh (one draw call): each of out.dyn.lights stands for one lamp, its material.color.setHex recolours that lamp's vertices
      const lg = new GB(); for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0; box(lg, x + nx * o, gy + 7.64, z + nz * o, 0.62, 0.62, 0.62, h, [1, 1, 1]); }
      const lm = new THREE.Mesh(lg.geometry(), new THREE.MeshBasicMaterial({ vertexColors: true })), col = lm.geometry.attributes.color, per = col.count / 5, cc = new THREE.Color();
      lm.matrixAutoUpdate = false; root.add(lm);
      const lamp = (k) => ({ material: { color: { setHex(v) { cc.setHex(v); for (let j = k * per; j < (k + 1) * per; j++) col.setXYZ(j, cc.r, cc.g, cc.b); col.needsUpdate = true; } } } });
      out.dyn.lights = [0, 1, 2, 3, 4].map(lamp); out.dyn.lights.forEach(l => l.material.color.setHex(0x2a0606));
    }

    /* ---- the buildings: OpenStreetMap's outlines and heights (or floors), walls with a facade picture (one tile = a window bay x a floor; the
       bluish glass lights up at night: out.winMaps), flat roofs with plant on the big ones, pitched roofs on the houses; the old gates and the
       dome as monuments of their own ---- */
    const facTex = (draw) => { const c = document.createElement('canvas'); c.width = c.height = 64; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; out.winMaps.push(t); return ownTex(t); };
    const FB = facTex((g) => {   // red-brown brick, a sash window with a white frame
      g.fillStyle = '#a0634c'; g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(60,30,20,0.25)'; for (let y = 0; y < 64; y += 4) { g.fillRect(0, y, 64, 1); for (let x = (y / 4) % 2 ? 0 : 4; x < 64; x += 8) g.fillRect(x, y, 1, 4); }
      g.fillStyle = '#ece6da'; g.fillRect(19, 13, 26, 38); g.fillStyle = '#5c728f'; g.fillRect(21, 15, 22, 34); g.fillStyle = '#8fa6bf'; g.fillRect(23, 17, 8, 13); g.fillStyle = '#ece6da'; g.fillRect(21, 31, 22, 2); g.fillStyle = '#d8d2c4'; g.fillRect(17, 51, 30, 3); });
    const FG = facTex((g) => {   // a curtain wall: blue-grey glass between pale mullions, a darker spandrel at the floor
      g.fillStyle = '#c9ced3'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#5d7590'; g.fillRect(2, 2, 60, 50); g.fillStyle = '#7f97b0'; g.fillRect(4, 4, 26, 20); g.fillStyle = '#6a819a'; g.fillRect(34, 26, 26, 24);
      g.fillStyle = '#3d4a58'; g.fillRect(0, 52, 64, 12); g.fillStyle = '#c9ced3'; g.fillRect(31, 2, 2, 50); });
    const FH = facTex((g) => {   // pale stone of the old exhibition halls: a pilaster each side, a tall window with a stone head
      g.fillStyle = '#e4ddcc'; g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(0,0,0,0.06)'; for (let y = 0; y < 64; y += 8) g.fillRect(0, y, 64, 1);
      g.fillStyle = '#d3cab6'; g.fillRect(0, 0, 8, 64); g.fillRect(56, 0, 8, 64); g.fillStyle = '#c9bfa9'; g.fillRect(16, 8, 32, 6);
      g.fillStyle = '#5b708a'; g.fillRect(18, 14, 28, 42); g.fillStyle = '#e4ddcc'; g.fillRect(31, 14, 2, 42); g.fillRect(18, 34, 28, 2); g.fillStyle = '#879db5'; g.fillRect(20, 16, 10, 16); });
    const facMats = [FB, FG, FH].map(m => new THREE.MeshLambertMaterial({ map: m, vertexColors: true }));
    const fac = facMats.map(() => ({ g: new GB(true), get() { return this.g; }, addTo(grp, mat, cast, recv) { if (this.g.empty) return; const m = new THREE.Mesh(this.g.geometry(), mat); m.castShadow = cast; m.receiveShadow = recv; m.matrixAutoUpdate = false; grp.add(m); } }));   // (one mesh a facade: every building of the area in it)
    const BAY = [3.4, 3.2, 6.0], FLH = [3.4, 3.7, 6.5];   // the tile's width and height per facade
    const hexC = (s) => (s && s.length === 7 ? [parseInt(s.slice(1, 3), 16) / 255, parseInt(s.slice(3, 5), 16) / 255, parseInt(s.slice(5, 7), 16) / 255] : null);
    const BG = new Map(), BGC = 8, bldMark = (x, z) => BG.set(Math.floor(x / BGC) * 8192 + Math.floor(z / BGC), 1);   // (cells under buildings: no trees, no crowds, no cars there)
    const onBld = (x, z) => BG.has(Math.floor(x / BGC) * 8192 + Math.floor(z / BGC));
    const pitZone = (x, z) => { if (!def.pit) return false; const q = near(x, z, 50); if (q.i < 0 || q.lat * Math.sign(def.pit[0]) < 0) return false; const p = T.pitAt(q.i * ds); return !!p && Math.abs(q.lat) < p.lout + 18; };
    const STAD = H2(D.stadium.out), PITCH = H2(D.stadium.pitch);   // the football stadium's outline and its pitch (OpenStreetMap): built on its own below
    let nBld = 0;
    const SPEC = {};
    for (const b of D.bld) {
      const [t, h, mh, rs, fc, rc, sp] = b, P = H2(b[7]), n = P.length; if (n < 3) continue;
      let cx = 0, cz = 0, ar = 0; for (let k = 0; k < n; k++) { const [ax, az] = P[k], [bx, bz] = P[(k + 1) % n]; ar += ax * bz - bx * az; cx += ax / n; cz += az / n; }
      ar /= 2; const sg = ar > 0 ? 1 : -1, area = Math.abs(ar);
      if (sp) { (SPEC[sp] = SPEC[sp] || []).push({ P, h, cx, cz }); if (sp === 'gates' || sp === 'dome') continue; }
      // clear of the circuit (its barriers and pit lane): drop what stands on it
      let clash = false; for (const [x, z] of P.concat([[cx, cz]])) { const q = near(x, z, 30); if ((q.i >= 0 && q.dd < (q.lat > 0 ? T.br[q.i] : T.bl[q.i]) - WA[q.i] + 1.5) || pitZone(x, z)) { clash = true; break; } }
      if (clash || inPoly(STAD, cx, cz)) continue;
      let y0 = 1e9; for (const [x, z] of P) y0 = Math.min(y0, groundH(x, z)); y0 -= 0.3;
      const tall = h >= 22, kind = t === 5 || t === 8 ? 2 : t === 2 && h >= 15 ? 1 : t === 1 && tall ? 1 : t === 3 ? 2 : sp === 'hotel' ? 1 : 0;   // 0 brick, 1 glass (the towers), 2 stone hall (and the sheds)
      let col = hexC(fc);
      if (col) col = col.map(v => lerp(v, 0.85, 0.35)); else col = kind === 0 ? vary([1, 1, 1], R, 0.22) : kind === 2 ? (t === 5 || t === 8 ? vary([0.94, 0.93, 0.9], R, 0.1) : vary([1, 0.98, 0.95], R, 0.08)) : vary([1, 1, 1.02], R, 0.12);
      if (kind === 0 && !hexC(fc)) { const tone = R(); if (tone < 0.3) col = [col[0] * 1.08, col[1] * 1.0, col[2] * 0.9]; else if (tone < 0.5) col = [1.25, 1.18, 1.05].map((v, q) => v * col[q] * 0.82); }   // (buff brick now and then)
      const yb = y0 + (mh || 0), yt = y0 + h + 0.3, gF = fac[kind].get(cx, cz), bw = BAY[kind], fh = FLH[kind];
      let acc = 0;
      for (let k = 0; k < n; k++) {
        const [ax, az] = P[k], [bx, bz] = P[(k + 1) % n], l = Math.hypot(bx - ax, bz - az); if (l < 0.05) continue;
        const ox = sg * (bz - az) / l, oz = -sg * (bx - ax) / l, inn = [(ax + bx) / 2 - ox, (yb + yt) / 2, (az + bz) / 2 - oz];
        const u0 = Math.round(acc / bw), u1 = u0 + Math.max(1, Math.round(l / bw)), v0 = (yb - y0) / fh, v1 = (yt - y0) / fh;
        gF.quadO([ax, yb, az], [bx, yb, bz], [bx, yt, bz], [ax, yt, az], col, inn, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); acc += l;
      }
      // the roof
      const g = scen.get(cx, cz), roofC = hexC(rc) || (kind === 0 && area < 300 ? [0.32, 0.3, 0.3] : kind === 1 ? [0.55, 0.56, 0.57] : vary([0.5, 0.5, 0.49], R, 0.12));
      let pitched = false;
      if (n === 4 && area < 420 && (t === 0 || rs === 1 || rs === 2)) {   // a house: a gabled roof on the long axis
        const e0 = Math.hypot(P[1][0] - P[0][0], P[1][1] - P[0][1]), e1 = Math.hypot(P[2][0] - P[1][0], P[2][1] - P[1][1]), Lr = Math.max(e0, e1), Dr = Math.min(e0, e1), rot = e0 >= e1 ? Math.atan2(P[1][1] - P[0][1], P[1][0] - P[0][0]) : Math.atan2(P[2][1] - P[1][1], P[2][0] - P[1][0]);
        W.gable(g, cx, yt, cz, Lr + 0.5, Dr + 0.5, Math.min(3.4, Dr * 0.42), rot, hexC(rc) || vary([0.3, 0.29, 0.3], R, 0.2), col.map(v => v * 0.62)); pitched = true;
      }
      if (!pitched) {
        const tri = THREE.ShapeUtils.triangulateShape(P.map(([x, z]) => new THREE.Vector2(x, z)), []);
        for (const [a, bq, c] of tri) g.triO([P[a][0], yt, P[a][1]], [P[bq][0], yt, P[bq][1]], [P[c][0], yt, P[c][1]], roofC, [cx, yt - 5, cz]);
        if (mh > 0.5) for (const [a, bq, c] of tri) g.triO([P[a][0], yb, P[a][1]], [P[bq][0], yb, P[bq][1]], [P[c][0], yb, P[c][1]], [0.4, 0.4, 0.4], [cx, yb + 5, cz]);   // (an overhang: its underside)
        if (area > 900 && h > 6) { const nU = Math.min(8, Math.floor(area / 1400) + 1);   // plant on the flat roof
          for (let u = 0; u < nU; u++) { const px = cx + (R() - 0.5) * Math.sqrt(area) * 0.5, pz = cz + (R() - 0.5) * Math.sqrt(area) * 0.5; if (!inPoly(P, px, pz)) continue; box(g, px, yt, pz, 2.2 + R() * 2.5, 1.1 + R() * 0.9, 1.6 + R() * 2, R() * TAU, [0.72, 0.73, 0.74], [0.78, 0.79, 0.8]); } }
        if (kind === 1 && h > 30) box(g, cx, yt, cz, Math.min(14, Math.sqrt(area) * 0.4), 3.5, Math.min(10, Math.sqrt(area) * 0.3), 0, [0.62, 0.64, 0.66]);   // (the tower's plant room)
      }
      // the cells under it (no trees, no crowds, no cars)
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      for (let x = x0; x <= x1; x += BGC / 2) for (let z = z0; z <= z1; z += BGC / 2) if (inPoly(P, x, z)) bldMark(x, z);
      nBld++;
    }

    /* ---- the football stadium (generic, no name): four raked stands round the pitch, open corners, a white canopy over every stand on
       columns at its back, the concourse wall under the rake; seats in two tones; the goals ---- */
    {
      const c = PITCH, cx = (c[0][0] + c[2][0]) / 2, cz = (c[0][1] + c[2][1]) / 2, e0 = Math.hypot(c[1][0] - c[0][0], c[1][1] - c[0][1]), e1 = Math.hypot(c[2][0] - c[1][0], c[2][1] - c[1][1]);
      const ua = e0 >= e1 ? Math.atan2(c[1][1] - c[0][1], c[1][0] - c[0][0]) : Math.atan2(c[2][1] - c[1][1], c[2][0] - c[1][0]), A = Math.max(e0, e1) / 2, B = Math.min(e0, e1) / 2;
      const ux = Math.cos(ua), uz = Math.sin(ua), vx = -uz, vz = ux, y0 = groundH(cx, cz) - 0.2, g = scen.get(cx, cz);
      const Pq = (u, v, y) => [cx + ux * u + vx * v, y, cz + uz * u + vz * v];
      const seatA = [0.62, 0.15, 0.14], seatB = [0.36, 0.37, 0.4], concC = [0.7, 0.7, 0.68], roofC = [0.95, 0.95, 0.96], roofU = [0.78, 0.79, 0.8];
      const stand = (side, axis, front, depth, span, rise) => {   // axis 0: along u (the long sides, at v = side * front), 1: along v (the ends)
        const P2 = axis === 0 ? (t, d, y) => Pq(t, side * d, y) : (t, d, y) => Pq(side * d, t, y), inn = P2(0, front + depth / 2, y0 + 3), rows = 18, top = y0 + 2 + depth * rise;
        for (let r = 0; r < rows; r++) { const d0 = front + depth * r / rows, d1 = front + depth * (r + 1) / rows, ya = y0 + 2 + (d0 - front) * rise, yb = y0 + 2 + (d1 - front) * rise, col = r % 6 < 3 ? seatA : seatB;
          g.quadO(P2(-span, d0, ya), P2(span, d0, ya), P2(span, d0, yb), P2(-span, d0, yb), col.map(v => v * 0.8), inn); g.quadO(P2(-span, d0, yb), P2(span, d0, yb), P2(span, d1, yb), P2(-span, d1, yb), col, P2(0, d0, yb - 3)); }
        g.quadO(P2(-span, front, y0), P2(span, front, y0), P2(span, front, y0 + 2), P2(-span, front, y0 + 2), concC, inn);
        g.quadO(P2(-span, front + depth, y0), P2(span, front + depth, y0), P2(span, front + depth, top + 0.5), P2(-span, front + depth, top + 0.5), [0.62, 0.62, 0.6], inn);
        for (const sd of [-1, 1]) { const t = sd * span; g.quadO(P2(t, front, y0), P2(t, front + depth, y0), P2(t, front + depth, top + 0.5), P2(t, front, y0 + 2), [0.66, 0.66, 0.64], P2(0, front + depth / 2, y0 + 3)); }
        const ry = top + 7, r0 = front + depth + 1, r1 = front - 2;   // the canopy
        g.quadO(P2(-span - 2, r0, ry), P2(span + 2, r0, ry), P2(span + 2, r1, ry - 1.5), P2(-span - 2, r1, ry - 1.5), roofC, P2(0, (r0 + r1) / 2, ry - 8)); g.quadO(P2(-span - 2, r0, ry - 0.4), P2(span + 2, r0, ry - 0.4), P2(span + 2, r1, ry - 1.9), P2(-span - 2, r1, ry - 1.9), roofU, P2(0, (r0 + r1) / 2, ry + 8));
        for (let t = -span; t <= span + 0.1; t += span / 3) { const p = P2(t, front + depth + 0.8, y0); box(g, p[0], y0, p[2], 0.7, ry - y0, 0.7, ua, [0.86, 0.87, 0.9]); }
      };
      stand(1, 0, B + 6, 24, A + 2, 0.62); stand(-1, 0, B + 6, 28, A + 2, 0.66); stand(1, 1, A + 7, 20, B + 2, 0.5); stand(-1, 1, A + 7, 20, B + 2, 0.5);
      for (const sd of [-1, 1]) { const p = Pq(sd * A, 0, y0 + 0.2); for (const o of [-3.66, 3.66]) { const q = Pq(sd * A, o, 0); cyl(g, q[0], y0 + 0.2, q[2], 0.07, 2.44, 6, [0.96, 0.96, 0.96]); } box(g, p[0], y0 + 2.6, p[2], 0.12, 0.12, 7.4, ua + Math.PI / 2, [0.96, 0.96, 0.96]); }
      for (let x = -A - 40; x <= A + 40; x += 6) for (let z = -B - 40; z <= B + 40; z += 6) { const p = Pq(x, z, 0); bldMark(p[0], p[2]); }
      nBld++;
    }

    /* ---- the old stone gates at the east end of the boulevard (the monument of 1927, simplified): the central arch on its piers with the
       figure on top, a straight colonnade of nine columns either side ending in a pavilion ---- */
    if (D.gates) {
      const [gx, gz, ga, gl] = D.gates, ux = Math.cos(ga), uz = Math.sin(ga), y0 = groundH(gx, gz) - 0.2, g = scen.get(gx, gz), st = [0.87, 0.84, 0.77], stD = [0.76, 0.73, 0.66];
      const Pq = (u, v) => [gx + ux * u - uz * v, gz + uz * u + ux * v];
      for (const sd of [-1, 1]) { const [px, pz] = Pq(sd * 6.2, 0); box(g, px, y0, pz, 3.6, 13.5, 4.2, ga, st, stD); }   // the piers
      { const [px, pz] = Pq(0, 0); box(g, px, y0 + 10.5, pz, 16, 3, 4.4, ga, st, stD); box(g, px, y0 + 13.5, pz, 12, 2.6, 3.6, ga, st, stD);   // the arch's head and the attic
        cyl(g, px, y0 + 16.1, pz, 1.1, 1.6, 8, stD, st); cone(g, px, y0 + 17.7, pz, 0.7, 3.4, 8, [0.62, 0.66, 0.6], [0.7, 0.74, 0.68], 0);   // the figure (a cloaked winged form, very simplified)
        for (const sd of [-1, 1]) box(g, px + ux * sd * 0.9, y0 + 19.6, pz + uz * sd * 0.9, 1.8, 1.4, 0.25, ga + sd * 0.5, [0.64, 0.68, 0.62]); }
      for (const sd of [-1, 1]) {   // the colonnades
        for (let k = 0; k < 9; k++) { const [px, pz] = Pq(sd * (11 + k * 3.6), 0.6); cyl(g, px, y0, pz, 0.5, 0.6, 8, stD); cyl(g, px, y0 + 0.6, pz, 0.42, 7.6, 10, st, st, 0.36); }
        const [ex, ez] = Pq(sd * (10.5 + 8 * 3.6 / 2 + 0.3), 0.6); box(g, ex, y0 + 8.2, ez, 30.5, 1.6, 2.2, ga, st, stD); box(g, ex, y0 - 0.1, ez, 30.5, 0.3, 2.6, ga, stD);
        const [qx, qz] = Pq(sd * (gl / 2 - 3), 0.4); box(g, qx, y0, qz, 6.5, 10.5, 5.2, ga, st, stD); }
      for (let u = -gl / 2; u <= gl / 2; u += 4) for (let v = -6; v <= 6; v += 4) { const [px, pz] = Pq(u, v); bldMark(px, pz); }
    }
    for (const b of SPEC.dome || []) {   // the dome on the island: white faceted panels on a low drum
      const g = scen.get(b.cx, b.cz), y0 = Math.max(WY + 0.6, groundH(b.cx, b.cz)), r = Math.sqrt(1073 / Math.PI) * 1.05, nL = 6, nA = 18, wc = [0.95, 0.95, 0.96], wd = [0.84, 0.85, 0.88];
      cyl(g, b.cx, y0 - 1, b.cz, r, 3.2, nA, [0.7, 0.7, 0.72]);
      for (let l = 0; l < nL; l++) for (let a = 0; a < nA; a++) { const t0 = l / nL * Math.PI / 2, t1 = (l + 1) / nL * Math.PI / 2, a0 = a / nA * TAU, a1 = (a + 1) / nA * TAU, yb = y0 + 2.2;
        const p = (t, aa) => [b.cx + Math.cos(t) * Math.cos(aa) * r, yb + Math.sin(t) * r, b.cz + Math.cos(t) * Math.sin(aa) * r];
        g.quadO(p(t0, a0), p(t0, a1), p(t1, a1), p(t1, a0), (l + a) % 2 ? wc : wd, [b.cx, yb, b.cz]); }
      bldMark(b.cx, b.cz);
    }
    for (const b of SPEC.carillon || []) { const g = scen.get(b.cx, b.cz), y0 = groundH(b.cx, b.cz) - 0.2; box(g, b.cx, y0, b.cz, 3.2, 22, 3.2, 0.3, [0.84, 0.82, 0.78], [0.84, 0.82, 0.78]); box(g, b.cx, y0 + 22, b.cz, 3.6, 3.4, 3.6, 0.3, [0.5, 0.52, 0.5], [0.3, 0.42, 0.36]); cone(g, b.cx, y0 + 25.4, b.cz, 2.2, 4, 4, [0.3, 0.42, 0.36], null, 0.3 + Math.PI / 4); }

    /* ---- the trees: OpenStreetMap's single trees and tree rows (the boulevards, the parks), more in ESA WorldCover's tree cover; maples, lindens,
       honey locusts and a few spruces (instanced, in chunks) ---- */
    const treeGeo = (kind) => {   // unit trees, height 1 (the instances scale them)
      const g = new GB(), r = rng(500 + kind), tr = [0.33, 0.27, 0.22];
      if (kind === 3) { cyl(g, 0, 0, 0, 0.03, 0.2, 5, tr); for (let k = 0; k < 3; k++) cone(g, 0, 0.14 + k * 0.24, 0, 0.27 - k * 0.07, 0.42 - k * 0.06, 7, [0.16, 0.3, 0.2], [0.2, 0.36, 0.24], k); }   // a spruce
      else {
        cyl(g, 0, 0, 0, 0.035, 0.52, kind ? 4 : 5, tr, null, 0.02);
        const lf = kind === 0 ? [0.26, 0.42, 0.17] : kind === 1 ? [0.3, 0.44, 0.19] : [0.42, 0.54, 0.2], lfD = lf.map(v => v * 0.78);
        const cl = kind === 0 ? [[0, 0.64, 0, 0.32], [0.05, 0.84, 0.03, 0.23]] : kind === 1 ? [[0, 0.7, 0, 0.36]] : kind === 1 ? [[0, 0.62, 0, 0.24], [0, 0.82, 0, 0.2], [0.08, 0.7, -0.08, 0.17]] : [[0.1, 0.7, 0.02, 0.2], [-0.12, 0.76, 0.06, 0.18], [0.02, 0.9, -0.04, 0.15]];
        cl.forEach(([x, y, z, rr], k) => puff(g, x, y, z, rr, kind === 1 ? 0.9 : 0.85, k % 2 ? lfD : lf, r, 0.22, 0.6, 1.14, false));
      }
      const geo = g.geometry(); geo.computeBoundingSphere(); return geo; };
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const TCH = [new IChunks(treeGeo(0), tMat, 384), new IChunks(treeGeo(1), tMat, 768)];   // (near the circuit: two crowns and a shadow; farther off one crown)
    let nTrees = 0;
    const treeOk = (x, z) => { if (onBld(x, z) || inLake(x, z) || pitZone(x, z)) return false; const q = near(x, z, 20); if (q.i >= 0 && q.dd < (q.lat > 0 ? T.br[q.i] : T.bl[q.i]) - WA[q.i] + 2.5) return false; return !onRoad(x, z, -1, 0.6); };
    const plant = (x, z, big) => { if (!treeOk(x, z)) return; const h = R(), kind = h < 0.42 ? 0 : h < 0.7 ? 1 : h < 0.94 ? 2 : 3, ht = (big ? 9 : 7) + R() * 6, sx = ht * (kind === 3 ? 0.62 : kind === 1 ? 0.7 : 0.9), sy = kind === 3 ? ht * 1.15 : ht;
      (near(x, z, 70).dd < 60 ? TCH[0] : TCH[1]).add(x, groundH(x, z) - 0.1, z, R() * TAU, sx, sy, kind === 3 ? vary([0.62, 0.78, 0.78], R, 0.1) : kind === 2 ? vary([1.12, 1.08, 0.92], R, 0.12) : vary([1, 1, 1], R, 0.16)); nTrees++; };   // (the locusts' lighter, yellower green by the instance colour)
    { const Tr = D.trees; for (let k = 0; k < Tr.length; k += 2) plant(Tr[k] + (R() - 0.5), Tr[k + 1] + (R() - 0.5), true); }
    for (let j = 0; j < LCD.nz; j += 2) for (let i = 0; i < LCD.nx; i += 2) {   // WorldCover's tree cover (lawn under trees, class 2): one tree per ~12 m square there
      if (LCA[j * LCD.nx + i] !== 2) continue; const x = LCD.x0 + (i + R()) * LCD.cell * 2, z = LCD.z0 + (j + R()) * LCD.cell * 2; if (R() < 0.75) plant(x, z, false); }

    /* ---- parked cars in the car parks (rows along each lot's long side, instanced, no shadows) ---- */
    const carGeo = (() => { const g = new GB(); box(g, 0, 0.18, 0, 4.4, 0.72, 1.8, 0, [1, 1, 1], [0.95, 0.95, 0.95]); box(g, -0.15, 0.88, 0, 2.3, 0.56, 1.6, 0, [0.22, 0.26, 0.32], [1, 1, 1]); return g.geometry(); })();
    const cars = new IChunks(carGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), 384);
    const CARC = [[0.92, 0.92, 0.92], [0.12, 0.12, 0.13], [0.62, 0.63, 0.66], [0.75, 0.1, 0.1], [0.16, 0.26, 0.5], [0.85, 0.85, 0.8], [0.35, 0.36, 0.38], [0.5, 0.12, 0.12], [0.22, 0.4, 0.3]];
    let nCars = 0;
    for (const [x, y, z, rot, sc, col] of traffic) cars.add(x, y, z, rot, sc, sc, col);
    for (const pk of D.parks) { const ang = pk[0], Pp = H2(pk.slice(1)), ux = Math.cos(ang), uz = Math.sin(ang);
      let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const [x, z] of Pp) { const u = x * ux + z * uz, v = -x * uz + z * ux; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
      for (let v = v0 + 3; v < v1 - 2.5; v += 16.4) for (const dv of [0, 5.4]) for (let u = u0 + 2; u < u1 - 1.5; u += 2.7) {
        if (R() > 0.62 || nCars > 950) continue; const vv = v + dv, x = u * ux - vv * uz, z = u * uz + vv * ux;
        if (!inPoly(Pp, x, z) || !treeOk(x, z)) continue;
        cars.add(x, groundH(x, z), z, -(ang + Math.PI / 2) + (R() - 0.5) * 0.06 + (R() < 0.5 ? Math.PI : 0), 1, 1, CARC[Math.floor(R() * CARC.length)]); nCars++; } }

    /* ---- the lake: its water inside the area (OpenStreetMap's Lake Ontario, the islands left out), a wide plane on to the horizon, the shore
       band where the ground meets it (foam, shallows); boats in the two marinas ---- */
    {
      const WO = { len: 1.6, amp: 0.8, refl: 0.5, land: 0.6, shal: 0.5, lap: 0.6, surf: 0.25 }, wMat = waterMat(tex, Object.assign({ color: 0xa6c4d6 }, WO)), g = new GB(true), W1 = [1, 1, 1];
      const U = (p) => [p[0] / 40, -p[1] / 40], P3 = (p, y) => [p[0], y, p[1]];
      for (const poly of D.lake) {
        const outer = H2(poly[0]), holes = poly.slice(1).map(H2);
        const tri = THREE.ShapeUtils.triangulateShape(outer.map(([x, z]) => new THREE.Vector2(x, z)), holes.map(h => h.map(([x, z]) => new THREE.Vector2(x, z)))), all = outer.concat(...holes);
        for (const [a, b, c] of tri) g.quadUp(P3(all[a], WY), P3(all[b], WY), P3(all[c], WY), P3(all[c], WY), [W1, W1, W1, W1], [U(all[a]), U(all[b]), U(all[c]), U(all[c])]);
      }
      const fz = out.bounds.maxZ + 550;   // (beyond the area: the open lake to the south, under the haze)
      g.quadUp([-9000, WY - 0.03, fz - 40], [9000, WY - 0.03, fz - 40], [9000, WY - 0.03, 9000], [-9000, WY - 0.03, 9000], [W1, W1, W1, W1], [[-225, (40 - fz) / 40], [225, (40 - fz) / 40], [225, -225], [-225, -225]]);
      const wm = new THREE.Mesh(g.geometry(), wMat); wm.receiveShadow = true; wm.matrixAutoUpdate = false; root.add(wm);
      const sd = waterline((i, j) => gyAt(i, j), GX0, GZ0, GC, 0, GNX - 1, 0, GNZ - 1, WY);
      const band = shoreBand(out.bounds.minX, out.bounds.minZ, out.bounds.maxX, out.bounds.maxZ, WY + 0.015, sd, 40, { F: 8 });
      addShore(root, band, wMat, WO); out.dyn.water = tex.water;
      // boats in the marinas (OpenStreetMap's marina areas): white hulls with a cabin, a few with a mast
      const boatGeo = (() => { const b = new GB(); box(b, 0, -0.3, 0, 7, 1.1, 2.4, 0, [0.95, 0.95, 0.94], [0.9, 0.9, 0.88]); box(b, -0.6, 0.8, 0, 2.6, 0.9, 1.7, 0, [0.85, 0.86, 0.88], [0.94, 0.94, 0.95]); cyl(b, 0.6, 0.8, 0, 0.06, 9, 4, [0.8, 0.8, 0.82]); return b.geometry(); })();
      const boats = new IChunks(boatGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), 512); let nb = 0;
      for (const [mx, mz, mr] of D.marinas || [[-426, 513, 45], [753, 150, 120]]) for (let k = 0; k < mr * 0.9; k++) {
        const a = R() * TAU, r = Math.sqrt(R()) * mr, x = mx + Math.cos(a) * r, z = mz + Math.sin(a) * r;
        if (!inLake(x, z) || !inLake(x + 6, z) || !inLake(x - 6, z) || !inLake(x, z + 6) || !inLake(x, z - 6)) continue;
        boats.add(x, WY + 0.2, z, Math.round(R() * 2) * Math.PI / 2 + (R() - 0.5) * 0.2, 0.8 + R() * 0.5, 0.8 + R() * 0.5, vary([1, 1, 1], R, 0.1)); nb++; }
      boats.addTo(root, true);
    }

    let tramStop = null;
    /* ---- the railway north of the expressway (ballast, two rails a track) and the streetcar tracks (concrete, two rails, the overhead line's
       poles); a streetcar waiting in the loop (red and white, generic) and its platform with a shelter ---- */
    {
      const g = new RB(), gr = new RB(), wireP = [];
      for (const r of D.rail) {
        const tram = r[0] === 1, P = H2(r.slice(1)); let pb = -1, pr = [-1, -1], acc = 0;
        for (let k = 0; k < P.length; k++) {
          const [x, z] = P[k], a = P[Math.max(0, k - 1)], b = P[Math.min(P.length - 1, k + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
          const q = near(x, z, 12); if (q.i >= 0 && q.dd < 3) { pb = -1; pr = [-1, -1]; continue; }
          const y = groundH(x, z) + (tram ? 0.04 : 0.12), bw = tram ? 1.6 : 2.2, bc = tram ? [0.62, 0.61, 0.58] : [0.44, 0.4, 0.37];
          const rb = g.row([[x - nx * bw, y - (tram ? 0 : 0.12), z - nz * bw], [x - nx * (bw - 0.5), y, z - nz * (bw - 0.5)], [x + nx * (bw - 0.5), y, z + nz * (bw - 0.5)], [x + nx * bw, y - (tram ? 0 : 0.12), z + nz * bw]], [bc, bc, bc, bc]);
          if (pb >= 0) g.link(pb, rb, 0, 3); pb = rb;
          for (const [m, o] of [[0, -0.72], [1, 0.72]]) { const rr = gr.row([[x + nx * (o - 0.04), y + 0.13, z + nz * (o - 0.04)], [x + nx * (o + 0.04), y + 0.13, z + nz * (o + 0.04)]], [[0.42, 0.4, 0.38], [0.6, 0.6, 0.62]]); if (pr[m] >= 0) gr.link(pr[m], rr, 0, 1); pr[m] = rr; }
          if (tram && k) { acc += Math.hypot(x - P[k - 1][0], z - P[k - 1][1]); if (acc > 30) { acc = 0; const px = x + nx * 2.6, pz = z + nz * 2.6; cyl(scen.get(px, pz), px, y, pz, 0.12, 7.4, 6, [0.36, 0.37, 0.4]); box(scen.get(px, pz), px - nx * 1.3, y + 6.6, pz - nz * 1.3, 2.7, 0.08, 0.08, Math.atan2(nz, nx), [0.36, 0.37, 0.4]); wireP.push([x, y + 6.1, z]); } }
        }
      }
      addM(g, matV); addM(gr, matV);
      // the streetcar in the loop: the longest tram line, near its middle
      // (the loop by the grounds: the streetcar track's point nearest the circuit, 35 m off it at least)
      let tl = null, m = 0, bd = 1e9; for (const r of D.rail) { if (r[0] !== 1) continue; const P = H2(r.slice(1)); if (P.length < 6) continue; for (let k = 2; k < P.length - 3; k++) { const q = near(P[k][0], P[k][1], 80); if (q.i >= 0 && q.dd > 35 && q.dd < bd) { bd = q.dd; tl = P; m = k; } } }
      if (tl) { const [x, z] = tl[m], [x2, z2] = tl[Math.min(tl.length - 1, m + 2)], h = Math.atan2(z2 - z, x2 - x), y = groundH(x, z) + 0.2, gg = scen.get(x, z), ux = Math.cos(h), uz = Math.sin(h);
        const red = [0.82, 0.12, 0.12], wh = [0.94, 0.94, 0.92], gl = [0.2, 0.26, 0.32];
        for (const o of [-10, 0, 10]) { const cx = x + ux * o, cz = z + uz * o; box(gg, cx, y + 0.3, cz, 9.6, 1.4, 2.5, h, red, red); box(gg, cx, y + 1.7, cz, 9.6, 1.25, 2.5, h, gl, gl); box(gg, cx, y + 2.95, cz, 9.6, 0.5, 2.5, h, wh, [0.84, 0.85, 0.86]); }
        box(gg, x + ux * 15, y + 0.3, z + uz * 15, 0.5, 2.6, 2.4, h, red, red); box(gg, x, y + 3.45, z, 4, 0.5, 1.4, h, [0.5, 0.5, 0.52]);
        // the platform beside it (a raised concrete island with a yellow edge strip)
        const px = x - uz * 3.4, pz = z + ux * 3.4; box(gg, px, y - 0.25, pz, 44, 0.5, 2.6, h, [0.7, 0.7, 0.68], [0.82, 0.81, 0.78]); box(gg, px + uz * 1.15, y + 0.25, pz - ux * 1.15, 44, 0.012, 0.3, h, [0.95, 0.8, 0.1]);
        tramStop = { x: px, z: pz, h, y: y + 0.25 }; }
    }

    /* ---- the city on the horizon: the towers downtown and round about (OpenStreetMap heights) and the very tall TV tower (generic), drawn
       behind everything and pulled in onto a sphere just inside the camera's far plane (skyUpdate), faded into the haze ---- */
    let SKY = null;
    {
      const P0 = [], C = [], I = [], HZ = [];
      const quad = (a, b, c, d, col, hz) => { const v = P0.length / 3; for (const p of [a, b, c, d]) { P0.push(p[0], p[1], p[2]); C.push(col[0], col[1], col[2]); HZ.push(hz); } I.push(v, v + 1, v + 2, v, v + 2, v + 3); };
      const sbox = (x, z, Lb, Wb, ang, y0, y1, col, top) => { const c = Math.cos(ang), s = Math.sin(ang), Pp = (u, v, y) => [x + c * u - s * v, y, z + s * u + c * v];
        const cs = [[-Lb / 2, -Wb / 2], [Lb / 2, -Wb / 2], [Lb / 2, Wb / 2], [-Lb / 2, Wb / 2]];
        for (let e = 0; e < 4; e++) { const [u0, v0] = cs[e], [u1, v1] = cs[(e + 1) % 4], k = 0.82 + 0.18 * Math.abs(Math.cos(ang + e * Math.PI / 2 + 0.6)); quad(Pp(u0, v0, y0), Pp(u1, v1, y0), Pp(u1, v1, y1), Pp(u0, v0, y1), col.map(q => q * k), 0); }
        quad(Pp(-Lb / 2, -Wb / 2, y1), Pp(Lb / 2, -Wb / 2, y1), Pp(Lb / 2, Wb / 2, y1), Pp(-Lb / 2, Wb / 2, y1), top || col, 0); };
      for (const [x, z, Lb, Wb, ang, h, tv] of D.sky) {
        const y0 = demH(clamp(x, out.bounds.minX, out.bounds.maxX), clamp(z, out.bounds.minZ, out.bounds.maxZ)) - 2;
        if (tv) {   // the tower: a tapering concrete shaft, the pod two thirds up, a smaller one higher, the mast
          const sh = [0.78, 0.77, 0.74], cA = Math.cos(0.4), sA = Math.sin(0.4);
          for (let k = 0; k < 6; k++) { const ya = y0 + k * 58, yb = ya + 58, wa = 16 - k * 1.8, wb = 16 - (k + 1) * 1.8; for (let e = 0; e < 3; e++) { const a0 = e / 3 * TAU + 0.4, a1 = a0 + TAU / 3, p = (r, a, y) => [x + Math.cos(a) * r, y, z + Math.sin(a) * r]; quad(p(wa, a0, ya), p(wa, a1, ya), p(wb, a1, yb), p(wb, a0, yb), sh.map(q => q * (0.85 + 0.15 * Math.cos(a0))), 0); } }
          sbox(x, z, 34, 34, 0.4, y0 + 335, y0 + 352, [0.55, 0.56, 0.58], [0.7, 0.7, 0.72]); sbox(x, z, 14, 14, 0.4, y0 + 445, y0 + 452, [0.6, 0.6, 0.62]); sbox(x, z, 4, 4, 0.4, y0 + 452, y0 + h, [0.82, 0.3, 0.26]);
          void cA; void sA; continue;
        }
        const glass = h > 60 ? R() < 0.6 : R() < 0.35, col = glass ? vary([0.46, 0.55, 0.64], R, 0.18) : vary([0.76, 0.74, 0.7], R, 0.14);
        sbox(x, z, Math.max(8, Lb), Math.max(8, Wb), ang, y0, y0 + h, col, col.map(v => v * 0.9));
      }
      const g = new THREE.BufferGeometry(), nv = P0.length / 3;
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P0), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3)); g.setAttribute('aHz', new THREE.BufferAttribute(new Float32Array(HZ), 1));
      g.setIndex(I); g.computeVertexNormals();
      const Uh = { uHz: { value: new THREE.Color(0xc9d8e6) } }, m = new THREE.MeshLambertMaterial({ vertexColors: true, fog: false });
      m.onBeforeCompile = (sh) => { sh.uniforms.uHz = Uh.uHz;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aHz;\nvarying float vHz;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHz = aHz;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uHz;\nvarying float vHz;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb = mix( gl_FragColor.rgb, uHz, vHz );'); };
      m.customProgramCacheKey = () => 'toSky';
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = -50; mesh.matrixAutoUpdate = false; mesh.name = 'toSky';
      mesh.onBeforeRender = (r, sc) => { if (sc && sc.fog) Uh.uHz.value.copy(sc.fog.color); };
      root.add(mesh); SKY = { mesh, P0: Float32Array.from(P0), cx: 1e9, cy: 0, cz: 0, cf: 0 };
    }
    const skyUpdate = (cam) => {   // (no camera: the towers in their own places, the world test's pose)
      const F = SKY, g = F.mesh.geometry, p = g.attributes.position.array, hz = g.attributes.aHz.array, P0 = F.P0;
      if (!cam) { if (F.cx !== 1e9) { p.set(P0); hz.fill(0.5); g.attributes.position.needsUpdate = g.attributes.aHz.needsUpdate = true; F.cx = 1e9; } return; }
      const c = cam.position; if (Math.abs(c.x - F.cx) + Math.abs(c.y - F.cy) + Math.abs(c.z - F.cz) < 9 && cam.far === F.cf) return;   // (2 km off and more: a few metres of the camera's own move hardly show)
      F.cx = c.x; F.cy = c.y; F.cz = c.z; F.cf = cam.far;
      const R0 = cam.far - 60, R1 = cam.far - 6;
      for (let v = 0, k = 0; k < P0.length; v++, k += 3) { const dx = P0[k] - c.x, dy = P0[k + 1] - c.y, dz = P0[k + 2] - c.z, Dd = Math.max(1, Math.hypot(dx, dy, dz)), r = R0 + (R1 - R0) * (1 - Math.exp(-Math.max(0, Dd - 400) / 3000)), f = r / Dd;
        p[k] = c.x + dx * f; p[k + 1] = c.y + dy * f; p[k + 2] = c.z + dz * f; hz[v] = 0.42 + 0.4 * (1 - Math.exp(-Math.max(0, Dd - 1500) / 4000)); }
      g.attributes.position.needsUpdate = true; g.attributes.aHz.needsUpdate = true;
    };
    skyUpdate(null);

    /* ---- the street furniture: loose props (Core's PROPK) the cars knock over. OpenStreetMap's lights, hydrants, bins, bollards, cabinets and
       bus stops where they stand; at the junctions inside the barriers (the pockets of def.walls) the corners get the rest of a Toronto
       junction: the signals (a pole on the near corner, a mast arm over the track on the far one) with their controller's cabinet, or stop
       signs on a quiet one, signs, a hydrant, bollards on the corners' tips, a zebra across the side road and orange drums in front of the
       fence that closes it ---- */
    const props = out.props, PQ = {};
    const prop = (kind, x, z, yaw, col) => { const q = T.query(x, z, -1, PQ); props.push({ kind, x, z, yaw: yaw || 0, col: col || 0, i: q.i }); };
    const free = (x, z, r) => { const q = near(x, z, 30); if (q.i < 0) return !onRoad(x, z, -1, 0.3); const bar = q.lat > 0 ? T.br[q.i] : T.bl[q.i], a = Math.abs(q.lat);
      if (q.dd < 0.5 || (a > bar - (r || 0.4) && a < bar + 0.9 + (r || 0.4)) || pitZone(x, z)) return false; return !onRoad(x, z, -1, 0.3) || q.dd < CURB; };
    const toRoad = (x, z) => {   // the direction from (x, z) to the nearest carriageway (the circuit within 26 m, else a street)
      const q = near(x, z, 26); if (q.i >= 0 && q.dd < 26) return Math.atan2(-q.lat * T.nz[q.i], -q.lat * T.nx[q.i]);
      const Lc = SH.get(Math.floor(x / SHC) * 4096 + Math.floor(z / SHC)); let best = 1e9, a = R() * TAU;
      if (Lc) for (let k = 0; k < Lc.length; k += 2) { const S = ST[Lc[k]]; if (S.kind === 2 || S.kind === 3) continue; const m = Lc[k + 1], [ax, az] = S.P[m], [bx, bz] = S.P[m + 1], vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1e-9), 0, 1), px = ax + vx * t - x, pz = az + vz * t - z, d = Math.hypot(px, pz); if (d < best) { best = d; a = Math.atan2(pz, px); } }
      return a; };
    const nearPts = (arr, x, z, r) => { for (let k = 0; k < (arr || []).length; k += 2) if ((arr[k] / 10 - x) ** 2 + (arr[k + 1] / 10 - z) ** 2 < r * r) return true; return false; };
    const F = D.furn, cnt = {};
    const put = (kind, x, z, yaw, col) => { prop(kind, x, z, yaw, col); cnt[kind] = (cnt[kind] || 0) + 1; };
    for (const [key, kind] of [['lamp', 'lamp'], ['hydrant', 'hydrant'], ['bin', 'bin'], ['bollard', 'bollard'], ['cabinet', 'cabinet'], ['recy', 'bin']]) {
      const A = F[key] || []; for (let k = 0; k < A.length; k += 2) { const x = A[k] / 10, z = A[k + 1] / 10; if (!free(x, z, 0.4)) continue; put(kind, x, z, kind === 'lamp' ? toRoad(x, z) : R() * TAU); } }
    { const A = F.stop || []; for (let k = 0; k < A.length; k += 2) { const x = A[k] / 10, z = A[k + 1] / 10, a = toRoad(x, z), bx = x - Math.cos(a) * 1.6, bz = z - Math.sin(a) * 1.6;   // the bus stops: a shelter set back, the stop's sign at the kerb
      if (free(bx, bz, 1.2)) put('shelter', bx, bz, a); if (free(x, z, 0.2)) put('sign', x + Math.cos(a + 1.57) * 2.4, z + Math.sin(a + 1.57) * 2.4, a); } }
    if (tramStop) for (const o of [-12, 12]) put('shelter', tramStop.x + Math.cos(tramStop.h) * o, tramStop.z + Math.sin(tramStop.h) * o, tramStop.h - Math.PI / 2);   // (the streetcar stop's shelters)
    // the junctions in the barriers' pockets
    const SIG = F.sig || [], xG = new GB();
    let nJ = 0;
    for (const [a, b, sd, off] of def.walls) {
      if (off < 6.5) continue;
      const i0 = T.idx(sAt(a)), latS = (i) => WA[i] + CURB + 1.6;
      let sa = null, sb = null;
      for (let d = a - 4; d <= b + 4; d += 0.5) { const i = T.idx(sAt(d)), p = Pt(i, sd * latS(i), 0); if (onRoad(p[0], p[2], -1, 0)) { if (sa === null) sa = d; sb = d; } }
      if (sa === null) continue;
      const sm = (sa + sb) / 2, im = T.idx(sAt(sm)), pm = Pt(im, sd * (WA[im] + CURB + 2), 0), sig = nearPts(SIG, pm[0], pm[2], 45), wi = (d) => WA[T.idx(sAt(d))];
      const corner = (d, dl) => { const i = T.idx(sAt(d)), o = sd * (WA[i] + CURB + dl), [x, z] = atSf(sAt(d), o); return [x, z, i]; };
      const across = Math.atan2(T.nz[im] * -sd, T.nx[im] * -sd);   // (+x towards the track)
      const c1 = corner(sa - 1.8, 0.9), c2 = corner(sb + 1.8, 0.9);
      if (sig) { put('signal', c1[0], c1[1], across); put('signalm', c2[0], c2[1], across);
        const k1 = corner(sa - 4.5, 2.6); put('cabinet', k1[0], k1[1], across);
        const p2 = corner(sb + 2.6, 2.4); put('signal', p2[0], p2[1], across + Math.PI / 2);   // (facing the side road)
        const s2 = corner(sb + 6, 1.0); put('sign', s2[0], s2[1], across);
      } else { for (const [d, dl] of [[sa - 1.4, 1.2], [sb + 1.4, 1.2]]) { const p = corner(d, dl); put('sign', p[0], p[1], across + Math.PI / 2); } }   // (stop signs for the side road)
      for (const [d, dl] of [[sa - 0.6, 0.35], [sb + 0.6, 0.35], [sa - 2.8, 0.35], [sb + 2.8, 0.35]]) { const p = corner(d, dl); put('bollard', p[0], p[1], 0); }
      if (!nearPts(F.hydrant, pm[0], pm[2], 30)) { const p = corner(sa - 6.5, 1.4); put('hydrant', p[0], p[1], R() * TAU); }
      if (!nearPts(F.lamp, pm[0], pm[2], 16)) { const p = corner(sb + 9, 0.7); put('lamp', p[0], p[1], across); }
      { const p = corner(sb + 4.2, 2.2); if (R() < 0.7) put('bin', p[0], p[1], R() * TAU); }
      for (let d = sa + 1; d <= sb - 1; d += Math.max(1.6, (sb - sa - 2) / 3)) { const i = T.idx(sAt(d)), [x, z] = atSf(sAt(d), sd * (barO(i, sd) - 1.0)); put('barrel', x, z, R() * TAU); }   // drums before the closing fence
      // the zebra across the side road's mouth, along the circuit's sidewalk line
      if (off < 13 && sb - sa < 24) for (let d = sa + 0.4; d < sb - 0.4; d += 1.1) { const i = T.idx(sAt(d)), o0 = WA[i] + CURB + 0.2, o1 = o0 + 3; strip(sAt(d), sAt(d + 0.5), sd * o0, sd * o1, wl, 0.036); }
      nJ++;
    }
    out.propStats = Object.assign({ junctions: nJ }, cnt);

    /* ---- the grandstands (temporary steel stands behind the fence): along the start / finish straight opposite the pits, inside Turn 3,
       along the lakeshore and by Turn 11; packed with fans (the crowd picture); spectators standing along the fence elsewhere ---- */
    const CR = crowdCtx({ gH: groundH, near: (x, z) => near(x, z, 40).dd, maxSlope: 0.8 });
    CR.excluded = (x, z) => onBld(x, z) || inLake(x, z);
    CR.water = (x, z) => inLake(x, z);
    const STANDS = [[-215, -45, 1, 2.6, 15, 1], [32, 172, 1, 2.6, 15, 1], [1150, 1240, 1, 2.2, 13, 0], [640, 880, -1, 2.4, 13, 1], [2700, 2795, 1, 2.2, 12, 0]];   // [from, to, side, metres past the barrier, depth, roof]
    {
      const gs = new GB(), gc = new RB(true), stC = [0.58, 0.6, 0.64], stD = [0.44, 0.46, 0.5], stT = [0.7, 0.72, 0.76], roofC = [0.72, 0.76, 0.82], roofU = [0.6, 0.63, 0.7];
      for (const [d0, d1, sd, f0, depth, roof] of STANDS) {
        let prev = null, pc = -1;
        for (let d = d0; d <= d1; d += 3) {
          const s = sAt(d), q0 = crAt(s), q = Object.assign({}, q0), front = (sd > 0 ? q.br : q.bl) + f0, P2 = (o, h) => [q.px + q.nx * sd * o, h, q.pz + q.nz * sd * o];
          const y0 = groundH(q.px + q.nx * sd * front, q.pz + q.nz * sd * front) - 0.1, top = y0 + 1.3 + depth * 0.5;
          const cs = [P2(front, y0), P2(front, y0 + 1.3), P2(front + 1.0, y0 + 1.3), P2(front + depth, top), P2(front + depth, y0)];
          if (prev) { const inn = P2(front + depth / 2, y0 + 1); for (let m = 0; m < 4; m++) gs.quadO(prev.cs[m], prev.cs[m + 1], cs[m + 1], cs[m], m === 2 ? stT : m === 1 ? stC : stD, inn); }
          else { const inn = P2(front + depth / 2, y0 + 1); gs.quadO(cs[0], cs[1], cs[3], cs[4], stD, [inn[0] + q.tx * 3, inn[1], inn[2] + q.tz * 3]); }
          const cp = [P2(front + 1.1, y0 + 1.37), P2(front + depth - 0.2, top + 0.02)], u = s / 12, cuv = [[u, 0.004], [u, 0.996 * Math.min(1, depth / 15)]];
          const rc = gc.row(sd > 0 ? cp : cp.slice().reverse(), [[1, 1, 1], [1, 1, 1]], sd > 0 ? cuv : cuv.slice().reverse()); if (pc >= 0) gc.link(pc, rc, 0, 1); pc = rc;
          if (roof) { const rp = [P2(front + depth + 0.3, top + 3.6), P2(front + depth * 0.45, top + 2.7)], rc = Math.round(d / 3) % 4 === 0 ? roofU : roofC;   // (a canopy over the back rows: the front rows and the fans in them stay in view from above)
            if (prev && prev.rp) { gs.quadO(prev.rp[0], prev.rp[1], rp[1], rp[0], rc, P2(front + depth / 2, top - 5)); gs.quadO(prev.rp[0], prev.rp[1], rp[1], rp[0], [0.4, 0.41, 0.44], P2(front + depth / 2, top + 9)); }
            if (Math.round(d / 3) % 4 === 0) { const [bx, , bz] = P2(front + depth - 0.3, 0); box(scen.get(bx, bz), bx, y0, bz, 0.4, top + 3.6 - y0, 0.4, q.tx ? Math.atan2(q.tz, q.tx) : 0, [0.8, 0.81, 0.84]); }
            prev = { cs, rp }; } else prev = { cs };
          const [cx, , cz] = P2(front + depth / 2, 0); CR.exclAdd(cx, cz, depth / 2 + 2); for (let o = front - 1; o < front + depth + 1; o += 4) { const [x, , z] = P2(o, 0); bldMark(x, z); }
        }
        if (prev) { const qe = crAt(sAt(d1)), inn = [prev.cs[2][0] - qe.tx * 3, prev.cs[2][1], prev.cs[2][2] - qe.tz * 3]; gs.quadO(prev.cs[0], prev.cs[1], prev.cs[3], prev.cs[4], stD, inn); }
      }
      addM(gs, matV, true); addM(gc, crowdUV(new THREE.MeshLambertMaterial({ map: tex.crowd, vertexColors: true }), 1, 0.06, 0.06));
    }
    // the fans standing behind the fence (general admission): at the corners and along the lakeshore
    for (const [d0, d1, sd, rows, dens] of [[200, 290, -1, 3, 0.55], [430, 620, -1, 3, 0.5], [1255, 1330, 1, 4, 0.6], [1440, 1500, -1, 3, 0.5], [1520, 1600, 1, 3, 0.45], [1740, 1830, 1, 3, 0.45], [2390, 2460, 1, 3, 0.5], [2540, 2640, -1, 3, 0.45], [-40, -12, -1, 2, 0.4]])
      crowdRun(CR, sAt(d0), sAt(d0) + (d1 - d0), sd, { rows, dens, first: 1.1, below: 1.2, above: 2, minClear: 1.4 });

    /* ---- the banners on the fences (the city, the province, the country) and the turn numbers' boards ---- */
    const atlas = (() => { const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d');
      const B = [['TORONTO', '#0d2a4f', '#ffffff', '#d62f2a'], ['ONTARIO', '#f4f2ec', '#163a6b', '#d62f2a'], ['CANADA', '#d62f2a', '#ffffff', '#ffffff'], ['LAKE ONTARIO', '#1d5d8f', '#ffffff', '#f2c21a']];
      B.forEach(([t, bg, fg, ac], k) => { const y0 = k * 64; x.fillStyle = bg; x.fillRect(0, y0, 1024, 64); x.fillStyle = ac; x.fillRect(0, y0 + 56, 1024, 8);
        x.fillStyle = fg; x.font = '900 40px "Russo One", "Arial Black", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; for (const cx of [256, 768]) x.fillText(t, cx, y0 + 30); });
      for (let n = 1; n <= 11; n++) { const cx = ((n - 1) % 8) * 128, cy = 256 + Math.floor((n - 1) / 8) * 128; x.fillStyle = '#f4f2ec'; x.fillRect(cx + 4, cy + 4, 120, 120); x.fillStyle = '#16171a'; x.fillRect(cx + 10, cy + 10, 108, 108);
        x.fillStyle = '#f4f2ec'; x.font = '900 72px "Russo One", "Arial Black", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n), cx + 64, cy + 68); }
      return ownTex(new THREE.CanvasTexture(c)); })();
    const ban = new GB(true);
    for (let d = 40; d < L - 40; d += 9) {
      const i = T.idx(sAt(d)); if (Math.abs(T.k[i]) > 1 / 120 || (d > L - 240 && d < L)) continue;
      const k = Math.floor(d / 9) % 4, sd = (Math.floor(d / 36) % 2) ? 1 : -1; if (gapAt(i, sd)) continue;
      const j = T.idx(sAt(d + 7.6)), bi = barO(i, sd), bj = barO(j, sd); if (Math.abs(bi - bj) > 0.3 || bi - WA[i] > 3) continue;
      const v0 = 1 - (k + 1) * 0.125 + 0.004, v1 = 1 - k * 0.125 - 0.004, A = Pt(i, sd * (bi + 0.28), 1.05), Bq = Pt(j, sd * (bj + 0.28), 1.05), Cq = Pt(j, sd * (bj + 0.28), 2.0), Dq = Pt(i, sd * (bi + 0.28), 2.0), inn = Pt(i, sd * (bi + 3), 1.5);
      ban.quadO(A, Bq, Cq, Dq, [1, 1, 1], inn, sd > 0 ? [[0.5, v0], [0, v0], [0, v1], [0.5, v1]] : [[0, v0], [0.5, v0], [0.5, v1], [0, v1]]);
    }
    def.turns.forEach(([tx, tz], k) => {   // the turn's number on a board 40 m before it, on the outside
      const it = T.nearestIdx(tx, tz), sb = it * ds - 40, i = T.idx(sb), sd = T.k[it] > 0 ? -1 : 1, b0 = barO(i, sd), p = Pt(i, sd * (b0 + 0.8), 0), y = groundH(p[0], p[2]);
      const u0 = (k % 8) / 8, v0 = 0.5 - Math.floor(k / 8) * 0.25 - 0.25, fx = -T.tx[i], fz = -T.tz[i], hw = 0.6, nx = T.nx[i], nz = T.nz[i];
      ban.quadO([p[0] - nx * hw, y + 2.2, p[2] - nz * hw], [p[0] + nx * hw, y + 2.2, p[2] + nz * hw], [p[0] + nx * hw, y + 3.4, p[2] + nz * hw], [p[0] - nx * hw, y + 3.4, p[2] - nz * hw], [1, 1, 1], [p[0] - fx, y + 2.8, p[2] - fz],
        sd * 0 === 0 ? [[u0 + 0.125, v0], [u0, v0], [u0, v0 + 0.25], [u0 + 0.125, v0 + 0.25]] : null);
      box(scen.get(p[0], p[2]), p[0] - fx * 0.05, y, p[2] - fz * 0.05, 0.1, 3.4, 0.1, 0, [0.4, 0.41, 0.44]);
    });

    /* ---- benches (OpenStreetMap) and the like: static, on the sidewalks ---- */
    { const A = F.bench || []; for (let k = 0; k < A.length; k += 2) { const x = A[k] / 10, z = A[k + 1] / 10, qb = near(x, z, 30); if (!free(x, z, 0.8) || (qb.i >= 0 && Math.abs(qb.lat) < barO(qb.i, Math.sign(qb.lat) || 1) + 1.2)) continue; const a = toRoad(x, z) + Math.PI / 2, y = groundH(x, z) + 0.15, g = scen.get(x, z);
      box(g, x, y + 0.42, z, 1.8, 0.06, 0.45, -a, [0.46, 0.32, 0.2]); box(g, x - Math.cos(a + 1.57) * 0.25, y + 0.5, z - Math.sin(a + 1.57) * 0.25, 1.8, 0.4, 0.05, -a, [0.46, 0.32, 0.2]); for (const o of [-0.75, 0.75]) box(g, x + Math.cos(a) * o, y, z + Math.sin(a) * o, 0.08, 0.45, 0.45, -a, [0.15, 0.15, 0.16]); } }

    /* ---- finish the meshes ---- */
    matV.name = 'toV'; aMat.name = 'toAsph'; swMat.name = 'toWalk'; gMat.name = 'toGround'; fMat.name = 'toFence'; facMats.forEach((m, k) => { m.name = 'toFac' + k; }); tMat.name = 'toTree';
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true); scenU.addTo(sceneryGroup, swMat, true, true);
    fac.forEach((ch, k) => ch.addTo(sceneryGroup, facMats[k], true, true));
    addM(lineG, new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
    addM(xG, matV);
    { const bm = addM(ban, new THREE.MeshLambertMaterial({ map: atlas }), false); }
    const nT = TCH[0].addTo(root, true) + TCH[1].addTo(root, false);
    cars.addTo(root, false);
    crowdFinish(CR, root, out);
    out.dyn.ext = (t, car, cam) => { skyUpdate(car ? cam : null); };
    out.stats = { buildings: nBld, trees: nT, cars: nCars, streets: nStreet, props: props.length, junctions: nJ, crowd: out.crowdN };   // (read by the tests)
    return out;
  };
})();
