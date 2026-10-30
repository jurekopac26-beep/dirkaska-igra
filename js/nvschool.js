// NEW VERSION · TEST 1: the driving school's tasks on the new map (js/nvmenu.js: its licences, their twelve tasks in four levels). START on a
// task's card: a short fade, the car on the task's start, 3 · 2 · 1 · GO, the clock; at the top the task, its clock and a hint, a × to give up;
// at the end a card with the place (1st-4th by the task's three times, or how exactly the car stopped), PONOVI or NAZAJ (back to the school's
// floor, its menu at the licence). The practice area's cones (the slalom row, the parallel box's corners) are this file's: one instanced
// mesh, knocked over by the car (+2 s in a task), stood up again when a task starts or ends. The parked cars by the bays stand there always
// (solid for the car: H3.solids, js/nvwalls.js). Loaded with the new map (js/game.js nvStart), set up from NVMenu.init, stepped from NVMenu.tick.
const NVSchool = (function () {
  'use strict';
  const tr = (s) => (typeof Lang !== 'undefined' && Lang.tr ? Lang.tr(s) : s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fmt = (t) => { const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1); };
  const ORD = ['1st', '2nd', '3rd', '4th'];
  let H3 = null, MK = null, G = {}, run = null, host = null, hud = null, card = null, cd = null, fade = null, last = 0;

  // ---- the practice area (H3.PAD: x0, x1, z0, z1; its markings: js/newmap.js schoolPad): u, v from its NW corner
  let PAD = [22, 118, 70, 112];
  const pu = (u) => PAD[0] + u, pv = (v) => PAD[2] + v;
  // the bays along its south edge (12, 2.7 m wide, 5.5 m deep, open to the north), the parallel box, the braking lane, the slalom row
  const BAY = (j) => ({ x: pu(6 + 2.7 * j + 1.35), z: pv(37.75), hx: 1.35, hz: 2.75 });
  const PBOX = () => ({ x: pu(52), z: pv(38), hx: 6, hz: 1.5 });
  const LANE = () => ({ x0: pu(4), x1: pu(70), z: pv(19), stop: pu(62) });   // (stop: the zebra's near edge)
  const SLALOM = () => [0, 1, 2, 3, 4, 5].map(k => [pu(10 + 10 * k), pv(8)]);
  const PCONES = () => [[pu(46), pv(36.5)], [pu(58), pv(36.5)], [pu(46), pv(39.5)], [pu(58), pv(39.5)]];
  const DEF_CONES = () => SLALOM().concat(PCONES());
  // the cars parked by the bays: either side of bay 5 (reverse parking), before and behind the parallel box
  const PARKED = () => [{ x: BAY(4).x, z: BAY(4).z + 0.2, h: -Math.PI / 2, col: 0x2a5ab8 }, { x: BAY(6).x, z: BAY(6).z + 0.2, h: Math.PI / 2, col: 0xd8282a },
    { x: pu(43.4), z: pv(38), h: 0, col: 0xf4f4f0 }, { x: pu(60.6), z: pv(38), h: 0, col: 0x3a3f46 }];

  // ---- the cones: one instanced mesh; a knocked one slides, tips over and lies
  const CONE_R = 0.3, CONE_N = 24;
  let cones = [], coneMesh = null;
  function coneBuild() {
    const g = new THREE.ConeGeometry(0.32, 0.8, 12).translate(0, 0.4, 0), n = g.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const y = g.attributes.position.getY(i), w = y > 0.42 && y < 0.56; col[i * 3] = w ? 0.96 : 1; col[i * 3 + 1] = w ? 0.96 : 0.35; col[i * 3 + 2] = w ? 0.94 : 0.06; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    coneMesh = new THREE.InstancedMesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }), CONE_N); coneMesh.castShadow = true; coneMesh.receiveShadow = true; coneMesh.userData.dyn = 1; coneMesh.name = 'schoolCones';
    coneMesh.frustumCulled = false; Render.scene.add(coneMesh);
  }
  const gy = (x, z) => (H3.ground ? H3.ground(x, z) : 0) + (H3.top || 0) + 0.02;
  function conesSet(list) {
    cones = list.slice(0, CONE_N).map(([x, z]) => ({ x, z, x0: x, z0: z, vx: 0, vz: 0, tilt: 0, dir: 0, hit: false, moving: false }));
    if (coneMesh) { coneMesh.count = cones.length; cones.forEach(coneDraw); coneMesh.instanceMatrix.needsUpdate = true; }
  }
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _t = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1), _ax = new THREE.Vector3(0, 0, -1);
  function coneDraw(c, i) { _e.set(0, -c.dir, 0); _q.setFromEuler(_e); _q.multiply(_t.setFromAxisAngle(_ax, c.tilt)); _p.set(c.x, gy(c.x, c.z), c.z); _m.compose(_p, _q, _s); coneMesh.setMatrixAt(i, _m); }
  // the car (its box) against the cones: a cone touched flies off the way the car goes; returns how many were knocked now
  function conesStep(P, dt) {
    if (!coneMesh || !cones.length) return 0;
    let hit = 0, dirty = false; const c = Math.cos(P.h), s = Math.sin(P.h), hl = ((P.m && P.m.len) || 4.4) / 2, hw = ((P.m && P.m.wid) || 1.9) / 2;
    cones.forEach((k, i) => {
      if (!k.hit) {
        const dx = k.x - P.x, dz = k.z - P.z; if (dx * dx + dz * dz > 30) return;
        const lx = dx * c + dz * s, lz = -dx * s + dz * c; if (Math.abs(lx) > hl + CONE_R || Math.abs(lz) > hw + CONE_R) return;
        const sp = Math.hypot(P.vx, P.vz), ex = lx / (hl + CONE_R), ez = lz / (hw + CONE_R), n = Math.hypot(ex * c - ez * s, ex * s + ez * c) || 1;
        k.vx = P.vx * 0.9 + (ex * c - ez * s) / n * (1.5 + sp * 0.2); k.vz = P.vz * 0.9 + (ex * s + ez * c) / n * (1.5 + sp * 0.2); k.dir = Math.atan2(k.vz, k.vx); k.hit = true; k.moving = true; hit++;
      }
      if (k.moving) { k.x += k.vx * dt; k.z += k.vz * dt; const f = Math.max(0, 1 - 3.5 * dt); k.vx *= f; k.vz *= f; k.tilt = Math.min(Math.PI / 2, k.tilt + dt * 9); if (Math.hypot(k.vx, k.vz) < 0.05 && k.tilt >= Math.PI / 2) k.moving = false; coneDraw(k, i); dirty = true; }
    });
    if (dirty) coneMesh.instanceMatrix.needsUpdate = true;
    return hit;
  }

  // ---- the parked cars: a low body, a cabin, glass, four wheels (merged with the other still meshes: js/nvbake.js)
  function parkedCar(p) {
    const g = new THREE.Group(), L = (c) => markMat['p' + c] || (markMat['p' + c] = new THREE.MeshLambertMaterial({ color: c })), B = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; g.add(o); };
    const body = L(p.col), dark = L(0x1c1f24), glass = L(0x3a4a5a);
    B(4.3, 0.62, 1.8, body, 0, 0.62, 0); B(2.3, 0.55, 1.62, glass, -0.25, 1.2, 0); B(2.1, 0.08, 1.56, body, -0.25, 1.5, 0);
    for (const x of [-1.35, 1.35]) for (const z of [-0.82, 0.82]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.24, 10), dark); w.rotation.x = Math.PI / 2; w.position.set(x, 0.33, z); g.add(w); }
    g.position.set(p.x, gy(p.x, p.z) - 0.02, p.z); g.rotation.y = -p.h; MK.add(g);
    const S = H3.solids || (H3.solids = []), ux = Math.cos(p.h), uz = Math.sin(p.h); S.push({ ax: p.x - ux * 1.25, az: p.z - uz * 1.25, bx: p.x + ux * 1.25, bz: p.z + uz * 1.25, r: 0.9 });
    return { x: p.x, z: p.z, h: p.h };
  }
  let parked = [];
  // does the car touch a parked car (its three circles: js/nvwalls.js)?
  function touchParked(P) {
    const c = Math.cos(P.h), s = Math.sin(P.h);
    for (const q of parked) { const ux = Math.cos(q.h), uz = Math.sin(q.h); for (const o of [1.3, 0, -1.3]) { const x = P.x + c * o, z = P.z + s * o, u = Math.max(-1.25, Math.min(1.25, (x - q.x) * ux + (z - q.z) * uz)); if (Math.hypot(x - q.x - ux * u, z - q.z - uz * u) < 0.95 + 0.9 + 0.08) return true; } }
    return false;
  }

  // ---- marks of a task (taken away when it ends): a yellow box on the ground, a gate of two posts, a line
  let marks = [];
  const markMat = {}, mm = (c, o) => markMat[c + (o || '')] || (markMat[c + (o || '')] = new THREE.MeshBasicMaterial(Object.assign({ color: c }, o === 't' ? { transparent: true, opacity: 0.22, depthWrite: false } : {})));
  function mark(o) { o.renderOrder = 2; Render.scene.add(o); marks.push(o); return o; }
  function boxMark(x, z, h, L, W, col = 0xffd34d) {
    const g = new THREE.Group(); g.position.set(x, gy(x, z) + 0.03, z); g.rotation.y = -h;
    for (const [a, b, c2, d2] of [[0, -W / 2, L, 0.22], [0, W / 2, L, 0.22], [-L / 2, 0, 0.22, W], [L / 2, 0, 0.22, W]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(c2, 0.02, d2), mm(col)); m.position.set(a, 0.02, b); g.add(m); }
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(L - 0.3, W - 0.3), mm(col, 't')); gl.rotation.x = -Math.PI / 2; gl.position.y = 0.03; g.add(gl); return mark(g);
  }
  function lineMark(x, z, h, W, col = 0xf4f4f0) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, W), mm(col)); m.position.set(x, gy(x, z) + 0.05, z); m.rotation.y = -h; return mark(m); }
  function gateMark(x, z, h, W, col = 0xffd34d) {
    const g = new THREE.Group(); g.position.set(x, gy(x, z), z); g.rotation.y = -h;
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.2, 8), mm(col)); p.position.set(0, 1.6, s * W / 2); g.add(p); }
    const band = new THREE.Mesh(new THREE.PlaneGeometry(W, 0.5), mm(col, 't')); band.material.side = THREE.DoubleSide; band.rotation.y = Math.PI / 2; band.position.y = 3.0; g.add(band); return mark(g);
  }
  function marksClear() { for (const o of marks) Render.scene.remove(o); marks = []; }

  // ---- the run of a task
  // a task's def: at [x, z, h] (or a function of the run), lim [1st, 2nd, 3rd] seconds (else grade(run): the place), area [x0, x1, z0, z1]
  // (out of it: failed), cones [[x, z]] (else the practice area's), setup(run), step(run, P, dt): run.win() / run.fail(why) / run.hint(text)
  const inArea = (A, x, z) => x > A[0] && x < A[1] && z > A[2] && z < A[3];
  // all four corners of the car inside a box (centre, half sizes along x and z, a margin)
  const carIn = (P, b, m = 0.3) => { const c = Math.cos(P.h), s = Math.sin(P.h), hl = ((P.m && P.m.len) || 4.4) / 2, hw = ((P.m && P.m.wid) || 1.9) / 2; for (const [a, d] of [[hl, hw], [hl, -hw], [-hl, hw], [-hl, -hw]]) { const x = P.x + c * a - s * d, z = P.z + s * a + c * d; if (Math.abs(x - b.x) > b.hx + m || Math.abs(z - b.z) > b.hz + m) return false; } return true; };
  const front = (P) => ({ x: P.x + Math.cos(P.h) * ((P.m && P.m.len) || 4.4) / 2, z: P.z + Math.sin(P.h) * ((P.m && P.m.len) || 4.4) / 2 });
  const kmh = (P) => Math.hypot(P.vx, P.vz) * 3.6;
  // (the car crossed the line through (x, z) across heading h, of half width hw, going that way: from its last spot to this one)
  const crossed = (R, P, x, z, h, hw) => { const c = Math.cos(h), s = Math.sin(h), a = (R.px - x) * c + (R.pz - z) * s, b = (P.x - x) * c + (P.z - z) * s; if (!(a < 0 && b >= 0)) return false; const f = a / (a - b), lx = R.px + (P.x - R.px) * f - x, lz = R.pz + (P.z - R.pz) * f - z; return Math.abs(-lx * s + lz * c) <= hw; };

  function start(l, i) {
    const def = TASKS[l] && TASKS[l][i]; if (!def || !H3) return false;
    stop(true); run = Object.assign(Object.create(RUN), { l, i, def, st: 'fade', t: 0, ft: 0, pen: 0, nHit: 0, cdT: 0, data: {}, holdT: 0, hintTxt: def.hint || '' });   // (the run's tools: run.win(), run.hold() ...)
    showFade(true); setTimeout(() => { if (!run || run.def !== def) return; begin(); showFade(false); }, 260);
    return true;
  }
  function begin() {
    const R = run, def = R.def, P = G.player(); marksClear(); conesSet(def.cones ? def.cones() : DEF_CONES());
    R.at = typeof def.at === 'function' ? def.at(R) : def.at; place(P, R.at); R.px = P.x; R.pz = P.z;
    if (def.setup) def.setup(R); R.st = 'count'; R.cdT = 3; drawHud(); drawCd();
  }
  function place(P, a) { const y = (H3.ground ? H3.ground(a[0], a[1]) : 0) + (H3.top || 0); P.place(a[0], a[1], a[2]); P.y = P.py = P.roadY = y; P.vx = P.vz = 0; P.w = 0; if (Render.resetCam) Render.resetCam(); }
  // a task ends: done (the place from its times or its grade), or failed (4th)
  function end(ok, why) {
    const R = run; if (!R || R.st === 'end') return; R.st = 'end';
    const tt = R.t + R.pen; let pl = 4;
    if (ok) { if (R.def.grade) pl = R.def.grade(R); else { const L = R.def.lim; pl = tt <= L[0] ? 1 : tt <= L[1] ? 2 : tt <= L[2] ? 3 : 4; } }
    R.place = pl; R.why = ok ? (pl === 4 ? 'too slow: 3rd place is ' + fmt(R.def.lim ? R.def.lim[2] : 0) : '') : why || 'failed';
    if (G.record) G.record(R.l, R.i, pl);
    drawCd(); drawHud(); drawCard();
  }
  function stop(quiet) { run = null; marksClear(); if (coneMesh) conesSet(DEF_CONES()); for (const e of [hud, card, cd]) if (e) e.remove(); hud = card = cd = null; if (!quiet && G.closed) G.closed(); }
  // every frame (from NVMenu.tick): the clock, the task's own step, the cones
  function tick(P, on, dtT) {   // (dtT: the tests' own step)
    const now = performance.now(), dt = dtT != null ? dtT : Math.min(0.1, Math.max(0, (now - (last || now)) / 1000)); last = now;
    if (!P) return;
    if (!run) { if (on && cones.length) conesStep(P, dt); return; }
    for (const e of [hud, card, cd]) if (e) e.style.display = on ? '' : 'none';
    if (!on) return;
    const R = run;
    if (R.st === 'count') { place(P, R.at); R.cdT -= dt; drawCd(); if (R.cdT <= 0) { R.st = 'go'; R.goT = 0.8; R.px = P.x; R.pz = P.z; } return; }
    if (R.st === 'end') { conesStep(P, dt); return; }
    if (R.st !== 'go') return;
    if (R.goT > 0) { R.goT -= dt; if (R.goT <= 0) drawCd(); }
    R.t += dt; const h = conesStep(P, dt); if (h) { R.nHit += h; R.pen += 2 * h; R.flash = 1.2; }
    if (R.flash > 0) R.flash -= dt;
    if (R.def.area && !inArea(R.def.area, P.x, P.z)) end(false, 'out of the practice area');
    else R.def.step(R, P, dt);
    R.px = P.x; R.pz = P.z; R.ft += dt; if (R.ft > 0.1 || R.st === 'end') { R.ft = 0; drawHud(); }
  }
  // the run's tools for the tasks
  const RUN = {
    win() { end(true); }, fail(why) { end(false, why); }, hint(t) { this.hintTxt = t; },
    // cond held for secs (resets when it stops holding)
    hold(cond, secs, dt, k = 'h') { this.data[k] = cond ? (this.data[k] || 0) + dt : 0; return this.data[k] >= secs; },
  };

  // ---- on the screen
  function css() {
    if (document.getElementById('nvt-css')) return;
    const s = document.createElement('style'); s.id = 'nvt-css';
    s.textContent = `
#nvt { position: absolute; z-index: 8; left: 50%; top: calc(8px + var(--st, 0px)); transform: translateX(-50%); width: min(440px, calc(100% - 16px - var(--sl, 0px) - var(--sr, 0px))); box-sizing: border-box; background: rgba(9,13,20,.9); border-radius: 14px; border-top: 4px solid var(--c); padding: 7px 10px 8px 12px; color: #fff; font-family: var(--f-ui, Roboto, sans-serif); box-shadow: 0 6px 22px rgba(0,0,0,.5); pointer-events: auto; -webkit-tap-highlight-color: transparent; user-select: none; }
#nvt .r { display: flex; align-items: center; gap: 10px; }
#nvt .k { flex: 1; min-width: 0; font: 800 11px var(--f-ui, Roboto, sans-serif); letter-spacing: 1.3px; color: var(--c); text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#nvt .n { font: 900 italic 18px/1.15 var(--f-ui, Roboto, sans-serif); text-transform: uppercase; }
#nvt .t { font: 900 italic 24px var(--f-ui, Roboto, sans-serif); color: #ffd34d; font-variant-numeric: tabular-nums; }
#nvt .p { font: 900 italic 15px var(--f-ui, Roboto, sans-serif); color: #ff6a50; }
#nvt .p.on { animation: nvtp .4s 2; }
@keyframes nvtp { 50% { transform: scale(1.35); } }
#nvt .h { margin-top: 3px; font: 600 12px/1.35 var(--f-ui, Roboto, sans-serif); color: #d4dae2; }
#nvt .x { flex: none; width: 34px; height: 34px; border-radius: 9px; border: 2px solid rgba(255,255,255,.35); background: rgba(255,255,255,.08); color: #fff; font: 900 18px/1 var(--f-ui, Roboto, sans-serif); padding: 0; cursor: pointer; }
#nvt-cd { position: absolute; z-index: 8; left: 50%; top: 42%; transform: translate(-50%, -50%); font: 900 italic 96px/1 var(--f-ui, Roboto, sans-serif); color: #ffd34d; text-shadow: 0 4px 18px rgba(0,0,0,.7); pointer-events: none; }
#nvt-res { position: absolute; z-index: 9; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(360px, calc(100% - 24px)); box-sizing: border-box; background: rgba(9,13,20,.96); border-radius: 16px; border-top: 4px solid var(--c); padding: 14px 16px 14px; color: #fff; text-align: center; font-family: var(--f-ui, Roboto, sans-serif); box-shadow: 0 8px 30px rgba(0,0,0,.6); pointer-events: auto; }
#nvt-res .k { font: 800 11px var(--f-ui, Roboto, sans-serif); letter-spacing: 1.3px; color: var(--c); text-transform: uppercase; }
#nvt-res h3 { margin: 4px 0 2px; font: 900 italic 22px/1.15 var(--f-ui, Roboto, sans-serif); text-transform: uppercase; }
#nvt-res .pl { margin: 6px 0 2px; font: 900 italic 40px/1.1 var(--f-ui, Roboto, sans-serif); }
#nvt-res .why { font: 600 13px/1.35 var(--f-ui, Roboto, sans-serif); color: #d4dae2; min-height: 18px; }
#nvt-res .bt { display: flex; gap: 8px; margin-top: 12px; }
#nvt-res button { flex: 1; padding: 10px 6px; border: 0; border-radius: 10px; font: 900 italic 17px var(--f-ui, Roboto, sans-serif); text-transform: uppercase; cursor: pointer; }
#nvt-fade { position: fixed; inset: 0; z-index: 20; background: #000; opacity: 0; pointer-events: none; transition: opacity .25s; }
#nvt-fade.on { opacity: 1; }`;
    document.head.appendChild(s);
  }
  const col = () => (run && G.col ? G.col(run.l) : '#23c8ff');
  function showFade(on) { if (!fade) { fade = document.createElement('div'); fade.id = 'nvt-fade'; document.body.appendChild(fade); } fade.classList.toggle('on', on); }
  function drawHud() {
    const R = run; if (!R) return;
    if (!hud) { hud = document.createElement('div'); hud.id = 'nvt'; hud.addEventListener('click', (e) => { if (e.target.closest('.x')) { stop(); } }); host.appendChild(hud); }
    hud.style.setProperty('--c', col());
    const nm = G.name ? G.name(R.l, R.i) : ['', ''], fl = R.flash > 0;
    hud.innerHTML = `<div class="r"><div style="flex:1;min-width:0"><div class="k">${esc(nm[0])} · task ${R.i + 1}</div><div class="n">${esc(nm[1])}</div></div>${R.pen ? `<span class="p${fl ? ' on' : ''}">+${R.pen} s</span>` : ''}<span class="t">${fmt(R.t)}</span><button class="x" aria-label="Give up">×</button></div>` +
      `<div class="h">${esc(R.st === 'end' ? '' : R.hintTxt)}</div>`;
    hud.dataset.st = R.st; hud.dataset.t = R.t.toFixed(2); hud.dataset.pen = R.pen;
  }
  function drawCd() {
    const R = run, txt = R && R.st === 'count' ? String(Math.max(1, Math.ceil(R.cdT))) : R && R.st === 'go' && R.goT > 0 ? 'GO' : '';
    if (!txt) { if (cd) { cd.remove(); cd = null; } return; }
    if (!cd) { cd = document.createElement('div'); cd.id = 'nvt-cd'; host.appendChild(cd); } if (cd.textContent !== txt) cd.textContent = txt;
  }
  function drawCard() {
    const R = run; if (!R) return; if (card) card.remove();
    const nm = G.name ? G.name(R.l, R.i) : ['', ''], c = col(), ok = R.place < 4, pc = ['#ffd34d', '#d6dde5', '#d8935a', '#9aa3ad'][R.place - 1];
    card = document.createElement('div'); card.id = 'nvt-res'; card.style.setProperty('--c', c);
    card.innerHTML = `<div class="k">${esc(nm[0])} · task ${R.i + 1}</div><h3>${esc(nm[1])}</h3><div class="pl" style="color:${pc}">${ORD[R.place - 1]} place</div>` +
      `<div class="why">${esc(ok ? fmt(R.t) + (R.pen ? ' + ' + R.pen + ' s' : '') + ' · ' + [100, 75, 50, 0][R.place - 1] + ' %' : R.why)}</div>` +
      `<div class="bt"><button data-a="again" style="background:${c};color:#111">${esc(tr('Ponovi'))}</button><button data-a="back" style="background:rgba(255,255,255,.14);color:#fff">${esc(tr('Nazaj'))}</button></div>`;
    card.dataset.place = R.place; card.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (!b) return; const l = R.l, i = R.i; if (b.dataset.a === 'again') start(l, i); else { stop(true); home(l); } });
    host.appendChild(card);
  }
  // back to the school's floor, facing out: its menu at the licence
  function home(l) { const P = G.player(), f = G.floor ? G.floor() : null; if (f) { showFade(true); setTimeout(() => { place(P, [f.x, f.z, f.h]); if (G.closed) G.closed(l); showFade(false); }, 260); } else if (G.closed) G.closed(l); }

  // ---- the tasks (the licences' twelve, as js/nvmenu.js LIC lists them)
  const T = {};
  // ROAD 2 · start and stop: 30 m and stop inside the yellow box
  T.startStop = { at: () => [LANE().x0 + 2, LANE().z, 0], lim: [6.5, 8.5, 12], hint: 'Drive off and stop inside the yellow box, 30 m ahead.',
    setup(R) { const L = LANE(); R.data.box = { x: L.x0 + 32, z: L.z, hx: 3, hz: 1.6 }; boxMark(R.data.box.x, R.data.box.z, 0, 6, 3.2); },
    step(R, P, dt) { const b = R.data.box; if (R.hold(carIn(P, b, 0.25) && kmh(P) < 1.5, 1, dt)) R.win(); else if (P.x > b.x + 12) R.fail('past the yellow box'); } };
  // ROAD 3 · brake to the line: 50 km/h by the cones, then stop with the front before the line (the closer the better)
  T.brakeLine = { at: () => [PAD[0] + 2.5, LANE().z, 0], hint: '50 km/h by the cones, then stop just before the white line.',
    setup(R) { const L = LANE(); R.data.gx = pu(38); lineMark(L.stop, L.z, 0, 8); },
    cones: () => [[pu(38), pv(15.4)], [pu(38), pv(22.6)]],
    step(R, P, dt) { const L = LANE(), f = front(P);
      if (!R.data.fast && P.x >= R.data.gx) { if (kmh(P) < 47) return R.fail('too slow at the cones: ' + Math.round(kmh(P)) + ' km/h, 50 needed'); R.data.fast = true; R.hint('Now brake: stop just before the white line.'); }
      if (f.x > L.stop + 0.15) return R.fail('over the line');
      if (R.data.fast && R.hold(kmh(P) < 1, 0.6, dt)) { R.data.gap = L.stop - f.x; R.win(); } },
    grade: (R) => { const g = R.data.gap; return g <= 0.6 ? 1 : g <= 1.5 ? 2 : g <= 3 ? 3 : 4; } };
  // ROAD 4 · slalom: 6 cones, left of the first, right of the second ..., over the line after the last
  T.slalom = { at: () => [PAD[0] + 2.5, pv(8), 0], lim: [11, 14, 19], hint: 'Weave through the 6 cones: the first on your right.',
    cones: () => DEF_CONES(), setup(R) { lineMark(pu(70), pv(8), 0, 9); R.data.k = 0; },
    step(R, P) { const S = SLALOM(); if (Math.abs(P.z - pv(8)) > 7.5) return R.fail('off the slalom');
      while (R.data.k < S.length && P.x >= S[R.data.k][0]) { const k = R.data.k, side = k % 2 ? 1 : -1; if ((P.z - S[k][1]) * side <= 0) return R.fail('wrong side of cone ' + (k + 1)); R.data.k++; }
      if (R.data.k >= S.length && P.x >= pu(70)) R.win(); } };
  // ROAD 5 · figure of eight: twice round two cones, one each way
  const E8 = () => ({ a: [pu(84), pv(10)], b: [pu(84), pv(30)], mz: pv(20) });
  T.eight = { at: () => [pu(76), E8().mz, Math.PI / 2], lim: [19, 24, 32], hint: 'Two figures of eight round the two cones.',
    cones: () => [E8().a, E8().b].concat(PCONES()), area: [pu(70), PAD[1] + 1, PAD[2] - 1, PAD[3] + 1],
    setup(R) { R.data.wa = 0; R.data.wb = 0; R.data.aa = null; R.data.ab = null; },
    step(R, P) { const E = E8(), D = R.data;
      for (const [c, k, ka] of [[E.a, 'wa', 'aa'], [E.b, 'wb', 'ab']]) { const a = Math.atan2(P.z - c[1], P.x - c[0]), near = (c === E.a ? P.z < E.mz + 2 : P.z > E.mz - 2) && Math.hypot(P.x - c[0], P.z - c[1]) < 14; if (near && D[ka] != null) { let d = a - D[ka]; d -= Math.round(d / (2 * Math.PI)) * 2 * Math.PI; D[k] += d; } D[ka] = near ? a : null; }
      const full = 4 * Math.PI * 0.92; R.hint(`Round each cone twice, one each way: ${Math.min(2, Math.floor(Math.abs(D.wa) / (2 * Math.PI) + 0.08))} / 2 · ${Math.min(2, Math.floor(Math.abs(D.wb) / (2 * Math.PI) + 0.08))} / 2`);
      if (Math.abs(D.wa) >= full && Math.abs(D.wb) >= full) { if (D.wa * D.wb > 0) return R.fail('both cones the same way round: a figure of eight goes one each way'); R.win(); } } };
  // ROAD 6 · reverse parking: back into bay 5 between the two cars
  T.reversePark = { at: () => [pu(4), pv(28), 0], lim: [13, 18, 26], hint: 'Back into the free bay between the two cars.', area: [PAD[0] - 1, PAD[1] + 1, PAD[2] - 1, PAD[3] + 1],
    setup(R) { const b = BAY(5); boxMark(b.x, b.z, Math.PI / 2, 5.3, 2.5); },
    step(R, P, dt) { if (touchParked(P)) { if (!R.data.tc) { R.pen += 2; R.flash = 1.2; } R.data.tc = 1; } else R.data.tc = 0;
      const b = BAY(5), inB = carIn(P, { x: b.x, z: b.z, hx: b.hx, hz: b.hz }, 0.25), back = Math.sin(P.h) < -0.96;
      if (inB && !back && Math.sin(P.h) > 0.9) R.hint('Nose in: drive out and reverse in.');
      if (R.hold(inB && back && kmh(P) < 1, 1, dt)) R.win(); } };
  // ROAD 7 · parallel parking: between the two cars, along the kerb
  T.parallel = { at: () => [pu(26), pv(30), 0], lim: [15, 20, 30], hint: 'Reverse into the box between the two cars.', area: [PAD[0] - 1, PAD[1] + 1, PAD[2] - 1, PAD[3] + 1],
    step(R, P, dt) { if (touchParked(P)) { if (!R.data.tc) { R.pen += 2; R.flash = 1.2; } R.data.tc = 1; } else R.data.tc = 0;
      const B = PBOX(); if (R.hold(carIn(P, B, 0.3) && Math.abs(Math.sin(P.h)) < 0.17 && kmh(P) < 1, 1, dt)) R.win(); } };
  // ROAD 11 · lane change: at 60 km/h into the left lane between the cones and back, touch none
  const LC = () => ({ a: pv(19), b: pv(13.5), g: [[pu(34), 'a'], [pu(40), 'a'], [pu(54), 'b'], [pu(60), 'b'], [pu(74), 'a'], [pu(80), 'a']] });
  T.laneChange = { at: () => [PAD[0] + 2.5, pv(19), 0], hint: 'Over 50 km/h at the first cones, to the left lane and back.',
    cones: () => { const L = LC(), o = []; for (const [x, k] of L.g) { const z = L[k]; o.push([x, z - 1.9], [x, z + 1.9]); } return o.concat(PCONES()); },
    step(R, P) { const L = LC(); R.data.k = R.data.k || 0;
      while (R.data.k < L.g.length && P.x >= L.g[R.data.k][0]) { const [x, k] = L.g[R.data.k]; if (R.data.k === 0) { if (kmh(P) < 50) return R.fail('too slow at the first cones: ' + Math.round(kmh(P)) + ' km/h'); R.data.v = kmh(P); } if (Math.abs(P.z - L[k]) > 2.2) return R.fail('outside the cones'); R.data.k++; }
      if (R.data.k >= L.g.length && P.x > pu(86)) R.win(); },
    grade: (R) => Math.min(4, 1 + R.nHit) };
  // ROAD 12 · the exam: the slalom, the braking lane's box, reverse parking, in one run
  T.examRoad = { at: () => [PAD[0] + 2.5, pv(8), 0], lim: [55, 70, 90], area: [PAD[0] - 6, PAD[1] + 2, PAD[2] - 3, PAD[3] + 2], hint: 'Slalom: the first cone on your right.',
    cones: () => DEF_CONES(),
    setup(R) { R.data.ph = 0; R.data.k = 0; lineMark(pu(70), pv(8), 0, 9); },
    step(R, P, dt) { const D = R.data, S = SLALOM(), L = LANE();
      if (touchParked(P)) { if (!D.tc) { R.pen += 2; R.flash = 1.2; } D.tc = 1; } else D.tc = 0;
      if (D.ph === 0) { while (D.k < S.length && P.x >= S[D.k][0]) { const k = D.k, side = k % 2 ? 1 : -1; if ((P.z - S[k][1]) * side <= 0) return R.fail('wrong side of cone ' + (k + 1)); D.k++; }
        if (D.k >= S.length && P.x >= pu(70)) { D.ph = 1; marksClear(); D.box = { x: pu(44), z: L.z, hx: 3, hz: 1.6 }; boxMark(D.box.x, D.box.z, 0, 6, 3.2); R.hint('Turn round, back to the start of the braking lane, and stop inside the yellow box.'); } }
      else if (D.ph === 1) { if (R.hold(carIn(P, D.box, 0.25) && kmh(P) < 1.5 && Math.cos(P.h) > 0.9, 1, dt, 'b')) { D.ph = 2; marksClear(); const b = BAY(5); boxMark(b.x, b.z, Math.PI / 2, 5.3, 2.5); R.hint('Now back into the free bay between the two cars.'); } }
      else { const b = BAY(5); if (R.hold(carIn(P, { x: b.x, z: b.z, hx: b.hx, hz: b.hz }, 0.25) && Math.sin(P.h) < -0.96 && kmh(P) < 1, 1, dt, 'p')) R.win(); } } };
  // (the practice area and a metre round it)
  for (const k of ['startStop', 'brakeLine', 'slalom', 'laneChange']) if (!T[k].area) T[k].area = [PAD[0] - 1, PAD[1] + 1, PAD[2] - 1, PAD[3] + 1];

  // ROAD 1 · a lap of the track: from the line by the practice area, 4 checkpoints, back over the line
  T.lap = { lim: [100, 115, 130], hint: 'A lap of the track: through the 4 gates, back over the line.',
    at: (R) => { const t = G.track(), n = t.px.length; let bi = 0, bd = 1e18; for (let i = 0; i < n; i += 2) { const d = (t.px[i] - pu(48)) ** 2 + (t.pz[i] - PAD[2]) ** 2; if (d < bd) { bd = d; bi = i; } } R.data.i0 = bi; return [t.px[bi], t.pz[bi], t.hd[bi]]; },
    setup(R) { const t = G.track(), n = t.px.length, w = t.w || 7; R.data.cp = [1, 2, 3, 4].map(k => (R.data.i0 + Math.round(n * k / 4)) % n); R.data.k = 0; R.data.off = 0; this.gate(R); },
    gate(R) { marksClear(); const t = G.track(), i = R.data.cp[R.data.k]; if (i == null) return; gateMark(t.px[i], t.pz[i], t.hd[i], (t.w || 7) * 2 + 2); },
    step(R, P, dt) { const t = G.track(), D = R.data, i = D.cp[D.k], w = t.w || 7;
      const off = H3.TL ? H3.TL.dist(P.x, P.z, 40) > w + 8 : false; D.off = off ? D.off + dt : 0; if (D.off > 2.5) return R.fail('off the track');
      if (crossed(R, P, t.px[i], t.pz[i], t.hd[i], w + 3)) { D.k++; if (D.k >= 4) return R.win(); this.gate(R); R.hint(D.k === 3 ? 'The last gate: the line.' : `Gate ${D.k + 1} of 4.`); } } };

  // the licences' tasks in the menu's order (null: not built yet, START says V IZDELAVI)
  const TASKS = { c: [T.lap, T.startStop, T.brakeLine, T.slalom, T.eight, T.reversePark, T.parallel, null, null, null, T.laneChange, T.examRoad], m: [], k: [] };

  // ---- set up with the new map (from NVMenu.init): the bridge (player, track, the menu's names and colours, record a place, the menu again)
  function init(h3, o = {}) {
    H3 = h3; MK = window.MK; G = Object.assign({ player: () => MK.P(), track: () => MK.T() }, o); css(); run = null; last = 0;
    host = (document.getElementById('hud') || document.body).parentElement || document.body;
    if (H3.PAD) PAD = H3.PAD;
    if (!coneMesh) coneBuild(); else if (!coneMesh.parent) Render.scene.add(coneMesh);
    conesSet(DEF_CONES()); parked = MK && MK.add ? PARKED().map(parkedCar) : [];
  }
  const has = (l, i) => !!(TASKS[l] && TASKS[l][i]);
  const active = () => !!run;
  const state = () => run ? { l: run.l, i: run.i, st: run.st, t: +run.t.toFixed(2), pen: run.pen, place: run.place || 0, why: run.why || '', hint: run.hintTxt, data: Object.assign({}, run.data) } : null;
  const conesNow = () => cones.map(c => ({ x: +c.x.toFixed(2), z: +c.z.toFixed(2), hit: c.hit }));
  return { init, tick, start, stop, has, active, state, cones: conesNow, TASKS, PAD: () => PAD, BAY, PBOX, LANE, SLALOM, E8, LC };
})();
