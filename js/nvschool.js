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
    const R = run, def = R.def, P = G.player(); marksClear();
    R.at = typeof def.at === 'function' ? def.at(R) : def.at; conesSet(def.cones ? def.cones(R) : DEF_CONES()); place(P, R.at); R.px = P.x; R.pz = P.z;
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
  T.slalom = { at: () => [PAD[0] + 2.5, pv(8), 0], lim: [12, 17, 25], hint: 'Weave through the 6 cones: the first on your right.',
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
      const full = 4 * Math.PI * 0.88; R.hint(`Round each cone twice, one each way: ${Math.min(2, Math.floor(Math.abs(D.wa) / (2 * Math.PI) + 0.08))} / 2 · ${Math.min(2, Math.floor(Math.abs(D.wb) / (2 * Math.PI) + 0.08))} / 2`);
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

  // ---- tasks along a way (the gravel roads in the field, the hill's switchbacks, the snowy forest road): the way as points every metre
  // (segs: [curve, u0, u1] one after another), the car kept on it (off by more than its half width and a bit for 1.5 s: failed), finished at its end
  function wayPts(segs) {
    const o = []; for (const [cv, u0, u1] of segs) { const n = Math.max(2, Math.ceil(cv.getLength() * Math.abs(u1 - u0))); for (let k = 0; k <= n; k++) { const q = cv.getPointAt(u0 + (u1 - u0) * k / n), b = o[o.length - 1]; if (!b || Math.hypot(q.x - b.x, q.z - b.z) > 0.5) o.push({ x: q.x, z: q.z }); } }
    let s = 0; o.forEach((p, i) => { if (i) s += Math.hypot(p.x - o[i - 1].x, p.z - o[i - 1].z); p.s = s; const a = o[Math.max(0, i - 1)], b = o[Math.min(o.length - 1, i + 1)]; p.h = Math.atan2(b.z - a.z, b.x - a.x); }); return o;
  }
  // the nearest point of the way about the last one: its index, metres along, the car's offset to the right
  function wayAt(W, x, z, k0) { let bk = k0, bd = 1e18; for (let k = Math.max(0, k0 - 20); k < Math.min(W.length, k0 + 30); k++) { const d = (W[k].x - x) ** 2 + (W[k].z - z) ** 2; if (d < bd) { bd = d; bk = k; } } const p = W[bk]; return { k: bk, s: p.s, p, lat: -(x - p.x) * Math.sin(p.h) + (z - p.z) * Math.cos(p.h) }; }
  const wayK = (W, s) => { let k = 0; while (k < W.length - 1 && W[k].s < s) k++; return k; };
  const wayPos = (W, s, off = 0) => { const p = W[wayK(W, s)]; return [p.x - Math.sin(p.h) * off, p.z + Math.cos(p.h) * off, p.h]; };
  // the three times from the way's length and the speed of a 1st place (m/s): 1st, 2nd at 80 %, 3rd at 60 % of it
  const limOf = (L, v) => [Math.round(L / v), Math.round(L / v / 0.8), Math.round(L / v / 0.6)];
  // o: segs(H3), hw (half width), from / to (metres; to null: the end), v (1st place's speed) or lim, rev (driven in reverse), poles [[s, off]],
  // gates [s] (through them), need { s, kmh } (at least), vmax (km/h, never over), box s (stop in it), back (end facing back), step(R, P, dt, w)
  function wayTask(o) {
    return { hint: o.hint, lim: o.lim, grade: o.grade,
      at(R) { const W = R.data.W = wayPts(o.segs(H3)), sp = o.span ? o.span(W) : [o.from || 0, o.to != null ? o.to : W[W.length - 1].s], to = R.data.to = sp[1]; R.data.k = wayK(W, sp[0]); R.data.off = 0; R.data.vT = 0; R.data.g = 0;
        if (!this.lim && !this.grade) this.lim = limOf(to - sp[0], o.v || 10);
        const a = wayPos(W, sp[0]); return [a[0], a[1], a[2] + (o.rev ? Math.PI : 0)]; },
      cones: (R) => (o.poles || []).map(([s, off]) => wayPos(R.data.W, s, off).slice(0, 2)),
      setup(R) { const W = R.data.W; for (const g of (o.gates || [])) { const a = wayPos(W, g); gateMark(a[0], a[1], a[2], o.hw * 2 + 0.6); }
        if (o.box != null) { const a = wayPos(W, o.box); boxMark(a[0], a[1], a[2], 6, Math.min(3.4, o.hw * 2)); }
        if (o.need) { const a = wayPos(W, o.need.s); lineMark(a[0], a[1], a[2] + Math.PI / 2, o.hw * 2, 0xffd34d); }
        if (o.box == null && !o.back) { const a = wayPos(W, R.data.to); lineMark(a[0], a[1], a[2] + Math.PI / 2, o.hw * 2); }
        if (o.setup) o.setup(R); },
      step(R, P, dt) { const D = R.data, W = D.W, w = wayAt(W, P.x, P.z, D.k); D.k = w.k; D.s = w.s;
        D.off = Math.abs(w.lat) > o.hw + 1.2 ? D.off + dt : 0; if (D.off > 1.5) return R.fail('off the road');
        const gs = o.gates || []; if (D.g < gs.length && w.s >= gs[D.g]) { if (Math.abs(w.lat) > o.hw + 0.3) return R.fail('missed gate ' + (D.g + 1)); D.g++; }
        if (o.need && !D.need && w.s >= o.need.s) { if (kmh(P) < o.need.kmh) return R.fail('too slow: ' + Math.round(kmh(P)) + ' km/h, ' + o.need.kmh + ' needed'); D.need = 1; }
        if (o.vmax) { D.vT = kmh(P) > o.vmax + 2 ? D.vT + dt : 0; if (D.vT > 0.4) return R.fail('over ' + o.vmax + ' km/h'); }
        if (o.rev && kmh(P) > 2 && Math.cos(P.h - w.p.h) > -0.7) return R.fail('turned round: in reverse all the way');
        if (o.step && o.step(R, P, dt, w) === false) return;
        if (R.st === 'end') return;
        if (o.box != null) { if (R.hold(Math.abs(w.s - o.box) < 1.4 && Math.abs(w.lat) < 1.2 && kmh(P) < 1.5, 1, dt)) R.win(); else if (w.s > o.box + 10) R.fail('past the box'); return; }
        if (o.back) return;
        if (w.s >= D.to - 0.5) R.win(); } };
  }
  const WAY = { p6: (h) => [[h.paths[6].cv, 0, 1]], over: (h) => [[h.roads.over.cv, 0, 1]], forest: (h) => [[h.roads.forest.cv, 0, 1]], p18: (h) => [[h.paths[18].cv, 0, 1]],
    up: (h) => [[h.hill.paths[0].cv, 0, 1]], down: (h) => [[h.hill.paths[6].cv, 0, 1]], lap: (h) => [[h.hill.paths[0].cv, 0, 1], [h.hill.paths[1].cv, 0, 0.66], [h.hill.paths[6].cv, 0, 1]] };

  // ---- the gravel arena: the open meadow west of the gravel road over the hill (the meadow drives as gravel: js/newmap.js surfGrid)
  const AR = { x: -188, z: 24 }, arIn = [AR.x - 22, AR.x + 22, AR.z - 18, AR.z + 18];
  // the car's slide: the angle between where it points and where it goes (0 when slow)
  const slip = (P) => { const v = Math.hypot(P.vx, P.vz); if (v < 3) return 0; let d = Math.atan2(P.vz, P.vx) - P.h; d -= Math.round(d / (2 * Math.PI)) * 2 * Math.PI; return Math.abs(d); };
  // the winding of the car round a point (radians, + one way): from its last spot to this one
  const wind = (R, P, c, key) => { const a = Math.atan2(P.z - c[1], P.x - c[0]), b = Math.atan2(R.pz - c[1], R.px - c[0]); let d = a - b; d -= Math.round(d / (2 * Math.PI)) * 2 * Math.PI; R.data[key] = (R.data[key] || 0) + d; return R.data[key]; };

  // GRAVEL 1 · the gravel course: the gravel road along the north, end to end
  const M = [];
  M[0] = wayTask({ segs: WAY.p6, hw: 2.7, v: 14, hint: 'The whole gravel road to the line, never off it.' });
  // GRAVEL 2 · braking on gravel: 40 km/h at the yellow line, then stop inside the box
  M[1] = wayTask({ segs: WAY.p6, hw: 2.7, from: 2, need: { s: 42, kmh: 40 }, box: 70, lim: [8, 10, 14], hint: '40 km/h at the yellow line, then stop inside the box: gravel needs longer.' });
  // GRAVEL 3 · a gravel corner: through 3 gates round the bends
  M[2] = wayTask({ segs: WAY.p6, hw: 2.7, from: 115, to: 215, gates: [140, 165, 190], v: 12, hint: 'Round the bends through the 3 gates.' });
  // GRAVEL 4 · pole slalom: 6 poles on the road, touch none
  M[3] = wayTask({ segs: WAY.p6, hw: 2.7, from: 215, to: 315, poles: [0, 1, 2, 3, 4, 5].map(k => [235 + k * 12, k % 2 ? 1.1 : -1.1]), v: 11, hint: 'Past the 6 poles, touch none.' });
  // GRAVEL 5 · the gravel eight: twice round two poles on the meadow, one each way
  const GE = () => ({ a: [AR.x - 8, AR.z], b: [AR.x + 8, AR.z] });
  M[4] = { at: [AR.x, AR.z + 8, -Math.PI / 2], lim: [20, 26, 34], area: arIn, cones: () => [GE().a, GE().b], hint: 'Two figures of eight round the two poles.',
    step(R, P) { const E = GE(), wa = P.x < AR.x + 2 ? wind(R, P, E.a, 'wa') : R.data.wa || 0, wb = P.x > AR.x - 2 ? wind(R, P, E.b, 'wb') : R.data.wb || 0, full = 4 * Math.PI * 0.88, n = (w) => Math.min(2, Math.floor(Math.abs(w) / (2 * Math.PI) + 0.08));
      R.hint(`Round each pole twice, one each way: ${n(wa)} / 2 · ${n(wb)} / 2`);
      if (Math.abs(wa) >= full && Math.abs(wb) >= full) { if (wa * wb > 0) return R.fail('both poles the same way round: a figure of eight goes one each way'); R.win(); } } };
  // GRAVEL 6 · drift: round the cone sliding (the car 15° and more across its way) for 3 s in one go
  M[5] = { at: [AR.x - 14, AR.z + 8, 0], lim: [8, 12, 18], area: arIn, cones: () => [[AR.x, AR.z]], hint: 'Slide round the cone: 3 seconds across.',
    step(R, P, dt) { const d = Math.hypot(P.x - AR.x, P.z - AR.z), on = slip(P) > 0.26 && d > 3 && d < 14; R.data.dr = on ? (R.data.dr || 0) + dt : Math.max(0, (R.data.dr || 0) - dt * 2);
      R.hint(`Slide round the cone: ${Math.min(3, R.data.dr).toFixed(1)} / 3 s`); if (R.data.dr >= 3) R.win(); } };
  // GRAVEL 7 · a small jump: over the crest on the forest road, land straight on the road
  const crestS = (W) => { const c = H3.kick2 || { x: -197, z: -79 }; let bk = 0, bd = 1e18; W.forEach((p, k) => { const d = (p.x - c.x) ** 2 + (p.z - c.z) ** 2; if (d < bd) { bd = d; bk = k; } }); return W[bk].s; };
  M[6] = wayTask({ segs: WAY.forest, hw: 3.1, span: (W) => { const c = crestS(W); return [Math.max(0, c - 50), c + 40]; }, lim: [8, 10, 13], hint: 'Over the crest at speed, land straight on the road.',
    setup(R) { R.data.cs = crestS(R.data.W); },
    step(R, P, dt, w) { const D = R.data; if (!D.air && P.y > (H3.ground ? H3.ground(P.x, P.z) : 0) + 0.35) D.air = 1;
      if (!D.top && w.s >= D.cs) { D.top = 1; if (kmh(P) < 30) { R.fail('too slow over the crest: ' + Math.round(kmh(P)) + ' km/h, 30 needed'); return false; } }
      if (D.top && w.s > D.cs + 6 && Math.abs(Math.cos(P.h - w.p.h)) < 0.9) { R.fail('landed crooked'); return false; } } });
  // GRAVEL 8 · wiggles: the winding gravel road over the hill's shoulder, under the time
  M[7] = wayTask({ segs: WAY.over, hw: 3.1, to: 150, v: 11, hint: 'The winding road to the line, never off it.' });
  // GRAVEL 9 · turn on a narrow road: face the other way without leaving it
  M[8] = wayTask({ segs: WAY.p18, hw: 2.6, from: 36, back: true, lim: [10, 15, 22], hint: 'Turn the car round on the road, then drive off the other way.',
    step(R, P) { const w = wayAt(R.data.W, P.x, P.z, R.data.k); if (Math.cos(P.h - w.p.h) < -0.9 && kmh(P) > 4 && P.vx * Math.cos(P.h) + P.vz * Math.sin(P.h) > 0) R.win(); } });
  // GRAVEL 10 · handbrake turn: round the post and back over the line, in one go (never backwards)
  M[9] = { at: [AR.x - 20, AR.z, 0], lim: [6, 8, 11], area: arIn, cones: () => [[AR.x + 6, AR.z]], hint: 'Round the post and back over the line, never backwards.',
    setup() { lineMark(AR.x - 16, AR.z, Math.PI / 2, 8); },
    step(R, P) { if (kmh(P) > 2 && P.vx * Math.cos(P.h) + P.vz * Math.sin(P.h) < 0) return R.fail('backwards: in one go'); const w = wind(R, P, [AR.x + 6, AR.z], 'w');
      if (Math.abs(w) > Math.PI * 0.9 && P.x < AR.x - 16) R.win(); } };
  // GRAVEL 11 · the forest road: all of it, up and over the hill's snowy shoulder
  M[10] = wayTask({ segs: WAY.forest, hw: 3.1, v: 11, hint: 'The whole forest road to the line, never off it.' });
  // GRAVEL 12 · the exam: the gravel course with 6 poles, under the time, at most 2 poles down
  M[11] = wayTask({ segs: WAY.p6, hw: 2.7, poles: [0, 1, 2, 3, 4, 5].map(k => [235 + k * 12, k % 2 ? 1.1 : -1.1]), v: 13, hint: 'The gravel course: at most 2 poles down.',
    step(R) { if (R.nHit > 2) { R.fail('3 poles down'); return false; } } });

  // HILL: up the switchbacks (hill 0), the ring at the top (1), down the other side (6); the snowy forest road
  const K = [];
  K[0] = wayTask({ segs: WAY.lap, hw: 2.6, v: 9, hint: 'Up the switchbacks, round the top and down the other side.' });
  // HILL 2 · hill start: stop in the box on the slope, then pull away up without rolling back
  K[1] = wayTask({ segs: WAY.up, hw: 2.6, from: 85, back: true, lim: [10, 14, 20], hint: 'Stop inside the box on the slope.',
    setup(R) { const a = wayPos(R.data.W, 100); boxMark(a[0], a[1], a[2], 6, 3.4); },
    step(R, P, dt, w) { const D = R.data; if (!D.st0) { if (R.hold(Math.abs(w.s - 100) < 1.4 && kmh(P) < 1, 1.5, dt)) { D.st0 = w.s; R.hint('Now pull away up the hill: do not roll back.'); } else if (w.s > 112) { R.fail('past the box'); return false; } return; }
      if (w.s < D.st0 - 0.6) { R.fail('rolled back'); return false; } if (w.s > D.st0 + 12) R.win(); } });
  // HILL 3 · a steady climb: up to the first bend between 20 and 45 km/h
  K[2] = wayTask({ segs: WAY.up, hw: 2.6, to: 60, v: 9, vmax: 45, hint: 'Up to the first bend between 20 and 45 km/h.',
    step(R, P, dt) { if (R.t > 4) { R.data.slow = kmh(P) < 18 ? (R.data.slow || 0) + dt : 0; if (R.data.slow > 1) { R.fail('under 20 km/h'); return false; } } } });
  // HILL 4 · the first switchback without leaving the road
  K[3] = wayTask({ segs: WAY.up, hw: 2.6, from: 50, to: 130, v: 8, hint: 'Round the first switchback, stay on the road.' });
  // HILL 5 · braking downhill: down to the box, never over 40 km/h
  K[4] = wayTask({ segs: WAY.down, hw: 2.6, from: 90, box: 150, vmax: 40, lim: [12, 15, 20], hint: 'Down to the box, never over 40 km/h.' });
  // HILL 6 · stop in the circle at the top
  K[5] = wayTask({ segs: (h) => [[h.hill.paths[0].cv, 0, 1], [h.hill.paths[1].cv, 0, 0.3]], hw: 2.6, from: 200, back: true, lim: [9, 12, 17], hint: 'Stop in the circle at the top of the hill.',
    setup(R) { const W = R.data.W, s = W[W.length - 1].s - 12, a = wayPos(W, s); R.data.cs = s; const g = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.15, 32), mm(0xffd34d)); g.rotation.x = -Math.PI / 2; g.position.set(a[0], gy(a[0], a[1]) + 0.05, a[1]); mark(g); R.data.c = a; },
    step(R, P, dt) { const c = R.data.c; if (R.hold(Math.hypot(P.x - c[0], P.z - c[1]) < 1.8 && kmh(P) < 1, 1, dt)) R.win(); } });
  // HILL 7 · all the switchbacks up
  K[6] = wayTask({ segs: WAY.up, hw: 2.6, v: 9, hint: 'All the switchbacks up to the line at the top.' });
  // HILL 8 · 20 m in reverse up the straight part
  K[7] = wayTask({ segs: WAY.up, hw: 2.6, from: 98, to: 118, rev: true, lim: [8, 11, 16], hint: 'Back up the straight 20 m, in reverse all the way.' });
  // HILL 9 · all the switchbacks down
  K[8] = wayTask({ segs: WAY.down, hw: 2.6, v: 9, hint: 'All the switchbacks down to the line.' });
  // HILL 10 · the snow climb: up the snowy forest road to its top
  K[9] = wayTask({ segs: WAY.forest, hw: 3.1, from: 20, to: 113, v: 8, hint: 'Up the snowy road to the top, do not slide off.' });
  // HILL 11 · the snow descent: down the snowy road, never over 40 km/h
  K[10] = wayTask({ segs: WAY.forest, hw: 3.1, from: 113, to: 190, v: 8, vmax: 40, hint: 'Down the snowy road, never over 40 km/h.' });
  // HILL 12 · the exam: up and down, under the time, never off the road
  K[11] = wayTask({ segs: WAY.lap, hw: 2.6, v: 10, hint: 'The exam: up, round the top and down, never off the road.' });

  // ROAD 8 · the junction: up the way to the boxes, right onto road 2, in your own lane (the right half)
  const NV = () => (typeof NVBase !== 'undefined' && NVBase.ROUTE) || [[-41.5, 41], [-33, 72], [-21, 87]];
  T.cross = wayTask({ segs: (h) => { const j = h.net.find(e => e.id === 'jump'), r = NV().slice().reverse(), c1 = new THREE.CatmullRomCurve3(r.map(([x, z]) => new THREE.Vector3(x, 0, z))), q = j.cv; let bu = 0, bd = 1e18; for (let u = 0; u <= 1; u += 0.002) { const p = q.getPointAt(u), d = (p.x - r[r.length - 1][0]) ** 2 + (p.z - r[r.length - 1][1]) ** 2; if (d < bd) { bd = d; bu = u; } } return [[c1, 0.55, 1], [q, bu, Math.min(1, bu + 0.25)]]; },
    hw: 3.5, v: 9, hint: 'Up to the road, turn right, keep in your own lane.',
    step(R, P, dt, w) { R.data.wr = w.lat < -0.3 ? (R.data.wr || 0) + dt : 0; if (R.data.wr > 1.2) { R.fail('in the wrong lane: keep right'); return false; } } });
  // ROAD 9 · the emergency stop: speed up on the track, when the red board lights up stop before it
  T.estop = { hint: 'Speed up to 80 km/h. When the red board lights up, stop before it!',
    at(R) { const t = G.track(), n = t.px.length; let bi = 0, bd = 1e18; for (let i = 0; i < n; i += 2) { const d = (t.px[i] - pu(48)) ** 2 + (t.pz[i] - PAD[2]) ** 2; if (d < bd) { bd = d; bi = i; } } R.data.i0 = bi; return [t.px[bi], t.pz[bi], t.hd[bi]]; },
    step(R, P, dt) { const t = G.track(), n = t.px.length, ds = t.ds || 1, D = R.data;
      const near = H3.TL ? H3.TL.near(P.x, P.z, 40) : { k: -1, d: 0 }; if (near.k < 0 || near.d > (t.w || 7) + 8) return R.fail('off the track');
      const go = ((near.k - D.i0 + n) % n) * ds;
      if (!D.ob) { if (kmh(P) >= 75) { const i = (near.k + Math.round(45 / ds)) % n; D.ob = i; gateMark(t.px[i], t.pz[i], t.hd[i], (t.w || 7) * 2, 0xd8282a); R.hint('STOP! Stop before the red board.'); } else if (go > 400) R.fail('not up to 75 km/h in 400 m'); return; }
      const i = D.ob, fr = front(P), c = Math.cos(t.hd[i]), s = Math.sin(t.hd[i]), gap = (t.px[i] - fr.x) * c + (t.pz[i] - fr.z) * s;
      if (gap < -0.2) return R.fail('through the red board');
      if (R.hold(kmh(P) < 1, 0.6, dt)) { D.gap = gap; R.win(); } },
    grade: (R) => { const g = R.data.gap; return g <= 6 ? 1 : g <= 12 ? 2 : g <= 20 ? 3 : 4; } };
  // ROAD 10 · the roundabout: the park's first plaza, once round the fountain anticlockwise, out to the next plaza
  const RB = () => (typeof NVPark !== 'undefined' && NVPark.J) || null;
  T.round = { hint: 'Into the roundabout, once round the fountain (on your left), out to the next plaza.', lim: [14, 18, 25],
    at: () => [72, 3, Math.atan2(-10, -10)],
    step(R, P, dt) { const J = RB(); if (!J) return R.fail('no roundabout'); const [cx, cz, r] = J.PL.F, d = Math.hypot(P.x - cx, P.z - cz), w = d < r + 8 ? wind(R, P, [cx, cz], 'w') : R.data.w || 0;
      if (w > 0.6) return R.fail('the wrong way round: keep the fountain on your left');
      const n = Math.min(1, -w / (2 * Math.PI)); R.hint(n > 0.85 ? 'Out to the next plaza.' : `Round the fountain: ${Math.round(n * 100)} %`);
      const [ex, ez] = J.LANES[1][3]; if (Math.hypot(P.x - ex, P.z - ez) < 6) { if (-w < 2 * Math.PI * 0.8) return R.fail('out too soon: once round the fountain'); R.win(); } } };

  // the licences' tasks in the menu's order (null: not built yet, START says V IZDELAVI)
  const TASKS = { c: [T.lap, T.startStop, T.brakeLine, T.slalom, T.eight, T.reversePark, T.parallel, T.cross, T.estop, T.round, T.laneChange, T.examRoad], m: M, k: K };

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
  const state = () => run ? { l: run.l, i: run.i, st: run.st, t: +run.t.toFixed(2), pen: run.pen, place: run.place || 0, why: run.why || '', hint: run.hintTxt, data: Object.fromEntries(Object.entries(run.data).filter(([k]) => k !== 'W')) } : null;
  const way = () => run && run.data.W ? run.data.W.map(p => [+p.x.toFixed(2), +p.z.toFixed(2), +p.s.toFixed(1), +p.h.toFixed(3)]) : null;   // (the tests: the task's way)
  const conesNow = () => cones.map(c => ({ x: +c.x.toFixed(2), z: +c.z.toFixed(2), hit: c.hit }));
  return { init, tick, start, stop, has, active, state, way, cones: conesNow, TASKS, PAD: () => PAD, BAY, PBOX, LANE, SLALOM, E8, LC };
})();
