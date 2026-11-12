/* Vehicle 'gozdar' — GOZDAR: a short-course off-road racing pickup. Signature features: 1) a pickup cab with a short bed, 2) a big wing
   standing in the bed, 3) long-travel suspension with huge arches, 4) a tubular front bumper, 5) number panels on the doors. L 4.90 W
   2.20 H 1.75, wheelbase 2.95, overhangs F 0.90 R 1.05 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  // the garage's head lamp in the place of the rectangular lamp in the fascia's black band (u out from the car's middle, v up; metres round
  // z 0.78, y 0.91): every option takes this outline
  const RECT = [[-0.15, -0.065], [0.15, -0.065], [0.15, 0.065], [-0.15, 0.065]];
  VEHICLE_DEFS.push({
    id: 'gozdar', name: 'GOZDAR', cat: 'teren', ord: 4, drive: 'FR',
    desc: 'Dirkalni poltovornjak za kratke terenske steze z velikim krilom na kesonu.',
    phys: { mass: 1360, a: 1.55, b: 1.4, kI: 1.35, kw: 380, redline: 7000, idle: 850, gears: [3.3, 2.1, 1.48, 1.12, 0.9], final: 5.16, rw: 0.42, cDrag: 0.55, len: 4.9, wid: 2.2, steerMax: 0.62,
      tracK: 0.9, brakeK: 0.9, spinK: 0.8, loose: 1.25, looseDrag: 0.4, landV: 20, landK: 0.5, sway: 1.6 },
    arc: { amax: 1.56, kv: 1.85, rmin: 5.6 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.1, pwr: 0.12, out: 1.3, turn: 0.9, w: 0.95, tv: 1.15 },   // (the FR layer: lift-off and power rotation; its own liftP, pwr, out, turn, w, tv)
    stats: { power: 9, grip: 4, weight: 6, drift: 10 },
    price: 50000, pk: 'ppo', field: ['gozdar'],
    snd: { kind: 'v8', hz: 0.9, loud: 1.3 },
    expect: { t100: [3.73, 4.37], vmax: [219, 233], latG: [1.99, 2.09], d100: [24.7, 27.3] },
    partNames: { tailgate: 'tailgate', headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamp', tailR: 'right tail lamp' },
    parts: { set: 'truck', ht: 1.75, y0: 0.4,
      extra: {
        hood: { lx: 0.62 },
        fenderL: { lz: -0.92, f: 0.39, h: 0.13 },   // (the fenders lie as thick as their tops' curl, the wing as its plates)
        fenderR: { lz: 0.92, f: 0.39, h: 0.13 },
        wing: { f: 0.84, lx: -0.85, h: 0.22 },
        tailgate: { z: 1, th: 0.7, m: 10, rW: 0.4, h: 0.08, lx: -0.98, lz: 0, f: 0.45 },
        // (as KOLIBRI's: the rectangular lamps in the fascia's band parts of their own, a hit on their corner knocks one out; the tail lamps
        // on the bed's corners likewise, each in its black surround)
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.17, h: 0.06, lx: 0.94, lz: -0.71, y: 0.91 },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.17, h: 0.06, lx: 0.94, lz: 0.71, y: 0.91 },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.17, h: 0.05, lx: -0.98, lz: -0.88, y: 0.98 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.17, h: 0.05, lx: -0.98, lz: 0.88, y: 0.98 },
      },
      // (where the look has them: each part's debris flies off from its range's middle)
      over: { doorL: { lx: 0.09, lz: -0.84, f: 0.47 }, doorR: { lx: 0.09, lz: 0.84, f: 0.47 }, mirrorL: { lx: 0.25, lz: -0.93, f: 0.65 }, mirrorR: { lx: 0.25, lz: 0.93, f: 0.65 },
        bumperF: { lx: 0.97, f: 0.2 }, bumperR: { lx: -0.98, f: 0.17 } },
    },
    // where the garage's parts go (js/deli.js, look units): the wing on the cab roof's back edge, in the wing's part (in place of the wing
    // standing in the bed: an open bed has no deck for the garage's pylons); the head lamps in the place of the rectangular lamps (every
    // option in their outline, RECT), in the lamps' parts; the rims
    mounts: {
      krilo: { x: -0.62, w: 0.8, part: 'wing', s: 1.3, front: -0.42 },
      zarometi: { x: 2.304, y0: 0.91, lean: 0, zc: 0.78, yc: 0.91, s: 0.54, hosts: ['headL', 'headR'], shape: RECT, bulge: 0, ringW: 0.008 },
      platisca: {},
      // (sklop 2 · spredaj, js/deli/spredaj.js) the kit's lips under the fascia and the tailgate (no skirts: the cab steps in between the
      // wide fenders and the bed, sill none), its flares on the fenders' and the bed's sides; the bonnet's top from the cowl's step to the
      // nose (the scoop with it); the grille in the fascia's band between the lamps; the indicators under the lamps, the repeaters on the
      // front fenders behind the wheels, the rear ones on the tailgate beside the lamps, the mirrors' fronts; the extra lamps on the tube
      // bumper's bar, four in front of the hoop on a bar on its legs, the LED bar over the valance, the roof bar at the roof's front edge
      // (in front of the scoop's mouth), the pod low over the fascia (under the hoop's top bar); the honeycomb's cells bigger (a wide grille)
      aero: { xf: 2.3, xr: -2.4, w: 0.95, yf: 0.64, yr: 0.58, ws: 1.08, ys: 0.58, exh: [-0.55, 0.045], lipIn: 0.04, canY: 0.66 },
      hauba: { x0: 0.82, x1: 2.22, w: 0.7, rel: true },
      maska: { x: 2.302, y0: 0.9, lean: 0, yc: 0.9, w: 1.1, h: 0.22, comb: 1.5 },
      zmigavci: { front: { x: 2.302, y: 0.74, z: 0.84, w: 0.18, h: 0.05, part: 'body' }, side: { x: 0.9, y: 0.89, z: 1.08, hosts: ['fenderL', 'fenderR'] },
        rear: { x: -2.402, y: 0.78, z: 0.8, part: 'tailgate' }, mirror: { x: 0.6505, y: 1.29, z: 1.02, w: 0.1, parts: ['mirrorL', 'mirrorR'] } },
      relijske_luci: { bumper: [2.4, 0.715, 0.6], nose: [2.37, 0.9], intake: [2.3, 0.735, 1.0, 0.05], roof: [0.345, 0.6], pod: [2.302, 0.66, 0.86, 0.9], foot: 0.64, feet: 0.5, part: 'bumperF' },
      // (js/deli/zadaj.js) the tail lamps' room in the black surrounds on the bed's corners, the band across the tailgate between them;
      // the exhaust's tip on the left under the tail (the silencer up under the bed, its pipe under the cab's floor, each tip on a
      // rubber hanger up to the bed's floor; the flaps on the tips: they stand far out); no lid (the bed is open); the tow points where
      // the red hooks are on the tube bumpers, the arrows on the body behind them; the flaps behind the wheels, the guards on the cab's sills
      zadnje_luci: { x: -2.386, zc: 0.97, yc: 0.98, w: 0.14, h: 0.28, hosts: ['tailL', 'tailR'], bar: { x: -2.404, y: 1.05, w: 0.8, h: 0.03, part: 'tailgate' } },
      auspuh: { x: -2.36, y: 0.5, z: 0.55, r: 0.045, len: 0.16, part: 'body', drum: 0.556, pipe: 0.586, valve: true, hang: 0.61 },
      vlecne_kljuke: { f: [2.47, 0.6, 0.22], r: [-2.475, 0.64, 0.62], tube: [2.302, -2.402] },
      lovilci_blata: { x: [0.96, -1.97], z: [0.74, 1.06], y: [0.62, 0.22], sill: [-0.62, 0.72, 0.6, 0.93], part: 'body' },
      // (js/deli/streha.js) the sunroofs on the cab's roof between a wing on its back edge and the stock scoop; the scoop's mouth where
      // the stock one has it; the aerials: the rod on the bed's rail at its right front corner, the fin ahead of a wing, the stub at the
      // roof's front beside the scoop, the whip's foot at the roof's front edge; the louvres over the rear window in the cab's back wall
      streha: { x0: -0.45, x1: 0.04, xf: 0.01, xr: -0.47, back: -0.4 },
      stresna_zajemalka: { x: 0.32, z: 0, back: -0.4 },
      antena: { x: -0.72, z: 0.88, fin: [-0.38, 0], front: [0.24, 0.5], whip: 0.31, part: 'body' },
      zaluzije: { x0: -0.668, y0: 1.31, x1: -0.668, y1: 1.57, w: 0.55, part: 'body' },
      // (js/deli/bok.js) the mirrors on the doors' front corners, the doors inside their shut lines (the window from the B-pillar to the
      // A-pillar's slant, under the black line at the roof's edge; the rubbing strip and the pressed lines on the high door's own heights)
      ogledala: { x: 0.62, y: 1.29, z: 1.02, w: 0.06, h: 0.11, d: 0.15, z0: 0.91 },
      vrata: { x: [-0.33, 0.74], y: [0.66, 1.15], handle: [-0.22, 1.1, 0.938, 0.14, 0.03], win: [[-0.33, 0.01], [0.62, 0.01], [0.654, 0.05], [0.335, 0.84], [0.3, 0.93], [-0.33, 0.93]], frame: [-0.38, -0.33, 0.93, 1.0], netIn: 0.003, rub: 0.695, crease: [0.69, 1.07] },
      zavore: { s: 1 },
      matice: { k: 6, r: 0.2 },
      // (sklop 3 · barve, js/deli/barve.js) the stripes over the bonnet beside its scoop and over the cab's roof (not over the open bed);
      // the decals behind the doors' number panels and on the bed's sides behind the rear wheels (under the livery's band), on the
      // bonnet (back from 0.3 m behind its nose: the loft's sections close there, the flames cut at each, over the room) and the roof;
      // the sun strip where the stock one is; the fuel cap on the right bed side behind the cab; the calipers
      barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {},
      crte: { z: [0.26, 0.5], x: [[0.8, 2.3], [-0.64, 0.34]] },
      nalepke: { side: [[-0.3, 0.0], [-2.36, -2.0]], y: [0.66, 0.86], hood: { x: [0.9, 1.95], z: [0.3, 0.7] }, roof: { x: [-0.55, 0.04] } },
      soncni_pas: { x: [0.34, 0.43] }, zamasek: { x: -0.74, y: 0.88, z: 1.08, r: 0.045 },
      celjusti: { r: [0.1, 0.18], a: [70, 125] },
      // (sklop 3 · skriti deli, js/deli/skriti.js) the V8's bay under the long bonnet: the filter beside the block's left, the turbo
      // beside its right, the battery on the floor ahead of the cowl, the control box on the engine's side; the struts and bars at the
      // wheels: the springs on the front lower arms and on the rear axle, the front bar under the bay's floor, the rear one on the diff
      filter_zraka: { x: 1.2, y: 0.75, z: -0.42 }, akumulator: { x: 0.78, y: 0.613, z: 0.5 }, turbo: { x: 1.6, y: 0.75, z: 0.42, twin: [-0.76, -0.08] }, cip: { x: 1.3, y: 0.8, z: 0.33 },
      vzmeti: { in: 0.2, top: 0.95, seat: [0.35, 0.44] }, amortizerji: { in: 0.2, top: 0.95 }, stabilizatorji: { in: 0.2, floor: [0.57, 0.5] }, dim_gum: {},
    },
    // the look (KIT API v1, render.js; look units = metres): one loft from the tailgate to the nose: the bed (its top open: lined, floored,
    // the wheel housings inside it), the cab's back wall, the roof, the windscreen, a step out to the wide front fenders round the long
    // hood, the nose; the regions cut it into the doors (their glass with them), the fenders (their tops too) and the hood; the end caps
    // into the tailgate over the rear valance (bumperR) and the fascia over the front valance (bumperF). On top: the wing between its
    // endplates on a pylon on each bed rail, the tube bumper with its skid plate, the rear tube bumper, the coil-overs and their hoop in the
    // bed, the axles' arms under the body, the number panels on the doors, the mirrors, the roof's scoop. The livery: the body in the paint
    // over a black lower edge, a band rising along the sides, the wing's main plane, the tailgate's band and the sun strip in the stripe
    // colour
    look: {
      body: { len: 4.9, wid: 2.2, roofY: 1.69,
        //       x      w     yb    ybelt  wt    yt    cr    kind  tuck
        secs: [[-2.4, 1.08, 0.58, 1.12, 0.86, 1.16, 0, 'b', 0.08],     // the tailgate (the bed's end: open on top)
          [-0.66, 1.08, 0.58, 1.12, 0.86, 1.16, 0, 'b', 0.08],         // the bed's front (the headboard); its segment: the cab's back wall
          [-0.64, 0.93, 0.58, 1.17, 0.8, 1.64, 0.05, 'r', 0.08],       // the roof's back edge
          [0.34, 0.93, 0.58, 1.17, 0.8, 1.64, 0.05, 'gf', 0.08],       // the windscreen's top
          [0.74, 0.93, 0.58, 1.17, 0.93, 1.18, 0.03, 'b', 0.08],       // its base, the cowl (wt = w: no glass faces up at the driver); then the step out
          [0.8, 1.08, 0.58, 1.12, 0.8, 1.15, 0.05, 'b', 0.08],         // the fenders' back edge, the hood's
          [2.24, 1.07, 0.62, 1.07, 0.78, 1.1, 0.02, 'b', 0.08],
          [2.3, 1.04, 0.64, 1.02, 0.74, 1.05, 0.01, 'b', 0.08]],       // the nose: the fascia
        eye: { x: -0.18, y: 1.47, near: 0.25, tilt: 0.06, style: 'closed' },
        decalX: -0.24, decalY: 1.69, decalRz: 0, decalS: 0.72,             // (the start number on the roof, behind its scoop)
        crush: { x0: -0.3, x1: 0.55, z: 0.82 }, cage: true },          // (only the cab's roof crushes, between the cage's hoops: its back edge stays on the main hoop; a roll cage in the cockpit)
      hi: true,   // (Nastavitve · Detajli avtov: Visoki: the small details at the end of build, the driver; the knob tyres keep their own)
      budget: { inner: 1400 }, budgetHi: { inner: 1750 },   // (its cabin, as KOLIBRI's: the inner block over a car's 800 / 1200; drawn only once a door opens, a pane breaks or a part is off)
      wheels: { style: 'knob', w: 0.32, rim: [0.36, 0.37, 0.39], cap: [0.62, 0.63, 0.66], gap: 0.16 },
      regions: [
        { part: 'doorL', x: [-0.33, 0.74], bands: ['side', 'window'], side: 'L' }, { part: 'doorR', x: [-0.33, 0.74], bands: ['side', 'window'], side: 'R' },
        { part: 'fenderL', x: [0.74, 2.31], bands: ['tuck', 'side', 'window'], side: 'L' }, { part: 'fenderR', x: [0.74, 2.31], bands: ['tuck', 'side', 'window'], side: 'R' },
        { part: 'hood', x: [0.74, 2.31], bands: ['edge', 'crown'] }],
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, D = [0.12, 0.12, 0.13], FR = [0.24, 0.24, 0.26], AL = [0.62, 0.63, 0.66], SP = [0.86, 0.72, 0.1], BT = [0.3, 0.31, 0.33];
        // a flat quad on a flat side (z = sd * w): pts [[x, y] ...] counter-clockwise as seen from the right (x along the bottom first)
        const onSide = (sd, w, pts, col, o) => { const q = pts.map(([x, y]) => [x, y, sd * w]); K.face(sd > 0 ? q : q.reverse(), col, o); };
        // ---- the shell: the bed open on top (segment 0), the back wall (1), the roof (2: black on top, a two-tone trophy-truck roof under the
        //      start number), the windscreen (3), the cowl's step (4), the hood and the fenders (5), the nose (6). Glass: the windscreen, the
        //      door's window (forward of the B-pillar at -0.33) ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (e === 0 || e === 8) return B;                                                 // (the black lower edge, the arches' lips)
          if (k === 0 && e >= 3 && e <= 5) return null;                                     // (the bed: no top)
          if (k === 3 && e >= 2 && e <= 6) return G;                                        // (the windscreen, the window's front)
          if (k === 2 && (e === 2 || e === 6)) return at.x > -0.33 ? G : P;                 // (the door's window; the cab's corner behind it)
          if (k === 2 && e >= 3 && e <= 5) return B;                                        // (the roof's top)
          return P;
        }, { caps: { front: { col: P, colLow: D, cut: 0.7, low: 'bumperF', high: 'body' }, rear: { col: P, colLow: D, cut: 0.68, low: 'bumperR', high: 'tailgate' } } });
        const DL = L.decal;
        // the windows' frames: the A-pillar (paint) over the window's front, the B-pillar, a black line under the roof's edge
        DL.band([[0.34, 0.84], [0.68, 0], [0.74, 0], [0.74, 1], [0.34, 1]], P, null, 0.01);
        DL.band([[-0.38, 0], [-0.33, 0], [-0.33, 1], [-0.38, 1]], B, null, 0.01);
        DL.band([[-0.33, 0.93], [0.34, 0.93], [0.34, 1], [-0.33, 1]], B, null, 0.008);
        K.deli('soncni_pas', () => { for (const [z0, z1] of [[-0.8, -0.304], [-0.304, 0.304], [0.304, 0.8]]) DL.top([[0.34, z0], [0.42, z0], [0.42, z1], [0.34, z1]], S, 0.006); });   // the sun strip (the crown's flat middle, its sloping edges; the garage's in its place: mounts.soncni_pas)
        // the hood's scoop in its middle: a wedge rising to its mouth (black) at the front
        K.part('hood', () => K.deli('hauba', () => K.skin([[1.3, 0.008, 0.2], [1.62, 0.085, 0.22]].map(([x, h, w]) => { const y = L.topY(x, 0) - 0.008; return [[x, y, -w], [x, y + h, -w * 0.92], [x, y + h, w * 0.92], [x, y, w]]; }), P, null, B, { host: 'hood' })));   // (the garage's bonnet top in its place: mounts.hauba)
        K.rect(-0.666, 1.44, 0, 1.1, 0.26, G, { dir: '-x', part: 'body' });                  // the rear window in the cab's back wall
        // the scoop on the roof's front (the cabin's air: its inlet black), a wedge rising to the front
        K.deli('stresna_zajemalka', () => K.skin([[0.06, 0.01, 0.15], [0.32, 0.075, 0.16]].map(([x, h, w]) => [[x, 1.686, -w], [x, 1.686 + h, -w * 0.94], [x, 1.686 + h, w * 0.94], [x, 1.686, w]]), P, null, B, { part: 'body' }));   // (the garage's in its place: mounts.stresna_zajemalka)
        // (none stock: the garage's sunroof, aerial and louvres on the cab: mounts.streha, antena, zaluzije)
        K.part('body', () => { for (const id of ['streha', 'antena', 'zaluzije']) K.deli(id, () => {}); });
        // ---- the livery: a band in the stripe colour sweeping up from the front fender across the door (under its number) to the cab's back,
        //      on along the top of the bedside (over the rear arch); a dark line under it on the cab (flat quads on the flat sides, each with
        //      the panel it lies on) ----
        const yb0 = (x) => 1.0 + (-0.64 - x) * 0.1585;                                      // (the band's foot, rising to the rear: 1.0 at the cab's back)
        for (const sd of [-1, 1]) {
          const f = sd < 0 ? 'fenderL' : 'fenderR', door = sd < 0 ? 'doorL' : 'doorR', lift = 0.007;
          for (const [x0, x1, w, o] of [[0.8, 1.0, 1.08, { host: f }], [-0.33, 0.74, 0.93, { host: door }], [-0.64, -0.33, 0.93, { part: 'body' }]]) {
            onSide(sd, w + lift, [[x0, yb0(x0)], [x1, yb0(x1)], [x1, yb0(x1) + 0.1], [x0, yb0(x0) + 0.1]], S, o);
            onSide(sd, w + lift + 0.002, [[x0, yb0(x0) - 0.03], [x1, yb0(x1) - 0.03], [x1, yb0(x1) - 0.012], [x0, yb0(x0) - 0.012]], D, o);
          }
          onSide(sd, 1.08 + lift, [[-2.38, 1.0], [-0.67, 1.0], [-0.67, 1.1], [-2.38, 1.1]], S, { part: 'body' });
          onSide(sd, 1.08 + lift, [[0.83, 0.93], [0.98, 0.93], [0.98, 1.05], [0.83, 1.05]], B, { host: f });   // the fender's vent behind the wheel, its slats
          for (const y of [0.965, 1.005]) onSide(sd, 1.08 + lift + 0.003, [[0.835, y], [0.975, y], [0.975, y + 0.014], [0.835, y + 0.014]], K.shade(P, 0.6), { host: f });
        }
        // ---- the doors: the number panels, the handles, the hinges at their front edges ----
        for (const sd of [-1, 1]) {
          const door = sd < 0 ? 'doorL' : 'doorR', f = sd < 0 ? '-z' : 'z';
          K.number(0.21, 0.88, sd * 0.94, 0.34, { dir: f, w: 0.5, host: door });
          K.hinge(door, [0.74, 0.66, sd * 0.93], [0.74, 1.15, sd * 0.93]);
        }
        K.deli('vrata', () => { for (const sd of [-1, 1]) K.rect(-0.22, 1.1, sd * 0.938, 0.14, 0.03, B, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' }); });   // (the handles; the garage's doors: mounts.vrata)
        // ---- the mirrors (small, black) on the doors' front corners ----
        K.deli('ogledala', () => { for (const sd of [-1, 1]) K.mirror(0.62, 1.29, sd * 1.02, { w: 0.06, h: 0.11, d: 0.15, col: B, z0: sd * 0.93, crack: 1 }); });   // (the garage's: mounts.ogledala)
        // ---- the nose: a black band across the fascia, the grille in it between the rectangular lamps ----
        K.part('body', () => {
          K.rect(2.302, 0.9, 0, 1.96, 0.26, B);
          K.deli('zmigavci', () => { for (const sd of [-1, 1]) K.rect(2.302, 0.74, sd * 0.84, 0.18, 0.05, K.rgb(0xff9a1e)); });   // (the indicators under the lamps; the garage's: mounts.zmigavci)
          K.deli('maska', () => K.grille(2.306, 0.9, 0, 1.1, 0.22, { slats: 3, slatCol: [0.3, 0.3, 0.32], frame: FR, frameH: 0.02 }));   // (the garage's grille in its place: mounts.maska)
          K.deli('relijske_luci', () => {});   // (none stock: the garage's on the tube bumper, its hoop, the valance, the roof: mounts.relijske_luci)
        });
        // (each lamp a part of its own: headL, headR; the garage's in their place: K.deli, mounts.zarometi)
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(2.31, 0.91, sd * 0.78, 0.07, { shape: 'rect', w: 0.3, h: 0.13, ring: null, host: sd < 0 ? 'headL' : 'headR' }); });
        // ---- the tube bumper in front of the fascia (a low bar round the corners, a hoop over it in front of the grille), its skid plate, the
        //      tow hook ----
        K.part('bumperF', () => {
          const T = (a, b, r) => K.bar(a, b, r || 0.04, BT, { n: 6 });
          T([2.43, 0.6, -0.62], [2.43, 0.6, 0.62]);
          for (const sd of [-1, 1]) { T([2.43, 0.6, sd * 0.62], [2.28, 0.62, sd * 0.99]); T([2.43, 0.6, sd * 0.46], [2.4, 0.9, sd * 0.4]); }
          T([2.4, 0.9, -0.4], [2.4, 0.9, 0.4], 0.035);
          K.plate([[2.42, 0.52, -0.5], [2.42, 0.52, 0.5], [2.05, 0.4, 0.56], [2.05, 0.4, -0.56]], 0.03, D);   // the skid plate
        }, { hinge: [[2.3, 0.52, -0.6], [2.3, 0.52, 0.6]] });
        // the red tow hooks on the tube bumpers (the garage's tow points in their place: mounts.vlecne_kljuke)
        K.deli('vlecne_kljuke', () => { K.rect(2.472, 0.6, 0.22, 0.1, 0.07, K.rgb(0xd8261c), { part: 'bumperF' }); K.rect(-2.477, 0.64, 0.62, 0.1, 0.06, K.rgb(0xd8261c), { dir: '-x', part: 'bumperR' }); });
        // ---- the tail: the lamps on the bed's corners (each with its black surround a part of its own), a band across the tailgate ----
        for (const sd of [-1, 1]) K.rect(-2.404, 0.98, sd * 0.97, 0.16, 0.3, B, { dir: '-x', host: sd < 0 ? 'tailL' : 'tailR' });
        K.deli('zadnje_luci', () => { for (const sd of [-1, 1]) K.tailLamp(-2.406, 0.98, sd * 0.97, 0.12, 0.26, { host: sd < 0 ? 'tailL' : 'tailR' }); });   // (the garage's in the surrounds: mounts.zadnje_luci)
        K.rect(-2.404, 1.05, 0, 1.6, 0.1, S, { dir: '-x', host: 'tailgate' });
        K.hinge('tailgate', [-2.4, 0.68, -0.9], [-2.4, 0.68, 0.9]);
        // ---- the rear tube bumper under the tailgate ----
        K.part('bumperR', () => {
          K.bar([-2.44, 0.64, -0.86], [-2.44, 0.64, 0.86], 0.035, D, { n: 6 });
          for (const sd of [-1, 1]) K.bar([-2.44, 0.64, sd * 0.5], [-2.28, 0.56, sd * 0.5], 0.03, D, { n: 4 });
        }, { hinge: [[-2.36, 0.58, -0.5], [-2.36, 0.58, 0.5]] });
        K.deli('auspuh', () => K.exhaust(-2.36, 0.5, -0.55, 0.045, 0.16, { part: 'body', n: 6, col: [0.34, 0.33, 0.32] }));   // (the garage's: mounts.auspuh)
        // ---- the wing standing in the bed: the main plane (the stripe colour) between two endplates, a flap at its trailing edge, on a pylon
        //      on each bed rail ----
        K.part('wing', () => K.deli('krilo', () => {   // (the garage's wing in its place, on the cab roof: K.deli, mounts.krilo)
          K.wingPlank(-1.74, 1.57, -2.31, 1.68, 0.05, -0.93, 0.93, S);
          K.wingPlank(-2.22, 1.69, -2.41, 1.76, 0.02, -0.93, 0.93, B);
          for (const sd of [-1, 1]) {
            K.endplate([[-2.44, 1.42], [-2.44, 1.8], [-1.84, 1.74], [-1.66, 1.56], [-1.72, 1.42]], sd * 0.945, 0.025, B);
            K.endplate([[-2.16, 1.16], [-2.22, 1.43], [-2.0, 1.43], [-1.92, 1.16]], sd * 0.96, 0.03, D);
          }
        }), { noCrush: true, noDent: true, hinge: [[-2.06, 1.16, -0.96], [-2.06, 1.16, 0.96]] });
        // ---- the bed: the rear coil-overs standing through its floor, their hoop, the fuel cell ----
        K.part('body', () => {
          for (const sd of [-1, 1]) {
            K.cyl([-1.36, 0.46, sd * 0.56], [-1.08, 1.3, sd * 0.56], 0.04, AL, { n: 6, capA: null });
            K.bar([-1.31, 0.62, sd * 0.56], [-1.17, 1.02, sd * 0.56], 0.075, SP, { n: 6 });      // (the spring)
            K.bar([-1.04, 0.6, sd * 0.66], [-1.04, 1.33, sd * 0.6], 0.03, D, { n: 5 });         // (the hoop's legs)
          }
          K.bar([-1.04, 1.33, -0.6], [-1.04, 1.33, 0.6], 0.03, D, { n: 5 });
          K.box(-0.82, 0.6, 0, 0.26, 0.34, 0.86, 0, [0.08, 0.08, 0.09]);                         // the fuel cell
        }, { noCrush: true });
        // ---- under the body: the front lower arms, the rear axle with its trailing arms and differential ----
        K.part('body', () => {
          for (const sd of [-1, 1]) {
            K.plate([[K.fx, 0.34, sd * 0.78], [K.fx - 0.28, 0.42, sd * 0.28], [K.fx + 0.26, 0.42, sd * 0.28]], 0.03, FR);   // (the lower A-arm)
            K.bar([K.rx, 0.34, sd * 0.62], [-0.3, 0.42, sd * 0.5], 0.035, FR, { n: 4 });
          }
          K.cyl([K.rx, 0.42, -0.78], [K.rx, 0.42, 0.78], 0.055, D, { n: 6, capA: null, capB: null });
          K.box(K.rx, 0.28, 0, 0.3, 0.26, 0.34, 0, D);
        });
        // ---- the hood's hinge at the cowl ----
        K.hinge('hood', [0.8, 1.16, -0.6], [0.8, 1.16, 0.6]);
        // (none stock: the garage's kit, flaps, stripes, decals, fuel cap, calipers; the hidden parts: mounts)
        for (const id of ['aero', 'lovilci_blata', 'crte', 'nalepke', 'zamasek', 'celjusti']) K.deli(id, () => {});
        for (const id of ['akumulator', 'filter_zraka', 'turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum']) K.deli(id, () => {});
        // ---- Visoki (Nastavitve · Detajli avtov; the player's and the showroom's car on a computer): the small details. A generic badge on
        //      the tailgate; the doors' front shut lines; the driver at the wheel ----
        const C = K.cab, RED = [0.75, 0.1, 0.08], SZ = -0.4;   // (no garage part sits in these details' places: no K.fitted check)
        if (K.hi) {
          C.badge(-2.405, 0.86, 0, -1, 'tailgate', 0.03);   // (under the tailgate's band)
          for (const sd of [-1, 1]) DL.side([[0.726, 0.66], [0.738, 0.66], [0.738, 1.15], [0.726, 1.15]], D, [sd], 0.011, { host: sd < 0 ? 'doorL' : 'doorR' });   // (over the livery's band)
          K.driver(-0.15, 1.34, SZ, { inner: true, r: 0.12, lean: 0.12, hands: [0.32, 1.17, 0.14], feet: [0.54, 0.69, 0.11], suit: [0.14, 0.16, 0.2], helmet: [0.93, 0.93, 0.9] });
        }
        // ---- inside (as KOLIBRI's: K.cab; seen once a door opens, a pane breaks or a part is off): the floor, the tunnel, the firewall, the
        //      cab's back wall; the race dash, the wheel on its column; the two containment seats with their harnesses, the sequential
        //      lever, the pedals; the extinguisher; the door cards with their pulls; the cage; the V8 under the hood; the radiator on its
        //      support, the crash bar ----
        const IN = C.IN, FL = [0.3, 0.31, 0.33], FL2 = [0.22, 0.23, 0.25], CB = [0.07, 0.07, 0.075];
        K.face([[-0.62, 0.62, 0.9], [0.72, 0.62, 0.9], [0.72, 0.62, -0.9], [-0.62, 0.62, -0.9]], FL, IN);
        K.box(0.05, 0.62, 0, 1.3, 0.16, 0.26, 0, FL2, FL, true, IN);   // (the tunnel, its top 0.78)
        C.face([[0.72, 0.62, -0.6], [0.72, 0.62, 0.6], [0.7, 0.95, 0.6], [0.7, 0.95, -0.6]], FL2, [-1, 0, 0]);   // (the firewall)
        C.face([[-0.62, 0.62, -0.9], [-0.62, 0.62, 0.9], [-0.62, 1.3, 0.88], [-0.62, 1.3, -0.88]], FL2, [1, 0, 0]);   // (the cab's back wall, under its window)
        C.dash({ x: 0.42, y: 1.16, d: 0.3, w: 0.85, dz: SZ, sz: 0.12, style: 'race', col: CB, col2: [0.1, 0.1, 0.11] });
        C.steer({ c: [0.3, 1.15, SZ], ax: [0.5547, -0.832], r: 0.153, rr: 0.017, to: [0.42, 0.97, SZ] });
        for (const s of [-1, 1]) C.seat(-0.1, 0.61, s * 0.4, { w: 0.42, top: 0.78, lean: 0.15, shell: true, belt: 'harness', col: [0.06, 0.06, 0.065], col2: [0.13, 0.13, 0.14], strap: RED });
        C.console(0.12, 0.78, { seq: true, brake: false, l: 0.3, knob: RED });
        C.pedals(0.6, 0.64, SZ, 3);
        K.cyl([0.17, 0.69, 0.42], [0.45, 0.69, 0.42], 0.06, RED, { n: 6, inner: true, part: 'body', capA: [0.12, 0.12, 0.13] });   // (the extinguisher, before the right seat)
        for (const s of [-1, 1]) C.door(s, { x: [-0.3, 0.7], y: [0.7, 1.12], z: 0.9, strap: RED, col: [0.16, 0.16, 0.17] });
        const cg = [];
        for (const sd of [-1, 1]) cg.push([[-0.58, 0.62, sd * 0.78], [-0.58, 1.57, sd * 0.7]], [[-0.58, 1.57, sd * 0.7], [0.3, 1.58, sd * 0.7]], [[0.3, 1.58, sd * 0.7], [0.68, 0.9, sd * 0.8]], [[-0.58, 0.7, sd * 0.78], [0.5, 0.7, sd * 0.84]]);
        cg.push([[-0.58, 1.57, -0.7], [-0.58, 1.57, 0.7]], [[0.3, 1.58, -0.7], [0.3, 1.58, 0.7]], [[-0.58, 0.7, -0.78], [-0.58, 1.57, 0.7]]);
        K.cage(cg, 0.025, [0.8, 0.81, 0.84]);
        K.engine(1.5, 0.62, 0, { l: 0.72, w: 0.6, h: 0.44 });
        C.nose({ x: 2.12, w: 0.8, y: [0.66, 1.0], rad: [1.24, 0.34], bar: 2.24, barY: 0.68, barW: 1.5 });   // (the radiator on its support, the crash bar)
      },
    },
  });
})();
