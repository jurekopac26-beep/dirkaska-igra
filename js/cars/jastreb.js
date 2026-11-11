/* Vehicle 'jastreb' — JASTREB 6: a 1960s British long-bonnet GT. Signature features: 1) a very long bonnet with a power bulge down its
   middle, 2) an oval grille mouth, 3) covered headlamps in the wing tips, 4) a short fastback tail, 5) wire wheels with knock-off
   spinners. L 4.45 W 1.66 H 1.22, wheelbase 2.44, overhangs F 0.90 R 1.11 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  // the head lamp's front (2 + 4, the user's choice 29. 10. 2026): the glass dome's section at x 2.085 round the lamp's middle (z 0.4922,
  // y 0.5898; [out from the car's middle, up], m): the stock lamp and every garage lamp is this outline, bulging into the dome's nose
  const LAMP = [[-0.0082, -0.0126], [0.0459, -0.03], [0.0477, 0.0021], [0.0216, 0.033], [-0.0172, 0.0446], [-0.0459, 0.03]];
  VEHICLE_DEFS.push({
    id: 'jastreb', name: 'JASTREB 6', cat: 'klasika', ord: 1, drive: 'FR',
    desc: 'Britanski GT iz 60-ih: dolg pokrov motorja, ovalna maska in žična platišča.',
    phys: { mass: 1250, a: 1.33, b: 1.11, kI: 1.22, kw: 200, redline: 6000, idle: 750, gears: [3, 1.9, 1.35, 1], final: 3.38, rw: 0.33, cDrag: 0.4, len: 4.45, wid: 1.66, steerMax: 0.62,
      brakeK: 0.9, spinK: 0.6 },
    arc: { amax: 1.6, kv: 1.9, rmin: 4.8 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.15, pwr: 0.1, out: 1.35, turn: 0.96, w: 1, tv: 1.08 },   // (the FR layer: lift-off and power rotation; its own out, tv, turn)
    stats: { power: 5, grip: 4, weight: 7, drift: 10 },
    price: 40000, pk: 'ta1', field: ['jastreb'],
    snd: { kind: 'i6', hz: 0.95, loud: 1 },
    expect: { t100: [3.32, 3.9], vmax: [202, 214], latG: [2.04, 2.14], d100: [25, 27.6] },
    partNames: { headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamp', tailR: 'right tail lamp', plate: 'number plate', wiperFront: 'windscreen wipers' },
    parts: { set: 'car', ht: 1.22, y0: 0.2,   // (the debris thrown from where the look has the parts: the tailgate is the fastback's glass, the wings run to the nose)
      // (as KOLIBRI's: the head lamps (the domes' noses in the wing tips) parts of their own, mounted on the fenders (they go with them); a
      // hit on their corner knocks one out. The round tail lamps likewise; the number plate on the rear bumper (it goes with it), the
      // wipers at the windscreen's foot)
      extra: {
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.12, h: 0.06, lx: 0.94, lz: -0.59, f: 0.38, on: 'fenderL' },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.12, h: 0.06, lx: 0.94, lz: 0.59, f: 0.38, on: 'fenderR' },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.15, h: 0.05, lx: -1.0, lz: -0.45, f: 0.34 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.15, h: 0.05, lx: -1.0, lz: 0.45, f: 0.34 },
        plate: { z: 1, th: 0.4, m: 1, r: 0.17, h: 0.02, lx: -1.0, lz: 0, f: 0.26, on: 'bumperR' },
        wiperFront: { z: 0, th: 0.65, m: 0.5, r: 0.4, h: 0.03, lx: 0.17, lz: -0.1, f: 0.65 },
      },
      over: { trunk: { lx: -0.5, y: 1.07 }, fenderL: { lx: 0.71, lz: -0.77, y: 0.57, h: 0.15 }, fenderR: { lx: 0.71, lz: 0.77, y: 0.57, h: 0.15 }, doorL: { lx: -0.085, lz: -0.94, y: 0.67 }, doorR: { lx: -0.085, lz: 0.94, y: 0.67 },
        mirrorL: { lx: 0.09, lz: -0.89, y: 0.94 }, mirrorR: { lx: 0.09, lz: 0.89, y: 0.94 }, quarterL: { lx: -0.575, lz: -0.84, y: 0.68, h: 0.15 }, quarterR: { lx: -0.575, lz: 0.84, y: 0.68, h: 0.15 } } },   // (the wings with their tops lie as thick as they are)
    // where the garage's parts go (js/deli.js, look units): a wing on the tail's deck behind the fastback (no part of its own: the body's;
    // the prototype's fin no further forward than the glass's foot); the head lamps the noses of the glass domes on the wings' tips, each
    // option of the stock lamp's outline (LAMP; its colour, ring and details on its lens bulging as the nose; the dome in its colours: the
    // whole of it the lamp); the rims on its wheels. All 38 (docs/deli.md, Klasika)
    mounts: {
      krilo: { x: -2.08, w: 0.5, part: 'body', front: -1.62 },
      zarometi: { x: 2.085, y0: 0.5898, lean: 0, zc: 0.4922, yc: 0.5898, s: 0.3, hosts: ['headL', 'headR'], socket: 'host', ringW: 0.006, bulge: 0.027, shape: LAMP },
      platisca: {},
      // (sklop 2 · spredaj, js/deli/spredaj.js) the kit's skirts between the arches, its front flares on the long nose's narrower wings
      // (wsF), the diffuser's valance one across over the twin pipes (valY); the bonnet from the cowl to the nose, two cells along its
      // curved top; the grille in the mouth; the indicators under the lamps (in the wings), the repeaters on the wings, the rear ones on
      // the rear bumper, the mirrors' fronts; the extra lamps on the bumper's face, between the domes, in the mouth and in a pod over the
      // nose (the four's feet beside the narrow mouth), the roof bar on the roof's front edge
      aero: { xf: 2.23, xr: -2.22, w: 0.5, yf: 0.31, yr: 0.33, sill: [-0.73, 0.95], ws: 0.83, wsF: 0.78, ys: 0.17, exh: [-0.07, 0.028], valY: 0.335 },
      hauba: { x0: 0.42, x1: 1.9, w: 0.55, rel: true, bulge: 1.2, cells: 2 },
      maska: { x: 2.233, y0: 0.43, lean: 0, yc: 0.43, w: 0.5, h: 0.17 },
      zmigavci: { front: { x: 2.138, y: 0.455, z: 0.51, w: 0.06, h: 0.04, parts: ['fenderL', 'fenderR'] }, side: { x: 0.7, y: 0.6, z: 0.817 },
        rear: { x: -2.22, y: 0.4, z: 0.42, part: 'bumperR' }, mirror: { x: 0.2405, y: 0.95, z: 0.745, w: 0.06, parts: ['mirrorL', 'mirrorR'] } },
      relijske_luci: { bumper: [2.24, 0.42, 0.33], nose: [2.2, 0.62], intake: [2.233, 0.43, 0.53, 0.18], roof: [-0.16, 0.5], pod: [2.2, 0.48, 0.6, 0.45], foot: 0.38, feet: 0.3, part: 'bumperF' },
      // (js/deli/zadaj.js) the tail lamps' room where the round lamps are, the band across the tail between them; the twin tips under
      // the tail's middle (the silencer up under the floor: drum, pipe); the deck lid on the tail's deck behind the fastback, six cells
      // along its curve; the tow points beside the mouth (over a lip) and over the tail's foot (between a diffuser's fins; none behind
      // rally lamps); the flaps behind the wheels, the guards on the sills
      zadnje_luci: { x: -2.201, zc: 0.37, yc: 0.545, w: 0.14, h: 0.3, s: 0.45, shape: [[-0.062, -0.062], [0.062, -0.062], [0.062, 0.062], [-0.062, 0.062]], hosts: ['tailL', 'tailR'],
        bar: { x: -2.22, y: 0.545, w: 0.25, h: 0.03, part: 'body' } },
      auspuh: { x: -2.25, y: 0.262, z: 0.07, r: 0.028, len: 0.3, part: 'body', drum: 0.235, pipe: 0.26 },
      prtljaznik: { x: [-2.2, -1.5], w: 0.4, cells: 6, part: 'body' },
      vlecne_kljuke: { f: [2.23, 0.42, 0.2], r: [-2.22, 0.45, 0.25], behindLamps: true },
      lovilci_blata: { x: [0.9, -1.53], z: [0.6, 0.8], y: [0.3, 0.07], sill: [-0.7, 0.88, 0.2, 0.8], part: 'body' },
      // (js/deli/streha.js) the sunroofs on the short roof between the windscreen's top and the fastback (back: none past the roof's
      // rear end, nor over a fin there), the scoop's mouth at the roof's front (no longer than the roof); the aerials: the rod on the
      // tail's deck beside the lid, the fin on the roof's rear, the stub at its front, the whip's foot mid-roof (its tip short of a
      // wing); the louvres over the fastback's glass (in the tailgate)
      streha: { x0: -0.69, x1: -0.2, xf: -0.2, xr: -0.55, back: -0.7 },
      stresna_zajemalka: { x: -0.2, z: 0, back: -0.7 },
      antena: { x: -1.7, z: 0.45, fin: [-0.72, 0], front: [-0.2, 0.45], whip: -0.45, part: 'body' },
      zaluzije: { x0: -1.455, y0: 0.905, x1: -0.86, y1: 1.132, w: 0.38, part: 'trunk' },
      // (js/deli/bok.js) the mirrors on the doors' front corners, the doors inside their shut lines (the window's net and frame on the
      // stock glass' outline, its slanted front in five points)
      ogledala: { x: 0.205, y: 0.95, z: 0.745, w: 0.07, h: 0.09, d: 0.09, z0: 0.69 },
      vrata: { x: [-0.6, 0.34], y: [0.2, 0.85], handle: [-0.42, 0.68, 0.833, 0.11, 0.022], win: [[-0.6, 0.3223], [-0.16, 0.3222], [0.267, 0.829], [-0.16, 0.9333], [-0.6, 0.9333]], frame: [-0.62, -0.6, 0.93, 1.0] },
      zavore: { s: 1 },
      matice: { k: 4, r: 0.2, lock: true },
      // (sklop 3 · barve, js/deli/barve.js) the stripes along the top, each cut to the top's half width (fit: the nose narrowing to its
      // mouth, the tail to its end); the decals on the doors, the wings ahead of them and the rear wings, on the bonnet and the roof; the
      // sun strip on the windscreen's top; the fuel cap on the right rear wing; the calipers
      barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {},
      crte: { z: [0.22, 0.42], fit: true },
      nalepke: { side: [[-0.58, 0.32], [0.42, 0.9], [-2.0, -1.55]], y: [0.36, 0.68], hood: { x: [1.0, 1.7], z: [0.24, 0.5] }, roof: { x: [-0.7, -0.2] } },
      soncni_pas: { x: [-0.115, -0.03] }, zamasek: { x: -1.75, y: 0.6, z: 0.81, r: 0.04 },
      celjusti: { r: [0.1, 0.18], a: [70, 125] },
      // (sklop 3 · skriti deli, js/deli/skriti.js) the long six's bay: the filter against the block's left side, the turbo against its
      // right with the intercooler ahead of the radiator, the battery on the floor behind it, the control box on the block's top; the
      // struts and bars at the wheels
      filter_zraka: { x: 1.0, y: 0.5, z: -0.35 }, akumulator: { x: 0.62, y: 0.2, z: 0.4 }, turbo: { x: 1.1, y: 0.45, z: 0.36, ic: [2.01, 0.44, 0] }, cip: { x: 0.56, y: 0.597, z: 0.19 },
      vzmeti: { in: 0.13, top: 0.7 }, amortizerji: { in: 0.13, top: 0.7 }, stabilizatorji: { in: 0.13, floor: 0.21 }, dim_gum: {},
    },
    // the look (KIT API v1, render.js; look units = metres): one loft through the sections below, cut by the regions into the bonnet's top (with
    // the power bulge), the wings to the nose (the covered lamps with them), the doors (their glass), the rear wings (the quarter lights), the
    // tailgate (the fastback's glass in its frame) and the nose and tail ends (bumpers: the mouth, the chrome blades); the windows and their
    // chrome are strips on the window band; the livery: the paint, a centre stripe in the stripe colour, the start number in white roundels
    look: {
      body: { len: 4.45, wid: 1.66, roofY: 1.22, lamps: [[2.1, 0.59, 0.49], [-2.226, 0.545, 0.37]],   // (the glow: the head lamps' noses, the tail lamps)
        // (the sections at 0.95 .. 1.71 and -1.49 .. -0.73 sit exactly where the wheel arches cut the shell: they shape the bonnet's wings and
        // the fastback over the wheels at no extra cost; the sill there 0.33, the hub's height: the arches' half length is their radius)
        //       x        w     yb    ybelt  wt    yt     cr     kind  tuck
        secs: [[-2.22, 0.5, 0.35, 0.52, 0.42, 0.57, 0.015, 'b', 0.05],    // the tail's end (the plate, the blades, the lamps over them)
          [-2.18, 0.64, 0.31, 0.58, 0.52, 0.655, 0.025, 'b', 0.08],
          [-2.08, 0.74, 0.28, 0.64, 0.56, 0.72, 0.035, 'b', 0.1],
          [-1.9, 0.8, 0.25, 0.69, 0.53, 0.795, 0.04, 'b', 0.1],
          [-1.49, 0.83, 0.21, 0.72, 0.42, 0.895, 0.045, 'gr', 0.12],     // the tailgate's glass from its foot (the rear arch's front end)
          [-1.43909, 0.83, 0.17, 0.72, 0.43, 0.918, 0.045, 'gr', 0.16],
          [-1.3, 0.83, 0.17, 0.72, 0.45, 0.97, 0.045, 'gr', 0.16],
          [-1.11, 0.83, 0.17, 0.72, 0.48, 1.045, 0.045, 'gr', 0.16],
          [-0.92, 0.83, 0.17, 0.72, 0.5, 1.115, 0.045, 'gr', 0.16],
          [-0.78091, 0.83, 0.17, 0.72, 0.515, 1.155, 0.045, 'gr', 0.16],
          [-0.73, 0.83, 0.17, 0.72, 0.52, 1.168, 0.045, 'r', 0.16],      // the roof's back edge (the rear arch's rear end)
          [-0.45, 0.83, 0.16, 0.72, 0.545, 1.172, 0.045, 'r', 0.19],
          [-0.16, 0.83, 0.16, 0.72, 0.54, 1.17, 0.042, 'gf', 0.19],      // the windscreen's top
          [0.36, 0.82, 0.16, 0.72, 0.64, 0.835, 0.04, 'b', 0.19],        // its base (the cowl; the doors' front edge)
          [0.95, 0.815, 0.17, 0.72, 0.635, 0.805, 0.04, 'b', 0.16],      // the long bonnet over the front wheel
          [1.00091, 0.815, 0.17, 0.72, 0.635, 0.803, 0.04, 'b', 0.16],
          [1.14, 0.81, 0.17, 0.72, 0.63, 0.798, 0.04, 'b', 0.16],
          [1.33, 0.805, 0.17, 0.72, 0.62, 0.79, 0.04, 'b', 0.16],
          [1.52, 0.795, 0.17, 0.71, 0.605, 0.78, 0.04, 'b', 0.16],
          [1.65909, 0.78, 0.17, 0.7, 0.59, 0.768, 0.04, 'b', 0.16],
          [1.71, 0.772, 0.19, 0.69, 0.582, 0.762, 0.04, 'b', 0.14],
          [1.88, 0.72, 0.22, 0.64, 0.54, 0.72, 0.035, 'b', 0.13],         // the wing tips (the lamps under their covers)
          [2.03, 0.62, 0.25, 0.58, 0.47, 0.66, 0.03, 'b', 0.11],
          [2.13, 0.5, 0.28, 0.51, 0.385, 0.6, 0.02, 'b', 0.09],
          [2.23, 0.35, 0.31, 0.45, 0.29, 0.535, 0.012, 'b', 0.06]],       // the oval mouth's lip
        eye: { x: -0.52, y: 1.06, near: 0.2, tilt: 0.06, style: 'closed' },   // (low in the cabin, the long bonnet ahead)
        door: [0.36, -0.62], bumpF: 0.1, bumpR: 0.04,
        crush: { x0: -1.25, x1: 0.05, z: 0.6 },
      },
      hi: true,   // (Nastavitve · Detajli avtov: Visoki: the small details and the driver at the end of build, the tyres in 64)
      budget: { inner: 1400 }, budgetHi: { inner: 1750 },   // (its cabin, K.cab's pieces: the inner block over a car's 800 / 1200; drawn only once a door opens, a pane breaks or a part is off)
      wheels: { style: 'wire', w: 0.18, rimK: 0.62, gap: 0.05, seg: 32, segHi: 64 },
      // the regions: the standard ones, the wings to the nose and to the tail (the lamps go with them), the tailgate (trunk) its glass alone
      regions: (std) => std.map(r => /^fender/.test(r.part) ? Object.assign({}, r, { x: [r.x[0], 2.6] }) : /^quarter/.test(r.part) ? Object.assign({}, r, { x: [-2.6, r.x[1]] })
        : r.part === 'trunk' ? Object.assign({}, r, { x: [-1.49, -0.73], bands: ['edge', 'crown'] }) : r),
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, CH = K.chrome, G = K.GLASS, D = [0.07, 0.07, 0.075], W = [0.95, 0.95, 0.93], SH = K.shade(P, 0.62), COV = [0.2, 0.23, 0.28];
        // ---- the shell: the paint; the windscreen and the tailgate's glass; the sills a darker shade, black over the arches ----
        const L = K.loft(K.secs(K.body.secs), (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch ? B : SH;
          if ((kind === 'gf' || kind === 'gr') && e >= 3 && e <= 5) return G;
          return P;
        }, { caps: { front: { col: P, low: 'bumperF', high: 'bumperF' }, rear: { col: P, cut: 0.47, low: 'bumperR', high: 'body' } } });
        const DC = L.decal, yb = (x) => L.prop(x, 'ybelt'), yt = (x) => L.prop(x, 'yt'), u = (x, y) => (y - yb(x)) / (yt(x) - yb(x));
        // ---- the side windows (GLASS on the window band, in strips cut at the loft's sections: each piece a convex quad that follows the
        //      heights): the door's glass under the raked A-pillar, the quarter light's top falling with the fastback to its point over the rear
        //      wheel; their chrome frames: the A-pillar and the roof's edge, round the quarter light, the pillar between them, the waist ----
        const XS = L.secs.map(q => q.x), run = (xa, xb) => [xa].concat(XS.filter(x => x > xa + 1e-4 && x < xb - 1e-4), [xb]);
        const strip = (xa, xb, lo, hi, col, lift) => { const X = run(xa, xb); for (let i = 0; i + 1 < X.length; i++) { const p = X[i] + 1e-4, r = X[i + 1] - 1e-4;   // (a hair inside its segment: no empty piece in the next one)
          DC.band([[p, u(p, lo(p))], [r, u(r, lo(r))], [r, u(r, Math.max(lo(r), hi(r)))], [p, u(p, Math.max(lo(p), hi(p)))]], col, null, lift); } };
        const SILL = 0.865, top = (x) => yt(x) - 0.03, QT = -1.15, q = (x) => x > -0.73 ? top(x) : top(x) - 0.76 * (x + 0.73) * (x + 0.73);   // (the quarter light's top)
        let xf = 0.36; for (let i = 0; i < 40; i++) { const m = xf - 0.003; if (top(m) > SILL) break; xf = m; }   // (the door glass's front tip: where the A-pillar meets the waist)
        const sill = () => SILL;
        strip(-0.6, xf, sill, top, G, 0.01);                                           // the door's glass
        strip(QT, -0.66, sill, q, G, 0.01);                                             // the quarter light
        strip(-0.73, 0.36, top, yt, CH, 0.012);                                          // the A-pillar, the roof's edge
        strip(QT, -0.73, q, (x) => Math.min(yt(x), q(x) + 0.025), CH, 0.012);            // over the quarter light
        strip(-0.66, -0.6, () => SILL - 0.012, top, CH, 0.012);                         // the pillar between them
        strip(QT, xf, () => SILL - 0.012, sill, CH, 0.011);                              // the waist
        // ---- the doors' shut lines, handles, start numbers in white roundels; the round chrome mirrors on the doors ----
        for (const sd of [-1, 1]) {
          const s = sd < 0 ? 'L' : 'R', f = sd < 0 ? '-z' : 'z';
          for (const x of [0.36, -0.62]) { DC.side([[x - 0.006, 0.34], [x + 0.006, 0.34], [x + 0.006, 0.725], [x - 0.006, 0.725]], D, [sd], 0.004); DC.band([[x - 0.006, 0], [x + 0.006, 0], [x + 0.006, u(x, SILL)], [x - 0.006, u(x, SILL)]], D, [sd], 0.004); }
          K.hinge('door' + s, [0.34, 0.3, sd * 0.82], [0.34, 0.8, sd * 0.8]);
        }
        // (the handles, the roundels with their numbers and the mirrors the garage's in their place: K.deli, mounts.vrata, nalepke, ogledala)
        K.deli('vrata', () => { for (const sd of [-1, 1]) K.rect(-0.42, 0.68, sd * 0.833, 0.11, 0.022, CH, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' }); });
        K.deli('nalepke', () => { for (const sd of [-1, 1]) { const s = sd < 0 ? 'L' : 'R', f = sd < 0 ? '-z' : 'z';
          K.face([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => { const a = sd * i * Math.PI / 5; return [-0.13 + Math.cos(a) * 0.19, 0.53 + Math.sin(a) * 0.19, sd * 0.834]; }), W, { host: 'door' + s });
          K.number(-0.13, 0.53, sd * 0.836, 0.2, { dir: f, host: 'door' + s }); } });
        K.deli('ogledala', () => { for (const sd of [-1, 1]) K.part(sd < 0 ? 'mirrorL' : 'mirrorR', () => {
          K.bar([0.2, 0.86, sd * 0.69], [0.19, 0.93, sd * 0.73], 0.012, CH, { n: 4 });
          K.cyl([0.24, 0.95, sd * 0.745], [0.17, 0.95, sd * 0.745], 0.04, CH, { n: 6, r2: 0.045, capA: CH, capB: null });
          K.discX(0.168, 0.95, sd * 0.745, 0.042, 6, [0.42, 0.47, 0.54], -1, { sub: 'mglass' + (sd < 0 ? 'L' : 'R') });   // (its glass a fan of six, a sub-range of its own: it cracks, xtMirGlass)
        }); });
        // ---- the long bonnet: the power bulge down its middle, the louvres either side of it ----
        K.part('hood', () => K.deli('hauba', () => {   // (the garage's bonnet top in place of the bulge and the louvres: mounts.hauba)
          const R = [[0.38, 0.2, 0.12, 0.02], [0.95, 0.21, 0.12, 0.027], [1.6, 0.2, 0.11, 0.025], [1.95, 0.15, 0.075, 0.015], [2.12, 0.085, 0.035, 0.003]].map(([x, hb, ht, h]) => {
            const y0 = L.topY(x, 0); return [[x, y0 - 0.01, -hb], [x, y0 + h, -ht], [x, y0 + h, ht], [x, y0 - 0.01, hb]]; });
          K.skin(R, (k, e) => e === 1 ? S : P, P, P);   // (its top in the stripe colour: the centre stripe starts on it)
          for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) { const x = 0.5 + i * 0.065; DC.top([[x, sd * 0.27], [x + 0.03, sd * 0.27], [x + 0.03, sd * 0.42], [x, sd * 0.42]], D, 0.006); }
        }), { hinge: [[2.1, 0.5, -0.5], [2.1, 0.5, 0.5]] });
        // ---- the nose: the oval mouth with its bar, the covered lamps in the wing tips, the chrome blades either side of the mouth ----
        K.part('bumperF', () => {
          K.face([...Array(12).keys()].map(i => { const a = -i * Math.PI / 6; return [2.233, 0.43 + Math.sin(a) * 0.092, Math.cos(a) * 0.265]; }), D);
          K.deli('maska', () => K.box(2.236, 0.418, 0, 0.02, 0.022, 0.53, 0, CH));   // (the garage's grille in the mouth in its place: mounts.maska)
          for (const sd of [-1, 1]) K.sweep([[0, -0.022], [0.012, 0], [0, 0.022], [-0.012, 0]], [[2.238, 0.36, sd * 0.25], [2.2, 0.36, sd * 0.42], [2.12, 0.365, sd * 0.55], [2.0, 0.37, sd * 0.655]], CH, { capA: CH, capB: CH });
        }, { hinge: [[2.2, 0.3, -0.4], [2.2, 0.3, 0.4]] });
        // the head lamps, one piece each (2 + 4, the user's choice 29. 10. 2026): a dark glass dome along the wing's tip (a teardrop on the
        // band between the belt and the wing's top), a chrome rim along its foot and a chrome ring round its front, the lamp its nose; all of
        // it in the lens' sub-range (smashed, it all goes dark). A garage lamp is the nose (K.deli, mounts.zarometi: LAMP, the dome's front
        // section, its lens bulging as the nose), the dome then in its lens' colour (as glass), the rim and the ring in its ring's
        // (DELI.lampLook). Within the body's 1400 triangles: four steps round the dome, smooth-shaded, its foot's strips the rim, its last
        // band the ring; the glow from look.body.lamps (no K.headLamp in the stock lamp)
        const BP = (x, lift) => { const y0 = yb(x), y1 = yt(x), z0 = L.prop(x, 'w'), z1 = L.prop(x, 'wt'), l = Math.hypot(z0 - z1, y1 - y0) || 1;   // (the band's middle at x, lifted off it; along it up, out of it)
          return { p: [y0 + (y1 - y0) * 0.5 + (z0 - z1) / l * lift, z0 + (z1 - z0) * 0.5 + (y1 - y0) / l * lift], t: [(y1 - y0) / l, (z1 - z0) / l], n: [(z0 - z1) / l, (y1 - y0) / l], len: l }; };
        const HW = (x) => { const w = 0.4 * BP(x, 0).len; return x <= 1.84 ? 0 : x <= 2.06 ? w * Math.sqrt((x - 1.84) / 0.22) : w * Math.sqrt(Math.max(0, 1 - ((x - 2.06) / 0.052) ** 2)); };   // (the teardrop's half width)
        const LX = [1.84, 1.93, 2.01, 2.07, 2.085], NX = [2.085, 2.1, 2.112], NA = 4;   // (the dome's sections to the lamp, LAMP the last one's; the nose's, the stock lamp; NA steps over it)
        const ring = (x, sd, foot) => { const hw = Math.max(0.003, HW(x)), B = BP(x, hw * 0.12), h = hw * 0.72, R = [];   // (a half ellipse over the band, its foot just under it)
          for (let i = 0; i <= NA; i++) { const c = Math.cos(Math.PI * i / NA), q = Math.sin(Math.PI * i / NA); R.push([x, B.p[0] + B.t[0] * hw * c + B.n[0] * h * q, sd * (B.p[1] + B.t[1] * hw * c + B.n[1] * h * q)]); }
          if (foot) R.push([x, B.p[0] - B.n[0] * 0.015, sd * (B.p[1] - B.n[1] * 0.015)]);
          return R; };
        K.deli('zarometi', () => { for (const sd of [-1, 1]) { const s = sd < 0 ? 'L' : 'R'; K.skin(NX.map(x => ring(x, sd, false)), K.lampHead, null, null, { host: 'head' + s, sub: 'lampF' + s, smooth: true }); } }, (zn) => {   // the stock lamp: the dome's nose
          const LK = zn && typeof DELI !== 'undefined' ? DELI.lampLook(zn) : null, GL = LK ? K.mix(COV, LK.col, 0.6) : COV, RG = LK ? LK.ring : CH;
          for (const sd of [-1, 1]) { const s = sd < 0 ? 'L' : 'R';   // the dome: its foot's strips the rim, its last band the ring
            K.skin(LX.map(x => ring(x, sd, true)), (k, e) => e >= NA || k === LX.length - 2 ? RG : GL, null, null, { host: 'head' + s, sub: 'lampF' + s, smooth: true }); } });
        K.deli('zmigavci', () => { for (const sd of [-1, 1]) K.discX(2.138, 0.455, sd * 0.51, 0.026, 6, K.rgb(0xff9a1e), 1, { host: sd < 0 ? 'fenderL' : 'fenderR' }); });   // the indicators under the lamps (the garage's: mounts.zmigavci)
        // (the garage's wing, deck lid, aerials, sunroof and roof scoop on the body: mounts.krilo, prtljaznik, antena, streha, stresna_zajemalka; none stock)
        K.part('body', () => { for (const id of ['krilo', 'prtljaznik', 'antena', 'streha', 'stresna_zajemalka']) K.deli(id, () => {}); });
        // ---- the centre stripe (the stripe colour; the paint when the car has none) along the roof and the tail's deck ----
        K.deli('crte', () => { for (const [x0, x1] of [[-0.72, -0.17], [-2.2, -1.5]]) DC.top([[x0, -0.11], [x1, -0.11], [x1, 0.11], [x0, 0.11]], S, 0.007); });   // (the garage's: mounts.crte)
        // ---- the tail: the lamps over the blades (chrome bezels), the blades round the corners, the plate between them, the twin pipes ----
        K.deli('zadnje_luci', () => { for (const sd of [-1, 1]) { const tp = sd < 0 ? 'tailL' : 'tailR'; K.tailLamp(-2.226, 0.545, sd * 0.37, 0.1, 0.1, { round: true, host: tp }); K.discX(-2.224, 0.545, sd * 0.37, 0.062, 8, CH, -1, { host: tp }); } });   // (the garage's: mounts.zadnje_luci)
        K.part('bumperR', () => {
          for (const sd of [-1, 1]) K.sweep([[0, -0.022], [0.012, 0], [0, 0.022], [-0.012, 0]], [[-1.99, 0.44, sd * 0.81], [-2.17, 0.44, sd * 0.67], [-2.24, 0.44, sd * 0.42], [-2.245, 0.44, sd * 0.18]], CH, { capA: CH, capB: CH });
          K.rect(-2.228, 0.465, 0, 0.28, 0.1, [0.93, 0.93, 0.9], { dir: '-x', part: 'plate' });
          K.rect(-2.224, 0.515, 0, 0.008, 0.28, [0.93, 0.93, 0.9], { dir: 'y', part: 'plate' });   // (its top edge, 8 mm deep: the plate a piece with a volume on the road; two faces, the shell is at its triangle budget)
        });
        K.deli('auspuh', () => { for (const sd of [-1, 1]) K.exhaust(-2.25, 0.25, sd * 0.07, 0.028, 0.3, { part: 'body' }); });   // (the garage's: mounts.auspuh)
        // ---- the windscreen's chrome frame (its top and its base, on the glass), the cowl's three wipers ----
        for (const [x0, x1] of [[-0.158, -0.118], [0.318, 0.358]]) { const w = (x) => L.prop(x, 'wt') - 0.012, c = (x) => 0.38 * L.prop(x, 'wt');
          for (const [f0, f1] of [[(x) => -w(x), (x) => -c(x)], [(x) => -c(x), c], [c, w]]) DC.top([[x0, f0(x0)], [x1, f0(x1)], [x1, f1(x1)], [x0, f1(x0)]], CH, 0.006); }   // (three flat pieces: the top's two edges and its crown)
        for (const z of [-0.42, -0.08, 0.26]) K.bar([0.4, 0.86, z - 0.13], [0.37, 0.87, z + 0.13], 0.008, B, { n: 4, part: 'wiperFront' });
        // ---- the tailgate: its glass in a chrome frame (on the glass's edges and foot, with it) ----
        for (const sd of [-1, 1]) { const X = run(-1.49, -0.73); for (let i = 0; i + 1 < X.length; i++) { const p = X[i] + 1e-4, r = X[i + 1] - 1e-4, wt = (x) => L.prop(x, 'wt');
          DC.top([[p, sd * (wt(p) - 0.035)], [r, sd * (wt(r) - 0.035)], [r, sd * (wt(r) - 0.008)], [p, sd * (wt(p) - 0.008)]], CH, 0.006); } }
        { const x0 = -1.488, x1 = -1.455, w = (x) => L.prop(x, 'wt') - 0.01, c = (x) => 0.38 * L.prop(x, 'wt');
          for (const [f0, f1] of [[(x) => -w(x), (x) => -c(x)], [(x) => -c(x), c], [c, w]]) DC.top([[x0, f0(x0)], [x1, f0(x1)], [x1, f1(x1)], [x0, f1(x0)]], CH, 0.006); }
        K.hinge('trunk', [-1.49, 0.895, 0.42], [-0.73, 1.168, 0.52]);
        K.part('trunk', () => K.deli('zaluzije', () => {}));   // (the garage's louvres over the glass: mounts.zaluzije; none stock)
        // (none stock: the garage's aero kit, rally lamps, tow points, mud flaps, sun strip, fuel cap, calipers: mounts)
        for (const id of ['aero', 'relijske_luci', 'vlecne_kljuke', 'lovilci_blata', 'soncni_pas', 'zamasek', 'celjusti']) K.deli(id, () => {});
        K.rect(0.3, 0.835, 0, 1.2, 0.09, D, { dir: '-x', part: 'body' });   // (the scuttle's inside under the windscreen, facing the driver: from the seat no looking into the bonnet past the dashboard)
        // ---- Visoki (Nastavitve · Detajli avtov: Visoki; the player's and the showroom's car): the head lamps' bulbs under their covers, the
        //      tail lamps' chrome centres; the driver at the wheel (right-hand drive) in a cap of a helmet ----
        if (K.hi) {
          const F = K.fitted, LR = (n, sd) => n + (sd < 0 ? 'L' : 'R');   // (F: a garage part in a detail's place: none of it there)
          for (const sd of [-1, 1]) {
            if (!F.zarometi) K.discX(2.062, 0.59, sd * 0.4922, 0.022, 6, [1, 0.99, 0.94], 1, { host: LR('head', sd) });
            if (!F.zadnje_luci) K.discX(-2.2265, 0.545, sd * 0.37, 0.016, 6, CH, -1, { host: LR('tail', sd) }); }
          K.driver(-0.5, 1.0, 0.33, { inner: true, r: 0.11, lean: 0.3, hands: [-0.06, 0.74, 0.15], knee: [0.18, 0.56, 0.16], feet: [0.56, 0.24, 0.11], suit: [0.5, 0.42, 0.3], helmet: [0.9, 0.9, 0.86] });
        }
        // ---- inside (seen once a part is off): the carpet, the bulkhead, the low bucket seats in leather, the wood-faced dashboard and its
        //      wood-rimmed wheel (right-hand drive), the tunnel and its lever, the pedals, the door cards, the luggage deck behind; the
        //      long six under the bonnet ----
        { const C = K.cab, IN = C.IN, SZ = 0.33, CARP = [0.12, 0.1, 0.09], LE = [0.42, 0.24, 0.14], LE2 = [0.26, 0.15, 0.09], WD = [0.42, 0.26, 0.13];
          C.face([[-1.2, 0.17, -0.7], [0.36, 0.17, -0.7], [0.36, 0.17, 0.7], [-1.2, 0.17, 0.7]], CARP, [0, 1, 0]);
          C.face([[0.36, 0.17, -0.7], [0.36, 0.17, 0.7], [0.36, 0.66, 0.7], [0.36, 0.66, -0.7]], CARP, [-1, 0, 0]);
          K.box(-0.25, 0.17, 0, 1.1, 0.2, 0.24, 0, C.PL2, C.PL, true, IN);   // (the gearbox's tunnel)
          C.dash({ x: 0.14, y: 0.74, d: 0.22, w: 0.68, dz: SZ, col: WD, col2: [0.1, 0.09, 0.08] });
          K.inner(() => K.part('body', () => {                                                                           // the wood-rimmed wheel
            const c = [-0.08, 0.76, 0.33], r = 0.19, a = 0.42, pt = (t) => [c[0] - Math.sin(a) * Math.sin(t) * r, c[1] + Math.cos(a) * Math.sin(t) * r, c[2] + Math.cos(t) * r];
            for (let i = 0; i < 6; i++) K.bar(pt(i * Math.PI / 3), pt((i + 1) * Math.PI / 3), 0.014, WD, { n: 3 });
            for (const t of [0, 2 * Math.PI / 3, -2 * Math.PI / 3]) K.bar(c, pt(t), 0.006, [0.62, 0.63, 0.65], { n: 3 });   // (three thin chrome spokes)
            K.bar([c[0] + 0.32, c[1] - 0.14, c[2]], c, 0.018, [0.55, 0.56, 0.58], { n: 4 });
          }));
          for (const sd of [-1, 1]) C.seat(-0.6, 0.29, sd * 0.33, { w: 0.46, top: 0.575, lean: 0.3, col: LE, col2: LE2 });
          C.console(-0.1, 0.37, { l: 0.3 });
          C.pedals(0.32, 0.2, SZ, 3);
          for (const sd of [-1, 1]) C.door(sd, { x: [-0.6, 0.34], y: [0.3, 0.7], z: 0.76, insert: LE, crank: true, speaker: false });
          C.face([[-1.45, 0.42, -0.62], [-1.0, 0.42, -0.62], [-1.0, 0.42, 0.62], [-1.45, 0.42, 0.62]], CARP, [0, 1, 0]);   // (the luggage deck)
          C.tail({ x: -2.1, w: 0.55, y: [0.3, 0.52], bar: -2.16, barY: 0.32, barW: 1.0 }); }
        K.engine(0.85, 0.28, 0, { l: 0.85, w: 0.46, h: 0.44, cover: [0.72, 0.73, 0.76] });                               // (its polished cam covers)
        K.box(1.96, 0.3, 0, 0.06, 0.28, 0.62, 0, [0.12, 0.12, 0.13], null, false, { inner: true, part: 'body' });       // the radiator behind the mouth
        for (const sd of [-1, 1]) K.box(1.33, 0.2, sd * 0.54, 0.74, 0.5, 0.04, 0, D, null, true, { inner: true, part: 'body' });   // the inner wings (no tyre in the bay)
        for (const id of ['akumulator', 'filter_zraka', 'turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum']) K.deli(id, () => {});   // (the garage's hidden parts: mounts)
      },
    },
  });
})();
