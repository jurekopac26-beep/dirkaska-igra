// Padec čez rob (a car over the road's edge into a ravine) as the game shows it. Where a track knows the ground beyond its edge (Track.floor)
// a car over the edge becomes a falling rigid body (js/core.js fallBody: c.fall.b); after at most 1.5 s the game puts it back on the road
// where it went over, standing, rolling at 8 m/s, with no fade (»Vrni tako kot prej po 1,5s«). On a real track with a made-up slope beyond
// its left edge (Spa, Belgija: the slope is given to the page's live Track, as tests/padec.test.js gives it to Core's), and on Killar,
// Indija (real ground) where js/tracks/killar.js is in the tree. The page's loop is taken over: the game's own frames on the test's clock
// (1, 2 and 3 steps of 1/120 s a frame; one step a frame where a fall ends), nothing waits on the wall clock. Tresenje kamere »ob trku« and »ob pristanku« are switched on
// (both are off by default: nothing would shake), the knock's strength is the default one (0.08 a m/s).
//  1. drawn as the body: while c.fall.b is there the car's group has the body's pose at the frame's interpolation (its turn, its place =
//     centre - hc x up), visibly tilted (over 20° from the road's up) on a fast and on a slow crossing; the contact shadow hidden and the
//     black underside shown through the fall, both as before after it
//  2. the 1.5 s rule: the fall ends no later than 1.5 s (+ a step) after the car went over; in the frame of that step the car is drawn
//     standing on the road where it went over (not eased from the tumbling pose) and the view is behind it where a fresh view is (distance,
//     height), the contact shadow under it; no fade, no dimming at any moment (the page's boxes over the picture, the scene's lights and
//     fog, the picture's brightness); the banner »ZGRMEL SI V PREPAD!« shows
//  3. in the picture: the falling car's centre stays inside the viewport for the whole fall, landscape 640 x 360 and portrait 360 x 640
//  4. after the put-back: no landing effects (no shake, no thump, no jump counted or shown, no dust), 8 m/s on the road, the race goes on
//     (the counters of distance and laps did not move during the fall, the autopilot drives on)
//  5. knocks: each hard knock of the body on the slope (B.hn grows) gives dust, the view shakes by the game's one value (min(1.2, 0.08 x
//     the knock's m/s)), never by more; every fall costs at least 0.32 of damage
//  6. the replay (Posnetek do sem): inside a fall the replay's car carries a posed body and is drawn as it was live at that race time,
//     after the put-back it stands on the road; rpFalls() lists exactly the falls that happened, with their times; the speed the people by
//     the road are given for the replay's car inside a fall is its speed over the ground (a fall's sample holds a part of the body's turn
//     where a road's holds the speed)
//  7. a rival over the edge is drawn by the same rules, with no shake of the player's view and no banner
//  8. Killar (only where the track is in the tree): two real crossings of the ravine side 524 m after the start (60 km/h under 20°,
//     10 km/h under 40° in portrait): checks 1-4 on real ground
//  9. no errors on the page
// 10. Posnetek do sem in the middle of a fall, after a hard knock of the body (the replay shows the car on the road, then early in that
//     fall), and back in the race: the knocks the body has had already give no dust again, its next knock does
// 11. behind the results (the player home, the race going on): the results' replay opened and left in the middle of the rival's fall
//     leaves that car as the race had it (the same body, untouched, its place on the road the edge's), and its fall goes on to its
//     put-back where it went over
//   node tests/browser/padec.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, openGame, checker, ROOT } from './lib.mjs';

const T = checker('Padec čez rob: the falling car drawn as its body, back on the road after 1.5 s with no fade (Spa with a made-up slope; Killar where it is in the tree)');
const KILLAR = fs.existsSync(path.join(ROOT, 'js', 'tracks', 'killar.js'));
const LIMIT = 600000;   // (software WebGL, often on a loaded machine: a slow page is no failure of the game)
const SET = { quality: 'normal', shadows: 0, camera: 'chase', camShake: 1, camLand: 1 };
const BANNER = ['ZGRMEL SI V PREPAD!', 'OVER THE EDGE!'];

