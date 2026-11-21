/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the twenty-first group of the real tracks: Sosnová and Pembrey,
   both on the shared circuit builder (js/world-rbring.js: each look's own LK.extra chained, as Styria's in the seventeenth group). From
   the camera behind the car both were the flattest of the real tracks: one even face of grass (Sosnová's mown in stripes) on both sides.
   On the shared bands of js/world-chase-bt11.js (goreRob) with the corridor's ground, slope, land cover and nearest road (nrGround,
   nrSlope, nrLC, nrNear). What stands where follows the tracks' descriptions (docs/proge/sosnova.md, docs/proge/pembrey.md): nothing on
   the road, the built ground or the water, nothing on the pits' side along the pits; the mown lawns out past the barriers stay as they
   are (but for the uncut strip at the fence's foot); the terrain, the road, the trees, the gorse and the fences stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.goreRob || !World.ext.goreRob.LOOK) return;
  const API = World.api, BT = API.chaseBt, { vary } = API;
  if (!BT || !BT.tuft) return;
  const { tuft, cushion, mix3 } = BT, LOOK = World.ext.goreRob.LOOK;

  /* how far past the road (m) the point (x, z) lies; the meadow out past the mown lawns (their stripes fade out 20-36 m out) */
  const past = (x, z) => { const q = API.nrNear(x, z); return q.i >= 0 ? q.dd : 1e9; };
  const open = (c, x, z) => c === 0 || c === 2 ? Math.min(1, Math.max(0, (past(x, z) - 24) / 8)) : 0;

  /* Sosnová: docs/proge/sosnova.md: »borov gozd peščene pokrajine okoli Česke Lípe (rdeči bor, ob robovih in na odprtem breze),
     poznopoletni travniki z rmanom in glavincem, strnišča«; inside the barriers »pokošena trava«. From the camera behind the car the
     lawns' stripes reached the horizon. So the late summer's grass in tufts (green going to straw) along the fence's foot; under the pines
     the rusty needle litter with low cushions of young birch; out past the lawns the meadow in looser, taller tufts, white patches of
     yarrow and stems tipped purple with knapweed among them. */
  LOOK.sosnova = { seed: 21101, st: ['trava', 'cvetje', 'blazine', 'iglice', 'rman'],
    edge: { ok: (c, sl) => sl >= 0.9 ? 0 : c === 0 || c === 2 ? 0.95 : c === 1 ? 0.8 : 0, n: [5, 8],
      put: (S, x, y, z, h, R) => { if (R() < 0.18) { cushion(S.g(x, z), x, y, z, 0.24 + h * 0.2, 0.16 + h * 0.1, vary(R() < 0.7 ? S.c.yarrow : S.c.knap, R, 0.03), R); S.st.rman++; }
        else { tuft(S.g(x, z), x, y, z, 0.38 + h * 0.26, 0.46 + h * 0.36, vary(mix3(S.c.grass, S.c.straw, 0.35 + R() * 0.6), R, 0.03), R, 5); S.st.trava++; } } },
    mid: { ok: (c, sl, x, z, w) => sl > 1.0 ? 0 : c === 1 ? 0.7 : Math.max(c === 2 ? 0.55 : 0, 0.6 * open(c, x, z)), n: [3, 5], litter: 0.45, lit: 'needle', lr: [1.0, 2.2], ln: 'iglice', wood: true, litW: true,
      put: (S, x, y, z, h, R, w) => { if (w > 0.3 && R() < 0.4) { cushion(S.g(x, z), x, y, z, 0.4 + h * 0.4, 0.16 + h * 0.14, vary(mix3(S.c.birch, S.c.grass, R()), R, 0.03), R); S.st.blazine++; }
        else if (w <= 0.3 && R() < 0.25) { cushion(S.g(x, z), x, y, z, 0.22 + h * 0.2, 0.12 + h * 0.08, vary(S.c.yarrow, R, 0.03), R); S.st.rman++; }
        else { tuft(S.g(x, z), x, y, z, 0.3 + h * 0.24, 0.36 + h * 0.32, vary(mix3(S.c.grass, S.c.straw, R()), R, 0.03), R, 5); S.st.trava++; } } },
    far: { ok: (c, sl, x, z, w) => sl > 0.9 ? 0 : Math.max(c === 2 ? 0.5 : 0, 0.65 * open(c, x, z) * (1 - w * 0.5)), n: [3, 5], litter: 0.35, lit: 'yarrow', lr: [0.8, 1.8], ln: 'cvetje',
      put: (S, x, y, z, h, R) => { if (R() < 0.3) { tuft(S.g(x, z), x, y, z, 0.24 + h * 0.18, 0.46 + h * 0.3, vary(mix3(S.c.grass, S.c.knap, 0.35 + R() * 0.3), R, 0.03), R, 5); S.st.cvetje++; }
        else { tuft(S.g(x, z), x, y, z, 0.36 + h * 0.3, 0.42 + h * 0.36, vary(mix3(S.c.grass, S.c.straw, 0.3 + R() * 0.6), R, 0.03), R, 5); S.st.trava++; } } },
    col: { grass: [0.38, 0.52, 0.22], straw: [0.7, 0.64, 0.38], birch: [0.4, 0.52, 0.24], yarrow: [0.88, 0.87, 0.8], knap: [0.62, 0.36, 0.6], needle: [0.5, 0.36, 0.22] } };

  /* Pembrey: docs/proge/pembrey.md: »med borovim gozdom in sipinami ob morju«, »obalna trava v suhih in vlažnih lisah«, »borov gozd
     (bori 90 %) in breze ob pozidanem«; the gorse is the builder's own (12-58 m past the fences). From the camera behind the car the
     coastal grass was one even face. So the coastal grass in tufts along the fence's foot (pale where it is dry); under the pines the
     needle litter with low cushions of young birch; out past the lawns the dry patches' pale straw tussocks and the damp patches' dark
     rushes, with bare sandy patches between them. */
  LOOK.pembrey = { seed: 21201, st: ['trava', 'locje', 'blazine', 'iglice', 'pesek'],
    edge: { ok: (c, sl) => sl >= 0.9 ? 0 : c === 0 || c === 2 ? 0.95 : c === 1 ? 0.8 : 0, n: [5, 8],
      put: (S, x, y, z, h, R) => { if (R() < 0.25) { tuft(S.g(x, z), x, y, z, 0.3 + h * 0.22, 0.6 + h * 0.4, vary(S.c.rush, R, 0.03), R, 5); S.st.locje++; }
        else { tuft(S.g(x, z), x, y, z, 0.4 + h * 0.28, 0.46 + h * 0.36, vary(mix3(S.c.grass, S.c.pale, 0.4 + R() * 0.6), R, 0.03), R, 5); S.st.trava++; } } },
    mid: { ok: (c, sl, x, z, w) => sl > 1.0 ? 0 : c === 1 ? 0.7 : Math.max(c === 2 ? 0.55 : 0, 0.6 * open(c, x, z)), n: [3, 5], litter: 0.45, lit: 'needle', lr: [1.0, 2.2], ln: 'iglice', wood: true, litW: true,
      put: (S, x, y, z, h, R, w) => { if (w > 0.3 && R() < 0.4) { cushion(S.g(x, z), x, y, z, 0.4 + h * 0.4, 0.16 + h * 0.14, vary(mix3(S.c.birch, S.c.grass, R()), R, 0.03), R); S.st.blazine++; }
        else { tuft(S.g(x, z), x, y, z, 0.32 + h * 0.26, 0.36 + h * 0.34, vary(mix3(S.c.grass, S.c.pale, R()), R, 0.03), R, 5); S.st.trava++; } } },
    far: { ok: (c, sl, x, z, w) => sl > 0.9 ? 0 : Math.max(c === 2 ? 0.5 : 0, 0.65 * open(c, x, z) * (1 - w * 0.5)), n: [3, 5], litter: 0.3, lit: 'sand', lr: [1.0, 2.0], ln: 'pesek',
      put: (S, x, y, z, h, R) => { if (R() < 0.35) { tuft(S.g(x, z), x, y, z, 0.3 + h * 0.24, 0.6 + h * 0.4, vary(S.c.rush, R, 0.03), R, 5); S.st.locje++; }
        else { tuft(S.g(x, z), x, y, z, 0.4 + h * 0.34, 0.4 + h * 0.36, vary(mix3(S.c.grass, S.c.pale, 0.4 + R() * 0.6), R, 0.03), R, 5); S.st.trava++; } } },
    col: { grass: [0.42, 0.53, 0.25], pale: [0.7, 0.66, 0.42], rush: [0.34, 0.45, 0.21], birch: [0.4, 0.52, 0.24], needle: [0.48, 0.36, 0.22], sand: [0.72, 0.66, 0.5] } };

  /* each look's own LK.extra chained (after js/world-realizem-bt.js's): the bands on the shared builder's ground, never on the pits'
     side along the pits; what they count in out.stats.extra.robBt21 */
  for (const id of ['sosnova', 'pembrey']) {
    const L = (API.rbLook || {})[id];
    if (!L) continue;
    const base = L.extra;
    L.extra = function (ctx) {
      const r = (base ? base.call(this, ctx) : null) || {};
      try {
        const T = API.T, pd = T && T.def.pit, ps = pd ? (pd[0] < 0 ? -1 : 1) : 0, { nrGround, nrSlope, nrLC, nrNear } = API;
        const bad = (x, z) => { if (!ps) return false; const q = nrNear(x, z); return q.i >= 0 && Math.sign(q.lat) === ps && !!T.pitAt(q.i * T.ds); };
        r.robBt21 = World.ext.goreRob({ excluded: ctx.excluded, root: ctx.root, out: ctx.out }, id, { gH: nrGround, slope: nrSlope, lc: nrLC, near: nrNear, bad });
      } catch (e) { console.error('chase-bt21 (' + id + '):', e); }
      return r;
    };
  }
})();
