/* =========================================================================
   WORLD — Abu Dabi, ZAE (theme 'abudabi'): the circuit on Yas Island in Abu Dhabi, its own parts on the shared builder of
   js/world-rbring.js (World.ext.rbring), loaded before it (index.html). Its look (RB_LOOK.abudabi) goes on API.rbLook;
   World.ext.abudabi builds it with World.ext.rbring. Plan: docs/dirkalisca-celine.md, the track: docs/proge/abudabi.md.
   Its own parts (the builder's hooks LK.ground, LK.woods, LK.pad, LK.extra, LK.fl): the island's sand (its own ground picture under
   the vertex colours), the watered lawns and the paved ground; date palms and the gardens' shade trees; the marina's basins and the sea
   (def.sk.sea: the signed distance to their shore) dug into the ground, flat water with a shore band (the shared builder's API.rbSea); the
   hotel that stands over the track (def.sk.ht, def.sk.hb: its two wings and the bridge between them over the road, white, glazed, its
   windows lit at night); the buildings round the circuit and its fences (def.sk.bld, def.sk.fence: OpenStreetMap), OSM's palms
   (def.sk.palm); the UAE's flag among the fans' flags. Only place names on its boards (no names of the circuit, its people, races, the
   hotel or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { GB, IChunks, TAU, box, clamp, cyl, ico, lerp, nrGround, nrLCf, puff, rng, sstep } = API;
  // the text boards: place names (the island, the city, the country) and the grandstands' names (def.stands: the quarters of the compass,
  // the island, the marina), the start line's
  const AD_BAN = [['YAS', '#0b6b4a', '#fff', '#fff'], ['ABU DHABI', '#16181c', '#fff', '#c8102e'], ['START · FINISH', '#16181c', '#fff', '#0b6b4a'], ['UAE', '#c8102e', '#fff', '#fff'],
    ['NORTH', '#1d3f6e', '#fff', '#c8102e'], ['WEST', '#1d3f6e', '#fff', '#0b6b4a'], ['SOUTH', '#1d3f6e', '#fff', '#fff'], ['MARINA', '#0e5a7a', '#fff', '#fff']];
  const AD_AT = { num: 0, brake: 0, ban: 3, rbr: 3, spielberg: 4 };   // atlas cells: the braking boards (no turn numbers), the banners
  const AD_SHIRTS = [[0.95, 0.95, 0.93], [0.92, 0.92, 0.9], [0.8, 0.12, 0.17], [0.0, 0.45, 0.2], [0.14, 0.14, 0.16], [0.12, 0.18, 0.36], [0.3, 0.55, 0.85], [0.98, 0.8, 0.14],
    [0.86, 0.32, 0.12], [0.9, 0.86, 0.76], [0.56, 0.44, 0.32], [0.95, 0.95, 0.93]];   // the fans' shirts in the evening warmth: white and cream, red, green and black, navy, light blue, yellow, orange
  const AE = Object.assign([[0.0, 0.45, 0.2], [0.96, 0.96, 0.95], [0.06, 0.06, 0.07]], { hoist: [[0.86, 0.1, 0.12], 0.25] });   // the UAE's flag: green, white and black, the red band at the pole (World.rbFlags: cols.hoist)

  // the island's sand under the vertex colours (256 px = 14 m, tileable as World's grass picture it takes the place of): fine pale grains,
  // faint wind ripples, darker grit; the vertex colours make the lawns, the paving and the patches
  function adPN(n, seed) { const q = rng(seed), g = new Float32Array(n * n); for (let k = 0; k < g.length; k++) g[k] = q();
    return (u, v) => { u *= n; v *= n; const i = Math.floor(u), j = Math.floor(v), f = u - i, e = v - j, I = (a, b) => g[((b % n + n) % n) * n + ((a % n + n) % n)], s = f * f * (3 - 2 * f), t = e * e * (3 - 2 * e);
      return lerp(lerp(I(i, j), I(i + 1, j), s), lerp(I(i, j + 1), I(i + 1, j + 1), s), t); }; }
  function adSandTex(aniso) {
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data, r = rng(5281);
    const n1 = adPN(6, 5282), n2 = adPN(20, 5283), n3 = adPN(64, 5284);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const u = i / S, v = j / S, w = Math.sin((v * 22 + u * 2 + n1(u, v) * 3.2) * TAU) * 0.5 + 0.5, o = (j * S + i) * 4;
      const k = 0.9 + n2(u, v) * 0.1 + n3(u, v) * 0.08 + (w - 0.5) * 0.05 + (r() - 0.5) * 0.12;
      d[o] = clamp(226 * k, 0, 255); d[o + 1] = clamp(204 * k, 0, 255); d[o + 2] = clamp(164 * k, 0, 255); d[o + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    for (let q = 0; q < 700; q++) { const px = r() * S, py = r() * S, s = 0.5 + r() * 1.2; x.fillStyle = r() < 0.6 ? `rgba(120,96,64,${0.2 + r() * 0.25})` : `rgba(250,240,220,${0.25 + r() * 0.3})`; x.fillRect(px, py, s, s); }   // (grit, dark and pale)
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso || 4; return t;
  }

  // unit trees (height 1, the instances scale them): 0 a date palm, 1 a shade tree of the gardens (a ghaf, a neem); 2, 3 the cheaper ones
  // far from the road
  function adTreeGeo(kind) {
    const g = new GB(), R = rng(530 + kind), k = kind % 2, cheap = kind >= 2;
    if (k === 0) {   // a straight stout trunk of old leaf bases (two shades in rings), a dense crown of stiff grey-green fronds, the young ones up, the old ones arching down; dates under it
      const seg = cheap ? 2 : 5, bark = [0.56, 0.46, 0.34], barkD = [0.46, 0.37, 0.27];
      for (let s = 0; s < seg; s++) { const y0 = 0.84 * s / seg, y1 = 0.84 * (s + 1) / seg; cyl(g, 0, y0, 0, 0.042 - 0.008 * s / seg, y1 - y0 + 0.01, cheap ? 4 : 6, s % 2 ? bark : barkD, null, 0.042 - 0.008 * (s + 1) / seg); }
      const n = cheap ? 8 : 16, fr = [0.44, 0.54, 0.34], frD = [0.32, 0.4, 0.25];
      for (let f = 0; f < n; f++) {
        const tier = f % 3, a = f / n * TAU + (R() - 0.5) * 0.3, c = Math.cos(a), sn = Math.sin(a), L = 0.34 + R() * 0.1, rise = [0.2, 0.08, -0.04][tier], dr = [0.02, 0.12, 0.24][tier] + R() * 0.05;
        const B = [c * 0.02, 0.85, sn * 0.02], M = [c * L * 0.5, 0.86 + rise, sn * L * 0.5], Tp = [c * L, 0.86 + rise - dr, sn * L], w = 0.05 + R() * 0.015;
        const Ml = [M[0] - sn * w, M[1] - 0.01, M[2] + c * w], Mr = [M[0] + sn * w, M[1] - 0.01, M[2] - c * w];
        for (const [p, q, r] of [[B, Mr, M], [B, M, Ml], [M, Mr, Tp], [M, Tp, Ml]]) { g.tri(p, q, r, fr); g.tri(p, r, q, frD); }   // (both faces: a frond seen from below too)
      }
      if (!cheap) for (let q = 0; q < 3; q++) { const a = q / 3 * TAU + 0.5; ico(g, Math.cos(a) * 0.05, 0.8, Math.sin(a) * 0.05, 0.03, 1.4, [0.7, 0.42, 0.14], R, 0.2); }   // (the dates' bunches)
    } else {   // a short trunk, a wide flat-topped crown of small leaves in clumps, dusty olive green
      cyl(g, 0, -0.02, 0, 0.05, 0.45, cheap ? 4 : 6, [0.42, 0.36, 0.3], null, 0.04);
      const LF = [[0.38, 0.46, 0.26], [0.42, 0.5, 0.28], [0.34, 0.42, 0.24], [0.4, 0.48, 0.3]];
      const cl = cheap ? [[0, 0.66, 0, 0.4, 0.5]] : [[0.24, 0.62, 0.1, 0.27, 0.55], [-0.24, 0.63, 0.08, 0.26, 0.55], [0, 0.61, -0.25, 0.27, 0.55], [0.02, 0.64, 0.27, 0.25, 0.55], [0.03, 0.75, 0.02, 0.28, 0.5]];
      cl.forEach(([x, y, z, r, sy], q) => puff(g, x, y, z, r, sy, LF[q % 4], R, 0.22, 0.5, 1.12, !cheap));
    }
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // the trees (LK.woods, on the builder's land cover: 0 sand, 1 palms and the gardens' trees, 2 watered lawns, 3 paved): date palms
  // mostly, a shade tree in the gardens here and there; a lone palm on the sand, palms in the car parks and on the lawns
  const AD_WOODS = {
    n: 2, geo: adTreeGeo, cr: [0.22, 0.42], p: [0.003, 0.5, 0.035, 0.012],
    pick(cl, R, far) {
      const r = R(), r2 = R(), sp = cl === 1 && r < 0.25 ? 1 : 0, h = (sp === 0 ? 7 + r2 * 6 : 6 + r2 * 4) * (far ? 1.06 : 1);
      return [sp, h, h * (sp === 0 ? 0.55 + r2 * 0.1 : 1.05 + r2 * 0.2)];
    },
  };

  // the water (def.sk.sea, the marina's basins and the sea): the shared builder's (js/world-rbring.js, API.rbSea, loaded after this file)
  const seaD = (x, z) => API.rbSea.d(x, z);
  const AD_SEA = { color: 0x3f8c94, wo: { len: 1.5, amp: 0.6, refl: 0.45, land: 0.6, shal: 0.6, lap: 0.5, surf: 0 } };   // (the Gulf's green-blue, small waves, the sky mirrored)

  // the hotel over the track (def.sk.ht: its wings, [x, z, length, width, angle (deg), height]; def.sk.hb: the bridge between them over the
  // road, [x, z, length, width, angle, its underside above the road, its thickness]): white walls glazed all round in the facade picture
  // (World's tex.facade: a bay 3.3 m wide, a floor 3.2 m high; Render.litWindows lights them at dusk), flat roofs; the bridge's underside
  // plain; nobody and no tree on them
  function adHotel({ root, tex, exclPush, CR }, st) {
    const T = API.T, sk = T.def.sk || {}, fac = new GB(true), gp = new GB(true), FC = [0.95, 0.96, 0.99], ROOF = [0.8, 0.81, 0.83], UNDER = [0.74, 0.75, 0.77];
    const corners = (x, z, L, W, deg) => { const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => [x + (u * L * c - v * W * s) / 2, z + (u * L * s + v * W * c) / 2]); };
    const block = (q, x, z, y0, y1, under) => {
      const fl = Math.max(1, Math.round((y1 - y0) / 3.2));
      for (let k = 0; k < 4; k++) { const A = q[k], B = q[(k + 1) % 4], bays = Math.max(1, Math.round(Math.hypot(B[0] - A[0], B[1] - A[1]) / 3.3));
        fac.quadO([A[0], y0, A[1]], [B[0], y0, B[1]], [B[0], y1, B[1]], [A[0], y1, A[1]], FC, [x, (y0 + y1) / 2, z], [[0, 0], [bays, 0], [bays, fl], [0, fl]]); }
      gp.quadO([q[0][0], y1, q[0][1]], [q[1][0], y1, q[1][1]], [q[2][0], y1, q[2][1]], [q[3][0], y1, q[3][1]], ROOF, [x, y1 - 1, z]);
      if (under) gp.quadO([q[0][0], y0, q[0][1]], [q[1][0], y0, q[1][1]], [q[2][0], y0, q[2][1]], [q[3][0], y0, q[3][1]], UNDER, [x, y0 + 1, z]);
    };
    const keepOff = (q, L, W) => {   // (circles every 12 m over the block: no tree, nobody on it)
      const [a, b, , d] = q, n = Math.max(1, Math.round(L / 12)), m = Math.max(1, Math.round(W / 12));
      for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) { const x = a[0] + (b[0] - a[0]) * i / n + (d[0] - a[0]) * j / m, z = a[1] + (b[1] - a[1]) * i / n + (d[1] - a[1]) * j / m; exclPush(x, z, 9); CR.avoid(x, z, 8); }
    };
    for (const [x, z, L, W, deg, h] of sk.ht || []) {
      const q = corners(x, z, L, W, deg); let y = 1e9; for (const [cx, cz] of q) y = Math.min(y, nrGround(cx, cz));
      block(q, x, z, y - 0.4, y + h, false); keepOff(q, L, W); st.hotel++;
    }
    if (sk.hb) {   // the bridge: its underside the given height over the road under its middle
      const [x, z, L, W, deg, up, th] = sk.hb, i = T.nearestIdx(x, z), y0 = T.hy[i] + up;
      block(corners(x, z, L, W, deg), x, z, y0, y0 + th, true); st.hotel++;
    }
    if (!fac.empty) { const m = new THREE.Mesh(fac.geometry(), new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true })); m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false; m.name = 'hotel'; root.add(m); }
    if (!gp.empty) { const m = new THREE.Mesh(gp.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = true; m.matrixAutoUpdate = false; m.name = 'hotel roofs'; root.add(m); }
  }

  // LK.extra: the water, the hotel, the buildings by the circuit (OSM outlines as boxes: white, cream and sand-coloured render, grey
  // cladding on the big halls; flat roofs), its fences (chain link on posts; not where they would stand in the circuit's barriers or
  // run-offs), OSM's palms; before the crowds and the trees, which keep clear of them
  function adExtra(o) {
    const { root, scen, exclPush, CR } = o, T = API.T, sk = T.def.sk || {}, R = rng(5281), st = { water: 0, hotel: 0, buildings: 0, fence: 0, palms: 0 };
    API.rbSea.water(o, st, AD_SEA); adHotel(o, st);
    const b6 = sk.bld || [], WALL = [[0.95, 0.94, 0.9], [0.92, 0.86, 0.74], [0.86, 0.78, 0.62], [0.74, 0.75, 0.76]], ROOF = [[0.78, 0.78, 0.76], [0.66, 0.66, 0.64]];
    for (let k = 0; k < b6.length; k += 6) {
      const [x, z, L, W, deg, h] = b6.slice(k, k + 6), rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot);
      let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2));
      const wc = h > 6 ? WALL[3] : WALL[Math.floor(R() * 3)], rc = ROOF[h > 6 ? 1 : 0];
      box(scen.get(x, z), x, y - 0.4, z, L, h + 0.4, W, rot, wc, rc, true);
      exclPush(x, z, Math.hypot(L, W) / 2 + 2); CR.avoid(x, z, Math.hypot(L, W) / 2 + 1); st.buildings++;
    }
    const keep = (x, z) => { const i = T.nearestIdx(x, z), of = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i]; return Math.abs(of) > (of > 0 ? T.br[i] : T.bl[i]) + 2.5 && !T.pitAt(i * T.ds); };
    const fg = new GB(true);
    for (const f of sk.fence || []) {   // a fence: chain link 2 m high (the debris fences' picture), a post every 3 m
      let acc = 0;
      for (let k = 2; k < f.length; k += 2) {
        const ax = f[k - 2], az = f[k - 1], bx = f[k], bz = f[k + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 3));
        for (let q = 0; q < n; q++) {
          const x0 = ax + (bx - ax) * q / n, z0 = az + (bz - az) * q / n, x1 = ax + (bx - ax) * (q + 1) / n, z1 = az + (bz - az) * (q + 1) / n, d = L / n;
          if (!keep(x0, z0) || !keep(x1, z1) || seaD(x0, z0) > -1 || seaD(x1, z1) > -1) { acc += d; continue; }
          const y0 = nrGround(x0, z0), y1 = nrGround(x1, z1), u0 = acc / 2.5, u1 = (acc + d) / 2.5, ins = [(x0 + x1) / 2 - (z1 - z0), y0 + 1, (z0 + z1) / 2 + (x1 - x0)];
          fg.quadO([x0, y0 + 0.05, z0], [x1, y1 + 0.05, z1], [x1, y1 + 2.05, z1], [x0, y0 + 2.05, z0], [1, 1, 1], ins, [[u0, 0], [u1, 0], [u1, 0.8], [u0, 0.8]]);
          box(scen.get(x0, z0), x0, y0 - 0.2, z0, 0.08, 2.35, 0.08, Math.atan2(bz - az, bx - ax), [0.62, 0.63, 0.64]);
          acc += d; st.fence += d;
        }
      }
    }
    if (!fg.empty) { const m = new THREE.Mesh(fg.geometry(), new THREE.MeshLambertMaterial({ map: o.tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide })); m.receiveShadow = true; m.matrixAutoUpdate = false; m.name = 'fences'; root.add(m); }
    st.fence = Math.round(st.fence);
    const pl = sk.palm || [], tc = new IChunks(adTreeGeo(0), new THREE.MeshLambertMaterial({ vertexColors: true }), 128);   // OSM's palms: date palms 8-13 m
    for (let k = 0; k + 1 < pl.length; k += 2) {
      const x = pl[k], z = pl[k + 1]; if (!keep(x, z) || seaD(x, z) > -2) continue;
      const h = 8 + R() * 5, cv = 0.9 + R() * 0.2; tc.add(x, nrGround(x, z) - 0.1, z, R() * TAU, h * 0.58, h, [cv, cv, cv * (0.95 + R() * 0.1)]);
      exclPush(x, z, 3); st.palms++;
    }
    tc.addTo(root, true);
    return st;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    abudabi: { ban: AD_BAN, at: AD_AT, nums: 0, shirts: AD_SHIRTS, smoke: false, camps: 0, farms: 0, seC: [0.9, 0.92, 0.96], noVid: true,
      pitBox: [-124, 250, 1], vg: [1.0, 0.97, 0.9], edge: [1.06, 1.02, 0.94], mow: 0.25,   // (the long pit building on the right of the straight; the verges sand-coloured, faint stripes on the lawns)
      ground: (m, ownTex) => { m.map = ownTex(adSandTex(m.map && m.map.anisotropy)); },   // (the island's sand in place of the meadow grass picture: the terrain and the verges)
      woods: AD_WOODS, extra: adExtra, pad: (p0) => API.rbSea.pad(p0), lane: true, fl: { ae: AE }, ck: 2,   // (lane: the pit lane's asphalt past the pit building too; ck: chunks twice as big: fewer draws)
      flags: { stand: [{ ae: 0.75, tm: 0.25 }, { ae: 0.6, tm: 0.25, or: 0.15 }], ga: { ae: 0.65, tm: 0.25, or: 0.1 }, camp: { ae: 0.7, tm: 0.3 }, pole: 'ae', podium: 'ae' },
      vid: [], poles: [-130, 220, -1], runoff: ['YAS', 'ABU DHABI', 'UAE'], straight: [-220, 250, -1],
      farm: { wall: [0.94, 0.92, 0.86], roof: [0.8, 0.78, 0.74], end: [0.92, 0.9, 0.84], barn: [0.86, 0.8, 0.68], barnRoof: [0.7, 0.68, 0.64], barnEnd: [0.84, 0.78, 0.66] },
      tvSkip: [1, 2, 5, 7, 10, 12], recov: [0, 3, 9], photo: [0, 3, 4, 9, 13], jets: [[0.86, 0.1, 0.12], [0.97, 0.97, 0.97], [0.0, 0.45, 0.2]],   // (TV towers at the first left, the hairpin, the chicane, the long left, the marina, the sharp right, the left before the hotel and the last corner)
      colMod: (P) => (x, z, c) => {   // the island: pale sand in patches (a little darker and browner near the water), the watered lawns green, the paving grey-beige, the gardens' floor under the trees
        const sh = clamp((c[0] + c[1] + c[2]) / 3, 0.5, 1.15), n = P.n5(x * 0.5 + 320, z * 0.5), m = P.n3(x * 1.4 + 60, z * 1.4), k = (0.97 + (n - 0.5) * 0.14 + (m - 0.5) * 0.08) * lerp(1, sh, 0.6);
        c[0] = k; c[1] = k * 0.99; c[2] = k * 0.97;   // (the sand picture as it is; sh: the shade under the trees)
        const lawn = nrLCf(x, z, 2), pav = nrLCf(x, z, 3), tr = nrLCf(x, z, 1), lg = (0.5 + m * 0.1) * k;
        c[0] = lerp(c[0], lg * 0.66, lawn); c[1] = lerp(c[1], lg * 1.1, lawn); c[2] = lerp(c[2], lg * 0.5, lawn);
        c[0] = lerp(c[0], 0.88 * k, pav * 0.8); c[1] = lerp(c[1], 0.92 * k, pav * 0.8); c[2] = lerp(c[2], 1.0 * k, pav * 0.8);
        c[0] = lerp(c[0], 0.66 * k, tr * 0.45); c[1] = lerp(c[1], 0.76 * k, tr * 0.45); c[2] = lerp(c[2], 0.58 * k, tr * 0.45);
        const wd = seaD(x, z); if (wd > -14) { const wt = sstep(-14, -1, wd) * 0.45; c[0] *= 1 - wt * 0.3; c[1] *= 1 - wt * 0.26; c[2] *= 1 - wt * 0.2; }   // (damp sand by the water)
      } },
  });
  World.keep('NR', 'abudabi');   // (its grids kept between its builds; World.build frees the others')
  World.ext.abudabi = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
