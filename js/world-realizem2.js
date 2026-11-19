// Realizem, kamera za avtom, skupina 2 (Livorno, Rio do Rastro, Spa; docs/realizem.md): what the chase camera sees on these three real roads.
// Wraps World.ext.<id> as js/world-realizem1.js does: the track's own builder runs first and stays as it is, this changes only what is listed
// here (the road, its marks, the ground and what grows on it are the packages E, S and G, in their own files)
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.ext) return;

  // the screen's cut (hjCutMat's, Harju) added to the materials that already fade along the line from the camera to the car (ouCutMat's): round
  // the line from the car to the road 20 m ahead on the screen, what is nearer the camera than the road there and higher than the car fades, with
  // the same dither. ouCutMat's cone only clears the car itself (5.5 m round it), so a crown hanging over the road just behind the car still
  // filled two thirds of the picture and hid the bend ahead (Rio do Rastro, 3000 m). World.view fills uA and uB once dyn.ouCut has them
  const R2 = { r0: 0.27, r1: 0.46 };   // (the cut's radius on the screen, in half the picture's height: full inside r0, none past r1)
  function cutPatch(sh, U) {
    sh.uniforms.hjA = U.uA; sh.uniforms.hjB = U.uB;
    sh.vertexShader = sh.vertexShader.replace('varying vec3 vOuW;', 'varying vec3 vOuW;\nvarying vec4 vHjC;')
      .replace('vOuW = ( modelMatrix * ouW ).xyz;', 'vOuW = ( modelMatrix * ouW ).xyz;\nvHjC = gl_Position;');
    sh.fragmentShader = sh.fragmentShader.replace('varying vec3 vOuW;', 'varying vec3 vOuW;\nuniform vec4 hjA;\nuniform vec4 hjB;\nvarying vec4 vHjC;')
      .replace('  vec2 ouQ = ', '  {\n' +
        '    vec2 hjP = vec2( vHjC.x / vHjC.w * hjA.w, vHjC.y / vHjC.w ), hjCa = vec2( hjA.x * hjA.w, hjA.y ), hjAB = vec2( hjB.x * hjA.w, hjB.y ) - hjCa;\n' +
        '    float hjT = clamp( dot( hjP - hjCa, hjAB ) / max( dot( hjAB, hjAB ), 1e-6 ), 0.0, 1.0 ), hjW = mix( hjA.z, hjB.z, hjT );\n' +
        '    ouF = max( ouF, smoothstep( ' + R2.r1.toFixed(2) + ', ' + R2.r0.toFixed(2) + ', length( hjP - hjCa - hjAB * hjT ) ) * smoothstep( hjW - 1.5, hjW - 5.0, vHjC.w ) * smoothstep( 0.2, 1.4, vOuW.y - ouCar.y ) );\n' +
        '  }\n  vec2 ouQ = ');
  }
  function screenCut(out) {   // (returns how many materials took it: 0 where the world has no ouCut or already cuts on the screen)
    const U = out && out.dyn && out.dyn.ouCut; if (!U || U.uA || !out.root) return 0;
    U.uA = { value: new THREE.Vector4(0, 0, -1e6, 1) }; U.uB = { value: new THREE.Vector4(0, 0, -1e6, 1) };
    const seen = new Set();
    out.root.traverse((o) => {
      for (const m of (Array.isArray(o.material) ? o.material : o.material ? [o.material] : [])) {
        if (seen.has(m) || typeof m.customProgramCacheKey !== 'function' || m.customProgramCacheKey() !== 'ouCut' || !m.onBeforeCompile) continue;
        seen.add(m); const base = m.onBeforeCompile;
        m.onBeforeCompile = (sh, r) => { base(sh, r); cutPatch(sh, U); };
        m.customProgramCacheKey = () => 'ouCutR2'; m.needsUpdate = true;
      }
    });
    return seen.size;
  }

  const wrap = (id, fn) => {
    const base = World.ext[id]; if (!base) return;
    World.ext[id] = function (scene, tex, opts, api) {
      const out = base.call(this, scene, tex, opts, api);
      try { fn(out); } catch (e) { console.error('realizem2 (' + id + '):', e); }
      return out;
    };
  };

  wrap('rastro', (out) => { (out.stats = out.stats || {}).kamera2 = { rez: screenCut(out) }; });
})();
