/* Deli iz garaže, sklop 3 · skriti deli (načrt 2.6): filter_zraka, cip, turbo, akumulator, vzmeti, amortizerji, stabilizatorji, hupa,
   dim_gum (the contract: docs/deli.md). Loaded after js/deli.js, before the cars.
   Each is drawn where it really sits, in the inner block (the engine bay, the wheel arches, behind the bumper): unseen while the car is
   whole (the inner block is drawn only once a part is off or a door open), so the garage's part alone (DELI.mesh) shows it as under a
   see-through bonnet or in a wheel arch. On the car only what it does shows: the power, the mass, the grip (js/deli.js DELI.effect,
   core.js applyDeli), the body lower on its springs (vzmeti: DELI.dress, js/deli/barve.js), the horn's sound (DELI.hupa: Sfx.hupa), the
   tyre smoke's colour (DELI.dim: render.js, the drift's smoke).
   mounts (look units): filter_zraka, akumulator, turbo, cip, hupa { x, y, z } where it sits (its foot's middle); vzmeti, amortizerji,
   stabilizatorji, dim_gum {} (at the wheels: K.arches, K.hw; in: how far inboard of the hub the strut stands, top: its top's height) */
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
    const { x, y, z } = m, P = [WHT, RED, GRN, BLU][n - 1];
    if (n <= 4) { box(K, x, y, z, 0.24, 0.07, 0.2, DK); box(K, x, y + 0.07, z, 0.2, 0.012, 0.16, P); return; }   // (a panel in the stock box)
    const cone = (cx, cz, col, s) => { cyl(K, [cx + 0.04 * s, y + 0.1, cz], [cx - 0.1 * s, y + 0.1, cz], 0.075 * s, col, { r2: 0.055 * s, capB: CHR }); cyl(K, [cx + 0.04 * s, y + 0.1, cz], [cx + 0.14, y + 0.1, cz], 0.04, AL); };
    switch (n) {
      case 5: cone(x, z, ORA, 1); break;
      case 6: cone(x, z, RED, 1); break;
      case 7: cone(x, z - 0.06, RED, 0.8); cone(x, z + 0.08, RED, 0.8); break;
      case 8: cone(x, z, BLU, 1); K.box(x - 0.03, y, z + 0.11, 0.24, 0.2, 0.01, 0, AL, AL, false, IN); break;
      case 9: case 10: cone(n === 10 ? x + 0.3 : x, z, n === 10 ? BLU : RED, 1); cyl(K, [x + 0.12, y + 0.1, z], [x + 0.32, y + 0.12, z * 0.4], 0.035, n === 10 ? BLK : AL); break;
      case 11: box(K, x, y, z, 0.26, 0.12, 0.2, AL); cyl(K, [x + 0.13, y + 0.06, z], [x + 0.3, y + 0.08, z * 0.4], 0.035, AL); break;
      case 12: box(K, x, y, z, 0.32, 0.15, 0.24, BLK); cyl(K, [x + 0.16, y + 0.08, z], [x + 0.32, y + 0.08, z * 0.4], 0.04, BLK); break;
      case 13: cone(x, z, RED, 1); cyl(K, [x + 0.12, y + 0.1, z], [x + 0.32, y + 0.12, z * 0.4], 0.04, CF); break;
      case 14: case 15: case 16: box(K, x, y, z, 0.3 + (n - 14) * 0.02, 0.14, 0.22, CF, [0.13, 0.13, 0.14]); cyl(K, [x + 0.15, y + 0.07, z], [x + 0.32, y + 0.08, z * 0.4], 0.04, CF);
        if (n >= 15) K.box(x + 0.08, y + 0.14, z, 0.1, 0.04, 0.12, 0, CF, BLK, false, IN);   // (its scoop)
        if (n === 16) box(K, x - 0.05, y + 0.14, z, 0.08, 0.008, 0.18, RED); break;
    }
  }
  // ================================================================ cip: the engine's control box on the bulkhead
  function cip(K, n, m) {
    const { x, y, z } = m, big = n >= 5, col = n <= 4 ? BLK : n <= 12 ? AL : n === 13 ? RED : n === 16 ? GOLD : DK;
    box(K, x, y, z, big ? 0.16 : 0.08, big ? 0.04 : 0.03, big ? 0.12 : 0.06, col, n === 16 ? GOLD : null);
    if (n === 3) box(K, x, y, z + 0.08, 0.08, 0.03, 0.06, BLK);
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
    if (n >= 13) { snail(z - 0.1, s * 0.85); snail(z + 0.12, s * 0.85); } else snail(z, s);
    cyl(K, [x, y + 0.08 * s, z - 0.06], [x - 0.15, y + 0.22, z - 0.2], 0.03, n >= 9 ? BLU : AL, { n: 6 });   // (to the intercooler)
    if (n === 8 || n === 10 || n === 15) box(K, x + 0.06, y - 0.05, z, 0.04, 0.16, 0.42, AL);   // (a bigger intercooler in front of it)
  }
  // ================================================================ akumulator: the battery, smaller and lighter
  function akumulator(K, n, m) {
    const { x, y, z } = m, k = 1 - (n - 1) * 0.035, col = [BLK, DK, DK, RED, BLU, YEL, YEL, ORA, RED, WHT, BLK, GRN, RED, WHT, CF, GOLD][n - 1];
    box(K, x, y, z, 0.2 * k, 0.17 * k, 0.14 * k, col, n === 15 ? [0.13, 0.13, 0.14] : BLK);
    for (const dz of [-0.04, 0.04]) cyl(K, [x, y + 0.17 * k, z + dz * k], [x, y + 0.17 * k + 0.02, z + dz * k], 0.012, dz < 0 ? RED : BLK, { n: 4 });   // (its terminals)
  }
  // ================================================================ at the wheels: the springs, the dampers, the anti-roll bars, the tyres' smoke
  const wheels = (K, fn) => { for (const A of K.arches) for (const sd of [-1, 1]) fn(A.x, sd, A === K.arches[0]); };
  function vzmeti(K, n, m) {
    const low = DELI.effect('vzmeti', n).lower || 0, k = 3, col = [AL, RED, AL, AL, YEL, YEL, RED, PUR, BLU, BLU, BLU, GRN, RED, ORA, YEL, GOLD][n - 1], ti = m.in || 0.13, top = (m.top || 0.66) - low;
    wheels(K, (x, sd) => { const z = sd * (K.hw - ti), y0 = K.rw + 0.04, h = (top - y0) / (k * 2 - 1);
      for (let i = 0; i < k; i++) cyl(K, [x, y0 + i * 2 * h, z], [x, y0 + (i * 2 + 1) * h, z], 0.06, col, { capA: null, capB: null });   // (its coils: bands with gaps)
      cyl(K, [x, y0 - 0.01, z], [x, top, z], 0.036, DK, { n: 4, capA: null, capB: null }); });   // (the strut inside)
  }
  function amortizerji(K, n, m) {
    const col = [DK, YEL, YEL, RED, RED, BLU, BLU, GOLD, RED, BLU, ORA, GRN, GOLD, YEL, BLU, RED][n - 1], ti = (m.in || 0.13) + 0.005, top = m.top || 0.66;
    wheels(K, (x, sd) => { const z = sd * (K.hw - ti), y0 = K.rw + 0.02;
      cyl(K, [x, y0, z], [x, y0 + (top - y0) * 0.6, z], 0.032, col, { capA: null });
      cyl(K, [x, y0 + (top - y0) * 0.6, z], [x, top + 0.02, z], 0.012, CHR, { n: 4, capA: null, capB: null });
      if (n >= 6) box(K, x, top - 0.02, z, 0.06, 0.03, 0.06, n >= 13 ? GOLD : AL);   // (its top mount, adjustable)
      if (n === 10 || n >= 15) cyl(K, [x + 0.05, y0 + 0.08, z - sd * 0.05], [x + 0.05, y0 + 0.2, z - sd * 0.05], 0.022, col, { n: 5, capA: null, capB: AL }); });   // (a reservoir)
  }
  function stabilizatorji(K, n, m) {
    const col = [BLK, BLK, RED, RED, BLU, BLU, YEL, YEL, RED, RED, BLU, BLU, GOLD, GOLD, AL, ORA][n - 1], r = 0.011 + Math.min(n, 12) * 0.0008, ti = (m.in || 0.13) + 0.06, y = K.rw - 0.02;
    const axle = (A, front) => { const x = A.x + (front ? -0.12 : 0.12); K.bar([x, y, -(K.hw - ti)], [x, y, K.hw - ti], r, col, Object.assign({ n: K.hi ? 6 : 5 }, IN));
      for (const sd of [-1, 1]) K.bar([x, y, sd * (K.hw - ti)], [A.x, y + 0.08, sd * (K.hw - ti)], r * 0.8, col, Object.assign({ n: 4 }, IN)); };   // (its arms forward to the wheel)
    if (n !== 2) axle(K.arches[1], false);
    if (n === 2 || n >= 5) axle(K.arches[0], true);
  }
  function dim_gum(K, n, m) {
    const S = DIM[n] || DIM[1];
    for (const sd of [-1, 1]) { const A = K.arches[1], z = sd * (K.hw - (K.wheels && K.wheels.w ? K.wheels.w / 2 : 0.09) - 0.012), c = S.c[sd < 0 || S.c.length < 2 ? 0 : 1];
      K.at(A.x, K.rw, z, () => { for (let i = 0; i < 12; i++) { const a0 = i / 12 * Math.PI * 2, a1 = (i + 1) / 12 * Math.PI * 2, r0 = K.rw * 0.72, r1 = K.rw * 0.9, P = (a, rr) => [A.x + Math.cos(a) * rr / K.sx, K.rw + Math.sin(a) * rr, z];
        const f = [P(a0, r0), P(a1, r0), P(a1, r1), P(a0, r1)]; K.face(sd < 0 ? f : f.slice().reverse(), S.c.length > 2 ? S.c[i % S.c.length] : c); } }, IN); }   // (the tyre's inner wall: its band in the smoke's colour)
  }
  // ================================================================ hupa: behind the bumper's grille, its horns and trumpets
  function hupa(K, n, m) {
    const { x, y, z } = m, col = n === 4 || n === 14 ? CHR : n >= 9 ? RED : BLK, k = n <= 2 ? 1 : n <= 8 ? 2 : n <= 12 ? 3 : 4;
    for (let i = 0; i < k; i++) { const dz = (i - (k - 1) / 2) * 0.09, zz = z + dz;
      if (n <= 8) { cyl(K, [x, y, zz], [x + 0.03, y, zz], 0.045, col, { capB: DK }); cyl(K, [x + 0.03, y, zz], [x + 0.05, y, zz], 0.025, col, { r2: 0.015 }); }   // (a snail)
      else cyl(K, [x - 0.16 - i * 0.04, y, zz], [x + 0.04, y + 0.01, zz], 0.012, col, { r2: 0.04, capB: DK }); }   // (a trumpet, flared)
    if (n >= 11) box(K, x - 0.25, y - 0.05, z, 0.16, 0.08, 0.1, n === 14 ? CHR : DK);   // (the air tank, the compressor)
  }

  // ---- the effects the car shows: the horn's sound, the tyre smoke's colour ----
  // DELI.hupa(n): { notes: [[hz ...] ...] one chord after another, len (s each), wave, loud (0..1), air } (Sfx.hupa plays it)
  const HUPA = { 1: [[[420]], 0.4, 'square', 0.45], 2: [[[420]], 0.45, 'square', 0.6], 3: [[[400, 500]], 0.45, 'square', 0.55], 4: [[[400, 500]], 0.45, 'square', 0.6],
    5: [[[380, 476]], 0.5, 'square', 0.72], 6: [[[350, 440, 523]], 0.5, 'square', 0.7], 7: [[[523], [659], [784], [659]], 0.18, 'square', 0.6], 8: [[[330, 415, 494, 587]], 0.5, 'square', 0.72],
    9: [[[185, 233]], 0.7, 'sawtooth', 0.85, true], 10: [[[185, 233], [220, 277]], 0.4, 'sawtooth', 0.88, true], 11: [[[185, 233]], 1.2, 'sawtooth', 0.88, true], 12: [[[175, 220, 262]], 0.7, 'sawtooth', 1, true],
    13: [[[165, 208, 247]], 1.3, 'sawtooth', 1, true], 14: [[[165, 208, 247]], 0.8, 'sawtooth', 1, true], 15: [[[147, 185, 220, 277]], 0.8, 'sawtooth', 1, true], 16: [[[220, 277], [247, 311], [277, 330], [330, 415]], 0.25, 'sawtooth', 1, true] };
  DELI.hupa = (n) => { const h = HUPA[n]; return h ? { notes: h[0], len: h[1], wave: h[2], loud: h[3], air: !!h[4] } : null; };
  // DELI.dim(n): the drift's tyre smoke: { c: colours, at(k, t) -> [r, g, b, alpha x, life x] } (k the wheel: 2 rear left, 3 rear right)
  const DIM = { 1: { c: [[0.9, 0.9, 0.92]], a: 1, l: 1 }, 2: { c: [[0.94, 0.94, 0.95]], a: 1.35, l: 1 }, 3: { c: [[0.9, 0.9, 0.92]], a: 1, l: 1.5 }, 4: { c: [[0.94, 0.94, 0.95]], a: 1.35, l: 1.5 },
    5: { c: [[0.35, 0.6, 1]] }, 6: { c: [[1, 0.28, 0.2]] }, 7: { c: [[1, 0.88, 0.25]] }, 8: { c: [[0.7, 0.4, 1]] }, 9: { c: [[0.35, 0.6, 1]], a: 1.35 }, 10: { c: [[0.4, 1, 0.35]] },
    11: { c: [[1, 0.6, 0.25]] }, 12: { c: [[1, 0.55, 0.8]] }, 13: { c: [[0.35, 0.6, 1], [1, 0.28, 0.2]] }, 14: { c: [[1, 0.3, 0.3], [1, 0.85, 0.3], [0.4, 1, 0.4], [0.35, 0.6, 1], [0.75, 0.4, 1]], rb: true },
    15: { c: [[0.94, 0.94, 0.95]], a: 1.6, l: 1.3 }, 16: { c: [[0.94, 0.94, 0.95]], a: 1.6, l: 1.7 } };
  DELI.dim = (n) => { const S = DIM[n] || DIM[1], a = S.a || 1.15, l = S.l || 1.15;
    return { c: S.c, at: (k, t) => { const c = S.rb ? S.c[Math.floor((t || 0) * 2.5) % S.c.length] : S.c[S.c.length > 1 && k % 2 ? 1 : 0]; return [c[0], c[1], c[2], a, l]; } }; };

  for (const [id, b] of [['filter_zraka', filter_zraka], ['cip', cip], ['turbo', turbo], ['akumulator', akumulator], ['vzmeti', vzmeti], ['amortizerji', amortizerji], ['stabilizatorji', stabilizatorji], ['hupa', hupa], ['dim_gum', dim_gum]]) DELI.add(id, b);
})();
