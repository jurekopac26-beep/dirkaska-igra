/* =========================================================================
   WORLD — Lusail, Katar (theme 'lusail'): the circuit in the flat coastal desert north of Doha by the new town of Lusail, its own parts on
   the shared builder of js/world-rbring.js (World.ext.rbring), loaded before it (index.html). Its look (RB_LOOK.lusail) goes on API.rbLook;
   World.ext.lusail builds it with World.ext.rbring. Plan: docs/nove-proge-1-0.md (A18), the track: docs/proge/lusail.md.
   Its own parts (the builder's hooks LK.woods, LK.extra, LK.ground, LK.fl, LK.colMod): the desert round the circuit (the ground's shader:
   the grass picture taken out where the land is not green, a pale gravel plain with darker and lighter patches and pebbles near the camera,
   the drifts of sand warmer; luGround), the watered lawns and gardens by the buildings and the roads (def.lc: OpenStreetMap), the date
   palms in rows along the roads and in the gardens (def.sk.tr: OpenStreetMap), the shade trees, the garden shrubs and the desert's grey
   scrub (luTreeGeo), the service roads round the circuit (def.sk.svc: OpenStreetMap) as plain asphalt on the ground, the buildings by the
   circuit (def.sk.bld: OpenStreetMap), the paddock building behind the garages (def.sk.pitb) with its glass front, the Qatari flag among
   the fans' flags (World.flagMesh's serrated band, look.serr), maroon turn numbers, the flat horizon with the towers of the new town by the
   sea (def.far: Riverside's rsFar). Only place names on its boards (no names of the circuit, its people, races or sponsors).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const { GB, IChunks, RB, TAU, box, cyl, ico, lerp, nrGround, nrLCf, nrLump, nrNear, nrShade, rng, sstep, vary } = API;
  // the text boards: place names (the town, the country, its capital, the municipality round the circuit, the towns of the coast and the
  // inland), the grandstands' names (def.stands), the start line's, the DRS boards
  const LU_BAN = [['LUSAIL', '#8a1538', '#fff', '#fff'], ['QATAR', '#8a1538', '#fff', '#fff'], ['START · FINISH', '#16181c', '#fff', '#8a1538'], ['DOHA', '#2b2d33', '#fff', '#8a1538'],
    ['AL DAAYEN', '#8a1538', '#fff', '#d8c39a'], ['AL KHOR', '#2b2d33', '#fff', '#fff'], ['AL WAKRAH', '#6b5236', '#fff', '#fff'], ['AL RAYYAN', '#8a1538', '#fff', '#fff'],
    ['UMM SALAL', '#2b2d33', '#fff', '#8a1538'], ['DRS', '#101114', '#fff', '#39c84a']];
  const LU_AT = { num: 0, brake: 16, ban: 19, rbr: 19, spielberg: 20 };   // atlas cells: the 16 turn numbers, the braking boards, the banners
  const LU_SHIRTS = [[0.54, 0.08, 0.22], [0.96, 0.96, 0.94], [0.94, 0.94, 0.92], [0.14, 0.14, 0.16], [0.45, 0.47, 0.5], [0.86, 0.1, 0.12], [0.98, 0.79, 0.1], [0.16, 0.36, 0.72],
    [0.92, 0.92, 0.9], [0.62, 0.12, 0.26], [0.98, 0.55, 0.1], [0.2, 0.5, 0.32]];   // the fans' shirts: maroon and white, the white of the long robes, black and grey, a few red, yellow, blue, orange and green
  // the Qatari flag: a white band at the pole, serrated into the maroon field with nine white points (World.flagMesh's look.serr, as
  // assets/flags/qatar.svg): the band solid to 0.293 of the length, the points' tips at 0.373
  const QA = { serr: [[0.96, 0.96, 0.95], [0.54, 0.08, 0.22], 0.293, 0.373, 9] };

  // ---- the trees (unit height 1, instanced; LK.woods and the lone trees): 0 a date palm (a straight trunk in rough bands, a round crown of
  //      long fronds arching out and down, folded along their ribs, both faces: the crowns are seen from below), 1 a shade tree of the
  //      desert (a short trunk, a low wide crown of dull olive lumps), 2 a garden shrub (a dark green dome, flowers on it near the road), 3 the
  //      desert's grey scrub (a few low twiggy lumps); far from the road (k >= 4) plainer ----
  function luTreeGeo(kind, far) {
    const g = new GB(), R = rng(9311 + kind * 7 + (far ? 1 : 0)), rs = API.ROCK_SMOOTH; API.ROCK_SMOOTH = true;
    if (kind === 0) {
      const seg = far ? 2 : 4, top = 0.76, bark = [0.55, 0.47, 0.37], barkD = [0.45, 0.38, 0.3];
      for (let s = 0; s < seg; s++) { const y0 = top * s / seg, y1 = top * (s + 1) / seg; cyl(g, 0, y0 - 0.02, 0, 0.034 - 0.006 * s / seg, y1 - y0 + 0.02, far ? 3 : 5, s % 2 ? bark : barkD, null, 0.034 - 0.006 * (s + 1) / seg); }
      const n = far ? 6 : 12;
      for (let k = 0; k < n; k++) {
        const a = (k + R() * 0.45) / n * TAU, up = k % 3 === 0, ca = Math.cos(a), sa = Math.sin(a), L = (up ? 0.3 : 0.4) * (0.9 + R() * 0.16), w = 0.05 + R() * 0.012;
        const b = [ca * 0.02, top + 0.02, sa * 0.02], m = [ca * L * 0.5, top + (up ? 0.2 : 0.11), sa * L * 0.5], t = [ca * L, top + (up ? 0.27 : -0.08 - R() * 0.1), sa * L];
        const pl = [m[0] - sa * w, m[1] - 0.035, m[2] + ca * w], pr = [m[0] + sa * w, m[1] - 0.035, m[2] - ca * w];   // (the leaflets either side, lower: the frond folded along its rib)
        const cU = vary(up ? [0.33, 0.42, 0.24] : [0.27, 0.36, 0.19], R, 0.07), cD = [cU[0] * 1.12 + 0.03, cU[1] * 1.08 + 0.02, cU[2] * 1.05];   // (the dusty blue-green of the date palm)
        const below = [m[0], m[1] - 1, m[2]], above = [m[0], m[1] + 1, m[2]], tris = far ? [[b, pl, t], [b, t, pr]] : [[b, pl, m], [b, m, pr], [pl, t, pr]];
        for (const [p, q, r] of tris) { g.triO(p, q, r, cU, below); g.triO(p, q, r, cD, above); }
      }
      if (!far) ico(g, 0, top - 0.01, 0, 0.05, 0.6, [0.4, 0.33, 0.22], R, 0.2);   // (the crown's heart, the old leaf bases)
    } else if (kind === 1) {
      cyl(g, 0, -0.02, 0, 0.05, 0.4, far ? 3 : 5, [0.42, 0.36, 0.29], null, 0.04);
      ico(g, 0, 0.62, 0, 0.46, 0.42, [0.37, 0.42, 0.24], R, far ? 0.14 : 0.24);
      if (!far) { nrLump(g, 0.26, 0.64, 0.12, 0.26, 0.5, [0.4, 0.45, 0.26], R, 0.2); nrLump(g, -0.22, 0.66, -0.16, 0.24, 0.5, [0.34, 0.39, 0.22], R, 0.2); }
    } else if (kind === 2) {
      ico(g, 0, 0.42, 0, 0.5, 0.82, [0.2, 0.34, 0.15], R, 0.26);
      if (!far) { nrLump(g, 0.22, 0.62, 0.14, 0.24, 0.7, [0.76, 0.18, 0.46], R, 0.3); nrLump(g, -0.18, 0.56, -0.2, 0.2, 0.7, [0.86, 0.36, 0.56], R, 0.3); }   // (bougainvillea and oleander in flower)
    } else {
      const C = [[0.5, 0.5, 0.38], [0.44, 0.45, 0.33], [0.55, 0.53, 0.41]];
      for (let k = 0; k < (far ? 1 : 3); k++) { const a = k * 2.1 + R(), r = k ? 0.22 : 0; ico(g, Math.cos(a) * r, 0.3, Math.sin(a) * r, 0.42 - k * 0.07, 0.62, C[k], R, 0.4); }
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // on the land cover (0 the desert's gravel plain, 1 the lawns and the gardens, 2 the sand, 3 the car parks and the town): the grey scrub
  // here and there on the desert and the sand, a lone shade tree; palms, shrubs and shade trees on the lawns and the gardens; palms and
  // shrubs by the car parks and the buildings
  const LU_WOODS = {
    // (species 0 a date palm, 1 a shade tree, 2 a garden shrub, 4 the desert's scrub; 3 left out: the shared builder keeps it for Rio's trees
    // in bloom, its own chunks; its chunk here stays empty, so it costs no draw)
    n: 5, geo: (k) => luTreeGeo([0, 1, 2, 2, 3][k % 5], k >= 5), cr: [0.3, 0.44, 0.42, 0.42, 0.4], p: [0.006, 0.14, 0.004, 0.012],
    pick(cl, R, far, x, z) {
      const r = R(), r2 = R(), r3 = R(); let sp;
      if (cl === 1) sp = r < 0.42 ? 0 : r < 0.78 ? 2 : 1;
      else if (cl === 3) sp = r < 0.5 ? 0 : 2;
      else sp = r < 0.93 ? 4 : 1;
      if (sp === 0) { const h = (6.5 + r2 * 5) * (far ? 1.04 : 1); return [0, h, h * (0.62 + r3 * 0.14)]; }
      if (sp === 1) { const h = (4.5 + r2 * 3) * (far ? 1.06 : 1); return [1, h, h * (1.25 + r3 * 0.3)]; }
      if (sp === 2) { const h = 1.1 + r2 * 1.3; return [2, h, h * (1.3 + r3 * 0.4)]; }
      const h = 0.5 + r2 * 0.8; return [4, h, h * (1.7 + r3 * 0.6)];
    },
  };

  // the ground's shader (LK.ground; in place of World's grassLook, which leaves a material it finds marked): where the vertex colours are
  // green (the watered lawns) the grass picture with lighter and darker patches, its loud green toned down; elsewhere the desert: the grass
  // picture's blades and flowers taken out (a little of its light and dark kept: grain), patches tens of metres across, and near the camera
  // a fine mottle and pebbles, darker and paler (world-space noise: no texture, no extra draw)
  const LU_GLSL = [
    'varying vec2 vLuW; varying float vLuD; uniform vec3 uLuAvg;',
    'float luHash(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }',   // (no sine: steady on phones' GPUs)
    'float luNoise(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f); return mix(mix(luHash(i), luHash(i + vec2(1.0, 0.0)), u.x), mix(luHash(i + vec2(0.0, 1.0)), luHash(i + vec2(1.0, 1.0)), u.x), u.y); }'].join('\n');
  function luGround(m) {
    const avg = (m.map && m.map.avgCol) || [0.35, 0.49, 0.22];
    m.userData.grassLook = true;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uLuAvg = { value: new THREE.Vector3(avg[0], avg[1], avg[2]) };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vLuW; varying float vLuD;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvLuW = (modelMatrix * vec4(transformed, 1.0)).xz; vLuD = -mvPosition.z;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + LU_GLSL).replace('#include <color_fragment>', `#include <color_fragment>
        {
          vec3 base = vColor * uLuAvg;   // (the colour the vertex colours mean: over the grass picture's average)
          float gg = clamp((base.g - max(base.r, base.b)) * 8.0, 0.0, 1.0), near = 1.0 - smoothstep(35.0, 110.0, vLuD);
          float n1 = luNoise(vLuW * 0.021) * 0.6 + luNoise(vLuW * 0.067 + 7.1) * 0.4, n2 = luNoise(vLuW * 0.5 + 2.3) * 0.55 + luNoise(vLuW * 1.7 + 5.9) * 0.45, n3 = luNoise(vLuW * 2.9 + 1.3);
          vec3 gc = diffuseColor.rgb;
          gc *= mix(1.0, 0.87 + 0.26 * n1, gg);
          float L = dot(gc, vec3(0.3, 0.59, 0.11)); gc = mix(gc, mix(vec3(L), gc, 0.78) * vec3(1.02, 0.98, 0.9), gg * 0.5);
          float tl = dot(texelColor.rgb, vec3(0.3, 0.59, 0.11)) / dot(uLuAvg, vec3(0.3, 0.59, 0.11));
          float peb = smoothstep(0.74, 0.92, n3) * -0.13 + smoothstep(0.26, 0.08, n3) * 0.07;   // (pebbles: darker flint, paler limestone)
          vec3 sc = diffuse * base * (0.92 + 0.16 * n1) * (1.0 + ((n2 - 0.5) * 0.12 + peb) * near) * mix(1.0, tl, 0.12);
          diffuseColor.rgb = mix(sc, gc, gg);
        }`);
    };
    m.customProgramCacheKey = () => 'luGround';
    m.needsUpdate = true;
  }

  // the service roads round the circuit (def.sk.svc: OSM's highway=service and =unclassified): plain asphalt 5 m wide on the ground, two
  // points across at every bend of the way and every 8 m between (the flat desert needs no more), 8 cm over it and drawn over it; not inside
  // the barriers nor within 4 m past them (the run-offs are the builder's), the trees and the people off them
  function luRoads({ root, tex, exclPush, CR }, st) {
    const S = (API.T.def.sk || {}).svc || [], rb = new RB(true), col = [0.86, 0.85, 0.85], HW = 2.5;
    for (let k = 0; k < S.length;) {
      const n = S[k], p = []; for (let q = 0; q < n; q++) p.push([S[k + 1 + q * 2], S[k + 2 + q * 2]]); k += 1 + n * 2;
      const pts = []; for (let q = 0; q + 1 < n; q++) { const [ax, az] = p[q], [bx, bz] = p[q + 1], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 8)); for (let t = 0; t < m; t++) pts.push([lerp(ax, bx, t / m), lerp(az, bz, t / m)]); }
      pts.push(p[n - 1]);
      let prev = -1, along = 0;
      for (let q = 0; q < pts.length; q++) {
        const [x, z] = pts[q], a = pts[Math.max(0, q - 1)], b = pts[Math.min(pts.length - 1, q + 1)], dx = b[0] - a[0], dz = b[1] - a[1], dl = Math.hypot(dx, dz) || 1;
        if (q) along += Math.hypot(x - pts[q - 1][0], z - pts[q - 1][1]);
        const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 4 + HW) { prev = -1; continue; }
        const nx = -dz / dl, nz = dx / dl, row = [-HW, HW].map(o => { const px = x + nx * o, pz = z + nz * o; return [px, nrGround(px, pz) + 0.08, pz]; });   // (left to right in the way's direction: (nx, nz) its right)
        const r = rb.row(row, [col, col], row.map((e, j) => [j * HW / 2, along / 4]));
        if (prev >= 0) rb.link(prev, r, 0, 1); prev = r;
        exclPush(x, z, HW + 1.5); if (nn.i >= 0 && nn.dd < 70) CR.avoid(x, z, HW + 0.5);
        if (q) st.road += Math.hypot(x - pts[q - 1][0], z - pts[q - 1][1]);
      }
    }
    if (rb.empty) return;
    const m = new THREE.Mesh(rb.geometry(), new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
    m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'lusail service roads'; root.add(m);
  }

  // the palms and the other lone trees (def.sk.tr: [x, z, ...]: OSM natural=tree and tree_row): date palms, every seventh a shade tree; not
  // where the builder put a stand, a building or a road (excluded), nor by the track; those within 70 m of the road in full and casting
  // shadows, the others plainer and without (as the builder's own trees out there); one instanced draw a kind (and its far kind)
  function luLoneTrees({ root, exclPush, excluded }, st) {
    const tr = (API.T.def.sk || {}).tr || [], R = rng(9319), mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const ch = [[0, false], [1, false], [0, true], [1, true]].map(([k, far]) => new IChunks(luTreeGeo(k, far), mat, far ? 512 : 384));   // (in chunks: those behind the camera not drawn)
    for (let k = 0; k + 1 < tr.length; k += 2) {
      const x = tr[k], z = tr[k + 1], kind = (k >> 1) % 7 === 3 ? 1 : 0, nn = nrNear(x, z), r1 = R(), r2 = R(), r3 = R();
      if ((nn.i >= 0 && nn.dd < 3) || excluded(x, z)) continue;
      const far = nn.i < 0 || nn.dd > 70, h = kind === 0 ? 7 + r1 * 5 : 5 + r1 * 3, w = h * (kind === 0 ? 0.6 + r2 * 0.14 : 1.25 + r2 * 0.3), cv = 0.9 + r3 * 0.2;
      ch[kind + (far ? 2 : 0)].add(x, nrGround(x, z) - 0.1, z, R() * TAU, w, h, [cv, cv, cv]); nrShade(x, z, w * (kind === 0 ? 0.3 : 0.44), 1); exclPush(x, z, w * 0.4); st.trees++;
    }
    ch.forEach((c, j) => c.addTo(root, j < 2));
  }

  // a band of windows on a wall (in the facade picture: bays of 3.3 m, floors of 3.2 m; they light up at dusk and at night: Render.litWindows),
  // 3 cm out from it: the wall's middle at (fx, fz), along it (ux, uz), hl to each side of the middle less a pillar at each end; from y0 to y1
  // high; (cx, cz) the building's middle, for which way the band faces
  function luBand(fac, fx, fz, ux, uz, hl, y0, y1, cx, cz, col) {
    if (hl < 3 || y1 - y0 < 2) return;
    const bays = Math.max(1, Math.round(hl * 2 / 3.3)), fl = Math.max(1, Math.round((y1 - y0) / 3.2));
    fac.quadO([fx - ux * hl, y0, fz - uz * hl], [fx + ux * hl, y0, fz + uz * hl], [fx + ux * hl, y1, fz + uz * hl], [fx - ux * hl, y1, fz - uz * hl], col, [cx, (y0 + y1) / 2, cz], [[0, 0], [bays, 0], [bays, fl], [0, fl]]);
  }

  // the paddock building behind the garages (def.sk.pitb: [x, z, length, width, angle (deg), height]): a long white block, its glass front
  // to the straight (luBand), a pale roof
  function luPaddock({ scen, exclPush, CR }, st, fac) {
    const B = (API.T.def.sk || {}).pitb; if (!B) return;
    const [x, z, L, W, deg, h] = B, rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot), nx = -s, nz = c;   // (nx, nz: its back, away from the straight: the straight's right)
    let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2));
    box(scen.get(x, z), x, y - 0.4, z, L, h + 0.4, W, rot, [0.93, 0.92, 0.89], [0.8, 0.8, 0.79], true);
    luBand(fac, x - nx * (W / 2 + 0.03), z - nz * (W / 2 + 0.03), c, s, L / 2 - 3, y + 3.4, y + h - 0.9, x, z, [0.86, 0.9, 0.96]);
    for (let t = -L / 2; t <= L / 2; t += 20) { exclPush(x + c * t, z + s * t, W / 2 + 4); CR.avoid(x + c * t, z + s * t, W / 2 + 2); }
    st.buildings++;
  }

  // the horizon (def.far, Riverside's rsFar): the flat desert in its pale haze, the new town's towers by the sea to the east greyer and bluer
  const luFarCol = (h, d) => {
    const c = h < 22 ? [0.72, 0.64, 0.5] : h < 50 ? [0.64, 0.61, 0.56] : [0.56, 0.59, 0.64], f = (1 - Math.exp(-d / 9000)) * 0.9;
    return c.map((v, k) => lerp(v, [0.88, 0.84, 0.78][k], f));
  };

  // LK.extra: the service roads, the paddock building, the buildings by the circuit (OSM outlines as boxes: white, sand and stone-coloured
  // render, flat pale roofs; the taller ones with bands of windows on their long walls, the big ones all round), the palms and the lone
  // trees, the horizon; before the crowds and the builder's trees, which keep clear of them. The glass of all of them one draw
  function luExtra(o) {
    const { scen, exclPush, CR, root, out, tex } = o, sk = API.T.def.sk || {}, R = rng(9317), st = { road: 0, buildings: 0, trees: 0, far: 0 }, fac = new GB(true);
    luRoads(o, st);
    luPaddock(o, st, fac);
    const b6 = sk.bld || [], WALL = [[0.94, 0.93, 0.9], [0.88, 0.82, 0.7], [0.8, 0.76, 0.66]], ROOF = [[0.8, 0.79, 0.76], [0.62, 0.63, 0.64]], GLASS = [[0.8, 0.86, 0.94], [0.72, 0.76, 0.8]];
    for (let k = 0; k < b6.length; k += 6) {
      const [x, z, L, W, deg, h] = b6.slice(k, k + 6), rot = deg * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot), gl = GLASS[Math.floor(R() * 2)];
      let y = 1e9; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) y = Math.min(y, nrGround(x + (a * L * c - b * W * s) / 2, z + (a * L * s + b * W * c) / 2));
      box(scen.get(x, z), x, y - 0.4, z, L, h + 0.4, W, rot, WALL[Math.floor(R() * 3)], ROOF[Math.floor(R() * 2)], true);
      if (h >= 5) for (const sg of [-1, 1]) {   // (the long walls; the ends too where they are long enough for windows)
        luBand(fac, x - s * sg * (W / 2 + 0.03), z + c * sg * (W / 2 + 0.03), c, s, L / 2 - 2.5, y + 0.9, y + h - 1, x, z, gl);
        if (W >= 14) luBand(fac, x + c * sg * (L / 2 + 0.03), z + s * sg * (L / 2 + 0.03), -s, c, W / 2 - 2.5, y + 0.9, y + h - 1, x, z, gl);
      }
      exclPush(x, z, Math.hypot(L, W) / 2 + 2); CR.avoid(x, z, Math.hypot(L, W) / 2 + 1); st.buildings++;
    }
    if (!fac.empty) { const m = new THREE.Mesh(fac.geometry(), new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true })); m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'lusail glass fronts'; root.add(m); }
    luLoneTrees(o, st);
    if (API.T.def.far && API.rsFar) { out.dyn.far = API.rsFar(root, API.T.def.far, 'summer', 6, luFarCol); st.far = 1; }   // (World.update: no car, back where it was built)
    return st;
  }

  API.rbLook = Object.assign(API.rbLook || {}, {   // its look on the shared builder (RB_LOOK in js/world-rbring.js takes it)
    lusail: { ban: LU_BAN, at: LU_AT, nums: 16, numC: ['#8a1538', '#fff', '#fff'], shirts: LU_SHIRTS, smoke: false, camps: 0, farms: 0, seC: [1.6, 1.2, 2.3], gravel: false, noVid: true,
      pitBox: [-290, 100, 1], mow: 0.25,   // (the pit building on the right of the main straight; the green verges by the track artificial, no mowing stripes to speak of; no farms in the desert)
      woods: LU_WOODS, extra: luExtra, ground: luGround, lane: true, fl: { qa: QA }, ck: 2,   // (ck: chunks twice as big: fewer draws where much of the circuit is in view)
      flags: { stand: [{ qa: 0.8, tm: 0.2 }, { qa: 0.7, tm: 0.2, rb: 0.1 }], ga: { qa: 0.75, tm: 0.25 }, camp: { qa: 0.85, tm: 0.15 }, pole: 'qa', podium: 'qa' },
      vid: [], poles: [-280, 115, -1], runoff: ['LUSAIL', 'QATAR', 'DOHA'], straight: [-560, -320, -1],
      farm: { wall: [0.93, 0.9, 0.82], roof: [0.8, 0.79, 0.76], end: [0.9, 0.86, 0.78], barn: [0.7, 0.62, 0.5], barnRoof: [0.62, 0.63, 0.64], barnEnd: [0.66, 0.58, 0.46] },
      tvSkip: [2, 4, 7, 12], recov: [0, 5, 9], photo: [0, 5, 9, 15], jets: [[0.54, 0.08, 0.22], [0.96, 0.96, 0.95], [0.54, 0.08, 0.22]],   // (TV towers at the big corners, not at the kinks nor at the second parts of the double corners)
      colMod: (P) => (x, z, c, dd) => {   // the coastal desert: a pale grey-beige gravel plain in broad patches, the drifts of sand warmer and lighter, the car parks and the town grey; the watered lawns a fresh, even green
        const n = P.n5(x * 0.4 + 300, z * 0.4), m = P.n3(x * 1.3 + 90, z * 1.3), v = 0.93 + 0.1 * m, k = 0.96 + (n - 0.5) * 0.12;
        const lw = nrLCf(x, z, 1), sa = nrLCf(x, z, 2), pv = nrLCf(x, z, 3);
        let r = 2.06, g = 1.39, b = 2.5;   // (the gravel plain, over the grass picture's average: World.nrCol's colours multiply it)
        r = lerp(r, 2.42, sa); g = lerp(g, 1.56, sa); b = lerp(b, 2.62, sa);
        r = lerp(r, 1.74, pv); g = lerp(g, 1.23, pv); b = lerp(b, 2.64, pv);
        r *= k * v; g *= k * v; b *= k * v;
        if (lw > 0) { const t = Math.min(1, lw * 1.1); r = lerp(r, 0.95 * v, t); g = lerp(g, 1.08 * v, t); b = lerp(b, 0.82 * v, t); }
        c[0] = r; c[1] = g; c[2] = b;
      } },
  });
  World.keep('NR', 'lusail');   // (its grids kept between its builds; World.build frees the others')
  World.ext.lusail = (scene, tex, opts) => World.ext.rbring(scene, tex, opts);   // (the shared builder: js/world-rbring.js)
})();
