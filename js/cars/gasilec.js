/* Vehicle 'gasilec' — GASILEC: a fire engine with a turntable ladder (docs/titan-cisterna.md, »Novi tovornjaki«), the fiftieth car. One
   rigid body on two axles (twin tyres at the rear). Signature features: 1) a flat cab-over front with a big grille and four lamps, 2) a
   light bar across the cab's roof (blue ends, a clear middle; it does not flash), 3) the equipment body behind the cab: roller shutters
   over a white band, lockers under it, a walk-on roof, 4) the turntable over the rear axle and the ladder lying forward over the cab in
   its cradle (one part: a hard hit on the nose throws it off), 5) suction hoses along the roof's edges, beacons on its rear corners,
   6) red and yellow chevrons across the rear under its shutter, a step for a bumper. No spare tyre (docs/avti-kolibri.md), no names, no
   crests, no lettering. L 6.30 W 2.50 H 3.21, wheelbase 3.90, overhangs F 1.30 R 1.10 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  // the equipment body (m: from behind the cab to the rear wall, its floor and roof, its half width), the turntable, the ladder on it
  const X0 = 0.8, X1 = -2.95, YB = 0.78, YT = 2.46, HW = 1.22, TX = -2.05;
  const LAD = { xa: -2.75, xb: 2.6, y: 2.8, hz: 0.42 };
  const TAIL = [[-0.14, -0.055], [-0.14, 0.055], [0.14, 0.055], [0.14, -0.055]];   // (a tail lamp's outline in its black panel: the garage's options in it)

  VEHICLE_DEFS.push({
    id: 'gasilec', name: 'GASILEC', cat: 'tovornjaki', ord: 9, drive: 'FR',
    desc: 'Gasilsko vozilo z lestvijo: težko in visoko, z modrimi lučmi na strehi kabine.',
    phys: { mass: 7800, a: 1.85, b: 2.05, kI: 1.8, kw: 820, redline: 2800, idle: 600, gears: [6, 4.7, 3.7, 2.95, 2.4, 1.95, 1.6, 1.33, 1.13, 1], final: 3.42, rw: 0.55, cDrag: 0.85, len: 6.3, wid: 2.5, steerMax: 0.55,
      tracK: 0.55, brakeK: 0.7, spinK: 0.4, dmgK: 0.6, vLim: 140, sway: 1.5, landV: 13 },   // (the TITAN's engine, gearbox and tyres under a body half as heavy again, its ladder high over it)
    arc: { amax: 1.38, kv: 1.8, rmin: 8 },
    csp: { bx: 0.12, coast: -0.06, thr: -0.01, liftP: 0.04, pwr: 0.04, out: 1.2, turn: 0.75, w: 0.92, tv: 1.2 },   // (the TITAN's)
    stats: { power: 10, grip: 1, weight: 1, drift: 10 },
    expect: { t100: [7.0, 7.74], vmax: [133, 143], latG: [1.76, 1.86], d100: [29.9, 33.1] },
    price: 70000, pk: 'open', field: ['gasilec'], fieldN: 5,   // (5 of its own, no others)
    snd: { kind: 'diesel', hz: 0.95, turbo: 0.75, loud: 1.3 },
    partNames: { grille: 'front grille', lightbar: 'light bar', ladder: 'ladder', headL: 'left head lamps', headR: 'right head lamps', tailL: 'left tail lamp', tailR: 'right tail lamp',
      wiperFront: 'windscreen wipers' },
    // its breaking parts: the truck's (the bumpers, the cab's doors and mirrors), the grille, the light bar, the lamps (each side's pair of
    // head lamps on the bumper, they go with it; each tail lamp in its black panel), the wipers, the ladder (one piece off its turntable)
    parts: { set: 'truck', ht: 3.22, y0: 0.6,
      extra: {
        grille: { z: 0, th: 0.6, m: 6, rW: 0.35, h: 0.08, lx: 1, lz: 0, f: 0.35 },
        lightbar: { z: 0, th: 0.6, m: 5, rW: 0.38, h: 0.1, lx: 0.714, lz: 0, y: 2.72 },
        ladder: { z: 0, th: 0.85, m: 12, rW: 0.5, h: 0.2, lx: -0.02, lz: 0, y: 2.96 },
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.3, h: 0.08, lx: 1.0, lz: -0.616, y: 0.82, on: 'bumperF' },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.3, h: 0.08, lx: 1.0, lz: 0.616, y: 0.82, on: 'bumperF' },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.2, h: 0.05, lx: -0.938, lz: -0.784, y: 0.92 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.2, h: 0.05, lx: -0.938, lz: 0.784, y: 0.92 },
        wiperFront: { z: 0, th: 0.65, m: 0.6, r: 0.5, h: 0.03, lx: 0.948, lz: -0.04, y: 2.04 },
      },
      // (where the look has them: the cab's doors and mirrors are far forward on a cab-over; a lost one flies off from there)
      over: { doorL: { lx: 0.667, y: 1.84 }, doorR: { lx: 0.667, y: 1.84 }, mirrorL: { lx: 0.876, y: 2.17 }, mirrorR: { lx: 0.876, y: 2.17 }, bumperF: { h: 0.2 } },
    },
    // where the garage's parts go (js/deli.js, look units), as on the TITAN's cab wherever the two are alike. The wing on the body's roof
    // behind the turntable (a truck's size: s); the head lamps, one unit a side over the four lamps' place on the bumper's face (in the
    // lamps' parts); the rims on its wheels (the truck's tyres kept)
    mounts: {
      krilo: { x: -2.92, w: 1.0, part: 'body', s: 2, top: [[-2.92, 2.51], [-2.3, 2.51]] },
      zarometi: { x: 3.155, y0: 0.82, lean: 0, zc: 0.77, yc: 0.82, s: 1.35, hosts: ['headL', 'headR'] },
      platisca: {},
      // (spredaj) no kit (a truck's bumper) and no bonnet (the cab over the engine); the grille in the cab's front face (in place of its
      // slats), the indicators on the bumper's face over the outer lamps, on the bumper's sides in front of the wheels, on the rear wall
      // beside the tail lamps; the rally lamps low on the bumper's face, on a bar over the bumper in front of the grille, in the grille, on
      // the roof's front edge before the light bar, a pod on the grille
      maska: { x: 3.003, y0: 1.58, lean: 0, yc: 1.58, w: 1.86, h: 0.62, comb: 3, part: 'grille' },
      zmigavci: { front: { x: 3.152, y: 1.0, z: 0.94, w: 0.2, h: 0.07, part: 'bumperF' }, side: { x: 2.82, y: 0.98, z: 1.24, host: 'bumperF' },
        rear: { x: X1 - 0.006, y: 0.92, z: 0.66, part: 'body' } },
      relijske_luci: { bumper: [3.144, 0.56, 0.25], nose: [3.0, 1.36], intake: [3.003, 1.58, 1.86, 0.62], roof: [2.735, 0.6], pod: [2.98, 1.86, 1.36, 0.6], foot: 1.18, part: 'bumperF' },
      // (streha) none: the light bar and the ladder over the cab's roof, the turntable and the hoses on the body's; no rear window
      // (zadaj) the tail lamps in place of the stock ones in their black panels (on their side: the room's long way across); no exhaust of
      // the garage's and no boot; the tow points in place of the towing eye and under the rear step; the flaps behind the front wheels and
      // behind the rear ones
      zadnje_luci: { x: X1 - 0.008, zc: 0.98, yc: 0.92, w: 0.14, h: 0.3, s: 0.9, shape: TAIL, hosts: ['tailL', 'tailR'] },
      vlecne_kljuke: { f: [3.15, 0.54, 0], r: [-3.07, 0.6, 0.3], tube: [3.15, null] },
      lovilci_blata: { x: [1.24, -2.78], z: [0.84, 1.2], y: [0.79, 0.3], parts: ['body', 'body', 'body', 'body'] },
      // (bok) the car's mirrors on the A-pillars (in place of the big stock ones on their arms), the doors (no glass of the garage's: the
      // stock ones' in the loft), the brakes, the nuts
      ogledala: { x: 2.74, y: 2.2, z: 1.29, w: 0.07, h: 0.12, d: 0.18, z0: 1.215 },
      vrata: { x: [1.2, 2.69], y: [1.16, 1.96], handle: [1.32, 1.72, 1.256, 0.16, 0.035], win: null, rub: 1.24, crease: [1.24, 1.28], rubSide: true },
      zavore: { s: 1 }, matice: { k: 10, r: 0.24 },
      // (barve) no stripes and no decals (no bonnet, the roof under the ladder); the sun strip across the windscreen's top; the fuel cap
      // on the right skirt between the axles; the calipers
      barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {},
      soncni_pas: { x: [2.792, 2.85] }, zamasek: { x: 0.25, y: 0.64, z: 1.216, r: 0.05 },
      celjusti: { r: [0.15, 0.27], a: [70, 125] },
      // (skriti deli) the four on the engine's top under the cab; the springs and the dampers at the frame's rails over the axles, the
      // bars on them
      filter_zraka: { x: 1.8, y: 1.13, z: -0.15 }, akumulator: { x: 1.55, y: 1.2, z: 0.15 }, turbo: { x: 2.3, y: 1.2, z: 0.15, twin: [-0.12, 0.02] }, cip: { x: 2.1, y: 1.2, z: -0.15 },
      vzmeti: { in: 0.55, top: 0.92, seat: 0.6 }, amortizerji: { in: 0.55, top: 0.92 }, stabilizatorji: { in: 0.5, floor: 0.94 }, dim_gum: {},
    },
    // the look (KIT API v1, render.js; look units = metres): two lofts, the cab (doors with their glass, the windscreen; its front face the
    // grille) and the low front module under it (the bumper with four lamps, the steps, the front wheel's arch); the equipment body, the
    // turntable and the ladder of boxes and bars in their parts. The livery: the cab and the body in the paint, a white band along both
    // (the bumper white too), aluminium shutters, the ladder aluminium
    look: {
      body: { len: 6.3, wid: 2.5, roofY: 2.63, wz: 0.2,
        //       x     w     yb    ybelt  wt    yt    cr    kind  tuck
        // (the TITAN's cab, 0.2 further forward of the middle: its four upright corners round from the roof down, the roof's front edge
        // round into the windscreen, the rear wall's top edge too)
        secs: [[0.86, 1.06, 1.16, 1.96, 0.99, 2.55, 0.05, 'r', 0.06],    // the cab's rear wall
          [0.884, 1.15, 1.16, 1.96, 1.08, 2.59, 0.055, 'r', 0.06],
          [0.95, 1.216, 1.16, 1.96, 1.146, 2.612, 0.06, 'r', 0.06],
          [1.04, 1.24, 1.16, 1.96, 1.17, 2.62, 0.06, 'r', 0.06],
          [2.64, 1.24, 1.16, 1.97, 1.17, 2.63, 0.06, 'r', 0.06],        // the roof's front edge, rounding down
          [2.705, 1.24, 1.16, 1.97, 1.17, 2.616, 0.06, 'r', 0.06],
          [2.759, 1.24, 1.16, 1.97, 1.17, 2.577, 0.058, 'r', 0.06],
          [2.791, 1.238, 1.16, 1.97, 1.168, 2.523, 0.055, 'gf', 0.06],   // the windscreen, raked, its sides round the corners
          [2.88, 1.208, 1.16, 1.96, 1.138, 2.296, 0.045, 'gf', 0.06],
          [2.968, 1.12, 1.16, 1.955, 1.05, 2.072, 0.03, 'gf', 0.06],
          [3.0, 1.0, 1.16, 1.95, 0.93, 1.99, 0.02, 'b', 0.06]],          // its base: the front face below it is the grille (the cap)
        eye: { x: 2.32, y: 2.27, near: 0.25, tilt: 0.1, style: 'closed' },   // (high up behind the windscreen)
        decalX: -0.9, decalY: 2.515, decalRz: 0, decalS: 0.7,               // (the start number on the body's walk-on roof, under the ladder)
        engine: [2.25, 1.2], crush: { x0: 0.92, x1: 2.78, z: 1.12 }, cage: true },     // (the engine under the cab; only the cab's roof crushes)
      wheels: { style: 'truck', w: 0.34, wR: 0.3, gap: 0.08, rim: [0.84, 0.85, 0.87], dual: true },
      regions: 'none',
      build(K) {
        const P = K.paint, B = K.black, CH = K.chrome, G = K.GLASS, PD = K.shade(P, 0.82);
        const WH = [0.93, 0.93, 0.91], SIL = [0.72, 0.73, 0.75], SLT = [0.5, 0.51, 0.53], D = [0.16, 0.16, 0.17], FRM = [0.2, 0.2, 0.22], BLUE = [0.1, 0.32, 0.98], YEL = [0.95, 0.8, 0.1], RED = [0.8, 0.08, 0.05], ALU = [0.8, 0.81, 0.83];
        // ---- the cab: the doors (side and window) in their parts, glass in the door and the windscreen; its rear wall; the front face
        //      (the cap below the windscreen) is the grille's ----
        const C = K.loft(K.body.secs, (k, e, kind, at) => {
          if (at.end) return P;
          if (e === 0 || e === 8) return D;
          const door = at.x > 1.76 && at.x < 2.69;
          if (kind === 'gf') return e >= 3 && e <= 5 ? G : P;
          if (e === 2 || e === 6) return door ? G : P;
          return P;
        }, { caps: { front: { col: P, low: 'grille', high: 'grille' }, rear: { col: P, low: 'body', high: 'body' } }, arches: false,
          regions: ['L', 'R'].flatMap(sd => [[1.2, 1.75], [1.75, 2.7]].map(x => ({ part: 'door' + sd, x, bands: ['side', 'window'], side: sd }))) });   // (the door back to the steps behind the wheel, its glass forward of 1.75: the loft cut there)
        const CD = C.decal;
        CD.band([[1.75, 0], [2.7, 0], [2.7, 0.06], [1.75, 0.06]], B, null, 0.008);            // the door window's frame: under it, over it, the edges
        CD.band([[1.75, 0.92], [2.7, 0.92], [2.7, 1], [1.75, 1]], B, null, 0.008);
        CD.band([[1.75, 0], [1.82, 0], [1.82, 1], [1.75, 1]], B, null, 0.009); CD.band([[2.63, 0], [2.7, 0], [2.7, 1], [2.63, 1]], B, null, 0.009);
        CD.side([[2.98, 1.3], [2.98, 1.5], [0.88, 1.5], [0.88, 1.3]], WH, null, 0.008);       // the livery: the white band along the cab (on along the body)
        CD.side([[1.19, 1.2], [1.212, 1.2], [1.212, 1.97], [1.19, 1.97]], D, null, 0.009); CD.band([[1.19, 0], [1.212, 0], [1.212, 0.97], [1.19, 0.97]], D, null, 0.009);   // the door's rear shut line (up to the roof's edge)
        for (const sd of [-1, 1]) {
          K.rect(1.32, 1.72, sd * 1.256, 0.16, 0.035, B, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' });   // the handle (at the door's rear edge)
          K.hinge(sd < 0 ? 'doorL' : 'doorR', [2.7, 1.25, sd * 1.24], [2.7, 2.55, sd * 1.24]);
        }
        for (const z of [-0.55, 0.45]) K.bar([2.99, 2.02, z - 0.5], [2.98, 2.06, z + 0.5], 0.014, B, { n: 4, part: 'wiperFront' });   // the wipers
        // ---- the grille: the front face (the cap) with a big black grille, chrome bars ----
        K.part('grille', () => {
          K.deli('maska', () => K.grille(3.003, 1.58, 0, 1.86, 0.62, { slats: 5, slatCol: [0.55, 0.56, 0.6], frame: CH, frameH: 0.03 }));   // (the garage's grille in its place: mounts.maska)
          K.rect(3.006, 1.98, 0, 1.9, 0.03, CH);                                              // (the chrome line along the windscreen's base)
        }, { hinge: [[3.0, 1.95, -1.1], [3.0, 1.95, 1.1]] });
        // ---- the low front module: the bumper (the module's nose: its sides, top and front face, white), the arch over the front wheel, the steps ----
        K.loft(K.secs([[0.9, 1.2, 0.42, 1.12, 1.19, 1.2, 0, 'b', 0.1], [2.92, 1.24, 0.36, 1.12, 1.23, 1.2, 0, 'b', 0.1], [3.01, 1.24, 0.36, 1.11, 1.23, 1.19, 0, 'b', 0.1],
          [3.08, 1.221, 0.36, 1.09, 1.207, 1.17, 0, 'b', 0.11], [3.131, 1.17, 0.36, 1.07, 1.155, 1.15, 0, 'b', 0.12], [3.15, 1.1, 0.36, 1.06, 1.085, 1.14, 0, 'b', 0.12]]),
          (k, e, kind, at) => { if (at.end) return WH; if (e === 0 || e === 8) return at.arch ? B : D; if (e >= 2 && e <= 6) return D; return at.x > 2.5 ? WH : at.x < 1.2 ? D : P; },
          { caps: { front: { col: WH, low: 'bumperF', high: 'bumperF' }, rear: { col: D, low: 'body', high: 'body' } }, arches: [{ x: K.fx }], floor: false,
            regions: [{ part: 'bumperF', x: [2.6, 3.4], bands: ['tuck', 'side', 'window', 'edge', 'crown'] }] });
        K.part('bumperF', () => {
          K.box(2.95, 0.33, 0, 0.26, 0.07, 2.3, 0, D);                                        // the lip under it
          K.deli('vlecne_kljuke', () => K.box(3.15, 0.5, 0, 0.06, 0.08, 0.12, 0, YEL));       // the towing eye (the garage's tow points in its place: mounts.vlecne_kljuke)
        }, { hinge: [[3.1, 0.4, -1.1], [3.1, 0.4, 1.1]] });
        // the four lamps on the bumper's face: each side's pair a part of its own on the bumper (headL, headR); the garage's in their place
        K.deli('zarometi', () => { for (const sd of [-1, 1]) { const host = sd < 0 ? 'headL' : 'headR';
          K.headLamp(3.155, 0.82, sd * 0.94, 0.07, { shape: 'rect', w: 0.3, h: 0.15, ring: B, host });
          K.headLamp(3.155, 0.82, sd * 0.6, 0.07, { shape: 'rect', w: 0.3, h: 0.15, ring: B, host }); } });
        K.deli('ogledala', () => { for (const sd of [-1, 1]) K.mirror(2.76, 2.22, sd * 1.42, { w: 0.07, h: 0.4, d: 0.18, col: B, arm: D, z0: sd * 1.22 }); });   // the mirrors on their arms (the garage's: mounts.ogledala)
        // ---- the light bar on the cab's roof: blue ends, a clear middle (never crushed with the roof) ----
        K.part('lightbar', () => {
          K.box(2.25, 2.63, 0, 0.3, 0.06, 1.7, 0, D);
          for (const sd of [-1, 1]) K.box(2.25, 2.69, sd * 0.58, 0.28, 0.1, 0.52, 0, BLUE);
          K.box(2.25, 2.69, 0, 0.26, 0.08, 0.6, 0, [0.85, 0.87, 0.9]);
        }, { noCrush: true, hinge: [[2.4, 2.64, -0.8], [2.4, 2.64, 0.8]] });
        // ---- the equipment body behind the cab: three shutters a side over the white band, lockers under it, the rear arch, the skirt
        //      between the axles, the steps under the door; its rear: a shutter, the chevrons under it ----
        K.part('body', () => {
          for (const sd of [-1, 1]) K.box(0, 0.62, sd * 0.45, 5.5, 0.28, 0.09, 0, FRM);         // the frame's rails
          K.box((X0 + X1) / 2, YB, 0, X0 - X1, YT - YB, HW * 2, 0, P);                          // the body
          K.box((X0 + X1) / 2, YT, 0, X0 - X1 - 0.1, 0.05, HW * 2 - 0.1, 0, ALU);               // its walk-on roof (tread plate)
          for (const sd of [-1, 1]) {
            const dir = sd < 0 ? '-z' : 'z', z = sd * (HW + 0.004);
            for (const [xc, w] of [[0.2, 1.0], [-0.9, 1.0], [-2.25, 1.2]]) {                   // the shutters, their slats, the pull bar
              K.rect(xc, 1.97, z, w, 0.84, SIL, { dir });
              for (let i = 1; i < 6; i++) K.rect(xc, 1.55 + i * 0.14, z + sd * 0.002, w, 0.012, SLT, { dir });
              K.rect(xc, 1.6, z + sd * 0.003, w * 0.5, 0.03, D, { dir });
            }
            K.rect((X0 + X1) / 2, 1.4, z, X0 - X1, 0.2, WH, { dir });                           // the white band (on from the cab's)
            for (const [xc, w] of [[0.2, 1.0], [-0.85, 0.9]]) K.rect(xc, 1.04, z, w, 0.42, PD, { dir });   // the lockers under it
            K.box(K.rx, YB, sd * 1.1, 1.36, 0.5, 0.25, 0, D);                                   // the dark housing over the rear tyres
            K.flare(K.rx, 0.6, 0.66, sd * 0.84, sd * 1.25, B, { a0: 0.2, a1: Math.PI - 0.2 });  // the rear arch
            for (const yy of [0.5, 0.74]) K.box(1.1, yy, sd * 1.18, 0.26, 0.04, 0.12, 0, [0.42, 0.43, 0.45]);   // the steps (under the door, behind the arch)
            K.box(-0.3, 0.42, sd * 1.19, 1.6, 0.36, 0.05, 0, D);                                // the skirt between the axles
            K.box(X1 + 0.12, YT + 0.05, sd * 1.0, 0.16, 0.16, 0.2, 0, BLUE);                    // the beacons on the roof's rear corners
            K.cyl([0.5, YT + 0.17, sd * 1.02], [-1.9, YT + 0.17, sd * 1.02], 0.085, [0.08, 0.08, 0.09], { n: 8 });   // the suction hoses along the roof's edges
          }
          K.rect(X1 - 0.004, 1.95, 0, 1.7, 0.86, SIL, { dir: '-x' });                           // the rear shutter
          for (let i = 1; i < 6; i++) K.rect(X1 - 0.006, 1.53 + i * 0.14, 0, 1.7, 0.012, SLT, { dir: '-x' });
          for (let i = 0; i < 8; i++) K.rect(X1 - 0.004, 1.24, -1.05 + i * 0.3, 0.3, 0.36, i % 2 ? YEL : RED, { dir: '-x' });   // the chevrons under it (red and yellow fields)
          K.deli('krilo', () => {});   // (the garage's wing on the roof's rear edge: mounts.krilo; none stock)
          // the turntable over the rear axle: its ring, the pedestal, the operator's stand, the lifting ram; the ladder's cradle behind the cab
          K.cyl([TX, YT + 0.05, 0], [TX, YT + 0.2, 0], 0.72, D, { n: 14 });
          K.box(TX - 0.2, YT + 0.2, 0, 0.9, 0.36, 0.9, 0, P);
          K.box(TX + 0.5, YT + 0.2, -0.75, 0.5, 0.5, 0.4, 0, D);
          K.bar([TX + 0.3, YT + 0.3, 0], [TX + 1.5, LAD.y - 0.05, 0], 0.07, CH, { n: 8 });
          K.box(1.15, YT + 0.05, 0, 0.12, LAD.y - YT - 0.1, 1.1, 0, D);
        });
        // the tail lamps low on the rear wall, each in its black panel a part of its own (tailL, tailR); the garage's in their place (mounts.zadnje_luci)
        for (const sd of [-1, 1]) K.rect(X1 - 0.006, 0.92, sd * 0.98, 0.3, 0.13, B, { dir: '-x', host: sd < 0 ? 'tailL' : 'tailR' });
        K.deli('zadnje_luci', () => { for (const sd of [-1, 1]) K.tailLamp(X1 - 0.008, 0.92, sd * 0.98, 0.26, 0.1, { host: sd < 0 ? 'tailL' : 'tailR' }); });
        // ---- the rear step for a bumper (a tread plate on a dark bar) ----
        K.part('bumperR', () => { K.box(-3.04, 0.72, 0, 0.22, 0.06, 2.36, 0, ALU); K.box(-3.0, 0.5, 0, 0.14, 0.22, 2.3, 0, D); }, { hinge: [[X1, 0.7, -0.45], [X1, 0.7, 0.45]] });
        // ---- the ladder, lying forward from the turntable over the cab: two rails, the handrails over them on a truss, the rungs, its head.
        // Two noCrush ranges, split behind the cab (x 0.74 | 0.8, clear of the roof's footprint and its 15 cm fade): the front one goes down
        // whole with the cab's roof under it, the rear one over the body stays (a noCrush range moves whole: render.js crumpleRoof) ----
        const ladder = (a, b, head) => () => {
          const { xa, y, hz } = LAD, ha = Math.max(a, xa + 0.2), n = Math.round((b - 0.1 - a) / 0.86), d = (b - 0.1 - a) / n;
          for (const sd of [-1, 1]) {
            K.box((a + b) / 2, y, sd * hz, b - a, 0.09, 0.07, 0, ALU);
            K.box((ha + b) / 2, y + 0.36, sd * hz, b - ha, 0.05, 0.05, 0, ALU);
            for (let i = 0; i < n; i++) { const x = a + (a === xa ? 0.1 : 0) + i * d;
              K.bar([x, y + 0.06, sd * hz], [x + d / 2, y + 0.38, sd * hz], 0.018, ALU, { n: 4 });
              K.bar([x + d / 2, y + 0.38, sd * hz], [x + d, y + 0.06, sd * hz], 0.018, ALU, { n: 4 });
            }
          }
          for (let x = xa + 0.2; x < LAD.xb; x += 0.36) if (x > a + 0.03 && x < b - 0.03) K.box(x, y + 0.02, 0, 0.035, 0.035, hz * 2, 0, ALU);
          if (head) K.box(b + 0.02, y - 0.02, 0, 0.1, 0.42, 1.0, 0, RED);
        };
        K.part('ladder', ladder(LAD.xa, 0.74, false), { noCrush: true });
        K.part('ladder', ladder(0.8, LAD.xb, true), { noCrush: true, sub: 'ladderF' });
        // (the garage's parts with no stock piece: the indicators, the rally lamps, the flaps, the doors' skins, the sun strip, the fuel cap,
        // the calipers: mounts.zmigavci ...)
        for (const id of ['zmigavci', 'relijske_luci', 'lovilci_blata', 'vrata', 'soncni_pas', 'zamasek', 'celjusti']) K.deli(id, () => {});
        // ---- inside (seen once a part is off): the seats, the dashboard, the wheel; the engine under the cab, the radiator behind the grille ----
        K.seat(2.2, 1.62, -0.55, { w: 0.55, back: 0.75 }); K.seat(2.2, 1.62, 0.55, { w: 0.55, back: 0.75 });
        K.box(2.75, 1.6, 0, 0.35, 0.35, 2.2, 0, D, null, false, { inner: true, part: 'body' });
        K.cyl([2.62, 1.98, -0.55], [2.52, 2.12, -0.55], 0.22, [0.1, 0.1, 0.11], { n: 8, inner: true, part: 'body' });
        K.engine(2.05, 0.7, 0, { l: 1.15, w: 0.8, h: 0.5, inner: true });
        K.box(2.88, 1.2, 0, 0.12, 0.7, 1.7, 0, [0.12, 0.12, 0.13], null, false, { inner: true, part: 'body' });
        for (const id of ['filter_zraka', 'akumulator', 'turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum']) K.deli(id, () => {});   // (the hidden parts: none stock)
      },
    },
  });
})();
