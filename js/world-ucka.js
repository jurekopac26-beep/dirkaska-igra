/* =========================================================================
   WORLD — Učka, Hrvaška (theme 'ucka'): the data-driven builder of the short roads (World.gore, js/world-gore.js) with this road's style; its own
   things in S.extra: the round stone viewing tower on the summit (Vojak), the radar's white dome, the masts of the transmitters (generic),
   and the view beyond the corridor (def.far: the Kvarner bay and its islands, the Istrian hills, Velebit far to the south-east), drawn on the
   camera's far shell as Mauna Kea's (maFarUpdate, World.update). The tower only from the outside, as OpenStreetMap and the elevation model
   give it (its round footprint ~10 m across, ~6 m to the viewing platform, the battlement round it): no inscriptions, plaques or names.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.gore || !World.api) return;
  const API = World.api;
  const { TAU, box, clamp, lerp, rng, rock, rpHash, sstep, vrGround, vrNear } = API;

  const TOWER = [-100.4, 594.4], DOME = [-57.5, 397.9];   // (track frame: OpenStreetMap's tower, ~107 m past the finish, and the radar's dome)
  const MASTS = [[11.1, 295.5, 60, 'lattice'], [-4.3, 287.7, 32, 'pole'], [-59.0, 468.6, 22, 'pole']];   // (the transmitters' masts: x, z, height)

  // a beam from a to b (4 sides, w across): the masts' legs and braces
  function beam(g, a, b, w, col) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1, d = [dx / L, dy / L, dz / L];
    const up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let u = [d[1] * up[2] - d[2] * up[1], d[2] * up[0] - d[0] * up[2], d[0] * up[1] - d[1] * up[0]]; const ul = Math.hypot(...u); u = u.map(v => v / ul * w / 2);
    const v = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
    const P = (p, su, sv) => [p[0] + u[0] * su + v[0] * sv, p[1] + u[1] * su + v[1] * sv, p[2] + u[2] * su + v[2] * sv];
    const A = [P(a, 1, 1), P(a, -1, 1), P(a, -1, -1), P(a, 1, -1)], B = [P(b, 1, 1), P(b, -1, 1), P(b, -1, -1), P(b, 1, -1)], mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    for (let k = 0; k < 4; k++) g.quadO(A[k], A[(k + 1) % 4], B[(k + 1) % 4], B[k], col, mid);
  }

  // the viewing tower: a rocky footing, a slightly battered round wall in courses of grey limestone (the stones staggered, each its own
  // shade), a narrow dark door towards the road, two small windows, the platform on top behind a battlement
  function tower(g, cx, cz, toward) {
    const R = rng(4411), y0 = Math.min(vrGround(cx, cz), vrGround(cx + 4, cz), vrGround(cx - 4, cz), vrGround(cx, cz + 4), vrGround(cx, cz - 4)) - 0.4;
    const NS = 28, CH = 0.46, NC = 13, H = NC * CH, r0 = 4.95, r1 = 4.6, rAt = (y) => lerp(r0, r1, y / H);
    const stone = () => { const t = 0.6 + R() * 0.14, w = (R() - 0.5) * 0.05; return [t + 0.02 + w, t + w * 0.5, t - 0.05]; };
    // the footing: weathered summit rocks round the base
    for (let k = 0; k < 11; k++) { const a = k / 11 * TAU + R() * 0.4, rr = r0 + 0.6 + R() * 1.6, x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
      rock(g, x, vrGround(x, z) - 0.35, z, 0.7 + R() * 0.9, 0.35 + R() * 0.45, 0.6 + R() * 0.8, R() * TAU, [0.6 + R() * 0.08, 0.59 + R() * 0.07, 0.55 + R() * 0.06], R, 0.25); }
    const ctr = (y) => [cx, y, cz], P = (a, y, r) => [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r];
    // a low round plinth (reaching down into the slope, so no gap shows on the lower side)
    { const rp = r0 + 0.3, pc = [0.52, 0.5, 0.46], pt = [0.57, 0.55, 0.51];
      for (let s = 0; s < NS; s++) { const a0 = s / NS * TAU, a1 = (s + 1) / NS * TAU;
        g.quadO(P(a0, y0 - 2.5, rp), P(a1, y0 - 2.5, rp), P(a1, y0 + 0.6, rp), P(a0, y0 + 0.6, rp), pc, ctr(y0));
        g.quadUp(P(a0, y0 + 0.6, r0 - 0.1), P(a1, y0 + 0.6, r0 - 0.1), P(a1, y0 + 0.6, rp), P(a0, y0 + 0.6, rp), [pt, pt, pt, pt]); } }
    // the wall in courses (y from the plinth up to the platform, then the battlement's lower part)
    const NCw = NC + 2;   // (the battlement's solid band: two more courses above the platform)
    const door = Math.atan2(toward[1] - cz, toward[0] - cx), dA = 0.95 / r0, wins = [[door + 2.1, 2.6], [door - 2.3, 4.0]];
    for (let c = 0; c < NCw; c++) {
      const ya = y0 + 0.6 + c * CH, yb = ya + CH, off = (c & 1) * 0.5;
      for (let s = 0; s < NS; s++) {
        const a0 = (s + off) / NS * TAU, a1 = (s + 1 + off) / NS * TAU, ra = rAt(ya - y0) + (R() - 0.5) * 0.03, rb = rAt(yb - y0) + (R() - 0.5) * 0.03;
        let col = stone(); const am = (a0 + a1) / 2, yl = ya - y0 - 0.6;
        const dd = Math.abs(Math.atan2(Math.sin(am - door), Math.cos(am - door)));
        if (dd < dA && yl < 2.0) col = [0.14, 0.12, 0.11];   // (the doorway)
        for (const [wa, wy] of wins) if (Math.abs(Math.atan2(Math.sin(am - wa), Math.cos(am - wa))) < 0.6 / r0 && yl > wy && yl < wy + 0.55) col = [0.12, 0.11, 0.1];
        g.quadO(P(a0, ya, ra), P(a1, ya, ra), P(a1, yb, rb), P(a0, yb, rb), col, ctr(ya));
      }
    }
    const yP = y0 + 0.6 + NC * CH, yT = y0 + 0.6 + NCw * CH, rT = rAt(yT - y0), rI = rT - 0.5;
    // a lintel over the door (a slightly paler stone slab)
    { const a = door, x = cx + Math.cos(a) * (r0 + 0.02), z = cz + Math.sin(a) * (r0 + 0.02); box(g, x, y0 + 0.6 + 2.0, z, 1.3, 0.28, 0.22, a + Math.PI / 2, [0.74, 0.72, 0.67]); }
    // the platform (a stone floor) and the battlement's inner face and top, the merlons on it
    const fl = [0.5, 0.49, 0.46];
    for (let s = 0; s < NS; s++) { const a0 = s / NS * TAU, a1 = (s + 1) / NS * TAU;
      g.triUp(ctr(yP), P(a0, yP, rI), P(a1, yP, rI), [fl, fl, fl]);
      g.quadO(P(a0, yP, rI), P(a1, yP, rI), P(a1, yT, rI), P(a0, yT, rI), stone(), P((a0 + a1) / 2, yP, rT + 2));   // (facing in)
      const tc = [0.66, 0.64, 0.6]; g.quadUp(P(a0, yT, rI), P(a1, yT, rI), P(a1, yT, rT), P(a0, yT, rT), [tc, tc, tc, tc]); }
    const NM = 14;
    for (let m = 0; m < NM; m++) { const a = (m + 0.25) / NM * TAU, rm = (rT + rI) / 2, x = cx + Math.cos(a) * rm, z = cz + Math.sin(a) * rm;
      box(g, x, yT - 0.02, z, TAU * rm / NM * 0.5, 0.55, 0.5, a + Math.PI / 2, stone(), [0.68, 0.66, 0.62], true); }
    // a plain steel railing round the platform inside the battlement (for the visitors)
    const rc = [0.3, 0.31, 0.32];
    for (let s = 0; s < 16; s++) { const a0 = s / 16 * TAU, a1 = (s + 1) / 16 * TAU, r = rI - 0.25; beam(g, P(a0, yT + 0.45, r), P(a1, yT + 0.45, r), 0.05, rc); beam(g, P(a0, yP, r), P(a0, yT + 0.45, r), 0.05, rc); }
    return yT + 0.55;
  }

  // the radar's dome: a pale concrete drum with a band of louvres, the white sphere on it (most of it above the drum), smooth
  function dome(g, cx, cz) {
    const y0 = Math.min(vrGround(cx - 6, cz), vrGround(cx + 6, cz), vrGround(cx, cz - 6), vrGround(cx, cz + 6)) - 0.3;
    const RD = 7.0, HD = 6.2, NS = 28, conc = [0.72, 0.71, 0.68], dark = [0.34, 0.35, 0.36];
    const P = (a, y, r) => [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r], ctr = (y) => [cx, y, cz];
    for (let s = 0; s < NS; s++) { const a0 = s / NS * TAU, a1 = (s + 1) / NS * TAU;
      g.quadO(P(a0, y0, RD), P(a1, y0, RD), P(a1, y0 + HD - 1.2, RD), P(a0, y0 + HD - 1.2, RD), s % 7 === 2 ? [0.62, 0.61, 0.58] : conc, ctr(y0 + 1));
      g.quadO(P(a0, y0 + HD - 1.2, RD), P(a1, y0 + HD - 1.2, RD), P(a1, y0 + HD - 0.5, RD), P(a0, y0 + HD - 0.5, RD), dark, ctr(y0 + 1));
      g.quadO(P(a0, y0 + HD - 0.5, RD), P(a1, y0 + HD - 0.5, RD), P(a1, y0 + HD, RD + 0.15), P(a0, y0 + HD, RD + 0.15), conc, ctr(y0 + 1));
      g.quadUp(P(a0, y0 + HD, RD + 0.15), P(a1, y0 + HD, RD + 0.15), P(a1, y0 + HD, 1), P(a0, y0 + HD, 1), [conc, conc, conc, conc]); }
    box(g, cx + Math.cos(0.6) * (RD + 0.05), y0 + 0.2, cz + Math.sin(0.6) * (RD + 0.05), 1.2, 2.3, 0.2, 0.6 + Math.PI / 2, [0.3, 0.32, 0.34]);   // (a steel door)
    const RS = 7.6, yc = y0 + HD + RS * 0.38, NL = 10, NA = 32, wh = [0.95, 0.95, 0.94];
    const lat0 = -Math.asin(0.38 / 1.0) + 0.02;   // (the sphere from where it meets the drum up)
    const Q = (la, lo) => [cx + Math.cos(la) * Math.cos(lo) * RS, yc + Math.sin(la) * RS, cz + Math.cos(la) * Math.sin(lo) * RS], N = (la, lo) => [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)];
    for (let i = 0; i < NL; i++) { const la0 = lerp(lat0, Math.PI / 2, i / NL), la1 = lerp(lat0, Math.PI / 2, (i + 1) / NL);
      for (let j = 0; j < NA; j++) { const lo0 = j / NA * TAU, lo1 = (j + 1) / NA * TAU, c = [wh[0] - (i % 2) * 0.012, wh[1] - (i % 2) * 0.012, wh[2] - (i % 2) * 0.01];
        g.quadON(Q(la0, lo0), Q(la0, lo1), Q(la1, lo1), Q(la1, lo0), N(la0, lo0), N(la0, lo1), N(la1, lo1), N(la1, lo0), ctr(yc), c, c, c, c); } }
  }

  // a transmitter's mast: a triangular steel lattice (legs, zig-zag braces, rings), the top bands red and white, panels near the top;
  // or a plain tubular pole with a few antennas
  function mast(g, x, z, H, kind) {
    const y0 = vrGround(x, z) - 0.3, steel = [0.62, 0.64, 0.66], red = [0.78, 0.2, 0.16], wht = [0.92, 0.92, 0.9];
    if (kind === 'pole') {
      for (let k = 0; k < 4; k++) { const ya = y0 + k * H / 4, yb = ya + H / 4; beam(g, [x, ya, z], [x, yb, z], 1.0 - k * 0.15, k === 3 ? red : steel); }
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + 0.3; box(g, x + Math.cos(a) * 0.75, y0 + H - 3.2, z + Math.sin(a) * 0.75, 0.35, 2.2, 0.12, a + Math.PI / 2, wht); }
      box(g, x, y0, z, 2.4, 0.4, 2.4, 0.2, [0.6, 0.6, 0.58]);
      return;
    }
    const NSg = Math.round(H / 3), wA = 2.2, wB = 1.0, leg = (k, y) => { const w = lerp(wA, wB, (y - y0) / H) / Math.sqrt(3), a = k / 3 * TAU + 0.4; return [x + Math.cos(a) * w, y, z + Math.sin(a) * w]; };
    for (let s = 0; s < NSg; s++) {
      const ya = y0 + s * H / NSg, yb = ya + H / NSg, col = s >= NSg - 4 ? ((s & 1) ? red : wht) : steel;
      for (let k = 0; k < 3; k++) { beam(g, leg(k, ya), leg(k, yb), 0.16, col);
        beam(g, leg(k, ya), leg((k + 1) % 3, yb), 0.06, col); beam(g, leg((k + 1) % 3, ya), leg(k, yb), 0.06, col);
        if (s % 2 === 0) beam(g, leg(k, yb), leg((k + 1) % 3, yb), 0.07, col); }
    }
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, yy = y0 + H - 7 - (k % 2) * 4; box(g, x + Math.cos(a) * 1.0, yy, z + Math.sin(a) * 1.0, 0.5, 2.0, 0.14, a + Math.PI / 2, wht); }
    beam(g, [x, y0 + H, z], [x, y0 + H + 6, z], 0.18, red);
    for (let k = 0; k < 3; k++) { const p = leg(k, y0); box(g, p[0], p[1] - 0.2, p[2], 0.8, 0.5, 0.8, 0, [0.6, 0.6, 0.58]); }
  }

  // the view beyond the corridor (def.far, tools/ucka/daljava.py): a polar grid of heights round the road's middle, out to the sea's
  // horizon at 140 km, lowered by the earth's curve; the sea flat at 0 m, the land coloured by its height (the macchia and the olive
  // groves by the coast, the beech forest up the mountains, the bare karst on the high ridges and on the islands' tops)
  function ucFar() {
    const T = API.T, FR = T && T.def && T.def.far; if (!FR) return null;
    const NA = FR.na, NR = FR.r.length, b = atob(FR.b64), sea = new Uint8Array(NR * NA);
    { let k = 0, on = 0; for (const n of FR.sea) { if (on) sea.fill(1, k, k + n); k += n; on ^= 1; } }
    const H = (k, a) => { a = ((a % NA) + NA) % NA; const q = k * NA + a; return sea[q] ? 0 : FR.lo[k] + b.charCodeAt(q) * FR.st[k]; };
    const dRoad = (x, z) => { let m = 1e18; for (let q = 0; q < T.N; q += 8) { const dx = x - T.px[q], dz = z - T.pz[q], d = dx * dx + dz * dz; if (d < m) m = d; } return Math.sqrt(m); };
    const [cx, cz] = FR.c, base = FR.base, re = FR.re, P0 = [], C = [], HZ = [], I = [], DR = new Float32Array(NR * NA);
    const nz = (k, a) => rpHash(k * 7 + 3, a * 13 + 1);
    for (let k = 0; k < NR; k++) for (let a = 0; a < NA; a++) {
      const az = a / NA * TAU, r = FR.r[k], x = cx + Math.sin(az) * r, z = cz - Math.cos(az) * r, h = H(k, a), s = sea[k * NA + a];
      const dr = r < 1800 ? dRoad(x, z) : r; DR[k * NA + a] = dr;
      P0.push(x, h - base - r * r / (2 * re), z);
      let c;
      if (s) { const sh = sstep(4000, 600, r) * 0.04; c = [0.14 + sh, 0.29 + sh, 0.39 + sh * 0.5]; }
      else {
        const q = nz(k, a), sl = Math.abs(H(k, a + 1) - H(k, a - 1)) / Math.max(30, r * TAU / NA);
        c = [0.36, 0.39, 0.24];                                                                    // (the coast: macchia, olive groves, villages)
        const f = sstep(150, 450, h); c = [lerp(c[0], 0.22, f), lerp(c[1], 0.31, f), lerp(c[2], 0.17, f)];   // (the woods)
        const kr = clamp(sstep(800, 1300, h) * 0.7 + sstep(0.35, 0.9, sl) * 0.5 + (q - 0.5) * 0.3, 0, 1); c = [lerp(c[0], 0.52, kr), lerp(c[1], 0.52, kr), lerp(c[2], 0.46, kr)];   // (the bare karst)
        const t = 0.93 + q * 0.14; c = c.map(v => v * t);
      }
      C.push(...c); HZ.push(sstep(900, 450, dr) * 0.45);
    }
    for (let k = 0; k + 1 < NR; k++) for (let a = 0; a < NA; a++) {
      const p = k * NA + a, q = k * NA + (a + 1) % NA, r = (k + 1) * NA + a, t = (k + 1) * NA + (a + 1) % NA;
      if ((DR[p] + DR[q] + DR[r] + DR[t]) / 4 < 255) continue;   // (under the corridor's own ground)
      I.push(p, q, r, q, t, r);   // (facing up)
    }
    const g = new THREE.BufferGeometry(), nv = P0.length / 3;
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P0), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
    g.setAttribute('aHz', new THREE.BufferAttribute(new Float32Array(HZ), 1)); g.setIndex(I); g.computeVertexNormals();
    // the projection onto the far shell (as Mauna Kea's maFar: no work per frame in JS; uR 0 = the nodes' own places)
    const U = { uHz: { value: new THREE.Color(0xc8d6e2) }, uR: { value: new THREE.Vector2(0, 0) }, uCam: { value: new THREE.Vector3() } }, m = new THREE.MeshLambertMaterial({ vertexColors: true, fog: false });
    m.onBeforeCompile = (sh) => { sh.uniforms.uHz = U.uHz; sh.uniforms.uR = U.uR; sh.uniforms.uCam = U.uCam;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aHz;\nuniform vec2 uR;\nuniform vec3 uCam;\nvarying float vHz;')
        .replace('#include <project_vertex>', [
          'vec3 maD = transformed - uCam; float maL = max( 1.0, length( maD ) );',
          'if ( uR.y > 0.0 ) { float maU = clamp( ( log( maL ) - 5.6348 ) / 6.5713, 0.0, 1.0 ); transformed = uCam + maD * ( ( uR.x + ( uR.y - uR.x ) * maU ) / maL ); }',   // (log 280 m .. log 200 km)
          'vHz = uR.y > 0.0 ? max( aHz, 0.1 + 0.62 * ( 1.0 - exp( -maL / 70000.0 ) ) ) : 0.4;',   // (hazed with the distance: the islands blue-grey, Velebit faint)
          '#include <project_vertex>'].join('\n'));
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uHz;\nvarying float vHz;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb = mix( gl_FragColor.rgb, uHz, vHz );'); };
    m.customProgramCacheKey = () => 'ucFar'; m.userData.noCloud = true;
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = -50; mesh.matrixAutoUpdate = false; mesh.name = 'ucFar';
    mesh.onBeforeRender = (r, sc, cam) => { if (sc && sc.fog) U.uHz.value.copy(sc.fog.color); if (cam && cam.isPerspectiveCamera && cam.far > 50 && U.on) { U.uR.value.set(cam.far * 0.7, cam.far - 4); U.uCam.value.setFromMatrixPosition(cam.matrixWorld); } else U.uR.value.set(0, 0); };
    return { mesh, U, nv };
  }

  const near = (p, x, z, r) => Math.hypot(x - p[0], z - p[1]) < r;
  World.ext.ucka = (scene, tex, opts) => World.gore.build(scene, tex, opts, {
    seed: 1818, snow: 'none',
    ground: { grass: [0.44, 0.5, 0.28], forest: [0.27, 0.3, 0.18], shrub: [0.38, 0.4, 0.24], built: [0.52, 0.52, 0.48], rock: [0.6, 0.59, 0.55], dry: [0.6, 0.56, 0.4] },
    road: { line: 'none' },
    trees: { kinds: ['broad'], forest: 0.45, open: 0.04, h: [12, 20] },   // (the beech forest on the mountain's top)
    skiers: 0, nets: false, snowbanks: false, lifts: false, poles: null,
    boards: { start: 'START', finish: 'FINISH', banner: 'HILL CLIMB', cp: '#1d4f8c', closed: 'ROAD CLOSED', gate: 'CLOSED' },
    animals: [],
    ownBld: (x, z) => near(TOWER, x, z, 9) || near(DOME, x, z, 11),
    extra: (ctx) => {
      const { scen, root, out } = ctx, T = API.T;
      const fin = T && T.px ? [T.px[T.N - 1], T.pz[T.N - 1]] : [-85.4, 488.1];
      const top = tower(scen.get(TOWER[0], TOWER[1]), TOWER[0], TOWER[1], fin);
      dome(scen.get(DOME[0], DOME[1]), DOME[0], DOME[1]);
      for (const [x, z, h, kind] of MASTS) { const n = vrNear(x, z); if (n.i >= 0 && n.dd < 3) continue; mast(scen.get(x, z), x, z, h, kind); }
      out.ucka = { tower: TOWER, top };
      const F = ucFar(); if (F) { F.mesh.visible = false; root.add(F.mesh); out.dyn.mkFar = F; }
    },
  });
})();
