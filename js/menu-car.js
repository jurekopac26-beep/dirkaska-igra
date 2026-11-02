/* =========================================================================
   MENU CAR — the player's car in 3D on the new menu's track step (js/menu.js: the yard under the row of numbers), with the wind round
   it in 3D (docs/meni-izbira-proge.md, sklop 3).
   The car is the race's own model in the player's colour and number (Render.garageCar), turned three quarters to the front as the
   showroom's picture shows it (Render.carShot '34f'), fitted into the yard's car button (.car: left, in front of the road sign). It is
   drawn on a canvas of its own over the whole yard (a small WebGL renderer of its own, transparent: the wall, the floor and the sign are
   the menu's), so the wind can cross the yard from edge to edge: soft-coloured lines that come in at the right edge, rise over the
   bonnet, the windscreen and the roof or pass along the near side (behind the car where the car hides them: they are in the same 3D
   as the car), and leave at the left edge, waves running along them from the nose to the tail (the user's »valovi«: each line sways
   and is brighter where its waves are). The lines follow each car's own shape: its height and width along it are probed from its
   meshes (shapeOf), and a line is lifted over the body or pushed out beside it a little before it gets there and let back slowly
   after it (lift). About 30 frames a second (15 with the battery saver), none while the screen is not shown; a device that asks for
   less motion gets the wind still.
   MenuCar.attach(yard, { id, color, num }, onFail): the canvas into the yard (one canvas, moved into each new yard the menu draws), the
   car built when it changed, drawing on; true when that car is drawn already. onFail(): no WebGL for it after all (the menu shows the
   car's picture then). detach(): the drawing stops (another screen). rest(): before a race: stopped, the canvas 1 x 1 (its buffers
   freed; the context, the car and the shaders kept for the way back). supported(): WebGL there and not lost. info(): for the tests.
   ========================================================================= */
