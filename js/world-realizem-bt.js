/* The ground by the road as the camera behind the car sees it, on the roads and circuits no other file of this kind looks after.
   Nothing of the road, of the driving or of the terrain's heights changes: only what stands on the ground. Each track's own, from its own
   description (docs/proge/<id>.md), with numbers of its own (rng(seed) here, none of the build's own drawn), after the track's own build. */
(function () {
  'use strict';
  const API = World.api; if (!API) return;
  const { TAU, lerp, rng, rock, vary, cone, ico } = API;
  let T; API.sync.push(() => { ({ T } = API); });


  /* ---- the circuits on the shared builder (js/world-rbring.js): the look's own LK.extra chained the same way; what it counts joins
     the extra's own counts (out.stats.extra.robBt). All of it stands behind the fences, never on the pit's side along the pits. ---- */
  const { sstep } = API;
  const chainRb = (id, fn) => { const L = (API.rbLook || {})[id]; if (!L) return; const base = L.extra;
    L.extra = function (ctx) { const r = (base ? base.call(this, ctx) : null) || {};
      try { fn(L, ctx, r.robBt = {}); } catch (e) { console.error('realizem-bt (' + id + '):', e); } return r; }; };
  const rbSide = (s, side, o) => { const i = T.idx(s), d = side * ((side > 0 ? T.br[i] : T.bl[i]) + o); return [T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d]; };
  const rbPit = (s, side) => { const pd = T.def.pit; return !!pd && side === (pd[0] < 0 ? -1 : 1) && !!T.pitAt(s); };
  const rbClear = (excluded, x, z, r) => { const q = API.nrNear(x, z); return !(q.i >= 0 && q.dd < r) && !excluded(x, z); };   // (behind every leg's fence by r, off what the build keeps clear)
  const tuft = (g, x, y, z, w, h, col, R) => cone(g, x, y - 0.08, z, w, h, 5, [col[0] * 0.62, col[1] * 0.66, col[2] * 0.6], col, R() * TAU);
  const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const soil = (scen, gH, gx, gz, rr, col, R) => {   // bare ground: a low irregular patch lying on the terrain
    const k = 7, a0 = R() * TAU, rim = [col[0] * 0.9 + 0.05, col[1] * 0.9 + 0.07, col[2] * 0.9 + 0.03], g = scen.get(gx, gz), ctr = [gx, gH(gx, gz) + 0.07, gz], P = [];
    for (let q = 0; q < k; q++) { const a = a0 + q / k * TAU, r = rr * (0.65 + R() * 0.6), x = gx + Math.cos(a) * r, z = gz + Math.sin(a) * r * 0.75; P.push([x, gH(x, z) + 0.05, z]); }
    for (let q = 0; q < k; q++) g.triO(ctr, P[q], P[(q + 1) % k], col, [gx, ctr[1] - 5, gz], rim, rim); };

  /* Bathurst: behind the fences the pasture was one even face of grass from the camera above the car. docs/proge/bathurst.md: »pašniki
     … ponekod se že sušijo v slamnato rumeno«, »trava je v šopih (… suhimi bilkami in pegami rdeče-rjave prsti)«, »Trava ob progi je
     kot na pašnikih«. So tussocks stand in loose groups within ~35 m of the fences, straw where the ground's own colour dries off
     (the same noise as the look's colMod) and olive elsewhere, and here and there the red-brown soil shows bare between them. */
  chainRb('bathurst', (L, { scen, excluded }, st) => {
    const { nrGround, nrLC, nrSlope, NR: P } = API; if (!T || !P || !nrGround) return;
    const R = rng(9377), smooth0 = API.ROCK_SMOOTH, straw = [0.71, 0.65, 0.4], olive = [0.34, 0.4, 0.18]; let n = 0, m = 0;
    API.ROCK_SMOOTH = true;
    for (let s = 0; s < T.len; s += 7) for (const side of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(); if (rbPit(s, side)) continue;
      const o = 3 + Math.pow(r1, 1.5) * 33, [gx, gz] = rbSide(s + (r2 - 0.5) * 7, side, o), dry = sstep(0.42, 0.74, P.n3(gx * 0.8 + 90, gz * 0.8 - 40));
      if (r0 > 0.42 + 0.4 * dry || nrLC(gx, gz) !== 0 || !rbClear(excluded, gx, gz, 2.5)) continue;
      if (r2 < 0.22 && o > 5 && nrSlope(gx, gz) < 0.4 && rbClear(excluded, gx, gz, 4.5)) { soil(scen, nrGround, gx, gz, 1.3 + R() * 1.6, vary([0.47, 0.31, 0.21], R, 0.03), R); m++; }
      for (let q = 0, cnt = 4 + Math.floor(R() * 5); q < cnt; q++) {
        const x = gx + (R() - 0.5) * 8, z = gz + (R() - 0.5) * 8, h = 0.36 + R() * 0.4, w = 0.6 + R() * 0.7, t = Math.min(1, dry * (0.55 + R() * 0.6) + R() * 0.25);
        if (nrLC(x, z) !== 0 || !rbClear(excluded, x, z, 2 + w)) { R(); continue; }
        tuft(scen.get(x, z), x, nrGround(x, z), z, w, h, vary(mix3(olive, straw, t), R, 0.03), R); n++; }
    }
    API.ROCK_SMOOTH = smooth0; st.sopi = n; st.prst = m;
  });

  /* Pembrey: the flat coastal grass behind the fences was one even face from the camera above the car. docs/proge/pembrey.md: »obalna
     trava v suhih in vlažnih lisah«. So tufts of that grass stand in groups within ~32 m of the fences: pale and straw-coloured where
     the ground's own colour is dry and sandy, darker and taller (the rushes) where it is damp (the same noise as the look's colMod),
     the plain green tussock between; clear of the gorse and the buildings (the build's own excluded). */
  chainRb('pembrey', (L, { scen, excluded }, st) => {
    const { nrGround, nrLC, NR: P } = API; if (!T || !P || !nrGround) return;
    const R = rng(9391), smooth0 = API.ROCK_SMOOTH, pale = [0.68, 0.64, 0.4], rush = [0.36, 0.47, 0.22], mid = [0.44, 0.54, 0.25]; let n = 0;
    API.ROCK_SMOOTH = true;
    for (let s = 0; s < T.len; s += 5) for (const side of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(); if (rbPit(s, side)) continue;
      const o = 3 + Math.pow(r1, 1.5) * 30, [gx, gz] = rbSide(s + (r2 - 0.5) * 5, side, o);
      const dry = sstep(0.5, 0.82, P.n3(gx * 0.8 + 340, gz * 0.8 - 120)), wet = sstep(0.55, 0.84, P.n1(gx * 1.2 - 60, gz * 1.2 + 230));
      if (r0 > 0.22 + 0.45 * Math.max(dry, wet) || nrLC(gx, gz) !== 0 || !rbClear(excluded, gx, gz, 2.5)) continue;
      for (let q = 0, cnt = 3 + Math.floor(R() * 4); q < cnt; q++) {
        const x = gx + (R() - 0.5) * 6, z = gz + (R() - 0.5) * 6, k = R(), a = R();
        if (nrLC(x, z) !== 0 || !rbClear(excluded, x, z, 2.4)) { R(); continue; }
        const isRush = wet > dry && a < 0.3 + 0.6 * wet, col = isRush ? rush : mix3(mid, pale, Math.min(1, dry * (0.6 + a * 0.6) + a * 0.2));
        tuft(scen.get(x, z), x, nrGround(x, z), z, isRush ? 0.45 + k * 0.3 : 0.5 + k * 0.55, isRush ? 0.6 + k * 0.4 : 0.32 + k * 0.34, vary(col, R, 0.03), R); n++; }
    }
    API.ROCK_SMOOTH = smooth0; st.sopi = n;
  });

  /* Quezaltepeque: docs/proge/quezaltepeque.md: »ob ravnini za 8. ovinkom stara lava (temna, siva in rjava kamnita tla z nizkim grmovjem)«,
     »zelen hribovit svet s suhimi rumenimi lisami: trate, grmovje«. The lava was a dark colour on smooth ground from the camera above
     the car, the dry patches a colour only. So on the old flow (the look's own qzLava) dark grey and brown stones lie in loose
     groups within ~30 m of the fences, and tufts of the dry season's yellow grass stand where the ground's own colour is dry. */
  chainRb('quezaltepeque', (L, { scen, excluded }, st) => {
    const { nrGround, nrLC, qzLava, NR: P } = API; if (!T || !P || !nrGround || !qzLava) return;
    const R = rng(9397), smooth0 = API.ROCK_SMOOTH, lava = [[0.3, 0.29, 0.28], [0.38, 0.32, 0.27], [0.24, 0.23, 0.23], [0.44, 0.37, 0.3]], dryC = [0.76, 0.7, 0.38], grn = [0.34, 0.46, 0.19]; let n = 0, m = 0;
    for (let s = 0; s < T.len; s += 6) for (const side of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(); if (rbPit(s, side)) continue;
      const o = 3 + Math.pow(r1, 1.4) * 28, [gx, gz] = rbSide(s + (r2 - 0.5) * 6, side, o), c = nrLC(gx, gz), lv = qzLava(gx, gz);
      if (c === 1 || c >= 5 || !rbClear(excluded, gx, gz, 2.5)) continue;
      if (lv > 0.5) {   // the old flow: stones of its rock, a bigger one now and then
        if (r0 > 0.8) continue; API.ROCK_SMOOTH = false;
        for (let q = 0, cnt = 3 + Math.floor(R() * 5); q < cnt; q++) {
          const x = gx + (R() - 0.5) * 7, z = gz + (R() - 0.5) * 7, w = 0.3 + Math.pow(R(), 2) * 0.8;
          if (qzLava(x, z) < 0.5 || !rbClear(excluded, x, z, 2.2 + w)) { R(); R(); continue; }
          rock(scen.get(x, z), x, nrGround(x, z) + w * 0.18, z, w * 1.4, w * 0.7, w, R() * TAU, vary(lava[Math.floor(R() * lava.length)], R, 0.03), R, 0.34, 0.35); m++; }
        continue; }
      if (c !== 0) continue;
      const dry = sstep(0.5, 0.75, P.n3(gx * 0.35 + 90, gz * 0.35 - 40)) * sstep(6, 18, o);   // (as the look's colMod: the dry grass away from the track)
      if (r0 > 0.3 + 0.5 * dry) continue; API.ROCK_SMOOTH = true;
      for (let q = 0, cnt = 4 + Math.floor(R() * 5); q < cnt; q++) {
        const x = gx + (R() - 0.5) * 8, z = gz + (R() - 0.5) * 8, k = R(), a = R();
        if (nrLC(x, z) !== 0 || qzLava(x, z) > 0.3 || !rbClear(excluded, x, z, 2.4)) { R(); continue; }
        tuft(scen.get(x, z), x, nrGround(x, z), z, 0.55 + k * 0.7, 0.4 + k * 0.5, vary(mix3(grn, dryC, Math.min(1, dry * (0.6 + a * 0.5) + a * 0.3)), R, 0.03), R); n++; }
    }
    API.ROCK_SMOOTH = smooth0; st.sopi = n; st.lava = m;
  });

  /* The meadow tracks of this group share one shape: on the open grass (land cover 0) within ~33 m of the fences, off the pit side
     and what the build keeps clear, small groups stand only where the ground's own colour (the look's colMod) already shows a patch:
     pick(gx, gz) gives the patch's strength there (0–1) and what stands at a place, a tussock (with a tip of a flower's colour where
     it has one) or a low cushion of flowers (blob). The mown grass between the patches stays smooth. */
  const rbMeadow = ({ scen, excluded }, seed, step, pick) => {
    const { nrGround, nrLC } = API, R = rng(seed), smooth0 = API.ROCK_SMOOTH; let n = 0, f = 0;
    API.ROCK_SMOOTH = true;
    for (let s = 0; s < T.len; s += step) for (const side of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(); if (rbPit(s, side)) continue;
      const o = 3 + Math.pow(r1, 1.4) * 30, [gx, gz] = rbSide(s + (r2 - 0.5) * step, side, o), p = pick(gx, gz);
      if (!(p.k > 0.12) || r0 > 0.25 + 0.7 * p.k || nrLC(gx, gz) !== 0 || !rbClear(excluded, gx, gz, 2.5)) continue;
      for (let q = 0, cnt = 5 + Math.floor(R() * 6); q < cnt; q++) {
        const x = gx + (R() - 0.5) * 5, z = gz + (R() - 0.5) * 5, k = R(), a = R();
        if (nrLC(x, z) !== 0 || !rbClear(excluded, x, z, 2.4)) { R(); continue; }
        const t = p.at(k, a), col = vary(t.col, R, 0.03), y = nrGround(x, z);
        if (t.blob) { ico(scen.get(x, z), x, y + 0.02, z, t.w, t.h, col, R, 0.3); f++; }
        else if (t.tip) { cone(scen.get(x, z), x, y - 0.08, z, t.w, t.h, 5, [col[0] * 0.7, col[1] * 0.74, col[2] * 0.68], vary(t.tip, R, 0.03), R() * TAU); f++; }
        else { tuft(scen.get(x, z), x, y, z, t.w, t.h, col, R); n++; }
      }
    }
    API.ROCK_SMOOTH = smooth0; return [n, f];
  };

  /* Kågeröd: docs/proge/kagerod.md: »travniki z zlaticami in krebuljico«. The flowers of the meadows behind the fences were a tint
     of smooth ground from the camera above the car. So where the ground's own colour is yellow with buttercups, low yellow cushions
     lie among short tussocks, and where it is pale with cow parsley, taller stems tipped white stand in groups. */
  chainRb('kagerod', (L, ctx, st) => {
    const P = API.NR; if (!T || !P || !API.nrGround) return;
    const grn = [0.34, 0.54, 0.22], yel = [0.9, 0.8, 0.2], wht = [0.9, 0.92, 0.84];
    [st.sopi, st.cvetje] = rbMeadow(ctx, 9419, 5, (gx, gz) => {
      const yf = sstep(0.58, 0.78, P.n3(gx * 0.9 + 90, gz * 0.9 - 40)), wf = sstep(0.62, 0.82, P.n1(gx * 1.3 - 210, gz * 1.3 + 75));
      return { k: Math.max(yf, wf), at: (k, a) => a > 0.7 ? { col: grn, w: 0.35 + k * 0.3, h: 0.24 + k * 0.2 }
        : wf > yf ? { col: grn, tip: wht, w: 0.3 + k * 0.25, h: 0.5 + k * 0.3 } : { col: yel, blob: true, w: 0.28 + k * 0.3, h: 0.24 } };
    });
  });

  /* Silkeborg: docs/proge/silkeborg.md: »resava z reso (vijolično-rjava) in nizkimi bori, suha trava in peščene zaplate«. From the
     camera above the car this was a colour on smooth ground. So on the open grass tufts of the dry late-summer grass stand where
     the ground's own colour is burnt straw-yellow (most of what is seen: the heath hardly reaches the track); where the heath
     (land cover 2) does come within ~55 m, low cushions of heather lie in groups, purple where the ground's own colour is in bloom
     and brown where it is old, with a patch of the pale sand now and then. */
  chainRb('silkeborg', (L, { scen, excluded }, st) => {
    const { nrGround, nrLC, nrSlope, NR: P } = API; if (!T || !P || !nrGround) return;
    const R = rng(9421), smooth0 = API.ROCK_SMOOTH, bloom = [0.5, 0.3, 0.5], old = [0.4, 0.3, 0.22], straw = [0.72, 0.66, 0.4], grn = [0.4, 0.5, 0.24], sand = [0.8, 0.73, 0.54]; let n = 0, h = 0, m = 0;
    API.ROCK_SMOOTH = true;
    for (let s = 0; s < T.len; s += 6) for (const side of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(); if (rbPit(s, side)) continue;
      const o = 3 + Math.pow(r1, 1.3) * 52, [gx, gz] = rbSide(s + (r2 - 0.5) * 6, side, o), c = nrLC(gx, gz);
      if ((c !== 0 && c !== 2) || !rbClear(excluded, gx, gz, 2.5)) continue;
      if (c === 2) {   // the heath
        if (r0 > 0.7) continue;
        if (r2 < 0.14 && o > 5 && nrSlope(gx, gz) < 0.4 && rbClear(excluded, gx, gz, 4.5)) { soil(scen, nrGround, gx, gz, 1.1 + R() * 1.4, vary(sand, R, 0.03), R); m++; }
        const bl = sstep(0.38, 0.66, P.n1(gx * 0.9 + 40, gz * 0.9 - 60));
        for (let q = 0, cnt = 3 + Math.floor(R() * 4); q < cnt; q++) {
          const x = gx + (R() - 0.5) * 6, z = gz + (R() - 0.5) * 6, w = 0.45 + R() * 0.6, a = R();
          if (nrLC(x, z) !== 2 || !rbClear(excluded, x, z, 2.2 + w)) { R(); continue; }
          ico(scen.get(x, z), x, nrGround(x, z) + 0.03, z, w, 0.3 + R() * 0.14, vary(mix3(old, bloom, Math.min(1, bl * (0.5 + a * 0.7))), R, 0.03), R, 0.3); h++; }
        continue; }
      const dry = sstep(0.5, 0.74, P.n3(gx * 0.8 + 90, gz * 0.8 - 40)); if (o > 34 || !(dry > 0.12) || r0 > 0.3 + 0.65 * dry) continue;
      for (let q = 0, cnt = 5 + Math.floor(R() * 6); q < cnt; q++) {
        const x = gx + (R() - 0.5) * 5, z = gz + (R() - 0.5) * 5, k = R(), a = R();
        if (nrLC(x, z) !== 0 || !rbClear(excluded, x, z, 2.4)) { R(); continue; }
        tuft(scen.get(x, z), x, nrGround(x, z), z, 0.32 + k * 0.36, 0.26 + k * 0.3, vary(mix3(grn, straw, Math.min(1, 0.45 + dry * 0.4 + a * 0.3)), R, 0.03), R); n++; }
    }
    API.ROCK_SMOOTH = smooth0; st.sopi = n; st.resa = h; st.pesek = m;
  });

  /* Sosnová: docs/proge/sosnova.md: »poznopoletni travniki z rmanom in glavincem«. The dry patches and the flowers of the meadows
     behind the fences were a tint of smooth ground from the camera above the car. So where the ground's own colour has dried off,
     short straw tussocks stand in groups, and where it is pale with flowers, low white cushions of yarrow lie among stems tipped
     purple with knapweed. */
  chainRb('sosnova', (L, ctx, st) => {
    const P = API.NR; if (!T || !P || !API.nrGround) return;
    const grn = [0.36, 0.52, 0.22], straw = [0.74, 0.67, 0.4], wht = [0.9, 0.89, 0.82], pur = [0.64, 0.34, 0.62];
    [st.sopi, st.cvetje] = rbMeadow(ctx, 9431, 5, (gx, gz) => {
      const dry = sstep(0.55, 0.8, P.n3(gx * 0.7 - 60, gz * 0.7 + 210)), wf = sstep(0.64, 0.84, P.n1(gx * 1.3 + 170, gz * 1.3 - 95));
      return { k: Math.max(dry, wf), at: (k, a) => wf > dry && a < 0.75 ? (a < 0.45 ? { col: wht, blob: true, w: 0.26 + k * 0.26, h: 0.26 } : { col: grn, tip: pur, w: 0.28 + k * 0.22, h: 0.42 + k * 0.26 })
        : { col: mix3(grn, straw, Math.min(1, 0.45 + dry * 0.4 + a * 0.3)), w: 0.35 + k * 0.35, h: 0.26 + k * 0.26 } };
    });
  });

  /* Kildare: docs/proge/kildare.md: »pašniki v irskih zelenih tonih, vlažne kotanje«. The wet hollows of the pasture behind the
     fences were a darker colour on smooth ground from the camera above the car. So in the hollows (where the look's colMod darkens
     the ground) dark clumps of rushes stand in groups, their tips browning, with a tussock of the deep green pasture between them. */
  chainRb('kildare', (L, ctx, st) => {
    const P = API.NR; if (!T || !P || !API.nrGround) return;
    const grn = [0.26, 0.52, 0.2], rush = [0.24, 0.4, 0.17], brn = [0.46, 0.42, 0.2];
    [st.sopi, st.locje] = rbMeadow(ctx, 9433, 5, (gx, gz) => {
      const wet = sstep(0.62, 0.84, P.n1(gx * 1.1 + 140, gz * 1.1 - 260));
      return { k: wet, at: (k, a) => a < 0.75 ? { col: rush, tip: brn, w: 0.26 + k * 0.24, h: 0.5 + k * 0.4 } : { col: grn, w: 0.4 + k * 0.35, h: 0.24 + k * 0.2 } };
    });
  });

  /* Seoul (its own builder, js/world-seoul.js, calls this before it closes its scenery chunks): under the pines and oaks of the
     mountain the ground beside the road was one smooth face from the camera above the car. docs/proge/seoul.md: »gozd rdečega bora in
     hrasta … (tla iglice in listje z zelenim podrastjem)«. So low clumps of that green undergrowth lie in groups on the forest's
     floor within ~28 m of the road, off the buildings, the landmarks and the road's own crossings. */
  World.ext.seoulRob = ({ scen, noTree, nearCross, out }) => {
    try {
      const { nrGround, nrLC, nrNear } = API, T = API.T, R = rng(9413), smooth0 = API.ROCK_SMOOTH; let n = 0;
      const und = [[0.2, 0.36, 0.16], [0.25, 0.41, 0.18], [0.3, 0.43, 0.2], [0.22, 0.33, 0.2]];
      API.ROCK_SMOOTH = true;
      for (let s = 8; s < T.len - 8; s += 6) for (const side of [-1, 1]) {
        const r0 = R(), r1 = R(), r2 = R(); if (r0 > 0.6 || nearCross(s, 14)) continue;
        const [gx, gz] = rbSideT(T, s + (r2 - 0.5) * 6, side, 2.2 + Math.pow(r1, 1.3) * 26); if (nrLC(gx, gz) !== 1) continue;
        for (let q = 0, cnt = 2 + Math.floor(R() * 4); q < cnt; q++) {
          const x = gx + (R() - 0.5) * 7, z = gz + (R() - 0.5) * 7, w = 0.5 + R() * 0.8, nn = nrNear(x, z);
          if ((nn.i >= 0 && nn.dd < 1.6 + w) || nrLC(x, z) !== 1 || noTree(x, z)) { R(); R(); continue; }
          ico(scen.get(x, z), x, nrGround(x, z) + 0.04, z, w, 0.34 + R() * 0.16, vary(und[Math.floor(R() * und.length)], R, 0.03), R, 0.3); n++; }
      }
      API.ROCK_SMOOTH = smooth0; out.robBt = { podrast: n };
    } catch (e) { console.error('realizem-bt (seoul):', e); }
  };
  const rbSideT = (T, s, side, o) => { const i = T.idx(s), d = side * ((side > 0 ? T.br[i] : T.bl[i]) + o); return [T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d]; };

  /* Portobelo (its own builder, js/world-portobelo.js, calls this the same way): the bank between the road and the bay and the floor
     of the forest were smooth green faces from the camera above the car. docs/proge/portobelo.md: »temne skale ob zalivu«, »temne
     krošnje deževnega gozda in visoka drevesa nad zelenimi tlemi«. So dark boulders lie on the land's last ~12 m above the water
     where the road runs by it, and low green undergrowth grows in groups under the forest within ~22 m of the road; the fort and
     its glade stay as they are. */
  World.ext.portobeloRob = ({ scen, excluded, seaD, inFort, inGlade, out }) => {
    try {
      const { nrGround, nrLC, nrNear } = API, T = API.T, R = rng(9403), smooth0 = API.ROCK_SMOOTH; let n = 0, m = 0;
      const dark = [[0.3, 0.29, 0.27], [0.25, 0.25, 0.24], [0.35, 0.31, 0.27]], und = [[0.17, 0.35, 0.14], [0.21, 0.41, 0.16], [0.26, 0.44, 0.15]];
      const off = (x, z, r) => { const nn = nrNear(x, z); return (nn.i >= 0 && nn.dd < r) || excluded(x, z) || inFort(x, z, 6) || inGlade(x, z); };
      API.ROCK_SMOOTH = true;
      for (let s = 6; s < T.len - 6; s += 4) for (const side of [-1, 1]) {
        const r0 = R(), r1 = R(), r2 = R(), o = 1.8 + r1 * 16, [gx, gz] = rbSideT(T, s + (r2 - 0.5) * 4, side, o), sd = seaD(gx, gz);
        if (sd > -12 && sd < -0.8) {   // the shore's land: the boulders
          if (r0 > 0.55) continue;
          for (let q = 0, cnt = 1 + Math.floor(R() * 3); q < cnt; q++) {
            const x = gx + (R() - 0.5) * 4, z = gz + (R() - 0.5) * 4, w = 0.4 + Math.pow(R(), 1.8) * 0.9, d2 = seaD(x, z);
            if (d2 > -0.6 || d2 < -13 || off(x, z, 1.6 + w)) { R(); R(); continue; }
            rock(scen.get(x, z), x, nrGround(x, z) + w * 0.15, z, w * 1.3, w * 0.75, w, R() * TAU, vary(dark[Math.floor(R() * dark.length)], R, 0.03), R, 0.3, 0.4); m++; }
          continue; }
        if (r0 > 0.5 || sd > -12 || nrLC(gx, gz) !== 1) continue;
        for (let q = 0, cnt = 2 + Math.floor(R() * 3); q < cnt; q++) {   // under the forest: the undergrowth
          const x = gx + (R() - 0.5) * 6, z = gz + (R() - 0.5) * 6, w = 0.5 + R() * 0.8;
          if (seaD(x, z) > -4 || nrLC(x, z) !== 1 || off(x, z, 1.6 + w)) { R(); R(); continue; }
          ico(scen.get(x, z), x, nrGround(x, z) + 0.04, z, w, 0.36 + R() * 0.18, vary(und[Math.floor(R() * und.length)], R, 0.03), R, 0.3); n++; }
      }
      API.ROCK_SMOOTH = smooth0; out.robBt = { skale: m, podrast: n };
    } catch (e) { console.error('realizem-bt (portobelo):', e); }
  };
})();
