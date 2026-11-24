/* =====================================================================================================================================
   VAOALA (Upolu, Samoa) — the roadside after OpenStreetMap (docs/proge/vaoala.md, »Obcestje«): what the pass's world (js/world-prelaz.js, its
   buildings from def.bld already OSM's) left out within 60 m of the road. The garden hedges on the right at 900-940 m (OSM barrier=hedge: five,
   the field boundaries running down from the road's edge and one along it, w1502367698, w1502367694, w1502367700, w1502367695, w1502367699),
   and on the left the two tree rows (natural=tree_row, w1458857458 along the road 9-10 m out, 83 m; w1458857457 26-31 m out, 33 m).
   OSM gives no species for the rows: World.vaoalaObcestje.rows 'a' broadleaf crowns (breadfruit, mango, as in the village's gardens),
   'b' coconut palms (question in the PR). Clipped to 6-62 m from the centre line (the game's road and its verge stay clear).
   How: World.ext.vaoala is wrapped; after it builds, one mesh of hedges and one of the rows' trees go into its root, set on its terrain
   (out.groundH). Driving, physics and the track file unchanged; drawn only (no collisions: those are Trki's).
   ===================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || typeof World.ext.vaoala !== 'function') return;
  const API = World.api, { GB, box, cyl, ico, rng, TAU } = API;

  // [x, z, ...] in the track's metres (x east, z south of the start line), from OSM, clipped to 6-62 m from the road
  const HEDGES = [
    [-371.4, 472.0, -320.3, 492.7],                       // w1502367698 (down from the road's edge, its first 55 m)
    [-342.8, 490.7, -323.2, 498.7],                       // w1502367694
    [-339.9, 532.4, -323.2, 498.7],                       // w1502367700 (along the road, 7-12 m out)
    [-373.7, 478.4, -350.9, 487.6],                       // w1502367695
    [-369.4, 429.4, -357.3, 434.4],                       // w1502367699
  ];
  const ROWS = [
    [-298.5, 485.0, -315.7, 548.3, -310.6, 564.9],        // w1458857458 (along the road, 9-10 m out)
    [-288.9, 515.6, -298.4, 547.3],                       // w1458857457
  ];
  const CO = World.vaoalaObcestje = { rows: 'a', stats: null };

  function along(line, step, fn) {   // points every ~step metres along a polyline: fn(x, z, angle)
    for (let i = 0; i + 3 < line.length; i += 2) {
      const ax = line[i], az = line[i + 1], bx = line[i + 2], bz = line[i + 3], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / step)), a = Math.atan2(bz - az, bx - ax);
      for (let k = (i ? 1 : 0); k <= n; k++) fn(ax + (bx - ax) * k / n, az + (bz - az) * k / n, a);
    }
  }

  function lay(out) {
    const gH = out.groundH, root = out.root, R = rng(7711), st = { hedgeM: 0, trees: 0, meshes: 0 };
    // the hedges: clipped shrubs ~1.5 m, ~1 m thick, in 2.2 m blocks, a lighter top, the greens a little uneven
    const gh = new GB();
    for (const h of HEDGES) along(h, 2.2, (x, z, a) => {
      const y = gH(x, z), t = 0.9 + R() * 0.2, hh = 1.35 + R() * 0.35;
      box(gh, x, y - 0.15, z, 2.5, hh, 0.95 + R() * 0.2, a, [0.13 * t, 0.3 * t, 0.1 * t], [0.2 * t, 0.4 * t, 0.15 * t]);
      st.hedgeM += 2.2;
    });
    // the tree rows: a tree every ~7 m
    const gt = new GB(), palms = CO.rows === 'b';
    for (const r of ROWS) along(r, 7, (x, z) => {
      x += (R() - 0.5) * 1.2; z += (R() - 0.5) * 1.2; const y = gH(x, z);
      if (palms) {
        const h = 9 + R() * 4, la = R() * TAU, lean = 0.4 + R() * 0.8, tx = x + Math.cos(la) * lean, tz = z + Math.sin(la) * lean;
        cyl(gt, x, y - 0.2, z, 0.2, h * 0.55, 6, [0.5, 0.42, 0.32], null, 0.17);
        cyl(gt, (x + tx) / 2, y + h * 0.55 - 0.25, (z + tz) / 2, 0.17, h * 0.45, 6, [0.55, 0.46, 0.35], null, 0.15);
        const top = [tx, y + h, tz], below = [tx, y + h - 4, tz], n = 9, a0 = R() * TAU;
        for (let k = 0; k < n; k++) {
          const b = a0 + k / n * TAU, L = 3.4 + R() * 1.2, dr = 1.2 + R() * 0.9, w = 0.5, c = Math.cos(b), s = Math.sin(b);
          const mid = [tx + c * L * 0.55, y + h + 0.35, tz + s * L * 0.55], tip = [tx + c * L, y + h - dr, tz + s * L];
          const pl = [mid[0] - s * w, mid[1], mid[2] + c * w], pr = [mid[0] + s * w, mid[1], mid[2] - c * w], col = k % 2 ? [0.24, 0.46, 0.18] : [0.32, 0.56, 0.22];
          gt.triO(top, pl, mid, col, below); gt.triO(top, mid, pr, col, below); gt.triO(pl, tip, mid, col, below); gt.triO(mid, tip, pr, col, below);
        }
      } else {
        const h = 8 + R() * 4, cr = 3 + R() * 1.3, t = 0.85 + R() * 0.3;
        cyl(gt, x, y - 0.2, z, 0.28, h * 0.5, 6, [0.36, 0.28, 0.2], null, 0.22);
        ico(gt, x, y + h - cr * 0.8, z, cr, 0.8, [0.12 * t, 0.3 * t, 0.1 * t], R, 0.18);
        ico(gt, x + (R() - 0.5) * 2, y + h - cr * 1.25, z + (R() - 0.5) * 2, cr * 0.75, 0.8, [0.15 * t, 0.34 * t, 0.12 * t], R, 0.18);
      }
      st.trees++;
    });
    for (const [g, name] of [[gh, 'roadside-hedges'], [gt, 'roadside-rows']]) {
      if (!g.P.length) continue;
      const m = new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true }));
      m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = name;
      root.add(m); st.meshes++;
    }
    st.hedgeM = Math.round(st.hedgeM); CO.stats = st;
  }

  // ---- the hook: World.ext.vaoala runs as before, then this file's meshes go into its root ----
  const ext = World.ext, baseExt = ext.vaoala;
  ext.vaoala = function () {
    const out = baseExt.apply(this, arguments);
    try { if (out && out.root && typeof out.groundH === 'function') lay(out); } catch (e) { console.warn('vaoala obcestje', e); }
    return out;
  };
})();
