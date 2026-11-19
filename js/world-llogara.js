/* =========================================================================
   WORLD — Llogara, Albania (docs/proge/llogara.md): the old road over the Llogara Pass above the Ionian Sea, built by the shared world of the
   mountain passes (js/world-prelaz.js, buildPrelaz) with a look of its own (PL_LOOK.llogara) and its own landmarks (L.pre, L.extra): the
   black pines along the road and lone ones on the open top and the south face (their own instanced trees, among the shared builder's firs of
   the forest), the concrete bunkers of the old defences, the fountains of the two springs by the road, the monument above the pass (a shape
   only), the wayside shrine, the guidepost, and at the line the paragliders' launch: its windsock, the wings laid out on the grass, a few in
   the air over the slope (World.update: out.dyn.ext). Places from OpenStreetMap (ODbL 1.0); all generic: no names, letters or signs
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK) return;
  const API = World.api;
  const { GB, IChunks, TAU, box, caGround, caSlope, clamp, cone, cyl, gable, ico, lerp, ouRod, rng, vary, vrDist, vrFar, vrLC, vrNear } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ---- the look: the Ceraunian Mountains in summer: the forest of black pine and fir on the north side, the bare grey limestone of the south
     face in ribs and screes with the maquis's dark clumps and the dry grass going gold between them, the sea a kilometre below; Albania's road
     markings (white, the centre line dashed 4 m / 8 m) and signs (the red chevrons, the warning triangles) ---- */
  const LOOK = API.PL_LOOK.llogara = {
    seed: 4820, board: 'PARKU KOMBËTAR I LLOGARASË', sub: 'VLORË', banner: ['QAFA E LLOGARASË', '1.027 M · 7 SERPENTINA'],
    grass: [0.44, 0.46, 0.27], grassDry: [0.56, 0.52, 0.37], grassLush: [0.34, 0.45, 0.22], shrub: [0.18, 0.25, 0.13],
    rock: [0.62, 0.61, 0.58], rockWarm: [0.66, 0.62, 0.56], lichen: [0.46, 0.46, 0.41], scree: [0.57, 0.56, 0.53],
    sat: 0.45, satV: 1.0, snowLine: 9000, snowC: [1.0, 1.02, 1.06],
    rockCols: [[0.66, 0.64, 0.6], [0.72, 0.7, 0.65], [0.58, 0.57, 0.54], [0.76, 0.73, 0.68], [0.62, 0.59, 0.54], [0.54, 0.54, 0.52]],   // (the limestone: pale grey, a little warm, weathered)
    centre: [0.95, 0.95, 0.92], dash: [4, 8], solidNear: 70,
    chev: ['#d8261c', '#ffffff'], warn: 'tri', rail: 'steel', shoulder: [0.58, 0.56, 0.52],
    fans: [[0.86, 0.1, 0.1], [0.1, 0.1, 0.12], [0.95, 0.95, 0.95], [0.98, 0.82, 0.14], [0.14, 0.32, 0.62], [0.2, 0.5, 0.32], [0.95, 0.5, 0.14], [0.55, 0.62, 0.7]],
    cars: [[0.9, 0.9, 0.88], [0.72, 0.73, 0.74], [0.12, 0.12, 0.14], [0.16, 0.2, 0.32], [0.6, 0.12, 0.1], [0.42, 0.43, 0.45]],
    roofs: [[0.62, 0.28, 0.18], [0.55, 0.24, 0.16], [0.36, 0.36, 0.36], [0.48, 0.22, 0.15]],
    sheep: 1, portal: 0,
    // (the far slopes: the dry grass and the maquis low down, the pine forest to ~1,300 m, bare limestone from ~1,300-1,700 m on the ridges;
    // the sea: wet, the far land's water, a deep blue where the shared far view takes a look's own (irFar))
    far: { lo: [0.5, 0.48, 0.32], hi: [0.64, 0.62, 0.57], dw: [0.22, 0.28, 0.16], snow: 9000, tree: [1450, 1200], fc: [0.17, 0.24, 0.13], dwb: [0, 120, 1500, 1200], rk: [1300, 1750], wet: [0.04, 0.22, 0.42] },
  };

  /* ---- the places of the landmarks (OpenStreetMap, game metres: x east, z south from the start line) ---- */
  const BUNKERS = [[516.8, 816.0], [510.0, 826.3], [478.1, 858.7], [1504.5, 1695.8]];   // (the concrete pillboxes in the pines below the pass and on the south face)
  const FOUNTAINS = [[67.6, 171.8], [219.9, 380.7]];   // (the water point by the first hairpins, the spring by the fifth)
  const MONUMENT = [1148.0, 1210.7], SHRINE = [1463.7, 1681.2], GUIDE = [1018.6, 1094.4];
  const LAUNCH = [1213.1, 2099.3], SOCK = [1226.0, 2079.0];   // (the paragliders' launch: the grass below the viewpoint at the line, the windsock at its top)
  const WINGS = [[1208.0, 2096.0, 0.4], [1226.0, 2104.0, -0.3]];   // (the wings laid out on the grass: their middles, the way their span lies)
  const marks = [];   // (the build under way: [what, x, z, rot] where each landmark stands)

  // a place by the road beyond its barrier: the map's point, moved out along the road's normal when it lies within the road's room (o: metres
  // beyond the barrier); [x, z, the road's heading there, the side]
  function besideRoad(x0, z0, o) {
    const n = vrNear(x0, z0); let x = x0, z = z0; if (n.i < 0) return [x, z, 0, 1];
    const i = n.i, sd = n.lat >= 0 ? 1 : -1, bar = sd > 0 ? T.br[i] : T.bl[i];
    if (Math.abs(n.lat) < bar + o) { const to = sd * (bar + o); x += T.nx[i] * (to - n.lat); z += T.nz[i] * (to - n.lat); }
    return [x, z, T.hd[i], sd];
  }

  /* ---- before the terrain: the landmarks' room (no trees, rocks or people there) ---- */
  LOOK.pre = function ({ exclPush }) {
    marks.length = 0;
    for (const [x0, z0] of BUNKERS) { const [x, z, hd, sd] = besideRoad(x0, z0, 3.5); marks.push(['bunker', x, z, hd, sd]); exclPush(x, z, 3.2); }
    for (const [x0, z0] of FOUNTAINS) { const [x, z, hd, sd] = besideRoad(x0, z0, 1.6); marks.push(['fountain', x, z, hd, sd]); exclPush(x, z, 2.6); }
    { const [x, z, hd, sd] = besideRoad(MONUMENT[0], MONUMENT[1], 3.0); marks.push(['monument', x, z, hd, sd]); exclPush(x, z, 4.5); }
    { const [x, z, hd, sd] = besideRoad(SHRINE[0], SHRINE[1], 1.2); marks.push(['shrine', x, z, hd, sd]); exclPush(x, z, 1.6); }
    { const [x, z, hd, sd] = besideRoad(GUIDE[0], GUIDE[1], 1.4); marks.push(['guide', x, z, hd, sd]); exclPush(x, z, 1.4); }
    exclPush(LAUNCH[0], LAUNCH[1], 26); exclPush(SOCK[0], SOCK[1], 3);
  };

  /* ---- the black pine in the soft look of the game's trees (Drevesa A, docs/drevesa-a.md: AB, aPuff, aTrunk): a straight trunk bare to
     two thirds of its height under a broad, flat-topped crown of dark clumps, wider than it is tall (unit height 1; the instances scale and
     tint it; 105 faces) ---- */
  function pineGeo() {
    const b = new API.AB(), R = rng(4827), col = [0.1, 0.19, 0.11];
    API.aTrunk(b, 0, -0.02, 0, 0.026, 0.86, 5, [0.36, 0.3, 0.25]);
    for (const [x, y, z, r, sy] of [[0, 0.9, 0, 0.3, 0.4], [0.21, 0.8, 0.07, 0.22, 0.46], [-0.22, 0.82, -0.06, 0.23, 0.44], [0.05, 0.75, -0.21, 0.2, 0.48], [-0.07, 0.73, 0.2, 0.19, 0.48]])
      API.aPuff(b, x, y, z, r, sy, vary(col, R, 0.08), R, 0.3, 0.55, 1.15);
    return b.geometry();
  }

  /* ---- the maquis of the south face: a low, dense bush of kermes oak and juniper in two or three dark clumps (unit height 1; 60 faces) ---- */
  function bushGeo() {
    const b = new API.AB(), R = rng(4829), col = [0.17, 0.23, 0.11];
    for (const [x, y, z, r, sy] of [[0, 0.46, 0, 0.42, 0.6], [0.34, 0.34, 0.1, 0.3, 0.62], [-0.3, 0.36, -0.12, 0.32, 0.6]])
      API.aPuff(b, x, y, z, r, sy, vary(col, R, 0.1), R, 0.35, 0.55, 1.12, -0.5);
    return b.geometry();
  }

  /* ---- a paraglider: the wing an arch of nine cells with its lower face, the pilot in the harness below (one draw for all: instanced, the
     instances tint the wing; x the way it flies) ---- */
  function wingGeo() {
    const g = new GB(), cells = 9, span = 8.6, chord = 2.5, rise = 2.2, pil = [0.16, 0.16, 0.18], up = (u) => rise * Math.cos(u * Math.PI * 0.42);
    for (let k = 0; k < cells; k++) {
      const u0 = k / cells * 2 - 1, u1 = (k + 1) / cells * 2 - 1, z0 = u0 * span / 2, z1 = u1 * span / 2, y0 = up(u0), y1 = up(u1), c = k % 2 ? [1, 1, 1] : [0.86, 0.86, 0.86];
      const A = [-chord / 2, y0, z0], B = [chord / 2, y0, z0], C = [chord / 2, y1, z1], D = [-chord / 2, y1, z1];
      g.quadO(A, B, C, D, c, [0, -6, 0]); g.quadO(A, D, C, B, c, [0, 9, 0]);   // (both faces)
    }
    box(g, 0, -6.8, 0, 0.6, 0.9, 0.5, 0, pil);   // (the pilot in the harness, 6-7 m under the wing)
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }

  /* ---- the landmarks and the pines, after the rest of the pass is built ---- */
  LOOK.extra = function ({ scen, root, out, P, excluded, matV }) {
    const RL = rng(LOOK.seed + 71), G = (x, z) => caGround(x, z), sStart = T.startS, sFin = T.finishS;
    const st = { pines: 0, bushes: 0, bunkers: 0, fountains: 0, monuments: 0, shrines: 0, guideposts: 0, wings: 0, gliders: 0, sea: 0 };
    const con = [0.62, 0.61, 0.58], conD = [0.5, 0.49, 0.46], stone = [0.7, 0.68, 0.62], dark = [0.06, 0.06, 0.07];
    for (const [what, x, z, hd, sd] of marks) {
      const g = scen.get(x, z), y = G(x, z), c = Math.cos(hd), s = Math.sin(hd), nx = -s * sd, nz = c * sd;   // (nx, nz: the way from the road out to it)
      if (what === 'bunker') {   // a pillbox of the old defences: a low dome of concrete on a thick ring, its slit facing the road
        const r = 1.55, cv = vary(con, RL, 0.05);
        cyl(g, x, y - 0.5, z, r + 0.15, 0.75, 12, conD, null, r + 0.1);
        cyl(g, x, y + 0.25, z, r + 0.1, 0.4, 12, cv, null, r - 0.15);
        cyl(g, x, y + 0.65, z, r - 0.15, 0.32, 12, cv, null, r - 0.6);
        cyl(g, x, y + 0.97, z, r - 0.6, 0.22, 12, cv, cv, 0.05);
        const sx = x - nx * (r - 0.05), sz = z - nz * (r - 0.05);   // (the firing slit: a dark band on the road's side)
        box(g, sx, y + 0.42, sz, 1.1, 0.16, 0.3, hd, dark);
        st.bunkers++;
      } else if (what === 'fountain') {   // the fountain of a spring: a stone wall with a pale coping, a steel spout, a trough at its foot
        const wv = vary(stone, RL, 0.05), ox = x + nx * 0.4, oz = z + nz * 0.4;
        box(g, ox, y - 0.4, oz, 2.2, 2.0, 0.5, hd, wv, [0.78, 0.76, 0.72]);
        box(g, ox, y + 1.6, oz, 2.4, 0.12, 0.62, hd, [0.8, 0.79, 0.75]);
        ouRod(g, [x + nx * 0.15, y + 0.95, z + nz * 0.15], [x - nx * 0.25, y + 0.92, z - nz * 0.25], 0.035, [0.55, 0.57, 0.6], 4);
        box(g, x - nx * 0.25, y - 0.3, z - nz * 0.25, 1.6, 0.75, 0.6, hd, [0.62, 0.61, 0.57], [0.16, 0.24, 0.27]);
        st.fountains++;
      } else if (what === 'monument') {   // the monument above the pass: a stele of pale stone on a stepped plinth, a bronze panel without words
        for (let k = 0; k < 3; k++) box(g, x, y - 0.4 + k * 0.3, z, 4.2 - k * 1.0, 0.7, 3.2 - k * 0.8, hd, vary([0.6, 0.59, 0.56], RL, 0.03));
        box(g, x, y + 0.6, z, 1.3, 4.6, 0.7, hd, [0.82, 0.8, 0.76], [0.86, 0.84, 0.8]);
        box(g, x - nx * 0.37, y + 2.2, z - nz * 0.37, 0.8, 1.2, 0.04, hd, [0.42, 0.32, 0.2]);
        st.monuments++;
      } else if (what === 'shrine') {   // a wayside shrine: a small white house with a glass front on a steel post
        cyl(g, x, y - 0.2, z, 0.04, 1.3, 5, [0.6, 0.61, 0.63]);
        box(g, x, y + 1.1, z, 0.5, 0.48, 0.42, hd, [0.92, 0.91, 0.88]);
        box(g, x - nx * 0.215, y + 1.18, z - nz * 0.215, 0.3, 0.3, 0.02, hd, [0.2, 0.24, 0.28]);
        gable(g, x, y + 1.58, z, 0.62, 0.54, 0.22, hd + Math.PI / 2, [0.55, 0.24, 0.16], [0.92, 0.91, 0.88]);
        st.shrines++;
      } else if (what === 'guide') {   // the guidepost: a timber post with two blank arrow boards
        box(g, x, y - 0.2, z, 0.14, 2.6, 0.14, hd, [0.42, 0.3, 0.2]);
        box(g, x + c * 0.45, y + 2.0, z + s * 0.45, 0.9, 0.22, 0.04, hd, [0.5, 0.36, 0.22]);
        box(g, x - c * 0.4, y + 1.65, z - s * 0.4, 0.8, 0.22, 0.04, hd, [0.5, 0.36, 0.22]);
        st.guideposts++;
      }
      out.marks[what] = (out.marks[what] || 0) + 1;
    }

    // the paragliders' launch at the line: the windsock on its pole at the top of the grass (the wind up the slope from the sea, the sock
    // streaming inland), two wings laid out on the grass, ready
    {
      const [x, z] = SOCK, y = G(x, z), g = scen.get(x, z), wa = Math.atan2(-0.6, 0.8), ux = Math.cos(wa), uz = Math.sin(wa);   // (the sock's way: to the north-east)
      cyl(g, x, y - 0.3, z, 0.05, 5.6, 5, [0.92, 0.92, 0.9], [0.92, 0.92, 0.9]);
      const R0 = 0.36, R1 = 0.16, Ls = 2.2, n = 8, bands = 5, y0 = y + 5.0;
      for (let b = 0; b < bands; b++) { const t0 = b / bands, t1 = (b + 1) / bands, r0 = lerp(R0, R1, t0), r1 = lerp(R0, R1, t1), d0 = t0 * Ls, d1 = t1 * Ls, sag0 = t0 * t0 * 0.35, sag1 = t1 * t1 * 0.35, col = b % 2 ? [0.96, 0.96, 0.94] : [0.95, 0.42, 0.1];
        for (let k = 0; k < n; k++) { const a0 = k / n * TAU, a1 = (k + 1) / n * TAU, P0 = (r, d, sg, a) => [x + ux * d - uz * Math.cos(a) * r, y0 - sg + Math.sin(a) * r, z + uz * d + ux * Math.cos(a) * r];
          const A = P0(r0, d0, sag0, a0), B = P0(r1, d1, sag1, a0), C = P0(r1, d1, sag1, a1), D = P0(r0, d0, sag0, a1), mid = [x + ux * (d0 + d1) / 2, y0 - (sag0 + sag1) / 2, z + uz * (d0 + d1) / 2];
          g.quadO(A, B, C, D, col, mid); g.quadO(A, D, C, B, col, [mid[0] + Math.cos((a0 + a1) / 2) * 3, mid[1] - Math.sin((a0 + a1) / 2) * 3, mid[2]]); } }
      out.marks.windsock = [x, z];
      const WC = [[0.92, 0.18, 0.14], [0.98, 0.8, 0.12], [0.16, 0.36, 0.78], [0.95, 0.95, 0.95]];
      WINGS.forEach(([cx, cz, ang], k) => {   // a wing laid out: an arc of cells on the grass, its trailing edge towards the slope's top
        const gw = scen.get(cx, cz), cells = 9, span = 9, chord = 2.4, ca = Math.cos(ang), sa = Math.sin(ang), c1 = WC[k % WC.length], c2 = WC[(k + 2) % WC.length];
        for (let q = 0; q < cells; q++) { const u0 = q / cells * 2 - 1, u1 = (q + 1) / cells * 2 - 1, bow = (u) => -1.6 * (1 - u * u), at = (u, v) => { const px = cx + ca * u * span / 2 - sa * (v + bow(u)), pz = cz + sa * u * span / 2 + ca * (v + bow(u)); return [px, G(px, pz) + 0.06, pz]; };
          const col = q % 2 ? c1 : c2; gw.quadUp(at(u0, -chord / 2), at(u1, -chord / 2), at(u1, chord / 2), at(u0, chord / 2), [col, col, col, col]); }
        st.wings++;
      });
    }

    // the paragliders in the air over the slope below the launch: each circling its own thermal, slowly drifting round, 60-160 m above the
    // ground (World.update: out.dyn.ext)
    {
      const im = new THREE.InstancedMesh(wingGeo(), new THREE.MeshLambertMaterial({ vertexColors: true }), 3), col = new THREE.Color();
      const WC = [[0.92, 0.2, 0.15], [0.98, 0.78, 0.14], [0.2, 0.42, 0.85]], GL = [];
      for (let k = 0; k < 3; k++) {
        const a = -0.3 + k * 0.9, d = 220 + k * 110, cx = LAUNCH[0] - 120 + Math.sin(a) * d * 0.6, cz = LAUNCH[1] + Math.cos(a) * d;
        let top = -1e9; for (let q = 0; q < 8; q++) { const b = q / 8 * TAU, r = 80 + k * 15; top = Math.max(top, vrFar(cx + Math.cos(b) * r, cz + Math.sin(b) * r)); }
        GL.push({ cx, cz, r: 80 + k * 15, y: Math.max(top + 45, G(LAUNCH[0], LAUNCH[1]) + 40 + k * 35), w: (k % 2 ? -1 : 1) * TAU / (46 + k * 9), ph: k * 2.1 });
        col.setRGB(WC[k][0], WC[k][1], WC[k][2]); im.setColorAt(k, col);
      }
      im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; im.matrixAutoUpdate = false; im.name = 'paragliders'; root.add(im);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
      const fly = (t) => { for (let k = 0; k < GL.length; k++) { const p = GL[k], a = p.ph + t * p.w, x = p.cx + Math.cos(a) * p.r, z = p.cz + Math.sin(a) * p.r;
        e.set(0, -a - (p.w > 0 ? Math.PI / 2 : -Math.PI / 2), (p.w > 0 ? 1 : -1) * 0.22, 'YXZ'); q.setFromEuler(e); v.set(x, p.y + Math.sin(t * 0.13 + k) * 6, z); m4.compose(v, q, one); im.setMatrixAt(k, m4); }
        im.instanceMatrix.needsUpdate = true; };
      fly(0); if (im.instanceColor) im.instanceColor.needsUpdate = true; st.gliders = GL.length;
      const prev = out.dyn.ext; out.dyn.ext = (t, car, cam) => { if (prev) prev(t, car, cam); fly(t); };
    }

    // the black pines (instanced per 96 m chunk): along the road in two rows, many in the forest among the firs, lone ones on the open top
    // round the pass, on the south face's grass and screes and among the houses; none on the rock faces, the steepest slopes or in the
    // landmarks' room
    {
      const tp = new IChunks(pineGeo(), matV, 96), RP = rng(LOOK.seed + 63), dens = Math.min(1, LOD.dens != null ? LOD.dens : 1);
      const pass = sStart + 1720, sp = 6.5 / Math.sqrt(dens);
      for (let s = Math.max(4, sStart - 140); s < Math.min(T.len - 4, sFin + 190); s += sp) {
        const i = T.idx(s);
        for (const side of [-1, 1]) for (const [o0, o1] of [[4.5, 18], [18, 44]]) {
          const o = (side > 0 ? T.br[i] : T.bl[i]) + o0 + RP() * (o1 - o0), x = T.px[i] + T.nx[i] * side * o + (RP() - 0.5) * 4, z = T.pz[i] + T.nz[i] * side * o + (RP() - 0.5) * 4, r = RP(), r2 = RP(), r3 = RP();
          const c = vrLC(x, z), top = Math.abs(s - pass) < 700 ? 1 : 0;
          const p = c === 1 ? 0.42 : c === 3 ? 0.16 : c === 0 ? (top ? 0.12 : 0.04) : c === 2 ? 0.08 : c === 7 ? 0.03 : 0;
          if (r > p) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 3.2) continue;
          if (excluded(x, z) || caSlope(x, z) > 0.95) continue;
          const hgt = (c === 1 ? 13 + r2 * 9 : 8 + r2 * 8), wid = hgt * (0.55 + r3 * 0.2);
          tp.add(x, G(x, z) - 0.2, z, RP() * TAU, wid, hgt, [0.88 + r3 * 0.22, 0.92 + r2 * 0.16, 0.9 + r * 0.14]); st.pines++;
        }
      }
      tp.addTo(root, true);
    }

    // the maquis: the dark bushes that speckle the south face's grass and limestone screes from the pass down to the line and beyond it (and
    // the open top round the pass), in three bands out from the barrier; none on the rock faces, on the steepest slopes or in the landmarks' room
    {
      const tb = new IChunks(bushGeo(), matV, 96), RB = rng(LOOK.seed + 65), dens = Math.min(1, LOD.dens != null ? LOD.dens : 1), sp = 2.7 / Math.sqrt(dens);
      for (let s = sStart + 1480; s < Math.min(T.len - 4, sFin + 190); s += sp) {
        const i = T.idx(s);
        for (const side of [-1, 1]) for (const [o0, o1] of [[3.5, 14], [14, 34], [34, 64]]) {
          const o = (side > 0 ? T.br[i] : T.bl[i]) + o0 + RB() * (o1 - o0), x = T.px[i] + T.nx[i] * side * o + (RB() - 0.5) * 3, z = T.pz[i] + T.nz[i] * side * o + (RB() - 0.5) * 3, r = RB(), r2 = RB(), r3 = RB();
          const c = vrLC(x, z), p = c === 7 ? 0.56 : c === 2 ? 0.7 : c === 0 ? 0.4 : c === 3 ? 0.1 : c === 1 ? 0.08 : 0;
          if (r > p) continue;
          const nn = vrNear(x, z); if (nn.i >= 0 && nn.dd < 2.6) continue;
          if (excluded(x, z) || caSlope(x, z) > 1.1) continue;
          const hgt = 0.8 + r2 * r2 * 1.6, wid = hgt * (1.3 + r3 * 0.7);
          tb.add(x, G(x, z) - 0.15, z, RB() * TAU, wid, hgt, [0.86 + r3 * 0.26, 0.9 + r2 * 0.2, 0.86 + r * 0.2]); st.bushes++;
        }
      }
      tb.addTo(root, false);
    }

    // the sea: the far view's water (the Ionian Sea from the coast out to the edge of its grid, irFar) in the sea's own blue instead of the
    // grey-green of the cirques' tarns the shared far view paints every wet node (where it paints them its own: unchanged), once, at the first
    // update (irFar is built after this)
    {
      const WET = new Float32Array([0.18, 0.27, 0.3]), to = LOOK.far.wet, prev = out.dyn.ext;
      let done = false;
      out.dyn.ext = (t, car, cam) => {
        if (prev) prev(t, car, cam);
        if (done || !out.dyn.irFar) return; done = true;
        const a = out.dyn.irFar.mesh.geometry.attributes.color, c = a.array; let n = 0;
        for (let k = 0; k < c.length; k += 3) if (c[k] === WET[0] && c[k + 1] === WET[1] && c[k + 2] === WET[2]) { c[k] = to[0]; c[k + 1] = to[1]; c[k + 2] = to[2]; n++; }
        if (n) a.needsUpdate = true; st.sea = n;
      };
    }
    out.llogara = st;   // (what was built: the tests)
  };

  World.ext.llogara = (scene, tex, opts) => API.buildPrelaz(scene, tex, opts, LOOK);
})();
