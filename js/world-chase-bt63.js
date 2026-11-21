/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the sixty-third group of the real tracks: Zandvoort and Buriram,
   a further pass on two circuits of the shared builder (js/world-rbring.js: each look's LK.extra chained on top of the earlier ones).
   From behind the car both still showed, past the bands of the earlier groups, one smooth face to the horizon: in Zandvoort the dunes
   past ~35 m (js/world-chase-bt6.js's marram and scrub thin out by there, js/world-chase-bt34.js stops ~4.5 m past the rail), in Buriram
   the paddies' patchwork painted on the flat terrain with no edge between the fields (js/world-chase-bt41.js's sparse patches on it).
   So here, out to ~60 m: Zandvoort (docs/proge/zandvoort.md: »sipine s šopi trave, grmi rakitovca in razpihani peščeni žepi«, »borovci
   in breze v redkih sestojih«) on the dunes the grey dune's low moss and lichen ground, the blown sand pockets on the gentler ground,
   loose drifts of marram and low cushions of sea buckthorn where the scrub's noise shows it, under the dune woods the pines' needle
   litter, on the rough grass a few uncut tussocks; never in or by the ponds (def.sk.pond), in the excluded places, the built ground or
   on the pits' side along the pits. Buriram (docs/proge/buriram.md: »riževa polja v pravokotnih parcelah«, »sladkorne palme (posamič,
   tudi na nasipih polj)«) the low earth bunds between the paddies, on the very grid the look paints the fields on (js/world-buriram.js
   paddy(): rows 30 m wide, fields 34-56 m long, turned 22 degrees), grassed on top and showing the red-brown laterite on their flanks,
   out to ~130 m from the centre line where the
   paddies (land cover 2) begin past the watered lawns (which reach ~60-70 m and keep no bunds), never in the pond or on the wetlands. All of it in the
   builder's own scenery chunks (no draw is added); the terrain, the road, the barriers, the horizon and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng, sstep } = API;
  if (!BT || !BT.soil || !BT.tuft || !BT.cushion || !BT.mix3 || !vary || !rng || !sstep) return;
  const { soil, tuft, cushion, mix3 } = BT;

  const chain = (id, key, fn) => {
    const L = (API.rbLook || {})[id]; if (!L) return;
    const base = L.extra;
    L.extra = function (ctx) {
      const r = (base ? base.call(this, ctx) : null) || {};
      if (API.THEME === id) try { r[key] = fn(ctx); } catch (e) { console.error('chase-bt63 (' + id + '):', e); }
      return r;
    };
  };
  const pitSide = (T) => { const pd = T.def.pit; return pd ? (pd[0] < 0 ? -1 : 1) : 0; };

  /* ---- Zandvoort: every ~5 m on both sides a place 30-60 m past the barrier ---- */
  const ZF = { seed: 63101, step: 5, share: 0.7, from: 30, to: 60,
    grey: [0.6, 0.6, 0.47], grey2: [0.52, 0.55, 0.4], sand: [0.84, 0.78, 0.6], sand2: [0.8, 0.74, 0.57],
    marram: [0.5, 0.56, 0.36], straw: [0.74, 0.7, 0.46], buck: [0.42, 0.48, 0.32], needle: [0.5, 0.42, 0.3], uncut: [0.42, 0.52, 0.26], hay: [0.56, 0.56, 0.32] };
  // the ponds of def.sk.pond (5 m cells, the run-length mask js/world-zandvoort.js reads): any wet cell within a cell's reach
  const pondMask = (def) => {
    const P = def.sk && def.sk.pond, A = API.NR_A64; if (!P || !A) return () => false;
    const { x0, z0, nx, nz, cell: C } = P, n = nx * nz, M = new Uint8Array(n);
    for (let p = 0, k = 0; k < n && p < P.rle.length;) { const v = A.indexOf(P.rle[p++]); let r = (v & 31) + 1; if ((v & 31) === 31) { let e; do { e = A.indexOf(P.rle[p++]); r += e; } while (e === 63); } M.fill(v >> 5, k, Math.min(n, k + r)); k += r; }
    return (x, z) => { const i = Math.floor((x - x0) / C), j = Math.floor((z - z0) / C);
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const I = i + a, J = j + b; if (I >= 0 && J >= 0 && I < nx && J < nz && M[J * nx + I]) return true; }
      return false; };
  };
  chain('zandvoort', 'robBt63', (ctx) => {
    const T = API.T, { nrGround: gH, nrLC, nrSlope, nrNear, NR: P } = API, scen = ctx.scen;
    const st = { siva: 0, pesek: 0, sopi: 0, grmi: 0, iglice: 0, trava: 0 };
    if (!T || !T.br || !gH || !nrLC || !nrNear || !scen || !P) return st;
    const ex = ctx.excluded || (() => false), pond = pondMask(T.def), ps = pitSide(T), N = T.px.length;
    const gap = (a, b) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
    const free = (x, z, r) => { const q = nrNear(x, z); return q.i >= 0 && q.dd > r && !ex(x, z) && !pond(x, z); };
    const R = rng(ZF.seed);
    for (let i = 0; i < N; i += Math.max(1, Math.round(ZF.step / T.ds))) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(), r3 = R(), r4 = R(); if (r0 > ZF.share) continue;
      if (ps && sd === ps && T.pitAt(i * T.ds)) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], off = bar + ZF.from + r1 * (ZF.to - ZF.from), a = (r2 - 0.5) * ZF.step;
      const x = T.px[i] + T.nx[i] * sd * off + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * off + T.tz[i] * a;
      const q = nrNear(x, z); if (q.i < 0 || gap(q.i, i) * T.ds > off + 10 || !free(x, z, 12)) continue;   // (another leg's road is nearer: its own band)
      const c = nrLC(x, z), sl = nrSlope ? nrSlope(x, z) : 0; if (c === 3 || sl > 1.2) continue;
      const k = 1 + 0.4 * (off - bar - ZF.from) / (ZF.to - ZF.from);
      if (c === 1) { soil(scen, gH, x, z, (1.4 + r3 * 1.4) * k, vary(ZF.needle, R, 0.03), R, 0.05); st.iglice++; continue; }
      if (c === 0) {   // the rough grass between the dunes: a few uncut tussocks, browner where the look's noise dries it
        const dry = sstep(0.4, 0.75, P.n3(x * 0.6 + 40, z * 0.6));
        for (let t = 0, n = 2 + Math.floor(r3 * 3); t < n; t++) { const tx = x + (R() - 0.5) * 5, tz = z + (R() - 0.5) * 5, h = R();
          if (!free(tx, tz, 8) || nrLC(tx, tz) !== 0) continue;
          tuft(scen.get(tx, tz), tx, gH(tx, tz), tz, 0.35 + h * 0.35, 0.32 + h * 0.3, vary(mix3(ZF.uncut, ZF.hay, Math.min(1, dry * 0.7 + R() * 0.3)), R, 0.03), R, 5); st.trava++; }
        continue;
      }
      if (c !== 2) continue;
      // the dunes: the ground first (the blown sand on the gentler slopes, else the grey dune's moss and lichen), then a drift on it
      const sc = sstep(0.55, 0.78, P.n2(x * 0.9 - 130, z * 0.9 + 70)), dry = P.n3(x * 0.6 + 40, z * 0.6);
      if (sl < 0.4 && r4 < 0.3) { soil(scen, gH, x, z, (1.5 + r3 * 1.8) * k, vary(mix3(ZF.sand, ZF.sand2, R()), R, 0.02), R, 0.05); st.pesek++; }
      else { soil(scen, gH, x, z, (1.6 + r3 * 1.8) * k, vary(mix3(ZF.grey, ZF.grey2, R()), R, 0.025), R, 0.05); st.siva++; }
      for (let t = 0, n = 2 + Math.floor(R() * 4); t < n; t++) {
        const tx = x + (R() - 0.5) * 8, tz = z + (R() - 0.5) * 8, h = R(), b = R();
        if (!free(tx, tz, 8) || nrLC(tx, tz) !== 2) continue;
        if (b < 0.35 * sc) { cushion(scen.get(tx, tz), tx, gH(tx, tz), tz, 0.8 + h * 0.8, 0.4 + h * 0.4, vary(ZF.buck, R, 0.025), R); st.grmi++; }
        else { tuft(scen.get(tx, tz), tx, gH(tx, tz), tz, 0.4 + h * 0.4, 0.42 + h * 0.45, vary(mix3(ZF.marram, ZF.straw, Math.min(1, dry * 0.8 + b * 0.4)), R, 0.03), R, 3); st.sopi++; }
      }
    }
    return st;
  });

  /* ---- Buriram: the bunds on the look's own paddy grid (js/world-buriram.js paddy(): u along the rows, v across, rows 30 m) ---- */
  const BB = { seed: 63201, piece: 4, from: 14, max: 3200, reach: 130, hw: 0.5, h: 0.22,
    top: [[0.44, 0.54, 0.25], [0.5, 0.56, 0.28]], flank: [[0.56, 0.44, 0.3], [0.52, 0.42, 0.29]] };
  const hsh = (a, b) => { let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const PC = Math.cos(0.38), PS = Math.sin(0.38);
  const toXZ = (u, v) => [u * PC - v * PS, u * PS + v * PC];
  // the polygons of def.sk (lakes: [name, x, z, ...]; wet: [x, z, ...]) with their boxes, to keep the bunds off the water
  const polys = (arr) => (arr || []).map(a => {
    const p = [], k0 = typeof a[0] === 'string' ? 1 : 0; for (let k = k0; k + 1 < a.length; k += 2) p.push([a[k], a[k + 1]]);
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of p) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    return { p, b: [x0, x1, z0, z1] };
  });
  const inAny = (PP, x, z, m) => { if (!API.inPoly) return false;
    for (const { p, b } of PP) { if (x < b[0] - m || x > b[1] + m || z < b[2] - m || z > b[3] + m) continue;
      if (API.inPoly(p, x, z) || (m > 0 && API.polyDist && API.polyDist(p, x, z) < m)) return true; }
    return false; };
  // one piece of a bund from (ax, az) to (bx, bz): a low rounded ridge, its two flanks sloping to the field on both sides, grassed near the crest
  const bund = (g, gH, ax, az, bx, bz, R, st) => {
    const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1, px = -dz / L, pz = dx / L, h = BB.h * (0.8 + R() * 0.4);
    const ya = gH(ax, az), yb = gH(bx, bz), top = vary(mix3(BB.top[0], BB.top[1], R()), R, 0.02), fl = vary(mix3(BB.flank[0], BB.flank[1], R()), R, 0.02);
    const pt = (x, z, o, y) => [x + px * o, y, z + pz * o];
    const A0 = pt(ax, az, -BB.hw, ya), A1 = pt(ax, az, 0, ya + h), A3 = pt(ax, az, BB.hw, ya);
    const B0 = pt(bx, bz, -BB.hw, yb), B1 = pt(bx, bz, 0, yb + h), B3 = pt(bx, bz, BB.hw, yb);
    const ref = [(ax + bx) / 2, (ya + yb) / 2 - 5, (az + bz) / 2];
    g.triO(A0, B0, B1, fl, ref, fl, top); g.triO(A0, B1, A1, fl, ref, top, top);
    g.triO(A1, B1, B3, top, ref, top, fl); g.triO(A1, B3, A3, top, ref, fl, fl);
    st.kosi++;
  };
  chain('buriram', 'robBt63', (ctx) => {
    const T = API.T, { nrGround: gH, nrLC, nrNear, nrSlope } = API, scen = ctx.scen, st = { kosi: 0 };
    if (!T || !T.br || !gH || !nrLC || !nrNear || !scen) return st;
    const sk = T.def.sk || {}, WATER = polys(sk.lakes).concat(polys(sk.wet)), ex = ctx.excluded || (() => false), ps = pitSide(T), R = rng(BB.seed);
    // nrNear reaches 64 m: beyond it (i < 0) lie the paddies proper; the track-side lawns (land cover 0) stay without bunds
    const NEAR = new Set(), C = 20, rc = Math.ceil(BB.reach / C);   // 20 m cells within BB.reach of the centre line
    for (let i = 0; i < T.px.length; i += 3) { const cx = Math.floor(T.px[i] / C), cz = Math.floor(T.pz[i] / C);
      for (let b = -rc; b <= rc; b++) for (let a = -rc; a <= rc; a++) if ((a * a + b * b) * C * C <= BB.reach * BB.reach) NEAR.add((cx + a) * 65536 + cz + b); }
    const ok = (x, z) => { if (st.kosi >= BB.max || !NEAR.has(Math.floor(x / C) * 65536 + Math.floor(z / C))) return false; const q = nrNear(x, z);
      if (q.i >= 0) { if (q.dd < BB.from) return false; if (ps && Math.sign(q.lat) === ps && T.pitAt(q.i * T.ds)) return false; }
      const c = nrLC(x, z); return c === 2 && !ex(x, z) && (!nrSlope || nrSlope(x, z) < 0.5) && !inAny(WATER, x, z, 3); };
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (let i = 0; i < T.px.length; i++) { const u = T.px[i] * PC + T.pz[i] * PS, v = -T.px[i] * PS + T.pz[i] * PC; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    u0 -= 280; u1 += 280; v0 -= 280; v1 += 280;
    const run = (pa, pb) => {   // a straight bund in pieces, each piece where its middle is on the open paddies
      const [ax, az] = pa, [bx, bz] = pb, L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / BB.piece));
      for (let s = 0; s < n; s++) { const t0 = s / n, t1 = (s + 1) / n, mx = ax + (bx - ax) * (t0 + t1) / 2, mz = az + (bz - az) * (t0 + t1) / 2;
        if (!ok(mx, mz)) continue;
        bund(scen.get(mx, mz), gH, ax + (bx - ax) * t0, az + (bz - az) * t0, ax + (bx - ax) * t1, az + (bz - az) * t1, R, st); }
    };
    for (let row = Math.floor(v0 / 30); row * 30 <= v1; row++) {
      const v = row * 30, hr = hsh(row, 77), wd = 34 + 22 * hr;
      for (let u = u0; u < u1; u += 40) run(toXZ(u, v), toXZ(Math.min(u1, u + 40), v));   // the long bund between two rows
      for (let col = Math.floor((u0 + hr * 97) / wd); col * wd - hr * 97 <= u1; col++) { const u = col * wd - hr * 97; run(toXZ(u, v), toXZ(u, v + 30)); }   // the short ones between the fields
    }
    return st;
  });
})();
