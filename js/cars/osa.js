/* Vehicle 'osa' — OSA R: a modern three-door hot hatch with four-wheel drive (invented; no real model). Signature features: 1) the slim
   LED head lamps over a wide black mouth, the narrow black bar between them, the vertical intakes in the bumper's corners, 2) the wide
   black arches front and rear, the black skirts between them, 3) the black roof with the big spoiler over the tailgate, 4) the red
   light strip right across the tailgate between the tail lamps, the black diffuser with two pipes either side.
   L 4.13 W 1.84 H 1.44, wheelbase 2.56, overhangs F 0.89 R 0.68 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'osa', name: 'OSA R', cat: 'mali', ord: 6, drive: 'AWD',
    desc: 'Sodoben hot hatch s pogonom 4x4: široki blatniki, črna streha in velik strešni spojler.',
    // the LEV R's four-wheel-drive layer on a heavier road car on road tyres (a little less traction off the line, tracK), a low drag; the
    // quickest small car (0-100 3.08 s, the LEV S's 3.28), its top speed held under the small cars' 245 km/h by a limiter (vLim)
    phys: { mass: 1450, a: 1.06, b: 1.5, kI: 1.15, kw: 310, redline: 7200, idle: 900, gears: [3.3, 2.12, 1.55, 1.2, 0.98, 0.82], final: 3.9, rw: 0.34, cDrag: 0.34, len: 4.13, wid: 1.84, steerMax: 0.62,
      tracK: 0.93, brakeK: 1.05, spinK: 0.4, vLim: 242 },
    arc: { amax: 1.82, kv: 2.05, rmin: 4.1 },
    csp: { bx: 0.13, coast: -0.077, thr: -0.015, liftP: 0, pwr: 0.035, out: 0.95, turn: 1.05, w: 1 },   // (the AWD layer, the LEV R's: steady, straightens quickly)
    stats: { power: 8, grip: 8, weight: 6, drift: 4 },
    price: 55000, pk: 'open', field: ['osa'],
    snd: { kind: 'i4', hz: 1.1, turbo: 1, loud: 1.05 },
    expect: { t100: [3.0, 3.33], vmax: [232, 245], latG: [2.32, 2.42], d100: [22.5, 24.2] },   // (measured 3.08 / 240 / 2.37 / 23.0; the floor and the cap the small cars')
    partNames: { spoiler: 'roof spoiler', headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamp', tailR: 'right tail lamp',
      wiperFront: 'windscreen wipers' },
    // the standard car's parts and its own: each head lamp and each tail lamp a part of its own; the roof spoiler mounted on the tailgate
    // (on: it opens with it, goes with it), the wipers on the cowl
    parts: { set: 'car', ht: 1.44, y0: 0.2,
      extra: {
        spoiler: { z: 1, th: 0.6, m: 3, r: 0.45, h: 0.06, lx: -0.91, lz: 0, y: 1.36, on: 'trunk' },
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: 0.95, lz: -0.54, y: 0.555 },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: 0.95, lz: 0.54, y: 0.555 },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.2, h: 0.08, lx: -1.06, lz: -0.61, y: 0.84 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.2, h: 0.08, lx: -1.06, lz: 0.61, y: 0.84 },
        wiperFront: { z: 0, th: 0.65, m: 0.5, r: 0.45, h: 0.03, lx: 0.45, lz: -0.09, y: 0.97 },
      },
      over: { trunk: { lx: -1.02, y: 1.0 } } },   // (the hatch's tailgate: at the tail, where the look has it)
    // where the garage's parts go (js/deli.js, look units): the wing over the roof's rear edge in the spoiler's part; the head lamps where
    // the slim lamps are (one unit a side over each lamp), in the lamps' parts; the rims on its wheels
    mounts: {
      krilo: { x: -1.82, w: 0.56, part: 'spoiler' },
      zarometi: { x: 1.957, y0: 0.555, lean: 0, zc: 0.5, yc: 0.555, s: 0.36, hosts: ['headL', 'headR'], depth: 0.04 },
      platisca: {},
    },
    // the look: a loft through the sections below (look units = metres: the centre of mass at x 0, the axles at 1.06 / -1.5), the standard
    // regions split it into the parts (bumpers, bonnet, tailgate with its glass, fenders, quarters, doors with their glass), the details on
    // top (KIT API v1, render.js). Seen from the chase camera: the black roof and spoiler, the wide arches, the light strip
    look: {
      body: { len: 4.13, wid: 1.84, roofY: 1.44,
        //       x      w     yb    ybelt  wt    yt    cr    kind  tuck
        secs: [[-2.18, 0.8, 0.3, 0.84, 0.64, 0.92, 0.02, 'b', 0.12],    // the tail: the bumper's and the tailgate's lower panel's face
          [-2.12, 0.87, 0.29, 0.9, 0.7, 1.0, 0.03, 'gr', 0.11],      // the tailgate's glass, steep
          [-1.82, 0.89, 0.28, 0.96, 0.56, 1.34, 0.04, 'r', 0.1],     // the roof's rear edge (the spoiler over it)
          [-1.0, 0.9, 0.27, 0.98, 0.56, 1.39, 0.05, 'r', 0.1],
          [0.0, 0.9, 0.27, 0.96, 0.58, 1.37, 0.05, 'gf', 0.1],       // the windscreen's top
          [0.95, 0.91, 0.28, 0.9, 0.76, 0.96, 0.05, 'b', 0.1],       // the windscreen's base (the cowl)
          [1.55, 0.9, 0.27, 0.82, 0.76, 0.86, 0.05, 'b', 0.1],       // the bonnet
          [1.8, 0.86, 0.25, 0.74, 0.72, 0.78, 0.04, 'b', 0.09],
          [1.9, 0.81, 0.24, 0.66, 0.66, 0.7, 0.03, 'b', 0.08],
          [1.95, 0.74, 0.25, 0.56, 0.58, 0.6, 0.02, 'b', 0.07]],     // the nose: the mouth's face
        eye: { x: -0.45, y: 1.12 },
      },
      wheels: { style: 'std', spokes: 10, w: 0.235, rim: [0.18, 0.18, 0.2], cap: [0.1, 0.1, 0.11], gap: 0.04 },
      build(K) {
        const P = K.paint, B = K.black, G = K.GLASS, D = [0.09, 0.09, 0.1];
        // the shell: the paint; the glass (windscreen, side windows along the roof, the tailgate's glass); the roof's top black; the sills
        // black between the arches, dark under the bumpers' corners
        const XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;
        const L = K.loft(K.secs(K.body.secs), (k, e, kind, at) => {
          if (kind === 'r' && e >= 3 && e <= 5) return B;
          if (e === 0 || e === 8) return at.arch || (at.x > XA && at.x < XB) ? B : K.shade(P, 0.55);
          if (kind === 'gf' && e >= 2 && e <= 6) return G;
          if (kind === 'r' && (e === 2 || e === 6)) return G;
          if (kind === 'gr' && e >= 3 && e <= 5) return G;
          return P;
        }, { caps: { front: { col: P }, rear: { col: P } } });
        const DC = L.decal, X0 = XA + 0.03, X1 = XB - 0.03;
        // the B-pillar (black), the black skirts along the sills from arch to arch, the door's handle, the side repeaters
        DC.band([[-0.95, 0], [-0.82, 0], [-0.82, 1], [-0.95, 1]], B, null, 0.01);
        DC.side([[X0, 0.31], [X1, 0.31], [X1, 0.4], [X0, 0.4]], B, null, 0.006);
        for (const sd of [-1, 1]) {
          K.rect(-0.55, 0.86, sd * 0.905, 0.15, 0.028, B, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' });
          K.rect(0.62, 0.7, sd * 0.912, 0.06, 0.022, K.rgb(0xff9a1e), { dir: sd < 0 ? '-z' : 'z' });
        }
        // the wide black arches, front and rear
        for (const A of K.arches) for (const sd of [-1, 1]) K.flare(A.x, 0.36, 0.42, sd * 0.86, sd * 0.93, B);
        // the nose: the slim LED head lamps on the corners (each a part of its own; the garage's lamps in their place: K.deli,
        // mounts.zarometi), the narrow black bar between them
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(1.957, 0.555, sd * 0.5, 0.05, { shape: 'rect', w: 0.36, h: 0.05, ring: null, host: sd < 0 ? 'headL' : 'headR' }); });
        K.rect(1.956, 0.555, 0, 0.64, 0.03, B);
        // the front bumper: the wide mouth, the vertical intakes in its corners, the splitter under it
        K.part('bumperF', () => {
          K.grille(1.955, 0.38, 0, 1.24, 0.22, { slats: 4 });
          for (const sd of [-1, 1]) K.rect(1.952, 0.4, sd * 0.74, 0.07, 0.2, B);
          K.box(1.9, 0.235, 0, 0.16, 0.03, 1.66, 0, B);   // (the splitter: under the nose's foot, 3 cm ahead of it)
        }, { hinge: [[1.9, 0.3, -0.7], [1.9, 0.3, 0.7]] });
        // the tail: the lamps in black surrounds on the corners (each a part of its own), the lit strip right across the tailgate between
        // them (on the tailgate: it goes with it), the badge
        for (const sd of [-1, 1]) { const tp = sd < 0 ? 'tailL' : 'tailR';
          K.rect(-2.185, 0.84, sd * 0.56, 0.38, 0.1, B, { dir: '-x', part: tp }); K.tailLamp(-2.19, 0.84, sd * 0.56, 0.34, 0.06, { host: tp }); }
        K.rect(-2.186, 0.84, 0, 0.78, 0.05, B, { dir: '-x', part: 'trunk' });
        K.tailLamp(-2.19, 0.84, 0, 0.74, 0.03, { host: 'trunk' });
        K.rect(-2.19, 0.74, 0, 0.12, 0.04, [0.6, 0.62, 0.66], { dir: '-x', part: 'trunk' });
        // the roof spoiler: black, from the roof's rear edge out over the tailgate's glass (a part of its own, on the tailgate; the
        // garage's wing in its place: K.deli, mounts.krilo)
        K.part('spoiler', () => K.deli('krilo', () => K.wingPlank(-1.76, 1.37, -2.1, 1.31, 0.03, -0.66, 0.66, B)),
          { noCrush: true, noDent: true, hinge: [[-1.8, 1.34, -0.5], [-1.8, 1.34, 0.5]] });
        // the rear bumper: the black diffuser, two pipes either side
        K.part('bumperR', () => {
          K.box(-2.12, 0.2, 0, 0.14, 0.18, 1.3, 0, B);   // (up to the tail's foot)
          for (const z of [-0.5, -0.36, 0.36, 0.5]) K.exhaust(-2.2, 0.2, z, 0.042, 0.18);
        }, { hinge: [[-2.15, 0.3, -0.7], [-2.15, 0.3, 0.7]] });
        // the black door mirrors, the wipers on the cowl
        for (const sd of [-1, 1]) K.mirror(0.62, 1.0, sd * 0.94, { col: B });
        for (const z of [-0.36, 0.2]) K.bar([0.98, 0.97, z - 0.26], [0.93, 1.0, z + 0.26], 0.01, B, { n: 4, part: 'wiperFront' });   // (a part: both blades come off together)
        K.hinge('hood', [0.97, 0.95, -0.6], [0.97, 0.95, 0.6]);
        K.hinge('trunk', [-1.82, 1.34, -0.6], [-1.82, 1.34, 0.6]);
        K.hinge('doorL', [0.62, 0.4, -0.88], [0.62, 0.85, -0.88]); K.hinge('doorR', [0.62, 0.4, 0.88], [0.62, 0.85, 0.88]);
        // inside (seen once a part is off): the seats, the dashboard, the transverse four in the bay
        for (const sd of [-1, 1]) K.seat(-0.5, 0.5, sd * 0.38, { w: 0.5, back: 0.7 });
        K.seat(-1.3, 0.47, 0, { w: 1.2, back: 0.55 });
        K.box(0.7, 0.62, 0, 0.3, 0.24, 1.5, 0, D, null, false, { inner: true, part: 'body' });
        K.engine(1.45, 0.38, 0, { l: 0.5, w: 0.66, h: 0.48 });
      },
    },
  });
})();
