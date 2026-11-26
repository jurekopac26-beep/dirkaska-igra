/* =====================================================================
   WORLD — plasti tal (Grafika AAA, SR3'; docs/grafika-aaa.md): the ground of a real track in up to two of four layers per vertex — grass,
   earth, gravel and rock — instead of the one grass picture under the vertex colours.
   - The layers' shares come from ESA WorldCover 2021 (10 m cells), baked by tools/proga-podatki.py --plasti onto the track's def.lc grid
     (16 m): one character a cell (the dominant layer, the second and its share 0, 1/6, 2/6 or 3/6). Rock only where WorldCover shows bare
     ground; slope is not used (an assumption written down in docs/proge/<id>.md).
   - Every vertex gets the cells' shares bilinearly, of which the two largest are kept (a vec4 attribute `plast`, Uint8, two non-zero).
   - One 512 px atlas (2 x 2 tiles of 256 px = 14 m, WebGL1), read twice with explicit gradients (no seam where the tile wraps), a soft
     edge between the layers broken by noise; a 128 px picture over ~200 m against the tiles' repeat.
   - NIZKA: anisotropy 2 and one read (the layer that shows most; the other one its average colour).
   - The gate: def.plasti.on (js/tracks/<id>.js), off by default; frozen tracks (test, pending) never. Pilot: Spa (on: 0 until N9).
   Hooks: js/world-spa.js (the terrain tiles' and verges' material) and grassLook in js/world.js (m.userData.plasti, a no-op without it).
   ===================================================================== */
