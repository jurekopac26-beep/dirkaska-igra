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
      krilo: { x: -2.21, w: 0.84, part: 'wing' },
      zarometi: { x: 2.243, y0: 0.5, lean: 0, zc: 0.6, yc: 0.5, s: 0.34, hosts: ['headL', 'headR'], depth: 0.04 },
      platisca: {},
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
        for (const sd of [-1, 1]) {
          K.number(0.25, 0.6, sd * 0.94, 0.28, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' });
          K.rect(-0.66, 0.8, sd * 0.94, 0.13, 0.025, B, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' });
        }
        // the wide bolted-on arches, dark, front and rear
        for (const A of K.arches) for (const sd of [-1, 1]) K.flare(A.x, 0.37, 0.47, sd * 0.88, sd * 1.0, DK);
        // the long bonnet: the dark vent in its middle (the heat out of the bay), its louvres
        DC.top([[1.12, -0.3], [1.56, -0.3], [1.56, 0.3], [1.12, 0.3]], DK, 0.004);
        for (let i = 0; i < 4; i++) { const x = 1.18 + i * 0.1; DC.top([[x, -0.27], [x + 0.03, -0.27], [x + 0.03, 0.27], [x, 0.27]], [0.2, 0.2, 0.21], 0.006); }
        // the nose: the slim lamps on its corners (each a part of its own; the garage's lamps in their place: K.deli, mounts.zarometi)
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(2.243, 0.5, sd * 0.6, 0.05, { shape: 'rect', w: 0.34, h: 0.06, ring: null, host: sd < 0 ? 'headL' : 'headR' }); });
        K.rect(2.242, 0.5, 0, 0.82, 0.04, B);
        // the front bumper: the wide mouth, the dive planes on its corners
        K.part('bumperF', () => {
          K.grille(2.243, 0.32, 0, 1.24, 0.2, { slats: 3 });
          for (const sd of [-1, 1]) { K.rect(2.243, 0.3, sd * 0.74, 0.12, 0.16, B); K.box(2.12, 0.36, sd * 0.86, 0.22, 0.02, 0.16, 0, DK); }
        }, { hinge: [[2.16, 0.3, -0.75], [2.16, 0.3, 0.75]] });
        // the splitter under the nose (a part of its own)
        K.part('splitter', () => K.box(2.16, 0.17, 0, 0.32, 0.025, 1.9, 0, DK), { hinge: [[2.0, 0.19, -0.8], [2.0, 0.19, 0.8]] });
        // the tail: the slim lamps on the corners in black surrounds (each a part of its own), the dark bar between them, the rain light
        for (const sd of [-1, 1]) { const tp = sd < 0 ? 'tailL' : 'tailR';
          K.rect(-2.265, 0.78, sd * 0.6, 0.36, 0.1, B, { dir: '-x', part: tp }); K.tailLamp(-2.27, 0.78, sd * 0.6, 0.32, 0.06, { host: tp }); }
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
          K.exhaust(-2.3, 0.3, 0.38, 0.06, 0.2);
          K.rect(-2.267, 0.42, -0.62, 0.05, 0.13, K.rgb(0xff7a12), { dir: '-x' });
        }, { hinge: [[-2.2, 0.3, -0.7], [-2.2, 0.3, 0.7]] });
        // the small black mirrors
        for (const sd of [-1, 1]) K.mirror(0.66, 0.92, sd * 1.0, { col: B });
        K.hinge('hood', [0.92, 0.86, -0.6], [0.92, 0.86, 0.6]);
        K.hinge('trunk', [-1.84, 0.95, -0.6], [-1.84, 0.95, 0.6]);
        K.hinge('doorL', [0.86, 0.4, -0.92], [0.86, 0.82, -0.92]); K.hinge('doorR', [0.86, 0.4, 0.92], [0.86, 0.82, 0.92]);
        // inside (seen once a part is off): the bucket seats, the cage, the dashboard, the long six in the bay
        for (const sd of [-1, 1]) K.seat(-0.48, 0.42, sd * 0.38, { w: 0.48, back: 0.75 });
        K.cage([[[-0.9, 0.35, -0.7], [-0.9, 1.15, -0.55]], [[-0.9, 0.35, 0.7], [-0.9, 1.15, 0.55]], [[-0.9, 1.15, -0.55], [-0.9, 1.15, 0.55]],
          [[-0.9, 1.15, -0.55], [0.3, 1.14, -0.58]], [[-0.9, 1.15, 0.55], [0.3, 1.14, 0.58]]], 0.02, [0.85, 0.85, 0.86]);
        K.box(0.65, 0.6, 0, 0.3, 0.22, 1.5, 0, D, null, false, { inner: true, part: 'body' });
        K.engine(1.35, 0.32, 0, { l: 0.75, w: 0.5, h: 0.5 });
      },
    },
  });
})();
