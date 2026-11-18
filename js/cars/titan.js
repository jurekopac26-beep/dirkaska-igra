/* Vehicle 'titan' — TITAN: THE racing truck: a European truck-racing tractor unit (cab-over, 160 km/h limiter). Signature features: 1) a
   flat cab-over front with a big grille and four lamps, 2) a roof deflector over the cab, 3) side skirts between the axles, 4) twin
   vertical exhaust stacks behind the cab, 5) a bare racing chassis behind the cab with the rear bumper bar, 6) big single wheels on deep
   rims. L 5.90 W 2.50 H 3.00, wheelbase 3.70, overhangs F 1.30 R 0.90 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'titan', name: 'TITAN', cat: 'tovornjaki', ord: 1, drive: 'FR',
    desc: 'Dirkalni tovornjak: kabina nad motorjem, strešni deflektor in omejilnik pri 160 km/h.',
    phys: { mass: 5300, a: 1.65, b: 2.05, kI: 1.6, kw: 820, redline: 2800, idle: 600, gears: [6, 4.7, 3.7, 2.95, 2.4, 1.95, 1.6, 1.33, 1.13, 1], final: 3.42, rw: 0.55, cDrag: 0.8, len: 5.9, wid: 2.5, steerMax: 0.55,
      tracK: 0.55, brakeK: 0.7, spinK: 0.4, dmgK: 0.6, vLim: 160, sway: 1.4, landV: 13 },
    arc: { amax: 1.42, kv: 1.8, rmin: 7.5 },
    csp: { bx: 0.12, coast: -0.06, thr: -0.01, liftP: 0.04, pwr: 0.04, out: 1.2, turn: 0.75, w: 0.92, tv: 1.2 },   // (the FR layer: lift-off and power rotation; its own bx, coast, thr, liftP, pwr, out, turn, w, tv)
    stats: { power: 10, grip: 1, weight: 1, drift: 10 },
    price: 60000, pk: 'open', field: ['titan'], fieldN: 9, fill: ['kolibri', 'miska'],   // (a bigger race: 9 of its own through the field, the rest these two, its pace together)
    snd: { kind: 'diesel', hz: 1, turbo: 0.8, loud: 1.3 },
    expect: { t100: [6.69, 7.86], vmax: [153, 163], latG: [1.82, 1.92], d100: [30.1, 33.2] },
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
    // the look (KIT API v1, render.js; look units = metres): two lofts, the cab (doors with their glass, the windscreen; its front face the
    // grille) and the low front module under it (the bumper with four lamps, the steps, the front wheel's arch); the roof deflector, the side
    // skirts, the stacks, the mirrors, the bare chassis behind the cab with its rear bumper bar, in their parts. The livery: the cab in the
    // paint, the bumper, deflector and skirts' stripes in the stripe colour; the start number on the deflector and on both doors (K.number)
    look: {
      body: { len: 5.9, wid: 2.5, roofY: 2.69, wz: 0.2,
        //       x     w     yb    ybelt  wt    yt    cr    kind  tuck
        // (soft edges, the user's: the cab's four upright corners round from the roof down (in plan, r 0.18 at the rear, 0.24 at the
        // front: the windscreen wraps round them), the roof's front edge round into the windscreen (r 0.16), the rear wall's top edge too)
        secs: [[0.66, 1.06, 1.16, 1.96, 0.99, 2.55, 0.05, 'r', 0.06],    // the cab's rear wall
          [0.684, 1.15, 1.16, 1.96, 1.08, 2.59, 0.055, 'r', 0.06],
          [0.75, 1.216, 1.16, 1.96, 1.146, 2.612, 0.06, 'r', 0.06],
          [0.84, 1.24, 1.16, 1.96, 1.17, 2.62, 0.06, 'r', 0.06],
          [2.44, 1.24, 1.16, 1.97, 1.17, 2.63, 0.06, 'r', 0.06],        // the roof's front edge, rounding down
          [2.505, 1.24, 1.16, 1.97, 1.17, 2.616, 0.06, 'r', 0.06],
          [2.559, 1.24, 1.16, 1.97, 1.17, 2.577, 0.058, 'r', 0.06],
          [2.591, 1.238, 1.16, 1.97, 1.168, 2.523, 0.055, 'gf', 0.06],   // the windscreen, raked, its sides round the corners
          [2.68, 1.208, 1.16, 1.96, 1.138, 2.296, 0.045, 'gf', 0.06],
          [2.768, 1.12, 1.16, 1.955, 1.05, 2.072, 0.03, 'gf', 0.06],
          [2.8, 1.0, 1.16, 1.95, 0.93, 1.99, 0.02, 'b', 0.06]],          // its base: the front face below it is the grille (the cap)
        eye: { x: 2.12, y: 2.27, near: 0.25, tilt: 0.1, style: 'closed' },   // (high up behind the windscreen)
        decalX: 1.5, decalY: 2.895, decalRz: -0.14, decalS: 1.25, decalPart: 'deflector',   // (the start number on the deflector's flat top)
        engine: [2.05, 1.2], crush: { x0: 0.72, x1: 2.58, z: 1.12 }, cage: true },     // (the engine under the cab; only the cab's roof crushes)
      wheels: { style: 'truck', w: 0.34, wR: 0.36, gap: 0.06, rim: [0.84, 0.85, 0.87] },
      regions: 'none',
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, D = [0.16, 0.16, 0.17], CH = K.chrome, G = K.GLASS, FRM = [0.2, 0.2, 0.22];
        // ---- the cab: the doors (side and window) in their parts, glass in the door and the windscreen; its rear wall; the front face
        //      (the cap below the windscreen) is the grille's ----
        const C = K.loft(K.body.secs, (k, e, kind, at) => {
          if (at.end) return P;
          if (e === 0 || e === 8) return D;
          const door = at.x > 1.56 && at.x < 2.49;
          if (kind === 'gf') return e >= 3 && e <= 5 ? G : P;
          if (e === 2 || e === 6) return door ? G : P;
          return P;
        }, { caps: { front: { col: P, low: 'grille', high: 'grille' }, rear: { col: P, low: 'body', high: 'body' } }, arches: false,
          regions: ['L', 'R'].flatMap(sd => [[1.0, 1.55], [1.55, 2.5]].map(x => ({ part: 'door' + sd, x, bands: ['side', 'window'], side: sd }))) });   // (the door back to the steps behind the wheel, its glass forward of 1.55: the loft cut there)
        const CD = C.decal;
        CD.band([[1.55, 0], [2.5, 0], [2.5, 0.06], [1.55, 0.06]], B, null, 0.008);            // the door window's frame: under it, over it, the edges
        CD.band([[1.55, 0.92], [2.5, 0.92], [2.5, 1], [1.55, 1]], B, null, 0.008);
        CD.band([[1.55, 0], [1.62, 0], [1.62, 1], [1.55, 1]], B, null, 0.009); CD.band([[2.43, 0], [2.5, 0], [2.5, 1], [2.43, 1]], B, null, 0.009);
        CD.side([[2.78, 1.23], [2.78, 1.36], [0.68, 1.78], [0.68, 1.56]], S, null, 0.008);    // the livery: a band rising to the rear, a paint line in it
        CD.side([[2.78, 1.285], [2.78, 1.305], [0.68, 1.68], [0.68, 1.65]], K.shade(P, 0.75), null, 0.01);
        CD.top([[2.5, -1.12], [2.6, -1.12], [2.6, 1.12], [2.5, 1.12]], S, 0.006);             // a strip along the roof's front edge, before the deflector
        CD.side([[0.99, 1.2], [1.012, 1.2], [1.012, 1.97], [0.99, 1.97]], D, null, 0.009); CD.band([[0.99, 0], [1.012, 0], [1.012, 0.97], [0.99, 0.97]], D, null, 0.009);   // the door's rear shut line (up to the roof's edge)
        for (const sd of [-1, 1]) {
          K.rect(1.12, 1.72, sd * 1.256, 0.16, 0.035, B, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' });   // the handle (at the door's rear edge)
          K.number(2.07, 1.7, sd * 1.262, 0.4, { dir: sd < 0 ? '-z' : 'z', w: 0.52, host: sd < 0 ? 'doorL' : 'doorR' });   // the number on the door (over the band)
          K.hinge(sd < 0 ? 'doorL' : 'doorR', [2.5, 1.25, sd * 1.24], [2.5, 2.55, sd * 1.24]);
        }
        for (const z of [-0.55, 0.45]) K.bar([2.79, 2.02, z - 0.5], [2.78, 2.06, z + 0.5], 0.014, B, { n: 4, part: 'wiperFront' });   // the wipers
        K.rect(0.655, 2.2, 0, 1.3, 0.32, G, { dir: '-x', part: 'body' });                     // the rear window
        // ---- the grille: the front face (the cap) with a big black grille, chrome bars, and the place of a badge (none) ----
        K.part('grille', () => {
          K.deli('maska', () => K.grille(2.803, 1.58, 0, 1.86, 0.62, { slats: 5, slatCol: [0.55, 0.56, 0.6], frame: CH, frameH: 0.03 }));   // (the garage's grille in its place: mounts.maska)
          K.rect(2.806, 1.98, 0, 1.9, 0.03, CH);                                              // (the chrome line along the windscreen's base)
        }, { hinge: [[2.8, 1.95, -1.1], [2.8, 1.95, 1.1]] });
        // ---- the low front module: the bumper (the module's nose: its sides, top and front face), the arch over the front wheel, the steps ----
        K.loft(K.secs([[0.7, 1.2, 0.42, 1.12, 1.19, 1.2, 0, 'b', 0.1], [2.72, 1.24, 0.36, 1.12, 1.23, 1.2, 0, 'b', 0.1], [2.81, 1.24, 0.36, 1.11, 1.23, 1.19, 0, 'b', 0.1],   // (its front corners round too, r 0.14)
          [2.88, 1.221, 0.36, 1.09, 1.207, 1.17, 0, 'b', 0.11], [2.931, 1.17, 0.36, 1.07, 1.155, 1.15, 0, 'b', 0.12], [2.95, 1.1, 0.36, 1.06, 1.085, 1.14, 0, 'b', 0.12]]),
          (k, e, kind, at) => { if (at.end) return S; if (e === 0 || e === 8) return at.arch ? B : D; if (e >= 2 && e <= 6) return D; return at.x > 2.3 ? S : at.x < 1.0 ? D : P; },
          { caps: { front: { col: S, low: 'bumperF', high: 'bumperF' }, rear: { col: D, low: 'body', high: 'body' } }, arches: [{ x: K.fx }], floor: false,
            regions: [{ part: 'bumperF', x: [2.4, 3.2], bands: ['tuck', 'side', 'window', 'edge', 'crown'] }] });
        K.part('bumperF', () => {
          K.box(2.75, 0.33, 0, 0.26, 0.07, 2.3, 0, D);                                        // the lip under it
          for (const sd of [-1, 1]) K.rect(2.955, 0.54, sd * 0.62, 0.42, 0.1, B);           // the brake ducts
          K.deli('vlecne_kljuke', () => K.box(2.95, 0.5, 0, 0.06, 0.08, 0.12, 0, K.rgb(0xd8261c)));   // the towing eye (the garage's tow points in its place: mounts.vlecne_kljuke)
        }, { hinge: [[2.9, 0.4, -1.1], [2.9, 0.4, 1.1]] });
        // the four lamps on the bumper's face: the outer pair, the inner pair; each side's pair a part of its own on the bumper (headL, headR);
        // the garage's in their place (K.deli, mounts.zarometi)
        K.deli('zarometi', () => { for (const sd of [-1, 1]) { const host = sd < 0 ? 'headL' : 'headR';
          K.headLamp(2.955, 0.82, sd * 0.94, 0.07, { shape: 'rect', w: 0.3, h: 0.15, ring: B, host });
          K.headLamp(2.955, 0.82, sd * 0.6, 0.07, { shape: 'rect', w: 0.3, h: 0.15, ring: B, host }); } });
        K.part('body', () => { for (const sd of [-1, 1]) for (const yy of [0.58, 0.86]) K.box(0.9, yy, sd * 1.18, 0.26, 0.04, 0.12, 0, [0.42, 0.43, 0.45]); });   // the steps (under the door, behind the arch)
        // ---- the roof deflector (never crushed with the roof) ----
        K.part('deflector', () => {
          const rings = [[2.5, 2.69, 0.98], [2.3, 2.78, 1.07], [0.74, 3.0, 1.12]].map(([x, yt, w]) => [[x, 2.632, -w], [x, yt - 0.05, -w], [x, yt, -w * 0.72], [x, yt, w * 0.72], [x, yt - 0.05, w], [x, 2.632, w]]);
          K.skin(rings, (k, e) => e === 2 ? P : S, S, D);
          K.face([[0.76, 3.002, -0.62], [2.28, 2.787, -0.62], [2.28, 2.787, -0.54], [0.76, 3.002, -0.54]].reverse(), P); K.face([[0.76, 3.002, 0.54], [2.28, 2.787, 0.54], [2.28, 2.787, 0.62], [0.76, 3.002, 0.62]].reverse(), P);   // (two paint lines along it)
          K.deli('krilo', () => {});   // (the garage's wing on its rear edge: mounts.krilo; none stock)
        }, { noCrush: true, hinge: [[2.4, 2.68, -0.9], [2.4, 2.68, 0.9]] });
        // ---- the mirrors on their arms ----
        K.deli('ogledala', () => { for (const sd of [-1, 1]) K.mirror(2.56, 2.22, sd * 1.42, { w: 0.07, h: 0.4, d: 0.18, col: B, arm: D, z0: sd * 1.22 }); });   // (the garage's: mounts.ogledala)
        // ---- the side skirts between the axles (a stripe along them) ----
        for (const sd of [-1, 1]) K.part(sd < 0 ? 'skirtL' : 'skirtR', () => {
          K.box(-0.36, 0.38, sd * 1.2, 2.12, 0.74, 0.05, 0, P);
          K.rect(-0.36, 0.86, sd * 1.226, 2.08, 0.12, S, { dir: sd < 0 ? '-z' : 'z' });
          K.rect(-0.36, 0.43, sd * 1.226, 2.08, 0.06, D, { dir: sd < 0 ? '-z' : 'z' });
        });
        K.part('body', () => { for (const sd of [-1, 1]) for (const x of [-1.1, 0.25]) K.box(x, 0.8, sd * 0.83, 0.06, 0.06, 0.74, 0, FRM); });   // (the skirts' brackets: on the frame rail, they stay when a skirt goes)
        // ---- the stacks behind the cab, their heat shields ----
        K.part('body', () => {
          for (const sd of [-1, 1]) {
            K.cyl([0.5, 0.75, sd * 0.98], [0.5, 3.0, sd * 0.98], 0.075, CH, { n: 10, capA: null, capB: [0.04, 0.04, 0.04] });
            K.bar([0.5, 0.75, sd * 0.98], [0.5, 0.75, sd * 0.5], 0.06, CH);                 // (its elbow into the frame)
            K.cyl([0.5, 1.7, sd * 0.98], [0.5, 2.45, sd * 0.98], 0.087, [0.25, 0.25, 0.27], { n: 10, capA: null, capB: null });
            K.box(0.58, 2.2, sd * 0.98, 0.16, 0.05, 0.05, 0, FRM);
          }
        });
        // ---- the bare chassis: the rails, cross members, the coupling plate, the fuel cell and air tanks, the axle, the rear mudguards, the lamps ----
        K.part('body', () => {
          for (const sd of [-1, 1]) K.box(-0.2, 0.62, sd * 0.45, 5.5, 0.28, 0.09, 0, FRM);
          for (const x of [-2.75, -1.55, -0.45, 0.5]) K.box(x, 0.66, 0, 0.1, 0.2, 0.82, 0, FRM);
          K.cyl([-1.8, 0.9, 0], [-1.8, 0.96, 0], 0.62, [0.3, 0.31, 0.33], { n: 10 });            // the coupling plate (fifth wheel)
          K.rect(-2.11, 0.965, 0, 0.62, 0.22, [0.08, 0.08, 0.09], { dir: 'y' });                 // (its slot: from the middle to the rear edge, for the kingpin)
          K.box(-0.62, 0.9, 0, 0.62, 0.38, 0.62, 0, [0.12, 0.12, 0.13]);                          // the fuel cell
          for (const sd of [-1, 1]) K.cyl([0.3, 0.72, sd * 0.75], [-0.9, 0.72, sd * 0.75], 0.11, [0.55, 0.56, 0.58], { n: 8 });   // the air tanks (behind the skirts)
          K.cyl([-2.05, 0.55, -0.85], [-2.05, 0.55, 0.85], 0.1, D, { n: 8 }); K.box(-2.05, 0.38, 0, 0.42, 0.34, 0.42, 0, D);   // the rear axle, its differential
          K.cyl([0.4, 0.62, 0], [-1.85, 0.52, 0], 0.06, D, { n: 6, capA: null, capB: null });     // the drive shaft
          for (const sd of [-1, 1]) K.flare(K.rx, 0.6, 0.65, sd * 0.84, sd * 1.24, B, { a0: 0.25, a1: Math.PI - 0.6 });   // the rear mudguards
          K.box(-2.88, 0.9, 0, 0.08, 0.16, 1.9, 0, FRM);                                         // the lamp bar at the frame's end (on the rails)
        });
        // the tail lamps on the lamp bar, each in its black panel a part of its own (tailL, tailR); the garage's in their place (mounts.zadnje_luci)
        for (const sd of [-1, 1]) K.rect(-2.922, 1.0, sd * 0.72, 0.36, 0.13, B, { dir: '-x', host: sd < 0 ? 'tailL' : 'tailR' });
        K.deli('zadnje_luci', () => { for (const sd of [-1, 1]) K.tailLamp(-2.924, 1.0, sd * 0.72, 0.32, 0.1, { host: sd < 0 ? 'tailL' : 'tailR' }); });
        // (the garage's parts with no stock piece: the indicators, the rally lamps, the flaps, the doors' skins, the sun strip, the fuel cap,
        // the calipers: mounts.zmigavci ...)
        for (const id of ['zmigavci', 'relijske_luci', 'lovilci_blata', 'vrata', 'soncni_pas', 'zamasek', 'celjusti']) K.deli(id, () => {});
        // ---- the rear bumper bar (a tube across on two brackets, its reflectors) ----
        K.part('bumperR', () => {
          K.cyl([-2.875, 0.72, -1.18], [-2.875, 0.72, 1.18], 0.075, [0.85, 0.12, 0.1], { n: 8 });   // (its back at the frame's end)
          for (const sd of [-1, 1]) { K.box(-2.84, 0.66, sd * 0.45, 0.16, 0.14, 0.1, 0, FRM); K.rect(-2.951, 0.72, sd * 0.95, 0.12, 0.06, [0.75, 0.05, 0.04], { dir: '-x' }); }
        }, { hinge: [[-2.8, 0.72, -0.45], [-2.8, 0.72, 0.45]] });
        // ---- inside (seen once a part is off): the seats, the dashboard, the wheel; the engine under the cab, the radiator behind the grille ----
        K.seat(2.0, 1.62, -0.55, { w: 0.55, back: 0.75 }); K.seat(2.0, 1.62, 0.55, { w: 0.55, back: 0.75 });
        K.box(2.55, 1.6, 0, 0.35, 0.35, 2.2, 0, D, null, false, { inner: true, part: 'body' });
        K.cyl([2.42, 1.98, -0.55], [2.32, 2.12, -0.55], 0.22, [0.1, 0.1, 0.11], { n: 8, inner: true, part: 'body' });
        K.engine(1.85, 0.7, 0, { l: 1.15, w: 0.8, h: 0.5, inner: true });
        K.box(2.68, 1.2, 0, 0.12, 0.7, 1.7, 0, [0.12, 0.12, 0.13], null, false, { inner: true, part: 'body' });
        for (const id of ['filter_zraka', 'akumulator', 'turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum']) K.deli(id, () => {});   // (the hidden parts: none stock)
      },
    },
  });
})();
