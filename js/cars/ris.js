/* Vehicle 'ris' — RIS G: a wide four-wheel-drive gymkhana coupe made for sliding (invented; no real model). Signature features: 1) the
   black roof with the scoop for the turbo's air, 2) the wide black overfenders on all four arches, the mud flaps behind every wheel,
   3) the big black blocks of the livery slanting up and back on the sides, a white line along their edge, 4) the light pod of four round
   lamps in the grille under the slim lamps, 5) the big wing on swan necks over the boot lid, one big pipe in the diffuser. L 4.45 W 2.00
   H 1.38, wheelbase 2.62, overhangs F 0.94 R 0.88 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'ris', name: 'RIS G', cat: 'sportni', ord: 9, drive: 'AWD',
    desc: 'Širok kupe 4x4 za gimkano: veliko krilo, široki blatniki in zajemalka na strehi.',
    // the AWD layer turned round for sliding (docs/novi-avti-2.md): the power swings it round (pwr; over 300 W/kg its wheels spin little:
    // spinK), a big slide for the turn (tv), held long (out), a lift and the brakes help (liftP, bx); quick to turn in (turn); its four
    // driven wheels launch it no quicker than the sports cars (tracK). The driving school's drift (tools/novi-avti-2/drift.js): Jezero
    // 2213, Spa 467, Bathurst 835 (ŠKORPIJON H 1998 / 202 / 836)
    phys: { mass: 1360, a: 1.28, b: 1.34, kI: 1.15, kw: 400, redline: 7800, idle: 950, gears: [3.1, 2.2, 1.65, 1.3, 1.07, 0.9], final: 3.9, rw: 0.34, cDrag: 0.46, len: 4.45, wid: 2.0, steerMax: 0.78,
      tracK: 1.0, brakeK: 1.05, spinK: 0.3 },
    arc: { amax: 1.8, kv: 2.1, rmin: 4.1 },
    csp: { bx: 0.16, coast: -0.05, thr: 0.02, liftP: 0.12, pwr: 0.14, out: 1.35, turn: 1.08, w: 1.0, tv: 1.35 },
    stats: { power: 10, grip: 8, weight: 6, drift: 10 },
    price: 85000, pk: 'open', field: ['ris'],
    snd: { kind: 'i4', hz: 1.05, turbo: 1, loud: 1.2 },
    expect: { t100: [2.7, 3.08], vmax: [236, 252], latG: [2.23, 2.33], d100: [21.9, 23.7] },   // (measured 2.88 / 244 / 2.28 / 22.8)
    partNames: { spoiler: 'rear wing', headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamp', tailR: 'right tail lamp' },
    // the car's set and its own: the big wing mounted on the boot lid (on: it opens with it, goes with it; a lost one flies off from
    // there), each head lamp and each tail lamp a part of its own
    parts: { set: 'car', ht: 1.38, y0: 0.2,
      extra: {
        spoiler: { z: 1, th: 0.6, m: 3, r: 0.5, h: 0.14, lx: -0.96, lz: 0, y: 1.16, on: 'trunk' },
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: 1.0, lz: -0.62, y: 0.52 },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: 1.0, lz: 0.62, y: 0.52 },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: -1.0, lz: -0.62, y: 0.8 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: -1.0, lz: 0.62, y: 0.8 },
      },
      over: { trunk: { lx: -0.95, y: 0.92 } } },   // (the boot lid: the short deck behind the rear glass and the tail's face under it)
    // where the garage's parts go (js/deli.js, look units): the wing over the boot lid, in the wing's part (in place of the big wing); the
    // head lamps where the slim lamps are, in the lamps' parts; the rims on its wheels
    mounts: {
      krilo: { x: -2.13, w: 0.94, part: 'spoiler' },
      zarometi: { x: 2.22, y0: 0.52, lean: 0, zc: 0.62, yc: 0.52, s: 0.3, hosts: ['headL', 'headR'], depth: 0.04 },
      platisca: {},
    },
    // the look (KIT API v1, render.js; look units = metres: the centre of mass at x 0, the axles at 1.28 / -1.34): one loft, the standard
    // regions split it into the parts. Seen from the chase camera: the big wing, the black roof and its scoop, the overfenders, the pipe
    look: {
      body: { len: 4.45, wid: 2.0, roofY: 1.38,
        //       x      w     yb    ybelt  wt    yt    cr    kind  tuck
        secs: [[-2.22, 0.88, 0.3, 0.8, 0.78, 0.88, 0.02, 'b', 0.1],    // the tail's face: the lamps, the black panel, the diffuser under it
          [-2.16, 0.95, 0.29, 0.84, 0.84, 0.94, 0.03, 'b', 0.1],      // the boot lid's end
          [-1.8, 0.98, 0.28, 0.88, 0.74, 1.0, 0.03, 'gr', 0.1],       // the rear glass's foot
          [-1.02, 0.97, 0.28, 0.9, 0.62, 1.32, 0.04, 'r', 0.1],       // the roof's rear edge
          [-0.3, 0.96, 0.28, 0.91, 0.62, 1.34, 0.04, 'r', 0.1],       // the roof's top
          [0.16, 0.96, 0.28, 0.9, 0.64, 1.31, 0.04, 'gf', 0.1],       // the windscreen's top
          [0.95, 0.97, 0.29, 0.86, 0.8, 0.93, 0.04, 'b', 0.1],        // its base (the cowl)
          [1.7, 0.98, 0.28, 0.8, 0.82, 0.86, 0.04, 'b', 0.09],        // the bonnet over the front wheels
          [2.05, 0.94, 0.25, 0.72, 0.78, 0.78, 0.03, 'b', 0.08],      // the nose's top
          [2.22, 0.86, 0.22, 0.62, 0.7, 0.66, 0.02, 'b', 0.07]],      // the nose's face: the grille and the light pod
        eye: { x: -0.4, y: 1.06 },
      },
      wheels: { style: 'std', spokes: 6, w: 0.27, rim: [0.92, 0.92, 0.9], cap: [0.12, 0.12, 0.13], gap: 0.04 },
      build(K) {
        const P = K.paint, B = K.black, G = K.GLASS, DK = [0.08, 0.08, 0.09], D = [0.12, 0.12, 0.13], WH = [0.94, 0.94, 0.92];
        // the shell: the paint; the glass (the windscreen, the side windows along the roof, the rear glass); the roof black; the sills dark
        // between the arches, the paint's shade under the bumpers' corners
        const XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;
        const L = K.loft(K.secs(K.body.secs), (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch || (at.x > XA && at.x < XB) ? DK : K.shade(P, 0.55);
          if (kind === 'gf' && e >= 2 && e <= 6) return G;
          if (kind === 'r' && (e === 2 || e === 6)) return G;
          if (kind === 'r' && e >= 3 && e <= 5) return B;
          if (kind === 'gr' && e >= 3 && e <= 5) return G;
          return P;
        }, { caps: { front: { col: P }, rear: { col: P } } });
        const DC = L.decal;
        // the B-pillar; the livery: the big black blocks slanting up and back on the sides, the white line along their edge; the start
        // number on them, the door handles
        DC.band([[-0.98, 0], [-0.86, 0], [-0.86, 1], [-0.98, 1]], B, null, 0.01);
        DC.side([[-1.75, 0.36], [-0.2, 0.36], [0.5, 0.86], [-1.75, 0.86]], B, null, 0.008);
        DC.side([[-0.2, 0.36], [-0.08, 0.36], [0.62, 0.86], [0.5, 0.86]], WH, null, 0.009);
        for (const sd of [-1, 1]) {
          K.number(-0.95, 0.62, sd * 0.97, 0.3, { dir: sd < 0 ? '-z' : 'z' });
          K.rect(-0.62, 0.82, sd * 0.975, 0.13, 0.025, D, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' });
        }
        // the roof scoop (the air for the turbo), the bonnet's vents
        K.box(-0.45, 1.33, 0, 0.62, 0.08, 0.44, 0, B);
        K.rect(-0.14, 1.37, 0, 0.4, 0.06, DK);
        for (const sd of [-1, 1]) DC.top([[1.15, sd * 0.18], [1.6, sd * 0.18], [1.6, sd * 0.5], [1.15, sd * 0.5]], DK, 0.004);
        // the wide black overfenders, the mud flaps behind every wheel
        for (const A of K.arches) for (const sd of [-1, 1]) {
          K.flare(A.x, 0.37, 0.47, sd * 0.9, sd * 1.0, B);
          K.box(A.x - 0.44, 0.1, sd * 0.86, 0.02, 0.3, 0.26, 0, DK, null, true, { part: 'body' });
        }
        // the nose: the slim lamps (each a part of its own; the garage's lamps in their place: K.deli, mounts.zarometi); the front bumper:
        // the grille, the light pod of four round lamps in it, the splitter
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(2.222, 0.52, sd * 0.62, 0.05, { shape: 'rect', w: 0.3, h: 0.06, ring: null, host: sd < 0 ? 'headL' : 'headR' }); });
        K.part('bumperF', () => {
          K.grille(2.223, 0.36, 0, 1.3, 0.22, { slats: 3 });
          for (const z of [-0.36, -0.12, 0.12, 0.36]) K.headLamp(2.232, 0.36, z, 0.065, { ring: B });
          K.box(2.12, 0.19, 0, 0.3, 0.025, 1.9, 0, DK);
        }, { hinge: [[2.1, 0.3, -0.8], [2.1, 0.3, 0.8]] });
        // the big wing on swan necks over the boot lid, its endplates (the garage's wing in its place: K.deli, mounts.krilo)
        K.part('spoiler', () => K.deli('krilo', () => {
          K.wingPlank(-1.92, 1.22, -2.34, 1.26, 0.035, -0.94, 0.94, B);
          for (const sd of [-1, 1]) {
            K.endplate([[-1.88, 1.12], [-2.4, 1.12], [-2.4, 1.34], [-1.88, 1.3]], sd * 0.95, 0.012, B);
            K.endplate([[-2.12, 0.92], [-2.24, 0.92], [-2.3, 1.24], [-2.18, 1.24]], sd * 0.4, 0.016, DK);
          }
        }));
        // the tail: the lamps on the corners (each a part of its own), the black panel between them on the boot lid
        for (const sd of [-1, 1]) { const tp = sd < 0 ? 'tailL' : 'tailR';
          K.rect(-2.222, 0.8, sd * 0.62, 0.38, 0.1, B, { dir: '-x', part: tp }); K.tailLamp(-2.226, 0.8, sd * 0.62, 0.34, 0.06, { host: tp }); }
        K.rect(-2.222, 0.8, 0, 0.86, 0.05, B, { dir: '-x', part: 'trunk' });
        // the rear bumper: the diffuser and its fins, one big pipe in the middle
        K.part('bumperR', () => {
          K.box(-2.16, 0.16, 0, 0.16, 0.14, 1.6, 0, DK);
          for (const z of [-0.5, -0.25, 0.25, 0.5]) K.box(-2.2, 0.16, z, 0.2, 0.13, 0.02, 0, DK);
          K.exhaust(-2.28, 0.3, 0, 0.075, 0.22);
        }, { hinge: [[-2.1, 0.3, -0.8], [-2.1, 0.3, 0.8]] });
        // the black mirrors
        for (const sd of [-1, 1]) K.mirror(0.66, 0.96, sd * 0.99, { col: B });
        K.hinge('hood', [0.95, 0.96, -0.6], [0.95, 0.96, 0.6]);
        K.hinge('trunk', [-1.8, 1.0, -0.6], [-1.8, 1.0, 0.6]);
        K.hinge('doorL', [0.86, 0.42, -0.95], [0.86, 0.86, -0.95]); K.hinge('doorR', [0.86, 0.42, 0.95], [0.86, 0.86, 0.95]);
        // inside (seen once a part is off): the bucket seats, the roll cage's hoop behind them, the dashboard, the four in the bay
        for (const sd of [-1, 1]) K.seat(-0.4, 0.42, sd * 0.4, { w: 0.5, back: 0.72 });
        K.box(0.72, 0.6, 0, 0.3, 0.22, 1.6, 0, D, null, false, { inner: true, part: 'body' });
        K.engine(1.55, 0.36, 0, { l: 0.62, w: 0.66, h: 0.48 });
      },
    },
  });
})();
