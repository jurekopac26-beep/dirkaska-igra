/* =========================================================================
   WORLD — Longford (theme 'longford'): its own builder (World.ext.longford), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, IChunks, NRC, NRN, NRT, RB, TAU, atS, atSf, box, caCondors, clamp, cone, crH, crowdCtx, crowdFinish, crowdRun, crowdUV, cyl,
    gable, ico, lerp, nrDist, nrGCol, nrGrassTex, nrGround, nrLC, nrLCf, nrLump, nrNear, nrPrep, nrShade, nrSlope, nrTileGeo, nrTileOn,
    propFloorTable, rng, sstep, texAvg, tuftGeo, tuftWindMat, vary, waterMat, wrapS
  } = API;
  let T;   // (World's, for the build under way)
  API.sync.push(() => { ({ T } = API); });

  /* ================= LONGFORD (theme 'longford'): the road circuit by the town in Tasmania, as in the 1960s =================
     The Nordschleife's corridor terrain (nrPrep and the nr* helpers read def.dem and def.lc), the scenery its own: an old tar-sealed country
     road without kerbs or lines, gravel shoulders, post-and-rail fences along the paddocks, straw bales round the outside of the slow corners,
     timber railings on the two wooden bridges over the South Esk, the brick abutments under the railway viaduct and the garden walls in the
     town. The rivers (def.rivers) and the railway's embankment (def.rail) shape the ground (NR.pad); the railway runs over the old road on a
     viaduct of brick arches, over the South Esk on an iron girder bridge, and across the Tannery Straight at a level crossing. The town's
     Georgian brick houses (OSM footprints, more made up along its streets), farm homesteads, the circular water tower over the Pit Straight,
     the 1959 pits on the right of it behind a white line (the crews' benches, an open timber pit shed, the control tower, a scoreboard), a
     timber grandstand, spectators on the banks and in the town, the period's cars parked in the paddocks, sheep, hay, hedges, poplars, elms,
     willows along the rivers, telephone poles. Painted signs only (the game's own brands); no names of people, hotels, races or sponsors. */
  const LF_SHIRTS = [[0.94, 0.94, 0.92], [0.92, 0.91, 0.86], [0.56, 0.52, 0.42], [0.42, 0.44, 0.48], [0.2, 0.24, 0.36], [0.74, 0.7, 0.6], [0.6, 0.16, 0.14],
    [0.3, 0.42, 0.62], [0.86, 0.78, 0.5], [0.24, 0.36, 0.26], [0.95, 0.95, 0.94], [0.52, 0.36, 0.26]];   // the crowd of the 1960s: white shirts, khaki, grey and navy, a few colours
  const LF_BAN = [['START', '#f4f1e6', '#1a1a1a', '#b8261e'], ['FINISH', '#1a1a1a', '#f4f1e6', '#f4f1e6'], ['PITS', '#1d3b6e', '#f4f1e6', '#f4f1e6'], ['RAILWAY CROSSING', '#f4f1e6', '#1a1a1a', '#1a1a1a'],
    ['LONGFORD', '#20442c', '#f4ead2', '#d9b54a'], ['SLOW', '#f4f1e6', '#b8261e', '#b8261e']];
  function lfAtlas() {   // text boards (4 x 16 cells of 256 x 64, as rbAtlas): the banners and signs, the scoreboard's numbers 0-9 (white on black)
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const cell = (k, bg, fg, txt, px, stripe) => { const cx = (k % 4) * 256, cy = Math.floor(k / 4) * 64; x.fillStyle = bg; x.fillRect(cx, cy, 256, 64); if (stripe) { x.fillStyle = stripe; x.fillRect(cx, cy + 56, 256, 8); x.fillRect(cx, cy, 256, 4); }
      x.fillStyle = fg; x.font = '700 ' + px + 'px Georgia, "Times New Roman", serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, cx + 128, cy + 34, 240); };
    LF_BAN.forEach(([t, bg, fg, st], k) => cell(k, bg, fg, t, t.length > 10 ? 28 : 40, st));
    for (let k = 0; k < 10; k++) cell(8 + k, '#141414', '#f2f2ea', String(k), 50);
    // the period's painted signs on the fences (the game's own brands, Tex.SPONSORS), a cell each from 20 on
    Tex.SPONSORS.forEach(([t, bg, fg], k) => cell(20 + k, bg, fg, t, t.length > 10 ? 28 : 36, fg));
    ['300', '200', '100'].forEach((t, k) => cell(56 + k, '#f4f1e6', '#1a1a1a', t, 50, '#1a1a1a'));   // the boards counting down to a corner (black on white)
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  const LF_AT = { ban: 0, num: 8, ad: 20, dist: 56 };
  function lfTreeGeo(kind) {   // unit trees (height 1, instances scale them), soft shaded: 0 a Lombardy poplar, 1 an English elm or oak, 2 a weeping willow, 3 a
    // eucalypt, 4 a far broadleaf (one lump), 5 a far poplar (one spindle)
    const g = new GB(), R = rng(1960 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    const bk = [0.36, 0.32, 0.27], po = [0.28, 0.42, 0.16], el = [0.24, 0.36, 0.14], wi = [0.42, 0.52, 0.2], eu = [0.34, 0.42, 0.3], eb = [0.78, 0.76, 0.7];
    if (kind === 0) { cyl(g, 0, -0.02, 0, 0.022, 0.25, 4, bk, null, 0.016); ico(g, 0, 0.42, 0, 0.12, 2.6, po, R, 0.18); ico(g, 0.02, 0.74, 0.01, 0.08, 2.0, [po[0] * 1.08, po[1] * 1.06, po[2]], R, 0.2); }
    else if (kind === 1) { cyl(g, 0, -0.02, 0, 0.045, 0.42, 5, bk, null, 0.03);
      ico(g, 0, 0.62, 0, 0.32, 0.78, el, R, 0.24); nrLump(g, 0.17, 0.66, 0.1, 0.22, 0.85, [el[0] * 1.08, el[1] * 1.06, el[2]], R, 0.2); nrLump(g, -0.16, 0.72, -0.08, 0.2, 0.85, [el[0] * 0.92, el[1] * 0.94, el[2]], R, 0.2); }
    else if (kind === 2) { cyl(g, 0, -0.02, 0, 0.05, 0.36, 5, bk, null, 0.035);   // a willow: a broad round crown hanging down to the ground
      ico(g, 0, 0.5, 0, 0.42, 0.95, wi, R, 0.2); nrLump(g, 0.16, 0.62, 0.1, 0.24, 0.8, [wi[0] * 1.1, wi[1] * 1.06, wi[2]], R, 0.2); }
    else if (kind === 3) { cyl(g, 0, -0.02, 0, 0.03, 0.62, 5, eb, null, 0.018);   // a gum: a pale trunk, loose grey-green clumps high up
      for (const [x, y, z, r] of [[0.1, 0.66, 0.04, 0.17], [-0.12, 0.74, -0.06, 0.16], [0.02, 0.86, 0.1, 0.15], [-0.04, 0.95, -0.02, 0.12]]) ico(g, x, y, z, r, 0.62, eu, R, 0.3); }
    else if (kind === 4) ico(g, 0, 0.6, 0, 0.34, 0.85, el, R, 0.25);
    else ico(g, 0, 0.5, 0, 0.13, 3.4, po, R, 0.15);
    API.ROCK_SMOOTH = rs;
    for (let v = 0; v < g.P.length / 3; v++) { const y = g.P[v * 3 + 1], f = 0.76 + 0.44 * clamp((y - 0.3) / 0.65, 0, 1); g.C[v * 3] *= f; g.C[v * 3 + 1] *= f; g.C[v * 3 + 2] *= f * 0.97; }   // (the sun on the crown's top, the shade under it)
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function lfSheepGeo() {   // a sheep (1.3 m, facing +x): a woolly body, the dark face, four legs
    const g = new GB(), R = rng(1961), rs = API.ROCK_SMOOTH, wool = [0.9, 0.88, 0.8], dk = [0.16, 0.14, 0.13]; API.ROCK_SMOOTH = true;
    ico(g, 0, 0.62, 0, 0.42, 0.62, wool, R, 0.12); ico(g, 0.5, 0.72, 0, 0.16, 1.1, dk, R, 0.1);
    for (const [x, z] of [[0.25, 0.14], [0.25, -0.14], [-0.25, 0.14], [-0.25, -0.14]]) box(g, x, 0, z, 0.08, 0.42, 0.08, 0, dk, null, true);
    API.ROCK_SMOOTH = rs; const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function lfEagleGeo() {   // a wedge-tailed eagle gliding (2.2 m across, facing +x): dark brown, the wings' tips spread, the long wedge of the tail
    const g = new GB(), K = [0.2, 0.14, 0.1], Kl = [0.32, 0.24, 0.16], R = rng(1962);
    API.ROCK_SMOOTH = true; ico(g, 0, 0, 0, 0.17, 0.55, K, R, 0.1); API.ROCK_SMOOTH = false; box(g, 0.2, -0.04, 0, 0.18, 0.1, 0.12, 0, Kl);
    for (const sd of [-1, 1]) { const r0 = 0.1 * sd, r1 = 1.1 * sd, y1 = 0.14, A = [0.14, 0, r0], B = [-0.18, 0, r0], C = [-0.12, y1, r1], D = [0.12, y1, r1 * 0.97];
      g.quadO(A, B, C, D, K, [0, -1, sd * 0.9]); g.quadO(A, B, C, D, K, [0, 1, sd * 0.9]);
      for (let k = 0; k < 4; k++) { const x = 0.1 - k * 0.07; g.triO([x, y1, r1 * 0.96], [x - 0.06, y1, r1 * 0.96], [x - 0.01, y1 + 0.03, r1 + 0.16 * sd], K, [x, y1 - 1, r1]); } }
    for (const n of [-1, 1]) g.triO([-0.16, 0, -0.07], [-0.55, 0.01, -0.13 * n], [-0.55, 0.01, 0.13 * n], Kl, [-0.4, -n, 0]);
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  function lfGalahGeo() {   // a galah in flight (0.7 m across, facing +x): rose-pink below, grey wings and back
    const g = new GB(), PK = [0.86, 0.46, 0.52], GR = [0.66, 0.66, 0.68];
    box(g, 0, -0.04, 0, 0.3, 0.09, 0.09, 0, PK, GR); box(g, 0.17, -0.03, 0, 0.07, 0.07, 0.07, 0, [0.92, 0.72, 0.76]);
    for (const sd of [-1, 1]) { const A = [0.06, 0, 0.04 * sd], B = [-0.06, 0, 0.04 * sd], C = [-0.05, 0.05, 0.36 * sd], D = [0.04, 0.05, 0.34 * sd];
      g.quadO(A, B, C, D, GR, [0, -1, sd * 0.5]); g.quadO(A, B, C, D, PK, [0, 1, sd * 0.5]); }
    g.triO([-0.14, 0, -0.04], [-0.3, 0, 0], [-0.14, 0, 0.04], GR, [-0.2, -1, 0]); g.triO([-0.14, 0, -0.04], [-0.14, 0, 0.04], [-0.3, 0, 0], GR, [-0.2, 1, 0]);
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // Longford's moving details (World.update): the chimneys' smoke drifting with the wind, the dust off the shoulder behind the followed car, the flocks
  // of galahs in the paddocks by the road that take off as it comes past and settle again; no car: the smoke posed by t alone, the birds on the ground
  function lfFxUpdate(F, t, car) {
    const m4 = F.m4, q = F.q, v = F.v, sc = F.sc, e = F.e, dt = F.t == null ? 0 : clamp(t - F.t, 0, 0.1); F.t = t;
    let n = 0;
    const put = (M, k, x, y, z, yaw, s, roll) => { e.set(roll || 0, yaw, 0, 'YXZ'); q.setFromEuler(e); v.set(x, y, z); sc.set(s, s, s); m4.compose(v, q, sc); M.setMatrixAt(k, m4); };
    for (const S of F.src) for (let k = 0; k < 5; k++) { const ph = (t * 0.07 + k / 5 + S.ph) % 1, sz = (0.5 + ph * 2.4) * (1 - ph * ph * ph);   // the smoke: rises, spreads, thins out
      put(F.puffs, n++, S.x + F.wx * ph * 10, S.y + ph * 12, S.z + F.wz * ph * 10, ph * 3, sz); }
    if (car && car.q && dt > 0) { const sp = Math.hypot(car.x - F.cx, car.z - F.cz) / dt; F.cx = car.x; F.cz = car.z;
      if (sp > 9 && sp < 120 && Math.abs(car.q.d) > T.w + 0.15 && Math.abs(car.q.d) < T.w + 4 && t >= F.nd) { F.nd = t + 0.06; const D = F.dust[F.di]; F.di = (F.di + 1) % F.dust.length;
        D.x = car.x - Math.cos(car.h || 0) * 1.8; D.z = car.z - Math.sin(car.h || 0) * 1.8; D.y = car.roadY || 0; D.t0 = t; } }
    for (const D of F.dust) { const a = t - D.t0, ok = a >= 0 && a < 2.4, f = a / 2.4;   // the dust: a low brown cloud that spreads and settles
      put(F.puffs, n++, D.x + F.wx * a * 0.8, D.y + 0.4 + a * 0.5, D.z + F.wz * a * 0.8, a, ok ? (0.7 + a * 1.4) * (1 - f * f) : 0); }
    if (F.train) { const Tr = F.train, P = 260, u = (t % P) / P, ez = (x) => x * x * (3 - 2 * x);   // the train: out (0-40 %), a wait, back (50-90 %), a wait
      const f = u < 0.4 ? ez(u / 0.4) : u < 0.5 ? 1 : u < 0.9 ? 1 - ez((u - 0.5) / 0.4) : 0, head = lerp(Tr.a0, Tr.a1, f), moving = (u < 0.4 || (u >= 0.5 && u < 0.9)) ? 1 : 0, back = u >= 0.5 && u < 0.9 ? 1 : 0;
      const L0 = Tr.atRail(head); put(Tr.loco, 0, L0[0], L0[1], L0[2], L0[3], 1, 0); Tr.loco.instanceMatrix.needsUpdate = true;   // (the locomotive at the a1 end of the train, facing a1)
      for (let k = 0; k < 5; k++) { const p = Tr.atRail(head - (12.6 + k * 11) ); put(Tr.vans, k, p[0], p[1], p[2], p[3], 1, 0); } Tr.vans.instanceMatrix.needsUpdate = true;
      const cx = L0[0] + Math.cos(L0[3]) * 4.1, cz = L0[2] - Math.sin(L0[3]) * 4.1, dx = Math.cos(L0[3]) * (back ? -1 : 1), dz = -Math.sin(L0[3]) * (back ? -1 : 1);
      for (let k = 0; k < 10; k++) { const ph = (t * 0.45 + k / 10) % 1, sz = (0.5 + ph * 2.2) * (1 - ph * ph * ph);   // its smoke, trailing back along the train while it runs
        put(F.puffs, n++, cx - dx * ph * 16 * moving + F.wx * ph * 4, L0[1] + 3.3 + ph * (moving ? 3 : 8), cz - dz * ph * 16 * moving + F.wz * ph * 4, ph * 3, sz); } }
    F.puffs.instanceMatrix.needsUpdate = true;
    let b = 0;
    for (const L of F.flocks) {
      if (car && L.st === 0 && Math.hypot(car.x - L.x, car.z - L.z) < 60) { L.st = 1; L.t0 = t; }
      const f = L.st ? t - L.t0 : 0; if (f > 26) L.st = 0;
      for (const B of L.birds) {
        if (!L.st) { put(F.birds, b++, L.x + B.ox, L.y + 0.12, L.z + B.oz, B.yaw, 1.5, 0); continue; }   // (on the ground, pecking)
        const up = Math.min(1, f / 3) * (f > 21 ? Math.max(0, (26 - f) / 5) : 1), a = B.ph + f * 0.55, R = 18 + B.r * 8, away = Math.min(f, 5) * 7 * (f > 21 ? Math.max(0, (26 - f) / 5) : 1);
        const x = L.x + L.ax * away + Math.cos(a) * R * up + B.ox * (1 - up), z = L.z + L.az * away + Math.sin(a) * R * up + B.oz * (1 - up), y = L.y + 0.12 + up * (10 + B.r * 5);
        put(F.birds, b++, x, y, z, -(a + Math.PI / 2), 2.2, 0.35 * up * Math.sin(t * 9 + B.ph)); } }
    F.birds.instanceMatrix.needsUpdate = true;
  }
  function lfHouseGeo(kind) {   // unit buildings (instances scale them): 0 a brick cottage (11 x 7 m, one storey, a hipped iron roof, chimneys),
    // 1 a two-storey Georgian house (12 x 9 m, a hipped slate roof, a fanlit door, sash windows), 2 a shed (16 x 9 m, corrugated iron),
    // 3 a church (a nave and a square tower), 4 a weatherboard farm cottage under red iron
    const g = new GB(), BR = [0.6, 0.32, 0.22], BRd = [0.5, 0.27, 0.19], WH = [0.92, 0.9, 0.84], WIN = [0.14, 0.16, 0.18], CUR = [0.86, 0.8, 0.66], ROOF = kind === 0 ? [0.46, 0.2, 0.17] : [0.34, 0.36, 0.4];
    const hip = (L, D, y, h, col) => { const a = [-L / 2, y, -D / 2], b = [L / 2, y, -D / 2], c = [L / 2, y, D / 2], d = [-L / 2, y, D / 2], r0 = [-L / 2 + D / 2, y + h, 0], r1 = [L / 2 - D / 2, y + h, 0], inn = [0, y, 0], c2 = col.map(v => v * 0.9);
      g.quadO(a, b, r1, r0, col, inn); g.quadO(c, d, r0, r1, c2, inn); g.triO(b, c, r1, c2, inn); g.triO(d, a, r0, col, inn); };
    const windows = (L, D, y0, h, n, door) => { for (let k = 0; k < n; k++) { const x = -L / 2 + L * (k + 0.5) / n; if (door && k === (n >> 1)) { box(g, x, 0, D / 2 - 0.02, 1.0, 2.2, 0.08, 0, [0.2, 0.26, 0.2], null, true); continue; }
      box(g, x, y0 - 0.08, D / 2 - 0.03, 1.15, h + 0.16, 0.08, 0, WH, null, true); box(g, x, y0, D / 2 + 0.02, 0.95, h, 0.04, 0, WIN, null, true); box(g, x, y0 + h * 0.62, D / 2 + 0.035, 0.95, h * 0.3, 0.02, 0, CUR, null, true);
      box(g, x, y0 - 0.08, -D / 2 - 0.05, 1.15, h + 0.16, 0.08, 0, WH, null, true); box(g, x, y0, -D / 2 - 0.06, 0.95, h, 0.04, 0, WIN, null, true); box(g, x, y0 + h * 0.62, -D / 2 - 0.075, 0.95, h * 0.3, 0.02, 0, CUR, null, true); } };   // (the curtains drawn half across)
    if (kind === 0) { box(g, 0, -0.4, 0, 11, 3.6, 7, 0, BR, BR, true); hip(11.6, 7.6, 3.2, 2.4, ROOF); windows(11, 7, 1.0, 1.4, 5, true);
      for (const x of [-3.6, 3.6]) box(g, x, 3.6, 0, 0.7, 2.6, 0.9, 0, BRd, [0.18, 0.17, 0.16]); }
    else if (kind === 1) { box(g, 0, -0.4, 0, 12, 6.8, 9, 0, BR, BR, true); hip(12.4, 9.4, 6.4, 2.8, ROOF); windows(12, 9, 1.0, 1.6, 5, true); windows(12, 9, 3.9, 1.6, 5, false);
      box(g, 0, 6.2, 0, 12.1, 0.25, 9.1, 0, WH, WH, true);   // the cornice
      for (const x of [-4.2, 4.2]) box(g, x, 6.4, 0, 0.8, 3.4, 1.0, 0, BRd, [0.18, 0.17, 0.16]); }
    else if (kind === 2) { const IR = [0.6, 0.62, 0.64]; box(g, 0, -0.3, 0, 16, 4.3, 9, 0, IR, IR, true); gable(g, 0, 4.0, 0, 16.4, 9.6, 2.6, 0, [0.52, 0.54, 0.56], IR); box(g, 0, -0.3, 4.52, 4, 3.6, 0.06, 0, [0.22, 0.2, 0.18], null, true); }
    else if (kind === 3) { box(g, 0, -0.4, 0, 18, 6.4, 8, 0, [0.72, 0.62, 0.48], null, true); gable(g, 0, 6.0, 0, 18.4, 8.6, 4.6, 0, [0.34, 0.36, 0.4], [0.72, 0.62, 0.48]);
      box(g, -10.5, -0.4, 0, 4, 15, 4, 0, [0.7, 0.6, 0.46], [0.7, 0.6, 0.46]); cone(g, -10.5, 14.6, 0, 2.9, 6, 4, [0.34, 0.36, 0.4], [0.3, 0.32, 0.36], Math.PI / 4);
      for (let k = 0; k < 4; k++) { const x = -6 + k * 4; box(g, x, 2, 4.02, 0.9, 2.6, 0.06, 0, WIN, null, true); box(g, x, 2, -4.02, 0.9, 2.6, 0.06, 0, WIN, null, true); box(g, x, 3.75, 4.06, 0.9, 0.85, 0.03, 0, CUR, null, true); box(g, x, 3.75, -4.06, 0.9, 0.85, 0.03, 0, CUR, null, true); } }
    else { const WB = [0.9, 0.88, 0.8]; box(g, 0, -0.4, 0, 11, 3.4, 7, 0, WB, WB, true); gable(g, 0, 3.0, 0, 11.6, 7.6, 2.4, 0, [0.62, 0.2, 0.14], WB); windows(11, 7, 1.0, 1.3, 4, true);
      box(g, 0, -0.4, 4.6, 11, 0.3, 2.2, 0, [0.62, 0.56, 0.46], null, true); }   // the verandah's boards
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // the rivers and the railway as segment hashes (32 m cells): the nearest segment, its distance and what it carries
  let LFQ = null;
  function lfSegs(lines, get) {   // lines: [[[x, z, ...], ...], ...] -> { cells, segs: [ax, az, bx, bz, ...get(a, b)] }
    const H = new Map(), S = [];
    for (const L of lines) for (let k = 0; k + 1 < L.length; k++) { const a = L[k], b = L[k + 1], e = { ax: a[0], az: a[1], bx: b[0], bz: b[1], a, b, k, L };
      Object.assign(e, get(a, b, k, L)); S.push(e); const m = 40;
      for (let i = Math.floor((Math.min(a[0], b[0]) - m) / 32); i <= Math.floor((Math.max(a[0], b[0]) + m) / 32); i++) for (let j = Math.floor((Math.min(a[1], b[1]) - m) / 32); j <= Math.floor((Math.max(a[1], b[1]) + m) / 32); j++) {
        const key = i + ',' + j; let c = H.get(key); if (!c) H.set(key, c = []); c.push(e); } }
    return H;
  }
  const LFN = { e: null, d: 1e9, t: 0, lat: 0 };
  function lfNear(H, x, z) {   // the nearest segment of a hash (within ~40 m): LFN.e, its distance d, the point's place along it t (0..1) and side lat
    const c = H.get(Math.floor(x / 32) + ',' + Math.floor(z / 32)); LFN.e = null; LFN.d = 1e9; if (!c) return LFN;
    for (const e of c) { const vx = e.bx - e.ax, vz = e.bz - e.az, l2 = vx * vx + vz * vz || 1, t = clamp(((x - e.ax) * vx + (z - e.az) * vz) / l2, 0, 1), px = e.ax + vx * t, pz = e.az + vz * t, d = Math.hypot(x - px, z - pz);
      if (d < LFN.d) { LFN.d = d; LFN.e = e; LFN.t = t; LFN.lat = ((x - e.ax) * vz - (z - e.az) * vx) / Math.sqrt(l2); } }
    return LFN;
  }
  function lfPad(x, z, h) {   // the ground the world needs (NR.pad): the rail's embankment and cuttings, the rivers' beds and banks, the road kept clear
    const Q = LFQ, n = NRN.i, dd = NRN.dd, hn = NRN.hn;   // (nrH's road query for this very point)
    let r = lfNear(Q.rail, x, z);
    if (r.e && r.d < 30) { const e = r.e, al = e.s0 + (e.s1 - e.s0) * r.t;
      if (!Q.inSpan(al)) { const top = lerp(e.a[2], e.b[2], r.t) - 0.5, d = r.d;
        h = d < 2.8 ? top : h < top ? Math.max(h, top - (d - 2.8) / 1.6) : Math.min(h, top + (d - 2.8) / 1.3); } }
    r = lfNear(Q.riv, x, z);
    if (r.e && r.d < 60) { const e = r.e, hw = lerp(e.a[2], e.b[2], r.t), wy = lerp(e.a[3], e.b[3], r.t), o = r.d - hw;   // (o: past the water's edge; negative in the water)
      h = Math.min(h, o < 0 ? wy - 0.35 - 1.5 * sstep(0, hw * 0.7, -o) : wy + 0.25 + 0.5 * o + 0.06 * o * o); }
    if (n >= 0 && dd < 4 && !Q.onBridge(n)) h = Math.max(h, hn - 0.3 - 0.3 * dd);   // (not under the road's edge, except under the bridges)
    if (n >= 0 && dd < 1.5) h = Math.min(h, hn - 0.3);   // (nor over it: the embankment's end by the viaduct)
    return h;
  }
  function buildLongford(scene, tex, opts) {
    const R = rng(1965), N = T.N, w = T.w, ds = T.ds, dens = opts.density || 1, sStart = T.startS, def = T.def, L = T.len, LF = def.lf;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: nrGround, camFloor: nrGround, props: [], farClip: true, ownTex: [] };
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    const dS = (s) => { let d = s - sStart; d = ((d % L) + L) % L; return d > L / 2 ? d - L : d; };   // metres from the start line (-L/2 .. L/2)
    const sAt = (d) => (((sStart + d) % L) + L) % L;
    const hyS = (s) => T.elevAt(wrapS(s)).y;
    const PD = def.pit, W1 = [1, 1, 1];
    const inR = (d, a, b) => { const x = ((d - a) % L + L) % L; return x <= ((b - a) % L + L) % L; };   // d in [a, b] (metres from the start line, round the lap)
    const brS = LF.bridges, onBr = (i) => { const d = dS(i * ds); return brS.some(([a, b]) => inR(d, a - 1, b + 1)); };
    // the railway and the rivers for the ground (lfPad)
    { const rl = def.rail; let acc = 0; const cum = [0]; for (let k = 1; k < rl.length; k++) cum.push(acc += Math.hypot(rl[k][0] - rl[k - 1][0], rl[k][1] - rl[k - 1][1]));
      LFQ = { rail: lfSegs([rl], (a, b, k) => ({ s0: cum[k], s1: cum[k + 1] })), riv: lfSegs(def.rivers.map(r => r[1]), () => ({})), cum,
        inSpan: (al) => def.railSpans.some(([a, b]) => al > a - 2 && al < b + 2), onBridge: onBr }; }
    nrPrep();
    const P = API.NR, G = P.G;
    P.seC = [1.12, 1.0, 0.84];   // the town's gardens and yards: dry, trampled
    // the paddocks (made up): a grid of fields 150 x 105 m turned to the district's roads, each row shifted, each field grazed, cut or watered its own way
    const PDA = 0.42, PDc = Math.cos(PDA), PDs = Math.sin(PDA), PDU = 150, PDV = 105, PDK = { c: 0, r: 0, du: 0, dv: 0 };
    const pdOff = (r) => crH(r, 11, 71) * PDU, pdXZ = (u, v) => [u * PDc - v * PDs, u * PDs + v * PDc];
    const paddock = (x, z) => { const u = x * PDc + z * PDs, v = -x * PDs + z * PDc, r = Math.floor(v / PDV), uo = u + pdOff(r), c = Math.floor(uo / PDU);
      PDK.c = c; PDK.r = r; PDK.du = Math.min(uo - c * PDU, (c + 1) * PDU - uo); PDK.dv = Math.min(v - r * PDV, (r + 1) * PDV - v); return PDK; };
    const TRH = new Map(), trampled = (x, z) => {   // the grass trodden flat behind the crowds (TRH: 16 m cells of [x, z, r], filled with the crowds below; the ground is coloured at the end)
      const Lc = TRH.get(Math.floor(x / 16) + ',' + Math.floor(z / 16)); if (!Lc) return 0; let t = 0;
      for (let k = 0; k < Lc.length; k += 3) { const d = Math.hypot(x - Lc[k], z - Lc[k + 1]); t = Math.max(t, sstep(Lc[k + 2] + 4, Lc[k + 2] * 0.3, d)); } return t * 0.8; };
    const PDT = [[0.9, 1.06, 0.86], [1.12, 1.04, 0.8], [1.05, 1.04, 0.95], [0.96, 1.0, 0.92], [1, 1, 1], [1.06, 1.0, 0.86]];   // (watered, dry gold, grazed short, darker, as it is, ripe)
    P.colMod = (x, z, c) => {   // late summer (the race was in late February or early March): the pastures pale green-gold, greener by the rivers, the crops' stubble golden, ploughed fields brown
      const n = P.n5(x * 0.55 + 700, z * 0.55), m = P.n3(x * 1.6 + 300, z * 1.6), k = 0.95 + (n - 0.5) * 0.24 + (m - 0.5) * 0.16, fm = nrLCf(x, z, 0), cr = nrLCf(x, z, 2);
      c[0] *= k * 1.04; c[1] *= k; c[2] *= k * 0.84;
      const dry = sstep(0.5, 0.78, P.n3(x * 0.8 + 90, z * 0.8 - 40)) * 0.45 * fm; c[0] = lerp(c[0], c[0] * 1.16 + 0.05, dry); c[1] = lerp(c[1], c[1] * 1.06 + 0.02, dry); c[2] = lerp(c[2], c[2] * 0.76, dry);
      if (cr > 0) { const t = P.n1(x * 0.3 + 1200, z * 0.3), col = t < 0.3 ? [1.0, 0.84, 0.66] : t < 0.75 ? [1.26, 1.08, 0.62] : [0.86, 1.0, 0.6];   // ploughed, stubble, a green crop
        c[0] = lerp(c[0], col[0], cr * 0.7); c[1] = lerp(c[1], col[1], cr * 0.7); c[2] = lerp(c[2], col[2], cr * 0.7); }
      if (fm > 0.2) { const q = paddock(x, z), t = PDT[Math.floor(crH(q.c, q.r, 77) * PDT.length)], e = fm * sstep(0, 6, Math.min(q.du, q.dv)) * 0.9;
        c[0] *= 1 + (t[0] - 1) * e; c[1] *= 1 + (t[1] - 1) * e; c[2] *= 1 + (t[2] - 1) * e; }
      const tp = trampled(x, z); if (tp > 0) { c[0] = lerp(c[0], c[0] * 1.14 + 0.03, tp * 0.7); c[1] = lerp(c[1], c[1] * 0.98, tp * 0.7); c[2] = lerp(c[2], c[2] * 0.8, tp * 0.7); }
      const rv = lfNear(LFQ.riv, x, z); if (rv.e && rv.d < 45) { const t = sstep(45, 8, rv.d) * 0.5; c[0] = lerp(c[0], c[0] * 0.82, t); c[1] = lerp(c[1], c[1] * 1.04, t); c[2] = lerp(c[2], c[2] * 0.9, t); }   // the river flats lusher
    };
    P.pad = lfPad;
    out.bounds = { minX: P.x0, maxX: P.x1, minZ: P.z0, maxZ: P.z1 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 64;   // tree exclusion circles (buildings, stands, crowds), hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); } };
    const excluded = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (let k = 0; k < Lc.length; k++) { const e = Lc[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    const wet = (x, z, m) => { const r = lfNear(LFQ.riv, x, z); return !!r.e && r.d < lerp(r.e.a[2], r.e.b[2], LFN.t) + (m || 0); };
    const railNear = (x, z, m) => { const r = lfNear(LFQ.rail, x, z); return !!r.e && r.d < m; };

    /* ---- terrain tiles: which ones (built at the end, when the trees have darkened the ground under them) ---- */
    const gMat = new THREE.MeshLambertMaterial({ map: ownTex(nrGrassTex(tex.grass.anisotropy)), vertexColors: true }), tiles = [];
    for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { const on = nrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; tiles.push(ti, tj, on); }

    /* ---- the road: an old tar seal (patched, the wheel tracks darker), timber planks on the bridges; no lines, no kerbs (256 m chunks) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const CH = 128, offs = [-w, -w * 0.6, -w * 0.25, 0, w * 0.25, w * 0.6, w], tileL = 8;
    const secT = new Float32Array(N); for (let i0 = 0, k = 0; i0 < N; k++) { const n = 30 + Math.floor(crH(k, 3, 65) * 60), t = 0.93 + crH(k, 5, 65) * 0.12; for (let i = i0; i < Math.min(N, i0 + n); i++) secT[i] = t; i0 += n; }
    const bridgeAt = new Uint8Array(N); for (let i = 0; i < N; i++) bridgeAt[i] = onBr(i) ? 1 : 0;
    const rub = new Float32Array(N);   // the rubber laid down braking for the slow corners (the 120 m before each, the most at the turn-in)
    for (const c of T.corners) { if (c.sev < 3) continue; for (let k = 0; k < Math.round(120 / ds); k++) { const i = ((c.i0 - k) % N + N) % N; rub[i] = Math.max(rub[i], 1 - k * ds / 120); } }
    const shade = (i, o) => { if (bridgeAt[i]) { const k = 0.98 + 0.08 * Math.sin(i * 1.7); return [0.92 * k, 0.74 * k, 0.56 * k]; }   // (weathered planks)
      const tr = Math.exp(-((Math.abs(o) - 1.9) ** 2) / 0.7); let k = (0.84 - (0.06 + 0.1 * rub[i]) * tr) * secT[i];
      if (Math.abs(o) > w * 0.9) return [k * 1.16 + 0.03, k * 1.08 + 0.02, k * 0.94];   // (the dust and the gravel blown onto the edge)
      return [k * 1.02, k, k * 0.96]; };
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB(true); let pr = -1;
      for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) { const i = ii % N, v = ii * ds / tileL;
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o)), offs.map(o => [(o + w) / tileL, v])); if (pr >= 0) gr.link(pr, r, 0, offs.length - 1); pr = r; }
      addM(gr, aMat);
    }
    // the patches of newer tar (darker) and older ones (paler), the cracks: drawn just over the road (one mesh)
    { const gp = new GB(true), pm = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -3 }), uv = (p) => [p[0] / 8, -p[2] / 8];
      for (let k = 0; k < 170; k++) { const s0 = crH(k, 1, 101) * L, i = T.idx(s0), n = 1 + Math.floor(crH(k, 2, 101) * 4); if (bridgeAt[i] || bridgeAt[(i + n) % N]) continue;
        const o = (crH(k, 3, 101) - 0.5) * (w - 1.2) * 2, hw = 0.5 + crH(k, 4, 101) * 1.1, dark = crH(k, 5, 101) < 0.6, c = dark ? [0.74, 0.74, 0.76] : [0.93, 0.91, 0.88];
        for (let j = 0; j < n; j++) { const a = (i + j) % N, b = (i + j + 1) % N, A = Pt(a, o - hw, 0.03), B = Pt(a, o + hw, 0.03), C = Pt(b, o + hw, 0.03), D = Pt(b, o - hw, 0.03); gp.quadUp(A, B, C, D, [c, c, c, c], [uv(A), uv(B), uv(C), uv(D)]); } }
      const CK = [0.3, 0.3, 0.31];
      for (let k = 0; k < 260; k++) { const i = Math.floor(crH(k, 6, 101) * N); if (bridgeAt[i]) continue; let o = (crH(k, 7, 101) - 0.5) * (w - 0.6) * 2, ii = i;
        for (let j = 0; j < 3; j++) { const o2 = clamp(o + (crH(k, 8 + j, 101) - 0.5) * 1.2, -w + 0.3, w - 0.3), jj = (ii + 1) % N; if (bridgeAt[jj]) break;
          const A = Pt(ii, o - 0.035, 0.032), B = Pt(ii, o + 0.035, 0.032), C = Pt(jj, o2 + 0.035, 0.032), D = Pt(jj, o2 - 0.035, 0.032); gp.quadUp(A, B, C, D, [CK, CK, CK, CK], [uv(A), uv(B), uv(C), uv(D)]); o = o2; ii = jj; } }
      { const m = addM(gp, pm); if (m) { m.name = 'roadpatches'; m.renderOrder = 0.4; } } }   // (ROAD DECAL ORDER: under the road's wear, so its rubber line stays over the tar, and every tyre mark)
    // in the town: a footpath on either side between the kerb and the garden walls (kind 3, set below: drawn after it)
    const footpaths = () => { const gf = new RB(true), FPc = [1.2, 1.17, 1.1], KB = [1.0, 0.98, 0.94];
      for (const side of [-1, 1]) { let pr = -1;
        for (let i = 0; i <= N; i++) { const ii = i % N; if (kindAt(ii, side) !== 3) { pr = -1; continue; }
          const bar = side > 0 ? T.br[ii] : T.bl[ii], o = [w + 0.1, w + 0.12, bar - 0.05], pts = [Pt(ii, side * o[0], 0.0), Pt(ii, side * o[1], 0.13), Pt(ii, side * o[2], 0.13)], cols = [KB, FPc, FPc], uvs = pts.map(p => [p[0] / 6, -p[2] / 6]);
          if (side < 0) { pts.reverse(); cols.reverse(); uvs.reverse(); }
          const r = gf.row(pts, cols, uvs); if (pr >= 0) gf.link(pr, r, 0, 2); pr = r; } }
      addM(gf, aMat); };
    // the start / finish line (white), the grid's lines
    { const gw = new GB(), wh = [0.93, 0.93, 0.9], HYp = (p) => T.hy[p[3]];
      const q = (s0, s1, l0, l1) => { const a = atSf(s0, l0), b = atSf(s0, l1), c = atSf(s1, l1), d = atSf(s1, l0); gw.quadUp([a[0], HYp(a) + 0.04, a[1]], [b[0], HYp(b) + 0.04, b[1]], [c[0], HYp(c) + 0.04, c[1]], [d[0], HYp(d) + 0.04, d[1]], [wh, wh, wh, wh]); };
      q(sStart - 0.3, sStart + 0.3, -w, w);
      for (let k = 1; k <= 14; k++) { const sb = sStart - 9 - (k - 1) * 7.5 + 2.6, lat = (k % 2 === 1 ? -1 : 1) * 2.6; q(sb, sb + 0.3, lat - 1.3, lat + 1.3); }
      addM(gw, new THREE.MeshLambertMaterial({ vertexColors: true })); }

    /* ---- what stands at the road's edge (by side and sample): -1 nothing (the pit lane's ends), 0 a post-and-rail fence, 1 straw bales (the
       outside of the slow corners, round the viaduct), 2 a bridge's timber railing, 3 a brick wall (the viaduct's abutments, the town's gardens),
       4 the pits' low white rail ---- */
    const side2 = (side) => (side > 0 ? 1 : 0);
    const kind = [new Int8Array(N), new Int8Array(N)];
    for (const c of T.corners) { if (c.sev < 3) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, si = side2(-c.dir);
      for (let k = c.i0 - 14; k <= i1c + 20; k++) kind[si][((k % N) + N) % N] = 1; }
    const setK = (a, b, sd, k) => { for (let d = a; d <= b; d += ds) { const i = T.idx(sAt(d)); if (sd <= 0) kind[0][i] = k; if (sd >= 0) kind[1][i] = k; } };
    setK(LF.viaduct - 50, LF.viaduct + 40, 0, 1);   // (bales in front of the viaduct's piers, as there were)
    setK(LF.town[0], LF.town[1], 0, 3);
    for (const [a, b] of brS) setK(a - 4, b + 4, 0, 2);
    for (let i = 0; i < N; i++) { const p = PD && T.pitAt(i * ds); if (p) kind[1][i] = p.gap ? -1 : 4; }
    const kindAt = (i, side) => kind[side2(side)][i];
    footpaths();
    const postGeo = (() => { const g = new GB(); box(g, 0, 0, 0, 0.16, 1, 0.16, 0, [0.5, 0.46, 0.4], [0.42, 0.38, 0.33], true); return g.geometry(); })();
    const posts = new IChunks(postGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), 256);
    const baleGeo = (() => { const g = new GB(), st = [0.86, 0.72, 0.38], sd = [0.74, 0.6, 0.3]; box(g, 0, 0, 0, 1.1, 0.42, 0.5, 0, sd, st, true); return g.geometry(); })();
    const bales = new IChunks(baleGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), 256);
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const TIM = [0.56, 0.52, 0.45], TIMd = [0.4, 0.37, 0.32], WHT = [0.9, 0.9, 0.86], BRK = [0.8, 0.5, 0.38], BRKt = [0.84, 0.8, 0.72];
    let nPosts = 0, nBales = 0;
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB();
      for (const side of [-1, 1]) {
        let prev = -1, pk = -9;
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
          const i = ii % N, k = kindAt(i, side), bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.15);
          let row = -1;
          if (k === 0 || k === 2 || k === 4) {   // rails: three for a fence, two and a kerb beam for a bridge, one low for the pits
            const hs = k === 0 ? [[0.42, 0.56], [0.78, 0.92], [1.14, 1.28]] : k === 2 ? [[0.0, 0.32], [0.62, 0.74], [1.02, 1.16]] : [[0.28, 0.48]], col = k === 4 ? WHT : k === 2 ? TIMd : TIM, pts = [], cols = [];
            for (const [y0, y1] of hs) { pts.push(Pt(i, o, y0), Pt(i, o, y1)); cols.push(col, col); }
            if (side < 0) { pts.reverse(); cols.reverse(); }
            row = gr.row(pts, cols);
            if (prev >= 0 && pk === k) for (let m = 0; m < hs.length; m++) gr.link(prev, row, m * 2, m * 2 + 1);
            if (ii % (k === 2 ? 1 : 2) === 0 && ii < c0 + CH) { const p = Pt(i, side * (bar + 0.22), 0); posts.add(p[0], p[1] - 0.4, p[2], T.hd[i], 1, k === 4 ? 0.95 : 1.75, k === 4 ? [1.7, 1.7, 1.66] : W1); nPosts++; }   // (a post every 4 m, on a bridge every 2 m)
          } else if (k === 3) {   // a brick wall: the face to the road, the coping on top
            const hh = 0.95, pts = [Pt(i, o, -0.3), Pt(i, o, hh), Pt(i, side * (bar + 0.5), hh), Pt(i, side * (bar + 0.5), -0.3)], cols = [BRK, BRK, BRKt, BRK];
            if (side < 0) { pts.reverse(); cols.reverse(); }
            row = gr.row(pts, cols); if (prev >= 0 && pk === k) gr.link(prev, row, 0, 3);
          }
          prev = row; pk = k;
        }
      }
      addM(gr, rMat, true);
    }
    for (const side of [-1, 1]) for (let s = 0, st = 1.15; s < L; s += st) {   // straw bales end to end along the line (the step shorter round the outside of a bend), two high here and there
      const f = s / ds, i0 = Math.floor(f) % N, i = Math.round(f) % N, bar = lerp(side > 0 ? T.br[i0] : T.bl[i0], side > 0 ? T.br[(i0 + 1) % N] : T.bl[(i0 + 1) % N], f - Math.floor(f));
      st = 1.15 / clamp(1 - side * T.k[i] * (bar + 0.3), 0.3, 3); if (kindAt(i, side) !== 1) continue;
      const [x, z, hd] = atSf(s, side * (bar + 0.3)), y = nrGround(x, z) - 0.04;
      for (const lv of [0, 1]) { if (lv && crH(s, side, 7) < 0.55) continue; bales.add(x, y + lv * 0.42, z, -hd + (crH(s, lv, 9) - 0.5) * 0.1, 1, 1, vary([1, 1, 1], () => crH(s, lv, side), 0.12)); nBales++; } }
    out.nPosts = posts.addTo(root, true); bales.addTo(root, true);

    /* ---- scenery helpers (vertex coloured, 256 m chunks), the text boards ---- */
    const scen = new Chunks(256), ban = new GB(true), atlas = ownTex(lfAtlas()), AUV = (k) => { const u0 = (k % 4) / 4, v1 = 1 - Math.floor(k / 4) / 16; return [u0, v1 - 1 / 16, u0 + 0.25, v1]; };
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const board = (cx, cy, cz, tx, tz, Wd, H, cellK, back) => {   // a text board (bottom centre cx, cy, cz) read by cars driving along +t
      const [u0, v0, u1, v1] = AUV(cellK), ux = tz, uz = -tx, hw = -Wd / 2;
      const A = [cx - ux * hw, cy, cz - uz * hw], B = [cx + ux * hw, cy, cz + uz * hw], C = [B[0], cy + H, B[2]], D = [A[0], cy + H, A[2]];
      ban.quadO(A, B, C, D, W1, [cx + tx, cy + H / 2, cz + tz], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
      if (back !== false) box(scen.get(cx, cz), cx + tx * 0.05, cy - 0.02, cz + tz * 0.05, 0.06, H + 0.04, Wd + 0.04, Math.atan2(tz, tx), TIMd, null, true);
    };
    const CR = crowdCtx({ gH: nrGround, near: (x, z) => nrNear(x, z).dd, maxSlope: 0.9, shirts: LF_SHIRTS, water: (x, z) => wet(x, z, 1.5) || railNear(x, z, 3.2) });
    const crowdPts = [], runs = [];

    /* ---- the start: a banner over the road on two timber poles, the control tower and the scoreboard behind the pits ---- */
    { const [x, z, h, i] = atS(sStart, 0), y = T.hy[i], span = Math.max(T.bl[i], T.br[i]) + 0.8, nx = T.nx[i], nz = T.nz[i], g = scen.get(x, z);
      for (const sd of [-1, 1]) cyl(g, x + nx * span * sd, y - 0.3, z + nz * span * sd, 0.16, 7.6, 6, TIM, TIMd);
      box(g, x, y + 6.9, z, 0.12, 0.12, span * 2, h, TIMd);
      board(x - T.tx[i] * 0.08, y + 5.6, z - T.tz[i] * 0.08, T.tx[i], T.tz[i], 7, 1.3, LF_AT.ban, false); board(x + T.tx[i] * 0.08, y + 5.6, z + T.tz[i] * 0.08, -T.tx[i], -T.tz[i], 7, 1.3, LF_AT.ban + 1, false);
      exclPush(x, z, span + 4); }
    let nBoxes = 0;
    if (PD) {
      const gl = new GB(true), gp = new GB(), one = [1, 1, 1], wl = [0.95, 0.95, 0.92], apC = [0.62, 0.6, 0.54], [pq0, pq1] = def.pitRow;
      const at = (s, o, y) => { const [x, z] = atSf(s, o); return [x, hyS(s) + y, z]; };
      for (let q = PD[1]; q < PD[2]; q += 2) {   // the lane: the road widened behind the white line, the gravel apron where the crews work
        const s0 = sStart + q, s1 = s0 + 2, pi = T.pitAt(s0), pj = T.pitAt(s1); if (!pi || !pj) continue;
        const A = at(s0, pi.o - 3.5, 0.024), Bq = at(s0, pi.o + 3.5, 0.024), C = at(s1, pj.o + 3.5, 0.024), D = at(s1, pj.o - 3.5, 0.024);
        gl.quadUp(A, Bq, C, D, [[0.82, 0.8, 0.78], [0.82, 0.8, 0.78], [0.82, 0.8, 0.78], [0.82, 0.8, 0.78]], [[A[0] / 8, -A[2] / 8], [Bq[0] / 8, -Bq[2] / 8], [C[0] / 8, -C[2] / 8], [D[0] / 8, -D[2] / 8]]);
        const r0 = (side) => side ? T.br[T.idx(s0)] : 0;
        gl.quadUp(at(s0, w, 0.02), at(s0, pi.o - 3.5, 0.022), at(s1, pj.o - 3.5, 0.022), at(s1, w, 0.02), [[0.8, 0.78, 0.76], [0.8, 0.78, 0.76], [0.8, 0.78, 0.76], [0.8, 0.78, 0.76]],
          [[0, 0], [0.3, 0], [0.3, 0.3], [0, 0.3]].map(([u, v]) => [u + s0 / 8, v]));   // (the tar between the road and the lane)
        gp.quadUp(at(s0, pi.o - 3.62, 0.034), at(s0, pi.o - 3.38, 0.034), at(s1, pj.o - 3.38, 0.034), at(s1, pj.o - 3.62, 0.034), [wl, wl, wl, wl]);   // the white line
        if (pi.t > 0.999 && pj.t > 0.999) gp.quadUp(at(s0, pi.o + 3.5, 0.02), at(s0, pi.o + 19, 0.02), at(s1, pj.o + 19, 0.02), at(s1, pj.o + 3.5, 0.02), [apC, apC, apC, apC]);   // (the gravel apron and the shed's floor)
      }
      const TEAM = [[0.12, 0.32, 0.2], [0.85, 0.12, 0.14], [0.16, 0.3, 0.62], [0.94, 0.94, 0.9], [0.82, 0.62, 0.12], [0.14, 0.14, 0.16], [0.5, 0.52, 0.56], [0.2, 0.5, 0.68], [0.6, 0.18, 0.12], [0.86, 0.84, 0.7], [0.3, 0.42, 0.3], [0.7, 0.1, 0.1], [0.2, 0.3, 0.55]];
      const kbox = (g, s0, a, wo, y, sx, sy, sz, col, top, nb) => { const [x, z, hd] = atSf(s0 + a, wo); box(g, x, hyS(s0 + a) + y, z, sx, sy, sz, hd, col, top, nb); };
      const kcyl = (g, s0, a, wo, y, r, h, n, col, top) => { const [x, z] = atSf(s0 + a, wo); cyl(g, x, hyS(s0 + a) + y, z, r, h, n, col, top); };
      for (let q = pq0, k = 0; q <= pq1; q += 10, k++) { const s0 = sStart + q, i = T.idx(s0), p = T.pitAt(s0); if (!p || p.t < 0.999) continue;
        const tx = T.tx[i], tz = T.tz[i], base = p.o + 3.5, hd = T.hd[i];
        if (nBoxes >= 13) continue; nBoxes++;
        const tc = TEAM[k % TEAM.length], cx = T.px[i] + T.nx[i] * (base + 4.2) + tx * 5, cz = T.pz[i] + T.nz[i] * (base + 4.2) + tz * 5, g = scen.get(cx, cz);
        const mine = PD[3] != null && Math.abs(q + 5 - PD[3]) < 1, yb = hyS(s0 + 5);
        if (mine) { const sb = s0 + 5, bp = T.bayPose(PD[3]);
          out.pitBox = { s: sb, x: cx, z: cz, hd, tx, tz, nx: T.nx[i], nz: T.nz[i], lane: p.o, wallO: p.wall, apron0: base, garage0: base + 9, stop: atSf(sb, bp.o), stopO: bp.o, stopA: bp.a }; }
        // the crew's place: a timber bench with the tools, fuel drums, spare wheels, the team's number board on a post
        if (!mine) kbox(g, s0, 5, base + 8.4, 0, 3.2, 0.9, 0.9, TIM, [0.62, 0.58, 0.5]);   // (the player's crew waits behind this line and runs out to its car: no bench, no wheels in its way, the drums aside)
        for (const a of (mine ? [0.4, 1.0] : [2.0, 2.8])) kcyl(g, s0, a, base + 8.8, 0, 0.3, 0.9, 7, mine ? [0.82, 0.14, 0.12] : tc, [0.3, 0.3, 0.32]);
        if (!mine) for (let m = 0; m < 3; m++) kcyl(g, s0, 7.6, base + 8.6, m * 0.24, 0.34, 0.22, 8, [0.12, 0.12, 0.13], m === 2 ? [0.5, 0.5, 0.52] : null);
        kbox(g, s0, 9.2, base + 7.8, 0, 0.1, 2.0, 0.1, TIMd, null, true); kbox(g, s0, 9.2, base + 7.78, 1.7, 0.7, 0.5, 0.05, tc, null, true);
        const oc = atSf(s0 + 5, 0);
        (out.pitBoxes = out.pitBoxes || []).push({ k, s: s0 + 5, ox: oc[0], oz: oc[1], tx, tz, nx: T.nx[i], nz: T.nz[i], hd, base, lane: p.o, wall: p.wall, team: tc, mine, y: yb });
        out.pitBoxes[out.pitBoxes.length - 1].gar = { band: [base + 8.955, 3.3, 3.78, 4.7], wall: [base + 14.84, 0.03, 2.75, 4.55] }; }   // (its bay of the shed below, for the renderer's team colours: the board under the eave, the back wall between the posts)
      T.pitStands = null;
      { const sE = sStart + PD[1] + 24, pE = T.pitAt(sE); if (pE) { const [x, z] = atSf(sE, pE.lout + 2.6), i = T.idx(sE);   // the PITS sign at the way in
        cyl(scen.get(x, z), x, hyS(sE) - 0.3, z, 0.08, 2.9, 5, TIMd); board(x, hyS(sE) + 2.1, z, T.tx[i], T.tz[i], 2.6, 0.75, LF_AT.ban + 2); exclPush(x, z, 3); } }
      addM(gl, aMat); addM(gp, new THREE.MeshLambertMaterial({ vertexColors: true }));
      // the pit shed: an open timber shed with a corrugated iron roof behind the crews, the length of the boxes
      { const f0 = (s) => { const p = T.pitAt(s); return p ? p.o + 3.5 + 9.0 : null; }, IR = [0.62, 0.63, 0.64];   // (its eave over the garages' line: the renderer hangs each crew's coloured board under it, out.pitBoxes gar)
        for (let q = pq0 - 10; q < pq1 + 20; q += 10) { const s0 = sStart + q, f = f0(s0 + 5); if (f == null) continue; const [x, z] = atSf(s0 + 5, f + 3), g = scen.get(x, z);
          for (const a of [0.3, 9.7]) for (const o of [f + 0.3, f + 5.7]) kbox(g, s0, a, o, -0.2, 0.22, 4.0, 0.22, TIM, null, true);
          kbox(g, s0, 5, f + 5.9, -0.2, 10, 3.0, 0.12, TIM, null, true);
          const A = at(s0, f - 0.5, 3.95), B = at(s0 + 10, f - 0.5, 3.95), C = at(s0 + 10, f + 6.2, 3.3), D = at(s0, f + 6.2, 3.3); g.quadO(A, B, C, D, IR, at(s0 + 5, f + 3, -3));
          g.quadO(at(s0, f - 0.5, 3.85), at(s0 + 10, f - 0.5, 3.85), at(s0 + 10, f + 6.2, 3.2), at(s0, f + 6.2, 3.2), [0.4, 0.38, 0.34], at(s0 + 5, f + 3, 8));
          exclPush(x, z, 8); CR.exclAdd(x, z, 7); }
        // the control tower (1959) at the start line behind the shed: a timber tower, the officials' glazed room on top; the scoreboard beside it
        const s0 = sStart - 4, f = (f0(s0) || 30) + 9, [x, z] = atSf(s0, f), g = scen.get(x, z), i = T.idx(s0), hd = T.hd[i], y = hyS(s0);
        box(g, x, y - 0.4, z, 4.2, 7.6, 4.2, hd, [0.86, 0.82, 0.7], [0.86, 0.82, 0.7]); box(g, x, y + 7.2, z, 5.4, 2.6, 5.4, hd, [0.2, 0.24, 0.28], [0.86, 0.82, 0.7]);
        box(g, x, y + 9.8, z, 6.0, 0.25, 6.0, hd, [0.5, 0.2, 0.16], [0.56, 0.22, 0.18]); box(g, x - T.nx[i] * 3.2, y + 7.0, z - T.nz[i] * 3.2, 5.8, 0.15, 1.6, hd, TIM);
        exclPush(x, z, 7); CR.exclAdd(x, z, 6);
        const [sx, sz] = atSf(s0 + 22, f + 2), gs = scen.get(sx, sz), ys = nrGround(sx, sz), fx = -T.nx[i], fz = -T.nz[i];
        for (const a of [-4.5, 4.5]) box(gs, sx + T.tx[i] * a, ys - 0.3, sz + T.tz[i] * a, 0.3, 7.5, 0.3, hd, TIMd, null, true);
        box(gs, sx, ys + 3.2, sz, 9.6, 4.2, 0.3, hd, [0.1, 0.1, 0.1], TIM);
        for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const k = LF_AT.num + Math.floor(crH(r, c, 3) * 10), a = -3.3 + c * 2.2;   // (the positions and laps of the leaders, painted digits)
          board(sx + fx * 0.17 + T.tx[i] * a, ys + 3.5 + r * 1.3, sz + fz * 0.17 + T.tz[i] * a, T.nx[i], T.nz[i], 1.0, 1.0, k, false); }
        exclPush(sx, sz, 7); CR.exclAdd(sx, sz, 6);
      }
    }

    /* ---- a timber footbridge for the spectators over the Pit Straight: a deck on two trestle towers, a stair down each side (scenery: nothing hits it) ---- */
    { const s0 = sAt(330), i = T.idx(s0), tx = T.tx[i], tz = T.tz[i], nx = T.nx[i], nz = T.nz[i], y0 = T.hy[i], top = y0 + 5.6, g = scen.get(T.px[i], T.pz[i]);
      const P = (o, a) => [T.px[i] + nx * o + tx * a, T.pz[i] + nz * o + tz * a], rot = Math.atan2(nz, nx), oL = -(T.bl[i] + 2.2), oR = T.br[i] + 2.2, span = oR - oL, [cx, cz] = P((oL + oR) / 2, 0);
      box(g, cx, top, cz, span + 1.6, 0.32, 1.9, rot, TIM, [0.62, 0.58, 0.5]);   // the deck
      for (const a of [-0.92, 0.92]) { const [px, pz] = P((oL + oR) / 2, a); box(g, px, top + 0.3, pz, span + 1.6, 0.95, 0.06, rot, WHT, null, true); box(g, px, top + 1.25, pz, span + 1.6, 0.08, 0.1, rot, TIMd, null, true); }   // the white parapets
      for (const oe of [oL, oR]) { const sd = Math.sign(oe);
        for (const da of [-0.8, 0.8]) for (const dn of [-0.7, 0.7]) { const [px, pz] = P(oe + dn, da); cyl(g, px, nrGround(px, pz) - 0.3, pz, 0.12, top - nrGround(px, pz) + 0.35, 5, TIMd); }   // the trestle tower
        for (const dy of [1.6, 3.6]) { const [px, pz] = P(oe, 0); box(g, px, nrGround(px, pz) + dy, pz, 1.5, 0.14, 1.7, rot, TIMd, null, true); }
        const [bx, bz] = P(oe + sd * 1.2, 1.4), gb = nrGround(bx, bz), n = Math.max(6, Math.round((top - gb) / 0.36));   // the stair, down along the road away from the deck
        for (let k = 0; k < n; k++) { const a = 1.3 + k * 0.62, [px, pz] = P(oe + sd * 1.25, a), y = top - (k + 1) * (top - nrGround(px, pz)) / (n + 0.5); box(g, px, y, pz, 1.3, 0.12, 0.62, rot, TIM, null, true); }
        for (const dn of [0.55, 1.95]) { const [ax, az] = P(oe + sd * dn, 1.2), [bx2, bz2] = P(oe + sd * dn, 1.3 + n * 0.62); g.quadO([ax, top + 1.0, az], [bx2, nrGround(bx2, bz2) + 0.9, bz2], [bx2, nrGround(bx2, bz2) + 0.98, bz2], [ax, top + 1.08, az], TIMd, [ax + nx * sd * 3, top, az + nz * sd * 3]); }
        for (const a of [0, 3, 6]) { const [ex, ez] = P(oe + sd * 1.0, a); exclPush(ex, ez, 3); CR.exclAdd(ex, ez, 2.6); } } }

    /* ---- the rivers: the water's surface along each centre line (its own width and level), a slow sheen ---- */
    { const gw = new GB(true), wc = [1, 1, 1], uv = (q) => [q[0] / 16, -q[2] / 16];
      for (const [, pts] of def.rivers) for (let k = 0; k + 1 < pts.length; k++) {
        const a = pts[k], b = pts[k + 1], n0 = k > 0 ? pts[k - 1] : a, n1 = k + 2 < pts.length ? pts[k + 2] : b;
        const ta = [b[0] - n0[0], b[1] - n0[1]], tb = [n1[0] - a[0], n1[1] - a[1]], la = Math.hypot(...ta) || 1, lb = Math.hypot(...tb) || 1;
        const pa = [-ta[1] / la, ta[0] / la], pb = [-tb[1] / lb, tb[0] / lb], ha = a[2] + 1.2, hb = b[2] + 1.2;
        const q = [[a[0] - pa[0] * ha, a[3], a[1] - pa[1] * ha], [a[0] + pa[0] * ha, a[3], a[1] + pa[1] * ha], [b[0] + pb[0] * hb, b[3], b[1] + pb[1] * hb], [b[0] - pb[0] * hb, b[3], b[1] - pb[1] * hb]];
        gw.quadUp(q[0], q[1], q[2], q[3], [wc, wc, wc, wc], q.map(uv));
      }
      const m = addM(gw, waterMat(tex, { plain: true, color: 0x46503a, len: 0.7, amp: 0.45, refl: 0.38, land: 0.9, shal: 0, lap: 0.4, surf: 0 })); if (m) { m.receiveShadow = true; out.dyn.water = tex.water; } }

    /* ---- the railway: the ballast and the rails on its embankment, the brick viaduct over the old road, the iron bridges over the rivers,
       the level crossing's signs ---- */
    let nArch = 0;
    { const rl = def.rail, cum = LFQ.cum, span = (al) => def.railSpans.find(([a, b]) => al > a - 1 && al < b + 1), gb = new RB(), gr = new RB(), BAL = [0.46, 0.43, 0.4], SLP = [0.32, 0.26, 0.2], RAIL = [0.56, 0.56, 0.58];
      const nrm = (k) => { const a = rl[Math.max(0, k - 1)], b = rl[Math.min(rl.length - 1, k + 1)], tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1; return [-tz / l, tx / l, tx / l, tz / l]; };
      let pb = -1, pr = -1;
      for (let k = 0; k < rl.length; k++) {
        const [x, z, y] = rl[k], [nx, nz] = nrm(k), P2 = (o, dy) => [x + nx * o, y + dy, z + nz * o];
        const rb = gb.row([P2(-2.6, -0.55), P2(-1.6, -0.08), P2(-1.3, -0.04), P2(1.3, -0.04), P2(1.6, -0.08), P2(2.6, -0.55)], [BAL, BAL, SLP, SLP, BAL, BAL]); if (pb >= 0) gb.link(pb, rb, 0, 5); pb = rb;
        const rr = gr.row([P2(-0.75, -0.04), P2(-0.75, 0.12), P2(-0.69, 0.12), P2(0.69, 0.12), P2(0.75, 0.12), P2(0.75, -0.04)], [RAIL, RAIL, RAIL, RAIL, RAIL, RAIL]); if (pr >= 0) { gr.link(pr, rr, 0, 2); gr.link(pr, rr, 3, 5); } pr = rr;
      }
      addM(gb, new THREE.MeshLambertMaterial({ vertexColors: true })); addM(gr, matV);
      // the spans: brick arches where the line crosses the old road (the viaduct), iron girders on stone piers over the rivers and the flats
      const at = (al) => { let k = 0; while (k + 2 < cum.length && cum[k + 1] < al) k++; const t = clamp((al - cum[k]) / Math.max(1e-6, cum[k + 1] - cum[k]), 0, 1), a = rl[k], b = rl[k + 1], tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1;
        return { x: lerp(a[0], b[0], t), z: lerp(a[1], b[1], t), y: lerp(a[2], b[2], t), tx: tx / l, tz: tz / l, nx: -tz / l, nz: tx / l }; };
      const viaS = (() => { let best = null, bd = 1e9; for (const sp of def.railSpans) { const m = at((sp[0] + sp[1]) / 2), i = T.nearestIdx(m.x, m.z), d = Math.hypot(T.px[i] - m.x, T.pz[i] - m.z); if (d < bd) { bd = d; best = sp; } } return best; })();
      const g = new GB(), STO = [0.62, 0.58, 0.5], IRN = [0.24, 0.25, 0.27], BRd = [0.5, 0.27, 0.19];
      for (const sp of def.railSpans) {
        const [a0, a1] = sp, len = a1 - a0, brick = sp === viaS;
        if (brick) {   // the viaduct: brick piers, semicircular arches between them (the road under a wider one: 13 m between the piers), the spandrel walls and a parapet each side
          let ar = 1e9; { const R0 = LFQ.cum; for (let k = 0; k + 1 < rl.length; k++) { const a = rl[k], b = rl[k + 1]; for (let q = 0; q <= 10; q++) { const x = lerp(a[0], b[0], q / 10), z = lerp(a[1], b[1], q / 10), n = nrNear(x, z); if (n.i >= 0 && n.d < 1.5) ar = R0[k] + (R0[k + 1] - R0[k]) * q / 10; } } }   // (where the road passes under)
          const pier = []; if (ar < a1 + 5 && ar > a0 - 5) { for (let p = ar - 7.5; p > a0 - 0.5; p -= 10) pier.unshift(p); for (let p = ar + 7.5; p < a1 + 0.5; p += 10) pier.push(p); } else for (let p = a0; p <= a1 + 0.1; p += len / Math.max(2, Math.round(len / 10))) pier.push(p);
          for (const pa of pier) { const q = at(pa), gy = nrGround(q.x, q.z) - 0.5; box(g, q.x, gy, q.z, 2.0, q.y - 0.6 - gy, 5.4, Math.atan2(q.tz, q.tx), BRd, BRK); }
          for (let m = 0; m + 1 < pier.length; m++) { const step = pier[m + 1] - pier[m], A = at(pier[m]), B = at(pier[m + 1]), sp2 = (step - 2) / 2;
            const yS = Math.min(A.y, B.y) - 1.0 - sp2, K = 10;   // (the springing line: the arch's crown 1 m under the rails)
            for (let j = 0; j < K; j++) { const u0 = j / K, u1 = (j + 1) / K, ang0 = Math.PI * u0, ang1 = Math.PI * u1, al0 = pier[m] + 1 + sp2 * (1 - Math.cos(ang0)), al1 = pier[m] + 1 + sp2 * (1 - Math.cos(ang1));
              const p0 = at(al0), p1 = at(al1), y0 = yS + sp2 * Math.sin(ang0), y1 = yS + sp2 * Math.sin(ang1);
              for (const sd of [-2.7, 2.7]) { const Q = (p, yy) => [p.x + p.nx * sd, yy, p.z + p.nz * sd];   // the spandrel: from the arch up to the deck
                g.quadO(Q(p0, y0), Q(p1, y1), Q(p1, p1.y - 0.5), Q(p0, p0.y - 0.5), BRK, [p0.x - p0.nx * sd, (y0 + p0.y) / 2, p0.z - p0.nz * sd]); }
              g.quadO([p0.x - p0.nx * 2.7, y0, p0.z - p0.nz * 2.7], [p0.x + p0.nx * 2.7, y0, p0.z + p0.nz * 2.7], [p1.x + p1.nx * 2.7, y1, p1.z + p1.nz * 2.7], [p1.x - p1.nx * 2.7, y1, p1.z - p1.nz * 2.7], BRd, [p0.x, y0 + 5, p0.z]);   // the arch's underside
            } nArch++; }
          for (let al = a0; al < a1; al += 3) { const p = at(al), q = at(Math.min(a1, al + 3)); for (const sd of [-2.6, 2.6]) g.quadO([p.x + p.nx * sd, p.y - 0.5, p.z + p.nz * sd], [q.x + q.nx * sd, q.y - 0.5, q.z + q.nz * sd], [q.x + q.nx * sd, q.y + 0.9, q.z + q.nz * sd], [p.x + p.nx * sd, p.y + 0.9, p.z + p.nz * sd], BRK, [p.x, p.y, p.z]); }
          const m0 = at((a0 + a1) / 2); exclPush(m0.x, m0.z, len / 2 + 8); CR.exclAdd(m0.x, m0.z, 10);
        } else {   // stone piers every ~25 m, two iron girders along the sides, the deck
          const n = Math.max(1, Math.round(len / 25)), step = len / n;
          for (let m = 0; m <= n; m++) { const q = at(a0 + m * step), gy = nrGround(q.x, q.z) - 1.5; box(g, q.x, gy, q.z, 2.4, q.y - 1.6 - gy, 5.0, Math.atan2(q.tz, q.tx), STO, STO); }
          for (let al = a0; al < a1; al += 4) { const p = at(al), q = at(Math.min(a1, al + 4)); for (const sd of [-2.2, 2.2]) {
            g.quadO([p.x + p.nx * sd, p.y - 1.6, p.z + p.nz * sd], [q.x + q.nx * sd, q.y - 1.6, q.z + q.nz * sd], [q.x + q.nx * sd, q.y + 0.6, q.z + q.nz * sd], [p.x + p.nx * sd, p.y + 0.6, p.z + p.nz * sd], IRN, [p.x, p.y - 0.5, p.z]); }
            g.quadO([p.x - p.nx * 2.2, p.y - 1.6, p.z - p.nz * 2.2], [p.x + p.nx * 2.2, p.y - 1.6, p.z + p.nz * 2.2], [q.x + q.nx * 2.2, q.y - 1.6, q.z + q.nz * 2.2], [q.x - q.nx * 2.2, q.y - 1.6, q.z - q.nz * 2.2], IRN, [p.x, p.y, p.z]); }
        }
      }
      addM(g, matV, true);
      // the level crossing: a white cross on a post either side of the road, before it in each direction
      { const s = sAt(LF.level), i = T.idx(s);
        for (const [sd, dir] of [[1, 1], [-1, -1]]) { const [x, z] = onSide(s - dir * 9, sd, 0.8), y = nrGround(x, z), g2 = scen.get(x, z), tx = T.tx[i] * dir, tz = T.tz[i] * dir;
          cyl(g2, x, y - 0.3, z, 0.07, 3.5, 5, WHT); board(x - tx * 0.1, y + 2.0, z - tz * 0.1, tx, tz, 2.3, 0.55, LF_AT.ban + 3);
          const [ux, uz] = [tz, -tx]; for (const a of [-1, 1]) { const g3 = scen.get(x, z); box(g3, x - tx * 0.12, y + 2.75, z - tz * 0.12, 0.05, 0.18, 1.6, Math.atan2(tz, tx) + a * 0.7, WHT, null, true); }
          exclPush(x, z, 2.5); CR.avoid(x, z, 1.2); } }
    }

    /* ---- the two wooden bridges over the South Esk: piles in rows across under the deck, the beams along its edges (the deck: the road's
       planks; the railings: the barriers above) ---- */
    for (const [a, b] of brS) {
      const g = scen.get(...atS(sAt((a + b) / 2), 0).slice(0, 2));
      for (let d = a; d <= b; d += 6) { const s = sAt(d), i = T.idx(s), y = T.hy[i];
        for (const o of [-w - 0.4, -w * 0.4, w * 0.4, w + 0.4]) { const [x, z] = atS(s, o), gy = Math.min(nrGround(x, z), y - 1) - 1.5; box(g, x, gy, z, 0.36, y - 0.3 - gy, 0.36, T.hd[i], TIMd, null, true); }
        { const [x, z] = atS(s, 0); box(g, x, y - 0.75, z, 0.4, 0.4, w * 2 + 1.4, T.hd[i], TIMd, null, true); } }
      for (let d = a; d < b; d += 2) { const s = sAt(d), i = T.idx(s); for (const sd of [-1, 1]) { const [x, z] = atS(s, sd * (w + 0.25)); box(g, x, T.hy[i] - 0.55, z, 2.05, 0.55, 0.3, T.hd[i], TIMd, null, true); } }
      exclPush(...atS(sAt((a + b) / 2), 0).slice(0, 2), (b - a) / 2 + 10);
    }

    /* ---- the water tower over the Pit Straight: a round concrete tank on a round shaft ---- */
    { const s = sAt(LF.tower), [x, z] = onSide(s, 1, 38), y = nrGround(x, z), g = scen.get(x, z), CO = [0.74, 0.73, 0.7];
      cyl(g, x, y - 0.5, z, 2.6, 15, 14, CO, null, 2.4); cyl(g, x, y + 14, z, 7.2, 7.5, 18, [0.78, 0.77, 0.74], null, 7.2); cone(g, x, y + 21.5, z, 7.5, 1.8, 18, [0.6, 0.6, 0.6], [0.66, 0.66, 0.66], 0);
      cyl(g, x, y + 14, z, 7.25, 0.5, 18, [0.6, 0.6, 0.58], null, 7.25); exclPush(x, z, 12); CR.exclAdd(x, z, 10); }

    /* ---- the town's and the farms' buildings: OSM footprints, and Georgian brick houses along the town's streets (made up) ---- */
    const hMat = new THREE.MeshLambertMaterial({ vertexColors: true }), HK = [0, 1, 2, 3, 4].map(k => new IChunks(lfHouseGeo(k), hMat, 256)), HS = [11, 12, 16, 18, 11];
    let nHouses = 0;
    const blds = [];
    const houseAt = (k, x, z, yaw, sc) => { const y = nrGround(x, z); HK[k].add(x, y - 0.1, z, yaw, sc, sc, vary([1, 1, 1], () => crH(x, z, 31), 0.14)); exclPush(x, z, HS[k] * sc * 0.6 + 2); CR.exclAdd(x, z, HS[k] * sc * 0.55); blds.push([x, z, HS[k] * sc * 0.55]); nHouses++; };
    const nearBld = (x, z, r) => blds.some(b => Math.hypot(b[0] - x, b[1] - z) < b[2] + r);
    const townAt = (x, z) => nrLC(x, z) === 3;
    for (const [x, z, Lb, Wb, ang, kd] of def.bld) {
      const n = nrNear(x, z); if (n.i >= 0 && n.dd < 4) continue;   // (none on the road's verge)
      if (wet(x, z, 4) || railNear(x, z, 6)) continue;
      const k = kd === 2 ? 3 : kd === 1 ? 2 : townAt(x, z) ? (Lb * Wb > 110 ? 1 : 0) : (Lb * Wb > 110 ? 1 : 4);
      houseAt(k, x, z, ang, clamp(Lb / HS[k], 0.6, 1.4));   // (the instance's yaw: its length along the footprint's)
    }
    for (const st of def.town) for (let k = 0; k + 1 < st.length; k++) {   // along the streets: a house every ~22 m each side, set back 9 m, facing the street
      const a = st[k], b = st[k + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / len, tz = (b[1] - a[1]) / len;
      for (let d = 8; d < len - 6; d += 21 + crH(a[0], d, 5) * 6) for (const sd of [-1, 1]) {
        const x = a[0] + tx * d - tz * sd * 10.5, z = a[1] + tz * d + tx * sd * 10.5;
        if (crH(x, z, 6) < 0.12 || nearBld(x, z, 6) || wet(x, z, 6) || railNear(x, z, 9)) continue;
        const n = nrNear(x, z); if (n.i >= 0 && n.dd < 5) continue;
        if (def.town.some(s2 => s2 !== st && s2.some((p, m) => m + 1 < s2.length && segD(p, s2[m + 1], x, z) < 8.5))) continue;
        const kk = crH(x, z, 8) < 0.35 ? 1 : 0; houseAt(kk, x, z, Math.atan2(sd * tz, -sd * tx), 0.85 + crH(x, z, 9) * 0.3);   // (the front, with the door, to the street)
      }
    }
    function segD(p, q, x, z) { const vx = q[0] - p[0], vz = q[1] - p[1], t = clamp(((x - p[0]) * vx + (z - p[1]) * vz) / (vx * vx + vz * vz || 1), 0, 1); return Math.hypot(x - p[0] - vx * t, z - p[1] - vz * t); }
    // farmsteads in the paddocks (made up): a weatherboard or brick house, a shed, a round iron water tank, a windpump; elms round them (below)
    const farms = [];
    for (let f = 0, tries = 0; f < 18 && tries < 1500; tries++) {
      const x = P.x0 + 200 + R() * (P.x1 - P.x0 - 400), z = P.z0 + 200 + R() * (P.z1 - P.z0 - 400), rd = nrDist(x, z); if (rd < 60 || rd > 170) continue;
      if (nrLC(x, z) === 3 || nrLC(x, z) === 1 || excluded(x, z) || wet(x, z, 25) || railNear(x, z, 30) || nrSlope(x, z) > 0.12 || nearBld(x, z, 70) || farms.some(q => Math.hypot(q[0] - x, q[1] - z) < 260)) continue;
      f++; const yaw = PDA + (R() < 0.5 ? 0 : Math.PI / 2) + (R() - 0.5) * 0.1, c = Math.cos(yaw), sn = Math.sin(yaw), at = (a, b) => [x + c * a - sn * b, z + sn * a + c * b];
      houseAt(R() < 0.6 ? 4 : 1, x, z, yaw, 0.9 + R() * 0.2);
      const [sx, sz] = at(6, 24); if (!excluded(sx, sz) && !wet(sx, sz, 6)) houseAt(2, sx, sz, yaw + Math.PI / 2, 0.7 + R() * 0.3);
      const [tx, tz] = at(-9, 3), ty = nrGround(tx, tz), gt = scen.get(tx, tz), TK = [0.68, 0.7, 0.7];   // the tank on a timber stand
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(gt, tx + a * 1.1, ty - 0.2, tz + b * 1.1, 0.2, 2.2, 0.2, 0, TIMd, null, true);
      box(gt, tx, ty + 1.95, tz, 2.8, 0.15, 2.8, 0, TIMd, null, true); cyl(gt, tx, ty + 2.1, tz, 1.5, 2.2, 10, TK, [0.6, 0.62, 0.62]); cone(gt, tx, ty + 4.3, tz, 1.55, 0.35, 10, [0.62, 0.64, 0.64], null, 0);
      const [wx, wz] = at(-22, -14), wy = nrGround(wx, wz), gw = scen.get(wx, wz), ST = [0.5, 0.5, 0.52];   // the windpump: a steel tower, its wheel and tail vane, a trough
      if (!excluded(wx, wz) && !wet(wx, wz, 4)) { for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cyl(gw, wx + a * 0.75, wy - 0.2, wz + b * 0.75, 0.07, 9.8, 4, ST, null, 0.05);
        for (let k = 0; k < 4; k++) { const y0 = wy + 1 + k * 2.2; box(gw, wx, y0, wz + 0.75, 1.5, 0.06, 0.06, 0, ST, null, true); box(gw, wx, y0, wz - 0.75, 1.5, 0.06, 0.06, 0, ST, null, true); box(gw, wx + 0.75, y0, wz, 0.06, 0.06, 1.5, 0, ST, null, true); box(gw, wx - 0.75, y0, wz, 0.06, 0.06, 1.5, 0, ST, null, true); }
        const ha = R() * TAU, hc = Math.cos(ha), hs = Math.sin(ha), WV = [0.78, 0.78, 0.76];
        for (let k = 0; k < 12; k++) { const a0 = k / 12 * TAU, a1 = a0 + TAU / 24, P0 = (a, r) => [wx + hs * Math.cos(a) * r, wy + 10 + Math.sin(a) * r, wz - hc * Math.cos(a) * r];
          const A = P0(a0, 0.4), B = P0(a1, 0.4), C = P0(a1, 1.6), D = P0(a0, 1.6); gw.quadO(A, B, C, D, WV, [wx + hc, wy + 10, wz + hs]); gw.quadO(A, D, C, B, WV, [wx - hc, wy + 10, wz - hs]); }
        box(gw, wx - hc * 1.3, wy + 9.9, wz - hs * 1.3, 2.4, 0.06, 0.06, Math.atan2(hs, hc), ST, null, true);
        gw.quadO([wx - hc * 2.4, wy + 9.6, wz - hs * 2.4], [wx - hc * 3.4, wy + 9.6, wz - hs * 3.4], [wx - hc * 3.4, wy + 10.5, wz - hs * 3.4], [wx - hc * 2.4, wy + 10.3, wz - hs * 2.4], WV, [wx + hs, wy + 10, wz - hc]);
        gw.quadO([wx - hc * 2.4, wy + 9.6, wz - hs * 2.4], [wx - hc * 2.4, wy + 10.3, wz - hs * 2.4], [wx - hc * 3.4, wy + 10.5, wz - hs * 3.4], [wx - hc * 3.4, wy + 9.6, wz - hs * 3.4], WV, [wx - hs, wy + 10, wz + hc]);
        box(gw, wx + 3, wy - 0.1, wz, 3, 0.55, 0.8, yaw, [0.56, 0.58, 0.6], [0.38, 0.46, 0.5]); exclPush(wx, wz, 4); }
      exclPush(tx, tz, 3); farms.push([x, z, yaw]);
    }
    // woolsheds (made up): a long iron shed by the road, its sheep yards beside it (post and rail pens; the sheep in them below)
    const yards = [];
    for (let f = 0, tries = 0; f < 3 && tries < 1500; tries++) {
      const x = P.x0 + 200 + R() * (P.x1 - P.x0 - 400), z = P.z0 + 200 + R() * (P.z1 - P.z0 - 400), rd = nrDist(x, z); if (rd < 45 || rd > 120) continue;
      if (nrLC(x, z) !== 0 || excluded(x, z) || wet(x, z, 20) || railNear(x, z, 25) || nrSlope(x, z) > 0.1 || nearBld(x, z, 40) || yards.some(q => Math.hypot(q[0] - x, q[1] - z) < 600)) continue;
      f++; const yaw = PDA + (R() < 0.5 ? 0 : Math.PI / 2), c = Math.cos(yaw), sn = Math.sin(yaw), at = (a, b) => [x + c * a - sn * b, z + sn * a + c * b];
      houseAt(2, x, z, yaw, 1.15);
      const [yx, yz] = at(0, 15), g = scen.get(yx, yz), RL = [0.56, 0.5, 0.42];   // the yards: 22 x 12 m, three pens, two rails
      const lineF = (a0, b0, a1, b1) => { const n = Math.max(1, Math.round(Math.hypot(a1 - a0, b1 - b0) / 2.4)); let pv = null;
        for (let k = 0; k <= n; k++) { const [px, pz] = at(a0 + (a1 - a0) * k / n, 15 + b0 + (b1 - b0) * k / n), py = nrGround(px, pz); box(g, px, py - 0.2, pz, 0.14, 1.35, 0.14, yaw, TIMd, null, true);
          if (pv) for (const h of [0.55, 1.0]) { const dx = px - pv[0], dz = pz - pv[2]; box(g, (px + pv[0]) / 2, (py + pv[1]) / 2 + h, (pz + pv[2]) / 2, Math.hypot(dx, dz), 0.1, 0.06, Math.atan2(dz, dx), RL, null, true); }
          pv = [px, py, pz]; } };
      lineF(-11, -6, 11, -6); lineF(-11, 6, 11, 6); lineF(-11, -6, -11, 6); lineF(11, -6, 11, 6); lineF(-3.7, -6, -3.7, 6); lineF(3.7, -6, 3.7, 6);
      exclPush(yx, yz, 14); yards.push([yx, yz, yaw]);
    }
    for (const H of HK) H.addTo(root, true);

    /* ---- the grandstand across the road from the pits: open timber tiers, a corrugated roof on posts, the crowd on the benches ---- */
    const crowdMat = ownTex(Tex.crowdPic(['#ece9e0', '#cfc7b2', '#8c8472', '#5f6268', '#2f3649', '#bda97c', '#7e2b25', '#4b5f7a', '#dcd5c2', '#3f4b3b'], 79)), crowdG = new GB(true);   // (the 1960s crowd: white shirts, khaki, grey, navy, hats)
    let nStands = 0;
    { const sa = -70, sb = 50, side = -1, rows = 8, dep = 0.9, rise = 0.5, prof = (s) => { const i = T.idx(s), f0 = (side > 0 ? T.br[i] : T.bl[i]) + 3; return { i, f0 }; };
      for (let d = sa; d < sb; d += 5) {
        const s0 = sAt(d), s1 = sAt(d + 5), A = prof(s0), B = prof(s1), g = scen.get(...atSf(s0, side * A.f0).slice(0, 2)), gy = Math.min(hyS(s0), hyS(s1)) + 0.1;
        const Q = (s, o, y) => { const [x, z] = atSf(s, side * o); return [x, y, z]; };
        for (let k = 0; k < rows; k++) { const o0 = A.f0 + k * dep, o1 = o0 + dep, y = gy + 0.5 + k * rise, ins = Q(s0, o0 + dep / 2, y - 3);
          g.quadO(Q(s0, o0, y), Q(s1, o0, y), Q(s1, o1, y), Q(s0, o1, y), [0.64, 0.58, 0.48], ins);
          g.quadO(Q(s0, o0, y - rise), Q(s1, o0, y - rise), Q(s1, o0, y), Q(s0, o0, y), [0.5, 0.45, 0.38], Q(s0, o0 + 1, y - 0.2));
          const len = 5, u0 = (d / 5) * 5 / 12, v = (k * 0.11) % 1;
          crowdG.quadUp(Q(s0, o0 + 0.05, y + 0.02), Q(s1, o0 + 0.05, y + 0.02), Q(s1, o1 - 0.05, y + 0.02), Q(s0, o1 - 0.05, y + 0.02), [W1, W1, W1, W1], [[u0, v], [u0 + len / 12, v], [u0 + len / 12, v + 0.1], [u0, v + 0.1]]); }
        const ob = A.f0 + rows * dep, yt = gy + 0.5 + rows * rise;
        g.quadO(Q(s0, ob, gy - 0.6), Q(s1, ob, gy - 0.6), Q(s1, ob, yt + 1), Q(s0, ob, yt + 1), [0.5, 0.45, 0.38], Q(s0, ob - 2, yt / 2));
        const oR = A.f0 + rows * dep * 0.45;   // (the roof over the back rows only: the cameras above still see the crowd in front)
        g.quadO(Q(s0, oR, yt + 3.4), Q(s1, oR, yt + 3.4), Q(s1, ob + 0.4, yt + 2.6), Q(s0, ob + 0.4, yt + 2.6), [0.46, 0.42, 0.38], Q(s0, (oR + ob) / 2, yt - 3));
        g.quadO(Q(s0, oR, yt + 3.3), Q(s1, oR, yt + 3.3), Q(s1, ob + 0.4, yt + 2.5), Q(s0, ob + 0.4, yt + 2.5), [0.36, 0.34, 0.3], Q(s0, (oR + ob) / 2, yt + 8));
        for (const o of [oR + 0.2, ob + 0.2]) { const [x, z] = atSf(s0, side * o); box(g, x, gy - 0.5, z, 0.2, yt + 3.2 - gy + 0.5, 0.2, T.hd[A.i], TIMd, null, true); }
        const [cx, cz] = atSf(s0, side * (A.f0 + rows * dep / 2)); exclPush(cx, cz, rows * dep / 2 + 6); CR.exclAdd(cx, cz, rows * dep / 2 + 3); crowdPts.push(cx, cz, 1);
      }
      nStands = 1; }
    addM(crowdG, crowdUV(new THREE.MeshLambertMaterial({ map: crowdMat, vertexColors: true }), 1, 0.11, 0.1));

    /* ---- the period's painted signs on boards by the fences (the game's own brands), where the crowds are ---- */
    { const spots = [[-200, 1], [140, -1], [LF.viaduct - 120, 1], [LF.town[1] + 40, -1], [LF.level + 160, 1], [LF.tannery + 120, -1], [LF.newry + 120, 1], [LF.newry + 320, -1], [LF.mount - 160, -1], [LF.mount + 120, -1]];
      spots.forEach(([d, sd], k) => { const s = sAt(d); if (sd > 0 && PD && T.pitAt(s)) return; const [x, z, i] = onSide(s, sd, 1.2), y = nrGround(x, z), g = scen.get(x, z);
        for (const a of [-1.6, 1.6]) box(g, x + T.tx[i] * a, y - 0.3, z + T.tz[i] * a, 0.12, 2.6, 0.12, T.hd[i], TIMd, null, true);
        const fx = -T.nx[i] * sd, fz = -T.nz[i] * sd; board(x, y + 1.1, z, -fx, -fz, 4, 1.2, LF_AT.ad + (k % Tex.SPONSORS.length)); exclPush(x, z, 3); CR.avoid(x, z, 2.2); }); }

    /* ---- spectators: on the banks and along the fences where the action is, packed in the town, scattered elsewhere ---- */
    { const M = { first: 1.2, gap: 1.15, excluded, below: 4, above: 14, sit: 0.3, flag: 0.03, maxSlope: 0.9 };
      const run = (d0, d1, side, o) => { const n = crowdRun(CR, sStart + d0, sStart + d1, side, Object.assign({}, M, o)); runs.push([d0, d1, side, o.rows || 3]); for (let d = d0; d < d1; d += 25) { const [x, z] = onSide(sAt(d), side, 3); crowdPts.push(x, z, Math.min(1, (o.dens || 0.5) * 1.6)); } return n; };
      run(-260, -80, -1, { rows: 5, dens: 0.5, label: 'pit straight left' }); run(60, 300, -1, { rows: 4, dens: 0.35, label: 'pit straight left 2' }); run(PD ? PD[2] + 20 : 200, LF.tower + 120, 1, { rows: 3, dens: 0.3, label: 'tower' });
      run(LF.viaduct - 170, LF.viaduct - 40, -1, { rows: 6, dens: 0.55, label: 'viaduct left' }); run(LF.viaduct - 170, LF.viaduct - 40, 1, { rows: 5, dens: 0.5, label: 'viaduct right' });
      run(LF.town[0] + 30, LF.town[1], -1, { rows: 3, dens: 0.7, first: 0.5, gap: 0.8, label: 'town left' }); run(LF.town[0] + 30, LF.town[1], 1, { rows: 3, dens: 0.7, first: 0.5, gap: 0.8, label: 'town right' });
      run(LF.level - 60, LF.level + 120, -1, { rows: 4, dens: 0.45, label: 'crossing' }); run(LF.level + 200, LF.tannery - 300, 1, { rows: 2, dens: 0.15, label: 'tannery straight' });
      run(LF.tannery - 120, LF.tannery + 60, -1, { rows: 5, dens: 0.55, label: 'tannery corner' }); run(brS[1][0] - 60, brS[1][0] - 5, 1, { rows: 4, dens: 0.45, label: 'long bridge' });
      run(LF.newry - 50, LF.newry + 30, -1, { rows: 6, dens: 0.6, label: 'newry' }); run(LF.newry + 30, LF.newry + 260, 1, { rows: 6, dens: 0.6, label: 'newry hill' });
      run(LF.newry + 400, LF.mount - 300, -1, { rows: 2, dens: 0.08, clump: 0.95, label: 'flying mile' }); run(LF.mount - 160, LF.mount + 60, -1, { rows: 6, dens: 0.6, label: 'mountford' });
      for (const e of CR.circ) exclPush(e.x, e.z, e.r);
    }

    /* ---- the paddocks: sheep, hay bales, the cars of the crowd parked behind them; telephone poles along the roads ---- */
    const openAt = (x, z, m) => nrLC(x, z) === 0 && !excluded(x, z) && !wet(x, z, 6) && !railNear(x, z, 8) && nrSlope(x, z) < 0.18 && nrDist(x, z) > (m || 40);
    const sheep = new IChunks(lfSheepGeo(), new THREE.MeshLambertMaterial({ vertexColors: true }), 256);
    let nSheep = 0;
    for (let f = 0, tries = 0; f < 44 && tries < 1200; tries++) {
      const x = P.x0 + 150 + R() * (P.x1 - P.x0 - 300), z = P.z0 + 150 + R() * (P.z1 - P.z0 - 300), rd = nrDist(x, z); if (rd < (f < 14 ? 34 : 45) || rd > (f < 14 ? 90 : 380) || !openAt(x, z, 34)) continue;
      f++; const n = 6 + Math.floor(R() * 14), a0 = R() * TAU;
      for (let k = 0; k < n; k++) { const r = 3 + R() * 16, a = R() * TAU, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (!openAt(px, pz, 28)) continue;
        sheep.add(px, nrGround(px, pz) - 0.05, pz, a0 + (R() - 0.5) * 1.6, 0.9 + R() * 0.25, 0.9 + R() * 0.2, [0.92 + R() * 0.12, 0.9 + R() * 0.1, 0.84 + R() * 0.1]); nSheep++; }
    }
    for (const [yx, yz, yaw] of yards) { const c = Math.cos(yaw), sn = Math.sin(yaw);   // the yards full of sheep waiting to be shorn
      for (let k = 0; k < 26; k++) { const a = (R() - 0.5) * 20, b = (R() - 0.5) * 10, px = yx + c * a - sn * b, pz = yz + sn * a + c * b;
        sheep.add(px, nrGround(px, pz) - 0.05, pz, R() * TAU, 0.95 + R() * 0.2, 0.95 + R() * 0.15, [0.9 + R() * 0.1, 0.87 + R() * 0.1, 0.8 + R() * 0.1]); nSheep++; } }
    sheep.addTo(root, false);
    let nHay = 0;
    { const hay = new IChunks(baleGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), 256);
      for (let f = 0, tries = 0; f < 14 && tries < 600; tries++) {
        const x = P.x0 + 150 + R() * (P.x1 - P.x0 - 300), z = P.z0 + 150 + R() * (P.z1 - P.z0 - 300), rd = nrDist(x, z); if (rd < 40 || rd > 360 || nrLC(x, z) !== 2 || excluded(x, z) || nrSlope(x, z) > 0.15) continue;
        f++; const rot = R() * TAU, c = Math.cos(rot), s = Math.sin(rot);
        for (let r = -2; r <= 2; r++) for (let q = -4; q <= 4; q++) { if (R() < 0.35) continue; const a = q * 9 + (R() - 0.5) * 2, b = r * 11 + (R() - 0.5) * 2, px = x + c * a - s * b, pz = z + s * a + c * b;
          if (nrLC(px, pz) !== 2 || excluded(px, pz)) continue; hay.add(px, nrGround(px, pz) - 0.05, pz, rot + (R() - 0.5) * 0.6, 1, 1, [0.95 + R() * 0.1, 0.92 + R() * 0.1, 0.86]); nHay++; }
        exclPush(x, z, 50); }
      hay.addTo(root, false); }
    let nCars = 0;
    { const cg = new GB(); box(cg, 0, 0.22, 0, 4.4, 0.72, 1.7, 0, [1, 1, 1], [1, 1, 1], true); box(cg, -0.2, 0.94, 0, 2.2, 0.56, 1.5, 0, [0.22, 0.26, 0.3], [1, 1, 1], true);
      for (const [x, z] of [[-1.4, -0.7], [-1.4, 0.7], [1.4, -0.7], [1.4, 0.7]]) box(cg, x, 0, z, 0.6, 0.6, 0.2, 0, [0.08, 0.08, 0.08], null, true);
      const cars = new IChunks(cg.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true }), 256);
      const CC = [[0.9, 0.86, 0.72], [0.62, 0.74, 0.82], [0.36, 0.5, 0.36], [0.5, 0.16, 0.14], [0.12, 0.12, 0.13], [0.82, 0.82, 0.8], [0.56, 0.6, 0.66], [0.84, 0.66, 0.36]];
      for (const [d, sd] of [[-150, -1], [LF.viaduct - 110, -1], [LF.level + 40, -1], [LF.tannery - 80, -1], [LF.newry + 150, 1], [LF.mount - 60, -1], [LF.mount - 300, 1]]) {
        const [x0, z0, i] = onSide(sAt(d), sd, 30), rot = T.hd[i] + Math.PI / 2;
        for (let r = 0; r < 3; r++) for (let q = -6; q <= 6; q++) { if (R() < 0.3) continue; const [x, z] = onSide(sAt(d + q * 2.6), sd, 26 + r * 6.5); if (!openAt(x, z, 18)) continue;
          cars.add(x, nrGround(x, z) - 0.05, z, -(rot + (R() - 0.5) * 0.1), 1, 1, CC[Math.floor(R() * CC.length)]); nCars++; }
        exclPush(x0, z0, 30); }
      cars.addTo(root, true); }
    let nPoles = 0;
    { const pg = new GB(); cyl(pg, 0, 0, 0, 0.13, 8.5, 6, [0.42, 0.36, 0.28], null, 0.1); box(pg, 0, 7.6, 0, 0.12, 0.12, 2.2, 0, [0.4, 0.34, 0.26], null, true);
      for (const z of [-0.9, -0.3, 0.3, 0.9]) box(pg, 0, 7.72, z, 0.06, 0.14, 0.06, 0, [0.85, 0.85, 0.82], null, true);
      const poles = new IChunks(pg.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true }), 256);
      for (let d = 30; d < L - 30; d += 48) { const s = sAt(d), i = T.idx(s); if (bridgeAt[i] || inR(d, LF.town[0], LF.town[1]) || Math.abs(d - LF.viaduct) < 60) continue;
        const sd = inR(d, LF.newry, LF.mount + L) || d < 0 ? -1 : 1; if (sd > 0 && PD && T.pitAt(s)) continue;
        const [x, z] = onSide(s, sd, 3.4); if (excluded(x, z) || wet(x, z, 3) || railNear(x, z, 4)) continue;
        poles.add(x, nrGround(x, z) - 0.4, z, -T.hd[i], 1, 1, null); nPoles++; CR.avoid(x, z, 0.6); }
      poles.addTo(root, true); }

    /* ---- the other roads near the circuit (OSM): tar on the main roads, gravel on the farm tracks, laid on the ground (not driven) ---- */
    let nRoads = 0;
    { const gr = new Chunks(256, true);
      for (const rd of def.roads) { const wd = rd[0], pts = rd.slice(1), gv = wd < 4, col = gv ? [0.9, 0.8, 0.62] : [0.86, 0.85, 0.84];
        for (let k = 0; k + 1 < pts.length; k++) { const a = pts[k], b = pts[k + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.3) continue;
          const tx = (b[0] - a[0]) / len, tz = (b[1] - a[1]) / len, nx = -tz * wd / 2, nz = tx * wd / 2;
          for (let d = 0; d < len - 0.01; d += 4) { const d1 = Math.min(len, d + 4), x0 = a[0] + tx * d, z0 = a[1] + tz * d, x1 = a[0] + tx * d1, z1 = a[1] + tz * d1;
            if (wet(x0, z0, 1) || wet(x1, z1, 1)) continue;
            const Y = (x, z) => nrGround(x, z) + 0.06, A = [x0 - nx, Y(x0 - nx, z0 - nz), z0 - nz], B = [x0 + nx, Y(x0 + nx, z0 + nz), z0 + nz], C = [x1 + nx, Y(x1 + nx, z1 + nz), z1 + nz], D = [x1 - nx, Y(x1 - nx, z1 - nz), z1 - nz], uv = (p) => [p[0] / 8, -p[2] / 8];
            gr.get(x0, z0).quadUp(A, B, C, D, [col, col, col, col], [uv(A), uv(B), uv(C), uv(D)]); nRoads++;
            if (!gv && (k + d) % 2 === 0) exclPush((x0 + x1) / 2, (z0 + z1) / 2, wd / 2 + 2.5); else exclPush((x0 + x1) / 2, (z0 + z1) / 2, wd / 2 + 1.5); } } }
      gr.addTo(root, new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }), false, true); }

    /* ---- hedges: OSM's, and hawthorn along stretches of the roads outside the fence (not where the crowds are); a lumpy ribbon ---- */
    let nHedge = 0;
    { const gh = new Chunks(256), HG = [0.34, 0.46, 0.2];
      const hedge = (pts) => { for (let k = 0; k + 1 < pts.length; k++) { const a = pts[k], b = pts[k + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.5) continue;
        const tx = (b[0] - a[0]) / len, tz = (b[1] - a[1]) / len, nx = -tz, nz = tx;
        for (let d = 0; d < len - 0.01; d += 3) { const d1 = Math.min(len, d + 3), x0 = a[0] + tx * d, z0 = a[1] + tz * d, x1 = a[0] + tx * d1, z1 = a[1] + tz * d1;
          if (excluded((x0 + x1) / 2, (z0 + z1) / 2) || wet(x0, z0, 2)) continue; const nn = nrNear(x0, z0); if (nn.i >= 0 && nn.dd < 1.2) continue;
          const y0 = nrGround(x0, z0), y1 = nrGround(x1, z1), h0 = 1.3 + crH(x0, z0, 41) * 0.9, h1 = 1.3 + crH(x1, z1, 41) * 0.9, g = gh.get(x0, z0), c0 = vary(HG, () => crH(x0, z0, 42), 0.3), c1 = vary(HG, () => crH(x1, z1, 42), 0.3);
          const S = [[-0.8, 0], [-0.8, 0.55], [-0.4, 0.95], [0.4, 0.95], [0.8, 0.55], [0.8, 0]], Q = (x, z, y, h, p) => [x + nx * p[0], y - 0.1 + h * p[1], z + nz * p[0]];
          for (let m = 0; m + 1 < S.length; m++) g.quadO(Q(x0, z0, y0, h0, S[m]), Q(x1, z1, y1, h1, S[m]), Q(x1, z1, y1, h1, S[m + 1]), Q(x0, z0, y0, h0, S[m + 1]), c0, [(x0 + x1) / 2, y0 + 0.2, (z0 + z1) / 2], null, [c0, c1, c1, c0].map((c, q) => q === 0 || q === 3 ? (m === 0 ? c.map(v => v * 0.75) : c) : (m === 0 ? c.map(v => v * 0.75) : c)));
          nHedge++; } } };
      for (const h of def.hedges) hedge(h);
      for (const [d0, d1, sd] of [[LF.newry + 300, LF.mount - 350, 1], [LF.newry + 500, LF.mount - 420, -1], [LF.level + 260, LF.tannery - 320, -1], [LF.tower + 160, LF.viaduct - 200, -1]]) {
        const pts = []; for (let d = d0; d < d1; d += 6) { const [x, z] = onSide(sAt(d), sd, 3.0); pts.push([x, z]); } hedge(pts); }
      gh.addTo(root, matV, true, true); }

    /* ---- the paddocks' fences (post and wire, along the fields' edges near the road; gaps for the gates) and the cattle grazing in them ---- */
    let nFence = 0, nCattle = 0; const wbreak = [], fen = new Chunks(512);   // (the fences and the cattle in big chunks of their own: few draw calls)
    { const WR = [0.66, 0.66, 0.64];
      const ok = (x, z) => { const rd = nrDist(x, z); return rd > 30 && rd < 130 && nrLC(x, z) !== 3 && !excluded(x, z) && !wet(x, z, 3) && !railNear(x, z, 6); };
      const edge = (u0, v0, u1, v1, key) => {   // a fence from (u0, v0) to (u1, v1) in the paddocks' frame
        const len = Math.hypot(u1 - u0, v1 - v0), n = Math.round(len / 5), gate = crH(key, 3, 72) * n; let prev = null;
        for (let k = 0; k <= n; k++) { const [x, z] = pdXZ(u0 + (u1 - u0) * k / n, v0 + (v1 - v0) * k / n);
          if (!ok(x, z) || Math.abs(k - gate) < 1) { prev = null; continue; }
          const y = nrGround(x, z), g = fen.get(x, z), pc = vary([0.5, 0.44, 0.36], () => crH(x, z, 73), 0.2); box(g, x, y - 0.25, z, 0.12, 1.25, 0.12, PDA, pc, [pc[0] * 0.8, pc[1] * 0.8, pc[2] * 0.8], true); nFence++;
          if (prev) { for (const h of [0.62, 0.95]) { const a = [prev[0], prev[1] + h, prev[2]], b = [x, y + h, z], dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1, ox = -dz / l * 0.025, oz = dx / l * 0.025;
            g.quadUp([a[0] - ox, a[1], a[2] - oz], [a[0] + ox, a[1], a[2] + oz], [b[0] + ox, b[1], b[2] + oz], [b[0] - ox, b[1], b[2] - oz], [WR, WR, WR, WR]); } }
          prev = [x, y, z]; } };
      const us = [], vs = []; for (const [x, z] of [[P.x0, P.z0], [P.x1, P.z0], [P.x0, P.z1], [P.x1, P.z1]]) { us.push(x * PDc + z * PDs); vs.push(-x * PDs + z * PDc); }
      const r0 = Math.floor(Math.min(...vs) / PDV), r1 = Math.ceil(Math.max(...vs) / PDV), c0 = Math.floor(Math.min(...us) / PDU) - 2, c1 = Math.ceil(Math.max(...us) / PDU) + 1;
      for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) { const ua = c * PDU - pdOff(r), ub = ua + PDU, va = r * PDV, vb = va + PDV, [mx, mz] = pdXZ((ua + ub) / 2, (va + vb) / 2), rd = nrDist(mx, mz);
        if (rd > 230) continue;
        const kb = crH(c, r, 74), kl = crH(c, r, 75);
        if (kb < 0.8) edge(ua, va, ub, va, c * 1000 + r); else if (rd > 50 && rd < 200) wbreak.push([ua, va, ub, va]);   // (the bottom edge: a fence, or a row of pines)
        if (kl < 0.8) edge(ua, va, ua, vb, c * 1000 + r + 0.5); else if (rd > 50 && rd < 200) wbreak.push([ua, va, ua, vb]); } }
    { const CC = [[0.1, 0.09, 0.09], [0.1, 0.09, 0.09], [0.42, 0.2, 0.12], [0.5, 0.3, 0.18], [0.78, 0.7, 0.58]];
      const beast = (x, y, z, rot, sc, col) => {   // a beast (2.3 m, facing rot): the body, the head down to the grass, four legs
        const g = fen.get(x, z), c = Math.cos(rot), sn = Math.sin(rot), at = (a, b) => [x + (c * a - sn * b) * sc, z + (sn * a + c * b) * sc], lg = col.map(v => v * 0.7);
        let [px, pz] = at(0, 0); box(g, px, y + 0.62 * sc, pz, 1.75 * sc, 0.72 * sc, 0.72 * sc, rot, col); [px, pz] = at(1.0, 0); box(g, px, y + 0.5 * sc, pz, 0.42 * sc, 0.4 * sc, 0.36 * sc, rot, col);
        for (const [a, b] of [[0.68, 0.24], [0.68, -0.24], [-0.68, 0.24], [-0.68, -0.24]]) { [px, pz] = at(a, b); box(g, px, y, pz, 0.15 * sc, 0.66 * sc, 0.15 * sc, rot, lg, null, true); } };
      for (let f = 0, tries = 0; f < 16 && tries < 900; tries++) {
        const x = P.x0 + 150 + R() * (P.x1 - P.x0 - 300), z = P.z0 + 150 + R() * (P.z1 - P.z0 - 300), rd = nrDist(x, z); if (rd < 45 || rd > 150 || !openAt(x, z, 45)) continue;
        const q = paddock(x, z); if (q.du < 12 || q.dv < 12) continue;
        f++; const n = 5 + Math.floor(R() * 10), a0 = R() * TAU, herd = R() < 0.6 ? 0 : 2 + Math.floor(R() * 2);
        for (let k = 0; k < n; k++) { const r = 2 + R() * 18, a = R() * TAU, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (!openAt(px, pz, 40)) continue;
          const qq = paddock(px, pz); if (qq.c !== q.c || qq.r !== q.r || Math.min(qq.du, qq.dv) < 2) continue;
          beast(px, nrGround(px, pz) - 0.05, pz, a0 + (R() - 0.5) * 2, 0.95 + R() * 0.15, vary(CC[R() < 0.85 ? herd : Math.floor(R() * CC.length)], R, 0.12)); nCattle++; } }
      fen.addTo(root, matV, true, true); }

    /* ---- round the crowds: the grass trodden flat, picnic rugs and beach umbrellas behind the rows; boards counting down to the slow corners;
       the racing cars' open trailers and their towing cars behind the pit shed ---- */
    let nRugs = 0, nDist = 0, nTrail = 0;
    { const RUG = [[0.66, 0.16, 0.14], [0.2, 0.3, 0.52], [0.26, 0.4, 0.22], [0.82, 0.7, 0.4], [0.5, 0.2, 0.36], [0.86, 0.84, 0.78]], UMB = [[0.86, 0.22, 0.18], [0.94, 0.8, 0.2], [0.22, 0.42, 0.7], [0.92, 0.9, 0.86], [0.3, 0.56, 0.32]];
      for (const [d0, d1, side, rows] of runs) {
        for (let d = d0; d <= d1; d += 8) { const [x, z] = onSide(sAt(d), side, rows * 1.2 + 1);   // (the trodden grass: a 16 m cell's neighbours too, for the radius)
          for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const kk = (Math.floor(x / 16) + a) + ',' + (Math.floor(z / 16) + b); let Lc = TRH.get(kk); if (!Lc) TRH.set(kk, Lc = []); Lc.push(x, z, rows * 1.2 + 5); } }
        for (let d = d0 + 4; d < d1 - 4; d += 6 + crH(d, side, 91) * 8) {
          if (crH(d, side, 92) < 0.35) continue; const s0 = sAt(d), i = T.idx(s0), [x, z] = onSide(s0, side, rows * 1.15 + 2.5 + crH(d, side, 93) * 5);
          if (wet(x, z, 2) || railNear(x, z, 4) || nrSlope(x, z) > 0.35 || nearBld(x, z, 3)) continue; const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 2.5) continue;
          const g = scen.get(x, z), a = T.hd[i] + (crH(d, side, 94) - 0.5) * 0.8, c = Math.cos(a), sn = Math.sin(a), col = RUG[Math.floor(crH(d, side, 95) * RUG.length)], c2 = col.map(v => v * 0.82);
          const P = (u, v) => { const px = x + c * u - sn * v, pz = z + sn * u + c * v; return [px, nrGround(px, pz) + 0.05, pz]; };
          for (let q = 0; q < 2; q++) { const u0 = -1.0 + q, u1 = u0 + 1; g.quadUp(P(u0, -0.75), P(u1, -0.75), P(u1, 0.75), P(u0, 0.75), q ? [c2, c2, c2, c2] : [col, col, col, col]); } nRugs++;   // (a rug of two tones)
          if (crH(d, side, 96) < 0.4) { const ux = x + c * 1.4, uz = z + sn * 1.4, uy = nrGround(ux, uz), uc = UMB[Math.floor(crH(d, side, 97) * UMB.length)];
            cyl(g, ux, uy - 0.1, uz, 0.03, 2.1, 4, [0.85, 0.85, 0.82]);
            for (let k = 0; k < 8; k++) { const a0 = k / 8 * TAU, a1 = (k + 1) / 8 * TAU, cc = k % 2 ? uc : [0.94, 0.93, 0.9];
              g.triO([ux + Math.cos(a0) * 1.15, uy + 1.75, uz + Math.sin(a0) * 1.15], [ux, uy + 2.15, uz], [ux + Math.cos(a1) * 1.15, uy + 1.75, uz + Math.sin(a1) * 1.15], cc, [ux, uy, uz]); } }
        } }
      // the boards counting down to the slow corners (300, 200, 100 m), on the verge on the outside of the approach (inside the fence)
      for (const [ap, dir] of [def.bends[2], def.bends[3], def.bends[5], def.bends[7]]) for (let k = 1; k <= 3; k++) {
        const d = ap - 45 - k * 100, s0 = sAt(d), i = T.idx(s0), side = -dir; if (bridgeAt[i] || (side > 0 && PD && T.pitAt(s0))) continue;
        const [x, z] = onSide(s0, side, -1.6); if (wet(x, z, 1) || railNear(x, z, 3) || nearBld(x, z, 1)) continue;
        const y = nrGround(x, z), g = scen.get(x, z);
        for (const e of [-0.6, 0.6]) cyl(g, x + T.tx[i] * e, y - 0.2, z + T.tz[i] * e, 0.05, 1.5, 4, WHT);
        box(g, x, y + 1.0, z, 1.8, 0.55, 0.06, Math.atan2(T.nz[i], T.nx[i]) + Math.PI / 2, WHT, null, true);
        board(x - T.tx[i] * 0.05, y + 1.03, z - T.tz[i] * 0.05, T.tx[i], T.tz[i], 1.7, 0.48, LF_AT.dist + k - 1, false); exclPush(x, z, 2); CR.avoid(x, z, 1.2); nDist++; }
      // behind the pit shed: open trailers with the racing car on them, the towing car in front
      if (PD) for (let q = PD[1] + 15; q < PD[2] - 15; q += 24) { const s0 = sStart + q, p = T.pitAt(s0); if (!p) continue;
        const [x, z, , i] = atSf(s0, p.o + 3.5 + 9 + 6.2 + 5.5), hd = T.hd[i]; if (excluded(x, z) || wet(x, z, 3)) continue;
        const g = scen.get(x, z), y = nrGround(x, z), c = Math.cos(hd), sn = Math.sin(hd), at = (a) => [x + c * a, z + sn * a], CAR = [[0.12, 0.3, 0.2], [0.72, 0.12, 0.1], [0.18, 0.28, 0.56], [0.86, 0.84, 0.78], [0.2, 0.2, 0.22]][nTrail % 5];
        let [px, pz] = at(-1.5); box(g, px, y + 0.45, pz, 4.6, 0.12, 1.9, hd, [0.36, 0.34, 0.32]);   // the trailer's bed, its wheels
        for (const e of [-1, 1]) box(g, px - sn * e * 1.0, y - 0.05, pz + c * e * 1.0, 0.65, 0.65, 0.22, hd, [0.08, 0.08, 0.08], null, true);
        box(g, px, y + 0.57, pz, 3.6, 0.42, 1.25, hd, CAR); [px, pz] = at(-1.2); box(g, px, y + 0.99, pz, 0.6, 0.3, 0.6, hd, [0.1, 0.1, 0.12], null, true);   // the racing car (a slim cigar shape, its cockpit)
        [px, pz] = at(2.2); box(g, px, y + 0.4, pz, 2.4, 0.08, 0.1, hd, [0.3, 0.3, 0.3], null, true);   // the drawbar
        [px, pz] = at(5.0); box(g, px, y + 0.22, pz, 4.4, 0.72, 1.7, hd, [0.5, 0.52, 0.5], [0.58, 0.6, 0.58], true); [px, pz] = at(4.8); box(g, px, y + 0.94, pz, 2.2, 0.56, 1.5, hd, [0.22, 0.26, 0.3], null, true);   // the towing car
        for (const [a, e] of [[3.6, -1], [3.6, 1], [6.4, -1], [6.4, 1]]) { [px, pz] = at(a); box(g, px - sn * e * 0.75, y - 0.05, pz + c * e * 0.75, 0.6, 0.6, 0.2, hd, [0.08, 0.08, 0.08], null, true); }
        exclPush(x + c * 2, z + sn * 2, 6); nTrail++; } }

    /* ---- tents and stalls behind the big crowds (plain canvas, no names); a tractor and a hay wagon by some farms; in the town: bicycles against the
       walls, pillar boxes, dogs, washing lines behind the houses ---- */
    let nTents = 0, nTown = 0;
    { const CAN = [[0.9, 0.88, 0.8], [0.82, 0.3, 0.24], [0.26, 0.42, 0.62], [0.36, 0.5, 0.32]];
      for (const [d0, d1, side, rows] of runs) { if (rows < 5) continue;
        for (let d = d0 + 10; d < d1 - 6; d += 34) { const s0 = sAt(d), i = T.idx(s0), [x, z] = onSide(s0, side, rows * 1.2 + 9 + crH(d, side, 111) * 4);
          if (wet(x, z, 4) || railNear(x, z, 6) || nearBld(x, z, 5) || nrSlope(x, z) > 0.25) continue; const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 5) continue;
          const g = scen.get(x, z), y = nrGround(x, z), rot = Math.atan2(T.nz[i], T.nx[i]), c = Math.cos(rot), sn = Math.sin(rot), col = CAN[Math.floor(crH(d, side, 112) * CAN.length)], W2 = [0.94, 0.92, 0.86];
          box(g, x, y - 0.1, z, 3.2, 2.2, 3.2, rot, W2, null, true);   // the walls, a counter at the front, the striped gable roof
          const fx = -side * c, fz = -side * sn; box(g, x + fx * 1.75, y - 0.1, z + fz * 1.75, 0.5, 1.0, 3.0, rot, col, null, true);
          for (let q = 0; q < 4; q++) { const t0 = -1.7 + q * 0.85, t1 = t0 + 0.85, cc = q % 2 ? col : W2, ux = -sn, uz = c;   // (the ridge along the tent's length)
            for (const e of [-1, 1]) g.quadO([x + c * 1.8 * e + ux * t0, y + 2.1, z + sn * 1.8 * e + uz * t0], [x + c * 1.8 * e + ux * t1, y + 2.1, z + sn * 1.8 * e + uz * t1], [x + ux * t1, y + 3.2, z + uz * t1], [x + ux * t0, y + 3.2, z + uz * t0], cc, [x, y, z]); }
          exclPush(x, z, 3.5); nTents++; } }
      for (const [fx, fz, yaw] of farms.slice(0, 8)) { const c = Math.cos(yaw), sn = Math.sin(yaw), at = (a, b) => [fx + c * a - sn * b, fz + sn * a + c * b];
        const [x, z] = at(16, 8); if (excluded(x, z) || wet(x, z, 3)) continue; const g = scen.get(x, z), y = nrGround(x, z), GY = [0.5, 0.52, 0.5], RD = [0.6, 0.18, 0.12], K = [0.1, 0.1, 0.1];
        const T2 = (a, b) => { const px = x + c * a - sn * b, pz = z + sn * a + c * b; return [px, pz]; };
        let [px, pz] = T2(0.3, 0); box(g, px, y + 0.55, pz, 1.9, 0.55, 0.7, yaw, GY); [px, pz] = T2(-0.6, 0); box(g, px, y + 1.1, pz, 0.4, 0.25, 0.45, yaw, K);   // a little grey tractor
        for (const e of [-1, 1]) { [px, pz] = T2(-0.55, 0.75 * e); box(g, px, y, pz, 1.25, 1.25, 0.32, yaw, K, null, true); [px, pz] = T2(0.95, 0.5 * e); box(g, px, y, pz, 0.7, 0.7, 0.2, yaw, K, null, true); }
        [px, pz] = T2(-4.6, 0); box(g, px, y + 0.6, pz, 4.5, 0.12, 2.1, yaw, RD);   // the hay wagon behind it, loaded
        for (const e of [-1, 1]) { const [wx, wz] = T2(-4.6 + 1.4 * e, 0); for (const f of [-1, 1]) box(g, wx - sn * f * 1.1, y, wz + c * f * 1.1, 0.75, 0.75, 0.15, yaw, K, null, true); }
        for (let q = -1; q <= 1; q++) for (const e of [-0.5, 0.5]) { const [bx, bz] = T2(-4.6 + q * 1.3, e * 0.95); box(g, bx, y + 0.72, bz, 1.15, 0.45, 0.85, yaw, [0.86, 0.76, 0.46], [0.92, 0.82, 0.52]); }
        exclPush(x - c * 2, z - sn * 2, 6); }
      // the town
      const BIK = [[0.1, 0.1, 0.1], [0.18, 0.3, 0.2], [0.44, 0.12, 0.12], [0.2, 0.22, 0.4]], DOG = [[0.4, 0.27, 0.16], [0.1, 0.1, 0.1], [0.86, 0.82, 0.72], [0.62, 0.46, 0.28]];
      const ring = (g, x, y, z, ux, uz, r, col) => { for (let k = 0; k < 10; k++) { const a0 = k / 10 * TAU, a1 = (k + 1) / 10 * TAU, Q = (a, rr) => [x + ux * Math.cos(a) * rr, y + Math.sin(a) * rr, z + uz * Math.cos(a) * rr];
        const A = Q(a0, r - 0.045), B = Q(a1, r - 0.045), C = Q(a1, r), D = Q(a0, r); g.quadO(A, B, C, D, col, [x - uz, y, z + ux]); g.quadO(A, D, C, B, col, [x + uz, y, z - ux]); } };
      for (let d = LF.town[0]; d < LF.town[1]; d += 9) for (const side of [-1, 1]) { const s0 = sAt(d), i = T.idx(s0); if (kindAt(i, side) !== 3) continue; const r = crH(d, side, 113);
        const [x, z] = onSide(s0, side, -0.45), gy = T.hy[i] + 0.13, g = scen.get(x, z), tx = T.tx[i], tz = T.tz[i];
        if (r < 0.22) { const col = BIK[Math.floor(crH(d, side, 114) * BIK.length)];   // a bicycle leaning on the wall
          for (const e of [-0.52, 0.52]) ring(g, x + tx * e, gy + 0.34, z + tz * e, tx, tz, 0.34, [0.12, 0.12, 0.12]);
          const L2 = (a, b, ya, yb) => g.quadO([x + tx * a, gy + ya, z + tz * a], [x + tx * b, gy + yb, z + tz * b], [x + tx * b, gy + yb + 0.045, z + tz * b], [x + tx * a, gy + ya + 0.045, z + tz * a], col, [x - T.nx[i] * side, gy + 0.4, z - T.nz[i] * side]);
          L2(-0.52, 0.0, 0.34, 0.36); L2(0.0, 0.52, 0.36, 0.34); L2(-0.52, -0.1, 0.34, 0.78); L2(0.0, 0.4, 0.36, 0.86); L2(-0.15, 0.4, 0.78, 0.86); nTown++; }
        else if (r < 0.3) { cyl(g, x, gy - 0.05, z, 0.24, 1.25, 8, [0.72, 0.1, 0.08]); cone(g, x, gy + 1.2, z, 0.27, 0.2, 8, [0.66, 0.08, 0.06], null, 0); box(g, x - T.nx[i] * side * 0.2, gy + 0.95, z - T.nz[i] * side * 0.2, 0.22, 0.04, 0.06, Math.atan2(tz, tx), [0.1, 0.1, 0.1], null, true); nTown++; }   // a red pillar box
        else if (r < 0.38) { const col = DOG[Math.floor(crH(d, side, 115) * DOG.length)], h = Math.atan2(tz, tx) + (crH(d, side, 116) - 0.5) * 2, c = Math.cos(h), sn = Math.sin(h), [dx, dz] = onSide(s0, side, -1.1);   // a dog on the footpath
          box(g, dx, gy + 0.28, dz, 0.62, 0.24, 0.22, h, col); box(g, dx + c * 0.38, gy + 0.42, dz + sn * 0.38, 0.22, 0.2, 0.18, h, col);
          for (const [a, b] of [[0.22, 0.08], [0.22, -0.08], [-0.22, 0.08], [-0.22, -0.08]]) box(g, dx + c * a - sn * b, gy, dz + sn * a + c * b, 0.07, 0.3, 0.07, h, col, null, true); nTown++; } }
      for (const [bx, bz, br] of blds) { if (!townAt(bx, bz) || crH(bx, bz, 117) > 0.32) continue; const nn = nrNear(bx, bz); if (nn.i < 0) continue;   // washing lines behind the houses (away from the road)
        const ax = bx - T.px[nn.i], az = bz - T.pz[nn.i], al = Math.hypot(ax, az) || 1, ux = ax / al, uz = az / al, cx = bx + ux * (br + 7), cz = bz + uz * (br + 7);
        if (nearBld(cx, cz, 2) || wet(cx, cz, 2) || railNear(cx, cz, 4)) continue; const g = scen.get(cx, cz), y = nrGround(cx, cz), vx = -uz, vz = ux;
        for (const e of [-2.2, 2.2]) { cyl(g, cx + vx * e, y - 0.2, cz + vz * e, 0.05, 2.2, 4, [0.6, 0.58, 0.54]); box(g, cx + vx * e, y + 1.9, cz + vz * e, 0.06, 0.06, 0.8, Math.atan2(vz, vx), [0.6, 0.58, 0.54], null, true); }
        const CL = [[0.95, 0.95, 0.92], [0.5, 0.66, 0.86], [0.9, 0.6, 0.66], [0.94, 0.86, 0.5], [0.95, 0.95, 0.92]];
        for (let q = 0; q < 5; q++) { if (crH(bx, q, 118) < 0.25) continue; const e0 = -1.8 + q * 0.8, e1 = e0 + 0.55, hh = 0.45 + crH(bx, q, 119) * 0.35, col = CL[q];
          const A = [cx + vx * e0, y + 2.05, cz + vz * e0], B = [cx + vx * e1, y + 2.05, cz + vz * e1], C = [B[0], y + 2.05 - hh, B[2]], D = [A[0], y + 2.05 - hh, A[2]];
          g.quadO(A, B, C, D, col, [cx + ux, y + 1.8, cz + uz]); g.quadO(A, D, C, B, col, [cx - ux, y + 1.8, cz - uz]); }
        nTown++; } }

    /* ---- the marshals' posts: a small timber shelter under an iron roof on the outside of the bends, a flag pole with the yellow flag furled ---- */
    let nMarsh = 0;
    for (let d = 260; d < L - 120; d += 520) {
      let best = null; for (let e = -120; e <= 120; e += 20) { const i = T.idx(sAt(d + e)); const c = T.corners.find(q => i >= q.i0 && i <= (q.i1 < q.i0 ? q.i1 + N : q.i1)); if (c) { best = { e, side: -c.dir }; break; } }
      const e = best ? best.e : 0, side = best ? best.side : (crH(d, 1, 88) < 0.5 ? -1 : 1), s0 = sAt(d + e), i = T.idx(s0);
      if (bridgeAt[i] || inR(d + e, LF.town[0] - 20, LF.town[1] + 20) || (side > 0 && PD && T.pitAt(s0))) continue;
      const [x, z] = onSide(s0, side, 3.2); if (excluded(x, z) || wet(x, z, 3) || railNear(x, z, 5)) continue;
      const y = nrGround(x, z), g = scen.get(x, z), hd = T.hd[i], rot = hd, c = Math.cos(hd), sn = Math.sin(hd), nx = T.nx[i] * side, nz = T.nz[i] * side;
      box(g, x, y - 0.2, z, 1.8, 2.5, 1.5, rot, [0.62, 0.56, 0.46], null, true); box(g, x - nx * 0.1, y + 2.25, z - nz * 0.1, 2.2, 0.08, 2.0, rot, [0.66, 0.66, 0.68], [0.7, 0.7, 0.72]);
      box(g, x - nx * 0.78, y + 0.9, z - nz * 0.78, 1.4, 0.7, 0.05, rot, [0.16, 0.16, 0.16], null, true);   // (the open front, dark)
      const px = x + c * 1.4, pz = z + sn * 1.4; cyl(g, px, y - 0.2, pz, 0.04, 3.6, 4, [0.85, 0.85, 0.82]); box(g, px, y + 2.6, pz, 0.08, 0.8, 0.08, 0, [0.95, 0.82, 0.12], null, true);
      exclPush(x, z, 3); CR.avoid(x, z, 2); nMarsh++;
    }

    /* ---- the trees: poplars in rows, elms and oaks round the homesteads and on the land cover's trees, willows along the rivers, a few gums ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const tk = [0, 1, 2, 3].map(k => new IChunks(lfTreeGeo(k), tMat, 128)), tf = [new IChunks(lfTreeGeo(4), tMat, 192), new IChunks(lfTreeGeo(5), tMat, 192)];
    let nTrees = 0;
    const LFH = [W1, W1, [1.12, 1.06, 0.84], [0.9, 0.98, 1.08], [0.84, 0.9, 0.86], [1.06, 1.0, 0.8]];   // the crowns' hues: as they are, yellow-green, blue-green, dark, late-summer gold
    const tree = (kd, x, z, h, wdt, tint) => { if (excluded(x, z) || wet(x, z, 1)) return; const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 4) return;
      const far = nrDist(x, z) > 90, y = nrGround(x, z), cv = 0.86 + R() * 0.28, t = tint || LFH[Math.floor(crH(x, z, 98) * LFH.length)], col = [cv * (0.95 + R() * 0.1) * t[0], cv * t[1], cv * (0.95 + R() * 0.1) * t[2]];
      if (far && (kd === 1 || kd === 0)) tf[kd === 0 ? 1 : 0].add(x, y - 0.1, z, R() * TAU, wdt, h, col); else tk[kd].add(x, y - 0.1, z, R() * TAU, wdt, h, col);
      nrShade(x, z, wdt * 0.32, 1); nTrees++; };
    for (const r of def.rows) for (let k = 0; k + 1 < r.length; k++) { const a = r[k], b = r[k + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let d = 0; d < len; d += 6) tree(0, a[0] + (b[0] - a[0]) * d / len, a[1] + (b[1] - a[1]) * d / len, 22 + R() * 6, 3.7); }
    for (const [x, z] of def.trees) tree(1, x, z, 16 + R() * 6, 14);
    for (const side of [-1, 1]) for (let d = 20; d < L - 20; d += 14 + R() * 30) {   // the trees along the roads (elms and oaks, a poplar here and there), outside the fence; fewer by the crowds and in town
      const s = sAt(d), i = T.idx(s); if (bridgeAt[i] || inR(d, LF.town[0] - 30, LF.town[1] + 30) || (side > 0 && PD && T.pitAt(s)) || R() < 0.35) continue;
      const [x, z] = onSide(s, side, 4 + R() * 6); if (nrLC(x, z) === 2 && R() < 0.6) continue; const pop = R() < 0.25; tree(pop ? 0 : 1, x, z, pop ? 20 + R() * 8 : 12 + R() * 8, pop ? 4.5 : 11 + R() * 5); }
    for (const [, pts] of def.rivers) for (let k = 0; k < pts.length; k++) { const p = pts[k], q = pts[Math.min(pts.length - 1, k + 1)], tx = q[0] - p[0], tz = q[1] - p[1], l = Math.hypot(tx, tz) || 1;   // willows on both banks
      if (nrDist(p[0], p[1]) > 300) continue; for (const sd of [-1, 1]) { if (R() < 0.45) continue; const o = p[2] + 2 + R() * 4; tree(2, p[0] - tz / l * sd * o, p[1] + tx / l * sd * o, 9 + R() * 5, 11 + R() * 4); } }
    for (const [ua, va, ub, vb] of wbreak) { const len = Math.hypot(ub - ua, vb - va);   // windbreaks: dark pines and cypresses along some of the paddocks' edges
      for (let d = 2; d < len - 2; d += 5.5) { const [x, z] = pdXZ(ua + (ub - ua) * d / len, va + (vb - va) * d / len); if (nrLC(x, z) === 3 || railNear(x, z, 8) || nrDist(x, z) < 92) continue;
        tree(R() < 0.7 ? 1 : 0, x, z, 13 + R() * 6, R() < 0.7 ? 8 + R() * 3 : 5, [0.62, 0.74, 0.7]); } }
    for (const [fx, fz] of farms) for (let k = 0; k < 7; k++) { const a = R() * TAU, r = 16 + R() * 18; tree(R() < 0.25 ? 0 : 1, fx + Math.cos(a) * r, fz + Math.sin(a) * r, 15 + R() * 7, 12 + R() * 5); }   // the homesteads' elms
    { const Lt = NRC * NRT, maxT = Math.round(9000 * dens);
      for (let tj = 0; tj < G.ntz && nTrees < maxT; tj++) for (let ti = 0; ti < G.ntx && nTrees < maxT; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue; const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt; zz += 9) for (let xx = xa; xx < xa + Lt; xx += 9) {
          const x = xx + (R() - 0.5) * 7, z = zz + (R() - 0.5) * 7, rd = nrDist(x, z), r1 = R(), cl = nrLC(x, z); if (rd > 280) continue;
          const p = cl === 1 ? (rd > 90 ? 0.35 : 0.6) : cl === 3 ? 0.05 : 0.004; if (r1 > p) continue;
          const wr = lfNear(LFQ.riv, x, z), byW = wr.e && wr.d < 40;
          const kd = byW ? (R() < 0.6 ? 2 : 1) : cl === 3 ? (R() < 0.3 ? 0 : 1) : rd > 140 && R() < 0.4 ? 3 : R() < 0.22 ? 0 : 1;
          tree(kd, x, z, kd === 0 ? 20 + R() * 8 : kd === 3 ? 18 + R() * 10 : kd === 2 ? 9 + R() * 5 : 13 + R() * 7, kd === 0 ? 4.5 : kd === 3 ? 11 : kd === 2 ? 12 : 13 + R() * 4);
        } } }
    for (const t of tk) t.addTo(root, true);
    for (const t of tf) t.addTo(root, false);

    /* ---- knockable straw bales on the verge at the slow corners' exits (Core simulates them: Race.setProps) ---- */
    out.propR = 150;
    out.propFloor = propFloorTable(null, (i, side) => API.rbVerge(i, side));
    { let n = 0;
      for (const c of T.corners) { if (c.sev < 3) continue; const side = -c.dir, i1c = c.i1 < c.i0 ? c.i1 + N : c.i1;
        for (let k = 0; k < 4; k++) { const s = (i1c + 4) * ds + k * 1.3, i = T.idx(s), bar = side > 0 ? T.br[i] : T.bl[i], lat = Math.min(w + 2.2, bar - 0.9); if (lat < w + 1.1 || bridgeAt[i] || (side > 0 && PD && T.pitAt(s))) continue;
          const [x, z, hd, ii] = atSf(s, side * lat), f = out.propFloor({ i: ii, d: side * (lat - 0.6) }, true), f2 = out.propFloor({ i: ii, d: side * (lat + 0.6) }, true); if (Math.abs(f - f2) > 0.15 || f < -0.6) continue;
          out.props.push({ kind: 'bale', x, z, yaw: hd, col: 0, i: ii }); n++; } }
      out.propStats = { bales: n }; }

    /* ---- terrain tiles and the verges (a gravel shoulder, then the grass out past the fence), coloured now ---- */
    let nTiles = 0;
    { const grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let k = 0; k < tiles.length; k += 3) { const m = new THREE.Mesh(nrTileGeo(tiles[k], tiles[k + 1], tiles[k + 2] === 1 ? 1 : 4), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); nTiles++; }
      const SH = [0.98, 0.9, 0.74], FP = [1.06, 1.02, 1.0];   // (the gravel shoulder; in the town a footpath)
      for (let c0 = 0; c0 < N; c0 += CH) {
        const gv = new RB(true), pv = [-1, -1];
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) { const i = ii % N;
          for (const side of [-1, 1]) { const si = side > 0 ? 1 : 0; if (bridgeAt[i]) { pv[si] = -1; continue; }
            const tw = kindAt(i, side) === 3, vr = API.rbVerge(i, side), pr = [vr[0], [w + 0.9, -0.05], vr[2], vr[3], vr[4]], pts = pr.map(([o, h]) => Pt(i, side * o, h)), cols = pts.map((p, k) => k < 2 || (tw && k < 3) ? (tw ? FP : SH) : nrGCol(p[0], p[2]));
            const ordered = side > 0 ? { p: pts, c: cols } : { p: pts.slice().reverse(), c: cols.slice().reverse() };
            const rv = gv.row(ordered.p, ordered.c, ordered.p.map(p => [p[0] / 14, -p[2] / 14])); if (pv[si] >= 0) gv.link(pv[si], rv, 0, pr.length - 1); pv[si] = rv; } }
        addM(gv, gMat); }
      // the rivers' banks: from the water's edge (a muddy lip) up over the ground's 8 m cells, so that the shore runs smooth, not in steps
      { const gk = new GB(true), UP = [0, 1, 0], OF = [-2.2, -0.5, 1.1, 2.6], MUD = [1.0, 0.66, 0.46], SILT = [1.02, 0.84, 0.56], uv = (q) => [q[0] / 14, -q[2] / 14];
        for (const [, pts] of def.rivers) {
          const rs = []; for (let k = 0; k + 1 < pts.length; k++) { const a = pts[k], b = pts[k + 1], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 6));
            for (let j = 0; j < n; j++) { const t = j / n; rs.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)]); } }
          rs.push([...pts[pts.length - 1].slice(0, 2), pts[pts.length - 1][2], pts[pts.length - 1][3]]);
          const nrm = (k) => { const p = rs[Math.max(0, k - 1)], q = rs[Math.min(rs.length - 1, k + 1)], tx = q[0] - p[0], tz = q[1] - p[1], l = Math.hypot(tx, tz) || 1; return [-tz / l, tx / l]; };
          for (const sd of [-1, 1]) { let prev = null;
            for (let k = 0; k < rs.length; k++) { const [x, z, hw, wy] = rs[k], n = nrm(k);
              const row = OF.map((o, j) => { const px = x + n[0] * sd * (hw + o), pz = z + n[1] * sd * (hw + o), gx = (px - G.x0) / NRC, gz = (pz - G.z0) / NRC;
                if (gx < 1 || gz < 1 || gx > G.nx - 2 || gz > G.nz - 2) return null;
                const gc = nrGCol(px, pz), c = j === 0 ? MUD : j === 1 ? SILT : j === 2 ? [gc[0] * 0.86, gc[1] * 0.95, gc[2] * 0.8] : gc;
                return { p: [px, j === 0 ? wy + 0.05 : Math.max(wy + 0.06, nrGround(px, pz) + 0.07), pz], c }; });
              if (row.some(r => !r) || !G.on[Math.floor((x - G.x0) / NRC / NRT) + Math.floor((z - G.z0) / NRC / NRT) * G.ntx]) { prev = null; continue; }
              if (prev) for (let j = 0; j + 1 < OF.length; j++) { const a = prev[j], b = prev[j + 1], c = row[j + 1], d = row[j]; gk.quadON(a.p, b.p, c.p, d.p, UP, UP, UP, UP, [a.p[0], a.p[1] - 5, a.p[2]], a.c, b.c, c.c, d.c, [uv(a.p), uv(b.p), uv(c.p), uv(d.p)]); }
              prev = row; } } }
        addM(gk, gMat); }
      // the paddocks by the road: tussocks of longer grass out past the fences, swaying in the wind
      { const mat = tuftWindMat(out.dyn.wind || (out.dyn.wind = { value: 0 })), tu = new IChunks(tuftGeo(false), mat, 256), av = texAvg(gMat.map);
        for (let d = 0; d < L; d += 2.2) for (const side of [-1, 1]) for (let q = 0; q < 1; q++) {
          const u = crH(d, side * 7 + q, 81), o = 7 + Math.pow(crH(d, side * 7 + q, 82), 1.4) * 48, [x, z] = onSide(sAt(d + u * 2.6), side, o);
          if (excluded(x, z) || wet(x, z, 2) || railNear(x, z, 4) || nrLC(x, z) === 3) continue; const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 3) continue;
          const y = nrGround(x, z), gc = nrGCol(x, z), g = 0.85 + 0.2 * crH(x, z, 83);
          tu.add(x, y - 0.03, z, u * 26, 1.0 + 1.1 * crH(x, z, 84), 0.32 + 0.38 * crH(x, z, 85), [gc[0] * av[0] * g * 1.05, gc[1] * av[1] * g * 1.05, gc[2] * av[2] * g * 1.05]);
        }
        for (let d = 0; d < L; d += 1.5) for (const side of [-1, 1]) { const s0 = sAt(d), i = T.idx(s0); if (kindAt(i, side) !== 0 || crH(d, side, 102) < 0.5) continue;   // (the long grass the mower missed along the fence)
          const bar = side > 0 ? T.br[i] : T.bl[i], [x, z] = onSide(s0, side, -0.3 - crH(d, side, 103) * 0.3), y = T.hy[i] + out.propFloor({ i, d: side * (bar - 0.4) }, true), gc = nrGCol(x, z);
          tu.add(x, y - 0.03, z, crH(d, side, 104) * 26, 0.6 + 0.4 * crH(d, side, 105), 0.45 + 0.3 * crH(d, side, 106), [gc[0] * av[0] * 1.12, gc[1] * av[1] * 1.12, gc[2] * av[2] * 0.98]); }
        const gt = new THREE.Group(); root.add(gt); tu.addTo(gt, false); gt.traverse(m => { if (m.isInstancedMesh && m.instanceColor) m.instanceColor.ground = true; }); }
      { const ge = new GB(), Fl = (i, o) => { const x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o; return [x, T.hy[i] + out.propFloor({ i, d: o }, true) + 0.035, z]; };   // (propFloor: over the road's own height)
        for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const j = (i + 2) % N; if (kindAt(i, side) !== 1 || kindAt(j, side) !== 1 || crH(i, side, 107) < 0.35) continue;   // (the earth in front of the bales, trodden bare)
          const bi = side > 0 ? T.br[i] : T.bl[i], bj = side > 0 ? T.br[j] : T.bl[j], e = vary([0.58, 0.48, 0.34], () => crH(i, side, 108), 0.18), e2 = e.map(v => v * 1.06);
          ge.quadUp(Fl(i, side * (bi - 1.3)), Fl(i, side * (bi - 0.15)), Fl(j, side * (bj - 0.15)), Fl(j, side * (bj - 1.3)), [e2, e, e, e2]); }
        const TT = [0.36, 0.33, 0.25];
        for (const c of T.corners) { if (c.sev < 3) continue; const side = -c.dir, i1 = c.i1 < c.i0 ? c.i1 + N : c.i1, n = Math.round(28 / ds);   // (the tyre tracks of a car run wide at the exit)
          for (const tr of [0, 1.45]) for (let k = 0; k < n; k++) { const a = (i1 + k) % N, b = (i1 + k + 1) % N, bar = Math.min(side > 0 ? T.br[a] : T.bl[a], side > 0 ? T.br[b] : T.bl[b]);
            const oa = w + 0.4 + 1.5 * Math.sin(Math.PI * k / n) + tr, ob = w + 0.4 + 1.5 * Math.sin(Math.PI * (k + 1) / n) + tr; if (ob + 0.2 > bar - 0.3 || oa + 0.2 > bar - 0.3 || bridgeAt[a]) continue;
            ge.quadUp(Fl(a, side * (oa - 0.17)), Fl(a, side * (oa + 0.17)), Fl(b, side * (ob + 0.17)), Fl(b, side * (ob - 0.17)), [TT, TT, TT, TT]); } }
        addM(ge, matV); }
      G.col = G.cov = P.edge = null; }

    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: atlas })); if (bm) bm.castShadow = false;
    crowdFinish(CR, root, out);
    out.crowdPts = Float32Array.from(crowdPts);
    { const geo = lfEagleGeo(), mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), i0 = T.idx(sStart), Lb = [];   // a wedge-tailed eagle circling over the paddocks, a flock of galahs (caCondors moves them)
      for (const [r, sp, h, ox, oz, ph] of [[46, 0.17, 48, 30, -25, 0]]) { const m = new THREE.Mesh(geo, mat); root.add(m); Lb.push({ m, r, sp, h, ox, oz, ph, bank: 0.28 }); }
      { const gg = lfGalahGeo();   // and a small flock of galahs wheeling low over the paddocks by the road (one mesh each, close together)
        for (let k = 0; k < 5; k++) { const m = new THREE.Mesh(gg, mat); m.scale.setScalar(1.6); root.add(m); Lb.push({ m, r: 22 + k * 1.6, sp: 0.42 + k * 0.012, h: 14 + (k % 3) * 1.2, ox: -15 + k * 1.1, oz: 20 - k * 0.8, ph: 1.1 + k * 0.16, bank: 0.45 }); } }
      out.dyn.condors = { L: Lb, x0: T.px[i0], z0: T.pz[i0], y0: T.hy[i0], ax: T.px[i0], az: T.pz[i0], ay: T.hy[i0], t: null }; caCondors(out.dyn.condors, 0, null); }
    if (def.far) out.dyn.far = API.rsFar(root, def.far, opts.season === 'winter' ? 'winter' : 'summer', hyS(sStart) + 6);   // the Great Western Tiers and Ben Lomond on the horizon (the snow on them in winter)
    let train = null;
    { const rl = def.rail, cum = LFQ.cum, Lr = cum[cum.length - 1];   // a short goods train on the Western Line: it runs over the viaduct and back, never as far as the level crossing (no trains on race day there)
      const alAt = (x, z) => { let b = 0, bd = 1e18; for (let k = 0; k < rl.length; k++) { const d = (rl[k][0] - x) ** 2 + (rl[k][1] - z) ** 2; if (d < bd) { bd = d; b = k; } } return cum[b]; };
      const pV = atSf(sAt(LF.viaduct), 0), pX = atSf(sAt(LF.level), 0), aV = alAt(pV[0], pV[1]), aX = alAt(pX[0], pX[1]);
      const a0 = aV < aX ? Math.max(80, aV - 1300) : aX + 260, a1 = aV < aX ? aX - 260 : Math.min(Lr - 80, aV + 1300);
      const lg = new GB(), K = [0.12, 0.12, 0.13], RD = [0.5, 0.12, 0.1], GR = [0.3, 0.32, 0.3];   // the locomotive (facing +x) with its tender
      box(lg, 0, 0.55, 0, 11.5, 0.45, 2.5, 0, K); box(lg, 1.6, 1.0, 0, 6.2, 1.55, 1.6, 0, K, [0.2, 0.2, 0.22]); box(lg, 4.85, 0.95, 0, 0.35, 1.7, 1.7, 0, K); cyl(lg, 4.1, 2.5, 0, 0.28, 0.75, 6, K);
      box(lg, -2.4, 0.95, 0, 2.4, 2.35, 2.6, 0, K, GR); box(lg, -5.3, 0.95, 0, 3.4, 1.7, 2.5, 0, K, [0.08, 0.08, 0.08]); box(lg, 5.8, 0.45, 0, 0.3, 0.55, 2.6, 0, RD);
      for (const a of [-4.6, -0.6, 1.6, 3.6]) for (const e of [-1, 1]) box(lg, a, 0.05, e * 1.15, 1.4, 1.0, 0.18, 0, RD, null, true);
      const cg = new GB(), BR = [0.44, 0.17, 0.14];   // a goods wagon / a guard's van (the same shape: a closed box van)
      box(cg, 0, 0.55, 0, 10.5, 0.4, 2.5, 0, K); box(cg, 0, 0.95, 0, 10.2, 2.5, 2.6, 0, BR, [0.5, 0.48, 0.44]);
      for (const a of [-3.6, 3.6]) for (const e of [-1, 1]) box(cg, a, 0.05, e * 1.15, 1.6, 0.8, 0.18, 0, K, null, true);
      const loco = new THREE.InstancedMesh(lg.geometry(), matV, 1), vans = new THREE.InstancedMesh(cg.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true }), 5);
      for (const m of [loco, vans]) { m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true; root.add(m); }
      const atRail = (al) => { let k = 0, lo = 0, hi = cum.length - 2; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (cum[mid] <= al) lo = mid; else hi = mid - 1; } k = lo;
        const t = clamp((al - cum[k]) / Math.max(1e-6, cum[k + 1] - cum[k]), 0, 1), a = rl[k], b = rl[k + 1]; return [lerp(a[0], b[0], t), lerp(a[2], b[2], t) + 0.14, lerp(a[1], b[1], t), Math.atan2(-(b[1] - a[1]), b[0] - a[0])]; };
      train = { loco, vans, atRail, a0, a1, up: aV < aX ? 1 : -1 }; }
    { const src = [];   // the chimneys smoking: the farms nearest the road and some of the town's houses
      for (const [x, z] of farms.slice().sort((a, b) => nrDist(a[0], a[1]) - nrDist(b[0], b[1])).slice(0, 8)) src.push({ x, y: nrGround(x, z) + 6.2, z, ph: crH(x, z, 121) });
      for (const [x, z] of blds) { if (src.length >= 14) break; if (townAt(x, z) && nrDist(x, z) < 70 && crH(x, z, 122) < 0.3) src.push({ x, y: nrGround(x, z) + 6.8, z, ph: crH(x, z, 123) }); }
      const pg = new GB(), RR = rng(1963); API.ROCK_SMOOTH = true; ico(pg, 0, 0, 0, 1, 1, [1, 1, 1], RR, 0.2); API.ROCK_SMOOTH = false;
      const nD = 24, nT = 10, puffs = new THREE.InstancedMesh(pg.geometry(), new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.32, depthWrite: false }), src.length * 5 + nD + nT);
      const c = new THREE.Color(); for (let k = 0; k < src.length * 5 + nD + nT; k++) { const dk = k >= src.length * 5 && k < src.length * 5 + nD, tk = k >= src.length * 5 + nD; c.setRGB(tk ? 0.62 : dk ? 0.78 : 0.86, tk ? 0.62 : dk ? 0.68 : 0.86, tk ? 0.64 : dk ? 0.52 : 0.88); puffs.setColorAt(k, c); }
      puffs.frustumCulled = false; puffs.renderOrder = 4; root.add(puffs);   // (ROAD DECAL ORDER: the smoke and the dust blend over the road's patches and the tyre marks behind them)
      const flocks = [], nB = 7;
      for (const d of [LF.mount - 520, LF.level + 330, LF.tower - 240]) { const s0 = sAt(d), i = T.idx(s0);   // the flocks in the paddocks beside the straights
        for (const side of [1, -1]) { const [x, z] = onSide(s0, side, 22); if (!openAt(x, z, 18)) continue;
          const L = { x, z, y: nrGround(x, z), st: 0, t0: 0, ax: T.nx[i] * side, az: T.nz[i] * side, birds: [] };
          for (let k = 0; k < nB; k++) L.birds.push({ ox: (crH(d, k, 124) - 0.5) * 9, oz: (crH(d, k, 125) - 0.5) * 9, yaw: crH(d, k, 126) * TAU, ph: crH(d, k, 127) * TAU, r: crH(d, k, 128) });
          flocks.push(L); break; } }
      const birds = new THREE.InstancedMesh(lfGalahGeo(), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), Math.max(1, flocks.length * nB)); birds.frustumCulled = false; root.add(birds);
      const wa = 0.6;   // (the wind from the north-west: the smoke drifts to the south-east)
      out.dyn.lfFx = { puffs, birds, src, flocks, train, dust: Array.from({ length: nD }, () => ({ x: 0, y: 0, z: 0, t0: -99 })), di: 0, nd: 0, cx: 0, cz: 0, t: null, wx: Math.cos(wa), wz: Math.sin(wa),
        m4: new THREE.Matrix4(), q: new THREE.Quaternion(), v: new THREE.Vector3(), sc: new THREE.Vector3(), e: new THREE.Euler() };
      lfFxUpdate(out.dyn.lfFx, 0, null); }
    out.stats = { tiles: nTiles, trees: nTrees, posts: nPosts, bales: nBales, boxes: nBoxes, houses: nHouses, stands: nStands, arches: nArch, sheep: nSheep, hay: nHay, cars: nCars, poles: nPoles, hedges: nHedge, roads: nRoads, fence: nFence, cattle: nCattle, farms: farms.length, marshals: nMarsh, rugs: nRugs, distBoards: nDist, trailers: nTrail, tents: nTents, town: nTown };   // (read by the tests)
    return out;
  }

  Object.assign(API, { lfFxUpdate, lfNear, lfSegs });   // (what World and the other worlds use of this one)
  Object.defineProperties(API, { LFQ: { get: () => LFQ, set: (v) => { LFQ = v; } } });
  World.ext.longford = (scene, tex, opts) => buildLongford(scene, tex, opts);
})();
