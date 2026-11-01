/* =========================================================================
   WORLD — Katu-Jaryk (theme 'katu'): its own builder (World.ext.katu), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (LOD, T)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, GRASS_GLSL, IChunks, NR_A64, TAU, addShore, atSf, box, clamp, cone, crH, crowdCtx, crowdFinish, crowdPut, crowdRun, cyl, gable,
    hex, ico, inPoly, lerp, mergeBands, nrChamfer, ouCutMat, ouRoadTex, pkGroundMat, polyDist, propFloorTable, rng, roadsideProps, rock,
    shoreBand, sstep, starCone, stubExcl, stubGeo, stubProps, stubRails, stubVerge, tuftGeo, tuftWindMat, valueNoise2, vary, vrGritTex, vrStubH,
    vrStubs, waterMat, waterline
  } = API;
  let LOD, T;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T } = API); });

  /* ================= KATU-JARYK (theme 'katu') =================
     The descent of the Katu-Yaryk pass (the Altai Republic, Russia) on a clear summer morning: from the larch woods at the edge of the Ulagan plateau
     (~1240 m), past the car park, the kiosks and the viewpoints over the canyon, down the seven hairpins and the steep traverse above the Chulyshman to
     the camps on the valley floor (~680 m). As on the other open roads only a corridor round the road is built: a 5 m height grid in 100 m tiles; near
     the road the road's own height (blended from the nearby samples), farther out the real terrain (def.dem: Copernicus GLO-30 on a 32 m grid) with a
     little noise and the river's bed dug into it (def.river: the Chulyshman's banks, its water falling gently downstream). The land cover (def.lc: ESA
     WorldCover with OpenStreetMap on top) colours the ground and decides where the larch and stone-pine woods, the shrubs, the camps and the bare rock
     are; the OpenStreetMap buildings (def.bld: the kiosks at the top, the yurts and log cabins of the camps below) stand on it, crags line the cliffs
     (def.cliffs). The road is unpaved: crushed brown schist with two wheel tracks; white concrete parapets with black stripes where the ground falls
     away and round the outside of the hairpins, the white signal posts elsewhere, the triangle signs of the steep descent and the dangerous bends;
     at the top the pass sign, a larch hung with the white and blue ribbons the Altai people tie at a pass, a cairn. Hot loops in small functions. */
  const KTC = 5, KTT = 20, KTHC = 32;          // terrain cell (m), tile size (cells), road-sample hash cell (m)
  let KT = null;                               // per-build data: sample hash, the terrain, the land cover, the distance to the road, the river, pads, terrain height grid
  const KTN = { i: -1, d: 1e9, dd: 1e9, lat: 0, h: 0, hn: 0, cap: 1e9 };   // ktNear: nearest sample, its distance and lateral offset, distance beyond the barrier, blended and exact road height, the highest the ground may be there
  const KTCOL = [0, 0, 0];                     // (ktCol's colour)
  function ktPrep() {
    const def = T.def, N = T.N, M = 460; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < N; i++) { x0 = Math.min(x0, T.px[i]); x1 = Math.max(x1, T.px[i]); z0 = Math.min(z0, T.pz[i]); z1 = Math.max(z1, T.pz[i]); }
    const P = KT = { bx0: x0, bx1: x1, bz0: z0, bz1: z1, pads: [] };
    x0 -= M; x1 += M; z0 -= M; z1 += M; P.x0 = x0; P.z0 = z0;
    // every 2nd road sample (and the last one) in a hash grid
    P.cx0 = Math.floor(x0 / KTHC); P.cz0 = Math.floor(z0 / KTHC); P.ncx = Math.floor(x1 / KTHC) - P.cx0 + 1; P.ncz = Math.floor(z1 / KTHC) - P.cz0 + 1; P.cells = new Array(P.ncx * P.ncz);
    const add = (i) => { const k = (Math.floor(T.pz[i] / KTHC) - P.cz0) * P.ncx + Math.floor(T.px[i] / KTHC) - P.cx0; (P.cells[k] || (P.cells[k] = [])).push(i); };
    for (let i = 0; i < N; i += 2) add(i); if ((N - 1) % 2) add(N - 1);
    // the samples with another leg of the road within 140 m (more than KTLA along it): the hairpin ladder (only there ktGap looks for that other leg)
    P.lad = new Uint8Array(N);
    for (let i = 0; i < N; i++) { const cx = Math.floor(T.px[i] / KTHC) - P.cx0, cz = Math.floor(T.pz[i] / KTHC) - P.cz0;
      scan: for (let b = Math.max(0, cz - 5); b <= Math.min(P.ncz - 1, cz + 5); b++) for (let a = Math.max(0, cx - 5); a <= Math.min(P.ncx - 1, cx + 5); a++) { const L = P.cells[b * P.ncx + a]; if (!L) continue;
        for (let q = 0; q < L.length; q++) { const j = L[q]; if (Math.abs(j - i) * T.ds >= KTLA && Math.hypot(T.px[j] - T.px[i], T.pz[j] - T.pz[i]) < 140) { P.lad[i] = 1; break scan; } } } }
    // the terrain (def.dem, coded as Vršič's: see vrPrep), heights above the start line
    const D = def.dem, TR = D.tr, tb = atob(TR.b64), tr = new Float32Array(TR.nx * TR.nz);
    for (let k = 0; k < tr.length; k++) tr[k] = TR.lo + (tb.charCodeAt(2 * k) * 256 + tb.charCodeAt(2 * k + 1)) * TR.step;
    const rb = atob(D.res), dem = new Float32Array(D.nx * D.nz); let q = 0;
    for (let j = 0; j < D.nz; j++) { const a = D.rows[j][0], n = D.rows[j][1], fj = j / TR.f, tj = Math.min(TR.nz - 2, Math.floor(fj)), v = fj - tj;
      for (let i = 0; i < D.nx; i++) { const fi = i / TR.f, ti = Math.min(TR.nx - 2, Math.floor(fi)), u = fi - ti, k0 = tj * TR.nx + ti;
        let h = (tr[k0] * (1 - u) + tr[k0 + 1] * u) * (1 - v) + (tr[k0 + TR.nx] * (1 - u) + tr[k0 + TR.nx + 1] * u) * v;
        if (i >= a && i < a + n) h += rb.charCodeAt(q++) - 128;
        dem[j * D.nx + i] = h - D.base; } }
    P.dem = dem; P.D = D;
    // land cover (def.lc, run-length coded as Vršič's): 0 steppe and meadow, 1 larch and stone-pine forest, 2 shrubs, 3 camps, 4 rock, scree and cliffs, 5 water
    const L = def.lc, lc = new Uint8Array(L.nx * L.nz), dg = new Int8Array(128); for (let k = 0; k < 64; k++) dg[NR_A64.charCodeAt(k)] = k;
    for (let p = 0, k = 0; k < lc.length;) { const s = dg[L.rle.charCodeAt(p++)]; let n = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = dg[L.rle.charCodeAt(p++)]; n += e; } while (e === 63 && p < L.rle.length); } lc.fill(s >> 3, k, Math.min(lc.length, k + n)); k += n; }
    P.lc = lc; P.L = L;
    // distance to the road centre line on a 16 m grid (chamfer transform seeded with the road samples)
    const dc = 16, dnx = Math.ceil((x1 - x0) / dc) + 1, dnz = Math.ceil((z1 - z0) / dc) + 1, dist = new Float32Array(dnx * dnz).fill(1e9);
    for (let i = 0; i < N; i++) { const a = Math.round((T.px[i] - x0) / dc), b = Math.round((T.pz[i] - z0) / dc); dist[b * dnx + a] = 0; }
    nrChamfer(dist, dnx, dnz, dc);
    Object.assign(P, { dc, dnx, dnz, dist });
    P.n1 = valueNoise2(711, 90); P.n2 = valueNoise2(712, 30); P.n3 = valueNoise2(713, 55); P.n4 = valueNoise2(714, 14); P.n5 = valueNoise2(715, 70); P.n6 = valueNoise2(716, 7); P.n7 = valueNoise2(717, 38);
    // the river (def.river: its banks, and its level a + b * (u . (x, z)) above the start line, falling downstream): the signed distance to the banks
    // on an 8 m grid, filled lazily (NaN: not yet), only round the banks
    const RV = def.river || { polys: [] };
    P.riv = RV.polys.map((a) => { const poly = []; let lx0 = 1e9, lx1 = -1e9, lz0 = 1e9, lz1 = -1e9;
      for (let k = 0; k + 1 < a.length; k += 2) { poly.push([a[k], a[k + 1]]); lx0 = Math.min(lx0, a[k]); lx1 = Math.max(lx1, a[k]); lz0 = Math.min(lz0, a[k + 1]); lz1 = Math.max(lz1, a[k + 1]); }
      return { poly, x0: lx0, x1: lx1, z0: lz0, z1: lz1 }; }).filter(r => r.x1 > x0 && r.x0 < x1 && r.z1 > z0 && r.z0 < z1);
    P.rA = RV.a || 0; P.rB = RV.b || 0; P.rU = RV.u || [1, 0];
    const RC = 8; P.rw = { c: RC, nx: Math.ceil((x1 - x0) / RC) + 2, nz: Math.ceil((z1 - z0) / RC) + 2 }; P.rw.e = new Float32Array(P.rw.nx * P.rw.nz).fill(NaN);
    // terrain height grid (filled lazily, NaN = not computed yet) and the distance beyond the nearest barrier at each vertex
    const G = P.G = { x0, z0 }; G.ntx = Math.ceil((x1 - x0) / (KTC * KTT)); G.ntz = Math.ceil((z1 - z0) / (KTC * KTT)); G.nx = G.ntx * KTT + 1; G.nz = G.ntz * KTT + 1;
    G.h = new Float32Array(G.nx * G.nz).fill(NaN); G.dd = new Float32Array(G.nx * G.nz); G.sm = new Uint8Array(G.nx * G.nz); G.on = new Uint8Array(G.ntx * G.ntz);   // (G.sm: the vertex lies under a strip along the road: pushed down, 2: deeper)
  }
  function ktDist(x, z) {   // distance to the road centre line (bilinear on the chamfer grid)
    const P = KT, gx = clamp((x - P.x0) / P.dc, 0, P.dnx - 1.001), gz = clamp((z - P.z0) / P.dc, 0, P.dnz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, W = P.dnx, a = P.dist;
    return (a[j * W + i] * (1 - u) + a[j * W + i + 1] * u) * (1 - v) + (a[(j + 1) * W + i] * (1 - u) + a[(j + 1) * W + i + 1] * u) * v;
  }
  function ktLC(x, z) {   // land cover class at (x, z)
    const L = KT.L, i = Math.floor((x - L.x0) / L.cell), j = Math.floor((z - L.z0) / L.cell);
    return i < 0 || j < 0 || i >= L.nx || j >= L.nz ? 2 : KT.lc[j * L.nx + i];
  }
  function ktLCf(x, z, c) {   // share of land cover class c around (x, z), bilinear over the cell centres (soft edges for the ground colours)
    const L = KT.L, lc = KT.lc, fx = (x - L.x0) / L.cell - 0.5, fz = (z - L.z0) / L.cell - 0.5, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
    const at = (a, b) => (a < 0 || b < 0 || a >= L.nx || b >= L.nz ? 0 : lc[b * L.nx + a] === c ? 1 : 0);
    return (at(i, j) * (1 - u) + at(i + 1, j) * u) * (1 - v) + (at(i, j + 1) * (1 - u) + at(i + 1, j + 1) * u) * v;
  }
  function ktDem(x, z) {   // the real terrain (bilinear on the 32 m grid)
    const P = KT, D = P.D, gx = clamp((x - D.x0) / D.cell, 0, D.nx - 1.001), gz = clamp((z - D.z0) / D.cell, 0, D.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, W = D.nx, a = P.dem;
    return (a[j * W + i] * (1 - u) + a[j * W + i + 1] * u) * (1 - v) + (a[(j + 1) * W + i] * (1 - u) + a[(j + 1) * W + i + 1] * u) * v;
  }
  function ktNear(x, z) {   // Shepard blend of the road heights around (x, z): weights fall with the distance beyond each sample's barrier, so the legs of a hairpin blend smoothly
    // and the cap there: never above a road inside its barriers, only a gentle rise right behind them (the lowest over the samples near: continuous)
    const P = KT, cx = Math.floor(x / KTHC) - P.cx0, cz = Math.floor(z / KTHC) - P.cz0, ds = T.ds;
    let ws = 0, hs = 0, bd = 1e9, bi = -1, bl = 0, ba = 0, bdd = 1e9, cap = 1e9;
    for (let b = Math.max(0, cz - 2); b <= Math.min(P.ncz - 1, cz + 2); b++) for (let a = Math.max(0, cx - 2); a <= Math.min(P.ncx - 1, cx + 2); a++) {
      const L = P.cells[b * P.ncx + a]; if (!L) continue;
      for (let q = 0; q < L.length; q++) {
        const i = L[q], dx = x - T.px[i], dz = z - T.pz[i], al = dx * T.tx[i] + dz * T.tz[i], lat = dx * T.nx[i] + dz * T.nz[i], ex = Math.max(0, Math.abs(al) - ds), d = Math.sqrt(lat * lat + ex * ex);
        if (d >= 64) continue;
        const dd = Math.max(0, d - (lat > 0 ? T.br[i] : T.bl[i])), k = 1 / (dd + 1.5), wq = k * k * k * k * (d < 48 ? 1 : sstep(64, 48, d));
        ws += wq; hs += wq * T.hy[i];
        if (dd < 4.5) cap = Math.min(cap, T.hy[i] - 0.3 + 0.12 * dd * dd + 200 * sstep(3, 4.5, dd));
        if (d < bd) { bd = d; bi = i; bl = lat; ba = al; }
        if (dd < bdd) bdd = dd;
      }
    }
    KTN.i = bi; KTN.d = bd; KTN.dd = bdd; KTN.lat = bl; KTN.cap = cap;
    if (bi < 0) return KTN;
    KTN.h = hs / ws;
    const f = clamp(bi + ba / ds, 0, T.N - 1), i0 = Math.min(T.N - 2, Math.floor(f)); KTN.hn = T.hy[i0] + (T.hy[i0 + 1] - T.hy[i0]) * (f - i0);   // road height across from the point
    return KTN;
  }
  function ktGap(i, side) {   // the hairpin ladder: from this barrier line to another leg's across, on this side of sample i (more than KTLA along the road; 1e9: none within 130 m)
    const P = KT; if (!P.lad[i]) return 1e9;
    const ds = T.ds, bar = side > 0 ? T.br[i] : T.bl[i], x = T.px[i] + T.nx[i] * side * (bar + 2.2), z = T.pz[i] + T.nz[i] * side * (bar + 2.2), cx = Math.floor(x / KTHC) - P.cx0, cz = Math.floor(z / KTHC) - P.cz0;
    let bj = -1, bjd = 1e9, bjl = 0;
    for (let b = Math.max(0, cz - 5); b <= Math.min(P.ncz - 1, cz + 5); b++) for (let a = Math.max(0, cx - 5); a <= Math.min(P.ncx - 1, cx + 5); a++) {
      const L = P.cells[b * P.ncx + a]; if (!L) continue;
      for (let q = 0; q < L.length; q++) {
        const j = L[q]; if (Math.abs(j - i) * ds < KTLA || ((T.px[j] - T.px[i]) * T.nx[i] + (T.pz[j] - T.pz[i]) * T.nz[i]) * side <= 0) continue;   // (on this side)
        const dx = x - T.px[j], dz = z - T.pz[j], al = dx * T.tx[j] + dz * T.tz[j], lat = dx * T.nx[j] + dz * T.nz[j];
        if (Math.abs(al) > Math.max(2 * ds, 0.6 * Math.abs(lat))) continue;   // (across from the point: not the same leg farther along it)
        const d = Math.hypot(lat, Math.max(0, Math.abs(al) - ds)); if (d < bjd) { bjd = d; bj = j; bjl = lat; }
      }
    }
    KTGAP.h = bj >= 0 ? T.hy[bj] : 0;   // (that leg's road height)
    return bj < 0 || bjd > 130 ? 1e9 : 2.2 + Math.max(0, bjd - (bjl > 0 ? T.br[bj] : T.bl[bj]));
  }
  const KTGAP = { h: 0 };
  // the new look on Katu-Jaryk's own materials: the crowns sway in the wind (instanced unit trees, height 1: the higher up the more, each tree in its own
  // rhythm; as main's swayMat), and the grass of the terrain gets its patches, lighter, darker and drier, tens of metres across (as main's grassLook, where
  // the vertex colour is grass: yellow to green, not the rock, the scree or the snow)
  function ktSway(m, W) {
    const base = m.onBeforeCompile, key = m.customProgramCacheKey ? m.customProgramCacheKey() : '';
    m.onBeforeCompile = (sh, r) => { if (base) base(sh, r); sh.uniforms.uWind = W;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
        '#ifdef USE_INSTANCING\nfloat wPh = instanceMatrix[3].x * 0.071 + instanceMatrix[3].z * 0.053;\n#else\nfloat wPh = 0.0;\n#endif\n' +
        'float wK = position.y * position.y * 0.035;\ntransformed.x += wK * sin(uWind * 1.15 + wPh);\ntransformed.z += wK * 0.65 * sin(uWind * 0.87 + wPh * 1.6);'); };
    m.customProgramCacheKey = () => key + 'ktSway';
    return m;
  }
  function ktFoamMat(tex) {   // the rapids' white water: foam streaks drifting downstream (the water texture's scrolling offset as the clock, as Pikes Peak's creek), the patch's
    // mask in its vertex colour (opaque in the middle, fading to the edges); uv: across 0..1, along in metres
    const m = new THREE.MeshLambertMaterial({ map: tex.water, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec4 vFo;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
        'float ktT = uvTransform[ 2 ].x;\nvFo = vec4( uv.x * 0.45 + 0.1 * sin( uv.y * 0.7 ), uv.y / 3.2 - ktT * 50.0, uv.x * 0.7 + 0.3, uv.y / 1.9 - ktT * 95.0 );');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec4 vFo;').replace('#include <map_fragment>', 'vec4 fA = texture2D( map, vFo.xy ), fB = texture2D( map, vFo.zw );')
        .replace('#include <color_fragment>', 'float fo = max( smoothstep( 0.26, 0.4, fA.r ), smoothstep( 0.26, 0.4, fB.r ) );\ndiffuseColor.rgb = vec3( 0.94, 0.96, 0.96 );\ndiffuseColor.a = vColor.r * clamp( 0.25 + 0.8 * fo, 0.0, 1.0 );');
    };
    m.customProgramCacheKey = () => 'ktFoam';
    return m;
  }
  function ktGrassLook(m) {
    const base = m.onBeforeCompile, key = m.customProgramCacheKey ? m.customProgramCacheKey() : '';
    m.onBeforeCompile = (sh, r) => { if (base) base(sh, r); sh.uniforms.uStr = { value: 0 }; sh.uniforms.uSd = { value: new THREE.Vector2(1, 0) };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vGw; varying float vGd;').replace('#include <project_vertex>', '#include <project_vertex>\nvGw = (modelMatrix * vec4(transformed, 1.0)).xz; vGd = -mvPosition.z;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + GRASS_GLSL).replace('#include <color_fragment>', '#include <color_fragment>\n' + [
        '{ float gg = clamp((min(vColor.r, vColor.g) - vColor.b - 0.08) * 6.0, 0.0, 1.0);',   // (grass: yellow to green)
        '  if (gg > 0.0) { vec3 gc = diffuseColor.rgb; float n1 = gNoise(vGw * 0.025) * 0.65 + gNoise(vGw * 0.07 + 13.1) * 0.35, n2 = gNoise(vGw * 0.045 + 57.3);',
        '    gc *= mix(1.0, 0.84 + 0.3 * n1, gg); gc = mix(gc, gc * vec3(1.12, 1.04, 0.7), gg * smoothstep(0.62, 0.95, n2) * 0.6); diffuseColor.rgb = gc; } }'].join('\n')); };
    m.customProgramCacheKey = () => key + 'ktGrass';
    return m;
  }
  function ktVergeEnd(i, side) {   // the height of the verge's outer edge above the road (1.9 m past the barrier): the ground there, but never far off the road's own level
    const o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 1.9); return clamp(ktHx(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) - T.hy[i], -1.6, 1.2); }
  const ktLevel = (x, z) => KT.rA + KT.rB * (KT.rU[0] * x + KT.rU[1] * z);   // the river's water level at (x, z)
  function ktRiv(x, z) {   // how far inside the river's banks (x, z) lies: + in the water, - on land (-60: none near), bilinear on the 8 m grid
    const P = KT, R = P.rw; if (!P.riv.length) return -60;
    const gx = clamp((x - P.x0) / R.c, 0, R.nx - 1.001), gz = clamp((z - P.z0) / R.c, 0, R.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
    const at = (a, b) => { const k = b * R.nx + a; let e = R.e[k]; if (e !== e) {
      const px = P.x0 + a * R.c, pz = P.z0 + b * R.c; e = -60;
      for (const r of P.riv) { if (px < r.x0 - 60 || px > r.x1 + 60 || pz < r.z0 - 60 || pz > r.z1 + 60) continue; const s = (inPoly(r.poly, px, pz) ? 1 : -1) * Math.min(60, polyDist(r.poly, px, pz)); if (s > e) e = s; }
      R.e[k] = e; } return e; };
    return (at(i, j) * (1 - u) + at(i + 1, j) * u) * (1 - v) + (at(i, j + 1) * (1 - u) + at(i + 1, j + 1) * u) * v;
  }
  function ktFar(x, z) {   // the land away from the road: the real terrain, a little made-up relief, the river's bed under its water and its banks above it
    const P = KT; let f = ktDem(x, z) + (P.n1(x, z) - 0.5) * 5 + (P.n2(x, z) - 0.5) * 2;
    const e = ktRiv(x, z);
    if (e > -14) { const lv = ktLevel(x, z);
      if (e > 0) f = Math.min(f, Math.max(lv - 2.4, lv + 0.7 - 0.32 * e));   // the bed: the waterline ~2 m inside the bank, ~2 m deep in the middle
      else f = Math.max(lv + 0.7 - 0.08 * e, lerp(lv + 0.7, f, sstep(0, -14, e)));   // the bank: never under the water, eased into the land
    }
    return f;
  }
  // the terrain beside the road (every cut and fill, the steep faces between the legs of the hairpin ladder: 45-75 deg, 10-55 m high) has creases
  // the 5 m grid could only follow in a row of teeth: along both sides of the road it is drawn as strips of its own instead (buildKatu: out to KTSW
  // past the verge's edge, on the ladder across the whole face to the other leg; exact: ktHx), the grid under them lower (G.sm: hidden; KTPD at the
  // edge of the strips, KTPI farther in: a 5 m cell from the flat verge up a steep face cuts the corner by more than KTPD), and things stand on them
  // as on the strips (ktGround)
  const KTPD = 3.5, KTPI = 15, KTLA = 24, KTSW = 10, KTMW = 120;   // (KTLA: how far along the road another leg of the ladder starts: past the hairpin's own bend;
  // KTMW: the widest face between two legs that the strips span, farther apart the grid between them)
  function ktStripW(i, side, g) {   // how far the strip on this side of sample i reaches past the verge's edge: between two legs of the ladder (g: between
    // their barrier lines, up to KTMW) across to the other's verge (its strip covers the same), else KTSW; less on the inside of a tight bend (its cross-sections would cross)
    let W = g - 3.5 <= KTMW ? Math.max(0.4, g - 3.5) : KTSW; const k = T.k[i];
    if (k * side > 0) W = Math.min(W, Math.max(0, 0.85 * (1 / Math.abs(k) - (side > 0 ? T.br[i] : T.bl[i]) - 1.9)));
    return W;
  }
  function ktStripD(Y, d) {   // the point of cross-section Y d metres past the verge's edge (Y[k][3] - 1.9), linearly between its points (at most its outer end)
    let j = 0; while (j < Y.length - 2 && Y[j + 1][3] - 1.9 < d) j++;
    const a = Y[j], b = Y[j + 1], f = clamp((d - (a[3] - 1.9)) / Math.max(1e-6, b[3] - a[3]), 0, 1);
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }
  function ktHx(x, z) {   // terrain height (exact: as the strips along the road draw it; the grid: ktGH)
    const n = ktNear(x, z), i = n.i, dd = n.dd; let h;
    if (i < 0) h = ktFar(x, z);
    else h = lerp(n.h - 0.3, ktFar(x, z), sstep(1, 42, dd));   // (the roads' heights near them, eased into the land farther out)
    const pads = KT.pads; for (let k = 0; k < pads.length; k++) { const p = pads[k], d = Math.hypot(x - p.x, z - p.z), pb = p.b || 12; if (d < p.r + pb) h = lerp(p.h, h, sstep(p.r, p.r + pb, d)); }   // level plots: the car parks, the kiosks, the camps
    if (i >= 0) h = Math.min(h, n.cap);   // never above a road inside its barriers, only a gentle rise right behind them
    if (API.STG) h = vrStubH(x, z, h, i >= 0 ? dd : 999);   // the side roads (the tracks and camp roads off it): the ground levelled under them
    KTN.dd = i >= 0 ? dd : 999;
    return h;
  }
  function ktGH(i, j) {   // terrain height at grid vertex (i, j), computed once
    const G = KT.G; i = clamp(i, 0, G.nx - 1); j = clamp(j, 0, G.nz - 1); const k = j * G.nx + i; let h = G.h[k];
    if (h !== h) { h = G.h[k] = ktHx(G.x0 + i * KTC, G.z0 + j * KTC) - (G.sm[k] === 2 ? KTPI : G.sm[k] ? KTPD : 0); G.dd[k] = KTN.dd; }
    return h;
  }
  function ktGround(x, z) {   // height of the terrain mesh surface (the same two triangles per cell as the tiles; in a cell under a strip along the road the strip's)
    const G = KT.G, gx = clamp((x - G.x0) / KTC, 0, G.nx - 1.001), gz = clamp((z - G.z0) / KTC, 0, G.nz - 1.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
    const a = ktGH(i, j), b = ktGH(i + 1, j), c = ktGH(i, j + 1), d = ktGH(i + 1, j + 1), k = j * G.nx + i;
    if (G.sm[k] || G.sm[k + 1] || G.sm[k + G.nx] || G.sm[k + G.nx + 1]) return ktHx(x, z);
    if (u + v <= 1) return a + u * (b - a) + v * (c - a);
    return d + (1 - u) * (c - d) + (1 - v) * (b - d);
  }
  function ktSlope(x, z) { const a = ktGround(x - 2.5, z), b = ktGround(x + 2.5, z), c = ktGround(x, z - 2.5), d = ktGround(x, z + 2.5); return Math.hypot(b - a, d - c) / 5; }
  function ktCol(x, z, h, ny, dd) {   // ground colour (times the grey grit map): the dry steppe grass of the sunny slopes, golden olive with greener patches (most of them
    // down on the valley floor), the darker olive of the shrub slopes, needles and moss under the larches, trampled grass in the camps, brown-grey
    // schist on the cliffs and every steep face, the river's pale gravel bars, a trodden verge
    const P = KT, m = P.n3(x, z), q = P.n4(x, z), A = h + P.D.base, low = sstep(820, 700, A);
    const fo = ktLCf(x, z, 1), sh = ktLCf(x, z, 2), cp = ktLCf(x, z, 3), rk = ktLCf(x, z, 4), wa = ktLCf(x, z, 5);
    let r = 0.7 + (m - 0.5) * 0.12 + (q - 0.5) * 0.08, g = 0.62 + (m - 0.5) * 0.1 + (q - 0.5) * 0.06, b = 0.37 + (m - 0.5) * 0.05;
    const gr = Math.max(sstep(0.48, 0.78, P.n2(x, z)) * 0.45, low * 0.75); r = lerp(r, 0.44, gr); g = lerp(g, 0.53, gr); b = lerp(b, 0.26, gr);
    r = lerp(r, 0.52 + m * 0.06, sh * 0.4); g = lerp(g, 0.51 + m * 0.05, sh * 0.4); b = lerp(b, 0.3, sh * 0.4);
    const ms = sstep(0.5, 0.78, P.n7(x * 1.7 + 90, z * 1.7)) * 0.6; r = lerp(r, lerp(0.42, 0.26, ms) + m * 0.06, fo); g = lerp(g, lerp(0.38, 0.34, ms) + m * 0.05, fo); b = lerp(b, lerp(0.22, 0.18, ms), fo);
    r = lerp(r, 0.62, cp * 0.45); g = lerp(g, 0.57, cp * 0.45); b = lerp(b, 0.42, cp * 0.45);
    const st = Math.max(rk * 0.85, sstep(0.86, 0.6, ny) * 0.95, sstep(0.6, 0.85, P.n5(x * 1.4, z * 1.4)) * sstep(0.95, 0.84, ny) * 0.7);   // (and the rocky patches of the slopes)
    r = lerp(r, 0.6 + m * 0.08, st); g = lerp(g, 0.55 + m * 0.07, st); b = lerp(b, 0.49 + m * 0.06, st);
    r = lerp(r, 0.74, wa * 0.7); g = lerp(g, 0.72, wa * 0.7); b = lerp(b, 0.67, wa * 0.7);
    if (dd < 4) { const t = sstep(4, 0.5, dd) * 0.4; r = lerp(r, 0.6, t); g = lerp(g, 0.52, t); b = lerp(b, 0.38, t); }
    KTCOL[0] = r; KTCOL[1] = g; KTCOL[2] = b; return KTCOL;
  }
  function ktGCol(x, z) {   // the terrain mesh's own vertex colour at (x, z) (bilinear over the grid vertices, each coloured as in ktTileGeo)
    const G = KT.G, gx = clamp((x - G.x0) / KTC, 1, G.nx - 2.001), gz = clamp((z - G.z0) / KTC, 1, G.nz - 2.001), i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, o = [0, 0, 0];
    for (const [a, b, w] of [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]]) { const ii = i + a, jj = j + b, h = ktGH(ii, jj);
      const nx = (ktGH(ii + 1, jj) - ktGH(ii - 1, jj)) / (2 * KTC), nz = (ktGH(ii, jj + 1) - ktGH(ii, jj - 1)) / (2 * KTC), c = ktCol(G.x0 + ii * KTC, G.z0 + jj * KTC, h, 1 / Math.hypot(nx, 1, nz), G.dd[jj * G.nx + ii]);
      o[0] += c[0] * w; o[1] += c[1] * w; o[2] += c[2] * w; }
    return o;
  }
  function ktTileOn(ti, tj) {   // 0: none, 1: full tile (5 m cells), 2: coarse outer ring (10 m cells, in the haze)
    const G = KT.G, L = KTC * KTT, d = ktDist(G.x0 + (ti + 0.5) * L, G.z0 + (tj + 0.5) * L);
    return d < 300 ? 1 : d < 430 ? 2 : 0;
  }
  function ktTileGeo(ti, tj, st) {   // one 100 m terrain tile (every st-th grid vertex): indexed, normals from the shared grid (no seams between tiles); 'steep' for pkGroundMat
    const G = KT.G, m = KTT / st, n = m + 1, pos = new Float32Array(n * n * 3), nor = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), stp = new Float32Array(n * n), i0 = ti * KTT, j0 = tj * KTT;
    let k = 0;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++, k++) {
      const i = i0 + a * st, j = j0 + b * st, x = G.x0 + i * KTC, z = G.z0 + j * KTC, h = ktGH(i, j);
      let nx = -(ktGH(i + st, j) - ktGH(i - st, j)) / (2 * KTC * st), nz = -(ktGH(i, j + st) - ktGH(i, j - st)) / (2 * KTC * st), l = Math.hypot(nx, 1, nz); nx /= l; nz /= l; const ny = 1 / l;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
      const c = ktCol(x, z, h, ny, G.dd[clamp(j, 0, G.nz - 1) * G.nx + clamp(i, 0, G.nx - 1)]); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      uv[k * 2] = x / 10; uv[k * 2 + 1] = -z / 10; stp[k] = sstep(0.78, 0.5, ny);
    }
    if (st === 1) {   // an edge shared with a coarse tile runs straight between every other vertex there: the fine tile's in-between vertices go onto that line (no cracks)
      const nb = (a, b) => (a >= 0 && b >= 0 && a < G.ntx && b < G.ntz ? ktTileOn(a, b) : 0);
      const fix = (k0, dk) => { for (let q = 1; q < m; q += 2) { const a = k0 + (q - 1) * dk, b = k0 + (q + 1) * dk; pos[(k0 + q * dk) * 3 + 1] = (pos[a * 3 + 1] + pos[b * 3 + 1]) / 2; } };
      if (nb(ti, tj - 1) === 2) fix(0, 1); if (nb(ti, tj + 1) === 2) fix(m * n, 1); if (nb(ti - 1, tj) === 2) fix(0, n); if (nb(ti + 1, tj) === 2) fix(m, n);
    }
    const idx = new Uint16Array(m * m * 6); k = 0;
    for (let b = 0; b < m; b++) for (let a = 0; a < m; a++) { const p = b * n + a, q = p + 1, c = p + n, d = c + 1; idx[k++] = p; idx[k++] = c; idx[k++] = q; idx[k++] = q; idx[k++] = c; idx[k++] = d; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('steep', new THREE.BufferAttribute(stp, 1)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere(); return g;
  }
  let ktATex = null, ktAKey = '', ktA2Tex = null;   // the board atlases are made once and reused by every Katu-Jaryk build (the teardown frees materials, not maps)
  function ktAtlas(cps) {   // text boards (8 rows of 1024 x 128): START, CILJ, CP1-CP4 with the altitude, the pass sign (Cyrillic and Latin), the run's banner
    if (ktATex && ktAKey === cps.join('|')) return ktATex;
    if (ktATex) ktATex.dispose(); ktAKey = cps.join('|');
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const txt = (s, cx, cy, px, col, w) => { x.fillStyle = col; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy, w || 960); };
    const chq = (x0, y0, w, h, q) => { for (let j = 0; j < h / q; j++) for (let i = 0; i < w / q; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(x0 + i * q, y0 + j * q, q, q); } };
    x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 128); chq(0, 0, 128, 128, 32); chq(896, 0, 128, 128, 32); txt('START', 512, 68, 104, '#fff', 700);
    chq(0, 128, 1024, 128, 32); x.fillStyle = '#fff'; x.fillRect(312, 142, 400, 100); txt('CILJ', 512, 196, 96, '#111', 380);
    cps.forEach((a, k) => { const y = 256 + k * 128; x.fillStyle = '#8a3b16'; x.fillRect(0, y, 1024, 128); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, y + 6, 1024, 5); x.fillRect(0, y + 117, 1024, 5);
      txt('CP' + (k + 1), 300, y + 68, 96, '#fff', 300); txt(a, 700, y + 68, 88, '#ffd23a', 520); });
    x.fillStyle = '#1f4f8c'; x.fillRect(0, 768, 1024, 128); x.strokeStyle = '#f2f4f6'; x.lineWidth = 8; x.strokeRect(8, 776, 1008, 112);   // the pass sign: a blue board, white letters
    txt('ПЕРЕВАЛ КАТУ-ЯРЫК', 512, 812, 60, '#f2f4f6', 900); txt('KATU-JARYK · 1.206 m', 512, 862, 42, '#f2f4f6', 900);
    x.fillStyle = '#c8461a'; x.fillRect(0, 896, 1024, 128); x.fillStyle = '#f4efe2'; x.fillRect(0, 900, 1024, 8); x.fillStyle = '#1f4f8c'; x.fillRect(0, 1012, 1024, 8);
    txt('SPUST KATU-JARYK', 512, 962, 80, '#fff', 960);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (ktATex = t);
  }
  function ktAtlas2() {   // the small signs (128 x 128 each, 8 a row): row 0 the Russian road signs on white: 0 a steep descent (22 %), 1 a dangerous bend
    // to the left, 2 to the right, 3 a double bend, 4 the speed limit 20; row 1: 0-1 the camp's board (two cells: КАТУ-ЯРЫК on brown wood), 2-3 the
    // kiosks' board (КАФЕ · ЧАЙ), 4 a white and blue Altai ribbon strip pattern (the ribbons on the larch)
    if (ktA2Tex) return ktA2Tex;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const tri = (x0, y0) => { x.fillStyle = '#c81e1e'; x.beginPath(); x.moveTo(x0 + 64, y0 + 8); x.lineTo(x0 + 122, y0 + 112); x.lineTo(x0 + 6, y0 + 112); x.closePath(); x.fill();
      x.fillStyle = '#fbfbf8'; x.beginPath(); x.moveTo(x0 + 64, y0 + 30); x.lineTo(x0 + 104, y0 + 101); x.lineTo(x0 + 24, y0 + 101); x.closePath(); x.fill(); x.fillStyle = '#111'; x.strokeStyle = '#111'; };
    // 0: steep descent: a black wedge falling to the right, the grade
    tri(0, 0); x.beginPath(); x.moveTo(36, 95); x.lineTo(92, 95); x.lineTo(36, 66); x.closePath(); x.fill(); x.font = '900 22px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('22%', 66, 58);
    // 1, 2: a dangerous bend (the arrow's tip to the left / right)
    for (const [k, d] of [[1, -1], [2, 1]]) { const x0 = k * 128; tri(x0, 0); x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(x0 + 64 - d * 6, 96); x.lineTo(x0 + 64 - d * 6, 70); x.quadraticCurveTo(x0 + 64 - d * 6, 52, x0 + 64 + d * 14, 52); x.stroke();
      x.beginPath(); x.moveTo(x0 + 64 + d * 24, 52); x.lineTo(x0 + 64 + d * 10, 42); x.lineTo(x0 + 64 + d * 10, 62); x.closePath(); x.fill(); }
    // 3: a double bend (a zigzag arrow)
    { const x0 = 384; tri(x0, 0); x.lineWidth = 6; x.beginPath(); x.moveTo(x0 + 56, 98); x.lineTo(x0 + 56, 84); x.lineTo(x0 + 72, 72); x.lineTo(x0 + 56, 60); x.lineTo(x0 + 64, 52); x.stroke(); x.beginPath(); x.moveTo(x0 + 70, 40); x.lineTo(x0 + 56, 48); x.lineTo(x0 + 70, 56); x.closePath(); x.fill(); }
    // 4: the speed limit (a red ring, 20)
    { const x0 = 512; x.fillStyle = '#c81e1e'; x.beginPath(); x.arc(x0 + 64, 64, 58, 0, TAU); x.fill(); x.fillStyle = '#fbfbf8'; x.beginPath(); x.arc(x0 + 64, 64, 44, 0, TAU); x.fill(); x.fillStyle = '#111'; x.font = '900 46px Arial, sans-serif'; x.fillText('20', x0 + 64, 66); }
    // row 1: the camp's board and the kiosks' board (brown wood, cream letters), the ribbons
    for (const [x0, s1, s2] of [[0, 'КАТУ-ЯРЫК', 'турбаза'], [256, 'КАФЕ · ЧАЙ', 'сувениры']]) { x.fillStyle = '#5a3a20'; x.fillRect(x0, 128, 256, 128); x.strokeStyle = '#efe0c2'; x.lineWidth = 5; x.strokeRect(x0 + 6, 134, 244, 116);
      x.fillStyle = '#f3e8d0'; x.font = '900 40px Arial, sans-serif'; x.fillText(s1, x0 + 128, 172, 230); x.font = '700 26px Arial, sans-serif'; x.fillText(s2, x0 + 128, 220, 230); }
    { const cols = ['#f6f6f2', '#2d6fd0', '#f6f6f2', '#f2c63a', '#f6f6f2', '#3a9a4c', '#f6f6f2', '#2d6fd0']; cols.forEach((cl, k) => { x.fillStyle = cl; x.fillRect(512 + k * 16, 128, 16, 128); }); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (ktA2Tex = t);
  }
  function ktTreeGeo(kind) {   // unit trees (height 1; the instances scale and tint them): 0 Siberian larch (light, open tiers of soft needles), 1 Siberian stone pine (the
    // 'cedar': dark, dense, a broad rounded crown), 2 birch, 3 poplar or willow of the valley floor, 4 a shrub (caragana, spiraea, dwarf birch: a low mound),
    // 5 a juniper mat on the rocks
    const g = new GB(), R = rng(740 + kind), rs = API.ROCK_SMOOTH;
    API.ROCK_SMOOTH = kind >= 1;   // (soft, rounded crowns; the larch's tiers stay crisp)
    if (kind === 0) {   // larch: a slim reddish trunk, five light tiers of drooping branches and a thin spire
      const col = [0.42, 0.57, 0.26], tip = [0.6, 0.72, 0.36];
      cyl(g, 0, -0.02, 0, 0.022, 0.62, 3, [0.42, 0.27, 0.18], null, 0.008);
      [[0.2, 0.22, 0.17], [0.36, 0.18, 0.16], [0.51, 0.145, 0.15], [0.65, 0.105, 0.14], [0.77, 0.07, 0.13]].forEach(([y, r, h], k) => starCone(g, 0, y, 0, r, h, 4, vary(col, R, 0.12), tip, k * 1.1 + 0.3, 0.07));
      cone(g, 0, 0.88, 0, 0.03, 0.12, 3, col, tip, 0.2);
    } else if (kind === 1) {   // stone pine: a short trunk, dark needle clumps stacked into a broad, rounded cone
      const col = [0.11, 0.24, 0.13];
      cyl(g, 0, -0.02, 0, 0.035, 0.3, 4, [0.34, 0.24, 0.18], null, 0.025);
      for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + R() * 0.6, y = 0.28 + (k % 3) * 0.17, d = 0.2 - (k % 3) * 0.05; ico(g, Math.cos(a) * d, y, Math.sin(a) * d, 0.2 - (k % 3) * 0.035, 1.1, vary(col, R, 0.18), R, 0.3); }
      ico(g, 0, 0.78, 0, 0.13, 1.4, vary(col, R, 0.1), R, 0.25);
    } else if (kind === 2) {   // birch: a slim white trunk, a light crown of two clumps
      cyl(g, 0, -0.02, 0, 0.019, 0.16, 3, [0.3, 0.28, 0.26], null, 0.016); cyl(g, 0, 0.14, 0, 0.016, 0.5, 3, [0.9, 0.9, 0.86], null, 0.009);
      ico(g, 0, 0.7, 0, 0.15, 1.5, [0.42, 0.6, 0.24], R, 0.3); ico(g, 0.07, 0.56, -0.05, 0.1, 1.2, [0.38, 0.56, 0.22], R, 0.35);
    } else if (kind === 3) {   // poplar or willow: a grey trunk, a big rounded crown of three clumps
      cyl(g, 0, -0.02, 0, 0.035, 0.42, 4, [0.45, 0.43, 0.38], null, 0.025);
      ico(g, 0, 0.62, 0, 0.27, 0.8, [0.3, 0.46, 0.2], R, 0.3); ico(g, 0.15, 0.5, 0.06, 0.2, 0.8, [0.34, 0.5, 0.22], R, 0.35); ico(g, -0.14, 0.52, -0.07, 0.19, 0.8, [0.28, 0.43, 0.19], R, 0.35);
    } else if (kind === 4) {   // a shrub: a mound of small clumps
      const col = [0.4, 0.46, 0.2];
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + R() * 0.5, d = k ? 0.28 : 0; ico(g, Math.cos(a) * d, 0.42 - d * 0.5, Math.sin(a) * d, 0.3, 0.75, vary(col, R, 0.22), R, 0.35); }
    } else {   // juniper: a low, spreading dark mat
      const col = [0.15, 0.26, 0.16];
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + R() * 0.5, d = k ? 0.32 : 0; ico(g, Math.cos(a) * d, 0.3 - d * 0.3, Math.sin(a) * d, 0.28, 0.55, vary(col, R, 0.2), R, 0.35); }
    }
    API.ROCK_SMOOTH = rs;
    const geo = g.geometry(); geo.computeBoundingSphere(); return geo;
  }
  // a yurt of the camps (white felt over a lattice: walls, a low cone of a roof, the smoke ring at its top; a painted wooden door, a band of ornament)
  function ktYurt(g, x, y, z, rot, r) {
    const felt = [0.92, 0.9, 0.84], band = [0.62, 0.22, 0.14], H = 1.7;
    cyl(g, x, y - 0.3, z, r, H + 0.3, 12, felt);
    cyl(g, x, y + 0.95, z, r + 0.02, 0.22, 12, band);
    cone(g, x, y + H, z, r + 0.15, r * 0.55, 12, [0.86, 0.84, 0.78], [0.8, 0.78, 0.72], 0);
    cyl(g, x, y + H + r * 0.5, z, r * 0.22, 0.14, 8, [0.5, 0.36, 0.22], [0.3, 0.24, 0.18]);
    const c = Math.cos(rot), s = Math.sin(rot); box(g, x + c * r * 0.97, y - 0.05, z + s * r * 0.97, 0.18, 1.45, 0.86, rot, [0.86, 0.36, 0.12], null, true);
  }
  // a log cabin (the camps' small huts and the bigger houses): log walls on a low plinth, a pitched roof of coloured sheet metal, a dark window each side
  function ktCabin(g, x, y0, y1, z, rot, L, D, roof) {
    const logs = [0.52, 0.36, 0.22], H = L * D > 30 ? 2.9 : 2.3, c = Math.cos(rot), s = Math.sin(rot);
    box(g, x, y0 - 0.3, z, L + 0.2, y1 - y0 + 0.6, D + 0.2, rot, [0.42, 0.4, 0.37], null, true);
    box(g, x, y1 + 0.3, z, L, H, D, rot, logs, null, true);
    for (const v of [-D / 2 - 0.04, D / 2 + 0.04]) box(g, x - s * v, y1 + 1.2, z + c * v, Math.min(1.2, L * 0.3), 0.8, 0.08, rot, [0.12, 0.14, 0.17], null, true);
    gable(g, x, y1 + 0.3 + H, z, L + 0.7, D + 0.8, Math.min(L, D) * 0.36, rot, roof, logs);
  }
  // the UAZ-452 'bukhanka' (the loaf): the Altai's van for the mountain roads; boxy, rounded at the front, two-tone
  function ktUaz(g, x, y, z, rot, col) {
    const c = Math.cos(rot), s = Math.sin(rot), at = (u) => [x + c * u, z + s * u], glass = [0.16, 0.2, 0.25];
    box(g, x, y + 0.42, z, 4.35, 1.6, 1.94, rot, col, null, true);
    { const [fx, fz] = at(2.1); box(g, fx, y + 0.5, fz, 0.32, 1.3, 1.86, rot, col, null, true); }
    { const [wx, wz] = at(1.86); box(g, wx, y + 1.36, wz, 0.66, 0.56, 1.96, rot, glass, null, true); }
    box(g, x - c * 0.3, y + 1.38, z - s * 0.3, 3.1, 0.5, 1.97, rot, glass, null, true);
    box(g, x, y + 2.0, z, 4.2, 0.08, 1.9, rot, [0.86, 0.86, 0.84]);
    for (const [a, b] of [[1.35, 0.85], [1.35, -0.85], [-1.35, 0.85], [-1.35, -0.85]]) box(g, x + c * a - s * b, y, z + s * a + c * b, 0.76, 0.76, 0.3, rot, [0.08, 0.08, 0.09], null, true);
  }
  // the knockable roadside posts (the white signal posts with a black band): where buildKatu wanted one (spots: [[i, side]]), only within w + 2 and on level
  // verge, never at the start or the finish. The props stand on the verge's own height. Drawn out to 150 m
  function katuProps(out, spots, prof) {
    out.propR = 150;
    out.propFloor = propFloorTable(null, prof);
    const sA = T.startS + 30, sB = T.finishS - 30;
    return out.propStats = roadsideProps(out.props, { spots, postEdge: [1.0, 1.4], exits: 0, apexes: 0, wallEdge: [1.4, 1.9], stacks: [5, 6], rows2: 0, maxLat: T.w + 2,
      floor: out.propFloor, skip: (i) => { const s = i * T.ds; return s < sA || s > sB; } });
  }
  function buildKatu(scene, tex, opts) {
    const R = rng(7811), N = T.N, w = T.w, dens = opts.density || 1, def = T.def, PI = Math.PI;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: ktGround, camFloor: ktGround, props: [], farClip: true, ownTex: [] };
    ktPrep(); vrStubs();   // (the side roads: the ground levelled under them, ktHx)
    const P = KT, iE = N - 1, sStart = T.startS, sFin = T.finishS, base = P.D.base, sTop = sStart + (def.top || 0), sBot = sStart + (def.bottom || 0);
    // the buildings (def.bld [x, z, length, width, angle, kind]; kind 0 log cabin or house, 1 yurt, 2 kiosk or cafe, 3 shed or privy): the ones clear of
    // the road (the hairpins were widened) and of the river; each gets a level plot (pushed before the terrain is sampled)
    const blds = [];
    for (const b of def.bld || []) {
      let [x, z, L, W, ang, kind] = b; if (kind === 1) L = W = Math.max(4.4, Math.min(6, (L + W) / 2));
      const c = Math.cos(ang), s = Math.sin(ang), clear = () => { for (const [u, v] of [[0, 0], [-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]]) { const px = x + c * u - s * v, pz = z + s * u + c * v, n = ktNear(px, pz);
        if ((n.i >= 0 && n.dd < 2) || ktRiv(px, pz) > -3) return false; } return true; };
      if (clear()) blds.push({ x, z, L, W, ang, kind });
    }
    for (const b of blds) { b.pad = { x: b.x, z: b.z, r: Math.hypot(b.L, b.W) / 2 + 0.8, b: 8, h: ktHx(b.x, b.z) }; P.pads.push(b.pad); }
    // the car parks: at the top beside the road where the viewpoints are (OpenStreetMap: def.pois.parking), at the foot by the camp's gate; level gravel
    const parks = [];
    for (const pk of (def.pois && def.pois.parking) || []) { const g = pk.g; let cx = 0, cz = 0; for (const p of g) { cx += p[0] / g.length; cz += p[1] / g.length; }
      const i = T.nearestIdx(cx, cz), lat = (cx - T.px[i]) * T.nx[i] + (cz - T.pz[i]) * T.nz[i], side = lat > 0 ? 1 : -1, bar = side > 0 ? T.br[i] : T.bl[i];
      const off = Math.max(Math.abs(lat), bar + 10), x = T.px[i] + T.nx[i] * side * off, z = T.pz[i] + T.nz[i] * side * off, r = clamp(Math.sqrt(g.length > 2 ? 900 : 250), 9, 18);
      const pad = { x, z, r, b: 14, h: T.hy[i] - 0.25, i, side, park: true }; P.pads.push(pad); parks.push(pad); }
    out.bounds = { minX: P.bx0 - 170, maxX: P.bx1 + 170, minZ: P.bz0 - 170, maxZ: P.bz1 + 170 };
    const cut = out.dyn.ouCut = { uCam: { value: new THREE.Vector3() }, uCar: { value: new THREE.Vector3(1e6, 0, 1e6) } };   // (ouCutMat: the trees and buildings between the camera and the car fade out)
    const matV = ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 32;   // tree exclusion circles (buildings, crowds, plots), hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let L = eh.get(k); if (!L) eh.set(k, L = []); L.push(e); } return e; };
    const excluded = (x, z) => { const L = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!L) return false; for (let k = 0; k < L.length; k++) { const e = L[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };
    stubExcl(exclPush);   // (nothing grows or stands on the side roads)
    for (const b of blds) exclPush(b.x, b.z, Math.hypot(b.L, b.W) / 2 + 2.5);
    for (const p of parks) exclPush(p.x, p.z, p.r + 3);
    out.marks = {};   // (where the landmarks stand: the tests look for them)

    /* ---- the strips of terrain along both sides of the road (KTSW; on the ladder across to the other leg): their cross-sections from the verge's edge
       out (exact: ktHx), each point's normal (from its neighbours across and along) and colour; the grid's vertices under them marked (G.sm: pushed
       down) before the tiles are made ---- */
    const SK = 9, sX = [[], []];   // (SK: the points over the first KTSW of a cross-section; a wider one, across the ladder, one more every 3 m or less)
    {
      const G = P.G;
      for (let si = 0; si < 2; si++) { const side = si ? 1 : -1;
        const Wa = new Float32Array(N), ga = new Float32Array(N), ha = new Float32Array(N);
        for (let i = 0; i < N; i++) { ga[i] = ktGap(i, side); ha[i] = KTGAP.h; Wa[i] = ktStripW(i, side, ga[i]); }
        for (let i = 1; i < N; i++) Wa[i] = Math.min(Wa[i], Wa[i - 1] + 3);   // (the width changes by 3 m a sample at most: two cross-sections far apart in width
        for (let i = N - 2; i >= 0; i--) Wa[i] = Math.min(Wa[i], Wa[i + 1] + 3);   // would be joined by long thin triangles across the face)
        for (let i = 0; i < N; i++) {
          const bar = side > 0 ? T.br[i] : T.bl[i], o = bar + 1.9;
          const gp = ga[i], gh = ha[i], W = Wa[i]; if (W < 0.3) continue;   // (across to the other leg of the ladder: its strip covers the same, drawn behind this one if it is the upper leg)
          const W1 = Math.min(W, KTSW), nk = SK + (W > KTSW + 0.01 ? Math.ceil((W - KTSW) / 3) : 0), X = []; X.u = [];
          for (let k = 0; k < nk; k++) { const d = k < SK ? W1 * k / (SK - 1) : KTSW + (W - KTSW) * (k - SK + 1) / (nk - SK), q = o + d, x = T.px[i] + T.nx[i] * side * q, z = T.pz[i] + T.nz[i] * side * q;
            const y = k ? ktHx(x, z) : T.hy[i] + ktVergeEnd(i, side); X.push([x, y, z, 1.9 + d, 0, 1, 0, 0, 0, k ? KTN.dd : 1.9]); X.u.push(d / W); }   // (from the verge's edge, as high as the verge ends;
          // [9]: beyond the nearest barrier, for its colour: the same where the other leg's strip covers it too)
          X.meet = gp - 3.5 <= KTMW && W >= gp - 3.5 - 0.01; X.up = X.meet && gh < T.hy[i];   // (meet: it reaches the other leg; else its outer edge tucked 0.6 m under the grid, which lies over it there)
          if (!X.meet) X[nk - 1][1] -= 0.6;
          sX[si][i] = X;
        }
        for (let i = 0; i < N; i++) { const X = sX[si][i]; if (!X) continue;   // normals (up) and colours
          for (let k = 0; k < X.length; k++) {
            const p = X[k], d = p[3] - 1.9, pa = X[Math.max(0, k - 1)], pb = X[Math.min(X.length - 1, k + 1)], ra = sX[si][i - 1] ? ktStripD(sX[si][i - 1], d) : p, rb = sX[si][i + 1] ? ktStripD(sX[si][i + 1], d) : p;   // (along: as far out)
            const ux = pb[0] - pa[0], uy = pb[1] - pa[1], uz = pb[2] - pa[2], vx = rb[0] - ra[0], vy = rb[1] - ra[1], vz = rb[2] - ra[2];
            let cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx; if (cy < 0) { cx = -cx; cy = -cy; cz = -cz; } const cl = Math.hypot(cx, cy, cz) || 1;
            p[4] = cx / cl; p[5] = cy / cl; p[6] = cz / cl; const c = ktCol(p[0], p[2], p[1], p[5], p[9]); p[7] = c[0]; p[8] = c[1]; p[9] = c[2];
          }
        }
        for (let i = 0; i + 1 < N; i++) { const A = sX[si][i], B = sX[si][i + 1]; if (!A || !B) continue;   // the grid's vertices under the strip, the verge and this half of the road
          const ka = A.length - (A.meet ? 1 : 2), kb = B.length - (B.meet ? 1 : 2);   // (not under the tucked outer edge: the grid, as it is, covers that)
          const poly = [[T.px[i], T.pz[i]], [A[ka][0], A[ka][2]], [B[kb][0], B[kb][2]], [T.px[i + 1], T.pz[i + 1]]];   // (from the centre line: none of the grid's triangles reaching from the verge up a face over the strip)
          let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
          for (let b = Math.max(0, Math.ceil((z0 - G.z0) / KTC)); b <= Math.min(G.nz - 1, Math.floor((z1 - G.z0) / KTC)); b++) for (let a = Math.max(0, Math.ceil((x0 - G.x0) / KTC)); a <= Math.min(G.nx - 1, Math.floor((x1 - G.x0) / KTC)); a++)
            if (inPoly(poly, G.x0 + a * KTC, G.z0 + b * KTC)) G.sm[b * G.nx + a] = 1;
        }
      }
      for (let k = 0; k < G.sm.length; k++) if (G.sm[k]) {   // (2: all its neighbours under the strips too: deeper)
        const i = k % G.nx, j = (k - i) / G.nx; let all = i > 0 && j > 0 && i < G.nx - 1 && j < G.nz - 1;
        for (let b = -1; b <= 1 && all; b++) for (let a = -1; a <= 1; a++) if (!G.sm[k + b * G.nx + a]) { all = false; break; }
        if (all) G.sm[k] = 3; }
      for (let k = 0; k < G.sm.length; k++) if (G.sm[k] === 3) G.sm[k] = 2;
      G.h.fill(NaN);   // (any height asked for before: again, under the strips pushed down)
    }

    /* ---- terrain tiles, the strips along the road, the river ---- */
    let nFar = 0;
    const WIND = out.dyn.wind = { value: 0 };   // (World.update: the crowns and the clumps sway)
    const tMat = ktGrassLook(pkGroundMat()), gMat = new THREE.MeshLambertMaterial({ map: vrGritTex(), vertexColors: true });   // terrain tiles (the grit fades on steep faces) / verge ribbons
    {
      const G = P.G, grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        const on = ktTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; else nFar++;   // (G.on: the full tiles, which get the forest)
        const m = new THREE.Mesh(ktTileGeo(ti, tj, on), tMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m);
      }
      // the strips along the road (both sides, 80 samples a mesh), drawn from both sides (past the edge of a leg of the ladder: the face under it)
      const sMat = ktGrassLook(pkGroundMat()); sMat.side = THREE.DoubleSide;
      const sMatU = ktGrassLook(pkGroundMat()); sMatU.side = THREE.DoubleSide; sMatU.polygonOffset = true; sMatU.polygonOffsetFactor = 1; sMatU.polygonOffsetUnits = 4;   // (the upper leg's strip, where it overlaps the lower one's: behind it)
      for (let c0 = 0; c0 < N - 1; c0 += 80) for (const up of [false, true]) {
        const pos = [], nor = [], col = [], uvs = [], stp = [], idx = [];
        for (let si = 0; si < 2; si++) {
          const vi = new Map(), put = (i, k) => { const key = i * 64 + k; let q = vi.get(key); if (q != null) return q; const p = sX[si][i][k]; q = pos.length / 3;
            pos.push(p[0], p[1], p[2]); nor.push(p[4], p[5], p[6]); col.push(p[7], p[8], p[9]); uvs.push(p[0] / 10, -p[2] / 10); stp.push(sstep(0.78, 0.5, p[5])); vi.set(key, q); return q; };
          for (let i = c0; i < Math.min(c0 + 80, N - 1); i++) {
            const A = sX[si][i], B = sX[si][i + 1]; if (!A || !B || A.up !== up) continue;
            const ex = A[1][0] - A[0][0], ez = A[1][2] - A[0][2], fx = B[0][0] - A[0][0], fz = B[0][2] - A[0][2], fr = ez * fx - ex * fz > 0;   // (its front up)
            const tri = (p, q, r) => { if (fr) idx.push(p, q, r); else idx.push(p, r, q); };
            for (let a = 0, b = 0; a < A.length - 1 || b < B.length - 1;) {   // (the two cross-sections zipped by their u: the same number of points or not)
              if (b === B.length - 1 || (a < A.length - 1 && A.u[a + 1] <= B.u[b + 1])) { tri(put(i, a), put(i, a + 1), put(i + 1, b)); a++; }
              else { tri(put(i, a), put(i + 1, b + 1), put(i + 1, b)); b++; }
            }
          }
        }
        if (!idx.length) continue;
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setAttribute('steep', new THREE.Float32BufferAttribute(stp, 1)); g.setIndex(idx); g.computeBoundingSphere();
        const m = new THREE.Mesh(g, up ? sMatU : sMat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.name = 'roadStrip'; grp.add(m);
      }
      // the Chulyshman: a 5 m grid at its sloping level wherever the ground lies below it, its milky green-blue glacier water: pale over the gravel
      // of the shallows, deeper turquoise in the stream, the sky mirrored in patches; the shore band with its foam along the banks
      if (P.riv.length) {
        const WO = { len: 1.3, amp: 1.1, refl: 0.4, land: 0.5, shal: 0.45, lap: 0.6, surf: 0 }, wMat = waterMat(tex, Object.assign({ vc: true }, WO));
        const deep = [0.2, 0.46, 0.46], shal = [0.46, 0.6, 0.55], sky = [0.5, 0.64, 0.7], cs = 5, near = (x, z) => ktDist(x, z) < 470;
        const g = new GB(true), uv = (q) => [q[0] / 14, -q[2] / 14], cc = new Map();
        const wc = (x, z) => { const k = Math.round(x) * 100003 + Math.round(z); let c = cc.get(k); if (c) return c; const e = ktRiv(x, z), ks = 0.4 * sstep(0.55, 0.8, P.n2(x * 2.2, z * 2.2)); c = [0, 1, 2].map(q => lerp(lerp(shal[q], deep[q], sstep(3, 14, e)), sky[q], ks)); cc.set(k, c); return c; };
        for (const r of P.riv) {
          const x0 = Math.max(P.x0, r.x0 - 10), z0 = Math.max(P.z0, r.z0 - 10), x1 = Math.min(P.x0 + (P.G.nx - 1) * KTC, r.x1 + 10), z1 = Math.min(P.z0 + (P.G.nz - 1) * KTC, r.z1 + 10);
          for (let z = z0; z < z1; z += cs) for (let x = x0; x < x1; x += cs) {
            if (!near(x + cs / 2, z + cs / 2) || ktRiv(x + cs / 2, z + cs / 2) < -4) continue;
            let wet = false; for (const [a, b] of [[0, 0], [cs, 0], [0, cs], [cs, cs]]) if (ktGround(x + a, z + b) < ktLevel(x + a, z + b) + 0.3) wet = true;
            if (!wet) continue;
            const A = [x, ktLevel(x, z), z], B = [x + cs, ktLevel(x + cs, z), z], C = [x + cs, ktLevel(x + cs, z + cs), z + cs], D = [x, ktLevel(x, z + cs), z + cs];
            g.quadUp(A, B, C, D, [wc(A[0], A[2]), wc(B[0], B[2]), wc(C[0], C[2]), wc(D[0], D[2])], [uv(A), uv(B), uv(C), uv(D)]);
          }
        }
        if (!g.empty) { const m = new THREE.Mesh(g.geometry(), wMat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); out.dyn.water = tex.water;
          // the shore band along the banks (the foam lapping, the paler shallows): the waterline of the ground against the sloping water (the ground's
          // height above the water's there; dry far from the banks and outside the corridor), the band then laid at the water's own level
          const G = P.G, rel = (i, j) => { const x = G.x0 + i * KTC, z = G.z0 + j * KTC; return !near(x, z) || ktRiv(x, z) < -12 ? 10 : ktGH(i, j) - ktLevel(x, z); }, bands = [];
          for (const r of P.riv) {
            const i0 = Math.max(0, Math.floor((r.x0 - 20 - G.x0) / KTC)), j0 = Math.max(0, Math.floor((r.z0 - 20 - G.z0) / KTC)), i1 = Math.min(G.nx - 1, Math.ceil((r.x1 + 20 - G.x0) / KTC)), j1 = Math.min(G.nz - 1, Math.ceil((r.z1 + 20 - G.z0) / KTC));
            const b = shoreBand(G.x0 + i0 * KTC, G.z0 + j0 * KTC, G.x0 + i1 * KTC, G.z0 + j1 * KTC, 0, waterline(rel, G.x0, G.z0, KTC, i0, i1, j0, j1, 0), 14, { col: (x, z) => wc(x, z) });
            if (b) { const pp = b.attributes.position; for (let k = 0; k < pp.count; k++) pp.setY(k, ktLevel(pp.getX(k), pp.getZ(k)) + 0.015); b.computeBoundingSphere(); bands.push(b); }
          }
          addShore(root, mergeBands(bands), wMat, WO); }
      }
    }

    /* ---- the road: crushed brown schist with two darker wheel tracks along the driving line and loose gravel on the crown and the shoulders (Ouninpohja's
       gravel, browner), then the verge: a stony shoulder, a ditch just past the barrier line, up or down onto the ground (120 m chunks, culled) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const rTex = ouRoadTex(), rMat = new THREE.MeshPhongMaterial({ map: rTex.map, bumpMap: rTex.bump, bumpScale: 0.05, shininess: 4, specular: 0x16130f, vertexColors: true }); out.asphaltMat = rMat;
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const altAt = (i) => T.hy[i] + base;
    // the verge's cross-section per sample and side (5 points: [offset, height above the road]): the stony shoulder, the ditch past the barrier line, onto the
    // ground: the strip along the road (exact: ktHx) begins at its outer edge
    const SB = stubGeo({ gCol: ktGCol, gravC: [0.9, 0.84, 0.76], shC: [0.66, 0.6, 0.48], line: 'none' });   // the side roads: the tracks and the camps' roads (their surfaces in the road's chunks below)
    const vProf = (i, side) => { const bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i], ex = (o) => { const q = side * o; return ktHx(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) - y; };
      const ms = stubVerge(SB, i, side, w + 0.6, bar); if (ms) return ms;   // (a side road's mouth: no ditch, the verge at its surface)
      return [[w + 0.6, -0.03], [Math.max(w + 1.2, bar - 0.7), clamp(ex(Math.max(w + 1.2, bar - 0.7)) + 0.05, -0.12, 0.3)], [bar + 0.45, clamp(ex(bar + 0.45) - 0.25, -1, -0.42)],
        [bar + 1.15, clamp(ex(bar + 1.15) + 0.03, -1.3, 0.8)], [bar + 1.9, ktVergeEnd(i, side)]]; };   // (where the ground falls or rises steeply the strip takes it from the verge's edge)
    const vp = [-1, 1].map(side => { const a = []; for (let i = 0; i < N; i++) a.push(vProf(i, side)); return a; });
    {
      const tileL = 7, grav = [1.03, 0.97, 0.9];
      const cols = (i) => { const rl = clamp(T.rl[i], -w + 2.3, w - 2.3); return [-w, -w + 0.5, rl - 1.7, rl - 1.2, rl - 0.7, rl - 0.25, rl + 0.25, rl + 0.7, rl + 1.2, rl + 1.7, w - 0.5, w]; };
      const shade = (i, o) => { const a = Math.abs(o - T.rl[i]), trk = sstep(0.45, 0.72, a) * sstep(1.45, 1.18, a), ao = Math.abs(o);
        let k = 1.0 - 0.2 * trk + 0.06 * sstep(0.5, 0.2, a);   // the tracks darker and smoother, the loose crown between them lighter
        const outer = Math.sign(o) === -Math.sign(T.k[i]) ? sstep(1 / 400, 1 / 70, Math.abs(T.k[i])) : 0;   // on the outside of a bend the cars throw the loose gravel out
        k += (0.06 + 0.07 * outer) * sstep(w - 1.3 - 1.4 * outer, w - 0.3, ao) * (1 - trk);
        k *= 0.93 + 0.13 * P.n2(T.px[i] * 0.7 + 50, T.pz[i] * 0.7);   // long dusty and darker stretches
        return [grav[0] * k, grav[1] * k, grav[2] * k]; };
      const shC = [0.66, 0.6, 0.48];
      const vc = [-1, 1].map((side, si) => { const a = []; for (let i = 0; i < N; i++) { const bar = side > 0 ? T.br[i] : T.bl[i];
        a.push(vp[si][i].map(([o, y], k) => { const x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
          if (k === 0) return shC;
          if (k === 4) { const X = sX[si][i]; return X ? [X[0][7], X[0][8], X[0][9]] : ktGCol(x, z); }   // (as the strip's own first point)
          const sl = k === 2 ? ktSlope(x, z) : 0; return ktCol(x, z, T.hy[i] + y, 1 / Math.sqrt(1 + sl * sl), Math.max(0, o - bar)).slice(); })); } return a; });
      const wuv = (p) => [p[0] / 10, -p[2] / 10];
      for (let c0 = 0; c0 < N - 1; c0 += 60) {
        const gr = new GB(true), gv = new GB(true);
        for (let i = c0; i < Math.min(c0 + 60, N - 1); i++) {
          const j = i + 1, v0 = i * T.ds / tileL, v1 = j * T.ds / tileL, oi = cols(i), oj = cols(j);
          for (let c = 0; c < oi.length - 1; c++) { const a0 = oi[c], a1 = oi[c + 1], b0 = oj[c], b1 = oj[c + 1];
            gr.quadUp(Pt(i, a0, 0.02), Pt(i, a1, 0.02), Pt(j, b1, 0.02), Pt(j, b0, 0.02), [shade(i, a0), shade(i, a1), shade(j, b1), shade(j, b0)], [[(a0 + w) / tileL, v0], [(a1 + w) / tileL, v0], [(b1 + w) / tileL, v1], [(b0 + w) / tileL, v1]]); }
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, ci = vc[si][i], cj = vc[si][j], qi = vp[si][i], qj = vp[si][j];
            gv.quadUp(Pt(i, side * w, 0.01), Pt(i, side * qi[0][0], qi[0][1]), Pt(j, side * qj[0][0], qj[0][1]), Pt(j, side * w, 0.01), [shC, shC, shC, shC], [wuv(Pt(i, side * w, 0)), wuv(Pt(i, side * qi[0][0], 0)), wuv(Pt(j, side * qj[0][0], 0)), wuv(Pt(j, side * w, 0))]);
            for (let k = 0; k < 4; k++) { const a = Pt(i, side * qi[k][0], qi[k][1]), b = Pt(i, side * qi[k + 1][0], qi[k + 1][1]), c = Pt(j, side * qj[k + 1][0], qj[k + 1][1]), d = Pt(j, side * qj[k][0], qj[k][1]);
              gv.quadUp(a, b, c, d, [ci[k], ci[k + 1], cj[k + 1], cj[k]], [wuv(a), wuv(b), wuv(c), wuv(d)]); }
          }
        }
        SB.emit(c0, c0 + 60, gr, gr, new GB());   // (the side roads whose junctions are in this chunk: gravel, as the road)
        addM(gr, rMat); addM(gv, gMat);
      }
      // a white line of lime across the road at the start and at the flying finish, a thinner one at each checkpoint
      const gl = new GB(), wht = [0.96, 0.96, 0.94];
      for (const [s0, hw] of [[sStart, 0.4], [sFin, 0.4]].concat(T.cpS.map(s => [s, 0.2]))) { const a = atSf(s0 - hw, -w + 0.1), b = atSf(s0 - hw, w - 0.1), c = atSf(s0 + hw, w - 0.1), d = atSf(s0 + hw, -w + 0.1), y = (p) => T.hy[p[3]] + 0.04;
        gl.quadUp([a[0], y(a), a[1]], [b[0], y(b), b[1]], [c[0], y(c), c[1]], [d[0], y(d), d[1]], [wht, wht, wht, wht]); }
      addM(gl, new THREE.MeshLambertMaterial({ vertexColors: true }));
      // the gravel in the rain and the winter (Render: setWet darkens it and makes it glisten, the verges darker; seasonWorld packs it with snow), as
      // Ouninpohja's; no puddles on a road this steep (the water runs off): an empty group in their place
      out.dyn.wet = { puddles: new THREE.Group(), road: rMat, ground: gMat, base: { sh: rMat.shininess, sp: rMat.specular.getHex() } };
    }

    /* ---- scenery (vertex coloured, 110 m chunks) ---- */
    const scen = new Chunks(110), ban = new GB(true), ban2 = new GB(true), W1 = [1, 1, 1];   // (ban: the run's boards, ban2: the signs)
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const fans = [[0.86, 0.16, 0.13], [0.96, 0.82, 0.2], [0.16, 0.36, 0.78], [0.95, 0.95, 0.95], [0.2, 0.6, 0.3], [1, 0.55, 0.1], [0.12, 0.14, 0.2], [0.42, 0.62, 0.86], [0.7, 0.3, 0.5]];
    const CR = crowdCtx({ gH: ktGround, near: (x, z) => ktNear(x, z).dd, excluded, maxSlope: 0.6, water: (x, z) => ktRiv(x, z) > -4 }), crSoft = new Set();
    const bannerQ = (cx, cy, cz, tx, tz, W, H, v0, v1, u0, u1, gb, tilt) => {   // double-sided board (bottom centre cx, cy, cz) readable from +t and -t; atlas cell u0..u1 x v0..v1; tilt leans its top towards +t
      const ux = tz, uz = -tx, ca = Math.cos(tilt || 0), sa = Math.sin(tilt || 0), kx = tx * H * sa, ky = H * ca, kz = tz * H * sa; u0 = u0 || 0; u1 = u1 == null ? 1 : u1;
      for (const f of [-1, 1]) { const ox = tx * ca * 0.04 * f, oy = -sa * 0.04 * f, oz = tz * ca * 0.04 * f, hw = W / 2 * f;
        const A = [cx + ox - ux * hw, cy + oy, cz + oz - uz * hw], B = [cx + ox + ux * hw, cy + oy, cz + oz + uz * hw], C = [B[0] + kx, B[1] + ky, B[2] + kz], D = [A[0] + kx, A[1] + ky, A[2] + kz];
        (gb || ban).quadO(A, B, C, D, W1, [cx + kx / 2 - tx * ca * f, cy + ky / 2 + sa * f, cz + kz / 2 - tz * ca * f], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
    };
    const row = (k) => [1 - (k + 1) / 8, 1 - k / 8];   // atlas row k (0 = top) -> [v0, v1]
    const arch = (s, rowK, postCol, beamCol) => {   // gantry over the road: two posts at the barriers, a beam, a board both ways; returns [x, y, z, i]
      const i = T.idx(s), x = T.px[i], z = T.pz[i], y = T.hy[i], nx = T.nx[i], nz = T.nz[i], L1 = Math.min(T.bl[i], w + 3) + 0.9, L2 = Math.min(T.br[i], w + 3) + 0.9, g = scen.get(x, z), hd = T.hd[i];
      box(g, x - nx * L1, y - 0.6, z - nz * L1, 0.6, 7.4, 0.6, hd, postCol); box(g, x + nx * L2, y - 0.6, z + nz * L2, 0.6, 7.4, 0.6, hd, postCol);
      const cx = x + nx * (L2 - L1) / 2, cz = z + nz * (L2 - L1) / 2; box(g, cx, y + 6.1, cz, 0.55, 0.65, L1 + L2 + 0.6, hd, beamCol);
      const [v0, v1] = row(rowK); bannerQ(x, y + 4.3, z, T.tx[i], T.tz[i], 11.6, 1.45, v0, v1);
      const e = exclPush(x, z, Math.max(L1, L2) + 6); crSoft.add(e); return [x, y, z, i];
    };
    const person = (x, z, ro, col) => crowdPut(CR, x, ktGround(x, z), z, -Math.sin(ro), Math.cos(ro), { col: col || fans[Math.floor(R() * fans.length)] }, 1);
    const carPk = (x, z, rot, col) => { const g = scen.get(x, z), y = ktGround(x, z), c = Math.cos(rot), s = Math.sin(rot);   // a parked car (a 4x4: higher, a roof rack)
      box(g, x, y + 0.36, z, 4.4, 0.9, 1.86, rot, col, null, true); box(g, x - c * 0.25, y + 1.24, z - s * 0.25, 2.6, 0.66, 1.66, rot, [0.16, 0.2, 0.26], col, true);
      box(g, x - c * 0.25, y + 1.92, z - s * 0.25, 2.2, 0.08, 1.4, rot, [0.12, 0.12, 0.13]);
      for (const [a, b] of [[1.35, 0.82], [1.35, -0.82], [-1.35, 0.82], [-1.35, -0.82]]) box(g, x + c * a - s * b, y, z + s * a + c * b, 0.74, 0.74, 0.28, rot, [0.08, 0.08, 0.09], null, true); };
    const flagE = (g, x, y, z, rot, h, k) => {   // a flag pole with the run's flag (orange, a white band; blue every other one), both faces
      cyl(g, x, y - 0.2, z, 0.06, h + 0.2, 5, [0.94, 0.94, 0.92], [0.9, 0.78, 0.2]);
      const c = Math.cos(rot), s = Math.sin(rot), fw = 1.7, fh = 1.0, [fx, fz] = [x + c * (fw / 2 + 0.06), z + s * (fw / 2 + 0.06)], y0 = y + h - fh - 0.15, a = k % 2 ? [0.12, 0.32, 0.66] : [0.86, 0.32, 0.1];
      box(g, fx, y0, fz, fw, fh, 0.04, rot, a); box(g, fx, y0 + fh * 0.4, fz, fw + 0.01, fh * 0.2, 0.05, rot, [0.96, 0.95, 0.92]); };

    /* ---- the buildings: the kiosks at the top (timber, a lean-to roof, the board), the privies, the yurts and the log cabins of the camps ---- */
    let nBld = 0;
    {
      const RB = rng(7821), roofs = [[0.22, 0.42, 0.3], [0.2, 0.32, 0.55], [0.6, 0.18, 0.13], [0.3, 0.3, 0.32], [0.24, 0.46, 0.5]], woods = [[0.52, 0.36, 0.22], [0.58, 0.42, 0.26], [0.46, 0.32, 0.2]];
      const lowHigh = (b) => { const c = Math.cos(b.ang), s = Math.sin(b.ang); let lo = 1e9, hi = -1e9; for (const [u, v] of [[-b.L / 2, -b.W / 2], [b.L / 2, -b.W / 2], [b.L / 2, b.W / 2], [-b.L / 2, b.W / 2], [0, 0]]) { const y = ktGround(b.x + c * u - s * v, b.z + s * u + c * v); lo = Math.min(lo, y); hi = Math.max(hi, y); } return [lo, hi]; };
      let kiosk = 0;
      for (const b of blds) {
        const g = scen.get(b.x, b.z), [lo, hi] = lowHigh(b);
        if (b.kind === 1) { ktYurt(g, b.x, hi, b.z, b.ang + RB() * TAU, b.L / 2); out.marks.yurt = out.marks.yurt || [b.x, b.z]; }
        else if (b.kind === 3) {   // a privy or a shed: weathered boards, a lean-to roof
          const wd = vary(woods[Math.floor(RB() * 3)], RB, 0.15); box(g, b.x, lo - 0.2, b.z, b.L, hi - lo + 2.4, b.W, b.ang, wd, null, true);
          box(g, b.x, hi + 2.2, b.z, b.L + 0.5, 0.12, b.W + 0.5, b.ang, [0.32, 0.32, 0.34]);
        } else if (b.kind === 2) {   // a kiosk or a cafe: timber walls, a big window, a lean-to roof out over the front, the board
          const wd = vary(woods[Math.floor(RB() * 3)], RB, 0.1), c = Math.cos(b.ang), s = Math.sin(b.ang);
          box(g, b.x, lo - 0.3, b.z, b.L, hi - lo + 2.9, b.W, b.ang, wd, null, true);
          box(g, b.x - s * (b.W / 2 + 0.05), hi + 0.9, b.z + c * (b.W / 2 + 0.05), b.L * 0.6, 1.1, 0.08, b.ang, [0.16, 0.2, 0.25], null, true);
          box(g, b.x - s * 0.6, hi + 2.7, b.z + c * 0.6, b.L + 0.6, 0.12, b.W + 1.8, b.ang, vary(roofs[Math.floor(RB() * roofs.length)], RB, 0.1));
          if (kiosk++ % 3 === 0) bannerQ(b.x - s * (b.W / 2 + 0.9), hi + 2.86, b.z + c * (b.W / 2 + 0.9), -s, c, 2.6, 1.3, 6 / 8, 7 / 8, 0.25, 0.5, ban2);
          out.marks.kiosk = out.marks.kiosk || [b.x, b.z];
        } else ktCabin(g, b.x, lo, hi, b.z, b.ang, Math.max(3, b.L), Math.max(2.8, b.W), vary(roofs[Math.floor(RB() * roofs.length)], RB, 0.1));
        CR.block(b.x, b.z, b.L + 1, b.W + 1, b.ang);
        nBld++;
      }
    }
    const fmtAlt = (m) => String(Math.round(m)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m';
    const cpAlt = T.cpS.map(s => fmtAlt(T.altAt(T.hy[T.idx(s)])));

    /* ---- START (on the Ulagan plateau): gantry with the start lights, the timing hut, the run's flags, the road closed behind it ---- */
    {
      const [x, y, z, i] = arch(sStart, 0, [0.2, 0.22, 0.26], [0.14, 0.15, 0.18]), nx = T.nx[i], nz = T.nz[i], g = scen.get(x, z);
      box(g, x, y + 6.75, z, 0.5, 1.1, 5.4, T.hd[i], [0.08, 0.08, 0.09]);   // light panel on top of the beam
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, y + 7.3, z + nz * o); m.rotation.y = -T.hd[i]; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      const [hx, hz] = onSide(sStart - 5, -1, 3.2), hy = ktGround(hx, hz), gh = scen.get(hx, hz);   // timing hut
      box(gh, hx, hy, hz, 4.0, 2.7, 2.8, T.hd[i], [0.92, 0.9, 0.84], [0.5, 0.3, 0.2], true); box(gh, hx, hy + 1.3, hz, 4.05, 0.9, 2.85, T.hd[i], [0.2, 0.3, 0.42], null, true); gable(gh, hx, hy + 2.7, hz, 4.4, 3.2, 1.1, T.hd[i], [0.6, 0.18, 0.13], [0.92, 0.9, 0.84]);
      exclPush(hx, hz, 5); CR.block(hx, hz, 4.2, 3, T.hd[i]);
      let k = 0; for (let s = sStart - 40; s < sStart + 50; s += 12) for (const side of [-1, 1]) { const [px, pz, ii] = onSide(s, side, 1.3); if (excluded(px, pz) && s > sStart - 8) continue; flagE(scen.get(px, pz), px, ktGround(px, pz), pz, T.hd[ii], 6, k++); }
      const e0 = [T.px[0] - T.tx[0] * 0.9, T.pz[0] - T.tz[0] * 0.9];   // the end of the road: concrete blocks across it
      for (let o = -T.bl[0]; o < T.br[0]; o += 2.05) { const bx = e0[0] + T.nx[0] * (o + 1), bz = e0[1] + T.nz[0] * (o + 1); box(scen.get(bx, bz), bx, T.hy[0] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[0], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
      { const [bx, bz, bi] = onSide(sStart + 16, 1, 1.6), by = ktGround(bx, bz), gb = scen.get(bx, bz), [v0, v1] = row(7);   // the run's banner beside the road after the line
        for (const o of [-3.3, 3.3]) box(gb, bx + T.tx[bi] * o, by - 0.2, bz + T.tz[bi] * o, 0.14, 3.0, 0.14, T.hd[bi], [0.3, 0.3, 0.32]);
        bannerQ(bx, by + 1.5, bz, -T.nx[bi], -T.nz[bi], 6.6, 0.82, v0, v1); exclPush(bx, bz, 4.5); }
    }

    /* ---- checkpoints: a gantry "CPn  altitude" in rust and white ---- */
    T.cpS.forEach((s, k) => arch(s, 2 + k, [0.86, 0.86, 0.88], [0.54, 0.22, 0.08]));

    /* ---- THE TOP (the pass): the car parks with the vans and 4x4s of the tourists and their people, the pass sign facing the cars, a larch hung with
       ribbons and a cairn beside it, the viewpoints at the edge of the canyon (OpenStreetMap) with people looking out ---- */
    {
      const RT = rng(7831), vanC = [[0.36, 0.42, 0.28], [0.86, 0.86, 0.84], [0.3, 0.42, 0.58], [0.62, 0.6, 0.5], [0.2, 0.36, 0.3]];
      for (const p of parks) { const hh = T.hd[p.i], c = Math.cos(hh), sn = Math.sin(hh), cols = Math.max(3, Math.floor(p.r * 1.1 / 3.4)), rows = p.r > 14 ? 3 : 2;   // rows of cars across the plot, 3.4 m apart
        for (let k = 0; k < cols * rows; k++) { const a = ((k % cols) - (cols - 1) / 2) * 3.4, b = (Math.floor(k / cols) - (rows - 1) / 2) * 7.5, x = p.x - sn * b + c * a, z = p.z + c * b + sn * a; if (ktNear(x, z).dd < 1.5 || ktRiv(x, z) > -6) continue;
          if (RT() < 0.45) ktUaz(scen.get(x, z), x, ktGround(x, z), z, hh + PI / 2 + (RT() - 0.5) * 0.2, vary(vanC[Math.floor(RT() * vanC.length)], RT, 0.15)); else carPk(x, z, hh + PI / 2 + (RT() - 0.5) * 0.2, vary(fans[Math.floor(RT() * fans.length)], RT, 0.25)); }
        for (let k = 0; k < 14; k++) { const x = p.x + (RT() - 0.5) * p.r * 1.8, z = p.z + (RT() - 0.5) * p.r * 1.8; if (ktNear(x, z).dd < 1) continue; person(x, z, RT() * TAU); } }
      // the pass sign: a blue board on two posts beside the road, facing the cars arriving from the plateau
      { const [sx, sz, si] = onSide(sTop - 70, 1, 2.6), sy = ktGround(sx, sz), gs = scen.get(sx, sz), W2 = 6.4, H2 = 1.0;
        for (const o of [-2.6, 2.6]) box(gs, sx + T.nx[si] * o, sy - 0.2, sz + T.nz[si] * o, 0.14, 2.6 + H2, 0.14, T.hd[si], [0.6, 0.61, 0.63]);
        const [v0, v1] = row(6); bannerQ(sx, sy + 2.0, sz, T.tx[si], T.tz[si], W2, H2, v0, v1); exclPush(sx, sz, 4); out.marks.passSign = [sx, sz]; }
      // the ribbon larch and the cairn on the other side, a little on
      { const [lx, lz, li] = onSide(sTop - 30, -1, 7), ly = ktGround(lx, lz), gl = scen.get(lx, lz);
        cyl(gl, lx, ly - 0.2, lz, 0.28, 12.2, 6, [0.42, 0.28, 0.2], null, 0.12);
        API.ROCK_SMOOTH = true; for (let k = 0; k < 6; k++) { const yy = ly + 5 + k * 1.3, rr = 3.2 - k * 0.45; starCone(gl, lx, yy, lz, rr, 2.2, 6, vary([0.33, 0.5, 0.22], RT, 0.12), [0.48, 0.64, 0.3], k * 0.7, 0.4); } API.ROCK_SMOOTH = false;
        const rib = ['#f6f6f2', '#2d6fd0', '#f2c63a', '#3a9a4c'].map(h => hex(parseInt(h.slice(1), 16)));
        for (let k = 0; k < 70; k++) { const a = RT() * TAU, r0 = 0.6 + RT() * 2.4, yy = ly + 1.6 + RT() * 4.2, x0 = lx + Math.cos(a) * r0, z0 = lz + Math.sin(a) * r0; box(gl, x0, yy - 0.9, z0, 0.12, 0.9 + RT() * 0.5, 0.03, a + PI / 2, rib[k % 4 === 0 ? 0 : Math.floor(RT() * 4)]); }   // the ribbons hanging off the low branches (white the most)
        const [cx, cz] = onSide(sTop - 22, -1, 4.2), cy = ktGround(cx, cz), gc = scen.get(cx, cz);   // the cairn: a pile of stones, smaller to the top
        API.ROCK_SMOOTH = true; for (let k = 0; k < 12; k++) { const lv = Math.floor(k / 4), a = RT() * TAU, d = (1.4 - lv * 0.45) * RT(); rock(gc, cx + Math.cos(a) * d, cy + 0.2 + lv * 0.42, cz + Math.sin(a) * d, 0.45 - lv * 0.08, 0.38, 0.42 - lv * 0.08, RT() * TAU, vary([0.6, 0.57, 0.52], RT, 0.12), RT, 0.25); } API.ROCK_SMOOTH = false;
        exclPush(lx, lz, 5); exclPush(cx, cz, 2.5); CR.avoid(cx, cz, 2); out.marks.ribbons = [lx, lz]; }
      // the viewpoints (OpenStreetMap) at the canyon's edge: people looking out over it
      for (const v of (def.pois && def.pois.viewpoint) || []) { const [vx, vz] = v.g[0]; if (ktDist(vx, vz) > 260) continue;
        for (let k = 0; k < 16; k++) { const x = vx + (RT() - 0.5) * 12, z = vz + (RT() - 0.5) * 12; if (ktNear(x, z).dd < 1) continue; const i = T.nearestIdx(x, z); person(x, z, Math.atan2(-(x - T.px[i]), z - T.pz[i]) + PI + (RT() - 0.5)); }
        if (!out.marks.viewpoint) out.marks.viewpoint = [vx, vz]; }
    }

    /* ---- THE FOOT: the camp's board at its gate, the fences of the camps (OpenStreetMap) ---- */
    {
      const gate = ((def.pois && def.pois.gate) || []).find(g0 => ktDist(g0.g[0][0], g0.g[0][1]) < 80);
      if (gate) { const [gx, gz] = gate.g[0], i = T.nearestIdx(gx, gz), side = (gx - T.px[i]) * T.nx[i] + (gz - T.pz[i]) * T.nz[i] > 0 ? 1 : -1, [px, pz, ii] = onSide(i * T.ds, side, 1.6), py = ktGround(px, pz), g = scen.get(px, pz), wd = [0.36, 0.25, 0.16];
        for (const u of [-1.3, 1.3]) box(g, px + T.tx[ii] * u, py - 0.2, pz + T.tz[ii] * u, 0.16, 3.2, 0.16, T.hd[ii], wd);
        bannerQ(px, py + 1.9, pz, -side * T.nx[ii], -side * T.nz[ii], 3.0, 1.5, 6 / 8, 7 / 8, 0, 0.25, ban2); exclPush(px, pz, 3); out.marks.camp = [px, pz]; }
      const wd = [0.5, 0.38, 0.25];
      for (const f of (def.pois && def.pois.fence) || []) { const L = f.g; if (L.length < 2 || ktDist(L[0][0], L[0][1]) > 200) continue;
        for (let k = 0; k + 1 < L.length; k++) { const [ax, az] = L[k], [bx, bz] = L[k + 1], len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / 3)), rot = Math.atan2(bz - az, bx - ax);
          for (let q = 0; q < n; q++) { const t0 = q / n, t1 = (q + 1) / n, x0 = ax + (bx - ax) * t0, z0 = az + (bz - az) * t0, x1 = ax + (bx - ax) * t1, z1 = az + (bz - az) * t1, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
            if (ktNear(mx, mz).dd < 0.8 || ktRiv(mx, mz) > -2) continue;
            const g = scen.get(mx, mz), y0 = ktGround(x0, z0), ym = ktGround(mx, mz);
            box(g, x0, y0 - 0.2, z0, 0.14, 1.5, 0.14, rot, wd); for (const hh of [0.55, 1.1]) box(g, mx, ym + hh, mz, len / n, 0.1, 0.06, rot, wd); } } }
    }

    /* ---- more of the pass and the valley (OpenStreetMap): the tourists' camps (tents round a fire, a yurt or two at a tourist base, their cars), the wooden
       privies, the footbridge over the Chulyshman (the path to the waterfalls: a plank deck on hangers between A-frame towers on the banks, its paid gate), and
       the white water of the river's rapids (grade 3-4 here) with boulders breaking it ---- */
    let nFoam = 0;
    {
      const RC = rng(7861), tentC = [[0.92, 0.42, 0.1], [0.18, 0.42, 0.78], [0.22, 0.58, 0.3], [0.94, 0.78, 0.16], [0.82, 0.16, 0.14], [0.5, 0.3, 0.62]], vanC2 = [[0.36, 0.42, 0.28], [0.86, 0.86, 0.84], [0.3, 0.42, 0.58]];
      const flat = (x, z) => ktSlope(x, z) < 0.3 && ktNear(x, z).dd > 4 && !excluded(x, z) && ktRiv(x, z) < -4;
      for (const [cx, cz, name] of def.camps || []) { if (ktDist(cx, cz) > 380) continue;
        const big = /^(База|Ажу)/.test(name);
        if (flat(cx, cz)) { const y = ktGround(cx, cz), g = scen.get(cx, cz);   // the fire: a ring of stones, logs across it, people round it
          API.ROCK_SMOOTH = true; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; rock(g, cx + Math.cos(a) * 0.75, y + 0.06, cz + Math.sin(a) * 0.75, 0.2, 0.14, 0.18, a, [0.5, 0.48, 0.45], RC, 0.2); } API.ROCK_SMOOTH = false;
          for (let k = 0; k < 3; k++) box(g, cx, y + 0.05 + k * 0.08, cz, 1.1, 0.12, 0.14, k * 1.05, [0.34, 0.24, 0.16]);
          exclPush(cx, cz, 1.6);
          for (let k = 0; k < 5; k++) { const a = RC() * TAU, d = 2 + RC() * 1.2; person(cx + Math.cos(a) * d, cz + Math.sin(a) * d, a + PI); } }
        let nt = 0; for (let k = 0; k < 50 && nt < (big ? 7 : 9); k++) { const a = RC() * TAU, d = 6 + RC() * 22, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (!flat(x, z)) continue;   // the tents (a yurt or two first at a base)
          const y = ktGround(x, z), g = scen.get(x, z), c = tentC[Math.floor(RC() * tentC.length)], yurt = big && nt < 2;
          if (yurt) ktYurt(g, x, y, z, Math.atan2(cz - z, cx - x), 3.2 + RC()); else cone(g, x, y - 0.05, z, 1.2 + RC() * 0.5, 1.05 + RC() * 0.3, 6, c, [c[0] * 1.15, c[1] * 1.15, c[2] * 1.15], RC() * TAU);
          exclPush(x, z, yurt ? 4.6 : 2.2); nt++; }
        for (let k = 0, nc = 0; k < 24 && nc < 3; k++) { const a = RC() * TAU, d = 16 + RC() * 14, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (!flat(x, z)) continue;   // their cars
          if (RC() < 0.5) ktUaz(scen.get(x, z), x, ktGround(x, z), z, RC() * TAU, vary(vanC2[Math.floor(RC() * vanC2.length)], RC, 0.12)); else carPk(x, z, RC() * TAU, vary(fans[Math.floor(RC() * fans.length)], RC, 0.15));
          exclPush(x, z, 3); nc++; }
        (out.marks.camps || (out.marks.camps = [])).push([cx, cz]); }
      // the wooden privies (toilets), where no hut of the camps' stands already: plank walls, a flat roof, the door towards the road
      for (const [x, z] of def.toilets || []) { if (ktDist(x, z) > 380 || blds.some(b => Math.hypot(b.x - x, b.z - z) < 6) || ktRiv(x, z) > -3 || ktNear(x, z).dd < 2) continue;
        const i = T.nearestIdx(x, z), rot = Math.atan2(T.pz[i] - z, T.px[i] - x), y = ktGround(x, z), g = scen.get(x, z), c = Math.cos(rot), sn = Math.sin(rot);
        box(g, x, y - 0.2, z, 1.2, 2.5, 1.3, rot, [0.56, 0.42, 0.28], null, true); box(g, x, y + 2.28, z, 1.5, 0.12, 1.6, rot, [0.38, 0.36, 0.34]);
        box(g, x + c * 0.62, y, z + sn * 0.62, 0.06, 1.9, 0.75, rot, [0.44, 0.32, 0.2]);
        exclPush(x, z, 2.2); CR.avoid(x, z, 1.6); (out.marks.privies || (out.marks.privies = [])).push([x, z]); }
      // the footbridge over the Chulyshman, its paid gate
      const FB = def.footbridge;
      if (FB) {
        const [ax, az, bx, bz] = FB.path, L = Math.hypot(bx - ax, bz - az), rot = Math.atan2(bz - az, bx - ax), nxp = -(bz - az) / L, nzp = (bx - ax) / L, Pt2 = (t) => [ax + (bx - ax) * t, az + (bz - az) * t];
        let t0 = -1, t1 = -1; for (let k = 0; k <= 120; k++) { const [x, z] = Pt2(k / 120); if (ktRiv(x, z) > -2) { if (t0 < 0) t0 = k / 120; t1 = k / 120; } }   // (where it is over the water)
        if (t0 >= 0) {
          const ta = Math.max(0, t0 - 0.04), tb = Math.min(1, t1 + 0.04), [x0, z0] = Pt2(ta), [x1, z1] = Pt2(tb), y0 = ktGround(x0, z0) + 1.2, y1 = ktGround(x1, z1) + 1.2, span = (tb - ta) * L, lv = Math.max(ktLevel(x0, z0), ktLevel(x1, z1));
          const deck = (t) => { const u = (t - ta) / (tb - ta); return Math.max(lerp(y0, y1, u) - 1.4 * 4 * u * (1 - u), lv + 2.4); };   // (sagging a little, well above the water)
          const g = scen.get((x0 + x1) / 2, (z0 + z1) / 2), wood = [0.5, 0.38, 0.26], steel = [0.3, 0.31, 0.33], n = Math.max(8, Math.round(span / 2));
          for (let k = 0; k < n; k++) { const tm2 = ta + (tb - ta) * (k + 0.5) / n, [x, z] = Pt2(tm2), y = deck(tm2);
            box(g, x, y - 0.1, z, span / n + 0.06, 0.1, 1.3, rot, wood);   // the planks
            for (const sd of [-0.68, 0.68]) { box(g, x + nxp * sd, y, z + nzp * sd, 0.05, 1.05, 0.05, rot, steel); box(g, x + nxp * sd, y + 1.02, z + nzp * sd, span / n + 0.04, 0.05, 0.05, rot, steel); } }   // hangers, the cable along the top
          for (const [t, y] of [[ta, y0 - 1.2], [tb, y1 - 1.2]]) { const [x, z] = Pt2(t), gt = scen.get(x, z);   // the towers: an A-frame of logs each side, a beam across
            for (const sd of [-1, 1]) box(gt, x + nxp * sd, y - 0.3, z + nzp * sd, 0.24, 4.6, 0.24, rot, [0.42, 0.3, 0.2]);
            box(gt, x, y + 4.1, z, 0.26, 0.26, 2.3, rot, [0.42, 0.3, 0.2]); exclPush(x, z, 3); }
          out.marks.footbridge = Pt2((ta + tb) / 2);
        }
        if (FB.gate && ktDist(FB.gate[0], FB.gate[1]) < 380) { const [gx, gz] = FB.gate, y = ktGround(gx, gz), g = scen.get(gx, gz), c = Math.cos(rot), sn = Math.sin(rot);   // the paid gate: a ticket booth and a bar across the path
          box(g, gx - nxp * 2.2, y - 0.2, gz - nzp * 2.2, 2.2, 2.6, 2.0, rot, [0.6, 0.46, 0.3], null, true); box(g, gx - nxp * 2.2, y + 2.4, gz - nzp * 2.2, 2.6, 0.14, 2.4, rot, [0.2, 0.36, 0.62]);
          box(g, gx - nxp * 2.2 + c * 1.12, y + 1.0, gz - nzp * 2.2 + sn * 1.12, 0.05, 0.8, 1.0, rot, [0.16, 0.2, 0.26]);   // its window
          box(g, gx + nxp * 0.6, y + 0.9, gz + nzp * 0.6, 0.1, 0.1, 3.4, rot, [0.9, 0.2, 0.15]); box(g, gx + nxp * 2.4, y - 0.2, gz + nzp * 2.4, 0.16, 1.2, 0.16, rot, [0.4, 0.4, 0.42]);
          for (let k = 0; k < 3; k++) person(gx + (RC() - 0.5) * 6, gz + (RC() - 0.5) * 6, rot + (RC() - 0.5));
          exclPush(gx, gz, 5); out.marks.paidGate = [gx, gz]; }
      }
      // the rapids: patches of white water drifting down the stream (in stretches: where the bed steepens), boulders breaking it here and there
      const fgb = new GB(true), RR = rng(7871), fx = KT.rU[0], fz = KT.rU[1];
      for (const r of P.riv) for (let z = r.z0; z <= r.z1; z += 10) for (let x = r.x0; x <= r.x1; x += 10) {
        const x1 = x + (RR() - 0.5) * 8, z1 = z + (RR() - 0.5) * 8, e = ktRiv(x1, z1); if (e < 2.5 || ktDist(x1, z1) > 420) continue;
        const zone = P.n5(x1 * 0.5 + 300, z1 * 0.5); if (zone < 0.5 || RR() > 0.55) continue;
        const L2 = 6 + RR() * 12 * zone, W2 = Math.min(2.4 + RR() * 4, e * 1.6), px2 = -fz, pz2 = fx, y = ktLevel(x1, z1) + 0.05, ang = (RR() - 0.5) * 0.4, ca = Math.cos(ang), sa = Math.sin(ang);
        const dx = fx * ca - fz * sa, dz = fz * ca + fx * sa;   // (along the flow, a little askew)
        const V = (a, b) => [x1 + dx * (b - 0.5) * L2 + px2 * (a - 0.5) * W2, y, z1 + dz * (b - 0.5) * L2 + pz2 * (a - 0.5) * W2], M = (a, b) => { const m = Math.min(1, a * 3, (1 - a) * 3) * Math.min(1, b * 3.5, (1 - b) * 3.5); return [m, m, m]; };
        for (let ia = 0; ia < 2; ia++) for (let ib = 0; ib < 4; ib++) { const a0 = ia / 2, a1 = (ia + 1) / 2, b0 = ib / 4, b1 = (ib + 1) / 4;
          fgb.quadUp(V(a0, b0), V(a1, b0), V(a1, b1), V(a0, b1), [M(a0, b0), M(a1, b0), M(a1, b1), M(a0, b1)], [[a0, b0 * L2], [a1, b0 * L2], [a1, b1 * L2], [a0, b1 * L2]]); }
        nFoam++;
        if (RR() < 0.3 * zone) { const sz = 0.8 + RR() * 1.1; API.ROCK_SMOOTH = true; rock(scen.get(x1, z1), x1 - dx * L2 * 0.4, y - 0.35, z1 - dz * L2 * 0.4, sz * 1.2, sz * 0.8, sz, RR() * TAU, vary([0.46, 0.45, 0.43], RR, 0.1), RR, 0.25); API.ROCK_SMOOTH = false; }
      }
      if (!fgb.empty) { const m = new THREE.Mesh(fgb.geometry(), ktFoamMat(tex)); m.matrixAutoUpdate = false; m.renderOrder = 2; m.name = 'rapids'; root.add(m); }
    }

    /* ---- FINISH (the valley floor): the yellow warning board, the flying finish (chequered gantry, timing hut), the red board, STOP 200 m on, the end of the road ---- */
    {
      const [, , , i] = arch(sFin, 1, [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]);
      const [hx, hz] = onSide(sFin + 2, 1, 2.2), hy = ktGround(hx, hz), gh = scen.get(hx, hz);
      box(gh, hx, hy, hz, 3.4, 2.6, 2.6, T.hd[i], [0.93, 0.92, 0.88], [0.3, 0.3, 0.32], true); box(gh, hx, hy + 1.2, hz, 3.45, 0.8, 2.65, T.hd[i], [0.16, 0.24, 0.36], null, true); exclPush(hx, hz, 5);
      for (const side of [-1, 1]) for (let s = sFin - 28; s < sFin + 12; s += 7) { const [px, pz, ii] = onSide(s, side, 1.4), py = ktGround(px, pz), gg = scen.get(px, pz);
        cyl(gg, px, py, pz, 0.06, 5, 5, [0.9, 0.9, 0.92]);
        for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) box(gg, px + T.tx[ii] * (0.36 + a * 0.55), py + 3.8 + b * 0.55, pz + T.tz[ii] * (0.36 + a * 0.55), 0.55, 0.55, 0.05, T.hd[ii], (a + b) % 2 ? [0.08, 0.08, 0.08] : [0.96, 0.96, 0.96], null, true); }
      const board = (s, side, col, txt) => { const [px, pz, ii] = onSide(s, side, 0.9), py = ktGround(px, pz), gg = scen.get(px, pz);   // a board on two posts beside the road, facing the arriving cars
        for (const o of [-0.7, 0.7]) box(gg, px + T.nx[ii] * o, py - 0.2, pz + T.nz[ii] * o, 0.1, 1.6, 0.1, T.hd[ii], [0.3, 0.3, 0.32]);
        box(gg, px, py + 1.3, pz, 0.06, 1.0, 1.8, T.hd[ii], col); if (txt) { for (let a = 0; a < 4; a++) for (let b = 0; b < 2; b++) if ((a + b) % 2) box(gg, px - T.tx[ii] * 0.04, py + 1.5 + b * 0.25, pz - T.tz[ii] * 0.04, 0.02, 0.25, 0.25, T.hd[ii], [0.08, 0.08, 0.08]); } exclPush(px, pz, 3); };
      board(sFin - 100, 1, [0.96, 0.8, 0.12], true); board(sFin + 1, -1, [0.86, 0.16, 0.12], true); board(Math.min(sFin + 200, T.len - 30), 1, [0.86, 0.16, 0.12], false);
      const eX = T.px[iE] + T.tx[iE] * 1.2, eZ = T.pz[iE] + T.tz[iE] * 1.2;   // the end of the road down the valley: concrete blocks across it
      for (let o = -T.bl[iE]; o <= T.br[iE]; o += 2.05) { const bx = eX + T.nx[iE] * o, bz = eZ + T.nz[iE] * o; box(scen.get(bx, bz), bx, T.hy[iE] - 0.1, bz, 0.7, 0.9, 1.95, T.hd[iE], [0.76, 0.75, 0.72], [0.84, 0.83, 0.8]); }
    }

    /* ---- the edges: a concrete parapet painted white with black stripes where the ground falls away and round the outside of the hairpins (not on the
       plateau or the valley floor), the rock of the cut on the uphill side; a signal post every ~50 m where there is neither (knockable where it fits) ---- */
    /* ---- the side roads' cones across their mouths, the gates at their ends (stubProps) ---- */
    out.stubStats = stubProps({ scen, out, root, gH: ktGround, loc: { closed: 'ПРОЕЗД ЗАКРЫТ', gate: 'ЗАКРЫТО' }, posts: 'none' });
    let nRail = 0;
    {
      const mkPosts = [], need = [new Uint8Array(N), new Uint8Array(N)];
      for (const c of T.corners) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 8); k <= Math.min(N - 1, c.i1 + 8); k++) need[sd][k] = 1; }
      for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const bar = side > 0 ? T.br[i] : T.bl[i];   // a drop: 2.4 m within 8 m of the barrier, or a fall-off farther out
        for (const d of [4, 8, 13, 19, 26]) { const o = side * (bar + d);
          if (ktGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
      const iS0 = T.idx(sStart + 40), iS1 = T.idx(sFin - 40), white = [0.9, 0.9, 0.87], black = [0.1, 0.1, 0.11], postC = [0.48, 0.49, 0.52];
      for (const side of [-1, 1]) {
        const nd = need[side > 0 ? 1 : 0], bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) if (i < iS0 || i > iS1 || T.hy[i] > -12 || ktLCf(T.px[i], T.pz[i], 3) > 0.5) nd[i] = 0;   // (the start, the plateau and the finish, the camps stay open)
        for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }   // close short gaps
        for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; }   // drop tiny bits
        stubRails(nd, side);   // (open across the side roads' mouths)
        nRail += nd.reduce((a, b) => a + b, 0);
        const Q = (i, y, e) => { const o = side * (bar[i] + 0.12 + (e || 0)); return [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o]; };
        for (let i = 0; i < N - 1; i++) {
          const g = scen.get(T.px[i], T.pz[i]);
          if (nd[i] && nd[i + 1]) {   // the parapet: 0.7 m of concrete, 0.4 m thick, a black stripe every third sample
            const col = Math.floor(i / 1.5) % 3 === 0 ? black : white, a = Q(i, -0.3, -0.05), b = Q(i + 1, -0.3, -0.05), c = Q(i + 1, 0.7, -0.05), d = Q(i, 0.7, -0.05), a2 = Q(i, -0.5, 0.35), b2 = Q(i + 1, -0.5, 0.35), c2 = Q(i + 1, 0.7, 0.35), d2 = Q(i, 0.7, 0.35), inn = Q(i, 0.2, 0.15);
            g.quadO(a, b, c, d, col, inn); g.quadO(a2, b2, c2, d2, [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8], inn); g.quadO(d, c, c2, d2, [col[0] * 1.04, col[1] * 1.04, col[2] * 1.04], inn);
          } else if (!nd[i] && i % 25 === 0 && i > 2 && i < iE - 2 && !SB.mouthV[side > 0 ? 1 : 0][i]) mkPosts.push([i, side]);
        }
      }
      const kp = katuProps(out, mkPosts, (i, side) => vp[side > 0 ? 1 : 0][i]).spots;   // knockable where they fit on the verge; the rest stay fixed beside the barrier line
      for (const sp of mkPosts) { if (kp.has(sp)) continue;
        const [i, side] = sp, o = side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.42), p = [T.px[i] + T.nx[i] * o, T.hy[i], T.pz[i] + T.nz[i] * o], g = scen.get(p[0], p[2]);
        box(g, p[0], p[1] - 0.2, p[2], 0.13, 1.2, 0.13, T.hd[i], [0.94, 0.94, 0.92], null, true); box(g, p[0], p[1] + 0.72, p[2], 0.14, 0.2, 0.14, T.hd[i], [0.1, 0.1, 0.1], null, true);
      }
    }

    /* ---- the road signs (Russian, on white): the steep descent (22 %) at the top and halfway down, a dangerous bend before every hairpin, on the right
       facing the cars coming down ---- */
    {
      const sign = (s, cell) => { const [px, pz, ii] = onSide(s, 1, 0.9); if (excluded(px, pz)) return;
        const py = ktGround(px, pz), g = scen.get(px, pz); box(g, px, py - 0.2, pz, 0.08, 2.4, 0.08, T.hd[ii], [0.6, 0.61, 0.63]);
        bannerQ(px, py + 1.5, pz, -T.tx[ii], -T.tz[ii], 0.95, 0.95, 7 / 8, 1, cell / 8, (cell + 1) / 8, ban2); exclPush(px, pz, 1.5); CR.avoid(px, pz, 0.8); };
      sign(sTop + 30, 0); sign(sTop + 90, 4); sign(sStart + (def.hairpins && def.hairpins[3] ? def.hairpins[3][0] : 2000) + 60, 0);
      (def.hairpins || []).forEach(([d, , turn]) => sign(sStart + d - 40, turn > 0 ? 2 : 1));
    }

    /* ---- spectators: the start and the finish, the checkpoints, the outsides of the hairpins where there is room, the camps at the foot ---- */
    {
      const hard = (x, z) => { for (let k = 0; k < excl.length; k++) { const e = excl[k]; if (crSoft.has(e)) continue; const dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };   // buildings, plots
      const M = { first: 2.4, gap: 1.05, below: 1.4, maxSlope: 0.6, excluded: hard, sit: 0.25, flag: 0.12, keepBar: 1.6 };
      const run = (sa, sb, side, o) => crowdRun(CR, Math.max(sa, 8), Math.min(sb, T.len - 8), side, Object.assign({}, M, o));
      for (const sd of [-1, 1]) { run(sStart - 50, sStart + 60, sd, { rows: 3, dens: 0.55, label: 'KT start' }); run(sFin - 70, sFin + 14, sd, { rows: 3, dens: 0.55, label: 'KT finish' }); }
      T.cpS.forEach((s0) => { const i = T.idx(s0), side = T.br[i] > T.bl[i] ? 1 : -1; run(s0 - 24, s0 + 20, side, { rows: 2, dens: 0.5, label: 'KT cp+' }); run(s0 - 20, s0 + 16, -side, { rows: 2, dens: 0.35, label: 'KT cp-' }); });
      (def.hairpins || []).forEach(([d, , turn], k) => { const sm = sStart + d; for (const sd of [-1, 1]) run(sm - 26, sm + 26, sd, { rows: 2, dens: sd === turn ? 0.45 : 0.3, flag: 0.15, below: 3, above: 8, maxSlope: 0.75, label: 'KT hairpin ' + (k + 1) }); });
      for (const sd of [-1, 1]) run(sTop - 60, sTop + 40, sd, { rows: 2, dens: 0.35, clump: 0.9, label: 'KT top' });
      for (const sd of [-1, 1]) run(sBot - 40, sBot + 110, sd, { rows: 2, dens: 0.3, clump: 0.9, label: 'KT camp' });
    }
    for (const e of CR.circ) exclPush(e.x, e.z, e.r);   // the trees keep clear of the crowds

    /* ---- the woods (instanced per 96 m chunk): larch and stone pine on the plateau and the shady slopes, birches at the edges, poplars and willows down by
       the river; shrubs dotted over the steppe slopes, junipers on the rocks; lone larches out on the steppe. Right up to the ditch, thinner farther out ---- */
    const tMatT = ktSway(ouCutMat(new THREE.MeshLambertMaterial({ vertexColors: true }), cut), WIND);   // (the crowns sway in the wind)
    const tk = [0, 1, 2, 3, 4, 5].map(k => new IChunks(ktTreeGeo(k), tMatT, 96));
    let nTrees = 0;
    {
      const G = P.G, Lt = KTC * KTT, maxT = Math.round(90000 * dens), RT = rng(7841), SP = 5.2 / Math.sqrt(dens);   // (the cap is only a safety net)
      grid: for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt - 0.01; zz += SP) for (let xx = xa; xx < xa + Lt - 0.01; xx += SP) {
          const x = xx + (RT() - 0.5) * SP * 0.9, z = zz + (RT() - 0.5) * SP * 0.9, r1 = RT(), r2 = RT(), r3 = RT(), r4 = RT();
          const hd = ktDist(x, z); if (hd > 250) continue;
          if (hd > LOD.radius(90) && ((Math.floor(xx / SP) + Math.floor(zz / SP)) & 1)) continue;   // farther out every other spot (bigger trees: a closed canopy from above)
          const c = ktLC(x, z), p = c === 1 ? 0.9 : c === 2 ? 0.34 : c === 0 ? 0.08 : c === 3 ? 0.05 : c === 4 ? 0.05 : 0;
          if (r1 > p) continue;
          if (ktRiv(x, z) > -3) continue;
          const nn = ktNear(x, z); if (nn.i >= 0 && nn.dd < 2.2) continue; if (nn.i >= 0 && nn.dd < 5 && r2 < 0.18) continue;
          if (excluded(x, z)) continue;
          const y = ktGround(x, z), A = y + base, low = sstep(800, 720, A), sl = ktSlope(x, z); if (sl > 1.3) continue;   // (none on the cliffs)
          let sp;
          if (c === 1) sp = r3 < 0.68 ? 0 : r3 < 0.92 ? 1 : 2;
          else if (c === 2) sp = r3 < 0.72 ? (sl > 0.7 && r4 < 0.5 ? 5 : 4) : r3 < 0.9 ? 0 : 2;
          else if (c === 4) sp = r3 < 0.7 ? 5 : 4;
          else sp = r3 < 0.5 ? 4 : r3 < 0.85 ? 0 : 2;
          if (low > 0.5 && (sp === 0 || sp === 2) && r4 < 0.6) sp = r4 < 0.35 ? 3 : 2;   // (down by the river: poplars, willows and birches)
          const far = hd > 90 ? 1.15 : 1;
          let hgt, wid, col;
          if (sp === 0) { hgt = 15 + r4 * 13; wid = hgt * (0.42 + r2 * 0.12); col = r2 < 0.3 ? [0.92, 0.98, 0.9] : r2 < 0.8 ? [1, 1, 1] : [1.08, 1.06, 0.92]; }
          else if (sp === 1) { hgt = 12 + r4 * 9; wid = hgt * (0.62 + r2 * 0.14); col = [0.9 + r2 * 0.2, 0.92 + r4 * 0.16, 0.9 + r3 * 0.2]; }
          else if (sp === 2) { hgt = 10 + r4 * 7; wid = hgt * (0.7 + r2 * 0.2); col = [1, 1, 1]; }
          else if (sp === 3) { hgt = 11 + r4 * 8; wid = hgt * (0.85 + r2 * 0.2); col = r2 < 0.5 ? [1, 1, 1] : [0.9, 1.05, 0.95]; }
          else if (sp === 4) { hgt = 1.0 + r4 * 1.3; wid = 1.8 + r2 * 2.2; col = r2 < 0.35 ? [1.12, 1.08, 0.82] : [1, 1, 1]; }   // (some caragana yellower)
          else { hgt = 0.6 + r4 * 0.5; wid = 2.2 + r2 * 2.4; col = [1, 1, 1]; }
          tk[sp].add(x, y - 0.15, z, r1 * 70, wid * far, hgt * far, col);
          if (++nTrees >= maxT) break grid;
        }
      }
    }
    for (const t of tk) t.addTo(root, true);

    /* ---- the rock: crags along the cliffs (OpenStreetMap) and where the slope is steep beside the road, boulders fallen onto the verges; clumps of the
       steppe's feather grass and its flowers on the shoulders ---- */
    {
      const RV = rng(7851), sch = [[0.58, 0.54, 0.48], [0.52, 0.49, 0.45], [0.64, 0.58, 0.5]];
      API.ROCK_SMOOTH = true;
      for (let s = 4; s < T.len - 4; s += 3.4) for (const side of [-1, 1]) {   // the verges: small stones
        const [x, z] = onSide(s, side, 1.2 + RV() * 6); if (ktNear(x, z).dd < 0.8 || excluded(x, z) || ktRiv(x, z) > -3) continue;
        const y = ktGround(x, z), g = scen.get(x, z), r = RV();
        if (r >= 0.3 && r < 0.42) { const sz = 0.25 + RV() * 0.4; rock(g, x, y + sz * 0.3, z, sz * 1.2, sz, sz, RV() * TAU, vary(sch[Math.floor(RV() * 3)], RV, 0.1), RV, 0.3); }
      }
      // the clumps of feather grass and the wild flowers on the steppe beside the road (the new look's: instanced, swaying in the wind, the clumps in the
      // colour of the ground under them, the seasons paint them as grass); not on the rock, in the woods, the camps or the crowds
      const tm = tuftWindMat(WIND), tu = new IChunks(tuftGeo(false), tm, 160), fl = new IChunks(tuftGeo(true), tm, 160);
      for (let s = 3; s < T.len - 3; s += 2.2) for (const side of [-1, 1]) {
        if (crH(s, side, 5) < 0.18) continue;   // (gaps)
        const i = T.idx(s), bar = side > 0 ? T.br[i] : T.bl[i], o = bar + 1.6 + Math.pow(crH(s, side, 6), 1.6) * 7, x = T.px[i] + T.nx[i] * side * o, z = T.pz[i] + T.nz[i] * side * o;
        const c = ktLC(x, z); if ((c !== 0 && c !== 2) || excluded(x, z) || ktRiv(x, z) > -3) continue;
        const sl = ktSlope(x, z); if (sl > 0.9) continue;
        const y = ktGround(x, z) - 0.02, u = crH(x, z, 7), gc = ktCol(x, z, y, 1 / Math.hypot(sl, 1), o - bar), m = API.pkGMean * (0.95 + 0.2 * crH(x, z, 8));
        tu.add(x, y, z, u * 26, 0.8 + 0.7 * crH(x, z, 9), 0.4 + 0.35 * crH(x, z, 10), [gc[0] * m, gc[1] * m, gc[2] * m]);
        if (u < 0.22) { const f = 0.85 + 0.15 * crH(x, z, 11); fl.add(x + 0.2, y, z - 0.1, u * 41, 0.8 + 0.3 * crH(x, z, 12), 0.5 + 0.2 * crH(x, z, 13), [f, f, f]); }
      }
      const vgr = new THREE.Group(); vgr.name = 'verge'; root.add(vgr);
      out.nTufts = tu.addTo(vgr, false) + fl.addTo(vgr, false); vgr.traverse(m => { if (m.isInstancedMesh && m.instanceColor) m.instanceColor.ground = true; });   // (the seasons paint the clumps as grass)
      for (let s = 10; s < T.len - 10; s += 7) for (const side of [-1, 1]) {   // boulders at the foot of the cuts
        if (RV() > 0.35) continue;
        const o = 1.6 + Math.pow(RV(), 1.5) * 36, [x, z] = onSide(s, side, o), sz = 0.5 + RV() * 1.3; if (ktNear(x, z).dd < sz + 0.6 || excluded(x, z) || ktRiv(x, z) > -3) continue;
        const sl = ktSlope(x, z), rk = ktLC(x, z) === 4; if (sl < 0.4 && !rk) continue;
        rock(scen.get(x, z), x, ktGround(x, z) + sz * 0.3, z, sz * 1.2, sz, sz, RV() * TAU, vary(sch[Math.floor(RV() * 3)], RV, 0.1), RV, 0.3);
      }
      API.ROCK_SMOOTH = false;
      const crag = (x, z, big) => { if (excluded(x, z) || ktNear(x, z).dd < 6 || ktRiv(x, z) > -4) return; const y = ktGround(x, z), g = scen.get(x, z), n = 2 + Math.floor(RV() * 3), b0 = vary(sch[Math.floor(RV() * 3)], RV, 0.08);
        for (let q = 0; q < n; q++) { const r0 = (big ? 2.4 : 1.8) + RV() * 3.2, qx = x + (RV() - 0.5) * 7, qz = z + (RV() - 0.5) * 7, qy = ktGround(qx, qz); if (ktNear(qx, qz).dd < r0 + 1) continue;
          rock(g, qx, qy + r0 * 0.4, qz, r0, r0 * (0.8 + RV() * 0.9), r0 * (0.7 + RV() * 0.4), RV() * TAU, vary(b0, RV, 0.08), RV, 0.35); } };
      for (let s = 16; s < T.len - 16; s += 16) for (const side of [-1, 1]) { if (RV() < 0.45) continue; const [x, z] = onSide(s, side, 8 + RV() * 60); if (ktSlope(x, z) >= 0.7) crag(x, z, false); }   // where the slope is steep
      for (const c of def.cliffs || []) for (let k = 0; k + 3 < c.length; k += 2) {   // along the cliffs: every ~14 m
        const ax = c[k], az = c[k + 1], bx = c[k + 2], bz = c[k + 3], L = Math.hypot(bx - ax, bz - az);
        for (let t = RV() * 14; t < L; t += 11 + RV() * 8) { const x = ax + (bx - ax) * t / L, z = az + (bz - az) * t / L; if (ktDist(x, z) < 330) crag(x, z, true); } }
    }

    /* ---- finish the meshes ---- */
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: ktAtlas(cpAlt), side: THREE.FrontSide }), true); if (bm) bm.castShadow = false;
    const bm2 = addM(ban2, new THREE.MeshLambertMaterial({ map: ktAtlas2(), side: THREE.FrontSide }), true); if (bm2) bm2.castShadow = false;
    crowdFinish(CR, root, out);
    out.stats = { trees: nTrees, tiles: P.G.on.reduce((a, b) => a + b, 0), farTiles: nFar, buildings: nBld, rails: +(nRail / (2 * N)).toFixed(3), foam: nFoam, sideRoads: out.stubStats.n };   // (read by the tests)
    return out;
  }

  Object.defineProperties(API, { KT: { get: () => KT, set: (v) => { KT = v; } } });
  World.ext.katu = (scene, tex, opts) => buildKatu(scene, tex, opts);
})();
