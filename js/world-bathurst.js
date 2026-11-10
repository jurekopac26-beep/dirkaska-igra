/* =========================================================================
   WORLD — Bathurst, Avstralija (theme 'bathurst'): its own parts on the shared builder of js/world-rbring.js (World.ext.rbring), split out of it by
   tools/razdeli-proge.mjs (docs/razdelitev-prog.md) and loaded before it (index.html). What the builder, World and the other worlds use of them
   goes on World.api (API), its look (RB_LOOK.bathurst) on API.rbLook; World.ext.bathurst builds it with World.ext.rbring.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { GB, TAU, box, clamp, cyl, ico, lerp, nrLCf, nrLump, nrPN, pixAvg, rng, sstep } = API;
  // Bathurst on the same builder (theme 'bathurst'): its own banners (no names of the circuit, its races or sponsors: the town and the state),
  // 18 turn numbers, the cells after them
  const BT_BAN = [['BATHURST', '#0b3b2a', '#f2c21a', '#f2c21a'], ['START · FINISH', '#16181c', '#fff', '#f2c21a'], ['GRANDSTAND', '#0b3b2a', '#fff', '#f2c21a'],
    ['NEW SOUTH WALES', '#13336c', '#fff', '#f2c21a']];
  const BT_AT = { num: 0, brake: 18, ban: 21, rbr: 21, spielberg: 22 };
  const BT_SHIRTS = [[0.05, 0.42, 0.22], [0.98, 0.78, 0.12], [0.12, 0.2, 0.46], [0.86, 0.12, 0.14], [0.94, 0.94, 0.92], [0.12, 0.13, 0.16], [0.2, 0.36, 0.8], [0.98, 0.5, 0.1],
    [0.55, 0.42, 0.28], [0.36, 0.38, 0.3], [0.05, 0.42, 0.22], [0.98, 0.78, 0.12]];   // the fans' shirts: lots of green and gold, team colours, khaki and dark bush hats
  function auTreeGeo(kind) {   // unit trees (height 1, instances scale them), soft shaded: 0 a eucalypt (a pale smooth trunk, a few loose clumps of grey-green leaves high up), 1 a wattle or a scrubby bush (also sunk into the ground); 2, 3 the cheaper ones far from the road
    const g = new GB(), R = rng(640 + kind), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    const lf = [0.3, 0.38, 0.26], lfD = [0.24, 0.31, 0.22], bk = [0.82, 0.8, 0.74], bkD = [0.6, 0.56, 0.5], ws = [0.32, 0.4, 0.2];
    if (kind === 0 || kind === 2) {
      cyl(g, 0, -0.02, 0, 0.03, 0.6, kind ? 4 : 5, bkD, null, 0.02); cyl(g, 0, 0.4, 0, 0.02, 0.3, kind ? 4 : 5, bk, null, 0.012);   // (darker, shedding bark low down)
      const cl = kind ? [[0.08, 0.72, 0, 0.2], [-0.1, 0.84, 0.06, 0.18]] : [[0.1, 0.66, 0.04, 0.17], [-0.12, 0.74, -0.06, 0.16], [0.02, 0.86, 0.1, 0.15], [-0.04, 0.95, -0.02, 0.12], [0.16, 0.82, -0.1, 0.12]];
      cl.forEach(([x, y, z, r], k) => ico(g, x, y, z, r, 0.62, k % 2 ? lfD : lf, R, 0.3));
    } else if (kind === 1) {   // wattle: a low rounded bush, olive, two lumps
      ico(g, 0, 0.42, 0, 0.36, 0.85, ws, R, 0.25); nrLump(g, 0.14, 0.5, 0.08, 0.24, 0.85, lf, R, 0.2);
    } else ico(g, 0, 0.45, 0, 0.38, 0.85, ws, R, 0.25);
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }  // Bathurst's kangaroos (theme 'bathurst', out.dyn.roos): eastern greys in mobs on the pastures, grazing; when the followed car comes
  // within 45 m a kangaroo bounds away from it for a few seconds (big hops, the body pitched forward), then settles again. One instanced
  // mesh for all of them (a draw call), their poses set here every frame
  function auRooGeo() {   // a kangaroo facing +x, ~1.5 m tall: body, pale chest, head and snout, ears, haunches and long feet, forearms, the thick tail
    const g = new GB(), R = rng(661), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    const fur = [0.6, 0.47, 0.37], furD = [0.47, 0.36, 0.28], pale = [0.8, 0.72, 0.62];
    ico(g, -0.05, 0.62, 0, 0.3, 1.25, fur, R, 0.12); ico(g, 0.06, 0.98, 0, 0.19, 1.2, pale, R, 0.1);
    ico(g, 0.13, 1.32, 0, 0.11, 1.1, fur, R, 0.08); ico(g, 0.24, 1.29, 0, 0.065, 0.8, furD, R, 0.05);
    for (const sd of [-1, 1]) { box(g, 0.1, 1.38, sd * 0.05, 0.05, 0.17, 0.03, 0, furD); ico(g, -0.08, 0.36, sd * 0.13, 0.17, 1.1, furD, R, 0.1);
      box(g, 0.05, 0, sd * 0.1, 0.36, 0.06, 0.07, 0, furD, null, true); box(g, 0.14, 0.8, sd * 0.11, 0.05, 0.22, 0.05, 0, furD); }
    for (let k = 0; k < 4; k++) ico(g, -0.32 - 0.17 * k, 0.33 - 0.09 * k, 0, 0.09 - 0.017 * k, 0.8, furD, R, 0.05);
    API.ROCK_SMOOTH = rs; const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  const _rM = new THREE.Matrix4(), _rQ = new THREE.Quaternion(), _rE = new THREE.Euler(0, 0, 0, 'YXZ'), _rP = new THREE.Vector3(), _rS = new THREE.Vector3();
  function auRoos(D, t, car) {
    const dt = D.t == null ? 0 : clamp(t - D.t, 0, 0.1); D.t = t;
    for (let k = 0; k < D.L.length; k++) {
      const r = D.L[k];
      if (car && !(r.run > 0)) { const dx = r.x - car.x, dz = r.z - car.z, d = Math.hypot(dx, dz); if (d < 45) { r.run = 2.4 + (k % 3) * 0.5; r.fx = dx / (d || 1); r.fz = dz / (d || 1); r.ph = (k % 5) * 0.2; } }
      let hop = 0, pitch = 0;
      if (r.run > 0) {
        r.run -= dt; r.ph += dt * 1.8; const nx = r.x + r.fx * 7.5 * dt, nz = r.z + r.fz * 7.5 * dt;
        if (D.ok(nx, nz)) { r.x = nx; r.z = nz; } else { const c = Math.cos(1.2), sn = Math.sin(1.2), fx = r.fx * c - r.fz * sn; r.fz = r.fx * sn + r.fz * c; r.fx = fx; }   // (not onto the road or into the woods: veer off)
        r.yaw = Math.atan2(r.fz, r.fx); const ph = r.ph % 1; hop = Math.sin(ph * Math.PI) * 0.85; pitch = 0.55;
      }
      _rE.set(0, -r.yaw, -pitch); _rQ.setFromEuler(_rE); _rP.set(r.x, D.gH(r.x, r.z) + hop - 0.05, r.z); _rS.setScalar(r.sc);
      D.mesh.setMatrixAt(k, _rM.compose(_rP, _rQ, _rS));
    }
    D.mesh.instanceMatrix.needsUpdate = true;
  }
  function btGrassTex(aniso) {   // Bathurst's pasture under the vertex colours (256 px = 14 m, tileable): short spring grass mottled in patches of a metre or two,
    // tussocks dark at the heart and dry at the tips, straw blades, specks of the red-brown soil (made for the high camera: half a metre and more)
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data, r = rng(4801);
    const n1 = nrPN(4, 4802), n2 = nrPN(12, 4803), n3 = nrPN(40, 4804), n4 = nrPN(8, 4805);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const u = i / S, v = j / S, n = n1(u, v) * 0.35 + n2(u, v) * 0.4 + n3(u, v) * 0.25, k = 0.8 + n * 0.38 + (r() - 0.5) * 0.12, dry = sstep(0.55, 0.82, n4(u, v)) * 0.6, o = (j * S + i) * 4;
      d[o] = clamp(lerp(86, 132, dry) * k, 0, 255); d[o + 1] = clamp(lerp(120, 118, dry) * k, 0, 255); d[o + 2] = clamp(lerp(54, 70, dry) * k, 0, 255); d[o + 3] = 255;
    }
    x.putImageData(img, 0, 0); const avg = pixAvg(d);
    const wrap = (px, py, rad, fn) => { for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const qx = px + a * S, qy = py + b * S; if (qx > -rad && qx < S + rad && qy > -rad && qy < S + rad) fn(qx, qy); } };   // (across the edges too: tileable)
    for (let k = 0; k < 150; k++) { const px = r() * S, py = r() * S, rad = 3 + r() * 8, dr = r() < 0.35;   // tussocks (a third with dry tops)
      wrap(px, py, rad, (qx, qy) => { const g = x.createRadialGradient(qx, qy, 0, qx, qy, rad); g.addColorStop(0, dr ? 'rgba(150,132,80,0.5)' : 'rgba(40,58,24,0.5)'); g.addColorStop(0.65, dr ? 'rgba(170,150,92,0.3)' : 'rgba(64,80,34,0.3)'); g.addColorStop(1, 'rgba(150,140,90,0)');
        x.fillStyle = g; x.beginPath(); x.arc(qx, qy, rad, 0, TAU); x.fill(); }); }
    x.lineWidth = 1;
    for (const [st, n] of [['rgba(42,62,26,0.5)', 700], ['rgba(170,156,98,0.45)', 520], ['rgba(196,178,120,0.4)', 220]]) {   // blades: dark green, straw
      x.strokeStyle = st; x.beginPath();
      for (let k = 0; k < n; k++) { const px = r() * S, py = r() * S, dx = (r() - 0.5) * 2.4, dy = -(1.5 + r() * 3); wrap(px, py, 6, (qx, qy) => { x.moveTo(qx, qy); x.lineTo(qx + dx, qy + dy); }); }
      x.stroke(); }
    for (const [st, n, sz] of [['rgba(112,90,66,0.6)', 40, 3], ['rgba(126,104,78,0.5)', 60, 2], ['#e9d64e', 40, 1], ['#efeee2', 50, 1]]) { x.fillStyle = st; for (let k = 0; k < n; k++) x.fillRect(Math.floor(r() * (S - 3)), Math.floor(r() * (S - 3)), sz, sz); }   // the soil, a few capeweed and clover flowers
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso || 4; t.grassPic = true; t.avgCol = avg; return t;
  }
  function btGumGeo(kind) {   // Bathurst's gums (height 1): 0 near, 2 far: a pale trunk, darker and shedding low down, forking into three limbs, loose drooping clumps of blue-grey leaves at their ends; 1, 3 the wattles (auTreeGeo)
    if (kind === 1 || kind === 3) return auTreeGeo(kind);
    const g = new GB(), R = rng(650 + kind), rs = API.ROCK_SMOOTH, far = kind === 2, n = 4; API.ROCK_SMOOTH = true;   // (4-sided limbs: as light as the old gums, ~450 points a tree)
    const seg = (a, b, r0, r1, c0, c1) => {   // a tapered prism from a to b, its colour from c0 to c1
      const t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(...t), u = Math.abs(t[1] / l) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      let v = [t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0]]; const lv = Math.hypot(...v); v = v.map(q => q / lv);
      const w = [t[1] * v[2] - t[2] * v[1], t[2] * v[0] - t[0] * v[2], t[0] * v[1] - t[1] * v[0]].map(q => q / l), mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
      const ring = (p, r, k) => { const an = k / n * TAU, c = Math.cos(an) * r, s2 = Math.sin(an) * r; return [p[0] + v[0] * c + w[0] * s2, p[1] + v[1] * c + w[1] * s2, p[2] + v[2] * c + w[2] * s2]; };
      for (let k = 0; k < n; k++) g.quadO(ring(a, r0, k), ring(a, r0, k + 1), ring(b, r1, k + 1), ring(b, r1, k), c0, mid, null, [c0, c0, c1, c1]); };
    const dk = [0.52, 0.47, 0.41], pale = [0.88, 0.86, 0.8], cream = [0.93, 0.9, 0.82], fork = [0.01, 0.46, 0.01];
    seg([0, -0.02, 0], [0.005, 0.22, 0], 0.034, 0.027, dk, [0.7, 0.66, 0.6]); seg([0.005, 0.22, 0], fork, 0.027, 0.021, [0.8, 0.77, 0.7], pale);
    const tips = far ? [[0.16, 0.8, 0.06], [-0.15, 0.86, -0.07]] : [[0.2, 0.76, 0.06], [-0.17, 0.82, -0.09], [0.03, 0.92, 0.16]];
    const lf = [[0.31, 0.4, 0.33], [0.26, 0.34, 0.28], [0.36, 0.42, 0.3], [0.3, 0.37, 0.36]];
    tips.forEach((t, k) => {
      if (!far) seg(fork, t, 0.016, 0.007, pale, cream);
      const cl = far ? [[0, 0.02, 0, 0.17]] : [[0, 0.02, 0, 0.13], [0.04, -0.09, 0.05, 0.09]];   // (the leaves hang: a lower clump beside the tip)
      for (const [dx, dy, dz, r] of cl) ico(g, t[0] + dx, t[1] + dy, t[2] + dz, r, 0.55, lf[(k + Math.round(r * 100)) % 4], R, 0.35);
    });
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it: tools/razdeli-proge.mjs)
    bathurst: { ban: BT_BAN, at: BT_AT, nums: 18, shirts: BT_SHIRTS, smoke: false, camps: 9, trees: 'bt', grass: 'bt', seC: [1.22, 1.06, 0.8],
      pitBox: [-215, 235, -1], town: 150, vg: [0.98, 0.97, 0.8], edge: [1.1, 0.96, 0.92], mow: 0.35, wear: [1700, 3820, 3], cut: [1790, 1905],   // (grass: its own pasture under the vertex colours; edge: the verge worn and dusty by the asphalt; mow: fainter mowing stripes; wear: more patches and tyre marks between the walls on the hill; cut: the rock cutting at Turn 4)
      roos: true, hillCamp: [2620, 3060, 1], street: [380, 1250],   // (kangaroos on the pastures, the fans' camp on the top of the hill, houses along the climb)   // the pit building as scenery (from, to, side), houses on the built-up land past 150 m, the verge's drier grass
      flags: { stand: [{ gg: 0.6, au: 0.4 }, { gg: 0.5, au: 0.3, tm: 0.2 }], ga: { gg: 0.45, au: 0.3, tm: 0.25 }, camp: { gg: 0.4, au: 0.35, tm: 0.25 }, pole: 'au', podium: 'au' },
      vid: [['GRANDSTAND', -1]], poles: [-190, 190, 1], runoff: ['BATHURST', 'NEW SOUTH WALES', 'BATHURST'], straight: [-250, 250, 1],
      farm: { wall: [0.93, 0.9, 0.82], roof: [0.62, 0.2, 0.14], end: [0.9, 0.87, 0.8], barn: [0.66, 0.67, 0.68], barnRoof: [0.72, 0.73, 0.75], barnEnd: [0.62, 0.63, 0.64] },   // a homestead: weatherboard under red iron, a corrugated iron shed
      tvSkip: [2, 5, 8, 9, 11, 12, 13, 16], recov: [0, 3, 15], photo: [0, 3, 7, 15], jets: [[0.97, 0.97, 0.97], [0.97, 0.97, 0.97], [0.97, 0.97, 0.97]],
      screen: { name: ['BATHURST', ''], km: '6,213 km', sub: '172 m', fans: ['#0b6b38', '#f2c21a', '#13336c', '#f4f4f0', '#e2202c', '#8a6a44', '#0b6b38'], glow: '242,194,26' },
      colMod: (P) => (x, z, c) => {   // the open land is sheep pasture in spring: green after the winter's rain, olive, straw where it is drying off, greener in the hollows
        const n = P.n5(x * 0.55 + 700, z * 0.55), m = P.n3(x * 1.6 + 300, z * 1.6), k = 0.92 + (n - 0.5) * 0.2 + (m - 0.5) * 0.12, fm = nrLCf(x, z, 0);
        { const L = (c[0] + c[1] + c[2]) / 3; c[0] = lerp(c[0], L, 0.45); c[1] = lerp(c[1], L, 0.45); c[2] = lerp(c[2], L, 0.45); }   // (half the tint of the hay and stubble fields: these are pastures, and red on the soil in the grass turns rusty)
        c[0] *= k * 0.97; c[1] *= k; c[2] *= k * 0.95;
        const dry = sstep(0.5, 0.74, P.n3(x * 0.8 + 90, z * 0.8 - 40)) * 0.7 * fm, lush = sstep(0.6, 0.8, P.n1(x * 1.2 - 210, z * 1.2 + 75)) * 0.5 * fm;
        c[0] = lerp(c[0], c[0] * 1.2 + 0.04, dry); c[1] = lerp(c[1], c[1] * 1.06 + 0.02, dry); c[2] = lerp(c[2], c[2] * 1.1 + 0.04, dry);   // (drying off: paler and yellower, not orange)
        c[0] = lerp(c[0], c[0] * 0.84, lush); c[2] = lerp(c[2], c[2] * 0.92, lush);
      } },
  });
  Object.assign(API, { auTreeGeo, auRooGeo, auRoos, btGrassTex, btGumGeo });   // (what js/world-rbring.js, World and the other worlds use: tools/razdeli-proge.mjs)
  World.keep('NR', 'bathurst');   // (its grids kept between its builds; World.build frees the others': tools/razdeli-proge.mjs)
  World.ext.bathurst = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
