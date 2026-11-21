/* =========================================================================
   WORLD — realizem 13: the fences and walls OpenStreetMap has round three more real circuits on the shared builder (js/world-rbring.js)
   outside the 15 tracks of the packages (docs/realizem.md) and the game did not draw: Silkeborg's metal wall, Sosnová's noise barrier and
   the fence along its lap, Pembrey's fences. (Kågeröd: the one thing OSM has more is the fence round its grounds, whose course its own
   note calls uncertain: not drawn.) Each circuit's part is chained onto its look's build hook (API.rbLook.<id>.build, after a world's own): the
   walls and the fences' posts go into the scenery's chunks, a circuit's chain link into one mesh (as Silkeborg's own fences). Loaded after
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
  const METAL = [0.6, 0.62, 0.65], PANEL = [0.72, 0.73, 0.7], POST = [0.58, 0.6, 0.62];
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

  chain('silkeborg', (K) => { for (const f of SI13.wall) wall(K, f, 2, METAL); });
  chain('sosnova', (K) => { for (const f of SO13.wall) wall(K, f, 3, PANEL); fences(K, SO13.fence); });
  chain('pembrey', (K) => { fences(K, PE13.fence); });
})();
