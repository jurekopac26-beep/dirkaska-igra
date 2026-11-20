/* The rain on the real tracks, from the camera behind the car (graphics only: the driving, the grip in the rain and Car.wx do not
   change, docs/dez-sneg.md). render.js already darkens the wet road (applyRoad), mirrors the cars' lights in it (Streaks), throws the
   spray off the wheels and greys the theme (applyTheme); this file adds, on the tracks of LOOK only, what each place's rain looks like:
   - the wet road mirrors the overcast sky: a sheen that grows towards a glancing view (water's Fresnel term, n = 1.33), patchy where
     the film of water is thicker (no extra draw call: the road's own materials, as world.js's cloud shadows);
   - the light of a rain cloud: the sun's direct share much lower (no hard shadows under a nimbostratus), the sky's share a little higher;
   - each place's own cloud and haze: its colour and how near it closes in (the fog's distances), the Ligurian Sea grey-green in a
     libeccio (Livorno).
   The places (only from sources; no data of their own here):
     nring    the Eifel: rain from Atlantic fronts under a low, even grey deck (the Nordschleife's changeable 'Eifel weather')
     spa      the Ardennes by the Hautes Fagnes, the wettest corner of Belgium: low cloud and drizzle in the forest
     livorno  a libeccio, the south-west wind off the sea: dark squalls, a slate-grey, choppy sea along the coast road
     pikes    a summer thunderstorm on the mountain (cumulonimbus by the afternoon): the dark base of the cloud, less light from the whole sky
     tianmen  the mountain in its cloud (Zhangjiajie's humid subtropical rain): a pale, close fog round the cliffs
     rastro   the 'cerração' of the Serra Geral: the orographic fog that closes the road on the escarpment, pale and close
     montreal a June thunderstorm shower (June is Quebec's third stormiest month): the dark base of the cloud, the river greyed
     rbring   a summer thunderstorm over the Murtal (Styria has Austria's most lightning, June to August): the dark cloud, less light
     chapman  a winter cold front off the Atlantic (heavy rain and wind; in the heaviest the road is closed): low cloud on the
              mountain, the sea a dark slate grey
     balea    the road above 2,000 m in its cloud (the Făgăraș weather that changes fast, the fog that closes the road): pale, close
     katu     a shower over the sheltered Chulyshman valley (the Altai's sharply continental summer): an even grey sky; the gravel
              (the road's own picture) only a little glossy, a rough surface holds no film of water
     caracoles a frontal system on the cordillera (rain, wind and snow, short and intense): cold, blue-grey cloud low in the
              valley, the Laguna del Inca dark under it
     isuna    the monsoon in the Paro Chhu's valley (late June to September: cloud sitting on the mountainsides, fog): pale, close
     ghoufi   a short shower over the semi-arid Aurès (little rain, hot dry summers): a warm grey haze that stays far, the sun dimmed
              rather than gone; the dusty road only a little glossy
     santoantao the north-east trade wind's cloud on the Delgadim ridge (the island's rain falls mostly above 600 m, fog nets work
              there): the ridge in its cloud, pale and close; the basalt setts glossy between their joints
     ujarras  an afternoon downpour of the Orosi valley's long rainy season (May to November, heavy showers, mist): the dark base
              of the cloud over the green valley, less light from the whole sky
     killar   rain in the Pangi valley, a cold, dry zone the monsoon hardly reaches: an even, cool grey cloud in the Chenab's gorge;
              the gravel only a little glossy
     In winter's snow (render.js's snowy(): the season winter, a world without noSnow) none of this: the snow is no rain.
     (Medvode, pending, and Suzuka, a test track, are frozen: no entry.)
   Hooks (no change to render.js or the worlds' files): World.build (the patch, once per world), World.update (the race: its rain and
   water) and the scene's onBeforeRender / onAfterRender: the light, the haze and the sea set for this one picture only and put back
   right after it, so what render.js sets (the camera's fog distances, applyTheme, Pikes Peak's light by the altitude, a lightning
   flash) it always finds as it left it, never scaled twice. */
