/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the forty-second group of the real tracks, a second pass: Hiva
   (its own builder, js/world-hiva.js) and Isuna (a pass-builder road on Vršič's corridor, js/world-isuna.js). The sixth group
   (js/world-chase-bt6.js) gave Hiva sparse straw tufts and dust patches within ~30 m and the eleventh (js/world-chase-bt11.js) gave Isuna
   grass, wormwood and needle litter within ~25 m; from behind the car both still showed one even face: on Hiva the strip to the concrete
   barriers and the open ground behind them in one loess yellow, on Isuna the verge in one pale green and the valley floor past ~25 m in
   one tone. So here, as the thirty-eighth group did: on the strip low patches of what lies there and tufts at the barrier's foot, behind
   it the open ground or the bank to ~10 m, and out to ~55 m a sparse band of wide low patches on the terrain. All of it in meshes of its
   own (no shadow); the terrain, the road, the barriers, the walls, the houses, the trees, the river and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.verge || !BT.bank || !BT.muted || !BT.soil || !BT.softScen || !BT.tuft || !BT.mix3 || !rng || !vary) return;
  const { soil, tuft, softScen, mix3, verge, bank, muted } = BT;
  const C = (a, b, k) => (R) => vary(mix3(a, b, R()), R, k || 0.015);

  /* a sparse outer band (as js/world-chase-bt38.js): every `step` m on both sides a wide low patch between `from` m past the barrier line
     and `to` m, only where this leg's road is the nearest, not in `bad`, not far below the road and not steeper than C.maxSl */
  const band = (root, matV, gT, near, bad, seed, P) => {
    const T = API.T, st = { pas: 0 };
    if (!T || !T.br || !near || !root || !matV) return st;
    const R = rng(seed), soft = softScen(root, matV), N = T.px.length;
    const slope = (x, z) => { const d = 1.2, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(P.step / T.ds))) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > P.share) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + P.from + r1 * (P.to - P.from), a = (r2 - 0.5) * P.step;
      const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      const q = near(x, z), qi = q.i, qdd = q.dd;   // (near hands back one shared object: read it at once)
      if (qi < 0 || Math.abs(qi - i) * T.ds > o + 10 || qdd < 4) continue;   // (another leg's road is nearer: its own band)
      if (bad(x, z)) continue;
      const y = gT(x, z); if (!(y > T.hy[i] - P.drop) || slope(x, z) > P.maxSl) continue;
      const Pp = P.patch(R, o); soil(soft, gT, x, z, Pp.r, Pp.col, R, 0.06); st.pas++;
    }
    soft.done();
    return st;
  };

  /* ---- Hiva: docs/proge/hiva.md: »puhlično rumena tla«, mud-brick walls and houses, poplars and elms along the irrigation ditches,
     concrete barriers along the streets. On the strip between the asphalt and the barriers the loess dust and the sand the wind blows to
     them, a paler crust where it dried; at the barriers' foot low tufts of dry grass. Behind the barriers to ~10 m on open ground (not built,
     not water: ESA WorldCover) the loess in yellower and greyer patches, the dry grass, here and there a damper brown by a ditch; out to
     ~55 m wide low patches of the same, so the oasis' bare ground reads as ground, not one colour ---- */
  const HV = {
    loess: C([0.8, 0.58, 0.32], [0.83, 0.6, 0.34]),
    grey: C([0.74, 0.56, 0.34], [0.77, 0.58, 0.36]),
    crust: C([0.84, 0.64, 0.38], [0.86, 0.66, 0.4]),
    straw: C([0.72, 0.56, 0.28], [0.75, 0.58, 0.3]),
    damp: C([0.64, 0.46, 0.26], [0.67, 0.48, 0.28]),
    tuft: C([0.72, 0.66, 0.4], [0.62, 0.6, 0.34], 0.03),
  };
  const mute = (c) => muted({ patch: () => ({ col: c, r: 1 }), tuft: () => c }).patch().col;
  const hvPatch = (R) => { const r = R(); return mute(r < 0.32 ? HV.loess(R) : r < 0.55 ? HV.grey(R) : r < 0.75 ? HV.straw(R) : r < 0.9 ? HV.crust(R) : HV.damp(R)); };
  const hvRob = ({ scen, excluded }) => {
    const T = API.T, { nrGround, nrLC, nrNear } = API, st = { zaplate: 0, sopi: 0, breg: 0, bregSopi: 0, pas: 0 };
    if (!T || !T.br || !T.wAt || !nrGround || !nrLC || !nrNear || !scen) return st;
    const ex = excluded || (() => false);
    const R = rng(42101), N = T.px.length, step = Math.max(1, Math.round(3 / T.ds)), farS = Math.max(1, Math.round(6 / T.ds));
    // (the builder's verge, vergeRow: w 0, w + 0.8 -0.04, to the barrier line - 0.3 at -0.08 lifted onto the ground, + 0.8 at -0.16, + 3.2 at -0.4)
    const prof = (i, o, side) => { const w = T.wAt(i), b = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i];
      const lift = (oo, h) => { const q = side * oo; return [oo, Math.max(h, nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.06 - y)]; };
      const Pp = [[w, 0], [w + 0.8, -0.04], lift(Math.max(w + 1.2, b - 0.3), -0.08), lift(b + 0.8, -0.16), lift(b + 3.2, -0.4)];
      if (o <= Pp[0][0]) return 0; for (let k = 1; k < Pp.length; k++) if (o <= Pp[k][0]) { const t = (o - Pp[k - 1][0]) / Math.max(0.01, Pp[k][0] - Pp[k - 1][0]); return Pp[k - 1][1] + (Pp[k][1] - Pp[k - 1][1]) * t; }
      return null; };
    const gV = (x, z) => { const q = nrNear(x, z), qi = q.i, lat = q.lat, g = nrGround(x, z); if (qi < 0) return g; const h = prof(qi, Math.abs(lat), lat < 0 ? -1 : 1);
      return h == null ? g : Math.max(T.hy[qi] + h + 0.02, g - 0.02); };
    const own = (x, z, i, lo, hi) => { const q = nrNear(x, z), o = Math.abs(q.lat); return q.i >= 0 && Math.abs(q.i - i) * T.ds < 12 && o > lo && o < hi; };
    const slope = (x, z) => { const d = 0.8, a = nrGround(x + d, z) - nrGround(x - d, z), b = nrGround(x, z + d) - nrGround(x, z - d); return Math.hypot(a, b) / (2 * d); };
    const at = (i, sd, o, a) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
    const bad = (x, z) => ex(x, z) || nrLC(x, z) === 5;   // (the builder's excluded keeps the houses, the walls and the minarets free; the oasis' streets are the same loess)
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {
      const w = T.wAt(i), bar = sd > 0 ? T.br[i] : T.bl[i], e0 = w + 0.9, e1 = bar - 0.35, r0 = R(), r1 = R(), r2 = R(), r3 = R();
      if (e1 - e0 > 0.7 && r0 < 0.5) {   // a patch on the strip: the dust and the sand blown to the barriers, a dried crust
        const o = e0 + r1 * (e1 - e0), [x, z] = at(i, sd, o, (r2 - 0.5) * 2), rr = Math.min(0.7 + R() * 0.9, (e1 - e0) * 0.5 + 0.2, o - e0 + 0.35, e1 - o + 0.35);
        if (rr > 0.3 && own(x, z, i, e0 - 0.1, e1 + 0.1) && !ex(x, z)) { const k = R(); soil(scen, gV, x, z, rr, mute(k < 0.5 ? HV.loess(R) : k < 0.8 ? HV.grey(R) : HV.crust(R)), R, 0.04); st.zaplate++; }
      }
      if (r3 < 0.2) for (let q = 0, n = 1 + Math.floor(R() * 3); q < n; q++) {   // dry tufts at the barriers' foot
        const o = e1 - 0.05 - R() * 0.3, [x, z] = at(i, sd, o, (R() - 0.5) * 2.4);
        if (!own(x, z, i, e0, bar - 0.25) || ex(x, z)) continue;
        const h = R(); tuft(scen.get(x, z), x, gV(x, z), z, 0.2 + h * 0.16, 0.22 + h * 0.2, mute(HV.tuft(R)), R, 5); st.sopi++; }
      for (let k = 0; k < 2; k++) {   // behind the barriers to ~10 m on the open ground
        const q0 = R(), q1 = R(), q2 = R(), o = bar + 1.0 + Math.pow(q1, 1.3) * 9, [x, z] = at(i, sd, o, (q2 - 0.5) * 2.8);
        if (!own(x, z, i, bar + 0.7, 1e9) || bad(x, z) || slope(x, z) > 0.9 || Math.abs(nrGround(x, z) - T.hy[i]) > 4) continue;
        if (q0 < 0.65) { soil(scen, nrGround, x, z, 0.9 + R() * 1.2, hvPatch(R), R, 0.05); st.breg++; }
        else { const h = R(); tuft(scen.get(x, z), x, nrGround(x, z), z, 0.24 + h * 0.2, 0.26 + h * 0.24, mute(HV.tuft(R)), R, 5); st.bregSopi++; }
      }
    }
    for (let i = 0; i < N; i += farS) for (const sd of [-1, 1]) {   // out to ~55 m: wide low patches on the open ground
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > 0.55) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + 9 + r1 * 44, [x, z] = at(i, sd, o, (r2 - 0.5) * 6), q = nrNear(x, z), qi = q.i, qdd = q.dd;
      if (qi < 0 || Math.abs(qi - i) * T.ds > o + 10 || qdd < 6 || bad(x, z) || slope(x, z) > 0.8) continue;
      const k = 1 + 0.5 * (o - bar - 9) / 44; soil(scen, nrGround, x, z, (1.5 + R() * 1.5) * k, hvPatch(R), R, 0.06); st.pas++;
    }
    return st;
  };
  {
    const base = World.ext && World.ext.hivaRob;
    if (World.ext) World.ext.hivaRob = (ctx) => {
      const r = (base ? base(ctx) : null) || {};
      try {
        if (ctx && ctx.root && ctx.matV) {   // (in a mesh of its own that casts no shadow)
          const soft = softScen(ctx.root, ctx.matV);
          r.robBt42 = hvRob(Object.assign({}, ctx, { scen: soft }));
          soft.done();
        } else if (ctx && ctx.scen) r.robBt42 = hvRob(ctx);
      } catch (e) { console.error('chase-bt42 (hiva):', e); }
      return r;
    };
  }

  /* ---- Isuna: docs/proge/isuna.md: »ob reki, pod gozdom modrega bora … gozd jelk in borov na pobočjih … krave«. On the verge the grazed
     short grass, the valley's grey earth and gravel washed down, the blue pines' rust-brown needles where the forest reaches the road; at
     the barrier's foot tufts of grass. On the bank to ~10 m the needle litter under the pines, the grass, the grey earth, low wormwood
     cushions; out to ~55 m wide patches of the same on the slopes. Nothing in the river's bed or by its edge, in the water or built ---- */
  const ISV = { step: 3.2, share: 0.5, foot: 0.25,
    patch: (R) => { const r = R();
      return r < 0.4 ? { col: C([0.36, 0.44, 0.16], [0.39, 0.46, 0.18])(R), r: 0.9 + R() * 1.0 }   // (grazed short grass)
        : r < 0.7 ? { col: C([0.42, 0.44, 0.24], [0.45, 0.46, 0.26])(R), r: 0.7 + R() * 0.9 }   // (grey earth and gravel)
        : { col: C([0.44, 0.34, 0.18], [0.47, 0.36, 0.2])(R), r: 0.8 + R() * 0.9 }; },   // (blue pine needles)
    tuft: C([0.4, 0.5, 0.24], [0.5, 0.54, 0.32], 0.03) };
  const ISB = { step: 4.5, n: 2, reach: 9, share: 0.7, maxSl: 1.4, sl: 0.9, bushShare: 0.25,
    patch: (R, sl) => { const r = R();
      return sl > 0.8 && r < 0.5 ? { col: C([0.42, 0.43, 0.24], [0.45, 0.45, 0.26])(R), r: 0.9 + R() * 1.0 }   // (the cutting's grey earth)
        : r < 0.5 ? { col: C([0.44, 0.34, 0.18], [0.47, 0.36, 0.2])(R), r: 1.0 + R() * 1.3 }   // (needle litter)
        : { col: C([0.35, 0.43, 0.15], [0.38, 0.45, 0.17])(R), r: 1.0 + R() * 1.2 }; },   // (grass)
    tuft: C([0.4, 0.5, 0.24], [0.5, 0.54, 0.32], 0.03),
    bush: (R) => vary([0.52, 0.56, 0.44], R, 0.025) };   // (wormwood: grey-green)
  const ISF = { step: 6, share: 0.35, from: 8, to: 55, drop: 6, maxSl: 1.2,
    patch: (R, o) => { const r = R(), k = 1 + 0.5 * Math.min(1, (o - 8) / 47);
      return r < 0.45 ? { col: C([0.44, 0.34, 0.18], [0.47, 0.36, 0.2])(R), r: (1.6 + R() * 1.5) * k }   // (needle litter)
        : r < 0.8 ? { col: C([0.35, 0.43, 0.15], [0.38, 0.45, 0.17])(R), r: (1.6 + R() * 1.6) * k }   // (grass)
        : { col: C([0.42, 0.43, 0.24], [0.44, 0.45, 0.25])(R), r: (1.2 + R() * 1.2) * k }; } };   // (grey earth)
  const riverTest = (def) => {   // (the river beds of the track's def in 16 m cells, as js/world-chase-bt11.js keeps them free)
    const cells = new Map(), G = 16;
    for (const a of (def && def.riverBeds) || []) { const hw = a[0] / 2;
      for (let k = 1; k + 1 < a.length; k += 2) { const x = a[k], z = a[k + 1], i = Math.floor(x / G), j = Math.floor(z / G);
        for (let u = -1; u <= 1; u++) for (let v = -1; v <= 1; v++) { const key = (i + u) + ',' + (j + v); let L = cells.get(key); if (!L) cells.set(key, L = []); L.push(x, z, hw); } } }
    if (!cells.size) return null;
    return (x, z, m) => { const L = cells.get(Math.floor(x / G) + ',' + Math.floor(z / G)); if (!L) return false;
      for (let k = 0; k < L.length; k += 3) { const dx = x - L[k], dz = z - L[k + 1], r = L[k + 2] + m; if (dx * dx + dz * dz < r * r) return true; } return false; };
  };
  const isRun = (ctx) => {
    const out = ctx.out, gT = API.vrGround, lc = API.vrLC, wat = API.vrWater; if (!out || !out.matV || !ctx.root || !gT) return;
    const ex = ctx.excluded || (() => false), riv = riverTest(API.T && API.T.def);
    const bad = (x, z) => ex(x, z) || (riv && riv(x, z, 6)) || (wat && wat(x, z).e > -2) || (lc && (lc(x, z) === 3 || lc(x, z) === 5));
    out.robBt42 = verge(ctx.root, out.matV, gT, 42201, muted(ISV));
    out.bregBt42 = bank(ctx.root, out.matV, gT, bad, 42202, muted(ISB));
    out.pasBt42 = band(ctx.root, out.matV, gT, API.vrNear, bad, 42203, muted(Object.assign({ tuft: () => [0.5, 0.5, 0.4] }, ISF)));
  };
  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'isuna') try { isRun(ctx); } catch (e) { console.error('chase-bt42 (isuna):', e); }
      return r;
    };
    Object.assign(f, base);   // (LOOK and whatever else the later groups hang on it)
    World.ext.goreRob = f;
  }
})();
