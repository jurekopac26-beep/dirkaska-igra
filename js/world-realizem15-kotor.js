// WORLD — realizem 15: Kotor, Črna gora (docs/realizem.md, »Postopek za vse proge«)
// What OpenStreetMap maps within 60 m of the road and the pass's own world (js/world-prelaz.js, PL_LOOK.kotor) does not draw yet.
// Hooked by wrapping the look's own hooks (PL_LOOK.kotor.pre, .extra): loaded right after the shared world of the passes.
//
// Drawn: the dry bed of the torrent that the serpentines cross four times (waterway=stream, intermittent=yes, way 1337669495; the line
//   is the track's own data, def.streams): where it lies beyond the road's barrier line and within 60 m of the road. Three stretches:
//   below the first crossing, on the slope between the second and the third, above the fourth (past the finish).
// Not drawn again (the pass's world has them): the parapets of the four small bridges (ways 1359338889, 1359338893, 1359338891,
//   1359338887: the look's own low stone walls stand there), the two viewpoints with their lay-bys (nodes 12138682148, 12137350047,
//   10925318705, 12137350048: the terraces at the hairpins' tips), the trodden path to the first of them (way 1311368323: on the
//   terrace's gravel, inside the barrier line).
// Not drawn at all, said in the pull request: the ruined shed (way 358634742: the game's road is wider than the real one and takes
//   its ground), the gully itself and the bridges' openings (the game's ground is smooth there), the bed between the first and the
//   second and between the third and the fourth crossing (the supporting walls of the legs stand there).
// Assumed and said so in the pull request: the bed's width (1.6–3.4 m), its pale limestone gravel, earthen edges and blocks; dry (intermittent).
// Drawn into the scenery chunks (scen.get): no new draw calls, only vertices.
// Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«).
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK || !World.api.PL_LOOK.kotor) return;
  const API = World.api, L = API.PL_LOOK.kotor;
  const { caGround, lerp, rng, rock, vary, vrNear, TAU } = API;
  let T; API.sync.push(() => { ({ T } = API); });

  const BAND = 60, STEP = 1, CLEAR = 0.7, MIN = 16;   // (the band by the road; a sample every metre; this far beyond the barrier line at least; no run under 16 m)
  const near = (x, z) => { const v = vrNear(x, z); return v.i >= 0 ? v.dd : 99; };   // (metres beyond the road's barrier line)

  // the bed's runs: the streams' samples in the band, clear of the road, of the level plots and of the houses; a run's end is brought up to the limit itself
  // (to the foot of the road's wall, where the real stream goes under the road)
  function place({ P, exclPush, blds }) {
    const runs = [], N = T.N, pads = (P && P.pads) || [], hs = blds || [];
    const inBand = (x, z) => { for (let i = 0; i < N; i++) { const dx = T.px[i] - x, dz = T.pz[i] - z; if (dx * dx + dz * dz <= BAND * BAND) return true; } return false; };
    const ok = (x, z) => { const dd = near(x, z);
      return dd >= CLEAR && inBand(x, z) && !pads.some(q => Math.hypot(q.x - x, q.z - z) < q.r + 2) && !hs.some(b => Math.hypot(b.x - x, b.z - z) < Math.hypot(b.L, b.W) / 2 + 2) ? dd : -1; };
    const edge = (bad, good) => { let a = bad, b = good; for (let i = 0; i < 5; i++) { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; if (ok(m[0], m[1]) >= 0) b = m; else a = m; }
      return Math.hypot(b[0] - good[0], b[1] - good[1]) > 0.4 ? { x: b[0], z: b[1], dd: ok(b[0], b[1]) } : null; };
    for (const st of T.def.streams || []) {
      const p = st.p || [], pts = [];
      for (let k = 0; k + 3 < p.length; k += 2) {
        const n = Math.max(1, Math.round(Math.hypot(p[k + 2] - p[k], p[k + 3] - p[k + 1]) / STEP));
        for (let j = 0; j < n; j++) pts.push([lerp(p[k], p[k + 2], j / n), lerp(p[k + 1], p[k + 3], j / n)]);
      }
      if (p.length >= 2) pts.push([p[p.length - 2], p[p.length - 1]]);
      let cur = [], prev = null;
      const end = () => { if (cur.length >= MIN) runs.push(cur); cur = []; };
      for (const q of pts) {
        const dd = ok(q[0], q[1]);
        if (dd >= 0) { if (!cur.length && prev) { const e = edge(prev, q); if (e) cur.push(e); } cur.push({ x: q[0], z: q[1], dd }); }
        else { if (cur.length) { const e = edge(q, prev); if (e) cur.push(e); } end(); }
        prev = q;
      }
      end();
    }
    for (const Q of runs) for (let k = 0; k < Q.length; k += 2) exclPush(Q[k].x, Q[k].z, 2.4);   // (no trees, shrubs or loose blocks of the slope in the bed)
    return runs;
  }

  // a small block: five sides and a flat top (29 vertices; the big ones are the world's own boulders, rock())
  function cobble(g, x, y, z, r, h, rot, col, R) {
    const B = [], U = [], sh = k => [col[0] * k, col[1] * k, col[2] * k];
    for (let k = 0; k < 5; k++) { const a = rot + (k + (R() - 0.5) * 0.5) / 5 * TAU, c = Math.cos(a) * r * (0.85 + R() * 0.3), s = Math.sin(a) * r * (0.85 + R() * 0.3);
      B.push([x + c, y - 0.12, z + s]); U.push([x + c * 0.55, y + h * (0.8 + R() * 0.4), z + s * 0.55]); }
    for (let k = 0; k < 5; k++) { const j = (k + 1) % 5; g.quadO(B[k], B[j], U[j], U[k], sh(0.8 + R() * 0.14), [x, y, z]); }
    for (let k = 1; k < 4; k++) g.triO(U[0], U[k], U[k + 1], sh(1.08), [x, y - 5, z]);
  }

  // a run: a strip of pale rubble on the ground (small flat facets, each its own shade), its uneven edges fading into earth, cobbles on it and blocks mostly
  // along its edges; full width at the road's wall, narrowing to nothing where the band ends
  function draw(scen, runs, R) {
    const rc = L.rockCols, pick = () => rc[Math.floor(R() * rc.length)], sh = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
    const tone = () => sh(R() < 0.2 ? pick() : L.scree, 0.86 + R() * 0.14), F = [-1, -0.5, 0, 0.5, 1];
    for (const Q of runs) {
      const n = Q.length, S = [], W = [];
      for (let k = 0; k <= n / 4 + 1; k++) W.push([0.8 + R() * 0.9, 0.8 + R() * 0.9]);   // (the half-widths: a new pair every 4 m)
      for (let k = 0; k < n; k++) {
        const q = Q[k], a = Q[Math.max(0, k - 1)], b = Q[Math.min(n - 1, k + 1)], l = Math.hypot(b.x - a.x, b.z - a.z) || 1, nx = -(b.z - a.z) / l, nz = (b.x - a.x) / l;
        const e = Math.min(Q[0].dd > 8 ? k : 99, Q[n - 1].dd > 8 ? n - 1 - k : 99), f = Math.min(1, 0.2 + e / 8), i = Math.floor(k / 4), t = k / 4 - i;
        const wl = lerp(W[i][0], W[i + 1][0], t) * f, wr = lerp(W[i][1], W[i + 1][1], t) * f;
        const at = (u, dy) => { let x = q.x + nx * u, z = q.z + nz * u;   // (by the road's wall the strip is pulled in: nothing of it inside the barrier line)
          for (let j = 0; j < 4 && q.dd < 6 && near(x, z) < 0.3; j++) { u *= 0.6; x = q.x + nx * u; z = q.z + nz * u; }
          return [x, caGround(x, z) + dy, z]; };
        const p = F.map((v, j) => at((v + (j % 4 ? (R() - 0.5) * 0.44 : 0)) * (v < 0 ? wl : wr), 0.2 - 0.06 * Math.abs(v) + (j % 4 ? (R() - 0.5) * 0.06 : 0)));
        S.push({ wl, wr, nx, nz, x: q.x, z: q.z, p, lo: at(-wl - 0.9, -0.1), ro: at(wr + 0.9, -0.1), cb: vary(L.bank, R, 0.05) });
      }
      for (let k = 0; k < n - 1; k++) {
        const a = S[k], b = S[k + 1], g = scen.get((a.x + b.x) / 2, (a.z + b.z) / 2), cl = tone(), cr = tone();
        const on = (v, t) => { const u = v * (v < 0 ? lerp(a.wl, b.wl, t) : lerp(a.wr, b.wr, t)); return [lerp(a.x, b.x, t) + a.nx * u, lerp(a.z, b.z, t) + a.nz * u]; };
        for (let j = 0; j < 4; j++) { const c = tone(); g.quadUp(a.p[j], a.p[j + 1], b.p[j + 1], b.p[j], [c, c, c, c]); }
        g.quadUp(a.lo, a.p[0], b.p[0], b.lo, [a.cb, cl, cl, b.cb]); g.quadUp(a.p[4], a.ro, b.ro, b.p[4], [cr, a.cb, b.cb, cr]);
        for (let m = 0; m < 4; m++) {   // (cobbles: three to a metre)
          const [x, z] = on((R() * 2 - 1) * 1.1, R()), r = 0.14 + R() * R() * 0.3;
          if (R() < 0.75 && near(x, z) >= 0.5) cobble(scen.get(x, z), x, caGround(x, z) + 0.17, z, r, r * (0.5 + R() * 0.5), R() * TAU, sh(pick(), 0.92 + R() * 0.2), R);
        }
        const [x, z] = on((R() < 0.5 ? -1 : 1) * (R() < 0.7 ? 0.8 + R() * 0.4 : R() * 0.6), R()), sz = 0.4 + R() * R() * 0.8, ry = sz * (0.5 + R() * 0.35);   // (a block: one to three metres)
        if (R() < 0.35 && near(x, z) >= 0.9) rock(scen.get(x, z), x, caGround(x, z) + 0.14 + ry * 0.22, z, sz * 1.2, ry, sz, R() * TAU, vary(pick(), R, 0.08), R, 0.28);
      }
    }
  }

  const pre0 = L.pre, extra0 = L.extra; let cur = null;
  L.pre = function (k) { if (pre0) pre0.call(this, k); cur = place(k); };
  L.extra = function (k) {
    if (extra0) extra0.call(this, k);
    if (!cur) return;
    draw(k.scen, cur, rng(L.seed + 1501));
    cur = null;
  };
})();
