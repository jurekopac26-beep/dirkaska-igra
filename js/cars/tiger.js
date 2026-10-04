/* Vehicle 'tiger' — TIGER GT: a front-engined GT racer. Signature features: 1) a long bonnet with louvres over the wheels, 2) a big rear
   wing on swan-neck mounts, 3) a rear diffuser, 4) a front splitter with dive planes, 5) wide arches and centre-lock wheels. L 4.70 W
   2.05 H 1.25, wheelbase 2.70, overhangs F 1.05 R 0.95 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'tiger', name: 'TIGER GT', cat: 'dirkalni', ord: 2, drive: 'FR',
    desc: 'Dirkalnik GT z dolgim pokrovom motorja, velikim krilom in difuzorjem.',
    phys: { mass: 1300, a: 1.3, b: 1.4, kI: 1.28, kw: 405, redline: 8000, idle: 1000, gears: [3.2, 2.08, 1.5, 1.17, 0.95, 0.8], final: 4.73, rw: 0.34, cDrag: 0.42, len: 4.7, wid: 2.05, steerMax: 0.58,
      tracK: 1.2, brakeK: 1.15, spinK: 0.25, aero: 0.00007, loose: 0.72 },
    arc: { amax: 1.9, kv: 2.6, rmin: 4.8 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.1, pwr: 0.06, out: 1, turn: 1.12, w: 0.98, tv: 0.75 },   // (the FR layer: lift-off and power rotation; its own liftP, pwr, out, turn, w, tv)
    stats: { power: 10, grip: 10, weight: 6, drift: 4 },
    price: 85000, pk: 'ppo', field: ['tiger'],
    snd: { kind: 'v8fp', hz: 1.05, loud: 1.2 },
    expect: { t100: [2.68, 3.15], vmax: [249, 264], latG: [2.56, 2.66], d100: [20, 22.1] },
    partNames: { splitter: 'front splitter', diffuser: 'diffuser' },
    parts: { set: 'race', ht: 1.25, y0: 0.1,
      over: {
        bumperF: { df: 0 },
        // (where the look has them: the doors behind the long bonnet, the mirrors at the cowl, the boot lid behind the fastback)
        doorL: { lx: -0.15, y: 0.62 }, doorR: { lx: -0.15, y: 0.62 }, mirrorL: { lx: 0.01, lz: -0.96, y: 0.97 }, mirrorR: { lx: 0.01, lz: 0.96, y: 0.97 },
        trunk: { lx: -0.95, y: 0.96 },
      },
      extra: {
        splitter: { z: 0, th: 0.45, m: 3, rW: 0.42, h: 0.04, lx: 1, lz: 0, f: 0.02, df: 0.3 },
        diffuser: { z: 1, th: 0.55, m: 4, rW: 0.45, h: 0.05, lx: -0.98, lz: 0, f: 0.03, df: 0.15 },
      },
    },
    // the look (KIT API v1, render.js; look units = metres): one loft, the standard regions (bonnet, boot lid, fenders with the lamp corners
    // of the nose, doors with their glass, quarters, bumpers) and the racing parts drawn on: the splitter, the dive planes on the bumper's
    // corners, the diffuser, the wing on its swan necks. The livery: the paint, twin stripes over the top in the stripe colour, the aero
    // parts and the skirts in black carbon, the start number on the roof and on both doors (K.number)
    look: {
      body: { len: 4.7, wid: 2.05, wz: 0.19,
        //       x      w     yb    ybelt  wt    yt     cr     kind  tuck
        secs: [[-2.35, 0.90, 0.34, 0.80, 0.84, 0.96, 0.01, 'b', 0.10],    // the tail panel (the cap): the lamps across its top
          [-2.30, 0.97, 0.31, 0.84, 0.88, 0.99, 0.01, 'b', 0.10],        // the deck's trailing edge (a ducktail)
          [-1.88, 1.02, 0.22, 0.87, 0.74, 0.965, 0.01, 'gr', 0.10],      // the rear glass's foot; the haunches over the rear wheels
          [-1.15, 1.00, 0.13, 0.90, 0.60, 1.16, 0.03, 'r', 0.09],        // the roof's back edge (a long flat fastback behind it)
          [-0.62, 0.91, 0.12, 0.89, 0.62, 1.17, 0.03, 'gf', 0.09],       // the windscreen's top (the cabin narrower than the arches)
          [-0.2, 0.91, 0.126, 0.874, 0.683, 0.985, 0.0175, 'gf', 0.09],  // (the side glass ends here: the mirror sails ahead of it)
          [0.05, 0.91, 0.13, 0.865, 0.72, 0.875, 0.01, 'b', 0.09],       // the cowl (the windscreen's base, far back: the long bonnet; low under the eyes)
          [1.30, 1.00, 0.15, 0.875, 0.77, 0.89, -0.07, 'b', 0.09],       // the front axle: the bonnet sunk between the fenders' flat tops (the louvres on them)
          [2.03, 1.00, 0.15, 0.75, 0.82, 0.77, -0.04, 'b', 0.09],
          [2.24, 0.98, 0.15, 0.645, 0.82, 0.665, -0.02, 'b', 0.09],
          [2.33, 0.93, 0.15, 0.56, 0.79, 0.58, -0.01, 'b', 0.08]],       // the nose (the cap: the fascia with the grille and the lamps)
        eye: { x: -0.85, y: 1.08, style: 'closed' },                    // (far back under the roof, over the cowl: the bonnet stretches ahead)
        door: [0.25, -0.92], bumpF: 0.3, bumpR: 0.2, bumpY: [0.72, 0.62], cage: true,
        crush: { x0: -1.72, x1: -0.37, z: 0.66 } },                     // (the roof and the fastback's glass; clear of the deck under the wing)
      wheels: { style: 'slick', w: 0.3, wR: 0.33, gap: 0.06 },
      // the standard regions; the bonnet from the cowl (the windscreen's base: its second section, at the sails, would start it there), the
      // nose's upper corners (the band over the bumper, by the lamps) with the fenders
      regions: (std) => std.flatMap(r => r.part === 'hood' ? [Object.assign({}, r, { x: [0.05, r.x[1]] })]
        : r.part === 'fenderR' ? [r, ...['L', 'R'].map(s => ({ part: 'fender' + s, x: [2.03, 2.6], bands: ['window'], side: s }))] : [r]),
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, D = K.dark, G = K.GLASS, RED = K.rgb(0xd0141a);
        // ---- the shell: the paint, the glass (windscreen, side windows, the fastback's glass), the tuck all round black (the skirts, the arches' ledges) ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (e === 0 || e === 8) return B;
          if (kind === 'gf') return (e === 2 || e === 6) && at.x > -0.2 ? P : e >= 2 && e <= 6 ? G : P;   // (the side glass up to the mirror sails)
          if (kind === 'r') return e === 2 || e === 6 ? G : P;
          if (kind === 'gr') return e >= 3 && e <= 5 ? G : P;
          return P;
        }, { caps: { front: { col: P, colLow: B, cut: 0.215, high: 'bumperF' }, rear: { col: P, colLow: B } } });   // (the fascia's black lip over the splitter, the rear bumper's black face)
        const D2 = L.decal, XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;
        // the livery: twin stripes over the bonnet, the roof and the deck (off the glass); the skirts black from arch to arch
        for (const s of [-1, 1]) for (const [x0, x1] of [[0.1, 2.31], [-1.12, -0.66], [-2.33, -1.92]]) D2.top([[x0, s * 0.05], [x1, s * 0.05], [x1, s * 0.2], [x0, s * 0.2]], S, 0.008);
        D2.side([[XA + 0.04, 0.1], [XB - 0.04, 0.1], [XB - 0.04, 0.3], [XA + 0.04, 0.3]], B, null, 0.005);
        D2.side([[XA + 0.04, 0.315], [XB - 0.04, 0.315], [XB - 0.04, 0.345], [XA + 0.04, 0.345]], S, null, 0.005);   // (a line in the stripe colour over them)
        // the greenhouse: the A-pillars and the B-pillar in the paint, the small quarter window's raked rear edge
        D2.band([[-0.62, 0.84], [-0.2, 0.62], [-0.2, 1], [-0.62, 1]], P, null, 0.006);
        D2.band([[-0.98, 0], [-0.92, 0], [-0.92, 1], [-0.98, 1]], P, null, 0.006);
        D2.band([[-1.16, -0.01], [-1.0, -0.01], [-1.16, 1.01]], P, null, 0.006);
        // the louvres over the front wheels (the fenders' tops), the vents behind them (the fenders' sides), the bonnet's vent
        for (let i = 0; i < 7; i++) { const x = 1.0 + i * 0.085; D2.band([[x, 0.22], [x + 0.04, 0.22], [x + 0.04, 0.88], [x, 0.88]], B, null, 0.006); }
        D2.side([[0.56, 0.44], [0.7, 0.44], [0.8, 0.7], [0.66, 0.7]], B, null, 0.006);
        D2.top([[1.52, -0.26], [1.86, -0.26], [1.86, 0.26], [1.52, 0.26]], B, 0.014);
        for (let i = 0; i < 3; i++) { const x = 1.58 + i * 0.09; D2.top([[x, -0.24], [x + 0.03, -0.24], [x + 0.03, 0.24], [x, 0.24]], D, 0.018); }
        // the sun strip across the windscreen's top (the stripe colour), the louvres behind the rear wheels
        for (const [z0, z1] of [[-0.6, -0.245], [-0.23, 0.23], [0.245, 0.6]]) D2.top([[-0.62, z0], [-0.55, z0], [-0.55, z1], [-0.62, z1]], S, 0.008);
        for (let i = 0; i < 4; i++) { const x = -1.9 - i * 0.05; D2.side([[x - 0.025, 0.42], [x, 0.42], [x, 0.66], [x - 0.025, 0.66]], B, null, 0.006); }
        // the quick-fill valves on the sails (the C-pillars)
        D2.band([0, 1, 2, 3, 4, 5].map(i => [-1.47 + Math.cos(i * Math.PI / 3) * 0.035, 0.52 + Math.sin(i * Math.PI / 3) * 0.09]), [0.55, 0.56, 0.6], null, 0.008);
        // the start number on the doors
        for (const s of [-1, 1]) K.number(-0.38, 0.56, s * 0.936, 0.3, { dir: s < 0 ? '-z' : 'z', host: s < 0 ? 'doorL' : 'doorR' });
        // ---- the nose: the fascia's big grille, the brake ducts, the slim lamps in black at its upper corners (with the fascia), the stripes
        //      on down to the grille, the tow strap ----
        K.grille(2.334, 0.31, 0, 0.92, 0.22, { slats: 3, host: 'bumperF' });
        for (const s of [-1, 1]) {
          K.rect(2.334, 0.28, s * 0.74, 0.22, 0.13, B, { host: 'bumperF' });
          K.headLamp(2.338, 0.5, s * 0.66, 0.04, { shape: 'rect', w: 0.3, h: 0.08, ring: B, host: 'bumperF' });
          D2.top([[2.24, s * 0.5], [2.33, s * 0.5], [2.33, s * 0.79], [2.24, s * 0.8]], [0.78, 0.8, 0.84], 0.008, { host: 'bumperF' });   // (the lens swept back over the nose)
          K.rect(2.336, 0.4925, s * 0.125, 0.15, 0.145, S, { host: 'bumperF' });
        }
        K.rect(2.336, 0.22, -0.46, 0.05, 0.07, RED, { host: 'bumperF' });
        // the dive planes on the bumper's corners (two a side, their trailing edges up: thin, a face over and one under)
        const fin = (pts, col, o) => { K.face(pts, col, o); K.face(pts.slice().reverse().map(p => [p[0], p[1] - 0.01, p[2]]), col, o); };
        K.part('bumperF', () => { for (const s of [-1, 1]) for (const [x0, y0, x1, y1] of [[2.31, 0.41, 2.14, 0.46], [2.33, 0.28, 2.15, 0.34]]) {
          const q = [[x0, y0, s * 0.92], [x1, y1, s * 0.97], [x1, y1, s * 1.025], [x0, y0, s * 1.0]]; fin(s < 0 ? q.slice().reverse() : q, B);
        } }, { hinge: [[2.1, 0.6, -0.85], [2.1, 0.6, 0.85]] });
        // the splitter under the nose (its top, its underside, its leading edge)
        K.part('splitter', () => { const q = [[1.95, 0.15, -0.98], [1.95, 0.15, 0.98], [2.31, 0.15, 0.98], [2.36, 0.15, 0.86], [2.36, 0.15, -0.86], [2.31, 0.15, -0.98]];
          fin(q, B); K.rect(2.36, 0.145, 0, 1.72, 0.01, B); }, { hinge: [[1.95, 0.14, -0.9], [1.95, 0.14, 0.9]] });
        // ---- the tail: a black band with the slim lamps across its top, the rain light, the exhausts under the bumper's corners, the ducktail's lip ----
        K.rect(-2.352, 0.86, 0, 1.66, 0.1, B, { dir: '-x', part: 'body' });
        for (const s of [-1, 1]) { K.tailLamp(-2.355, 0.86, s * 0.6, 0.4, 0.05); K.exhaust(-2.37, 0.25, s * 0.84, 0.045, 0.3, { n: 6, col: [0.5, 0.47, 0.44], part: 'body' }); }
        K.rect(-2.352, 0.47, 0, 0.14, 0.05, RED, { dir: '-x', host: 'bumperR' });
        K.box(-2.335, 0.975, 0, 0.03, 0.03, 1.6, 0, B, null, false, { part: 'trunk' });
        // the diffuser: the ramp up to the tail, its fins (thin: a face either side)
        K.part('diffuser', () => {
          K.face([[-1.86, 0.12, 0.74], [-2.36, 0.33, 0.74], [-2.36, 0.33, -0.74], [-1.86, 0.12, -0.74]], B);   // (its underside: seen from behind)
          for (const z of [-0.72, -0.36, 0, 0.36, 0.72]) { const q = [[-1.92, 0.115, z], [-2.37, 0.335, z], [-2.37, 0.115, z]]; K.face(q, B); K.face(q.slice().reverse(), B); }
        }, { hinge: [[-1.86, 0.12, -0.7], [-1.86, 0.12, 0.7]] });
        // ---- the wing: the main plane (an airfoil, its trailing edge raised: black carbon, it reads over the deck from the chase camera) and a flap
        //      over it (the stripe colour), the endplates (the paint), the swan necks over its leading edge ----
        K.part('wing', () => {
          const AF = [[-2.03, 1.18], [-2.05, 1.202], [-2.13, 1.216], [-2.25, 1.225], [-2.35, 1.232], [-2.352, 1.223], [-2.25, 1.204], [-2.13, 1.185], [-2.05, 1.173]];
          K.skin([-0.9, 0.9].map(z => AF.map(([x, y]) => [x, y, z])), B);   // (its ends in the endplates)
          K.wingPlank(-2.27, 1.24, -2.36, 1.262, 0.012, -0.9, 0.9, S);
          for (const s of [-1, 1]) {
            const ep = [[-2.0, 1.11, s * 0.905], [-2.37, 1.12, s * 0.905], [-2.37, 1.28, s * 0.905], [-2.04, 1.255, s * 0.905]]; K.face(ep, P); K.face(ep.slice().reverse(), P);   // (thin: a face either side)
            const path = [[-1.95, 0.955], [-1.985, 1.16], [-2.03, 1.242], [-2.095, 1.252], [-2.16, 1.216]], wd = [0.075, 0.06, 0.05, 0.048, 0.055], t = 0.013;
            K.skin(path.map((p, i) => { const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)], tl = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / tl, ny = (b[0] - a[0]) / tl, h = wd[i] / 2;
              return [[p[0] + nx * h, p[1] + ny * h, s * 0.42 - t], [p[0] + nx * h, p[1] + ny * h, s * 0.42 + t], [p[0] - nx * h, p[1] - ny * h, s * 0.42 + t], [p[0] - nx * h, p[1] - ny * h, s * 0.42 - t]]; }), B);   // (its ends in the deck and the wing)
          }
        }, { noCrush: true, noDent: true, hinge: [[-1.95, 0.97, -0.42], [-1.95, 0.97, 0.42]] });
        // ---- the wide arches' lips (in the fenders and the quarters) ----
        for (const s of [-1, 1]) { K.flare(K.fx, 0.4, 0.45, s * 0.975, s * 1.025, P, { n: 5 }); K.flare(K.rx, 0.4, 0.45, s * 0.985, s * 1.025, P, { n: 5 }); }
        // ---- the mirrors (black, on stalks from the doors' tops), the wiper ----
        for (const s of [-1, 1]) { K.mirror(0.0, 0.95, s * 1.0, { w: 0.17, h: 0.07, d: 0.12, col: B, arm: B, z0: s * 0.92 });
          K.bar([0.05, 0.872, s * 0.905], [0.01, 0.935, s * 0.96], 0.016, B, { n: 4, part: s < 0 ? 'mirrorL' : 'mirrorR' }); }
        K.bar([0.04, 0.935, -0.52], [0.0, 0.95, 0.22], 0.01, B, { n: 4, part: 'body' });
        // ---- the hinges: the bonnet at the cowl, the boot lid at the rear glass, the doors at their front edges, the bumpers at their tops ----
        K.hinge('hood', [0.07, 0.885, -0.6], [0.07, 0.885, 0.6]);
        K.hinge('trunk', [-1.9, 0.965, -0.6], [-1.9, 0.965, 0.6]);
        for (const s of [-1, 1]) K.hinge(s < 0 ? 'doorL' : 'doorR', [0.25, 0.25, s * 0.93], [0.25, 0.85, s * 0.93]);
        K.hinge('bumperR', [-2.2, 0.6, -0.85], [-2.2, 0.6, 0.85]);
        // ---- inside (seen once a part is off): the bucket seat, the wheel, the dashboard, the cage; the V8 behind the front axle, the radiator
        //      behind the grille, the fuel cell under the deck ----
        K.seat(-1.05, 0.34, -0.36, { w: 0.48, l: 0.46, back: 0.7, tilt: 0.28 });
        K.cyl([-0.56, 0.74, -0.36], [-0.53, 0.72, -0.36], 0.15, B, { n: 8, inner: true, part: 'body' });
        K.box(-0.42, 0.52, 0, 0.32, 0.22, 1.5, 0, D, null, false, { inner: true, part: 'body' });
        K.cyl([-0.85, 0.24, 0.36], [-1.2, 0.24, 0.36], 0.07, RED, { n: 6, inner: true, part: 'body' });   // (the extinguisher on the passenger's side)
        const hoop = (s) => [[[-1.32, 0.17, s * 0.8], [-1.32, 0.86, s * 0.86]], [[-1.32, 0.86, s * 0.86], [-1.3, 1.08, s * 0.52]], [[-1.3, 1.08, s * 0.52], [-0.68, 1.11, s * 0.55]],
          [[-0.68, 1.11, s * 0.55], [-0.24, 0.62, s * 0.78]], [[-1.32, 0.45, s * 0.84], [-0.26, 0.5, s * 0.8]]];   // (the main hoop, the roof and A-pillar bars, the door bars)
        K.cage(hoop(-1).concat(hoop(1), [[[-1.3, 1.08, -0.52], [-1.3, 1.08, 0.52]], [[-1.32, 0.17, 0.8], [-1.3, 1.08, -0.52]]]), 0.022, null, { n: 4 });
        K.engine(0.72, 0.22, 0, { l: 0.72, w: 0.62, h: 0.5, col: [0.6, 0.61, 0.64] });
        K.box(2.12, 0.18, 0, 0.08, 0.36, 1.2, 0, D, null, false, { inner: true, part: 'body' });
        K.box(-2.08, 0.36, 0, 0.36, 0.3, 0.9, 0, [0.26, 0.26, 0.28], null, false, { inner: true, part: 'body' });
      },
    },
  });
})();
