/* Zvoki okolja: the sounds by the road (docs/zvoki-okolja.md). Birds in the woods and the leaves in the gusts, the water (a brook, a
   river, a waterfall, a lake, the sea with its gulls), the church bells in a village, the wind on a pass, the crickets and the cicadas.
   All made here (Web Audio synthesis, nothing downloaded), quiet under the engine; on the real tracks only (not the test tracks, not the
   tracks moved to them: NO, not the new map). And where the game has them: the cows' bells and their moos, the sheep's bleats (the herds
   of World.life), a town's far traffic and its pigeons (def.zivali.city), and at a circuit with its stands the announcer and the people's
   shouts, in English (the browser's speech as the commentator's, js/comm.js: quiet, never with the commentator or the co-driver).
   - the zones: along the road every 20 m, on each side, what the track's own world has there: the trees (World.woods: the instanced
     trees), the water (the world's water meshes, each piece's kind by its shape), the villages (the open roads' lamp zones, VAS), the
     church bells (BELLS, from OpenStreetMap), the wind (the road's height in its range, the altitude, the openness), the climate (GEO's
     latitude and altitude). Made once per world in slices (zonesGen: <= 2 ms a frame), kept with the world; tools/zvoki-pasovi.mjs
     prints them.
   - the voices and the mixer: below. js/sfx.js calls SfxOkolje.step() from its update (its context, the race's bus, the crowds' and the
     tunnel's levels) and SfxOkolje.silence() from its silence; js/game.js SfxOkolje.set() with the settings (Zvoki okolja: Izklop / Tiho /
     Normalno / Glasno). With the sound off or Izklop nothing is made: no node, no buffer. */
