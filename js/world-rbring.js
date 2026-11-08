/* =========================================================================
   WORLD — Štajerska, Bathurst, Rio de Janeiro and Crystal Palace (themes 'rbring', 'bathurst', 'rio', 'cpalace'): its own builder (World.ext.rbring), moved out of js/world.js as it was. What it uses of World comes from
   World.api: the helpers bound here once, the state that changes as API.<name>, the track being built and its theme (LOD, T, THEME)
   copied in at each build.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api;
  const {
    Chunks, GB, ICO1, IChunks, NRC, NRT, RB, TAU, WSKY, addShore, atS, atSf, box, campLot, parkedCar, clamp, cone, crAt, crH, crowdCtx, crowdFinish, crowdPut,
    crowdRun, crowdUV, cyl, gable, ico, inPoly, lerp, mergeBands, nrDecalTex, nrDem, nrDist, nrGCol, nrGH, nrGrassTex, nrGround, nrLC, nrLCf,
    nrLump, nrNear, nrPN, nrPrep, nrShade, nrSlope, nrTileGeo, nrTileOn, nrTreeGeo, pixAvg, polyDist, propFloorTable, puff, rng, roadsideProps, rock,
    shoreBand, sstep, tvHeli, vary, waterMat, waterline, wrapS, pitJunction, pitKerbs, pitOpen
  } = API;
  const { auTreeGeo, auRooGeo, auRoos, btGrassTex, btGumGeo, RIO_TP, rioTreeGeo, rioFlowerGeo, RIO_BLOOM, rioTree, rioWet, rioPits, rioExtra, rioPylon, rioPre, cpPrep, cpPark, cpTrees } = API;   // (the own parts of the worlds on this builder, in js/world-bathurst.js, js/world-rio.js, js/world-cpalace.js, loaded before this file: tools/razdeli-proge.mjs)
  let LOD, T, THEME;   // (World's, for the build under way)
  API.sync.push(() => { ({ LOD, T, THEME } = API); });

  /* ================= RED BULL RING (theme 'rbring') =================
     The Formula 1 circuit at Spielberg in Styria (4.3 km), in its real layout and heights. The terrain tiles, the land cover forest and the
     road ribbons are the Nordschleife's corridor builder (nrPrep and the nr* helpers read def.dem and def.lc); the scenery is its own: pale
     asphalt run-offs where the barriers stand far out (def.runoffTarmac: they drive like asphalt too), concrete walls and debris fences along
     the straight and past the spectators, tyre walls outside the slow corners, armco elsewhere; the pit lane with the crews' boxes, the team
     stands on the pit wall and the 300 m pit building on level ground (NR.pad); the grandstands (the covered Start-Ziel along the whole
     straight with the voestalpine wing on top, Steiermark, the long Red Bull stand up the hill, T3, Nord, T9, T10) with seated crowds, the
     orange fans on the grass with food stalls behind them, the steel bull on its arch on the infield hill, the 2024 gravel strips at Turns
     9 and 10, advertising boards on the walls, braking boards, turn numbers, marshal posts, TV towers, recovery trucks, car parks on the
     built-up land, Styrian farms. */
  const RB_SHIRTS = [[1, 0.5, 0.08], [0.98, 0.45, 0.06], [1, 0.56, 0.12], [0.95, 0.42, 0.1], [0.94, 0.94, 0.92], [0.12, 0.16, 0.36], [0.86, 0.12, 0.14], [0.98, 0.8, 0.12],
    [0.16, 0.4, 0.86], [0.12, 0.13, 0.16], [0.2, 0.6, 0.3], [0.97, 0.52, 0.1]];   // the spectators' shirts: lots of orange (the Dutch fans), Red Bull navy, Austrian red and white
  function rbAtlas(LK) {   // text boards (4 x 16 cells of 256 x 64): the turn numbers (1-10 in Styria), the braking boards, banners
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d');
    const cell = (k, bg, fg, txt, px, stripe) => { const cx = (k % 4) * 256, cy = Math.floor(k / 4) * 64; x.fillStyle = bg; x.fillRect(cx, cy, 256, 64); if (stripe) { x.fillStyle = stripe; x.fillRect(cx, cy + 56, 256, 8); x.fillRect(cx, cy, 256, 4); }
      x.fillStyle = fg; x.font = '900 ' + px + 'px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, cx + 128, cy + 33, 240); };
    const AT = LK.at, nb = LK.ban === RB_BAN ? ['#1c2856', '#fff', '#e2202c'] : ['#0b3b2a', '#fff', '#f2c21a'];   // (Bathurst's numbers bottle green and gold)
    for (let k = 1; k <= LK.nums; k++) cell(AT.num + k - 1, nb[0], nb[1], String(k), 52, nb[2]);
    ['300', '200', '100'].forEach((t, k) => cell(AT.brake + k, '#f4f4f0', '#111', t, 50, '#111'));
    LK.ban.forEach(([t, bg, fg, st], k) => cell(AT.ban + k, bg, fg, t, t.length > 10 ? 30 : 38, st));
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  const RB_BAN = [['MURTAL', '#1c2856', '#fff', '#e2202c'], ['SPIELBERG', '#e2202c', '#fff', '#fff'], ['START · ZIEL', '#16181c', '#fff', '#e2202c'], ['STEIERMARK', '#1f7a3a', '#fff', '#fff'],
    ['BERG', '#1c2856', '#fff', '#e2202c'], ['T3', '#1c2856', '#fff', '#e2202c'], ['NORD', '#1c2856', '#fff', '#e2202c'], ['T9', '#1c2856', '#fff', '#e2202c'], ['T10', '#1c2856', '#fff', '#e2202c'],
    ['DRS', '#101114', '#fff', '#39c84a'], ['STEIERMARK', '#1c2856', '#fff', '#39c84a'], ['PADDOCK', '#1c2856', '#fff', '#e2202c']];   // (the DRS boards; the painted run-offs; the paddock's glass house)
  const RB_AT = { num: 0, brake: 10, ban: 13, rbr: 13, spielberg: 14 };   // atlas cells: the turn numbers, the braking boards, the banners (RB_BAN, the grandstands' names by their text)
  // what buildRbring builds differently for each of its worlds (by THEME): the text boards, the fans, their flags and smoke, the video walls,
  // the farms, the trees and the ground's colours
  const RB_LOOK = {
    rbring: { ban: RB_BAN, at: RB_AT, nums: 10, shirts: RB_SHIRTS, smoke: true, camps: 5, trees: 'nr', seC: [1.14, 1.04, 0.84],
      flags: { stand: [{ nl: 0.5, or: 0.3, at: 0.2 }, { at: 0.5, st: 0.3, nl: 0.2 }], ga: { nl: 0.45, or: 0.25, at: 0.2, rb: 0.1 }, camp: { nl: 0.55, or: 0.2, at: 0.25 }, pole: 'at', podium: 'at' },
      vid: [['BERG', 1], ['T3', 1], ['NORD', 1], ['T10', 1]], poles: [-300, 160, -1], runoff: ['MURTAL', 'SPIELBERG', 'STEIERMARK'], straight: [-460, 300, -1],
      farm: { wall: [0.95, 0.94, 0.9], roof: [0.26, 0.24, 0.26], end: [0.92, 0.9, 0.86], barn: [0.52, 0.34, 0.2], barnRoof: [0.3, 0.28, 0.3], barnEnd: [0.5, 0.33, 0.2] },
      tvSkip: [1, 4, 7], recov: [0, 2, 3], photo: [0, 2, 3, 9], jets: [[1, 0.18, 0.2], [0.97, 0.97, 0.97], [1, 0.18, 0.2]],
      screen: { name: ['SPIELBERG', 'STEIERMARK'], km: '4,318 km', sub: '10 zavojev', fans: ['#ff7a12', '#ff8a1c', '#f26a0c', '#ff9d3a', '#f4f4f0', '#1c2856', '#e2202c'], glow: '255,128,30' },
      colMod: (P) => (x, z, c) => {   // the land cover's class 2 is farmland here (the scrub colour of the Nordschleife): maize dark green, wheat and barley golden, hay
        const f = nrLCf(x, z, 2), n = P.n5(x * 0.55 + 700, z * 0.55), m = P.n3(x * 1.6 + 300, z * 1.6), k = 0.88 + (n - 0.5) * 0.2 + (m - 0.5) * 0.1;   // pale; the meadows in lighter and darker patches, a touch darker than the Eifel's
        c[0] *= k; c[1] *= k; c[2] *= k * 0.96;
        { const fm = nrLCf(x, z, 0), yf = sstep(0.55, 0.75, P.n3(x * 0.9 + 90, z * 0.9 - 40)) * 0.75 * fm, wf = sstep(0.6, 0.8, P.n1(x * 1.3 - 210, z * 1.3 + 75)) * 0.5 * fm;   // flowering meadows: buttercup and daisy patches
          c[0] = lerp(c[0], c[0] * 1.3 + 0.08, yf); c[1] = lerp(c[1], c[1] * 1.12 + 0.04, yf); c[2] = lerp(c[2], c[2] * 0.6, yf);
          c[0] = lerp(c[0], c[0] * 1.15 + 0.12, wf); c[1] = lerp(c[1], c[1] * 1.05 + 0.1, wf); c[2] = lerp(c[2], c[2] * 1.2 + 0.14, wf); }
        if (f > 0) { const crop = P.n1(x * 0.35 + 1200, z * 0.35), col = crop < 0.42 ? [0.62, 0.86, 0.5] : crop < 0.64 ? [1.5, 1.08, 0.5] : [1.2, 1.0, 0.72];
          c[0] = lerp(c[0], col[0], f * 0.85); c[1] = lerp(c[1], col[1], f * 0.85); c[2] = lerp(c[2], col[2], f * 0.85); }
      } },
  };
  Object.assign(RB_LOOK, API.rbLook);   // (the looks of the worlds whose parts are in files of their own: js/world-bathurst.js, js/world-rio.js, js/world-cpalace.js; tools/razdeli-proge.mjs)
  function rbCrowdTex(orange) {   // seated crowd for the grandstand tiers (as Tex.crowd; the orange one for the stands full of Dutch fans)
    return Tex.crowdPic(orange ? ['#ff7a12', '#ff8a1c', '#f26a0c', '#ff9d3a', '#ff7a12', '#f4f4f0', '#1c2856', '#e2202c', '#ff8a1c', '#ffcc00']
      : ['#e63b2e', '#f5d33a', '#2f7fe0', '#f2f2f2', '#39b54a', '#ff8a1c', '#1c2856', '#e2202c', '#1a1b1f', '#1bbfd6'], orange ? 77 : 78);
  }
  function rbGravelTex() {   // the grey gravel of the 2024 strips at Turns 9 and 10: pebbles with a shadow and a highlight each
    const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d'), r = rng(2024);
    x.fillStyle = '#8f8a82'; x.fillRect(0, 0, 128, 128);
    for (let k = 0; k < 900; k++) { const px = r() * 128, py = r() * 128, rr = 0.8 + r() * 1.8, v = 120 + Math.floor(r() * 90), w2 = (a) => { for (const ox of [-128, 0, 128]) for (const oy of [-128, 0, 128]) a(px + ox, py + oy); };
      w2((X, Y) => { x.fillStyle = 'rgba(40,36,32,0.45)'; x.beginPath(); x.arc(X + 0.6, Y + 0.7, rr, 0, TAU); x.fill();
        x.fillStyle = `rgb(${v},${v - 4},${v - 12})`; x.beginPath(); x.arc(X, Y, rr, 0, TAU); x.fill();
        x.fillStyle = 'rgba(255,255,250,0.35)'; x.beginPath(); x.arc(X - rr * 0.3, Y - rr * 0.35, rr * 0.4, 0, TAU); x.fill(); }); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  }
  /* the Dutch fans' orange smoke: a plume is a column of puffs (quads facing the camera) that rise, grow, drift with the wind and thin out, a
     flare glowing at its foot; all of it animated in the vertex shader (uTime), one mesh for every plume. list: [x, y, z, colour, size] */
  const RB_WIND = [1.4, -0.7];   // (m/s, x and z: the smoke drifts and the flags fly with it)
  function rbSmokeTex() {   // a soft, lumpy puff: white, the alpha is the smoke
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), r = rng(1964);
    for (let k = 0; k < 18; k++) { const a = r() * TAU, d = r() * 11, px = 32 + Math.cos(a) * d, py = 32 + Math.sin(a) * d, rr = 8 + r() * 11, gr = x.createRadialGradient(px, py, 0, px, py, rr);
      gr.addColorStop(0, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); }
    return new THREE.CanvasTexture(c);
  }
  const RB_SMOKE_VS = ['uniform float uTime;', 'uniform vec2 uWind;', 'attribute vec2 aC;', 'attribute vec4 aP;', 'attribute vec3 aCol;', 'varying vec2 vUv;', 'varying vec3 vCol;', 'varying float vA;',
    '#include <fog_pars_vertex>',
    'void main() {',
    '  vec3 p = position, col = aCol; float sz, a, an = aP.x * 6.2832;',
    '  if (aP.y < 0.0) { sz = aP.w * (0.8 + 0.2 * sin(uTime * 21.0 + aP.x * 50.0) * sin(uTime * 6.3 + aP.x * 17.0)); a = 0.95; }',   // the flare: flickering
    '  else {',   // aP: phase, lifetime (s), rise (m), size (m)
    '    float t = fract(uTime / aP.y + aP.x), age = t * aP.y;',
    '    p.y += aP.z * (0.35 * t + 0.65 * (1.0 - (1.0 - t) * (1.0 - t)));',   // (fast off the flare, slowing)
    '    p.xz += uWind * age * (0.2 + 0.8 * t);',
    '    p.x += sin(age * 0.7 + aP.x * 40.0) * 1.5 * t; p.z += cos(age * 0.6 + aP.x * 31.0) * 1.5 * t;',
    '    sz = aP.w * (0.45 + 1.9 * sqrt(t));',
    '    a = smoothstep(0.0, 0.05, t) * pow(1.0 - t, 1.3) * 0.95;',
    '    col = mix(aCol, vec3(0.8, 0.78, 0.76), t * 0.5);',   // (paler as it thins out)
    '    an += age * 0.25 * (fract(aP.x * 7.0) - 0.5);',
    '  }',
    '  vec2 c = vec2(cos(an) * aC.x - sin(an) * aC.y, sin(an) * aC.x + cos(an) * aC.y);',
    '  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); mvPosition.xy += c * sz;',
    '  gl_Position = projectionMatrix * mvPosition;',
    '  vUv = aC * 0.5 + 0.5; vCol = col * (0.88 + 0.1 * c.y); vA = a;',   // (lighter on top)
    '  #include <fog_vertex>',
    '}'].join('\n');
  const RB_SMOKE_FS = ['uniform sampler2D uMap;', 'varying vec2 vUv;', 'varying vec3 vCol;', 'varying float vA;', '#include <fog_pars_fragment>',
    'void main() { float a = texture2D(uMap, vUv).a * vA; if (a < 0.005) discard; gl_FragColor = vec4(vCol, a);', '  #include <fog_fragment>', '}'].join('\n');
  const RB_PLUME = { per: 32, life: 10, lifeV: 4, rise: 18, riseV: 10, flare: 0.3 };   // (a list entry's 6th item overrides it: Ouninpohja's grills and chimneys)
  function rbSmoke(list, uTime, tex, wind) {
    const n = list.reduce((a, e) => a + (e[5] || RB_PLUME).per + ((e[5] || RB_PLUME).flare ? 1 : 0), 0), P = new Float32Array(n * 12), C2 = new Float32Array(n * 8), A = new Float32Array(n * 16), K = new Float32Array(n * 12), I = [], r = rng(1965);
    let q = 0;
    const put = (x, y, z, ph, life, rise, size, col) => {
      for (let v = 0; v < 4; v++) { const o = q * 4 + v; P[o * 3] = x; P[o * 3 + 1] = y; P[o * 3 + 2] = z; C2[o * 2] = v & 1 ? 1 : -1; C2[o * 2 + 1] = v & 2 ? 1 : -1;
        A[o * 4] = ph; A[o * 4 + 1] = life; A[o * 4 + 2] = rise; A[o * 4 + 3] = size; K[o * 3] = col[0]; K[o * 3 + 1] = col[1]; K[o * 3 + 2] = col[2]; }
      const b = q * 4; I.push(b, b + 1, b + 3, b, b + 3, b + 2); q++; };
    for (const [x, y, z, col, sz, pl] of list) {
      const L = pl || RB_PLUME, PER = L.per, life = L.life + r() * L.lifeV, rise = L.rise + r() * L.riseV;
      for (let k = 0; k < PER; k++) put(x + (r() - 0.5) * 0.6, y + 0.5, z + (r() - 0.5) * 0.6, (k + r() * 0.5) / PER, life * (0.85 + r() * 0.3), rise * (0.8 + r() * 0.4), sz * (0.8 + r() * 0.4), col);
      if (L.flare) put(x, y + 1.0, z, r(), -1, 0, L.flare, [1, 0.66, 0.4]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aC', new THREE.BufferAttribute(C2, 2)); g.setAttribute('aP', new THREE.BufferAttribute(A, 4)); g.setAttribute('aCol', new THREE.BufferAttribute(K, 3));
    g.setIndex(I); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    const mat = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uMap: { value: null }, uWind: { value: new THREE.Vector2(...(wind || RB_WIND)) } }]),
      vertexShader: RB_SMOKE_VS, fragmentShader: RB_SMOKE_FS, transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide });
    mat.uniforms.uTime = uTime; mat.uniforms.uMap.value = tex;   // (after the merge: it would copy them)
    const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 4; m.matrixAutoUpdate = false; m.name = 'smoke';
    return m;
  }
  // flags on poles that wave (also Monterey's and Riverside's): the shared waving cloths of js/world-zastave.js (World.flagMesh), the cloth
  // in stripes (top to bottom). list: [x, y (the top of the pole), z, the way the cloth flies (radians from +x), stripes, width, height]; its
  // geometry, material and mesh made with Math.random as they always were (a seeded race runs as before); the flags the build put up
  // elsewhere (API.flags: the campsites', the marshals') in the same mesh
  function rbFlags(list, uTime) {
    return World.flagMesh(list.map(([x, y, z, rot, cols, W, H]) => [x, y - 0.05, z, rot, cols, W, H]).concat(API.flags.take()), uTime, { tier: LOD.tier });   // (and the build's other flags: the camps', the marshals')
  }
  // the video walls' pictures, four 256 x 128 frames side by side (the walls show one after another): the race from behind a car, the
  // standings (the game's own drivers), the orange fans in their smoke, the map of the circuit (T's centre line)
  function rbScreenTex(LK) {
    const SC = LK.screen, c = document.createElement('canvas'); c.width = 1024; c.height = 128; const x = c.getContext('2d'), r = rng(1967), F = '"Russo One", "Arial Black", Arial, sans-serif';
    const tag = (ox, t, bg) => { x.fillStyle = bg || '#e2202c'; x.fillRect(ox + 8, 8, 40, 16); x.fillStyle = '#fff'; x.font = '900 11px ' + F; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, ox + 28, 17); };
    { const ox = 0, g = x.createLinearGradient(0, 0, 0, 60);   // 1: the race
      g.addColorStop(0, '#7fb2e8'); g.addColorStop(1, '#cfe3f6'); x.fillStyle = g; x.fillRect(ox, 0, 256, 60);
      x.fillStyle = '#3f6a3a'; x.beginPath(); x.moveTo(ox, 60); for (let k = 0; k <= 16; k++) x.lineTo(ox + k * 16, 44 + Math.sin(k * 1.3) * 6 + r() * 4); x.lineTo(ox + 256, 60); x.fill();
      x.fillStyle = '#5d8f3c'; x.fillRect(ox, 58, 256, 70);
      x.fillStyle = '#5a5c60'; x.beginPath(); x.moveTo(ox + 112, 58); x.lineTo(ox + 146, 58); x.lineTo(ox + 256, 128); x.lineTo(ox, 128); x.fill();
      for (let k = 0; k < 7; k++) { const t0 = k / 7, t1 = (k + 0.5) / 7, yA = 58 + 70 * t0 * t0, yB = 58 + 70 * t1 * t1, xa = (t) => 112 - 112 * t * t, xb = (t) => 146 + 110 * t * t;   // kerbs
        x.fillStyle = k % 2 ? '#fff' : '#e2202c'; x.beginPath(); x.moveTo(ox + xa(t0), yA); x.lineTo(ox + xa(t1), yB); x.lineTo(ox + xa(t1) + 8 * t1, yB); x.lineTo(ox + xa(t0) + 8 * t0, yA); x.fill();
        x.beginPath(); x.moveTo(ox + xb(t0), yA); x.lineTo(ox + xb(t1), yB); x.lineTo(ox + xb(t1) - 8 * t1, yB); x.lineTo(ox + xb(t0) - 8 * t0, yA); x.fill(); }
      const cx = ox + 128, cy = 100;   // a racing car from behind: the wheels, the body, the rear wing
      x.fillStyle = '#141416'; x.fillRect(cx - 44, cy - 6, 18, 24); x.fillRect(cx + 26, cy - 6, 18, 24);
      x.fillStyle = '#1c2856'; x.beginPath(); x.moveTo(cx - 26, cy + 12); x.lineTo(cx - 14, cy - 12); x.lineTo(cx + 14, cy - 12); x.lineTo(cx + 26, cy + 12); x.fill();
      x.fillStyle = '#e2202c'; x.fillRect(cx - 10, cy - 8, 20, 6); x.fillStyle = '#ffcc00'; x.fillRect(cx - 4, cy - 20, 8, 12);
      x.fillStyle = '#1c2856'; x.fillRect(cx - 30, cy - 30, 60, 8); x.fillStyle = '#e2202c'; x.fillRect(cx - 30, cy - 24, 60, 2); x.fillStyle = '#101114'; x.fillRect(cx - 28, cy - 22, 4, 12); x.fillRect(cx + 24, cy - 22, 4, 12);
      x.fillStyle = '#ff3030'; x.fillRect(cx - 3, cy + 4, 6, 4);
      tag(ox, 'LIVE'); }
    { const ox = 256; x.fillStyle = '#101a3a'; x.fillRect(ox, 0, 256, 128);   // 2: the standings
      const tc = ['#1c2856', '#e2202c', '#1f7a3a', '#ff8a1c', '#f4f4f0', '#2f7fe0', '#1bbfd6', '#ffcc00'];
      x.textBaseline = 'middle'; x.font = '900 12px ' + F;
      for (let k = 0; k < 8; k++) { const y = 10 + k * 14.5, nm = Core.DRIVER_NAMES[k].split(' ').pop().slice(0, 3).toUpperCase();
        x.fillStyle = k % 2 ? '#16224a' : '#1b2a58'; x.fillRect(ox + 60, y - 6, 136, 13); x.fillStyle = tc[k]; x.fillRect(ox + 82, y - 5, 4, 11);
        x.fillStyle = '#fff'; x.textAlign = 'right'; x.fillText(String(k + 1), ox + 78, y + 1); x.textAlign = 'left'; x.fillText(nm, ox + 92, y + 1);
        x.fillStyle = '#ffcc00'; x.textAlign = 'right'; x.fillText(k ? '+' + (k * 0.8 + r() * 0.7).toFixed(1) : '', ox + 192, y + 1); }
      tag(ox, 'KROG', '#1c2856'); }
    { const ox = 512; x.fillStyle = '#3b3f48'; x.fillRect(ox, 0, 256, 128);   // 3: the fans (Styria's orange ones in their smoke)
      const cols = SC.fans;
      for (let row = 0; row < 12; row++) for (let k = 0; k < 44; k++) { const px = ox + k * 6 + (row % 2) * 3, py = 26 + row * 9; x.fillStyle = cols[Math.floor(r() * cols.length)]; x.fillRect(px, py + 3, 5, 6); x.fillStyle = r() < 0.6 ? '#f1c7a1' : '#a86f45'; x.fillRect(px + 1, py, 3, 3); }
      for (let k = 0; k < 9; k++) { const px = ox + 20 + r() * 216, py = 20 + r() * 50, rr = 16 + r() * 22, gr = x.createRadialGradient(px, py, 0, px, py, rr);
        gr.addColorStop(0, 'rgba(' + SC.glow + ',0.85)'); gr.addColorStop(1, 'rgba(' + SC.glow + ',0)'); x.fillStyle = gr; x.fillRect(ox, 0, 256, 128); }
      tag(ox, 'LIVE'); }
    { const ox = 768; x.fillStyle = '#1c2856'; x.fillRect(ox, 0, 256, 128);   // 4: the circuit
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < T.N; i++) { x0 = Math.min(x0, T.px[i]); x1 = Math.max(x1, T.px[i]); z0 = Math.min(z0, T.pz[i]); z1 = Math.max(z1, T.pz[i]); }
      const sc = Math.min(150 / (x1 - x0), 96 / (z1 - z0)), mx = ox + 150 - (x0 + x1) / 2 * sc, mz = 66 - (z0 + z1) / 2 * sc;
      x.strokeStyle = '#fff'; x.lineWidth = 4; x.lineJoin = 'round'; x.beginPath();
      for (let i = 0; i <= T.N; i += 4) { const k = i % T.N; if (i === 0) x.moveTo(mx + T.px[k] * sc, mz + T.pz[k] * sc); else x.lineTo(mx + T.px[k] * sc, mz + T.pz[k] * sc); }
      x.closePath(); x.stroke();
      x.fillStyle = '#e2202c'; x.beginPath(); x.arc(mx + T.px[0] * sc, mz + T.pz[0] * sc, 5, 0, TAU); x.fill();
      x.fillStyle = '#fff'; x.font = '900 13px ' + F; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(SC.name[0], ox + 10, 40); x.fillText(SC.name[1], ox + 10, 56);
      x.fillStyle = '#ffcc00'; x.font = '900 10px ' + F; x.fillText(SC.km, ox + 10, 76); x.fillText(SC.sub, ox + 10, 90); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  /* ---- the Red Bull Ring's air show (rbAir builds it at the end of buildRbring, rbAirStep runs it from World.update):
     - the TV helicopter (tvHeli) crosses the main straight once a race, low in front of the player's car on its second run down the straight
       (not in the start's scramble, not in a corner); then it is gone, it never hangs about in the way
     - three jets fly down the straight over the grid before the start (game.js asks with air.go and films it with air.shot: a camera on the
       grid, low, looking back up the straight), trailing red, white and red smoke that hangs over the straight for a while ---- */
  const RB_JET = { v: 70, d0: -470, d1: 700, y: 48, smoke: [-420, 420], dx: 15 };   // the jets: speed, from / to (m from the start line), height, smoke on, spacing
  function rbAir(root, ownTex, nrG, smokeCols) {
    const L = T.len, sAt = (d) => (((T.startS + d) % L) + L) % L, W = (d) => T.idx(sAt(d));
    // the helicopter's crossing: 170 m past the start line (clear of the wing, the pit building's tower, the grandstands and the Energy Station),
    // in from the side with the higher ground
    const { heli, rotor, tail } = tvHeli(root); heli.visible = false;
    const iX = W(170), gs = (sd) => nrG(T.px[iX] + T.nx[iX] * sd * 60, T.pz[iX] + T.nz[iX] * sd * 60), sdX = gs(1) > gs(-1) ? -1 : 1;
    const X = { x: T.px[iX], z: T.pz[iX], y: T.hy[iX], nx: T.nx[iX] * sdX, nz: T.nz[iX] * sdX, tx: T.tx[iX], tz: T.tz[iX], d: 170 };
    // the jets' line: the straight from 300 m before to 250 m after the start line; n: across it
    const i0 = W(0), ia = W(-300), ib = W(250), ux0 = T.px[ib] - T.px[ia], uz0 = T.pz[ib] - T.pz[ia], ul = Math.hypot(ux0, uz0);
    const J = { x: T.px[i0], z: T.pz[i0], y: T.hy[i0], ux: ux0 / ul, uz: uz0 / ul, nx: -uz0 / ul, nz: ux0 / ul };
    // a jet (+x forward, 12.4 m, 7.6 m span): white, a red spine and wing tips, the dark canopy
    const g = new GB(), Wc = [0.93, 0.93, 0.95], Rc = [0.82, 0.1, 0.14], Gc = [0.1, 0.12, 0.16];
    const hull = (x0, ya0, yb0, hw0, x1, ya1, yb1, hw1, col, colTop) => {
      const a = [[x0, ya0, -hw0], [x0, ya0, hw0], [x0, yb0, hw0], [x0, yb0, -hw0]], b = [[x1, ya1, -hw1], [x1, ya1, hw1], [x1, yb1, hw1], [x1, yb1, -hw1]], inn = [(x0 + x1) / 2, (ya0 + yb0 + ya1 + yb1) / 4, 0];
      g.quadO(a[0], a[1], b[1], b[0], col, inn); g.quadO(a[3], a[2], b[2], b[3], colTop || col, inn); g.quadO(a[0], a[3], b[3], b[0], col, inn); g.quadO(a[1], a[2], b[2], b[1], col, inn);
      g.quadO(b[0], b[1], b[2], b[3], col, inn); g.quadO(a[0], a[1], a[2], a[3], col, inn);
    };
    hull(6.2, -0.05, 0.1, 0.06, 3.6, -0.5, 0.6, 0.5, Wc); hull(3.6, -0.5, 0.6, 0.5, -4.8, -0.45, 0.62, 0.55, Wc, Rc); hull(-4.8, -0.45, 0.62, 0.55, -6.2, -0.2, 0.35, 0.3, Wc);
    hull(3.4, 0.6, 1.05, 0.3, 1.2, 0.6, 1.0, 0.36, Gc);                                                    // canopy
    for (const sd of [-1, 1]) for (const [y, dn] of [[0.05, 1], [-0.02, -1]]) {                             // delta wings (top and bottom), red tips
      g.triO([2.0, y, sd * 0.5], [-4.3, y, sd * 3.8], [-4.9, y, sd * 0.5], Wc, [-2, y - dn, sd * 1.5]);
      g.triO([-3.9, y + 0.001, sd * 3.2], [-4.3, y + 0.001, sd * 3.8], [-4.55, y + 0.001, sd * 3.2], Rc, [-4.2, y - dn, sd * 3.4]); }
    for (const sd of [-1, 1]) g.triO([-3.2, 0.6, sd * 0.02], [-6.1, 3.0, sd * 0.02], [-6.3, 0.6, sd * 0.02], Rc, [-5, 1.2, -sd]);   // fin
    const jg = g.geometry(), jm = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x4a4a50 }), jets = [];   // (seen from below: lit a little of their own)
    for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(jg, jm); m.visible = false; m.castShadow = true; m.rotation.order = 'YZX'; root.add(m); jets.push(m); }
    // their smoke: a ribbon each behind them (up to 120 samples, 0.1 s apart), turned to the camera every frame, soft across (the texture)
    const NP = 120, tc = document.createElement('canvas'); tc.width = 64; tc.height = 32; const tx2 = tc.getContext('2d'), r = rng(1968);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) { const v = Math.sin(y / 31 * Math.PI) ** 1.4 * (0.75 + 0.25 * r()); tx2.fillStyle = `rgba(255,255,255,${v.toFixed(3)})`; tx2.fillRect(x, y, 1, 1); }
    const stex = ownTex(new THREE.CanvasTexture(tc)); stex.wrapS = THREE.RepeatWrapping;
    const trails = smokeCols.map((col) => {
      const gt = new THREE.BufferGeometry(), P = new Float32Array(NP * 6), C = new Float32Array(NP * 8), U = new Float32Array(NP * 4), I = [];
      for (let k = 0; k < NP; k++) { U[k * 4] = k * 0.15; U[k * 4 + 1] = 0; U[k * 4 + 2] = k * 0.15; U[k * 4 + 3] = 1; if (k) { const a = (k - 1) * 2; I.push(a, a + 1, a + 3, a, a + 3, a + 2); } }
      gt.setAttribute('position', new THREE.BufferAttribute(P, 3).setUsage(THREE.DynamicDrawUsage)); gt.setAttribute('color', new THREE.BufferAttribute(C, 4).setUsage(THREE.DynamicDrawUsage));
      gt.setAttribute('uv', new THREE.BufferAttribute(U, 2)); gt.setIndex(I); gt.setDrawRange(0, 0); gt.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      const m = new THREE.Mesh(gt, new THREE.MeshBasicMaterial({ map: stex, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      m.frustumCulled = false; m.renderOrder = 4; m.matrixAutoUpdate = false; m.name = 'jet smoke'; root.add(m);
      return { m, col, s: [], P, C };
    });
    return { heli, rotor, tail, X, J, jets, trails, on: false, fly: null, flyDone: false, t: 0, news: null, nNews: 0, v3: new THREE.Vector3(),
      go: false, t0: -1, shot: { px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0, fov: 55, fogD: 95, sky: true } };   // (filmed from the grid, looking up: the sky and its clouds)
  }
  function rbAirStep(A, t, car) {
    const raw = t - A.t, dt = clamp(raw, 0, 0.25); A.t = t;
    if (!car) {   // no car to follow (World.update(W, 0, null): the scenery's pose at time 0, as the world test takes it): nothing in the air
      A.go = false; A.t0 = -1; A.heli.visible = A.on = false; A.fly = null; A.flyDone = false;
      for (const m of A.jets) { m.visible = false; m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); }
      for (const tr of A.trails) { tr.s.length = 0; tr.P.fill(0); tr.C.fill(0); tr.m.geometry.setDrawRange(0, 0); tr.m.visible = false; }
      return;
    }
    const cam = typeof Render !== 'undefined' && Render.camera && Render.camera.isCamera ? Render.camera : null;
    /* the jets: asked for by game.js (A.go) as the race is set up; while the shot runs (A.shot, the first ~6 s) the camera stands on the grid and
       follows them in; the smoke hangs on, drifting and spreading, for ~20 s, and never where the camera flies */
    const J = A.J, R = RB_JET;
    if (A.go) { A.go = false; A.t0 = t; for (const tr of A.trails) tr.s.length = 0; }
    if (A.t0 >= 0) {
      const tt = t - A.t0, d = R.d0 + R.v * tt, climb = Math.max(0, d - 380) * 0.35, bank = Math.sin(tt * 0.7) * 0.03;
      const cx = J.x + J.ux * d, cz = J.z + J.uz * d, cy = J.y + R.y + climb, fly = d < R.d1;
      A.jets.forEach((m, k) => {
        const o = (k - 1) * R.dx, back = k === 1 ? 0 : 6;   // (a V: the outer two a little behind)
        m.visible = fly; m.position.set(cx + J.nx * o - J.ux * back, cy + (k === 1 ? 0.8 : 0), cz + J.nz * o - J.uz * back);
        m.rotation.set(bank, -Math.atan2(J.uz, J.ux), Math.atan2(climb > 0 ? 0.35 : 0, 1));
        const tr = A.trails[k], last = tr.s[tr.s.length - 1];
        if (fly && d > R.smoke[0] && d < R.smoke[1] && (!last || t - last[3] >= 0.1)) { tr.s.push([m.position.x - J.ux * 6.3, m.position.y + 0.1, m.position.z - J.uz * 6.3, t]); if (tr.s.length > 120) tr.s.shift(); }
      });
      if (tt > 60) A.t0 = -1;
      // the shot: on the grid 25 m past the start line, 2.2 m up, looking back up the straight at the formation (up to 48 degrees above the horizon)
      const S = A.shot, ex = J.x + J.ux * 25, ez = J.z + J.uz * 25, ey = J.y + 2.2, hd = Math.max(8, Math.hypot(cx - ex, cz - ez)), el = Math.min(Math.atan2(cy - ey, hd), 0.84);
      const lx = cx - ex, lz = cz - ez, ll = Math.hypot(lx, lz) || 1, fwd = (lx * J.ux + lz * J.uz) < 0 ? 1 : -1;   // (while they come: at them; once over: straight up the road)
      const dx = fwd > 0 ? lx / ll : -J.ux, dz = fwd > 0 ? lz / ll : -J.uz;
      S.px = ex; S.py = ey; S.pz = ez; S.tx = ex + dx * 60; S.tz = ez + dz * 60; S.ty = ey + Math.tan(fwd > 0 ? el : 0.84) * 60;
    }
    for (const tr of A.trails) {   // the ribbons, turned to the camera
      const n = tr.s.length, g = tr.m.geometry, P = tr.P, C = tr.C;
      tr.m.visible = n > 1 && t - tr.s[n - 1][3] < 22;   // (gone once the last of it has faded)
      if (!tr.m.visible) continue;   // (and then nothing to turn till the next fly-past: not every frame of the race)
      for (let k = 0; k < n; k++) {
        const s = tr.s[k], age = t - s[3], x = s[0] + RB_WIND[0] * 0.35 * age, y = s[1] - 0.12 * age, z = s[2] + RB_WIND[1] * 0.35 * age;
        const q = tr.s[Math.min(n - 1, k + 1)], p0 = tr.s[Math.max(0, k - 1)], tx = q[0] - p0[0], ty = q[1] - p0[1], tz = q[2] - p0[2];
        let vx = cam ? cam.position.x - x : 0, vy = cam ? cam.position.y - y : 1, vz = cam ? cam.position.z - z : 0;
        let sx = ty * vz - tz * vy, sy = tz * vx - tx * vz, sz = tx * vy - ty * vx; const sl = Math.hypot(sx, sy, sz) || 1, w = (1.6 + 0.55 * age) / sl; sx *= w; sy *= w; sz *= w;
        P[k * 6] = x - sx; P[k * 6 + 1] = y - sy; P[k * 6 + 2] = z - sz; P[k * 6 + 3] = x + sx; P[k * 6 + 4] = y + sy; P[k * 6 + 5] = z + sz;
        const dc = cam ? Math.hypot(cam.position.x - x, cam.position.y - y, cam.position.z - z) : 1e3;   // (the phone's chase camera flies at the smoke's height: none right at it)
        const a = clamp(1 - age / 22, 0, 1) * clamp(age * 3, 0.35, 1) * 0.85 * clamp((dc - 30) / 50, 0, 1);
        for (const o of [0, 4]) { C[k * 8 + o] = tr.col[0]; C[k * 8 + o + 1] = tr.col[1]; C[k * 8 + o + 2] = tr.col[2]; C[k * 8 + o + 3] = a; }
      }
      g.setDrawRange(0, Math.max(0, n - 1) * 6); g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
    }
    /* the helicopter: once a race, when the player's car comes down the straight for the second time; timed (as Pikes Peak's fly-over) to be over
       the road A m in front of the car at height H, both chosen for the camera in use: in the frame, clear of the car */
    const m = A.heli, p = m.position, e = (k) => 1 - Math.exp(-dt * k), X = A.X;
    if (!car || !car.isPlayer) { m.visible = A.on = false; A.fly = null; A.flyDone = false; return; }
    const Ln = T.len, sq = car.q && car.q.i >= 0 ? car.q.s : T.query(car.x, car.z, -1, {}).s, d0 = ((sq - T.startS) % Ln + Ln) % Ln, d = d0 > Ln / 2 ? d0 - Ln : d0, ay = car.roadY || 0;
    if (car.dist < Ln * 0.5) { A.fly = null; A.flyDone = false; }   // (a new race)
    if (!A.finOnly && !A.fly && !A.flyDone && car.dist > Ln * 0.5 && d > -240 && d < -110) { A.fly = { x: -1, A: 25, H: 11, gy: -1e9, d0: d }; A.news = { key: 'heliRb', n: ++A.nNews }; }
    const F = A.fly, prevX = p.x, prevZ = p.z, wasOn = A.on; let on = false;
    if (F) {
      if (cam) {
        const kF = 1 / Math.tan(cam.fov / 2 * Math.PI / 180);
        const proj = (x, y, z, dx, dy, dz) => { const v = A.v3.set(x - dx, y - dy, z - dz).applyMatrix4(cam.matrixWorldInverse); if (v.z > -1) return null; const dd = -v.z; v.applyMatrix4(cam.projectionMatrix); return [v.x * cam.aspect, v.y, dd]; };
        let best = null, bs = -1e9;
        for (const Aa of [40, 32, 25, 19, 14]) for (const H of [22, 16, 11, 8, 6]) {   // (as high and as far as the frame allows: small on the screen)
          const j = T.idx(sAtS(X.d - Aa)), ex = T.px[j] - car.x, ez = T.pz[j] - car.z, ey = T.hy[j] - ay, h = proj(X.x, X.y + H + 1.2, X.z, ex, ey, ez), c = proj(T.px[j], T.hy[j] + 0.7, T.pz[j], ex, ey, ez);
          if (!h || !c) continue;
          const rr = 6.5 * kF / h[2], sep = Math.hypot(h[0] - c[0], h[1] - c[1]) - rr - 2 * kF / c[2];
          if (Math.abs(h[0]) > cam.aspect - rr * 0.6 || Math.abs(h[1]) > 0.86 - rr * 0.6 || sep < 0.18) continue;
          const sc = Math.min(sep, 0.5) + 0.016 * H + 0.006 * Aa;
          if (sc > bs) { bs = sc; best = [Aa, H]; }
        }
        if (best) { const k = F.x < -0.7 ? 1 : e(1.5); F.A += (best[0] - F.A) * k; F.H += (best[1] - F.H) * k; }
      }
      // in by the car's progress (over the road when the car is A m short of it, whatever its speed), then away at ~0.3 a second
      if (F.x < 0) F.x = Math.max(F.x, -1 + clamp((d - F.d0) / Math.max(20, X.d - F.A - F.d0), 0, 1) ** 1.2); else F.x += 0.3 * dt;
      if (F.x < 0 && d > X.d - F.A) F.x = 0;
      if (F.x >= 1) { A.fly = null; A.flyDone = true; }
      else {
        const x = F.x, u = 105 * (0.45 * x + 0.55 * x * x * x), a = 16 * x, hx = X.x + X.nx * u + X.tx * a, hz = X.z + X.nz * u + X.tz * a;
        const du = 105 * (0.45 + 1.65 * x * x), vx = X.nx * du + X.tx * 16, vz = X.nz * du + X.tz * 16, vl = Math.hypot(vx, vz);
        let gy = -1e9; for (const Ls of [0, 10, 20]) gy = Math.max(gy, nrGround(hx + vx / vl * Ls, hz + vz / vl * Ls));
        F.gy = F.gy < -1e8 ? gy : F.gy + (gy - F.gy) * e(gy > F.gy ? 4 : 2.5);
        p.set(hx, Math.max(X.y + F.H * (1 + 0.7 * x * x), F.gy + 10) + 0.3 * Math.sin(t * 0.9), hz); on = true;
      }
    }
    if (A.finOnly && car.finished) {   // (Rio: no pass over the track; the helicopter comes once the player is over the line, and hangs over the finish)
      if (A.fin == null) A.fin = t;
      const k = sstep(0, 9, t - A.fin), Hh = A.H0 || (A.H0 = { i: T.idx(sAtS(60)) }), j = Hh.i, o = -14 - 260 * (1 - k), w = 0.6 * Math.sin(t * 0.21);
      const hx = T.px[j] + T.nx[j] * o + T.tx[j] * (40 * (1 - k) + 6 * w), hz = T.pz[j] + T.nz[j] * o + T.tz[j] * (40 * (1 - k) + 6 * w);
      p.set(hx, T.hy[j] + 26 + 34 * (1 - k) + 0.4 * Math.sin(t * 0.9), hz); on = true;
    } else if (A.finOnly) A.fin = null;
    m.visible = A.on = on;
    if (!on) return;
    // attitude: nose along its flight, banked into the turn, the nose down with speed
    if (!wasOn) { A.yaw = Math.atan2(car.z - p.z, car.x - p.x); A.vx = A.vz = A.ac = A.al = 0; }
    else if (dt > 1e-4) { const vx = (p.x - prevX) / dt, vz = (p.z - prevZ) / dt, c = Math.cos(A.yaw), sn = Math.sin(A.yaw), dvx = (vx - A.vx) / dt, dvz = (vz - A.vz) / dt, k = e(3);
      A.ac += (dvx * c + dvz * sn - A.ac) * e(2); A.al += (dvz * c - dvx * sn - A.al) * e(2); A.vx += (vx - A.vx) * k; A.vz += (vz - A.vz) * k; }
    const sp = Math.hypot(A.vx, A.vz), wv = sstep(2, 9, sp), lx = car.x - p.x, lz = car.z - p.z, ll = Math.hypot(lx, lz) || 1, wrap = (a) => a - TAU * Math.round(a / TAU);
    A.yaw += wrap(Math.atan2(lerp(lz / ll, A.vz / (sp || 1), wv), lerp(lx / ll, A.vx / (sp || 1), wv)) - A.yaw) * e(1.6);
    m.rotation.set(clamp(A.al * 0.035, -0.35, 0.35), -A.yaw, -clamp(0.004 * sp + 0.02 * A.ac, -0.12, 0.25));
    A.rotor.rotation.y = (t * 41) % TAU; A.tail.rotation.z = (t * 73) % TAU;
  }
  const sAtS = (d) => (((T.startS + d) % T.len) + T.len) % T.len;   // (metres from the start line -> s)
  /* ---- the Red Bull Ring's podium on the pit building's roof terrace, under the wing-shaped canopy, facing the straight (built by buildRbring,
     shown by game.js after the race: show(colours of the first three), step() from World.update, hide()): three steps, the first three in
     their cars' colours (the winner with the cup over the head, the others spraying champagne from ~2 s on, jumping), orange smoke either side,
     and the camera for it (shot: from the straight, a long lens) ---- */
  function rbPodium(root, at, uTime) {
    const { x: cx, z: cz, y: cy, tx, tz, nx, nz } = at, fx = -nx, fz = -nz;   // f: the way they face (to the straight); t: along it
    const place = (g, u, v) => {   // local -> world (local: x to the viewer's right = -t, y up, z towards the viewer = f; u: along the straight, v: towards it)
      const a = g.attributes.position.array, nn = g.attributes.normal.array;
      for (let k = 0; k < a.length; k += 3) { const lx = a[k], ly = a[k + 1], lz = a[k + 2]; a[k] = cx + tx * (u - lx) + fx * (lz + v); a[k + 1] = cy + ly; a[k + 2] = cz + tz * (u - lx) + fz * (lz + v);
        const ax = nn[k], az = nn[k + 2]; nn[k] = -tx * ax + fx * az; nn[k + 2] = -tz * ax + fz * az; }
      g.computeBoundingSphere(); return g; };
    const prism = (g, a, b, r, col) => {   // a square bar between two points
      const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(...d), t = d.map(v => v / l), h = Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      let u = [t[1] * h[2] - t[2] * h[1], t[2] * h[0] - t[0] * h[2], t[0] * h[1] - t[1] * h[0]]; const ul = Math.hypot(...u); u = u.map(v => v / ul);
      const w = [t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0]], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
      const c = (p, i) => { const an = i * Math.PI / 2 + Math.PI / 4, cs = Math.cos(an) * r, sn = Math.sin(an) * r; return [p[0] + u[0] * cs + w[0] * sn, p[1] + u[1] * cs + w[1] * sn, p[2] + u[2] * cs + w[2] * sn]; };
      for (let i = 0; i < 4; i++) g.quadO(c(a, i), c(a, i + 1), c(b, i + 1), c(b, i), col, m);
      g.quadO(c(b, 0), c(b, 1), c(b, 2), c(b, 3), col, m); };
    const SUIT = [1, 0, 1], SK = [0.86, 0.67, 0.53], DK = [0.12, 0.12, 0.14], GOLD = [0.98, 0.78, 0.25], BOT = [0.1, 0.3, 0.16];
    const figure = (k) => {   // a driver in race overalls (SUIT: the car's colour, set by show) with a cap; 0 the winner (the cup up), 1 / 2 a bottle
      const g = new GB();
      for (const sd of [-1, 1]) prism(g, [sd * 0.11, 0, 0], [sd * 0.11, 0.88, 0], 0.085, SUIT);
      box(g, 0, 0.86, 0, 0.44, 0.62, 0.26, 0, SUIT); box(g, 0, 1.48, 0, 0.12, 0.08, 0.12, 0, SK); box(g, 0, 1.54, 0, 0.22, 0.25, 0.22, 0, SK, DK);
      box(g, 0, 1.76, 0.02, 0.24, 0.07, 0.3, 0, DK);   // cap
      if (k === 0) { for (const sd of [-1, 1]) prism(g, [sd * 0.24, 1.42, 0], [sd * 0.13, 2.02, 0.06], 0.06, SUIT);
        cyl(g, 0, 2.02, 0.06, 0.07, 0.16, 8, GOLD); cyl(g, 0, 2.18, 0.06, 0.06, 0.18, 8, GOLD, null, 0.16); cyl(g, 0, 2.36, 0.06, 0.16, 0.05, 10, GOLD, GOLD); }   // the cup
      else { prism(g, [0.24, 1.42, 0], [0.34, 1.78, 0.34], 0.06, SUIT); prism(g, [-0.24, 1.42, 0], [-0.3, 0.95, 0.08], 0.06, SUIT);
        prism(g, [0.34, 1.76, 0.32], [0.4, 1.98, 0.6], 0.045, BOT); }   // the bottle, up and out
      const geo = g.geometry(), C = geo.attributes.color.array, suit = [];
      for (let q = 0; q < C.length; q += 3) if (C[q] === 1 && C[q + 1] === 0 && C[q + 2] === 1) suit.push(q);
      return { geo, suit };
    };
    // the steps (2nd on the viewer's left, 1st in the middle, 3rd on the right), a navy backdrop, the cup's plinth
    const NV = [0.12, 0.16, 0.32], WH = [0.94, 0.94, 0.95], STEP = [[0, 0.6], [1.9, 0.45], [-1.9, 0.3]];   // [u, height]: 1st, 2nd, 3rd
    const steps = new THREE.Group(), mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    STEP.forEach(([u, h]) => { const gs = new GB(); box(gs, 0, 0, 0, 1.7, h, 1.4, 0, NV, WH); box(gs, 0, h - 0.004, 0.69, 0.5, 0.02, 0.02, 0, [0.86, 0.12, 0.16]); const m = new THREE.Mesh(place(gs.geometry(), u, 0), mat); m.castShadow = m.receiveShadow = true; steps.add(m); });
    { const gb = new GB(); box(gb, 0, 0, 0, 7.2, 3.1, 0.12, 0, NV, NV); const m = new THREE.Mesh(place(gb.geometry(), 0, -1.1), mat); m.receiveShadow = true; steps.add(m); }   // the backdrop
    root.add(steps);
    const figs = [0, 1, 2].map((k) => { const f = figure(k), m = new THREE.Mesh(place(f.geo, STEP[k][0], 0), mat); m.castShadow = true; m.visible = false; m.position.y = STEP[k][1]; root.add(m); return { m, suit: f.suit, k }; });
    // the champagne: foam from the two bottles, arcing over the winner and out towards the straight (as the smoke: animated in the shader)
    const spray = [], r = rng(1970);
    for (const k of [1, 2]) { const u = STEP[k][0] - 0.4, h = STEP[k][1] + 2.0, px = cx + tx * u + fx * 0.6, pz = cz + tz * u + fz * 0.6, py = cy + h;
      for (let n = 0; n < 60; n++) spray.push([px, py, pz, (k === 1 ? 1 : -1) * (1.2 + r() * 1.8), 1.2 + r() * 1.6, 1.6 + r() * 2.0, r()]); }   // (over the winner, under the canopy)
    const NS = spray.length, P = new Float32Array(NS * 12), C2 = new Float32Array(NS * 8), V = new Float32Array(NS * 16), I = [];
    spray.forEach(([x, y, z, vu, vy, vf, ph], q) => { const vx = -tx * vu + fx * vf, vz = -tz * vu + fz * vf;
      for (let v = 0; v < 4; v++) { const o = q * 4 + v; P.set([x, y, z], o * 3); C2.set([v & 1 ? 1 : -1, v & 2 ? 1 : -1], o * 2); V.set([vx, vy, vz, ph], o * 4); }
      const b = q * 4; I.push(b, b + 1, b + 3, b, b + 3, b + 2); });
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(P, 3)); sg.setAttribute('aC', new THREE.BufferAttribute(C2, 2)); sg.setAttribute('aV', new THREE.BufferAttribute(V, 4));
    sg.setIndex(I); sg.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), 40);
    const U = { uTime, uT0: { value: 0 } };
    const sm = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide,
      vertexShader: ['uniform float uTime;', 'uniform float uT0;', 'attribute vec2 aC;', 'attribute vec4 aV;', 'varying vec2 vC;', 'varying float vA;', '#include <fog_pars_vertex>',
        'void main() {', '  float T = uTime - uT0 - 2.0, t = fract(T / 0.9 + aV.w) * 0.9;',   // (a puff lives 0.9 s, from 2 s after the start of the show)
        '  vec3 p = position + aV.xyz * t + vec3(0.0, -4.9 * t * t, 0.0);',
        '  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); float sz = 0.05 + 0.22 * t; mvPosition.xy += aC * sz;',
        '  gl_Position = projectionMatrix * mvPosition; vC = aC; vA = T > 0.0 ? (1.0 - t / 0.9) * 0.9 : 0.0;', '  #include <fog_vertex>', '}'].join('\n'),
      fragmentShader: ['varying vec2 vC;', 'varying float vA;', '#include <fog_pars_fragment>', 'void main() { float r = dot(vC, vC); if (r > 1.0 || vA <= 0.0) discard; gl_FragColor = vec4(1.0, 0.98, 0.9, vA * (1.0 - r));', '  #include <fog_fragment>', '}'].join('\n') });
    sm.uniforms.uTime = U.uTime; sm.uniforms.uT0 = U.uT0;
    const sprayM = new THREE.Mesh(sg, sm); sprayM.visible = false; sprayM.renderOrder = 5; sprayM.matrixAutoUpdate = false; sprayM.name = 'champagne'; root.add(sprayM);
    // the camera: on the straight, 2 m out from its middle towards the pits, 10.5 m up, looking at the winner's head (a long lens)
    const shot = { px: cx + fx * 27, py: cy + 1.4, pz: cz + fz * 27, tx: cx, ty: cy + 1.7, tz: cz, fov: 24, fogD: 70 };   // (over the railing, under the canopy's edge)
    const P0 = { figs, sprayM, U, shot, on: false, req: false, t0: 0, smoke: null,
      show(cols) { figs.forEach((f) => { const col = cols[f.k] || [0.8, 0.8, 0.8], A = f.m.geometry.attributes.color; for (const q of f.suit) { A.array[q] = col[0]; A.array[q + 1] = col[1]; A.array[q + 2] = col[2]; } A.needsUpdate = true; f.m.visible = true; });
        sprayM.visible = true; if (P0.smoke) P0.smoke.visible = true; P0.on = true; P0.req = true; },
      hide() { figs.forEach(f => { f.m.visible = false; }); sprayM.visible = false; if (P0.smoke) P0.smoke.visible = false; P0.on = false; },
      step(t) { if (!P0.on) return; if (P0.req) { P0.req = false; P0.t0 = t; U.uT0.value = t % 1000; }
        const tt = t - P0.t0; figs.forEach((f) => { f.m.position.y = STEP[f.k][1] + Math.max(0, Math.sin((tt + f.k * 0.37) * 7.5)) * (f.k === 0 ? 0.22 : 0.12) * sstep(0.3, 1.2, tt); }); } };
    return P0;
  }
  // the verge's cross-section beyond the road edge ([offset, height above the road]), lifted onto the ground where it rises: the road ribbons
  // and the knocked props' floor (rbringProps) use the same rows
  function rbVerge(i, side) {
    const w = T.w, bar = side > 0 ? T.br[i] : T.bl[i], y = T.hy[i], lift = (o, h) => { const q = side * o; return [o, Math.max(h, nrGround(T.px[i] + T.nx[i] * q, T.pz[i] + T.nz[i] * q) + 0.06 - y)]; };
    return [[w, 0.0], [w + 1.2, -0.04], lift(Math.max(w + 1.8, bar - 0.4), -0.1), lift(bar + 0.8, -0.16), lift(bar + 3.2, -0.4)];
  }
  // knockable props: posts every 95-130 m and tyre walls at the corner exits, on level verge only; not on the grid and the pit straight, not
  // on the run-offs (their tarmac is drawn above the verge), nor where the pit lane leaves and joins
  function rbringProps(out, skip, per) {
    out.propR = 150;
    out.propFloor = propFloorTable(null, (i, side) => rbVerge(i, side));
    return out.propStats = roadsideProps(out.props, { post: per ? [150, 200] : [95, 130], postEdge: [1.6, 2.2], exits: per ? 0 : 8, apexes: per ? 0 : 2, wallEdge: [1.6, 2.2], stacks: [5, 7], rows2: 0.3,   // (per: the period look, no tyre stacks)
      floor: out.propFloor, skip: (i, side) => skip(i, side) || !!(side > 0 ? T.gravR[i] : T.gravL[i]) });
  }

  function buildRbring(scene, tex, opts) {
    const R = rng(4318), N = T.N, w = T.w, ds = T.ds, dens = opts.density || 1, sStart = T.startS, def = T.def, L = T.len;
    const root = new THREE.Group(); scene.add(root);
    const out = { root, dyn: {}, groundH: nrGround, camFloor: nrGround, props: [], farClip: true, ownTex: [], ownMarks: true };   // (ownMarks: its decals paint the tyre marks)
    const ownTex = (t) => { out.ownTex.push(t); return t; };
    const dS = (s) => { let d = s - sStart; d = ((d % L) + L) % L; return d > L / 2 ? d - L : d; };   // metres from the start line (-L/2 .. L/2)
    const sAt = (d) => (((sStart + d) % L) + L) % L;
    const hyS = (s) => T.elevAt(wrapS(s)).y;
    const PD = def.pit, PB = def.pitBuilding || [-230, 70];
    const PSD = PD && PD[0] < 0 ? -1 : 1;   // (the pit lane's side: Styria right, Bathurst left: def.pit[0] < 0)
    const LK = RB_LOOK[THEME] || RB_LOOK.rbring, AT = LK.at, BAN = LK.ban, PER = !!LK.period;   // (Styria's, Bathurst's or Crystal Palace's own touches; PER: the 1930s)
    nrPrep();
    const P = API.NR, G = P.G;
    P.seC = LK.seC;   // built-up land (car parks on grass, service areas): dry, trampled grass
    P.colMod = LK.colMod(P);   // the open land's own colours
    // the pit complex on level ground: the terrain right of the straight (lane, apron, pit building, paddock) pulled to the road's height
    // (the straight is straight here: a point is projected on the chord between its two ends); none without pits
    P.pad = (x, z, h) => h;
    if (PD && !LK.pitBox) {
      const a = atS(sAt(PB[0] - 60), 0), b = atS(sAt(PB[1] + 60), 0), sa = sAt(PB[0] - 60);
      const ux = b[0] - a[0], uz = b[1] - a[1], Lp = Math.hypot(ux, uz), tx = ux / Lp, tz = uz / Lp, nx = -tz, nz = tx;
      P.pad = (x, z, h) => { const al = (x - a[0]) * tx + (z - a[1]) * tz, lat = (x - a[0]) * nx + (z - a[1]) * nz;
        if (al < -40 || al > Lp + 40 || lat < 11.5 || lat > 125) return h;
        const f = Math.min(sstep(-40, 0, al), sstep(Lp + 40, Lp, al), sstep(11.5, 15, lat), sstep(125, 100, lat)); if (!(f > 0)) return h;
        return lerp(h, hyS(sa + clamp(al, 0, Lp)) - 0.14, f); };
    }
    if (LK.pitBox) {   // Bathurst: the ground of the pit lane and the pit building level with the straight, on its side
      const [q0, q1, sd] = LK.pitBox, a = atS(sAt(q0 - 10), 0), b = atS(sAt(q1 + 10), 0), sa = sAt(q0 - 10);
      const ux = b[0] - a[0], uz = b[1] - a[1], Lp = Math.hypot(ux, uz), tx = ux / Lp, tz = uz / Lp, nx = -tz * sd, nz = tx * sd;
      P.pad = (x, z, h) => { const al = (x - a[0]) * tx + (z - a[1]) * tz, lat = (x - a[0]) * nx + (z - a[1]) * nz;
        if (al < -30 || al > Lp + 30 || lat < 10.5 || lat > 70) return h;
        const f = Math.min(sstep(-30, 0, al), sstep(Lp + 30, Lp, al), sstep(10.5, 13, lat), sstep(70, 52, lat)); if (!(f > 0)) return h;
        return lerp(h, hyS(sa + clamp(al, 0, Lp)) - 0.14, f); };
    }
    const PARK = LK.park && def.cp ? cpPrep(P) : null;   // (Crystal Palace: the lakes and the terrace walls cut into the ground)
    out.bounds = { minX: P.x0, maxX: P.x1, minZ: P.z0, maxZ: P.z1 };
    const matV = new THREE.MeshLambertMaterial({ vertexColors: true }); out.matV = matV;
    const excl = [], eh = new Map(), EHC = 64;   // tree exclusion circles (buildings, stands, crowds), hashed
    const exclPush = (x, z, r) => { const e = { x, z, r }; excl.push(e); for (let a = Math.floor((x - r) / EHC); a <= Math.floor((x + r) / EHC); a++) for (let b = Math.floor((z - r) / EHC); b <= Math.floor((z + r) / EHC); b++) { const k = a + ',' + b; let Lc = eh.get(k); if (!Lc) eh.set(k, Lc = []); Lc.push(e); } };
    const excluded = (x, z) => { const Lc = eh.get(Math.floor(x / EHC) + ',' + Math.floor(z / EHC)); if (!Lc) return false; for (let k = 0; k < Lc.length; k++) { const e = Lc[k], dx = x - e.x, dz = z - e.z; if (dx * dx + dz * dz < e.r * e.r) return true; } return false; };

    /* ---- terrain tiles: which ones (they are built at the end, when the trees have darkened the ground under them) ---- */
    const gMat = new THREE.MeshLambertMaterial({ map: ownTex((LK.grass === 'bt' ? btGrassTex : nrGrassTex)(tex.grass.anisotropy)), vertexColors: true }), tiles = [];   // (the Nordschleife's meadow grass: no mowing stripes; the vertex colours make it Styrian; Bathurst: its own pasture)
    if (LK.ground) LK.ground(gMat, ownTex);   // (Rio: its own patches in the ground's shader)
    for (let tj = 0; tj < G.ntz; tj++) for (let ti = 0; ti < G.ntx; ti++) { const on = nrTileOn(ti, tj); if (!on) continue; if (on === 1) G.on[tj * G.ntx + ti] = 1; tiles.push(ti, tj, on); }

    /* ---- road: asphalt, white edge lines, red and white kerbs (256 m chunks, culled; the grass verges out past the barriers at the end) ---- */
    const Pt = (i, o, y) => [T.px[i] + T.nx[i] * o, T.hy[i] + y, T.pz[i] + T.nz[i] * o];
    const aMat = new THREE.MeshLambertMaterial({ map: tex.asphalt, vertexColors: true }); out.asphaltMat = aMat;
    const lMat = new THREE.MeshLambertMaterial({ vertexColors: true }), cMat = new THREE.MeshLambertMaterial({ map: tex.curb, vertexColors: true });
    const addM = (g, mat, cast) => { if (g.empty) return null; const m = new THREE.Mesh(g.geometry(), mat); m.receiveShadow = true; m.castShadow = !!cast; m.matrixAutoUpdate = false; root.add(m); return m; };
    const kerb = [new Uint8Array(N), new Uint8Array(N)];   // inside of every bend, outside in the tighter ones
    for (let i = 0; i < N; i++) if (T.curb[i]) { const k = T.k[i]; for (const side of [-1, 1]) { const inside = side * k > 0; if (inside || Math.abs(k) > 1 / 70) kerb[side > 0 ? 1 : 0][i] = 1; } }
    pitKerbs(kerb);   // (none on the pit lane's side where it joins the circuit)
    const CH = 128, offs = [-w, -w * 2 / 3, -w / 3, 0, w / 3, w * 2 / 3, w], tileL = 8;
    // asphalt tone: resurfaced sections of 120-260 m (seams across the road), the rubbered racing line, darker still in the braking zones of the
    // slower corners (as on the Nordschleife; an F1 circuit is younger and more even)
    const secT = new Float32Array(N), brk = new Float32Array(N);
    for (let i0 = 0, k = 0; i0 < N; k++) { const n = PER ? 18 + Math.floor(crH(k, 3, 97) * 50) : 60 + Math.floor(crH(k, 3, 97) * 70), t = PER ? 0.9 + crH(k, 5, 97) * 0.15 : 0.94 + crH(k, 5, 97) * 0.09; for (let i = i0; i < Math.min(N, i0 + n); i++) secT[i] = t; i0 += n; }   // (the 1930s: tar macadam laid in shorter, more uneven stretches)
    for (const c of T.corners) if (c.sev >= 2) for (let k = -70; k <= 6; k++) { const i = (c.i0 + k + N) % N, f = k < -10 ? sstep(-70, -12, k) : sstep(6, -10, k); if (f > brk[i]) brk[i] = f; }
    const shade = PER ? (i, o) => { const rl = T.rl[i]; let k = (0.84 - (0.1 + 0.08 * brk[i]) * Math.exp(-((o - rl) * (o - rl)) / 5)) * secT[i]; if (Math.abs(o) > w * 0.6) k += 0.06 * sstep(w * 0.6, w, Math.abs(o)); return [k * 1.04, k, k * 0.92]; }   // (the 1930s: a warmer tar macadam, the racing line less rubbered, its edges paler where the cars seldom run and the dust settles)
      : (i, o) => { const rl = T.rl[i]; let k = (0.85 - (0.16 + 0.12 * brk[i]) * Math.exp(-((o - rl) * (o - rl)) / 5)) * secT[i]; if (Math.abs(o) > w * 0.92) k -= 0.03; if (LK.road) k = LK.road(i, o, k); return [k, k, k * 1.02]; };   // (LK.road: Rio's worn asphalt)
    const MOW_D = LK.trees === 'rio' ? [0.05, 0.035, 0.045] : [0.22, 0.15, 0.18].map(v => v * (LK.mow || 1)), vg = LK.vg || (LK.trees === 'rio' ? [0.92, 0.95, 0.78] : [0.9, 0.99, 0.86]), vgD = vg.map((v, k) => v * (1 - MOW_D[k]));   // (Rio: the verge drier in the sun, the stripes fainter)   // the verge inside the barriers: mown, in stripes along the track (MOW_W m bands, dark and light in turn, from 1.2 m past the edge; the dark ones a deeper green)
    const MOW_W = 3, MOW_N = 6, MOW_B = 5, MOW_O = 3.5;   // (MOW_B: the darker bands, MOW_O m wide, on the lawns out past the barrier)
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB(true), gl = new RB(), gk = new RB(true);
      let pr = -1, pl = -1; const pk = [-1, -1];
      for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
        const i = ii % N, v = ii * ds / tileL;
        const r = gr.row(offs.map(o => Pt(i, o, 0.02)), offs.map(o => shade(i, o)), offs.map(o => [(o + w) / tileL, v]));
        if (pr >= 0) gr.link(pr, r, 0, offs.length - 1); pr = r;
        if (PER) {   // the 1930s: along each edge a strip of dust and loose grit over the road's edge and the verge, its grass edge ragged
          const ed = (sd) => { const q = ii * ds, j = 0.5 + 0.28 * Math.sin(q * 0.23 + sd * 2.1) + 0.14 * Math.sin(q * 0.71 + sd * 0.4) + (crH(i, sd, 41) - 0.5) * 0.22, v = 0.92 + crH(i, sd, 43) * 0.16;   // (j: how far the grit reaches, 0..1)
            const o0 = w - 0.1, o1 = w + 0.08, o2 = w + 0.2 + 0.25 * j, o3 = w + 0.32 + 0.45 * j, hv = (o) => -0.04 * Math.max(0, o - w) / 1.2 + 0.03;
            const C = [[0.42 * v, 0.41 * v, 0.38 * v], [0.54 * v, 0.51 * v, 0.45 * v], [0.5 * v, 0.48 * v, 0.4 * v], [0.4 * v, 0.44 * v, 0.29 * v]], O = [o0, o1, o2, o3];
            return { p: O.map(o => Pt(i, sd * o, hv(o) + 0.004)), c: C }; };
          const L = ed(-1), R = ed(1), wl = [0.94, 0.94, 0.9], W = [Pt(i, -w + 0.2, 0.034), Pt(i, -w + 0.5, 0.034), Pt(i, w - 0.5, 0.034), Pt(i, w - 0.2, 0.034)];   // (the white edge lines inside it, as on the other circuits: the user's choice)
          const l = gl.row([...L.p.slice().reverse(), ...W, ...R.p], [...L.c.slice().reverse(), wl, wl, wl, wl, ...R.c]);
          if (pl >= 0) { gl.link(pl, l, 0, 3); gl.link(pl, l, 4, 5); gl.link(pl, l, 6, 7); gl.link(pl, l, 8, 11); } pl = l;
        } else {
        const wl = [0.94, 0.94, 0.9], l = gl.row([Pt(i, -w + 0.2, 0.034), Pt(i, -w + 0.5, 0.034), Pt(i, w - 0.5, 0.034), Pt(i, w - 0.2, 0.034)], [wl, wl, wl, wl]);
        if (pl >= 0) { gl.link(pl, l, 0, 1); gl.link(pl, l, 2, 3); } pl = l; }
        for (const side of [-1, 1]) {
          const si = side > 0 ? 1 : 0;
          if (kerb[si][i]) {   // red/white kerb in 1 m blocks: a sloped inner edge, a flat top, a low outer lip
            const cw = T.curbW, pf = [[w - 0.02, 0.035], [w + 0.14, 0.078], [w + cw - 0.12, 0.085], [w + cw + 0.02, 0.03]], v = ii * ds / 2;
            const sh = [0.84, 1, 1, 0.78].map(k => [k, k, k]), us = [0, 0.1, 0.92, 1], o = side > 0 ? [0, 1, 2, 3] : [3, 2, 1, 0];
            const rk = gk.row(o.map(k => Pt(i, side * pf[k][0], pf[k][1])), o.map(k => sh[k]), o.map(k => [us[k], v]));
            if (pk[si] >= 0) gk.link(pk[si], rk, 0, 3); pk[si] = rk;
          } else pk[si] = -1;
        }
      }
      addM(gr, aMat); addM(gl, lMat); addM(gk, cMat);
    }
    /* ---- run-offs: pale asphalt from the kerb (or the edge) to just before the barrier where the barrier stands far out (Core: T.gravL /
       gravR; with def.runoffTarmac the cars drive on asphalt there), tapering in and out; a green band along the track limit ---- */
    const roMat = new THREE.MeshLambertMaterial({ map: LK.gravel ? tex.sand : tex.asphalt, vertexColors: true });   // (LK.gravel: sand traps instead, Rio in the 1980s)
    {
      const rc = new Chunks(128, true), gb = new Chunks(128), roC = LK.gravel ? [0.84, 0.8, 0.7] : [1.02, 1.02, 1.04], grn = [0.22, 0.55, 0.32];
      for (const side of [-1, 1]) {
        const flag = side > 0 ? T.gravR : T.gravL, bar = side > 0 ? T.br : T.bl;
        for (let i = 0; i < N; i++) {
          const j = (i + 1) % N; if (!flag[i] && !flag[j]) continue;
          const fi = flag[i] ? 1 : 0, fj = flag[j] ? 1 : 0, inI = w + (kerb[side > 0 ? 1 : 0][i] ? T.curbW : 0.05), inJ = w + (kerb[side > 0 ? 1 : 0][j] ? T.curbW : 0.05);
          const outI = lerp(inI + 0.1, bar[i] - 0.7, fi), outJ = lerp(inJ + 0.1, bar[j] - 0.7, fj);
          const a = Pt(i, side * inI, 0.028), b = Pt(i, side * outI, 0.028), c = Pt(j, side * outJ, 0.028), d = Pt(j, side * inJ, 0.028), uvp = (p) => [p[0] / 8, -p[2] / 8];
          rc.get(a[0], a[2]).quadUp(a, b, c, d, [roC, roC, roC, roC], [uvp(a), uvp(b), uvp(c), uvp(d)]);
          if (fi && fj && !LK.gravel) { const e0 = Math.min(outI, inI + 2.2), e1 = Math.min(outJ, inJ + 2.2);   // the green band just outside the kerb
            gb.get(a[0], a[2]).quadUp(Pt(i, side * (inI + 0.9), 0.034), Pt(i, side * e0, 0.034), Pt(j, side * e1, 0.034), Pt(j, side * (inJ + 0.9), 0.034), [grn, grn, grn, grn]); }
        }
      }
      rc.addTo(root, roMat, false, true); gb.addTo(root, lMat, false, true);
    }
    /* ---- 2024: the gravel strips just past the kerbs at the exits of Turns 9 and 10 (def.gravelStrips; Core: gravel there), and a blue
       line along the white track limit beside them (a contrast for the stewards' cameras) ---- */
    if (def.gravelStrips) {
      const gs = new GB(true), gbl = new GB(), blue = [0.1, 0.32, 0.86], gcl = LK.gravel ? [0.86, 0.82, 0.72] : [1.05, 1.05, 1.05], uvg = (p) => [p[0] / 2.5, -p[2] / 2.5];
      for (const [a, b, side, wd] of def.gravelStrips) {
        for (let d = a; d < b - 0.01; d += ds) {
          const i = T.idx(sAt(d)), j = T.idx(sAt(Math.min(b, d + ds))), o0 = w + T.curbW, e = (q) => { if (!LK.gravel) return 1; const f = clamp(Math.min((q - a) / 30, (b - q) / 30), 0, 1); return Math.max(0.04, Math.sqrt(1 - (1 - f) * (1 - f))); }, o1 = o0 + wd * e(d), o1j = o0 + wd * e(Math.min(b, d + ds));   // (Rio: the sand traps' ends rounded off)
          const A = Pt(i, side * o0, 0.036), B = Pt(i, side * o1, 0.036), C = Pt(j, side * o1j, 0.036), D = Pt(j, side * o0, 0.036);
          if (!LK.gravel) gs.quadUp(A, B, C, D, [gcl, gcl, gcl, gcl], [uvg(A), uvg(B), uvg(C), uvg(D)]);
          else {   // Rio's sand: darker and churned up by the tyres along the kerb, raked patches of lighter and darker sand further out
            const dj = Math.min(b, d + ds), sc = (q, o) => { const k = 0.9 + 0.07 * Math.sin(q * 0.11 + o * 0.6) + 0.05 * Math.sin(q * 0.37 - o * 1.3); return [0.8 * k, 0.73 * k, 0.6 * k]; }, ed = [0.6, 0.53, 0.43];
            const om = o0 + Math.min(1.8, (o1 - o0) * 0.3), omj = o0 + Math.min(1.8, (o1j - o0) * 0.3), M = Pt(i, side * om, 0.036), Mj = Pt(j, side * omj, 0.036);
            gs.quadUp(A, M, Mj, D, [ed, sc(d, om), sc(dj, omj), ed], [uvg(A), uvg(M), uvg(Mj), uvg(D)]);
            gs.quadUp(M, B, C, Mj, [sc(d, om), sc(d, o1), sc(dj, o1j), sc(dj, omj)], [uvg(M), uvg(B), uvg(C), uvg(Mj)]);
          }
        }
        if (!LK.gravel) for (let d = a - 30; d < b + 12; d += ds) {   // the blue line: from before the corner to the end of the strip
          const i = T.idx(sAt(d)), j = T.idx(sAt(d + ds));
          gbl.quadUp(Pt(i, side * (w - 0.2), 0.036), Pt(i, side * w, 0.036), Pt(j, side * w, 0.036), Pt(j, side * (w - 0.2), 0.036), [blue, blue, blue, blue]);
        }
      }
      addM(gs, new THREE.MeshLambertMaterial({ map: LK.gravel ? tex.sand : ownTex(rbGravelTex()), vertexColors: true })); addM(gbl, lMat);   // (Rio: the sand traps of its time)
    }
    /* ---- on the asphalt: black tyre marks into the slower corners (many: a Formula 1 circuit), a few repair patches and sealed cracks (the
       Nordschleife's decal atlas, its marks only: no fans' paint on this track), and the DRS lines across the road: a solid one at each
       detection point, a dashed one where the zone opens. Strips that follow the road 5 cm up, per road chunk, drawn without writing depth ---- */
    let nDecals = 0;
    {
      const dTex = ownTex(nrDecalTex()); dTex.anisotropy = tex.asphalt.anisotropy || 4;
      const dMat = new THREE.MeshLambertMaterial({ map: dTex, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
      const RD = rng(4320), dcs = [], put = (i0, n, c, hw, cell, a, lay, fol) => dcs.push([i0, n, c, hw, cell, a, lay, fol]);   // (their own random stream: R() is not drawn from)
      for (let d = 60; d < L - 60; d += 30) {   // (not on the grid)
        const i = T.idx(sAt(d)), wk = LK.wear && d > LK.wear[0] && d < LK.wear[1] ? LK.wear[2] : 1;   // (Bathurst: more of them on the narrow road over the hill)
        if (RD() < 0.04 * wk) put(i, 5 + Math.floor(RD() * 4), (RD() - 0.5) * 6, 1.2 + RD() * 0.6, 24 + Math.floor(RD() * 2), 0.75, 1);   // sealed cracks
        if (RD() < 0.05 * wk) { const hw = 1.5 + RD() * 1.2; put(i, 2 + Math.floor(RD() * 6), (RD() < 0.5 ? -1 : 1) * (w - 0.8 - hw) * RD(), hw, 28 + Math.floor(RD() * 4), 0.85, 0); }   // repair patches
      }
      for (const c of T.corners) if (c.sev >= 2) for (let n = c.sev >= 3 ? 5 : 3; n > 0; n--)   // tyre marks into the corner, along the racing line
        put((c.i0 - 4 - Math.floor(RD() * 34) + N) % N, 10 + Math.floor(RD() * 7), (RD() - 0.5) * 1.8, 1.25, 26 + (RD() < 0.35 ? 1 : 0), 0.45 + RD() * 0.4, 2, true);
      dcs.sort((a, b) => a[6] - b[6]);   // (patches under cracks under tyre marks)
      const rbs = new Map();
      for (const [i0, n, c, hw, cell, a, , fol] of dcs) {
        const key = Math.floor(i0 / CH); let rb = rbs.get(key); if (!rb) rbs.set(key, rb = new RB(true, true));
        const cu = cell % 4, cv = Math.floor(cell / 4), u0 = cu / 4 + 1 / 512, u1 = (cu + 1) / 4 - 1 / 512, vt = 1 - cv / 8 - 1 / 1024, vb = 1 - (cv + 1) / 8 + 1 / 1024, col = [1, 1, 1, a];
        let pr = -1;
        for (let k = 0; k <= n; k++) {
          const i = (i0 + k) % N, cc = clamp((fol ? T.rl[i] : 0) + c, -(w - 0.7 - hw), w - 0.7 - hw), v = vb + (vt - vb) * k / n;
          const r = rb.row([Pt(i, cc - hw, 0.05), Pt(i, cc + hw, 0.05)], [col, col], [[u0, v], [u1, v]]);
          if (pr >= 0) rb.link(pr, r, 0, 1); pr = r;
        }
      }
      for (const rb of rbs.values()) { const m = addM(rb, dMat); if (m) m.renderOrder = 0.45; }   // (ROAD DECAL ORDER: under the road's wear)
      nDecals = dcs.length;
      if (T.drs) {   // the DRS lines: 0.3 m across the whole road
        const gd = new GB(), wl = [0.95, 0.95, 0.92];
        for (const z of T.drs) for (const [at, dash] of [[z.det, false], [z.act, true]]) {
          const s0 = sAt(at), s1 = s0 + 0.3;
          for (let o = -w + 0.2; o < w - 0.2 - 1e-6; o += dash ? 1.2 : 2) { const o1 = Math.min(w - 0.2, o + (dash ? 0.7 : 2)), A = atSf(s0, o), B = atSf(s0, o1), C = atSf(s1, o1), D = atSf(s1, o);
            gd.quadUp([A[0], hyS(s0) + 0.036, A[1]], [B[0], hyS(s0) + 0.036, B[1]], [C[0], hyS(s1) + 0.036, C[1]], [D[0], hyS(s1) + 0.036, D[1]], [wl, wl, wl, wl]); }
        }
        addM(gd, lMat);
      }
    }
    // chequered start / finish line and the grid boxes (13 cars, staggered)
    {
      const gq = new GB(true), gw = new GB(), uM = Math.round(w * 2 / 0.8) / 16, W1 = [1, 1, 1], wh = [0.93, 0.93, 0.9], HYp = (p) => T.hy[p[3]];
      const a = atSf(sStart - 0.8, -w), b = atSf(sStart - 0.8, w), c = atSf(sStart + 0.8, w), d = atSf(sStart + 0.8, -w);
      gq.quadUp([a[0], HYp(a) + 0.04, a[1]], [b[0], HYp(b) + 0.04, b[1]], [c[0], HYp(c) + 0.04, c[1]], [d[0], HYp(d) + 0.04, d[1]], [W1, W1, W1, W1], [[0, 0], [uM, 0], [uM, 0.5], [0, 0.5]]);
      for (let k = 1; k <= 14; k++) {
        const sb = sStart - 9 - (k - 1) * 7.5 + 2.6, lat = (k % 2 === 1 ? -1 : 1) * 3.4;
        const p0 = atSf(sb, lat - 1.5), p1 = atSf(sb, lat + 1.5), p2 = atSf(sb + 0.35, lat + 1.5), p3 = atSf(sb + 0.35, lat - 1.5);
        gw.quadUp([p0[0], HYp(p0) + 0.037, p0[1]], [p1[0], HYp(p1) + 0.037, p1[1]], [p2[0], HYp(p2) + 0.037, p2[1]], [p3[0], HYp(p3) + 0.037, p3[1]], [wh, wh, wh, wh]);
        const q0 = atSf(sb - 1.6, lat - 1.5), q1 = atSf(sb + 0.35, lat - 1.5), q2 = atSf(sb + 0.35, lat - 1.25), q3 = atSf(sb - 1.6, lat - 1.25);
        gw.quadUp([q0[0], HYp(q0) + 0.037, q0[1]], [q1[0], HYp(q1) + 0.037, q1[1]], [q2[0], HYp(q2) + 0.037, q2[1]], [q3[0], HYp(q3) + 0.037, q3[1]], [wh, wh, wh, wh]);
      }
      tex.checker.repeat.set(1, 1); addM(gq, new THREE.MeshLambertMaterial({ map: tex.checker })); addM(gw, lMat);
    }

    /* ---- barriers: concrete walls along the straight, the pit wall and in front of the spectators, tyre walls round the outside of the slow
       corners, double armco on posts elsewhere; debris fences behind the walls and the tyre walls ---- */
    const side2 = (side) => (side > 0 ? 1 : 0);
    const wallOn = [new Uint8Array(N), new Uint8Array(N)];   // spectators behind the barrier: concrete wall and debris fence
    for (const [a, b, sd] of def.stands || []) for (let d = a - 24; d <= b + 24; d += ds) wallOn[side2(sd)][T.idx(sAt(d))] = 1;
    for (const [a, b, sd] of def.ga || []) for (let d = a - 10; d <= b + 10; d += ds) wallOn[side2(sd)][T.idx(sAt(d))] = 1;
    for (const [a, b, sd] of def.walls || []) for (let d = a - 20; d <= b + 20; d += ds) wallOn[side2(sd)][T.idx(sAt(d))] = 1;   // (the walls the track sets close to the road)
    const tyreOn = [new Uint8Array(N), new Uint8Array(N)];
    for (const c of T.corners) { if (c.sev < 3) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, si = side2(-c.dir);
      for (let k = c.i0 - 10; k <= i1c + 14; k++) { const ii = ((k % N) + N) % N; if ((si ? T.gravR : T.gravL)[ii]) tyreOn[si][ii] = 1; } }
    const baleOn = [new Uint8Array(N), new Uint8Array(N)];   // (the 1930s: straw bales round the outside of the corners)
    if (PER) for (const c of T.corners) { if (c.sev < 2) continue; const i1c = c.i1 < c.i0 ? c.i1 + N : c.i1, si = side2(-c.dir); for (let k = c.i0 - 12; k <= i1c + 16; k++) baleOn[si][((k % N) + N) % N] = 1; }
    const kindAt = (i, side) => {   // -1 none (where the pit lane leaves and joins the circuit), 0 armco, 1 concrete wall, 2 tyre wall; the 1930s: 3 straw bales, 4 a timber fence
      if (side === PSD && PD && pitOpen(i)) return -1;   // (and along the deceleration and acceleration lanes)
      if (PER) { if (side === PSD && PD) { const p = T.pitAt(i * ds); if (p) return p.gap ? -1 : 4; } return baleOn[side2(side)][i] || wallOn[side2(side)][i] ? 3 : 4; }
      if (side === PSD && PD) { const p = T.pitAt(i * ds); if (p) return p.gap ? -1 : 1; }
      if (tyreOn[side2(side)][i]) return 2;
      const d = dS(i * ds); if (d > -420 && d < 280) return 1;
      return wallOn[side2(side)][i] ? 1 : 0;
    };
    const rMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const fMat = new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const tyMat = new THREE.MeshLambertMaterial({ map: tex.tires, vertexColors: true });
    const postGeo = (() => { const g = new GB(); box(g, 0, 0, 0, 0.13, 1, 0.13, 0, [0.42, 0.43, 0.46], null, true); return g.geometry(); })();
    const posts = new IChunks(postGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), 256);
    const fence = [new Uint8Array(N), new Uint8Array(N)];
    const steel = [0.8, 0.82, 0.85], steelD = [0.5, 0.52, 0.56], conc = [0.76, 0.76, 0.74], concD = [0.62, 0.62, 0.6], W1 = [1, 1, 1];
    const railRow = (gr, i, side, k, bi) => {   // armco / wall cross-section at sample i (rows run so that the faces look at the road; bi: the straw bale it closes, else sample i's)
      const bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.12), h = 1.1, o2 = side * (bar + (k === 0 ? 0.42 : 0.45));
      let p = k === 0 ? [Pt(i, o, 0.32), Pt(i, o, 0.6), Pt(i, o, 0.66), Pt(i, o, 0.95), Pt(i, o2, 0.95)] : [Pt(i, o, -0.4), Pt(i, o, 0.1), Pt(i, o, h - 0.1), Pt(i, o, h), Pt(i, o2, h)];
      let c = k === 0 ? [steel, steelD, steel, [0.9, 0.91, 0.93], [0.72, 0.74, 0.77]] : [concD, conc, conc, [0.88, 0.88, 0.86], [0.82, 0.82, 0.8]];
      if (k === 3) { const b = bi == null ? i : bi, u = crH(b, side, 51), sh = 0.84 + u * 0.24, gy = crH(b, side, 53) < 0.18 ? 0.88 : 1, ht = 0.86 + crH(b, side, 55) * 0.09, o3 = side * (bar + 0.9 + crH(b, side, 57) * 0.12);   // straw bales: two courses, each bale (a sample, 2 m) its own straw and height (a few weathered greyer), the tops lighter
        const S = (r, g, bb) => [r * sh, g * sh * gy + r * sh * (1 - gy) * 0.9, bb * sh * gy + r * sh * (1 - gy) * 0.6];
        p = [Pt(i, o, -0.2), Pt(i, o, 0.44), Pt(i, o, ht), Pt(i, o, ht), Pt(i, o3, ht)]; c = [S(0.6, 0.48, 0.26), S(0.8, 0.68, 0.39), S(0.86, 0.74, 0.43), S(0.95, 0.84, 0.54), S(0.93, 0.82, 0.52)]; }   // (the top's edge twice: a sharp edge, not a rounded one)
      else if (k === 4) { const o4 = side * (bar + 0.2), sh = i % 3 ? 1 : 0.86;   // a close-boarded timber fence, weathered, its palings in shades
        p = [Pt(i, o, -0.3), Pt(i, o, 0.15), Pt(i, o, 1.15), Pt(i, o, 1.15), Pt(i, o4, 1.15)]; c = [[0.3, 0.24, 0.18], [0.46 * sh, 0.37 * sh, 0.27 * sh], [0.53 * sh, 0.43 * sh, 0.31 * sh], [0.6, 0.5, 0.37], [0.6, 0.5, 0.37]]; }
      if (side < 0) { p = p.reverse(); c = c.slice().reverse(); }
      return gr.row(p, c);
    };
    const tyreRow = (gt, i, side, u) => {   // a tyre wall: the textured face towards the road, a dark top
      const bar = side > 0 ? T.br[i] : T.bl[i], o = side * (bar + 0.1), o2 = side * (bar + 0.9), dk = [0.3, 0.3, 0.32];
      let p = [Pt(i, o, -0.1), Pt(i, o, 0.95), Pt(i, o2, 0.95)], uv = [[u, 0.02], [u, 0.98], [u, 0.98]], c = [W1, W1, dk];
      if (side < 0) { p = p.reverse(); uv = uv.slice().reverse(); c = c.slice().reverse(); }
      return gt.row(p, c, uv);
    };
    for (let c0 = 0; c0 < N; c0 += CH) {
      const gr = new RB(), gt = new RB(true);
      for (const side of [-1, 1]) {
        let prev = -1, pk = -2, acc = c0 * ds;
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++, acc += ds) {
          const i = ii % N, k = kindAt(i, side);
          const ib = (i - 1 + N) % N;   // (the bale that ends at sample i)
          if (prev >= 0 && k !== pk) { if (pk === 2) gt.link(prev, tyreRow(gt, i, side, acc / 3), 0, 2); else if (pk >= 0) gr.link(prev, railRow(gr, i, side, pk, ib), 0, 4); prev = -1; }   // the old kind runs up to here
          if (k < 0) { pk = k; continue; }
          const r = k === 2 ? tyreRow(gt, i, side, acc / 3) : railRow(gr, i, side, k);
          if (prev >= 0) { if (k === 2) gt.link(prev, r, 0, 2); else if (k === 3) gr.link(prev, railRow(gr, i, side, 3, ib), 0, 4); else gr.link(prev, r, 0, 4); } prev = r; pk = k;   // (bales: a row of its own closes the one before, so each bale has its own colour and height)
          if (k === 0 && ii % 2 === 0 && ii < c0 + CH) { const p = Pt(i, side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.24), 0); posts.add(p[0], p[1] - 0.35, p[2], T.hd[i], 1, 1.25); }
          if (k >= 1 && k <= 2) fence[side2(side)][i] = k;
        }
      }
      addM(gr, rMat, true); addM(gt, tyMat, true);
    }
    const nPosts = posts.addTo(root, true);
    // advertising boards on the concrete walls (the game's own brands, tex.sponsors: 4 m boards, the text read from the road)
    { const sb = new Chunks(128, true);
      for (const side of [-1, 1]) for (let i = 0, n = 0; i + 2 <= N; i += 2) {
        const j = (i + 2) % N; if (kindAt(i, side) !== 1 || kindAt(j, side) !== 1 || kindAt((i + 1) % N, side) !== 1) continue;
        const k = (n++ * 3 + (side > 0 ? 1 : 0)) % 8, u0 = (k % 2) * 0.5, v1 = 1 - Math.floor(k / 2) * 0.25, bar = side > 0 ? T.br : T.bl, o = (ii) => side * (bar[ii] + 0.1);
        const A = Pt(i, o(i), 0.14), B = Pt(j, o(j), 0.14), C = Pt(j, o(j), 0.96), D = Pt(i, o(i), 0.96), uL = side < 0 ? u0 : u0 + 0.5, uR = side < 0 ? u0 + 0.5 : u0;
        sb.get(A[0], A[2]).quadO(A, B, C, D, W1, Pt(i, side * (bar[i] + 2), 0.5), [[uL, v1 - 0.25], [uR, v1 - 0.25], [uR, v1], [uL, v1]]); }
      sb.addTo(root, new THREE.MeshLambertMaterial({ map: tex.sponsors }), false, true); }
    // debris fences (chain link on posts) behind the walls and the tyre walls
    const scen = new Chunks(128), ban = new GB(true), fenceG = new GB(true);
    for (const side of [-1, 1]) {
      const fc = fence[side2(side)], bar = side > 0 ? T.br : T.bl; let acc = 0;
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N; if (!fc[i] || !fc[j] || (side === PSD && PD && (pitOpen(i) || pitOpen(j)))) { acc += ds; continue; }   // (none where the pit lane joins the circuit)
        const e = fc[i] === 2 ? 1.25 : 0.55, Q = (ii, y) => { const o = side * (bar[ii] + e); return [T.px[ii] + T.nx[ii] * o, T.hy[ii] + y, T.pz[ii] + T.nz[ii] * o]; };
        const u0 = acc / 2.5, u1 = (acc + ds) / 2.5, ins = Q(i, 1); ins[0] += T.nx[i] * side * 3; ins[2] += T.nz[i] * side * 3;
        fenceG.quadO(Q(i, 1.0), Q(j, 1.0), Q(j, 4.2), Q(i, 4.2), [1, 1, 1], ins, [[u0, 0], [u1, 0], [u1, 1.3], [u0, 1.3]]);
        if (i % 3 === 0) { const p = Q(i, 0); box(scen.get(p[0], p[2]), p[0], p[1] - 0.2, p[2], 0.1, 4.45, 0.1, T.hd[i], [0.6, 0.61, 0.64]); }
        acc += ds;
      }
    }

    /* ---- scenery helpers (vertex coloured, 128 m chunks) ---- */
    const atlas = ownTex(rbAtlas(LK)), AUV = (k) => { const u0 = (k % 4) / 4, v1 = 1 - Math.floor(k / 4) / 16; return [u0, v1 - 1 / 16, u0 + 0.25, v1]; };
    const onSide = (s, side, extra) => { const i = T.idx(s), o = side * ((side > 0 ? T.br[i] : T.bl[i]) + extra); return [T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, i]; };
    const board = (cx, cy, cz, tx, tz, W, H, cellK) => {   // text board (bottom centre cx, cy, cz) facing -t (read by cars driving along +t), a dark back
      const [u0, v0, u1, v1] = AUV(cellK), ux = tz, uz = -tx, hw = -W / 2;
      const A = [cx - ux * hw, cy, cz - uz * hw], B = [cx + ux * hw, cy, cz + uz * hw], C = [B[0], cy + H, B[2]], D = [A[0], cy + H, A[2]];
      ban.quadO(A, B, C, D, W1, [cx + tx, cy + H / 2, cz + tz], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
      box(scen.get(cx, cz), cx + tx * 0.06, cy - 0.02, cz + tz * 0.06, 0.08, H + 0.04, W + 0.04, Math.atan2(tz, tx), [0.3, 0.31, 0.33], null, true);
    };
    const signPost = (s, side, extra, cellK, Wd, H, y0) => {   // a board on two posts beside the track, facing the traffic
      const [x, z, i] = onSide(s, side, extra), y = nrGround(x, z), g = scen.get(x, z), nx = T.nx[i], nz = T.nz[i];
      for (const o of [-Wd / 2 + 0.2, Wd / 2 - 0.2]) box(g, x + nx * o + T.tx[i] * 0.16, y - 0.3, z + nz * o + T.tz[i] * 0.16, 0.1, y0 + H + 0.3, 0.1, T.hd[i], [0.55, 0.56, 0.58]);
      board(x, y + y0, z, T.tx[i], T.tz[i], Wd, H, cellK); exclPush(x, z, 3);
    };
    const CR = crowdCtx({ gH: nrGround, near: (x, z) => nrNear(x, z).dd, maxSlope: 0.9, shirts: LK.shirts });   // spectators (instanced)
    // (the orange smoke, the waving flags and the video walls' screens are collected on the way and built at the end; their own random stream)
    const crowdPts = [];   // where the crowds are (x, z, how many: 0..1) for the crowd's sound (Sfx, out.crowdPts)
    let podAt = null;      // the podium's place (the pit building's roof terrace): { s, f0: the garages' front there }
    const RX = rng(4322), smokeL = [], flagL = [], scrG = new GB(true), WROT = Math.atan2(RB_WIND[1], RB_WIND[0]), SMK = [[1, 0.5, 0.12], [1, 0.45, 0.08], [0.98, 0.56, 0.18]];
    const FL = { nl: [[0.68, 0.11, 0.16], [0.95, 0.95, 0.94], [0.13, 0.28, 0.55]], at: [[0.8, 0.1, 0.14], [0.95, 0.95, 0.94], [0.8, 0.1, 0.14]], or: [[1, 0.5, 0.08]], st: [[0.95, 0.95, 0.94], [0.12, 0.5, 0.25]], rb: [[0.12, 0.16, 0.36]],
      gg: [[0.02, 0.45, 0.22], [0.98, 0.78, 0.1]], au: [[0.05, 0.14, 0.42], [0.95, 0.95, 0.94], [0.05, 0.14, 0.42]], tm: [[0.86, 0.12, 0.14], [0.95, 0.95, 0.94]],
      br: [[0.02, 0.56, 0.27], [1, 0.85, 0.12], [0.02, 0.56, 0.27]],
      cpA: [[0.9, 0.85, 0.7]], cpB: [[0.18, 0.34, 0.24]], cpC: [[0.5, 0.12, 0.12]] };   // (Crystal Palace: plain bunting of the 1930s)   // (Bathurst: green and gold, navy and white, a team's red and white)
    const flagAt = (x, y, z, h, k, W) => { W = W || 1.6; cyl(scen.get(x, z), x, y - 0.2, z, 0.05, h + 0.2, 5, [0.86, 0.86, 0.88]); flagL.push([x, y + h, z, WROT + (RX() - 0.5) * 0.3, FL[k], W, W * 0.66]); };   // (the cloth flies downwind)
    const pick = (o) => { let u = RX(); for (const k in o) { if (u < o[k]) return k; u -= o[k]; } return Object.keys(o)[0]; };

    if (PER) {   // the 1930s: enamel hoardings on posts behind the fence along the straight, by the stands and the corners (made-up: what they sell)
      let n = 0;
      for (const side of [-1, 1]) for (let d = -150; d < L - 150; d += 8) {
        const s = sAt(d), i = T.idx(s), near = Math.abs(d) < 170 || baleOn[side2(side)][i] || wallOn[side2(side)][i];
        if (!near || kindAt(i, side) < 3 || crH(d, side, 17) < 0.25 || (side === PSD && PD && (T.pitAt(s) || T.pitAt(s + 30) || T.pitAt(s - 30)))) continue;
        const [x, z] = atSf(s, side * ((side > 0 ? T.br[i] : T.bl[i]) + 0.9)), y = nrGround(x, z), k = (n++ * 3 + (side > 0 ? 1 : 0)) % 8, nx = T.nx[i] * side, nz = T.nz[i] * side, g = scen.get(x, z);
        board(x, y + 1.25, z, nx, nz, 3.6, 0.9, AT.ads + k);   // (the text read from the road)
        for (const q of [-1.5, 1.5]) box(g, x + nz * q + nx * 0.1, y - 0.3, z - nx * q + nz * 0.1, 0.14, 2.45, 0.14, T.hd[i], [0.4, 0.32, 0.24]);
        exclPush(x, z, 2.5);
      }
    }

    /* ---- START / FINISH: the gantry with the start lights and the banner (the 1930s: a banner on two white poles, a flag start) ---- */
    if (PER) {
      const [x, z, h, i] = atS(sStart, 0), gy = T.hy[i], g = scen.get(x, z), span = Math.max(T.bl[i], T.br[i]) + 0.8, nx = T.nx[i], nz = T.nz[i];
      for (const sd of [-1, 1]) box(g, x + nx * span * sd, gy - 0.3, z + nz * span * sd, 0.3, 6.3, 0.3, h, [0.92, 0.91, 0.87]);
      board(x, gy + 4.6, z, T.tx[i], T.tz[i], span * 2 - 0.6, 1.3, AT.rbr);   // (read from the grid)
      exclPush(x, z, span + 6);
    } else {
      const [x, z, h, i] = atS(sStart, 0), gy = T.hy[i], g = scen.get(x, z), span = Math.max(T.bl[i], T.br[i]) + 1.2, nx = T.nx[i], nz = T.nz[i], gray = [0.2, 0.22, 0.26];
      for (const sd of [-1, 1]) box(g, x + nx * span * sd, gy - 0.3, z + nz * span * sd, 0.8, 7.9, 0.8, h, gray);
      box(g, x, gy + 6.4, z, 1.1, 1.3, span * 2 + 0.8, h, [0.14, 0.15, 0.18], [0.24, 0.25, 0.3]);
      box(g, x, gy + 5.2, z, 0.5, 1.4, 5.2, h, [0.08, 0.08, 0.09]);
      const lights = [], lg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      for (let k = 0; k < 5; k++) { const o = (k - 2) * 1.0, m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x2a0606 })); m.position.set(x + nx * o, gy + 7.95, z + nz * o); m.rotation.y = -h; root.add(m); lights.push(m); }
      out.dyn.lights = lights;
      board(x - T.tx[i] * 0.6, gy + 6.45, z - T.tz[i] * 0.6, T.tx[i], T.tz[i], span * 2 - 2, 1.2, AT.rbr);
      exclPush(x, z, span + 6);
    }

    /* ---- Bathurst: the pit lane and the pit building on its side of the straight (LK.pitBox; the lane Core.Track.pitAt on the left,
       def.pit[0] < 0): asphalt from the pit wall to the garages, the lane's lines, the 13 crews' boxes (the renderer's crews: out.pitBoxes,
       the player's out.pitBox), a garage every 10 m (the crews' open in their team's colours, the others shut), a
       glazed floor above under a white roof, the race control tower ---- */
    let nBoxes = 0;
    if (LK.pitBox) {
      const [q0, q1, sd] = LK.pitBox, gq = new GB(true), gl = new GB(), one = [1, 1, 1], wl = [0.95, 0.95, 0.94], F = 18;   // (F: the garages' front past the pit wall)
      const TC = [[0.86, 0.12, 0.14], [0.12, 0.22, 0.5], [0.05, 0.42, 0.22], [0.98, 0.6, 0.1], [0.14, 0.14, 0.16], [0.95, 0.78, 0.12], [0.16, 0.36, 0.8], [0.94, 0.94, 0.92], [0.55, 0.26, 0.7], [0.1, 0.62, 0.72], [0.7, 0.1, 0.1], [0.4, 0.42, 0.46], [0.2, 0.3, 0.55]];
      const WH = [0.92, 0.92, 0.9], WT = [0.8, 0.81, 0.82], GLS = [0.3, 0.42, 0.55], SH = [0.72, 0.74, 0.77], DK = [0.12, 0.12, 0.13];
      const bw = (s) => { const i = T.idx(s); return sd > 0 ? T.br[i] : T.bl[i]; }, at = (s, o, y) => { const [x, z] = atSf(s, sd * o); return [x, hyS(s) + y, z]; };
      const up = (A, Bq, C, D) => (sd > 0 ? [A, Bq, C, D] : [Bq, A, D, C]), U = (p) => [p[0] / 8, -p[2] / 8];   // (quads from the road outwards, wound to face up)
      const strip = (g, s0, s1, oa0, ob0, oa1, ob1, y, col, uv) => { const Q = up(at(s0, oa0, y), at(s0, ob0, y), at(s1, ob1, y), at(s1, oa1, y)); g.quadUp(...Q, [col, col, col, col], uv ? Q.map(U) : undefined); };
      const B = (s, o, y, sx, sy, sz, col, top) => { const [x, z] = atSf(s, sd * o), i = T.idx(s); box(scen.get(x, z), x, hyS(s) + y, z, sx, sy, sz, T.hd[i], col, top); };
      const fac = new GB(true), FC = [0.86, 0.9, 0.96], glass = (s, o, a, y0, y1) => {   // the glass front towards the straight in the facade picture: its windows light up at dusk and at night (Render.litWindows)
        const A = at(sAt(dS(s) - a), o, y0), Bq = at(sAt(dS(s) + a), o, y0), C = at(sAt(dS(s) + a), o, y1), D = at(sAt(dS(s) - a), o, y1), bays = Math.max(1, Math.round(a * 2 / 3.3)), fl = Math.max(1, Math.round((y1 - y0) / 3.2));
        fac.quadO(A, Bq, C, D, FC, at(s, o + 3, (y0 + y1) / 2), [[0, 0], [bays, 0], [bays, fl], [0, fl]]); };
      for (let q = q0 - 20; q < q1 + 20; q += 2) { const s0 = sAt(q), s1 = sAt(q + 2); strip(gq, s0, s1, bw(s0) + 0.45, bw(s0) + F, bw(s1) + 0.45, bw(s1) + F, 0.03, one, true); }   // the apron
      if (PD) for (let q = PD[1]; q < PD[2]; q += 2) {   // the lane: its asphalt where it leaves and joins the circuit, a solid line on its outer edge, a dashed one on the inner
        const s0 = sAt(q), s1 = sAt(q + 2), pi = T.pitAt(s0), pj = T.pitAt(s1); if (!pi || !pj) continue;
        if (pi.t < 0.999 || pj.t < 0.999) strip(gq, s0, s1, pi.o - 3.5, pi.o + 3.5, pj.o - 3.5, pj.o + 3.5, 0.025, one, true);
        strip(gl, s0, s1, pi.o + 3.18, pi.o + 3.36, pj.o + 3.18, pj.o + 3.36, 0.04, wl);
        if (((q / 2) | 0) % 2 === 0) strip(gl, s0, s1, pi.o - 3.36, pi.o - 3.18, pj.o - 3.36, pj.o - 3.18, 0.04, wl);
      } else for (let q = q0; q < q1; q += 2) { const s0 = sAt(q), s1 = sAt(q + 2); strip(gl, s0, s1, bw(s0) + 7.8, bw(s0) + 8, bw(s1) + 7.8, bw(s1) + 8, 0.04, wl); }   // (no pits: the lane's line only)
      if (PD) pitJunction(gq, gl, hyS);   // the deceleration and acceleration lanes, the gores (in the lane's meshes)
      const [pq0, pq1] = def.pitRow || [q0, q1], crew = new Map();
      if (PD) for (let q = pq0; q <= pq1 && nBoxes < 13; q += 10) {   // the crews' boxes (a box every 10 m: q .. q + 10 m after the start line)
        const s0 = sAt(q), i = T.idx(s0), p = T.pitAt(s0); if (!p || p.t < 0.999) continue;
        const k = nBoxes++, nx = sd * T.nx[i], nz = sd * T.nz[i], tx = T.tx[i], tz = T.tz[i], base = p.o + 3.5, mine = PD[3] != null && Math.abs(q + 5 - PD[3]) < 1, oc = atSf(s0 + 5, 0), tc = TC[k % TC.length];
        strip(gl, sAt(q - 0.09), sAt(q + 0.09), base, base + 9, base, base + 9, 0.034, wl);   // the box's divider line
        if (mine) { const sb = sAt(q + 5), cx = T.px[i] + nx * (base + 4.2) + tx * 5, cz = T.pz[i] + nz * (base + 4.2) + tz * 5, bp = T.bayPose(PD[3]);   // (the car stops in its box on the apron, parked straight in front of the garage: Core's BAY; turned to the lane's side, sd)
          out.pitBox = { s: sb, x: cx, z: cz, hd: T.hd[i], tx, tz, nx, nz, lane: p.o, wallO: p.wall, apron0: base, garage0: base + 9, stop: atSf(sb, sd * bp.o), stopO: bp.o, stopA: sd * bp.a }; }
        (out.pitBoxes = out.pitBoxes || []).push({ k, s: s0 + 5, ox: oc[0], oz: oc[1], tx, tz, nx, nz, hd: T.hd[i], base, lane: p.o, wall: p.wall, team: tc, mine, y: hyS(s0 + 5) });
        { const f0 = bw(sAt(q + 5)) + F; out.pitBoxes[out.pitBoxes.length - 1].gar = { band: [f0 - 0.06, 3.4, 3.9, 4.7], wall: [f0, 0.02, 3.38, 4.76], jamb: [f0, 4.9, 0.25, 3.4], road: 'jamb' }; }   // (its garage, below, for the renderer's team colours: the band; a door before the dark inside, between the side walls; their fronts)
        crew.set(q, tc);
      }
      T.pitStands = null;   // (no team stands on the pit wall here)
      for (let q = q0, k = 0; q < q1; q += 10, k++) {   // the garages (F m past the pit wall, 9 m deep) and the floor above
        const s = sAt(q + 5), f0 = bw(s) + F, tc = crew.get(q), open = tc || (!PD && k % 3 === 1);
        B(s, f0 + 9, -2.5, 10, 6.5, 0.3, WH);                                                     // back wall
        for (const e of [-4.9, 4.9]) B(sAt(q + 5 + e), f0 + 4.5, -2.5, 0.25, 6.5, 9, WH);           // side walls
        B(s, f0 + 4.5, 4, 10.02, 0.4, 9.2, WH, WT);                                                 // ceiling
        if (open) { B(s, f0 + 4.6, -0.3, 9.4, 4.2, 8.6, DK); B(s, f0 - 0.02, 3.4, 9.4, 0.5, 0.08, tc || TC[(k / 3 | 0) % 6]); }   // open: dark inside, the team's band
        else B(s, f0 + 0.1, 0, 9.4, 3.6, 0.1, SH);                                                 // a shutter
        B(s, f0 + 5.2, 4.4, 10.02, 3.4, 7.8, GLS, WH); glass(s, f0 + 1.28, 5, 4.4, 7.8);           // the glazed floor, set back
        B(s, f0 + 4.4, 7.8, 10.02, 0.45, 10.4, WH, [0.84, 0.85, 0.87]);                             // the roof, overhanging the apron
        const [ex, ez] = atSf(s, sd * (f0 + 4.5)); exclPush(ex, ez, 12); CR.exclAdd(ex, ez, 10);
      }
      { const qm = (q0 + q1) / 2 + 20, s = sAt(qm), f0 = bw(s) + F, i = T.idx(s);   // race control: a glazed tower over the middle, its name to the straight
        B(s, f0 + 5, 8.2, 12, 9, 10, [0.86, 0.87, 0.88], WH); B(s, f0 + 0.6, 12, 12.1, 4.4, 1.2, GLS); B(s, f0 + 5, 17.2, 13, 0.5, 11, WH); glass(s, f0 - 0.02, 6, 12, 16.4);
        const [bx, bz] = atSf(s, sd * (f0 - 0.1)); board(bx, hyS(s) + 9.2, bz, sd * T.nx[i], sd * T.nz[i], 11, 1.7, AT.rbr); }
      addM(gq, aMat); addM(gl, lMat); addM(fac, new THREE.MeshLambertMaterial({ map: tex.facade, vertexColors: true }));
    }

    /* ---- the pit lane (Core.Track.pitAt): the lane and its lines, the concrete apron with the boxes and the crews' kit, the team stands on the
       strip behind the pit wall, the garages; the renderer's crews work in the 13 boxes (out.pitBoxes, the player's out.pitBox) ---- */
    if (PD && !LK.pitBox) {   // (Bathurst: its own, above)
      const gl = new GB(true), gp = new GB(), one = [1, 1, 1], wl = [0.95, 0.95, 0.94], apC = PER ? [0.5, 0.49, 0.46] : [0.8, 0.81, 0.78], [pq0, pq1] = def.pitRow || [PD[1] + 80, PD[1] + 200];   // (the 1930s: a tarmac apron)
      const at = (s, o, y) => { const [x, z] = atSf(s, o); return [x, hyS(s) + y, z]; };
      for (let q = PD[1]; q < PD[2]; q += 2) {
        const s0 = sStart + q, s1 = s0 + 2, pi = T.pitAt(s0), pj = T.pitAt(s1); if (!pi || !pj) continue;
        const A = at(s0, pi.o - 3.5, 0.024), Bq = at(s0, pi.o + 3.5, 0.024), C = at(s1, pj.o + 3.5, 0.024), D = at(s1, pj.o - 3.5, 0.024);
        gl.quadUp(A, Bq, C, D, [one, one, one, one], [[A[0] / 8, -A[2] / 8], [Bq[0] / 8, -Bq[2] / 8], [C[0] / 8, -C[2] / 8], [D[0] / 8, -D[2] / 8]]);
        gp.quadUp(at(s0, pi.o + 3.18, 0.033), at(s0, pi.o + 3.36, 0.033), at(s1, pj.o + 3.36, 0.033), at(s1, pj.o + 3.18, 0.033), [wl, wl, wl, wl]);   // solid line on the outer edge
        if (((q / 2) | 0) % 2 === 0) gp.quadUp(at(s0, pi.o - 3.36, 0.033), at(s0, pi.o - 3.18, 0.033), at(s1, pj.o - 3.18, 0.033), at(s1, pj.o - 3.36, 0.033), [wl, wl, wl, wl]);   // dashed inner line
        if (pi.t > 0.999 && pj.t > 0.999) { gp.quadUp(at(s0, pi.o + 3.5, 0.022), at(s0, pi.o + 12.5, 0.022), at(s1, pj.o + 12.5, 0.022), at(s1, pj.o + 3.5, 0.022), LK.apron ? LK.apron(q) : [apC, apC, apC, apC]);   // concrete apron (LK.apron: Rio's, weathered slab by slab)
          if (q % 20 === 0) gp.quadUp(at(s0, pi.o + 3.5, 0.03), at(s0, pi.o + 3.7, 0.03), at(s1, pj.o + 3.7, 0.03), at(s1, pj.o + 3.5, 0.03), [wl, wl, wl, wl]); }   // (dashes along the fast lane's edge)
      }
      pitJunction(gl, gp, hyS);   // the deceleration and acceleration lanes, the gores (in the lane's meshes)
      const TEAM = [[0.12, 0.16, 0.36], [0.85, 0.12, 0.14], [0.16, 0.46, 0.3], [0.96, 0.52, 0.1], [0.94, 0.94, 0.92], [0.14, 0.14, 0.16], [0.16, 0.36, 0.8], [0.1, 0.62, 0.72], [0.96, 0.78, 0.12], [0.55, 0.26, 0.7], [0.4, 0.42, 0.46], [0.7, 0.1, 0.1], [0.2, 0.3, 0.55]];
      const kbox = (g, s0, a, wo, y, sx, sy, sz, col, top, nb) => { const [x, z, hd] = atSf(s0 + a, wo); box(g, x, hyS(s0 + a) + y, z, sx, sy, sz, hd, col, top, nb); };
      const kcyl = (g, s0, a, wo, y, r, h, n, col, top) => { const [x, z] = atSf(s0 + a, wo); cyl(g, x, hyS(s0 + a) + y, z, r, h, n, col, top); };
      const kface = (g, s0, a0, a1, wo, y0, y1, col, dir) => { const [x0, z0] = atSf(s0 + a0, wo), [x1, z1] = atSf(s0 + a1, wo), [xb, zb] = atSf(s0 + (a0 + a1) / 2, wo - (dir || -1) * 0.2), yy = hyS(s0 + (a0 + a1) / 2);
        g.quadO([x0, yy + y0, z0], [x1, yy + y0, z1], [x1, yy + y1, z1], [x0, yy + y1, z0], col, [xb, yy + (y0 + y1) / 2, zb]); };
      const CAB = [[0.78, 0.14, 0.12], [0.2, 0.21, 0.24], [0.15, 0.3, 0.62], [0.12, 0.12, 0.13]], CMP = [[0.86, 0.14, 0.12], [0.95, 0.8, 0.14], [0.92, 0.92, 0.9]], BLK = [0.13, 0.13, 0.15], SIL = [0.66, 0.68, 0.72], SCR = [0.16, 0.24, 0.38];
      const blankets = (g, s0, a, wo, y, n, h, cmp) => { kcyl(g, s0, a, wo, y, 0.36, n * h, 8, BLK, [0.17, 0.17, 0.19]); for (let l = 0; l < n; l++) kcyl(g, s0, a, wo, y + (l + 0.42) * h, 0.366, h * 0.16, 8, cmp); };
      const cabinet = (g, s0, a, wo, sx, sy, sz, col) => { kbox(g, s0, a, wo, 0, sx * 0.94, 0.1, sz * 0.9, [0.08, 0.08, 0.09], null, true); kbox(g, s0, a, wo, 0.1, sx, sy, sz, col, [0.1, 0.1, 0.11]);
        for (let d = 0; d < 4; d++) { const y = 0.1 + sy * (0.22 + d * 0.2); kface(g, s0, a - sx * 0.43, a + sx * 0.43, wo - sz / 2 - 0.004, y, y + 0.025, SIL); } };
      const pitKit = (g, s0, k, base, wv, mine) => {   // per crew box: a roll cab, tyres on a trolley, a monitor cart and an air-line reel on the apron, the team's stand on the pit wall strip
        const h = (k * 7 + 3) % 4, cmp = CMP[k % 3], mc = mine ? 9.35 : 3.4;   // (the player's apron is kept clear: the crew runs across it)
        if (!mine) { cabinet(g, s0, 1.6, base + 7.6, 1.15, 0.95, 0.62, CAB[h]);
          kbox(g, s0, 7.6, base + 7.5, 0.06, 1.75, 0.12, 0.9, [0.2, 0.2, 0.22]);
          for (const ta of [7.18, 8.02]) blankets(g, s0, ta, base + 7.5, 0.18, 2, 0.5, cmp); }
        kbox(g, s0, mc, base + 8.25, 0, 0.62, 0.95, 0.5, [0.22, 0.23, 0.26], [0.12, 0.12, 0.13]); kbox(g, s0, mc, base + 8.3, 0.95, 0.06, 0.38, 0.06, [0.15, 0.15, 0.16], null, true);
        kbox(g, s0, mc, base + 8.28, 1.33, 1.2, 0.4, 0.05, [0.07, 0.07, 0.08]); for (const ma of [-0.3, 0.3]) kface(g, s0, mc + ma - 0.26, mc + ma + 0.26, base + 8.25, 1.37, 1.7, SCR);
        kbox(g, s0, 0.75, base + 8.75, 0, 0.3, 1.1, 0.3, [0.3, 0.31, 0.34], null, true); kcyl(g, s0, 0.75, base + 8.75, 1.1, 0.3, 0.22, 10, [0.8, 0.15, 0.12], [0.85, 0.2, 0.16]);
        kbox(g, s0, 5, wv + 0.72, 0.96, 2.5, 0.06, 1.0, [0.3, 0.31, 0.34], [0.36, 0.37, 0.4]);   // the stand behind the pit wall: a desk with screens, a roof, stools
        for (const la of [-1.18, 1.18]) for (const lw of [0.28, 1.16]) kbox(g, s0, 5 + la, wv + lw, 0, 0.07, 0.96, 0.07, [0.22, 0.22, 0.24], null, true);
        kbox(g, s0, 5, wv + 0.34, 1.02, 2.1, 0.4, 0.05, [0.07, 0.07, 0.08]); for (const ma of [-0.7, 0, 0.7]) kface(g, s0, 5 + ma - 0.3, 5 + ma + 0.3, wv + 0.368, 1.05, 1.39, SCR, 1);
        for (const pa of [-1.2, 1.2]) kbox(g, s0, 5 + pa, wv + 0.2, 0, 0.08, 2.5, 0.08, [0.25, 0.26, 0.28], null, true);
        kbox(g, s0, 5, wv + 0.8, 2.5, 2.7, 0.07, 1.55, [0.22, 0.23, 0.26], TEAM[k % TEAM.length]);
        for (const sa of [-0.62, 0.62]) kcyl(g, s0, 5 + sa, wv + 1.5, 0, 0.17, 0.48, 7, [0.14, 0.14, 0.16], [0.2, 0.2, 0.22]); };
      // the crews' boxes (a box every 10 m: q .. q + 10 m after the start line)
      for (let q = pq0, k = 0; q <= pq1; q += 10, k++) { const s0 = sStart + q, i = T.idx(s0), p = T.pitAt(s0); if (!p || p.t < 0.999) continue;
        const tx = T.tx[i], tz = T.tz[i], base = p.o + 3.5, hd = T.hd[i];
        { const L0 = at(s0 - 0.09, base, 0.034), L1 = at(s0 + 0.09, base, 0.034), L2 = at(s0 + 0.09, base + 9, 0.034), L3 = at(s0 - 0.09, base + 9, 0.034); gp.quadUp(L0, L1, L2, L3, [wl, wl, wl, wl]); }   // box divider line
        if (nBoxes >= 13) continue; nBoxes++;
        const tc = TEAM[k % TEAM.length], cx = T.px[i] + T.nx[i] * (base + 4.2) + tx * 5, cz = T.pz[i] + T.nz[i] * (base + 4.2) + tz * 5;
        const mine = PD[3] != null && Math.abs(q + 5 - PD[3]) < 1, yb = hyS(s0 + 5);
        if (mine) { const sb = s0 + 5, bp = T.bayPose(PD[3]);
          out.pitBox = { s: sb, x: cx, z: cz, hd, tx, tz, nx: T.nx[i], nz: T.nz[i], lane: p.o, wallO: p.wall, apron0: base, garage0: base + 9, stop: atSf(sb, bp.o), stopO: bp.o, stopA: bp.a }; }
        if (!PER) pitKit(scen.get(cx, cz), s0, k, base, p.wall, mine);
        else {   // the 1930s: a timber pit stall at the back of the apron (a counter, a roof on four posts, the number board), fuel churns and spare wheels
          const g = scen.get(cx, cz), wd = [0.5, 0.39, 0.27], wdL = [0.62, 0.5, 0.35], f0 = base + 9;
          if (!mine) kbox(g, s0, 5, f0 + 0.3, 0, 9.2, 1.05, 0.6, wd, wdL);   // (the counter: not in the player's stall, its crew waits there and runs out to the car)
          for (const a of [0.6, 9.4]) for (const o of [f0, f0 + 2.6]) kbox(g, s0, a, o, 0, 0.16, 2.7, 0.16, wd, null, true);
          kbox(g, s0, 5, f0 + 1.3, 2.7, 10, 0.12, 3.2, [0.3, 0.3, 0.3], [0.42, 0.4, 0.38]);
          kbox(g, s0, 5, f0 - 0.02, 2.1, 1.4, 0.55, 0.06, [0.94, 0.92, 0.86], null, true);
          if (!mine) { for (const a of [2.0, 2.6]) kcyl(g, s0, a, f0 - 0.6, 0, 0.22, 0.75, 7, [0.6, 0.12, 0.1], [0.5, 0.5, 0.5]); kcyl(g, s0, 8.2, f0 - 0.6, 0, 0.36, 0.36, 9, [0.1, 0.1, 0.11], [0.2, 0.2, 0.2]); }
          exclPush(cx, cz, 7);
        }
        const oc = atSf(s0 + 5, 0);   // for the renderer's crews: the box centre on the centre line, the box frame, the floor's height
        (out.pitBoxes = out.pitBoxes || []).push({ k, s: s0 + 5, ox: oc[0], oz: oc[1], tx, tz, nx: T.nx[i], nz: T.nz[i], hd, base, lane: p.o, wall: p.wall, team: tc, mine, y: yb });
        out.pitBoxes[out.pitBoxes.length - 1].gar = PER ? { band: [base + 8.7, 2.66, 2.94, 4.8], wall: [base + 11.95, 0.02, 2.68, 4.7] }   // (its garage, for the renderer's team colours: the 1930s stall: a fascia on the roof's front edge, a cloth behind the back posts;
          : LK.pits80 ? { band: [base + 8.955, 3.42, 3.92, 4.7], wall: [base + 16.85, 0.03, 3.95, 4.74], jamb: [base + 9, 4.88, 0.25, 3.42], road: 'jamb' }   // Rio's, rioPits: the band over the door, the back wall, the side walls' fronts;
          : { band: [base + 8.955, 3.45, 3.95, 4.7], wall: [base + 15.9, 0.03, 3.9, 4.74], jamb: [base + 9, 4.56, 0.9, 3.45], road: 'jamb' }; }   // the pit building's: the band, the back wall, the front pillars)
      { const pbs = out.pitBoxes; T.pitStands = null;   // the stands on the strip behind the pit wall: Core keeps the player's car off them, a low kerb along that limit
        if (pbs && pbs.length) { T.pitStands = [dS(pbs[0].s) - 1.35, dS(pbs[pbs.length - 1].s) + 1.35];
          const kt = [0.86, 0.86, 0.83], kf = [0.66, 0.67, 0.64];
          for (let q = T.pitStands[0] - 28; q < T.pitStands[1] + 28; q += 2) {
            const s0 = sStart + q, pi = T.pitAt(s0), pj = T.pitAt(s0 + 2); if (!pi || !pj || pi.gap || pj.gap) continue;
            const ai = pi.inner, aj = pj.inner; if (ai - pi.wall < 0.15 && aj - pj.wall < 0.15) continue;
            gp.quadUp(at(s0, ai - 0.15, 0.1), at(s0, ai, 0.1), at(s0 + 2, aj, 0.1), at(s0 + 2, aj - 0.15, 0.1), [kt, kt, kt, kt]);
            gp.quadO(at(s0, ai, 0.02), at(s0 + 2, aj, 0.02), at(s0 + 2, aj, 0.1), at(s0, ai, 0.1), kf, at(s0, ai - 1, 0.05));
            gp.quadO(at(s0 + 2, aj - 0.15, 0), at(s0, ai - 0.15, 0), at(s0, ai - 0.15, 0.1), at(s0 + 2, aj - 0.15, 0.1), kf, at(s0, ai + 1, 0.05)); } } }
      for (const [q0, dq] of [[PD[1] + 30, 4], [PD[2] - 26, -4]]) for (let k = 0; k < 3; k++) {   // knockable cones on the noses where the lane leaves and joins
        const s = sStart + q0 + k * dq, i = T.idx(s), p = T.pitAt(s); if (!p) continue; const o = (T.br[i] + 0.9 + p.o - 3.5) / 2; if (o < T.br[i] + 0.5 || o > p.o - 4) continue;
        const [x, z] = atS(s, o); out.props.push({ kind: 'cone', x, z, yaw: R() * TAU, col: 0 }); }
      { const sE = sStart + PD[1] + 20, pE = T.pitAt(sE);   // the sign at the pit entry: BOKSI with an arrow, the 80 km/h limit
        if (pE) { const [x, z] = atSf(sE, pE.lout + 3.4), i = T.idx(sE), y = hyS(sE), g = scen.get(x, z);
          const c2 = document.createElement('canvas'); c2.width = 256; c2.height = 160; const x2 = c2.getContext('2d');
          x2.fillStyle = '#1f3f8c'; x2.fillRect(0, 0, 256, 160); x2.strokeStyle = '#f4f1ec'; x2.lineWidth = 7; x2.strokeRect(5, 5, 246, 150);
          x2.fillStyle = '#f4f1ec'; x2.font = '900 50px "Russo One", "Arial Black", Arial, sans-serif'; x2.textAlign = 'center'; x2.textBaseline = 'middle'; x2.fillText('BOKSI', 96, 52);
          x2.beginPath(); x2.moveTo(186, 30); x2.lineTo(232, 52); x2.lineTo(186, 74); x2.lineTo(186, 62); x2.lineTo(166, 62); x2.lineTo(166, 42); x2.lineTo(186, 42); x2.closePath(); x2.fill();
          x2.fillStyle = '#f4f1ec'; x2.beginPath(); x2.arc(128, 116, 34, 0, Math.PI * 2); x2.fill(); x2.strokeStyle = '#c8261f'; x2.lineWidth = 9; x2.beginPath(); x2.arc(128, 116, 29, 0, Math.PI * 2); x2.stroke();
          x2.fillStyle = '#16171a'; x2.font = '900 32px "Russo One", "Arial Black", Arial, sans-serif'; x2.fillText('80', 128, 118);
          let fx = -T.tx[i] - T.nx[i] * 0.45, fz = -T.tz[i] - T.nz[i] * 0.45; const fl = Math.hypot(fx, fz); fx /= fl; fz /= fl;
          const bm = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.6), new THREE.MeshLambertMaterial({ map: ownTex(new THREE.CanvasTexture(c2)) }));
          bm.position.set(x + fx * 0.14, y + 3.1, z + fz * 0.14); bm.rotation.set(-0.12, Math.atan2(fx, fz), 0, 'YXZ'); bm.castShadow = true; root.add(bm);
          box(g, x, y + 1.8, z, 4.4, 2.8, 0.2, Math.atan2(-fx, fz), [0.86, 0.85, 0.82], [0.86, 0.85, 0.82]);
          for (const q2 of [-1.6, 1.6]) box(g, x + fz * q2, y, z - fx * q2, 0.22, 2.0, 0.22, 0, [0.62, 0.63, 0.66]);
          exclPush(x, z, 3.5); } }
      addM(gl, aMat); addM(gp, lMat);
      if (!PER) {   // (the 1930s: the stalls above, no pit building, paddock or race control)

      if (LK.pits80) podAt = rioPits({ PD, PB, hyS, atSf, at, kbox, kface, scen, board, AT, exclPush, flagAt, TEAM, pq0, pq1, CR });   // (Rio: its 1970s pit building instead)
      else {   // (the modern pit building, its paddock and the Energy Station)
      /* ---- the pit building (300 m, 34 garages): garages open at the front (the crews' boxes in their team colours, the others behind grey
         shutters), two glazed floors above, the roof terrace under a white canopy, the race control tower at the end; the paddock behind ---- */
      const WH = [0.92, 0.92, 0.9], WT = [0.78, 0.78, 0.8], GLS = [0.3, 0.42, 0.55], GLD = [0.2, 0.28, 0.38], SH = [0.72, 0.74, 0.77];
      const gb = (s) => { const p = T.pitAt(s); return p && p.t > 0.999 ? p.o + 12.5 : null; };   // the garages' front (the apron's back edge)
      const crewQ = new Set(); for (let q = pq0, n = 0; q <= pq1 && n < 13; q += 10) { const p = T.pitAt(sStart + q); if (p && p.t >= 0.999) { crewQ.add(q); n++; } }
      const CU = [[-2.4, 14.7], [0, 15.5], [4, 16.2], [9, 16.7], [14.2, 17.6]], CL = [[-2.4, 14.7], [0, 14.95], [4, 15.3], [9, 15.8], [14.2, 17.3]];   // the canopy's profile (from the garages' front)
      let bay0 = null, bay1 = null;
      for (let q = pq0 - Math.floor((pq0 - PB[0]) / 10) * 10; q < PB[1] - 5; q += 10) {   // (the bays line up with the crews' boxes)
        const s0 = sStart + q, f0 = gb(s0 + 5); if (f0 == null) continue;
        const o = f0 + 3.6, ik = T.idx(s0 + 1), g = scen.get(T.px[ik] + T.nx[ik] * o, T.pz[ik] + T.nz[ik] * o), b0 = f0 + 7.2, crew = crewQ.has(q), k = crew ? ((q - pq0) / 10) | 0 : 0;
        kbox(g, s0, 5, o, 4.0, 10.02, 0.4, 7.2, WH, WT);                                                     // the ground floor's ceiling
        kbox(g, s0, 5, b0 - 0.15, 0, 10.02, 4.0, 0.3, WH, null, true);                                       // back wall
        for (const sd of [-1, 1]) { kbox(g, s0, 5 + sd * 4.885, o, 0, 0.25, 4.0, 7.2, WH, null, true); kbox(g, s0, 5 + sd * 4.56, f0 + 0.15, 0, 0.9, 3.3, 0.3, WH, null, true); }   // side walls, front pillars
        kbox(g, s0, 5, f0 + 0.15, 3.3, 10.02, 0.7, 0.3, WH);                                                  // header over the door
        if (crew) {
          kbox(g, s0, 5, f0 - 0.02, 3.45, 9.4, 0.5, 0.05, TEAM[k % TEAM.length]);                           // coloured band
          kbox(g, s0, 5, o, 0, 9.52, 0.03, 6.9, [0.44, 0.46, 0.49], [0.52, 0.54, 0.57], true);                // epoxy floor
          kbox(g, s0, 5, b0 - 0.33, 1.7, 1.5, 0.85, 0.04, [0.07, 0.07, 0.08], null, true); kface(g, s0, 4.31, 5.69, b0 - 0.352, 1.75, 2.5, SCR);   // timing screen
          for (const ca of [1.3, 2.5, 7.5, 8.7]) cabinet(g, s0, ca, b0 - 0.64, 1.15, 1.0, 0.6, [0.2, 0.21, 0.24]);
          for (const ta of [0.85, 9.15]) blankets(g, s0, ta, o - 0.6, 0.03, 3, 0.46, CMP[(k + (ta > 5 ? 1 : 0)) % 3]);
          for (const la of [-1.9, 1.9]) kbox(g, s0, 5 + la, o, 3.92, 0.28, 0.07, 5.8, [0.98, 0.98, 0.94]);
        } else {
          kface(g, s0, 0.55, 9.45, f0 + 0.32, 0.02, 3.3, SH);                                                 // shutter
          for (let y = 0.4; y < 3.3; y += 0.45) kface(g, s0, 0.55, 9.45, f0 + 0.31, y, y + 0.04, [0.6, 0.62, 0.65]);
        }
        // the floors above: glazed, each set back a little behind a white slab, and the roof terrace
        const back = b0 + 4.6;
        kbox(g, s0, 5, (f0 + 0.8 + back) / 2, 4.4, 10.02, 3.6, back - f0 - 0.8, GLS, WH);
        kbox(g, s0, 5, (f0 + back) / 2, 8.0, 10.02, 0.45, back - f0, WH, WT);
        kbox(g, s0, 5, (f0 + 1.4 + back) / 2, 8.45, 10.02, 3.4, back - f0 - 1.4, GLS, WH);
        kbox(g, s0, 5, (f0 + 0.2 + back) / 2, 11.85, 10.02, 0.4, back - f0 - 0.2, WH, [0.84, 0.85, 0.87]);
        kbox(g, s0, 5, f0 + 1.2, 12.25, 10.02, 1.0, 0.1, [0.75, 0.8, 0.85]);                                  // the terrace's glass railing
        for (let p = 0; p + 1 < CU.length; p++) for (const [pr, cl, dn] of [[CU, p === 0 ? [0.86, 0.12, 0.16] : [0.96, 0.96, 0.95], -9], [CL, [0.74, 0.75, 0.78], 9]]) {   // the canopy: a wing (Domenig), cambered, the red leading edge over the apron
          const A = at(s0, f0 + pr[p][0], pr[p][1]), B = at(s0 + 10, f0 + pr[p][0], pr[p][1]), C = at(s0 + 10, f0 + pr[p + 1][0], pr[p + 1][1]), D = at(s0, f0 + pr[p + 1][0], pr[p + 1][1]);
          g.quadO(A, B, C, D, cl, at(s0 + 5, f0 + pr[p][0], pr[p][1] + dn)); }
        if (q % 20 === 0) for (const [lw, yc] of [[f0 + 1.5, 15.0], [b0 + 3.8, 16.0]]) kbox(g, s0, 0.2, lw, 12.25, 0.3, yc - 12.25, 0.3, [0.85, 0.86, 0.88], null, true);   // its columns
        kbox(g, s0, 5, b0 + 2.2, 0, 10.02, 11.9, 4.6, [0.84, 0.84, 0.82], null, true);                        // the back half (offices, the paddock side)
        exclPush(T.px[ik] + T.nx[ik] * o, T.pz[ik] + T.nz[ik] * o, 12);
        if (!bay0) bay0 = { s: s0, f0 }; bay1 = { s: s0 + 10, f0 };
      }
      { const s = sAt(-130), f0 = gb(s);   // the podium's place on the roof terrace: between two of the canopy's columns (at -139.8 and -119.8 m)
        if (f0 != null) { podAt = { s, f0 };
          const i = T.idx(s), [u0, v0, u1, v1] = AUV(AT.rbr), y = hyS(s) + 12.25, Q = (a, o, yy) => { const [x, z] = atSf(s + a, o); return [x, yy, z]; };
          ban.quadO(Q(4, f0 + 1.13, y + 0.05), Q(-4, f0 + 1.13, y + 0.05), Q(-4, f0 + 1.13, y + 1.0), Q(4, f0 + 1.13, y + 1.0), W1, Q(0, f0 + 3, y + 0.5), [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);   // the banner on its railing
          ban.quadO(Q(3, f0 + 4.22, y + 1.75), Q(-3, f0 + 4.22, y + 1.75), Q(-3, f0 + 4.22, y + 3.05), Q(3, f0 + 4.22, y + 3.05), W1, Q(0, f0 + 6, y + 2.4), [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);   // on its backdrop
          for (const a of [4.4, -4.4]) { const [x, z] = atSf(s + a, f0 + 3.4); flagAt(x, y, z, 2.75, LK.flags.podium, 1.8); } } }   // Austrian flags either side (under the canopy)
      for (const [bb, sd] of [[bay0, -1], [bay1, 1]]) if (bb) {   // the canopy's end plates: navy, a red edge along the top
        const e = bb.s + sd * 0.3, ins = at(e, bb.f0 + 6, 15.2), g = scen.get(...atSf(bb.s, bb.f0 + 6).slice(0, 2)), nv = [0.12, 0.16, 0.32], rd = [0.86, 0.12, 0.16];   // (ins: the plate's middle)
        const Pp = [[-3.0, 12.2], [-3.0, 15.9], [14.8, 18.9], [14.8, 12.2]].map(([oo, y]) => [bb.f0 + oo, y]);
        for (const dd of [-0.3, 0.3]) g.quadO(at(e + dd, ...Pp[0]), at(e + dd, ...Pp[1]), at(e + dd, ...Pp[2]), at(e + dd, ...Pp[3]), nv, ins);
        for (let k = 0; k < 4; k++) { const P1 = Pp[k], P2 = Pp[(k + 1) % 4]; g.quadO(at(e - 0.3, ...P1), at(e + 0.3, ...P1), at(e + 0.3, ...P2), at(e - 0.3, ...P2), k === 1 ? rd : nv, ins); }
      }
      { const q = PB[1] - 5, s0 = sStart + q, f0 = gb(s0), o = f0 != null ? f0 + 6 : 38, ik = T.idx(s0), g = scen.get(T.px[ik] + T.nx[ik] * o, T.pz[ik] + T.nz[ik] * o);   // race control: a glazed tower
        kbox(g, s0, 6, o, 0, 12, 18, 12, [0.86, 0.87, 0.88], WH); kface(g, s0, 0.5, 11.5, o - 6.02, 12.5, 17.2, GLD); kbox(g, s0, 6, o, 18, 13, 0.5, 13, WH);
        board(...(() => { const [x, z] = atSf(s0 + 6, o - 6.1); return [x, hyS(s0) + 18.6, z]; })(), T.nx[ik], T.nz[ik], 11, 1.7, AT.rbr);   // (its name board faces the straight)
        exclPush(T.px[ik] + T.nx[ik] * o, T.pz[ik] + T.nz[ik] * o, 14); }
      // the paddock behind the pit building: asphalt, the teams' transporters and motorhomes in rows
      { const gpd = new GB(true), pc = [0.95, 0.95, 0.97];
        for (let q = PB[0] - 20; q < PB[1] + 60; q += 4) { const s0 = sStart + q, i = T.idx(s0), j = T.idx(s0 + 4), f = gb(s0 + 2) || 30.5;   // (on to the Energy Station)
          const A = Pt(i, f + 14, 0.03), B = Pt(i, f + 62, 0.03), C = Pt(j, f + 62, 0.03), D = Pt(j, f + 14, 0.03), uv = (p) => [p[0] / 8, -p[2] / 8];
          gpd.quadUp(A, B, C, D, [pc, pc, pc, pc], [uv(A), uv(B), uv(C), uv(D)]); }
        addM(gpd, aMat);
        for (let q = PB[0], k = 0; q < PB[1]; q += 14, k++) { const s0 = sStart + q, f = gb(s0) || 30.5, tc = TEAM[k % TEAM.length];
          for (const [lw, trk] of [[f + 26, 1], [f + 44, 0]]) { const [x, z, hd] = atSf(s0, lw), y = hyS(s0), g = scen.get(x, z);
            if (trk) { box(g, x, y + 0.3, z, 13.6, 3.6, 2.5, hd, [0.92, 0.92, 0.93], tc); box(g, x + Math.cos(hd) * 7.9, y + 0.3, z + Math.sin(hd) * 7.9, 2.2, 3.2, 2.5, hd, tc, tc);   // a transporter: trailer and tractor
              for (const wa of [-5, -3.6, 5.6, 8.2]) for (const sd of [-1, 1]) box(g, x + Math.cos(hd) * wa - Math.sin(hd) * sd * 1.05, y, z + Math.sin(hd) * wa + Math.cos(hd) * sd * 1.05, 1.0, 1.0, 0.35, hd, [0.08, 0.08, 0.09], null, true); }
            else { box(g, x, y, z, 12, 6.4, 7, hd, [0.95, 0.95, 0.96], tc); box(g, x, y + 6.4, z, 12.6, 0.3, 7.6, hd, tc, tc); kface(g, s0, -5.5, 5.5, lw - 3.52, 1.2, 5.6, GLD); }   // a motorhome: two storeys of glass
            exclPush(x, z, 9); } } }
      // the Red Bull Energy Station at the paddock's end towards Turn 1: the team's house, three floors of glass under a wide navy roof with
      // the name on top, the top floor set back behind a terrace with sunshades, a pool in front, flags
      { const s0 = sStart + PB[1] + 24, f = gb(s0 + 17) || 30.5, o = f + 40, [cx, cz] = atSf(s0 + 17, o), ik = T.idx(s0 + 17), g = scen.get(cx, cz), NV = [0.12, 0.16, 0.32], RD = [0.86, 0.12, 0.16];
        kbox(g, s0, 17, o, -0.7, 35, 0.85, 25, [0.74, 0.75, 0.77], [0.8, 0.81, 0.82]);                        // the plinth
        kbox(g, s0, 17, o + 1, 0.15, 31, 4.2, 21, GLD, WH, true);                                            // the ground floor, set back
        kbox(g, s0, 17, o, 4.35, 34, 0.45, 24, WH, WT); kbox(g, s0, 17, o, 4.8, 33.4, 3.9, 23.4, GLS, WH, true);
        kbox(g, s0, 17, o, 8.7, 34, 0.45, 24, WH, WT); kbox(g, s0, 17, o + 3.5, 9.15, 28, 3.6, 16, GLD, WH, true);
        kbox(g, s0, 17, o, 12.75, 38, 0.6, 28, NV, [0.66, 0.68, 0.72]);                                      // the roof, overhanging
        { const [rx0, rz0] = atSf(s0 + 17, o), nx = T.nx[ik], nz = T.nz[ik], lx = nz, lz = -nx, Wn = 26, Hn = 6.5, yR = hyS(s0 + 17) + 13.37, [u0, v0, u1, v1] = AUV(AT.ban + BAN.findIndex(b => b[0] === 'BERG'));
          const Q = (a, b) => [rx0 + lx * a + nx * b, yR, rz0 + lz * a + nz * b];   // the name painted on the roof, read from the track (a: to the reader's left, b: away)
          ban.quadO(Q(Wn / 2, -Hn / 2), Q(-Wn / 2, -Hn / 2), Q(-Wn / 2, Hn / 2), Q(Wn / 2, Hn / 2), W1, [rx0, yR - 5, rz0], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); }
        for (const e of [-14.03, 14.03]) kbox(g, s0, 17, o + e, 13.05, 38.1, 0.2, 0.08, RD, null, true);     // (red lines along its edges)
        for (const a of [0.5, 11.7, 22.3, 33.5]) kbox(g, s0, a, o - 11.2, 9.15, 0.3, 3.6, 0.3, WH, null, true);   // its columns at the terrace's edge
        for (const a of [6, 17, 28]) { kcyl(g, s0, a, o - 7.5, 9.15, 0.05, 2.3, 5, [0.8, 0.8, 0.82]); const [ux, uz] = atSf(s0 + a, o - 7.5); cone(g, ux, hyS(s0 + a) + 10.9, uz, 1.5, 0.6, 8, RD, [0.97, 0.97, 0.95], 0);   // sunshades and tables
          kcyl(g, s0, a, o - 7.5, 9.15, 0.5, 0.75, 8, [0.95, 0.95, 0.93], [0.97, 0.97, 0.95]); }
        { const [bx, bz] = atSf(s0 + 17, o - 13.4); board(bx, hyS(s0 + 17) + 13.35, bz, T.nx[ik], T.nz[ik], 20, 3.4, AT.ban + BAN.findIndex(b => b[0] === 'BERG')); }   // (and on its front edge, for the low cameras)
        { const [bx, bz] = atSf(s0 + 17, o - 11.85); board(bx, hyS(s0 + 17) + 5.9, bz, T.nx[ik], T.nz[ik], 12, 1.9, AT.ban + BAN.findIndex(b => b[0] === 'PADDOCK')); }
        kbox(g, s0, 17, o - 17.5, -0.6, 27, 0.75, 6.4, [0.86, 0.86, 0.84], [0.9, 0.9, 0.88]); kbox(g, s0, 17, o - 17.5, -0.6, 26, 0.79, 5.4, [0.2, 0.48, 0.74], [0.26, 0.58, 0.84]);   // the pool (the water over its rim's middle)
        for (const [a, k] of [[6, 'rb'], [17, 'at'], [28, 'st']]) { const [x, z] = atSf(s0 + a, o - 22); flagAt(x, nrGround(x, z), z, 8, k, 2.2); }
        exclPush(cx, cz, 26); }
      }
      }   // (Rio: the else of its 1970s pit building)
    }

    /* ---- grandstands along the barriers: tiers following the track and the ground, a seated crowd on every tier, covered stands under a roof
       on columns; the voestalpine wing on top of Start-Ziel ---- */
    const crowdMats = [ownTex(PER ? Tex.crowdPic(['#3a3a3e', '#4d4236', '#6e6352', '#2c3040', '#8a7f6a', '#5c5c60', '#d8d4c8', '#665040', '#3d4a3c', '#9a8c72'], 79) : rbCrowdTex(false)), ownTex(rbCrowdTex(true))], crowdG = [new GB(true), new GB(true)];
    const TC = LK.tier || [[0.7, 0.71, 0.74], [0.58, 0.59, 0.62], [0.62, 0.63, 0.66]], RC = LK.roof || [[0.93, 0.94, 0.95], [0.62, 0.64, 0.68], [0.85, 0.86, 0.88]];   // (the tiers' and the roof's colours: concrete and steel, or the 1930s' timber)
    let nStands = 0;
    for (const [sa, sb, side, rows, roof, sections, orange, name] of def.stands || []) {
      const dep = 0.95, rise = 0.6, secL = (sb - sa) / sections, gap = sections > 1 ? 3 : 0, cg = crowdG[orange ? 1 : 0];
      for (let sec = 0; sec < sections; sec++) {
        const a = sa + sec * secL + gap / 2, b = sa + (sec + 1) * secL - gap / 2, rows2 = [], st = [];
        // stations every 5 m: the tiers run as straight lines along the stand (the ground at the front, smoothed over +-15 m), the whole
        // profile lifted where the slope behind would come through a tier (that lift smoothed too)
        for (let d = a; d <= b + 0.01; d += Math.min(5, Math.max(1, b - d))) {
          const s = sAt(d), i = T.idx(s), f0 = (side > 0 ? T.br[i] : T.bl[i]) + 2.6, g0 = nrGround(...atSf(s, side * f0).slice(0, 2)) + 0.1; let lift = 0;
          for (let k = 0; k < rows; k++) lift = Math.max(lift, nrGround(...atSf(s, side * (f0 + (k + 1) * dep)).slice(0, 2)) + 0.35 - (g0 + 0.55 + k * rise));
          st.push({ s, f0, g0, lift });
        }
        const sm = (f, r) => st.map((q, m) => { let t = 0, n = 0; for (let e = -r; e <= r; e++) { t += f(st[clamp(m + e, 0, st.length - 1)]); n++; } return t / n; });
        const lmax = st.map((q, m) => { let v = 0; for (let e = -2; e <= 2; e++) v = Math.max(v, st[clamp(m + e, 0, st.length - 1)].lift); return v; });
        const G0 = sm(q => q.g0, 3), F0 = sm(q => q.f0, 3), L0 = st.map((q, m) => { let t = 0; for (let e = -2; e <= 2; e++) t += lmax[clamp(m + e, 0, st.length - 1)]; return t / 5; });
        st.forEach((q, m) => {   // (the front line smoothed too: round the outside of a bend the barrier's offset wanders)
          const s = q.s, f0 = Math.max(F0[m], q.f0 - 0.4), gy = G0[m] + Math.max(0, L0[m]), prof = [[f0 - 0.3, Math.min(gy, q.g0) - 0.6]]; let y = gy;
          for (let k = 0; k < rows; k++) { const o = f0 + k * dep; y = gy + 0.55 + k * rise; prof.push([o, y], [o + dep, y]); }
          const back = f0 + rows * dep; prof.push([back, y + 1.2], [back + 0.35, y + 1.2], [back + 0.35, nrGround(...atSf(s, side * (back + 0.5)).slice(0, 2)) - 0.5]);
          const pts = prof.map(([o, yy]) => { const [x, z] = atSf(s, side * o); return [x, yy, z]; });
          rows2.push({ s, pts, prof, top: y + 1.2 + 3.1, o0: f0 + rows * dep * 0.48, o1: back + 0.95 });   // (the roof over the upper half: the low cameras still see the track past it)
        });
        for (let m = 0; m + 1 < rows2.length; m++) {   // the concrete: the front, riser and tread per tier, the back wall; each face looks out of the stand
          const A = rows2[m], B = rows2[m + 1], g = scen.get(A.pts[1][0], A.pts[1][2]), n = A.pts.length;
          for (let e = 0; e + 1 < n; e++) { const a0 = A.pts[e], a1 = A.pts[e + 1], b0 = B.pts[e], b1 = B.pts[e + 1], up = Math.abs(a1[1] - a0[1]) < 0.05;
            const o0 = A.prof[e][0], o1 = A.prof[e + 1][0], om = (o0 + o1) / 2, ym = (a0[1] + a1[1]) / 2;
            const [ix, iz] = atSf(A.s, side * (up ? om : e >= n - 3 ? om - 1 : om + 1)), ins = [ix, up ? ym - 1 : ym, iz];   // (treads: below; risers: behind; the back wall: in front)
            g.quadO(a0, a1, b1, b0, up ? TC[0] : e >= n - 3 ? TC[1] : TC[2], ins); }
        }
        for (let m = 0; m + 1 < rows2.length; m++) {   // the crowd on the treads (a strip on each tier)
          const A = rows2[m], B = rows2[m + 1], len = Math.hypot(B.pts[1][0] - A.pts[1][0], B.pts[1][2] - A.pts[1][2]);
          for (let k = 0; k < rows; k++) { const a0 = A.pts[1 + k * 2], a1 = A.pts[2 + k * 2], b0 = B.pts[1 + k * 2], b1 = B.pts[2 + k * 2], v = (k * 0.11) % 1, u0 = (m * 5) / 12;
            cg.quadUp([a0[0], a0[1] + 0.02, a0[2]], [a1[0], a1[1] + 0.02, a1[2]], [b1[0], b1[1] + 0.02, b1[2]], [b0[0], b0[1] + 0.02, b0[2]], [W1, W1, W1, W1], [[u0, v], [u0, v + 0.1], [u0 + len / 12, v + 0.1], [u0 + len / 12, v]]); }
        }
        // (the stairs between the blocks: the aisles of the stands' seats, World.people's standBuild)
        const underWing = (r) => def.wing && side === def.wing[1] && Math.abs(dS(r.s) - def.wing[0]) < 45.5;   // (Start-Ziel: the wing is the roof there)
        if (roof) for (let m = 0; m + 1 < rows2.length; m++) {   // the roof: a slab over the upper half, tilted up towards the track, columns at the back
          const A = rows2[m], B = rows2[m + 1], tA = A.top, tB = B.top, a0 = A.o0, a1 = A.o1, b0 = B.o0, b1 = B.o1;
          if (underWing(A) || underWing(B)) continue;
          const q = (R2, o, y) => { const [x, z] = atSf(R2.s, side * o); return [x, y, z]; };
          const g = scen.get(A.pts[1][0], A.pts[1][2]), rc = RC[0], ru = RC[1];
          g.quadO(q(A, a0, tA + 0.8), q(B, b0, tB + 0.8), q(B, b1, tB), q(A, a1, tA), rc, q(A, (a0 + a1) / 2, tA - 5));   // (seen from above: light)
          g.quadO(q(A, a0, tA + 0.5), q(B, b0, tB + 0.5), q(B, b1, tB - 0.3), q(A, a1, tA - 0.3), ru, q(A, (a0 + a1) / 2, tA + 5));
          g.quadO(q(A, a0, tA + 0.5), q(B, b0, tB + 0.5), q(B, b0, tB + 0.8), q(A, a0, tA + 0.8), RC[2], q(A, a0 + 3, tA));   // the front edge
          if (m % 2 === 0) { const [x, z] = atSf(A.s, side * (a1 - 0.4)), y0 = nrGround(x, z) - 0.3; box(g, x, y0, z, 0.5, tA - y0, 0.5, T.hd[T.idx(A.s)], [0.86, 0.87, 0.9]); }
        }
        for (const r of rows2) { const [x, z] = atSf(r.s, side * (r.prof[0][0] + rows * dep * 0.5)); exclPush(x, z, rows * dep / 2 + 6); CR.exclAdd(x, z, rows * dep / 2 + 3); }
        for (let m = 0; m < rows2.length; m += 4) { const [x, z] = atSf(rows2[m].s, side * (rows2[m].prof[0][0] + rows * dep * 0.5)); crowdPts.push(x, z, orange ? 1 : 0.8); }   // (for the crowd's sound)
        if (LK.smoke && orange && sec % 3 === 1 && rows2.length) { const M3 = rows2[rows2.length >> 1], p = M3.pts[1 + Math.max(0, rows - 3) * 2]; smokeL.push([p[0], p[1], p[2], SMK[Math.floor(RX() * 3)], 1.5 + RX() * 0.4]); }   // flares in the orange stands
        if (!roof) for (let m = 2; m < rows2.length - 1; m += 6) { const A = rows2[m], [ob, yb] = A.prof[A.prof.length - 3], [x, z] = atSf(A.s, side * (ob + 0.18));   // flags on the back wall of the open stands
          flagAt(x, yb, z, 5, pick(LK.flags.stand[orange ? 0 : 1])); }
        const nk = BAN.findIndex(bn => bn[0] === name); let M2 = rows2[rows2.length >> 1];
        if (M2 && underWing(M2)) M2 = rows2[Math.floor(rows2.length * 0.82)];   // (not on the wing: on the roof beyond it)
        if (nk >= 0 && M2 && (sections === 1 || sec % 5 === 2)) {   // the stand's name, big enough for the high cameras: painted on the roof, or on a board leaning back on top of an open stand's back wall
          const i = T.idx(M2.s), Wd = Math.min(roof ? 24 : 14, (b - a) * 0.8), H = roof ? 3.4 : 2.2, [u0, v0, u1, v1] = AUV(AT.ban + nk), rx = -side * T.tx[i], rz = -side * T.tz[i];   // (the reader's right, looking at the stand from the track)
          const oN = roof ? M2.o0 + 1.2 : M2.prof[M2.prof.length - 3][0] - 0.4, yN = roof ? M2.top + 0.8 - 0.8 * (oN - M2.o0) / (M2.o1 - M2.o0) + 0.04 : M2.pts[M2.pts.length - 3][1] + 0.05;
          const oF = roof ? oN + H : oN + H * 0.55, yF = roof ? yN - 0.8 * H / (M2.o1 - M2.o0) : yN + H * 0.83, [xn, zn] = atSf(M2.s, side * oN), [xf, zf] = atSf(M2.s, side * oF);
          const A = [xn - rx * Wd / 2, yN, zn - rz * Wd / 2], B = [xn + rx * Wd / 2, yN, zn + rz * Wd / 2], C = [xf + rx * Wd / 2, yF, zf + rz * Wd / 2], D = [xf - rx * Wd / 2, yF, zf - rz * Wd / 2];
          ban.quadO(A, B, C, D, W1, [(xn + xf) / 2 + side * T.nx[i] * 1.5, (yN + yF) / 2 - 2, (zn + zf) / 2 + side * T.nz[i] * 1.5], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
          if (!roof) box(scen.get(xf, zf), (xn + xf) / 2, yN - 0.1, (zn + zf) / 2, Wd + 0.1, (yF - yN) + 0.1, 0.12, T.hd[i], [0.3, 0.31, 0.33], null, true); }   // (its frame)
        nStands++;
      }
      if (sa < 0 && sb > 0 && def.wing) {
        // the voestalpine wing (2014): a 90 m racing car rear wing on top of Start-Ziel, the stand's roof there: two end plates (dividing the
        // stand), the main plane over the back rows on slim columns, the flap above it, the media centre's glass front under it behind the
        // stand. All of it stays under the line from the high cameras (kino, iso: behind the stand, looking across it) to a car on the
        // near edge of the road (height < 0.88 x offset - 4.4 m); its own mesh, faded out while such a camera is inside it (out.dyn.fade)
        const [wd, wsd] = def.wing, S0 = wd - 45, S1 = wd + 45, nav = [0.11, 0.15, 0.3], red = [0.86, 0.12, 0.16];
        const stl = [0.8, 0.83, 0.87], stl2 = [0.72, 0.75, 0.8], stlD = [0.56, 0.59, 0.64], und = [0.3, 0.33, 0.38], gls = [0.28, 0.4, 0.52], band = [0.9, 0.9, 0.9], flp = [0.1, 0.34, 0.66];
        const WQ = (d, o, y) => { const s = sAt(d), [x, z] = atSf(s, wsd * o); return [x, hyS(s) + y, z]; }, gRel = (d, o) => { const q = WQ(d, o, 0); return nrGround(q[0], q[2]) - q[1]; };
        const g = new GB();
        const up = [[23.2, 13.6], [24.5, 14.4], [27, 15.6], [31, 17.2], [36, 19.0], [41, 20.6]], lo = [[23.5, 12.8], [25, 13.2], [27, 14.0], [31, 15.9], [36, 18.1], [41, 20.2]];
        const fU = [[40.2, 22.0], [42.5, 23.2], [45, 24.3], [47.5, 25.0]], fL = [[40.4, 21.6], [42.5, 22.7], [45, 23.9], [47.5, 24.7]];
        const surf = (prof, d0, d1, cols, below) => { for (let p = 0; p + 1 < prof.length; p++) {
          const A = WQ(d0, ...prof[p]), B = WQ(d1, ...prof[p]), C = WQ(d1, ...prof[p + 1]), D = WQ(d0, ...prof[p + 1]), m = WQ((d0 + d1) / 2, prof[p][0], prof[p][1] + (below ? 30 : -30));
          g.quadO(A, B, C, D, cols(p), m); } };
        for (let d = S0 + 0.7, n = 0; d < S1 - 0.7; d += 5, n++) {   // the planes in 5 m panels along the span: the main plane in steel, the flap blue
          const d1 = Math.min(S1 - 0.7, d + 5);
          surf(up, d, d1, (p) => p === 0 ? red : n % 2 ? stl2 : stl, false); surf(lo, d, d1, () => und, true);
          surf(fU, d, d1, (p) => p === 0 ? red : flp, false); surf(fL, d, d1, () => und, true);
          for (const [pu, pl, c] of [[up[0], lo[0], red], [up[up.length - 1], lo[lo.length - 1], stlD], [fU[0], fL[0], red], [fU[fU.length - 1], fL[fL.length - 1], stlD]])   // leading and trailing edges
            g.quadO(WQ(d, ...pu), WQ(d1, ...pu), WQ(d1, ...pl), WQ(d, ...pl), c, WQ((d + d1) / 2, pu[0] + (c === red ? 5 : -5), pu[1]));
        }
        // the end plates: navy fins through the stand, a red edge along the top
        const pl = [[15, 0], [15, 6.8], [22, 12.2], [40, 21.8], [46, 26], [51, 26], [51, 0]];
        for (const dp of [S0, S1]) {
          const P0 = pl.map(([o, y]) => [o, y === 0 ? gRel(dp, o) - 1 : y]);   // (the foot in the ground)
          for (const sd of [-0.7, 0.7]) { const ins = WQ(dp - sd * 3, 34, 12);
            for (let k = 1; k + 1 < P0.length; k++) g.triO(WQ(dp + sd, ...P0[0]), WQ(dp + sd, ...P0[k]), WQ(dp + sd, ...P0[k + 1]), nav, ins); }
          for (let k = 0; k + 1 < P0.length; k++) { const top = k >= 1 && k <= 4, ins = WQ(dp, 34, 12);
            g.quadO(WQ(dp - 0.7, ...P0[k]), WQ(dp + 0.7, ...P0[k]), WQ(dp + 0.7, ...P0[k + 1]), WQ(dp - 0.7, ...P0[k + 1]), top ? red : nav, ins); }
          const q = WQ(dp, 34, 0); exclPush(q[0], q[2], 22);
        }
        // the media centre under the wing: a glass front with white floor bands, four storeys, flat roof; slim columns under the main plane
        { const o0 = 32.5, o1 = 50.3, yT = 15.2;
          for (let d = S0 + 0.7; d < S1 - 0.7; d += 5) { const d1 = Math.min(S1 - 0.7, d + 5), gb0 = gRel(d, o0) - 0.8, m = WQ((d + d1) / 2, o0 + 8, yT / 2);
            g.quadO(WQ(d, o0, gb0), WQ(d1, o0, gb0), WQ(d1, o0, yT), WQ(d, o0, yT), gls, m);
            for (let f = 1; f <= 3; f++) { const y = gb0 + (yT - gb0) * f / 3.6; g.quadO(WQ(d, o0 - 0.05, y), WQ(d1, o0 - 0.05, y), WQ(d1, o0 - 0.05, y + 0.5), WQ(d, o0 - 0.05, y + 0.5), band, m); }
            g.quadO(WQ(d, o0, yT), WQ(d1, o0, yT), WQ(d1, o1, yT), WQ(d, o1, yT), [0.72, 0.73, 0.75], WQ((d + d1) / 2, o0 + 8, 0));
            g.quadO(WQ(d, o1, gb0), WQ(d1, o1, gb0), WQ(d1, o1, yT), WQ(d, o1, yT), [0.82, 0.82, 0.8], m);
            if (Math.round((d - S0 - 0.7) / 5) % 3 === 1) { const c0 = WQ(d, 31.9, 0), gy0 = nrGround(c0[0], c0[2]);   // a column under the main plane
              box(g, c0[0], gy0 - 0.3, c0[2], 0.6, c0[1] + 16.0 - gy0 + 0.3, 0.6, T.hd[T.idx(sAt(d))], [0.78, 0.8, 0.84], null, true); }
          }
          for (const [dq, k] of [[wd - 22, AT.rbr], [wd + 22, AT.spielberg]]) { const q = WQ(dq, o0 - 0.12, 12.3), i = T.idx(sAt(dq));   // the names on the glass, above the stand's back wall
            board(q[0], q[1], q[2], wsd * T.nx[i], wsd * T.nz[i], 20, 2.4, k); }
          for (let d = S0 + 10; d < S1 - 5; d += 20) { const q = WQ(d, 42, 0); exclPush(q[0], q[2], 14); CR.exclAdd(q[0], q[2], 12); }
        }
        // the name on the main plane, as on a racing car's rear wing: two panels, the text read from the track's side (the high cameras behind
        // the stand are gone: the chase camera's, the replay's and the photos' views)
        const gt = new GB(true), [u0, v0, u1, v1] = AUV(AT.rbr), yo = (o) => { let k = 0; while (k + 2 < up.length && up[k + 1][0] < o) k++; const [a, b] = [up[k], up[k + 1]]; return a[1] + (b[1] - a[1]) * (o - a[0]) / (b[0] - a[0]) + 0.15; };   // (just above the cambered plane)
        for (const dc of [wd - 22, wd + 22]) { const dl = dc - 14, dh = dc + 14, oL = 28.0, oH = 35.0;   // (the text's right: with the traffic, its top: away from the track)
          gt.quadO(WQ(dh, oH, yo(oH)), WQ(dl, oH, yo(oH)), WQ(dl, oL, yo(oL)), WQ(dh, oL, yo(oL)), W1, WQ(dc, 31.5, yo(31.5) - 20), [[u1, v1], [u0, v1], [u0, v0], [u1, v0]]); }
        const fl = [];
        for (const [geo, mt] of [[g, new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true })], [gt, new THREE.MeshLambertMaterial({ map: atlas, transparent: true })]]) {
          const m = new THREE.Mesh(geo.geometry(), mt); m.castShadow = geo === g; m.receiveShadow = true; m.matrixAutoUpdate = false; root.add(m); fl.push({ mesh: m, mat: mt }); }
        const cn = [[S0 - 6, 11], [S1 + 6, 11], [S1 + 6, 56], [S0 - 6, 56]].map(([d, o]) => { const q = WQ(d, o, 0); return [q[0], q[2]]; });
        out.dyn.fade = { list: fl, poly: cn, yTop: hyS(sAt(wd)) + 30, op: 1, t: null };   // (the footprint, a little wider, up to 30 m)
      }
    }
    addM(crowdG[0], crowdUV(new THREE.MeshLambertMaterial({ map: crowdMats[0], vertexColors: true }), 1, 0.11, 0.1)); addM(crowdG[1], crowdUV(new THREE.MeshLambertMaterial({ map: crowdMats[1], vertexColors: true }), 1, 0.11, 0.1));

    /* ---- marshal posts, turn numbers, braking boards ---- */
    const roomSide = (s) => { let l = 0, r = 0; for (let d = -30; d <= 30; d += 6) { const i = T.idx(s + d); l += T.bl[i]; r += T.br[i]; } return r > l ? 1 : -1; };
    for (let d = 200, k = 0; !PER && d < L - 480; d += 360, k++) {   // marshal post: a white hut with an orange roof and a flag pole
      const s = sAt(d), side = k % 2 ? roomSide(s) : -roomSide(s), [x, z, i] = onSide(s, side, 2.4), y = nrGround(x, z), g = scen.get(x, z);
      if (excluded(x, z) || (side === PSD && PD && T.pitAt(s))) continue;
      box(g, x, y - 0.2, z, 2.4, 2.5, 2.2, T.hd[i], [0.94, 0.94, 0.92], [0.95, 0.45, 0.1], true);
      box(g, x - T.nx[i] * side * 0.4, y + 1.1, z - T.nz[i] * side * 0.4, 1.6, 0.6, 2.25, T.hd[i], [0.2, 0.28, 0.36], null, true);
      const fx = x + T.tx[i] * 1.8, fz = z + T.tz[i] * 1.8; cyl(g, fx, y, fz, 0.05, 4.2, 5, [0.85, 0.85, 0.87]); API.flags.add(fx, y + 4, fz, T.hd[i], [[0.98, 0.84, 0.1]], 0.9, 0.6);   // (the cloth waves: js/world-zastave.js)
      { const lx = x - T.tx[i] * 1.9, lz = z - T.tz[i] * 1.9, nx = -T.nx[i] * side, nz = -T.nz[i] * side;   // the digital flag panel on its post, a green light towards the road
        box(g, lx, y, lz, 0.14, 3.1, 0.14, T.hd[i], [0.5, 0.51, 0.54], null, true); box(g, lx + nx * 0.1, y + 2.6, lz + nz * 0.1, 1.0, 0.75, 0.16, T.hd[i], [0.1, 0.1, 0.11]);
        box(g, lx + nx * 0.2, y + 2.72, lz + nz * 0.2, 0.62, 0.5, 0.04, T.hd[i], [0.35, 1.0, 0.4], null, true); }
      exclPush(x, z, 5); CR.avoid(x, z, 2.5);
    }
    let nTV = 0;
    (PER ? [] : def.turns || []).forEach(([tx0, tz0], k) => {   // TV camera towers: scaffolding outside the big corners, a platform with a cameraman under an umbrella
      if (LK.tvSkip.includes(k)) return;   // (not at the kinks)
      const i0 = T.nearestIdx(tx0, tz0), side = T.k[i0] > 0 ? -1 : 1, s = i0 * ds + 30, i = T.idx(s); if (side === PSD && PD && T.pitAt(s)) return;
      const [x, z] = onSide(s, side, 7), y = nrGround(x, z), g = scen.get(x, z), hd = T.hd[i], ph = 6.5; if (excluded(x, z) || nrSlope(x, z) > 0.5) return;
      const st = [0.62, 0.63, 0.66], c = Math.cos(hd), sn = Math.sin(hd), at2 = (a, b) => [x + c * a - sn * b, z + sn * a + c * b];
      for (const [a, b] of [[-1.1, -1.1], [1.1, -1.1], [1.1, 1.1], [-1.1, 1.1]]) { const [px, pz] = at2(a, b); box(g, px, y - 0.3, pz, 0.12, ph + 0.3, 0.12, hd, st, null, true); }
      for (let h = 1.6; h < ph; h += 1.6) for (const [a, b, w2, d2] of [[0, -1.1, 2.3, 0.08], [0, 1.1, 2.3, 0.08], [-1.1, 0, 0.08, 2.3], [1.1, 0, 0.08, 2.3]]) { const [px, pz] = at2(a, b); box(g, px, y + h, pz, w2, 0.08, d2, hd, st, null, true); }
      { const [px, pz] = at2(0, 0); box(g, px, y + ph, pz, 2.7, 0.15, 2.7, hd, [0.45, 0.46, 0.5]);   // the platform, the cameraman and his camera, an umbrella
        const fx = -T.nx[i] * side, fz = -T.nz[i] * side, mx = px - fx * 0.3, mz = pz - fz * 0.3;
        box(g, mx, y + ph + 0.15, mz, 0.45, 0.85, 0.3, hd, [0.18, 0.2, 0.26], null, true); box(g, mx, y + ph + 1.0, mz, 0.5, 0.65, 0.34, hd, [0.95, 0.5, 0.1], null, true); box(g, mx, y + ph + 1.65, mz, 0.28, 0.28, 0.28, hd, [0.85, 0.66, 0.52], [0.25, 0.18, 0.12], true);
        box(g, px + fx * 0.45, y + ph + 1.3, pz + fz * 0.45, 0.5, 0.42, 0.42, hd, [0.13, 0.13, 0.15], null, true); box(g, px + fx * 0.95, y + ph + 1.36, pz + fz * 0.95, 0.3, 0.3, 0.3, hd, [0.08, 0.08, 0.09], null, true);
        box(g, px, y + ph + 0.15, pz, 0.06, 2.6, 0.06, hd, st, null, true); cone(g, px, y + ph + 2.4, pz, 1.4, 0.55, 8, [0.95, 0.95, 0.93], [0.86, 0.12, 0.16], 0); }
      exclPush(x, z, 4); CR.avoid(x, z, 2.2); nTV++;
      if (LK.recov.includes(k)) {   // (Styria: at Turns 1, 3 and 4) a recovery truck and the medical car behind the barrier after the corner
        const s2 = i0 * ds + 70, i2 = T.idx(s2), [rx, rz] = onSide(s2, side, 5), ry = nrGround(rx, rz), hd2 = T.hd[i2], c2 = Math.cos(hd2), s3 = Math.sin(hd2), gr = scen.get(rx, rz);
        if (!excluded(rx, rz) && nrSlope(rx, rz) < 0.3) {
          box(gr, rx + c2 * 2.6, ry + 0.4, rz + s3 * 2.6, 2.2, 2.3, 2.4, hd2, [0.98, 0.72, 0.1], [0.95, 0.95, 0.93], true);   // the truck: cab, flat bed, the crane and its beacons
          box(gr, rx - c2 * 1.4, ry + 0.4, rz - s3 * 1.4, 5.4, 0.9, 2.4, hd2, [0.3, 0.31, 0.34], [0.36, 0.37, 0.4], true);
          box(gr, rx - c2 * 2.6, ry + 1.3, rz - s3 * 2.6, 0.5, 2.6, 0.5, hd2, [0.98, 0.72, 0.1], null, true); box(gr, rx - c2 * 1.4, ry + 3.7, rz - s3 * 1.4, 3.0, 0.35, 0.35, hd2, [0.98, 0.72, 0.1], null, true);
          box(gr, rx + c2 * 2.9, ry + 2.7, rz + s3 * 2.9, 0.9, 0.18, 1.6, hd2, [0.95, 0.5, 0.05], null, true);
          const mx = rx - c2 * 9, mz = rz - s3 * 9, my = nrGround(mx, mz);   // the medical car: white, red and yellow stripes, blue lights
          if (!excluded(mx, mz)) { box(gr, mx, my + 0.3, mz, 4.6, 0.9, 1.9, hd2, [0.95, 0.95, 0.94], [0.95, 0.95, 0.94], true); box(gr, mx - c2 * 0.3, my + 1.2, mz - s3 * 0.3, 2.5, 0.6, 1.7, hd2, [0.2, 0.24, 0.3], [0.95, 0.95, 0.94], true);
            box(gr, mx, my + 0.7, mz, 4.62, 0.22, 1.92, hd2, [0.86, 0.12, 0.14], null, true); box(gr, mx, my + 0.92, mz, 4.62, 0.12, 1.92, hd2, [0.98, 0.84, 0.1], null, true);
            box(gr, mx - c2 * 0.3, my + 1.8, mz - s3 * 0.3, 0.3, 0.14, 1.2, hd2, [0.2, 0.4, 1.0], null, true); }
          exclPush(rx - c2 * 3, rz - s3 * 3, 9); CR.avoid(rx - c2 * 3, rz - s3 * 3, 7);
        }
      }
    });
    // behind the spectators on the grass: food stalls with striped awnings and rows of portable toilets
    for (const [a, b, sd] of def.ga || []) for (let d = a + 40, n = 0; d < b - 30; d += 85, n++) {
      const s = sAt(d), [x, z, i] = onSide(s, sd, 21), y = nrGround(x, z), g = scen.get(x, z), hd2 = T.hd[i], c2 = Math.cos(hd2), s3 = Math.sin(hd2), fx = -T.nx[i] * sd, fz = -T.nz[i] * sd;
      if (excluded(x, z) || nrSlope(x, z) > 0.35) continue;
      if (n % 2 === 0) { const ac = [[0.86, 0.12, 0.16], [0.12, 0.3, 0.7], [0.98, 0.6, 0.1]][(n >> 1) % 3];   // a stall: the booth, its counter towards the track, an awning
        box(g, x, y - 0.3, z, 4.2, 3.0, 2.6, hd2, [0.95, 0.94, 0.9], [0.9, 0.9, 0.88], true); box(g, x + fx * 1.45, y, z + fz * 1.45, 4.0, 1.1, 0.4, hd2, ac, null, true);
        box(g, x + fx * 1.7, y + 2.6, z + fz * 1.7, 4.6, 0.12, 1.6, hd2, ac, [0.97, 0.97, 0.95], true);
        for (const q of [-1.4, 1.4]) cyl(g, x + fx * 2.9 + c2 * q, y, z + fz * 2.9 + s3 * q, 0.25, 1.05, 6, [0.5, 0.35, 0.2], [0.6, 0.45, 0.28]); }   // (standing tables)
      else if (!PER) for (let q = -2; q <= 2; q++) box(g, x + c2 * q * 1.3, y - 0.1, z + s3 * q * 1.3, 1.15, 2.35, 1.15, hd2, [0.16, 0.4, 0.8], [0.9, 0.9, 0.9], true);   // portable toilets
      exclPush(x, z, 6); CR.avoid(x, z, 4.5);
    }
    (LK.nums ? def.turns || [] : []).forEach(([tx0, tz0], k) => {   // turn numbers on boards behind the barrier on the outside of each turn
      const i = T.nearestIdx(tx0, tz0), side = T.k[i] > 0 ? -1 : 1, s = i * ds; if (side === PSD && PD && T.pitAt(s)) return;
      const [x, z] = onSide(s, side, 1.8), y = nrGround(x, z), g = scen.get(x, z), fx = -T.nx[i] * side, fz = -T.nz[i] * side;
      for (const o of [-0.7, 0.7]) box(g, x + T.tx[i] * o, y - 0.3, z + T.tz[i] * o, 0.12, 3.3, 0.12, T.hd[i], [0.55, 0.56, 0.58]);
      board(x, y + 2.0, z, -fx, -fz, 2.2, 1.3, AT.num + k);
      board(x + fx * 0.02, y + 2.0, z + fz * 0.02, fx, fz, 2.2, 1.3, AT.num + k); exclPush(x, z, 3); CR.avoid(x, z, 1.5);
    });
    for (const c of PER ? [] : T.corners) {   // braking boards (300, 200, 100 m) before the slow corners, on the outside
      if (c.sev < 3) continue; const side = -c.dir;
      [300, 200, 100].forEach((m, k) => { const s = wrapS(c.i0 * ds - m + 30), i = T.idx(s); if ((side > 0 ? T.br[i] : T.bl[i]) < w + 3 || (side === PSD && PD && T.pitAt(s))) return; signPost(s, side, 1.6, AT.brake + k, 1.6, 1.1, 1.3); });
    }
    if (T.drs) { const kD = AT.ban + BAN.findIndex(b => b[0] === 'DRS');   // DRS boards where each zone opens, on the side with more room
      for (const z of T.drs) { const s = sAt(z.act), side = roomSide(s); if (side === PSD && PD && T.pitAt(s)) continue; signPost(s, side, 1.4, kD, 2.4, 1.0, 1.6); } }
    if (!LK.gravel) { const bn = (t) => AT.ban + BAN.findIndex(b => b[0] === t), cells = LK.runoff.map(bn), gp = new GB(true);
      let n = 0;
      for (const c of T.corners) {   // painted names on the wide asphalt run-offs outside the corners, across them (read from the cars coming in)
        if (c.sev < 2) continue; const side = -c.dir, flag = side > 0 ? T.gravR : T.gravL, bar = side > 0 ? T.br : T.bl, i1c = c.i1 < c.i0 ? c.i1 + N : c.i1;
        let bi = -1, bw = 0; for (let k = c.i0; k <= i1c + 20; k++) { const i = k % N, wd = bar[i] - w - T.curbW; if (flag[i] && wd > bw) { bw = wd; bi = i; } }
        if (bi < 0 || bw < 13) continue;
        const o0 = w + T.curbW + 2.2, o1 = Math.min(bar[bi] - 1.6, o0 + 15), s0 = bi * ds, s1 = s0 + (o1 - o0) / 4, [u0, v0, u1, v1] = AUV(cells[n++ % 3]);
        const Q = (s, o) => { const [x, z] = atSf(s, side * o); return [x, hyS(s) + 0.036, z]; }, oL = side < 0 ? o1 : o0, oR = side < 0 ? o0 : o1;   // (the text's left on the driver's left)
        const mc = atSf(s0, side * (o0 + o1) / 2); gp.quadO(Q(s0, oL), Q(s0, oR), Q(s1, oR), Q(s1, oL), W1, [mc[0], hyS(s0) - 5, mc[1]], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
      }
      const mp = addM(gp, new THREE.MeshLambertMaterial({ map: atlas, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 })); if (mp) mp.castShadow = false; }

    /* ---- more of the big day: a video wall at Turn 1, flag poles with the Austrian colours along the straight, tents and camper vans at the
       campsites on the fields, farms around ---- */
    let nScr = 0, nPh = 0;
    {
      const SW = 11.6, SH = 6;
      const vidWall = (x, z, fx, fz) => {   // a video wall on its post, the screen towards (fx, fz): its pictures change (rbScreenTex, World.update)
        const y = nrGround(x, z), g = scen.get(x, z), fa = Math.atan2(fz, fx), rx = fz, rz = -fx, cx = x + fx * 0.72, cz = z + fz * 0.72, y0 = y + 8.5, y1 = y0 + SH;   // (r: the viewer's right)
        box(g, x, y - 0.3, z, 1.2, 8.3, 1.2, fa, [0.3, 0.31, 0.34]); box(g, x, y + 8, z, 1.4, SH + 1, SW + 0.8, fa, [0.1, 0.1, 0.11], [0.16, 0.16, 0.18]);
        scrG.quadO([cx - rx * SW / 2, y0, cz - rz * SW / 2], [cx + rx * SW / 2, y0, cz + rz * SW / 2], [cx + rx * SW / 2, y1, cz + rz * SW / 2], [cx - rx * SW / 2, y1, cz - rz * SW / 2], W1, [x, y0 + SH / 2, z], [[0, 0], [0.25, 0], [0.25, 1], [0, 1]]);
        exclPush(x, z, 8); CR.avoid(x, z, 4); nScr++;
      };
      const t1 = !PER && !LK.noVid && def.turns && def.turns[0]; if (t1) {   // the video wall at the Steiermark stand, facing Turn 1
        const i = T.nearestIdx(t1[0], t1[1]), [x, z] = onSide(i * ds - 45, -1, 30), fx = T.px[i] - x, fz = T.pz[i] - z, fl = Math.hypot(fx, fz); vidWall(x, z, fx / fl, fz / fl); }
      for (const [nm, sd] of LK.vid) {   // more across the track from the stands, facing them
        const st = (def.stands || []).find(q => q[7] === nm); if (!st) continue;
        const s = sAt((st[0] + st[1]) / 2), i = T.idx(s);
        for (const ex of [16, 22, 28, 12]) { const [x, z] = onSide(s, sd, ex); if (excluded(x, z) || nrSlope(x, z) > 0.3 || (sd === PSD && PD && T.pitAt(s))) continue;
          const fx = T.px[i] - x, fz = T.pz[i] - z, fl = Math.hypot(fx, fz); vidWall(x, z, fx / fl, fz / fl); break; }
      }
      for (let d = LK.poles[0]; d < LK.poles[1]; d += 24) {   // flag poles on top of the grandstand's front (Styria: red-white-red)
        if (Math.abs(d) < 20) continue; const [x, z] = onSide(sAt(d), LK.poles[2], 1.4), y = nrGround(x, z);
        cyl(scen.get(x, z), x, y, z, 0.07, 9, 5, [0.88, 0.88, 0.9]); flagL.push([x, y + 9, z, WROT + (RX() - 0.5) * 0.3, FL[LK.flags.pole], 1.6, 1.1]);
        CR.avoid(x, z, 0.5);
      }
      // the fans on the grass: flags on poles among them, orange smoke rising here and there
      for (const [a, b, sd] of def.ga || []) {
        for (let d = a; d <= b; d += 20) { const [x, z] = onSide(sAt(d), sd, 7); crowdPts.push(x, z, 0.9); }
        for (let d = a + 12; d < b - 8; d += 20 + RX() * 16) { const [x, z] = onSide(sAt(d), sd, 3.5 + RX() * 9); if (excluded(x, z) || nrSlope(x, z) > 0.6) continue;
          flagAt(x, nrGround(x, z), z, 4.5 + RX() * 1.5, pick(LK.flags.ga)); CR.avoid(x, z, 0.6); }
        if (LK.smoke) for (let n = Math.max(1, Math.round((b - a) / 200)), k = 0; k < n; k++) { const [x, z] = onSide(sAt(a + (b - a) * (k + 0.5) / n + (RX() - 0.5) * 30), sd, 5 + RX() * 5);
          if (!excluded(x, z)) smokeL.push([x, nrGround(x, z) + 0.8, z, SMK[Math.floor(RX() * 3)], 1.4 + RX() * 0.4]); }
      }
      // photographers behind the barriers at Turns 1, 3, 4 and 10 (tabards, the long white lenses on the track), standing or kneeling: at the
      // apex on the inside, past it on the outside where no grandstand is
      const TB = [[0.98, 0.55, 0.1], [0.98, 0.84, 0.12], [0.2, 0.55, 0.3]], dk = [0.14, 0.15, 0.18], skin = [0.85, 0.66, 0.52];
      for (const k of LK.photo) {
        const tn = def.turns && def.turns[k]; if (!tn) continue;
        const i0 = T.nearestIdx(tn[0], tn[1]), out1 = T.k[i0] > 0 ? -1 : 1;
        for (const [off, side] of [[-14, -out1], [-9, -out1], [-4, -out1], [18, out1], [24, out1], [44, out1]]) {
          const s = i0 * ds + off, [x, z, i] = onSide(s, side, 2.1); if (excluded(x, z) || nrSlope(x, z) > 0.45 || (side === PSD && PD && T.pitAt(s))) continue;
          const y = nrGround(x, z), g = scen.get(x, z), fx = -T.nx[i] * side, fz = -T.nz[i] * side, px = -fz, pz = fx, rot = Math.atan2(fz, fx), kn = RX() < 0.35, tb = TB[Math.floor(RX() * 3)], h = kn ? 0.42 : 0;
          if (kn) { box(g, x - fx * 0.12, y, z - fz * 0.12, 0.5, 0.45, 0.34, rot, dk, null, true); }   // (kneeling: the legs folded under)
          else for (const sd of [-1, 1]) box(g, x + px * sd * 0.1, y, z + pz * sd * 0.1, 0.15, 0.88, 0.15, rot, dk, null, true);
          const yb = y + 0.86 - h;
          box(g, x, yb, z, 0.24, 0.6, 0.42, rot, tb, null, true);                                             // the tabard
          box(g, x, yb + 0.6, z, 0.22, 0.25, 0.2, rot, skin, [0.22, 0.17, 0.12], true);                      // the head (the hair on top)
          box(g, x + fx * 0.28, yb + 0.35, z + fz * 0.28, 0.36, 0.1, 0.44, rot, dk, null, true);            // the arms up to the camera
          box(g, x + fx * 0.22, yb + 0.5, z + fz * 0.22, 0.16, 0.16, 0.16, rot, [0.08, 0.08, 0.09], null, true);   // the camera at the eye
          box(g, x + fx * 0.55, yb + 0.51, z + fz * 0.55, 0.52, 0.14, 0.14, rot, [0.93, 0.93, 0.9], null, true);   // the lens
          CR.avoid(x, z, 0.8); nPh++;
        }
      }
    }
    // campsites and farms on the open land (the land cover's meadows) 120-420 m from the track, level ground, nothing else there
    const tcols = [[0.85, 0.16, 0.14], [0.15, 0.36, 0.8], [0.95, 0.75, 0.12], [0.2, 0.62, 0.3], [0.92, 0.92, 0.9], [0.98, 0.5, 0.1]];
    const carPk = (x, z, rot, col) => { const g = scen.get(x, z), y = nrGround(x, z), c = Math.cos(rot), s = Math.sin(rot);
      parkedCar(g, x, y, z, rot, col); };
    const tent = (x, z, rot, col) => { const g = scen.get(x, z), y = nrGround(x, z); box(g, x, y, z, 3.2, 1.9, 3.2, rot, col, null, true); gable(g, x, y + 1.9, z, 3.5, 3.5, 1.0, rot, [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8], col); };
    const van = (x, z, rot) => { const g = scen.get(x, z), y = nrGround(x, z); box(g, x, y + 0.35, z, 6.4, 2.6, 2.3, rot, [0.95, 0.95, 0.93], [0.9, 0.9, 0.88], true); box(g, x + Math.cos(rot) * 2.4, y + 1.6, z + Math.sin(rot) * 2.4, 1.2, 0.7, 2.32, rot, [0.2, 0.26, 0.34], null, true); };
    const openAt = (x, z) => nrLC(x, z) === 0 && !excluded(x, z) && nrSlope(x, z) < 0.12 && nrDist(x, z) > 90;
    let nCamp = 0, nFarm = 0;
    for (let tries = 0, camps = 0; tries < 400 && camps < LK.camps; tries++) {
      const x = P.x0 + 200 + R() * (P.x1 - P.x0 - 400), z = P.z0 + 200 + R() * (P.z1 - P.z0 - 400), rd = nrDist(x, z); if (rd < 120 || rd > 360 || !openAt(x, z)) continue;
      camps++; const rot = R() * TAU;
      for (let k = 0; k < 34; k++) { const a = (k % 6) * 9 - 22, b = Math.floor(k / 6) * 9 - 22, px = x + Math.cos(rot) * a - Math.sin(rot) * b, pz = z + Math.sin(rot) * a + Math.cos(rot) * b;
        if (!openAt(px, pz) || R() < 0.2) continue; const r = R();
        if (r < 0.45) tent(px, pz, rot + (R() - 0.5) * 0.4, tcols[Math.floor(R() * tcols.length)]); else if (r < 0.75) van(px, pz, rot + (R() - 0.5) * 0.3); else carPk(px, pz, rot + (R() - 0.5) * 0.3, vary(LK.shirts[Math.floor(R() * LK.shirts.length)], R, 0.2));
        nCamp++; }
      for (let k = 0; k < 4; k++) { const a = Math.floor(RX() * 5) * 9 - 17.5, b = Math.floor(RX() * 5) * 9 - 17.5, fx = x + Math.cos(rot) * a - Math.sin(rot) * b, fz = z + Math.sin(rot) * a + Math.cos(rot) * b;   // flags between the tents
        if (openAt(fx, fz)) flagAt(fx, nrGround(fx, fz), fz, 6, pick(LK.flags.camp), 1.9); }
      exclPush(x, z, 42);
    }
    for (let tries = 0; !PER && tries < 300 && nFarm < 7; tries++) {   // a farm: in Styria a white house under a dark roof and a timber barn, at Bathurst a homestead under red iron and a shed
      const x = P.x0 + 120 + R() * (P.x1 - P.x0 - 240), z = P.z0 + 120 + R() * (P.z1 - P.z0 - 240), rd = nrDist(x, z); if (rd < 150 || rd > 420 || !openAt(x, z)) continue;
      const rot = R() * TAU, g = scen.get(x, z), y = nrGround(x, z), c = Math.cos(rot), s = Math.sin(rot), bx2 = x - s * 16, bz2 = z + c * 16;
      if (!openAt(bx2, bz2)) continue;
      const FM = LK.farm; box(g, x, y - 0.5, z, 14, 6.8, 9, rot, FM.wall, null, true); gable(g, x, y + 6.3, z, 15, 10.2, 4.4, rot, FM.roof, FM.end);
      const g2 = scen.get(bx2, bz2), y2 = nrGround(bx2, bz2); box(g2, bx2, y2 - 0.5, bz2, 18, 6.5, 11, rot, FM.barn, null, true); gable(g2, bx2, y2 + 6, bz2, 19, 12, 4.8, rot, FM.barnRoof, FM.barnEnd);
      exclPush(x - s * 8, z + c * 8, 22); nFarm++;
    }

    let nCars = 0, nHouse = 0;
    const RH = rng(4331), HW = [[0.93, 0.9, 0.82], [0.92, 0.92, 0.88], [0.7, 0.42, 0.32], [0.62, 0.38, 0.3], [0.86, 0.8, 0.66]], HR = [[0.62, 0.2, 0.14], [0.5, 0.54, 0.56], [0.3, 0.42, 0.34], [0.66, 0.68, 0.7]];   // (Bathurst's houses: weatherboard, cream, red and brown brick; red, grey, green iron and zinc roofs)
    const house = (x, z, rot) => {   // Bathurst: a house on its block: weatherboard or brick under an iron roof, now and then a corrugated rainwater tank beside it
      const w2 = 9 + RH() * 4, d2 = 7.5 + RH() * 3, y = nrGround(x, z), g = scen.get(x, z), wc = HW[Math.floor(RH() * HW.length)], rc = HR[Math.floor(RH() * HR.length)];
      box(g, x, y - 0.6, z, w2, 3.6, d2, rot, wc, null, true); gable(g, x, y + 2.95, z, w2 + 0.9, d2 + 0.9, 1.5 + RH() * 0.6, rot, rc, wc);
      if (RH() < 0.45) { const c = Math.cos(rot), sn = Math.sin(rot), tx = x + c * (w2 / 2 + 1.4), tz = z + sn * (w2 / 2 + 1.4); cyl(g, tx, nrGround(tx, tz) - 0.1, tz, 1.1, 2.3, 8, [0.66, 0.68, 0.7], [0.6, 0.62, 0.64]); }
      exclPush(x, z, 9); nHouse++; };
    if (LK.street) for (const side of [-1, 1]) for (let d = LK.street[0]; d < LK.street[1]; d += 24 + RH() * 14) {   // Bathurst: the houses along the climb after Turn 1, behind the walls, side on to the road
      const [x, z, i] = onSide(sAt(d), side, 15 + RH() * 8);
      if (RH() < 0.65 && !excluded(x, z) && nrLC(x, z) !== 1 && nrSlope(x, z) < 0.3) house(x, z, T.hd[i]); }
    if (LK.hillCamp) {   // Bathurst: the fans' camp on the top of the hill behind the spectators: tents, camper vans and cars in a jumble, flags, smoke from the barbecues
      const [a, b, sd] = LK.hillCamp, RC = rng(4341), bbq = { per: 8, life: 5, lifeV: 2, rise: 5, riseV: 3, flare: 0 };
      for (let d = a; d < b; d += 8) for (let o = 26; o < 80; o += 7.5) {
        const [x0, z0, i] = onSide(sAt(d), sd, o), x = x0 + (RC() - 0.5) * 4, z = z0 + (RC() - 0.5) * 4, cl = nrLC(x, z), r = RC();
        if (cl === 1 || cl === 3 || excluded(x, z) || nrSlope(x, z) > 0.22 || r < 0.25) continue;
        const rot = T.hd[i] + (RC() - 0.5) * 0.8;
        if (r < 0.6) tent(x, z, rot, tcols[Math.floor(RC() * tcols.length)]); else if (r < 0.8) van(x, z, rot); else carPk(x, z, rot, vary(LK.shirts[Math.floor(RC() * LK.shirts.length)], RC, 0.2));
        if (RC() < 0.12) flagAt(x + 2.5, nrGround(x + 2.5, z), z, 6, pick(LK.flags.camp), 1.9);
        if (RC() < 0.08) smokeL.push([x - 2.5, nrGround(x - 2.5, z) + 0.9, z, [0.78, 0.77, 0.75], 0.7, bbq]);
        exclPush(x, z, 4); CR.avoid(x, z, 3); nCamp++;
      }
    }
    const cutBank = [];   // (Bathurst: the bank over the cutting, rows of points; built with the terrain, in its grass and colours)
    if (LK.cut) {   // Bathurst: the rock cutting at Turn 4: a raw face of shale, clay and sandstone in layers behind the wall on the hill's side, low enough
      // not to hide the road from the high camera, leaning back so the camera sees it, its top a bank of grass sloping back to the hillside (cutBank), a few fallen boulders at its foot
      const [c0, c1] = LK.cut, RK = rng(4342), im = T.idx(sAt((c0 + c1) / 2));
      const up = (sd) => { const [x, z] = atSf(sAt((c0 + c1) / 2), sd * ((sd > 0 ? T.br[im] : T.bl[im]) + 25)); return nrGround(x, z); };
      const RC = [[0.36, 0.32, 0.28], [0.62, 0.47, 0.31], [0.53, 0.5, 0.45], [0.55, 0.37, 0.27]];   // dark shale, ochre clay, grey sandstone, red-brown
      const rockAt = (x, z, y) => { const t = y * 1.15 + P.n2(x * 0.6, z * 0.6) * 2.4, b = Math.floor(t), A = RC[((b % 4) + 4) % 4], B = RC[(((b + 1) % 4) + 4) % 4], k = 0.86 + 0.26 * P.n1(x * 1.9 + 40, z * 1.9);
        return [0, 1, 2].map(q => lerp(A[q], B[q], sstep(0.72, 1, t - b)) * k); };   // (the layers by height, wavy; lighter and darker in patches)
      for (const side of [up(1) > up(-1) ? 1 : -1]) {
        let prev = null;
        for (let d = c0; d <= c1 + 0.01; d += 2) {
          const s0 = sAt(d), i = T.idx(s0), bar = side > 0 ? T.br[i] : T.bl[i], f = Math.min(sstep(c0, c0 + 25, d), sstep(c1, c1 - 25, d)), h = (2.8 + 2.4 * P.n4(T.px[i] * 0.4, T.pz[i] * 0.4)) * f, y0 = hyS(s0);
          const at = (o, y) => { const [x, z] = atSf(s0, side * o); return [x, y0 + y, z]; };
          const row = [at(bar + 1.0, -0.3), at(bar + 1.8, h * 0.3), at(bar + 3.0, h * 0.62), at(bar + 4.3, h * 0.88), at(bar + 5.2, h)], cols = row.map(q => rockAt(q[0], q[2], q[1] - y0));
          cols[0] = cols[0].map(v => v * 0.62);   // (the foot damp, in the wall's shadow)
          const ins = (() => { const [x, z] = atSf(s0, side * (bar - 2)); return [x, y0 - 3, z]; })(), g = scen.get(row[0][0], row[0][2]);
          if (prev) for (let e = 0; e < 4; e++) g.quadO(prev.row[e], row[e], row[e + 1], prev.row[e + 1], null, ins, null, [prev.cols[e], cols[e], cols[e + 1], prev.cols[e + 1]]);
          prev = { row, cols };
          cutBank.push({ side, pts: [[bar + 5.2, h], [bar + 7.5, h * 1.02], [bar + 13, h * 0.8], [bar + 24, null]].map(([o, y]) => { const [x, z] = atSf(s0, side * o), gy = nrGround(x, z) + 0.05; return [x, y == null ? gy : Math.max(y0 + y, gy), z]; }) });
          if (f > 0.5 && RK() < 0.12) { const [x, z] = atSf(s0, side * (bar + 1.6)); rock(g, x, y0 + 0.3, z, 0.6 + RK() * 0.6, 0.5 + RK() * 0.4, 0.6 + RK() * 0.5, RK() * TAU, rockAt(x, z, 0.5), RK, 0.3); }
          for (const o of [5, 12]) { const [ex, ez] = atSf(s0, side * (bar + o)); exclPush(ex, ez, 5); }
        }
      }
    }
    if (LK.roos) {   // Bathurst: kangaroos in mobs on the open pastures 60-220 m from the road (out.dyn.roos: World.update moves them)
      const RR = rng(4343), L2 = [], ok = (x, z) => nrLC(x, z) !== 1 && nrDist(x, z) > 30 && nrSlope(x, z) < 0.35;
      for (let tries = 0, mobs = 0; tries < 500 && mobs < 7; tries++) {
        const x = P.x0 + 150 + RR() * (P.x1 - P.x0 - 300), z = P.z0 + 150 + RR() * (P.z1 - P.z0 - 300), rd = nrDist(x, z);
        if (rd < 60 || rd > 220 || nrLC(x, z) !== 0 || nrSlope(x, z) > 0.25 || excluded(x, z)) continue;
        mobs++;
        for (let n = 3 + Math.floor(RR() * 4), q = 0; q < n; q++) { const rx = x + (RR() - 0.5) * 22, rz = z + (RR() - 0.5) * 22; if (ok(rx, rz) && !excluded(rx, rz)) L2.push({ x: rx, z: rz, yaw: RR() * TAU, sc: 0.8 + RR() * 0.35, run: 0, ph: 0, fx: 1, fz: 0 }); }
      }
      if (L2.length) { const mesh = new THREE.InstancedMesh(auRooGeo(), new THREE.MeshLambertMaterial({ vertexColors: true }), L2.length); mesh.castShadow = true; mesh.frustumCulled = false; mesh.name = 'kangaroos'; root.add(mesh);
        out.dyn.roos = { mesh, L: L2, gH: nrGround, ok, t: null }; auRoos(out.dyn.roos, 0, null); }
    }

    // where the car parks were (the built-up land of the land cover round the circuit, 45-420 m from the track, level ground): the fans' camp,
    // the motorhomes and caravans, the fans' area (campLot in js/world.js: the user's choice, »Združi kamp navijačev in avtodom in prikolice in
    // prostor za navijače«), a kind to each 48 m block, as each circuit has them on a race weekend (Styria and Bathurst all three, Rio its fans'
    // area: a city); merged into the scenery, lots aligned with the main straight
    { const LC = P.L, a0 = T.hd[T.idx(sStart)], ID = T.def.id, MIX = ID === 'rio' ? [0, 0, 1] : ID === 'bathurst' ? [0.45, 0.35, 0.2] : [0.4, 0.35, 0.25];
      for (let j = 0; !PER && j < LC.nz && nCars < 220; j++) for (let i = 0; i < LC.nx && nCars < 220; i++) {
        if (P.lc[j * LC.nx + i] !== 3) continue;
        const x = LC.x0 + (i + 0.5) * LC.cell, z = LC.z0 + (j + 0.5) * LC.cell, rd = nrDist(x, z);
        if (LK.town && rd > LK.town) {   // Bathurst: the town past the car parks: houses on their blocks along the street grid
          if (rd < 420 && nHouse < 600 && !excluded(x, z) && nrSlope(x, z) < 0.2 && RH() < 0.55) house(x, z, a0 + ((Math.floor(x / 96) + Math.floor(z / 96)) & 1 ? Math.PI / 2 : 0));
          continue;
        }
        if (rd < 45 || rd > 420 || excluded(x, z) || nrSlope(x, z) > 0.08 || P.pad(x, z, 0) !== 0) continue;
        const rot = a0 + ((Math.floor(x / 64) + Math.floor(z / 64)) & 1 ? Math.PI / 2 : 0), hb = crH(Math.floor(x / 48), Math.floor(z / 48), 83);
        const kind = hb < MIX[0] ? 'kamp' : hb < MIX[0] + MIX[1] ? 'avtodomi' : 'navijaci'; campLot(scen.get(x, z), nrGround, x, z, rot, kind, i * 7 + j); (out.lots || (out.lots = [])).push([x, z, rot, kind]); nCars++;   // (nCars: the lots; out.lots: where, for the tests and the people)
        exclPush(x, z, 11);
      }
    }

    const PK = { root, tex, scen, exclPush, CR, out, matV }, parkSt = PARK ? cpPark(PK) : null;   // (Crystal Palace: the lakes, the sculptures, the terraces, the mast, the houses)

    /* ---- spectators on the grass (the hill between Turns 3 and 4, the infield), fans along the fences, a few everywhere ---- */
    {
      const M = { first: 1.4, gap: 1.2, excluded, below: 4, above: 30, sit: 0.35, flag: PER ? 0 : 0.1, maxSlope: 0.9 };   // (the 1930s: no fans' flags in the crowd)
      const run = (d0, d1, side, o) => crowdRun(CR, sStart + d0, sStart + d1, side, Object.assign({}, M, o));
      for (const [a, b, sd] of def.ga || []) run(a, b, sd, { rows: 9, dens: 0.55, gap: 1.35, clump: 0.7, label: 'RBR ga' });
      run(LK.straight[0], LK.straight[1], LK.straight[2], { rows: 2, dens: 0.12, clump: 0.9, strip: false, label: 'RBR straight' });   // (Styria: the other side is the pit lane)
      for (const sd of [-1, 1]) run(300, L - 470, sd, { rows: 2, dens: 0.05, clump: 0.95, strip: false, label: 'RBR groups' });
      if (LK.trees === 'rio') rioPre(CR, run, exclPush, sStart);   // Rio: the kart track's ground, the samba group, the people on the banks
      for (const e of CR.circ) exclPush(e.x, e.z, e.r);   // the forest keeps clear of them
    }

    /* ---- the woods: spruce and beech where the land cover has forest, bushes on the scrub, lone trees on the meadows and round the farms ---- */
    const tMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const AU = LK.trees === 'au' || LK.trees === 'bt', RIO = LK.trees === 'rio', TG = RIO ? rioTreeGeo : LK.trees === 'bt' ? btGumGeo : AU ? auTreeGeo : nrTreeGeo, NSP = RIO ? 3 : 2;   // (Styria: spruce and beech; Bathurst: eucalypts and wattle; Rio: palms, tropical trees, mangroves)
    const tk = PARK ? [] : [...Array(NSP)].map((q, k) => new IChunks(TG(k), tMat, 128));   // near the road: casting shadows
    const tf = PARK ? [] : [...Array(NSP)].map((q, k) => new IChunks(TG(k + NSP), tMat, 192));   // more than 70 m out: cheaper, no shadows (as on the Nordschleife)
    const fl = RIO ? new IChunks(rioFlowerGeo(), tMat, 512) : null; let nBloom = 0;   // (Rio: the trees in bloom, in big chunks: a few draws)
    let nTrees = PARK ? cpTrees({ root, R, excluded, dens }) : 0;   // (Crystal Palace: the park's old trees)
    if (!PARK) {
      const Lt = NRC * NRT, maxT = Math.round(60000 * dens), CR0 = RIO ? [0.3, 0.42, 0.45] : AU ? [0.24, 0.4] : [0.3, 0.33];   // (crown radius / width of a spruce, a beech (a eucalypt, a wattle): the forest floor under it)
      for (let tj = 0; tj < G.ntz && nTrees < maxT; tj++) for (let ti = 0; ti < G.ntx && nTrees < maxT; ti++) {
        if (!G.on[tj * G.ntx + ti]) continue;
        const xa = G.x0 + ti * Lt, za = G.z0 + tj * Lt;
        for (let zz = za; zz < za + Lt; zz += 6.2) for (let xx = xa; xx < xa + Lt; xx += 6.2) {
          const x = xx + (R() - 0.5) * 5.4, z = zz + (R() - 0.5) * 5.4, rd = nrDist(x, z), r1 = R(), r2 = R();
          if (rd > LOD.radius(260)) continue;
          if (rd > LOD.radius(70) && ((Math.floor(xx / 6.2) + Math.floor(zz / 6.2)) & 1)) continue;   // farther out every other spot, bigger trees
          const cl = nrLC(x, z), far = rd > 70;
          const p = RIO ? RIO_TP[cl] : AU ? (cl === 1 ? (LK.trees === 'bt' ? 0.42 : 0.55) : cl === 2 ? 0.2 : 0.022) : cl === 1 ? 0.9 : cl === 2 ? 0.003 : cl === 3 ? 0.012 : 0.012;   // (Styria: class 2 is farmland; Bathurst: open eucalypt woods, lone gums in the paddocks)
          if (r1 > p) continue;
          if (rd < 48) { const nn = nrNear(x, z); if (nn.i >= 0 && nn.dd < 3.5) continue; if (nn.i >= 0 && nn.dd < 8 && r2 < 0.4) continue; }
          if (excluded(x, z) || P.pad(x, z, 0) !== 0 || (RIO && (rioWet(x, z, 3) || rioPylon(x, z)))) continue;   // (not on the level pit complex either, nor in the lagoon)
          const y = nrGround(x, z); let sp, hgt, wid;
          if (RIO) [sp, hgt, wid] = rioTree(cl, R, far);
          else if (AU) { sp = R() < (cl === 1 ? 0.8 : cl === 2 ? 0.3 : 0.85) ? 0 : 1;   // a eucalypt 15-27 m (crowns high and loose), or a wattle 3-6 m
            hgt = sp === 0 ? (15 + R() * 12) * (far ? 1.05 : 1) : 3 + R() * 3.5; wid = hgt * (sp === 0 ? 0.62 + R() * 0.2 : 1.1 + R() * 0.3); }
          else { sp = cl === 1 ? (P.n1(x * 2.2 + 500, z * 2.2) < 0.62 + (R() - 0.5) * 0.3 ? 0 : 1) : 1;
            hgt = sp === 0 ? (13 + R() * 7) * (far ? 1.1 : 1) : (10 + R() * 5) * (far ? 1.15 : 1); wid = hgt * (sp === 0 ? 0.82 : 0.95 + R() * 0.25); }
          if (sp === 3) { const b = RIO_BLOOM[Math.floor(R() * RIO_BLOOM.length)], k = 0.92 + R() * 0.12; fl.add(x, y - 0.1, z, R() * TAU, wid, hgt, [b[0] * k, b[1] * k, b[2] * k]); nrShade(x, z, wid * 0.42, 1); nTrees++; nBloom++; continue; }   // (Rio: in bloom)
          const cv = 0.86 + R() * 0.28; (far ? tf : tk)[sp].add(x, y - 0.1, z, R() * TAU, wid, hgt, [cv * (0.95 + R() * 0.1), cv, cv * (0.95 + R() * 0.1)]);
          nrShade(x, z, wid * CR0[sp], 1); nTrees++;
        }
      }
    }
    for (const t of tk) t.addTo(root, true);
    if (fl) fl.addTo(root, false);   // (no shadows of their own: a few draws less)
    for (const t of tf) t.addTo(root, false);

    /* ---- terrain tiles and the grass verges out past the barriers (256 m chunks), coloured now: the forest floor under the trees ---- */
    let nTiles = 0;
    {
      const grp = new THREE.Group(); root.add(grp); out.ground = grp;
      for (let k = 0; k < tiles.length; k += 3) { const m = new THREE.Mesh(nrTileGeo(tiles[k], tiles[k + 1], tiles[k + 2] === 1 ? 1 : 4), gMat); m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); nTiles++; }
      // the lawns out past the barriers, mown in stripes too: MOW_B darker bands along the track from 3.5 m past the barrier (the terrain's own
      // colour and grass, a deeper green, fading out 20-36 m out), 5 cm over the ground; not on the pit side of the pit lane, under the stands and
      // the buildings, where the lawn is another part of the track's, nor where the inside of a bend would fold them; woods and scrub keep their
      // own ground (the land cover's built-up cells by the track are mostly its own lawns: striped too)
      const own = (x, z, i) => { const n = nrNear(x, z), d = Math.abs(n.i - i); return n.i >= 0 && Math.min(d, N - d) < 30; };
      const mowPt = (i, side, o) => { const p = Pt(i, side * o, 0), x = p[0], z = p[2]; if (excluded(x, z) || !own(x, z, i)) return null;
        const f = (1 - nrLCf(x, z, 1)) * (1 - nrLCf(x, z, 2)) * sstep(36, 20, o - (side > 0 ? T.br[i] : T.bl[i])), c = nrGCol(x, z);
        return f < 0.05 ? null : { p: [x, nrGround(x, z) + 0.05, z], c: c.map((v, k) => v * (1 - MOW_D[k] * f)) }; };
      for (let c0 = 0; c0 < N; c0 += CH) {
        const gv = new RB(true), pv = [-1, -1], pw = [null, null], pm = [new Array(MOW_B).fill(-1), new Array(MOW_B).fill(-1)];
        for (let ii = c0; ii <= Math.min(c0 + CH, N); ii++) {
          const i = ii % N;
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, bar = side > 0 ? T.br[i] : T.bl[i], fold = side * T.k[i] > 0 ? 0.7 / Math.abs(T.k[i]) : 1e9, pit = side === PSD && PD && (T.pitAt(i * ds) || T.pitAt(i * ds + 20) || T.pitAt(i * ds - 20));
            for (let b = 0; b < MOW_B; b++) {
              const oa = bar + 3.5 + b * 2 * MOW_O, ob = oa + MOW_O, A = !pit && ob < fold ? mowPt(i, side, oa) : null, B = A ? mowPt(i, side, ob) : null;
              if (!B) { pm[si][b] = -1; continue; }
              const q = side > 0 ? [A, B] : [B, A], r = gv.row(q.map(e => e.p), q.map(e => e.c), q.map(e => [e.p[0] / 14, -e.p[2] / 14]));
              if (pm[si][b] >= 0) gv.link(pm[si][b], r, 0, 1); pm[si][b] = r;
            }
          }
          for (const side of [-1, 1]) {
            const si = side > 0 ? 1 : 0, vr = rbVerge(i, side), [o1, h1] = vr[1], [o2, h2] = vr[2], band = [];
            for (let b = 1; b <= MOW_N; b++) { const o = Math.min(o1 + b * MOW_W, o2), h = h1 + (h2 - h1) * (o - o1) / (o2 - o1); band.push([o, h], [o, h]); }   // (each edge twice: a sharp change of colour)
            const pr = [vr[0], vr[1], ...band, vr[2], vr[3], vr[4]], nb = 2 + 2 * MOW_N;
            const pts = pr.map(([o, h]) => Pt(i, side * o, h)), cols = pr.map(([o], k) => { const p = pts[k]; if (k === 0 && LK.edge) { const e = LK.edge, q = 0.75 + 0.5 * P.n3(p[0] * 0.6 + 50, p[2] * 0.6); return [vg[0] * lerp(1, e[0], q), vg[1] * lerp(1, e[1], q), vg[2] * lerp(1, e[2], q)]; }   // (Bathurst: the edge by the asphalt worn and dusty, in patches)
              if (k <= nb) { const c = k < 2 ? vg : (Math.floor((k - 1) / 2) % 2 ? vg : vgD); if (!PER) return c;
                const f = 1 + (P.n4(p[0] * 0.7, p[2] * 0.7) - 0.5) * 0.2 + (P.n3(p[0] * 1.5 + 80, p[2] * 1.5) - 0.5) * 0.12, y = sstep(0.58, 0.8, P.n4(p[0] * 0.5 - 300, p[2] * 0.5 + 120)) * 0.5;   // (the 1930s park: the verges in patches, some drier)
                return [c[0] * f * (1 + y * 0.2), c[1] * f * (1 + y * 0.04), c[2] * f * (1 - y * 0.3)]; } const gc = nrGCol(p[0], p[2]); return k === nb + 1 ? [lerp(vg[0], gc[0], 0.5), lerp(vg[1], gc[1], 0.5), lerp(vg[2], gc[2], 0.5)] : gc; });
            if (LK.verge) LK.verge(cols, pr, nb, i, side);   // (Rio: worn to dust along the asphalt)
            const ordered = side > 0 ? { p: pts, c: cols } : { p: pts.slice().reverse(), c: cols.slice().reverse() };   // rows run left -> right
            const rv = gv.row(ordered.p, ordered.c, ordered.p.map(p => [p[0] / 14, -p[2] / 14]));
            const ow = side > 0 ? pr.map(e => e[0]) : pr.map(e => e[0]).reverse(), qw = pw[si];
            if (pv[si] >= 0) for (let k = 0; k < ow.length - 1; k++) if (Math.abs(ow[k + 1] - ow[k]) > 1e-3 || Math.abs(qw[k + 1] - qw[k]) > 1e-3) gv.link(pv[si], rv, k, k + 1);   // (not the bands of no width, nor between an edge's two points)
            pv[si] = rv; pw[si] = ow;
          }
        }
        addM(gv, gMat);
      }
      if (PK.gTop && !PK.gTop.empty) addM(PK.gTop, gMat);   // (Crystal Palace: the upper lawns over the terrace walls' cut)
      if (cutBank.length) {   // Bathurst: the bank over the rock cutting, in the hillside's grass: its edge dry, then the hillside's own colours
        const gb = new RB(true); let pr = -1;
        for (const { side, pts } of cutBank) {
          const cs = pts.map((q, k) => { const c = nrGCol(q[0], q[2]); return k === 0 ? [c[0] * 1.08, c[1] * 0.96, c[2] * 0.86] : c; }), o = side > 0 ? [0, 1, 2, 3] : [3, 2, 1, 0];   // (rows run left -> right)
          const r = gb.row(o.map(k => pts[k]), o.map(k => cs[k]), o.map(k => [pts[k][0] / 14, -pts[k][2] / 14]));
          if (pr >= 0) gb.link(pr, r, 0, 3); pr = r;
        }
        addM(gb, gMat);
      }
      G.col = G.cov = P.edge = null;   // (build only)
    }

    rbringProps(out, (i, side) => { const d = dS(i * ds); return (d > -440 && d < 280) || (side === PSD && PD && (T.pitAt(i * ds) || T.pitAt(i * ds + 25) || T.pitAt(i * ds - 25))); }, PER);
    const sceneryGroup = new THREE.Group(); root.add(sceneryGroup);
    scen.addTo(sceneryGroup, matV, true, true);
    const bm = addM(ban, new THREE.MeshLambertMaterial({ map: atlas })); if (bm) bm.castShadow = false;
    addM(fenceG, fMat);
    crowdFinish(CR, root, out);
    const smTex = ownTex(rbSmokeTex());
    if (smokeL.length) root.add(rbSmoke(smokeL, CR.U.uTime, smTex));   // (the crowd's clock: World.update sets it)
    if (podAt) {   // the podium (shown after the race: game.js), two orange flares on the apron in front of it for the ceremony
      const { s, f0 } = podAt, i = T.idx(s), [x, z] = atSf(s, f0 + 3.2), P = out.dyn.podium = out.podium = rbPodium(root, { x, z, y: hyS(s) + 12.25, tx: T.tx[i], tz: T.tz[i], nx: T.nx[i], nz: T.nz[i] }, CR.U.uTime);
      const fl = [12, -12].map((a) => { const [fx2, fz2] = atSf(s + a, f0 - 3); return [fx2, hyS(s + a) + 0.3, fz2, SMK[0], 1.1]; });   // (at the edges of the shot)
      P.smoke = rbSmoke(fl, CR.U.uTime, smTex); P.smoke.visible = false; root.add(P.smoke);
    }
    out.crowdPts = Float32Array.from(crowdPts);
    if (!PER) out.dyn.air = out.air = rbAir(root, ownTex, nrGround, LK.jets);   // the helicopter's pass, the jets before the start (game.js: air.go, air.shot); not in the 1930s
    if (out.air) out.air.finOnly = !!LK.heliFin;   // (Rio: the helicopter only over the finish, after the race)
    if (!scrG.empty) { const st = ownTex(rbScreenTex(LK)); addM(scrG, new THREE.MeshBasicMaterial({ map: st })); out.dyn.screens = { tex: st, f: -1 }; }
    out.stats = { tiles: nTiles, trees: nTrees, posts: nPosts, stands: nStands, boxes: nBoxes, camp: nCamp, farms: nFarm, cars: nCars, houses: nHouse, tv: nTV, decals: nDecals, smoke: smokeL.length, flags: flagL.length, screens: nScr, photographers: nPh, park: parkSt };   // (read by the tests)
    if (RIO) { out.stats.rio = rioExtra(scene, root, out, ownTex, tex, excluded, exclPush); out.stats.rio.bloom = nBloom; }   // Rio: the lagoon, palms along the straights, the mountains round the basin
    if (flagL.length) root.add(rbFlags(flagL, CR.U.uTime));   // (last: the build's other flags are in API.flags by now)
    return out;
  }

  Object.assign(API, { RB_WIND, rbAirStep, rbCrowdTex, rbFlags, rbGravelTex, rbSmoke, rbSmokeTex, rbVerge });   // (what World and the other worlds use of this one)
  World.keep('NR', 'rbring');   // (its grids kept between its builds; World.build frees the others': tools/razdeli-proge.mjs)
  World.ext.rbring = (scene, tex, opts) => buildRbring(scene, tex, opts);
})();
