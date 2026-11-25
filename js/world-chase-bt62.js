/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the sixty-second group of the real tracks: Buriram and Sakhir, a
   third pass. Groups 41 (Buriram) and 37 (Sakhir) laid the ground past the barriers; from behind the car the strip between the asphalt's
   edge and the barriers still read as one even face: on Buriram one mown green to a hard asphalt edge, on Sakhir one pale sand.
   So here, on that strip only (the shared circuit builder, js/world-rbring.js: its look's LK.extra chained with BT.chain), as
   docs/proge/buriram.md and docs/proge/sakhir.md tell it:
   - Buriram: a worn, drier fringe by the asphalt's edge (the mower's and the cars' wheels), the red laterite's dust blown onto it,
     lighter and darker patches of the mown lawn, uncut tufts at the barriers' foot; past the barriers to ~8 m a few patches more of
     the lawn's darker and dried grass (the 41st group's band starts sparse there).
   - Sakhir: the blown sand's paler drifts at the asphalt's edge and the barriers' foot, the darker grit and stones in patches, the bare
     crust between them, here and there a tuft of dusty desert grass.
   Nothing on the asphalt run-offs (gravL/gravR), on the pits' side along the pits, on the excluded places. The verge's height as the
   builder draws it (rbVerge, with a banked corner's tilt). All in own soft scenery (no shadow); the terrain, the road, the barriers and
   the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.tuft || !BT.cushion || !BT.mix3 || !BT.chain || !rng || !vary) return;
  const { tuft, cushion, mix3, chain } = BT;
  /* (as the sixth group's softScen, but casting no shadow — flat patches on the ground throw none, and the shadow pass would draw them
     twice — and in 64 m chunks, so less of the strip far ahead is drawn: both tracks' busiest places are near CLAUDE.md's 900k) */
  const FAR = 140;   // (a chunk whose middle is farther from the camera draws nothing: a patch of a metre is under a pixel there)
  const softScen = (root, matV) => { const ch = new API.Chunks(64); return { get: (x, z) => ch.get(x, z), done() { const grp = new THREE.Group(); ch.addTo(grp, matV, false, true);
    for (const m of grp.children) { m.name = 'rob'; m.userData.rob = m.userData.lj = true;
      const geo = m.geometry; geo.computeBoundingSphere(); const c = geo.boundingSphere.center.clone(), f2 = (FAR + geo.boundingSphere.radius) ** 2;
      m.onBeforeRender = (r, sc, cam) => { geo.setDrawRange(0, cam.position.distanceToSquared(c) > f2 ? 0 : Infinity); }; }
    if (grp.children.length) root.add(grp); } }; };
  const TAU = Math.PI * 2;
  /* a low patch as an ellipse of k corners (as the forty-fifth group's soilK): ra along the direction (dx, dz), rb across it — the fringe at
     the asphalt's edge one long narrow one along the road instead of a row of round ones, the patches with five corners: both tracks'
     busiest places are within a few thousand vertices of CLAUDE.md's 900k */
  const soilE = (scen, gH, gx, gz, ra, rb, dx, dz, col, R, lift, k) => {
    const a0 = R() * TAU, rim = [col[0] * 0.9 + 0.05, col[1] * 0.9 + 0.07, col[2] * 0.9 + 0.03], g = scen.get(gx, gz), up = lift || 0.04, ctr = [gx, gH(gx, gz) + up + 0.02, gz], Q = [];
    for (let q = 0; q < k; q++) { const a = a0 + q / k * TAU, f = 0.75 + R() * 0.45, u = Math.cos(a) * ra * f, v = Math.sin(a) * rb * f, x = gx + dx * u - dz * v, z = gz + dz * u + dx * v; Q.push([x, gH(x, z) + up, z]); }
    for (let q = 0; q < k; q++) g.triO(ctr, Q[q], Q[(q + 1) % k], col, [gx, ctr[1] - 5, gz], rim, rim); };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  // (as the thirty-ninth group: a fifth of the way to their grey and a little darker, so a patch reads as a change of ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95, g = 0.2; return [(c[0] * (1 - g) + l * g) * f, (c[1] * (1 - g) + l * g) * f, (c[2] * (1 - g) + l * g) * f]; };
  const C_ = (R, ab, k) => mute(vary(mix3(ab[0], ab[1], R()), R, 0.015), k);

  /* the strip between the kerb and the barrier: V.edge(R, u) the fringe at the asphalt's edge (V.eShare of the places, long and narrow
     along the road), V.mid(R, u, o01) the patches on the strip, V.foot of the places tufts (V.tuftC) at the barrier's foot, V.stone of
     the patches a few pebbles (V.stoneC). Returns st and the verge's height function maker */
  const verge = (ctx, seed, V) => {
    const { root, matV } = ctx, excluded = ctx.excluded || (() => false), T = API.T, { nrGround, nrNear } = API;
    if (!root || !matV || !T || !T.br || !nrGround || !nrNear) return null;
    const bankY = API.nrBankY || (() => 0), N = T.px.length, w = T.w, cw = T.curbW || 1, ds = T.ds;
    const pd = T.def && T.def.pit, PSD = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const pitI = (i) => !!T.pitAt && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25)) || (T.pitLead ? T.pitLead(i * ds) >= 0 : false);
    const pit = (i, sd) => !!pd && sd === PSD && pitI(i);
    const prof = (i, sd) => { const bar = sd > 0 ? T.br[i] : T.bl[i], y = T.hy[i], bk = (o) => bankY(i, sd * o), lift = (o, h) => [o, Math.max(h, nrGround(T.px[i] + T.nx[i] * sd * o, T.pz[i] + T.nz[i] * sd * o) + 0.06 - y - bk(o))];
      return [[w, 0.0], [w + 1.2, -0.04], lift(Math.max(w + 1.8, bar - 0.4), -0.1), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)]; };
    const hAt = (i, sd, o) => { const Q = prof(i, sd); let k = 0; while (k < Q.length - 2 && Q[k + 1][0] < o) k++; const a = Q[k], b = Q[k + 1];
      return T.hy[i] + bankY(i, sd * o) + a[1] + (b[1] - a[1]) * clamp((o - a[0]) / Math.max(1e-3, b[0] - a[0]), 0, 1); };
    const at = (i, sd, o, a) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
    const hV = (i0) => (x, z) => { const q = nrNear(x, z), j = q.i >= 0 && gap(q.i, i0, N) < 12 ? q.i : i0, sd = q.lat >= 0 ? 1 : -1; return hAt(j, sd, Math.abs(q.lat)); };
    const st = { rob: 0, zaplate: 0, sopi: 0, kamni: 0 };
    const R = rng(seed), soft = softScen(root, matV), step = V.step;
    for (let i = 0; i < N; i += Math.max(1, Math.round(step / ds))) for (const sd of [-1, 1]) {
      if (pit(i, sd)) { R(); R(); continue; }
      const gv = sd > 0 ? T.gravR : T.gravL; if (gv && gv[i]) { R(); R(); continue; }   // (the asphalt run-offs: nothing on them)
      const bar = sd > 0 ? T.br[i] : T.bl[i], e0 = w + (T.curb && T.curb[i] ? cw : 0.05) + 0.3, e1 = bar - 0.4, g = hV(i);
      const own = (x, z) => { const q = nrNear(x, z); return q.i >= 0 && gap(q.i, i, N) * ds < 12 && q.dd <= 0 && Math.abs(q.lat) > e0 - 0.25 && Math.abs(q.lat) < bar - 0.3 && q.lat * sd > 0 && !excluded(x, z); };
      if (e1 - e0 < 0.8) continue;
      // the fringe at the asphalt's edge: two or three overlapping narrow patches along the road
      if (R() < V.eShare) { const o = e0 + 0.3 + R() * 0.25, [x, z] = at(i, sd, o, (R() - 0.5) * step * 0.5), ra = 1.3 + R() * 1.1, rb = Math.min(0.32 + R() * 0.16, (e1 - e0) * 0.4);
        if (own(x, z)) { soilE(soft, g, x, z, ra, rb, T.tx[i], T.tz[i], V.edge(R, R()), R, 0.035, 6); st.rob++; } }
      // the patches on the strip
      for (let k = 0, n = (e1 - e0) > 7 ? 2 : 1; k < n; k++) {
        if (R() > V.share) continue;
        const t = R(), o = e0 + 0.6 + t * Math.max(0, e1 - e0 - 0.6), [x, z] = at(i, sd, o, (R() - 0.5) * step);
        const rr = Math.min(0.7 + R() * V.size, (e1 - e0) * 0.5, o - e0 + 0.5, e1 - o + 0.4);
        if (rr > 0.3 && own(x, z)) { const e = 1 + R() * 0.6; soilE(soft, g, x, z, rr * e, rr / e, T.tx[i], T.tz[i], V.mid(R, R(), t), R, 0.04, 5); st.zaplate++;
          if (V.stone && R() < V.stone) for (let q = 0, m = 2 + Math.floor(R() * 3); q < m; q++) {
            const px = x + (R() - 0.5) * rr * 1.3, pz = z + (R() - 0.5) * rr * 1.3, h = R(); if (!own(px, pz)) continue;
            cushion(soft.get(px, pz), px, g(px, pz) + 0.03, pz, 0.08 + h * 0.1, 0.04 + h * 0.04, C_(R, V.stoneC, 1), R); st.kamni++; } }
      }
      // tufts at the barrier's foot
      if (R() < V.foot) for (let q = 0, m = 1 + Math.floor(R() * 2); q < m; q++) { const o = bar - 0.35 - R() * 0.35, [x, z] = at(i, sd, o, (R() - 0.5) * step * 0.7);
        if (own(x, z)) { const h = R(); tuft(soft.get(x, z), x, g(x, z), z, 0.18 + h * 0.14, 0.22 + h * 0.2, C_(R, V.tuftC, 0.95), R, 5); st.sopi++; } }
    }
    soft.done();
    return st;
  };

  /* ---- Buriram: docs/proge/buriram.md: »zalite zelene trate s pokošenimi progami«, »rdeča laterit zemlja planote Isan« ---- */
  const BR = {
    worn: [[0.44, 0.5, 0.25], [0.48, 0.52, 0.27]], dust: [[0.5, 0.46, 0.28], [0.53, 0.47, 0.29]],
    lawnL: [[0.38, 0.55, 0.21], [0.4, 0.57, 0.22]], lawnD: [[0.29, 0.46, 0.16], [0.31, 0.48, 0.17]], dry: [[0.45, 0.52, 0.25], [0.48, 0.54, 0.27]],
    tuft: [[0.26, 0.42, 0.14], [0.36, 0.5, 0.2]],
  };
  const buriram = (ctx) => {
    const st = verge(ctx, 62101, { step: 5, eShare: 0.55, share: 0.6, size: 1.0, foot: 0.12, tuftC: BR.tuft,
      edge: (R, u) => C_(R, u < 0.85 ? BR.worn : BR.dust),
      mid: (R, u, t) => C_(R, u < 0.42 ? BR.lawnD : u < 0.8 ? BR.lawnL : u < 0.96 ? BR.dry : BR.dust) });
    if (ctx.out) ctx.out.robBt62 = st;
  };

  /* ---- Sakhir: docs/proge/sakhir.md: »bled pesek, temnejši grušč in kamenje v lisah, svetlejši nanosi peska« ---- */
  const SK = {
    drift: [[0.9, 0.83, 0.66], [0.87, 0.8, 0.63]], grit: [[0.52, 0.45, 0.36], [0.47, 0.41, 0.33]], crust: [[0.7, 0.58, 0.43], [0.66, 0.55, 0.41]],
    dusty: [[0.62, 0.6, 0.45], [0.58, 0.57, 0.42]], stone: [[0.5, 0.44, 0.37], [0.6, 0.52, 0.43]], tuft: [[0.55, 0.55, 0.36], [0.62, 0.6, 0.4]],
  };
  const sakhir = (ctx) => {
    const st = verge(ctx, 62201, { step: 5, eShare: 0.5, share: 0.7, size: 1.2, foot: 0.05, stone: 0.15, stoneC: SK.stone, tuftC: SK.tuft,
      edge: (R, u) => C_(R, u < 0.7 ? SK.drift : SK.crust, 1),
      mid: (R, u, t) => C_(R, t > 0.75 && u < 0.4 ? SK.drift : u < 0.45 ? SK.grit : u < 0.75 ? SK.crust : u < 0.93 ? SK.drift : SK.dusty, 1) });
    if (ctx.out) ctx.out.robBt62 = st;
  };

  const L = API.rbLook || {};
  if (L.buriram) chain(L.buriram, (ctx) => { try { buriram(ctx); } catch (e) { console.error('chase-bt62 (buriram):', e); } });
  if (L.sakhir) chain(L.sakhir, (ctx) => { try { sakhir(ctx); } catch (e) { console.error('chase-bt62 (sakhir):', e); } });
})();
