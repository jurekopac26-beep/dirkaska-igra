/* Vehicle 'vran' — VRAN 01: a one-off big 4x4 built by hand, closed under a hardtop, on big tyres, set up for sliding (invented; no
   real model). Signature features: 1) the hardtop over four doors (its roof two-tone in the stripe colour), the light bar along its front
   edge over the upright windscreen, 2) the flat bonnet with a raised scoop for the big V8, a ridge from it down to the narrow grille between slim angular
   lamps, 3) big all-terrain tyres on bronze beadlock rims under wide black flares, 4) the plate bumper with the winch and red shackles, the
   spare wheel low on the tailgate under the rear window, 5) the rock sliders under the doors, the short tail. L 4.8 W 2.2 H 2.0 (with the
   bumpers, the spare and the light bar), wheelbase 2.95, overhangs F 0.98 R 0.85 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  // the garage's head lamp in the place of the slim lamp in the nose (u out from the car's middle, v up; metres round z 0.64, y 0.99): its
  // outer bottom corner cut off; every option takes this outline
  const SLIM = [[0.15, -0.015], [0.11, -0.045], [-0.15, -0.045], [-0.15, 0.04], [0.15, 0.04]];
  VEHICLE_DEFS.push({
    id: 'vran', name: 'VRAN 01', cat: 'posebni', ord: 4, drive: 'AWD',
    desc: 'Izvenserijski velik terenec 4x4 s trdo streho, vitlom in rezervnim kolesom zadaj.',
    // the AWD layer turned round for sliding (docs/novi-avti-2.md): the power swings the tail round (pwr), a big slide for the turn (tv),
    // held long (out); big and heavy for a slider, the V8 strong to match; loose on dirt and grass, a soft landing (loose, landV).
    // The driving school's drift (tools/novi-avti-2/drift.js): Jezero 2304, Spa 696, Bathurst 794 (ŠKORPIJON H 1998 / 202 / 836)
    phys: { mass: 2150, a: 1.42, b: 1.53, kI: 1.3, kw: 500, redline: 6800, idle: 750, gears: [3.4, 2.25, 1.62, 1.26, 1.02, 0.86], final: 5.7, rw: 0.45, cDrag: 0.66, len: 4.8, wid: 2.2, steerMax: 0.7,
      tracK: 1.0, brakeK: 0.95, spinK: 0.45, loose: 1.2, looseDrag: 0.45, landV: 20, landK: 0.55, sway: 1.6 },
    arc: { amax: 1.7, kv: 1.9, rmin: 5.4 },
    csp: { bx: 0.15, coast: -0.045, thr: 0.02, liftP: 0.1, pwr: 0.14, out: 1.35, turn: 0.95, w: 0.95, tv: 1.55 },
    stats: { power: 10, grip: 6, weight: 1, drift: 10 },
    price: 75000, pk: 'open', field: ['vran'],
    snd: { kind: 'v8', hz: 0.85, loud: 1.3 },
    expect: { t100: [2.8, 3.15], vmax: [192, 208], latG: [2.05, 2.15], d100: [23.7, 25.5] },   // (measured 2.93 / 200 / 2.10 / 24.6)
    partNames: { tailgate: 'tailgate', headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamp', tailR: 'right tail lamp' },
    // the closed car's set (no boot lid: the tailgate in its place) and its own: the tailgate with the rear window and the spare, each lamp
    parts: { set: 'car', ht: 2.0, y0: 0.62, drop: ['trunk'],
      extra: {
        tailgate: { z: 1, th: 0.78, m: 14, rW: 0.42, h: 0.13, lx: -0.9, lz: 0, y: 1.2 },   // (with the rear window and the spare wheel on it)
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.15, h: 0.05, lx: 0.94, lz: -0.58, y: 0.99 },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.15, h: 0.05, lx: 0.94, lz: 0.58, y: 0.99 },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.15, h: 0.05, lx: -0.875, lz: -0.69, y: 0.95 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.15, h: 0.05, lx: -0.875, lz: 0.69, y: 0.95 },
      },
      // (where the look has them: both doors of a side one part (their glass with them), the mirrors on the front doors' corners, the
      // bonnet's middle, the bumpers low; the fenders and the quarters lie as thick as their wide flares)
      over: { doorL: { lx: -0.04, y: 1.25 }, doorR: { lx: -0.04, y: 1.25 }, mirrorL: { lx: 0.3, lz: -0.9, y: 1.33 }, mirrorR: { lx: 0.3, lz: 0.9, y: 1.33 },
        hood: { lx: 0.63, y: 1.25 }, bumperF: { lx: 0.98, y: 0.5 }, bumperR: { lx: -0.9, y: 0.42 },
        fenderL: { h: 0.13 }, fenderR: { h: 0.13 }, quarterL: { h: 0.14 }, quarterR: { h: 0.14 } } },
    // where the garage's parts go (js/deli.js, look units): the head lamps in the place of the slim lamps in the nose (every option in
    // their outline, SLIM), in the lamps' parts; the rims; the spoiler on the hardtop's rear edge, in the body (none stock)
    mounts: {
      krilo: { x: -2.05, w: 0.84, part: 'body', s: 1.2, front: -1.45 },
      zarometi: { x: 2.262, y0: 0.99, lean: 0, zc: 0.64, yc: 0.99, s: 0.42, hosts: ['headL', 'headR'], shape: SLIM, bulge: 0, ringW: 0.008 },
      platisca: {},
      // (sklop 2 · spredaj, js/deli/spredaj.js) the kit's lips under the plate bumpers (no skirts: the rock sliders take the sills; options
      // 2, 3 the tail's corner lips), its flares out past the stock ones, the canards on the bumper's corners; the bonnet's top from the
      // cowl to its front edge (the scoop and the ridge go with it); the grille between the lamps (the body's); the indicators where the
      // stock ones are (the fenders'), the repeaters on the front fenders ahead of the flares, the rear ones on the rear bumper, the
      // mirrors' fronts; the extra lamps on the bumper's face beside the winch, four on a bar in front of the grille (its feet on the
      // bumper's top), the LED bar low on the bumper's face, the roof bar in the stock light bar's place, the pod over the grille
      aero: { xf: 2.42, xr: -2.222, w: 0.93, yf: 0.47, yr: 0.43, ws: 1.1, canY: 0.52, partF: 'bumperF', partR: 'bumperR' },
      hauba: { x0: 0.82, x1: 2.16, w: 0.7, rel: true },
      maska: { x: 2.262, y0: 0.9, lean: 0, yc: 0.9, w: 0.56, h: 0.3, comb: 1.1, part: 'body' },   // (the honeycomb's cells 10 % up: +300 triangles)
      zmigavci: { front: { x: 2.26, y: 0.84, z: 0.79, w: 0.08, h: 0.05, parts: ['fenderL', 'fenderR'] }, side: { x: 1.95, y: 1.0, z: 0.93, hosts: ['fenderL', 'fenderR'] },
        rear: { x: -2.222, y: 0.5, z: 0.78, part: 'bumperR' }, mirror: { x: 0.7555, y: 1.33, z: 0.98, w: 0.07, parts: ['mirrorL', 'mirrorR'] } },
      relijske_luci: { bumper: [2.412, 0.6, 0.38], nose: [2.237, 0.92], foot: 0.69, feet: 0.5, intake: [2.42, 0.53, 1.2, 0.12], roof: [0.425, 0.7], pod: [2.245, 0.76, 1.08, 0.45], part: 'bumperF' },
      // (js/deli/zadaj.js) the tail lamps' room in the black surrounds (no band across: the spare wheel in the tailgate's middle); the
      // exhaust (none stock) out through the rear bumper's foot, the silencer up under the floor, the pipes behind the rear axle; no lid
      // (the tailgate carries the spare); the tow points in the red shackles' place; the flaps behind the wheels, up into the arches
      zadnje_luci: { x: -2.085, zc: 0.76, yc: 0.95, w: 0.14, h: 0.3, s: 0.93, hosts: ['tailL', 'tailR'] },
      auspuh: { x: -2.25, y: 0.45, z: 0.3, r: 0.045, len: 0.2, part: 'body', drum: 0.595, pipe: 0.625, pipeX: -1.68, valve: true },
      vlecne_kljuke: { f: [2.42, 0.56, 0.56], r: [-2.222, 0.52, -0.62] },
      lovilci_blata: { x: [0.9, -2.0], z: [0.76, 1.06], y: [0.63, 0.12], part: 'body', parts: ['fenderL', 'fenderR', 'quarterL', 'quarterR'] },
      // (js/deli/streha.js) the sunroof over the front seats behind the light bar, a second pane over the load bay; the roof scoop's mouth
      // behind the light bar; the aerial on the roof's rear corner, the stub at its front outboard of the scoops and the bars; the
      // louvres over the tailgate's window
      streha: { x0: -2.0, x1: 0.48, xf: 0.3, xr: -1.0, part: 'body' },
      stresna_zajemalka: { x: 0.33, z: 0, part: 'body' },
      antena: { x: -1.8, z: -0.65, fin: [-1.35, 0], front: [0.2, 0.62], whip: -0.3, part: 'body' },
      zaluzije: { x0: -2.103, y0: 1.44, x1: -2.103, y1: 1.84, w: 0.56, part: 'tailgate' },
      // (js/deli/bok.js) the mirrors where the stock ones are; the doors' skins over both doors (one part a side), the front door's glass
      // from the B-pillar to the A-pillar (its top corner at the windscreen's top), its handle (the rear door's out on the skin); the
      // light glass 2 mm nearer the band (lexOut: the race mirror's foot over its front corner within 2 cm of the shell)
      ogledala: { x: 0.72, y: 1.33, z: 0.98, w: 0.07, h: 0.14, d: 0.1, z0: 0.92 },
      vrata: { x: [-0.96, 0.76], y: [0.68, 1.2], handle: [0.5, 1.1, 0.932, 0.12, 0.03], win: [[-0.07, 0.06], [0.73, 0.06], [0.5, 0.94], [-0.07, 0.94]],
        frame: [-0.12, -0.07, 0.94, 0.99], rub: 0.84, crease: [0.76, 1.0], rubSide: true, lexOut: -0.002 },
      zavore: { s: 1 }, matice: { k: 6, r: 0.2 },
      // (sklop 3 · barve, js/deli/barve.js) the stripes over the bonnet outboard of the scoop (the roof in the stripe colour: none), along
      // the sides between the flares; the decals on the doors behind the windscreen's foot (+300 triangles, tests/deli.test.js) and the
      // front fenders ahead of the flares, on the bonnet outboard of the scoop, on the roof; the sun strip under the windscreen's header;
      // the fuel cap on the right rear quarter over the flare
      barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {},
      crte: { z: [0.42, 0.56], x: [[0.82, 2.2]], sx: [-0.88, 0.78], dy: 0.34 },
      nalepke: { side: [[-0.08, 0.5], [1.92, 2.2], [-0.9, -0.18]], y: [0.86, 1.16], hood: { x: [1.05, 2.1], z: [0.45, 0.82] }, roof: { x: [-1.9, 0.25] } },
      soncni_pas: { x: [0.535, 0.6] }, zamasek: { x: -1.11, y: 1.13, z: 0.93, r: 0.045 },
      celjusti: { r: [0.11, 0.19], a: [70, 125] },
      // (sklop 3 · skriti deli, js/deli/skriti.js) the V8's bay under the bonnet: the filter against the block's left side, the turbo on
      // its right (the twins side by side there), the battery on the block's front, the control box on its top beside the cover (all over
      // the arches' inner walls' feet: the wheel wells open under them, the tail over 4 m behind the bay's front); the springs on seats
      // over the arms (no front axle), the struts against the arches' inner walls up into their tops, the bars under the floor
      filter_zraka: { x: 1.43, y: 0.755, z: -0.47 }, akumulator: { x: 1.951, y: 0.726, z: -0.22, back: true }, turbo: { x: 1.55, y: 0.8, z: 0.42, twin: [-0.04, 0.05] }, cip: { x: 1.3, y: 1.066, z: 0.29 },
      vzmeti: { in: 0.173, top: 1.02, seat: [0.665, 0.49] }, amortizerji: { in: 0.168, top: 0.99 }, stabilizatorji: { in: 0.168, floor: [0.659, 0.65] }, dim_gum: {},
    },
    // the look (KIT API v1, render.js; look units = metres: the centre of mass at x 0, the front axle at 1.42, the rear one at -1.53): one
    // loft from the tailgate to the nose: the box under the hardtop (its roof two-tone, the glass all round), the upright windscreen,
    // the flat bonnet, the nose; the regions: both doors of a side (one part, their glass with them), the front fenders, the rear quarters
    // under the belt (their windows and the pillars stay with the hardtop), the bonnet; the end caps: the tailgate (its face from the
    // bottom to the hardtop's rear edge, the rear window in it), the nose (the body's)
    look: {
      body: { len: 4.8, wid: 2.2, wz: 0.18,
        //       x      w      yb    ybelt  wt     yt     cr     kind  tuck
        secs: [[-2.1, 0.9, 0.64, 1.2, 0.84, 1.9, 0.012, 'b', 0.12],      // the tail's face: the tailgate, the hardtop's rear edge rounded
          [-2.05, 0.93, 0.62, 1.21, 0.87, 1.94, 0.018, 'r', 0.12],       // the hardtop's rear edge: the flat roof from here to the windscreen
          [0.5, 0.93, 0.62, 1.21, 0.87, 1.94, 0.018, 'gf', 0.12],        // the windscreen's top (upright, flat)
          [0.76, 0.93, 0.62, 1.2, 0.91, 1.25, 0.012, 'b', 0.12],         // the cowl: the windscreen's base, the front doors' front edge
          [2.18, 0.93, 0.64, 1.17, 0.9, 1.21, 0.014, 'b', 0.12],         // the flat bonnet's front edge
          [2.26, 0.9, 0.68, 1.13, 0.87, 1.16, 0.006, 'b', 0.1]],         // the nose: the grille's panel between the lamps
        eye: { x: -0.05, y: 1.68, near: 0.25, tilt: 0.06, style: 'closed' },   // (sitting high, close behind the upright windscreen)
        decalX: 1.92, decalY: 1.235, decalRz: -0.04, decalS: 0.5, decalPart: 'hood',   // (the start number on the bonnet, ahead of the scoop)
        crush: { x0: -2.0, x1: 0.74, z: 0.88 } },                        // (a roll-over flattens the hardtop)
      wheels: { style: 'knob', w: 0.36, rimK: 0.55, rim: [0.52, 0.39, 0.21], cap: [0.13, 0.13, 0.14], gap: 0.07 },
      // the parts' regions (look units): both doors of a side from the rear arch to the cowl (side, window: their glass), the fenders forward
      // of them, the quarters behind them under the belt (the rear side window, the C- and D-pillars stay with the hardtop), the bonnet over
      // the fenders' tops
      regions: [
        { part: 'doorL', x: [-0.96, 0.76], bands: ['side', 'window'], side: 'L', y: [0.6, 1.95] },
        { part: 'doorR', x: [-0.96, 0.76], bands: ['side', 'window'], side: 'R', y: [0.6, 1.95] },
        { part: 'fenderL', x: [0.76, 2.3], bands: ['tuck', 'side', 'window'], side: 'L', y: [-1, 1.3] },
        { part: 'fenderR', x: [0.76, 2.3], bands: ['tuck', 'side', 'window'], side: 'R', y: [-1, 1.3] },
        { part: 'quarterL', x: [-2.2, -0.96], bands: ['tuck', 'side'], side: 'L', y: [-1, 1.26] },
        { part: 'quarterR', x: [-2.2, -0.96], bands: ['tuck', 'side'], side: 'R', y: [-1, 1.26] },
        { part: 'hood', x: [0.76, 2.3], bands: ['window', 'edge', 'crown'], top: true },
      ],
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, DK = [0.08, 0.08, 0.09], D = [0.12, 0.12, 0.13], T = [0.1, 0.1, 0.11], LED = [0.95, 0.96, 1.0];
        const AL = [0.62, 0.63, 0.66], RED = K.rgb(0xc0392b), AMB = K.rgb(0xff9a1e), SEAT = [0.16, 0.16, 0.17];
        // ---- the shell: the paint; the hardtop's roof in the stripe colour (a two-tone roof; the paint when the car has none), the glass all
        //      round (the windscreen, the side windows door to tail); the lower edge dark, black ledges in the arches; the nose's face dark
        //      round the grille and the lamps; the tailgate's face over the rear bumper's place ----
        const L = K.loft(K.secs(K.body.secs), (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch ? B : DK;
          if (kind === 'gf') return e >= 3 && e <= 5 ? G : (e === 2 || e === 6) && at.x < 0.74 ? G : P;
          if (kind === 'r') return e >= 3 && e <= 5 ? S : e === 2 || e === 6 ? G : P;
          if (k === 0 && e >= 3 && e <= 5) return S;                         // (the roof's rounded rear edge)
          return P;
        }, { caps: { front: { col: DK, low: 'body', high: 'body' }, rear: { col: P, colLow: DK, cut: 0.72, low: 'body', high: 'tailgate' } } });
        const DC = L.decal;
        // the pillars over the glass (paint): the B-pillar between the doors (the body's: it stays when the doors go), the C-pillar behind
        // the rear door, the broad D-pillar at the tail; the windscreen's header
        DC.band([[-0.16, 0], [-0.08, 0], [-0.08, 1], [-0.16, 1]], P, null, 0.008, { part: 'body' });
        DC.band([[-1.02, 0], [-0.92, 0], [-0.92, 1], [-1.02, 1]], P, null, 0.008);
        DC.band([[-2.05, 0], [-1.84, 0], [-1.84, 1], [-2.05, 1]], P, null, 0.008);
        DC.top([[0.5, -0.87], [0.535, -0.87], [0.535, 0.87], [0.5, 0.87]], P, 0.006);
        // the doors' shut lines, their handles
        for (const x of [0.76, -0.12, -0.96]) DC.side([[x - 0.008, 0.66], [x + 0.008, 0.66], [x + 0.008, 1.2], [x - 0.008, 1.2]], DK, null, 0.008);
        // (the garage's doors in the handles' place, the rear doors' handles out on the garage's skin: K.deli, mounts.vrata)
        const handle = (x, z) => { for (const sd of [-1, 1]) K.rect(x, 1.1, sd * z, 0.12, 0.03, B, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' }); };
        K.deli('vrata', () => { for (const x of [0.5, -0.38]) handle(x, 0.932); }, (n) => { if (n) handle(-0.38, 0.937); });
        // ---- the wide black flares over the big tyres (with the fenders and the quarters) ----
        for (const A of K.arches) for (const sd of [-1, 1]) K.flare(A.x, A.r + 0.01, A.r + 0.1, sd * 0.9, sd * 1.1, DK, { n: 4 });
        // ---- the nose: the narrow grille between the slim lamps (each a part of its own; the garage's in their place: K.deli, mounts.zarometi),
        //      an LED strip under each lamp, the indicators at its corners ----
        // (the garage's grille, in the body, and indicators (the fenders') in their place: K.deli, mounts.maska, mounts.zmigavci)
        K.part('body', () => K.deli('maska', () => K.grille(2.262, 0.9, 0, 0.56, 0.3, { slats: 4, slatCol: [0.3, 0.3, 0.32], frame: P, frameH: 0.02 })));
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(2.262, 0.99, sd * 0.64, 0.05, { pts: SLIM, d: 0.02, ring: null, host: sd < 0 ? 'headL' : 'headR' }); });
        for (const sd of [-1, 1]) K.rect(2.261, 0.915, sd * 0.64, 0.28, 0.018, LED, { host: sd < 0 ? 'headL' : 'headR' });
        K.deli('zmigavci', () => { for (const sd of [-1, 1]) K.rect(2.26, 0.84, sd * 0.79, 0.08, 0.05, AMB); });
        // ---- the bonnet: the raised scoop for the V8 (its intake facing forward), the ridge from it down to the grille (the garage's bonnet
        //      top in their place: mounts.hauba) ----
        K.part('hood', () => K.deli('hauba', () => {
          K.skin([[1.62, 0.11, 0.32], [1.0, 0.025, 0.36]].map(([x, h, w]) => { const y = L.topY(x, 0) - 0.004; return [[x, y, -w], [x, y + h, -w * 0.84], [x, y + h, w * 0.84], [x, y, w]]; }), P, DK, null, { part: 'hood' });
          K.skin([[2.18, 0.012, 0.05], [1.62, 0.05, 0.12]].map(([x, h, w]) => { const y = L.topY(x, 0) - 0.004; return [[x, y, -w], [x, y + h, 0], [x, y, w]]; }), P, P, null, { part: 'hood' });
        }));
        // ---- the plate bumper under the nose: the winch in its middle, the red shackles (the garage's tow points in their place, front and
        //      rear: mounts.vlecne_kljuke), two square lamps ----
        let VK = 0;
        K.part('bumperF', () => {
          K.box(2.34, 0.47, 0, 0.16, 0.22, 1.9, 0, DK, null, true);
          K.cyl([2.37, 0.645, -0.2], [2.37, 0.645, 0.2], 0.065, [0.3, 0.3, 0.32], { n: 6, capA: DK, capB: DK });
          K.rect(2.436, 0.645, 0, 0.16, 0.06, AL);
          for (const sd of [-1, 1]) K.rect(2.422, 0.55, sd * 0.8, 0.1, 0.07, LED);
          VK = K.deli('vlecne_kljuke', () => { for (const sd of [-1, 1]) K.rect(2.422, 0.5, sd * 0.56, 0.05, 0.08, RED); });
        }, { hinge: [[2.27, 0.47, -0.95], [2.27, 0.47, 0.95]] });
        // ---- the mirrors on the front doors' corners (the garage's: mounts.ogledala); the light bar along the hardtop's front edge (the
        //      garage's roof bars, mounts.relijske_luci 9, 11, 12, in its place) ----
        K.deli('ogledala', () => { for (const sd of [-1, 1]) K.mirror(0.72, 1.33, sd * 0.98, { col: B, w: 0.07, h: 0.14, d: 0.1, z0: sd * 0.93, crack: 1 }); });
        K.deli('relijske_luci', () => {});
        if (![9, 11, 12].includes(K.fitted.relijske_luci)) K.part('body', () => {
          K.box(0.42, 1.98, 0, 0.09, 0.08, 1.4, 0, DK, null, false);
          K.rect(0.466, 2.0, 0, 1.34, 0.045, LED);
        });
        // ---- the tail: the slim lamps on its corners (each a part of its own, in its black surround; the garage's in the surrounds:
        //      mounts.zadnje_luci), the bumper under the tailgate with its shackles ----
        for (const sd of [-1, 1]) K.rect(-2.101, 0.95, sd * 0.76, 0.13, 0.3, B, { dir: '-x', part: sd < 0 ? 'tailL' : 'tailR' });
        K.deli('zadnje_luci', () => { for (const sd of [-1, 1]) K.tailLamp(-2.104, 0.95, sd * 0.76, 0.08, 0.24, { host: sd < 0 ? 'tailL' : 'tailR' }); });
        K.part('bumperR', () => {
          K.box(-2.16, 0.42, 0, 0.12, 0.16, 1.8, 0, DK, null, true);
          if (!VK) for (const sd of [-1, 1]) K.rect(-2.222, 0.46, sd * 0.62, 0.05, 0.08, RED, { dir: '-x' });
        }, { hinge: [[-2.12, 0.42, -0.85], [-2.12, 0.42, 0.85]] });
        // ---- the tailgate (hinged on its left): the rear window, its handle; the spare wheel low on its carrier (with
        //      it, or by itself: the sub-range 'spare') ----
        K.part('tailgate', () => {
          K.rect(-2.103, 1.64, 0, 1.2, 0.4, G, { dir: '-x' });
          K.rect(-2.102, 1.1, 0.62, 0.12, 0.04, B, { dir: '-x' });
        }, { hinge: [[-2.1, 0.72, -0.86], [-2.1, 1.85, -0.86]] });
        K.part('tailgate', () => {
          K.tyre(-2.245, 0.98, 0, { axis: 'x', face: -1, w: 0.28 });
        }, { sub: 'spare' });
        // ---- the rock sliders under the doors, the rear axle under the short tail (in sight from behind) ----
        K.part('body', () => {
          for (const sd of [-1, 1]) K.bar([-0.96, 0.56, sd * 0.97], [0.76, 0.56, sd * 0.97], 0.035, T, { n: 4 });
          K.bar([-1.53, 0.45, -0.76], [-1.53, 0.45, 0.76], 0.07, DK, { n: 5 });
        });
        K.hinge('hood', [0.78, 1.24, -0.75], [0.78, 1.24, 0.75]);
        K.hinge('doorL', [0.76, 0.66, -0.93], [0.76, 1.2, -0.93]); K.hinge('doorR', [0.76, 0.66, 0.93], [0.76, 1.2, 0.93]);
        // ---- inside (seen once a part is off): the seats, the cage's hoop behind them, the V8 under the bonnet ----
        for (const sd of [-1, 1]) K.seat(-0.05, 0.98, sd * 0.42, { w: 0.5, l: 0.5, back: 0.74, tilt: 0.2, col: SEAT });
        K.cage([[[-0.6, 0.95, 0.8], [-0.6, 1.86, 0.8]], [[-0.6, 0.95, -0.8], [-0.6, 1.86, -0.8]], [[-0.6, 1.86, -0.8], [-0.6, 1.86, 0.8]]], 0.03, T, { n: 5 });
        K.engine(1.55, 0.72, 0, { l: 0.8, w: 0.72, h: 0.48 });
        // (none stock: the garage's spoiler (in the body), kit, exhaust, flaps, sunroof, roof scoop, aerials (in the body) and louvres (in
        //      the tailgate), stripes, decals, sun strip, calipers, fuel cap; the hidden parts round the V8 and at the wheels: their mounts)
        K.part('body', () => { K.deli('krilo', () => {}); K.deli('antena', () => {}); });
        K.part('tailgate', () => K.deli('zaluzije', () => {}));
        for (const id of ['aero', 'auspuh', 'lovilci_blata', 'streha', 'stresna_zajemalka', 'crte', 'nalepke', 'soncni_pas', 'celjusti', 'zamasek']) K.deli(id, () => {});
        for (const id of ['akumulator', 'filter_zraka', 'turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum']) K.deli(id, () => {});
      },
    },
  });
})();
