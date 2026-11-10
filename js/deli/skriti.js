/* Deli iz garaže, sklop 3 · skriti deli (načrt 2.6): filter_zraka, cip, turbo, akumulator, vzmeti, amortizerji, stabilizatorji,
   dim_gum (the contract: docs/deli.md). Loaded after js/deli.js, before the cars.
   Each is drawn where it really sits, in the inner block (the engine bay, the wheel arches): unseen while the car is
   whole (the inner block is drawn only once a part is off or a door open), so the garage's part alone (DELI.mesh) shows it as under a
   see-through bonnet or in a wheel arch. On the car only what it does shows: the power, the mass, the grip (js/deli.js DELI.effect,
   core.js applyDeli), the body lower on its springs (vzmeti: DELI.dress, js/deli/barve.js), the
   tyre smoke's colour (DELI.dim: render.js, the drift's smoke).
   mounts (look units): filter_zraka, akumulator, turbo, cip { x, y, z } where it sits (its foot's middle;
   akumulator back: true, x its foot's rear edge; turbo twin: [dz1, dz2] the twin snails' (13-16) places across, from z, ic: [x, y, z]
   the bigger intercooler's (8, 10, 15) foot's middle, none: in front of the turbo); vzmeti, amortizerji,
   stabilizatorji, dim_gum {} (at the wheels: K.arches, K.hw; in: how far inboard of the hub the strut stands, top: its top's height;
   vzmeti seat: the coils' foot, a number or [front, rear] (K.rw + 0.04 if not given; a high body over low arms, GOZDAR's: on the arm, on the axle);
   stabilizatorji floor: the height of the floor under the bars, a number or [front, rear], K.rw - 0.06 if not given;
   dim_gum w: the rear tyre's width, its inner wall the band's place (none: look.wheels.w; MRAVLJA's wider rear tyres)) */
