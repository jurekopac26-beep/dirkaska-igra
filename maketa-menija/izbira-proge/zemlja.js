// The Earth (mockup): a tap on the globe in the header opens it over the whole screen. The Earth in 3D (three.js r128, the game's
// js/vendor/three.r128.min.js; the Blue Marble, assets/geo/earth.webp), turned to the track shown. Drag to turn it (north stays up, it glides
// on a little when let go), pinch, the wheel or + and − to come closer, the target to go back to the track shown. The countries with tracks
// are gold (their outlines: GEO.outlines, MENU.globe.outlines), each track a pin; from afar the countries are named (flag and name), close in
// the tracks. A tap on a country or a pin opens its card at the bottom with its tracks; a tap on a track there takes you to it.
// ZEMLJA.open({ cur, order, all, flag, pick }) as IZBOR.open; ZEMLJA.covers(): the Earth covers the screen (the screen under it rests).
// The battery: it draws only while something moves (a flight, a drag, the glide, the zoom easing, a name fading, the card); a weak phone
// (navigator.deviceMemory <= 4 or a texture limit under 4096) gets the half-size picture (mk/earth2k.webp); at most 2 pixels per point.
window.ZEMLJA = (() => {
  const D = Math.PI / 180, FOV = 60, DMIN = 1.5, DMAX = 5.4, DFAR = 3.7, DCLOSE = 2.3, TRACKS_AT = 2.75, TOP = 80;
  let W = 412, H = 892, SIDE = false, PX = 0;   // (the screen, at each opening: lying, the whole screen and the card at the side; PX: px per unit at distance 1)
  const CSS = `
  .zem { position: absolute; inset: 0; z-index: 45; overflow: hidden; font-family: var(--f-ui); color: #fff; touch-action: none; user-select: none; -webkit-user-select: none;
    background: radial-gradient(120% 70% at 50% 46%, #11234a 0, #0a1630 34%, #050a16 70%, #03060d 100%);
    clip-path: circle(26px at 372px 40px); transition: clip-path .5s cubic-bezier(.3, .7, .2, 1); }
  .zem.on { clip-path: circle(1100px at 372px 40px); }
  .zem canvas { position: absolute; left: 0; top: 0; width: 412px; height: 892px; }
  .zem-ui { position: absolute; inset: 0; pointer-events: none; }
  .zem-ui > * { pointer-events: auto; }
  .zem-sq { position: absolute; width: 44px; height: 44px; border-radius: 10px; border: 1.5px solid rgba(255, 255, 255, .38); background: linear-gradient(180deg, #666d7b, #3b414d);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .32), 0 3px 0 #1f232b; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; }
  .zem-sq svg { width: 22px; height: 22px; }
  .zem-sq:active { transform: translateY(2px); box-shadow: inset 0 1px 0 rgba(255, 255, 255, .32), 0 1px 0 #1f232b; }
  .zem-back { left: 14px; top: 14px; width: 78px; height: 52px; border-radius: 11px; box-shadow: inset 0 1px 0 rgba(255, 255, 255, .35), 0 4px 0 #1f232b; }
  .zem-back svg { width: 26px; height: 26px; }
  .zem-title { position: absolute; left: 100px; right: 70px; top: 14px; height: 52px; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }
  .zem-title b { font: 800 italic 34px/1 var(--f-ui); letter-spacing: .5px; text-shadow: 0 2px 0 rgba(0, 0, 0, .45), 0 0 16px rgba(0, 0, 0, .55); }
  .zem-title small { margin-top: 4px; font: 600 12px/1 var(--f-ui); color: #dbe6f7; text-shadow: 0 1px 0 rgba(0, 0, 0, .7), 0 0 8px rgba(0, 0, 0, .8), 0 0 14px rgba(0, 0, 0, .55); }   /* (legible over bright land too) */
  .zem-zoom { right: 14px; }
  .zem-pins { position: absolute; inset: 0; pointer-events: none; }
  .zp, .zl { position: absolute; left: 0; top: 0; will-change: transform, opacity; }
  .zp { width: 0; height: 0; pointer-events: auto; cursor: pointer; }
  .zp::before { content: ''; position: absolute; left: -16px; top: -16px; width: 32px; height: 32px; border-radius: 50%; }
  .zp i { position: absolute; left: -6px; top: -6px; width: 12px; height: 12px; border-radius: 50%; background: #ffc629; border: 2px solid #fff;
    box-shadow: 0 0 0 1.5px rgba(0, 0, 0, .45), 0 0 10px rgba(255, 198, 41, .85); }
  .zp.cur i { left: -8px; top: -8px; width: 16px; height: 16px; background: #fff; border-color: #ffc629; box-shadow: 0 0 0 1.5px rgba(0, 0, 0, .45), 0 0 14px rgba(255, 255, 255, .9); }
  .zp.cur::after { content: ''; position: absolute; left: -16px; top: -16px; width: 32px; height: 32px; border-radius: 50%; border: 2px solid #ffc629; opacity: 0; animation: zpPulse 1.6s ease-out 3; }   /* (three pulses, then still: the battery) */
  .zp.silver i { background: #d3d9e2; }
  .zp.bronze i { background: #d98b47; }
  .zp.done i { background: #45d27e; }
  .zp.new i { background: #1d2a40; border-color: #7fe8ff; }
  .zp.sel i { background: #fff; }
  @keyframes zpPulse { from { transform: scale(.4); opacity: 1; } to { transform: scale(1.5); opacity: 0; } }
  .zl { pointer-events: auto; cursor: pointer; display: flex; align-items: center; gap: 6px; white-space: nowrap; padding: 4px 9px 4px 5px; border-radius: 8px;
    background: rgba(8, 13, 24, .8); border: 1px solid rgba(255, 255, 255, .2); box-shadow: 0 3px 10px rgba(0, 0, 0, .45);
    font: 800 italic 12px/1 var(--f-ui); text-transform: uppercase; letter-spacing: .2px; }
  .zl svg { width: 21px; height: 14px; border-radius: 2px; flex: 0 0 auto; box-shadow: 0 0 0 1px rgba(255, 255, 255, .2); }
  .zl small { font: 600 10.5px/1 var(--f-ui); color: var(--lbl, #9fb3d6); text-transform: none; }
  .zl.t { padding: 4px 8px; }
  .zl.cur, .zl.sel { border-color: #ffc629; }
  .zl.cur { background: rgba(60, 44, 6, .88); }
  .zl.off { pointer-events: none; }   /* (the fade itself in place(): a CSS transition restarted every frame can leave a hidden name showing) */
  .zem-card { position: absolute; left: 0; right: 0; bottom: 0; max-height: 400px; display: flex; flex-direction: column; border-radius: 18px 18px 0 0;
    background: linear-gradient(180deg, rgba(26, 39, 66, .97) 0, rgba(13, 22, 38, .98) 100%); box-shadow: 0 -10px 30px rgba(0, 0, 0, .55), inset 0 1px 0 rgba(255, 255, 255, .14);
    transform: translateY(105%); transition: transform .3s cubic-bezier(.2, .8, .25, 1); }
  .zem-card.on { transform: none; }
  .zem.side .zem-card { left: auto; top: 0; width: 412px; max-height: none; border-radius: 18px 0 0 18px; transform: translateX(105%); box-shadow: -10px 0 30px rgba(0, 0, 0, .55), inset 1px 0 0 rgba(255, 255, 255, .14); }
  .zem.side .zem-card.on { transform: none; }
  .zem.side .zem-zoom { right: auto; left: 14px; }
  .zem.side:has(.zem-card.on) .zem-title { right: 426px; }   /* (lying: the title over the free part, left of the card) */
  .zem-card .izb-body { padding-bottom: 18px; }
  .zem-hint { position: absolute; left: 50%; bottom: 26px; transform: translateX(-50%); padding: 9px 14px; border-radius: 20px; background: rgba(8, 13, 24, .72); border: 1px solid rgba(255, 255, 255, .16);
    font: 600 13px/1 var(--f-ui); color: #dfe7f6; white-space: nowrap; pointer-events: none; transition: opacity .3s; }
  .zem-load { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font: 700 italic 15px/1 var(--f-ui); color: #9fb3d6; pointer-events: none; }
  `;
  const I = {
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>',
    minus: '<svg viewBox="0 0 24 24"><path d="M5 12h14" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>',
    home: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6.5" fill="none" stroke="#fff" stroke-width="2.4"/><circle cx="12" cy="12" r="2.2" fill="#ffc629"/><path d="M12 2.5v3.2M12 18.3v3.2M2.5 12h3.2M18.3 12h3.2" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/></svg>',
    go: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const wrap = (a) => ((a + 180) % 360 + 360) % 360 - 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let img = null, el = null, o = null, R = null;
  const IMGS = {};   // (the Earth's pictures, each loaded once: the whole one and the half-size one for a weak phone)

  const script = (src) => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  async function ready() { if (!window.THREE) await script('js/vendor/three.r128.min.js'); }
  async function picture(weak) {
    const src = weak ? 'maketa-menija/izbira-proge/mk/earth2k.webp' : 'assets/geo/earth.webp';
    if (!IMGS[src]) { const im = new Image(); im.src = src; IMGS[src] = im.decode().then(() => im); }
    return IMGS[src];
  }
  // a place on the sphere (three's own sphere: u from 180° W, v from the north) and back
  const vec = (lat, lon) => { const p = (lon + 180) * D, t = (90 - lat) * D; return new THREE.Vector3(-Math.cos(p) * Math.sin(t), Math.cos(t), Math.sin(p) * Math.sin(t)); };
  const ll = (v) => [Math.asin(clamp(v.y, -1, 1)) / D, wrap(Math.atan2(v.z, -v.x) / D - 180)];

  // the countries with tracks: their tracks, outlines and where the name stands (the middle of its tracks)
  function countries() {
    const by = new Map(), G = window.GEO || { outlines: {} }, M = (window.MENU && window.MENU.globe) || { outlines: {} };
    for (const id of o.order) {
      const t = o.all[id]; if (t.lat == null) continue;
      if (!by.has(t.country)) by.set(t.country, { name: t.country, flag: t.flag, ids: [], rings: [].concat(G.outlines[t.country] || [], M.outlines[t.country] || []).map(unwrap) });
      by.get(t.country).ids.push(id);
    }
    for (const c of by.values()) { const v = new THREE.Vector3(); c.ids.forEach(id => v.add(vec(o.all[id].lat, o.all[id].lon))); v.normalize(); c.at = v; [c.lat, c.lon] = ll(v); }
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
    g.drawImage(img, 0, 0, w, h);
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

  function build() {
    const T3 = THREE, cv = el.querySelector('canvas');
    const r = new T3.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setSize(W, H, false);
    const scene = new T3.Scene(), cam = new T3.PerspectiveCamera(FOV, W / H, 0.01, 300);
    const weak = (navigator.deviceMemory || 8) <= 4 || r.capabilities.maxTextureSize < 4096, tc = document.createElement('canvas'); tc.width = weak ? 2048 : 4096; tc.height = tc.width / 2;
    const map = new T3.CanvasTexture(tc); map.anisotropy = Math.min(8, r.capabilities.getMaxAnisotropy()); map.encoding = T3.sRGBEncoding;
    r.outputEncoding = T3.sRGBEncoding;
    const earth = new T3.Mesh(new T3.SphereGeometry(1, 128, 64), new T3.MeshPhongMaterial({ map, specular: new T3.Color(0x10161f), shininess: 30 }));
    // day and night (GLOBE.sun: where the Sun is overhead now): the night side darker and bluer, a soft edge between (in linear light:
    // after the sRGB output about the header globe's 0.2, 0.24, 0.38)
    const U = { sunL: { value: new T3.Vector3(0, 0, 1) } };
    earth.material.onBeforeCompile = (sh) => {
      sh.uniforms.sunL = U.sunL;
      sh.vertexShader = 'varying vec3 vLocalN;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vLocalN = position;');
      sh.fragmentShader = 'uniform vec3 sunL;\nvarying vec3 vLocalN;\n' + sh.fragmentShader.replace('#include <tonemapping_fragment>',
        '{ float day = smoothstep(-0.16, 0.1, dot(normalize(vLocalN), sunL)); gl_FragColor.rgb *= mix(vec3(0.045, 0.06, 0.13), vec3(1.0), day); }\n#include <tonemapping_fragment>');
    };
    const group = new T3.Group(); group.add(earth); scene.add(group);
    // the air round it: brighter towards its edge
    const air = new T3.Mesh(new T3.SphereGeometry(1.06, 96, 48), new T3.ShaderMaterial({
      side: T3.BackSide, blending: T3.AdditiveBlending, transparent: true, depthWrite: false,
      vertexShader: 'varying vec3 n; varying vec3 v; void main(){ vec4 w = modelViewMatrix * vec4(position, 1.0); n = normalize(normalMatrix * normal); v = normalize(-w.xyz); gl_Position = projectionMatrix * w; }',
      fragmentShader: 'varying vec3 n; varying vec3 v; void main(){ float f = pow(clamp(-dot(n, v) / 0.33, 0.0, 1.0), 2.2); gl_FragColor = vec4(0.38, 0.64, 1.0, 1.0) * f * 0.85; }',   // (brightest on the Earth\'s edge, nothing at the air\'s own)
    }));
    scene.add(air);
    const halo = new T3.Mesh(new T3.SphereGeometry(1.003, 96, 48), new T3.ShaderMaterial({   // (a thin bright rim on the Earth's edge)
      blending: T3.AdditiveBlending, transparent: true, depthWrite: false,
      vertexShader: 'varying vec3 n; varying vec3 v; void main(){ vec4 w = modelViewMatrix * vec4(position, 1.0); n = normalize(normalMatrix * normal); v = normalize(-w.xyz); gl_Position = projectionMatrix * w; }',
      fragmentShader: 'varying vec3 n; varying vec3 v; void main(){ float f = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 5.0); gl_FragColor = vec4(0.45, 0.7, 1.0, 1.0) * f * 0.6; }',
    }));
    scene.add(halo);
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
    const sun = new T3.DirectionalLight(0xffffff, 0.6); sun.position.set(-1.2, 1.1, 1.6); scene.add(sun);
    const cur = o.all[o.cur];
    R = { r, scene, cam, group, earth, map, U, cv: tc, C: null, sel: null, lat: cur.lat, lon: cur.lon, d: 7.5, dT: DFAR, off: 0, offT: 0, weak,
      vlat: 0, vlon: 0, fly: null, drag: null, pts: new Map(), last: performance.now(), t0: performance.now(), hint: true, raf: 0, n: 0 };
    R.C = countries();
  }
  function start() { const cur = o.all[o.cur]; R.fly = { from: [R.lat, R.lon, 7.5], to: [cur.lat, cur.lon, DFAR], t0: performance.now(), dur: 1100 }; kick(); }

  // the pins and the names
  function marks() {
    const box = el.querySelector('.zem-pins'), flag = (cc) => '<svg viewBox="0 0 30 20" preserveAspectRatio="none">' + o.flag(cc) + '</svg>';
    let h = '';
    for (const id of o.order) {
      const t = o.all[id]; if (t.lat == null) continue;
      h += '<div class="zp' + (id === o.cur ? ' cur' : '') + (window.NAPREDEK ? ' ' + NAPREDEK.of(id).k : '') + '" data-t="' + id + '"><i></i></div>';   // (its progress: the pin's colour)
      h += '<div class="zl t' + (id === o.cur ? ' cur' : '') + '" data-t="' + id + '"><span>' + esc(t.name) + '</span><small>' + t.km.toFixed(1) + ' km</small></div>';
    }
    for (const c of R.C.values()) h += '<div class="zl c' + (c.name === o.all[o.cur].country ? ' cur' : '') + '" data-c="' + esc(c.name) + '">' + flag(c.flag) + '<span>' + esc(c.name) + '</span>' + (c.ids.length > 1 ? '<small>' + c.ids.length + '</small>' : '') + '</div>';
    box.innerHTML = h;
    R.els = [...box.children].map(e => {
      const id = e.dataset.t, c = e.dataset.c, p = id ? vec(o.all[id].lat, o.all[id].lon) : R.C.get(c).at.clone();
      return { e, p, pin: e.classList.contains('zp'), id, c, w: 0, h: 0, cur: id ? id === o.cur : c === o.all[o.cur].country };
    });
  }
  const tmp = () => new THREE.Vector3();
  function place(dt) {
    const w = tmp(), cz = R.d, showT = R.d < TRACKS_AT, boxes = []; let fading = false;
    // the names in order: the track shown, the chosen country's, then the rest; one that would cover a name already placed waits
    const L = R.els.filter(m => !m.pin), P = R.els.filter(m => m.pin);
    const rank = (m) => (m.cur ? 0 : 2) + (m.id && o.all[m.id].country === R.sel ? -1 : 0) + (m.c === R.sel ? -1 : 0);
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
      m.e.classList.toggle('sel', !!R.sel && o.all[m.id].country === R.sel);
    }
    for (const m of L) {
      const want = m.id ? showT : !showT;   // (far: the countries, close: the tracks)
      const q = at(m);
      if (!m.w) { m.w = m.e.offsetWidth; m.h = m.e.offsetHeight; }
      const x = clamp(q.x - m.w / 2, 4, W - (SIDE ? R.off : 0) - m.w - 4), y = q.y - m.h - 12, r = [x, y, x + m.w, y + m.h];   // (a name at the screen's edge stays whole)
      let ok = want && q.a > 0.15 && q.x > 2 && q.x < W - (SIDE ? R.off : 0) - 2 && y > TOP - 6 && y + m.h < H - (SIDE ? 0 : R.off) - 4;   // (only a name whose pin is on the screen)
      if (ok) for (const b of boxes) if (r[0] < b[2] + 4 && r[2] > b[0] - 4 && r[1] < b[3] + 2 && r[3] > b[1] - 2) { ok = false; break; }
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
      if (Math.abs(R.dT - R.d) < 2e-4) R.d = R.dT; else { R.d += (R.dT - R.d) * (1 - Math.exp(-dt * 9)); busy = true; }
    }
    R.lat = clamp(R.lat, -72, 72);
    if (Math.abs(R.offT - R.off) < 0.3) R.off = R.offT; else { R.off += (R.offT - R.off) * (1 - Math.exp(-dt * 9)); busy = true; }
    R.group.rotation.set(R.lat * D, -Math.PI / 2 - R.lon * D, 0);
    R.cam.position.set(0, 0, R.d); R.cam.lookAt(0, 0, 0);
    // the Earth in the middle of the free part of the screen (between the header and the card; lying, left of the card)
    const yc = SIDE ? (TOP + H) / 2 : (TOP + H - R.off) / 2, xc = SIDE ? (W - R.off) / 2 : W / 2;
    R.cam.setViewOffset(W, H, -(xc - W / 2), -(yc - H / 2), W, H); R.cam.updateProjectionMatrix();
    R.group.updateMatrixWorld();
    if (window.GLOBE && GLOBE.sun) R.U.sunL.value.copy(vec(...GLOBE.sun()));
    R.r.render(R.scene, R.cam); R.n++;
    if (place(dt)) busy = true;
    if (busy) R.raf = requestAnimationFrame(frame);
  }

  // the card at the bottom: a country's tracks
  // the country's card (its tracks), or with tc a track's card (IZBOR.trackCard: its shape, heights, Select, Race!) over it
  function card(name, hi, tc) {
    const c = R.C.get(name), k = el.querySelector('.zem-card');
    if (!c) { k.classList.remove('on'); R.offT = 0; kick(); const n = (R.card ? 1 : 0) + (R.tc ? 1 : 0); R.card = false; R.tc = null; if (n) NAZAJ.drop('zemlja', n); return; }
    if (!R.card) { R.card = true; NAZAJ.push('zemlja', () => R && select(null)); }   // (Back closes the track's card, then the country's, then the Earth)
    if (tc && !R.tc) NAZAJ.push('zemlja', () => R && card(R.sel));
    else if (!tc && R.tc) NAZAJ.drop('zemlja', 1);
    R.tc = tc || null;
    if (tc) {
      const t = o.all[tc], fl = '<svg viewBox="0 0 30 20" preserveAspectRatio="none">' + o.flag(t.flag) + '</svg>';
      k.innerHTML = '<i class="izb-grab"></i><div class="izb-head"><button class="izb-btn" data-tback aria-label="' + esc(c.name) + '">' + I.back + '</button><span class="izb-hf">' + fl + '</span><div class="t"><b>' + esc(t.name) + '</b><small>' + esc(t.country) + '</small></div>' +
        '<button class="izb-btn" data-cx aria-label="Close">' + I.x + '</button></div>' + IZBOR.trackCard(tc, o);
      k.classList.add('on');
      requestAnimationFrame(() => { if (R) { R.offT = SIDE ? k.offsetWidth : Math.min(400, k.offsetHeight); kick(); } });
      return;
    }
    const flag = '<svg viewBox="0 0 30 20" preserveAspectRatio="none">' + o.flag(c.flag) + '</svg>';
    const facts = IZBOR.facts;   // (the quick list's: length, climb or corners, group)
    k.innerHTML = '<i class="izb-grab"></i><div class="izb-head"><span class="izb-hf">' + flag + '</span><div class="t"><b>' + esc(c.name) + '</b><small>' + (c.ids.length === 1 ? '1 track' : c.ids.length + ' tracks') + '</small></div><button class="izb-btn" data-cx aria-label="Close">' + I.x + '</button></div>' +
      '<div class="izb-body"><div class="izb-list">' + c.ids.map(id => IZBOR.trow(id, o, 'data-pick', id === o.cur || id === hi)).join('') + '</div></div>';
    k.classList.add('on');
    requestAnimationFrame(() => { if (R) { R.offT = SIDE ? k.offsetWidth : Math.min(400, k.offsetHeight); kick(); } });
  }
  function select(name, id, tc) {   // (tc: the track's card)
    const was = R.sel; R.sel = name || null;
    if (was !== R.sel) { paint(); kick(); }
    if (name) NAZAJ.buzz();
    card(R.sel, id, tc ? id : null);
    if (!R.sel) return;
    const c = R.C.get(R.sel), t = id ? o.all[id] : null, to = t ? [t.lat, t.lon] : [c.lat, c.lon];
    // as close as the country's tracks all stay in the free part of the screen (round the place it turns to), never farther than now
    const mid = vec(to[0], to[1]); let spread = 0; for (const a of c.ids) spread = Math.max(spread, mid.angleTo(vec(o.all[a].lat, o.all[a].lon)));
    const d = clamp(Math.min(R.d, 1.15 + spread / 0.22), 2.0, DFAR);   // (one track: its country round it, not only the place)
    R.vlat = R.vlon = 0; R.fly = { from: [R.lat, R.lon, R.d], to: [to[0], to[1], d], t0: performance.now(), dur: 750 };
    hideHint(); kick();
  }
  function hideHint() { if (!R.hint) return; R.hint = false; const h = el.querySelector('.zem-hint'); if (h) h.style.opacity = '0'; }
  // a tap on the Earth: the country under it (its outline), else the pin nearest to it
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
    if (best) return select(o.all[best.id].country, best.id, true);   // (a pin: its track's card)
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

  // the finger: drag to turn, two to pinch; a short touch is a tap
  function input(stage) {
    const pos = (e) => { const b = el.getBoundingClientRect(); return [(e.clientX - b.left) * W / b.width, (e.clientY - b.top) * H / b.height]; };
    stage.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, .zem-card')) return;
      const p = pos(e); R.pts.set(e.pointerId, p);
      if (R.pts.size === 1) R.drag = { x: p[0], y: p[1], t: performance.now(), moved: 0, target: e.target, last: performance.now() };
      if (R.pts.size === 2) { const [a, b] = [...R.pts.values()]; R.pinch = { d0: Math.hypot(a[0] - b[0], a[1] - b[1]), z0: R.d }; R.drag && (R.drag.moved = 99); }
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
        if (g.moved < 8 && performance.now() - g.t < 400) {
          R.vlat = R.vlon = 0;
          const m = g.target.closest && g.target.closest('[data-t], [data-c]');
          if (m && m.dataset.t) select(o.all[m.dataset.t].country, m.dataset.t, true);   // (a pin: its track's card)
          else if (m && m.dataset.c) select(m.dataset.c);
          else tapAt(g.x, g.y);
        }
      }
    };
    addEventListener('pointerup', up); addEventListener('pointercancel', up);
    stage.addEventListener('wheel', (e) => { e.preventDefault(); R.fly = null; R.dT = clamp(R.dT * Math.exp(e.deltaY * 0.0012), DMIN, DMAX); hideHint(); kick(); }, { passive: false });
  }

  async function open(opts) {
    o = opts;
    if (window.IZBOR) IZBOR.style();   // (the card's rows: the quick list's)
    if (!document.getElementById('zem-css')) { const st = document.createElement('style'); st.id = 'zem-css'; st.textContent = CSS; document.head.appendChild(st); }
    if (window.IZBOR && IZBOR.isOpen()) IZBOR.close();
    if (el) close(true);
    el = document.createElement('div'); el.className = 'zem';
    const L = window.LY || {}; SIDE = !!L.land; W = SIDE ? L.pw : 412; H = SIDE ? L.ph : 892; PX = (H / 2) / Math.tan(FOV / 2 * D);
    if (SIDE) { el.classList.add('side'); Object.assign(el.style, { right: 'auto', bottom: 'auto', width: W + 'px', height: H + 'px' }); }
    el.innerHTML = '<canvas></canvas><div class="zem-pins"></div><div class="zem-ui">' +
      '<button class="zem-sq zem-back" data-close aria-label="Back">' + I.back + '</button>' +
      '<div class="zem-title"><b>WORLD</b><small>' + o.order.length + ' tracks</small></div>' +
      '<button class="zem-sq zem-zoom" style="top:88px" data-zoom="-1" aria-label="Closer">' + I.plus + '</button>' +
      '<button class="zem-sq zem-zoom" style="top:142px" data-zoom="1" aria-label="Farther">' + I.minus + '</button>' +
      '<button class="zem-sq zem-zoom" style="top:196px" data-home aria-label="The track shown">' + I.home + '</button>' +
      '<div class="zem-hint">Drag to turn · pinch to zoom · tap a country</div>' +
      '<div class="zem-card"></div></div><div class="zem-load">Loading the Earth…</div>';
    document.body.appendChild(el);
    NAZAJ.push('zemlja', () => close());
    requestAnimationFrame(() => requestAnimationFrame(() => el && el.classList.add('on')));
    const mine = el;
    await ready();
    if (el !== mine) return;
    build();
    img = await picture(R.weak);
    if (el !== mine) return;
    el.querySelector('.zem-load').remove();
    paint(); marks(); input(el);
    el.querySelector('.zem-title small').textContent = o.order.length + ' tracks · ' + R.C.size + ' countries';
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) return close();
      const z = e.target.closest('[data-zoom]'); if (z) { R.fly = null; R.dT = clamp(R.dT * (+z.dataset.zoom > 0 ? 1.45 : 1 / 1.45), DMIN, DMAX); hideHint(); kick(); return; }
      if (e.target.closest('[data-home]')) { const t = o.all[o.cur]; select(t.country, o.cur); return; }
      if (e.target.closest('[data-cx]')) return select(null);
      if (e.target.closest('[data-tback]')) return card(R.sel);
      const p = e.target.closest('[data-pick]'); if (p) return select(R.sel, p.dataset.pick, true);   // (a row: its track's card)
      const sl = e.target.closest('[data-sel]'); if (sl) { NAZAJ.buzz(); sl.classList.add('on'); setTimeout(() => { if (sl.dataset.sel === o.cur) close(); else o.pick(sl.dataset.sel); }, 160); return; }
      const r = e.target.closest('[data-race]'); if (r) { NAZAJ.buzz(); r.classList.add('on'); setTimeout(() => (o.race || o.pick)(r.dataset.race), 160); }
    });
    start();
  }
  function close(now) {
    if (!el) return;
    NAZAJ.drop('zemlja');
    const e = el, r = R; el = null; R = null;
    if (r) { cancelAnimationFrame(r.raf); removeEventListener('pointermove', r.onMove); removeEventListener('pointerup', r.onUp); removeEventListener('pointercancel', r.onUp); }
    const end = () => { if (r) { r.r.dispose(); r.map.dispose(); r.r.forceContextLoss(); } e.remove(); };
    if (now) return end();
    e.classList.remove('on'); setTimeout(end, 480);
  }
  return { open, close, covers: () => !!(el && R), _R: () => R };   // (_R: for the screenshots' checks)
})();
