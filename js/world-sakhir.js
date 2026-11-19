/* =========================================================================
   WORLD — Sakhir, Bahrajn (theme 'sakhir'): the circuit in the desert of the south of the island of Bahrain by Sakhir, its own parts on the
   shared builder of js/world-rbring.js (World.ext.rbring), loaded before it (index.html). Its look (RB_LOOK.sakhir) goes on API.rbLook;
   World.ext.sakhir builds it with World.ext.rbring. Plan: docs/nove-proge-1-0.md (Del 3, A16), the track: docs/proge/sakhir.md.
   Its own parts (the builder's hooks LK.woods, LK.extra, LK.pad, LK.ground, LK.fl, LK.colMod): the desert round the circuit (the ground's
   colours: pale sand and darker grit in patches, the watered lawns green, the car parks grey; the grass picture's blades and flowers taken
   out of the sand in the ground's shader: skGround), its plants (date palms, the young trees planted on the circuit's sand, the desert's
   shrubs: skTreeGeo; the palms OpenStreetMap maps along the roads: def.sk.trees), the grandstands where OpenStreetMap has them (def.sk.stands:
   tiers, a seated crowd, white tent roofs, their names: place names), the building behind the pit garages (def.sk.pitb), the round tower
   by Turn 1 (def.sk.tower: generic, no likeness), the floodlight masts round the circuit (def.sk.mast), the service roads and the asphalt of
   the circuit's other layouts and its drag strip (def.sk.svc, def.sk.alt: OpenStreetMap) as plain asphalt on the ground, the ponds in the
   infield (def.sk.lakes), the buildings by the circuit (def.sk.bld), the flat horizon of the desert (def.far: Riverside's rsFar), the
   flag of Bahrain (World.flagMesh: look.serr), red turn numbers. Only place names on its boards (no names of the circuit, its stands, its
   tower, its people, races or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { GB, IChunks, NRC, RB, TAU, addShore, box, clamp, cyl, inPoly, lerp, mergeBands, nrDem, nrGH, nrGround, nrLCf, nrNear, polyDist, puff, rng, shoreBand, sstep, tuftGeo, tuftWindMat, waterMat, waterline } = API;
  // the text boards: place names (the place and the country, the start line's, the capital, the towns round the circuit, the grandstands'
  // names: def.sk.stands), the DRS boards
  const SK_BAN = [['SAKHIR', '#ce1126', '#fff', '#fff'], ['BAHRAIN', '#ce1126', '#fff', '#fff'], ['START · FINISH', '#16181c', '#fff', '#ce1126'], ['MANAMA', '#1c1d22', '#fff', '#ce1126'],
    ['AWALI', '#8a6a44', '#fff', '#fff'], ['ZALLAQ', '#1c1d22', '#fff', '#fff'], ['RIFFA', '#8a6a44', '#fff', '#ce1126'], ['ISA TOWN', '#1c1d22', '#fff', '#ce1126'],
    ['HAMAD TOWN', '#8a6a44', '#fff', '#fff'], ['MUHARRAQ', '#1c1d22', '#fff', '#fff'], ['DRS', '#101114', '#fff', '#39c84a']];
  const SK_AT = { num: 0, brake: 15, ban: 18, rbr: 18, spielberg: 19 };   // atlas cells: the 15 turn numbers, the braking boards, the banners
  const SK_SHIRTS = [[0.95, 0.95, 0.93], [0.92, 0.92, 0.9], [0.81, 0.08, 0.15], [0.13, 0.13, 0.15], [0.97, 0.97, 0.95], [0.42, 0.44, 0.48], [0.16, 0.2, 0.36], [0.88, 0.86, 0.8],
    [0.95, 0.52, 0.1], [0.2, 0.42, 0.78], [0.62, 0.55, 0.45], [0.75, 0.1, 0.14]];   // the fans' shirts in the spring: lots of white, red, black and grey, navy, beige, a few orange and blue
  const RED = [0.81, 0.07, 0.15], WHITE = [0.97, 0.97, 0.97];
  const BH = { serr: [WHITE, RED, 0.24, 0.38, 5] };   // the flag of Bahrain: white at the pole, five white points into the red (World.flagMesh: look.serr)

  // ---- the plants (unit height 1, instanced; LK.woods): 0 a date palm (a trunk of old leaf bases, a crown of stiff grey-green fronds
  //      arching out, the dead ones hanging under it), 1 a young tree planted on the sand (a thin trunk, a small round crown), 2 a shrub of the
  //      desert (low, grey-olive); far from the road (k >= 3) plainer. The fronds are thin: both their faces drawn ----
  function skTreeGeo(kind, far) {
    const g = new GB(), R = rng(7311 + kind * 7 + (far ? 1 : 0)), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    if (kind === 0) {
      const tr = [0.56, 0.46, 0.34], trD = [0.45, 0.36, 0.26], lean = 0.035, seg = far ? 1 : 4;
      for (let k = 0; k < seg; k++) { const y0 = 0.84 * k / seg; cyl(g, lean * y0, y0 - 0.02, 0, 0.05 - 0.01 * k / seg, 0.84 / seg + 0.03, far ? 3 : 5, k % 2 ? trD : tr, null, 0.05 - 0.01 * (k + 1) / seg); }
      const top = [lean * 0.84, 0.86, 0], FR = [0.42, 0.5, 0.33], FRB = [0.33, 0.4, 0.27], FRD = [0.34, 0.42, 0.27], DEAD = [0.62, 0.52, 0.36], DEADB = [0.5, 0.42, 0.3];
      const NF = far ? 7 : 13;
      for (let k = 0; k < NF; k++) {   // a frond: from the crown out, up and over (the upper ones steeper), narrowing to its tip
        const t = (k + 0.5) / NF, a = k * 2.39996 + R() * 0.3, up = lerp(0.95, -0.35, t) + (R() - 0.5) * 0.15, L = 0.4 + R() * 0.1, ca = Math.cos(a), sa = Math.sin(a), wd = 0.08;
        const p1 = [top[0] + ca * L * 0.5, top[1] + up * L * 0.55 + 0.04, top[2] + sa * L * 0.5], p2 = [top[0] + ca * L, top[1] + up * L * 0.45 - 0.13, top[2] + sa * L];
        const sx = -sa * wd, sz = ca * wd, l = [p1[0] - sx, p1[1] + 0.015, p1[2] - sz], r = [p1[0] + sx, p1[1] - 0.015, p1[2] + sz], c = k % 2 ? FR : FRD;
        g.tri(top, r, l, c); g.tri(top, l, r, FRB); g.tri(l, r, p2, c); g.tri(r, l, p2, FRB);
      }
      if (!far) for (let k = 0; k < 4; k++) {   // the dead fronds, dry and brown, hanging under the crown
        const a = k / 4 * TAU + 0.5, ca = Math.cos(a), sa = Math.sin(a), b = [top[0] + ca * 0.03, top[1] - 0.03, top[2] + sa * 0.03], tip = [top[0] + ca * 0.14, top[1] - 0.3, top[2] + sa * 0.14], w = [-sa * 0.05, 0, ca * 0.05];
        const l = [b[0] - w[0], b[1], b[2] - w[2]], r = [b[0] + w[0], b[1], b[2] + w[2]]; g.tri(l, r, tip, DEAD); g.tri(r, l, tip, DEADB);
      }
    } else if (kind === 1) {
      cyl(g, 0, -0.02, 0, 0.035, 0.46, far ? 3 : 4, [0.47, 0.4, 0.31], null, 0.025);
      const LF = [[0.36, 0.45, 0.24], [0.31, 0.4, 0.21], [0.4, 0.48, 0.27]];
      const cl = far ? [[0, 0.68, 0, 0.36, 0.72]] : [[0.12, 0.64, 0.04, 0.28, 0.72], [-0.13, 0.66, -0.05, 0.27, 0.72], [0, 0.78, 0.06, 0.25, 0.7]];
      cl.forEach(([x, y, z, r, sy], q) => puff(g, x, y, z, r, sy, LF[q % 3], R, 0.25, 0.55, 1.1, !far));
    } else {
      const cl = far ? [[0, 0.4, 0, 0.5, 0.75]] : [[0.12, 0.38, 0.05, 0.42, 0.75], [-0.15, 0.34, -0.07, 0.36, 0.75]];
      cl.forEach(([x, y, z, r, sy], q) => puff(g, x, y, z, r, sy, q % 2 ? [0.42, 0.43, 0.3] : [0.47, 0.47, 0.33], R, 0.3, 0.55, 1.08, false));
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // on the land cover (0 the circuit's own sand, 1 the lawns and the gardens, 2 the open desert, 3 the car parks and the buildings): the
  // lawns palms with a few young trees and shrubs; the circuit's sand its young trees and shrubs, a palm here and there; the open desert
  // a shrub now and then; palms and young trees by the car parks
  const SK_WOODS = {
    n: 3, geo: (k) => skTreeGeo(k % 3, k >= 3), cr: [0.18, 0.34, 0.4], p: [0.02, 0.2, 0.004, 0.012],
    pick(cl, R, far) {
      const r = R(), r2 = R(), r3 = R();
      const sp = cl === 1 ? (r < 0.7 ? 0 : r < 0.9 ? 1 : 2) : cl === 0 ? (r < 0.2 ? 0 : r < 0.6 ? 1 : 2) : cl === 2 ? (r < 0.85 ? 2 : 1) : r < 0.6 ? 0 : 1;
      let h = sp === 0 ? 7 + r2 * 6 : sp === 1 ? 3.5 + r2 * 3.5 : 0.8 + r2 * 1.1; if (far) h *= 1.05;
      return [sp, h, h * (sp === 0 ? 0.85 + r3 * 0.25 : sp === 1 ? 0.9 + r3 * 0.3 : 1.6 + r3 * 0.5)];
    },
  };

  // the ground's shader (LK.ground; in place of World's grassLook, which leaves a material it finds marked): where the vertex colours
  // are green (the watered lawns) grassLook's lighter and darker patches and clumps, its loud green toned down; elsewhere sand: the grass
  // picture's blades and flowers taken out (a little of its light and dark kept: grain), patches tens of metres across, ripples across
  // the wind and grains near the camera (world-space noise: no texture, no extra draw)
  const SK_GLSL = [
    'varying vec2 vSkW; varying float vSkD; uniform vec3 uSkAvg;',
    'float skHash(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }',   // (no sine: steady on phones' GPUs)
    'float skNoise(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f); return mix(mix(skHash(i), skHash(i + vec2(1.0, 0.0)), u.x), mix(skHash(i + vec2(0.0, 1.0)), skHash(i + vec2(1.0, 1.0)), u.x), u.y); }'].join('\n');
  function skGround(m) {
    const avg = (m.map && m.map.avgCol) || [0.35, 0.49, 0.22];
    m.userData.grassLook = true;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uSkAvg = { value: new THREE.Vector3(avg[0], avg[1], avg[2]) };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vSkW; varying float vSkD;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvSkW = (modelMatrix * vec4(transformed, 1.0)).xz; vSkD = -mvPosition.z;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + SK_GLSL).replace('#include <color_fragment>', `#include <color_fragment>
        {
          vec3 base = vColor * uSkAvg;   // (the colour the vertex colours mean: over the grass picture's average)
          float gg = clamp((base.g - max(base.r, base.b)) * 8.0, 0.0, 1.0), near = 1.0 - smoothstep(60.0, 150.0, vSkD);
          float n1 = skNoise(vSkW * 0.03) * 0.6 + skNoise(vSkW * 0.09 + 11.3) * 0.4, n2 = skNoise(vSkW * 0.6 + 3.7) * 0.6 + skNoise(vSkW * 1.9 + 9.1) * 0.4;
          vec3 gc = diffuseColor.rgb;
          gc *= mix(1.0, 0.86 + 0.28 * n1, gg); gc *= 1.0 + gg * (n2 - 0.5) * 0.2 * near;
          float L = dot(gc, vec3(0.3, 0.59, 0.11)); gc = mix(gc, mix(vec3(L), gc, 0.75) * vec3(1.03, 0.97, 0.88), gg * 0.55);
          float tl = dot(texelColor.rgb, vec3(0.3, 0.59, 0.11)) / dot(uSkAvg, vec3(0.3, 0.59, 0.11));
          float rip = skNoise(vec2(dot(vSkW, vec2(0.83, 0.55)) * 1.4, dot(vSkW, vec2(-0.55, 0.83)) * 0.22));
          vec3 sc = diffuse * base * (0.93 + 0.14 * n1) * (1.0 + ((n2 - 0.5) * 0.14 + (rip - 0.5) * 0.07) * near) * mix(1.0, tl, 0.16);
          diffuseColor.rgb = mix(sc, gc, gg);
        }`);
    };
    m.customProgramCacheKey = () => 'skGround';
    m.needsUpdate = true;
  }

  // the ways on the ground (def.sk.svc: OSM's highway=service, 5 m wide; def.sk.alt: the asphalt of the circuit's other layouts, 13 m wide,
  // the drag strip (a negative count) 18 m): plain asphalt on the terrain, its two edges every 4 m, 8 cm over it and drawn over it; the
  // service roads not inside the barriers nor within 4 m past them (the run-offs are the builder's), the other layouts up to 1.5 m from
  // the barriers (they end at them, closed off); the trees and the people off them
  // how far past the barrier on its side of the road a point is (negative: inside it, in the run-off; i: the road's nearest index)
  const skLat = (x, z, i) => { const T = API.T, lat = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i]; return Math.abs(lat) - (lat > 0 ? T.br[i] : T.bl[i]); };
  function skWays({ root, exclPush, CR }, ways, tex, st) {
    const rb = new RB(true);
    for (const [S, hw, gap, col] of ways) for (let k = 0; k < S.length;) {
      const n0 = S[k], n = Math.abs(n0), HW = n0 < 0 ? hw[1] : hw[0], p = []; for (let q = 0; q < n; q++) p.push([S[k + 1 + q * 2], S[k + 2 + q * 2]]); k += 1 + n * 2;
      const pts = []; for (let q = 0; q + 1 < n; q++) { const [ax, az] = p[q], [bx, bz] = p[q + 1], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 4)); for (let t = 0; t < m; t++) pts.push([lerp(ax, bx, t / m), lerp(az, bz, t / m)]); }
      pts.push(p[n - 1]);
      let prev = -1, along = 0;
      for (let q = 0; q < pts.length; q++) {
        const [x, z] = pts[q], a = pts[Math.max(0, q - 1)], b = pts[Math.min(pts.length - 1, q + 1)], dx = b[0] - a[0], dz = b[1] - a[1], dl = Math.hypot(dx, dz) || 1;
        if (q) along += Math.hypot(x - pts[q - 1][0], z - pts[q - 1][1]);
        const nn = nrNear(x, z); if (nn.i >= 0 && (nn.dd < gap + (gap > 3 ? HW : 0) || (gap > 3 && skLat(x, z, nn.i) < HW + 0.5))) { prev = -1; continue; }   // (the service roads not inside the run-offs' barriers)
        const nx = -dz / dl, nz = dx / dl, row = [-HW, HW].map(o => { const px = x + nx * o, pz = z + nz * o; return [px, nrGround(px, pz) + 0.08, pz]; });   // (left to right in the way's direction: (nx, nz) its right)
        const r = rb.row(row, [col, col], row.map((e, j) => [j * HW / 2, along / 4]));
        if (prev >= 0) rb.link(prev, r, 0, 1); prev = r;
        if (q % 2 === 0) { exclPush(x, z, HW + 1.5); if (nn.i >= 0 && nn.dd < 70) CR.avoid(x, z, HW + 0.5); }
        st.road += 4;
      }
    }
    if (rb.empty) return;
    const m = new THREE.Mesh(rb.geometry(), new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
    m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'sakhir ways'; root.add(m);
  }

  // the ponds (def.sk.lakes: [name, x, z, ...]) per build: the outline, its box, the water's level: a little under the ground round its
  // shore (the lowest quarter of the terrain model there), under the road by it (0.9 m below the road within 40 m) (as Buriram's pond)
  const skPolys = (arr, k0) => (arr || []).map(a => {
    const p = []; for (let k = k0; k + 1 < a.length; k += 2) p.push([a[k], a[k + 1]]);
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of p) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    return { p, b: [x0, x1, z0, z1] };
  });
  let SKL = [];
  function skLakes() {
    const T = API.T, out = [];
    for (const { p: poly, b } of skPolys((T.def.sk || {}).lakes, 1)) {
      const [x0, x1, z0, z1] = b, hs = poly.map(([x, z]) => nrDem(x, z)).sort((u, v) => u - v); let lvl = hs[Math.floor(hs.length / 4)] - 0.3;
      for (let i = 0; i < T.N; i++) { const x = T.px[i], z = T.pz[i]; if (x > x0 - 50 && x < x1 + 50 && z > z0 - 50 && z < z1 + 50 && polyDist(poly, x, z) < 40) lvl = Math.min(lvl, T.hy[i] - 0.9); }
      out.push({ poly, b, lvl });
    }
    return out;
  }
  // LK.pad (the builder's ground round the circuit, before it is built): the ponds' beds dug and the land kept above the water, both on one
  // even slope through the shore (0.1 m per metre from the outline), the bed shelving on to 1.5 m, the land back to its own height within
  // 10 m; not inside the barriers, fully only 6 m past them
  function skPad(pad0) {
    SKL = skLakes();
    const NRN = API.NRN;
    return (x, z, h) => {   // (NRN: the nearest road sample of the point being built, its offset and its distance past the barriers: js/world.js nrH)
      h = pad0(x, z, h);
      for (const L of SKL) {
        const b = L.b; if (x < b[0] - 8 || x > b[1] + 8 || z < b[2] - 8 || z > b[3] + 8) continue;
        const d = polyDist(L.poly, x, z), f = sstep(1, 6, NRN.dd);
        if (inPoly(L.poly, x, z)) return lerp(h, Math.min(h, L.lvl - Math.min(1.5, 0.1 * d + 0.02 * d * d)), f);
        if (d < 10) { const t = L.lvl + 0.1 * d; return lerp(h, lerp(t, Math.max(h, t), sstep(0, 10, d)), f); }
      }
      return h;
    };
  }
  // the water: flat at each pond's level (World's waterMat: still water, wavelets, the sky mirrored), a shore band round it; reeds in
  // stretches along its margin (World's wind-swayed tufts, within 90 m of the road, none within 3 m past the barriers); nothing stands in it
  function skWater({ root, tex, exclPush, excluded, CR, out }, st) {
    if (!SKL.length) return;
    const G = API.NR.G, gw = new GB(true), wc = [1, 1, 1], bands = [], gi = (v, o, n) => clamp(Math.floor((v - o) / NRC), 0, n - 1), R = rng(7333), P = API.NR;
    const tu = new IChunks(tuftGeo(false), tuftWindMat(out.dyn.wind || (out.dyn.wind = { value: 0 })), 512);
    for (const L of SKL) {
      const y = L.lvl, Q = (p) => [p[0], y, p[1]], uv = (p) => [p[0] / 16, -p[1] / 16];
      for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(L.poly.map(p => new THREE.Vector2(p[0], p[1])), [])) {
        const A = L.poly[a], B = L.poly[b], C = L.poly[c]; gw.triO(Q(A), Q(B), Q(C), wc, [A[0], y - 5, A[1]], wc, wc, uv(A), uv(B), uv(C)); }
      const [x0, x1, z0, z1] = L.b;
      for (let z = z0 + 6; z < z1; z += 12) for (let x = x0 + 6; x < x1; x += 12) if (inPoly(L.poly, x, z) && polyDist(L.poly, x, z) > 4) { exclPush(x, z, 9); CR.avoid(x, z, 8); }   // (no tree, nobody in it)
      for (const [x, z] of L.poly) exclPush(x, z, 2);
      const wl = waterline(nrGH, G.x0, G.z0, NRC, gi(x0 - 14, G.x0, G.nx), gi(x1 + 22, G.x0, G.nx), gi(z0 - 14, G.z0, G.nz), gi(z1 + 22, G.z0, G.nz), y);   // (where the terrain meets the water)
      const sd = (x, z) => { const d = polyDist(L.poly, x, z); return Math.min(inPoly(L.poly, x, z) ? d : -d, wl(x, z)); };
      bands.push(shoreBand(x0 - 6, z0 - 6, x1 + 6, z1 + 6, y + 0.015, sd, 16));
      const n = L.poly.length;   // the reeds at the waterline, in stretches with gaps
      for (let k = 0; k < n; k++) {
        const [ax, az] = L.poly[k], [bx, bz] = L.poly[(k + 1) % n], len = Math.hypot(bx - ax, bz - az); if (len < 0.5) continue;
        for (let t = R() * 3; t < len; t += 2.5 + R() * 3) {
          if (P.n1(lerp(ax, bx, t / len) * 2, lerp(az, bz, t / len) * 2) < 0.42) continue;
          const u = t / len, o = (R() - 0.3) * 3, x = lerp(ax, bx, u) - (bz - az) / len * o, z = lerp(az, bz, u) + (bx - ax) / len * o, q = nrNear(x, z);
          if ((q.i >= 0 && q.dd < 3) || excluded(x, z)) continue;
          const cv = 0.9 + R() * 0.2, s = 0.9 + R() * 0.6; tu.add(x, nrGround(x, z) - 0.05, z, R() * TAU, s * (1 + R() * 0.3), s * (1.1 + R() * 0.5), [0.5 * cv, 0.56 * cv, 0.3 * cv]); st.reeds++;
        }
      }
      st.lakes++;
    }
    const WO = { len: 0.9, amp: 0.5, refl: 0.55, land: 0.8, shal: 0.65, lap: 0.4, surf: 0 }, wm = new THREE.Mesh(gw.geometry(), waterMat(tex, Object.assign({ color: 0x4f7c7a }, WO)));   // (a green-blue: a pond in the sand)
    wm.receiveShadow = true; wm.matrixAutoUpdate = false; wm.updateMatrix(); wm.name = 'sakhir ponds'; root.add(wm); out.dyn.water = tex.water;
    addShore(root, mergeBands(bands), wm.material, WO);
    tu.addTo(root, false);
  }

  // the names of the grandstands (def.sk.stands' last field: place names) for their boards: 8 cells of 512 x 64 px, one under another,
  // white on Bahrain's red
  function skNameTex(names) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512; const x = c.getContext('2d');
    names.forEach((t, k) => {
      const y0 = k * 64; x.fillStyle = '#ce1126'; x.fillRect(0, y0, 512, 64); x.fillStyle = '#fff'; x.fillRect(0, y0 + 2, 512, 3); x.fillRect(0, y0 + 59, 512, 3);
      x.font = '40px "Russo One", "Arial Black", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, 256, y0 + 33, 488);
    });
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  // the grandstands where OpenStreetMap has them (def.sk.stands: [x, z, length, width, angle (deg), rows, front, roof (% of the depth from the
  // back), name]): straight blocks on their outlines, the tiers rising from the front (the side facing the road) to the back wall; the
  // crowd on every tier (one strip each along the whole stand); white tent roofs over the back part (modules of about 13 m, each pulled
  // up to its peak), on masts at the back and the front; the stand's name on a board under the roof's front edge, facing the road; the
  // flags of Bahrain on poles along the main stand's roof
  function skStands({ root, scen, exclPush, CR, out }, st, crowd) {
    const S = (API.T.def.sk || {}).stands || []; if (!S.length) return;
    const DEP = 0.95, RISE = 0.6, W1 = [1, 1, 1], TC = [[0.86, 0.84, 0.8], [0.7, 0.69, 0.66], [0.78, 0.77, 0.74]], TENT = [0.97, 0.97, 0.96], TENTU = [0.78, 0.78, 0.77], STL = [0.86, 0.87, 0.9];
    const cg = new GB(true), ng = new GB(true), WROT = Math.atan2(API.RB_WIND[1], API.RB_WIND[0]), FR = rng(7339);
    S.forEach(([x, z, L, W, deg, rows, front, roofP], si) => {
      const a = deg * Math.PI / 180, ux = Math.cos(a), uz = Math.sin(a), nx = -uz * front, nz = ux * front, hL = L / 2;   // (u along it, n towards the road)
      const Q = (b, y, t) => [x + nx * (W / 2 - 0.3 - b) + ux * t, y, z + nz * (W / 2 - 0.3 - b) + uz * t];   // (b metres back from its front, t along it from its middle)
      let gy = Infinity; for (const t of [-hL, 0, hL]) { const p = Q(0, 0, t); gy = Math.min(gy, nrGround(p[0], p[2])); }
      gy += 0.05;
      const back = rows * DEP, top = gy + 0.55 + (rows - 1) * RISE, prof = [[-0.3, gy - 0.6]];
      for (let k = 0; k < rows; k++) { const y = gy + 0.55 + k * RISE; prof.push([k * DEP, y], [(k + 1) * DEP, y]); }
      prof.push([back, top + 1.2], [back + 0.35, top + 1.2], [back + 0.35, gy - 0.6]);
      const g = scen.get(x, z), n = prof.length;
      for (let e = 0; e + 1 < n; e++) {   // the concrete: the front, riser and tread per tier, the back wall; each face looks out of the stand
        const [b0, y0] = prof[e], [b1, y1] = prof[e + 1], up = Math.abs(y1 - y0) < 0.05, bm = (b0 + b1) / 2, ym = (y0 + y1) / 2;
        const ins = up ? Q(bm, ym - 1, 0) : e >= n - 3 ? Q(bm - 1, ym, 0) : Q(bm + 1, ym, 0);   // (treads: below; risers: behind; the back wall: in front)
        g.quadO(Q(b0, y0, -hL), Q(b1, y1, -hL), Q(b1, y1, hL), Q(b0, y0, hL), up ? TC[0] : e >= n - 3 ? TC[1] : TC[2], ins);
      }
      for (const t of [-hL, hL]) {   // the end walls: strips from the profile down to the ground
        const ins = Q(back / 2, gy + 3, t * 0.9);
        for (let e = 0; e + 2 < n; e++) { const [b0, y0] = prof[e], [b1, y1] = prof[e + 1]; if (Math.abs(b1 - b0) < 0.01) continue;
          g.quadO(Q(b0, y0, t), Q(b1, y1, t), Q(b1, gy - 0.6, t), Q(b0, gy - 0.6, t), TC[1], ins); }
      }
      for (let k = 0; k < rows; k++) {   // the crowd on the treads (a strip along each tier)
        const y = gy + 0.57 + k * RISE, v = (k * 0.11) % 1;
        cg.quadUp(Q(k * DEP, y, -hL), Q((k + 1) * DEP, y, -hL), Q((k + 1) * DEP, y, hL), Q(k * DEP, y, hL), [W1, W1, W1, W1], [[0, v], [0, v + 0.1], [L / 12, v + 0.1], [L / 12, v]]);
      }
      // the tent roof: from the front (all of the main stand) or over the back part, its edges 4.3 m over the top tier, a peak in each module
      const r0 = roofP >= 100 ? -1.5 : back * (1 - roofP / 100), r1 = back + 1.2, hE = top + 4.3, NM = Math.max(1, Math.round(L / 13)), lm = L / NM, pk = Math.min(lm, r1 - r0) * 0.32;
      const tierY = (b) => (b < 0 ? gy : gy + 0.55 + Math.min(rows - 1, Math.floor(b / DEP)) * RISE);
      for (let m = 0; m < NM; m++) {
        const t0 = -hL + m * lm, t1 = t0 + lm, F0 = Q(r0, hE, t0), F1 = Q(r0, hE, t1), B1 = Q(r1, hE, t1), B0 = Q(r1, hE, t0), Pk = Q((r0 + r1) / 2, hE + pk, (t0 + t1) / 2);
        const up = [Pk[0], Pk[1] - 8, Pk[2]], dn = [Pk[0], Pk[1] + 30, Pk[2]];
        for (const [p, q] of [[F0, F1], [F1, B1], [B1, B0], [B0, F0]]) { g.triO(p, q, Pk, TENT, up); g.triO(p, q, Pk, TENTU, dn); }
        for (const [b, yb] of [[r1, gy - 0.3], [r0, tierY(r0) - 0.1]]) { const c = Q(b, 0, t0); box(g, c[0], yb, c[2], 0.45, hE + 0.6 - yb, 0.45, a, STL, null, true); }   // (the masts: at the back from the ground, at the front from the tier under it)
      }
      for (const [b, yb] of [[r1, gy - 0.3], [r0, tierY(r0) - 0.1]]) { const c = Q(b, 0, hL); box(g, c[0], yb, c[2], 0.45, hE + 0.6 - yb, 0.45, a, STL, null, true); }
      {   // the stand's name under the roof's front edge, facing the road (the reader's right: looking at the stand from the road)
        const Wd = Math.min(24, L * 0.7), H = Wd / 8, rx = nz, rz = -nx, C = Q(r0 - 0.15, 0, 0), y0 = hE - 0.4 - H, v0 = 1 - (si + 1) / 8, v1 = 1 - si / 8;
        const A = [C[0] - rx * Wd / 2, y0, C[2] - rz * Wd / 2], B = [C[0] + rx * Wd / 2, y0, C[2] + rz * Wd / 2], Cc = [B[0], y0 + H, B[2]], D = [A[0], y0 + H, A[2]];
        ng.quadO(A, B, Cc, D, W1, Q(r0 + 1, y0 + H / 2, 0), [[0, v0], [1, v0], [1, v1], [0, v1]]);
      }
      if (si === 0) for (let m = 0; m <= NM; m += 2) {   // the flags of Bahrain on poles along the main stand's roof, over its front edge
        const c = Q(r0, 0, -hL + m * lm); cyl(g, c[0], hE - 0.2, c[2], 0.06, 4.2, 5, [0.88, 0.88, 0.9]);
        API.flags.add(c[0], hE + 3.95, c[2], WROT + (FR() - 0.5) * 0.3, BH, 2.2, 1.35);
      }
      for (let t = -hL; t <= hL + 0.1; t += 10) { const c = Q(back / 2, 0, Math.min(t, hL)); exclPush(c[0], c[2], W / 2 + 4); CR.exclAdd(c[0], c[2], W / 2 + 2); }
      for (let t = -hL + 10; t < hL; t += 20) { const c = Q(back / 2, 0, t); crowd.push(c[0], c[2], 0.8); }   // (for the crowd's sound)
      st.stands++;
    });
    const tx = API.rbCrowdTex(false), cm = new THREE.Mesh(cg.geometry(), API.crowdUV(new THREE.MeshLambertMaterial({ map: tx, vertexColors: true }), 1, 0.11, 0.1));
    cm.matrixAutoUpdate = false; cm.updateMatrix(); cm.name = 'sakhir grandstand crowd'; root.add(cm);
    const nt = skNameTex(S.map(s => s[8])), nm = new THREE.Mesh(ng.geometry(), new THREE.MeshLambertMaterial({ map: nt }));
    nm.matrixAutoUpdate = false; nm.updateMatrix(); nm.name = 'sakhir grandstand names'; root.add(nm);
    if (out.ownTex) out.ownTex.push(tx, nt);
  }

  // the floodlight masts round the circuit (def.sk.mast: OSM, [x, z, ...]): a tapered galvanised pole 24 m high, a frame of lamps on top
  // turned to the track; in the scenery's chunks (no draws of their own); none inside the barriers
  function skMasts({ scen, exclPush, CR }, st) {
    const M = (API.T.def.sk || {}).mast || [], T = API.T, col = [0.68, 0.69, 0.7], lamp = [0.93, 0.93, 0.88];
    for (let k = 0; k + 1 < M.length; k += 2) {
      let x = M[k], z = M[k + 1]; const q = nrNear(x, z); if (q.i < 0 || q.dd < 1) continue;
      const past = skLat(x, z, q.i); if (past < 2.5) { const sg = (x - T.px[q.i]) * T.nx[q.i] + (z - T.pz[q.i]) * T.nz[q.i] >= 0 ? 1 : -1; x += T.nx[q.i] * sg * (2.5 - past); z += T.nz[q.i] * sg * (2.5 - past); }   // (in a wide run-off of the game: behind its barrier)
      const y = nrGround(x, z) - 0.2, g = scen.get(x, z); let fx = T.px[q.i] - x, fz = T.pz[q.i] - z; const fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
      const rot = Math.atan2(fx, -fz);   // (the frame's width across the way it looks)
      cyl(g, x, y, z, 0.3, 24.2, 6, col, col, 0.17);
      box(g, x + fx * 0.35, y + 22.4, z + fz * 0.35, 3.4, 2.1, 0.45, rot, col, col);
      box(g, x + fx * 0.6, y + 22.55, z + fz * 0.6, 3.1, 1.8, 0.08, rot, lamp, lamp, true);
      exclPush(x, z, 2); CR.avoid(x, z, 1); st.masts++;
    }
  }

  // the round tower by Turn 1 (def.sk.tower: [x, z, radius, height]; generic): a white drum, the upper floors wider, glazed between white
  // bands, a flat roof
  function skTower({ scen, exclPush, CR }, st) {
    const t = (API.T.def.sk || {}).tower; if (!t) return;
    const [x, z, r, h] = t, y = nrGround(x, z) - 0.5, g = scen.get(x, z), W = [0.93, 0.92, 0.9], GL = [0.26, 0.33, 0.4];
    cyl(g, x, y, z, r * 0.62, h * 0.6 + 0.5, 16, W, W);
    for (let k = 0; k < 3; k++) { const y0 = y + 0.5 + h * (0.6 + k * 0.13); cyl(g, x, y0, z, r * (0.96 + k * 0.02), h * 0.1, 16, GL, GL); cyl(g, x, y0 + h * 0.1, z, r * (1 + k * 0.02), h * 0.03, 16, W, W); }
    cyl(g, x, y + 0.5 + h * 0.99, z, r * 0.5, h * 0.04, 12, W, W);
    exclPush(x, z, r + 5); CR.avoid(x, z, r + 2); st.tower = 1;
  }

  // the horizon (def.far, Riverside's rsFar): the desert's low ridges and plains in the dry haze
  const skFarCol = (h, d) => {
    const c = h < 30 ? [0.72, 0.62, 0.47] : h < 60 ? [0.66, 0.57, 0.44] : [0.6, 0.52, 0.41], f = (1 - Math.exp(-d / 9000)) * 0.9;
    return c.map((v, k) => lerp(v, [0.89, 0.85, 0.79][k], f));
  };

  // LK.extra: the ways, the ponds, the grandstands, the building behind the pits, the tower, the masts, the buildings by the circuit (OSM
  // outlines as boxes: white or sand render, flat grey roofs), the palms OSM maps, the horizon; before the crowds and the trees, which keep
  // clear of them
  const SK_CROWD = [];
  function skExtra(o) {
    const { scen, exclPush, CR, root, out, tex } = o, sk = API.T.def.sk || {}, R = rng(7349), st = { road: 0, lakes: 0, reeds: 0, stands: 0, masts: 0, tower: 0, buildings: 0, palms: 0, far: 0 };
    SK_CROWD.length = 0;
    skWays(o, [[sk.svc || [], [2.5, 2.5], 4, [0.9, 0.9, 0.92]], [sk.alt || [], [6.5, 9], 1.5, [0.8, 0.8, 0.82]]], tex, st);
    skWater(o, st);
    skStands(o, st, SK_CROWD);
    if (sk.pitb) {   // the building behind the pit garages: white, the upper floors glazed towards the pits, a flat roof
      const [x, z, L, W, deg, h] = sk.pitb, a = deg * Math.PI / 180; let y = 1e9;
      for (const [p, q] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + (p * L * Math.cos(a) - q * W * Math.sin(a)) / 2, z + (p * L * Math.sin(a) + q * W * Math.cos(a)) / 2));
      const g = scen.get(x, z); box(g, x, y - 0.4, z, L, h + 0.4, W, a, [0.93, 0.92, 0.89], [0.62, 0.63, 0.65], true);
      box(g, x, y + h * 0.48, z, L + 0.3, h * 0.3, W + 0.3, a, [0.24, 0.31, 0.38], [0.62, 0.63, 0.65], true);
      for (let t = -L / 2; t <= L / 2; t += 12) { const px = x + Math.cos(a) * t, pz = z + Math.sin(a) * t; exclPush(px, pz, W / 2 + 3); CR.avoid(px, pz, W / 2 + 1); }
    }
    skTower(o, st);
    skMasts(o, st);
    const b6 = sk.bld || [], WALL = [[0.94, 0.93, 0.9], [0.9, 0.85, 0.74], [0.86, 0.8, 0.68]], ROOF = [[0.6, 0.61, 0.63], [0.72, 0.7, 0.66]];
    for (let k = 0; k < b6.length; k += 6) {
      const [x, z, L, W, deg, h] = b6.slice(k, k + 6), rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot);
      let y = 1e9, inRun = false;
      for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const cx = x + (a * L * c - b * W * s) / 2, cz = z + (a * L * s + b * W * c) / 2, q = nrNear(cx, cz);
        y = Math.min(y, nrGround(cx, cz)); if (q.i >= 0 && skLat(cx, cz, q.i) < 1) inRun = true;
      }
      if (inRun) continue;   // (the few huts OSM has where the game's run-offs are wider than the real ones' edges: not inside the barriers)
      box(scen.get(x, z), x, y - 0.4, z, L, h + 0.4, W, rot, WALL[Math.floor(R() * 3)], ROOF[Math.floor(R() * 2)], true);
      exclPush(x, z, Math.hypot(L, W) / 2 + 2); CR.avoid(x, z, Math.hypot(L, W) / 2 + 1); st.buildings++;
    }
    {   // the palms OSM maps along the roads, the car parks and the buildings (def.sk.trees): date palms 8-12 m, not by the barriers
      const t2 = sk.trees || [], pc = new IChunks(skTreeGeo(0, false), new THREE.MeshLambertMaterial({ vertexColors: true }), 384);
      for (let k = 0; k + 1 < t2.length; k += 2) {
        const x = t2[k], z = t2[k + 1], q = nrNear(x, z); if ((q.i >= 0 && (q.dd < 2.5 || skLat(x, z, q.i) < 1.5)) || o.excluded(x, z)) continue;   // (none in the run-offs)
        const h = 8 + R() * 4, cv = 0.9 + R() * 0.2; pc.add(x, nrGround(x, z) - 0.1, z, R() * TAU, h * (0.85 + R() * 0.2), h, [cv, cv, cv]); exclPush(x, z, 2.5); st.palms++;
      }
      pc.addTo(root, true);
    }
    if (API.T.def.far && API.rsFar) { out.dyn.far = API.rsFar(root, API.T.def.far, 'summer', 6, skFarCol); st.far = 1; }   // (World.update: no car, back where it was built)
    return st;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    sakhir: { ban: SK_BAN, at: SK_AT, nums: 15, numC: ['#ce1126', '#fff', '#fff'], shirts: SK_SHIRTS, smoke: false, camps: 0, farms: 0, seC: [1.7, 1.2, 2.3], gravel: false, noVid: true,
      pitBox: [-210, 180, 1], mow: 0.001, vg: [2.12, 1.42, 2.22],   // (the pit garages on the right of the main straight; the verges inside the barriers sand, no mowing stripes)
      woods: SK_WOODS, extra: skExtra, pad: skPad, ground: skGround, lane: true, fl: { bh: BH }, ck: 2,   // (ck: chunks twice as big: fewer draws where much of the circuit is in view)
      flags: { stand: [{ bh: 0.8, tm: 0.2 }, { bh: 0.7, tm: 0.2, rb: 0.1 }], ga: { bh: 0.8, tm: 0.2 }, camp: { bh: 0.85, tm: 0.15 }, pole: 'bh', podium: 'bh' },
      vid: [], poles: [-150, 160, -1], runoff: ['SAKHIR', 'BAHRAIN', 'MANAMA'], straight: [-120, 120, -1],
      farm: { wall: [0.93, 0.9, 0.84], roof: [0.62, 0.6, 0.56], end: [0.9, 0.87, 0.8], barn: [0.75, 0.68, 0.56], barnRoof: [0.6, 0.6, 0.6], barnEnd: [0.72, 0.65, 0.54] },
      tvSkip: [1, 2, 4, 5, 6, 11, 14], recov: [0, 3, 7, 9, 13], photo: [0, 3, 7, 9, 13], jets: [RED, WHITE, RED],   // (TV towers at the big corners, not at the kinks and the second parts of the double corners)
      colMod: (P) => {   // the desert in the spring: pale sand, darker grit and stones in patches, paler drifts; the watered lawns green, round the ponds too; the car parks dusty grey
        const PO = skPolys((API.T.def.sk || {}).lakes, 1);
        const wet = (x, z) => { let w = 0; for (const { p, b } of PO) { if (x < b[0] - 12 || x > b[1] + 12 || z < b[2] - 12 || z > b[3] + 12) continue; w = Math.max(w, inPoly(p, x, z) ? 1 : sstep(12, 2, polyDist(p, x, z))); } return w; };
        return (x, z, c) => {
          const lw = sstep(0.3, 0.65, nrLCf(x, z, 1)), pv = sstep(0.3, 0.65, nrLCf(x, z, 3)), sa = Math.max(0, 1 - lw - pv), own = nrLCf(x, z, 0);   // (the lawns' and car parks' edges sharp: watered in the sand)
          const n1 = P.n5(x * 0.5 + 300, z * 0.5 - 120), n2 = P.n3(x * 1.3 - 70, z * 1.3 + 40), n3 = P.n1(x * 0.35 + 510, z * 0.35 + 90), v = 0.95 + 0.1 * n2;
          const grit = sstep(0.45, 0.75, n3) * lerp(0.75, 0.35, own), drift = sstep(0.55, 0.85, n1) * (1 - grit);   // (the circuit's own sand graded, more even)
          let r = lerp(2.34, 1.95, grit), g = lerp(1.45, 1.22, grit), b = lerp(2.36, 2.05, grit);
          r = lerp(r, 2.55, drift); g = lerp(g, 1.6, drift); b = lerp(b, 2.75, drift);
          const w = PO.length ? wet(x, z) : 0, lwn = Math.max(lw, w * 0.85), sa2 = sa * (1 - w * 0.85), lv = 0.95 + 0.1 * n1;
          c[0] = (r * sa2 + 0.92 * lwn * lv + 1.55 * pv) * v; c[1] = (g * sa2 + 1.06 * lwn * lv + 1.08 * pv) * v; c[2] = (b * sa2 + 0.8 * lwn * lv + 2.3 * pv) * v;
          const s = sa2 + lwn + pv; if (s > 0) { c[0] /= s; c[1] /= s; c[2] /= s; }
        };
      } },
  });
  World.keep('NR', 'sakhir');   // (its grids kept between its builds; World.build frees the others')
  World.ext.sakhir = (scene, tex, opts) => {   // (the shared builder: js/world-rbring.js; its grandstands' crowds are this world's own: their sound added)
    const out = World.ext.rbring(scene, tex, opts);
    if (out && SK_CROWD.length) out.crowdPts = Float32Array.from([...(out.crowdPts || []), ...SK_CROWD]);
    return out;
  };
})();
