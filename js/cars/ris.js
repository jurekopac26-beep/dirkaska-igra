/* Vehicle 'ris' — RIS G: a wide four-wheel-drive gymkhana coupe made for sliding (invented; no real model). Signature features: 1) the
   black roof with the scoop for the turbo's air, 2) the wide black overfenders on all four arches, the mud flaps behind every wheel,
   3) the big black blocks of the livery slanting up and back on the sides, a white line along their edge, 4) the light pod of four round
   lamps in the grille under the slim lamps, 5) the big wing on swan necks over the boot lid, one big pipe in the diffuser. L 4.45 W 2.00
   H 1.38, wheelbase 2.62, overhangs F 0.94 R 0.88 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  const SLIM = [[-0.15, -0.03], [0.15, -0.03], [0.15, 0.03], [-0.15, 0.03]];   // (the slim head lamp's outline, 0.3 x 0.06 m: the garage's lamps take it)
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
    // where the garage's parts go (js/deli.js, look units): the wing over the boot lid, in the wing's part (in place of the big wing;
    // as wide as the lid's top, the swan necks' feet behind the lid's lip; the prototype's fin from behind the lip of the garage's lid);
    // the head lamps where the slim lamps are, in the lamps' parts (their outline the slim one); the rims on its wheels
    mounts: {
      krilo: { x: -2.18, w: 0.8, front: -1.885, part: 'spoiler' },
      zarometi: { x: 2.22, y0: 0.52, lean: 0, zc: 0.62, yc: 0.52, s: 0.3, hosts: ['headL', 'headR'], depth: 0.04, shape: SLIM, bulge: 0, ringW: 0.01 },
      platisca: {},
      // (sklop 2 · spredaj, js/deli/spredaj.js) the nose's face and the tail's (the splitter, kept, up to the bay's floor: the stock one
      // hangs under the nose; the diffuser), the sills between the overfenders, the flares on the overfenders' faces; the bonnet between
      // its shut lines (in place of the vents); the grille's room; the indicators beside the grille's ends under the lamps, the repeaters
      // on the fenders ahead of the overfenders, the rear's on the tail under the lamps; the extra lamps in place of the light pod (before
      // the grille, before the nose between the lamps, on the roof's front edge)
      aero: { xf: 2.22, xr: -2.22, w: 0.8, yf: 0.22, yr: 0.3, sill: [-0.94, 0.88], ws: 0.9, ys: 0.28, wsF: 1.0, wsR: 1.0, archIn: 0,
        lipF: [2.12, 0.19, 0.3, 0.07, 1.9], lipR: [-2.16, 0.16, 0.16, 0.14, 1.6], exh: [0, 0.08] },
      hauba: { x0: 1.0, x1: 2.0, w: 0.66, bulge: 0.7 },
      maska: { x: 2.223, y0: 0.36, lean: 0, yc: 0.36, w: 1.3, h: 0.22, comb: 1.6, part: 'bumperF' },
      zmigavci: { front: { x: 2.22, y: 0.47, z: 0.8, w: 0.08, h: 0.04, part: 'bumperF' }, side: { x: 1.9, y: 0.66, z: 0.957, hosts: ['fenderL', 'fenderR'] },
        rear: { x: -2.22, y: 0.47, z: 0.72, part: 'bumperR' }, mirror: { x: 0.7155, y: 0.96, z: 0.99, w: 0.11, parts: ['mirrorL', 'mirrorR'] } },
      relijske_luci: { bumper: [2.223, 0.36, 0.42], nose: [2.21, 0.52], foot: 0.36, intake: [2.223, 0.36, 1.3, 0.22], roof: [0.1, 0.5], pod: [2.22, 0.4, 0.6, 0.55], part: 'bumperF' },
      // (js/deli/zadaj.js) the tail lamps' rooms in the black bands on the corners (the garage's lamps lying along them), the black
      // panel between them; the pipes in the diffuser between its fins (the pair's middle), the silencer and the pipes up against the
      // floor; the boot lid from the tail's top edge to the rear glass; the tow points on the faces (none stock; the front one over the
      // splitter's top, the rear one out past the pipes); the flaps behind every wheel (in place of the stock ones)
      zadnje_luci: { x: -2.203, zc: 0.62, yc: 0.8, w: 0.14, h: 0.3, s: 0.6, shape: [[-0.19, -0.05], [-0.19, 0.05], [0.19, 0.05], [0.19, -0.05]], hosts: ['tailL', 'tailR'],
        bar: { x: -2.222, y: 0.8, w: 0.43, h: 0.05, part: 'trunk' } },
      auspuh: { x: -2.28, y: 0.3, z: 0.375, r: 0.075, len: 0.22, part: 'bumperR', drum: 0.263, pipe: 0.29 },
      prtljaznik: { x: [-2.16, -1.8], w: 0.66, part: 'trunk' },
      vlecne_kljuke: { f: [2.22, 0.345, 0.7], r: [-2.222, 0.45, -0.6] },
      lovilci_blata: { x: [0.84, -1.78], z: [0.73, 0.99], y: [0.4, 0.1], sill: [-0.92, 0.86, 0.29, 0.9], part: 'body' },
      // (js/deli/streha.js) the roof from its rear edge to the windscreen's top (the stock scoop gives way to a sunroof or a scoop); the
      // scoop's mouth, the scoops no longer than to the roof's rear edge (to a fin's front); the aerials (none stock: in the body; the raked
      // rubber rod's tip ahead of the louvres' top blade); the louvres over the rear glass (the body's) ahead of the wing
      streha: { x0: -1.02, x1: 0.16, xf: 0.12, xr: -0.75 },
      stresna_zajemalka: { x: 0.08, z: 0, back: -1.02 },
      antena: { x: -0.6, z: 0.36, fin: [-0.95, 0], front: [0.06, 0.45], whip: -0.3, part: 'body' },
      zaluzije: { x0: -1.76, y0: 1.039, x1: -1.06, y1: 1.327, w: 0.4, part: 'body' },
      // (js/deli/bok.js) the black mirrors; the doors inside their shut lines (the door's rear edge across the side glass), the handles,
      // the door glass's rear part beside the driver up to the windscreen's top (ahead of it the band's one long quad down to the fender
      // leaves the decal band's line by up to 3 cm: the net and the light glass behind it; the net 2 mm nearer the band; the rubbing
      // strip's bolts on the side's own line)
      ogledala: { x: 0.66, y: 0.96, z: 0.99, w: 0.11, h: 0.085, d: 0.15 },
      vrata: { x: [-0.28, 0.87], y: [0.4, 0.86], handle: [-0.12, 0.8, 0.975, 0.13, 0.025],
        win: [[-0.26, 0.06], [0.43, 0.06], [0.16, 0.92], [-0.26, 0.92]], frame: [-0.28, -0.26, 0.92, 0.98], netIn: 0.002, rubSide: true },
      zavore: { s: 1 },
      matice: { k: 5, r: 0.2 },
      // (sklop 3 · barve, js/deli/barve.js) the stripes between the bonnet's vents, the decals on the doors, the fenders ahead of the
      // overfenders and the quarters, on the bonnet ahead of the vents and the roof; the sun strip on the windscreen's top; the calipers;
      // the fuel cap on the right rear quarter behind the overfender (none stock)
      barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {},
      crte: { z: [0.04, 0.16] },
      nalepke: { side: [[-0.26, 0.84], [1.78, 2.02], [-0.94, -0.3]], y: [0.5, 0.84], hood: { x: [1.65, 2.0], z: [0.2, 0.45] }, roof: { x: [-1.0, 0.1] } },
      soncni_pas: { x: [0.16, 0.3] }, zamasek: { x: -1.95, y: 0.75, z: 0.968, r: 0.045 },
      celjusti: { r: [0.086, 0.161], a: [70, 125] },
      // (sklop 3 · skriti deli, js/deli/skriti.js) round the four in the bay: the filter against the block's left side, the turbo on its
      // right (the twins side by side there), the battery against the block's front, the control box on the block's top beside the
      // cover; the struts and bars at the wheels
      filter_zraka: { x: 1.38, y: 0.6, z: -0.44 }, akumulator: { x: 1.861, y: 0.37, z: 0.26, back: true }, turbo: { x: 1.7, y: 0.5, z: 0.39, twin: [-0.04, 0.05] }, cip: { x: 1.36, y: 0.706, z: 0.27 },
      vzmeti: { in: 0.14, top: 0.78 }, amortizerji: { in: 0.14, top: 0.76 }, stabilizatorji: { in: 0.14 }, dim_gum: {},
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
      hi: true,   // (Nastavitve · Detajli avtov: Visoki: the small details and the driver at the end of build, the tyres in 64)
      budget: { inner: 1400 }, budgetHi: { inner: 1750 },   // (its cabin, K.cab's pieces: the inner block over a car's 800 / 1200; drawn only once a door opens, a pane breaks or a part is off)
      wheels: { style: 'std', spokes: 6, w: 0.27, rim: [0.92, 0.92, 0.9], cap: [0.12, 0.12, 0.13], gap: 0.04, seg: 32, segHi: 64 },
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
        }
        // (the garage's doors in the handles' place: K.deli, mounts.vrata)
        K.deli('vrata', () => { for (const sd of [-1, 1]) K.rect(-0.62, 0.82, sd * 0.975, 0.13, 0.025, D, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' }); });
        // the roof scoop (the air for the turbo; the garage's sunroof or scoop in its place: mounts.streha, stresna_zajemalka), the
        // bonnet's vents (the garage's bonnet top in their place: K.deli, mounts.hauba)
        if (!(K.fitted && (K.fitted.streha || K.fitted.stresna_zajemalka))) { K.box(-0.45, 1.33, 0, 0.62, 0.08, 0.44, 0, B); K.rect(-0.14, 1.37, 0, 0.4, 0.06, DK); }
        K.part('hood', () => K.deli('hauba', () => { for (const sd of [-1, 1]) DC.top([[1.15, sd * 0.18], [1.6, sd * 0.18], [1.6, sd * 0.5], [1.15, sd * 0.5]], DK, 0.004); }));
        // the wide black overfenders, the mud flaps behind every wheel (the garage's flaps in their place: K.deli, mounts.lovilci_blata)
        for (const A of K.arches) for (const sd of [-1, 1]) K.flare(A.x, 0.37, 0.47, sd * 0.9, sd * 1.0, B);
        K.deli('lovilci_blata', () => { for (const A of K.arches) for (const sd of [-1, 1]) K.box(A.x - 0.44, 0.1, sd * 0.86, 0.02, 0.3, 0.26, 0, DK, null, true, { part: 'body' }); });
        // the nose: the slim lamps (each a part of its own; the garage's lamps in their place: K.deli, mounts.zarometi); the front bumper:
        // the grille, the light pod of four round lamps in it, the splitter
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(2.222, 0.52, sd * 0.62, 0.05, { shape: 'rect', w: 0.3, h: 0.06, ring: null, host: sd < 0 ? 'headL' : 'headR' }); });
        K.part('bumperF', () => {
          K.deli('maska', () => K.grille(2.223, 0.36, 0, 1.3, 0.22, { slats: 3 }));   // (the garage's grille in its place: mounts.maska)
          K.deli('relijske_luci', () => { for (const z of [-0.36, -0.12, 0.12, 0.36]) K.headLamp(2.232, 0.36, z, 0.065, { ring: B }); });   // (the garage's extra lamps in the pod's place)
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
          K.rect(-2.222, 0.8, sd * 0.62, 0.38, 0.1, B, { dir: '-x', part: tp }); }
        K.deli('zadnje_luci', () => { for (const sd of [-1, 1]) K.tailLamp(-2.226, 0.8, sd * 0.62, 0.34, 0.06, { host: sd < 0 ? 'tailL' : 'tailR' }); });   // (the garage's: mounts.zadnje_luci)
        K.rect(-2.222, 0.8, 0, 0.86, 0.05, B, { dir: '-x', part: 'trunk' });
        // the rear bumper: the diffuser and its fins, one big pipe in the middle
        K.part('bumperR', () => {
          K.deli('auspuh', () => K.exhaust(-2.28, 0.3, 0, 0.075, 0.22));   // (the garage's in its place: mounts.auspuh)
        }, { hinge: [[-2.1, 0.3, -0.8], [-2.1, 0.3, 0.8]] });
        // the splitter, the diffuser and its fins (the garage's kit in their place; the splitter and the diffuser kept by an option
        // without a piece of its own there: mounts.aero lipF, lipR)
        K.deli('aero', () => { K.part('bumperF', () => K.box(2.12, 0.19, 0, 0.3, 0.025, 1.9, 0, DK));
          K.part('bumperR', () => { K.box(-2.16, 0.16, 0, 0.16, 0.14, 1.6, 0, DK); for (const z of [-0.5, -0.25, 0.25, 0.5]) K.box(-2.2, 0.16, z, 0.2, 0.13, 0.02, 0, DK); }); });
        // the black mirrors
        K.deli('ogledala', () => { for (const sd of [-1, 1]) K.mirror(0.66, 0.96, sd * 0.99, { col: B, crack: 1 }); });   // (the garage's: mounts.ogledala)
        K.hinge('hood', [0.95, 0.96, -0.6], [0.95, 0.96, 0.6]);
        K.hinge('trunk', [-1.8, 1.0, -0.6], [-1.8, 1.0, 0.6]);
        K.hinge('doorL', [0.86, 0.42, -0.95], [0.86, 0.86, -0.95]); K.hinge('doorR', [0.86, 0.42, 0.95], [0.86, 0.86, 0.95]);
        // ---- Visoki (Nastavitve · Detajli avtov: Visoki; the player's and the showroom's car): the head lamps' bulbs, the tail lamps'
        //      bars; the driver at the wheel ----
        if (K.hi) {
          const F = K.fitted, LR = (n, sd) => n + (sd < 0 ? 'L' : 'R');   // (F: a garage part in a detail's place: none of it there)
          for (const sd of [-1, 1]) {
            if (!F.zarometi) K.discX(2.229, 0.52, sd * 0.62, 0.012, 6, [1, 0.99, 0.94], 1, { host: LR('head', sd) });
            if (!F.zadnje_luci) K.rect(-2.232, 0.8, sd * 0.62, 0.22, 0.006, [0.3, 0.02, 0.03], { dir: '-x', host: LR('tail', sd) }); }
          K.driver(-0.4, 1.02, -0.4, { inner: true, r: 0.115, lean: 0.3, hands: [0.1, 0.8, 0.15], knee: [0.34, 0.62, 0.16], feet: [0.76, 0.36, 0.11], suit: [0.14, 0.16, 0.2], helmet: [0.93, 0.93, 0.9] });
        }
        // ---- inside (the inner block: seen once a door opens, a pane breaks or a part is off; K.cab's pieces, docs/avti-kolibri.md): the
        //      carpet and the firewall, the tunnel, the dashboard with its dials and its wheel (left-hand drive), two shell buckets with
        //      harnesses, the console with its sequential lever, the pedals, the door cards; the four in the bay, the radiator behind the
        //      mouth, the tail's panel ----
        { const C = K.cab, IN = C.IN, SZ = -0.4, CARP = [0.08, 0.08, 0.085], SH = [0.1, 0.1, 0.11], SC = [0.2, 0.21, 0.23], RS = [0.75, 0.1, 0.08];
          C.face([[-1.2, 0.3, -0.86], [0.86, 0.3, -0.86], [0.86, 0.3, 0.86], [-1.2, 0.3, 0.86]], CARP, [0, 1, 0]);                // the carpet
          C.face([[0.86, 0.3, -0.86], [0.86, 0.3, 0.86], [0.86, 0.84, 0.86], [0.86, 0.84, -0.86]], CARP, [-1, 0, 0]);             // the firewall
          K.box(0.1, 0.3, 0, 1.3, 0.17, 0.24, 0, C.PL2, C.PL, true, IN);                                                             // the tunnel
          C.dash({ x: 0.52, y: 0.84, d: 0.38, w: 0.74, dz: SZ, col: [0.09, 0.09, 0.1], col2: [0.16, 0.16, 0.17] });
          C.steer({ c: [0.24, 0.84, SZ], ax: [0.75, -0.66], r: 0.17, rr: 0.017, to: [0.48, 0.72, SZ] });
          for (const sd of [-1, 1]) { K.box(-0.4, 0.3, sd * 0.4, 0.4, 0.12, 0.4, 0, C.PL, null, true, IN);                          // the seats on their runners
            C.seat(-0.4, 0.42, sd * 0.4, { w: 0.5, top: 0.66, lean: 0.3, shell: true, belt: 'harness', col: SH, col2: SC, strap: RS }); }
          C.console(0.14, 0.47, { l: 0.34, seq: true });
          C.pedals(0.8, 0.33, SZ, 3);
          for (const sd of [-1, 1]) C.door(sd, { x: [-0.62, 0.82], y: [0.42, 0.86], z: 0.9, insert: SC, crank: false, speaker: false });
          K.engine(1.55, 0.36, 0, { l: 0.62, w: 0.66, h: 0.48 });
          C.nose({ x: 2.06, w: 0.6, y: [0.3, 0.62], rad: [0.8, 0.28], bar: 2.14, barY: 0.3, barW: 1.3 });
          C.tail({ x: -2.14, w: 0.6, y: [0.36, 0.66], bar: -2.18, barY: 0.38, barW: 1.3 }); }
        // the garage's parts with no stock one in their place (K.deli, mounts): the boot lid's panel, the aerials and the rear glass's
        // louvres, the indicators, the roof's, the tow points, the colours' and the hidden ones in the bay and at the wheels
        K.part('trunk', () => K.deli('prtljaznik', () => {}));
        K.part('body', () => { K.deli('antena', () => {}); K.deli('zaluzije', () => {}); });
        for (const id of ['zmigavci', 'streha', 'stresna_zajemalka', 'vlecne_kljuke', 'crte', 'nalepke', 'soncni_pas', 'celjusti', 'zamasek']) K.deli(id, () => {});
        for (const id of ['akumulator', 'filter_zraka', 'turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum']) K.deli(id, () => {});
      },
    },
  });
})();
