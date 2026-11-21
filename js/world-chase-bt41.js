/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the forty-first group of the real tracks: Biķernieki and Buriram,
   a second pass. From behind the car both still showed one even face behind the barriers: in Biķernieki the mown lawn of the forest
   park in one green (the sand of the old dunes and the wet hollows only a tint of the look's colMod, the groups of js/world-realizem-bt.js
   sparse at that distance), under the pines one smooth floor; in Buriram the watered lawns in one fresh green to the paddies.
   So here (the shared circuit builder, js/world-rbring.js: each look's LK.extra chained on top of js/world-realizem-bt.js's) low flat
   patches of what lies there (docs/proge/bikernieki.md, docs/proge/buriram.md) from 0.6 m behind the barriers to ~16 m and, sparser and
   wider, out to ~60 m. Biķernieki: the lawn's lighter and darker mown greens, the bare pale sand of the dunes, under and at the edge of
   the woods the pines' rusty needles and the moss, by the lakes and the reedbeds the dark wet grass. Buriram: the watered lawn's greens,
   a few drier yellower patches, the red-brown laterite earth where it shows, and out on the paddies (land cover 2, never in the pond or
   the wetlands) the green, golden and stubble fields' tones. Never on the pits' side along the pits, the built ground, the car parks
   (land cover 3), the excluded places, steep ground or where another leg of the track is nearer. All of it in the builder's own scenery
   chunks (no draw is added); the terrain, the road, the barriers and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.tuft || !BT.mix3 || !vary || !rng) return;
  const { soil, tuft, mix3 } = BT;
  const pick = (a, b, amt) => (R) => vary(mix3(a, b, R()), R, amt || 0.015);

  /* the polygons of def.sk (lakes: [name, x, z, ...]; wet: [x, z, ...]) with their boxes, to keep the paddies' tones off the water */
  const polys = (arr) => (arr || []).map(a => {
    const p = [], k0 = typeof a[0] === 'string' ? 1 : 0; for (let k = k0; k + 1 < a.length; k += 2) p.push([a[k], a[k + 1]]);
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of p) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    return { p, b: [x0, x1, z0, z1] };
  });
  const inAny = (P, x, z, m) => { if (!API.inPoly) return false;
    for (const { p, b } of P) { if (x < b[0] - m || x > b[1] + m || z < b[2] - m || z > b[3] + m) continue;
      if (API.inPoly(p, x, z) || (m > 0 && API.polyDist && API.polyDist(p, x, z) < m)) return true; }
    return false; };

  /* the common walk (as skupina 37's Sakhir): `patch(x, z, o, R, far)` gives a colour (or null) for a place o m behind the barrier */
  const walk = (ctx, seed, ok, patch, extra, dn, df) => {
    dn = dn || 0.72; df = df || 0.55;
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
        const o = 0.6 + Math.pow(r1, 1.25) * 15, [x, z] = at(i, sd, o, (r2 - 0.5) * 3.2), rr = 0.7 + R() * (0.6 + o * 0.06);
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
      const k = 1 + 0.5 * (o - 16) / 44; soil(scen, nrGround, x, z, (1.6 + R() * 1.6) * k, col, R, 0.05); st.pas++;
    }
    return st;
  };
  const chain = (id, key, fn) => {
    const L = (API.rbLook || {})[id]; if (!L) return;
    const base = L.extra;
    L.extra = function (ctx) {
      const r = (base ? base.call(this, ctx) : null) || {};
      try { r[key] = fn(ctx); } catch (e) { console.error('chase-bt41 (' + id + '):', e); }
      return r;
    };
  };

  /* ---- Biķernieki: docs/proge/bikernieki.md: »borov gozd s smrekovimi sestoji in brezami, pokošene trate s peščenimi zaplatami, v
     mokrih kotanjah visoka trava, jezero Linezers«. On the open lawn the lighter and darker mown greens and, where the look's noise shows
     the sand (the same noise as js/world-realizem-bt.js's), the pale sand of the dunes with a few thin pale tufts on it; under the woods
     and at their edge the pines' rusty needles and the moss; by the lakes and the reedbeds the dark wet grass ---- */
  const BK = {
    lawn: pick([0.42, 0.56, 0.26], [0.36, 0.5, 0.22]),
    sand: pick([0.82, 0.74, 0.54], [0.74, 0.66, 0.48]),
    needle: pick([0.5, 0.39, 0.25], [0.46, 0.36, 0.24]),
    moss: pick([0.36, 0.43, 0.22], [0.32, 0.4, 0.2]),
    wet: pick([0.26, 0.4, 0.18], [0.3, 0.44, 0.2]),
    tuft: pick([0.6, 0.64, 0.36], [0.66, 0.66, 0.4], 0.03),
  };
  chain('bikernieki', 'robBt41', (ctx) => {
    const { nrLC, nrLCf, NR: P } = API; if (!nrLC) return null;
    const sandK = (x, z) => P && P.n3 ? Math.min(1, Math.max(0, (P.n3(x * 0.8 - 130, z * 0.8 + 60) - 0.46) / 0.3)) : 0.2;
    const ok = (x, z) => { const c = nrLC(x, z); return c === 0 || c === 1; };
    let onSand = false;
    return walk(ctx, 41101, ok, (x, z, o, R) => {
      onSand = false;
      const c = nrLC(x, z), wood = c === 1 ? 1 : (nrLCf ? nrLCf(x, z, 1) : 0), wet = nrLCf ? nrLCf(x, z, 2) : 0, r = R();
      if (wet > 0.15) return BK.wet(R);
      if (wood > 0.35) return r < 0.62 ? BK.needle(R) : BK.moss(R);
      const s = sandK(x, z); if (r < 0.15 + 0.55 * s) { onSand = true; return BK.sand(R); }
      return BK.lawn(R);
    }, (scen, x, z, rr, R, good) => {   // a few thin pale tufts round the sand
      if (!onSand || R() > 0.4) return 0; let n = 0;
      for (let q = 0, m = 1 + Math.floor(R() * 3); q < m; q++) {
        const a = R() * Math.PI * 2, d = rr * (0.7 + R() * 0.5), px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, h = R();
        if (!good(px, pz, 0.8)) continue;
        tuft(scen.get(px, pz), px, API.nrGround(px, pz), pz, 0.22 + h * 0.18, 0.18 + h * 0.16, BK.tuft(R), R, 5); n++; }
      return n;
    });
  });

  /* ---- Buriram: docs/proge/buriram.md: »zalite zelene trate s pokošenimi pasovi, nato pravokotna riževa polja (zelena in zlata),
     strnišča in mokra polja«, the red earth of the Isan plateau. By the barriers the watered lawn's greens with a few drier, yellower
     patches and, rarer, the red-brown laterite where the lawn wears thin; on the paddies out to ~60 m the green, golden and stubble
     tones and the wet fields' grey-green, never in the pond or on the wetlands ---- */
  const BR = {
    lawn: pick([0.33, 0.52, 0.19], [0.3, 0.48, 0.17]),
    dry: pick([0.44, 0.52, 0.23], [0.47, 0.54, 0.25]),
    lat: pick([0.5, 0.42, 0.27], [0.46, 0.39, 0.25]),
    rice: pick([0.46, 0.62, 0.26], [0.52, 0.66, 0.3]),
    gold: pick([0.78, 0.68, 0.36], [0.72, 0.62, 0.32]),
    stub: pick([0.66, 0.58, 0.4], [0.6, 0.52, 0.36]),
    field: pick([0.44, 0.5, 0.4], [0.48, 0.54, 0.42]),
  };
  chain('buriram', 'robBt41', (ctx) => {
    const { nrLC, NR: P } = API, T = API.T; if (!nrLC || !T) return null;
    const sk = T.def.sk || {}, WATER = polys(sk.lakes).concat(polys(sk.wet));
    const latK = (x, z) => P && P.n5 ? Math.min(1, Math.max(0, (P.n5(x * 0.4 + 260, z * 0.4 - 410) - 0.55) / 0.25)) : 0;
    const ok = (x, z) => { const c = nrLC(x, z); return (c === 0 || c === 2) && !inAny(WATER, x, z, 3); };
    return walk(ctx, 41201, ok, (x, z, o, R, far) => {
      const c = nrLC(x, z), r = R();
      if (c === 2) { if (o < 8) return null;   // (the paddies' tones only out where the look's colMod paints the paddies)
        return r < 0.38 ? BR.rice(R) : r < 0.66 ? BR.gold(R) : r < 0.86 ? BR.stub(R) : BR.field(R); }
      const l = latK(x, z); if (r < 0.02 + 0.12 * l) return BR.lat(R);
      return r < 0.22 + 0.2 * l ? BR.dry(R) : BR.lawn(R);
    }, null, 0.4, 0.4);   // (sparser than Biķernieki's: the busiest place's vertices within the budget)
  });
})();
