/* Vehicle 'merjasec' — MERJASEC V8: a modern four-door saloon with a big V8 and rear drive, made for drifting (invented; no real model).
   Signature features: 1) a long low four-door body, the B- and C-pillars black, the dark lower sides, 2) dark bolted-on overfenders on
   all four arches, 3) the power bulge on the long bonnet with two dark vents, 4) the wide grille, slim lamps and the splitter at the
   nose, 5) the ducktail on the boot lid's end, the slim lamps joined across the tail, four pipes in the dark diffuser. L 4.95 W 2.04
   H 1.40, wheelbase 2.90, overhangs F 1.03 R 1.03 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  const SLIM = [[-0.18, -0.028], [0.18, -0.028], [0.18, 0.028], [-0.18, 0.028]];   // (the slim head lamp's outline, 0.36 x 0.055 m: the garage's lamps take it)
  VEHICLE_DEFS.push({
    id: 'merjasec', name: 'MERJASEC V8', cat: 'sportni', ord: 10, drive: 'FR',
    desc: 'Limuzina z V8 za drift: štiri vrata, široki blatniki, kratek rep in štirje izpuhi.',
    // the FR layer turned up for sliding, as the ŠAKAL D's (docs/novi-avti-2.md): a big slide for the same turn (tv), held long (out),
    // swung round by the power (pwr; under 300 W/kg its rear wheels may spin: spinK) and by a lift (liftP); a long heavy saloon: a little
    // slower to turn in (turn), more inertia (kI). The driving school's drift (tools/novi-avti-2/drift.js): Jezero 2208, Spa 502,
    // Bathurst 858 (ŠKORPIJON H 1998 / 202 / 836)
    phys: { mass: 1680, a: 1.4, b: 1.5, kI: 1.2, kw: 470, redline: 7200, idle: 750, gears: [3.0, 2.1, 1.6, 1.28, 1.05, 0.88], final: 3.9, rw: 0.35, cDrag: 0.44, len: 4.95, wid: 2.04, steerMax: 0.78,
      tracK: 1.1, brakeK: 1.05, spinK: 0.4 },
    arc: { amax: 1.76, kv: 2.0, rmin: 4.3 },
    csp: { bx: 0.18, coast: -0.035, thr: 0.03, liftP: 0.18, pwr: 0.16, out: 1.5, turn: 1.0, w: 1.0, tv: 1.35 },
    stats: { power: 10, grip: 7, weight: 3, drift: 10 },
    price: 95000, pk: 'ppo', field: ['merjasec'],
    snd: { kind: 'v8', hz: 0.95, loud: 1.15 },
    expect: { t100: [3.05, 3.45], vmax: [235, 251], latG: [2.15, 2.25], d100: [21.9, 23.7] },   // (measured 3.25 / 243 / 2.20 / 22.8)
    partNames: { headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamp', tailR: 'right tail lamp' },
    // the car's set and its own: each head lamp and each tail lamp a part of its own
    parts: { set: 'car', ht: 1.4, y0: 0.2,
      extra: {
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: 1.0, lz: -0.6, y: 0.56 },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: 1.0, lz: 0.6, y: 0.56 },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: -1.0, lz: -0.66, y: 0.86 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: -1.0, lz: 0.66, y: 0.86 },
      },
      over: { trunk: { lx: -0.86, y: 0.98 }, quarterL: { h: 0.11 }, quarterR: { h: 0.11 }, mirrorL: { lx: 0.33 }, mirrorR: { lx: 0.33 } } },   // (the boot lid: the deck behind the rear glass; the quarters with their overfenders; the mirrors by the windscreen's foot)
    // where the garage's parts go (js/deli.js, look units): the wing on the boot lid's end, in the boot lid's part (in place of the
    // ducktail; the swan necks' feet behind the lid's lip; the prototype's fin on the lid, behind the rear glass); the head lamps where the slim lamps are, in the lamps' parts
    // (their outline the slim one); the rims on its wheels
    mounts: {
      krilo: { x: -2.37, w: 0.84, front: -2.0, part: 'trunk' },
      zarometi: { x: 2.42, y0: 0.56, lean: 0, zc: 0.62, yc: 0.56, s: 0.36, hosts: ['headL', 'headR'], depth: 0.04, shape: SLIM, bulge: 0, ringW: 0.01 },
      platisca: {},
      // (sklop 2 · spredaj, js/deli/spredaj.js) the nose's face and the tail's (the splitter and the dark diffuser under them; the
      // splitter, kept, down to the bay's floor: the stock one hangs under the nose), the sills between the overfenders, the flares on
      // the overfenders' faces; the long bonnet between its shut lines (in place of the bulge's vents); the wide grille's room; the
      // indicators beside the grille's ends, the repeaters on the fenders ahead of the overfenders, the rear's on the tail beside the
      // lamps' foot; the extra lamps before the grille, before the nose between the lamps, on the roof's front edge
      aero: { xf: 2.42, xr: -2.53, w: 0.82, yf: 0.23, yr: 0.3, sill: [-1.0, 0.9], ws: 0.925, ys: 0.29, wsF: 1.02, wsR: 1.02, archIn: 0,
        lipF: [2.34, 0.15, 0.3, 0.12, 1.96], lipR: [-2.46, 0.15, 0.14, 0.14, 1.4], exh: [0.59, 0.12] },
      hauba: { x0: 1.08, x1: 2.28, w: 0.66, bulge: 0.8 },
      maska: { x: 2.423, y0: 0.38, lean: 0, yc: 0.38, w: 1.3, h: 0.24, comb: 1.6, part: 'bumperF' },
      zmigavci: { front: { x: 2.42, y: 0.485, z: 0.76, w: 0.1, h: 0.04, part: 'bumperF' }, side: { x: 2.1, y: 0.68, z: 0.968, hosts: ['fenderL', 'fenderR'] },
        rear: { x: -2.53, y: 0.47, z: 0.72, part: 'bumperR' }, mirror: { x: 0.8755, y: 1.0, z: 1.0, w: 0.11, parts: ['mirrorL', 'mirrorR'] } },
      relijske_luci: { bumper: [2.423, 0.38, 0.45], nose: [2.41, 0.56], foot: 0.36, intake: [2.423, 0.38, 1.3, 0.24], roof: [0.1, 0.52], pod: [2.42, 0.42, 0.62, 0.55], part: 'bumperF' },
      // (js/deli/zadaj.js) the tail lamps' rooms in the black bands on the corners (the garage's lamps lying along them), the red bar
      // between them; the four pipes under the tail (the pairs' middles), the silencer and the pipes up against the floor; the boot lid
      // from its end under the ducktail to the rear glass; the tow points on the faces (none stock; the front one over the splitter's top: the hooks clear of it); the flaps behind the overfenders
      zadnje_luci: { x: -2.513, zc: 0.68, yc: 0.86, w: 0.14, h: 0.3, s: 0.6, shape: [[-0.17, -0.045], [-0.17, 0.045], [0.17, 0.045], [0.17, -0.045]], hosts: ['tailL', 'tailR'],
        bar: { x: -2.532, y: 0.86, w: 0.5, h: 0.03, part: 'trunk' } },
      auspuh: { x: -2.56, y: 0.27, z: 0.59, r: 0.05, len: 0.2, part: 'bumperR', drum: 0.264, pipe: 0.29 },
      prtljaznik: { x: [-2.46, -1.98], w: 0.7, part: 'trunk' },
      vlecne_kljuke: { f: [2.42, 0.355, 0.76], r: [-2.532, 0.45, -0.3] },
      lovilci_blata: { x: [1.0, -1.9], z: [0.74, 0.99], y: [0.42, 0.1], sill: [-0.98, 0.88, 0.3, 0.925], part: 'body' },
      // (js/deli/streha.js) the roof from its rear edge to the windscreen's top; the scoop's mouth, the scoops no longer than to the
      // roof's rear edge (to a fin's front); the aerials (none stock: in the body); the louvres over the rear glass (the body's)
      streha: { x0: -1.16, x1: 0.15, xf: 0.11, xr: -0.85 },
      stresna_zajemalka: { x: 0.07, z: 0, back: -1.16 },
      antena: { x: -1.0, z: 0.36, fin: [-1.1, 0], front: [0.0, 0.48], whip: -0.4, part: 'body' },
      zaluzije: { x0: -1.92, y0: 1.047, x1: -1.24, y1: 1.359, w: 0.52, part: 'body' },
      // (js/deli/bok.js) the black mirrors; the front doors inside their shut lines (the B-pillar's black band behind the glass), the
      // handles, the door glass's rear part beside the driver up to the windscreen's top (ahead of it the band's one long quad down to
      // the fender leaves the decal band's line by up to 3 cm: the net and the light glass behind it; the net 2 mm nearer the band)
      ogledala: { x: 0.82, y: 1.0, z: 1.0, w: 0.11, h: 0.085, d: 0.15, z0: 0.85 },
      vrata: { x: [-0.15, 0.98], y: [0.4, 0.9], handle: [0.42, 0.84, 0.985, 0.13, 0.025],
        win: [[0.04, 0.06], [0.45, 0.06], [0.15, 0.92], [0.04, 0.92]], frame: [0.0, 0.04, 0.92, 0.98], netIn: 0.002 },
      zavore: { s: 1 },
      matice: { k: 5, r: 0.2 },
      // (sklop 3 · barve, js/deli/barve.js) the stripes inside the bonnet's vents, the decals on the front doors, the fenders ahead of
      // the overfenders and the rear doors, on the bonnet ahead of the vents and the roof; the sun strip on the windscreen's top; the
      // calipers; the fuel cap on the right rear quarter behind the overfender (none stock)
      barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {},
      crte: { z: [0.1, 0.24] },
      nalepke: { side: [[-0.15, 0.95], [1.9, 2.25], [-1.0, -0.2]], y: [0.5, 0.86], hood: { x: [1.75, 2.2], z: [0.2, 0.45] }, roof: { x: [-1.1, 0.1] } },
      soncni_pas: { x: [0.15, 0.3] }, zamasek: { x: -2.1, y: 0.75, z: 0.96, r: 0.045 },
      celjusti: { r: [0.089, 0.166], a: [70, 125] },
      // (sklop 3 · skriti deli, js/deli/skriti.js) round the V8 in the bay: the filter against the block's left side, the turbo on its
      // right (the twins side by side there), the battery against the block's front, the control box on the block's top beside the
      // cover; the struts and bars at the wheels
      filter_zraka: { x: 1.45, y: 0.6, z: -0.42 }, akumulator: { x: 2.001, y: 0.35, z: 0.24, back: true }, turbo: { x: 1.7, y: 0.5, z: 0.37, twin: [-0.04, 0.05] }, cip: { x: 1.36, y: 0.714, z: 0.26 },
      vzmeti: { in: 0.155, top: 0.79 }, amortizerji: { in: 0.15, top: 0.77 }, stabilizatorji: { in: 0.15 }, dim_gum: {},
    },
    // the look (KIT API v1, render.js; look units = metres: the centre of mass at x 0, the axles at 1.40 / -1.50): one loft, the standard
    // regions split it into the parts. Seen from the chase camera: the ducktail and the lamp bar across the tail, the dark overfenders,
    // the four pipes, the long roof
    look: {
      body: { len: 4.95, wid: 2.04, roofY: 1.4,
        //       x      w     yb    ybelt  wt    yt    cr    kind  tuck
        secs: [[-2.53, 0.86, 0.3, 0.82, 0.76, 0.92, 0.02, 'b', 0.11],    // the tail's face: the lamp bar along its top, the diffuser under it
          [-2.46, 0.93, 0.29, 0.86, 0.84, 0.98, 0.03, 'b', 0.1],         // the boot lid's end (under the ducktail)
          [-1.98, 0.97, 0.28, 0.88, 0.8, 1.0, 0.03, 'gr', 0.1],          // the rear glass's foot
          [-1.18, 0.98, 0.28, 0.92, 0.62, 1.37, 0.05, 'r', 0.1],         // the roof's rear edge
          [-0.3, 0.98, 0.28, 0.93, 0.62, 1.4, 0.05, 'r', 0.1],           // the roof's top
          [0.15, 0.98, 0.28, 0.92, 0.64, 1.37, 0.05, 'gf', 0.1],         // the windscreen's top
          [1.05, 0.99, 0.29, 0.88, 0.82, 0.95, 0.05, 'b', 0.1],          // its base (the cowl)
          [1.95, 0.99, 0.28, 0.82, 0.84, 0.88, 0.05, 'b', 0.09],         // the long bonnet over the front wheels
          [2.28, 0.94, 0.25, 0.72, 0.78, 0.78, 0.03, 'b', 0.08],         // the nose's top
          [2.42, 0.86, 0.23, 0.62, 0.7, 0.66, 0.02, 'b', 0.07]],         // the nose's face: the grille
        eye: { x: -0.4, y: 1.08 },
      },
      wheels: { style: 'deep', w: 0.28, wR: 0.3, rim: [0.18, 0.18, 0.2], gap: 0.03 },
      build(K) {
        const P = K.paint, B = K.black, G = K.GLASS, DK = [0.08, 0.08, 0.09], D = [0.12, 0.12, 0.13], RED = [0.62, 0.04, 0.06];
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
        // the B-pillar and the C-pillar's foot black (four doors), the dark lower side, the start number on the rear doors
        DC.band([[-0.12, 0], [0.0, 0], [0.0, 1], [-0.12, 1]], B, null, 0.01);
        DC.band([[-1.2, 0], [-1.06, 0], [-1.06, 1], [-1.2, 1]], B, null, 0.01);
        DC.side([[XA + 0.03, 0.3], [XB - 0.03, 0.3], [XB - 0.03, 0.48], [XA + 0.03, 0.48]], DK, null, 0.006);
        for (const sd of [-1, 1]) {
          K.number(-0.62, 0.66, sd * 0.99, 0.3, { dir: sd < 0 ? '-z' : 'z' });
        }
        // (the garage's doors in the handles' place: K.deli, mounts.vrata)
        K.deli('vrata', () => { for (const sd of [-1, 1]) K.rect(0.42, 0.84, sd * 0.985, 0.13, 0.025, B, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' }); });
        // the dark bolted-on overfenders on all four arches
        for (const A of K.arches) for (const sd of [-1, 1]) K.flare(A.x, 0.38, 0.47, sd * 0.92, sd * 1.02, DK);
        // the long bonnet: the power bulge with its two dark vents (the garage's bonnet top in their place: K.deli, mounts.hauba)
        K.part('hood', () => K.deli('hauba', () => { K.box(1.45, 0.86, 0, 0.9, 0.06, 0.54, 0, K.shade(P, 0.92));
          for (const sd of [-1, 1]) DC.top([[1.2, sd * 0.32], [1.7, sd * 0.32], [1.7, sd * 0.45], [1.2, sd * 0.45]], DK, 0.004); }));
        // the nose: the slim lamps (each a part of its own; the garage's lamps in their place: K.deli, mounts.zarometi), the black band
        // between them
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(2.42, 0.56, sd * 0.62, 0.05, { shape: 'rect', w: 0.36, h: 0.055, ring: null, host: sd < 0 ? 'headL' : 'headR' }); });
        K.rect(2.425, 0.56, 0, 0.8, 0.035, B);
        // the front bumper: the wide grille, the splitter under it
        K.part('bumperF', () => {
          K.deli('maska', () => K.grille(2.423, 0.38, 0, 1.3, 0.24, { slats: 4 }));   // (the garage's grille in its place: mounts.maska)
        }, { hinge: [[2.3, 0.3, -0.8], [2.3, 0.3, 0.8]] });
        // the tail: the ducktail on the boot lid's end (the garage's wing in its place: K.deli, mounts.krilo), the slim lamps on the
        // corners (each a part of its own) joined by the red bar across the boot lid
        K.part('trunk', () => K.deli('krilo', () => K.wingPlank(-2.34, 0.99, -2.55, 1.03, 0.03, -0.84, 0.84, P)));
        K.rect(-2.532, 0.86, 0, 1.0, 0.03, RED, { dir: '-x', part: 'trunk' });
        for (const sd of [-1, 1]) { const tp = sd < 0 ? 'tailL' : 'tailR';
          K.rect(-2.532, 0.86, sd * 0.68, 0.34, 0.09, B, { dir: '-x', part: tp }); }
        K.deli('zadnje_luci', () => { for (const sd of [-1, 1]) K.tailLamp(-2.536, 0.86, sd * 0.68, 0.3, 0.06, { host: sd < 0 ? 'tailL' : 'tailR' }); });   // (the garage's: mounts.zadnje_luci)
        // the rear bumper: the dark diffuser, four pipes
        K.part('bumperR', () => {
          K.deli('auspuh', () => { for (const z of [-0.66, -0.52, 0.52, 0.66]) K.exhaust(-2.56, 0.27, z, 0.05, 0.2); });   // (the garage's in their place: mounts.auspuh)
        }, { hinge: [[-2.4, 0.3, -0.8], [-2.4, 0.3, 0.8]] });
        // the splitter and the dark diffuser (the garage's kit in their place, both kept by an option without a piece of its own there:
        // mounts.aero lipF, lipR)
        K.deli('aero', () => { K.part('bumperF', () => K.box(2.34, 0.15, 0, 0.3, 0.025, 1.96, 0, DK)); K.part('bumperR', () => K.box(-2.46, 0.15, 0, 0.14, 0.14, 1.4, 0, DK)); });
        // the black mirrors
        K.deli('ogledala', () => { for (const sd of [-1, 1]) K.mirror(0.82, 1.0, sd * 1.0, { col: B }); });   // (the garage's: mounts.ogledala)
        K.hinge('hood', [1.05, 0.96, -0.6], [1.05, 0.96, 0.6]);
        K.hinge('trunk', [-1.98, 0.99, -0.6], [-1.98, 0.99, 0.6]);
        K.hinge('doorL', [0.98, 0.42, -0.97], [0.98, 0.88, -0.97]); K.hinge('doorR', [0.98, 0.42, 0.97], [0.98, 0.88, 0.97]);
        // inside (seen once a part is off): the front seats, the rear bench, the dashboard, the V8 in the bay
        for (const sd of [-1, 1]) K.seat(-0.32, 0.44, sd * 0.4, { w: 0.5, back: 0.72 });
        K.seat(-1.12, 0.44, 0, { w: 1.3, back: 0.66 });
        K.box(0.8, 0.62, 0, 0.3, 0.22, 1.6, 0, D, null, false, { inner: true, part: 'body' });
        K.engine(1.6, 0.34, 0, { l: 0.8, w: 0.62, h: 0.52 });
        // the garage's parts with no stock one in their place (K.deli, mounts): the boot lid's panel, the aerials and the rear glass's
        // louvres, the indicators, the extra lamps, the roof's, the tow points, the flaps, the colours' and the hidden ones in the bay and
        // at the wheels
        K.part('trunk', () => K.deli('prtljaznik', () => {}));
        K.part('body', () => { K.deli('antena', () => {}); K.deli('zaluzije', () => {}); });
        for (const id of ['zmigavci', 'relijske_luci', 'streha', 'stresna_zajemalka', 'vlecne_kljuke', 'lovilci_blata', 'crte', 'nalepke', 'soncni_pas', 'celjusti', 'zamasek']) K.deli(id, () => {});
        for (const id of ['akumulator', 'filter_zraka', 'turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum']) K.deli(id, () => {});
      },
    },
  });
})();
