/* =========================================================================
   WORLD — realizem 13: the fences and walls OpenStreetMap has round seven more real circuits on the shared builder (js/world-rbring.js)
   outside the 15 tracks of the packages (docs/realizem.md) and the game did not draw: Silkeborg's metal wall, Sosnová's noise barrier and
   the fence along its lap, Pembrey's fences, Zandvoort's fences that stand outside the game's barriers, the fences past the barriers of
   Sakhir, Sepang and Quezaltepeque and the walls Sakhir and Quezaltepeque have behind their first line. (Kågeröd: the one thing OSM has
   more is the fence round its grounds, whose course its own note calls uncertain: not drawn. Kildare, Aguascalientes, Río Hondo: OSM has
   no fence or wall within 60 m of their laps. Biķernieki: most of its fences follow the track where the game's barriers stand and the
   rest are short spurs: not drawn. The wall, tyre wall or guard rail OSM has nearest the road is a circuit's own protective line, which
   the builder's barriers are: never drawn a second time.) Each circuit's part is chained onto its look's build hook
   (API.rbLook.<id>.build, after a world's own): the walls and the fences' posts go into the scenery's chunks, a circuit's chain link
   into one mesh (as Silkeborg's own fences). Loaded after
   js/world-rbring.js (index.html); chained when the builder is first called for a look (World.ext.rbring, which every world's build calls), so
   a world loaded later (lazily) gets its part too. The same way as realizem 6 (Tuzla, Lusail). Data: © OpenStreetMap contributors, ODbL.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.ext || !World.ext.rbring) return;
  const API = World.api, PART = {}, DONE = new WeakSet();
  // a circuit's part after its world's own build (K: the shared builder's hook, js/world-rbring.js LK.build): chained once per look, when the
  // builder is called (the look is on API.rbLook by then, however its world was loaded)
  const chain = (id, fn) => { PART[id] = fn; };
  const hook = () => {
    const L = API.rbLook || {};
    for (const id in PART) {
      const lk = L[id]; if (!lk || DONE.has(lk)) continue;
      const prev = lk.build, fn = PART[id]; lk.build = prev ? (K) => { prev(K); fn(K); } : fn; DONE.add(lk);
    }
  };
  let TEX = null;   // (the builder's textures: the chain link's picture)
  const rb = World.ext.rbring; World.ext.rbring = (scene, tex, opts) => { TEX = tex; hook(); return rb(scene, tex, opts); };

  const pts = (f) => { const P = []; for (let k = 0; k + 1 < f.length; k += 2) P.push([f[k], f[k + 1]]); return P; };
  const METAL = [0.6, 0.62, 0.65], PANEL = [0.72, 0.73, 0.7], POST = [0.58, 0.6, 0.62], CONC = [0.76, 0.76, 0.74];   // (CONC: the builder's concrete)
  // where a wall or a fence may stand: past the circuit's own barriers (2.5 m clear of them), not by the pit lane, not by a grandstand of the
  // builder's (def.stands: its side, 8 m to either end)
  const keeper = ({ T, def, sAt }) => {
    const st = (def.stands || []).map(([a, b, sd]) => [sAt(a - 8), b - a + 16, sd]);
    return (x, z) => {
      const i = T.nearestIdx(x, z), o = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i], s = i * T.ds;
      if (Math.abs(o) <= (o > 0 ? T.br[i] : T.bl[i]) + 2.5 || T.pitAt(s)) return false;
      for (const [s0, w, sd] of st) if (sd * o > 0 && (((s - s0) % T.len) + T.len) % T.len <= w) return false;
      return true;
    };
  };
  // a wall by a line (f: x, z, x, z ...), h m high and 25 cm thick, following the ground in pieces of at most 8 m (as realizem 6's): its two
  // faces and its top in col, an end where a piece has no neighbour; the trees, the lots and the people 3 m off it
  function wall(K, f, h, col) {
    const { scen, nrGround, exclPush, CR } = K, P = pts(f), t = 0.125, cols = [col, col, col, col], keep = keeper(K);
    for (let k = 0; k + 1 < P.length; k++) {
      const a = P[k], b = P[k + 1], el = Math.hypot(b[0] - a[0], b[1] - a[1]); if (el < 0.05) continue;
      const ux = (b[0] - a[0]) / el, uz = (b[1] - a[1]) / el, nx = -uz * t, nz = ux * t, n = Math.ceil(el / 8);
      const at = (q) => [a[0] + ux * el * q / n, a[1] + uz * el * q / n], ok = (q) => q >= 0 && q < n && keep(...at(q)) && keep(...at(q + 1));
      for (let q = 0; q < n; q++) {
        if (!ok(q)) continue;
        const e0 = q ? q / n * el : -t, e1 = q + 1 < n ? (q + 1) / n * el : el + t;   // (a line's corners close)
        const x0 = a[0] + ux * e0, z0 = a[1] + uz * e0, x1 = a[0] + ux * e1, z1 = a[1] + uz * e1, g0 = nrGround(x0, z0), g1 = nrGround(x1, z1);
        const V = (x, z, y, s) => [x + s * nx, y, z + s * nz], C = [(x0 + x1) / 2, (g0 + g1 + h) / 2, (z0 + z1) / 2], g = scen.get(C[0], C[2]);
        for (const s of [-1, 1]) g.quadO(V(x0, z0, g0 - 0.3, s), V(x1, z1, g1 - 0.3, s), V(x1, z1, g1 + h, s), V(x0, z0, g0 + h, s), col, C);
        g.quadUp(V(x0, z0, g0 + h, -1), V(x1, z1, g1 + h, -1), V(x1, z1, g1 + h, 1), V(x0, z0, g0 + h, 1), cols);
        if (!ok(q - 1) && !(q === 0 && k > 0)) g.quadO(V(x0, z0, g0 - 0.3, -1), V(x0, z0, g0 - 0.3, 1), V(x0, z0, g0 + h, 1), V(x0, z0, g0 + h, -1), col, C);
        if (!ok(q + 1) && !(q === n - 1 && k + 2 < P.length)) g.quadO(V(x1, z1, g1 - 0.3, -1), V(x1, z1, g1 - 0.3, 1), V(x1, z1, g1 + h, 1), V(x1, z1, g1 + h, -1), col, C);
        for (const [x, z] of [[x0, z0], [C[0], C[2]]]) { exclPush(x, z, 3); CR.exclAdd(x, z, 2); }
      }
    }
  }
  // where the builder's own debris fences stand: behind its concrete walls (by the stands, the grandstand areas, a track's walls, round the
  // start) and its tyre walls (the gravel traps of the sharper corners), as js/world-rbring.js has them (kindAt). An OSM fence up to 10 m
  // behind one is that fence, not a second one
  const ownFence = ({ T, def, sAt, dS }) => {
    const N = T.px.length, F = [new Uint8Array(N), new Uint8Array(N)], si = (sd) => (sd > 0 ? 1 : 0);
    for (const [key, e] of [['stands', 24], ['ga', 10], ['walls', 20]]) for (const [a, b, sd] of def[key] || []) for (let d = a - e; d <= b + e; d += T.ds) F[si(sd)][T.idx(sAt(d))] = 1;
    for (const c of T.corners || []) {
      if (c.sev < 3) continue;
      const i1 = c.i1 < c.i0 ? c.i1 + N : c.i1, k2 = si(-c.dir), gr = k2 ? T.gravR : T.gravL;
      for (let k = c.i0 - 10; k <= i1 + 14; k++) { const ii = ((k % N) + N) % N; if (gr && gr[ii]) F[k2][ii] = 1; }
    }
    for (let i = 0; i < N; i++) { const d = dS(i * T.ds); if (d > -420 && d < 280) F[0][i] = F[1][i] = 1; }
    return (x, z) => { const i = T.nearestIdx(x, z), o = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i]; return F[si(o)][i] === 1 && Math.abs(o) <= (o > 0 ? T.br[i] : T.bl[i]) + 10; };
  };
  // chain-link fences by lines (list of x, z, x, z ...): 2 m high, a post every 3 m, the debris fences' picture (the look of Silkeborg's
  // fences, js/world-silkeborg.js; OSM has no heights); the posts in the scenery's chunks, the mesh of all of them in one mesh; the trees, the
  // lots and the people 2 m off them. Not where the builder's own debris fence stands in front (ownFence), nor a run shorter than 9 m that
  // such a cut leaves
  function fences(K, list) {
    const { scen, nrGround, exclPush, CR, root } = K, { GB, box } = API, fg = new GB(true), keep = keeper(K), own = ownFence(K);
    const post = (x, z, rot) => box(scen.get(x, z), x, nrGround(x, z) - 0.2, z, 0.08, 2.35, 0.08, rot, POST);
    for (const f of list) {
      const P = [];   // (the line in pieces of about 3 m: x0, z0, x1, z1, length, direction)
      for (let k = 2; k < f.length; k += 2) {
        const ax = f[k - 2], az = f[k - 1], bx = f[k], bz = f[k + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 3)), rot = Math.atan2(bz - az, bx - ax);
        for (let q = 0; q < n; q++) P.push([ax + (bx - ax) * q / n, az + (bz - az) * q / n, ax + (bx - ax) * (q + 1) / n, az + (bz - az) * (q + 1) / n, L / n, rot]);
      }
      const ok = P.map(([x0, z0, x1, z1]) => keep(x0, z0) && keep(x1, z1) && !own((x0 + x1) / 2, (z0 + z1) / 2));
      for (let q = 0; q < ok.length;) { let e = q; while (e < ok.length && ok[e] === ok[q]) e++; if (ok[q] && e - q < 3 && e - q < ok.length) ok.fill(false, q, e); q = e; }
      let acc = 0;
      P.forEach(([x0, z0, x1, z1, d, rot], q) => {
        if (ok[q]) {
          const y0 = nrGround(x0, z0), y1 = nrGround(x1, z1), u0 = acc / 2.5, u1 = (acc + d) / 2.5, ins = [(x0 + x1) / 2 - (z1 - z0), y0 + 1, (z0 + z1) / 2 + (x1 - x0)];
          fg.quadO([x0, y0 + 0.05, z0], [x1, y1 + 0.05, z1], [x1, y1 + 2.05, z1], [x0, y0 + 2.05, z0], [1, 1, 1], ins, [[u0, 0], [u1, 0], [u1, 0.8], [u0, 0.8]]);
          post(x0, z0, rot); if (!ok[q + 1]) post(x1, z1, rot);   // (a run's last post)
          exclPush((x0 + x1) / 2, (z0 + z1) / 2, 2); CR.exclAdd((x0 + x1) / 2, (z0 + z1) / 2, 1.5);
        }
        acc += d;
      });
    }
    if (fg.empty || !TEX || !TEX.fence) return;
    const m = new THREE.Mesh(fg.geometry(), new THREE.MeshLambertMaterial({ map: TEX.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide }));
    m.receiveShadow = true; m.matrixAutoUpdate = false; m.name = 'osmFences'; root.add(m);
  }

  /* The lines as x, z (m: east, south of the start line's middle), from OpenStreetMap, the parts within 60 m of the circuit; the ways by
     their numbers. */
  // Silkeborg: the metal wall (barrier=wall, material=metal) on the right before the last corners; OSM has no height: 2 m, as the fences
  const SI13 = { wall: [
    [197.4, 295.6, 220.5, 308.8, 239.9, 303.5, 255.7, 300.1, 268.2, 300.2],   // w1278798674: 75 m, s 1728-1784 R
  ] };
  // Sosnová: the noise barrier (barrier=wall, wall=noise_barrier) on the circuit's west side (no height in OSM: 3 m) and the fence
  // (barrier=fence) that follows the lap on its left
  const SO13 = { wall: [
    [-299.1, 31.1, -297.7, -11, -292.8, -53.1, -287.5, -89.3, -283.2, -112.7, -278.5, -134.1, -273.3, -154.1],   // w909569871: 187 m, s 574-721 L
  ], fence: [
    [-105.7, -277.2, -14.8, -250.9, 45, -200.6, 86, -138, 112.2, -83.3, 146.8, -46.8, 178, -8.4, 166.1, 31.1, 132, 43.4, 91, 55.7, -128, 34.5, -244.7, 25.6, -271.4, 3.9, -284.3, -56.7,
      -277.6, -115, -254, -189, -231.9, -234.8],   // w1532982736: 1149 m, round the lap on its left
  ] };
  // Pembrey: the fences (barrier=fence) OSM has within 60 m of the circuit: the long one along its left side, shorter ones on its right
  const PE13 = { fence: [
    [241.5, -347.1, 265.5, -177.8, 254.3, -141.9, 232, -113.6, 133.7, -67.7, 134.8, -23, 137.4, 0.5, 143.8, 21.1, 157.1, 59, 173.1, 67.7, 210.9, 90.6, 220.3, 95.9, 441.6, 60.1, 476.2, 62.4,
      527.3, 109.2],   // w999853105: 885 m, s 379-1218 L
    [531.6, 115.4, 577.9, 226.3, 606.9, 297.1],   // w999853105: 197 m, s 1223-1388 L
    [583, 362.5, 575.6, 360.9, 530.6, 368, 455.9, 370.8, 270.7, 387.4, 150.6, 408.2, 99.6, 401.9, 52.2, 378.6, 9.5, 354.6, -30.2, 327.5, -70.5, 295.8, -75.3, 302],   // w999853105: 696 m, s 1423-2038 L
    [242.1, -342.9, 248.1, -353.2],   // w999853106: 12 m, s 379 L
    [199.9, -368, 194.4, -362.6, 48.2, -175.4, 36.5, -183.5],   // w999853106: 259 m, s 176-374 L
    [96.2, 301.5, 87.1, 306.8, 80.1, 308.7, 73.9, 307.1, 31.2, 282.3],   // w999853111: 74 m, s 1896-1962 R
    [50.1, 266.2, 35.8, 272.3, -41.2, 210.7, -27.4, 187.1],   // w999853112: 142 m, s 1954-2106 R
    [83.2, 101.5, 124.6, 130.7, 116.3, 144],   // w999853113: 66 m, s 828-876 R
    [108.9, 119.6, 102.9, 128.6],   // w999853114: 11 m, s 856-859 R
    [108.6, 106.7, 143.5, 116.4, 135, 129.6, 135.8, 135.7, 156.2, 138.4],   // w999853115: 79 m, s 846-893 R
    [159.9, 145.7, 160.6, 142.4, 188.2, 146.1],   // w999853116: 31 m, s 897-918 R
    [175.3, 147.8, 185.3, 148.7, 264.8, 184.2],   // w999853117: 97 m, s 908-978 R
  ] };
  // Zandvoort: the fences (barrier=fence; not the guard rails, fence_type=guard_rail) OSM has within 60 m of the lap, only the parts of
  // 30 m or more that stand outside the game's barriers. Most of the circuit's fences follow the track a few metres nearer the road than
  // the game's barrier lines, where the builder's own barriers stand: those are left to the builder
  const ZA13 = { fence: [
    [47.9, 44.9, 84.6, 39.2],   // w1318339540: 37 m, s 764-800 L
    [54.7, 48, 50.1, 47.8, 45.6, 48.5, 43.5, 49.1, 39.9, 51.9, 37.7, 55.9, 37, 58.5, 36.8, 61.5, 37.7, 66.4, 38.8, 69.4, 41.7, 74.9, 43.2, 76.8, 47.4, 80.4, 51.8, 82.4, 55.4, 83.1,
      66.2, 83.1],   // w1318339541: 68 m, s 792-900 L
    [107.2, 69.1, 125.1, 62.7, 145.7, 56.5, 148.7, 55.9],   // w1318339541: 44 m, s 944-988 L
    [587, 17.1, 578.1, 21.5, 570.9, 26.1, 563.9, 31.4, 538.2, 55.9, 523.8, 70.3, 521.8, 74.7, 521.5, 78.7, 521.8, 80.7, 524, 85.7, 526.1, 88.3],   // w1318443042: 103 m, s 1356-2712 R
    [517.9, 48, 558.4, 29.6],   // w1318346137: 44 m, s 1360-1408 R
    [770.2, 251, 776.1, 245.8, 784.1, 236.8, 789.7, 231.4, 810.3, 214.1, 824.9, 200.3, 831.6, 193.4, 836.5, 187.3, 849.5, 166.6, 859.2, 148.7, 863.5, 138.5, 867.4, 126.7, 870.2, 114.1,
      870.5, 107.8, 869.3, 82.6, 868.1, 75.8, 866.9, 72.3, 862.6, 63.4, 834.3, 27.7, 823.8, 15.1, 815.1, 6.4, 808.5, 1.5, 804.8, -0.7],   // w1318443038: 312 m, s 1648-1896 L
    [746.2, 175.2, 743.5, 169.2, 739, 161.6, 728.9, 142.8, 721.1, 127.2, 713.4, 114.9, 709, 109.3, 700.8, 100.8, 692.4, 94, 686.1, 90.5, 676.6, 86.7, 664.6, 83.7, 657.9, 82.7, 642.4,
      82.1, 636.7, 82.3, 629.6, 83.2, 589.5, 90.7],   // w1318796965: 204 m, s 1848-2644 R
    [695.1, 339.5, 690.2, 344.4, 683.8, 347.9, 675.6, 350.2, 663.4, 351.5, 647.6, 351.2, 627, 349.2, 607, 345, 598.7, 342.7, 589.7, 339.6, 572.3, 332.1, 557.1, 323.8, 551.1, 320.1,
      537.9, 310.8, 529.4, 303.9, 519.4, 294.8, 513.2, 287.1],   // w1318502052: 204 m, s 2012-2244 R
    [697.6, 389.7, 681.3, 421.1, 680.9, 423.5],   // w1318753750: 38 m, s 2036-2048 L
    [672.5, 424.2, 665.1, 421.4, 642.3, 410.1, 613.4, 394.5, 550.4, 362.5, 527, 348.2, 516.9, 341.1],   // w1318753751: 177 m, s 2056-2200 L
    [445.3, 259.2, 480, 236.6],   // w1318753753: 41 m, s 2264-2280 L
    [516.8, 268.1, 523.6, 261.9, 530.5, 256.9, 538.3, 252.2, 547.7, 248.1, 552.8, 246.4],   // w1318502052: 42 m, s 2280-2328 R
    [612.3, 209.6, 617, 208.2, 625.4, 204.8, 648.1, 194.9, 657.6, 190.1, 661.9, 187.3, 667.9, 181.4, 670.5, 177.9, 674, 170.9, 675.8, 162.5, 675.6, 157.3, 674.8, 151.8, 673, 146.3,
      668.6, 137.4, 663.9, 132.2, 660.7, 129.8, 653.3, 126.6, 640.4, 123.8],   // w1318796967: 143 m, s 2396-2592 L
    [83.7, 408.6, 87.5, 428.3, 93.1, 442.2, 95, 449.6, 95.5, 453.8, 95.3, 460.3, 94.5, 463.7, 92.3, 469.1, 88.9, 475.8, 86.6, 479.3, 82.4, 484.6, 76.6, 490.7, 68.1, 497.5],   // w1318983054: 101 m, s 3420-3548 R
    [134.7, 498.9, 133.1, 508.2, 130.6, 513.7, 126.4, 520.5, 122.3, 524.5, 117.2, 528.7, 105.6, 535.4, 99, 538.6, 84.7, 543.4, 73.7, 545.5, 62.9, 546.7, 55.6, 546.9, 37.3, 545, -0.8,
      538.1],   // w1318983053: 158 m, s 3500-3620 L
  ] };
  // Sakhir: OSM has walls all round its lap (barrier=wall; no height, no material) and a few fences. The wall nearest the road on either side
  // is the circuit's own protective line, which the game's barriers are (also where OSM has it farther from the road than the game has
  // its own): not drawn. Drawn: the parts of walls that, from every part of the lap within 60 m of them, stand 5 m or more behind another
  // barrier OSM has on their side (a second line), in runs of 30 m or more, as concrete 2 m high (OSM has neither: as the fences), and the
  // fences past the game's barriers, 30 m or more
  const SK13 = { wall: [
    [218.1, -457.2, 220.1, -459.1, 224.6, -461.5, 230.1, -463.7, 235.6, -464.7, 241.2, -464.5, 246.7, -463.5],   // w1487646599: 31 m, s 760-800 R
    [338.2, -111.8, 328.3, -101, 320.8, -91.9, 311.9, -78, 302.8, -61.9],   // w1487646603: 61 m, s 2210-2262 R
    [192.8, -386.3, 198.7, -413.3, 201.8, -423.7],   // w1487646599: 38 m, s 2550-2556 R
    [149.3, 59.2, 145.4, 163.5],   // w1487655591: 104 m, s 2984-3086 R
    [218.6, 79.8, 218.1, 91.7, 218.6, 103, 220.5, 112, 222.4, 117.3, 224.9, 122.3, 231.4, 131.8, 235.5, 136.1, 239.9, 139.9],   // w1487646594: 67 m, s 3002-3058 L
    [143, 220, 140.9, 271.5],   // w1487655587: 52 m, s 3144-3194 R
  ], fence: [
    [102.2, -545.4, 89.1, -577.2, 83.9, -587.8],   // w1487646667: 46 m, s 568-604 L
    [752.8, -453.9, 717.6, -460.4, 708.4, -458.6, 704.7, -453.4, 648, -465.5, 637.6, -467.2, 611.8, -468.6, 602.5, -470.9, 593.8, -474.2, 459.8, -503.1, 395.9, -519.2, 394, -517.2,
      353.9, -532.9, 352.8, -546.2, 354.3, -552.4],   // w1360978576: 433 m, s 890-1300 L
    [417.9, -462.2, 495.2, -450],   // w1487646609: 78 m, s 972-1048 R
    [677.5, -415.8, 636.3, -422.8],   // w1487646608: 42 m, s 1194-1232 R
    [698, -486.6, 691.6, -456],   // w1486458904: 31 m, s 1240-1242 L
    [273.3, 578, 308.1, 560.7],   // w1487646558: 39 m, s 4438-4474 L
    [275.2, 581.4, 265.9, 564.9, 168.8, 619.4, 178.2, 636.6],   // w1487606633: 150 m, s 4474-4586 L
    [79.7, 665.1, 95.4, 656.3, 106.9, 677.4],   // w1487598823: 42 m, s 4668-4684 L
    [3.6, 707.6, 29.8, 692.9],   // w1487598823: 30 m, s 4724-4730 L
    [-80.9, 541, -66.8, 501.1, -78.7, 500.1],   // w1360978571: 54 m, s 4852-4892 L
  ] };
  // Sepang: its walls in OSM are its tyre walls (material=tyres) and the pit wall, the circuit's own protective lines: not drawn. Drawn: the
  // fences past the game's barriers, 30 m or more
  const SP13 = { fence: [
    [-389.1, -436.7, -336.9, -434.9],   // w144510772: 52 m, s 1294-1338 L
    [-237.6, -451.8, -237, -449.7, -291.8, -439.3, -320.3, -436.8, -336.9, -437.8],   // w144510779: 103 m, s 1344-1440 L
    [-195.8, -463, -215.4, -457.5, -237.9, -453.3, -237.6, -451.8],   // w144510780: 45 m, s 1440-1482 L
    [-31.1, -321.5, -29.5, -362.3, -27.7, -383, -25.1, -400.3, -21.1, -417.3],   // w144510777: 97 m, s 1672-1762 L
    [127.7, -189.4, 114.8, -183.8, 105.5, -180.9, 93.3, -178.2, 79.4, -176.6, 68.4, -176.1, 60.9, -177.2, 52.3, -179.8, 40.9, -184.1, 22.7, -193.2],   // w144510770: 110 m, s 1924-2048 L
    [344, -128.6, 344, -140.4, 342, -156, 339.5, -170.6, 338.7, -173.1],   // w144533527: 45 m, s 2312-2348 R
    [309.8, -75.8, 258.4, -56.2],   // w144367516: 55 m, s 5214-5262 R
    [300.1, -80.2, 281.1, -74.9, 262.7, -68.4],   // w144367522: 39 m, s 5222-5258 R
  ] };
  // Quezaltepeque: the walls behind the fence at the venue's southern edge (barrier=wall; no height, no material: concrete 2 m, as Sakhir's),
  // 30 m or more, and the fences past the game's barriers, 30 m or more
  const QZ13 = { wall: [
    [167.6, 324.2, 260.5, 328.9],   // w421750604: 93 m, s 1446-1522 L
    [225.1, 339.8, 190.3, 339.4, 79.3, 333.7],   // w421750606: 146 m, s 1482-1586 L
    [38.7, 317.6, 125.6, 322],   // w421750604: 87 m, s 1558-1638 L
    [-147.5, 303.6, -137.8, 307.3, -129.2, 309.3, -28.1, 314.2],   // w421750604: 120 m, s 1756-1820 L
    [-47.5, 325.6, -118.8, 321, -121.5, 321.6, -122.3, 324.4, -121.2, 328.5, -117.8, 335],   // w421750606: 89 m, s 1776-1804 L
    [-363, 252, -352.4, 256.3, -320.8, 274.6, -275.1, 291.2, -240.8, 296.5, -224.8, 297.6],   // w414892255: 147 m, s 2744-2814 L
  ], fence: [
    [289.9, -178.4, 247.5, -154.9],   // w404482197: 49 m, s 292-338 L
    [422.2, -221.6, 406.6, -232, 399.8, -231.1, 385.8, -224.9],   // w404482197: 41 m, s 426-442 L
    [432.9, -176, 429.8, -197.6, 426.3, -212.3, 422.2, -221.6],   // w421750608: 47 m, s 444-478 L
    [308.2, 197.2, 302.7, 166.8, 299.5, 153.3],   // w421750607: 45 m, s 1302-1342 L
    [221.9, 307.2, 242.9, 306.9, 257.5, 302.5],   // w421750607: 36 m, s 1440-1472 L
    [-30.5, 269.6, -21.3, 266.8, -3.6, 265.4, 13.5, 267.1, 55.8, 275.1],   // w421750607: 88 m, s 1636-1730 L
    [-192.1, 278, -209.9, 251],   // w421750602: 32 m, s 2710-2712 L
  ] };

  chain('silkeborg', (K) => { for (const f of SI13.wall) wall(K, f, 2, METAL); });
  chain('sosnova', (K) => { for (const f of SO13.wall) wall(K, f, 3, PANEL); fences(K, SO13.fence); });
  chain('pembrey', (K) => { fences(K, PE13.fence); });
  chain('zandvoort', (K) => { fences(K, ZA13.fence); });
  chain('sakhir', (K) => { for (const f of SK13.wall) wall(K, f, 2, CONC); fences(K, SK13.fence); });
  chain('sepang', (K) => { fences(K, SP13.fence); });
  chain('quezaltepeque', (K) => { for (const f of QZ13.wall) wall(K, f, 2, CONC); fences(K, QZ13.fence); });
})();
