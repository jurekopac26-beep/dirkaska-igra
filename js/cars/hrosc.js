/* Vehicle 'hrosc' — SKAKAČ 1600: a Baja-style cut-down beetle, rear air-cooled flat four. Signature features: 1) the round beetle cabin on
   a raised long-travel chassis, 2) an exo-cage over the roof and down to the bumpers, 3) cut-away short wings over big off-road tyres, 4)
   a light bar on the roof hoop, 5) the exposed engine at the rear. L 3.90 W 1.80 H 1.55, wheelbase 2.40, overhangs F 0.62 R 0.88 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  // the garage's head lamp in the place of the round lamp on each front wing's pod (its lens and chrome ring; u out from the car's middle,
  // v up; metres round z 0.69, y 0.865): every option takes this outline
  const ROUND = Array.from({ length: 12 }, (_, i) => [0.1 * Math.cos(i * Math.PI / 6), 0.1 * Math.sin(i * Math.PI / 6)]);
  VEHICLE_DEFS.push({
    id: 'hrosc', name: 'SKAKAČ 1600', cat: 'teren', ord: 3, drive: 'RR',
    desc: 'Puščavski skakač z motorjem zadaj: dolg hod vzmetenja, zunanja kletka in luči na strehi.',
    phys: { mass: 850, a: 1.33, b: 1.07, kI: 1.05, kw: 110, redline: 6000, idle: 850, gears: [3.4, 2.1, 1.42, 1], final: 4.51, rw: 0.38, cDrag: 0.5, len: 3.9, wid: 1.8, steerMax: 0.62,
      tracK: 0.95, brakeK: 0.9, spinK: 0.6, loose: 1.2, looseDrag: 0.45, landV: 18, landK: 0.5, sway: 1.5 },
    arc: { amax: 1.55, kv: 1.85, rmin: 4.6 },
    csp: { bx: 0.15, coast: -0.04, thr: 0.01, liftP: 0.2, pwr: 0.07, out: 1.3, turn: 1.08, w: 1, tv: 1.12 },   // (the RR layer: the engine behind the rear axle, a pendulum on a lift; its own out, tv)
    stats: { power: 2, grip: 4, weight: 10, drift: 9 },
    price: 16000, pk: 'ta1', field: ['hrosc'],
    snd: { kind: 'flat4', hz: 1.05, loud: 1 },
    expect: { t100: [3.36, 3.94], vmax: [174, 185], latG: [1.98, 2.08], d100: [24.8, 27.4] },
    partNames: { cover: 'engine lid', lightbar: 'light bar', roofRack: 'roof rack', headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamp', tailR: 'right tail lamp' },
    parts: { set: 'none', ht: 1.55, y0: 0.42,
      extra: {
        hood: { lx: 0.74, f: 0.41 },
        cover: { z: 1, th: 0.72, m: 6, rW: 0.36, h: 0.06, lx: -0.68, lz: 0, f: 0.45 },
        fenderL: { h: 0.135 },   // (the standard entries; the short wings lie as thick as their curl (the front ones without their lamps), the doors where they hang)
        fenderR: { h: 0.135 },
        quarterL: { lx: -0.52, lz: -0.77, y: 0.82, h: 0.13 },
        quarterR: { lx: -0.52, lz: 0.77, y: 0.82, h: 0.13 },
        doorL: { lx: 0.08, lz: -0.73, y: 0.88 },
        doorR: { lx: 0.08, lz: 0.73, y: 0.88 },
        lightbar: { z: 0, th: 0.45, m: 3, rW: 0.3, h: 0.12, lx: 0.3, lz: 0, f: 1 },
        roofRack: { z: 1, th: 0.7, m: 5, rW: 0.3, h: 0.17, lx: -0.113, lz: 0, y: 1.58 },   // (the spare and the cans on the cage)
        // (as KOLIBRI's: the round lamps on the front wings' pods parts of their own, mounted on the wings (they go with them); a hit on their
        // corner knocks one out. The tail lamps in their pods on the rear wings likewise)
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.12, h: 0.06, lx: 0.9, lz: -0.77, y: 0.865, on: 'fenderL' },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.12, h: 0.06, lx: 0.9, lz: 0.77, y: 0.865, on: 'fenderR' },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.1, h: 0.06, lx: -0.73, lz: -0.79, y: 0.86, on: 'quarterL' },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.1, h: 0.06, lx: -0.73, lz: 0.79, y: 0.86, on: 'quarterR' },
      },
    },
    // where the garage's parts go (js/deli.js, look units): the wing on the cut-down engine lid (its crown, top: a ducktail's place), in the
    // lid (it goes with it; the prototype's fin up to the rear window's louvres, front); the head lamps in the place of the round lamps on the wings' pods (every option in their outline, ROUND; the
    // dark socket with the lamp), in the lamps' parts; the rims
    mounts: {
      krilo: { x: -1.5, w: 0.4, part: 'cover', front: -1.21, top: [[-1.57, 0.38, 0.795, 0.065], [-1.5, 0.4, 0.85, 0.08], [-1.41, 0.415, 0.905, 0.095], [-1.3, 0.43, 0.955, 0.11], [-1.18, 0.44, 1.0, 0.12]] },
      zarometi: { x: 1.748, y0: 0.865, lean: 0, zc: 0.69, yc: 0.865, s: 0.4, hosts: ['headL', 'headR'], socket: 'host', shape: ROUND, bulge: 0, ringW: 0.01 },
      platisca: {},
      // (sklop 2 · spredaj, js/deli/spredaj.js) no kit (the cage's tube bumpers, the bare engine: no bumpers' faces for its lips; the
      // wheels open under the short wings), no grille (the engine at the rear); the front lid's top from the cowl to the nose (its louvres in
      // three cells along: the lid falls to the nose, bent at its sections); the
      // indicators on the nose's face, the repeaters on the front wings behind the wheels, the rear's on the engine lid's tail; the extra
      // lamps over the tube bumper, before the nose, as a bar behind the bumper, on the roof behind the hoop, in a pod on the nose
      hauba: { x0: 1.0, x1: 1.8, w: 0.4, rel: true, cells: 3 },
      zmigavci: { front: { x: 1.82, y: 0.66, z: 0.3, w: 0.1, h: 0.04, part: 'body' }, side: { x: 0.95, y: 0.76, z: 0.864, hosts: ['fenderL', 'fenderR'] },
        rear: { x: -1.57, y: 0.79, z: 0.29, part: 'cover' } },
      relijske_luci: { bumper: [1.93, 0.7, 0.3], nose: [1.82, 0.66], intake: [1.82, 0.6, 0.4, 0.03], roof: [0.3, 0.3], pod: [1.82, 0.6, 0.71, 0.6], foot: 0.632, part: 'body' },
      // (js/deli/zadaj.js) the tail lamps' room on the pods' faces (a square inside the round lamp, the lit faces just proud of the pods), the band across the engine lid's tail between them; the exhaust's tips
      // out behind the engine in the stinger's place (the silencer against the crank's pulley, the pipes from under the crankcase); no
      // lid (the front trunk's lid is the bonnet's), no flaps (the wheels open); the tow points on the cage's tube bumpers (the front
      // arrow on the nose's face, none at the rear: the bare engine)
      zadnje_luci: { x: -1.45, zc: 0.71, yc: 0.86, w: 0.14, h: 0.3, s: 0.25, shape: [[-0.035, -0.035], [0.035, -0.035], [0.035, 0.035], [-0.035, 0.035]], hosts: ['tailL', 'tailR'], bar: { x: -1.57, y: 0.8, w: 0.19, h: 0.03, part: 'cover' } },
      auspuh: { x: -1.94, y: 0.52, z: 0.2, r: 0.045, len: 0.16, part: 'body', drum: 0.45, drumX: -1.81, pipe: 0.3, pipeX: -1.62 },
      vlecne_kljuke: { f: [1.962, 0.6, 0.12], r: [-1.962, 0.36, 0.3], tube: [1.82, null], partF: 'body', partR: 'body' },
      // (js/deli/streha.js) the louvres over the small rear window (no sunroofs, scoops nor aerials: the roof rack and the cage over the roof)
      zaluzije: { x0: -1.17, y0: 1.12, x1: -0.91, y1: 1.305, w: 0.16, part: 'body' },
      // (js/deli/bok.js) no mirrors (none stock); the doors inside their shut lines (the glass from the B-pillar to the A-pillar; the light
      // glass 2 mm further out: the window band falls to the windscreen, its skin's triangles bulge past the band's line on the left)
      vrata: { x: [-0.28, 0.8], y: [0.47, 0.96], handle: [-0.21, 0.88, 0.707, 0.14, 0.026], win: [[-0.28, 0.03], [0.54, 0.03], [0.54, 0.95], [-0.28, 0.95]],
        frame: [-0.36, -0.28, 0.93, 1.0], netIn: 0.003, rub: 0.72, crease: [0.7, 0.82], lexOut: 0.002, rubSide: true },
      zavore: { s: 0.95 },
      matice: { k: 5, r: 0.2 },
      // (sklop 3 · barve, js/deli/barve.js) the stripes over the front lid (the stock twin's place) and the roof, those along the sides
      // between the wings; the decals on the doors' middles (one of the loft's sections inside them: the flames cut at
      // each, over the room), the lid beside its stripes and the roof; the sun strip over the windscreen's flat middle
      // (its sides twisted: the loft's triangles stand up to 2.7 cm off the top's line, the left above it, the right below); the filler on the right cowl behind the wing; the calipers
      barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {},
      crte: { z: [0.07, 0.17], x: [[1.0, 1.79], [-0.88, 0.5]], sx: [-0.55, 0.85] },
      nalepke: { side: [[-0.1, 0.54]], y: [0.68, 0.9], hood: { x: [1.05, 1.7], z: [0.2, 0.36] }, roof: { x: [-0.8, 0.45] } },
      soncni_pas: { x: [0.545, 0.6], w: 0.21 }, zamasek: { x: 0.87, y: 0.88, z: 0.633, r: 0.035 },
      celjusti: { r: [0.09, 0.16], a: [70, 125] },
      // (sklop 3 · skriti deli, js/deli/skriti.js) the battery in the front trunk against the tank, beside the spare wheel, on the floor (the bare flat four has no bay: no filter
      // nor turbo to hide), the control box on the dashboard; the springs and dampers at the stock shocks, the bars under the floor
      akumulator: { x: 1.17, y: 0.566, z: -0.4, back: true }, cip: { x: 0.64, y: 0.92, z: -0.35 },
      vzmeti: { in: 0.2, top: 0.88 }, amortizerji: { in: 0.2, top: 0.88 }, stabilizatorji: { in: 0.2, floor: [0.475, 0.414] }, dim_gum: {},
    },
    // the look (KIT API v1, render.js; look units = metres): the beetle one loft (the round roof from the upright windscreen back to the
    // small rear window, the cowl, the front lid falling to a short nose; the rear wheel's arch cut in it, its tub; its doors doorL / doorR
    // between the B-pillar and the cowl), the cut-down engine lid a skin of its own behind it (cover), the four short wings round the hubs
    // (skins: the front pair with their lamp pods fenderL / fenderR, the rear pair with the tail lamps quarterL / quarterR: off, the arch's
    // tub, the wheel and the shock behind them), the exo-cage (a tube each side from the front bumper over the roof to the rear
    // frame, the front hoop under the light bar, the cross tubes), the light bar (lightbar), the flat four bare under the lid, the shocks
    // in the wheels' gaps, the bumpers and the skid plate
    look: {
      body: { len: 3.9, wid: 1.8, wz: 0.16,
        //       x      w     yb    ybelt  wt    yt    cr     kind  tuck
        secs: [[-1.18, 0.6, 0.5, 0.9, 0.44, 1.0, 0.12, 'gr', 0.12],      // the rear window's base (the engine lid goes on from here)
          [-0.9, 0.67, 0.45, 0.95, 0.51, 1.16, 0.15, 'r', 0.12],           // the roof's back: the round dome
          [-0.52, 0.7, 0.43, 0.97, 0.54, 1.26, 0.16, 'r', 0.12],
          [-0.1, 0.7, 0.42, 0.97, 0.55, 1.3, 0.17, 'r', 0.12],
          [0.28, 0.7, 0.42, 0.97, 0.55, 1.28, 0.165, 'r', 0.12],
          [0.54, 0.7, 0.43, 0.97, 0.55, 1.23, 0.15, 'gf', 0.12],           // the windscreen's top: short and nearly upright
          [0.8, 0.68, 0.44, 0.95, 0.6, 0.98, 0.04, 'b', 0.12],             // the cowl
          [0.98, 0.56, 0.5, 0.87, 0.5, 0.93, 0.06, 'b', 0.12],             // the front lid between the wings, round, falling to the nose
          [1.36, 0.54, 0.53, 0.83, 0.48, 0.88, 0.06, 'b', 0.12],
          [1.62, 0.52, 0.55, 0.78, 0.45, 0.82, 0.05, 'b', 0.12],
          [1.77, 0.5, 0.56, 0.72, 0.42, 0.75, 0.04, 'b', 0.1],
          [1.82, 0.47, 0.57, 0.68, 0.38, 0.7, 0.03, 'b', 0.08]],           // the short nose
        eye: { x: -0.06, y: 1.22, style: 'closed' },
        lamps: [[1.75, 0.865, 0.69], [-1.47, 0.86, 0.71]],
        engine: [-1.4, 0.76], engRear: true },
      wheels: { style: 'knob', w: 0.26, wR: 0.3, rim: [0.86, 0.86, 0.84], cap: [0.24, 0.24, 0.26] },
      budget: { outer: 1600 },   // (the roof rack with the spare and the cans: its own 200 over the 1400 of its category)
      // the regions (look units): the front lid between the wings; the doors (their side from behind the B-pillar to the cowl, their glass to
      // the A-pillar: the pillars stay)
      regions: [{ part: 'hood', x: [0.98, 1.9], bands: ['edge', 'crown'] },
        { part: 'doorL', x: [-0.28, 0.8], bands: ['side'], side: 'L' }, { part: 'doorL', x: [-0.28, 0.54], bands: ['window'], side: 'L' },
        { part: 'doorR', x: [-0.28, 0.8], bands: ['side'], side: 'R' }, { part: 'doorR', x: [-0.28, 0.54], bands: ['window'], side: 'R' }],
      build(K) {
        const P = K.paint, S = K.strp, G = K.GLASS, B = K.black, D = [0.16, 0.16, 0.165], CG = [0.1, 0.1, 0.105], AL = [0.62, 0.63, 0.65], RB = [0.1, 0.1, 0.11];
        const SH = K.shade(P, 0.55), SP = [0.95, 0.72, 0.1];
        // ---- the body: the paint, the glass (the windscreen, the side windows, a small rear window), dark under its lower edge; the firewall
        //      behind the rear seat (the loft's tail: under the engine lid) dark; the rear wheel's arch (the front wheels stand clear of it) ----
        const L = K.loft(K.body.secs, (k, e, kind) => {
          if (e === 0 || e === 8) return SH;
          if (e === 2 || e === 6) return kind === 'r' || kind === 'gf' ? G : P;
          if (kind === 'gf' && e >= 3 && e <= 5) return G;
          if (kind === 'gr' && e === 4) return G;
          return P;
        }, { caps: { front: { col: P, cut: 0 }, rear: { col: D, cut: 0 } }, arches: [{ x: K.rx, r: 0.5 }] });
        const DL = L.decal, top = (x, z) => L.topY(x, z);
        DL.band([[-0.36, 0], [-0.28, 0], [-0.28, 1], [-0.36, 1]], P, null, 0.01);               // the B-pillar
        DL.band([[-0.9, 0], [-0.74, 0], [-0.84, 1], [-0.9, 1]], P, null, 0.01);                 // the C-pillar's lean (the quarter window's back)
        DL.band([[0.54, 0.84], [0.8, 0.3], [0.8, 1], [0.54, 1]], P, null, 0.01);                 // the A-pillar's foot
        K.hinge('hood', [0.99, 0.98, -0.4], [0.99, 0.98, 0.4]);                                   // (the front lid hinges at the cowl)
        K.deli('crte', () => { for (const sd of [-1, 1]) DL.top([[0.99, sd * 0.07], [1.79, sd * 0.07], [1.79, sd * 0.17], [0.99, sd * 0.17]], S, 0.006); });   // the livery: twin stripes along the front lid (the garage's: mounts.crte)
        K.part('hood', () => K.deli('hauba', () => {}));   // (the garage's front lid: mounts.hauba; none stock)
        // ---- the engine lid: cut short over the engine (the lower lid and the apron gone), its louvres ----
        const deck = [[-1.18, 0.6, 0.9, 0.44, 1.0, 0.12], [-1.3, 0.585, 0.88, 0.43, 0.955, 0.11], [-1.41, 0.565, 0.85, 0.415, 0.905, 0.095],
          [-1.5, 0.54, 0.81, 0.4, 0.85, 0.08], [-1.57, 0.51, 0.77, 0.38, 0.795, 0.065]];
        K.part('cover', () => {
          K.skin(deck.map(([x, w, yl, wt, yt, cr]) => [[x, yl, -w], [x, yt, -wt], [x, yt + cr, -0.38 * wt], [x, yt + cr, 0.38 * wt], [x, yt, wt], [x, yl, w]]),
            (k, e) => e === 5 ? D : P, null, P);
          for (const sd of [-1, 1]) { const q = [[-1.22, 1.107, sd * 0.04], [-1.33, 1.06, sd * 0.04], [-1.33, 1.06, sd * 0.15], [-1.22, 1.107, sd * 0.15]]; K.face(sd > 0 ? q : q.reverse(), B); }   // the louvres
          K.deli('krilo', () => {});   // (the garage's wing on the lid: mounts.krilo; none stock)
        }, { hinge: [[-1.18, 1.1, -0.4], [-1.18, 1.1, 0.4]] });
        // ---- the wings: short bands round the hubs, cut high over the big tyres; the front pair (fenderL / fenderR) with the lamp pods, the
        //      rear pair (quarterL / quarterR) with the tail lamps ----
        const wing = (cx, t0, t1, n, prof, sd) => { const R = []; for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * i / n; R.push(prof.map(([r, z]) => [cx + r * Math.cos(t), K.rw + r * Math.sin(t), sd * z])); } return R; };
        const wcol = (k, e) => e === 5 ? D : e === 0 ? K.shade(P, 0.7) : e === 4 ? K.shade(P, 0.9) : P;
        for (const sd of [-1, 1]) {
          K.part(sd < 0 ? 'fenderL' : 'fenderR', () => {
            K.skin(wing(K.fx, 0.56, 2.88, 5, [[0.5, 0.5], [0.575, 0.505], [0.625, 0.6], [0.635, 0.71], [0.59, 0.84], [0.505, 0.885]], sd), wcol, P, P);
            K.cyl([1.52, 0.865, sd * 0.69], [1.745, 0.865, sd * 0.69], 0.105, P, { n: 6, capA: null, capB: null });   // the lamp's pod on the wing's nose
          }, { hinge: [[0.95, 0.86, sd * 0.52], [1.7, 0.86, sd * 0.52]] });
          K.part(sd < 0 ? 'quarterL' : 'quarterR', () => {
            K.skin(wing(K.rx, 0.24, 2.27, 5, [[0.515, 0.5], [0.59, 0.505], [0.64, 0.61], [0.65, 0.73], [0.605, 0.865], [0.52, 0.915]], sd), wcol, P, P);
          }, { hinge: [[-1.45, 0.9, sd * 0.52], [-0.6, 0.9, sd * 0.52]] });
          // (the tail lamp a part of its own with its pod, on the rear wing: tailL, tailR)
          const tp = sd < 0 ? 'tailL' : 'tailR';
          K.cyl([-1.33, 0.86, sd * 0.71], [-1.465, 0.86, sd * 0.71], 0.058, B, { n: 5, capA: null, capB: B, host: tp });   // the tail lamp's pod on the wing's tail
        }
        K.deli('zadnje_luci', () => { for (const sd of [-1, 1]) K.tailLamp(-1.47, 0.86, sd * 0.71, 0.1, 0.1, { round: true, host: sd < 0 ? 'tailL' : 'tailR' }); });   // (the garage's on the pods: mounts.zadnje_luci)
        // (the head lamps on the pods: parts of their own, headL, headR, on the wings; the garage's in their place: K.deli, mounts.zarometi)
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(1.75, 0.865, sd * 0.69, 0.092, { host: sd < 0 ? 'headL' : 'headR' }); });
        // ---- the running boards, the livery's stripe along the sides (the doors' on them), the doors' handles, the shocks in the wheels' gaps;
        //      the doors hinge at the cowl ----
        for (const sd of [-1, 1]) { const f = sd < 0 ? '-z' : 'z', door = sd < 0 ? 'doorL' : 'doorR';
          K.rect(0.14, 0.62, sd * 0.706, 0.84, 0.06, S, { dir: f, host: door });
          K.hinge(door, [0.78, 0.55, sd * 0.69], [0.78, 0.95, sd * 0.69]); }
        K.deli('vrata', () => { for (const sd of [-1, 1]) K.rect(-0.21, 0.88, sd * 0.707, 0.14, 0.026, K.chrome, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' }); });   // the handles (the garage's doors: mounts.vrata)
        K.part('body', () => {
          for (const sd of [-1, 1]) {
            const f = sd < 0 ? '-z' : 'z';
            K.box(0.14, 0.42, sd * 0.73, 1.28, 0.04, 0.22, 0, RB);
            K.rect(-0.37, 0.62, sd * 0.706, 0.18, 0.06, S, { dir: f });
            K.bar([1.28, 0.46, sd * 0.57], [1.16, 0.92, sd * 0.56], 0.035, SP, { n: 5 });
            K.bar([-1.0, 0.46, sd * 0.53], [-0.84, 0.98, sd * 0.5], 0.035, SP, { n: 5 });
          }
        });
        // ---- the exo-cage: a tube each side from the front bumper up the lid's edge and the A-pillar, over the roof, down the rear window's
        //      edge and the lid to the rear frame; the front hoop (the light bar's), the cross tube at the roof's back, the rear frame,
        //      the front bumper (never crushed with the roof, never dented) ----
        const pent = [0, 1, 2, 3, 4].map(i => [Math.cos(i * Math.PI * 0.4) * 0.026, Math.sin(i * Math.PI * 0.4) * 0.026]);
        const yH = top(0.5, 0.36) + 0.05, yR = top(-0.8, 0.4) + 0.05;
        const cage = [[1.93, 0.6, 0.44], [1.72, 0.9, 0.5], [0.88, 1.05, 0.61], [0.58, 1.31, 0.56], [-0.1, top(-0.1, 0.36) + 0.05, 0.36], [-0.8, yR, 0.4], [-1.18, 1.05, 0.5], [-1.56, 0.86, 0.52], [-1.9, 0.77, 0.48]];   // (a side's tube, z on the right; straight between its points)
        K.part('body', () => {
          for (const sd of [-1, 1]) K.sweep(pent, cage.map(([x, y, z]) => [x, y, sd * z]), CG);
          K.bar([0.5, yH, -0.37], [0.5, yH, 0.37], 0.026, CG, { n: 5 });   // the front hoop
          K.bar([-0.8, yR, -0.41], [-0.8, yR, 0.41], 0.026, CG, { n: 5 });
          K.bar([-1.9, 0.77, -0.48], [-1.9, 0.77, 0.48], 0.026, CG, { n: 5 });                  // the rear frame round the engine
          for (const sd of [-1, 1]) K.bar([-1.9, 0.77, sd * 0.48], [-1.93, 0.36, sd * 0.48], 0.026, CG, { n: 5 });
          K.bar([-1.93, 0.36, -0.64], [-1.93, 0.36, 0.64], 0.032, CG, { n: 6 });               // the rear bumper
          K.bar([1.93, 0.6, -0.64], [1.93, 0.6, 0.64], 0.032, CG, { n: 6 });                   // the front bumper
          K.plate([[1.94, 0.5, -0.42], [1.94, 0.5, 0.42], [1.66, 0.36, 0.42], [1.66, 0.36, -0.42]], 0.012, AL);   // the skid plate under the nose
        }, { noCrush: true, noDent: true });
        // ---- the light bar on the front hoop: four round lamps in a black housing ----
        K.part('lightbar', () => {
          K.box(0.545, yH + 0.1, 0, 0.09, 0.09, 1.0, 0, CG);
          for (const sd of [-1, 1]) { K.bar([0.5, yH, sd * 0.3], [0.54, yH + 0.1, sd * 0.3], 0.018, CG, { n: 4 }); for (const z of [0.125, 0.375]) K.headLamp(0.592, yH + 0.145, sd * z, 0.042, { ring: null, n: 6 }); }
        }, { noCrush: true, noDent: true, hinge: [[0.5, yH, -0.4], [0.5, yH, 0.4]] });
        // ---- the roof rack (stock; a part of its own, roofRack: it comes off whole, as MEDVED's): a frame over the roof's crown on four short
        //      legs down into the cage's tubes, the spare lying flat on its cross members, a jerrycan standing on each side rail beside it
        //      (no labels), a strap over the spare ----
        K.part('roofRack', () => {
          const yF = 1.5, XS = [-0.44, 0], ZS = 0.385, TY = [0.07, 0.07, 0.075], RIM = [0.86, 0.86, 0.84], HUB = [0.24, 0.24, 0.26], GN = [0.25, 0.32, 0.17], GNT = [0.31, 0.39, 0.21];
          const faceTo = (pts, col, d) => { const a = pts[0], u = [pts[1][0] - a[0], pts[1][1] - a[1], pts[1][2] - a[2]], v = [pts[2][0] - a[0], pts[2][1] - a[1], pts[2][2] - a[2]];
            const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; K.face(n[0] * d[0] + n[1] * d[1] + n[2] * d[2] >= 0 ? pts : pts.slice().reverse(), col); };
          const disc = (x, y, z, r, k, col) => faceTo(Array.from({ length: k }, (_, i) => [x + Math.cos(i / k * Math.PI * 2) * r, y, z + Math.sin(i / k * Math.PI * 2) * r]), col, [0, 1, 0]);
          const onCage = (x) => { const i = cage.findIndex(p => p[0] <= x), a = cage[i - 1], b = cage[i], t = (a[0] - x) / (a[0] - b[0]); return [a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])]; };   // (the tube's centre at x)
          for (const x of XS) K.bar([x, yF, -ZS], [x, yF, ZS], 0.0125, CG, { n: 4 });
          for (const sd of [-1, 1]) K.bar([XS[0], yF, sd * ZS], [XS[1], yF, sd * ZS], 0.0125, CG, { n: 4 });
          for (const x of XS) { const [ty, tz] = onCage(x); for (const sd of [-1, 1]) K.bar([x, yF, sd * ZS], [x, ty + 0.01, sd * tz], 0.011, CG, { n: 4 }); }   // the legs, their feet in the tubes
          const wx = -0.22, wy = yF + 0.0125, wr = 0.27, ww = 0.15, wt = wy + ww;
          K.cyl([wx, wy, 0], [wx, wt, 0], wr, TY, { n: 12, capA: null });
          disc(wx, wt + 0.003, 0, 0.17, 10, RIM); disc(wx, wt + 0.006, 0, 0.06, 6, HUB);
          faceTo([[wx - 0.022, wt + 0.009, -wr], [wx + 0.022, wt + 0.009, -wr], [wx + 0.022, wt + 0.009, wr], [wx - 0.022, wt + 0.009, wr]], B, [0, 1, 0]);
          for (const sd of [-1, 1]) faceTo([[wx - 0.022, wt + 0.009, sd * wr], [wx + 0.022, wt + 0.009, sd * wr], [wx + 0.022, wy, sd * (wr + 0.012)], [wx - 0.022, wy, sd * (wr + 0.012)]], B, [0, 0.4, sd]);
          for (const sd of [-1, 1]) { K.box(wx, wy, sd * ZS, 0.3, 0.2, 0.1, 0, GN, GNT, true);
            K.bar([wx - 0.07, wy + 0.2, sd * ZS], [wx + 0.07, wy + 0.2, sd * ZS], 0.009, GN, { n: 3 }); }
        }, { noCrush: true, hinge: [[-0.44, 1.5, -0.385], [-0.44, 1.5, 0.385]] });
        // ---- the flat four, bare behind the rear axle (the body's outer shell: in sight): the crankcase, the finned cylinders and the heads
        //      each side, twin air cleaners, the fan shroud over them with its round fan housing and the generator's pulley, the belt down to
        //      the crank pulley, the stinger ----
        K.part('body', () => {
          K.box(-1.46, 0.32, 0, 0.5, 0.22, 0.3, 0, [0.46, 0.47, 0.49]);
          for (const sd of [-1, 1]) {
            K.box(-1.42, 0.34, sd * 0.28, 0.34, 0.2, 0.2, 0, CG);
            K.box(-1.42, 0.36, sd * 0.42, 0.3, 0.16, 0.08, 0, AL);
            K.cyl([-1.32, 0.72, sd * 0.3], [-1.32, 0.81, sd * 0.3], 0.08, K.chrome, { n: 5, capA: null });
          }
          K.box(-1.4, 0.54, 0, 0.34, 0.18, 0.66, 0, CG);                                           // the fan shroud over both banks
          K.cyl([-1.46, 0.69, 0], [-1.6, 0.69, 0], 0.12, CG, { n: 8, capA: null, capB: AL });      // its round fan housing, the generator's pulley
          K.bar([-1.62, 0.64, 0], [-1.755, 0.48, 0], 0.014, B, { n: 3 });                          // the fan belt
          K.cyl([-1.72, 0.43, 0], [-1.76, 0.43, 0], 0.1, [0.2, 0.2, 0.21], { n: 8, capA: null });   // the crank pulley
          K.deli('auspuh', () => K.cyl([-1.66, 0.28, 0], [-1.94, 0.5, 0], 0.035, [0.35, 0.3, 0.27], { n: 6, r2: 0.062, capA: null, capB: B }));   // the stinger (the garage's: mounts.auspuh)
        });
        // ---- inside (seen once a part is off): the bucket seats, the dashboard, the roll bar behind the seats; the fuel tank and the spare
        //      wheel under the front lid ----
        for (const sd of [-1, 1]) K.seat(-0.08, 0.64, sd * 0.33, { w: 0.46, l: 0.48, back: 0.6, col: [0.1, 0.1, 0.11] });
        K.box(0.66, 0.78, 0, 0.16, 0.14, 1.2, 0, D, null, false, { inner: true, part: 'body' });
        K.cage([[[-0.45, 0.48, -0.56], [-0.45, 1.22, -0.44]], [[-0.45, 0.48, 0.56], [-0.45, 1.22, 0.44]], [[-0.45, 1.22, -0.44], [-0.45, 1.22, 0.44]], [[-0.45, 1.22, 0], [-1.0, 0.7, 0]]], 0.022, CG, { part: 'body' });
        K.box(1.02, 0.56, 0, 0.3, 0.26, 0.84, 0, [0.3, 0.3, 0.32], null, false, { inner: true, part: 'body' });
        K.face([[0.9, 0.5, 0.55], [0.9, 0.5, -0.55], [0.9, 0.87, -0.55], [0.9, 0.94, -0.2], [0.9, 0.94, 0.2], [0.9, 0.87, 0.55]], K.lining, { inner: true, part: 'body' });   // (the front trunk's back wall)
        K.tyre(1.48, 0.66, 0, { axis: 'y', r: 0.3, w: 0.18, inner: true, part: 'body' });
        // (the garage's parts that have no stock piece: in their mounts' parts)
        K.part('body', () => K.deli('zaluzije', () => {}));
        for (const id of ['zmigavci', 'relijske_luci', 'vlecne_kljuke', 'nalepke', 'soncni_pas', 'celjusti', 'zamasek', 'akumulator', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum']) K.deli(id, () => {});
      },
    },
  });
})();