// the page's side (window.__pd): the page's loop taken over, the race's step, the renderer's frame, the game's shake of the view and its
// crash sound watched; the staging of a fall, its run frame by frame, the replay
async function install() {
  const g = window.__game, R = g && g.race, STEP = 1 / 120;
  if (!R || !R.player) return { error: 'no race on the page' };
  const P = R.player, T = R.track, A = R.cars.find(c => c !== P) || null, cars = A ? [P, A] : [P];
  // the page's own loop: its frame asks for the next one by name, so from here on the frames are handed out by the test, on the test's clock
  const Q = []; g.pause();
  window.requestAnimationFrame = (cb) => { Q.push(cb); return 0; };
  await new Promise(res => { let n = 0; const chk = () => (Q.length || ++n > 2400) ? res() : setTimeout(chk, 25); chk(); });
  if (!Q.length) return { error: 'the page\'s own loop did not come round' };
  if (g.phase !== 'racing') return { error: 'the race is not under way (phase ' + g.phase + ')' };
  if (R.flyOn) return { error: 'the flying start is still on' };
  const gl = document.getElementById('gl'), G3 = gl.getContext('webgl2') || gl.getContext('webgl');
  const H = window.__pd = { Q, now: 0, n: 0, steps: 0, rows: [], ev: [], car: P, plan: null, real1: false, sigs: [], inp: null, backN: -1, overSt: -1 };
  // a frame is really drawn only where the picture's brightness is read: the others go through the renderer with the draw calls left out
  const DRAWS = ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced', 'drawRangeElements', 'clear', 'blitFramebuffer'];
  const mute = (on) => { for (const k of DRAWS) { if (!on) delete G3[k]; else if (typeof G3[k] === 'function') G3[k] = () => {}; } };
  const lum = () => { const w = gl.width, h = gl.height, px = new Uint8Array(w * h * 4); G3.readPixels(0, 0, w, h, G3.RGBA, G3.UNSIGNED_BYTE, px); let s = 0, n = 0; for (let i = 0; i < px.length; i += 4 * 37) { s += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]; n++; } return s / n / 255; };
  // what could fade or dim the picture: every box of the page that covers half of it or more with what it lays over it (its colour, its
  // picture, its opacity, a filter, a blend), the scene's lights and the fog's colour
  const lights = []; Render.scene.traverse(o => { if (o.isLight) lights.push(o); });
  const veil = () => {
    const W = innerWidth, Hh = innerHeight, out = [];
    const one = (cs, tag) => out.push([tag, cs.opacity, cs.visibility, cs.backgroundColor, (cs.backgroundImage || '').slice(0, 90), cs.filter, cs.backdropFilter || cs.webkitBackdropFilter || '', cs.mixBlendMode].join('|'));
    for (const el of [document.documentElement, document.body, ...document.body.querySelectorAll('*')]) {
      if (!el.getClientRects().length) continue;
      const r = el.getBoundingClientRect(), w = Math.min(r.right, W) - Math.max(r.left, 0), h = Math.min(r.bottom, Hh) - Math.max(r.top, 0);
      if (w <= 0 || h <= 0 || w * h < 0.5 * W * Hh) continue;
      const tag = el.id ? '#' + el.id : el.tagName + '.' + (el.getAttribute('class') || '');
      one(getComputedStyle(el), tag);
      for (const ps of ['::before', '::after']) { const cs = getComputedStyle(el, ps); if (cs.content && cs.content !== 'none' && cs.content !== 'normal') one(cs, tag + ps); }
    }
    const F = Render.scene.fog;
    out.push('lights ' + lights.map(l => l.intensity.toFixed(3) + ':' + l.color.getHexString()).join(' '), 'fog ' + (F ? F.color.getHexString() : '-'));
    return out.join('\n');
  };
  // the race's step: what happened to each car in it (over the edge, a body, a knock of the body, back on the road)
  const step0 = R.step;
  R.step = function (dt) {
    const pre = cars.map(c => { const b = c.fall && c.fall.b ? c.fall.b : null; return [c.fall || null, b, b ? b.hn : 0]; });
    const r = step0.apply(this, arguments); H.steps++;
    cars.forEach((c, k) => { const [f0, b0, n0] = pre[k], b = c.fall && c.fall.b ? c.fall.b : null, bb = b || b0;
      if (!f0 && c.fall) { H.ev.push({ e: 'over', k, t: R.time, st: H.steps, s: c.q.s, d: c.q.d, v: Math.hypot(c.vx, c.vz), dist: c.dist, lap: c.lap, dmg: c.dmg }); if (c === P && H.inp) H.inp.thr = 0; if (c === H.car) H.overSt = H.steps; }
      if (bb && bb.hn > (bb === b0 ? n0 : 0)) H.ev.push({ e: 'knock', k, t: R.time, st: H.steps, n: bb.hn, hv: bb.hv, last: b ? 0 : 1 });
      if (f0 && !c.fall) { H.ev.push({ e: 'back', k, t: R.time, st: H.steps, x: c.x, z: c.z, h: c.h, y: c.y, ry: c.roadY, s: c.q.s, d: c.q.d, v: Math.hypot(c.vx, c.vz), dmg: c.dmg, dist: c.dist, lap: c.lap, falls: c.falls || 0, done: b0 ? b0.done : -1 }); if (c === H.car) H.backN = H.n; } });
    return r;
  };
  // the renderer's frame: how it drew the watched car, where the camera is, what shows
  const frame0 = Render.frame, V3 = new THREE.Vector3();
  Render.frame = function (dt, alpha, target, mode, opt) {
    const c = H.car, sh0 = Render.cam.shake, fx0 = Render.fxStats().total;
    let real = H.real1; H.real1 = false;
    if (opt && opt.rp) H.rp = opt.rp;   // (a replay's frame: what the people by the road read the replay's car from, js/world-ljudje.js resim)
    if (H.plan) { const F = c.fall; if (F && F.b && !F.rp) { while (H.plan.i < H.plan.ft.length && F.t >= H.plan.ft[H.plan.i]) { H.plan.i++; real = true; } } else if (H.backN >= 0 && H.plan.after.includes(H.n - H.backN)) real = true; }
    if (!real) mute(true);
    let r; try { r = frame0.apply(this, arguments); } finally { if (!real) mute(false); }
    const v = Render.viewOf(c), F = c.fall, B = F && F.b ? F.b : null, q = v.grp.quaternion, p = v.grp.position, cam = Render.camera, C = Render.cam;
    const up = [2 * (q.x * q.y - q.w * q.z), 1 - 2 * (q.x * q.x + q.z * q.z), 2 * (q.y * q.z + q.w * q.x)], fw = [1 - 2 * (q.y * q.y + q.z * q.z), 2 * (q.x * q.y + q.w * q.z), 2 * (q.x * q.z - q.w * q.y)];
    // the body's pose at the frame's interpolation (between its last two steps): the turn, the centre; the group belongs hc under the centre
    let eq = null, ep = null, ctr = [p.x + up[0] * 0.5, p.y + up[1] * 0.5, p.z + up[2] * 0.5];
    if (B) { const a = B.pq, b = B.q, u = alpha, s = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3] < 0 ? -1 : 1; let x = a[0] + (s * b[0] - a[0]) * u, y = a[1] + (s * b[1] - a[1]) * u, z = a[2] + (s * b[2] - a[2]) * u, w = a[3] + (s * b[3] - a[3]) * u; const l = 1 / Math.hypot(x, y, z, w); x *= l; y *= l; z *= l; w *= l;
      eq = 2 * Math.acos(Math.min(1, Math.abs(x * q.x + y * q.y + z * q.z + w * q.w))) * 180 / Math.PI;
      const ux = 2 * (x * y - w * z), uy = 1 - 2 * (x * x + z * z), uz = 2 * (y * z + w * x), cx = B.px + (B.x - B.px) * u, cy = B.py + (B.y - B.py) * u, cz = B.pz + (B.z - B.pz) * u;
      ep = Math.hypot(p.x - (cx - B.hc * ux), p.y - (cy - B.hc * uy), p.z - (cz - B.hc * uz)); ctr = [cx + (F.rp ? ux * 0.5 : 0), cy + (F.rp ? uy * 0.5 : 0), cz + (F.rp ? uz * 0.5 : 0)]; }
    const pr = V3.set(ctr[0], ctr[1], ctr[2]).project(cam), msg = document.getElementById('h-msg'), sg = veil();
    let si = H.sigs.indexOf(sg); if (si < 0) si = H.sigs.push(sg) - 1;
    H.rows.push({ n: H.n, t: R.time, st: H.steps, a: alpha, f: F ? (B ? (F.rp ? 3 : 2) : 1) : 0, ft: F ? F.t : null, eq, ep, up, fw, pos: [p.x, p.y, p.z],
      blob: v.blob ? +v.blob.visible : -1, by: v.blob ? v.blob.position.y : null, und: v.xUnd ? +v.xUnd.visible : 0, vis: +v.grp.visible,
      cam: [cam.position.x, cam.position.y, cam.position.z], asp: cam.aspect, sh0, sh1: C.shake, fx0, fx1: Render.fxStats().total, ndc: [pr.x, pr.y, pr.z],
      msg: msg && /\bshow\b/.test(msg.className) ? msg.textContent : '', y: c.y, ry: c.roadY, v: Math.hypot(c.vx, c.vz), hn: B ? B.hn : -1, lum: real ? lum() : null, sig: si });
    H.n++;
    return r;
  };
  const shake0 = Render.shake; Render.shake = function (a, k) { H.ev.push({ e: 'shake', t: R.time, st: H.steps, a, kind: k }); return shake0.apply(this, arguments); };
  const crash0 = Sfx.crash; Sfx.crash = function (v) { H.ev.push({ e: 'crash', t: R.time, st: H.steps, v }); return crash0.apply(this, arguments); };
  // the player's pedals where the test holds them (a real crossing: the speed held up to the edge)
  const upd0 = Input.update; Input.update = function (dt) { const S = upd0.apply(this, arguments); if (H.inp) { S.steer = H.inp.steer || 0; S.thr = H.inp.thr || 0; S.brk = 0; S.gas = S.thr > 0.05 ? 1 : 0; S.digital = true; } return S; };
  H.tick = (ms) => { H.now += ms; const L = Q.splice(0); for (const cb of L) cb(H.now); };
  H.go = () => { g.resume(); H.now = Math.min(H.now, performance.now()) - 1000; const L = Q.splice(0); for (const cb of L) cb(H.now); };   // (the game's own first frame after a pause: 1 ms)
  // a car put on the road's own height at a place, moving at v along its nose
  H.at = (c, x, z, h, v, hint) => {
    c.place(x, z, h); c.vx = Math.cos(h) * v; c.vz = Math.sin(h) * v; c.q = T.query(c.x, c.z, hint == null ? -1 : hint, c.q); c.sPrev = c.q.s;
    if (T.hasElev) { const e = T.elevAt(c.q.s, {}); c.y = c.py = c.roadY = e.y; c.gradeNow = e.grade; }
    c.stuckT = 0; c.wrongT = 0; c.locked = false; c.w = 0;
  };
  // the made-up slope, 60 m into the straightest 500 m of the track: beyond the road's left line (Track.bl) the ground falls at deg to deep
  // metres under the road and is level from there on, known out to far metres; inside the line the road's own plane (its height, its grade)
  const n500 = Math.round(500 / T.ds); let bi = 0, bs = 1e9;
  for (let i = 0; i < T.N; i += 5) { let lo = 0, hi = 0; for (let j = 1; j <= n500; j++) { let d = T.hd[(i + j) % T.N] - T.hd[i]; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; if (d < lo) lo = d; if (d > hi) hi = d; } if (hi - lo < bs) { bs = hi - lo; bi = i; } }
  const i0 = (bi + Math.round(60 / T.ds)) % T.N;
  H.ground = (deg, deep, far) => {
    const k = Math.tan(deg * Math.PI / 180), i = i0, ox = T.px[i] - T.nx[i] * T.bl[i], oz = T.pz[i] - T.nz[i] * T.bl[i], ux = -T.nx[i], uz = -T.nz[i], tx = Math.cos(T.hd[i]), tz = Math.sin(T.hd[i]), e = T.elevAt(i * T.ds, {}), y0 = e.y, gr = e.grade;
    T.floor = { made: 1 };
    T.floorAt = (x, z, out) => { const d = (x - ox) * ux + (z - oz) * uz, a = (x - ox) * tx + (z - oz) * tz; if (d < -8 || d > far) return false; const on = d > 0 && k * d < deep; out.h = y0 + gr * a - Math.min(deep, k * Math.max(0, d)); out.gx = gr * tx + (on ? -k * ux : 0); out.gz = gr * tz + (on ? -k * uz : 0); return true; };
    return { i0, s: i0 * T.ds, bl: T.bl[i], grade: gr };
  };
  // the road's own up at a place along it (its grade)
  H.roadUp = (s) => { const e = T.elevAt(s, {}), i = T.idx(s), tx = Math.cos(T.hd[i]), tz = Math.sin(T.hd[i]), l = Math.hypot(e.grade, 1); return [-e.grade * tx / l, 1 / l, -e.grade * tz / l]; };
  // a staged fall over the made-up slope: the car 2 cm inside the line, its nose ang degrees off the road toward the slope, at v m/s. For the
  // rival's fall the player rolls along the road (8 m/s, from 30 m before the place), never parked: a car standing on a circuit is an
  // incident of the race (a yellow flag, then the safety car)
  H.stage = (who, v, ang) => {
    const c = who === 'A' ? A : P, i = i0, a = ang * Math.PI / 180, sg = T.nx[i] * -Math.sin(T.hd[i]) + T.nz[i] * Math.cos(T.hd[i]) >= 0 ? 1 : -1, h = T.hd[i] - sg * a, d = -(T.bl[i] - 0.02);
    if (!c) return { error: 'no rival in the race' };
    if (c === A) { const j = (i - Math.round(30 / T.ds) + T.N) % T.N; R.repairCar(P); H.at(P, T.px[j] - T.nx[j] * 2.5, T.pz[j] - T.nz[j] * 2.5, T.hd[j], 8, j); }
    R.repairCar(c); H.at(c, T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, h, v, i);
    return { s: c.q.s, d: c.q.d, b: T.bl[i] };
  };
  // a real crossing (the staging of tools/trki/padec-slike.mjs): the player's car on its own straight line to the edge point (the road's
  // sample m metres after the start, the barrier line of the left side), v x pred back from it, its nose deg off the road toward that side;
  // 1.25 s on the spot (every step put back with its speed: the gearbox and the suspension settle, the throttle that holds the speed is
  // found); from the release the test holds that throttle, no steering, and lets go of it in the step the car is over the edge
  H.stageReal = (o) => {
    const RAD = Math.PI / 180, wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a)), clamp = (x, a, b) => Math.max(a, Math.min(b, x));
    const s0 = T.open ? Math.min(T.startS + o.m, T.finishS - 1) : T.startS + o.m, i = T.idx(((s0 % T.len) + T.len) % T.len);
    const O = { x: T.px[i], z: T.pz[i], hd: T.hd[i], tx: Math.cos(T.hd[i]), tz: Math.sin(T.hd[i]), nx: T.nx[i], nz: T.nz[i] };
    const sg = O.nx * -O.tz + O.nz * O.tx >= 0 ? 1 : -1, sd = -1, q0 = T.query(O.x, O.z, i, {}), b = q0.bl;
    const h = wrap(O.hd + sg * sd * o.deg * RAD), v = o.kmh / 3.6, L = v * o.pred, E = { x: O.x + O.nx * sd * b, z: O.z + O.nz * sd * b };
    const tP = { x: E.x - Math.cos(h) * L, z: E.z - Math.sin(h) * L, h, vx: v * Math.cos(h), vz: v * Math.sin(h) };
    R.repairCar(P); P.place(tP.x, tP.z, tP.h); P.q = T.query(P.x, P.z, i, P.q); if (T.hasElev) P.y = P.py = T.hy[P.q.i]; P.sPrev = P.q.s;
    const M = P.m; if (M.gears && v > 1) for (let k = 1; k <= M.gears.length; k++) { P.gear = k; if (v / M.rw * M.gears[k - 1] * M.final * 9.5493 < M.redline * 0.9) break; }
    P.vx = tP.vx; P.vz = tP.vz; P.locked = false; P.stuckT = 0; P.wrongT = 0; P.pitWant = false;
    const back = () => { P.x = P.px = tP.x; P.z = P.pz = tP.z; P.h = P.ph = tP.h; P.vx = tP.vx; P.vz = tP.vz; P.w = 0; };
    let thr = 0.3;
    for (let k = 0; k < 150; k++) { back(); g.sim(STEP, false, 0, thr, 0); thr = clamp(thr - (P.speed - v) * 2, 0, 1); if (P.fall) return { error: 'over the edge where it is staged' }; }
    back(); H.inp = { steer: 0, thr };
    return { s: q0.s, d: P.q.d, b, ravine: !!(T.fallAt && T.fallAt[0][i]), thr, v: P.speed };
  };
  // the run: the view settled behind the standing picture, the fall begun (staged: by hand, raw, as tests/padec.test.js does; a real crossing:
  // the car driven over the edge), the game's own frames from then on (3, 2, 1 steps a frame) to 60 frames after the put-back. Over the
  // fall's last steps (it ends in its step 181: FALL.cap) one step a frame, so that the step that puts the car back is the last of its frame
  // (end 'last': the frame shows the car as that very step left it) or the first of two (end 'mid': one more step of the car before the
  // frame). Then, the player's own fall: the autopilot drives on for 1.5 s, and the view of a car put there afresh (resetCam)
  H.run = (o) => {
    const c = H.car = o.who === 'A' ? A : P, k = cars.indexOf(c);
    H.backN = -1; H.overSt = -1; H.plan = null; H.rows.length = 0;
    Render.resetCam(); for (let j = 0; j < 30; j++) { H.real1 = !!o.lum && j === 29; Render.frame(0.1, 1, P, 'chase', { noFx: true }); }
    const pre = H.rows.pop(), e0 = H.ev.length; H.rows.length = 0;
    const jump = () => (g.stats && g.stats.jump) || 0;
    const start = { t: R.time, st: H.steps, falls: c.falls || 0, jump: jump(), lum: pre.lum, blob: pre.blob, und: pre.und };
    if (o.staged) { c.fall = { t: 0, raw: 1 }; c.air = 1; H.overSt = H.steps; H.ev.push({ e: 'over', k, t: R.time, st: H.steps, s: c.q.s, d: c.q.d, v: Math.hypot(c.vx, c.vz), dist: c.dist, lap: c.lap, dmg: c.dmg, staged: 1 }); }
    if (o.lum) H.plan = { ft: [0.75, 1.45], after: [0, 14], i: 0 };
    H.go();
    const cyc = [2.8, 1.9, 1.3]; let j = 0;
    H.tick(1.68 * 1000 / 120);
    for (let f = 0; f < 900; f++) { const n = c.fall && H.overSt >= 0 ? H.steps - H.overSt : -1;
      H.tick((n >= 170 ? (o.end === 'mid' && n === 180 ? 2 : 1) : cyc[j++ % 3]) * 1000 / 120); if (H.backN >= 0 && H.n - H.backN > 60) break; }
    g.pause(); H.plan = null; H.inp = null;
    const rows = H.rows.slice(), ev = H.ev.slice(e0), back = ev.filter(e => e.e === 'back' && e.k === k).pop() || null, over = ev.filter(e => e.e === 'over' && e.k === k).pop() || null;
    const out = { start, rows, ev, back, over, N: back ? H.roadUp(back.s) : null, end: { fall: !!c.fall, jump: jump() } };
    if (c === P && back) {
      const a0 = { dist: P.dist }; g.sim(1.5, true);
      out.drive = { dist: P.dist - a0.dist, v: Math.hypot(P.vx, P.vz), d: P.q.d, fall: !!P.fall, falls: P.falls || 0 };
      P.place(back.x, back.z, back.h); P.vx = Math.cos(back.h) * 8; P.vz = Math.sin(back.h) * 8; P.y = P.py = P.roadY = back.y; P.q = T.query(P.x, P.z, T.idx(back.s), P.q); P.sPrev = P.q.s;
      Render.resetCam(); Render.frame(1 / 60, 1, P, 'chase', { noFx: true }); out.ref = H.rows.pop();
    }
    H.rows.length = 0;
    return out;
  };
  // the replay of the race so far (Posnetek do sem), standing: the car as the replay draws it at each of the times asked for
  H.replay = (list) => {
    g.onAction('rp-here'); if (!g.replay) return { error: 'no replay (Posnetek do sem)' };
    if (g.replay.play) g.onAction('rp-play');
    const out = []; H.rows.length = 0;
    for (const it of list) { H.car = cars[it.k]; H.rp = null; g.rpSeek(it.t); for (let j = 0; j < (it.n || 1); j++) H.tick(1000 / 60); const r = H.rows.pop(); H.rows.length = 0; r.rt = g.replay.t; r.av = H.rp ? H.rp.at(g.replay.t, { x: 0, z: 0, v: 0 }).v : null; out.push(r); }   // (av: the speed of the car the replay follows, the player's, as the people by the road are given it)
    const falls = g.rpFalls();
    g.onAction('rp-race');
    const after = { replay: !!g.replay, falls: cars.map(c => c.fall ? (c.fall.rp ? 'rp' : 'own') : '') };
    g.pause(); H.car = P;
    return { rows: out, falls, after };
  };
  // Posnetek do sem in the middle of a fall, after a hard knock of its body (the slow crossing: its first knock, the dust of it drawn): the
  // replay shows the car on the road before the fall, then early in that fall (before the knock); Nazaj v dirko, 3 · 2 · 1, and the race
  // goes on to the fall's end. The frames from the return on, the race's events with them
  H.mid = () => {
    const s = H.stage('P', 5, 60); if (s.error) return s;
    const c = H.car = P; H.backN = -1; H.overSt = -1; H.plan = null; H.rows.length = 0;
    Render.resetCam(); for (let j = 0; j < 5; j++) Render.frame(0.1, 1, P, 'chase', { noFx: true });
    H.rows.length = 0; const t0 = R.time;
    c.fall = { t: 0, raw: 1 }; c.air = 1; H.overSt = H.steps;
    H.go();
    for (let j = 0; j < 400 && c.fall && !(c.fall.b && c.fall.b.hn); j++) H.tick(1000 / 60);
    for (let j = 0; j < 2 && c.fall; j++) H.tick(1000 / 60);
    if (!c.fall || !c.fall.b || !c.fall.b.hn) return { error: 'no hard knock of the body before its fall ended' };
    const own = c.fall, hn0 = own.b.hn, dust = H.rows.reduce((m, x) => m + x.fx1 - x.fx0, 0), tP = R.time; H.rows.length = 0;
    g.onAction('rp-here'); if (!g.replay) return { error: 'no replay (Posnetek do sem)' };
    if (g.replay.play) g.onAction('rp-play');
    g.rpSeek(t0 - 0.5); for (let j = 0; j < 4; j++) H.tick(1000 / 60); const road = H.rows.pop();
    g.rpSeek(t0 + 0.15); for (let j = 0; j < 2; j++) H.tick(1000 / 60); const early = H.rows.pop(); H.rows.length = 0;
    const st0 = H.steps, e0 = H.ev.length;
    g.onAction('rp-race'); const same = c.fall === own;
    for (let j = 0; j < 900 && !(H.backN >= 0 && H.n - H.backN > 5); j++) H.tick(1000 / 60);
    g.pause();
    const rows = H.rows.map(x => ({ st: x.st, f: x.f, hn: x.hn, fx: x.fx1 - x.fx0 })); H.rows.length = 0;
    return { t0, tP, hn0, dust, road: road.f, early: { f: early.f, hn: early.hn }, st0, same, rows, ev: H.ev.slice(e0) };
  };
  // behind the results: the player home (the last metres of its last lap's distance, the autopilot), the results up and the race going on
  // behind them (the rival is not home); the rival over the made-up slope, and in the middle of its fall the results' replay is opened,
  // shown where that car was on the road, and left again. Then the race's own frames to the put-back
  H.behind = () => {
    if (!A) return { error: 'no rival in the race' };
    R.repairCar(P); P.lap = R.laps; P.dist = R.laps * T.len - 4;
    for (let j = 0; j < 60 && g.phase !== 'done'; j++) g.sim(0.5, true);
    if (g.phase !== 'done' || !P.finished) return { error: 'the player is not home with the results up (phase ' + g.phase + ')' };
    if (R.isOut(A)) return { error: 'the rival is home or out of the race too' };
    const s = H.stage('A', 8, 25); if (s.error) return s;
    const c = H.car = A, k = cars.indexOf(A); H.backN = -1; H.overSt = -1; H.plan = null; H.rows.length = 0;
    const e0 = H.ev.length, over = { t: R.time, s: c.q.s, d: c.q.d };
    c.fall = { t: 0, raw: 1 }; c.air = 1; H.overSt = H.steps;
    H.go();
    for (let j = 0; j < 400 && c.fall && !(c.fall.b && c.fall.t >= 0.5); j++) H.tick(1000 / 60);
    if (!c.fall || !c.fall.b) return { error: 'the rival\'s fall was over before the replay (the race behind the results did not go on as a fall)' };
    const own = c.fall, B = own.b, snap = () => ({ x: B.x, y: B.y, z: B.z, q: Array.from(B.q), ft: own.t, s: c.q.s, d: c.q.d, time: R.time, steps: H.steps });
    const was = snap();
    g.onAction('replay'); if (!g.replay) return { error: 'no replay from the results' };
    const here = g.replay.here; if (g.replay.play) g.onAction('rp-play');
    g.rpSeek(over.t - 1); for (let j = 0; j < 3; j++) H.tick(1000 / 60);
    const shown = { fall: c.fall ? (c.fall.rp ? 'rp' : c.fall === own ? 'own' : 'other') : '', moved: Math.hypot(c.x - B.x, c.z - B.z) };
    g.onAction('rp-exit');
    const now = snap(), after = { replay: !!g.replay, same: c.fall === own && own.b === B, phase: g.phase };
    for (let j = 0; j < 600 && !(H.backN >= 0 && H.n - H.backN > 5); j++) H.tick(1000 / 60);
    g.pause();
    const back = H.ev.slice(e0).filter(e => e.e === 'back' && e.k === k).pop() || null; H.rows.length = 0;
    return { over, was, here, shown, now, after, back, fall: c.fall ? (c.fall.rp ? 'rp' : 'own') : '' };
  };
  return { ok: 1, idx: cars.map(c => R.cars.indexOf(c)), track: T.def.id, model: P.m.id, modelA: A ? A.m.id : null };
}

