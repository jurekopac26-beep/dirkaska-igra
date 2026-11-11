/* Vehicle 'orel' — OREL GT3: a mid-engined GT3 racer (invented; no real model). Signature features: 1) the cab-forward canopy, a black
   duct on its spine from the roof's middle down onto the engine cover (the V10's air), the start number on the roof ahead of it, 2) the
   long engine cover with two rows of louvres either side of the duct, the haunches over the rear wheels, 3) the big wing with tall
   endplates on swan necks (black carbon), 4) the slanting talon tail lamps at the corners of a black mesh tail, two exhausts high in
   its middle, the big diffuser under it, 5) the slim slanting head lamps over the wide brake ducts, the bonnet's vent with the stripe
   ahead of it to the nose, the splitter and the dive planes. L 4.62 W 2.04 H 1.20, wheelbase 2.68, overhangs F 0.99 R 0.95 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  // the garage's head lamp in the place of the slim slanting stock lamp in the nose (u out from the car's middle, v up; metres round z
  // 0.6, y 0.4): every option takes this outline, in the stock lamp's black frame
  const SLANT = [[-0.15, -0.035], [0.15, -0.005], [0.15, 0.035], [-0.15, 0.005]];
  VEHICLE_DEFS.push({
    id: 'orel', name: 'OREL GT3', cat: 'dirkalni', ord: 7, drive: 'MR',
    desc: 'Dirkalnik GT3 z motorjem v sredini, zračnikom na strehi in velikim krilom s stranicama.',
    // the MR layer on a GT3 car (a quicker turn-in than the TIGER GT's, more lift rotation, a lighter tail to swing: kI), balanced against
    // the TIGER GT for the mixed GT3 field (tests/fleet.test.js: their autopilot laps within 1 % at Bathurst and Spa; measured -0.04 % and
    // -0.03 %, the other real circuits within 0.5 %): less drag (265 km/h against its 256), better brakes (100-0 in 20.0 m against 21.1),
    // less grip in a steady corner (amax 1.8 against 1.9: the balance of the class), the same traction off the line
    phys: { mass: 1280, a: 1.5, b: 1.18, kI: 1.14, kw: 410, redline: 8600, idle: 1100, gears: [3.1, 2.15, 1.62, 1.3, 1.08, 0.92], final: 4.25, rw: 0.345, cDrag: 0.39, len: 4.62, wid: 2.04, steerMax: 0.58,
      tracK: 1.2, brakeK: 1.22, spinK: 0.22, aero: 0.00007, loose: 0.72 },
    arc: { amax: 1.8, kv: 2.6, rmin: 4.8 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.16, pwr: 0.07, out: 1.1, turn: 1.2, w: 0.98, tv: 0.74 },   // (the MR layer: quick turn-in, lift rotation; its own liftP, pwr, out, turn, w, tv)
    stats: { power: 10, grip: 10, weight: 7, drift: 6 },
    price: 550000, pk: 'ppo', field: ['orel', 'tiger'],
    snd: { kind: 'v10', hz: 1.2, loud: 1.3 },
    expect: { t100: [2.7, 3.12], vmax: [258, 272], latG: [2.42, 2.53], d100: [19, 21.1] },   // (measured 2.91 / 265 / 2.47 / 20.0; the TIGER GT 2.92 / 256 / 2.61 / 21.1)
    partNames: { trunk: 'engine cover', splitter: 'front splitter', diffuser: 'diffuser', headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamp', tailR: 'right tail lamp',
      wiperFront: 'windscreen wiper' },
    // the race set's parts and its own: the splitter and the diffuser with their shares of the downforce; the slim head lamps parts of their
    // own on the front bumper (they go with it), each talon tail lamp with its corner of the tail; the wiper
    parts: { set: 'race', ht: 1.2, y0: 0.1,
      over: {
        bumperF: { df: 0, y: 0.3 },
        trunk: { lx: -0.62, y: 0.98 }, hood: { lx: 0.72, y: 0.8 },   // (the engine cover from the rear window's foot to the deck's lip; the bonnet from the cowl to the nose)
        doorL: { lx: 0.14, y: 0.62, h: 0.12 }, doorR: { lx: 0.14, y: 0.62, h: 0.12 }, quarterL: { h: 0.15 }, quarterR: { h: 0.15 }, mirrorL: { lx: 0.32, lz: -1.0, y: 0.98 }, mirrorR: { lx: 0.32, lz: 1.0, y: 0.98 },
        wing: { lx: -0.86, y: 1.2, h: 0.14 },
      },
      extra: {
        splitter: { z: 0, th: 0.45, m: 3, rW: 0.42, h: 0.04, lx: 0.98, lz: 0, f: 0, df: 0.3 },
        diffuser: { z: 1, th: 0.55, m: 4, rW: 0.42, h: 0.05, lx: -0.85, lz: 0, f: 0.1, df: 0.15 },
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.18, h: 0.06, lx: 1.07, lz: -0.59, y: 0.4, on: 'bumperF' },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.18, h: 0.06, lx: 1.07, lz: 0.59, y: 0.4, on: 'bumperF' },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.25, h: 0.05, lx: -0.92, lz: -0.74, y: 0.76 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.25, h: 0.05, lx: -0.92, lz: 0.74, y: 0.76 },
        wiperFront: { z: 0, th: 0.65, m: 0.5, r: 0.45, h: 0.03, lx: 0.4, lz: -0.05, y: 0.87 },
      },
    },
    // where the garage's parts go (js/deli.js, look units): the wing on the engine cover's lip, in the wing's part (in place of the wing on
    // its swan necks); the head lamps in the place of the slim slanting lamps (every option in their outline, SLANT, in their black frame),
    // in the lamps' parts; the rims
    mounts: {
      krilo: { x: -2.06, w: 0.86, part: 'wing' },
      zarometi: { x: 2.492, y0: 0.4, lean: 0, zc: 0.6, yc: 0.4, s: 0.33, hosts: ['headL', 'headR'], shape: SLANT, bulge: 0, ringW: 0.008 },
      platisca: {},
      // (sklop 2 · spredaj, js/deli/spredaj.js) the kit round the nose and the tail (in place of the splitter, in its part: the options
      // without a front piece keep it as a blade, lipF; the stock diffuser gives way to the kit's rear pieces, in its part); the bonnet's
      // top from the cowl to the nose (in place of its vent, the slats and the stripe); the grille in the radiator's mouth; the indicators
      // under the head lamps over the brake ducts, on the front wings ahead of the front wheels, on the tail's face outboard of the
      // diffuser, on the mirrors; the rally lamps in front of the grille, on a bar before the bonnet's edge (its feet on the nose's face
      // beside the grille), in the grille, at the roof's front edge (the sunroofs behind its feet), a pod on the nose's upright face
      aero: { xf: 2.49, xr: -2.13, w: 0.782, yf: 0.12, yr: 0.24, sill: [-0.71, 1.03], ws: 0.907, ys: 0.12, lipF: [2.28, 0.1, 0.56, 0.02, 1.9], partF: 'splitter', partR: 'diffuser' },
      hauba: { x0: 1.05, x1: 2.42, w: 0.5, rel: true, cells: 3 },
      maska: { x: 2.494, y0: 0.27, lean: 0, yc: 0.27, w: 0.64, h: 0.2, part: 'bumperF' },
      zmigavci: { front: { x: 2.494, y: 0.34, z: 0.6, w: 0.1, h: 0.025, part: 'bumperF' }, side: { x: 2.05, y: 0.5, z: 0.985, hosts: ['fenderL', 'fenderR'] },
        rear: { x: -2.134, y: 0.43, z: 0.75, part: 'bumperR' }, mirror: { x: 0.8205, y: 0.99, z: 1.04, w: 0.12, parts: ['mirrorL', 'mirrorR'] } },
      relijske_luci: { bumper: [2.494, 0.27, 0.22], nose: [2.475, 0.5], foot: 0.3, feet: 0.36, intake: [2.494, 0.27, 0.64, 0.2], roof: [0.19, 0.431], pod: [2.475, 0.36, 0.62, 0.42], part: 'bumperF' },
      // (sklop 2 · zadaj, js/deli/zadaj.js) the tail lamps in the talons' black faces (every option in their slanting outline), a band
      // across the tail between them over the mesh; the exhausts high in the mesh (short tips: the silencer across just inside the tail
      // behind them, at their height, the pipes into it); the engine cover's top behind the duct to the deck's lip; the tow points (in front
      // where the red strap is, beside the grille; behind on the tail's face beside the rain light); the flaps behind the wheels in the
      // wings' and the quarters' parts (up into the arches), the sills' guards
      zadnje_luci: { x: -2.114, zc: 0.745, yc: 0.78, w: 0.14, h: 0.3, s: 0.7, shape: [[-0.185, -0.08], [0.185, -0.08], [0.185, 0.08], [-0.185, 0.06]], hosts: ['tailL', 'tailR'],
        bar: { x: -2.133, y: 0.785, w: 0.53, h: 0.03, part: 'body' } },
      auspuh: { x: -2.16, y: 0.6, z: 0.15, r: 0.055, len: 0.1, part: 'body', drum: 0.6, drumX: -2.03, pipe: 0.6, pipeX: -1.95 },
      prtljaznik: { x: [-2.06, -1.15], w: 0.6, part: 'trunk' },
      vlecne_kljuke: { f: [2.494, 0.3, -0.4], r: [-2.13, 0.44, 0.3] },
      lovilci_blata: { x: [1.05, -1.63], z: [0.6, 0.72], y: [0.25, 0.09], sill: [-0.58, 0.9, 0.15, 0.844], part: 'body', parts: ['fenderL', 'fenderR', 'quarterL', 'quarterR'] },
      // (sklop 2 · streha, js/deli/streha.js) the sunroofs between the windscreen's top and the duct's mouth; the scoop at the roof's
      // front in place of the duct; the aerials beside the duct (the rod on the left, the fins and the pucks on the right at the roof's
      // rear, the stub and the whip at its front right corner, clear of the twin scoops and the light bar); the louvres on the small rear
      // window's middle in place of the duct over it (the raked rods and whips beside their blade)
      streha: { x0: -0.72, x1: 0.2, xf: 0.085, xr: -0.4, back: -0.27, part: 'body' },
      stresna_zajemalka: { x: 0.15, z: 0, back: -0.7, part: 'body' },
      antena: { x: -0.55, z: -0.3, fin: [-0.68, 0.25], front: [0, 0.47], whip: 0, part: 'body' },
      zaluzije: { x0: -0.91, y0: 1.069, x1: -0.72, y1: 1.16, w: 0.26, part: 'body' },
      // (sklop 2 · bok, js/deli/bok.js) the mirrors (in place of the stock ones on their stalks), the doors (inside their shut lines, the
      // sill to the belt; the handle; the glass between the pillars, the net clear of its bulge), the brakes, the nuts (a centre lock)
      ogledala: { x: 0.74, y: 0.99, z: 1.04, w: 0.16, h: 0.07, d: 0.12, z0: 0.95, fwd: 0.04, up: 0.01 },
      vrata: { x: [-0.3, 0.95], y: [0.34, 0.86], handle: [-0.18, 0.8, 0.958, 0.13, 0.025], win: [[-0.24, 0.06], [0.2, 0.06], [0.2, 0.9], [-0.24, 0.9]],
        frame: [-0.3, -0.24, 0.9, 0.96] },
      zavore: { s: 1 }, matice: { k: 5, r: 0.2, lock: true },
      // (sklop 3 · barve, js/deli/barve.js) the stripes beside the duct over the engine cover, the roof and the bonnet (not over the glass);
      // the decals on the doors either side of the number and on the front wings, on the bonnet behind its vent, on the roof; the sun
      // strip across the windscreen's top; the calipers; the fuel cap on the left haunch behind the side intake, over the fuel cell
      barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {},
      crte: { z: [0.24, 0.38], x: [[-2.06, -0.97], [-0.7, 0.18], [1.0, 2.45]], fit: true },
      nalepke: { side: [[0.5, 0.9], [-0.27, 0.14], [1.95, 2.2]], y: [0.36, 0.6], hood: { x: [1.08, 1.58], z: [0.2, 0.5] }, roof: { x: [-0.27, 0.17] } },
      soncni_pas: { x: [0.2, 0.34] }, zamasek: { x: -0.88, y: 0.8, z: -0.991, r: 0.045 },
      celjusti: { r: [0.085, 0.16], a: [70, 125] },
      // (sklop 3 · skriti deli, js/deli/skriti.js) round the V10 behind the seat: the filter on its left bank's edge, the turbo at its
      // rear (the twins against both banks, the intercooler on the block behind the cover), the control box on its top; the battery on
      // the fuel cell behind the seat (no floor under the cabin and the bay); the springs against the arches' inner walls, up into their
      // tops, the struts and the bars at the wheels
      filter_zraka: { x: -1.3, y: 0.53, z: -0.31 }, akumulator: { x: -0.82, y: 0.543, z: 0.25 }, turbo: { x: -1.6, y: 0.5, z: 0.36, twin: [-0.71, -0.01], ic: [-1.63, 0.551, 0] }, cip: { x: -1.1, y: 0.682, z: 0.15 },
      vzmeti: { in: 0.157, top: 0.79 }, amortizerji: { in: 0.13, top: 0.74 }, stabilizatorji: { in: 0.13, floor: 0.18 }, dim_gum: {},
    },
    // the look (KIT API v1, render.js; look units = metres: the centre of mass at x 0, the axles at 1.5 / -1.18): one loft, the standard
    // regions (the bonnet, the engine cover with the rear window, the fenders, the doors with their glass, the quarters with the haunches'
    // outer slopes, the bumpers) and the racing parts drawn on: the splitter, the dive planes, the diffuser, the wing on its swan necks.
    // Seen from the chase camera: the duct on the spine, the louvres, the number on the roof, the wing's endplates, the talon lamps
    look: {
      body: { len: 4.62, wid: 2.04, wz: 0.2,
        //       x      w     yb    ybelt  wt    yt     cr     kind  tuck
        secs: [[-2.13, 0.95, 0.24, 0.8, 0.88, 0.89, 0.005, 'b', 0.1],    // the tail panel (the cap): the talon lamps, the mesh, the exhausts
          [-2.07, 1.0, 0.2, 0.84, 0.92, 0.94, 0.01, 'b', 0.1],          // the deck's lip
          [-1.66, 1.02, 0.16, 0.86, 0.88, 0.94, -0.01, 'b', 0.1],       // behind the rear wheels: the haunches' crests, the deck between them
          [-1.18, 1.02, 0.15, 0.88, 0.82, 0.97, -0.02, 'b', 0.1],       // the rear axle: the haunches at their highest, the engine cover sunk between
          [-0.95, 1.0, 0.15, 0.88, 0.62, 1.04, 0.03, 'gr', 0.1],        // the rear window's foot (a small upright pane under the roof's edge)
          [-0.72, 0.97, 0.15, 0.88, 0.53, 1.15, 0.035, 'r', 0.1],       // the roof's rear edge
          [0.2, 0.95, 0.15, 0.87, 0.54, 1.17, 0.03, 'gf', 0.1],         // the windscreen's top (the canopy narrow over the wide body)
          [0.98, 0.99, 0.16, 0.79, 0.8, 0.85, 0.02, 'b', 0.1],          // the windscreen's base (the cowl: far forward, the cab forward)
          [1.5, 1.01, 0.16, 0.77, 0.86, 0.81, -0.03, 'b', 0.1],         // the front axle: the fenders' crests, the bonnet sunk between them
          [2.15, 0.98, 0.14, 0.62, 0.84, 0.66, -0.02, 'b', 0.09],
          [2.4, 0.92, 0.13, 0.5, 0.78, 0.53, -0.01, 'b', 0.08],
          [2.49, 0.85, 0.12, 0.44, 0.71, 0.47, 0, 'b', 0.07]],          // the nose (the cap: the lamps, the ducts, the grille)
        eye: { x: -0.32, y: 0.98, style: 'closed' },
        door: [0.95, -0.3], bumpF: 0.3, bumpR: 0.24, bumpY: [0.3, 0.46], cage: true,
        decalX: -0.02, decalY: 1.2, decalS: 0.5,                       // (the start number on the roof ahead of the duct)
        crush: { x0: -0.7, x1: 0.42, z: 0.55 } },                       // (the roof and the windscreen's top)
      hi: true,   // (Nastavitve · Detajli avtov: Visoki: the small details and the driver at the end of build, the tyres in 64)
      budget: { inner: 1400 }, budgetHi: { inner: 1750 },   // (its cabin, K.cab's pieces: the inner block over a car's 800 / 1200; drawn only once a door opens, a pane breaks or a part is off)
      wheels: { style: 'slick', w: 0.3, wR: 0.33, gap: 0.05, seg: 32, segHi: 64 },
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, D = K.dark, G = K.GLASS, RED = K.rgb(0xd0141a), MESH = [0.05, 0.05, 0.055];
        // ---- the shell: the paint, the glass (windscreen, side windows, the small rear window), the tuck all round black (the skirts) ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (e === 0 || e === 8) return B;
          if (kind === 'gf') return e >= 2 && e <= 6 ? G : P;
          if (kind === 'r') return e === 2 || e === 6 ? G : P;
          if (kind === 'gr') return e >= 3 && e <= 5 ? G : P;
          return P;
        }, { caps: { front: { col: P, colLow: B, cut: 0.2, high: 'bumperF' }, rear: { col: P, colLow: B } } });   // (the nose's black lip over the splitter, the tail's black foot)
        const D2 = L.decal, XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;
        // the skirts black from arch to arch, a line in the stripe colour over them
        D2.side([[XA + 0.04, 0.1], [XB - 0.04, 0.1], [XB - 0.04, 0.29], [XA + 0.04, 0.29]], B, null, 0.005);
        D2.side([[XA + 0.04, 0.3], [XB - 0.04, 0.3], [XB - 0.04, 0.33], [XA + 0.04, 0.33]], S, null, 0.005);
        // the greenhouse: the A-pillars and the B-pillar black (a canopy of glass and black over the paint)
        D2.band([[0.2, 0.0], [0.34, 0.0], [0.34, 1.0], [0.2, 1.0]], B, null, 0.006);
        D2.band([[-0.34, 0.0], [-0.24, 0.0], [-0.24, 1.0], [-0.34, 1.0]], B, null, 0.006);
        // the side intakes on the haunches ahead of the rear wheels (black, raked back), the vents behind the front wheels
        D2.side([[-0.42, 0.42], [-0.66, 0.42], [-0.78, 0.8], [-0.5, 0.8]], B, null, 0.006);
        D2.side([[0.98, 0.42], [1.08, 0.42], [1.02, 0.7], [0.94, 0.7]], B, null, 0.006);
        // the bonnet: its vent (black, with slats) and the stripe ahead of it down to the nose (the garage's bonnet top in their place:
        // mounts.hauba); the louvres on the fenders' crests
        K.part('hood', () => K.deli('hauba', () => {
          D2.top([[1.62, -0.36], [2.02, -0.3], [2.02, 0.3], [1.62, 0.36]], B, 0.012);
          for (let i = 0; i < 3; i++) { const x = 1.68 + i * 0.1; D2.top([[x, -0.32], [x + 0.035, -0.32], [x + 0.035, 0.32], [x, 0.32]], D, 0.016); }
          D2.top([[2.04, -0.13], [2.47, -0.1], [2.47, 0.1], [2.04, 0.13]], S, 0.01); }));
        for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const x = 1.22 + i * 0.09; D2.top([[x, s * 0.62], [x + 0.04, s * 0.62], [x + 0.04, s * 0.88], [x, s * 0.88]], B, 0.008); }
        // the engine cover: the stripe on the spine behind the duct, two rows of louvres either side of it (the garage's cover top in their
        // place: mounts.prtljaznik)
        K.part('trunk', () => K.deli('prtljaznik', () => {
          D2.top([[-2.06, -0.12], [-1.12, -0.12], [-1.12, 0.12], [-2.06, 0.12]], S, 0.008);
          for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const x = -1.32 - i * 0.085; D2.top([[x - 0.04, s * 0.2], [x, s * 0.2], [x, s * 0.56], [x - 0.04, s * 0.56]], B, 0.008); } }));
        // the start number on the doors
        for (const s of [-1, 1]) K.number(0.32, 0.56, s * 0.962, 0.3, { dir: s < 0 ? '-z' : 'z', host: s < 0 ? 'doorL' : 'doorR' });
        // ---- the duct on the spine: from the roof's middle back over the rear window onto the engine cover, its mouth facing forward (black
        //      carbon; the body's, whole: a crushed roof takes it down with it). The garage's on the roof: the sunroofs ahead of the duct, the
        //      aerials beside it, a scoop at the roof's front or the louvres on the rear window in its place (mounts.streha ... zaluzije) ----
        let roofScoop = 0, louvres = 0;
        K.part('body', () => { K.deli('streha', () => {}); roofScoop = K.deli('stresna_zajemalka', () => {}); K.deli('antena', () => {}); louvres = K.deli('zaluzije', () => {}); });
        if (!roofScoop && !louvres) K.part('body', () => {
          const R = (x, w, h) => { const y = K.topY(x, 0); return [[x, y - 0.03, -w], [x, y - 0.03, w], [x, y + h, w * 0.86], [x, y + h, -w * 0.86]]; };
          K.skin([R(-0.3, 0.15, 0.1), R(-0.55, 0.17, 0.11), R(-0.9, 0.17, 0.09), R(-1.12, 0.13, 0.02)], B, MESH, B);
        }, { noCrush: true, noDent: true });
        // ---- the nose: the slim slanting lamps (parts of their own on the bumper; the garage's in their place, in their frame), the wide
        //      brake ducts under them, the radiator's grille, the tow strap ----
        K.deli('zarometi', () => { for (const s of [-1, 1]) K.headLamp(2.492, 0.4, s * 0.6, 0.04, { pts: SLANT, d: 0.02, ring: B, ringW: 0.01, host: s < 0 ? 'headL' : 'headR' }); }, (zn) => {
          if (zn) for (const s of [-1, 1]) K.box(2.48, 0.355, s * 0.6, 0.02, 0.09, 0.33, 0, B, null, false, { host: s < 0 ? 'headL' : 'headR' }); });   // (the stock lamp's frame round the garage's)
        K.deli('maska', () => K.grille(2.494, 0.27, 0, 0.66, 0.2, { slats: 2, host: 'bumperF' }));   // (the garage's grille in its place: mounts.maska)
        for (const s of [-1, 1]) K.rect(2.494, 0.25, s * 0.6, 0.26, 0.13, B, { host: 'bumperF' });
        K.deli('vlecne_kljuke', () => K.rect(2.495, 0.17, -0.4, 0.05, 0.06, RED, { host: 'bumperF' }));   // (the tow strap; the garage's tow points in its place and behind: mounts.vlecne_kljuke)
        K.deli('zmigavci', () => {}); K.deli('relijske_luci', () => {});   // (stock: none; the garage's indicators and rally lamps: mounts.zmigavci, mounts.relijske_luci)
        // the dive planes on the bumper's corners (two a side, their trailing edges up: thin, a face over and one under)
        const fin = (pts, col, o) => { K.face(pts, col, o); K.face(pts.slice().reverse().map(p => [p[0], p[1] - 0.01, p[2]]), col, o); };
        K.part('bumperF', () => { for (const s of [-1, 1]) for (const [x0, y0, x1, y1] of [[2.46, 0.38, 2.28, 0.43], [2.48, 0.25, 2.3, 0.31]]) {
          const q = [[x0, y0, s * 0.86], [x1, y1, s * 0.93], [x1, y1, s * 1.0], [x0, y0, s * 0.97]]; fin(s < 0 ? q.slice().reverse() : q, B);
        } }, { hinge: [[2.24, 0.45, -0.8], [2.24, 0.45, 0.8]] });
        // the splitter under the nose (its top, its underside, its leading edge)
        // (the garage's kit in its place, in its part: K.deli, mounts.aero; its rear pieces in the diffuser's part, the stock diffuser giving way)
        let AE = 0; K.part('splitter', () => { AE = K.deli('aero', () => { const q = [[2.0, 0.1, -0.96], [2.0, 0.1, 0.96], [2.46, 0.1, 0.96], [2.56, 0.1, 0.8], [2.56, 0.1, -0.8], [2.46, 0.1, -0.96]];
          fin(q, B); K.rect(2.56, 0.095, 0, 1.6, 0.01, B); }); }, { hinge: [[2.0, 0.09, -0.9], [2.0, 0.09, 0.9]] });
        // ---- the tail: the black mesh between the lamps (the engine's heat), the talon lamps slanting up to the corners (each with its
        //      corner of the tail a part of its own), the exhausts high in the mesh, the rain light, the deck's lip ----
        K.rect(-2.132, 0.62, 0, 1.1, 0.3, MESH, { dir: '-x' });
        for (const s of [-1, 1]) K.face([[-2.131, 0.7, s * 0.56], [-2.131, 0.7, s * 0.93], [-2.133, 0.86, s * 0.93], [-2.133, 0.84, s * 0.56]].map((p, i, a) => s < 0 ? a[a.length - 1 - i] : p), B, { host: s < 0 ? 'tailL' : 'tailR' });
        K.deli('zadnje_luci', () => { for (const s of [-1, 1]) for (const [dy, zi, zo] of [[0.0, 0.6, 0.9], [-0.055, 0.66, 0.9]])   // (the garage's in their place, in the black faces: mounts.zadnje_luci)
          K.tailLamp(-2.134, 0.775 + dy, 0, 0, 0, { pts: [[s * zi, -0.012], [s * zo, 0.03], [s * zo, 0.048], [s * zi, 0.006]].map((p, i, a) => s < 0 ? a[a.length - 1 - i] : p), d: 0.02, host: s < 0 ? 'tailL' : 'tailR' }); });
        K.deli('auspuh', () => { for (const s of [-1, 1]) K.exhaust(-2.16, 0.6, s * 0.14, 0.055, 0.26, { n: 8, col: [0.5, 0.47, 0.44], part: 'body' }); });   // (the garage's in their place: mounts.auspuh)
        K.rect(-2.134, 0.4, 0, 0.14, 0.05, RED, { dir: '-x', host: 'bumperR' });
        K.box(-2.075, 0.935, 0, 0.03, 0.025, 1.7, 0, B, null, false, { part: 'trunk' });
        // the diffuser: the ramp up to the tail, its fins (thin: a face either side)
        K.part('diffuser', () => { if (AE > 3) return;   // (the garage's kit with its rear pieces in its place: the lips at the tail's corners, its diffuser)
          K.face([[-1.7, 0.12, 0.78], [-2.16, 0.36, 0.78], [-2.16, 0.36, -0.78], [-1.7, 0.12, -0.78]], B);   // (its underside: seen from behind)
          for (const z of [-0.74, -0.32, 0.32, 0.74]) { const q = [[-1.76, 0.115, z], [-2.18, 0.365, z], [-2.18, 0.115, z]]; K.face(q, B); K.face(q.slice().reverse(), B); }
        }, { hinge: [[-1.7, 0.12, -0.7], [-1.7, 0.12, 0.7]] });
        // ---- the wing: the main plane (an airfoil, black carbon: it reads over the deck from the chase camera), the flap over its trailing
        //      edge, the tall endplates, the swan necks over its leading edge (all black) ----
        K.part('wing', () => K.deli('krilo', () => {   // (the garage's wing in its place: K.deli, mounts.krilo)
          const AF = [[-1.86, 1.215], [-1.88, 1.236], [-1.96, 1.25], [-2.06, 1.26], [-2.19, 1.272], [-2.2, 1.263], [-2.06, 1.243], [-1.96, 1.227], [-1.88, 1.207]];
          K.skin([-0.92, 0.92].map(z => AF.map(([x, y]) => [x, y, z])), B);   // (its ends in the endplates)
          K.wingPlank(-2.12, 1.288, -2.22, 1.31, 0.012, -0.92, 0.92, B);
          for (const s of [-1, 1]) {
            const ep = [[-1.8, 1.13, s * 0.925], [-2.26, 1.09, s * 0.925], [-2.26, 1.37, s * 0.925], [-1.85, 1.31, s * 0.925]]; K.face(ep, B); K.face(ep.slice().reverse(), B);   // (thin: a face either side)
            const path = [[-1.62, 0.945], [-1.67, 1.17], [-1.74, 1.29], [-1.83, 1.31], [-1.93, 1.27]], wd = [0.08, 0.065, 0.055, 0.05, 0.055], t = 0.014;
            K.skin(path.map((p, i) => { const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)], tl = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / tl, ny = (b[0] - a[0]) / tl, h = wd[i] / 2;
              return [[p[0] + nx * h, p[1] + ny * h, s * 0.4 - t], [p[0] + nx * h, p[1] + ny * h, s * 0.4 + t], [p[0] - nx * h, p[1] - ny * h, s * 0.4 + t], [p[0] - nx * h, p[1] - ny * h, s * 0.4 - t]]; }), B);   // (its ends in the deck and the wing)
          }
        }), { noCrush: true, noDent: true, hinge: [[-1.62, 0.95, -0.4], [-1.62, 0.95, 0.4]] });
        // ---- the wide arches' lips (in the fenders and the quarters) ----
        for (const s of [-1, 1]) { K.flare(K.fx, 0.4, 0.45, s * 0.98, s * 1.02, P, { n: 5 }); K.flare(K.rx, 0.4, 0.45, s * 0.99, s * 1.025, P, { n: 5 }); }
        // ---- the mirrors (black, on stalks from the doors' tops), the wiper ----
        K.deli('ogledala', () => { for (const s of [-1, 1]) { K.mirror(0.74, 0.99, s * 1.04, { w: 0.16, h: 0.07, d: 0.12, col: B, arm: B, z0: s * 0.95, crack: 1 });   // (the garage's in their place: mounts.ogledala)
          K.bar([0.8, 0.86, s * 0.95], [0.75, 0.97, s * 1.0], 0.016, B, { n: 4, part: s < 0 ? 'mirrorL' : 'mirrorR' }); } });
        K.deli('vrata', () => {}); K.deli('lovilci_blata', () => {});   // (stock: no handles, no flaps; the garage's doors, mudflaps and sills' guards: mounts.vrata, mounts.lovilci_blata)
        for (const id of ['crte', 'nalepke', 'soncni_pas', 'celjusti', 'zamasek']) K.deli(id, () => {});   // (stock: none; the garage's over the paint, the windscreen's top, the fuel cap)
        K.bar([0.95, 0.86, -0.5], [0.9, 0.875, 0.24], 0.01, B, { n: 4, part: 'wiperFront' });
        // ---- the hinges: the bonnet at the cowl, the engine cover at the rear window's foot, the doors at their front edges, the bumpers ----
        K.hinge('hood', [0.99, 0.85, -0.6], [0.99, 0.85, 0.6]);
        K.hinge('trunk', [-0.96, 1.03, -0.5], [-0.96, 1.03, 0.5]);
        for (const s of [-1, 1]) K.hinge(s < 0 ? 'doorL' : 'doorR', [0.95, 0.25, s * 0.98], [0.95, 0.8, s * 0.98]);
        K.hinge('bumperR', [-2.0, 0.46, -0.85], [-2.0, 0.46, 0.85]);
        // ---- Visoki (Nastavitve · Detajli avtov: Visoki; the player's and the showroom's car): the driver in his bucket, his helmet's visor
        //      dark ----
        if (K.hi) K.driver(-0.38, 0.95, -0.34, { inner: true, r: 0.115, lean: 0.34, hands: [0.04, 0.7, 0.15], knee: [0.3, 0.52, 0.16], feet: [0.66, 0.22, 0.11], suit: [0.8, 0.1, 0.1], helmet: [0.95, 0.95, 0.95] });
        // ---- inside (seen once a part is off): the carbon floor and bulkhead, the bucket seat with its harness, the race dashboard and its
        //      flat-topped wheel (left-hand drive), the sequential lever, the pedals, the bare door cards, the cage, the extinguisher; the V10
        //      behind the seat, the radiator in the nose, the fuel cell ahead of the engine ----
        { const C = K.cab, IN = C.IN, SZ = -0.34, CF = [0.07, 0.07, 0.075], SH = [0.06, 0.06, 0.065], SC = [0.12, 0.12, 0.13];
          C.face([[-0.74, 0.17, -0.78], [0.86, 0.17, -0.78], [0.86, 0.17, 0.78], [-0.74, 0.17, 0.78]], CF, [0, 1, 0]);
          C.face([[0.86, 0.17, -0.78], [0.86, 0.17, 0.78], [0.86, 0.56, 0.78], [0.86, 0.56, -0.78]], CF, [-1, 0, 0]);
          K.box(-0.1, 0.17, 0, 0.9, 0.18, 0.24, 0, CF, C.PL, true, IN);   // (the tunnel)
          C.dash({ x: 0.3, y: 0.66, d: 0.32, w: 0.74, dz: SZ, col: CF, col2: [0.12, 0.12, 0.13], style: 'race' });
          C.steer({ c: [0.06, 0.7, SZ], ax: [0.8, -0.6], r: 0.15, rr: 0.016, to: [0.3, 0.56, SZ] });
          C.seat(-0.42, 0.24, SZ, { w: 0.46, top: 0.62, lean: 0.34, shell: true, belt: 'harness', col: SH, col2: SC, strap: RED });
          C.console(0.0, 0.35, { l: 0.24, seq: true, brake: false });
          C.pedals(0.66, 0.19, SZ, 3);
          for (const sd of [-1, 1]) C.door(sd, { x: [-0.28, 0.9], y: [0.3, 0.74], z: 0.82, insert: CF, crank: false, speaker: false, strap: RED });
          K.cyl([-0.2, 0.22, 0.36], [-0.55, 0.22, 0.36], 0.07, RED, { n: 6, inner: true, part: 'body' }); }   // (the extinguisher on the floor)
        const hoop = (s) => [[[-0.72, 0.17, s * 0.8], [-0.72, 0.86, s * 0.84]], [[-0.72, 0.86, s * 0.84], [-0.7, 1.1, s * 0.48]], [[-0.7, 1.1, s * 0.48], [0.12, 1.12, s * 0.5]],
          [[0.12, 1.12, s * 0.5], [0.66, 0.66, s * 0.82]], [[-0.72, 0.45, s * 0.86], [0.6, 0.48, s * 0.84]]];   // (the main hoop, the roof and A-pillar bars, the door bars)
        K.cage(hoop(-1).concat(hoop(1), [[[-0.7, 1.1, -0.48], [-0.7, 1.1, 0.48]], [[-0.72, 0.17, 0.8], [-0.7, 1.1, -0.48]]]), 0.022, null, { n: 4 });
        K.engine(-1.25, 0.22, 0, { l: 0.8, w: 0.62, h: 0.46, col: [0.6, 0.61, 0.64] });
        K.box(2.25, 0.16, 0, 0.08, 0.32, 1.1, 0, D, null, false, { inner: true, part: 'body' });
        K.box(-0.82, 0.18, 0, 0.18, 0.36, 0.9, 0, [0.26, 0.26, 0.28], null, false, { inner: true, part: 'body' });
        for (const id of ['filter_zraka', 'akumulator', 'turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum']) K.deli(id, () => {});   // (stock: none; the garage's round the V10, on the fuel cell, at the wheels: mounts)
      },
    },
  });
})();
