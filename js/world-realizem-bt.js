/* The ground by the road as the camera behind the car sees it, on the open roads no other file of this kind looks after (Kotor first).
   Nothing of the road, of the driving or of the terrain's heights changes: only what stands on the ground. Each road's own, from its own
   description (docs/proge/<id>.md), with numbers of its own (rng(seed) here, none of the build's own drawn), after the road's own build.

   Kotor: the banks under the low walls between the legs of the hairpins (PL_LOOK.kotor.bkCap) were one smooth dark green face from the
   camera above the car; the real slope there is the karst's pale limestone in ribs and ledges with the scrub between them
   (docs/proge/kotor.md: »svetlo sivi apnenec v rebrih in ploščah«). So ledges of that limestone lie along the bank, in rows down it, in
   the scenery's own chunks (no draw call more), and now and then a block at its foot. */
(function () {
  'use strict';
  const API = World.api, PL = API && API.PL_LOOK; if (!PL) return;
  const { TAU, lerp, rng, rock, vary, vrNear } = API;
  let T; API.sync.push(() => { ({ T } = API); });

  const chain = (id, fn) => { const L = PL[id]; if (!L) return; const base = L.extra;
    L.extra = function (ctx) { if (base) base.call(this, ctx);
      try { fn(L, ctx, (ctx.out.stats = ctx.out.stats || {}).robBt = {}); } catch (e) { console.error('realizem-bt (' + id + '):', e); } }; };

  /* the banks as the pass's build lays them (js/world-prelaz.js, »the retaining walls between the legs«): where a lower leg lies close under
     this one and the wall is kept low, [offset, height under the road] of the bank's top and toe on that side, else null */
  function banks(L) {
    const N = T.px.length, cross = T.cross || [], ds = T.ds;
    const xPair = (i, j) => { for (const c of cross) if (Math.abs(i - c.up) * ds < 40 && Math.abs(j - c.lo) * ds < 40) return true; return false; };
    return [-1, 1].map((side) => { const a = new Array(N).fill(null);
      for (let i = 0; i < N; i++) {
        const o0 = (side > 0 ? T.br[i] : T.bl[i]) + 0.42, y = T.hy[i];
        const other = (o) => { const n = vrNear(T.px[i] + T.nx[i] * side * o, T.pz[i] + T.nz[i] * side * o); return n.i >= 0 && Math.abs(n.i - i) * ds > 40 && T.hy[n.i] < y - 4 && !xPair(i, n.i) ? n : null; };
        if (![1, 6, 12, 18].some(d => { const n = other(o0 + d); return n && n.dd < 3; })) continue;
        let oL = -1, hl = 0;
        for (let o = o0; o < o0 + 26; o += 0.5) { const n = other(o); if (n && n.dd < 0.5) { oL = o; hl = T.hy[n.i]; break; } }
        const H = y - hl; if (oL < 0 || H / Math.max(0.5, oL - o0) < 1.2 || !(H + 0.6 > L.bkCap + 1.5)) continue;
        const cw = L.bkCap, of = Math.max(o0, Math.min(o0 + 0.05 * cw, oL - 0.5)), toe = Math.max(of + 0.6, oL - 0.3);
        a[i] = [[of, -cw], [toe, -H - 0.6]]; }
      for (let i = 1; i < N - 1; i++) if (a[i] && !a[i - 1] && !a[i + 1]) a[i] = null;
      return a; });
  }

  const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];   // (in the bank's shade and weathered: darker than the blocks in the open)

  chain('kotor', (L, { scen }, st) => {
    if (!L.bkCap || !T || !T.br) return;
    const R = rng(L.seed + 9311), rc = L.rockCols, bk = banks(L), N = T.px.length; let n = 0, m = 0;
    for (const [si, side] of [[0, -1], [1, 1]]) {
      let run = 0;   // (how far along this bank: the rows' phase, so a ledge runs on over several steps of the road)
      for (let i = 1; i < N - 1; i++) { const b = bk[si][i]; if (!b) { run = 0; continue; } run++;
        const [t, f] = b, Hb = t[1] - f[1], rot = Math.atan2(T.pz[i + 1] - T.pz[i - 1], T.px[i + 1] - T.px[i - 1]);
        const rows = Math.max(1, Math.round(Hb / 3.6));
        for (let k = 0; k < rows; k++) {   // ledges along the bank: each row at its own height, broken where the scrub grows over it
          const r1 = R(), r2 = R(), r3 = R(), r4 = R(); if (r1 < 0.8 || (run + k * 3) % 7 === 0) continue;
          const u = (k + 0.3 + 0.4 * r2) / rows, o = lerp(t[0], f[0], u) - 0.45, yy = T.hy[i] + lerp(t[1], f[1], u);
          const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o, len = 2.6 + r3 * 3.2, hh = 0.4 + r4 * 0.5;
          rock(scen.get(x, z), x, yy + hh * 0.1, z, len, hh, 0.75 + r2 * 0.45, rot + (r1 - 0.9) * 0.6, shade(vary(rc[Math.floor(r3 * rc.length) % rc.length], R, 0.05), 0.74 + r4 * 0.1), R, 0.24, 0.4); n++; }
        if (R() < 0.05) { const s0 = 0.5 + R() * 0.7, o = f[0] - 0.2, x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;   // a block at the bank's foot
          rock(scen.get(x, z), x, T.hy[i] + f[1] + 0.6 + s0 * 0.3, z, s0 * 1.2, s0, s0, R() * TAU, shade(vary(rc[Math.floor(R() * rc.length)], R, 0.07), 0.8), R, 0.28); m++; }
      }
    }
    st.police = n; st.bloki = m;
  });
})();
