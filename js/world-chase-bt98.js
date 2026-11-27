/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the ninety-eighth group of the real tracks: Pembrey and
   Quezaltepeque, a further pass on two circuits of the shared builder (js/world-rbring.js) whose ground the earlier groups set (Pembrey:
   js/world-chase-bt21.js, js/world-chase-bt39.js, js/world-chase-bt78.js: the verge, the run-offs' sand, the worn edge, wide flat patches
   and a few tufts to ~60 m; Quezaltepeque: js/world-chase-bt47.js, js/world-chase-bt68.js: the fences' foot, the bushes, the lawn's and the
   hills' flat patches to ~60 m). From behind the car, past the fences both still read as a mown sheet with flat patches lying on it and a
   lone tuft here and there: nothing standing in the grass between them. So here, as the eighty-fifth group did (js/world-chase-bt85.js),
   standing things in loose groups from ~3.5 m past the barrier line to ~60 m, denser near, thinner far:
   Pembrey (docs/proge/pembrey.md: »med borovim gozdom in sipinami ob morju«, »obalna trava v suhih in vlažnih lisah, na poljih pašniki in
   pokošena silaža«): the coastal grass in standing tufts, the paler dry ones and the darker damp ones, rushes in small stands, the bare
   sand in low spots between them; under the pines (land cover 1) the needles and thin dark grass. The builder's gorse stays as it is.
   Quezaltepeque (docs/proge/quezaltepeque.md: »zelen hribovit svet s suhimi rumenimi lisami: trate, grmovje, gaji listavcev in palm«,
   »stara lava (temna, siva in rjava kamnita tla z nizkim grmovjem)«): on the grass standing green and dry yellow tufts, on the scrubland
   (2) low bushes with dry grass between, under the groves (1) the leaf litter and low undergrowth, on the old flow (API.qzLava) dark grey
   and brown stones, low scrub and the ash between them.
   Nothing on the asphalt, the kerbs, the run-offs (all inside the barrier line), on built ground (3), on the pits' side along the pits,
   in the builders' excluded places, where another leg's road is nearer, on a face too steep or far below the road. The horizons stay the
   builders' own rings. All of it in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road, the kerbs, the
   barriers, the trees and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !BT.chain || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion, chain } = BT;

  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  // (as js/world-chase-bt85.js: a third of the way toward the colour's grey and a little darker, so a thing reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, a, k) => mute(vary(mix3(a[0], a[1], R()), R, 0.015), k);
  const T3 = (R, a, k) => mute(vary(mix3(a[0], a[1], R()), R, 0.03), k || 0.97);

  /* the band (js/world-chase-bt85.js's, the place handed on to C.pick): every C.step m on both sides C.n tries from C.from m past the
     barrier line to C.reach m (denser near); each place a small group (C.grp things within C.spread m) of one kind's pick */
  const band = (soft, near, gT, slope, lc, bad, R, C, st) => {
    const T = API.T, N = T.px.length;
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < C.n; k++) {
        const oo = bar + C.from + Math.pow(R(), C.pw) * (C.reach - C.from), a = (R() - 0.5) * C.step * 1.6;
        if (R() > C.keep(oo - bar)) continue;
        const gx = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, gz = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a, u = R();
        for (let m = 0, n = 1 + Math.floor(R() * C.grp); m < n; m++) {
          const x = gx + (m ? (R() - 0.5) * C.spread : 0), z = gz + (m ? (R() - 0.5) * C.spread : 0);
          const q = near(x, z); if (q.i < 0 || gap(q.i, i, N) * T.ds > oo + 12) continue;
          const qb = q.lat > 0 ? T.br[q.i] : T.bl[q.i]; if (Math.abs(q.lat) < qb + Math.min(2, C.from * 0.7)) continue;   // (on or by a road: this leg's or another's)
          if (bad(x, z)) continue;
          const y = gT(x, z), s = slope(x, z); if (!(y > T.hy[i] - C.drop) || !(y < T.hy[i] + C.rise) || s > C.maxSl) continue;
          const c = lc ? lc(x, z) : 0; if (c === 3) continue;
          const P = C.pick(R, oo - bar, c, x, z, m ? (u + R() * 0.12) % 1 : u), h = R(); if (!P) continue;
          if (P.k === 'p') soil(soft, gT, x, z, P.r, P.col, R, 0.05);
          else if (P.k === 'g' || P.k === 's') cushion(soft.get(x, z), x, y - (P.k === 's' ? 0.05 : 0), z, P.w * (0.75 + h * 0.55), P.h * (0.75 + h * 0.55), P.col, R);
          else tuft(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.4), P.h * (0.8 + h * 0.5), P.col, R, P.n || 5);
          st[P.c] = (st[P.c] || 0) + 1;
        }
      }
    }
    return st;
  };

  /* ---- Pembrey (colours of js/world-chase-bt78.js PB: the coastal grass dry and damp, the rushes, the sand, the pines' needles) ---- */
  const PB = {
    dry: [[0.6, 0.58, 0.35], [0.67, 0.63, 0.4]], damp: [[0.3, 0.43, 0.18], [0.35, 0.47, 0.2]], coast: [[0.44, 0.53, 0.26], [0.52, 0.56, 0.3]],
    rush: [[0.28, 0.39, 0.18], [0.33, 0.43, 0.2]], sand: [[0.74, 0.68, 0.52], [0.78, 0.71, 0.55]], needle: [[0.46, 0.35, 0.22], [0.5, 0.38, 0.24]],
  };
  const PBF = { step: 3.4, n: 2, grp: 4, spread: 3.4, from: 3.5, reach: 60, pw: 1.6, drop: 3, rise: 6, maxSl: 1.1,
    keep: (d) => d < 30 ? 0.8 : 0.6,
    pick: (R, d, c, x, z, u) => { const w = d < 30 ? 2.0 : 2.6, H = 1.35;
      if (c === 1) return u < 0.5 ? { c: 'iglice', k: 'p', r: (0.9 + R() * 1.1) * w, col: C3(R, PB.needle) }   // (under the pines)
        : u < 0.85 ? { c: 'sopi', k: 't', w: 0.28 * w, h: 0.36 * H, col: T3(R, PB.damp) } : null;
      if (u < 0.34) return { c: 'sopi', k: 't', w: 0.3 * w, h: 0.5 * H, col: T3(R, PB.coast) };   // (the coastal grass)
      if (u < 0.58) return { c: 'sopi', k: 't', w: 0.3 * w, h: 0.58 * H, col: T3(R, PB.dry) };   // (its dry, paler stands)
      if (u < 0.76) return { c: 'sopi', k: 't', w: 0.34 * w, h: 0.42 * H, col: T3(R, PB.damp), n: 6 };   // (the damp, darker ones)
      if (u < 0.92) return { c: 'locje', k: 't', w: 0.2 * w, h: 0.8 * H, col: T3(R, PB.rush), n: 4 };   // (rushes: narrow, tall, in stands)
      return { c: 'pesek', k: 'p', r: (0.6 + R() * 0.8) * w, col: C3(R, PB.sand) }; } };   // (the bare sand)

  /* ---- Quezaltepeque (colours of js/world-chase-bt68.js QZ and js/world-chase-bt47.js: the green, the dry yellow, the scrub, the
     groves' litter, the old flow's stones and ash) ---- */
  const QZ = {
    green: [[0.3, 0.46, 0.17], [0.36, 0.5, 0.2]], dry: [[0.66, 0.62, 0.36], [0.73, 0.67, 0.4]], pale: [[0.48, 0.55, 0.28], [0.52, 0.58, 0.31]],
    scrub: [[0.27, 0.38, 0.17], [0.33, 0.42, 0.2]], litter: [[0.44, 0.38, 0.26], [0.48, 0.41, 0.28]], under: [[0.26, 0.4, 0.16], [0.3, 0.44, 0.18]],
    lava: [[0.3, 0.29, 0.28], [0.42, 0.36, 0.3]], ash: [[0.46, 0.41, 0.35], [0.5, 0.45, 0.38]],
  };
  const qzLava = (x, z) => (API.qzLava ? API.qzLava(x, z) : 0);
  // (sparser than Pembrey's: this track's busiest place is near the phone budget, tests/golden/perf.json)
  const QZF = { step: 5.4, n: 2, grp: 3, spread: 3.6, from: 3.5, reach: 48, pw: 1.6, drop: 10, rise: 18, maxSl: 1.0,
    keep: (d) => d < 30 ? 0.7 : 0.4,
    pick: (R, d, c, x, z, u) => { const w = d < 30 ? 2.0 : 2.6, H = 1.35;
      if (qzLava(x, z) > 0.5) return u < 0.5 ? { c: 'kamni', k: 's', w: (0.35 + R() * 0.3) * w, h: 0.26, col: T3(R, QZ.lava, 0.95) }
        : u < 0.78 ? { c: 'grmi', k: 'g', w: 0.6 * w, h: 0.36 * H, col: T3(R, QZ.scrub) } : { c: 'pepel', k: 'p', r: (0.8 + R() * 0.9) * w, col: C3(R, QZ.ash) };
      if (c === 1) return u < 0.45 ? { c: 'listje', k: 'p', r: (1.0 + R() * 1.2) * w, col: C3(R, QZ.litter) }   // (under the groves)
        : u < 0.85 ? { c: 'podrast', k: 'g', w: 0.55 * w, h: 0.36 * H, col: T3(R, QZ.under) } : null;
      if (c === 2) return u < 0.45 ? { c: 'grmi', k: 'g', w: 0.75 * w, h: 0.5 * H, col: T3(R, QZ.scrub) }   // (the scrubland)
        : u < 0.85 ? { c: 'sopi', k: 't', w: 0.32 * w, h: 0.5 * H, col: T3(R, QZ.dry) } : { c: 'sopi', k: 't', w: 0.3 * w, h: 0.44 * H, col: T3(R, QZ.green) };
      if (u < 0.42) return { c: 'sopi', k: 't', w: 0.32 * w, h: 0.46 * H, col: T3(R, QZ.green) };   // (the green hills)
      if (u < 0.72) return { c: 'sopi', k: 't', w: 0.3 * w, h: 0.55 * H, col: T3(R, QZ.dry) };   // (their dry yellow patches)
      if (u < 0.88) return { c: 'sopi', k: 't', w: 0.3 * w, h: 0.4 * H, col: T3(R, QZ.pale) };
      return { c: 'grmi', k: 'g', w: 0.6 * w, h: 0.4 * H, col: T3(R, QZ.scrub) }; } };

  const build = (ctx, seed, C) => {
    const root = ctx.root, matV = ctx.matV || (ctx.out && ctx.out.matV), excluded = ctx.excluded || (() => false), T = API.T, { nrGround, nrNear, nrLC } = API;
    if (!root || !matV || !T || !T.br || !nrGround || !nrNear) return null;
    const ds = T.ds, pd = T.def && T.def.pit, PSD = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const pitI = (i) => !!T.pitAt && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25)) || (T.pitLead ? T.pitLead(i * ds) >= 0 : false);
    const bad = (x, z) => { if (excluded(x, z)) return true; if (!PSD) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === PSD && pitI(q.i); };
    const slope = (x, z) => { const d = 1.0, a = nrGround(x + d, z) - nrGround(x - d, z), b = nrGround(x, z + d) - nrGround(x, z - d); return Math.hypot(a, b) / (2 * d); };
    const R = rng(seed), soft = softScen(root, matV), st = {};
    band(soft, nrNear, nrGround, slope, nrLC, bad, R, C, st);
    soft.done(); return st;
  };
  const L = API.rbLook || {};
  const add = (id, seed, C) => { if (L[id]) chain(L[id], (ctx) => { try {
    const T = API.T; if (!T || (T.def && T.def.id !== id) || !ctx.out) return;
    ctx.out.pasBt98 = build(ctx, seed, C);
  } catch (e) { console.error('chase-bt98 (' + id + '):', e); } }); };
  add('pembrey', 98100, PBF);
  add('quezaltepeque', 98200, QZF);
})();
