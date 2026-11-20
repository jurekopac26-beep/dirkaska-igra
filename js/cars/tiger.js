/* Vehicle 'tiger' — TIGER GT: a front-engined GT racer. Signature features: 1) a long bonnet with louvres over the wheels, 2) a big rear
   wing on swan-neck mounts, 3) a rear diffuser, 4) a front splitter with dive planes, 5) wide arches and centre-lock wheels. L 4.70 W
   2.05 H 1.25, wheelbase 2.70, overhangs F 1.05 R 0.95 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  // the garage's head lamp in the place of the slim lamp in the fascia's upper corner (u out from the car's middle, v up; metres round
  // z 0.66, y 0.5): every option takes this outline, in the stock lamp's black frame
  const SLIT = [[-0.15, -0.04], [0.15, -0.04], [0.15, 0.04], [-0.15, 0.04]];
  VEHICLE_DEFS.push({
    id: 'tiger', name: 'TIGER GT', cat: 'dirkalni', ord: 2, drive: 'FR',
    desc: 'Dirkalnik GT z dolgim pokrovom motorja, velikim krilom in difuzorjem.',
    phys: { mass: 1300, a: 1.3, b: 1.4, kI: 1.28, kw: 405, redline: 8000, idle: 1000, gears: [3.2, 2.08, 1.5, 1.17, 0.95, 0.8], final: 4.73, rw: 0.34, cDrag: 0.42, len: 4.7, wid: 2.05, steerMax: 0.58,
      tracK: 1.2, brakeK: 1.15, spinK: 0.25, aero: 0.00007, loose: 0.72 },
    arc: { amax: 1.9, kv: 2.6, rmin: 4.8 },
    csp: { bx: 0.14, coast: -0.044, thr: 0, liftP: 0.1, pwr: 0.06, out: 1, turn: 1.12, w: 0.98, tv: 0.75 },   // (the FR layer: lift-off and power rotation; its own liftP, pwr, out, turn, w, tv)
    stats: { power: 10, grip: 10, weight: 6, drift: 4 },
    price: 85000, pk: 'ppo', field: ['tiger'],
    snd: { kind: 'v8fp', hz: 1.05, loud: 1.2 },
    expect: { t100: [2.68, 3.15], vmax: [249, 264], latG: [2.56, 2.66], d100: [20, 22.1] },
    partNames: { splitter: 'front splitter', diffuser: 'diffuser', headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail light', tailR: 'right tail light', wiperFront: 'windscreen wiper' },
    parts: { set: 'race', ht: 1.25, y0: 0.1,
      over: {
        bumperF: { df: 0, y: 0.45 },
        // (where the look has them: the front clip up to the bonnet, the doors behind the long bonnet, the mirrors at the cowl, the boot lid
        // behind the fastback)
        doorL: { lx: -0.15, y: 0.62, h: 0.11 }, doorR: { lx: -0.15, y: 0.62, h: 0.11 }, mirrorL: { lx: 0.01, lz: -0.96, y: 0.97 }, mirrorR: { lx: 0.01, lz: 0.96, y: 0.97 },
        trunk: { lx: -0.95, y: 0.96 },
        quarterL: { h: 0.13 }, quarterR: { h: 0.13 },   // (the pieces' real thickness lying on the road: a door with its glass leaning in, a quarter with its haunch and flare)
      },
      extra: {
        splitter: { z: 0, th: 0.45, m: 3, rW: 0.42, h: 0.04, lx: 1, lz: 0, f: 0.02, df: 0.3 },
        diffuser: { z: 1, th: 0.55, m: 4, rW: 0.45, h: 0.05, lx: -0.98, lz: 0, f: 0.03, df: 0.15 },
        // (as KOLIBRI's: the slim head lamps in the fascia's corners parts of their own, mounted on the front bumper (they go with it); a hit
        // on their corner knocks one out. Each half of the tail's light band with its half of the black band likewise; the wiper)
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.18, h: 0.06, lx: 0.99, lz: -0.64, y: 0.5, on: 'bumperF' },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.18, h: 0.06, lx: 0.99, lz: 0.64, y: 0.5, on: 'bumperF' },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.4, h: 0.05, lx: -1.0, lz: -0.41, y: 0.86 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.4, h: 0.05, lx: -1.0, lz: 0.41, y: 0.86 },
        wiperFront: { z: 0, th: 0.65, m: 0.5, r: 0.45, h: 0.03, lx: 0.01, lz: -0.15, y: 0.94 },
      },
    },
    // where the garage's parts go (js/deli.js, look units): the wing on the fastback's deck, in the wing's part (in place of the wing on its
    // swan necks); the head lamps in the place of the slim lamps (every option in their outline, SLIT, in their black frame; the lens swept
    // back over the nose in the lamp's colour), in the lamps' parts; the rims. 34 of the 38 (docs/deli.md, Dirkalni): no sunroof or roof
    // scoop (the roof 0.53 m short), no boot lid (the deck under the wing), no fuel cap on a side (the quick-fill valves on the sails)
    mounts: {
      krilo: { x: -2.2, w: 0.8, part: 'wing', front: -1.9 },
      zarometi: { x: 2.332, y0: 0.5, lean: 0, zc: 0.66, yc: 0.5, s: 0.33, hosts: ['headL', 'headR'], shape: SLIT, bulge: 0, ringW: 0.008 },
      platisca: {},
      // (sklop 2 · spredaj) the kit round the nose and the tail (in place of the splitter: the options without a front piece keep it; the
      // diffuser stays), the bonnet's top from the cowl to the nose (in place of the vent), the grille in the fascia (in place of its
      // slats), the indicators on the fascia under the lamps, on the front wings ahead of the doors, on the tail under the band (none on the
      // mirrors: their stalks' housings too small); the rally lamps on the fascia, in the grille, at the roof's front edge, a pod on the nose
      aero: { xf: 2.33, xr: -2.35, w: 0.8, yf: 0.15, yr: 0.34, sill: [-1.0, 0.9], ws: 0.91, ys: 0.13, lipF: [2.155, 0.145, 0.41, 0.012, 1.96], exh: [0.84, 0.045], partF: 'splitter', partR: 'diffuser' },
      hauba: { x0: 0.12, x1: 2.0, w: 0.6, rel: true },
      maska: { x: 2.334, y0: 0.31, lean: 0, yc: 0.31, w: 0.9, h: 0.2, comb: 1.25, part: 'bumperF' },
      zmigavci: { front: { x: 2.334, y: 0.41, z: 0.66, w: 0.1, h: 0.025, part: 'bumperF' }, side: { x: 0.38, y: 0.62, z: 0.925, host: 'body' },
        rear: { x: -2.352, y: 0.62, z: 0.6, part: 'bumperR' } },
      relijske_luci: { bumper: [2.33, 0.3, 0.3], nose: [2.32, 0.56], intake: [2.334, 0.31, 0.9, 0.2], roof: [-0.62, 0.6], pod: [2.28, 0.58, 0.68, 0.62], foot: 0.34, part: 'bumperF' },
      // (sklop 2 · zadaj) the tail lamps in the place of the slim lamps in the band; the exhausts under the bumper's corners (no lid: the
      // deck under the wing 0.4 m short, the wing's feet on it); the tow points (in front where the red strap is, behind on the bumper beside the rain
      // light); the flaps behind the wheels and the sills' guards
      zadnje_luci: { x: -2.339, zc: 0.6, yc: 0.86, w: 0.14, h: 0.3, s: 0.6, shape: [[-0.2, -0.04], [-0.2, 0.04], [0.2, 0.04], [0.2, -0.04]], hosts: ['tailL', 'tailR'] },
      auspuh: { x: -2.37, y: 0.265, z: 0.84, r: 0.045, len: 0.3, part: 'body', pipeX: -1.9 },
      vlecne_kljuke: { f: [2.334, 0.22, -0.46], r: [-2.352, 0.47, 0.3] },
      lovilci_blata: { x: [0.9, -1.8], z: [0.84, 0.98], y: [0.4, 0.1], sill: [-0.96, 0.86, 0.16, 0.9], part: 'body', parts: ['fenderL', 'fenderR', 'quarterL', 'quarterR'] },
      // (sklop 2 · streha) no sunroof and no roof scoop (the roof 0.53 m short); the aerials on the roof, the louvres on the fastback's glass
      antena: { x: -0.9, z: 0.45, fin: [-1.06, 0], front: [-0.72, 0.4], whip: -0.7 },
      zaluzije: { x0: -1.8, y0: 0.9986, x1: -1.3, y1: 1.1458, w: 0.4, part: 'trunk' },
      // (sklop 2 · bok) the mirrors on their stalks, the doors (the start number on them stays; no glass of
      // the garage's: the stock windows curve with the tumblehome), the brakes, the nuts (a centre lock)
      ogledala: { x: 0.0, y: 0.95, z: 1.0, w: 0.17, h: 0.07, d: 0.12, z0: 0.92 },
      vrata: { x: [-0.92, 0.25], y: [0.33, 0.86], handle: [-0.8, 0.84, 0.92, 0.12, 0.025], win: null },
      zavore: { s: 1 }, matice: { k: 5, r: 0.2, lock: true },
      // (sklop 3 · barve) the stripes beside the stock ones over the deck, the roof and the bonnet; the decals on the doors, the front
      // wings ahead of the vents and the tail's corners, on the bonnet beside the stripes, on the roof; the sun strip in place of the
      // stock one; the calipers
      barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {},
      crte: { z: [0.29, 0.47], x: [[-2.28, -1.92], [-1.12, -0.66], [0.12, 2.2]], fit: true },
      nalepke: { side: [[-0.6, -0.21], [0.27, 0.54], [-2.3, -2.08]], y: [0.62, 0.84], hood: { x: [0.45, 1.45], z: [0.3, 0.6] }, roof: { x: [-1.1, -0.68] } },
      soncni_pas: { x: [-0.62, -0.52] },
      celjusti: { r: [0.075, 0.14], a: [70, 125] },
      // (sklop 3 · skriti deli) on the V8 behind the front axle: the filter on its left bank, the turbo on its front, the control box on
      // its top; the battery in the tail on the fuel cell (no floor under the cabin and the bay), behind the seat; the struts at the wheels, the bars on the floor
      filter_zraka: { x: 0.6, y: 0.55, z: -0.42 }, akumulator: { x: -2.08, y: 0.66, z: -0.36 }, turbo: { x: 1.14, y: 0.5, z: 0.15 }, cip: { x: 0.6, y: 0.72, z: 0.2 },
      vzmeti: { in: 0.17, top: 0.8 }, amortizerji: { in: 0.17, top: 0.72 }, stabilizatorji: { in: 0.17, floor: [0.16, 0.2] }, dim_gum: { w: 0.33 },
    },
    // the look (KIT API v1, render.js; look units = metres): one loft, the standard regions (bonnet, boot lid, fenders, doors with their
    // glass, quarters, the rear bumper; the front bumper the whole front clip, the lamps in it) and the racing parts drawn on: the splitter,
    // the dive planes on the bumper's corners, the diffuser, the wing on its swan necks. The livery: the paint, twin stripes over the top in
    // the stripe colour, the aero parts and the skirts in black carbon, the start number on the roof and on both doors (K.number)
    look: {
      body: { len: 4.7, wid: 2.05, wz: 0.19,
        //       x      w     yb    ybelt  wt    yt     cr     kind  tuck
        secs: [[-2.35, 0.90, 0.34, 0.80, 0.84, 0.96, 0.01, 'b', 0.10],    // the tail panel (the cap): the lamps across its top
          [-2.30, 0.97, 0.31, 0.84, 0.88, 0.99, 0.01, 'b', 0.10],        // the deck's trailing edge (a ducktail)
          [-1.88, 1.02, 0.22, 0.87, 0.74, 0.965, 0.01, 'gr', 0.10],      // the rear glass's foot; the haunches over the rear wheels
          [-1.15, 1.00, 0.13, 0.90, 0.60, 1.16, 0.03, 'r', 0.09],        // the roof's back edge (a long flat fastback behind it)
          [-0.62, 0.91, 0.12, 0.89, 0.62, 1.17, 0.03, 'gf', 0.09],       // the windscreen's top (the cabin narrower than the arches)
          [-0.2, 0.91, 0.126, 0.874, 0.683, 0.985, 0.0175, 'gf', 0.09],  // (the side glass ends here: the mirror sails ahead of it)
          [0.05, 0.91, 0.13, 0.865, 0.72, 0.875, 0.01, 'b', 0.09],       // the cowl (the windscreen's base, far back: the long bonnet; low under the eyes)
          [1.30, 1.00, 0.15, 0.875, 0.77, 0.89, -0.03, 'b', 0.09],       // the front axle: the bonnet sunk between the fenders' flat tops (the louvres on them)
          // (no deeper: the arch lifts this section's foot and the loft's inside point with it; a crown much under the edge turns the bonnet's edge band face down)
          [2.03, 1.00, 0.15, 0.75, 0.82, 0.77, -0.04, 'b', 0.09],
          [2.24, 0.98, 0.15, 0.645, 0.82, 0.665, -0.02, 'b', 0.09],
          [2.33, 0.93, 0.15, 0.56, 0.79, 0.58, -0.01, 'b', 0.08]],       // the nose (the cap: the fascia with the grille and the lamps)
        eye: { x: -0.85, y: 1.08, style: 'closed' },                    // (far back under the roof, over the cowl: the bonnet stretches ahead)
        door: [0.25, -0.92], bumpF: 0.3, bumpR: 0.2, bumpY: [0.72, 0.62], cage: true,
        crush: { x0: -1.72, x1: -0.37, z: 0.66 } },                     // (the roof and the fastback's glass; clear of the deck under the wing)
      hi: true,   // (Nastavitve · Detajli avtov: Visoki: the small details at the end of build, the driver, the tyres in 64)
      budget: { inner: 1400 }, budgetHi: { inner: 1750 },   // (its cabin, as KOLIBRI's: the inner block over a car's 800 / 1200; drawn only once a door opens, a pane breaks or a part is off)
      wheels: { style: 'slick', w: 0.3, wR: 0.33, gap: 0.06, seg: 32, segHi: 64 },
      // the standard regions, but the bonnet from the cowl (the windscreen's second section, at the sails, would start it there) to the front
      // clip: the nose ahead of the fenders (its top, its corners by the lamps, its fascia) is all the front bumper's
      regions: (std) => std.flatMap(r => r.part === 'hood' ? [{ part: 'bumperF', x: [2.03, 2.6], bands: ['window', 'edge', 'crown'] }, Object.assign({}, r, { x: [0.05, 2.03] })] : [r]),
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, D = K.dark, G = K.GLASS, RED = K.rgb(0xd0141a);
        // ---- the shell: the paint, the glass (windscreen, side windows, the fastback's glass), the tuck all round black (the skirts, the arches' ledges) ----
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (e === 0 || e === 8) return B;
          if (kind === 'gf') return (e === 2 || e === 6) && at.x > -0.2 ? P : e >= 2 && e <= 6 ? G : P;   // (the side glass up to the mirror sails)
          if (kind === 'r') return e === 2 || e === 6 ? G : P;
          if (kind === 'gr') return e >= 3 && e <= 5 ? G : P;
          return P;
        }, { caps: { front: { col: P, colLow: B, cut: 0.215, high: 'bumperF' }, rear: { col: P, colLow: B } } });   // (the fascia's black lip over the splitter, the rear bumper's black face)
        const D2 = L.decal, XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;
        // the livery: twin stripes over the bonnet, the roof and the deck (off the glass); the skirts black from arch to arch
        for (const s of [-1, 1]) for (const [x0, x1] of [[0.1, 2.31], [-1.12, -0.66], [-2.33, -1.92]]) D2.top([[x0, s * 0.05], [x1, s * 0.05], [x1, s * 0.2], [x0, s * 0.2]], S, 0.008);
        D2.side([[XA + 0.04, 0.1], [XB - 0.04, 0.1], [XB - 0.04, 0.3], [XA + 0.04, 0.3]], B, null, 0.005);
        D2.side([[XA + 0.04, 0.315], [XB - 0.04, 0.315], [XB - 0.04, 0.345], [XA + 0.04, 0.345]], S, null, 0.005);   // (a line in the stripe colour over them)
        // the greenhouse: the A-pillars and the B-pillar in the paint, the small quarter window's raked rear edge
        D2.band([[-0.62, 0.84], [-0.2, 0.62], [-0.2, 1], [-0.62, 1]], P, null, 0.006);
        D2.band([[-0.98, 0], [-0.92, 0], [-0.92, 1], [-0.98, 1]], P, null, 0.006);
        D2.band([[-1.16, -0.01], [-1.0, -0.01], [-1.16, 1.01]], P, null, 0.006);
        // the louvres over the front wheels (the fenders' tops), the vents behind them (the fenders' sides), the bonnet's vent
        for (let i = 0; i < 7; i++) { const x = 1.0 + i * 0.085; D2.band([[x, 0.22], [x + 0.04, 0.22], [x + 0.04, 0.88], [x, 0.88]], B, null, 0.006); }
        D2.side([[0.56, 0.44], [0.7, 0.44], [0.8, 0.7], [0.66, 0.7]], B, null, 0.006);
        K.part('hood', () => K.deli('hauba', () => {   // (the garage's bonnet in place of the vent: mounts.hauba)
          D2.top([[1.52, -0.26], [1.86, -0.26], [1.86, 0.26], [1.52, 0.26]], B, 0.014);
          for (let i = 0; i < 3; i++) { const x = 1.58 + i * 0.09; D2.top([[x, -0.24], [x + 0.03, -0.24], [x + 0.03, 0.24], [x, 0.24]], D, 0.018); } }));
        // the sun strip across the windscreen's top (the stripe colour), the louvres behind the rear wheels
        K.deli('soncni_pas', () => { for (const [z0, z1] of [[-0.6, -0.245], [-0.23, 0.23], [0.245, 0.6]]) D2.top([[-0.62, z0], [-0.55, z0], [-0.55, z1], [-0.62, z1]], S, 0.008); });   // (the garage's in its place: mounts.soncni_pas)
        for (let i = 0; i < 4; i++) { const x = -1.9 - i * 0.05; D2.side([[x - 0.025, 0.42], [x, 0.42], [x, 0.66], [x - 0.025, 0.66]], B, null, 0.006); }
        // the quick-fill valves on the sails (the C-pillars)
        D2.band([0, 1, 2, 3, 4, 5].map(i => [-1.47 + Math.cos(i * Math.PI / 3) * 0.035, 0.52 + Math.sin(i * Math.PI / 3) * 0.09]), [0.55, 0.56, 0.6], null, 0.008);
        // the start number on the doors
        for (const s of [-1, 1]) K.number(-0.38, 0.56, s * 0.936, 0.3, { dir: s < 0 ? '-z' : 'z', host: s < 0 ? 'doorL' : 'doorR' });
        // ---- the nose: the fascia's big grille, the brake ducts, the slim lamps in black at its upper corners (with the fascia), the stripes
        //      on down to the grille, the tow strap ----
        K.deli('maska', () => K.grille(2.334, 0.31, 0, 0.92, 0.22, { slats: 3, host: 'bumperF' }));   // (the garage's grille in its place: mounts.maska)
        for (const s of [-1, 1]) {
          K.rect(2.334, 0.28, s * 0.74, 0.22, 0.13, B, { host: 'bumperF' });
          K.rect(2.336, 0.4925, s * 0.125, 0.15, 0.145, S, { host: 'bumperF' });
        }
        // (the lamps parts of their own, on the bumper: headL, headR; the garage's in their place and in their frame: K.deli, mounts.zarometi;
        // the lens swept back over the nose in its colour: DELI.lampLook)
        K.deli('zarometi', () => { for (const s of [-1, 1]) K.headLamp(2.338, 0.5, s * 0.66, 0.04, { shape: 'rect', w: 0.3, h: 0.08, ring: B, host: s < 0 ? 'headL' : 'headR' }); }, (zn) => {
          const LK = zn && typeof DELI !== 'undefined' ? DELI.lampLook(zn) : null;
          for (const s of [-1, 1]) { const h = s < 0 ? 'headL' : 'headR';
            if (zn) K.box(2.326, 0.448, s * 0.66, 0.02, 0.104, 0.324, 0, B, null, false, { host: h });   // (the stock lamp's frame round the garage's)
            D2.top([[2.24, s * 0.5], [2.33, s * 0.5], [2.33, s * 0.79], [2.24, s * 0.8]], LK ? LK.col : [0.78, 0.8, 0.84], 0.008, { host: h }); } });   // (the lens swept back over the nose)
        K.deli('vlecne_kljuke', () => K.rect(2.336, 0.22, -0.46, 0.05, 0.07, RED, { host: 'bumperF' }));   // (the tow strap; the garage's tow points in its place and behind: mounts.vlecne_kljuke)
        // the dive planes on the bumper's corners (two a side, their trailing edges up: thin, a face over and one under)
        const fin = (pts, col, o) => { K.face(pts, col, o); K.face(pts.slice().reverse().map(p => [p[0], p[1] - 0.01, p[2]]), col, o); };
        K.part('bumperF', () => { for (const s of [-1, 1]) for (const [x0, y0, x1, y1] of [[2.31, 0.41, 2.14, 0.46], [2.33, 0.28, 2.15, 0.34]]) {
          const q = [[x0, y0, s * 0.92], [x1, y1, s * 0.97], [x1, y1, s * 1.025], [x0, y0, s * 1.0]]; fin(s < 0 ? q.slice().reverse() : q, B);
        } }, { hinge: [[2.1, 0.6, -0.85], [2.1, 0.6, 0.85]] });
        // the splitter under the nose (its top, its underside, its leading edge)
        K.part('splitter', () => K.deli('aero', () => { const q = [[1.95, 0.15, -0.98], [1.95, 0.15, 0.98], [2.31, 0.15, 0.98], [2.36, 0.15, 0.86], [2.36, 0.15, -0.86], [2.31, 0.15, -0.98]];
          fin(q, B); K.rect(2.36, 0.145, 0, 1.72, 0.01, B); }), { hinge: [[1.95, 0.14, -0.9], [1.95, 0.14, 0.9]] });
        // ---- the tail: a black band with the slim lamps across its top, the rain light, the exhausts under the bumper's corners, the ducktail's lip ----
        for (const s of [-1, 1]) { const tp = s < 0 ? 'tailL' : 'tailR', z0 = s < 0 ? -0.83 : 0, z1 = z0 + 0.83;   // (each half of the band with its lamp a part of its own; its top 4 mm further back: the piece on the road has a volume)
          K.face([[-2.352, 0.81, z0], [-2.352, 0.81, z1], [-2.356, 0.91, z1], [-2.356, 0.91, z0]], B, { host: tp }); }
        K.deli('zadnje_luci', () => { for (const s of [-1, 1]) K.tailLamp(-2.355, 0.86, s * 0.6, 0.4, 0.05, { host: s < 0 ? 'tailL' : 'tailR' }); });   // (the garage's in their place, in the band: mounts.zadnje_luci)
        K.deli('auspuh', () => { for (const s of [-1, 1]) K.exhaust(-2.37, 0.25, s * 0.84, 0.045, 0.3, { n: 6, col: [0.5, 0.47, 0.44], part: 'body' }); });   // (the garage's: mounts.auspuh)
        K.rect(-2.352, 0.47, 0, 0.14, 0.05, RED, { dir: '-x', host: 'bumperR' });
        K.box(-2.335, 0.975, 0, 0.03, 0.03, 1.6, 0, B, null, false, { part: 'trunk' });
        // the diffuser: the ramp up to the tail, its fins (thin: a face either side)
        K.part('diffuser', () => {
          K.face([[-1.86, 0.12, 0.74], [-2.36, 0.33, 0.74], [-2.36, 0.33, -0.74], [-1.86, 0.12, -0.74]], B);   // (its underside: seen from behind)
          for (const z of [-0.72, -0.36, 0, 0.36, 0.72]) { const q = [[-1.92, 0.115, z], [-2.37, 0.335, z], [-2.37, 0.115, z]]; K.face(q, B); K.face(q.slice().reverse(), B); }
        }, { hinge: [[-1.86, 0.12, -0.7], [-1.86, 0.12, 0.7]] });
        // ---- the wing: the main plane (an airfoil, its trailing edge raised: black carbon, it reads over the deck from the chase camera) and a flap
        //      over it (the stripe colour), the endplates (the paint), the swan necks over its leading edge ----
        K.part('wing', () => K.deli('krilo', () => {   // (the garage's wing in its place: K.deli, mounts.krilo)
          const AF = [[-2.03, 1.18], [-2.05, 1.202], [-2.13, 1.216], [-2.25, 1.225], [-2.35, 1.232], [-2.352, 1.223], [-2.25, 1.204], [-2.13, 1.185], [-2.05, 1.173]];
          K.skin([-0.9, 0.9].map(z => AF.map(([x, y]) => [x, y, z])), B);   // (its ends in the endplates)
          K.wingPlank(-2.27, 1.24, -2.36, 1.262, 0.012, -0.9, 0.9, S);
          for (const s of [-1, 1]) {
            const ep = [[-2.0, 1.11, s * 0.905], [-2.37, 1.12, s * 0.905], [-2.37, 1.28, s * 0.905], [-2.04, 1.255, s * 0.905]]; K.face(ep, P); K.face(ep.slice().reverse(), P);   // (thin: a face either side)
            const path = [[-1.95, 0.955], [-1.985, 1.16], [-2.03, 1.242], [-2.095, 1.252], [-2.16, 1.216]], wd = [0.075, 0.06, 0.05, 0.048, 0.055], t = 0.013;
            K.skin(path.map((p, i) => { const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)], tl = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / tl, ny = (b[0] - a[0]) / tl, h = wd[i] / 2;
              return [[p[0] + nx * h, p[1] + ny * h, s * 0.42 - t], [p[0] + nx * h, p[1] + ny * h, s * 0.42 + t], [p[0] - nx * h, p[1] - ny * h, s * 0.42 + t], [p[0] - nx * h, p[1] - ny * h, s * 0.42 - t]]; }), B);   // (its ends in the deck and the wing)
          }
        }), { noCrush: true, noDent: true, hinge: [[-1.95, 0.97, -0.42], [-1.95, 0.97, 0.42]] });
        // ---- the wide arches' lips (in the fenders and the quarters) ----
        for (const s of [-1, 1]) { K.flare(K.fx, 0.4, 0.45, s * 0.975, s * 1.025, P, { n: 5 }); K.flare(K.rx, 0.4, 0.45, s * 0.985, s * 1.025, P, { n: 5 }); }
        // ---- the mirrors (black, on stalks from the doors' tops), the wiper ----
        K.deli('ogledala', () => { for (const s of [-1, 1]) K.mirror(0.0, 0.95, s * 1.0, { w: 0.17, h: 0.07, d: 0.12, col: B, arm: B, z0: s * 0.92, crack: 1 }); });   // (crack: its glass breaks, it folds in: Razbijanje · nov način; the garage's: mounts.ogledala)
        for (const s of [-1, 1]) {
          K.bar([0.05, 0.872, s * 0.905], [0.01, 0.935, s * 0.96], 0.016, B, { n: 4, part: s < 0 ? 'mirrorL' : 'mirrorR' }); }
        K.bar([0.04, 0.935, -0.52], [0.0, 0.95, 0.22], 0.01, B, { n: 4, part: 'wiperFront' });
        K.part('trunk', () => K.deli('zaluzije', () => {}));   // (the garage's louvres on the glass: none stock)
        K.part('body', () => K.deli('antena', () => {}));   // (the garage's aerials on the roof: none stock)
        for (const id of ['zmigavci', 'relijske_luci', 'lovilci_blata', 'vrata', 'crte', 'nalepke', 'celjusti']) K.deli(id, () => {});   // (stock: none)
        // ---- the hinges: the bonnet at the cowl, the boot lid at the rear glass, the doors at their front edges, the bumpers at their tops ----
        K.hinge('hood', [0.07, 0.885, -0.6], [0.07, 0.885, 0.6]);
        K.hinge('trunk', [-1.9, 0.965, -0.6], [-1.9, 0.965, 0.6]);
        for (const s of [-1, 1]) K.hinge(s < 0 ? 'doorL' : 'doorR', [0.25, 0.25, s * 0.93], [0.25, 0.85, s * 0.93]);
        K.hinge('bumperR', [-2.2, 0.6, -0.85], [-2.2, 0.6, 0.85]);
        // ---- Visoki (Nastavitve · Detajli avtov; the player's and the showroom's car on a computer): the small details. A generic badge
        //      on the nose and on the tail; the bonnet's pins and its shut lines, the deck's; the doors' shut lines and pull handles; the
        //      lamps' cells; the identity lights behind the side windows; the jacking points' arrows on the skirts; the tow point's
        //      arrow; the driver at the wheel ----
        if (K.hi) {
          const C = K.cab, CH = K.chrome, LR = (n, s) => n + (s < 0 ? 'L' : 'R'), pr = (x, k) => L.prop(x, k), F = K.fitted;   // (F: a garage part in a detail's place: none of it there)
          if (!F.maska) C.badge(2.337, 0.495, 0, 1, 'bumperF', 0.03);
          C.badge(-2.353, 0.7, 0, -1, 'bumperR');
          if (!F.hauba) K.part('hood', () => { for (const s of [-1, 1]) {
            D2.top([0.12, 2.0, 2.0, 0.12].map((x, i) => [x, s * (pr(x, 'wt') - (i < 2 ? 0.012 : 0.02))]), D, 0.004);   // (its shut lines along the fenders' tops)
            for (const x of [0.3, 1.9]) { const z = s * (pr(x, 'wt') - 0.1), hex = (r) => [0, 1, 2, 3, 4, 5].map(i => [x + Math.cos(i * Math.PI / 3) * r, z + Math.sin(i * Math.PI / 3) * r]);
              D2.top(hex(0.026), CH, 0.006); D2.top(hex(0.011), B, 0.008); } } });   // (its pins)
          K.part('trunk', () => { for (const s of [-1, 1]) D2.top([-2.28, -1.92, -1.92, -2.28].map((x, i) => [x, s * (pr(x, 'wt') - (i < 2 ? 0.012 : 0.02))]), D, 0.004); });
          for (const s of [-1, 1]) { const door = LR('door', s);
            for (const x of [0.238, -0.92]) D2.side([[x, 0.33], [x + 0.012, 0.33], [x + 0.012, 0.86], [x, 0.86]], D, [s], 0.004, { host: door });
            if (!F.vrata) K.box(-0.8, 0.826, s * (pr(-0.8, 'w') + 0.008), 0.11, 0.016, 0.014, 0, [0.12, 0.12, 0.13], null, false, { host: door });
            if (!F.zarometi) for (const dz of [-0.075, 0.075]) K.rect(2.3405, 0.5, s * 0.66 + dz, 0.008, 0.066, B, { host: LR('head', s) });   // (the lamp's three cells)
            for (let i = 0; i < 3; i++) D2.band([[-1.0, 0.3 + i * 0.18], [-0.975, 0.3 + i * 0.18], [-0.975, 0.4 + i * 0.18], [-1.0, 0.4 + i * 0.18]], i === 1 ? [0.95, 0.7, 0.15] : [0.25, 0.9, 0.4], [s], 0.008);   // (the identity lights on the B-pillar)
            if (!F.aero) for (const x of [XA + 0.2, XB - 0.2]) D2.side([[x - 0.035, 0.205], [x + 0.035, 0.205], [x, 0.27]], S, [s], 0.007);   // (the jacking points)
          }
          if (!F.vlecne_kljuke) K.face([[2.3365, 0.3, -0.46], [2.3365, 0.3, -0.42], [2.3365, 0.265, -0.44]].reverse(), RED, { host: 'bumperF' });   // (the arrow over the tow strap)
          K.driver(-0.95, 0.98, -0.38, { inner: true, r: 0.12, lean: 0.17, hands: [-0.47, 0.79, 0.14], feet: [-0.06, 0.2, 0.11], suit: [0.14, 0.16, 0.2], helmet: [0.93, 0.93, 0.9] });
        }
        // ---- inside (the inner block: seen once a door opens, a pane breaks or a part is off; K.cab's pieces, docs/avti-kolibri.md): a
        //      racing cabin. The bare floor with the tunnel up the middle, the firewall, the bulkhead behind the seat; the bucket seat with
        //      its harness (left), the wheel on its long column, the dash with the logger's display and the switch panel, the sequential
        //      lever on the tunnel, the pedals, the extinguisher and the control box on the passenger's floor, the doors' bare panels with
        //      their pull straps; the cage. The V8 behind the front axle (its plenum, the strut towers and their brace), the radiator on its
        //      support behind the grille with the crash bar, the fuel cell under the deck behind the tail's panel ----
        { const C = K.cab, IN = C.IN, FL = [0.3, 0.31, 0.33], FL2 = [0.22, 0.23, 0.25], CB = [0.07, 0.07, 0.075], AL = [0.6, 0.61, 0.64], SX = -0.9, SZ = -0.38;
          K.face([[-1.5, 0.135, 0.8], [0.12, 0.135, 0.8], [0.12, 0.135, -0.8], [-1.5, 0.135, -0.8]], FL, IN);
          K.box(-0.66, 0.13, 0, 1.56, 0.17, 0.2, 0, FL2, FL, true, IN);
          C.face([[0.12, 0.13, -0.6], [0.12, 0.13, 0.6], [0.1, 0.86, 0.6], [0.1, 0.86, -0.6]], FL2, [-1, 0, 0]);   // (the firewall: across, and out to the doors' front edges)
          for (const s of [-1, 1]) C.face([[0.12, 0.13, s * 0.6], [0.28, 0.13, s * 0.93], [0.28, 0.86, s * 0.93], [0.1, 0.86, s * 0.6]], K.shade(FL2, 0.85), [-1, 0, -s * 0.5]);
          C.face([[-1.46, 0.13, -0.86], [-1.46, 0.13, 0.86], [-1.5, 0.9, 0.8], [-1.5, 0.9, -0.8]], FL2, [1, 0, 0]);
          C.dash({ x: -0.28, y: 0.855, d: 0.33, w: 0.8, dz: SZ, sz: 0.1, style: 'race', col: CB, col2: [0.1, 0.1, 0.11] });
          C.steer({ c: [-0.45, 0.77, SZ], ax: [0.94, -0.34], r: 0.15, rr: 0.016, to: [-0.26, 0.7, SZ] });
          C.seat(SX, 0.2, SZ, { w: 0.42, top: 0.79, lean: 0.12, shell: true, belt: 'harness', col: [0.06, 0.06, 0.065], col2: [0.13, 0.13, 0.14], strap: RED });
          C.console(-0.56, 0.3, { seq: true, brake: false, l: 0.3, knob: RED });
          C.pedals(0.0, 0.15, SZ, 3);
          K.cyl([-0.62, 0.21, 0.36], [-0.98, 0.21, 0.36], 0.07, RED, { n: 6, inner: true, part: 'body', capA: [0.12, 0.12, 0.13] });   // (the extinguisher on the passenger's floor, its valve forward)
          K.box(-0.2, 0.14, 0.42, 0.26, 0.07, 0.2, 0, AL, [0.5, 0.51, 0.54], true, IN);   // (the control box, its plugs)
          for (const dz of [-0.05, 0.05]) K.box(-0.36, 0.155, 0.42 + dz, 0.06, 0.04, 0.05, 0, C.BLK, null, true, IN);
          for (const s of [-1, 1]) C.door(s, { x: [-0.86, 0.2], y: [0.36, 0.84], z: 0.87, strap: RED, col: [0.16, 0.16, 0.17] });
          const hoop = (s) => [[[-1.32, 0.17, s * 0.8], [-1.32, 0.86, s * 0.86]], [[-1.32, 0.86, s * 0.86], [-1.3, 1.08, s * 0.52]], [[-1.3, 1.08, s * 0.52], [-0.68, 1.11, s * 0.55]],
            [[-0.68, 1.11, s * 0.55], [-0.24, 0.62, s * 0.78]], [[-1.32, 0.45, s * 0.84], [-0.26, 0.5, s * 0.8]]];   // (the main hoop, the roof and A-pillar bars, the door bars)
          K.cage(hoop(-1).concat(hoop(1), [[[-1.3, 1.08, -0.52], [-1.3, 1.08, 0.52]], [[-1.32, 0.17, 0.8], [-1.3, 1.08, -0.52]]]), 0.022, null, { n: 4 });
          K.engine(0.72, 0.22, 0, { l: 0.72, w: 0.62, h: 0.5, col: AL });
          K.box(0.72, 0.72, 0, 0.5, 0.06, 0.36, 0, CB, [0.11, 0.11, 0.12], true, IN);   // (the plenum over the vee, carbon)
          for (const s of [-1, 1]) K.cyl([1.3, 0.6, s * 0.6], [1.3, 0.68, s * 0.6], 0.09, FL2, { n: 6, inner: true, part: 'body', capB: AL });   // (the strut towers' tops)
          K.bar([1.3, 0.69, -0.6], [1.3, 0.69, 0.6], 0.016, AL, { n: 4, inner: true, part: 'body' });   // (the brace across them)
          K.box(0.3, 0.6, -0.5, 0.08, 0.12, 0.1, 0, [0.9, 0.82, 0.4], [0.12, 0.12, 0.13], true, IN);   // (the brake fluid's reservoir on the firewall)
          C.nose({ x: 2.06, w: 0.7, y: [0.19, 0.5], rad: [1.18, 0.36], bar: 2.19, barW: 1.5 });
          K.box(-1.97, 0.36, 0, 0.36, 0.3, 0.9, 0, [0.26, 0.26, 0.28], null, false, { inner: true, part: 'body' });   // (the fuel cell, ahead of the tail's panel)
          K.cyl([-1.9, 0.66, 0.2], [-1.9, 0.7, 0.2], 0.05, AL, { n: 6, inner: true, part: 'body', capB: [0.75, 0.1, 0.08] });   // (its filler's cap)
          C.tail({ x: -2.19, w: 0.8, y: [0.36, 0.72], bar: -2.25, barW: 1.5 }); }
        for (const id of ['filter_zraka', 'akumulator', 'turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum']) K.deli(id, () => {});   // (the hidden parts: none stock)
      },
    },
  });
})();
