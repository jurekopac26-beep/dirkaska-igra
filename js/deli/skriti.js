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

  // ---- the stock ones (no option fitted): under the open bonnet the parts the garage swaps stand where its options go (the def's
  // mounts), plain and dark: the filter's box and its duct, the battery, the control box, the snail of an engine with a turbo (def.snd.turbo),
  // the struts' springs in the wheel arches. DELI.stock(K, id, m, M): drawn by K.deli when the vehicle's own stock part draws nothing
  // (KOLIBRI's battery and drum are its own). DELI.stockBay(K, x, y, z, l, w, h, M): a vehicle with no mounts: the same beside its engine's block
  const SPR = [0.27, 0.27, 0.29];
  const STOCK = {
    filter_zraka: (K, m) => { const s = Math.sign(m.z), zc = s * (Math.abs(m.z) + 0.08 - 0.1);
      box(K, m.x, m.y, zc, 0.24, 0.1, 0.2, DK, BLK); box(K, m.x, m.y + 0.1, zc, 0.2, 0.012, 0.16, DK, [0.2, 0.2, 0.22]);
      cyl(K, [m.x + 0.12, m.y + 0.06, zc], [m.x + 0.32, m.y + 0.1, m.z * 0.4], 0.035, BLK, { n: 6 }); },
    akumulator: (K, m) => { const x = m.back ? m.x + 0.1 : m.x; box(K, x, m.y, m.z, 0.2, 0.17, 0.14, BLK, DK);
      for (const dz of [-0.04, 0.04]) cyl(K, [x, m.y + 0.17, m.z + dz], [x, m.y + 0.19, m.z + dz], 0.012, dz < 0 ? RED : BLK, { n: 4 }); },
    cip: (K, m) => { box(K, m.x, m.y, m.z, 0.08, 0.03, 0.06, BLK, DK); cyl(K, [m.x + 0.04, m.y + 0.015, m.z], [m.x + 0.2, m.y + 0.04, m.z - 0.1], 0.01, BLK, { n: 4 }); },
    turbo: (K, m, M) => { const S = M && (M.snd || M.def && M.def.snd); if (!S || !S.turbo) return; const { x, y, z } = m, k = 0.8;
      cyl(K, [x, y + 0.08 * k, z - 0.05 * k], [x, y + 0.08 * k, z], 0.07 * k, DK, { capA: DK, capB: DK }); cyl(K, [x, y + 0.08 * k, z], [x, y + 0.08 * k, z + 0.05 * k], 0.06 * k, [0.42, 0.24, 0.16]);
      cyl(K, [x, y + 0.08 * k, z - 0.06], [x - 0.15, y + 0.22, z - 0.2], 0.03, BLK, { n: 6 }); },
    vzmeti: (K, m) => { if (!K.arches) return; const ti = m.in || 0.13, top = m.top || 0.66;   // (a strut's top under the bonnet: its upper coil and its cap; the wheels' own: 4)
      wheels(K, (x, sd) => { const z = sd * (K.hw - ti); cyl(K, [x, top - 0.1, z], [x, top - 0.03, z], 0.055, SPR, { n: 6, capA: null, capB: null }); cyl(K, [x, top - 0.03, z], [x, top, z], 0.07, DK, { n: 6, capA: null, capB: DK }); }); },
  };
  DELI.stock = (K, id, m, M) => { const b = STOCK[id]; if (!b || !m) return false; b(K, m, M); return true; };
  DELI.stockBay = (K, x, y, z, l, w, h, M) => { const hw = K.hw || 0.75, out = Math.max(w / 2 + 0.14, Math.min(w / 2 + 0.26, hw - 0.3));   // (the outer side of what stands beside the block: clear of the tyre)
    STOCK.filter_zraka(K, { x: x - l * 0.1, y: y + h * 0.5, z: -(out - 0.08) }); STOCK.akumulator(K, { x: x - l * 0.3, y: y + h * 0.35, z: out - 0.07 });
    STOCK.cip(K, { x: x - l / 2 - 0.1, y: y + h * 0.75, z: z + 0.12 }); STOCK.turbo(K, { x: x + l * 0.3, y: y + h * 0.2, z: out - 0.1 }, M); STOCK.vzmeti(K, {}); };

  // ---- PROTOTYPE (pictures only): a fuller bay, BV 1..3 ----
  const BV = 0;
  const hose = (K, pts, r, col, n) => { for (let i = 0; i + 1 < pts.length; i++) cyl(K, pts[i], pts[i + 1], r, col, { n: n || 5, capA: null, capB: null }); };
  const TANK = [0.82, 0.82, 0.76], RUST = [0.42, 0.24, 0.16], RUB = [0.05, 0.05, 0.055];
  DELI.bayExtra = (K, x, y, z, l, w, h, M) => { if (!BV || !K.arches) return;
    const hw = K.hw || 0.75, mt = M.def && M.def.mounts || {}, xf = x + l / 2, xr = x - l / 2, yt = y + h, ax = K.arches[0].x;
    const out = Math.max(w / 2 + 0.14, Math.min(w / 2 + 0.26, hw - 0.3));
    const bat = mt.akumulator || { x: x - l * 0.3, y: y + h * 0.35, z: out - 0.07 }, bs = Math.sign(bat.z) || 1;   // (the battery's side; the filter's: the other)
    const xR = Math.max(xf + 0.14, Math.min(xf + 0.24, ax + 0.64)), top = (xx, d) => { let t = yt; try { t = K.topY(xx, 0) - (d || 0.07); } catch (e) {} return t; };
    const rw2 = Math.min(w / 2 + 0.2, hw - 0.28), ry1 = Math.min(top(xR, 0.14), yt - 0.01), ry0 = y + 0.02;
    // -- 1: the cooling and the fluids
    box(K, xR, ry0, z, 0.035, ry1 - ry0, rw2 * 2, [0.2, 0.21, 0.23]); box(K, xR, ry1, z, 0.05, 0.03, rw2 * 2 + 0.02, BLK); box(K, xR, ry0 - 0.02, z, 0.05, 0.03, rw2 * 2 + 0.02, BLK);   // (the radiator: its core between two tanks)
    for (let i = 1; i < 6; i++) box(K, xR + 0.019, ry0 + (ry1 - ry0) * i / 6, z, 0.004, 0.006, rw2 * 2 - 0.02, AL);   // (its fins catching the light)
    const fr = Math.min(0.15, (ry1 - ry0) / 2 - 0.01), fy = (ry0 + ry1) / 2;
    cyl(K, [xR - 0.02, fy, z - bs * 0.08], [xR - 0.07, fy, z - bs * 0.08], fr, DK, { n: 10, capB: BLK }); cyl(K, [xR - 0.07, fy, z - bs * 0.08], [xR - 0.09, fy, z - bs * 0.08], 0.04, AL, { n: 6 });   // (the fan in its shroud, its motor)
    cyl(K, [xR - 0.005, ry1 + 0.03, z + bs * rw2 * 0.6], [xR - 0.005, ry1 + 0.05, z + bs * rw2 * 0.6], 0.025, AL, { n: 6 });   // (the filler cap)
    hose(K, [[xR - 0.02, ry1 + 0.012, z - bs * rw2 * 0.7], [xR - 0.1, ry1 + 0.02, z - bs * rw2 * 0.62], [xf + 0.02, yt - h * 0.2, z - bs * w * 0.3], [xf - 0.02, yt - h * 0.3, z - bs * w * 0.3]], 0.024, RUB);   // (the upper hose)
    hose(K, [[xR - 0.02, ry0 + 0.02, z + bs * rw2 * 0.7], [xR - 0.1, ry0 + 0.02, z + bs * rw2 * 0.55], [xf, y + h * 0.2, z + bs * w * 0.36]], 0.024, RUB);   // (the lower one)
    const xs = Math.min(xr - 0.02, ax - 0.34), zs = hw - 0.42;   // (behind the struts, by the bulkhead)
    const xe = xR - 0.14, ze = -bs * (rw2 - 0.03), ye = y + 0.06;   // (in the other front corner: the coolant's expansion tank)
    box(K, xe, ye, ze, 0.14, 0.15, 0.12, TANK, TANK); cyl(K, [xe, ye + 0.15, ze], [xe, ye + 0.175, ze], 0.03, BLK, { n: 6 }); box(K, xe, ye, ze, 0.142, 0.08, 0.122, [0.3, 0.75, 0.5]);   // (the coolant in it)
    hose(K, [[xe + 0.05, ye + 0.14, ze + bs * 0.05], [xR - 0.03, ry1, z - bs * rw2 * 0.8]], 0.01, RUB, 4);
    const xw = xR - 0.13, zw = bs * (rw2 - 0.02);   // (in the front corner: the washer bottle)
    box(K, xw, y + 0.04, zw, 0.14, 0.16, 0.1, [0.78, 0.8, 0.84], [0.78, 0.8, 0.84]); box(K, xw, y + 0.04, zw, 0.142, 0.09, 0.102, [0.25, 0.5, 0.9]); cyl(K, [xw, y + 0.2, zw], [xw, y + 0.225, zw], 0.026, BLU, { n: 6 });
    const xb = xr - 0.3, zb = -0.36 * Math.min(1, hw / 0.9), yb = Math.min(yt - 0.02, top(xb, 0.2));   // (on the bulkhead before the driver: the brake servo, its cylinder, the fluid)
    cyl(K, [xb, yb, zb], [xb + 0.07, yb, zb], 0.105, BLK, { n: 10, capB: DK }); cyl(K, [xb + 0.07, yb, zb], [xb + 0.2, yb, zb], 0.028, AL, { n: 6 });
    box(K, xb + 0.14, yb + 0.03, zb, 0.09, 0.06, 0.06, TANK, TANK); cyl(K, [xb + 0.14, yb + 0.09, zb], [xb + 0.14, yb + 0.105, zb], 0.024, YEL, { n: 6 });
    if (BV < 2) return;
    // -- 2: the electrics and the engine's own
    const cy2 = yt - h * 0.12 + 0.005, cw = w * 0.62, cl = l * 0.86;   // (the cover's top)
    for (let i = 0; i < 4; i++) { const zc = z + (i - 1.5) * cw / 4.6, xc = x - cl * 0.18;   // (four coils on the cover, their leads to a loom along it)
      cyl(K, [xc, cy2, zc], [xc, cy2 + 0.035, zc], 0.022, BLK, { n: 5 }); hose(K, [[xc, cy2 + 0.03, zc], [xc - cl * 0.25, cy2 + 0.035, zc], [x - cl * 0.48, cy2 + 0.02, z + bs * cw * 0.5]], 0.008, i % 2 ? RED : BLU, 4); }
    cyl(K, [x + cl * 0.3, cy2, z - bs * cw * 0.32], [x + cl * 0.3, cy2 + 0.025, z - bs * cw * 0.32], 0.03, BLK, { n: 6, capB: YEL });   // (the oil filler's cap)
    cyl(K, [xf - 0.03, y + h * 0.5, z + bs * w * 0.42], [xf + 0.02, yt + 0.03, z + bs * w * 0.46], 0.006, AL, { n: 4 }); cyl(K, [xf + 0.02, yt + 0.03, z + bs * w * 0.46], [xf + 0.03, yt + 0.05, z + bs * w * 0.46], 0.014, YEL, { n: 5 });   // (the dipstick)
    cyl(K, [xr - 0.09, yt - h * 0.28, z - w * 0.36], [xr - 0.09, yt - h * 0.28, z + w * 0.36], 0.05, AL, { n: 8 });   // (the inlet's plenum behind the block, four runners down to the head)
    for (let i = 0; i < 4; i++) { const zc = z + (i - 1.5) * w * 0.2; hose(K, [[xr - 0.09, yt - h * 0.26, zc], [xr - 0.04, yt - h * 0.18, zc], [xr + 0.02, yt - h * 0.3, zc]], 0.024, AL, 5); }
    const za = z - bs * (w / 2 - 0.06), xa = xf + 0.035;   // (on the block's front: the alternator, the pulleys, the belt)
    cyl(K, [xa - 0.02, yt - h * 0.35, za], [xa + 0.07, yt - h * 0.35, za], 0.06, AL, { n: 8 }); cyl(K, [xa, y + h * 0.22, z], [xa + 0.03, y + h * 0.22, z], 0.075, DK, { n: 10 });
    cyl(K, [xa, y + h * 0.3, z + bs * (w / 2 - 0.1)], [xa + 0.03, y + h * 0.3, z + bs * (w / 2 - 0.1)], 0.05, DK, { n: 8 });
    hose(K, [[xa + 0.04, yt - h * 0.35 + 0.05, za], [xa + 0.04, y + h * 0.3 + 0.05, z + bs * (w / 2 - 0.1)], [xa + 0.04, y + h * 0.22 - 0.07, z], [xa + 0.04, yt - h * 0.35 - 0.05, za]], 0.008, RUB, 4);
    const bx = bat.back ? bat.x + 0.1 : bat.x, by = bat.y + 0.19;   // (the battery's cables: the red one to a fuse box, the black one to the body)
    const fx = Math.min(bx - 0.2, xs), fz = bs * (hw - 0.44);
    box(K, fx, y + h * 0.5, fz, 0.16, 0.07, 0.11, BLK, DK); box(K, fx, y + h * 0.5 + 0.07, fz, 0.13, 0.008, 0.09, [0.2, 0.2, 0.22]);
    hose(K, [[bx, by, bat.z - 0.04], [bx - 0.08, by + 0.03, bat.z - 0.05], [fx + 0.06, y + h * 0.5 + 0.06, fz]], 0.011, RED, 4);
    hose(K, [[bx, by, bat.z + 0.04], [bx + 0.1, by + 0.02, bat.z + 0.06], [bx + 0.16, y + h * 0.3, bs * (hw - 0.3)]], 0.011, BLK, 4);
    hose(K, [[fx - 0.08, y + h * 0.56, fz], [xb - 0.02, y + h * 0.7, fz * 0.9], [xb - 0.02, y + h * 0.7, z + bs * cw * 0.5], [xr - 0.16, y + h * 0.7, z + bs * cw * 0.5], [x - cl * 0.48, cy2 + 0.02, z + bs * cw * 0.5]], 0.013, RUB, 4);   // (the loom along the bulkhead)
    if (BV < 3) return;
    // -- 3: the structure, the exhaust, the brakes' lines
    const st = mt.vzmeti && mt.vzmeti.top || 0.66, zt = hw - (mt.vzmeti && mt.vzmeti.in || 0.13);   // (a brace from strut top to strut top, arched over the engine)
    const bt = Math.max(st + 0.05, Math.min(yt + 0.07, top(ax, 0.05)));
    hose(K, [[ax, st + 0.02, -zt], [ax, bt, -zt * 0.55], [ax, bt, zt * 0.55], [ax, st + 0.02, zt]], 0.016, RED, 6); for (const sd of [-1, 1]) box(K, ax, st, sd * zt, 0.1, 0.012, 0.1, RED);
    box(K, xR + 0.04, ry1 + 0.03, z, 0.05, 0.025, rw2 * 2 + 0.1, DK); cyl(K, [xR + 0.04, ry1 + 0.055, z], [xR + 0.04, ry1 + 0.075, z], 0.02, AL, { n: 6 });   // (the slam panel over the radiator, the bonnet's catch)
    for (let i = 0; i < 4; i++) { const zc = z + (i - 1.5) * w * 0.2;   // (four headers down the block's front into a collector)
      hose(K, [[xf - 0.01, yt - h * 0.42, zc], [xf + 0.06, yt - h * 0.5, zc], [xf + 0.08, y + h * 0.12, z + (i - 1.5) * 0.03 + bs * w * 0.1]], 0.017, RUST, 5); }
    cyl(K, [xf + 0.08, y + h * 0.14, z + bs * w * 0.1], [xf + 0.02, y - 0.02, z + bs * w * 0.1], 0.04, RUST, { n: 6 });
    box(K, xf + 0.085, yt - h * 0.5, z, 0.006, h * 0.2, w * 0.74, AL);   // (their heat shield)
    const xh = xb + 0.12, zh = zb - 0.17, yh = y + h * 0.4, ST = [0.55, 0.56, 0.6];   // (the brake's valve block under the cylinder, its lines along the bulkhead and the inner wing)
    box(K, xh, yh, zh, 0.08, 0.07, 0.08, AL, DK);
    for (let i = 0; i < 3; i++) hose(K, [[xb + 0.12 + i * 0.03, yb - 0.02, zb], [xb + 0.12 + i * 0.03, yb - 0.02, zh + 0.03], [xh - 0.03 + i * 0.03, yh + 0.07, zh]], 0.005, ST, 4);
    hose(K, [[xh, yh + 0.03, zh], [xb - 0.03, yh, zh], [xb - 0.03, yh, -zh], [ax - 0.25, yh, -zh - 0.08]], 0.005, ST, 4);
    hose(K, [[xh, yh + 0.05, zh], [xh + 0.1, yh + 0.03, zh - 0.08], [ax - 0.25, yh, zh - 0.08]], 0.005, ST, 4);
    const kz = z + bs * (w / 2 - 0.02), zp = bs * Math.min(out + 0.02, hw - 0.3);   // (the air conditioning's compressor low on the block, its two pipes back along the inner wing)
    cyl(K, [xa - 0.02, y + h * 0.5, kz + bs * 0.07], [xa + 0.09, y + h * 0.5, kz + bs * 0.07], 0.05, [0.5, 0.51, 0.54], { n: 8 });
    for (const d of [0, 0.03]) hose(K, [[xa + 0.03, y + h * 0.5 + 0.05, kz + bs * 0.07], [xf + 0.02, yt - 0.03 - d, zp - bs * d], [xr - 0.1, yt - 0.03 - d, zp - bs * d], [xb - 0.02, yt - 0.06 - d, zp - bs * (0.1 + d)]], 0.009, AL, 4);
  };

  // ---- PROTOTYPE (pictures only): the Kolibri's bay in detail, BK 1..3 ----
  // the truck's engine under its cab: a straight six on the rails, its turbo and pipes, the fan before the radiator, the gearbox, the cab's mounts
  DELI.TCAB = 1;
  DELI.TILT = 52;
  // the cab's underside (drawn in the cab's own frame, tilted with it): the floor's panel and ribs, the engine's tunnel and its pad, the rear latches' pins, the ram's eye
  DELI.titanCab = (K, P) => {
    const PD = K.shade(P, 0.7), PM = K.shade(P, 0.55), PAD = [0.3, 0.3, 0.32], ST = [0.55, 0.56, 0.6];
    box(K, 1.73, 1.165, 0, 2.1, 0.035, 2.3, PM, PD);
    for (const xm of [0.8, 1.15, 1.5, 1.85, 2.2, 2.55]) for (const sd of [-1, 1]) box(K, xm, 1.14, sd * 0.82, 0.05, 0.03, 0.6, PD);
    for (const sd of [-1, 1]) { box(K, 1.7, 1.12, sd * 0.5, 2.0, 0.05, 0.07, PD, PD); box(K, 0.86, 1.07, sd * 0.5, 0.1, 0.06, 0.08, ST); cyl(K, [0.86, 1.09, sd * 0.44], [0.86, 1.09, sd * 0.56], 0.02, ST, { n: 6 });
      box(K, 2.62, 1.06, sd * 0.5, 0.2, 0.11, 0.09, PD, PD); }
    box(K, 1.72, 1.15, 0, 1.5, 0.02, 0.86, PAD, PAD); for (let i = 0; i < 7; i++) box(K, 1.1 + i * 0.2, 1.146, 0, 0.012, 0.006, 0.82, [0.22, 0.22, 0.24]);   // (the tunnel's heat pad, quilted)
    box(K, 1.6, 1.09, -0.5, 0.12, 0.04, 0.1, ST); cyl(K, [1.6, 1.09, -0.56], [1.6, 1.09, -0.44], 0.025, ST, { n: 8 });   // (the ram's eye on the floor's rail)
  };
  DELI.titanBay = (K, P, TF) => {
    const ENG = [0.3, 0.37, 0.43], EN2 = [0.38, 0.46, 0.53], RUB = [0.05, 0.05, 0.055], RUST = [0.42, 0.24, 0.16], PLA = [0.085, 0.085, 0.095], PL2 = [0.17, 0.17, 0.19], ST = [0.55, 0.56, 0.6], CRM = [0.8, 0.74, 0.58], FRM = [0.2, 0.2, 0.22], SIL = [0.15, 0.3, 0.75];
    const bolt = (x, y, z, r, c) => cyl(K, [x, y, z], [x, y + 0.012, z], r || 0.014, c || AL, { n: 5 });
    const hose = (pts, r, col, n) => { for (let i = 0; i + 1 < pts.length; i++) cyl(K, pts[i], pts[i + 1], r, col, { n: n || 6, capA: null, capB: null }); };
    const clamp = (a, b, r) => { for (const t of [0.15, 0.85]) { const q = (u) => a.map((c, k) => c + (b[k] - c) * u); cyl(K, q(t - 0.05), q(t + 0.05), r + 0.006, ST, { n: 8 }); } };
    const coup = (a, b, r) => { cyl(K, a, b, r + 0.008, SIL, { n: 8, capA: null, capB: null }); clamp(a, b, r + 0.008); };
    const fx = K.fx;
    // -- the block between the rails, the head, the valve cover with its ribs and bolts, the sump
    box(K, 1.8, 0.56, 0, 1.12, 0.36, 0.4, ENG, EN2); box(K, 1.8, 0.92, 0, 1.08, 0.14, 0.44, EN2, EN2); box(K, 1.8, 1.06, 0, 1.02, 0.07, 0.3, AL, [0.8, 0.81, 0.84]);
    for (let i = 0; i < 6; i++) { const xc = 1.36 + i * 0.176; box(K, xc, 1.13, 0, 0.1, 0.012, 0.22, [0.5, 0.51, 0.54]); for (const sd of [-1, 1]) bolt(xc, 1.13, sd * 0.13, 0.012, ST);
      box(K, xc, 0.7, -0.203, 0.12, 0.2, 0.006, EN2); box(K, xc, 0.7, 0.203, 0.12, 0.2, 0.006, EN2); }
    cyl(K, [2.2, 1.13, 0.06], [2.2, 1.18, 0.06], 0.04, PLA, { n: 8, capB: YEL }); box(K, 1.8, 0.36, 0, 0.9, 0.2, 0.34, DK, PL2); for (let i = 0; i < 5; i++) box(K, 1.44 + i * 0.18, 0.36, 0, 0.02, 0.2, 0.36, PL2);
    cyl(K, [1.5, 0.75, -0.21], [1.42, 1.2, -0.3], 0.008, ST, { n: 4 }); cyl(K, [1.42, 1.2, -0.3], [1.415, 1.24, -0.305], 0.02, YEL, { n: 6 });   // (the dipstick)
    // -- the hot side (right): the manifold's six ports, the turbo, its downpipe back along the rail
    for (let i = 0; i < 6; i++) { const xc = 1.36 + i * 0.176; hose([[xc, 0.98, 0.22], [xc, 0.98, 0.3], [1.8 + (xc - 1.8) * 0.8, 0.96, 0.34]], 0.035, RUST, 6); }
    cyl(K, [1.42, 0.96, 0.34], [2.2, 0.96, 0.34], 0.05, RUST, { n: 8 });
    cyl(K, [1.74, 1.04, 0.36], [1.74, 1.04, 0.46], 0.1, RUST, { n: 10 }); cyl(K, [1.74, 1.04, 0.46], [1.74, 1.04, 0.52], 0.05, ST, { n: 8 }); cyl(K, [1.74, 1.04, 0.52], [1.74, 1.04, 0.62], 0.115, AL, { n: 12 }); cyl(K, [1.74, 1.04, 0.62], [1.74, 1.04, 0.68], 0.06, AL, { n: 8 });
    cyl(K, [1.66, 1.14, 0.4], [1.62, 1.2, 0.4], 0.03, ST, { n: 6 }); cyl(K, [1.62, 1.2, 0.4], [1.56, 1.2, 0.4], 0.045, [0.75, 0.6, 0.25], { n: 8 });   // (the wastegate's can)
    hose([[1.64, 1.02, 0.41], [1.4, 0.98, 0.5], [1.1, 0.86, 0.58], [0.8, 0.78, 0.62], [0.55, 0.75, 0.62]], 0.07, RUST, 8);
    box(K, 1.8, 1.1, 0.33, 0.7, 0.008, 0.16, ST, [0.7, 0.71, 0.74]);   // (the heat shield over the manifold)
    // -- the cold side: the turbo's intake from the air filter, the charge pipes to the intercooler before the radiator and back to the inlet (left)
    cyl(K, [1.05, 0.98, -0.86], [1.05, 1.5, -0.86], 0.21, PLA, { n: 12, capB: PL2 }); for (const yy of [1.08, 1.4]) cyl(K, [1.05, yy, -0.86], [1.05, yy + 0.02, -0.86], 0.22, AL, { n: 12 }); cyl(K, [1.05, 1.5, -0.86], [1.05, 1.56, -0.86], 0.07, PL2, { n: 8 });
    box(K, 1.05, 0.9, -0.7, 0.16, 0.03, 0.4, FRM);   // (its bracket off the rail)
    const ai = [[1.05, 1.02, -0.66], [1.05, 1.24, -0.4], [1.2, 1.28, 0.3], [1.5, 1.2, 0.66], [1.74, 1.04, 0.72]]; hose(ai, 0.06, RUB, 8); for (let i = 0; i < 9; i++) { const a = ai[1], b = ai[2], q = (u) => a.map((c, k) => c + (b[k] - c) * u); cyl(K, q((i + 0.3) / 9), q((i + 0.7) / 9), 0.068, PL2, { n: 8 }); }
    const c1 = [[1.74, 1.16, 0.57], [1.9, 1.24, 0.56], [2.3, 1.2, 0.6], [2.6, 0.95, 0.6], [2.76, 0.9, 0.45]], c2 = [[2.76, 0.9, -0.45], [2.6, 0.95, -0.6], [2.3, 1.1, -0.56], [2.0, 1.06, -0.4], [1.9, 0.99, -0.32]];
    hose(c1, 0.05, AL, 8); hose(c2, 0.05, AL, 8); coup(c1[1], c1[2], 0.05); coup(c2[1], c2[2], 0.05); coup([1.74, 1.1, 0.57], c1[0], 0.05);
    cyl(K, [1.38, 0.99, -0.3], [2.22, 0.99, -0.3], 0.06, AL, { n: 8 }); for (let i = 0; i < 6; i++) { const xc = 1.36 + i * 0.176; box(K, xc, 0.94, -0.25, 0.09, 0.08, 0.06, AL); }
    box(K, 2.76, 0.74, 0, 0.05, 0.42, 1.2, [0.62, 0.63, 0.66]); for (let i = -7; i <= 7; i++) box(K, 2.733, 0.76, i * 0.075, 0.004, 0.38, 0.012, DK);   // (the intercooler low before the radiator)
    // -- the fuel: the injection pump's rail on the left, six lines, two filters; the engine's computer on the block
    cyl(K, [1.4, 0.82, -0.26], [2.1, 0.82, -0.26], 0.022, ST, { n: 6 }); for (let i = 0; i < 6; i++) { const xc = 1.36 + i * 0.176; hose([[xc, 0.82, -0.26], [xc, 0.9, -0.34], [xc, 1.06, -0.2], [xc, 1.09, -0.12]], 0.009, ST, 4); }
    for (const xc of [1.42, 1.58]) { cyl(K, [xc, 0.62, -0.32], [xc, 0.8, -0.32], 0.055, [0.85, 0.85, 0.82], { n: 8 }); cyl(K, [xc, 0.8, -0.32], [xc, 0.84, -0.32], 0.06, AL, { n: 8 }); }
    box(K, 1.9, 0.6, -0.235, 0.34, 0.2, 0.05, AL, AL); for (let i = 0; i < 6; i++) box(K, 1.76 + i * 0.056, 0.6, -0.262, 0.012, 0.2, 0.01, [0.5, 0.51, 0.54]); box(K, 2.02, 0.8, -0.24, 0.08, 0.03, 0.04, PLA); hose([[2.02, 0.83, -0.24], [2.1, 0.9, -0.36], [2.3, 0.92, -0.42], [2.5, 0.9, -0.5]], 0.016, PLA, 5);
    cyl(K, [2.1, 0.5, 0.26], [2.1, 0.72, 0.3], 0.065, [0.2, 0.3, 0.55], { n: 8 });   // (the oil filter)
    // -- the front of the engine: the pulleys and their belt, the alternator, the air compressor, the big fan in its shroud, the radiator down to the rails
    for (const [yy, zc, r, c] of [[0.72, 0, 0.11, DK], [1.0, -0.26, 0.055, DK], [0.86, 0.27, 0.06, DK], [1.02, 0.02, 0.07, DK]]) cyl(K, [2.36, yy, zc], [2.4, yy, zc], r, c, { n: 10 });
    hose([[2.38, 0.83, 0.02], [2.38, 1.05, -0.28], [2.38, 0.95, -0.3], [2.38, 0.62, -0.06], [2.38, 0.62, 0.06], [2.38, 0.8, 0.31], [2.38, 0.92, 0.27], [2.38, 1.09, 0.04]], 0.012, RUB, 4);
    cyl(K, [2.2, 1.0, -0.26], [2.36, 1.0, -0.26], 0.075, AL, { n: 10 }); cyl(K, [2.18, 0.86, 0.27], [2.36, 0.86, 0.27], 0.07, ST, { n: 10 });
    cyl(K, [1.25, 0.9, -0.3], [1.25, 1.08, -0.3], 0.06, EN2, { n: 8 }); for (let i = 0; i < 4; i++) cyl(K, [1.25, 0.93 + i * 0.04, -0.3], [1.25, 0.945 + i * 0.04, -0.3], 0.07, EN2, { n: 8 });   // (the brakes' air compressor, finned)
    hose([[1.25, 1.08, -0.3], [1.15, 1.1, -0.42], [0.8, 0.9, -0.6], [0.3, 0.8, -0.7]], 0.014, [0.8, 0.5, 0.1], 5);
    cyl(K, [2.4, 1.02, 0.02], [2.5, 1.12, 0.0], 0.05, AL, { n: 8 }); cyl(K, [2.5, 1.12, 0], [2.53, 1.12, 0], 0.09, AL, { n: 10 });
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, c = Math.cos(a), sn = Math.sin(a); K.plate([[2.5, 1.12 + c * 0.08, sn * 0.08], [2.55, 1.12 + Math.cos(a + 0.25) * 0.36, Math.sin(a + 0.25) * 0.36], [2.5, 1.12 + Math.cos(a + 0.6) * 0.36, Math.sin(a + 0.6) * 0.36]], 0.006, [0.85, 0.85, 0.8], IN); }
    cyl(K, [2.58, 1.12, 0], [2.48, 1.12, 0], 0.4, PL2, { n: 16, capA: null, capB: null }); box(K, 2.6, 0.7, 0, 0.03, 0.86, 0.9, PLA);
    box(K, 2.67, 0.72, 0, 0.1, 0.5, 1.0, [0.12, 0.12, 0.13]); for (const sd of [-1, 1]) box(K, 2.67, 0.72, sd * 0.53, 0.12, 1.18, 0.06, PLA, PL2);
    box(K, 2.52, 1.62, 0.5, 0.16, 0.2, 0.3, CRM, CRM); box(K, 2.52, 1.625, 0.5, 0.164, 0.09, 0.304, [0.3, 0.7, 0.45]); cyl(K, [2.52, 1.82, 0.5], [2.52, 1.86, 0.5], 0.045, PLA, { n: 8 }); box(K, 2.6, 1.6, 0.5, 0.04, 0.03, 0.2, FRM);   // (the coolant's tank on the radiator's back)
    hose([[2.3, 1.08, 0.1], [2.42, 1.3, 0.2], [2.5, 1.62, 0.3], [2.63, 1.72, 0.3]], 0.04, RUB, 7); hose([[2.3, 0.7, -0.15], [2.45, 0.66, -0.3], [2.62, 0.8, -0.36]], 0.04, RUB, 7); hose([[2.52, 1.62, 0.42], [2.4, 1.3, 0.3], [2.3, 1.0, 0.2]], 0.015, RUB, 5);
    // -- behind the engine: the bell housing, the gearbox with its ribs and its air cylinders, on to the drive shaft
    cyl(K, [1.24, 0.72, 0], [1.1, 0.72, 0], 0.26, AL, { n: 14, capB: ST }); box(K, 0.82, 0.5, 0, 0.6, 0.42, 0.4, AL, [0.8, 0.81, 0.84]); for (let i = 0; i < 5; i++) box(K, 0.58 + i * 0.12, 0.5, 0, 0.015, 0.44, 0.42, ST);
    box(K, 0.82, 0.92, 0, 0.3, 0.07, 0.2, ST); cyl(K, [0.95, 0.96, 0.14], [0.7, 0.96, 0.14], 0.04, AL, { n: 8 }); cyl(K, [0.52, 0.66, 0], [0.42, 0.63, 0], 0.1, ST, { n: 10 });
    // -- the chassis round it: the front axle's beam on its leaf springs, the dampers, the steering box, the cab's mounts (it tilts forward on the front pair), the batteries
    cyl(K, [fx, 0.5, -0.92], [fx, 0.5, 0.92], 0.06, DK, { n: 8 });
    for (const sd of [-1, 1]) { for (let i = 0; i < 4; i++) box(K, fx, 0.42 + i * 0.03, sd * 0.56, 1.4 - i * 0.26, 0.024, 0.09, i % 2 ? PL2 : DK); for (const dx of [-0.7, 0.7]) box(K, fx + dx, 0.5, sd * 0.56, 0.08, 0.14, 0.11, FRM);
      for (const dx of [-0.12, 0.12]) cyl(K, [fx + dx, 0.4, sd * 0.56], [fx + dx, 0.56, sd * 0.56], 0.012, ST, { n: 5 });
      cyl(K, [fx + 0.25, 0.48, sd * 0.66], [fx + 0.3, 0.74, sd * 0.56], 0.04, YEL, { n: 8 }); cyl(K, [fx + 0.3, 0.74, sd * 0.56], [fx + 0.34, 0.95, sd * 0.5], 0.022, ST, { n: 6 });
      box(K, 2.5, 0.9, sd * 0.5, 0.14, 0.1, 0.12, FRM, PL2); cyl(K, [2.5, 0.97, sd * 0.42], [2.5, 0.97, sd * 0.58], 0.035, ST, { n: 8 });   // (the cab's front pivots)
      box(K, 0.86, 0.9, sd * 0.5, 0.1, 0.3, 0.1, FRM); cyl(K, [0.86, 1.2, sd * 0.5], [0.86, 1.25, sd * 0.5], 0.06, RUB, { n: 8 }); bolt(0.86, 1.25, sd * 0.5, 0.02, ST); }
    box(K, 0.86, 1.12, 0, 0.08, 0.06, 1.0, FRM);   // (the rear mounts' cross bar, its latches)
    cyl(K, [2.48, 0.9, -0.44], [2.44, 1.2, -0.62], 0.03, ST, { n: 6 }); cyl(K, [2.44, 1.2, -0.62], [2.42, 1.42, -0.72], 0.018, [0.8, 0.81, 0.84], { n: 6 });   // (the cab's tilt ram)
    box(K, 2.3, 0.62, -0.56, 0.24, 0.26, 0.14, DK, PL2); cyl(K, [2.3, 0.88, -0.56], [2.3, 1.02, -0.6], 0.025, ST, { n: 6 });   // (the steering box on the rail)
    box(K, 0.78, 0.56, 0.74, 0.5, 0.06, 0.4, FRM); for (const dx of [-0.12, 0.12]) { box(K, 0.78 + dx, 0.62, 0.74, 0.21, 0.24, 0.34, PLA, PL2); for (const [dz, c] of [[-0.1, RED], [0.1, BLK]]) { cyl(K, [0.78 + dx, 0.86, 0.74 + dz], [0.78 + dx, 0.89, 0.74 + dz], 0.02, ST, { n: 6 }); box(K, 0.78 + dx, 0.885, 0.74 + dz, 0.05, 0.014, 0.04, c); } }
    hose([[0.66, 0.89, 0.64], [0.7, 0.92, 0.5], [1.0, 0.92, 0.42], [1.5, 0.6, 0.3]], 0.018, RED, 5); box(K, 0.78, 0.86, 0.74, 0.46, 0.012, 0.03, AL);
    hose([[0.9, 1.0, -0.42], [1.3, 1.16, -0.2], [1.8, 1.15, -0.17], [2.3, 1.12, -0.17]], 0.016, PLA, 5); for (let i = 0; i < 6; i++) box(K, 1.36 + i * 0.176, 1.135, -0.17, 0.04, 0.02, 0.03, [0.3, 0.3, 0.33]);   // (the loom along the cover, a plug at each cylinder)
    // -- more of the frame (7): the rails' flanges and rivets, the cross member under the engine and its mounts, the tilt's ram and pump, the cab's rear
    //    springs and latches, the anti-roll bar, the tie rod and drag link, brake chambers, air lines and the loom along the rail, the under-run bar
    for (const sd of [-1, 1]) {
      box(K, 1.5, 0.9, sd * 0.47, 2.1, 0.012, 0.13, FRM, PL2); box(K, 1.5, 0.61, sd * 0.47, 2.1, 0.012, 0.13, FRM);
      for (let i = 0; i < 14; i++) { const xm = 0.55 + i * 0.15; for (const yy of [0.68, 0.84]) cyl(K, [xm, yy, sd * 0.497], [xm, yy, sd * 0.506], 0.012, [0.3, 0.3, 0.33], { n: 5 }); }
      box(K, 1.55, 0.6, sd * 0.33, 0.16, 0.05, 0.2, FRM, PL2); cyl(K, [1.55, 0.65, sd * 0.3], [1.55, 0.7, sd * 0.3], 0.06, RUB, { n: 8 }); bolt(1.55, 0.7, sd * 0.3, 0.02, ST);   // (the engine's mounts)
      box(K, 2.25, 0.6, sd * 0.33, 0.14, 0.05, 0.2, FRM, PL2); cyl(K, [2.25, 0.65, sd * 0.3], [2.25, 0.7, sd * 0.3], 0.05, RUB, { n: 8 });
      cyl(K, [0.86, 0.92, sd * 0.62], [0.86, 1.16, sd * 0.62], 0.045, YEL, { n: 8 }); cyl(K, [0.86, 0.9, sd * 0.62], [0.86, 1.2, sd * 0.62], 0.02, ST, { n: 6 }); box(K, 0.86, 0.86, sd * 0.6, 0.1, 0.05, 0.14, FRM);   // (the cab's rear spring and damper)
      box(K, 0.86, 1.15, sd * 0.5, 0.14, 0.08, 0.14, DK, PL2); box(K, 0.86, 1.23, sd * 0.5, 0.05, 0.05, 0.03, RED);   // (the latch, its red lever)
      cyl(K, [fx - 0.1, 0.5, sd * 0.78], [fx - 0.28, 0.6, sd * 0.78], 0.085, [0.6, 0.61, 0.64], { n: 10 }); cyl(K, [fx - 0.28, 0.6, sd * 0.78], [fx - 0.32, 0.62, sd * 0.78], 0.03, ST, { n: 6 });   // (the brake chamber)
      hose([[fx - 0.3, 0.64, sd * 0.78], [fx - 0.34, 0.8, sd * 0.6], [fx - 0.4, 0.84, sd * 0.51]], 0.014, RUB, 5);
      cyl(K, [fx - 0.45, 0.4, sd * 0.42], [fx - 0.1, 0.44, sd * 0.42], 0.022, RED, { n: 6 }); cyl(K, [fx - 0.45, 0.4, sd * 0.42], [fx - 0.45, 0.62, sd * 0.47], 0.012, ST, { n: 5 });   // (the anti-roll bar's arm, its link)
      for (const [yy, c] of [[0.8, YEL], [0.76, RED], [0.72, BLU]]) hose([[0.3, yy, sd * 0.395], [2.2, yy, sd * 0.395]], 0.009, sd < 0 ? c : PLA, 4);   // (the air lines / the loom inside the rail)
      for (let i = 0; i < 6; i++) box(K, 0.5 + i * 0.34, 0.7, sd * 0.395, 0.02, 0.13, 0.014, PL2);   // (their clips)
      box(K, 2.84, 0.5, sd * 0.47, 0.12, 0.14, 0.08, FRM);
    }
    cyl(K, [fx - 0.45, 0.4, -0.42], [fx - 0.45, 0.4, 0.42], 0.022, RED, { n: 6 });
    box(K, 1.9, 0.5, 0, 0.12, 0.1, 0.84, FRM, PL2); for (const zc of [-0.36, -0.2, 0.2, 0.36]) bolt(1.9, 0.6, zc, 0.016, ST);   // (the cross member under the engine)
    box(K, 1.24, 0.55, 0, 0.08, 0.06, 0.84, FRM, PL2);
    cyl(K, [fx + 0.22, 0.46, -0.86], [fx + 0.22, 0.46, 0.86], 0.02, ST, { n: 6 }); for (const sd of [-1, 1]) cyl(K, [fx + 0.22, 0.46, sd * 0.86], [fx + 0.04, 0.48, sd * 0.9], 0.022, DK, { n: 6 });   // (the tie rod, the steering arms)
    cyl(K, [2.3, 0.6, -0.6], [2.3, 0.44, -0.62], 0.025, ST, { n: 6 }); cyl(K, [2.3, 0.44, -0.62], [fx + 0.1, 0.5, -0.84], 0.02, ST, { n: 6 });   // (the drop arm, the drag link)
    cyl(K, [2.9, 0.46, -1.0], [2.9, 0.46, 1.0], 0.05, FRM, { n: 8 });   // (the under-run bar)
    // (the tilt: the pump with its lever socket on the left rail, two hoses, the ram up to the cab's floor)
    box(K, 1.3, 0.66, -0.6, 0.2, 0.16, 0.12, AL, AL); cyl(K, [1.3, 0.82, -0.6], [1.3, 0.9, -0.66], 0.022, ST, { n: 6 }); cyl(K, [1.36, 0.74, -0.6], [1.36, 0.74, -0.68], 0.03, [0.8, 0.62, 0.1], { n: 6 });
    if (TF) { const a = [1.95, 0.76, -0.56], b = TF([1.6, 1.09, -0.5]), m = a.map((c, k) => c + (b[k] - c) * 0.58);
      box(K, a[0], 0.66, -0.56, 0.12, 0.07, 0.1, FRM); cyl(K, [a[0], 0.76, -0.62], [a[0], 0.76, -0.5], 0.03, ST, { n: 8 });
      cyl(K, a, m, 0.05, [0.75, 0.2, 0.15], { n: 10, capB: ST }); cyl(K, m, b, 0.026, [0.86, 0.87, 0.9], { n: 8 });
      hose([[1.4, 0.74, -0.6], [1.6, 0.7, -0.62], [1.9, 0.78, -0.62]], 0.012, RUB, 5); hose([[1.4, 0.7, -0.6], [1.7, 0.66, -0.63], m.map((c, k) => c + (k === 2 ? -0.06 : -0.03))], 0.012, RUB, 5);
      const s0 = [0.86, 1.2, 0.5], s1 = TF([0.86, 1.09, 0.5]); cyl(K, [1.5, 0.92, 0.5], TF([1.2, 1.1, 0.5]), 0.014, YEL, { n: 6 });   // (the safety stay, yellow)
    }
  };

  // the Kolibri's bay on another car: its space mapped onto the other's (c: x0 the bulkhead, x1 the nose's panel, sz across, y0, sy up)
  DELI.bayMap = (K, P, L, c) => {
    const sx = (c.x1 - c.x0) / 0.8, sy = c.sy || 1, sz = c.sz || 1, y0 = c.y0 == null ? 0.2 : c.y0, rs = Math.cbrt(sx * sy * sz);
    const X = (x) => c.x0 + (x - 0.87) * sx, Y = (y) => y0 + (y - 0.2) * sy, Z = (z) => z * sz, M = (p) => [X(p[0]), Y(p[1]), Z(p[2])];
    const K2 = Object.create(K);
    K2.box = (x, y, z, l, h, w, rot, col, top, f, o) => K.box(X(x), Y(y), Z(z), l * sx, h * sy, w * sz, rot, col, top, f, o);
    K2.cyl = (a, b, r, col, o) => K.cyl(M(a), M(b), r * rs, col, o && o.r2 ? Object.assign({}, o, { r2: o.r2 * rs }) : o);
    K2.plate = (pts, th, col, o) => K.plate(pts.map(M), th, col, o);
    K2.rect = (x, y, z, w, h, col, o) => K.rect(X(x), Y(y), Z(z), w * (o && /z/.test(o.dir) ? sx : sz), h * sy, col, o);
    K2.topY = (x, z) => (K.topY(X(x), Z(z || 0)) - y0) / sy + 0.2;
    DELI.kolibriBay(K2, P, { prop: (x, k) => L.prop(X(x), k) / sz }, c);
  };

  // ---- PROTOTYPE (pictures only): the Kolibri's boot in detail, ?prt=1..3 ----
  DELI.PRT = +(typeof location !== 'undefined' && new URLSearchParams(location.search).get('prt')) || 0;
  DELI.kolibriBoot = (K, P) => {
    const v = DELI.PRT; if (!v) return;
    const T = { inner: true, host: 'trunk' }, CAR = [0.3, 0.3, 0.33], CAR2 = [0.24, 0.24, 0.26], TR = [0.42, 0.42, 0.45], TR2 = [0.34, 0.34, 0.37], ST = [0.6, 0.61, 0.64];
    const FY = 0.46, SY = 0.59, open3 = v >= 3;
    // the side trims: a moulded panel each side, the arch's hump at its foot, a small bin behind the hump
    for (const sd of [-1, 1]) {
      box(K, -1.4475, FY, sd * 0.548, 0.395, 0.47, 0.008, TR, TR);
      box(K, -1.375, FY, sd * 0.505, 0.26, 0.2, 0.095, TR2, TR);
      box(K, -1.375, FY + 0.2, sd * 0.515, 0.2, 0.05, 0.075, TR2, TR);
      box(K, -1.575, FY, sd * 0.525, 0.13, 0.1, 0.05, TR2, CAR2);
      // the shelf's rest (a ledge along the trim) and its lamp on the left
      box(K, -1.45, 0.905, sd * 0.535, 0.36, 0.022, 0.03, TR2, TR2);
    }
    box(K, -1.5, 0.8, 0.546, 0.07, 0.035, 0.01, [0.95, 0.93, 0.8], [0.95, 0.93, 0.8]);
    // the sill: a plastic scuff plate, ribbed; the striker's loop in its middle
    box(K, -1.63, SY, 0, 0.05, 0.016, 1.08, TR2, TR);
    for (let i = -3; i <= 3; i++) if (i) box(K, -1.63, SY + 0.016, i * 0.13, 0.04, 0.004, 0.09, CAR2, CAR2);
    for (const dz of [-0.022, 0.022]) K.bar([-1.632, SY + 0.012, dz], [-1.632, SY + 0.05, dz], 0.005, CHR, Object.assign({ n: 4 }, IN));
    K.bar([-1.632, SY + 0.05, -0.022], [-1.632, SY + 0.05, 0.022], 0.005, CHR, Object.assign({ n: 4 }, IN));
    // the wall under the sill (the floor lies lower than the sill) and the seat back's rear, carpeted
    K.face([[-1.648, FY, 0.552], [-1.648, FY, -0.552], [-1.648, SY, -0.552], [-1.648, SY, 0.552]], CAR2, IN);
    K.face([[-1.262, FY, -0.5], [-1.262, FY, 0.5], [-1.355, 0.9, 0.49], [-1.355, 0.9, -0.49]], CAR, IN);
    // the lid, inside: a trim panel with a pull grip, the lock in its foot, two gas struts to the pillars
    K.rect(-1.65, 0.745, 0, 1.0, 0.22, TR, Object.assign({ dir: 'x' }, T));
    K.box(-1.642, 0.68, 0.3, 0.012, 0.035, 0.14, 0, TR2, CAR2, false, T);
    K.box(-1.644, 0.612, 0, 0.02, 0.05, 0.07, 0, ST, ST, false, T);
    for (const sd of [-1, 1]) { K.bar([-1.645, 0.97, sd * 0.5], [-1.44, 1.16, sd * 0.5], 0.011, CAR2, Object.assign({ n: 5 }, T)); K.bar([-1.44, 1.16, sd * 0.5], [-1.303, 1.3, sd * 0.5], 0.0055, CHR, Object.assign({ n: 4 }, T)); }
    for (const sd of [-1, 1]) K.bar([-1.554, 1.11, sd * 0.5], [-1.731, 1.338, sd * 0.5], 0.003, CAR2, Object.assign({ n: 3 }, IN));
    // the floor: a carpeted board with a pull loop (3: lifted against the seat, the well open)
    if (!open3) { box(K, -1.45, FY - 0.02, 0, 0.385, 0.02, 1.0, CAR2, CAR); K.bar([-1.6, FY + 0.002, -0.03], [-1.6, FY + 0.002, 0.03], 0.006, TR, Object.assign({ n: 3 }, IN)); }
    else {
      K.plate([[-1.3, 0.47, -0.5], [-1.3, 0.47, 0.5], [-1.385, 0.84, 0.5], [-1.385, 0.84, -0.5]], 0.02, CAR, IN);
      // the well: the body's paint, the spare lying in it (a steel rim), the jack and the brace in the rim
      box(K, -1.4, 0.228, 0, 0.5, 0.004, 0.8, K.shade(P, 0.55), K.shade(P, 0.7));
      for (const sd of [-1, 1]) box(K, -1.45, 0.23, sd * 0.42, 0.39, 0.15, 0.06, K.shade(P, 0.5), K.shade(P, 0.65));
      cyl(K, [-1.42, 0.235, 0], [-1.42, 0.36, 0], 0.225, [0.07, 0.07, 0.075], { n: 14, capB: [0.1, 0.1, 0.105] });
      cyl(K, [-1.42, 0.3, 0], [-1.42, 0.364, 0], 0.15, [0.75, 0.76, 0.78], { n: 12, capB: [0.82, 0.83, 0.85] });
      cyl(K, [-1.42, 0.3, 0], [-1.42, 0.368, 0], 0.085, [0.5, 0.5, 0.52], { n: 10, capB: [0.3, 0.3, 0.32] });
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; cyl(K, [-1.42 + Math.cos(a) * 0.05, 0.366, Math.sin(a) * 0.05], [-1.42 + Math.cos(a) * 0.05, 0.372, Math.sin(a) * 0.05], 0.012, [0.12, 0.12, 0.13], { n: 5 }); }
      cyl(K, [-1.42, 0.36, 0], [-1.42, 0.41, 0], 0.008, ST, { n: 4 }); cyl(K, [-1.42, 0.395, 0], [-1.42, 0.41, 0], 0.035, [0.1, 0.1, 0.11], { n: 6 });
    }
    if (v < 2) return;
    // the kit: the warning triangle's case across behind the sill, the first-aid bag, the scissor jack, the wheel brace, the tow eye
    const fy = open3 ? 0.385 : FY;
    if (!open3) {
      box(K, -1.33, fy, -0.18, 0.05, 0.07, 0.44, [0.78, 0.1, 0.08], [0.85, 0.14, 0.1]);
      box(K, -1.33, fy + 0.025, -0.18, 0.054, 0.014, 0.03, [0.9, 0.9, 0.88], [0.9, 0.9, 0.88]);
      box(K, -1.34, fy, 0.28, 0.1, 0.12, 0.2, [0.9, 0.42, 0.1], [0.95, 0.5, 0.14]);
      box(K, -1.34, fy + 0.12, 0.28, 0.03, 0.012, 0.09, CAR2, CAR2);
      // the jack, folded, strapped by the right trim; the brace beside it
      { const x = -1.47, z = 0.3, J = [0.2, 0.3, 0.62];
        box(K, x, fy, z, 0.07, 0.012, 0.16, J, J); box(K, x, fy + 0.055, z, 0.05, 0.012, 0.1, J, J);
        for (const s of [-1, 1]) { K.bar([x, fy + 0.012, z + s * 0.07], [x, fy + 0.034, z + s * 0.11], 0.007, J, Object.assign({ n: 4 }, IN)); K.bar([x, fy + 0.034, z + s * 0.11], [x, fy + 0.055, z + s * 0.045], 0.007, J, Object.assign({ n: 4 }, IN)); }
        K.bar([x, fy + 0.034, z - 0.13], [x, fy + 0.034, z + 0.13], 0.005, ST, Object.assign({ n: 4 }, IN));
        K.bar([x - 0.08, fy + 0.012, z - 0.13], [x - 0.08, fy + 0.012, z + 0.1], 0.008, ST, Object.assign({ n: 4 }, IN)); K.bar([x - 0.08, fy + 0.012, z + 0.1], [x - 0.03, fy + 0.012, z + 0.1], 0.008, ST, Object.assign({ n: 4 }, IN)); }
    } else {
      // (3: the kit in the well, round the spare)
      box(K, -1.6, 0.232, 0, 0.045, 0.045, 0.44, [0.78, 0.1, 0.08], [0.85, 0.14, 0.1]);
      { const x = -1.42, z = 0, y = 0.372, J = [0.2, 0.3, 0.62];
        box(K, x + 0.02, y, z, 0.06, 0.03, 0.13, J, J); K.bar([x - 0.04, y + 0.01, z - 0.07], [x - 0.04, y + 0.01, z + 0.07], 0.007, ST, Object.assign({ n: 4 }, IN)); }
      K.bar([-1.2, 0.24, -0.3], [-1.2, 0.24, 0.0], 0.008, ST, Object.assign({ n: 4 }, IN));
      box(K, -1.22, 0.232, 0.22, 0.09, 0.1, 0.2, [0.9, 0.42, 0.1], [0.95, 0.5, 0.14]);
    }
  };
  const BK = 7; DELI.BK = BK;
  DELI.kolibriBay = (K, P, L, C) => {   // (pictures only: ?ozn=barve paints each element, a line of the bay's source, its own colour)
    if (typeof location === 'undefined' || !/[?&]ozn=(barve|sk)/.test(location.search)) return DELI.kolibriBay0(K, P, L, C);
    const SK = (/[?&]sk=([\d,-]+)/.exec(location.search) || [])[1], RG = SK ? SK.split(',').map(r => r.split('-').map(Number)) : null;
    const HELP = /^(box|cyl|bolt|hose|corr|tank|hp|Object\.box|Object\.cyl|Object\.plate|Object\.rect|K\.box|K\.cyl|K\.plate|K\.rect)$/, o = { box: K.box, cyl: K.cyl, plate: K.plate, rect: K.rect }, lim = Error.stackTraceLimit; Error.stackTraceLimit = 40;
    const hsl = (h, s2, l) => { const f = (n) => { const k = (n + h * 12) % 12; return l - s2 * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0), f(8), f(4)]; };
    const col = () => { let ln = 0; for (const f of new Error().stack.split('\n').slice(2)) { const m = /at (?:(\S+) \()?.*skriti\.js[^:]*:(\d+):/.exec(f); if (!m) break; if (m[1] && HELP.test(m[1])) continue; ln = +m[2]; break; }
      if (RG) return RG.some(r => ln >= r[0] && ln <= (r[1] || r[0])) ? [1, 0, 1] : null; const h = (ln * 0.61803398875) % 1; return hsl(h, 0.85, 0.42 + 0.2 * ((ln * 7) % 3) / 2); };
    K.box = function (...a) { const c = col(); if (!c) return o.box.apply(this, a); a[7] = c; a[8] = c.map(v => Math.min(1, v * 1.12)); return o.box.apply(this, a); };
    K.cyl = function (...a) { const c = col(); if (!c) return o.cyl.apply(this, a); a[3] = c; if (a[4]) { a[4] = Object.assign({}, a[4]); for (const k of ['capA', 'capB']) if (Array.isArray(a[4][k])) a[4][k] = c; } return o.cyl.apply(this, a); };
    K.plate = function (...a) { const c = col(); if (c) a[2] = c; return o.plate.apply(this, a); };
    K.rect = function (...a) { const c = col(); if (c) a[5] = c; return o.rect.apply(this, a); };
    try { return DELI.kolibriBay0(K, P, L, C); } finally { Object.assign(K, o); Error.stackTraceLimit = lim; }
  };
  for (const nm of ['titanBay', 'titanCab']) { const f0 = DELI[nm]; DELI[nm] = (K, P, TF) => { const kb = DELI.kolibriBay0; DELI.kolibriBay0 = () => f0(K, P, TF); try { return DELI.kolibriBay(K, P); } finally { DELI.kolibriBay0 = kb; } }; }
  DELI.kolibriBay0 = (K, P, L, C) => {
    C = C || {}; const EV = C.kind === 'ev', CC = C.cover || AL, CR2 = C.plenum || [0.3, 0.3, 0.33], LONG = /^(v8|v8carb|v12|rotary|i5)$/.test(C.kind || ''), SZ = LONG ? -0.47 : -0.24; const OZ = (typeof location !== 'undefined' && new URLSearchParams(location.search).get('ozn')) || ''; const SAM = OZ.slice(0, 4) === 'sam:' ? OZ.slice(4) : null, ozM = (q, n) => n ? q : [0, 0, 0], ozA = (id) => { if (SAM) K.xf(SAM === id ? null : ozM); }, ozB = () => { if (SAM) K.xf(ozM); }; ozB();
    const RAILS = C.rails || C.kind === 'v8carb'; const v = BK, H = { inner: true, host: 'hood' }, sh = (k) => K.shade(P, k), top = (x, z) => K.topY(x, z || 0), W = (x) => L.prop(x, 'w');
    const PB = sh(0.86), PD = sh(0.7), PM = sh(0.6), CRM = [0.8, 0.74, 0.58], CRD = [0.6, 0.55, 0.42], RUB = [0.05, 0.05, 0.055], RUST = [0.42, 0.24, 0.16], PLA = [0.085, 0.085, 0.095], PL2 = [0.17, 0.17, 0.19], ST = [0.55, 0.56, 0.6];
    const bolt = (x, y, z, r, c) => cyl(K, [x, y, z], [x, y + 0.008, z], r || 0.009, c || AL, { n: 5 });
    const hose = (pts, r, col, n) => { for (let i = 0; i + 1 < pts.length; i++) cyl(K, pts[i], pts[i + 1], r, col, { n: n || 6, capA: null, capB: null }); };
    const corr = (a, b, r) => { cyl(K, a, b, r, RUB, { n: 8, capA: null, capB: null }); const n = Math.max(3, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 0.03));   // (a corrugated duct: rings along it)
      for (let i = 0; i < n; i++) { const t0 = (i + 0.25) / n, t1 = (i + 0.7) / n, q = (t) => a.map((c, k) => c + (b[k] - c) * t); cyl(K, q(t0), q(t1), r + 0.006, PL2, { n: 8 }); } };
    const tank = (x, y, z, l, h, w, cap, liq) => { box(K, x, y, z, l, h, w, CRM, CRM); for (let i = 1; i <= 3; i++) box(K, x, y + h * i / 4 - 0.004, z, l + 0.01, 0.008, w + 0.01, CRD);   // (a ribbed reservoir, its cap)
      if (liq) box(K, x, y + 0.004, z, l + 0.004, h * 0.42, w + 0.004, liq); box(K, x, y + h, z, l * 0.5, 0.012, w * 0.5, CRM);
      cyl(K, [x, y + h + 0.01, z], [x, y + h + 0.04, z], Math.min(l, w) * 0.24, cap, { n: 8 }); box(K, x, y + h + 0.04, z, 0.012, 0.008, Math.min(l, w) * 0.4, cap); };
    // -- the shell round the bay: painted aprons and bulkhead, the wings' rails and their bolts, the strut towers
    K.rect(0.872, 0.55, 0, 1.3, 0.5, PM, { inner: true, part: 'body', dir: 'x' });
    for (const zc of [-0.5, -0.02, 0.2, 0.5]) box(K, 0.88, 0.4, zc, 0.014, 0.36, 0.06, PD, PB);   // (the bulkhead's pressed ribs, its ledge, the tunnel's bulge, grommets)
    box(K, 0.895, 0.77, 0, 0.05, 0.018, 1.28, PB, PB); box(K, 0.885, 0.26, 0, 0.03, 0.2, 0.26, PD, PB);
    for (const [yy, zc] of [[0.7, 0.1], [0.66, 0.3], [0.7, -0.44]]) cyl(K, [0.874, yy, zc], [0.886, yy, zc], 0.022, RUB, { n: 8 });
    box(K, 1.47, 0.2, 0, 0.09, 0.07, 0.86, PM, PD);   // (the front cross member under the engine)
    for (const sd of [-1, 1]) {
      for (let i = 0; i < 4; i++) { const xm = 0.99 + i * 0.18, zz = sd * (W(xm) - 0.05), yy = top(xm, zz) - 0.05; if (RAILS) { box(K, xm, yy, zz, 0.18, 0.02, 0.07, PB); box(K, xm, yy + 0.02, zz - sd * 0.03, 0.18, 0.007, 0.012, RUB); for (const dx of [-0.045, 0.045]) bolt(xm + dx, yy + 0.02, zz + sd * 0.012, 0.009, PL2); }
        K.rect(xm, yy - 0.1, sd * (W(xm) - 0.022), 0.18, 0.2, PD, { inner: true, part: 'body', dir: sd < 0 ? 'z' : '-z' }); }
      box(K, 1.25, 0.27, sd * 0.4, 0.78, 0.1, 0.09, PM, PB); for (const xm of [0.96, 1.32, 1.52]) box(K, xm, 0.37, sd * 0.4, 0.06, 0.002, 0.03, BLK);   // (the chassis leg, its holes)
      box(K, 1.56, 0.37, sd * 0.4, 0.05, 0.012, 0.13, PB); for (const dz of [-0.045, 0.045]) bolt(1.56, 0.382, sd * (0.4 + dz), 0.009, PL2);
      cyl(K, [1.15, 0.3, sd * 0.5], [1.15, 0.3, sd * 0.63], 0.37, PD, { n: 14, capA: PM });   // (the wheel house's dome, the strut's turret on it)
      if (OZ !== 'amortizerji') { cyl(K, [1.15, 0.6, sd * 0.57], [1.15, 0.68, sd * 0.57], 0.1, PB, { n: 10 }); cyl(K, [1.15, 0.68, sd * 0.57], [1.15, 0.692, sd * 0.57], 0.075, PM, { n: 10 }); }
      if (OZ !== 'vzmeti') { ozA('vzmeti'); const hp = []; for (let i = 0; i <= 40; i++) hp.push([1.15 + Math.cos(i * 0.785) * 0.062, 0.34 + i * 0.0065, sd * 0.57 + Math.sin(i * 0.785) * 0.062]); hose(hp, 0.011, [0.2, 0.35, 0.75], 5); ozB(); }   // (the spring round the strut)
      for (const xm of [0.93, 1.38]) box(K, xm, 0.5, sd * 0.625, 0.012, 0.22, 0.03, PB);   // (the apron's stiffeners)
      box(K, 1.585, 0.3, sd * 0.345, 0.04, top(1.6) - 0.375, 0.04, PB);   // (the radiator support's upright)
      box(K, 0.9, top(0.9, sd * 0.56) - 0.06, sd * 0.56, 0.09, 0.03, 0.035, PB); bolt(0.9, top(0.9, sd * 0.56) - 0.03, sd * 0.56, 0.01, AL);   // (the bonnet's hinge)
      cyl(K, [1.14, top(1.14, sd * 0.6) - 0.05, sd * 0.6], [1.085, 1.03, sd * 0.585], 0.013, RUB, { n: 6 }); cyl(K, [1.085, 1.03, sd * 0.585], [1.04, 1.2, sd * 0.57], 0.006, ST, { n: 5 });   // (the gas strut) cyl(K, [1.15, 0.692, sd * 0.57], [1.15, 0.715, sd * 0.57], 0.03, AL, { n: 6 });
      for (let i = 0; i < 3; i++) bolt(1.15 + Math.cos(i * 2.094) * 0.052, 0.692, sd * 0.57 + Math.sin(i * 2.094) * 0.052, 0.011, AL);
      box(K, 1.6, 0.5, sd * 0.5, 0.1, RAILS ? 0.19 : 0.12, 0.27, PLA, PL2); cyl(K, [1.55, 0.6, sd * 0.5], [1.52, 0.6, sd * 0.5], 0.045, PL2, { n: 8 });   // (the lamp's back, its bulb cover)
    }
    // -- the slam panel over the radiator: pressed openings, its bolts, the bonnet's catch; the cowl's panel and its vents by the screen
    const ys = top(1.6) - 0.075; box(K, 1.6, ys, 0, 0.1, 0.025, RAILS ? Math.max(1.26, 2 * (W(1.6) - 0.05)) : 0.84, PB);
    // -- the closing panels: the inner wing's shelf from the apron up to the wing's rail, the cowl's ends, the nose's cover over the lamps, the undertray
    if (!C.open) { const BO = { inner: true, part: 'body' }, XN = C.x2 == null ? 1.86 : C.x2, NS = 8;
      for (const sd of [-1, 1]) {
        if (RAILS) {
        for (let i = 0; i < NS; i++) { const xa = 0.872 + i * 0.1, xb = xa + 0.1, q = (x) => { const zo = Math.max(0.66, W(x) - 0.083); return [[x, 0.7, sd * 0.64], [x, top(x, sd * zo) - 0.052, sd * zo]]; }, A = q(xa), B = q(xb);
          K.plate([A[0], B[0], B[1], A[1]], 0.012, i % 2 ? PB : sh(0.82), BO);
          const m = (u, x) => { const a = q(x); return [x, a[0][1] + (a[1][1] - a[0][1]) * u + 0.008, a[0][2] + (a[1][2] - a[0][2]) * u]; };
          K.plate([m(0.3, xa + 0.012), m(0.3, xb - 0.012), m(0.7, xb - 0.012), m(0.7, xa + 0.012)], 0.004, PD, BO);   // (the pressed panel in it)
          if (i % 2 === 0) { const b = m(0.86, xa + 0.05); bolt(b[0], b[1] - 0.004, b[2], 0.009, PL2); const g = m(0.14, xa + 0.05); cyl(K, [g[0], g[1] - 0.006, g[2]], [g[0], g[1] + 0.002, g[2]], 0.014, RUB, { n: 6 }); } }
        }
        K.rect(1.272, 0.47, sd * 0.642, 0.8, 0.46, PM, { inner: true, part: 'body', dir: sd < 0 ? 'z' : '-z' });   // (the apron's wall under the shelf)
        const wc = Math.max(0.66, W(0.9) - 0.05); if (wc > 0.66) box(K, 0.9, 0.77, sd * (0.64 + wc) / 2, 0.06, 0.018, wc - 0.64, PB, PB);   // (the cowl's end)
        if (RAILS) {
        const nx = Math.max(2, Math.round((XN - 1.65) / 0.07));   // (the nose: body colour over the lamp, plastic over the radiator)
        for (let i = 0; i < nx; i++) { const xa = 1.648 + (XN - 1.648) * i / nx, xb = 1.648 + (XN - 1.648) * (i + 1) / nx, zo = (x) => Math.max(0.4, W(x) - 0.04), d = 0.045;
          K.plate([[xa, top(xa, sd * 0.34) - d, sd * 0.34], [xb, top(xb, sd * 0.34) - d, sd * 0.34], [xb, top(xb, sd * zo(xb)) - d, sd * zo(xb)], [xa, top(xa, sd * zo(xa)) - d, sd * zo(xa)]], 0.012, PB, BO);
          if (sd > 0) { K.plate([[xa, top(xa, 0.34) - d, -0.34], [xb, top(xb, 0.34) - d, -0.34], [xb, top(xb, 0.34) - d, 0.34], [xa, top(xa, 0.34) - d, 0.34]], 0.012, PL2, BO);
            const xm = (xa + xb) / 2; for (const zc of [-0.2, 0, 0.2]) box(K, xm, top(xm, 0.34) - d + 0.006, zc, (xb - xa) * 0.35, 0.004, 0.15, PLA); } }
        for (const zc of [0.3, 0.52]) cyl(K, [1.7, top(1.7, sd * zc) - 0.04, sd * zc], [1.7, top(1.7, sd * zc) - 0.03, sd * zc], 0.012, PLA, { n: 6 });   // (its clips)
        }
      }
      { const zf = Math.max(0.4, W(XN) - 0.04), yt = top(XN, zf) - 0.05, yb = 0.34;   // (the nose's front wall under the cover: the lamps' panel, the radiator's opening)
        for (const sd of [-1, 1]) K.rect(XN, (yt + yb) / 2, sd * (0.3 + zf) / 2, zf - 0.3, yt - yb, PD, { inner: true, part: 'body', dir: 'x' });
        K.rect(XN, (yt + yb) / 2, 0, 0.6, yt - yb, PLA, { inner: true, part: 'body', dir: 'x' }); for (let i = 0; i < 4; i++) box(K, XN + 0.004, yb + 0.03 + i * (yt - yb - 0.05) / 4, 0, 0.006, 0.012, 0.56, PL2);
        for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { const xa = 1.648 + (XN - 1.648) * i / 3, xb = 1.648 + (XN - 1.648) * (i + 1) / 3, za = Math.max(0.4, W(xa) - 0.04), zb = Math.max(0.4, W(xb) - 0.04);
          K.plate([[xa, 0.34, sd * za], [xb, 0.34, sd * zb], [xb, top(xb, zb) - 0.05, sd * zb], [xa, top(xa, za) - 0.05, sd * za]], 0.01, PD, BO); } }
      if (!RAILS) {   // (the modern opening: one rolled surround from the body's skin in to a rounded lip, its seal; plastic over the radiator)
        const NA = 56, cl = (t) => Math.max(0, Math.min(1, t)), sm = (t) => { t = cl(t); return t * t * (3 - 2 * t); }, xc = (XN + 0.872) / 2, ax = (XN - 0.872) / 2;
        const se = (a) => { const c = Math.cos(a), sn = Math.sin(a); return [Math.sign(c) * Math.pow(Math.abs(c), 0.42), Math.sign(sn) * Math.pow(Math.abs(sn), 0.42)]; };
        const ring = (a) => { const [u, w] = se(a), xo = xc + (ax - 0.004) * u, zo = (W(xo) - 0.03) * w, yo = top(xo, Math.abs(zo)) - 0.028;
          const xi = xc + u * (u > 0 ? ax - (XN - 1.6) : ax - 0.075), wi = Math.max(0.46, Math.min(W(xi) - 0.11, 0.7 - 0.16 * sm((xi - 1.2) / 0.42))), zi = wi * w, yi = yo - 0.085 + 0.03 * sm((xi - 1.45) / 0.14) * (1 - sm((Math.abs(zi) - 0.36) / 0.12));
          const q = (f, y) => [xo + (xi - xo) * f, y, zo + (zi - zo) * f]; return [[xo, yo, zo], q(0.26, yo - 0.008), q(0.34, yi - 0.012), q(0.82, yi - 0.03), [xi, yi, zi], [xi + (xi - xc) * 0.02, yi - 0.13, zi * 1.03], q(0.82, yi), q(0.58, yi - 0.021)]; };   // (skin, the shoulder, the gutter's wall and floor, the lip, its skirt)
        const R = []; for (let i = 0; i <= NA; i++) R.push(ring((i + 0.5) / NA * Math.PI * 2));
        for (let i = 0; i < NA; i++) { const A = R[i], B = R[i + 1], xm = (A[4][0] + B[4][0]) / 2, zm = Math.abs(A[4][2] + B[4][2]) / 2, pl = xm > 1.58 && zm < 0.4, k = 0.86 + 0.04 * Math.cos(i * 6.2832 / NA * 2);
          const mid = (a, b2) => [0, 1, 2].map(j => (A[a][j] + B[a][j] + A[b2][j] + B[b2][j]) / 4), side = Math.abs(Math.sin((i + 1) / NA * Math.PI * 2)) > 0.75;
          K.plate([A[0], B[0], B[1], A[1]], 0.01, sh(k), BO); K.plate([A[1], B[1], B[2], A[2]], 0.008, sh(k - 0.2), BO);   // (the shoulder under the bonnet's edge, the wall down to the gutter)
          K.plate([A[2], B[2], B[3], A[3]], 0.008, pl ? PL2 : sh(k - 0.1), BO); K.plate([A[3], B[3], B[4], A[4]], 0.008, pl ? PL2 : sh(k - 0.03), BO); K.plate([A[4], B[4], B[5], A[5]], 0.008, pl ? PLA : sh(0.62), BO);
          cyl(K, [A[4][0], A[4][1] + 0.01, A[4][2]], [B[4][0], B[4][1] + 0.01, B[4][2]], 0.012, RUB, { n: 5, capA: null, capB: null });   // (the seal on the lip)
          if (!pl && side && i % 3 === 0) { const m = mid(7, 7); bolt(m[0], m[1] + 0.002, m[2], 0.012, AL); cyl(K, [m[0], m[1], m[2]], [m[0], m[1] + 0.003, m[2]], 0.02, sh(0.7), { n: 8 }); }   // (the wing's bolts down in the gutter, their washers)
          if (!pl && !side && i % 2 === 0) { const m = mid(7, 7); cyl(K, [m[0], m[1], m[2]], [m[0], m[1] + 0.008, m[2]], 0.01, PLA, { n: 6 }); }   // (plastic plugs)
          if (!pl && i % 2 === 1) { const m = mid(1, 1); cyl(K, [m[0], m[1] - 0.002, m[2]], [m[0], m[1] + 0.002, m[2]], 0.005, sh(0.7), { n: 5 }); }   // (spot welds along the shoulder)
          if (pl && i % 2 === 0) { const m = mid(7, 7); box(K, m[0], m[1] + 0.01, m[2], 0.04, 0.004, 0.045, PLA); cyl(K, [m[0], m[1] + 0.012, m[2]], [m[0], m[1] + 0.02, m[2]], 0.009, PL2, { n: 6 }); } }
        for (const a of [0.085, 0.415, 0.585, 0.915]) { const r = ring(a * Math.PI * 2), m = [0, 1, 2].map(j => (r[2][j] + r[3][j]) / 2), fr = a < 0.25 || a > 0.75;   // (in the corners: the bonnet's rubber stops in front, its hinges' feet behind)
          if (fr) { cyl(K, m, [m[0], m[1] + 0.03, m[2]], 0.02, RUB, { n: 8 }); cyl(K, m, [m[0], m[1] + 0.012, m[2]], 0.027, PLA, { n: 8 }); }
          else { box(K, m[0], m[1], m[2], 0.1, 0.012, 0.05, sh(0.7)); for (const dx of [-0.03, 0.03]) bolt(m[0] + dx, m[1] + 0.012, m[2], 0.011, AL); } }
        for (const sd of [-1, 1]) { const r = ring((sd > 0 ? 0.25 : 0.75) * Math.PI * 2 + 0.25 * sd), m = r[7];   // (a drain in the gutter, the body's plate riveted by it: no words)
          cyl(K, [m[0], m[1] - 0.004, m[2]], [m[0], m[1] + 0.003, m[2]], 0.016, BLK, { n: 8 }); if (sd > 0) { box(K, m[0] - 0.12, m[1] + 0.002, m[2], 0.08, 0.003, 0.045, AL); for (const dx of [-0.033, 0.033]) bolt(m[0] - 0.12 + dx, m[1] + 0.005, m[2], 0.005, ST); } }
        for (const sd of [-1, 1]) { const xa = 1.36, xb = 1.62, za = 0.69, zb = 0.5, ya = top(xa, za) - 0.16, yb = top(xb, zb) - 0.17;   // (the plastic trim beside the engine, slanting in to the radiator's cover)
          K.plate([[xa, ya, sd * za], [xb, yb, sd * zb], [xb, yb - 0.03, sd * (zb - 0.12)], [xa, ya - 0.04, sd * (za - 0.1)]], 0.012, PL2, BO);
          for (let i = 0; i < 3; i++) { const t = 0.25 + i * 0.25; box(K, xa + (xb - xa) * t, ya + (yb - ya) * t - 0.012, sd * (za + (zb - za) * t - 0.055), 0.03, 0.006, 0.07, PLA); } }
        const yc = top(0.93, 0) - 0.1; box(K, 0.935, yc, 0, 0.11, 0.018, 1.2, PLA, PL2); for (let i = -5; i <= 5; i++) box(K, 0.95, yc + 0.018, i * 0.1, 0.05, 0.004, 0.07, PL2);   // (the cowl's plastic grille under the screen)
      }
      box(K, (0.87 + XN) / 2, 0.1, 0, XN - 0.87, 0.012, 1.3, PLA, PL2);   // (the undertray)
    }
    // == 7 (the frame): the subframe and wishbones, crash boxes and the bumper's beam, braces, spot welds, sealer, brake hoses, the gear rods
    const frame7 = () => {
      const SUB = [0.13, 0.13, 0.15], SEAL = [0.62, 0.62, 0.6];
      box(K, 1.0, 0.13, 0, 0.07, 0.06, 0.72, SUB, PL2); box(K, 1.4, 0.13, 0, 0.06, 0.05, 0.72, SUB, PL2);
      for (const sd of [-1, 1]) {
        box(K, 1.2, 0.13, sd * 0.33, 0.46, 0.055, 0.07, SUB, PL2); for (const xm of [1.0, 1.4]) { cyl(K, [xm, 0.185, sd * 0.33], [xm, 0.27, sd * 0.38], 0.02, RUB, { n: 6 }); bolt(xm, 0.186, sd * 0.33, 0.014, ST); }
        cyl(K, [1.32, 0.17, sd * 0.34], [1.17, 0.15, sd * 0.6], 0.02, SUB, { n: 6 }); cyl(K, [1.02, 0.17, sd * 0.34], [1.17, 0.15, sd * 0.6], 0.02, SUB, { n: 6 }); cyl(K, [1.17, 0.13, sd * 0.6], [1.17, 0.2, sd * 0.6], 0.028, ST, { n: 6 });   // (the wishbone, its ball joint)
        if (OZ !== 'stabilizatorji') { ozA('stabilizatorji'); cyl(K, [1.36, 0.22, sd * 0.42], [1.2, 0.3, sd * 0.56], 0.007, ST, { n: 4 }); ozB(); }   // (the anti-roll bar's drop link)
        box(K, 1.675, 0.275, sd * 0.4, 0.07, 0.09, 0.085, ST, AL); for (const dx of [-0.018, 0.012]) box(K, 1.675 + dx, 0.27, sd * 0.4, 0.008, 0.1, 0.095, PL2);   // (the crash box, its crush beads)
        cyl(K, [1.1, 0.675, sd * 0.5], [0.9, 0.745, sd * 0.36], 0.012, PB, { n: 6 }); bolt(1.1, 0.682, sd * 0.5, 0.011, ST); bolt(0.905, 0.75, sd * 0.36, 0.011, ST);   // (the brace: turret to bulkhead)
        for (let i = 0; i < 12; i++) { const xm = 0.9 + i * 0.062; for (const dz of [-0.034, 0.034]) cyl(K, [xm, 0.37, sd * 0.4 + dz], [xm, 0.3712, sd * 0.4 + dz], 0.0065, PD, { n: 5 }); }   // (spot welds along the leg)
        hose([[0.886, 0.26, sd * 0.36], [0.886, 0.5, sd * 0.44], [0.886, 0.74, sd * 0.56]], 0.007, SEAL, 4); hose([[0.9, 0.375, sd * 0.45], [1.45, 0.375, sd * 0.45]], 0.005, SEAL, 4);   // (sealer along the seams)
        hose([[0.9, 0.42, sd * 0.47], [1.02, 0.4, sd * 0.47], [1.08, 0.36, sd * 0.47]], 0.005, ST, 4); hose([[1.08, 0.36, sd * 0.47], [1.12, 0.3, sd * 0.5], [1.17, 0.28, sd * 0.56]], 0.009, RUB, 5); box(K, 1.08, 0.35, sd * 0.47, 0.03, 0.03, 0.012, AL);   // (the brake's pipe, its flexible hose, the bracket)
        for (const xm of [1.0, 1.3]) { box(K, xm, 0.371, sd * 0.4, 0.09, 0.006, 0.07, PB); for (const dx of [-0.03, 0.03]) bolt(xm + dx, 0.377, sd * 0.4, 0.008, ST); }   // (the subframe's plates on the leg)
        cyl(K, [1.6, 0.3, sd * 0.3], [1.6, 0.3, sd * 0.3 + 0.001], 0.02, BLK, { n: 6 });
      }
      box(K, 1.72, 0.26, 0, 0.035, 0.11, 1.02, AL, [0.8, 0.81, 0.84]); for (const zc of [-0.25, 0, 0.25]) box(K, 1.701, 0.29, zc, 0.004, 0.05, 0.16, PL2);   // (the bumper's beam)
      for (let i = -9; i <= 9; i++) cyl(K, [0.9, 0.788, i * 0.066], [0.9, 0.7892, i * 0.066], 0.0065, PD, { n: 5 });   // (spot welds along the bulkhead's ledge)
      for (const zc of [-0.36, 0.38]) { cyl(K, [0.874, 0.48, zc], [0.888, 0.48, zc], 0.03, PB, { n: 8 }); cyl(K, [0.874, 0.48, zc], [0.89, 0.48, zc], 0.012, RUB, { n: 6 }); }   // (the bulkhead's blanking plugs)
      hose([[1.6, ys + 0.03, 0.02], [1.6, ys + 0.03, 0.46], [1.4, ys - 0.02, 0.56], [0.92, 0.72, 0.52]], 0.005, BLK, 4);   // (the bonnet catch's cable)
      for (const [x, y, z] of [[1.5, ys - 0.015, 0.565], [1.2, 0.7, 0.555]]) box(K, x, y, z, 0.02, 0.012, 0.016, [0.85, 0.85, 0.8]);   // (its clips)
    };
    for (let i = 0; i < 10; i++) { const zc = (-0.495 + i * 0.11) * (RAILS ? 1 : 0.76), u = i % 2 ? 1 : -1; if (i === 4 || i === 5) continue;   // (its triangular lightening holes)
      K.plate([[1.6 - u * 0.03, ys + 0.0255, zc - 0.04], [1.6 - u * 0.03, ys + 0.0255, zc + 0.04], [1.6 + u * 0.03, ys + 0.0255, zc]], 0.002, BLK, { inner: true, part: 'body' }); } for (const zc of (RAILS ? [-0.56, -0.32, -0.1, 0.1, 0.32, 0.56] : [-0.38, -0.24, -0.1, 0.1, 0.24, 0.38])) bolt(1.6, ys + 0.025, zc, 0.01, PL2);
    box(K, 1.6, ys + 0.025, 0, 0.06, 0.03, 0.07, AL, PL2); cyl(K, [1.6, ys + 0.055, 0], [1.6, ys + 0.07, 0], 0.012, AL, { n: 6 });
    box(K, 1.57, 0.29, 0, 0.03, ys - 0.29, 0.02, PB);   // (the catch's stay down the radiator's middle)
    const yc = top(0.92) - 0.085; box(K, 0.92, yc, 0, 0.11, 0.03, 1.3, PLA, PL2);
    for (const zc of [-0.38, 0.38]) for (let i = 0; i < 6; i++) box(K, 0.895 + i * 0.011, yc + 0.03, zc, 0.004, 0.004, 0.3, [0.3, 0.3, 0.33]);
    // -- under the bonnet: its pressed frame (rails round the edge, two ribs by the scoop's duct, lightening holes)
    const hp = (x0, x1, z0, z1, col, d) => K.plate([[x0, top(x0, z0) - d, z0], [x1, top(x1, z0) - d, z0], [x1, top(x1, z1) - d, z1], [x0, top(x0, z1) - d, z1]], 0.014, col, H);
    hp(1.55, 1.65, -0.6, 0.6, PB, 0.04); hp(0.86, 0.95, -0.6, 0.6, PB, 0.04); for (const sd of [-1, 1]) { hp(0.95, 1.55, sd * 0.5, sd * 0.61, PB, 0.04); hp(0.95, 1.55, sd * 0.3, sd * 0.36, PB, 0.04);
      for (const xm of [1.08, 1.25, 1.42]) hp(xm - 0.04, xm + 0.04, sd * 0.53, sd * 0.58, BLK, 0.056); hp(1.2, 1.3, sd * 0.36, sd * 0.5, PB, 0.04); }
    for (const zc of [-0.4, -0.15, 0.15, 0.4]) hp(1.575, 1.625, zc - 0.07, zc + 0.07, BLK, 0.056);
    hp(1.36, 1.55, -0.06, 0.06, PB, 0.04); hp(1.1, 1.2, -0.3, 0.3, PB, 0.04);
    if (v >= 3) hp(0.97, 1.53, -0.29, 0.29, [0.2, 0.2, 0.21], 0.035);   // (3: the sound pad between the ribs)
    // -- the brakes on the bulkhead before the driver: the servo's drum, the master cylinder, its reservoir
    cyl(K, [0.88, 0.62, SZ], [0.96, 0.62, SZ], 0.1, PLA, { n: 12, capB: PL2 }); cyl(K, [0.96, 0.62, SZ], [1.03, 0.62, SZ], 0.026, AL, { n: 6 });
    box(K, 0.995, 0.645, SZ, 0.07, 0.055, 0.06, CRM, CRM); box(K, 0.995, 0.645, SZ, 0.072, 0.025, 0.062, [0.75, 0.62, 0.3]); cyl(K, [0.995, 0.7, SZ], [0.995, 0.72, SZ], 0.024, YEL, { n: 8 });
    // -- the battery (the garage's in its place), its clamp, its posts and cables
    if (OZ !== 'akumulator') K.deli('akumulator', () => { box(K, 0.98, 0.42, 0.42, 0.22, 0.17, 0.15, PLA, PL2); box(K, 0.98, 0.59, 0.42, 0.2, 0.006, 0.02, AL);
      if (v > 1) for (let i = 0; i < 6; i++) bolt(0.9 + i * 0.032, 0.59, 0.455, 0.008, YEL);
      for (const [dx, c] of [[-0.08, RED], [0.08, BLK]]) { cyl(K, [0.98 + dx, 0.59, 0.38], [0.98 + dx, 0.61, 0.38], 0.014, ST, { n: 6 }); box(K, 0.98 + dx, 0.605, 0.38, 0.04, 0.012, 0.03, c); } });
    hose([[0.9, 0.61, 0.38], [0.89, 0.62, 0.3], [0.9, 0.5, 0.2]], 0.01, RED, 4); hose([[1.06, 0.61, 0.38], [1.1, 0.6, 0.46], [1.1, 0.45, 0.48]], 0.01, BLK, 4);
    // -- the radiator's fan in its shroud, the filler's cap, the two hoses to the engine
    box(K, 1.555, 0.3, 0.05, 0.03, 0.34, 0.5, PLA); cyl(K, [1.54, 0.47, 0.05], [1.525, 0.47, 0.05], 0.15, PL2, { n: 12, capB: PLA }); cyl(K, [1.525, 0.47, 0.05], [1.5, 0.47, 0.05], 0.04, AL, { n: 6 });
    cyl(K, [1.6, 0.68, 0.34], [1.6, 0.7, 0.34], 0.028, AL, { n: 8 });
    if (!EV && C.kind !== 'rotary') hose([[1.585, 0.64, 0.26], [1.5, 0.63, 0.24], [1.44, 0.56, 0.2]], 0.024, RUB); if (!EV && C.kind !== 'rotary') hose([[1.585, 0.32, -0.3], [1.5, 0.32, -0.28], [1.44, 0.36, -0.22]], 0.024, RUB);
    for (const id of ['turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum']) K.deli(id, () => {});

    if (EV) {   // == an electric car's bay: the drive unit low between the legs, its inverter on it, orange high-voltage cables, coolant, no exhaust
      const fin = (x, y, z, l, w, n) => { for (let i = 0; i < n; i++) box(K, x, y, z - w / 2 + (i + 0.5) * w / n, l, 0.012, w / n * 0.45, [0.5, 0.51, 0.54]); };
      cyl(K, [1.22, 0.36, -0.08], [1.22, 0.36, 0.3], 0.14, AL, { n: 12, capA: ST, capB: ST }); for (let i = 0; i < 6; i++) cyl(K, [1.22, 0.36, -0.04 + i * 0.06], [1.22, 0.36, -0.025 + i * 0.06], 0.148, ST, { n: 12 });   // (the motor, its ribs)
      box(K, 1.25, 0.24, -0.2, 0.3, 0.26, 0.14, AL, ST); cyl(K, [1.3, 0.34, -0.27], [1.3, 0.34, -0.3], 0.09, ST, { n: 10 });   // (the reduction gear)
      for (const sd of [-1, 1]) { cyl(K, [1.3, 0.3, sd * 0.3], [1.16, 0.3, sd * 0.62], 0.016, ST, { n: 6 }); cyl(K, [1.28, 0.3, sd * 0.34], [1.25, 0.3, sd * 0.41], 0.036, RUB, { n: 8 }); }
      box(K, 1.22, 0.52, 0.06, 0.34, 0.09, 0.44, AL, [0.8, 0.81, 0.84]); fin(1.22, 0.61, 0.06, 0.28, 0.36, 9);   // (the inverter on the motor)
      for (const [dx, dz] of [[-0.15, -0.14], [-0.15, 0.26], [0.15, -0.14], [0.15, 0.26]]) bolt(1.22 + dx, 0.61, dz, 0.011, ST);
      for (let i = 0; i < 3; i++) { const zc = 0.0 + i * 0.05; cyl(K, [1.39, 0.56, zc], [1.42, 0.56, zc], 0.022, ORA, { n: 6 }); hose([[1.42, 0.56, zc], [1.46, 0.5, zc + 0.02], [1.42, 0.4, zc + 0.04], [1.34, 0.38, zc + 0.04]], 0.014, ORA, 5); }   // (three phases to the motor)
      for (const dz of [-0.03, 0.03]) { cyl(K, [1.05, 0.565, 0.1 + dz], [1.02, 0.565, 0.1 + dz], 0.024, ORA, { n: 6 }); hose([[1.02, 0.565, 0.1 + dz], [0.96, 0.56, 0.1 + dz], [0.92, 0.48, 0.06 + dz], [0.89, 0.34, 0.03 + dz]], 0.017, ORA, 6); }   // (from the battery under the floor)
      box(K, 1.42, 0.5, -0.3, 0.2, 0.08, 0.22, AL, [0.8, 0.81, 0.84]); fin(1.42, 0.58, -0.3, 0.16, 0.18, 6); cyl(K, [1.31, 0.54, -0.3], [1.28, 0.54, -0.3], 0.02, ORA, { n: 6 }); hose([[1.28, 0.54, -0.3], [1.2, 0.5, -0.24], [1.1, 0.5, -0.18]], 0.012, ORA, 5);   // (the charger and converter)
      cyl(K, [1.42, 0.36, 0.34], [1.42, 0.36, 0.5], 0.06, AL, { n: 10, capB: PLA }); hose([[1.42, 0.42, 0.42], [1.36, 0.5, 0.36], [1.3, 0.56, 0.3]], 0.011, ORA, 5);   // (the electric compressor)
      hose([[1.42, 0.4, 0.5], [1.5, 0.46, 0.5], [1.57, 0.5, 0.4]], 0.012, AL, 5); hose([[1.44, 0.34, 0.5], [1.52, 0.36, 0.46], [1.57, 0.4, 0.3]], 0.015, AL, 5);
      tank(1.43, 0.5, 0.52, 0.16, 0.13, 0.12, PLA, [0.3, 0.5, 0.85]); tank(1.2, 0.5, 0.5, 0.14, 0.12, 0.1, PLA, [0.85, 0.4, 0.6]); tank(1.44, 0.46, -0.55, 0.14, 0.13, 0.08, BLU, [0.3, 0.5, 0.85]);
      hose([[1.2, 0.5, 0.45], [1.2, 0.47, 0.34], [1.24, 0.5, 0.29]], 0.016, BLU, 5); hose([[1.43, 0.5, 0.46], [1.5, 0.44, 0.36], [1.555, 0.42, 0.2]], 0.016, BLU, 5); hose([[1.1, 0.55, -0.14], [1.3, 0.47, -0.3], [1.555, 0.36, -0.2]], 0.016, BLU, 5);
      box(K, 1.06, 0.44, -0.46, 0.16, 0.14, 0.14, AL, ST); for (let i = 0; i < 4; i++) cyl(K, [1.0 + i * 0.04, 0.58, -0.46], [1.0 + i * 0.04, 0.61, -0.46], 0.014, [0.2, 0.3, 0.6], { n: 6 });   // (the heat pump's valve block)
      hose([[1.0, 0.6, -0.46], [0.95, 0.6, -0.5], [0.9, 0.5, -0.5]], 0.012, AL, 5); hose([[1.12, 0.6, -0.46], [1.3, 0.56, -0.5], [1.56, 0.5, -0.45]], 0.012, AL, 5);
      const brace = [[1.15, 0.715, -0.57], [1.17, 0.74, -0.4], [1.17, 0.74, 0.4], [1.15, 0.715, 0.57]]; hose(brace, 0.016, AL, 6); for (const sd of [-1, 1]) box(K, 1.15, 0.7, sd * 0.57, 0.1, 0.012, 0.1, AL);
      box(K, 1.0, 0.56, 0.16, 0.1, 0.07, 0.14, PLA, PL2); for (let i = 0; i < 4; i++) box(K, 0.98 + (i % 2) * 0.04, 0.63, 0.12 + (i >> 1) * 0.07, 0.03, 0.012, 0.045, [RED, YEL, BLU, GRN][i]);   // (the fuse box, its relays)
      box(K, 1.585, ys + 0.03, 0, 0.11, 0.012, 0.9, PLA, PL2); for (const zc of [-0.4, -0.2, 0.2, 0.4]) bolt(1.585, ys + 0.042, zc, 0.011, PL2);   // (the cover over the radiator's top)
      for (const [zc, c] of [[-0.22, YEL], [0.3, YEL]]) { box(K, 1.59, ys + 0.043, zc, 0.07, 0.002, 0.09, c); box(K, 1.59, ys + 0.0455, zc, 0.03, 0.002, 0.03, BLK); }   // (the high-voltage warnings: no words)
      if (v >= 7) frame7();
      return;
    }
    if (v === 1) {
      // == 1: tidy, under covers (as on the model picture): a moulded cover over the engine, a boxed filter, ribbed reservoirs, a fuse box
      box(K, 1.24, 0.3, 0, 0.4, 0.27, 0.62, DK); box(K, 1.24, 0.57, 0, 0.44, 0.06, 0.6, PLA, [0.12, 0.12, 0.13]); box(K, 1.25, 0.63, 0, 0.36, 0.035, 0.48, [0.1, 0.1, 0.11], [0.15, 0.15, 0.165]);
      for (let i = -2; i <= 2; i++) box(K, 1.27, 0.665, i * 0.085, 0.24, 0.012, 0.035, [0.22, 0.22, 0.24]); box(K, 1.1, 0.665, 0, 0.05, 0.008, 0.3, [0.22, 0.22, 0.24]);
      box(K, 1.455, 0.585, 0, 0.012, 0.022, 0.42, AL); for (const [dx, dz] of [[-0.19, -0.27], [-0.19, 0.27], [0.19, -0.27], [0.19, 0.27]]) bolt(1.24 + dx, 0.63, dz, 0.012, ST);
      cyl(K, [1.1, 0.63, 0.25], [1.1, 0.645, 0.25], 0.034, YEL, { n: 8 }); cyl(K, [1.1, 0.645, 0.25], [1.1, 0.665, 0.25], 0.027, PLA, { n: 8 });
      K.deli('filter_zraka', () => { box(K, 1.0, 0.44, -0.44, 0.22, 0.15, 0.2, PLA, PLA); box(K, 1.0, 0.59, -0.44, 0.235, 0.04, 0.215, PL2, PL2); for (let i = -1; i <= 1; i++) box(K, 1.0, 0.63, -0.44 + i * 0.06, 0.19, 0.008, 0.025, PLA);
        for (const dx of [-0.07, 0.07]) for (const sd of [-1, 1]) box(K, 1.0 + dx, 0.565, -0.44 + sd * 0.11, 0.025, 0.045, 0.008, AL); });
      corr([1.1, 0.6, -0.4], [1.2, 0.62, -0.33], 0.035); box(K, 1.4, 0.6, -0.4, 0.3, 0.035, 0.07, PL2);   // (its duct to the engine, its snorkel to the nose)
      tank(1.43, 0.42, 0.5, 0.2, 0.15, 0.16, PLA); tank(1.44, 0.43, -0.53, 0.16, 0.13, 0.1, BLU);
      box(K, 1.36, 0.5, 0.4, 0.14, 0.07, 0.06, PLA, PL2);   // (the fuse box)
      hose([[1.36, 0.57, 0.5], [1.5, 0.62, 0.44], [1.59, 0.66, 0.4]], 0.01, RUB, 4);
      return;
    }
    if (LONG) {   // == longitudinal engines, each car its own: a modern V8, a carburettor V8 in a tube frame, a V12, a twin-turbo rotary, an inline five with a big turbo
      const kind = C.kind, GR = [0.5, 0.51, 0.54], IRON = [0.2, 0.2, 0.22], LT = [0.8, 0.81, 0.84], GRY = [0.45, 0.46, 0.5], WHT = [0.82, 0.82, 0.8], GOLD = [0.78, 0.62, 0.25], CER = [0.72, 0.72, 0.7], TUBE = C.tube || [0.62, 0.64, 0.68];
      const pul = (x, y, z, r, c) => { cyl(K, [x, y, z], [x + 0.02, y, z], r, c || DK, { n: 10 }); cyl(K, [x + 0.02, y, z], [x + 0.027, y, z], r * 0.4, ST, { n: 6 }); };
      const belt = (x, pts) => hose(pts.concat([pts[0]]).map((p) => [x, p[0], p[1]]), 0.006, RUB, 4);
      const ribsX = (x, y, z, l, w, n, c) => { for (let i = 0; i < n; i++) box(K, x - l / 2 + (i + 0.5) * l / n, y, z, l / n * 0.35, 0.006, w, c || DK); };
      const ribsZ = (x, y, z, l, w, n, c) => { for (let i = 0; i < n; i++) box(K, x, y, z - w / 2 + (i + 0.5) * w / n, l, 0.006, w / n * 0.35, c || DK); };
      const an = (pts, r, c1, c2) => { hose(pts, r, ST, 5); const e = (a, b, c) => cyl(K, a, a.map((q, k) => q + (b[k] - q) * 0.2), r * 1.6, c, { n: 6 }); e(pts[0], pts[1], c1 || BLU); e(pts[pts.length - 1], pts[pts.length - 2], c2 || RED); };   // (a braided line, its coloured fittings)
      const brace = (c) => { hose([[1.15, 0.705, -0.57], [1.2, 0.74, -0.42], [1.2, 0.74, 0.42], [1.15, 0.705, 0.57]], 0.017, c || AL, 6); for (const sd of [-1, 1]) { box(K, 1.15, 0.693, sd * 0.57, 0.1, 0.012, 0.07, c || AL); bolt(1.15, 0.715, sd * 0.57, 0.01, YEL); } };
      const airbox = (x, z, l, w) => K.deli('filter_zraka', () => { box(K, x, 0.42, z, l, 0.13, w, PLA, PL2); box(K, x, 0.55, z, l - 0.02, 0.02, w - 0.02, PL2, PLA); for (const dx of [-1, 1]) for (const dz of [-1, 1]) box(K, x + dx * (l / 2 - 0.01), 0.52, z + dz * (w / 2), 0.02, 0.035, 0.008, ST); });
      const turbo = (p, ax, r) => { const q = (t) => p.map((c, k) => c + ax[k] * t); cyl(K, q(0), q(0.09), r, RUST, { n: 10 }); cyl(K, q(0.09), q(0.13), r * 0.55, GR, { n: 8 }); cyl(K, q(0.13), q(0.2), r * 1.12, AL, { n: 10 }); cyl(K, q(0.2), q(0.25), r * 0.5, AL, { n: 8 }); };
      tank(1.47, 0.44, 0.53, 0.13, 0.14, 0.1, PLA, [0.3, 0.7, 0.45]); tank(1.47, 0.43, -0.56, 0.12, 0.13, 0.07, BLU, [0.3, 0.5, 0.85]);
      hose([[1.47, 0.59, 0.5], [1.54, 0.64, 0.42], [1.59, 0.67, 0.36]], 0.009, RUB, 4);
      cyl(K, [0.92, yc - 0.01, 0.2], [0.98, yc - 0.03, 0.2], 0.04, PL2, { n: 8 }); box(K, 0.93, yc - 0.06, 0.3, 0.06, 0.05, 0.08, AL);   // (the wiper's motor)
      for (const zc of [-0.26, 0.3]) cyl(K, [1.545, 0.56, zc], [1.52, 0.56, zc], 0.04, PLA, { n: 8, capB: DK });
      for (const zc of (RAILS ? [-0.52, 0.52] : [-0.4, 0.4])) cyl(K, [1.6, ys + 0.025, zc], [1.6, ys + 0.045, zc], 0.016, RUB, { n: 6 });
      box(K, 1.6, ys + 0.0255, 0.15, 0.05, 0.002, 0.08, YEL); box(K, 1.6, ys + 0.0255, -0.17, 0.05, 0.002, 0.1, WHT);
      if (kind === 'v8' || kind === 'v8carb' || kind === 'v12') {
        const n = kind === 'v12' ? 6 : 4, xa = kind === 'v12' ? 0.95 : 1.02, len = kind === 'v12' ? 0.54 : 0.44, xc = xa + len / 2, xf = xa + len, X = (i) => xa + (i + 0.5) * len / n, carb = kind === 'v8carb';
        const BLC = carb ? (C.block || [0.75, 0.3, 0.1]) : kind === 'v12' ? [0.6, 0.61, 0.64] : IRON;
        box(K, xc, 0.24, 0, len, 0.2, 0.3, BLC); box(K, xc, 0.15, 0, len * 0.8, 0.09, 0.24, carb ? AL : DK); ribsX(xc, 0.15, 0, len * 0.76, 0.25, 8, GRY);   // (the block, the sump)
        cyl(K, [xa - 0.07, 0.33, 0], [xa, 0.33, 0], 0.17, AL, { n: 12 }); box(K, xa - 0.2, 0.22, 0, 0.26, 0.2, 0.2, AL, GR);   // (the bell housing, the gearbox back into the tunnel)
        box(K, xf + 0.012, 0.22, 0, 0.025, 0.3, 0.32, AL, LT);   // (the timing cover)
        for (const sd of [-1, 1]) {
          box(K, xc, 0.42, sd * 0.165, len, 0.1, 0.19, carb ? BLC : GR);   // (a bank: the head, the cover leaning out)
          if (carb) { box(K, xc, 0.52, sd * 0.19, len - 0.02, 0.05, 0.12, CC, K.shade(CC, 1.2)); ribsX(xc, 0.57, sd * 0.19, len - 0.06, 0.1, 9, K.shade(CC, 0.6)); cyl(K, [X(0) + 0.02, 0.57, sd * 0.19], [X(0) + 0.02, 0.62, sd * 0.19], 0.022, LT, { n: 8, capB: DK });
            for (const x of [xa + 0.03, xf - 0.03]) for (const dz of [-0.045, 0.045]) bolt(x, 0.57, sd * 0.19 + dz, 0.008, ST);
            for (let i = 0; i < n; i++) { cyl(K, [X(i), 0.45, sd * 0.262], [X(i), 0.47, sd * 0.3], 0.011, WHT, { n: 5 });   // (the plugs, their leads back to the distributor, the long headers)
              hose([[X(i), 0.47, sd * 0.3], [X(i) - 0.02, 0.6, sd * 0.27], [X(i) - 0.04, 0.6, sd * 0.11], [xa + 0.07 + i * 0.012, 0.6, sd * 0.06], [xa + 0.05, 0.64, sd * 0.02]], 0.008, C.lead || RED, 4);
              hose([[X(i), 0.4, sd * 0.262], [X(i) - 0.01, 0.39, sd * 0.36], [X(i) - 0.07 - i * 0.02, 0.27 + i * 0.012, sd * (0.5 - i * 0.02)], [xa + 0.02, 0.2, sd * (0.4 - i * 0.02)]], 0.021, CER, 6); cyl(K, [X(i), 0.4, sd * 0.262], [X(i), 0.4, sd * 0.272], 0.03, ST, { n: 6 }); }
            cyl(K, [xa + 0.02, 0.2, sd * 0.37], [0.9, 0.18, sd * 0.36], 0.04, CER, { n: 8 });
          } else { const cw = 0.2; box(K, xc, 0.52, sd * 0.2, len - 0.02, 0.055, cw, CC, K.shade(CC, 1.15)); box(K, xc, 0.575, sd * 0.2, len - 0.08, 0.012, cw * 0.5, K.shade(CC, 0.8), K.shade(CC, 1.25));
            for (let i = 0; i < n; i++) { cyl(K, [X(i), 0.587, sd * 0.2], [X(i), 0.62, sd * 0.2], 0.02, PLA, { n: 6, capB: PL2 }); box(K, X(i), 0.61, sd * 0.225, 0.022, 0.014, 0.03, GRY); bolt(X(i) + 0.03, 0.587, sd * 0.2, 0.006, ST); }   // (a coil on each plug)
            hose([[xa + 0.02, 0.62, sd * 0.25], [xf - 0.03, 0.62, sd * 0.25]], 0.008, RUB, 4); for (const x of [xa + 0.02, xf - 0.02]) for (const dz of [-0.08, 0.08]) bolt(x, 0.575, sd * 0.2 + dz, 0.007, ST);
            for (let i = 0; i < n; i++) hose([[X(i), 0.42, sd * 0.262], [X(i) - 0.015, 0.38, sd * 0.32], [xc - 0.08, 0.3, sd * 0.33]], 0.019, RUST, 5);   // (the manifold, its shield)
            box(K, xc, 0.4, sd * 0.3, len * 0.84, 0.01, 0.07, AL, LT); box(K, xc, 0.33, sd * 0.335, len * 0.84, 0.08, 0.008, AL); for (const dx of [-0.3, 0, 0.3]) bolt(xc + dx * len, 0.41, sd * 0.3, 0.007, ST);
            cyl(K, [xc - 0.08, 0.3, sd * 0.33], [0.9, 0.2, sd * 0.3], 0.032, RUST, { n: 7 }); }
          box(K, xc, 0.28, sd * 0.19, 0.08, 0.04, 0.1, AL); cyl(K, [xc, 0.27, sd * 0.24], [xc, 0.37, sd * 0.4], 0.03, RUB, { n: 8 });   // (the engine's mount down to the leg)
        }
        pul(xf + 0.03, 0.27, 0, 0.078); pul(xf + 0.03, 0.44, 0, 0.05, AL); pul(xf + 0.03, 0.36, 0.22, 0.04); pul(xf + 0.03, 0.4, -0.22, 0.045); pul(xf + 0.03, 0.52, 0.12, 0.03, ST);
        cyl(K, [xf - 0.08, 0.36, 0.22], [xf + 0.03, 0.36, 0.22], 0.055, AL, { n: 10 }); for (let i = 0; i < 3; i++) cyl(K, [xf - 0.07 + i * 0.03, 0.36, 0.22], [xf - 0.06 + i * 0.03, 0.36, 0.22], 0.058, DK, { n: 10 });   // (the alternator; the steering's pump opposite)
        cyl(K, [xf - 0.06, 0.4, -0.22], [xf + 0.03, 0.4, -0.22], 0.045, GR, { n: 8 }); cyl(K, [xf - 0.03, 0.44, -0.22], [xf - 0.03, 0.5, -0.24], 0.022, PLA, { n: 6, capB: YEL });
        belt(xf + 0.04, [[0.195, 0.02], [0.33, 0.255], [0.56, 0.12], [0.49, 0.01], [0.445, -0.22], [0.36, -0.26], [0.2, -0.04]]);
        cyl(K, [xf - 0.01, 0.42, 0.06], [xf + 0.02, 0.54, 0.16], 0.022, AL, { n: 6 });   // (the thermostat's neck to the top hose)
        if (carb) {   // -- the stock car: a single-plane manifold, a four-barrel carburettor under a round open filter, a distributor, braided lines, a dry sump's tank, the tube frame
          box(K, xc, 0.5, 0, len * 0.62, 0.05, 0.19, AL, LT); for (let i = 0; i < n; i++) for (const sd of [-1, 1]) hose([[xc + (i - 1.5) * 0.04, 0.53, sd * 0.06], [X(i), 0.5, sd * 0.12]], 0.024, AL, 6);
          box(K, xc, 0.55, 0, 0.13, 0.07, 0.13, GOLD, K.shade(GOLD, 1.15)); for (const sd of [-1, 1]) { box(K, xc + sd * 0.085, 0.57, 0, 0.04, 0.04, 0.09, GOLD); cyl(K, [xc - 0.03, 0.58, sd * 0.065], [xc - 0.03, 0.58, sd * 0.09], 0.012, ST, { n: 5 }); }
          K.deli('filter_zraka', () => { cyl(K, [xc, 0.62, 0], [xc, 0.632, 0], 0.19, LT, { n: 18 }); cyl(K, [xc, 0.632, 0], [xc, 0.685, 0], 0.18, [0.86, 0.8, 0.6], { n: 18 }); for (let i = 0; i < 18; i++) { const a = i * 0.349; box(K, xc + Math.cos(a) * 0.181, 0.634, Math.sin(a) * 0.181, 0.008, 0.05, 0.008, [0.6, 0.55, 0.4]); }
            cyl(K, [xc, 0.685, 0], [xc, 0.7, 0], 0.195, LT, { n: 18, capB: [0.88, 0.89, 0.92] }); cyl(K, [xc, 0.7, 0], [xc, 0.725, 0], 0.012, ST, { n: 6 }); box(K, xc, 0.722, 0, 0.012, 0.006, 0.05, ST); });
          cyl(K, [xa + 0.05, 0.5, 0], [xa + 0.05, 0.6, 0], 0.04, AL, { n: 8 }); cyl(K, [xa + 0.05, 0.6, 0], [xa + 0.05, 0.645, 0], 0.048, [0.6, 0.12, 0.1], { n: 10 });   // (the distributor)
          box(K, 0.895, 0.56, 0.06, 0.03, 0.1, 0.2, [0.75, 0.12, 0.1], [0.75, 0.12, 0.1]); for (let i = -3; i <= 3; i++) box(K, 0.912, 0.565, 0.06 + i * 0.026, 0.006, 0.09, 0.008, [0.5, 0.08, 0.06]); hose([[0.91, 0.6, 0.02], [0.96, 0.66, 0.0], [xa + 0.05, 0.65, 0]], 0.008, BLK, 4);   // (the ignition's box on the bulkhead, the coil's lead)
          cyl(K, [0.9, 0.52, -0.02], [0.96, 0.52, -0.02], 0.03, BLK, { n: 8, capB: GOLD });
          cyl(K, [1.0, 0.28, -0.5], [1.0, 0.64, -0.5], 0.075, AL, { n: 12, capB: LT }); cyl(K, [1.0, 0.64, -0.5], [1.0, 0.67, -0.5], 0.035, BLK, { n: 8 }); for (const y of [0.34, 0.58]) cyl(K, [1.0, y, -0.5], [1.0, y + 0.012, -0.5], 0.08, ST, { n: 12 });   // (the dry sump's tank, its lines; the pump on the belt)
          an([[1.0, 0.6, -0.43], [1.1, 0.5, -0.36], [xf - 0.02, 0.3, -0.3]], 0.015); an([[1.0, 0.32, -0.43], [1.2, 0.22, -0.36], [xf - 0.04, 0.2, -0.26]], 0.015, RED, BLU);
          box(K, xf - 0.05, 0.2, -0.28, 0.12, 0.08, 0.07, AL, LT);
          an([[0.89, 0.4, 0.5], [1.05, 0.4, 0.44], [1.2, 0.5, 0.3], [xc + 0.09, 0.59, 0.06]], 0.011);   // (the fuel's line with its filter, the throttle's rod and springs)
          cyl(K, [1.08, 0.41, 0.42], [1.16, 0.47, 0.34], 0.022, [0.2, 0.3, 0.75], { n: 8 });
          hose([[0.89, 0.66, -0.12], [xc - 0.03, 0.6, -0.085]], 0.005, ST, 4); hose([[xc - 0.03, 0.6, -0.09], [xa + 0.12, 0.56, -0.12]], 0.003, LT, 4);
          cyl(K, [xf + 0.01, 0.3, 0.33], [xf + 0.09, 0.3, 0.33], 0.045, WHT, { n: 8, capB: DK });   // (the oil's filter out front)
          for (const sd of [-1, 1]) {   // (the frame's tubes: the top rails, the diagonals down to the legs, the uprights, the brace back to the bulkhead)
            const A = [0.885, 0.75, sd * 0.52], B2 = [1.33, 0.7, sd * 0.5], Cc = [1.63, 0.6, sd * 0.45], D2 = [1.33, 0.37, sd * 0.42];
            hose([A, B2, Cc], 0.021, TUBE, 8); cyl(K, B2, D2, 0.019, TUBE, { n: 8 }); cyl(K, A, D2, 0.017, TUBE, { n: 8 }); cyl(K, D2, [1.63, 0.34, sd * 0.42], 0.017, TUBE, { n: 8 }); cyl(K, Cc, [1.63, 0.3, sd * 0.42], 0.019, TUBE, { n: 8 });
            cyl(K, [0.885, 0.76, sd * 0.06], B2, 0.016, TUBE, { n: 8 }); for (const p of [A, B2, Cc, D2]) cyl(K, [p[0], p[1] - 0.004, p[2]], [p[0], p[1] + 0.004, p[2]], 0.03, K.shade(TUBE, 0.8), { n: 8 });
            box(K, 1.24, 0.71, sd * 0.51, 0.06, 0.004, 0.05, K.shade(TUBE, 0.8)); bolt(1.24, 0.714, sd * 0.51, 0.008, ST);
          }
          cyl(K, [1.63, 0.6, -0.45], [1.63, 0.6, 0.45], 0.019, TUBE, { n: 8 }); cyl(K, [1.33, 0.7, -0.5], [1.63, 0.6, 0.0], 0.014, TUBE, { n: 6 }); cyl(K, [1.33, 0.7, 0.5], [1.63, 0.6, 0.0], 0.014, TUBE, { n: 6 });
        } else if (kind === 'v8') {   // -- the saloon's V8: a ribbed inlet in the valley, a throttle forward, a duct to the filter's box, a brace, the fuse box, looms
          box(K, xc - 0.02, 0.5, 0, len * 0.8, 0.1, 0.19, AL, LT); ribsZ(xc - 0.02, 0.6, 0, len * 0.7, 0.16, 7, GR); box(K, xc - 0.02, 0.606, 0, 0.1, 0.004, 0.08, PLA);
          for (let i = 0; i < n; i++) for (const sd of [-1, 1]) { hose([[X(i) - 0.02, 0.56, sd * 0.07], [X(i), 0.55, sd * 0.11]], 0.026, AL, 6); cyl(K, [X(i), 0.555, sd * 0.1], [X(i), 0.585, sd * 0.1], 0.011, GRY, { n: 5 }); }
          for (const sd of [-1, 1]) cyl(K, [xa + 0.03, 0.575, sd * 0.1], [xf - 0.06, 0.575, sd * 0.1], 0.009, ST, { n: 5 });   // (the fuel's rails)
          cyl(K, [xf - 0.07, 0.56, 0], [xf + 0.0, 0.57, 0], 0.048, ST, { n: 10 }); box(K, xf - 0.03, 0.6, 0.03, 0.04, 0.03, 0.05, PLA);
          corr([xf, 0.57, 0], [xf + 0.03, 0.6, -0.2], 0.04); corr([xf + 0.03, 0.6, -0.2], [1.4, 0.56, -0.42], 0.04); airbox(1.34, -0.47, 0.2, 0.14); box(K, 1.38, 0.585, -0.3, 0.03, 0.02, 0.04, GRY);
          hose([[1.44, 0.48, -0.5], [1.56, 0.5, -0.46]], 0.035, PLA, 6);
          brace(AL); box(K, 1.36, 0.5, 0.5, 0.16, 0.08, 0.12, PLA, PL2); box(K, 1.36, 0.582, 0.5, 0.05, 0.002, 0.07, WHT);   // (the fuse box)
          hose([[0.9, 0.6, 0.2], [0.98, 0.64, 0.12], [xa + 0.03, 0.63, 0.12], [xa + 0.03, 0.63, -0.25]], 0.012, RUB, 4); hose([[1.36, 0.58, 0.44], [1.3, 0.6, 0.3], [xf - 0.03, 0.62, 0.25]], 0.01, RUB, 4);
          cyl(K, [xf - 0.1, 0.575, -0.27], [xf - 0.1, 0.6, -0.27], 0.028, PLA, { n: 8, capB: YEL }); cyl(K, [xa + 0.1, 0.4, 0.3], [xa + 0.06, 0.64, 0.34], 0.005, ST, { n: 4 }); cyl(K, [xa + 0.06, 0.64, 0.34], [xa + 0.057, 0.66, 0.343], 0.014, YEL, { n: 6 });
          cyl(K, [1.5, 0.34, 0.36], [1.42, 0.34, 0.36], 0.05, GR, { n: 8 }); for (const d of [0, 0.028]) hose([[1.46, 0.38, 0.38], [1.5, 0.6, 0.6 - d], [1.3, 0.68 - d, 0.63 - d], [0.95, 0.7 - d, 0.6 - d], [0.89, 0.66 - d, 0.5]], 0.009, AL, 4);
          box(K, 0.9, 0.56, 0.06, 0.03, 0.11, 0.18, AL, AL); for (let i = -2; i <= 2; i++) box(K, 0.917, 0.57, 0.06 + i * 0.03, 0.006, 0.09, 0.008, GRY);
        } else {   // -- the V12: two long plenums, six runners a side, two throttles and two filters, the firing order's cover between
          for (const sd of [-1, 1]) { box(K, xc - 0.02, 0.54, sd * 0.065, len * 0.9, 0.075, 0.085, CR2, K.shade(CR2, 1.3)); ribsX(xc - 0.02, 0.615, sd * 0.065, len * 0.8, 0.06, 12, K.shade(CR2, 0.6));
            for (let i = 0; i < n; i++) { hose([[X(i), 0.58, sd * 0.1], [X(i), 0.585, sd * 0.135], [X(i), 0.53, sd * 0.15]], 0.023, AL, 6); cyl(K, [X(i) + 0.03, 0.54, sd * 0.13], [X(i) + 0.03, 0.575, sd * 0.13], 0.009, GRY, { n: 5 }); }
            cyl(K, [xf - 0.05, 0.58, sd * 0.065], [xf + 0.02, 0.58, sd * 0.065], 0.04, ST, { n: 10 }); corr([xf + 0.02, 0.58, sd * 0.065], [xf + 0.05, 0.6, sd * 0.3], 0.036); corr([xf + 0.05, 0.6, sd * 0.3], [1.5, 0.55, sd * 0.42], 0.036);
            cyl(K, [xa + 0.03, 0.535, sd * 0.125], [xf - 0.06, 0.535, sd * 0.125], 0.008, ST, { n: 5 }); }
          K.deli('filter_zraka', () => { for (const sd of [-1, 1]) { cyl(K, [1.5, 0.5, sd * 0.44], [1.5, 0.62, sd * 0.44], 0.07, PLA, { n: 10, capB: PL2 }); for (let i = 0; i < 4; i++) cyl(K, [1.5, 0.52 + i * 0.025, sd * 0.44], [1.5, 0.53 + i * 0.025, sd * 0.44], 0.074, PL2, { n: 10 }); } });
          box(K, xc - 0.02, 0.6, 0, len * 0.5, 0.012, 0.04, AL, LT); for (let i = 0; i < 6; i++) bolt(xc - 0.02 + (i - 2.5) * 0.045, 0.612, 0, 0.006, ST);
          brace(P); cyl(K, [xf - 0.12, 0.575, 0.27], [xf - 0.12, 0.6, 0.27], 0.028, PLA, { n: 8, capB: YEL });
          hose([[0.9, 0.6, 0.2], [0.96, 0.64, 0.0], [xa + 0.02, 0.6, 0]], 0.012, RUB, 4); for (const sd of [-1, 1]) hose([[xa + 0.02, 0.6, 0], [xa + 0.02, 0.63, sd * 0.25], [xf - 0.03, 0.63, sd * 0.255]], 0.008, RUB, 4);
          box(K, 1.36, 0.5, 0.54, 0.14, 0.07, 0.09, PLA, PL2); box(K, 0.9, 0.56, 0.06, 0.03, 0.11, 0.18, AL, AL);
          cyl(K, [1.5, 0.34, 0.3], [1.42, 0.34, 0.3], 0.05, GR, { n: 8 }); for (const d of [0, 0.028]) hose([[1.46, 0.38, 0.33], [1.5, 0.6, 0.6 - d], [1.3, 0.68 - d, 0.63 - d], [0.95, 0.7 - d, 0.6 - d], [0.89, 0.66 - d, 0.5]], 0.009, AL, 4);
        }
      } else if (kind === 'rotary') {   // -- the rotary: a small sandwich of housings low behind the axle, the inlet arching over, two turbos one behind the other, the cooler and the filter out front
        const xa = 0.95, yq = 0.38; let x = xa; for (const [l, r, c] of [[0.035, 0.15, IRON], [0.075, 0.14, AL], [0.045, 0.15, IRON], [0.075, 0.14, AL], [0.035, 0.15, IRON], [0.03, 0.13, AL]]) { cyl(K, [x, yq, 0], [x + l, yq, 0], r, c, { n: 12 }); box(K, x + l / 2, yq - 0.19, 0, l, 0.38, r * 1.3, c); x += l; }
        const xf = x; for (let i = 0; i < 8; i++) { const a = i * 0.785 + 0.39; cyl(K, [xa - 0.006, yq + Math.cos(a) * 0.13, Math.sin(a) * 0.115], [xf - 0.03, yq + Math.cos(a) * 0.13, Math.sin(a) * 0.115], 0.008, ST, { n: 5 }); }   // (the long bolts through it)
        cyl(K, [xa - 0.08, yq - 0.02, 0], [xa, yq - 0.02, 0], 0.17, AL, { n: 12 }); box(K, xa - 0.2, 0.22, 0, 0.24, 0.2, 0.2, AL, GR); box(K, xa + 0.15, 0.14, 0, 0.26, 0.06, 0.2, DK); ribsX(xa + 0.15, 0.135, 0, 0.24, 0.21, 6, GRY);
        pul(xf + 0.005, yq - 0.04, 0, 0.07); pul(xf + 0.005, yq + 0.12, 0.03, 0.045, AL); pul(xf + 0.005, yq + 0.2, -0.1, 0.035); cyl(K, [xf - 0.1, yq + 0.2, -0.1], [xf + 0.005, yq + 0.2, -0.1], 0.05, AL, { n: 10 }); for (let i = 0; i < 3; i++) cyl(K, [xf - 0.09 + i * 0.03, yq + 0.2, -0.1], [xf - 0.08 + i * 0.03, yq + 0.2, -0.1], 0.053, DK, { n: 10 });
        belt(xf + 0.016, [[yq - 0.11, 0.0], [yq + 0.1, 0.075], [yq + 0.235, -0.1], [yq + 0.2, -0.135], [yq - 0.04, -0.07]]);
        box(K, xf - 0.05, yq + 0.1, 0.04, 0.08, 0.08, 0.1, AL, LT); cyl(K, [xf - 0.03, yq + 0.18, 0.05], [xf + 0.06, yq + 0.22, 0.12], 0.022, AL, { n: 6 }); hose([[xf + 0.06, yq + 0.22, 0.12], [1.4, 0.62, 0.2], [1.585, 0.64, 0.26]], 0.022, RUB, 6);   // (the water pump's housing, the top hose's long run)
        hose([[xf, 0.26, -0.1], [1.4, 0.3, -0.24], [1.585, 0.32, -0.3]], 0.022, RUB, 6);
        for (const [i, xr] of [[0, xa + 0.07], [1, xa + 0.19]]) { for (const dy of [0.04, -0.04]) { cyl(K, [xr, yq + dy, -0.13], [xr, yq + dy + 0.01, -0.17], 0.011, WHT, { n: 5 }); hose([[xr, yq + dy + 0.01, -0.17], [xr - 0.01, yq + 0.16, -0.24], [xa + 0.03 + i * 0.03 + (dy > 0 ? 0.015 : 0), 0.6, -0.3]], 0.007, dy > 0 ? RED : BLK, 4); } }   // (two plugs a rotor on the left, their leads up to the coils)
        box(K, xa + 0.05, 0.56, -0.32, 0.12, 0.05, 0.08, PLA, PL2); for (let i = 0; i < 3; i++) box(K, xa + 0.01 + i * 0.04, 0.61, -0.32, 0.03, 0.03, 0.05, [0.3, 0.3, 0.33]);
        for (let i = 0; i < 4; i++) { const xr = xa + 0.05 + i * 0.055; hose([[xr, yq + 0.04, 0.13], [xr, yq + 0.17, 0.15], [xr, 0.62, 0.06], [xr, 0.62, -0.06]], 0.021, AL, 6); }   // (the inlet's runners over the top to the plenum, the throttle forward)
        box(K, xa + 0.13, 0.58, -0.1, 0.26, 0.07, 0.1, AL, LT); ribsX(xa + 0.13, 0.65, -0.1, 0.22, 0.08, 6, GR); cyl(K, [xa + 0.26, 0.615, -0.1], [xa + 0.34, 0.615, -0.1], 0.04, ST, { n: 10 });
        box(K, xa + 0.14, yq - 0.08, 0.16, 0.2, 0.09, 0.06, RUST); turbo([xa + 0.02, yq - 0.02, 0.25], [1, 0, 0], 0.062); turbo([xa + 0.27, yq - 0.02, 0.25], [1, 0, 0], 0.062);   // (the manifold, the two turbos in a row, their shield)
        box(K, xa + 0.2, yq + 0.06, 0.26, 0.3, 0.008, 0.13, AL, LT); for (const dx of [-0.12, 0, 0.12]) bolt(xa + 0.2 + dx, yq + 0.068, 0.26, 0.007, ST); box(K, xa + 0.2, yq - 0.02, 0.33, 0.3, 0.085, 0.006, AL);
        hose([[xa + 0.02, yq - 0.05, 0.25], [0.92, 0.24, 0.2], [0.89, 0.2, 0.1]], 0.036, RUST, 7);
        box(K, 1.46, 0.5, -0.26, 0.16, 0.06, 0.3, [0.62, 0.63, 0.66]); ribsZ(1.46, 0.56, -0.26, 0.14, 0.24, 12, DK); for (const sd of [-1, 1]) box(K, 1.46, 0.495, -0.26 + sd * 0.165, 0.16, 0.07, 0.035, AL, LT);   // (the cooler flat out front on the left, the filter's box on the right, the pipes back)
        airbox(1.45, 0.22, 0.17, 0.26); corr([1.37, 0.49, 0.26], [xa + 0.5, yq + 0.02, 0.27], 0.034); cyl(K, [xa + 0.22, yq, 0.25], [xa + 0.25, yq, 0.25], 0.03, AL, { n: 6 });
        const p1 = [[xa + 0.2, yq + 0.05, 0.27], [xa + 0.32, 0.6, 0.3], [1.4, 0.62, 0.06], [1.46, 0.56, -0.07]], p2 = [[1.46, 0.53, -0.44], [1.36, 0.6, -0.42], [1.32, 0.63, -0.16], [xa + 0.34, 0.615, -0.1]]; hose(p1, 0.027, AL, 7); hose(p2, 0.027, AL, 7);
        for (const pp of [p1, p2]) for (const i of [0, 2]) { const a = pp[i], b = pp[i + 1], q = (t) => a.map((c, k) => c + (b[k] - c) * t); cyl(K, q(0.35), q(0.65), 0.032, BLU, { n: 7 }); cyl(K, q(0.33), q(0.37), 0.035, ST, { n: 7 }); cyl(K, q(0.63), q(0.67), 0.035, ST, { n: 7 }); }
        cyl(K, [xf - 0.02, yq + 0.1, -0.13], [xf + 0.0, 0.66, -0.2], 0.02, PLA, { n: 7 }); cyl(K, [xf, 0.66, -0.2], [xf + 0.002, 0.685, -0.203], 0.03, PLA, { n: 8, capB: YEL });   // (the oil's tall filler, the filter upright at the back, the dipstick)
        cyl(K, [xa + 0.03, 0.5, 0.02], [xa + 0.03, 0.6, 0.02], 0.038, [0.2, 0.3, 0.7], { n: 8 }); cyl(K, [xa + 0.12, 0.5, -0.2], [xa + 0.14, 0.64, -0.22], 0.005, ST, { n: 4 }); cyl(K, [xa + 0.14, 0.64, -0.22], [xa + 0.142, 0.66, -0.222], 0.013, YEL, { n: 6 });
        for (let i = 0; i < 5; i++) hose([[xa + 0.04 + i * 0.045, 0.655, -0.1], [xa + 0.06 + i * 0.04, 0.66, 0.1 + i * 0.03], [xa + 0.12 + i * 0.05, yq + 0.1, 0.2]], 0.005, i % 2 ? BLK : [0.5, 0.2, 0.2], 4);   // (the nest of vacuum hoses)
        box(K, 1.02, yq + 0.2, -0.46, 0.06, 0.05, 0.05, AL); for (let i = 0; i < 3; i++) cyl(K, [1.0 + i * 0.02, yq + 0.25, -0.46], [1.0 + i * 0.02, yq + 0.265, -0.46], 0.008, [0.2, 0.2, 0.22], { n: 5 });
        brace(P); box(K, 0.9, 0.56, 0.06, 0.03, 0.11, 0.18, AL, AL); box(K, 1.36, 0.5, 0.54, 0.14, 0.07, 0.09, PLA, PL2);
        for (const sd of [-1, 1]) { box(K, xa + 0.15, 0.3, sd * 0.2, 0.08, 0.04, 0.12, AL); cyl(K, [xa + 0.15, 0.3, sd * 0.27], [xa + 0.15, 0.37, sd * 0.4], 0.03, RUB, { n: 8 }); }
      } else if (kind === 'i5') {   // -- the rally five: a long inline engine far forward, a red cover, the inlet on the left, a big turbo with its wastegate on the right, the cooler across the nose, the mechanical injection's head, a tube brace
        const n = 5, xa = 1.05, len = 0.44, xc = xa + len / 2, xf = xa + len, X = (i) => xa + (i + 0.5) * len / n, z0 = 0.03;
        box(K, xc, 0.24, z0, len, 0.22, 0.2, IRON); box(K, xc, 0.15, z0, len * 0.85, 0.09, 0.2, AL); ribsX(xc, 0.145, z0, len * 0.8, 0.21, 8, GRY);
        cyl(K, [xa - 0.07, 0.33, z0], [xa, 0.33, z0], 0.16, AL, { n: 12 }); box(K, xa - 0.16, 0.22, z0, 0.18, 0.2, 0.2, AL, GR);
        box(K, xc, 0.46, z0, len, 0.09, 0.2, GR); box(K, xc, 0.55, z0, len - 0.02, 0.05, 0.16, CC, K.shade(CC, 1.2)); box(K, xc, 0.6, z0, len - 0.1, 0.012, 0.07, K.shade(CC, 0.8), K.shade(CC, 1.25));
        for (const xx of [xa + 0.03, xc, xf - 0.03]) for (const dz of [-0.065, 0.065]) bolt(xx, 0.6, z0 + dz, 0.008, ST); cyl(K, [xf - 0.07, 0.612, z0], [xf - 0.07, 0.64, z0], 0.028, PLA, { n: 8, capB: YEL });
        cyl(K, [xa - 0.05, 0.5, z0], [xa, 0.5, z0], 0.05, PLA, { n: 8 }); cyl(K, [xa - 0.08, 0.5, z0], [xa - 0.05, 0.5, z0], 0.04, [0.5, 0.22, 0.12], { n: 8 });   // (the distributor on the head's back, five leads)
        for (let i = 0; i < n; i++) { cyl(K, [X(i), 0.6, z0 + 0.04], [X(i), 0.63, z0 + 0.04], 0.013, PLA, { n: 5 }); hose([[X(i), 0.63, z0 + 0.04], [X(i) - 0.03, 0.65, z0 + 0.1], [xa + 0.0, 0.64, z0 + 0.1 - i * 0.012], [xa - 0.06, 0.54, z0 + 0.02]], 0.007, C.lead || YEL, 4); }
        cyl(K, [xa + 0.02, 0.52, -0.24], [xf - 0.02, 0.52, -0.24], 0.055, AL, { n: 10, capA: LT }); for (let i = 0; i < n; i++) hose([[X(i), 0.54, -0.2], [X(i), 0.56, -0.13], [X(i), 0.5, -0.08]], 0.024, AL, 6);   // (the plenum and its runners, the throttle forward)
        cyl(K, [xf - 0.02, 0.52, -0.24], [xf + 0.05, 0.52, -0.24], 0.04, ST, { n: 10 });
        box(K, 1.0, 0.5, -0.47, 0.1, 0.07, 0.1, AL, LT); cyl(K, [1.0, 0.57, -0.47], [1.0, 0.6, -0.47], 0.04, DK, { n: 10 }); for (let i = 0; i < n; i++) hose([[1.0 + Math.cos(i * 1.257) * 0.03, 0.6, -0.47 + Math.sin(i * 1.257) * 0.03], [1.04 + i * 0.03, 0.66, -0.4], [X(i), 0.6, -0.16], [X(i), 0.555, -0.12]], 0.004, ST, 4);   // (the injection's metering head, five steel lines)
        K.deli('filter_zraka', () => { cyl(K, [1.08, 0.36, -0.47], [1.2, 0.36, -0.47], 0.08, [0.75, 0.2, 0.15], { n: 12, capB: ST }); for (let i = 0; i < 5; i++) cyl(K, [1.09 + i * 0.022, 0.36, -0.47], [1.097 + i * 0.022, 0.36, -0.47], 0.083, [0.5, 0.12, 0.1], { n: 12 }); }); corr([1.05, 0.4, -0.47], [1.0, 0.48, -0.47], 0.03);
        for (let i = 0; i < n; i++) hose([[X(i), 0.46, z0 + 0.1], [X(i) + 0.01, 0.44, z0 + 0.17], [X(i) + 0.03 + (4 - i) * 0.015, 0.42, 0.24]], 0.02, RUST, 6); cyl(K, [xa + 0.06, 0.42, 0.24], [xf, 0.42, 0.25], 0.03, RUST, { n: 8 });   // (the exhaust's runners into the collector, the big turbo, the wastegate and its own pipe)
        turbo([xf - 0.04, 0.47, 0.3], [1, 0, 0], 0.085); cyl(K, [xc, 0.44, 0.27], [xc, 0.56, 0.34], 0.04, [0.7, 0.71, 0.74], { n: 10, capB: [0.75, 0.2, 0.15] }); hose([[xc, 0.5, 0.33], [xc - 0.1, 0.4, 0.38], [0.92, 0.24, 0.34]], 0.022, RUST, 6);
        hose([[xf - 0.0, 0.45, 0.3], [xf - 0.06, 0.3, 0.36], [0.92, 0.2, 0.26]], 0.04, RUST, 7); box(K, xc + 0.04, 0.53, 0.2, 0.3, 0.008, 0.06, AL, LT);
        box(K, 1.535, 0.5, -0.1, 0.045, 0.19, 0.62, [0.62, 0.63, 0.66]); for (let i = 0; i < 9; i++) box(K, 1.51, 0.51 + i * 0.02, -0.1, 0.006, 0.006, 0.6, DK); for (const sd of [-1, 1]) box(K, 1.535, 0.495, -0.1 + sd * 0.33, 0.05, 0.2, 0.045, AL, LT);   // (the cooler upright across the nose, its pipes)
        const p1 = [[xf + 0.14, 0.47, 0.3], [1.57, 0.5, 0.36], [1.56, 0.62, 0.3], [1.535, 0.64, 0.24]], p2 = [[1.535, 0.56, -0.44], [1.47, 0.56, -0.46], [1.44, 0.53, -0.3], [xf + 0.05, 0.52, -0.24]]; hose(p1, 0.03, AL, 7); hose(p2, 0.03, AL, 7);
        for (const pp of [p1, p2]) { const a = pp[1], b = pp[2], q = (t) => a.map((c, k) => c + (b[k] - c) * t); cyl(K, q(0.2), q(0.8), 0.035, [0.75, 0.2, 0.15], { n: 7 }); cyl(K, q(0.18), q(0.24), 0.038, ST, { n: 7 }); cyl(K, q(0.76), q(0.82), 0.038, ST, { n: 7 }); }
        pul(xf + 0.01, 0.27, z0, 0.07); pul(xf + 0.01, 0.5, z0, 0.055, AL); pul(xf + 0.01, 0.38, z0 - 0.13, 0.04); cyl(K, [xf - 0.08, 0.38, z0 - 0.13], [xf + 0.01, 0.38, z0 - 0.13], 0.05, AL, { n: 10 }); belt(xf + 0.022, [[0.2, z0 + 0.03], [0.5, z0 + 0.055], [0.555, z0], [0.4, z0 - 0.165], [0.25, z0 - 0.07]]);
        box(K, xf + 0.012, 0.3, z0, 0.02, 0.28, 0.18, PLA, PL2);
        box(K, 1.5, 0.3, 0.46, 0.03, 0.12, 0.16, [0.62, 0.63, 0.66]); for (let i = 0; i < 5; i++) box(K, 1.482, 0.31 + i * 0.022, 0.46, 0.006, 0.006, 0.15, DK); an([[1.5, 0.4, 0.4], [1.4, 0.36, 0.36], [xc + 0.1, 0.26, 0.14]], 0.012); an([[1.5, 0.32, 0.4], [1.38, 0.28, 0.34], [xc, 0.22, 0.14]], 0.012, RED, BLU);   // (the oil's cooler and lines)
        const BR = C.tube || WHT; for (const sd of [-1, 1]) { cyl(K, [1.15, 0.705, sd * 0.57], [0.89, 0.76, sd * 0.1], 0.016, BR, { n: 8 }); box(K, 1.15, 0.693, sd * 0.57, 0.1, 0.012, 0.07, BR); bolt(1.15, 0.715, sd * 0.57, 0.01, YEL); } cyl(K, [1.15, 0.71, -0.5], [1.15, 0.71, 0.5], 0.016, BR, { n: 8 }); box(K, 0.89, 0.75, 0, 0.012, 0.03, 0.3, BR);
        cyl(K, [1.0, 0.44, 0.52], [1.0, 0.6, 0.52], 0.045, AL, { n: 10, capB: LT }); hose([[1.0, 0.6, 0.52], [1.06, 0.66, 0.3], [xa + 0.06, 0.62, z0 + 0.06]], 0.011, RUB, 5);   // (the breather's catch tank)
        box(K, 0.9, 0.56, 0.24, 0.03, 0.1, 0.16, AL, AL); for (let i = 0; i < 4; i++) box(K, 0.92, 0.6, 0.18 + i * 0.04, 0.02, 0.03, 0.028, [[0.2, 0.2, 0.22], YEL, [0.3, 0.5, 0.3], RED][i]);
        for (const sd of [-1, 1]) { box(K, xc, 0.3, z0 + sd * 0.14, 0.08, 0.04, 0.1, AL); cyl(K, [xc, 0.3, z0 + sd * 0.2], [xc, 0.37, sd * 0.4], 0.03, RUB, { n: 8 }); }
      }
      if (v >= 7 && kind !== 'v8carb') frame7();
      return;
    }
    // == 2, 3: the mechanics in sight: block, head, a cast cam cover with its leads, inlet, exhaust and turbo, the intercooler under the scoop
    box(K, 1.24, 0.3, 0, 0.4, 0.22, 0.62, DK); box(K, 1.24, 0.52, 0, 0.34, 0.07, 0.6, [0.5, 0.51, 0.54]); box(K, 1.24, 0.59, 0, 0.22, 0.045, 0.56, CC, CC); box(K, 1.24, 0.635, 0, 0.14, 0.018, 0.5, CC, C.cover ? K.shade(CC, 1.25) : [0.8, 0.81, 0.84]);
    for (let i = -3; i <= 3; i++) box(K, 1.24, 0.653, i * 0.07, 0.12, 0.006, 0.012, DK); for (const dz of [-0.25, 0, 0.25]) for (const dx of [-0.095, 0.095]) bolt(1.24 + dx, 0.635, dz, 0.009, ST);
    cyl(K, [1.2, 0.653, -0.22], [1.2, 0.675, -0.22], 0.028, PLA, { n: 8, capB: YEL });
    cyl(K, [1.2, 0.56, 0.3], [1.2, 0.56, 0.37], 0.05, PLA, { n: 8 }); cyl(K, [1.2, 0.56, 0.37], [1.2, 0.56, 0.4], 0.04, [0.5, 0.22, 0.12], { n: 8 });   // (the distributor on the head's end)
    for (let i = 0; i < 4; i++) { const zc = (i - 1.5) * 0.14; cyl(K, [1.32, 0.635, zc], [1.32, 0.665, zc], 0.014, PLA, { n: 5 }); hose([[1.32, 0.66, zc], [1.36, 0.67, zc + 0.03], [1.36, 0.63, 0.3], [1.22, 0.6, 0.39]], 0.007, BLU, 4); }
    cyl(K, [1.03, 0.6, -0.27], [1.03, 0.6, 0.27], 0.048, AL, { n: 8 }); for (let i = 0; i < 4; i++) { const zc = (i - 1.5) * 0.14; hose([[1.03, 0.61, zc], [1.07, 0.63, zc], [1.11, 0.57, zc]], 0.022, AL, 6); }
    cyl(K, [1.03, 0.6, -0.27], [1.03, 0.6, -0.33], 0.035, ST, { n: 8 });   // (the throttle)
    for (let i = 0; i < 4; i++) { const zc = (i - 1.5) * 0.14; hose([[1.4, 0.55, zc], [1.47, 0.52, zc], [1.49, 0.44, 0.1 + i * 0.02]], 0.017, RUST, 5); }
    if (OZ !== 'turbo') { ozA('turbo'); cyl(K, [1.49, 0.43, 0.06], [1.49, 0.43, 0.22], 0.055, RUST, { n: 8 }); cyl(K, [1.49, 0.43, 0.22], [1.49, 0.43, 0.3], 0.065, AL, { n: 10 }); cyl(K, [1.49, 0.43, 0.3], [1.49, 0.43, 0.34], 0.03, AL, { n: 6 }); ozB(); }   // (the turbo: its hot and its cold side)
    const ix = v >= 5 ? 1.07 : 1.24, il = v >= 5 ? 0.2 : 0.3, iz = v >= 5 ? 0.04 : 0;   // (5, 6: the intercooler back over the inlet, the cam cover in sight)
    if (OZ !== 'hladilnik') { const IC = OZ === 'ic2' ? 2 : OZ === 'ic3' ? 3 : 1, ih = [0, 0.05, 0.075, 0.1][IC], iw = [0, 0.36, 0.42, 0.46][IC], ill = il + [0, 0, 0.03, 0.07][IC], tc = [0, AL, [0.2, 0.42, 0.85], [0.85, 0.2, 0.16]][IC], nf = [0, 4, 6, 8][IC]; box(K, ix, 0.69, iz, ill, ih, iw, [0.62, 0.63, 0.66]); for (let i = -nf; i <= nf; i++) box(K, ix, 0.69 + ih, iz + i * (iw - 0.07) / (2 * nf), ill - 0.02, 0.003, IC > 1 ? 0.005 : 0.008, DK); for (const sd of [-1, 1]) box(K, ix, 0.685, iz + sd * (iw / 2 + 0.02), ill, ih + 0.01, 0.05, tc, tc); if (IC === 3) for (const sd of [-1, 1]) cyl(K, [ix - ill / 2 + 0.03, 0.69 + ih + 0.014, iz + sd * 0.1], [ix + ill / 2 - 0.03, 0.69 + ih + 0.014, iz + sd * 0.1], 0.006, [0.75, 0.76, 0.8], { n: 5 }); }
    if (OZ !== 'hladilnik') for (const [dx, dz] of [[-il / 2 + 0.02, -0.2], [il / 2 - 0.02, 0.2]]) box(K, ix + dx, 0.6, iz + dz, 0.015, 0.09, 0.015, ST);
    const bp1 = [[1.49, 0.49, 0.3], [1.46, 0.62, 0.32], [1.36, 0.71, 0.26], [ix + il / 2, 0.715, iz + 0.22]], bp2 = v >= 5 ? [[ix - 0.02, 0.69, iz - 0.22], [1.04, 0.66, -0.3], [1.03, 0.62, -0.33]] : [[1.18, 0.715, -0.22], [1.1, 0.7, -0.3], [1.03, 0.62, -0.33]];
    hose(bp1, 0.026, AL, 7); hose(bp2, 0.026, AL, 7);   // (the boost's pipes: turbo, intercooler, throttle)
    cyl(K, [1.45, 0.44, -0.26], [1.45, 0.44, -0.36], 0.055, AL, { n: 8 }); cyl(K, [1.45, 0.44, -0.36], [1.45, 0.44, -0.385], 0.04, DK, { n: 8 }); cyl(K, [1.3, 0.36, -0.36], [1.3, 0.36, -0.385], 0.065, DK, { n: 10 }); cyl(K, [1.2, 0.5, -0.36], [1.2, 0.5, -0.385], 0.045, DK, { n: 8 });   // (the alternator, the pulleys, the belt)
    hose([[1.45, 0.48, -0.375], [1.2, 0.545, -0.375], [1.16, 0.5, -0.375], [1.3, 0.295, -0.375], [1.45, 0.4, -0.375]], 0.007, RUB, 4);
    if (OZ !== 'filter_zraka') K.deli('filter_zraka', () => { cyl(K, [1.0, 0.52, -0.46], [1.0, 0.66, -0.46], 0.09, PLA, { n: 10, capB: PL2 }); cyl(K, [1.0, 0.66, -0.46], [1.0, 0.675, -0.46], 0.02, AL, { n: 6 }); for (let i = 0; i < 3; i++) box(K, 1.0 + Math.cos(i * 2.094) * 0.09, 0.62, -0.46 + Math.sin(i * 2.094) * 0.09, 0.012, 0.04, 0.012, AL); });
    corr([1.08, 0.56, -0.46], [1.3, 0.5, -0.45], 0.03); hose([[1.3, 0.5, -0.45], [1.5, 0.4, -0.42], [1.53, 0.36, 0.1], [1.5, 0.4, 0.3]], 0.028, RUB, 6);
    tank(1.43, 0.44, 0.52, 0.16, 0.14, 0.12, PLA, [0.3, 0.7, 0.45]); tank(1.44, 0.43, -0.55, 0.14, 0.13, 0.08, BLU, [0.3, 0.5, 0.85]);
    hose([[1.43, 0.59, 0.5], [1.52, 0.64, 0.42], [1.59, 0.67, 0.36]], 0.009, RUB, 4);
    hose([[0.92, 0.5, 0.2], [0.9, 0.56, 0], [0.92, 0.56, -0.1], [1.0, 0.56, 0.0], [1.1, 0.6, 0.02]], 0.012, RUB, 4);   // (the loom along the bulkhead to the engine)
    if (v < 3) return;
    // == 3: everything: the screen wiper's motor, relays, the air conditioning, the brakes' lines, a heat shield, the dipstick, horns, the prop
    box(K, 1.5, 0.5, 0.14, 0.012, 0.12, 0.34, AL); for (const dz of [0, 0.28]) bolt(1.507, 0.56, dz, 0.008, ST);   // (the shield before the turbo)
    cyl(K, [1.42, 0.5, -0.12], [1.47, 0.68, -0.14], 0.005, ST, { n: 4 }); cyl(K, [1.47, 0.68, -0.14], [1.475, 0.7, -0.14], 0.014, YEL, { n: 6 });   // (the dipstick)
    cyl(K, [0.92, yc - 0.01, 0.2], [0.98, yc - 0.03, 0.2], 0.04, PL2, { n: 8 }); box(K, 0.93, yc - 0.06, 0.3, 0.06, 0.05, 0.08, AL);   // (the wiper's motor)
    box(K, 1.34, 0.5, 0.52, 0.12, 0.07, 0.1, PLA, PL2); for (let i = 0; i < 3; i++) box(K, 1.31 + i * 0.03, 0.57, 0.52, 0.022, 0.025, 0.03, [[0.2, 0.2, 0.22], YEL, [0.3, 0.5, 0.3]][i]);   // (the relays)
    cyl(K, [1.42, 0.36, 0.34], [1.5, 0.36, 0.34], 0.05, [0.5, 0.51, 0.54], { n: 8 });   // (the air conditioning's compressor, its two pipes along the wing to the bulkhead; its drier's bottle)
    for (const d of [0, 0.028]) hose([[1.46, 0.4, 0.36], [1.5, 0.6, 0.6 - d], [1.3, 0.68 - d, 0.63 - d], [0.95, 0.7 - d, 0.6 - d], [0.89, 0.66 - d, 0.5]], 0.009, AL, 4);
    cyl(K, [1.52, 0.4, -0.44], [1.52, 0.6, -0.44], 0.035, AL, { n: 8, capB: PLA });
    box(K, 1.06, 0.48, -0.3, 0.07, 0.06, 0.07, AL, DK); for (let i = 0; i < 3; i++) hose([[1.0 + i * 0.02, 0.6, -0.24], [1.0 + i * 0.02, 0.57, -0.3], [1.04 + i * 0.02, 0.54, -0.3]], 0.004, ST, 4);   // (the brakes' valve block and lines)
    hose([[1.06, 0.5, -0.33], [0.9, 0.5, -0.4], [0.89, 0.5, 0.56], [1.02, 0.46, 0.6]], 0.004, ST, 4); hose([[1.08, 0.5, -0.33], [1.1, 0.46, -0.48]], 0.004, ST, 4);
    for (const zc of [-0.26, 0.3]) { cyl(K, [1.545, 0.56, zc], [1.52, 0.56, zc], 0.04, PLA, { n: 8, capB: DK }); }   // (the horns behind the panel)
    hose([[1.56, ys + 0.04, 0.5], [1.57, ys + 0.045, -0.45]], 0.006, ST, 4);   // (the bonnet's prop, clipped along the panel)
    box(K, 1.6, ys + 0.0255, 0.15, 0.05, 0.002, 0.08, YEL);   // (a warning label, no words)
    hose([[1.36, 0.63, 0.3], [1.3, 0.56, 0.42], [1.1, 0.5, 0.36], [0.92, 0.5, 0.2]], 0.01, RUB, 4); hose([[1.03, 0.65, 0.1], [0.9, 0.66, 0.1]], 0.012, RUB, 4);   // (more of the loom, the brake servo's vacuum pipe)
    if (v < 4) return;
    // == 4: 3 and the small things: couplers and clamps, the fuel rail and injectors, connectors, labels, buffers, the washer's pump, cables
    const WHT = [0.82, 0.82, 0.8], GRY = [0.45, 0.46, 0.5], seg = (pts, i, t0, t1, r, col) => { const a = pts[i], b = pts[i + 1], q = (t) => a.map((c, k) => c + (b[k] - c) * t); cyl(K, q(t0), q(t1), r, col, { n: 7 }); };
    seg(bp1, 0, 0.0, 0.3, 0.031, BLU); seg(bp1, 2, 0.55, 1, 0.031, BLU); seg(bp2, 0, 0, 0.45, 0.031, BLU); seg(bp2, bp2.length - 2, 0.5, 1, 0.031, BLU);   // (the boost pipes' silicone couplers, their clamps)
    for (const [pp, i, t] of [[bp1, 0, 0.3], [bp1, 2, 0.55], [bp2, 0, 0.45], [bp2, bp2.length - 2, 0.5]]) seg(pp, i, t - 0.06, t + 0.06, 0.034, ST);
    const rh1 = [[1.585, 0.64, 0.26], [1.5, 0.63, 0.24], [1.44, 0.56, 0.2]], rh2 = [[1.585, 0.32, -0.3], [1.5, 0.32, -0.28], [1.44, 0.36, -0.22]];
    for (const pp of [rh1, rh2]) { seg(pp, 0, 0.1, 0.22, 0.028, ST); seg(pp, 1, 0.75, 0.9, 0.028, ST); }
    cyl(K, [1.135, 0.605, -0.25], [1.135, 0.605, 0.25], 0.011, ST, { n: 5 }); for (let i = 0; i < 4; i++) { const zc = (i - 1.5) * 0.14; cyl(K, [1.135, 0.6, zc], [1.15, 0.555, zc], 0.012, PLA, { n: 5 }); box(K, 1.128, 0.61, zc, 0.02, 0.016, 0.022, GRY); }   // (the fuel rail, the injectors and their plugs)
    hose([[1.135, 0.605, 0.25], [1.1, 0.6, 0.33], [0.9, 0.55, 0.33]], 0.007, RUB, 4);
    for (const zc of (RAILS ? [-0.52, 0.52] : [-0.4, 0.4])) { cyl(K, [1.6, ys + 0.025, zc], [1.6, ys + 0.045, zc], 0.016, RUB, { n: 6 }); }   // (the bonnet's rubber buffers)
    box(K, 1.6, ys + 0.0255, -0.17, 0.05, 0.002, 0.1, WHT); box(K, 0.98, 0.591, 0.47, 0.1, 0.002, 0.04, WHT); box(K, 0.897, 0.789, -0.3, 0.035, 0.002, 0.09, AL);   // (labels without words, the body's plate)
    for (const dz of [-0.035, 0.035]) bolt(0.897, 0.789, -0.3 + dz, 0.004, DK);
    cyl(K, [1.44, 0.44, -0.6], [1.44, 0.5, -0.6], 0.02, PLA, { n: 6 }); hose([[1.44, 0.5, -0.6], [1.3, 0.66, -0.62], [0.95, 0.72, -0.6], [0.9, 0.76, -0.45]], 0.005, RUB, 4);   // (the washer's pump, its hose up to the bonnet)
    hose([[1.03, 0.63, -0.33], [0.96, 0.68, -0.36], [0.88, 0.66, -0.4]], 0.004, ST, 4); cyl(K, [1.03, 0.6, -0.33], [1.03, 0.66, -0.33], 0.012, ST, { n: 5 });   // (the throttle's cable and quadrant)
    hose([[1.2, 0.66, -0.22], [1.16, 0.64, -0.36], [1.12, 0.58, -0.44]], 0.011, RUB, 5);   // (the breather to the intake)
    hose([[1.06, 0.6, 0.38], [1.12, 0.52, 0.5], [1.2, 0.4, 0.4]], 0.008, ST, 4); bolt(1.2, 0.372, 0.4, 0.012, ST);   // (the earth strap to the chassis leg)
    for (const [x, y, z] of [[0.92, 0.57, -0.1], [1.0, 0.57, 0.0], [1.3, 0.57, 0.42], [1.1, 0.51, 0.36]]) box(K, x, y, z, 0.03, 0.02, 0.025, GRY);   // (the loom's connectors)
    for (const sd of [-1, 1]) { box(K, 1.5, 0.585, sd * 0.5, 0.03, 0.03, 0.05, GRY); hose([[1.49, 0.6, sd * 0.5], [1.4, 0.62, sd * 0.6], [1.2, 0.64, sd * 0.62]], 0.006, YEL, 4);   // (the lamps' plugs and wires, the paint marks on the struts' nuts)
      bolt(1.15, 0.715, sd * 0.57, 0.008, YEL); for (const dx of [-0.07, 0.07]) for (const dz of [-0.14, 0.14]) bolt(ix + dx * il / 0.2, 0.745, iz + sd * 0.2 + dz * 0.1, 0.006, ST); }
    for (let i = 0; i < 3; i++) box(K, 1.31 + i * 0.03, 0.57, 0.555, 0.022, 0.02, 0.025, [BLU, RED, WHT][i]);
    if (v < 5) return;
    // == 5: 4 and more parts: the brace between the struts, the engine's computer, the brakes' pump, the oil filter, heater hoses, the clutch's reservoir, the engine's mounts
    const brace = [[1.15, 0.705, -0.57], [1.21, 0.735, -0.42], [1.21, 0.735, 0.42], [1.15, 0.705, 0.57]]; hose(brace, 0.016, AL, 6); for (const sd of [-1, 1]) { box(K, 1.15, 0.693, sd * 0.57, 0.1, 0.012, 0.07, PB); }
    if (OZ !== 'cip') { ozA('cip'); box(K, 0.9, 0.56, 0.04, 0.03, 0.11, 0.18, AL, AL); for (let i = -2; i <= 2; i++) box(K, 0.917, 0.57, 0.04 + i * 0.03, 0.006, 0.09, 0.008, GRY); box(K, 0.9, 0.52, 0.04, 0.035, 0.04, 0.1, PLA); ozB(); }   // (the computer on the bulkhead, its plug)
    cyl(K, [1.06, 0.54, -0.3], [1.06, 0.62, -0.3], 0.03, DK, { n: 8 }); for (let i = 0; i < 3; i++) hose([[1.035 + i * 0.022, 0.54, -0.33], [1.035 + i * 0.022, 0.5, -0.4], [1.2 + i * 0.1, 0.42, -0.47]], 0.004, ST, 4);   // (the brakes' pump on its block, three more lines)
    cyl(K, [1.44, 0.36, -0.1], [1.52, 0.35, -0.1], 0.04, WHT, { n: 8 }); cyl(K, [1.52, 0.35, -0.1], [1.53, 0.35, -0.1], 0.02, DK, { n: 6 });   // (the oil filter)
    box(K, 1.3, 0.56, -0.31, 0.06, 0.05, 0.05, AL, AL); const hh = [[[1.14, 0.57, 0.31], [1.0, 0.62, 0.3], [0.89, 0.62, 0.26]], [[1.18, 0.55, 0.31], [1.0, 0.58, 0.34], [0.89, 0.58, 0.3]]];   // (the thermostat's housing, the heater's two hoses)
    for (const pp of hh) { hose(pp, 0.014, RUB, 5); seg(pp, 1, 0.75, 0.9, 0.017, ST); }
    cyl(K, [0.9, 0.66, -0.42], [0.9, 0.72, -0.42], 0.025, CRM, { n: 7 }); cyl(K, [0.9, 0.72, -0.42], [0.9, 0.735, -0.42], 0.028, PLA, { n: 7 });   // (the clutch's reservoir)
    for (const sd of [-1, 1]) { box(K, 1.25, 0.37, sd * 0.4, 0.1, 0.03, 0.08, AL, AL); cyl(K, [1.25, 0.4, sd * 0.4], [1.25, 0.44, sd * 0.4], 0.035, RUB, { n: 8 }); box(K, 1.25, 0.44, sd * 0.36, 0.06, 0.02, 0.12, AL, AL); bolt(1.25, 0.46, sd * 0.4, 0.012, ST); }   // (the engine's mounts on the legs)
    if (C.kind === 'hyb') {   // (a hybrid: the inverter on the right, orange cables to the motor on the gearbox and back to the battery)
      box(K, 1.28, 0.6, 0.48, 0.2, 0.07, 0.12, AL, [0.8, 0.81, 0.84]); for (let i = 0; i < 5; i++) box(K, 1.28, 0.67, 0.435 + i * 0.022, 0.16, 0.01, 0.01, [0.5, 0.51, 0.54]);
      for (const dz of [-0.025, 0.025]) hose([[1.18, 0.63, 0.48 + dz], [1.1, 0.64, 0.5 + dz], [0.96, 0.66, 0.52 + dz], [0.9, 0.6, 0.5 + dz], [0.89, 0.4, 0.46 + dz]], 0.015, ORA, 6);
      for (let i = 0; i < 3; i++) hose([[1.38, 0.63, 0.45 + i * 0.03], [1.42, 0.6, 0.44 + i * 0.03], [1.4, 0.45, 0.42], [1.3, 0.36, 0.4]], 0.012, ORA, 5);
      cyl(K, [1.28, 0.36, 0.32], [1.28, 0.36, 0.42], 0.13, AL, { n: 12, capB: ST }); cyl(K, [1.28, 0.36, 0.36], [1.28, 0.36, 0.38], 0.138, ORA, { n: 12 });
      box(K, 1.59, ys + 0.027, 0.3, 0.06, 0.002, 0.09, YEL); box(K, 1.59, ys + 0.0295, 0.3, 0.028, 0.002, 0.03, BLK);
    }
    if (v < 6) return;
    // == 6: 5 and what lies low and under the bonnet: gearbox, starter, steering rack, driveshafts, anti-roll bar, downpipe, sump; the pad's clips, washer jets and lamp
    box(K, 1.2, 0.27, 0.4, 0.3, 0.2, 0.16, AL, [0.72, 0.73, 0.76]); for (let i = -2; i <= 2; i++) box(K, 1.2 + i * 0.05, 0.47, 0.4, 0.008, 0.012, 0.15, GRY); cyl(K, [1.24, 0.38, 0.31], [1.24, 0.38, 0.34], 0.14, AL, { n: 12 });
    cyl(K, [1.4, 0.3, 0.34], [1.4, 0.3, 0.5], 0.04, DK, { n: 8 }); cyl(K, [1.4, 0.34, 0.4], [1.4, 0.34, 0.47], 0.022, ST, { n: 6 });   // (the starter and its solenoid)
    cyl(K, [0.97, 0.26, -0.3], [0.97, 0.26, 0.3], 0.022, ST, { n: 6 }); for (const sd of [-1, 1]) { corr([0.97, 0.26, sd * 0.3], [0.99, 0.27, sd * 0.47], 0.024);   // (the steering rack, its gaiters, the drive shafts and their boots)
      cyl(K, [1.15, 0.3, sd * 0.3], [1.15, 0.3, sd * 0.5], 0.016, ST, { n: 6 }); corr([1.15, 0.3, sd * 0.31], [1.15, 0.3, sd * 0.38], 0.034); }
    hose([[0.89, 0.46, -0.3], [0.94, 0.34, -0.26], [0.97, 0.27, -0.22]], 0.012, ST, 5); cyl(K, [0.93, 0.36, -0.268], [0.95, 0.32, -0.252], 0.02, DK, { n: 6 });   // (the steering column and its joint)
    if (OZ !== 'stabilizatorji') { ozA('stabilizatorji'); hose([[1.2, 0.24, -0.5], [1.36, 0.22, -0.42], [1.36, 0.22, 0.42], [1.2, 0.24, 0.5]], 0.011, RED, 5); ozB(); }   // (the anti-roll bar)
    hose([[1.49, 0.4, 0.1], [1.44, 0.26, 0.06], [1.2, 0.2, 0.02], [0.9, 0.2, 0.0]], 0.03, RUST, 6); box(K, 1.24, 0.22, -0.05, 0.3, 0.08, 0.4, DK, DK); for (let i = -3; i <= 3; i++) box(K, 1.24, 0.215, -0.05 + i * 0.055, 0.3, 0.085, 0.008, GRY);
    box(K, 1.545, ys + 0.004, 0, 0.05, 0.012, 0.86, PLA); for (const zc of [-0.3, 0, 0.3]) bolt(1.545, ys + 0.016, zc, 0.006, GRY); box(K, 0.96, yc + 0.01, 0, 0.014, 0.014, 1.0, RUB); box(K, 1.572, ys + 0.022, 0, 0.012, 0.012, 0.9, RUB);   // (the cover over the radiator's top, the seals across the cowl and the slam panel)
    hp(1.0, 1.02, -0.26, -0.24, AL, 0.052); hp(1.0, 1.02, 0.24, 0.26, AL, 0.052); hp(1.48, 1.5, -0.26, -0.24, AL, 0.052); hp(1.48, 1.5, 0.24, 0.26, AL, 0.052); hp(1.24, 1.26, -0.01, 0.01, AL, 0.052);   // (the pad's clips)
    for (const sd of [-1, 1]) { hp(1.0, 1.04, sd * 0.42, sd * 0.45, PLA, 0.058); hp(0.88, 1.0, sd * 0.43, sd * 0.44, RUB, 0.058); } hp(1.4, 1.46, 0.4, 0.47, WHT, 0.058);   // (the washer's jets and hoses, the bay's lamp)
    // == 7: 6 and the last of it: the frame (above); on the engine the belt's cover, the cover's bolts, the filler, lifting eyes, manifold nuts, sensors, the torque rod, gear rods
    if (v < 7) return;
    frame7();
    box(K, 1.31, 0.47, -0.345, 0.2, 0.19, 0.022, PLA, PL2); for (const [x, y] of [[1.22, 0.49], [1.4, 0.49], [1.22, 0.64], [1.4, 0.64], [1.31, 0.56]]) cyl(K, [x, y, -0.357], [x, y, -0.362], 0.008, AL, { n: 5 });   // (the cam belt's cover, its screws)
    cyl(K, [1.3, 0.28, -0.385], [1.3, 0.28, -0.4], 0.07, DK, { n: 12 }); cyl(K, [1.3, 0.28, -0.4], [1.3, 0.28, -0.41], 0.018, ST, { n: 6 }); cyl(K, [1.38, 0.4, -0.36], [1.38, 0.4, -0.385], 0.028, ST, { n: 8 });   // (the crank's pulley and bolt, the tensioner)
    for (const xm of [1.225, 1.415]) for (const zc of [-0.27, -0.09, 0.09, 0.27]) { cyl(K, [xm, 0.662, zc], [xm, 0.672, zc], 0.011, ST, { n: 6 }); cyl(K, [xm, 0.66, zc], [xm, 0.664, zc], 0.016, RUB, { n: 6 }); }   // (the cam cover's bolts on their rubbers)
    cyl(K, [1.38, 0.665, 0.2], [1.38, 0.69, 0.2], 0.03, PLA, { n: 10, capB: [0.8, 0.62, 0.1] }); box(K, 1.38, 0.69, 0.2, 0.05, 0.008, 0.012, [0.8, 0.62, 0.1]);   // (the oil filler's cap)
    for (const zc of [-0.31, 0.31]) { box(K, 1.2, 0.6, zc, 0.05, 0.055, 0.006, ST); cyl(K, [1.2, 0.635, zc - 0.004], [1.2, 0.635, zc + 0.004], 0.012, BLK, { n: 6 }); }   // (the lifting eyes)
    for (let i = 0; i < 4; i++) { const zc = (i - 1.5) * 0.14; for (const dz of [-0.035, 0.035]) cyl(K, [1.435, 0.55, zc + dz], [1.452, 0.55, zc + dz], 0.008, [0.6, 0.45, 0.3], { n: 5 }); }   // (the manifold's nuts)
    cyl(K, [1.5, 0.36, 0.14], [1.53, 0.4, 0.14], 0.012, ST, { n: 6 }); hose([[1.53, 0.4, 0.14], [1.5, 0.5, 0.3], [1.3, 0.56, 0.42]], 0.005, BLK, 4);   // (the exhaust's sensor, its lead)
    for (const [x, y, z] of [[1.1, 0.5, 0.2], [1.07, 0.56, -0.12], [1.42, 0.5, -0.3]]) { cyl(K, [x, y, z], [x - 0.03, y + 0.02, z], 0.011, [0.75, 0.6, 0.25], { n: 6 }); box(K, x - 0.045, y + 0.012, z, 0.03, 0.022, 0.024, GRY); }   // (sensors and their plugs)
    cyl(K, [1.17, 0.62, 0.33], [0.93, 0.66, 0.33], 0.013, ST, { n: 6 }); for (const x of [1.17, 0.93]) cyl(K, [x, x > 1 ? 0.62 : 0.66, 0.31], [x, x > 1 ? 0.62 : 0.66, 0.35], 0.028, RUB, { n: 8, capA: ST, capB: ST }); box(K, 0.9, 0.63, 0.33, 0.05, 0.06, 0.06, PB);   // (the torque rod to the bulkhead)
    hose([[0.89, 0.3, 0.06], [1.05, 0.3, 0.2], [1.2, 0.33, 0.3]], 0.008, ST, 5); hose([[0.89, 0.27, 0.0], [1.05, 0.27, 0.16], [1.22, 0.29, 0.28]], 0.008, ST, 5); cyl(K, [1.2, 0.33, 0.3], [1.22, 0.29, 0.28], 0.016, RUB, { n: 6 });   // (the gear rods)
    hose([[0.89, 0.34, 0.24], [1.0, 0.36, 0.26], [1.12, 0.5, 0.26], [1.135, 0.6, 0.27]], 0.007, RUB, 5); hose([[0.89, 0.32, 0.27], [1.0, 0.34, 0.29], [1.1, 0.46, 0.3]], 0.006, [0.2, 0.3, 0.6], 5);   // (the fuel's feed and return)
    for (const [a, b] of [[[1.0, 0.36, 0.26], [1.02, 0.39, 0.26]], [[1.12, 0.52, 0.26], [1.125, 0.55, 0.262]]]) cyl(K, a, b, 0.011, AL, { n: 6 });   // (their clamps)
    if (SAM) K.xf(null);
  };

  for (const [id, b] of [['filter_zraka', filter_zraka], ['cip', cip], ['turbo', turbo], ['akumulator', akumulator], ['vzmeti', vzmeti], ['amortizerji', amortizerji], ['stabilizatorji', stabilizatorji], ['dim_gum', dim_gum]]) DELI.add(id, b);
})();