(function () {
  'use strict';
  if (typeof DELI === 'undefined') return;
  const IN = { inner: true, part: 'body' };
  const BLK = [0.06, 0.06, 0.065], DK = [0.14, 0.14, 0.15], AL = [0.72, 0.73, 0.76], CHR = [0.86, 0.87, 0.9], CF = [0.09, 0.09, 0.1], RED = [0.8, 0.1, 0.08], BLU = [0.15, 0.35, 0.85],
    YEL = [0.95, 0.78, 0.1], GRN = [0.2, 0.6, 0.25], ORA = [0.95, 0.45, 0.08], GOLD = [0.85, 0.66, 0.24], WHT = [0.9, 0.9, 0.88], PUR = [0.55, 0.25, 0.8];
  const box = (K, x, y, z, l, h, w, col, top) => K.box(x, y, z, l, h, w, 0, col, top || col, false, IN);
  const cyl = (K, a, b, r, col, o) => K.cyl(a, b, r, col, Object.assign({ n: K.hi ? 8 : 6 }, IN, o || {}));

  // ================================================================ filter_zraka: in its box, a cone on a pipe, a carbon airbox
  function filter_zraka(K, n, m) {
    const { x, y } = m, P = [WHT, RED, GRN, BLU][n - 1];
    // a box w wide: its outer side where the stock drum's is (r 0.085: on the inner wing, not through it into the wheel well)
    const zb = (w) => Math.sign(m.z) * (Math.abs(m.z) + 0.08 - w / 2), z = m.z;
    if (n <= 4) { box(K, x, y, zb(0.2), 0.24, 0.07, 0.2, DK); box(K, x, y + 0.07, zb(0.2), 0.2, 0.012, 0.16, P); return; }   // (a panel in the stock box)
    const cone = (cx, cz, col, s) => { cyl(K, [cx + 0.04 * s, y + 0.1, cz], [cx - 0.1 * s, y + 0.1, cz], 0.075 * s, col, { r2: 0.055 * s, capB: CHR }); cyl(K, [cx + 0.04 * s, y + 0.1, cz], [cx + 0.14, y + 0.1, cz], 0.04, AL); };
    const duct = (cz, col, r) => cyl(K, [x + 0.12, y + 0.1, cz], [x + 0.32, y + 0.12, z * 0.4], r || 0.035, col);   // (the intake: from the filter to the engine's top)
    switch (n) {
      case 5: cone(x, z, ORA, 1); duct(z, AL); break;
      case 6: cone(x, z, RED, 1); duct(z, AL); break;
      case 7: cone(x, z - 0.06, RED, 0.8); cone(x, z + 0.08, RED, 0.8); box(K, x + 0.14, y + 0.055, z + 0.01, 0.05, 0.09, 0.26, AL); duct(z + 0.01, AL); break;   // (both into one plenum)
      case 8: cone(x, z, BLU, 1); K.box(x - 0.03, y, z + 0.11, 0.24, 0.2, 0.01, 0, AL, AL, false, IN); duct(z, AL); break;
      case 9: case 10: cone(n === 10 ? x + 0.3 : x, z, n === 10 ? BLU : RED, 1); duct(z, n === 10 ? BLK : AL); break;
      case 11: box(K, x, y, zb(0.2), 0.26, 0.12, 0.2, AL); cyl(K, [x + 0.13, y + 0.06, zb(0.2)], [x + 0.3, y + 0.08, z * 0.4], 0.035, AL); break;
      case 12: box(K, x, y, zb(0.24), 0.32, 0.15, 0.24, BLK); cyl(K, [x + 0.16, y + 0.08, zb(0.24)], [x + 0.32, y + 0.08, z * 0.4], 0.04, BLK); break;
      case 13: cone(x, z, RED, 1); duct(z, CF, 0.04); break;
      case 14: case 15: case 16: { const zc = zb(0.22); box(K, x, y, zc, 0.3 + (n - 14) * 0.02, 0.14, 0.22, CF, [0.13, 0.13, 0.14]); cyl(K, [x + 0.15, y + 0.07, zc], [x + 0.32, y + 0.08, z * 0.4], 0.04, CF);
        if (n >= 15) K.box(x + 0.08, y + 0.14, zc, 0.1, 0.04, 0.12, 0, CF, BLK, false, IN);   // (its scoop)
        if (n === 16) box(K, x - 0.05, y + 0.14, zc, 0.08, 0.008, 0.18, RED); break; }
    }
  }
  // ================================================================ cip: the engine's control box on the bulkhead
  function cip(K, n, m) {
    const { x, y, z } = m, big = n >= 5, col = n <= 4 ? BLK : n <= 12 ? AL : n === 13 ? RED : n === 16 ? GOLD : DK;
    box(K, x, y, z, big ? 0.16 : 0.08, big ? 0.04 : 0.03, big ? 0.12 : 0.06, col, n === 16 ? GOLD : null);
    if (n === 3) box(K, x, y, z + 0.06, 0.08, 0.03, 0.06, BLK);   // (a piggyback box against it)
    if (n === 2 || n === 4) box(K, x - 0.02, y + 0.03, z, 0.012, 0.006, 0.012, n === 2 ? BLU : RED);   // (its light, its knob)
    if (n >= 10 && n <= 12) box(K, x, y + 0.04, z, 0.05, 0.006, 0.03, n === 11 ? GRN : BLU);
    cyl(K, [x + (big ? 0.08 : 0.04), y + 0.015, z], [x + 0.2, y + 0.04, z - 0.1], 0.01, BLK, { n: 4 });   // (its lead to the engine)
    if (n >= 14) for (const dz of [-0.03, 0, 0.03]) cyl(K, [x - 0.08, y + 0.02, z + dz], [x - 0.25, y - 0.05, z + dz * 2], 0.008, n === 14 ? RED : BLU, { n: 4 });   // (a new loom)
    if (n === 15) cyl(K, [x, y + 0.04, z + 0.05], [x, y + 0.14, z + 0.05], 0.004, BLK, { n: 4 });   // (the telemetry's aerial)
  }
  // ================================================================ turbo: the snail (the compressor and the turbine), the intercooler's pipe
  function turbo(K, n, m) {
    const { x, y, z } = m, s = 0.8 + n * 0.022, col = n <= 2 ? DK : n <= 6 ? AL : n <= 12 ? [0.55, 0.56, 0.6] : CHR, hot = [0.42, 0.24, 0.16];
    const snail = (cz, k) => { cyl(K, [x, y + 0.08 * k, cz - 0.05 * k], [x, y + 0.08 * k, cz], 0.07 * k, col, { capA: col, capB: DK }); cyl(K, [x, y + 0.08 * k, cz], [x, y + 0.08 * k, cz + 0.05 * k], 0.06 * k, hot); };
    const tw = m.twin || [-0.1, 0.12];   // (twin: the two snails' places across, from z: MIŠKA's side by side, in its narrow bay)
    if (n >= 13) { snail(z + tw[0], s * 0.85); snail(z + tw[1], s * 0.85); } else snail(z, s);
    cyl(K, [x, y + 0.08 * s, z - 0.06], [x - 0.15, y + 0.22, z - 0.2], 0.03, n >= 9 ? BLU : AL, { n: 6 });   // (to the intercooler)
    if (n === 8 || n === 10 || n === 15) { const I = m.ic || [x + 0.06, y - 0.05, z]; box(K, I[0], I[1], I[2], 0.04, 0.16, 0.42, AL); }   // (a bigger intercooler in front of it; ic: its own place)
  }
  // ================================================================ akumulator: the battery, smaller and lighter
  function akumulator(K, n, m) {
    const { y } = m, k = 1 - (n - 1) * 0.035, col = [BLK, DK, DK, RED, BLU, YEL, YEL, ORA, RED, WHT, BLK, GRN, RED, WHT, CF, GOLD][n - 1];
    const x = m.back ? m.x + 0.1 * k : m.x;   // (back: its rear face at x, the battery ahead of it: on a floor falling forward its rear edge stays on it)
    const z = m.z + Math.sign(m.z) * 0.07 * (1 - k);   // (its outer side where the stock one's is: against the inner wing)
    box(K, x, y, z, 0.2 * k, 0.17 * k, 0.14 * k, col, n === 15 ? [0.13, 0.13, 0.14] : BLK);
    for (const dz of [-0.04, 0.04]) cyl(K, [x, y + 0.17 * k, z + dz * k], [x, y + 0.17 * k + 0.02, z + dz * k], 0.012, dz < 0 ? RED : BLK, { n: 4 });   // (its terminals)
  }
  // ================================================================ at the wheels: the springs, the dampers, the anti-roll bars, the tyres' smoke
  const wheels = (K, fn) => { for (const A of K.arches) for (const sd of [-1, 1]) fn(A.x, sd, A === K.arches[0]); };
  function vzmeti(K, n, m) {
    const low = DELI.effect('vzmeti', n).lower || 0, k = 3, col = [AL, RED, AL, AL, YEL, YEL, RED, PUR, BLU, BLU, BLU, GRN, RED, ORA, YEL, GOLD][n - 1], ti = m.in || 0.13, top = (m.top || 0.66) - low;
    wheels(K, (x, sd, front) => { const z = sd * (K.hw - ti), y0 = m.seat == null ? K.rw + 0.04 : [].concat(m.seat)[front ? 0 : [].concat(m.seat).length - 1], h = (top - y0) / (k * 2 - 1);   // (seat: the coils' foot on a low arm)
      for (let i = 0; i < k; i++) cyl(K, [x, y0 + i * 2 * h, z], [x, y0 + (i * 2 + 1) * h, z], 0.06, col, { capA: null, capB: null });   // (its coils: bands with gaps)
      cyl(K, [x, y0 - 0.01, z], [x, top, z], 0.036, DK, { n: 4, capA: null, capB: null }); });   // (the strut inside)
  }
  function amortizerji(K, n, m) {
    const col = [DK, YEL, YEL, RED, RED, BLU, BLU, GOLD, RED, BLU, ORA, GRN, GOLD, YEL, BLU, RED][n - 1], ti = (m.in || 0.13) + 0.005, top = m.top || 0.66;
    wheels(K, (x, sd) => { const z = sd * (K.hw - ti), y0 = K.rw + 0.02;
      cyl(K, [x, y0, z], [x, y0 + (top - y0) * 0.6, z], 0.032, col, { capA: null });
      cyl(K, [x, y0 + (top - y0) * 0.6, z], [x, top + 0.02, z], 0.012, CHR, { n: 4, capA: null, capB: null });
      if (n >= 6) box(K, x, top - 0.02, z, 0.06, 0.03, 0.06, n >= 13 ? GOLD : AL);   // (its top mount, adjustable)
      if (n === 10 || n >= 15) cyl(K, [x + 0.038, y0 + 0.08, z - sd * 0.038], [x + 0.038, y0 + 0.2, z - sd * 0.038], 0.022, col, { n: 5, capA: null, capB: AL }); });   // (a reservoir, against the body)
  }
  function stabilizatorji(K, n, m) {
    const col = [BLK, BLK, RED, RED, BLU, BLU, YEL, YEL, RED, RED, BLU, BLU, GOLD, GOLD, AL, ORA][n - 1], r = 0.011 + Math.min(n, 12) * 0.0008, ti = (m.in || 0.13) + 0.06;
    const F = m.floor != null ? [].concat(m.floor) : [K.rw - 0.06];   // (the floor under it: the bar 3.5 cm above, in two clamps)
    const axle = (A, front) => { const fl = F[front ? 0 : F.length - 1], y = fl + 0.035, x = A.x + (front ? -0.12 : 0.12); K.bar([x, y, -(K.hw - ti)], [x, y, K.hw - ti], r, col, Object.assign({ n: K.hi ? 6 : 5 }, IN));
      for (const sd of [-1, 1]) { K.bar([x, y, sd * (K.hw - ti)], [A.x, y + 0.08, sd * (K.hw - ti)], r * 0.8, col, Object.assign({ n: 4 }, IN));   // (its arms forward to the wheel)
        box(K, x, fl - 0.006, sd * (K.hw - ti) * 0.55, 0.05, y - fl + r + 0.012, 0.035, DK); } };   // (a clamp on the floor)
    if (n !== 2) axle(K.arches[1], false);
    if (n === 2 || n >= 5) axle(K.arches[0], true);
  }
  function dim_gum(K, n, m) {
    const S = DIM[n] || DIM[1];
    for (const sd of [-1, 1]) { const A = K.arches[1], z = sd * (K.hw - (m.w ? m.w / 2 : K.wheels && K.wheels.w ? K.wheels.w / 2 : 0.09) - 0.012), c = S.c[sd < 0 || S.c.length < 2 ? 0 : 1];
      K.at(A.x, K.rw, z, () => { for (let i = 0; i < 12; i++) { const a0 = i / 12 * Math.PI * 2, a1 = (i + 1) / 12 * Math.PI * 2, r0 = K.rw * 0.72, r1 = K.rw * 0.9, P = (a, rr) => [A.x + Math.cos(a) * rr / K.sx, K.rw + Math.sin(a) * rr, z];
        const f = [P(a0, r0), P(a1, r0), P(a1, r1), P(a0, r1)]; K.face(sd < 0 ? f : f.slice().reverse(), S.c.length > 2 ? S.c[i % S.c.length] : c); } }, IN); }   // (the tyre's inner wall: its band in the smoke's colour)
  }
  // ---- the effect the car shows: the tyre smoke's colour ----
  // DELI.dim(n): the drift's tyre smoke: { c: colours, at(k, t) -> [r, g, b, alpha x, life x] } (k the wheel: 2 rear left, 3 rear right)
  const DIM = { 1: { c: [[0.9, 0.9, 0.92]], a: 1, l: 1 }, 2: { c: [[0.94, 0.94, 0.95]], a: 1.35, l: 1 }, 3: { c: [[0.9, 0.9, 0.92]], a: 1, l: 1.5 }, 4: { c: [[0.94, 0.94, 0.95]], a: 1.35, l: 1.5 },
    5: { c: [[0.35, 0.6, 1]] }, 6: { c: [[1, 0.28, 0.2]] }, 7: { c: [[1, 0.88, 0.25]] }, 8: { c: [[0.7, 0.4, 1]] }, 9: { c: [[0.35, 0.6, 1]], a: 1.35 }, 10: { c: [[0.4, 1, 0.35]] },
    11: { c: [[1, 0.6, 0.25]] }, 12: { c: [[1, 0.55, 0.8]] }, 13: { c: [[0.35, 0.6, 1], [1, 0.28, 0.2]] }, 14: { c: [[1, 0.3, 0.3], [1, 0.85, 0.3], [0.4, 1, 0.4], [0.35, 0.6, 1], [0.75, 0.4, 1]], rb: true },
    15: { c: [[0.94, 0.94, 0.95]], a: 1.6, l: 1.3 }, 16: { c: [[0.94, 0.94, 0.95]], a: 1.6, l: 1.7 } };
  DELI.dim = (n) => { const S = DIM[n] || DIM[1], a = S.a || 1.15, l = S.l || 1.15;
    return { c: S.c, at: (k, t) => { const c = S.rb ? S.c[Math.floor((t || 0) * 2.5) % S.c.length] : S.c[S.c.length > 1 && k % 2 ? 1 : 0]; return [c[0], c[1], c[2], a, l]; } }; };

  for (const [id, b] of [['filter_zraka', filter_zraka], ['cip', cip], ['turbo', turbo], ['akumulator', akumulator], ['vzmeti', vzmeti], ['amortizerji', amortizerji], ['stabilizatorji', stabilizatorji], ['dim_gum', dim_gum]]) DELI.add(id, b);
})();
