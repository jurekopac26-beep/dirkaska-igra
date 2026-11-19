/* Vehicle 'tur' — TUR 6x6: an off-road double-cab pickup on six wheels, all six driven, set up for sliding (invented; no real model).
   Signature features: 1) the third axle under the long open bed (the tandem: the middle and the rear wheels), 2) the steel bumper with
   the bull bar, the winch and the big grille between round lamps, 3) the snorkel up the right pillar, the light bar over the windscreen,
   the roof rack, 4) the sports bar behind the cab and the spare wheel lying in the bed, 5) the dark flares over all six wheels. L 6.00
   W 2.20 H 2.15, the axles at +2.00 / -0.95 / -2.30 (m). The physics has two axles (the front one and the rear-most: a, b); the middle
   one is the look's (look.wheels.mid: its wheels turn with the rear ones), all six driven as the game's AWD (docs/novi-avti-2.md). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'tur', name: 'TUR 6x6', cat: 'teren', ord: 6, drive: 'AWD',
    desc: 'Terenski poltovornjak na šestih gnanih kolesih: snorkel, svetlobni pas, dolg keson.',
    // the AWD layer turned round for sliding (docs/novi-avti-2.md): the power swings the long tail round (pwr), a big slide for the turn
    // (tv), held long (out); tall, soft and heavy: slow to turn in (turn, kI), loose on dirt and grass (loose), a soft landing (landV).
    // The driving school's drift (tools/novi-avti-2/drift.js): Jezero 1985, Spa 489, Bathurst 717 (ŠKORPIJON H 1998 / 202 / 836)
    phys: { mass: 3300, a: 2.0, b: 2.3, kI: 1.5, kw: 640, redline: 6000, idle: 700, gears: [3.4, 2.2, 1.55, 1.2, 0.98, 0.82], final: 4.6, rw: 0.47, cDrag: 0.66, len: 6.0, wid: 2.2, steerMax: 0.66,
      tracK: 0.85, brakeK: 0.85, spinK: 0.5, loose: 1.2, looseDrag: 0.45, landV: 18, landK: 0.55, sway: 1.7 },
    arc: { amax: 1.66, kv: 1.85, rmin: 6.4 },
    csp: { bx: 0.14, coast: -0.04, thr: 0.02, liftP: 0.1, pwr: 0.14, out: 1.35, turn: 0.85, w: 0.95, tv: 1.55 },
    stats: { power: 10, grip: 5, weight: 1, drift: 10 },
    price: 80000, pk: 'open', field: ['tur'], fieldN: 9, fill: ['medved', 'pescenjak'],   // (a bigger race: 9 of its own through the field, the rest these two off-roaders of its pace (3.46 s / 190 and 4.08 s / 187 km/h): 99 of its own would not fit the phone's budget)
    snd: { kind: 'v8', hz: 0.8, loud: 1.3 },
    expect: { t100: [3.27, 3.67], vmax: [180, 196], latG: [1.97, 2.07], d100: [26.2, 28.0] },   // (measured 3.47 / 188 / 2.02 / 27.1)
    partNames: { tailgate: 'tailgate', spare: 'spare wheel', headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamp', tailR: 'right tail lamp' },
    // the truck's set (the bumpers, the doors, the mirrors) and the pickup's own: the hood, the front fenders, the tailgate, the spare wheel, each lamp
    parts: { set: 'truck', ht: 2.15, y0: 0.6,
      extra: {
        hood: { lx: 0.73 },
        fenderL: { lz: -0.95, f: 0.42, h: 0.13 },
        fenderR: { lz: 0.95, f: 0.42, h: 0.13 },
        tailgate: { z: 1, th: 0.7, m: 14, rW: 0.45, h: 0.08, lx: -1.0, lz: 0, f: 0.5 },
        spare: { z: 1, th: 1, m: 14, r: 0.47, h: 0.36, lx: -0.633, lz: 0, y: 1.02, spare: 1 },   // (the wheel lying in the bed; Core's spare: it rocks from 50 % of the damage, off at 80 %)
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.2, h: 0.08, lx: 0.98, lz: -0.67, y: 1.12 },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.2, h: 0.08, lx: 0.98, lz: 0.67, y: 1.12 },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.17, h: 0.05, lx: -1.0, lz: -0.85, y: 1.1 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.17, h: 0.05, lx: -1.0, lz: 0.85, y: 1.1 },
      },
      over: { doorL: { lx: 0.25 }, doorR: { lx: 0.25 }, mirrorL: { lx: 0.44 }, mirrorR: { lx: 0.44 } } },   // (the cab's doors and mirrors ahead of the middle)
    // where the garage's parts go (js/deli.js, look units): the head lamps where the round lamps are, in the lamps' parts; the rims on its
    // six wheels (no wing: the bed is open, the cab's roof carries the rack)
    mounts: {
      zarometi: { x: 2.955, y0: 1.12, lean: 0, zc: 0.74, yc: 1.12, s: 0.22, hosts: ['headL', 'headR'], depth: 0.04 },
      platisca: {},
    },
    // the look (KIT API v1, render.js; look units = metres: the centre of mass at x 0, the front axle at 2.00, the rear-most at -2.30, the
    // middle one at -0.95): one loft from the tailgate to the nose: the bed (its top open), the cab's back wall with its window, the roof,
    // the windscreen, the long hood, the nose; the regions cut it into the front doors (their glass with them), the fenders and the hood;
    // the end caps into the tailgate over the rear valance and the nose over the front bumper
    look: {
      body: { len: 6.0, wid: 2.2, roofY: 2.15,
        //       x      w     yb    ybelt  wt    yt    cr    kind  tuck
        secs: [[-3.05, 1.02, 0.74, 1.3, 1.0, 1.38, 0.01, 'b', 0.12],    // the tailgate's face
          [-2.99, 1.05, 0.72, 1.34, 1.03, 1.42, 0.01, 'b', 0.12],       // the bed's end (open on top from here)
          [-0.72, 1.05, 0.72, 1.36, 1.03, 1.44, 0.01, 'gr', 0.12],      // the bed's front (the headboard); its segment: the cab's back wall
          [-0.68, 1.05, 0.72, 1.38, 0.92, 2.1, 0.03, 'r', 0.1],         // the roof's back edge
          [0.78, 1.05, 0.72, 1.38, 0.92, 2.12, 0.03, 'gf', 0.1],        // the windscreen's top
          [1.55, 1.06, 0.72, 1.34, 0.98, 1.52, 0.03, 'b', 0.12],        // its base (the cowl)
          [2.8, 1.05, 0.72, 1.3, 0.98, 1.46, 0.03, 'b', 0.12],          // the long hood's front
          [2.92, 1.0, 0.76, 1.22, 0.94, 1.38, 0.02, 'b', 0.12],
          [2.95, 0.96, 0.8, 1.14, 0.9, 1.3, 0.01, 'b', 0.1]],           // the nose: the grille between the round lamps
        eye: { x: 0.2, y: 1.78 },
      },
      wheels: { style: 'knob', w: 0.36, rim: [0.16, 0.16, 0.17], cap: [0.2, 0.2, 0.21], gap: 0.08, mid: -0.95 },   // (mid: 1.35 m ahead of the rear axle: the garage lift's pad stands 15 cm off the rubber of both tandem axles between them)
      regions: [
        { part: 'doorL', x: [0.08, 1.45], bands: ['side', 'window'], side: 'L' }, { part: 'doorR', x: [0.08, 1.45], bands: ['side', 'window'], side: 'R' },
        { part: 'fenderL', x: [1.55, 2.92], bands: ['tuck', 'side', 'window'], side: 'L' }, { part: 'fenderR', x: [1.55, 2.92], bands: ['tuck', 'side', 'window'], side: 'R' },
        { part: 'hood', x: [1.55, 2.92], bands: ['edge', 'crown'] }],
      build(K) {
        const P = K.paint, B = K.black, G = K.GLASS, DK = [0.08, 0.08, 0.09], D = [0.12, 0.12, 0.13], LED = [0.95, 0.96, 1.0], ST = [0.3, 0.3, 0.32];
        // the shell: the paint; the bed open on top (segment 1), the cab's back wall (2) with its window, the roof (3), the windscreen (4);
        // the side windows along the roof; the lower edge dark
        const L = K.loft(K.secs(K.body.secs), (k, e, kind, at) => {
          if (e === 0 || e === 8) return DK;
          if (k === 1 && e >= 3 && e <= 5) return null;
          if (kind === 'gf' && e >= 2 && e <= 6) return G;
          if (kind === 'r' && (e === 2 || e === 6)) return G;
          if (kind === 'gr' && e >= 3 && e <= 5) return G;
          return P;
        }, { caps: { front: { col: P, colLow: DK, cut: 0.95, low: 'bumperF', high: 'body' }, rear: { col: P, colLow: DK, cut: 0.78, low: 'bumperR', high: 'tailgate' } } });
        const DC = L.decal;
        // the B-pillar, the dark cladding under the doors, the start number and the handles on the front doors
        DC.band([[0.02, 0], [0.14, 0], [0.14, 1], [0.02, 1]], B, null, 0.01);
        DC.side([[-0.6, 0.76], [1.42, 0.76], [1.42, 0.92], [-0.6, 0.92]], DK, null, 0.006);
        for (const sd of [-1, 1]) {
          const door = sd < 0 ? 'doorL' : 'doorR', f = sd < 0 ? '-z' : 'z';
          K.number(0.8, 1.06, sd * 1.06, 0.36, { dir: f, host: door });
          K.rect(0.3, 1.3, sd * 1.058, 0.16, 0.035, B, { dir: f, host: door });
          K.hinge(door, [1.45, 0.8, sd * 1.05], [1.45, 1.36, sd * 1.05]);
        }
        // the dark flares over all six wheels, the mud flaps behind the last ones, the steps under the doors
        for (const A of K.arches) for (const sd of [-1, 1]) K.flare(A.x, 0.56, 0.64, sd * 1.0, sd * 1.1, DK);
        for (const sd of [-1, 1]) {
          K.box(-2.82, 0.12, sd * 0.98, 0.02, 0.46, 0.3, 0, DK, null, true, { part: 'body' });
          K.box(0.4, 0.58, sd * 1.02, 1.4, 0.05, 0.16, 0, DK, null, false, { part: 'body' });
        }
        // the nose: the big grille, the round lamps (each a part of its own; the garage's lamps in their place: K.deli, mounts.zarometi)
        K.grille(2.955, 1.08, 0, 1.0, 0.3, { slats: 4 });
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(2.955, 1.12, sd * 0.74, 0.11, { ring: DK, host: sd < 0 ? 'headL' : 'headR' }); });
        // the steel bumper with the bull bar and the winch
        K.part('bumperF', () => {
          K.box(2.92, 0.62, 0, 0.2, 0.22, 2.0, 0, DK);
          for (const sd of [-1, 1]) K.bar([3.0, 0.84, sd * 0.78], [3.0, 1.3, sd * 0.6], 0.04, DK, { n: 6 });
          K.bar([3.0, 1.3, -0.6], [3.0, 1.3, 0.6], 0.04, DK, { n: 6 });
          K.box(2.98, 0.66, 0, 0.12, 0.12, 0.5, 0, ST);
        }, { hinge: [[2.85, 0.7, -0.9], [2.85, 0.7, 0.9]] });
        // the snorkel up the right pillar, the light bar over the windscreen, the roof rack's rails
        K.cyl([1.5, 1.32, 1.08], [0.9, 2.05, 1.06], 0.07, DK, { n: 8, part: 'body' });
        K.box(0.62, 2.13, 0, 0.12, 0.08, 1.5, 0, DK);
        K.rect(0.682, 2.17, 0, 1.4, 0.05, LED);
        for (const sd of [-1, 1]) K.bar([-0.55, 2.16, sd * 0.78], [0.5, 2.16, sd * 0.78], 0.02, DK, { n: 5 });
        // the bed: the sports bar behind the cab, the spare wheel lying in it
        for (const sd of [-1, 1]) K.bar([-0.9, 1.44, sd * 0.98], [-0.9, 1.95, sd * 0.86], 0.045, DK, { n: 6 });
        K.bar([-0.9, 1.95, -0.86], [-0.9, 1.95, 0.86], 0.045, DK, { n: 6 });
        K.part('spare', () => K.tyre(-1.9, 1.02, 0, { axis: 'y' }));   // (a part of its own: Core's spare)
        // the tail: the lamps on the bed's corners (each a part of its own, in its black surround), the rear bumper with its step
        for (const sd of [-1, 1]) { const tp = sd < 0 ? 'tailL' : 'tailR';
          K.rect(-3.053, 1.1, sd * 0.9, 0.18, 0.36, B, { dir: '-x', part: tp }); K.tailLamp(-3.056, 1.1, sd * 0.9, 0.12, 0.3, { host: tp }); }
        K.part('bumperR', () => K.box(-3.02, 0.6, 0, 0.18, 0.16, 2.0, 0, DK), { hinge: [[-2.95, 0.68, -0.9], [-2.95, 0.68, 0.9]] });
        // the big black mirrors on the doors
        for (const sd of [-1, 1]) K.mirror(1.32, 1.64, sd * 1.14, { col: DK, w: 0.18, h: 0.24 });
        K.hinge('hood', [1.55, 1.5, -0.7], [1.55, 1.5, 0.7]);
        K.hinge('tailgate', [-3.02, 0.76, -0.8], [-3.02, 0.76, 0.8]);
        // inside (seen once a part is off): the front seats, the rear bench, the dashboard, the V8 in the bay
        for (const sd of [-1, 1]) K.seat(0.35, 0.86, sd * 0.45, { w: 0.55, back: 0.78 });
        K.seat(-0.4, 0.86, 0, { w: 1.6, back: 0.7 });
        K.box(1.3, 1.1, 0, 0.3, 0.24, 1.8, 0, D, null, false, { inner: true, part: 'body' });
        K.engine(2.2, 0.8, 0, { l: 0.9, w: 0.75, h: 0.55 });
      },
    },
  });
})();
