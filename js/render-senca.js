/* =========================================================================
   RENDER — the sun's shadow box (Grafika AAA, docs/grafika-aaa.md on the branch raziskava/grafika-aaa: H6 and H7).
   H6, a soft edge of the shadow box: the sun's shadows are drawn only inside its box (on NIZKA fitted round the ground the camera sees, on
   SREDNJA and VISOKA a 160 m square round the view's centre: js/render.js fitShadow), and where the box ends a shadow ended in a straight
   line across the road ahead (Spa, Belgija, m 3420 on VISOKA). On a track of ROB the shadows fade out over the last ROB_M metres inside
   the box's edges instead (the shadow's darkness × smoothstep of the distance to the nearest edge), so the box's edge no longer shows.
   (The light rectangle on the slope at Killar, Indija, m 1780 is not the box's edge but the terrain's own shading: the same with a box
   three times as large; H6 leaves it.)
   How: three.js r128's shadow part of the shaders (THREE.ShaderChunk.shadowmap_pars_fragment) is changed here once, when the page loads,
   before any shader is compiled (the menu's, the garage's, the race's): r128 does not count a chunk's text in its programs' key, so a
   program compiled before the change would be used on as it was. getShadow becomes a wrapper round the old one, which fades by the uniform
   uShEdge (the fade's width in the box's own units, x and y); every material gets that one uniform object (Material.onBuild, called by
   three.js before onBeforeCompile each time a material's program is built), so a value set here reaches them all without new programs.
   uShEdge 0 (everywhere but a track of ROB: the frozen tracks, the menu, the garage and its showroom, the cars' pictures) skips the fade in
   the shader: the picture the same to the bit as before.
   H7, the fitted box on SREDNJA and VISOKA too (only where FIT, after H0's measurement: the box smaller, so fewer casters in the shadow pass
   and finer shadows); debug.fit (the perf test's --h0 rows) sets it on (1) or off (0) on every track, null as FIT says; debug.rob the same
   for H6 (tests/browser/senca.test.mjs, tools/shot.mjs).
   Render.ext.senca: { ROB, FIT, ROB_M, uniform, on(def), fit(tier, def), box(sc, def), debug } (js/render.js fitShadow: fit, box)
   ========================================================================= */
(function () {
  'use strict';
  if (typeof Render === 'undefined' || !Render.ext || typeof THREE === 'undefined') return;
  const ROB = new Set(['spa', 'killar']);   // (H6 on these tracks: the pilot, N4; the others in G0, each with its own look)
  const FIT = new Set();   // (H7 on these tracks, SREDNJA and VISOKA; NIZKA fits its box everywhere, as before. Empty after H0, tests/golden/perf-h0.json: 0–6 % fewer calls, no track brought under 300 / 900k)
  const ROB_M = 12;   // (the fade's width, m: NIZKA's margin round the view's corners, so on the ground the camera sees the shadows stay whole)
  const uniform = { value: new THREE.Vector2(0, 0) };
  const debug = { fit: null, rob: null };
  const real = (def) => !!def && !def.test && !def.pending;
  const on = (def) => debug.rob != null ? !!debug.rob : real(def) && ROB.has(def.id);

  // the shader: getShadow wrapped (the old one renamed), the wrapper before getPointShadow, in the same #ifdef USE_SHADOWMAP block
  {
    const C = THREE.ShaderChunk, src = C.shadowmap_pars_fragment;
    const head = 'float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {';
    const pt = 'float getPointShadow(';
    if (src.split(head).length === 2 && src.split(pt).length === 2) {
      C.shadowmap_pars_fragment = src.replace(head, head.replace('getShadow(', 'getShadowH6(')).replace(pt,
        'uniform vec2 uShEdge;\n' +
        '\t' + head + '\n' +
        '\t\tfloat s = getShadowH6( shadowMap, shadowMapSize, shadowBias, shadowRadius, shadowCoord );\n' +
        '\t\tif ( uShEdge.x > 0.0 ) {\n' +
        '\t\t\tvec2 c = shadowCoord.xy / shadowCoord.w;\n' +
        '\t\t\tvec2 e = min( c, 1.0 - c ) / uShEdge;\n' +
        '\t\t\ts = mix( 1.0, s, smoothstep( 0.0, 1.0, clamp( min( e.x, e.y ), 0.0, 1.0 ) ) );\n' +
        '\t\t}\n' +
        '\t\treturn s;\n' +
        '\t}\n\t' + pt);
      const b0 = THREE.Material.prototype.onBuild;
      THREE.Material.prototype.onBuild = function (sh, r) { if (sh && sh.uniforms) sh.uniforms.uShEdge = uniform; return b0.call(this, sh, r); };
    } else console.warn('render-senca: three.js shadow chunk not as expected, H6 off');
  }

  // H7: is the box fitted on this tier (1 SREDNJA, 2 VISOKA) and track
  function fit(tier, def) { return debug.fit != null ? !!debug.fit : tier > 0 && real(def) && FIT.has(def.id); }
  // every frame, once the box is set (sc: the sun's shadow camera): the fade's width on a track of ROB, else 0
  function box(sc, def) {
    const w = sc.right - sc.left, h = sc.top - sc.bottom;
    if (on(def) && w > 0 && h > 0) uniform.value.set(Math.min(0.5, ROB_M / w), Math.min(0.5, ROB_M / h));
    else uniform.value.set(0, 0);
  }

  Render.ext.senca = { ROB, FIT, ROB_M, uniform, on, fit, box, debug };
})();
