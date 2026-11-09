/* Vehicle 'gams' — GAMS RH: a modern hybrid rally car of the top class (invented; no real model). Signature features: 1) the short, wide
   hatch on big box arches, the louvres cut into the front ones' tops, 2) the big wing at the roof's rear edge, its tall endplates running
   down the C-pillars to the shoulders, 3) the roof scoop with the hybrid's green safety lamp behind it, 4) the open tail: a dark mesh over
   the diffuser's fins under thin lamps on the corners, one big pipe on the right, 5) the mudflaps behind every wheel, 6) the livery: a
   ridge of mountain peaks along each side in the stripe colour.
   L 4.20 W 1.88 H 1.46, wheelbase 2.63, overhangs F 0.85 R 0.72 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'gams', name: 'GAMS RH', cat: 'reli', ord: 3, drive: 'AWD',
    desc: 'Sodoben relijski hibrid: veliko krilo, odprtine na blatnikih, zračnik na strehi.',
    // the LEV R's four-wheel drive with more power and the hybrid's push out of a corner (more traction: tracK), a little more grip (arc)
    // and less drag; the most grip on loose ground of all (loose: the best on makadam, ahead of the SAMUM 4x4), the long travel of a
    // modern rally car's suspension (landV, landK: a jump's landing costs less speed)
    phys: { mass: 1260, a: 1.27, b: 1.36, kI: 1.12, kw: 330, redline: 8000, idle: 1000, gears: [3.2, 2.08, 1.5, 1.17, 0.95, 0.8], final: 4.8, rw: 0.33, cDrag: 0.42, len: 4.2, wid: 1.88, steerMax: 0.64,
      tracK: 1.2, brakeK: 1.05, spinK: 0.3, loose: 1.12, landV: 15, landK: 0.6 },
    arc: { amax: 1.84, kv: 2.05, rmin: 4.1 },
    csp: { bx: 0.13, coast: -0.077, thr: -0.015, liftP: 0, pwr: 0.03, out: 0.9, turn: 1.05, w: 1 },   // (the AWD layer, the LEV R's: steady; it straightens a little quicker out of a corner)
    stats: { power: 8, grip: 9, weight: 7, drift: 4 },
    price: 1000000, pk: 'open', field: ['gams'],
    snd: { kind: 'i4', hz: 1.2, turbo: 1, loud: 1.15 },
    expect: { t100: [2.3, 2.62], vmax: [232, 250], latG: [2.35, 2.45], d100: [21.9, 23.9] },   // (measured: 2.41 s, 242 km/h, 2.40 g, 22.9 m)
    partNames: { scoop: 'roof scoop', flapL: 'left mudflap', flapR: 'right mudflap', headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamp', tailR: 'right tail lamp',
      wiperFront: 'windscreen wipers' },
    // the race set's parts (the wing among them) and its own: each head lamp and each tail lamp a part of its own (the tail lamps on the
    // quarters' corners: they go with them), the roof scoop, the mudflaps behind the rear wheels (the front ones are the fenders'), the wipers
    parts: { set: 'race', ht: 1.46, y0: 0.2,
      extra: {
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: 1.0, lz: -0.55, y: 0.62 },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: 1.0, lz: 0.55, y: 0.62 },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: -0.99, lz: -0.7, y: 0.8, on: 'quarterL' },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: -0.99, lz: 0.7, y: 0.8, on: 'quarterR' },
        wiperFront: { z: 0, th: 0.65, m: 0.5, r: 0.45, h: 0.03, lx: 0.4, lz: -0.09, y: 1.0 },
        scoop: { z: 0, th: 0.62, m: 2, r: 0.3, h: 0.08, lx: -0.13, lz: 0, y: 1.46 },
        flapL: { z: 2, th: 0.5, m: 1, r: 0.25, h: 0.03, lx: -0.85, lz: -0.84, y: 0.22 },
        flapR: { z: 3, th: 0.5, m: 1, r: 0.25, h: 0.03, lx: -0.85, lz: 0.84, y: 0.22 },
      },
      over: { trunk: { lx: -0.93, y: 0.98 }, hood: { lx: 0.72, y: 0.86 }, wing: { lx: -0.88, y: 1.42 } } },
    // where the garage's parts go (js/deli.js, look units): the wing over the roof's rear edge, in the wing's part (in place of the big wing
    // on its endplates); the head lamps where the slim lamps are, in the lamps' parts; the rims on its wheels
    mounts: {
      krilo: { x: -1.72, w: 0.6, part: 'wing' },
      zarometi: { x: 2.122, y0: 0.62, lean: 0, zc: 0.53, yc: 0.62, s: 0.32, hosts: ['headL', 'headR'], depth: 0.04 },
      platisca: {},
    },
    // the look: a loft through the sections below (look units = metres: the centre of mass at x 0, the axles at 1.27 / -1.36), the standard
    // regions split it into the parts (bumpers, bonnet, tailgate with its glass, fenders, quarters, doors with their glass), the details on
    // top (KIT API v1, render.js). Seen from the chase camera: the wing framing the rear glass, the scoop, the peaks, the open tail
    look: {
      body: { len: 4.2, wid: 1.88, roofY: 1.46,
        //       x      w     yb    ybelt  wt    yt    cr    kind  tuck
        secs: [[-2.08, 0.83, 0.32, 0.86, 0.65, 0.98, 0.02, 'b', 0.12],    // the tail: the bumper's and the tailgate's lower panel's face
          [-2.02, 0.88, 0.31, 0.92, 0.69, 1.04, 0.03, 'gr', 0.11],     // the rear glass's foot
          [-1.72, 0.9, 0.3, 1.0, 0.6, 1.37, 0.04, 'r', 0.1],         // the roof's rear edge (the wing over it), the broad C-pillar
          [-1.35, 0.91, 0.29, 0.98, 0.62, 1.4, 0.05, 'r', 0.1],       // the C-pillar's front edge: the side glass from here
          [-0.95, 0.91, 0.29, 0.96, 0.64, 1.41, 0.05, 'r', 0.1],
          [-0.05, 0.91, 0.29, 0.93, 0.64, 1.39, 0.05, 'gf', 0.1],     // the windscreen's top
          [0.8, 0.91, 0.3, 0.89, 0.76, 0.98, 0.05, 'b', 0.1],        // the windscreen's base (the cowl)
          [1.7, 0.9, 0.29, 0.83, 0.76, 0.88, 0.05, 'b', 0.1],        // the bonnet
          [2.05, 0.84, 0.27, 0.75, 0.7, 0.78, 0.04, 'b', 0.09],
          [2.12, 0.78, 0.28, 0.69, 0.64, 0.72, 0.02, 'b', 0.08]],    // the nose: the mouth's face
        eye: { x: -0.4, y: 1.15 },
        decalX: -1.0, decalY: 1.46, decalS: 0.55,                    // (the start number on the roof, behind the scoop)
      },
      wheels: { style: 'std', spokes: 5, w: 0.25, rim: [0.66, 0.52, 0.3], cap: [0.2, 0.2, 0.21], gap: 0.05 },
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, D = [0.09, 0.09, 0.1], DK = [0.13, 0.13, 0.14];
        // the shell: the paint, the roof in the stripe colour (the snow over the peaks); the glass (windscreen, the side windows from the
        // broad C-pillars on, the tailgate's glass); the sills black between the arches, dark under the bumpers' corners
        const XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;
        const L = K.loft(K.secs(K.body.secs), (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch || (at.x > XA && at.x < XB) ? B : K.shade(P, 0.55);
          if (kind === 'gf' && e >= 2 && e <= 6) return G;
          if (kind === 'r' && (e === 2 || e === 6)) return at.x > -1.35 ? G : P;
          if (kind === 'r' && e >= 3 && e <= 5) return S;
          if (kind === 'gr' && e >= 3 && e <= 5) return G;
          return P;
        }, { caps: { front: { col: P }, rear: { col: P } } });
        const DC = L.decal, X0 = XA + 0.03, X1 = XB - 0.03;
        // the B-pillar (black), the black skirts along the sills from arch to arch; the livery: a ridge of mountain peaks along each side,
        // in the stripe colour (three pieces, each convex: the ridge's outline runs over their tops)
        DC.band([[-0.95, 0], [-0.82, 0], [-0.82, 1], [-0.95, 1]], B, null, 0.01);
        DC.side([[X0, 0.33], [X1, 0.33], [X1, 0.42], [X0, 0.42]], B, null, 0.006);
        for (const pc of [[[X0, 0.42], [-0.35, 0.42], [-0.35, 0.6], [-0.6, 0.68], [X0, 0.5]], [[-0.35, 0.42], [0.3, 0.42], [0.3, 0.6], [0, 0.82], [-0.35, 0.6]],
          [[0.3, 0.42], [X1, 0.42], [X1, 0.5], [0.5, 0.66], [0.3, 0.6]]]) DC.side(pc, S, null, 0.008);
        // the big box arches, front and rear; the louvres cut into the front ones' tops (behind the wheels' crowns: on the bonnet's edges,
        // the fenders' part of it)
        for (const A of K.arches) for (const sd of [-1, 1]) K.flare(A.x, 0.38, 0.46, sd * 0.86, sd * 0.95, P);
        for (const sd of [-1, 1]) for (let i = 0; i < 5; i++) { const x = 1.2 - i * 0.075; DC.top([[x, sd * 0.56], [x - 0.035, sd * 0.56], [x - 0.035, sd * 0.73], [x, sd * 0.73]], D, 0.006); }
        // the nose: the slim lamps on its corners (each a part of its own; the garage's lamps in their place: K.deli, mounts.zarometi), the
        // black band between them
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(2.122, 0.62, sd * 0.53, 0.05, { shape: 'rect', w: 0.32, h: 0.06, ring: null, host: sd < 0 ? 'headL' : 'headR' }); });
        K.rect(2.121, 0.62, 0, 0.7, 0.05, B);
        // the front bumper: the big mouth, the intakes in its corners, the splitter and the dive planes
        K.part('bumperF', () => {
          K.grille(2.121, 0.44, 0, 1.2, 0.24, { slats: 3 });
          for (const sd of [-1, 1]) K.rect(2.118, 0.38, sd * 0.72, 0.16, 0.18, B);
          K.box(2.06, 0.2, 0, 0.2, 0.035, 1.74, 0, B);
          for (const sd of [-1, 1]) K.box(2.04, 0.34, sd * 0.78, 0.18, 0.02, 0.14, 0, B);
        }, { hinge: [[2.06, 0.3, -0.7], [2.06, 0.3, 0.7]] });
        // the tail: thin lamps on its corners in black surrounds (each a part of its own, on the quarters), a lit bar under them on each
        // corner running down; the open tail under them: the dark mesh, the diffuser's fins, the big pipe on the right, the tow strap
        for (const sd of [-1, 1]) { const tp = sd < 0 ? 'tailL' : 'tailR';
          K.rect(-2.085, 0.86, sd * 0.6, 0.38, 0.09, B, { dir: '-x', part: tp });
          K.tailLamp(-2.09, 0.86, sd * 0.6, 0.34, 0.045, { host: tp });
          K.tailLamp(-2.09, 0.74, sd * 0.74, 0.05, 0.2, { host: tp }); }
        K.part('bumperR', () => {
          K.grille(-2.085, 0.45, 0, 1.2, 0.22, { dir: -1, slats: 4, col: DK });
          K.box(-2.02, 0.2, 0, 0.16, 0.13, 1.5, 0, B);
          for (const z of [-0.45, -0.15, 0.15, 0.45]) K.box(-2.1, 0.2, z, 0.12, 0.12, 0.02, 0, B);
          K.exhaust(-2.12, 0.27, 0.6, 0.06, 0.22);
          K.rect(-2.087, 0.33, -0.62, 0.05, 0.06, K.rgb(0xf2c200), { dir: '-x' });
        }, { hinge: [[-2.05, 0.3, -0.7], [-2.05, 0.3, 0.7]] });
        // the wing: a big plank at the roof's rear edge, its tall endplates running down the C-pillars to the shoulders (a part of its own;
        // the garage's wing in its place: K.deli, mounts.krilo)
        K.part('wing', () => K.deli('krilo', () => {
          K.wingPlank(-1.6, 1.46, -2.1, 1.42, 0.035, -0.8, 0.8, B);
          K.wingPlank(-2.0, 1.48, -2.13, 1.52, 0.016, -0.8, 0.8, B);
          for (const sd of [-1, 1]) {
            K.endplate([[-1.56, 1.4], [-2.16, 1.34], [-2.16, 1.56], [-1.6, 1.52]], sd * 0.815, 0.014, B);
            K.endplate([[-1.74, 1.4], [-1.78, 1.06], [-1.96, 0.97], [-2.04, 1.4]], sd * 0.815, 0.014, B, { part: 'body' });   // (its leg down the C-pillar: the body's, it stays when the wing goes)
          }
        }), { noCrush: true, hinge: [[-1.7, 1.38, -0.6], [-1.7, 1.38, 0.6]] });
        // the roof scoop, the hybrid's green safety lamp behind it
        K.part('scoop', () => {
          const ring = (x, hw, h) => { const y0 = L.topY(x, 0) - 0.012; return [[x, y0, -hw], [x, y0 + h, -hw * 0.75], [x, y0 + h, hw * 0.75], [x, y0, hw]]; };
          K.skin([ring(-0.06, 0.17, 0.07), ring(-0.48, 0.13, 0.012)], B, D, B);
        }, { noCrush: true });
        K.box(-0.62, L.topY(-0.62, 0) - 0.01, 0, 0.05, 0.04, 0.08, 0, K.rgb(0x22e04a));
        // the mudflaps (a face each way): behind the front wheels (the fenders'), behind the rear ones (their own parts)
        const flap = (x, y, z, w, h) => { K.rect(x + 0.006, y, z, w, h, DK, { dir: 'x' }); K.rect(x - 0.006, y, z, w, h, DK, { dir: '-x' }); };
        for (const sd of [-1, 1]) {
          K.part(sd < 0 ? 'fenderL' : 'fenderR', () => flap(0.86, 0.19, sd * 0.78, 0.22, 0.26));
          K.part(sd < 0 ? 'flapL' : 'flapR', () => flap(-1.76, 0.2, sd * 0.79, 0.24, 0.3), { noDent: true, hinge: [[-1.76, 0.34, sd * 0.67], [-1.76, 0.34, sd * 0.91]] });
        }
        // the black door mirrors, the wipers on the cowl
        for (const sd of [-1, 1]) K.mirror(0.66, 1.0, sd * 0.97, { col: B });
        for (const z of [-0.36, 0.2]) K.bar([0.83, 0.99, z - 0.26], [0.78, 1.02, z + 0.26], 0.01, B, { n: 4, part: 'wiperFront' });   // (a part: both blades come off together)
        K.hinge('hood', [0.82, 0.97, -0.6], [0.82, 0.97, 0.6]);
        K.hinge('trunk', [-1.72, 1.38, -0.55], [-1.72, 1.38, 0.55]);
        K.hinge('doorL', [0.66, 0.4, -0.88], [0.66, 0.85, -0.88]); K.hinge('doorR', [0.66, 0.4, 0.88], [0.66, 0.85, 0.88]);
        // inside (seen once a part is off): two buckets, the dashboard, the roll cage, the transverse four in the bay, the spare wheel
        for (const sd of [-1, 1]) K.seat(-0.42, 0.48, sd * 0.37, { w: 0.48, back: 0.74, col: [0.1, 0.1, 0.11] });
        K.box(0.55, 0.6, 0, 0.3, 0.26, 1.46, 0, D, null, false, { inner: true, part: 'body' });
        const CG = [0.78, 0.79, 0.82], cy = 1.32;
        K.cage([[[-0.85, 0.3, -0.62], [-0.85, cy, -0.52]], [[-0.85, 0.3, 0.62], [-0.85, cy, 0.52]], [[-0.85, cy, -0.52], [-0.85, cy, 0.52]], [[-0.85, 0.3, -0.62], [-0.85, cy, 0.52]],
          [[0.62, 0.62, -0.64], [0.1, cy, -0.48]], [[0.62, 0.62, 0.64], [0.1, cy, 0.48]], [[0.1, cy, -0.48], [-0.85, cy, -0.52]], [[0.1, cy, 0.48], [-0.85, cy, 0.52]],
          [[-0.85, cy, -0.52], [-1.7, 0.6, -0.62]], [[-0.85, cy, 0.52], [-1.7, 0.6, 0.62]]], 0.022, CG, { n: 4, noCrush: true, noDent: true });
        K.engine(1.45, 0.34, 0, { l: 0.5, w: 0.62, h: 0.42 });
        K.tyre(-1.45, 0.4, 0, { axis: 'y', w: 0.2, inner: true, part: 'body' });   // the spare wheel lying in the boot
      },
    },
  });
})();
