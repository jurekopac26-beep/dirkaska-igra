/* =========================================================================
   RENDER — the colour grade baked at load for the weak phones (AAA H1″, docs/grafika-aaa.md on raziskava/grafika-aaa: »Barvna korekcija za
   šibke telefone, pečena ob nalaganju«). Chosen on the Odločitve page (id grafika-aaa-h1): option 1 »kot Visoka«
   (MOZNOST 1; the user's decision 26. 11. 2026 at ~19.47); the pictures take the options through window.BARVE_H1 (0 none, 1 »kot Visoka«, 2 »živahnejša«).
   On 'normal' (the post pass is off: no grade per pixel) on a chosen real track (IZBRANE; not test: true nor pending: true, those stay as
   they are: CLAUDE.md) the world's colours are graded once, when the world is built: the materials' colours (a textured one by its
   texture's mean colour: a multiplier, the texture itself is shared and stays), the vertex colours, the colour uniforms of the world's own
   shaders and the fog's colour (the sky, the clear colour and the sky in the water follow it). The same grade the post pass gives on
   'high' (js/render.js initPost: tint, split toning by luminance, saturation, contrast), but before the lighting, not after it (an
   approximation). The cars (not in world.root), the showroom and the tone mapping stay as they are; 'high' keeps its post pass and no bake
   (switching to it puts the colours back). During a race nothing runs: no code per frame (the fog's colour is graded where Render writes
   it, js/render.js applyTheme, at load and when the weather changes).
   Without a hook in js/render.js: Render's public buildWorld, setAtmos and applySettings wrapped here (N8: Render.ext.barve).
   Render.ext.barve: { grade(r, g, b, G), bake(), unbake(), info, MOZNOSTI }
   ========================================================================= */
