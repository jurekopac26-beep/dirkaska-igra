/* Vehicle 'predsednik' — PREDSEDNIK: a stretch state limousine. Signature features: 1) a very long three-box body with six side windows,
   2) small flags on the front wings, 3) chrome grille, bumpers and window frames, 4) four doors and a long boot, 5) whitewall tyres. L
   6.20 W 1.95 H 1.45, wheelbase 4.40, overhangs F 0.85 R 0.95 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'predsednik', name: 'PREDSEDNIK', cat: 'posebni', ord: 2, drive: 'FR',
    desc: 'Raztegnjena limuzina z zastavicama na blatnikih in obilo kroma.',
    phys: { mass: 2900, a: 2.25, b: 2.15, kI: 1.65, kw: 300, redline: 5800, idle: 650, gears: [2.9, 1.8, 1.3, 1, 0.8], final: 5.37, rw: 0.36, cDrag: 0.45, len: 6.2, wid: 1.95, steerMax: 0.58,
      tracK: 0.7, brakeK: 0.75, spinK: 0.3, sway: 1.4, dmgK: 0.85 },
    arc: { amax: 1.5, kv: 1.8, rmin: 7.5 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.06, pwr: 0.05, out: 1.25, turn: 0.75, w: 0.92, tv: 1.18 },   // (the FR layer: lift-off and power rotation; its own liftP, pwr, out, turn, w, tv)
    stats: { power: 7, grip: 3, weight: 1, drift: 9 },
    price: 40000, pk: 'open', field: ['predsednik'], fieldN: 9,
    snd: { kind: 'v8', hz: 0.7, loud: 0.8 },
    expect: { t100: [4.95, 5.81], vmax: [167, 177], latG: [1.91, 2.01], d100: [29.3, 32.3] },
    partNames: { door2L: 'rear left door', door2R: 'rear right door', flagL: 'left flag', flagR: 'right flag' },
    parts: { set: 'car', ht: 1.45, y0: 0.2,
      // (the pieces fly off from where the look has the parts: the long bonnet and boot lid, the mirrors at the A-pillars' feet, the rear
      // doors' and the flags' ranges)
      over: {
        doorL: { lx: 0.22 },
        doorR: { lx: 0.22 },
        hood: { lx: 0.8, y: 0.93 },
        trunk: { lx: -0.87, y: 0.95 },
        mirrorL: { lx: 0.355, lz: -0.975, y: 0.99 },
        mirrorR: { lx: 0.355, lz: 0.975, y: 0.99 },
      },
      extra: {
        door2L: { z: 2, th: 0.72, m: 9, r: 0.6, h: 0.08, lx: -0.36, lz: -1, y: 0.9 },
        door2R: { z: 3, th: 0.72, m: 9, r: 0.6, h: 0.08, lx: -0.36, lz: 1, y: 0.9 },
        flagL: { z: 0, th: 0.4, m: 1, r: 0.3, h: 0.05, lx: 0.87, lz: -0.88, y: 1.16 },
        flagR: { z: 0, th: 0.4, m: 1, r: 0.3, h: 0.05, lx: 0.87, lz: 0.88, y: 1.16 },
      },
    },
    // the look (KIT API v1, render.js; look units = metres): one loft, the three boxes (the long bonnet, the cabin under a long flat roof,
    // the long boot); a six-light glasshouse (the front door's window, the fixed one in the stretch between the doors, the rear door's),
    // each window framed in chrome, black pillars between them, a broad C-pillar and a small rear window (a formal roof). The regions: the
    // standard ones, the rear doors (door2L / door2R) between the stretch and the quarters (the stretch stays with the body). Chrome swept
    // bumpers with overriders, an egg-crate grille between four round lamps, the flags on the front wings (flagL / flagR), white walls
    look: {
      body: { len: 6.2, wid: 1.95, roofY: 1.44,
        //       x      w      yb    ybelt  wt    yt     cr     kind  tuck
        secs: [[-3.05, 0.9, 0.34, 0.84, 0.86, 0.915, 0.01, 'b', 0.08],     // the tail's face (the lamps' panel over the bumper)
          [-2.98, 0.95, 0.3, 0.88, 0.91, 0.955, 0.015, 'b', 0.1],          // the boot's rear edge
          [-2.2, 0.975, 0.24, 0.92, 0.92, 0.985, 0.05, 'gr', 0.12],        // the boot lid's front edge: the rear glass's foot (its crown near
          //                                                                   the roof's: the glass hardly twisted, the paint over it lies flat)
          [-1.82, 0.975, 0.22, 0.95, 0.82, 1.38, 0.06, 'r', 0.12],         // the roof's rear edge
          [0.8, 0.975, 0.22, 0.95, 0.82, 1.38, 0.06, 'gf', 0.12],          // the windscreen's top
          [1.24, 0.975, 0.23, 0.93, 0.92, 0.985, 0.025, 'b', 0.12],        // its foot, the cowl
          [2.85, 0.965, 0.27, 0.88, 0.91, 0.935, 0.02, 'b', 0.12],         // the bonnet's front edge
          [3.0, 0.94, 0.3, 0.85, 0.88, 0.9, 0.012, 'b', 0.1],
          [3.04, 0.9, 0.32, 0.82, 0.86, 0.87, 0.005, 'b', 0.08]],          // the nose's face (the grille, the lamps)
        eye: { x: 0.4, y: 1.2, style: 'closed' },
        decalX: -1.18, decalY: 1.44, decalRz: 0, decalS: 0.85,                     // (the start number on the landau roof, over the rear seat)
        door: [1.24, 0.18], bumpY: [0.5, 0.5] },
      wheels: { style: 'retro', w: 0.235, gap: 0.06, rim: [0.34, 0.35, 0.38], cap: [0.86, 0.87, 0.9] },   // (a dark ring between the chrome cap and the white wall)
      // the standard regions; the quarters only from the tail's bumper to the rear doors, the rear doors (side and window) before them
      regions: (std) => std.flatMap(r => /^quarter/.test(r.part) ? [{ part: 'door2' + r.part.slice(-1), x: [-1.55, -0.55], bands: ['side', 'window'], y: [0.3, 1.42], side: r.part.slice(-1) },
        Object.assign({}, r, { x: [r.x[0], -1.55] })] : [r]),
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, CH = K.chrome, G = K.GLASS, DK = [0.07, 0.07, 0.075], SILL = K.shade(P, 0.6);
        const WH = [0.93, 0.93, 0.9], RED = [0.82, 0.1, 0.1], AMB = K.rgb(0xff9a1e), TAN = [0.56, 0.42, 0.29], WOOD = [0.33, 0.19, 0.1], VIN = [0.1, 0.095, 0.09];
        const XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;   // (the rear arch's front end, the front arch's rear end)
        // ---- the shell: the paint; the windscreen, the side windows (the front door's up to the A-pillar), the rear glass; dark sills; the
        //      landau roof (black padded vinyl) over the rear compartment and the C-pillars ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (at.end) return P;
          if (e === 0 || e === 8) return at.arch ? B : SILL;
          if (kind === 'gf') return e >= 2 && e <= 6 ? G : P;
          if (kind === 'r') return e === 2 || e === 6 ? (at.x > -1.55 ? G : VIN) : e >= 3 && e <= 5 && at.x < -0.55 ? VIN : P;   // (behind the rear door: the C-pillar)
          if (kind === 'gr') return e >= 3 && e <= 5 ? G : e === 2 || e === 6 ? VIN : P;   // (the rear glass, narrowed below; the C-pillar's foot)
          return P;
        });
        const D2 = L.decal;
        // the window frames (chrome): along the belt, under the roof's edge, up the A-pillar, round the pillars between the windows (black)
        D2.band([[-1.55, 0], [1.24, 0], [1.24, 0.05], [-1.55, 0.05]], CH, null, 0.006);
        D2.band([[-1.55, 0.95], [0.8, 0.95], [0.8, 1], [-1.55, 1]], CH, null, 0.006);
        D2.band([[0.8, 0.9], [0.8, 1], [1.24, 1], [1.24, 0.15]], CH, null, 0.006);
        for (const [x0, x1] of [[0.05, 0.18], [-0.55, -0.42]]) D2.band([[x0, 0.05], [x1, 0.05], [x1, 0.95], [x0, 0.95]], B, null, 0.008);
        for (const x0 of [0.18, 0.032, -0.42, -0.568, -1.55]) D2.band([[x0, 0.05], [x0 + 0.018, 0.05], [x0 + 0.018, 0.95], [x0, 0.95]], CH, null, 0.006);
        // the rear window narrowed by the vinyl (a formal roof: the broad C-pillars run onto the boot); a chrome bar at the vinyl's front edge
        for (const [z0, z1] of [[-0.82, -0.312], [-0.312, 0.312], [0.312, 0.82]]) D2.top([[-0.565, z0], [-0.55, z0], [-0.55, z1], [-0.565, z1]], CH, 0.006);
        for (const sd of [-1, 1]) { D2.top([[-2.2, sd * 0.6], [-1.82, sd * 0.5], [-1.82, sd * 0.82], [-2.2, sd * 0.92]], VIN, 0.008);
          D2.top([[-2.2, sd * 0.585], [-1.82, sd * 0.485], [-1.82, sd * 0.5], [-2.2, sd * 0.6]], CH, 0.008); }   // (its chrome edges)
        // the doors' shut lines, the chrome sills between the arches, a chrome line along the flanks, the side marker lamps
        for (const x of [1.226, 0.182, -0.548, -1.548]) D2.side([[x, 0.3], [x + 0.012, 0.3], [x + 0.012, 0.97], [x, 0.97]], DK, null, 0.004);
        D2.side([[XA + 0.04, 0.345], [XB - 0.04, 0.345], [XB - 0.04, 0.41], [XA + 0.04, 0.41]], CH, null, 0.006);
        D2.side([[-2.99, 0.6], [3.0, 0.6], [3.0, 0.622], [-2.99, 0.622]], CH, null, 0.006);
        D2.side([[2.84, 0.66], [2.95, 0.66], [2.95, 0.7], [2.84, 0.7]], AMB, null, 0.006); D2.side([[-2.95, 0.68], [-2.84, 0.68], [-2.84, 0.72], [-2.95, 0.72]], RED, null, 0.006);
        // the door handles (chrome)
        for (const sd of [-1, 1]) { const f = sd < 0 ? '-z' : 'z', s = sd < 0 ? 'L' : 'R';
          K.rect(0.33, 0.83, sd * 0.979, 0.17, 0.035, CH, { dir: f, host: 'door' + s });
          K.rect(-1.42, 0.83, sd * 0.979, 0.17, 0.035, CH, { dir: f, host: 'door2' + s }); }
        // the mirrors (small, chrome), the wipers on the windscreen's foot
        for (const sd of [-1, 1]) K.mirror(1.1, 1.0, sd * 0.975, { col: CH, arm: CH, w: 0.07, h: 0.075, d: 0.09 });
        for (const z of [-0.4, 0.3]) K.bar([1.21, 1.045, z - 0.28], [1.19, 1.065, z + 0.28], 0.009, B, { n: 4, part: 'body' });
        // ---- the nose: a dark band across the face, the egg-crate grille (chrome) in it between four round lamps; a chrome lip over it ----
        K.rect(3.043, 0.665, 0, 1.74, 0.21, DK);
        K.grille(3.047, 0.665, 0, 0.84, 0.25, { col: [0.03, 0.03, 0.035], slats: 4, slatCol: CH, slatH: 0.016, frame: CH, frameH: 0.026 });
        for (let i = -3; i <= 3; i++) K.rect(3.052, 0.665, i * 0.105, 0.014, 0.22, CH);
        for (const sd of [-1, 1]) { K.rect(3.051, 0.665, sd * 0.425, 0.022, 0.27, CH); for (const z of [0.575, 0.765]) K.headLamp(3.047, 0.665, sd * z, 0.07); }
        K.rect(3.043, 0.81, 0, 1.72, 0.022, CH, { part: 'body' });
        // ---- the bumpers: chrome bars swept round the corners, the overriders, the indicators, the plates (blank) ----
        const prof = [[0.035, -0.08], [-0.02, -0.08], [-0.035, -0.055], [-0.035, 0.055], [-0.02, 0.08], [0.035, 0.08]];   // (u in: toward the car)
        const bar = (sx, half) => { const p = half.map(([x, z]) => [sx * x, 0.415, -z]).concat(half.slice().reverse().map(([x, z]) => [sx * x, 0.415, z])); return sx > 0 ? p : p.reverse(); };
        K.part('bumperF', () => {
          K.sweep(prof, bar(1, [[2.87, 0.972], [2.985, 0.94], [3.055, 0.8], [3.075, 0.45]]), CH, { capA: CH, capB: CH });
          for (const sd of [-1, 1]) { K.box(3.1, 0.3, sd * 0.36, 0.07, 0.27, 0.075, 0, CH); K.rect(3.108, 0.415, sd * 0.56, 0.14, 0.045, AMB); }
          K.rect(3.112, 0.415, 0, 0.44, 0.11, WH);
        });
        K.part('bumperR', () => {
          K.sweep(prof, bar(-1, [[2.88, 0.972], [2.995, 0.94], [3.065, 0.8], [3.085, 0.45]]), CH, { capA: CH, capB: CH });
          for (const sd of [-1, 1]) K.box(-3.11, 0.3, sd * 0.36, 0.07, 0.27, 0.075, 0, CH);
        });
        // ---- the tail: the lamps in chrome surrounds, a chrome bar between them, the plate, the boot lid's lip; the twin exhausts ----
        for (const sd of [-1, 1]) { K.rect(-3.051, 0.71, sd * 0.655, 0.43, 0.16, CH, { dir: '-x' }); K.tailLamp(-3.053, 0.71, sd * 0.655, 0.38, 0.11);
          K.rect(-3.082, 0.71, sd * 0.655, 0.018, 0.11, CH, { dir: '-x' });                  // (a chrome rib across the lamp)
          K.exhaust(-3.1, 0.26, sd * 0.52, 0.032, 0.3, { part: 'body' }); }
        K.rect(-3.051, 0.71, 0, 0.84, 0.04, CH, { dir: '-x' });
        K.rect(-3.052, 0.58, 0, 0.5, 0.11, WH, { dir: '-x' });
        K.rect(-3.051, 0.83, 0, 1.6, 0.02, CH, { dir: '-x', part: 'body' });
        // ---- the flags on the front wings: a chrome staff on its foot, the flag (the stripe's colour, a red band) flying back, both faces ----
        for (const sd of [-1, 1]) K.part(sd < 0 ? 'flagL' : 'flagR', () => {
          // (rippling: its three panels turned 30 degrees each way, so it shows from behind (the chase camera) as well as from the side)
          const z = sd * 0.86, x = 2.74, y0 = 0.94, xs = [x - 0.008, x - 0.11, x - 0.215, x - 0.31], zs = [0, 0.06 * sd, 0, 0.055 * sd], ys = [[1.13, 1.365], [1.122, 1.357], [1.114, 1.349], [1.106, 1.341]];
          K.cyl([x, y0 - 0.01, z], [x, y0 + 0.03, z], 0.022, CH, { n: 6 });
          K.cyl([x, y0, z], [x, 1.37, z], 0.008, CH, { n: 5, capA: null });
          K.cyl([x, 1.37, z], [x, 1.39, z], 0.014, CH, { n: 5 });
          for (let i = 0; i < 3; i++) for (let b = 0; b < 3; b++) {
            const at = (j, t) => ys[j][0] + (ys[j][1] - ys[j][0]) * (b + t) / 3;
            const q = [[xs[i], at(i, 0), z + zs[i]], [xs[i + 1], at(i + 1, 0), z + zs[i + 1]], [xs[i + 1], at(i + 1, 1), z + zs[i + 1]], [xs[i], at(i, 1), z + zs[i]]];
            K.face(q, b === 1 ? RED : S); K.face(q.slice().reverse(), b === 1 ? RED : S);
          }
        }, { noCrush: true, noDent: true, hinge: [[2.7, 0.94, sd * 0.86], [2.78, 0.94, sd * 0.86]] });
        K.hinge('hood', [1.26, 0.99, -0.8], [1.26, 0.99, 0.8]);
        K.hinge('trunk', [-2.22, 0.99, -0.8], [-2.22, 0.99, 0.8]);
        // ---- inside (seen once a part is off): the chauffeur's bench, the dashboard and the wheel, the partition (wood); the jump seats
        //      facing back, the rear bench (tan leather); the V8 under the bonnet, its radiator; the spare and a case in the boot ----
        K.seat(0.55, 0.56, 0, { w: 1.5, l: 0.5, back: 0.55, col: [0.3, 0.29, 0.28] });
        K.seat(-1.38, 0.55, 0, { w: 1.55, l: 0.58, back: 0.62, tilt: 0.3, col: TAN });
        K.inner(() => {
          K.box(1.06, 0.6, 0, 0.32, 0.32, 1.8, 0, [0.14, 0.12, 0.11], null, false, { part: 'body' });
          K.cyl([0.86, 0.86, -0.42], [0.84, 0.9, -0.42], 0.19, [0.1, 0.1, 0.11], { n: 10, part: 'body' });
          K.box(0.08, 0.34, 0, 0.06, 0.62, 1.85, 0, WOOD, null, false, { part: 'body' });
          for (const sd of [-1, 1]) { K.box(-0.2, 0.4, sd * 0.42, 0.42, 0.13, 0.5, 0, TAN, null, false, { part: 'body' }); K.box(0.0, 0.53, sd * 0.42, 0.08, 0.42, 0.5, 0, TAN, null, false, { part: 'body' }); }
          K.cyl([2.12, 0.86, 0], [2.12, 0.92, 0], 0.2, CH, { n: 10, part: 'body' });
          K.box(2.84, 0.32, 0, 0.08, 0.48, 1.5, 0, [0.12, 0.12, 0.13], null, false, { part: 'body' });
          K.box(-2.55, 0.33, -0.55, 0.5, 0.3, 0.32, 0, [0.3, 0.2, 0.12], null, false, { part: 'body' });
          K.rect(-0.8, 0.262, 0, 1.8, 1.66, [0.3, 0.07, 0.08], { dir: 'y', part: 'body' });   // (the rear compartment's carpet)
          K.rect(-2.19, 0.58, 0, 1.7, 0.66, [0.1, 0.1, 0.105], { dir: '-x', part: 'body' });  // (the boot's front wall, behind the rear bench)
          K.rect(-2.0, 0.905, 0, 0.36, 1.6, [0.2, 0.12, 0.09], { dir: 'y', part: 'body' });   // (the parcel shelf under the rear glass)
          K.rect(1.25, 0.6, 0, 1.75, 0.66, [0.1, 0.1, 0.105], { part: 'body' });             // (the firewall: the engine bay's back)
          for (const sd of [-1, 1]) K.plate([[1.75, 0.74, sd * 0.2], [2.5, 0.74, sd * 0.2], [2.5, 0.84, sd * 0.33], [1.75, 0.84, sd * 0.33]], 0.03, [0.62, 0.62, 0.64], { part: 'body' });   // (the V8's rocker covers)
        });
        K.engine(2.12, 0.38, 0, { l: 0.85, w: 0.68, h: 0.46, col: [0.3, 0.31, 0.33], cover: [0.12, 0.12, 0.13] });
        K.tyre(-2.68, 0.45, 0.28, { axis: 'y', r: 0.3, inner: true, part: 'body' });
      },
    },
  });
})();
