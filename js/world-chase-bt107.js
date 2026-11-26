/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the hundred-and-seventh group of the real tracks, a fourth pass:
   Cusco (js/world-chase-bt11.js, -bt29.js, -bt64.js) and Kågeröd (js/world-chase-bt40.js, -bt65.js). What the earlier groups left even
   from behind the car:
   - Cusco: between the bank and the eucalyptus the outer band (the sixty-fourth group) lies in flat patches with a lone tuft now and
     then; nothing stood on the slope. So from ~6 m to ~42 m past the barrier line the puna's ichu in loose tussock groups (straw to
     olive, docs/proge/cusco.md: »drevesa (evkaliptusi), trava, skale«), by some of them a low patch of grey stones or of the grey-brown
     soil the tussocks stand in. Nothing by the terrace walls and the side roads (the builder's excluded places), on the steep parts or
     where another leg's road is nearer.
   - Kågeröd (docs/proge/kagerod.md: »v ovinkih prodnati izletni pasovi, drugod pokošena trava«): the gravel traps were one sand colour
     from the kerb to the fence and the mown strip between the road and the fence one green. So in the traps low patches of the gravel
     itself, damp and darker or raked up and paler, and on the mown strip patches of the lawn a shade deeper or a shade drier, both lying
     on the builder's own surfaces (the trap's plane, the verge's cross-section). Never on the pits' side along the pits.
   All of it in meshes of their own (Cusco: softScen, 256 m chunks; Kågeröd: 1 km chunks marked userData.rob), no shadow of their own; the
   terrain, the road, the kerbs, the barriers and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.tuft || !BT.softScen || !BT.mix3 || !rng || !vary) return;
  const { soil, tuft, softScen, mix3 } = BT;
  const soft = (c, g, f) => { const l = (c[0] + c[1] + c[2]) / 3; return [(c[0] * (1 - g) + l * g) * f, (c[1] * (1 - g) + l * g) * f, (c[2] * (1 - g) + l * g) * f]; };

  /* ---- Cusco: tussock groups on the slopes. Every C.step m on both sides a place C.from .. C.to m past the barrier line (as the
     sixty-fourth group's band: only where this leg's road is the nearest, not in `bad`, not steeper than C.maxSl); there C.n tussocks
     within C.spread m and, one time in C.stone, a low patch beside them ---- */
  const clumps = (root, matV, gT, near, bad, seed, C) => {
    const T = API.T, st = { sopi: 0, skupine: 0, zaplate: 0 };
    if (!T || !T.br || !near || !root || !matV) return st;
    const R = rng(seed), sc = softScen(root, matV), N = T.px.length;
    const slope = (x, z) => { const d = 1.2, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); };
    const ok = (x, z, i, o, lim) => { const q = near(x, z); return !(!q || q.i < 0 || Math.abs(q.i - i) * T.ds > o + 10 || Math.abs(q.lat) < lim) && !bad(x, z); };
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R();
      const bar = sd > 0 ? T.br[i] : T.bl[i], lim = bar + C.from - 0.5;
      const o = bar + C.from + Math.pow(r1, C.pow) * (C.to - C.from), a = (r2 - 0.5) * C.step;
      const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      if (r0 > C.share || !ok(x, z, i, o, lim)) continue;
      const dy = gT(x, z) - T.hy[i]; if (!(dy > C.below && dy < C.above) || slope(x, z) > C.maxSl) continue;
      const dryK = R(); let n = 0;
      for (let q = 0, cnt = C.n[0] + Math.floor(R() * (C.n[1] - C.n[0] + 1)); q < cnt; q++) {
        const ang = R() * Math.PI * 2, d = Math.sqrt(R()) * C.spread, tx = x + Math.cos(ang) * d, tz = z + Math.sin(ang) * d, h = R(), cr = R();
        if (!ok(tx, tz, i, o, lim)) continue;
        tuft(sc.get(tx, tz), tx, gT(tx, tz), tz, 0.55 + h * 0.5, 0.45 + h * 0.45, C.tuft(R, dryK * 0.7 + cr * 0.3), R, 5); n++;
      }
      if (!n) continue;
      st.sopi += n; st.skupine++;
      if (R() < C.stone) { const ang = R() * Math.PI * 2, px = x + Math.cos(ang) * C.spread * 0.6, pz = z + Math.sin(ang) * C.spread * 0.6;
        if (ok(px, pz, i, o, lim)) { soil(sc, gT, px, pz, 0.5 + R() * 0.7, C.patch(R), R, 0.09); st.zaplate++; } }
    }
    sc.done();
    return st;
  };
  const cuMute = (c) => soft(c, 0.2, 0.97);   // (as the sixty-fourth group's)
  const CUI = { step: 2.6, from: 5.5, to: 40, pow: 1.1, share: 0.45, below: -30, above: 30, maxSl: 1.3, n: [3, 5], spread: 2.4, stone: 0.45,
    tuft: (R, k) => cuMute(vary(mix3([0.78, 0.7, 0.42], [0.6, 0.58, 0.32], k), R, 0.03)),   // (ichu: straw where it has dried, olive where it is still green)
    patch: (R) => cuMute(vary(R() < 0.55 ? mix3([0.52, 0.51, 0.47], [0.57, 0.55, 0.5], R()) : mix3([0.46, 0.42, 0.32], [0.5, 0.45, 0.34], R()), R, 0.015)) };   // (grey stones; grey-brown soil)

  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (id === 'cusco') try {
        const out = ctx.out, gT = (o && o.gH) || API.vrGround, ex = ctx.excluded || (() => false);
        const bad = o && o.bad ? (x, z) => ex(x, z) || o.bad(x, z) : ex, near = (o && o.near) || API.vrNear;
        if (out && API.T) out.sopiBt107 = clumps(ctx.root, out.matV, gT, near, bad, 107101, CUI);
      } catch (e) { console.error('chase-bt107 (cusco):', e); }
      return r;
    };
    Object.assign(f, base);   // (LOOK, hjLC, pkLC and whatever else the later groups hang on it)
    World.ext.goreRob = f;
  }

  /* ---- Kågeröd: the gravel traps and the mown strip, on the builder's own surfaces (js/world-rbring.js: the trap is a plane 2.8 cm
     over the road's from the kerb to 0.7 m before the barrier, T.gravL / T.gravR; elsewhere the verge's cross-section rbVerge) ---- */
  const KG = { damp: [0.6, 0.51, 0.34], raked: [0.8, 0.72, 0.52], deep: [0.25, 0.43, 0.18], dry: [0.44, 0.52, 0.25] };
  const kagerod = (ctx) => {
    const T = API.T, { nrGround, nrNear, Chunks } = API, st = { prod: 0, trava: 0 };
    if (!T || !T.br || !T.gravL || !T.gravR || T.bank || !Chunks || !nrGround || !nrNear || !ctx.root || !ctx.matV) return st;
    const N = T.px.length, ds = T.ds, w = T.w, cw = T.curbW || 0, R = rng(107201), ch = new Chunks(1024), ex = ctx.excluded || (() => false);
    const pd = T.def.pit, ps = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const lerp = (a, b, t) => a + (b - a) * t;
    // the verge's height over the road at index j, side sd, offset o (rbVerge's rows)
    const vergeH = (j, sd, o) => {
      const bar = sd > 0 ? T.br[j] : T.bl[j], y = T.hy[j], lift = (q, h) => Math.max(h, nrGround(T.px[j] + T.nx[j] * sd * q, T.pz[j] + T.nz[j] * sd * q) + 0.06 - y);
      const o2 = Math.max(w + 1.8, bar - 0.4), o3 = bar + 0.8;
      if (o <= w + 1.2) return lerp(0, -0.04, Math.max(0, (o - w) / 1.2));
      if (o <= o2) return lerp(-0.04, lift(o2, -0.1), (o - w - 1.2) / Math.max(0.01, o2 - w - 1.2));
      return lerp(lift(o2, -0.1), lift(o3, -0.16), Math.min(1, (o - o2) / Math.max(0.01, o3 - o2)));
    };
    // the height of the surface at (x, z) by the row nearest along the road around index i: the trap's plane or the verge
    const surf = (i, sd, trap) => (x, z) => {
      let bj = i, bt = 1e9;
      for (let k = -5; k <= 5; k++) { const j = ((i + k) % N + N) % N, t = (x - T.px[j]) * T.tx[j] + (z - T.pz[j]) * T.tz[j]; if (Math.abs(t) < Math.abs(bt)) { bt = t; bj = j; } }
      const j2 = ((bj + (bt >= 0 ? 1 : -1)) % N + N) % N, f = Math.min(1, Math.abs(bt) / ds), o = Math.abs((x - T.px[bj]) * T.nx[bj] + (z - T.pz[bj]) * T.nz[bj]);
      return trap ? lerp(T.hy[bj], T.hy[j2], f) + 0.028 : lerp(T.hy[bj] + vergeH(bj, sd, o), T.hy[j2] + vergeH(j2, sd, o), f);
    };
    const step = Math.max(1, Math.round(2.4 / ds));
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(), r3 = R();
      if (ps && sd === ps && (T.pitAt(i * ds) || T.pitAt(i * ds + 20) || T.pitAt(i * ds - 20))) continue;
      const fl = sd > 0 ? T.gravR : T.gravL, bar = sd > 0 ? T.br[i] : T.bl[i], i0 = (i - step + N) % N, i1 = (i + step) % N;
      const trap = fl[i] && fl[i0] && fl[i1];
      if (!trap && (fl[i] || fl[i0] || fl[i1])) continue;   // (the trap's tapering ends)
      const a = w + cw + 0.5, b = bar - (trap ? 1.2 : 0.7); if (b - a < (trap ? 2.4 : 1.6)) continue;
      if (r0 > (trap ? 0.8 : 0.55)) continue;
      const rr = Math.min((b - a) / 2 - 0.1, trap ? 0.7 + r1 * 0.9 : 0.5 + r1 * 0.55), o = a + rr + r2 * (b - a - 2 * rr);
      const x = T.px[i] + T.nx[i] * sd * o, z = T.pz[i] + T.nz[i] * sd * o;
      if (ex(x, z)) continue;
      const q = nrNear(x, z); if (q.i < 0 || Math.abs(Math.abs(q.lat) - o) > 0.6) continue;   // (another leg of the circuit is nearer: its ground)
      const col = trap ? vary(r3 < 0.6 ? KG.damp : KG.raked, R, 0.015) : vary(r3 < 0.55 ? KG.deep : KG.dry, R, 0.02);
      soil({ get: (px, pz) => ch.get(px, pz) }, surf(i, sd, trap), x, z, rr * 0.8, col, R, trap ? 0.03 : 0.035);
      if (trap) st.prod++; else st.trava++;
    }
    const grp = new THREE.Group(); ch.addTo(grp, ctx.matV, false, true);
    for (const m of grp.children) { m.name = 'rob'; m.userData.rob = m.userData.lj = true; }
    if (grp.children.length) ctx.root.add(grp);
    return st;
  };
  const L = (API.rbLook || {}).kagerod;
  if (L) {
    const base = L.extra;
    L.extra = function (ctx) {
      const r = (base ? base.call(this, ctx) : null) || {};
      try { r.robBt107 = kagerod(ctx); } catch (e) { console.error('chase-bt107 (kagerod):', e); }
      return r;
    };
  }
})();
