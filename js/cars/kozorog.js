/* Vehicle 'kozorog' — KOZOROG TC: a touring car (TCR-style front-drive saloon racer). Signature features: 1) very wide bolted-on arches
   over a road saloon body, 2) a deep front splitter, 3) a rear wing on the boot, 4) a roof-mounted fin and a rain light, 5) centre-lock
   race wheels. L 4.40 W 1.95 H 1.38, wheelbase 2.65, overhangs F 0.90 R 0.85 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'kozorog', name: 'KOZOROG TC', cat: 'dirkalni', ord: 1, drive: 'FF',
    desc: 'Turistični dirkalnik: široki blatniki, spojler spredaj in krilo zadaj.',
    phys: { mass: 1180, a: 1.3, b: 1.35, kI: 1.2, kw: 260, redline: 8500, idle: 1000, gears: [3.2, 2.08, 1.5, 1.17, 0.95, 0.8], final: 5.39, rw: 0.33, cDrag: 0.4, len: 4.4, wid: 1.95, steerMax: 0.6,
      tracK: 1.15, brakeK: 1.1, spinK: 0.3, aero: 0.00004, loose: 0.8 },
    arc: { amax: 1.86, kv: 2.4, rmin: 4.6 },
    csp: { bx: 0.15, coast: -0.095, thr: -0.03, liftP: 0, pwr: 0, out: 1, turn: 1.1, w: 1, tv: 0.85 },   // (the FF layer: pivots on the brakes, the throttle pulls it straight; its own turn, w, tv)
    stats: { power: 7, grip: 10, weight: 7, drift: 3 },
    price: 55000, pk: 'ppo', field: ['kozorog'],
    snd: { kind: 'i4', hz: 1.2, turbo: 0.8, loud: 1.1 },
    expect: { t100: [2.61, 3.06], vmax: [225, 239], latG: [2.45, 2.55], d100: [20.9, 23.1] },
    partNames: { splitter: 'front splitter' },
    parts: { set: 'race', ht: 1.38, y0: 0.12,
      over: {
        bumperF: { df: 0 },
      },
      extra: {
        splitter: { z: 0, th: 0.45, m: 3, rW: 0.4, h: 0.04, lx: 1, lz: 0, f: 0.02, df: 0.3 },
      },
    },
    // the look (KIT API v1, render.js; look units = metres): a modern three-box saloon on a loft whose front wings are pushed out over the
    // wheels (the blister, a vent behind it), bolted-on blisters over the rear wheels (a skin of their own on the narrower body), black
    // skirts between them; the deep splitter under the bumper's mouth, the wing on two stands on the boot lid, the fin on the roof's back,
    // the rain light in the diffuser; slick wheels with centre-lock nuts. The standard regions cut the loft: the bonnet, the boot lid, the
    // wings, the quarters (with the rear door and the blister), the front doors with their glass, the bumpers, the mirrors
    look: {
      body: { len: 4.4, wid: 1.95,
        //       x      w      yb    ybelt  wt    yt     cr      kind  tuck
        secs: [[-2.18, 0.86, 0.26, 0.78, 0.74, 0.955, 0.015, 'b', 0.1],   // the tail: the boot's rear face, its upper corners sloping in (the lamps wrap round)
          [-2.08, 0.9, 0.22, 0.84, 0.79, 0.985, 0.02, 'b', 0.1],         // the rear corners
          [-1.95, 0.9, 0.2, 0.9, 0.81, 1.0, 0.025, 'b', 0.1],            // the rear bumper's front edge
          [-1.6704, 0.9, 0.17, 0.93, 0.8, 1.005, 0.025, 'gr', 0.1],      // the rear glass's base: the boot lid behind it (on a cut of the rear arch)
          [-1.0296, 0.9, 0.12, 0.91, 0.64, 1.295, 0.035, 'r', 0.1],      // the roof's back edge (on a cut of the rear arch)
          [-0.12, 0.9, 0.12, 0.89, 0.64, 1.315, 0.035, 'gf', 0.1],       // the windscreen's top
          [0.62, 0.9, 0.12, 0.87, 0.77, 0.93, 0, 'b', 0.1],              // the cowl
          [0.72, 0.9, 0.12, 0.865, 0.78, 0.925, -0.005, 'b', 0.1],       // the front blister's back: its vent
          [0.82, 0.975, 0.12, 0.855, 0.8, 0.915, -0.015, 'b', 0.1],      // the front blister (the wing pushed out over the wheel)
          [1.8, 0.975, 0.15, 0.81, 0.8, 0.885, -0.015, 'b', 0.1],
          [2.02, 0.96, 0.16, 0.62, 0.76, 0.78, 0, 'b', 0.11],            // the bumper's corners; the nose's upper corners sloping in
          [2.15, 0.9, 0.17, 0.5, 0.68, 0.68, 0.01, 'b', 0.11]],          // the nose: the lamps, the grilles
        eye: { x: -0.58, y: 1.12, style: 'closed' }, cage: true,          // (low in the bucket, the roll cage round the driver)
        door: [0.62, -0.45], bumpF: 0.35, bumpR: 0.23, bumpY: [0.5, 0.6],
        decalX: -0.45, decalY: 1.345, decalRz: 0.014, decalS: 0.66 },     // (the start number on the roof's front half: the fin is behind it)
      wheels: { style: 'slick', w: 0.25, gap: 0.04 },
      regions: (std) => std.map(r => r.part === 'hood' || r.part === 'trunk' ? Object.assign({}, r, { bands: ['edge', 'crown'] }) : r),   // (the lids: their tops only; the nose's and the tail's sloping corners stay with the body)
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, D = [0.06, 0.06, 0.065], CF = [0.045, 0.045, 0.05], RD = [0.86, 0.12, 0.08], LT = [0.4, 0.04, 0.03];
        const dirZ = (sd) => sd < 0 ? '-z' : 'z', LR = (n, sd) => n + (sd < 0 ? 'L' : 'R'), XR = -1.0296;
        // ---- the shell: the paint, the glass (the windscreen, the side windows to the C-pillar, the rear glass), the sills dark, the arches'
        //      ledges black, the vent behind each front wheel black ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch ? B : D;
          if ((e === 1 || e === 7) && at.x > 0.72 && at.x < 0.82) return B;
          if (kind === 'gf') return e >= 2 && e <= 6 ? G : P;
          if (kind === 'r') return e === 2 || e === 6 ? G : P;
          if (kind === 'gr') return e >= 3 && e <= 5 ? G : P;
          return P;
        }, { caps: { front: { col: P }, rear: { col: P } } });
        const DL = L.decal;
        // the glass's black frames: along the belt, under the roof's edge, the B-pillar; the A-pillars black (two pieces: the pillar keeps its width)
        DL.band([[XR, 0], [0.62, 0], [0.62, 0.06], [XR, 0.06]], B, null, 0.006);
        DL.band([[XR, 0.91], [-0.12, 0.91], [-0.12, 1], [XR, 1]], B, null, 0.006);
        DL.band([[-0.51, 0], [-0.41, 0], [-0.41, 1], [-0.51, 1]], B, null, 0.008);
        DL.band([[-0.12, 0.83], [0.3, 0.68], [0.3, 1], [-0.12, 1]], B, null, 0.008);
        DL.band([[0.3, 0.68], [0.62, 0], [0.62, 1], [0.3, 1]], B, null, 0.008);
        // the shut lines of the front doors (their front and rear edges)
        for (const x of [0.6, -0.465]) DL.side([[x, 0.23], [x + 0.012, 0.23], [x + 0.012, 0.86], [x, 0.86]], K.shade(P, 0.45), null, 0.004);
        // the sun strip over the windscreen (the stripe colour; split at the crown's edges: a flat piece would sink under the crest)
        for (const [z0, z1] of [[-0.66, -0.243], [-0.243, 0.243], [0.243, 0.66]]) DL.top([[-0.12, z0], [-0.04, z0], [-0.04, z1], [-0.12, z1]], S, 0.006);
        // the bonnet's vent (the radiator's outlet)
        DL.top([[1.42, -0.28], [1.72, -0.28], [1.72, 0.28], [1.42, 0.28]], D, 0.006);
        // the tail lamps wrapping round the rear corners (dark red on the sloping corners; the lit lenses are on the tail's face)
        DL.band([[-2.18, 0.2], [-2.12, 0.12], [-2.12, 0.5], [-2.18, 0.62]], LT, null, 0.006);
        // the livery: a band of the stripe colour along the shoulders, nose to tail, widening to the back
        DL.side([[1.86, 0.735], [-2.12, 0.77], [-2.12, 0.86], [1.86, 0.785]], S, null, 0.005);
        // ---- the numbers on the front doors ----
        for (const sd of [-1, 1]) K.number(0.06, 0.58, sd * 0.909, 0.3, { dir: dirZ(sd), host: LR('door', sd) });
        // ---- the rear flares: bolted onto the narrower body round the rear wheels, from the skirt's end to the bumper; their tops follow
        //      the arch, their backs open (a black vent). Raw faces: the underside, the face, the top (the inside against the body unseen) ----
        for (const sd of [-1, 1]) K.part(LR('quarter', sd), () => {
          const R = [[-0.58, 0.1, 0.25, 0.955], [-0.76, 0.12, 0.6, 0.975]], zi = sd * 0.885;
          for (let i = 0; i <= 6; i++) { const t = i * Math.PI / 6, r = 0.385; R.push([K.rx + r * Math.cos(t), 0.33 + r * Math.sin(t), Math.max(0.6, 0.33 + 0.5 * Math.sin(t)), 0.975]); }
          R.push([-1.9, 0.2, 0.6, 0.975], [-2.02, 0.23, 0.58, 0.955]);
          const Q = R.map(([x, lo, hi, zo]) => [[x, lo, zi], [x, lo, sd * zo], [x, hi, sd * (zo - 0.01)], [x, hi + 0.035, zi]]);
          for (let i = 0; i < Q.length - 1; i++) { const a = Q[i], b = Q[i + 1], m = [(a[0][0] + b[0][0]) / 2, (a[0][1] + a[3][1] + b[0][1] + b[3][1]) / 4, zi];
            K.g.quadO(a[0], b[0], b[1], a[1], B, m); K.g.quadO(a[1], b[1], b[2], a[2], P, m); K.g.quadO(a[2], b[2], b[3], a[3], P, m); }
          const e = Q[Q.length - 1]; K.g.quadO(e[0], e[1], e[2], e[3], B, [e[0][0] + 1, e[0][1], zi]);
        });
        // ---- the skirts between the arches (into the rear flares) ----
        for (const sd of [-1, 1]) K.box(0.08, 0.1, sd * 0.915, 1.32, 0.15, 0.08, 0, CF);
        // ---- the nose: the slim head lamps, the grille between them, the bumper's big mouth and its corner ducts, the tow strap ----
        for (const sd of [-1, 1]) K.headLamp(2.155, 0.575, sd * 0.6, 0.04, { shape: 'rect', w: 0.3, h: 0.07, ring: B, host: 'body' });
        K.grille(2.152, 0.575, 0, 0.66, 0.07, { slats: 1 });
        K.part('bumperF', () => {
          K.grille(2.153, 0.33, 0, 1.0, 0.24, { slats: 2 });
          for (const sd of [-1, 1]) K.rect(2.153, 0.3, sd * 0.68, 0.2, 0.16, B);
          K.box(2.0, 0.105, 0, 0.3, 0.07, 1.66, 0, CF);                       // the air dam down to the splitter
          K.rect(2.154, 0.42, 0.38, 0.05, 0.1, RD);                            // the tow strap
        });
        // ---- the splitter: a deep black plate under the mouth, its fences ----
        K.part('splitter', () => {
          K.box(2.03, 0.083, 0, 0.4, 0.022, 1.78, 0, CF);
          for (const sd of [-1, 1]) K.box(2.02, 0.083, sd * 0.88, 0.38, 0.07, 0.02, 0, CF);
        });
        // ---- the tail: the slim lamps in black surrounds, the rain light (red, lit with the brakes) in the bumper over the diffuser ----
        for (const sd of [-1, 1]) { K.rect(-2.182, 0.84, sd * 0.6, 0.4, 0.1, B, { dir: '-x', part: 'body' }); K.tailLamp(-2.184, 0.84, sd * 0.6, 0.36, 0.07); }
        K.rect(-2.182, 0.84, 0, 0.42, 0.05, B, { dir: '-x', part: 'body' });   // (a black band between them)
        K.rect(-2.182, 0.6, 0, 1.6, 0.012, K.shade(P, 0.45), { dir: '-x', part: 'body' });   // (the bumper's shut line)
        K.rect(-2.182, 0.35, 0, 1.64, 0.18, CF, { dir: '-x', part: 'bumperR' });   // the bumper's black lower half, the rain light in its middle
        K.rect(-2.186, 0.36, 0, 0.24, 0.1, B, { dir: '-x', part: 'bumperR' }); K.tailLamp(-2.188, 0.36, 0, 0.2, 0.07);
        K.part('bumperR', () => {
          K.box(-2.1, 0.1, 0, 0.2, 0.16, 1.5, 0, CF);                          // the diffuser
          for (const z of [-0.45, -0.15, 0.15, 0.45]) K.rect(-2.202, 0.18, z, 0.025, 0.16, D, { dir: '-x' });   // (its fins)
          K.rect(-2.184, 0.47, -0.38, 0.05, 0.1, RD, { dir: '-x' });          // the tow strap
        });
        K.exhaust(-2.2, 0.2, -0.62, 0.05, 0.2, { part: 'body', n: 6 });
        // ---- the wing on the boot lid: one plane on two stands, its endplates ----
        K.part('wing', () => {
          K.wingPlank(-1.86, 1.215, -2.16, 1.255, 0.03, -0.8, 0.8, S);
          for (const sd of [-1, 1]) {
            K.endplate([[-1.84, 1.15], [-2.18, 1.13], [-2.19, 1.32], [-1.9, 1.29]], sd * 0.81, 0.012, B);
            K.box(-2.03, 0.98, sd * 0.42, 0.16, 0.25, 0.025, 0, B);
          }
        }, { noCrush: true, noDent: true });
        // ---- the fin on the roof's back (never crushed out of shape: it goes down with the roof) ----
        K.part('body', () => K.endplate([[-0.7, 1.335], [-1.045, 1.315], [-1.025, 1.415]], 0, 0.035, S), { noCrush: true, noDent: true });
        // ---- the mirrors, the wiper ----
        for (const sd of [-1, 1]) K.mirror(0.5, 0.99, sd * 0.99, { w: 0.1, h: 0.075, d: 0.15, col: S });
        K.bar([0.66, 0.945, -0.5], [0.6, 0.97, 0.3], 0.01, B, { n: 4, part: 'body' });
        // the dashboard's top seen from the seat (the outer shell: the cockpit draws no cabin), up to the windscreen's base as the driver
        // sees it: no seeing under the low bonnet through the car
        K.rect(0.28, 0.785, 0, 1.68, 0.39, D, { dir: '-x', part: 'body' });
        // ---- hinges: the bonnet at the cowl, the boot lid at the rear glass, the doors at their front edges ----
        K.hinge('hood', [0.64, 0.92, -0.6], [0.64, 0.92, 0.6]);
        K.hinge('trunk', [-1.62, 1.02, -0.6], [-1.62, 1.02, 0.6]);
        for (const sd of [-1, 1]) K.hinge(LR('door', sd), [0.6, 0.3, sd * 0.9], [0.6, 0.85, sd * 0.9]);
        // ---- inside (seen once a part is off): the bucket seat, the dashboard and the wheel, the roll cage, the extinguisher; the
        //      transverse four in the bay ----
        K.seat(-0.38, 0.36, -0.36, { w: 0.5, l: 0.48, back: 0.78, tilt: 0.24 });
        K.box(0.42, 0.6, 0, 0.32, 0.24, 1.5, 0, D, null, false, { inner: true, part: 'body' });
        K.cyl([0.16, 0.84, -0.36], [0.12, 0.86, -0.36], 0.17, B, { n: 8, inner: true, part: 'body' });
        K.cyl([-0.2, 0.2, 0.42], [0.25, 0.2, 0.42], 0.07, RD, { n: 6, inner: true, part: 'body' });
        const cg = [0.75, 0.76, 0.78];
        K.cage([
          [[-0.62, 0.16, -0.8], [-0.62, 1.2, -0.6]], [[-0.62, 0.16, 0.8], [-0.62, 1.2, 0.6]], [[-0.62, 1.2, -0.6], [-0.62, 1.2, 0.6]],
          [[0.55, 0.3, -0.78], [-0.1, 1.23, -0.6]], [[0.55, 0.3, 0.78], [-0.1, 1.23, 0.6]], [[-0.1, 1.23, -0.6], [-0.62, 1.2, -0.6]], [[-0.1, 1.23, 0.6], [-0.62, 1.2, 0.6]],
          [[0.45, 0.32, -0.8], [-0.6, 0.75, -0.8]], [[0.45, 0.75, -0.8], [-0.6, 0.32, -0.8]], [[0.45, 0.5, 0.8], [-0.6, 0.5, 0.8]],
          [[-0.62, 1.18, -0.55], [-1.6, 0.6, -0.6]], [[-0.62, 1.18, 0.55], [-1.6, 0.6, 0.6]], [[-0.62, 1.18, -0.55], [-0.62, 0.2, 0.75]],
        ], 0.022, cg, { n: 4 });
        K.engine(1.5, 0.28, 0, { l: 0.5, w: 0.66, h: 0.42 });
      },
    },
  });
})();
