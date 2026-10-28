// The pit stop's camera (js/render.js pitCine) and the driving buttons on a stop (game.js pitBtnVis), the phone upright (390 × 844).
// Bathurst, POTRDI 2.5 s after the takeover:
// 1. Behind the car until the takeover (nothing of the pit camera).
// 2. While the custom stop's panel shows the camera pulls back ever more slowly: the view behind the car scaled about the car on the
//    ground to 1 + 0.75 (1 − (1 + u) e^−u) of it (u: the seconds since the takeover / 1.1: half the way in ~1.9 s, 90 % in ~4.3 s); the
//    car where it was on the screen (within 1 px), only smaller.
// 3. On POTRDI it swings to the car's side (smootherstep over 2 s), never lower than 4 m beyond the pit wall's rail; then from the side:
//    2 m behind the car (in a narrow lane further: 8 m from it), 2.8 m up, as far towards the pit wall as its rail less 1.2 m allows (at
//    most 9.6 m out), looking sideways-forward
//    at the car in the middle of the picture (2B); over the last 25 m (P2B) the car and its box (the crew waiting round it) both in the
//    picture; at the box a slow orbit round the car (3A: ~1° a second from square to it towards behind it, one way, 9.6 m out, 3 m up),
//    the car in the middle, the whole car and the crew at their places in the picture.
// 4. The way out (2B): low beside the car at first (3 m up), always in the lane at least 1.2 m from the pit wall's rail, rising (never
//    lower than before, but for the view behind the car's own dips) to the camera behind the car, where it is at the hand-back (VOZIŠ TI!).
//    The user's rules over all of it, from the takeover to the hand-back (and on every circuit below): the camera never looks back
//    against the car's way (its view across the ground never less than square to the car's heading: dot ≥ 0, every frame), and never
//    stands still (every frame it moves or turns a little).
// 5. 101: the driving buttons (ZAVORA, PLIN, the arrows) fade out over ~1 s from the takeover, back in from ~2 s to ~0.5 s before the
//    hand-back (never back down), their place and size the same (opacity only); the pause button as ever.
// Then on every circuit with pits (not the test tracks), POTRDI 1.5 s after the takeover: the side view and the box view as above, the way
// out in the lane 1.2 m or more from the rail, its rise, the view behind the car at the hand-back.
//   node tests/browser/pitcam.test.mjs            (PITCAM_ONLY=spa,cpalace: only those on the second part)
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the pit stop\'s camera and the driving buttons (upright)');
const srv = await serve();
const browser = await launch();
const ONLY = process.env.PITCAM_ONLY ? process.env.PITCAM_ONLY.split(',') : null;
// in the page: on to 60 m before the way in, then one stop, a frame each 3 steps of 1/60 s; POTRDI pot s after the takeover. Each frame:
// the camera against the car in the lane's frame (al: along, als: along the lane's own way, gar: towards the garages, h: up), the pit camera's own numbers (Render.pitCamInfo:
// f pulled back, s swung, k risen; base: the view behind the car under it), the rail's margin, the buttons' opacity
const RUN = (pot) => {
  const g = window.__game, P = g.race.player, Tk = g.race.track, C = Render.camera, sm = Tk.def.pit[0] < 0 ? -1 : 1; g.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none';
  for (const id of ['touch', 'btn-pause']) document.getElementById(id).classList.remove('off');   // (as in the running race: the buttons laid out, the pause button there)
  for (const c of g.race.cars) if (!c.isPlayer && c.st && c.st.at) { c.st.at = []; c.st.win = []; }   // (the rivals' planned stops (Core STRAT) not under test: a full lane holds the car up)
  for (let k = 0; k < 400 && g.phase !== 'racing'; k++) g.sim(0.1, true);
  for (let k = 0; k < 40000; k++) { if (!P.inPit && !Tk.pitAt(P.q.s) && !P.pitWant) P.pitWant = true; if (P.pitWant && Tk.pitAt(P.q.s + 60) && !Tk.pitAt(P.q.s)) break; g.sim(0.05, true); }
  P.dmg = Math.max(P.dmg, 0.4);
  const cam0 = new THREE.PerspectiveCamera(), v = new THREE.Vector3(), W = innerWidth, H = innerHeight, gas = document.getElementById('c-gas'), pb = document.getElementById('btn-pause'), rect0 = JSON.stringify(gas.getBoundingClientRect());
  let tA = null, ok = false, n = 0, rect1 = null; const L = []; Render.scene.visible = false;
  for (let k = 0; k < 7200; k++) {
    if (tA == null && !P.inPit) g.sim(1 / 60, true); else g.sim(1 / 60, false, 0, 0);   // (into the lane on the computer's driving; then no gas: the autopilot)
    if (P.inPit && tA == null) tA = g.race.time;
    if (pot != null && !ok && tA != null && g.race.time - tA >= pot) { ok = true; document.querySelector('#h-stop .sp-ok').click(); }
    if (k % 3) continue;
    Render.frame(0.05, 1, P, 'chase', {}); C.updateMatrixWorld();
    const i = P.q.i, fx = Tk.tx[i], fz = Tk.tz[i], nx = Tk.nx[i] * sm, nz = Tk.nz[i] * sm, y = P.y || 0, dx = C.position.x - P.x, dz = C.position.z - P.z;
    const q = Tk.query(C.position.x, C.position.z, i, {}), pc = Tk.pitAt(q.s), d = Render.pitCamInfo, o = { t: tA != null ? +(g.race.time - tA).toFixed(3) : -1, st: P.pitState || (P.inPit ? 'lane' : '-'), done: !!P.pitDone, ap: !!P.pitAP, panel: g.pitStop.on,
      x: P.inPit ? +Tk.boxX(P.q.s, Tk.def.pit[3]).toFixed(2) : null, al: +(dx * fx + dz * fz).toFixed(3), als: +((((q.s - P.q.s) % Tk.len) + Tk.len * 1.5) % Tk.len - Tk.len / 2).toFixed(3), gar: +(dx * nx + dz * nz).toFixed(3), h: +(C.position.y - y).toFixed(3), w: +Render.pitCam.toFixed(4),
      wallM: pc && !pc.gap ? +(q.d * pc.sd - Math.max(pc.wall, pc.inner)).toFixed(3) : null, op: +getComputedStyle(gas).opacity, opP: +getComputedStyle(pb).opacity + (getComputedStyle(pb).display === 'none' ? -9 : 0),
      p: [C.position.x, C.position.y, C.position.z], cx: P.x, cz: P.z };
    { const e = C.matrixWorld.elements, vx = -e[8], vz = -e[10], vl = Math.hypot(vx, vz) || 1, sp = Math.hypot(P.vx || 0, P.vz || 0);   // (the view across the ground against the car's heading; hv: the heading against its way, a check of the heading's sense)
      o.vd = +((vx * Math.cos(P.h) + vz * Math.sin(P.h)) / vl).toFixed(4); o.vdir = [vx / vl, vz / vl]; o.hv = sp > 1 ? +(((P.vx || 0) * Math.cos(P.h) + (P.vz || 0) * Math.sin(P.h)) / sp).toFixed(3) : null; }
    if (P.inPit && !P.pitDone && P.pitState !== 'repair' && o.x != null && o.x >= -25 && o.x < -0.3) {   // P2B: the car's corners and its box (its centre, the car's length either side of it, 0.5 m up) in the picture; the crew at their places
      const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(C.projectionMatrix, C.matrixWorldInverse)), c = Render.crew, D = c && c.dim, ch = Math.cos(P.h), sh = Math.sin(P.h), bp = Tk.bayPose(Tk.def.pit[3]);
      const lane = (s, off) => { const L = Tk.len, f = (((s % L) + L) % L) / Tk.ds, a = Math.floor(f) % Tk.N, b = (a + 1) % Tk.N, u = f - Math.floor(f), lp = (A) => A[a] + (A[b] - A[a]) * u; return [lp(Tk.px) + lp(Tk.nx) * sm * off, lp(Tk.pz) + lp(Tk.nz) * sm * off]; };
      const car = [], box = [], hl = D ? Math.max(D.nose, -D.tail) : 2.3; if (D) for (const f of [D.nose, D.tail]) for (const s of [-1, 1]) car.push([P.x + ch * f - sh * s * D.wid / 2, y + 0.5, P.z + sh * f + ch * s * D.wid / 2]);
      for (const e of [-hl, 0, hl]) { const q = lane(bp.s + e, bp.o); box.push([q[0], y + 0.5, q[1]]); }
      const inF = (p) => fr.containsPoint(v.set(p[0], p[1], p[2])), men = c && c.roles ? c.roles.G.concat(c.roles.N, [c.roles.JF, c.roles.JR]).filter(m => Math.hypot(m.x - m.gx, m.z - m.gz) < 0.2) : [];
      o.p2b = { car: car.length, carOut: car.filter(p => !inF(p)).length, boxOut: box.filter(p => !inF(p)).length, men: men.length, menOut: men.filter(m => !inF([m.x, (m.y || 0) + 1, m.z])).length };
    }
    v.set(P.x, y + 0.6, P.z).project(C); o.ndc = [+v.x.toFixed(3), +v.y.toFixed(3)];
    if (d) { o.f = d.f; o.s = d.s; o.k = d.k; o.low = d.low; if (d.base) { const b = d.base, K = d.car; o.hb = +(b[1] - y).toFixed(3); o.d3 = +Math.hypot(C.position.x - b[0], C.position.y - b[1], C.position.z - b[2]).toFixed(3);
      o.r = +(Math.hypot(C.position.x - K[0], C.position.y - K[1], C.position.z - K[2]) / Math.hypot(b[0] - K[0], b[1] - K[1], b[2] - K[2])).toFixed(4);
      // (the car's place on the screen under the camera and under the view behind the car it was pulled back from: the car's point on the ground)
      cam0.fov = C.fov; cam0.aspect = C.aspect; cam0.near = C.near; cam0.far = C.far; cam0.position.set(b[0], b[1], b[2]); cam0.lookAt(b[3], b[4], b[5]); cam0.updateProjectionMatrix(); cam0.updateMatrixWorld();
      const a = new THREE.Vector3(K[0], K[1], K[2]).project(C), c0 = new THREE.Vector3(K[0], K[1], K[2]).project(cam0); o.scr = +Math.hypot((a.x - c0.x) * W / 2, (a.y - c0.y) * H / 2).toFixed(2); } }
    if (P.pitState === 'repair' && Render.crew && Render.crew.mode === 'work') {   // (the box: the car's corners and the crew at their places in the picture)
      const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(C.projectionMatrix, C.matrixWorldInverse)), c = Render.crew, D = c.dim, R = c.roles, ch = Math.cos(P.h), sh = Math.sin(P.h), pts = [];
      for (const f of [D.nose, D.tail]) for (const s of [-1, 1]) pts.push([P.x + ch * f - sh * s * D.wid / 2, y + 0.5, P.z + sh * f + ch * s * D.wid / 2]);
      for (const m of R.G.concat(R.N, [R.JF, R.JR])) if (Math.hypot(m.x - m.gx, m.z - m.gz) < 0.2) pts.push([m.x, (m.y || 0) + 1, m.z]);
      o.fit = { n: pts.length, out: pts.filter(p => !fr.containsPoint(v.set(p[0], p[1], p[2]))).length, car: pts.slice(0, 4).filter(p => !fr.containsPoint(v.set(p[0], p[1], p[2]))).length };   // (car: of its four corners)
      if (!rect1) rect1 = JSON.stringify(gas.getBoundingClientRect());
    }
    L.push(o);
    if (tA != null && !P.pitAP && !P.inPit && ++n > 20) break;
  }
  Render.scene.visible = true;
  return { L, rect0, rect1, errs: [] };
};
const sm = (u) => u <= 0 ? 0 : u >= 1 ? 1 : u * u * u * (u * (u * 6 - 15) + 10), pull = (t) => { const u = t / 1.1; return 1 + 0.75 * (1 - (1 + u) * Math.exp(-u)); };
const hbIdx = (L) => L.findIndex(r => r.t > 0 && r.done && !r.ap);   // (the hand-back: the stop done, the autopilot gone; not the step of the way in before it took over)
const DEG = 180 / Math.PI;
// the side view, the box, the way out and the hand-back (both parts)
function common(L, lbl) {
  const hb = hbIdx(L), side = L.filter(r => r.ap && !r.done && r.s === 1 && r.x != null && r.x < -36 && r.st !== 'repair'), box = L.filter(r => r.st === 'repair' && r.s === 1), ex = hb > 0 ? L.slice(0, hb).filter(r => r.done && r.ap) : [];
  // (its place as pitCine puts it, low: 2 m behind the car (a; in a narrow lane further: 8 m from it, within 35 cm) as far out as max(the rail's limit, 9.6 m) allows, its angle behind the
  // car's side phi turned on round the car by as much as the car heads out towards the pit wall (psi), its offset within 3 cm of that; measured from the picture's camera
  // where the lane bends (Trois-Rivières) along the lane within a metre or a fifth of how far behind it is, never nearer the rail than 1.2 m,
  // at most 0.8 m further than its place; no rail
  // where the lane meets the circuit)
  const sideBad = (r) => { const L = r.low; if (!L) return true; const Gw = Math.min(L.outD, -L.lim), rr = Math.hypot(L.a, Gw);
    return !(L.a > 1.99 && Math.abs(rr - Math.max(8, Math.hypot(2, Gw))) < 0.35 && L.beta === 0 && L.po === 0 && Math.abs(L.phi - Math.atan2(L.a, Gw) - L.psi) < 0.02 && Math.abs(L.off - Math.max(L.lim, -rr * Math.cos(L.phi))) < 0.03 && L.outD === 9.6 && L.along < -0.8 && Math.abs(r.als - L.along) < Math.max(1, 0.2 * -L.along) && r.h > 2.7 && r.h < 2.9 && r.gar < 0 && (r.wallM == null || (r.wallM >= 1.18 && (r.wallM < 2 + Gw - rr * Math.cos(L.phi) || Math.abs(r.gar) > 9.3))) && Math.abs(r.ndc[0]) < 0.5 && Math.abs(r.ndc[1]) < 0.8); };
  const sideOk = side.length > 3 && !side.some(sideBad);
  T.check(`${lbl}: from the side on the way to the box (2B): ~2 m behind the car (in a narrow lane further, 8 m from it), 2.8 m up, towards the pit wall as far as its rail less 1.2 m allows (at most 9.6 m out), looking sideways-forward at the car in the middle of the picture`, sideOk,
    JSON.stringify({ n: side.length, first: side[0] && { als: side[0].als, gar: side[0].gar, h: side[0].h, wallM: side[0].wallM, ndc: side[0].ndc, vd: side[0].vd }, bad: side.find(sideBad) }));
  // P2B: the last 25 m before the box (the side view, not the swing): the car's corners and its box in the picture, the crew at their places too
  const p2 = L.filter(r => r.p2b && r.s === 1), p2bad = p2.filter(r => r.p2b.carOut || r.p2b.boxOut || r.p2b.menOut > (r.wallM != null && r.wallM < 1.35 ? 2 : 0));
  T.check(`${lbl}: P2B: over the last 25 m before the box the camera looks between the car and its box: the whole car, the box and the crew waiting round it in the picture (held closer by the rail, at most the two jacks' men out)`,
    p2.length > 10 && p2[0].x < -20 && p2.some(r => r.p2b.men >= 6) && !p2bad.length && p2.every(r => r.low && r.low.beta > 0.99),
    JSON.stringify({ n: p2.length, from: p2[0] && p2[0].x, men: Math.max(0, ...p2.map(r => r.p2b.men)), bad: p2bad.slice(0, 2).map(r => ({ x: r.x, p2b: r.p2b, a: r.low && +r.low.a.toFixed(2), beta: r.low && r.low.beta })) }));
  // 3A: at the box a slow orbit: the camera's angle round the car behind its side (from the lane's frame at the car: 0 square to it, + behind it)
  // from about square (at most 4° behind it as the car stops) on towards behind it at ~1° a second, one way (never back), never ahead of square;
  // as far out as before (9.6 m or as the rail allows), 3 m up; the car in the middle, the whole car and the crew in the picture
  const ph = (r) => Math.atan2(-r.al, -r.gar) * DEG, b0 = box[0], b1 = box[box.length - 1], rate = box.length > 2 ? (ph(b1) - ph(b0)) / Math.max(0.05, b1.t - b0.t) : 0, fits = box.filter(r => r.fit);
  const back = box.filter((r, i) => i && ph(r) < ph(box[i - 1]) - 1e-3), far = box.filter(r => !(r.h > 2.9 && r.h < 3.1 && (Math.abs(Math.hypot(r.al, r.gar) - 9.6) < 0.2 || r.wallM < 1.35) && r.wallM >= 1.18));
  T.check(`${lbl}: at the box (3A) a slow orbit round the car from about square to it towards behind it (~1° a second, one way), 9.6 m out (or as far as the rail allows), 3 m up, the car in the middle, the whole car and the crew at their places in the picture (held closer by the rail, at most the two jacks' men at its ends out)`,
    box.length > 5 && ph(b0) >= -0.5 && ph(b0) <= 4 && rate > 0.8 && rate < 1.25 && !back.length && !far.length && box.every(r => Math.abs(r.ndc[0]) < 0.12) && fits.length > 3 && fits.every(r => r.fit.car === 0 && (r.fit.out === 0 || (r.wallM < 1.35 && r.fit.out <= 2))) && Math.max(...fits.map(r => r.fit.n)) >= 12,
    JSON.stringify({ n: box.length, ph0: b0 && +ph(b0).toFixed(2), ph1: b1 && +ph(b1).toFixed(2), rate: +rate.toFixed(3), back: back.length, far: far[0] && { al: far[0].al, gar: far[0].gar, h: far[0].h, wallM: far[0].wallM }, ndc: Math.max(0, ...box.map(r => Math.abs(r.ndc[0]))), fit: fits.find(r => r.fit.out) || { nMax: Math.max(0, ...fits.map(r => r.fit.n)) } }));
  // the user's rules over the whole stop, from the takeover to the hand-back: never looking back against the car's way, never still
  const all = hb > 0 ? L.slice(0, hb + 1).filter(r => r.t >= 0) : [], bk = all.filter(r => !(r.vd >= 0)), still = [];
  for (let i = 1; i < all.length; i++) { const a = all[i - 1], b = all[i], mv = Math.hypot(b.p[0] - a.p[0], b.p[1] - a.p[1], b.p[2] - a.p[2]) + 10 * Math.hypot(b.vdir[0] - a.vdir[0], b.vdir[1] - a.vdir[1]); if (mv < 0.005) still.push({ t: b.t, st: b.st, x: b.x, mv: +mv.toFixed(5) }); }
  T.check(`${lbl}: never looking back: the view across the ground at least square to the car's heading in every frame from the takeover to the hand-back (pull-back, swing, side, the last 25 m, the box, the way out, the rise)`,
    all.length > 50 && !bk.length && all.some(r => r.hv != null) && all.every(r => r.hv == null || r.hv > 0.5),
    JSON.stringify({ n: all.length, min: +Math.min(...all.map(r => r.vd)).toFixed(4), bad: bk.slice(0, 3).map(r => ({ t: r.t, st: r.st, x: r.x, vd: r.vd, s: r.s, k: r.k, low: r.low && { a: r.low.a, phi: r.low.phi, psi: r.low.psi } })), hv: Math.min(...all.filter(r => r.hv != null).map(r => r.hv)) }));
  T.check(`${lbl}: never still: every frame (0.05 s) from the takeover to the hand-back the camera moves or turns a little (at least 5 mm, a turn counted 10 m out)`,
    all.length > 50 && !still.length, JSON.stringify({ n: all.length, still: still.length, first: still.slice(0, 3) }));
  const lowW = ex.filter(r => r.wallM != null), minW = Math.min(...lowW.map(r => r.wallM)), dn = [];
  for (let i = 1; i < ex.length; i++) { const a = ex[i - 1], b = ex[i], dh = b.h - a.h, db = b.hb - a.hb; if (dh < Math.min(0, db) - 0.01) dn.push({ t: b.t, dh: +dh.toFixed(3), db: +db.toFixed(3) }); }
  T.check(`${lbl}: the way out in the lane, 1.2 m or more from the pit wall's rail (2B); low beside the car at first, then rising (never lower but for the view behind the car's own dips)`,
    ex.length > 20 && lowW.length > 10 && minW >= 1.18 && !dn.length && ex[0].h < 3.1 && ex.slice(0, 10).every(r => r.h < 3.2) && ex[ex.length - 1].h > 15,
    JSON.stringify({ n: ex.length, minW, dn: dn.slice(0, 3), h0: ex[0] && ex[0].h, h1: ex.length && ex[ex.length - 1].h }));
  const last = ex[ex.length - 1], after = hb > 0 ? L.slice(hb) : [];
  T.check(`${lbl}: the camera behind the car exactly at the hand-back (VOZIŠ TI!: the pit camera's weight ~0, within 0.3 m of the view behind the car), none of it after`,
    !!last && last.w <= 0.02 && last.d3 <= 0.3 && after.length > 5 && after.every(r => r.w === 0), JSON.stringify({ last: last && { t: last.t, w: last.w, d3: last.d3, k: last.k }, after: after.length }));
}
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'chase', damage: 2, fuel: 1 }, { width: 390, height: 844 }, { seed: 34 });   // (seeded and stepped: the same race each time)
  await startTrack(page, 'bathurst');
  const R = await page.evaluate(RUN, 2.5), L = R.L, hb = hbIdx(L), tHB = hb > 0 ? L[hb].t : null;
  T.check('Bathurst: one stop, the hand-back in the lane', hb > 0 && L.some(r => r.st === 'repair'), `hand-back at ${tHB}`);
  // 1. behind the car before the takeover
  const pre = L.filter(r => r.t < 0);
  T.check('behind the car until the takeover: nothing of the pit camera', pre.length > 5 && pre.every(r => r.w === 0 && r.f == null), JSON.stringify(pre[pre.length - 1]));
  // 2. the pull-back
  const pb = L.filter(r => r.t >= 0 && r.panel && r.s === 0), at = (t) => pb.reduce((a, r) => Math.abs(r.t - t) < Math.abs(a.t - t) ? r : a, pb[0]);
  T.check('the panel open: the camera pulls back ever more slowly, critically damped (τ 1.1 s: the distance 1 + 0.75 (1 − (1 + u) e^−u) of the view behind the car, its scale r the same), never closer',
    pb.length > 20 && pb.every(r => Math.abs(r.f - pull(r.t)) < 0.01 && Math.abs(r.r - r.f) < 0.01) && pb.every((r, i) => !i || r.f >= pb[i - 1].f) && Math.abs(at(1.85).f - 1.375) < 0.03,
    JSON.stringify({ n: pb.length, at1_85: at(1.85) && { t: at(1.85).t, f: at(1.85).f, r: at(1.85).r }, last: pb.length && { t: pb[pb.length - 1].t, f: pb[pb.length - 1].f }, bad: pb.find(r => Math.abs(r.f - pull(r.t)) >= 0.01 || Math.abs(r.r - r.f) >= 0.01) }));
  T.check('the car where it was on the screen while it pulls back (within 1 px of where the view behind the car has it), only smaller', pb.length > 20 && pb.every(r => r.scr <= 1), `at most ${Math.max(...pb.map(r => r.scr))} px`);
  // 3. the swing
  const sw = L.filter(r => r.t >= 2.5 && r.ap && !r.done && r.f != null && r.t < 5);
  // (gliding: the camera's step each frame (0.05 s) changes smoothly, by 1.5 m at most from the one before: no jump, however quick the swing)
  const swBad = sw.filter(r => Math.abs(r.s - sm((r.t - 2.5) / 2)) > 0.03), steps = [], jumps = []; for (let i = 1; i < sw.length; i++) { const a = sw[i - 1], b = sw[i]; steps.push(Math.hypot(b.p[0] - a.p[0], b.p[1] - a.p[1], b.p[2] - a.p[2])); }
  for (let i = 1; i < steps.length; i++) if (Math.abs(steps[i] - steps[i - 1]) > 1.5) jumps.push(+(steps[i] - steps[i - 1]).toFixed(2));
  const lowOut = sw.filter(r => r.wallM != null && r.wallM < -Math.max(0, r.h - 4) * 2 - 0.05);
  T.check('POTRDI: a swing to the car\'s side over 2 s (smootherstep), gliding (no jumps), never low beyond the pit wall\'s rail (only high up over it)', sw.length > 30 && !swBad.length && sw.some(r => r.s > 0.3 && r.s < 0.7) && !jumps.length && !lowOut.length,
    JSON.stringify({ n: sw.length, bad: swBad.slice(0, 2).map(r => ({ t: r.t, s: r.s })), top: +Math.max(...steps).toFixed(2), jumps: jumps.slice(0, 3), lowOut: lowOut.slice(0, 2).map(r => ({ t: r.t, h: r.h, wallM: r.wallM })) }));
  common(L, 'Bathurst');
  // 5. the buttons
  const op = (t) => { const r = L.reduce((a, r) => Math.abs(r.t - t) < Math.abs(a.t - t) ? r : a, L[0]); return r.op; }, fin = L.slice(0, hb).filter(r => r.t > 0);
  const inStart = fin.find(r => r.t > 3 && r.op > 0.01), full = fin.find(r => inStart && r.t >= inStart.t && r.op >= 0.999), mono = fin.filter(r => inStart && r.t >= inStart.t).every((r, i, a) => !i || r.op >= a[i - 1].op - 1e-6);
  T.check('101: the driving buttons fade out over ~1 s from the takeover (half at 0.5 s), gone while the autopilot drives', pre.every(r => r.op === 1) && Math.abs(op(0.5) - 0.5) < 0.1 && op(1.05) === 0 && fin.filter(r => r.t > 1.05 && r.t < tHB - 3).every(r => r.op === 0),
    JSON.stringify({ at0_5: op(0.5), at1_05: op(1.05) }));
  T.check('101: back in from ~2 s to ~0.5 s before the hand-back (never back down), fully there at it; their place and size the same (opacity only)',
    !!inStart && !!full && tHB - inStart.t <= 2.6 && tHB - inStart.t >= 1.6 && tHB - full.t >= 0.45 && tHB - full.t <= 1 && mono && L[hb].op === 1 && !!R.rect1 && R.rect1 === R.rect0,
    JSON.stringify({ hb: tHB, from: inStart && +(tHB - inStart.t).toFixed(2), full: full && +(tHB - full.t).toFixed(2), rect: R.rect1 === R.rect0 }));
  T.check('101: the pause button there all along', L.every(r => r.opP === 1), JSON.stringify(L.find(r => r.opP !== 1) || {}));
  T.check('no page errors (Bathurst)', !errors.length, errors.slice(0, 5).join(' | '));

  // every circuit with pits
  let ids = await page.evaluate(() => Core.TRACKS.filter(d => d.pit && !d.open && !d.test).map(d => d.id));
  T.check('13 circuits with pits (the test tracks left out)', ids.length === 13, ids.join(', '));
  if (ONLY) ids = ids.filter(id => ONLY.includes(id));
  for (const id of ids) {
    if (id === 'bathurst') continue;
    await startTrack(page, id);
    const Ri = await page.evaluate(RUN, 1.5), Li = Ri.L;
    if (hbIdx(Li) <= 0) { T.check(`${id}: one stop, the hand-back in the lane`, false, 'no hand-back'); continue; }
    common(Li, id);
  }
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
