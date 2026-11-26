/* =====================================================================================================================================
   WORLD — Kågeröd, Švedska: what stands by the circuit in the forest (grafika ob progi), from OpenStreetMap, on js/world-kagerod.js (the
   builder's hook LK.extra wrapped: what is here is laid out first, so the woods' alders, oaks and beeches and the crowds keep clear of it,
   then js/world-kagerod.js's own parts: the river and the buildings round the paddock).
   Drawn: the circuit grounds' fence (OSM w401177299, barrier=fence round the sports centre, 2.5 km, 30 m and more from the track): its posts
     every 3 m and three wires between them, as OSM runs it (its fixme says the line is uncertain in the woods: drawn as OSM has it); the
     four gates in it (OSM barrier=gate n4036265748 n4036266232 n4036266305 n4036266368): two galvanised tube leaves, open back along the road's edges; the service roads and
     the tracks of the grounds and round them within ~130 m (OSM highway=service, highway=track: the paddock's lanes, the roads to the
     school's halls and to the farms), as OSM runs them; the one with surface=asphalt dark, the rest gravel (no surface tag:
     assumed, like the one track OSM tags surface=gravel).
     Sizes (OSM has no height, width or fence_type here: assumed): the fence 1.8 m, its galvanised steel posts 8 cm, the wires at
     0.45, 1.0 and 1.55 m; the gates 1.6 m high and as wide as the road; the service roads 3.5 m, the tracks 2.6 m.
   Kept open (docs/realizem.md: only from sources): the roads in their culverts under the circuit (OSM tunnel=yes); the fence stops where
     a road crosses it with no gate in OSM; no road within 15 m of the track (its run-offs, gravel beds and paddock: the builder's own).
   Not drawn: the paddock's asphalt area (OSM area=yes: js/world-rbring.js' own paddock), the circuit's raceways, the secondary road 109
     (113 m and more, behind the forest), the river (js/world-kagerod.js).
   Data: OpenStreetMap (© OpenStreetMap contributors, ODbL), the main API, 2026-11-23; metres, origin = the start line, x east, z south
   (tools/kagerod/kagerod.json's lat0/lon0); the lines simplified to 0.25-0.3 m.
   ===================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const A = World.api, LK = A.rbLook && A.rbLook.kagerod;
  if (!LK || typeof LK.extra !== 'function') return;

  const FENCE = [-217.0,-406.3,-259.1,-428.3,-297.2,-338.4,-327.9,-325.4,-400.2,-197.3,150.2,178.8,374.4,303.1,418.9,268.8,481.0,264.4,511.8,223.7,493.6,209.2,413.4,165.6,397.7,123.0,410.1,62.3,402.4,33.1,387.1,20.1,376.7,-15.2,296.4,-38.6,288.2,-131.6,282.7,-146.5,182.6,-196.9,134.7,-224.5,124.5,-220.3,112.6,-226.2,109.1,-239.2,-18.8,-315.5,-23.7,-312.2,-29.9,-315.2,-37.1,-326.2,-179.4,-410.9,-185.4,-401.2,-199.1,-410.9,-217.0,-406.3];   // w401177299: x, z, ... (closed)
  const GATES = [452.0,266.5,-97, 118.3,-223.3,-61, -21.0,-313.9,56, -205.0,-409.3,-99];   // x, z, the road's heading (deg) at the gate
  const WAYS = [   // [surface (0 gravel, 1 asphalt), half width, x, z, ...]
    [0,1.3,1535.0,417.4,959.4,156.9,867.3,116.6,684.7,21.0,587.8,-23.6,219.1,-182.7,164.7,-210.2,-88.6,-361.8,-183.6,-418.0],   // w372398986
    [0,1.3,-236.3,594.3,-198.5,591.8,-179.7,591.1,-158.3,585.4,-121.8,570.7,-93.3,561.0,-83.0,554.0,-68.9,531.9,-58.5,520.6,-51.6,516.7,-43.3,514.1,-30.2,513.4,-14.7,511.1,21.3,497.7,71.1,481.7,110.7,471.6,129.0,464.6,139.9,459.8,158.8,444.2,174.3,426.4,204.3,378.4,245.7,297.5],   // w401124888
    [0,1.75,-239.4,-327.3,-254.7,-323.7,-264.3,-322.6,-298.6,-322.2,-298.4,-304.4,-268.8,-305.2,-264.6,-304.0,-259.9,-301.0,-255.3,-291.2],   // w401177306
    [0,1.75,-227.1,-279.4,-225.6,-316.4,-224.0,-331.8,-221.6,-345.7,-205.8,-396.8,-204.6,-402.5,-205.0,-409.3,-206.5,-416.7,-209.5,-424.2,-213.2,-429.5,-219.3,-435.4],   // w401177309
    [0,1.75,-107.7,-36.6,-70.2,-8.8,-28.0,21.6,22.3,60.1,35.6,69.2,90.8,90.4,117.9,103.6,129.0,107.3,159.8,115.6,179.4,122.8,210.5,129.5,230.6,138.2,243.2,144.2,250.0,145.5,258.2,143.8,271.8,139.1],   // w401177313
    [0,1.75,-264.3,-322.6,-266.1,-325.2,-266.8,-328.4,-265.8,-333.9,-233.5,-405.6,-233.6,-408.3,-235.0,-411.1,-237.0,-412.8,-239.8,-413.8,-242.3,-413.8,-245.3,-413.1,-247.3,-411.3,-281.3,-333.4,-282.3,-328.9,-282.3,-322.4],   // w401177314
    [1,1.75,-225.0,-246.3,-225.1,-257.6],   // w401177315
    [0,1.75,356.4,150.3,411.2,183.1],   // w401177316
    [0,1.75,108.8,-206.4,-8.8,-279.3],   // w401177317
    [0,1.75,-266.1,-368.0,-221.6,-345.7,-231.7,-339.6,-234.3,-337.0,-236.4,-333.8,-239.4,-327.3,-242.0,-309.8,-245.2,-302.2,-255.3,-291.2,-259.0,-284.5,-268.8,-256.9,-284.6,-228.1,-285.9,-222.7,-284.9,-216.4,-283.2,-210.4,-281.1,-205.8,-277.2,-201.5,-241.7,-179.9],   // w401177320
    [0,1.3,452.0,558.1,459.8,551.3,464.8,544.3,476.9,513.7,477.2,504.2,472.3,479.0,465.3,379.1,448.7,239.4,442.0,237.6,438.5,235.2,423.3,213.3,415.9,200.5,411.4,191.6,410.7,188.0,411.2,183.1,454.9,204.4,457.4,207.0,458.6,210.5,458.4,215.0,449.5,235.1,448.7,239.4],   // w401177321
    [0,1.75,95.2,-143.8,101.2,-139.3,103.2,-135.0,103.7,-129.5,103.4,-124.1,101.5,-120.4,97.0,-116.4,91.7,-114.3,85.8,-114.3,79.1,-116.4,72.2,-121.3,19.3,-167.4,-118.6,-255.6,-139.0,-266.1,-195.0,-290.7,-198.8,-293.5,-202.0,-296.8,-204.3,-301.7,-205.3,-307.7,-204.5,-313.0,-202.5,-318.1,-198.5,-324.4],   // w401177322
    [0,1.75,-380.5,-567.9,-355.6,-566.9,-346.9,-566.0,-336.3,-562.5,-314.2,-553.2,-154.5,-474.1,2.0,-394.6,4.7,-392.0,5.0,-389.0,0.9,-380.4,-6.6,-366.4,-11.6,-351.7,-25.5,-324.0,-25.7,-320.6,-9.3,-296.7,-7.5,-291.7,-6.6,-286.5,-7.0,-283.3,-8.8,-279.3,-22.4,-258.6,115.3,-176.3,118.9,-172.5,120.9,-169.4,122.3,-164.5,122.9,-160.3,122.6,-156.7,118.9,-149.0,115.3,-143.2,111.9,-139.8,103.2,-135.0],   // w401177326
    [0,1.75,97.9,-186.8,124.5,-234.3],   // w401177327
    [0,1.75,33.6,6.1,46.7,-15.7,51.1,-19.3,65.4,-28.2],   // w401177328
    [0,1.75,224.6,85.5,226.9,62.7,225.7,60.0,205.6,37.7],   // w401177329
    [0,1.75,158.3,27.3,198.7,-55.3,202.3,-58.8,214.0,-65.4],   // w401177330
    [0,1.75,372.8,102.7,352.9,117.7,347.4,125.0,331.0,150.9,309.9,183.0,304.4,187.8,295.5,196.6],   // w401177332
    [0,1.3,-9.3,-296.7,-24.0,-301.8,-50.5,-314.8,-105.6,-348.5,-110.7,-349.7,-115.3,-349.4,-132.3,-343.4],   // w401177333
    [0,1.75,176.7,-10.3,166.4,-7.0,156.0,-5.6,147.0,-6.8,139.0,-10.7,123.1,-23.2],   // w401177334
    [0,1.75,210.8,33.5,221.0,36.6,234.9,51.5,242.1,55.8,253.8,59.5,273.2,61.9,284.5,61.0,361.6,42.6],   // w401177335
    [0,1.3,169.8,-116.8,167.2,-111.6,163.1,-108.6,159.0,-107.6,154.4,-107.6,149.9,-108.9,146.2,-112.8,122.3,-164.5],   // w401177336
    [0,1.75,270.3,120.5,282.2,127.0,284.8,127.6,287.9,127.5,291.0,125.8,294.9,120.0,297.2,111.8,297.2,102.7],   // w401177337
    [0,1.75,141.0,17.8,123.1,-23.2,85.2,-82.8,76.9,-90.7,68.5,-96.8,62.6,-98.0,56.8,-97.8,43.7,-94.8],   // w401177338
    [0,1.75,195.4,269.2,221.2,221.2]   // w603741628
  ];
  const GALV = [0.66, 0.68, 0.7], WIRE = [0.5, 0.51, 0.52], WC = [[0.9, 0.86, 0.78], [0.92, 0.92, 0.94]];
  const hash = (i, j) => { let h = Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const segD = (x, z, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)); return Math.hypot(x - ax - t * dx, z - az - t * dz); };
  const onWay = (x, z, m) => WAYS.some(W => { for (let q = 2; q + 3 < W.length; q += 2) if (segD(x, z, W[q], W[q + 1], W[q + 2], W[q + 3]) < W[1] + m) return true; return false; });
  // a square beam from a to b (a wire, a gate's rail): its four sides
  function beam(g, a, b, r, col) {
    const dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz) || 1, ux = -dz / L * r, uz = dx / L * r, mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    const P = (p, s, t) => [p[0] + ux * s, p[1] + r * t, p[2] + uz * s];
    for (const [s0, t0, s1, t1] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) g.quadO(P(a, s0, t0), P(a, s1, t1), P(b, s1, t1), P(b, s0, t0), col, mid);
  }

  const base = LK.extra;
  LK.extra = function (o) { const mine = lay(o); const st = base(o) || {}; st.roadside = mine; return st; };

  function lay(o) {
    const { root, scen, exclPush, excluded, CR, tex } = o, { RB, box, nrGround, nrNear } = A;
    const st = { ways: 0, wayM: 0, posts: 0, gates: 0, meshes: 0 };
    const past = (x, z, m) => { const n = nrNear(x, z); return n.i < 0 || n.dd >= m; };
    const later = [], keep = (x, z, r) => later.push(x, z, r), free = (x, z) => !(excluded && excluded(x, z));
    const TILE = 240, tiles = [new Map(), new Map()];
    const rbAt = (s, x, z) => { const key = Math.floor(x / TILE) + ',' + Math.floor(z / TILE); let rb = tiles[s].get(key); if (!rb) tiles[s].set(key, rb = new RB(true)); return rb; };

    // the roads: a ribbon on the ground, cut where it comes within 15 m of the track
    for (const W of WAYS) {
      const s = W[0], col = WC[s], hw = W[1], U = 3, pts = [];
      for (let q = 2; q + 3 < W.length; q += 2) {
        const ax = W[q], az = W[q + 1], bx = W[q + 2], bz = W[q + 3], L = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(L / 2.5));
        for (let t = q > 2 ? 1 : 0; t <= m; t++) pts.push(ax + (bx - ax) * t / m, az + (bz - az) * t / m);
      }
      let prev = null, pi = -1, prb = null, along = 0, pAl = 0;
      for (let k = 0; k < pts.length; k += 2) {
        const x = pts[k], z = pts[k + 1];
        if (k) along += Math.hypot(x - pts[k - 2], z - pts[k - 1]);
        if (!past(x, z, 15) || !free(x, z)) { prev = null; continue; }   // (not in the run-offs and the gravel beds: the builder's own)
        const k0 = Math.max(0, k - 2), k1 = Math.min(pts.length - 2, k + 2), dx = pts[k1] - pts[k0], dz = pts[k1 + 1] - pts[k0 + 1], dl = Math.hypot(dx, dz) || 1;
        const nx = -dz / dl, nz = dx / dl, f = 0.93 + 0.12 * hash(Math.round(x / 4), Math.round(z / 4)), c = col.map(v => v * f);
        const row = [-hw, hw].map(e => [x + nx * e, nrGround(x + nx * e, z + nz * e) + 0.1 + 0.01 * s, z + nz * e]);
        const cols = [c, c], uvs = [[-hw / U, along / U], [hw / U, along / U]], rb = rbAt(s, x, z);
        if (prev && rb !== prb) pi = rb.row(prev[0], prev[1], prev[2]);
        const r = rb.row(row, cols, uvs);
        if (prev) { rb.link(pi, r, 0, 1); st.wayM += along - pAl; } else st.ways++;
        prev = [row, cols, uvs]; pi = r; prb = rb; pAl = along; keep(x, z, hw + 1);
      }
    }

    // the fence: a post every 3 m, three wires to the next; open where a road crosses it
    const F = FENCE, n = F.length / 2;
    let last = null;
    for (let k = 0; k < n; k++) {
      const ax = F[2 * k], az = F[2 * k + 1], bx = F[(2 * k + 2) % F.length], bz = F[(2 * k + 3) % F.length], L = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.round(L / 3));
      for (let t = 0; t < m; t++) {
        const x = ax + (bx - ax) * t / m, z = az + (bz - az) * t / m;
        if (onWay(x, z, 0.6) || !past(x, z, 3)) { last = null; continue; }
        const y = nrGround(x, z), g = scen.get(x, z);
        box(g, x, y - 0.3, z, 0.08, 2.1, 0.08, 0, GALV, GALV, true); st.posts++;
        if (last) for (const h of [0.45, 1.0, 1.55]) beam(g, [last[0], last[1] + h, last[2]], [x, y + h, z], 0.012, WIRE);
        last = [x, y, z];
        if (st.posts % 2 === 0) keep(x, z, 1.4);
      }
    }

    // the gates: two tube leaves, open back along the road's edges
    for (let k = 0; k < GATES.length; k += 3) {
      const x = GATES[k], z = GATES[k + 1], h = GATES[k + 2] * Math.PI / 180, ex = Math.cos(h), ez = Math.sin(h), nx = -ez, nz = ex, g = scen.get(x, z), y0 = nrGround(x, z), w = 2.0;
      for (const sd of [-1, 1]) {
        const px = x + nx * sd * (w + 0.25), pz = z + nz * sd * (w + 0.25);
        box(g, px, y0 - 0.3, pz, 0.12, 2.1, 0.12, h, GALV, GALV, true);
        const q = (a, yy) => [px + ex * a * w * 0.98, y0 + yy, pz + ez * a * w * 0.98];
        for (const yy of [0.25, 0.95, 1.6]) beam(g, q(0.03, yy), q(1, yy), 0.025, GALV);
        box(g, px + ex * w * 0.98, y0 + 0.2, pz + ez * w * 0.98, 0.05, 1.45, 0.05, h, GALV, GALV, true);   // (the leaf's far stile)
        CR.avoid(px, pz, 2.5);
      }
      keep(x, z, w + 2); st.gates++;
    }

    for (let k = 0; k < later.length; k += 3) exclPush(later[k], later[k + 1], later[k + 2]);
    tiles.forEach((T, s) => {
      const mat = new THREE.MeshLambertMaterial({ map: s ? tex.asphalt : o.out && o.out.season === 'rb-winter' ? tex.makadam : tex.sand, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 });
      for (const rb of T.values()) { if (rb.empty) continue; const m = new THREE.Mesh(rb.geometry(), mat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'roadside-ways'; root.add(m); st.meshes++; }
    });
    return st;
  }
})();
