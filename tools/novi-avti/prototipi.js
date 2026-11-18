/* Hitri prototipi novih avtov (docs/novi-avti.md): samo izhodišče za modele in za slike vprašanj `novi-avti-izbor` in `novi-avti-videz`,
   NE gre v igro (index.html ga ne naloži). Za ogled: kopija index.html z dodano vrstico <script src="tools/novi-avti/prototipi.js"></script>
   za js/cars/osa.js, nato index.html?proga=bathurst&avto=pnlos (id-ji pnosa, pnlos, pnloss, pnnos, pnnoss, pnsak, pnorel, pngams).
   OSA R je že narejen (js/cars/osa.js). Datoteko izbriše seja, ki naredi zadnji avto. */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  const CSP = { bx: 0.15, coast: -0.099, thr: -0.03, liftP: 0, pwr: 0, out: 1, turn: 1, w: 1.02 };
  function car(o) {
    VEHICLE_DEFS.push({
      id: o.id, name: o.name, cat: o.cat, ord: 90, drive: o.drive || 'AWD', desc: o.name,
      phys: { mass: o.mass || 1400, a: o.a, b: o.b, kI: 1.15, kw: o.kw || 260, redline: 7000, idle: 900, gears: [3.4, 2.15, 1.55, 1.2, 0.98, 0.83],
        final: 4.0, rw: o.rw, cDrag: 0.4, len: o.len, wid: o.wid, steerMax: 0.62 },
      arc: { amax: 1.8, kv: 2.1, rmin: 4.1 }, csp: CSP, stats: { power: 7, grip: 8, weight: 6, drift: 5 }, price: 50000, pk: 'ta1', field: [o.id],
      snd: { kind: o.snd || 'i4', hz: 1.1, turbo: 0.5, loud: 1 },
      parts: { set: 'car', ht: o.ht, y0: 0.2 },
      look: { body: Object.assign({ len: o.len, wid: o.wid, secs: o.secs }, o.body || {}), wheels: o.wheels, build: o.build },
    });
  }
  // the shell: paint, glass (windscreen, side windows along the roof, the rear glass), the sills black between the arches
  function shell(K, extra) {
    const P = K.paint, B = K.black, G = K.GLASS;
    const XA = K.arches[1].x + K.arches[1].half, XB = K.arches[0].x - K.arches[0].half;
    return K.loft(K.secs(K.body.secs), (k, e, kind, at) => {
      if (extra) { const c = extra(k, e, kind, at); if (c) return c; }
      if (e === 0 || e === 8) return at.arch || (at.x > XA && at.x < XB) ? B : K.shade(P, 0.55);
      if (kind === 'gf' && e >= 2 && e <= 6) return G;
      if (kind === 'r' && (e === 2 || e === 6)) return G;
      if (kind === 'gr' && e >= 3 && e <= 5) return G;
      return P;
    }, { caps: { front: { col: P }, rear: { col: P } } });
  }
  const pair = (f) => { for (const sd of [-1, 1]) f(sd); };
  const RED = [0.62, 0.04, 0.06], DARK = [0.08, 0.08, 0.09], LED = [0.95, 0.96, 1.0];

  /* 1 · OSA R: sodoben štirikolesni hot hatch (3 vrata), L 4.10 W 1.84 H 1.44, medosje 2.56 */
  car({ id: 'pnosa', name: 'OSA R', cat: 'mali', len: 4.13, wid: 1.84, a: 1.06, b: 1.5, rw: 0.34, ht: 1.44, mass: 1450, snd: 'i3',
    secs: [[-2.18, 0.8, 0.3, 0.84, 0.64, 0.92, 0.02, 'b', 0.12],
      [-2.12, 0.87, 0.29, 0.9, 0.7, 1.0, 0.03, 'gr', 0.11],
      [-1.82, 0.89, 0.28, 0.96, 0.56, 1.34, 0.04, 'r', 0.1],
      [-1.0, 0.9, 0.27, 0.98, 0.56, 1.39, 0.05, 'r', 0.1],
      [0.0, 0.9, 0.27, 0.96, 0.58, 1.37, 0.05, 'gf', 0.1],
      [0.95, 0.91, 0.28, 0.9, 0.76, 0.96, 0.05, 'b', 0.1],
      [1.55, 0.9, 0.27, 0.82, 0.76, 0.86, 0.05, 'b', 0.1],
      [1.8, 0.86, 0.25, 0.74, 0.72, 0.78, 0.04, 'b', 0.09],
      [1.9, 0.81, 0.24, 0.66, 0.66, 0.7, 0.03, 'b', 0.08],
      [1.95, 0.74, 0.25, 0.56, 0.58, 0.6, 0.02, 'b', 0.07]],
    wheels: { style: 'std', spokes: 10, w: 0.235, rim: [0.18, 0.18, 0.2], cap: [0.1, 0.1, 0.11], gap: 0.04 },
    build(K) {
      const P = K.paint, B = K.black, L = shell(K, (k, e, kind) => kind === 'r' && e >= 3 && e <= 5 ? B : null);   // the black roof
      L.decal.band([[-0.95, 0], [-0.82, 0], [-0.82, 1], [-0.95, 1]], B, null, 0.01);                     // the B-pillar
      L.decal.side([[-1.6, 0.31], [1.0, 0.31], [1.0, 0.4], [-1.6, 0.4]], B, null, 0.006);                  // the black skirts
      K.grille(1.955, 0.38, 0, 1.24, 0.22, { slats: 4 });                                                    // the big mouth
      pair(sd => K.headLamp(1.957, 0.555, sd * 0.5, 0.05, { shape: 'rect', w: 0.36, h: 0.05, ring: null }));  // slim LED lamps
      K.rect(1.956, 0.555, 0, 0.64, 0.03, B);                                                                // the slim grille between them
      pair(sd => { K.rect(-2.185, 0.84, sd * 0.56, 0.38, 0.1, B, { dir: '-x' }); K.tailLamp(-2.19, 0.84, sd * 0.56, 0.34, 0.06); });
      K.rect(-2.19, 0.84, 0, 0.74, 0.025, RED, { dir: '-x' });                                              // the light strip across the tailgate
      K.wingPlank(-1.76, 1.37, -2.1, 1.31, 0.03, -0.66, 0.66, B);                                             // the roof spoiler
      K.box(-2.12, 0.16, 0, 0.14, 0.14, 1.3, 0, B);                                                          // the diffuser
      for (const z of [-0.5, -0.36, 0.36, 0.5]) K.exhaust(-2.2, 0.27, z, 0.042, 0.18);                      // four tail pipes
      pair(sd => K.mirror(0.62, 1.0, sd * 0.94, { col: B }));
      pair(sd => K.flare(-1.5, 0.36, 0.42, sd * 0.86, sd * 0.93, P));                                        // the wide rear arches
    },
  });

  /* 2 · LOS V8: super karavan (4 vrata), L 5.00 W 1.96 H 1.47, medosje 2.98; LOS S: ista spredaj, limuzina */
  const losFront = [[0.0, 0.95, 0.28, 0.98, 0.64, 1.41, 0.05, 'gf', 0.1],
    [1.0, 0.96, 0.29, 0.9, 0.78, 0.98, 0.05, 'b', 0.1],
    [1.95, 0.95, 0.29, 0.84, 0.77, 0.88, 0.05, 'b', 0.1],
    [2.2, 0.9, 0.27, 0.76, 0.72, 0.8, 0.04, 'b', 0.09],
    [2.3, 0.85, 0.26, 0.68, 0.66, 0.72, 0.03, 'b', 0.08],
    [2.35, 0.78, 0.27, 0.58, 0.58, 0.62, 0.02, 'b', 0.07]];
  function losBuild(estate) {
    return function (K) {
      const P = K.paint, B = K.black, L = shell(K);
      L.decal.band([[-0.6, 0], [-0.45, 0], [-0.45, 1], [-0.6, 1]], B, null, 0.01);                       // the B-pillar
      if (estate) L.decal.band([[-1.9, 0], [-1.75, 0], [-1.75, 1], [-1.9, 1]], B, null, 0.01);          // the C-pillar (the third side window behind it)
      L.decal.side([[-2.0, 0.32], [1.4, 0.32], [1.4, 0.4], [-2.0, 0.4]], B, null, 0.006);
      K.grille(2.355, 0.42, 0, 0.9, 0.22, { slats: 5 });
      pair(sd => K.grille(2.355, 0.36, sd * 0.6, 0.26, 0.14, { slats: 2 }));                                  // the side intakes
      pair(sd => K.headLamp(2.357, 0.575, sd * 0.56, 0.05, { shape: 'rect', w: 0.36, h: 0.055, ring: null }));
      if (estate) {
        pair(sd => K.tailLamp(-2.69, 0.9, sd * 0.6, 0.36, 0.07));
        K.rect(-2.69, 0.9, 0, 0.84, 0.02, RED, { dir: '-x' });
        K.wingPlank(-2.36, 1.43, -2.6, 1.38, 0.025, -0.68, 0.68, B);                                       // the roof spoiler
        pair(sd => K.bar([-2.3, 1.475, sd * 0.6], [-0.15, 1.475, sd * 0.6], 0.016, [0.12, 0.12, 0.13], { n: 5 }));   // the roof rails
      } else {
        pair(sd => K.tailLamp(-2.69, 0.9, sd * 0.6, 0.38, 0.08));
        K.rect(-2.69, 0.9, 0, 0.84, 0.02, RED, { dir: '-x' });
        K.wingPlank(-2.5, 1.07, -2.68, 1.1, 0.02, -0.7, 0.7, P);                                            // the boot-lid lip
      }
      K.box(-2.64, 0.18, 0, 0.12, 0.13, 1.4, 0, B);
      for (const z of [-0.62, -0.5, 0.5, 0.62]) K.exhaust(-2.7, 0.28, z, 0.05, 0.18);
      pair(sd => K.mirror(0.75, 1.02, sd * 1.0, { col: B }));
    };
  }
  car({ id: 'pnlos', name: 'LOS V8', cat: 'sportni', len: 5.03, wid: 1.96, a: 1.4, b: 1.58, rw: 0.365, ht: 1.47, mass: 2050, snd: 'v8',
    secs: [[-2.68, 0.84, 0.32, 0.86, 0.66, 0.96, 0.03, 'b', 0.12],
      [-2.62, 0.9, 0.3, 0.9, 0.68, 1.02, 0.03, 'gr', 0.12],
      [-2.38, 0.93, 0.29, 0.98, 0.62, 1.38, 0.04, 'r', 0.1],
      [-1.2, 0.95, 0.28, 1.0, 0.62, 1.42, 0.05, 'r', 0.1]].concat(losFront),
    wheels: { style: 'std', spokes: 5, w: 0.26, rim: [0.32, 0.33, 0.35], cap: [0.12, 0.12, 0.13], gap: 0.04 },
    build: losBuild(true) });
  car({ id: 'pnloss', name: 'LOS V8 S', cat: 'sportni', len: 5.03, wid: 1.96, a: 1.4, b: 1.58, rw: 0.365, ht: 1.47, mass: 1980, snd: 'v8',
    secs: [[-2.68, 0.84, 0.32, 0.86, 0.7, 0.98, 0.03, 'b', 0.12],
      [-2.55, 0.9, 0.3, 0.92, 0.74, 1.05, 0.03, 'b', 0.12],
      [-2.02, 0.93, 0.29, 0.93, 0.72, 1.09, 0.04, 'gr', 0.1],
      [-1.22, 0.95, 0.28, 1.0, 0.62, 1.41, 0.05, 'r', 0.1]].concat(losFront),
    wheels: { style: 'std', spokes: 5, w: 0.26, rim: [0.32, 0.33, 0.35], cap: [0.12, 0.12, 0.13], gap: 0.04 },
    build: losBuild(false) });

  /* 3 · NOSOROG E: električni pickup (4 motorji), L 5.45 W 2.06 H 1.92, medosje 3.45; različica SUV */
  const nosFront = [[-0.98, 1.0, 0.56, 1.22, 0.86, 1.86, 0.03, 'r', 0.1],
    [0.32, 1.0, 0.56, 1.22, 0.86, 1.86, 0.03, 'gf', 0.1],
    [1.18, 1.01, 0.56, 1.2, 0.92, 1.3, 0.03, 'b', 0.12],
    [2.45, 1.0, 0.55, 1.16, 0.92, 1.26, 0.03, 'b', 0.12],
    [2.62, 0.96, 0.58, 1.1, 0.88, 1.2, 0.02, 'b', 0.12],
    [2.66, 0.92, 0.62, 1.04, 0.84, 1.14, 0.01, 'b', 0.1]];
  function nosBuild(suv) {
    return function (K) {
      const P = K.paint, B = K.black, L = shell(K, (k, e, kind, at) => kind === 'gr' && (e === 2 || e === 6) ? P : null);
      L.decal.band([[0.0, 0], [0.12, 0], [0.12, 1], [0.0, 1]], B, null, 0.01);                          // the B-pillar
      L.decal.side([[-2.0, 0.6], [1.0, 0.6], [1.0, 0.78], [-2.0, 0.78]], DARK, null, 0.006);            // the dark cladding along the sills
      pair(sd => K.flare(1.7, 0.47, 0.53, sd * 0.97, sd * 1.04, DARK)); pair(sd => K.flare(-1.75, 0.47, 0.53, sd * 0.97, sd * 1.04, DARK));
      K.rect(2.67, 1.08, 0, 1.6, 0.045, LED);                                                            // the light bar across the nose
      pair(sd => K.headLamp(2.665, 0.98, sd * 0.72, 0.05, { shape: 'rect', w: 0.22, h: 0.06, ring: null }));
      K.rect(2.67, 0.82, 0, 1.2, 0.22, DARK);                                                            // the closed grille panel
      K.box(2.6, 0.5, 0, 0.18, 0.14, 1.5, 0, DARK);                                                      // the skid plate
      if (suv) {
        K.rect(-2.81, 1.2, 0, 1.7, 0.045, RED, { dir: '-x' });                                           // the light bar across the tailgate
        pair(sd => K.tailLamp(-2.815, 1.2, sd * 0.86, 0.14, 0.045));
        pair(sd => K.bar([-2.5, 1.9, sd * 0.68], [-0.6, 1.9, sd * 0.68], 0.02, DARK, { n: 5 }));     // the roof rails
      } else {
        K.rect(-2.81, 1.12, 0, 1.7, 0.045, RED, { dir: '-x' });                                          // the light bar across the tailgate
        pair(sd => K.tailLamp(-2.815, 1.12, sd * 0.86, 0.14, 0.045));
        K.box(-1.95, 1.26, 0, 1.6, 0.02, 1.9, 0, DARK);                                                  // the bed's cover
      }
      K.box(-2.76, 0.52, 0, 0.12, 0.16, 1.7, 0, DARK);                                                    // the rear step bumper
      pair(sd => K.mirror(0.5, 1.45, sd * 1.12, { col: P }));
    };
  }
  car({ id: 'pnnos', name: 'NOSOROG E', cat: 'elektricni', len: 5.45, wid: 2.06, a: 1.7, b: 1.75, rw: 0.43, ht: 1.92, mass: 3100, snd: 'ev',
    secs: [[-2.8, 0.98, 0.6, 1.12, 0.94, 1.22, 0.01, 'b', 0.12],
      [-2.74, 1.0, 0.58, 1.18, 0.96, 1.27, 0.01, 'b', 0.12],
      [-1.02, 1.0, 0.57, 1.2, 0.96, 1.27, 0.01, 'gr', 0.12]].concat(nosFront),
    wheels: { style: 'knob', w: 0.31, rim: [0.2, 0.2, 0.22], gap: 0.06 },
    build: nosBuild(false) });
  car({ id: 'pnnoss', name: 'NOSOROG E SUV', cat: 'elektricni', len: 5.3, wid: 2.06, a: 1.7, b: 1.75, rw: 0.43, ht: 1.92, mass: 3000, snd: 'ev',
    secs: [[-2.8, 0.98, 0.6, 1.12, 0.9, 1.26, 0.02, 'b', 0.12],
      [-2.74, 1.0, 0.58, 1.18, 0.9, 1.32, 0.02, 'gr', 0.12],
      [-2.5, 1.0, 0.57, 1.21, 0.86, 1.84, 0.03, 'r', 0.1]].concat(nosFront),
    wheels: { style: 'knob', w: 0.31, rim: [0.2, 0.2, 0.22], gap: 0.06 },
    build: nosBuild(true) });

  /* 4 · ŠAKAL D: sodoben drift kupe (široka karoserija, veliko krilo), L 4.50 W 2.00 H 1.28, medosje 2.58 */
  car({ id: 'pnsak', name: 'ŠAKAL D', cat: 'sportni', drive: 'FR', len: 4.5, wid: 2.0, a: 1.26, b: 1.32, rw: 0.34, ht: 1.28, mass: 1350, snd: 'i6',
    secs: [[-2.26, 0.86, 0.26, 0.74, 0.7, 0.84, 0.02, 'b', 0.1],
      [-2.15, 0.94, 0.25, 0.8, 0.78, 0.9, 0.03, 'b', 0.1],
      [-1.85, 0.97, 0.25, 0.82, 0.7, 0.96, 0.03, 'gr', 0.1],
      [-0.95, 0.96, 0.25, 0.84, 0.56, 1.24, 0.04, 'r', 0.1],
      [-0.35, 0.96, 0.25, 0.85, 0.56, 1.27, 0.04, 'r', 0.1],
      [0.15, 0.96, 0.25, 0.84, 0.58, 1.25, 0.04, 'gf', 0.1],
      [0.95, 0.98, 0.25, 0.78, 0.74, 0.84, 0.04, 'b', 0.1],
      [1.95, 0.96, 0.24, 0.7, 0.74, 0.76, 0.04, 'b', 0.09],
      [2.18, 0.88, 0.2, 0.62, 0.7, 0.68, 0.03, 'b', 0.08],
      [2.24, 0.8, 0.2, 0.56, 0.62, 0.62, 0.02, 'b', 0.07]],
    wheels: { style: 'deep', w: 0.27, rim: [0.85, 0.86, 0.88], gap: 0.03 },
    build(K) {
      const P = K.paint, B = K.black, L = shell(K);
      L.decal.side([[-1.6, 0.27], [1.3, 0.27], [1.3, 0.36], [-1.6, 0.36]], B, null, 0.006);
      L.decal.side([[-0.9, 0.5], [0.6, 0.5], [0.45, 0.68], [-1.05, 0.68]], K.rgb(0x111111), null, 0.008);   // the livery's dark panel on the doors
      pair(sd => K.number(-0.2, 0.59, sd * 0.985, 0.3, { dir: sd > 0 ? 'z' : '-z' }));
      for (const A of K.arches) pair(sd => K.flare(A.x, 0.37, 0.44, sd * 0.92, sd * 1.0, DARK));            // bolted-on flares
      pair(sd => K.headLamp(2.245, 0.565, sd * 0.56, 0.05, { shape: 'rect', w: 0.3, h: 0.05, ring: null }));
      K.grille(2.245, 0.38, 0, 1.2, 0.22, { slats: 3 });
      K.box(2.2, 0.17, 0, 0.3, 0.025, 1.9, 0, B);                                                            // the splitter
      pair(sd => K.tailLamp(-2.265, 0.78, sd * 0.62, 0.3, 0.07));
      K.wingPlank(-1.98, 1.24, -2.36, 1.2, 0.035, -0.86, 0.86, B);                                            // the GT wing ...
      pair(sd => { K.endplate([[-1.95, 1.12], [-2.4, 1.12], [-2.4, 1.32], [-1.95, 1.3]], sd * 0.87, 0.012, B); K.bar([-2.15, 0.92, sd * 0.45], [-2.15, 1.21, sd * 0.45], 0.02, B); });   // ... on two uprights
      K.box(-2.22, 0.16, 0, 0.16, 0.14, 1.5, 0, B);
      K.exhaust(-2.28, 0.26, 0.5, 0.06, 0.2);
      pair(sd => K.mirror(0.55, 0.92, sd * 1.02, { col: B }));
    },
  });

  /* 5 · OREL GT3: dirkalnik GT3 z motorjem na sredini, L 4.62 W 2.04 H 1.18, medosje 2.68 */
  car({ id: 'pnorel', name: 'OREL GT3', cat: 'dirkalni', drive: 'MR', len: 4.62, wid: 2.04, a: 1.45, b: 1.23, rw: 0.345, ht: 1.2, mass: 1280, snd: 'v10',
    secs: [[-2.15, 0.92, 0.2, 0.8, 0.82, 0.92, 0.02, 'b', 0.1],
      [-2.0, 0.99, 0.19, 0.84, 0.86, 0.96, 0.03, 'b', 0.1],
      [-0.9, 1.0, 0.19, 0.86, 0.6, 1.02, 0.04, 'gr', 0.1],
      [-0.68, 0.98, 0.19, 0.86, 0.5, 1.14, 0.04, 'r', 0.1],
      [-0.15, 0.97, 0.19, 0.86, 0.5, 1.16, 0.04, 'r', 0.1],
      [0.2, 0.97, 0.19, 0.84, 0.52, 1.13, 0.04, 'gf', 0.1],
      [1.05, 1.0, 0.19, 0.76, 0.8, 0.82, 0.04, 'b', 0.1],
      [1.75, 1.01, 0.19, 0.72, 0.82, 0.78, 0.04, 'b', 0.09],
      [2.3, 0.9, 0.14, 0.58, 0.76, 0.62, 0.03, 'b', 0.08],
      [2.47, 0.8, 0.12, 0.46, 0.66, 0.5, 0.02, 'b', 0.07]],
    wheels: { style: 'slick', w: 0.31, rim: [0.16, 0.16, 0.17], gap: 0.03 },
    build(K) {
      const P = K.paint, B = K.black, L = shell(K);
      L.decal.side([[-1.9, 0.22], [1.9, 0.22], [1.9, 0.3], [-1.9, 0.3]], B, null, 0.006);
      L.decal.side([[-1.4, 0.36], [0.9, 0.36], [0.9, 0.52], [-1.4, 0.52]], K.rgb(0x1c5fd6), null, 0.008);   // the livery's band
      pair(sd => K.number(-0.25, 0.66, sd * 0.995, 0.3, { dir: sd > 0 ? 'z' : '-z' }));
      pair(sd => K.headLamp(2.475, 0.43, sd * 0.5, 0.05, { shape: 'rect', w: 0.28, h: 0.05, ring: null }));
      K.grille(2.475, 0.27, 0, 1.0, 0.14, { slats: 2 });
      K.box(2.36, 0.1, 0, 0.26, 0.025, 1.9, 0, B);                                                         // the splitter
      pair(sd => K.box(2.25, 0.3, sd * 0.92, 0.2, 0.02, 0.12, 0, B));                                         // the dive planes
      for (const x of [1.45, -1.23]) pair(sd => { for (let i = 0; i < 4; i++) K.rect(x + 0.1 - i * 0.07, 0.62 + i * 0.02, sd * 0.92, 0.05, 0.22, B, { dir: 'y' }); });   // louvres over the wheels
      K.box(-0.45, 1.14, 0, 0.36, 0.12, 0.3, 0, B);                                                           // the roof scoop
      pair(sd => K.tailLamp(-2.155, 0.84, sd * 0.66, 0.34, 0.05));
      K.wingPlank(-1.8, 1.3, -2.3, 1.25, 0.035, -0.95, 0.95, B);                                              // the big wing ...
      pair(sd => { K.endplate([[-1.75, 1.15], [-2.35, 1.15], [-2.35, 1.38], [-1.75, 1.36]], sd * 0.96, 0.012, B);
        K.bar([-2.05, 0.96, sd * 0.35], [-1.95, 1.33, sd * 0.35], 0.02, B); });                              // ... on swan necks
      K.box(-2.12, 0.1, 0, 0.36, 0.16, 1.6, 0, B);                                                            // the diffuser
      pair(sd => K.exhaust(-2.17, 0.36, sd * 0.3, 0.05, 0.2));
      pair(sd => K.mirror(0.65, 0.92, sd * 1.04, { col: B }));
      K.rect(-2.16, 0.6, 0, 0.12, 0.08, RED, { dir: '-x' });                                                  // the rain light
    },
  });

  /* 6 · GAMS RH: relijski hibrid Rally1, L 4.20 W 1.88 H 1.46, medosje 2.63 */
  car({ id: 'pngams', name: 'GAMS RH', cat: 'reli', len: 4.2, wid: 1.88, a: 1.27, b: 1.36, rw: 0.33, ht: 1.46, mass: 1260, snd: 'i4',
    secs: [[-2.08, 0.82, 0.32, 0.84, 0.64, 0.96, 0.02, 'b', 0.12],
      [-2.02, 0.88, 0.31, 0.88, 0.7, 1.02, 0.03, 'gr', 0.11],
      [-1.72, 0.9, 0.3, 0.92, 0.62, 1.38, 0.04, 'r', 0.1],
      [-0.95, 0.91, 0.29, 0.94, 0.64, 1.44, 0.05, 'r', 0.1],
      [-0.05, 0.91, 0.29, 0.92, 0.64, 1.42, 0.05, 'gf', 0.1],
      [0.8, 0.91, 0.3, 0.88, 0.76, 0.98, 0.05, 'b', 0.1],
      [1.7, 0.9, 0.29, 0.82, 0.76, 0.88, 0.05, 'b', 0.1],
      [2.05, 0.84, 0.27, 0.74, 0.7, 0.78, 0.04, 'b', 0.09],
      [2.12, 0.78, 0.28, 0.68, 0.64, 0.72, 0.02, 'b', 0.08]],
    wheels: { style: 'std', spokes: 6, w: 0.25, rim: [0.9, 0.9, 0.9], cap: [0.3, 0.3, 0.32], gap: 0.05 },
    build(K) {
      const P = K.paint, B = K.black, L = shell(K);
      L.decal.band([[-0.95, 0], [-0.82, 0], [-0.82, 1], [-0.95, 1]], B, null, 0.01);
      L.decal.side([[-1.4, 0.34], [0.9, 0.34], [0.9, 0.62], [-1.4, 0.62]], K.rgb(0x1c5fd6), null, 0.008);   // the livery
      pair(sd => K.number(-0.3, 0.74, sd * 0.915, 0.28, { dir: sd > 0 ? 'z' : '-z' }));
      for (const A of K.arches) pair(sd => K.flare(A.x, 0.37, 0.45, sd * 0.86, sd * 0.95, P));              // the big arches
      pair(sd => K.headLamp(2.127, 0.62, sd * 0.52, 0.05, { shape: 'rect', w: 0.3, h: 0.06, ring: null }));
      K.grille(2.127, 0.44, 0, 1.2, 0.26, { slats: 3 });
      K.box(2.05, 0.2, 0, 0.26, 0.03, 1.8, 0, B);                                                            // the splitter
      pair(sd => K.tailLamp(-2.085, 0.88, sd * 0.58, 0.3, 0.07));
      K.wingPlank(-1.62, 1.44, -2.12, 1.4, 0.035, -0.9, 0.9, B);                                              // the big rear wing on the roof's edge
      pair(sd => K.endplate([[-1.6, 1.3], [-2.15, 1.3], [-2.15, 1.5], [-1.6, 1.48]], sd * 0.91, 0.012, B));
      K.box(-0.5, 1.44, 0, 0.36, 0.1, 0.34, 0, B);                                                            // the roof scoop
      for (const A of K.arches) pair(sd => K.rect(A.x - 0.42, 0.24, sd * 0.84, 0.02, 0.28, DARK, { dir: '-x' }));   // the mud flaps
      K.box(-2.05, 0.18, 0, 0.16, 0.14, 1.4, 0, B);
      K.exhaust(-2.1, 0.3, 0.45, 0.05, 0.2);
      pair(sd => K.mirror(0.62, 1.0, sd * 0.98, { col: B }));
    },
  });
})();
