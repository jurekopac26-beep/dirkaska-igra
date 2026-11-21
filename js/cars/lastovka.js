/* Vehicle 'lastovka' — LASTOVKA: a racing minibus (a forward-control people carrier lowered over big single wheels, a diesel). Signature
   features: 1) a one-box bus body with the driver over the front axle, a near upright windscreen, 2) a row of side windows with black
   pillars, 3) a roof rack with the team's luggage (cases and bags under a net), 4) a swallow-tail livery band along the sides, 5) deep
   bumpers with four lamps. L 6.40 W 2.30 H 2.75 (3.22 over the luggage), wheelbase 4.00, overhangs F 1.30 R 1.10 (m). Kept inside the
   rigid vehicle's 6.4 m (tests/fleet.test.js): the full-size coach is the user's decision (docs/tovornjak-v-prometu.md). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'lastovka', name: 'LASTOVKA', cat: 'tovornjaki', ord: 8, drive: 'FR',
    desc: 'Dirkalni minibus: spuščen nad velika kolesa, s prtljago ekipe na strehi.',
    phys: { mass: 3600, a: 1.9, b: 2.1, kI: 1.6, kw: 430, redline: 4200, idle: 700, gears: [4.6, 2.95, 2.0, 1.48, 1.14, 0.9], final: 3.9, rw: 0.42, cDrag: 0.85, len: 6.4, wid: 2.3, steerMax: 0.55,
      tracK: 0.62, brakeK: 0.75, spinK: 0.4, dmgK: 0.7, vLim: 150, sway: 1.5, landV: 12 },
    arc: { amax: 1.42, kv: 1.8, rmin: 7.8 },
    csp: { bx: 0.12, coast: -0.06, thr: -0.01, liftP: 0.04, pwr: 0.04, out: 1.2, turn: 0.75, w: 0.92, tv: 1.2 },
    stats: { power: 8, grip: 2, weight: 2, drift: 9 },
    price: 62000, pk: 'open', field: ['lastovka'], fieldN: 7, fill: ['kolibri', 'miska'],
    snd: { kind: 'diesel', hz: 1.1, turbo: 0.7, loud: 1.2 },
    expect: { t100: [5.93, 6.95], vmax: [142, 152], latG: [1.82, 1.92], d100: [29.0, 31.2] },   // (a road bus as the TITAN: no off-road loose / landV, tests/fleet.test.js)
    partNames: { headL: 'left head lamps', headR: 'right head lamps', tailL: 'left tail lamp', tailR: 'right tail lamp', wiperFront: 'windscreen wipers' },
    parts: { set: 'truck', ht: 2.75, y0: 0.45,
      extra: {
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.3, h: 0.08, lx: 1.0, lz: -0.66, y: 0.78, on: 'bumperF' },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.3, h: 0.08, lx: 1.0, lz: 0.66, y: 0.78, on: 'bumperF' },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.2, h: 0.05, lx: -0.995, lz: -0.8, y: 1.1 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.2, h: 0.05, lx: -0.995, lz: 0.8, y: 1.1 },
        wiperFront: { z: 0, th: 0.65, m: 0.6, r: 0.5, h: 0.03, lx: 0.985, lz: -0.04, y: 1.5 },
      },
      over: { doorL: { lx: 0.78, y: 1.5 }, doorR: { lx: 0.78, y: 1.5 }, mirrorL: { lx: 0.97, y: 2.0 }, mirrorR: { lx: 0.97, y: 2.0 }, bumperF: { h: 0.2 } },
    },
    // where the garage's parts go (js/deli.js): the rims, the colours, the tint, the underglow, the tyres, the brakes and the nuts for now
    // (the rest after the user's ok on the pictures)
    mounts: { platisca: {}, barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {}, zavore: { s: 1 }, matice: { k: 10, r: 0.2 } },
    // the look (KIT API v1, render.js; look units = metres): one loft, the bus (its windscreen, the side windows' band, the doors at the
    // front, the wheel arches); the bumpers with their lamps, the mirrors on their arms, the roof rack with the luggage in their parts.
    // The livery: the body in the paint, a band rising to the tail in the stripe colour (a swallow's tail), the start number on the sides
    look: {
      body: { len: 6.4, wid: 2.3, roofY: 2.75, wz: 0.2,
        //       x     w     yb    ybelt  wt    yt    cr    kind  tuck
        secs: [[-3.2, 1.06, 0.5, 1.4, 1.0, 2.6, 0.06, 'b', 0.1],     // the tail (its corners round in plan)
          [-3.16, 1.13, 0.48, 1.4, 1.07, 2.65, 0.08, 'r', 0.12],
          [-3.08, 1.15, 0.46, 1.4, 1.09, 2.67, 0.08, 'r', 0.14],
          [2.9, 1.15, 0.46, 1.4, 1.09, 2.67, 0.08, 'r', 0.14],       // the roof's front edge, rounding down
          [2.98, 1.15, 0.46, 1.4, 1.09, 2.62, 0.07, 'gf', 0.14],     // the windscreen, nearly upright, its sides round the corners
          [3.1, 1.13, 0.46, 1.38, 1.07, 2.1, 0.05, 'gf', 0.14],
          [3.16, 1.08, 0.46, 1.36, 1.02, 1.5, 0.03, 'b', 0.14],
          [3.2, 0.98, 0.46, 1.32, 0.95, 1.4, 0.02, 'b', 0.12]],      // the nose: the front face below the windscreen
        eye: { x: 2.55, y: 2.05, near: 0.25, tilt: 0.08, style: 'closed' },
        decalX: 0, decalY: 2.76, decalRz: 0, decalS: 1.3,
        engine: [2.4, 0.9], crush: { x0: -3.1, x1: 2.95, z: 1.1 }, cage: true },
      wheels: { style: 'truck', w: 0.3, wR: 0.3, gap: 0.05, rim: [0.84, 0.85, 0.87] },
      regions: 'none',
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, D = [0.16, 0.16, 0.17], CH = K.chrome, G = K.GLASS, FRM = [0.22, 0.22, 0.24];
        const WIN = [-2.95, 2.0];                 // the side windows' span (the doors' glass forward of it)
        // ---- the bus: its glass (the windscreen, the side band), the doors at the front (their side and window bands) ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (at.end) return P;
          if (e === 0 || e === 8) return D;
          if (kind === 'gf') return e >= 3 && e <= 5 ? G : P;
          if (e === 2 || e === 6) return at.x > WIN[0] && at.x < 2.92 ? G : P;
          return P;
        }, { caps: { front: { col: P, low: 'body', high: 'body' }, rear: { col: P, low: 'body', high: 'body' } },
          regions: ['L', 'R'].map(sd => ({ part: 'door' + sd, x: [2.0, 2.9], bands: ['side', 'window'], side: sd })) });
        const LD = L.decal;
        // the pillars between the side windows (black), the window band's frame under and over it
        LD.band([[WIN[0], 0], [2.92, 0], [2.92, 0.07], [WIN[0], 0.07]], B, null, 0.008);
        LD.band([[WIN[0], 0.92], [2.92, 0.92], [2.92, 1], [WIN[0], 1]], B, null, 0.008);
        for (let x = WIN[0]; x <= 2.01; x += 0.99) LD.band([[x - 0.05, 0], [x + 0.05, 0], [x + 0.05, 1], [x - 0.05, 1]], B, null, 0.009);
        // the livery: a band from the nose rising to the tail, split into a swallow's tail there, a paint line in it
        LD.side([[3.18, 0.72], [3.18, 0.92], [-1.6, 1.3], [-3.18, 1.36], [-3.18, 1.2], [-2.0, 1.12]], S, null, 0.008);
        LD.side([[-2.2, 0.86], [-3.18, 0.98], [-3.18, 1.1], [-2.4, 1.02]], S, null, 0.008);
        LD.side([[3.18, 0.8], [3.18, 0.83], [-1.6, 1.215], [-1.6, 1.185]], K.shade(P, 0.75), null, 0.01);
        LD.side([[2.0, 0.6], [2.03, 0.6], [2.03, 1.4], [2.0, 1.4]], D, null, 0.009);   // the doors' rear shut line
        for (const sd of [-1, 1]) {
          const door = sd < 0 ? 'doorL' : 'doorR';
          K.rect(2.12, 1.25, sd * 1.157, 0.16, 0.035, B, { dir: sd < 0 ? '-z' : 'z', host: door });   // the handle
          K.number(-0.4, 0.95, sd * 1.158, 0.46, { dir: sd < 0 ? '-z' : 'z', w: 0.6 });              // the number on the side, under the windows
          K.hinge(door, [2.88, 0.6, sd * 1.15], [2.88, 2.55, sd * 1.15]);
        }
        for (const z of [-0.55, 0.45]) K.bar([3.13, 1.52, z - 0.48], [3.12, 1.56, z + 0.48], 0.014, B, { n: 4, part: 'wiperFront' });   // the wipers
        K.rect(-3.205, 2.05, 0, 1.6, 0.6, G, { dir: '-x', part: 'body' });                     // the rear window
        K.rect(3.205, 1.05, 0, 0.9, 0.18, B, { dir: 'x', part: 'body' });                       // the grille slot in the nose
        // ---- the bumpers: deep, across the whole nose and tail ----
        K.part('bumperF', () => {
          K.box(3.12, 0.36, 0, 0.2, 0.52, 2.24, 0, S);
          K.box(3.15, 0.32, 0, 0.12, 0.06, 2.1, 0, D);                                          // the lip under it
          for (const sd of [-1, 1]) K.rect(3.221, 0.5, sd * 0.45, 0.36, 0.1, B);              // the brake ducts
        }, { hinge: [[3.15, 0.4, -1.1], [3.15, 0.4, 1.1]] });
        for (const sd of [-1, 1]) { const host = sd < 0 ? 'headL' : 'headR';
          K.headLamp(3.222, 0.76, sd * 0.88, 0.06, { shape: 'rect', w: 0.26, h: 0.13, ring: B, host });
          K.headLamp(3.222, 0.76, sd * 0.58, 0.06, { shape: 'rect', w: 0.26, h: 0.13, ring: B, host }); }
        K.part('bumperR', () => {
          K.box(-3.14, 0.38, 0, 0.16, 0.4, 2.2, 0, D);
          for (const sd of [-1, 1]) K.rect(-3.221, 0.6, sd * 0.85, 0.14, 0.06, [0.75, 0.05, 0.04], { dir: '-x' });   // the reflectors
        }, { hinge: [[-3.15, 0.5, -1.0], [-3.15, 0.5, 1.0]] });
        for (const sd of [-1, 1]) {
          K.rect(-3.205, 1.1, sd * 0.92, 0.18, 0.4, B, { dir: '-x', host: sd < 0 ? 'tailL' : 'tailR' });
          K.tailLamp(-3.207, 1.1, sd * 0.92, 0.14, 0.34, { host: sd < 0 ? 'tailL' : 'tailR' });
        }
        // ---- the mirrors on their arms, by the windscreen's foot ----
        for (const sd of [-1, 1]) K.mirror(3.05, 2.0, sd * 1.32, { w: 0.07, h: 0.36, d: 0.16, col: B, arm: D, z0: sd * 1.13 });
        // ---- the roof rack (a rail frame on feet) with the luggage: hard cases, soft bags, a net over them ----
        K.part('body', () => {
          const y = 2.8, x0 = -2.6, x1 = 2.2, w = 0.95;
          for (const sd of [-1, 1]) K.bar([x0, y, sd * w], [x1, y, sd * w], 0.025, FRM, { n: 6 });
          for (const x of [x0, x1]) K.bar([x, y, -w], [x, y, w], 0.025, FRM, { n: 6 });
          for (let x = x0; x <= x1 + 0.01; x += 1.2) for (const sd of [-1, 1]) K.bar([x, 2.72, sd * w], [x, y, sd * w], 0.022, FRM, { n: 5 });   // the feet
          for (let x = x0 + 0.6; x < x1; x += 0.6) K.bar([x, y, -w], [x, y, w], 0.016, FRM, { n: 5 });   // the slats
          // the luggage (bright cases, no dark ones): its tops at 3.22 m and under (the garage: 3.3)
          const C1 = [0.86, 0.52, 0.12], C2 = [0.2, 0.46, 0.78], C3 = [0.78, 0.76, 0.7], C4 = [0.62, 0.2, 0.18];
          K.box(-2.15, y, -0.45, 0.8, 0.32, 0.75, 0.04, C2); K.box(-2.1, y, 0.45, 0.7, 0.28, 0.7, -0.03, C1);
          K.box(-1.2, y, 0, 0.9, 0.24, 1.7, 0, C3);
          K.box(-1.15, y + 0.24, -0.3, 0.7, 0.18, 0.8, 0.06, C4);
          K.cyl([-0.2, y + 0.19, -0.75], [-0.2, y + 0.19, 0.2], 0.19, C1, { n: 8 });             // a soft bag (a roll)
          K.cyl([0.35, y + 0.17, -0.1], [0.35, y + 0.17, 0.8], 0.17, C2, { n: 8 });
          K.box(1.3, y, 0, 1.1, 0.3, 1.5, 0, C3); K.box(1.35, y + 0.3, 0.25, 0.6, 0.14, 0.7, -0.05, C1);   // the cases at the front
          for (const x of [-1.6, -0.2, 1.3]) K.bar([x, y + 0.36, -w], [x, y + 0.36, w], 0.012, B, { n: 4 });   // the straps over them
        });
        // ---- inside (seen once a part is off): the seats in rows, the dashboard, the wheel; the engine under the driver ----
        K.seat(2.5, 1.0, -0.55, { w: 0.5, back: 0.7 }); K.seat(2.5, 1.0, 0.55, { w: 0.5, back: 0.7 });
        for (const x of [1.2, 0.1, -1.0, -2.1]) for (const z of [-0.6, 0.6]) K.seat(x, 0.95, z, { w: 0.45, back: 0.65 });
        K.box(2.95, 1.0, 0, 0.3, 0.4, 2.0, 0, D, null, false, { inner: true, part: 'body' });
        K.cyl([2.85, 1.42, -0.55], [2.75, 1.52, -0.55], 0.2, [0.1, 0.1, 0.11], { n: 8, inner: true, part: 'body' });
        K.engine(2.4, 0.5, 0, { l: 1.0, w: 0.7, h: 0.45, inner: true });
      },
    },
  });
})();
