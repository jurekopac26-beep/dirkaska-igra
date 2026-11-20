/* Vehicle 'hrast' — HRAST: the TITAN racing tractor with a semi-trailer carrying oak logs (the user's of 20. 11. 2026,
   tovornjaki-zasnova-20-11 = 1). The tractor, its physics, parts and mounts are the TITAN CISTERNA's (js/cars/cisterna.js, a copy: tests/cisterna.test.js);
   only the trailer differs: its length, height, axles and its look (the renderer's trailer builder B, js/render.js; B.lo 0 the look, 1 a rival's, 2 the shadow). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  const titan = () => { const d = VEHICLE_DEFS.find(q => q && q.id === 'titan'); return d && d.look; };   // (the TITAN's look, read when drawn)
  const DK = 0x1c1c1e, TYRE = 0x1b1b1b, RIM = 0xb9bdc2, GALV = 0xc4c9ce, BLK = 0x151515;
  function wheel(B, x, r, z0, z1, rim) { const full = !B.lo; const sd = Math.sign(z1);
    if (full) { B.cyl([x, r, z0], [x, r, z1], r, TYRE, { n: 14 }); B.cyl([x, r, z1], [x, r, z1 + sd * 0.015], r * 0.62, rim || RIM, { n: 12 }); B.cyl([x, r, z1 + sd * 0.015], [x, r, z1 + sd * 0.03], r * 0.2, 0x55585c, { n: 8 }); }
    else B.cyl([x, r, z0], [x, r, z1], r, TYRE, { n: B.lo === 2 ? 6 : 8, capK: rim || RIM }); }
  function axle(B, x, r) { if (B.lo !== 2) B.box(x, r, 0, 0.12, 0.12, 1.72, DK); for (const sd of [-1, 1]) wheel(B, x, r, sd * 0.86, sd * 1.22); }
  function rear(B, x, k) { B.box(x, 0.42, 0, 0.08, 0.2, 2.3, k || 0xd9dcdf); for (const sd of [-1, 1]) { B.box(x, 0.42, sd * 1.0, 0.09, 0.22, 0.4, BLK); B.lamp(x - 0.05, 0.43, sd * 1.0, 0.12, 0.28); } }
  function legs(B, x) { if (B.lo === 2) return; for (const sd of [-1, 1]) { B.box(x, 0.62, sd * 0.55, 0.14, 0.78, 0.14, DK); B.box(x, 0.2, sd * 0.55, 0.32, 0.05, 0.32, DK); } }
  function guards(B, x0, x1, y) { if (B.lo === 2) return; for (const sd of [-1, 1]) B.box((x0 + x1) / 2, y, sd * 1.18, x0 - x1, 0.1, 0.05, 0xdadde0); }

  // TITAN AVTOVOZ: a two-deck car carrier, galvanised frame; the cars on it are the game's own (added in the page: window.__CARS)
  function hrast(B) {
    const full = !B.lo, sh = B.lo === 2, GN = 0x3b9a4c, BARK = 0x5b4733, END = 0xd2ab73;
    for (const sd of [-1, 1]) B.box(-5.4, 1.06, sd * 0.5, 12.0, 0.24, 0.16, DK);
    B.box(-0.2, 1.0, 0, 2.1, 0.08, 1.9, DK);
    // the bolsters and their stanchions; the front headboard (a grid)
    for (const x of [-1.6, -4.6, -7.6, -10.6]) { B.box(x, 1.28, 0, 0.3, 0.2, 2.45, GN); if (!sh) for (const sd of [-1, 1]) B.box(x, 2.2, sd * 1.18, 0.14, 1.75, 0.12, GN); }
    if (!sh) { B.box(-0.65, 2.15, 0, 0.12, 1.9, 2.4, GN); if (full) for (const z of [-0.8, -0.4, 0, 0.4, 0.8]) B.box(-0.72, 2.15, z, 0.05, 1.85, 0.06, 0x2c2c2c); }
    // the crane folded behind the headboard: its column, the boom and the jib laid along the top, the grapple
    if (!sh) { B.cyl([-0.1, 1.1, 0], [-0.1, 3.0, 0], 0.22, GN, { n: 10 }); B.box(-1.4, 3.3, 0.2, 3.0, 0.32, 0.3, GN); B.box(-1.3, 3.0, -0.25, 2.6, 0.26, 0.24, GN);
      if (full) { B.box(-2.95, 2.8, 0.2, 0.3, 0.6, 0.5, 0x2c2c2c); B.cyl([0.05, 3.0, 0.35], [-2.4, 3.35, 0.35], 0.06, 0x9aa1a8, { n: 6 }); } }
    // the logs: three rows, bark on their sides, the cut ends light
    const rows = [[1.62, [-0.9, -0.3, 0.3, 0.9], 0.31], [2.18, [-0.6, 0.0, 0.6], 0.29], [2.68, [-0.3, 0.3], 0.27]];
    let i = 0;
    for (const [y, zs, r] of rows) for (const z of zs) { i++; const rr = r * (0.92 + 0.12 * ((i * 37) % 5) / 4), dx = ((i * 53) % 7) * 0.06;
      B.cyl([-0.85 + dx * 0.5, y, z], [-11.3 - dx, y, z], rr, BARK, { n: full ? 10 : 6, capK: END }); }
    // the straps over the load
    if (full) for (const x of [-3.1, -6.1, -9.1]) { B.box(x, 3.0, 0, 0.06, 0.03, 1.4, 0xff7a1a); for (const sd of [-1, 1]) B.box(x, 2.0, sd * 1.24, 0.06, 2.0, 0.02, 0xff7a1a); }
    for (const ax of [-7.5, -8.8, -10.1]) axle(B, ax, 0.5);
    guards(B, -2.8, -6.6, 0.68); legs(B, -2.1); rear(B, -11.44, GN);
  }
  // HRAST: the TITAN tractor (from cisterna.js) and a log trailer
  VEHICLE_DEFS.push({
    id: 'hrast', name: 'HRAST', cat: 'tovornjaki', ord: 7, drive: 'FR',
    desc: 'TITAN s hlodovino: težka prikolica s hrastovimi debli, pri zaviranju potiska.',
    phys: { mass: 5300, a: 1.65, b: 2.05, kI: 1.6, kw: 820, redline: 2800, idle: 600, gears: [6, 4.7, 3.7, 2.95, 2.4, 1.95, 1.6, 1.33, 1.13, 1], final: 3.42, rw: 0.55, cDrag: 0.8, len: 5.9, wid: 2.5, steerMax: 0.55,
      tracK: 0.55, brakeK: 0.7, spinK: 0.4, dmgK: 0.6, vLim: 150, sway: 1.4, landV: 13 },
    arc: { amax: 1.0, kv: 1.8, rmin: 9 },   // (1.3 g: what its axles hold with the kingpin's push, tlHoldSet)
    csp: { bx: 0.12, coast: -0.06, thr: -0.01, liftP: 0.04, pwr: 0.04, out: 1.2, turn: 0.75, w: 0.92, tv: 1.2 },   // (the TITAN's)
    stats: { power: 10, grip: 1, weight: 1, drift: 10 },   // (Core.statsOf: the TITAN's engine, the rig's grip)
    expect: { t100: [9.15, 10.15], vmax: [144, 152], latG: [1.17, 1.29], d100: [40.9, 45.1] },   // (the rig: tests/fleet.test.js, its envelope 'prikolica')
    price: 75000, pk: 'open', field: ['hrast'], fieldN: 5,   // (5 of its own, no others: a long rig each, the phone's budget)
    snd: { kind: 'diesel', hz: 0.95, turbo: 0.8, loud: 1.35 },
    // (the TITAN's parts and mounts, as in js/cars/titan.js: its tractor is the TITAN's look; tests/cisterna.test.js keeps them the same)
    partNames: { grille: 'front grille', deflector: 'roof deflector', skirtL: 'left side skirt', skirtR: 'right side skirt', headL: 'left head lamps', headR: 'right head lamps',
      tailL: 'left tail lamp', tailR: 'right tail lamp', wiperFront: 'windscreen wipers' },
    parts: { set: 'truck', ht: 3, y0: 0.6,
      extra: {
        grille: { z: 0, th: 0.6, m: 6, rW: 0.35, h: 0.08, lx: 1, lz: 0, f: 0.35 },
        deflector: { z: 0, th: 0.6, m: 8, rW: 0.38, h: 0.13, lx: 0.62, lz: 0, f: 0.95 },
        skirtL: { z: 2, th: 0.58, m: 7, r: 0.8, h: 0.06, lx: -0.12, lz: -1, f: 0.08 },
        skirtR: { z: 3, th: 0.58, m: 7, r: 0.8, h: 0.06, lx: -0.12, lz: 1, f: 0.08 },
        // (as KAMEN's: each side's pair of head lamps a part of its own, on the bumper (they go with it); a hit on their corner knocks one
        // out. Each tail lamp with its black panel on the lamp bar likewise; the two wipers one part)
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.3, h: 0.08, lx: 1.0, lz: -0.616, y: 0.82, on: 'bumperF' },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.3, h: 0.08, lx: 1.0, lz: 0.616, y: 0.82, on: 'bumperF' },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.2, h: 0.05, lx: -0.991, lz: -0.576, y: 1.0 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.2, h: 0.05, lx: -0.991, lz: 0.576, y: 1.0 },
        wiperFront: { z: 0, th: 0.65, m: 0.6, r: 0.5, h: 0.03, lx: 0.944, lz: -0.04, y: 2.04 },
      },
      // (where the look has them: the cab's doors and mirrors are far forward on a cab-over; a lost one flies off from there)
      over: { doorL: { lx: 0.64, y: 1.84 }, doorR: { lx: 0.64, y: 1.84 }, mirrorL: { lx: 0.87, y: 2.17 }, mirrorR: { lx: 0.87, y: 2.17 }, bumperF: { h: 0.2 } },
    },
    // where the garage's parts go (js/deli.js, look units): the wing on the roof deflector's rear edge (its part; its top along x, a truck's
    // size: s); the head lamps, one unit a side over the four lamps' place on the bumper's face (in the lamps' parts); the rims on its wheels
    // (the truck's tyres kept)
    mounts: {
      krilo: { x: 0.74, w: 0.8, part: 'deflector', s: 2, top: [[0.74, 3.0], [2.3, 2.78]] },
      zarometi: { x: 2.955, y0: 0.82, lean: 0, zc: 0.77, yc: 0.82, s: 1.35, hosts: ['headL', 'headR'] },
      platisca: {},
      // (sklop 2 · spredaj) no kit (a truck's bumper) and no bonnet (the cab over the engine); the grille in the cab's front face (in place of
      // its slats), the indicators on the bumper's face over the outer lamps, on the bumper's sides in front of the wheels, on the lamp bar
      // beside the tail lamps; the rally lamps low on the bumper's face, on a bar over the bumper in front of the grille, in the grille, on
      // the roof's front edge before the deflector, a pod on the grille
      maska: { x: 2.803, y0: 1.58, lean: 0, yc: 1.58, w: 1.86, h: 0.62, comb: 3, part: 'grille' },
      zmigavci: { front: { x: 2.952, y: 1.0, z: 0.94, w: 0.2, h: 0.07, part: 'bumperF' }, side: { x: 2.62, y: 0.98, z: 1.24, host: 'bumperF' },
        rear: { x: -2.922, y: 0.98, z: 0.42, part: 'body' } },
      relijske_luci: { bumper: [2.944, 0.56, 0.25], nose: [2.8, 1.36], intake: [2.803, 1.58, 1.86, 0.62], roof: [2.535, 0.6], pod: [2.78, 1.86, 1.36, 0.6], foot: 1.18, part: 'bumperF' },
      // (sklop 2 · streha) none: the deflector covers the cab's roof from the windscreen's top to the rear wall (a sunroof, a scoop or the
      // aerials would be in it); no rear window for the louvres
      // (sklop 2 · zadaj) the tail lamps in place of the stock ones in their black panels (on their side: the room's long way across); no
      // exhaust of the garage's (the stacks behind the cab) and no boot; the tow points in place of the towing eye and on the rear bar's tube;
      // the flaps behind the front wheels and on the rear bar (the rear mudguards end over the tyre's back: the bar's tube holds them)
      zadnje_luci: { x: -2.902, zc: 0.72, yc: 1.0, w: 0.14, h: 0.3, s: 0.9, shape: [[-0.17, -0.06], [-0.17, 0.06], [0.17, 0.06], [0.17, -0.06]], hosts: ['tailL', 'tailR'] },
      vlecne_kljuke: { f: [2.95, 0.54, 0], r: [-2.95, 0.72, 0.3], tube: [2.95, null] },
      lovilci_blata: { x: [1.04, -2.815], z: [0.84, 1.2], y: [0.79, 0.3], parts: ['body', 'body', 'bumperR', 'bumperR'] },
      // (sklop 2 · bok) the car's mirrors on the A-pillars (in place of the big stock ones on their arms), the doors (no glass of the garage's:
      // the stock ones' in the loft), the brakes, the nuts
      ogledala: { x: 2.54, y: 2.2, z: 1.29, w: 0.07, h: 0.12, d: 0.18, z0: 1.215 },
      vrata: { x: [1.0, 2.49], y: [1.16, 1.96], handle: [1.12, 1.72, 1.256, 0.16, 0.035], win: null, rub: 1.36, crease: [1.36, 1.4], rubSide: true },
      zavore: { s: 1 }, matice: { k: 10, r: 0.24 },
      // (sklop 3 · barve) no stripes and no decals (the roof under the deflector, no bonnet: their bonnet's options would have no place);
      // the sun strip across the windscreen's top; the fuel cap on the fuel cell's right side over the skirt; the calipers
      barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {},
      soncni_pas: { x: [2.592, 2.65] }, zamasek: { x: -0.62, y: 1.2, z: 0.311, r: 0.05 },
      celjusti: { r: [0.15, 0.27], a: [70, 125] },
      // (sklop 3 · skriti deli) the four on the engine's top under the cab (its tunnel between the seats); the springs and the dampers at the
      // frame's rails over the axles (up to the rails' top), the bars on them
      filter_zraka: { x: 1.6, y: 1.13, z: -0.15 }, akumulator: { x: 1.35, y: 1.2, z: 0.15 }, turbo: { x: 2.1, y: 1.2, z: 0.15, twin: [-0.12, 0.02] }, cip: { x: 1.9, y: 1.2, z: -0.15 },
      vzmeti: { in: 0.55, top: 0.92, seat: 0.6 }, amortizerji: { in: 0.55, top: 0.92 }, stabilizatorji: { in: 0.5, floor: 0.94 }, dim_gum: {},
    },
    // the semi-trailer (Core: tlDefBad, tlStep): 12 t with its tank full; its kingpin on the TITAN's fifth wheel (x -1.8, 0.98 up)
    trailer: { mass: 12000, len: 12.4, wid: 2.5, ht: 3.6, f: 0.9, ax: [-7.5, -8.8, -10.1], kp: [-1.8, 0.98], rw: 0.5, mu: 1.5, brk: 7.5, look: { build: hrast } },
    // the tractor's look: the TITAN's (its shape, colours, chrome), a little rust low on it: the doors' lower edges, the steps, the bumper's lip
    look: {
      get body() { return titan().body; }, get wheels() { return titan().wheels; }, regions: 'none',
      build(K) {
        K.lookOf('titan').build(K);
        const R1 = [0.45, 0.24, 0.12], R2 = [0.36, 0.18, 0.09];
        K.part('body', () => {
          for (const sd of [-1, 1]) {
            const dir = sd < 0 ? '-z' : 'z';
            [[0.86, 0.47, 0.26, 0.07, R1], [1.32, 0.45, 0.18, 0.05, R2], [2.3, 0.46, 0.22, 0.06, R1], [2.62, 0.44, 0.12, 0.05, R2]].forEach(([x, y, l, h, c]) => K.rect(x, y, sd * 1.243, l, h, c, { dir }));
            for (const yy of [0.58, 0.86]) K.box(0.9, yy + 0.021, sd * 1.18, 0.18, 0.004, 0.09, 0, R2);   // (the steps' treads worn to rust)
          }
        });
        K.part('bumperF', () => { for (const z of [-0.95, -0.2, 0.7]) K.rect(2.955, 0.36, z, 0.2, 0.04, R1, { dir: 'x' }); });
      },
    },
  });
})();
