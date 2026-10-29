// NEW VERSION · TEST 1: the walls of fence on the new map (js/newmap.js wallFlush: red and white plastic barriers, wooden fence by the
// countryside's garages) pushed aside by the car. The car is three circles along its length; a piece is a line with a thickness. On
// contact the two take an impulse (by their masses: a barrier full of water is heavy, a fence light), a piece slides and turns on the
// ground until its friction stops it, pushes the pieces it runs into, and a wooden one hit hard falls over (then the car drives over it).
// The solid things (H3.solids: the volcano's foot, the park's rides; js/nvpark.js) are lines with a thickness that do not move: the car
// bounces off them. Stepped with the race (js/game.js stepRace); the pieces moved are drawn where they are (their instances).
// The park's loose things (H3.loose: barrels, cones, stalls, crates, bins, benches, the low barriers' blocks, balloon stands, lamps; js/nvpark.js)
// are little rigid bodies as the trackside props (js/core.js PROPK, propStep, propCarHit): they stand until the car knocks them, then fly off,
// tumble and lie where they land, a stall falling apart into its counter, roof and posts, a stack of crates together, a knocked stand's balloons
// floating up and away; the car hardly slows. The bouncy castles are solid (the car bounces off them). The park's people walk out of the car's
// way (walkStep: off the lane onto the grass when it comes, back once it has gone; never hit). All of them one mesh (one draw call): the
// vertices of those that move put where they are.
const NVWalls = (function () {
  'use strict';
  const KIND = { plastic: { m: 160, mu: 0.55 }, wood: { m: 45, mu: 0.75, fall: 4 } };   // (kg; the friction on the ground; wood: the speed it is hit with that knocks it over, m/s)
  const CELL = 6, E = 0.25;   // (the grid's cells, m; the bounce)
  let W = null; const grid = new Map(), moving = new Set(), solid = new Map();
  // the loose things' kinds: m (kg), rh (their radius across: where the car's circles meet them), rb (their reach any way), e (the bounce), mu (the
  // friction), lift (how much of a hit throws them up), I (inertia), pts (the corners they rest on, from the middle), snd (the knock, js/sfx.js),
  // flat (knocked down and lying: driven over), off (the middle below the mesh's own: a cone's weight low); G: their gravity (js/core.js PROP_G)
  const cylP = (r, y0, y1, n) => { const p = []; for (const y of [y0, y1]) for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; p.push([Math.cos(a) * r, y, Math.sin(a) * r]); } return p; };
  const boxP = (x, y, z) => { const p = []; for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) p.push([sx * x, sy * y, sz * z]); return p; };
  const LOOSE = {
    barrel:  { m: 14, rh: 0.35, rb: 0.57, e: 0.35, mu: 0.6,  lift: 0.7,  I: 1.4, pts: cylP(0.35, -0.45, 0.45, 8), snd: 'barrel' },
    cone:    { m: 3,  rh: 0.22, rb: 0.5,  e: 0.3,  mu: 0.75, lift: 0.6,  I: 0.2, pts: cylP(0.22, -0.175, -0.175, 6).slice(0, 6).concat([[0, 0.525, 0]]), snd: 'cone', off: 0.175 },
    counter: { m: 35, rh: 1.1,  rb: 1.67, e: 0.15, mu: 0.75, lift: 0.35, I: 22,  pts: boxP(1.3, 0.55, 0.9), snd: 'crate' },
    roof:    { m: 8,  rh: 1.2,  rb: 1.83, e: 0.1,  mu: 0.8,  lift: 0.3,  I: 6,   pts: boxP(1.45, 0.06, 1.1), snd: 'crate', flat: true },
    post:    { m: 3,  rh: 0.1,  rb: 1.1,  e: 0.2,  mu: 0.6,  lift: 0.8,  I: 1.2, pts: boxP(0.04, 1.1, 0.04), snd: 'crate', flat: true },
    crate:   { m: 12, rh: 0.42, rb: 0.7,  e: 0.2,  mu: 0.7,  lift: 0.35, I: 1.3, pts: boxP(0.4, 0.4, 0.4), snd: 'crate' },
    bin:     { m: 9,  rh: 0.3,  rb: 0.55, e: 0.3,  mu: 0.6,  lift: 0.6,  I: 0.9, pts: cylP(0.3, -0.45, 0.45, 6), snd: 'barrel' },
    bench:   { m: 20, rh: 0.9,  rb: 1.0,  e: 0.15, mu: 0.8,  lift: 0.3,  I: 6,   pts: [[-0.9, -0.45, -0.25], [0.9, -0.45, -0.25], [-0.9, -0.45, 0.25], [0.9, -0.45, 0.25], [-0.9, 0.5, 0.26], [0.9, 0.5, 0.26], [-0.9, 0.05, -0.25], [0.9, 0.05, -0.25]], snd: 'bench', com: 0.45 },
    block:   { m: 14, rh: 0.75, rb: 1.05, e: 0.25, mu: 0.6,  lift: 0.4,  I: 4.5, pts: boxP(0.95, 0.4, 0.25), snd: 'barrel' },
    bstand:  { m: 8,  rh: 0.5,  rb: 0.7,  e: 0.2,  mu: 0.7,  lift: 0.4,  I: 0.8, pts: boxP(0.5, 0.4, 0.35), snd: 'crate' },
    balloon: { m: 0.05, rh: 0.28, rb: 0.28, e: 0, mu: 0, lift: 0, I: 0.01, pts: [], float: true },   // (let go when its stand is knocked: floats up and away)
    person:  { m: 70, rh: 0.3, rb: 1, e: 0, mu: 0, lift: 0, I: 1, pts: [], walker: true },   // (the park's people: they run out of the car's way, walkStep)
    lamp:    { m: 25, rh: 0.12, rb: 2.0,  e: 0.15, mu: 0.6,  lift: 0.15, I: 30,  pts: cylP(0.1, -1.4, -1.4, 4).slice(0, 4).concat([[0, 2.58, 0]]), snd: 'lamp', com: 1.4 },
  };
  const G = 13;
  let LZ = null, rs = 1; const lgrid = new Map(), lmoving = new Set();
  const rnd = () => (rs = (rs * 16807) % 2147483647) / 2147483647;   // (its own numbers: the same knock, the same flight)
  const key = (x, z) => Math.floor(x / CELL) * 100003 + Math.floor(z / CELL);
  function put(p) { p.k = key(p.x, p.z); let l = grid.get(p.k); if (!l) grid.set(p.k, l = []); l.push(p); }
  function take(p) { const l = grid.get(p.k); if (l) { const i = l.indexOf(p); if (i >= 0) l.splice(i, 1); } }
  function init(H3) {
    W = H3 && H3.walls; grid.clear(); moving.clear(); solid.clear();
    for (const q of (H3 && H3.solids) || []) {   // (in every cell the car's middle may be in when it touches one: its bounds and the car's 0.95 m)
      const m = q.r + 1; for (let i = Math.floor((Math.min(q.ax, q.bx) - m) / CELL); i <= Math.floor((Math.max(q.ax, q.bx) + m) / CELL); i++) for (let j = Math.floor((Math.min(q.az, q.bz) - m) / CELL); j <= Math.floor((Math.max(q.az, q.bz) + m) / CELL); j++) { const k = i * 100003 + j; let l = solid.get(k); if (!l) solid.set(k, l = []); l.push(q); }
    }
    LZ = (H3 && H3.loose) || null; lgrid.clear(); lmoving.clear(); rs = 1; if (LZ) for (const b of LZ.bits) lput(b);
    if (!W) return;
    for (const p of W.pieces) { p.vx = p.vz = p.w = 0; p.tilt = 0; p.fall = 0; p.hw = W.dims[p.kind].hw; p.h = W.dims[p.kind].h; p.m = KIND[p.kind].m; p.I = p.m * p.len * p.len / 12; put(p); }
  }
  // the nearest point of a piece's middle line to (x, z) and the way out of it (null: further than r + its half width)
  function touch(p, x, z, r) {
    const c = Math.cos(p.ang), s = Math.sin(p.ang), dx = x - p.x, dz = z - p.z, u = Math.max(-p.len / 2, Math.min(p.len / 2, dx * c + dz * s));
    const qx = p.x + c * u, qz = p.z + s * u, ex = x - qx, ez = z - qz, d = Math.hypot(ex, ez);
    if (d >= r + p.hw) return null;
    return d > 1e-6 ? { nx: ex / d, nz: ez / d, qx, qz, pen: r + p.hw - d } : { nx: -s, nz: c, qx, qz, pen: r + p.hw };
  }
  function near(x, z, f) { const i0 = Math.floor(x / CELL), j0 = Math.floor(z / CELL); for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) { const l = grid.get(i * 100003 + j); if (l) for (const p of l.slice()) f(p); } }
  // one contact: the impulse along n (from the piece to the other), the other's velocity there (vx, vz), its mass (Infinity: unmoved)
  function impulse(p, h, vx, vz, m2) {
    const rx = h.qx - p.x, rz = h.qz - p.z, pvx = p.vx - p.w * rz, pvz = p.vz + p.w * rx;
    const vn = (vx - pvx) * h.nx + (vz - pvz) * h.nz; if (vn >= 0) return 0;   // (moving apart)
    const rn = rx * h.nz - rz * h.nx, j = -(1 + E) * vn / (1 / m2 + 1 / p.m + rn * rn / p.I);
    p.vx -= j * h.nx / p.m; p.vz -= j * h.nz / p.m; p.w -= j * rn / p.I; moving.add(p);
    return j;
  }
  function step(dt, car) {
    if (!car) return;
    // the car: three circles along it (front, middle, back)
    const mc = (car.m && car.m.mass) || 1200, c = Math.cos(car.h), s = Math.sin(car.h);
    if (solid.size) for (const o of [1.3, 0, -1.3]) {   // the solid things: the car out of them, its speed into them bounced back (q.e: how much, E if not given)
      const x = car.x + c * o, z = car.z + s * o, r = 0.95, l = solid.get(key(x, z)); if (!l) continue;
      for (const q of l) {
        const dx = q.bx - q.ax, dz = q.bz - q.az, L2 = dx * dx + dz * dz, u = L2 ? Math.max(0, Math.min(1, ((x - q.ax) * dx + (z - q.az) * dz) / L2)) : 0;
        const ex = x - q.ax - dx * u, ez = z - q.az - dz * u, d = Math.hypot(ex, ez), pen = r + q.r - d; if (pen <= 0) continue;
        const nx = d > 1e-6 ? ex / d : -s, nz = d > 1e-6 ? ez / d : c, vn = car.vx * nx + car.vz * nz, e = q.e != null ? q.e : E;
        car.x += nx * pen; car.z += nz * pen; if (vn < 0) { car.vx -= (1 + e) * vn * nx; car.vz -= (1 + e) * vn * nz; if (q.snd && vn < -1.5 && (!car.propSnd || -vn > car.propSndV)) { car.propSnd = q.snd; car.propSndV = -vn; } }   // (q.snd: a bouncy castle's thud)
      }
    }
    if (LZ) looseStep(dt, car, mc, c, s);
    if (!W) return;
    for (const o of [1.3, 0, -1.3]) {
      const x = car.x + c * o, z = car.z + s * o, r = 0.95;
      near(x, z, (p) => {
        if (p.tilt > 1.1) return;   // (a fence lying flat: driven over)
        const h = touch(p, x, z, r); if (!h) return;
        const j = impulse(p, h, car.vx, car.vz, mc);
        if (j) { car.vx += j * h.nx / mc; car.vz += j * h.nz / mc; if (p.kind === 'wood' && !p.fall && j / p.m > KIND.wood.fall) p.fall = Math.sign((h.qx - x) * -Math.sin(p.ang) + (h.qz - z) * Math.cos(p.ang)) || 1; }   // (away from the car)
        // (out of each other: the light one moves the more)
        const k = mc / (mc + p.m); take(p); p.x -= h.nx * h.pen * k; p.z -= h.nz * h.pen * k; put(p); car.x += h.nx * h.pen * (1 - k); car.z += h.nz * h.pen * (1 - k); moving.add(p);
      });
    }
    if (!moving.size) return;
    const g = 9.81;
    for (const p of [...moving]) {
      const v = Math.hypot(p.vx, p.vz);
      if (v > 0) { const k = Math.max(0, 1 - KIND[p.kind].mu * g * dt / v); p.vx *= k; p.vz *= k; }   // (the friction on the ground)
      p.w *= Math.exp(-5 * dt);
      take(p); p.x += p.vx * dt; p.z += p.vz * dt; p.ang += p.w * dt; p.y = W.gy(p.x, p.z); put(p);
      if (p.fall) p.tilt = Math.min(Math.PI / 2, p.tilt + dt * (2 + p.tilt * 6));   // (falling over, faster as it goes)
      // the pieces it runs into: pushed (its ends and middle against them)
      const c2 = Math.cos(p.ang), s2 = Math.sin(p.ang);
      if (v > 0.2 && p.tilt < 1.1) for (const u of [-p.len / 2, 0, p.len / 2]) {
        const x = p.x + c2 * u, z = p.z + s2 * u, vx = p.vx - p.w * s2 * u, vz = p.vz + p.w * c2 * u;
        near(x, z, (q) => { if (q === p || q.tilt > 1.1) return; const h = touch(q, x, z, p.hw); if (!h) return; const j = impulse(q, h, vx, vz, p.m); if (j) { p.vx += j * h.nx / p.m; p.vz += j * h.nz / p.m; } take(q); q.x -= h.nx * h.pen * 0.5; q.z -= h.nz * h.pen * 0.5; put(q); take(p); p.x += h.nx * h.pen * 0.5; p.z += h.nz * h.pen * 0.5; put(p); });
      }
      draw(p);
      if (Math.hypot(p.vx, p.vz) < 0.03 && Math.abs(p.w) < 0.03 && (!p.fall || p.tilt >= Math.PI / 2)) { p.vx = p.vz = p.w = 0; moving.delete(p); }
    }
  }
  // the loose things: their grid (as the pieces'), one woken (a stall it is part of falls apart: its other parts loose too), an impulse at a point
  // (r: from the middle), what the driver feels (js/core.js propFeel: a little speed, a twitch, the knock's sound)
  function lput(b) { b.k = key(b.x, b.z); let l = lgrid.get(b.k); if (!l) lgrid.set(b.k, l = []); l.push(b); }
  function ltake(b) { const l = lgrid.get(b.k); if (l) { const i = l.indexOf(b); if (i >= 0) l.splice(i, 1); } }
  function lnear(x, z, f) { const i0 = Math.floor(x / CELL), j0 = Math.floor(z / CELL); for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) { const l = lgrid.get(i * 100003 + j); if (l) for (const b of l.slice()) f(b); } }
  function wake(b) {
    if (b.sleep) { b.sleep = false; b.t = 0; b.age = 0; lmoving.add(b); } b.knocked = true;
    const g = b.grp; if (!g || g.broken) return; g.broken = true;
    for (const p of g.parts) if (p !== b) { p.sleep = false; p.t = 0; p.age = 0; p.knocked = true; lmoving.add(p); p.vx = b.vx * 0.35 + (rnd() - 0.5) * 1.6; p.vz = b.vz * 0.35 + (rnd() - 0.5) * 1.6; p.vy = p.K.float ? 0.4 + rnd() * 0.8 : rnd() * 1.4; p.wx = (rnd() - 0.5) * 4; p.wy = (rnd() - 0.5) * 3; p.wz = (rnd() - 0.5) * 4; if (p.K.float) { p.vx *= 0.2; p.vz *= 0.2; p.wx = p.wy = p.wz = 0; } }
  }
  function limp(b, jx, jy, jz, rx, ry, rz) { const K = b.K; b.vx += jx / K.m; b.vy += jy / K.m; b.vz += jz / K.m; b.wx += (ry * jz - rz * jy) / K.I; b.wy += (rz * jx - rx * jz) / K.I; b.wz += (rx * jy - ry * jx) / K.I; }
  const _r = [0, 0, 0];
  function rot(b, px, py, pz) { const tx = 2 * (b.qy * pz - b.qz * py), ty = 2 * (b.qz * px - b.qx * pz), tz = 2 * (b.qx * py - b.qy * px); _r[0] = px + b.qw * tx + (b.qy * tz - b.qz * ty); _r[1] = py + b.qw * ty + (b.qz * tx - b.qx * tz); _r[2] = pz + b.qw * tz + (b.qx * ty - b.qy * tx); return _r; }
  function feel(car, m, v, snd) {
    const k = Math.min(0.045, m * 0.0016) * Math.min(1, v / 8); car.vx *= 1 - k; car.vz *= 1 - k; if (car.w != null) car.w += (rnd() - 0.5) * m * 0.012;
    car.hitDebris = Math.max(car.hitDebris || 0, v * Math.max(0.12, Math.min(0.35, m / 30)));
    if (v > 4) { car.propKnock = snd; car.propKnockV = v; } if (v > 1.5 && (!car.propSnd || v > car.propSndV)) { car.propSnd = snd; car.propSndV = v; }
  }
  // each step: the car against them (its three circles; knocked at bumper height they topple away), then those that move: in the air, on the
  // floor (contacts at their corners, the bounce and the friction), off the solid things and each other, asleep once still
  let lo = Infinity, hi = -1;
  function looseStep(dt, car, mc, c, s) {
    const cy = car.y || 0, sp = Math.hypot(car.vx, car.vz);
    for (const o of [1.3, 0, -1.3]) {
      const x = car.x + c * o, z = car.z + s * o, r = 0.95;
      lnear(x, z, (b) => {
        const K = b.K; if (K.float || K.walker || b.y - K.rb > cy + 1.3 || b.y + K.rb < cy + 0.05 || (K.flat && b.knocked && b.y - b.fy < 0.35)) return;   // (a balloon; far over it or under it; a roof or a post lying: driven over)
        let y0 = 1e9, y1 = -1e9; for (const p of K.pts) { const y = rot(b, p[0], p[1], p[2])[1]; if (y < y0) y0 = y; if (y > y1) y1 = y; } if (b.y + y0 > cy + 1.3 || b.y + y1 < cy + 0.05) return;   // (its lowest corner over the car's roof: a stall's roof)
        const ex = b.x - x, ez = b.z - z, rr = r + K.rh, e2 = ex * ex + ez * ez; if (e2 >= rr * rr) return;
        const e = Math.sqrt(e2) || 0.01, nx = ex / e, nz = ez / e, rx = -nx * K.rh, rz = -nz * K.rh, pcx = b.x + rx - car.x, pcz = b.z + rz - car.z, w = car.w || 0;
        const vrel = (car.vx - w * pcz - b.vx) * nx + (car.vz + w * pcx - b.vz) * nz;   // (closing at the contact)
        ltake(b); b.x += nx * (rr - e); b.z += nz * (rr - e); lput(b); draw2(b);   // (it gives way)
        if (vrel < 0.5) { if (b.grp && !b.grp.broken) wake(b); return; }   // (pushed slowly: a stall falls apart all the same)
        const ry = Math.max(-K.rb * 0.8, Math.min(K.rb * 0.8, cy + 0.42 - b.y)), ax = ry * nz, ay = rz * nx - rx * nz, az = -ry * nx;
        const j = 1.35 * vrel / (1 / K.m + (ax * ax + ay * ay + az * az) / K.I + 1 / mc);
        limp(b, nx * j, 0, nz * j, rx, ry, rz); if (!(b.hitT < 0.4)) b.vy = Math.min(7.5, b.vy + Math.min(5, vrel * K.lift * 0.22)); b.wy += (rnd() - 0.5) * Math.min(10, vrel * 0.5); b.hitT = 0;   // (thrown up once: not carried up on the bumper)
        const hs = Math.hypot(b.vx, b.vz), cap = Math.min(18, 1.1 * sp + 1.5); if (hs > cap) { b.vx *= cap / hs; b.vz *= cap / hs; }   // (off ahead of the car: it does not run into it again)
        const wl = Math.hypot(b.wx, b.wy, b.wz); if (wl > 14) { b.wx *= 14 / wl; b.wy *= 14 / wl; b.wz *= 14 / wl; }
        wake(b); feel(car, K.m, vrel, K.snd);
      });
    }
    if (lmoving.size) for (const b of [...lmoving]) lstep(b, dt);
    if (LZ.walkers.length) walkStep(dt, car, c, s, sp);
    if (hi > lo) { for (const a of [LZ.pos, LZ.nor]) { const R = a.updateRange; let o = lo * 3, e = hi * 3; if (R.count !== -1) { o = Math.min(o, R.offset); e = Math.max(e, R.offset + R.count); } R.offset = o; R.count = e - o; a.needsUpdate = true; } lo = Infinity; hi = -1; }   // (only what moved goes to the GPU: what is not there yet, with it)
  }
  // the park's people: one in the car's way (ahead of it, across its path, the faster it comes the further ahead) runs out of it sideways, off the
  // lane onto the grass (spot), and never lets the car touch them (out of its reach at once if it ever gets there); once the car is gone they
  // walk back to where they stood. Running they bob and lean into it
  const _y = new THREE.Vector3(0, 1, 0), _ax = new THREE.Vector3(), _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
  function walkStep(dt, car, c, s, sp) {
    const hx = sp > 0.5 ? car.vx / sp : c, hz = sp > 0.5 ? car.vz / sp : s, reach = 6 + sp * 1.4;
    const flee = (b, side, lat) => { for (const sd of [side, -side]) for (const extra of [0, 1.5, 3, 4.5]) { const out = 4.8 - sd * lat + extra, tx = b.x - hz * sd * out, tz = b.z + hx * sd * out; if (LZ.spot(tx, tz)) { b.tx = tx; b.tz = tz; b.st = 1; return; } }
      b.tx = b.x - hz * side * (5 - side * lat); b.tz = b.z + hx * side * (5 - side * lat); b.st = 1; };   // (no grass in reach: out of the way all the same)
    for (const b of LZ.walkers) {
      const dx = b.x - car.x, dz = b.z - car.z, d2 = dx * dx + dz * dz; if (b.st === 0 && d2 > (reach + 12) * (reach + 12)) continue;
      const along = dx * hx + dz * hz, lat = -dx * hz + dz * hx;   // (ahead of the car; to its left +)
      if (sp > 1 && Math.abs(lat) < 3.4 && along > -2.5 && along < reach && (b.st !== 1 || Math.abs(-(b.tx - car.x) * hz + (b.tz - car.z) * hx) < 3.4)) flee(b, Math.sign(lat) || (b.v0 % 2 ? 1 : -1), lat);
      let pushed = false; for (const o of [1.3, 0, -1.3]) { const ex = b.x - car.x - c * o, ez = b.z - car.z - s * o, e = Math.hypot(ex, ez); if (e < 1.35) { const k = (1.35 - e) / (e || 1); b.x += ex * k; b.z += ez * k; pushed = true; if (b.st !== 1) flee(b, Math.sign(lat) || 1, lat); } }   // (never touched)
      if (b.st === 3) { b.t += dt; if (b.t > 3 && (d2 > 25 * 25 || (sp < 0.5 && d2 > 8 * 8))) b.st = 2; }
      let mv = 0; if (b.st === 1 || b.st === 2) { const tx = b.st === 1 ? b.tx : b.home.x, tz = b.st === 1 ? b.tz : b.home.z, vx = tx - b.x, vz = tz - b.z, l = Math.hypot(vx, vz), v = b.st === 1 ? 5.5 : 1.3;
        if (l < 0.05) { if (b.st === 1) { b.st = 3; b.t = 0; } else { b.st = 0; b.x = b.home.x; b.z = b.home.z; } } else { const st = Math.min(l, v * dt); b.x += vx / l * st; b.z += vz / l * st; b.dx = vx / l; b.dz = vz / l; mv = v; } }
      if (!mv && !pushed) { if (b.still) continue; b.still = true; } else b.still = false;   // (standing: drawn once, upright)
      b.ph += dt * (mv > 3 ? 12 : 7);
      const gy = LZ.gy(b.x, b.z), bob = mv ? Math.abs(Math.sin(b.ph)) * (mv > 3 ? 0.09 : 0.04) : 0, lean = mv > 3 ? 0.22 : mv ? 0.06 : 0; b.y = gy + bob;
      if (lean) { _ax.set(b.dz, 0, -b.dx).normalize(); _q1.setFromAxisAngle(_ax, lean); } else _q1.set(0, 0, 0, 1); b.qx = _q1.x; b.qy = _q1.y; b.qz = _q1.z; b.qw = _q1.w;
      ltake(b); lput(b); draw2(b);
    }
  }
  function lstep(b, dt) {
    const K = b.K; b.age += dt; b.hitT = (b.hitT || 0) + dt;
    if (K.float) {   // (a balloon let go: up at 2 m/s or so, swaying in the breeze; out of sight above 45 m)
      b.vy = Math.min(2.4, b.vy + 1.6 * dt); const k = Math.max(0, 1 - 0.8 * dt); b.vx = b.vx * k + Math.sin(b.age * 1.3 + b.v0) * 0.6 * dt; b.vz = b.vz * k + Math.cos(b.age * 1.1 + b.v0) * 0.6 * dt;
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; if (b.y - b.fy > 45) { b.gone = true; b.sleep = true; lmoving.delete(b); } ltake(b); lput(b); draw2(b); return; }
    b.vy -= G * dt;
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
    const h = 0.5 * dt, qx = b.qx, qy = b.qy, qz = b.qz, qw = b.qw, wx = b.wx, wy = b.wy, wz = b.wz;   // (turned by its spin, the world's axes)
    b.qx = qx + h * (wx * qw + wy * qz - wz * qy); b.qy = qy + h * (wy * qw + wz * qx - wx * qz); b.qz = qz + h * (wz * qw + wx * qy - wy * qx); b.qw = qw - h * (wx * qx + wy * qy + wz * qz);
    const ql = Math.hypot(b.qx, b.qy, b.qz, b.qw) || 1; b.qx /= ql; b.qy /= ql; b.qz /= ql; b.qw /= ql;
    const gy = LZ.gy(b.x, b.z); b.fy = gy;
    if (solid.size && b.y - gy < 3) { const l = solid.get(key(b.x, b.z)); if (l) for (const q of l) {   // (off the rides, the volcano's foot, the toy shop)
      const dx = q.bx - q.ax, dz = q.bz - q.az, L2 = dx * dx + dz * dz, u = L2 ? Math.max(0, Math.min(1, ((b.x - q.ax) * dx + (b.z - q.az) * dz) / L2)) : 0;
      const ex = b.x - q.ax - dx * u, ez = b.z - q.az - dz * u, d = Math.hypot(ex, ez), pen = K.rh + q.r - d; if (pen <= 0) continue;
      const nx = d > 1e-6 ? ex / d : 1, nz = d > 1e-6 ? ez / d : 0, vn = b.vx * nx + b.vz * nz; b.x += nx * pen; b.z += nz * pen; if (vn < 0) { b.vx -= 1.3 * vn * nx; b.vz -= 1.3 * vn * nz; } } }
    let touch = false, maxPen = 0;
    for (const p of K.pts) {   // the floor: an impulse at every corner below it, its friction along it
      const rr = rot(b, p[0], p[1], p[2]), rx = rr[0], ry = rr[1], rz = rr[2], pen = gy - (b.y + ry); if (pen <= 0) continue;
      touch = true; if (pen > maxPen) maxPen = pen;
      const vpy = b.vy + b.wz * rx - b.wx * rz; if (vpy >= 0) continue;
      const j = -(1 + (vpy < -2 ? K.e : 0)) * vpy / (1 / K.m + (rx * rx + rz * rz) / K.I); limp(b, 0, j, 0, rx, ry, rz);
      const vpx = b.vx + b.wy * rz - b.wz * ry, vpz = b.vz + b.wx * ry - b.wy * rx, vt = Math.hypot(vpx, vpz);
      if (vt > 1e-4) { const tx = vpx / vt, tz = vpz / vt, ax = ry * tz, ay = rz * tx - rx * tz, az = -ry * tx, jt = Math.min(K.mu * j, vt / (1 / K.m + (ax * ax + ay * ay + az * az) / K.I)); limp(b, -tx * jt, 0, -tz * jt, rx, ry, rz); }
    }
    if (maxPen > 0) b.y += maxPen; if (b.vy > 8) b.vy = 8;
    if (touch) { const k = Math.max(0, 1 - 2.2 * dt), kv = Math.max(0, 1 - 1.4 * dt); b.wx *= k; b.wy *= k; b.wz *= k; b.vx *= kv; b.vz *= kv; } else { const kv = Math.max(0, 1 - 0.25 * dt); b.vx *= kv; b.vz *= kv; }
    lnear(b.x, b.z, (o) => { if (o !== b && !o.K.float && !o.K.walker && !(b.grp && o.grp === b.grp)) lpair(b, o); });   // (what it flies into: knocked too)
    ltake(b); lput(b);
    const v2 = b.vx * b.vx + b.vy * b.vy + b.vz * b.vz, w2 = b.wx * b.wx + b.wy * b.wy + b.wz * b.wz;
    if (touch && v2 < 0.05 && w2 < 0.2) b.t += dt; else b.t = 0;
    if (b.t > 0.35 || (b.age > 20 && v2 < 1)) { b.sleep = true; b.vx = b.vy = b.vz = b.wx = b.wy = b.wz = 0; b.t = 0; lmoving.delete(b); }
    if (!Number.isFinite(b.x + b.y + b.z + b.qw + b.vx + b.vz) || b.y < gy - 6) {   // (safety: back where it stood, upright)
      ltake(b); Object.assign(b, b.home); b.vx = b.vy = b.vz = b.wx = b.wy = b.wz = 0; b.sleep = true; lmoving.delete(b); lput(b); }
    draw2(b);
  }
  function lpair(a, b) {   // (a is awake; b may be asleep: a flying barrel knocks a cone over)
    const Ka = a.K, Kb = b.K, dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, r = (Ka.rb + Kb.rb) * 0.68, d2 = dx * dx + dy * dy + dz * dz; if (d2 >= r * r) return;
    const d = Math.sqrt(d2) || 0.01, nx = dx / d, ny = dy / d, nz = dz / d, pen = r - d, vr = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny + (a.vz - b.vz) * nz;
    const movable = !b.sleep || vr > 0.8, ia = 1 / Ka.m, ib = movable ? 1 / Kb.m : 0, it = ia + ib;
    a.x -= nx * pen * ia / it; a.y -= ny * pen * ia / it; a.z -= nz * pen * ia / it;
    if (ib) { ltake(b); b.x += nx * pen * ib / it; b.y += ny * pen * ib / it; b.z += nz * pen * ib / it; lput(b); draw2(b); }
    if (vr > 0) { const j = 1.15 * vr / it; a.vx -= j * nx * ia; a.vy -= j * ny * ia; a.vz -= j * nz * ia; if (ib) { b.vx += j * nx * ib; b.vy += j * ny * ib; b.vz += j * nz * ib; if (b.sleep) { b.wy += (rnd() - 0.5) * 3; wake(b); } } }
  }
  // a loose thing's vertices where it is (its mesh's part: from b.v0, its kind's shape turned by its quaternion)
  function draw2(b) {
    const T = b.tp, P = LZ.pos.array, N = LZ.nor.array, x = b.qx, y = b.qy, z = b.qz, w = b.qw;
    if (b.gone) { for (let i = 0, o = b.v0 * 3; i < T.p.length; i += 3, o += 3) { P[o] = b.x; P[o + 1] = b.y; P[o + 2] = b.z; } if (b.v0 < lo) lo = b.v0; if (b.v0 + T.p.length / 3 > hi) hi = b.v0 + T.p.length / 3; return; }   // (gone: its vertices one point)
    const m00 = 1 - 2 * (y * y + z * z), m01 = 2 * (x * y - w * z), m02 = 2 * (x * z + w * y), m10 = 2 * (x * y + w * z), m11 = 1 - 2 * (x * x + z * z), m12 = 2 * (y * z - w * x), m20 = 2 * (x * z - w * y), m21 = 2 * (y * z + w * x), m22 = 1 - 2 * (x * x + y * y);
    for (let i = 0, o = b.v0 * 3; i < T.p.length; i += 3, o += 3) { const px = T.p[i], py = T.p[i + 1], pz = T.p[i + 2], nx = T.n[i], ny = T.n[i + 1], nz = T.n[i + 2];
      P[o] = b.x + m00 * px + m01 * py + m02 * pz; P[o + 1] = b.y + m10 * px + m11 * py + m12 * pz; P[o + 2] = b.z + m20 * px + m21 * py + m22 * pz;
      N[o] = m00 * nx + m01 * ny + m02 * nz; N[o + 1] = m10 * nx + m11 * ny + m12 * nz; N[o + 2] = m20 * nx + m21 * ny + m22 * nz; }
    if (b.v0 < lo) lo = b.v0; if (b.v0 + T.p.length / 3 > hi) hi = b.v0 + T.p.length / 3;
  }
  // the loose things' mesh (js/nvpark.js): list [{ kind, x, y, z (the middle of its mesh), q (its turn), col (its colour), col2 (a roof's stripes), grp (a
  // stall's: its parts) }]; gy(x, z): the floor they lie on. Their shapes: a barrel, a cone, a stall's counter, its striped roof, its posts
  function looseBuild(list, gy, spot) {   // (spot(x, z): somewhere a person may stand out of the way: grass, not a way, a ride or the pond)
    const C = new THREE.Color(), shapes = new Map(), bits = [];
    const fromGeo = (g, col) => { const n = g.index ? g.toNonIndexed() : g, p = n.attributes.position.array, nn = n.attributes.normal.array, cc = new Float32Array(p.length); C.set(col); for (let i = 0; i < cc.length; i += 3) { cc[i] = C.r; cc[i + 1] = C.g; cc[i + 2] = C.b; } return { p: Float32Array.from(p), n: Float32Array.from(nn), c: cc }; };
    const merge = (parts) => { const S = parts.map(([g, c]) => fromGeo(g, c)), n = S.reduce((a, t) => a + t.p.length, 0), out = { p: new Float32Array(n), n: new Float32Array(n), c: new Float32Array(n) }; let o = 0;   // (one shape of several: a bench's seat, back and legs, a lamp's pole and head)
      for (const t of S) { out.p.set(t.p, o); out.n.set(t.n, o); out.c.set(t.c, o); o += t.p.length; } return out; };
    const stripes = (hx, hy, hz, n, cA, cB) => {   // (a box striped across: its top, its bottom, its front and back in n stripes, the ends in the stripes' colour)
      const p = [], nn = [], cc = [], A = new THREE.Color(cA), B = new THREE.Color(cB);
      const quad = (a, b, c, d, nx, ny, nz, col) => { for (const v of [a, b, c, a, c, d]) { p.push(...v); nn.push(nx, ny, nz); cc.push(col.r, col.g, col.b); } };
      for (let k = 0; k < n; k++) { const x0 = -hx + 2 * hx * k / n, x1 = -hx + 2 * hx * (k + 1) / n, col = k % 2 ? A : B;
        quad([x0, hy, hz], [x1, hy, hz], [x1, hy, -hz], [x0, hy, -hz], 0, 1, 0, col); quad([x0, -hy, -hz], [x1, -hy, -hz], [x1, -hy, hz], [x0, -hy, hz], 0, -1, 0, col);
        quad([x0, -hy, hz], [x1, -hy, hz], [x1, hy, hz], [x0, hy, hz], 0, 0, 1, col); quad([x1, -hy, -hz], [x0, -hy, -hz], [x0, hy, -hz], [x1, hy, -hz], 0, 0, -1, col); }
      quad([hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz], 1, 0, 0, A); quad([-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz], -1, 0, 0, A);
      return { p: Float32Array.from(p), n: Float32Array.from(nn), c: Float32Array.from(cc) }; };
    const shape = (kind, col, col2) => { const k = kind + col + (col2 || ''); if (shapes.has(k)) return shapes.get(k); let t;
      if (kind === 'barrel') t = fromGeo(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 10), col);
      else if (kind === 'cone') t = fromGeo(new THREE.ConeGeometry(0.22, 0.7, 8).translate(0, LOOSE.cone.off, 0), col);
      else if (kind === 'counter') t = fromGeo(new THREE.BoxGeometry(2.6, 1.1, 1.8), col);
      else if (kind === 'roof') t = stripes(1.45, 0.06, 1.1, 8, col2 || '#e8452c', '#f4f4f0');
      else if (kind === 'crate') t = fromGeo(new THREE.BoxGeometry(0.8, 0.8, 0.8), col);
      else if (kind === 'bin') t = fromGeo(new THREE.CylinderGeometry(0.3, 0.26, 0.9, 8), col);
      else if (kind === 'block') t = fromGeo(new THREE.BoxGeometry(1.9, 0.8, 0.5), col);
      else if (kind === 'bstand') t = fromGeo(new THREE.BoxGeometry(1, 0.8, 0.7), col);
      else if (kind === 'balloon') t = fromGeo(new THREE.SphereGeometry(0.28, 6, 4), col);
      else if (kind === 'bench') { const c = LOOSE.bench.com, P = [[new THREE.BoxGeometry(1.8, 0.1, 0.5), 0, 0.45, 0], [new THREE.BoxGeometry(1.8, 0.4, 0.08), 0, 0.75, 0.22]]; for (const sx of [-0.8, 0.8]) for (const sz of [-0.2, 0.2]) P.push([new THREE.BoxGeometry(0.08, 0.4, 0.08), sx, 0.2, sz]);
        t = merge(P.map(([g, x, y, z]) => [g.translate(x, y - c, z), col])); }
      else if (kind === 'lamp') { const c = LOOSE.lamp.com; t = merge([[new THREE.CylinderGeometry(0.07, 0.09, 3.6, 6).translate(0, 1.8 - c, 0), col], [new THREE.SphereGeometry(0.28, 6, 4).translate(0, 3.7 - c, 0), 0xfff8e0]]); }
      else if (kind === 'person') t = merge([[new THREE.CylinderGeometry(0.2, 0.24, 0.9, 5).translate(0, 0.95, 0), col], [new THREE.CylinderGeometry(0.17, 0.17, 0.5, 5, 1, true).translate(0, 0.25, 0), 0x2a3a5a], [new THREE.IcosahedronGeometry(0.17, 0).translate(0, 1.55, 0), 0xe0b89a]]);   // (from the feet up: as js/nvpark.js drew them)
      else t = fromGeo(new THREE.BoxGeometry(0.08, 2.2, 0.08), col);
      shapes.set(k, t); return t; };
    let nv = 0; for (const it of list) { const K = LOOSE[it.kind]; if (!K) continue; const tp = shape(it.kind, it.col, it.col2), q = it.q;
      const b = { kind: it.kind, K, tp, v0: nv, x: it.x, y: it.y, z: it.z, qx: q.x, qy: q.y, qz: q.z, qw: q.w, vx: 0, vy: 0, vz: 0, wx: 0, wy: 0, wz: 0, sleep: true, knocked: false, t: 0, age: 0, fy: gy(it.x, it.z), grp: it.grp || null };
      if (K.off) { const d = rot(b, 0, -K.off, 0); b.x += d[0]; b.y += d[1]; b.z += d[2]; }   // (its middle: a cone's weight low)
      if (K.com) { const d = rot(b, 0, K.com, 0); b.x += d[0]; b.y += d[1]; b.z += d[2]; }   // (a bench, a lamp: the list gives the spot it stands on)
      b.home = { x: b.x, y: b.y, z: b.z, qx: b.qx, qy: b.qy, qz: b.qz, qw: b.qw }; if (b.grp) b.grp.parts.push(b); nv += tp.p.length / 3; bits.push(b); }
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3);
    for (const b of bits) col.set(b.tp.c, b.v0 * 3);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true })); mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.dyn = 1; mesh.name = 'loose';
    for (const b of bits) if (b.K.walker) { b.st = 0; b.ph = b.v0 % 7; b.home.yaw = 0; }
    const out = { bits, mesh, gy, spot: spot || (() => true), walkers: bits.filter(b => b.K.walker), pos: geo.attributes.position, nor: geo.attributes.normal }, LZ0 = LZ; LZ = out; for (const b of bits) draw2(b); LZ = LZ0; lo = Infinity; hi = -1;
    geo.computeBoundingSphere(); if (geo.boundingSphere) geo.boundingSphere.radius += 30;   // (room for those that fly off)
    return out;
  }
  // a piece's instance where the piece is: turned about the upright (its heading), then about its length (falling over)
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _t = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0);
  function draw(p) {
    const im = W.mesh[p.kind]; if (!im) return;
    _q.setFromAxisAngle(Y, -p.ang); if (p.tilt) _q.multiply(_t.setFromAxisAngle(X, p.tilt * p.fall));
    _m.compose(_p.set(p.x, p.y, p.z), _q, _s.set(p.len / W.dims[p.kind].L, 1, 1)); im.setMatrixAt(p.i, _m); im.instanceMatrix.needsUpdate = true;
  }
  // (the tests: the pieces, and those moving)
  const state = () => ({ solids: [...new Set([].concat(...solid.values()))].length, n: W ? W.pieces.length : 0, plastic: W ? W.pieces.filter(p => p.kind === 'plastic').length : 0, wood: W ? W.pieces.filter(p => p.kind === 'wood').length : 0, moving: moving.size,
    loose: LZ ? LZ.bits.length : 0, looseKinds: LZ ? LZ.bits.reduce((o, b) => (o[b.kind] = (o[b.kind] || 0) + 1, o), {}) : {}, looseMoving: lmoving.size, looseGone: LZ ? LZ.bits.filter(b => b.gone).length : 0 });
  return { init, step, state, pieces: () => (W ? W.pieces : []), loose: () => (LZ ? LZ.bits : []), looseBuild };
})();
