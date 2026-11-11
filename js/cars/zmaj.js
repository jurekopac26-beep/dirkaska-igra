/* Vehicle 'zmaj' — ZMAJ 85: a 1985 Group B short-wheelbase four-wheel-drive rally car. Signature features: 1) a short wheelbase with long
   overhangs, 2) huge front and rear wings, 3) a radiator grille in the front bumper, 4) boxy flared arches, 5) a roof vent and louvred
   rear window. L 4.24 W 1.80 H 1.34, wheelbase 2.22, overhangs F 0.95 R 1.07 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  // the garage's head lamp in the place of the rectangular lamp in the nose's black band (u out from the car's middle, v up; metres round
  // z 0.56, y 0.64): every option takes this outline
  const RECT = [[-0.18, -0.06], [0.18, -0.06], [0.18, 0.06], [-0.18, 0.06]];
  VEHICLE_DEFS.push({
    id: 'zmaj', name: 'ZMAJ 85', cat: 'reli', ord: 2, drive: 'AWD',
    desc: 'Relijska pošast skupine B iz leta 1985: kratka medosna razdalja in ogromna krila.',
    phys: { mass: 1090, a: 1.17, b: 1.05, kI: 1.12, kw: 350, redline: 8000, idle: 1000, gears: [3.3, 2.1, 1.48, 1.12, 0.9], final: 4.16, rw: 0.33, cDrag: 0.46, len: 4.24, wid: 1.8, steerMax: 0.64,
      tracK: 1.1, brakeK: 1.05, spinK: 0.3 },
    arc: { amax: 1.8, kv: 2.05, rmin: 4 },
    csp: { bx: 0.13, coast: -0.075, thr: -0.01, liftP: 0, pwr: 0.05, out: 1, turn: 1.08, w: 1 },   // (the AWD layer: steady, straightens quickly; its own bx, coast, thr, pwr, out, turn, w)
    stats: { power: 9, grip: 8, weight: 8, drift: 5 },
    price: 75000, pk: 'open', field: ['zmaj'],
    snd: { kind: 'i5', hz: 1, turbo: 1, loud: 1.2 },
    expect: { t100: [2.4, 2.82], vmax: [244, 259], latG: [2.3, 2.4], d100: [21.7, 24] },
    partNames: { grille: 'radiator grille', headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamp', tailR: 'right tail lamp', plate: 'number plate' },
    parts: { set: 'race', ht: 1.34, y0: 0.18,
      extra: {
        grille: { z: 0, th: 0.55, m: 4, r: 0.45, h: 0.1, lx: 0.97, lz: 0, y: 0.34 },
        // (as KOLIBRI's: the rectangular lamps in the nose's black band parts of their own, a hit on their corner knocks one out; the tail
        // lamps at the ends of the outlet grille likewise, each in its black surround; the number plate on the rear bumper)
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: 0.93, lz: -0.62, y: 0.64 },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: 0.93, lz: 0.62, y: 0.64 },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.17, h: 0.05, lx: -0.98, lz: -0.71, y: 0.74 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.17, h: 0.05, lx: -0.98, lz: 0.71, y: 0.74 },
        plate: { z: 1, th: 0.4, m: 1, r: 0.17, h: 0.02, lx: -1.0, lz: 0, y: 0.37, on: 'bumperR' },
      },
      // (the debris from where the look has the parts: the radiator low in the bumper, the bumper's middle, the boot lid behind the steep rear
      // glass, the wing high over it (knocked off before the lid it stands on swings open: 0.45 < 0.6 x 0.78; it lies on its plates' depth),
      // the doors and quarters up to their glass, the mirrors by the A-pillars)
      over: { bumperF: { lx: 0.93 }, trunk: { lx: -0.79, y: 0.96 }, wing: { lx: -0.89, y: 1.22, th: 0.45, h: 0.13 }, doorL: { y: 0.73 }, doorR: { y: 0.73 },
        quarterL: { y: 0.67 }, quarterR: { y: 0.67 }, mirrorL: { y: 0.94 }, mirrorR: { y: 0.94 } },
    },
    // where the garage's parts go (js/deli.js, look units): the wing on the boot lid's rear edge, in the wing's part (in place of the big wing
    // on its pylons); the head lamps in the place of the rectangular lamps (every option in their outline, RECT), in the lamps' parts; the rims
    mounts: {
      krilo: { x: -1.95, w: 0.74, part: 'wing' },
      zarometi: { x: 1.966, y0: 0.64, lean: 0, zc: 0.56, yc: 0.64, s: 0.5, hosts: ['headL', 'headR'], shape: RECT, bulge: 0, ringW: 0.012 },
      platisca: {},
      // (sklop 2, js/deli/spredaj.js) the kit round the deep bumpers (in place of the splitter, its end plates and dive planes: the lips
      // and the splitter the garage's, the second and the fourth keep the stock ones; skirts from flare to flare, its flares over the box
      // flares; the rear pieces tucked 3 cm under the bumper: the low tips pass through them out of sight), the bonnet's top from the
      // cowl to the nose (in place of its two vents), the grille's face on the radiator's box (17 cm of its 23: the honeycomb in three
      // rows, within 300 triangles), in its part; the indicators (stock: none) on the bumpers' faces by the grille and over the plate, on
      // the front flares, on the mirrors; the rally lamps in place of the fog lamps (the first four), in front of the nose's band, in the
      // lower intake's black strip, on the roof ahead of the vent, a pod over the nose
      aero: { xf: 2.08, xr: -2.09, w: 0.8, yf: 0.15, yr: 0.19, sill: [-0.56, 0.7], ws: 0.9, ys: 0.22, exh: [-0.52, 0.05] },
      hauba: { x0: 0.56, x1: 1.92, w: 0.7 },
      maska: { x: 2.09, y0: 0.335, lean: 0, yc: 0.335, w: 0.86, h: 0.17, part: 'grille' },
      zmigavci: { front: { x: 2.083, y: 0.42, z: 0.49, w: 0.07, h: 0.045, part: 'bumperF' }, side: { x: 0.8, y: 0.66, z: 0.903, host: 'body' },
        rear: { x: -2.123, y: 0.43, z: 0.62, part: 'bumperR' }, mirror: { x: 0.4855, y: 0.928, z: 0.9, w: 0.11, parts: ['mirrorL', 'mirrorR'] } },
      relijske_luci: { bumper: [2.075, 0.385, 0.62], nose: [1.962, 0.66], intake: [2.081, 0.19, 1.2, 0.04], roof: [-0.1, 0.6], pod: [1.99, 0.52, 0.75, 0.74], part: 'bumperF' },

      // (js/deli/zadaj.js) the tail lamps in the place of the lit lamps at the outlet grille's ends (their black surrounds kept, a black
      // housing out to the stock lamp's face under each: the garage's glass on it), the band across the tail over the grille (in the body:
      // the tail panel is the body's); the exhaust (the stock one on the left: z < 0; the flap valves on the tips: low under the tail,
      // beside them they would hang in the air); the boot lid's top between the rear glass and the wing; the tow points on the bumpers'
      // faces (in place of the stock eye: by the grille, by the plate, clear of the lips, the diffuser's fins and the rally lamps); the
      // mudflaps behind the wheels in the flares' parts (the front ones the fenders', the rear ones the quarters'), the sills' guards
      // along the doors between the flares
      zadnje_luci: { x: -2.073, zc: 0.64, yc: 0.74, w: 0.14, h: 0.3, s: 0.45, shape: [[-0.13, -0.065], [0.13, -0.065], [0.13, 0.065], [-0.13, 0.065]], hosts: ['tailL', 'tailR'],
        bar: { x: -2.071, y: 0.885, w: 0.55, part: 'body' } },
      auspuh: { x: -2.15, y: 0.2, z: 0.52, r: 0.05, len: 0.3, part: 'body', valve: true },
      prtljaznik: { x: [-2.06, -1.265], w: 0.72, part: 'trunk' },
      vlecne_kljuke: { f: [2.083, 0.28, -0.5], r: [-2.123, 0.36, 0.3] },
      lovilci_blata: { x: [0.8, -1.42], z: [0.65, 0.89], y: [0.37, 0.07], sill: [-0.5, 0.62, 0.245, 0.81], part: 'body', parts: ['fenderL', 'fenderR', 'quarterL', 'quarterR'] },

      // (js/deli/streha.js) no sunroof and no roof scoop: the roof is short (0.86 m between the glasses) and full (the cage's rails under
      // it, the start number, the vent; the longest scoops are longer than the roof); the aerials beside the number, the rods and the
      // whip mid-roof (raked back, they end short of the roof's rear edge: the louvres' blade over it), a stub behind the windscreen;
      // the louvres on the rear glass in place of the stock ones (the wing stands behind it, on the boot lid; their line 6 mm under the
      // glass's middle: the straight frame meets the crowned glass along its bars)
      antena: { x: -0.5, z: 0.42, fin: [-0.5, 0.42], front: [-0.2, 0.5], whip: -0.28 },
      zaluzije: { x0: -1.245, y0: 0.994, x1: -0.92, y1: 1.324, w: 0.62, part: 'body' },

      // (js/deli/bok.js) the mirrors (the stock one's housing; the garage's 5 cm on, on a foot on the A-pillar's black sail), the doors
      // (inside their shut lines between the flares, the sill to the belt; the handle; the glass from the B-pillar, its front edge leaning
      // back to the sail, its top 4 % under the frame: the nets hang from it; its frame), the brakes, the wheel nuts
      ogledala: { x: 0.44, y: 0.95, z: 0.9, w: 0.09, h: 0.07, d: 0.13, fwd: 0.05, up: 0.02, sail: [[0.55, 0], [0.36, 0], [0.4, 0.45], [0.52, 0.35]] },
      vrata: { x: [-0.49, 0.61], y: [0.33, 0.88], handle: [-0.38, 0.8, 0.828, 0.14, 0.025], win: [[-0.46, 0.08], [0.34, 0.08], [-0.04, 0.92], [-0.46, 0.92]], frame: [-0.48, -0.45, 0.88, 0.97] },
      zavore: { s: 1 },
      matice: { k: 4, r: 0.2 },

      // (sklop 3 · barve, js/deli/barve.js) the stripes over the bonnet and the boot lid, the outboard ones clear of the bonnet's vents
      // (none over the roof: the number and the vent fill it; the arches' cuts split the top in 24 strips, over all three the black-
      // edged pair would be 336 triangles); the decals over the low band (the doors, the front and rear flares), on the bonnet each side
      // of its vents (none on the roof: the number fills it), their stretches short of the flares' and the doors' cut-up ends, on the
      // bonnet's front half (the flames within 300 triangles); the sun strip in place of the banner (7 cm: lower down, the windscreen's
      // long flat panes rise over the crown's fall); the calipers; the fuel cap on the right rear flare (stock: none)
      barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {},
      crte: { z: [0.29, 0.47], x: [[-2.07, -1.245], [0.5, 1.96]] },
      nalepke: { side: [[-0.47, 0.45], [0.9, 1.4], [-1.4, -0.62]], y: [0.58, 0.78], hood: { x: [1.2, 1.84], z: [0.32, 0.6] } },
      soncni_pas: { x: [-0.06, 0.01] }, zamasek: { x: -0.9, y: 0.83, z: 0.901, r: 0.045 },
      celjusti: { r: [0.075, 0.14], a: [70, 125] },
      // (sklop 3 · skriti deli, js/deli/skriti.js: round the five ahead of the front axle; the filter against the block's left side, its
      // duct on the cam cover; the turbo on the block's front under the intercooler; the battery against the right inner wing; the ECU
      // against the bulkhead under the cowl)
      filter_zraka: { x: 1.2, y: 0.5, z: -0.32 }, akumulator: { x: 1.0, y: 0.42, z: 0.535 }, turbo: { x: 1.72, y: 0.34, z: 0.1 }, cip: { x: 0.53, y: 0.62, z: 0.15 },
      vzmeti: { in: 0.17, top: 0.74 }, amortizerji: { in: 0.17, top: 0.74 }, stabilizatorji: { in: 0.17, floor: 0.26 }, dim_gum: {},
    },
    // the look (KIT API v1, render.js; look units = metres): a three-box coupé loft, its sides stepped out over both axles (the box flares:
    // flat-faced, flat-topped, the doors set in between them), a long low nose over the five ahead of the front axle, an upright glasshouse
    // set back over the short wheelbase, a short boot under a full-width wing. The standard regions split the loft (the bonnet, the boot lid,
    // the fenders, the quarters, the doors with their glass, the bumpers' corners); the deep front bumper with its splitter, end plates and
    // dive planes ('bumperF'), the radiator box showing through it ('grille'), the rear wing ('wing'), the rear bumper, the mirrors drawn in
    // their parts; the roof vent and the louvres over the rear glass in the body
    look: {
      body: { len: 4.24, wid: 1.8, roofY: 1.335,
        //       x      w     yb    ybelt  wt    yt     cr     kind  tuck
        secs: [[-2.07, 0.83, 0.3, 0.86, 0.8, 0.95, 0.01, 'b', 0.1],      // the tail panel's top edge (the boot lid's rear edge)
          [-2.02, 0.86, 0.27, 0.88, 0.83, 0.97, 0.015, 'b', 0.1],
          [-1.66, 0.86, 0.24, 0.88, 0.83, 0.975, 0.02, 'b', 0.11],       // the rear flare's tail end (its taper)
          [-1.58, 0.9, 0.23, 0.88, 0.84, 0.975, 0.02, 'b', 0.11],        // the rear flare: its flat face, its flat top
          [-1.245, 0.9, 0.22, 0.88, 0.82, 0.98, 0.02, 'gr', 0.11],       // the rear glass's base (the boot lid's front edge; on the arch's own cut)
          [-0.92, 0.9, 0.22, 0.88, 0.66, 1.27, 0.06, 'r', 0.11],         // the roof's rear edge
          [-0.56, 0.9, 0.22, 0.88, 0.66, 1.275, 0.06, 'r', 0.11],        // the rear flare's front end (behind the B-pillar)
          [-0.5, 0.82, 0.22, 0.88, 0.66, 1.275, 0.06, 'r', 0.11],        // the door's rear edge: the door set in between the flares
          [-0.06, 0.82, 0.22, 0.88, 0.66, 1.27, 0.06, 'gf', 0.11],       // the windscreen's top
          [0.5, 0.82, 0.22, 0.84, 0.79, 0.87, 0.02, 'b', 0.11],          // the windscreen's base (the cowl; its side band not a flat sliver)
          [0.62, 0.82, 0.22, 0.84, 0.79, 0.86, 0.025, 'b', 0.11],        // the door's front edge
          [0.7, 0.9, 0.22, 0.8, 0.82, 0.85, 0.025, 'b', 0.11],           // the front flare
          [1.64, 0.9, 0.24, 0.79, 0.81, 0.83, 0.025, 'b', 0.11],         // its front end
          [1.74, 0.86, 0.26, 0.77, 0.79, 0.81, 0.025, 'b', 0.11],        // the nose's sides
          [1.96, 0.84, 0.3, 0.72, 0.76, 0.76, 0.02, 'b', 0.1]],          // the nose's face: the head lamps (the bumper juts out under it)
        eye: { x: -0.5, y: 1.1, style: 'closed' },
        door: [0.62, -0.5], bumpF: 0.22, bumpR: 0.05, bumpY: [0.52, 0.5],      // (the bumpers' regions end on sections: no extra cuts)
        decalX: -0.37, decalY: 1.333, decalRz: 0, decalS: 0.68,                         // (the start number on the roof ahead of the vent)
        cage: true },
      hi: true,   // (Nastavitve · Detajli avtov: Visoki: the small details and the driver at the end of build, the tyres in 64)
      budget: { inner: 1400 }, budgetHi: { inner: 1750 },   // (its cabin, K.cab's pieces: the inner block over a car's 800 / 1200; drawn only once a door opens, a pane breaks or a part is off)
      wheels: { style: 'std', spokes: 8, w: 0.235, rim: [0.86, 0.86, 0.84], cap: [0.3, 0.3, 0.32], gap: 0.06, seg: 32, segHi: 64 },
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, D = [0.1, 0.1, 0.11], DS = K.shade(P, 0.6);
        const XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;   // (between the arches: the sills)
        const vent = (x) => (x > 0.62 && x < 0.7) || (x > -0.56 && x < -0.5);                  // (the flares' tapers by the doors: an outlet, an intake)
        // ---- the shell: the paint; the windscreen, the side glass, the rear glass; dark sills, black arch ledges; the flares' inner ends black ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch ? B : at.x > XA && at.x < XB ? D : DS;
          if ((e === 1 || e === 7) && vent(at.x)) return B;
          if (kind === 'gf' && e >= 2 && e <= 6) return G;
          if (kind === 'r' && (e === 2 || e === 6)) return G;
          if (kind === 'gr' && e >= 3 && e <= 5) return G;
          return P;
        }, { caps: { front: { col: P }, rear: { col: P } } });
        const DC = L.decal;
        // the A- and B-pillars black, the C-pillar in paint (the quarter window ends ahead of it)
        DC.band([[-0.06, 0.86], [0.5, 0.86], [0.5, 1], [-0.06, 1]], B, null, 0.009);
        DC.band([[-0.58, 0], [-0.48, 0], [-0.48, 1], [-0.58, 1]], B, null, 0.01);
        DC.band([[-0.92, 0], [-0.76, 0], [-0.82, 1], [-0.92, 1]], P, null, 0.01);
        K.deli('soncni_pas', () => { for (const [za, zb] of [[-0.8, -0.24], [-0.24, 0.24], [0.24, 0.8]]) DC.top([[-0.06, za], [0.05, za], [0.05, zb], [-0.06, zb]], S, 0.008); });   // (a banner across the windscreen's top; the garage's in its place)
        // ---- the livery: a broad band in the stripe colour low along the side (broken by the arches); the numbers on the doors ----
        DC.side([[-1.62, 0.43], [1.72, 0.43], [1.72, 0.55], [-1.62, 0.55]], S, null, 0.006);
        // (the garage's doors in their place: mounts.vrata, the numbers on them, their own handles)
        const nums = (handles) => { for (const sd of [-1, 1]) { const f = sd < 0 ? '-z' : 'z', door = sd < 0 ? 'doorL' : 'doorR';
          K.number(0.04, 0.7, sd * 0.828, 0.24, { dir: f, w: 0.34, host: door });
          if (handles) K.rect(-0.38, 0.8, sd * 0.828, 0.14, 0.025, B, { dir: f, host: door }); } };   // (the handle at the door's rear edge)
        K.deli('vrata', () => nums(true), (n) => { if (n) nums(false); });
        for (const id of ['crte', 'nalepke', 'celjusti', 'zamasek']) K.deli(id, () => {});   // (stock: none; the garage's over the livery, the fuel cap)
        // ---- the nose: rectangular lamps in a black band right across, the bonnet's two vents ----
        K.rect(1.962, 0.64, 0, 1.62, 0.16, B);
        // (each lamp a part of its own: headL, headR; the garage's in their place: K.deli, mounts.zarometi)
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(1.968, 0.64, sd * 0.56, 0.06, { shape: 'rect', w: 0.36, h: 0.12, ring: [0.5, 0.51, 0.53], host: sd < 0 ? 'headL' : 'headR' }); });
        let hb = 0; K.part('hood', () => { hb = K.deli('hauba', () => {}); });   // (the garage's bonnet top in place of the vents: mounts.hauba)
        if (!hb) for (const sd of [-1, 1]) DC.top([[1.12, sd * 0.08], [1.44, sd * 0.08], [1.44, sd * 0.26], [1.12, sd * 0.26]], B, 0.006, { host: 'hood' });
        K.deli('zmigavci', () => {});   // (stock: none; the garage's on the bumpers, the flares, the mirrors)
        // ---- the front bumper: deep, in the paint, the radiator's box showing through its middle; the splitter right across under it, its end
        //      plates up the corners, a dive plane each side (the front wing); brake ducts low in its corners, the fog lamps over them ----
        const ring = (x, y0, y1, zw, c) => [[x, y0, -zw + c], [x, y0, zw - c], [x, y0 + c, zw], [x, y1 - c, zw], [x, y1, zw - c], [x, y1, -zw + c], [x, y1 - c, -zw], [x, y0 + c, -zw]];
        K.part('bumperF', () => {
          K.skin([ring(1.7, 0.17, 0.47, 0.87, 0.04), ring(2.02, 0.15, 0.52, 0.87, 0.05), ring(2.08, 0.17, 0.5, 0.8, 0.05)], P, B, P);
          // (the garage's kit in place of the splitter, its end plates and dive planes: mounts.aero; the second and the fourth keep them)
          const ae = K.deli('aero', () => {}), keepA = !ae || ae === 2 || ae === 4;
          if (keepA) K.wingPlank(2.16, 0.12, 1.84, 0.13, 0.024, -0.86, 0.86, B);
          K.rect(2.081, 0.19, 0, 1.5, 0.04, B);
          K.rect(2.083, 0.335, 0, 0.88, 0.25, B);   // (the opening the radiator fills: black once the grille is gone)
          const rl = K.deli('relijske_luci', () => {});   // (stock: none; the garage's first four in place of the fog lamps: mounts.relijske_luci)
          for (const sd of [-1, 1]) {
            if (keepA) { K.endplate([[2.16, 0.12], [2.16, 0.22], [1.98, 0.46], [1.86, 0.46], [1.86, 0.12]], sd * 0.878, 0.012, B);
              K.plate([[2.04, 0.34, sd * 0.86], [1.9, 0.4, sd * 0.86], [1.93, 0.37, sd * 0.93]], 0.01, B); }   // (the dive plane)
            K.rect(2.082, 0.26, sd * 0.6, 0.26, 0.1, B); if (!(rl >= 1 && rl <= 4)) K.discX(2.084, 0.41, sd * 0.62, 0.05, 8, K.lampHead, 1);
          }
        }, { hinge: [[1.9, 0.48, -0.75], [1.9, 0.48, 0.75]] });
        // ---- the radiator grille: the radiator's box behind the bumper, its mesh face through the bumper's middle ----
        K.part('grille', () => {
          K.box(2.025, 0.21, 0, 0.13, 0.25, 0.88, 0, D);
          K.deli('maska', () => K.grille(2.09, 0.335, 0, 0.86, 0.23, { slats: 5, col: B, slatCol: [0.24, 0.24, 0.26], frame: [0.3, 0.3, 0.32], frameH: 0.016 }));   // (the garage's face in its place: mounts.maska)
        }, { hinge: [[2.0, 0.44, -0.4], [2.0, 0.44, 0.4]] });
        // ---- the rear wing: a full-width plane high over the boot (dark: it stands out over the boot from behind), a band of the stripe colour
        //      along it, a black gurney; plates in the stripe colour at its tips, on two black pylons from the boot lid (open under it) ----
        K.part('wing', () => K.deli('krilo', () => {   // (the garage's wing in its place: K.deli, mounts.krilo)
          K.wingPlank(-1.7, 1.225, -2.1, 1.265, 0.04, -0.86, 0.86, D);
          K.face([[-1.9, 1.291, 0.86], [-1.9, 1.291, -0.86], [-2.02, 1.303, -0.86], [-2.02, 1.303, 0.86]], S);   // (facing up, 6 mm over the plane)
          K.rect(-2.102, 1.315, 0, 1.72, 0.03, B, { dir: '-x' });
          for (const sd of [-1, 1]) {
            K.endplate([[-1.66, 1.17], [-1.68, 1.29], [-1.79, 1.34], [-2.14, 1.34], [-2.14, 1.17]], sd * 0.872, 0.014, S);
            K.endplate([[-1.79, 0.975], [-1.83, 1.25], [-1.97, 1.27], [-1.95, 0.975]], sd * 0.5, 0.03, B);
          }
        }), { noCrush: true, noDent: true, hinge: [[-1.8, 0.98, -0.5], [-1.8, 0.98, 0.5]] });   // (it swings back about the pylons' feet)
        // ---- the roof vent (a scoop at the roof's rear, its mouth forward), the louvres over the rear glass ----
        const sc = (x, h, w) => [[x, 1.322, -w], [x, 1.322, w], [x, 1.322 + h, w - 0.02], [x, 1.322 + h, -w + 0.02]];
        K.skin([sc(-0.93, 0.004, 0.15), sc(-0.8, 0.045, 0.19), sc(-0.71, 0.052, 0.2)], S, null, B);
        let zl = 0; K.part('body', () => { zl = K.deli('zaluzije', () => {}); });   // (the garage's louvres in place of these: mounts.zaluzije)
        if (!zl) for (let i = 0; i < 4; i++) { const x0 = -1.215 + i * 0.075, x1 = x0 + 0.038;
          for (const [za, zb] of [[-0.9, -0.24], [-0.24, 0.24], [0.24, 0.9]]) DC.top([[x0, za], [x1, za], [x1, zb], [x0, zb]], B, 0.012); }
        K.part('body', () => K.deli('antena', () => {}));   // (stock: none; the garage's on the roof: mounts.antena)
        // ---- the tail: the radiators' outlet grille right across, the lamps at its ends, the plate; the rear bumper, its tow eye; the exhaust ----
        K.grille(-2.072, 0.74, 0, 1.0, 0.16, { dir: -1, slats: 3, col: B });
        const tails = (lit) => { for (const sd of [-1, 1]) { const tp = sd < 0 ? 'tailL' : 'tailR';   // (each a part of its own, its black surround with it)
          K.rect(-2.071, 0.74, sd * 0.64, 0.3, 0.18, B, { dir: '-x', host: tp });
          if (lit) K.tailLamp(-2.073, 0.74, sd * 0.64, 0.26, 0.13, { host: tp });
          else K.box(-2.08, 0.675, sd * 0.64, 0.02, 0.13, 0.26, 0, B, null, false, { host: tp }); } };   // (the garage's: a black housing out to the stock lamp's face, its glass on it)
        K.deli('zadnje_luci', () => tails(true), (n) => { if (n) tails(false); });   // (the garage's lamps in the lit ones' place, in their surrounds: mounts.zadnje_luci)
        K.box(-2.119, 0.315, 0, 0.006, 0.11, 0.5, 0, [0.93, 0.93, 0.9], null, true, { part: 'plate' });   // (the plate: a thin plate, a part of its own on the bumper)
        K.part('bumperR', () => {
          K.skin([ring(-2.12, 0.21, 0.47, 0.8, 0.04), ring(-2.07, 0.19, 0.5, 0.87, 0.05), ring(-1.84, 0.21, 0.48, 0.87, 0.04)], P, P, B);
          // the tow eye (the garage's tow points in its place: mounts.vlecne_kljuke; over the garage's diffuser with its kit)
          const vk = K.deli('vlecne_kljuke', () => {});
          if (!vk) K.box(-2.12, K.fitted && K.fitted.aero ? 0.25 : 0.16, 0.3, 0.06, 0.05, 0.08, 0, K.rgb(0xd8261c));
        }, { hinge: [[-2.0, 0.48, -0.75], [-2.0, 0.48, 0.75]] });
        K.deli('auspuh', () => K.exhaust(-2.15, 0.2, -0.52, 0.05, 0.3, { part: 'body', n: 6 }));   // (the garage's in its place: mounts.auspuh, mirrored)
        K.part('trunk', () => K.deli('prtljaznik', () => {}));   // (stock: none; the garage's on the boot lid: mounts.prtljaznik)
        // ---- the mud flaps behind the wheels, the mirrors ----
        // (the garage's in their places and parts: mounts.lovilci_blata, mounts.ogledala)
        K.deli('lovilci_blata', () => { for (const sd of [-1, 1]) for (const x of [0.8, -1.42]) K.box(x, 0.07, sd * 0.77, 0.01, 0.3, 0.24, 0, D, null, true); });
        K.deli('ogledala', () => { for (const sd of [-1, 1]) K.mirror(0.44, 0.95, sd * 0.9, { col: P, arm: B, w: 0.09, h: 0.07, d: 0.13, crack: 1 }); });
        K.hinge('hood', [0.52, 0.88, -0.6], [0.52, 0.88, 0.6]);
        K.hinge('trunk', [-1.25, 0.99, -0.6], [-1.25, 0.99, 0.6]);
        K.hinge('doorL', [0.6, 0.4, -0.82], [0.6, 0.85, -0.82]); K.hinge('doorR', [0.6, 0.4, 0.82], [0.6, 0.85, 0.82]);
        // ---- Visoki (Nastavitve · Detajli avtov: Visoki; the player's and the showroom's car): a generic badge on the nose (no make's), the
        //      head lamps' bulbs, the tail lamps' bars, the doors' shut line at the sill; the driver at the wheel in his suit and helmet ----
        if (K.hi) {
          const C = K.cab, F = K.fitted, LR = (n, sd) => n + (sd < 0 ? 'L' : 'R');   // (F: a garage part in a detail's place: none of it there)
          if (!F.maska) C.badge(1.962, 0.72, 0, 1, 'body', 0.026);
          for (const sd of [-1, 1]) {
            DC.side([[-0.49, 0.3], [0.61, 0.3], [0.61, 0.308], [-0.49, 0.308]], D, [sd], 0.009, { host: LR('door', sd) });
            if (!F.zarometi) for (const z of [0.46, 0.66]) K.discX(1.972, 0.64, sd * z, 0.014, 6, [1, 0.99, 0.94], 1, { host: LR('head', sd) });
            if (!F.zadnje_luci) K.rect(-2.0745, 0.74, sd * 0.64, 0.22, 0.008, [0.3, 0.02, 0.03], { dir: '-x', host: LR('tail', sd) }); }
          K.driver(-0.44, 1.12, -0.34, { inner: true, r: 0.115, lean: 0.24, hands: [0.145, 0.865, 0.15], knee: [0.32, 0.64, 0.16], feet: [0.7, 0.36, 0.11], suit: [0.62, 0.08, 0.07], helmet: [0.95, 0.95, 0.93] });
        }
        // ---- inside (seen once a part is off): the stripped floor and bulkhead, the bucket seats in their shells with harnesses, the race
        //      dashboard and its wheel (left-hand drive), the sequential lever, the pedals, the plain door cards with straps, the roll cage,
        //      the extinguisher; the five ahead of the front axle, its intercooler ----
        { const C = K.cab, IN = C.IN, SZ = -0.34, FL = [0.16, 0.16, 0.17], SH = [0.07, 0.07, 0.075], SC = [0.13, 0.13, 0.15];
          C.face([[-1.24, 0.26, -0.72], [0.78, 0.26, -0.72], [0.78, 0.26, 0.72], [-1.24, 0.26, 0.72]], FL, [0, 1, 0]);
          C.face([[0.78, 0.26, -0.72], [0.78, 0.26, 0.72], [0.78, 0.82, 0.72], [0.78, 0.82, -0.72]], FL, [-1, 0, 0]);
          C.face([[-1.24, 0.26, 0.72], [-1.24, 0.26, -0.72], [-1.24, 0.86, -0.72], [-1.24, 0.86, 0.72]], FL, [1, 0, 0]);
          K.box(0.2, 0.26, 0, 1.1, 0.14, 0.2, 0, C.PL2, C.PL, true, IN);   // (the tunnel)
          C.dash({ x: 0.36, y: 0.84, d: 0.36, w: 0.7, dz: SZ, col: [0.08, 0.08, 0.085], col2: [0.13, 0.13, 0.14], style: 'race' });
          C.steer({ c: [0.16, 0.86, SZ], ax: [0.75, -0.66], r: 0.16, rr: 0.016, to: [0.36, 0.74, SZ] });
          for (const sd of [-1, 1]) { K.box(-0.42, 0.26, sd * 0.34, 0.36, 0.2, 0.36, 0, C.PL, null, true, IN);
            C.seat(-0.42, 0.46, sd * 0.34, { w: 0.46, top: 0.68, lean: 0.18, shell: true, belt: 'harness', col: SH, col2: SC, strap: [0.75, 0.08, 0.07] }); }
          C.console(0.22, 0.4, { l: 0.3, seq: true, brake: true });
          C.pedals(0.74, 0.29, SZ, 3);
          for (const sd of [-1, 1]) C.door(sd, { x: [-0.48, 0.6], y: [0.36, 0.84], z: 0.74, insert: FL, crank: false, speaker: false, strap: [0.75, 0.08, 0.07] });
          const cg = [];
          for (const sd of [-1, 1]) cg.push([[-0.66, 0.26, sd * 0.7], [-0.66, 1.2, sd * 0.56]], [[0.4, 0.26, sd * 0.7], [0.4, 0.84, sd * 0.7]], [[0.4, 0.84, sd * 0.7], [-0.02, 1.2, sd * 0.56]],
            [[-0.02, 1.2, sd * 0.56], [-0.66, 1.2, sd * 0.56]], [[0.4, 0.7, sd * 0.72], [-0.66, 0.4, sd * 0.72]]);
          cg.push([[-0.66, 1.2, -0.56], [-0.66, 1.2, 0.56]], [[-0.02, 1.2, -0.56], [-0.02, 1.2, 0.56]], [[-0.66, 0.26, -0.7], [-0.66, 1.2, 0.56]]);
          K.cage(cg, 0.022, [0.78, 0.79, 0.82], { n: 4, noCrush: true, noDent: true });   // (the main hoop, the A-pillar bars, the roof rails, the door bars, a diagonal)
          K.cyl([0.12, 0.3, 0.3], [0.12, 0.3, 0.02], 0.06, K.rgb(0xc81e1e), { n: 6, inner: true, part: 'body' });   // (the fire extinguisher on the floor)
          C.nose({ x: 1.86, w: 0.6, y: [0.26, 0.6], bar: 2.0, barY: 0.3, barW: 1.2 });
          C.tail({ x: -2.0, w: 0.62, y: [0.32, 0.66], bar: -2.05, barY: 0.34, barW: 1.2 }); }
        K.engine(1.38, 0.3, 0, { l: 0.62, w: 0.4, h: 0.4 });
        K.box(1.78, 0.5, 0, 0.1, 0.22, 0.62, 0, [0.55, 0.56, 0.58], null, false, { inner: true, part: 'body' });   // (the intercooler)
        // (stock: none of the garage's hidden parts; theirs in their places: K.deli, js/deli/skriti.js)
        for (const id of ['filter_zraka', 'akumulator', 'turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum']) K.deli(id, () => {});
      },
    },
  });
})();
