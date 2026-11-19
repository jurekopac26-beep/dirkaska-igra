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
    '}'].join('\n');
  const K3_STEEP = /pkG = mix\( pkG, mix\( pkR, ([0-9.]+), 0\.25 \), pkSt \);/;
  const k3Steep = (M) => [
    'float k3W = smoothstep( 0.1, 0.22, ( vColor.r - vColor.b ) / max( vColor.r, 0.02 ) ), k3D = length( vPkV );',
    'float k3B = smoothstep( 0.3, 0.7, pkWx ), k3L = 1.0, k3M = 1.0;',   // (one face, one projection: two blended draw a lattice)
    'if ( k3B < 0.999 ) k3L = k3Rock( vec2( vUv.x * 10.0, vPkY ), k3W, k3D );',
    'if ( k3B > 0.001 ) k3M = k3Rock( vec2( vUv.y * 10.0 + 37.0, vPkY ), k3W, k3D );',
    'k3L = mix( k3L, k3M, k3B );',
    'float k3G = mix( texture2D( map, vec2( vUv.x, vPkY * 0.1 ) * 1.8 ).r, texture2D( map, vec2( vUv.y, vPkY * 0.1 ) * 1.8 + 0.5 ).r, k3B );',   // the grain, not stretched
    'pkG = mix( pkG, ' + M + ' * k3L * mix( 1.0, k3G / ' + M + ', 0.45 ), pkSt );'].join('\n    ');
  const rockFace = (out) => {
    let n = 0; const seen = new Set();
    for (const m of (out.ground ? out.ground.children : [])) {
      const mat = m.material; if (!mat || seen.has(mat) || !mat.onBeforeCompile || !mat.customProgramCacheKey || mat.customProgramCacheKey() !== 'pkGround2') continue;
      seen.add(mat); const prev = mat.onBeforeCompile;
      mat.onBeforeCompile = function (sh, r) {
        prev.call(this, sh, r); const M = sh.fragmentShader.match(K3_STEEP); if (!M) return;   // (the material changed: leave it as it is)
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + K3_ROCK).replace(K3_STEEP, k3Steep(M[1]));
      };
      mat.customProgramCacheKey = () => 'pkGround2k3'; mat.needsUpdate = true; n++;
    }
    return n;
  };

  wrap('montreal', (out) => { (out.stats = out.stats || {}).kamera3 = {}; });
  wrap('rbring', (out) => { (out.stats = out.stats || {}).kamera3 = {}; });
  wrap('chapman', (out) => { (out.stats = out.stats || {}).kamera3 = { skala: rockFace(out) }; });
})();
