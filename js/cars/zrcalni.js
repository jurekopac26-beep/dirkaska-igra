/* Vehicle 'zrcalni' — ZRCALNI VLAK: a road train (docs/zrcalni-vlak.md). A black bonneted off-road tractor (the KAMEN PUŠČAVA's cab and
   running gear, its service body off: a fifth wheel over its rear axle, two chrome stacks behind the cab, a roof rack with cans and a
   spare tyre, the grille guard), a mirror-polished stainless tank semi-trailer on its fifth wheel, a dolly behind that one (a B-dolly:
   two drawbars hold it in line with the first tank; its own fifth wheel) and a second mirror tank on the dolly. Two joints: the tractor's
   fifth wheel and the dolly's (Core: tlStep, model.trailer and its next). The tanks' mirror is no live mirror: the picture has the sky,
   the horizon and the ground baked in it (paint), and the renderer mixes in its sky's reflection (trailer.look.mirror: the race's
   environment map, js/render.js tlBuild) only where the picture is the tank's skin; no draw calls more.
   Tractor L 6.30 W 2.50 H 3.30 (the garage's clearance: its door's bar and its lamps hang at 3.46 m, no part of a car above 3.3 m); each tank trailer L 11.40 W 2.50 H 3.62, its kingpin 0.90 behind its front, two axles 7.4 and 8.7 m
   behind its kingpin; the dolly's fifth wheel 12.6 m behind the first kingpin, its axles at 12.0 and 13.2 m; the train ~25 m (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  // the garage's head lamp outline (as the KAMEN's: u out from the car's middle, v up; metres round z 0.96, y 1.36)
  const LAMP = [[-0.17, -0.075], [0.17, -0.075], [0.17, 0.075], [-0.17, 0.075]];

  // ---- a tank trailer: its size (m: x from its kingpin, its middle yc above the ground, half its height ry, half its width rz), its hoops ----
  const TK = { x0: -10.15, x1: 0.55, yc: 2.52, ry: 1.0, rz: 1.12, dome: 0.3 };
  const HOOPS = [-0.6, -2.7, -4.8, -6.9, -9.0], COVERS = [-1.6, -4.6, -7.8];
  const DOLLY = { k: -12.6, ax: [-12.0, -13.2] };   // (the B-dolly behind the first tank: its fifth wheel, its axles, from the first kingpin)
  // the picture (1024 x 512 px): the skin (x0 to x1 along; around from the bottom up the +z side, over the top, down the -z side), the domed
  // ends (as seen from outside), the catwalk's grating, the bumper's label
  const PIC = { skin: [0, 0, 1024, 380], end: [0, 384, 128, 512], grate: [128, 384, 1016, 448], label: [128, 448, 672, 512] };
  const lcg = (s) => () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;   // (its own numbers: the same picture every time)
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const css = (c, a) => 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (a == null ? 1 : a) + ')';
  // what a polished tank shows at a point whose normal looks el up (-1 down .. 1 up; a viewer level with it): the sky above (pale at the
  // horizon, blue overhead), a bright line at the horizon, the far hills dark under it, the road and its verge below, darker straight down
  const SKY0 = [222, 232, 240], SKY1 = [118, 158, 214], HOR = [246, 248, 250], HILL = [58, 66, 62], ROAD = [104, 102, 98], LOW = [52, 50, 48];
  function seen(el) {
    const r = Math.sin(el * Math.PI / 2) * 2;   // (the reflected ray's height: twice the normal's)
    if (r > 0.06) return mixc(SKY0, SKY1, Math.min(1, (r - 0.06) / 1.3));
    if (r > 0) return mixc(HOR, SKY0, r / 0.06);
    if (r > -0.12) return mixc(HILL, mixc(HILL, ROAD, 0.3), -r / 0.12);
    return mixc(ROAD, LOW, Math.min(1, (-r - 0.12) / 1.0));
  }
  function paint(g) {
    const rnd = lcg(20261105), r = (a, b) => a + (b - a) * rnd(), TAU = Math.PI * 2;
    const [S0, S1, S2, S3] = PIC.skin, SH = S3 - S1;
    // the skin: row by row, what the polish shows at that angle round the tank (f 0 the bottom, pi the top)
    for (let y = S1; y < S3; y++) { const f = (y - S1 + 0.5) / SH * TAU, el = -Math.cos(f); g.fillStyle = css(seen(Math.asin(el) / (Math.PI / 2))); g.fillRect(S0, y, S2 - S0, 1); }
    // the far tree line and hills in the dark band (both sides: just under the horizon line), a few posts, the polish's long faint streaks
    for (const side of [1, -1]) {
      const yh = S1 + SH * (side > 0 ? 0.5 - 0.055 : 0.5 + 0.055), dn = side > 0 ? -1 : 1;
      g.fillStyle = css([44, 52, 48], 0.85);
      for (let x = S0; x < S2; x += 4) { const h = 2 + 5 * Math.abs(Math.sin(x * 0.013 + side)) + r(0, 3); g.fillRect(x, side > 0 ? yh - h : yh, 4, h); }
      g.fillStyle = css([30, 32, 30], 0.6);
      for (let i = 0; i < 18; i++) { const x = r(S0, S2); g.fillRect(x, side > 0 ? yh - r(10, 18) : yh, 2, r(10, 18)); }
      void dn;
    }
    for (let i = 0; i < 260; i++) { g.fillStyle = css(rnd() < 0.5 ? [255, 255, 255] : [40, 44, 50], r(0.03, 0.09)); g.fillRect(S0, r(S1, S3), S2 - S0, r(1, 3)); }
    // the welded seams round the tank between its hoops (faint darker lines across)
    g.fillStyle = css([70, 74, 80], 0.35);
    const LEN = TK.x1 - TK.x0, PX = (x) => S0 + (x - TK.x0) / LEN * (S2 - S0);
    for (const x of [-1.65, -3.75, -5.85, -7.95]) g.fillRect(PX(x) - 1, S1, 2, SH);
    // the ends (domes): the sky round their rim, the road and the follower dark in their middle
    const [E0, E1, E2, E3] = PIC.end, ec = [(E0 + E2) / 2, (E1 + E3) / 2], ER = (E2 - E0) / 2;
    const gr = g.createRadialGradient(ec[0], ec[1] - ER * 0.2, ER * 0.05, ec[0], ec[1], ER);
    gr.addColorStop(0, css([80, 80, 82])); gr.addColorStop(0.55, css([150, 156, 162])); gr.addColorStop(0.8, css(SKY0)); gr.addColorStop(1, css([200, 210, 220]));
    g.fillStyle = gr; g.fillRect(E0, E1, E2 - E0, E3 - E1);
    g.fillStyle = css(HILL, 0.8); g.fillRect(E0, ec[1] + ER * 0.08, E2 - E0, ER * 0.1);
    // the catwalk's grating: dark aluminium checker
    const [G0, G1, G2, G3] = PIC.grate;
    g.fillStyle = '#5d6168'; g.fillRect(G0, G1, G2 - G0, G3 - G1);
    g.fillStyle = '#3a3d42'; for (let x = G0; x < G2; x += 6) for (let y = G1; y < G3; y += 6) if (((x - G0) / 6 + (y - G1) / 6) % 2 === 0) g.fillRect(x, y, 3, 3);
    // the bumper's label: generic, no brand
    const [L0, L1, L2, L3] = PIC.label;
    g.fillStyle = '#c9cdd2'; g.fillRect(L0, L1, L2 - L0, L3 - L1);
    for (let x = L0; x < L2; x += 48) { g.fillStyle = '#b3201c'; g.beginPath(); g.moveTo(x, L3); g.lineTo(x + 24, L1); g.lineTo(x + 48, L1); g.lineTo(x + 24, L3); g.fill(); }
    g.fillStyle = '#111'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#f2f2f2'; g.fillRect((L0 + L2) / 2 - 150, L1 + 8, 300, L3 - L1 - 16); g.fillStyle = '#111'; g.fillText('FLAMMABLE', (L0 + L2) / 2, (L1 + L3) / 2 + 2);
  }

  // ---- a tank trailer's pieces (the renderer's builder B; its metres: x forward from the kingpin, y up from the ground, z across). B.lo: 0 the
  // look (the player's trailers, the previews), 1 the light look (a rival's: fewer sides, no small parts), 2 the shadow (the shadow map only).
  // first: the first tank, with the B-dolly behind it (its drawbars, its frame, its fifth wheel, its axles: rigid to this tank)
  function tank(B, first) {
    const DK = 0x1b1c1e, STEEL = 0xb9bec5, SHINE = 0xd9dde2, AL = 0xc3c7cc, TYRE = 0x1a1a1a, RIM = 0xc8ccd2, RED = 0xb3201c, BLK = 0x121212;
    const lo = B.lo || 0, full = !lo, sh = lo === 2;
    B.tex(1024, 512, paint);
    // the frame: its rails, the kingpin's plate, the cradles under the tank
    for (const sd of [-1, 1]) B.box(-5.0, 1.33, sd * 0.5, 11.3, 0.22, 0.14, DK);
    B.box(-0.2, 1.26, 0, 2.1, 0.08, 1.9, DK);
    if (!sh) for (const x of [-0.3, -5.0, -9.6]) B.box(x, 1.54, 0, 0.3, 0.16, 1.7, DK);
    // the tank: polished, its hoops, the covers and the catwalk with its railing on top
    B.tank(TK.x0, TK.x1, TK.yc, TK.ry, TK.rz, { n: [32, 16, 10][lo], uv: PIC.skin, end: PIC.end, dome: TK.dome });
    if (!sh) for (const x of full ? HOOPS : HOOPS.filter((_, i) => i % 2 === 0)) B.hoop(x, TK.yc, TK.ry, TK.rz, full ? 0.1 : 0.14, 0.03, SHINE, { n: full ? 32 : 16, flat: !full });   // (a rival's: every other hoop, its outer face only: the phone's budget of a field of trains, browser/fleet)
    const top = TK.yc + TK.ry;
    if (!sh) {
      B.box(-4.8, top + 0.03, 0, 9.2, 0.04, 0.56, 0x5d6168, { face: '+y', uv: PIC.grate });
      for (const x of COVERS) { B.cyl([x, top, 0], [x, top + 0.2, 0], 0.3, STEEL, { n: full ? 12 : 6 }); if (full) B.cyl([x, top + 0.2, 0], [x, top + 0.24, 0], 0.33, SHINE, { n: 12 }); }
      for (const sd of [-1, 1]) { if (full) for (const x of [-0.8, -2.5, -4.2, -5.9, -7.6, -9.2]) B.box(x, top + 0.3, sd * 0.42, 0.04, 0.56, 0.04, SHINE); B.box(-5.0, top + 0.58, sd * 0.42, 8.44, 0.04, 0.04, SHINE); }
    }
    // the landing gear, the side guards (two aluminium rails), the red cabinet on the +z side (the valves' and the hoses' locker)
    if (!sh) for (const sd of [-1, 1]) { B.box(-2.2, 0.8, sd * 0.55, 0.14, 1.0, 0.14, DK); if (full) B.box(-2.2, 0.32, sd * 0.55, 0.32, 0.05, 0.32, DK); }
    if (!sh) for (const sd of [-1, 1]) for (const y of [0.62, 0.92]) B.box(-4.4, y, sd * 1.17, 3.8, 0.1, 0.04, AL);
    B.box(-5.75, 1.0, 0.88, 1.1, 0.62, 0.42, RED);
    if (full) { B.box(-5.75, 1.0, 1.095, 0.02, 0.5, 0.02, 0x7a1612); B.box(-5.45, 1.08, 1.1, 0.12, 0.04, 0.03, 0xd8d8d8); }
    // the wheels on its two axles (polished rims), the stainless mudguards over them, the mud flaps behind
    const wheels = (axs, y0) => {
      for (const ax of axs) {
        if (!sh) B.box(ax, 0.5, 0, 0.12, 0.12, 1.72, DK);
        for (const sd of [-1, 1]) {
          if (full) { B.cyl([ax, 0.5, sd * 0.86], [ax, 0.5, sd * 1.22], 0.5, TYRE, { n: 14 }); B.cyl([ax, 0.5, sd * 1.22], [ax, 0.5, sd * 1.235], 0.31, RIM, { n: 12 }); B.cyl([ax, 0.5, sd * 1.235], [ax, 0.5, sd * 1.25], 0.1, SHINE, { n: 8 }); }
          else B.cyl([ax, 0.5, sd * 0.86], [ax, 0.5, sd * 1.23], 0.5, TYRE, { n: sh ? 6 : 8, capK: RIM });
        }
      }
      const xm = (axs[0] + axs[axs.length - 1]) / 2, w = Math.abs(axs[0] - axs[axs.length - 1]) + 1.25;
      for (const sd of [-1, 1]) { B.box(xm, y0, sd * 1.04, w, 0.05, 0.44, STEEL); if (!sh) B.box(xm - w / 2 + 0.02, 0.68, sd * 1.04, 0.02, 0.8, 0.4, BLK); }
    };
    wheels([-7.4, -8.7], 1.1);
    // the rear: the underrun bar with its label, the lamps, the ladder up to the catwalk
    B.box(-10.62, 0.42, 0, 0.08, 0.2, 1.8, 0xc9cdd2, { face: '-x', uv: PIC.label });
    if (!sh) for (const sd of [-1, 1]) { B.box(-10.62, 0.42, sd * 1.06, 0.08, 0.2, 0.3, BLK); if (full) B.box(-10.5, 0.85, sd * 0.5, 0.06, 0.66, 0.08, DK); B.lamp(-10.665, 0.43, sd * 1.06, 0.12, 0.24); }
    if (full) { for (const z of [-0.2, 0.2]) B.box(-10.5, 2.1, z, 0.04, 2.6, 0.04, SHINE); for (let i = 0; i < 6; i++) B.box(-10.5, 1.2 + i * 0.42, 0, 0.04, 0.035, 0.4, SHINE); }
    if (!first) return;
    // the B-dolly: two drawbars from the tank's rear frame back to the dolly, its frame, its fifth wheel (the second kingpin's plate), its axles
    if (!sh) for (const sd of [-1, 1]) B.box((-10.4 + DOLLY.k) / 2, 1.0, sd * 0.42, Math.abs(DOLLY.k + 10.4), 0.14, 0.12, DK);
    B.box(DOLLY.k, 0.95, 0, 2.2, 0.22, 1.9, DK);
    B.box(DOLLY.k, 1.2, 0, 1.4, 0.12, 1.6, BLK);
    wheels(DOLLY.ax, 1.08);
  }
  const build1 = (B) => tank(B, true), build2 = (B) => tank(B, false);

  VEHICLE_DEFS.push({
    id: 'zrcalni', name: 'ZRCALNI VLAK', cat: 'tovornjaki', ord: 4, drive: 'AWD',
    desc: 'Cestni vlak: črna kabina, dve zrcalni cisterni in dolly; dva zgiba, 28 metrov.',
    phys: { mass: 7000, a: 2, b: 2.2, kI: 1.75, kw: 1000, redline: 2600, idle: 600, gears: [6, 4.7, 3.7, 2.95, 2.4, 1.95, 1.6, 1.33, 1.13, 1], final: 4.31, rw: 0.65, cDrag: 1.0, len: 6.3, wid: 2.5, steerMax: 0.55,
      tracK: 0.55, brakeK: 0.7, spinK: 0.4, loose: 1.3, looseDrag: 0.4, landV: 13, dmgK: 0.55, vLim: 140, sway: 1.6 },
    arc: { amax: 1.0, kv: 1.8, rmin: 9 },   // (as the TITAN CISTERNA's: what its axles hold with the kingpin's push, tlHoldSet)
    csp: { bx: 0.12, coast: -0.07, thr: -0.015, liftP: 0, pwr: 0.03, out: 1.1, turn: 0.7, w: 0.9, tv: 1.25 },   // (the KAMEN's AWD layer)
    stats: { power: 10, grip: 1, weight: 1, drift: 10 },
    expect: { t100: [13.32, 14.72], vmax: [133, 141], latG: [1.18, 1.31], d100: [42.0, 46.4] },   // (the train: tests/fleet.test.js, its envelope 'vlak')
    price: 90000, pk: 'open', field: ['zrcalni'], fieldN: 3,   // (3 of its own, no others: a 28 m train each, the phone's budget)
    snd: { kind: 'diesel', hz: 0.8, turbo: 0.75, loud: 1.4 },
    partNames: { headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamps', tailR: 'right tail lamps', wiperFront: 'windscreen wipers' },
    parts: { set: 'truck', ht: 3.3, y0: 0.75,
      extra: {
        hood: { lx: 0.7, y: 1.48, h: 0.35 },
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: 0.937, lz: -0.768, y: 1.36, on: 'hood' },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.2, h: 0.06, lx: 0.937, lz: 0.768, y: 1.36, on: 'hood' },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.22, h: 0.05, lx: -0.962, lz: -0.688, y: 1.06 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.22, h: 0.05, lx: -0.962, lz: 0.688, y: 1.06 },
        wiperFront: { z: 0, th: 0.65, m: 0.6, r: 0.5, h: 0.03, lx: 0.379, lz: -0.056, y: 2.27 },
      },
      over: { bumperF: { y: 1.36 }, bumperR: { y: 0.91 }, doorL: { lx: 0.204, y: 2.07 }, doorR: { lx: 0.204, y: 2.07 }, mirrorL: { lx: 0.37, y: 2.45 }, mirrorR: { lx: 0.37, y: 2.45 } },
    },
    mounts: {
      krilo: { x: -0.34, w: 0.95, part: 'body', s: 1.5 },
      zarometi: { x: 2.952, y0: 1.36, lean: 0, zc: 0.96, yc: 1.36, s: 0.75, hosts: ['headL', 'headR'], shape: LAMP, bulge: 0, ringW: 0.008 },
      platisca: {},
    },
    // the first tank on the tractor's fifth wheel (Core: tlDefBad, tlStep), 11 t full; next: the second on the B-dolly's fifth wheel (its kp
    // from the first kingpin: the dolly rigid to the first tank, dax its axles, lim its fold against the first tank); look.mirror: how much of
    // the race's sky the polished skin shows (the renderer's tlBuild, only on the picture's skin and ends: uv)
    trailer: { mass: 11000, len: 11.4, wid: 2.5, ht: 3.62, f: 0.9, ax: [-7.4, -8.7], kp: [-2.0, 1.28], rw: 0.5, mu: 1.5, brk: 7.5,
      look: { build: build1, mirror: { k: 0.6, uv: [PIC.skin, PIC.end] } },
      next: { mass: 11000, len: 11.4, wid: 2.5, ht: 3.62, f: 0.9, ax: [-7.4, -8.7], kp: [DOLLY.k, 1.28], dax: DOLLY.ax, lim: 1.0, rw: 0.5, mu: 1.5, brk: 7.5,
        look: { build: build2, mirror: { k: 0.6, uv: [PIC.skin, PIC.end] } } } },
    look: {
      body: { len: 6.3, wid: 2.5, roofY: 3.05,
        secs: [[-0.38, 1.17, 1.3, 2.2, 1.08, 2.99, 0.06, 'r', 0.06],
          [0.97, 1.17, 1.3, 2.2, 1.08, 2.99, 0.06, 'gf', 0.06],
          [1.19, 1.17, 1.3, 2.2, 1.1, 2.22, 0.03, 'b', 0.06],
          [1.25, 1.15, 1.3, 2.16, 1.1, 2.18, 0.02, 'b', 0.06]],
        eye: { x: 0.5, y: 2.5, near: 0.25, tilt: 0.1, style: 'closed' },
        decalX: 2.1, decalY: 2.07, decalRz: 0, decalS: 0.9,               // (the start number on the bonnet: the roof has the rack)
        crush: { x0: -0.3, x1: 1.12, z: 1.06 }, cage: true },
      wheels: { style: 'knob', w: 0.42, rimK: 0.48, rim: [0.8, 0.8, 0.78], gap: 0.1 },
      regions: 'none',
      build(K) {
        const BLACK = K.rgb(0x0c0d0f);   // (the cab's black: always black, whatever the paint; the livery's stripe stays the player's)
        const P = BLACK, S = K.strp, B = K.black, G = K.GLASS, CH = K.chrome, D = [0.15, 0.15, 0.16], FRM = [0.19, 0.19, 0.2], STL = [0.34, 0.35, 0.37];
        const AL = [0.62, 0.63, 0.62], RED = K.rgb(0xd8261c), PD = K.shade(P, 0.8);
        const side = (sd) => sd < 0 ? '-z' : 'z';
        // ---- the cab: the doors (side and window) in their parts, glass in the door and the windscreen; the roof's crown in the stripe ----
        const XD0 = 0.06, XD1 = 1.12;   // (the door's rear and front edges)
        const C = K.loft(K.body.secs, (k, e, kind, at) => {
          if (at.end) return P;
          if (e === 0 || e === 8) return D;
          const door = at.x > XD0 && at.x < XD1;
          if (kind === 'gf' && e >= 3 && e <= 5) return G;
          if (e === 2 || e === 6) return door ? G : P;
          if (e === 4 && kind === 'r') return S;
          return P;
        }, { caps: { front: { col: P, low: 'body', high: 'body', cut: 0 }, rear: { col: K.shade(P, 0.7), low: 'body', high: 'body', cut: 0 } },
          regions: ['L', 'R'].map(sd => ({ part: 'door' + sd, x: [XD0, XD1], bands: ['side', 'window'], side: sd })) });
        const CD = C.decal;
        CD.band([[XD0, 0], [XD1, 0], [XD1, 0.05], [XD0, 0.05]], B, null, 0.008);                 // the door window's frame: under it, over it, its ends
        CD.band([[XD0, 0.93], [XD1, 0.93], [XD1, 1], [XD0, 1]], B, null, 0.008);
        CD.band([[XD0, 0], [XD0 + 0.07, 0], [XD0 + 0.07, 1], [XD0, 1]], B, null, 0.009);
        CD.band([[XD1 - 0.05, 0], [XD1, 0], [XD1, 1], [XD1 - 0.05, 1]], B, null, 0.009);
        CD.side([[XD0 - 0.008, 1.37], [XD0 + 0.008, 1.37], [XD0 + 0.008, 2.2], [XD0 - 0.008, 2.2]], D, null, 0.009);   // the door's rear shut line
        CD.side([[-0.4, 1.5], [1.25, 1.5], [1.25, 1.66], [-0.4, 1.66]], S, null, 0.008);       // the livery: the stripe band along the side (the wing, the cab, the box)
        CD.side([[-0.4, 1.69], [1.25, 1.69], [1.25, 1.71], [-0.4, 1.71]], S, null, 0.008);
        for (const sd of [-1, 1]) {
          const dr = sd < 0 ? 'doorL' : 'doorR';
          K.rect(0.2, 2.04, sd * 1.176, 0.18, 0.04, B, { dir: side(sd), host: dr });               // the handle (at the door's rear edge)
          K.number(0.62, 1.95, sd * 1.178, 0.4, { dir: side(sd), w: 0.54, host: dr });           // the number on the door (over the band)
          K.hinge(dr, [XD1, 1.35, sd * 1.17], [XD1, 2.9, sd * 1.17]);
          K.bar([-0.37, 1.55, sd * 1.19], [-0.37, 2.45, sd * 1.19], 0.018, CH, { n: 4, part: 'body' });   // the grab handle behind the door
        }
        for (const z of [-0.5, 0.36]) K.bar([1.2, 2.245, z - 0.36], [1.186, 2.3, z + 0.36], 0.012, B, { n: 4, part: 'wiperFront' });   // the wipers (parked along the windscreen's base)
        for (const sd of [-1, 1]) K.mirror(1.16, 2.5, sd * 1.43, { w: 0.07, h: 0.42, d: 0.2, col: B, arm: D, z0: sd * 1.18 });   // the big mirrors on their arms
        // ---- the roof lamps: four round spot lamps on a bar over the windscreen (never crushed with the roof) ----
        K.part('body', () => {
          K.box(0.86, 3.02, 0, 0.14, 0.07, 1.74, 0, D);
          for (const z of [-0.66, -0.22, 0.22, 0.66]) {
            K.cyl([0.8, 3.18, z], [0.96, 3.18, z], 0.1, D, { n: 6, capB: null });
            K.discX(0.955, 3.18, z, 0.082, 6, K.lampHead, 1);
          }
        }, { noCrush: true });
        K.part('body', () => K.deli('krilo', () => {}));   // (the garage's wing on the cab roof's rear edge: mounts.krilo; none stock)
        // ---- the tilting front ('hood'): the wings over the front wheels (the loft cuts their tall arches, its tubs over the tyres), the
        //      bonnet over the engine with its grille, the head lamps in the wings' fronts, the black arch flares ----
        K.part('hood', () => {
          const WG = K.loft(K.secs([[1.22, 1.22, 1.08, 1.6, 1.17, 1.66, 0.005, 'b', 0.08], [2.66, 1.22, 1.08, 1.6, 1.17, 1.66, 0.005, 'b', 0.08],
            [2.95, 1.17, 1.16, 1.48, 1.1, 1.55, 0.005, 'b', 0.08]]),
            (k, e, kind, at) => at.end ? P : e === 0 || e === 8 ? (at.arch ? B : D) : P, { lining: false, floor: false, arches: [{ x: K.fx }] });
          for (const sd of [-1, 1]) {   // the stripe band on the wing's flat side over the arch, up to its belt (2.66: its taper to the nose, the belt falling to 1.48)
            const zw = (x) => sd * (1.22 - 0.05 * Math.max(0, x - 2.66) / 0.29 + 0.008), f = (q) => { const r = q.map(([x, y]) => [x, y, zw(x)]); K.face(sd > 0 ? r : r.reverse(), S); };
            f([[1.22, 1.5], [2.66, 1.5], [2.66, 1.6], [1.22, 1.6]]); f([[2.66, 1.5], [2.902, 1.5], [2.66, 1.6]]); }
          const BN = K.loft(K.secs([[1.22, 0.8, 1.45, 1.97, 0.74, 2.06, 0.03, 'b', 0.05], [2.86, 0.8, 1.4, 1.95, 0.74, 2.03, 0.03, 'b', 0.05],
            [3.03, 0.75, 1.2, 1.85, 0.66, 1.91, 0.01, 'b', 0.05]]),
            (k, e) => e === 0 || e === 8 ? null : P, { lining: false, floor: false, arches: false });   // (its bottom tuck inside the wings: none)
          for (const sd of [-1, 1]) BN.decal.top([[1.26, sd * 0.1], [2.98, sd * 0.1], [2.98, sd * 0.24], [1.26, sd * 0.24]], S, 0.008);   // the two bonnet stripes
          K.grille(3.033, 1.55, 0, 1.24, 0.6, { slats: 6, slatCol: [0.3, 0.31, 0.33], frame: D, frameH: 0.03 });
          for (const sd of [-1, 1]) { K.rect(2.6, 1.82, sd * 0.806, 0.46, 0.15, B, { dir: side(sd) }); for (const y of [1.79, 1.85]) K.rect(2.6, y, sd * 0.809, 0.44, 0.012, [0.3, 0.31, 0.33], { dir: side(sd) }); }   // the louvres in the bonnet's sides
          for (const sd of [-1, 1]) {
            K.rect(2.952, 1.2, sd * 0.98, 0.2, 0.07, K.rgb(0xf29a1a), { dir: 'x' });           // the indicator under the head lamp
            K.flare(K.fx, 0.75, 0.86, sd * 1.19, sd * 1.26, B, { a0: 0.72, a1: Math.PI - 0.72, n: 5 });
          }
        }, { hinge: [[2.95, 1.15, -1.0], [2.95, 1.15, 1.0]] });
        // the head lamps in the wings' fronts, each with its black frame flat on the wing's face: parts of their own on the tilting front
        // (headL, headR); the garage's in their place, in the frame (K.deli, mounts.zarometi)
        for (const sd of [-1, 1]) K.rect(2.952, 1.36, sd * 0.96, 0.364, 0.174, B, { host: sd < 0 ? 'headL' : 'headR' });
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(2.955, 1.36, sd * 0.96, 0.07, { shape: 'rect', w: 0.34, h: 0.15, ring: null, host: sd < 0 ? 'headL' : 'headR' }); });
        // (the mud flaps behind the front wheels hang from the cab's floor, not from the tilting front: they stay when it goes)
        for (const sd of [-1, 1]) for (const dx of [-1, 1]) K.rect(1.24 + dx * 0.01, 0.86, sd * 1.02, 0.38, 0.88, B, { dir: dx < 0 ? '-x' : 'x', part: 'body' });
        // ---- the steel bumper with the grille guard over the grille and the lamps, the towing hooks ----
        K.part('bumperF', () => {
          K.box(3.01, 0.86, 0, 0.22, 0.28, 2.36, 0, STL, D);
          for (const sd of [-1, 1]) K.box(3.11, 0.93, sd * 0.42, 0.1, 0.1, 0.07, 0, RED);
          const GG = [0.5, 0.51, 0.53];   // (the guard's tubes: light steel against the black grille)
          for (const z of [-0.74, -0.3, 0.3, 0.74]) K.bar([3.1, 1.12, z], [3.1, 1.9, z], 0.035, GG, { n: 4 });
          K.bar([3.1, 1.9, -0.76], [3.1, 1.9, 0.76], 0.035, GG, { n: 4 });
          K.bar([3.1, 1.5, -0.76], [3.1, 1.5, 0.76], 0.035, GG, { n: 4 });
          for (const sd of [-1, 1]) K.bar([3.1, 1.5, sd * 0.74], [3.0, 1.45, sd * 1.16], 0.035, GG, { n: 4 });
        }, { hinge: [[2.92, 0.9, -1.0], [2.92, 0.9, 1.0]] });

        // ---- the fifth wheel over the rear axle (its plate, its jaws' slot, its brackets), the deck plates behind the cab ----
        K.part('body', () => {
          K.box(-2.0, 1.12, 0, 1.3, 0.16, 1.6, 0, D);
          K.box(-2.45, 1.281, 0, 0.6, 0.004, 0.12, 0, [0.05, 0.05, 0.05]);
          for (const sd of [-1, 1]) K.box(-2.0, 1.04, sd * 0.55, 0.9, 0.1, 0.14, 0, FRM);
          K.box(-1.0, 1.06, 0, 1.0, 0.04, 2.0, 0, [0.42, 0.43, 0.45]);   // (the checker deck between the cab and the fifth wheel)
        });
        // ---- two chrome stacks behind the cab ----
        K.part('body', () => {
          for (const sd of [-1, 1]) {
            K.cyl([-0.56, 1.1, sd * 0.98], [-0.56, 3.28, sd * 0.98], 0.075, CH, { n: 8, capA: null });   // (3.28 m the highest: under the garage's lamps, its door's bar)
            K.cyl([-0.56, 1.95, sd * 0.98], [-0.56, 2.85, sd * 0.98], 0.1, CH, { n: 8 });   // (their heat shields)
            K.box(-0.46, 2.3, sd * 0.98, 0.16, 0.06, 0.06, 0, D);
          }
        }, { noCrush: true });
        // ---- the roof rack: its rails and posts, a spare tyre lying on it, three cans each side, strapped (nothing above 3.28 m: the garage's
        // door and lamps hang at 3.46 m, js/garage3d.js; a second tyre on the first stood at 3.66 m: no clear way out of the garage) ----
        K.part('body', () => {
          for (const sd of [-1, 1]) { K.bar([-0.34, 3.12, sd * 1.0], [0.74, 3.12, sd * 1.0], 0.022, D, { n: 4 }); for (const x of [-0.3, 0.7]) K.box(x, 2.99, sd * 1.0, 0.04, 0.13, 0.04, 0, D); }
          for (const x of [-0.32, 0.2, 0.72]) K.bar([x, 3.06, -1.0], [x, 3.06, 1.0], 0.02, D, { n: 4 });
          K.tyre(0.2, 3.16, 0, { axis: 'y', face: 1, r: 0.58, w: 0.22 });
          const CAN = [K.rgb(0xa3281f), K.rgb(0x2e6a33), K.rgb(0xa3281f)];
          for (const sd of [-1, 1]) CAN.forEach((cc, i) => K.box(-0.18 + i * 0.36, 3.08, sd * 0.86, 0.32, 0.2, 0.15, 0, cc));   // (lying on their sides: 0.2 m high, K.box's y is the bottom)
          for (const sd of [-1, 1]) K.box(0.18, 3.265, sd * 0.86, 1.1, 0.015, 0.17, 0, K.rgb(0xe0b21c));
        }, { noCrush: true });
        // ---- the frame, the axles, the drive shafts, the fuel tanks, the steps, the rear mud guards and flaps ----
        K.part('body', () => {
          for (const sd of [-1, 1]) K.box(-0.05, 0.94, sd * 0.45, 6.0, 0.24, 0.1, 0, FRM);
          for (const x of [-2.95, 2.85]) K.box(x, 0.98, 0, 0.1, 0.16, 0.8, 0, FRM);
          K.box(K.fx, 0.56, 0, 0.16, 0.16, 1.7, 0, D); K.box(K.fx, 0.44, 0, 0.36, 0.3, 0.4, 0, D);
          K.cyl([K.rx, 0.65, -0.86], [K.rx, 0.65, 0.86], 0.1, D, { n: 6 }); K.box(K.rx, 0.42, 0, 0.4, 0.4, 0.42, 0, D);
          K.cyl([1.5, 0.84, 0], [K.rx + 0.2, 0.6, 0], 0.06, D, { n: 6, capA: null, capB: null });
          K.cyl([1.5, 0.84, 0.06], [K.fx - 0.2, 0.6, 0.06], 0.06, D, { n: 6, capA: null, capB: null });
          for (const sd of [-1, 1]) K.box(-0.98, 0.7, sd * 0.72, 0.95, 0.45, 0.42, 0, AL);
          for (const sd of [-1, 1]) {
            for (const y of [0.66, 1.0]) K.box(0.72, y, sd * 1.08, 0.55, 0.05, 0.22, 0, STL);
            for (const x of [0.46, 0.98]) K.rect(x, 0.99, sd * 1.12, 0.05, 0.66, FRM, { dir: side(sd) });   // (their hangers)
            K.flare(K.rx, 0.71, 0.79, sd * 0.78, sd * 1.26, B, { a0: 0.5, a1: Math.PI - 0.1, n: 5 });
            for (const dx of [-1, 1]) K.rect(-2.98 + dx * 0.01, 0.62, sd * 1.03, 0.42, 0.6, B, { dir: dx < 0 ? '-x' : 'x' });   // (the mud flap behind it)
          }
        });

        // ---- the rear light bar over the frame's end: the lamp clusters (the tail lamp over the indicator, each a part of its own) ----
        K.box(-3.0, 0.94, 0, 0.1, 0.24, 2.3, 0, D);
        for (const sd of [-1, 1]) { const h = { host: sd < 0 ? 'tailL' : 'tailR' };
          K.rect(-3.052, 1.06, sd * 0.86, 0.3, 0.2, B, { dir: '-x', host: h.host });
          K.tailLamp(-3.055, 1.08, sd * 0.86, 0.2, 0.1, h);
          K.rect(-3.056, 1.0, sd * 0.86, 0.16, 0.05, K.rgb(0xf29a1a), { dir: '-x', host: h.host });
        }
        // ---- the rear bumper bar across the frame's end, the towing hitch, the reflectors ----
        K.part('bumperR', () => {
          K.box(-3.06, 0.84, 0, 0.14, 0.18, 2.0, 0, STL);
          K.box(-3.12, 0.8, 0, 0.12, 0.16, 0.22, 0, RED);
          for (const sd of [-1, 1]) K.rect(-3.131, 0.93, sd * 0.8, 0.22, 0.06, [0.85, 0.08, 0.06], { dir: '-x' });
        }, { hinge: [[-3.0, 0.9, -0.8], [-3.0, 0.9, 0.8]] });
        // ---- inside (seen once a part is off): three seats (the driver, the navigator, the mechanic between them), the dashboard, the big
        //      wheel, the roll cage; the engine under the bonnet, the radiator behind the grille ----
        for (const z of [-0.56, 0.56]) K.seat(0.35, 1.8, z, { w: 0.55, l: 0.5, back: 0.75 });
        K.seat(0.02, 1.78, 0, { w: 0.48, l: 0.45, back: 0.7 });
        K.box(1.02, 1.72, 0, 0.32, 0.45, 2.2, 0, D, null, false, { inner: true, part: 'body' });
        K.cyl([0.86, 2.08, -0.56], [0.78, 2.2, -0.56], 0.24, [0.08, 0.08, 0.09], { n: 8, inner: true, part: 'body' });
        const cg = [];
        for (const sd of [-1, 1]) cg.push([[-0.28, 1.36, sd * 1.06], [-0.28, 2.88, sd * 0.98]], [[1.0, 1.4, sd * 1.06], [0.92, 2.88, sd * 0.98]], [[0.92, 2.88, sd * 0.98], [-0.28, 2.88, sd * 0.98]]);
        cg.push([[-0.28, 2.88, -0.98], [-0.28, 2.88, 0.98]], [[0.92, 2.88, -0.98], [0.92, 2.88, 0.98]], [[-0.28, 1.36, -1.06], [-0.28, 2.88, 0.98]]);
        K.cage(cg, 0.035, [0.72, 0.74, 0.77]);
        K.engine(1.95, 1.0, 0, { l: 1.3, w: 0.8, h: 0.84 });
        K.box(2.86, 1.2, 0, 0.12, 0.65, 1.3, 0, [0.12, 0.12, 0.13], null, false, { inner: true, part: 'body' });
        K.cyl([2.25, 1.62, 0.42], [2.25, 1.62, 0.62], 0.13, [0.42, 0.3, 0.22], { n: 8, inner: true, part: 'body' });   // the turbo (heat-blued) by the block, its intake pipe
        K.cyl([2.25, 1.75, 0.52], [2.7, 1.86, 0.45], 0.07, B, { n: 6, inner: true, part: 'body', capA: null });
      },
    },
  });
})();
