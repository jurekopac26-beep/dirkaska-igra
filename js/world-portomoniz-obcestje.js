/* =========================================================================
   WORLD — Porto Moniz, Portugal: the street furniture along the ER101 (docs/proge/portomoniz.md, »Ob cesti«), on top of the road's own world
   (js/world-portomoniz.js; the builder's hooks LK.pre and LK.extra wrapped, its own work done first): the zebra crossings in the town, the
   sidewalks along the road (a kerb, then asphalt or concrete as the map has them), the waste baskets at the viewpoint above the town and by
   the square, the planted bed of the roundabout above, past the road's room, and the third viewpoint (a small terrace on the slope, a low
   whitewashed parapet with a basalt coping towards the sea, a bench). After SQUARE_B (the user's choice in the PR: (a) without, (b) with) also
   the square's paving beside the road, the cobbled place below it and the lit steps down the slope. Places and surfaces from OpenStreetMap
   (ODbL 1.0, read 22. 11. 2026; the ids by each list); all generic: no names, letters or signs. Graphics only, into the scenery's chunks (no
   draw call of its own); no def.zebras (the traffic's and the walkers' AI keep to the road as it was), the driving, physics and def.hills
   untouched
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK) return;
  const API = World.api, LK = API.PL_LOOK.portomoniz;
  if (!LK || typeof LK.extra !== 'function' || typeof LK.pre !== 'function') return;
  const { box, cyl, ico, caGround, rng, rpHash, vrNear } = API;
  let T; API.sync.push(() => { ({ T } = API); });

  const SQUARE_B = false;   // (a) false: the basic set; (b) true: also the square's paving, the cobbled place and the steps (the user's choice, PR #962)

  // the zebra crossings on the road (highway=crossing, crossing:markings=zebra): n3129695189, n6138371704, n3474690366 (on the run-out past the
  // line); the fourth, n6138371703, 1.4 m from the finish line, under the line's own paint: left out
  const ZEBRA = [[641.8, -708.7], [699.3, -715.0], [1067.2, -782.0]];
  // the sidewalks (footway=sidewalk): the stretches of their ways along the road (within 9.5 m of its middle), [x, z, ...]; the ways' other
  // parts go off along the side streets the game does not have. Asphalt but the last but two (w1503604166: concrete)
  const SIDE = [
    /* w1503600210 */ [814.4, -711.5, 804.5, -712.4, 796.1, -714.6],
    /* w1503600210 */ [1027, -795.3, 1025.7, -791.8, 1020.7, -787.8, 1016.8, -785.1],
    /* w1503600217 */ [647.4, -701.1, 644.2, -703.1, 645.9, -705.4, 646.3, -706.2, 655.3, -721.7, 659.1, -725.6, 661.5, -727.5, 664.6, -728, 670.1, -727.3, 696.6, -710.4],
    /* w1503600218 */ [638.4, -710.4, 638, -710.8],
    /* w1503600219 */ [656, -738.8, 651.5, -734.4, 648.6, -731.4, 647, -729.2, 646.6, -728.7, 641.5, -718.5, 638, -710.8],
    /* w1503600219 */ [633.2, -702.8, 638, -710.8],
    /* w1503600221 */ [770.6, -712.8, 768.7, -710.5, 765.4, -709.1, 740.9, -706.6, 731.5, -705.9, 724.3, -706.9, 716.9, -709.1, 701.5, -718.6, 693, -723.8, 677.7, -733.5, 673.1, -737.1],
    /* w1503604166 */ [1007.1, -767.1, 1023.8, -778.6, 1025.8, -779.6, 1034.8, -785.5, 1041.4, -789.3, 1046.7, -790.3, 1052.1, -789.7, 1056.5, -787.6, 1060, -784.4, 1063.9, -778.6, 1073.9, -764],
    /* w1503620565 */ [433.8, -628.6, 464.8, -631.9, 466, -633.1, 465.7, -634.7],
    /* w1503624200 */ [396.3, -168.9, 405, -171.7]];
  const CONCRETE = 7;   // (SIDE's index of the concrete one)
  // the waste baskets (amenity=waste_basket) by the road: n7007919126, n7007919127, n7007919128, n7007910554 at the viewpoint above the town
  // (out past the road's room, as the viewpoint itself), n12520720171 by the square (colour=green, covered=yes); the others untagged: grey
  const BINS = [[538.8, -375.1, 0], [472.3, -428.0, 0], [514.8, -398.7, 0], [496.1, -426.0, 0], [647.3, -759.3, 1]];
  // the roundabout's planted bed above (landuse=flowerbed, w982125169): only its part past the road's room (the game's road runs through the rest)
  const BED = [428.8, -127.7, 428.7, -129.9, 429.3, -132, 430.5, -133.8, 432.2, -135.2, 434.2, -136.1, 436.3, -136.3, 438.5, -135.9, 440.4, -134.9, 442, -133.3, 443, -131.4, 443.4, -129.2, 443.1, -127.1, 442.2, -125.1, 440.8, -123.4, 438.9, -122.3, 436.8, -121.8, 434.6, -121.9, 432.5, -122.6, 430.8, -123.9, 429.5, -125.7];
  // the third viewpoint (tourism=viewpoint, n6318312292, direction=30: north-north-east, out over the sea)
  const VIEW3 = [221.8, -551.8, 30];
  // (b) the square beside the road (highway=pedestrian, area, surface=paving_stones, w164923497), the cobbled place below it
  // (surface=unhewn_cobblestone, w166552719), the steps down the slope (highway=steps, surface=paved, width=1, w1503619652)
  const SQUARE = [646.5, -727.1, 638.8, -745, 657.6, -751.6, 658.7, -748, 659.9, -743.7, 659.5, -740.5, 658.1, -738, 655.4, -735.7, 651.9, -733.1];
  const COBBLE = [600.8, -770.5, 599.3, -766.6, 614.4, -760.9, 611.5, -753.2, 608.1, -754.5, 606.8, -751.1, 602.3, -752.8, 603.6, -756.2, 595.6, -759.2, 594.1, -755.2, 579.8, -760.6, 578.1, -757.3, 593.2, -751.1, 609.6, -744.4, 613.3, -744, 616.9, -745.1, 619.7, -746.5, 622.6, -750.2, 626.4, -763.8, 603.7, -772.8];
  const STEPS = [282.7, -685.6, 281.4, -672.6, 280.1, -667, 279.8, -660.2, 282.6, -649.4, 284, -624.8];

  const white = [0.93, 0.92, 0.88], basalt = [0.3, 0.29, 0.28], wood = [0.5, 0.36, 0.22], kerbC = [0.78, 0.77, 0.74];
  const SW = 0.45, KERB = 0.15, WIDE = 1.6, TOP = 0.05;   // (the road's gravel strip past the asphalt; the kerb's top; the sidewalk's width, kerb included (the map has
  // none); its top over the road: low, as the cars' wheels may run onto it (graphics only))

  // the road's frame: the nearest sample, the offset across (+: right), the distance along
  const near = (x, z) => { const n = vrNear(x, z); if (n.i < 0) return null; const i = n.i, u = (x - T.px[i]) * T.tx[i] + (z - T.pz[i]) * T.tz[i];
    return { i, lat: n.lat, sd: n.lat >= 0 ? 1 : -1, s: i * T.ds + u }; };
  const bar = (i, sd) => (sd > 0 ? T.br[i] : T.bl[i]);
  const wAt = (i) => (T.wAt ? T.wAt(i) : T.w);
  // a point at the distance s along the road, o across it, y over the road's height
  const at = (s, o, y) => { const f0 = s / T.ds, i = Math.max(0, Math.min(T.N - 2, Math.floor(f0))), f = f0 - i, j = i + 1, L = (a) => a[i] + (a[j] - a[i]) * f;
    return [L(T.px) + L(T.nx) * o, L(T.hy) + y, L(T.pz) + L(T.nz) * o]; };
  const inPoly = (Q, x, z) => { let c = false; for (let a = 0, b = Q.length - 2; a < Q.length; b = a, a += 2) {
    const za = Q[a + 1], zb = Q[b + 1]; if ((za > z) !== (zb > z) && x < (Q[b] - Q[a]) * (z - za) / (zb - za) + Q[a]) c = !c; } return c; };
  // the cells (1 m) of a polygon: those within the road's room (from the shoulder's strip out to its barrier) only where room is true
  const cells = (Q, room, fn) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let k = 0; k < Q.length; k += 2) { x0 = Math.min(x0, Q[k]); x1 = Math.max(x1, Q[k]); z0 = Math.min(z0, Q[k + 1]); z1 = Math.max(z1, Q[k + 1]); }
    for (let x = Math.floor(x0) + 0.5; x < x1; x += 1) for (let z = Math.floor(z0) + 0.5; z < z1; z += 1) { if (!inPoly(Q, x, z)) continue;
      const n = near(x, z); if (n && Math.abs(n.lat) < wAt(n.i) + SW + 0.5) continue;   // (never on the road or its strip)
      const inRoom = !!n && Math.abs(n.lat) < bar(n.i, n.sd) + 0.45; if (inRoom && !room) continue; fn(x, z, n, inRoom); } };
  // the height of a surface at a point: past the road's room the ground; within it the verge, at the road's height
  const surfY = (x, z) => { const n = near(x, z); const g = caGround(x, z); if (n && Math.abs(n.lat) < bar(n.i, n.sd) + 0.45) return Math.max(g, T.hy[n.i] - 0.04); return g; };

  /* ---- before the terrain: the shared builder's and the road's own trees, houses and verges kept off the furniture's places ---- */
  const basePre = LK.pre;
  LK.pre = function (o) {
    const r = basePre.call(this, o); if (!T) return r; const { exclPush } = o;
    for (const [x, z] of BINS) { const n = near(x, z); if (!n) continue; const p = out1(x, z, n, 0.7); exclPush(p[0], p[1], 0.9); }
    exclPush(VIEW3[0], VIEW3[1], 5);
    cells(BED, false, (x, z) => exclPush(x, z, 0.9));
    if (SQUARE_B) { for (const Q of [SQUARE, COBBLE]) cells(Q, true, (x, z) => exclPush(x, z, 0.8)); for (let k = 0; k < STEPS.length; k += 2) exclPush(STEPS[k], STEPS[k + 1], 1.5); }
    return r;
  };
  // a point out past the road's barrier when it lies within the road's room (o: metres beyond it), as the road's own file places its landmarks
  function out1(x, z, n, o) { const lim = bar(n.i, n.sd) + o; if (Math.abs(n.lat) >= lim) return [x, z];
    const d = n.sd * lim - n.lat; return [x + T.nx[n.i] * d, z + T.nz[n.i] * d]; }

  /* ---- the furniture: laid after the road's own landmarks (out.portomoniz.roadside: what was built, the tests) ---- */
  const base = LK.extra;
  LK.extra = function (o) { const r = base.call(this, o); const mine = lay(o); if (o.out.portomoniz) o.out.portomoniz.roadside = mine; else o.out.portomonizRoadside = mine; return r; };

  function lay({ scen }) {
    const st = { zebras: 0, sidewalk: 0, bins: 0, bed: 0, views: 0, square: 0, cobbles: 0, steps: 0 }, R = rng(5310 + 977);
    const quad = (A, B, C, D, col) => scen.get((A[0] + C[0]) / 2, (A[2] + C[2]) / 2).quadUp(A, B, C, D, [col, col, col, col]);
    const wall = (A, B, C, D, col, ins) => scen.get((A[0] + C[0]) / 2, (A[2] + C[2]) / 2).quadO(A, B, C, D, col, ins);

    // the zebras: white bars along the road, 0.5 m wide, 0.5 m apart, 3 m long, the middle one on the centre line (as the game's other crossings)
    for (const [x, z] of ZEBRA) { const n = near(x, z); if (!n) continue; const w = wAt(n.i), s0 = n.s - 1.5, s1 = n.s + 1.5;
      for (let u = -Math.floor(w - 0.6); u <= w - 0.6; u += 1) quad(at(s0, u - 0.25, 0.045), at(s0, u + 0.25, 0.045), at(s1, u + 0.25, 0.045), at(s1, u - 0.25, 0.045), [0.95, 0.95, 0.92]);
      st.zebras++; }

    // the sidewalks: the samples each way's stretches cover, on their side; a kerb at the asphalt's edge (over the road's gravel strip: a town's
    // street has none), then the walk, its surface a little patchy
    const M = [new Uint8Array(T.N), new Uint8Array(T.N)];
    SIDE.forEach((Q, q) => { for (let k = 0; k + 3 < Q.length; k += 2) { const a = near(Q[k], Q[k + 1]), b = near(Q[k + 2], Q[k + 3]); if (!a || !b || a.sd !== b.sd) continue;
      const m = M[a.sd > 0 ? 1 : 0]; for (let i = Math.min(a.i, b.i); i <= Math.max(a.i, b.i); i++) m[i] = q === CONCRETE ? 2 : 1; } });
    const asph = [0.45, 0.45, 0.46], conc = [0.68, 0.67, 0.64];
    for (const sd of [-1, 1]) { const m = M[sd > 0 ? 1 : 0];
      for (let i = 0; i < T.N - 1; i++) { if (!m[i] || !m[i + 1]) continue; const w0 = wAt(i), w1 = wAt(i + 1);
        const e0 = Math.min(w0 + WIDE, bar(i, sd) - 0.1), e1 = Math.min(w1 + WIDE, bar(i + 1, sd) - 0.1); if (e0 < w0 + 0.6 || e1 < w1 + 0.6) continue;
        const s0 = i * T.ds, s1 = s0 + T.ds, P = (s, o, y) => at(s, sd * o, y), q = 0.95 + 0.08 * rpHash(i >> 1, 61 + sd), c0 = m[i] === 2 ? conc : asph;
        const col = [c0[0] * q, c0[1] * q, c0[2] * q], ins = at(s0, sd * (w0 + 0.5), -1);
        quad(P(s0, w0, TOP), P(s0, w0 + KERB, TOP), P(s1, w1 + KERB, TOP), P(s1, w1, TOP), kerbC);   // (the kerb's top)
        wall(P(s0, w0, -0.04), P(s1, w1, -0.04), P(s1, w1, TOP), P(s0, w0, TOP), kerbC, ins);   // (its face to the road)
        quad(P(s0, w0 + KERB, TOP), P(s0, e0, TOP), P(s1, e1, TOP), P(s1, w1 + KERB, TOP), col);   // (the walk)
        wall(P(s0, e0, -0.35), P(s1, e1, -0.35), P(s1, e1, TOP), P(s0, e0, TOP), col, ins);   // (its outer edge, down into the verge)
        st.sidewalk += T.ds; } }
    st.sidewalk = Math.round(st.sidewalk);

    // the waste baskets: a basket on a post (grey); the covered one a green bin under a lid
    for (const [x0, z0, kind] of BINS) { const n = near(x0, z0); if (!n) continue; const [x, z] = out1(x0, z0, n, 0.7), g = scen.get(x, z), y = surfY(x, z);
      if (kind) { cyl(g, x, y, z, 0.3, 0.85, 10, [0.22, 0.45, 0.26], [0.22, 0.45, 0.26]); cyl(g, x, y + 0.85, z, 0.32, 0.12, 10, [0.2, 0.41, 0.24], [0.2, 0.41, 0.24], 0.2); }
      else { cyl(g, x, y - 0.1, z, 0.04, 1.0, 5, [0.45, 0.46, 0.46], null); cyl(g, x, y + 0.4, z, 0.2, 0.48, 8, [0.55, 0.56, 0.56], [0.2, 0.2, 0.2], 0.22); }
      st.bins++; }

    // the roundabout's bed past the road's room: a low basalt kerb round dark soil, low green plants and their flowers (generic: the map does not say
    // which; blue and white as the road's own agapanthus)
    cells(BED, false, (x, z) => { const g = scen.get(x, z), y = caGround(x, z);
      box(g, x, y - 0.25, z, 1.0, 0.45, 1.0, 0, basalt, [0.3, 0.23, 0.17]);
      const r = R(); ico(g, x + (R() - 0.5) * 0.5, y + 0.3, z + (R() - 0.5) * 0.5, 0.35 + r * 0.15, 0.7, [0.24, 0.42, 0.2], R, 0.08);
      for (let k = 0; k < 2; k++) ico(g, x + (R() - 0.5) * 0.7, y + 0.62 + R() * 0.12, z + (R() - 0.5) * 0.7, 0.15, 0.8, R() > 0.6 ? [0.92, 0.92, 0.95] : [0.42, 0.45, 0.8], R, 0.05);
      st.bed++; });

    // the third viewpoint: a small paved terrace levelled on the slope, its parapet on the side of the view, a bench facing out
    { const [x, z, dir] = VIEW3, a = dir * Math.PI / 180, vx = Math.sin(a), vz = -Math.cos(a), hd = Math.atan2(vz, vx) + Math.PI / 2, g = scen.get(x, z);
      const tx = Math.cos(hd), tz = Math.sin(hd); let lo = 1e9, hi = -1e9;
      for (const [u, v] of [[-2.6, -1.8], [2.6, -1.8], [2.6, 1.8], [-2.6, 1.8], [0, 0]]) { const y = caGround(x + tx * u + vx * v, z + tz * u + vz * v); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      const yy = hi + 0.1;
      box(g, x, lo - 0.4, z, 5.2, yy - lo + 0.4, 3.6, hd, [0.86, 0.85, 0.8], [0.6, 0.58, 0.54]);   // (the terrace: whitewashed sides, the paving on top)
      box(g, x + vx * 1.7, yy, z + vz * 1.7, 5.2, 0.85, 0.3, hd, white, white);   // (the parapet)
      box(g, x + vx * 1.7, yy + 0.85, z + vz * 1.7, 5.4, 0.08, 0.42, hd, basalt);   // (its coping)
      box(g, x - vx * 0.4, yy, z - vz * 0.4, 1.7, 0.45, 0.45, hd, wood);   // (the bench, its back to the road)
      box(g, x - vx * 0.62, yy + 0.45, z - vz * 0.62, 1.7, 0.45, 0.07, hd, wood);
      st.views++; }

    if (SQUARE_B) {
      // the square's paving (light grey stone setts) and the cobbled place (the dark basalt's rounded stones): 1 m cells on the ground, each
      // corner at its own height, a little over the ground (the terrain's coarser mesh would show through on its bulges); within the road's room
      // flush on the verge
      const LIFT = 0.14, pave = (Q, col, vr, room, key) => cells(Q, room, (x, z) => { const k = 1 + (R() - 0.5) * vr, c = [col[0] * k, col[1] * k, col[2] * k];
        const A = [x - 0.5, surfY(x - 0.5, z - 0.5) + LIFT, z - 0.5], B = [x + 0.5, surfY(x + 0.5, z - 0.5) + LIFT, z - 0.5], C = [x + 0.5, surfY(x + 0.5, z + 0.5) + LIFT, z + 0.5], D = [x - 0.5, surfY(x - 0.5, z + 0.5) + LIFT, z + 0.5];
        quad(A, B, C, D, c); st[key]++; });
      pave(SQUARE, [0.66, 0.63, 0.58], 0.05, true, 'square');
      pave(COBBLE, [0.42, 0.4, 0.38], 0.08, false, 'cobbles');
      // the steps: 1 m wide, a step every 0.9 m of the way, each a slab on the ground's slope
      for (let k = 0; k + 3 < STEPS.length; k += 2) { const x0 = STEPS[k], z0 = STEPS[k + 1], dx = STEPS[k + 2] - x0, dz = STEPS[k + 3] - z0, L = Math.hypot(dx, dz), rot = Math.atan2(dz, dx);
        for (let d = 0.45; d < L; d += 0.9) { const x = x0 + dx * d / L, z = z0 + dz * d / L, y = caGround(x, z); box(scen.get(x, z), x, y - 0.3, z, 0.9, 0.42, 1.0, rot, [0.56, 0.55, 0.52], [0.62, 0.61, 0.58]); st.steps++; } }
    }
    return st;
  }
})();
