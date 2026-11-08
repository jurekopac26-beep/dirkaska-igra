/* Vehicle 'superkombi' — SUPERKOMBI: a 1980s / 90s racing van, a race engine in the middle. Signature features: 1) a one-box van body
   lowered over wide race wheels, 2) big side intakes for the mid-mounted engine, 3) a rear wing across the roof edge, 4) a deep front
   spoiler, 5) flared arches and a race livery. L 4.70 W 1.95 H 1.75, wheelbase 2.80, overhangs F 0.85 R 1.05 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  // the garage's head lamp in the place of the rectangular lamp in the nose's black band (u out from the car's middle, v up; metres round
  // z 0.53, y 0.62): every option takes this outline, in the band
  const LAMP = [[-0.19, -0.065], [0.19, -0.065], [0.19, 0.065], [-0.19, 0.065]];
  VEHICLE_DEFS.push({
    id: 'superkombi', name: 'SUPERKOMBI', cat: 'posebni', ord: 1, drive: 'MR',
    desc: 'Dirkalni kombi iz 80-ih in 90-ih z dirkalnim motorjem na sredini.',
    phys: { mass: 1250, a: 1.5, b: 1.3, kI: 1.28, kw: 520, redline: 8500, idle: 1000, gears: [3.2, 2.08, 1.5, 1.17, 0.95, 0.8], final: 4.84, rw: 0.34, cDrag: 0.5, len: 4.7, wid: 1.95, steerMax: 0.6,
      tracK: 1.1, brakeK: 1.05, spinK: 0.25, aero: 0.00005, loose: 0.8, sway: 1.3, aiGap: 7.5, aiPass: 4 },   // (aiGap / aiPass: its AI follows further back and passes wider: fewer pile-ups on the Nordschleife, tests/fleet.test.js 8b)
    arc: { amax: 1.8, kv: 2.2, rmin: 4.8 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.14, pwr: 0.07, out: 1.2, turn: 1.05, w: 1.02 },   // (the MR layer: quick turn-in, lift rotation; its own liftP, pwr, turn)
    stats: { power: 10, grip: 10, weight: 7, drift: 6 },
    price: 70000, pk: 'unl', field: ['superkombi'],
    snd: { kind: 'v10', hz: 1, loud: 1.2 },
    expect: { t100: [2.97, 3.48], vmax: [259, 275], latG: [2.39, 2.49], d100: [21.6, 23.9] },
    // (where the look has them: the short bonnet ahead of the windscreen, the tailgate at the tail, the wing over the roof's back edge, the
    // mirrors at the windscreen's foot, the doors behind the front wheels; a lost one flies off from there)
    partNames: { headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamp', tailR: 'right tail lamp', wiperFront: 'windscreen wipers' },
    parts: { set: 'race', ht: 1.75, y0: 0.14,
      over: { hood: { lx: 0.77, y: 0.93 }, trunk: { lx: -0.98, y: 1.12 }, wing: { y: 1.71 }, doorL: { lx: 0.18 }, doorR: { lx: 0.18 }, mirrorL: { lx: 0.47, y: 1.12 }, mirrorR: { lx: 0.47, y: 1.12 } },
      // (as KOLIBRI's: the head lamps parts of their own, the tail lamps up the corner posts each with its black surround; the wipers; a
      // hit on a lamp's corner knocks it out)
      extra: {
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.2, h: 0.04, lx: 0.993, lz: -0.544, y: 0.62 },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.2, h: 0.04, lx: 0.993, lz: 0.544, y: 0.62 },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.25, h: 0.05, lx: -0.995, lz: -0.79, y: 0.81 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.25, h: 0.05, lx: -0.995, lz: 0.79, y: 0.81 },
        wiperFront: { z: 0, th: 0.65, m: 0.5, r: 0.45, h: 0.03, lx: 0.564, lz: -0.07, y: 1.05 },
      },
    },
    // where the garage's parts go (js/deli.js, look units): the wing over the roof's back edge, in the wing's part (in place of the wing on
    // its struts); the head lamps in the place of the rectangular lamps (every option in their outline, LAMP, in the black band), in the
    // lamps' parts; the rims
    mounts: {
      krilo: { x: -2.19, w: 0.75, part: 'wing' },
      zarometi: { x: 2.333, y0: 0.62, lean: 0, zc: 0.53, yc: 0.62, s: 0.7, hosts: ['headL', 'headR'], shape: LAMP, bulge: 0, ringW: 0.008 },
      platisca: {},
      // (sklop 2 · spredaj, js/deli/spredaj.js) the kit's lip on the deep spoiler's face over the splitter, its diffuser under the rear
      // bumper (the stock splitter and diffuser kept by the options without a piece of their own there), its skirts between the flares'
      // feet; the short bonnet from the wipers to the nose; the grille between the lamps in the black band; the indicators where the
      // stock ones are in the band (the repeaters on the fenders over the flares), the rear ones on the rear bumper, the mirrors' fronts;
      // the extra lamps in front of the brake ducts, on a bar in front of the band (its feet on the nose's face), a light bar in the
      // radiator's mouth, the roof bar on the roof's front, the pod over the nose
      aero: { xf: 2.33, xr: -2.33, w: 0.84, yf: 0.1, yr: 0.18, sill: [-0.75, 0.93], ws: 0.9, ys: 0.22, lipF: [2.25, 0.045, 0.24, 0.025, 1.8], lipR: [-2.2, 0.09, 0.28, 0.1, 1.5], exh: [-0.22, 0.05], archIn: 0.008 },
      hauba: { x0: 1.34, x1: 2.3, w: 0.78, rel: true },
      maska: { x: 2.333, y0: 0.62, lean: 0, yc: 0.62, w: 0.62, h: 0.14 },
      zmigavci: { front: { x: 2.336, y: 0.62, z: 0.78, w: 0.08, h: 0.12, part: 'body' }, side: { x: 1.18, y: 0.83, z: 0.9, hosts: ['fenderL', 'fenderR'] },
        rear: { x: -2.336, y: 0.38, z: 0.62, part: 'bumperR' }, mirror: { x: 1.1505, y: 1.092, z: 0.92, w: 0.11, parts: ['mirrorL', 'mirrorR'] } },
      relijske_luci: { bumper: [2.33, 0.3, 0.62], nose: [2.318, 0.62], intake: [2.33, 0.29, 0.84, 0.17], roof: [0.33, 0.7], pod: [2.333, 0.5, 0.76, 0.66], part: 'bumperF' },
      // (js/deli/zadaj.js) the tail lamps' room up the corner posts (KOLIBRI's strip laid into it), the band across the tailgate between
      // them; the twin tailpipes' tips (the left one; the flap valves on the pipes); the tailgate: its panel from the bumper to the window's
      // foot, the window up to the roof's edge (in pieces: a blanked window over the step under the glass, not a flat sheet 2.4 cm off it),
      // the black band across it; the tow points on the bumpers' faces (the front one between the radiator's mouth and the brake duct);
      // the flaps behind the flares' feet, the guards on the sills between them (inside the aero kit's skirts)
      zadnje_luci: { x: -2.322, zc: 0.77, yc: 0.81, w: 0.14, h: 0.3, shape: [[-0.06, -0.21], [0.06, -0.21], [0.06, 0.21], [-0.06, 0.21]], hosts: ['tailL', 'tailR'],
        bar: { x: -2.334, y: 0.81, w: 0.58, h: 0.04, part: 'trunk' } },
      auspuh: { x: -2.37, y: 0.32, z: 0.22, r: 0.05, len: 0.2, valve: true, part: 'bumperR' },
      prtljaznik: { x: [-2.33, -2.29], glass: -2.19, w: 0.64, face: [-2.33, 0.58, 1.05], cells: 4, part: 'trunk', garnish: [-2.334, 0.81, 1.2, 0.17] },
      vlecne_kljuke: { f: [2.333, 0.3, 0.455], r: [-2.333, 0.38, 0.42] },
      lovilci_blata: { x: [0.95, -1.85], z: [0.66, 0.96], y: [0.34, 0.08], sill: [-0.72, 0.9, 0.24, 0.905], part: 'body' },
      // (js/deli/streha.js) the sunroofs on the flat roof (over the front seats, over the engine), the scoop's mouth over the
      // windscreen's top; the aerials (none stock): the rod on the roof's rear, the fin ahead of the wing, the stub behind a roof bar, the
      // whip mid-roof; the louvres over the upright tailgate's window
      streha: { x0: -1.85, x1: 0.38, xf: 0.34, xr: -1.0 },
      stresna_zajemalka: { x: 0.29, z: 0 },
      antena: { x: -1.45, z: 0.6, fin: [-1.75, 0], front: [0.25, 0.44], whip: -0.6, part: 'body' },
      zaluzije: { x0: -2.29, y0: 1.13, x1: -2.2, y1: 1.55, w: 0.6, part: 'trunk' },
      // (js/deli/bok.js) the stock mirrors at the windscreen's foot, the front doors inside their shut lines (the handle over the skin; the
      // net's and the light glass's window from the B-pillar, raked short of the glass's twist: between the sections at 0.38 and 1.31 its
      // left side bulges up to 15 mm out of the window band they lie on); the brakes through the slicks' spokes, the centre-lock nut
      ogledala: { x: 1.1, y: 1.12, z: 0.92, w: 0.1, h: 0.08, d: 0.13, z0: 0.86 },
      vrata: { x: [-0.06, 1.12], y: [0.34, 0.99], handle: [-0.02, 0.9, 0.907, 0.14, 0.03], win: [[-0.03, 0.07], [0.85, 0.07], [0.55, 0.9], [-0.03, 0.9]], frame: [-0.06, -0.03, 0.9, 0.93] },
      zavore: { s: 1 }, matice: { k: 5, r: 0.2, lock: true },
      // (sklop 3 · barve, js/deli/barve.js) the stripes over the bonnet and the roof in place of the livery's twin ones (the side band
      // stays); the decals above the side band on the doors and the sliding door, on the bonnet beside the stripes and the roof; the sun
      // strip on the windscreen's top; the fuel cap on the right rear quarter; the calipers
      barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {},
      crte: { z: [0.12, 0.3], x: [[1.34, 2.3], [-2.14, 0.34]], w: 0.78 },
      nalepke: { side: [[-0.03, 1.08], [0.72, 1.08], [-0.98, -0.12]], y: [0.8, 0.97], hood: { x: [1.4, 2.15], z: [0.34, 0.72] }, roof: { x: [-1.8, 0.2] } },
      soncni_pas: { x: [0.39, 0.52] }, zamasek: { x: -2.0, y: 0.62, z: 0.902, r: 0.045 },
      celjusti: { r: [0.09, 0.169], a: [70, 125] },
      // (sklop 3 · skriti deli, js/deli/skriti.js) round the V10 between the axles: the filter behind it on the gearbox (its duct onto
      // the block), the battery against the right side radiator (the side has no skin under 0.24 behind the doors), the turbos on the
      // headers over 0.34 (lower, through the rear wheel's opening), the intercooler on the gearbox, the control box on the gearbox; the
      // struts through the wheel wells' liners, the bars over the floor
      filter_zraka: { x: -1.5, y: 0.46, z: -0.3 }, akumulator: { x: -0.58, y: 0.21, z: 0.52 }, turbo: { x: -1.1, y: 0.345, z: 0.3, twin: [-0.6, 0], ic: [-1.68, 0.52, 0.06] },
      cip: { x: -1.55, y: 0.52, z: 0.12 },
      vzmeti: { in: 0.175, top: 0.7 }, amortizerji: { in: 0.175, top: 0.7 }, stabilizatorji: { in: 0.14, floor: [0.17, 0.19] }, dim_gum: {},
    },
    // the look (KIT API v1, render.js; look units = metres): one loft, the one-box van (a short sloping bonnet running into a long raked
    // windscreen, a flat roof, an upright tailgate), lowered over wide slicks in flared arches. The standard regions split it (the bonnet,
    // the tailgate with its glass, the front fenders with the quarter-lights, the front doors with their glass, the rear quarters with the
    // sliding door's window and the side intake, the deep front spoiler and the rear bumper at the loft's ends); the wing on its struts
    // across the roof's back edge in its part. The livery: the paint, a band in the stripe colour sweeping up the side and twin stripes over
    // the bonnet and the roof, black skirts and pillars, the start number on the doors and the roof
    look: {
      body: { len: 4.7, wid: 1.95, roofY: 1.63, wz: 0.17,
        // (the sections sit on the cuts the regions and the arches make anyway: the windscreen's base on the front arch's, the bonnet's
        // front at the spoiler's back edge, the roof's back edge at the rear bumper's, the intake's back edge on the rear arch's last)
        //       x      w     yb    ybelt  wt    yt    cr    kind  tuck
        secs: [[-2.33, 0.86, 0.18, 0.98, 0.7, 1.05, 0.02, 'b', 0.08],    // the tail: the rear bumper and the tailgate's lower panel (the end cap)
          [-2.29, 0.88, 0.17, 1.0, 0.72, 1.1, 0.03, 'gr', 0.08],         // the tailgate's glass, nearly upright, between the D-pillars
          [-2.19, 0.9, 0.17, 1.0, 0.75, 1.55, 0.05, 'r', 0.09],          // the roof's back edge
          [-1.68, 0.9, 0.16, 1.0, 0.8, 1.57, 0.06, 'r', 0.1],            // (the side intake's back edge)
          [0.38, 0.9, 0.14, 1.0, 0.8, 1.57, 0.06, 'gf', 0.1],            // the windscreen's top
          [1.31, 0.9, 0.14, 0.98, 0.84, 1.03, 0.03, 'b', 0.1],           // the windscreen's base (the cowl)
          [2.18, 0.88, 0.08, 0.8, 0.83, 0.85, 0.02, 'b', 0.09],          // the short sloping bonnet; the spoiler from here, deep under it
          [2.33, 0.84, 0.07, 0.72, 0.79, 0.76, 0.01, 'b', 0.07]],        // the nose: the lamps' panel over the spoiler's face
        eye: { x: 0.12, y: 1.22, near: 0.25, tilt: 0.06, style: 'closed' },   // (high and upright, as in a van; the roll cage round it)
        door: [1.12, -0.06], bumpF: 0.15, bumpR: 0.14, bumpY: [0.5, 0.56],
        engine: [-0.85, 0.68], engRear: true, cage: true,                    // (the race engine behind the seats, between the axles: its top)
        crush: { x0: -2.34, x1: -0.55, z: 0.84 } },                          // (the roof over the engine sinks, the wing on it to its trailing edge; the cage holds the cabin's)
      wheels: { style: 'slick', w: 0.27, wR: 0.31, rim: [0.17, 0.17, 0.19], gap: 0.04 },
      // (the tailgate is its glass and the panel under it: the D-pillars beside the glass stay on the body with the tail lamps)
      regions: (std) => std.map(r => r.part === 'trunk' ? Object.assign({}, r, { bands: ['edge', 'crown'] }) : r),
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, D = [0.1, 0.1, 0.11], GR = [0.32, 0.33, 0.35];
        const A0 = K.arches[0], A1 = K.arches[1], XA = A1.x + A1.half, XB = A0.x - A0.half;    // (the skirt from the rear arch to the front one)
        const XI0 = A1.x + A1.half * Math.cos(Math.PI / 6), XI1 = A1.x - A1.half;               // (the side intake: between two of the rear arch's cuts)
        // ---- the shell: the paint; the glass (the windscreen and the quarter-lights beside it, the side windows forward of the intake, the
        //      tailgate's window); black under the sills, the spoiler and the bumper ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (e === 0 || e === 8) return B;
          if (kind === 'gf') return e >= 2 && e <= 6 ? G : P;
          if (kind === 'gr') return e >= 3 && e <= 5 ? G : P;
          if (kind === 'r' && (e === 2 || e === 6)) return at.x > XI0 ? G : P;
          return P;
        }, { caps: { front: { col: P }, rear: { col: P } } });
        const LD = L.decal;
        // the glasshouse: black pillars and frames (one dark band of glass round the cabin, as the vans had)
        LD.band([[0.38, 0.86], [1.31, 0.86], [1.31, 1], [0.38, 1]], B, null, 0.008);                     // the A-pillar (the windscreen's edge)
        LD.band([[1.09, 0], [1.15, 0], [1.15, 1], [1.09, 1]], B, null, 0.009);                            // the door's front edge (the quarter-light ahead of it)
        LD.band([[-0.12, 0], [-0.03, 0], [-0.03, 1], [-0.12, 1]], B, null, 0.009);                        // the B-pillar
        LD.band([[XI0, 0], [1.31, 0], [1.31, 0.06], [XI0, 0.06]], B, null, 0.008);                        // along the belt
        LD.band([[XI0, 0.93], [0.38, 0.93], [0.38, 1], [XI0, 1]], B, null, 0.008);                        // under the roof's edge
        // the livery: a band in the stripe colour sweeping up the side from the nose to the tail; the black skirts
        LD.side([[2.34, 0.36], [2.34, 0.54], [-2.34, 0.96], [-2.34, 0.78]], S, null, 0.008);
        K.deli('crte', () => { for (const sd of [-1, 1]) {                                                 // twin stripes over the bonnet and the roof (the garage's in their place: mounts.crte)
          LD.top([[1.34, sd * 0.14], [2.3, sd * 0.14], [2.3, sd * 0.26], [1.34, sd * 0.26]], S, 0.008);
          LD.top([[-2.14, sd * 0.14], [0.34, sd * 0.14], [0.34, sd * 0.26], [-2.14, sd * 0.26]], S, 0.008); } });
        for (const id of ['nalepke', 'soncni_pas', 'celjusti', 'zamasek']) K.deli(id, () => {});        // (the garage's decals, sun strip, calipers and fuel cap: none stock)
        LD.side([[XA + 0.02, 0.24], [XB - 0.02, 0.24], [XB - 0.02, 0.33], [XA + 0.02, 0.33]], B, null, 0.008);
        LD.side([[2.18, 0.1], [2.34, 0.1], [2.34, 0.2], [2.18, 0.2]], B, null, 0.008);                      // (the spoiler's black lip, round its corners)
        // the sliding door: its rear shut line under the intake's lip, its rail along the quarter under the windows
        LD.side([[XI0 - 0.03, 0.25], [XI0 - 0.015, 0.25], [XI0 - 0.015, 0.995], [XI0 - 0.03, 0.995]], D, null, 0.009);
        LD.side([[-2.02, 0.935], [XI0 - 0.03, 0.935], [XI0 - 0.03, 0.955], [-2.02, 0.955]], D, null, 0.009);
        // ---- the flared arches (in the paint, round the wide slicks) ----
        for (const A of K.arches) for (const sd of [-1, 1]) K.flare(A.x, A.r, A.r + 0.15, sd * 0.85, sd * 0.975, P, { n: 6, a0: 0.04, a1: Math.PI - 0.04 });
        // ---- the side intakes for the mid-mounted engine: where the rear side window was, a black mouth with its slats, a lip at its front
        //      edge and over it standing out into the air ----
        for (const sd of [-1, 1]) {
          const f = sd < 0 ? '-z' : 'z', Q = sd < 0 ? 'quarterL' : 'quarterR', zb = (y) => sd * (0.9 - 0.1 * (y - 1) / 0.57 + 0.012);   // (the window band's plane there: w 0.9 at the belt, wt 0.8 at 1.57)
          const face = (pts, col, dz) => { const q = pts.map(([x, y]) => [x, y, zb(y) + sd * (dz || 0)]); K.face(sd > 0 ? q : q.reverse(), col, { part: Q }); };
          face([[XI1 + 0.05, 1.05], [XI0 - 0.04, 1.05], [XI0 - 0.04, 1.47], [XI1 + 0.05, 1.47]], B);
          for (const y of [1.16, 1.26, 1.36]) face([[XI1 + 0.06, y - 0.012], [XI0 - 0.05, y - 0.012], [XI0 - 0.05, y + 0.012], [XI1 + 0.06, y + 0.012]], GR, 0.006);
          K.box(XI0 - 0.02, 1.02, sd * 0.905, 0.05, 0.47, 0.05, 0, P, null, false, { part: Q });                   // (the lip at its front edge)
          K.box((XI0 + XI1) / 2, 1.47, sd * 0.85, XI0 - XI1 - 0.04, 0.035, 0.07, 0, P, null, false, { part: Q });   // (the brow over it)
          // the start number on the front door (over the band), its handle, its hinge; the mirror
          K.number(0.45, 0.62, sd * 0.918, 0.34, { dir: f, host: sd < 0 ? 'doorL' : 'doorR' });
          K.hinge(sd < 0 ? 'doorL' : 'doorR', [1.1, 0.3, sd * 0.9], [1.1, 0.95, sd * 0.9]);
        }
        // (the handles and the mirrors; the garage's doors and mirrors in their place: K.deli, mounts.vrata, ogledala)
        K.deli('vrata', () => { for (const sd of [-1, 1]) K.rect(-0.02, 0.9, sd * 0.913, 0.14, 0.03, B, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' }); });
        K.deli('ogledala', () => { for (const sd of [-1, 1]) K.mirror(1.1, 1.12, sd * 0.92, { col: B, w: 0.1, h: 0.08, d: 0.13 }); });
        // ---- the nose: rectangular lamps in a black band, the slot between them; the deep front spoiler (the loft's end under the bumper's
        //      line, 'bumperF'): the radiator's mouth, the brake ducts, a band in the stripe colour over them, the splitter under it ----
        K.rect(2.333, 0.62, 0, 1.6, 0.17, B, { part: 'body' });
        K.deli('zmigavci', () => { for (const sd of [-1, 1]) K.rect(2.336, 0.62, sd * 0.78, 0.08, 0.12, K.rgb(0xff9a1e), { part: 'body' }); });   // (the garage's indicators in their place: mounts.zmigavci)
        // (the lamps parts of their own: headL, headR; the garage's in their place, in the band: K.deli, mounts.zarometi)
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(2.34, 0.62, sd * 0.53, 0.065, { shape: 'rect', w: 0.38, h: 0.13, ring: null, host: sd < 0 ? 'headL' : 'headR' }); });
        K.deli('maska', () => K.grille(2.336, 0.62, 0, 0.6, 0.1, { slats: 2, slatCol: GR, part: 'body' }));   // (the garage's grille in its place: mounts.maska)
        K.deli('relijske_luci', () => {});                                                          // (the garage's rally lamps: none stock)
        let chin = false;   // (the stock splitter drawn: no garage kit fitted, K.deli('aero'); so the stock diffuser too, in its place in the tail)
        K.part('bumperF', () => {
          K.rect(2.334, 0.29, 0, 0.84, 0.17, B); K.grille(2.336, 0.29, 0, 0.8, 0.14, { slats: 2, slatCol: GR });   // the radiator's mouth
          for (const sd of [-1, 1]) K.rect(2.334, 0.28, sd * 0.64, 0.3, 0.13, B);                  // the brake ducts
          K.rect(2.334, 0.44, 0, 1.62, 0.04, S); K.rect(2.334, 0.135, 0, 1.64, 0.13, B);           // (a band in the stripe colour over them; the black lip under them)
          K.deli('aero', () => { K.box(2.25, 0.045, 0, 0.24, 0.025, 1.8, 0, B); chin = true; });   // the splitter (4 cm proud of the face; the garage's kit in its place: mounts.aero)
        }, { hinge: [[2.2, 0.3, -0.8], [2.2, 0.3, 0.8]] });
        K.part('hood', () => K.deli('hauba', () => {}));                                            // (the garage's bonnet: mounts.hauba)
        for (const z of [-0.42, 0.28]) K.bar([1.34, 1.04, z - 0.3], [1.31, 1.06, z + 0.3], 0.01, B, { n: 4, part: 'wiperFront' });   // the wipers
        K.hinge('hood', [1.31, 1.02, -0.7], [1.31, 1.02, 0.7]);
        // ---- the tail: the tail lamps up the corner posts (they stay on the body when the tailgate goes), a black band across the
        //      tailgate; the rear bumper (the loft's end under the bumper's line): a black band, the twin tailpipes, the diffuser under it ----
        for (const sd of [-1, 1]) {
          K.box(-2.29, 0.56, sd * 0.77, 0.09, 0.5, 0.18, 0, P, null, false, { part: 'body' });
          const tp = sd < 0 ? 'tailL' : 'tailR', z0 = sd * 0.77 - 0.08, z1 = sd * 0.77 + 0.08;   // (each lamp with its black surround a part of its own: the surround's top 4 mm further back, the piece on the road has a volume)
          K.face([[-2.337, 0.58, z0], [-2.337, 0.58, z1], [-2.341, 1.04, z1], [-2.341, 1.04, z0]], B, { host: tp });
        }
        // (the lamps on their surrounds; the garage's in their room: K.deli, mounts.zadnje_luci)
        K.deli('zadnje_luci', () => { for (const sd of [-1, 1]) K.tailLamp(-2.338, 0.81, sd * 0.77, 0.12, 0.42, { host: sd < 0 ? 'tailL' : 'tailR' }); });
        K.part('trunk', () => K.deli('prtljaznik', () => K.rect(-2.334, 0.81, 0, 1.2, 0.17, B, { dir: '-x' })));   // (a black band across the tailgate from lamp to lamp; the garage's tailgate: mounts.prtljaznik)
        K.part('trunk', () => K.deli('zaluzije', () => {}));                                       // (the garage's louvres over its window: mounts.zaluzije)
        K.hinge('trunk', [-2.19, 1.6, -0.6], [-2.19, 1.6, 0.6]);
        K.part('bumperR', () => {
          K.rect(-2.334, 0.215, 0, 1.64, 0.07, B, { dir: '-x' }); K.rect(-2.334, 0.5, 0, 1.6, 0.035, S, { dir: '-x' });
          if (chin) K.box(-2.2, 0.09, 0, 0.28, 0.07, 1.5, 0, B);                                  // the diffuser (with the splitter: K.deli('aero'))
          K.deli('auspuh', () => { for (const sd of [-1, 1]) K.exhaust(-2.37, 0.32, sd * 0.22, 0.05, 0.2, { n: 6 }); });   // (the V10's twin tailpipes; the garage's: mounts.auspuh)
        });
        for (const id of ['vlecne_kljuke', 'lovilci_blata']) K.deli(id, () => {});                    // (the garage's tow points and flaps: none stock)
        K.part('body', () => { for (const id of ['streha', 'stresna_zajemalka', 'antena']) K.deli(id, () => {}); });   // (its sunroofs, roof scoop and aerials: none stock; in the roof's part, the wing's region over it)
        // ---- the wing across the roof's back edge: its plane black (apart from the roof's stripes in any livery), overhanging the tail;
        //      the endplates in the paint, black struts (never crushed, never dented) ----
        K.part('wing', () => K.deli('krilo', () => {   // (the garage's wing in its place: K.deli, mounts.krilo)
          K.wingPlank(-1.95, 1.7, -2.46, 1.73, 0.04, -0.9, 0.9, B);                               // (its top 1.77: 14 cm over the roof)
          for (const sd of [-1, 1]) { K.endplate([[-1.93, 1.675], [-2.48, 1.675], [-2.48, 1.78], [-1.95, 1.755]], sd * 0.915, 0.014, P);
            K.box(-2.16, 1.58, sd * 0.45, 0.14, 0.13, 0.025, 0, B); }
        }), { noCrush: true, noDent: true });
        // ---- inside (seen once a part is off): two racing seats in the cage, the dashboard and the wheel; the race engine behind them (the
        //      bulkhead between) with its radiators beside it, its gearbox over the rear axle; a radiator in the nose ----
        for (const sd of [-1, 1]) K.seat(0.02, 0.42, sd * 0.38, { w: 0.46, back: 0.76, tilt: 0.2, col: [0.08, 0.08, 0.09] });
        K.box(1.02, 0.6, 0, 0.42, 0.34, 1.6, 0, D, null, false, { inner: true, part: 'body' });
        K.cyl([0.52, 0.94, -0.38], [0.545, 0.965, -0.38], 0.17, B, { n: 10, capA: null, capB: null, inner: true, part: 'body' });   // the wheel (on the left) on its column
        K.bar([0.54, 0.955, -0.38], [0.84, 0.82, -0.38], 0.025, D, { n: 4, inner: true, part: 'body' });
        K.box(-0.4, 0.18, 0, 0.04, 0.84, 1.62, 0, D, null, false, { inner: true, part: 'body' });
        // the V10: its block, the plenum in the vee, the red cam covers on its banks, the headers to the tailpipes
        K.engine(-0.85, 0.2, 0, { l: 0.86, w: 0.46, h: 0.44, col: [0.6, 0.61, 0.64], cover: [0.1, 0.1, 0.11] });
        for (const sd of [-1, 1]) {
          K.plate([[-1.24, 0.48, sd * 0.12], [-0.46, 0.48, sd * 0.12], [-0.46, 0.6, sd * 0.31], [-1.24, 0.6, sd * 0.31]], 0.05, [0.82, 0.12, 0.08], { inner: true, part: 'body' });
          K.bar([-0.62, 0.36, sd * 0.3], [-1.9, 0.3, sd * 0.24], 0.035, [0.45, 0.42, 0.4], { n: 4, inner: true, part: 'body' }); }
        K.box(-1.52, 0.2, 0, 0.44, 0.32, 0.42, 0, [0.5, 0.51, 0.53], null, false, { inner: true, part: 'body' });                // (the gearbox)
        for (const sd of [-1, 1]) K.box(-0.68, 0.2, sd * 0.64, 0.4, 0.55, 0.1, 0, [0.2, 0.21, 0.22], null, false, { inner: true, part: 'body' });   // (the radiators beside it, ahead of the rear wheels)
        // (the garage's hidden parts round the engine and at the wheels: none stock; K.deli, js/deli/skriti.js)
        for (const id of ['akumulator', 'filter_zraka', 'turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum']) K.deli(id, () => {});
        K.box(1.95, 0.2, 0, 0.1, 0.5, 1.3, 0, [0.16, 0.16, 0.17], null, false, { inner: true, part: 'body' });
        const C = [0.78, 0.79, 0.82];
        K.cage([[[-0.33, 0.2, -0.72], [-0.33, 1.5, -0.7]], [[-0.33, 0.2, 0.72], [-0.33, 1.5, 0.7]], [[-0.33, 1.5, -0.7], [-0.33, 1.5, 0.7]], [[-0.33, 0.25, -0.7], [-0.33, 1.48, 0.7]],
          [[1.0, 0.3, -0.76], [0.42, 1.5, -0.7]], [[1.0, 0.3, 0.76], [0.42, 1.5, 0.7]], [[0.42, 1.5, -0.7], [-0.33, 1.5, -0.7]], [[0.42, 1.5, 0.7], [-0.33, 1.5, 0.7]]], 0.025, C,
          { noCrush: true, noDent: true });
      },
    },
  });
})();