const DEG = 180 / Math.PI, f = (x, n = 2) => x == null || !isFinite(x) ? '-' : (+x).toFixed(n), e1 = (x) => isFinite(x) ? (+x).toExponential(1) : '-';
const ang = (a, b) => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * DEG;
const mx = (L, g) => L.reduce((m, x) => Math.max(m, g(x)), -Infinity);
// where the camera is from the drawn car: metres behind it over the ground (d), metres above it (h), degrees off the line of its nose (b)
const view = (x) => { const dx = x.pos[0] - x.cam[0], dz = x.pos[2] - x.cam[2], d = Math.hypot(dx, dz), l = Math.hypot(x.fw[0], x.fw[2]) || 1; return { d, h: x.cam[1] - x.pos[1], b: Math.acos(Math.max(-1, Math.min(1, (dx * x.fw[0] + dz * x.fw[2]) / ((d || 1) * l)))) * DEG }; };
const per = (L, g) => L.map(s => s.name + ': ' + g(s)).join('; ');

async function open(browser, base, query, viewport) {
  const { ctx, page, errors } = await openGame(browser, base + '/index.html?' + query, SET, viewport, { seed: 4242 });
  page.setDefaultTimeout(LIMIT);
  await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: LIMIT, polling: 250 });
  return { ctx, page, errors, inst: await page.evaluate(install) };
}
// one fall: staged (the made-up slope: st = { v, ang }) or driven (a real crossing: st = { m, kmh, deg, pred }), run to a second after its put-back
const fall = (page, o, st) => page.evaluate(([o, st]) => { const H = window.__pd, s = st.m != null ? H.stageReal(st) : H.stage(o.who, st.v, st.ang); if (s.error) return { error: s.error }; const r = H.run(o); r.st = s; return r; }, [o, st]);
// what a fall's run shows: its frames with the body (fr), the frames from its put-back on (post, a0 the first), the events of car k
function sum(name, r, k) {
  if (!r || r.error || !r.over || !r.back) return { name, bad: !r ? 'no run' : r.error || (!r.over ? 'the car did not go over the edge' : 'the car was not put back') };
  const fr = r.rows.filter(x => x.f === 2), post = r.rows.filter(x => x.st >= r.back.st), a0 = post[0], N = r.N;
  if (!fr.length || !a0) return { name, bad: 'no frame of the fall or none after it' };
  const kn = r.ev.filter(e => e.e === 'knock' && e.k === k), sk = r.ev.filter(e => e.e === 'shake'), cr = r.ev.filter(e => e.e === 'crash');
  // (a knock in the very step that puts the car back is neither heard nor shown: the body is gone by the end of the step; heard: the knocks
  // the game tells the player of, with its call of the shake in that step; shown: those whose frame still has the body)
  const heard = kn.filter(e => !e.last).map(e => ({ e, row: r.rows.find(x => x.st >= e.st), want: Math.min(1.2, e.hv * 0.08), call: sk.filter(x => x.st === e.st) })), shown = heard.filter(q => q.row && q.row.f === 2);
  return { name, r, k, fr, post, a0, N, kn, sk, cr, heard, shown, steps: r.back.st - r.over.st, secs: r.back.t - r.over.t, lastStep: a0.st === r.back.st,
    eq: mx(fr, x => x.eq), ep: mx(fr, x => x.ep), tilt: mx(fr, x => ang(x.up, N)), last: ang(fr[fr.length - 1].up, N), nx: mx(fr, x => Math.abs(x.ndc[0])), ny: mx(fr, x => Math.abs(x.ndc[1])), nz: mx(fr, x => x.ndc[2]),
    msgs: [...new Set(r.rows.filter(x => x.f).map(x => x.msg).filter(Boolean))], ban: r.rows.find(x => x.f && BANNER.includes(x.msg)), sigs: new Set(r.rows.map(x => x.sig)).size, lums: r.rows.filter(x => x.lum != null) };
}
// the checks every fall of the player's passes, on the made-up slope and on real ground (S: the falls, half: how far the road reaches from its middle)
const drawn = (S) => S.every(s => s.fr.length >= 30 && s.eq <= 0.01 && s.ep <= 0.001 && s.fr.every(x => x.vis === 1));
const hidden = (S) => S.every(s => s.r.start.blob === 1 && s.r.start.und === 0 && s.fr.every(x => x.blob === 0 && x.und === 1) && s.post.every(x => x.blob === 1 && x.und === 0));
const rule = (S) => S.every(s => s.steps <= 182 && s.secs <= 1.5 + 2 / 120 + 1e-6 && s.a0.st - s.r.back.st <= 2 && s.post.every(x => x.f === 0));
const stands = (S, half, ds) => S.every(s => ang(s.a0.up, s.r.ref.up) <= 3 && mx(s.post, x => ang(x.up, s.r.ref.up)) <= 5 && Math.abs(s.r.back.s - s.r.over.s) <= ds && Math.abs(s.r.back.d) < half(s) &&
  Math.hypot(s.a0.pos[0] - s.r.back.x, s.a0.pos[2] - s.r.back.z) <= 0.6 && Math.abs(s.a0.pos[1] - s.r.back.y) <= 0.5);