window.MenuCar = (function () {
  'use strict';
  const FOV = 32, ROT = -0.6;   // (the showroom's '34f' view: its field of view, the car turned so its nose and its right side face the camera)
  const CELL = 0.08;   // (the probe's grid, metres)
  // the wind's soft colours (sky, ice blue, mint, lavender, aqua, pale blue) and how strong each line is at most
  const COLS = [[0.56, 0.84, 1.0], [0.6, 0.73, 1.0], [0.62, 0.94, 0.85], [0.73, 0.68, 1.0], [0.47, 0.89, 0.9], [0.7, 0.86, 1.0]];
  let renderer = null, scene = null, cam = null, canvas = null, failed = false, onFail = null;
  let car = null, key = '', wind = null, yard = null, ro = null, raf = 0, on = false, drawn = false, frames = 0, t0 = 0, last = 0;
  let W = 0, H = 0, dirty = true, lay = '', busy = 0, builds = 0;
  const calm = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const saver = () => { try { return !!(window.__game && window.__game.saver); } catch (_) { return false; } };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // (Render and Core are the page's own globals, const: not on window)
  function supported() { return !failed && !!window.THREE && typeof Render !== 'undefined' && !!Render.garageCar && typeof Core !== 'undefined' && !!window.WebGLRenderingContext; }
  function fail() {   // (no WebGL for it, it was lost, or the car could not be drawn: the menu's picture from now on, after this drawing of it)
    failed = true; on = false; cancelAnimationFrame(raf); raf = 0;
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    const cb = onFail; onFail = null; if (cb) setTimeout(() => { try { cb(); } catch (_) { /* the menu's */ } }, 0);
  }
  function init() {
    if (renderer) return true;
    canvas = document.createElement('canvas'); canvas.className = 'c3d'; canvas.setAttribute('aria-hidden', 'true');
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true, stencil: false }); }
    catch (e) { renderer = null; fail(); return false; }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); fail(); });
    scene = new THREE.Scene();
    // the showroom's lights (render.js initShowroom), the paint's glint as there (garageLight before each frame)
    scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x303848, 0.75));
    const k = new THREE.DirectionalLight(0xfff2dd, 0.9); k.position.set(-6, 10, 7); scene.add(k);
    const r = new THREE.DirectionalLight(0x7fb8ff, 0.55); r.position.set(6, 4, -8); scene.add(r);
    cam = new THREE.PerspectiveCamera(FOV, 2, 0.3, 200);
    t0 = performance.now();
    return true;
  }

  /* ---------------- the car ---------------- */
  // the points of its meshes (not the shadow blob), car frame (x the nose, y up, z its right side), a few thousand of a big body enough
  function pointsOf(v) {
    const out = [], p = new THREE.Vector3();
    v.grp.position.set(0, 0, 0); v.grp.rotation.set(0, 0, 0); v.grp.updateMatrixWorld(true);
    v.grp.traverse(m => {
      if (!m.isMesh || m === v.blob || !m.geometry || !m.geometry.attributes.position) return;
      for (let q = m; q && q !== v.grp; q = q.parent) if (!q.visible) return;
      const pa = m.geometry.attributes.position, n = Math.min(pa.count, m.geometry.drawRange.count), st = Math.max(1, Math.floor(n / 5000));
      for (let i = 0; i < n; i += st) { p.fromBufferAttribute(pa, i).applyMatrix4(m.matrixWorld); out.push(p.x, p.y, p.z); }
    });
    return new Float32Array(out);
  }
  // its shape on a grid: the top of the body over each (x, z) cell, its width on each side at each (x, y) cell
  function shapeOf(P) {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, y1 = 0;
    for (let i = 0; i < P.length; i += 3) { x0 = Math.min(x0, P[i]); x1 = Math.max(x1, P[i]); y1 = Math.max(y1, P[i + 1]); z0 = Math.min(z0, P[i + 2]); z1 = Math.max(z1, P[i + 2]); }
    const nx = Math.ceil((x1 - x0) / CELL) + 1, nz = Math.ceil((z1 - z0) / CELL) + 1, ny = Math.ceil(y1 / CELL) + 1;
    const top = new Float32Array(nx * nz), near = new Float32Array(nx * ny), far = new Float32Array(nx * ny);
    for (let i = 0; i < P.length; i += 3) {
      const ix = Math.floor((P[i] - x0) / CELL), iz = Math.floor((P[i + 2] - z0) / CELL), iy = clamp(Math.floor(P[i + 1] / CELL), 0, ny - 1), y = P[i + 1], z = P[i + 2];
      if (y > top[ix * nz + iz]) top[ix * nz + iz] = y;
      if (z > 0) { if (z > near[ix * ny + iy]) near[ix * ny + iy] = z; } else if (-z > far[ix * ny + iy]) far[ix * ny + iy] = -z;
    }
    return { x0, x1, z0, z1, y1, nx, nz, ny, top: med(top, nx, nz), near: med(near, nx, ny), far: med(far, nx, ny), hw: Math.max(z1, -z0) };
  }
  // (a grid's 3 x 3 median: one cell standing out alone, an antenna, a thin mast, is no shape of the body for the wind)
  function med(G, nx, nz) {
    const out = new Float32Array(G.length), v = [];
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      v.length = 0;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const ii = i + a, jj = j + b; v.push(ii >= 0 && ii < nx && jj >= 0 && jj < nz ? G[ii * nz + jj] : 0); }
      v.sort((p, q) => p - q); out[i * nz + j] = Math.max(v[4], Math.min(G[i * nz + j], v[6]));   // (the median, or more where most of the cells round it are as high)
    }
    return out;
  }
  // along x: the body's top under a line at z (cells within w of it); its width on one side at height y (cells within w of it)
  function topAlong(S, z, w) {
    const out = new Float32Array(S.nx), a = clamp(Math.floor((z - w - S.z0) / CELL), 0, S.nz - 1), b = clamp(Math.floor((z + w - S.z0) / CELL), 0, S.nz - 1);
    for (let ix = 0; ix < S.nx; ix++) for (let iz = a; iz <= b; iz++) out[ix] = Math.max(out[ix], S.top[ix * S.nz + iz]);
    return out;
  }
  function sideAlong(S, y, w, side) {
    const out = new Float32Array(S.nx), G = side > 0 ? S.near : S.far, a = clamp(Math.floor((y - w) / CELL), 0, S.ny - 1), b = clamp(Math.floor((y + w) / CELL), 0, S.ny - 1);
    for (let ix = 0; ix < S.nx; ix++) for (let iy = a; iy <= b; iy++) out[ix] = Math.max(out[ix], G[ix * S.ny + iy]);
    return out;
  }
  // a line's way past the body: at each x the most any cell of the body asks of it (its surface plus the room c, over the line's own
  // level b), less with the distance (a bell: no corner over a bar of a roll cage): the air rises a little before it reaches the body
  // (UP) and comes back slowly behind it (DOWN)
  const UP = 0.8, DOWN = 1.35;
  function lift(S, B, b, c, x) {
    let m = 0;
    for (let j = 0; j < S.nx; j++) {
      if (!(B[j] > 0)) continue;
      const need = B[j] + c - b; if (need <= m) continue;
      const d = (x - (S.x0 + (j + 0.5) * CELL)) / (x >= S.x0 + (j + 0.5) * CELL ? UP : DOWN), k = Math.exp(-d * d);
      if (need * k > m) m = need * k;
    }
    return m;
  }

  function build(spec) {
    const M0 = Core.MODELS.find(m => m.id === spec.id); if (!M0) return false;
    const M = Core.heirOf ? Core.heirOf(M0) : M0;
    drop();
    const v = Render.garageCar(M, spec.color, spec.num || 0, true);
    if (!spec.num && v.dec) v.dec.visible = false;
    const P = pointsOf(v), S = shapeOf(P);
    v.grp.rotation.y = ROT; v.grp.updateMatrixWorld(true); scene.add(v.grp);
    // (its points as the camera sees them: turned as the car)
    const c = Math.cos(ROT), s = Math.sin(ROT), Pw = new Float32Array(P.length);
    for (let i = 0; i < P.length; i += 3) { Pw[i] = P[i] * c + P[i + 2] * s; Pw[i + 1] = P[i + 1]; Pw[i + 2] = -P[i] * s + P[i + 2] * c; }
    car = { v, M, S, Pw, h: Math.max(0.5, S.y1) };
    dirty = true; drawn = false;
    return true;
  }
  function drop() {
    if (wind) { scene.remove(wind.mesh); wind.mesh.geometry.dispose(); wind = null; }
    if (car) { scene.remove(car.v.grp); try { Render.garageFree(car.v); } catch (_) { /* gone with the context */ } car = null; }
  }

  /* ---------------- the view: the showroom's camera for the car's size, the car into the button ---------------- */
  function frameCar() {
    const M = car.M, h = car.h, k = clamp(Math.max(M.len / 4.4, h / 1.45, M.wid / 1.9), 0.75, 1.55), dy = h / 2 - 0.7 * k;
    cam.fov = FOV; cam.aspect = W / H; cam.position.set(2.2 * k * 0.8, 3.1 * k * 0.8 + dy, 10.5 * k * 0.8); cam.lookAt(0, 0.55 * k + dy, 0);
    cam.updateProjectionMatrix(); cam.updateMatrixWorld(true); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
    // the car's box as seen, in the canvas's -1..1
    const VP = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse), p = new THREE.Vector3(), Pw = car.Pw;
    let bx0 = 1e9, bx1 = -1e9, by0 = 1e9, by1 = -1e9;
    for (let i = 0; i < Pw.length; i += 3) { p.set(Pw[i], Pw[i + 1], Pw[i + 2]).applyMatrix4(VP); bx0 = Math.min(bx0, p.x); bx1 = Math.max(bx1, p.x); by0 = Math.min(by0, p.y); by1 = Math.max(by1, p.y); }
    // the button's box (where the menu wants the car: left, in front of the sign), the car in it whole, at its bottom left
    const yr = yard.getBoundingClientRect(), bt = yard.querySelector('.car'), br = bt ? bt.getBoundingClientRect() : { left: yr.left, top: yr.top, width: yr.width * 0.62, height: yr.height };
    const tx0 = -1 + 2 * (br.left - yr.left) / W, tx1 = -1 + 2 * (br.left - yr.left + br.width) / W, ty0 = 1 - 2 * (br.top - yr.top + br.height) / H, ty1 = 1 - 2 * (br.top - yr.top) / H;
    const sc = Math.min((tx1 - tx0) / Math.max(1e-3, bx1 - bx0), (ty1 - ty0) / Math.max(1e-3, by1 - by0)), ox = tx0 - sc * bx0, oy = ty0 - sc * by0;
    cam.projectionMatrix.premultiply(new THREE.Matrix4().set(sc, 0, 0, ox, 0, sc, 0, oy, 0, 0, 1, 0, 0, 0, 0, 1));
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    car.fit = { sc, box: [bx0 * sc + ox, by0 * sc + oy, bx1 * sc + ox, by1 * sc + oy] };
  }

  /* ---------------- the wind ---------------- */
  // the lines: over the top (across the width, close over the body and further up), along the near side (low to high), two on the far
  // side (seen in front of the car and behind it). [kind, across (of the half width; a side's: metres out from it), height (of the car's
  // height; lower where the line would cross the road sign's face), room over or beside the body (m), how far it sways (m)]
  const LINES = [
    ['top', -0.45, 0.4, 0.05, 0.035], ['top', 0.05, 0.36, 0.06, 0.035], ['top', 0.45, 0.33, 0.07, 0.04], ['top', -0.2, 0.52, 0.2, 0.05], ['top', 0.25, 0.48, 0.34, 0.06],
    ['top', -0.7, 0.3, 0.12, 0.045],
    ['near', 0.1, 0.22, 0.07, 0.04], ['near', 0.18, 0.46, 0.09, 0.045], ['near', 0.3, 0.68, 0.11, 0.05], ['near', 0.55, 0.34, 0.1, 0.06], ['near', 0.35, 0.1, 0.08, 0.05],
    ['far', 0.3, 0.6, 0.1, 0.05], ['far', 0.6, 0.3, 0.1, 0.05],
  ];
  function buildWind() {
    if (wind) { scene.remove(wind.mesh); wind.mesh.geometry.dispose(); wind = null; }
    const S = car.S, h = car.h, hw = S.hw, c = Math.cos(ROT), s = Math.sin(ROT);
    const toW = (x, y, z) => new THREE.Vector3(x * c + z * s, y, -x * s + z * c);
    const camP = cam.position, fwd = new THREE.Vector3(), R = new THREE.Vector3(), VP = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    cam.getWorldDirection(fwd); R.crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const ndc = (p) => p.clone().applyMatrix4(VP);
    const tanH = Math.tan(FOV * Math.PI / 360), sc = car.fit.sc;
    // (the road sign's lower edge as seen: a line comes in at the right edge under it, the sign's name stays clear)
    const yr = yard.getBoundingClientRect(), sg = yard.querySelector('.sign'), sr = sg ? sg.getBoundingClientRect() : null;
    const yMax = sr && sr.width ? 1 - 2 * (sr.bottom - yr.top + 5) / H : 1, xa = S.x1 + 1.1, xb = S.x0 - 1.4, n = Math.ceil((xa - xb) / 0.05);
    const pos = [], aW = [], aN = [], aE = [], aS = [], aU = [], aA = [], aL = [], aC = [], idx = [];
    // (smoothed over a third of a metre: no corner where the body's grid steps)
    const sm = (V) => V.map((v, i) => { let t = 0, w = 0; for (let k = -3; k <= 3; k++) { const q = V[Math.max(0, Math.min(V.length - 1, i + k))], f = 4 - Math.abs(k); t += q * f; w += f; } return Math.max(v - 0.02, t / w); });
    let li = -1;
    for (const L of LINES) {
      const kind = L[0], amp = L[4], z0 = kind === 'top' ? L[1] * hw : hw + L[1], zs = kind === 'far' ? -1 : 1;
      let b = L[2] * h, room = L[3];
      if (ndc(toW(xa, b, z0 * zs)).y > yMax) {   // (its height where it comes in: as high as the sign lets it)
        let lo = 0.03, hi = b; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (ndc(toW(xa, m, z0 * zs)).y > yMax) hi = m; else lo = m; } b = lo;
      }
      const B = kind === 'top' ? topAlong(S, z0, 0.14) : sideAlong(S, b, 0.22, zs);
      let Y, Z;
      for (let tries = 0; ; tries++) {   // (over a tall body: closer over it, so it stays in the yard; none if not even so)
        Y = []; Z = [];
        for (let i = 0; i <= n; i++) {
          const x = xa - (xa - xb) * i / n;
          if (kind === 'top') { Y.push(b + lift(S, B, b, room, x)); Z.push(z0); }
          else { const d = lift(S, B, z0, room, x); Y.push(b + 0.25 * d); Z.push(z0 + d); }
        }
        Y = sm(Y); Z = sm(Z);
        let top = -9; for (let i = 0; i <= n; i += 4) top = Math.max(top, ndc(toW(xa - (xa - xb) * i / n, Y[i], Z[i] * zs)).y);
        if (top < 0.9 || tries > 3) { if (top >= 0.9) Y = null; break; }
        room *= 0.45;
      }
      if (!Y) continue;
      li++;
      const pts = [], A = [], N = [];
      for (let i = 0; i <= n; i++) {
        const x = xa - (xa - xb) * i / n;
        pts.push(toW(x, Y[i], Z[i] * zs));
        const out = Math.max(0, x - S.x1, S.x0 - x);   // (it sways less where it is close to the body: over it and beside it)
        A.push(amp * (0.3 + 0.7 * Math.min(1, out / 1.1)));
        N.push(kind === 'top' ? new THREE.Vector3(0, 1, 0) : toW(0, 0.85, 0.5 * zs).normalize());
      }
      // on to the yard's edges: from the car's way across the screen (along the camera's right, as far from it), beyond them a little
      const ext = (front) => {
        const add = [], a0 = front ? pts[0] : pts[pts.length - 1], a1 = front ? pts[1] : pts[pts.length - 2], d0 = a0.clone().sub(a1).normalize(), to = front ? R.clone() : R.clone().negate();
        let p = a0.clone(), go = 0;
        for (let k = 0; k < 600; k++) {
          const t = Math.min(1, go / 1.6), e = t * t * (3 - 2 * t), d = d0.clone().multiplyScalar(1 - e).add(to.clone().multiplyScalar(e)).normalize();
          p = p.clone().addScaledVector(d, 0.06); go += 0.06; add.push(p);
          const x = ndc(p).x; if (front ? x > 1.06 : x < -1.06) break;
        }
        return add;
      };
      const fr = ext(true).reverse(), bk = ext(false), nb = N[N.length - 1], nf = N[0];
      const all = fr.concat(pts, bk), amps = fr.map(() => amp).concat(A, bk.map(() => amp)), nrm = fr.map(() => nf).concat(N, bk.map(() => nb));
      // the ribbon: a pair of points each, as wide on the screen everywhere (its side across the line and the view, its width from the depth)
      let sAt = 0; const base = pos.length / 3, tot = all.reduce((t, p, i) => i ? t + p.distanceTo(all[i - 1]) : 0, 0);
      const col = COLS[li % COLS.length];
      for (let i = 0; i < all.length; i++) {
        const p = all[i], pr = all[Math.max(0, i - 1)], nx = all[Math.min(all.length - 1, i + 1)];
        if (i) sAt += p.distanceTo(pr);
        const t = nx.clone().sub(pr).normalize(), view = p.clone().sub(camP), dep = Math.max(0.5, view.dot(fwd));
        const side = new THREE.Vector3().crossVectors(t, view.normalize()); if (side.lengthSq() < 1e-8) side.set(0, 1, 0); side.normalize().multiplyScalar(dep * tanH / sc);
        for (const e of [-1, 1]) { pos.push(p.x, p.y, p.z); aW.push(side.x, side.y, side.z); aN.push(nrm[i].x, nrm[i].y, nrm[i].z); aE.push(e); aS.push(sAt); aU.push(tot > 0 ? sAt / tot : 0); aA.push(amps[i]); aL.push(li); aC.push(col[0], col[1], col[2]); }
        if (i) { const q = base + (i - 1) * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(aW, 3)); g.setAttribute('aN', new THREE.Float32BufferAttribute(aN, 3));
    g.setAttribute('aE', new THREE.Float32BufferAttribute(aE, 1)); g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 1)); g.setAttribute('aU', new THREE.Float32BufferAttribute(aU, 1));
    g.setAttribute('aA', new THREE.Float32BufferAttribute(aA, 1)); g.setAttribute('aL', new THREE.Float32BufferAttribute(aL, 1)); g.setAttribute('aC', new THREE.Float32BufferAttribute(aC, 3));
    g.setIndex(idx); g.computeBoundingSphere();
    const mesh = new THREE.Mesh(g, wind0()); mesh.frustumCulled = false; mesh.renderOrder = 10;
    scene.add(mesh);
    wind = { mesh, lines: li + 1, verts: pos.length / 3 };
  }
  // the lines' material (one for all of them): the waves run along each line from the nose to the tail, the line sways with them
  // (across it, less near the body) and is brighter on their crests; a slow gust over it all; soft at its edges and at its ends
  let windMat = null;
  function wind0() {
    if (windMat) return windMat;
    windMat = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uHW: { value: 0.01 } },
      vertexShader: [
        'attribute vec3 aW; attribute vec3 aN; attribute float aE; attribute float aS; attribute float aU; attribute float aA; attribute float aL; attribute vec3 aC;',
        'uniform float uT; uniform float uHW;',
        'varying float vE; varying float vU; varying float vK; varying vec3 vC; varying float vL;',
        'void main() {',
        '  float lam = 2.3 + 0.8 * fract(aL * 0.618), k = 6.2832 / lam;',
        '  float ph = (aS - uT * 1.05) * k + aL * 2.39;',
        '  float gust = 0.78 + 0.22 * sin(uT * 0.5 + aL * 1.3);',
        '  vec3 p = position + aN * (aA * gust * sin(ph)) + aW * (uHW * aE);',
        '  vE = aE; vU = aU; vC = aC; vL = aL;',
        '  vK = 0.5 + 0.5 * sin(ph + 1.2);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
        '}'].join('\n'),
      fragmentShader: [
        'uniform float uT;',
        'varying float vE; varying float vU; varying float vK; varying vec3 vC; varying float vL;',
        'void main() {',
        '  float e = 1.0 - smoothstep(0.2, 1.0, abs(vE));',
        '  float f = smoothstep(0.0, 0.05, vU) * (1.0 - smoothstep(0.95, 1.0, vU));',
        '  float a = (0.34 + 0.38 * vK * vK) * e * f * (0.85 + 0.15 * sin(uT * 0.7 + vL * 2.1));',
        '  gl_FragColor = vec4(vC * (0.82 + 0.3 * vK), a);',
        '}'].join('\n'),
      transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide,   // (a ribbon faces the camera either way round)
    });
    return windMat;
  }

  /* ---------------- drawing ---------------- */
  // the canvas as big as the yard; the view and the wind made again when the yard, the car's button or the sign moved (a turned phone,
  // another track's sign), not on each new drawing of the screen
  function fit() {
    if (dirty) {
      dirty = false;
      const r = yard.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height), bt = yard.querySelector('.car'), sg = yard.querySelector('.sign');
      if (w < 8 || h < 8) { dirty = true; return false; }
      const rel = (e) => { if (!e) return ''; const q = e.getBoundingClientRect(); return [q.left - r.left, q.top - r.top, q.width, q.height].map(Math.round).join(','); };
      const pr = Math.min(2, window.devicePixelRatio || 1), k = [w, h, pr, rel(bt), rel(sg)].join('|');
      if (k !== lay || !wind) {
        lay = k; W = w; H = h; renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
        frameCar(); buildWind(); builds++;
        windMat.uniforms.uHW.value = 3.2 / H;   // (a line 3.2 CSS px wide, its soft edges in that; the pixel ratio cancels out)
      }
    }
    return W > 0;
  }
  const SUN = { x: -6, y: 10, z: 7 };
  function draw(now) {
    if (!car || !fit()) return;
    windMat.uniforms.uT.value = calm() ? 0 : (now - t0) / 1000;
    Render.garageLight(SUN, 0xfff2dd, 0.55, 0xffffff);
    const b = performance.now(); renderer.render(scene, cam); busy = busy * 0.9 + (performance.now() - b) * 0.1;
    frames++;
    if (!drawn) { drawn = true; if (yard) yard.classList.add('c3d-on'); }
  }
  function loop(now) {
    raf = 0; if (!on || failed) return;
    if (!canvas.isConnected) { on = false; return; }
    raf = requestAnimationFrame(loop);
    const fps = Math.min(saver() ? 15 : 30, busy > 12 ? 10 : busy > 6 ? 18 : 30);   // (a device slow to draw it, software WebGL: fewer frames; the waves are slow)
    if (drawn && now - last < 1000 / fps - 4) return;
    last = now;
    try { draw(now); } catch (e) { try { console.error('menu car:', e && e.message ? e.message : e); } catch (_) { } fail(); return; }
    if (drawn && calm()) { on = false; cancelAnimationFrame(raf); raf = 0; }   // (still: one picture is enough)
  }

  /* ---------------- the menu's side ---------------- */
  function attach(el, spec, cb) {
    if (cb) onFail = cb;
    if (!supported() || !init()) return false;
    if (yard !== el) {
      if (ro) ro.disconnect();
      yard = el; ro = window.ResizeObserver ? new ResizeObserver(() => { dirty = true; }) : null; if (ro) ro.observe(el);
      dirty = true;
    }
    if (canvas.parentNode !== el) el.insertBefore(canvas, el.firstChild);
    const k = spec.id + '|' + spec.color + '|' + (spec.num || 0);
    if (k !== key || !car) { key = k; try { if (!build(spec)) { key = ''; return false; } } catch (e) { try { console.error('menu car:', e && e.message ? e.message : e); } catch (_) { } fail(); return false; } }
    if (drawn) el.classList.add('c3d-on');
    if (!on) { on = true; last = 0; if (!raf) raf = requestAnimationFrame(loop); }
    return drawn;
  }
  function detach() { on = false; cancelAnimationFrame(raf); raf = 0; }
  function rest() {
    detach();
    if (renderer && !failed) { renderer.setSize(1, 1, false); W = H = 0; lay = ''; dirty = true; drawn = false; }   // (back from the race: drawn afresh, faded in)
  }
  function live(spec) { return !!car && drawn && !failed && key === spec.id + '|' + spec.color + '|' + (spec.num || 0); }
  function info() {
    const ri = renderer ? renderer.info : null;
    return { on, drawn, failed, frames, builds, car: car ? car.M.id : null, size: [W, H], calls: ri ? ri.render.calls : 0, tris: ri ? ri.render.triangles : 0, lines: wind ? wind.lines : 0, verts: wind ? wind.verts : 0,
      ms: +busy.toFixed(2), box: car && car.fit ? car.fit.box.map(v => +v.toFixed(3)) : null, connected: !!(canvas && canvas.isConnected) };
  }
  // (tests) a frame drawn now (t: at that time of the wind, s) and read at once (its buffer is not kept once it is shown): how much of the
  // yard right of the car's box (only the wind there) and of the car's box is drawn, the wind's colour there (0..1), and where its lines
  // are (a sum of their rows: it changes as the waves go)
  function sample(t) {
    if (!car || !renderer || failed) return null;
    if (t != null) t0 = performance.now() - t * 1000;
    draw(performance.now()); if (!W) return null;
    const o = document.createElement('canvas'); o.width = canvas.width; o.height = canvas.height; const g = o.getContext('2d'); g.drawImage(canvas, 0, 0);
    const d = g.getImageData(0, 0, o.width, o.height).data, bx = Math.round((car.fit.box[2] * 0.5 + 0.5) * o.width) + 4;
    let right = 0, nR = 0, inCar = 0, nC = 0, r = 0, gg = 0, b = 0, rows = 0;
    for (let y = 0; y < o.height; y++) for (let x = 0; x < o.width; x++) {
      const k = (y * o.width + x) * 4, a = d[k + 3];
      if (x > bx) { nR++; if (a > 8) { right++; r += d[k]; gg += d[k + 1]; b += d[k + 2]; rows += y * a; } } else { nC++; if (a > 8) inCar++; }
    }
    return { right: +(right / Math.max(1, nR)).toFixed(4), car: +(inCar / Math.max(1, nC)).toFixed(4), col: right ? [r, gg, b].map(v => +(v / right / 255).toFixed(3)) : null, rows: Math.round(rows / 255), px: [o.width, o.height] };
  }
  return { supported, attach, detach, rest, live, info, sample };
})();
