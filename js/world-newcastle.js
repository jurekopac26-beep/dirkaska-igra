/* =========================================================================
   WORLD — Newcastle (theme 'newcastle'): its own builder (World.ext.newcastle), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (T, hash)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, HC, IChunks, RB, TAU, addShore, atS, atSf, box, clamp, clearance, cone, crAt, crH, crowdCtx, crowdFinish, crowdRun, crowdUV, cyl,
    gable, ico, inPoly, lerp, nearest, nrLump, pitLaneScenery, polyDist, propFloorTable, rng, rock, shoreBand, sstep, starCone, vary, waterMat,
    waterline
  } = API;
  let T, hash;   // (World's, for the build under way)
  API.sync.push(() => { ({ T, hash } = API); });

  /* ================= NEWCASTLE (theme 'newcastle'): the street circuit in the East End of Newcastle, New South Wales =================
     Its own builder on the real ground (the data in def.nc, see js/tracks/newcastle.js): the terrain (SRTM / Geoscience Australia) with the
     sea and the harbour, the beaches and the rocks; the circuit between concrete walls under a catch fence (pockets at the junctions: the
     street furniture there can be knocked over), the pits on the harbour side of the pit straight, temporary grandstands; the city round it
     from OpenStreetMap: the buildings from their footprints and storeys (sandstone and brick of the old town, terraces with iron lace,
     flats, offices), the streets with their kerbs and markings, the junctions' traffic signals, signs, bollards, bins and cabinets, the
     light rail's tracks, the trees (Norfolk Island pines along the beaches, figs and palms in the parks), parked cars; the lighthouse on
     the headland and the breakwater, the old fort on its hill, ships waiting offshore, Stockton across the harbour, the hills on the
     horizon. Built for the game's two cameras (from above, behind the car): roofs, streets, the walls, trees and the skyline; nothing small
     at eye height. Place names only; no names of events, series, sponsors, people or businesses. ---- */
  let NC = null;                                // per-build data (decoded scenery, the ground grid)
  const NCC = 8, NCB = 32;                      // ground cell (m), ground block (cells)
  function ncI16(b64) { const s = atob(b64), n = s.length >> 1, a = new Int16Array(n); for (let k = 0; k < n; k++) a[k] = ((s.charCodeAt(2 * k) | (s.charCodeAt(2 * k + 1) << 8)) << 16) >> 16; return a; }
  function ncU8(b64) { const s = atob(b64), a = new Uint8Array(s.length); for (let k = 0; k < s.length; k++) a[k] = s.charCodeAt(k); return a; }
  function ncPrep() {
    const d = T.def.nc, P = NC = { d };
    const D = d.dem, u = ncU8(D.b64), dem = new Float32Array(u.length); for (let k = 0; k < u.length; k++) dem[k] = D.lo + u[k] * D.step;
    P.D = D; P.dem = dem; P.x0 = D.x0; P.z0 = D.z0; P.x1 = D.x0 + (D.nx - 1) * D.cell; P.z1 = D.z0 + (D.nz - 1) * D.cell;
    const bb = (poly) => { let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9; for (const [x, z] of poly) { bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); bz0 = Math.min(bz0, z); bz1 = Math.max(bz1, z); } return { bx0, bx1, bz0, bz1 }; };
    // areas [type, rings, (n, x*2, z*2 ...)...]: 0 sea and harbour, 1 lawns, 2 pools, 3 sand, 4 sports pitches, 5 rock, 6 scrub, 7 car parks, 8 plazas, 9 wood, 10 garden beds
    const A = ncI16(d.area); P.areas = [];
    for (let k = 0; k < A.length;) { const t = A[k++], nr = A[k++], rings = [];
      for (let r = 0; r < nr; r++) { const n = A[k++], ring = []; for (let q = 0; q < n; q++, k += 2) ring.push([A[k] / 2, A[k + 1] / 2]); rings.push(ring); }
      P.areas.push(Object.assign({ t, rings }, bb(rings[0]))); }
    P.ah = new Map();   // the areas hashed in 64 m cells
    for (const a of P.areas) for (let i = Math.floor(a.bx0 / 64); i <= Math.floor(a.bx1 / 64); i++) for (let j = Math.floor(a.bz0 / 64); j <= Math.floor(a.bz1 / 64); j++) { const key = i + ',' + j; let L = P.ah.get(key); if (!L) P.ah.set(key, L = []); L.push(a); }
    // buildings [n, kind, height*4, base*4, roof, x*2, z*2 ...]
    const B = ncI16(d.bld); P.bld = [];
    for (let k = 0; k < B.length;) { const n = B[k], kind = B[k + 1], h = B[k + 2] / 4, mh = B[k + 3] / 4, roof = B[k + 4]; k += 5; const poly = []; for (let q = 0; q < n; q++, k += 2) poly.push([B[k] / 2, B[k + 1] / 2]); P.bld.push(Object.assign({ kind, h, mh, roof, poly }, bb(poly))); }
    // streets [n, class, x*2, z*2 ...]; class 0 main road ... 4 living street, 5 service lane, 6 pedestrian street
    const S = ncI16(d.st); P.st = [];
    for (let k = 0; k < S.length;) { const n = S[k], c = S[k + 1]; k += 2; const pts = []; for (let q = 0; q < n; q++, k += 2) pts.push([S[k] / 2, S[k + 1] / 2]); P.st.push({ cl: c & 15, pts }); }
    // junctions [x*2, z*2, flags (1 give way / stop, 2 signals, 4 crossings), legs, (heading (deg), class)...]
    const X = ncI16(d.ix); P.ix = [];
    for (let k = 0; k < X.length;) { const x = X[k] / 2, z = X[k + 1] / 2, f = X[k + 2], n = X[k + 3]; k += 4; const legs = []; for (let q = 0; q < n; q++, k += 2) legs.push({ a: X[k] * Math.PI / 180, cl: X[k + 1] }); P.ix.push({ x, z, sig: !!(f & 2), give: !!(f & 1), cw: !!(f & 4), legs }); }
    // street furniture [kind, x*2, z*2, the street's heading (deg), 0]
    const Q = ncI16(d.pt); P.pt = []; for (let k = 0; k < Q.length; k += 5) P.pt.push({ k: Q[k], x: Q[k + 1] / 2, z: Q[k + 2] / 2, a: Q[k + 3] * Math.PI / 180 });
    const TR = ncI16(d.tree); P.tree = []; for (let k = 0; k < TR.length; k += 2) P.tree.push([TR[k] / 2, TR[k + 1] / 2]);
    const RL = ncI16(d.tram); P.tram = []; for (let k = 0; k < RL.length;) { const n = RL[k++], p = []; for (let q = 0; q < n; q++, k += 2) p.push([RL[k] / 2, RL[k + 1] / 2]); P.tram.push(p); }
    // the ground grid (heights computed lazily)
    const G = P.G = { x0: P.x0, z0: P.z0, nx: Math.round((P.x1 - P.x0) / NCC) + 1, nz: Math.round((P.z1 - P.z0) / NCC) + 1 };
    G.h = new Float32Array(G.nx * G.nz).fill(NaN);
    // the distance to the circuit's centre line on a 32 m grid (far from it: plainer scenery)
    { const C = 32, nx = Math.ceil((P.x1 - P.x0) / C) + 1, nz = Math.ceil((P.z1 - P.z0) / C) + 1, a = new Float32Array(nx * nz);
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = P.x0 + i * C, z = P.z0 + j * C; let m = 1e9; for (let q = 0; q < T.N; q += 3) { const dx = T.px[q] - x, dz = T.pz[q] - z, e = dx * dx + dz * dz; if (e < m) m = e; } a[j * nx + i] = Math.sqrt(m); }
      P.dist = { C, nx, nz, a }; }
    { const C = d.lc, r = ncU8(C.rle), a = new Uint8Array(C.nx * C.nz); for (let k = 0, o = 0; k < r.length; k += 2) { a.fill(r[k + 1], o, o + r[k]); o += r[k]; } P.lc = Object.assign({ a }, C); }   // (ESA WorldCover: 0 grass, 1 trees, 2 scrub, 3 built-up, 4 bare, 5 water, 6 wetland)
    const F = d.far, fh = ncU8(F.b64), fl = ncU8(F.lc); P.far = { x0: F.x0, z0: F.z0, cell: F.cell, n: F.n, h: Float32Array.from(fh, v => (v - 2) * 2), lc: fl };
  }
  function ncDist(x, z) { const D = NC.dist, gx = clamp((x - NC.x0) / D.C, 0, D.nx - 1.001), gz = clamp((z - NC.z0) / D.C, 0, D.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, a = D.a, W = D.nx;
    return (a[j * W + i] * (1 - u) + a[j * W + i + 1] * u) * (1 - v) + (a[(j + 1) * W + i] * (1 - u) + a[(j + 1) * W + i + 1] * u) * v; }
  function ncDem(x, z) {
    const D = NC.D, gx = clamp((x - D.x0) / D.cell, 0, D.nx - 1.001), gz = clamp((z - D.z0) / D.cell, 0, D.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, W = D.nx, a = NC.dem;
    return (a[j * W + i] * (1 - u) + a[j * W + i + 1] * u) * (1 - v) + (a[(j + 1) * W + i] * (1 - u) + a[(j + 1) * W + i + 1] * u) * v;
  }
  function ncLC(x, z) { const C = NC.lc, i = clamp(Math.round((x - C.x0) / C.cell), 0, C.nx - 1), j = clamp(Math.round((z - C.z0) / C.cell), 0, C.nz - 1); return C.a[j * C.nx + i]; }
  function ncInArea(a, x, z) { if (x < a.bx0 || x > a.bx1 || z < a.bz0 || z > a.bz1 || !inPoly(a.rings[0], x, z)) return false; for (let r = 1; r < a.rings.length; r++) if (inPoly(a.rings[r], x, z)) return false; return true; }
  function ncArea(x, z, t) { const L = NC.ah.get(Math.floor(x / 64) + ',' + Math.floor(z / 64)); if (L) for (const a of L) if (a.t === t && ncInArea(a, x, z)) return a; return null; }
  function ncWater(x, z) { return !!ncArea(x, z, 0) && !ncArea(x, z, 7); }
  function ncH(x, z) {   // the ground: the model's height, the sea bed under the water, the beaches down to the water, never under 0.6 m on land; flat to the road by the circuit
    let h = ncDem(x, z);
    const hd = T.def.nc.lm && T.def.nc.lm.head; if (hd) { const e = Math.hypot((x - hd[0]) / hd[2], (z - hd[1]) / (hd[2] * 0.55)); if (e < 1.25) h = Math.max(h, hd[3] * sstep(1.25, 0.7, e) - 1); }   // (the headland: an island of sandstone, steep all round)
    if (ncWater(x, z)) h = Math.min(h, -2.5);
    else { h = Math.max(h, 0.6); if (ncArea(x, z, 3)) h = Math.min(h, 1.2 + Math.max(0, h - 1.2) * 0.25); }
    const n = nearest(x, z);
    if (n.i >= 0) { const dd = Math.abs(n.lat) - n.bar, hr = T.hy[n.i] - 0.03; h = dd <= 0.6 ? hr : lerp(hr, h, sstep(0.6, h < hr - 3 ? 14 : 30, dd)); if (dd < 12) h = Math.min(h, hr + Math.max(0, dd - 1) * 0.5); }
    const cx = Math.floor(x / HC), cz = Math.floor(z / HC);   // (not above another leg's road close by)
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const L = hash.get((cx + a) + ',' + (cz + b)); if (L) for (const i of L) { const dx = x - T.px[i], dz = z - T.pz[i], lat = dx * T.nx[i] + dz * T.nz[i], al = Math.abs(dx * T.tx[i] + dz * T.tz[i]);
      if (al < 3 && Math.abs(lat) < (lat > 0 ? T.br[i] : T.bl[i]) + 0.6) h = Math.min(h, T.hy[i] - 0.03); } }
    return h;
  }
  function ncGH(i, j) { const G = NC.G; i = clamp(i, 0, G.nx - 1); j = clamp(j, 0, G.nz - 1); const k = j * G.nx + i; let h = G.h[k]; if (h !== h) h = G.h[k] = ncH(G.x0 + i * NCC, G.z0 + j * NCC); return h; }
  function ncGround(x, z) {   // the ground mesh's surface (the same two triangles per cell)
    const G = NC.G, gx = clamp((x - G.x0) / NCC, 0, G.nx - 1.001), gz = clamp((z - G.z0) / NCC, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
    if (u + v <= 1) { const a = ncGH(i, j); return a + u * (ncGH(i + 1, j) - a) + v * (ncGH(i, j + 1) - a); }
    const e = ncGH(i + 1, j + 1); return e + (1 - u) * (ncGH(i, j + 1) - e) + (1 - v) * (ncGH(i + 1, j) - e);
  }
  // the facades (one tile = a bay ~3.3 m wide and a storey high, repeated over a wall): 0 sandstone with arched windows (the old town), 1 red brick
  // with tall windows (warehouses, the old customs and rail buildings), 2 a terrace's painted front with its iron-lace veranda, 3 white flats
  // with glass balconies, 4 an office's glass and spandrels, 5 shop fronts under an awning (the ground floor), 6 weatherboards (the houses),
  // 7 corrugated iron (sheds), 8 dark brown brick (the 1960s), 9 cream brick walk-up flats, 10 a flat roof's membrane, 11 a pastel stucco
  // (between the wars, by the beach)
  let ncFTex = null;
  function ncFacades() {
    if (ncFTex) return ncFTex;
    const A = document.createElement('canvas'); A.width = 512; A.height = 384; const ax = A.getContext('2d'); let nk = 0;
    const r = rng(2300), mk = (draw) => { const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d'); draw(x); const k = nk++; ax.drawImage(c, (k % 4) * 128, (2 - Math.floor(k / 4)) * 128); return k; };
    const grad = (x, a, b, y0, y1, x0, x1) => { const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
    const speck = (x, n, a) => { for (let q = 0; q < n; q++) { x.fillStyle = r() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`; x.fillRect(r() * 128, r() * 128, 2 + r() * 3, 2 + r() * 3); } };
    const win = (x, u, v, w, h, c0, c1) => { x.fillStyle = grad(x, c0 || '#8aa2b2', c1 || '#2c3a46', v, v + h, u, u + w); x.fillRect(u, v, w, h); };
    const bricks = (x, c0, c1, mort) => { x.fillStyle = mort; x.fillRect(0, 0, 128, 128); for (let v = 0; v < 128; v += 6) for (let u = (v / 6) % 2 ? -6 : 0; u < 128; u += 12) { const k = r(); x.fillStyle = k < 0.5 ? c0 : c1; x.fillRect(u + 0.5, v + 0.5, 11, 5); } };
    [
      mk(x => { x.fillStyle = '#dcc9a3'; x.fillRect(0, 0, 128, 128); speck(x, 260, 0.04); x.fillStyle = 'rgba(120,96,64,0.18)'; for (let v = 0; v < 128; v += 16) x.fillRect(0, v, 128, 1);   // 0 sandstone
        for (const u of [26, 74]) { x.fillStyle = '#c9b48c'; x.beginPath(); x.arc(u + 14, 40, 18, Math.PI, 0); x.fill(); x.fillRect(u - 4, 40, 36, 60); win(x, u, 40, 28, 56); x.beginPath(); x.arc(u + 14, 40, 14, Math.PI, 0); x.fillStyle = '#6f8796'; x.fill(); x.fillStyle = '#d8c6a0'; x.fillRect(u + 12, 26, 4, 70); x.fillStyle = '#bba57c'; x.fillRect(u - 6, 96, 40, 6); } }),
      mk(x => { bricks(x, '#9a4a32', '#8a3f2a', '#b89c84'); for (const u of [22, 76]) { x.fillStyle = '#c6b49a'; x.fillRect(u - 4, 20, 38, 6); win(x, u, 26, 30, 70); x.fillStyle = '#e9e2d2'; x.fillRect(u + 13, 26, 3, 70); x.fillRect(u, 58, 30, 3); x.fillStyle = '#c6b49a'; x.fillRect(u - 4, 96, 38, 6); } }),
      mk(x => { x.fillStyle = '#efe6d2'; x.fillRect(0, 0, 128, 128); speck(x, 120, 0.03); win(x, 18, 18, 30, 60); win(x, 74, 18, 34, 60); x.fillStyle = '#4d5d50'; x.fillRect(0, 84, 128, 6); x.fillRect(0, 122, 128, 6);   // 2 terrace, iron lace
        x.strokeStyle = '#3e4a40'; x.lineWidth = 2; for (let u = 0; u < 128; u += 8) { x.beginPath(); x.arc(u + 4, 98, 4, 0, TAU); x.stroke(); x.beginPath(); x.moveTo(u, 90); x.lineTo(u, 122); x.stroke(); } x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(0, 90, 128, 8); }),
      mk(x => { x.fillStyle = '#f2f1ec'; x.fillRect(0, 0, 128, 128); win(x, 8, 14, 112, 76, '#90a8b8', '#33424e'); x.fillStyle = '#f2f1ec'; x.fillRect(62, 14, 4, 76);   // 3 white flats, glass balconies
        x.fillStyle = 'rgba(190,215,225,0.6)'; x.fillRect(2, 72, 124, 24); x.fillStyle = '#e4e3dd'; x.fillRect(0, 96, 128, 10); x.fillStyle = '#cfcec8'; x.fillRect(0, 70, 128, 3); }),
      mk(x => { x.fillStyle = grad(x, '#8fb0c4', '#2e4656', 0, 128, 0, 70); x.fillRect(0, 0, 128, 128); x.fillStyle = 'rgba(255,255,255,0.14)'; x.fillRect(0, 0, 128, 34);   // 4 glass offices
        x.fillStyle = '#b9bec2'; x.fillRect(0, 98, 128, 30); x.fillStyle = '#9ea4a8'; x.fillRect(0, 98, 128, 3); x.fillStyle = '#d4d8da'; for (const u of [0, 64]) x.fillRect(u, 0, 3, 98); }),
      mk(x => { x.fillStyle = '#d9d1c2'; x.fillRect(0, 0, 128, 128); win(x, 6, 34, 116, 94, '#9ab0bc', '#2a3640'); x.fillStyle = '#3a3f45'; x.fillRect(62, 34, 4, 94); x.fillRect(6, 34, 116, 4);   // 5 shop fronts, an awning
        const aw = ['#7a2b22', '#1f4f6e', '#2e5b33', '#6b5a2b', '#5a5d62'][Math.floor(r() * 5)]; x.fillStyle = aw; x.fillRect(0, 14, 128, 18); x.fillStyle = 'rgba(0,0,0,0.28)'; x.fillRect(0, 30, 128, 4); }),
      mk(x => { for (let v = 0; v < 128; v += 8) { x.fillStyle = '#f2eee4'; x.fillRect(0, v, 128, 6); x.fillStyle = '#d4cdbd'; x.fillRect(0, v + 6, 128, 2); }   // 6 weatherboards
        x.fillStyle = '#fbfaf6'; x.fillRect(34, 26, 60, 62); win(x, 38, 30, 52, 54); x.fillStyle = '#fbfaf6'; x.fillRect(62, 30, 4, 54); }),
      mk(x => { for (let u = 0; u < 128; u += 8) { x.fillStyle = '#c3c7c9'; x.fillRect(u, 0, 4, 128); x.fillStyle = '#a7acaf'; x.fillRect(u + 4, 0, 4, 128); } x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, 0, 128, 5); }),   // 7 corrugated iron
      mk(x => { bricks(x, '#6e4a36', '#5e3f2e', '#8a7564'); for (const u of [14, 70]) { win(x, u, 22, 44, 62); x.fillStyle = '#d9d2c4'; x.fillRect(u, 84, 44, 6); } x.fillStyle = '#4a3226'; x.fillRect(0, 108, 128, 20); }),   // 8 brown brick
      mk(x => { bricks(x, '#d8c29a', '#cdb48a', '#e6dccb'); for (const u of [12, 70]) { win(x, u, 24, 46, 58); x.fillStyle = '#f2ece0'; x.fillRect(u + 21, 24, 4, 58); x.fillRect(u - 2, 82, 50, 5); } x.fillStyle = 'rgba(80,60,40,0.25)'; x.fillRect(0, 112, 128, 4); }),   // 9 cream brick walk-ups
      mk(x => { x.fillStyle = '#f4f3f0'; x.fillRect(0, 0, 128, 128); speck(x, 300, 0.05); x.fillStyle = 'rgba(0,0,0,0.08)'; for (const u of [0, 42, 85]) x.fillRect(u, 0, 2, 128); }),   // 10 flat roof
      mk(x => { x.fillStyle = '#efe0c8'; x.fillRect(0, 0, 128, 128); speck(x, 140, 0.03); x.fillStyle = '#d8c3a2'; x.fillRect(0, 0, 128, 10); x.fillRect(0, 116, 128, 12);   // 11 pastel stucco
        for (const u of [16, 72]) { x.fillStyle = '#c9b190'; x.fillRect(u - 3, 24, 46, 70); win(x, u, 27, 40, 64); x.fillStyle = '#efe0c8'; for (let v = 40; v < 91; v += 13) x.fillRect(u, v, 40, 2); } }),
    ];
    const t = new THREE.CanvasTexture(A); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return (ncFTex = t);
  }
  // the facades' material: one atlas for every style, each tile repeated over its wall (u = bays + style * 1000, v = storeys); a wall's own
  // texture coordinates for the night's lit windows (Render's litWindows reads vUv: the tile's texel, one window cell per whole number)
  function ncFacadeMat(map) {
    const m = new THREE.MeshLambertMaterial({ map, vertexColors: true });
    m.onBeforeCompile = (sh, rr) => {
      const g2 = rr && rr.capabilities && rr.capabilities.isWebGL2;
      sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', [
        'vec2 ncU = vUv; float ncS = floor( ncU.x / 1000.0 ); ncU.x -= ncS * 1000.0;',
        'vec2 ncT = ( fract( ncU ) * 0.984 + 0.008 + vec2( mod( ncS, 4.0 ), floor( ncS / 4.0 ) ) ) / vec2( 4.0, 3.0 );',
        g2 ? 'vec4 texelColor = textureGrad( map, ncT, dFdx( ncU ) * vec2( 0.246, 0.328 ), dFdy( ncU ) * vec2( 0.246, 0.328 ) );' : 'vec4 texelColor = texture2D( map, ncT );',
        'texelColor = mapTexelToLinear( texelColor ); diffuseColor *= texelColor;',
        '#define vUv ( ncT + floor( ncU ) )'].join('\n'));
    };
    m.customProgramCacheKey = () => 'ncFacade';
    return m;
  }
  // the trees at their real size (instances scale them a little): 0 a Norfolk Island pine (a tall straight trunk, tiers of level branches, a
  // narrow pyramid), 1 a Moreton Bay fig (a buttressed trunk, a huge dark dome), 2 a Canary Island date palm (a thick trunk, a round crown of
  // arching fronds), 3 a slim cocos palm, 4 a street tree (a brush box or a plane: a round light crown), 5 a coastal banksia / tea tree (low,
  // grey-green, windswept)
  function ncTreeGeo(kind, lo) {
    const g = new GB(), R = rng(2310 + kind), frond = (c, a, el, len, wid, droop, col, col2) => {
      const ca = Math.cos(a), sa = Math.sin(a), m = [c[0] + ca * len * 0.5, c[1] + Math.sin(el) * len * 0.5, c[2] + sa * len * 0.5], t = [c[0] + ca * len, c[1] + Math.sin(el) * len * 0.6 - droop, c[2] + sa * len];
      const px = -sa * wid, pz = ca * wid, inn = [c[0], c[1] - 3, c[2]];
      g.triO(c, [m[0] + px, m[1], m[2] + pz], t, col, inn, col, col2); g.triO(c, t, [m[0] - px, m[1], m[2] - pz], col, inn, col2, col); };
    const rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    if (lo) {   // (far off: one or two solids)
      const tr = [0.42, 0.36, 0.3];
      if (kind === 0) { cyl(g, 0, -0.2, 0, 0.32, 6, 4, tr); cone(g, 0, 4.5, 0, 4.4, 19, 6, [0.17, 0.31, 0.18], [0.24, 0.4, 0.22], 0); }
      else if (kind === 2 || kind === 3) { const H = kind === 2 ? 10 : 13; cyl(g, 0, -0.2, 0, kind === 2 ? 0.5 : 0.2, H, 4, [0.5, 0.42, 0.3]); ico(g, 0, H + 0.4, 0, kind === 2 ? 3.6 : 2.8, 0.45, [0.24, 0.42, 0.18], R, 0.2); }
      else { const H = kind === 1 ? 9.5 : kind === 4 ? 6.6 : 2.4, r = kind === 1 ? 9 : kind === 4 ? 3.6 : 2; cyl(g, 0, -0.2, 0, r * 0.08, H * 0.5, 4, tr); ico(g, 0, H, 0, r, kind === 1 ? 0.55 : 0.8, kind === 5 ? [0.33, 0.41, 0.28] : [0.16, 0.3, 0.15], R, 0.25); }
    } else if (kind === 0) {   // Norfolk Island pine, 24 m
      const H = 24; cyl(g, 0, -0.2, 0, 0.32, H, 5, [0.42, 0.34, 0.27], null, 0.08);
      for (let k = 0; k < 5; k++) { const y = 5 + k * 3.7, r = (1 - k / 7) * 4.6 + 0.5, col = k % 2 ? [0.16, 0.3, 0.17] : [0.19, 0.34, 0.19];
        starCone(g, 0, y, 0, r, 2.0, 5, col, [0.24, 0.4, 0.22], k * 0.6, 0.6); }
      cone(g, 0, H - 2.6, 0, 1.0, 3.4, 5, [0.2, 0.36, 0.2], [0.26, 0.42, 0.24], 0);
    } else if (kind === 1) {   // Moreton Bay fig, 15 m, 22 m across
      cyl(g, 0, -0.2, 0, 1.0, 4.5, 6, [0.5, 0.47, 0.42], null, 0.7);
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + 0.3; box(g, Math.cos(a) * 0.8, -0.2, Math.sin(a) * 0.8, 1.6, 1.4, 0.3, a, [0.46, 0.43, 0.38], null, true); }
      ico(g, 0, 9.5, 0, 9.5, 0.55, [0.13, 0.27, 0.13], R, 0.25); nrLump(g, 4.5, 10.5, 2, 5.5, 0.7, [0.15, 0.3, 0.14], R, 0.25); nrLump(g, -4.2, 10.2, -3, 5.2, 0.7, [0.12, 0.25, 0.12], R, 0.25);
    } else if (kind === 2) {   // Canary Island date palm, 11 m
      const H = 10; cyl(g, 0, -0.2, 0, 0.55, H + 0.5, 6, [0.5, 0.42, 0.3], null, 0.5);
      for (let k = 0; k < 11; k++) frond([0, H + 0.4, 0], k / 11 * TAU + R() * 0.2, (k % 2 ? 0.5 : 0.85) + R() * 0.3, 4.4 + R() * 0.8, 0.55, 1.7 + R() * 0.7, [0.2, 0.38, 0.15], [0.29, 0.47, 0.2]);
    } else if (kind === 3) {   // cocos palm, 13 m
      const H = 13; cyl(g, 0, -0.2, 0, 0.2, H, 4, [0.6, 0.56, 0.5], null, 0.16);
      for (let k = 0; k < 8; k++) frond([0, H, 0], k / 8 * TAU + R() * 0.3, 0.2 + R() * 0.5, 3.6 + R() * 0.6, 0.6, 2.2 + R() * 0.6, [0.22, 0.42, 0.17], [0.3, 0.5, 0.22]);
    } else if (kind === 4) {   // a street tree, 10 m
      cyl(g, 0, -0.2, 0, 0.25, 4.2, 5, [0.44, 0.4, 0.35], null, 0.18);
      ico(g, 0, 6.6, 0, 3.6, 0.85, [0.24, 0.38, 0.17], R, 0.3); nrLump(g, 1.6, 7.6, 0.5, 2.2, 0.8, [0.28, 0.43, 0.2], R, 0.3);
    } else {   // a coastal banksia, 4 m, windswept
      cyl(g, 0, -0.2, 0, 0.15, 1.6, 4, [0.4, 0.36, 0.3], null, 0.1);
      ico(g, 0.4, 2.5, 0, 2.1, 0.6, [0.32, 0.4, 0.27], R, 0.35); nrLump(g, -0.8, 2.2, 0.6, 1.4, 0.7, [0.36, 0.43, 0.3], R, 0.3);
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // the pavements: light concrete in 1.2 m slabs with their joints (256 px = 4.8 m), mottled; the old town's in places red brick pavers
  let ncCTex = null;
  function ncConcrete() {
    if (ncCTex) return ncCTex;
    const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d'), r = rng(2320);
    x.fillStyle = '#d0cbc1'; x.fillRect(0, 0, 256, 256);
    for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) { const k = (r() - 0.5) * 14; x.fillStyle = `rgb(${208 + k | 0},${203 + k | 0},${193 + k | 0})`; x.fillRect(a * 64, b * 64, 64, 64); }
    for (let q = 0; q < 2600; q++) { const v = r() < 0.5 ? 0 : 255; x.fillStyle = `rgba(${v},${v},${v},${(0.025 + r() * 0.05).toFixed(3)})`; x.fillRect(r() * 256, r() * 256, 1 + r() * 3, 1 + r() * 3); }
    for (let q = 0; q < 16; q++) { x.fillStyle = 'rgba(70,64,56,0.06)'; x.beginPath(); x.arc(r() * 256, r() * 256, 3 + r() * 12, 0, TAU); x.fill(); }
    x.fillStyle = 'rgba(80,76,70,0.45)'; for (let k = 0; k < 4; k++) { x.fillRect(k * 64, 0, 1.5, 256); x.fillRect(0, k * 64, 256, 1.5); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return (ncCTex = t);
  }

  function buildNewcastle(scene, tex, opts) {
    const R = rng(2641), N = T.N, w = T.w, ds = T.ds, sStart = T.startS, def = T.def, L = T.len;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: ncGround, camFloor: ncGround, props: [], farClip: true, ownTex: [] };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    ncPrep();
    const P = NC, G = P.G;
    out.bounds = { minX: P.x0, maxX: P.x1, minZ: P.z0, maxZ: P.z1 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const addM = (g, mat, cast, recv, nm) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.name = nm || ''; m.receiveShadow = recv !== false; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const CK = new Map(), ck = (key, x, z, mk, sz) => { const k = key + Math.floor(x / (sz || 512)) + ',' + Math.floor(z / (sz || 512)); let o = CK.get(k); if (!o) CK.set(k, o = { g: mk(), key, sz: sz || 512 }); return o.g; };   // geometry in 512 m chunks (culled apart)
    const ckAdd = (key, mat, cast) => { for (const [k, o] of CK) if (o.key === key) { let c = cast; if (cast === 'near') { const [a, b] = k.slice(key.length).split(',').map(Number); c = ncDist((a + 0.5) * o.sz, (b + 0.5) * o.sz) < 420; } addM(o.g, mat, c, true, key); } };
    const dS = (s) => { let d = s - sStart; d = ((d % L) + L) % L; return d; };   // metres after the start line
    const sAt = (d) => ((sStart + d) % L + L) % L;
    const excl = [], eh = new Map(), EHC = 32;   // exclusion circles (stands, pits, crowds: no trees, cars or furniture there)
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); } };
    const excluded = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (const e of Lc) if ((x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r) return true; return false; };
    const bh = new Map(), BHC = 32;   // the buildings' footprints hashed (trees, cars and furniture keep out of them)
    for (const b of P.bld) for (let a = Math.floor(b.bx0 / BHC); a <= Math.floor(b.bx1 / BHC); a++) for (let c = Math.floor(b.bz0 / BHC); c <= Math.floor(b.bz1 / BHC); c++) { const k = a + ',' + c; let Lc = bh.get(k); if (!Lc) bh.set(k, Lc = []); Lc.push(b); }
    const inBld = (x, z, m) => { const Lc = bh.get(Math.floor(x / BHC) + ',' + Math.floor(z / BHC)); if (Lc) for (const b of Lc) if (x > b.bx0 - m && x < b.bx1 + m && z > b.bz0 - m && z < b.bz1 + m && (inPoly(b.poly, x, z) || (m > 0 && polyDist(b.poly, x, z) < m))) return true; return false; };
    const inCorr = (x, z, m) => { const n = nearest(x, z); return n.i >= 0 && Math.abs(n.lat) < n.bar + (m || 0); };   // inside the circuit's walls (+ m)
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const H0 = (x, z) => ncGround(x, z);

    /* ---- the ground: 512 m blocks of 8 m cells near the circuit, a coarse mesh (32 m) for the rest; its colour: the land under it (the
       paving of the streets and squares, gardens between the houses, the grass of the parks, the sand) ---- */
    const gMat = new THREE.MeshLambertMaterial({ map: ncConcrete(), vertexColors: true });
    const gCol = (x, z, h) => {
      const n = (crH(Math.floor(x / 24), Math.floor(z / 24), 71) - 0.5) * 0.08;
      if (h < -0.4) return [0.62, 0.6, 0.55];
      if (ncArea(x, z, 3)) return [1.0, 0.95, 0.82];
      if (ncArea(x, z, 1) || ncArea(x, z, 4) || ncArea(x, z, 9) || ncArea(x, z, 6)) return [0.55 + n, 0.6 + n, 0.44 + n];
      const lc = ncLC(x, z);
      if (lc === 1) return [0.42 + n, 0.5 + n, 0.36 + n];   // (trees: gardens and the bush)
      if (lc === 0 || lc === 2 || lc === 6) return [0.6 + n, 0.64 + n, 0.48 + n];
      if (lc === 4) return [0.92, 0.88, 0.78];
      const k = 0.84 + n; return [k * 1.02, k, k * 0.95];
    };
    const nearB = new Set();
    {
      const nbx = Math.ceil((G.nx - 1) / NCB), nbz = Math.ceil((G.nz - 1) / NCB), Lb = NCB * NCC;
      for (let bj = 0; bj < nbz; bj++) for (let bi = 0; bi < nbx; bi++) { const cx = G.x0 + (bi + 0.5) * Lb, cz = G.z0 + (bj + 0.5) * Lb; let dm = 1e9; for (let i = 0; i < N; i += 8) dm = Math.min(dm, Math.hypot(T.px[i] - cx, T.pz[i] - cz));
        if (dm < 70 + Lb * 0.71) nearB.add(bi + ',' + bj); }
      const grid = (i0, j0, ni, nj, st, skip) => {
        const n = (ni + 1) * (nj + 1), pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), uv = new Float32Array(n * 2); let k = 0;
        for (let b = 0; b <= nj; b++) for (let a = 0; a <= ni; a++, k++) { const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * NCC, z = G.z0 + j * NCC, h = ncGH(i, j);
          let nx = -(ncGH(i + 1, j) - ncGH(i - 1, j)) / (2 * NCC), nz = -(ncGH(i, j + 1) - ncGH(i, j - 1)) / (2 * NCC); const l = Math.hypot(nx, 1, nz);
          pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx / l; nor[k * 3 + 1] = 1 / l; nor[k * 3 + 2] = nz / l; col.set(gCol(x, z, h), k * 3); uv[k * 2] = x / 4.8; uv[k * 2 + 1] = -z / 4.8; }
        const idx = []; for (let b = 0; b < nj; b++) for (let a = 0; a < ni; a++) { if (skip && skip(i0 + a * st, j0 + b * st)) continue; const p = b * (ni + 1) + a, q = p + 1, c = p + ni + 1, e = c + 1; idx.push(p, c, q, q, c, e); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        g.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1)); g.computeBoundingSphere(); return g; };
      const grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (const key of nearB) { const [bi, bj] = key.split(',').map(Number), i0 = bi * NCB, j0 = bj * NCB, ni = Math.min(NCB, G.nx - 1 - i0), nj = Math.min(NCB, G.nz - 1 - j0); if (ni < 1 || nj < 1) continue;
        const m = new THREE.Mesh(grid(i0, j0, ni, nj, 1), gMat); m.name = 'groundNear'; m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); }
      const st = 3, TL = 96;
      for (let j0 = 0; j0 < G.nz - 1; j0 += TL) for (let i0 = 0; i0 < G.nx - 1; i0 += TL) { const ni = Math.floor(Math.min(TL, G.nx - 1 - i0) / st), nj = Math.floor(Math.min(TL, G.nz - 1 - j0) / st); if (ni < 1 || nj < 1) continue;
        const m = new THREE.Mesh(grid(i0, j0, ni, nj, st, (i, j) => nearB.has(Math.floor(i / NCB) + ',' + Math.floor(j / NCB))), gMat); m.name = 'groundFar'; m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); }
    }
    // the sea and the harbour: one plane at 0 m out to the horizon (the land above it, the bed below); the band of foam along the beaches and the rocks
    {
      const WO = { len: 2.2, amp: 0.9, refl: 0.5, land: 0.4, shal: 0.45, lap: 0.6, surf: 0.8 }, wMat = waterMat(tex, Object.assign({ color: 0x8fb4c4 }, WO));
      const geo = new THREE.PlaneGeometry(40000, 40000, 1, 1); geo.rotateX(-Math.PI / 2); const uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * 1600, uv.getY(k) * 1600);
      const m = new THREE.Mesh(geo, wMat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); out.dyn.water = tex.water;
      const bx0 = -700, bz0 = -1300, bx1 = 1200, bz1 = 1100, i0 = Math.max(0, Math.floor((bx0 - G.x0) / NCC)), i1 = Math.min(G.nx - 2, Math.ceil((bx1 - G.x0) / NCC)), j0 = Math.max(0, Math.floor((bz0 - G.z0) / NCC)), j1 = Math.min(G.nz - 2, Math.ceil((bz1 - G.z0) / NCC));
      addShore(root, shoreBand(bx0, bz0, bx1, bz1, 0.015, waterline(ncGH, G.x0, G.z0, NCC, i0, i1, j0, j1, 0), 25, { F: 8 }), wMat, WO);
    }

    /* ---- the circuit: asphalt (darker on the racing line), white edge lines, the streets' old lane lines faded on the straights, red and white
       kerbs in the corners; between the road and the walls the footpath (light concrete on a low kerb) ---- */
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true }), cMat = new THREE.MeshLambertMaterial({ map: tex.curb, vertexColors: true }), pMat = new THREE.MeshLambertMaterial({ map: ncConcrete(), vertexColors: true });
    const kerb = [new Uint8Array(N), new Uint8Array(N)];
    for (let i = 0; i < N; i++) { const k = T.k[i]; let m = 0; for (let d = -6; d <= 6; d++) m = Math.max(m, Math.abs(T.k[(i + d + N) % N])); if (m < 1 / 70) continue; for (const side of [-1, 1]) if ((side * k > 0 && Math.abs(k) > 1 / 90) || m > 1 / 20) kerb[side > 0 ? 1 : 0][i] = 1; }
    const SW = 0.12;   // the footpath's kerb over the road
    const verge = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i]; return [[w, 0], [w + 0.05, SW], [bar + 0.3, SW], [bar + 2, SW - 0.02]]; };
    const CH = 450, offs = [-w, -w / 2, 0, w / 2, w], tileL = 8;
    const shade = (i, o) => { const rl = T.rl[i]; let k = 0.8 - 0.13 * Math.exp(-((o - rl) * (o - rl)) / 5); if (Math.abs(o) > w * 0.92) k += 0.04; return [k, k, k * 1.02]; };
    const conc = [0.86, 0.85, 0.82];
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB(true), gl = new GB(), gv = new RB(true), gk = new RB(true); let pr = -1; const pv = [-1, -1], pk = [-1, -1];
      for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
        const i = ii % N, v = ii * ds / tileL;
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o)), offs.map(o => [(o + w) / tileL, v])); if (pr >= 0) gr.link(pr, r, 0, offs.length - 1); pr = r;
        for (const side of [-1, 1]) {
          const si = side > 0 ? 1 : 0, vr = verge(i, side), pts = vr.map(([o, h]) => Pt(i, side * o, h));
          const cols = [conc, conc, conc, conc].map((c, k) => k ? vary(c, () => crH(i, k, 5), 0.05) : c), ord = side > 0 ? { p: pts, c: cols } : { p: pts.slice().reverse(), c: cols.slice().reverse() };
          if (ii % 2 === 0 || ii === Math.min(c0 + CH, N)) { const rv = gv.row(ord.p, ord.c, ord.p.map(p => [p[0] / 4.8, -p[2] / 4.8])); if (pv[si] >= 0) gv.link(pv[si], rv, 0, 3); pv[si] = rv; }
          if (kerb[si][i]) { const kp = side > 0 ? [Pt(i, w - T.curbW, 0.04), Pt(i, w + 0.02, 0.075)] : [Pt(i, -w - 0.02, 0.075), Pt(i, -w + T.curbW, 0.04)];
            const rk = gk.row(kp, [[1, 1, 1], [1, 1, 1]], side > 0 ? [[0, ii * ds / 3], [1, ii * ds / 3]] : [[1, ii * ds / 3], [0, ii * ds / 3]]); if (pk[si] >= 0) gk.link(pk[si], rk, 0, 1); pk[si] = rk; } else pk[si] = -1;
        }
        if (ii < Math.min(c0 + CH, N)) { const j = (i + 1) % N, wl = [0.9, 0.9, 0.86], ll = [0.7, 0.7, 0.68];
          for (const o of [-w + 0.35, w - 0.35]) gl.quadUp(Pt(i, o - 0.08, 0.034), Pt(i, o + 0.08, 0.034), Pt(j, o + 0.08, 0.034), Pt(j, o - 0.08, 0.034), [wl, wl, wl, wl]);
          if (Math.abs(T.k[i]) < 1 / 160 && (ii % 6) < 2) gl.quadUp(Pt(i, -0.06, 0.033), Pt(i, 0.06, 0.033), Pt(j, 0.06, 0.033), Pt(j, -0.06, 0.033), [ll, ll, ll, ll]); }
      }
      addM(gr, aMat, false, true, 'road'); addM(gl, matV, false, true, 'lines'); addM(gv, pMat, false, true, 'pave'); addM(gk, cMat, false, true, 'kerbs');
    }
    out.propR = 140;
    out.propFloor = propFloorTable(null, (i, side) => verge(i, side));
    { const g = new GB(); for (let i = 0; i < N; i++) { const j = (i + 1) % N; for (const side of [-1, 1]) { const si = side > 0 ? 1 : 0; if (kerb[si][i]) continue; const c = [0.74, 0.74, 0.72];   // the kerb's face along the road edge
      g.quadO(Pt(i, side * (w + 0.02), 0.0), Pt(j, side * (w + 0.02), 0.0), Pt(j, side * (w + 0.05), SW), Pt(i, side * (w + 0.05), SW), c, Pt(i, side * (w + 2), 0)); } }
      addM(g, matV, false, true, 'kerbface'); }
    // chequered start / finish line and the grid boxes (13 cars, staggered)
    {
      const gq = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1], wh = [0.93, 0.93, 0.9], HYp = (p) => T.hy[p[3]];
      const a = atSf(sStart - 0.8, -w), b = atSf(sStart - 0.8, w), c = atSf(sStart + 0.8, w), d = atSf(sStart + 0.8, -w);
      gq.quadUp([a[0], HYp(a) + 0.04, a[1]], [b[0], HYp(b) + 0.04, b[1]], [c[0], HYp(c) + 0.04, c[1]], [d[0], HYp(d) + 0.04, d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      for (let k = 1; k <= 14; k++) {
        const sb = sStart - 9 - (k - 1) * 7.5 + 2.6, lat = (k % 2 === 1 ? -1 : 1) * 3.4;
        const p0 = atSf(sb, lat - 1.5), p1 = atSf(sb, lat + 1.5), p2 = atSf(sb + 0.35, lat + 1.5), p3 = atSf(sb + 0.35, lat - 1.5);
        gw.quadUp([p0[0], HYp(p0) + 0.037, p0[1]], [p1[0], HYp(p1) + 0.037, p1[1]], [p2[0], HYp(p2) + 0.037, p2[1]], [p3[0], HYp(p3) + 0.037, p3[1]], [wh, wh, wh, wh]);
        const q0 = atSf(sb - 1.6, lat - 1.5), q1 = atSf(sb + 0.35, lat - 1.5), q2 = atSf(sb + 0.35, lat - 1.25), q3 = atSf(sb - 1.6, lat - 1.25);
        gw.quadUp([q0[0], HYp(q0) + 0.037, q0[1]], [q1[0], HYp(q1) + 0.037, q1[1]], [q2[0], HYp(q2) + 0.037, q2[1]], [q3[0], HYp(q3) + 0.037, q3[1]], [wh, wh, wh, wh]);
      }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw, lMat);
    }

    /* ---- the walls: concrete blocks (white, a red band in the corners) all the way round under a catch fence, down to the ground behind where
       the road runs higher; tyre walls in front of them at the big stops (Turns 1, 2, 11: the outside) ---- */
    const tyreW = [new Uint8Array(N), new Uint8Array(N)];
    for (const c of T.corners) if (c.sev >= 3 && c.angle > 0.8) { const side = -c.dir, si = side > 0 ? 1 : 0; for (let i = c.i0 - 12; i <= (c.i1 < c.i0 ? c.i1 + N : c.i1) + 8; i++) tyreW[si][((i % N) + N) % N] = 1; }
    for (const si of [0, 1]) for (let i = 0; i < N; i++) { const d = dS(i * ds); if (d > L - 140 || d < 160) tyreW[si][i] = 0; }   // (not along the grid and the pits)
    const kind = (i, side) => (side > 0 && def.pit && T.pitAt(i * ds) && T.pitAt(i * ds).gap ? -1 : tyreW[side > 0 ? 1 : 0][i] ? 4 : 1);
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true }), tyMat = new THREE.MeshLambertMaterial({ map: tex.tires, vertexColors: true });
    const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const wallC = [0.9, 0.9, 0.88], wallD = [0.7, 0.7, 0.68], wallR = [0.8, 0.18, 0.15];
    const railRow = (gr, i, side, k) => {   // a concrete block's cross-section (0.6 m wide at its foot, 0.25 at its top, 1.1 m high), facing the road
      const bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.1), oT = side * (bar + 0.28), o2 = side * (bar + 0.7), h = 1.1, band = k === 4 || Math.abs(T.k[i]) > 1 / 50, c1 = band ? wallR : wallC;
      const gb = Math.min(-0.2, ncGround(T.px[i] + T.nx[i] * o2, T.pz[i] + T.nz[i] * o2) - T.hy[i] - 0.1);   // (down to the ground behind: a retaining wall where the road runs higher)
      let p = [Pt(i, o, -0.2), Pt(i, oT, h), Pt(i, side * (bar + 0.52), h), Pt(i, o2, gb)], c = [wallD, c1, [0.82, 0.82, 0.8], wallD];
      if (side < 0) { p = p.reverse(); c = c.slice().reverse(); }
      return gr.row(p, c);
    };
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB(), gt = new RB(true);
      for (const side of [-1, 1]) {
        let prev = -1, pt = -1;
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
          const i = ii % N, k = kind(i, side);
          if (k < 0) { prev = -1; pt = -1; continue; }
          if (ii % 2 === 0 || ii === Math.min(c0 + CH, N)) { const r = railRow(gr, i, side, k); if (prev >= 0) gr.link(prev, r, 0, 3); prev = r; }
          if (k === 4) {   // the tyre wall: black tyres three high in front of the blocks, a belt of conveyor rubber over their face
            const bar = side > 0 ? T.br[i] : T.bl[i], o0 = side * (bar - 0.9), o1 = side * (bar + 0.05), v = ii * ds / 1.6;
            let tp = [Pt(i, o0, -0.05), Pt(i, o0, 0.95), Pt(i, o1, 0.95)], tu = [[v, 0.5], [v, 0.998], [v, 0.6]];
            if (side < 0) { tp = tp.reverse(); tu = tu.reverse(); }
            const rt = gt.row(tp, [[1, 1, 1], [1, 1, 1], [0.8, 0.8, 0.8]], tu); if (pt >= 0) gt.link(pt, rt, 0, 2); pt = rt;
          } else pt = -1;
        }
      }
      addM(gr, rMat, false, true, 'walls'); addM(gt, tyMat, false, true, 'tyrew');
    }
    const fenceG = new GB(true), scen = new Chunks(256);
    for (const side of [-1, 1]) {
      const bar = side > 0 ? T.br : T.bl; let acc = 0;
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N;
        if (kind(i, side) < 0 || kind(j, side) < 0 || (side > 0 && T.pitAt(i * ds) && T.pitAt(j * ds))) { acc += ds; continue; }   // (the pit wall: no fence over the lane)
        const Q = (ii, y) => { const o = side * (bar[ii] + 0.4); return [T.px[ii] + T.nx[ii] * o, T.hy[ii] + y, T.pz[ii] + T.nz[ii] * o]; };
        const u0 = acc / 2.5, u1 = (acc + ds) / 2.5, ins = Q(i, 1); ins[0] += T.nx[i] * side * 3; ins[2] += T.nz[i] * side * 3;
        fenceG.quadO(Q(i, 1.1), Q(j, 1.1), Q(j, 4.0), Q(i, 4.0), [1, 1, 1], ins, [[u0, 0], [u1, 0], [u1, 1.16], [u0, 1.16]]);
        if (i % 6 === 0) { const p = Q(i, 0); box(scen.get(p[0], p[2]), p[0], p[1] + 0.9, p[2], 0.1, 3.2, 0.1, T.hd[i], [0.55, 0.56, 0.58], null, true); }
        acc += ds;
      }
    }
    addM(fenceG, fMat, false, true, 'fence');

    /* ---- START / FINISH: a gantry with the start lights over the straight ---- */
    {
      const [x, z, h, i] = atS(sStart, 0), gy = T.hy[i], g = scen.get(x, z), span = Math.max(T.bl[i], T.br[i]) + 1.2, nx = T.nx[i], nz = T.nz[i], gray = [0.2, 0.22, 0.26];
      for (const sd of [-1, 1]) box(g, x + nx * span * sd, gy - 0.3, z + nz * span * sd, 0.8, 7.9, 0.8, h, gray);
      box(g, x, gy + 6.4, z, 1.1, 1.3, span * 2 + 0.8, h, [0.14, 0.15, 0.18], [0.24, 0.25, 0.3]);
      box(g, x, gy + 5.2, z, 0.5, 1.4, 5.2, h, [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, gy + 7.95, z + nz * o); m.rotation.y = -h; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      exclPush(x, z, span + 6);
    }
    /* ---- the pits on the harbour side of the pit straight (the lane, the boxes and the crews, the teams' garages behind them) ---- */
    pitLaneScenery({ R, scen, prop: (kind, x, z, yaw) => out.props.push({ kind, x, z, yaw, col: 0 }), excl: exclPush, root, out, ownTex, Y: (s) => T.hy[T.idx(s)] });
    for (let d = -250; d <= 200; d += 10) { const q = crAt(sAt(d)); if (q) exclPush(q.px + q.nx * (q.br + 22), q.pz + q.nz * (q.br + 22), 18); }

    /* ---- the buildings: walls in their facade, flat roofs with their plant, pitched iron or tile roofs on the houses and terraces; near the
       circuit they cast shadows ---- */
    const fAt = ncFacades(), fMat2 = ncFacadeMat(fAt);
    let nBld = 0;
    {
      const STY = [3.6, 3.6, 3.3, 3.1, 3.6, 4.5, 3.0, 4.0, 3.1, 3.0, 3.0, 3.4];
      for (const b of P.bld) {
        const poly = b.poly, n = poly.length; if (n < 3) continue;
        let area2 = 0, cx = 0, cz = 0, g0 = 1e9, g1 = -1e9; for (let k = 0; k < n; k++) { const [ax, az] = poly[k], [bx, bz] = poly[(k + 1) % n]; area2 += ax * bz - bx * az; cx += ax / n; cz += az / n; }
        for (const [x, z] of poly) { const y = ncGround(x, z); g0 = Math.min(g0, y); g1 = Math.max(g1, y); }
        const dd = ncDist(cx, cz), near = dd < 330, hh = crH(Math.round(cx), Math.round(cz), 31), hh2 = crH(Math.round(cx), Math.round(cz), 32), k = b.kind;
        if (inCorr(cx, cz, -1)) continue;   // (none on the circuit itself)
        { const lh = def.nc.lm && def.nc.lm.lh; if (lh && Math.hypot(cx - lh[0], cz - lh[1]) < 7) continue; }   // (the lighthouse: its own tower below)
        const Wb = ck('w', cx, cz, () => { const g = new GB(true); g.dUV = [10500.5, 0.5]; return g; });
        const H = Math.max(b.h, 2.6), y0 = g0 - 0.3 + b.mh, yTop = (b.mh ? g0 + b.h : Math.max(g0 + H, g1 + 2.4));
        if (k === 7) {   // a canopy on posts: its roof slab
          const pts = poly.map(([x, z]) => new THREE.Vector2(x, z)), tris = THREE.ShapeUtils.triangulateShape(pts, []), c = [0.84, 0.84, 0.82];
          for (const [a, bb, cc] of tris) Wb.triO([poly[a][0], yTop, poly[a][1]], [poly[bb][0], yTop, poly[bb][1]], [poly[cc][0], yTop, poly[cc][1]], c, [cx, yTop - 3, cz]);
          if (near) for (const [x, z] of poly) box(scen.get(x, z), x, g0, z, 0.25, yTop - g0, 0.25, 0, [0.6, 0.6, 0.6], null, true);
          nBld++; continue; }
        // the facade style
        let st;
        if (k === 0) st = H > 22 ? 4 : hh < 0.4 ? 0 : hh < 0.7 ? 1 : hh < 0.85 ? 8 : 9;
        else if (k === 1) st = H > 20 ? 3 : hh < 0.45 ? 9 : hh < 0.75 ? 3 : 8;
        else if (k === 2) st = 0;
        else if (k === 3) st = 8;
        else if (k === 4) st = cz < -500 ? 6 : hh < 0.5 ? 2 : 6;
        else if (k === 5) st = hh < 0.6 ? 7 : 1;
        else if (k === 6) st = hh < 0.5 ? 0 : 1;
        else if (k === 8) st = 2;
        else if (k === 9) st = 0;
        else st = 9;
        if (cz > 380 && cx > -260 && (k === 1 || k === 0) && hh2 < 0.5) st = 11;   // (by the beach: pastel stucco between the wars)
        const fh = STY[st], tintBase = st === 0 || st === 11 ? [[1, 0.98, 0.94], [0.98, 0.95, 0.9], [1, 1, 1], [0.95, 0.92, 0.88]] : st === 2 ? [[1, 1, 1], [0.92, 0.96, 1.0], [1, 0.95, 0.88], [0.94, 1, 0.94], [1, 0.92, 0.92]] : st === 6 ? [[1, 1, 1], [0.94, 0.97, 1], [1, 0.97, 0.9], [0.95, 1, 0.95]] : [[1, 1, 1], [0.96, 0.96, 0.96], [0.92, 0.92, 0.92]];
        const tint = tintBase[Math.floor(hh2 * tintBase.length)];
        const sgn = area2 > 0 ? 1 : -1, shop = near && (k === 0 || k === 2) && !b.mh && H > 7 && dd < 250, gf = shop ? Math.min(4.4, H * 0.4) : 0;
        const UA = (uv, s2) => uv.map(([u, v]) => [u + s2 * 1000, v]);
        for (let e = 0; e < n; e++) {
          const [ax, az] = poly[e], [bx, bz] = poly[(e + 1) % n], Le = Math.hypot(bx - ax, bz - az); if (Le < 0.3) continue;
          const ox = sgn * (bz - az) / Le, oz = -sgn * (bx - ax) / Le, inn = [(ax + bx) / 2 - ox, (y0 + yTop) / 2, (az + bz) / 2 - oz], U = Math.max(1, Math.round(Le / 3.3));
          const ya = b.mh ? y0 : g0 - 0.3;
          if (gf) Wb.quadO([ax, ya, az], [bx, ya, bz], [bx, g0 + gf, bz], [ax, g0 + gf, az], [1, 1, 1], inn, UA([[0, 0], [U, 0], [U, (gf + 0.3) / 4.5], [0, (gf + 0.3) / 4.5]], 5));
          const yb = gf ? g0 + gf : ya, V = Math.max(1, Math.round((yTop - yb) / fh)), v0 = gf ? 0 : -0.3 / fh;
          Wb.quadO([ax, yb, az], [bx, yb, bz], [bx, yTop, bz], [ax, yTop, az], tint, inn, UA([[0, v0], [U, v0], [U, V], [0, V]], st));
        }
        // the roof
        let bl = 0, dx = 1, dz = 0; for (let e = 0; e < n; e++) { const [ax, az] = poly[e], [bx, bz] = poly[(e + 1) % n], l = Math.hypot(bx - ax, bz - az); if (l > bl) { bl = l; dx = (bx - ax) / l; dz = (bz - az) / l; } }
        let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const [x, z] of poly) { const a = (x - cx) * dx + (z - cz) * dz, c = -(x - cx) * dz + (z - cz) * dx; u0 = Math.min(u0, a); u1 = Math.max(u1, a); v0 = Math.min(v0, c); v1 = Math.max(v1, c); }
        const Lr = u1 - u0, Dr = v1 - v0, rect = Math.abs(area2) / 2 > 0.8 * Lr * Dr, rot = Math.atan2(dz, dx), mx = cx + dx * (u0 + u1) / 2 - dz * (v0 + v1) / 2, mz = cz + dz * (u0 + u1) / 2 + dx * (v0 + v1) / 2;
        const ROOF_P = [[0.6, 0.27, 0.2], [0.42, 0.43, 0.45], [0.7, 0.36, 0.26], [0.32, 0.4, 0.36], [0.62, 0.63, 0.64], [0.5, 0.24, 0.2]];   // terracotta, grey iron, light terracotta, green iron, galvanised, dark red iron
        if (b.roof && rect && Dr > 3 && Lr * Dr < 700) {
          const rc = k === 9 ? [0.36, 0.38, 0.42] : ROOF_P[Math.floor(hh * ROOF_P.length)];
          gable(Wb, mx, yTop, mz, Lr + 0.5, Dr + 0.5, Math.min(Dr * (k === 9 ? 0.55 : 0.3), k === 9 ? 9 : 3.2), rot, rc, tint.map(v => v * 0.88));
        } else {
          const RCs = [[0.84, 0.84, 0.82], [0.66, 0.66, 0.64], [0.74, 0.7, 0.62], [0.9, 0.9, 0.88], [0.5, 0.5, 0.52]], RC = RCs[Math.floor(hh2 * RCs.length)];
          const pts = poly.map(([x, z]) => new THREE.Vector2(x, z)), tris = THREE.ShapeUtils.triangulateShape(pts, []), below = [cx, yTop - 5, cz];
          const RU = (q) => [10500 + poly[q][0] / 6.4, poly[q][1] / 6.4]; for (const [a, bb, cc] of tris) Wb.triO([poly[a][0], yTop, poly[a][1]], [poly[bb][0], yTop, poly[bb][1]], [poly[cc][0], yTop, poly[cc][1]], RC, below, RC, RC, RU(a), RU(bb), RU(cc));
          if (H > 24 && rect) box(Wb, mx, yTop, mz, Lr * 0.4, 3.5, Dr * 0.4, rot, [0.74, 0.74, 0.72], [0.62, 0.62, 0.62], true);   // the lift's machine room
          else if (near && Lr * Dr > 250) for (let m = 0, nm = Math.min(3, Math.floor(Lr * Dr / 250)); m < nm; m++) { const a = (crH(m, nBld, 33) - 0.5) * Lr * 0.6, c = (crH(m, nBld, 34) - 0.5) * Dr * 0.6, x = mx + dx * a - dz * c, z = mz + dz * a + dx * c;
            if (inPoly(poly, x, z)) box(Wb, x, yTop, z, 2.0, 1.2, 1.5, rot, [0.78, 0.79, 0.8], [0.68, 0.69, 0.7], true); }   // air conditioners
        }
        nBld++;
      }
      ckAdd('w', fMat2, 'near');
    }

    /* ---- the grandstands (temporary, on scaffolding, by the pit straight, at Turn 2, by the beach and at the hairpin; a roof on the main one)
       packed with fans; spectators along the fences at the corners ---- */
    let nStands = 0;
    const CR = crowdCtx({ gH: ncGround, near: (x, z) => clearance(x, z), maxSlope: 0.6, chunk: 384 });
    CR.water = (x, z) => ncWater(x, z);
    {
      const gs = new GB(), gc = new RB(true), gr = new GB(), stC = [0.62, 0.63, 0.66], stD = [0.42, 0.43, 0.46], stT = [0.74, 0.75, 0.78], roofC = [0.94, 0.94, 0.95], roofU = [0.7, 0.71, 0.74];
      const own = (x, z, i) => { const nn = nearest(x, z), d2 = Math.abs(nn.i - i); return nn.i >= 0 && Math.min(d2, N - d2) < 25; };
      for (const [d0, d1, side, rows, roof] of def.stands || []) {
        let prev = null, pc = -1; const depth = rows * 0.9 + 1.5;
        for (let d = d0; d <= d1; d += 4) {
          const s = sAt(d), q0 = crAt(s), q = q0 && Object.assign({}, q0); if (!q) continue;
          const bar = side > 0 ? q.br : q.bl, front = bar + 1.6, P2 = (o, h) => [q.px + q.nx * side * o, h, q.pz + q.nz * side * o];
          const ok = [front, front + depth / 2, front + depth].every(o => { const [x, , z] = P2(o, 0); return !ncWater(x, z) && !inBld(x, z, 0.5) && own(x, z, q.i); });
          if (!ok) { prev = null; pc = -1; continue; }
          const y0 = Math.max(q.hy, ncGround(...[P2(front, 0)].map(p => [p[0], p[2]])[0])) + 0.1, top = y0 + 1.6 + depth * 0.52;
          const cs = [P2(front, y0 - 3), P2(front, y0 + 1.6), P2(front + 1.0, y0 + 1.6), P2(front + depth, top), P2(front + depth, y0 - 3)];
          if (prev) { const inn = P2(front + depth / 2, y0 + 1), a = prev.cs; for (let m = 0; m < 4; m++) gs.quadO(a[m], a[m + 1], cs[m + 1], cs[m], m === 2 ? stT : m === 1 ? stC : stD, inn); }
          const cp = [P2(front + 1.1, y0 + 1.67), P2(front + depth - 0.2, top + 0.02)], u = s / 12, cuv = [[u, 0.004], [u, 0.996 * Math.min(1, depth / 15)]];
          const rc = gc.row(side > 0 ? cp : cp.slice().reverse(), [[1, 1, 1], [1, 1, 1]], side > 0 ? cuv : cuv.slice().reverse()); if (pc >= 0) gc.link(pc, rc, 0, 1); pc = rc;
          const rp = roof ? [P2(front + depth + 0.3, top + 4.4), P2(front - 1.0, top + 3.4), P2(front - 1.0, top + 3.1), P2(front + depth + 0.3, top + 4.1)] : null;
          if (roof && prev && prev.rp) { const inn = P2(front + depth / 2, top + 3.7); gr.quadO(prev.rp[0], prev.rp[1], rp[1], rp[0], roofC, P2(front + depth / 2, top - 5)); gr.quadO(prev.rp[3], prev.rp[2], rp[2], rp[3], roofU, P2(front + depth / 2, top + 9)); gr.quadO(prev.rp[1], prev.rp[2], rp[2], rp[1], roofC, inn); }
          if (Math.round(d / 4) % 3 === 0) { for (const o of [front + 0.3, front + depth - 0.3]) { const [bx, , bz] = P2(o, 0), yb = ncGround(bx, bz); box(scen.get(bx, bz), bx, yb, bz, 0.12, (o > front + 1 ? top : y0 + 1.6) - yb, 0.12, T.hd[q.i], [0.7, 0.71, 0.74], null, true); }   // the scaffold's standards
            if (roof) { const [bx, , bz] = P2(front + depth - 0.4, 0); box(scen.get(bx, bz), bx, y0, bz, 0.4, top + 4.2 - y0, 0.4, T.hd[q.i], [0.86, 0.87, 0.9]); } }
          prev = { cs, rp };
          const [cx, , cz] = P2(front + depth / 2, 0); exclPush(cx, cz, depth / 2 + 3); CR.block(cx, cz, 5, depth + 2, Math.atan2(q.tz, q.tx));
        }
        nStands++;
      }
      addM(gs, matV, true, true, 'stands'); addM(gc, crowdUV(new THREE.MeshLambertMaterial({ map: tex.crowd, vertexColors: true }), 1, 0.06, 0.06), false, true, 'standfans'); addM(gr, matV, true, true, 'standroofs');
    }
    let nFans = 0;
    {
      const M = { first: 1.2, gap: 1.0, excluded: (x, z) => excluded(x, z) || inBld(x, z, 0.5) || ncWater(x, z), below: 3, above: 3, sit: 0.15, flag: 0.06 };
      const run = (d0, d1, side, o) => { nFans += crowdRun(CR, sStart + d0, sStart + d1, side, Object.assign({}, M, o)); };
      run(200, 290, 1, { rows: 3, dens: 0.6, label: 'NC T1' }); run(740, 800, -1, { rows: 2, dens: 0.55, label: 'NC T2 in' }); run(1180, 1240, -1, { rows: 2, dens: 0.5, label: 'NC T7' });
      run(1290, 1340, 1, { rows: 2, dens: 0.5, label: 'NC T8' }); run(2070, 2170, 1, { rows: 3, dens: 0.6, label: 'NC T11' }); run(2280, 2350, -1, { rows: 2, dens: 0.5, label: 'NC T13' });
      run(20, L - 140, -1, { rows: 1, dens: 0.05, clump: 0.9, strip: false, label: 'NC groups L' }); run(20, L - 140, 1, { rows: 1, dens: 0.04, clump: 0.9, strip: false, label: 'NC groups R' });
      for (const e of CR.circ) exclPush(e.x, e.z, e.r);
    }

    /* ---- the land's cover over the ground: the lawns of the parks and the reserves, the beaches' sand, the rock platforms and the headland's
       scrub, the sports fields, the garden beds, the car parks' asphalt with their bays, the plazas' pavers. Triangulated, cut into pieces of at
       most 14 m that lie on the ground ---- */
    {
      const fill = (gg, rings, off, col, uvS, mx) => {
        const outer = rings[0].map(([x, z]) => new THREE.Vector2(x, z)), holes = rings.slice(1).map(r => r.map(([x, z]) => new THREE.Vector2(x, z))), all = rings.flat(), tris = THREE.ShapeUtils.triangulateShape(outer, holes);
        const split = (a, b, c, d) => { const ab = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], bc = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2], ca = [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2]; put(a, ab, ca, d + 1); put(ab, b, bc, d + 1); put(ca, bc, c, d + 1); put(ab, bc, ca, d + 1); };
        const put = (a, b, c, d) => { const Lm = Math.max(Math.hypot(a[0] - b[0], a[1] - b[1]), Math.hypot(b[0] - c[0], b[1] - c[1]), Math.hypot(c[0] - a[0], c[1] - a[1]));
          if (Lm > mx && d < 9) { split(a, b, c, d); return; }
          const mx2 = (a[0] + b[0] + c[0]) / 3, mz2 = (a[1] + b[1] + c[1]) / 3; if (inCorr(mx2, mz2, 0.6) || inCorr(a[0], a[1], -0.5) || inCorr(b[0], b[1], -0.5) || inCorr(c[0], c[1], -0.5)) { if (Lm > 5 && d < 6) split(a, b, c, d); return; }   // (not over the circuit)
          const P3 = (q) => [q[0], ncGround(q[0], q[1]) + off, q[1]], U = (q) => [q[0] / uvS, -q[1] / uvS], A = P3(a), B = P3(b), C = P3(c), cc = (q) => col(q[0], q[1]);
          gg.triO(A, B, C, cc(a), [(A[0] + B[0] + C[0]) / 3, A[1] - 5, (A[2] + B[2] + C[2]) / 3], cc(b), cc(c), U(a), U(b), U(c)); };
        for (const [a, b, c] of tris) put(all[a], all[b], all[c], 0);
      };
      const gGrass = (x, z) => { const n = crH(Math.floor(x / 9), Math.floor(z / 9), 81); return [0.6 + n * 0.1, 0.68 + n * 0.06, 0.46 + n * 0.05]; };
      const lawnMat = new THREE.MeshLambertMaterial({ map: tex.grass, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
      const sandMat = new THREE.MeshLambertMaterial({ map: tex.sand, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
      const flatMat = new THREE.MeshLambertMaterial({ map: ncConcrete(), vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
      const pkMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
      for (const a of P.areas) {
        if (a.t === 0) continue; const cx = (a.bx0 + a.bx1) / 2, cz = (a.bz0 + a.bz1) / 2, dA = ncDist(cx, cz); if (dA > 900 || a.t === 10 || (dA > 150 && (a.bx1 - a.bx0) * (a.bz1 - a.bz0) < 400) || (dA > 450 && (a.bx1 - a.bx0) * (a.bz1 - a.bz0) < 2500)) continue;
        const t = a.t;
        if (t === 3) fill(ck('sand', cx, cz, () => new GB(true), 2048), a.rings, 0.03, () => [1, 0.97, 0.9], 8, 40);
        else if (t === 1 || t === 4 || t === 10 || t === 9) fill(ck('lawn', cx, cz, () => new GB(true), 2048), a.rings, 0.05, t === 4 ? () => [0.58, 0.74, 0.48] : t === 10 ? (x, z) => gGrass(x, z).map(v => v * 0.82) : t === 9 ? (x, z) => gGrass(x, z).map(v => v * 0.7) : gGrass, 14, 40);
        else if (t === 6) fill(ck('lawn', cx, cz, () => new GB(true), 2048), a.rings, 0.06, (x, z) => { const n = crH(Math.floor(x / 5), Math.floor(z / 5), 82); return [0.44 + n * 0.12, 0.5 + n * 0.08, 0.36 + n * 0.06]; }, 10, 30);
        else if (t === 5) fill(ck('flat', cx, cz, () => new GB(true), 2048), a.rings, 0.05, (x, z) => { const n = crH(Math.floor(x / 3), Math.floor(z / 3), 83); return [0.58 + n * 0.12, 0.55 + n * 0.1, 0.5 + n * 0.08]; }, 6, 24);
        else if (t === 8) fill(ck('flat', cx, cz, () => new GB(true), 2048), a.rings, 0.05, () => [0.92, 0.88, 0.8], 4.8, 30);
        else if (t === 7) fill(ck('pkA', cx, cz, () => new GB(true), 2048), a.rings, 0.05, () => [0.72, 0.72, 0.74], 8, 40);
        else if (t === 2) fill(ck('pool', cx, cz, () => new GB(), 2048), a.rings, 0.08, () => [0.36, 0.62, 0.72], 8, 40);
      }
      ckAdd('lawn', lawnMat); ckAdd('sand', sandMat); ckAdd('flat', flatMat); ckAdd('pkA', pkMat); ckAdd('pool', new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 60, specular: 0x445566, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    }

    /* ---- the streets: asphalt (older and lighter than the circuit's), a concrete kerb and gutter along both edges, the markings of New South
       Wales: the white centre line (broken, unbroken near the junctions), broken lane lines on the wide streets, the stop and give-way lines,
       the zebra crossings (white bars) where the map has a crossing, the signals' crossings (two broken lines). Not inside the circuit's walls ---- */
    const SWD = (cl) => cl === 0 ? 20 : cl === 1 ? 14 : cl === 2 ? 11 : cl === 3 ? 9 : cl === 4 ? 7 : cl === 5 ? 5 : 6;
    const ixNear = (x, z, r) => { let best = null, bd = r * r; for (const q of P.ix) { const d = (q.x - x) ** 2 + (q.z - z) ** 2; if (d < bd) { bd = d; best = q; } } return best; };
    const CRS = P.pt.filter(p => p.k === 1);
    {
      const sMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }), WL = [0.9, 0.9, 0.86], KC = [0.8, 0.79, 0.76];
      const SC = [[0.78, 0.78, 0.8], [0.76, 0.76, 0.78], [0.8, 0.79, 0.8], [0.84, 0.83, 0.83], [0.86, 0.84, 0.82], [0.88, 0.87, 0.85], [0.9, 0.86, 0.78]];
      for (const s of P.st) {
        const Wd = SWD(s.cl), hw = Wd / 2, yo = 0.05 + (6 - s.cl) * 0.006, dd = Math.min(...s.pts.map(([x, z]) => ncDist(x, z))), far = dd > 380;
        if (dd > (s.cl <= 1 ? 1300 : s.cl <= 3 ? 800 : 450)) continue;
        const pts = []; for (let k = 0; k + 1 < s.pts.length; k++) { const [ax, az] = s.pts[k], [bx, bz] = s.pts[k + 1], Lk = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(Lk / (far ? 28 : 10))); for (let q = 0; q < m; q++) pts.push([ax + (bx - ax) * q / m, az + (bz - az) * q / m]); }
        pts.push(s.pts[s.pts.length - 1]);
        let prev = -1, pd = null, acc = 0; const ga = ck('st', s.pts[0][0], s.pts[0][1], () => new RB(true), 2048);
        for (let k = 0; k < pts.length; k++) {
          const [x, z] = pts[k], a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)]; let tx = b[0] - a[0], tz = b[1] - a[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl; const nx = -tz, nz = tx;
          if (inCorr(x, z, 0.4) || ncWater(x, z)) { prev = -1; pd = null; continue; }
          if (k) acc += Math.hypot(x - pts[k - 1][0], z - pts[k - 1][1]);
          const Lp = [x - nx * hw, z - nz * hw], Rp = [x + nx * hw, z + nz * hw], yL = ncGround(Lp[0], Lp[1]) + yo, yR = ncGround(Rp[0], Rp[1]) + yo, c = SC[s.cl];
          const r = ga.row([[Lp[0], yL, Lp[1]], [Rp[0], yR, Rp[1]]], [c, c], [[Lp[0] / 8, -Lp[1] / 8], [Rp[0] / 8, -Rp[1] / 8]]);
          if (prev >= 0) ga.link(prev, r, 0, 1);
          if (pd && dd < 260 && s.cl <= 5 && pd.nx * nx + pd.nz * nz > 0.6) {   // the kerbs and the markings of this piece (none round a sharp bend: they would cross)
            const gm = ck('mk', x, z, () => new GB(), 1536), mid = ixNear(x, z, hw + 8);
            for (const sd of [-1, 1]) { const o = hw + 0.1, A = [pd.x + pd.nx * sd * o, 0, pd.z + pd.nz * sd * o], B = [x + nx * sd * o, 0, z + nz * sd * o]; A[1] = ncGround(A[0], A[2]) + yo + 0.11; B[1] = ncGround(B[0], B[2]) + yo + 0.11;
              const A2 = [A[0] + pd.nx * sd * 0.3, A[1], A[2] + pd.nz * sd * 0.3], B2 = [B[0] + nx * sd * 0.3, B[1], B[2] + nz * sd * 0.3]; gm.quadUp(A, B, B2, A2, [KC, KC, KC, KC]); }
            if (!mid && s.cl <= 4) {
              const ln = (o, wd, col, dash) => { if (dash && (Math.floor(acc / 3) % 4) > 0) return; const A0 = [pd.x + pd.nx * (o - wd), 0, pd.z + pd.nz * (o - wd)], A1 = [pd.x + pd.nx * (o + wd), 0, pd.z + pd.nz * (o + wd)], B0 = [x + nx * (o - wd), 0, z + nz * (o - wd)], B1 = [x + nx * (o + wd), 0, z + nz * (o + wd)];
                for (const p of [A0, A1, B0, B1]) p[1] = ncGround(p[0], p[2]) + yo + 0.012; gm.quadUp(A0, A1, B1, B0, [col, col, col, col]); };
              const nearJ = !!ixNear(x, z, hw + 26);
              if (s.cl <= 3) ln(0, 0.06, WL, !nearJ);   // the centre line: broken, unbroken up to the junctions
              if (s.cl <= 1) { ln(-hw / 2, 0.055, WL, true); ln(hw / 2, 0.055, WL, true); }
            }
          }
          prev = r; pd = { x, z, nx, nz };
        }
      }
      // the junctions' asphalt (a disc over the streets' ends), their stop / give-way lines and the signals' crossings
      for (const q of P.ix) {
        if (inCorr(q.x, q.z, 0) || ncWater(q.x, q.z) || ncDist(q.x, q.z) > 700) continue;
        const gm = ck('mk', q.x, q.z, () => new GB(), 1536), hwm = Math.max(...q.legs.map(l => SWD(l.cl) / 2)), y = ncGround(q.x, q.z) + 0.075, c = SC[2], nseg = 12, C0 = [q.x, y, q.z];
        { const gd = ck('jd', q.x, q.z, () => new GB(true), 2048), rr = hwm + 0.5, V = (a) => { const x = q.x + Math.cos(a) * rr, z = q.z + Math.sin(a) * rr; return [x, Math.max(y - 0.02, ncGround(x, z) + 0.072), z]; }, U = (p) => [p[0] / 8, -p[2] / 8];   // (asphalt, on the ground)
          for (let m = 0; m < nseg; m++) { const A = V((m + 1) / nseg * TAU), B = V(m / nseg * TAU); gd.triO(C0, A, B, c, [q.x, y - 5, q.z], c, c, U(C0), U(A), U(B)); } }
        if (!q.sig && !q.give && !q.cw) continue;
        for (const l of q.legs) {
          if (l.cl > 4) continue;
          const Wd = SWD(l.cl), ux = Math.cos(l.a), uz = Math.sin(l.a), nx = -uz, nz = ux, others = Math.max(...q.legs.filter(o => o !== l).map(o => SWD(o.cl) / 2)), r0 = others + 1.2;
          const bar = (r, o0, o1, wd, dash) => { for (let o = o0; o < o1 - 0.01; o += dash ? 1.2 : o1 - o0) { const oe = Math.min(o1, o + (dash ? 0.6 : o1 - o0)), A = [q.x + ux * r + nx * o, 0, q.z + uz * r + nz * o], B = [q.x + ux * r + nx * oe, 0, q.z + uz * r + nz * oe], A2 = [A[0] + ux * wd, 0, A[2] + uz * wd], B2 = [B[0] + ux * wd, 0, B[2] + uz * wd];
            if (inCorr(A[0], A[2], -0.5) || inCorr(B[0], B[2], -0.5)) continue; for (const p of [A, B, A2, B2]) p[1] = ncGround(p[0], p[2]) + 0.088; gm.quadUp(A, B, B2, A2, [WL, WL, WL, WL]); } };
          if (q.sig) { bar(r0, -Wd / 2 + 0.3, Wd / 2 - 0.3, 0.15, true); bar(r0 + 3.2, -Wd / 2 + 0.3, Wd / 2 - 0.3, 0.15, true); bar(r0 + 4.4, 0, Wd / 2 - 0.2, 0.4, false); }   // the crossing's two broken lines, the stop line (the left half: traffic keeps left)
          else if (q.give && l.cl >= 2) bar(r0 + 0.5, 0, Wd / 2 - 0.2, 0.3, true);
        }
      }
      // the zebra crossings: white bars across the street where the map has a crossing (not at the signals)
      for (const p of CRS) {
        if (ncDist(p.x, p.z) > 450 || inCorr(p.x, p.z, -0.5)) continue; const j = ixNear(p.x, p.z, 14); if (j && j.sig) continue;
        const ux = Math.cos(p.a), uz = Math.sin(p.a), nx = -uz, nz = ux, gm = ck('mk', p.x, p.z, () => new GB(), 1536), hw2 = 4.6;
        for (let o = -hw2; o < hw2; o += 1.1) { const A = [p.x + nx * o - ux * 1.5, 0, p.z + nz * o - uz * 1.5], B = [A[0] + ux * 3, 0, A[2] + uz * 3], A2 = [A[0] + nx * 0.55, 0, A[2] + nz * 0.55], B2 = [B[0] + nx * 0.55, 0, B[2] + nz * 0.55];
          if (inCorr(A[0], A[2], -0.5)) continue; for (const q2 of [A, B, A2, B2]) q2[1] = ncGround(q2[0], q2[2]) + 0.09; gm.quadUp(A, A2, B2, B, [WL, WL, WL, WL]); }
      }
      // the crossings and the stop lines left on the circuit where a street crosses it (the city's paint, worn by the racing)
      for (const [a, b, sd, m] of def.wide || []) {
        if (m !== 4.5) continue; const s0 = sAt((a + b) / 2), WF = [0.66, 0.66, 0.64], c0 = atS(s0, 0), gm = ck('mk', c0[0], c0[1], () => new GB(), 1536);
        for (const sh of [-(b - a) / 2 - 1, (b - a) / 2 - 2]) for (let o = -w + 0.6; o < w - 0.3; o += 1.2) { const p0 = atSf(s0 + sh, o), p1 = atSf(s0 + sh + 0.15, o), p2 = atSf(s0 + sh + 0.15, o + 0.6), p3 = atSf(s0 + sh, o + 0.6), Y = (p) => [p[0], T.hy[p[3]] + 0.036, p[1]];
          gm.quadUp(Y(p0), Y(p3), Y(p2), Y(p1), [WF, WF, WF, WF]); }
      }
      ckAdd('st', sMat); ckAdd('jd', sMat); ckAdd('mk', lMat);
    }
    /* ---- the light rail's tracks: two rails set in the street along Scott Street and across the circuit at Watt Street (the cars run over them) ---- */
    {
      const g = new GB(), rc = [0.42, 0.42, 0.44], rs = [0.66, 0.67, 0.7];
      for (const pl of P.tram) for (let k = 0; k + 1 < pl.length; k++) {
        const [ax, az] = pl[k], [bx, bz] = pl[k + 1], Lk = Math.hypot(bx - ax, bz - az); if (Lk < 0.1 || ncDist(ax, az) > 500) continue; const tx = (bx - ax) / Lk, tz = (bz - az) / Lk, nx = -tz, nz = tx;
        for (let t = 0; t < Lk; t += 4) { const t1 = Math.min(Lk, t + 4), xa = ax + tx * t, za = az + tz * t, xb = ax + tx * t1, zb = az + tz * t1;
          for (const o of [-0.72, 0.72]) for (const [w2, cc] of [[0.18, rc], [0.07, rs]]) { const Y = (x, z) => { const n = nearest(x, z); return (n.i >= 0 && Math.abs(n.lat) < T.w + 0.3 ? T.hy[n.i] + 0.045 : ncGround(x, z) + 0.09); };
            const A = [xa + nx * (o - w2), 0, za + nz * (o - w2)], B = [xa + nx * (o + w2), 0, za + nz * (o + w2)], C = [xb + nx * (o + w2), 0, zb + nz * (o + w2)], D = [xb + nx * (o - w2), 0, zb + nz * (o - w2)];
            for (const p of [A, B, C, D]) p[1] = Y(p[0], p[2]) + (cc === rs ? 0.004 : 0); g.quadUp(A, B, C, D, [cc, cc, cc, cc]); } } }
      addM(g, matV, false, true, 'rails');
    }

    /* ---- the junctions' furniture: the traffic signals on their posts at the corners (a mast arm over the wide streets), the signals' control
       cabinet, street lamps, signs, litter bins and bollards; the city's own from the map (lamps, bins, bus stops, bollards, cabinets, signs).
       Inside the circuit's walls (on the footpath, the junctions' pockets) they can be knocked over (Core's street furniture), outside them they
       stand (the same shapes, plainer) ---- */
    const SH0 = { signal: 2.3, signalm: 3.2, lamp: 4.5, sign: 1.3, bin: 0.5, cabinet: 0.7, bollard: 0.5, shelter: 1.25, barrel: 0.47 };
    const STILL = {
      signal: (g, x, y, z, c, s) => { cyl(g, x, y, z, 0.11, 3.9, 5, [0.58, 0.6, 0.62]); for (const f of [-1, 1]) box(g, x - s * f * 0.2, y + 2.9, z + c * f * 0.2, 0.36, 1.0, 0.36, Math.atan2(s, c), [0.08, 0.08, 0.09], null, true); },
      signalm: (g, x, y, z, c, s) => { cyl(g, x, y, z, 0.16, 6.3, 5, [0.58, 0.6, 0.62]); box(g, x + c * 3.5, y + 5.75, z + s * 3.5, 7, 0.16, 0.16, Math.atan2(s, c), [0.58, 0.6, 0.62], null, true); for (const a of [4.2, 6.6]) box(g, x + c * a, y + 4.55, z + s * a, 0.36, 1.0, 0.36, Math.atan2(s, c), [0.08, 0.08, 0.09], null, true); },
      lamp: (g, x, y, z, c, s) => { cyl(g, x, y, z, 0.13, 8.9, 5, [0.58, 0.6, 0.62]); box(g, x + c * 1.2, y + 8.6, z + s * 1.2, 2.4, 0.12, 0.12, Math.atan2(s, c), [0.58, 0.6, 0.62], null, true); box(g, x + c * 2.1, y + 8.45, z + s * 2.1, 0.75, 0.2, 0.34, Math.atan2(s, c), [0.72, 0.73, 0.75], null, true); },
      sign: (g, x, y, z, c, s) => { box(g, x, y, z, 0.06, 2.6, 0.06, 0, [0.58, 0.6, 0.62], null, true); box(g, x, y + 1.55, z, 0.6, 0.75, 0.04, Math.atan2(s, c), [0.95, 0.95, 0.93], null, true); },
      bin: (g, x, y, z) => { box(g, x, y, z, 0.6, 1.0, 0.6, 0, [0.2, 0.3, 0.22], [0.6, 0.12, 0.1], true); },
      cabinet: (g, x, y, z, c, s) => { box(g, x, y, z, 1.0, 1.4, 0.6, Math.atan2(s, c), [0.62, 0.66, 0.62], [0.7, 0.72, 0.68], true); },
      bollard: (g, x, y, z) => { cyl(g, x, y, z, 0.11, 1.0, 5, [0.14, 0.14, 0.15], [0.9, 0.88, 0.8]); },
      shelter: (g, x, y, z, c, s) => { const r = Math.atan2(s, c); box(g, x, y + 2.37, z, 1.75, 0.13, 3.75, r, [0.24, 0.25, 0.27], [0.32, 0.33, 0.36], true); box(g, x - c * 0.72, y, z - s * 0.72, 0.04, 2.3, 3.4, r, [0.62, 0.72, 0.78], null, true); },
    };
    const furnC = new Chunks(2048); let nProps = 0, nStill = 0;
    const PK = [new Float32Array(N), new Float32Array(N)];   // the pockets in the walls (def.wide): where a street comes in
    for (const [a, b, sd, m] of def.wide || []) if (m === 4.5) for (let d = a - 4; d <= b + 4; d += ds) PK[sd > 0 ? 1 : 0][T.idx(sAt(d))] = 1;
    const furn = (kind, x, z, yaw, col) => {   // one piece: knockable inside the walls (on the footpath, clear of the road and the walls), standing outside them
      if (ncWater(x, z) || inBld(x, z, 0.3) || excluded(x, z)) return false;
      const n = nearest(x, z);
      if (n.i >= 0 && Math.abs(n.lat) < n.bar + 0.9) {
        if (Math.abs(n.lat) < w + 0.55 || Math.abs(n.lat) > n.bar - 0.35 || T.pitAt(n.i * ds)) return false;
        { let d = n.i * ds - sStart; d = ((d % L) + L) % L; if (d > L - 120 || d < 15) return false; }   // (not along the grid)
        out.props.push({ kind, x, z, yaw, col: col || 0, i: n.i }); nProps++; return true; }
      if (ncDist(x, z) > 420 || !STILL[kind]) return false;
      STILL[kind](furnC.get(x, z), x, ncGround(x, z), z, Math.cos(yaw), Math.sin(yaw)); nStill++; return true;
    };
    {
      for (const q of P.ix) {
        if (ncDist(q.x, q.z) > 600 || q.legs.length < 3) continue;
        const Lg = q.legs.filter(l => l.cl <= 4).sort((a, b) => a.a - b.a), n = Lg.length; if (n < 2) continue;
        const atC = q.legs.length >= 3 && ncDist(q.x, q.z) < 20;   // (a junction on the circuit: every corner gets its kit)
        for (let m = 0; m < n; m++) {
          const A = Lg[m], B = Lg[(m + 1) % n]; let th = B.a - A.a; if (th <= 0) th += TAU; if (th < 0.6 || th > 2.8) continue;
          const d1 = SWD(A.cl) / 2 + 1.3, d2 = SWD(B.cl) / 2 + 1.3, sn = Math.sin(th), ux = Math.cos(A.a), uz = Math.sin(A.a), vx = Math.cos(B.a), vz = Math.sin(B.a);
          const x = q.x + ux * d2 / sn + vx * d1 / sn, z = q.z + uz * d2 / sn + vz * d1 / sn, hh = crH(Math.round(x * 3), Math.round(z * 3), 41);
          let ax = -uz, az = ux; if (ax * (x - q.x) + az * (z - q.z) > 0) { ax = -ax; az = -az; }   // (the arm over the street of leg A)
          if (q.sig) {
            if (A.cl <= 1 && m % 2 === 0) furn('signalm', x, z, Math.atan2(az, ax)); else furn('signal', x - ux * 0.8, z - uz * 0.8, Math.atan2(az, ax));
            furn('signal', x - vx * 0.8 + ux * 0.4, z - vz * 0.8 + uz * 0.4, Math.atan2(-uz, -ux));   // (a second post on the corner: the crossing's push buttons and lanterns)
            if (m === 0) furn('cabinet', x + ux * 3.0, z + uz * 3.0, A.a);
            furn('bollard', x + ux * 1.6 + vx * 1.6, z + uz * 1.6 + vz * 1.6, 0);
          } else if (q.give || atC) furn('sign', x + ux * 1.4, z + uz * 1.4, A.a + Math.PI / 2);
          if (hh < 0.45 || atC) furn('lamp', x + vx * 2.2, z + vz * 2.2, Math.atan2(az, ax));
          if (hh > 0.55 || atC) furn('bin', x + vx * 3.6 + ux * 0.2, z + vz * 3.6 + uz * 0.2, A.a);
          if (hh > 0.7 || atC) furn('sign', x + ux * 4.2, z + uz * 4.2, A.a + Math.PI / 2);
          if (atC) for (let k = 1; k <= 3; k++) furn('bollard', x + ux * (1.6 + k * 1.5), z + uz * (1.6 + k * 1.5), 0);
        }
      }
      // the city's own street furniture (OpenStreetMap)
      for (const p of P.pt) {
        if (ncDist(p.x, p.z) > 600) continue;
        const k = p.k;
        if (k === 2) furn('lamp', p.x, p.z, p.a + Math.PI / 2);
        else if (k === 4) furn('bin', p.x, p.z, p.a);
        else if (k === 5) furn('shelter', p.x, p.z, p.a + Math.PI / 2);
        else if (k === 6) furn('bollard', p.x, p.z, 0);
        else if (k === 7) furn('cabinet', p.x, p.z, p.a);
        else if (k === 8 || k === 9) furn('sign', p.x, p.z, p.a + Math.PI / 2);
        else if (k === 0) furn('signal', p.x, p.z, p.a + Math.PI / 2);
      }
      // the street lamps along the main streets every ~35 m on both sides
      for (const s of P.st) {
        if (s.cl > 3) continue; const hw = SWD(s.cl) / 2 + 0.8; let acc = 12 + crH(s.pts[0][0] | 0, s.pts[0][1] | 0, 43) * 20;
        for (let k = 0; k + 1 < s.pts.length; k++) { const [ax0, az0] = s.pts[k], [bx, bz] = s.pts[k + 1], Lk = Math.hypot(bx - ax0, bz - az0), tx = (bx - ax0) / Lk, tz = (bz - az0) / Lk;
          for (let t = acc; t < Lk; t += 36) { const x0 = ax0 + tx * t, z0 = az0 + tz * t; if (ncDist(x0, z0) > 220 || ixNear(x0, z0, 16)) continue;
            for (const sd of [-1, 1]) { const x = x0 - tz * sd * hw, z = z0 + tx * sd * hw; furn('lamp', x, z, Math.atan2(tx * sd, -tz * sd)); } }
          acc = ((acc - Lk) % 36 + 36) % 36; }
      }
      // along the circuit itself: the lamps and the signs the streets keep through race week (on the footpath, in reach)
      for (const side of [-1, 1]) for (let d = 30; d < L - 130; d += 42) { const q = crAt(sAt(d)); if (!q) continue; const bar = side > 0 ? q.br : q.bl, o = w + 1.1 + crH(d | 0, side, 44) * Math.max(0, bar - w - 2.2); if (bar - w < 2) continue;
        const x = q.px + q.nx * side * o, z = q.pz + q.nz * side * o, h = crH(d | 0, side, 45); furn(h < 0.55 ? 'lamp' : h < 0.8 ? 'sign' : 'bin', x, z, Math.atan2(-q.nz * side, -q.nx * side)); }
      { const n0 = root.children.length; furnC.addTo(root, matV, false, true); for (let k = n0; k < root.children.length; k++) root.children[k].name = 'furn'; }
    }

    /* ---- the trees: Norfolk Island pines along the beaches, the foreshore and on the headland, Moreton Bay figs and palms in the parks, street
       trees (brush box, planes) along the streets, coastal banksias on the headland and the slopes above the beaches; the map's own trees ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const TK = [0, 1, 2, 3, 4, 5].map(k => new IChunks(ncTreeGeo(k), tMat, 768)), TKf = [0, 1, 2, 3, 4, 5].map(k => new IChunks(ncTreeGeo(k, true), tMat, 1536));
    let nTrees = 0;
    const treeOk = (x, z, r) => !(ncWater(x, z) || inBld(x, z, r) || excluded(x, z) || inCorr(x, z, 3) || x < P.x0 || x > P.x1 || z < P.z0 || z > P.z1 || ncArea(x, z, 7) || ncArea(x, z, 4));
    const plant = (sp, x, z, sz) => { const y = ncGround(x, z), hh = crH(Math.round(x * 5), Math.round(z * 5), 51), s = sz * (0.82 + hh * 0.36), k = 0.86 + crH(Math.round(x), Math.round(z), 52) * 0.26;
      const dd = ncDist(x, z); if (dd > 380 && crH(Math.round(x), Math.round(z), 53) < 0.4) return; (dd < 80 ? TK : TKf)[sp].add(x, y - 0.1, z, hh * TAU, s, s, [k, k, k]); nTrees++; };
    {
      const beachy = (x, z) => ncArea(x, z, 3) || ncArea(x + 30, z, 3) || ncArea(x - 30, z, 3) || ncArea(x, z + 30, 3) || ncArea(x, z - 30, 3) || ncArea(x, z, 0);
      for (const [x, z] of P.tree) { if (!treeOk(x, z, 0.5)) continue; const h = crH(x | 0, z | 0, 56), coast = beachy(x, z);
        plant(coast ? (h < 0.6 ? 0 : h < 0.85 ? 2 : 5) : ncArea(x, z, 1) ? (h < 0.35 ? 1 : h < 0.55 ? 0 : h < 0.75 ? 2 : 4) : (h < 0.8 ? 4 : 3), x, z, 1); }
      for (const a of P.areas) {   // the parks: a few big trees; the scrub: banksias
        if (a.t !== 1 && a.t !== 6 && a.t !== 9) continue; if (ncDist((a.bx0 + a.bx1) / 2, (a.bz0 + a.bz1) / 2) > 900) continue;
        const sp0 = a.t === 1 ? 26 : a.t === 9 ? 9 : 12;
        for (let x = a.bx0 + sp0 / 2; x < a.bx1; x += sp0) for (let z = a.bz0 + sp0 / 2; z < a.bz1; z += sp0) { const jx = x + (crH(x | 0, z | 0, 57) - 0.5) * sp0 * 0.8, jz = z + (crH(x | 0, z | 0, 58) - 0.5) * sp0 * 0.8, hh = crH(x | 0, z | 0, 59);
          if (hh > (a.t === 1 ? 0.35 : 0.7) || !ncInArea(a, jx, jz) || !treeOk(jx, jz, 1.5)) continue;
          plant(a.t === 1 ? (hh < 0.12 ? 1 : hh < 0.26 ? 0 : 2) : a.t === 9 ? (hh < 0.4 ? 4 : 5) : 5, jx, jz, a.t === 6 ? 0.9 : 1); }
      }
      for (const a of P.areas) {   // the beaches' edges: a row of Norfolk Island pines along the top of the sand
        if (a.t !== 3) continue; const ring = a.rings[0];
        for (let e = 0; e < ring.length; e++) { const [ax, az] = ring[e], [bx, bz] = ring[(e + 1) % ring.length], Le = Math.hypot(bx - ax, bz - az);
          for (let t = 6; t < Le; t += 24) { const x = ax + (bx - ax) * t / Le, z = az + (bz - az) * t / Le; for (const o of [6, -6]) { const nx = -(bz - az) / Le * o, nz = (bx - ax) / Le * o, x2 = x + nx, z2 = z + nz;
            if (!ncArea(x2, z2, 3) && !ncWater(x2, z2) && treeOk(x2, z2, 1.5) && crH(x2 | 0, z2 | 0, 60) < 0.5) { plant(0, x2, z2, 1); break; } } } }
      }
    }
    TK.forEach((t, k) => t.addTo(root, k !== 5)); for (const t of TKf) t.addTo(root, false);

    /* ---- parked cars: along the kerbs of the side streets, in rows in the car parks ---- */
    let nCars = 0;
    {
      const cg = new GB(); box(cg, 0, 0.25, 0, 4.5, 0.72, 1.85, 0, [1, 1, 1], null, true); box(cg, -0.25, 0.97, 0, 2.3, 0.58, 1.6, 0, [0.14, 0.17, 0.2], [1, 1, 1], true);
      const cg2 = new GB(); box(cg2, 0, 0.25, 0, 4.5, 1.2, 1.85, 0, [0.85, 0.85, 0.85], [1, 1, 1], true);
      const cMat2 = new THREE.MeshLambertMaterial({ vertexColors: true }), carI = new IChunks(cg.geometry(), cMat2, 768), carF = new IChunks(cg2.geometry(), cMat2, 1536);
      const CC = [[0.95, 0.95, 0.94], [0.12, 0.12, 0.13], [0.7, 0.71, 0.73], [0.45, 0.46, 0.48], [0.6, 0.12, 0.1], [0.16, 0.26, 0.52], [0.82, 0.8, 0.74], [0.3, 0.38, 0.3], [0.9, 0.9, 0.88]];
      const car = (x, z, rot) => { if (ncWater(x, z) || inBld(x, z, 0.6) || excluded(x, z) || inCorr(x, z, 2)) return; (ncDist(x, z) < 80 ? carI : carF).add(x, ncGround(x, z), z, -rot, 1, 1, CC[Math.floor(crH(Math.round(x * 4), Math.round(z * 4), 61) * CC.length)]); nCars++; };
      for (const a of P.areas) { if (a.t !== 7) continue; const poly = a.rings[0]; if (ncDist((a.bx0 + a.bx1) / 2, (a.bz0 + a.bz1) / 2) > 220) continue;
        let cx = 0, cz = 0; for (const [x, z] of poly) { cx += x / poly.length; cz += z / poly.length; } if (ncDist(cx, cz) > 300) continue;
        let bl = 0, dx = 1, dz = 0; for (let e = 0; e < poly.length; e++) { const [ax, az] = poly[e], [bx, bz] = poly[(e + 1) % poly.length], l = Math.hypot(bx - ax, bz - az); if (l > bl) { bl = l; dx = (bx - ax) / l; dz = (bz - az) / l; } }
        let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const [x, z] of poly) { const aa = (x - cx) * dx + (z - cz) * dz, c = -(x - cx) * dz + (z - cz) * dx; u0 = Math.min(u0, aa); u1 = Math.max(u1, aa); v0 = Math.min(v0, c); v1 = Math.max(v1, c); }
        for (let v = v0 + 3; v < v1 - 2; v += 6.5) { if (Math.floor((v - v0) / 6.5) % 3 === 2) continue;
          for (let aa = u0 + 1.5; aa < u1 - 1.5; aa += 2.7) { const x = cx + dx * aa - dz * v, z = cz + dz * aa + dx * v; if (!inPoly(poly, x, z)) continue;
            { const g2 = ck('mk', x, z, () => new GB(), 1536), lx = x + dx * 1.35, lz = z + dz * 1.35, y = ncGround(lx, lz) + 0.09, WL = [0.9, 0.9, 0.86], Q = (p, q) => [lx + dx * p - dz * q, y, lz + dz * p + dx * q];
              if (!inCorr(lx, lz, 0.5)) g2.quadUp(Q(-0.06, -2.6), Q(0.06, -2.6), Q(0.06, 2.6), Q(-0.06, 2.6), [WL, WL, WL, WL]); }
            if (crH(Math.round(aa * 3), Math.round(v * 3) + poly.length, 62) > 0.45) continue; car(x, z, Math.atan2(dz, dx) + Math.PI / 2 + (crH(aa | 0, v | 0, 63) < 0.5 ? 0 : Math.PI)); } } }
      for (const s of P.st) { if (s.cl < 2 || s.cl > 4) continue; const hw = SWD(s.cl) / 2 - 1.2;
        for (let k = 0; k + 1 < s.pts.length; k++) { const [ax0, az0] = s.pts[k], [bx, bz] = s.pts[k + 1], Lk = Math.hypot(bx - ax0, bz - az0), tx = (bx - ax0) / Lk, tz = (bz - az0) / Lk;
          for (let t = 4; t < Lk - 4; t += 6.2) { const x0 = ax0 + tx * t, z0 = az0 + tz * t; if (ncDist(x0, z0) > 220 || ncDist(x0, z0) < 14 || ixNear(x0, z0, 16)) continue;
            for (const sd of [-1, 1]) { if (crH(Math.round(x0 * 3), Math.round(z0 * 3) + sd, 64) > 0.55) continue; car(x0 - tz * sd * hw, z0 + tx * sd * hw, Math.atan2(tz, tx)); } } } }
      carI.addTo(root, true); carF.addTo(root, false);
    }


    /* ---- the headland: the lighthouse on top of Nobbys (a white tower and its lantern, the keepers' cottages), the breakwater out to it and
       past it (big rough blocks of sandstone), the old fort on its hill (the flag, the gun pits) ---- */
    const LM = def.nc.lm || {};
    {
      const g = new GB(), stone = [0.62, 0.56, 0.46], stoneD = [0.48, 0.44, 0.38], wh = [0.96, 0.96, 0.94];
      if (LM.pier) { const pl = LM.pier;   // the breakwater: a rubble mound 9 m wide, its crown 3 m over the sea, a paved walk on it
        for (let k = 0; k + 1 < pl.length; k++) { const [ax, az] = pl[k], [bx, bz] = pl[k + 1], Lk = Math.hypot(bx - ax, bz - az), tx = (bx - ax) / Lk, tz = (bz - az) / Lk, nx = -tz, nz = tx;
          for (let t = 0; t < Lk; t += 6) { const t1 = Math.min(Lk, t + 6), x0 = ax + tx * t, z0 = az + tz * t, x1 = ax + tx * t1, z1 = az + tz * t1, y0 = Math.max(3, ncGround(x0, z0)), y1 = Math.max(3, ncGround(x1, z1));
            if (!ncWater(x0, z0) && !ncWater(x1, z1)) continue;
            const prof = [[-9, -3], [-4.5, y0 - 0.2], [4.5, y0 - 0.2], [9, -3]], cols = [stoneD, stone, stone, stoneD];
            for (let q = 0; q < 3; q++) { const [oa, ha] = prof[q], [ob, hb] = prof[q + 1], A = [x0 + nx * oa, ha, z0 + nz * oa], B = [x0 + nx * ob, hb, z0 + nz * ob], C = [x1 + nx * ob, q === 1 ? y1 - 0.2 : hb, z1 + nz * ob], D = [x1 + nx * oa, q === 1 ? y1 - 0.2 : ha, z1 + nz * oa];
              g.quadO(A, B, C, D, cols[q], [(x0 + x1) / 2, -6, (z0 + z1) / 2]); }
            if (crH(Math.round(x0), Math.round(z0), 91) < 0.7) for (const sd of [-1, 1]) { const rx = x0 + nx * sd * (6 + crH(t | 0, sd, 92) * 2), rz = z0 + nz * sd * (6 + crH(t | 0, sd, 92) * 2); rock(g, rx, 0.2, rz, 1.6, 1.1, 1.3, t, [0.5, 0.47, 0.42], R, 0.3); }
          } } }
      if (LM.lh) { const [x, z] = LM.lh, y = ncGround(x, z);   // the lighthouse (11 m) and its cottages
        cyl(g, x, y - 0.5, z, 2.2, 10.5, 12, wh, null, 1.9); cyl(g, x, y + 10, z, 2.3, 0.4, 12, [0.2, 0.2, 0.22], [0.25, 0.25, 0.27]); cyl(g, x, y + 10.4, z, 1.5, 1.8, 10, [0.85, 0.9, 0.95], null); cone(g, x, y + 12.2, z, 1.75, 1.2, 10, [0.2, 0.2, 0.22], [0.28, 0.28, 0.3], 0);
        for (const [dx, dz, r] of [[-14, -6, 0.3], [-12, 10, -0.2], [-24, 2, 0.1]]) { const cx = x + dx, cz = z + dz, cy = ncGround(cx, cz); box(g, cx, cy - 0.3, cz, 10, 3.4, 6.5, r, [0.95, 0.93, 0.88], null, true); gable(g, cx, cy + 3.1, cz, 10.4, 6.9, 1.8, r, [0.74, 0.22, 0.17], [0.95, 0.93, 0.88]); }
        exclPush(x, z, 30); }
      if (LM.fort) { const [x, z] = LM.fort, y = ncGround(x, z);   // the fort: the flag on its mast, two gun pits with their barrels, the parapet
        cyl(g, x, y, z, 0.12, 16, 6, [0.95, 0.95, 0.95]);
        for (const [dx, dz, a] of [[18, 8, -0.4], [6, 24, 0.5]]) { const cx = x + dx, cz = z + dz, cy = ncGround(cx, cz); cyl(g, cx, cy - 0.5, cz, 5.2, 1.6, 14, [0.64, 0.6, 0.5], [0.58, 0.55, 0.48], 4.4); cyl(g, cx, cy + 0.6, cz, 1.2, 1.1, 8, [0.3, 0.32, 0.3]); box(g, cx + Math.cos(a) * 3, cy + 1.4, cz + Math.sin(a) * 3, 5.5, 0.45, 0.45, a, [0.24, 0.26, 0.24], null, true); }
        exclPush(x, z, 12); }
      addM(g, matV, true, true, 'landmarks');
    }

    /* ---- Stockton across the harbour: its houses and blocks (simple shapes: they are seen over the water); the ships waiting offshore to come
       into the port (bulk carriers at anchor, their bows into the sea breeze), a tug in the harbour ---- */
    {
      const g = new GB(), FB = ncI16(def.nc.fb), RF = [[0.62, 0.27, 0.2], [0.42, 0.43, 0.45], [0.72, 0.4, 0.3], [0.56, 0.58, 0.6]], WF = [[0.92, 0.9, 0.86], [0.86, 0.84, 0.8], [0.95, 0.94, 0.9], [0.8, 0.76, 0.7]];
      for (let k = 0; k < FB.length; k += 6) { const x = FB[k] / 2, z = FB[k + 1] / 2, Lb = FB[k + 2] / 4, Db = FB[k + 3] / 4, a = FB[k + 4] * Math.PI / 180, h = FB[k + 5] / 4, y = ncGround(x, z), hh = crH(Math.round(x), Math.round(z), 95);
        if (Lb * Db < 90 || (Lb * Db < 150 && hh < 0.4) || ncDist(x, z) > 1500) continue;
        box(g, x, y - 0.3, z, Lb, h + 0.3, Db, a, WF[Math.floor(hh * 4)], h < 6 && Lb * Db < 400 ? RF[Math.floor(crH(Math.round(x), Math.round(z), 96) * 4)] : null, true); }
      addM(g, new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true }), false, true, 'stockton');   // (transparent: no ambient occlusion strips at their feet, the haze hides them)
      const sg = new GB(), HB = [0.2, 0.22, 0.26], HR = [0.55, 0.14, 0.12], DK = [0.42, 0.4, 0.36], WH = [0.94, 0.94, 0.92];
      const ship = (x, z, hd, Ls, Bs) => {   // a bulk carrier: the hull (dark, red below the waterline's band), the hatch covers along the deck, the white accommodation at the stern, its funnel, four cranes
        const c = Math.cos(hd), s = Math.sin(hd), P = (a, b, y) => [x + c * a - s * b, y, z + s * a + c * b], inn = P(0, 0, 5);
        const hull = [[-Ls / 2, -Bs / 2], [Ls / 2 - 18, -Bs / 2], [Ls / 2, 0], [Ls / 2 - 18, Bs / 2], [-Ls / 2, Bs / 2]];
        for (let e = 0; e < hull.length; e++) { const [a0, b0] = hull[e], [a1, b1] = hull[(e + 1) % hull.length]; sg.quadO(P(a0, b0, -1), P(a1, b1, -1), P(a1, b1, 2.2), P(a0, b0, 2.2), HR, inn); sg.quadO(P(a0, b0, 2.2), P(a1, b1, 2.2), P(a1, b1, 14), P(a0, b0, 14), HB, inn); }
        const pts = hull.map(([a, b]) => new THREE.Vector2(a, b)); for (const [i0, i1, i2] of THREE.ShapeUtils.triangulateShape(pts, [])) sg.triO(P(hull[i0][0], hull[i0][1], 14), P(hull[i1][0], hull[i1][1], 14), P(hull[i2][0], hull[i2][1], 14), DK, inn);
        for (let h = 0; h < 7; h++) { const a = -Ls / 2 + 34 + h * (Ls - 60) / 7, [hx, , hz] = P(a, 0, 0); box(sg, hx, 14, hz, 14, 1.6, Bs * 0.7, hd, [0.5, 0.22, 0.16], [0.58, 0.26, 0.18], true);
          if (h % 2 === 1) { const [cx, , cz] = P(a + 8, 0, 0); cyl(sg, cx, 14, cz, 0.7, 16, 6, [0.86, 0.72, 0.18]); box(sg, cx + c * 8, 28, cz + s * 8, 16, 0.8, 0.8, hd, [0.86, 0.72, 0.18], null, true); } }
        { const [ax, , az] = P(-Ls / 2 + 12, 0, 0); box(sg, ax, 14, az, 16, 14, Bs * 0.8, hd, WH, [0.82, 0.82, 0.8], true); box(sg, ax, 28, az, 9, 2.5, Bs * 0.9, hd, WH, [0.7, 0.7, 0.7], true); }
        { const [fx, , fz] = P(-Ls / 2 + 5, 0, 0); box(sg, fx, 28, fz, 5, 8, 4, hd, [0.14, 0.14, 0.16], [0.1, 0.1, 0.1], true); }
      };
      for (const [x, z, hd, Ls] of [[3300, -900, 2.4, 225], [4400, 700, 2.6, 190], [2700, 2100, 2.3, 230], [5700, -2300, 2.5, 200], [6400, 1700, 2.45, 180], [8200, -300, 2.55, 225]]) ship(x, z, hd, Ls, Ls * 0.16);
      { const x = -260, z = -420, hd = 0.3, c = Math.cos(hd), s = Math.sin(hd);   // a tug in the harbour
        box(sg, x, -0.4, z, 28, 3.2, 10, hd, [0.12, 0.12, 0.14], [0.72, 0.18, 0.14], true); box(sg, x - c * 1, 2.8, z - s * 1, 9, 3.4, 7, hd, WH, [0.85, 0.85, 0.85], true); box(sg, x - c * 1, 6.2, z - s * 1, 5, 2.4, 6, hd, [0.2, 0.3, 0.4], WH, true); }
      addM(sg, matV, false, true, 'ships');
    }

    /* ---- the land beyond: the hills and the city round the harbour out to ~17 km (the terrain tiles every 250 m, coloured by the land cover:
       the bush dark green, the grass, the suburbs grey-beige, the sand), low in the haze ---- */
    {
      const F = P.far, n = F.n, pos = [], col = [], idx = [], LCOL = [[0.56, 0.6, 0.42], [0.3, 0.38, 0.26], [0.45, 0.48, 0.36], [0.7, 0.68, 0.62], [0.86, 0.8, 0.66], [0.4, 0.5, 0.56], [0.42, 0.48, 0.36]];
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x = F.x0 + i * F.cell, z = F.z0 + j * F.cell, h = F.h[j * n + i], inR = x > P.x0 + 250 && x < P.x1 - 250 && z > P.z0 + 250 && z < P.z1 - 250;
        pos.push(x, inR ? -10 : h < 0.5 ? -3 : h + 0.5, z); const c = LCOL[F.lc[j * n + i]] || LCOL[3]; col.push(c[0], c[1], c[2]); }
      for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) { const a = j * n + i, b = a + 1, c = a + n, e = c + 1;
        const x = F.x0 + (i + 0.5) * F.cell, z = F.z0 + (j + 0.5) * F.cell; if (x > P.x0 + 200 && x < P.x1 - 200 && z > P.z0 + 200 && z < P.z1 - 200) continue;
        if (Math.max(F.h[a], F.h[b], F.h[c], F.h[e]) < 0.5) continue; idx.push(a, c, b, b, c, e); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true })); m.name = 'far'; m.matrixAutoUpdate = false; root.add(m);
    }

    /* ---- the boards: the place's name over the start, the braking boards before Turns 1, 2 and 11 (300 / 200 / 100), the turns' number boards;
       flags along the pit straight ---- */
    {
      const c = document.createElement('canvas'); c.width = 1024; c.height = 640; const x = c.getContext('2d');
      x.fillStyle = '#123b2a'; x.fillRect(0, 0, 1024, 128); x.fillStyle = '#f5c518'; x.fillRect(0, 112, 1024, 16); x.fillStyle = '#f4f2ec'; x.font = '900 88px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('NEWCASTLE', 512, 62, 980);
      x.fillStyle = '#e8e6e0'; x.fillRect(0, 128, 1024, 128); for (let k = 0; k < 3; k++) { x.fillStyle = '#111'; x.font = '900 84px Arial, sans-serif'; x.fillText(String((3 - k) * 100), 170 + k * 340, 196, 300); }
      for (let k = 0; k < 14; k++) { const u = (k % 7) * 146, v = 256 + Math.floor(k / 7) * 128; x.fillStyle = '#16314f'; x.fillRect(u + 4, v + 4, 138, 120); x.fillStyle = '#f4f2ec'; x.font = '900 86px Arial, sans-serif'; x.fillText(String(k + 1), u + 73, v + 68, 130); }
      for (const [u0, nsw] of [[0, false], [256, true]]) {   // the flags: Australia's (the Union Jack, the Commonwealth Star, the Southern Cross) and New South Wales' (its badge)
        x.fillStyle = '#012169'; x.fillRect(u0, 512, 256, 128); x.fillStyle = '#ffffff'; x.fillRect(u0 + 52, 512, 24, 64); x.fillRect(u0, 532, 128, 24);
        x.strokeStyle = '#ffffff'; x.lineWidth = 12; x.beginPath(); x.moveTo(u0, 512); x.lineTo(u0 + 128, 576); x.moveTo(u0 + 128, 512); x.lineTo(u0, 576); x.stroke();
        x.strokeStyle = '#c8102e'; x.lineWidth = 4; x.beginPath(); x.moveTo(u0, 512); x.lineTo(u0 + 128, 576); x.moveTo(u0 + 128, 512); x.lineTo(u0, 576); x.stroke();
        x.fillStyle = '#c8102e'; x.fillRect(u0 + 57, 512, 14, 64); x.fillRect(u0, 537, 128, 14);
        x.fillStyle = '#ffffff';
        if (!nsw) { const star = (cx, cy, r) => { x.beginPath(); for (let k = 0; k < 14; k++) { const a = -Math.PI / 2 + k * Math.PI / 7, rr = k % 2 ? r * 0.45 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.fill(); };
          star(u0 + 64, 608, 17); for (const [sx, sy, r] of [[192, 622, 9], [160, 576, 8], [192, 530, 8], [224, 566, 8], [206, 584, 4]]) star(u0 + sx, 512 + sy - 512, r); }
        else { x.beginPath(); x.arc(u0 + 192, 576, 34, 0, TAU); x.fill(); x.fillStyle = '#c8102e'; x.fillRect(u0 + 186, 544, 12, 64); x.fillRect(u0 + 160, 570, 64, 12); x.fillStyle = '#f5c518'; x.beginPath(); x.arc(u0 + 192, 576, 7, 0, TAU); x.fill(); } }
      const atl = ownTex(new THREE.CanvasTexture(c)), gb = new GB(true), W1 = [1, 1, 1];
      const flagAt = (fx, fy, fz, k, Wd) => { const a = 0.9, ca = Math.cos(a), sa = Math.sin(a), Hf = Wd * 0.5, u0 = k === 'nsw' ? 0.25 : 0;   // (the cloth flies downwind: the sea breeze from the north-east)
        cyl(scen.get(fx, fz), fx, ncGround(fx, fz), fz, 0.05, fy + Hf - ncGround(fx, fz) + 0.2, 5, [0.9, 0.9, 0.92]);
        gb.quadO([fx, fy, fz], [fx + ca * Wd, fy - 0.15, fz + sa * Wd], [fx + ca * Wd, fy + Hf - 0.15, fz + sa * Wd], [fx, fy + Hf, fz], W1, [fx - sa, fy + Hf / 2, fz + ca], [[u0, 0], [u0 + 0.25, 0], [u0 + 0.25, 0.2], [u0, 0.2]]); };
      const board = (cx, cy, cz, fx, fz, Wd, H, u0, u1, v0, v1) => { const ux = fz, uz = -fx, A = [cx - ux * Wd / 2, cy, cz - uz * Wd / 2], B = [cx + ux * Wd / 2, cy, cz + uz * Wd / 2];
        gb.quadO(A, B, [B[0], cy + H, B[2]], [A[0], cy + H, A[2]], W1, [cx - fx, cy + H / 2, cz - fz], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); };
      { const [gx, gz, , gi] = atS(sStart, 0), span = Math.max(T.bl[gi], T.br[gi]) + 1.2; for (const sd of [-1, 1]) board(gx + T.tx[gi] * sd * 0.6, T.hy[gi] + 5.75, gz + T.tz[gi] * sd * 0.6, T.tx[gi] * sd, T.tz[gi] * sd, span * 2 - 2, 1.3, 0, 1, 0.8, 1); }
      for (const n of ['Zavoj 1', 'Zavoj 2', 'Zavoj 11']) { const f = T.names.find(q => q.n === n); if (!f) continue; const c0 = T.corners.find(cc => Math.abs(dS(cc.s0) - f.d) < 120); if (!c0) continue; const side = -c0.dir;
        for (let m = 1; m <= 3; m++) { const q = crAt(sAt(dS(c0.s0) - m * 100 + 40)); if (!q) continue; const o = (side > 0 ? q.br : q.bl) - 0.35, x2 = q.px + q.nx * side * o, z2 = q.pz + q.nz * side * o;
          board(x2, q.hy + 1.15, z2, -q.tx, -q.tz, 1.6, 1.0, (3 - m) / 3, (4 - m) / 3, 0.6, 0.8); box(scen.get(x2, z2), x2, q.hy, z2, 0.12, 1.15, 0.12, 0, [0.5, 0.5, 0.52]); } }
      (def.turns || []).forEach(([tx0, tz0], k) => { const i = T.nearestIdx(tx0, tz0), c0 = T.corners.find(cc => Math.abs(cc.i0 - i) < 25 || Math.abs(cc.i1 - i) < 25), side = c0 ? c0.dir : 1;   // (on the inside of the turn, on top of the wall)
        const o = (side > 0 ? T.br[i] : T.bl[i]) + 0.3, x2 = T.px[i] + T.nx[i] * side * o, z2 = T.pz[i] + T.nz[i] * side * o, u = (k % 7) * 146 / 1024, v = 1 - (256 + Math.floor(k / 7) * 128) / 512;
        board(x2, T.hy[i] + 1.15, z2, -T.tx[i], -T.tz[i], 1.1, 0.95, u + 4 / 1024, u + 142 / 1024, v - 124 / 640, v - 4 / 640); });
      if (LM.fort) { const [fx, fz] = LM.fort; flagAt(fx, ncGround(fx, fz) + 14.4, fz, 'au', 3.2); }
      addM(gb, new THREE.MeshLambertMaterial({ map: atl, side: THREE.DoubleSide }), false, true, 'boards');
      for (let d = -150; d <= 70; d += 22) { const q = crAt(sAt(d)); if (!q) continue; const o = q.bl + 1.2, x2 = q.px - q.nx * o, z2 = q.pz - q.nz * o; if (inBld(x2, z2, 0.5) || excluded(x2, z2)) continue; flagAt(x2, ncGround(x2, z2) + 7, z2, (d / 22 | 0) % 2 ? 'nsw' : 'au', 1.8); }
    }

    { const n0 = root.children.length; scen.addTo(root, matV, true, true); for (let k = n0; k < root.children.length; k++) root.children[k].name = 'scen'; }
    out.noBirds = true;
    out.winMaps = [ncFacades()];   // (their windows lit at night: Render's litWindows)
    crowdFinish(CR, root, out);
    out.stats = { buildings: nBld, trees: nTrees, cars: nCars, props: nProps, still: nStill, stands: nStands, fans: nFans };
    return out;
  }

  Object.defineProperties(API, { NC: { get: () => NC, set: (v) => { NC = v; } } });
  World.ext.newcastle = (scene, tex, opts) => buildNewcastle(scene, tex, opts);
})();