const behind = (S) => S.every(s => { const v = view(s.a0), w = view(s.r.ref); return Math.abs(v.d - w.d) <= 1 && v.b <= 3; });
const level = (S) => S.every(s => Math.abs(view(s.a0).h - view(s.r.ref).h) <= 1 && Math.abs(s.a0.by - s.r.ref.by) <= 0.5);
const inView = (S) => S.every(s => s.nx <= 0.95 && s.ny <= 0.95 && s.nz < 1);
const quiet = (S) => S.every(s => !s.sk.some(e => e.st >= s.r.back.st) && !s.cr.some(e => e.st >= s.r.back.st) && s.post.every((x, i) => x.sh1 === 0 && (!i || x.sh0 === 0)) && s.r.end.jump === s.r.start.jump &&
  !s.r.rows.some(x => /SKOK|JUMP/i.test(x.msg)) && s.a0.fx1 === s.a0.fx0 && Math.abs(s.r.back.v - 8) <= 0.1 && Math.abs(s.a0.v - 8) <= 0.5);
const goesOn = (S, half, dd) => S.every(s => Math.abs(s.r.back.dist - s.r.over.dist) <= dd && s.r.back.lap === s.r.over.lap && s.r.back.falls === s.r.start.falls + 1 && s.r.drive && !s.r.drive.fall && s.r.drive.falls === s.r.back.falls && s.r.drive.dist > 8 && Math.abs(s.r.drive.d) < half(s));
const dPose = (s) => `${s.fr.length} frames, off the body by at most ${e1(s.eq)}° and ${e1(s.ep)} m`;
const dRule = (s) => `${s.steps} steps (${f(s.secs, 3)} s), drawn ${s.a0.st - s.r.back.st} steps on`;
const dStand = (s) => `tumbling at ${f(s.last, 0)}° in the fall's last frame, ${f(ang(s.a0.up, s.r.ref.up), 1)}° off a standing car's up in the next (${f(ang(s.a0.up, s.N), 1)}° off the road's), ${f(Math.abs(s.r.back.s - s.r.over.s))} m along from where it went over, ${f(s.r.back.d)} m off the middle`;
const dView = (s) => { const v = view(s.a0), w = view(s.r.ref); return `${f(v.d)} m behind (afresh ${f(w.d)}), ${f(v.b, 1)}° off its nose`; };
const dLevel = (s) => { const v = view(s.a0), w = view(s.r.ref); return `put back in the ${s.lastStep ? 'last' : 'first'} step of its frame: view ${f(v.h)} m above the car (afresh ${f(w.h)}), shadow ${f(s.a0.by)} m from the car's wheels (afresh ${f(s.r.ref.by)}), the car's roadY ${f(s.a0.ry)} at height ${f(s.a0.y)}; off by at most ${f(mx(s.post, x => Math.abs(view(x).h - w.h)))} m in the second after`; };
const dPic = (s) => `|x| <= ${f(s.nx)}, |y| <= ${f(s.ny)} of the half picture (${s.fr[0].asp > 1 ? 'landscape' : 'portrait'})`;
const dQuiet = (s) => `${s.sk.filter(e => e.st >= s.r.back.st).length} shakes, ${s.cr.filter(e => e.st >= s.r.back.st).length} thumps, ${s.a0.fx1 - s.a0.fx0} particles, jump ${s.r.end.jump - s.r.start.jump}, ${f(s.r.back.v)} m/s`;
const dOn = (s) => `distance ${f(s.r.back.dist - s.r.over.dist)} m and lap ${s.r.back.lap - s.r.over.lap} over the fall, then ${s.r.drive ? f(s.r.drive.dist, 1) + ' m driven in 1.5 s, ' + f(s.r.drive.d) + ' m off the middle' : 'no drive'}`;
// no fade, no dimming: nothing over the picture changed through the run (one signature), and where the picture's brightness was read (in the
// fall after 0.75 s and after 1.45 s, in the first frame after the put-back and 14 frames later) it is the brightness before the fall: within
// a quarter of it in the fall (the view follows the car down the slope: 6 to 14 % darker), within 15 % after it (1 to 5 % darker)
const noFade = (S, L) => S.every(s => s.sigs === 1) && L.lums.length >= 4 && L.r.start.lum > 0.05 && L.lums.every(x => x.lum >= L.r.start.lum * (x.f ? 0.75 : 0.85) && x.lum <= L.r.start.lum * (x.f ? 1.25 : 1.15));
const dFade = (S, L) => `${per(S, s => s.sigs + ' state of the page\'s boxes, lights and fog')}; ${L.name}: brightness ${f(L.r.start.lum, 3)} before, ${L.lums.map(x => f(x.lum, 3) + (x.f ? ' at ' + f(x.ft) + ' s' : ' after')).join(', ')}`;

