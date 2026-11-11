/* Vehicle 'vidra' — VIDRA E: a big electric fastback with a motor on each axle, set up for sliding (invented; no real model). Signature
   features: 1) the glass roof from the windscreen to the rear glass, 2) the closed nose with a light bar across it, slim lamps on its
   corners, 3) the dark sills (the battery's) with a thin turquoise line over them, 4) the short ducktail, the light bar across the tail,
   the diffuser's turquoise fins, 5) the camera pods for mirrors. L 4.86 W 1.98 H 1.41, wheelbase 2.92, overhangs F 1.01 R 0.93 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'vidra', name: 'VIDRA E', cat: 'elektricni', ord: 4, drive: 'AWD',
    desc: 'Električni fastback z dvema motorjema za drift: steklena streha, svetlobna pasova.',
    // the AWD layer turned round for sliding (docs/novi-avti-2.md): the rear motor swings it round (pwr), a big slide for the turn (tv),
    // held long (out), a lift and the brakes help (liftP, bx); heavy, so a little lazier to turn in (kI). The driving school's drift
    // (tools/novi-avti-2/drift.js): Jezero 2207, Spa 449, Bathurst 839 (ŠKORPIJON H 1998 / 202 / 836)
    phys: { mass: 2050, a: 1.42, b: 1.5, kI: 1.25, kw: 480, redline: 16000, idle: 0, gears: [1], final: 8.0, rw: 0.35, cDrag: 0.36, len: 4.86, wid: 1.98, steerMax: 0.72,
      ev: true, tracK: 1.0, spinK: 0.3 },
    arc: { amax: 1.84, kv: 2.1, rmin: 4.4 },
    csp: { bx: 0.15, coast: -0.05, thr: 0.02, liftP: 0.1, pwr: 0.14, out: 1.35, turn: 1.0, w: 1.0, tv: 1.35 },
    stats: { power: 10, grip: 9, weight: 1, drift: 9 },
    price: 90000, pk: 'open', field: ['vidra'],
    snd: { kind: 'ev', hz: 0.9, loud: 0.9 },
    expect: { t100: [2.67, 3.07], vmax: [237, 253], latG: [2.3, 2.4], d100: [23.1, 24.9] },   // (measured 2.87 / 245 / 2.35 / 24.0)
    partNames: { headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamp', tailR: 'right tail lamp' },
    // the car's set and its own: each head lamp and each tail lamp a part of its own
    parts: { set: 'car', ht: 1.41, y0: 0.2,
      extra: {
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: 1.0, lz: -0.7, y: 0.64 },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: 1.0, lz: 0.7, y: 0.64 },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: -1.0, lz: -0.76, y: 0.86 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: -1.0, lz: 0.76, y: 0.86 },
      },
      over: { hood: { lx: 0.74, y: 0.83 }, trunk: { lx: -0.95, y: 0.97 } } },   // (the long bonnet to the closed nose; the boot lid: the short deck behind the rear glass)
    // where the garage's parts go (js/deli.js, look units): the wing on the boot lid's end, in the boot lid's part (in place of the
    // ducktail; the centre fin stops at the deck's front); the head lamps where the slim lamps are, in the lamps' parts; the rims on its
    // wheels. None for the exhaust, the air filter and the turbo (the electric's), none for the sunroof, the roof scoop and the aerials
    // (the roof is glass from the windscreen to the boot deck, the shoulders beside it steep; the deck short, the ducktail on it), none
    // for the boot lid's panel (the wings' feet stand on the whole short deck)
    mounts: {
      krilo: { x: -2.36, w: 0.82, part: 'trunk', front: -2.07 },
      zarometi: { x: 2.43, y0: 0.64, lean: 0, zc: 0.7, yc: 0.64, s: 0.24, hosts: ['headL', 'headR'], depth: 0.04 },
      platisca: {},
      // (sklop 2 · spredaj, js/deli/spredaj.js) the bumpers' faces and feet (the splitter and the diffuser the stock lips, the turquoise
      // fins go with them), the sills between the arches; the long bonnet's top from the cowl to the nose's crest (its curve: the
      // louvres' cells follow it); the light bar's room between the lamps (in the bonnet's part); the indicators under the lamps on the
      // closed nose, the repeaters on the fenders behind the arches, the rear's on the bumper, on the camera pods; the extra lamps in
      // front of the intake, before the closed nose on a tube (its feet on the intake's top), in the intake, on a bar over the glass
      // roof's crest (its feet short, on the glass), a pod over the closed nose
      aero: { xf: 2.43, xr: -2.43, w: 0.773, yf: 0.24, yr: 0.3, sill: [-1.03, 0.95], ws: 0.922, ys: 0.25, lipF: [2.36, 0.215, 0.26, 0.025, 1.8], lipR: [-2.38, 0.16, 0.12, 0.14, 1.5], archIn: 0 },
      hauba: { x0: 1.17, x1: 2.3, w: 0.55, bulge: 0.6, rel: true, cells: 3 },
      maska: { x: 2.43, y0: 0.59, lean: 0, yc: 0.59, w: 1.04, h: 0.08, part: 'hood' },
      zmigavci: { front: { x: 2.431, y: 0.575, z: 0.7, w: 0.12, h: 0.03, part: 'body' }, side: { x: 1.12, y: 0.7, z: 0.971, hosts: ['fenderL', 'fenderR'] },
        rear: { x: -2.431, y: 0.45, z: 0.7, part: 'bumperR' }, mirror: { x: 0.7705, y: 0.98, z: 0.97, w: 0.08, parts: ['mirrorL', 'mirrorR'] } },
      relijske_luci: { bumper: [2.43, 0.36, 0.3], nose: [2.405, 0.55], foot: 0.4, intake: [2.43, 0.36, 1.2, 0.16], roof: [0, 0.5, 1.416], roofFeet: 0.24, pod: [2.43, 0.46, 0.62, 0.5], part: 'bumperF' },
      // (js/deli/zadaj.js) the tail lamps' rooms in their black surrounds on the corners (the garage's lamps lying along them), the light
      // bar between them on the boot lid's end; no exhaust (the electric's) and no boot lid panel (the wings' feet on the deck); the tow
      // points beside the intake, on the rear bumper beside the diffuser; the flaps behind the arches
      zadnje_luci: { x: -2.415, zc: 0.75, yc: 0.86, w: 0.14, h: 0.3, s: 0.6, shape: [[-0.1, -0.03], [-0.1, 0.03], [0.1, 0.03], [0.1, -0.03]], hosts: ['tailL', 'tailR'],
        bar: { x: -2.433, y: 0.86, w: 0.63, h: 0.035, part: 'trunk' } },
      vlecne_kljuke: { f: [2.43, 0.34, 0.68], r: [-2.43, 0.4, 0.3] },
      lovilci_blata: { x: [0.97, -1.95], z: [0.68, 0.92], y: [0.35, 0.09], sill: [-0.9, 0.82, 0.25, 0.912], part: 'body' },
      // (js/deli/streha.js) the louvres over the rear glass (none stock), from its foot over its lower part, in the body's part (the glass
      // fixed, the boot lid only the deck behind it)
      zaluzije: { x0: -2.0, y0: 1.051, x1: -1.2, y1: 1.26, w: 0.5, part: 'body' },
      // (js/deli/bok.js) the camera pods, the long doors (the sill's dark band and the turquoise line under the panel left bare; the flush
      // handles; the glass from the B-pillar to the windscreen's top, a corner of fixed glass before it), the brakes, the nuts
      ogledala: { x: 0.72, y: 0.98, z: 0.97, w: 0.1, h: 0.06, d: 0.15, z0: 0.845, fwd: 0, up: 0 },
      vrata: { x: [-0.5, 1.0], y: [0.48, 0.91], handle: [-0.3, 0.86, 0.975, 0.14, 0.022], win: [[-0.48, 0.07], [0.5, 0.07], [0.05, 0.92], [-0.48, 0.92]],
        frame: [-0.5, -0.48, 0.92, 0.98], rub: 0.505, rubSide: true, crease: [0.49, 0.83] },
      zavore: { s: 1 },
      matice: { k: 5, r: 0.2 },
      // (sklop 3 · barve, js/deli/barve.js) the stripes over the bonnet and the boot deck (none over the glass roof), the side ones
      // between the arches; the decals on the doors beside the number, the fenders ahead of the arches and the quarters, on the bonnet;
      // the sun strip on the windscreen's top; the calipers; the charge flap on the right rear quarter (none stock)
      barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {},
      crte: { z: [0.24, 0.38], x: [[1.06, 2.43], [-2.25, -2.06]], sx: [-1.18, 1.1] },
      nalepke: { side: [[0.45, 0.97], [-0.45, 0.05], [1.92, 2.18], [-1.05, -0.65]], y: [0.48, 0.86], hood: { x: [1.15, 2.13], z: [0.26, 0.46] } },
      soncni_pas: { x: [0.05, 0.19] }, zamasek: { x: -1.08, y: 0.83, z: 0.965, r: 0.045 },
      celjusti: { r: [0.085, 0.16], a: [70, 125] },
      // (sklop 3 · skriti deli, js/deli/skriti.js: no air filter and no turbo, the electric's) the 12 V battery on the bay's floor ahead of
      // the front motor, the control unit on its top; the springs and the dampers at the tubs' inner walls, the bars at the wheels
      akumulator: { x: 1.95, y: 0.307, z: 0.45, back: true }, cip: { x: 1.55, y: 0.74, z: 0.15 },
      vzmeti: { in: 0.15, top: 0.79 }, amortizerji: { in: 0.15, top: 0.74 }, stabilizatorji: { in: 0.13, floor: 0.266 }, dim_gum: {},
    },
    // the look (KIT API v1, render.js; look units = metres: the centre of mass at x 0, the axles at 1.42 / -1.50): one loft, the standard
    // regions split it into the parts (the long doors to the B-pillar). Seen from the chase camera: the glass roof, the light bar across
    // the tail, the turquoise fins
    look: {
      body: { len: 4.86, wid: 1.98, roofY: 1.41,
        //       x      w     yb    ybelt  wt    yt    cr    kind  tuck
        secs: [[-2.43, 0.86, 0.3, 0.82, 0.74, 0.92, 0.02, 'b', 0.11],    // the tail's face: the light bar along its top, the diffuser under it
          [-2.33, 0.92, 0.29, 0.86, 0.8, 0.98, 0.03, 'b', 0.1],          // the boot lid's end (under the ducktail)
          [-2.05, 0.95, 0.28, 0.88, 0.74, 1.02, 0.03, 'gr', 0.1],        // the rear glass's foot
          [-0.75, 0.97, 0.28, 0.92, 0.62, 1.34, 0.05, 'r', 0.1],         // the glass roof from here
          [0.05, 0.97, 0.28, 0.92, 0.62, 1.36, 0.05, 'gf', 0.1],         // the windscreen's top
          [1.05, 0.97, 0.29, 0.86, 0.8, 0.93, 0.05, 'b', 0.1],           // its base (the cowl)
          [1.9, 0.97, 0.28, 0.8, 0.82, 0.84, 0.05, 'b', 0.09],           // the bonnet over the front wheels
          [2.28, 0.92, 0.25, 0.7, 0.76, 0.74, 0.03, 'b', 0.08],          // the nose's top
          [2.43, 0.84, 0.24, 0.6, 0.66, 0.62, 0.02, 'b', 0.07]],         // the closed nose: the light bar, the low intake
        eye: { x: -0.25, y: 1.1 },
        door: [1.0, -0.5],
      },
      wheels: { style: 'std', spokes: 5, w: 0.27, rim: [0.2, 0.21, 0.23], cap: [0.1, 0.1, 0.11], gap: 0.04 },
      build(K) {
        const P = K.paint, B = K.black, G = K.GLASS, DK = [0.08, 0.08, 0.09], D = [0.12, 0.12, 0.13], TEAL = [0.06, 0.72, 0.74], LED = [0.95, 0.96, 1.0], RED = [0.62, 0.04, 0.06];
        // the shell: the paint; the glass (the windscreen, the side windows, the roof, the rear glass); the sills dark between the arches,
        // the paint's shade under the bumpers' corners
        const XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;
        const L = K.loft(K.secs(K.body.secs), (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch || (at.x > XA && at.x < XB) ? DK : K.shade(P, 0.55);
          if (kind === 'gf' && e >= 2 && e <= 6) return G;
          if (kind === 'r' && e >= 2 && e <= 6) return G;
          if (kind === 'gr' && e >= 3 && e <= 5) return G;
          return P;
        }, { caps: { front: { col: P }, rear: { col: P } } });
        const DC = L.decal;
        // the B-pillar black; the dark sills (the battery's) and the thin turquoise line over them; the start number, the flush handles
        DC.band([[-0.62, 0], [-0.5, 0], [-0.5, 1], [-0.62, 1]], B, null, 0.01);
        DC.side([[-1.95, 0.32], [1.75, 0.32], [1.75, 0.44], [-1.95, 0.44]], DK, null, 0.006);
        DC.side([[-1.95, 0.45], [1.75, 0.45], [1.75, 0.47], [-1.95, 0.47]], TEAL, null, 0.007);
        for (const sd of [-1, 1]) K.number(0.25, 0.66, sd * 0.975, 0.28, { dir: sd < 0 ? '-z' : 'z' });
        K.deli('vrata', () => { for (const sd of [-1, 1]) K.rect(-0.3, 0.86, sd * 0.975, 0.14, 0.022, D, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' }); });   // (the garage's doors: mounts.vrata)
        // the closed nose: the light bar across it (the garage's grille in its place: K.deli, mounts.maska), the slim lamps on its corners
        // (each a part of its own; the garage's lamps in their place: K.deli, mounts.zarometi); the front bumper: the low intake
        K.deli('maska', () => K.rect(2.432, 0.64, 0, 1.0, 0.03, LED));
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(2.43, 0.64, sd * 0.7, 0.04, { shape: 'rect', w: 0.24, h: 0.045, ring: null, host: sd < 0 ? 'headL' : 'headR' }); });
        K.part('bumperF', () => K.grille(2.432, 0.36, 0, 1.2, 0.16, { slats: 2 }), { hinge: [[2.3, 0.3, -0.8], [2.3, 0.3, 0.8]] });
        // the tail: the short ducktail on the boot lid's end (the garage's wing in its place: K.deli, mounts.krilo), the light bar across
        // the boot lid, the lamps on the corners (each a part of its own; the garage's lamps in the lamps' and the bar's place, the black
        // surrounds stay: K.deli, mounts.zadnje_luci)
        K.part('trunk', () => K.deli('krilo', () => K.wingPlank(-2.26, 0.99, -2.45, 1.04, 0.02, -0.82, 0.82, P)));
        K.deli('zadnje_luci', () => { K.rect(-2.433, 0.86, 0, 1.3, 0.035, RED, { dir: '-x', part: 'trunk' });
          for (const sd of [-1, 1]) K.tailLamp(-2.435, 0.86, sd * 0.76, 0.2, 0.05, { host: sd < 0 ? 'tailL' : 'tailR' }); });
        for (const sd of [-1, 1]) K.rect(-2.433, 0.86, sd * 0.76, 0.24, 0.07, B, { dir: '-x', part: sd < 0 ? 'tailL' : 'tailR' });
        K.hinge('bumperR', [-2.3, 0.3, -0.8], [-2.3, 0.3, 0.8]);
        // the splitter under the intake, the rear bumper's diffuser with its turquoise fins (the garage's kit in their place; the splitter
        // and the diffuser kept by an option without a piece of its own there: K.deli, mounts.aero lipF, lipR)
        K.deli('aero', () => { K.part('bumperF', () => K.box(2.36, 0.17, 0, 0.26, 0.025, 1.8, 0, DK));
          K.part('bumperR', () => { K.box(-2.38, 0.16, 0, 0.12, 0.14, 1.5, 0, DK); for (const z of [-0.45, -0.15, 0.15, 0.45]) K.box(-2.42, 0.16, z, 0.16, 0.13, 0.02, 0, TEAL); }); });
        // the camera pods for mirrors (the garage's mirrors in their place: K.deli, mounts.ogledala)
        K.deli('ogledala', () => { for (const sd of [-1, 1]) K.mirror(0.72, 0.98, sd * 0.97, { col: B, w: 0.1, h: 0.06 }); });
        K.hinge('hood', [1.05, 0.96, -0.6], [1.05, 0.96, 0.6]);
        K.hinge('trunk', [-2.05, 1.02, -0.6], [-2.05, 1.02, 0.6]);
        K.hinge('doorL', [1.0, 0.42, -0.95], [1.0, 0.88, -0.95]); K.hinge('doorR', [1.0, 0.42, 0.95], [1.0, 0.88, 0.95]);
        // inside (seen once a part is off): the front seats, the rear bench, the dashboard's screen, the front motor in the bay
        for (const sd of [-1, 1]) K.seat(-0.2, 0.44, sd * 0.4, { w: 0.5, back: 0.7 });
        K.seat(-1.15, 0.44, 0, { w: 1.3, back: 0.6 });
        K.box(0.8, 0.62, 0, 0.3, 0.2, 1.6, 0, D, null, false, { inner: true, part: 'body' });
        K.engine(1.6, 0.34, 0, { l: 0.5, w: 0.7, h: 0.4 });
        // the garage's parts with no stock one in their place (K.deli, mounts): the bonnet's, the boot lid's panel, the rear glass's
        // louvres, the indicators, the extra lamps, the tow points, the flaps, the colours' and the hidden ones in the bay and at the wheels
        K.part('hood', () => K.deli('hauba', () => {}));
        K.part('body', () => K.deli('zaluzije', () => {}));
        for (const id of ['zmigavci', 'relijske_luci', 'vlecne_kljuke', 'lovilci_blata', 'crte', 'nalepke', 'soncni_pas', 'celjusti', 'zamasek']) K.deli(id, () => {});
        for (const id of ['akumulator', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum']) K.deli(id, () => {});
      },
    },
  });
})();