(function () {
  if (typeof World === 'undefined' || typeof THREE === 'undefined' || !World.build) return;

  // fog: the haze's colour in the rain (mixed in by fogK), near / far: the fog's distances (x), sun / hemi: the direct and the sky light (x),
  // sheen: how much the wet road mirrors, sea: the sea's colour in the rain (and how much)
  const LOOK = {
    nring:   { fog: 0x8a959c, fogK: 0.45, near: 0.9, far: 0.85, sun: 0.32, hemi: 1.12, sheen: 0.8 },
    spa:     { fog: 0x87929a, fogK: 0.5, near: 0.8, far: 0.72, sun: 0.3, hemi: 1.12, sheen: 0.8 },
    livorno: { fog: 0x7f8a92, fogK: 0.5, near: 0.95, far: 0.9, sun: 0.34, hemi: 1.1, sheen: 0.85, sea: [0x4c6266, 0.8] },
    pikes:   { fog: 0x7a838d, fogK: 0.5, near: 0.85, far: 0.8, sun: 0.38, hemi: 0.9, sheen: 0.8 },
    tianmen: { fog: 0xb3bcbf, fogK: 0.55, near: 0.6, far: 0.62, sun: 0.3, hemi: 1.15, sheen: 0.75 },
    rastro:  { fog: 0xaeb7b8, fogK: 0.55, near: 0.62, far: 0.62, sun: 0.3, hemi: 1.15, sheen: 0.75 },
    montreal: { fog: 0x7e888f, fogK: 0.5, near: 0.9, far: 0.82, sun: 0.34, hemi: 0.95, sheen: 0.85, sea: [0x5c6a64, 0.7] },
    rbring:  { fog: 0x78828b, fogK: 0.5, near: 0.85, far: 0.78, sun: 0.34, hemi: 0.9, sheen: 0.8 },
    chapman: { fog: 0x86919a, fogK: 0.5, near: 0.85, far: 0.78, sun: 0.3, hemi: 1.08, sheen: 0.8, sea: [0x435660, 0.75] },
    balea:   { fog: 0xaab4ba, fogK: 0.55, near: 0.62, far: 0.64, sun: 0.3, hemi: 1.12, sheen: 0.75, sea: [0x5a676d, 0.6] },
    katu:    { fog: 0x8c959a, fogK: 0.45, near: 0.9, far: 0.85, sun: 0.34, hemi: 1.1, sheen: 0.35 },
    caracoles: { fog: 0x98a2a9, fogK: 0.55, near: 0.72, far: 0.7, sun: 0.3, hemi: 1.1, sheen: 0.75, sea: [0x506461, 0.6] },
    isuna:   { fog: 0xa9b3b5, fogK: 0.55, near: 0.66, far: 0.66, sun: 0.3, hemi: 1.12, sheen: 0.75 },
    ghoufi:  { fog: 0xa59c90, fogK: 0.42, near: 0.92, far: 0.88, sun: 0.36, hemi: 1.0, sheen: 0.6 },
    santoantao: { fog: 0xb4bdbf, fogK: 0.58, near: 0.58, far: 0.6, sun: 0.3, hemi: 1.15, sheen: 0.6 },
    ujarras: { fog: 0x7f8b86, fogK: 0.52, near: 0.78, far: 0.74, sun: 0.28, hemi: 0.95, sheen: 0.85 },
    killar:  { fog: 0x969c9f, fogK: 0.45, near: 0.82, far: 0.8, sun: 0.34, hemi: 1.05, sheen: 0.35 },
  };

  // the sheen: shared uniforms (the patched programs are the same on every rebuild)
  const U = { dzW: { value: 0 }, dzSky: { value: new THREE.Color(0.6, 0.63, 0.66) }, dzC: { value: new THREE.Vector3() } };   // (dzC: the camera; three.js r128 gives a Lambert material no cameraPosition)
  const VS = '#include <common>\nvarying vec3 dzP;\nvarying vec3 dzU;';
  const VB = '#include <project_vertex>\n{ vec4 dzQ = vec4( transformed, 1.0 ); vec3 dzM = objectNormal;\n#ifdef USE_INSTANCING\ndzQ = instanceMatrix * dzQ; dzM = mat3( instanceMatrix ) * dzM;\n#endif\n' +
    'dzP = ( modelMatrix * dzQ ).xyz; dzM = mat3( modelMatrix ) * dzM; dzU = dot( dzM, dzM ) > 1e-8 ? normalize( dzM ) : vec3( 0.0, 1.0, 0.0 ); }';
  const FS = '#include <common>\nuniform float dzW;\nuniform vec3 dzSky;\nuniform vec3 dzC;\nvarying vec3 dzP;\nvarying vec3 dzU;\n' +
    'float dzH(vec2 i) { return fract(sin(dot(i, vec2(12.9898, 78.233))) * 43758.5453); }\n' +
    'float dzN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(dzH(i), dzH(i + vec2(1.0, 0.0)), f.x), mix(dzH(i + vec2(0.0, 1.0)), dzH(i + 1.0), f.x), f.y); }';
  const FB = 'if ( dzW > 0.0 ) {\n' +
    '  vec3 dzV = normalize( dzC - dzP ), dzM = normalize( dzU );\n' +
    '  float dzF = 0.02 + 0.98 * pow( 1.0 - clamp( abs( dot( dzV, dzM ) ), 0.0, 1.0 ), 5.0 );\n' +   // (Fresnel, Schlick: water, n = 1.33)
    '  float dzT = 0.65 * dzN( dzP.xz * 0.05 ) + 0.35 * dzN( dzP.xz * 0.23 + 11.0 );\n' +   // (where the film of water is thicker: still patches, a mirror; else the rough, wet stone)
    '  float dzK = smoothstep( 0.75, 0.95, dzM.y );\n' +   // (only what faces the sky holds a film of water: the road, not a kerb's side or a wall)
    '  gl_FragColor.rgb = mix( gl_FragColor.rgb, dzSky, dzW * dzK * clamp( dzF * ( 0.7 + 0.35 * smoothstep( 0.45, 0.8, dzT ) ), 0.0, 0.85 ) );\n' +
    '}\n#include <fog_fragment>';
  function patch(m) {
    if (m.userData.dez || !(m.isMeshLambertMaterial || m.isMeshPhongMaterial)) return;
    const prev = m.onBeforeCompile, key = 'dez|' + m.customProgramCacheKey(); m.userData.dez = true;   // (on top of world.js's cloud shadows: its own programs)
    m.onBeforeCompile = (sh, r) => {
      prev.call(m, sh, r);
      sh.uniforms.dzW = U.dzW; sh.uniforms.dzSky = U.dzSky; sh.uniforms.dzC = U.dzC;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', VS).replace('#include <project_vertex>', VB);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', FS).replace('#include <fog_fragment>', FB);
    };
    m.customProgramCacheKey = () => key; m.needsUpdate = true;
  }

  let S = null;   // the world being shown, on a track of LOOK: { o, L, scene, sea: [materials], r, w }
  const CAM = []; let camD = 0;   // (the camera of each picture, put back after it)
  const _c = new THREE.Color(), _d = new THREE.Color();
  const build = World.build;
  World.build = function (scene, track, tex, opts) {
    const o = build.apply(this, arguments), L = LOOK[track && track.def && track.def.id];
    S = null; U.dzW.value = 0; lightsOf = null;   // (the lights looked up again: a new world may bring its own)
    if (!L || !o || !o.root || !o.dyn) return o;
    const st = S = { o, L, scene, sea: [], r: 0, w: 0, snow: !!(opts && opts.season === 'winter' && !o.noSnow) };   // (snow: render.js's snowy())
    const maps = [tex.asphalt, tex.paving, tex.curb, tex.makadam].filter(Boolean);   // (the road as render.js's applyRoad finds it: its wet materials)
    o.root.traverse(n => { for (const m of n.material ? (Array.isArray(n.material) ? n.material : [n.material]) : []) {
      if (m.color && (maps.includes(m.map) || m.userData.wear)) patch(m);   // (the see-through wear too: the same sheen over it and under it, so it blends as on a dry road)
      else if (L.sea && tex.water && m.map === tex.water && m.color && !st.sea.includes(m)) st.sea.push(m);
    } });
    if (o.asphaltMat && o.asphaltMat.color && !maps.includes(o.asphaltMat.map)) patch(o.asphaltMat);   // (a road with its own picture: Katu-Jaryk's gravel)
    if (!scene.userData.dez) { const pre = scene.onBeforeRender, post = scene.onAfterRender; scene.userData.dez = true;
      scene.onBeforeRender = function (renderer, sc, camera) { pre.apply(this, arguments);
        (CAM[camD] || (CAM[camD] = new THREE.Vector3())).copy(U.dzC.value); camD++; if (camera) U.dzC.value.setFromMatrixPosition(camera.matrixWorld);
        if (S && S.scene === this) before(S, this, renderer); };
      scene.onAfterRender = function (renderer) { post.apply(this, arguments); after(this, renderer); if (camD > 0) U.dzC.value.copy(CAM[--camD]); }; }
    return o;
  };
  const update = World.update;
  World.update = function (out, t, car, cam, rp, race) {
    update.apply(this, arguments);
    if (!S || out !== S.o) return;
    const r = race && !S.snow ? Math.max(0, Math.min(1, +race.rain || 0)) : 0, w = race && !S.snow ? Math.max(0, Math.min(1, race.water != null ? +race.water : r)) : 0;   // (in the snow: no rain's look)
    S.r = r; S.w = w; U.dzW.value = w * S.L.sheen;
  };

  // for one picture: render.js's values kept (K), this place's rain on them, then K put back after the picture (a picture inside a picture,
  // e.g. a screen's own view drawn in its object's hook, only counted: the outer one sets and puts back)
  const K = { on: false, depth: 0, sun: 0, hemi: 0, near: 0, far: 0, fog: new THREE.Color(), hor: new THREE.Color(), clear: new THREE.Color(), alpha: 1, sea: [] };
  let sun = null, hemi = null, lightsOf = null;
  function before(st, scene, renderer) {
    if (lightsOf !== scene) { lightsOf = scene; sun = hemi = null;   // (render.js's own: the scene's first of each)
      for (const n of scene.children) { if (n.isDirectionalLight && !sun) sun = n; else if (n.isHemisphereLight && !hemi) hemi = n; } }
    const L = st.L, r = st.r, f = scene.fog, W = World.waterSky;
    if (K.depth++ > 0 || !(r > 0)) return;   // (dry: as render.js has it)
    K.on = true;
    if (sun) { K.sun = sun.intensity; sun.intensity *= 1 + (L.sun - 1) * r; }
    if (hemi) { K.hemi = hemi.intensity; hemi.intensity *= 1 + (L.hemi - 1) * r; }
    if (f) {
      K.fog.copy(f.color); f.color.lerp(_d.setHex(L.fog), L.fogK * r);
      if (f.isFog) { K.near = f.near; K.far = f.far; f.near *= 1 + (L.near - 1) * r; f.far *= 1 + (L.far - 1) * r; }
      if (W && W.hor) { K.hor.copy(W.hor.value); W.hor.value.copy(f.color); }   // (the horizon the water mirrors: the haze, as render.js sets it)
      if (!scene.background) { renderer.getClearColor(K.clear); K.alpha = renderer.getClearAlpha(); renderer.setClearColor(f.color, 1); }   // (the sky behind)
      U.dzSky.value.copy(f.color).multiplyScalar(1.06);   // (what the road mirrors: the low sky, a little brighter than the haze)
    }
    if (L.sea) st.sea.forEach((m, i) => { (K.sea[i] || (K.sea[i] = new THREE.Color())).copy(m.color); m.color.lerp(_c.setHex(L.sea[0]), L.sea[1] * r); });
  }
  function after(scene, renderer) {
    if (K.depth > 0) K.depth--;
    if (K.depth > 0 || !K.on) return;
    K.on = false;
    const f = scene.fog, W = World.waterSky;
    if (sun) sun.intensity = K.sun;
    if (hemi) hemi.intensity = K.hemi;
    if (f) {
      f.color.copy(K.fog);
      if (f.isFog) { f.near = K.near; f.far = K.far; }
      if (W && W.hor) W.hor.value.copy(K.hor);
      if (!scene.background) renderer.setClearColor(K.clear, K.alpha);
    }
    if (S && S.L.sea) S.sea.forEach((m, i) => { if (K.sea[i]) m.color.copy(K.sea[i]); });
  }

  World.dez = { LOOK, U, get S() { return S; }, get K() { return { depth: K.depth, on: K.on, cams: camD }; } };   // (for the tests and tools)
})();
