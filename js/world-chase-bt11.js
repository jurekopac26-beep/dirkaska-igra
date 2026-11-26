/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the eleventh group of the real tracks: the four short tracks on
   the shared mountain-road builder (js/world-gore.js) Ghoufi, Isuna, Ujarrás and Cusco. Each track's S.extra calls World.ext.goreRob
   (ctx, id) as its last line, so the build's excluded places (the landmarks, S.clear, keepOut, the villages' plots) are all in. What is
   added goes into meshes of its own (the sixth group's softScen: 256 m chunks that cast no shadow and that the animals' and the people's
   tests of a free place leave out), so only these four tracks change. Nothing here is driven on: all of it is behind the barrier line;
   the terrain, the road, the barriers and the trees stay as they are. What stands where follows each docs/proge/<id>.md and the land
   cover (ESA WorldCover classes: 0 grass, 1 forest, 2 shrub, 3 built, 4 bare rock, 5 water).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, sstep } = API;
  if (!BT || !BT.walk) return;
  const { walk, tuft, cushion, soil, softScen, mix3 } = BT;
  World.ext = World.ext || {};
  const hh = (i, j) => { const t = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return t - Math.floor(t); };
  const vn = (x, z) => { const i = Math.floor(x), j = Math.floor(z), u = x - i, v = z - j, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v);   // (a smooth value noise of its own)
    return (hh(i, j) * (1 - a) + hh(i + 1, j) * a) * (1 - b) + (hh(i, j + 1) * (1 - a) + hh(i + 1, j + 1) * a) * b; };
  const grp = (x, z, ox, oz, sc) => 0.5 + 0.5 * sstep(0.3, 0.7, vn((x + ox) / sc, (z + oz) / sc));   // (in loose groups, not an even carpet)

  /* A river of def.riverBeds (Isuna's Paro Chhu): its distance in 16 m cells, so nothing stands in the bed or on the water's edge */
  function riverTest(def) {
    const cells = new Map(), C = 16;
    for (const a of (def && def.riverBeds) || []) { const hw = a[0] / 2;
      for (let k = 1; k + 1 < a.length; k += 2) { const x = a[k], z = a[k + 1], i = Math.floor(x / C), j = Math.floor(z / C);
        for (let u = -1; u <= 1; u++) for (let v = -1; v <= 1; v++) { const key = (i + u) + ',' + (j + v); let L = cells.get(key); if (!L) cells.set(key, L = []); L.push(x, z, hw); } } }
    if (!cells.size) return null;
    return (x, z, m) => { const L = cells.get(Math.floor(x / C) + ',' + Math.floor(z / C)); if (!L) return false;
      for (let k = 0; k < L.length; k += 3) { const dx = x - L[k], dz = z - L[k + 1], r = L[k + 2] + m; if (dx * dx + dz * dz < r * r) return true; } return false; };
  }

  /* Each track: three bands past the barrier line, as on the earlier groups.
     edge: the uncut strip at the barrier's foot (0.5-3.5 m behind it) — tufts;
     mid:  1-14 m — low cushions (and the bare or littered ground between them);
     far:  6-30 m — the taller plants in loose groups.
     A band's ok(c, sl, x, z) is its strength at that land cover class and slope (0: nothing). */
  const LOOK = {
    /* Ghoufi: docs/proge/ghoufi.md: »tekoči ovinki … po robu kanjona v gorovju Aurès«, dry stony ground (the build's ground: ochre rock and
       dry grass, almost no trees). The Aurès' dry slopes: the alfa (halfa) grass in tough grey-green tussocks on the stony ground and the
       white wormwood (armoise) in low grey cushions between them; the bare pale gravel between. Nothing on the cliffs (slope) or in
       the village (built). */
    ghoufi: { seed: 11101, st: ['alfa', 'pelin', 'prod'],
      edge: { ok: (c, sl) => (c === 0 || c === 2 || c === 4) && sl < 0.9 ? 0.6 : 0, n: [2, 3],
        put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.32 + h * 0.22, 0.38 + h * 0.3, vary(mix3(S.c.alfa, S.c.dry, R() * 0.5), R, 0.03), R, 5); S.st.alfa++; } },
      mid: { ok: (c, sl) => (c === 3 || c === 5 || sl > 1.0) ? 0 : c === 4 ? 0.5 : 0.75, n: [2, 4], litter: 0.55, lit: 'grav', lr: [1.0, 2.0], ln: 'prod',
        put: (S, x, y, z, h, R) => { if (R() < 0.6) { tuft(S.g(x, z), x, y, z, 0.38 + h * 0.3, 0.45 + h * 0.35, vary(S.c.alfa, R, 0.03), R, 5); S.st.alfa++; }
          else { cushion(S.g(x, z), x, y, z, 0.4 + h * 0.35, 0.28 + h * 0.2, vary(S.c.pelin, R, 0.025), R); S.st.pelin++; } } },
      far: { ok: (c, sl) => (c === 0 || c === 2) && sl < 0.8 ? 0.4 : 0, n: [2, 4],
        put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.5 + h * 0.3, 0.6 + h * 0.35, vary(S.c.alfa, R, 0.03), R, 5); S.st.alfa++; } },
      col: { alfa: [0.55, 0.56, 0.36], dry: [0.7, 0.62, 0.42], pelin: [0.58, 0.6, 0.5], grav: [0.7, 0.62, 0.48] } },
    /* Isuna: docs/proge/isuna.md: »ob reki, pod gozdom modrega bora … gozd jelk in borov na pobočjih … krave«. Under the blue pines by the
       road the floor is their long rust-brown needles; on the grazed verges short grass in tufts, and the valley's dry slopes have the
       grey-green wormwood (Artemisia) bushes in loose groups. Nothing in the river's bed or on its edge. */
    isuna: { seed: 11201, st: ['trava', 'pelin', 'iglice'], river: true,
      edge: { ok: (c, sl) => (c === 0 || c === 2) && sl < 0.8 ? 0.65 : 0, n: [3, 3],
        put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.26 + h * 0.2, 0.3 + h * 0.28, vary(mix3(S.c.gr, S.c.seed, R() * 0.5), R, 0.03), R, 4); S.st.trava++; } },
      mid: { ok: (c, sl, x, z, w) => (c === 3 || c === 4 || c === 5 || sl > 1.1) ? 0 : c === 1 ? 0.85 : w > 0.3 ? 0.7 : 0.35, n: [1, 3], litter: 0.35, lit: 'ndl', lr: [0.8, 1.5], ln: 'iglice', wood: true,
        put: (S, x, y, z, h, R, w) => { if (w > 0.3 && R() < 0.45) { tuft(S.g(x, z), x, y, z, 0.3 + h * 0.2, 0.25 + h * 0.2, vary(S.c.gr, R, 0.03), R, 4); S.st.trava++; }
          else { cushion(S.g(x, z), x, y, z, 0.6 + h * 0.5, 0.32 + h * 0.25, vary(S.c.pelin, R, 0.025), R); S.st.pelin++; } } },
      far: { ok: (c, sl, x, z, w) => (c === 0 || c === 2) && sl < 0.9 ? 0.45 * (1 - w) : 0, n: [2, 4],
        put: (S, x, y, z, h, R) => { cushion(S.g(x, z), x, y, z, 0.7 + h * 0.5, 0.4 + h * 0.3, vary(S.c.pelin, R, 0.025), R); S.st.pelin++; } },
      col: { gr: [0.4, 0.5, 0.22], seed: [0.62, 0.58, 0.36], pelin: [0.5, 0.55, 0.42], ndl: [0.4, 0.33, 0.23] } },
    /* Ujarrás: docs/proge/ujarras.md: »tropski listavci … ob cesti trava«, the coffee country over the Orosi valley. The verge's tall uncut
       grass in dense tufts at the barrier's foot; at the forest's edge and under it the big ferns and broad-leaved undergrowth in low
       clumps on the dark volcanic soil; on the open slopes taller grass in loose groups. Nothing on the lookout (S.clear and its walls). */
    ujarras: { seed: 11301, st: ['trava', 'praprot', 'zemlja'],
      edge: { ok: (c, sl) => (c === 0 || c === 2 || c === 1) && sl < 0.9 ? 0.8 : 0, n: [3, 4],
        put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.32 + h * 0.26, 0.5 + h * 0.45, vary(mix3(S.c.gr, S.c.gr2, R()), R, 0.03), R, 5); S.st.trava++; } },
      mid: { ok: (c, sl, x, z, w) => (c === 3 || c === 4 || c === 5 || sl > 1.1) ? 0 : w > 0.25 || c === 1 ? 0.9 : 0.4, n: [3, 5], litter: 0.35, lit: 'soil', lr: [1.0, 1.8], ln: 'zemlja', wood: true,
        put: (S, x, y, z, h, R, w) => { if (w > 0.25 || R() < 0.3) { cushion(S.g(x, z), x, y, z, 0.6 + h * 0.6, 0.5 + h * 0.5, vary(R() < 0.6 ? S.c.fern : S.c.under, R, 0.03), R); S.st.praprot++; }
          else { tuft(S.g(x, z), x, y, z, 0.36 + h * 0.26, 0.55 + h * 0.45, vary(S.c.gr, R, 0.03), R, 5); S.st.trava++; } } },
      far: { ok: (c, sl, x, z, w) => (c === 0 || c === 2) && sl < 0.9 ? 0.5 * (1 - w) : 0, n: [2, 4],
        put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.45 + h * 0.3, 0.8 + h * 0.6, vary(S.c.gr2, R, 0.03), R, 5); S.st.trava++; } },
      col: { gr: [0.3, 0.5, 0.16], gr2: [0.4, 0.54, 0.2], fern: [0.22, 0.44, 0.13], under: [0.2, 0.36, 0.14], soil: [0.27, 0.21, 0.15] } },
    /* Cusco: docs/proge/cusco.md: »drevesa (evkaliptusi), trava, skale«, 3500-3600 m over the town. The Andes' puna grass (ichu) in tall
       straw-yellow tussocks on the open slopes and at the barrier's foot; under the eucalyptus their grey-brown litter of bark strips and
       leaves; here and there the blue-grey agave by the road, as it grows on the slopes round Cusco. Nothing by the terrace walls
       (keepOut) or in the town (built). */
    cusco: { seed: 11401, st: ['ichu', 'agava', 'listje'],
      edge: { ok: (c, sl) => (c === 0 || c === 2 || c === 4) && sl < 0.9 ? 0.7 : 0, n: [2, 4],
        put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.3 + h * 0.22, 0.42 + h * 0.35, vary(mix3(S.c.ichu, S.c.ichu2, R()), R, 0.03), R, 5); S.st.ichu++; } },
      mid: { ok: (c, sl, x, z, w) => (c === 3 || c === 5 || sl > 1.0) ? 0 : c === 1 || w > 0.3 ? 0.6 : 0.7, n: [2, 4], litter: 0.5, lit: 'leaf', lr: [1.2, 2.2], ln: 'listje', wood: true, litW: true,
        put: (S, x, y, z, h, R, w) => { if (w < 0.3 && R() < 0.12) { const g = S.g(x, z), col = vary(S.c.agave, R, 0.02);   // (an agave: a low wide rosette and its taller narrow heart)
            cushion(g, x, y, z, 0.7 + h * 0.4, 0.45 + h * 0.25, col, R); tuft(g, x, y + 0.2, z, 0.35 + h * 0.15, 0.6 + h * 0.3, col, R, 6); S.st.agava++; }
          else { tuft(S.g(x, z), x, y, z, 0.4 + h * 0.3, 0.55 + h * 0.4, vary(w > 0.3 ? S.c.ichu2 : S.c.ichu, R, 0.03), R, 5); S.st.ichu++; } } },
      far: { ok: (c, sl, x, z, w) => (c === 0 || c === 2 || c === 4) && sl < 0.9 ? 0.45 * (1 - w * 0.7) : 0, n: [2, 4],
        put: (S, x, y, z, h, R) => { tuft(S.g(x, z), x, y, z, 0.5 + h * 0.3, 0.7 + h * 0.4, vary(S.c.ichu, R, 0.03), R, 5); S.st.ichu++; } },
      col: { ichu: [0.7, 0.64, 0.4], ichu2: [0.58, 0.57, 0.33], agave: [0.46, 0.56, 0.54], leaf: [0.38, 0.33, 0.25] } },
  };

  /* o (optional, for the later groups' tracks on Vršič's corridor with a ground of their own): o.gH, o.slope (the ground and its slope;
     default vrGround, vrSlope), o.bad(x, z) (more places to leave free, e.g. a stream's banks). LOOK is open (goreRob.LOOK) for them. */
  World.ext.goreRob = (ctx, id, o) => {
    o = o || {};
    const L = LOOK[id], vrLC = o.lc || API.vrLC, vrNear = o.near || API.vrNear, vrWater = o.lc ? o.water : API.vrWater, gH = o.gH || API.vrGround, vrSlope = o.slope || API.vrSlope, st = {};
    if (!L) return st; for (const k of L.st) st[k] = 0;
    if (!vrLC || !gH || !vrNear || !API.T || !ctx.root || !ctx.out || !ctx.out.matV) return st;
    const { excluded, root } = ctx, soft = softScen(root, ctx.out.matV), riv = L.river ? riverTest(API.T.def) : null;
    const bad = (x, z) => excluded(x, z) || (riv && riv(x, z, 5)) || (vrWater && vrWater(x, z).e > -1) || (o.bad && o.bad(x, z));
    const env = { near: vrNear, excluded: bad }, sl = (x, z) => vrSlope(x, z);
    const wood = (x, z) => { let a = 0; for (const [u, v] of [[12, 0], [-12, 0], [0, 12], [0, -12], [9, 9], [-9, -9], [9, -9], [-9, 9]]) if (vrLC(x + u, z + v) === 1) a++; return a / 8; };
    const S = { g: (x, z) => soft.get(x, z), c: L.col, st, lc: vrLC };   // (lc: the land cover, for a look whose put reads it: js/world-chase-bt20.js)
    const band = (B, seed, step, reach, o0, spread, inner, outer, ox, sc) => walk(env, L.seed + seed, step, reach, o0, (x, z) => {
      const w = B.wood || B === L.far ? wood(x, z) : 0; return B.ok(vrLC(x, z), sl(x, z), x, z, w) * grp(x, z, ox, -ox * 1.7, sc); }, (gx, gz, k, R, free) => {
      const w = B.wood ? wood(gx, gz) : 0;
      if (B.litter && R() < B.litter && free(gx, gz, 2.5) && (!B.litW || w > 0.3 || vrLC(gx, gz) === 1)) { soil(soft, gH, gx, gz, B.lr[0] + R() * (B.lr[1] - B.lr[0]), vary(L.col[B.lit], R, 0.02), R, 0.05); st[B.ln]++; }
      for (let q = 0, n = B.n[0] + Math.floor(R() * (B.n[1] - B.n[0] + 1)); q < n; q++) {
        const x = gx + (R() - 0.5) * spread, z = gz + (R() - 0.5) * spread, h = R();
        if (!free(x, z, inner) || (outer && free(x, z, outer)) || bad(x, z)) continue;
        B.put(S, x, gH(x, z), z, h, R, w);
      } });
    band(L.edge, 1, 1.2, 1.0, 2.2, 3.2, 0.5, 3.5, 30, 21);    // (the strip at the barrier's foot: never past 3.5 m)
    band(L.mid, 2, 1.6, 12, 1.4, 4.5, 1.0, 0, 40, 19);
    band(L.far, 3, 3.5, 24, 6, 5, 4, 0, 110, 27);
    soft.done();
    for (const g of root.children) if (g.isGroup) for (const m of g.children) if (m.userData.rob && m.name === 'rob') m.castShadow = false;   // (knee-high plants: no second draw in the shadow pass)
    ctx.out.rob = st;
    return st;
  };
  World.ext.goreRob.LOOK = LOOK;
})();
