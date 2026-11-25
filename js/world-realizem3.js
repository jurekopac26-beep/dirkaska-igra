/* =========================================================================
   WORLD — realizem, skupina 3 (Montréal, Štajerska, Chapman's Peak; docs/realizem.md; Medvode is pending, so frozen): what the chase camera
   sees of these real tracks, on top of their own worlds: World.ext.montreal, .rbring and .chapman wrapped as js/world-realizem1.js and
   js/world-realizem2.js wrap theirs, loaded after them (index.html). The track's own builder runs first and stays as it is; this changes only
   what is listed here. Sources: OSM and the public elevation models only.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.ext) return;

  // (World.ext.rbring is the shared builder of many circuits (js/world-bathurst.js, -batangas.js, ...), which call it by name: so the change
  // goes only on the track whose id is asked, read off the track the world is built for)
  const trackId = (api) => { const T = (api && api.T) || (World.api && World.api.T); return T && T.def ? T.def.id : ''; };
  const wrap = (id, fn) => {
    const base = World.ext[id]; if (!base) return;
    World.ext[id] = function (scene, tex, opts, api) {
      const out = base.call(this, scene, tex, opts, api);
      if (trackId(api) === id) try { fn(out, (api && api.T) || World.api.T); } catch (e) { console.error('realizem3 (' + id + '):', e); }
      return out;
    };
  };

  /* ---- Chapman's Peak: the cut face. The steep faces of the terrain (pkGroundMat, js/world-pikes.js: the grit projected sideways, stretched
     3.5 times along the face) read from the chase camera as smooth sand, smeared sideways; the cut beside the road is rock (docs/proge/chapman.md,
     »Skale«): grey granite low down in big rounded blocks between its sheet joints, the sandstone above in pale and dark beds with joints across
     them. The same material, on the steep faces only, gets that pattern (on the face, not stretched; the beds' lips in shadow, the joints dark),
     chosen by the rock's own colour (chCol: the granite grey, the sandstone warm); the fine lines fade out with distance. No new draw calls. ---- */
  const K3_ROCK = [
    'float k3H( float p ) { p = fract( p * 0.1031 ); p *= p + 33.33; p *= p + p; return fract( p ); }',   // (hashes without sin)
    'vec2 k3H2( vec2 p ) { vec3 q = fract( p.xyx * vec3( 0.1031, 0.103, 0.0973 ) ); q += dot( q, q.yzx + 33.33 ); return fract( ( q.xx + q.yz ) * q.zy ); }',
    'float k3Rock( vec2 p, float warm, float dist ) {',   // p: along the face (m), height (m); a brightness around 1
    '  float near = 1.0 - smoothstep( 40.0, 150.0, dist ), mid = 1.0 - smoothstep( 100.0, 300.0, dist );',
    // the sandstone: thin beds, pale and dark; ledges every 3-4 m (not all of them), joints across them here and there, not straight
    '  float b = p.y * 2.1 + 0.5 * sin( p.x * 0.07 + p.y * 0.05 ), c = p.y * 0.27 + 0.3 * sin( p.x * 0.05 ), C = floor( c ), cf = c - C;',
    '  float ledge = 1.0 - ( 0.34 * smoothstep( 0.86, 0.97, cf ) - 0.12 * ( 1.0 - smoothstep( 0.0, 0.08, cf ) ) ) * step( 0.35, k3H( C + 11.0 ) ) * near;',
    '  float jx = p.x * 0.2 + 0.25 * sin( p.y * 0.8 ) + k3H( C ) * 7.0, J = floor( jx ); vec2 jh = k3H2( vec2( C, J ) );',
    '  float sand = mix( 1.0, mix( 0.8, 1.16, k3H( floor( b ) ) ) * mix( 0.92, 1.08, jh.y ), mid ) * ledge * ( 1.0 - 0.32 * smoothstep( 0.93, 0.99, jx - J ) * step( 0.45, jh.x ) * near );',
    // the granite: massive, in blocks wider than they are tall (the sheet joints), of all shapes: cells of three kinds, the joint between two of a
    // kind only a hairline, so most blocks are two or three cells; the joints dark, the rock just under one in its shade, just over one lit
    '  vec2 q = p * vec2( 0.18, 0.34 ), qi = floor( q ), qf = q - qi, c1 = vec2( 0.0 ), c2 = vec2( 0.0 ); float d1 = 8.0, d2 = 8.0, g1 = 0.0, g2 = 0.0;',
    '  for ( int j = -1; j <= 1; j++ ) for ( int i = -1; i <= 1; i++ ) {',
    '    vec2 o = vec2( float( i ), float( j ) ), h = k3H2( qi + o ), r = o + h - qf; float d = dot( r, r ), g = floor( fract( h.x * 13.7 + h.y * 7.3 ) * 3.0 );',
    '    if ( d < d1 ) { d2 = d1; c2 = c1; g2 = g1; d1 = d; c1 = r; g1 = g; } else if ( d < d2 ) { d2 = d; c2 = r; g2 = g; }',
    '  }',
    '  float e = sqrt( d2 ) - sqrt( d1 ), jt = g1 == g2 ? 0.15 : 1.0, ny = normalize( c2 - c1 + 1e-4 ).y;',
    '  float gran = mix( 1.0, ( 1.0 - jt * ( 0.34 * ( 1.0 - smoothstep( 0.0, 0.07, e ) ) + 0.14 * ny * ( 1.0 - smoothstep( 0.0, 0.45, e ) ) ) ) * mix( 0.88, 1.1, k3H( g1 + 3.0 ) ), near * 0.85 + 0.15 );',
    '  return mix( gran * 1.05, sand * 1.03, warm );',
    '}',
    // in the rain: water running down the face below its joints and ledges, darker: in about half the 2.4 m columns a streak 0.2-1 m wide,
    // wavering, broken every 6-8 m; gone with distance (a fine line there only flickers)
    'uniform float k3Wet; float k3Dk = 0.0;',
    'float k3Streak( vec2 p, float dist ) {',
    '  float x = p.x * 0.42 + 0.12 * sin( p.y * 0.45 + p.x * 0.3 ), X = floor( x ), f = x - X; vec2 h = k3H2( vec2( X, 71.0 ) );',
    '  float w = mix( 0.08, 0.2, h.y ), a = 1.0 - smoothstep( w * 0.4, w, abs( f - 0.5 ) ), s = p.y * mix( 0.1, 0.16, h.x ) + h.y * 5.0, S = floor( s ), fs = s - S;',
    '  return step( 0.5, h.x ) * a * step( 0.4, k3H( X * 3.1 + S * 17.0 ) ) * smoothstep( 0.0, 0.2, fs ) * ( 1.0 - smoothstep( 0.8, 1.0, fs ) ) * ( 1.0 - smoothstep( 60.0, 200.0, dist ) );',
    '}'].join('\n');
  /* ---- Chapman's Peak in the rain. The road darkens (Render: wetMats), its own ground did not (World.ext.chapman gives Render no dyn.wet): the
     cut face, the verge and the slopes stayed as pale as dry beside the dark asphalt. Wet rough ground and rock are darker than dry (the water in
     the pores and in the film keeps the light in: Lekner & Dorf 1988, Applied Optics 27(7); Twomey, Bohren & Mergenthaler 1986, Applied Optics
     25(3)), the porous sandstone more than the granite, the bush of the slopes least; water runs down the face in darker streaks. Render's water
     (0..1, the drying too) comes through a dyn.wet of this world's own, whose ground.color.setScalar(1 - 0.2 w) is read back as w, into one
     uniform on the terrain's and the verge's shaders: their colours, which the season repaints (seasonWorld), stay as they are. ---- */
  const K3_WET = { slope: 0.15, verge: 0.2, granite: 0.28, sand: 0.38, streak: 0.16 };   // (darker by this much, fully wet)
  const k3f = (v) => v.toFixed(3);
  const K3_STEEP = /pkG = mix\( pkG, mix\( pkR, ([0-9.]+), 0\.25 \), pkSt \);/;
  const k3Steep = (M) => [
    'float k3W = smoothstep( 0.1, 0.22, ( vColor.r - vColor.b ) / max( vColor.r, 0.02 ) ), k3D = length( vPkV );',
    'float k3B = smoothstep( 0.3, 0.7, pkWx ), k3L = 1.0, k3M = 1.0, k3S = 0.0, k3T = 0.0;',   // (one face, one projection: two blended draw a lattice)
    'if ( k3B < 0.999 ) { vec2 k3P = vec2( vUv.x * 10.0, vPkY ); k3L = k3Rock( k3P, k3W, k3D ); if ( k3Wet > 0.0 ) k3S = k3Streak( k3P, k3D ); }',
    'if ( k3B > 0.001 ) { vec2 k3P = vec2( vUv.y * 10.0 + 37.0, vPkY ); k3M = k3Rock( k3P, k3W, k3D ); if ( k3Wet > 0.0 ) k3T = k3Streak( k3P, k3D ); }',
    'k3L = mix( k3L, k3M, k3B ); k3Dk = mix( ' + k3f(K3_WET.granite) + ', ' + k3f(K3_WET.sand) + ', k3W ) + ' + k3f(K3_WET.streak) + ' * mix( k3S, k3T, k3B );',
    'float k3G = mix( texture2D( map, vec2( vUv.x, vPkY * 0.1 ) * 1.8 ).r, texture2D( map, vec2( vUv.y, vPkY * 0.1 ) * 1.8 + 0.5 ).r, k3B );',   // the grain, not stretched
    'pkG = mix( pkG, ' + M + ' * k3L * mix( 1.0, k3G / ' + M + ', 0.45 ), pkSt );'].join('\n    ');
  const K3_DARK = '#include <color_fragment>\ndiffuseColor.rgb *= 1.0 - k3Wet * mix( ' + k3f(K3_WET.slope) + ', k3Dk, pkSt ) * ( 1.0 - pkW );';   // (pkW: snow)
  const rockFace = (out, K3W) => {
    let n = 0; const seen = new Set();
    for (const m of (out.ground ? out.ground.children : [])) {
      const mat = m.material; if (!mat || seen.has(mat) || !mat.onBeforeCompile || !mat.customProgramCacheKey || mat.customProgramCacheKey() !== 'pkGround2') continue;
      seen.add(mat); const prev = mat.onBeforeCompile;
      mat.onBeforeCompile = function (sh, r) {
        prev.call(this, sh, r); const M = sh.fragmentShader.match(K3_STEEP); if (!M) return;   // (the material changed: leave it as it is)
        sh.uniforms.k3Wet = K3W;
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + K3_ROCK).replace(K3_STEEP, k3Steep(M[1])).replace('#include <color_fragment>', K3_DARK);
      };
      mat.customProgramCacheKey = () => 'pkGround2k3'; mat.needsUpdate = true; n++;
    }
    return n;
  };
  // the verge beside the road and the land beyond the corridor: World.ext.chapman's other ground material (the grit, World.api.vrGritTex)
  const wetVerge = (out, K3W) => {
    const grit = World.api && World.api.vrGritTex ? World.api.vrGritTex() : null, seen = new Set(); if (!grit || !out.root) return 0;
    out.root.traverse((o) => {
      const mat = o.material; if (!mat || Array.isArray(mat) || seen.has(mat) || mat.map !== grit || !mat.isMeshLambertMaterial || Object.prototype.hasOwnProperty.call(mat, 'onBeforeCompile')) return;
      seen.add(mat);
      mat.onBeforeCompile = function (sh) {
        sh.uniforms.k3Wet = K3W;
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float k3Wet;').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= 1.0 - ' + k3f(K3_WET.verge) + ' * k3Wet;');
      };
      mat.customProgramCacheKey = () => 'k3WetVerge'; mat.needsUpdate = true;
    });
    return seen.size;
  };
  // Render's water into the uniform (render.js applyRoad: W.ground.color.setScalar(1 - 0.2 * w), the rest of it on stand-ins)
  const wetHook = (out, K3W) => {
    if (!out.dyn || out.dyn.wet) return false;   // (a world with its own: leave it)
    const nop = { setScalar() {}, setHex() {} };
    out.dyn.wet = { puddles: {}, road: { color: nop, specular: nop }, ground: { color: { setScalar: (v) => { K3W.value = Math.min(1, Math.max(0, (1 - v) / 0.2)); } } }, base: { sh: 0, sp: 0 } };
    return true;
  };

  wrap('montreal', (out) => { (out.stats = out.stats || {}).kamera3 = {}; });
  wrap('rbring', (out) => { (out.stats = out.stats || {}).kamera3 = {}; });
  wrap('chapman', (out) => {
    const K3W = { value: 0 };
    (out.stats = out.stats || {}).kamera3 = { skala: rockFace(out, K3W), rob: wetVerge(out, K3W), mokro: wetHook(out, K3W) };
  });
})();
