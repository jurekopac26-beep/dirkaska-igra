/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the ninetieth group of the real tracks: Buriram and Canaries, a
   further pass on a circuit and a mountain road whose ground the earlier groups set (Buriram: js/world-chase-bt41.js,
   js/world-chase-bt62.js: flat patches of the lawn's and the paddies' tones to ~60 m, the strip between the asphalt and the barriers;
   Canaries: js/world-chase-bt8.js, js/world-chase-bt38.js: tufts and bushes within ~16 m, the verge, the bank, sparse flat patches to
   ~55 m). From behind the car, on Buriram nothing stood past the barriers: the lawn and the paddies were one flat sheet with patches; on
   Canaries past ~16 m the slopes were flat patches only, the forest's floor as bare as the open grass.
   So here:
   Buriram (docs/proge/buriram.md: »zalite zelene trate s pokošenimi pasovi, za njimi riževa polja v pravokotnih parcelah, zelena in
   zlata, strnišča in mokra polja«), chained on the look's extra (js/world-rbring.js rbLook.buriram), from ~8 m past the barriers to
   ~85 m: on the paddies (land cover 2) each field by its own kind, on the same grid as the terrain's colours (js/world-buriram.js
   paddy): standing clumps of the ripe golden rice, of the tall and of the young green rice, the short pale stubble, nothing on the wet
   fields; taller grass on the bunds between the fields; on the lawn only a few low tufts of its own green and a drier spot; under the
   tree belts (1) the dry leaf litter and low grass. Nothing in the pond and the wetlands (def.sk.lakes, def.sk.wet: OSM) or within 3 m
   of them, on built ground (3), on the pits' side along the pits.
   Canaries (docs/proge/canaries.md: »gost listnat gozd …, grmovje in trava po rabi tal …; rdeče-rjava prst v vsekih, sivo-rjav andezit
   v pečinah«), chained on the look's extra (js/world-prelaz.js PL_LOOK.canaries), from ~3 m past the barrier line to ~60 m: under the
   forest (land cover 1) the dark leaf litter and low ferns; on the scrub (2) low dark cushions and tussocks; on the grass (0) patches
   of a wetter and a sun-dried green and soft tussocks in a mid green; on the rock and the scree (4, 7) and on steep faces grey-brown
   andesite stones and the red-brown earth. Nothing in the villages (3), on snow or water (5, 6).
   Nothing in the builders' excluded places, on or by a road (this leg's or another's), on a face too steep or far below the road. The
   horizon stays the builders' own DEM terrain. All of it in meshes of their own (as js/world-chase-bt62.js: no shadow, chunks that draw
   nothing when far from the camera: both tracks' busiest places are near the limit of 900 thousand vertices, so the bands are sparse);
   the terrain, the road, the barriers, the trees and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || typeof THREE === 'undefined') return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.tuft || !BT.cushion || !BT.chain || !vary || !rng || !API.Chunks) return;
  const { mix3, soil, tuft, cushion, chain } = BT;

  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  // (as js/world-chase-bt84.js: a third of the way toward the colour's grey and a little darker, so a patch reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, a, k) => mute(vary(mix3(a[0], a[1], R()), R, 0.015), k);
  const T3 = (R, a, k) => mute(vary(mix3(a[0], a[1], R()), R, 0.03), k || 0.97);

  /* (the sixty-second group's softScen: no shadow, and a chunk whose middle is farther than FAR from the camera draws nothing) */
  const FAR = 150;
  const softScen = (root, matV, size) => { const ch = new API.Chunks(size); return { get: (x, z) => ch.get(x, z), done() { const grp = new THREE.Group(); ch.addTo(grp, matV, false, true);
    for (const m of grp.children) { m.name = 'rob'; m.userData.rob = m.userData.lj = true;
      const geo = m.geometry; geo.computeBoundingSphere(); const c = geo.boundingSphere.center.clone(), f2 = (FAR + geo.boundingSphere.radius) ** 2;
      m.onBeforeRender = (r, sc, cam) => { geo.setDrawRange(0, cam.position.distanceToSquared(c) > f2 ? 0 : Infinity); }; }
    if (grp.children.length) root.add(grp); } }; };

  /* the band (as the eighty-fifth group's): every C.step m on both sides C.n tries from C.from m past the barrier line to C.reach m
     (denser near); each place a small group (C.grp things within C.spread m), so it reads as clumps, not as an even sprinkle.
     near(x, z) -> { i, lat }; C.pick(R, d, s, c, dE, x, z) -> what stands there, or null */
  const band = (soft, near, gT, slope, lc, bad, R, C, st) => {
    const T = API.T, N = T.px.length;
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < C.n; k++) {
        const oo = bar + C.from + Math.pow(R(), C.pw) * (C.reach - C.from), a = (R() - 0.5) * C.step * 1.6;
        if (R() > C.keep(oo - bar, oo - T.wAt(i))) continue;
        const gx = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, gz = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a;
        for (let m = 0, n = 1 + Math.floor(R() * C.grp); m < n; m++) {
          const x = gx + (m ? (R() - 0.5) * C.spread : 0), z = gz + (m ? (R() - 0.5) * C.spread : 0);
          const q = near(x, z); if (q.i < 0 || gap(q.i, i, N) * T.ds > oo + 12) continue;
          const qb = q.lat > 0 ? T.br[q.i] : T.bl[q.i]; if (Math.abs(q.lat) < qb + Math.min(2, C.from * 0.7)) continue;   // (on or by a road: this leg's or another's)
          if (bad(x, z)) continue;
          const y = gT(x, z), s = slope(x, z); if (!(y > T.hy[i] - C.drop) || !(y < T.hy[i] + C.rise) || s > C.maxSl) continue;
          const c = lc ? lc(x, z) : 0; if (C.skip && C.skip(c)) continue;
          const dE = Math.abs(q.lat) - T.wAt(q.i);
          const P = C.pick(R, oo - bar, s, c, dE, x, z), h = R(); if (!P) continue;
          if (P.k === 'p') soil(soft, gT, x, z, P.r, P.col, R, 0.05);
          else if (P.k === 'g' || P.k === 's') cushion(soft.get(x, z), x, y - (P.k === 's' ? 0.05 : 0), z, P.w * (0.75 + h * 0.55), P.h * (0.75 + h * 0.55), P.col, R);
          else tuft(soft.get(x, z), x, y, z, P.w * (0.8 + h * 0.4), P.h * (0.8 + h * 0.5), P.col, R, P.n || 5);
          st[P.c] = (st[P.c] || 0) + 1;
        }
      }
    }
    return st;
  };

  /* ---- Buriram: the paddies' rice by the field, the bunds, the lawn (colours of js/world-chase-bt41.js BR) ---- */
  const BR = {
    lawn: [[0.3, 0.48, 0.17], [0.33, 0.52, 0.19]], dry: [[0.44, 0.52, 0.23], [0.48, 0.54, 0.26]], gold: [[0.74, 0.64, 0.34], [0.8, 0.7, 0.38]],
    tall: [[0.34, 0.52, 0.2], [0.4, 0.57, 0.23]], young: [[0.46, 0.62, 0.26], [0.52, 0.66, 0.3]], stub: [[0.64, 0.56, 0.38], [0.7, 0.62, 0.43]],
    bund: [[0.38, 0.5, 0.22], [0.5, 0.54, 0.28]], litter: [[0.42, 0.36, 0.24], [0.47, 0.4, 0.27]],
  };
  // (the fields' grid of js/world-buriram.js paddy: rows 30 m wide turned 0.38 rad, fields 34-56 m long, each its own kind by the same hash)
  const hsh = (a, b) => { let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const PC = Math.cos(0.38), PS = Math.sin(0.38), FQ = { kind: 0, edge: 0 };
  const field = (x, z) => {   // kind: 0 ripe golden, 1 tall green, 2 young green, 3 stubble, 4 wet and bare; edge: metres to the nearest bund
    const u = x * PC + z * PS, v = -x * PS + z * PC, row = Math.floor(v / 30), hr = hsh(row, 77), wd = 34 + 22 * hr, uu = (u + hr * 97) / wd, col = Math.floor(uu), r = hsh(row * 31 + 7, col);
    FQ.kind = r < 0.42 ? 0 : r < 0.64 ? 1 : r < 0.75 ? 2 : r < 0.94 ? 3 : 4;
    const fv = v / 30 - row, fu = uu - col; FQ.edge = Math.min(Math.min(fv, 1 - fv) * 30, Math.min(fu, 1 - fu) * wd); return FQ;
  };
  const BRF = { step: 4.5, n: 3, grp: 3, spread: 3.2, from: 8, reach: 85, pw: 1.15, drop: 6, rise: 8, maxSl: 0.6,
    keep: (d) => d < 30 ? 0.55 : d < 60 ? 0.7 : 0.5,
    skip: (c) => c === 3,
    pick: (R, d, s, c, dE, x, z) => { const r = R(), w = d < 30 ? 1.25 : d < 55 ? 1.7 : 2.2;
      if (c === 2) { const f = field(x, z);
        if (f.edge < 1.8) return { c: 'meje', k: 't', w: 0.34 * w, h: 0.6, col: T3(R, BR.bund), n: 5 };   // (the bunds: uncut grass)
        if (f.kind === 0) return { c: 'zlatiRiz', k: 't', w: 0.4 * w, h: 0.62, col: T3(R, BR.gold), n: 6 };
        if (f.kind === 1) return { c: 'zeleniRiz', k: 't', w: 0.4 * w, h: 0.68, col: T3(R, BR.tall), n: 6 };
        if (f.kind === 2) return { c: 'mladiRiz', k: 't', w: 0.3 * w, h: 0.3, col: T3(R, BR.young), n: 5 };
        if (f.kind === 3) return r < 0.7 ? { c: 'strnisce', k: 't', w: 0.3 * w, h: 0.16, col: T3(R, BR.stub), n: 5 } : null;
        return null; }
      if (c === 1) return r < 0.5 ? { c: 'listje', k: 'p', r: (1.0 + R() * 1.2) * w, col: C3(R, BR.litter) } : r < 0.8 ? { c: 'trava', k: 't', w: 0.3 * w, h: 0.32, col: T3(R, BR.dry) } : null;
      if (r < 0.5) return { c: 'trata', k: 't', w: 0.4 * w, h: 0.2, col: T3(R, R() < 0.7 ? BR.lawn : BR.dry), n: 5 };   // (the lawn: low, its own greens)
      if (r < 0.64) return { c: 'trata', k: 'p', r: (1.0 + R() * 1.2) * w, col: C3(R, BR.dry) };
      return null; } };

  const polys = (arr) => (arr || []).map(a => {
    const p = [], k0 = typeof a[0] === 'string' ? 1 : 0; for (let k = k0; k + 1 < a.length; k += 2) p.push([a[k], a[k + 1]]);
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of p) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    return { p, b: [x0, x1, z0, z1] };
  });
  const inAny = (P, x, z, m) => { if (!API.inPoly) return false;
    for (const { p, b } of P) { if (x < b[0] - m || x > b[1] + m || z < b[2] - m || z > b[3] + m) continue;
      if (API.inPoly(p, x, z) || (m > 0 && API.polyDist && API.polyDist(p, x, z) < m)) return true; }
    return false; };

  const buriram = (ctx) => {
    const { root, matV } = ctx, excluded = ctx.excluded || (() => false), T = API.T, { nrGround, nrNear, nrLC } = API;
    if (!root || !matV || !T || !T.br || !T.wAt || !nrGround || !nrNear || !nrLC) return null;
    const ds = T.ds, pd = T.def && T.def.pit, PSD = pd ? (pd[0] < 0 ? -1 : 1) : 0, sk = (T.def && T.def.sk) || {}, WATER = polys(sk.lakes).concat(polys(sk.wet));
    const pitI = (i) => !!T.pitAt && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25)) || (T.pitLead ? T.pitLead(i * ds) >= 0 : false);
    const bad = (x, z) => { if (excluded(x, z) || inAny(WATER, x, z, 3)) return true; if (!PSD) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === PSD && pitI(q.i); };
    const slope = (x, z) => { const d = 1.0, a = nrGround(x + d, z) - nrGround(x - d, z), b = nrGround(x, z + d) - nrGround(x, z - d); return Math.hypot(a, b) / (2 * d); };
    const R = rng(90100), soft = softScen(root, matV, 96), st = {};
    band(soft, (x, z) => nrNear(x, z), nrGround, slope, nrLC, bad, R, BRF, st);
    soft.done(); return st;
  };
  const L = API.rbLook || {};
  if (L.buriram) chain(L.buriram, (ctx) => { try { if (ctx.out) ctx.out.pasBt90 = buriram(ctx); } catch (e) { console.error('chase-bt90 (buriram):', e); } });

  /* ---- Canaries: the forest's floor, the scrub, the grass, the rock (land cover of js/world-prelaz.js vrLC: 0 grass, 1 forest,
     2 scrub, 3 village, 4 rock, 7 scree) ---- */
  const CN = {
    wet: [[0.24, 0.42, 0.15], [0.27, 0.45, 0.17]], dry: [[0.44, 0.49, 0.25], [0.49, 0.51, 0.28]], mid: [[0.3, 0.46, 0.18], [0.36, 0.49, 0.21]],
    litter: [[0.3, 0.25, 0.16], [0.36, 0.29, 0.18]], fern: [[0.2, 0.38, 0.14], [0.25, 0.42, 0.16]], shrub: [[0.17, 0.32, 0.12], [0.22, 0.36, 0.15]],
    earth: [[0.47, 0.31, 0.22], [0.52, 0.35, 0.24]], rock: [[0.47, 0.45, 0.42], [0.54, 0.51, 0.47]],
  };
  const CNF = { step: 4.2, n: 2, grp: 3, spread: 4, from: 3, reach: 60, pw: 1.3, drop: 14, rise: 30, maxSl: 1.5,
    keep: (d) => d < 16 ? 0.45 : 0.75,   // (thinner where the eighth group's tufts and bushes stand)
    skip: (c) => c === 3 || c === 5 || c === 6,
    pick: (R, d, s, c) => { const r = R(), w = d < 25 ? 1.3 : 1.8;
      if (c === 4 || c === 7 || s > 1.0) return r < 0.45 ? { c: 'kamni', k: 's', w: 0.45 * w, h: 0.3, col: T3(R, CN.rock, 0.95) }
        : r < 0.8 ? { c: 'prst', k: 'p', r: (0.9 + R() * 1.1) * w, col: C3(R, CN.earth) } : null;
      if (c === 1) return r < 0.45 ? { c: 'listje', k: 'p', r: (1.1 + R() * 1.4) * w, col: C3(R, CN.litter) }
        : r < 0.87 ? { c: 'praprot', k: 'g', w: 0.6 * w, h: 0.38, col: T3(R, CN.fern) } : { c: 'kamni', k: 's', w: 0.4, h: 0.26, col: T3(R, CN.rock, 0.9) };
      if (c === 2) return r < 0.5 ? { c: 'grmicki', k: 'g', w: 0.75 * w, h: 0.5, col: T3(R, CN.shrub) }
        : r < 0.8 ? { c: 'trava', k: 't', w: 0.4 * w, h: 0.55, col: T3(R, CN.mid), n: 6 } : { c: 'prst', k: 'p', r: (0.8 + R() * 0.9) * w, col: C3(R, CN.earth) };
      if (r < 0.26) return { c: 'zaplate', k: 'p', r: (1.4 + R() * 1.8) * w, col: C3(R, CN.wet) };
      if (r < 0.46) return { c: 'zaplate', k: 'p', r: (1.2 + R() * 1.5) * w, col: C3(R, CN.dry) };
      if (r < 0.9) return { c: 'trava', k: 't', w: 0.42 * w, h: 0.55, col: T3(R, CN.mid), n: 6 };
      return { c: 'prst', k: 'p', r: (0.8 + R() * 0.9) * w, col: C3(R, CN.earth) }; } };

  const canaries = (ctx) => {
    const T = API.T, root = ctx.root, matV = ctx.matV || (ctx.out && ctx.out.matV), gT = API.caGround || API.vrGround, near0 = API.vrNear, lc = API.vrLC;
    if (!T || !T.br || !T.wAt || !root || !matV || !gT || !near0) return null;
    const slope = API.caSlope || API.vrSlope || ((x, z) => { const d = 1.0, a = gT(x + d, z) - gT(x - d, z), b = gT(x, z + d) - gT(x, z - d); return Math.hypot(a, b) / (2 * d); });
    const bad = ctx.excluded || (() => false);
    const q2 = { i: -1, lat: 0 }, near = (x, z) => { const q = near0(x, z); q2.i = q.i;
      q2.lat = q.i >= 0 ? (x - T.px[q.i]) * T.nx[q.i] + (z - T.pz[q.i]) * T.nz[q.i] : 1e9; return q2; };
    const R = rng(90200), soft = softScen(root, matV, 96), st = {};
    band(soft, near, gT, slope, lc, bad, R, CNF, st);
    soft.done(); return st;
  };
  const LK = API.PL_LOOK;
  if (LK && LK.canaries) chain(LK.canaries, (ctx) => { try { if (ctx.out) ctx.out.pasBt90 = canaries(ctx); } catch (e) { console.error('chase-bt90 (canaries):', e); } });
})();
