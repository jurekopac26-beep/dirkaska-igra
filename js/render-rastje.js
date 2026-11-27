/* =========================================================================
   RENDER — the vegetation's fade at the detail distance (Grafika AAA V1, docs/grafika-aaa.md on the branch raziskava/grafika-aaa, G0).
   On NIZKA and SREDNJA Render hides the far vegetation chunks (world.cull: js/render.js cullByDistance, the detail distance dd; VISOKA
   keeps everything, dd Infinity). A chunk comes back when its centre is dd + r from the camera, so its nearest part is at least dd away,
   and before this the whole chunk popped in at once. On a track of ON every part of such a chunk now fades with its horizontal distance
   from the camera, over the last W metres before dd (W = max(12, 0.15 dd)): at dd it is gone, so a chunk appearing is invisible at first.
   How: each such chunk's material gets a twin (the same material and shader, plus the fade); every frame, only for the main view, the
   chunks that reach into the fade's band (D + r > dd - W) are drawn with the twin, the others as before (the fade's discard turns the
   early depth test off for a program, so only the band pays for it: measured first, docs/grafika-aaa.md V1). With MSAA (the canvas,
   »normal«, or the 4-sample target of »high« on WebGL2) the fade is alpha-to-coverage, without it (»high« on WebGL1) an ordered 4×4
   dither; the sun's shadow pass gets a matching depth material (always the dither: the shadow map has no MSAA). The materials go back
   after the render, so the rest of the game never sees a twin. Render.precompile compiles the twins and their depth programs before the
   start (N3), so nothing compiles while driving. Crowds, stands and animals are left out (their own shaders and shadows).
   Seen mostly on NIZKA (dd 165, well inside the haze); on SREDNJA (dd 320) the haze's far end (about 5.5× the camera's distance from the car,
   ~260 m on a dry day) usually hides the edge already, and the fade only shows where the view is longer (a theme's fogK, a far camera).
   Off (nothing swapped, the picture the same to the bit as before): the frozen tracks, every track not in ON, VISOKA, the menu, the garage.
   debug.mode: null as ON says; 'off'; 'band' (the fade on any track); 'all' (every chunk with the twin: the measurement's worst case).
   Render.ext.rastje: { ON, debug, uniforms, on(), stats() }
   ========================================================================= */
