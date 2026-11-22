/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the third group of the real tracks (after js/world-realizem-bt.js's):
   Lombok, Sakhir, Aguascalientes, Termas de Río Hondo. Each track's own look hook (LK.extra of the shared circuit builder, js/world-rbring.js) is
   chained here after the worlds are loaded; what is added goes into the builder's own scenery chunks (scen.get), so no draw is added,
   and only the named tracks change. What stands where follows each track's description (docs/proge/<id>.md) and the ground's own
   colours (the look's colMod: the same noise, so a tuft or a stone stands where the ground already shows its patch). Nothing here is
   driven on: all of it is behind the fences.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, { TAU, lerp, rng, rock, vary, cone, sstep } = API;
  let T;
  const late = [];
  API.sync.push(() => { ({ T } = API); while (late.length) { const [id, fn] = late.pop(); chainRb(id, fn); } });

  /* the look's own LK.extra chained: what this counts joins the extra's own counts (out.stats.extra.robBt3) */
  const chainRb = (id, fn) => { const L = (API.rbLook || {})[id]; if (!L || L.robBt3) return; const base = L.extra; L.robBt3 = true;
    L.extra = function (ctx) { const r = (base ? base.call(this, ctx) : null) || {};
      try { fn(L, ctx, L.robBt3 = r.robBt3 = {}); } catch (e) { console.error('realizem-bt3 (' + id + '):', e); } return r; }; };
  const rbSide = (s, side, o) => { const i = T.idx(s), d = side * ((side > 0 ? T.br[i] : T.bl[i]) + o); return [T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d]; };
  const rbPit = (s, side) => { const pd = T.def.pit; return !!pd && side === (pd[0] < 0 ? -1 : 1) && !!T.pitAt(s); };
  const rbClear = (excluded, x, z, r) => { const q = API.nrNear(x, z); return !(q.i >= 0 && q.dd < r) && !excluded(x, z); };   // (behind every leg's fence by r, off what the build keeps clear)
  const tuft = (g, x, y, z, w, h, col, R) => cone(g, x, y - 0.08, z, w, h, 5, [col[0] * 0.62, col[1] * 0.66, col[2] * 0.6], col, R() * TAU);
  const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const soil = (scen, gH, gx, gz, rr, col, R) => {   // bare ground: a low irregular patch lying on the terrain
    const k = 7, a0 = R() * TAU, rim = [col[0] * 0.9 + 0.05, col[1] * 0.9 + 0.07, col[2] * 0.9 + 0.03], g = scen.get(gx, gz), ctr = [gx, gH(gx, gz) + 0.07, gz], P = [];
    for (let q = 0; q < k; q++) { const a = a0 + q / k * TAU, r = rr * (0.65 + R() * 0.6), x = gx + Math.cos(a) * r, z = gz + Math.sin(a) * r * 0.75; P.push([x, gH(x, z) + 0.05, z]); }
    for (let q = 0; q < k; q++) g.triO(ctr, P[q], P[(q + 1) % k], col, [gx, ctr[1] - 5, gz], rim, rim); };
  /* stones in loose groups on the ground beside the track: every `step` m on both sides, to `reach` m behind the fences, where ok(x, z)
     gives the patch's strength there (0–1); cols: the rock's colours; w0–w1: their sizes (most of them small) */
  const stones = ({ scen, excluded }, R, step, reach, ok, cols, w0, w1, cnt0, cnt1) => {
    const { nrGround } = API, smooth0 = API.ROCK_SMOOTH; let m = 0;
    API.ROCK_SMOOTH = false;
    for (let s = 0; s < T.len; s += step) for (const side of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(); if (rbPit(s, side)) continue;
      const o = 3 + Math.pow(r1, 1.4) * reach, [gx, gz] = rbSide(s + (r2 - 0.5) * step, side, o), k = ok(gx, gz);
      if (!(k > 0.1) || r0 > 0.2 + 0.7 * k || !rbClear(excluded, gx, gz, 2.5)) continue;
      for (let q = 0, cnt = cnt0 + Math.floor(R() * (cnt1 - cnt0 + 1)); q < cnt; q++) {
        const x = gx + (R() - 0.5) * 7, z = gz + (R() - 0.5) * 7, w = w0 + Math.pow(R(), 2.2) * (w1 - w0);
        if (!(ok(x, z) > 0.1) || !rbClear(excluded, x, z, 2.2 + w)) { R(); R(); continue; }
        rock(scen.get(x, z), x, nrGround(x, z) + w * 0.16, z, w * 1.35, w * 0.65, w, R() * TAU, vary(cols[Math.floor(R() * cols.length)], R, 0.03), R, 0.34, 0.35); m++; }
    }
    API.ROCK_SMOOTH = smooth0; return m;
  };

  /* Lombok: docs/proge/lombok.md: »južni Lombok v sušni dobi: trava slamnato zelena, z lisami rdeče prsti; tik ob progi zalite zelene
     trate«. Past the watered lawns the dry plain was a colour on smooth ground from the camera behind the car. So from ~8 m behind the
     fences tufts of the dry season's grass stand in loose groups, straw-green and paler and browner where the ground's own colour is
     (the same noise as the look's colMod), and where the ground shows the red earth it lies bare in low patches between them. */
  late.push(['lombok', (L, { scen, excluded }, st) => {
    const { nrGround, nrLC, nrSlope, NR: P } = API; if (!T || !P || !nrGround) return;
    const R = rng(9437), smooth0 = API.ROCK_SMOOTH, straw = [0.66, 0.62, 0.36], pale = [0.74, 0.64, 0.44], red = [0.6, 0.33, 0.25]; let n = 0, m = 0;
    const open = (x, z) => { const c = nrLC(x, z); return c === 0 || c === 2; };
    API.ROCK_SMOOTH = true;
    for (let s = 0; s < T.len; s += 6) for (const side of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(); if (rbPit(s, side)) continue;
      const o = 8 + Math.pow(r1, 1.4) * 30, [gx, gz] = rbSide(s + (r2 - 0.5) * 6, side, o);
      if (!open(gx, gz) || !rbClear(excluded, gx, gz, 7)) continue;
      const dry = sstep(0.35, 0.7, P.n3(gx * 0.7 + 90, gz * 0.7 - 40)), q0 = sstep(0.3, 0.75, P.n1(gx * 0.9 - 210, gz * 0.9 + 75));
      if (nrLC(gx, gz) === 0 && P.n1(gx * 1.3 + 40, gz * 1.3 - 510) > 0.7 && r2 < 0.5 && nrSlope(gx, gz) < 0.4 && rbClear(excluded, gx, gz, 9)) { soil(scen, nrGround, gx, gz, 1.4 + R() * 1.8, vary(red, R, 0.03), R); m++; }
      if (r0 > 0.3 + 0.35 * dry) continue;
      for (let q = 0, cnt = 4 + Math.floor(R() * 5); q < cnt; q++) {
        const x = gx + (R() - 0.5) * 8, z = gz + (R() - 0.5) * 8, k = R(), a = R();
        if (!open(x, z) || !rbClear(excluded, x, z, 7)) { R(); continue; }
        tuft(scen.get(x, z), x, nrGround(x, z), z, 0.5 + k * 0.6, 0.34 + k * 0.42, vary(mix3(straw, pale, Math.min(1, q0 * (0.5 + a * 0.7))), R, 0.03), R); n++; }
    }
    API.ROCK_SMOOTH = smooth0; st.sopi = n; st.prst = m;
  }]);

  /* Sakhir: docs/proge/sakhir.md: »puščava spomladi: bled pesek, temnejši grušč in kamenje v lisah, svetlejši nanosi peska«. The grit
     and the stones were a darker colour on smooth sand from the camera behind the car. So where the ground's own colour is the darker
     grit (the same noise as the look's colMod), stones of that grey-brown rock lie in loose groups within ~32 m of the fences; the
     pale sand and its drifts stay bare, the watered lawns and the car parks as they are. */
  late.push(['sakhir', (L, ctx, st) => {
    const { nrLC, NR: P } = API; if (!T || !P || !API.nrGround) return;
    const grit = (x, z) => { const c = nrLC(x, z); return c === 1 || c >= 3 ? 0 : sstep(0.42, 0.7, P.n1(x * 0.35 + 510, z * 0.35 + 90)); };
    /* (since 22. 11. 2026: the stones in chunks of their own, casting no shadow and drawn no farther than 140 m — BT.farScen,
       js/world-chase-bt37.js: a stone of under a metre throws a shadow of a few pixels from the camera behind the car, and the
       builder's chunks drew them twice, in the shadow pass too; Sakhir's busiest place was over CLAUDE.md's 900k vertices with #821) */
    const BT = API.chaseBt, flat = BT && BT.farScen && ctx.root && ctx.matV && API.Chunks ? BT.farScen(ctx.root, ctx.matV) : null;
    st.kamni = stones(flat ? { scen: flat, excluded: ctx.excluded } : ctx, rng(9439), 7, 29, grit, [[0.5, 0.44, 0.37], [0.58, 0.5, 0.41], [0.44, 0.4, 0.36], [0.63, 0.55, 0.45]], 0.18, 0.95, 4, 8);
    if (flat) flat.done();
  }]);

  /* Aguascalientes: docs/proge/aguascalientes.md: »suha trava planote (zlata z olivnimi krpami, ob jarkih bolj zelena)«. Behind the
     oval's walls the plain was a colour on smooth ground from the camera behind the car. So tufts of the plateau's dry grass stand in
     loose groups within ~32 m of the walls: golden where the ground's own colour is dry, olive where it holds its green (the same
     noise as the look's colMod). */
  late.push(['aguascalientes', (L, { scen, excluded }, st) => {
    const { nrGround, nrLC, NR: P } = API; if (!T || !P || !nrGround) return;
    const R = rng(9463), smooth0 = API.ROCK_SMOOTH, gold = [0.78, 0.66, 0.36], tan = [0.66, 0.58, 0.36], olive = [0.44, 0.46, 0.24]; let n = 0;
    API.ROCK_SMOOTH = true;
    for (let s = 0; s < T.len; s += 4) for (const side of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(); if (rbPit(s, side)) continue;
      const o = 3 + Math.pow(r1, 1.4) * 29, [gx, gz] = rbSide(s + (r2 - 0.5) * 4, side, o);
      if (nrLC(gx, gz) !== 0 || !rbClear(excluded, gx, gz, 2.5)) continue;
      const dry = sstep(0.42, 0.7, P.n3(gx * 0.7 + 60, gz * 0.7 - 130)), ol = sstep(0.6, 0.8, P.n1(gx * 1.1 - 170, gz * 1.1 + 45));
      if (r0 > 0.25 + 0.4 * Math.max(dry, ol)) continue;
      for (let q = 0, cnt = 4 + Math.floor(R() * 5); q < cnt; q++) {
        const x = gx + (R() - 0.5) * 7, z = gz + (R() - 0.5) * 7, k = R(), a = R();
        if (nrLC(x, z) !== 0 || !rbClear(excluded, x, z, 2.4)) { R(); continue; }
        const col = ol > dry && a < 0.3 + 0.6 * ol ? olive : mix3(tan, gold, Math.min(1, dry * (0.6 + a * 0.5) + a * 0.25));
        tuft(scen.get(x, z), x, nrGround(x, z), z, 0.45 + k * 0.55, 0.32 + k * 0.4, vary(col, R, 0.03), R); n++; }
    }
    API.ROCK_SMOOTH = smooth0; st.sopi = n;
  }]);
  /* Termas de Río Hondo: docs/proge/riohondo.md: »pokošene trate ob ograjah, dlje suha slamnata trava z lisami gole zemlje«. Past the
     mown lawns the plain of the Gran Chaco was a colour on smooth ground from the camera behind the car. So from ~10 m behind the
     fences, thicker the further from the lawns, tufts of the plain's dry grass stand in loose groups (straw-green, paler and browner
     where the ground's own colour is: the same noise as the look's colMod), fewer on the monte's dusty floor, and where the ground
     shows the pale grey-brown earth it lies bare in low patches between them. */
  late.push(['riohondo', (L, { scen, excluded }, st) => {
    const { nrGround, nrLC, nrSlope, NR: P } = API; if (!T || !P || !nrGround) return;
    const R = rng(9479), smooth0 = API.ROCK_SMOOTH, straw = [0.66, 0.62, 0.36], pale = [0.78, 0.68, 0.46], earth = [0.66, 0.58, 0.44]; let n = 0, m = 0;
    API.ROCK_SMOOTH = true;
    for (let s = 0; s < T.len; s += 5) for (const side of [-1, 1]) {
      const r0 = R(), r1 = R(), r2 = R(); if (rbPit(s, side)) continue;
      const o = 10 + Math.pow(r1, 1.3) * 28, [gx, gz] = rbSide(s + (r2 - 0.5) * 5, side, o), c = nrLC(gx, gz);
      if (!(c === 0 || c === 1) || !rbClear(excluded, gx, gz, 9)) continue;
      const dry = sstep(0.35, 0.7, P.n3(gx * 0.7 + 90, gz * 0.7 - 40)), q0 = sstep(0.3, 0.75, P.n1(gx * 0.9 - 210, gz * 0.9 + 75)), far = sstep(8, 26, o);
      if (P.n1(gx * 1.2 + 40, gz * 1.2 - 510) > 0.68 && r2 < 0.55 && o > 16 && nrSlope(gx, gz) < 0.4 && rbClear(excluded, gx, gz, 12)) { soil(scen, nrGround, gx, gz, 1.4 + R() * 1.9, vary(earth, R, 0.03), R); m++; }
      if (r0 > (0.45 + 0.4 * dry) * (0.4 + 0.6 * far) * (c === 1 ? 0.5 : 1)) continue;
      for (let q = 0, cnt = 3 + Math.floor(R() * 4); q < cnt; q++) {
        const x = gx + (R() - 0.5) * 8, z = gz + (R() - 0.5) * 8, k = R(), a = R(), cc = nrLC(x, z);
        if (!(cc === 0 || cc === 1) || !rbClear(excluded, x, z, 9)) { R(); continue; }
        const col = vary(mix3(straw, pale, Math.min(1, q0 * (0.5 + a * 0.7))), R, 0.03);   // (four-sided: the track is near its vertex budget)
        API.cone(scen.get(x, z), x, nrGround(x, z) - 0.08, z, 0.5 + k * 0.6, 0.34 + k * 0.44, 4, [col[0] * 0.62, col[1] * 0.66, col[2] * 0.6], col, R() * TAU); n++; }
    }
    API.ROCK_SMOOTH = smooth0; st.sopi = n; st.prst = m;
  }]);
})();
