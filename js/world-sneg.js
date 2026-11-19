/* =========================================================================
   WORLD — Sneg (the snow the chase camera sees in winter) on real roads where, by the sources, it snows in winter: Koli, Finska
   (the crown snow on the spruce of the hill), Llogara, Albanija (the pass over the Ionian Sea, shut by the snow for days in winter) and
   Biķernieki, Latvija (the circuit in the pines of Riga's forest park). Only the picture: the driving does not change (CLAUDE.md, »Fizika vožnje
   se ne spreminja«). Hooks (no change to js/world.js, js/render.js or the roads' own files): World.build and the scene's onBeforeRender.
   On the first winter frame of such a road its materials get a little more to their shaders: snow where a surface faces up (the
   terrain, roofs, rocks: by its slope, patchy), on the trees' crowns in tiers (not on the trunks: only where the colour is green), and
   the plough's narrow banks at the edge of the cleared road (one mesh, its own colours). In summer the same programs draw as before
   (the strength 0).
   The sources: docs/proge/<id>.md, »Sneg pozimi« (Koli: »Tykky«).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || typeof THREE === 'undefined' || !World.build) return;
  // per road: g the terrain, t the trees, x the rest (roofs, rocks, walls): [strength, from n.y, to n.y, the noise's scale per m];
  // gb/tb/xb (else CB): [the noise on the threshold, the tiers' amplitude, their frequency per m, only on the green];
  // bank: the plough's banks at the road's edge, [lowest, highest] in m
  const LOOK = {
    koli: { t: [0.95, -0.15, 0.35, 0.9], tb: [0.3, 0.1, 3.0, 1] },
    llogara: { g: [0.7, 0.55, 0.85, 0.25], t: [0.75, 0.02, 0.5, 0.9], x: [0.7, 0.55, 0.85, 0.6], bank: [0.3, 0.6] },   // (the snow of a few days)
    bikernieki: { g: [0.85, 0.5, 0.8, 0.3], t: [0.8, -0.02, 0.48, 0.9], x: [0.75, 0.55, 0.85, 0.6] },   // (a circuit: no plough's banks)
  };
  const CB = { g: [0.35, 0, 0, 0], t: [0.3, 0.16, 4.0, 1], x: [0.3, 0, 0, 0] }, CATS = ['g', 't', 'x'];
  const K = {}, B = {}, SC = { value: new THREE.Color(0.9, 0.93, 0.97) };   // (shared by every patched material of the category: set each frame)
  for (const c of CATS) { K[c] = { value: new THREE.Vector4(0, 0, 1, 1) }; B[c] = { value: new THREE.Vector4() }; }
  const VDECL = 'varying vec3 vSnP;\nvarying vec3 vSnN;\n';
  const VBODY = '{ vec4 snP = vec4( transformed, 1.0 );\n#ifdef USE_INSTANCING\n  snP = instanceMatrix * snP;\n#endif\n' +
    '  vSnP = ( modelMatrix * snP ).xyz; vSnN = ( vec4( transformedNormal, 0.0 ) * viewMatrix ).xyz; }\n';   // (the world's position and normal)
  const FDECL = 'uniform vec4 uSnK;\nuniform vec4 uSnB;\nuniform vec3 uSnC;\nvarying vec3 vSnP;\nvarying vec3 vSnN;\n' +
    'float snH( vec2 p ) { vec3 q = fract( vec3( p.xyx ) * 0.1031 ); q += dot( q, q.yzx + 33.33 ); return fract( ( q.x + q.y ) * q.z ); }\n' +
    'float snV( vec2 p ) { vec2 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f );\n' +
    '  return mix( mix( snH( i ), snH( i + vec2( 1.0, 0.0 ) ), f.x ), mix( snH( i + vec2( 0.0, 1.0 ) ), snH( i + vec2( 1.0, 1.0 ) ), f.x ), f.y ); }\n';
  const FBODY = 'if ( uSnK.x > 0.0 ) { vec3 snN = normalize( vSnN ); vec2 snQ = ( vSnP.xz + vSnP.y * vec2( 0.37, -0.61 ) ) * uSnK.w;\n' +
    '  float snZ = snV( snQ ) * 0.62 + snV( snQ * 2.9 + 17.3 ) * 0.38;\n' +
    '  float snK = uSnK.x * smoothstep( uSnK.y, uSnK.z, snN.y + ( snZ - 0.5 ) * uSnB.x + uSnB.y * sin( vSnP.y * uSnB.z + snZ * 4.0 ) );\n' +
    '  snK *= mix( 1.0, smoothstep( -0.03, 0.05, diffuseColor.g - diffuseColor.r ), uSnB.w );\n' +
    '  diffuseColor.rgb = mix( diffuseColor.rgb, uSnC * ( 0.94 + 0.08 * snZ ), snK ); }\n';
  const AT = ['#include <specularmap_fragment>', '#include <roughnessmap_fragment>', '#include <emissivemap_fragment>'];   // (after the map and the colours, before the light)
  function patch(m, cat) {   // on top of what the material's shader has already (the cut-out of the trees between the camera and the car, ...)
    m.userData.sneg = cat;
    const prev = m.onBeforeCompile, key = 'sneg|' + m.customProgramCacheKey();
    m.onBeforeCompile = (sh, r) => {
      prev.call(m, sh, r);
      const at = AT.find(s => sh.fragmentShader.includes(s)), vs = sh.vertexShader, end = vs.lastIndexOf('}');
      if (!at || end < 0 || !vs.includes('#include <defaultnormal_vertex>')) return;
      sh.uniforms.uSnK = K[cat]; sh.uniforms.uSnB = B[cat]; sh.uniforms.uSnC = SC;
      sh.vertexShader = vs.slice(0, end).replace('#include <common>', '#include <common>\n' + VDECL) + VBODY + vs.slice(end);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + FDECL).replace(at, FBODY + at);
    };
    m.customProgramCacheKey = () => key; m.needsUpdate = true;
  }
  // which materials: none of the road's (asphalt, kerbs, paving, gravel, the paint and the wear), water, glass, people, the moving things
  const SKIPN = /^(crowd|life|lifeShadow|tyremarks|ao|roadwear|flags|people|umbrellas|paragliders)$/, SKIPK = /road-paint|water|brook|carPark|wheelRim|crew|gravelSeam|crowd|Crowd/;
  const hY = new WeakMap();   // (a geometry's height, by its positions: the chunks of a plant share them)
  function geoH(g) {
    const p = g.attributes.position; let h = hY.get(p);
    if (h === undefined) { let a = Infinity, b = -Infinity; for (let k = 1; k < p.array.length; k += p.itemSize) { a = Math.min(a, p.array[k]); b = Math.max(b, p.array[k]); } hY.set(p, h = b - a); }
    return h;
  }
  function instH(im) {   // an instanced plant's height in the world: its unit shape by the instances' heights (some of them)
    const e = im.instanceMatrix.array, n = Math.min(im.count, 16); let s = 0;
    for (let k = 0; k < n; k++) { const j = Math.floor(k * im.count / n) * 16 + 4; s = Math.max(s, Math.hypot(e[j], e[j + 1], e[j + 2])); }
    return geoH(im.geometry) * s;
  }
  function prepare(w) {
    const S = w.sneg, L = S.L, tx = S.tex, roads = new Set([tx.asphalt, tx.curb, tx.paving, tx.makadam, tx.water].filter(Boolean));
    S.done = true;
    const ground = new Set(); if (w.ground) { if (w.ground.traverse) w.ground.traverse(n => { if (n.isMesh) ground.add(n); }); else ground.add(w.ground); }
    const mats = new Map();
    w.root.traverse(n => {
      if (!n.isMesh || !n.material || n === S.banks) return;
      const bad = SKIPN.test(n.name || '') || SKIPK.test(n.name || '');
      for (const m of Array.isArray(n.material) ? n.material : [n.material]) { let e = mats.get(m); if (!e) mats.set(m, e = { n: [], bad: false }); e.n.push(n); if (bad) e.bad = true; }
    });
    const st = S.stats = { g: 0, t: 0, x: 0, skip: 0, bank: 0 };
    for (const [m, e] of mats) {
      const U = m.userData;
      if (e.bad || U.sneg || U.wear || U.asLook || m.transparent || roads.has(m.map) || !(m.isMeshLambertMaterial || m.isMeshPhongMaterial || m.isMeshStandardMaterial)) { st.skip++; continue; }
      const key = String(m.customProgramCacheKey());
      if (SKIPK.test(m.name || '') || SKIPK.test(key) || SKIPK.test(Object.keys(U).join(','))) { st.skip++; continue; }
      const c = e.n.some(n => ground.has(n)) ? 'g' : key.includes('treeSway') || (e.n.every(n => n.isInstancedMesh && n.userData.vb) && e.n.some(n => instH(n) >= 3)) ? 't' : 'x';
      if (!L[c]) { st.skip++; continue; }
      patch(m, c); st[c]++;
    }
    if (L.bank) own(() => banks(w, S));
  }
  // the plough's banks (Llogara): a narrow windrow where the plough leaves it, at the edge of the cleared road (about 2 m
  // across): its dirty foot, the face, the top, the far side down to the ground; low where a barrier stands in it (its rail in view),
  // lower at the start, the finish and the checkpoints; none where the ground falls away (bridges, the walls over a drop), in a
  // tunnel or where the road passes under itself
  const uu = { s: 15485867 };
  const own = (fn) => { const r = Math.random; Math.random = () => (uu.s = (uu.s * 48271) % 2147483647) / 2147483647; try { return fn(); } finally { Math.random = r; } };   // (the game's random numbers as without the snow)
  const hh = (n) => { let h = Math.imul((n | 0) ^ 0x5bd1e995, 0x27d4eb2d); h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
  const vn = (u, sd) => { const i = Math.floor(u), f = u - i, t = f * f * (3 - 2 * f), a = hh(i * 2 + sd), b = hh(i * 2 + 2 + sd); return a + (b - a) * t; };
  const sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const PO = [0.05, 0.3, 0.65, 0.95, 1.35, 1.9], PH = [0.03, 0.35, 0.85, 1, 0.5, 0];   // (across from the road's edge in m; the height by the bank's)
  const PC = [[0.86, 0.87, 0.9], [0.92, 0.93, 0.96], [0.95, 0.96, 0.99], [0.96, 0.97, 1], [0.95, 0.96, 0.99], [0.93, 0.95, 0.98]];
  function banks(w, S) {
    const T = S.T, BK = S.L.bank, gH = w.groundH;
    if (!T || !T.px || !T.hy || !T.nx || typeof gH !== 'function') return;
    const N = T.N || T.px.length, ds = T.ds || 1, step = Math.max(1, Math.round(2 / ds)), P = [], C = [], I = [];
    const marks = [[T.startS, 60]].concat(T.finishS !== T.startS ? [[T.finishS, 30]] : [], (T.cpS || []).map(s => [s, 30]));
    const cross = (T.cross || []).reduce((a, c) => a.concat([c.up, c.lo].filter(v => v != null)), []);
    const M = Math.ceil(N / step), off = new Float64Array(6), hs = new Float64Array(6), gap = new Uint8Array(M), far = new Float64Array(M);
    for (const sd of [-1, 1]) {
      const W = T.walk ? T.walk[sd > 0 ? 1 : 0] : null, bl = sd > 0 ? T.br : T.bl, eAt = (i) => (T.wAt ? T.wAt(i) : T.w) + (W ? W[i] : 0);
      for (let j = 0; j < M; j++) {   // (where not, first: so the bank comes up out of the ground over 12 m and goes down into it again)
        const i = j * step, px = T.px[i], pz = T.pz[i], nx = T.nx[i] * sd, nz = T.nz[i] * sd, hy = T.hy[i], e = eAt(i);
        let no = gH(px, pz) > hy + 3 || gH(px + nx * (e + 1), pz + nz * (e + 1)) < hy - 0.8 || gH(px + nx * (e + 1.9), pz + nz * (e + 1.9)) < hy - 1.5;
        for (const c of cross) if (Math.abs(i - c) * ds < 40) no = true;
        gap[j] = no ? 1 : 0;
      }
      for (let j = 0, d = 0; j < M; j++) { d = gap[j] ? 0 : d + step * ds; far[j] = d; }
      for (let j = M - 1, d = 0; j >= 0; j--) { d = gap[j] ? 0 : d + step * ds; far[j] = Math.min(far[j], d) - step * ds; }
      let prev = -1;
      for (let j = 0; j < M; j++) {
        if (gap[j]) { prev = -1; continue; }
        const i = j * step, px = T.px[i], pz = T.pz[i], nx = T.nx[i] * sd, nz = T.nz[i] * sd, hy = T.hy[i], s = i * ds, e = eAt(i);
        const bar = bl && bl[i] != null ? bl[i] : Infinity;
        let bk = BK[0] + (BK[1] - BK[0]) * (0.65 * vn(s / 25, sd > 0 ? 1 : 0) + 0.35 * vn(s / 7 + 13, sd > 0 ? 7 : 4));
        for (const [a, d] of marks) if (a != null) bk *= 0.35 + 0.65 * sst(d, d + 20, Math.abs(s - a));
        if (bar - e < 2.2) bk = Math.min(bk, 0.4);   // (a guardrail's rail about 0.75 m up: above the snow)
        bk *= sst(0, 12, far[j]);
        for (let k = 0; k < 6; k++) { off[k] = e + PO[k]; hs[k] = k ? bk * PH[k] : PH[0]; }
        const base = P.length / 3;
        for (let k = 0; k < 6; k++) {
          const x = px + nx * off[k], z = pz + nz * off[k], g = gH(x, z), y = k === 5 ? g + 0.03 : Math.max((k < 2 ? hy : Math.max(hy, g)) + hs[k], g + 0.03);
          const v = 1 + (hh(i * 13 + k * 3 + (sd > 0 ? 101 : 0)) - 0.5) * 0.05;
          P.push(x, y, z); C.push(PC[k][0] * v, PC[k][1] * v, PC[k][2] * v);
        }
        if (prev >= 0) {   // (the faces up: by the turn from across the road to along it)
          const ux = P[prev * 3 + 3] - P[prev * 3], uz = P[prev * 3 + 5] - P[prev * 3 + 2], vx = P[base * 3] - P[prev * 3], vz = P[base * 3 + 2] - P[prev * 3 + 2], up = uz * vx - ux * vz > 0;
          for (let k = 0; k < 5; k++) { const a = prev + k, b = base + k;
            if (up) I.push(a, a + 1, b + 1, a, b + 1, b); else I.push(a, b + 1, a + 1, a, b, b + 1); }
        }
        prev = base;
      }
    }
    if (!I.length) return;
    const g = new THREE.BufferGeometry(), col = new THREE.Float32BufferAttribute(C, 3); col.noSeason = true;   // (its own colours: not the season's paint)
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', col); g.setIndex(I); g.computeVertexNormals(); g.computeBoundingSphere();
    const nr = g.attributes.normal.array;   // (soft snow: the faces half toward the sky, not a dark wall)
    for (let k = 0; k < nr.length; k += 3) { const x = nr[k] * 0.5, y = nr[k + 1] * 0.5 + 0.5, z = nr[k + 2] * 0.5, l = Math.hypot(x, y, z) || 1; nr[k] = x / l; nr[k + 1] = y / l; nr[k + 2] = z / l; }
    const mesh = S.banks = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }));
    mesh.name = 'snegBanks'; mesh.receiveShadow = true; mesh.castShadow = false; mesh.userData.sneg = 'bank';
    w.root.add(mesh); mesh.updateMatrixWorld(true); S.stats.bank = P.length / 3;
  }
  // each frame (the scene's onBeforeRender: one per render): on in winter (a world painted for its season: its own), else the strength 0
  function frame(sc) {
    const w = sc.userData.snegW, S = w && w.sneg, R = typeof Render !== 'undefined' ? Render : null;
    const on = !!(S && R && (!R.world || R.world === w) && (w.ownSeason ? w.season === 'winter' : R.atmos && R.atmos.season === 'winter' && !w.noSnow));
    if (on && !S.done) prepare(w);
    for (const c of CATS) {
      const v = on && S.L[c], b = (on && S.L[c + 'b']) || CB[c];
      if (v) { K[c].value.set(v[0], v[1], v[2], v[3]); B[c].value.set(b[0], b[1], b[2], b[3]); } else K[c].value.x = 0;
    }
    if (S && S.banks) S.banks.visible = on;
  }
  function hook(scene) {
    if (scene.userData.snegHook) return; scene.userData.snegHook = true;
    const prev = scene.onBeforeRender;
    scene.onBeforeRender = function (r, sc, cam, rt) { prev.call(this, r, sc, cam, rt); frame(sc || scene); };
  }
  const build = World.build;
  World.build = function (scene, track, tex) {
    const o = build.apply(this, arguments), id = track && track.def && track.def.id, L = LOOK[id], mine = !!(L && o && o.root);
    if (mine) o.sneg = { id, L, T: track, tex: tex || {}, done: false, banks: null, stats: null };
    if (scene && scene.userData) { scene.userData.snegW = mine ? o : null; if (mine) hook(scene); }
    return o;
  };
  World.sneg = { LOOK, K, B };
})();
