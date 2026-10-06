/* SETTINGS ANIMATIONS — Kamera: Kamera, Oddaljenost, Položaj avta (and the circuit the other scenes share, A.LOOP) */
(function () {
  'use strict';
  const A = SetAnim, { TAU, clamp, lerp, sstep, ease, fract, hash, PAL } = A;

  /* ---------------- a small circuit: a rounded rectangle, clockwise (A.LOOP), with its trees, a stand, tyre stacks ---------------- */
  const LOOP = new A.Path(-15, 19, Math.PI / 2, [['s', 30], ['a', 12, 90], ['s', 14], ['a', 12, 90], ['s', 30], ['a', 12, 90], ['s', 14], ['a', 12, 90]], 1.2);
  const LOOP_THINGS = (() => {
    const a = [];
    for (let x = -96; x <= 96; x += 9) for (let z = -70; z <= 70; z += 9) {
      const r = hash(x * 0.71 + z * 1.37); if (r > 0.34) continue;
      const px = x + (hash(x - z) - 0.5) * 6, pz = z + (hash(x + z * 2) - 0.5) * 6;
      if (Math.abs(px) < 38 && Math.abs(pz) < 30) continue;   // (outside the track)
      if (pz > 26 && pz < 38 && Math.abs(px) < 24) continue;  // (the stand)
      a.push({ kind: hash(px) < 0.25 ? 'pine' : 'tree', x: px, z: pz, s: 0.75 + hash(pz) * 0.5, c: PAL.leaf[(x / 9 + z / 9 & 3 + 4) % 4] });
    }
    a.push({ kind: 'tree', x: -8, z: 2, s: 0.9, c: PAL.leaf[1] }, { kind: 'tree', x: 7, z: -3, s: 0.8, c: PAL.leaf[2] }, { kind: 'tree', x: 0, z: 5, s: 0.7, c: PAL.leaf[0] });
    a.push({ kind: 'stand', x: 0, z: 31, w: 34, d: 5, hgt: 3.2, crowd: 0.85, wave: true });
    for (const [x, z] of [[33, 26], [-33, 26], [33, -26], [-33, -26]]) a.push({ kind: 'tyres', x, z, dx: Math.sign(-x) * 0.7, dz: Math.sign(-z) * 0.7 });
    a.push({ kind: 'house', x: -52, z: -8, w: 10, d: 7, hgt: 4, h: 0.2 }, { kind: 'house', x: 54, z: 10, w: 8, d: 6, hgt: 3.5, h: -0.3, roof: '#5d7b9a' });
    return a;
  })();
  // a car round the loop: s metres along; drift (rad) at the full of a bend; d: across the road
  function loopCar(s, col, o) {
    o = o || {}; const P = LOOP, q = P.at(s, o.d || 0);
    let k = 0; for (const ds of [-5, -2, 1, 3]) k += P.at(s + ds).k; k /= 4;
    return { x: q.x, z: q.z, h: q.h + (o.drift == null ? 0.24 : o.drift) * k * 12, col, marker: !!o.marker, steer: clamp(k * 12 * 0.35, -0.5, 0.5), s, stripe: o.stripe, num: o.num };
  }
  A.LOOP = LOOP; A.LOOP_THINGS = LOOP_THINGS; A.loopCar = loopCar;

  // the camera the game has (iso: north up, ~47° down, a long lens, a look ahead along the travel; chase: behind, ~56° down, wide)
  function gameCam(mode, car, o) {
    o = o || {}; const zoom = o.zoom || 1, back = o.back || 0;
    const fx = Math.sin(o.hv != null ? o.hv : car.h), fz = Math.cos(o.hv != null ? o.hv : car.h);
    if (mode === 'chase') {
      const D = (o.Dc || 26) * zoom, ahead = (o.ahc || 7.5) + back;
      return A.camAt(car.x + fx * ahead, 0, car.z + fz * ahead, D, o.hv != null ? o.hv : car.h, 0.98, 58);
    }
    const D = (o.Di || 46) * zoom, ahead = (o.ahi || 8) + back;
    return A.camAt(car.x + fx * ahead, 0, car.z + fz * ahead, D, 0, 0.82, 30);
  }
  A.gameCam = gameCam;
  // the camera mode the other settings' pictures follow (Kamera's value), eased: 0 iso .. 1 chase
  function camMode(S, dt) {
    const want = A.env && A.env.get && A.env.get('camera') === 'chase' ? 1 : 0;
    if (S.cm == null) S.cm = want; S.cm += (want - S.cm) * (1 - Math.exp(-(dt || 0) * 5)); if (Math.abs(want - S.cm) < 0.002) S.cm = want; return S.cm;
  }
  A.camMode = camMode;
  // the phone, lying (c = 0) or upright (c = 1), its picture kept upright; draw(g, w, h) its picture
  function turningPhone(g, cx, cy, W, H, c, draw, o) {
    o = o || {};
    const pl = Math.min(W * (o.wl || 0.6), H * 1.75), pp = H * (o.hp || 0.92), pw = lerp(pl, pp, ease(c)), ph = pw * 0.47, bz = Math.min(pw, ph) * 0.06;
    const sw = pw - bz * 2, sh = ph - bz * 2, rot = ease(c) * Math.PI / 2;
    const cw = lerp(sw, sh, ease(c)), ch = lerp(sh, sw, ease(c));
    A.phone(g, cx, cy, pw, ph, rot, draw, { upright: 0, cw, ch });
    return { pw, ph, rot, w: lerp(pw, ph, ease(c)), h: lerp(ph, pw, ease(c)) };
  }
  A.turningPhone = turningPhone;
  // the camera in a side view: the car on the ground, the camera up and behind it at dist (0..1 of the room), at angle (rad)
  function camDiagram(g, x0, y0, w, h, dist, angle, o) {
    o = o || {};
    const gy = y0 + h * 0.84, cx = x0 + w * 0.82;
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, gy); g.lineTo(x0 + w, gy); g.stroke();
    // the car, from the side
    const cl = Math.min(w * 0.26, h * 0.5), ch = cl * 0.32;
    g.fillStyle = PAL.player; A.rr(g, cx - cl / 2, gy - ch * 0.95, cl, ch * 0.6, ch * 0.2); g.fill();
    A.rr(g, cx - cl * 0.25, gy - ch * 1.35, cl * 0.42, ch * 0.5, ch * 0.18); g.fill();
    g.fillStyle = '#14171c'; for (const k of [-0.3, 0.3]) { g.beginPath(); g.arc(cx + k * cl, gy - ch * 0.3, ch * 0.3, 0, TAU); g.fill(); }
    // the camera along its line
    const L = Math.min(w * 0.75, (h * 0.78) / Math.sin(angle)) * dist, px = cx - Math.cos(angle) * L, py = gy - ch * 0.6 - Math.sin(angle) * L;
    g.strokeStyle = 'rgba(255,198,41,.55)'; g.setLineDash([3, 4]); g.lineWidth = 1.4; g.beginPath(); g.moveTo(px, py); g.lineTo(cx, gy - ch * 0.6); g.stroke(); g.setLineDash([]);
    g.fillStyle = 'rgba(255,198,41,.12)'; g.beginPath(); g.moveTo(px, py); const sp = 0.32;
    g.lineTo(px + Math.cos(-angle + sp) * L * 1.15, py - Math.sin(-angle + sp) * L * 1.15); g.lineTo(px + Math.cos(-angle - sp) * L * 1.15, py - Math.sin(-angle - sp) * L * 1.15); g.closePath(); g.fill();
    g.save(); g.translate(px, py); g.rotate(angle); const s = Math.min(h * 0.12, w * 0.1);
    g.fillStyle = '#dfe6f1'; A.rr(g, -s * 1.1, -s * 0.6, s * 1.6, s * 1.2, s * 0.25); g.fill(); g.beginPath(); g.moveTo(s * 0.5, -s * 0.35); g.lineTo(s * 1.15, -s * 0.65); g.lineTo(s * 1.15, s * 0.65); g.lineTo(s * 0.5, s * 0.35); g.closePath(); g.fill();
    g.fillStyle = PAL.curb; g.beginPath(); g.arc(-s * 0.7, -s * 0.25, s * 0.17, 0, TAU); g.fill();
    g.restore();
    if (o.label) A.text(g, o.label, (px + cx) / 2 - 8, (py + gy) / 2 - 10, { size: Math.max(9, h * 0.075), col: PAL.gold, w: 800 });
  }

  /* ---------------- Kamera: Izometrična (telefon ležeče) / Za avtom (telefon pokonci) ---------------- */
  A.def('camera', {
    opts: ['iso', 'chase'], dur: 1.0,
    P: (v) => ({ c: v === 'chase' ? 1 : 0 }),
    init(S) { S.V = new A.View(); },
    draw(g, W, H, t, p, st, S) {
      A.studio(g, W, H);
      const s = t * 17, car = loopCar(s, PAL.player, { marker: true }), rival = loopCar(s + 22, PAL.rivals[1], { d: 1.5 });
      const hv = LOOP.at(s - 4).h;   // (the chase camera swings after the car a little)
      const c = p.c, wide = W / H > 2.6;
      const cx = W / 2, cy = H / 2;
      // the rotation hint: a curved arrow beside the phone while it turns
      turningPhone(g, cx, cy, W, H, c, (g2, w, h) => {
        const ci = gameCam('iso', car, { Di: 50 }), cc = gameCam('chase', car, { hv, Dc: 30 });
        const V = S.V.set(A.camMix(ci, cc, ease(c)), 0, 0, w, h);
        A.scene(g2, V, { t, roads: [{ P: LOOP, w: 9 }], things: LOOP_THINGS, cars: [rival, car] });
      }, { wl: wide ? 0.42 : 0.62 });
      if (p.k < 1 && st.since < 1.2) { g.save(); g.globalAlpha = Math.sin(p.k * Math.PI); A.arrowArc(g, cx, cy, H * 0.5, -0.9, -0.2, PAL.gold, 3); A.arrowArc(g, cx, cy, H * 0.5, Math.PI - 0.9, Math.PI - 0.2, PAL.gold, 3); g.restore(); }
    }
  });

  /* ---------------- Oddaljenost: Blizu / Srednje / Daleč ---------------- */
  A.def('zoom', {
    opts: [1.1, 1.4, 1.7], dur: 0.9,
    P: (v) => ({ z: +v }),
    init(S) { S.V = new A.View(); },
    draw(g, W, H, t, p, st, S) {
      A.studio(g, W, H);
      const cm = camMode(S, st.dt), wide = W / H > 2.6;
      const s = t * 15, car = loopCar(s, PAL.player, { marker: true }), rival = loopCar(s - 18, PAL.rivals[2], { d: -1.5 }), hv = LOOP.at(s - 4).h;
      // left: the camera's distance from the car, from the side
      const dw = wide ? W * 0.36 : W * 0.42;
      camDiagram(g, W * 0.03, H * 0.05, dw, H * 0.9, clamp((p.z - 0.75) / 1.05, 0.2, 1), lerp(0.82, 0.98, cm) * 0.85);
      // right: what the phone shows
      const px = wide ? W * 0.66 : W * 0.72;
      turningPhone(g, px, H / 2, W, H, cm, (g2, w, h) => {
        const V = S.V.set(A.camMix(gameCam('iso', car, { zoom: p.z, Di: 34 }), gameCam('chase', car, { hv, zoom: p.z, Dc: 21 }), ease(cm)), 0, 0, w, h);
        A.scene(g2, V, { t, roads: [{ P: LOOP, w: 9 }], things: LOOP_THINGS, cars: [rival, car] });
      }, { wl: wide ? 0.42 : 0.5, hp: 0.92 });
    }
  });

  /* ---------------- Položaj avta: Običajno, nižje 2 / 5 / 7 / 10 m ---------------- */
  const RUN = new A.Path(0, -60, 0, [['s', 70], ['a', 40, 25], ['s', 30], ['a', 40, -50], ['s', 30], ['a', 40, 25], ['s', 80]], 1.5);
  const RUN_THINGS = (() => { const a = [], q = {}; for (let s = 0; s < RUN.len; s += 7) for (const side of [-1, 1]) { if (hash(s + side) > 0.55) continue; RUN.at(s, side * (11 + hash(s * 3 + side) * 14), q); a.push({ kind: hash(s * 7) < 0.4 ? 'pine' : 'tree', x: q.x, z: q.z, s: 0.7 + hash(s) * 0.5, c: PAL.leaf[Math.floor(s) % 4] }); } return a; })();
  A.def('carLow', {
    opts: [0, 1, 2, 3, 4], dur: 0.8,
    P: (v) => ({ b: [0, 2, 5, 7, 10][+v] || 0 }),
    init(S) { S.V = new A.View(); },
    draw(g, W, H, t, p, st, S) {
      A.studio(g, W, H);
      const cm = camMode(S, st.dt), wide = W / H > 2.6, T = fract(t / 9) * 9;
      const s = 10 + T * 20, q = RUN.at(s), car = { x: q.x, z: q.z, h: q.h, col: PAL.player, marker: true, steer: q.k * 8 };
      // (the game's metres, in this smaller picture: its camera is ~64 m (chase) and ~80 m (iso) away, here 22 and 36)
      const iso = gameCam('iso', car, { back: p.b * 0.45, Di: 36, ahi: 6 }), ch = gameCam('chase', car, { back: p.b * 0.34, Dc: 22, ahc: 4.5 });
      const cam = A.camMix(iso, ch, ease(cm));
      const fx = Math.sin(car.h), fz = Math.cos(car.h);
      const bk = p.b * lerp(0.45, 0.34, ease(cm)), ref = { x: car.x + fx * bk, z: car.z + fz * bk, h: car.h };   // (where the car stands in the picture with Običajno)
      const cx = wide ? W * 0.5 : W * 0.5;
      const ph = turningPhone(g, cx, H / 2, W, H, cm, (g2, w, h) => {
        const V = S.V.set(cam, 0, 0, w, h);
        A.scene(g2, V, { t, roads: [{ P: RUN, w: 9 }], things: RUN_THINGS, cars: [car], over: (g3, V3) => {
          if (bk < 0.15) return;
          const T3 = [0, 0, 0, 0], a = V3.p(ref.x, 0.6, ref.z, T3).slice(), b = V3.p(car.x, 0.6, car.z, [0, 0, 0, 0]);
          if (!a[3] || !b[3]) return;
          // the usual place: a dashed outline of the car; an arrow down to where it is now
          const L = V3.f * 4.6 / a[2];
          g3.save(); g3.translate(a[0], a[1]); g3.rotate(-(car.h - V3.cam.yaw)); g3.setLineDash([3, 3]); g3.strokeStyle = 'rgba(255,255,255,.85)'; g3.lineWidth = 1.5; A.rr(g3, -L * 0.23, -L / 2, L * 0.46, L, L * 0.12); g3.stroke(); g3.restore();
          if (Math.hypot(a[0] - b[0], a[1] - b[1]) > L * 0.5) A.arrow(g3, a[0] + L * 0.42, a[1], b[0] + L * 0.42, b[1], PAL.gold, 2.2, 7);
        } });
      }, { wl: wide ? 0.42 : 0.55, hp: 0.94 });
      // the road it shows ahead: a bracket beside the phone from the car up to the top of the picture
      const bx = cx + ph.w / 2 + 10, top = H / 2 - ph.h / 2 + 4, carY = H / 2 + ph.h / 2 - ph.h * (0.5 - 0.05 * p.b / 10) * 0 - ph.h * lerp(0.36, 0.14, p.b / 10);
      g.strokeStyle = 'rgba(255,198,41,.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(bx - 4, top); g.lineTo(bx, top); g.lineTo(bx, carY); g.lineTo(bx - 4, carY); g.stroke();
      A.arrow(g, bx, carY - 2, bx, top + 2, PAL.gold, 2, 7);
    }
  });
})();
