/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the sixtieth group of the real tracks: Seoul and Biķernieki, a
   further pass on top of skupina 37 (Seoul) and skupina 41 (Biķernieki).
   From behind the car Biķernieki's lawns still read as one even green between the kerb and the barrier and past it: the shared builder
   mows them in stripes (js/world-rbring.js), but its look had them faint (mow 0.6). The source (docs/proge/bikernieki.md: »drugod pokošena
   trava«, »na odprtem pokošene trate«) has them mown, so here the stripes at the builder's full strength.
   On Seoul the strip from the kerb to the blocks was one pale face with a few round patches, and the forest's floor past the blocks one
   olive face to ~45 m. So here (World.ext.seoulRob chained again, js/world-seoul.js) under the woods the needles and the oaks' leaves
   blown into a narrow drift at the blocks' foot (broken, a few metres each), and on the forest floor out to ~60 m the green undergrowth
   (docs/proge/seoul.md: »tla iglice in listje z zelenim podrastjem«) in low patches between the litter's. Nothing in the town (land cover
   3), at the crossings, by the buildings or the landmarks (noTree).
   All of it in the builders' own scenery chunks (no draw is added); the terrain, the road, the barriers and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.soil || !BT.mix3 || !vary || !rng) return;
  const { soil, mix3 } = BT;
  const pick = (a, b, amt) => (R) => vary(mix3(a, b, R()), R, amt || 0.012);

  /* a ribbon lying on the ground along leg i0 → i1 of the track, from lateral o0 to o1 (side sd), `lift` above gH; one quad every `st`
     samples, each in the scenery chunk of its middle */
  const ribbon = (scen, gH, i0, i1, st, sd, o0, o1, col, lift, ok) => {
    const T = API.T, N = T.px.length, P = (i, o) => { const ii = ((i % N) + N) % N, x = T.px[ii] + T.nx[ii] * sd * o, z = T.pz[ii] + T.nz[ii] * sd * o; return [x, gH(x, z) + lift, z]; };
    let n = 0;
    for (let i = i0; i < i1; i += st) {
      const j = Math.min(i1, i + st), a = P(i, o0), b = P(i, o1), c = P(j, o1), d = P(j, o0), mx = (a[0] + c[0]) / 2, mz = (a[2] + c[2]) / 2;
      if (ok && !ok(mx, mz)) continue;
      const inn = [mx, (a[1] + c[1]) / 2 - 5, mz], g = scen.get(mx, mz);
      g.triO(a, b, c, col, inn, col, col); g.triO(a, c, d, col, inn, col, col); n++;
    }
    return n;
  };

  /* ---- Biķernieki: the mower's stripes as strong as the shared builder's own (js/world-rbring.js: MOW_D × LK.mow, the 3 m bands inside the
     barriers and the 3.5 m ones on the lawns past them); its look had them at 0.6, fainter, and from behind the car the lawns read as one
     green. No vertex is added: the same bands, a deeper green in the dark ones ---- */
  { const L = (API.rbLook || {}).bikernieki; if (L) L.mow = 1; }

  /* ---- Seoul: the litter's drift at the blocks' foot, the undergrowth on the forest floor ---- */
  const SE = {
    drift: pick([0.5, 0.38, 0.25], [0.46, 0.37, 0.26], 0.015),
    leaf: pick([0.52, 0.42, 0.29], [0.47, 0.38, 0.26], 0.015),
    under: pick([0.3, 0.44, 0.2], [0.36, 0.48, 0.22], 0.02),
    fern: pick([0.27, 0.4, 0.18], [0.32, 0.45, 0.2], 0.02),
  };
  const seMore = ({ scen, noTree, nearCross }) => {
    const T = API.T, { nrGround, nrLC, nrNear } = API, st = { nanos: 0, podrast: 0 };
    if (!T || !T.br || !T.wAt || !nrGround || !nrLC || !nrNear || !scen) return st;
    const N = T.px.length, R = rng(60201), y0 = (i) => T.hy[((i % N) + N) % N];
    const slope = (x, z) => { const d = 0.8, a = nrGround(x + d, z) - nrGround(x - d, z), b = nrGround(x, z + d) - nrGround(x, z - d); return Math.hypot(a, b) / (2 * d); };
    const at = (i, sd, o, a) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
    /* the drift: under the woods, on the verge's top just before the blocks (the verge lies at the road's height + 0.05 there: skupina 37's
       profile), pieces 3–10 m long with gaps */
    const st1 = Math.max(1, Math.round(2 / T.ds));
    for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br : T.bl;
      for (let i = 0; i < N - 1;) {
        const len = Math.max(st1, Math.round((3 + R() * 7) / T.ds)), gap = Math.max(st1, Math.round((2 + R() * 9) / T.ds)), i1 = Math.min(N - 1, i + len);
        const s = i * T.ds, w = T.wAt(i), b = bar[i], wid = 0.35 + R() * 0.3, col = (R() < 0.55 ? SE.drift : SE.leaf)(R);
        const [cx, cz] = at(i, sd, b - 0.5, 0);
        if (!nearCross(s, 10) && !nearCross(i1 * T.ds, 10) && b - w > 1.7 && nrLC(cx, cz) === 1 && !noTree(cx, cz)) {
          const gH = (x, z) => { const q = nrNear(x, z); return q.i >= 0 ? T.hy[q.i] + 0.05 : nrGround(x, z); };
          st.nanos += ribbon(scen, gH, i, i1, st1, sd, b - 0.25 - wid, b - 0.25, col, 0.035, (x, z) => { const q = nrNear(x, z); return q.i >= 0 && Math.abs(Math.abs(q.lat) - (b - 0.25 - wid / 2)) < 0.6; });
        }
        i = i1 + gap;
      }
    }
    /* the undergrowth: low green patches on the forest floor from the blocks to ~60 m, more near, wider farther */
    const step = Math.max(1, Math.round(3 / T.ds));
    for (let i = 0; i < N; i += step) for (const sd of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(), r3 = R(); if (r0 > 0.7 || nearCross(i * T.ds, 12)) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], o = bar + 1.5 + Math.pow(r1, 1.6) * 58, [x, z] = at(i, sd, o, (r2 - 0.5) * 3), q = nrNear(x, z);
      if (q.i < 0 || Math.abs(q.i - i) * T.ds > o + 10 || q.dd < 1.2 || nrLC(x, z) !== 1 || noTree(x, z) || slope(x, z) > 1.1 || Math.abs(nrGround(x, z) - y0(i)) > 12) continue;
      const k = 1 + 0.8 * (o - bar) / 58; soil(scen, nrGround, x, z, (0.7 + R() * 0.9) * k, (r3 < 0.6 ? SE.under : SE.fern)(R), R, 0.055); st.podrast++;
    }
    return st;
  };
  {
    const base = World.ext && World.ext.seoulRob;
    if (World.ext) World.ext.seoulRob = (ctx) => {
      if (base) base(ctx);
      try { if (ctx && ctx.out) ctx.out.robBt60 = seMore(ctx); } catch (e) { console.error('chase-bt60 (seoul):', e); }
    };
  }
})();
