/* Vehicle 'mravlja' — MRAVLJA: a racing kart, two-stroke behind the seat. Signature features: 1) the driver in full view in a moulded
   seat, 2) side pods between the wheels, 3) a front fairing and a nose bumper, 4) a rear bumper bar across the wheels, 5) the two-stroke
   engine beside the seat with its exhaust. L 1.85 W 1.35 H 1.00, wheelbase 1.05, overhangs F 0.40 R 0.40 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'mravlja', name: 'MRAVLJA', cat: 'dirkalni', ord: 5, drive: 'RR',
    desc: 'Dirkalni kart: voznik na očeh, stranska oklepa in sprednji spojler.',
    phys: { mass: 165, a: 0.53, b: 0.52, kI: 0.55, kw: 22, redline: 14000, idle: 2500, gears: [1], final: 5.2, rw: 0.14, cDrag: 1.25, len: 1.85, wid: 1.35, steerMax: 0.5,
      tracK: 1.2, brakeK: 1.1, spinK: 0.3, loose: 0.66, dmgK: 1.3, sway: 0.3 },
    arc: { amax: 1.95, kv: 2.6, rmin: 2.6 },
    csp: { bx: 0.15, coast: -0.04, thr: 0.01, liftP: 0.05, pwr: 0.03, out: 0.9, turn: 1.3, w: 1.05, tv: 0.65 },   // (the RR layer: the engine behind the rear axle, a pendulum on a lift; its own liftP, pwr, out, turn, w, tv)
    stats: { power: 1, grip: 10, weight: 10, drift: 2 },
    price: 5000, pk: 'ta1', field: ['mravlja'],
    snd: { kind: 'kart2t', hz: 1.6, loud: 0.9 },
    expect: { t100: [3.1, 3.64], vmax: [130, 138], latG: [2.51, 2.61], d100: [19.8, 21.8] },
    partNames: { nose: 'front fairing', podL: 'left side pod', podR: 'right side pod' },
    parts: { set: 'none', ht: 1, y0: 0.05,
      extra: {
        nose: { z: 0, th: 0.5, m: 2, r: 0.35, h: 0.12, lx: 0.95, lz: 0, f: 0.25 },
        podL: { z: 2, th: 0.55, m: 2, r: 0.3, h: 0.12, lx: -0.05, lz: -0.85, f: 0.15 },
        podR: { z: 3, th: 0.55, m: 2, r: 0.3, h: 0.12, lx: -0.05, lz: 0.85, f: 0.15 },
        bumperR: { m: 3, f: 0.12 },
      },
    },
    // the look: no loft (a kart is tubes and plastic): every piece drawn in an explicit part (KIT API v1, render.js): the frame, the floor
    // tray, the seat, the steering, the engine with its exhaust and the driver in 'body'; the front fairing with its front panel ('nose'), the
    // side pods ('podL' / 'podR'), the plastic rear bumper on its tubes ('bumperR'). Look units = metres (body.len / wid: the vehicle's)
    look: {
      body: { len: 1.85, wid: 1.35, roofY: 1.0, wz: 0.1,
        eye: { x: -0.34, y: 0.87, near: 0.1, tilt: 0.12, style: 'kart' },                 // (in the helmet: the formula's wheel in the cockpit)
        decalX: 0.79, decalY: 0.205, decalRz: -0.3, decalS: 0.32, decalPart: 'nose',     // (the start number on the nose)
        engine: [-0.16, 0.36], engRear: true,                                           // (the two-stroke beside the seat)
        crush: { x0: 0, x1: 0, z: 0 } },                                                // (no roof to crush: the driver stays as he is)
      wheels: { style: 'kart', w: 0.13, wR: 0.2, rimK: 0.5, rim: [0.8, 0.68, 0.3], gap: 0.03, arch: false },
      regions: 'none',
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, FR = [0.6, 0.62, 0.66], DK = [0.14, 0.14, 0.15], AL = [0.7, 0.71, 0.74], SEAT = [0.11, 0.11, 0.11];
        const Y = 0.056, R = 0.016;                                                       // the frame tubes' centre height and radius
        const bar = (a, b, r, col, n) => K.bar(a, b, r || R, col || FR, { n: n || 4 });
        // ---- the frame (chrome-moly tubes on the ground), the axles, the floor tray: 'body' ----
        K.part('body', () => {
          for (const s of [-1, 1]) {
            const rail = [[0.72, Y, s * 0.2], [0.53, Y, s * 0.42], [0.2, Y, s * 0.3], [-0.4, Y, s * 0.3], [-0.52, Y, s * 0.42], [-0.63, Y, s * 0.3]];
            for (let i = 0; i < rail.length - 1; i++) bar(rail[i], rail[i + 1]);
            bar([0.53, Y, s * 0.42], [0.53, 0.2, s * 0.45], 0.014);                        // the kingpin
            bar([0.53, 0.14, s * 0.44], [0.53, 0.14, s * 0.5], 0.012, DK);                 // the stub axle (to the hub)
            bar([-0.52, Y, s * 0.42], [-0.52, 0.14, s * 0.4], 0.022, AL);                 // the rear bearing's hanger
            bar([0.26, Y, s * 0.3], [0.22, 0.075, s * 0.62]); bar([0.22, 0.075, s * 0.62], [-0.26, 0.075, s * 0.62]); bar([-0.26, 0.075, s * 0.62], [-0.33, Y, s * 0.3]);   // the side bumper (under the pod)
            bar([0.72, Y, s * 0.2], [0.89, 0.07, s * 0.14]); bar([0.64, 0.08, s * 0.32], [0.85, 0.16, s * 0.2]);   // the front bumper's bars (under the fairing)
          }
          bar([0.72, Y, -0.2], [0.72, Y, 0.2]); bar([0.89, 0.07, -0.14], [0.89, 0.07, 0.14]); bar([0.85, 0.16, -0.2], [0.85, 0.16, 0.2]);
          bar([0.2, Y, -0.3], [0.2, Y, 0.3]); bar([-0.4, Y, -0.3], [-0.4, Y, 0.3]);
          bar([-0.52, 0.14, -0.49], [-0.52, 0.14, 0.49], 0.02, [0.5, 0.5, 0.53], 6);   // the rear axle
          K.cyl([-0.52, 0.14, -0.21], [-0.52, 0.14, -0.2], 0.085, [0.45, 0.46, 0.48], { n: 8 });   // its brake disc, the caliper over it
          K.box(-0.52, 0.2, -0.205, 0.07, 0.05, 0.05, 0, DK);
          K.cyl([-0.52, 0.14, 0.3], [-0.52, 0.14, 0.31], 0.07, [0.22, 0.22, 0.23], { n: 8 });  // the sprocket
          K.face([[0.66, 0.05, 0.24], [0.66, 0.05, -0.24], [-0.12, 0.05, -0.24], [-0.12, 0.05, 0.24]], [0.2, 0.2, 0.21]);   // the floor tray
          for (const s of [-1, 1]) K.box(0.585, 0.06, s * 0.09, 0.05, 0.1, 0.07, 0, AL);   // the pedals
          K.box(0.36, 0.05, 0, 0.17, 0.11, 0.2, 0, [0.82, 0.83, 0.8]);                    // the fuel tank (between the legs)
        });
        // ---- the seat, the steering ----
        K.seat(-0.26, 0.13, 0, { w: 0.4, l: 0.34, back: 0.56, tilt: 0.38, col: SEAT, part: 'body' });
        for (const s of [-1, 1]) { const q = [[-0.42, 0.09, s * 0.215], [-0.12, 0.09, s * 0.215], [-0.26, 0.3, s * 0.22], [-0.52, 0.46, s * 0.22]]; K.face(s > 0 ? q : q.reverse(), SEAT, { part: 'body' }); }   // its side bolsters
        K.part('body', () => {
          const C = [0.12, 0.5, 0], ax = [0.573, -0.819, 0], ub = [-0.819, -0.573, 0], rr = 0.15, pt = (a) => [C[0] + rr * (Math.sin(a) * ub[0]), C[1] + rr * Math.sin(a) * ub[1], rr * Math.cos(a)];
          bar([0.41, 0.09, 0], C, 0.012, DK);                                              // the steering column
          for (let i = 0; i < 10; i++) bar(pt(i / 10 * Math.PI * 2), pt((i + 1) / 10 * Math.PI * 2), 0.013, B, 3);   // the wheel's rim
          for (const a of [Math.PI / 2, -Math.PI / 2, Math.PI]) bar(C, pt(a), 0.009, DK);  // its spokes
          K.cyl([C[0] - ax[0] * 0.02, C[1] - ax[1] * 0.02, 0], [C[0] + ax[0] * 0.03, C[1] + ax[1] * 0.03, 0], 0.035, DK, { n: 6 });   // the hub
        });
        // ---- the two-stroke beside the seat (right), the chain to the axle, the exhaust along the side; the radiator (left) ----
        K.part('body', () => {
          K.box(-0.21, 0.05, 0.37, 0.2, 0.13, 0.15, 0, AL);                               // the crankcase
          K.cyl([-0.19, 0.17, 0.37], [-0.16, 0.31, 0.37], 0.055, AL, { n: 6, capA: null });            // the cylinder
          K.cyl([-0.16, 0.31, 0.37], [-0.155, 0.345, 0.37], 0.06, DK, { n: 6, capA: null });           // its head
          K.box(-0.02, 0.06, 0.34, 0.15, 0.13, 0.13, 0, B);                                // the intake silencer, the carburettor
          bar([-0.1, 0.17, 0.35], [-0.06, 0.13, 0.34], 0.025, DK);
          K.face([[-0.18, 0.08, 0.3], [-0.56, 0.06, 0.3], [-0.56, 0.22, 0.3], [-0.18, 0.2, 0.3]], DK);   // the chain guard (seen from the inside of the frame: the chain on the far side)
          const path = [[-0.12, 0.26, 0.42], [-0.06, 0.23, 0.47], [-0.13, 0.21, 0.51], [-0.3, 0.22, 0.48], [-0.47, 0.25, 0.44], [-0.62, 0.27, 0.42], [-0.72, 0.28, 0.42]];
          const rad = [0.024, 0.028, 0.04, 0.055, 0.05, 0.036, 0.034], ring = [0, 1, 2, 3, 4, 5].map(i => [Math.cos(i * Math.PI / 3), Math.sin(i * Math.PI / 3)]);
          K.sweep(ring, path, [0.36, 0.33, 0.31], { scale: (i) => rad[i], capA: DK, capB: DK });   // the expansion chamber (heat-blued), the silencer
          K.exhaust(-0.79, 0.28, 0.42, 0.022, 0.08, { col: [0.6, 0.6, 0.62], n: 6 });
          K.box(-0.08, 0.12, -0.41, 0.33, 0.27, 0.05, 0, [0.34, 0.35, 0.37]);              // the radiator: its frame and black core
          K.rect(-0.08, 0.255, -0.437, 0.29, 0.23, B, { dir: '-z' }); K.rect(-0.08, 0.255, -0.383, 0.29, 0.23, B, { dir: 'z' });
          bar([-0.08, 0.12, -0.38], [-0.08, Y, -0.3], 0.012, FR);
        });
        // ---- the driver in the seat, leaning back with it: helmet, suit, gloves on the wheel, boots on the pedals ----
        K.driver(-0.42, 0.86, 0, { r: 0.13, lean: 0.38, suit: K.shade(P, 0.45), band: S, hands: [0.1, 0.5, 0.155], knee: [0.1, 0.36, 0.17], feet: [0.55, 0.12, 0.12] });   // (the suit a darker shade of the kart's colour: he stands out from it)
        // ---- the front fairing (the nose cone over the front bumper) and its front panel: 'nose' ----
        K.part('nose', () => {
          const rings = [[0.6, 0.36, 0.065, 0.26], [0.72, 0.46, 0.05, 0.24], [0.84, 0.5, 0.045, 0.18], [0.91, 0.48, 0.05, 0.12], [0.935, 0.42, 0.07, 0.09]]
            .map(([x, W, lo, hi]) => [[x, lo, -W], [x, lo + (hi - lo) * 0.6, -W], [x, hi - 0.012, -W * 0.6], [x, hi, 0], [x, hi - 0.012, W * 0.6], [x, lo + (hi - lo) * 0.6, W], [x, lo, W], [x, lo, 0]]);
          K.skin(rings, (k, e) => e === 2 || e === 3 ? P : e === 6 || e === 7 ? DK : K.shade(P, 0.78), DK, K.shade(P, 0.78));
          K.face([[0.785, 0.21, -0.36], [0.785, 0.21, 0.36], [0.8, 0.198, 0.36], [0.8, 0.198, -0.36]].reverse(), S);   // (a stripe across it)
          K.plate([[0.47, 0.14, -0.15], [0.47, 0.14, 0.15], [0.43, 0.4, 0.13], [0.43, 0.4, -0.13]], 0.012, P);   // the front panel (on the column)
          K.number(0.488, 0.28, 0, 0.16, { dir: 'x', bg: [0.96, 0.84, 0.12] });             // (its number: yellow, as karts have)
          bar([0.45, 0.14, -0.12], [0.62, 0.1, -0.2], 0.008, DK); bar([0.45, 0.14, 0.12], [0.62, 0.1, 0.2], 0.008, DK);   // its brackets
        }, { hinge: [[0.62, 0.08, -0.4], [0.62, 0.08, 0.4]] });
        // ---- the side pods between the wheels: 'podL' / 'podR' ----
        for (const s of [-1, 1]) K.part(s < 0 ? 'podL' : 'podR', () => {
          const rings = [[0.375, 0.45, 0.6, 0.055, 0.115], [0.3, 0.41, 0.665, 0.045, 0.19], [-0.26, 0.41, 0.665, 0.045, 0.19], [-0.355, 0.45, 0.62, 0.055, 0.125]]
            .map(([x, zi, zo, lo, hi]) => [[x, lo, s * zi], [x, lo, s * zo], [x, lo + 0.07, s * (zo + 0.004)], [x, hi, s * (zo - 0.035)], [x, hi - 0.01, s * (zi + 0.07)], [x, hi - 0.05, s * zi]]);
          K.skin(rings, (k, e) => e === 3 || e === 4 ? P : e === 0 ? DK : K.shade(P, 0.78), K.shade(P, 0.78), K.shade(P, 0.78));
          const st = [[0.26, 0.192, s * 0.6], [-0.22, 0.192, s * 0.6], [-0.22, 0.192, s * 0.56], [0.26, 0.192, s * 0.56]]; K.face(s < 0 ? st : st.reverse(), S);   // a stripe along its top (facing up)
          K.number(0.0, 0.11, s * 0.673, 0.11, { dir: s < 0 ? '-z' : 'z' });               // the number on its side
        });
        // ---- the plastic rear bumper across the wheels, on its tubes: 'bumperR' ----
        K.part('bumperR', () => {
          for (const s of [-1, 1]) bar([-0.63, Y, s * 0.3], [-0.84, 0.09, s * 0.3]);
          bar([-0.84, 0.09, -0.6], [-0.84, 0.09, 0.6]);
          const rings = [-0.675, -0.6, 0.6, 0.675].map((z, i) => { const t = i === 0 || i === 3 ? 0.8 : 1;
            return [[-0.69, 0.05, z], [-0.92, 0.05, z], [-0.925, 0.05 + 0.08 * t, z], [-0.88, 0.05 + 0.15 * t, z], [-0.72, 0.05 + 0.17 * t, z], [-0.69, 0.05 + 0.11 * t, z]]; });
          K.skin(rings, (k, e) => e === 3 || e === 4 ? P : e === 0 ? DK : K.shade(P, 0.78), K.shade(P, 0.78), K.shade(P, 0.78));
        }, { hinge: [[-0.7, 0.1, -0.6], [-0.7, 0.1, 0.6]] });
      },
    },
  });
})();
