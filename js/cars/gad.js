/* Vehicle 'gad' — GAD 7L: a 1960s V8 roadster. Signature features: 1) bulging flared wheel arches front and rear, 2) side exhaust pipes
   along the sills, 3) a roll bar behind the seats, 4) an oval mouth with a bar across it, 5) twin racing stripes over the bonnet and the
   tail. L 3.96 W 1.73 H 1.22, wheelbase 2.29, overhangs F 0.78 R 0.89 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  // the garage's head lamp in the place of the round lamp in each hump's end (its lens and the chrome ring round it; u out from the car's
  // middle, v up; metres round z 0.54, y 0.645): every option takes this outline
  const ROUND = Array.from({ length: 12 }, (_, i) => [0.095 * Math.cos(i * Math.PI / 6), 0.095 * Math.sin(i * Math.PI / 6)]);
  VEHICLE_DEFS.push({
    id: 'gad', name: 'GAD 7L', cat: 'klasika', ord: 2, drive: 'FR',
    desc: 'Ameriški roadster iz 60-ih z velikim V8, stranskimi izpuhi in razširjenimi blatniki.',
    phys: { mass: 1100, a: 1.2, b: 1.09, kI: 1.12, kw: 300, redline: 6500, idle: 750, gears: [2.5, 1.75, 1.3, 1], final: 3.31, rw: 0.33, cDrag: 0.5, len: 3.96, wid: 1.73, steerMax: 0.62,
      tracK: 0.95, brakeK: 0.9, spinK: 1, aiGap: 7.5, aiPass: 4 },   // (aiGap / aiPass: its AI follows further back and passes wider: fewer pile-ups on the Nordschleife, tests/fleet.test.js 8b)
    arc: { amax: 1.58, kv: 1.9, rmin: 4.4 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.16, pwr: 0.14, out: 1.4, turn: 1.02, w: 0.97, tv: 1.1 },   // (the FR layer: lift-off and power rotation; its own liftP, pwr, out, turn, w, tv)
    stats: { power: 8, grip: 4, weight: 8, drift: 10 },
    price: 55000, pk: 'ppo', field: ['gad'],
    snd: { kind: 'v8', hz: 0.9, loud: 1.2 },
    expect: { t100: [3.5, 4.11], vmax: [224, 238], latG: [2.02, 2.12], d100: [24.8, 27.4] },
    partNames: { pipeL: 'left side pipe', pipeR: 'right side pipe', headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamps', tailR: 'right tail lamps',
      plate: 'number plate', wiperFront: 'windscreen wipers' },
    parts: { set: 'open', ht: 1.22, y0: 0.18,
      extra: {
        pipeL: { z: 2, th: 0.6, m: 3, r: 0.35, h: 0.1, lx: 0.05, lz: -0.94, f: 0.06 },   // (the pipes as the look has them: along the sills, x -0.56..0.72)
        pipeR: { z: 3, th: 0.6, m: 3, r: 0.35, h: 0.1, lx: 0.05, lz: 0.94, f: 0.06 },
        // (as KOLIBRI's: the round lamps in the humps' ends parts of their own, mounted on the fenders (they go with them); a hit on their
        // corner knocks one out. The round tail lamps, two a side, likewise; the number plate on the tail, the wipers at the windscreen's foot)
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.12, h: 0.06, lx: 0.95, lz: -0.62, f: 0.45, on: 'fenderL' },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.12, h: 0.06, lx: 0.95, lz: 0.62, f: 0.45, on: 'fenderR' },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.15, h: 0.05, lx: -1.0, lz: -0.48, f: 0.37 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.15, h: 0.05, lx: -1.0, lz: 0.48, f: 0.37 },
        plate: { z: 1, th: 0.4, m: 1, r: 0.17, h: 0.02, lx: -1.0, lz: 0, f: 0.31 },
        wiperFront: { z: 0, th: 0.65, m: 0.5, r: 0.4, h: 0.03, lx: 0.13, lz: -0.09, f: 0.65 },
      },
      // (where the look has them: the mirrors on the windscreen's posts, the boot lid between the hips)
      over: { mirrorL: { lx: 0.075, lz: -0.77, y: 0.99 }, mirrorR: { lx: 0.075, lz: 0.77, y: 0.99 }, trunk: { lx: -0.82 }, fenderL: { h: 0.14 }, fenderR: { h: 0.14 } },   // (the fenders with the humps lie as thick as they are)
    },
    // where the garage's parts go (js/deli.js, look units): the wing on the boot lid's rear edge, in the boot lid (it opens and goes with
    // it); the head lamps in the place of the round lamps in the humps' ends (every option in their outline, ROUND), in the lamps' parts
    // (the dark socket with them); the rims. 34 of the 38 (docs/deli.md, Klasika): no sunroof, roof scoop or louvres (an open car without
    // a rear window), no exhaust (its pipes along the sills are its own, none at the tail)
    mounts: {
      krilo: { x: -1.83, w: 0.6, part: 'trunk' },
      zarometi: { x: 1.883, y0: 0.645, lean: 0, zc: 0.54, yc: 0.645, s: 0.35, hosts: ['headL', 'headR'], socket: 'host', shape: ROUND, bulge: 0, ringW: 0.008 },
      platisca: {},
      // (sklop 2 · spredaj, js/deli/spredaj.js) the kit without skirts (the side pipes along the sills: no sill), its flares on the humps;
      // the bonnet between the windscreen and the nose's drop; the grille in the oval mouth (the bar across it its stock); the indicators
      // on the humps' ends under the lamps (in the fenders), the repeaters ahead of the doors, the rear ones under the bumperettes, the
      // mirrors' fronts; the extra lamps in front of the mouth (the four's bar in the nose's face, its feet short: clear of the kit's
      // canards), the roof bar on the windscreen's header
      aero: { xf: 1.98, xr: -1.98, w: 0.47, yf: 0.255, yr: 0.25, ws: 0.835 },
      hauba: { x0: 0.32, x1: 1.6, w: 0.6, rel: true },
      maska: { x: 1.983, y0: 0.415, lean: 0, yc: 0.415, w: 0.5, h: 0.17 },
      zmigavci: { front: { x: 1.876, y: 0.5, z: 0.625, w: 0.06, h: 0.035, parts: ['fenderL', 'fenderR'] }, side: { x: 0.5, y: 0.6, z: 0.824, host: 'body' },
        rear: { x: -1.981, y: 0.32, z: 0.42, part: 'bumperR' }, mirror: { x: 0.1605, y: 0.985, z: 0.675, w: 0.06, parts: ['mirrorL', 'mirrorR'] } },
      relijske_luci: { bumper: [1.98, 0.4, 0.33], nose: [1.925, 0.45], intake: [1.983, 0.36, 0.74, 0.1], roof: [0.025, 0.5, 1.226], pod: [1.98, 0.29, 0.54, 0.45], foot: 0.33, part: 'bumperF' },
      // (js/deli/zadaj.js) the tail lamps' room where the two round lamps a side are (wide: the design's top out to the corner, as
      // RAKETA's), the band across the tail over the plate; the boot lid between the hips; the tow points beside the mouth (high: a strap
      // hangs on the bumper's face, over a lip; none behind rally lamps) and over the tail's foot (between a diffuser's fins); the flaps
      // behind the wheels (no sills' guards: the pipes)
      zadnje_luci: { x: -1.964, zc: 0.415, yc: 0.56, w: 0.14, h: 0.3, s: 0.75, shape: [[-0.107, 0.045], [-0.107, -0.045], [0.107, -0.045], [0.107, 0.045]], hosts: ['tailL', 'tailR'],
        bar: { x: -1.982, y: 0.58, w: 0.29, h: 0.03, part: 'body' } },
      prtljaznik: { x: [-1.88, -1.13], w: 0.55, part: 'trunk' },
      vlecne_kljuke: { f: [1.98, 0.42, 0.44], r: [-1.98, 0.3, 0.2], behindLamps: true },
      lovilci_blata: { x: [0.8, -1.49], z: [0.62, 0.83], y: [0.33, 0.09], part: 'body' },
      // (js/deli/streha.js) the aerials on the boot lid (the rod and the fin mid-lid ahead of a wing, the stub at its front edge, the
      // whip's foot on the roll bar's deck ahead of it: its tip short of a wing; the stub and the whip on the right hip, clear of a lid's
      // ducktail)
      antena: { x: -1.35, z: 0.6, fin: [-1.45, 0], front: [-1.18, 0.6], whip: -1.0, part: 'trunk' },
      // (js/deli/bok.js) the stock mirrors on the windscreen's posts, the doors inside their shut lines (their tops at the belt: no glass)
      ogledala: { x: 0.14, y: 1.0, z: 0.675, w: 0.04, h: 0.05, d: 0.08, z0: 0.63 },
      vrata: { x: [-0.55, 0.23], y: [0.31, 0.66], handle: [-0.45, 0.62, 0.812, 0.12, 0.025], win: null },
      zavore: { s: 1 },
      matice: { k: 4, r: 0.2 },
      // (sklop 3 · barve, js/deli/barve.js) the stripes over the bonnet and the tail (not over the open cockpit: the stock twin stripes
      // give way to them), the decals on the doors (up to the cockpit's front, where the loft has a section: flames in one piece) and the
      // fenders ahead of them, on the bonnet and the boot lid; the sun strip on the windscreen's own pane (as wide as the glass in its
      // frame); the fuel cap behind the right rear wheel; the calipers
      barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {},
      crte: { z: [0.3, 0.5], x: [[-1.97, -0.72], [0.27, 1.97]] },
      nalepke: { side: [[-0.53, 0.12], [0.29, 0.62]], y: [0.36, 0.64], hood: { x: [1.2, 1.55], z: [0.22, 0.52] }, roof: { x: [-1.7, -1.15] } },
      soncni_pas: { x: [0.035, 0.1], w: 0.6, pane: [[0.028, 1.205, 0.3], [0.028, 1.205, 0.6], [0.258, 0.835, 0.32], [0.258, 0.835, 0.64]], part: 'body' },
      zamasek: { x: -1.62, y: 0.56, z: 0.849, r: 0.04 },
      celjusti: { r: [0.092, 0.171], a: [70, 125] },
      // (sklop 3 · skriti deli, js/deli/skriti.js) the V8's bay: the filter against the block's side (its duct to its top), the battery on
      // the floor beside it, the turbo against its front, the control box on its top behind the air cleaner; the struts and bars at the wheels
      filter_zraka: { x: 0.82, y: 0.5, z: -0.37 }, akumulator: { x: 1.0, y: 0.21, z: 0.42 }, turbo: { x: 1.22, y: 0.35, z: 0.18 }, cip: { x: 0.62, y: 0.68, z: 0.15 },
      vzmeti: { in: 0.13, top: 0.76 }, amortizerji: { in: 0.13, top: 0.72 }, stabilizatorji: { in: 0.13, floor: 0.21 }, dim_gum: {},
    },
    // the look (KIT API v1, render.js; look units = metres): one loft, the cockpit an open top (its 'r' segments without a top: the lining,
    // the floor and the bulkheads in the outer shell), the fenders bulging over the wheels (wider there, the humps higher than the bonnet)
    // with flared lips round the arches, the humps ending in a step at the nose (the lamps' faces) over the lower nose with the mouth; the
    // standard regions split it (the bonnet between the front humps, the boot lid between the rear ones, the doors, fenders, quarters, the
    // nose's and the tail's lower half the bumpers). The details: the oval mouth with its bar, the round lamps, the side pipes (pipeL /
    // pipeR), the windscreen in its frame, the roll bar behind the driver, the driver and the seats in sight; twin stripes in the stripe
    // colour over the bonnet and the tail (the crown's colour, the paint's gap down its middle); the V8 in the bay
    look: {
      body: { len: 3.96, wid: 1.73, roofY: 0.86, wz: 0.145, door: [0.26, -0.58], bumpF: 0.1, bumpY: [0.42, 0.44],
        //       x      w      yb    ybelt  wt    yt     cr     kind  tuck
        secs: [[-1.98, 0.6, 0.25, 0.56, 0.48, 0.66, 0.02, 'b', 0.08],      // the tail: its round lamps, the plate
          [-1.9, 0.74, 0.22, 0.62, 0.58, 0.76, 0.02, 'b', 0.09],
          [-1.827, 0.8, 0.2, 0.66, 0.63, 0.83, 0.0, 'b', 0.1],           // (the rear bumper's depth)
          [-1.65, 0.84, 0.2, 0.7, 0.67, 0.88, -0.03, 'b', 0.1],
          [-1.47, 0.855, 0.18, 0.72, 0.69, 0.9, -0.045, 'b', 0.1],       // the rear arch: the hips, higher than the boot lid between them
          [-1.09, 0.858, 0.18, 0.73, 0.7, 0.915, -0.06, 'b', 0.1],
          [-0.71, 0.835, 0.18, 0.7, 0.66, 0.85, -0.02, 'r', 0.1],        // the cockpit (open: no top), from the seats' backs
          [-0.58, 0.805, 0.17, 0.68, 0.65, 0.8, 0.02, 'r', 0.1],         // (the door's rear edge)
          [0.12, 0.8, 0.17, 0.68, 0.66, 0.81, 0.03, 'gf', 0.1],          // the scuttle under the windscreen (closed)
          [0.26, 0.805, 0.17, 0.69, 0.67, 0.83, 0.02, 'b', 0.1],         // the windscreen's base, the door's front edge
          [0.82, 0.84, 0.18, 0.71, 0.69, 0.87, -0.03, 'b', 0.1],         // the front arch: the humps over the wheels
          [1.2, 0.852, 0.18, 0.73, 0.7, 0.89, -0.055, 'b', 0.1],
          [1.58, 0.82, 0.2, 0.69, 0.66, 0.84, -0.045, 'b', 0.1],
          [1.75, 0.76, 0.22, 0.62, 0.6, 0.77, -0.04, 'b', 0.08],         // the humps run on to the lamps
          [1.86, 0.69, 0.235, 0.58, 0.56, 0.735, -0.05, 'b', 0.07],      // their ends: a step down to the nose (the lamps' faces)
          [1.88, 0.56, 0.24, 0.55, 0.46, 0.64, 0.04, 'b', 0.065],        // (the front bumper's depth)
          [1.945, 0.53, 0.245, 0.53, 0.44, 0.625, 0.025, 'b', 0.065],    // the nose rounding down to its face
          [1.98, 0.47, 0.255, 0.5, 0.38, 0.59, 0.0, 'b', 0.06]],         // the nose's face: the oval mouth
        eye: { x: -0.42, y: 1.02, near: 0.2, tilt: 0.06, style: 'open' },   // (low behind the windscreen, its top 0.19 over the eyes)
        decalX: 1.02, decalY: 0.838, decalRz: -0.005, decalS: 0.6, decalPart: 'hood',   // (the start number on the bonnet, over the stripes)
        crush: { x0: -0.06, x1: 0.3, z: 0.62 } },                         // (a roll-over folds the windscreen's frame; the roll bar stands)
      wheels: { style: 'deep', spokes: 8, w: 0.215, wR: 0.245, rim: [0.7, 0.7, 0.68], cap: [0.86, 0.87, 0.9], gap: 0.05 },
      // the standard regions, but the bonnet stops at the humps' ends (the nose round the mouth is the body's) and the boot lid lies
      // between the hips behind the roll bar's deck (no rear glass: the default takes the tail's last 25 cm)
      regions: (std) => std.map(r => r.part === 'hood' ? Object.assign({}, r, { x: [r.x[0], 1.88] }) : r.part === 'trunk' ? Object.assign({}, r, { x: [r.x[0], -1.09] }) : r),
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, CH = K.chrome, G = K.GLASS, D = [0.09, 0.09, 0.1], IN = [0.11, 0.1, 0.09];
        const CR = !!(K.fitted && K.fitted.crte);   // (the garage's stripes fitted: mounts.crte; the stock twin stripes give way to them)
        // ---- the shell: the paint; the cockpit's top open; the sills a shade darker, black ledges in the arches ----
        const L = K.loft(K.secs(K.body.secs), (k, e, kind, at) => {
          if (at.end) return P;
          if (e === 0 || e === 8) return at.arch ? B : K.shade(P, 0.62);
          if (kind === 'r' && e >= 3 && e <= 5) return null;
          return e === 4 && !CR ? S : P;   // (the crown: the stripes' colour, a gap of paint laid down its middle: the twin stripes; the garage's in their place: CR)
        }, { caps: { front: { col: P }, rear: { col: P, high: 'body' } } });
        const DC = L.decal;
        // the twin stripes' gap: over the scuttle, the bonnet and the nose; over the deck behind the cockpit, the boot lid and the tail
        if (!CR) for (const [x0, x1] of [[0.12, 1.98], [-1.98, -0.71]]) DC.top([[x0, -0.045], [x1, -0.045], [x1, 0.045], [x0, 0.045]], P, 0.004);
        // the doors' shut lines (front and rear edge, the side and the shoulder up to the cockpit's rim)
        for (const x of [-0.57, 0.25]) { DC.side([[x - 0.005, 0.27], [x + 0.005, 0.27], [x + 0.005, 0.7], [x - 0.005, 0.7]], K.shade(P, 0.5), null, 0.004);
          DC.band([[x - 0.005, 0], [x + 0.005, 0], [x + 0.005, 1], [x - 0.005, 1]], K.shade(P, 0.5), null, 0.004); }
        // the vents behind the front wheels (a slot rounded along the arch)
        DC.side([[0.66, 0.44], [0.74, 0.44], [0.785, 0.5], [0.785, 0.6], [0.74, 0.66], [0.66, 0.66]], D, null, 0.006);
        // the flared lips round the arches (the fenders' and the quarters')
        for (const A of K.arches) for (const sd of [-1, 1]) K.flare(A.x, 0.38, 0.425, sd * 0.82, sd * 0.865, P, { n: 6 });
        K.part('hood', () => K.deli('hauba', () => {}));   // (the garage's bonnet top: mounts.hauba; none stock)
        // ---- the nose: the oval mouth (black) with a chrome bar across; the round lamps in the humps' ends, the indicators under them ----
        K.part('bumperF', () => {
          const oval = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; oval.push([1.983, 0.415 + Math.sin(a) * 0.135, -Math.cos(a) * 0.37]); }
          K.face(oval, B);
          K.deli('maska', () => K.bar([1.986, 0.415, -0.36], [1.986, 0.415, 0.36], 0.012, CH, { n: 4 }));   // (the garage's grille in the mouth in its place: mounts.maska)
        }, { hinge: [[1.9, 0.3, -0.4], [1.9, 0.3, 0.4]] });
        // (the lamps parts of their own, on the fenders: headL, headR; the garage's in their place: K.deli, mounts.zarometi)
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(1.885, 0.645, sd * 0.54, 0.086, { n: 10, host: sd < 0 ? 'headL' : 'headR' }); });
        K.deli('zmigavci', () => { for (const sd of [-1, 1]) K.discX(1.884, 0.5, sd * 0.625, 0.03, 6, [1, 0.6, 0.12], 1, { host: sd < 0 ? 'fenderL' : 'fenderR' }); });   // (the garage's: mounts.zmigavci)
        // ---- the tail: round lamps (two a side: each side's a part of its own; a dark sliver behind each lens, from it into the tail, is that
        //      part's own: hidden, the lens before it and the tail round it), the plate (a part of its own, its top 3 mm nearer the tail: its
        //      piece on the road not flat); the bumperettes ----
        //      (the garage's lamps in their room: K.deli, mounts.zadnje_luci)
        K.deli('zadnje_luci', () => { for (const sd of [-1, 1]) for (const z of [0.48, 0.35]) { const tp = sd < 0 ? 'tailL' : 'tailR', q = [[-1.984, 0.59, sd * z], [-1.984, 0.545, sd * (z - 0.026)], [-1.95, 0.545, sd * (z + 0.026)]];
          K.face(sd > 0 ? q : q.reverse(), [0.3, 0.04, 0.04], { host: tp }); K.tailLamp(-1.98, 0.56, sd * z, 0.084, 0.084, { round: true, host: tp }); } });
        K.face([[-1.985, 0.445, -0.21], [-1.985, 0.445, 0.21], [-1.982, 0.555, 0.21], [-1.982, 0.555, -0.21]], [0.93, 0.93, 0.9], { part: 'plate' });   // (facing back)
        K.part('trunk', () => { K.deli('krilo', () => {}); K.deli('prtljaznik', () => {}); K.deli('antena', () => {}); });   // (the garage's wing, lid and aerials on the boot lid: mounts.krilo, prtljaznik, antena; none stock)
        K.part('bumperR', () => { for (const sd of [-1, 1]) K.cyl([-1.975, 0.4, sd * 0.28], [-1.975, 0.4, sd * 0.56], 0.022, CH, { n: 5 }); },
          { hinge: [[-1.9, 0.3, -0.4], [-1.9, 0.3, 0.4]] });
        // ---- the side pipes along the sills: out of the fender behind the front wheel, the heat shield over the middle ----
        for (const sd of [-1, 1]) K.part(sd < 0 ? 'pipeL' : 'pipeR', () => {
          const hex = [0, 1, 2, 3, 4, 5].map(i => [Math.cos(i * Math.PI / 3), Math.sin(i * Math.PI / 3)]), rad = [0.035, 0.045, 0.055, 0.06, 0.046];
          K.sweep(hex, [[0.72, 0.38, sd * 0.7], [0.6, 0.265, sd * 0.795], [0.42, 0.24, sd * 0.805], [-0.42, 0.24, sd * 0.805], [-0.56, 0.24, sd * 0.805]],
            (k) => k === 2 ? [0.5, 0.51, 0.53] : CH, { scale: (i) => rad[i], capB: [0.03, 0.03, 0.035] });
        });
        // ---- the windscreen: one pane facing forward (the driver sees out through it), its chrome frame; the mirrors on its posts; wipers ----
        K.face([[0.258, 0.835, 0.64], [0.258, 0.835, -0.64], [0.028, 1.205, -0.6], [0.028, 1.205, 0.6]], G, { part: 'body' });
        K.part('body', () => {
          K.bar([0.025, 1.21, -0.61], [0.025, 1.21, 0.61], 0.016, CH, { n: 4 });
          for (const sd of [-1, 1]) K.bar([0.262, 0.83, sd * 0.645], [0.025, 1.21, sd * 0.61], 0.016, CH, { n: 4 });
        });
        K.part('wiperFront', () => { for (const z of [-0.36, 0.2]) K.bar([0.27, 0.856, z - 0.2], [0.25, 0.862, z + 0.2], 0.008, B, { n: 3 }); });
        K.deli('ogledala', () => { for (const sd of [-1, 1]) K.mirror(0.14, 1.0, sd * 0.675, { w: 0.04, h: 0.05, d: 0.08, col: CH, arm: CH, z0: sd * 0.63 }); });   // (the garage's: mounts.ogledala)
        // (none stock: the garage's aero kit, extra lamps, tow points, mud flaps, door skins, stripes, decals, sun strip, fuel cap and
        // calipers: K.deli, their mounts)
        for (const id of ['aero', 'relijske_luci', 'vlecne_kljuke', 'lovilci_blata', 'vrata', 'crte', 'nalepke', 'soncni_pas', 'zamasek', 'celjusti']) K.deli(id, () => {});
        // ---- the cockpit (in sight): the seats, the dashboard, the driver in the left seat (helmet, shoulders, arms to the wheel under
        //      the scuttle; the cockpit camera sits in the middle: none of him in its view), the roll bar behind him ----
        for (const sd of [-1, 1]) K.seat(-0.36, 0.36, sd * 0.32, { w: 0.44, l: 0.44, back: 0.52, tilt: 0.2, col: IN });
        K.box(0.05, 0.6, 0, 0.14, 0.22, 1.24, 0, D, null, true, { part: 'body' });
        K.part('body', () => {
          const z = -0.32, SU = [0.1, 0.14, 0.32], HC = [0.95, 0.95, 0.93];
          K.box(-0.44, 0.48, z, 0.24, 0.4, 0.4, 0.0, SU, null, true);                                 // the torso (the shoulders at 0.88)
          const R = [[0.86, 0.075], [0.94, 0.12], [1.05, 0.125], [1.11, 0.095], [1.14, 0.045]].map(([y, r], i) => [0, 1, 2, 3, 4, 5, 6, 7].map(j => { const a = j / 8 * Math.PI * 2; return [-0.42 + Math.cos(a) * r * (i ? 1.06 : 1), y, z + Math.sin(a) * r]; }));
          K.skin(R, (k, e) => k === 1 && (e === 0 || e === 7) ? [0.26, 0.17, 0.06] : k === 3 && e >= 2 && e <= 5 ? S : HC, [0.1, 0.1, 0.11], HC);   // the helmet: its gold visor at the eyes, the stripe colour on its crown
          for (const sd of [-1, 1]) K.bar([-0.43, 0.84, z + sd * 0.17], [-0.06, 0.74, z + sd * 0.15], 0.042, SU, { n: 4 });   // the arms (to the wheel under the scuttle)
        }, { noCrush: true, noDent: true });
        // (the bulkhead behind the seats stands on the rear arch's end, its ring raised to the arch: under it, outside the tub's inner wall,
        // a gap to the floor; closed here, facing the cockpit)
        for (const sd of [-1, 1]) K.face(sd > 0 ? [[-0.706, 0.19, 0.78], [-0.706, 0.19, 0.54], [-0.706, 0.335, 0.54], [-0.706, 0.335, 0.78]] : [[-0.706, 0.19, -0.54], [-0.706, 0.19, -0.78], [-0.706, 0.335, -0.78], [-0.706, 0.335, -0.54]], K.lining, { part: 'body' });
        K.cage([[[-0.8, 0.8, -0.56], [-0.8, 1.06, -0.54]], [[-0.8, 1.06, -0.54], [-0.8, 1.13, -0.46]], [[-0.8, 1.13, -0.46], [-0.8, 1.13, -0.18]], [[-0.8, 1.13, -0.18], [-0.8, 1.06, -0.1]],
          [[-0.8, 1.06, -0.1], [-0.8, 0.8, -0.08]], [[-0.8, 1.1, -0.5], [-1.2, 0.88, -0.52]]], 0.024, [0.8, 0.81, 0.84], { n: 5, noCrush: true, noDent: true });
        // ---- the hinges: the bonnet at the windscreen, the boot lid at the roll bar's deck, the doors at their front edges, the pipes ----
        K.hinge('hood', [0.28, 0.84, -0.6], [0.28, 0.84, 0.6]);
        K.hinge('trunk', [-1.1, 0.88, -0.6], [-1.1, 0.88, 0.6]);
        K.hinge('doorL', [0.25, 0.3, -0.8], [0.25, 0.75, -0.8]); K.hinge('doorR', [0.25, 0.3, 0.8], [0.25, 0.75, 0.8]);
        for (const sd of [-1, 1]) K.hinge(sd < 0 ? 'pipeL' : 'pipeR', [0.55, 0.25, sd * 0.75], [0.55, 0.25, sd * 0.86]);   // (a loose pipe hangs from its header, its tail down)
        // ---- inside (seen once a part is off): the V8 under the bonnet with its air cleaner, the radiator behind the mouth ----
        K.engine(0.85, 0.32, 0, { l: 0.62, w: 0.52, h: 0.36, inner: true, col: [0.3, 0.32, 0.36], cover: CH });
        K.cyl([0.88, 0.68, 0], [0.88, 0.74, 0], 0.16, CH, { n: 10, inner: true, part: 'body' });
        K.box(1.84, 0.28, 0, 0.06, 0.34, 0.8, 0, [0.12, 0.12, 0.13], null, false, { inner: true, part: 'body' });
        for (const sd of [-1, 1]) K.box(1.2, 0.2, sd * 0.57, 0.74, 0.5, 0.04, 0, D, null, true, { inner: true, part: 'body' });   // (the inner wings: no tyre in the bay)
        for (const id of ['akumulator', 'filter_zraka', 'turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum']) K.deli(id, () => {});   // (the garage's hidden parts: mounts)
      },
    },
  });
})();
