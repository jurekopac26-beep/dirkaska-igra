/* =========================================================================
   WORLD — Koli, Finska (theme 'koli'): the data-driven builder of the short roads (World.gore, js/world-gore.js) with this road's own style and
   its own things in S.extra (decision O-28-11, docs/proge/koli-dodelava.md). Sources: OpenStreetMap (the road, the buildings, the lifts, the
   runs), Copernicus DEM GLO-30 (the ridge), ESA WorldCover 2021 (the forest), nationalparks.fi/koli (the rock, the tykky, the trees).
   The upper Ylä-Kolintie climbs out of the taiga to Ylä-Koli under the bare summit of Ukko-Koli (347 m, 253 m over the lake Pielinen). Its own
   things, all merged into the scenery's chunks (no draw calls of their own):
   - the quartzite: the white quartzite of Ukko-Koli and Akka-Koli in tilted slabs, stepping down the dip in clusters, a thin snow cap on the flatter
     ones; thick on the ridge east of the finish (x 1050-1350, z 450-1000 in the game: crest over ~310 m) and beside the upper road where it is
     steep or high (the second half of the track, 4-60 m off the asphalt);
   - the tykky: tall spruces under thick crown snow and rime, bent into white columns with a little green showing, above ~270 m (the village, the
     ridge, the summit), 5-150 m off the road; lower down the shared builder's snowy spruces;
   - the birches of the lower slopes: bare white trunks with dark marks and a black foot, thin dark twigs, in groups of one to three at the forest's
     edge beside the first half of the road (6-40 m out);
   - the taiga itself (S.trees): denser, spruce before pine 2 : 1, taller (9-19 m); the summit's bare rock kept clear of trees;
   - Ylä-Koli's buildings (S.bld): walls in the Finnish red and yellow ochre, white and grey timber; dark and grey sheet roofs.
   No signs, inscriptions or names. The roadside ground of the chase camera stays js/world-chase-bt*.js's (goreRob).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.gore) return;
  const QZ = [[0.78, 0.78, 0.77], [0.72, 0.72, 0.71], [0.84, 0.83, 0.81], [0.66, 0.66, 0.66]];   // quartzite: pale to mid grey (against the snow)
  const SNOWC = [0.93, 0.95, 0.99], RIME = [0.88, 0.91, 0.96], NEEDLE = [0.16, 0.26, 0.17], NEEDLE2 = [0.2, 0.31, 0.2];
  const BIRCH = [0.9, 0.89, 0.85], BIRCH2 = [0.84, 0.83, 0.79], FOOT = [0.3, 0.27, 0.25], MARK = [0.2, 0.19, 0.18], TWIG = [0.34, 0.25, 0.24];   // (the winter crown of the birch: a red-brown haze)
  const SUMMIT = [1210, 770];   // Ukko-Koli's top in the game's DEM (x east, z south)
  let PLAN = null;   // (the positions keepOut chose, drawn by extra)

  // a slab of quartzite: a box tilted down its dip (rot: the strike's heading, dip: the tilt down the direction (-sin rot, cos rot)), its top face
  // snow when it is flat enough, else the bare rock; the sides darker
  function slab(g, c, L, W, H, rot, dip, col, top) {
    const e1 = [Math.cos(rot), 0, Math.sin(rot)], d = [-Math.sin(rot), 0, Math.cos(rot)], cd = Math.cos(dip), sd = Math.sin(dip);
    const e2 = [d[0] * cd, -sd, d[2] * cd], e3 = [d[0] * sd, cd, d[2] * sd];
    const P = (a, b, h) => [c[0] + e1[0] * a * L / 2 + e2[0] * b * W / 2 + e3[0] * h * H / 2, c[1] + e2[1] * b * W / 2 + e3[1] * h * H / 2, c[2] + e1[2] * a * L / 2 + e2[2] * b * W / 2 + e3[2] * h * H / 2];
    const side = [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8];
    const v = [P(-1, -1, -1), P(1, -1, -1), P(1, 1, -1), P(-1, 1, -1), P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1)];
    g.quadO(v[4], v[5], v[6], v[7], top, c);
    g.quadO(v[0], v[1], v[5], v[4], side, c); g.quadO(v[1], v[2], v[6], v[5], side, c);
    g.quadO(v[2], v[3], v[7], v[6], col, c); g.quadO(v[3], v[0], v[4], v[7], side, c);
    g.quadO(v[0], v[1], v[2], v[3], side, c);
  }

  // a cluster of 2-4 slabs stepping down the dip from (x, z), half buried; the dip follows the slope with some noise
  function outcrop(g, x, z, size, R, A) {
    const gH = A.vrGround, gx = gH(x + 2, z) - gH(x - 2, z), gz = gH(x, z + 2) - gH(x, z - 2), sl = Math.hypot(gx, gz) / 4;
    const down = sl > 0.02 ? Math.atan2(-gz, -gx) : R() * A.TAU, rot = down - Math.PI / 2 + (R() - 0.5) * 0.5;
    const dip = Math.min(0.75, Math.atan(sl) * 0.6 + 0.08 + R() * 0.3), n = 2 + Math.floor(R() * 3), dx = Math.cos(down), dz = Math.sin(down);
    let k = 0;
    for (; k < n; k++) {
      const L = size * (0.8 + R() * 0.6), W = size * (0.5 + R() * 0.4), H = 0.45 + size * (0.18 + R() * 0.1), o = k * W * 0.75;
      const px = x + dx * o + (R() - 0.5) * size * 0.4, pz = z + dz * o + (R() - 0.5) * size * 0.4, col = QZ[Math.floor(R() * QZ.length)];
      const top = dip < 0.6 && R() < 0.75 ? SNOWC : [col[0] * 1.04, col[1] * 1.04, col[2] * 1.04];
      slab(g, [px, gH(px, pz) + H * 0.2, pz], L, W, H, rot + (R() - 0.5) * 0.2, dip * (0.85 + R() * 0.3), col, top);
    }
    return k;
  }

  // a spruce under tykky: a stack of white rime-snow blobs tapering up a leaning column, a green core showing between them, a white cap
  function tykky(g, x, y, z, h, R, A) {
    const la = R() * A.TAU, lean = R() * 0.05, lx = Math.cos(la) * lean, lz = Math.sin(la) * lean;
    A.ico(g, x + lx * h * 0.3 + (R() - 0.5) * h * 0.08, y + h * 0.36, z + lz * h * 0.3 + (R() - 0.5) * h * 0.08, h * 0.15, 2.4, R() < 0.5 ? NEEDLE : NEEDLE2, R, 0.3);
    for (let k = 0; k < 4; k++) {
      const f = 0.18 + k * 0.2, r = h * (0.2 - k * 0.035), w = 0.95 + R() * 0.05, col = k === 1 && R() < 0.4 ? RIME : SNOWC;
      A.ico(g, x + lx * h * f, y + h * f, z + lz * h * f, r, 1.25, [col[0] * w, col[1] * w, col[2] * w], R, 0.35);
    }
    A.ico(g, x + lx * h * 0.92, y + h * 0.9, z + lz * h * 0.92, h * 0.06, 1.7, SNOWC, R, 0.25);
  }

  // a birch in winter: a white trunk (its foot black, two dark marks), a lean, thin dark twigs reaching up and out from its upper half
  function birch(g, x, y, z, h, R, A) {
    const la = R() * A.TAU, lean = R() * 0.07, lx = Math.cos(la) * lean, lz = Math.sin(la) * lean, ouRod = A.ouRod;
    const at = (f) => [x + lx * h * f, y + h * f, z + lz * h * f], col = R() < 0.5 ? BIRCH : BIRCH2;
    ouRod(g, [x, y - 0.2, z], at(0.08), 0.17, FOOT, 5);
    ouRod(g, at(0.08), at(0.55), 0.14, col, 5); ouRod(g, at(0.55), at(1), 0.08, col, 5);
    for (let k = 0; k < 3; k++) { const f = 0.15 + R() * 0.5; ouRod(g, at(f), at(f + 0.03), f < 0.55 ? 0.15 : 0.09, MARK, 5); }
    for (let k = 0; k < 8; k++) {
      const f = 0.4 + k * 0.07 + R() * 0.05, a = R() * A.TAU, L = h * (0.22 + R() * 0.12), p = at(Math.min(0.95, f));
      ouRod(g, p, [p[0] + Math.cos(a) * L * 0.7, p[1] + L * 0.75, p[2] + Math.sin(a) * L * 0.7], 0.06, TWIG, 3);
    }
  }

  // the plan, made in keepOut (before the trees): where each thing stands, kept free of the buildings, the lifts, the runs, the water and the road
  function plan(push) {
    const A = World.api, T = A.T, def = T.def, gH = A.vrGround, R = A.rng(17171), S0 = T.startS || 0;
    const blds = (def.bld || []).map(b => [b[0], b[1], Math.max(b[2], b[3]) / 2 + 4]);
    const lines = [];
    for (const L of def.lifts || []) { const p = L[2] || []; for (let k = 0; k + 5 < p.length; k += 3) lines.push([p[k], p[k + 1], p[k + 3], p[k + 4]]); }
    const segD = (x, z, s) => { const vx = s[2] - s[0], vz = s[3] - s[1], l2 = vx * vx + vz * vz || 1, t = Math.max(0, Math.min(1, ((x - s[0]) * vx + (z - s[1]) * vz) / l2)); return Math.hypot(x - s[0] - vx * t, z - s[1] - vz * t); };
    const roadOff = (x, z) => { const n = A.vrNear(x, z); return n.i < 0 ? 1e9 : n.dd; };
    const free = (x, z, r) => {
      if (roadOff(x, z) < 4 + r) return false;
      const lc = A.vrLC(x, z); if (lc === 5 || lc === 6 || lc === 3) return false;
      if (A.vrWater && A.vrWater(x, z).e > -3) return false;
      for (const b of blds) if (Math.hypot(x - b[0], z - b[1]) < b[2] + r) return false;
      for (const s of lines) if (segD(x, z, s) < 8 + r) return false;
      for (const p of def.pulls || []) if (Math.hypot(x - p[0], z - p[1]) < Math.max(p[2], p[3]) / 2 + 4 + r) return false;
      return true;
    };
    const P = { rock: [], tyk: [], bir: [] }, taken = [];
    const clash = (x, z, r) => taken.some(t => Math.hypot(x - t[0], z - t[1]) < t[2] + r);
    const take = (x, z, r, e) => { taken.push([x, z, r]); push(x, z, e); };
    // the summit's bare rock: no trees on its top
    push(SUMMIT[0], SUMMIT[1], 35);
    // the quartzite of the ridge: a jittered grid over the crest (high, or steep and high), within the terrain's reach of the road
    for (let gx = 1050; gx <= 1350; gx += 13) for (let gz = 450; gz <= 1000; gz += 13) {
      const x = gx + (R() - 0.5) * 11, z = gz + (R() - 0.5) * 11, h = gH(x, z), sl = A.vrSlope(x, z);
      if (h < 150 || !(sl > 0.25 || h > 165) || A.vrDist(x, z) > 185 || R() > 0.55) continue;
      const size = 2.2 + R() * 3.2; if (!free(x, z, size) || clash(x, z, size)) continue;
      P.rock.push([x, z, size]); take(x, z, size, size * 0.8);
    }
    // the quartzite beside the upper road: where it is steep, high or rock (9-60 m out)
    const sEnd = S0 + T.len;
    for (let s = S0 + 1100; s < sEnd; s += 8) for (const sd of [-1, 1]) {
      if (R() > 0.5) continue;
      const i = T.idx(s), o = 9 + Math.pow(R(), 1.3) * 50, x = T.px[i] + T.nx[i] * sd * o, z = T.pz[i] + T.nz[i] * sd * o, h = gH(x, z);
      if (!(A.vrSlope(x, z) > 0.3 || h > 140 || A.vrLC(x, z) === 4)) continue;
      const size = 1.6 + R() * (o < 18 ? 1.4 : 2.6); if (!free(x, z, size) || clash(x, z, size)) continue;
      P.rock.push([x, z, size]); take(x, z, size, size * 0.8);
    }
    // the tykky spruces: above ~270 m (h 110 over the DEM's base), forest or open, off the runs, not too steep, 5-150 m from the road
    const cand = [];
    for (let gx = 680; gx <= 1360; gx += 8) for (let gz = 380; gz <= 1010; gz += 8) {
      const x = gx + (R() - 0.5) * 7, z = gz + (R() - 0.5) * 7, h = gH(x, z), lc = A.vrLC(x, z), dr = A.vrDist(x, z);
      if (h < 110 || (lc !== 0 && lc !== 1) || dr > 150 || A.vrSlope(x, z) > 0.9 || Math.hypot(x - SUMMIT[0], z - SUMMIT[1]) < 30) continue;
      if (lc === 0 && R() < 0.6) continue;
      cand.push([x, z, roadOff(x, z)]);
    }
    for (let k = cand.length - 1; k > 0; k--) { const j = Math.floor(R() * (k + 1)), t = cand[k]; cand[k] = cand[j]; cand[j] = t; }
    // (first those 7-45 m from the road, which the camera behind the car sees, then the rest out to the ridge)
    cand.sort((a, b) => (a[2] >= 7 && a[2] <= 45 ? 0 : 1) - (b[2] >= 7 && b[2] <= 45 ? 0 : 1));
    for (const [x, z] of cand) { if (P.tyk.length >= 110) break; if (!free(x, z, 1.5) || roadOff(x, z) < 5 || clash(x, z, 2)) continue; P.tyk.push([x, z, 7 + R() * 6]); take(x, z, 2, 2.5); }
    // the birches: in groups of 1-3 at the forest's edge beside the first half of the road (6-40 m out)
    for (let s = S0; s < S0 + 1100 && P.bir.length < 120; s += 6) for (const sd of [-1, 1]) {
      if (R() > 0.35) continue;
      const i = T.idx(s), o = 6 + R() * 34, x0 = T.px[i] + T.nx[i] * sd * o, z0 = T.pz[i] + T.nz[i] * sd * o, lc = A.vrLC(x0, z0);
      if (lc > 2) continue;
      const n = 1 + Math.floor(R() * 3);
      for (let k = 0; k < n; k++) { const x = x0 + (R() - 0.5) * 5, z = z0 + (R() - 0.5) * 5; if (!free(x, z, 0.5) || roadOff(x, z) < 6 || clash(x, z, 0.8)) continue; P.bir.push([x, z, 8 + R() * 6]); take(x, z, 0.8, 1.6); }
    }
    return P;
  }

  function extra(ctx) {
    const { scen, out } = ctx, A = World.api, gH = A.vrGround, R = A.rng(27172);
    const P = PLAN || { rock: [], tyk: [], bir: [] };
    let slabs = 0;
    for (const [x, z, size] of P.rock) slabs += outcrop(scen.get(x, z), x, z, size, R, A);
    const rs = A.ROCK_SMOOTH; A.ROCK_SMOOTH = true;   // (the snow round and soft)
    for (const [x, z, h] of P.tyk) tykky(scen.get(x, z), x, gH(x, z) - 0.3, z, h, R, A);
    A.ROCK_SMOOTH = rs;
    for (const [x, z, h] of P.bir) birch(scen.get(x, z), x, gH(x, z), z, h, R, A);
    out.koli = { outcrops: P.rock.length, slabs, tykky: P.tyk.length, birches: P.bir.length };
    World.ext.koli.plan = P;   // (for the checks: tests/browser)
    if (World.ext.goreRob) World.ext.goreRob(ctx, 'koli');   // (the roadside ground from the chase camera: js/world-chase-bt*.js)
  }

  World.ext.koli = (scene, tex, opts) => World.gore.build(scene, tex, opts, {
    seed: 1717, snow: 'all',
    road: { line: 'none' },
    trees: { kinds: ['fir', 'pine'], forest: 0.4, h: [9, 19] },
    bld: { walls: [[0.55, 0.16, 0.12], [0.8, 0.62, 0.3], [0.88, 0.87, 0.83], [0.5, 0.42, 0.34], [0.7, 0.7, 0.68], [0.6, 0.2, 0.15]],
      roofs: [[0.28, 0.29, 0.31], [0.4, 0.18, 0.14], [0.5, 0.52, 0.54]] },
    skiers: 50, nets: true, snowbanks: true,
    animals: [],
    keepOut: (push) => { PLAN = plan(push); },
    extra,
  });
})();
