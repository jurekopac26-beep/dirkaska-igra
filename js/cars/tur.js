/* Vehicle 'tur' — TUR 6x6: an off-road double-cab pickup on six wheels, all six driven, set up for sliding (invented; no real model).
   Signature features: 1) the third axle under the long open bed (the tandem: the middle and the rear wheels), 2) the steel bumper with
   the bull bar, the winch and the big grille between round lamps, 3) the snorkel up the right pillar, the light bar over the windscreen,
   the roof rack, 4) the sports bar behind the cab and the spare wheel lying in the bed, 5) the dark flares over all six wheels. L 6.00
   W 2.20 H 2.15, the axles at +2.00 / -0.95 / -2.30 (m). The physics has two axles (the front one and the rear-most: a, b); the middle
   one is the look's (look.wheels.mid: its wheels turn with the rear ones), all six driven as the game's AWD (docs/novi-avti-2.md). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'tur', name: 'TUR 6x6', cat: 'teren', ord: 6, drive: 'AWD',
    desc: 'Terenski poltovornjak na šestih gnanih kolesih: snorkel, svetlobni pas, dolg keson.',
    // the AWD layer turned round for sliding (docs/novi-avti-2.md): the power swings the long tail round (pwr), a big slide for the turn
    // (tv), held long (out); tall, soft and heavy: slow to turn in (turn, kI), loose on dirt and grass (loose), a soft landing (landV).
    // The driving school's drift (tools/novi-avti-2/drift.js): Jezero 1985, Spa 489, Bathurst 717 (ŠKORPIJON H 1998 / 202 / 836)
    phys: { mass: 3300, a: 2.0, b: 2.3, kI: 1.5, kw: 640, redline: 6000, idle: 700, gears: [3.4, 2.2, 1.55, 1.2, 0.98, 0.82], final: 4.6, rw: 0.47, cDrag: 0.66, len: 6.0, wid: 2.2, steerMax: 0.66,
      tracK: 0.85, brakeK: 0.85, spinK: 0.5, loose: 1.2, looseDrag: 0.45, landV: 18, landK: 0.55, sway: 1.7 },
    arc: { amax: 1.66, kv: 1.85, rmin: 6.4 },
    csp: { bx: 0.14, coast: -0.04, thr: 0.02, liftP: 0.1, pwr: 0.14, out: 1.35, turn: 0.85, w: 0.95, tv: 1.55 },
    stats: { power: 10, grip: 5, weight: 1, drift: 10 },
    price: 80000, pk: 'open', field: ['tur'], fieldN: 9, fill: ['medved', 'pescenjak'],   // (a bigger race: 9 of its own through the field, the rest these two off-roaders of its pace (3.46 s / 190 and 4.08 s / 187 km/h): 99 of its own would not fit the phone's budget)
    snd: { kind: 'v8', hz: 0.8, loud: 1.3 },
    expect: { t100: [3.27, 3.67], vmax: [180, 196], latG: [1.97, 2.07], d100: [26.2, 28.0] },   // (measured 3.47 / 188 / 2.02 / 27.1)
    partNames: { tailgate: 'tailgate', headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamp', tailR: 'right tail lamp' },
    // the truck's set (the bumpers, the doors, the mirrors) and the pickup's own: the hood, the front fenders, the tailgate, each lamp
    parts: { set: 'truck', ht: 2.15, y0: 0.6,
      extra: {
        hood: { lx: 0.73 },
        fenderL: { lz: -0.95, f: 0.42, h: 0.13 },
        fenderR: { lz: 0.95, f: 0.42, h: 0.13 },
        tailgate: { z: 1, th: 0.7, m: 14, rW: 0.45, h: 0.08, lx: -1.0, lz: 0, f: 0.5 },
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.2, h: 0.08, lx: 0.98, lz: -0.67, y: 1.12 },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.2, h: 0.08, lx: 0.98, lz: 0.67, y: 1.12 },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.17, h: 0.05, lx: -1.0, lz: -0.85, y: 1.1 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.17, h: 0.05, lx: -1.0, lz: 0.85, y: 1.1 },
      },
      over: { doorL: { lx: 0.25 }, doorR: { lx: 0.25 }, mirrorL: { lx: 0.44 }, mirrorR: { lx: 0.44 } } },   // (the cab's doors and mirrors ahead of the middle)
    // where the garage's parts go (js/deli.js, look units): the wing on the cab roof's back edge, in the body (no stock one: the bed is
    // open, the pylons on the roof between the rack's rails, the endplates inside them); the head lamps where the round lamps are, in
    // the lamps' parts; the rims on its six wheels
    mounts: {
      krilo: { x: -0.68, w: 0.72, part: 'body', s: 1.3, front: -0.42 },
      zarometi: { x: 2.955, y0: 1.12, lean: 0, zc: 0.74, yc: 1.12, s: 0.22, hosts: ['headL', 'headR'], depth: 0.04, hiSeg: false },
      platisca: {},
      // (sklop 2 · spredaj, js/deli/spredaj.js) the kit's lips under the steel bumpers' boxes (no skirts: the steps take the sills;
      // options 2, 3 the tail's corner lips), its flares out from the stock ones over all six wheels (four segments round each: six
      // flares within the room for one car with parts, +300 triangles, tests/deli.test.js), the canards on the bumper's corners; the
      // bonnet's top from the cowl to the nose's drop; the grille between the round lamps; the indicators on the nose under the lamps
      // (the bumper's part of the face), the repeaters on the front fenders behind the wheels, the rear ones on the bumper, the
      // mirrors' fronts; the extra lamps on the bumper's face, four on its top inside the bull bar's legs, before the grille, the pod
      // under the bull bar's top bar, the roof bar in place of the light bar (the stock one goes with it): all in the bumper's part but
      // the roof bar
      aero: { xf: 3.02, xr: -3.11, w: 1.0, yf: 0.62, yr: 0.6, ws: 1.1, canY: 0.7, partF: 'bumperF', partR: 'bumperR', flareN: 4 },
      hauba: { x0: 1.6, x1: 2.85, w: 0.85, rel: true },
      maska: { x: 2.955, y0: 1.08, lean: 0, yc: 1.08, w: 1.0, h: 0.3, comb: 1.5 },
      zmigavci: { front: { x: 2.95, y: 0.9, z: 0.74, w: 0.14, h: 0.05, part: 'bumperF' }, side: { x: 1.62, y: 1.2, z: 1.059, hosts: ['fenderL', 'fenderR'] },
        rear: { x: -3.11, y: 0.68, z: 0.85, part: 'bumperR' }, mirror: { x: 1.4105, y: 1.64, z: 1.14, w: 0.11, parts: ['mirrorL', 'mirrorR'] } },
      relijske_luci: { bumper: [3.012, 0.73, 0.8], nose: [2.955, 1.12], foot: 0.84, feet: 0.5, intake: [2.955, 1.08, 1.0, 0.3], roof: [0.62, 0.75], pod: [2.955, 0.95, 1.2, 0.55], part: 'bumperF' },
      // (js/deli/zadaj.js) the tail lamps' room in the black surrounds on the bed's corners, the band across the tailgate between them;
      // the pipes under the rear bumper on the left (none stock: the tips under the kit's corner lips, hung from the bumper's foot on
      // straps, the valves on them, the silencer up against the bed's floor, the pipes up to it); no lid (the bed is open); the tow
      // points: the front one on the steel bumper's face beside the winch, the rear one on the tailgate over the bumper (clear of the
      // lips), across from the pipes; the flaps behind the front and the last wheels (in place of the stock ones), the guards on the
      // cab's sills over the steps
      zadnje_luci: { x: -3.033, zc: 0.9, yc: 1.1, w: 0.12, h: 0.3, hosts: ['tailL', 'tailR'], bar: { x: -3.053, y: 1.1, w: 0.68, h: 0.04, part: 'tailgate' } },
      auspuh: { x: -3.1, y: 0.49, z: 0.6, r: 0.05, len: 0.2, part: 'bumperR', drum: 0.703, pipe: 0.73, pipeX: -1.6, valve: true, hang: 0.6 },
      vlecne_kljuke: { f: [3.02, 0.72, 0.5], r: [-3.05, 0.84, 0.55], partR: 'tailgate' },
      lovilci_blata: { x: [1.42, -2.82], z: [0.8, 1.1], y: [0.72, 0.14], sill: [-0.26, 1.34, 0.77, 1.047], part: 'body' },
      // (js/deli/streha.js) the sunroofs on the cab's roof between a wing on its back edge and the light bar; the scoop's mouth behind
      // the light bar; the aerials: the rod on the roof's right rear outside the rack's rails (ahead of a wing, beside its endplates), the
      // fin ahead of a wing, the stub at the roof's front outside the light bar, the whip's foot mid-roof outside the rails; the louvres
      // over the window in the cab's back wall
      streha: { x0: -0.5, x1: 0.52, xf: 0.45, xr: -0.4, back: -0.45 },
      stresna_zajemalka: { x: 0.5, z: 0, back: -0.45 },
      antena: { x: -0.3, z: 0.86, fin: [-0.42, 0], front: [0.72, 0.84], whip: 0.2, part: 'body' },
      zaluzije: { x0: -0.716, y0: 1.5, x1: -0.684, y1: 2.04, w: 0.6, part: 'body' },
      // (js/deli/bok.js) the big black mirrors on the doors (their arms in to the glass); the doors inside their shut lines (the window
      // from the B-pillar to the A-pillar's slant, under it; the rubbing strip and the pressed lines on the tall door's own heights, the
      // strip's bolts on the side's own line)
      ogledala: { x: 1.32, y: 1.64, z: 1.14, w: 0.18, h: 0.24, d: 0.15, z0: 0.985 },
      vrata: { x: [0.08, 1.45], y: [0.92, 1.36], handle: [0.3, 1.3, 1.058, 0.16, 0.035], win: [[0.14, 0.06], [1.07, 0.06], [0.78, 0.92], [0.14, 0.92]],
        frame: [0.08, 0.14, 0.92, 0.98], netIn: 0.004, rub: 0.96, rubSide: true, crease: [1.0, 1.26] },
      zavore: { s: 1 },
      matice: { k: 6, r: 0.2 },
      // (sklop 3 · barve, js/deli/barve.js) the stripes over the bonnet and the cab's roof (not over the open bed, not under the light
      // bar), option 7's bands on the tall sides higher up (dy), from the tailgate to the nose (sx); the decals on the doors behind the
      // number panels, on the bed's sides over the rear flares (over their middle: +300 triangles) and on the front fenders over theirs
      // (behind the repeaters), on the bonnet and the roof; the sun strip on the windscreen's top; the fuel cap on the right bed side
      // behind the cab, over the middle flare; the calipers
      barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {},
      crte: { z: [0.3, 0.48], x: [[1.6, 2.86], [-0.62, 0.52]], dy: 0.52, sx: [-2.95, 2.85] },
      nalepke: { side: [[0.14, 0.52], [-2.6, -1.8], [1.75, 2.8]], y: [1.12, 1.32], hood: { x: [1.7, 2.6], z: [0.25, 0.7] }, roof: { x: [-0.45, 0.45] } },
      soncni_pas: { x: [0.78, 0.92] }, zamasek: { x: -1.25, y: 1.24, z: 1.05, r: 0.045 },
      celjusti: { r: [0.119, 0.223], a: [70, 125] },
      // (sklop 3 · skriti deli, js/deli/skriti.js) the V8's bay under the long bonnet (open to the front wheels under the tubs' walls,
      // from 0.84 up): the filter against the block's left over the floor, the turbo against its right (the twins one each side), the
      // battery on the floor ahead of the right front arch, the control box on the block's top beside the intake; the struts and bars at
      // the six wheels (the struts against the tubs' walls, the coils' feet at the walls' foot: the front tubs' higher; the dampers'
      // reservoirs at the front and rear four only: within the room)
      filter_zraka: { x: 1.85, y: 0.845, z: -0.48 }, akumulator: { x: 2.6, y: 0.755, z: 0.52 }, turbo: { x: 2.3, y: 0.84, z: 0.42, twin: [-0.84, 0], ic: [2.36, 0.845, 0.42] }, cip: { x: 1.9, y: 1.196, z: 0.25 },
      vzmeti: { in: 0.21, top: 1.04, seat: [0.83, 0.72], hiN: 6 }, amortizerji: { in: 0.205, top: 1.06, mid: false, hiN: 6 }, stabilizatorji: { in: 0.18, floor: 0.72 }, dim_gum: {},
    },
    // the look (KIT API v1, render.js; look units = metres: the centre of mass at x 0, the front axle at 2.00, the rear-most at -2.30, the
    // middle one at -0.95): one loft from the tailgate to the nose: the bed (its top open), the cab's back wall with its window, the roof,
    // the windscreen, the long hood, the nose; the regions cut it into the front doors (their glass with them), the fenders and the hood;
    // the end caps into the tailgate over the rear valance and the nose over the front bumper
    look: {
      body: { len: 6.0, wid: 2.2, roofY: 2.15,
        //       x      w     yb    ybelt  wt    yt    cr    kind  tuck
        secs: [[-3.05, 1.02, 0.74, 1.3, 1.0, 1.38, 0.01, 'b', 0.12],    // the tailgate's face
          [-2.99, 1.05, 0.72, 1.34, 1.03, 1.42, 0.01, 'b', 0.12],       // the bed's end (open on top from here)
          [-0.72, 1.05, 0.72, 1.36, 1.03, 1.44, 0.01, 'gr', 0.12],      // the bed's front (the headboard); its segment: the cab's back wall
          [-0.68, 1.05, 0.72, 1.38, 0.92, 2.1, 0.03, 'r', 0.1],         // the roof's back edge
          [0.78, 1.05, 0.72, 1.38, 0.92, 2.12, 0.03, 'gf', 0.1],        // the windscreen's top
          [1.55, 1.06, 0.72, 1.34, 0.98, 1.52, 0.03, 'b', 0.12],        // its base (the cowl)
          [2.8, 1.05, 0.72, 1.3, 0.98, 1.46, 0.03, 'b', 0.12],          // the long hood's front
          [2.92, 1.0, 0.76, 1.22, 0.94, 1.38, 0.02, 'b', 0.12],
          [2.95, 0.96, 0.8, 1.14, 0.9, 1.3, 0.01, 'b', 0.1]],           // the nose: the grille between the round lamps
        eye: { x: 0.2, y: 1.78 },
        crush: { x0: -0.3, x1: 1.03, z: 1.03 },   // (the cab's roof from 38 cm ahead of its back edge, the back wall holds that strip: a knock from behind caves the roof in; x1 and z the default's)
      },
      hi: true,   // (Nastavitve · Detajli avtov: Visoki: the small details at the end of build, the driver; the knob tyres keep their own)
      budget: { inner: 1400 }, budgetHi: { inner: 1750 },   // (its cabin, as KOLIBRI's: the inner block over a car's 800 / 1200; drawn only once a door opens, a pane breaks or a part is off)
      wheels: { style: 'knob', w: 0.36, rim: [0.16, 0.16, 0.17], cap: [0.2, 0.2, 0.21], gap: 0.08, mid: -0.95 },   // (mid: 1.35 m ahead of the rear axle: the garage lift's pad stands 15 cm off the rubber of both tandem axles between them)
      regions: [
        { part: 'doorL', x: [0.08, 1.45], bands: ['side', 'window'], side: 'L' }, { part: 'doorR', x: [0.08, 1.45], bands: ['side', 'window'], side: 'R' },
        { part: 'fenderL', x: [1.55, 2.92], bands: ['tuck', 'side', 'window'], side: 'L' }, { part: 'fenderR', x: [1.55, 2.92], bands: ['tuck', 'side', 'window'], side: 'R' },
        { part: 'hood', x: [1.55, 2.92], bands: ['edge', 'crown'] }],
      build(K) {
        const P = K.paint, B = K.black, G = K.GLASS, DK = [0.08, 0.08, 0.09], D = [0.12, 0.12, 0.13], LED = [0.95, 0.96, 1.0], ST = [0.3, 0.3, 0.32];
        // the shell: the paint; the bed open on top (segment 1), the cab's back wall (2) with its window, the roof (3), the windscreen (4);
        // the side windows along the roof; the lower edge dark
        const L = K.loft(K.secs(K.body.secs), (k, e, kind, at) => {
          if (e === 0 || e === 8) return DK;
          if (k === 1 && e >= 3 && e <= 5) return null;
          if (kind === 'gf' && e >= 2 && e <= 6) return G;
          if (kind === 'r' && (e === 2 || e === 6)) return G;
          if (kind === 'gr' && e >= 3 && e <= 5) return G;
          return P;
        }, { caps: { front: { col: P, colLow: DK, cut: 0.95, low: 'bumperF', high: 'body' }, rear: { col: P, colLow: DK, cut: 0.78, low: 'bumperR', high: 'tailgate' } } });
        const DC = L.decal;
        // the B-pillar, the dark cladding under the doors, the start number and the handles on the front doors
        DC.band([[0.02, 0], [0.14, 0], [0.14, 1], [0.02, 1]], B, null, 0.01);
        DC.side([[-0.6, 0.76], [1.42, 0.76], [1.42, 0.92], [-0.6, 0.92]], DK, null, 0.006);
        for (const sd of [-1, 1]) {
          const door = sd < 0 ? 'doorL' : 'doorR', f = sd < 0 ? '-z' : 'z';
          K.number(0.8, 1.06, sd * 1.06, 0.36, { dir: f, host: door });
          K.hinge(door, [1.45, 0.8, sd * 1.05], [1.45, 1.36, sd * 1.05]);
        }
        // (the garage's doors in the handles' place: K.deli, mounts.vrata)
        K.deli('vrata', () => { for (const sd of [-1, 1]) K.rect(0.3, 1.3, sd * 1.058, 0.16, 0.035, B, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' }); });
        // the dark flares over all six wheels, the mud flaps behind the last ones (the garage's flaps in their place: K.deli,
        // mounts.lovilci_blata), the steps under the doors
        for (const A of K.arches) for (const sd of [-1, 1]) K.flare(A.x, 0.56, 0.64, sd * 1.0, sd * 1.1, DK);
        K.deli('lovilci_blata', () => { for (const sd of [-1, 1]) K.box(-2.82, 0.12, sd * 0.98, 0.02, 0.46, 0.3, 0, DK, null, true, { part: 'body' }); });
        for (const sd of [-1, 1]) K.box(0.4, 0.58, sd * 1.02, 1.4, 0.05, 0.16, 0, DK, null, false, { part: 'body' });
        // the nose: the big grille, the round lamps (each a part of its own; the garage's lamps in their place: K.deli, mounts.zarometi)
        K.deli('maska', () => K.grille(2.955, 1.08, 0, 1.0, 0.3, { slats: 4 }));   // (the garage's grille in its place: mounts.maska)
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(2.955, 1.12, sd * 0.74, 0.11, { ring: DK, host: sd < 0 ? 'headL' : 'headR' }); });
        // the steel bumper with the bull bar and the winch
        K.part('bumperF', () => {
          K.box(2.92, 0.62, 0, 0.2, 0.22, 2.0, 0, DK);
          for (const sd of [-1, 1]) K.bar([3.0, 0.84, sd * 0.78], [3.0, 1.3, sd * 0.6], 0.04, DK, { n: 6 });
          K.bar([3.0, 1.3, -0.6], [3.0, 1.3, 0.6], 0.04, DK, { n: 6 });
          K.box(2.98, 0.66, 0, 0.12, 0.12, 0.5, 0, ST);
        }, { hinge: [[2.85, 0.7, -0.9], [2.85, 0.7, 0.9]] });
        // the snorkel up the right pillar, the light bar over the windscreen (the garage's roof bars, mounts.relijske_luci 9, 11, 12, in
        // its place), the roof rack's rails
        K.cyl([1.5, 1.32, 1.08], [0.9, 2.05, 1.06], 0.07, DK, { n: 8, part: 'body' });
        K.deli('relijske_luci', () => {});
        if (![9, 11, 12].includes((K.fitted || {}).relijske_luci)) { K.box(0.62, 2.13, 0, 0.12, 0.08, 1.5, 0, DK); K.rect(0.682, 2.17, 0, 1.4, 0.05, LED); }
        for (const sd of [-1, 1]) K.bar([-0.55, 2.16, sd * 0.78], [0.5, 2.16, sd * 0.78], 0.02, DK, { n: 5 });
        // the bed: the sports bar behind the cab, the spare wheel lying in it
        for (const sd of [-1, 1]) K.bar([-0.9, 1.44, sd * 0.98], [-0.9, 1.95, sd * 0.86], 0.045, DK, { n: 6 });
        K.bar([-0.9, 1.95, -0.86], [-0.9, 1.95, 0.86], 0.045, DK, { n: 6 });
        K.tyre(-1.9, 1.02, 0, { axis: 'y' });
        // the tail: the lamps on the bed's corners (each a part of its own, in its black surround), the rear bumper with its step
        for (const sd of [-1, 1]) { const tp = sd < 0 ? 'tailL' : 'tailR';
          K.rect(-3.053, 1.1, sd * 0.9, 0.18, 0.36, B, { dir: '-x', part: tp }); }
        K.deli('zadnje_luci', () => { for (const sd of [-1, 1]) K.tailLamp(-3.056, 1.1, sd * 0.9, 0.12, 0.3, { host: sd < 0 ? 'tailL' : 'tailR' }); });   // (the garage's: mounts.zadnje_luci)
        K.part('bumperR', () => K.box(-3.02, 0.6, 0, 0.18, 0.16, 2.0, 0, DK), { hinge: [[-2.95, 0.68, -0.9], [-2.95, 0.68, 0.9]] });
        // the big black mirrors on the doors
        K.deli('ogledala', () => { for (const sd of [-1, 1]) K.mirror(1.32, 1.64, sd * 1.14, { col: DK, w: 0.18, h: 0.24, crack: 1 }); });   // (the garage's: mounts.ogledala; crack: the glass in pieces, it cracks in a crash)
        K.hinge('hood', [1.55, 1.5, -0.7], [1.55, 1.5, 0.7]);
        K.hinge('tailgate', [-3.02, 0.76, -0.8], [-3.02, 0.76, 0.8]);
        // ---- Visoki (Nastavitve · Detajli avtov: Visoki): a generic badge in the grille and on the tailgate, the handles' grips, the round
        //      lamps' bulbs, the tail lamps' sections (the stock lamps'), the driver at the wheel ----
        const C = K.cab, IN = C.IN, F = K.fitted || {}, RED = [0.75, 0.1, 0.08], SZ = -0.45, LR = (n, sd) => n + (sd < 0 ? 'L' : 'R'), bx = (o) => Object.assign({ dir: '-x' }, o);
        if (K.hi) {
          if (!F.maska) C.badge(2.962, 1.08, 0, 1, 'body', 0.04);   // (K.fitted: a garage part in a detail's place: none of it there)
          C.badge(-3.052, 1.24, 0, -1, 'tailgate', 0.04);
          for (const sd of [-1, 1]) {
            if (!F.vrata) K.box(0.3, 1.292, sd * 1.065, 0.13, 0.016, 0.014, 0, [0.12, 0.12, 0.13], null, false, { host: LR('door', sd) });
            if (!F.zarometi) { const h = { host: LR('head', sd) }; K.discX(2.9605, 1.12, sd * 0.74, 0.035, 8, [1, 0.99, 0.94], 1, h); K.rect(2.9608, 1.12, sd * 0.74, 0.2, 0.007, [0.7, 0.72, 0.76], h); }
            if (!F.zadnje_luci) { const h = bx({ host: LR('tail', sd) });
              K.rect(-3.0802, 1.2, sd * 0.9, 0.1, 0.08, K.rgb(0xff9a1e), h); K.rect(-3.0802, 0.99, sd * 0.9, 0.1, 0.07, [0.9, 0.9, 0.88], h);
              for (const y of [1.155, 1.03]) K.rect(-3.0804, y, sd * 0.9, 0.12, 0.008, DK, h); } }
          K.driver(0.34, 1.7, SZ, { inner: true, r: 0.115, lean: 0.22, hands: [0.805, 1.415, 0.19], knee: [0.76, 1.16, 0.17], feet: [1.12, 0.84, 0.11], suit: [0.14, 0.16, 0.2], helmet: [0.93, 0.93, 0.9] });
        }
        // ---- inside (as KOLIBRI's: K.cab; seen once a door opens, a pane breaks or a part is off): the carpet, the firewall, the cab's back
        //      wall, the tunnel, the dashboard, the wheel on its column, the front seats on their boxes, the rear bench, the middle wheels'
        //      housings, the console with the transfer lever, the pedals, the door cards, the rear sides' trim; the V8 with its battery and
        //      air filter, the nose's radiator, the tail's cross member. Nothing taller than the old seats' backs (1.612: the roof's field
        //      stays); nothing behind the cab's back wall (-0.68) ----
        { const CARP = [0.085, 0.08, 0.075], LE = [0.44, 0.27, 0.14], LE2 = [0.13, 0.11, 0.1], BOXC = [0.1, 0.1, 0.11], AL = [0.55, 0.56, 0.58], cyl = (o) => Object.assign({ n: 6, inner: true, part: 'body' }, o);
          C.face([[-0.68, 0.78, -0.97], [1.49, 0.78, -0.97], [1.49, 0.78, 0.97], [-0.68, 0.78, 0.97]], CARP, [0, 1, 0]);                // the carpet
          C.face([[1.49, 0.78, -0.97], [1.49, 0.78, 0.97], [1.49, 1.2, 0.97], [1.49, 1.2, -0.97]], CARP, [-1, 0, 0]);                    // the firewall, from the cabin
          C.face([[1.5, 0.78, -0.97], [1.5, 0.78, 0.97], [1.5, 1.45, 0.97], [1.5, 1.45, -0.97]], K.shade(P, 0.55), [1, 0, 0]);          // and from the bay
          C.face([[-0.675, 0.78, -0.97], [-0.675, 0.78, 0.97], [-0.675, 1.36, 0.97], [-0.675, 1.36, -0.97]], C.PL2, [1, 0, 0]);       // the cab's back wall under its window
          K.box(0.66, 0.78, 0, 1.46, 0.14, 0.26, 0, C.PL2, C.PL, true, IN);                                                             // the tunnel
          C.dash({ x: 0.98, y: 1.5, d: 0.5, w: 0.95, dz: SZ, col: D, col2: [0.17, 0.16, 0.15] });
          C.steer({ c: [0.82, 1.41, SZ], ax: [0.8, -0.6], r: 0.19, rr: 0.02, to: [1.06, 1.23, SZ] });
          for (const sd of [-1, 1]) { K.box(0.46, 0.78, sd * 0.45, 0.42, 0.08, 0.42, 0, BOXC, null, true, IN);
            C.seat(0.46, 0.86, sd * 0.45, { w: 0.52, top: 0.7, col: LE, col2: LE2 }); }
          C.bench(-0.28, 0.78, { w: 1.3, top: 0.72, heads: [-0.4, 0.4], col: LE, col2: LE2 });
          for (const sd of [-1, 1]) K.box(-0.56, 0.78, sd * 0.815, 0.22, 0.19, 0.3, 0, C.PL2, C.PL, true, IN);                        // the middle wheels' housings
          C.console(0.84, 0.92, { l: 0.36 });
          K.bar([0.7, 0.92, 0.06], [0.68, 1.04, 0.06], 0.007, [0.5, 0.5, 0.52], { n: 4, inner: true, part: 'body' });                 // the transfer lever
          K.box(0.68, 1.035, 0.06, 0.035, 0.035, 0.035, 0, C.BLK, RED, true, IN);
          C.pedals(1.18, 0.8, SZ, 3);
          for (const sd of [-1, 1]) { C.door(sd, { x: [0.14, 1.4], y: [0.8, 1.34], z: 0.97, insert: LE, speaker: false });
            K.rect(-0.3, 1.07, sd * 0.97, 0.72, 0.54, C.PL, { dir: sd < 0 ? 'z' : '-z', inner: true, part: 'body' }); }               // the rear sides' trim
          K.engine(2.2, 0.8, 0, { l: 0.9, w: 0.75, h: 0.55 });
          K.deli('akumulator', () => K.box(2.6, 0.755, 0.52, 0.2, 0.17, 0.14, 0, DK, [0.16, 0.16, 0.18], true, IN));
          K.deli('filter_zraka', () => K.cyl([1.85, 0.845, -0.48], [1.85, 0.995, -0.48], 0.1, [0.1, 0.1, 0.11], cyl({ capA: null, capB: AL })));
          C.nose({ x: 2.76, w: 0.85, y: [0.64, 1.2], rad: [1.1, 0.46], bar: 2.86, barY: 0.66, barW: 1.7 });
          C.tail({ x: -2.92, w: 0.95, y: [0.6, 0.78], bar: -2.99, barY: 0.62, barW: 1.8 }); }
        // the garage's parts with no stock one in their place (K.deli, mounts): the wing, the kit, the bonnet's top, the pipes, the
        // aerials and the back window's louvres, the indicators, the roof's, the tow points, the colours' and the hidden ones in the bay
        // and at the wheels
        K.part('hood', () => K.deli('hauba', () => {}));
        K.part('body', () => { K.deli('antena', () => {}); K.deli('zaluzije', () => {}); });
        for (const id of ['krilo', 'aero', 'auspuh', 'zmigavci', 'streha', 'stresna_zajemalka', 'vlecne_kljuke', 'crte', 'nalepke', 'soncni_pas', 'celjusti', 'zamasek']) K.deli(id, () => {});
        for (const id of ['turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum']) K.deli(id, () => {});
      },
    },
  });
})();
