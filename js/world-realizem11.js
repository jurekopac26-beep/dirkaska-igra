/* =========================================================================
   WORLD — Realizem 11 (docs/realizem.md, »vse kot v resnici, samo po virih«): what stands by the road on two real mountain roads with
   villages that have no package of their own: Gudauri (Gruzija) and Porto Moniz (Portugalska, Madeira). Only what OpenStreetMap (ODbL
   1.0) maps within ~60 m of the road and neither the pass's own file nor another open pull request draws: Gudauri's kilometre posts
   (highway=milestone, km 89–93), the waste containers (amenity=waste_disposal) and the fence of a field (barrier=fence); Porto Moniz's
   drinking fountain, the trees mapped one by one (natural=tree) and the stone wall above the bay (barrier=wall). Left out: Gudauri's two
   benches and the platform of the buses (they fall in the room the pass's own file keeps for what it draws in the village), and Porto
   Moniz's two bus stops with their shelters (the package Realizem E draws them at the same places, as the tracks' `postaje`). OSM gives
   the place and the kind; the forms are plain and generic (no text, no logos), and what OSM leaves open (the species, the fence's kind,
   the colours) stays neutral. Each thing stands at its OSM place, or, where that place is on the road's verge, just past the barrier line
   on the same side (the kilometre posts sit by the road's edge in OSM); what OSM maps on the game's road itself (a roundabout's kerbs and
   flowerbed where the game's road runs otherwise) is left out. The terrain, the rocks and the slopes are left to the pull request that
   works on them; nothing here moves the ground. It changes neither js/world.js, js/render.js, the shared builder of the passes
   (js/world-prelaz.js) nor the track files: it hooks into the passes' looks (API.PL_LOOK[theme].extra, after whatever the look already
   has) and draws into the passes' scenery chunks (scen.get), so it adds no draw calls of its own. Its own random numbers come from a
   seeded generator, so the pictures and the tests repeat. Game metres (x east, z south) from tools/<id>/config.json and the tracks' own
   shift.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext) return;
  const API = World.api;

  // a seeded Math.random for this module's own placements (three.js and the builders' helpers use Math.random)
  const uu = { s: 104729 };
  const own = (fn) => { const r = Math.random; Math.random = () => (uu.s = (uu.s * 48271) % 2147483647) / 2147483647; try { return fn(); } finally { Math.random = r; } };

  // OpenStreetMap (ODbL 1.0), game metres; ways as their nodes, nodes as [x, z]
  const D = {
    gudauri: {
      km: [[-208.6,-158.6],[-342.9,-813.6],[-503.5,-1331.8],[-233.4,-1464.3],[-887.6,-2172.8]],
      bins: [[-171.1,-37.5],[-275.7,-312.4],[-340.2,-456],[-454.2,-628.1]],
      fence: [[-176.3,59.8],[-179.8,15.8],[-134.4,13.6],[-129.3,59.6],[-162.2,67.1],[-176.3,59.8]]
    },
    portomoniz: {
      tap: [649.8,-743.9],
      trees: [[981,-820.2],[995.4,-816.5],[1087.4,-815.9],[1062.4,-848.4],[1059.6,-840.8],[670.3,-726.2],[664.7,-725.3],[660.5,-724.4],[655.1,-717.6],[651.5,-711.1],[653.2,-760.9],[656.6,-746.7],[647.2,-742.8],[1020.3,-775.8],[1011.5,-770.4],[475.6,-105.8],[468,-104],[463.4,-107.9],[459.6,-112.8],[457.6,-118.4],[456.6,-124.4],[455.5,-129.5]],
      wall: [[991.4,-819.7],[992.2,-834.6],[999.2,-848.4],[999.8,-859.4],[1000.7,-866.4],[998.7,-871.1],[995.7,-879.7],[996.3,-886.1],[996.4,-896.8],[998.6,-910.9],[996.7,-918.6]]
    }
  };

  // a point past the road's barrier line by m metres on its own side: itself if it is already there, else moved straight out from the
  // road (same place along it); null where the road's other leg is as near (a hairpin) or no road is near: [x, z, i, side]
  const past = (x, z, m) => {
    const T = API.T, n = API.vrNear(x, z), i = n.i; if (i < 0) return null;
    const dx = x - T.px[i], dz = z - T.pz[i], al = dx * T.tx[i] + dz * T.tz[i], lat = dx * T.nx[i] + dz * T.nz[i], side = lat >= 0 ? 1 : -1;
    if (n.dd >= m) return [x, z, i, side];
    const o = side * ((side > 0 ? T.br[i] : T.bl[i]) + m), qx = T.px[i] + T.tx[i] * al + T.nx[i] * o, qz = T.pz[i] + T.tz[i] * al + T.nz[i] * o;
    return API.vrNear(qx, qz).dd >= m * 0.6 ? [qx, qz, i, side] : null;
  };
  const clear = (x, z, m) => API.vrNear(x, z).dd >= m;
  // a polyline in pieces of about `step` metres: fn(mid x, mid z, length, rot, piece's ends)
  const walk = (pts, step, fn) => {
    for (let k = 1; k < pts.length; k++) {
      const [x0, z0] = pts[k - 1], [x1, z1] = pts[k], L = Math.hypot(x1 - x0, z1 - z0); if (L < 0.05) continue;
      const n = Math.max(1, Math.round(L / step)), rot = Math.atan2(z1 - z0, x1 - x0);
      for (let j = 0; j < n; j++) {
        const a = j / n, b = (j + 1) / n, ax = x0 + (x1 - x0) * a, az = z0 + (z1 - z0) * a, bx = x0 + (x1 - x0) * b, bz = z0 + (z1 - z0) * b;
        fn((ax + bx) / 2, (az + bz) / 2, L / n, rot, ax, az, bx, bz);
      }
    }
  };
  const roadRot = (i) => { const T = API.T; return Math.atan2(T.tz[i], T.tx[i]); };

  const R11 = {
    // Gudauri (the Georgian Military Road): five kilometre posts (OSM: km 89–93 one way, 50–46 the other), four waste containers by the
    // road, and the fence of a field 40 m off it (186 m; its kind not mapped:
    // posts and two wires)
    gudauri: {
      extra({ scen, excluded }) {
        const { box, caGround, vary, rng } = API, R = rng(1102);
        for (const [x0, z0] of D.gudauri.km) {   // a plain white post, its faces to the traffic both ways (OSM: direction=both)
          const q = past(x0, z0, 0.55); if (!q || excluded(q[0], q[1])) continue; const [x, z, i] = q, y = caGround(x, z);
          box(scen.get(x, z), x, y - 0.3, z, 0.12, 1.2, 0.3, roadRot(i), [0.9, 0.9, 0.87], [0.8, 0.8, 0.78]);
        }
        for (const [x0, z0] of D.gudauri.bins) {   // a metal container with its lid
          const q = past(x0, z0, 0.8); if (!q) continue; const [x, z, i] = q, y = caGround(x, z), r = roadRot(i), g = scen.get(x, z);
          if (excluded(x, z)) continue;
          box(g, x, y - 0.1, z, 1.6, 1.15, 1.0, r, vary([0.44, 0.49, 0.47], R, 0.03), [0.4, 0.44, 0.42]);
          box(g, x, y + 1.05, z, 1.66, 0.07, 1.06, r, [0.4, 0.44, 0.42], [0.42, 0.46, 0.44]);
        }
        const posts = [];   // the fence: posts every 3 m, two wires between them
        walk(D.gudauri.fence, 3.0, (mx, mz, L, rot, ax, az) => { posts.push([ax, az, rot, L]); });
        const last = D.gudauri.fence[D.gudauri.fence.length - 1]; posts.push([last[0], last[1], 0, 0]);
        const PC = [0.47, 0.39, 0.3], WC = [0.55, 0.55, 0.53];
        for (let k = 0; k < posts.length; k++) {
          const [x, z, rot, L] = posts[k]; if (!clear(x, z, 0.3) || excluded(x, z)) continue; const y = caGround(x, z), g = scen.get(x, z);
          box(g, x, y - 0.25, z, 0.1, 1.5, 0.1, rot, vary(PC, R, 0.05), PC);
          const nx = posts[k + 1]; if (!nx || !L || !clear(nx[0], nx[1], 0.3)) continue;
          const mx = (x + nx[0]) / 2, mz = (z + nx[1]) / 2, ym = (y + caGround(nx[0], nx[1])) / 2;
          for (const h of [0.55, 1.05]) box(g, mx, ym + h, mz, L, 0.025, 0.025, rot, WC, WC);
        }
      }
    },
    // Porto Moniz (Madeira): the drinking fountain of the square by the church, the 22 trees OSM maps one by one (their kind not mapped: plain broadleaves; the palms are left to the pass's own file) and the stone wall above
    // the bay (102 m)
    portomoniz: {
      extra({ scen, excluded }) {
        const { box, cyl, ico, caGround, vary, rng } = API, R = rng(1103);
        { const q = past(D.portomoniz.tap[0], D.portomoniz.tap[1], 0.6); if (q && !excluded(q[0], q[1])) {   // the drinking fountain: a stone pillar, a small basin
          const [x, z, i] = q, y = caGround(x, z), r = roadRot(i), g = scen.get(x, z), S = [0.4, 0.39, 0.38];
          box(g, x, y - 0.1, z, 0.34, 1.05, 0.34, r, S, S); box(g, x, y + 0.95, z, 0.5, 0.08, 0.5, r, [0.47, 0.46, 0.44], [0.5, 0.49, 0.47]); } }
        let k = 0;
        for (const [x, z] of D.portomoniz.trees) {   // a broadleaf: a trunk under a rounded crown (OSM's places; no tree on the road or in a landmark's room)
          k++; if (!clear(x, z, 1.5) || excluded(x, z)) continue; const y = caGround(x, z), g = scen.get(x, z), Rt = rng(1110 + k), h = 2.4 + Rt() * 0.8, cr = 1.9 + Rt() * 0.7;
          cyl(g, x, y - 0.2, z, 0.15, h + 0.6, 6, [0.4, 0.33, 0.26], [0.4, 0.33, 0.26]);
          const L = vary([0.12, 0.24, 0.1], Rt, 0.1);   // (the green of the look's own broadleaves, js/world-portomoniz.js laurelGeo)
          ico(g, x, y + h + cr * 0.55, z, cr, 0.8, L, Rt, 0.25);
          ico(g, x + (Rt() - 0.5) * cr * 0.6, y + h + cr * 0.95, z + (Rt() - 0.5) * cr * 0.6, cr * 0.7, 0.85, vary(L, Rt, 0.05), Rt, 0.25);
        }
        walk(D.portomoniz.wall, 1.8, (mx, mz, L, rot) => {   // the stone wall: dark basalt, 1.2 m
          if (!clear(mx, mz, 0.3) || excluded(mx, mz)) return;
          box(scen.get(mx, mz), mx, caGround(mx, mz) - 0.3, mz, L + 0.04, 1.5, 0.45, rot, vary([0.38, 0.37, 0.36], R, 0.03), [0.45, 0.44, 0.42]);
        });
      }
    }
  };

  // the two passes: after the look's own hooks
  const passes = () => {
    const PL = API.PL_LOOK; if (!PL) return;
    for (const th of Object.keys(R11)) {
      const L = PL[th], mine = R11[th]; if (!L || !mine) continue;
      const pre0 = L.pre, extra0 = L.extra;
      if (mine.pre) L.pre = function (k) { if (pre0) pre0.call(this, k); uu.s = 104729; own(() => mine.pre(k)); };
      if (mine.extra) L.extra = function (k) { if (extra0) extra0.call(this, k); uu.s = 15485863; own(() => mine.extra(k)); };
    }
  };

  passes();
})();
