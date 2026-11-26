/* =========================================================================
   RENDER — height fog (Grafika AAA, Srednji paket, G0, H4: docs/grafika-aaa.md on raziskava/grafika-aaa).
   A real track that names its air (def.megla: { vid: the visibility at the track's lowest point, km; H: the haze's scale height, m }; the
   numbers the track's own assumption in docs/proge/<id>.md) gets a haze that is thickest low down and thins with height: the valley under
   the road and the far, low ground paler than the near slope above it, a little brighter towards the sun (the light scattered forward).
   It is added on top of the scene's fog (scene.fog, changed in place by js/render.js every frame, also Pikes Peak's own), never instead of
   it, never a new fog object nor another kind of fog (that would compile every material again).
   The density: β0 = 3.912 / visibility (the meteorological visibility: the contrast threshold 2 %) at the lowest point of the road, β(h) = β0 ·
   exp(−(h − h0) / H) above it; along a view ray of length d from the camera (height hc) to a vertex Δh higher, the optical depth is
   β0 · exp(−(hc − h0) / H) · d · (1 − exp(−Δh / H)) / (Δh / H), the haze's share 1 − exp(−depth); nothing nearer than NEAR (the player's car
   as it was). Per vertex (a varying), the world's height from the view matrix and the camera (WebGL1: no inverse in the shader).
   The fog chunks of three.js are replaced once, when this file loads (before the first material is compiled: no new programs, no stutter,
   #1104); the four uniforms are one shared value in every built-in material and in every ShaderMaterial merged from UniformsLib.fog, only in
   the vertex shader (no precision to match between the stages). Off (hzP.w = 0, the default, and on every track without def.megla, on test
   and pending tracks, in the garage, which does not load this file): the fragment as it was, bit for bit.
   Render.ext.megla: { U, frame(track, sunOff, sunColor, fog) (js/render.js, the frame's fog) }
   ========================================================================= */
(function () {
  'use strict';
  if (typeof Render === 'undefined' || !Render.ext || typeof THREE === 'undefined') return;
  const NEAR = 30;      // (metres from the camera before the haze starts: the player's car and the road just ahead as they were)
  const SCAT = 0.55;    // (how far the haze turns to the sun's colour looking into the sun; the forward peak: cos^8)
  const MAXA = 0.6;     // (the haze's share never more than this: the far ground still seen)
  const U = { hzP: new Float32Array(4), hzS: new Float32Array(4), hzC: new Float32Array(4), hzF: new Float32Array(4) };
  // hzP: β0 (1/m), 1/H (1/m), h0 (the lowest road point, the world's y), on; hzS: the direction to the sun, SCAT; hzC: the sun's colour,
  // NEAR; hzF: the fog's colour, MAXA

  const C = THREE.ShaderChunk;
  const FV = '#ifdef USE_FOG\n\tfogDepth = - mvPosition.z;\n#endif';
  if (C.fog_vertex === FV) {
    C.fog_pars_vertex += '\n#ifdef USE_FOG\n\tvarying vec4 hzV;\n\tuniform vec4 hzP;\n\tuniform vec4 hzS;\n\tuniform vec4 hzC;\n\tuniform vec4 hzF;\n#endif';
    C.fog_vertex = [
      '#ifdef USE_FOG',
      '\tfogDepth = - mvPosition.z;',
      '\thzV = vec4( 0.0 );',
      '\tif ( hzP.w > 0.0 ) {',
      '\t\tvec3 hzW = vec3( dot( viewMatrix[ 0 ].xyz, mvPosition.xyz ), dot( viewMatrix[ 1 ].xyz, mvPosition.xyz ), dot( viewMatrix[ 2 ].xyz, mvPosition.xyz ) );',
      '\t\tfloat hzD = length( hzW );',
      '\t\tfloat hzB = clamp( hzP.y * hzW.y, - 8.0, 8.0 );',
      '\t\tfloat hzE = abs( hzB ) > 1e-4 ? ( 1.0 - exp( - hzB ) ) / hzB : 1.0;',
      '\t\tfloat hzO = hzP.x * exp( - hzP.y * max( cameraPosition.y - hzP.z, - 500.0 ) ) * max( 0.0, hzD - hzC.w ) * hzE;',
      '\t\tfloat hzK = hzD > 0.0 ? pow( max( dot( hzW / hzD, hzS.xyz ), 0.0 ), 8.0 ) * hzS.w : 0.0;',
      '\t\thzV = vec4( mix( hzF.rgb, hzC.rgb, hzK ), min( 1.0 - exp( - hzO ), hzF.w ) );',
      '\t}',
      '#endif'].join('\n');
    C.fog_pars_fragment += '\n#ifdef USE_FOG\n\tvarying vec4 hzV;\n#endif';
    C.fog_fragment = C.fog_fragment.replace(/\n#endif\s*$/, '\n\tif ( hzV.a > 0.0 ) gl_FragColor.rgb = mix( gl_FragColor.rgb, hzV.rgb, hzV.a );\n#endif');
    const add = (u) => { if (u && u.fogColor) for (const k in U) u[k] = { value: U[k] }; };   // (the Float32Array is not cloned: one value everywhere)
    for (const id in THREE.ShaderLib) add(THREE.ShaderLib[id].uniforms);
    add(THREE.UniformsLib.fog);
  }

  const low = new WeakMap();   // (a track's lowest road point, the world's y)
  function lowest(T) {
    let m = low.get(T); if (m != null) return m;
    m = Infinity; const n = 400, o = {}; for (let i = 0; i < n; i++) m = Math.min(m, T.elevAt(T.len * i / n, o).y);
    low.set(T, m = isFinite(m) ? m : 0); return m;
  }
  const real = (def) => !!def && !def.test && !def.pending && !!def.megla;
  // the frame's hook: the track on screen (curTrack), the direction to the sun (sunOff), its colour, the scene's fog (its colour)
  function frame(T, sunOff, sunC, fog) {
    const P = U.hzP, def = T && T.def;
    if (!real(def) || !fog) { P[3] = 0; return; }
    const M = def.megla, l = Math.hypot(sunOff[0], sunOff[1], sunOff[2]) || 1;
    P[0] = 3.912 / (Math.max(0.5, M.vid) * 1000); P[1] = 1 / Math.max(50, M.H); P[2] = lowest(T); P[3] = 1;
    U.hzS[0] = sunOff[0] / l; U.hzS[1] = sunOff[1] / l; U.hzS[2] = sunOff[2] / l; U.hzS[3] = SCAT;
    U.hzC[0] = sunC.r; U.hzC[1] = sunC.g; U.hzC[2] = sunC.b; U.hzC[3] = NEAR;
    U.hzF[0] = fog.color.r; U.hzF[1] = fog.color.g; U.hzF[2] = fog.color.b; U.hzF[3] = MAXA;
  }

  Render.ext.megla = { U, NEAR, frame, lowest };
})();
