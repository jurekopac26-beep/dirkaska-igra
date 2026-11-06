/* Hitri prototipi novih avtov za drift (docs/novi-avti-2.md): samo izhodišče za modele in za slike vprašanja `novi-avti-2-videz`,
   NE gre v igro (index.html ga ne naloži; slike: node tools/novi-avti-2/slike.mjs). Id-ji pnris, pnvidra, pnkuna, pnmer, pntur, pnvran.
   Fizika tu ni prava (samo mere, osi in kolesa za sliko); končni model se naredi znova po pravilih KIT (js/render.js) v js/cars/<id>.js.
   Datoteko izbriše seja, ki naredi zadnji avto. */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  const CSP = { bx: 0.15, coast: -0.099, thr: -0.03, liftP: 0, pwr: 0, out: 1, turn: 1, w: 1.02 };
  function car(o) {
    VEHICLE_DEFS.push({
      id: o.id, name: o.name, cat: o.cat, ord: 90, drive: o.drive || 'AWD', desc: o.name,
      phys: { mass: o.mass || 1400, a: o.a, b: o.b, kI: 1.15, kw: o.kw || 260, redline: 7000, idle: 900, gears: [3.4, 2.15, 1.55, 1.2, 0.98, 0.83],
        final: 4.0, rw: o.rw, cDrag: 0.4, len: o.len, wid: o.wid, steerMax: 0.62 },
      arc: { amax: 1.8, kv: 2.1, rmin: 4.1 }, csp: CSP, stats: { power: 7, grip: 8, weight: 6, drift: 9 }, price: 50000, pk: 'ta1', field: [o.id],
      snd: { kind: o.snd || 'i4', hz: 1.1, turbo: 0.5, loud: 1 },
      parts: { set: 'car', ht: o.ht, y0: 0.2 },
      look: Object.assign({ body: Object.assign({ len: o.len, wid: o.wid, secs: o.secs }, o.body || {}), wheels: o.wheels, build: o.build }, o.budget ? { budget: o.budget } : {}),
    });
  }
  // the shell: paint, glass (windscreen, side windows along the roof, the rear glass), the sills dark between the arches; extra(k, e, kind, at)
  // first (a colour, null: no panel, undefined: the default)
  function shell(K, extra, lo) {
    const P = K.paint, B = K.black, G = K.GLASS;
    const XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;
    return K.loft(K.secs(K.body.secs), (k, e, kind, at) => {
      if (extra) { const c = extra(k, e, kind, at); if (c !== undefined) return c; }
      if (e === 0 || e === 8) return at.arch || (at.x > XA && at.x < XB) ? B : K.shade(P, 0.55);
      if (kind === 'gf' && e >= 2 && e <= 6) return G;
      if (kind === 'r' && (e === 2 || e === 6)) return G;
      if (kind === 'gr' && e >= 3 && e <= 5) return G;
      return P;
    }, Object.assign({ caps: { front: { col: P }, rear: { col: P } } }, lo || {}));
  }
  const pair = (f) => { for (const sd of [-1, 1]) f(sd); };
  const RED = [0.62, 0.04, 0.06], DARK = [0.08, 0.08, 0.09], LED = [0.95, 0.96, 1.0], WHITE = [0.94, 0.94, 0.92], CHROME = [0.8, 0.81, 0.84];
  const TOW = [1, 0.48, 0.07];

  /* 1 · RIS G: širok kupe 4x4 za gimkano (drift z vsemi štirimi kolesi), L 4.45 W 2.00 H 1.36, medosje 2.62 */
  car({ id: 'pnris', name: 'RIS G', cat: 'sportni', len: 4.45, wid: 2.0, a: 1.28, b: 1.34, rw: 0.34, ht: 1.36, mass: 1320, snd: 'i4',
    secs: [[-2.22, 0.88, 0.3, 0.8, 0.78, 0.88, 0.02, 'b', 0.1],
      [-2.16, 0.95, 0.29, 0.84, 0.84, 0.94, 0.03, 'b', 0.1],
      [-1.8, 0.98, 0.28, 0.88, 0.74, 1.0, 0.03, 'gr', 0.1],
      [-1.02, 0.97, 0.28, 0.9, 0.62, 1.32, 0.04, 'r', 0.1],
      [-0.3, 0.96, 0.28, 0.91, 0.62, 1.34, 0.04, 'r', 0.1],
      [0.16, 0.96, 0.28, 0.9, 0.64, 1.31, 0.04, 'gf', 0.1],
      [0.95, 0.97, 0.29, 0.86, 0.8, 0.93, 0.04, 'b', 0.1],
      [1.7, 0.98, 0.28, 0.8, 0.82, 0.86, 0.04, 'b', 0.09],
      [2.05, 0.94, 0.25, 0.72, 0.78, 0.78, 0.03, 'b', 0.08],
      [2.22, 0.86, 0.22, 0.62, 0.7, 0.66, 0.02, 'b', 0.07]],
    wheels: { style: 'std', spokes: 6, w: 0.27, rim: [0.92, 0.92, 0.9], cap: [0.12, 0.12, 0.13], gap: 0.04 },
    build(K) {
      const P = K.paint, B = K.black, L = shell(K, (k, e, kind) => kind === 'r' && e >= 3 && e <= 5 ? B : undefined);   // the black roof
      const DC = L.decal;
      DC.band([[-0.98, 0], [-0.86, 0], [-0.86, 1], [-0.98, 1]], B, null, 0.01);                                 // the B-pillar
      // the livery: big black blocks slanting up and back on the side, a white line along their edge
      DC.side([[-1.75, 0.36], [-0.2, 0.36], [0.5, 0.86], [-1.75, 0.86]], B, null, 0.008);
      DC.side([[-0.2, 0.36], [-0.08, 0.36], [0.62, 0.86], [0.5, 0.86]], WHITE, null, 0.009);
      pair(sd => K.number(-0.95, 0.62, sd * 0.97, 0.3, { dir: sd < 0 ? '-z' : 'z' }));
      // the roof scoop (the air for the turbo), the bonnet's vents
      K.box(-0.45, 1.33, 0, 0.62, 0.08, 0.44, 0, B);
      K.rect(-0.14, 1.37, 0, 0.4, 0.06, DARK);
      pair(sd => DC.top([[1.15, sd * 0.18], [1.6, sd * 0.18], [1.6, sd * 0.5], [1.15, sd * 0.5]], DARK, 0.004));
      // the wide black overfenders, the mud flaps behind every wheel
      for (const A of K.arches) pair(sd => K.flare(A.x, 0.37, 0.47, sd * 0.9, sd * 1.0, B));
      for (const A of K.arches) pair(sd => K.box(A.x - 0.44, 0.1, sd * 0.86, 0.02, 0.3, 0.26, 0, DARK));
      // the nose: slim lamps, the light pod of four round lamps in the grille, the splitter
      pair(sd => K.headLamp(2.222, 0.52, sd * 0.62, 0.05, { shape: 'rect', w: 0.3, h: 0.06, ring: null }));
      K.grille(2.223, 0.36, 0, 1.3, 0.22, { slats: 3 });
      for (const z of [-0.36, -0.12, 0.12, 0.36]) K.headLamp(2.232, 0.36, z, 0.065, { ring: B });
      K.box(2.12, 0.19, 0, 0.3, 0.025, 1.9, 0, DARK);
      // the big wing on swan necks over the boot lid, its endplates
      K.wingPlank(-1.92, 1.22, -2.34, 1.26, 0.035, -0.94, 0.94, B);
      pair(sd => { K.endplate([[-1.88, 1.12], [-2.4, 1.12], [-2.4, 1.34], [-1.88, 1.3]], sd * 0.95, 0.012, B);
        K.endplate([[-2.12, 0.92], [-2.24, 0.92], [-2.3, 1.24], [-2.18, 1.24]], sd * 0.4, 0.016, DARK); });
      // the tail: the lamps on the corners, the black panel between them, the diffuser, one big pipe in the middle
      pair(sd => { K.rect(-2.222, 0.8, sd * 0.62, 0.38, 0.1, B, { dir: '-x' }); K.tailLamp(-2.226, 0.8, sd * 0.62, 0.34, 0.06); });
      K.rect(-2.222, 0.8, 0, 0.86, 0.05, B, { dir: '-x' });
      K.box(-2.16, 0.16, 0, 0.16, 0.14, 1.6, 0, DARK);
      for (const z of [-0.5, -0.25, 0.25, 0.5]) K.box(-2.2, 0.16, z, 0.2, 0.13, 0.02, 0, DARK);
      K.exhaust(-2.28, 0.3, 0, 0.075, 0.22);
      pair(sd => K.mirror(0.66, 0.96, sd * 0.99, { col: B }));
    },
  });

  /* 2 · VIDRA E: električni fastback 4x4 s štirimi motorji, L 4.86 W 1.98 H 1.38, medosje 2.92 */
  car({ id: 'pnvidra', name: 'VIDRA E', cat: 'elektricni', len: 4.86, wid: 1.98, a: 1.42, b: 1.5, rw: 0.35, ht: 1.38, mass: 1900, snd: 'ev',
    secs: [[-2.43, 0.86, 0.3, 0.82, 0.74, 0.92, 0.02, 'b', 0.11],
      [-2.33, 0.92, 0.29, 0.86, 0.8, 0.98, 0.03, 'b', 0.1],
      [-2.05, 0.95, 0.28, 0.88, 0.74, 1.02, 0.03, 'gr', 0.1],
      [-0.75, 0.97, 0.28, 0.92, 0.62, 1.34, 0.05, 'r', 0.1],
      [0.05, 0.97, 0.28, 0.92, 0.62, 1.36, 0.05, 'gf', 0.1],
      [1.05, 0.97, 0.29, 0.86, 0.8, 0.93, 0.05, 'b', 0.1],
      [1.9, 0.97, 0.28, 0.8, 0.82, 0.84, 0.05, 'b', 0.09],
      [2.28, 0.92, 0.25, 0.7, 0.76, 0.74, 0.03, 'b', 0.08],
      [2.43, 0.84, 0.24, 0.6, 0.66, 0.62, 0.02, 'b', 0.07]],
    wheels: { style: 'std', spokes: 5, w: 0.27, rim: [0.2, 0.21, 0.23], cap: [0.1, 0.1, 0.11], gap: 0.04 },
    build(K) {
      const P = K.paint, B = K.black, G = K.GLASS, TEAL = [0.06, 0.72, 0.74];
      const L = shell(K, (k, e, kind) => kind === 'r' && e >= 3 && e <= 5 ? G : undefined), DC = L.decal;   // the glass roof
      DC.band([[-0.62, 0], [-0.5, 0], [-0.5, 1], [-0.62, 1]], B, null, 0.01);
      DC.side([[-1.95, 0.32], [1.75, 0.32], [1.75, 0.44], [-1.95, 0.44]], DARK, null, 0.006);               // the dark sills (the battery's)
      DC.side([[-1.95, 0.45], [1.75, 0.45], [1.75, 0.47], [-1.95, 0.47]], TEAL, null, 0.007);              // the thin line over them
      pair(sd => K.number(-0.35, 0.66, sd * 0.97, 0.28, { dir: sd < 0 ? '-z' : 'z' }));
      // the closed nose: a light bar across it, slim lamps on its corners, the low intake
      K.rect(2.432, 0.64, 0, 1.36, 0.03, LED);
      pair(sd => K.headLamp(2.43, 0.64, sd * 0.7, 0.04, { shape: 'rect', w: 0.24, h: 0.045, ring: null }));
      K.grille(2.432, 0.36, 0, 1.2, 0.16, { slats: 2 });
      K.box(2.36, 0.17, 0, 0.26, 0.025, 1.8, 0, DARK);
      // the short ducktail, the light bar across the tail, the diffuser with its fins
      K.wingPlank(-2.26, 0.99, -2.45, 1.04, 0.02, -0.82, 0.82, P);
      K.rect(-2.433, 0.86, 0, 1.5, 0.035, RED, { dir: '-x' });
      pair(sd => K.tailLamp(-2.435, 0.86, sd * 0.76, 0.2, 0.05));
      K.box(-2.38, 0.16, 0, 0.12, 0.14, 1.5, 0, DARK);
      for (const z of [-0.45, -0.15, 0.15, 0.45]) K.box(-2.42, 0.16, z, 0.16, 0.13, 0.02, 0, TEAL);
      pair(sd => K.mirror(0.72, 0.98, sd * 0.97, { col: B, w: 0.1, h: 0.06 }));                            // the camera pods
    },
  });

  /* 3 · KUNA S: lahek kupe s prednjim pogonom (drift z dvigom plina), L 4.28 W 1.86 H 1.33, medosje 2.60 */
  car({ id: 'pnkuna', name: 'KUNA S', cat: 'mali', drive: 'FF', len: 4.28, wid: 1.86, a: 1.04, b: 1.56, rw: 0.32, ht: 1.33, mass: 1080, snd: 'i4',
    secs: [[-2.28, 0.82, 0.3, 0.8, 0.7, 0.9, 0.02, 'b', 0.11],
      [-2.2, 0.88, 0.29, 0.84, 0.76, 0.96, 0.03, 'gr', 0.11],
      [-1.2, 0.9, 0.28, 0.88, 0.6, 1.29, 0.04, 'r', 0.1],
      [-0.35, 0.9, 0.28, 0.89, 0.6, 1.33, 0.05, 'r', 0.1],
      [0.1, 0.9, 0.28, 0.88, 0.62, 1.3, 0.05, 'gf', 0.1],
      [0.95, 0.91, 0.29, 0.84, 0.78, 0.92, 0.05, 'b', 0.1],
      [1.62, 0.91, 0.28, 0.78, 0.78, 0.84, 0.05, 'b', 0.09],
      [1.88, 0.86, 0.25, 0.7, 0.72, 0.74, 0.04, 'b', 0.08],
      [2.0, 0.8, 0.24, 0.6, 0.64, 0.64, 0.02, 'b', 0.07]],
    wheels: { style: 'std', spokes: 5, w: 0.235, rim: [0.78, 0.62, 0.28], cap: [0.15, 0.15, 0.16], gap: 0.04 },
    build(K) {
      const P = K.paint, B = K.black, L = shell(K, (k, e, kind) => kind === 'r' && e >= 3 && e <= 5 ? WHITE : undefined), DC = L.decal;   // the white roof
      DC.band([[-0.75, 0], [-0.62, 0], [-0.62, 1], [-0.75, 1]], B, null, 0.01);
      DC.side([[-1.85, 0.32], [1.25, 0.32], [1.25, 0.4], [-1.85, 0.4]], B, null, 0.006);
      // two white stripes over the bonnet, the roof and the hatch (the carbon bonnet dark between them)
      DC.top([[1.0, -0.42], [1.98, -0.36], [1.98, 0.36], [1.0, 0.42]], DARK, 0.004);
      pair(sd => DC.top([[1.0, sd * 0.44], [1.98, sd * 0.38], [1.98, sd * 0.46], [1.0, sd * 0.52]], WHITE, 0.006));
      pair(sd => K.number(-0.3, 0.6, sd * 0.91, 0.28, { dir: sd < 0 ? '-z' : 'z' }));
      // the nose: the mesh mouth, slim lamps, the lip
      K.grille(2.003, 0.38, 0, 1.3, 0.22, { slats: 4 });
      pair(sd => K.headLamp(2.0, 0.55, sd * 0.56, 0.05, { shape: 'rect', w: 0.32, h: 0.06, ring: null }));
      K.box(1.94, 0.16, 0, 0.24, 0.025, 1.76, 0, DARK);
      // the tall wing on two uprights over the hatch's foot, its endplates
      K.wingPlank(-1.96, 1.18, -2.32, 1.21, 0.03, -0.86, 0.86, B);
      pair(sd => { K.endplate([[-1.92, 1.1], [-2.36, 1.1], [-2.36, 1.28], [-1.92, 1.25]], sd * 0.87, 0.012, B);
        K.endplate([[-2.12, 0.92], [-2.22, 0.92], [-2.26, 1.19], [-2.16, 1.19]], sd * 0.36, 0.016, DARK); });
      // the tail: twin round lamps each side in a black band, the big pipe in the middle, the orange tow strap
      K.rect(-2.282, 0.8, 0, 1.4, 0.16, B, { dir: '-x' });
      pair(sd => { K.tailLamp(-2.286, 0.8, sd * 0.6, 0.13, 0.13, { round: true }); K.tailLamp(-2.286, 0.8, sd * 0.42, 0.13, 0.13, { round: true }); });
      K.box(-2.22, 0.15, 0, 0.14, 0.13, 1.3, 0, DARK);
      K.exhaust(-2.33, 0.28, 0, 0.07, 0.2);
      K.rect(-2.283, 0.44, -0.55, 0.05, 0.13, TOW, { dir: '-x' });
      pair(sd => K.mirror(0.62, 0.95, sd * 0.91, { col: P }));
    },
  });

  /* 4 · MERJASEC V8: širok limuzinski drift avto z zadnjim pogonom (4 vrata, V8), L 4.95 W 2.04 H 1.40, medosje 2.90 */
  car({ id: 'pnmer', name: 'MERJASEC V8', cat: 'sportni', drive: 'FR', len: 4.95, wid: 2.04, a: 1.4, b: 1.5, rw: 0.35, ht: 1.4, mass: 1550, snd: 'v8',
    secs: [[-2.53, 0.86, 0.3, 0.82, 0.76, 0.92, 0.02, 'b', 0.11],
      [-2.46, 0.93, 0.29, 0.86, 0.84, 0.98, 0.03, 'b', 0.1],
      [-1.98, 0.97, 0.28, 0.88, 0.8, 1.0, 0.03, 'gr', 0.1],
      [-1.18, 0.98, 0.28, 0.92, 0.62, 1.37, 0.05, 'r', 0.1],
      [-0.3, 0.98, 0.28, 0.93, 0.62, 1.4, 0.05, 'r', 0.1],
      [0.15, 0.98, 0.28, 0.92, 0.64, 1.37, 0.05, 'gf', 0.1],
      [1.05, 0.99, 0.29, 0.88, 0.82, 0.95, 0.05, 'b', 0.1],
      [1.95, 0.99, 0.28, 0.82, 0.84, 0.88, 0.05, 'b', 0.09],
      [2.28, 0.94, 0.25, 0.72, 0.78, 0.78, 0.03, 'b', 0.08],
      [2.42, 0.86, 0.23, 0.62, 0.7, 0.66, 0.02, 'b', 0.07]],
    wheels: { style: 'deep', w: 0.28, wR: 0.3, rim: [0.18, 0.18, 0.2], gap: 0.03 },
    build(K) {
      const P = K.paint, B = K.black, L = shell(K), DC = L.decal;
      DC.band([[-0.12, 0], [0.0, 0], [0.0, 1], [-0.12, 1]], B, null, 0.01);                                  // the B-pillar (four doors)
      DC.band([[-1.2, 0], [-1.06, 0], [-1.06, 1], [-1.2, 1]], B, null, 0.01);                                // the C-pillar's foot
      DC.side([[-1.9, 0.3], [1.9, 0.3], [1.9, 0.5], [-1.9, 0.5]], DARK, null, 0.006);                        // the dark lower side
      pair(sd => K.number(-0.65, 0.66, sd * 0.99, 0.3, { dir: sd < 0 ? '-z' : 'z' }));
      // the bolted-on overfenders (dark), the power bulge on the long bonnet with its vents
      for (const A of K.arches) pair(sd => K.flare(A.x, 0.38, 0.47, sd * 0.92, sd * 1.02, DARK));
      K.box(1.45, 0.86, 0, 0.9, 0.06, 0.54, 0, K.shade(P, 0.92));
      pair(sd => DC.top([[1.2, sd * 0.32], [1.7, sd * 0.32], [1.7, sd * 0.45], [1.2, sd * 0.45]], DARK, 0.004));
      // the nose: the wide grille, slim lamps, the splitter
      K.grille(2.423, 0.38, 0, 1.3, 0.24, { slats: 4 });
      pair(sd => K.headLamp(2.42, 0.56, sd * 0.62, 0.05, { shape: 'rect', w: 0.36, h: 0.055, ring: null }));
      K.box(2.34, 0.15, 0, 0.3, 0.025, 1.96, 0, DARK);
      // the ducktail on the boot lid's end, the slim lamps joined across the tail, four pipes, the diffuser
      K.wingPlank(-2.34, 0.99, -2.55, 1.03, 0.03, -0.84, 0.84, P);
      K.rect(-2.532, 0.86, 0, 1.3, 0.03, RED, { dir: '-x' });
      pair(sd => K.tailLamp(-2.536, 0.86, sd * 0.68, 0.3, 0.06));
      K.box(-2.46, 0.15, 0, 0.14, 0.14, 1.4, 0, DARK);
      for (const z of [-0.66, -0.52, 0.52, 0.66]) K.exhaust(-2.56, 0.27, z, 0.05, 0.2);
      pair(sd => K.mirror(0.82, 1.0, sd * 1.0, { col: B }));
    },
  });

  /* 5 · TUR 6x6: terenski poltovornjak na šestih kolesih (vseh šest gnanih), dvojna kabina, odprt keson, L 6.00 W 2.20 H 2.15, osi pri
     +2.00 / -1.05 / -2.30 (prednja, srednja in zadnja); srednja os je look.wheels.mid (js/render.js: dve kolesi, ki se vrtita z zadnjima) */
  const TUR_MID = -1.05;
  car({ id: 'pntur', name: 'TUR 6x6', cat: 'teren', len: 6.0, wid: 2.2, a: 2.0, b: 2.3, rw: 0.47, ht: 2.15, mass: 3300, snd: 'v8',
    budget: { outer: 2400, inner: 1200 },
    secs: [[-3.05, 1.02, 0.74, 1.3, 1.0, 1.38, 0.01, 'b', 0.12],
      [-2.99, 1.05, 0.72, 1.34, 1.03, 1.42, 0.01, 'b', 0.12],
      [-0.72, 1.05, 0.72, 1.36, 1.03, 1.44, 0.01, 'gr', 0.12],
      [-0.68, 1.05, 0.72, 1.38, 0.92, 2.1, 0.03, 'r', 0.1],
      [0.78, 1.05, 0.72, 1.38, 0.92, 2.12, 0.03, 'gf', 0.1],
      [1.55, 1.06, 0.72, 1.34, 0.98, 1.52, 0.03, 'b', 0.12],
      [2.8, 1.05, 0.72, 1.3, 0.98, 1.46, 0.03, 'b', 0.12],
      [2.92, 1.0, 0.76, 1.22, 0.94, 1.38, 0.02, 'b', 0.12],
      [2.95, 0.96, 0.8, 1.14, 0.9, 1.3, 0.01, 'b', 0.1]],
    wheels: { style: 'knob', w: 0.36, rim: [0.16, 0.16, 0.17], cap: [0.2, 0.2, 0.21], gap: 0.08, mid: TUR_MID },
    build(K) {
      const P = K.paint, B = K.black;
      // the shell with three arches (the loft's default: the middle one is wheels.mid's), the bed open on top, the cab's back wall painted
      const L = shell(K, (k, e, kind) => k === 1 && e >= 3 && e <= 5 ? null : kind === 'gr' && (e === 2 || e === 6) ? P : undefined);
      const DC = L.decal;
      DC.band([[0.02, 0], [0.14, 0], [0.14, 1], [0.02, 1]], B, null, 0.01);                                  // the B-pillar
      DC.side([[-0.6, 0.76], [1.42, 0.76], [1.42, 0.92], [-0.6, 0.92]], DARK, null, 0.006);                  // the dark cladding under the doors
      // the dark flares over all six wheels, the mud flaps behind the last ones, the steps under the doors
      for (const A of K.arches) pair(sd => K.flare(A.x, 0.56, 0.64, sd * 1.0, sd * 1.1, DARK));
      pair(sd => K.box(-2.82, 0.12, sd * 0.98, 0.02, 0.46, 0.3, 0, DARK));
      pair(sd => K.box(0.4, 0.58, sd * 1.02, 1.4, 0.05, 0.16, 0, DARK));
      // the front: the steel bumper with the bull bar, the big grille, round lamps, the winch
      K.box(2.92, 0.62, 0, 0.2, 0.22, 2.0, 0, DARK);
      pair(sd => K.bar([3.0, 0.84, sd * 0.78], [3.0, 1.3, sd * 0.6], 0.04, DARK, { n: 6 }));
      K.bar([3.0, 1.3, -0.6], [3.0, 1.3, 0.6], 0.04, DARK, { n: 6 });
      K.grille(2.955, 1.08, 0, 1.0, 0.3, { slats: 4 });
      pair(sd => K.headLamp(2.955, 1.12, sd * 0.74, 0.11, { ring: DARK }));
      K.box(2.98, 0.66, 0, 0.12, 0.12, 0.5, 0, [0.3, 0.3, 0.32]);
      // the snorkel up the right pillar, the light bar over the windscreen, the roof rack
      K.cyl([1.5, 1.32, 1.08], [0.9, 2.05, 1.06], 0.07, DARK, { n: 8 });
      K.box(0.62, 2.13, 0, 0.12, 0.08, 1.5, 0, DARK);
      K.rect(0.682, 2.17, 0, 1.4, 0.05, LED);
      pair(sd => K.bar([-0.55, 2.16, sd * 0.78], [0.5, 2.16, sd * 0.78], 0.02, DARK, { n: 5 }));
      // the bed: the sports bar behind the cab, the spare wheel lying in it, the tailgate's lamps and the rear bumper with its step
      K.bar([-0.9, 1.44, -0.98], [-0.9, 1.95, -0.86], 0.045, DARK, { n: 6 }); K.bar([-0.9, 1.44, 0.98], [-0.9, 1.95, 0.86], 0.045, DARK, { n: 6 });
      K.bar([-0.9, 1.95, -0.86], [-0.9, 1.95, 0.86], 0.045, DARK, { n: 6 });
      K.tyre(-1.9, 1.02, 0, { axis: 'y' });
      pair(sd => K.tailLamp(-3.056, 1.1, sd * 0.94, 0.12, 0.3));
      K.box(-3.02, 0.6, 0, 0.18, 0.16, 2.0, 0, DARK);
      pair(sd => K.mirror(0.72, 1.64, sd * 1.14, { col: DARK, w: 0.18, h: 0.24 }));
    },
  });

  /* 6 · VRAN 01: izvenserijski unikat, hot rod (kupe s spuščeno streho, odprta kolesa, kompresor nad pokrovom), L 4.20 W 2.00 H 1.26,
     medosje 2.75; samo slika, v kodo po potrditvi uporabnika */
  car({ id: 'pnvran', name: 'VRAN 01', cat: 'posebni', drive: 'FR', len: 4.2, wid: 2.0, a: 1.25, b: 1.5, rw: 0.36, ht: 1.26, mass: 1150, snd: 'v8s',
    body: { wz: 0.12 },
    secs: [[-2.0, 0.5, 0.42, 0.76, 0.46, 0.84, 0.05, 'b', 0.12],
      [-1.86, 0.6, 0.38, 0.86, 0.54, 0.95, 0.04, 'gr', 0.12],
      [-1.45, 0.63, 0.37, 0.92, 0.5, 1.2, 0.04, 'r', 0.1],
      [-0.78, 0.63, 0.37, 0.93, 0.52, 1.23, 0.04, 'gf', 0.1],
      [-0.62, 0.63, 0.38, 0.92, 0.58, 0.96, 0.03, 'b', 0.1],
      [0.55, 0.5, 0.42, 0.86, 0.42, 0.9, 0.04, 'b', 0.12],
      [1.55, 0.42, 0.42, 0.84, 0.36, 0.88, 0.04, 'b', 0.12],
      [1.75, 0.4, 0.42, 0.86, 0.34, 0.92, 0.05, 'b', 0.12],
      [1.8, 0.36, 0.45, 0.82, 0.3, 0.88, 0.04, 'b', 0.12]],
    wheels: { style: 'retro', w: 0.2, wR: 0.44, gap: 0.04, arch: false },
    build(K) {
      const P = K.paint, B = K.black;
      const L = K.loft(K.secs(K.body.secs), (k, e, kind) => (kind === 'gf' && e >= 2 && e <= 6) || (kind === 'r' && (e === 2 || e === 6)) || (kind === 'gr' && e >= 3 && e <= 5) ? K.GLASS
        : e === 0 || e === 8 ? K.shade(P, 0.5) : P, { arches: false, caps: { front: { col: P }, rear: { col: P } } });
      const DC = L.decal;
      // the pinstripes: a thin cream line along the belt and two over the bonnet
      const CREAM = [0.95, 0.88, 0.7];
      DC.side([[-1.95, 0.74], [1.7, 0.74], [1.7, 0.76], [-1.95, 0.76]], CREAM, null, 0.008);
      pair(sd => DC.top([[-0.5, sd * 0.1], [1.7, sd * 0.08], [1.7, sd * 0.1], [-0.5, sd * 0.12]], CREAM, 0.006));
      // the supercharger standing out of the bonnet: the blower's case, its scoop over it, the belt in front of it
      K.box(0.85, 0.88, 0, 0.62, 0.2, 0.34, 0, CHROME);
      K.box(0.9, 1.08, 0, 0.36, 0.16, 0.3, 0, DARK);
      K.rect(1.162, 0.96, 0, 0.2, 0.12, B);
      // the exposed headers: four short pipes a side out of the bonnet's flanks, angled back and down ("zoomies")
      for (let i = 0; i < 4; i++) pair(sd => K.cyl([0.95 - i * 0.18, 0.66, sd * 0.42], [0.62 - i * 0.18, 0.5, sd * 0.62], 0.032, CHROME, { n: 6 }));
      // the dropped front axle in plain view, the tall grille shell, round lamps on stalks beside it
      K.cyl([1.25, 0.3, -0.84], [1.25, 0.3, 0.84], 0.035, CHROME, { n: 6 });
      K.grille(1.802, 0.66, 0, 0.56, 0.38, { slats: 7, col: DARK, slatCol: CHROME, frame: CHROME });
      pair(sd => { K.bar([1.72, 0.62, sd * 0.3], [1.74, 0.82, sd * 0.52], 0.02, CHROME, { n: 5 }); K.headLamp(1.78, 0.84, sd * 0.54, 0.1, { ring: CHROME }); });
      // the tail: small round lamps, the fuel filler, no bumper
      pair(sd => K.tailLamp(-2.005, 0.62, sd * 0.38, 0.11, 0.11, { round: true }));
      K.discX(-2.004, 0.7, 0, 0.06, 8, CHROME, -1);
      // the rear axle's nerf bars under the tail, the chopped roof's dark top
      K.cyl([-1.95, 0.36, -0.55], [-1.95, 0.36, 0.55], 0.03, CHROME, { n: 6 });
      pair(sd => K.mirror(-0.62, 0.98, sd * 0.66, { col: CHROME, w: 0.08, h: 0.06 }));
    },
  });
})();
