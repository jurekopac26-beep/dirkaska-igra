// NEW VERSION · TEST 1: the walls of fence on the new map (js/newmap.js wallFlush: red and white plastic barriers, wooden fence by the
// countryside's garages) pushed aside by the car. The car is three circles along its length; a piece is a line with a thickness. On
// contact the two take an impulse (by their masses: a barrier full of water is heavy, a fence light), a piece slides and turns on the
// ground until its friction stops it, pushes the pieces it runs into, and a wooden one hit hard falls over (then the car drives over it).
// Stepped with the race (js/game.js stepRace); the pieces moved are drawn where they are (their instances).
const NVWalls = (function () {
  'use strict';
  const KIND = { plastic: { m: 160, mu: 0.55 }, wood: { m: 45, mu: 0.75, fall: 4 } };   // (kg; the friction on the ground; wood: the speed it is hit with that knocks it over, m/s)
  const CELL = 6, E = 0.25;   // (the grid's cells, m; the bounce)
  let W = null; const grid = new Map(), moving = new Set();
  const key = (x, z) => Math.floor(x / CELL) * 100003 + Math.floor(z / CELL);
  function put(p) { p.k = key(p.x, p.z); let l = grid.get(p.k); if (!l) grid.set(p.k, l = []); l.push(p); }
  function take(p) { const l = grid.get(p.k); if (l) { const i = l.indexOf(p); if (i >= 0) l.splice(i, 1); } }
  function init(H3) {
    W = H3 && H3.walls; grid.clear(); moving.clear(); if (!W) return;
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
    if (!W || !car) return;
    // the car: three circles along it (front, middle, back)
    const mc = (car.m && car.m.mass) || 1200, c = Math.cos(car.h), s = Math.sin(car.h);
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
  // a piece's instance where the piece is: turned about the upright (its heading), then about its length (falling over)
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _t = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0);
  function draw(p) {
    const im = W.mesh[p.kind]; if (!im) return;
    _q.setFromAxisAngle(Y, -p.ang); if (p.tilt) _q.multiply(_t.setFromAxisAngle(X, p.tilt * p.fall));
    _m.compose(_p.set(p.x, p.y, p.z), _q, _s.set(p.len / W.dims[p.kind].L, 1, 1)); im.setMatrixAt(p.i, _m); im.instanceMatrix.needsUpdate = true;
  }
  // (the tests: the pieces, and those moving)
  const state = () => ({ n: W ? W.pieces.length : 0, plastic: W ? W.pieces.filter(p => p.kind === 'plastic').length : 0, wood: W ? W.pieces.filter(p => p.kind === 'wood').length : 0, moving: moving.size });
  return { init, step, state, pieces: () => (W ? W.pieces : []) };
})();
