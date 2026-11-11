/* Vehicle 'jelen' — JELEN GT: a front-engined V12 grand tourer. Signature features: 1) a very long bonnet with a power bulge, 2) the
   cabin set far back over the rear axle, 3) a fastback roof ending in a short cut-off tail, 4) quad round tail lamps, 5) side vents
   behind the front wheels. L 4.55 W 1.94 H 1.30, wheelbase 2.70, overhangs F 0.85 R 1.00 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  // the garage's head lamp in the place of each side's pair of round lenses (a stadium round both, under the cover; u out from the car's
  // middle, v up; metres round z 0.475, y 0.46): every option takes this outline
  const PAIR = [];
  for (let i = 0; i <= 3; i++) { const a = -Math.PI / 2 + Math.PI * i / 3; PAIR.push([0.062 + 0.038 * Math.cos(a), 0.038 * Math.sin(a)]); }
  for (let i = 0; i <= 3; i++) { const a = Math.PI / 2 + Math.PI * i / 3; PAIR.push([-0.062 + 0.038 * Math.cos(a), 0.038 * Math.sin(a)]); }
  VEHICLE_DEFS.push({
    id: 'jelen', name: 'JELEN GT', cat: 'sportni', ord: 3, drive: 'FR',
    desc: 'Gran turismo z V12 spredaj: dolg pokrov motorja, hiter in miren na dolgih ravninah.',
    phys: { mass: 1650, a: 1.42, b: 1.28, kI: 1.3, kw: 400, redline: 7500, idle: 800, gears: [3.2, 2.08, 1.5, 1.17, 0.95, 0.8], final: 4.36, rw: 0.33, cDrag: 0.34, len: 4.55, wid: 1.94, steerMax: 0.6,
      brakeK: 1.05, spinK: 0.3 },
    arc: { amax: 1.78, kv: 2, rmin: 4.6 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.12, pwr: 0.08, out: 1.2, turn: 0.95, w: 0.99 },   // (the FR layer: lift-off and power rotation; its own liftP, pwr, out, turn, w)
    stats: { power: 9, grip: 8, weight: 3, drift: 7 },
    price: 60000, pk: 'ppo', field: ['jelen'],
    snd: { kind: 'v12', hz: 0.95, loud: 1.1 },
    expect: { t100: [3.28, 3.85], vmax: [245, 260], latG: [2.27, 2.37], d100: [21.9, 24.2] },
    partNames: { headL: 'left head lamps', headR: 'right head lamps', tailL: 'left tail lamps', tailR: 'right tail lamps', plate: 'number plate', wiperFront: 'windscreen wiper' },
    parts: { set: 'car', ht: 1.3, y0: 0.2,
      // (as KOLIBRI's: each side's pair of round head lamps a part of its own in the nose's fixed header, a hit on its corner knocks it
      // out; the quad tail lamps, two a side, likewise out of the cut-off tail; the number plate on the tail panel, the wipers on the cowl)
      extra: {
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.13, h: 0.06, lx: 1.0, lz: -0.49, f: 0.24 },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.13, h: 0.06, lx: 1.0, lz: 0.49, f: 0.24 },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.2, h: 0.05, lx: -1.0, lz: -0.6, f: 0.53 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.2, h: 0.05, lx: -1.0, lz: 0.6, f: 0.53 },
        plate: { z: 1, th: 0.4, m: 1, r: 0.17, h: 0.02, lx: -1.0, lz: 0, f: 0.35 },
        wiperFront: { z: 0, th: 0.65, m: 0.5, r: 0.45, h: 0.03, lx: 0.04, lz: -0.05, f: 0.66 },
      },
      over: { doorL: { lx: -0.16, y: 0.78 }, doorR: { lx: -0.16, y: 0.78 }, mirrorL: { lx: 0, y: 0.93 }, mirrorR: { lx: 0, y: 0.93 } } },   // (the doors and their mirrors far back, where the look has them)
    // where the garage's parts go (js/deli.js, look units): the wing on the short deck over the cut-off tail, in the tailgate (it opens
    // and goes with it); the head lamps in the place of each side's pair of lenses (every option in their stadium, PAIR), in the lamps'
    // parts; the rims
    mounts: {
      krilo: { x: -2.2, w: 0.84, part: 'trunk', front: -1.87 },
      zarometi: { x: 2.27, y0: 0.46, lean: 0, zc: 0.475, yc: 0.46, s: 0.32, hosts: ['headL', 'headR'], shape: PAIR, bulge: 0.012, ringW: 0.004 },
      platisca: {},
      // (sklop 2, js/deli/spredaj.js) the kit round the nose and the tail (in place of the splitter: the second and the fourth keep it;
      // the skirts between the arches; the rear pieces 3 cm under the valance: the four pipes stand over them, the diffuser between the
      // inner two), the bonnet's top from the cowl to the nose's fall (in place of the power bulge: the fifth and the sixth a bulge of
      // their own as long; the top's cells three times as many, it bends at the bonnet's knees), the grille's face in the oval mouth (in
      // place of its two bars), the indicators in place of the stock ones (on the bumper over the brake ducts; the nose's amber side
      // markers go with them), low on the front wings ahead of the doors (under the decals), on the valance's top and the mirrors; the
      // rally lamps on the bumper in front of the mouth, in front of the nose's lamps (their tube under them, its short feet on the mouth's
      // face over the tow eye), in the mouth, at the roof's front edge, a pod on the nose over its lamps
      aero: { xf: 2.27, xr: -2.28, w: 0.7, yf: 0.2, yr: 0.22, sill: [-0.9, 0.95], ws: 0.905, ys: 0.17, lipF: [2.17, 0.12, 0.2, 0.085, 1.38], exh: [0.4, 0.048] },
      hauba: { x0: 0.2, x1: 1.78, w: 0.7, bulge: 1.2, cells: 3 },
      maska: { x: 2.273, y0: 0.3, lean: 0, yc: 0.3, w: 0.84, h: 0.17, part: 'bumperF' },
      zmigavci: { front: { x: 2.273, y: 0.355, z: 0.61, w: 0.1, h: 0.025, part: 'bumperF' }, side: { x: 0.44, y: 0.56, z: 0.934, host: 'body' },
        rear: { x: -2.281, y: 0.46, z: 0.52, part: 'bumperR' }, mirror: { x: 0.0455, y: 0.908, z: 0.985, w: 0.11, parts: ['mirrorL', 'mirrorR'] } },
      relijske_luci: { bumper: [2.27, 0.3, 0.3], nose: [2.257, 0.49], intake: [2.273, 0.3, 0.9, 0.19], roof: [-0.56, 0.6], pod: [2.25, 0.51, 0.75, 0.62], foot: 0.34, part: 'bumperF' },

      // (js/deli/zadaj.js) the tail lamps in the place of the quad round ones (each side's pair in one room across both rings: its design
      // turned on its side, the round options two side by side as the stock), a bar across the tail between them (in the body); the
      // exhaust between the stock pipes' places (the quad option on them), its flap valves; the boot lid's top on the short deck between
      // the wing and the glass (no window: the fastback's glass is long and bent); the tow points on the faces (in front on the mouth's
      // corner, clear of the grille, the ducts and the lips' top; behind on the valance between the pipes); the mudflaps behind the
      // wheels in the wings' and the quarters' parts, the sills' guards between the arches
      zadnje_luci: { x: -2.262, zc: 0.5775, yc: 0.78, w: 0.14, h: 0.3, s: 1.33, shape: [[-0.205, -0.085], [-0.205, 0.085], [0.205, 0.085], [0.205, -0.085]], hosts: ['tailL', 'tailR'],
        bar: { x: -2.279, y: 0.78, w: 0.36, part: 'body' } },
      auspuh: { x: -2.31, y: 0.31, z: 0.465, r: 0.045, len: 0.2, part: 'body', valve: true },
      prtljaznik: { x: [-2.02, -1.8], w: 0.7, part: 'trunk' },
      vlecne_kljuke: { f: [2.273, 0.32, -0.47], r: [-2.282, 0.33, 0.2] },
      lovilci_blata: { x: [1.045, -1.655], z: [0.68, 0.93], y: [0.37, 0.07], sill: [-0.86, 0.94, 0.18, 0.89], part: 'body', parts: ['fenderL', 'fenderR', 'quarterL', 'quarterR'] },

      // (js/deli/streha.js) no sunroof and no roof scoop: the roof is short (0.56 m between the windscreen and the fastback's glass; the
      // windows are up to 0.6 m long, the sliding ones slide back onto the glass, the longest scoops are a metre long); the aerials on
      // the roof (the rod by its right edge, the fins and the pucks on its middle, ahead of the louvres' blade; the stub and the whip
      // behind the rally lamps' bar), the louvres on the fastback's glass (its lower part, short of the roof's edge: their blade clear of
      // the whips), in the tailgate's part
      antena: { x: -0.98, z: 0.6, fin: [-1.04, 0], front: [-0.66, 0.5], whip: -0.62 },
      zaluzije: { x0: -1.76, y0: 0.9985, x1: -1.2, y1: 1.2266, w: 0.57, part: 'trunk' },

      // (js/deli/bok.js) the mirrors (the stock one's housing; the garage's 4 cm on, on a foot on the black sail), the doors (inside
      // their shut lines, the sill to the belt's front end; the handle; the glass from the B-pillar to the sail and the A-pillar, its
      // frame), the brakes, the wheel nuts (five: the rims' five spokes)
      ogledala: { x: 0.0, y: 0.93, z: 0.985, w: 0.09, h: 0.07, d: 0.13, fwd: 0.04, up: 0.01, sail: [[0.13, 0], [-0.03, 0], [0.13, 0.55]] },
      vrata: { x: [-0.85, 0.13], y: [0.33, 0.81], handle: [-0.71, 0.7975, 0.937, 0.14, 0.025], win: [[-0.07, 0.04], [0.12, 0.58], [-0.52, 0.86], [-0.808, 0.92], [-0.808, 0.04]],
        frame: [-0.84, -0.81, 0.9, 0.97] },
      zavore: { s: 1 },
      matice: { k: 5, r: 0.2 },

      // (sklop 3 · barve, js/deli/barve.js) the stripes over the short deck, the roof and the long bonnet (to the nose's lamp covers),
      // the outboard ones beside the power bulge; the decals over the band under the belt (the doors, the front wings between the doors
      // and the vents, the rear quarters behind the arches' flares), on the bonnet each side of the bulge, on the roof; the sun strip
      // across the windscreen's top; the calipers; the fuel cap on the right rear quarter over the arch's flare (stock: none)
      barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {},
      crte: { z: [0.29, 0.47], x: [[-2.26, -1.8], [-1.08, -0.52], [0.16, 2.12]] },
      nalepke: { side: [[-0.82, 0.1], [0.18, 0.62], [-2.0, -1.45]], y: [0.6, 0.78], hood: { x: [1.1, 1.78], z: [0.31, 0.6] }, roof: { x: [-1.04, -0.6] } },
      soncni_pas: { x: [-0.52, -0.41] }, zamasek: { x: -1.02, y: 0.78, z: 0.949, r: 0.045 },
      celjusti: { r: [0.075, 0.14], a: [70, 125] },
      // (sklop 3 · skriti deli, js/deli/skriti.js: the bay has no floor, so each stands on the V12: the filter on the block's left
      // bank, its duct to the front; the turbo on the block's front over the cam cover; the ECU on the block's right bank; the battery
      // in the boot, on the luggage floor behind the axle (stock in a front-engined grand tourer))
      filter_zraka: { x: 0.95, y: 0.593, z: -0.22 }, akumulator: { x: -1.85, y: 0.442, z: 0.42 }, turbo: { x: 1.25, y: 0.593, z: 0.1 }, cip: { x: 0.8, y: 0.593, z: 0.2 },
      vzmeti: { in: 0.17, top: 0.72 }, amortizerji: { in: 0.17, top: 0.72 }, stabilizatorji: { in: 0.17, floor: 0.27 }, dim_gum: {},
    },
    // the look (KIT API v1, render.js; look units = metres): one loft from the cut-off tail to the nose: the fastback's glass and the deck
    // are one tailgate (the trunk, taken out to the roof's rear edge), the bonnet a clamshell between the wings with the power bulge on it
    // (a skin of its own, the scoop at its front); the doors long and far back, the side glass running back into the sails; the details
    // on top: the vents behind the front wheels, the swept lamps, the low oval mouth, the quad round tail lamps over a black valance and
    // its four pipes; the bulge's top in the stripe's colour (the livery: the paint when the car has no stripe)
    look: {
      body: { roofY: 1.3,
        //       x      w      yb    ybelt  wt     yt     cr     kind  tuck
        secs: [[-2.28, 0.83, 0.25, 0.7, 0.77, 0.915, 0.012, 'b', 0.1],      // the cut-off tail: the lamps' face
          [-2.22, 0.9, 0.22, 0.745, 0.83, 0.965, 0.016, 'b', 0.12],         // the lip over it
          [-2.02, 0.945, 0.2, 0.775, 0.85, 0.94, 0.02, 'b', 0.14],          // the short deck
          [-1.8, 0.965, 0.19, 0.8, 0.835, 0.965, 0.022, 'gr', 0.15],        // the fastback's glass from here
          [-1.36, 0.97, 0.17, 0.84, 0.76, 1.13, 0.028, 'gr', 0.16],         // the hips at their widest, over the rear axle
          [-1.08, 0.95, 0.17, 0.855, 0.695, 1.252, 0.033, 'r', 0.16],       // the roof's rear edge
          [-0.7, 0.93, 0.17, 0.86, 0.66, 1.267, 0.033, 'r', 0.16],          // the roof's top
          [-0.52, 0.925, 0.17, 0.855, 0.65, 1.264, 0.033, 'gf', 0.16],      // the windscreen's top
          [0.16, 0.925, 0.17, 0.81, 0.83, 0.915, 0.03, 'b', 0.16],          // its base: the cowl
          [0.95, 0.945, 0.17, 0.76, 0.865, 0.87, 0.04, 'b', 0.16],          // the long bonnet: behind the front wheel (the vents)
          [1.42, 0.95, 0.17, 0.73, 0.865, 0.83, 0.04, 'b', 0.15],           // over the front axle
          [1.86, 0.93, 0.16, 0.65, 0.84, 0.765, 0.035, 'b', 0.13],
          [2.12, 0.87, 0.16, 0.555, 0.76, 0.68, 0.025, 'b', 0.12],          // the lamps on the wings' tips
          [2.24, 0.78, 0.17, 0.475, 0.66, 0.585, 0.015, 'b', 0.11],
          [2.27, 0.7, 0.2, 0.425, 0.58, 0.5, 0.01, 'b', 0.09]],             // the nose: the mouth's face
        eye: { x: -0.98, y: 1.06 },
        wz: 0.155,                                                          // (the wide rear tyres inside the hips)
        door: [0.14, -0.86], bumpY: [0.4, 0.52],
        crush: { x0: -1.35, x1: -0.3, z: 0.7 },                             // (the roof between the fastback's middle and the windscreen)
      },
      hi: true,   // (Nastavitve · Detajli avtov: Visoki: the small details at the end of build, the driver, the tyres in 64)
      budget: { inner: 1400 }, budgetHi: { inner: 1750 },   // (its cabin, as KOLIBRI's: the inner block over a car's 800 / 1200; drawn only once a door opens, a pane breaks or a part is off)
      wheels: { style: 'std', spokes: 5, w: 0.25, wR: 0.29, rimK: 0.7, rim: [0.7, 0.71, 0.74], cap: [0.16, 0.16, 0.17], gap: 0.045, seg: 32, segHi: 64 },
      // the fastback's glass and the deck are the tailgate (the trunk out to the roof's rear edge; its top only: the sails stay with the
      // quarters); the bonnet ends where the bumper starts: the nose's top in front of it is the body's (a fixed header with the lamps and
      // their covers: the bonnet's piece lies flat, without the nose's downturned tip)
      regions: (std) => { const xb = std.find(r => r.part === 'bumperF').x[0];
        return std.map(r => r.part === 'trunk' ? Object.assign({}, r, { x: [r.x[0], -1.08], bands: ['edge', 'crown'] })
          : r.part === 'hood' ? Object.assign({}, r, { x: [r.x[0], xb] }) : r); },
      build(K) {
        const P = K.paint, B = K.black, G = K.GLASS, D = [0.09, 0.09, 0.1], CH = K.chrome, SILL = K.shade(P, 0.6), AMB = K.rgb(0xff9a1e), LC = [0.74, 0.77, 0.82];
        // ---- the shell: the paint; the windscreen and the side glass (forward to the A-pillar, back into the sail: the quarter window), the
        //      fastback's glass; the sills a darker shade, black in the arches ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (at.end) return P;
          if (e === 0 || e === 8) return at.arch ? B : SILL;
          if (kind === 'gf') return e >= 2 && e <= 6 ? G : P;
          if (kind === 'r') return e === 2 || e === 6 ? G : P;
          if (kind === 'gr') return (e >= 3 && e <= 5) || ((e === 2 || e === 6) && at.x > -1.33) ? G : P;
          return P;
        }, { caps: { front: { col: P }, rear: { col: P, high: 'body' } } });
        const D2 = L.decal;
        // ---- the glasshouse: the A-pillars in the paint, a black frame under the roof's edge, the B-pillar black (one run of glass), the
        //      quarter window's rear edge slanting into the sail, the mirror's black sail at the window's front corner, a chrome belt line ----
        D2.band([[-0.52, 0.86], [0.16, 0.6], [0.16, 1], [-0.52, 1]], P, null, 0.01);
        D2.band([[-1.12, 0.93], [-0.52, 0.93], [-0.52, 1], [-1.12, 1]], B, null, 0.008);
        D2.band([[-0.89, 0], [-0.83, 0], [-0.83, 1], [-0.89, 1]], B, null, 0.01);
        D2.band([[-1.36, 0], [-1.3, 0], [-1.1, 1], [-1.36, 1]], P, null, 0.01);
        D2.band([[-0.06, 0], [0.16, 0], [0.16, 0.62]], B, null, 0.009);
        D2.band([[-1.3, 0], [0.14, 0], [0.14, 0.04], [-1.3, 0.04]], CH, null, 0.008);
        // the fastback's glass framed in the paint (narrower than the deck)
        for (const sd of [-1, 1]) D2.top([[-1.8, sd * 0.83], [-1.08, sd * 0.695], [-1.08, sd * 0.57], [-1.8, sd * 0.67]], P, 0.008);
        // ---- the sides: the vents behind the front wheels (a black gill, two fins over it), the doors' shut lines and handles ----
        D2.side([[0.66, 0.44], [0.98, 0.44], [1.06, 0.62], [0.74, 0.62]], B, null, 0.006);
        for (const y of [0.5, 0.56]) { const s = (y - 0.44) * 0.444; D2.side([[0.66 + s, y - 0.01], [0.98 + s, y - 0.01], [0.98 + s + 0.009, y + 0.01], [0.66 + s + 0.009, y + 0.01]], P, null, 0.011); }
        for (const x of [0.14, -0.86]) D2.side([[x - 0.006, 0.32], [x + 0.006, 0.32], [x + 0.006, 0.84], [x - 0.006, 0.84]], K.shade(P, 0.45), null, 0.004);
        K.deli('vrata', () => D2.side([[-0.78, 0.785], [-0.64, 0.785], [-0.64, 0.81], [-0.78, 0.81]], B, null, 0.006));   // (the garage's doors in their place: mounts.vrata, their own handles)
        const zm = K.fitted && K.fitted.zmigavci;   // (the garage's indicators: the stock ones go, the nose's side markers with them)
        if (!zm) D2.side([[1.98, 0.42], [2.08, 0.42], [2.08, 0.445], [1.98, 0.445]], AMB, null, 0.006);     // (the side markers: amber in the nose,
        D2.side([[-2.08, 0.6], [-1.98, 0.6], [-1.98, 0.625], [-2.08, 0.625]], [0.6, 0.06, 0.05], null, 0.006);   //  red in the tail)
        for (const id of ['crte', 'nalepke', 'celjusti', 'zamasek']) K.deli(id, () => {});   // (stock: none; the garage's over the paint, the fuel cap)
        K.deli('soncni_pas', () => {});   // (stock: none; the garage's across the windscreen's top)
        // the hips: a lip round each rear arch, proud of the flank (they leave with the quarters)
        for (const sd of [-1, 1]) K.flare(K.rx, 0.375, 0.445, sd * 0.955, sd * 0.99, P, { n: 6, a0: 0.12, a1: Math.PI - 0.2 });
        // ---- the power bulge down the bonnet's middle (a skin on the crown), its scoop's mouth at the front ----
        //      (the garage's bonnet top in its place: mounts.hauba)
        K.part('hood', () => K.deli('hauba', () => {
          const rows = [[0.3, 0.022, 0.27, 0.2], [0.95, 0.048, 0.27, 0.19], [1.42, 0.048, 0.26, 0.18], [1.88, 0.032, 0.2, 0.135]];
          const rings = rows.map(([x, h, wb, wt]) => { const y = L.topY(x, 0); return [[x, y - 0.012, -wb], [x, y + h, -wt], [x, y + h, wt], [x, y - 0.012, wb]]; });
          K.skin(rings, (k, e) => e === 1 ? K.strp : P, P, B);              // (its top in the stripe's colour: the livery)
          K.rect(1.885, L.topY(1.88, 0) + 0.014, 0, 0.25, 0.024, D, { dir: 'x' });   // (the scoop's mesh)
        }));
        // ---- the nose: the wide oval mouth (the bumper's: an octagon, two bars across it), the indicators, the brake ducts, the splitter;
        //      the lamps in the wings' tips (two round lenses a side), their covers swept back over the wings; the wipers ----
        K.part('bumperF', () => {
          const oct = [[-1, -0.55], [-0.82, -1], [0.82, -1], [1, -0.55], [1, 0.55], [0.82, 1], [-0.82, 1], [-1, 0.55]];
          K.face(oct.map(([u, v]) => [2.273, 0.3 + v * 0.095, -u * 0.52]), B);
          K.deli('maska', () => { for (const y of [0.272, 0.328]) K.rect(2.276, y, 0, 0.96, 0.014, [0.24, 0.24, 0.26]); });   // (the garage's grille in the mouth: mounts.maska)
          K.deli('aero', () => K.box(2.17, 0.12, 0, 0.2, 0.035, 1.38, 0, B));   // the splitter (the garage's kit in its place: mounts.aero)
          for (const sd of [-1, 1]) { K.rect(2.273, 0.27, sd * 0.61, 0.1, 0.08, B); if (!zm) K.rect(2.273, 0.355, sd * 0.61, 0.1, 0.025, AMB); }   // (the brake ducts, the indicators)
          K.rect(2.273, 0.4, 0, 1.36, 0.008, K.shade(P, 0.45));                // (its shut line under the lamps)
          K.deli('relijske_luci', () => {});   // (stock: none; the garage's on the bumper, the nose, the mouth, the roof: mounts.relijske_luci)
        }, { hinge: [[2.2, 0.2, -0.7], [2.2, 0.2, 0.7]] });
        K.deli('zmigavci', () => {});   // (the stock ones above; the garage's on the bumper over the ducts, the wings, the valance, the mirrors)
        for (const sd of [-1, 1]) {   // (the body's: the covers lie on the nose's top, ahead of the bonnet's edge; the lenses in its face)
          D2.top([[2.268, sd * 0.37], [2.268, sd * 0.575], [2.13, sd * 0.745], [2.13, sd * 0.52]], LC, 0.006, { host: 'body' });
        }
        // (each side's pair a part of its own: headL, headR; the garage's lamp in their place: K.deli, mounts.zarometi)
        K.deli('zarometi', () => { for (const sd of [-1, 1]) for (const z of [0.425, 0.525]) K.headLamp(2.276, 0.462, sd * z, 0.035, { ring: D, n: 8, host: sd < 0 ? 'headL' : 'headR' }); });
        const onTop = (x, z) => [x, L.topY(x, z) + 0.012, z];
        for (const z of [-0.33, 0.27]) K.bar(onTop(0.11, z - 0.27), onTop(0.07, z + 0.27), 0.008, B, { n: 4, part: 'wiperFront' });   // (the wipers on the glass's foot)
        // ---- the tail: the quad round lamps in silver rings (the lit lenses are the tail mesh), the plate; the bumper's black valance
        //      low down, four pipes in chrome rings out of it ----
        K.deli('zadnje_luci', () => { for (const sd of [-1, 1]) for (const z of [0.475, 0.68]) { const tp = sd < 0 ? 'tailL' : 'tailR';   // (each side's pair a part of its own, its rings with it;
          K.discX(-2.283, 0.78, sd * z, 0.088, 10, [0.5, 0.51, 0.54], -1, { host: tp }); K.tailLamp(-2.284, 0.78, sd * z, 0.146, 0.146, { round: true, host: tp }); } });   //  the garage's in their place: mounts.zadnje_luci)
        K.box(-2.279, 0.54, 0, 0.006, 0.09, 0.46, 0, [0.93, 0.93, 0.9], null, true, { part: 'plate' });   // (the plate: a thin plate, a part of its own)
        K.part('trunk', () => { K.deli('krilo', () => {}); K.deli('prtljaznik', () => {}); K.deli('zaluzije', () => {}); });   // (the garage's wing and lid on the deck, the louvres on the glass: none stock)
        K.part('bumperR', () => {
          K.rect(-2.282, 0.33, 0, 1.4, 0.15, B, { dir: '-x' });                // the black valance the pipes come out of
          K.rect(-2.2815, 0.52, 0, 1.62, 0.008, K.shade(P, 0.45), { dir: '-x' });   // (its shut line)
        }, { hinge: [[-2.2, 0.45, -0.7], [-2.2, 0.45, 0.7]] });
        K.deli('vlecne_kljuke', () => {});   // (stock: none; the garage's on the mouth's corner and the valance)
        K.deli('auspuh', () => { for (const sd of [-1, 1]) for (const z of [0.4, 0.53]) { K.exhaust(-2.31, 0.31, sd * z, 0.036, 0.2, { part: 'body' }); K.discX(-2.306, 0.31, sd * z, 0.048, 8, CH, -1, { part: 'body' }); } });   // (the garage's in their place: mounts.auspuh)
        K.deli('lovilci_blata', () => {});   // (stock: none; the garage's behind the wheels, the sills' guards)
        // the dashboard's far wall under the windscreen's foot, in the outer shell (the glass hides it from outside), facing the driver: the
        // cockpit's own dashboard stops well short of a windscreen this far ahead (no looking down into the bonnet's hollow at the wheels)
        K.face([[0.15, 0.7, -0.85], [0.15, 0.7, 0.85], [0.15, 0.82, 0.86], [0.15, 0.92, 0.62], [0.15, 0.92, -0.62], [0.15, 0.82, -0.86]], [0.13, 0.13, 0.14], { part: 'body' });
        // ---- the mirrors on the doors' front corners ----
        K.deli('ogledala', () => { for (const sd of [-1, 1]) K.mirror(0.0, 0.93, sd * 0.985, { w: 0.09, h: 0.07, d: 0.13, crack: 1 }); });   // (the garage's in their place: mounts.ogledala)
        K.part('body', () => K.deli('antena', () => {}));   // (stock: none; the garage's on the roof)
        // ---- the hinges: the bonnet at the cowl, the tailgate at the roof's edge, the doors at their front edges ----
        K.hinge('hood', [0.18, 0.94, -0.7], [0.18, 0.94, 0.7]);
        K.hinge('trunk', [-1.08, 1.26, -0.6], [-1.08, 1.26, 0.6]);
        K.hinge('doorL', [0.12, 0.4, -0.92], [0.12, 0.82, -0.92]); K.hinge('doorR', [0.12, 0.4, 0.92], [0.12, 0.82, 0.92]);
        // ---- Visoki: the badges (the nose's header between the lamps, the tail's face between the lamps), the plate's frame and bolts, the
        //      head lamps' bulb caps, the jacking points' arrows on the sills, the tow point's arrow on the valance; the driver, far back ----
        if (K.hi) {
          const C = K.cab, F = K.fitted, RED = [0.75, 0.1, 0.08], XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;   // (F: a garage part in a detail's place: none of it there)
          if (!F.maska && !F.relijske_luci) C.badge(2.2708, 0.45, 0, 1, 'body', 0.026);
          if (!F.zadnje_luci) C.badge(-2.2808, 0.78, 0, -1, 'body', 0.03);
          C.plate(-2.282, 0.585, 0, 0.46, 0.09, -1, 'plate');
          for (const s of [-1, 1]) {
            if (!F.zarometi) for (const z of [0.425, 0.525]) K.discX(2.2812, 0.462, s * z, 0.012, 6, CH, 1, { host: s < 0 ? 'headL' : 'headR' });   // (the bulbs' caps)
            if (!F.aero) for (const x of [XB - 0.23, XA + 0.23]) D2.side([[x - 0.03, 0.225], [x + 0.03, 0.225], [x, 0.275]], [0.6, 0.61, 0.64], [s], 0.008);   // (the jacking points)
          }
          if (!F.vlecne_kljuke) C.face([[-2.2835, 0.39, 0.18], [-2.2835, 0.39, 0.22], [-2.2835, 0.365, 0.2]], RED, [-1, 0, 0], { host: 'bumperR' });   // (over the tow point, facing back)
          K.driver(-1.04, 1.03, -0.36, { inner: true, r: 0.12, lean: 0.3, hands: [-0.52, 0.81, 0.16], knee: [-0.42, 0.5, 0.17], feet: [0.02, 0.28, 0.11], suit: [0.14, 0.16, 0.2], helmet: [0.93, 0.93, 0.9] });
        }
        // ---- inside (seen once a part is off), KOLIBRI's cab: the carpet, the toe board under the far wall, the road dashboard with its
        //      binnacle, the wheel, the tan hide seats low and far back, the console, the pedals, the door cards; the tunnel; the V12 behind
        //      the front axle with its two plenums, the inner wings over the front wheels, the radiator in the nose ----
        { const C = K.cab, SZ = -0.36, TAN = [0.5, 0.32, 0.19], TAN2 = [0.36, 0.22, 0.13], CP = [0.13, 0.11, 0.1], DK = [0.13, 0.12, 0.12];
          C.face([[-0.92, 0.205, -0.86], [0.12, 0.205, -0.86], [0.12, 0.205, 0.86], [-0.92, 0.205, 0.86]], CP, [0, 1, 0]);   // (the carpet)
          C.face([[-1.33, 0.205, -0.6], [-0.92, 0.205, -0.6], [-0.92, 0.205, 0.6], [-1.33, 0.205, 0.6]], CP, [0, 1, 0]);   // (between the rear wells)
          C.face([[-1.33, 0.205, -0.6], [-1.33, 0.205, 0.6], [-1.33, 0.44, 0.6], [-1.33, 0.44, -0.6]], CP, [1, 0, 0]);   // (up to the luggage floor)
          C.face([[0.15, 0.2, -0.8], [0.15, 0.2, 0.8], [0.15, 0.7, 0.8], [0.15, 0.7, -0.8]], CP, [-1, 0, 0]);   // (the toe board, under the far wall)
          C.dash({ x: -0.22, y: 0.88, d: 0.36, w: 0.8, dz: SZ, style: 'road', col: DK, col2: TAN });
          C.steer({ c: [-0.5, 0.8, SZ], ax: [0.9, -0.436], r: 0.17, rr: 0.017, to: [-0.2, 0.655, SZ] });
          for (const sd of [-1, 1]) C.seat(-0.85, 0.21, sd * 0.36, { w: 0.44, top: 0.7, lean: 0.3, belt: 'road', col: TAN, col2: TAN2 });
          C.console(-0.3, 0.44, { l: 0.36 });
          C.pedals(0.08, 0.24, SZ, 3);
          for (const sd of [-1, 1]) C.door(sd, { x: [-0.8, 0.08], y: [0.38, 0.8], z: 0.9, col: DK, insert: TAN });
        }
        K.box(-0.55, 0.2, 0, 1.2, 0.24, 0.24, 0, D, null, false, { inner: true, part: 'body' });
        K.engine(0.98, 0.26, 0, { l: 0.92, w: 0.62, h: 0.46 });
        for (const sd of [-1, 1]) {
          K.cyl([0.58, 0.7, sd * 0.15], [1.38, 0.7, sd * 0.15], 0.05, [0.62, 0.63, 0.66], { n: 6, inner: true, part: 'body' });
          K.box(1.42, 0.715, sd * 0.76, 0.8, 0.04, 0.3, 0, D, null, false, { inner: true, part: 'body' });
        }
        K.box(2.0, 0.22, 0, 0.06, 0.34, 1.1, 0, D, null, false, { inner: true, part: 'body' });
        K.box(-1.75, 0.38, 0, 0.8, 0.06, 1.3, 0, D, null, false, { inner: true, part: 'body' });   // (the luggage floor under the tailgate, over the axle)
        for (const id of ['filter_zraka', 'akumulator', 'turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum']) K.deli(id, () => {});   // (stock: none; the garage's on the V12, the inner wing, in the boot, the wheels)
      },
    },
  });
})();
