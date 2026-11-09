/* Vehicle 'miska' — MIŠKA: a tuned 1957-75 Italian micro city car, rear engine with its lid propped open. Signature features: 1) a tiny
   round two-box body with a short bonnet and a near-vertical tail, 2) the engine lid at the rear propped open on its stays, 3) round
   headlamps in the front wings and a chrome strip down the nose, 4) small wheels pushed to the corners under flared arches, 5) a canvas
   fold-back roof panel. L 2.97 W 1.32 H 1.33, wheelbase 1.84, overhangs F 0.50 R 0.63 (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  VEHICLE_DEFS.push({
    id: 'miska', name: 'MIŠKA', cat: 'mali', ord: 1, drive: 'RR',
    desc: 'Italijanski mestni malček iz 60-ih, predelan za dirke: pokrov motorja vedno priprt.',
    phys: { mass: 560, a: 0.99, b: 0.85, kI: 0.85, kw: 38, redline: 6800, idle: 900, gears: [3.4, 2.1, 1.42, 1], final: 4.18, rw: 0.26, cDrag: 0.45, len: 2.97, wid: 1.32, steerMax: 0.66,
      spinK: 0.5, sway: 1.1 },
    arc: { amax: 1.62, kv: 2, rmin: 3.6 },
    csp: { bx: 0.15, coast: -0.04, thr: 0.01, liftP: 0.16, pwr: 0.04, out: 1.25, turn: 1.1, w: 1 },   // (the RR layer: the engine behind the rear axle, a pendulum on a lift; its own turn, liftP, pwr)
    stats: { power: 1, grip: 5, weight: 10, drift: 7 },
    price: 6000, pk: 'ta1', field: ['miska'],
    snd: { kind: 'i2', hz: 1.3, loud: 0.8 },
    expect: { t100: [4.94, 5.8], vmax: [144, 153], latG: [2.05, 2.15], d100: [22.7, 25] },
    partNames: { headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamp', tailR: 'right tail lamp', wiperFront: 'windscreen wiper' },
    parts: { set: 'car', ht: 1.33, y0: 0.18,
      extra: {
        // (the head lamps parts of their own, out of their nacelles in the wings (the nacelles and their chrome bezels stay); the tail lamps
        // with their chrome rims out of the tail's face; the wipers on the cowl)
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.12, h: 0.06, lx: 1.02, lz: -0.62, y: 0.6 },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.12, h: 0.06, lx: 1.02, lz: 0.62, y: 0.6 },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.12, h: 0.04, lx: -1.0, lz: -0.68, y: 0.47 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.12, h: 0.04, lx: -1.0, lz: 0.68, y: 0.47 },
        wiperFront: { z: 0, th: 0.65, m: 0.5, r: 0.3, h: 0.03, lx: 0.43, lz: -0.05, y: 0.88 },
      },
      // (where the look has them: the bullet mirrors on the front wings, the engine lid propped open behind the tail)
      over: { mirrorL: { lx: 0.66, lz: -0.79, y: 0.84 }, mirrorR: { lx: 0.66, lz: 0.79, y: 0.84 }, trunk: { lx: -0.9, y: 0.76 },
        fenderL: { h: 0.11 }, fenderR: { h: 0.11 } } },   // (a wing wraps round the nose's end and carries the lamp's nacelle: an L lying 0.31 m tall)
    // where the garage's parts go (js/deli.js, js/deli/*.js, look units; docs/deli.md): the wing over the roof's back edge (over the rear
    // window; no part of its own: the body's), its proto fin up to the roof's crest (front); the head lamps set into the nacelles' fronts
    // (each option its own shape, nearly flush with the face: the stock lamp and its chrome bezel gone, the face in the paint), in the
    // lamps' parts; the rims on its wheels. None for the grille (it has none) nor the boot lid (the engine lid propped open)
    mounts: {
      krilo: { x: -0.584, w: 0.5, part: 'body', s: 0.9, front: -0.35 },
      zarometi: { x: 1.516, y0: 0.6, lean: 0, zc: 0.41, yc: 0.6, s: 0.4, hosts: ['headL', 'headR'], socket: 'host' },
      platisca: {},
      // (the front: the lip under the nose, the skirts between the arches, the rear's under the tail; the front lid (the louvres and
      // scoops where KOLIBRI's are from its front edge, as wide for its width); the indicators under the lamps in the wings, the repeaters
      // on the wings behind the arches, the rear's on the bumper; the rally lamps on the bumper's blade, before the nose on a tube, on it as
      // a bar, on the roof's front edge, in a pod on the blade under the lamps)
      aero: { xf: 1.49, xr: -1.48, w: 0.49, yf: 0.25, yr: 0.26, sill: [-0.54, 0.68], ws: 0.645, ys: 0.2, exh: [-0.16, 0.042], archIn: 0 },
      hauba: { x0: 0.66, x1: 1.43, w: 0.46, bulge: 0.55, rel: true, cells: 4 },
      zmigavci: { front: { x: 1.493, y: 0.47, z: 0.43, w: 0.075, h: 0.035, parts: ['fenderL', 'fenderR'] }, side: { x: 0.72, y: 0.62, z: 0.647 },
        rear: { x: -1.5205, y: 0.33, z: 0.36, part: 'bumperR' } },
      relijske_luci: { bumper: [1.49, 0.44, 0.13], nose: [1.49, 0.52], intake: [1.554, 0.385, 0.5, 0.05], roof: [0.225, 0.5], pod: [1.5, 0.36, 0.5, 0.46],
        foot: 0.36, part: 'bumperF' },
      // (the rear: the tail lamps' room either side of the tail's face, the band between them; the exhaust out under the tail on the left;
      // the tow points on the right overriders, the front arrow none with the rally lamps over it; the flaps behind the arches)
      zadnje_luci: { x: -1.463, zc: 0.45, yc: 0.47, w: 0.14, h: 0.3, s: 0.57, shape: [[-0.045, -0.085], [0.045, -0.085], [0.045, 0.085], [-0.045, 0.085]],
        hosts: ['tailL', 'tailR'], bar: { x: -1.484, y: 0.47, w: 0.36, h: 0.03, part: 'body' } },
      auspuh: { x: -1.545, y: 0.2, z: 0.16, r: 0.042, len: 0.23, part: 'body', drum: 0.185 },   // (drum: the silencer up against the bay's floor; len: the tips into it)
      vlecne_kljuke: { f: [1.5355, 0.33, 0.25], r: [-1.5305, 0.33, 0.26], underLamps: true },   // (on the right overriders: the straps clear of aero 5-8's lip and the tips, the arrows on the chrome; the rally lamps cover the front one's)
      lovilci_blata: { x: [0.66, -1.18], z: [0.5, 0.66], y: [0.3, 0.07], sill: [-0.53, 0.67, 0.21, 0.645], part: 'body' },
      // (the top: the louvres on the rear window, between the engine lid's hinge and the roof's back edge; on the roof between the
      // windscreen and the wing (back: all three end ahead of the proto fin's front), a sunroof in the canvas's place (wr: its panes no
      // wider than the canvas) and a scoop at its front, either with a hard top in the canvas's place; the aerials: the rod and the stub
      // on the right rail beside the canvas (behind the rally lamps' bar), the whip from the rail's front, the fins on the canvas's middle)
      zaluzije: { x0: -1.0, y0: 1.072, x1: -0.65, y1: 1.23, w: 0.27, part: 'body' },
      streha: { x0: -0.33, x1: 0.255, xf: 0.22, xr: -0.28, back: -0.33, wr: 0.4, part: 'body' },
      stresna_zajemalka: { x: 0.2, z: 0, back: -0.33, wr: 0.4, part: 'body' },
      antena: { x: 0.1, z: 0.42, fin: [-0.31, 0], front: [0.12, 0.42], whip: 0.25, part: 'body' },
      // (the sides: door mirrors at the doors' front corners (the stock bullets on the wings gone); the doors inside their shut lines,
      // the glass from the B-pillar to the A-pillar, its frame the pillar's; the brakes and nuts for its small wheels)
      ogledala: { x: 0.52, y: 0.79, z: 0.7, w: 0.085, h: 0.065, d: 0.1, z0: 0.61 },
      vrata: { x: [-0.354, 0.612], y: [0.31, 0.8], handle: [0.5, 0.75, 0.645, 0.1, 0.022],
        win: [[-0.345, 0.045], [0.45, 0.045], [0.265, 0.93], [-0.345, 0.93]], frame: [-0.36, -0.345, 0.93, 1.0], netIn: 0.003 },
      zavore: { s: 0.95 },
      matice: { k: 4, r: 0.2 },
      // (the paint: the stripes over the front lid and behind the rear window (not over the open bay nor the canvas); the decals on the
      // doors' back halves (their roundels gone), the wings over the arches, the lid beside its number; the sun strip; the filler on the
      // right front wing; the calipers for its wheels)
      barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {},
      crte: { z: [0.24, 0.365], x: [[-1.157, -0.584], [0.27, 9]] },
      nalepke: { side: [[-0.34, 0.25], [0.78, 1.4], [-1.15, -0.4]], y: [0.62, 0.76], hood: { x: [0.7, 1.3], z: [0.27, 0.45] } },
      soncni_pas: { x: [0.275, 0.32], lift: 0.009 }, zamasek: { x: 1.15, y: 0.65, z: 0.64, r: 0.04 },
      celjusti: { r: [0.072, 0.135], a: [70, 125] },
      // (the hidden ones in the engine bay beside the twin: the battery on its floor on the left, the filter on the twin's left (beside it
      // the gap at the propped lid's front edge), the turbo low on the right; the chip behind the rear seat, its loom through the firewall;
      // the springs and dampers in the arches)
      akumulator: { x: -1.36, y: 0.255, z: -0.46, back: true }, filter_zraka: { x: -1.3, y: 0.4, z: -0.18 }, turbo: { x: -1.3, y: 0.3, z: 0.33, twin: [-0.04, 0.055] }, cip: { x: -1.06, y: 0.45, z: 0.3 },
      vzmeti: { in: 0.13, top: 0.6 }, amortizerji: { in: 0.13, top: 0.6 }, stabilizatorji: { in: 0.13 }, dim_gum: {},
    },
    // the look (KIT API v1, render.js; look units = metres): a round bubble lofted through the sections below. The standard regions cut it
    // into the front lid (the bonnet over the luggage well), the front wings with their lamps, the (rear-hinged) doors with their glass, the
    // rear wings and the bumpers; the engine bay under the lid is open (its top panels null: lined, floored, the firewall a bulkhead) with
    // the twin in it, and the lid itself ('trunk') stands propped open on its stays over it (the trunk's region moved off the loft: the lid
    // alone). The canvas is the roof's crown with strips laid over its edges (its bows, the folded canvas at the back; with the garage's
    // sunroof or scoop a hard top in its place, the crown in the paint), the rear window
    // the crown of its segment with glass strips on the edges; the start number on the front lid, roundels on the doors
    look: {
      body: { len: 2.97, wid: 1.32, roofY: 1.33, wz: 0.07,
        //       x       w      yb     ybelt  wt     yt     cr     kind  tuck
        secs: [[-1.48, 0.49, 0.26, 0.54, 0.42, 0.58, 0.012, 'b', 0.07],      // the tail: its face (the lamps), the bumper
          [-1.43, 0.565, 0.235, 0.58, 0.37, 0.6, 0.015, 'b', 0.08],         // the engine bay's lower edge (the lid's, closed)
          [-1.33, 0.615, 0.215, 0.66, 0.36, 0.72, 0.02, 'b', 0.09],         // the lid's bend (the louvres over it)
          [-1.157, 0.64, 0.205, 0.77, 0.35, 0.9, 0.025, 'b', 0.1],          // the lid's hinge (the rear arch's end)
          [-1.004, 0.645, 0.2, 0.8, 0.44, 1.03, 0.04, 'gr', 0.1],           // the rear window's foot
          [-0.584, 0.645, 0.2, 0.81, 0.5, 1.16, 0.1, 'r', 0.1],             // the roof's back edge (the rear arch's front end)
          [-0.36, 0.645, 0.2, 0.81, 0.51, 1.19, 0.14, 'r', 0.1],            // the roof's crest (the doors' back edge)
          [0.27, 0.645, 0.2, 0.8, 0.5, 1.15, 0.11, 'gf', 0.1],              // the windscreen's top
          [0.62, 0.64, 0.2, 0.77, 0.57, 0.82, 0.05, 'b', 0.1],              // its base (the cowl; the doors' front edge)
          [1.1435, 0.64, 0.205, 0.74, 0.55, 0.78, 0.055, 'b', 0.1],         // the front lid's dome (on the front arch's cut)
          [1.2967, 0.625, 0.215, 0.72, 0.52, 0.755, 0.05, 'b', 0.09],       // (the front arch's end)
          [1.43, 0.585, 0.23, 0.69, 0.46, 0.72, 0.04, 'b', 0.08],           // the wings' round ends (the bumper's depth)
          [1.49, 0.5, 0.25, 0.66, 0.37, 0.685, 0.025, 'b', 0.07]],          // the nose: the lamps' face, the lid's lip over it
        eye: { x: -0.3, y: 1.08, style: 'closed' },
        decalX: 0.92, decalY: 0.851, decalRz: -0.067, decalS: 0.47, decalPart: 'hood',   // (the start number on the front lid, as the old racers had it)
        door: [0.62, -0.36], bumpY: [0.37, 0.37], bumpR: 0.05, engine: [-1.29, 0.7], engRear: true },
      wheels: { style: 'deep', spokes: 8, w: 0.15, gap: 0.05, rim: [0.78, 0.79, 0.82], cap: [0.3, 0.3, 0.32] },
      // (the standard regions, the boot's moved off the loft: the propped lid is drawn whole in 'trunk'; the bay under it stays the body's)
      regions: (std) => std.map(r => r.part === 'trunk' ? Object.assign({}, r, { x: [-2.4, -1.9] }) : r),
      build(K) {
        const P = K.paint, S = K.strp, B = K.black, CH = K.chrome, G = K.GLASS, WH = [0.95, 0.95, 0.93], SH = K.shade(P, 0.42);
        const CV = [0.15, 0.145, 0.14], SEAM = [0.3, 0.29, 0.27], AL = [0.6, 0.61, 0.63], EB = [0.16, 0.16, 0.17];
        const HARD = !!(K.fitted.streha || K.fitted.stresna_zajemalka);   // (the garage's sunroof or scoop: a hard top in the canvas's place)
        const XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;   // (the sills between the arches)
        // the shell: the paint; the glass (the windscreen with the vent windows, the side windows, the rear window's middle); the canvas
        // the roof's crown; the engine bay's top open under the lid (e 3..5 null); the sills dark, the arches' ledges black
        const L = K.loft(K.secs(K.body.secs), (k, e, kind, at) => {
          if (e === 0 || e === 8) return at.arch ? B : at.x > XA && at.x < XB ? K.shade(P, 0.5) : K.shade(P, 0.62);
          if (k >= 1 && k <= 2 && e >= 3 && e <= 5) return null;                               // (the engine bay, open under the lid)
          if (kind === 'gf' && e >= 2 && e <= 6) return G;
          if (kind === 'r' && (e === 2 || e === 6)) return G;
          if (kind === 'r' && e === 4) return HARD ? P : CV;                                    // (the canvas: the crown, the edges' strips below)
          if (kind === 'gr' && e === 4) return G;                                               // (the rear window: the crown, its sides below)
          return P;
        }, { glass: (k, e, kind) => kind === 'gr' && (e === 3 || e === 5), caps: { front: { col: P }, rear: { col: P } } });
        const D = L.decal, top = (x, z) => L.topY(x, z);
        // ---- the greenhouse: the rear window's sides (glass on the painted edges, marked), the pillars, the window's chrome sill ----
        for (const sd of [-1, 1]) D.top([[-1.0, sd * 0.16], [-0.59, sd * 0.18], [-0.59, sd * 0.31], [-1.0, sd * 0.26]], G, 0.006);
        D.band([[-0.39, 0], [-0.345, 0], [-0.345, 1], [-0.39, 1]], P, null, 0.008);            // the B-pillar (the door's back edge)
        D.band([[-0.6, 0], [0.61, 0], [0.61, 0.045], [-0.6, 0.045]], CH, null, 0.006);           // the window's chrome sill line
        D.band([[-0.6, 0.93], [0.27, 0.93], [0.27, 1], [-0.6, 1]], P, null, 0.007);           // under the roof's edge (the drip rail)
        for (const sd of [-1, 1]) K.bar([0.615, 0.82, sd * 0.572], [0.268, 1.155, sd * 0.502], 0.022, P, { n: 4, part: 'body' });   // the A-pillars
        // the doors' shut lines (front and back edges, down the flat side)
        for (const x of [0.618, -0.36]) D.side([[x - 0.006, 0.31], [x + 0.006, 0.31], [x + 0.006, 0.9], [x - 0.006, 0.9]], SH, null, 0.004);
        // ---- the canvas roof: the crown and the edges' strips (the painted rails either side), its bows, the folded canvas at the back ----
        if (!HARD) {
          for (const sd of [-1, 1]) D.top([[-0.584, sd * 0.185], [0.255, sd * 0.185], [0.255, sd * 0.37], [-0.584, sd * 0.37]], CV, 0.006);
          for (const x of [-0.3, -0.06, 0.16]) D.top([[x - 0.015, -0.18], [x + 0.015, -0.18], [x + 0.015, 0.18], [x - 0.015, 0.18]], SEAM, 0.006);
          for (const sd of [-1, 1]) K.cyl([-0.56, top(-0.56, 0) + 0.022, 0], [-0.56, top(-0.56, 0.37) + 0.02, sd * 0.37], 0.03, CV, { n: 6, capA: null, part: 'body' });
        }
        // ---- the front: the lid's chrome strip down the nose (along the crown, on down the face), the lamps in the wings' round ends ----
        //   (the garage's front lid in its place, in the lid's part: K.deli, mounts.hauba; the strip goes with the stock lid)
        K.part('hood', () => K.deli('hauba', () => { const xs = [0.66, 1.1435, 1.2967, 1.43, 1.49];
          for (let i = 0; i < 4; i++) { const x0 = xs[i], x1 = xs[i + 1], y0 = top(x0, 0) + 0.005, y1 = top(x1, 0) + 0.005;
            K.face([[x0, y0, -0.014], [x0, y0, 0.014], [x1, y1, 0.014], [x1, y1, -0.014]], CH); }
          K.rect(1.493, 0.545, 0, 0.028, 0.33, CH, { part: 'body' }); }));   // (down the nose's face: the body's, below the lid)
        //   (the lamps parts of their own; the garage's lamps in their place, set into the nacelle's face: K.deli, mounts.zarometi; with one
        //   the nacelle's face is the paint, no chrome bezel)
        K.deli('zmigavci', () => { for (const sd of [-1, 1]) K.rect(1.493, 0.47, sd * 0.43, 0.075, 0.035, K.rgb(0xff9a1e), { host: sd < 0 ? 'fenderL' : 'fenderR' }); });   // the indicator under the lamp (the garage's: mounts.zmigavci)
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(1.524, 0.6, sd * 0.41, 0.066, { host: sd < 0 ? 'headL' : 'headR', ring: null, n: 8 }); },
          (zn) => { for (const sd of [-1, 1]) K.cyl([1.44, 0.6, sd * 0.41], [1.52, 0.6, sd * 0.41], 0.085, P, { n: 8, part: sd < 0 ? 'fenderL' : 'fenderR', capA: null, capB: zn ? P : CH }); });   // the lamp's nacelle out of the wing, its chrome bezel
        for (const z of [-0.3, 0.12]) K.bar([0.66, 0.876, z - 0.2], [0.63, 0.886, z + 0.2], 0.009, B, { n: 4, part: 'wiperFront' });   // the wipers (a part: both blades come off together)
        // ---- the bullet mirrors on the front wings (mirrorL / mirrorR): chrome, the glass their back face, on stalks (the garage's on the
        //      doors in their place: K.deli, mounts.ogledala) ----
        K.deli('ogledala', () => { for (const sd of [-1, 1]) { const part = sd < 0 ? 'mirrorL' : 'mirrorR', y0 = top(0.99, 0.52), y = y0 + 0.075, z = sd * 0.52;
          K.cyl([1.03, y, z], [0.95, y, z], 0.018, CH, { r2: 0.034, n: 6, capB: [0.42, 0.47, 0.54], part });
          K.bar([0.99, y0 - 0.01, z], [0.985, y - 0.02, z], 0.01, CH, { n: 4, part }); } });
        // ---- the flares over the wheels pushed to the corners (paint, riveted on) ----
        for (const A of K.arches) for (const sd of [-1, 1]) K.flare(A.x, 0.31, 0.37, sd * 0.6, sd * 0.685, P, { n: 5 });
        // ---- the livery: a stripe along the sills, a roundel with the number on each (rear-hinged) door, its handle at the front edge (the
        //      garage's decals in the roundels' place, its doors' handles in the handles': K.deli, mounts.nalepke, vrata) ----
        D.side([[XA + 0.03, 0.32], [XB - 0.03, 0.32], [XB - 0.03, 0.385], [XA + 0.03, 0.385]], S, null, 0.006);
        K.deli('nalepke', () => { for (const sd of [-1, 1]) {
          const d = sd < 0 ? 'doorL' : 'doorR', dir = sd < 0 ? '-z' : 'z', z = sd * 0.651, ring = [];
          for (let i = 0; i < 12; i++) { const a = (sd > 0 ? i : -i) * Math.PI / 6; ring.push([0.1 + Math.cos(a) * 0.165, 0.6 + Math.sin(a) * 0.165, z]); }
          K.face(ring, WH, { host: d });
          K.number(0.1, 0.6, sd * 0.654, 0.19, { dir, w: 0.24, bg: WH, host: d }); } });
        K.deli('vrata', () => { for (const sd of [-1, 1]) K.rect(0.5, 0.75, sd * 0.652, 0.1, 0.022, CH, { dir: sd < 0 ? '-z' : 'z', host: sd < 0 ? 'doorL' : 'doorR' }); });
        for (const sd of [-1, 1]) K.hinge(sd < 0 ? 'doorL' : 'doorR', [-0.36, 0.3, sd * 0.645], [-0.36, 0.84, sd * 0.645]);   // (suicide doors: hinged at the B-pillar)
        // ---- the bumpers: thin chrome blades, two overriders each ----
        for (const [part, x, s] of [['bumperF', 1.505, 1], ['bumperR', -1.5, -1]]) K.part(part, () => {
          K.box(x, 0.3, 0, 0.04, 0.06, 1.0, 0, CH);
          for (const sd of [-1, 1]) K.box(x + s * 0.008, 0.25, sd * 0.25, 0.045, 0.16, 0.05, 0, CH);
        });
        // ---- the tail: the lamps either side of its face (chrome rims), the exhaust's tip ----
        K.deli('zadnje_luci', () => { for (const sd of [-1, 1]) { const tp = sd < 0 ? 'tailL' : 'tailR';   // (parts of their own: the rim and the lit lens leave together)
          K.rect(-1.482, 0.47, sd * 0.45, 0.09, 0.17, CH, { dir: '-x', part: tp }); K.tailLamp(-1.484, 0.47, sd * 0.45, 0.07, 0.14, { host: tp }); } });
        K.deli('auspuh', () => K.exhaust(-1.545, 0.2, -0.16, 0.042, 0.2, { n: 8, part: 'body' }));   // (the garage's: mounts.auspuh)
        // ---- the engine lid ('trunk'): hinged under the rear window, propped open by 34 degrees on two stays; louvres in its upper half ----
        const H = [-1.157, 0.925], th = -34 * Math.PI / 180, ct = Math.cos(th), st = Math.sin(th);
        const rot = (p) => { const dx = p[0] - H[0], dy = p[1] - H[1]; return [H[0] + dx * ct - dy * st, H[1] + dx * st + dy * ct, p[2]]; };
        const lidC = [[-1.157, 0.928], [-1.33, 0.743], [-1.435, 0.618]], LW = [0.3, 0.34, 0.355], T = 0.03;   // (the closed lid's crest line, its half widths)
        const nrm = (i) => { const a = lidC[Math.max(0, i - 1)], b = lidC[Math.min(2, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [dy / l, -dx / l]; };   // (outward: up and back)
        const ringAt = (i) => { const c = lidC[i], n = nrm(i), w = LW[i]; return [[c[0], c[1], -w], [c[0], c[1], w], [c[0] - n[0] * T, c[1] - n[1] * T, w * 0.98], [c[0] - n[0] * T, c[1] - n[1] * T, -w * 0.98]].map(rot); };
        K.part('trunk', () => {
          K.skin([0, 1, 2].map(ringAt), (k, e) => e === 2 ? K.shade(P, 0.7) : P, P, P);
          // the louvres: dark slots across the upper half (on its outer face, facing up and back)
          const n = nrm(0), a = lidC[0], b = lidC[1], N = [n[0] * ct - n[1] * st, n[0] * st + n[1] * ct], on = (t, z) => rot([a[0] + (b[0] - a[0]) * t + n[0] * 0.003, a[1] + (b[1] - a[1]) * t + n[1] * 0.003, z]);
          for (let i = 0; i < 5; i++) { const t0 = 0.14 + i * 0.16, t1 = t0 + 0.08, pts = [on(t0, -0.22), on(t0, 0.22), on(t1, 0.22), on(t1, -0.22)];
            const u = [pts[1][0] - pts[0][0], pts[1][1] - pts[0][1], pts[1][2] - pts[0][2]], v = [pts[2][0] - pts[0][0], pts[2][1] - pts[0][1], pts[2][2] - pts[0][2]];
            K.face((u[1] * v[2] - u[2] * v[1]) * N[0] + (u[2] * v[0] - u[0] * v[2]) * N[1] >= 0 ? pts : pts.reverse(), B); }
          // the stays: from the lid's lower corners down to the bay's edge
          for (const sd of [-1, 1]) { const q = rot([lidC[2][0] + 0.03, lidC[2][1] + 0.01, sd * 0.3]); K.bar(q, [-1.425, 0.61, sd * 0.31], 0.01, CH, { n: 4 }); }
        }, { hinge: [[H[0], H[1], -0.3], [H[0], H[1], 0.3]] });
        K.part('body', () => K.deli('krilo', () => {}));   // (the garage's wing over the roof's back edge: mounts.krilo; none stock)
        K.part('body', () => { for (const id of ['streha', 'stresna_zajemalka', 'antena']) K.deli(id, () => {}); });   // (the garage's on the roof: mounts.streha ...; none stock)
        // (the garage's parts with nothing stock in their place: K.deli, mounts; the louvres on the rear window the body's, as the window)
        for (const id of ['aero', 'relijske_luci', 'vlecne_kljuke', 'lovilci_blata', 'crte', 'soncni_pas', 'celjusti', 'zamasek']) K.deli(id, () => {});
        K.part('body', () => K.deli('zaluzije', () => {}));
        for (const id of ['akumulator', 'filter_zraka', 'turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum']) K.deli(id, () => {});
        // ---- the twin in the open bay (the outer shell: in sight under the lid): its block, the cooling shroud, the air filter, the coil ----
        K.part('body', () => {
          K.box(-1.29, 0.26, 0, 0.2, 0.22, 0.5, 0, AL, null, true);                           // the crankcase, the finned sump
          K.box(-1.29, 0.48, 0.02, 0.2, 0.16, 0.44, 0, EB, null, true);                       // the cooling shroud over the cylinders
          K.cyl([-1.29, 0.64, -0.08], [-1.29, 0.7, -0.08], 0.115, CH, { n: 8, capA: null });   // the air filter, chrome
          K.box(-1.3, 0.64, 0.17, 0.09, 0.07, 0.1, 0, [0.72, 0.1, 0.08], null, true);        // the coil (red)
        });
        // ---- hinges: the front lid at the cowl ----
        K.hinge('hood', [0.63, 0.87, -0.45], [0.63, 0.87, 0.45]);
        // ---- inside (seen once a part is off): the seats, the roll hoop behind them, the painted dash and the wheel, the luggage well (the
        //      spare lying in it, the fuel tank) ----
        for (const sd of [-1, 1]) K.seat(-0.22, 0.46, sd * 0.28, { w: 0.42, l: 0.42, back: 0.58 });
        K.seat(-0.78, 0.44, 0, { w: 0.92, l: 0.34, back: 0.42 });
        K.cage([[[-0.5, 0.3, -0.52], [-0.5, 1.1, -0.44]], [[-0.5, 1.1, -0.44], [-0.5, 1.1, 0.44]], [[-0.5, 1.1, 0.44], [-0.5, 0.3, 0.52]], [[-0.5, 1.08, -0.4], [-0.95, 0.62, -0.42]], [[-0.5, 1.08, 0.4], [-0.95, 0.62, 0.42]]], 0.022, [0.85, 0.86, 0.88]);
        K.box(0.5, 0.66, 0, 0.12, 0.12, 1.1, 0, P, null, false, { inner: true, part: 'body' });
        K.inner(() => K.part('body', () => {   // the big thin steering wheel (left-hand drive), its column to the dash
          const C = [0.27, 0.8, -0.28], R = 0.17, a = 0.45, pt = (t) => [C[0] + Math.sin(a) * R * Math.sin(t), C[1] + Math.cos(a) * R * Math.sin(t), C[2] + R * Math.cos(t)];
          for (let i = 0; i < 8; i++) K.bar(pt(i * Math.PI / 4), pt((i + 1) * Math.PI / 4), 0.012, B, { n: 3 });
          K.bar([0.48, 0.66, -0.28], C, 0.016, [0.3, 0.3, 0.32], { n: 4 }); }));
        K.tyre(1.12, 0.36, -0.12, { axis: 'y', inner: true, part: 'body' });
        K.box(1.0, 0.3, 0.33, 0.3, 0.32, 0.22, 0, [0.42, 0.43, 0.45], null, false, { inner: true, part: 'body' });
      },
    },
  });
})();
