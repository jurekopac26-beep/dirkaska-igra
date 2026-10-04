/* Vehicle 'kamen' — KAMEN PUŠČAVA: a desert rally-raid truck with a bonneted cab. Signature features: 1) a bonnet in front of the cab
   over the engine, 2) huge single tyres on tall arches, 3) spare wheels on the flanks behind the cab, 4) a boxy service body with a roof
   hatch, 5) a grille guard and roof lamps. L 6.30 W 2.50 H 3.30, wheelbase 4.20, overhangs F 1.15 R 0.95 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'kamen', name: 'KAMEN PUŠČAVA', cat: 'tovornjaki', ord: 2, drive: 'AWD',
    desc: 'Puščavski relijski tovornjak s kabino za motorjem, velikimi kolesi in rezervnimi kolesi.',
    phys: { mass: 7000, a: 2, b: 2.2, kI: 1.75, kw: 800, redline: 2600, idle: 600, gears: [6, 4.7, 3.7, 2.95, 2.4, 1.95, 1.6, 1.33, 1.13, 1], final: 4.31, rw: 0.65, cDrag: 0.95, len: 6.3, wid: 2.5, steerMax: 0.55,
      tracK: 0.5, brakeK: 0.6, spinK: 0.5, loose: 1.3, looseDrag: 0.4, landV: 22, landK: 0.5, dmgK: 0.55, sway: 1.8 },
    arc: { amax: 1.4, kv: 1.8, rmin: 8 },
    csp: { bx: 0.12, coast: -0.07, thr: -0.015, liftP: 0, pwr: 0.03, out: 1.1, turn: 0.7, w: 0.9, tv: 1.25 },   // (the AWD layer: steady, straightens quickly; its own bx, coast, thr, pwr, out, turn, w, tv)
    stats: { power: 10, grip: 1, weight: 1, drift: 10 },
    price: 70000, pk: 'open', field: ['kamen'], fieldN: 7,
    snd: { kind: 'diesel', hz: 0.85, turbo: 0.7, loud: 1.3 },
    expect: { t100: [6.01, 7.06], vmax: [135, 143], latG: [1.79, 1.89], d100: [33.7, 37.3] },
    partNames: { spareL: 'spare wheel', spareR: 'spare wheel' },
    parts: { set: 'truck', ht: 3.3, y0: 0.75,
      extra: {
        hood: { lx: 0.7, y: 1.48 },                                                  // (the tilting front: the bonnet with its wings)
        spareL: { z: 2, th: 0.62, m: 12, r: 0.6, h: 0.4, lx: -0.356, lz: -0.928, y: 1.88 },
        spareR: { z: 3, th: 0.62, m: 12, r: 0.6, h: 0.4, lx: -0.356, lz: 0.928, y: 1.88 },
      },
      // (where the look has them: the bumper with its grille guard, the cab's doors and its mirrors on the A-pillars; a lost one flies off
      // from there)
      over: { bumperF: { y: 1.36 }, bumperR: { y: 0.91 }, doorL: { lx: 0.204, y: 2.07 }, doorR: { lx: 0.204, y: 2.07 }, mirrorL: { lx: 0.37, y: 2.45 }, mirrorR: { lx: 0.37, y: 2.45 } },
    },
    // the look (KIT API v1, render.js; look units = metres): three lofts and the running gear. The cab (its doors with their glass, the
    // windscreen, the roof with its lamp bar); the tilting front ('hood': the bonnet over the engine with the grille, and the wings over the
    // front wheels with their tall arches, one piece as on a desert truck); the service body behind (a box narrower than the cab, its roof
    // hatch, its lockers, the ladder at the back) with a spare wheel standing on each flank in front of it; the frame, the axles, the tanks
    // and the steps under it all; the steel bumper with the grille guard, the rear bumper bar. The livery: the paint, a stripe band along
    // the sides, the cab's roof and two bonnet stripes in the stripe colour; the start number on the box's roof and on both doors
    look: {
      body: { len: 6.3, wid: 2.5, roofY: 3.05,
        //       x     w     yb    ybelt  wt    yt    cr    kind  tuck
        secs: [[-0.38, 1.17, 1.3, 2.2, 1.08, 2.99, 0.06, 'r', 0.06],    // the cab's rear wall (the box hides it)
          [0.97, 1.17, 1.3, 2.2, 1.08, 2.99, 0.06, 'gf', 0.06],         // the roof's front edge: the windscreen, raked a little
          [1.19, 1.17, 1.3, 2.2, 1.1, 2.22, 0.03, 'b', 0.06],           // its base: the cowl over the bonnet's end
          [1.25, 1.15, 1.3, 2.16, 1.1, 2.18, 0.02, 'b', 0.06]],         // the cab's front face beside the bonnet (the bulkhead once it is off)
        eye: { x: 0.52, y: 2.64, near: 0.25, tilt: 0.14, style: 'closed' },   // (high up behind the windscreen, the bonnet ahead)
        decalX: -2.3, decalY: 2.8, decalRz: 0, decalS: 1.15,              // (the start number on the box's flat roof, behind the hatch)
        crush: { x0: -0.3, x1: 1.12, z: 1.06 }, cage: true },          // (only the cab's roof crushes; a rally truck's roll cage)
      wheels: { style: 'knob', w: 0.42, rimK: 0.48, rim: [0.8, 0.8, 0.78], gap: 0.1 },
      regions: 'none',
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, CH = K.chrome, D = [0.15, 0.15, 0.16], FRM = [0.19, 0.19, 0.2], STL = [0.34, 0.35, 0.37];
        const AL = [0.62, 0.63, 0.62], RED = K.rgb(0xd8261c), PD = K.shade(P, 0.8);
        const side = (sd) => sd < 0 ? '-z' : 'z';
        // ---- the cab: the doors (side and window) in their parts, glass in the door and the windscreen; the roof's crown in the stripe ----
        const XD0 = 0.06, XD1 = 1.12;   // (the door's rear and front edges)
        const C = K.loft(K.body.secs, (k, e, kind, at) => {
          if (at.end) return P;
          if (e === 0 || e === 8) return D;
          const door = at.x > XD0 && at.x < XD1;
          if (kind === 'gf' && e >= 3 && e <= 5) return G;
          if (e === 2 || e === 6) return door ? G : P;
          if (e === 4 && kind === 'r') return S;
          return P;
        }, { caps: { front: { col: P, low: 'body', high: 'body', cut: 0 }, rear: { col: K.shade(P, 0.7), low: 'body', high: 'body', cut: 0 } },
          regions: ['L', 'R'].map(sd => ({ part: 'door' + sd, x: [XD0, XD1], bands: ['side', 'window'], side: sd })) });
        const CD = C.decal;
        CD.band([[XD0, 0], [XD1, 0], [XD1, 0.05], [XD0, 0.05]], B, null, 0.008);                 // the door window's frame: under it, over it, its ends
        CD.band([[XD0, 0.93], [XD1, 0.93], [XD1, 1], [XD0, 1]], B, null, 0.008);
        CD.band([[XD0, 0], [XD0 + 0.07, 0], [XD0 + 0.07, 1], [XD0, 1]], B, null, 0.009);
        CD.band([[XD1 - 0.05, 0], [XD1, 0], [XD1, 1], [XD1 - 0.05, 1]], B, null, 0.009);
        CD.side([[XD0 - 0.008, 1.37], [XD0 + 0.008, 1.37], [XD0 + 0.008, 2.2], [XD0 - 0.008, 2.2]], D, null, 0.009);   // the door's rear shut line
        CD.side([[-0.4, 1.5], [1.25, 1.5], [1.25, 1.66], [-0.4, 1.66]], S, null, 0.008);       // the livery: the stripe band along the side (the wing, the cab, the box)
        CD.side([[-0.4, 1.69], [1.25, 1.69], [1.25, 1.71], [-0.4, 1.71]], S, null, 0.008);
        for (const sd of [-1, 1]) {
          const dr = sd < 0 ? 'doorL' : 'doorR';
          K.rect(0.2, 2.04, sd * 1.176, 0.18, 0.04, B, { dir: side(sd), host: dr });               // the handle (at the door's rear edge)
          K.number(0.62, 1.95, sd * 1.178, 0.4, { dir: side(sd), w: 0.54, host: dr });           // the number on the door (over the band)
          K.hinge(dr, [XD1, 1.35, sd * 1.17], [XD1, 2.9, sd * 1.17]);
          K.bar([-0.37, 1.55, sd * 1.19], [-0.37, 2.45, sd * 1.19], 0.018, CH, { n: 4, part: 'body' });   // the grab handle behind the door
        }
        for (const z of [-0.5, 0.36]) K.bar([1.2, 2.245, z - 0.36], [1.186, 2.3, z + 0.36], 0.012, B, { n: 4, part: 'body' });   // the wipers (parked along the windscreen's base)
        for (const sd of [-1, 1]) K.mirror(1.16, 2.5, sd * 1.43, { w: 0.07, h: 0.42, d: 0.2, col: B, arm: D, z0: sd * 1.18 });   // the big mirrors on their arms
        // ---- the roof lamps: four round spot lamps on a bar over the windscreen (never crushed with the roof) ----
        K.part('body', () => {
          K.box(0.86, 3.02, 0, 0.14, 0.07, 1.74, 0, D);
          for (const z of [-0.66, -0.22, 0.22, 0.66]) {
            K.cyl([0.8, 3.18, z], [0.96, 3.18, z], 0.1, D, { n: 8, capB: null });
            K.discX(0.955, 3.18, z, 0.082, 8, K.lampHead, 1);
          }
        }, { noCrush: true });
        // ---- the tilting front ('hood'): the wings over the front wheels (the loft cuts their tall arches, its tubs over the tyres), the
        //      bonnet over the engine with its grille, the head lamps in the wings' fronts, the black arch flares, the front mud flaps ----
        K.part('hood', () => {
          const WG = K.loft(K.secs([[1.22, 1.22, 1.08, 1.6, 1.17, 1.66, 0.005, 'b', 0.08], [2.66, 1.22, 1.08, 1.6, 1.17, 1.66, 0.005, 'b', 0.08],
            [2.95, 1.17, 1.16, 1.48, 1.1, 1.55, 0.005, 'b', 0.08]]),
            (k, e, kind, at) => at.end ? P : e === 0 || e === 8 ? (at.arch ? B : D) : P, { lining: false, floor: false, arches: [{ x: K.fx }] });
          WG.decal.side([[1.22, 1.5], [2.95, 1.5], [2.95, 1.66], [1.22, 1.66]], S, null, 0.008);   // (the stripe band on, cut by the arch, up to the wing's top)
          const BN = K.loft(K.secs([[1.22, 0.8, 1.45, 1.97, 0.74, 2.06, 0.03, 'b', 0.05], [2.86, 0.8, 1.4, 1.95, 0.74, 2.03, 0.03, 'b', 0.05],
            [2.98, 0.78, 1.25, 1.91, 0.71, 1.98, 0.02, 'b', 0.05], [3.03, 0.75, 1.2, 1.85, 0.66, 1.91, 0.01, 'b', 0.05]]),
            () => P, { lining: false, floor: false, arches: false });
          for (const sd of [-1, 1]) BN.decal.top([[1.26, sd * 0.1], [2.98, sd * 0.1], [2.98, sd * 0.24], [1.26, sd * 0.24]], S, 0.008);   // the two bonnet stripes
          K.grille(3.033, 1.55, 0, 1.24, 0.6, { slats: 6, slatCol: [0.3, 0.31, 0.33], frame: D, frameH: 0.03 });
          for (const sd of [-1, 1]) { K.rect(2.6, 1.82, sd * 0.806, 0.46, 0.15, B, { dir: side(sd) }); for (const y of [1.79, 1.85]) K.rect(2.6, y, sd * 0.809, 0.44, 0.012, [0.3, 0.31, 0.33], { dir: side(sd) }); }   // the louvres in the bonnet's sides
          for (const sd of [-1, 1]) {
            K.headLamp(2.955, 1.36, sd * 0.96, 0.07, { shape: 'rect', w: 0.34, h: 0.15, ring: B });
            K.rect(2.952, 1.2, sd * 0.98, 0.2, 0.07, K.rgb(0xf29a1a), { dir: 'x' });           // the indicator under it
            K.flare(K.fx, 0.75, 0.86, sd * 1.19, sd * 1.26, B, { a0: 0.72, a1: Math.PI - 0.72, n: 6 });
            for (const dx of [-1, 1]) K.rect(1.24 + dx * 0.01, 0.76, sd * 1.03, 0.42, 0.68, B, { dir: dx < 0 ? '-x' : 'x' });   // the mud flap behind the front wheel
          }
        }, { hinge: [[2.95, 1.15, -1.0], [2.95, 1.15, 1.0]] });
        // ---- the steel bumper with the grille guard over the grille and the lamps, the towing hooks ----
        K.part('bumperF', () => {
          K.box(3.01, 0.86, 0, 0.22, 0.28, 2.36, 0, STL, D);
          for (const sd of [-1, 1]) K.box(3.11, 0.93, sd * 0.42, 0.1, 0.1, 0.07, 0, RED);
          const GG = [0.5, 0.51, 0.53];   // (the guard's tubes: light steel against the black grille)
          for (const z of [-0.74, -0.3, 0.3, 0.74]) K.bar([3.1, 1.12, z], [3.1, 1.9, z], 0.035, GG, { n: 6 });
          K.bar([3.1, 1.9, -0.76], [3.1, 1.9, 0.76], 0.035, GG, { n: 6 });
          K.bar([3.1, 1.5, -0.76], [3.1, 1.5, 0.76], 0.035, GG, { n: 6 });
          for (const sd of [-1, 1]) K.bar([3.1, 1.5, sd * 0.74], [3.0, 1.45, sd * 1.16], 0.035, GG, { n: 6 });
        }, { hinge: [[2.92, 0.9, -1.0], [2.92, 0.9, 1.0]] });
        // ---- the service body: a box narrower than the cab (the spare wheels stand on its flanks), its roof hatch, the lockers on its sides,
        //      the rear door, the tail lamps, the ladder ----
        const BX = K.loft(K.secs([[-3.1, 0.9, 1.42, 2.73, 0.88, 2.79, 0.01, 'b', 0.06], [-0.48, 0.9, 1.42, 2.73, 0.88, 2.79, 0.01, 'b', 0.06]]),
          (k, e, kind, at) => at.end ? P : e === 0 || e === 8 ? D : e === 2 || e === 6 ? S : P,
          { caps: { front: { col: P, low: 'body', high: 'body', cut: 0 }, rear: { col: P, low: 'body', high: 'body', cut: 0 } }, arches: false, lining: false, floor: false });
        const XD = BX.decal;
        XD.side([[-3.1, 1.5], [-0.48, 1.5], [-0.48, 1.66], [-3.1, 1.66]], S, null, 0.008);     // the stripe band (as the cab's)
        XD.side([[-3.1, 1.69], [-0.48, 1.69], [-0.48, 1.71], [-3.1, 1.71]], S, null, 0.008);
        XD.side([[-2.98, 1.8], [-1.9, 1.8], [-1.9, 2.62], [-2.98, 2.62]], PD, null, 0.006);     // the lockers behind the spare wheel
        XD.side([[-2.45, 1.8], [-2.43, 1.8], [-2.43, 2.62], [-2.45, 2.62]], D, null, 0.009);
        for (const sd of [-1, 1]) for (const x of [-2.6, -2.12]) K.rect(x, 1.92, sd * 0.915, 0.12, 0.035, B, { dir: side(sd) });
        for (const sd of [-1, 1]) {   // the sand ladders strapped over the lockers (holes in them, two straps)
          K.box(-2.44, 2.24, sd * 0.925, 1.0, 0.3, 0.03, 0, K.rgb(0xf08a1c));
          for (let i = 0; i < 4; i++) K.rect(-2.8 + i * 0.24, 2.39, sd * 0.942, 0.14, 0.12, [0.45, 0.22, 0.04], { dir: side(sd) });
          for (const x of [-2.78, -2.1]) K.rect(x, 2.39, sd * 0.944, 0.05, 0.34, B, { dir: side(sd) });
        }
        K.box(-1.2, 2.795, 0, 0.86, 0.05, 0.86, 0, D);                                           // the roof hatch: its frame, the lid
        K.box(-1.2, 2.84, 0, 0.74, 0.045, 0.74, 0, STL);
        for (const sd of [-1, 1]) K.bar([-3.0, 2.83, sd * 0.8], [-1.75, 2.83, sd * 0.8], 0.022, D, { n: 4 });   // the roof rails behind the hatch
        K.rect(-3.103, 1.58, 0, 1.8, 0.16, S, { dir: '-x' }); K.rect(-3.103, 1.7, 0, 1.8, 0.02, S, { dir: '-x' });   // the band round the back
        K.rect(-3.103, 2.765, 0, 1.8, 0.03, S, { dir: '-x' });                                    // (the box's top edge framed in the stripe)
        K.rect(-3.104, 2.22, 0, 1.0, 0.96, PD, { dir: '-x' });                                    // the rear door (two leaves), the number on it
        K.rect(-3.106, 2.22, 0, 0.012, 0.96, D, { dir: '-x' });
        K.number(-3.108, 2.44, 0.27, 0.32, { dir: '-x', w: 0.42 });
        for (const sd of [-1, 1]) {   // the lamp clusters in the band: the tail lamp over the indicator
          K.rect(-3.105, 1.62, sd * 0.73, 0.22, 0.38, B, { dir: '-x' });
          K.tailLamp(-3.107, 1.68, sd * 0.73, 0.16, 0.18);
          K.rect(-3.108, 1.5, sd * 0.73, 0.16, 0.07, K.rgb(0xf29a1a), { dir: '-x' });
        }
        for (const z of [0.5, 0.78]) K.bar([-3.15, 0.98, z], [-3.15, 2.81, z], 0.02, D, { n: 4 });   // the ladder up to the roof (its rungs facing back)
        for (let i = 0; i < 5; i++) K.rect(-3.152, 1.2 + i * 0.35, 0.64, 0.28, 0.03, D, { dir: '-x' });
        // ---- the spare wheels standing on the flanks behind the cab (a rival's detail of the wheel, its rim's face as the road wheels'), each
        //      clamped at its hub (never dented) ----
        for (const sd of [-1, 1]) K.part(sd < 0 ? 'spareL' : 'spareR', () => {
          K.tyre(-1.12, 1.88, sd * 1.08, { axis: 'z', face: sd, w: 0.38 });
          const rim = [0, 1, 2, 3, 4, 5, 6, 7].map(i => [-1.12 + Math.cos(i * Math.PI / 4) * 0.29, 1.88 + Math.sin(i * Math.PI / 4) * 0.29, sd * 1.273]);
          K.face(sd > 0 ? rim : rim.reverse(), K.wheels.rim);
          K.cyl([-1.12, 1.88, sd * 1.26], [-1.12, 1.88, sd * 1.3], 0.09, D, { n: 6 });
        }, { noDent: true, hinge: [[-1.75, 1.26, sd * 0.92], [-0.5, 1.26, sd * 0.92]] });
        for (const sd of [-1, 1]) K.box(-1.12, 1.18, sd * 1.0, 1.0, 0.07, 0.22, 0, FRM);   // (their cradles on the frame)
        // ---- the frame, the axles, the drive shafts, the fuel tanks, the steps, the rear mud guards and flaps ----
        K.part('body', () => {
          for (const sd of [-1, 1]) K.box(-0.05, 0.94, sd * 0.45, 6.0, 0.24, 0.1, 0, FRM);
          for (const x of [-2.95, 2.85]) K.box(x, 0.98, 0, 0.1, 0.16, 0.8, 0, FRM);
          K.box(K.fx, 0.56, 0, 0.16, 0.16, 1.7, 0, D); K.box(K.fx, 0.44, 0, 0.36, 0.3, 0.4, 0, D);
          K.cyl([K.rx, 0.65, -0.86], [K.rx, 0.65, 0.86], 0.1, D, { n: 8 }); K.box(K.rx, 0.42, 0, 0.4, 0.4, 0.42, 0, D);
          K.cyl([1.5, 0.84, 0], [K.rx + 0.2, 0.6, 0], 0.06, D, { n: 6, capA: null, capB: null });
          K.cyl([1.5, 0.84, 0.06], [K.fx - 0.2, 0.6, 0.06], 0.06, D, { n: 6, capA: null, capB: null });
          for (const sd of [-1, 1]) K.box(-0.98, 0.7, sd * 0.72, 0.95, 0.45, 0.42, 0, AL);
          for (const sd of [-1, 1]) {
            for (const y of [0.66, 1.0]) K.box(0.72, y, sd * 1.08, 0.55, 0.05, 0.22, 0, STL);
            for (const x of [0.46, 0.98]) K.rect(x, 0.99, sd * 1.12, 0.05, 0.66, FRM, { dir: side(sd) });   // (their hangers)
            K.flare(K.rx, 0.71, 0.79, sd * 0.78, sd * 1.26, B, { a0: 0.5, a1: Math.PI - 0.1, n: 7 });
            K.box(-2.98, 0.32, sd * 1.03, 0.02, 0.6, 0.42, 0, B);
          }
        });
        // ---- the rear bumper bar across the frame's end, the towing hitch, the reflectors ----
        K.part('bumperR', () => {
          K.box(-3.06, 0.84, 0, 0.14, 0.18, 2.0, 0, STL);
          K.box(-3.12, 0.8, 0, 0.12, 0.16, 0.22, 0, RED);
          for (const sd of [-1, 1]) K.rect(-3.131, 0.93, sd * 0.8, 0.22, 0.06, [0.85, 0.08, 0.06], { dir: '-x' });
        }, { hinge: [[-3.0, 0.9, -0.8], [-3.0, 0.9, 0.8]] });
        // ---- inside (seen once a part is off): three seats (the driver, the navigator, the mechanic between them), the dashboard, the big
        //      wheel, the roll cage; the engine under the bonnet, the radiator behind the grille ----
        for (const z of [-0.56, 0.56]) K.seat(0.35, 1.8, z, { w: 0.55, l: 0.5, back: 0.75 });
        K.seat(0.02, 1.78, 0, { w: 0.48, l: 0.45, back: 0.7 });
        K.box(1.02, 1.72, 0, 0.32, 0.45, 2.2, 0, D, null, false, { inner: true, part: 'body' });
        K.cyl([0.86, 2.08, -0.56], [0.78, 2.2, -0.56], 0.24, [0.08, 0.08, 0.09], { n: 8, inner: true, part: 'body' });
        const cg = [];
        for (const sd of [-1, 1]) cg.push([[-0.28, 1.36, sd * 1.06], [-0.28, 2.88, sd * 0.98]], [[1.0, 1.4, sd * 1.06], [0.92, 2.88, sd * 0.98]], [[0.92, 2.88, sd * 0.98], [-0.28, 2.88, sd * 0.98]]);
        cg.push([[-0.28, 2.88, -0.98], [-0.28, 2.88, 0.98]], [[0.92, 2.88, -0.98], [0.92, 2.88, 0.98]], [[-0.28, 1.36, -1.06], [-0.28, 2.88, 0.98]]);
        K.cage(cg, 0.035, [0.72, 0.74, 0.77]);
        K.engine(1.95, 1.0, 0, { l: 1.3, w: 0.8, h: 0.84 });
        K.box(2.86, 1.2, 0, 0.12, 0.65, 1.3, 0, [0.12, 0.12, 0.13], null, false, { inner: true, part: 'body' });
      },
    },
  });
})();
