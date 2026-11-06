/* Vehicle 'vran' — VRAN 01: a one-off short 4x4 built by hand, open, on big tyres, set up for sliding (invented; no real model).
   Signature features: 1) an open two-door tub under a black roll cage, the light bar across its front over the upright windscreen,
   2) the flat bonnet with a raised scoop for the big V8, a ridge from it down to the narrow grille between slim angular lamps, 3) big
   all-terrain tyres on bronze beadlock rims under wide black flares, 4) the plate bumper with the winch and red shackles, the spare
   wheel on the tailgate, 5) the half doors and the rock sliders under them, the rear tub under a flat cover. L 4.12 W 2.12 H 1.88,
   wheelbase 2.45, overhangs F 0.87 R 0.80 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  // the garage's head lamp in the place of the slim lamp in the nose (u out from the car's middle, v up; metres round z 0.6, y 0.95): its
  // outer bottom corner cut off; every option takes this outline
  const SLIM = [[0.15, -0.015], [0.11, -0.045], [-0.15, -0.045], [-0.15, 0.04], [0.15, 0.04]];
  VEHICLE_DEFS.push({
    id: 'vran', name: 'VRAN 01', cat: 'posebni', ord: 4, drive: 'AWD',
    desc: 'Izvenserijski odprt terenec 4x4 z varnostno kletko, vitlom in rezervnim kolesom zadaj.',
    // the AWD layer turned round for sliding (docs/novi-avti-2.md): the power swings the short tail round (pwr), a big slide for the turn
    // (tv), held long (out); short and light for a 4x4: quick to turn in (kI); loose on dirt and grass, a soft landing (loose, landV).
    // The driving school's drift (tools/novi-avti-2/drift.js): Jezero 2288, Spa 560, Bathurst 765 (ŠKORPIJON H 1998 / 202 / 836)
    phys: { mass: 1750, a: 1.2, b: 1.25, kI: 1.15, kw: 410, redline: 6800, idle: 750, gears: [3.4, 2.25, 1.62, 1.26, 1.02, 0.86], final: 5.4, rw: 0.42, cDrag: 0.6, len: 4.15, wid: 2.1, steerMax: 0.72,
      tracK: 1.0, brakeK: 0.95, spinK: 0.45, loose: 1.2, looseDrag: 0.45, landV: 20, landK: 0.55, sway: 1.5 },
    arc: { amax: 1.72, kv: 1.9, rmin: 4.6 },
    csp: { bx: 0.15, coast: -0.045, thr: 0.02, liftP: 0.1, pwr: 0.14, out: 1.35, turn: 0.95, w: 0.95, tv: 1.5 },
    stats: { power: 9, grip: 7, weight: 2, drift: 10 },
    price: 75000, pk: 'open', field: ['vran'],
    snd: { kind: 'v8', hz: 0.9, loud: 1.25 },
    expect: { t100: [2.8, 3.12], vmax: [199, 215], latG: [2.09, 2.19], d100: [23.8, 25.6] },   // (measured 2.92 / 207 / 2.14 / 24.7)
    partNames: { tailgate: 'tailgate', headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamp', tailR: 'right tail lamp' },
    // the open car's set (no boot lid: the tailgate in its place) and its own: the tailgate with the spare wheel, each lamp
    parts: { set: 'open', ht: 1.9, y0: 0.56, drop: ['trunk'],
      extra: {
        tailgate: { z: 1, th: 0.78, m: 12, rW: 0.4, h: 0.12, lx: -0.88, lz: 0, y: 0.98 },   // (with the spare wheel on it)
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.15, h: 0.05, lx: 0.93, lz: -0.57, y: 0.95 },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.15, h: 0.05, lx: 0.93, lz: 0.57, y: 0.95 },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.15, h: 0.05, lx: -0.87, lz: -0.69, y: 0.9 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.15, h: 0.05, lx: -0.87, lz: 0.69, y: 0.9 },
      },
      // (where the look has them: the half doors low, the mirrors on the cowl's corners, the bonnet's middle, the bumpers under the tub; the
      // fenders and the quarters lie as thick as their wide flares)
      over: { doorL: { lx: -0.08, y: 0.86 }, doorR: { lx: -0.08, y: 0.86 }, mirrorL: { lx: 0.21, lz: -0.9, y: 1.24 }, mirrorR: { lx: 0.21, lz: 0.9, y: 1.24 },
        hood: { lx: 0.54, y: 1.17 }, bumperF: { lx: 0.95, y: 0.52 }, bumperR: { lx: -0.9, y: 0.5 },
        fenderL: { h: 0.13 }, fenderR: { h: 0.13 }, quarterL: { h: 0.14 }, quarterR: { h: 0.14 } } },
    // where the garage's parts go (js/deli.js, look units): the head lamps in the place of the slim lamps in the nose (every option in
    // their outline, SLIM), in the lamps' parts; the rims. No wing: the tub is open, the cage carries the light bar
    mounts: {
      zarometi: { x: 1.936, y0: 0.95, lean: 0, zc: 0.6, yc: 0.95, s: 0.42, hosts: ['headL', 'headR'], shape: SLIM, bulge: 0, ringW: 0.008 },
      platisca: {},
    },
    // the look (KIT API v1, render.js; look units = metres: the centre of mass at x 0, the front axle at 1.20, the rear one at -1.25): one
    // loft from the tailgate to the nose: the rear tub under its flat canvas cover, the cockpit (its top open from the hoop to the scuttle:
    // the lining, the floor, the bulkheads in the outer shell), the scuttle under the windscreen (closed: the dashboard's top), the flat
    // bonnet, the nose; the regions: the half doors, the front fenders, the rear quarters (the tub's sides), the bonnet; the end caps: the
    // tailgate over the rear bumper's place, the nose (the body's). The cage, the windscreen in its frame, the seats and the driver in sight
    // from the chase camera
    look: {
      body: { len: 4.15, wid: 2.1, wz: 0.18,
        //       x      w      yb    ybelt  wt     yt     cr     kind  tuck
        secs: [[-1.76, 0.86, 0.58, 1.11, 0.83, 1.14, 0.0, 'b', 0.12],    // the tail's face: the tailgate; the rear tub under its flat cover
          [-0.72, 0.86, 0.56, 1.11, 0.83, 1.14, 0.0, 'r', 0.12],         // the hoop: the cockpit open on top from here to the scuttle
          [0.12, 0.86, 0.56, 1.11, 0.83, 1.14, 0.0, 'gf', 0.12],         // the scuttle under the windscreen (closed: the dashboard's top)
          [0.4, 0.86, 0.56, 1.1, 0.84, 1.16, 0.012, 'b', 0.12],          // the cowl: the windscreen's base, the doors' front edge
          [1.84, 0.86, 0.58, 1.06, 0.84, 1.1, 0.014, 'b', 0.12],         // the flat bonnet's front edge
          [1.93, 0.84, 0.62, 1.02, 0.81, 1.06, 0.006, 'b', 0.1]],        // the nose: the grille's panel between the lamps
        eye: { x: -0.36, y: 1.58, near: 0.2, tilt: 0.06, style: 'open' },   // (sitting high behind the upright windscreen, its frame 12 cm over the eyes)
        decalX: 1.5, decalY: 1.13, decalRz: -0.04, decalS: 0.5, decalPart: 'hood',   // (the start number on the bonnet, ahead of the scoop)
        crush: { x0: 0.25, x1: 0.45, z: 0.8 } },                         // (a roll-over folds the windscreen's frame; the cage stands)
      wheels: { style: 'knob', w: 0.34, rimK: 0.55, rim: [0.52, 0.39, 0.21], cap: [0.13, 0.13, 0.14], gap: 0.07 },
      // the parts' regions (look units): the half doors from the tub's sides behind the cowl (their top edge with them), the fenders forward
      // of them, the quarters behind them (the tub's sides round the rear wheels), the bonnet over the fenders' tops
      regions: [
        { part: 'doorL', x: [-0.72, 0.4], bands: ['side', 'window'], side: 'L' }, { part: 'doorR', x: [-0.72, 0.4], bands: ['side', 'window'], side: 'R' },
        { part: 'fenderL', x: [0.4, 1.95], bands: ['tuck', 'side', 'window'], side: 'L' }, { part: 'fenderR', x: [0.4, 1.95], bands: ['tuck', 'side', 'window'], side: 'R' },
        { part: 'quarterL', x: [-1.95, -0.72], bands: ['tuck', 'side', 'window'], side: 'L' }, { part: 'quarterR', x: [-1.95, -0.72], bands: ['tuck', 'side', 'window'], side: 'R' },
        { part: 'hood', x: [0.4, 1.95], bands: ['edge', 'crown'], top: true },
      ],
      build(K) {
        const P = K.paint, B = K.black, G = K.GLASS, DK = [0.08, 0.08, 0.09], D = [0.12, 0.12, 0.13], T = [0.1, 0.1, 0.11], LED = [0.95, 0.96, 1.0];
        const AL = [0.62, 0.63, 0.66], RED = K.rgb(0xc0392b), AMB = K.rgb(0xff9a1e), SEAT = [0.16, 0.16, 0.17], TN = [0.11, 0.11, 0.12];
        // ---- the shell: the paint; the rear tub's top its canvas cover, the cockpit open on top, the scuttle's top dark (the dashboard under
        //      the windscreen); the lower edge dark, black ledges in the arches; the nose's face dark round the grille and the lamps; the
        //      tailgate over the rear bumper's place ----
        const L = K.loft(K.secs(K.body.secs), (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch ? B : DK;
          if (k === 0 && e >= 3 && e <= 5) return TN;
          if (kind === 'r' && e >= 3 && e <= 5) return null;
          if (kind === 'gf' && e >= 3 && e <= 5) return D;
          return P;
        }, { caps: { front: { col: DK, low: 'body', high: 'body' }, rear: { col: P, colLow: DK, cut: 0.8, low: 'body', high: 'tailgate' } } });
        const DC = L.decal;
        // the doors' shut lines, their handles; the black strip along the tub's top edge
        for (const x of [0.4, -0.72]) DC.side([[x - 0.008, 0.62], [x + 0.008, 0.62], [x + 0.008, 1.1], [x - 0.008, 1.1]], DK, null, 0.008);
        for (const sd of [-1, 1]) K.rect(-0.6, 1.02, sd * 0.862, 0.12, 0.03, B, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' });
        // ---- the wide black flares over the big tyres (with the fenders and the quarters) ----
        for (const A of K.arches) for (const sd of [-1, 1]) K.flare(A.x, A.r + 0.01, A.r + 0.09, sd * 0.83, sd * 1.06, DK, { n: 4 });
        // ---- the nose: the narrow grille between the slim lamps (each a part of its own; the garage's in their place: K.deli, mounts.zarometi),
        //      an LED strip under each lamp, the indicators at its corners ----
        K.grille(1.932, 0.86, 0, 0.5, 0.28, { slats: 4, slatCol: [0.3, 0.3, 0.32], frame: P, frameH: 0.02 });
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(1.936, 0.95, sd * 0.6, 0.05, { pts: SLIM, d: 0.02, ring: null, host: sd < 0 ? 'headL' : 'headR' }); });
        for (const sd of [-1, 1]) {
          K.rect(1.935, 0.875, sd * 0.6, 0.28, 0.018, LED, { host: sd < 0 ? 'headL' : 'headR' });
          K.rect(1.934, 0.8, sd * 0.74, 0.08, 0.05, AMB);
        }
        // ---- the bonnet: the raised scoop for the V8 (its intake facing forward), the ridge from it down to the grille ----
        K.skin([[1.22, 0.11, 0.3], [0.6, 0.025, 0.34]].map(([x, h, w]) => { const y = L.topY(x, 0) - 0.004; return [[x, y, -w], [x, y + h, -w * 0.84], [x, y + h, w * 0.84], [x, y, w]]; }), P, DK, null, { part: 'hood' });
        K.skin([[1.84, 0.012, 0.05], [1.22, 0.05, 0.12]].map(([x, h, w]) => { const y = L.topY(x, 0) - 0.004; return [[x, y, -w], [x, y + h, 0], [x, y, w]]; }), P, P, null, { part: 'hood' });
        // ---- the plate bumper under the nose: the winch in its middle, the red shackles, two square lamps ----
        K.part('bumperF', () => {
          K.box(1.96, 0.4, 0, 0.16, 0.22, 1.8, 0, DK, null, true);
          K.cyl([2.0, 0.52, -0.2], [2.0, 0.52, 0.2], 0.065, [0.3, 0.3, 0.32], { n: 6, capA: DK, capB: DK });
          K.rect(2.066, 0.52, 0, 0.16, 0.06, AL);
          for (const sd of [-1, 1]) { K.rect(2.042, 0.46, sd * 0.52, 0.05, 0.08, RED); K.rect(2.042, 0.53, sd * 0.76, 0.1, 0.07, LED); }
        }, { hinge: [[1.9, 0.4, -0.9], [1.9, 0.4, 0.9]] });
        // ---- the windscreen: one pane facing forward in its black frame; the small mirrors on the cowl's corners ----
        K.face([[0.42, 1.17, 0.78], [0.42, 1.17, -0.78], [0.31, 1.7, -0.76], [0.31, 1.7, 0.76]], G, { part: 'body' });
        K.part('body', () => {
          K.bar([0.305, 1.715, -0.79], [0.305, 1.715, 0.79], 0.025, B, { n: 4 });
          for (const sd of [-1, 1]) K.bar([0.425, 1.16, sd * 0.8], [0.305, 1.715, sd * 0.79], 0.025, B, { n: 4 });
        });
        for (const sd of [-1, 1]) K.mirror(0.44, 1.24, sd * 0.94, { col: B, w: 0.06, h: 0.13, d: 0.1, z0: sd * 0.86, crack: 1 });
        // ---- the roll cage (never crushed or dented): the front legs beside the windscreen up to the bar over it, the side bars back to the
        //      main hoop behind the seats (a diagonal in it), the braces down to the tub's rear corners; the light bar on the front bar ----
        const hx = -0.72, fx = 0.27, cy = 1.78, cz = 0.8;
        K.cage([[[0.44, 1.14, cz + 0.02], [fx, cy, cz]], [[0.44, 1.14, -cz - 0.02], [fx, cy, -cz]], [[fx, cy, -cz], [fx, cy, cz]],
          [[fx, cy, cz], [hx, cy, cz - 0.02]], [[fx, cy, -cz], [hx, cy, -cz + 0.02]], [[hx, 1.12, cz], [hx, cy, cz - 0.02]], [[hx, 1.12, -cz], [hx, cy, -cz + 0.02]],
          [[hx, cy, -cz + 0.02], [hx, cy, cz - 0.02]],
          [[hx, cy, cz - 0.04], [-1.66, 1.13, cz - 0.06]], [[hx, cy, -cz + 0.04], [-1.66, 1.13, -cz + 0.06]]], 0.03, T, { n: 5, noCrush: true, noDent: true });
        K.part('body', () => {
          K.box(fx, cy + 0.02, 0, 0.09, 0.08, 1.3, 0, DK, null, false);
          K.rect(fx + 0.046, cy + 0.06, 0, 1.24, 0.045, LED);
        }, { noCrush: true, noDent: true });
        // ---- the tail: the slim lamps on the tub's corners (each a part of its own, in its black surround), the bumper under the tub with
        //      its shackles ----
        for (const sd of [-1, 1]) { const tp = sd < 0 ? 'tailL' : 'tailR';
          K.rect(-1.761, 0.9, sd * 0.72, 0.13, 0.3, B, { dir: '-x', part: tp }); K.tailLamp(-1.764, 0.9, sd * 0.72, 0.08, 0.24, { host: tp }); }
        K.part('bumperR', () => {
          K.box(-1.82, 0.4, 0, 0.12, 0.18, 1.7, 0, DK, null, true);
          for (const sd of [-1, 1]) K.rect(-1.882, 0.47, sd * 0.6, 0.05, 0.08, RED, { dir: '-x' });
        }, { hinge: [[-1.78, 0.4, -0.8], [-1.78, 0.4, 0.8]] });
        // ---- the tailgate (hinged on its left): its handle; the spare wheel on its carrier (with it, or by itself: the sub-range 'spare') ----
        K.part('tailgate', () => K.rect(-1.762, 1.0, 0.6, 0.12, 0.04, B, { dir: '-x' }), { hinge: [[-1.76, 0.82, -0.8], [-1.76, 1.1, -0.8]] });
        K.part('tailgate', () => {
          K.tyre(-1.905, 1.02, 0, { axis: 'x', face: -1, w: 0.28 });
        }, { sub: 'spare' });
        // ---- the rock sliders under the doors, the rear axle under the tub (in sight from behind) ----
        K.part('body', () => {
          for (const sd of [-1, 1]) K.bar([-0.72, 0.5, sd * 0.9], [0.66, 0.5, sd * 0.9], 0.035, T, { n: 4 });
          K.bar([-1.25, 0.42, -0.72], [-1.25, 0.42, 0.72], 0.07, DK, { n: 5 });
        });
        K.hinge('hood', [0.42, 1.16, -0.7], [0.42, 1.16, 0.7]);
        K.hinge('doorL', [0.4, 0.6, -0.86], [0.4, 1.1, -0.86]); K.hinge('doorR', [0.4, 0.6, 0.86], [0.4, 1.1, 0.86]);
        // ---- the cockpit (in sight): the seats, the driver in the left seat, his wheel (a flat disc leaning back on its column) ----
        for (const sd of [-1, 1]) K.seat(-0.3, 0.9, sd * 0.4, { w: 0.5, l: 0.5, back: 0.74, tilt: 0.2, col: SEAT });
        K.driver(-0.46, 1.58, -0.4, { r: 0.13, lean: 0.14, suit: [0.22, 0.24, 0.27], hands: [-0.08, 1.25, 0.16] });
        K.part('body', () => {
          const C = [-0.05, 1.24, -0.4], u = [-Math.sin(0.6), Math.cos(0.6), 0], pt = (a) => [C[0] + 0.17 * Math.sin(a) * u[0], C[1] + 0.17 * Math.sin(a) * u[1], C[2] + 0.17 * Math.cos(a)];
          K.face(Array.from({ length: 8 }, (_, i) => pt(-i / 8 * Math.PI * 2)), B);
          K.bar(C, [0.1, 1.12, -0.4], 0.02, D, { n: 4 });
        });
        // ---- inside (seen once a part is off): the V8 under the bonnet ----
        K.engine(1.25, 0.64, 0, { l: 0.75, w: 0.7, h: 0.48, inner: true });
      },
    },
  });
})();
