/* =========================================================================
   WORLD — Hakone (theme 'hakone'), the finishing pass (dodelava, O-28-36): what the track still lacked beside the road next to Pikes Peak,
   added to js/world-hakone.js's own scenery chunks (no draw call of its own). js/world-hakone.js calls it once (API.hkDodelava) after the old
   road's stone paving, with its corridor (T, scen, the excluded places).
   - Curve mirrors (the round convex mirrors on orange posts that stand at the outside of nearly every blind bend of a Japanese mountain road):
     one double mirror at the outside of each tight bend (radius under 28 m, the hairpins among them) and of the long blind ones, facing both
     ways along the road; not on a bridge, not in a village's buildings, at most one every 60 m.
   - Lake Shōjin (OpenStreetMap, © OpenStreetMap contributors, ODbL 1.0): the Rokudō Jizō (the big Jizō carved in the rock by national road 1,
     under its timber hall) and, a few metres on, a group of the old stone pagodas (gorintō and a hōkyōintō) by the road; the stone stele of
     the pond (»精進ヶ池 石碑«). The pagodas' place is an assumption (OpenStreetMap has the hall's two points only): beside the second point.
   - The summit of road 1 (874 m): the stone marker of the road's highest point beside the road, on the flatter side (OpenStreetMap does not
     have it: its form and side are an assumption); the little wayside shrine just before it (OpenStreetMap: historic=wayside_shrine).
   Only the places' names, no firms and no names of people (the pagodas' graves are not named).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { box, cyl, cone, ico, gable, rng, vrGround, vrNear } = API;

  // OpenStreetMap's points by the road (x east, z south, metres from the start line: js/tracks/hakone.js's origin 35.2336134° N, 139.1046511° E)
  const JIZO = [[-6247.3, 2272.5], [-6223.7, 2240.4]], STELE = [-6233.7, 2144.9], SHRINE = [-6036.2, 1854.3];
  const ORANGE = [0.93, 0.42, 0.1], ORANGE_D = [0.74, 0.34, 0.1], GLASS = [0.66, 0.73, 0.8], STONE = [0.6, 0.59, 0.55], STONE_D = [0.44, 0.43, 0.4], MOSS = [0.38, 0.42, 0.3];
  const TIMBER = [0.3, 0.22, 0.16], ROOF = [0.26, 0.27, 0.29];

  API.hkDodelava = function (C) {
    const { T, scen, excluded, exclPush, inRect, onBr, out, def, at } = C, N = T.N, ds = T.ds, W = (i) => (i % N + N) % N, R = rng(8743);
    const mir = []; out.marks.mirrors = mir;
    const st = { mirrors: 0, jizo: 0, pagodas: 0, steles: 0, shrines: 0, marker: 0 };

    // a vertical disc of radius r at c facing along (ux, uz): the glass in front, an orange rim round it, the orange back
    const disc = (g, c, ux, uz, r) => {
      const vx = -uz, vz = ux, n = 10, F = [c[0] + ux * 3, c[1], c[2] + uz * 3], B = [c[0] - ux * 3, c[1], c[2] - uz * 3];
      const P = (k, rr, off) => { const a = k / n * Math.PI * 2, ca = Math.cos(a) * rr, sa = Math.sin(a) * rr; return [c[0] + vx * ca + ux * off, c[1] + sa, c[2] + vz * ca + uz * off]; };
      const cF = [c[0] + ux * 0.02, c[1], c[2] + uz * 0.02], cB = [c[0] - ux * 0.04, c[1], c[2] - uz * 0.04];
      for (let k = 0; k < n; k++) {
        g.triO(cF, P(k, r * 0.86, 0.02), P(k + 1, r * 0.86, 0.02), GLASS, B);   // the glass (the sky in it)
        g.quadO(P(k, r * 0.86, 0.02), P(k + 1, r * 0.86, 0.02), P(k + 1, r, 0.0), P(k, r, 0.0), ORANGE, B);   // the rim
        g.triO(cB, P(k + 1, r, -0.04), P(k, r, -0.04), ORANGE_D, F);   // the back
      }
    };

    /* ---- curve mirrors ---- */
    {
      const cand = [];
      for (const c of T.corners) {
        const span = (c.i1 - c.i0 + N) % N;
        if (!(c.minR < 28 || (c.minR < 55 && c.angle > 1.2))) continue;
        cand.push({ c, ia: W(c.i0 + Math.floor(span / 2)), span });
      }
      let lastS = -1e9;
      cand.sort((a, b) => a.ia - b.ia);
      for (const { c, ia, span } of cand) {
        const s = ia * ds; if (s - lastS < 60) continue;
        if (onBr[ia] || onBr[W(ia - 3)] || onBr[W(ia + 3)]) continue;
        const sd = -c.dir || 1, bar = sd > 0 ? T.br[ia] : T.bl[ia], o = sd * (bar + 1.0);
        const x = T.px[ia] + T.nx[ia] * o, z = T.pz[ia] + T.nz[ia] * o, nq = vrNear(x, z);
        if (nq.i >= 0 && nq.dd < 0.5) continue;   // (another leg's road there: the hairpins' legs close together)
        if (inRect(x, z)) continue;   // (a building)
        const hy = T.hy[ia], y0 = vrGround(x, z);
        if (y0 < hy - 2.5 || y0 > hy + 2.0) continue;   // (over a drop or on a high bank: none)
        const g = scen.get(x, z), base = Math.min(y0, hy) - 0.2, top = hy + 3.3;
        cyl(g, x, base, z, 0.045, top - base, 6, ORANGE);
        // the two mirrors on a short cross bar, one facing the road before the bend, one the road after it
        const ie = W(c.i0 - 14), ix = W(c.i1 + 14), cy = hy + 2.75, tw = [T.tx[ia], T.tz[ia]];
        box(g, x, cy - 0.04, z, 0.95, 0.08, 0.08, Math.atan2(tw[1], tw[0]), ORANGE_D);
        for (const [j, sg] of [[ie, -1], [ix, 1]]) {
          const mx = x + tw[0] * sg * 0.42, mz = z + tw[1] * sg * 0.42;
          let ux = T.px[j] - mx, uz = T.pz[j] - mz; const l = Math.hypot(ux, uz) || 1; ux /= l; uz /= l;
          disc(g, [mx + ux * 0.06, cy, mz + uz * 0.06], ux, uz, 0.4);
        }
        exclPush(x, z, 1.4); lastS = s; st.mirrors++; mir.push([Math.round(x), Math.round(z)]);
        if (span > 0 && st.mirrors > 70) break;
      }
    }

    // a point's ground and whether it is clear of the road (dd: metres past the road's edge)
    const clear = (x, z, m) => { const nq = vrNear(x, z); return !(nq.i >= 0 && nq.dd < m); };
    // an OpenStreetMap point that falls inside the game's barrier line (its line is up to ~5 m off OpenStreetMap's; by Lake Shōjin and at the
    // summit the barrier stands 15-16 m out, past the wide verge): moved straight away from the road until it stands m metres past that line
    // (at most 13 m: nothing stands where a car can drive)
    const offRoad = (p, m) => { let [x, z] = p; const nq = vrNear(x, z); if (nq.i < 0) return p; const i = nq.i;
      let ux = x - T.px[i], uz = z - T.pz[i]; const l = Math.hypot(ux, uz) || 1; ux /= l; uz /= l;
      for (let k = 0; k < 52 && !clear(x, z, m); k++) { x += ux * 0.25; z += uz * 0.25; }
      return clear(x, z, m) && Math.hypot(x - p[0], z - p[1]) <= 13 ? [x, z] : p; };
    const faceRoad = (x, z) => { const nq = vrNear(x, z), i = nq.i >= 0 ? nq.i : 0; return Math.atan2(T.pz[i] - z, T.px[i] - x); };

    /* ---- Lake Shōjin: the Rokudō Jizō's hall, the stone pagodas, the stele ---- */
    {
      const [x, z] = offRoad(JIZO[0], 4.2);
      if (clear(x, z, 4)) {
        const g = scen.get(x, z), y = vrGround(x, z), a = faceRoad(x, z), c = Math.cos(a), s = Math.sin(a);
        const L = (u, v) => [x + c * u - s * v, z + s * u + c * v];   // u towards the road, v along it
        // the rock with the Jizō carved in it, at the back of the hall
        { const [rx, rz] = L(-1.4, 0); ico(g, rx, y + 1.5, rz, 2.0, 1.0, [0.5, 0.48, 0.44], R, 0.25); }
        { const [fx, fz] = L(-0.2, 0); cyl(g, fx, y, fz, 0.55, 1.5, 8, [0.56, 0.55, 0.51], null, 0.42); ico(g, fx, y + 1.85, fz, 0.38, 1.05, [0.58, 0.57, 0.53], R, 0.05); }   // the figure's body and head
        // the hall: six timber posts, a low back wall, a hipped roof of grey tiles
        for (const u of [-2.6, 1.3]) for (const v of [-2.4, 0, 2.4]) { const [px, pz] = L(u, v); box(g, px, y - 0.2, pz, 0.22, 4.3, 0.22, a, TIMBER); }
        { const [bx, bz] = L(-2.6, 0); box(g, bx, y - 0.2, bz, 0.18, 1.4, 4.9, a, [0.36, 0.27, 0.2]); }
        { const [hx, hz] = L(-0.65, 0); box(g, hx, y + 4.05, hz, 4.4, 0.25, 5.4, a, TIMBER); gable(g, hx, y + 4.3, hz, 5.6, 6.2, 1.7, a + Math.PI / 2, ROOF, [0.3, 0.3, 0.32]); }
        { const [ox, oz] = L(1.9, 0); box(g, ox, y - 0.1, oz, 0.6, 0.55, 1.2, a, [0.4, 0.3, 0.22]); }   // the offering box
        exclPush(x, z, 4.5); out.marks.jizo = [x, z]; st.jizo = 1; st.jizoMoved = +Math.hypot(x - JIZO[0][0], z - JIZO[0][1]).toFixed(1);
      }
      // the stone pagodas: three gorintō (a cube, a sphere, a pyramid roof, a half moon and a jewel) and one hōkyōintō (a tall square stack
      // with its spire), on a low stone platform, moss on the stones
      const [qx, qz] = offRoad(JIZO[1], 4.4), a = faceRoad(qx, qz), c = Math.cos(a), s = Math.sin(a), L = (u, v) => [qx + c * u - s * v, qz + s * u + c * v];
      if (clear(qx, qz, 4)) {
        const g = scen.get(qx, qz), y = vrGround(qx, qz);
        { const [px, pz] = L(-1, 0); box(g, px, y - 0.3, pz, 3.2, 0.55, 6.4, a, STONE_D); }
        for (const v of [-2.0, 0, 2.0]) { const [px, pz] = L(-1, v), b = y + 0.25, sc = v === 0 ? 1.15 : 1;
          box(g, px, b, pz, 0.8 * sc, 0.75 * sc, 0.8 * sc, a, STONE); ico(g, px, b + 0.75 * sc + 0.32 * sc, pz, 0.38 * sc, 0.95, STONE, R, 0.04);
          gable(g, px, b + 1.36 * sc, pz, 0.9 * sc, 0.9 * sc, 0.38 * sc, a, STONE_D, STONE_D);
          cyl(g, px, b + 1.72 * sc, pz, 0.22 * sc, 0.2 * sc, 6, MOSS); cone(g, px, b + 1.9 * sc, pz, 0.18 * sc, 0.32 * sc, 6, STONE, STONE, 0);
          st.pagodas++; }
        { const [px, pz] = L(-1, -3.6), b = y + 0.25;   // the hōkyōintō
          box(g, px, b, pz, 1.0, 0.45, 1.0, a, STONE_D); box(g, px, b + 0.45, pz, 0.62, 0.9, 0.62, a, STONE); box(g, px, b + 1.35, pz, 0.95, 0.3, 0.95, a, STONE_D);
          box(g, px, b + 1.65, pz, 0.6, 0.25, 0.6, a, STONE); cyl(g, px, b + 1.9, pz, 0.1, 1.2, 6, STONE_D); st.pagodas++; }
        exclPush(qx, qz, 4.5);
      }
      const [sx, sz] = offRoad(STELE, 1.4);
      if (clear(sx, sz, 1.2)) {
        const g = scen.get(sx, sz), y = vrGround(sx, sz), a2 = faceRoad(sx, sz) + Math.PI / 2;
        box(g, sx, y - 0.2, sz, 1.4, 0.5, 0.9, a2, STONE_D); box(g, sx, y + 0.3, sz, 0.9, 1.7, 0.28, a2, [0.52, 0.52, 0.5]);
        exclPush(sx, sz, 1.8); st.steles++;
      }
    }

    /* ---- the summit: the wayside shrine (a little hokora on its stone) and the stone marker of the road's highest point ---- */
    {
      const [x, z] = offRoad(SHRINE, 1.4);
      if (clear(x, z, 1.2)) {
        const g = scen.get(x, z), y = vrGround(x, z), a = faceRoad(x, z) + Math.PI / 2;
        box(g, x, y - 0.2, z, 1.1, 0.8, 0.9, a, STONE_D); box(g, x, y + 0.6, z, 0.7, 0.7, 0.6, a, TIMBER); gable(g, x, y + 1.3, z, 1.0, 0.9, 0.4, a, ROOF, TIMBER);
        exclPush(x, z, 1.6); st.shrines++;
      }
      const q = (T.names || []).find(o => /874/.test(o.n)), s0 = q ? at(q.d) : -1;
      if (s0 >= 0) {
        const i = T.idx(s0);
        let best = null;
        for (const sd of [-1, 1]) {
          const o = sd * ((sd > 0 ? T.br[i] : T.bl[i]) + 2.6), x2 = T.px[i] + T.nx[i] * o, z2 = T.pz[i] + T.nz[i] * o, dy = Math.abs(vrGround(x2, z2) - T.hy[i]);
          if (!inRect(x2, z2) && clear(x2, z2, 1.2) && (!best || dy < best.dy)) best = { x: x2, z: z2, dy };
        }
        if (best && best.dy < 2.2) {
          const g = scen.get(best.x, best.z), y = vrGround(best.x, best.z), a = T.hd[i];
          box(g, best.x, y - 0.3, best.z, 2.2, 0.6, 1.4, a, STONE_D);   // the plinth
          box(g, best.x, y + 0.3, best.z, 0.75, 2.1, 0.75, a, [0.7, 0.69, 0.66]);   // the square pillar
          box(g, best.x, y + 2.4, best.z, 0.85, 0.12, 0.85, a, STONE);
          exclPush(best.x, best.z, 2.2); out.marks.summit874 = [best.x, best.z]; st.marker = 1;
        }
      }
    }
    out.marks.dodelava = st;   // (js/world-hakone.js sets out.stats at its end: the counts here go with the marks)
    return st;
  };
})();
