// Medvode as a race circuit (def.barrier): inside the barrier the run-off has its real surfaces (def.roSurf: asphalt, light paving, grass, gravel or
// bare earth), with no seam or step in it, and the surface drawn is the one the cars drive on. Looked at from above at points all over the free
// ground (the run-off on both sides of the road every 8 m, five points across each side; the rings' zones on a polar grid round their islands),
// the first surface a ray meets is the road's, the run-off's or a ring's (never the terrain or the grass skirt past the barrier), at the height
// the physics puts a car there (Track.yAt) within 10 cm. Where it is the run-off's (World.mvRunoffMat), the class the GPU shows there (the
// vertices' atlas uv, aRo, interpolated over the triangle hit with its barycentric weights, the atlas Track.roM read as the GPU's linear filter
// reads it: the largest of the four weights) drives as Track.surface does at that point (light paving as asphalt, gravel as makadam), but on a
// boundary (the two largest weights within 0.15 of the four's sum, in the atlas the GPU reads there or in the one the physics reads: round a ring
// the route's rows lie over the ring's disc), at most 1 % of the points; the run-off is neither all asphalt nor all grass. The run-off's program
// (its key 'mvRunoff') compiles and links, its atlas, layers and aRo in use; and the GPU's own picture of it (straight down, the run-off alone)
// is green where the cars drive on grass, dark grey where on asphalt, light grey where on paving, beige where on gravel. (r9) A ring's tall island (def.rings
// isl 'tall'), probed between its middle and its edge, is drawn with the run-off's grass (the ring's disc on in to the centre) and driven as the tall grass
// (Track.surface 9: grass to the rest of the game, here too).
//   node tests/browser/medvode-net.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Medvode: the run-off as it is, drawn as driven');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 0, camera: 'chase', weather: 'dry', season: 'summer', tod: 'day', mode: 'tt' }, { width: 640, height: 360 });
  await startTrack(page, 'medvode');
  const r = await page.evaluate(async () => {
    const g = window.__game, Tk = g.race.track, W = Render.world, SC = Render.scene, raf = () => new Promise(res => requestAnimationFrame(res));
    // the renderer (Render keeps it to itself): caught at the scene's next frame
    let RR = null; const own = Object.prototype.hasOwnProperty.call(SC, 'onBeforeRender'), ob = SC.onBeforeRender;
    SC.onBeforeRender = function (rr) { RR = rr; }; for (let k = 0; k < 60 && !RR; k++) await raf();
    if (own) SC.onBeforeRender = ob; else delete SC.onBeforeRender;
    g.pause(); Render.precompile();
    for (let k = 0; k < 3; k++) await raf();
    const gMat = W.ground && W.ground.children.length ? W.ground.children[0].material : null, RO = W.runoff, M = Tk.roM;
    const res = { n: 0, grass: [], step: [], other: 0, worst: 0, ro: 0, roRing: 0, roMats: !!(RO && M), mis: [], misN: 0, misEdge: 0, misK: {}, physOff: 0, road: 0, roadMis: [], roadMisN: 0, cls: [0, 0, 0, 0], mats: {}, prog: [], wire: {}, pix: [], nRoute: 0, nRing: 0, isl: { rings: 0, n: 0, tall: 0, ro: 0, grass: 0, mats: {} } };
    if (!RO || !M || !RR) return res;
    const gl = RR.getContext();

    // 1. the run-off's material: its program compiled and linked (no error in its logs), the atlas, the three layers and aRo active in it; the
    // shader text as the material makes it (the r128 chunks it hooks into all found, the sun's sheen kept off the grass); its uniforms bound to
    // the atlas (Core's own bytes, as they are: linear, clamped, no mipmaps, not flipped or premultiplied) and the layers; the meshes carry aRo
    const U = RR.properties.get(RO.mat).uniforms || {}, UR = RR.properties.get(RO.matR).uniforms || {}, tx = RO.tex;
    res.wire = { mask: !!U.uRoM && U.uRoM.value === tx && !!UR.uRoM && UR.uRoM.value === tx, grass: !!U.uRoG && U.uRoG.value === (gMat && gMat.map), paving: !!(U.uRoP && U.uRoP.value && U.uRoP.value.isTexture), gravel: !!(U.uRoK && U.uRoK.value && U.uRoK.value.isTexture),
      bytes: !!tx && tx.image.data === M.data && tx.image.width === M.W && tx.image.height === M.H && M.W <= 4096 && M.H <= 4096, filt: !!tx && tx.minFilter === THREE.LinearFilter && tx.magFilter === THREE.LinearFilter && !tx.generateMipmaps &&
        tx.wrapS === THREE.ClampToEdgeWrapping && tx.wrapT === THREE.ClampToEdgeWrapping && !tx.flipY && !tx.premultiplyAlpha && tx.format === THREE.RGBAFormat && tx.type === THREE.UnsignedByteType, up: !!tx && !!RR.properties.get(tx).__webglTexture, meshes: 0, aRo: true };
    W.root.traverse(o => { if (o.isMesh && (o.material === RO.mat || o.material === RO.matR)) { res.wire.meshes++; const a = o.geometry.attributes.aRo; if (!a || a.itemSize !== 3 || a.count !== o.geometry.attributes.position.count) res.wire.aRo = false; } });
    { const L = THREE.ShaderLib.lambert, sh = { uniforms: THREE.UniformsUtils.clone(L.uniforms), vertexShader: L.vertexShader, fragmentShader: L.fragmentShader }; RO.mat.onBeforeCompile(sh, RR);
      const v = sh.vertexShader, f = sh.fragmentShader, i0 = f.indexOf('vec3 roL0 = outgoingLight;'), i1 = f.indexOf('outgoingLight = mix( roL0, outgoingLight, roPaved );'), ie = f.indexOf('#include <envmap_fragment>');
      res.wire.text = /attribute vec3 aRo;/.test(v) && /vRo = aRo;/.test(v) && /texture2D\( uRoM, vRo\.xy \)/.test(f) && /varying highp vec3 vRo;/.test(f) && !/#include <color_fragment>/.test(f) && !/#include <map_fragment>/.test(f) && i0 >= 0 && ie > i0 && i1 > ie; }
    for (const p of RR.info.programs || []) { if (!/mvRunoff/.test(p.cacheKey || '')) continue; const P = p.program;
      const sh = (gl.getAttachedShaders(P) || []).map(s => ({ ok: gl.getShaderParameter(s, gl.COMPILE_STATUS), log: gl.getShaderInfoLog(s) || '' }));
      res.prog.push({ key: (p.cacheKey || '').split(',').pop(), link: gl.getProgramParameter(P, gl.LINK_STATUS), log: (gl.getProgramInfoLog(P) || '') + sh.map(s => s.log).join(''), shOk: sh.every(s => s.ok !== false),
        uni: ['uRoM', 'uRoG', 'uRoP', 'uRoK', 'map'].filter(u => !gl.getUniformLocation(P, u)), attr: gl.getAttribLocation(P, 'aRo'), diag: p.diagnostics ? p.diagnostics.runnable : true }); }

    // 2. the probes from above
    const meshes = []; W.root.traverse(o => { if (o.isMesh && !o.isInstancedMesh && o.visible) meshes.push(o); });
    const rc = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), from = new THREE.Vector3(), Q = {}, A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), bc = new THREE.Vector3();
    const skipS = (Tk.def.overpass || []).map(o => [Tk.startS + o.d[0] - 4, Tk.startS + o.d[1] + 4]).concat((Tk.def.bridges || []).map(([a, b]) => [Tk.startS + a - 6, Tk.startS + b + 6]));
    const CH = [3, 0, 1, 2], SF = [0, 0, 2, 5], NM = ['asphalt', 'paving', 'grass', 'gravel'], lerp = (a, b, t) => a + (b - a) * t;
    const PV = U.uRoP.value, KM = U.uRoK.value, AM = W.asphaltMat && W.asphaltMat.map;
    const mName = (m) => m === RO.mat || m === RO.matR ? 'runoff' : m === W.asphaltMat ? 'road' : m === gMat ? 'terrain' : !m.map ? m.type : m.userData && m.userData.wear ? 'wear' : m.map === AM || m.map === RO.mat.map ? 'asphalt' : m.map === PV ? 'setts' : m.map === KM ? 'makadam' : m.type + '+map';
    const EXP = { road: [0, 7], wear: [0, 7], asphalt: [0, 7], makadam: [5], setts: [0, 7] };   // (drawn otherwise: the road's asphalt and its worn patches, the streets', the castle road's makadam, the rings' setts: what they drive as)
    const weights = (fx, fy) => {   // (the four classes' weights at the atlas's texel coordinates (texel centres at whole numbers), as the GPU's linear filter blends them)
      const Wd = M.W, D = M.data, a = Math.min(Wd - 2, Math.max(0, Math.floor(fx))), b = Math.min(M.H - 2, Math.max(0, Math.floor(fy))), u = fx - a, v = fy - b, k = (b * Wd + a) * 4, k2 = k + Wd * 4;
      return CH.map(c => (D[k + c] * (1 - u) + D[k + 4 + c] * u) * (1 - v) + (D[k2 + c] * (1 - u) + D[k2 + 4 + c] * u) * v); };
    const top = (w) => { let b = 0; for (let j = 1; j < 4; j++) if (w[j] > w[b]) b = j; const s = w.reduce((p, q) => p + q, 0) || 1, o = w.filter((_, j) => j !== b).reduce((p, q) => Math.max(p, q), 0); return { c: b, m: (w[b] - o) / s, t: w[b] / s }; };
    const physTop = (q) => {   // (the weights Track.roClass reads at q: in a ring's zone the ring's region at (x, z), else the route's between the normals, Track.hs)
      for (const R of M.rings) { const dx = q.x - R.x, dz = q.z - R.z; if (dx * dx + dz * dz < R.zr * R.zr) return top(weights(R.fx0 + dx / M.cell, R.fy0 + dz / M.cell)); }
      const o = {}, s = Tk.hs(q, o); let f = s / Tk.ds, d = q.d;
      if (o.a >= 0) { const a = o.a, u = o.u, nx = lerp(Tk.nx[a], Tk.nx[a + 1], u), nz = lerp(Tk.nz[a], Tk.nz[a + 1], u); f = a + u; d = ((q.x - lerp(Tk.px[a], Tk.px[a + 1], u)) * nx + (q.z - lerp(Tk.pz[a], Tk.pz[a + 1], u)) * nz) / (nx * nx + nz * nz); }
      const fc = Math.min(Tk.N - 1, Math.max(0, f)), k = Math.min(M.nS - 1, Math.floor(fc / M.strip));
      return top(weights(M.mL + (fc - k * M.strip) * M.per, (M.rs || 64) * k + 1 + Math.min(M.nd - 1, Math.max(0, d / M.cell + (M.nd - 1) / 2)))); };   // (M.rs: a strip's rows, nd + 2)
    const probe = (x, z, hint, where, ring, isl) => {   // (isl: a point on a ring's tall island)
      const q = Tk.query(x, z, hint, Q), y = Tk.yAt(q); from.set(x, y + 30, z); rc.set(from, down); rc.far = 60;
      const hits = rc.intersectObjects(meshes, false); let h = null;
      for (let k = 0; k < hits.length; k++) { const c = hits[k], n = c.face && c.face.normal; if (n && Math.abs(n.y) < 0.7) { h = null; break; }   // (a wall, a board, a post in the way: not the ground; skipped)
        const mt = c.object.material, nx = hits[k + 1]; if (!mt.map && mt.vertexColors && nx && c.point.y - nx.point.y < 0.1) continue;   // (p10: paint, a kerb's top lying on the ground: the surface under it)
        h = c; break; }
      if (!h) { res.other++; return; }
      const m0 = h.object.material, mk = mName(m0), dy = h.point.y - y;
      if (isl) { res.isl.n++; res.isl.mats[mk] = (res.isl.mats[mk] || 0) + 1; }
      if (mk === 'terrain') { res.n++; if (ring) res.nRing++; else res.nRoute++; if (res.grass.length < 12) res.grass.push(`${where} (${x.toFixed(1)}, ${z.toFixed(1)})`); res.mats.terrain = (res.mats.terrain || 0) + 1; return; }
      if (dy > 1.2 || (!m0.map && m0.vertexColors)) { res.other++; return; }   // (a gantry's beam, a roof over it; a kerb, an island, a sidewalk's raised edge (vertex-coloured, no texture): not the driving surface)
      res.n++; if (ring) res.nRing++; else res.nRoute++;
      res.worst = Math.max(res.worst, Math.abs(dy)); res.mats[mk] = (res.mats[mk] || 0) + 1;
      if (Math.abs(dy) > 0.1 && res.step.length < 12) { const o = h.object, m = o.material; res.step.push(`${where} (${x.toFixed(1)}, ${z.toFixed(1)}) ${dy > 0 ? '+' : ''}${dy.toFixed(2)} m [${mk} v${o.geometry.attributes.position.count}${m.polygonOffset ? ' po' + m.polygonOffsetFactor : ''}]`); }
      const qh = Tk.query(h.point.x, h.point.z, ring ? Tk.nearestIdx(h.point.x, h.point.z) : hint, {}), sf0 = Tk.surface(qh), sf = sf0 === 9 ? 2 : sf0; if (isl && sf0 === 9) res.isl.tall++;   // (sf0 9: a tall island's grass, grass to the game (Car.ws); driven: Track.surface at the point hit, the query from the probe's own sample (a car's hint follows it there); round a ring from the nearest sample)
      if (mk !== 'runoff') { if (EXP[mk]) { res.road++; if (!EXP[mk].includes(sf)) { res.roadMisN++; if (res.roadMis.length < 8) res.roadMis.push(`${where} (${h.point.x.toFixed(1)}, ${h.point.z.toFixed(1)}) drawn ${mk}, driven ${sf}`); } } return; }
      // drawn: the triangle's aRo at the point hit (its barycentric weights), the atlas there as the GPU's filter reads it
      const G = h.object.geometry, P = G.attributes.position, AR = G.attributes.aRo, f = h.face, mw = h.object.matrixWorld;
      A.fromBufferAttribute(P, f.a).applyMatrix4(mw); B.fromBufferAttribute(P, f.b).applyMatrix4(mw); C.fromBufferAttribute(P, f.c).applyMatrix4(mw); THREE.Triangle.getBarycoord(h.point, A, B, C, bc);
      const ar = AR.array, is = AR.itemSize, uv = [0, 1].map(j => ar[f.a * is + j] * bc.x + ar[f.b * is + j] * bc.y + ar[f.c * is + j] * bc.z);
      const dr = top(weights(uv[0] * M.W - 0.5, uv[1] * M.H - 0.5)), onRoad = Math.abs(qh.d) <= Tk.wAt(qh.a) + (Tk.walk ? Tk.walk[qh.d > 0 ? 1 : 0][qh.a] : 0) + 0.05 || qh.deep, pt = onRoad ? null : physTop(qh);
      res.ro++; if (ring) res.roRing++; res.cls[dr.c]++; if (isl) { res.isl.ro++; if (dr.c === 2) res.isl.grass++; }
      if (pt && SF[pt.c] !== sf) res.physOff++;   // (the weights read here not what Track.surface drove on: this test's mirror of Track.roClass is off)
      if (SF[dr.c] !== sf) { if (dr.m < 0.15 || (pt && pt.m < 0.15)) res.misEdge++;
        else { const kd = onRoad ? 'the road\'s edge' : Tk.inZone(h.point.x, h.point.z) ? 'a ring\'s zone' : 'the route'; res.misN++; res.misK[kd] = (res.misK[kd] || 0) + 1;
          if (res.mis.length < 10) res.mis.push(`${where} (${h.point.x.toFixed(1)}, ${h.point.z.toFixed(1)}) drawn ${NM[dr.c]} (${dr.m.toFixed(2)}), driven ${sf}${pt ? ' (' + pt.m.toFixed(2) + ')' : ' (the road)'}`); } }
      else if (dr.t > 0.8) res.pix.push([h.point.x, h.point.y, h.point.z, dr.c]);   // (deep inside one kind: for the GPU's picture below)
    };
    for (let i = 4; i < Tk.N - 4; i += 4) { const s = i * Tk.ds; if (s < Tk.startS - 150 || skipS.some(([a, b]) => s > a && s < b)) continue;
      for (const sd of [-1, 1]) { const e = Tk.wAt(i) + (Tk.walk ? Tk.walk[sd > 0 ? 1 : 0][i] : 0), b = sd > 0 ? Tk.br[i] : Tk.bl[i], o0 = e + 0.3, o1 = b - 0.5; if (o1 < o0) continue;
        const n = o1 - o0 < 1 ? 1 : 5;
        for (let k = 0; k < n; k++) { const o = n > 1 ? o0 + (o1 - o0) * k / (n - 1) : (o0 + o1) / 2, x = Tk.px[i] + Tk.nx[i] * sd * o, z = Tk.pz[i] + Tk.nz[i] * sd * o;
          if (Tk.rings.some(R => Math.hypot(x - R.x, z - R.z) < R.ri + 2.2)) continue; probe(x, z, i, `d ${Math.round(s - Tk.startS)} ${sd > 0 ? 'right' : 'left'} ${o.toFixed(1)} m`, false); } } }
    for (const R of Tk.rings) { if (!(R.zr > 0)) continue; const r0 = Math.max(R.ri + 2.2, R.r - R.hw + 0.4), r1 = R.zr - 0.5, nr = Math.max(2, Math.round((r1 - r0) / 1.2) + 1);
      for (let k = 0; k < 120; k++) { const a = k / 120 * Math.PI * 2; if ((R.shut || []).some(S => Math.abs(((a - Math.atan2(S.uz, S.ux) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) < 0.12)) continue;
        for (let j = 0; j < nr; j++) { const rr = r0 + (r1 - r0) * j / (nr - 1), x = R.x + Math.cos(a) * rr, z = R.z + Math.sin(a) * rr; probe(x, z, Tk.nearestIdx(x, z), `ring at ${Math.round(R.x)},${Math.round(R.z)} r ${rr.toFixed(1)}`, true); } } }
    for (const R of Tk.rings) { if (!R.tall) continue; res.isl.rings++; const r0 = R.mid + 0.4, r1 = R.ie - 0.25; if (r1 <= r0) continue; const nr = Math.max(2, Math.round(r1 - r0) + 1);   // (the tall islands: between the middle and the edge)
      for (let k = 0; k < 72; k++) { const a = k / 72 * Math.PI * 2;
        for (let j = 0; j < nr; j++) { const rr = r0 + (r1 - r0) * j / (nr - 1), dx = Math.cos(a) * rr, dz = Math.sin(a) * rr, x = R.x + dx, z = R.z + dz;
          if ((R.shut || []).some(S => dx * S.ux + dz * S.uz > 0 && Math.abs(-dx * S.uz + dz * S.ux) < 0.9)) continue;   // (a wall's tyres across it)
          probe(x, z, Tk.nearestIdx(x, z), `island at ${Math.round(R.x)},${Math.round(R.z)} r ${rr.toFixed(1)}`, true, true); } } }

    // 3. the GPU's own picture: the run-off alone (everything else hidden, no fog), straight down from above (an orthographic camera, north up),
    // 48 m square tiles along the road and over the rings; the pixels (3 x 3) under the probes deep inside one kind
    { const S = 256, rt = new THREE.WebGLRenderTarget(S, S), cam = new THREE.OrthographicCamera(-24, 24, 24, -24, 1, 300), buf = new Uint8Array(S * S * 4), hid = [], fog = SC.fog, prevRT = RR.getRenderTarget(), v = new THREE.Vector3(), cc = new THREE.Color(), ca = RR.getClearAlpha();
      RR.getClearColor(cc);
      SC.traverse(o => { if ((o.isMesh || o.isPoints || o.isLine || o.isSprite) && o.visible && o.material !== RO.mat && o.material !== RO.matR) { hid.push(o); o.visible = false; } });
      SC.fog = null;
      const todo = res.pix, done = new Uint8Array(todo.length), out = [], tiles = [];
      for (let i = 0; i < Tk.N; i += 24) tiles.push([Tk.px[i], Tk.pz[i], Tk.hy[i]]); for (const R of Tk.rings) if (R.zr > 0) tiles.push([R.x, R.z, Tk.yAt(Tk.query(R.x + R.r, R.z, Tk.nearestIdx(R.x + R.r, R.z), {}))]);
      try {
        for (const [cx, cz, cy] of tiles) { const mine = []; todo.forEach((p, k) => { if (!done[k] && Math.abs(p[0] - cx) < 22 && Math.abs(p[2] - cz) < 22) { done[k] = 1; mine.push(p); } }); if (!mine.length) continue;
          cam.position.set(cx, cy + 80, cz); cam.up.set(0, 0, -1); cam.lookAt(cx, cy, cz); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
          RR.setRenderTarget(rt); RR.setClearColor(0x000000, 1); RR.clear(); RR.render(SC, cam); RR.readRenderTargetPixels(rt, 0, 0, S, S, buf);
          for (const p of mine) { v.set(p[0], p[1], p[2]).project(cam); const px = Math.round((v.x + 1) / 2 * S - 0.5), py = Math.round((v.y + 1) / 2 * S - 0.5); if (px < 1 || py < 1 || px > S - 2 || py > S - 2) continue;
            const c = [0, 0, 0]; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const k = ((py + dy) * S + px + dx) * 4; c[0] += buf[k]; c[1] += buf[k + 1]; c[2] += buf[k + 2]; }
            out.push([p[3], c[0] / 9, c[1] / 9, c[2] / 9]); } }
      } finally { RR.setRenderTarget(prevRT); RR.setClearColor(cc, ca); SC.fog = fog; for (const o of hid) o.visible = true; rt.dispose(); }
      res.pix = out; res.tiles = tiles.length; }
    return res;
  });
  const sh = r.cls.map(v => v / Math.max(1, r.ro)), pct = (v) => (100 * v).toFixed(1) + ' %';
  // the GPU's picture: per kind the median colour; grass told from the paved kinds by its green (G over the mean of R and B, relative to the brightness);
  // the paving lighter than the asphalt (light grey concrete), the gravel lighter than the asphalt too and warmer (R over B) than both
  const gr = (p) => (p[2] - (p[1] + p[3]) / 2) / Math.max(8, (p[1] + p[2] + p[3]) / 3), lum = (p) => (p[1] + p[2] + p[3]) / 3, warm = (p) => p[1] - p[3], med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
  const byC = [0, 1, 2, 3].map(c => r.pix.filter(p => p[0] === c)), mc = byC.map(a => [1, 2, 3].map(j => med(a.map(p => p[j])))), mg = byC.map(a => med(a.map(gr))), ml = byC.map(a => med(a.map(lum))), mw = byC.map(a => med(a.map(warm)));
  const paved = byC[0].concat(byC[1]), thr = (mg[2] + Math.max(mg[0], mg[1])) / 2, okG = byC[2].filter(p => gr(p) > thr).length / Math.max(1, byC[2].length), okP = paved.filter(p => gr(p) < thr).length / Math.max(1, paved.length);
  const near = (p) => { let b = -1, bd = 1e9; mc.forEach((m, c) => { const d = (p[1] - m[0]) ** 2 + (p[2] - m[1]) ** 2 + (p[3] - m[2]) ** 2; if (d < bd) { bd = d; b = c; } }); return b; }, acc = byC.map((a, c) => a.filter(p => near(p) === c).length / Math.max(1, a.length));
  const pr = r.prog, pd = pr.map(p => `${p.key}: link ${p.link}, inactive [${p.uni.join(',')}], aRo @${p.attr}${p.log.trim() ? ', log ' + p.log.trim().slice(0, 120) : ''}`).join('; ');
  T.check('the free ground probed from above: a surface under every point (a wall or a board in the way only now and then)', r.n > 9000 && r.nRing > 2500 && r.other < r.n * 0.05, `${r.n} points (${r.nRoute} along the road every 8 m, ${r.nRing} round the rings), ${r.other} with something upright first; ${JSON.stringify(r.mats)}`);
  T.check('no terrain inside the barrier: the first surface is the road\'s, the run-off\'s or a ring\'s, never the terrain or the grass skirt past the barrier', r.grass.length === 0, r.grass.length ? r.grass.join('; ') : `${r.n} points`);
  T.check('no step: the surface drawn is the one the cars drive on (Track.yAt) within 10 cm', r.step.length === 0, r.step.length ? r.step.join('; ') : `worst ${r.worst.toFixed(3)} m`);
  T.check('the run-off has its real surfaces (def.roSurf: World.runoff, Track.roM) and most of the free ground is drawn with them, round the rings too', r.roMats && r.ro > r.n * 0.6 && r.roRing > r.nRing * 0.6, `${r.ro} of ${r.n} points on the run-off's material (${r.roRing} of ${r.nRing} round the rings)`);
  T.check('the run-off\'s program (\'mvRunoff\', the rows\' and the discs\' one) compiles and links, its atlas, layers and aRo in use; the material\'s shader text hooks into r128 as meant; its uniforms on the atlas (Core\'s own bytes: linear, clamped, no mipmaps) and the layers; every run-off mesh carries aRo',
    pr.length >= 1 && pr.every(p => p.link && p.shOk && p.diag !== false && !p.uni.length && p.attr >= 0 && !/error/i.test(p.log)) && Object.values(r.wire).every(v => v === true || v > 0) && r.wire.meshes >= 20,
    `${pd || 'no program'}; ${JSON.stringify(r.wire)}`);
  T.check('drawn = driven: where the run-off is hit, the class the GPU shows there (aRo at the point, the atlas\'s linear filter) drives as Track.surface does but on a boundary (the two largest weights within 0.15), off one at most 1 % of the points; the road\'s asphalt (its worn patches too), the streets\', the makadam and the setts as they look',
    r.ro > 0 && r.misN <= r.ro * 0.01 && r.roadMisN <= r.road * 0.01 && r.physOff === 0,
    `${r.misN} off a boundary (${JSON.stringify(r.misK)}), ${r.misEdge} on one, of ${r.ro}${r.mis.length ? ': ' + r.mis.join('; ') : ''}; elsewhere ${r.roadMisN} of ${r.road}${r.roadMis.length ? ': ' + r.roadMis.join('; ') : ''}${r.physOff ? `; ${r.physOff} where the weights read are not Track.surface's` : ''}`);
  T.check('a ring\'s tall island (def.rings isl \'tall\'): between its middle and its edge drawn with the run-off\'s grass (the ring\'s disc on in to the centre) and driven as the tall grass (Track.surface 9, grass to the rest of the game)',
    !r.isl.rings || (r.isl.n > 100 && r.isl.tall >= r.isl.n * 0.98 && r.isl.ro >= r.isl.n * 0.95 && r.isl.grass >= r.isl.ro * 0.97),
    r.isl.rings ? `${r.isl.rings} tall islands: ${r.isl.n} points, ${r.isl.tall} driven as the tall grass, ${r.isl.ro} on the run-off's material, ${r.isl.grass} of them drawn grass; ${JSON.stringify(r.isl.mats)}` : 'no tall island in this track file');
  T.check('the run-off is as it is: neither all asphalt nor all grass (asphalt and grass each at least 10 % of the points, paving and gravel there too)', sh[0] >= 0.1 && sh[2] >= 0.1 && r.cls[1] > 0 && r.cls[3] > 0, `asphalt ${pct(sh[0])}, paving ${pct(sh[1])}, grass ${pct(sh[2])}, gravel ${pct(sh[3])} of ${r.ro}`);
  T.check('the GPU\'s own picture of the run-off (straight down, the run-off alone, deep inside each kind): green where the cars drive on grass, grey where on asphalt or paving (95 % either side of the line between); the paving light grey, the asphalt dark, the gravel warm; each kind\'s pixels nearest its own median colour',
    byC[2].length > 200 && paved.length > 200 && byC[1].length > 20 && byC[3].length > 20 && mg[2] - Math.max(mg[0], mg[1], mg[3]) > 0.1 && okG >= 0.95 && okP >= 0.95 &&
    ml[1] > ml[0] + 25 && Math.abs(mw[1]) < 15 && ml[3] > ml[0] + 30 && mw[3] > mw[0] + 15 && mw[3] > mw[1] + 8 && acc[0] >= 0.9 && acc[2] >= 0.9 && acc[1] >= 0.7 && acc[3] >= 0.7,
    `grass ${byC[2].length} px, green ${mg[2].toFixed(2)} (${pct(okG)} over ${thr.toFixed(2)}); asphalt ${byC[0].length} px ${mg[0].toFixed(2)}, paving ${byC[1].length} px ${mg[1].toFixed(2)} (${pct(okP)} under), gravel ${byC[3].length} px ${mg[3].toFixed(2)}; ` +
    `median RGB ${mc.map((a, c) => ['asphalt', 'paving', 'grass', 'gravel'][c] + ' ' + a.map(v => Math.round(v)).join('/')).join(', ')}; nearest its own median ${acc.map(pct).join(' / ')}; ${r.tiles} tiles`);
  T.check('no page errors (the run-off\'s program compiles)', errors.length === 0, errors.slice(0, 3).join(' | '));
} finally { await browser.close(); await srv.close(); }
T.done();
