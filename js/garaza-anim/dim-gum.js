/* Garaža: dim gum (I5 k #1084).
   Po menjavi z obema rokama (regalTwoShow) in spustu avta na kolesa: kratek preizkus na mestu. Zavore drži negnana os,
   gnani kolesi (po M.drive, kot v resnici: FF spredaj, FR/MR/RR zadaj, AWD vsa štiri) se zavrtita, iz njunih gum gre dim
   v barvi nove možnosti (DELI.dim, isti kot na dirki), motor zarjovi, roki na obroču medtem gresta počivat (vzporedno,
   regalTwoShow). Noben del se ne pojavi: samo dim. Dim gre prek obstoječih delcev (puffs, en klic risanja): brez novih
   klicev risanja in oglišč. Korak v vrstici: 'revs' (»Motor zaturira«); v FIT.log še 'smoke' (številka možnosti, kolesa).
   Kavelj: ena vrstica v js/garage3d.js (regalTwoShow, po 'down'); nalaganje: garaza.html. */
(function () {
  'use strict';
  const rnd = (a, b) => a + Math.random() * (b - a);
  // the driven wheels' list (front: true for the front axle): by the car's drive
  const driven = (M, w) => M.drive === 'AWD' ? true : M.drive === 'FF' ? w.front : !w.front;

  // the wheel's parts turned about its axle (z through its hub) by a, from their rest pose (poseCar sets only the wheel's own rotation,
  // so its children are free: a driven wheel spins while the others stand)
  function turnKids(w, a) {
    if (!w.obj) return;
    if (!w.kids) w.kids = w.obj.children.map(o => ({ o, p: o.position.clone(), q: o.quaternion.clone() }));
    const c = Math.cos(a), s = Math.sin(a), qz = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), a);
    for (const k of w.kids) { k.o.position.set(k.p.x * c - k.p.y * s, k.p.x * s + k.p.y * c, k.p.z); k.o.quaternion.copy(qz).multiply(k.q); }
  }
  // the car's backward direction on the floor (its turntable turned): world x, z
  function carBack(cv) { const d = new THREE.Vector3(-1, 0, 0).transformDirection(cv.v.bodyG.matrixWorld); d.y = 0; return d.normalize(); }
  function restKids(w) { if (!w.kids) return; for (const k of w.kids) { k.o.position.copy(k.p); k.o.quaternion.copy(k.q); } w.kids = null; }

  // C: { cv (the car, down on its wheels), puffs, eng, SFX, tween, wait, camTo, view, fitLog, idleOn }
  function* show(C) {
    const cv = C.cv; if (!cv || !cv.wheels || !self.DELI || !DELI.dim) return;
    const n = (cv.spec.deli || {}).dim_gum || 1, D = DELI.dim(n), M = cv.M;
    const W = cv.wheels.filter(w => driven(M, w)); if (!W.length) return;
    const rear = W.every(w => !w.front), wx = W.reduce((s, w) => s + w.x, 0) / W.length;
    // the camera low by the driven axle, a little behind it on the near side: the tyre and its smoke
    yield* C.camTo(C.view({ at: [wx + (rear ? -0.4 : 0.4), 0.4, 0], yaw: rear ? -0.62 : 0.62, pitch: 0.1, dist: 4.4, fov: 38 }), 0.7);
    C.fitLog('revs'); C.fitLog('smoke', { n, wheels: W.map(w => (w.front ? 'f' : 'r') + (w.sd < 0 ? 'l' : 'r')).join(','), drive: M.drive });
    const e = C.eng, ev = !!M.ev; e.locked = false; C.SFX.click();
    let ang = 0, em = 0, t = 0; const T = 2.4;
    if (C.SFX.hiss) C.SFX.hiss(T, 0.7);   // (the tyres' squeal)
    yield* C.tween(T, (k, u) => {
      const dt = u * T - t; t = u * T;
      const g = Math.min(1, u * 4) * Math.min(1, (1 - u) * 5);   // (the throttle: in fast, held, off at the end)
      e.speed = 70 * g; e.thr = g > 0.3 ? 1 : 0; cv.shake = 1 + g * 2.2; cv.roll = -0.01 * g;
      ang += dt * 38 * g; for (const w of W) turnKids(w, -ang);   // (forward, as poseCar turns them: -spin about z)
      em += dt * 90 * g;   // (puffs per wheel a second)
      while (em >= 1) { em -= 1;
        for (const w of W) {
          const P = w.obj ? w.obj.getWorldPosition(new THREE.Vector3()) : cv.v.bodyG.localToWorld(new THREE.Vector3(w.x, w.y, w.z));
          const k = (w.front ? 0 : 2) + (w.sd < 0 ? 0 : 1), c = D.at(k, t), r = Math.max(0.2, w.r || 0.3), b = carBack(cv);
          // from the tyre's patch on the floor, a little behind it: the tread throws it back (a forward spin), up and out to the side
          const x = P.x + b.x * r * 0.35 + rnd(-0.05, 0.05), z = P.z + b.z * r * 0.35 + rnd(-0.06, 0.06), v = rnd(0.8, 2.2), sv = rnd(0.1, 0.8) * w.sd;
          C.puffs.emit(x, 0.05, z, b.x * v - b.z * sv + rnd(-0.3, 0.3), rnd(0.25, 0.7), b.z * v + b.x * sv + rnd(-0.3, 0.3),
            rnd(1.6, 2.6) * c[4], rnd(0.12, 0.2), rnd(1.4, 2.2), [c[0], c[1], c[2]], Math.min(0.9, 0.5 * c[3]), -0.18, 1.6, 0.03);
        }
      }
    });
    e.speed = 0; e.thr = 0; cv.roll = 0; for (const w of W) restKids(w);
    if (!ev && C.idleOn) C.idleOn(cv);
    yield* C.wait(0.5);   // (the smoke rising and spreading as the arms come to rest)
  }
  self.GarazaDimGum = { show, driven };
})();
