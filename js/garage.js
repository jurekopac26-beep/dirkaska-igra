/* Garage: the detailed showroom models (the car screen's turntable only; a race, a ghost, a replay draw the vehicle's own kit look,
   js/cars). A vehicle with an entry here (Garage.add(id, build), js/garage/<id>.js) is shown on the turntable by it instead of its kit
   body: a smooth shell, a paint with a clear coat in the studio's reflections, see-through glass with the cabin behind it, lamps,
   wheels and trim in detail. Built once (in the detail of Nastavitve · Detajli avtov: Normalni a phone's, Visoki a computer's), kept
   for the car screen (another colour: one uniform, nothing built again) and freed from the graphics memory when a race starts
   (Garage.release: the race never carries it).
   The look: lit in linear light, tone-mapped (ACES) and put out as sRGB by its own materials (Garage.patch), so the renderer's settings,
   the turntable and every other car stay as they are. The paint: Garage.paintMat (painted all over) or a shell's picture, black where
   the paint goes, its alpha picture's red channel the paint's share (added: an edge blends the two; the rest keeps its own colours).
   build(G) gets G = { THREE, lin, hi, std(params), phys(params), paintMat(params), shellMat(params) } and returns { grp, body, blob }:
   body the shell (its height frames the turntable's camera), blob the contact shadow (left out of the screen box). Everything else in
   grp is merged by material (one draw a material). */