(function () {
  'use strict';
  if (typeof Render === 'undefined' || !Render.ext) return;
  // the grades: the post pass's (Spa, Belgija: the default theme's, js/render.js THEMES.lake and SPLIT.lake; uCon 1.04)
  const BASE = { tint: [1.02, 1.0, 0.97], sh: [0.97, 1.0, 1.05], hi: [1.03, 1.0, 0.96], sat: 1.1, con: 1.04 };
  const more = (G, k, sat, con) => ({ tint: G.tint.map(v => 1 + (v - 1) * k), sh: G.sh.map(v => 1 + (v - 1) * k), hi: G.hi.map(v => 1 + (v - 1) * k), sat, con });
  const MOZNOSTI = { 1: BASE, 2: more(BASE, 1.5, 1.2, 1.08) };
  const IZBRANE = { spa: true };   // (the real tracks graded: the prototype's one, Spa, Belgija)
  const MOZNOST = 1;   // (the chosen option: 1 »kot Visoka«, the user's decision 26. 11. 2026 at ~19.47, #382)
  const opt = () => { const w = typeof window !== 'undefined' && window.BARVE_H1; return w != null ? +w : MOZNOST; };

  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const clamp = (x) => x < 0 ? 0 : x > 1 ? 1 : x;
  // one colour (0..1) through the grade G, as the post pass does it (c *= tint; c *= mix(sh, hi, smoothstep(0.12, 0.72, lum)); saturation;
  // contrast round 0.5); out: [r, g, b] (into o)
  function grade(r, g, b, G, o) {
    o = o || [0, 0, 0];
    r *= G.tint[0]; g *= G.tint[1]; b *= G.tint[2];
    let l = r * 0.299 + g * 0.587 + b * 0.114; const k = sstep(0.12, 0.72, l);
    r *= G.sh[0] + (G.hi[0] - G.sh[0]) * k; g *= G.sh[1] + (G.hi[1] - G.sh[1]) * k; b *= G.sh[2] + (G.hi[2] - G.sh[2]) * k;
    l = r * 0.299 + g * 0.587 + b * 0.114; r = l + (r - l) * G.sat; g = l + (g - l) * G.sat; b = l + (b - l) * G.sat;
    o[0] = clamp((r - 0.5) * G.con + 0.5); o[1] = clamp((g - 0.5) * G.con + 0.5); o[2] = clamp((b - 0.5) * G.con + 0.5);
    return o;
  }

  // a texture's mean colour (sampled from its picture, 32 x 32; once per texture); null where it cannot be read
  const means = new WeakMap(), cv = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  function mean(t) {
    if (!t || !t.image || !cv) return null;
    if (means.has(t)) return means.get(t);
    let m = null;
    try {
      const im = t.image, N = 32; cv.width = cv.height = N; const x = cv.getContext('2d', { willReadFrequently: true }); x.clearRect(0, 0, N, N); x.drawImage(im, 0, 0, N, N);
      const d = x.getImageData(0, 0, N, N).data; let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
      if (n) m = [r / n / 255, g / n / 255, b / n / 255];
    } catch (e) { m = null; }
    means.set(t, m); return m;
  }

  // what was graded (put back when the next world is not, or on 'high'): [object, key, the original]
  let done = [], fogC = null, settingsQ = 'high', info = { baked: false, ms: 0, mats: 0, cols: 0, unis: 0, opt: 0 };
  const _o = [0, 0, 0];
  function gradeColor(c, G, base) {   // (a THREE.Color graded from base, its original)
    grade(base.r, base.g, base.b, G, _o); c.setRGB(_o[0], _o[1], _o[2]);
  }
  function unbake() {
    for (const [obj, key, orig] of done) { if (key === 'array') { obj.array.set(orig); obj.needsUpdate = true; } else obj[key].copy(orig); }
    done = [];
    if (fogC) { delete fogC.copy; if (fogC._h1raw) fogC.copy(fogC._h1raw); delete fogC._h1raw; }
    fogC = null; info = { baked: false, ms: 0, mats: 0, cols: 0, unis: 0, opt: 0 };
  }
  // the fog's colour: graded where Render writes it (copy); a colour already graded (a clone of it: the storm's, the valley fog's) as it is
  function hookFog(scene, G) {
    const c = scene && scene.fog && scene.fog.color; if (!c) return;
    const orig = Object.getPrototypeOf(c).copy, out = new Set();
    fogC = c;
    c.copy = function (s) {
      orig.call(this, s); const h = this.getHex(); if (out.has(h)) return this;
      this._h1raw = this.clone(); grade(this.r, this.g, this.b, G, _o); this.setRGB(_o[0], _o[1], _o[2]); out.add(this.getHex());
      if (out.size > 64) out.clear();
      return this;
    };
    c.copy(c.clone());
  }
  function bake() {
    const R = Render, w = R.world, sc = R.scene, n = opt(), G = MOZNOSTI[n];
    unbake();
    if (!G || settingsQ !== 'normal' || !w || !w.root) return;
    const T = cur; if (!T || !T.def || T.def.test || T.def.pending || !IZBRANE[T.def.id]) return;
    const t0 = performance.now(), mats = new Set(), cols = new Set();
    w.root.traverse(o => {
      for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) mats.add(m);
      const g = o.geometry, a = g && g.attributes && g.attributes.color; if (a && a.array && !(a.isInterleavedBufferAttribute)) cols.add(a);
    });
    let nm = 0, nu = 0; const seen = new Set();   // (a uniform shared by several materials: graded once)
    for (const m of mats) {
      if (m.color && m.color.isColor) {
        const mc = m.map ? mean(m.map) : null, base = m.color.clone();
        if (mc) {   // (a textured material: its colour times the grade of its texture's mean, over that mean)
          const r = mc[0] * base.r, g = mc[1] * base.g, b = mc[2] * base.b; grade(r, g, b, G, _o);
          m.color.setRGB(r > 1e-3 ? base.r * _o[0] / r : base.r, g > 1e-3 ? base.g * _o[1] / g : base.g, b > 1e-3 ? base.b * _o[2] / b : base.b);
        } else gradeColor(m.color, G, base);
        done.push([m, 'color', base]); nm++;
        const d = m.userData && m.userData.dry; if (d && d.isColor) { const db = d.clone(); d.copy(m.color); done.push([m.userData, 'dry', db]); }   // (the wet road's dry colour, js/render.js applyRoad)
      }
      if (m.uniforms) for (const k in m.uniforms) { const u = m.uniforms[k]; if (u && u.value && u.value.isColor && !seen.has(u.value)) { seen.add(u.value); const b = u.value.clone(); gradeColor(u.value, G, b); done.push([u, 'value', b]); nu++; } }
    }
    for (const a of cols) {
      const A = a.array, s = a.itemSize; if (s < 3) continue; const orig = A.slice(), nrm = a.normalized && !(A instanceof Float32Array) ? (A instanceof Uint8Array ? 255 : 65535) : 1;
      for (let i = 0; i + 2 < A.length; i += s) { grade(A[i] / nrm, A[i + 1] / nrm, A[i + 2] / nrm, G, _o); A[i] = _o[0] * nrm; A[i + 1] = _o[1] * nrm; A[i + 2] = _o[2] * nrm; }
      a.needsUpdate = true; done.push([a, 'array', orig]);
    }
    hookFog(sc, G);
    info = { baked: true, ms: +(performance.now() - t0).toFixed(1), mats: nm, cols: cols.size, unis: nu, opt: n, track: T.def.id };
  }

  // Render's public calls wrapped: the world built (the bake), the season (seasonWorld repaints colours: again after it), the settings
  // (the quality: 'high' puts the colours back)
  let cur = null;
  const bw = Render.buildWorld, sa = Render.setAtmos, ap = Render.applySettings;
  Render.buildWorld = function (track) { unbake(); cur = track; const r = bw.apply(this, arguments); bake(); return r; };
  Render.setAtmos = function () { const was = info.baked; if (was) unbake(); const r = sa.apply(this, arguments); if (was || cur) bake(); return r; };
  Render.applySettings = function (s) { if (s && s.quality) settingsQ = s.quality; const r = ap.apply(this, arguments); if (cur && (info.baked !== (settingsQ === 'normal' && opt() > 0))) bake(); return r; };
  Render.ext.barve = { grade, bake, unbake, get info() { return info; }, MOZNOSTI, IZBRANE };
})();
