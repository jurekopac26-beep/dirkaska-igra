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
    // ducktail); the head lamps where the slim lamps are, in the lamps' parts; the rims on its wheels
    mounts: {
      krilo: { x: -2.36, w: 0.82, part: 'trunk' },
      zarometi: { x: 2.43, y0: 0.64, lean: 0, zc: 0.7, yc: 0.64, s: 0.24, hosts: ['headL', 'headR'], depth: 0.04 },
      platisca: {},
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
        for (const sd of [-1, 1]) {
          K.number(0.25, 0.66, sd * 0.975, 0.28, { dir: sd < 0 ? '-z' : 'z' });
          K.rect(-0.3, 0.86, sd * 0.975, 0.14, 0.022, D, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' });
        }
        // the closed nose: the light bar across it, the slim lamps on its corners (each a part of its own; the garage's lamps in their
        // place: K.deli, mounts.zarometi); the front bumper: the low intake, the splitter
        K.rect(2.432, 0.64, 0, 1.0, 0.03, LED);
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(2.43, 0.64, sd * 0.7, 0.04, { shape: 'rect', w: 0.24, h: 0.045, ring: null, host: sd < 0 ? 'headL' : 'headR' }); });
        K.part('bumperF', () => {
          K.grille(2.432, 0.36, 0, 1.2, 0.16, { slats: 2 });
          K.box(2.36, 0.17, 0, 0.26, 0.025, 1.8, 0, DK);
        }, { hinge: [[2.3, 0.3, -0.8], [2.3, 0.3, 0.8]] });
        // the tail: the short ducktail on the boot lid's end (the garage's wing in its place: K.deli, mounts.krilo), the light bar across
        // the boot lid, the lamps on the corners (each a part of its own)
        K.part('trunk', () => K.deli('krilo', () => K.wingPlank(-2.26, 0.99, -2.45, 1.04, 0.02, -0.82, 0.82, P)));
        K.rect(-2.433, 0.86, 0, 1.3, 0.035, RED, { dir: '-x', part: 'trunk' });
        for (const sd of [-1, 1]) { const tp = sd < 0 ? 'tailL' : 'tailR';
          K.rect(-2.433, 0.86, sd * 0.76, 0.24, 0.07, B, { dir: '-x', part: tp }); K.tailLamp(-2.435, 0.86, sd * 0.76, 0.2, 0.05, { host: tp }); }
        // the rear bumper: the diffuser with its turquoise fins
        K.part('bumperR', () => {
          K.box(-2.38, 0.16, 0, 0.12, 0.14, 1.5, 0, DK);
          for (const z of [-0.45, -0.15, 0.15, 0.45]) K.box(-2.42, 0.16, z, 0.16, 0.13, 0.02, 0, TEAL);
        }, { hinge: [[-2.3, 0.3, -0.8], [-2.3, 0.3, 0.8]] });
        // the camera pods for mirrors
        for (const sd of [-1, 1]) K.mirror(0.72, 0.98, sd * 0.97, { col: B, w: 0.1, h: 0.06 });
        K.hinge('hood', [1.05, 0.96, -0.6], [1.05, 0.96, 0.6]);
        K.hinge('trunk', [-2.05, 1.02, -0.6], [-2.05, 1.02, 0.6]);
        K.hinge('doorL', [1.0, 0.42, -0.95], [1.0, 0.88, -0.95]); K.hinge('doorR', [1.0, 0.42, 0.95], [1.0, 0.88, 0.95]);
        // inside (seen once a part is off): the front seats, the rear bench, the dashboard's screen, the front motor in the bay
        for (const sd of [-1, 1]) K.seat(-0.2, 0.44, sd * 0.4, { w: 0.5, back: 0.7 });
        K.seat(-1.15, 0.44, 0, { w: 1.3, back: 0.6 });
        K.box(0.8, 0.62, 0, 0.3, 0.2, 1.6, 0, D, null, false, { inner: true, part: 'body' });
        K.engine(1.6, 0.34, 0, { l: 0.5, w: 0.7, h: 0.4 });
      },
    },
  });
})();
