/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the hundred-and-fourteenth group of the real tracks: Ngorongoro,
   a further pass on top of the earlier groups (js/world-chase-bt20.js, js/world-chase-bt50.js, js/world-chase-bt51.js,
   js/world-chase-bt84.js: the worn edge past the setts, the shoulder, the slope and a band of straw, red-brown earth, tussocks and dark
   shrubs to ~60 m). From behind the car the crater wall's steep faces still carried the same straw and earth as the gentle ground, with
   no rock in them, the hollows were as dry as the ribs between them, and the shoulder between the setts and the ditch had no loose stone.
   By docs/proge/ngorongoro.md (»rumenkasto-rjava trava sten, slamnata, kjer je suho, bolj zelena v kotanjah, … sivo-rjava skala v
   strminah«, »grobe sivo-rjave kamnite kocke …, bankina do jarka«; the terrain is the builder's own, from the Copernicus DEM, the land
   cover from ESA WorldCover; chained after World.ext.goreRob, which js/world-ngorongoro.js calls last):
     · on the steep faces (a slope over ~42 %) from ~2 m past the barrier line to ~60 m the grey-brown rock: low stones, singly and in
       small groups, on patches of grey-brown scree, a dry tuft between them;
     · in the hollows (the ground lower than its surroundings ~9 m away) the greener grass: muted green patches and taller green tufts;
     · on the shoulder between the setts and the ditch a few small grey-brown stones, never on the setts or the kerb stones' row.
   In meshes of its own (softScen: 256 m chunks, no shadow). Nothing where another leg's road is nearer, in the builder's excluded places
   (its streams, path, side roads and the animals' places), on built ground or water. The terrain, the road, the wall, the trees, the
   animals and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.softScen || !BT.tuft || !BT.cushion || !vary || !rng) return;
  const { mix3, soil, softScen, tuft, cushion } = BT;

  const latOf = (T, near) => { const q2 = { i: -1, lat: 0 }; return (x, z) => { const q = near(x, z); q2.i = q.i;
    q2.lat = q.i >= 0 ? (x - T.px[q.i]) * T.nx[q.i] + (z - T.pz[q.i]) * T.nz[q.i] : 1e9; return q2; }; };
  // (as js/world-chase-bt73.js: a third of the way toward the colour's grey and a little darker, so a patch reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, a, b, k) => mute(vary(mix3(a, b, R()), R, 0.015), k);

  const COL = {
    rock: (R) => C3(R, [0.47, 0.43, 0.37], [0.55, 0.5, 0.43], 0.98),     // (the grey-brown rock of the steep faces)
    scree: (R) => C3(R, [0.5, 0.45, 0.38], [0.55, 0.5, 0.42]),
    dry: (R) => mute(vary(mix3([0.6, 0.5, 0.29], [0.68, 0.6, 0.37], R()), R, 0.03), 0.98),          // (the tussocks of js/world-chase-bt84.js)
    green: (R) => C3(R, [0.4, 0.47, 0.23], [0.46, 0.5, 0.26]),          // (greener in the hollows, as by the streams there)
    greenT: (R) => mute(vary(mix3([0.4, 0.47, 0.22], [0.48, 0.5, 0.27], R()), R, 0.03)),
  };
  const CFG = { ngorongoro: { seed: 114200, step: 3, n: 4, from: 2, reach: 60, pw: 1.2, drop: 14, rise: 34,
    steep: 0.42, maxSl: 1.4, hollow: 0.35, span: 9, stones: { step: 5.5, share: 0.5 } } };

  /* the steep faces and the hollows: every C.step m on both sides C.n tries between C.from m past the barrier line and C.reach m; a try
     stays only on a steep face (rock) or in a hollow (green), all the other ground is left to the earlier groups */
  const faces = (soft, near, gT, slope, lc, bad, R, C) => {
    const T = API.T, st = { skale: 0, grusc: 0, sopi: 0, zelene: 0, zeleniSopi: 0, bankina: 0 }, N = T.px.length, sp = C.span;
    const rockAt = (x, z, w, h) => { const y = gT(x, z); if (!(y > -1e5)) return; cushion(soft.get(x, z), x, y - 0.06, z, w, h, COL.rock(R), R); st.skale++; };
    for (let i = 0; i < N; i += Math.max(1, Math.round(C.step / T.ds))) for (const sd of [-1, 1]) {
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < C.n; k++) {
        const oo = bar + C.from + Math.pow(R(), C.pw) * (C.reach - C.from), a = (R() - 0.5) * C.step * 1.6, d = oo - bar;
        const x = T.px[i] + T.nx[i] * sd * oo + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * oo + T.tz[i] * a;
        const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > oo + 10) continue;
        const qb = q.lat > 0 ? T.br[q.i] : T.bl[q.i]; if (Math.abs(q.lat) < qb + 1.4) continue;   // (another leg nearer)
        if (bad(x, z)) continue;
        const y = gT(x, z), s = slope(x, z); if (!(y > T.hy[i] - C.drop) || !(y < T.hy[i] + C.rise) || s > C.maxSl) continue;
        const c = lc ? lc(x, z) : 0; if (c === 3 || c === 5 || c === 6) continue;   // (built, water; the streams' margins are green already)
        if (s > C.steep) {
          if (R() > (d < 20 ? 0.95 : 0.7)) continue;
          const r = R(), far = d < 25 ? 1 : 1.35;
          if (r < 0.3) { soil(soft, gT, x, z, (0.9 + R() * 1.2) * far, COL.scree(R), R, 0.05); st.grusc++; }
          else if (r < 0.8) {   // (a stone, now and then two or three smaller ones beside it)
            rockAt(x, z, (0.7 + R() * 0.9) * far, 0.34 + R() * 0.4);
            for (let m = R() < 0.5 ? 1 + Math.floor(R() * 2) : 0; m > 0; m--) {
              const an = R() * 6.283, rr = 0.7 + R() * 1.1, x2 = x + Math.cos(an) * rr, z2 = z + Math.sin(an) * rr;
              if (!bad(x2, z2) && Math.abs(near(x2, z2).lat) > qb + 1) rockAt(x2, z2, (0.35 + R() * 0.4) * far, 0.18 + R() * 0.2);
            }
          } else { tuft(soft.get(x, z), x, y, z, 0.3 * far, 0.42 + R() * 0.2, COL.dry(R), R, 5); st.sopi++; }
        } else {
          const hol = (gT(x + sp, z) + gT(x - sp, z) + gT(x, z + sp) + gT(x, z - sp)) / 4 - y;
          if (d < 6 || !(hol > C.hollow) || R() > 0.7) continue;   // (not the road's own bench and ditch)
          if (R() < 0.45) { soil(soft, gT, x, z, (1.2 + R() * 1.6) * (d < 25 ? 1 : 1.4), COL.green(R), R, 0.05); st.zelene++; }
          else { tuft(soft.get(x, z), x, y, z, d < 25 ? 0.32 : 0.4, 0.5 + R() * 0.2, COL.greenT(R), R, 5); st.zeleniSopi++; }
        }
      }
    }
    /* the shoulder: a small loose stone between the kerb stones' row and the ditch, well clear of the setts */
    const S = C.stones;
    for (let i = 0; i < N; i += Math.max(1, Math.round(S.step / T.ds))) for (const sd of [-1, 1]) {
      if (R() > S.share) continue;
      const w = T.wAt(i), bar = sd > 0 ? T.br[i] : T.bl[i]; if (bar - w < 1.2) continue;
      const o = w + 0.7 + R() * (bar - w - 0.9), a = (R() - 0.5) * S.step;
      const x = T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, z = T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a;
      const q = near(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > 8 || Math.abs(q.lat) < T.wAt(q.i) + 0.6 || bad(x, z)) continue;
      const y = gT(x, z); if (!(y > T.hy[i] - 1.5) || !(y < T.hy[i] + 1.5)) continue;
      cushion(soft.get(x, z), x, y - 0.04, z, 0.2 + R() * 0.22, 0.1 + R() * 0.1, COL.rock(R), R); st.bankina++;
    }
    return st;
  };

  const run = (ctx, id, o) => {
    const T = API.T, C = CFG[id]; if (!C || !T || !T.br || !T.wAt || !ctx.out || !ctx.root || !ctx.out.matV) return null;
    const gT = o.gH || API.vrGround, slope = o.slope || API.vrSlope, near0 = o.near || API.vrNear; if (!gT || !slope || !near0) return null;
    const ex = ctx.excluded || (() => false), water = o.water;
    const bad = (x, z) => ex(x, z) || (o.bad && o.bad(x, z)) || (water && water(x, z).e > -1);
    const soft = softScen(ctx.root, ctx.out.matV);
    const st = faces(soft, latOf(T, near0), gT, slope, o.lc, bad, rng(C.seed), C);
    soft.done(); return st;
  };

  if (World.ext && World.ext.goreRob) {
    const base = World.ext.goreRob;
    const f = function (ctx, id, o) {
      const r = base.call(this, ctx, id, o);
      if (CFG[id] && ctx && ctx.out) try { ctx.out.robBt114 = run(ctx, id, o || {}); } catch (e) { console.error('chase-bt114 (' + id + '):', e); }
      return r;
    };
    Object.assign(f, base);
    World.ext.goreRob = f;
  }
})();
