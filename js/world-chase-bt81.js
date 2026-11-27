/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the eighty-first group of the real tracks, a further pass: El Jem
   (its own builder, js/world-eljem.js: after js/world-chase-bt38.js and js/world-chase-bt56.js on World.ext.eljemRob) and Killar (its own
   builder, js/world-killar.js: after js/world-chase-bt13.js and js/world-chase-bt50.js on World.ext.goreRob). From behind the car El Jem's
   asphalt still met the ochre strip in one clean line between the sand drifts, and from ~14 m to ~48 m past the barriers (between the
   fifty-sixth group's stones and its far band) the open ground stood bare; Killar's gravel shelf ended on the verge in a clean line, and on
   the uphill side the slope under the cuts and the rockfall net had none of the slate that falls from them.
   El Jem (docs/proge/eljem.md: »oljke in palme na suhih okrastih tleh«): a worn edge, the ochre grit and the pale dust off the asphalt in
   thin broken patches 0.05-0.75 m past its edge; from ~14 m to ~48 m past the barrier line the halfa's tussocks in loose clumps, wide low
   patches of the ochre earth and the dust, a few limestone stones, thinning with distance (fewer in the olive groves, land cover 2, and
   on the town's open lots, land cover 3, where the houses themselves stay free).
   Killar (docs/proge/killar.md: »en sam pas makadama na polici … sivo rjav skrilavec in gnajs … melišča«): a worn edge, the gravel's
   grey-brown grit and the dust spread past it; on the uphill side only (where the ground ~6 m out is above the road) the slate's fallen
   stones at the foot of the cut, the scree's pale tongues down to the road, and out to ~60 m (only where the ground is not below the road) a sparse band of straw and slate patches with
   straw tufts. Nothing over the drop, on the snow, in the villages, at the fort, where another leg's road is nearer or on a face too steep.
   The horizon stays the existing DEM terrain. All of it in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road,
   the barriers, the nets, the trees and the driving stay as they are. Colours mid tones (nothing dark).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion } = BT;
  // (as js/world-chase-bt73.js: a third of the way toward the colour's grey and a little darker, so a patch reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, a, b, k) => mute(vary(mix3(a, b, R()), R, 0.015), k);

  /* a thin low tongue lying on the ground along (ax, az), tapering to both ends (as js/world-chase-bt56.js's streak) */
  const streak = (scen, gH, x, z, ax, az, len, wid, col, R, lift) => {
    const g = scen.get(x, z), bx = -az, bz = ax, n = 4, up = lift || 0.04, rim = [col[0] * 0.92 + 0.04, col[1] * 0.92 + 0.05, col[2] * 0.92 + 0.03], L = [], P = [], C = [];
    for (let k = 0; k <= n; k++) {
      const u = (k / n - 0.5) * len, t = Math.sin(Math.PI * k / n), hw = wid * 0.5 * (0.2 + 0.8 * t) * (0.8 + R() * 0.4), j = (R() - 0.5) * wid * 0.3;
      const cx = x + ax * u + bx * j, cz = z + az * u + bz * j;
      L.push([cx + bx * hw, gH(cx + bx * hw, cz + bz * hw) + up, cz + bz * hw]); P.push([cx - bx * hw, gH(cx - bx * hw, cz - bz * hw) + up, cz - bz * hw]); C.push([cx, gH(cx, cz) + up + 0.008, cz]);
    }
    for (let k = 0; k < n; k++) {
      const inn = [C[k][0], C[k][1] - 5, C[k][2]];
      g.triO(C[k], L[k], L[k + 1], col, inn, rim, rim); g.triO(C[k], L[k + 1], C[k + 1], col, inn, rim, col);
      g.triO(C[k], P[k + 1], P[k], col, inn, rim, rim); g.triO(C[k], C[k + 1], P[k + 1], col, inn, col, rim);
    }
  };
  const at = (T, i, sd, o, a) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];

  /* ---- El Jem ---- */
  const EJ = { ochre: [0.68, 0.52, 0.35], dust: [0.77, 0.64, 0.46], grit: [0.66, 0.58, 0.47], halfa: [0.7, 0.65, 0.42], halfa2: [0.63, 0.6, 0.37],
    earth: [0.64, 0.48, 0.32], stone: [0.8, 0.76, 0.67], stone2: [0.73, 0.68, 0.59] };
  const ejRob = (ctx) => {
    const T = API.T, { nrGround, nrLC, nrNear } = API, st = { rob: 0, pas: 0, halfa: 0, kamni: 0 };
    if (!T || !T.br || !T.wAt || !nrGround || !nrLC || !nrNear || !ctx.root || !ctx.matV) return st;
    const soft = softScen(ctx.root, ctx.matV), ex = ctx.excluded || (() => false), fort = ctx.inFort || (() => false), R = rng(81101), N = T.px.length;
    const bad = (x, z) => ex(x, z) || fort(x, z) || nrLC(x, z) === 3 || nrLC(x, z) === 5;
    // (the band: the map has the whole town around the track as built ground, land cover 3, but between the road and the houses it is open
    // sandy ground; the houses, the amphitheatre and the viewpoints are the builder's excluded places, so there only those and the water)
    const bad2 = (x, z) => ex(x, z) || fort(x, z) || nrLC(x, z) === 5;
    const slope = (x, z) => { const d = 0.8, a = nrGround(x + d, z) - nrGround(x - d, z), b = nrGround(x, z + d) - nrGround(x, z - d); return Math.hypot(a, b) / (2 * d); };
    // (the strip's height just past the asphalt: the builder's -0.04 fall over 0.8 m, lifted onto the ground where it rises)
    const eY = (x, z) => { const q = nrNear(x, z), g = nrGround(x, z); if (q.i < 0) return g; const o = Math.abs(q.lat), w = T.wAt(q.i);
      return Math.max(T.hy[q.i] - (o <= w ? 0 : 0.04 * Math.min(1, (o - w) / 0.8)), g + 0.04) + 0.006; };
    const own = (x, z, i, d) => { const q = nrNear(x, z); return q.i >= 0 && Math.abs(q.i - i) * T.ds < d; };
    const step = Math.max(1, Math.round(2.5 / T.ds));
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {   // the worn edge
      if (R() > 0.55) continue;
      const w = T.wAt(i), o = w + 0.05 + R() * 0.7, [x, z] = at(T, i, sd, o, (R() - 0.5) * 2);
      if (!own(x, z, i, 8) || ex(x, z) || fort(x, z)) continue;
      const r = R(); soil(soft, eY, x, z, 0.3 + R() * 0.45, r < 0.45 ? C3(R, EJ.ochre, EJ.earth) : r < 0.8 ? C3(R, EJ.dust, EJ.ochre) : C3(R, EJ.grit, EJ.dust), R, 0.02); st.rob++;
    }
    // from ~14 m to ~48 m past the barrier line: thinning with distance, every ~6 m on both sides
    const bs = Math.max(1, Math.round(6 / T.ds));
    for (let i = 0; i < N; i += bs) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(), bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + 14 + r1 * 34;
      if (r0 > 0.7 - 0.35 * (o - bar - 14) / 34) continue;
      const [x, z] = at(T, i, sd, o, (r2 - 0.5) * 6), q = nrNear(x, z);
      if (q.i < 0 || Math.abs(q.i - i) * T.ds > o + 10 || q.dd < 10 || bad2(x, z) || slope(x, z) > 0.8) continue;
      const c = nrLC(x, z); if ((c === 2 || c === 3) && R() < (c === 2 ? 0.6 : 0.35)) continue;
      const k = 1 + 0.5 * (o - bar - 14) / 34;   // (farther out wider, so they still read from the road)
      if (R() < 0.6) { soil(soft, nrGround, x, z, (1.4 + R() * 1.6) * k, R() < 0.55 ? C3(R, EJ.ochre, EJ.earth, 0.93) : C3(R, EJ.dust, EJ.ochre, 0.93), R, 0.06); st.pas++; }
      for (let j = 0, n = 2 + Math.floor(R() * 3); j < n; j++) {
        const tx = x + (R() - 0.5) * 5, tz = z + (R() - 0.5) * 5, h = R(); if (bad2(tx, tz)) continue;
        tuft(soft.get(tx, tz), tx, nrGround(tx, tz), tz, 0.28 + h * 0.24, 0.28 + h * 0.3, vary(mix3(EJ.halfa, EJ.halfa2, R()), R, 0.025), R, 5); st.halfa++;
      }
      if (R() < 0.3) { const sx = x + (R() - 0.5) * 4, sz = z + (R() - 0.5) * 4, s = R();
        if (!bad2(sx, sz)) { cushion(soft.get(sx, sz), sx, nrGround(sx, sz), sz, 0.22 + s * 0.3, 0.12 + s * 0.12, vary(mix3(EJ.stone, EJ.stone2, R()), R, 0.02), R); st.kamni++; } }
    }
    soft.done();
    return st;
  };
  {
    const base = World.ext.eljemRob;   // (js/world-chase-bt56.js's, which calls bt38's and the builder's first)
    if (base) World.ext.eljemRob = (ctx) => {
      const r = base(ctx) || {};
      try { if (ctx && ctx.root && ctx.matV) r.robBt81 = ejRob(ctx); } catch (e) { console.error('chase-bt81 (eljem):', e); }
      return r;
    };
  }

  /* ---- Killar ---- */
  const KL = { grit: [0.56, 0.51, 0.43], grit2: [0.6, 0.55, 0.46], dust: [0.67, 0.61, 0.49], slate: [0.53, 0.51, 0.47], slate2: [0.6, 0.57, 0.52],
    scree: [0.63, 0.6, 0.55], straw: [0.65, 0.59, 0.4], olive: [0.52, 0.51, 0.33] };
  const klRob = (ctx, o) => {
    const T = API.T, st = { rob: 0, kamni: 0, melisca: 0, pas: 0, sopi: 0 };
    const gH = o.gH || API.vrGround, slope = o.slope || API.vrSlope, near = o.near || API.vrNear, lc = o.lc || API.vrLC;
    if (!T || !T.br || !T.wAt || !gH || !slope || !near || !lc || !ctx.root || !ctx.out || !ctx.out.matV) return st;
    const ex = ctx.excluded || (() => false), R = rng(81201), N = T.px.length, soft = softScen(ctx.root, ctx.out.matV);
    const bad = (x, z) => { if (ex(x, z) || (o.bad && o.bad(x, z))) return true; const c = lc(x, z); return c === 3 || c === 5 || c === 6; };
    // (the verge's own height, as js/world-chase-bt50.js's prof: the road mesh's shoulder a little above the ground)
    const prof = (i, o2, side) => { const w = T.wAt(i), bar = side > 0 ? T.br[i] : T.bl[i];
      const P = [[w, 0], [w + 0.8, -0.04], [Math.max(w + 1.2, bar - 0.3), -0.08], [bar + 0.8, -0.16], [bar + 3.2, -0.4]];
      if (o2 <= P[0][0]) return 0; for (let k = 1; k < P.length; k++) if (o2 <= P[k][0]) { const t = (o2 - P[k - 1][0]) / Math.max(0.01, P[k][0] - P[k - 1][0]); return P[k - 1][1] + (P[k][1] - P[k - 1][1]) * t; }
      return null; };
    const gV = (x, z) => { const q = near(x, z), g = gH(x, z); if (q.i < 0) return g; const h = prof(q.i, Math.abs(q.lat), q.lat < 0 ? -1 : 1);
      return h == null ? g : Math.max(T.hy[q.i] + h, g + 0.06) - 0.02; };
    const own = (x, z, i, d) => { const q = near(x, z); return q.i >= 0 && Math.abs(q.i - i) * T.ds < d; };
    const step = Math.max(1, Math.round(2.5 / T.ds));
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {
      const w = T.wAt(i), bar = sd > 0 ? T.br[i] : T.bl[i], hy = T.hy[i];
      if (R() < 0.55) {   // the worn edge: the gravel's grit and the dust spread just past it
        const o2 = w + 0.05 + R() * Math.min(0.7, Math.max(0.2, bar - w - 0.4)), [x, z] = at(T, i, sd, o2, (R() - 0.5) * 2), y = gV(x, z);
        if (own(x, z, i, 8) && !bad(x, z) && y > hy - 0.6 && y < hy + 0.6) {
          const r = R(); soil(soft, gV, x, z, 0.3 + R() * 0.45, r < 0.6 ? C3(R, KL.grit, KL.grit2) : C3(R, KL.dust, KL.grit2), R, 0.02); st.rob++; }
      }
      const [ux, uz] = at(T, i, sd, Math.max(bar, w + 3) + 6, 0); if (!(gH(ux, uz) > hy + 0.3)) continue;   // the rest on the uphill side only
      if (R() < 0.45) for (let k = 0, n = 1 + Math.floor(R() * 3); k < n; k++) {   // the slate's fallen stones at the foot of the cut
        const o2 = Math.max(bar, w + 0.6) + 0.2 + Math.pow(R(), 1.4) * 4, [x, z] = at(T, i, sd, o2, (R() - 0.5) * 2.5);
        if (!own(x, z, i, 8) || bad(x, z) || slope(x, z) > 1.4) continue;
        const s = R(); cushion(soft.get(x, z), x, gV(x, z), z, 0.14 + s * 0.24, 0.08 + s * 0.12, C3(R, KL.slate, KL.slate2, 1), R); st.kamni++;
      }
      if (R() < 0.08) {   // a scree tongue down the slope to the road
        const o2 = Math.max(bar, w + 1) + 2 + R() * 5, [x, z] = at(T, i, sd, o2, (R() - 0.5) * 2);
        if (own(x, z, i, 10) && !bad(x, z) && slope(x, z) < 1.6) { streak(soft, gV, x, z, T.nx[i] * sd, T.nz[i] * sd, 3 + R() * 4, 0.9 + R() * 1, C3(R, KL.scree, KL.slate2, 0.95), R, 0.05); st.melisca++; }
      }
    }
    // out to ~60 m where the ground is not below the road: a sparse band of straw and slate patches with straw tufts, thinning with distance
    const bs = Math.max(1, Math.round(7 / T.ds));
    for (let i = 0; i < N; i += bs) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(), bar = Math.max(sd > 0 ? T.br[i] : T.bl[i], T.wAt(i) + 3), o2 = bar + 12 + r1 * 48;
      if (r0 > 0.45 - 0.2 * (o2 - bar - 12) / 48) continue;
      const [x, z] = at(T, i, sd, o2, (r2 - 0.5) * 7), q = near(x, z);
      if (q.i < 0 || Math.abs(q.i - i) * T.ds > o2 + 10 || bad(x, z)) continue;
      const y = gH(x, z); if (!(y > T.hy[i] - 1) || slope(x, z) > 0.95) continue;
      const k = 1 + 0.5 * (o2 - bar - 12) / 48, r = R();
      soil(soft, gH, x, z, (1.3 + R() * 1.4) * k, r < 0.45 ? C3(R, KL.straw, KL.olive, 0.85) : r < 0.75 ? C3(R, KL.olive, KL.straw, 0.85) : C3(R, KL.slate, KL.scree, 0.88), R, 0.06); st.pas++;
      if (R() < 0.5) for (let j = 0, n = 1 + Math.floor(R() * 2); j < n; j++) {
        const tx = x + (R() - 0.5) * 4, tz = z + (R() - 0.5) * 4, h = R(); if (bad(tx, tz)) continue;
        tuft(soft.get(tx, tz), tx, gH(tx, tz), tz, 0.26 + h * 0.2, 0.3 + h * 0.3, vary(mix3(KL.straw, KL.olive, R() * 0.6), R, 0.03), R, 5); st.sopi++;
      }
    }
    soft.done();
    return st;
  };
  {
    const base = World.ext.goreRob;   // (js/world-chase-bt50.js's, which calls bt11's)
    if (base) {
      const f = function (ctx, id, o) {
        let r = base.call(this, ctx, id, o);
        if (id === 'killar') try { r = r || {}; r.bt81 = klRob(ctx, o || {}); if (ctx.out) ctx.out.rob = r; } catch (e) { console.error('chase-bt81 (killar):', e); }
        return r;
      };
      Object.assign(f, base);   // (LOOK and the other properties stay the same objects)
      World.ext.goreRob = f;
    }
  }
})();