const srv = await serve();
const browser = await launch();
try {
  // ---- Spa, Belgija: a made-up slope (45°, 12 m deep) beyond the left edge of its straightest stretch
  {
    const { ctx, page, errors, inst } = await open(browser, srv.base, 'proga=spa&t=3&tekmeci=1&vreme=suho', { width: 640, height: 360 });
    const G = inst.ok ? await page.evaluate(() => window.__pd.ground(45, 12, 200)) : null;
    // the player's falls: fast (28 m/s under 20°; put back in the last step of a frame), slow (5 m/s under 60°: two knocks on the slope; put
    // back in the first of a frame's two steps), fast again in portrait; then the rival's (8 m/s under 25°), the player rolling behind it
    const A = inst.ok && sum('fast', await fall(page, { who: 'P', staged: 1, lum: 1, end: 'last' }, { v: 28, ang: 20 }), 0);
    const B = inst.ok && sum('slow', await fall(page, { who: 'P', staged: 1, end: 'mid' }, { v: 5, ang: 60 }), 0);
    if (inst.ok) { await page.setViewportSize({ width: 360, height: 640 }); await page.evaluate(() => Render.resize()); }
    const C = inst.ok && sum('fast in portrait', await fall(page, { who: 'P', staged: 1, end: 'mid' }, { v: 28, ang: 20 }), 0);
    const D = inst.ok && sum('rival', await fall(page, { who: 'A', staged: 1, end: 'last' }, { v: 8, ang: 25 }), 1);
    const S = [A, B, C], all = [A, B, C, D];
    const ran = T.check('Spa: over a made-up slope beyond the left edge the player falls three times (fast, slow, fast in portrait) and the rival once; each a body, each put back',
      !!inst.ok && all.every(s => s && !s.bad) && A.lastStep && !B.lastStep && !C.lastStep, inst.error || `${inst.track}, slope at ${f(G.s, 0)} m, ${inst.model} and ${inst.modelA}; ` + per(all, s => s.bad || `${f(s.r.over.v, 1)} m/s, ${s.kn.length} knocks [${s.kn.map(e => f(e.hv, 1) + ' m/s at ' + f(e.t - s.r.over.t) + ' s').join(', ')}], end ${s.r.back.done} in the ${s.lastStep ? 'last' : 'first'} step of its frame`));
    if (ran) {
      const half = () => G.bl;
      // 1
      T.check('drawn as the body: in every frame of a fall the car\'s group has the body\'s turn and place (centre - hc x up) at the frame\'s interpolation', drawn(S), per(S, dPose));
      T.check('visibly tilted (over 20° from the road\'s up) on the fast and on the slow crossing', S.every(s => s.tilt > 20), per(S, s => `up to ${f(s.tilt, 0)}°`));
      T.check('the contact shadow hidden and the black underside shown through the fall, both as before after it', hidden(S), per(S, s => `shadow ${s.r.start.blob}, underside ${s.r.start.und} before; ${s.fr.filter(x => x.blob === 0 && x.und === 1).length} of ${s.fr.length} frames of the fall without shadow, with underside; ${s.post.filter(x => x.blob === 1 && x.und === 0).length} of ${s.post.length} after as before`));
      // 2
      T.check('the 1.5 s rule: back on the road no later than 1.5 s + a step after going over, drawn there in the frame of that step', rule(S), per(S, dRule));
      T.check('in that frame the car stands on the road where it went over, not eased from the tumbling pose', stands(S, half, 2) && S.every(s => ang(s.a0.up, s.N) <= 3), per(S, dStand));
      T.check('in that frame the view is behind the car at a fresh view\'s distance', behind(S), per(S, dView));
      // (the view's height and the shadow's place follow the car's roadY: it has to be the road's own height in the very step that puts the
      // car back, a frame may come before the car's next step)
      T.check('in that frame the view is at a fresh view\'s height and the contact shadow under the car, whichever step of the frame put the car back', level(S), per(S, dLevel));
      T.check('no fade and no dimming, in the fall or after it', noFade(all, A), dFade(all, A));
      T.check('the banner »ZGRMEL SI V PREPAD!« shows in each of the player\'s falls', S.every(s => s.ban), per(S, s => s.ban ? `"${s.ban.msg}" from ${f(s.ban.ft)} s of the fall` : 'none (' + s.msgs.join(', ') + ')'));
      // 3
      T.check('in the picture: the falling car\'s centre inside the viewport for the whole fall, landscape 640 x 360 and portrait 360 x 640', inView(S) && A.fr[0].asp > 1 && B.fr[0].asp > 1 && C.fr[0].asp < 1, per(S, dPic));
      // 4
      T.check('after the put-back no landing effects: no shake, no thump, no jump counted or shown, no dust; 8 m/s on the road', quiet(S), per(S, dQuiet));
      T.check('the race goes on: the counters of distance and laps did not move during the fall, the autopilot drives on', goesOn(S, half, 1), per(S, dOn));
      // 5
      const K = S.flatMap(s => s.shown.map(q => Object.assign({ s }, q))), K2 = S.flatMap(s => s.heard.map(q => Object.assign({ s }, q)));
      T.check('knocks: each hard knock of the body on the slope gives dust', K.length >= 2 && K.every(q => q.row.fx1 - q.row.fx0 >= 6), K.map(q => `${q.s.name}: ${f(q.e.hv, 1)} m/s at ${f(q.e.t - q.s.r.over.t)} s, +${q.row.fx1 - q.row.fx0} particles`).join('; ') || 'no knock');
      // (the game's call, one a knock: Render.shake(min(1.2, 0.08 x m/s), 'hit'); the view's shake before a frame is never over the calls so
      // far, and the renderer's frame adds none of its own)
      const lim = (s, x) => Math.max(0, ...s.sk.filter(e => e.st <= x.st).map(e => Math.min(1.2, e.a)));
      T.check('knocks: the view shakes by the game\'s one value (min(1.2, 0.08 x the knock\'s m/s)), never by more',
        K2.length >= 2 && K2.every(q => q.call.length === 1 && q.call[0].kind === 'hit' && Math.abs(q.call[0].a - q.want) < 1e-9 && q.row && q.row.sh0 > 0 && q.row.sh0 <= q.want + 1e-9) &&
        S.every(s => s.sk.filter(e => e.st < s.r.back.st).length === s.heard.length && s.r.rows.every(x => x.sh1 <= x.sh0 + 1e-9 && x.sh0 <= lim(s, x) + 1e-9)),
        K2.map(q => `${q.s.name}: ${f(q.e.hv, 1)} m/s: the game's shake ${q.call.map(c => f(c.a, 3) + ' ' + c.kind).join(' + ') || 'none'} (${f(q.want, 3)}), the view's ${f(q.row.sh0, 3)} before and ${f(q.row.sh1, 3)} after its frame`).join('; ') + `; the view's most ${f(mx(S.flatMap(s => s.r.rows), x => x.sh1), 3)}`);
      T.check('every fall costs at least 0.32 of damage', all.every(s => s.r.back.dmg - s.r.over.dmg >= 0.32 - 1e-9), per(all, s => `${f(s.r.over.dmg, 3)} -> ${f(s.r.back.dmg, 3)}`));
      // 7
      T.check('the rival over the edge is drawn by the same rules: the body\'s pose, tilted, no shadow and the underside, back standing after 1.5 s', drawn([D]) && D.tilt > 20 && D.fr.every(x => x.blob === 0 && x.und === 1) && D.post.every(x => x.f === 0 && x.blob === 1 && x.und === 0) && D.steps <= 182 && ang(D.a0.up, D.N) <= 3,
        `${dPose(D)}, tilted up to ${f(D.tilt, 0)}°, ${D.steps} steps, ${f(ang(D.a0.up, D.N), 1)}° off the road's up in the frame after`);
      T.check('the rival\'s fall does not shake the player\'s view and shows no banner', !D.sk.length && D.r.rows.every(x => x.sh0 === 0 && x.sh1 === 0) && !D.ban, `${D.kn.length} knocks of its body, ${D.sk.length} shakes, the view's most ${f(mx(D.r.rows, x => x.sh1), 3)}, banners [${D.msgs.join(', ')}]`);
      // 6: the replay, standing, at about six moments of each fall (the race time of a live frame's picture: its step's time less the rest
      // of the step), and 0.1 s and 0.4 s after each put-back (a sample every 0.05 s: the body is carried on to the first one after it)
      const list = [];
      all.forEach((s, j) => { const n = s.fr.length; for (let i = 2; i < n; i += Math.max(1, Math.floor(n / 6))) { const x = s.fr[i]; list.push({ j, k: s.k, t: x.t - (1 - x.a) / 120, up: x.up, pos: x.pos, v: x.v }); }
        list.push({ j, k: s.k, t: s.r.back.t + 0.1, after: 1, n: 3 }, { j, k: s.k, t: s.r.back.t + 0.4, after: 1, n: 3 }); });
      const rep = await page.evaluate((list) => window.__pd.replay(list.map(it => ({ t: it.t, k: it.k, n: it.n }))), list);
      if (rep.error) T.check('the replay opens (Posnetek do sem)', false, rep.error);
      else {
        const rows = rep.rows.map((x, i) => Object.assign({ it: list[i], s: all[list[i].j] }, x)), in1 = rows.filter(x => x.it.up), aft = rows.filter(x => x.it.after);
        T.check('the replay inside a fall: its car carries a posed body and is drawn as it was live at that race time (up within 5°, place within 0.5 m), no shadow, the underside',
          in1.length >= 16 && in1.every(x => x.f === 3 && Math.abs(x.rt - x.it.t) < 1e-3 && ang(x.up, x.it.up) <= 5 && Math.hypot(x.pos[0] - x.it.pos[0], x.pos[1] - x.it.pos[1], x.pos[2] - x.it.pos[2]) <= 0.5 && x.blob === 0 && x.und === 1),
          `${in1.filter(x => x.f === 3).length} of ${in1.length} moments of ${all.length} falls with a body; up off by at most ${f(mx(in1, x => ang(x.up, x.it.up)))}°, place by ${f(mx(in1, x => Math.hypot(x.pos[0] - x.it.pos[0], x.pos[1] - x.it.pos[1], x.pos[2] - x.it.pos[2])), 3)} m`);
        T.check('the replay after the put-back: the car stands on the road, with its shadow', aft.length === 8 && aft.every(x => x.f === 0 && ang(x.up, x.s.N) <= 3 && x.blob === 1 && x.und === 0 && Math.abs(x.pos[1] - x.s.r.back.y) <= 0.5),
          `${aft.filter(x => x.f === 0).length} of ${aft.length} moments without a body; up off the road's by at most ${f(mx(aft, x => ang(x.up, x.s.N)), 1)}°, height off the put-back's by ${f(mx(aft, x => Math.abs(x.pos[1] - x.s.r.back.y)))} m`);
        // (rpFalls: k the car's place among the race's cars, t0 and t1 the first and the last sample of the fall: one every 0.05 s)
        const fits = (s, q) => q.k === inst.idx[s.k] && q.t0 >= s.r.over.t - 0.01 && q.t0 <= s.r.over.t + 0.07 && q.t1 >= s.r.back.t - 0.07 && q.t1 <= s.r.back.t + 0.01;
        T.check('rpFalls() lists exactly the falls that happened, with their times; back in the race from the replay no car carries a fall',
          rep.falls.length === all.length && all.every(s => rep.falls.filter(q => fits(s, q)).length === 1) && !rep.after.replay && rep.after.falls.every(x => !x),
          `${rep.falls.map(q => `car ${q.k} ${f(q.t0)}-${f(q.t1)} s (${q.n} knocks)`).join(', ')}; live ${all.map(s => `car ${inst.idx[s.k]} ${f(s.r.over.t)}-${f(s.r.back.t)} s`).join(', ')}; after: replay ${rep.after.replay}, falls [${rep.after.falls.join(',')}]`);
        // (the replay follows the player's car: its own falls. Between two samples, 0.05 s apart, the speed is the mean over them: a knock
        // in between may halve or double it against the live frame's)
        const mine = in1.filter(x => x.s.k === 0);
        T.check('the replay inside a fall: the people by the road are given the car\'s speed over the ground (within 0.4 to 2 times the live frame\'s), never a part of the body\'s turn',
          mine.length >= 12 && mine.some(x => x.it.v > 10) && mine.every(x => x.av != null && x.av >= 0.4 * x.it.v - 1 && x.av <= 2 * x.it.v + 2),
          mine.map(x => `${f(x.av, 1)} (live ${f(x.it.v, 1)})`).join(', ') + ' m/s');
      }
      // 10
      const mid = await page.evaluate(() => window.__pd.mid());
      if (mid.error) T.check('Posnetek do sem in the middle of a fall', false, mid.error);
      else {
        const k1 = mid.ev.find(e => e.e === 'knock' && e.k === 0), bk = mid.ev.find(e => e.e === 'back' && e.k === 0), lim = k1 ? k1.st : bk ? bk.st : Infinity;
        const pre = mid.rows.filter(x => x.st < lim), run = pre.filter(x => x.st > mid.st0), at = k1 ? mid.rows.find(x => x.st >= k1.st) : null;
        T.check('Posnetek do sem in the middle of a fall, after a hard knock (the replay shows the car on the road, then early in that fall), and back in the race: the knocks the body has had already give no dust again, its next knock does',
          mid.dust >= 6 && mid.road === 0 && mid.early.f === 3 && mid.early.hn < mid.hn0 && mid.same && run.length >= 3 && run.every(x => x.f === 2) && pre.every(x => x.fx === 0) && !!at && at.fx >= 6 && !!bk,
          `live: ${mid.hn0} knock, +${mid.dust} particles, the race stopped ${f(mid.tP - mid.t0)} s into the fall; the replay: on the road (${mid.road}), then early in the fall with ${mid.early.hn} knocks (${mid.early.f}); back: the race's own body ${mid.same}, ` +
          `${pre.length} frames to its next knock (${run.length} of them with the race going on) with ${pre.reduce((m, x) => m + x.fx, 0)} particles, most in one ${pre.length ? mx(pre, x => x.fx) : '-'}; the next knock ${at ? '+' + at.fx : 'none'}; put back ${!!bk}`);
      }
      // 11 (last on this page: the race is over for the player from here on)
      const bh = await page.evaluate(() => window.__pd.behind());
      if (bh.error) T.check('behind the results: the results\' replay in the middle of a rival\'s fall', false, bh.error);
      else {
        const eq = (a, b) => a.x === b.x && a.y === b.y && a.z === b.z && a.ft === b.ft && a.q.every((v, i) => v === b.q[i]) && a.s === b.s && a.d === b.d && a.time === b.time && a.steps === b.steps;
        T.check('behind the results (the player home, the race going on): the results\' replay, opened and left in the middle of the rival\'s fall, leaves that car as the race had it (the same body, untouched, its place on the road the edge\'s)',
          !bh.here && bh.shown.fall === '' && bh.shown.moved > 5 && !bh.after.replay && bh.after.same && eq(bh.was, bh.now) && bh.after.phase === 'done',
          `the replay: the results' (${!bh.here}), it showed the car on the road ${f(bh.shown.moved, 1)} m from its body (fall '${bh.shown.fall}'); after it: the race's own body ${bh.after.same}, ${f(bh.now.ft)} s into its fall as before (${f(bh.was.ft)} s), place on the road ${f(bh.now.s, 1)} m (${f(bh.was.s, 1)} m before), body and car unchanged ${eq(bh.was, bh.now)}`);
        T.check('behind the results: after the replay that fall goes on to its put-back where the car went over, no later than 1.5 s + a step of the race after going over',
          !!bh.back && !bh.fall && bh.back.t - bh.over.t <= 1.5 + 2 / 120 + 1e-6 && Math.abs(bh.back.s - bh.over.s) <= 2 && Math.abs(bh.back.d) < G.bl,
          bh.back ? `put back ${f(bh.back.t - bh.over.t, 3)} s of the race after going over, ${f(Math.abs(bh.back.s - bh.over.s))} m along the road from there, ${f(bh.back.d)} m off its middle; fall after it '${bh.fall}'` : `never put back (fall '${bh.fall}')`);
      }
    }
    // 9 (Chrome's own note about a vibration asked for before the page was tapped is not the game's error: the test never taps)
    const bad = errors.filter(e => !/navigator\.vibrate/.test(e));
    T.check('no errors on the page (Spa)', !bad.length, bad.join(' | ').slice(0, 600));
    await ctx.close();
  }
  // ---- 8. Killar, Indija: real ground beyond the edge, the car driven over it
  if (KILLAR) {
    const { ctx, page, errors, inst } = await open(browser, srv.base, 'proga=killar&t=5&tekmeci=0&vreme=suho', { width: 640, height: 360 });
    // (the first put back in the last step of a frame, as the fast fall on Spa; the second in the first of a frame's two steps)
    const A = inst.ok && sum('60 km/h under 20°', await fall(page, { who: 'P', lum: 1, end: 'last' }, { m: 524, kmh: 60, deg: 20, pred: 0.8 }), 0);
    if (inst.ok) { await page.setViewportSize({ width: 360, height: 640 }); await page.evaluate(() => Render.resize()); }
    const B = inst.ok && sum('10 km/h under 40° in portrait', await fall(page, { who: 'P', end: 'mid' }, { m: 524, kmh: 10, deg: 40, pred: 1.5 }), 0);
    const S = [A, B];
    const ran = T.check('Killar: two real crossings of the ravine side 524 m after the start: the car drives over the edge by itself, falls as a body and is put back',
      !!inst.ok && S.every(s => s && !s.bad && s.r.st.ravine && !s.r.over.staged) && A.lastStep && !B.lastStep, inst.error || `${inst.track}, ${inst.model}; ` + per(S, s => s.bad || `held at ${f(s.r.st.v * 3.6, 0)} km/h (throttle ${f(s.r.st.thr)}), its fall begins at ${f(s.r.over.v * 3.6, 0)} km/h, ${f(s.r.over.s, 0)} m along the road, ${s.kn.length} knocks [${s.kn.map(e => f(e.hv, 1) + ' m/s at ' + f(e.t - s.r.over.t) + ' s').join(', ')}], end ${s.r.back.done} in the ${s.lastStep ? 'last' : 'first'} step of its frame`));
    if (ran) {
      // (where it went over: the car is put back at the edge it left, up to 2 m back along the road from where its fall began)
      const half = (s) => s.r.st.b;
      T.check('Killar: drawn as the body, visibly tilted, no contact shadow and the black underside through the fall, both as before after it', drawn(S) && S.every(s => s.tilt > 20) && hidden(S), per(S, s => `${dPose(s)}, tilted up to ${f(s.tilt, 0)}°`));
      T.check('Killar: the 1.5 s rule, and in the frame of the put-back the car stands on the road where it went over', rule(S) && stands(S, half, 4), per(S, s => dRule(s) + '; ' + dStand(s)));
      T.check('Killar: in that frame the view is behind the car where a fresh view is (distance, height), the contact shadow under the car', behind(S) && level(S), per(S, s => dView(s) + '; ' + dLevel(s)));
      T.check('Killar: no fade and no dimming; the banner shows', noFade(S, A) && S.every(s => s.ban), dFade(S, A) + '; ' + per(S, s => s.ban ? `"${s.ban.msg}" from ${f(s.ban.ft)} s` : 'no banner (' + s.msgs.join(', ') + ')'));
      T.check('Killar: in the picture for the whole fall, landscape and portrait', inView(S) && A.fr[0].asp > 1 && B.fr[0].asp < 1, per(S, dPic));
      T.check('Killar: after the put-back no landing effects, 8 m/s on the road, the race goes on; at least 0.32 of damage', quiet(S) && goesOn(S, half, 4) && S.every(s => s.r.back.dmg - s.r.over.dmg >= 0.32 - 1e-9), per(S, s => dQuiet(s) + '; ' + dOn(s) + `; damage ${f(s.r.over.dmg, 3)} -> ${f(s.r.back.dmg, 3)}`));
    }
    const bad = errors.filter(e => !/navigator\.vibrate/.test(e));
    T.check('no errors on the page (Killar)', !bad.length, bad.join(' | ').slice(0, 600));
    await ctx.close();
  } else console.log('     (no js/tracks/killar.js in this tree: the crossings on Killar are left out)');
} catch (e) { T.check('test ran through', false, e.stack || String(e)); }
finally { await browser.close(); await srv.close(); }
T.done();
