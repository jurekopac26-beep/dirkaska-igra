/* =========================================================================
   WORLD — Koli, Finska (theme 'koli'): the data-driven builder of the short roads (World.gore, js/world-gore.js) with this road's style; its own
   things in S.extra. Made by tools/nova-proga.mjs (the style from tools/predogled/proge.json). Packed snow only on a piece of the road (def.surf in
   js/tracks/koli.js, 1640-1940 m after the start, about 15 % of it: the user's choice, 28. 11.), and there it always snows: a box of flakes that
   follows the car, as Pikes Peak's flurries (js/world-pikes.js), shown only while the car is on that piece (faded in and out over ~40 m). Only to see.
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.gore) return;
  const SNOW = [1640, 1940], FADE = 40;   // (the packed snow's span, metres after the start: the same as def.surf)
  function snowfall(root) {
    const NF = 3200, BX = 70, BY = 24, fp = new Float32Array(NF * 3), fr = new Float32Array(NF);
    let q = 4127; const R = () => ((q = (q * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < NF; k++) { fp[k * 3] = R() * BX; fp[k * 3 + 1] = R() * BY; fp[k * 3 + 2] = R() * BX; fr[k] = R(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(fp, 3)); g.setAttribute('aR', new THREE.BufferAttribute(fr, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    const U = { uC: { value: new THREE.Vector3() }, uT: { value: 0 }, uD: { value: 0 }, uS: { value: 400 } };
    const pts = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false,
      vertexShader: 'uniform vec3 uC; uniform float uT, uD, uS; attribute float aR; varying float vA;\n' +
        'void main() { vec3 B = vec3(' + BX.toFixed(1) + ', ' + BY.toFixed(1) + ', ' + BX.toFixed(1) + '); float ph = aR * 43.7;\n' +
        'vec3 p = position + vec3(uT * 0.6 + sin(uT * 0.9 + ph) * 0.8, -uT * (0.9 + 0.5 * fract(ph)), -uT * 0.4 + cos(uT * 0.7 + ph * 1.3) * 0.8);\n' +
        'vec3 lo = uC - vec3(B.x * 0.5, 5.0, B.z * 0.5); p = lo + mod(p - lo, B); vec3 r = (p - lo) / B;\n' +
        'vec4 mv = modelViewMatrix * vec4(p, 1.0); float z = -mv.z;\n' +
        'vA = step(aR, uD) * smoothstep(0.0, 0.12, r.x) * smoothstep(1.0, 0.88, r.x) * smoothstep(0.0, 0.12, r.z) * smoothstep(1.0, 0.88, r.z) * smoothstep(0.0, 0.06, r.y) * smoothstep(1.0, 0.8, r.y) * smoothstep(5.0, 12.0, z);\n' +
        'gl_PointSize = vA > 0.0 ? clamp((0.2 + 0.16 * fract(ph * 7.0)) * uS / max(1.0, z), 2.0, 12.0) : 0.0; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying float vA; void main() { vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; if (r > 1.0) discard; gl_FragColor = vec4(0.97, 0.98, 1.0, vA * 0.92 * (1.0 - r * r)); }' }));
    pts.frustumCulled = false; pts.renderOrder = 8; pts.visible = false; root.add(pts);
    pts.onBeforeRender = (r, sc, cam) => { U.uS.value = r.domElement.height * cam.projectionMatrix.elements[5] / 2; };   // (pixels per metre at 1 m)
    return (t, car, race) => {   // (where the car is on the line: the track's sample when there is one, as a teleported car's dist lags; else its dist)
      const T = race && race.track, s = !car ? -1e9 : T && car.q && isFinite(car.q.s) ? car.q.s - T.startS : isFinite(car.dist) ? car.dist : -1e9;
      const d = Math.min(1, Math.max(0, (s - SNOW[0] + FADE) / FADE), Math.max(0, (SNOW[1] + FADE - s) / FADE));
      pts.visible = d > 0.01; U.uD.value = d;
      if (pts.visible) { U.uC.value.set(car.x, car.roadY || car.y || 0, car.z); U.uT.value = t % 1000; }
    };
  }
  World.ext.koli = (scene, tex, opts) => {
    const out = World.gore.build(scene, tex, opts, {
      seed: 1717, snow: 'all',
      road: { line: 'none' },   // (the ploughed road, snow at its sides: no lines to see)
      trees: { kinds: ['fir', 'pine'], forest: 0.4, h: [8, 16] },   // (the boreal forest of the national park: spruce and pine)
      skiers: 50, nets: true, snowbanks: true,
      animals: [],
      extra: (ctx) => { if (World.ext.goreRob) World.ext.goreRob(ctx, 'koli'); },   // (the roadside ground for the chase camera: js/world-chase-bt19.js)
    });
    const fall = snowfall(out.root), prev = out.dyn.ext;
    out.dyn.ext = (t, car, cam, race) => { if (prev) prev(t, car, cam, race); fall(t, car, race); };
    return out;
  };
  World.ext.koli.SNOW = SNOW;
})();
