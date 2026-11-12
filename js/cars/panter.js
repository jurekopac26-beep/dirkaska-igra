/* Vehicle 'panter' — PANTER 6: a rear-engined six-cylinder sports coupe. Signature features: 1) round upright headlamps in high front
   wings, 2) a sloping fastback running down to the engine lid, 3) a whale-tail spoiler on the engine lid, 4) wide rear wings over the
   driven wheels, 5) a full-width tail-light bar. L 4.25 W 1.77 H 1.30, wheelbase 2.27, overhangs F 0.88 R 1.10 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  // the head lamp's outline: each wing's whole nose (its front face at x 2.04, from the crest down to the belt and the lid's edge, 1 cm in
  // from its edges, the lower corners rounded off; u out from the car's middle, v up; metres round z 0.605, y 0.61): the stock lamp and
  // the garage's (star-shaped round its middle: the shoulder's notch over the lid)
  const LAMP = [[0.1666, -0.0845], [0.1222, 0.0843], [-0.0002, 0.155], [-0.0641, 0.049], [-0.2359, -0.0808], [-0.222, -0.0882], [0.152, -0.0915]];
  VEHICLE_DEFS.push({
    id: 'panter', name: 'PANTER 6', cat: 'sportni', ord: 2, drive: 'RR',
    desc: 'Športni kupe z motorjem zadaj: okrogla žarometa, poševna zadnjica in kitov rep.',
    phys: { mass: 1350, a: 1.25, b: 1.02, kI: 1.18, kw: 290, redline: 7800, idle: 900, gears: [3.2, 2.08, 1.5, 1.17, 0.95, 0.8], final: 4.52, rw: 0.31, cDrag: 0.36, len: 4.25, wid: 1.77, steerMax: 0.62,
      tracK: 1.05, spinK: 0.4 },
    arc: { amax: 1.76, kv: 2, rmin: 4.3 },
    csp: { bx: 0.15, coast: -0.04, thr: 0.01, liftP: 0.2, pwr: 0.07, out: 1.25, turn: 1.08, w: 1 },   // (the RR layer: the engine behind the rear axle, a pendulum on a lift)
    stats: { power: 8, grip: 7, weight: 6, drift: 7 },
    price: 48000, pk: 'ppo', field: null,
    snd: { kind: 'flat6', hz: 1, turbo: 0.5, loud: 1 },
    expect: { t100: [2.78, 3.27], vmax: [231, 245], latG: [2.25, 2.35], d100: [22.8, 25.2] },
    partNames: { headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamp', tailR: 'right tail lamp', plate: 'number plate', wiperFront: 'windscreen wipers' },
    parts: { set: 'race', ht: 1.3, y0: 0.18,
      // (as KOLIBRI's: the head lamps in the wings' noses parts of their own, mounted on the wings (lost with them), a hit on their corner
      // knocks one out; each half of the tail's light bar likewise; the number plate on the rear bumper, the wipers on the cowl)
      extra: {
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.15, h: 0.06, lx: 0.96, lz: -0.68, f: 0.38, on: 'fenderL' },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.15, h: 0.06, lx: 0.96, lz: 0.68, f: 0.38, on: 'fenderR' },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.2, h: 0.05, lx: -1.0, lz: -0.43, f: 0.42 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.2, h: 0.05, lx: -1.0, lz: 0.43, f: 0.42 },
        plate: { z: 1, th: 0.4, m: 1, r: 0.17, h: 0.02, lx: -1.0, lz: 0, f: 0.16, on: 'bumperR' },
        wiperFront: { z: 0, th: 0.65, m: 0.5, r: 0.4, h: 0.03, lx: 0.29, lz: -0.05, f: 0.59 },
      },
      over: {
        wing: { f: 0.78, lx: -0.88, m: 4 },
        // (where the look has them: the front lid low between the wings, the high front wings forward of the axle). The front wings and
        // the hips are whole panels, the flank with the crest over it (a wing's round lamp, a hip's flare): on the road they lie 0.56 /
        // 0.40 m tall, h their real thickness
        hood: { lx: 0.66, y: 0.69 }, fenderL: { lx: 0.69, lz: -0.79, y: 0.63, h: 0.2 }, fenderR: { lx: 0.69, lz: 0.79, y: 0.63, h: 0.2 },
        quarterL: { h: 0.15 }, quarterR: { h: 0.15 },
      },
    },
    // where the garage's parts go (js/deli.js, look units; a trial on a second body, sklop 1): the wing over the engine lid's rear edge in
    // the whale tail's part; the head lamps in the wings' noses, every option in the stock lamp's triangle (its colour, ring and details on
    // the bulging lens), in the head lamps' parts (on the wings); the rims on its wheels
    mounts: {
      krilo: { x: -2.05, w: 0.59, part: 'wing' },
      zarometi: { x: 2.035, y0: 0.61, lean: 0, zc: 0.605, yc: 0.61, s: 0.55, hosts: ['headL', 'headR'], socket: 'host', shape: LAMP, bulge: 0.04, ringW: 0.005 },
      platisca: {},
      // (sklop 2 · spredaj, js/deli/spredaj.js) the kit round the impact bumpers (in place of the front one's black lip: the second and
      // the fourth keep it; the skirts between the door's rear edge and the front arch: the hips flare behind the doors; the diffuser
      // beside the exhaust), the front lid's top from the cowl to its front edge, between the high wings; no grille (the engine is at
      // the back: the nose has no mouth, the bumper's face has the plate and the indicators); the indicators in place of the stock ones
      // on the bumper, low on the front wings ahead of the doors, on the rear bumper's face and the mirrors; the rally lamps on the
      // bumper beside the plate, on a bar in front of the lid's edge between the head lamps (its feet on the bumper's top), a bar on the
      // bumper's face over the plate, at the roof's front edge, a pod over the nose
      aero: { xf: 2.131, xr: -2.115, w: 0.6, yf: 0.23, yr: 0.24, sill: [-0.48, 0.86], ws: 0.78, ys: 0.17, lipF: [1.99, 0.14, 0.16, 0.09, 1.38], exh: [-0.42, 0.045] },
      hauba: { x0: 0.75, x1: 1.98, w: 0.34, rel: true, cells: 3 },
      zmigavci: { front: { x: 2.131, y: 0.385, z: 0.47, w: 0.17, h: 0.06, part: 'bumperF' }, side: { x: 0.78, y: 0.55, z: 0.8, parts: ['fenderL', 'fenderR'] },
        rear: { x: -2.116, y: 0.39, z: 0.45, part: 'bumperR' }, mirror: { x: 0.5955, y: 0.87, z: 0.87, w: 0.1, parts: ['mirrorL', 'mirrorR'] } },
      relijske_luci: { bumper: [2.126, 0.34, 0.305], nose: [2.04, 0.66], intake: [2.131, 0.4, 0.95, 0.05], roof: [0.04, 0.6], pod: [2.085, 0.51, 0.75, 0.58], foot: 0.51, part: 'bumperF' },

      // (js/deli/zadaj.js) the tail lamps in the place of the light bar's halves (each half's room the stock lamp's, the design turned on
      // its side), a band across the tail under them (in the body); the exhaust as stock, under the rear bumper's left side (the silencer
      // and the pipes up against the bay's floor: the shell has none); the engine lid from the tail to the rear window's foot (under the
      // whale tail but for its front: the garage's wings leave it bare; its pins clear of the low wing's pylons); the tow points on the
      // bumpers' faces (in front under the left indicator, behind beside the plate: over the lips and the diffuser); the mudflaps behind
      // the wheels in the wings' and the quarters' parts, the sills' guards between the door's rear edge and the front arch
      zadnje_luci: { x: -2.034, zc: 0.38, yc: 0.655, w: 0.14, h: 0.3, s: 0.75, shape: [[-0.365, -0.048], [-0.365, 0.048], [0.365, 0.048], [0.365, -0.048]], hosts: ['tailL', 'tailR'],
        bar: { x: -2.05, y: 0.55, w: 0.6, h: 0.03, part: 'body' } },
      auspuh: { x: -2.08, y: 0.195, z: 0.42, r: 0.045, len: 0.22, part: 'bumperR', valve: true, drum: 0.195, pipe: 0.175 },
      prtljaznik: { x: [-2.03, -1.33], w: 0.5, part: 'trunk' },
      vlecne_kljuke: { f: [2.131, 0.325, -0.47], r: [-2.116, 0.37, 0.31] },
      lovilci_blata: { x: [0.86, -1.41], z: [0.6, 0.84], y: [0.34, 0.07], sill: [-0.45, 0.85, 0.19, 0.762], part: 'body', parts: ['fenderL', 'fenderR', 'quarterL', 'quarterR'] },

      // (js/deli/streha.js) the sunroofs on the short roof (0.73 m between the windscreen's top and the fastback's glass; back: none past
      // its rear end, nor over a fin there), the scoop's mouth at its front (no longer than the roof); the aerials on the roof (the rod by
      // its right edge, the fins and the pucks on its rear middle, the stub and the whip behind the rally lamps' bar), the louvres on the
      // fastback's glass (short of the roof's edge: their blade clear of the rods), in the body's part
      streha: { x0: -0.61, x1: 0.04, xf: 0.04, xr: -0.5, back: -0.62, part: 'body' },
      stresna_zajemalka: { x: 0.03, z: 0, back: -0.62, part: 'body' },
      antena: { x: -0.35, z: 0.45, fin: [-0.6, 0], front: [-0.08, 0.45], whip: -0.06, part: 'body' },
      zaluzije: { x0: -1.27, y0: 1.0134, x1: -0.75, y1: 1.2189, w: 0.52, part: 'body' },

      // (js/deli/bok.js) the mirrors (the stock flag mirrors' housings), the doors (inside their shut lines, the sill to the belt; the
      // handle; the glass from the B-pillar to the front pane's edge: ahead of it the stock pane stands off the band, up to 8 cm, toward
      // the windscreen's corner; its frame), the brakes, the wheel nuts (five: the rims' five spokes)
      ogledala: { x: 0.55, y: 0.89, z: 0.87, w: 0.09, h: 0.075, d: 0.14, z0: 0.785 },
      vrata: { x: [-0.49, 0.69], y: [0.33, 0.78], handle: [-0.3, 0.745, 0.787, 0.13, 0.026], win: [[-0.47, 0.06], [0.1, 0.06], [0.1, 0.8], [0.06, 0.9], [-0.47, 0.9]], netIn: 0.003,
        frame: [-0.5, -0.47, 0.9, 0.94] },
      zavore: { s: 1 },
      matice: { k: 5, r: 0.2 },

      // (sklop 3 · barve, js/deli/barve.js) the stripes over the engine lid ahead of the whale tail, the roof and the front lid (between
      // the wings: cut to its half width), not over the glass (the doors' slashes short of the belt: the door's pane starts there); the
      // decals on the doors and behind the rear arches, on the front lid and the roof; the sun strip across the windscreen's top; the
      // calipers; the fuel cap on the left front wing ahead of the door (stock: none)
      barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {},
      crte: { z: [0.17, 0.33], x: [[-1.47, -1.31], [-0.64, 0.07], [0.72, 2.03]], w: 0.34, slash: 0.78 },
      nalepke: { side: [[-0.47, 0.67], [-1.75, -1.44]], y: [0.42, 0.62], hood: { x: [1.0, 1.85], z: [0.05, 0.3] }, roof: { x: [-0.6, 0.02] } },
      soncni_pas: { x: [0.08, 0.2] }, zamasek: { x: 0.8, y: 0.66, z: -0.802, r: 0.045 },
      celjusti: { r: [0.075, 0.14], a: [70, 125] },
      // (sklop 3 · skriti deli, js/deli/skriti.js) round the flat six behind the rear axle: the filter on the left bank, its duct over
      // the crankcase to the front; the turbo on the right bank's rear (its intercooler on the crankcase's front); the ECU on the right
      // bank's front; the battery in the front trunk, on its floor ahead of the left front arch (the floor rising to the nose: the battery's
      // foot at its front edge); the struts and bars at the wheels (the bars' clamps on the floor at the rear axle, in front up into the
      // trunk's box)
      filter_zraka: { x: -1.72, y: 0.5, z: -0.34 }, akumulator: { x: 1.75, y: 0.24, z: -0.45 }, turbo: { x: -1.75, y: 0.488, z: 0.34, twin: [-0.1, 0.05], ic: [-1.45, 0.62, 0] },
      cip: { x: -1.5, y: 0.5, z: 0.34 },
      vzmeti: { in: 0.15, top: 0.66 }, amortizerji: { in: 0.15, top: 0.66 }, stabilizatorji: { in: 0.15, floor: 0.218 }, dim_gum: {},
    },
    // the look (KIT API v1, render.js; look units = metres): one loft from the tail panel to the front lid's edge (the lid low between the
    // wings, the roof's arc, the fastback's glass and the engine lid, the hips flaring out behind the doors); the high front wings with the
    // round lamps are skins of their own on its shoulders (in the fenders); the whale tail on the engine lid (the wing); the impact bumpers
    // with their black bellows (sweeps). Regions: the bumpers first, the front wings to the nose, the hips to the tail (the lids between them)
    look: {
      body: { len: 4.25, wid: 1.77, roofY: 1.3, wz: 0.15,
        //       x      w      yb    ybelt  wt     yt     cr     kind  tuck
        secs: [[-2.05, 0.8, 0.24, 0.62, 0.59, 0.745, 0.035, 'b', 0.1],   // the tail panel's top: the engine lid's rear edge (the light bar under it)
          [-1.8, 0.872, 0.22, 0.64, 0.61, 0.815, 0.05, 'b', 0.11],       // the engine lid between the hips, curving down to the tail
          [-1.39, 0.885, 0.205, 0.67, 0.6, 0.895, 0.07, 'b', 0.12],      // (sections at the arches' cuts and the regions' ends cost nothing)
          [-1.3, 0.885, 0.2, 0.68, 0.58, 0.93, 0.07, 'gr', 0.12],        // the rear window's foot: the fastback's glass up to the roof
          [-1.02, 0.885, 0.19, 0.69, 0.56, 1.06, 0.065, 'gr', 0.12],     // (the hips' belt low: their shoulders are skins over it)
          [-0.835, 0.882, 0.185, 0.665, 0.55, 1.14, 0.055, 'gr', 0.12],
          [-0.65, 0.878, 0.18, 0.66, 0.545, 1.205, 0.045, 'r', 0.12],    // the roof's rear edge (the hips full width from here back)
          [-0.5, 0.785, 0.17, 0.79, 0.57, 1.235, 0.045, 'r', 0.12],      // the door's rear edge: the flare starts behind it
          [-0.15, 0.785, 0.17, 0.795, 0.6, 1.255, 0.045, 'r', 0.12],     // the roof's crest
          [0.08, 0.785, 0.17, 0.797, 0.6, 1.23, 0.04, 'gf', 0.12],       // the windscreen's top
          [0.7, 0.79, 0.17, 0.8, 0.54, 0.815, 0.045, 'b', 0.12],         // the cowl: the windscreen's foot, the door's front edge
          [1.25, 0.855, 0.18, 0.685, 0.43, 0.69, 0.055, 'b', 0.12],      // the front lid low between the wings, over the front axle
          [1.62, 0.845, 0.195, 0.6, 0.4, 0.615, 0.05, 'b', 0.12],
          [2.04, 0.78, 0.22, 0.52, 0.36, 0.525, 0.03, 'b', 0.1]],        // the lid's front edge (the bumper in front of it)
        eye: { x: -0.28, y: 1.07, style: 'closed' },
        door: [0.7, -0.5], bumpF: 0.18, bumpR: 0.25, bumpY: [0.5, 0.52], engRear: true,
        crush: { x0: -1.05, x1: 0.33, z: 0.58 },                         // (the roof and the rear window's top; the whale tail far behind it)
        lamps: [[2.09, 0.635, 0.6], [-2.06, 0.655, 0.62]] },           // (the tail's glow at the light bar's ends)
      hi: true,   // (Nastavitve · Detajli avtov: Visoki: the small details at the end of build, the driver, the tyres in 64)
      budget: { outer: 1410, inner: 1400 }, budgetHi: { inner: 1750 },   // (its cabin, as KOLIBRI's: the inner block over a car's 800 / 1200; drawn only once a door opens, a pane breaks or a part is off; outer: the cracked mirrors' 8 tris over 1400)
      wheels: { style: 'std', spokes: 5, w: 0.205, wR: 0.255, rim: [0.8, 0.81, 0.84], cap: [0.12, 0.12, 0.13], gap: 0.06, seg: 32, segHi: 64 },
      // the bumpers first (the corners under their tops go with them); the front wings to the nose, the hips (quarters) to the tail: the
      // bonnet and the engine lid only between them; the engine lid up to the rear window's foot (the std trunk ends at the last 'gr' section)
      regions: (std) => {
        const B = std.filter(r => /^bumper/.test(r.part)), R = std.filter(r => !/^bumper/.test(r.part));
        for (const r of R) { if (/^fender/.test(r.part)) r.x = [r.x[0], 3]; if (/^quarter/.test(r.part)) r.x = [-3, r.x[1]]; if (r.part === 'trunk') r.x = [r.x[0], -1.3]; }
        const i = R.findIndex(r => /^(fender|quarter)/.test(r.part));
        return R.slice(0, i).concat(B, R.slice(i));
      },
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, D = [0.12, 0.12, 0.13], CH = K.chrome;
        const XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;   // (the rear arch's front end, the front arch's rear end)
        const XQ = -0.835;                                                                     // (the quarter window's rear corner at the belt)
        // ---- the shell: the paint; the glass (the windscreen, the side windows, the fastback's rear window, the quarter windows' front);
        //      black sills from arch to arch, the arches' ledges black ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch || (at.x > XA && at.x < XB) ? B : K.shade(P, 0.55);
          if (kind === 'gf' && e >= 3 && e <= 5) return G;                                     // (its sides: paint, the side glass a decal over them)
          if (kind === 'r' && (e === 2 || e === 6)) return G;
          if (kind === 'gr') { if (e >= 3 && e <= 5) return G; if ((e === 2 || e === 6) && at.x > XQ) return G; }
          return P;
        }, { caps: { front: { col: P, high: 'hood' }, rear: { col: P } }, glass: (k, e, kind) => kind === 'gf' && (e === 2 || e === 6) });
        const D2 = L.decal;
        // the window graphics: the sail behind the quarter window's slanted edge, the door window's front up to the A-pillar (glass on the
        // painted band by the windscreen: by the cowl the band lies flat, it would face the driver's eyes), the door frame's rear edge, the seals
        D2.band([[XQ, 0], [-0.65, 1], [XQ, 1]], P, null, 0.01);                                         // (the sail: the glass's rear edge slants)
        D2.band([[0.08, 0], [0.58, 0], [0.39, 0.684], [0.08, 0.834]], G, null, 0.006);                   // (the A-pillar 6 cm wide over it)
        D2.band([[-0.53, 0], [-0.49, 0], [-0.47, 1], [-0.51, 1]], B, null, 0.012);                      // the door frame's rear edge
        D2.band([[XQ, 0], [0.64, 0], [0.64, 0.05], [XQ, 0.05]], B, null, 0.008);                        // the seal along the sill
        D2.band([[-0.67, 0.94], [0.1, 0.94], [0.1, 1], [-0.67, 1]], B, null, 0.008);                    // the drip rail over the side windows
        // the livery: a stripe along the sills between the arches (the stripe colour: the paint when the car has none)
        D2.side([[XA + 0.04, 0.31], [XB - 0.04, 0.31], [XB - 0.04, 0.37], [XA + 0.04, 0.37]], S, null, 0.006);
        K.deli('vrata', () => { for (const sd of [-1, 1]) K.rect(-0.3, 0.745, sd * 0.787, 0.13, 0.026, B, { dir: sd < 0 ? '-z' : 'z' }); });   // the door handles (the garage's doors in their place: mounts.vrata, their own handles)
        for (const x of [-0.5, 0.7]) D2.side([[x - 0.008, 0.3], [x + 0.008, 0.3], [x + 0.008, 0.8], [x - 0.008, 0.8]], D, null, 0.004);   // the doors' shut lines
        for (const id of ['crte', 'nalepke', 'celjusti', 'zamasek']) K.deli(id, () => {});   // (stock: none; the garage's over the paint, the fuel cap)
        K.deli('soncni_pas', () => {});   // (stock: none; the garage's across the windscreen's top)
        // ---- the front wings: high over the lid, round lamps upright at their noses (skins on the loft's shoulders: from its belt over the
        //      crest and down to the lid's edge, a gutter by the lid), in the fenders ----
        const WC = [[0.7, 0.835, 0.69], [0.95, 0.855, 0.675], [1.25, 0.858, 0.66], [1.55, 0.842, 0.64], [1.85, 0.808, 0.62], [2.04, 0.775, 0.605]];   // x, the crest's height and its z
        for (const sd of [-1, 1]) K.part(sd < 0 ? 'fenderL' : 'fenderR', () => {
          const rings = WC.map(([x, yc, zc]) => { const yb = L.prop(x, 'ybelt'), w = L.prop(x, 'w'), yt = L.prop(x, 'yt'), wt = L.prop(x, 'wt');
            return [[x, yb, sd * w], [x, yb + 0.7 * (yc - yb), sd * (w - 0.25 * (w - zc))], [x, yc, sd * zc], [x, yc - 0.45 * (yc - yt), sd * (zc - 0.3 * (zc - wt))], [x, yt, sd * wt]]; });
          K.skin(rings, P, P, P);
        });
        K.part('hood', () => K.deli('hauba', () => {}));   // (stock: none; the garage's lid top between the wings: mounts.hauba)
        // ---- the head lamps: each wing's whole nose (LAMP), its lens bulging out of it, a slim chrome frame round it, in the fenders (the
        //      garage's lamps in their place, the same outline: K.deli, mounts.zarometi) ----
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(2.041, 0.61, sd * 0.605, 0.1, { polys: [LAMP], ring: CH, ringW: 0.005, bulge: 0.04, d: 0.02, host: sd < 0 ? 'headL' : 'headR' }); });
        // ---- the hips: the rear wings' shoulders over the driven wheels, flaring out behind the doors (skins on the loft's low belt: over the
        //      crest, then in under the sail and the quarter window; at the tail a valley by the engine lid), in the quarters ----
        const HC = [[-0.5, 0, 0], [-0.65, 0.8, 0.85], [-0.835, 0.82, 0.862], [-1.02, 0.83, 0.865], [-1.39, 0.825, 0.862], [-1.8, 0.8, 0.845], [-2.05, 0.745, 0.775]];   // x, the crest's height and its z (0: none, at the door)
        for (const sd of [-1, 1]) K.part(sd < 0 ? 'quarterL' : 'quarterR', () => {
          const rings = HC.map(([x, yc, zc]) => { const yb = L.prop(x, 'ybelt'), w = L.prop(x, 'w'), yt = L.prop(x, 'yt'), wt = L.prop(x, 'wt');
            if (!yc) return [0, 1, 2, 3].map(() => [x, yb, sd * w]);
            const ze = zc - 0.08, ye = yb + (w - ze) / (w - wt) * (yt - yb) - 0.004;   // (the inner edge just under the window band)
            return [[x, yb, sd * w], [x, yb + 0.55 * (yc - yb), sd * (Math.max(w, zc) + 0.02)], [x, yc, sd * zc], [x, ye, sd * ze]]; });
          K.skin(rings, P, null, P);
        });
        // ---- the wipers on the cowl ----
        for (const z of [-0.5, 0.06]) K.bar([0.67, L.topY(0.67, z) + 0.012, z], [0.58, L.topY(0.58, z + 0.42) + 0.012, z + 0.42], 0.01, B, { n: 4, part: 'wiperFront' });
        // ---- the whale tail on the engine lid (the wing): its deck over the lid, the rubber lip round its edge, the intake grille ----
        K.part('wing', () => K.deli('krilo', () => {   // (the garage's wing in its place: mounts.krilo)
          const st = [[-1.48, 0, 0.44], [-1.62, 0.975, 0.52], [-1.82, 0.985, 0.58], [-2.0, 0.985, 0.6], [-2.09, 1.015, 0.6]];   // x, the deck's height (0: on the lid), its half width
          const rings = st.map(([x, yt, zo]) => {
            const end = x < -2.04, y0 = (z) => (end ? 0.945 : L.topY(x, z) - 0.012), top = yt || L.topY(x, 0) + 0.006, zi = zo - 0.035, zb = end ? zo : zo + 0.03;
            return [[x, y0(-zb), -zb], [x, top - 0.02, -zo], [x, top, -zi], [x, top, zi], [x, top - 0.02, zo], [x, y0(zb), zb]]; });
          K.skin(rings, (k, e) => e === 1 || e === 3 || (k === 3 && e === 2) ? B : P, P, B);
          K.rect(-1.8, 0.992, 0, 0.28, 0.68, B, { dir: 'y' });                                            // the intake grille on the deck
          for (const x of [-1.71, -1.77, -1.83, -1.89]) K.rect(x, 0.996, 0, 0.022, 0.64, [0.2, 0.2, 0.21], { dir: 'y' });
        }), { noCrush: true, noDent: true, hinge: [[-1.48, 0.94, -0.4], [-1.48, 0.94, 0.4]] });
        // ---- the impact bumpers: rounded, short black bellows at their ends, a rubber strip along the face, the plates; the front one with
        //      the indicators and a black lip under it ----
        const prof = [[0.07, -0.14], [-0.045, -0.14], [-0.065, -0.08], [-0.065, 0.08], [-0.045, 0.14], [0.07, 0.14]];   // (u in, v up)
        const bcol = (n) => (k, e) => k === 0 || k === n - 2 ? B : e === 5 ? D : P;
        const zm = K.fitted && K.fitted.zmigavci;   // (the garage's indicators: the stock ones go)
        K.part('bumperF', () => {
          const path = [[1.7, 0.37, -0.787], [1.76, 0.37, -0.785], [1.98, 0.37, -0.74], [2.065, 0.37, -0.6], [2.065, 0.37, 0.6], [1.98, 0.37, 0.74], [1.76, 0.37, 0.785], [1.7, 0.37, 0.787]];
          K.sweep(prof, path, bcol(path.length), { capA: B, capB: B });
          K.rect(2.131, 0.455, 0, 1.2, 0.04, B);                                                          // the rubber strip
          if (!zm) for (const sd of [-1, 1]) K.rect(2.131, 0.385, sd * 0.47, 0.17, 0.06, K.rgb(0xff9a1e));   // the indicators
          K.rect(2.131, 0.32, 0, 0.46, 0.1, [0.93, 0.93, 0.9]);                                          // the plate
          K.deli('aero', () => K.box(1.99, 0.14, 0, 0.16, 0.09, 1.38, 0, B));                            // the lip under it (the garage's kit in its place: mounts.aero)
          K.deli('relijske_luci', () => {});   // (stock: none; the garage's on the bumper, before the lid's edge, the roof: mounts.relijske_luci)
        }, { hinge: [[2.05, 0.3, -0.6], [2.05, 0.3, 0.6]] });
        K.deli('zmigavci', () => {});   // (the stock ones above; the garage's on the bumper, the front wings, the rear bumper, the mirrors)
        K.part('bumperR', () => {
          const path = [[-1.78, 0.38, 0.818], [-1.84, 0.38, 0.81], [-1.97, 0.38, 0.77], [-2.05, 0.38, 0.62], [-2.05, 0.38, -0.62], [-1.97, 0.38, -0.77], [-1.84, 0.38, -0.81], [-1.78, 0.38, -0.818]];
          K.sweep(prof, path, bcol(path.length), { capA: B, capB: B });
          K.rect(-2.116, 0.465, 0, 1.24, 0.04, B, { dir: '-x' });
          K.box(-2.113, 0.305, 0, 0.006, 0.11, 0.5, 0, [0.93, 0.93, 0.9], null, true, { part: 'plate' });   // (the plate: a thin plate, a part of its own)
          K.deli('auspuh', () => K.exhaust(-2.08, 0.19, -0.42, 0.045, 0.22, { part: 'bumperR' }));   // (the garage's in its place: mounts.auspuh)
        }, { hinge: [[-2.04, 0.3, -0.6], [-2.04, 0.3, 0.6]] });
        K.deli('prtljaznik', () => {});   // (stock: none; the garage's engine lid top under the whale tail)
        K.deli('vlecne_kljuke', () => {});   // (stock: none; the garage's on the bumpers' faces)
        K.deli('lovilci_blata', () => {});   // (stock: none; the garage's behind the wheels, the sills' guards)
        // ---- the tail: the full-width light bar under the engine lid (one lamp each half: it lights right across; each half a part of its
        //      own, with a dark triangle hidden in it: the lamp is in the tail mesh, the part needs some of the body's) ----
        K.rect(-2.052, 0.655, 0, 1.54, 0.15, B, { dir: '-x', part: 'body' });
        K.deli('zadnje_luci', () => { for (const sd of [-1, 1]) { const tp = sd < 0 ? 'tailL' : 'tailR', q = [[-2.07, 0.69, sd * 0.06], [-2.07, 0.62, sd * 0.06], [-2.05, 0.62, sd * 0.7]];
          K.face(sd > 0 ? q : q.reverse(), [0.3, 0.04, 0.04], { host: tp }); K.tailLamp(-2.054, 0.655, sd * 0.38, 0.76, 0.1, { host: tp }); } });   // (the garage's in their place: mounts.zadnje_luci)
        // ---- the door mirrors (flag mirrors in the paint) ----
        K.deli('ogledala', () => { for (const sd of [-1, 1]) K.mirror(0.55, 0.89, sd * 0.87, { w: 0.09, h: 0.075, d: 0.14, z0: sd * 0.785, crack: 1 }); });   // (the garage's in their place: mounts.ogledala)
        K.part('body', () => { for (const id of ['streha', 'stresna_zajemalka', 'antena', 'zaluzije']) K.deli(id, () => {}); });   // (stock: none; the garage's on the roof and the fastback's glass)
        // ---- hinges: the lids at their edges by the glass, the doors at the front ----
        K.hinge('hood', [0.72, 0.84, -0.4], [0.72, 0.84, 0.4]);
        K.hinge('trunk', [-1.32, 0.97, -0.4], [-1.32, 0.97, 0.4]);
        for (const sd of [-1, 1]) K.hinge(sd < 0 ? 'doorL' : 'doorR', [0.68, 0.3, sd * 0.79], [0.68, 0.8, sd * 0.79]);
        // ---- Visoki (K.hi): the badge on the tail under the light bar, the plates' frames, the jacking points' arrows on the sills, the driver ----
        if (K.hi) {
          const C = K.cab, F = K.fitted;
          if (!F.zadnje_luci) C.badge(-2.0512, 0.552, 0, -1, 'body', 0.022);
          C.plate(-2.1162, 0.36, 0, 0.5, 0.11, -1, 'plate');
          C.plate(2.1312, 0.32, 0, 0.46, 0.1, 1, 'bumperF');
          if (!F.aero) for (const s of [-1, 1]) for (const x of [XB - 0.23, XA + 0.23]) D2.side([[x - 0.03, 0.23], [x + 0.03, 0.23], [x, 0.278]], [0.6, 0.61, 0.64], [s], 0.008);
          K.driver(-0.49, 1.02, -0.36, { inner: true, r: 0.12, lean: 0.3, hands: [0.04, 0.8, 0.16], knee: [0.13, 0.5, 0.17], feet: [0.52, 0.28, 0.11], suit: [0.14, 0.16, 0.2], helmet: [0.93, 0.93, 0.9] });
        }
        // ---- inside (seen once a door opens, a pane breaks or a part is off; K.cab, as KOLIBRI's): the carpet, the toe board, the tunnel;
        //      the dashboard with its binnacle, the wheel, the seats, the +2 bench, the gear lever and the hand brake, the pedals, the door
        //      cards; the flat six behind the rear axle with its fan housing; the spare wheel and the tank under the front lid ----
        { const C = K.cab, SZ = -0.36, TAN = [0.36, 0.2, 0.12], TAN2 = [0.26, 0.14, 0.08], CP = [0.13, 0.11, 0.1], DK = [0.13, 0.12, 0.12];
          C.face([[-0.52, 0.205, -0.74], [0.65, 0.205, -0.74], [0.65, 0.205, 0.74], [-0.52, 0.205, 0.74]], CP, [0, 1, 0]);   // the carpet (in front of the rear wheels' wells)
          C.face([[-1.25, 0.225, -0.54], [-0.52, 0.225, -0.54], [-0.52, 0.225, 0.54], [-1.25, 0.225, 0.54]], CP, [0, 1, 0]);   // (between them, under the bench)
          C.face([[0.65, 0.2, -0.745], [0.65, 0.2, 0.745], [0.65, 0.78, 0.745], [0.65, 0.78, -0.745]], CP, [-1, 0, 0]);   // the toe board
          K.box(0.06, 0.2, 0, 1.18, 0.055, 0.24, 0, CP, null, false, { inner: true, part: 'body' });                   // the tunnel
          C.dash({ x: 0.26, y: 0.8, d: 0.36, w: 0.73, dz: SZ, style: 'road', col: DK, col2: TAN });
          C.steer({ c: [0.06, 0.79, SZ], ax: [0.9, -0.436], r: 0.17, rr: 0.017, to: [0.36, 0.645, SZ] });
          for (const sd of [-1, 1]) C.seat(-0.3, 0.21, sd * 0.36, { w: 0.46, top: 0.74, lean: 0.3, belt: 'road', col: TAN, col2: TAN2 });
          C.bench(-1.0, 0.225, { w: 1.0, top: 0.52, col: TAN, col2: TAN2 });
          C.console(0.0, 0.25, { l: 0.32 });
          C.pedals(0.58, 0.24, SZ, 3);
          for (const sd of [-1, 1]) C.door(sd, { x: [-0.48, 0.4], y: [0.38, 0.76], z: 0.765, col: DK, insert: TAN });
        }
        K.engine(-1.63, 0.26, 0, { l: 0.6, w: 0.46, h: 0.44, col: [0.42, 0.43, 0.45], cover: [0.14, 0.14, 0.15] });   // (the crankcase, its fan on top)
        for (const sd of [-1, 1]) K.box(-1.63, 0.3, sd * 0.34, 0.52, 0.2, 0.22, 0, [0.27, 0.27, 0.29], null, false, { inner: true, part: 'body' });   // the cylinder banks, lying flat
        K.cyl([-1.84, 0.6, 0], [-1.72, 0.6, 0], 0.17, [0.22, 0.22, 0.23], { n: 10, inner: true, part: 'body', capA: [0.55, 0.3, 0.1] });
        K.cyl([1.55, 0.24, 0], [1.55, 0.4, 0], 0.27, [0.06, 0.06, 0.065], { n: 10, inner: true, part: 'body', capB: [0.55, 0.56, 0.6] });
        K.box(1.02, 0.24, 0, 0.36, 0.24, 1.0, 0, [0.5, 0.51, 0.53], null, false, { inner: true, part: 'body' });
        for (const id of ['filter_zraka', 'akumulator', 'turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum']) K.deli(id, () => {});   // (stock: none; the garage's on the flat six, in the front trunk, at the wheels)
      },
    },
  });
})();
