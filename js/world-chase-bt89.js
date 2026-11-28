/* =========================================================================
   WORLD — the roadside ground from the camera behind the car (chase), the eighty-ninth group of the real tracks: Bathurst and
   Biķernieki, a further pass on top of the earlier groups (Bathurst: js/world-chase-bt33.js, js/world-chase-bt65.js: the bands behind
   the walls and the fences to ~60 m; Biķernieki: js/world-chase-bt41.js, js/world-chase-bt60.js, js/world-chase-bt84.js: patches and
   the mown stripes, the sand at the asphalt's edge, the young spruces and the tall grass of the wet hollows). From behind the car what
   was still one even face: on Bathurst the grass between the asphalt and the walls (nothing of the earlier groups lies on the track's
   side of the barriers), on Biķernieki the sand traps in the corners and the woods' floor past ~20 m.
   Bathurst (docs/proge/bathurst.md: »Trava ob progi je kot na pašnikih, ob robu asfalta v krpah obrabljena in zaprašena«, »na ozki
   cesti čez vrh hriba je več krp«, »trava je v šopih (… s suhimi bilkami in pegami rdeče-rjave prsti)«, »ponekod se že sušijo v
   slamnato rumeno«): past the asphalt's edge (never on a kerb, a run-off or the pits' side) worn dusty patches, more of them on the
   road across the top of the hill; on the grass from there to ~0.7 m before the wall the pasture's drier straw and olive patches,
   specks of the red-brown soil and low tufts of dry blades (ankle high: the car's way is as it was).
   Biķernieki (docs/proge/bikernieki.md: »v ovinkih peščeni izletni pasovi«, »borov gozd s smrekovimi sestoji in brezami«): in the
   sand traps flat patches of the paler dry and the darker damp sand, darker and churned along the asphalt; in the woods from ~18 to
   ~60 m behind the barriers wider patches of the pines' rusty needles and the moss (the colours of js/world-chase-bt41.js), young
   spruces and pines in low cushions and grass tufts where the woods open. Nothing on the pits' side along the pits, in the excluded
   places, on steep ground, in the water or where another leg of the track is nearer.
   All of it in the circuit builder's own scenery chunks (js/world-rbring.js, LK.extra chained: no draw is added); the terrain, the
   road, the barriers, the trees and the driving stay as they are.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, BT = API.chaseBt, { vary, rng } = API;
  if (!BT || !BT.mix3 || !BT.soil || !BT.tuft || !BT.cushion || !BT.chain || !vary || !rng) return;
  const { mix3, soil, tuft, cushion, chain } = BT;

  // (as js/world-chase-bt84.js: a third of the way toward the colour's grey and a little darker, so a patch reads as ground, not a sticker)
  const mute = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3, f = k || 0.95; return [(c[0] * 0.68 + l * 0.32) * f, (c[1] * 0.68 + l * 0.32) * f, (c[2] * 0.68 + l * 0.32) * f]; };
  const C3 = (R, c, k) => mute(vary(mix3(c[0], c[1], R()), R, 0.015), k || 0.97);
  const T3 = (R, c, k) => mute(vary(mix3(c[0], c[1], R()), R, 0.03), k || 0.98);

  /* the circuit's own tests (js/world-rbring.js draws the kerbs and the run-offs so) and the height of its verge ribbon, which lies
     over the terrain (as js/world-chase-bt84.js: 0 at the edge, -4 cm at 1.2 m, -10 cm, at least 6 cm over the ground) */
  const envOf = (ctx) => {
    const T = API.T, { nrGround, nrNear } = API, N = T.px.length, w = T.w, pd = T.def.pit, ps = pd ? (pd[0] < 0 ? -1 : 1) : 0;
    const wrap = (i) => ((i % N) + N) % N, ex = ctx.excluded || (() => false);
    const pit = (i, sd) => !!ps && sd === ps && (!!T.pitAt(i * T.ds) || !!T.pitAt(wrap(i + 8) * T.ds) || !!T.pitAt(wrap(i - 8) * T.ds) || (T.pitLead ? T.pitLead(i * T.ds) >= 0 : false));
    const kerb = (i, sd) => { for (let d = -3; d <= 3; d++) { const j = wrap(i + d); if (T.curb && T.curb[j] && (sd * T.k[j] > 0 || Math.abs(T.k[j]) > 1 / 70)) return true; } return false; };
    const trap = (i, sd, m) => { const g = sd > 0 ? T.gravR : T.gravL; if (!g) return false; for (let d = -m; d <= m; d++) if (g[wrap(i + d)]) return true; return false; };
    const gV = (x, z) => { const q = nrNear(x, z), g = nrGround(x, z) + 0.06; if (q.i < 0) return g; const e = q.d - w;
      return Math.max(g, T.hy[q.i] + (e <= 0 ? 0 : e <= 1.2 ? -0.04 * e / 1.2 : -0.04 - 0.06 * Math.min(1, (e - 1.2) / 0.6))); };
    const at = (i, sd, o, a) => [T.px[i] + T.nx[i] * sd * o + T.tx[i] * a, T.pz[i] + T.nz[i] * sd * o + T.tz[i] * a];
    // (a place on this leg's own verge: the nearest leg is this one, past its asphalt by `m`, short of its barrier)
    const own = (x, z, i, m) => { const q = nrNear(x, z); return q.i >= 0 && Math.abs(q.i - i) * T.ds < 8 && q.d > w + m && q.d < (q.lat > 0 ? T.br[q.i] : T.bl[q.i]) - 0.5 && !ex(x, z); };
    return { T, N, w, wrap, ex, pit, kerb, trap, gV, at, own };
  };
  const ready = (ctx) => { const T = API.T; return !!(ctx && ctx.scen && T && T.br && T.bl && T.k && T.def && T.pitAt && API.nrGround && API.nrNear); };

  /* ---- Bathurst: the grass on the track's side of the walls ---- */
  const BA = {
    dust: [[0.62, 0.56, 0.41], [0.67, 0.6, 0.44]], red: [[0.5, 0.36, 0.26], [0.55, 0.4, 0.28]], worn: [[0.5, 0.5, 0.3], [0.55, 0.53, 0.33]],
    straw: [[0.66, 0.6, 0.38], [0.72, 0.65, 0.42]], olive: [[0.4, 0.44, 0.22], [0.45, 0.47, 0.25]], blade: [[0.62, 0.57, 0.36], [0.7, 0.63, 0.4]],
  };
  const bathurst = (ctx) => {
    const st = { rob: 0, zaplate: 0, prst: 0, sopi: 0 }; if (!ready(ctx)) return st;
    const E = envOf(ctx), { T, N, w } = E, scen = ctx.scen, R = rng(89100);
    let lo = Infinity, hi = -Infinity; for (let i = 0; i < N; i++) { if (T.hy[i] < lo) lo = T.hy[i]; if (T.hy[i] > hi) hi = T.hy[i]; }
    const top = (i) => T.hy[i] > lo + (hi - lo) * 0.7;   // (the road across the top of the hill)
    for (let i = 0; i < N; i += Math.max(1, Math.round(2.4 / T.ds))) for (const sd of [-1, 1]) {
      if (E.pit(i, sd) || E.trap(i, sd, 4)) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], up = top(i);
      // the worn, dusty edge (no kerb there)
      if (!E.kerb(i, sd)) for (let k = 0, n = up ? 2 : 1; k < n; k++) {
        if (R() > (up ? 0.8 : 0.55)) continue;
        const r = 0.3 + R() * 0.4, o = w + 0.08 + r + R() * 0.6; if (o + r > bar - 0.6) continue;
        const [x, z] = E.at(i, sd, o, (R() - 0.5) * 2.4); if (!E.own(x, z, i, r * 0.7)) continue;
        const h = R(); soil(scen, E.gV, x, z, r, C3(R, h < 0.5 ? BA.dust : h < 0.72 ? BA.red : BA.worn), R, 0.02); st.rob++;
      }
      // from ~1.6 m past the edge to ~0.7 m before the wall: the pasture's patches, the soil's specks, low dry tufts
      const o0 = w + 1.6, o1 = bar - 0.7; if (o1 - o0 < 0.8) continue;
      for (let k = 0, n = Math.min(4, 1 + Math.floor((o1 - o0) / 3)); k < n; k++) {
        if (R() > 0.7) continue;
        const o = o0 + R() * (o1 - o0), [x, z] = E.at(i, sd, o, (R() - 0.5) * 2.4), h = R(), r = R(); if (!E.own(x, z, i, 1.2)) continue;
        if (r < 0.34) { const rr = Math.min(0.5 + h * 0.8, (o1 - o0) * 0.5, o - w - 0.9); if (rr < 0.35) continue;
          soil(scen, E.gV, x, z, rr, C3(R, R() < 0.6 ? BA.straw : BA.olive), R, 0.02); st.zaplate++; }
        else if (r < 0.48) { soil(scen, E.gV, x, z, 0.22 + h * 0.25, C3(R, BA.red), R, 0.025); st.prst++; }
        else { tuft(scen.get(x, z), x, E.gV(x, z) + 0.04, z, 0.16 + h * 0.1, 0.13 + h * 0.09, T3(R, BA.blade), R, 5); st.sopi++; }
      }
    }
    return st;
  };

  /* ---- Biķernieki: the sand traps and the woods' floor farther out ---- */
  const BK = {
    dry: [[0.8, 0.7, 0.5], [0.83, 0.73, 0.53]], damp: [[0.69, 0.58, 0.39], [0.72, 0.61, 0.41]], churn: [[0.65, 0.55, 0.38], [0.69, 0.58, 0.4]],   // (near the trap's own sand: a tone lighter, a tone darker)
    needle: [[0.46, 0.34, 0.21], [0.52, 0.39, 0.24]], moss: [[0.3, 0.42, 0.18], [0.35, 0.46, 0.2]],
    spruce: [[0.17, 0.27, 0.16], [0.21, 0.31, 0.18]], pine: [[0.24, 0.33, 0.18], [0.28, 0.37, 0.2]], grass: [[0.38, 0.5, 0.22], [0.46, 0.55, 0.26]],
  };
  const bikernieki = (ctx) => {
    const st = { pesek: 0, zaplate: 0, grmi: 0, sopi: 0 }; if (!ready(ctx) || !API.nrLC) return st;
    const E = envOf(ctx), { T, N, w } = E, { nrGround, nrNear, nrSlope, nrLC, nrLCf } = API, scen = ctx.scen, R = rng(89200), cw = T.curbW || 1;
    // the sand lies on the road's plane (js/world-rbring.js: 2.8 cm over it, to 0.7 m before the barrier)
    const gS = (x, z) => { const q = nrNear(x, z); return q.i >= 0 ? T.hy[q.i] + 0.03 : nrGround(x, z) + 0.06; };
    const inTrap = (x, z, i, sd, r) => { const q = nrNear(x, z); if (q.i < 0 || Math.abs(q.i - i) * T.ds > 8 || E.ex(x, z)) return false;
      const g = sd > 0 ? T.gravR : T.gravL; return !!g[q.i] && !!g[E.wrap(q.i - 3)] && !!g[E.wrap(q.i + 3)] && q.d > w + cw + r && q.d < (q.lat > 0 ? T.br[q.i] : T.bl[q.i]) - 0.9 - r; };
    for (let i = 0; i < N; i += Math.max(1, Math.round(2.2 / T.ds))) for (const sd of [-1, 1]) {
      const g = sd > 0 ? T.gravR : T.gravL; if (!g || !g[i] || E.pit(i, sd)) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i], o0 = w + cw + 0.4, o1 = bar - 1.2; if (o1 - o0 < 1.5) continue;
      for (let k = 0, n = Math.min(5, 1 + Math.floor((o1 - o0) / 3)); k < n; k++) {
        if (R() > 0.55) continue;
        const near = k === 0, r = near ? 0.4 + R() * 0.4 : 0.6 + R() * 0.9, o = near ? o0 + r + R() * 1.2 : o0 + r + R() * Math.max(0, o1 - o0 - 2 * r);
        const [x, z] = E.at(i, sd, o, (R() - 0.5) * 2.2); if (!inTrap(x, z, i, sd, r)) continue;
        const c = near ? BK.churn : R() < 0.5 ? BK.dry : BK.damp; soil(scen, gS, x, z, r, vary(mix3(c[0], c[1], R()), R, 0.012), R, 0.012); st.pesek++;   // (not muted: sand on sand)
      }
    }
    // the woods from ~18 to ~60 m behind the barriers
    for (let i = 0; i < N; i += Math.max(1, Math.round(3.6 / T.ds))) for (const sd of [-1, 1]) {
      if (E.pit(i, sd)) continue;
      const bar = sd > 0 ? T.br[i] : T.bl[i];
      for (let k = 0; k < 2; k++) {
        const d = 18 + Math.pow(R(), 1.15) * 42, oo = bar + d, h = R(), r = R(); if (R() > 0.8) continue;
        const [x, z] = E.at(i, sd, oo, (R() - 0.5) * 6), q = nrNear(x, z);
        if (q.i < 0 || Math.abs(q.i - i) * T.ds > oo + 10 || q.dd < 12 || E.ex(x, z) || (nrSlope && nrSlope(x, z) > 0.55)) continue;
        if (nrLC(x, z) !== 1) continue;
        const f = nrLCf ? nrLCf(x, z, 1) : 1, y = nrGround(x, z), ws = d < 35 ? 1 : 1.35;   // (f: how deep in the woods; wider farther out)
        if (r < 0.3) { soil(scen, nrGround, x, z, (1.1 + h * 1.3) * ws, C3(R, BK.needle), R, 0.05); st.zaplate++; }
        else if (r < 0.52) { soil(scen, nrGround, x, z, (0.9 + h * 1.1) * ws, C3(R, BK.moss), R, 0.05); st.zaplate++; }
        else if (r < 0.8) { cushion(scen.get(x, z), x, y, z, (0.65 + h * 0.5) * ws, 0.55 + h * 0.55, T3(R, r < 0.66 ? BK.spruce : BK.pine, 1.0), R); st.grmi++; }
        else if (f < 0.85) { tuft(scen.get(x, z), x, y, z, (0.3 + h * 0.12) * ws, 0.38 + h * 0.2, T3(R, BK.grass), R, 5); st.sopi++; }
      }
    }
    return st;
  };

  const L = API.rbLook || {};
  if (L.bathurst) chain(L.bathurst, (ctx, r) => { try { const s = bathurst(ctx); if (r) r.robBt89 = s; } catch (e) { console.error('chase-bt89 (bathurst):', e); } });
  if (L.bikernieki) chain(L.bikernieki, (ctx, r) => { try { const s = bikernieki(ctx); if (r) r.robBt89 = s; } catch (e) { console.error('chase-bt89 (bikernieki):', e); } });
})();
