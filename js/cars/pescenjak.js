/* Vehicle 'pescenjak' — PEŠČENJAK: a desert marathon-rally buggy, mid-engined. Signature features: 1) an exposed tube frame with a low
   body around it, 2) two spare wheels standing behind the cabin, 3) a tall air snorkel beside the roof, 4) huge long-travel wheels in
   open arches, 5) a roof light pod and a flat nose. L 4.60 W 2.30 H 1.85, wheelbase 2.90, overhangs F 0.82 R 0.88 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'pescenjak', name: 'PEŠČENJAK', cat: 'teren', ord: 1, drive: 'MR',
    desc: 'Puščavski buggy za maratonske relije: cevni okvir, rezervni kolesi in dihalka.',
    phys: { mass: 1500, a: 1.48, b: 1.42, kI: 1.3, kw: 260, redline: 6500, idle: 800, gears: [3.2, 2.08, 1.5, 1.17, 0.95, 0.8], final: 6.97, rw: 0.45, cDrag: 0.6, len: 4.6, wid: 2.3, steerMax: 0.62,
      tracK: 0.9, brakeK: 0.85, spinK: 0.6, loose: 1.3, looseDrag: 0.4, landV: 20, landK: 0.5, sway: 1.7, dmgK: 0.8 },
    arc: { amax: 1.55, kv: 1.85, rmin: 5.4 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.08, pwr: 0.06, out: 1.15, turn: 0.9, w: 0.95, tv: 1.15 },   // (the MR layer: quick turn-in, lift rotation; its own liftP, pwr, out, turn, w, tv)
    stats: { power: 7, grip: 4, weight: 5, drift: 9 },
    price: 55000, pk: 'ppo', field: ['pescenjak'],
    snd: { kind: 'v8', hz: 0.85, loud: 1.2 },
    expect: { t100: [3.75, 4.4], vmax: [181, 192], latG: [1.98, 2.08], d100: [25.9, 28.6] },
    partNames: { nose: 'front panel', cover: 'engine cover', spareL: 'spare wheel', spareR: 'spare wheel', snorkel: 'snorkel' },
    parts: { set: 'none', ht: 1.85, y0: 0.45,
      extra: {
        nose: { z: 0, th: 0.55, m: 6, rW: 0.35, h: 0.1, lx: 0.95, lz: 0, f: 0.21 },
        cover: { z: 1, th: 0.72, m: 9, rW: 0.38, h: 0.08, lx: -0.52, lz: 0, f: 0.42 },
        spareL: { z: 2, th: 0.65, m: 10, r: 0.42, h: 0.3, lx: -0.22, lz: -0.79, f: 0.43 },
        spareR: { z: 3, th: 0.65, m: 10, r: 0.42, h: 0.3, lx: -0.22, lz: 0.79, f: 0.43 },
        snorkel: { z: 3, th: 0.5, m: 2, r: 0.25, h: 0.1, lx: 0.34, lz: 0.77, f: 0.77 },
      },   // (where the look has them: each entry at its range's centroid, the debris flies off from there)
    },
    // the look (KIT API v1, render.js; look units = metres): one loft, the low body (its regions: the nose panel; the deck's middle under
    // the engine cover's spine), open over the cockpit (an open top, lined in the outer shell); the tube frame over it and its rear bumper
    // tube (in the stripe colour), the roof panel with the light pod, the windscreen, the mirrors, the seats and the dashboard in 'body';
    // the engine cover's spine with its louvres, the spare wheels in their bays behind the cabin, the snorkel up the right A-pillar, the
    // blunt nose's lamps and skid plate in their parts; the engine, the gearbox and the frame's front in the inner block. The livery: the
    // paint, a stripe down the middle (bonnet, roof, spine) and along the sides; the start number on the spine and on the cockpit's sides
    look: {
      body: { len: 4.6, wid: 2.3, roofY: 1.66,
        //       x       w     yb    ybelt  wt    yt    cr     kind  tuck
        secs: [[-2.3, 0.78, 0.62, 0.9, 0.74, 0.95, 0.01, 'b', 0.08],      // the tail: narrow (the rear tyres stand out past it)
          [-2.16, 0.95, 0.54, 0.94, 0.91, 0.99, 0.01, 'b', 0.1],
          [-1.42, 1.04, 0.42, 0.96, 0.99, 1.02, 0.01, 'b', 0.1],          // over the rear axle: the rear fenders, the engine cover's spine between them
          [-0.9476, 1.04, 0.4, 0.96, 0.99, 1.02, 0.01, 'b', 0.1],         // the fenders' front face (at the arch's cut), down to the shelf
          [-0.8745, 1.0, 0.38, 0.68, 0.98, 0.7, 0, 'b', 0.18],            // the shelf behind the cabin: the spare wheels stand on it
          [-0.06, 1.0, 0.36, 0.68, 0.98, 0.7, 0, 'b', 0.2],
          [-0.03, 0.98, 0.36, 0.82, 0.96, 0.84, 0, 'r', 0.2],             // the cockpit: open over its sides (the cage over it); a tall dark sill
          [0.932, 0.98, 0.36, 0.84, 0.96, 0.86, 0, 'gf', 0.2],            // the firewall, just short of the front arch (the windscreen stands on the cowl)
          [1.0057, 0.98, 0.37, 0.92, 0.95, 1.0, 0.02, 'b', 0.1],          // the cowl
          [1.48, 1.04, 0.4, 0.98, 0.99, 1.03, 0.02, 'b', 0.1],            // the front fenders
          [1.9543, 0.97, 0.46, 0.9, 0.93, 0.96, 0.02, 'b', 0.1],          // the nose panel from here
          [2.24, 0.86, 0.5, 0.86, 0.83, 0.92, 0.02, 'b', 0.1],
          [2.3, 0.82, 0.52, 0.84, 0.79, 0.89, 0.01, 'b', 0.1]],            // the flat nose: a blunt face
        eye: { x: 0.2, y: 1.32, near: 0.2, tilt: 0.07, style: 'closed' },   // (under the roof panel: the pillars, the roof's edge, the cage's tubes)
        decalX: -1.5, decalY: 1.172, decalRz: 0.119, decalS: 0.9, decalPart: 'cover',   // (the start number on the engine cover's spine, over its stripe)
        engRear: true, cage: true, crush: { x0: 0.0, x1: 0.62, z: 0.68 } },   // (the roof panel's footprint)
      wheels: { style: 'knob', w: 0.32, gap: 0.1, rim: [0.7, 0.71, 0.73] },
      regions: 'none',
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS;
        const DK = [0.11, 0.11, 0.12], FR = [0.2, 0.2, 0.22], AL = [0.58, 0.59, 0.62], SEAT = [0.13, 0.13, 0.14], RED = K.rgb(0xd8261c);
        // ---- the low body: open over the cockpit; the nose panel and the deck's middle under the spine (the cover's: off, it opens the
        //      engine bay) in their parts; the sills dark, black in the arches ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (at.end) return P;
          const x = at.x;
          if (x > -0.03 && x < 0.932 && e >= 2 && e <= 6) return null;
          if (e === 0 || e === 8) return at.arch ? B : DK;
          if (e === 4 && x < -0.06) return DK;
          return P;
        }, { caps: { front: { col: P, colLow: DK, cut: 0.62, low: 'nose', high: 'nose' }, rear: { col: P, colLow: DK, cut: 0.72, low: 'body', high: 'body' } },
          regions: [{ part: 'nose', x: [1.9543, 2.6], bands: ['tuck', 'side', 'window', 'edge', 'crown'] },
            { part: 'cover', x: [-2.6, -0.06], bands: ['crown'] }] });
        const D = L.decal;
        D.side([[-0.86, 0.58], [0.93, 0.58], [0.93, 0.64], [-0.86, 0.64]], S, null, 0.006);        // the band along the sides, over the sill
        D.top([[1.02, -0.1], [2.29, -0.1], [2.29, 0.1], [1.02, 0.1]], S, 0.006);                   // the stripe down the bonnet (the roof's, the spine's)
        for (const s of [-1, 1]) D.top([[1.26, s * 0.58], [1.7, s * 0.58], [1.7, s * 0.84], [1.26, s * 0.84]], DK, 0.006);   // the vents over the front wheels
        // ---- the engine cover: a spine from behind the cabin to the tail, between the spare wheels and over the rear fenders (with the
        //      deck's middle under it: off, it opens the engine bay) ----
        K.part('cover', () => {
          const ring = (x, yt, hw) => [[x, 0.69, -hw], [x, yt - 0.09, -hw], [x, yt, -hw + 0.12], [x, yt, hw - 0.12], [x, yt - 0.09, hw], [x, 0.69, hw]];
          K.skin([ring(-0.07, 1.34, 0.52), ring(-2.24, 1.08, 0.5)], P, P, P);
          K.face([[-0.08, 1.346, 0.1], [-0.08, 1.346, -0.1], [-2.23, 1.086, -0.1], [-2.23, 1.086, 0.1]], S);   // (its stripe, facing up)
          const ys = (x) => 1.346 + (x + 0.08) * 0.1198;   // (the spine's top, 6 mm over it)
          for (const s of [-1, 1]) for (const x of [-0.3, -0.44, -0.58]) { const z0 = s * 0.16, z1 = s * 0.35, q = [[x, ys(x), z1], [x, ys(x), z0], [x - 0.07, ys(x - 0.07), z0], [x - 0.07, ys(x - 0.07), z1]];
            K.face(s > 0 ? q : [q[1], q[0], q[3], q[2]], DK); }   // the louvres over the engine
        }, { hinge: [[-2.24, 1.04, -0.6], [-2.24, 1.04, 0.6]] });
        // ---- the tube frame: the cage over the cockpit (A-pillars, roof frame, main hoop, the door X), the stays down to the tail ----
        const A0 = [0.97, 0.99, 0.82], A1 = [0.62, 1.6, 0.7], H0 = [0.0, 0.42, 0.84], H1 = [0.0, 1.61, 0.72];
        const mz = (p, s) => [p[0], p[1], p[2] * s];
        const bars = [[mz(A1, -1), A1], [mz(H1, -1), H1]];
        for (const s of [-1, 1]) bars.push([mz(A0, s), mz(A1, s)], [mz(A1, s), mz(H1, s)], [mz(H0, s), mz(H1, s)],
          [[0.92, 0.88, s * 0.84], [0.02, 1.36, s * 0.82]], [[0.02, 0.88, s * 0.84], [0.76, 1.37, s * 0.77]], [mz(H1, s), [-2.05, 1.02, s * 0.68]]);
        K.cage(bars, 0.028, S, { part: 'body', inner: false, noCrush: true, noDent: true, n: 5 });   // (in the stripe colour: it stands out on any paint; rigid)
        // ---- the roof panel (its stripe; a crushed roof caves in between the cage's tubes), the windscreen (one-sided, facing out); the
        //      light pod on the roof (it goes down whole with the panel under it) ----
        K.part('body', () => {
          K.plate([[0.66, 1.645, -0.74], [0.66, 1.645, 0.74], [-0.04, 1.65, 0.76], [-0.04, 1.65, -0.76]], 0.03, P);
          K.face([[0.48, 1.664, -0.1], [-0.02, 1.667, -0.1], [-0.02, 1.667, 0.1], [0.48, 1.664, 0.1]], S);
          K.face([[0.96, 1.0, 0.78], [0.96, 1.0, -0.78], [0.625, 1.585, -0.68], [0.625, 1.585, 0.68]], G);
        });
        K.part('body', () => {
          K.box(0.57, 1.665, 0, 0.16, 0.1, 1.04, 0, B);
          for (const z of [-0.39, -0.13, 0.13, 0.39]) K.discX(0.652, 1.715, z, 0.044, 8, K.lampHead, 1);
        }, { noCrush: true });
        for (const s of [-1, 1]) K.mirror(0.82, 1.22, s * 0.97, { w: 0.06, h: 0.11, d: 0.17, col: B, arm: B, z0: s * 0.78 });   // the mirrors on the A-pillars
        // ---- the snorkel up the right A-pillar, its intake over the roof ----
        K.part('snorkel', () => {
          const hex = [0, 1, 2, 3, 4, 5].map(i => [Math.cos(i * Math.PI / 3) * 0.055, Math.sin(i * Math.PI / 3) * 0.055]);
          K.sweep(hex, [[1.12, 0.98, 0.93], [0.66, 1.62, 0.88], [0.65, 1.76, 0.88]], B, { capA: B, capB: B });
          K.box(0.67, 1.75, 0.88, 0.2, 0.1, 0.13, 0, B);
          K.rect(0.771, 1.8, 0.88, 0.11, 0.08, DK);
          K.bar([0.84, 1.38, 0.9], [0.83, 1.38, 0.78], 0.015, FR, { n: 4 });
        }, { noCrush: true, hinge: [[1.12, 0.98, 0.85], [1.12, 0.98, 1.0]] });
        // ---- the spare wheels standing on the shelf, on their carriers ----
        for (const s of [-1, 1]) K.part(s < 0 ? 'spareL' : 'spareR', () => {
          K.tyre(-0.5, 1.05, s * 0.9, { axis: 'z', face: s });
          K.bar([-0.5, 1.05, s * 0.6], [-0.5, 1.05, s * 0.76], 0.035, DK, { n: 4 });
        }, { noCrush: true, noDent: true, hinge: [[-0.95, 0.7, s * 0.9], [-0.05, 0.7, s * 0.9]] });
        // ---- the nose panel: two lamps a side in black pods in its flat face, the intake between them, the skid plate under it with
        //      its towing eyes ----
        K.part('nose', () => {
          for (const s of [-1, 1]) { K.rect(2.302, 0.73, s * 0.46, 0.46, 0.2, B);
            K.headLamp(2.306, 0.73, s * 0.58, 0.084, { ring: null, n: 10 }); K.headLamp(2.306, 0.73, s * 0.35, 0.066, { ring: null, n: 8 });
            K.rect(2.307, 0.565, s * 0.44, 0.07, 0.05, RED); }
          K.rect(2.302, 0.73, 0, 0.32, 0.1, DK);
          K.plate([[2.3, 0.56, -0.66], [2.3, 0.56, 0.66], [1.95, 0.4, 0.72], [1.95, 0.4, -0.72]], 0.03, AL);
        }, { hinge: [[1.96, 0.97, -0.85], [1.96, 0.97, 0.85]] });
        // ---- the tail: the lamps, the cooling outlet between them, the plate, the exhaust, the frame's bumper tube under it with its
        //      towing eye, the skid plate, the mudflaps; the start numbers on the cockpit's sides ----
        K.part('body', () => {
          for (const s of [-1, 1]) { K.rect(-2.303, 0.83, s * 0.56, 0.28, 0.16, B, { dir: '-x' }); K.tailLamp(-2.305, 0.83, s * 0.56, 0.24, 0.12);
            K.rect(-2.0, 0.45, s * 0.98, 0.3, 0.46, B, { dir: '-x' });
            K.number(0.5, 0.69, s * 0.982, 0.24, { dir: s < 0 ? '-z' : 'z' }); }
          K.grille(-2.302, 0.83, 0, 0.56, 0.13, { dir: -1, slats: 2 });                                // the cooling outlet between the lamps
          K.rect(-2.303, 0.68, 0.06, 0.34, 0.09, [0.93, 0.93, 0.9], { dir: '-x' });                    // the plate
          K.exhaust(-2.315, 0.66, -0.36, 0.05, 0.2, { n: 6 });
          K.cyl([-2.27, 0.57, -0.8], [-2.27, 0.57, 0.8], 0.042, S, { n: 6 });                          // the frame's rear bumper tube (under the tail), its brackets
          for (const s of [-1, 1]) K.bar([-2.27, 0.57, s * 0.42], [-2.1, 0.53, s * 0.42], 0.025, S, { n: 4 });
          K.rect(-2.314, 0.57, 0.3, 0.06, 0.07, RED, { dir: '-x' });                                   // (its towing eye)
          K.plate([[-2.3, 0.6, 0.6], [-2.3, 0.6, -0.6], [-1.98, 0.44, -0.66], [-1.98, 0.44, 0.66]], 0.03, AL);   // the skid plate under the tail
        });
        // ---- inside: the seats, the dashboard and the wheel (the cockpit is open: in the outer shell); the engine and the gearbox
        //      (the inner block: seen once the cover is off) ----
        for (const s of [-1, 1]) K.seat(0.45, 0.52, s * 0.37, { w: 0.46, l: 0.44, back: 0.72, tilt: 0.24, col: SEAT, inner: false });
        K.part('body', () => {
          K.box(0.84, 0.8, 0, 0.16, 0.18, 1.64, 0, DK);
          K.discX(0.64, 1.0, -0.37, 0.17, 6, B, -1);
          K.bar([0.66, 0.985, -0.37], [0.86, 0.9, -0.37], 0.02, DK, { n: 4 });
        });
        K.engine(-0.9, 0.42, 0, { l: 1.0, w: 0.6, h: 0.52, inner: true });
        K.cage([[[0.95, 0.5, -0.5], [2.2, 0.56, -0.5]], [[0.95, 0.5, 0.5], [2.2, 0.56, 0.5]], [[2.2, 0.56, -0.5], [2.2, 0.56, 0.5]],   // the frame's front under the
          [[1.3, 0.52, -0.5], [1.48, 0.92, -0.6]], [[1.3, 0.52, 0.5], [1.48, 0.92, 0.6]], [[1.48, 0.92, -0.6], [1.48, 0.92, 0.6]],      // nose: the rails, the shock
          [[0.95, 0.92, -0.6], [1.48, 0.92, -0.6]], [[0.95, 0.92, 0.6], [1.48, 0.92, 0.6]]], 0.03, [0.62, 0.63, 0.66], { inner: true, part: 'body' });   // towers
        K.box(-1.62, 0.44, 0, 0.5, 0.3, 0.44, 0, [0.3, 0.31, 0.33], null, false, { inner: true, part: 'body' });
      },
    },
  });
})();
