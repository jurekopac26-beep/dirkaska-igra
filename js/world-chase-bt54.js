/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the fifty-fourth group of the real tracks: Termas de Río Hondo
   and Sepang, a second pass. From behind the car both still showed one even face behind the barriers: in Río Hondo the mown lawn in
   one green out across the plain (the autumn straw and the bare earth only a tint of the look's colMod), in Sepang the watered
   lawns in one fresh green to the trees. So here (the shared circuit builder, js/world-rbring.js: each look's LK.extra chained on top
   of the earlier ones) low flat patches of what lies there (docs/proge/riohondo.md, docs/proge/sepang.md) from 0.6 m behind the
   barriers to ~16 m and, sparser and wider, out to ~60 m. Río Hondo: the mown lawn's two greens by the barriers, past ~6 m the dry
   straw-yellow grass and the bare grey-brown earth of the Chaco, under and at the edge of the monte its dark dusty floor, with a few
   low dry thorny tufts; never in the lake or below its level. Sepang: the lawn's lighter and darker greens, the dark wet green in the
   hollows and by the woods, and rarer the red laterite where the lawn wears thin. Never on the pits' side along the pits, the built
   ground (land cover 3), the excluded places, steep ground or where another leg of the track is nearer. All of it in the builder's
   own scenery chunks (no draw is added); the terrain, the road, the barriers and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.tuft || !BT.mix3 || !vary || !rng) return;
  const { soil, tuft, mix3 } = BT;
  const pick = (a, b, amt) => (R) => vary(mix3(a, b, R()), R, amt || 0.015);

  /* the common walk (as skupina 37's Sakhir): `patch(x, z, o, R, far)` gives a colour (or null) for a place o m behind the barrier */
  const walk = (ctx, seed, ok, patch, extra, dn, df, sz) => {
    dn = dn || 0.72; df = df || 0.55; sz = sz || 1;
    const T = API.T, { nrGround, nrNear, nrSlope } = API, st = { zaplate: 0, pas: 0, sopi: 0 };
    if (!T || !T.br || !nrGround || !nrNear || !ctx || !ctx.scen) return st;
    const scen = ctx.scen, ex = ctx.excluded || (() => false), pd = T.def.pit, ps = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const pit = (s, sd) => ps && sd === ps && (!!T.pitAt(s) || (T.pitLead ? T.pitLead(s) >= 0 : false));
    const good = (x, z, r) => { const q = nrNear(x, z); return q.i >= 0 && q.dd > r && ok(x, z) && !ex(x, z) && (!nrSlope || nrSlope(x, z) < 0.6); };
    const at = (i, sd, o, a) => { const d = sd * ((sd > 0 ? T.br[i] : T.bl[i]) + o); return [T.px[i] + T.nx[i] * d + T.tx[i] * a, T.pz[i] + T.nz[i] * d + T.tz[i] * a]; };
    const R = rng(seed), N = T.px.length, near = Math.max(1, Math.round(3.2 / T.ds)), far = Math.max(1, Math.round(8 / T.ds));
    for (let i = 0; i < N; i += near) for (const sd of [-1, 1]) {   // behind the barriers: 0.6 to ~16 m
      for (let k = 0; k < 2; k++) {
        const r0 = R(), r1 = R(), r2 = R(); if (pit(i * T.ds, sd) || r0 > dn) continue;
        const o = 0.6 + Math.pow(r1, 1.25) * 15, [x, z] = at(i, sd, o, (r2 - 0.5) * 3.2), rr = (0.7 + R() * (0.6 + o * 0.06)) * sz;
        if (!good(x, z, Math.min(o, 0.5 + rr * 0.6))) continue;
        const col = patch(x, z, o, R, false); if (!col) continue;
        soil(scen, nrGround, x, z, rr, col, R, 0.04); st.zaplate++;
        if (extra) st.sopi += extra(scen, x, z, rr, R, good);
      }
    }
    for (let i = 0; i < N; i += far) for (const sd of [-1, 1]) {   // out to ~60 m: wider and fewer
      const r0 = R(), r1 = R(), r2 = R(); if (pit(i * T.ds, sd) || r0 > df) continue;
      const o = 16 + r1 * 44, [x, z] = at(i, sd, o, (r2 - 0.5) * 8), q = nrNear(x, z);
      if (q.i < 0 || Math.abs(q.i - i) * T.ds > o + 10 || !good(x, z, 10)) continue;   // (another leg nearer: its own band)
      const col = patch(x, z, o, R, true); if (!col) continue;
      const k = 1 + 0.5 * (o - 16) / 44; soil(scen, nrGround, x, z, (1.6 + R() * 1.6) * k * sz, col, R, 0.05); st.pas++;
    }
    return st;
  };
  const chain = (id, key, fn) => {
    const L = (API.rbLook || {})[id]; if (!L) return;
    const base = L.extra;
    L.extra = function (ctx) {
      const r = (base ? base.call(this, ctx) : null) || {};
      try { r[key] = fn(ctx); } catch (e) { console.error('chase-bt54 (' + id + '):', e); }
      return r;
    };
  };

  /* ---- Río Hondo: docs/proge/riohondo.md: »jesensko popoldne v Gran Chacu: pokošene trate ob ograjah, dlje suha slamnata trava z
     lisami gole zemlje; gozdiči suhega gozda (monte) … s trnatim grmičjem«. By the barriers the mown greens; past ~6 m more and more
     of the straw and the bare earth; in and by the monte its dark dusty floor; a few low dry tufts round the straw ---- */
  const RH = {
    lawn: pick([0.4, 0.5, 0.25], [0.35, 0.45, 0.22]),
    straw: pick([0.7, 0.62, 0.4], [0.62, 0.55, 0.35]),
    earth: pick([0.56, 0.48, 0.38], [0.5, 0.43, 0.34]),
    monte: pick([0.42, 0.38, 0.28], [0.38, 0.36, 0.26]),
    tuft: pick([0.58, 0.52, 0.32], [0.48, 0.46, 0.28], 0.03),
  };
  chain('riohondo', 'robBt54', (ctx) => {
    const { nrLC, nrLCf, nrGround } = API, T = API.T; if (!nrLC || !T) return null;
    const L = (T.def.sk || {}).lake, ly = L && isFinite(L.y) ? L.y + 0.35 : -1e9;
    const ok = (x, z) => { const c = nrLC(x, z); return (c === 0 || c === 1 || c === 2) && nrGround(x, z) > ly; };
    let onStraw = false;
    return walk(ctx, 54101, ok, (x, z, o, R) => {
      onStraw = false;
      const c = nrLC(x, z), wood = c === 1 ? 1 : (nrLCf ? nrLCf(x, z, 1) : 0), r = R();
      if (c === 2 && o < 10) return null;   // (the fields and the shore: the look's colMod paints them)
      if (wood > 0.35) return r < 0.7 ? RH.monte(R) : RH.earth(R);
      const dry = Math.min(1, Math.max(0, (o - 5) / 14));
      if (r < 0.12 + 0.5 * dry) { onStraw = true; return RH.straw(R); }
      if (r < 0.2 + 0.68 * dry) return RH.earth(R);
      return RH.lawn(R);
    }, (scen, x, z, rr, R, good) => {   // a few low dry tufts round the straw
      if (!onStraw || R() > 0.35) return 0; let n = 0;
      for (let q = 0, m = 1 + Math.floor(R() * 2); q < m; q++) {
        const a = R() * Math.PI * 2, d = rr * (0.7 + R() * 0.5), px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, h = R();
        if (!good(px, pz, 0.8)) continue;
        tuft(scen.get(px, pz), px, API.nrGround(px, pz), pz, 0.24 + h * 0.2, 0.2 + h * 0.18, RH.tuft(R), R, 5); n++; }
      return n;
    }, 0.95, 0.85, 1.5);
  });

  /* ---- Sepang: docs/proge/sepang.md: »bujne tropske trate s pokošenimi pasovi, zalite do ograj in dlje … v vlažnih kotih temno
     grmičevje sekundarnega gozda«, the red earth of the Selangor lowland. The lawn's lighter and darker greens, the dark wet green by
     the woods and in the noise's hollows, and rarer the red laterite where the lawn wears thin (sparse: the vertices' budget) ---- */
  const SP = {
    lawn: pick([0.32, 0.5, 0.2], [0.28, 0.45, 0.17]),
    light: pick([0.5, 0.63, 0.28], [0.55, 0.66, 0.3]),
    wet: pick([0.17, 0.3, 0.12], [0.2, 0.33, 0.13]),
    lat: pick([0.56, 0.38, 0.26], [0.5, 0.34, 0.24]),
  };
  chain('sepang', 'robBt54', (ctx) => {
    const { nrLC, nrLCf, NR: P } = API; if (!nrLC) return null;
    const latK = (x, z) => P && P.n5 ? Math.min(1, Math.max(0, (P.n5(x * 0.4 - 170, z * 0.4 + 330) - 0.55) / 0.25)) : 0;
    const ok = (x, z) => { const c = nrLC(x, z); return c === 0 || c === 2; };
    return walk(ctx, 54201, ok, (x, z, o, R) => {
      const wood = nrLCf ? nrLCf(x, z, 1) : 0, r = R(), l = latK(x, z);
      if (wood > 0.2 && r < 0.6) return SP.wet(R);
      if (r < 0.03 + 0.1 * l) return SP.lat(R);
      return r < 0.45 ? SP.light(R) : r < 0.7 ? SP.wet(R) : SP.lawn(R);
    }, null, 0.005, 0.015, 2);   // (few: Sepang's busiest place had ~3k vertices left of the 900k budget; thinned 26. 11. to stay under it)
  });
})();
