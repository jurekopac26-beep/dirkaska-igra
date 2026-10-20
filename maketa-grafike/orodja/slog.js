// Slog »topli diorama«: videz iz priloženih slik (toplo nizko sonce, hladne sence, grunge na površinah, mehka okluzija,
// globinska ostrina kot pri maketi, glow, barvna gradacija), vbrizgan v tekočo igro SAMO ob posnetku. js/ in css/ se ne spremenita.
//   window.__slog.apply(opts)   uporabi slog (opts prekrije privzete vrednosti), enable(true|false) ga vklopi/izklopi, restore() vrne vse
// Potrebuje window.__stilRenderer (zanka ZANKA v scena.mjs) in igro, ki ima Render.scene / Render.camera / window.__game.
(() => {
  'use strict';
  if (window.__slog && window.__slog.restore) { try { window.__slog.restore(); } catch (e) { console.warn('restore: ' + e.message); } }
  const R = window.__stilRenderer, T = THREE;
  if (!R) throw new Error('ni zanke THREE.WebGLRenderer (openScene mora dati init: ZANKA)');

  const DEF = {
    light: { keepDir: 0, az: 38, el: 31, sun: [1.0, 0.87, 0.70], sunI: 1.75, sky: [0.60, 0.74, 1.0], gnd: [0.58, 0.46, 0.32], hemiI: 0.66, shadow: 4096, keepTheme: 0 },
    fog: { warm: [1.0, 0.80, 0.60], k: 0.30, mul: 1 },
    surf: { grunge: 1, grass: 1, asphalt: 1, concrete: 1 },
    ao: { on: 1, radius: 1.6, intensity: 1.15 },
    dof: { on: 1, aperture: 0.85, maxPx: 8, dead: 0.14, tilt: 0.38, focus: 'car' },
    bloom: { on: 1, thr: 0.84, k: 0.26 },
    grade: { sharp: 0.45, exp: 1.04, tone: 0.5, con: 0.22, sat: 1.18, shT: [0.90, 0.98, 1.10], hiT: [1.06, 1.015, 0.92], vig: 0.28 },
  };
  const merge = (a, b) => { const o = Array.isArray(a) ? a.slice() : Object.assign({}, a); for (const k in (b || {})) o[k] = (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a && typeof a[k] === 'object') ? merge(a[k], b[k]) : b[k]; return o; };

  const PRESETS = {
    day: {},
    dusk: { light: { keepTheme: 1, keepDir: 1, hemiMul: 1.05, sunMul: 1.0 }, fog: { k: 0 }, bloom: { thr: 0.62, k: 0.42 }, grade: { exp: 1.04, tone: 0.45, sat: 1.18, shT: [0.88, 0.97, 1.12], hiT: [1.04, 1.0, 0.92], vig: 0.3 } },
    night: { light: { keepTheme: 1, keepDir: 1, hemiMul: 1.7, sunMul: 1.4 }, fog: { k: 0 }, ao: { intensity: 0.9 }, bloom: { thr: 0.62, k: 0.5 }, grade: { exp: 1.14, tone: 0.35, con: 0.2, sat: 1.18, shT: [0.84, 0.95, 1.18], hiT: [1.08, 1.0, 0.88], vig: 0.34 } },
    rain: { light: { keepTheme: 1, keepDir: 1, hemiMul: 0.92, sunMul: 1.0 }, fog: { k: 0 }, ao: { intensity: 1.4 }, bloom: { thr: 0.55, k: 0.38 }, grade: { sharp: 0.6, exp: 0.96, tone: 0.5, con: 0.42, sat: 1.22, shT: [0.84, 0.96, 1.16], hiT: [1.02, 1.0, 0.96], vig: 0.4 } },
  };
  const ST = { on: false, o: merge(DEF, {}), mats: new Map(), added: [], lights: null, rt: null, mesh: {}, hooked: false };
  const SU = { uOn: { value: 1 }, uGrunge: { value: 1 }, uGrass: { value: 1 }, uAsph: { value: 1 }, uConc: { value: 1 } };
  const v2 = new T.Vector2(), v3 = new T.Vector3(), cA = new T.Color();

  /* ---------------- površine: shader, ki se doda obstoječim materialom (Lambert, Phong) ---------------- */
  const GLSL_NOISE = `
    float stH(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float stN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(stH(i), stH(i + vec2(1.0, 0.0)), f.x), mix(stH(i + vec2(0.0, 1.0)), stH(i + vec2(1.0, 1.0)), f.x), f.y); }
    float stF(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * stN(p); p = p * 2.03 + vec2(17.1, 3.7); a *= 0.5; } return s; }
    uniform float uOn; uniform float uGrunge; uniform float uGrass; uniform float uAsph; uniform float uConc;
    varying vec3 vStP; varying vec3 vStN;
    vec3 stSurface(vec3 c, vec3 wp, vec3 n){
#ifdef ST_CAR
      { float l = dot(c, vec3(0.299, 0.587, 0.114)); vec3 o = mix(vec3(l), c, 1.16); o *= 0.84;
        float gg = stN(wp.xz * 9.0 + wp.y * 7.0) * 0.5 + stN(wp.xz * 33.0 + wp.y * 21.0) * 0.5; o *= 0.92 + 0.16 * gg;
        return mix(c, o, uOn); }
#endif
      float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b));
      float lum = dot(c, vec3(0.299, 0.587, 0.114));
      float sat = (mx - mn) / max(mx, 1e-3);
      float up = smoothstep(0.50, 0.90, n.y);
      float grass = smoothstep(0.02, 0.09, c.g - max(c.r * 0.95, c.b)) * up;
      float neutral = 1.0 - smoothstep(0.10, 0.24, sat);
      float asphalt = neutral * (1.0 - smoothstep(0.30, 0.50, lum)) * up * (1.0 - grass);
      float lightN = neutral * smoothstep(0.36, 0.56, lum) * (1.0 - grass);
      float warm = smoothstep(0.14, 0.34, sat) * (1.0 - grass) * up * step(c.b + 0.02, c.r);   // zemlja, pesek, makadam
      vec2 g = wp.xz;
      vec3 o = c;
      // trava: šopi (30 cm), zaplate (15 m), košnja (pasovi ~6 m), mestoma posušena
      if (grass > 0.001) {
        float cl = stN(g * 3.3) * 0.55 + stN(g * 9.1) * 0.45;
        float pt = stF(g * 0.055 + 3.0);
        float bd = smoothstep(0.42, 0.58, sin(dot(g, vec2(0.50, 0.86)) * 0.52) * 0.5 + 0.5);
        vec3 dry = vec3(c.r * 1.22 + 0.04, c.g * 0.98 + 0.01, c.b * 0.70);
        vec3 deep = c * vec3(0.80, 0.92, 0.80);
        vec3 gc = mix(deep, dry, smoothstep(0.40, 0.85, pt) * 0.8);
        gc = mix(vec3(dot(gc, vec3(0.299, 0.587, 0.114))), gc, 0.86);
        gc *= 1.0 + (cl - 0.5) * 0.50 + (bd - 0.5) * 0.09;
        o = mix(o, gc, grass * uGrass);
      }
      // asfalt: zrnatost, zaplate popravil, oljne lise, tanke razpoke
      if (asphalt > 0.001) {
        float gr = stN(g * 52.0) * 0.5 + stN(g * 19.0) * 0.5;
        float tone = stF(g * 0.33);
        vec2 cell = floor(g / vec2(7.0, 5.0) + 0.5 * floor(g.yx / 5.0));
        float rp = stH(cell + 3.0), repair = step(0.72, rp);
        float oil = smoothstep(0.64, 0.84, stF(g * 0.85 + 7.0));
        float cr = 1.0 - smoothstep(0.0, 0.010, abs(stF(g * 1.5 + 11.0) - 0.5));
        vec3 a = c * (0.84 + 0.34 * tone) * (0.93 + 0.14 * gr);
        a *= 1.0 - 0.22 * oil;
        a *= mix(1.0, 0.80 + 0.18 * rp, repair);
        a = mix(a, a * vec3(0.52, 0.53, 0.57), cr * 0.55);
        o = mix(o, a, asphalt * uAsph);
      }
      // svetli betoni in zidovi: madeži, navpične proge dežja, spoji plošč
      if (lightN > 0.001) {
        float vert = 1.0 - up;
        vec2 t2 = normalize(vec2(-n.z, n.x) + 1e-4);
        float u = dot(wp.xz, t2);
        float st = stN(vec2(u * 2.3, wp.y * 0.28)) * 0.6 + stN(vec2(u * 6.7, wp.y * 0.9)) * 0.4;
        float tone = stF(g * 0.45 + wp.y * 0.1);
        float stain = smoothstep(0.50, 0.80, stF(vec2(u * 0.7, wp.y * 0.55) + 5.0));
        float seam = (1.0 - smoothstep(0.0, 0.03, abs(fract(u / 2.6) - 0.5) - 0.47)) * vert;
        vec3 k = c * (0.84 + 0.30 * tone);
        k *= mix(1.0, 0.82 + 0.3 * st, vert);
        k = mix(k, k * vec3(0.62, 0.58, 0.52), stain * 0.55);
        k *= 1.0 - 0.18 * seam;
        o = mix(o, k, lightN * uConc);
      }
      // zemlja in makadam: grude, kolesnice
      if (warm > 0.001) {
        float cl = stN(g * 6.0) * 0.5 + stN(g * 17.0) * 0.5;
        float tone = stF(g * 0.4);
        o = mix(o, c * (0.82 + 0.34 * tone) * (0.88 + 0.24 * cl), warm * uGrunge);
      }
      // listje in grmovje (zelene ploskve, ki niso tla): lise lističev, na vrhovih posušene od sonca
      float leaf = smoothstep(0.02, 0.09, c.g - max(c.r, c.b)) * (1.0 - grass);
      if (leaf > 0.001) {
        float lf = stN(wp.xz * 2.3 + wp.y * 1.7) * 0.5 + stN(wp.zy * 4.7 + wp.x * 0.9) * 0.5;
        float l2 = stN(wp.xz * 0.45 + wp.y * 0.3);
        vec3 lc = o * (0.76 + 0.55 * lf) * (0.90 + 0.2 * l2);
        lc = mix(lc, lc * vec3(1.14, 1.07, 0.78), smoothstep(0.15, 0.9, n.y) * 0.55);
        o = mix(o, lc, leaf * uGrunge);
      }
      // vsem: rahla velikopotezna barvna razgibanost (ročno poslikano)
      float bt = stF(g * 0.12 + wp.y * 0.05);
      o *= 0.93 + 0.14 * bt;
      return mix(c, o, uOn);
    }`;
  function patchMaterial(m) {
    if (ST.mats.has(m)) return false;
    if (!(m.isMeshLambertMaterial || m.isMeshPhongMaterial)) return false;
    if (m.transparent && m.depthWrite === false) return false;   // (sledi, sence, dim)
    ST.mats.set(m, { obc: m.onBeforeCompile, key: m.customProgramCacheKey });
    const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey ? m.customProgramCacheKey.call(m) : '';
    m.onBeforeCompile = function (sh, r) {
      if (prev) prev.call(this, sh, r);
      Object.assign(sh.uniforms, SU);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vStP; varying vec3 vStN;')
        .replace('#include <defaultnormal_vertex>', '#include <defaultnormal_vertex>\nvStN = inverseTransformDirection( transformedNormal, viewMatrix );')
        .replace('#include <project_vertex>', '#include <project_vertex>\n{ vec4 sP = vec4( transformed, 1.0 );\n#ifdef USE_INSTANCING\n sP = instanceMatrix * sP;\n#endif\n vStP = ( modelMatrix * sP ).xyz; }');
      sh.fragmentShader = (m.envMap ? '#define ST_CAR\n' : '') + sh.fragmentShader
        .replace('#include <common>', '#include <common>\n' + GLSL_NOISE)
        .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = stSurface( diffuseColor.rgb, vStP, normalize( vStN ) );');
    };
    m.customProgramCacheKey = () => prevKey + '|stil1';
    m.needsUpdate = true;
    return true;
  }
  function patchAll() {
    let n = 0; const seen = new Set();
    Render.scene.traverse((o) => {
      if (!o.isMesh || ST.added.includes(o)) return;
      for (const m of (Array.isArray(o.material) ? o.material : [o.material])) { if (m && !seen.has(m)) { seen.add(m); if (patchMaterial(m)) n++; } }
    });
    return n;
  }

  /* ---------------- svetloba ---------------- */
  function findLights() {
    let hemi = null, sun = null;
    for (const o of Render.scene.children) { if (o.isHemisphereLight) hemi = o; if (o.isDirectionalLight && o.castShadow) sun = o; }
    return { hemi, sun };
  }
  function saveLights() {
    const { hemi, sun } = findLights(); if (!hemi || !sun) throw new Error('ni luči');
    const fog = Render.scene.fog;
    ST.lights = { hemi, sun, shadowSize: sun.shadow.mapSize.x, shadowType: R.shadowMap.type,
      hc: hemi.color.clone(), hg: hemi.groundColor.clone(), hi: hemi.intensity, sc: sun.color.clone(), si: sun.intensity, fog: fog ? fog.color.clone() : null, clear: new T.Color() };
    R.getClearColor(ST.lights.clear);
  }
  function restoreLights() {   // (luči, megla in barva ozadja, kot jih je nastavila igra)
    const L = ST.lights; if (!L) return;
    L.hemi.color.copy(L.hc); L.hemi.groundColor.copy(L.hg); L.hemi.intensity = L.hi; L.sun.color.copy(L.sc); L.sun.intensity = L.si;
    if (L.fog && Render.scene.fog) Render.scene.fog.color.copy(L.fog);
    R.setClearColor(L.clear, 1);
    if (L.sun.shadow.mapSize.x !== L.shadowSize) { L.sun.shadow.mapSize.set(L.shadowSize, L.shadowSize); if (L.sun.shadow.map) { L.sun.shadow.map.dispose(); L.sun.shadow.map = null; } }
  }
  function prepareFrame(camera) {
    const L = ST.o.light, { hemi, sun } = ST.lights, game = Render.scene;
    if (!L.keepTheme) {
      hemi.color.setRGB(...L.sky); hemi.groundColor.setRGB(...L.gnd); hemi.intensity = L.hemiI;
      sun.color.setRGB(...L.sun); sun.intensity = L.sunI;
    } else { hemi.intensity = ST.lights.hi * (L.hemiMul || 1); sun.intensity = ST.lights.si * (L.sunMul || 1); }
    if (L.keepDir) { /* smer in barva sonca iz igre (večer, noč) */ } else {
    // smer sonca glede na kamero: spredaj desno, nizko (dolge sence proti kameri)
    camera.getWorldDirection(v3); const fx = v3.x, fz = v3.z, fl = Math.hypot(fx, fz) || 1, f0 = fx / fl, f1 = fz / fl;
    const az = L.az * Math.PI / 180, el = L.el * Math.PI / 180, ce = Math.cos(el);
    const dx = (f0 * Math.cos(az) - f1 * Math.sin(az)) * ce, dz = (f1 * Math.cos(az) + f0 * Math.sin(az)) * ce, dy = Math.sin(el);
    const dist = 130, T0 = sun.target.position;
    sun.position.set(T0.x + dx * dist, T0.y + dy * dist, T0.z + dz * dist);
    sun.target.updateMatrixWorld(); }
    const sc = sun.shadow.camera; if (sc.right !== 80) { sc.left = -80; sc.right = 80; sc.top = 80; sc.bottom = -80; sc.near = 10; sc.far = 320; sc.updateProjectionMatrix(); }
    if (sun.shadow.mapSize.x !== L.shadow) { sun.shadow.mapSize.set(L.shadow, L.shadow); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
    if (game.fog && ST.lights.fog) { const F = ST.o.fog; cA.setRGB(...F.warm); game.fog.color.copy(ST.lights.fog).lerp(cA, F.k); R.setClearColor(game.fog.color, 1); if (F.mul && F.mul !== 1) { game.fog.near *= F.mul; game.fog.far *= F.mul; } }
  }

  /* ---------------- post-obdelava ---------------- */
  const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const IGN = 'float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }';
  const LIN = '#include <packing>\nuniform sampler2D tDepth; uniform float uNear; uniform float uFar;\nfloat lin(vec2 uv){ return -perspectiveDepthToViewZ(unpackRGBAToDepth(texture2D(tDepth, uv)), uNear, uFar); }';
  const mk = (fs, uniforms) => new T.ShaderMaterial({ uniforms, vertexShader: VS, fragmentShader: fs, depthTest: false, depthWrite: false });
  function buildPost() {
    const common = () => ({ tDepth: { value: null }, uNear: { value: 1 }, uFar: { value: 500 }, uRes: { value: new T.Vector2(4, 4) } });
    const aoU = Object.assign(common(), { uTan: { value: new T.Vector2(1, 1) }, uProj: { value: new T.Matrix4() }, uRadius: { value: 1.6 }, uInt: { value: 1 } });
    const ao = mk(LIN + IGN + `
      uniform vec2 uRes; uniform vec2 uTan; uniform mat4 uProj; uniform float uRadius; uniform float uInt; varying vec2 vUv;
      vec3 vp(vec2 uv, float z){ vec2 n = uv * 2.0 - 1.0; return vec3(n.x * uTan.x * z, n.y * uTan.y * z, -z); }
      void main(){
        float z = lin(vUv);
        if (z > uFar * 0.97) { gl_FragColor = vec4(1.0); return; }
        vec2 px = 1.0 / uRes; vec3 P = vp(vUv, z);
        float zl = lin(vUv - vec2(px.x, 0.0)), zr = lin(vUv + vec2(px.x, 0.0)), zd = lin(vUv - vec2(0.0, px.y)), zu = lin(vUv + vec2(0.0, px.y));
        vec3 dx = abs(zr - z) < abs(z - zl) ? vp(vUv + vec2(px.x, 0.0), zr) - P : P - vp(vUv - vec2(px.x, 0.0), zl);
        vec3 dy = abs(zu - z) < abs(z - zd) ? vp(vUv + vec2(0.0, px.y), zu) - P : P - vp(vUv - vec2(0.0, px.y), zd);
        vec3 N = normalize(cross(dx, dy));
        float rnd = ign(gl_FragCoord.xy) * 6.2831853;
        vec3 upv = abs(N.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
        vec3 T1 = normalize(cross(upv, N)), B1 = cross(N, T1);
        float occ = 0.0;
        for (int i = 0; i < 16; i++) {
          float fi = float(i), a = fi * 2.39996323 + rnd, r = sqrt((fi + 0.5) / 16.0), h = sqrt(1.0 - r * r) * 0.92 + 0.08;
          vec3 Q = P + (T1 * cos(a) * r + B1 * sin(a) * r + N * h) * (uRadius * (0.2 + 0.8 * r));
          vec4 cq = uProj * vec4(Q, 1.0); vec2 uq = cq.xy / cq.w * 0.5 + 0.5;
          if (uq.x < 0.0 || uq.x > 1.0 || uq.y < 0.0 || uq.y > 1.0) continue;
          float zq = lin(uq), dz = (-Q.z) - zq;
          occ += step(0.025 + 0.0015 * z, dz) * smoothstep(0.0, 1.0, uRadius / max(abs(z - zq), 1e-3));
        }
        occ /= 16.0;
        gl_FragColor = vec4(vec3(1.0 - clamp(occ * uInt, 0.0, 1.0)), 1.0);
      }`, aoU);
    const blurU = Object.assign(common(), { tI: { value: null }, uDir: { value: new T.Vector2() } });
    const blur = mk(LIN + `
      uniform sampler2D tI; uniform vec2 uDir; varying vec2 vUv;
      void main(){
        float zc = lin(vUv), s = 0.0, ws = 0.0;
        for (int i = -4; i <= 4; i++) {
          float fi = float(i); vec2 uv = vUv + uDir * fi; float z = lin(uv), d = abs(z - zc) / (0.025 * zc + 0.15);
          float w = exp(-fi * fi * 0.08) * exp(-d * d);
          s += texture2D(tI, uv).r * w; ws += w;
        }
        gl_FragColor = vec4(vec3(s / max(ws, 1e-4)), 1.0);
      }`, blurU);
    const brU = { tD: { value: null }, uPx: { value: new T.Vector2() }, uThr: { value: 0.7 } };
    const bright = mk(`uniform sampler2D tD; uniform vec2 uPx; uniform float uThr; varying vec2 vUv;
      vec3 bp(vec2 o){ vec3 c = texture2D(tD, vUv + o * uPx).rgb; float m = max(c.r, max(c.g, c.b)); return c * smoothstep(uThr, uThr + 0.25, m); }
      void main(){ gl_FragColor = vec4((bp(vec2(-1.0, -1.0)) + bp(vec2(1.0, -1.0)) + bp(vec2(-1.0, 1.0)) + bp(vec2(1.0, 1.0))) * 0.25, 1.0); }`, brU);
    const mkBlur = () => mk(`uniform sampler2D tD; uniform vec2 uDir; varying vec2 vUv;
      void main(){ vec3 s = texture2D(tD, vUv).rgb * 0.227 + (texture2D(tD, vUv + uDir * 1.385).rgb + texture2D(tD, vUv - uDir * 1.385).rgb) * 0.316 + (texture2D(tD, vUv + uDir * 3.231).rgb + texture2D(tD, vUv - uDir * 3.231).rgb) * 0.07; gl_FragColor = vec4(s, 1.0); }`,
      { tD: { value: null }, uDir: { value: new T.Vector2() } });
    const cU = Object.assign(common(), {
      tD: { value: null }, tAO: { value: null }, tB: { value: null },
      uFocus: { value: 40 }, uFocusY: { value: 0.4 }, uAp: { value: 1 }, uMaxCoC: { value: 9 }, uDead: { value: 0.1 }, uTilt: { value: 0.5 }, uDofOn: { value: 1 }, uAoOn: { value: 1 },
      uTint: { value: new T.Vector3(1, 1, 1) }, uSat: { value: 1 }, uCon: { value: 1 }, uGam: { value: 1 }, uShT: { value: new T.Vector3(1, 1, 1) }, uHiT: { value: new T.Vector3(1, 1, 1) },
      uSharp: { value: 0.4 }, uExp: { value: 1 }, uTone: { value: 0.5 }, uCon2: { value: 0.2 }, uSat2: { value: 1.1 }, uShT2: { value: new T.Vector3(1, 1, 1) }, uHiT2: { value: new T.Vector3(1, 1, 1) }, uVig2: { value: 0.3 }, uBloomK: { value: 0.3 }, uBloomOn: { value: 1 },
    });
    const comp = mk(LIN + IGN + `
      uniform sampler2D tD; uniform sampler2D tAO; uniform sampler2D tB; uniform vec2 uRes;
      uniform float uFocus; uniform float uFocusY; uniform float uAp; uniform float uMaxCoC; uniform float uDead; uniform float uTilt; uniform float uDofOn; uniform float uAoOn;
      uniform vec3 uTint; uniform float uSat; uniform float uCon; uniform float uGam; uniform vec3 uShT; uniform vec3 uHiT;
      uniform float uSharp; uniform float uExp; uniform float uTone; uniform float uCon2; uniform float uSat2; uniform vec3 uShT2; uniform vec3 uHiT2; uniform float uVig2; uniform float uBloomK; uniform float uBloomOn;
      varying vec2 vUv;
      float lm(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
      float cocOf(float z, vec2 uv){
        float rel = abs(z - uFocus) / max(z, 1.0);
        float c = max(rel - uDead, 0.0) * 2.2 * uAp;
        float band = smoothstep(0.22, 0.62, abs(uv.y - uFocusY));
        return min(max(c, band * uTilt * 0.7), 1.0) * uMaxCoC * (uRes.y / 1080.0);
      }
      vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
      void main(){
        vec2 px = 1.0 / uRes;
        vec3 c = texture2D(tD, vUv).rgb;
        float z0 = lin(vUv);
        if (uDofOn > 0.5) {
          float rad = cocOf(z0, vUv);
          if (rad > 0.6) {
            float rn = ign(gl_FragCoord.xy) * 6.2831853;
            vec3 acc = c; float ws = 1.0;
            for (int i = 0; i < 28; i++) {
              float fi = float(i), a = fi * 2.39996323 + rn, r = sqrt((fi + 0.5) / 28.0) * rad;
              vec2 uv = vUv + vec2(cos(a), sin(a)) * r * px;
              float zs = lin(uv), cs = cocOf(zs, uv);
              float w = (zs < z0 - 0.5) ? smoothstep(r * 0.6, r + 0.5, cs) : 1.0;
              acc += texture2D(tD, uv).rgb * w; ws += w;
            }
            c = acc / ws;
          }
        }
        if (uSharp > 0.0) { vec3 nb = (texture2D(tD, vUv + vec2(px.x, 0.0)).rgb + texture2D(tD, vUv - vec2(px.x, 0.0)).rgb + texture2D(tD, vUv + vec2(0.0, px.y)).rgb + texture2D(tD, vUv - vec2(0.0, px.y)).rgb) * 0.25;
          float foc = 1.0 - clamp(cocOf(z0, vUv) / 3.0, 0.0, 1.0); c += (texture2D(tD, vUv).rgb - nb) * uSharp * foc; }
        if (uAoOn > 0.5) { float ao = texture2D(tAO, vUv).r; c *= ao * mix(vec3(1.0), vec3(0.90, 0.95, 1.08), 1.0 - ao); }
        if (uBloomOn > 0.5) { vec3 b = texture2D(tB, vUv).rgb; c += b * uBloomK * vec3(1.0, 0.93, 0.82); }
        // razvrstitev igre (kot njen sestavljalnik): ton, sence/svetlobe, nasičenost, kontrast, gama
        c *= uTint; c *= mix(uShT, uHiT, smoothstep(0.12, 0.72, lm(c)));
        float l = lm(c); c = mix(vec3(l), c, uSat); c = (c - 0.5) * uCon + 0.5; c = pow(max(c, vec3(0.0)), vec3(uGam));
        // naša razvrstitev: filmska ramena, S-krivulja, hladne sence in tople svetlobe, nasičenost, vinjeta
        c *= uExp; c = mix(c, aces(c), uTone);
        c = mix(c, c * c * (3.0 - 2.0 * c), uCon2);
        l = lm(c); c *= mix(uShT2, uHiT2, smoothstep(0.08, 0.80, l));
        l = lm(c); float mxx = max(c.r, max(c.g, c.b)), mnn = min(c.r, min(c.g, c.b)); float vib = 1.0 + (1.0 - (mxx - mnn) / max(mxx, 1e-3)) * 0.12;
        c = mix(vec3(l), c, uSat2 * vib);
        vec2 q = vUv - 0.5; c *= 1.0 - uVig2 * dot(q, q) * 1.8;
        c += (ign(gl_FragCoord.xy + 17.0) - 0.5) / 255.0;
        gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
      }`, cU);
    const quad = new T.Mesh(new T.PlaneGeometry(2, 2), comp); quad.frustumCulled = false;
    const sc = new T.Scene(); sc.add(quad);
    ST.mesh = { ao, blur, bright, b1: mkBlur(), b2: mkBlur(), b3: mkBlur(), b4: mkBlur(), comp, quad, sc, cam: new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), depthMat: new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, side: T.DoubleSide }) };
  }
  function ensureRT(w, h) {
    const r = ST.rt;
    if (r && r.w === w && r.h === h) return r;
    if (r) for (const k of ['depth', 'aoA', 'aoB', 'bA', 'bB']) r[k].dispose();
    const o = { minFilter: T.LinearFilter, magFilter: T.LinearFilter, format: T.RGBAFormat, depthBuffer: false, stencilBuffer: false };
    const aw = Math.max(1, w >> 1), ah = Math.max(1, h >> 1), bw = Math.max(1, w >> 2), bh = Math.max(1, h >> 2);
    ST.rt = { w, h, aw, ah, bw, bh,
      depth: new T.WebGLRenderTarget(w, h, { minFilter: T.NearestFilter, magFilter: T.NearestFilter, format: T.RGBAFormat, type: T.UnsignedByteType, depthBuffer: true, stencilBuffer: false }),
      aoA: new T.WebGLRenderTarget(aw, ah, o), aoB: new T.WebGLRenderTarget(aw, ah, o), bA: new T.WebGLRenderTarget(bw, bh, o), bB: new T.WebGLRenderTarget(bw, bh, o) };
    return ST.rt;
  }
  function pass(orig, mat, target) { ST.mesh.quad.material = mat; R.setRenderTarget(target); orig.call(R, ST.mesh.sc, ST.mesh.cam); }

  function composite(orig, postScene) {
    const M = ST.mesh, gu = postScene.children[0].material.uniforms, game = Render.scene, cam = Render.camera, O = ST.o;
    R.getDrawingBufferSize(v2); const w = v2.x | 0, h = v2.y | 0, rt = ensureRT(w, h);
    const colorTex = gu.tD.value;
    // 1. globina (celoten prizor z materialom globine; nepolne reči se skrijejo)
    const hid = [];
    game.traverse((o) => { if (o.visible && (o.isPoints || o.isLine || o.isSprite || (o.isMesh && o.material && !Array.isArray(o.material) && o.material.transparent && o.material.depthWrite === false) || (o.isMesh && o.material && o.material.isShaderMaterial && o.material.transparent))) { hid.push(o); o.visible = false; } });
    const cc = new T.Color(); R.getClearColor(cc); const ca = R.getClearAlpha();
    game.overrideMaterial = M.depthMat; const au = R.shadowMap.autoUpdate; R.shadowMap.autoUpdate = false;
    R.setClearColor(0xffffff, 1); R.setRenderTarget(rt.depth); R.clear(true, true, false); orig.call(R, game, cam);
    game.overrideMaterial = null; R.shadowMap.autoUpdate = au; R.setClearColor(cc, ca); for (const o of hid) o.visible = true;
    if (ST.grab) {   // (razprševanje po zaslonu: globina in barva tega okvirja v JS)
      const dp = new Uint8Array(w * h * 4); R.readRenderTargetPixels(rt.depth, 0, 0, w, h, dp);
      if (!rt.copy || rt.copy.width !== w) { if (rt.copy) rt.copy.dispose(); rt.copy = new T.WebGLRenderTarget(w, h, { minFilter: T.NearestFilter, magFilter: T.NearestFilter, format: T.RGBAFormat, depthBuffer: false }); }
      if (!M.copy) M.copy = mk('uniform sampler2D tD; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tD, vUv).rgb, 1.0); }', { tD: { value: null } });
      M.copy.uniforms.tD.value = colorTex; pass(orig, M.copy, rt.copy); const cp = new Uint8Array(w * h * 4); R.readRenderTargetPixels(rt.copy, 0, 0, w, h, cp);
      ST.grabbed = { w, h, depth: dp, color: cp, near: cam.near, far: cam.far, fov: cam.fov, aspect: cam.aspect, mw: cam.matrixWorld.clone(), pos: cam.position.clone() };
    }
    const common = [M.ao, M.blur, M.comp];
    for (const m of common) { m.uniforms.tDepth.value = rt.depth.texture; m.uniforms.uNear.value = cam.near; m.uniforms.uFar.value = cam.far; }
    // 2. okluzija (pol ločljivosti) + dvakrat bilateralno mehčanje
    if (O.ao.on) {
      const U = M.ao.uniforms, th = Math.tan(cam.fov * Math.PI / 360); U.uRes.value.set(rt.aw, rt.ah); U.uTan.value.set(th * cam.aspect, th); U.uProj.value.copy(cam.projectionMatrix); U.uRadius.value = O.ao.radius; U.uInt.value = O.ao.intensity;
      pass(orig, M.ao, rt.aoA);
      for (const [from, to, dx, dy] of [[rt.aoA, rt.aoB, 1, 0], [rt.aoB, rt.aoA, 0, 1], [rt.aoA, rt.aoB, 1.7, 0], [rt.aoB, rt.aoA, 0, 1.7]]) { const bu = M.blur.uniforms; bu.tI.value = from.texture; bu.uDir.value.set(dx / rt.aw, dy / rt.ah); pass(orig, M.blur, to); }
    }
    // 3. sijaj: svetle površine v četrtini ločljivosti, dvakrat zamegljene
    if (O.bloom.on) {
      M.bright.uniforms.tD.value = colorTex; M.bright.uniforms.uPx.value.set(1 / w, 1 / h); M.bright.uniforms.uThr.value = O.bloom.thr; pass(orig, M.bright, rt.bA);
      [[M.b1, rt.bA, rt.bB, 1, 0], [M.b2, rt.bB, rt.bA, 0, 1], [M.b3, rt.bA, rt.bB, 2.4, 0], [M.b4, rt.bB, rt.bA, 0, 2.4]].forEach(([m, from, to, x, y]) => { m.uniforms.tD.value = from.texture; m.uniforms.uDir.value.set(x / rt.bw, y / rt.bh); pass(orig, m, to); });
    }
    // 4. sestavljanje na zaslon
    const U = M.comp.uniforms;
    U.tD.value = colorTex; U.tAO.value = rt.aoA.texture; U.tB.value = rt.bA.texture; U.uRes.value.set(w, h);
    for (const k of ['uTint', 'uShT', 'uHiT']) U[k].value.copy(gu[k].value);
    for (const k of ['uSat', 'uCon', 'uGam']) U[k].value = gu[k].value;
    // žarišče: razdalja do avta (ali vrednost iz opts), vodoravni pas ostrine na avtu
    let fd = typeof O.dof.focus === 'number' ? O.dof.focus : 40, fy = 0.4;
    const P = window.__game && window.__game.race && window.__game.race.player;
    if (P && O.dof.focus === 'car') { v3.set(P.x, (P.y || 0) + 0.6, P.z); const pv = v3.clone().applyMatrix4(cam.matrixWorldInverse); fd = Math.max(5, -pv.z); pv.applyMatrix4(cam.projectionMatrix); fy = Math.min(0.9, Math.max(0.1, pv.y * 0.5 + 0.5)); }
    else if (O.dof.focusY != null) fy = O.dof.focusY;
    U.uFocus.value = fd; U.uFocusY.value = fy; U.uAp.value = O.dof.aperture; U.uMaxCoC.value = O.dof.maxPx; U.uDead.value = O.dof.dead; U.uTilt.value = O.dof.tilt; U.uDofOn.value = O.dof.on ? 1 : 0; U.uAoOn.value = O.ao.on ? 1 : 0;
    const G = O.grade; U.uSharp.value = G.sharp; U.uExp.value = G.exp; U.uTone.value = G.tone; U.uCon2.value = G.con; U.uSat2.value = G.sat; U.uShT2.value.set(...G.shT); U.uHiT2.value.set(...G.hiT); U.uVig2.value = G.vig; U.uBloomK.value = O.bloom.k; U.uBloomOn.value = O.bloom.on ? 1 : 0;
    M.quad.material = M.comp; R.setRenderTarget(null); orig.call(R, M.sc, M.cam);
  }

  /* ---------------- kavelj na renderer.render ---------------- */
  function hook() {
    if (ST.hooked) return; ST.hooked = true;
    const orig = R.render; ST.orig = orig;
    R.render = function (scene, camera) {
      if (!ST.on) return orig.call(this, scene, camera);
      const game = Render.scene;
      if (scene === game) { prepareFrame(camera); return orig.call(this, scene, camera); }
      if (this.getRenderTarget() === null && camera && camera.isOrthographicCamera && scene.children.length === 1 && scene.children[0].material && scene.children[0].material.uniforms && scene.children[0].material.uniforms.tD && scene.children[0].material.uniforms.uSat) {
        return composite(orig, scene);
      }
      return orig.call(this, scene, camera);
    };
  }

  /* ---------------- javni vmesnik ---------------- */
  async function apply(opts) {
    ST.o = merge(merge(DEF, PRESETS[(opts && opts.preset) || 'day'] || {}), opts || {});
    if (!ST.lights) saveLights();
    if (!ST.mesh.comp) buildPost();
    window.__slog.props && window.__slog.props.clear();
    const n = patchAll();
    SU.uGrass.value = ST.o.surf.grass; SU.uAsph.value = ST.o.surf.asphalt; SU.uConc.value = ST.o.surf.concrete; SU.uGrunge.value = ST.o.surf.grunge;
    hook(); ST.on = true; SU.uOn.value = 1;
    let np = 0; const Pl = window.__game.race.player;
    if (ST.o.scatter && window.__slog.props) { ST.grab = true; Render.snapshot(Pl, 'chase', ST.o.scatterRes || 640); ST.grab = false; }   // (pred rekviziti: tla boksov in gume ne zakrijejo trave)
    if (ST.o.props && window.__slog.props) np += window.__slog.props.place(ST.o.props);
    if (ST.o.scatter && window.__slog.props) np += window.__slog.props.scatter(ST.o.scatter);
    patchAll();
    return { patched: n, mats: ST.mats.size, props: np };
  }
  function enable(on) {
    ST.on = !!on; SU.uOn.value = on ? 1 : 0;
    for (const g of ST.added) g.visible = !!on;
    if (!on) restoreLights();
  }
  function restore() {
    ST.on = false; restoreLights();
    if (ST.orig) { R.render = ST.orig; ST.hooked = false; }
    for (const [m, s] of ST.mats) { m.onBeforeCompile = s.obc || (() => { }); if (s.key) m.customProgramCacheKey = s.key; else delete m.customProgramCacheKey; m.needsUpdate = true; }
    ST.mats.clear();
    for (const g of ST.added) { if (g.parent) g.parent.remove(g); }
    ST.added.length = 0;
  }
  window.__slog = { apply, enable, restore, ST, SU, merge, DEF };
})();
