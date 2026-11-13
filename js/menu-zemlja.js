/* The Earth of the track step (js/menu.js: a tap on the globe in the head; the mockup's maketa-menija/izbira-proge/zemlja.js, ported).
   It grows out of the globe over the whole screen: the Earth in 3D (three.js r128, js/vendor/three.r128.min.js; the Blue Marble,
   assets/geo/earth.webp), turned to the track shown, all of it in daylight; the moon under the zoom shows the night where it is now
   (sun(): darker and bluer; the head's globe too; remembered: localStorage tdgp-zemlja-noc; the user's wish of 8. 11. 2026). Drag to
   turn it (north stays up, it glides on a little when let go), pinch, the wheel or + and − to come closer, the target to go back to the
   track shown; the arrow keys turn it too. The countries with tracks in the mode (the real ones and those awaiting the choice, as the quick list's flags;
   the test tracks are not on it) are gold (their outlines: GEO.outlines, MENU.globe.outlines), each track a pin in the colour of the
   player's progress (gold, silver, bronze, a tick's green, NEW dark with a light rim), the track shown white and pulsing three times; from
   afar the countries are named (flag, name, the number of tracks), close in the tracks (name, length): only those whose pin is on the
   screen, none over another. A tap on a country or its name colours it, turns the Earth to it and opens its card at the bottom (lying: at
   the side) with its tracks (the quick list's rows, js/menu-izbor.js; one with a single track: that track's card at once, the user's of 12. 11. 2026); a tap on a pin, a track's name or a row the track's card (the quick
   list's: its picture, shape, facts, best, heights, Select and Race!); a tap on the sea closes the card. Back (the phone's: the history, one with
   the quick list's; Esc; the pad's B): the track's card, the country's, then the Earth.
   The battery: it draws only while something moves (a flight, a drag, the glide, the zoom easing, a name fading, the card sliding), the
   screen under it rests while it covers it (o.rest, o.wake); a weak phone (navigator.deviceMemory <= 4 or a texture limit under 4096)
   gets the half-size picture (assets/geo/earth2k.webp); at most 2 pixels per point.
   MenuZemlja.open(o): as MenuIzbor.open (o.root, o.cur, o.list, o.shape, o.heights, o.prog, o.pick, o.race, o.buzz, o.click) and o.from
   (the globe's element, or a function giving it: the Earth grows out of it and goes back into it), o.rest() and o.wake() (the screen under it stops, then moves
   again), o.fail() (no WebGL for it: the quick list instead). close(now), back(), isOpen(), root() (the gamepad's part of the screen),
   depth() (its steps in the history), sun(t) (where the Sun is overhead: [lat, lon]; the head's globe too), night() (the night shown:
   the moon on), _R() (for the tests) */
