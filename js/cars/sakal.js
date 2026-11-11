/* Vehicle 'sakal' — ŠAKAL D: a modern professional drift coupe (invented; no real model). Signature features: 1) the wide bolted-on
   arches front and rear, dark, the dark skirts between them, 2) the big black wing high over the boot lid on two tall uprights, with big
   endplates, 3) the low front bumper with a wide mouth, the splitter and the dive planes on its corners, the slim lamps over it, 4) the
   dark vent in the middle of the long bonnet, 5) the livery: the paint over the top, a dark side from the door back, the start number on
   the roof and on both doors, 6) the tail: slim lamps on the corners, a dark bar between them, the finned diffuser, one big pipe, the
   orange tow strap. L 4.50 W 2.00 H 1.28, wheelbase 2.58, overhangs F 0.98 R 0.94 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'sakal', name: 'ŠAKAL D', cat: 'sportni', ord: 7, drive: 'FR',
    desc: 'Sodoben tekmovalni drift kupe: široki blatniki, veliko krilo in velik zasuk koles.',
    // the FR layer turned up for sliding: a big slide for the same turn (tv), held long (out), swung round by the power (pwr) and by a
    // lift (liftP); a tight lock (rmin, w; steerMax: the wheels' angle, 40 % over the SOKOL R's). spinK at the roster's 0.3 (above 300
    // W/kg: else the rear wheels would spin all the time; the slide comes from pwr). The best of the fleet in the driving school's
    // drift. Short gears: the redline in sixth is at 257 km/h. No speed limiter: the drag alone (cDrag 0.56, the wide body and the big
    // wing) holds the top speed there, so the engine's upgrades take it on (263 / 270 / 277 km/h)
    phys: { mass: 1350, a: 1.26, b: 1.32, kI: 1.15, kw: 560, redline: 8200, idle: 950, gears: [2.9, 2.05, 1.58, 1.28, 1.07, 0.92], final: 4.45, rw: 0.34, cDrag: 0.56, len: 4.5, wid: 2.0, steerMax: 0.87,
      tracK: 1.1, brakeK: 1.08, spinK: 0.3 },
    arc: { amax: 1.76, kv: 2.0, rmin: 3.9 },
    csp: { bx: 0.18, coast: -0.035, thr: 0.04, liftP: 0.18, pwr: 0.16, out: 1.5, turn: 1.08, w: 1.04, tv: 1.25 },
    stats: { power: 10, grip: 7, weight: 6, drift: 10 },
    price: 180000, pk: 'unl', field: ['sakal'],
    snd: { kind: 'i6', hz: 1.1, turbo: 1, loud: 1.15 },
    expect: { t100: [3.05, 3.45], vmax: [246, 262], latG: [2.2, 2.3], d100: [21.6, 23.4] },   // (measured 3.27 / 257 / 2.25 / 22.1)
    partNames: { splitter: 'front splitter', headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamp', tailR: 'right tail lamp' },
    // the race set (the wing a part of its own) and its own: the splitter under the nose, each head lamp and each tail lamp a part of its own
    parts: { set: 'race', ht: 1.28, y0: 0.2,
      extra: {
        splitter: { z: 0, th: 0.45, m: 3, rW: 0.42, h: 0.04, lx: 0.98, lz: 0, y: 0.18 },
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: 1.0, lz: -0.6, y: 0.5 },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: 1.0, lz: 0.6, y: 0.5 },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: -1.0, lz: -0.64, y: 0.78 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: -1.0, lz: 0.64, y: 0.78 },
      },
      over: { trunk: { lx: -0.91, y: 0.86 },
        quarterL: { h: 0.11 }, quarterR: { h: 0.11 }, wing: { h: 0.13 } } },   // (the pieces' real thickness lying on the road: a quarter with its flare, the wing with its uprights and endplates)   // (the boot lid: the short deck behind the rear glass)
    // where the garage's parts go (js/deli.js, look units): the wing on the boot lid's trailing edge, in the wing's part (in place of the
    // big wing on its uprights); the head lamps where the slim lamps are, in the lamps' parts; the rims on its wheels
    mounts: {
      krilo: { x: -2.21, w: 0.84, front: -1.84, part: 'wing' },
      zarometi: { x: 2.243, y0: 0.5, lean: 0, zc: 0.6, yc: 0.5, s: 0.34, hosts: ['headL', 'headR'], depth: 0.04 },
      platisca: {},
      // (sklop 2 · spredaj, js/deli/spredaj.js) the bumpers' faces and feet (the front piece in the splitter's part, the stock splitter its
      // lip), the dark skirts between the flares; the bonnet between its shut lines (in place of the vent); the black bar's room between the
      // lamps; the indicators (none stock) under the lamps, on the fenders ahead of the flares, in the tail's face; the extra lamps in the side
      // intakes, between the lamps, in the mouth, at the roof's front edge, a pod on the nose
      aero: { xf: 2.24, xr: -2.26, w: 0.77, yf: 0.19, yr: 0.24, sill: [-0.85, 0.79], ws: 0.884, ys: 0.22, lipF: [2.16, 0.17, 0.32, 0.025, 1.9], exh: [0.38, 0.07], partF: 'splitter', archIn: -0.01 },
      hauba: { x0: 1.02, x1: 2.05, w: 0.62, bulge: 0.6 },
      maska: { x: 2.242, y0: 0.5, lean: 0, yc: 0.5, w: 0.8, h: 0.04, part: 'body' },
      zmigavci: { front: { x: 2.243, y: 0.45, z: 0.6, w: 0.12, h: 0.025, part: 'body' }, side: { x: 1.86, y: 0.58, z: 0.934, hosts: ['fenderL', 'fenderR'] },
        rear: { x: -2.262, y: 0.68, z: 0.6, part: 'body' }, mirror: { x: 0.7155, y: 0.895, z: 1.0, w: 0.12, parts: ['mirrorL', 'mirrorR'] } },
      relijske_luci: { bumper: [2.236, 0.3, 0.74], nose: [2.215, 0.5], foot: 0.3, intake: [2.243, 0.32, 1.24, 0.2], roof: [0.02, 0.48], pod: [2.243, 0.42, 0.6, 0.5], part: 'bumperF' },
      // (js/deli/zadaj.js) the tail lamps' rooms in their black surrounds on the corners, the dark bar between them; the big pipe on the right
      // (on the rear bumper); the tow points (the rear in place of the orange strap); the flaps behind the wheels (no boot lid's kit: the
      // wing stands on it, as KOZOROG's)
      zadnje_luci: { x: -2.245, zc: 0.6, yc: 0.78, w: 0.14, h: 0.3, s: 0.6, shape: [[-0.17, -0.045], [-0.17, 0.045], [0.16, 0.03], [0.16, -0.045]], hosts: ['tailL', 'tailR'], bar: { x: -2.267, y: 0.78, w: 0.4, h: 0.03, part: 'trunk' } },
      auspuh: { x: -2.3, y: 0.33, z: -0.38, r: 0.06, len: 0.2, part: 'bumperR', drum: 0.227, drumX: -1.93, pipe: 0.258, valve: true },
      vlecne_kljuke: { f: [2.243, 0.3, 0.42], r: [-2.262, 0.42, -0.62] },
      lovilci_blata: { x: [0.86, -1.72], z: [0.66, 0.9], y: [0.33, 0.09], sill: [-0.82, 0.76, 0.22, 0.874], part: 'body' },
      // (js/deli/streha.js) the roof from its rear edge to the windscreen's top; the scoop's mouth; the aerials (none stock: in the body); the
      // louvres on the rear glass (ahead of the wing)
      streha: { x0: -0.93, x1: 0.1, xf: 0.06, xr: -0.59 },
      stresna_zajemalka: { x: 0.05, z: 0 },
      antena: { x: -0.45, z: 0.36, fin: [-0.55, -0.5], front: [-0.1, 0.47], whip: -0.3, part: 'body' },
      zaluzije: { x0: -1.8, y0: 0.973, x1: -0.98, y1: 1.23, w: 0.493, part: 'body' },
      // (js/deli/bok.js) the small black mirrors, the doors inside their shut lines, the handles, the door glass from its rear edge to the
      // A-pillar's line
      ogledala: { x: 0.66, y: 0.92, z: 1.0, w: 0.11, h: 0.085, d: 0.15, z0: 0.875, fwd: 0.04, up: 0.01 },
      vrata: { x: [-0.725, 0.86], y: [0.38, 0.83], handle: [-0.66, 0.8, 0.94, 0.13, 0.025],
        win: [[-0.7, 0.07], [0.55, 0.07], [0.1, 0.7], [0.05, 0.9], [-0.7, 0.9]], frame: [-0.725, -0.7, 0.9, 0.975] },
      zavore: { s: 1 },
      matice: { k: 5, r: 0.2 },
      // (sklop 3 · barve, js/deli/barve.js) the stripes; the decals on the doors ahead of the number, on the fenders ahead of the flares and
      // the quarters behind the rear ones, on the bonnet ahead of the vent and on the roof; the sun strip on the windscreen's top; the
      // calipers; the fuel cap on the right quarter behind the door (none stock)
      barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {},
      crte: { z: [0.24, 0.38], sx: [-1.05, 0.95] },
      nalepke: { side: [[0.47, 0.8], [1.76, 1.99], [-2.18, -1.84]], y: [0.5, 0.86], hood: { x: [1.62, 1.98], z: [0.26, 0.46] }, roof: { x: [-0.93, 0.05] } },
      soncni_pas: { x: [0.1, 0.24] }, zamasek: { x: -0.9, y: 0.771, z: 0.939, r: 0.045 },
      celjusti: { r: [0.085, 0.16], a: [70, 125] },
      // (sklop 3 · skriti deli, js/deli/skriti.js) round the long six in the bay; the struts and bars at the wheels
      filter_zraka: { x: 1.5, y: 0.55, z: -0.34 }, akumulator: { x: 1.85, y: 0.27, z: 0.5, back: true }, turbo: { x: 1.78, y: 0.45, z: 0.1 }, cip: { x: 0.84, y: 0.66, z: 0.45 },
      vzmeti: { in: 0.14, top: 0.77 }, amortizerji: { in: 0.13, top: 0.74 }, stabilizatorji: { in: 0.13, floor: 0.236 }, dim_gum: {},
    },
    // the look: a loft through the sections below (look units = metres: the centre of mass at x 0, the axles at 1.26 / -1.32), the standard
    // regions split it into the parts (bumpers, bonnet, boot lid, fenders, quarters, doors with their glass), the details on top (KIT API v1,
    // render.js). Seen from the chase camera: the wing over the boot lid, the wide dark arches, the number on the roof, the lamps
    look: {
      body: { len: 4.5, wid: 2.0, roofY: 1.28,
        //       x      w     yb    ybelt  wt    yt    cr    kind  tuck
        secs: [[-2.26, 0.86, 0.27, 0.74, 0.76, 0.84, 0.02, 'b', 0.1],    // the tail's face: the lamps along its top, the diffuser under it
          [-2.21, 0.92, 0.26, 0.79, 0.84, 0.9, 0.02, 'b', 0.1],          // the boot lid's trailing edge (a small lip)
          [-1.84, 0.95, 0.25, 0.82, 0.76, 0.95, 0.03, 'gr', 0.1],        // the rear glass's foot; the haunches over the rear wheels
          [-0.98, 0.94, 0.25, 0.85, 0.58, 1.22, 0.04, 'r', 0.1],         // the roof's rear edge
          [-0.38, 0.93, 0.25, 0.86, 0.58, 1.24, 0.04, 'r', 0.1],         // the roof's top
          [0.1, 0.93, 0.25, 0.85, 0.6, 1.22, 0.04, 'gf', 0.1],           // the windscreen's top
          [0.9, 0.94, 0.26, 0.8, 0.77, 0.85, 0.04, 'b', 0.1],            // its base (the cowl)
          [1.72, 0.95, 0.25, 0.74, 0.79, 0.78, 0.04, 'b', 0.09],         // the long bonnet over the front wheels
          [2.08, 0.91, 0.22, 0.66, 0.74, 0.7, 0.03, 'b', 0.08],          // the nose's top
          [2.24, 0.84, 0.19, 0.56, 0.66, 0.6, 0.02, 'b', 0.07]],         // the nose's face: the mouth
        eye: { x: -0.42, y: 1.04 },
      },
      wheels: { style: 'deep', w: 0.27, wR: 0.29, rim: [0.62, 0.48, 0.26], gap: 0.03 },
      build(K) {
        const P = K.paint, B = K.black, G = K.GLASS, DK = [0.08, 0.08, 0.09], D = [0.12, 0.12, 0.13];
        // the shell: the paint; the glass (the windscreen, the side windows along the roof, the rear glass); the sills dark between the
        // arches, the paint's shade under the bumpers' corners
        const XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;
        const L = K.loft(K.secs(K.body.secs), (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch || (at.x > XA && at.x < XB) ? DK : K.shade(P, 0.55);
          if (kind === 'gf' && e >= 2 && e <= 6) return G;
          if (kind === 'r' && (e === 2 || e === 6)) return G;
          if (kind === 'gr' && e >= 3 && e <= 5) return G;
          return P;
        }, { caps: { front: { col: P }, rear: { col: P } } });
        const DC = L.decal;
        // the livery: the side dark from the door back (a slash rising forward over the door), the dark skirts from arch to arch, the
        // B-pillar black, the start number on both doors; the doors' handles
        DC.side([[-1.72, 0.36], [0.38, 0.36], [0.86, 0.79], [-1.72, 0.79]], DK, null, 0.008);
        DC.side([[XA + 0.03, 0.3], [XB - 0.03, 0.3], [XB - 0.03, 0.38], [XA + 0.03, 0.38]], B, null, 0.006);
        DC.band([[-0.95, 0], [-0.84, 0], [-0.84, 1], [-0.95, 1]], B, null, 0.01);
        for (const sd of [-1, 1]) K.number(0.25, 0.6, sd * 0.94, 0.28, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' });
        // (the garage's doors in the handles' place: K.deli, mounts.vrata; its indicators, stripes, decals, sun strip, calipers and fuel cap:
        // zmigavci, crte, nalepke, soncni_pas, celjusti, zamasek, none stock)
        K.deli('vrata', () => { for (const sd of [-1, 1]) K.rect(-0.66, 0.8, sd * 0.94, 0.13, 0.025, B, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' }); });
        for (const id of ['zmigavci', 'crte', 'nalepke', 'soncni_pas', 'celjusti', 'zamasek']) K.deli(id, () => {});
        // the wide bolted-on arches, dark, front and rear
        for (const A of K.arches) for (const sd of [-1, 1]) K.flare(A.x, 0.37, 0.47, sd * 0.88, sd * 1.0, DK);
        // the long bonnet: the dark vent in its middle (the heat out of the bay), its louvres (the garage's bonnet in its place: mounts.hauba)
        K.part('hood', () => K.deli('hauba', () => {
          DC.top([[1.12, -0.3], [1.56, -0.3], [1.56, 0.3], [1.12, 0.3]], DK, 0.004);
          for (let i = 0; i < 4; i++) { const x = 1.18 + i * 0.1; DC.top([[x, -0.27], [x + 0.03, -0.27], [x + 0.03, 0.27], [x, 0.27]], [0.2, 0.2, 0.21], 0.006); }
        }));
        // the nose: the slim lamps on its corners (each a part of its own; the garage's lamps in their place: K.deli, mounts.zarometi)
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(2.243, 0.5, sd * 0.6, 0.05, { shape: 'rect', w: 0.34, h: 0.06, ring: null, host: sd < 0 ? 'headL' : 'headR' }); });
        K.part('body', () => K.deli('maska', () => K.rect(2.242, 0.5, 0, 0.82, 0.04, B)));   // (the garage's grille in its place, in the body: mounts.maska)
        // the front bumper: the wide mouth, the dive planes on its corners
        K.part('bumperF', () => {
          K.grille(2.243, 0.32, 0, 1.24, 0.2, { slats: 3 });
          for (const sd of [-1, 1]) { K.rect(2.243, 0.3, sd * 0.74, 0.12, 0.16, B); K.box(2.12, 0.36, sd * 0.86, 0.22, 0.02, 0.16, 0, DK); }
        }, { hinge: [[2.16, 0.3, -0.75], [2.16, 0.3, 0.75]] });
        // the splitter under the nose (a part of its own; the garage's kit in its place: K.deli, mounts.aero, the splitter its stock lip)
        K.part('splitter', () => K.deli('aero', () => K.box(2.16, 0.17, 0, 0.32, 0.025, 1.9, 0, DK)), { hinge: [[2.0, 0.19, -0.8], [2.0, 0.19, 0.8]] });
        // the tail: the slim lamps on the corners in black surrounds (each a part of its own), the dark bar between them, the rain light
        // (the garage's lamps in the lamps' place, the surrounds stay: K.deli, mounts.zadnje_luci)
        for (const sd of [-1, 1]) K.rect(-2.265, 0.78, sd * 0.6, 0.36, 0.1, B, { dir: '-x', part: sd < 0 ? 'tailL' : 'tailR' });
        K.deli('zadnje_luci', () => { for (const sd of [-1, 1]) K.tailLamp(-2.27, 0.78, sd * 0.6, 0.32, 0.06, { host: sd < 0 ? 'tailL' : 'tailR' }); });
        K.rect(-2.265, 0.78, 0, 0.84, 0.05, B, { dir: '-x', part: 'trunk' });
        // the big wing: black, high over the boot lid on two tall uprights, its big endplates (a part of its own; the garage's wing in its
        // place: K.deli, mounts.krilo)
        K.part('wing', () => K.deli('krilo', () => {
          K.wingPlank(-1.98, 1.17, -2.34, 1.2, 0.035, -0.9, 0.9, B);
          for (const sd of [-1, 1]) {
            K.endplate([[-1.94, 1.06], [-2.39, 1.06], [-2.39, 1.29], [-1.94, 1.26]], sd * 0.91, 0.012, B);
            K.endplate([[-2.0, 0.9], [-2.17, 0.89], [-2.2, 1.17], [-2.08, 1.18]], sd * 0.42, 0.016, DK);
          }
        }), { noCrush: true, noDent: true, hinge: [[-2.08, 0.9, -0.45], [-2.08, 0.9, 0.45]] });
        // the rear bumper: the finned diffuser, the big pipe on the right, the orange tow strap on the left
        K.part('bumperR', () => {
          K.box(-2.2, 0.17, 0, 0.16, 0.14, 1.5, 0, DK);
          for (const z of [-0.45, -0.15, 0.15]) K.box(-2.22, 0.17, z, 0.2, 0.13, 0.02, 0, DK);
          K.deli('auspuh', () => K.exhaust(-2.3, 0.3, 0.38, 0.06, 0.2));   // (the garage's in its place: mounts.auspuh)
          K.deli('vlecne_kljuke', () => K.rect(-2.267, 0.42, -0.62, 0.05, 0.13, K.rgb(0xff7a12), { dir: '-x' }));   // (the garage's tow points: mounts.vlecne_kljuke)
        }, { hinge: [[-2.2, 0.3, -0.7], [-2.2, 0.3, 0.7]] });
        // the small black mirrors
        K.deli('ogledala', () => { for (const sd of [-1, 1]) K.mirror(0.66, 0.92, sd * 1.0, { col: B }); });   // (the garage's: mounts.ogledala)
        // (none stock: the garage's extra lamps, sunroof, roof scoop, aerials and louvres (in the body), mud flaps: K.deli, their mounts)
        for (const id of ['relijske_luci', 'streha', 'stresna_zajemalka', 'lovilci_blata']) K.deli(id, () => {});
        K.part('body', () => { K.deli('antena', () => {}); K.deli('zaluzije', () => {}); });
        K.hinge('hood', [0.92, 0.86, -0.6], [0.92, 0.86, 0.6]);
        K.hinge('trunk', [-1.84, 0.95, -0.6], [-1.84, 0.95, 0.6]);
        K.hinge('doorL', [0.86, 0.4, -0.92], [0.86, 0.82, -0.92]); K.hinge('doorR', [0.86, 0.4, 0.92], [0.86, 0.82, 0.92]);
        // inside (seen once a part is off): the bucket seats, the cage, the dashboard, the long six in the bay
        for (const sd of [-1, 1]) K.seat(-0.48, 0.42, sd * 0.38, { w: 0.48, back: 0.75 });
        K.cage([[[-0.9, 0.35, -0.7], [-0.9, 1.15, -0.55]], [[-0.9, 0.35, 0.7], [-0.9, 1.15, 0.55]], [[-0.9, 1.15, -0.55], [-0.9, 1.15, 0.55]],
          [[-0.9, 1.15, -0.55], [0.3, 1.14, -0.58]], [[-0.9, 1.15, 0.55], [0.3, 1.14, 0.58]]], 0.02, [0.85, 0.85, 0.86]);
        K.box(0.65, 0.6, 0, 0.3, 0.22, 1.5, 0, D, null, false, { inner: true, part: 'body' });
        K.engine(1.35, 0.32, 0, { l: 0.75, w: 0.5, h: 0.5 });
        // (the garage's hidden parts round the engine and at the wheels, none stock: K.deli, js/deli/skriti.js)
        for (const id of ['akumulator', 'filter_zraka', 'turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum']) K.deli(id, () => {});
      },
    },
  });
})();