var Garage = (function () {
  'use strict';
  const BUILD = {};
  let cur = null, env = null, envFor = null, builds = 0;   // (cur: the one model kept, { key, view }; env: the studio's reflections, for this renderer)
  const lin = (hex) => new THREE.Color(hex).convertSRGBToLinear();
  const U = { exp: { value: 1.12 } };   // (the exposure of every garage material)

  // ---- the studio's reflections: a dark hall, a long soft box over the turntable, strips along the walls, a horizon band, the key light's
  //      box at the front left, a cool one behind, the kerb ring on the floor; prefiltered for the roughness (PMREM) once ----
  function makeEnv(renderer) {
    const s = new THREE.Scene(), V = (x, y, z) => new THREE.Vector3(x, y, z);
    const g = new THREE.SphereGeometry(40, 32, 16), pa = g.attributes.position, c = [];
    for (let i = 0; i < pa.count; i++) { const y = pa.getY(i) / 40, col = y < -0.02 ? lin(0x151a22) : lin(0x1e2531).lerp(lin(0x2a3240), Math.max(0, Math.min(1, y * 2))); c.push(col.r, col.g, col.b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); s.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true })));
    const panel = (w, h, p, look, k, col) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col || 0xffffff).multiplyScalar(k), side: THREE.DoubleSide })); m.position.copy(p); m.lookAt(look); s.add(m); };
    panel(22, 5, V(0, 16, 0), V(0, 0, 0), 4.5);
    panel(3, 22, V(-14, 7, 0), V(0, 1, 0), 1.5, 0xdfe9ff); panel(3, 22, V(14, 7, 0), V(0, 1, 0), 1.5, 0xdfe9ff);
    panel(10, 6, V(-12, 16, 14), V(0, 0, 0), 3.0, 0xfff2dd); panel(14, 3, V(10, 6, -14), V(0, 1, 0), 1.6, 0x9fc8ff);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(26, 26, 1.4, 48, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xe8eef6).multiplyScalar(0.9), side: THREE.BackSide })); band.position.y = 2.6; s.add(band);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(4.2, 48), new THREE.MeshBasicMaterial({ color: lin(0x2a313c) })); disc.rotation.x = -Math.PI / 2; disc.position.y = -0.01; s.add(disc);
    for (let i = 0; i < 48; i++) { const a0 = i / 48 * Math.PI * 2, a1 = (i + 1) / 48 * Math.PI * 2, sh = new THREE.Shape();
      sh.moveTo(Math.cos(a0) * 4.2, Math.sin(a0) * 4.2); sh.lineTo(Math.cos(a0) * 4.8, Math.sin(a0) * 4.8); sh.lineTo(Math.cos(a1) * 4.8, Math.sin(a1) * 4.8); sh.lineTo(Math.cos(a1) * 4.2, Math.sin(a1) * 4.2);
      const r = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: (i % 2 ? lin(0xd92a24) : lin(0xf2f2ee)).multiplyScalar(0.7) })); r.rotation.x = -Math.PI / 2; s.add(r); }
    const pm = new THREE.PMREMGenerator(renderer), rt = pm.fromScene(s, 0.02); pm.dispose();
    s.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    return rt.texture;
  }

  // ---- the garage's own look on a material: tone-mapped and sRGB by itself; paint 'all' (its whole colour the paint's) or 'mask' (where the
  //      alpha picture's red says so) ----
  const TONE = ['uniform float uGExp;',
    'vec3 gRRT( vec3 v ) { vec3 a = v * ( v + 0.0245786 ) - 0.000090537; vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081; return a / b; }',
    'vec3 gACES( vec3 c ) { const mat3 I = mat3( vec3( 0.59719, 0.07600, 0.02840 ), vec3( 0.35458, 0.90834, 0.13383 ), vec3( 0.04823, 0.01566, 0.83777 ) );',
    '  const mat3 O = mat3( vec3( 1.60475, -0.10208, -0.00327 ), vec3( -0.53108, 1.10813, -0.07276 ), vec3( -0.07367, -0.00605, 1.07602 ) );',
    '  return clamp( O * gRRT( I * ( c / 0.6 ) ), 0.0, 1.0 ); }'].join('\n');
  function patch(m, paint, uPaint) {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uGExp = U.exp; if (paint) sh.uniforms.uGPaint = uPaint;
      let f = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + TONE + (paint ? '\nuniform vec3 uGPaint;' : ''));
      if (paint === 'all') f = f.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= uGPaint;');
      if (paint === 'mask') f = f.replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb += uGPaint * texture2D( alphaMap, vUv ).r;');
      sh.fragmentShader = f.replace('#include <encodings_fragment>', 'gl_FragColor.rgb = gACES( gl_FragColor.rgb * uGExp );\ngl_FragColor = LinearTosRGB( gl_FragColor );');
    };
    m.customProgramCacheKey = () => 'garage|' + (paint || '');
    return m;
  }

  // ---- one draw a material: the meshes under root (but the kept ones) baked into one geometry each, in root's frame ----
  function merge(root, keep) {
    root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), groups = new Map(), gone = [];
    root.traverse(o => { if (!o.isMesh || keep.has(o)) return; const k = o.material; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(o); gone.push(o); });
    for (const o of gone) o.parent.remove(o);
    for (const [mat, list] of groups) {
      const P = [], N = [], T = [], mw = new THREE.Matrix4(), nm = new THREE.Matrix3(), v = new THREE.Vector3();
      for (const o of list) {
        mw.multiplyMatrices(inv, o.matrixWorld); nm.getNormalMatrix(mw);
        let g = o.geometry; if (!g.attributes.normal) g.computeVertexNormals(); const gi = g.index ? g.toNonIndexed() : g, pa = gi.attributes.position, na = gi.attributes.normal, ua = gi.attributes.uv;
        const flip = mw.determinant() < 0;   // (a mirrored piece: its triangles turned back round, so they face out)
        for (let i = 0; i < pa.count; i++) { const j = flip ? i - i % 3 + [0, 2, 1][i % 3] : i;
          v.fromBufferAttribute(pa, j).applyMatrix4(mw); P.push(v.x, v.y, v.z); v.fromBufferAttribute(na, j).applyMatrix3(nm).normalize(); N.push(v.x, v.y, v.z); T.push(ua ? ua.getX(j) : 0, ua ? ua.getY(j) : 0); }
        if (gi !== g) gi.dispose(); g.dispose();
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(T, 2));
      const m = new THREE.Mesh(geo, mat); root.add(m);
    }
  }

  // ---- the view of a model for the turntable: { grp, body, blob, garage: true, key }; built once, recoloured after that ----
  function view(id, o) {
    const key = id + (o.hi ? '|H' : '');
    if (cur && cur.key !== key) { free(cur.view); cur = null; }
    if (!cur) {
      if (!env || envFor !== o.renderer) { env = makeEnv(o.renderer); envFor = o.renderer; }
      const uPaint = { value: new THREE.Color(1, 1, 1) }, mats = [];
      const mk = (Kind, p, paint) => { const m = patch(new Kind(Object.assign({ envMap: env }, p)), paint, uPaint); mats.push(m); return m; };
      const G = { THREE, lin, hi: !!o.hi,
        std: (p) => mk(THREE.MeshStandardMaterial, p), phys: (p) => mk(THREE.MeshPhysicalMaterial, p),
        paintMat: (p) => mk(THREE.MeshPhysicalMaterial, Object.assign({ color: 0xffffff }, p), 'all'), shellMat: (p) => mk(THREE.MeshPhysicalMaterial, p, 'mask') };
      const r = BUILD[id](G), keep = new Set([r.body, r.blob].concat(r.keep || []));
      merge(r.grp, keep); builds++;
      cur = { key, view: { grp: r.grp, body: r.body, blob: r.blob, garage: true, key, uPaint, mats } };
    }
    cur.view.uPaint.value.copy(lin(o.color != null ? o.color : 0xd81f2a));
    return cur.view;
  }
  // the graphics memory of a view freed (its geometry, materials, pictures); drawn again later, it goes back up by itself (the studio's
  // reflections are kept: small, and still what a freed view's materials point to)
  function free(v) {
    v.grp.traverse(m => { if (!m.isMesh) return; m.geometry.dispose(); for (const q of Array.isArray(m.material) ? m.material : [m.material]) { for (const k of ['map', 'alphaMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'clearcoatMap', 'clearcoatRoughnessMap', 'bumpMap']) if (q[k]) q[k].dispose(); q.dispose(); } });
  }
  function release() { if (cur) { free(cur.view); cur = null; } }   // (a race starts: the next car screen builds it again)
  // a view taken off the turntable: freed unless it is the one kept (one released by a race and drawn again since, in the settings'
  // showroom, went back up: freed again here, so it never stays in the graphics memory)
  function drop(v) { if (!cur || cur.view !== v) free(v); }
  // (tests) the kept view: its draws, triangles, pictures' sizes, its paint (sRGB); builds: how many were built so far
  function info() {
    if (!cur) return { builds, key: null };
    let draws = 0, tris = 0; const pics = new Set();
    cur.view.grp.traverse(m => { if (!m.isMesh) return; draws++; const g = m.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
      for (const k of ['map', 'alphaMap', 'roughnessMap', 'emissiveMap', 'clearcoatMap', 'bumpMap']) if (m.material[k] && m.material[k].image) pics.add(m.material[k].image); });
    return { builds, key: cur.key, draws, tris: Math.round(tris), pics: [...pics].map(p => p.width + 'x' + p.height), color: cur.view.uPaint.value.clone().convertLinearToSRGB().getHex() };
  }
  return { add: (id, build) => { BUILD[id] = build; }, has: (id) => !!BUILD[id], view, release, drop, info, lin, patch, U };
})();