window.MenuZemlja = (function () {
  'use strict';
  const D = Math.PI / 180, DMIN = 1.5, DMAX = 5.4, DFAR = 3.7, TRACKS_AT = 2.75;
  // the camera's angle: standing 60° (from afar the Earth as wide as the screen), lying narrower (from afar as high as nine tenths of it)
  const FOV_UP = 60, FOV_SIDE = 2 * Math.atan(0.5 / (0.45 * Math.sqrt(DFAR * DFAR - 1))) / (Math.PI / 180);
  const calmQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null, calm = () => !!(calmQ && calmQ.matches);   // (asked each time: the setting may change)
  const I = {
    back: '<svg viewBox="0 0 22 22" aria-hidden="true"><path d="M14 4 7 11l7 7" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>',
    minus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>',
    night: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1Z" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/></svg>',
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6.5" fill="none" stroke="#fff" stroke-width="2.4"/><circle cx="12" cy="12" r="2.2" fill="#ffc629"/><path d="M12 2.5v3.2M12 18.3v3.2M2.5 12h3.2M18.3 12h3.2" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>',
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const wrap = (a) => ((a + 180) % 360 + 360) % 360 - 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // where the Sun is overhead now ([lat, lon]): its declination and the time of day in UTC with the equation of time (NOAA's approximation, ~0.5°)
  function sun(t) {
    t = t || new Date();
    const h = t.getUTCHours() + t.getUTCMinutes() / 60 + t.getUTCSeconds() / 3600, doy = (t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 | 0;
    const g = 2 * Math.PI / 365 * (doy + (h - 12) / 24), c1 = Math.cos(g), s1 = Math.sin(g), c2 = Math.cos(2 * g), s2 = Math.sin(2 * g);
    const dec = 0.006918 - 0.399912 * c1 + 0.070257 * s1 - 0.006758 * c2 + 0.000907 * s2 - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    const eq = 229.18 * (0.000075 + 0.001868 * c1 - 0.032077 * s1 - 0.014615 * c2 - 0.040849 * s2);   // (minutes)
    return [dec / D, ((-15 * (h - 12 + eq / 60)) % 360 + 540) % 360 - 180];
  }

  let o = null, el = null, R = null, K = null, img = null, W = 412, H = 892, SIDE = false, FOV = FOV_UP, PX = 0, TOP = 80, UI = [];
  const IMGS = {};   // (the Earth's pictures, each loaded once a visit: the whole one, the half-size one for a weak phone, the small one if neither comes)
  // the night: off (all of it in daylight) until the moon is switched on; remembered (in memory too: a private window may refuse the storage)
  const NOC = 'tdgp-zemlja-noc'; let nightM = null;
  function night() { if (nightM == null) { try { nightM = localStorage.getItem(NOC) === 'on'; } catch (_) { nightM = false; } } return nightM; }
  function setNight(v) { nightM = !!v; try { if (v) localStorage.setItem(NOC, 'on'); else localStorage.removeItem(NOC); } catch (_) { /* kept in memory */ } }
  const NZ = () => window.MenuIzbor.nazaj;   // (the history of the layers: one with the quick list's)
  function picture(src) {
    if (!IMGS[src]) { const im = new Image(); im.decoding = 'async'; im.src = src; IMGS[src] = im.decode().then(() => im, () => { delete IMGS[src]; return null; }); }
    return IMGS[src];
  }
  // a place on the sphere (three's own sphere: u from 180° W, v from the north) and back
  const vec = (lat, lon) => { const p = (lon + 180) * D, t = (90 - lat) * D; return new THREE.Vector3(-Math.cos(p) * Math.sin(t), Math.cos(t), Math.sin(p) * Math.sin(t)); };
  const ll = (v) => [Math.asin(clamp(v.y, -1, 1)) / D, wrap(Math.atan2(v.z, -v.x) / D - 180)];
  const byId = (id) => o.list.find(t => t.id === id);
  const onEarth = (t) => !!t && !t.test && t.lat != null && t.lon != null;   // (the test tracks leave the game before its release: not on the Earth)

  // the countries with tracks: their tracks, outlines and where the name stands (the middle of its tracks)
  function countries() {
    const by = new Map(), G = window.GEO || { outlines: {} }, M = (window.MENU && window.MENU.globe) || { outlines: {} };
    for (const t of o.list) {
      if (!onEarth(t)) continue;
      const k = t.country || t.name;
      if (!by.has(k)) by.set(k, { name: k, flag: t.flag, ids: [], rings: [].concat(G.outlines[k] || [], M.outlines[k] || []).map(unwrap) });
      by.get(k).ids.push(t.id);
    }
    for (const c of by.values()) { const v = new THREE.Vector3(); c.ids.forEach(id => { const t = byId(id); v.add(vec(t.lat, t.lon)); }); v.normalize(); c.at = v; [c.lat, c.lon] = ll(v); }
    return by;
  }
  // a ring of (lon, lat) with its longitudes made continuous (one across the 180th meridian goes on past it: Russia's east)
  function unwrap(ring) {
    const m = ring.length / 2, X = new Float64Array(m * 2); X[0] = ring[0]; X[1] = ring[1];
    for (let i = 1; i < m; i++) { let x = ring[i * 2]; while (x - X[i * 2 - 2] > 180) x -= 360; while (x - X[i * 2 - 2] < -180) x += 360; X[i * 2] = x; X[i * 2 + 1] = ring[i * 2 + 1]; }
    return X;
  }
  // the Earth's picture with the countries that have tracks gold, the chosen one brighter (drawn again when the choice changes)
  function paint() {
    const c = R.cv, g = c.getContext('2d'), w = c.width, h = c.height;
    if (img) g.drawImage(img, 0, 0, w, h); else { g.fillStyle = '#0d2747'; g.fillRect(0, 0, w, h); }   // (no picture came: the sea alone, the countries on it)
    const path = (rings) => {
      g.beginPath();
      for (const ring of rings) for (const off of [-w, 0, w]) {   // (a country past the picture's edge also on its other side)
        for (let n = 0; n < ring.length; n += 2) { const x = (ring[n] + 180) / 360 * w + off, y = (90 - ring[n + 1]) / 180 * h; if (n) g.lineTo(x, y); else g.moveTo(x, y); }
        g.closePath();
      }
    };
    g.lineJoin = 'round';
    for (const k of R.C.values()) {
      if (!k.rings.length) continue;
      const on = k.name === R.sel;
      path(k.rings);
      g.fillStyle = on ? 'rgba(255, 206, 52, .4)' : 'rgba(255, 190, 30, .27)'; g.fill('evenodd');
      if (on) { g.save(); g.shadowColor = 'rgba(255, 236, 160, .9)'; g.shadowBlur = w / 700; g.lineWidth = w / 1700; g.strokeStyle = '#fff6d6'; g.stroke(); g.restore(); }
      g.lineWidth = w / (on ? 1600 : 2200); g.strokeStyle = on ? '#fff3c4' : '#ffd23a'; g.stroke();
    }
    R.map.needsUpdate = true;
  }

  // the screen's size (each opening and each turn of the phone): lying, the card at the side and the buttons at the left
  function measure() {
    W = Math.max(1, el.clientWidth); H = Math.max(1, el.clientHeight); SIDE = W > H; FOV = SIDE ? FOV_SIDE : FOV_UP; PX = (H / 2) / Math.tan(FOV / 2 * D);
    el.classList.toggle('side', SIDE);
    const b = el.querySelector('.zem-back'), rb = b ? b.getBoundingClientRect() : null, re = el.getBoundingClientRect();
    TOP = rb && rb.height ? rb.bottom - re.top + 12 : 80;
    UI = [...el.querySelectorAll('.zem-zoom')].map(z => { const r = z.getBoundingClientRect(); return [r.left - re.left, r.top - re.top, r.right - re.left, r.bottom - re.top]; });   // (no name under the zoom)
  }
  function build() {
    const T3 = THREE, cv = el.querySelector('canvas');
    const r = new T3.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setSize(W, H, false);
    const scene = new T3.Scene(), cam = new T3.PerspectiveCamera(FOV, W / H, 0.01, 300);
    const weak = (navigator.deviceMemory || 8) <= 4 || r.capabilities.maxTextureSize < 4096, tc = document.createElement('canvas'); tc.width = weak ? 2048 : 4096; tc.height = tc.width / 2;
    const map = new T3.CanvasTexture(tc); map.anisotropy = Math.min(8, r.capabilities.getMaxAnisotropy()); map.encoding = T3.sRGBEncoding;
    r.outputEncoding = T3.sRGBEncoding;
    const earth = new T3.Mesh(new T3.SphereGeometry(1, 128, 64), new T3.MeshPhongMaterial({ map, specular: new T3.Color(0x10161f), shininess: 30 }));
    // day and night (sun(): where the Sun is overhead now; nt: the moon on, 1): the night side darker and bluer, a soft edge between (in
    // linear light: after the sRGB output about the head's globe's 0.2, 0.24, 0.38)
    const U = { sunL: { value: new T3.Vector3(0, 0, 1) }, nt: { value: night() ? 1 : 0 } };
    earth.material.onBeforeCompile = (sh) => {
      sh.uniforms.sunL = U.sunL; sh.uniforms.nt = U.nt;
      sh.vertexShader = 'varying vec3 vLocalN;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vLocalN = position;');
      sh.fragmentShader = 'uniform vec3 sunL;\nuniform float nt;\nvarying vec3 vLocalN;\n' + sh.fragmentShader.replace('#include <tonemapping_fragment>',
        '{ float day = mix(1.0, smoothstep(-0.16, 0.1, dot(normalize(vLocalN), sunL)), nt); gl_FragColor.rgb *= mix(vec3(0.045, 0.06, 0.13), vec3(1.0), day); }\n#include <tonemapping_fragment>');
    };
    const group = new T3.Group(); group.add(earth); scene.add(group);
    // the air round it: brighter towards its edge, and a thin bright rim on the Earth's edge
    const RIM = 'varying vec3 n; varying vec3 v; void main(){ vec4 w = modelViewMatrix * vec4(position, 1.0); n = normalize(normalMatrix * normal); v = normalize(-w.xyz); gl_Position = projectionMatrix * w; }';
    scene.add(new T3.Mesh(new T3.SphereGeometry(1.06, 96, 48), new T3.ShaderMaterial({ side: T3.BackSide, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, vertexShader: RIM,
      fragmentShader: 'varying vec3 n; varying vec3 v; void main(){ float f = pow(clamp(-dot(n, v) / 0.33, 0.0, 1.0), 2.2); gl_FragColor = vec4(0.38, 0.64, 1.0, 1.0) * f * 0.85; }' })));
    scene.add(new T3.Mesh(new T3.SphereGeometry(1.003, 96, 48), new T3.ShaderMaterial({ blending: T3.AdditiveBlending, transparent: true, depthWrite: false, vertexShader: RIM,
      fragmentShader: 'varying vec3 n; varying vec3 v; void main(){ float f = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 5.0); gl_FragColor = vec4(0.45, 0.7, 1.0, 1.0) * f * 0.6; }' })));
    // the stars: three sizes, a little colour
    for (const [n, sz, a] of [[700, 1.1, 0.55], [220, 1.8, 0.75], [50, 2.6, 0.9]]) {
      const p = new Float32Array(n * 3), col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const u = Math.random() * 2 - 1, f = Math.random() * 2 * Math.PI, s = Math.sqrt(1 - u * u), q = 0.75 + Math.random() * 0.25, tint = Math.random();
        p.set([s * Math.cos(f) * 80, u * 80, s * Math.sin(f) * 80], i * 3); col.set([q * (tint < 0.2 ? 0.8 : 1), q * 0.92, q * (tint > 0.8 ? 0.82 : 1)], i * 3);
      }
      const gm = new T3.BufferGeometry(); gm.setAttribute('position', new T3.BufferAttribute(p, 3)); gm.setAttribute('color', new T3.BufferAttribute(col, 3));
      scene.add(new T3.Points(gm, new T3.PointsMaterial({ size: sz, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: a, depthWrite: false })));
    }
    scene.add(new T3.AmbientLight(0xffffff, 0.74));
    const light = new T3.DirectionalLight(0xffffff, 0.6); light.position.set(-1.2, 1.1, 1.6); scene.add(light);
    const h = home();
    R = { r, scene, cam, group, earth, map, U, cv: tc, C: null, sel: null, lat: h[0], lon: h[1], d: 7.5, dT: DFAR, off: 0, offT: 0, ntT: U.nt.value, weak,
      vlat: 0, vlon: 0, fly: null, drag: null, pts: new Map(), last: performance.now(), hint: true, raf: 0, n: 0, card: false, tc: null, els: [], tex: '' };
    R.C = countries();
  }
  // the track shown: its place (a test track too, if it has one), else the middle of Europe (most of the tracks)
  function home() { const t = byId(o.cur); return t && t.lat != null && t.lon != null ? [t.lat, t.lon] : [47, 10]; }
  function start() { const h = home(); R.fly = { from: [R.lat, R.lon, 7.5], to: [h[0], h[1], DFAR], t0: performance.now(), dur: calm() ? 1 : 1100 }; kick(); }

  // the pins and the names (the names buttons: the gamepad and the keys reach them; a finger's tap is the pointer's, input())
  function marks() {
    const box = el.querySelector('.zem-pins'), cur = byId(o.cur), curC = onEarth(cur) ? cur.country || cur.name : '';
    let h = '';
    for (const t of o.list) {
      if (!onEarth(t)) continue;
      const k = K.kind(t.id), me = t.id === o.cur;
      h += '<div class="zp ' + k + (me ? ' cur' : '') + '" data-t="' + esc(t.id) + '" aria-hidden="true"><i></i></div>';   // (its progress: the pin's colour)
      h += '<button class="zl t off' + (me ? ' cur' : '') + '" data-t="' + esc(t.id) + '" aria-label="' + esc(t.name + ', ' + t.km.toFixed(1) + ' km') + '"><span>' + esc(t.name) + '</span><small>' + t.km.toFixed(1) + ' km</small></button>';
    }
    for (const c of R.C.values()) h += '<button class="zl c off' + (c.name === curC ? ' cur' : '') + '" data-c="' + esc(c.name) + '" aria-label="' + esc(c.name + ': ' + K.tracks(c.ids.length)) + '">' + K.flag(c.flag, c.name) + '<span>' + esc(c.name) + '</span>' + (c.ids.length > 1 ? '<small>' + c.ids.length + '</small>' : '') + '</button>';
    box.innerHTML = h;
    R.els = [...box.children].map(e => {
      const id = e.dataset.t, c = e.dataset.c, t = id ? byId(id) : null, p = t ? vec(t.lat, t.lon) : R.C.get(c).at.clone();
      return { e, p, pin: e.classList.contains('zp'), id, c, w: 0, h: 0, cur: id ? id === o.cur : c === curC };
    });
  }
  const tmp = () => new THREE.Vector3();
  function place(dt) {
    const w = tmp(), cz = R.d, showT = R.d < TRACKS_AT, boxes = UI.slice(), wide = W - (SIDE ? R.off : 0), low = H - (SIDE ? 0 : R.off); let fading = false;
    // the names in order: the track shown, the chosen country's, then the rest; one that would cover a name already placed waits
    const L = R.els.filter(m => !m.pin), P = R.els.filter(m => m.pin);
    const rank = (m) => (m.cur ? 0 : 2) + (m.id && (byId(m.id).country || '') === R.sel ? -1 : 0) + (m.c === R.sel ? -1 : 0);
    L.sort((a, b) => rank(a) - rank(b));
    const at = (m) => {
      w.copy(m.p).applyMatrix4(R.group.matrixWorld);
      const vis = w.z - 1 / cz;   // (in front of the horizon)
      const s = w.clone().project(R.cam);
      return { x: (s.x + 1) / 2 * W, y: (1 - s.y) / 2 * H, a: clamp(vis / 0.08, 0, 1) };
    };
    for (const m of P) {
      const q = at(m); m.q = q;
      m.e.style.transform = 'translate(' + q.x.toFixed(1) + 'px,' + q.y.toFixed(1) + 'px)'; m.e.style.opacity = q.a.toFixed(2); m.e.style.pointerEvents = q.a > 0.3 ? 'auto' : 'none';
      m.e.classList.toggle('sel', !!R.sel && (byId(m.id).country || '') === R.sel);
      if (q.a > 0.3) boxes.push([q.x - 7, q.y - 7, q.x + 7, q.y + 7, m.cur ? 2 : 1]);   // (close in no name over a pin: it stays to be tapped; from afar none over the track shown's)
    }
    for (const m of L) {
      const want = m.id ? showT : !showT;   // (far: the countries, close: the tracks)
      const q = at(m);
      if (!m.w) { m.w = m.e.offsetWidth; m.h = m.e.offsetHeight; }
      const x = clamp(q.x - m.w / 2, 4, wide - m.w - 4), y = q.y - m.h - 12, r = [x, y, x + m.w, y + m.h];   // (a name at the screen's edge stays whole)
      let ok = want && q.a > 0.15 && q.x > 2 && q.x < wide - 2 && y > TOP - 6 && y + m.h < low - 4;   // (only a name whose pin is on the screen)
      if (ok) for (const b of boxes) if (r[0] < b[2] + 4 && r[2] > b[0] - 4 && r[1] < b[3] + 2 && r[3] > b[1] - 2 && !(b[4] && (m.cur || (m.c && b[4] === 1)))) { ok = false; break; }
      if (ok) boxes.push(r);
      m.e.classList.toggle('off', !ok);
      m.e.classList.toggle('sel', !!m.c && m.c === R.sel);
      const to = ok ? q.a : 0;   // (a name fades in and out in a sixth of a second)
      m.o = m.o == null ? to : Math.abs(to - m.o) < 0.02 ? to : m.o + (to - m.o) * Math.min(1, dt * 12);
      if (m.o !== to) fading = true;
      m.e.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; m.e.style.opacity = m.o.toFixed(2); m.e.style.visibility = m.o > 0.01 ? '' : 'hidden';
    }
    return fading;
  }

  // one more frame (and the next ones while something moves); nothing moving: no frames at all
  function kick() { if (R && !R.raf) { R.last = performance.now(); R.raf = requestAnimationFrame(frame); } }
  function frame(now) {
    if (!el || !R) return;
    R.raf = 0;
    const dt = clamp((now - R.last) / 1000, 0, 0.05); R.last = Math.max(R.last, now);
    let busy = false;
    if (R.fly) {
      const f = R.fly, k = clamp((now - f.t0) / f.dur, 0, 1), e = ease(k);
      R.lat = f.from[0] + (f.to[0] - f.from[0]) * e; R.lon = wrap(f.from[1] + wrap(f.to[1] - f.from[1]) * e); R.d = f.from[2] + (f.to[2] - f.from[2]) * e; R.dT = R.d;
      if (k >= 1) R.fly = null; busy = true;
    } else {
      if (!R.drag) {   // (the glide, until it is too slow to see)
        R.lon = wrap(R.lon + R.vlon * dt); R.lat += R.vlat * dt; const k = Math.exp(-dt * 3.2); R.vlon *= k; R.vlat *= k;
        if (Math.abs(R.vlon) + Math.abs(R.vlat) < 0.03) R.vlon = R.vlat = 0; else busy = true;
      }
      if (calm() || Math.abs(R.dT - R.d) < 2e-4) R.d = R.dT; else { R.d += (R.dT - R.d) * (1 - Math.exp(-dt * 9)); busy = true; }
    }
    R.lat = clamp(R.lat, -72, 72);
    if (calm() || Math.abs(R.offT - R.off) < 0.3) R.off = R.offT; else { R.off += (R.offT - R.off) * (1 - Math.exp(-dt * 9)); busy = true; }
    const nv = R.U.nt.value; if (calm() || Math.abs(R.ntT - nv) < 0.01) R.U.nt.value = R.ntT; else { R.U.nt.value = nv + (R.ntT - nv) * (1 - Math.exp(-dt * 7)); busy = true; }   // (the night comes and goes in half a second)
    R.group.rotation.set(R.lat * D, -Math.PI / 2 - R.lon * D, 0);
    R.cam.position.set(0, 0, R.d); R.cam.lookAt(0, 0, 0);
    // the Earth in the middle of the free part of the screen (between the head and the card; lying, left of the card)
    const yc = SIDE ? (TOP + H) / 2 : (TOP + H - R.off) / 2, xc = SIDE ? (W - R.off) / 2 : W / 2;
    R.cam.setViewOffset(W, H, -(xc - W / 2), -(yc - H / 2), W, H); R.cam.updateProjectionMatrix();
    R.group.updateMatrixWorld();
    R.U.sunL.value.copy(vec(...sun()));
    R.r.render(R.scene, R.cam); R.n++;
    if (place(dt)) busy = true;
    if (busy) R.raf = requestAnimationFrame(frame);
  }

  // the card at the bottom (lying: at the side): a country's tracks (the quick list's rows), or with tc a track's card (the quick list's,
  // with the track's picture); a country with one track: its track's card at once, its Back the Earth (the user, 12. 11. 2026: »ni potrebe
  // da kliknes bathurst ce imamo vedno samo 1 progo na 1 drzavo«)
  const one = (name) => { const c = name && R.C.get(name); return c && c.ids.length === 1 ? c.ids[0] : null; };
  function card(name, tc) {
    const c = name ? R.C.get(name) : null, k = el.querySelector('.zem-card'), N = NZ();
    if (c && !tc) tc = one(name);
    if (!c) {
      k.classList.remove('on'); el.classList.remove('carded'); R.offT = 0; kick();
      const n = (R.card ? 1 : 0) + (R.tstep ? 1 : 0); R.card = false; R.tc = null; R.tstep = false; if (n) N.drop('zemlja', n);
      return;
    }
    if (!R.card) { R.card = true; N.push('zemlja', () => R && select(null)); }   // (Back closes the track's card, then the country's, then the Earth)
    const st = !!tc && !one(name);   // (a track's card over its country's list: one more step back)
    if (st && !R.tstep) N.push('zemlja', () => R && card(R.sel));
    else if (!st && R.tstep) N.drop('zemlja', 1);
    R.tc = tc || null; R.tstep = st;
    k.innerHTML = '<i class="izb-grab" aria-hidden="true"></i>' + (tc ? K.cardView(tc, true)
      : K.head(c.name, K.tracks(c.ids.length), '<span class="izb-hf">' + K.flag(c.flag, c.name) + '</span>') + '<div class="izb-body in"><div class="izb-list">' + c.ids.map(id => K.row(id)).join('') + '</div></div>');
    k.classList.toggle('tc', !!tc);
    k.setAttribute('aria-label', tc ? (byId(tc) || {}).name || '' : c.name);
    k.classList.add('on'); el.classList.add('carded');
    requestAnimationFrame(() => { if (R && el) { R.offT = SIDE ? k.offsetWidth : k.offsetHeight; kick(); } });
  }
  function select(name, id, tc) {   // (tc: the track's card)
    const was = R.sel; R.sel = name || null;
    if (was !== R.sel) { paint(); kick(); }
    if (name) o.buzz();
    card(R.sel, tc ? id : null);
    if (!R.sel) return;
    const c = R.C.get(R.sel), t = id ? byId(id) : null, to = t ? [t.lat, t.lon] : [c.lat, c.lon];
    // as close as the country's tracks all stay in the free part of the screen (round the place it turns to), never farther than now
    const mid = vec(to[0], to[1]); let spread = 0; for (const a of c.ids) { const u = byId(a); spread = Math.max(spread, mid.angleTo(vec(u.lat, u.lon))); }
    const d = clamp(Math.min(R.d, 1.15 + spread / 0.22), 2.0, DFAR);   // (one track: its country round it, not only the place)
    R.vlat = R.vlon = 0; R.fly = { from: [R.lat, R.lon, R.d], to: [to[0], to[1], d], t0: performance.now(), dur: calm() ? 1 : 750 };
    hideHint(); kick();
  }
  function hideHint() { if (!R.hint) return; R.hint = false; const h = el.querySelector('.zem-hint'); if (h) h.classList.add('gone'); }
  // a name or a pin tapped (or a name pressed with a key or the pad): its country's card, a track's card
  function pickMark(e) {
    if (e.dataset.t) { const t = byId(e.dataset.t); if (t) select(t.country || t.name, t.id, true); }
    else if (e.dataset.c) select(e.dataset.c);
  }
  // a tap on the Earth: the country under it (its outline), else the pin nearest to it; the sea: the card closed
  function tapAt(x, y) {
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(x / W * 2 - 1, -(y / H * 2 - 1));
    ray.setFromCamera(ndc, R.cam);
    const hit = ray.intersectObject(R.earth)[0];
    if (hit) {
      const p = R.group.worldToLocal(hit.point.clone()).normalize(), [lat, lon] = ll(p);
      for (const c of R.C.values()) if (inside(c.rings, lat, lon)) return select(c.name);
    }
    let best = null, bd = 26;
    for (const m of R.els) if (m.pin && m.q && m.q.a > 0.3) { const d = Math.hypot(m.q.x - x, m.q.y - y); if (d < bd) { bd = d; best = m; } }
    if (best) return pickMark(best.e);   // (a pin: its track's card)
    if (hit) select(null);
  }
  function inside(rings, lat, lon) {   // (even-odd over all its rings; the place also a turn east and west: the rings run on past ±180°)
    for (const k of [0, 360, -360]) {
      let n = 0;
      for (const X of rings) {
        const m = X.length / 2;
        for (let i = 0, j = m - 1; i < m; j = i++) {
          const xi = X[i * 2], yi = X[i * 2 + 1], xj = X[j * 2], yj = X[j * 2 + 1];
          if ((yi > lat) !== (yj > lat) && lon + k < (xj - xi) * (lat - yi) / (yj - yi) + xi) n++;
        }
      }
      if (n % 2) return true;
    }
    return false;
  }
  const zoom = (k) => { R.fly = null; R.dT = clamp(R.dT * (k < 0 ? 1 / 1.45 : 1.45), DMIN, DMAX); hideHint(); kick(); };
  function turn(dlat, dlon) { R.vlat = R.vlon = 0; R.fly = { from: [R.lat, R.lon, R.d], to: [clamp(R.lat + dlat, -72, 72), R.lon + dlon, R.d], t0: performance.now(), dur: calm() ? 1 : 320 }; hideHint(); kick(); }
  function goHome() {   // the target: the track shown (its country's card), a test track's place
    const t = byId(o.cur);
    if (onEarth(t) && R.C.has(t.country || t.name)) return select(t.country || t.name, t.id);
    if (R.sel) select(null);
    const h = home(); R.fly = { from: [R.lat, R.lon, R.d], to: [h[0], h[1], DFAR], t0: performance.now(), dur: calm() ? 1 : 750 }; hideHint(); kick();
  }

  // the finger: drag to turn, two to pinch; a short touch is a tap
  function input() {
    const pos = (e) => { const b = el.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    el.addEventListener('pointerdown', (e) => {
      if (!R || e.target.closest('.zem-card, .zem-sq')) return;
      const p = pos(e); R.pts.set(e.pointerId, p);
      if (R.pts.size === 1) R.drag = { x: p[0], y: p[1], t: performance.now(), moved: 0, target: e.target, last: performance.now() };
      if (R.pts.size === 2) { const [a, b] = [...R.pts.values()]; R.pinch = { d0: Math.hypot(a[0] - b[0], a[1] - b[1]), z0: R.d }; if (R.drag) R.drag.moved = 99; }
      R.fly = null; R.vlat = R.vlon = 0; hideHint();
    });
    addEventListener('pointermove', R.onMove = (e) => {
      if (!R || !R.pts.has(e.pointerId)) return;
      const p = pos(e), q = R.pts.get(e.pointerId); R.pts.set(e.pointerId, p);
      if (R.pts.size >= 2 && R.pinch) { const [a, b] = [...R.pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); R.d = R.dT = clamp(R.pinch.z0 * R.pinch.d0 / Math.max(20, d), DMIN, DMAX); kick(); return; }
      if (!R.drag) return;
      const dx = p[0] - q[0], dy = p[1] - q[1], k = (R.d - 1) / PX / D, now = performance.now(), dt = Math.max(1, now - R.drag.last) / 1000;
      R.drag.moved += Math.hypot(dx, dy); R.drag.last = now;
      const dl = -dx * k / Math.max(0.45, Math.cos(R.lat * D)), da = dy * k;
      R.lon = wrap(R.lon + dl); R.lat = clamp(R.lat + da, -72, 72);
      R.vlon = R.vlon * 0.6 + dl / dt * 0.4; R.vlat = R.vlat * 0.6 + da / dt * 0.4;
      kick();
    });
    const up = R.onUp = (e) => {
      if (!R || !R.pts.has(e.pointerId)) return;
      R.pts.delete(e.pointerId);
      if (R.pts.size < 2) R.pinch = null;
      if (R.pts.size === 0 && R.drag) {
        const g = R.drag; R.drag = null;
        if (performance.now() - g.last > 80) R.vlat = R.vlon = 0;   // (held still before letting go: no glide)
        kick();
        if (e.type === 'pointerup' && g.moved < 8 && performance.now() - g.t < 400) {
          R.vlat = R.vlon = 0;
          const m = g.target.closest && g.target.closest('[data-t], [data-c]');
          if (m) { o.click(); pickMark(m); } else tapAt(g.x, g.y);
        }
      }
    };
    addEventListener('pointerup', up); addEventListener('pointercancel', up);
    el.addEventListener('wheel', (e) => { if (!R || e.target.closest('.zem-card')) return; e.preventDefault(); R.fly = null; R.dT = clamp(R.dT * Math.exp(e.deltaY * 0.0012), DMIN, DMAX); hideHint(); kick(); }, { passive: false });
    // the keys: the arrows turn it, + and − come closer and go farther (not while a key is the card's)
    document.addEventListener('keydown', R.onKey = (e) => {
      if (!R || !el || e.altKey || e.ctrlKey || e.metaKey) return;
      const a = { ArrowLeft: [0, -20], ArrowRight: [0, 20], ArrowUp: [15, 0], ArrowDown: [-15, 0] }[e.key];
      if (a) { e.preventDefault(); e.stopPropagation(); turn(a[0], a[1]); return; }
      if (e.key === '+' || e.key === '=') { e.preventDefault(); zoom(-1); } else if (e.key === '-') { e.preventDefault(); zoom(1); }
    }, true);
  }
  // where it grows from and goes back into: a circle from the middle of the globe in the head (o.from: its element, or a function giving the
  // one on the screen now: a track chosen on the Earth has a new screen under it), as big as the screen at the end
  function aim(e, oo) {
    const f = typeof oo.from === 'function' ? oo.from() : oo.from, rr = oo.root.getBoundingClientRect(), g = f && f.isConnected ? f.getBoundingClientRect() : null;
    if (g && g.width) { e.style.setProperty('--zx', (g.left + g.width / 2 - rr.left).toFixed(1) + 'px'); e.style.setProperty('--zy', (g.top + g.height / 2 - rr.top).toFixed(1) + 'px'); e.style.setProperty('--zr', (g.width / 2).toFixed(1) + 'px'); }
    e.style.setProperty('--zR', Math.ceil(Math.hypot(rr.width, rr.height) + 40) + 'px');
  }
  function resize() {
    if (!el || !R) return;
    aim(el, o); measure(); R.r.setSize(W, H, false); R.cam.aspect = W / H; R.cam.fov = FOV;
    for (const m of R.els) m.w = 0;   // (the names measured again)
    const k = el.querySelector('.zem-card'); R.offT = k.classList.contains('on') ? (SIDE ? k.offsetWidth : k.offsetHeight) : 0; R.off = R.offT;
    kick();
  }

  async function open(opts) {
    if (el) close(true);
    if (!window.THREE || !window.MenuIzbor) { if (opts.fail) opts.fail(); return; }
    o = opts; K = MenuIzbor.use(o);   // (the quick list closed: its rows and its track's card are the Earth's cards)
    el = document.createElement('div'); el.className = 'zem'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'The world: choose a track');
    const n = o.list.filter(onEarth).length, coarse = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
    el.innerHTML = '<canvas></canvas><div class="zem-ui">' +
      '<button class="zem-sq zem-back" data-close aria-label="Back">' + I.back + '</button>' +
      '<div class="zem-title" aria-hidden="true"><b>WORLD</b><small>' + K.tracks(n) + '</small></div>' +
      '<button class="zem-sq zem-zoom zem-in" data-zoom="-1" aria-label="Closer">' + I.plus + '</button>' +
      '<button class="zem-sq zem-zoom zem-out" data-zoom="1" aria-label="Farther">' + I.minus + '</button>' +
      '<button class="zem-sq zem-zoom zem-home" data-home aria-label="The track shown">' + I.home + '</button>' +
      '<button class="zem-sq zem-zoom zem-night" data-night aria-pressed="' + night() + '" aria-label="Night: where it is night now" title="Night">' + I.night + '</button>' +
      '<div class="zem-hint" aria-hidden="true">' + (coarse ? 'Drag to turn · pinch to zoom · tap a country' : 'Drag to turn · scroll to zoom · click a country') + '</div>' +
      '<div class="zem-card" role="region"></div></div><div class="zem-pins"></div><div class="zem-load" aria-hidden="true">Loading the Earth…</div>';
    aim(el, o); o.root.appendChild(el);
    NZ().push('zemlja', () => close());
    measure();
    const mine = el;
    // the screen under it rests once the Earth covers it (the circle grown: half a second)
    const covered = () => { if (el === mine && !el.__rest) { el.__rest = true; if (o.rest) o.rest(); } };
    el.addEventListener('transitionend', (e) => { if (e.target === el && el.classList.contains('on')) covered(); });
    setTimeout(covered, calm() ? 50 : 650);
    requestAnimationFrame(() => requestAnimationFrame(() => { if (el === mine) el.classList.add('on'); }));
    try { build(); } catch (e) {   // (no WebGL for it: the quick list instead)
      try { console.error('the Earth:', e && e.message ? e.message : e); } catch (_) { /* no console */ }
      const f = o.fail; close(true); if (f) f(); return;
    }
    R.tex = R.weak ? 'assets/geo/earth2k.webp' : 'assets/geo/earth.webp';
    img = await picture(R.tex) || await picture('assets/geo/earth-s.webp');   // (not there, offline: the small one the head's globe has; neither: the sea)
    if (el !== mine) return;
    if (!img) R.tex = ''; else if (img.naturalWidth < 2048) R.tex = 'assets/geo/earth-s.webp';
    el.querySelector('.zem-load').remove();
    paint(); marks(); input();
    el.querySelector('.zem-title small').textContent = K.tracks(n) + ' · ' + R.C.size + (R.C.size === 1 ? ' country' : ' countries');
    el.addEventListener('click', onClick);
    el.addEventListener('error', (e) => {   // (a picture in the card that is not there: the other one (a route's flyover), else the row's own colour)
      const im = e.target; if (im.tagName !== 'IMG') return;
      if (im.dataset.alt) { im.src = im.dataset.alt; im.removeAttribute('data-alt'); } else im.style.visibility = 'hidden';
    }, true);
    addEventListener('resize', R.onSize = () => { clearTimeout(R.sizeT); R.sizeT = setTimeout(resize, 120); });
    start();
  }
  function onClick(e) {
    const b = e.target.closest('button'); if (!b || !R) return;
    if (b.hasAttribute('data-close')) { o.click(); return close(); }
    if (b.dataset.zoom) { o.click(); return zoom(+b.dataset.zoom); }
    if (b.hasAttribute('data-home')) { o.click(); return goHome(); }
    if (b.hasAttribute('data-night')) { o.click(); setNight(!night()); b.setAttribute('aria-pressed', night()); R.ntT = night() ? 1 : 0; return kick(); }
    if (b.classList.contains('zl')) { if (!e.detail) { o.click(); pickMark(b); } return; }   // (a key's or the pad's press; a finger's tap: input())
    // the card: the quick list's buttons
    if (b.hasAttribute('data-x')) { o.click(); return select(null); }
    if (b.hasAttribute('data-back')) { o.click(); return R.tstep ? card(R.sel) : select(null); }
    if (b.dataset.t) { o.click(); return select(R.sel, b.dataset.t, true); }   // (a row: its track's card)
    if (b.dataset.sel) {   // (Select: it lights up a moment, then the screen goes to it under the Earth going back into the globe)
      o.click(); b.classList.add('on'); const id = b.dataset.sel;
      setTimeout(() => { if (!el) return; if (id !== o.cur) o.pick(id); close(); }, 160);
      return;
    }
    if (b.dataset.race) { o.buzz(); const id = b.dataset.race; NZ().clear(); close(true); o.race(id); }   // (at once, in the tap: the race's sounds may start)
  }
  // closed (now: at once, without going back into the globe: another screen comes, the race starts; the screen under it moves again on its own)
  function close(now) {
    if (!el) return;
    NZ().drop('zemlja');
    const e = el, r = R, oo = o; el = null; R = null;
    if (r) {
      cancelAnimationFrame(r.raf); clearTimeout(r.sizeT);
      removeEventListener('pointermove', r.onMove); removeEventListener('pointerup', r.onUp); removeEventListener('pointercancel', r.onUp); removeEventListener('resize', r.onSize);
      document.removeEventListener('keydown', r.onKey, true);
    }
    const end = () => {
      if (r) {
        r.scene.traverse((m) => { if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); });
        r.map.dispose(); r.r.dispose(); r.r.forceContextLoss(); r.cv.width = r.cv.height = 1;
      }
      e.remove();
    };
    if (!now && e.__rest && oo && oo.wake) oo.wake();   // (the screen under it moves again as the Earth goes back into the globe)
    if (now || calm()) return end();
    aim(e, oo); e.classList.remove('on'); e.style.pointerEvents = 'none'; setTimeout(end, 520);
  }
  function back() {
    if (!el) return;
    if (R && R.tstep) return card(R.sel);   // (the track's card: the country's again; a one-track country's: the Earth)
    if (R && R.card) return select(null);
    close();
  }
  return {
    open, close, back, sun, night, isOpen: () => !!el, root: () => el, depth: () => window.MenuIzbor ? NZ().depth('zemlja') : 0,
    _R: () => R && { n: R.n, lat: R.lat, lon: R.lon, d: R.d, sel: R.sel, card: R.card, tc: R.tc, weak: R.weak, tex: R.tex, size: [R.cv.width, R.cv.height], moving: !!R.raf,
      countries: [...R.C.keys()], pins: R.els.filter(m => m.pin).length, sun: R.U.sunL.value.toArray(), night: night(), nt: R.U.nt.value, W, H, SIDE, TOP, off: R.off },   // (for the tests)
  };
})();
