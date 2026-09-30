/* =========================================================================
   CAR3D — the showroom car in real 3D (three.js r128, the same version as the
   game). The models are the game's own cars, exported with their meshes,
   materials and the vertex colours of all 8 player colours (assets/cars/*.json).
   Drag to turn; it turns slowly by itself when left alone.
   ========================================================================= */
window.Car3D = (function () {
  'use strict';
  let renderer = null, scene, cam, host = null, canvas = null, cur = null, want = null, raf = 0, last = 0, visible = false;
  let angle = 0.6, vel = 0, drag = null, rim = null, fitR = 3;
  const cache = {};
  const b64 = (s, T) => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new T(u.buffer); };

  function init(el) {
    host = el;
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', 'Car in 3D. Drag to turn it.');
    host.appendChild(canvas);
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    scene = new THREE.Scene();
    // the game's showroom lights (render.js initShowroom)
    scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x303848, 0.75));
    const key = new THREE.DirectionalLight(0xfff2dd, 0.9); key.position.set(-6, 10, 7); scene.add(key);
    const back = new THREE.DirectionalLight(0x7fb8ff, 0.55); back.position.set(6, 4, -8); scene.add(back);
    rim = new THREE.DirectionalLight(0x3fd0ff, 0); rim.position.set(0, 3, -9); scene.add(rim);
    cam = new THREE.PerspectiveCamera(26, 1, 0.1, 200);
    canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, t: performance.now() }; vel = 0; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const now = performance.now(), dx = e.clientX - drag.x, dt = Math.max(1, now - drag.t);
      angle += dx * 0.011; vel = dx * 0.011 / (dt / 1000); drag.x = e.clientX; drag.t = now;
    });
    const end = () => { drag = null; };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    if (window.ResizeObserver) new ResizeObserver(size).observe(host); else window.addEventListener('resize', size);
    size();
  }
  function size() {
    if (!renderer || !host) return;
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); place();
  }
  function place() {
    // the car is framed by its bounding sphere: slightly from above (15 degrees), a little room around it
    const e = 15 * Math.PI / 180, vf = cam.fov * Math.PI / 360, hf = Math.atan(Math.tan(vf) * cam.aspect);
    const D = fitR / Math.sin(Math.min(vf, hf)) * 0.82;
    cam.position.set(0, fitR * 0.1 + D * Math.sin(e), D * Math.cos(e)); cam.lookAt(0, fitR * 0.06, 0);
  }

  function mat(m, tex) {
    const o = { vertexColors: !!m.vc, transparent: !!m.tr, opacity: m.op == null ? 1 : m.op, depthWrite: m.dw !== false, side: m.side || 0, alphaTest: m.at || 0 };
    if (m.color != null) o.color = m.color;
    if (m.map) o.map = tex(m.map);
    if (m.po) { o.polygonOffset = true; o.polygonOffsetFactor = m.po[0]; o.polygonOffsetUnits = m.po[1]; }
    if (m.blend) o.blending = m.blend;
    if (m.type === 'MeshPhongMaterial') return new THREE.MeshPhongMaterial(Object.assign(o, { shininess: m.shin == null ? 30 : m.shin, specular: m.spec == null ? 0x111111 : m.spec, emissive: m.emi || 0 }));
    if (m.type === 'MeshBasicMaterial') return new THREE.MeshBasicMaterial(o);
    return new THREE.MeshLambertMaterial(Object.assign(o, { emissive: m.emi || 0 }));
  }
  function build(J) {
    const grp = new THREE.Group(), texs = {};
    const tex = (k) => {
      if (!k) return null;
      if (!texs[k]) {
        const d = J.textures[k], img = new Image(), t = new THREE.Texture(img);
        img.onload = () => { t.needsUpdate = true; render(); };
        img.src = d.url; t.flipY = d.flipY; t.wrapS = d.wrapS; t.wrapT = d.wrapT; t.repeat.set(d.repeat[0], d.repeat[1]); t.offset.set(d.offset[0], d.offset[1]);
        texs[k] = t;
      }
      return texs[k];
    };
    const meshes = J.meshes.map(e => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(b64(e.pos, Float32Array), 3));
      if (e.nrm) g.setAttribute('normal', new THREE.BufferAttribute(b64(e.nrm, Int8Array), 3, true));
      let base = null;
      if (e.col) { base = b64(e.col, Uint8Array); g.setAttribute('color', new THREE.BufferAttribute(base.slice(), 3, true)); }
      if (e.uv) g.setAttribute('uv', new THREE.BufferAttribute(b64(e.uv, Float32Array), 2));
      if (e.idx) g.setIndex(new THREE.BufferAttribute(b64(e.idx, e.idx32 ? Uint32Array : Uint16Array), 1));
      if (e.groups) e.groups.forEach(([s, c, mi]) => g.addGroup(s, c, mi));
      const mats = e.mats.map(m => mat(m, tex));
      const mesh = new THREE.Mesh(g, mats.length === 1 ? mats[0] : mats);
      mesh.renderOrder = e.ro || 0;
      grp.add(mesh);
      return { mesh, base, mats, def: e.mats };
    });
    const bx = J.box, c = [(bx[0][0] + bx[1][0]) / 2, (bx[0][1] + bx[1][1]) / 2, (bx[0][2] + bx[1][2]) / 2];
    const inner = new THREE.Group(); inner.add(grp); grp.position.set(-c[0], -bx[0][1], -c[2]);
    const r = Math.hypot(bx[1][0] - bx[0][0], bx[1][2] - bx[0][2]) / 2;
    return { J, obj: inner, meshes, tex, r, color: -1, dark: null };
  }
  function load(model) {
    if (!cache[model]) cache[model] = fetch('assets/cars/' + model + '.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(build);
    return cache[model];
  }

  // one of the 8 player colours: the base colours, then the variant's changed vertices and materials
  function paint(car, ci) {
    if (car.color === ci) return;
    const v = ci > 0 ? car.J.variants[ci] : null;
    car.meshes.forEach((m, i) => {
      const a = m.mesh.geometry.getAttribute('color');
      if (a && m.base) a.array.set(m.base);
      m.mats.forEach((M, k) => { const d = m.def[k]; if (d.color != null && M.color) M.color.setHex(d.color); });
      const d = v && v[i];
      if (d && a) {
        if (d.ix) { const ix = b64(d.ix, Uint32Array), c = b64(d.c, Uint8Array); for (let j = 0; j < ix.length; j++) { const o = ix[j] * 3; a.array[o] = c[j * 3]; a.array[o + 1] = c[j * 3 + 1]; a.array[o + 2] = c[j * 3 + 2]; } }
        if (d.colFull) a.array.set(b64(d.colFull, Uint8Array));
      }
      if (d && d.mats) d.mats.forEach((x, k) => { if (x && x.color != null && m.mats[k].color) m.mats[k].color.setHex(x.color); });
      if (a) a.needsUpdate = true;
    });
    car.color = ci;
  }
  // an unfinished car: a dark silhouette lit from behind
  function darken(car, on) {
    if (car.dark === on) return;
    if (!car.darkMat) car.darkMat = new THREE.MeshLambertMaterial({ color: 0x0f1828 });
    car.meshes.forEach(m => {
      const blob = m.mesh.renderOrder === 1;
      if (blob) return;
      m.mesh.material = on ? car.darkMat : (m.mats.length === 1 ? m.mats[0] : m.mats);
    });
    car.dark = on;
  }

  function show(model, colorIndex, opts) {
    opts = opts || {};
    want = model;
    if (canvas) canvas.style.opacity = cur && cur.model === model ? '1' : '0';
    return load(model).then(car => {
      if (want !== model) return;
      if (cur && cur.car !== car) scene.remove(cur.car.obj);
      if (!cur || cur.car !== car) { scene.add(car.obj); if (!cur) angle = 0.6; }
      cur = { model, car };
      darken(car, !!opts.dark); rim.intensity = opts.dark ? 1.4 : 0;
      if (!opts.dark) paint(car, colorIndex);
      fitR = Math.max(2.2, car.r * 1.05); place();
      render(); canvas.style.opacity = '1';
    }).catch(err => { console.error('car', model, err); if (canvas) canvas.style.opacity = '1'; });
  }
  function setColor(ci) { if (cur && !cur.car.dark) { paint(cur.car, ci); render(); } }

  function render() { if (renderer && cur) { cur.car.obj.rotation.y = angle; renderer.render(scene, cam); } }
  function frame(t) {
    raf = 0; if (!visible) return;
    const dt = Math.min(0.05, last ? (t - last) / 1000 : 0); last = t;
    if (!drag) { if (Math.abs(vel) > 0.05) { angle += vel * dt; vel *= Math.pow(0.04, dt); } else { vel = 0; angle += dt * 0.35; } }
    render();
    raf = requestAnimationFrame(frame);
  }
  function setVisible(v) { visible = v; last = 0; if (v) { size(); if (!raf) raf = requestAnimationFrame(frame); } }
  function preload(models) { models.forEach(m => load(m).catch(() => {})); }
  return { init, show, setColor, setVisible, preload };
})();
