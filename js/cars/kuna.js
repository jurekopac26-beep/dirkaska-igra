/* Vehicle 'kuna' — KUNA S: a front-drive three-door hot hatch set up for sliding (invented; no real model). Signature features: 1) the
   white roof over the paint, 2) the dark bonnet between two white stripes, 3) the tall wing on two uprights over the tailgate, its
   endplates, 4) twin round lamps each side in the black band across the tail, the big pipe in the middle, the orange tow strap, 5) gold
   five-spoke rims. L 4.28 W 1.86 H 1.38, wheelbase 2.60, overhangs F 0.96 R 0.72 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'kuna', name: 'KUNA S', cat: 'mali', ord: 8, drive: 'FF',
    desc: 'Vroči hečbek s prednjim pogonom za drift: bela streha, visoko krilo, zlata platišča.',
    // the FF layer turned round for sliding (docs/novi-avti-2.md): the throttle no longer pulls it straight (thr 0); the slide comes from
    // a big attitude for the turn (tv), a lift in a loaded corner (liftP: the rear steps out) and the brakes (bx: it pivots on them), held
    // longer (out), and a little pull of the power with the locking differential (pwr). The driving school's drift (tools/novi-avti-2/
    // drift.js): Jezero 2251, Spa 461, Bathurst 716 (ŠKORPIJON H 1998 / 202 / 836)
    phys: { mass: 1190, a: 1.04, b: 1.56, kI: 1.12, kw: 255, redline: 7400, idle: 900, gears: [3.4, 2.15, 1.55, 1.2, 0.98, 0.83], final: 4.0, rw: 0.32, cDrag: 0.41, len: 4.28, wid: 1.86, steerMax: 0.72 },
    arc: { amax: 1.8, kv: 2.1, rmin: 4.1 },
    csp: { bx: 0.22, coast: -0.045, thr: 0, liftP: 0.24, pwr: 0.06, out: 1.4, turn: 1.05, w: 1.02, tv: 1.45 },
    stats: { power: 7, grip: 8, weight: 7, drift: 8 },
    price: 30000, pk: 'ta1', field: ['kuna'],
    snd: { kind: 'i4', hz: 1.1, turbo: 0.8, loud: 1.05 },
    expect: { t100: [3.08, 3.48], vmax: [220, 236], latG: [2.18, 2.28], d100: [23.0, 24.8] },   // (measured 3.28 / 228 / 2.23 / 23.9)
    partNames: { spoiler: 'rear wing', headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamps', tailR: 'right tail lamps' },
    // the car's set and its own: the tall wing mounted on the tailgate (on: it opens with it, goes with it; a lost one flies off from
    // there), each head lamp and each pair of tail lamps a part of its own
    parts: { set: 'car', ht: 1.38, y0: 0.2,
      extra: {
        spoiler: { z: 1, th: 0.6, m: 2, r: 0.45, h: 0.12, lx: -0.95, lz: 0, y: 1.15, on: 'trunk' },
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: 0.93, lz: -0.6, y: 0.55 },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: 0.93, lz: 0.6, y: 0.55 },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: -1.06, lz: -0.55, y: 0.8 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: -1.06, lz: 0.55, y: 0.8 },
      },
      over: { trunk: { lx: -0.9, y: 1.02, h: 0.13 } } },   // (the tailgate: its glass and the tail's face under it, an L lying on the glass)
    // where the garage's parts go (js/deli.js, look units): the wing over the tailgate, in the wing's part (in place of the tall wing);
    // the head lamps where the slim lamps are, in the lamps' parts; the rims on its wheels
    mounts: {
      krilo: { x: -2.04, w: 0.82, part: 'spoiler' },
      zarometi: { x: 2.0, y0: 0.55, lean: 0, zc: 0.56, yc: 0.55, s: 0.32, hosts: ['headL', 'headR'], depth: 0.04 },
      platisca: {},
    },
    // the look (KIT API v1, render.js; look units = metres: the centre of mass at x 0, the axles at 1.04 / -1.56): one loft, the standard
    // regions split it into the parts (the rear glass reaches the tail: the tailgate takes it). Seen from the chase camera: the tall wing,
    // the white roof, the twin round lamps and the big pipe
    look: {
      body: { len: 4.28, wid: 1.86, roofY: 1.38,
        //       x      w     yb    ybelt  wt    yt    cr    kind  tuck
        secs: [[-2.28, 0.82, 0.3, 0.8, 0.7, 0.9, 0.02, 'b', 0.11],    // the tail's face: the black band with the lamps, the bumper under it
          [-2.2, 0.88, 0.29, 0.84, 0.76, 0.96, 0.03, 'gr', 0.11],     // the tailgate's glass from its foot
          [-1.2, 0.9, 0.28, 0.88, 0.6, 1.29, 0.04, 'r', 0.1],         // the roof's rear edge
          [-0.35, 0.9, 0.28, 0.89, 0.6, 1.33, 0.05, 'r', 0.1],        // the roof's top
          [0.1, 0.9, 0.28, 0.88, 0.62, 1.3, 0.05, 'gf', 0.1],         // the windscreen's top
          [0.95, 0.91, 0.29, 0.84, 0.78, 0.92, 0.05, 'b', 0.1],       // its base (the cowl)
          [1.62, 0.91, 0.28, 0.78, 0.78, 0.84, 0.05, 'b', 0.09],      // the bonnet over the front wheels
          [1.88, 0.86, 0.25, 0.7, 0.72, 0.74, 0.04, 'b', 0.08],       // the nose's top
          [2.0, 0.8, 0.24, 0.6, 0.64, 0.64, 0.02, 'b', 0.07]],        // the nose's face: the mesh mouth
        eye: { x: -0.3, y: 1.06 },
      },
      wheels: { style: 'std', spokes: 5, w: 0.235, rim: [0.78, 0.62, 0.28], cap: [0.15, 0.15, 0.16], gap: 0.04 },
      build(K) {
        const P = K.paint, B = K.black, G = K.GLASS, DK = [0.08, 0.08, 0.09], D = [0.12, 0.12, 0.13], WH = [0.94, 0.94, 0.92], TOW = [1, 0.48, 0.07];
        // the shell: the paint; the glass (the windscreen, the side windows along the roof, the tailgate's glass); the roof white; the
        // sills dark between the arches, the paint's shade under the bumpers' corners
        const XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;
        const L = K.loft(K.secs(K.body.secs), (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch || (at.x > XA && at.x < XB) ? DK : K.shade(P, 0.55);
          if (kind === 'gf' && e >= 2 && e <= 6) return G;
          if (kind === 'r' && (e === 2 || e === 6)) return G;
          if (kind === 'r' && e >= 3 && e <= 5) return WH;
          if (kind === 'gr' && e >= 3 && e <= 5) return G;
          return P;
        }, { caps: { front: { col: P }, rear: { col: P } } });
        const DC = L.decal;
        // the B-pillar black, the dark rubbing strip along the side, the start number on the doors, the door handles
        DC.band([[-0.75, 0], [-0.62, 0], [-0.62, 1], [-0.75, 1]], B, null, 0.01);
        DC.side([[-1.85, 0.32], [1.25, 0.32], [1.25, 0.4], [-1.85, 0.4]], B, null, 0.006);
        for (const sd of [-1, 1]) {
          K.number(-0.05, 0.6, sd * 0.91, 0.28, { dir: sd < 0 ? '-z' : 'z' });
          K.rect(-0.38, 0.8, sd * 0.905, 0.12, 0.025, B, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' });
        }
        // the dark bonnet between two white stripes
        DC.top([[1.0, -0.42], [1.98, -0.36], [1.98, 0.36], [1.0, 0.42]], DK, 0.004);
        for (const sd of [-1, 1]) DC.top([[1.0, sd * 0.44], [1.98, sd * 0.38], [1.98, sd * 0.46], [1.0, sd * 0.52]], WH, 0.006);
        // the nose: the slim lamps (each a part of its own; the garage's lamps in their place: K.deli, mounts.zarometi); the front bumper:
        // the mesh mouth, the lip under it
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(2.0, 0.55, sd * 0.56, 0.05, { shape: 'rect', w: 0.32, h: 0.06, ring: null, host: sd < 0 ? 'headL' : 'headR' }); });
        K.part('bumperF', () => {
          K.grille(2.003, 0.38, 0, 1.3, 0.22, { slats: 4 });
          K.box(1.94, 0.16, 0, 0.24, 0.025, 1.76, 0, DK);
        }, { hinge: [[1.9, 0.3, -0.7], [1.9, 0.3, 0.7]] });
        // the tall wing on two uprights over the tailgate's foot, its endplates (the garage's wing in its place: K.deli, mounts.krilo)
        K.part('spoiler', () => K.deli('krilo', () => {
          K.wingPlank(-1.86, 1.18, -2.22, 1.21, 0.03, -0.82, 0.82, B);
          for (const sd of [-1, 1]) {
            K.endplate([[-1.82, 1.1], [-2.26, 1.1], [-2.26, 1.28], [-1.82, 1.25]], sd * 0.83, 0.012, B);
            K.endplate([[-2.02, 0.92], [-2.12, 0.92], [-2.16, 1.19], [-2.06, 1.19]], sd * 0.36, 0.016, DK);
          }
        }));
        // the tail: the black band across it, the twin round lamps each side (each pair a part of its own)
        K.rect(-2.282, 0.8, 0, 0.42, 0.16, B, { dir: '-x', part: 'trunk' });
        for (const sd of [-1, 1]) { const tp = sd < 0 ? 'tailL' : 'tailR';
          K.rect(-2.282, 0.8, sd * 0.5, 0.5, 0.16, B, { dir: '-x', part: tp });
          K.tailLamp(-2.286, 0.8, sd * 0.6, 0.13, 0.13, { round: true, host: tp }); K.tailLamp(-2.286, 0.8, sd * 0.42, 0.13, 0.13, { round: true, host: tp }); }
        // the rear bumper: the dark diffuser, the big pipe in the middle, the orange tow strap
        K.part('bumperR', () => {
          K.box(-2.22, 0.15, 0, 0.14, 0.13, 1.3, 0, DK);
          K.exhaust(-2.33, 0.28, 0, 0.07, 0.2);
          K.rect(-2.283, 0.44, -0.55, 0.05, 0.13, TOW, { dir: '-x' });
        }, { hinge: [[-2.2, 0.3, -0.7], [-2.2, 0.3, 0.7]] });
        // the mirrors in the paint
        for (const sd of [-1, 1]) K.mirror(0.62, 0.95, sd * 0.91, { col: P });
        K.hinge('hood', [0.95, 0.93, -0.6], [0.95, 0.93, 0.6]);
        K.hinge('trunk', [-1.2, 1.3, -0.5], [-1.2, 1.3, 0.5]);
        K.hinge('doorL', [0.64, 0.42, -0.9], [0.64, 0.86, -0.9]); K.hinge('doorR', [0.64, 0.42, 0.9], [0.64, 0.86, 0.9]);
        // inside (seen once a part is off): the bucket seats, the rear bench, the dashboard, the four across in the bay
        for (const sd of [-1, 1]) K.seat(-0.3, 0.42, sd * 0.38, { w: 0.48, back: 0.7 });
        K.seat(-1.15, 0.42, 0, { w: 1.2, back: 0.6 });
        K.box(0.7, 0.6, 0, 0.3, 0.22, 1.5, 0, D, null, false, { inner: true, part: 'body' });
        K.engine(1.45, 0.34, 0, { l: 0.56, w: 0.7, h: 0.46 });
      },
    },
  });
})();