(function () {
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const S = 256;   // one tile, 14 m (the grass picture's scale)

  function decode(P) {   // the cells' characters: '.' + k repeats the last one k + 2 more times
    const v = new Uint8Array(P.nx * P.nz); let k = 0, last = 0;
    for (let p = 0; p < P.w.length && k < v.length; p++) {
      const c = P.w[p];
      if (c === '.') { const n = A64.indexOf(P.w[++p]) + 2; v.fill(last, k, Math.min(v.length, k + n)); k += n; }
      else { last = A64.indexOf(c); v[k++] = last; }
    }
    return v;
  }

  // the atlas' tiles (0 grass: the track's own picture; 1 earth; 2 gravel; 3 rock), tileable; their average colours (0..1)
  function paint(x, ox, oy, seed, kind) {
    const { nrPN, rng, clamp } = API, img = x.createImageData(S, S), d = img.data, r = rng(seed);
    const n1 = nrPN(4, seed + 1), n2 = nrPN(16, seed + 2), n3 = nrPN(48, seed + 3);
    let sr = 0, sg = 0, sb = 0;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const u = i / S, v = j / S, a = n1(u, v), b = n2(u, v), c = n3(u, v), o = (j * S + i) * 4;
      let R, G, B;
      if (kind === 1) {   // earth: the brown floor of the woods, needles and humus, darker hollows
        const k = 0.78 + a * 0.2 + b * 0.18 + c * 0.12 + (r() - 0.5) * 0.14; R = 124 * k; G = 92 * k; B = 66 * k;
      } else if (kind === 2) {   // gravel: grey-blue slate and limestone chips in fine dust
        const k = 0.8 + b * 0.16 + c * 0.22 + (r() - 0.5) * 0.24; R = 146 * k; G = 142 * k; B = 134 * k;
      } else {   // rock: slate in tilted beds, lighter and darker
        const bed = Math.sin((v * 7 + u * 2 + a * 1.6) * Math.PI * 2) * 0.5 + 0.5, k = 0.72 + bed * 0.16 + b * 0.16 + c * 0.1 + (r() - 0.5) * 0.08;
        R = 120 * k; G = 118 * k; B = 114 * k;
      }
      d[o] = clamp(R, 0, 255); d[o + 1] = clamp(G, 0, 255); d[o + 2] = clamp(B, 0, 255); d[o + 3] = 255; sr += d[o]; sg += d[o + 1]; sb += d[o + 2];
    }
    x.putImageData(img, ox, oy);
    x.save(); x.beginPath(); x.rect(ox, oy, S, S); x.clip();
    const wrap = (px, py, f) => { for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) f(ox + px + a * S, oy + py + b * S); };   // (across the edges: tileable)
    if (kind === 1) {   // needles and twigs, a few pebbles
      x.lineWidth = 1;
      for (const [st, n, len] of [['rgba(150,90,56,0.35)', 700, 3], ['rgba(84,60,42,0.35)', 200, 5], ['rgba(186,150,110,0.3)', 220, 2]]) {
        x.strokeStyle = st; x.beginPath();
        for (let k = 0; k < n; k++) { const px = r() * S, py = r() * S, an = r() * Math.PI, l = len * (0.6 + r() * 0.8); wrap(px, py, (qx, qy) => { x.moveTo(qx, qy); x.lineTo(qx + Math.cos(an) * l, qy + Math.sin(an) * l); }); }
        x.stroke(); }
    } else if (kind === 2) {   // chips, each a small polygon with a shadowed side
      for (let k = 0; k < 1400; k++) { const px = r() * S, py = r() * S, s = 1 + r() * 2.6, g = 105 + r() * 90, bl = r() < 0.4 ? 10 : 0;
        x.fillStyle = 'rgb(' + Math.round(g) + ',' + Math.round(g + bl * 0.3) + ',' + Math.round(g - 8 + bl) + ')';
        wrap(px, py, (qx, qy) => { x.beginPath(); x.moveTo(qx, qy - s); x.lineTo(qx + s, qy); x.lineTo(qx + s * 0.3, qy + s); x.lineTo(qx - s, qy + s * 0.2); x.closePath(); x.fill(); }); }
      x.fillStyle = 'rgba(60,58,54,0.35)'; for (let k = 0; k < 500; k++) { const px = r() * S, py = r() * S; wrap(px, py, (qx, qy) => x.fillRect(qx, qy, 1, 1)); }
    } else if (kind === 3) {   // cracks
      x.strokeStyle = 'rgba(52,50,48,0.6)'; x.lineWidth = 1;
      for (let k = 0; k < 40; k++) { const pts = [[r() * S, r() * S]];
        for (let s = 0; s < 6; s++) { const [px, py] = pts[s]; pts.push([px + (r() - 0.5) * 18, py + (r() - 0.3) * 10]); }
        x.beginPath(); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) pts.forEach(([px, py], s) => x[s ? 'lineTo' : 'moveTo'](ox + px + a * S, oy + py + b * S));
        x.stroke(); }
    }
    x.restore();
    const n = S * S * 255; return [sr / n, sg / n, sb / n];
  }

  function textures(grass, tier) {
    const c = document.createElement('canvas'); c.width = c.height = 2 * S; const x = c.getContext('2d');
    x.drawImage(grass.image, 0, 0, S, S);
    const avg = [grass.avgCol || [0.35, 0.53, 0.23], paint(x, S, 0, 7301, 1), paint(x, 0, S, 7302, 2), paint(x, S, S, 7303, 3)];
    const atl = new THREE.CanvasTexture(c); atl.wrapS = atl.wrapT = THREE.ClampToEdgeWrapping; atl.anisotropy = tier <= 0 ? 2 : 4;   // (H5: at most 2 on NIZKA)
    atl.grassPic = true; atl.avgCol = avg[0];   // (still the grass for grassLook and the far ground's average)
    const M = 128, m = document.createElement('canvas'); m.width = m.height = M; const y = m.getContext('2d'), img = y.createImageData(M, M), d = img.data;
    const a = API.nrPN(3, 7311), b = API.nrPN(7, 7312), e = API.nrPN(16, 7313), f = API.nrPN(32, 7314);
    for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) { const u = i / M, v = j / M, o = (j * M + i) * 4;
      d[o] = Math.round((a(u, v) * 0.6 + b(u, v) * 0.4) * 255); d[o + 1] = Math.round((e(u, v) * 0.55 + f(u, v) * 0.45) * 255); d[o + 2] = 0; d[o + 3] = 255; }
    y.putImageData(img, 0, 0);
    const mac = new THREE.CanvasTexture(m); mac.wrapS = mac.wrapT = THREE.RepeatWrapping; mac.anisotropy = 1;
    return { atl, mac, avg };
  }

  const GLSL_V = ['attribute vec4 plast; varying vec4 vPl; varying vec2 vPw;'].join('\n');
  const GLSL_F = [
    'varying vec4 vPl; varying vec2 vPw; uniform sampler2D uPlMac; uniform float uPlOne; uniform vec3 uPlAvg[4];',
    'vec4 plFirst(vec4 e) { return e.x > 0.5 ? vec4(1.0, 0.0, 0.0, 0.0) : e.y > 0.5 ? vec4(0.0, 1.0, 0.0, 0.0) : e.z > 0.5 ? vec4(0.0, 0.0, 1.0, 0.0) : vec4(0.0, 0.0, 0.0, 1.0); }',
    'vec4 plTex(float k, vec2 f, vec2 gx, vec2 gy) { vec2 o = vec2(mod(k, 2.0), 1.0 - floor(k * 0.5)) * 0.5;',   // (the canvas' rows upside down: flipY)
    '#ifdef PL_GRAD',
    '  return texture2DGradEXT(map, o + f, gx, gy);',
    '#else',
    '  return texture2D(map, o + f);',
    '#endif',
    '}',
    'vec3 plAvgOf(float k) { return uPlAvg[0] * float(k < 0.5) + uPlAvg[1] * float(abs(k - 1.0) < 0.5) + uPlAvg[2] * float(abs(k - 2.0) < 0.5) + uPlAvg[3] * float(k > 2.5); }'
  ].join('\n');
  const GLSL_MAP = [
    '#ifdef USE_MAP',
    '{ vec4 w = vPl; float m1 = max(max(w.x, w.y), max(w.z, w.w));',
    '  vec4 e1 = plFirst(vec4(greaterThanEqual(w, vec4(m1 - 1e-4)))), q = w - e1 * 4.0; float m2 = max(max(q.x, q.y), max(q.z, q.w));',
    '  vec4 e2 = plFirst(vec4(greaterThanEqual(q, vec4(m2 - 1e-4))));',
    '  float i1 = dot(e1, vec4(0.0, 1.0, 2.0, 3.0)), i2 = dot(e2, vec4(0.0, 1.0, 2.0, 3.0)), w1 = dot(w, e1), w2 = max(dot(w, e2), 0.0);',
    '  float lo = min(i1, i2), hi = max(i1, i2), wh = (i1 > i2 ? w1 : w2) / max(w1 + w2, 1e-4);',   // (the pair in the layers' order: no jump where the larger one changes)
    '  vec2 mc = texture2D(uPlMac, vPw * 0.005).rg, ed = texture2D(uPlMac, vPw * 0.061 + 0.37).rg;',
    '  float b = clamp((wh - 0.5) * 2.4 + 0.5 + (ed.y - 0.5) * 0.9 + (ed.x - 0.5) * 0.3, 0.0, 1.0);',   // the soft, ragged edge between the two
    '  vec2 f = fract(vUv) * 0.5, gx = dFdx(vUv) * 0.5, gy = dFdy(vUv) * 0.5; float h = clamp(max(length(gx), length(gy)) * 0.5, 0.001, 0.12);',
    '  f = clamp(f, vec2(h), vec2(0.5 - h));',   // (not into the next tile's mips)
    '  vec3 col;',
    '  if (uPlOne > 0.5) { bool up = b >= 0.5; vec3 t = plTex(up ? hi : lo, f, gx, gy).rgb; col = mix(t, plAvgOf(up ? lo : hi), up ? 1.0 - b : b); }',
    '  else col = mix(plTex(lo, f, gx, gy).rgb, plTex(hi, f, gx, gy).rgb, b);',
    '  float wg = lo < 0.5 ? 1.0 - b : 0.0;',
    '#ifdef USE_COLOR',
    '  vec3 vc = max(vColor, vec3(1e-3)); col *= mix(vec3(dot(vc, vec3(0.3, 0.59, 0.11))) / vc, vec3(1.0), wg);',   // (the vertex colours tint the grass; the other layers keep only their light)
    '#endif',
    '  col *= 0.9 + 0.2 * mc.x;',   // (the large scale: against the tiles' repeat)
    '  vec4 texelColor = mapTexelToLinear(vec4(col, 1.0)); diffuseColor *= texelColor; }',
    '#endif'
  ].join('\n');

  API.plasti = {
    // the gate: a real track's def.plasti with on: 1 (not the frozen ones)
    gate(def) { const P = def && !def.test && !def.pending && def.plasti; return P && P.on && P.w ? P : null; },
    prep(def, tier) {
      const P = this.gate(def); if (!P) return null;
      return { P, cells: decode(P), tier: tier == null ? 2 : tier };
    },
    // the shares of the four layers at (x, z), two at most, 0..255 (out of the grid: grass)
    at(S0, x, z, o) {
      const P = S0.P, C = S0.cells, u = (x - P.x0) / P.cell - 0.5, v = (z - P.z0) / P.cell - 0.5, i0 = Math.floor(u), j0 = Math.floor(v), fu = u - i0, fv = v - j0;
      const w = [0, 0, 0, 0];
      for (let b = 0; b < 2; b++) for (let a = 0; a < 2; a++) {
        const i = Math.max(0, Math.min(P.nx - 1, i0 + a)), j = Math.max(0, Math.min(P.nz - 1, j0 + b)), k = (a ? fu : 1 - fu) * (b ? fv : 1 - fv);
        const out = u < -1 || v < -1 || u > P.nx || v > P.nz, c = out ? 0 : C[j * P.nx + i], q = (c & 3) / 6;
        w[c >> 4] += k * (1 - q); w[(c >> 2) & 3] += k * q;
      }
      let a1 = 0; for (let l = 1; l < 4; l++) if (w[l] > w[a1]) a1 = l;
      let a2 = a1 ? 0 : 1; for (let l = 0; l < 4; l++) if (l !== a1 && w[l] > w[a2]) a2 = l;
      const s = w[a1] + w[a2]; o[0] = o[1] = o[2] = o[3] = 0; o[a1] = Math.round(w[a1] / s * 255); o[a2] = 255 - o[a1]; return o;
    },
    geo(S0, g) {   // the attribute on a geometry in world coordinates
      const p = g.attributes.position, n = p.count, a = new Uint8Array(n * 4), o = [0, 0, 0, 0];
      for (let k = 0; k < n; k++) { this.at(S0, p.getX(k), p.getZ(k), o); a[k * 4] = o[0]; a[k * 4 + 1] = o[1]; a[k * 4 + 2] = o[2]; a[k * 4 + 3] = o[3]; }
      g.setAttribute('plast', new THREE.BufferAttribute(a, 4, true));
    },
    // the material: the atlas for its map, the shader through grassLook's hook (js/world.js); the textures are the world's own (disposed with it)
    mat(S0, m, own) {
      const T = textures(m.map, S0.tier); own(T.atl); own(T.mac); m.map = T.atl;
      m.extensions = { derivatives: true, shaderTextureLOD: true };
      const one = S0.tier <= 0 ? 1 : 0, avg = T.avg.map(c => new THREE.Vector3(c[0], c[1], c[2]));
      m.userData.plMac = T.mac;   // (Render finds a world's pictures in its materials' userData)
      m.userData.plasti = (sh, rr) => {
        const grad = !!rr && (rr.capabilities.isWebGL2 || !!rr.extensions.get('EXT_shader_texture_lod'));
        sh.uniforms.uPlMac = { value: T.mac }; sh.uniforms.uPlOne = { value: one }; sh.uniforms.uPlAvg = { value: avg };
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + GLSL_V).replace('#include <begin_vertex>', '#include <begin_vertex>\nvPl = plast; vPw = (modelMatrix * vec4(position, 1.0)).xz;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <map_pars_fragment>', '#include <map_pars_fragment>\n' + (grad ? '#define PL_GRAD\n' : '') + GLSL_F).replace('#include <map_fragment>', GLSL_MAP);
      };
      m.userData.plastiKey = 'P' + one;
      m.needsUpdate = true;
    }
  };
})();