(function () {
  'use strict';
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const rngOf = (seed) => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const hashOf = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };

  /* ---------------- which tracks ---------------- */
  // the tracks the user moved to the test tracks whose pull requests are not on main yet (the US roads but Pikes Peak, Rio de Janeiro,
  // Vršič, Mount Buller, Toronto, Trois-Rivières, Sani Pass, Bang Saen): frozen, no sounds by the road; once def.test is theirs, def.test
  // (and Longford, Mount Hotham, Newcastle and Townsville: the user, 6. 11. 2026, the bundle B)
  const NO = new Set(['baldy', 'beartooth', 'bigsur', 'monterey', 'palomar', 'uncompahgre', 'rio', 'vrsic', 'mountbuller', 'toronto', 'troisrivieres', 'sani', 'bangsaen', 'hotham', 'longford', 'newcastle', 'townsville']);
  const eligible = (def) => !!def && !def.test && !NO.has(def.id);
  // the places GEO has not (latitude, the altitude of the road's lowest point, m)
  const PLACE = { bathurst: [-33.45, 700], cpalace: [51.42, 95], livorno: [43.5, 5] };
  const SEA = new Set(['livorno']);   // (by the sea, without def.sea: its big water is the sea)
  function geoOf(id) {
    const G = window.GEO && GEO.tracks, g = G && (G[id] || (id === 'pikesg' ? G.pikes : null));
    if (g && Number.isFinite(g.lat0)) return [g.lat0, Number.isFinite(g.offset) ? g.offset : 0];
    return PLACE[id] || null;
  }
  // the villages the world has no lamp zones for: [from, to, how much of a village (1 a village, 0.5 a hamlet)], metres from the start
  // (kept here, not in the tracks' files: the places from OpenStreetMap, tools/zvoki-pasovi.mjs --osm, and tools/livorno/livorno.json)
  const VAS = {
    ouninpohja: [[1476, 1676, 0.5], [8534, 8734, 0.5]],   // (Ouni, Kakaristo: a farm, the junction in the fields; js/world.js OB)
    livorno: [[-400, 400, 1], [3250, 3750, 1], [4300, 4580, 0.5], [7330, 7590, 0.5], [16500, 17300, 1]],   // (Livorno, Montenero, Savolano, Castellaccio, Antignano)
    nring: [[7850, 8050, 0.5], [20100, 20500, 0.5]],   // (Breidscheid, Nürburg)
  };
  // the churches within ~600 m of the road (OpenStreetMap, amenity=place_of_worship or building=church, tools/zvoki-pasovi.mjs --osm):
  // [metres from the start, the side (-1 left, 1 right), how far from the road (m)]; only those with bells (not a temple, a hall, a
  // hotel's chapel)
  const BELLS = {
    medvode: [[1464, -1, 57], [2884, -1, 239], [3544, 1, 376], [4464, -1, 428]],   // (Medvode, Zbilje, Valburga, Smlednik)
    livorno: [[730, -1, 26], [1230, 1, 26], [3230, 1, 56], [4210, 1, 558], [6730, 1, 19], [17070, 1, 15], [17330, 1, 49], [17890, 1, 440]],   // (Livorno, Montenero, Antignano)
    nring: [[20380, 1, 236]],   // (Nürburg)
    harju: [[50, 1, 239], [1430, 1, 452]],   // (Jyväskylä)
    chapman: [[-140, 1, 385]],   // (Hout Bay)
  };

  /* ---------------- the zones ---------------- */
  const ZDS = 20, FR = 60, FCAP = 45, WB = 240, WC = 8, CC = 32;   // the samples' spacing; the woods' radius and a full wood's trees; the water's band, its fine and coarse cells
  const BROOK = 1, RIVER = 2, FALL = 3, LAKE = 4, SEAK = 5, KN = ['', 'brook', 'river', 'waterfall', 'lake', 'sea'];
  // each kind: how strong, from how near it is that strong (a line of sound: down 3 dB each time the distance doubles), how far it is heard
  // at all (m), which wins a cell
  const KG = [0, 0.7, 0.85, 1, 0.45, 1], KD = [1, 6, 15, 20, 8, 30], KR = [1, 60, 220, 260, 90, 360], PRI = [0, 3, 4, 5, 1, 2];
  const wAmp = (kind, d) => KG[kind] * Math.sqrt(KD[kind] / Math.max(KD[kind], d)) * (1 - sstep(0.6 * KR[kind], KR[kind], d));
  const WKIND = { cpalace: { [RIVER]: LAKE } };   // (a track's water its shape tells wrong: the park's long lakes)
  const ck = (x, z) => (x + 4096) * 8192 + (z + 4096);   // (a cell's key, a small integer: |x|, |z| < 4096 cells, 32 km of 8 m cells)
  // (an open-addressing table for up to n integer keys >= 0 below 2^53, at(k): k's slot or the empty one; no rehashing, and two of them
  // kept for all the meshes of a world, emptied for each: no garbage for the collector to stop for)
  const TABS = [];
  function htab(n, i) {
    let b = 4; while ((1 << b) < n * 2) b++;
    const T = TABS[i]; if (T && T.b >= b) { T.K.fill(-1); return T; }
    const m = 1 << b, K = new Float64Array(m).fill(-1), V = new Int32Array(m), sh = 32 - b, mk = m - 1;
    return (TABS[i] = { b, K, V, m, at: (k) => { let h = Math.imul(((k / 4294967296) | 0) ^ (k | 0), -1640531535) >>> sh; while (K[h] !== -1 && K[h] !== k) h = (h + 1) & mk; return h; } });
  }
  let DL = Infinity, stage = '';   // (the slice's end: performance.now(); zones() runs it whole. stage: where the prep is, levels().prep.at)
  const late = () => performance.now() > DL;

  function* zonesGen(o, T, dbg) {
    const t0 = performance.now(), def = T.def, id = def.id, len = T.len, n = Math.max(2, Math.ceil(len / ZDS)), loop = !T.open;
    const Z = { id, n, len, open: !loop, s0: T.startS || 0, s1: loop ? (T.startS || 0) + len : T.finishS, fL: new Float32Array(n), fR: new Float32Array(n), wL: new Float32Array(n), wR: new Float32Array(n),
      kL: new Uint8Array(n), kR: new Uint8Array(n), vas: new Float32Array(n), wind: new Float32Array(n), bells: [], ring: [], herds: [], city: false, pa: false, clim: null, st: { trees: 0, water: [0, 0, 0, 0, 0, 0], cells: 0, ms: 0, slices: 0 }, dbg: dbg ? [] : null };
    const P = new Float32Array(n * 5);   // (each sample: x, z, the normal (+: the right), the road's height)
    for (let k = 0; k < n; k++) { const i = T.idx(Math.min(len - 0.01, (k + 0.5) * ZDS)); P[k * 5] = T.px[i]; P[k * 5 + 1] = T.pz[i]; P[k * 5 + 2] = T.nx[i]; P[k * 5 + 3] = T.nz[i]; P[k * 5 + 4] = T.hy ? T.hy[i] : 0; }
    const smooth = (A) => { const B = A.slice(); for (let k = 0; k < n; k++) { const a = loop ? (k + n - 1) % n : Math.max(0, k - 1), b = loop ? (k + 1) % n : Math.min(n - 1, k + 1); A[k] = 0.25 * B[a] + 0.5 * B[k] + 0.25 * B[b]; } };
    // the woods: the trees within FR on each side (nearer ones count more), by the world's detail (fewer trees on a lower one)
    stage = 'woods';
    if (def.theme === 'pikes') { for (let k = 0; k < n; k++) Z.fL[k] = Z.fR[k] = 0.75 * (1 - sstep(170, 200, P[k * 5 + 4])); }   // (Pikes Peak: its forest merged into the scenery; up to the treeline, js/sfx.js's echo)
    else if (typeof World !== 'undefined' && World.woods && o.root) {
      const Wd = o.woods || (World.woodsGen ? yield* World.woodsGen(o, late) : World.woods(o)), C = Wd.cell || 12, LOD = World.api && World.api.LOD, cap = FCAP * (LOD && LOD.dens > 0 ? LOD.dens : 1); Z.st.trees = Wd.n;
      const G = new Map(); let q0 = 0;   // (its cells by a number, not by the string: no garbage per look-up)
      for (const L of Wd.trees.values()) { if (L.length) G.set(ck(Math.floor(L[0] / C), Math.floor(L[1] / C)), L); if ((++q0 & 1023) === 0 && late()) yield; }
      yield;
      for (let k = 0; k < n; k++) {
        const x = P[k * 5], z = P[k * 5 + 1], nx = P[k * 5 + 2], nz = P[k * 5 + 3]; let l = 0, r = 0;
        for (let a = Math.floor((x - FR) / C), a1 = Math.floor((x + FR) / C); a <= a1; a++) for (let b = Math.floor((z - FR) / C), b1 = Math.floor((z + FR) / C); b <= b1; b++) {
          const L = G.get(ck(a, b)); if (!L) continue;
          for (let q = 0; q < L.length; q += 4) { if (!L[q + 3]) continue; const dx = L[q] - x, dz = L[q + 1] - z, d2 = dx * dx + dz * dz; if (d2 > FR * FR) continue;
            const w = 1 - 0.5 * Math.sqrt(d2) / FR; if (dx * nx + dz * nz > 0) r += w; else l += w; }
        }
        Z.fL[k] = Math.min(1, l / cap); Z.fR[k] = Math.min(1, r / cap);
        if (late()) yield;
      }
      smooth(Z.fL); smooth(Z.fR);
    }
    stage = 'water'; yield* waterGen(o, T, Z, P); stage = 'zones';
    // the villages: the open roads' lamp zones (js/world.js OB), VAS; 60 m in and out
    const sOf = (d) => loop ? (((Z.s0 + d) % len) + len) % len : Z.s0 + d;
    const span = (a, b, v) => {   // (from a to b metres from the start: v, and 60 m in and out)
      for (let k = 0; k < n; k++) { let d = (k + 0.5) * ZDS - Z.s0, out = Infinity;
        for (const dd of loop ? [d - len, d, d + len] : [d]) out = Math.min(out, dd < a ? a - dd : dd > b ? dd - b : 0);
        const f = v * (1 - sstep(0, 60, out)); if (f > Z.vas[k]) Z.vas[k] = f; } };
    const spans = (!loop && o.lampZones ? o.lampZones.map(z => [z[0], z[1], 1]) : []).concat(VAS[id] || []);
    if (def.cityStage) spans.push([-200, (loop ? len : Z.s1 - Z.s0) + 200, 0.6]);   // (a town's streets: a town all the way)
    for (const z of spans) span(z[0], z[1], z[2]);
    // the bells: each church's when the car comes within 250 m of it; a village (>= 0.75) without one, its own 150 m off the road
    const B = BELLS[id] || [], R0 = rngOf(hashOf(id));
    for (const b of B) Z.ring.push([sOf(b[0] - 250), sOf(b[0]), b[1], b[2]]);
    for (const z of spans) if (z[2] >= 0.75 && !B.some(b => b[0] > z[0] - 300 && b[0] < z[1] + 300)) Z.ring.push([sOf(z[0]), sOf(z[0] + 150), R0() < 0.5 ? -1 : 1, 150]);
    for (const r of Z.ring) Z.bells.push([r[1], r[2], r[3]]);
    // the herds by the road (World.life's glades and scenes, o.lifeStats.at: metres after the start, the side, metres beyond the barrier,
    // the kind): the cows (their bells, now and then a moo), the sheep (their bleats); each [s, side, off the road (m), 'cow' | 'sheep']
    const LS = o.lifeStats;
    if (LS && LS.at) for (const a of LS.at) { const kd = /^cow/.test(a[3]) ? 'cow' : a[3] === 'sheep' ? 'sheep' : null; if (!kd) continue;
      const s = sOf(a[0]), i = T.idx(clamp(s, 0, len - 0.01)), bar = (a[1] > 0 ? T.br : T.bl) || null; Z.herds.push([s, a[1], (bar ? bar[i] : 5) + a[2] + 3, kd]); }
    Z.city = !!(def.zivali && def.zivali.city);   // (a town round the road: its far traffic, its pigeons)
    Z.pa = loop && !!(o.crowdPts && o.crowdPts.length);   // (a circuit with its stands: the announcer, the people's shouts)
    // the climate; the wind: up a real climb the higher the more, the altitude, the open land (trees shelter), by the sea a breeze
    const g = geoOf(id), H = T.hy; let h0 = 0, h1 = 0;
    if (H) { h0 = Infinity; h1 = -Infinity; for (let i = 0; i < H.length; i++) { if (H[i] < h0) h0 = H[i]; if (H[i] > h1) h1 = H[i]; } }
    const alt0 = g ? g[1] : 300, relief = sstep(60, 400, h1 - h0), seaB = def.sea || SEA.has(id) ? 0.2 : 0;
    Z.clim = { lat: g ? g[0] : 45, alt: alt0 + (h0 + h1) / 2 };
    if (def.theme !== 'pikes') for (let k = 0; k < n; k++) {   // (Pikes Peak: its own wind, js/sfx.js atmo)
      const y = P[k * 5 + 4], hn = h1 > h0 ? (y - h0) / (h1 - h0) : 0, open = 1 - 0.75 * Math.max(Z.fL[k], Z.fR[k]), sn = Math.max(Z.kL[k] === SEAK ? Z.wL[k] : 0, Z.kR[k] === SEAK ? Z.wR[k] : 0);
      Z.wind[k] = clamp((0.55 * sstep(500, 2500, alt0 + y) + 0.55 * relief * Math.pow(hn, 1.5) + seaB * Math.min(1, 0.4 + sn * 3)) * open, 0, 1);
    }
    Z.st.ms = Math.round(performance.now() - t0);
    return Z;
  }

  /* the water: the world's water meshes (a water shader, the water texture of out.dyn.water, Pikes Peak's lake and creek, Katu-Jaryk's
     rapids), each mesh's pieces (their triangles joined at shared corners) and each piece's kind by its shape: narrow (under ~9 m) a brook,
     long and up to ~90 m a river, else a lake; on a sea track the lowest water the sea; steep pieces with a drop a waterfall; a small round
     pool silent. A plane of many km² (the sea under the land, a river's basin) is left out: its shore bands (the copies with a 'shore'
     attribute) stand for it, of the kind of the water they lie on. Their cells (8 m) only within WB of the road; for each sample and side
     the loudest water (its kind) by the distance (its height apart counts half) */
  function* waterGen(o, T, Z, P) {
    const n = Z.n, def = T.def, wtex = o.dyn && o.dyn.water, seaT = !!def.sea || SEA.has(def.id), RB = Math.ceil(WB / CC) + 1;
    let gx0 = Infinity, gz0 = Infinity, gx1 = -Infinity, gz1 = -Infinity;   // (the coarse cells within WB of the road: a grid over the road's box)
    for (let k = 0; k < n; k++) { const cx = Math.floor(P[k * 5] / CC), cz = Math.floor(P[k * 5 + 1] / CC); gx0 = Math.min(gx0, cx); gx1 = Math.max(gx1, cx); gz0 = Math.min(gz0, cz); gz1 = Math.max(gz1, cz); }
    gx0 -= RB; gz0 -= RB; const gw = gx1 + RB - gx0 + 1, gh = gz1 + RB - gz0 + 1, NG = new Uint8Array(gw * gh);
    const near = (cx, cz) => { const a = cx - gx0, b = cz - gz0; return a >= 0 && b >= 0 && a < gw && b < gh && NG[b * gw + a] === 1; };
    for (let k = 0, lc = NaN; k < n; k++) { const cx = Math.floor(P[k * 5] / CC) - gx0, cz = Math.floor(P[k * 5 + 1] / CC) - gz0, c = cz * gw + cx; if (c === lc) continue; lc = c;
      for (let b = -RB; b <= RB; b++) NG.fill(1, (cz + b) * gw + cx - RB, (cz + b) * gw + cx + RB + 1); }
    const meshes = [], all = []; stage = 'water: the meshes';
    if (o.root) o.root.traverse(m => { if (m.isMesh && !m.isInstancedMesh && m.geometry && m.material) all.push(m); });
    yield;
    for (let i = 0; i < all.length; i++) { const m = all[i], mt = Array.isArray(m.material) ? m.material[0] : m.material, key = mt && typeof mt.customProgramCacheKey === 'function' ? String(mt.customProgramCacheKey()) : '';
      if (/(^|\|)water\|/.test(key) || key === 'pkLake' || key === 'pkCreek' || key === 'ktFoam' || (wtex && mt.map === wtex)) { m.updateWorldMatrix(true, false); meshes.push([m, key]); }
      if ((i & 63) === 63 && late()) yield; }
    yield;
    const cKind = [], cY = [], coarse = new Map();   // (the fine cells by their coarse cell: its 4 × 4 slots, the list of those laid)
    const put = (fx, fz, kind, y) => {   // (a fine cell: the stronger kind wins)
      const cx = Math.floor(fx / 4), cz = Math.floor(fz / 4); if (!near(cx, cz)) return;
      const c = ck(cx, cz); let E = coarse.get(c); if (!E) coarse.set(c, E = { f: new Int32Array(16).fill(-1), L: [] });
      const j = (fx - cx * 4) + 4 * (fz - cz * 4), s = E.f[j];
      if (s < 0) { E.f[j] = cKind.length; cKind.push(kind); cY.push(y); E.L.push(fx, fz, cKind.length - 1); }
      else if (PRI[kind] > PRI[cKind[s]]) { cKind[s] = kind; cY[s] = y; } };
    const cellAt = (fx, fz) => { const cx = Math.floor(fx / 4), cz = Math.floor(fz / 4), E = coarse.get(ck(cx, cz)); return E ? E.f[(fx - cx * 4) + 4 * (fz - cz * 4)] : -1; };
    const pieces = [], bands = [];   // (each piece: its mesh's world corners, its triangles, its numbers; the bands' to be laid last)
    stage = 'water: the pieces';
    for (const [m, key] of meshes) {
      const g = m.geometry, pa = g.attributes.position; if (!pa || pa.isInterleavedBufferAttribute || pa.itemSize !== 3 || pa.count < 3) continue;
      const A = pa.array, e = m.matrixWorld.elements, I = g.index ? g.index.array : null, nv = pa.count, nt = Math.floor((I ? I.length : nv) / 3);
      const X = new Float32Array(nv), Y = new Float32Array(nv), Q = new Float32Array(nv), rt = new Int32Array(nv), at = htab(nv, 0);
      for (let v = 0; v < nv; v++) { const x = A[v * 3], y = A[v * 3 + 1], z = A[v * 3 + 2];
        X[v] = e[0] * x + e[4] * y + e[8] * z + e[12]; Y[v] = e[1] * x + e[5] * y + e[9] * z + e[13]; Q[v] = e[2] * x + e[6] * y + e[10] * z + e[14];
        const q = (Math.round(X[v] * 4) + 1048576) * 2097152 + (Math.round(Q[v] * 4) + 1048576), h = at.at(q); if (at.K[h] === -1) { at.K[h] = q; at.V[h] = v; rt[v] = v; } else rt[v] = at.V[h];
        if ((v & 1023) === 1023 && late()) yield; }
      const up = new Int32Array(nv); for (let v = 0; v < nv; v++) up[v] = rt[v];
      const find = (v) => { while (up[v] !== v) { up[v] = up[up[v]]; v = up[v]; } return v; };
      const tv = (t, j) => rt[I ? I[t * 3 + j] : t * 3 + j];
      for (let t = 0; t < nt; t++) { const a = find(tv(t, 0)), b = find(tv(t, 1)), c = find(tv(t, 2)); if (a !== b) up[b] = a; const a2 = find(a); if (a2 !== c) up[c] = a2;
        if ((t & 1023) === 1023 && late()) yield; }
      const comp = new Map(), edges = htab(3 * nt, 1), tc = new Int32Array(nt).fill(-1);
      const box = (C, v) => { if (X[v] < C.x0) C.x0 = X[v]; if (X[v] > C.x1) C.x1 = X[v]; if (Q[v] < C.z0) C.z0 = Q[v]; if (Q[v] > C.z1) C.z1 = Q[v]; if (Y[v] < C.y0) C.y0 = Y[v]; if (Y[v] > C.y1) C.y1 = Y[v]; };
      const edge = (p, q) => { const k = p < q ? p * nv + q : q * nv + p, h = edges.at(k); if (edges.K[h] === -1) { edges.K[h] = k; edges.V[h] = 1; } else edges.V[h]++; };
      for (let t = 0; t < nt; t++) {
        const a = tv(t, 0), b = tv(t, 1), c = tv(t, 2);
        if (!near(Math.floor(X[a] / CC), Math.floor(Q[a] / CC)) && !near(Math.floor(X[b] / CC), Math.floor(Q[b] / CC)) && !near(Math.floor(X[c] / CC), Math.floor(Q[c] / CC))
          && Math.max(Math.abs(X[a] - X[b]), Math.abs(X[b] - X[c]), Math.abs(X[c] - X[a]), Math.abs(Q[a] - Q[b]), Math.abs(Q[b] - Q[c]), Math.abs(Q[c] - Q[a])) < 2 * CC) continue;   // (far from the road: each piece's shape as near the road; a big triangle is looked at whole)
        const r = find(a); let C = comp.get(r);
        if (!C) comp.set(r, C = { area: 0, a3: 0, steep: 0, per: 0, x0: Infinity, z0: Infinity, x1: -Infinity, z1: -Infinity, y0: Infinity, y1: -Infinity, ys: 0, kind: 0, id: comp.size });
        tc[t] = C.id;
        const ux = X[b] - X[a], uy = Y[b] - Y[a], uz = Q[b] - Q[a], vx = X[c] - X[a], vy = Y[c] - Y[a], vz = Q[c] - Q[a];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.sqrt(nx * nx + ny * ny + nz * nz); if (l < 1e-9) continue;
        C.area += Math.abs(ny) / 2; C.a3 += l / 2; if (Math.abs(ny) / l < 0.85) C.steep += l / 2; C.ys += (Y[a] + Y[b] + Y[c]) / 3 * Math.abs(ny) / 2;
        box(C, a); box(C, b); box(C, c); edge(a, b); edge(b, c); edge(c, a);
        if ((t & 63) === 63 && late()) yield;
      }
      for (let h = 0; h < edges.m; h++) { if ((h & 8191) === 8191 && late()) yield;
        if (edges.V[h] !== 1) continue;   // (the edges of one triangle only: the pieces' shores)
        const k = edges.K[h], p = Math.floor(k / nv), q = k - p * nv, C = comp.get(find(p)), ex = X[q] - X[p], ez = Q[q] - Q[p]; if (C) C.per += Math.sqrt(ex * ex + ez * ez); }
      const band = !!g.attributes.shore, list = [...comp.values()];
      for (const C of list) { C.y = C.area > 0 ? C.ys / C.area : (C.y0 + C.y1) / 2; C.w = C.per > 0 ? 2 * C.area / C.per : 0; C.el = C.per > 0 ? C.per * C.per / (4 * Math.PI * Math.max(C.area, 1)) : 0; }
      const piece = { X, Y, Q, tv, nt, tc, comps: list, key, name: m.name, band };
      (band ? bands : pieces).push(piece);
      yield;
    }
    TABS.length = 0; stage = 'water: the cells';
    // the kinds
    let yLow = Infinity; for (const p of pieces) for (const C of p.comps) if (C.area > 50 && C.y < yLow) yLow = C.y;
    const openK = seaT ? SEAK : LAKE;
    for (const p of pieces) for (const C of p.comps) {
      const ext = Math.max(C.x1 - C.x0, C.z1 - C.z0);
      if (C.area > 2e6 || ext > 4000) C.kind = -1;   // (a plane under the land: its bands stand for it)
      else if (p.key === 'ktFoam' || p.name === 'rapids') C.kind = RIVER;
      else if (p.key === 'pkCreek') C.kind = BROOK;
      else if (C.steep > 40 && C.y1 - C.y0 > 4 && C.steep > 0.3 * C.a3) C.kind = FALL;
      else if (C.area < 3000 && C.el < 3) C.kind = 0;   // (a pond, a pool: still)
      else if (seaT && C.y < yLow + 1.5 && C.w < 90) C.kind = SEAK;   // (the surf's foam along the shore, the sea's pieces)
      else if (C.w < 9) C.kind = BROOK;
      else if (C.el > 6 && C.w < 90) C.kind = RIVER;
      else C.kind = seaT && C.y < yLow + 1.5 ? SEAK : LAKE;
      const wk = WKIND[def.id]; if (wk && wk[C.kind]) C.kind = wk[C.kind];
    }
    // the cells: each triangle's (their centres inside it, and along its edges every 4 m: a brook's thin ribbon)
    const line = (sx, sz, ex, ez, kind, y) => { const dx = ex - sx, dz = ez - sz, m = Math.max(1, Math.ceil(Math.sqrt(dx * dx + dz * dz) * 2)); for (let j = 0; j <= m; j++) put(Math.floor(sx + dx * j / m), Math.floor(sz + dz * j / m), kind, y); };
    const lay = function* (p, t, kind, y) {
      const a = p.tv(t, 0), b = p.tv(t, 1), c = p.tv(t, 2), ax = p.X[a] / WC, az = p.Q[a] / WC, bx = p.X[b] / WC, bz = p.Q[b] / WC, cx = p.X[c] / WC, cz = p.Q[c] / WC;
      line(ax, az, bx, bz, kind, y); line(bx, bz, cx, cz, kind, y); line(cx, cz, ax, az, kind, y);
      const ar = (bx - ax) * (cz - az) - (cx - ax) * (bz - az); if (Math.abs(ar) < 1e-6) return;
      const i0 = Math.floor(Math.min(ax, bx, cx)), i1 = Math.floor(Math.max(ax, bx, cx)), j0 = Math.floor(Math.min(az, bz, cz)), j1 = Math.floor(Math.max(az, bz, cz));
      if ((i1 - i0 + 1) * (j1 - j0 + 1) > 4e5) return;
      for (let j = j0; j <= j1; j++) { for (let i = i0; i <= i1; i++) { const px = i + 0.5, pz = j + 0.5, u = ((bx - px) * (cz - pz) - (cx - px) * (bz - pz)) / ar, v = ((cx - px) * (az - pz) - (ax - px) * (cz - pz)) / ar;
          if (u >= -0.02 && v >= -0.02 && u + v <= 1.04) put(i, j, kind, y); }
        if ((j & 7) === 7 && late()) yield; }
    };
    for (const p of pieces) { for (let t = 0; t < p.nt; t++) { if (p.tc[t] < 0) continue; const C = p.comps[p.tc[t]]; if (C && C.kind > 0) yield* lay(p, t, C.kind, C.y); if ((t & 15) === 15 && late()) yield; } }
    for (const p of bands) for (let t = 0; t < p.nt; t++) {   // (a band: the kind of the water it lies on, else the big water's)
      if (p.tc[t] < 0) continue;
      const a = p.tv(t, 0), fx = Math.floor(p.X[a] / WC), fz = Math.floor(p.Q[a] / WC); let kind = 0, y = p.Y[a];
      for (let r = 0; r <= 3 && !kind; r++) for (let i = -r; i <= r && !kind; i++) for (let j = -r; j <= r; j++) { const s = cellAt(fx + i, fz + j); if (s >= 0) { kind = cKind[s]; break; } }
      yield* lay(p, t, kind || openK, y); if ((t & 15) === 15 && late()) yield;
    }
    for (const p of pieces) for (const C of p.comps) if (C.kind > 0) Z.st.water[C.kind]++;
    if (Z.dbg) for (const p of pieces.concat(bands)) for (const C of p.comps) { const x = (C.x0 + C.x1) / 2, z = (C.z0 + C.z1) / 2; let bd = Infinity;
      for (let k = 0; k < n; k++) bd = Math.min(bd, Math.hypot(P[k * 5] - x, P[k * 5 + 1] - z));
      Z.dbg.push({ kind: p.band ? 'band' : KN[C.kind] || C.kind, key: p.key.slice(0, 12), name: p.name, area: Math.round(C.area), w: +C.w.toFixed(1), el: +C.el.toFixed(1), y: +C.y.toFixed(1), ext: Math.round(Math.max(C.x1 - C.x0, C.z1 - C.z0)), d: Math.round(bd) }); }
    for (const p of bands) Z.st.water[0]++;
    Z.st.cells = cKind.length;
    yield;
    // each sample: the loudest water on each side
    stage = 'water: the samples'; const R = Math.ceil(WB / CC) + 1, any = coarse.size > 0;
    for (let k = 0; any && k < n; k++) {
      const x = P[k * 5], z = P[k * 5 + 1], nx = P[k * 5 + 2], nz = P[k * 5 + 3], y = P[k * 5 + 4], cx = Math.floor(x / CC), cz = Math.floor(z / CC);
      let l = 0, r = 0, kl = 0, kr = 0;
      for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) { const E = coarse.get(ck(cx + a, cz + b)); if (!E) continue; const L = E.L;
        for (let q = 0; q < L.length; q += 3) { const s = L[q + 2], kind = cKind[s];
          const dx = (L[q] + 0.5) * WC - x, dz = (L[q + 1] + 0.5) * WC - z, dy = 0.5 * (y - cY[s]), d = Math.sqrt(dx * dx + dz * dz + dy * dy); if (d >= KR[kind]) continue;
          const v = wAmp(kind, d), lat = dx * nx + dz * nz;
          if (lat > -6 && v > r) { r = v; kr = kind; }
          if (lat < 6 && v > l) { l = v; kl = kind; } }
      }
      Z.wL[k] = l; Z.wR[k] = r; Z.kL[k] = kl; Z.kR[k] = kr;
      if (late()) yield;
    }
  }

  // the zones as rows [from, to, sound, side] in metres from the start (the tool and the tests); the bells as [at, 'bells', side]
  function table(Z) {
    const rows = [], ord = [];
    for (let k = 0; k < Z.n; k++) { const s = (k + 0.5) * ZDS; let d = s - Z.s0; if (!Z.open) d = ((d % Z.len) + Z.len) % Z.len; else if (d < -100 || s > Z.s1 + 100) continue; ord.push([d, k]); }
    ord.sort((a, b) => a[0] - b[0]);
    const runs = (name, f) => { let a = null, sd = 0, last = 0;
      for (const [d, k] of ord) { const v = f(k); if (v) { if (a == null) { a = d; sd = 0; } sd |= v; last = d; } else if (a != null) { rows.push([Math.round(a - ZDS / 2), Math.round(last + ZDS / 2), name, sd === 1 ? 'L' : sd === 2 ? 'D' : 'LD']); a = null; } }
      if (a != null) rows.push([Math.round(a - ZDS / 2), Math.round(last + ZDS / 2), name, sd === 1 ? 'L' : sd === 2 ? 'D' : 'LD']); };
    runs('gozd', k => (Z.fL[k] >= 0.35 ? 1 : 0) | (Z.fR[k] >= 0.35 ? 2 : 0));
    for (let kind = 1; kind <= 5; kind++) runs(['', 'potok', 'reka', 'slap', 'jezero', 'morje'][kind], k => (Z.kL[k] === kind && Z.wL[k] >= 0.35 * KG[kind] ? 1 : 0) | (Z.kR[k] === kind && Z.wR[k] >= 0.35 * KG[kind] ? 2 : 0));
    runs('vas', k => Z.vas[k] >= 0.45 ? 3 : 0);
    runs('veter', k => Z.wind[k] >= 0.3 ? 3 : 0);
    for (const b of Z.bells) { let d = b[0] - Z.s0; if (!Z.open) d = ((d % Z.len) + Z.len) % Z.len; rows.push([Math.round(d), Math.round(d), 'zvon', b[1] < 0 ? 'L' : 'D']); }
    for (const h of Z.herds) { let d = h[0] - Z.s0; if (!Z.open) d = ((d % Z.len) + Z.len) % Z.len; rows.push([Math.round(d), Math.round(d), h[3] === 'cow' ? 'krave' : 'ovce', h[1] < 0 ? 'L' : 'D']); }
    const all = Z.open ? Math.round(Z.s1 - Z.s0) : Math.round(Z.len);
    if (Z.city) rows.push([0, all, 'mesto', 'LD']);
    if (Z.pa) rows.push([0, all, 'razglas', 'LD']);
    return rows.sort((a, b) => a[0] - b[0] || (a[2] < b[2] ? -1 : 1));
  }

  const cache = new WeakMap();   // (the zones, each world's)
  function zones(o, T, dbg) {   // whole, at once (the tools and the tests; dbg: the water's pieces too)
    if (!o || !T || !eligible(T.def)) return null;
    let Z = cache.get(o); if (Z && !dbg) return Z;
    const g = zonesGen(o, T, dbg), dl = DL; DL = Infinity; let r;
    try { do r = g.next(); while (!r.done); } finally { DL = dl; }
    cache.set(o, r.value); return r.value;
  }

  /* ---------------- the voices ---------------- */
  // made here in slices (prepGen: <= 2 ms a frame while the cars wait on the grid) and only those the track, the season and the time of
  // day need: short loops and calls at 22 050 Hz (the bells, the brook and the river at 11 025 Hz: nothing of theirs above 5 kHz), mono.
  // The beds of filtered noise (the leaves, the waterfall, the lake, the sea, the wind) share one noise source; a gull is an oscillator.
  const SR = 22050, SR2 = 11025;
  function biquad(type, f, q, rate) {   // (RBJ's: 'lp', 'hp', 'bp' of 0 dB at its peak; a function x -> y)
    const w = 2 * Math.PI * f / rate, cs = Math.cos(w), al = Math.sin(w) / (2 * q), a0 = 1 + al;
    const b0 = type === 'lp' ? (1 - cs) / 2 : type === 'hp' ? (1 + cs) / 2 : al, b1 = type === 'lp' ? 1 - cs : type === 'hp' ? -(1 + cs) : 0, b2 = type === 'bp' ? -al : b0;
    const B0 = b0 / a0, B1 = b1 / a0, B2 = b2 / a0, A1 = -2 * cs / a0, A2 = (1 - al) / a0; let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    return (x) => { const y = B0 * x + B1 * x1 + B2 * x2 - A1 * y1 - A2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; };
  }
  const scale = (d, k) => { for (let i = 0; i < d.length; i++) d[i] *= k; return d; };
  const peakTo = (d, p) => { let m = 0; for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i])); return m > 0 ? scale(d, p / m) : d; };
  const rmsTo = (d, r) => { let s = 0; for (let i = 0; i < d.length; i++) s += d[i] * d[i]; return s > 0 ? scale(d, r / Math.sqrt(s / d.length)) : d; };
  const winTo = (d, r, p, w) => {   // (its loudest w samples to the RMS r, as loud as an ear hears a short call; its peak at most p)
    let m = 0, pk = 0; for (let a = 0; a < d.length; a += w >> 1) { let q = 0; const b = Math.min(d.length, a + w); for (let i = a; i < b; i++) q += d[i] * d[i]; m = Math.max(m, q / w); }
    for (let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i])); return m > 0 ? scale(d, Math.min(r / Math.sqrt(m), p / pk)) : d; };
  function* noiseLoop(N, X, R, f) {   // N samples of filtered noise (f: x -> y) that loop without a seam: N + X made, the extra X faded into the start
    const h = new Float32Array(N + X);
    for (let i = 0; i < N + X; i++) { h[i] = f(R() * 2 - 1); if ((i & 4095) === 0 && late()) yield; }
    for (let i = 0; i < X; i++) { const w = i / X; h[i] = h[i] * Math.sqrt(w) + h[N + i] * Math.sqrt(1 - w); }
    return h.slice(0, N);
  }
  // the birds' songs, each a list of notes [start s, length s, from Hz, to Hz, loudness, a warble]; a track picks 3-4 of the 5 by its seed
  const SONGS = {
    trill: (r) => { const n = 8 + (r() * 7 | 0), f = 4200 + r() * 1300, o = []; for (let i = 0; i < n; i++) o.push([i * 0.052, 0.036, f * (1 - 0.012 * i), f * (0.86 - 0.012 * i), 0.7 + 0.3 * r()]); return o; },
    whistle: (r) => { const f = 2000 + r() * 1500, o = [[0, 0.26 + r() * 0.1, f, f * (1.12 + r() * 0.1), 0.8], [0.4, 0.3 + r() * 0.08, f * 1.2, f * 0.92, 1]]; if (r() < 0.6) o.push([0.8, 0.22, f * 0.95, f * 1.05, 0.7]); return o; },
    twoTone: (r) => { const a = 3000 + r() * 700, b = a * (0.72 + r() * 0.08), o = []; for (let i = 0, m = 2 + (r() * 2 | 0); i < m; i++) o.push([i * 0.42, 0.15, a, a * 0.98, 0.9], [i * 0.42 + 0.19, 0.16, b, b * 0.97, 0.8]); return o; },
    warble: (r) => { const f = 2500 + r() * 1000, o = []; let t = 0; for (let i = 0, m = 6 + (r() * 4 | 0); i < m; i++) { const d = 0.06 + r() * 0.09; o.push([t, d, f * (0.8 + 0.5 * r()), f * (0.8 + 0.5 * r()), 0.6 + 0.4 * r(), 1]); t += d + 0.012 + r() * 0.03; } return o; },
    chips: (r) => { const o = []; let t = 0; for (let i = 0, m = 3 + (r() * 4 | 0); i < m; i++) { const f = 5000 + r() * 1000; o.push([t, 0.022 + r() * 0.01, f, f * 0.7, 0.6 + 0.4 * r()]); t += 0.08 + r() * 0.12; } return o; },
  };
  function* songGen(notes) {   // (a sine and its second harmonic softly, each note quickly up and slowly down)
    let len = 0; for (const n of notes) len = Math.max(len, n[0] + n[1]);
    const N = Math.ceil((len + 0.02) * SR), d = new Float32Array(N);
    for (const [t0, dur, f0, f1, a, vib] of notes) {
      const i0 = Math.round(t0 * SR), m = Math.max(8, Math.round(dur * SR)); let ph = 0;
      for (let j = 0; j < m && i0 + j < N; j++) { const u = j / m, f = (f0 + (f1 - f0) * u) * (vib ? 1 + 0.06 * Math.sin(2 * Math.PI * 21 * j / SR) : 1), e = u < 0.12 ? u / 0.12 : Math.pow((1 - u) / 0.88, 1.4);
        ph += 2 * Math.PI * f / SR; d[i0 + j] += a * e * (Math.sin(ph) + 0.16 * Math.sin(2 * ph)); }
      if (late()) yield;
    }
    return winTo(d, 0.3, 0.95, 0.1 * SR);
  }
  function* bubbleLoop(sec, perS, f0, f1, hiss, hf, R) {   // a brook's, a river's: bubbles (each a short rising sine) over a hiss; a loop
    const N = Math.round(sec * SR2), d = scale(yield* noiseLoop(N, Math.round(0.1 * SR2), R, biquad('bp', hf, 0.5, SR2)), hiss);
    for (let b = 0, nb = Math.round(sec * perS); b < nb; b++) {
      const at = Math.floor(R() * N), f = f0 * Math.pow(f1 / f0, R()), tau = 0.003 + 3 / f + R() * 0.004, m = Math.round(Math.min(tau * 4, 0.05) * SR2), a = 0.12 + 0.88 * R() * R();
      let ph = 0;
      for (let j = 0; j < m; j++) { ph += 2 * Math.PI * f * (1 + 0.7 * j / m) / SR2; d[(at + j) % N] += a * Math.exp(-j / (tau * SR2)) * Math.sin(ph) * Math.min(1, j / 6); }
      if ((b & 31) === 0 && late()) yield;
    }
    return rmsTo(d, 0.25);
  }
  function* cricketLoop(R) {   // 3-4 crickets, each its pitch and its chirp (3-4 pulses 34 ms apart) every 1/2, 2/3 or 1 s: a loop of 2 s
    const N = 2 * SR, d = new Float32Array(N), per = [0.5, 2 / 3, 1, 0.5], m = Math.round(0.02 * SR);
    for (let c = 0, nc = 3 + (R() < 0.5 ? 1 : 0); c < nc; c++) {
      const p = per[c], f = 4300 + R() * 600, a = 0.35 + 0.65 * R(), np = 3 + (R() < 0.5 ? 1 : 0);
      for (let t = R() * p; t < 2; t += p) for (let q = 0; q < np; q++) { const i0 = Math.round((t + q * 0.034) * SR);
        for (let j = 0; j < m; j++) { const e = Math.sin(Math.PI * j / m); d[(i0 + j) % N] += a * e * e * Math.sin(2 * Math.PI * f * j / SR); } }
      if (late()) yield;
    }
    return rmsTo(d, 0.2);
  }
  function* cicadaLoop(R) {   // a band of noise (5.2-6.2 kHz) buzzing ~170-220 times a second (a whole number in the loop's 2 s); the swells: the mixer's
    const N = 2 * SR, f = 5200 + R() * 1000, b1 = biquad('bp', f, 3, SR), b2 = biquad('bp', f * 1.04, 3, SR), d = yield* noiseLoop(N, Math.round(0.05 * SR), R, x => b2(b1(x)));
    const fm = 170 + (R() * 50 | 0); for (let i = 0; i < N; i++) d[i] *= 0.5 + 0.5 * Math.tanh(4 * Math.sin(2 * Math.PI * fm * i / SR));
    return rmsTo(d, 0.2);
  }
  // a church bell: its partials (the hum, the prime, the minor third, the fifth, the nominal and above: × its tone, loudness, decay s), each
  // beating slowly with a twin 0.2-0.6 Hz above it; the clapper's knock; two echoes off the houses baked in
  const BELL = [[0.5, 0.55, 1.6], [1, 0.5, 1.15], [1.2, 0.42, 0.95], [1.5, 0.22, 0.6], [2, 0.38, 0.55], [2.5, 0.16, 0.35], [2.67, 0.12, 0.3], [3, 0.12, 0.26], [4, 0.08, 0.2]];
  function* bellGen(f, R) {
    const N = Math.round(3.4 * SR2), d = new Float32Array(N);
    for (const [m, a, tau] of BELL) { const w1 = 2 * Math.PI * f * m / SR2, w2 = 2 * Math.PI * (f * m + 0.2 + R() * 0.4) / SR2, k = Math.min(N, Math.round(tau * 7 * SR2));
      for (let i = 0; i < k; i++) { d[i] += a * Math.exp(-i / (tau * SR2)) * (Math.sin(w1 * i) + 0.5 * Math.sin(w2 * i + 1.3)); if ((i & 4095) === 4095 && late()) yield; }
      if (late()) yield; }
    const kn = Math.round(0.012 * SR2); for (let i = 0; i < kn; i++) d[i] += (R() * 2 - 1) * 0.6 * (1 - i / kn);
    const e = d.slice(), e1 = Math.round(0.17 * SR2), e2 = Math.round(0.39 * SR2), fo = Math.round(0.4 * SR2);
    for (let i = 0; i < N; i++) d[i] = e[i] + (i >= e1 ? 0.22 * e[i - e1] : 0) + (i >= e2 ? 0.11 * e[i - e2] : 0);
    for (let i = 0; i < fo; i++) d[N - 1 - i] *= i / fo;
    return peakTo(d, 0.9);
  }
  // a cow's bell (sheet metal: its partials apart, not a church bell's; a short clank and the clapper's knock)
  function* cowbellGen(f, R) {
    const N = Math.round(0.7 * SR2), d = new Float32Array(N);
    for (const [m, a, tau] of [[1, 1, 0.3], [1.48, 0.7, 0.2], [2.1, 0.5, 0.14], [2.69, 0.35, 0.1], [3.42, 0.22, 0.07]]) { if (f * m > 0.45 * SR2) continue;
      const w = 2 * Math.PI * f * m * (1 + (R() - 0.5) * 0.03) / SR2, k = Math.min(N, Math.round(tau * 7 * SR2)); for (let i = 0; i < k; i++) d[i] += a * Math.exp(-i / (tau * SR2)) * Math.sin(w * i);
      if (late()) yield; }
    const kn = Math.round(0.005 * SR2); for (let i = 0; i < kn; i++) d[i] += (R() * 2 - 1) * 0.6 * (1 - i / kn);
    return peakTo(d, 0.6);
  }
  // a voiced call (a cow's moo, a sheep's bleat): its pitch f0(u) over the call (u 0..1), its harmonics through the mouth's two formants
  // f1(u), f2(u), its loudness env(u); q: the sheep's quaver [Hz, depth] (the pitch and the loudness shaking together)
  function* voiced(dur, f0, f1, f2, env, q) {
    const N = Math.round(dur * SR2), d = new Float32Array(N), ph = new Float64Array(N), F0 = new Float32Array(N), A1 = new Float32Array(N), A2 = new Float32Array(N); let p = 0;
    for (let i = 0; i < N; i++) { const u = i / N, f = f0(u) * (q ? 1 + 0.04 * q[1] * Math.sin(2 * Math.PI * q[0] * i / SR2) : 1); p += 2 * Math.PI * f / SR2; ph[i] = p; F0[i] = f; A1[i] = f1(u); A2[i] = f2(u); }
    for (let k = 1; k <= 40; k++) { let any = false;
      for (let i = 0; i < N; i++) { const fk = k * F0[i]; if (fk > 0.45 * SR2) continue; any = true;
        const x1 = (fk - A1[i]) / 170, x2 = (fk - A2[i]) / 280; d[i] += (0.03 + 1 / (1 + x1 * x1) + 0.5 / (1 + x2 * x2)) * Math.sin(k * ph[i]) / Math.sqrt(k); }
      if (!any) break; if (late()) yield; }
    for (let i = 0; i < N; i++) { const u = i / N; d[i] *= env(u) * (q ? 1 - q[1] * (0.5 + 0.5 * Math.sin(2 * Math.PI * q[0] * i / SR2)) : 1); }
    return d;
  }
  function* mooGen(R) {   // (~1.2-1.7 s: up and down, the mouth closed, open, closing: mm-oo-oh)
    const fb = 100 + 30 * R(), g = yield* voiced(1.2 + 0.5 * R(), u => fb * (1 + 0.22 * Math.sin(Math.PI * Math.min(1, 1.25 * u)) - 0.12 * u), u => 260 + 420 * sstep(0.08, 0.45, u) - 120 * sstep(0.7, 1, u),
      u => 850 + 150 * sstep(0.08, 0.45, u), u => sstep(0, 0.15, u) * (1 - sstep(0.72, 1, u)), null);
    return peakTo(g, 0.65);
  }
  function* baaGen(R) {   // (~0.6-0.85 s: baa-aa-aa, its quaver ~17-20 times a second)
    const fb = 270 + 60 * R(), g = yield* voiced(0.6 + 0.25 * R(), u => fb * (1 + 0.05 * sstep(0, 0.2, u) - 0.08 * u), u => 650 + 250 * sstep(0.05, 0.25, u), () => 1500,
      u => sstep(0, 0.06, u) * (1 - sstep(0.6, 1, u)), [17 + 3 * R(), 0.55]);
    return peakTo(g, 0.8);
  }
  // a pigeon's coo: soft low notes [start s, length s, from, to (× its pitch), rolled], a sine and its 2nd and 3rd faintly; the long middle
  // one of the town's pigeon rolled (rrroo: its loudness at ~28 Hz)
  const COOS = [[[0, 0.26, 1, 0.95, 0], [0.36, 0.56, 1.06, 0.82, 1], [1.02, 0.24, 0.9, 0.86, 0]],   // (in the streets: oo-rroo-oo)
    [[0, 0.22, 1, 0.97, 0], [0.34, 0.42, 1.08, 0.94, 0], [0.86, 0.22, 1, 0.96, 0], [1.22, 0.22, 1, 0.95, 0], [1.56, 0.28, 0.98, 0.9, 0]]];   // (in a park: coo-COO-coo, coo-coo)
  function* cooGen(notes, f) {
    let len = 0; for (const n of notes) len = Math.max(len, n[0] + n[1]);
    const N = Math.ceil((len + 0.05) * SR2), d = new Float32Array(N);
    for (const [t0, dur, a, b, roll] of notes) { const i0 = Math.round(t0 * SR2), m = Math.round(dur * SR2); let ph = 0;
      for (let j = 0; j < m && i0 + j < N; j++) { const u = j / m, e = sstep(0, 0.3, u) * (1 - sstep(0.6, 1, u)) * (roll ? 1 - 0.7 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 28 * j / SR2)) : 1);
        ph += 2 * Math.PI * f * (a + (b - a) * u) / SR2; d[i0 + j] += e * (Math.sin(ph) + 0.25 * Math.sin(2 * ph) + 0.08 * Math.sin(3 * ph)); }
      if (late()) yield; }
    return peakTo(d, 0.9);
  }

  /* ---------------- the mixer ---------------- */
  // Per update (10 a second, 5 on the battery saver; a param only when it moves more than 1 %): the zones where the car is (between two
  // samples), the beds' levels (the 3 loudest play: a bed under -60 dB for 2 s is stopped and let go), the master (× the setting: Tiho 0.5, Normalno 1, Glasno 2;
  // under the speed, the crowds, in a tunnel), the calls (birds, gulls, a peal of bells; not on the battery saver; <= 25 nodes in all)
  const BASE = 0.09, MAXN = 25, PREP_GRID = 1.5, PREP_RACE = 0.75;   // (prep: on the grid; a slow phone's rest after the start)
  // each bed at a full zone (with the water's KG at its nearest: ~24 dB under a car's engine at mid revs on Tiho, tuned with probe); the
  // one-shots at their nearest and loudest (up to ~18 dB under it)
  const BG = { rustle: 0.37, brook: 0.52, river: 0.5, fall: 0.32, lake: 2.6, sea: 0.58, wind: 1.17, crickets: 0.5, cicadas: 0.55, traffic: 1 };
  const SP = { bird: 0.73, gull: 0.85, bell: 0.65, herd: 0.8, coo: 0.28 };
  const TC = { rustle: 0.7, wind: 0.7, cicadas: 1, traffic: 0.8 }, BUFB = new Set(['brook', 'river', 'crickets', 'cicadas']);
  const TOD_B = { dawn: 1.4, day: 1, dusk: 0.4, night: 0 }, SEASON_B = { summer: 1, autumn: 0.5, winter: 0.15 };
  // (a peal's chance by a church, the seconds between two; the announcer's and the shouts' least seconds apart, their chance a second by
  // the stands; a pigeon's chance a second in a town; the birds' rate (× the forest's); all: every voice made, whatever the track has (the
  // tests and the tuning: the sheep no real track has now); the tests set them)
  const opts = { bellP: 0.6, bellGap: 180, paGap: 75, paP: 0.25, shoutGap: 25, shoutP: 0.4, cooP: 0.12, birdP: 1, all: false };
  const S = { lvl: 1, sound: true, saver: () => false };
  let A = null;   // (the sounds now, of one audio context; null: nothing made)
  const N0 = () => ({ birds: 0, bells: 0, gulls: 0, coos: 0, herds: 0, strikes: 0, moos: 0, bleats: 0 });   // (how many of each so far: the tests)
  const atmosOf = () => (typeof Render !== 'undefined' && Render.atmos) || { season: 'summer', tod: 'day' };
  const climate = (Z) => { const lat = Math.abs(Z.clim.lat), alt = Z.clim.alt; return { cr: sstep(64, 50, lat) * (1 - sstep(1800, 2600, alt)), ci: sstep(47, 38, lat) * (1 - sstep(800, 1600, alt)) }; };
  function tgt(p, v, o, key, tc, at) {   // (a param to v, only when it moves more than 1 %)
    const c = o[key]; if (!Number.isFinite(v) || (c !== undefined && Math.abs(v - c) <= 0.01 * Math.max(Math.abs(v), Math.abs(c)) + 1e-5)) return;
    o[key] = v; p.setTargetAtTime(v, at == null ? A.ctx.currentTime : at, tc);
  }
  const drop = (n) => { try { if (n.stop) n.stop(); } catch (_) { } try { n.disconnect(); } catch (_) { } };
  // (a param that only moves slowly: worked out once per block of 128 samples, not at each one, less work for the sound's own thread)
  const kr = (p) => { try { p.automationRate = 'k-rate'; } catch (_) { } return p; };
  function begin(ctx, bus) {
    A = { ctx, bus, out: ctx.createGain(), o: null, key: '', Z: null, gen: null, err: null, buf: {}, songs: [], bells: null, bytes: 0, beds: {}, spots: [], peal: null, herd: null, cowb: null, coos: null, noise: null, nodes: 1, tg: {}, mlev: 0,
      tU: 0, tL: 0, k: -1, lastS: null, tBell: -1e9, R: Math.random, n: N0(), prep: { slices: 0, ms: 0, max: 0, at: '', top: [] } };
    kr(A.out.gain); A.out.gain.value = 0; A.out.connect(bus);
  }
  function needs(Z, at) {
    if (opts.all) return { birds: true, brook: true, river: true, bells: true, crickets: true, cicadas: true, cows: true, sheep: true, coos: true };
    let F = 0; const kinds = new Set();
    for (let k = 0; k < Z.n; k++) { F = Math.max(F, Z.fL[k], Z.fR[k]); if (Z.wL[k] > 0.02) kinds.add(Z.kL[k]); if (Z.wR[k] > 0.02) kinds.add(Z.kR[k]); }
    const cl = climate(Z), summer = at.season === 'summer';
    return { birds: F > 0.1 && (TOD_B[at.tod] ?? 1) > 0, brook: kinds.has(BROOK), river: kinds.has(RIVER), bells: Z.ring.length > 0 && at.tod !== 'night',
      crickets: summer && cl.cr > 0.05 && at.tod !== 'day', cicadas: summer && cl.ci > 0.05 && at.tod === 'day',
      cows: Z.herds.some(h => h[3] === 'cow'), sheep: Z.herds.some(h => h[3] === 'sheep'), coos: Z.city && at.tod !== 'night' };
  }
  function* prepGen(o, T, at) {   // the zones (once per world), then the voices the race needs
    let Z = cache.get(o); if (!Z) { Z = yield* zonesGen(o, T, false); cache.set(o, Z); }
    stage = 'voices'; yield;
    const c = A.ctx, R = rngOf(hashOf(T.def.id) ^ 0x5bd1e995), need = needs(Z, at);
    const mk = (d, rate) => { const b = c.createBuffer(1, d.length, rate); if (b.copyToChannel) b.copyToChannel(d, 0); else b.getChannelData(0).set(d); A.bytes += d.length * 4; return b; };
    const nz = new Float32Array(2 * SR); for (let i = 0; i < nz.length; i++) nz[i] = R() * 2 - 1;
    A.buf.noise = mk(nz, SR); yield;
    if (need.birds) { const all = Object.keys(SONGS), pick = [], m = 3 + (R() < 0.5 ? 1 : 0); while (pick.length < m) { const k = all[R() * all.length | 0]; if (!pick.includes(k)) pick.push(k); }
      for (const k of pick) A.songs.push(mk(yield* songGen(SONGS[k](R)), SR)); }
    if (need.brook) A.buf.brook = mk(yield* bubbleLoop(3, 75, 450, 2600, 0.35, 2000, R), SR2);
    if (need.river) A.buf.river = mk(yield* bubbleLoop(3, 160, 220, 1100, 0.7, 650, R), SR2);
    if (need.crickets) A.buf.crickets = mk(yield* cricketLoop(R), SR);
    if (need.cicadas) A.buf.cicadas = mk(yield* cicadaLoop(R), SR);
    if (need.bells) A.bells = [mk(yield* bellGen(392, R), SR2), mk(yield* bellGen(330, R), SR2)];
    if (need.cows) { A.cowb = []; for (const f of [480, 600, 730]) A.cowb.push(mk(yield* cowbellGen(f * (0.95 + 0.1 * R()), R), SR2)); A.buf.moo = mk(yield* mooGen(R), SR2); }
    if (need.sheep) A.buf.baa = mk(yield* baaGen(R), SR2);
    if (need.coos) { A.coos = []; for (const n of COOS) A.coos.push(mk(yield* cooGen(n, 380 + 80 * R()), SR2)); }
    A.Z = Z;
  }
  function noiseOn() { if (!A.noise) { const s = A.ctx.createBufferSource(); s.buffer = A.buf.noise; s.loop = true; s.start(); A.noise = { src: s, users: 0 }; A.nodes++; } A.noise.users++; return A.noise.src; }
  function noiseOff() { if (A.noise && --A.noise.users <= 0) { drop(A.noise.src); A.noise = null; A.nodes--; } }
  function bedOn(name) {
    const c = A.ctx, out = c.createGain(), pan = c.createStereoPanner ? c.createStereoPanner() : null, B = { name, out, pan, nodes: [out], cur: 0, pn: 0, quiet: 0, noise: false, p: { next: 0, g: 0.5, st: 3 } };
    kr(out.gain).value = 0; if (pan) { kr(pan.pan); B.nodes.push(pan); out.connect(pan); pan.connect(A.out); } else out.connect(A.out);
    const flt = (type, f, q) => { const n = c.createBiquadFilter(); n.type = type; kr(n.frequency).value = f; n.Q.value = q; B.nodes.push(n); return n; };
    const gn = (v) => { const g = c.createGain(); kr(g.gain).value = v; B.nodes.push(g); return g; };
    const nz = () => { if (!B.noise) { B.noise = true; noiseOn(); } return A.noise.src; };
    if (BUFB.has(name)) { const s = c.createBufferSource(); s.buffer = A.buf[name]; s.loop = true; s.connect(out); s.start(c.currentTime, A.R() * s.buffer.duration); B.nodes.push(s); }
    else if (name === 'rustle') { const f = flt('bandpass', 2600, 0.55); nz().connect(f); f.connect(out); }
    else if (name === 'fall') { const a = flt('lowpass', 2300, 0.4), b = flt('lowpass', 240, 1.6); nz().connect(a); nz().connect(b); a.connect(out); b.connect(out); }
    else if (name === 'lake') { const f = flt('lowpass', 520, 0.6), e = gn(0.2); nz().connect(f); f.connect(e); e.connect(out); B.p.env = e; }
    else if (name === 'sea') { const f = flt('lowpass', 450, 0.5), e = gn(0.3); nz().connect(f); f.connect(e); e.connect(out); B.p.env = e; B.p.flt = f; }
    else if (name === 'wind') { const a = flt('lowpass', 420, 0.5), b = flt('bandpass', 800, 6), g = gn(0); nz().connect(a); nz().connect(b); b.connect(g); a.connect(out); g.connect(out); B.p.wg = g; B.p.bp = b; }
    else if (name === 'traffic') { const a = flt('lowpass', 240, 0.6), b = flt('bandpass', 750, 0.9), g = gn(0.12); nz().connect(a); nz().connect(b); b.connect(g); a.connect(out); g.connect(out); B.p.tg = g; B.p.bp = b; }   // (a town's far rumble, a car passing far now and then)
    A.nodes += B.nodes.length; A.beds[name] = B; return B;
  }
  function bedOff(B) { for (const n of B.nodes) drop(n); A.nodes -= B.nodes.length; if (B.noise) noiseOff(); delete A.beds[B.name]; }
  function bedTick(B, v, pan, now) {   // a bed's level v (and its own life: the gusts, the laps, the waves, the swells)
    const p = B.p, R = A.R, c = now;
    if (B.name === 'rustle') { if (c > p.next) { p.g = 0.25 + 0.75 * R(); p.next = c + 1.5 + 2.5 * R(); } v *= p.g; }
    else if (B.name === 'wind') { if (c > p.next) { p.g = 0.15 + 0.85 * R() * R(); p.next = c + 1 + 3 * R(); p.bp.frequency.setTargetAtTime(550 + 700 * p.g + 120 * R(), c, 0.9); }
      tgt(p.wg.gain, v * p.g * p.g * 0.9, p, 'wv', 0.7, c); v *= 0.4 + 0.6 * p.g; }
    else if (B.name === 'lake') { if (c > p.next) { const e = p.env.gain; e.setTargetAtTime(0.45 + 0.55 * R(), c, 0.06); e.setTargetAtTime(0.15, c + 0.18, 0.4); p.next = c + 1.2 + 1.6 * R(); } }
    else if (B.name === 'sea') { if (c > p.next) { const e = p.env.gain, f = p.flt.frequency, t = c + 2.2 + 0.6 * R();   // (a wave: it rises, breaks with a hiss, washes back)
      e.setTargetAtTime(0.85, c, 0.8); f.setTargetAtTime(800, c, 0.8); e.setTargetAtTime(1.3, t, 0.05); f.setTargetAtTime(2600, t, 0.05); e.setTargetAtTime(0.28, t + 0.3, 1.1); f.setTargetAtTime(420, t + 0.3, 1.1); p.next = c + 7 + 4 * R(); } }
    else if (B.name === 'traffic') { if (c > p.next) { const up = 1.2 + R(); p.tg.gain.setTargetAtTime(0.3 + 0.7 * R(), c, up / 3); p.bp.frequency.setTargetAtTime(850 + 200 * R(), c, 0.3);
      p.tg.gain.setTargetAtTime(0.12, c + up, 0.8); p.bp.frequency.setTargetAtTime(560, c + up, 0.8); p.next = c + up + 1 + 4 * R(); } }
    else if (B.name === 'cicadas') { if (c > p.next) { p.st = (p.st + 1) % 4; p.next = c + [2.5 + R(), 3 + 3 * R(), 2, 2 + 3 * R()][p.st]; } v *= p.st < 2 ? 1 : 0; }
    tgt(B.out.gain, v, B, 'cur', TC[B.name] || 0.3, c);
    if (B.pan && Math.abs(pan - B.pn) > 0.01) { B.pn = pan; B.pan.pan.setTargetAtTime(pan, c, 0.3); }
  }
  function spotChain(lp) {   // (a call's way out: its distance's low-pass, its gain, its side)
    const c = A.ctx, f = c.createBiquadFilter(), g = c.createGain(), pn = c.createStereoPanner ? c.createStereoPanner() : null;
    f.type = 'lowpass'; kr(f.frequency).value = lp; kr(g.gain); f.connect(g); if (pn) { kr(pn.pan); g.connect(pn); pn.connect(A.out); } else g.connect(A.out);
    return { f, g, pn, nodes: [f, g].concat(pn ? [pn] : []) };
  }
  function spotEnd(sp) { if (!A) return; const i = A.spots.indexOf(sp); if (i < 0) return; A.spots.splice(i, 1); for (const n of sp.nodes) drop(n); A.nodes -= sp.nodes.length; }
  function bird(fl, fr, cs, now) {   // a bird 12-57 m off the road, on the side with more trees
    if (!A.songs.length || A.nodes + 4 > MAXN) return;
    const R = A.R, side = R() * (fl + fr) < fr ? 1 : -1, d = 12 + 45 * R() * R(), ch = spotChain(Math.max(1800, 12000 - 110 * d)), s = A.ctx.createBufferSource();
    s.buffer = A.songs[R() * A.songs.length | 0]; s.playbackRate.value = 0.92 + 0.16 * R(); ch.g.gain.value = SP.bird * Math.min(1, Math.pow(14 / d, 0.9)) * (1 - 0.4 * R());
    if (ch.pn) ch.pn.pan.value = clamp(side * cs * (0.45 + 0.4 * R()), -0.9, 0.9);
    const sp = { nodes: [s].concat(ch.nodes) }; s.connect(ch.f); s.onended = () => spotEnd(sp); s.start(now + 0.01);
    A.spots.push(sp); A.nodes += sp.nodes.length; A.n.birds++;
  }
  function gulls(side, now) {   // 2-4 calls of a gull 25-90 m away (a sawtooth through a band-pass, up and down)
    if (A.nodes + 4 > MAXN) return;
    const c = A.ctx, R = A.R, o = c.createOscillator(), b = c.createBiquadFilter(), g = c.createGain(), pn = c.createStereoPanner ? c.createStereoPanner() : null, d = 25 + 65 * R(), a = SP.gull * Math.min(1, Math.pow(20 / d, 0.9));
    o.type = 'sawtooth'; b.type = 'bandpass'; b.frequency.value = 2300; b.Q.value = 1.4; g.gain.value = 0; o.connect(b); b.connect(g);
    if (pn) { pn.pan.value = clamp(side * (0.3 + 0.5 * R()), -0.9, 0.9); g.connect(pn); pn.connect(A.out); } else g.connect(A.out);
    let t = now + 0.02; const f0 = 950 + 250 * R();
    for (let i = 0, m = 2 + (R() * 3 | 0); i < m; i++) { const dur = 0.22 + 0.14 * R();
      o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f0 * 1.55, t + 0.05); o.frequency.exponentialRampToValueAtTime(f0 * 0.85, t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 0.02); g.gain.setTargetAtTime(0, t + dur * 0.7, 0.04); t += dur + 0.12 + 0.3 * R(); }
    const sp = { nodes: [o, b, g].concat(pn ? [pn] : []) }; o.onended = () => spotEnd(sp); o.start(now); o.stop(t + 0.3);
    A.spots.push(sp); A.nodes += sp.nodes.length; A.n.gulls++;
  }
  function ring(r, now) {   // a peal (8-12 strikes, the two bells in turn, ~1 s apart) from the church r: [trigger, at, side, off the road]
    if (!A.bells || A.peal || A.nodes + 4 > MAXN) return;
    const ch = spotChain(6000); A.nodes += ch.nodes.length; A.tBell = now; A.n.bells++;
    A.peal = { at: r[1], side: r[2], off: r[3], ch, left: 8 + (A.R() * 5 | 0), next: now + 0.05, live: [], i: 0 };
  }
  function pealTick(P, s, cs, now) {   // (the church where it is now from the car: the gain, the low-pass, the side; the next strikes)
    const Z = A.Z; let al = P.at - s; if (!Z.open) al = ((al % Z.len) + Z.len * 1.5) % Z.len - Z.len / 2;
    const d = Math.max(1, Math.sqrt(al * al + P.off * P.off)), gv = SP.bell * Math.min(1, Math.pow(80 / d, 0.9)), fv = Math.max(1500, 9000 - 12 * d);
    if (P.g == null) { P.g = gv; P.f = fv; P.ch.g.gain.value = gv; P.ch.f.frequency.value = fv; }   // (the first strike already at its level)
    else { tgt(P.ch.g.gain, gv, P, 'g', 0.3); tgt(P.ch.f.frequency, fv, P, 'f', 0.3); }
    if (P.ch.pn) { const pn = clamp(P.side * cs * (0.2 + 0.7 * P.off / d), -0.9, 0.9); if (Math.abs(pn - (P.pn || 0)) > 0.01) { P.pn = pn; P.ch.pn.pan.setTargetAtTime(pn, now, 0.3); } }
    while (P.left > 0 && P.next < now + 0.3 && P.live.length < 4 && A.nodes < MAXN) {
      const b = A.ctx.createBufferSource(); b.buffer = A.bells[P.i++ & 1]; b.playbackRate.value = 1 + (A.R() - 0.5) * 0.004; b.connect(P.ch.f);
      b.onended = () => { const i = P.live.indexOf(b); if (i < 0) return; P.live.splice(i, 1); drop(b); if (A && A.peal === P) A.nodes--; };
      b.start(Math.max(now, P.next)); P.live.push(b); A.nodes++; P.left--; P.next += 0.95 + 0.25 * A.R();
    }
    if (P.left <= 0 && !P.live.length) { for (const n of P.ch.nodes) drop(n); A.nodes -= P.ch.nodes.length; A.peal = null; }
  }
  // the herd nearest the car within 170 m (along the road and off it): the cows' bells in little bursts (a cow lifts her head), now and
  // then a moo; the sheep's bleats. One way out for the herd (its distance's low-pass, its gain, its side); quiet: nothing new, the last
  // ones ring out
  function herdTick(Z, s, cs, now, quiet) {
    const wrap = (al) => Z.open ? al : ((al % Z.len) + Z.len * 1.5) % Z.len - Z.len / 2;
    let best = null, bd = 170;
    if (!quiet) for (const h of Z.herds) { const al = wrap(h[0] - s), d = Math.sqrt(al * al + h[2] * h[2]); if (d < bd) { bd = d; best = h; } }
    let H = A.herd;
    if (H && H.h !== best) H.left = true;
    if (H && H.left && !H.live.length) { for (const n of H.ch.nodes) drop(n); A.nodes -= H.ch.nodes.length; A.herd = H = null; }
    if (!H && best) { if (A.nodes + 4 > MAXN) return; const ch = spotChain(5000); A.nodes += ch.nodes.length; A.n.herds++;
      A.herd = H = { h: best, ch, live: [], next: now + 0.3 + A.R(), call: now + 2 + 8 * A.R(), burst: 0, g: null, left: false }; }
    if (!H) return;
    const h = H.h, al = wrap(h[0] - s), d = Math.max(1, Math.sqrt(al * al + h[2] * h[2])), gv = SP.herd * Math.min(1, Math.pow(20 / d, 0.9)), fv = Math.max(1200, 8000 - 25 * d);
    if (H.g == null) { H.g = gv; H.f = fv; H.ch.g.gain.value = gv; H.ch.f.frequency.value = fv; } else { tgt(H.ch.g.gain, gv, H, 'g', 0.3); tgt(H.ch.f.frequency, fv, H, 'f', 0.3); }
    if (H.ch.pn) { const pn = clamp(h[1] * cs * (0.2 + 0.7 * h[2] / d), -0.9, 0.9); if (Math.abs(pn - (H.pn || 0)) > 0.01) { H.pn = pn; H.ch.pn.pan.setTargetAtTime(pn, now, 0.3); } }
    if (H.left) return;
    const R = A.R, cow = h[3] === 'cow', play = (buf, at, rate) => { const b = A.ctx.createBufferSource(); b.buffer = buf; b.playbackRate.value = rate; b.connect(H.ch.f);
      b.onended = () => { const i = H.live.indexOf(b); if (i < 0) return; H.live.splice(i, 1); drop(b); if (A && A.herd === H) A.nodes--; };
      b.start(Math.max(now, at)); H.live.push(b); A.nodes++; };
    if (H.next < now) H.next = now + 0.02;
    while (cow && A.cowb && H.next < now + 0.3 && H.live.length < 3 && A.nodes < MAXN) {
      play(A.cowb[R() * A.cowb.length | 0], H.next, 0.97 + 0.06 * R()); A.n.strikes++;
      if (H.burst > 0) { H.burst--; H.next += 0.12 + 0.18 * R(); } else { H.burst = R() < 0.5 ? 0 : 1 + (R() * 2 | 0); H.next += 0.35 + 1.8 * R(); }
    }
    if (now > H.call && H.live.length < 3 && A.nodes < MAXN) { const b = cow ? A.buf.moo : A.buf.baa;
      if (b) { play(b, now + 0.05, cow ? 0.92 + 0.16 * R() : 0.9 + 0.2 * R()); if (cow) A.n.moos++; else A.n.bleats++; }
      H.call = now + (cow ? 12 + 22 * R() : 1.5 + 3.5 * R()); }
  }
  function coo(cs, now) {   // a pigeon 5-35 m off the road, either side
    if (!A.coos || !A.coos.length || A.nodes + 4 > MAXN) return;
    const R = A.R, side = R() < 0.5 ? -1 : 1, d = 5 + 30 * R() * R(), ch = spotChain(Math.max(1500, 6000 - 80 * d)), s = A.ctx.createBufferSource();
    s.buffer = A.coos[R() * A.coos.length | 0]; s.playbackRate.value = 0.94 + 0.12 * R(); ch.g.gain.value = SP.coo * Math.min(1, Math.pow(8 / d, 0.9)) * (1 - 0.4 * R());
    if (ch.pn) ch.pn.pan.value = clamp(side * cs * (0.3 + 0.5 * R()), -0.9, 0.9);
    const sp = { nodes: [s].concat(ch.nodes) }; s.connect(ch.f); s.onended = () => spotEnd(sp); s.start(now + 0.01);
    A.spots.push(sp); A.nodes += sp.nodes.length; A.n.coos++;
  }
  /* the announcer and the people's shouts (a circuit with its stands, Z.pa): the browser's speech in English as the commentator's, quiet;
     only once the commentator (and the co-driver) has been silent 3 s, and the commentator cuts it off: js/comm.js calls hush() before each of
     its lines. Generic notices of a circuit, no names (CLAUDE.md, Pravna varnost) */
  const PA_LINES = ['Ladies and gentlemen, please stay behind the fences at all times.', 'Spectators are reminded to keep the gangways clear.',
    'Lost children can be collected from the information point behind the main grandstand.', 'Food and drinks are available behind the grandstands.',
    'Please do not climb the fences or the catch nets.', 'Will the owner of a blue estate car in the east car park please return to the vehicle.',
    'First aid is available at the medical centre next to the paddock.', 'The next session will begin in thirty minutes.', 'Please take your litter home with you. Thank you.'];
  const PA_END = ['The chequered flag is out. Thank you for joining us today.', 'That is the end of the race. Please drive home safely.',
    'The race is over. Please stay in your seats until the cars have returned to the pit lane.'];
  const SHOUTS = ['Go on!', 'Come on!', 'Go, go, go!', 'Yes!', 'Faster!', 'Woo!', "Let's go!", 'Brilliant!', 'Push!', 'Look at that!'];
  const SPK = { u: null, until: 0, kind: '', quiet: -1e9, held: false, tPA: -1e9, tSh: -1e9, fin: false, race: null, nPA: 0, nSh: 0, last: '', cut: 0 };
  const wall = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) / 1000;   // (seconds as the browser speaks, not the sound's clock)
  const synthOf = () => (typeof window !== 'undefined' && window.speechSynthesis) || null;
  function voiceFor(kind) {   // (an English voice other than the commentator's and the co-driver's, where there is one; the announcer's a woman's if any)
    let V = []; try { V = synthOf().getVoices() || []; } catch (_) { }
    const ci = typeof Comm !== 'undefined' && Comm.voiceInfo ? Comm.voiceInfo() : {}, en = V.filter(v => /^en([-_]|$)/i.test(v.lang || '')), other = en.filter(v => v.name !== ci.name && v.name !== ci.codrv), pool = other.length ? other : en;
    if (!pool.length) return null;
    if (kind === 'pa') return pool.find(v => /female|woman|zira|susan|hazel|libby|sonia|karen|moira|tessa|samantha|serena|kate/i.test(v.name)) || pool[0];
    return pool[A.R() * pool.length | 0];
  }
  function speak(text, kind, vol, rate, pitch, now) {   // (until: a line whose end the browser never reports let go after a while)
    const sy = synthOf(); if (!sy || typeof SpeechSynthesisUtterance === 'undefined') return false;
    try { const u = new SpeechSynthesisUtterance(text), v = voiceFor(kind); if (v) u.voice = v; u.lang = v ? v.lang : 'en-GB'; u.volume = vol; u.rate = rate; u.pitch = pitch;
      u.onend = u.onerror = () => { if (SPK.u === u) SPK.u = null; };
      SPK.u = u; SPK.until = now + 3 + 0.12 * text.length / rate; SPK.kind = kind; SPK.last = text; sy.speak(u); return true; } catch (_) { SPK.u = null; return false; }
  }
  // js/comm.js before each of its lines (the commentator's, the co-driver's): ours stops, and he has spoken (a line begun and ended between
  // two frames, the frames slow, still counts: the breath after it from the first frame he is quiet)
  function hush() { SPK.held = true; if (!SPK.u) return; SPK.u = null; SPK.cut++; const sy = synthOf(); if (sy) { try { sy.cancel(); } catch (_) { } } }
  const pick = (L) => { let t = L[A.R() * L.length | 0]; if (t === SPK.last) t = L[(L.indexOf(t) + 1) % L.length]; return t; };
  function speechTick(race, player, lv, kmh, dt) {
    if (!A.Z.pa || typeof Comm === 'undefined' || !Comm.state || !synthOf() || Comm.radioMode) return;
    const now = wall();
    if (SPK.race !== race) { SPK.race = race; SPK.fin = false; SPK.tPA = SPK.tSh = now - 20; }   // (a new race: not at once)
    const cs = Comm.state();
    if (cs.busy || cs.queued >= 0 || (Comm.talking && Comm.talking())) { SPK.held = true; return; }   // (the commentator's turn)
    if (SPK.held) { SPK.held = false; SPK.quiet = now; }   // (and a breath after it, from the first frame he is quiet: however slow the frames)
    if (SPK.u && now > SPK.until) SPK.u = null;
    if (SPK.u || now - SPK.quiet < 3) return;
    const R = A.R, vol = 0.3 * S.lvl * (1 - 0.4 * sstep(30, 160, kmh)), st = lv.stands || 0;
    if (player.finished) { if (!SPK.fin && speak(pick(PA_END), 'pa', vol, 0.95, 1, now)) { SPK.fin = true; SPK.tPA = now; SPK.nPA++; } return; }
    if (race.state !== 'racing') return;
    if (st > 0.2 && now - SPK.tPA > opts.paGap && R() < opts.paP * dt) { if (speak(pick(PA_LINES), 'pa', vol, 0.95, 1, now)) { SPK.tPA = now; SPK.nPA++; } }
    else if (st > 0.45 && now - SPK.tSh > opts.shoutGap && R() < opts.shoutP * dt) { if (speak(pick(SHOUTS), 'shout', vol * 0.9, 1.1 + 0.3 * R(), 1.1 + 0.5 * R(), now)) { SPK.tSh = now; SPK.nSh++; } }
  }
  function crossed(Z, a, b, x) {   // (has the car gone past x, from a to b, forward and not by a jump?)
    if (Z.open) return a < x && b >= x && b - a < 150;
    const h = Z.len / 2, w = (v) => ((v % Z.len) + Z.len + h) % Z.len - h, da = w(a - x), db = w(b - x);
    return da < 0 && db >= 0 && db - da < 150;
  }
  function mix(race, player, cam, lv, s, now) {
    const Z = A.Z, T = race.track, def = T.def, at = atmosOf(), tod = at.tod, rain = clamp(race.rain || 0, 0, 1), win = at.season === 'winter', sum = at.season === 'summer', n = Z.n;
    let u = s / ZDS - 0.5, k0 = Math.floor(u), k1; const f = u - k0;
    if (Z.open) { k1 = clamp(k0 + 1, 0, n - 1); k0 = clamp(k0, 0, n - 1); } else { k0 = ((k0 % n) + n) % n; k1 = (k0 + 1) % n; }
    const L = (X) => X[k0] + (X[k1] - X[k0]) * f, fl = L(Z.fL), fr = L(Z.fR), F = Math.max(fl, fr); A.k = f < 0.5 ? k0 : k1;
    let cs = 1;   // (the camera's right against the road's right: the sides as heard)
    if (cam && cam.matrixWorld && T.nx) { const e = cam.matrixWorld.elements, i = T.idx(s); cs = clamp((e[0] * T.nx[i] + e[2] * T.nz[i]) * 1.5, -1, 1); }
    const pan2 = (l, r) => clamp((r - l) / (r + l + 1e-6) * 0.6 * cs, -0.8, 0.8);
    const kmh = Math.abs(player.speed || 0) * 3.6, G = BASE * S.lvl * (1 - 0.6 * sstep(30, 160, kmh)) * (1 - 0.8 * clamp(Math.max(lv.stands || 0, lv.crowd || 0), 0, 1)) * (1 - clamp((lv.tunnel || 0) / 0.85, 0, 1));
    tgt(A.out.gain, G, A, 'mlev', 0.25); A.kmh = kmh;
    const WL = [0, 0, 0, 0, 0, 0], WR = [0, 0, 0, 0, 0, 0], W = [0, 0, 0, 0, 0, 0];
    WL[Z.kL[k0]] += Z.wL[k0] * (1 - f); WL[Z.kL[k1]] += Z.wL[k1] * f; WR[Z.kR[k0]] += Z.wR[k0] * (1 - f); WR[Z.kR[k1]] += Z.wR[k1] * f;
    for (let j = 1; j <= 5; j++) W[j] = Math.max(WL[j], WR[j]);
    const cl = climate(Z), tg = A.tg;
    tg.rustle = F * (win ? 0.5 : 1); tg.brook = W[BROOK]; tg.river = W[RIVER]; tg.fall = W[FALL]; tg.lake = W[LAKE]; tg.sea = Math.max(W[SEAK], def.sea ? 0.3 : 0);
    tg.wind = lv.pikes ? 0 : Math.min(1.2, L(Z.wind) * (win ? 1.4 : 1));   // (Pikes Peak: its own, js/sfx.js atmo)
    tg.crickets = sum && A.buf.crickets ? cl.cr * (tod === 'night' || tod === 'dusk' ? 1 : tod === 'dawn' ? 0.3 : 0) * (1 - rain) * (0.6 + 0.4 * F) : 0;
    tg.cicadas = sum && A.buf.cicadas && tod === 'day' ? cl.ci * (1 - rain) * (0.3 + 0.7 * F) : 0;
    tg.traffic = Z.city ? (tod === 'night' ? 0.55 : tod === 'dawn' ? 0.75 : 1) * (1 - 0.3 * F) : 0;   // (a town: quieter at night, among trees)
    const lev = (b) => tg[b] * BG[b] * (A.beds[b] ? 1.25 : 1);   // (one that plays keeps its place a little longer)
    const top = Object.keys(tg).filter(b => tg[b] * BG[b] > 0.004 && (!BUFB.has(b) || A.buf[b])).sort((a, b) => lev(b) - lev(a)).slice(0, 3);
    if (G > 1e-4) for (const b of top) if (!A.beds[b]) bedOn(b);
    const pans = { rustle: pan2(fl, fr), brook: pan2(WL[1], WR[1]), river: pan2(WL[2], WR[2]), fall: pan2(WL[3], WR[3]), lake: pan2(WL[4], WR[4]), sea: pan2(WL[5], WR[5]), wind: 0, crickets: 0.4 * pan2(fl, fr), cicadas: 0.5 * pan2(fl, fr), traffic: 0 };
    const dt = clamp(now - (A.tL || now), 0, 0.5); A.tL = now;
    for (const b in A.beds) { const B = A.beds[b], v = top.includes(b) ? tg[b] * BG[b] : 0; bedTick(B, v, pans[b], now);
      if (v * G < 1e-3) { B.quiet += dt; if (B.quiet > 2) bedOff(B); } else B.quiet = 0; }
    // the bells: past a church's trigger (not at night, now and then; not with the battery saver)
    const sv = S.saver();
    if (A.lastS != null && A.bells && !sv && lv.run) for (const r of Z.ring) if (crossed(Z, A.lastS, s, r[0]) && now - A.tBell > opts.bellGap && A.R() < opts.bellP) ring(r, now);
    A.lastS = s;
    if (A.peal) pealTick(A.peal, s, cs, now);
    if (A.herd || (Z.herds.length && (A.cowb || A.buf.baa))) herdTick(Z, s, cs, now, sv || !lv.run || G < 1e-3);
    A.run = !!lv.run;
    if (sv || !lv.run || G < 1e-3) return;   // (the battery saver: the beds only)
    const bl = Math.sqrt(F) * (TOD_B[tod] ?? 1) * (SEASON_B[at.season] ?? 1) * (1 - sstep(0.05, 0.3, rain));
    if (bl > 0 && A.R() < opts.birdP * 0.5 * bl * dt) bird(fl, fr, cs, now);
    if (tg.sea > 0.15 && tod !== 'night' && rain < 0.1 && A.R() < 0.1 * tg.sea * dt) gulls(WR[5] >= WL[5] ? cs : -cs, now);
    if (A.coos && tod !== 'night' && rain < 0.1 && A.R() < opts.cooP * dt) coo(cs, now);
    speechTick(race, player, lv, kmh, dt);
  }
  function stopAll() {   // (every node let go; the zones and the voices kept)
    if (!A) return;
    for (const b in A.beds) bedOff(A.beds[b]);
    for (const sp of A.spots.slice()) spotEnd(sp);
    if (A.peal) { for (const b of A.peal.live) drop(b); for (const n of A.peal.ch.nodes) drop(n); A.peal = null; }
    if (A.herd) { for (const b of A.herd.live) drop(b); for (const n of A.herd.ch.nodes) drop(n); A.herd = null; }
    if (A.noise) { drop(A.noise.src); A.noise = null; }
    hush();
    A.nodes = 1; A.mlev = 0; A.out.gain.cancelScheduledValues(0); A.out.gain.value = 0; A.lastS = null;
  }
  function free() { if (!A) return; stopAll(); try { A.out.disconnect(); } catch (_) { } A = null; }   // (and the voices: nothing left)
  // js/sfx.js, each frame: its context, the race's bus, the race, the car the camera follows, the camera, { crowd, stands, tunnel (their
  // levels now), pikes, en (the sound on), run (the race's sounds running) }
  function step(ctx, bus, race, player, cam, lv) {
    lv = lv || {};
    if (!S.lvl || !S.sound || lv.en === false) { if (A) free(); return; }
    const o = typeof Render !== 'undefined' ? Render.world : null, T = race && race.track, def = T && T.def;
    if (!ctx || !bus || !player || !o || !def || race.nv || !eligible(def)) { if (A && A.nodes > 1) stopAll(); return; }
    if (!A || A.ctx !== ctx || A.bus !== bus) { free(); begin(ctx, bus); }
    const at = atmosOf(), key = at.season + '|' + at.tod;
    if (A.o !== o || A.key !== key) { stopAll(); A.o = o; A.key = key; A.Z = null; A.buf = {}; A.songs = []; A.bells = null; A.cowb = null; A.coos = null; A.bytes = 0; A.err = null; A.tBell = -1e9; A.prep = { slices: 0, ms: 0, max: 0, at: '', top: [] }; A.T = T; A.gen = prepGen(o, T, at); }
    if (A.gen) {
      const t0 = performance.now(); let r = { done: false };
      DL = t0 + (race.state === 'racing' && lv.run ? PREP_RACE : PREP_GRID);
      try { do r = A.gen.next(); while (!r.done && !late()); } catch (e) { r = { done: true }; A.err = String(e && e.message || e); A.Z = null; } finally { DL = Infinity; }
      const t = performance.now() - t0; A.prep.slices++; A.prep.ms += t; if (t > A.prep.max) { A.prep.max = t; A.prep.at = stage; }
      if (t > 3 && A.prep.top.length < 6) A.prep.top.push(+t.toFixed(1) + ' ' + stage);   // (the long slices: the tests, the tuning)
      if (!r.done) return;
      A.gen = null;
    }
    const s = player.q && Number.isFinite(player.q.s) ? player.q.s : null, now = ctx.currentTime;
    if (!A.Z || s == null || now < A.tU) return;
    A.tU = now + (S.saver() ? 0.2 : 0.1);
    mix(race, player, cam, lv, s, now);
  }
  function prepNow() {   // (the tests: the rest of the prep at once, once a frame has seen the race; true when the zones are there)
    if (!A || !A.gen) return !!(A && A.Z);
    const dl = DL; DL = Infinity;
    try { let r; do r = A.gen.next(); while (!r.done); } catch (e) { A.err = String(e && e.message || e); A.Z = null; } finally { DL = dl; }
    A.gen = null; return !!A.Z;
  }
  function profile() {   // (the tests and the tuning: the prep made again whole, each piece between two yields timed: the longest [ms, stage])
    if (!A || !A.o || !A.T) return null;
    const o = A.o, at = atmosOf(); stopAll(); cache.delete(o); Object.assign(A, { Z: null, buf: {}, songs: [], bells: null, cowb: null, coos: null, bytes: 0, gen: null });
    const g = prepGen(o, A.T, at), L = [], dl = DL; DL = -Infinity; let r, tot = 0;
    try { do { const t0 = performance.now(); r = g.next(); const t = performance.now() - t0; tot += t; L.push([+t.toFixed(2), stage]); } while (!r.done); } finally { DL = dl; }
    L.sort((a, b) => b[0] - a[0]); return { pieces: L.length, ms: +tot.toFixed(1), top: L.slice(0, 8) };
  }
  const KGB = { brook: KG[BROOK], river: KG[RIVER], fall: KG[FALL], lake: KG[LAKE], sea: KG[SEAK] };   // (the water at its nearest)
  function probe(o) {   // (the tests and the tuning: one bed o.bed as it plays at a full zone (× o.v; the water at its nearest) on Normalno (o.lvl: × the setting), rendered offline: its samples)
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    // (or one call o.spot: 'bird' (song o.k), 'gull', 'bell' (the church o.d m off the road), each at its nearest and loudest: A.R() 0)
    if (!A || !A.Z || !OAC) return Promise.resolve(null);
    const sp0 = o.spot, miss = o.mix ? !A.buf.noise
      : sp0 ? (sp0 === 'bird' && !A.songs.length) || (sp0 === 'bell' && !A.bells) || (sp0 === 'cow' && !A.cowb) || (sp0 === 'coo' && !A.coos) || ((sp0 === 'moo' || sp0 === 'baa') && !A.buf[sp0])
      : !A.buf.noise || !BG[o.bed] || (BUFB.has(o.bed) && !A.buf[o.bed]);
    if (miss) return Promise.resolve(null);
    const sr = o.sr || 44100, dur = o.dur || 3, ac = new OAC(1, Math.round(dur * sr), sr), keep = A;
    A = Object.assign({}, keep, { ctx: ac, out: ac.createGain(), beds: {}, spots: [], peal: null, herd: null, noise: null, nodes: 1, tg: {}, mlev: 0, R: o.spot ? () => 0 : rngOf(7), n: N0() });
    try { A.out.gain.value = BASE * (o.lvl == null ? 1 : o.lvl); A.out.connect(ac.destination);
      if (o.spot === 'bird') { A.songs = [keep.songs[(o.k || 0) % keep.songs.length]]; bird(0, 1, 1, 0); }
      else if (o.spot === 'gull') gulls(1, 0);
      else if (o.spot === 'coo') coo(1, 0);
      else if (o.spot === 'cow' || o.spot === 'moo' || o.spot === 'baa') {   // (a herd 20 m away: a cow's bell three times, a moo, a bleat)
        const ch = spotChain(8000); ch.g.gain.value = SP.herd;
        for (let k = 0; k < (o.spot === 'cow' ? 3 : 1); k++) { const b = ac.createBufferSource(); b.buffer = o.spot === 'cow' ? keep.cowb[k % keep.cowb.length] : keep.buf[o.spot]; b.connect(ch.f); b.start(k * 0.22); } }
      else if (o.spot === 'bell') { ring([0, 0, 1, o.d || 15], 0); for (let t = 0; t < dur && A.peal; t += 0.1) pealTick(A.peal, 0, 1, t); }
      else if (o.mix) {   // (the load: o.mix's beds at once, a bird every 1.5 s, a peal of bells, a herd's bells: the most the mixer plays together)
        const Bs = o.mix.map(b => bedOn(b)), HZ = { herds: [[0, 1, 25, 'cow']], open: true, len: 1e4 }; let pl = false;
        for (let k = 0, t = 0; t < dur; t = ++k / 10) { Bs.forEach(B => bedTick(B, BG[B.name] * (KGB[B.name] || 1), 0, t)); if (k % 15 === 0 && A.songs.length) bird(0.5, 0.5, 1, t);
          if (!pl && t > 1 && A.bells) { pl = true; ring([0, 0, 1, 40], t); } if (A.peal) pealTick(A.peal, 0, 1, t); if (A.cowb) herdTick(HZ, 0, 1, t, false); } }
      else { const B = bedOn(o.bed), v = BG[o.bed] * (o.v == null ? KGB[o.bed] || 1 : o.v); for (let t = 0; t < dur; t += 0.1) bedTick(B, v, 0, t); } }
    finally { A = keep; }
    return ac.startRendering().then(b => b.getChannelData(0));
  }
  function silence() { stopAll(); }   // (js/sfx.js silence: the race left or paused for good)
  // js/game.js: the setting (× the loudness: 0 Izklop, 0.5 Tiho, 1 Normalno, 2 Glasno), the sound on, the battery saver (a function: on now?)
  function setOpts(lvl, sound, saver) {
    S.lvl = clamp(+lvl || 0, 0, 2); S.sound = !!sound;
    if (typeof saver === 'function') S.saver = saver; else if (saver != null) { const v = !!saver; S.saver = () => v; }
    if (!S.lvl || !S.sound) free();
  }
  function levels() {   // (the tests, Sfx.levels' twin: what plays now)
    const sp = { pa: SPK.nPA, shouts: SPK.nSh, on: !!SPK.u, kind: SPK.kind, last: SPK.last, cut: SPK.cut };
    if (!A) return { on: false, ready: false, nodes: 0, bytes: 0, master: 0, full: BASE * S.lvl * (S.sound ? 1 : 0), beds: {}, tg: {}, spots: 0, peal: false, herd: false, n: N0(), speech: sp };
    const beds = {}, tg = {}; for (const b in A.beds) beds[b] = +A.beds[b].cur.toFixed(4); for (const b in A.tg) tg[b] = +A.tg[b].toFixed(4);
    return { on: true, ready: !A.gen && !!A.Z, err: A.err, nodes: A.nodes, bytes: A.bytes, master: +A.mlev.toFixed(4), full: BASE * S.lvl, kmh: Math.round(A.kmh || 0), beds, tg, spots: A.spots.length, peal: !!A.peal, herd: !!A.herd, n: Object.assign({}, A.n), k: A.k, speech: sp,
      songs: A.songs.length, saver: !!S.saver(), run: !!A.run, voices: Object.keys(A.buf).concat(A.bells ? ['bells'] : [], A.cowb ? ['cowbells'] : [], A.coos ? ['coos'] : []), prep: { slices: A.prep.slices, ms: +A.prep.ms.toFixed(1), max: +A.prep.max.toFixed(2), at: A.prep.at, top: A.prep.top.slice() } };
  }

  const api = { zones, table, eligible, KN, step, silence, set: setOpts, levels, prep: prepNow, profile, probe, opts, hush, lines: { pa: PA_LINES, end: PA_END, shouts: SHOUTS }, get NO() { return [...NO]; } };
  window.SfxOkolje = api;
})();
