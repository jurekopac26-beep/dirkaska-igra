/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the fifty-ninth group of the real tracks: Tuzla and Lombok,
   a further pass on two circuits whose verges the forty-fifth (js/world-chase-bt45.js: Tuzla's lawn patches and the gold band past the
   fences) and the forty-sixth group (js/world-chase-bt46.js: Lombok's lawn patches, red earth and the straw band to ~55 m) already set.
   From behind the car two lines still read as drawn, not as ground: where the asphalt (or the kerb) meets the lawn, one clean green edge
   as if the grass were cut with a knife, and along the fence's foot the mown lawn running right into the posts. At a real circuit the
   first half metre past the edge is worn: the dust and the rubber off the asphalt, the grass thin and the earth showing where the cars run
   wide; and along the fence the mower does not reach, so a strip of taller, drier grass stands there. So here, on those two lines only:
   on Tuzla (docs/proge/tuzla.md: »pokošena trava«, the dry hills at the end of summer) the worn edge in a pale grey-brown dust going over
   into a yellowed green, and at the fence's foot a strip of straw and gold; on Lombok (docs/proge/lombok.md: »trava slamnato zelena, z
   lisami rdeče prsti; tik ob progi zalite zelene trate«) the worn edge in the red laterite dust going over into a straw green, at the
   fence's foot a strip of straw green. Both in broken lengths (6-22 m, gaps between), with an uneven outer line, so neither reads as a
   painted band. Nothing on the asphalt, the kerbs, the asphalt run-offs (nor ~30 m past their ends) or the pits' side along the pits,
   nothing where another leg's road is nearer. All of it in meshes of their own (softScen: 256 m chunks, no shadow); the terrain, the road,
   the barriers, the trees and the driving stay.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.softScen || !BT.mix3 || !BT.chain || !rng || !vary) return;
  const { softScen, mix3, chain } = BT;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const gap = (a, b, N) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  const C_ = (R, ab, k) => { const c = vary(mix3(ab[0], ab[1], R()), R, 0.012), f = k || 1; return [c[0] * f, c[1] * f, c[2] * f]; };

  /* the two lines on a circuit of the shared builder (js/world-rbring.js); V: the colours, seed */
  const lines = (ctx, seed, V) => {
    const { root, matV } = ctx, excluded = ctx.excluded || (() => false), T = API.T, { nrGround, nrNear } = API;
    if (!root || !matV || !T || !T.br || !nrGround || !nrNear) return null;
    const bankY = API.nrBankY || (() => 0), N = T.px.length, w = T.w, cw = T.curbW || 1, ds = T.ds;
    const pd = T.def && T.def.pit, PSD = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const pitI = (i) => !!T.pitAt && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25)) || (T.pitLead ? T.pitLead(i * ds) >= 0 : false);
    const pit = (i, sd) => !!pd && sd === PSD && pitI(i);
    const ro = (i, sd) => { const gv = sd > 0 ? T.gravR : T.gravL; if (!gv) return false; const m = Math.round(30 / ds);
      for (let d = -m; d <= m; d += Math.max(1, Math.round(4 / ds))) if (gv[(i + d + N) % N]) return true; return false; };
    // the verge as the builder draws it (as js/world-chase-bt46.js: rbVerge, with a banked corner's tilt)
    const prof = (i, sd) => { const bar = sd > 0 ? T.br[i] : T.bl[i], y = T.hy[i], bk = (o) => bankY(i, sd * o), lift = (o, h) => [o, Math.max(h, nrGround(T.px[i] + T.nx[i] * sd * o, T.pz[i] + T.nz[i] * sd * o) + 0.06 - y - bk(o))];
      return [[w, 0.0], [w + 1.2, -0.04], lift(Math.max(w + 1.8, bar - 0.4), -0.1), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)]; };
    const hAt = (i, sd, o) => { const Q = prof(i, sd); let k = 0; while (k < Q.length - 2 && Q[k + 1][0] < o) k++; const a = Q[k], b = Q[k + 1];
      return T.hy[i] + bankY(i, sd * o) + a[1] + (b[1] - a[1]) * clamp((o - a[0]) / Math.max(1e-3, b[0] - a[0]), 0, 1); };
    const own = (i, sd, x, z, bar) => { const q = nrNear(x, z); return q.i >= 0 && gap(q.i, i, N) * ds < 8 && q.dd <= 0 && Math.abs(q.lat) < bar - 0.2 && q.lat * sd > 0 && !excluded(x, z); };
    const R = rng(seed), soft = softScen(root, matV), st = { rob: 0, ograja: 0 };
    const pt = (i, sd, o, lift) => { const x = T.px[i] + T.nx[i] * sd * o, z = T.pz[i] + T.nz[i] * sd * o; return [x, hAt(i, sd, o) + lift, z]; };
    const step = Math.max(1, Math.round(1.6 / ds));
    /* one line: lengths of 6-22 m with gaps of 3-14 m; at each point the band from a(i) to b(i) m off the centre line, the inner vertex
       colour cI, the outer cO (both from the line's own pair, so a length keeps one tone with a little drift) */
    const band = (sd, kind, inner, outer, ci, co, share, lift) => {
      let i = Math.floor(R() * N * 0.02), prevO = null, cI = null, cO = null, left = 0, wid = 0;
      for (let n = 0; n < N + step; n += step, i = (i + step) % N) {
        if (left <= 0) {   // a new length or a gap
          if (prevO) prevO = null;
          if (R() > share) { left = (3 + R() * 11) / ds; cI = null; continue; }
          left = (6 + R() * 16) / ds; cI = ci(R); cO = co(R); wid = 0.75 + R() * 0.35;
        }
        left -= step;
        if (!cI) continue;
        const bar = sd > 0 ? T.br[i] : T.bl[i], a = inner(i, sd, bar), b0 = outer(i, sd, bar), b = a + (b0 - a) * wid * (0.85 + R() * 0.3);
        if (pit(i, sd) || ro(i, sd) || !(b - a > 0.15) || b > bar - 0.15) { prevO = null; continue; }
        const A = pt(i, sd, a, lift), B = pt(i, sd, b, lift);
        if (!own(i, sd, (A[0] + B[0]) / 2, (A[2] + B[2]) / 2, bar)) { prevO = null; continue; }
        const dI = vary(cI, R, 0.01), dO = vary(cO, R, 0.012);
        if (prevO) { soft.get(A[0], A[2]).quadUp(prevO[0], prevO[1], B, A, [prevO[2], prevO[3], dO, dI]); st[kind]++; }
        prevO = [A, B, dI, dO];
      }
    };
    for (const sd of [-1, 1]) {
      // the worn edge: from the asphalt's edge (or the kerb's) out 0.65-1.35 m
      band(sd, 'rob', (i) => w + (T.curb && T.curb[i] ? cw : 0.02), (i) => w + (T.curb && T.curb[i] ? cw : 0.02) + 1.0 + 0.35 * Math.sin(i * 0.37),
        (R) => C_(R, V.dust), (R) => C_(R, V.edge), 0.7, 0.032);
      // the uncut strip at the fence's foot: 0.5-1.1 m on the road side of the fence
      band(sd, 'ograja', (i, s, bar) => bar - 0.2 - (0.8 + 0.3 * Math.sin(i * 0.23 + 1.3)), (i, s, bar) => bar - 0.2,
        (R) => C_(R, V.lawnS), (R) => C_(R, V.foot), 0.7, 0.045);
    }
    soft.done();
    return st;
  };

  const L = API.rbLook || {};
  // Tuzla: the pale grey-brown dust off the asphalt into a yellowed green; at the fence the straw and gold of the uncut grass
  const TZ = { dust: [[0.56, 0.53, 0.43], [0.6, 0.56, 0.45]], edge: [[0.4, 0.53, 0.22], [0.44, 0.55, 0.24]],
    lawnS: [[0.4, 0.56, 0.21], [0.43, 0.58, 0.23]], foot: [[0.56, 0.55, 0.3], [0.62, 0.58, 0.33]] };
  if (L.tuzla) chain(L.tuzla, (ctx) => { try { const T = API.T; if (T && T.def && T.def.id !== 'tuzla') return; const r = lines(ctx, 59101, TZ); if (r && ctx.out) ctx.out.robBt59 = r; } catch (e) { console.error('chase-bt59 (tuzla):', e); } });
  // Lombok: the red laterite dust into a straw green; at the fence the straw green of the dry season
  const LB = { dust: [[0.56, 0.38, 0.28], [0.62, 0.42, 0.3]], edge: [[0.4, 0.5, 0.24], [0.45, 0.53, 0.27]],
    lawnS: [[0.32, 0.5, 0.2], [0.35, 0.52, 0.22]], foot: [[0.52, 0.53, 0.29], [0.6, 0.57, 0.33]] };
  if (L.lombok) chain(L.lombok, (ctx) => { try { const T = API.T; if (T && T.def && T.def.id !== 'lombok') return; const r = lines(ctx, 59201, LB); if (r && ctx.out) ctx.out.robBt59 = r; } catch (e) { console.error('chase-bt59 (lombok):', e); } });
})();
