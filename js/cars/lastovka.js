/* Vehicle 'lastovka' — LASTOVKA: a modern touring coach, twelve metres in one piece (docs/titan-cisterna.md, »Novi tovornjaki«). No
   trailer: one rigid body on three axles (the steered front one, the driven twin-tyred one, a tag axle behind it: the look's), the longest
   single body in the game (Core lets a body be up to 13 m long for it; the garage shows a vehicle longer than 6.4 m scaled down to 6.4 m,
   Render.garageK, so its room, its chamber and its robots stay as they are for every other car). The look: a tall box with rounded ends,
   a dark band of glass down both sides and round the nose, a white sweep low on the sides, the luggage bays' seams, mirrors on arms from
   the roof's front corners, an air-conditioning unit on the roof's front, and the passengers' luggage on a rack over the rest of the
   roof: suitcases, a trunk, duffel bags, a rolled mat (they go as one part in a hard hit: 'luggage'). No spare tyre
   (docs/avti-kolibri.md), no names, no lettering. L 12.00 W 2.55 H 3.52 (4.05 with the luggage), axles 3.40 ahead of and 3.20 and 4.55
   behind the middle (m). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  const LAMP = [[-0.19, -0.07], [0.19, -0.07], [0.19, 0.07], [-0.19, 0.07]];   // (the head lamps' outline: the garage's options in it)
  const TAG = -4.55;                                                           // (the tag axle behind the driven one)
  // the luggage on the rack (m: [x, z, long, tall, across, colour, turned]; each stands on the rack's slats), the bags lying on it ([a, b, r, colour])
  const RACK = { x0: -3.5, x1: 2.5, hz: 0.95, y: 3.56, rail: 3.78 };
  const CASES = [
    [2.05, -0.45, 0.75, 0.28, 0.5, 0xb5332e, 0.06], [2.0, 0.44, 0.8, 0.3, 0.56, 0x26406e, -0.05], [1.15, -0.42, 0.7, 0.46, 0.44, 0x7a5232, 0], [1.1, 0.46, 0.85, 0.26, 0.6, 0x5d6b3a, 0.04],
    [0.15, 0, 0.92, 0.34, 1.3, 0xb89a6a, 0], [-0.85, -0.48, 0.7, 0.42, 0.5, 0xd9a520, -0.07], [-0.8, 0.45, 0.76, 0.25, 0.56, 0x7d8288, 0.05], [-1.8, -0.42, 0.8, 0.3, 0.55, 0x222326, 0.03],
  ];
  const TOP = [[-0.8, 0.45, 0.5, 0.2, 0.4, 0x2f7f7a, 0.3, 0.25], [1.12, 0.46, 0.5, 0.18, 0.36, 0xc9c4b8, -0.2, 0.26]];   // (a small case on a bigger one: its last number how high over the slats)
  const BAGS = [[[-1.8, 0.17, 0.1], [-1.8, 0.17, 0.82], 0.18, 0x3566a8], [[-3.2, 0.16, -0.42], [-2.4, 0.16, -0.42], 0.17, 0xd9702a], [[-2.45, 0.12, 0.5], [-3.2, 0.12, 0.5], 0.12, 0x4f8a4a], [[-2.5, 0.15, 0.02], [-3.1, 0.15, 0.06], 0.15, 0x8a2f5a]];

  VEHICLE_DEFS.push({
    id: 'lastovka', name: 'LASTOVKA', cat: 'tovornjaki', ord: 8, drive: 'FR',
    desc: 'Turistični avtobus, dvanajst metrov v enem kosu, s prtljago potnikov na strehi.',
    phys: { mass: 11000, a: 3.4, b: 3.2, kI: 2.4, kw: 820, redline: 2800, idle: 600, gears: [6, 4.7, 3.7, 2.95, 2.4, 1.95, 1.6, 1.33, 1.13, 1], final: 3.42, rw: 0.55, cDrag: 0.65, len: 12.0, wid: 2.5, steerMax: 0.55,
      tracK: 0.55, brakeK: 0.7, spinK: 0.4, dmgK: 0.6, vLim: 132, sway: 1.4, landV: 13 },   // (the TITAN's engine, gearbox and tyres under a body more than twice as heavy and long)
    arc: { amax: 1.34, kv: 1.8, rmin: 12 },
    csp: { bx: 0.12, coast: -0.06, thr: -0.01, liftP: 0.04, pwr: 0.04, out: 1.2, turn: 0.75, w: 0.92, tv: 1.2 },   // (the TITAN's)
    stats: { power: 10, grip: 1, weight: 1, drift: 10 },
    expect: { t100: [7.13, 7.89], vmax: [126, 134], latG: [1.7, 1.8], d100: [30.5, 33.7] },
    price: 78000, pk: 'open', tank: 300, field: ['lastovka'], fieldN: 4,   // (4 of its own, no others: twelve metres each, the phone's budget)
    snd: { kind: 'diesel', hz: 0.9, turbo: 0.7, loud: 1.3 },
    partNames: { luggage: 'roof luggage', headL: 'left head lamp', headR: 'right head lamp', tailL: 'left tail lamp', tailR: 'right tail lamp' },
    // its breaking parts: the two bumpers, the mirrors on their arms, the lamps (the head lamps on the front bumper, they go with it),
    // the luggage on the roof (one piece: a hard hit on the nose throws it off its rack)
    parts: { set: 'none', ht: 3.6, y0: 0.6,
      extra: {
        bumperF: { y: 0.75, h: 0.2 }, bumperR: { y: 0.62 },
        mirrorL: { z: 2, lx: 1.035, lz: -0.97, y: 2.7, r: 0.3 }, mirrorR: { z: 3, lx: 1.035, lz: 0.97, y: 2.7, r: 0.3 },
        headL: { z: 0, th: 0.42, corner: 0, cth: 0.4, m: 1, r: 0.3, h: 0.08, lx: 1.0, lz: -0.7, y: 0.9, on: 'bumperF' },
        headR: { z: 0, th: 0.42, corner: 1, cth: 0.4, m: 1, r: 0.3, h: 0.08, lx: 1.0, lz: 0.7, y: 0.9, on: 'bumperF' },
        tailL: { z: 1, th: 0.42, corner: 2, cth: 0.4, m: 1, r: 0.36, h: 0.05, lx: -1.0, lz: -0.84, y: 1.3 },
        tailR: { z: 1, th: 0.42, corner: 3, cth: 0.4, m: 1, r: 0.36, h: 0.05, lx: -1.0, lz: 0.84, y: 1.3 },
        luggage: { z: 0, th: 0.8, m: 14, rW: 0.5, h: 0.25, lx: -0.173, lz: 0.07, y: 3.73 },
      },
    },
    // where the garage's parts go (js/deli.js, look units): the wing on the roof's rear edge, behind the rack (a truck's size: s); the
    // head lamps in the place of the stock ones on the front bumper (every option in their outline, LAMP), in the lamps' parts; the rims
    // (the truck's tyres kept); the grille in the bumper's face between the lamps; the tail lamps in the place of the tall stock ones;
    // the brakes, the nuts, the paint, the light under the body, the tyres
    mounts: {
      krilo: { x: -5.55, w: 1.0, part: 'body', s: 2 },
      zarometi: { x: 6.032, y0: 0.9, lean: 0, zc: 0.88, yc: 0.9, s: 0.95, hosts: ['headL', 'headR'], shape: LAMP, bulge: 0, ringW: 0.008 },
      platisca: {},
      maska: { x: 6.032, y0: 0.62, lean: 0, yc: 0.62, w: 1.36, h: 0.18, comb: 2, part: 'bumperF' },
      zadnje_luci: { x: -6.012, zc: 1.05, yc: 1.3, w: 0.14, h: 0.3, s: 1.2, shape: [[-0.07, -0.35], [0.07, -0.35], [0.07, 0.35], [-0.07, 0.35]], hosts: ['tailL', 'tailR'] },
      zavore: { s: 1 }, matice: { k: 10, r: 0.24 },
      barva: {}, luc_pod_avtom: {}, gume: {},
    },
    look: {
      body: { len: 12.0, wid: 2.55, roofY: 3.52,
        secs: [[-6.0, 1.2, 0.45, 1.6, 1.12, 3.2, 0.1, 'b', 0.25], [-5.85, 1.27, 0.4, 1.6, 1.2, 3.38, 0.14, 'r', 0.25], [5.3, 1.27, 0.4, 1.6, 1.2, 3.38, 0.14, 'gf', 0.25],
          [5.75, 1.25, 0.4, 1.4, 1.15, 3.1, 0.1, 'gf', 0.25], [6.0, 1.2, 0.45, 1.0, 1.08, 2.2, 0.06, 'b', 0.25]],
        eye: { x: 5.2, y: 2.3, near: 0.25, tilt: 0.08, style: 'closed' }, decalX: -4.6, decalY: 3.53, decalRz: 0, decalS: 1.1 },
      wheels: { style: 'truck', w: 0.32, wR: 0.32, gap: 0.08, rim: [0.8, 0.81, 0.83], dual: true },
      regions: 'none',
      build(K) {
        const P = K.paint, WH = [0.93, 0.93, 0.92], G = [0.05, 0.06, 0.08], D = [0.16, 0.16, 0.17], SV = [0.75, 0.76, 0.78], RK = [0.62, 0.63, 0.66];
        // the body: the paint, the dark glass band down the sides and round the nose, white under the glass on the sides
        const L = K.loft(K.body.secs, (k, e, kind, at) => {
          if (at.end) return P;
          if (e === 0 || e === 8) return D;
          if (kind === 'r') return e === 1 || e === 7 ? P : e === 2 || e === 6 ? G : WH;
          if (kind === 'gf') return e >= 2 && e <= 6 ? G : P;
          return P;
        }, { caps: { front: { col: P, low: 'body', high: 'body' }, rear: { col: P, low: 'body', high: 'body' } }, arches: [{ x: K.fx }, { x: K.rx }, { x: TAG }] });
        L.decal.side([[-5.8, 1.5], [5.6, 1.5], [5.6, 1.56], [-5.8, 1.56]], SV, null, 0.008);    // a silver line under the glass
        L.decal.side([[-5.8, 0.72], [-1.0, 0.72], [1.6, 1.38], [-5.8, 1.38]], WH, null, 0.008); // the white sweep low on the sides
        K.part('body', () => {
          for (const sd of [-1, 1]) for (const x of [-2.4, -0.9, 0.6, 2.1]) K.rect(x, 0.95, sd * 1.282, 0.02, 0.8, D, { dir: sd < 0 ? '-z' : 'z' });   // the luggage bays' seams
          K.rect(4.75, 1.5, 1.283, 0.9, 2.3, G, { dir: 'z' });   // the front door (right)
          K.rect(-6.005, 2.6, 0, 1.9, 0.6, G, { dir: '-x' }); K.rect(-6.005, 1.0, 0, 1.5, 0.5, D, { dir: '-x' });   // the rear window, the engine's grille
          K.rect(5.5, 3.25, 0, 1.6, 0.18, [0.02, 0.02, 0.02], { dir: 'x' });   // the route display (dark, no lettering)
          K.box(4.1, 3.45, 0, 2.0, 0.18, 1.7, 0, WH);   // the air conditioning on the roof's front
          K.deli('krilo', () => {});   // (the garage's wing on the roof's rear edge: mounts.krilo; none stock)
          // the rack: the slats across the roof, a rail round them on short posts
          for (let x = RACK.x0 + 0.25; x < RACK.x1; x += 1.1) K.box(x, RACK.y - 0.05, 0, 0.06, 0.05, RACK.hz * 2, 0, RK);
          for (const sd of [-1, 1]) {
            K.bar([RACK.x0, RACK.rail, sd * RACK.hz], [RACK.x1, RACK.rail, sd * RACK.hz], 0.022, RK, { n: 4 });
            for (let x = RACK.x0; x <= RACK.x1 + 0.01; x += 1.5) K.bar([x, 3.42, sd * RACK.hz], [x, RACK.rail, sd * RACK.hz], 0.02, RK, { n: 4 });
          }
          for (const x of [RACK.x0, RACK.x1]) K.bar([x, RACK.rail, -RACK.hz], [x, RACK.rail, RACK.hz], 0.022, RK, { n: 4 });
        });
        // the passengers' luggage on it: the suitcases and the trunk (two straps over it), small cases on two of them, the bags and a rolled mat
        K.part('luggage', () => {
          for (const [x, z, lx, ly, lz, col, rot] of CASES) K.box(x, RACK.y, z, lx, ly, lz, rot, K.rgb(col));
          for (const [x, z, lx, ly, lz, col, rot, up] of TOP) K.box(x, RACK.y + up, z, lx, ly, lz, rot, K.rgb(col));
          for (const x of [-0.1, 0.4]) K.box(x, RACK.y, 0, 0.05, 0.35, 1.32, 0, D);
          for (const [a, b, r, col] of BAGS) K.cyl([a[0], RACK.y + a[1], a[2]], [b[0], RACK.y + b[1], b[2]], r, K.rgb(col), { n: 8, r2: r * 0.92 });
        });
        // the front: the bumper with the grille and the lamps in its face
        K.part('bumperF', () => {
          K.box(6.0, 0.42, 0, 0.06, 0.66, 2.3, 0, D);
          K.deli('maska', () => K.grille(6.032, 0.62, 0, 1.36, 0.18, { slats: 3, slatCol: [0.4, 0.41, 0.44], frame: null }));   // (the garage's grille in its place: mounts.maska)
        });
        // each lamp in its black panel a part of its own (headL, headR); the garage's in their place (mounts.zarometi)
        for (const sd of [-1, 1]) K.rect(6.032, 0.9, sd * 0.88, 0.44, 0.2, [0.02, 0.02, 0.02], { dir: 'x', host: sd < 0 ? 'headL' : 'headR' });
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(6.035, 0.9, sd * 0.88, 0.08, { shape: 'rect', w: 0.38, h: 0.14, ring: null, host: sd < 0 ? 'headL' : 'headR' }); });
        // the mirrors on their arms from the roof's front corners
        for (const sd of [-1, 1]) K.part(sd < 0 ? 'mirrorL' : 'mirrorR', () => {
          K.bar([5.85, 3.15, sd * 1.12], [6.3, 2.95, sd * 1.25], 0.03, D, { n: 4 }); K.box(6.3, 2.4, sd * 1.25, 0.08, 0.55, 0.2, 0, D);
        });
        // the rear: the bumper, the tall tail lamps
        K.part('bumperR', () => K.box(-6.0, 0.44, 0, 0.06, 0.36, 2.3, 0, D));
        for (const sd of [-1, 1]) K.rect(-6.008, 1.3, sd * 1.05, 0.2, 0.78, [0.02, 0.02, 0.02], { dir: '-x', host: sd < 0 ? 'tailL' : 'tailR' });   // (each lamp's black panel a part of its own: tailL, tailR)
        K.deli('zadnje_luci', () => { for (const sd of [-1, 1]) K.tailLamp(-6.012, 1.3, sd * 1.05, 0.14, 0.7, { host: sd < 0 ? 'tailL' : 'tailR' }); });
        // the tag axle's tyres (the body's own, 6 cm off the road: the body leans and sinks with them, down on them with its wheels off)
        for (const sd of [-1, 1]) K.tyre(TAG, K.M.rw + 0.06, sd * K.hw, { axis: 'z', face: sd, hi: true, style: 'truck', w: 0.32 });
      },
    },
  });
})();
