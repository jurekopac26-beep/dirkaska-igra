// Mockup only (drone.mjs): drone shots of a track drawn by the game's own renderer, in the game's page (headless, virtual time), so
// everything the game shows moves in them: its traffic and people on the open road (a race in the traffic, the player's car driving
// itself), or the title screen's race of AI cars, the birds, the helicopters, the crowds, the boats. The camera is a drone's: smooth,
// gimbal-steady moves over the road (push along it, orbit a place, look straight down and turn, rise to reveal), set as the renderer's
// own TV shot (Render.setShot), without the game's miniature blur.
window.DR = (function () {
  const STEP = 1 / 120;
  let R = null, T = null, mode = 'demo', target = null, cv = null, fps = 30;
  const ease = (t) => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  // the race the shots are of: the game's race (in the traffic) or the title screen's demo; the canvas the game draws into
  function setup(o) {
    mode = o.mode || 'demo'; fps = o.fps || 30;
    R = mode === 'traffic' ? window.__game.race : window.__game.demo; T = R.track;
    cv = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0];
    // a drone sees the forest as it is: no fading of the trees between the camera and the followed car (Ouninpohja's aid for the driver)
    if (!World.__dr) { const V = World.view; World.view = (out, cam) => V(out, cam, null); World.__dr = true; }
    target = mode === 'traffic' ? R.player : R.cars[0];
    if (R.tf && o.extra) more(o.extra);
    return { len: T.len, raceLen: T.raceLen || T.len, startS: T.startS, open: T.finishS > T.startS, cw: cv.width, ch: cv.height, cars: R.cars.length, tf: !!R.tf };
  }
  // a busier day on the open road: `dens` times as many vehicles again as the game puts there (the game's own kinds and share of them:
  // cars, vans, buses, motorbikes), each at least 45 m from any other going the same way
  function more(dens) {
    const tf = R.tf, Tt = tf.T; let seed = 12345; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (const dir of [1, -1]) {
      const a = dir > 0 ? Tt.startS + 180 : tf.s0 + 60, L = tf.s1 - 30 - a, n = Math.round(L / (dir > 0 ? 290 : 250) * dens);
      for (let k = 0; k < n; k++) {
        const s = a + (k + 0.1 + 0.8 * rnd()) * L / n, u = rnd();
        if (tf.veh.some(v => v.dir === dir && Math.abs(v.s - s) < 45)) continue;
        tf._veh(dir, u < 0.07 ? 2 : u < 0.24 ? 1 : u < 0.32 ? 3 : 0, s);
      }
    }
  }
  // the road at d metres from the start (a closed track: round and round): its middle, height, heading (smoothed over ~60 m)
  function road(d) {
    const s = ((T.startS + d) % T.len + T.len) % T.len, i = T.idx(s), j = T.idx((s + 30) % T.len), k = T.idx((s - 30 + T.len) % T.len);
    const hx = T.px[j] - T.px[k], hz = T.pz[j] - T.pz[k], l = Math.hypot(hx, hz) || 1;
    return { x: T.px[i], y: T.hy[i], z: T.pz[i], hx: hx / l, hz: hz / l };
  }
  // the road smoothed over +-r metres (the path a drone flies along a winding road)
  function roadS(d, r) { let x = 0, y = 0, z = 0, n = 0; for (let e = -r; e <= r; e += 10) { const p = road(d + e); x += p.x; y += p.y; z += p.z; n++; } const p = road(d); return { x: x / n, y: y / n, z: z / n, hx: p.hx, hz: p.hz }; }
  function ground(x, z, y0) { const W = Render.world, g = W && W.groundH ? W.groundH(x, z) : NaN; return Number.isFinite(g) ? g : y0; }
  // where the camera is and looks in a shot at t (0..1), before keeping it clear of the land (pose)
  function pose0(S, t) {
    const u = ease(t), fov = S.fov || 50;
    if (S.kind === 'push') {   // along the road, from d0 to d1, rising from h0 to h1, a little to the side, looking `look` m ahead
      const d = lerp(S.d0, S.d1, S.lin ? t : u), c = roadS(d, S.smooth || 60), a = roadS(d + (S.look || 120), S.smooth || 60), h = lerp(S.h0, S.h1 == null ? S.h0 : S.h1, u), sd = S.side || 0;
      const px = c.x - c.hz * sd, pz = c.z + c.hx * sd;
      return { px, py: Math.max(c.y, ground(px, pz, c.y)) + h, pz, tx: a.x, ty: a.y + (S.lookUp || 0), tz: a.z, fov };
    }
    if (S.kind === 'orbit') {   // round a place on the road (or beside it), at radius r and height h, from angle a0 to a1 (0: behind it)
      const c = road(S.d), ang = (lerp(S.a0, S.a1, S.lin ? t : u)) * Math.PI / 180, b = Math.atan2(c.hz, c.hx) + Math.PI + ang, r = lerp(S.r, S.r1 == null ? S.r : S.r1, u);
      const ox = S.ox ? -c.hz * S.ox : 0, oz = S.ox ? c.hx * S.ox : 0, cx = c.x + ox, cz = c.z + oz, px = cx + Math.cos(b) * r, pz = cz + Math.sin(b) * r;
      return { px, py: c.y + lerp(S.h, S.h1 == null ? S.h : S.h1, u), pz, tx: cx, ty: c.y + (S.lookUp || 0), tz: cz, fov };
    }
    if (S.kind === 'top') {   // straight down (a few degrees off) over a place, turning from yaw0 to yaw1, sinking from h to h1
      const c = road(S.d), yaw = lerp(S.yaw0 || 0, S.yaw1 || 0, S.lin ? t : u) * Math.PI / 180 + Math.atan2(c.hz, c.hx), h = lerp(S.h, S.h1 == null ? S.h : S.h1, u), off = h * Math.tan((S.tilt || 10) * Math.PI / 180);
      const cx = c.x + (S.ox ? -c.hz * S.ox : 0), cz = c.z + (S.ox ? c.hx * S.ox : 0);
      return { px: cx - Math.cos(yaw) * off, py: c.y + h, pz: cz - Math.sin(yaw) * off, tx: cx, ty: c.y, tz: cz, fov };
    }
    if (S.kind === 'rise') {   // behind a place, rising from h0 to h1 while the look lifts from the road near it to the far land
      const c = roadS(S.d, S.smooth || 40), back = lerp(S.back, S.back1 == null ? S.back : S.back1, u), px = c.x - c.hx * back - c.hz * (S.side || 0), pz = c.z - c.hz * back + c.hx * (S.side || 0);
      const a = road(S.d + lerp(S.look0 || 40, S.look1 || 400, u)), py = Math.max(c.y, ground(px, pz, c.y)) + lerp(S.h0, S.h1, u);
      return { px, py, pz, tx: a.x, ty: a.y + lerp(S.up0 || 0, S.up1 || 0, u), tz: a.z, fov };
    }
    throw new Error('shot kind ' + S.kind);
  }
  // clear of the land and the trees: the lowest the camera may fly along a shot (the ground under its path + `clear` m, the highest point
  // within a stretch round each moment, smoothed), so it glides over a ridge instead of going through the forest
  const floors = new WeakMap();
  function floorOf(S) {
    if (floors.has(S)) return floors.get(S);
    const n = 61, raw = [], c = S.clear == null ? 38 : S.clear;
    for (let i = 0; i < n; i++) { const P = pose0(S, i / (n - 1)); let g = -1e9; for (const [ox, oz] of [[0, 0], [12, 0], [-12, 0], [0, 12], [0, -12]]) g = Math.max(g, ground(P.px + ox, P.pz + oz, -1e9)); raw.push(g + c); }
    const mx = raw.map((v, i) => Math.max(...raw.slice(Math.max(0, i - 8), i + 9))), sm = mx.map((v, i) => { let a = 0, w = 0; for (let k = -6; k <= 6; k++) { const j = Math.min(n - 1, Math.max(0, i + k)), q = Math.exp(-k * k / 18); a += mx[j] * q; w += q; } return a / w; });
    const f = (t) => { const x = Math.min(1, Math.max(0, t)) * (n - 1), i = Math.min(n - 2, Math.floor(x)); return sm[i] + (sm[i + 1] - sm[i]) * (x - i); };
    floors.set(S, f); return f;
  }
  function pose(S, t) { const P = pose0(S, t); if (S.kind !== 'top') P.py = Math.max(P.py, floorOf(S)(t)); return P; }
  // the race goes on for sec seconds (nothing drawn): the traffic race with the player's car driving itself, or the demo's AI cars
  function run(sec) {
    if (mode === 'traffic') window.__game.sim(sec, true);
    else for (let t = 0; t < sec; t += STEP) { R.step(STEP); for (const c of R.cars) { c.hitWall = 0; c.hitCar = 0; } }
  }
  // until one of the cars (the race's, not the traffic) is `before` metres short of d (at most max seconds)
  function waitCar(d, before, max) {
    const want = ((T.startS + d - before) % T.len + T.len) % T.len;
    for (let t = 0; t < (max || 120); t += 0.1) {
      for (const c of R.cars) { const s = c.q ? c.q.s : null; if (s == null) continue; const gap = ((want - s) % T.len + T.len) % T.len; if (gap < 12 || gap > T.len - 12) { target = c; return t; } }
      run(0.1);
    }
    return -1;
  }
  // frame k of a shot: the race a frame on, the camera where the shot has it, drawn by the game (JPEG)
  function frame(S, k, n) {
    run(1 / fps);
    const P = pose(S, n > 1 ? k / (n - 1) : 0);
    Render.setShot({ px: P.px, py: P.py, pz: P.pz, tx: P.tx, ty: P.ty, tz: P.tz, fov: P.fov, near: 2, sky: true, blur: 0 });
    Render.frame(1 / fps, 1, target, mode === 'traffic' ? 'chase' : 'iso', {});
    return cv.toDataURL('image/jpeg', 0.9);
  }
  // where the race cars are (for timing the shots)
  function cars() { return R.cars.map(c => c.q ? Math.round(((c.q.s - T.startS) % T.len + T.len) % T.len) : null); }
  return { setup, pose, run, waitCar, frame, cars, road };
})();
