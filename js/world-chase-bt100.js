/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the hundredth group of the real tracks: Savusavu and Seoul, a
   further pass on two tracks whose roadside the eighth, thirtieth and seventy-second groups (Savusavu: js/world-chase-bt8.js,
   js/world-chase-bt30.js, js/world-chase-bt72.js: the verge and bank, the edge's red-brown dust, flat patches and single bushes to
   ~60 m) and the thirty-seventh, sixtieth and eighty-second (Seoul: js/world-chase-bt37.js, js/world-chase-bt60.js,
   js/world-chase-bt82.js: the strip to the blocks, the litter's drift, flat undergrowth patches, the town's slabs) already set.
   From behind the car both still read flat past the first metres: on Savusavu the grass between the road, the houses and the forest
   was one speckled face with flat bright patches lying on it and nothing standing between the single bushes; on Seoul the forest floor
   past the blocks was flat patches only and the strip under the woods one pale face. So here what stands and lies on that ground, in
   clumps (several together, then a gap), as it grows:
   Savusavu (docs/proge/savusavu.md: »trava na planoti«, »kokosove palme in vrtovi ob hišah«, »vlažen tropski gozd na slemenu«,
   »temen bazalt«): from ~1.5 m past the asphalt to ~60 m the grass in clumps of tussocks (the wet green and the sun-bleached), by the
   houses (built ground within ~16 m) the palms' dry fallen fronds and husks on the grass, under the forest fern clumps and fallen
   branches. Nothing on built ground (3), rock or water, in the builder's excluded places, at the barrier's line, far below the road or
   on the steep. In meshes of its own (softScen: 256 m chunks, no shadow).
   Seoul (docs/proge/seoul.md: »gozd rdečega bora in hrasta … tla iglice in listje z zelenim podrastjem«, the granite of the hill in
   the old wall's blocks): under the woods (land cover 1) past the blocks to ~60 m the green undergrowth standing in clumps, fallen
   branches and now and then a pale granite stone; on the strip between the kerb and the blocks the pines' needles and the oaks'
   leaves in short streaks. Nothing in the town, on the lawns, at the crossings, by the buildings or the landmarks (noTree, nearCross).
   In Seoul's own scenery chunks (no draw is added).
   The terrain, the road, the barriers, the trees, the horizon and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API, LK = API.PL_LOOK;
  if (!BT || !BT.tuft || !BT.cushion || !BT.softScen || !BT.mix3 || !rng || !vary) return;
  const { tuft, cushion, softScen, mix3, chain } = BT;
  // (a fifth of the way to their grey and a little darker, as the earlier groups: it reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95, g = 0.2; return [(c[0] * (1 - g) + l * g) * f, (c[1] * (1 - g) + l * g) * f, (c[2] * (1 - g) + l * g) * f]; };
  const C_ = (R, ab, j) => mute(vary(mix3(ab[0], ab[1], R()), R, j || 0.015));

  /* a thin low streak lying on the ground along (ax, az), tapering to both ends (the eighty-second group's) */
  const streak = (g, gH, x, z, ax, az, len, wid, col, R, lift, seg) => {
    const bx = -az, bz = ax, n = seg || 3, up = lift || 0.04, rim = [col[0] * 0.92 + 0.04, col[1] * 0.92 + 0.05, col[2] * 0.92 + 0.03], L = [], P = [], C = [];
    for (let k = 0; k <= n; k++) {
      const u = (k / n - 0.5) * len, t = Math.sin(Math.PI * k / n), hw = wid * 0.5 * (0.2 + 0.8 * t) * (0.8 + R() * 0.4), j = (R() - 0.5) * wid * 0.3;
      const cx = x + ax * u + bx * j, cz = z + az * u + bz * j;
      L.push([cx + bx * hw, gH(cx + bx * hw, cz + bz * hw) + up, cz + bz * hw]); P.push([cx - bx * hw, gH(cx - bx * hw, cz - bz * hw) + up, cz - bz * hw]); C.push([cx, gH(cx, cz) + up + 0.006, cz]);
    }
    for (let k = 0; k < n; k++) {
      const inn = [C[k][0], C[k][1] - 5, C[k][2]];
      g.triO(C[k], L[k], L[k + 1], col, inn, rim, rim); g.triO(C[k], L[k + 1], C[k + 1], col, inn, rim, col);
      g.triO(C[k], P[k + 1], P[k], col, inn, rim, rim); g.triO(C[k], C[k + 1], P[k + 1], col, inn, col, rim);
    }
  };
  /* n things round (x, z) within rad, each where ok(x, z): put(x, z, k) */
  const clump = (R, x, z, n, rad, ok, put) => { let m = 0;
    for (let k = 0; k < n; k++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()) * rad, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d; if (k && !ok(px, pz)) continue; put(px, pz, k); m++; }
    return m; };

  /* ---- Savusavu: the grass in tussocks, the palms' fallen fronds by the houses, ferns and branches under the forest ---- */
  const SV = {
    green: [[0.27, 0.47, 0.16], [0.33, 0.51, 0.2]], bleach: [[0.45, 0.54, 0.26], [0.5, 0.57, 0.29]],
    frond: [[0.6, 0.52, 0.32], [0.66, 0.57, 0.36]], husk: [[0.47, 0.38, 0.27], [0.52, 0.42, 0.3]],
    fern: [[0.2, 0.42, 0.14], [0.26, 0.47, 0.17]], branch: [[0.42, 0.35, 0.27], [0.47, 0.4, 0.31]],
  };
  const savusavu = (ctx) => {
    const T = API.T, st = { sopi: 0, listi: 0, lupine: 0, praprot: 0, veje: 0 }, matV = ctx.matV || (ctx.out && ctx.out.matV);
    if (!ctx.out || !ctx.root || !matV || !T || !T.br || (T.def && T.def.id !== 'savusavu')) return st;
    const near = API.vrNear, gT = API.caGround || API.vrGround, lc = API.vrLC; if (!near || !gT || !lc) return st;
    const ex = ctx.excluded || (() => false), wet = API.vrWater ? (x, z) => { const q = API.vrWater(x, z); return q && q.e > -4; } : () => false;
    const sea = ctx.out.sea, slope = (x, z) => { const d = 1.0, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
    const N = T.px.length, ds = T.ds, R = rng(100101), soft = softScen(ctx.root, matV), step = Math.max(1, Math.round(3 / ds));
    const houses = (x, z) => { for (const [u, v] of [[16, 0], [-16, 0], [0, 16], [0, -16], [11, 11], [-11, -11], [11, -11], [-11, 11]]) if (lc(x + u, z + v) === 3) return true; return false; };
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) {
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > 0.85) continue;
      const w = T.wAt ? T.wAt(i) : T.w, bar = sd > 0 ? T.br[i] : T.bl[i], o = w + 1.5 + Math.pow(r1, 1.5) * 58;
      const x0 = T.px[i] + T.nx[i] * sd * o + T.tx[i] * (r2 - 0.5) * 4, z0 = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * (r2 - 0.5) * 4, y0 = T.hy[i];
      const ok = (x, z) => { const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * ds > o + 10 || q.lat * sd < 0) return false;
        const a = Math.abs(q.lat); if (a < w + 1.2 || Math.abs(a - bar) < 0.6 || ex(x, z) || wet(x, z)) return false;
        const y = gT(x, z); if (!(y > y0 - 14) || (sea !== undefined && !(y > sea + 0.8))) return false;
        const c = lc(x, z); return c !== 3 && c !== 5 && c !== 4 && c !== 7 && slope(x, z) < 1.0; };
      if (!ok(x0, z0)) continue;
      const c = lc(x0, z0), u = R(), far = 1 + 0.5 * Math.min(1, o / 60);
      if (c === 1) {
        if (u < 0.6) st.praprot += clump(R, x0, z0, 3 + (R() * 3 | 0), 1.3, ok, (x, z) => { const h = R(); tuft(soft.get(x, z), x, gT(x, z), z, (0.55 + h * 0.45) * far, 0.42 + h * 0.36, C_(R, SV.fern, 0.03), R, 5); });
        else { const a = R() * Math.PI * 2; streak(soft.get(x0, z0), gT, x0, z0, Math.cos(a), Math.sin(a), 1.8 + R() * 2.2, 0.12 + R() * 0.08, C_(R, SV.branch), R, 0.07, 3); st.veje++; }
        continue;
      }
      const home = o > 4 && houses(x0, z0);
      if (home && u < 0.16) { const a = R() * Math.PI * 2;   // a dry fallen frond: the pale blade and its midrib
        streak(soft.get(x0, z0), gT, x0, z0, Math.cos(a), Math.sin(a), 2.2 + R() * 1.4, 0.55 + R() * 0.3, C_(R, SV.frond), R, 0.07, 4);
        streak(soft.get(x0, z0), gT, x0, z0, Math.cos(a), Math.sin(a), 2.6 + R() * 1.2, 0.07, C_(R, SV.husk), R, 0.09, 2); st.listi++; continue; }
      if (home && u < 0.24) { st.lupine += clump(R, x0, z0, 2 + (R() * 3 | 0), 0.8, ok, (x, z) => { cushion(soft.get(x, z), x, gT(x, z) + 0.06, z, 0.2 + R() * 0.08, 0.13 + R() * 0.05, C_(R, SV.husk, 0.02), R); }); continue; }
      const pale = R() < 0.4;
      st.sopi += clump(R, x0, z0, 5 + (R() * 5 | 0), 1.4 + R() * 1.1, ok, (x, z) => { const h = R();
        tuft(soft.get(x, z), x, gT(x, z), z, (0.5 + h * 0.45) * far, (0.42 + h * 0.45) * (o < 4 ? 0.6 : 1), C_(R, pale && R() < 0.8 ? SV.bleach : SV.green, 0.03), R, 5); });
    }
    soft.done();
    return st;
  };
  if (LK && LK.savusavu && chain) chain(LK.savusavu, (ctx) => { try { const s = savusavu(ctx); if (ctx.out) ctx.out.robBt100 = s; } catch (e) { console.error('chase-bt100 (savusavu):', e); } });

  /* ---- Seoul (its own builder, js/world-seoul.js: World.ext.seoulRob({ scen, noTree, nearCross, out }) chained again) ---- */
  const SE = {
    under: [[0.29, 0.44, 0.19], [0.36, 0.49, 0.22]], fern: [[0.26, 0.4, 0.17], [0.32, 0.45, 0.2]],
    branch: [[0.43, 0.36, 0.28], [0.48, 0.4, 0.31]], granite: [[0.62, 0.6, 0.56], [0.68, 0.65, 0.6]],
    needle: [[0.52, 0.38, 0.25], [0.56, 0.42, 0.27]], leaf: [[0.5, 0.42, 0.29], [0.46, 0.39, 0.27]],
  };
  const seoul = ({ scen, noTree, nearCross }) => {
    const T = API.T, { nrGround, nrLC, nrNear } = API, st = { podrast: 0, veje: 0, kamni: 0, iglice: 0 };
    if (!T || !T.br || !T.wAt || !T.hy || !nrGround || !nrLC || !nrNear || !scen) return st;
    const N = T.px.length, ds = T.ds, R = rng(100201);
    const at = (i, sd, o, a) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
    const slope = (x, z) => { const d = 0.8, a = nrGround(x + d, z) - nrGround(x - d, z), b = nrGround(x, z + d) - nrGround(x, z - d); return Math.hypot(a, b) / (2 * d); };
    // the strip's top from the kerb to the blocks (the thirty-seventh group's profile: the road's height + 0.05, or the ground)
    const top = (x, z) => { const q = nrNear(x, z); return q.i >= 0 ? Math.max(T.hy[q.i] + 0.05, nrGround(x, z) + 0.06) : nrGround(x, z) + 0.06; };
    const s1 = Math.max(1, Math.round(2.5 / ds));
    for (let i = 0; i < N; i += s1) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > 0.85 || nearCross(i * ds, 9)) continue;
      const w = T.wAt(i), bar = sd > 0 ? T.br[i] : T.bl[i], vw = bar - 0.5 - (w + 0.7); if (vw < 0.5) continue;
      const [x, z] = at(i, sd, w + 0.7 + r1 * vw, (r2 - 0.5) * 2.5), q = nrNear(x, z);
      if (q.i < 0 || Math.abs(q.i - i) * ds > 6 || q.lat * sd < 0 || nrLC(x, z) !== 1 || noTree(x, z)) continue;
      const a = (R() - 0.5) * 0.9, ax = T.tx[i] * Math.cos(a) - T.tz[i] * Math.sin(a), az = T.tz[i] * Math.cos(a) + T.tx[i] * Math.sin(a);
      streak(scen.get(x, z), top, x, z, ax, az, 0.9 + R() * 1.6, 0.2 + R() * 0.24, C_(R, R() < 0.6 ? SE.needle : SE.leaf), R, 0.014, 3); st.iglice++;
    }
    const s2 = Math.max(1, Math.round(3.5 / ds));
    for (let i = 0; i < N; i += s2) for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) {
      const r0 = R(), r1 = R(), r2 = R(); if (r0 > 0.9 || nearCross(i * ds, 12)) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + 2 + Math.pow(r1, 1.6) * 56, [x0, z0] = at(i, sd, o, (r2 - 0.5) * 3.5), y0 = T.hy[i];
      const ok = (x, z) => { const q = nrNear(x, z);
        return q.i >= 0 && Math.abs(q.i - i) * ds <= o + 10 && q.dd > 1.6 && q.lat * sd > 0 && nrLC(x, z) === 1 && !noTree(x, z) && slope(x, z) < 1.0 && Math.abs(nrGround(x, z) - y0) < 12; };
      if (!ok(x0, z0)) continue;
      const u = R(), far = 1 + 0.5 * Math.min(1, (o - bar) / 58);
      if (u < 0.62) { const fern = R() < 0.4;
        st.podrast += clump(R, x0, z0, 4 + (R() * 3 | 0), 1.2 + R() * 0.7, ok, (x, z) => { const h = R();
          tuft(scen.get(x, z), x, nrGround(x, z), z, (0.52 + h * 0.42) * far, 0.38 + h * 0.4, C_(R, fern ? SE.fern : SE.under, 0.03), R, 5); }); }
      else if (u < 0.88) { const a = R() * Math.PI * 2; streak(scen.get(x0, z0), nrGround, x0, z0, Math.cos(a), Math.sin(a), 1.8 + R() * 2.2, 0.12 + R() * 0.08, C_(R, SE.branch), R, 0.07, 3); st.veje++; }
      else { const h = R(); cushion(scen.get(x0, z0), x0, nrGround(x0, z0) + 0.03, z0, (0.4 + h * 0.45) * far, 0.22 + h * 0.24, C_(R, SE.granite, 0.02), R); st.kamni++; }
    }
    return st;
  };
  {
    const base = World.ext && World.ext.seoulRob;
    if (World.ext) World.ext.seoulRob = (ctx) => {
      if (base) base(ctx);
      try { if (ctx && ctx.out) ctx.out.robBt100 = seoul(ctx); } catch (e) { console.error('chase-bt100 (seoul):', e); }
    };
  }
})();
