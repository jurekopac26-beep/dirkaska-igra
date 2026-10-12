/* Vehicle 'skorpijon' — ŠKORPIJON H: a 2010s hybrid hypercar. Signature features: 1) a low teardrop canopy over the cabin, 2) exhausts
   exiting at the top of the engine cover, 3) a long tail with an active rear wing, 4) deep side intakes behind the doors, 5) a front
   splitter and big front air ducts. L 4.70 W 1.98 H 1.12, wheelbase 2.73, overhangs F 0.92 R 1.05 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'skorpijon', name: 'ŠKORPIJON H', cat: 'super', ord: 2, drive: 'AWD',
    desc: 'Hibridni hiperšportnik: izpuha na vrhu, nizka kabina, krila ga držijo ob cesti.',
    phys: { mass: 1550, a: 1.43, b: 1.3, kI: 1.3, kw: 680, redline: 9000, idle: 1000, gears: [3.3, 2.5, 2, 1.66, 1.42, 1.24, 1.1], final: 3.19, rw: 0.34, cDrag: 0.33, len: 4.7, wid: 1.98, steerMax: 0.58,
      tracK: 1.25, brakeK: 1.15, spinK: 0.2, aero: 0.00004, loose: 0.8, aiGap: 7.5, aiPass: 4 },   // (aiGap / aiPass: its AI follows further back and passes wider: fewer pile-ups on the Nordschleife, tests/fleet.test.js 8b)
    arc: { amax: 1.88, kv: 2.2, rmin: 4.8 },
    csp: { bx: 0.12, coast: -0.08, thr: -0.015, liftP: 0, pwr: 0.03, out: 0.95, turn: 1.1, w: 0.98 },   // (the AWD layer: steady, straightens quickly; its own turn, w)
    stats: { power: 10, grip: 10, weight: 4, drift: 4 },
    price: 150000, pk: 'unl', field: ['skorpijon'],
    snd: { kind: 'hybrid', hz: 1, loud: 1.1 },
    expect: { t100: [2.07, 2.43], vmax: [302, 321], latG: [2.48, 2.58], d100: [20.2, 22.3] },
    parts: { set: 'race', ht: 1.12, y0: 0.14, over: { hood: { lx: 0.72 }, trunk: { y: 0.9 }, quarterL: { h: 0.14 }, quarterR: { h: 0.14 }, doorL: { h: 0.15 }, doorR: { h: 0.15 } } },   // (where the look has them: the front lid from the cowl to the nose's step, the engine cover on top; the quarters with the haunches' shoulders and the doors with the canopy's side glass lie as thick as they are)
    // the look (KIT API v1, render.js; look units = metres): one loft, the body and the canopy in one: the fenders' crests over the front
    // wheels with the bonnet's valley between them, the canopy (windscreen, side glass, the carbon roof, the rear glass) narrowing back to
    // the engine cover's spine between the haunches, the body pinched behind the doors (the side intakes' black mouths face forward); the
    // standard regions (race) cut it into the parts: the front lid (hood), the engine cover (trunk), the doors with their glass, the fenders,
    // the quarters with the haunches, the nose and the tail (bumpers). On top: the nose's ducts and lamps, the splitter, the top-exit
    // exhausts, the active wing on its struts (wing), the light bar, the diffuser. Livery: the paint, carbon below and on the roof, a pin line
    look: {
      body: { len: 4.7, wid: 1.98, roofY: 1.12, wz: 0.16,
        //       x      w      yb     ybelt  wt     yt     cr     kind  tuck
        secs: [[-2.35, 0.83, 0.38, 0.76, 0.78, 0.88, 0, 'b', 0.05],      // the tail's face: the light bar, the black mesh under it
          [-2.27, 0.9, 0.32, 0.81, 0.82, 0.91, 0, 'b', 0.06],
          [-2.05, 0.955, 0.22, 0.83, 0.8, 0.91, 0.03, 'b', 0.08],      // the tail's deck: the spine fades into it
          [-1.8, 0.98, 0.16, 0.82, 0.7, 0.89, 0.06, 'b', 0.08],
          [-1.3, 0.99, 0.15, 0.8, 0.66, 0.88, 0.1, 'b', 0.08],          // the rear axle: the haunches (window band), the engine cover's spine
          [-0.85, 0.985, 0.15, 0.76, 0.62, 0.86, 0.15, 'gr', 0.08],     // the haunch's front (the intake's back wall); the rear glass's foot
          [-0.55, 0.84, 0.15, 0.73, 0.58, 0.83, 0.23, 'r', 0.08],       // the roof's rear edge; the intake's deepest point
          [-0.42, 0.89, 0.15, 0.72, 0.62, 0.83, 0.26, 'r', 0.08],       // the door's rear edge
          [-0.2, 0.895, 0.15, 0.72, 0.65, 0.84, 0.28, 'r', 0.08],        // the roof's peak
          [0.1, 0.9, 0.15, 0.72, 0.66, 0.84, 0.26, 'gf', 0.08],         // the windscreen's top
          [0.95, 0.915, 0.16, 0.72, 0.78, 0.78, 0.04, 'b', 0.08],       // the windscreen's base (the cowl: its glass's corners tilted away from the driver)
          [1.43, 0.985, 0.16, 0.76, 0.86, 0.86, -0.03, 'b', 0.08],      // the front axle: the fenders' crests, the bonnet's valley between them (shallow
          [2.0, 0.94, 0.15, 0.6, 0.84, 0.7, -0.07, 'b', 0.07],           //  over the arch: a deeper one there would face its panels down), deeper ahead
          [2.18, 0.9, 0.15, 0.53, 0.81, 0.6, -0.05, 'b', 0.06],         // the bonnet's leading edge: the lamps in its face
          [2.2, 0.895, 0.15, 0.42, 0.8, 0.48, -0.03, 'b', 0.06],
          [2.35, 0.8, 0.2, 0.36, 0.73, 0.42, -0.01, 'b', 0.05]],       // the nose's face: the ducts, the splitter under it
        eye: { x: -0.36, y: 0.92, near: 0.2, tilt: 0.06, style: 'closed' },   // (low in the canopy)
        door: [0.95, -0.42], bumpF: 0.15, bumpR: 0.3, bumpY: [0.58, 0.62],    // (the lower nose ahead of the bonnet's edge the front clip; the tail's lower half the rear one)
        engRear: true, crush: { x0: -0.7, x1: 0.3, z: 0.56 } },               // (the V8 behind the seats; only the canopy's roof crushes)
      wheels: { style: 'std', spokes: 10, w: 0.25, wR: 0.31, rim: [0.12, 0.12, 0.13], cap: [0.8, 0.81, 0.84], gap: 0.05 },   // (black rims, the silver centre lock)
      // the standard regions, the front clip also taking the lower nose's top (ahead of the bonnet's leading edge), the doors the canopy's
      // side glass (its edge band, behind the windscreen's top)
      regions: (std) => { const i = std.findIndex(r => r.part === 'hood');
        return std.slice(0, i).concat([{ part: 'bumperF', x: [2.2, 3], bands: ['window', 'edge', 'crown'] }], std.slice(i),
          ['L', 'R'].map(sd => ({ part: 'door' + sd, x: [-0.42, 0.1], bands: ['edge'], y: [0.78, 1.2], side: sd }))); },
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, G = K.GLASS, CF = [0.11, 0.11, 0.115], DK = [0.2, 0.2, 0.22], TI = [0.7, 0.7, 0.72];
        // a flat convex polygon facing d (its winding put right whatever the order of the points)
        const fc = (pts, col, d, o) => { const [a, b, c] = pts, u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
          const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
          K.face(n[0] * d[0] + n[1] * d[1] + n[2] * d[2] < 0 ? pts.slice().reverse() : pts, col, o); };
        // ---- the shell: carbon under it all round (the sills, under the nose and the tail), the arches' ledges black; the shoulders (the window
        //      band) painted, the canopy over them: the windscreen wrapping round, the side glass in the door, the carbon roof and C-pillars, the
        //      rear glass; the intakes' mouths black ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          const x = at.x;
          if (e === 0 || e === 8) return at.arch ? B : CF;
          if (e === 1 || e === 7) return x > -0.85 && x < -0.55 ? B : P;
          if (e === 2 || e === 6) return P;                                            // (the shoulders: the fenders' tops, the cabin's, the haunches')
          if (kind === 'gf' || kind === 'gr') return G;                                // (the windscreen wrapping round, the rear glass)
          if (kind === 'r') return e === 4 || x < -0.42 ? CF : G;                      // (the side glass in the door; the roof and the C-pillars carbon)
          return P;
        }, { caps: { front: { col: P, colLow: CF, cut: 0.27, low: 'bumperF', high: 'bumperF' }, rear: { col: P, colLow: B, cut: 0.62, low: 'bumperR', high: 'body' } } });
        const D = L.decal, XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;
        // ---- the A-pillars across the wrapped glass; the intakes' lower edge and the doors' scoop into them; the doors' shut lines; the carbon
        //      skirt between the arches with a pin line over it (the stripe's colour); the vents behind the rear wheels ----
        for (const sd of [-1, 1]) D.top([[0.95, sd * 0.72], [0.1, sd * 0.23], [0.1, sd * 0.28], [0.95, sd * 0.78]], B, 0.008);   // the A-pillars
        D.side([[-0.85, 0.2], [-0.55, 0.2], [-0.55, 0.46], [-0.85, 0.34]], P, null, 0.006);   // (the intakes' mouths: their lower edge rising to the door)
        D.side([[0.9, 0.32], [-0.55, 0.46], [-0.55, 0.66], [0.9, 0.37]], CF, null, 0.005);   // the doors' carbon scoop sweeping back into the intakes
        D.side([[-0.43, 0.2], [-0.415, 0.2], [-0.415, 0.76], [-0.43, 0.76]], B, null, 0.008);
        D.side([[0.945, 0.2], [0.96, 0.2], [0.96, 0.76], [0.945, 0.76]], B, null, 0.008);
        D.side([[XA, 0.2], [XB, 0.2], [XB, 0.3], [XA, 0.3]], CF, null, 0.006);
        D.side([[XA, 0.303], [XB, 0.303], [XB, 0.316], [XA, 0.316]], S, null, 0.006);
        D.side([[-1.74, 0.46], [-2.03, 0.5], [-2.03, 0.68], [-1.79, 0.68]], B, null, 0.006);
        // ---- the nose: the splitter under it, the big ducts and the middle one in its face; the slim lamps in the bonnet's leading edge, its two ducts ----
        K.part('bumperF', () => {
          K.box(2.14, 0.13, 0, 0.48, 0.022, 1.64, 0, B);
          for (const sd of [-1, 1]) fc([[2.353, 0.37, sd * 0.31], [2.353, 0.385, sd * 0.72], [2.353, 0.235, sd * 0.68], [2.353, 0.22, sd * 0.31]], B, [1, 0, 0]);
          fc([[2.353, 0.33, -0.22], [2.353, 0.33, 0.22], [2.353, 0.215, 0.2], [2.353, 0.215, -0.2]], B, [1, 0, 0]);
        }, { hinge: [[2.2, 0.2, -0.8], [2.2, 0.2, 0.8]] });
        for (const sd of [-1, 1]) K.headLamp(2.205, 0.53, sd * 0.62, 0.03, { shape: 'rect', w: 0.28, h: 0.05, ring: B, host: 'hood' });   // (in the bonnet's leading edge)
        for (const sd of [-1, 1]) D.top([[1.86, sd * 0.2], [2.1, sd * 0.24], [2.1, sd * 0.42], [1.86, sd * 0.46]], B, 0.006);
        // ---- the engine cover's louvres (on the spine, behind the exhausts) ----
        D.top([[-1.22, -0.17], [-1.22, 0.17], [-1.82, 0.17], [-1.82, -0.17]], B, 0.006);
        for (const x of [-1.32, -1.44, -1.56, -1.68]) D.top([[x, -0.17], [x, 0.17], [x - 0.04, 0.17], [x - 0.04, -0.17]], P, 0.01);
        // ---- the top-exit exhausts through the engine cover behind the cabin: two big titanium pipes standing proud of it (over the roof's
        //      line seen from the front and the rear), their carbon collars (the engine's: they stay when the cover goes) ----
        for (const sd of [-1, 1]) K.part('body', () => {
          K.cyl([-0.95, 0.9, sd * 0.2], [-1.05, 1.09, sd * 0.2], 0.09, TI, { n: 8, capA: null, capB: B });   // (their mouths' top edge at 1.13)
          K.cyl([-0.985, 0.966, sd * 0.2], [-1.012, 1.018, sd * 0.2], 0.12, CF, { n: 8, capA: null, capB: CF });
        });
        // ---- the active wing raised on its struts over the tail (never crushed, never dented) ----
        K.part('wing', () => {
          K.wingPlank(-2.06, 1.03, -2.36, 1.07, 0.028, -0.8, 0.8, CF);
          for (const sd of [-1, 1]) {
            K.box(-2.2, 0.93, sd * 0.36, 0.16, 0.115, 0.035, 0, B);
            K.endplate([[-2.05, 1.02], [-2.37, 1.055], [-2.38, 1.1], [-2.08, 1.07]], sd * 0.815, 0.012, CF);
          }
        }, { noCrush: true, noDent: true });
        // ---- the tail: the light bar right across (the lit lenses are the tail mesh), the mesh in the bumper, the diffuser with its strakes ----
        K.rect(-2.352, 0.82, 0, 1.56, 0.1, B, { dir: '-x', part: 'body' });
        for (const sd of [-1, 1]) K.tailLamp(-2.354, 0.82, sd * 0.4, 0.76, 0.05);
        K.grille(-2.352, 0.52, 0, 1.36, 0.18, { dir: -1, slats: 4, col: B, slatCol: CF, slatH: 0.018, part: 'bumperR' });
        K.part('bumperR', () => {   // (the diffuser a ramp under the tail, rising with it to its face; the strakes fins under the ramp)
          K.plate([[-1.9, 0.15, -0.75], [-1.9, 0.15, 0.75], [-2.34, 0.36, 0.75], [-2.34, 0.36, -0.75]], 0.02, B);
          for (const z of [-0.5, -0.17, 0.17, 0.5]) K.plate([[-1.95, 0.17, z], [-2.34, 0.36, z], [-2.34, 0.22, z]], 0.03, B);
        });
        // ---- the door mirrors on their stalks ----
        for (const sd of [-1, 1]) K.mirror(0.62, 0.8, sd * 0.96, { col: P, arm: B, w: 0.09, h: 0.065, d: 0.15, z0: sd * 0.8 });
        // ---- hinges: the front lid at the cowl, the engine cover at the cabin, the doors up the A-pillar (dihedral) ----
        K.hinge('hood', [0.97, 0.78, -0.5], [0.97, 0.78, 0.5]);
        K.hinge('trunk', [-0.86, 0.98, -0.4], [-0.86, 0.98, 0.4]);
        for (const sd of [-1, 1]) K.hinge(sd < 0 ? 'doorL' : 'doorR', [0.95, 0.25, sd * 0.96], [0.6, 0.95, sd * 0.7]);
        // ---- inside (seen once a part is off): the bucket seats low, the dashboard, the wheel, the tunnel, the bulkhead behind the seats; the V8
        //      behind it with the hybrid's orange cables, the front axle's electric motor and the radiators in the nose ----
        for (const sd of [-1, 1]) K.seat(-0.3, 0.33, sd * 0.34, { w: 0.46, l: 0.46, back: 0.6, tilt: 0.42, col: [0.46, 0.09, 0.07] });
        fc([[0.3, 0.56, -0.72], [0.3, 0.56, 0.72], [0.93, 0.765, 0.72], [0.93, 0.765, -0.72]], K.lining, [-0.3, 1, 0], { part: 'body' });   // the dashboard's top under the windscreen
        //   (the outer shell, one-sided, sloping to the driver; the lining's colour: matte, no clear coat's sky on it, which a dark painted
        //   face turned up this far still shows as a white glare): from the seat it closes the view under the low cowl; the glass hides it
        K.box(0.42, 0.4, 0, 0.36, 0.3, 1.36, 0, DK, null, false, { inner: true, part: 'body' });
        K.box(1.43, 0.46, 0, 0.2, 0.06, 0.3, 0, [0.95, 0.45, 0.08], null, false, { inner: true, part: 'body' });   // (the front motor's orange junction box)
        K.cyl([0.14, 0.6, -0.34], [0.17, 0.64, -0.34], 0.16, [0.06, 0.06, 0.065], { n: 6, inner: true, part: 'body' });
        K.box(0, 0.17, 0, 0.9, 0.2, 0.22, 0, DK, null, false, { inner: true, part: 'body' });
        K.box(-0.66, 0.17, 0, 0.04, 0.68, 1.5, 0, K.lining, null, false, { inner: true, part: 'body' });
        K.engine(-1.4, 0.32, 0, { l: 0.8, w: 0.62, h: 0.48, col: [0.36, 0.37, 0.4] });
        for (const sd of [-1, 1]) K.bar([-0.7, 0.3, sd * 0.3], [-1.02, 0.38, sd * 0.32], 0.02, [0.95, 0.45, 0.08], { n: 4, inner: true, part: 'body' });
        K.box(1.95, 0.18, 0, 0.18, 0.3, 1.2, 0, DK, null, false, { inner: true, part: 'body' });
        K.cyl([1.43, 0.34, -0.22], [1.43, 0.34, 0.22], 0.12, [0.4, 0.41, 0.44], { n: 6, inner: true, part: 'body' });
        for (const sd of [-1, 1]) K.box(1.43, 0.2, sd * 0.6, 0.74, 0.5, 0.04, 0, DK, null, true, { inner: true, part: 'body' });   // (the front wheels' housings: the tub's walls)
      },
    },
  });
})();
