/* Vehicle 'raketa' — RAKETA 16V: a late-1970s / 1980s square hot hatch, 16-valve four. Signature features: 1) a square three-door hatch
   with a flat bonnet and a steep tailgate, 2) four round headlamps of one size in a plain black grille, 3) a thin red line along the
   bumpers and over the skirts, 4) black wheel-arch extensions and side skirts down to the sills, 5) four-spoke alloy wheels. L 3.80
   W 1.63 H 1.40, wheelbase 2.40, overhangs F 0.78 R 0.62 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'raketa', name: 'RAKETA 16V', cat: 'mali', ord: 3, drive: 'FF',
    desc: 'Oglat hot hatch iz 80-ih: štirje okrogli žarometi, rdeča črta na odbijačih in pragovih.',
    phys: { mass: 880, a: 1.12, b: 1.28, kI: 1.05, kw: 140, redline: 7600, idle: 950, gears: [3.3, 2.1, 1.48, 1.12, 0.9], final: 4.12, rw: 0.29, cDrag: 0.38, len: 3.8, wid: 1.63, steerMax: 0.64,
      spinK: 0.4 },
    arc: { amax: 1.72, kv: 2.1, rmin: 4 },
    csp: { bx: 0.15, coast: -0.095, thr: -0.03, liftP: 0, pwr: 0, out: 1, turn: 1.04, w: 1.02 },   // (the FF layer: pivots on the brakes, the throttle pulls it straight; its own turn)
    stats: { power: 4, grip: 7, weight: 10, drift: 5 },
    price: 14000, pk: 'ta1', field: ['raketa'],
    snd: { kind: 'i4', hz: 1.1, loud: 1 },
    expect: { t100: [3.09, 3.63], vmax: [205, 217], latG: [2.19, 2.29], d100: [22.8, 25.2] },
    parts: { set: 'car', ht: 1.4, y0: 0.2, over: { trunk: { lx: -0.95, y: 0.94 } } },   // (the hatch's tailgate: at the tail, where the look has it)
    // the look: a loft through the sections below (look units = metres: body.len / wid are the vehicle's), the standard regions split it into
    // the parts (bumpers, bonnet, tailgate with its glass, fenders, quarters, doors with their glass), the details on top (KIT API v1, render.js)
    look: {
      body: { len: 3.8, wid: 1.63, roofY: 1.4,
        //       x      w     yb    ybelt  wt    yt    cr    kind  tuck
        secs: [[-1.86, 0.76, 0.3, 0.84, 0.7, 0.93, 0.01, 'b', 0.12],    // the tail: the tailgate's lower panel ends at its top
          [-1.82, 0.78, 0.29, 0.86, 0.71, 0.97, 0.02, 'gr', 0.11],     // the tailgate's glass, nearly upright
          [-1.64, 0.8, 0.27, 0.87, 0.64, 1.34, 0.03, 'r', 0.1],        // the roof's back edge
          [-0.95, 0.8, 0.24, 0.87, 0.65, 1.37, 0.03, 'r', 0.1],
          [-0.12, 0.8, 0.24, 0.86, 0.65, 1.37, 0.03, 'gf', 0.1],       // the windscreen's top
          [0.5, 0.8, 0.25, 0.85, 0.76, 0.92, 0.02, 'b', 0.1],          // the windscreen's base (the cowl)
          [1.4, 0.8, 0.27, 0.83, 0.77, 0.88, 0.02, 'b', 0.11],         // the flat bonnet
          [1.8, 0.79, 0.29, 0.81, 0.75, 0.84, 0.01, 'b', 0.12],
          [1.86, 0.76, 0.3, 0.78, 0.72, 0.81, 0.01, 'b', 0.12]],       // the nose: the grille's face
        eye: { x: -0.6, y: 1.16 },
      },
      wheels: { style: 'std', spokes: 4, w: 0.185, rim: [0.58, 0.59, 0.62], cap: [0.2, 0.2, 0.22], gap: 0.06 },
      build(K) {
        const P = K.paint, B = K.black, R = K.rgb(0xe8201a), G = K.GLASS, D = [0.09, 0.09, 0.1];
        // the shell: the paint; the glass (windscreen, side windows, the tailgate's window); the sills black from arch to arch (the skirts
        // run down to them: a side decal stops at the flat side's foot, the tuck under it is the loft's), dark under the bumpers' corners
        const XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;
        const L = K.loft(K.secs(K.body.secs), (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch || (at.x > XA && at.x < XB) ? B : K.shade(P, 0.55);
          if (kind === 'gf' && e >= 2 && e <= 6) return G;
          if (kind === 'r' && (e === 2 || e === 6)) return G;
          if (kind === 'gr' && e >= 3 && e <= 5) return G;
          return P;
        }, { caps: { front: { col: P }, rear: { col: P } } });
        const D2 = L.decal, X0 = K.arches[1].x + K.arches[1].half + 0.03, X1 = K.arches[0].x - K.arches[0].half - 0.03;
        // the window frames and pillars (black), the A-pillars in paint
        D2.band([[-1.62, 0], [0.5, 0], [0.5, 0.07], [-1.62, 0.07]], B, null, 0.008);                 // along the belt
        D2.band([[-1.62, 0.92], [-0.12, 0.92], [-0.12, 1], [-1.62, 1]], B, null, 0.008);             // under the roof's edge
        D2.band([[-0.74, 0], [-0.6, 0], [-0.6, 1], [-0.74, 1]], B, null, 0.01);                      // the B-pillar
        D2.band([[-1.62, 0], [-1.4, 0], [-1.46, 1], [-1.62, 1]], P, null, 0.01);                     // the C-pillar's front edge (the quarter window ends)
        D2.band([[0.18, 0.7], [0.5, 0.04], [0.5, 1], [0.12, 1]], P, null, 0.01);                     // the A-pillar's foot
        // the side: black skirts along the sills up to the bumpers' tops, the red line in them (2.5 cm, black either side: it reads on any
        // paint, the bumpers' at the same height), from arch to arch; the door's handle; the fuel cap (right)
        D2.side([[X0, 0.33], [X1, 0.33], [X1, 0.45], [X0, 0.45]], B, null, 0.006);
        D2.side([[X0, 0.3925], [X1, 0.3925], [X1, 0.4175], [X0, 0.4175]], R, null, 0.009);
        D2.side([[-1.8, 0.735], [1.78, 0.735], [1.78, 0.745], [-1.8, 0.745]], K.shade(P, 0.72), null, 0.004);   // (the shoulder's crease, head lamps to tail lamps)
        for (const sd of [-1, 1]) K.rect(-0.5, 0.79, sd * 0.814, 0.15, 0.028, B, { dir: sd < 0 ? '-z' : 'z' });
        K.face([0, 1, 2, 3, 4, 5, 6, 7].map(i => [-1.38 + Math.cos(i * Math.PI / 4) * 0.05, 0.74 + Math.sin(i * Math.PI / 4) * 0.05, 0.806]), D, { part: 'quarterR' });
        // the black wheel-arch extensions
        for (const A of K.arches) for (const sd of [-1, 1]) K.flare(A.x, 0.355, 0.4, sd * 0.785, sd * 0.825, B);
        // the nose: a plain black grille right across, two round lamps a side, all four of one size
        K.grille(1.862, 0.63, 0, 1.5, 0.24, { slats: 3 });
        for (const sd of [-1, 1]) for (const z of [0.62, 0.43]) K.headLamp(1.874, 0.632, sd * z, 0.075);
        // the bumpers: black, wrapped round the corners, the red line along them (black over and under it); the front one with a small
        // spoiler under it, the indicators in its ends, the number plate
        K.part('bumperF', () => {
          K.box(1.86, 0.27, 0, 0.09, 0.18, 1.58, 0, B); K.rect(1.908, 0.405, 0, 1.58, 0.025, R);
          for (const sd of [-1, 1]) { const z = sd * 0.79, f = sd < 0 ? '-z' : 'z';
            K.box(1.72, 0.28, z, 0.22, 0.17, 0.05, 0, B); K.rect(1.72, 0.405, z + sd * 0.028, 0.22, 0.025, R, { dir: f }); K.rect(1.908, 0.36, sd * 0.68, 0.16, 0.06, K.rgb(0xff9a1e)); }
          K.box(1.79, 0.205, 0, 0.16, 0.065, 1.42, 0, B);   // (the chin spoiler, up to the bumper's foot)
          K.rect(1.912, 0.355, 0, 0.5, 0.11, [0.93, 0.93, 0.9]);   // (the plate: over the red line)
        }, { hinge: [[1.86, 0.3, -0.7], [1.86, 0.3, 0.7]] });
        K.part('bumperR', () => {
          K.box(-1.86, 0.27, 0, 0.09, 0.18, 1.58, 0, B); K.rect(-1.908, 0.405, 0, 1.58, 0.025, R, { dir: '-x' });
          for (const sd of [-1, 1]) { const z = sd * 0.79; K.box(-1.73, 0.28, z, 0.2, 0.17, 0.05, 0, B); K.rect(-1.73, 0.405, z + sd * 0.028, 0.2, 0.025, R, { dir: sd < 0 ? '-z' : 'z' }); }
        });
        // the tail: the lamps in black surrounds at the corners (the lit lenses are the tail mesh), the plate on the tailgate, its wiper; the exhaust
        for (const sd of [-1, 1]) { K.rect(-1.864, 0.69, sd * 0.6, 0.34, 0.18, B, { dir: '-x', part: 'body' }); K.tailLamp(-1.866, 0.69, sd * 0.6, 0.3, 0.14); }
        K.rect(-1.864, 0.555, 0, 0.5, 0.11, [0.93, 0.93, 0.9], { dir: '-x', part: 'trunk' });
        K.bar([-1.788, 1.06, -0.24], [-1.768, 1.11, 0.24], 0.012, B, { n: 4, part: 'trunk' });   // (on the glass's slope, just outside it)
        K.exhaust(-1.82, 0.25, -0.45, 0.032, 0.2, { part: 'body' });
        // the door mirrors (black), the wipers on the cowl
        for (const sd of [-1, 1]) K.mirror(0.38, 0.95, sd * 0.88, { col: B });
        for (const z of [-0.36, 0.2]) K.bar([0.54, 0.93, z - 0.24], [0.5, 0.95, z + 0.24], 0.01, B, { n: 4, part: 'body' });
        K.hinge('hood', [0.52, 0.9, -0.6], [0.52, 0.9, 0.6]);
        K.hinge('trunk', [-1.64, 1.34, -0.6], [-1.64, 1.34, 0.6]);
        K.hinge('doorL', [0.46, 0.4, -0.8], [0.46, 0.85, -0.8]); K.hinge('doorR', [0.46, 0.4, 0.8], [0.46, 0.85, 0.8]);
        // inside (seen once a part is off): the seats, the dashboard, the transverse four in the bay
        for (const sd of [-1, 1]) K.seat(-0.55, 0.52, sd * 0.36);
        K.seat(-1.3, 0.5, 0, { w: 1.2, back: 0.52 });
        K.box(0.38, 0.62, 0, 0.3, 0.24, 1.42, 0, D, null, false, { inner: true, part: 'body' });
        K.engine(1.2, 0.36, 0, { l: 0.46, w: 0.66, h: 0.38 });
        // the cowl's face under the windscreen (the outer shell): upright, facing the driver, from the dash's top up under the windscreen's
        // foot, so the driver never looks under the bonnet into the nose (the road under the car) above the cockpit's own dashboard. Upright
        // and dark, it shows the clear coat only the road below (a dash top sloping up would catch the sky); not the lining's colour (a
        // closed loft keeps all of that inside: the kit's test of the lining)
        K.face([[0.47, 0.86, -0.78], [0.47, 0.86, 0.78], [0.47, 0.925, 0.745], [0.47, 0.95, 0.28], [0.47, 0.95, -0.28], [0.47, 0.925, -0.745]], D, { part: 'body', noCrush: true });
      },
    },
  });
})();