(function () {
  'use strict';
  if (typeof Render === 'undefined' || !Render.ext || typeof THREE === 'undefined') return;
  const ON = new Set(['spa', 'koli']);   // (the pilot, N4: a forest at the edge of the detail distance on each)
  const debug = { mode: null };
  const real = (def) => !!def && !def.test && !def.pending;
  const U = { uV1C: { value: new THREE.Vector2() }, uV1P: { value: new THREE.Vector3(1e9, 12, 1) } };   // (the camera's x z; dd, W, 1 alpha-to-coverage / 0 dither)
  let def = null, keep = [], list = null, listW = null, swapped = [], st = { band: 0, all: 0, frames: 0 };

  const BAYER = 'vec2 v1Q = mod( floor( gl_FragCoord.xy ), 4.0 ), v1A = mod( v1Q, 2.0 ), v1B = floor( v1Q * 0.5 );\n' +
    'float v1T = ( 4.0 * ( 2.0 * mod( v1A.x + v1A.y, 2.0 ) + v1A.y ) + 2.0 * mod( v1B.x + v1B.y, 2.0 ) + v1B.y + 0.5 ) / 16.0;\n';
  const K = 'float v1K = clamp( ( uV1P.x - length( vV1 - uV1C ) ) / uV1P.y, 0.0, 1.0 ); v1K = v1K * v1K * ( 3.0 - 2.0 * v1K );\n';
  function patch(sh, dither) {   // (after the material's own onBeforeCompile: the clouds', the wind's, Koli's cut-out)
    sh.uniforms.uV1C = U.uV1C; sh.uniforms.uV1P = U.uV1P;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vV1;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvec4 v1W = vec4( transformed, 1.0 );\n#ifdef USE_INSTANCING\nv1W = instanceMatrix * v1W;\n#endif\nvV1 = ( modelMatrix * v1W ).xz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec2 uV1C;\nuniform vec3 uV1P;\nvarying vec2 vV1;')
      .replace('void main() {', 'void main() {\n' + K + (dither ? '' : 'if ( uV1P.z < 0.5 ) {\n') + BAYER + 'if ( v1K < v1T ) discard;\n' + (dither ? '' : '}\n'));
    if (!dither) sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\nif ( uV1P.z > 0.5 ) gl_FragColor.a = v1K;');
  }
  // the twin: the same material (its own onBeforeCompile first), its own programs; userData shared, not copied (Material.copy would JSON it)
  function twin(o) {
    const ud = o.userData; o.userData = {};
    const f = new o.constructor(); f.copy(o); o.userData = ud; f.userData = ud;
    const ob = o.onBeforeCompile, key = o.customProgramCacheKey();
    f.onBeforeCompile = function (sh, r) { ob.call(o, sh, r); patch(sh, false); };
    f.customProgramCacheKey = () => key + '|v1';
    f.v1o = o; f.v1ver = o.version;
    return f;
  }
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });   // (as three.js's own for the sun's shadows, plus the dither)
  depth.onBeforeCompile = (sh) => patch(sh, true);
  depth.customProgramCacheKey = () => 'v1depth';

  const SKIP = /crowd|stand|herd/i;
  function build(w) {   // the world's chunks that fade: opaque Lambert / Phong, no depth material of their own, no people or animals
    const tw = new Map(), shlo = new Map();
    for (const [sm, of] of w.shadowLo || []) shlo.set(of, sm);
    list = [];
    for (const c of w.cull) {
      const m = c.m, o = m && m.material;
      if (!m.isMesh || !o || Array.isArray(o) || o.transparent || m.customDepthMaterial || o.userData.herd || !(o.isMeshLambertMaterial || o.isMeshPhongMaterial)) continue;
      if (SKIP.test(o.customProgramCacheKey()) || SKIP.test(m.name || '')) continue;
      if (!tw.has(o)) tw.set(o, twin(o));
      list.push({ c, m, o, f: tw.get(o), sm: shlo.get(m) || null });
    }
    listW = w;
  }
  function on() {
    const dd = Render.getDetailDist();
    if (!(dd < Infinity) || !Render.world || !Render.world.cull) return false;
    return debug.mode != null ? debug.mode !== 'off' : real(def) && ON.has(def.id);
  }
  function restore() {
    for (const e of swapped) { e.m.material = e.o; e.m.customDepthMaterial = undefined; if (e.sm) e.sm.customDepthMaterial = undefined; }
    swapped.length = 0;
  }
  function sync(f) {   // the twin follows its material (the season's colours, a rebuilt program)
    const o = f.v1o;
    if (o.version !== f.v1ver) { const ud = o.userData; o.userData = {}; const ob = f.onBeforeCompile, k = f.customProgramCacheKey; f.copy(o); o.userData = ud; f.userData = ud; f.onBeforeCompile = ob; f.customProgramCacheKey = k; f.v1ver = o.version; f.needsUpdate = true; }
    else { f.color.copy(o.color); if (o.emissive) f.emissive.copy(o.emissive); f.opacity = o.opacity; }
  }
  function msaa(r) {
    const t = r.getRenderTarget();
    if (t) return !!t.isWebGLMultisampleRenderTarget;
    const a = r.getContext().getContextAttributes(); return !!(a && a.antialias);
  }
  function swap(r, cam, all) {
    const w = Render.world; if (w !== listW) build(w);
    const dd = Render.getDetailDist(), W = Math.max(12, 0.15 * dd), cx = cam.position.x, cz = cam.position.z;
    U.uV1C.value.set(cx, cz); U.uV1P.value.set(dd, W, msaa(r) ? 1 : 0);
    const a2c = U.uV1P.value.z > 0.5, seen = new Set();
    for (const e of list) {
      const c = e.c;
      if (!all) { if (!e.m.visible) continue; const dx = c.x - cx, dz = c.z - cz, R = dd - W - c.r; if (R > 0 && dx * dx + dz * dz < R * R) continue; }
      if (!seen.has(e.f)) { seen.add(e.f); sync(e.f); e.f.alphaToCoverage = a2c; }
      e.m.material = e.f; e.m.customDepthMaterial = depth; if (e.sm) e.sm.customDepthMaterial = depth;
      swapped.push(e);
    }
    st.band = swapped.length; st.all = list.length; st.frames++;
  }

  // every render of the scene: only the race's own view (Render.camera) swaps (the scene is made in Render.init: hooked at the first world)
  let hooked = null;
  function hook() {
    const scene = Render.scene; if (!scene || hooked === scene) return; hooked = scene;
    const b0 = scene.onBeforeRender, a0 = scene.onAfterRender;
    scene.onBeforeRender = function (r, s, cam, rt) {
      restore();
      if (cam === Render.camera) { if (on()) swap(r, cam, debug.mode === 'all'); else st.band = 0; }
      return b0.call(this, r, s, cam, rt);
    };
    scene.onAfterRender = function (r, s, cam) { restore(); return a0.call(this, r, s, cam); };
  }
  // which track (World is built for it): game.js calls Render.buildWorld
  {
    const bw = Render.buildWorld;
    Render.buildWorld = function (track) { hook(); def = track && track.def || null; restore(); list = listW = null; return bw.apply(this, arguments); };
  }
  // before the start (N3): the twins' programs and the depth material's (instanced or not, each side the shadow pass will use) compiled too
  {
    const pc = Render.precompile;
    Render.precompile = function () {
      const out = pc.apply(this, arguments);
      if (!on()) return out;
      const scene = Render.scene, w = Render.world; if (w !== listW) build(w);
      const tmp = [], kinds = new Set(), SS = { 0: THREE.BackSide, 1: THREE.FrontSide, 2: THREE.DoubleSide };
      const add = (mesh, mat) => {   // a stand-in with the depth material, one per kind (three.js compiles each material once)
        const side = mat.shadowSide != null ? mat.shadowSide : SS[mat.side], k = (mesh.isInstancedMesh ? 'i' : 'm') + side;
        if (kinds.has(k)) return; kinds.add(k);
        const d = depth.clone(); d.onBeforeCompile = depth.onBeforeCompile; d.customProgramCacheKey = depth.customProgramCacheKey; d.side = side;
        const t = mesh.isInstancedMesh ? new THREE.InstancedMesh(mesh.geometry, d, 1) : new THREE.Mesh(mesh.geometry, d);
        t.frustumCulled = false; t.visible = false; tmp.push(t); scene.add(t);
      };
      try {
        for (const e of list) { e.m.material = e.f; swapped.push(e); if (e.m.castShadow) add(e.m, e.o); if (e.sm) add(e.sm, e.sm.material); }
        pc.apply(this, arguments);
      } finally { restore(); for (const t of tmp) scene.remove(t); }
      for (const d of keep) d.dispose(); keep = tmp.map(t => t.material);   // (the stand-ins' materials kept till the next track: disposed now, their programs would go with them)
      return out;
    };
  }
  Render.ext.rastje = { ON, debug, uniforms: U, on, stats: () => Object.assign({ swapped: swapped.length }, st) };
})();
