/* The older road cars (js/core.js MODELS 0..3: KAZE RS coupe, VORTEX 4WD sedan, PICO TURBO hatch, STREGA MR wedge; and VIHAR V8, muscleGeometry's) on the level of the
   KOLIBRI (docs/avti-kolibri.md, skupina starejsi): patch defs with a look and mounts of their own. The stock car is drawn as ever by its
   own builder (render.js carGeometry: the same triangles, a rival's and the road traffic's too); only with the garage's parts fitted is the
   player's car drawn by the kit, through this look: the same loft (BODIES' sections, the same ring), the same lamps, grille, band, mirrors
   and spoiler where the builder puts them, so the car looks the same with the parts on it. Physics, part table and everything else stay the
   model's (a patch adds look and mounts only). The sections: render.js BODIES (look units = metres: each body's len / wid is its car's). */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  // render.js BODIES' sections (kept in step by tests/deli.test.js: starejsi), [x, w, yb, ybelt, wt, yt, cr, kind]; spoiler: the builder's wing
  const B = {
    coupe: { len: 4.35, wid: 1.78, spoiler: true, engRear: false, secs: [
      [-2.18, 0.84, 0.32, 0.66, 0.74, 0.72, 0.01, 'b'], [-1.98, 0.88, 0.28, 0.70, 0.80, 0.80, 0.02, 'b'], [-1.30, 0.89, 0.27, 0.72, 0.82, 0.83, 0.03, 'b'],
      [-1.02, 0.89, 0.27, 0.74, 0.76, 0.86, 0.02, 'gr'], [-0.30, 0.89, 0.27, 0.76, 0.64, 1.22, 0.03, 'r'], [0.30, 0.89, 0.27, 0.76, 0.64, 1.24, 0.03, 'gf'],
      [0.98, 0.89, 0.27, 0.74, 0.80, 0.84, 0.03, 'b'], [1.75, 0.88, 0.28, 0.70, 0.80, 0.76, 0.03, 'b'], [2.18, 0.82, 0.33, 0.58, 0.72, 0.62, 0.01, 'b']] },
    sedan: { len: 4.55, wid: 1.80, spoiler: true, engRear: false, secs: [
      [-2.28, 0.84, 0.32, 0.68, 0.76, 0.74, 0.01, 'b'], [-2.05, 0.89, 0.28, 0.72, 0.82, 0.84, 0.02, 'b'], [-1.45, 0.90, 0.27, 0.74, 0.84, 0.87, 0.03, 'b'],
      [-1.18, 0.90, 0.27, 0.76, 0.78, 0.90, 0.02, 'gr'], [-0.55, 0.90, 0.27, 0.78, 0.66, 1.36, 0.03, 'r'], [0.45, 0.90, 0.27, 0.78, 0.66, 1.38, 0.03, 'gf'],
      [1.10, 0.90, 0.27, 0.76, 0.82, 0.88, 0.03, 'b'], [1.85, 0.89, 0.28, 0.72, 0.82, 0.80, 0.03, 'b'], [2.28, 0.83, 0.33, 0.60, 0.74, 0.66, 0.01, 'b']] },
    hatch: { len: 3.95, wid: 1.70, spoiler: false, engRear: false, secs: [
      [-1.98, 0.82, 0.33, 0.70, 0.72, 0.86, 0.01, 'b'], [-1.88, 0.84, 0.30, 0.74, 0.74, 0.90, 0.02, 'gr'], [-1.55, 0.85, 0.29, 0.76, 0.66, 1.34, 0.03, 'r'],
      [0.25, 0.85, 0.29, 0.78, 0.66, 1.40, 0.03, 'gf'], [0.85, 0.85, 0.29, 0.76, 0.78, 0.90, 0.03, 'b'], [1.60, 0.84, 0.30, 0.72, 0.78, 0.82, 0.03, 'b'],
      [1.98, 0.80, 0.34, 0.60, 0.72, 0.68, 0.01, 'b']] },
    wedge: { len: 4.2, wid: 1.82, spoiler: true, engRear: true, secs: [
      [-2.10, 0.88, 0.30, 0.66, 0.80, 0.74, 0.01, 'b'], [-1.90, 0.91, 0.27, 0.72, 0.86, 0.84, 0.02, 'b'], [-0.95, 0.91, 0.26, 0.74, 0.80, 0.88, 0.02, 'gr'],
      [-0.55, 0.91, 0.26, 0.74, 0.62, 1.10, 0.03, 'r'], [0.25, 0.91, 0.26, 0.72, 0.64, 1.12, 0.03, 'gf'], [1.05, 0.90, 0.26, 0.66, 0.80, 0.72, 0.03, 'b'],
      [1.80, 0.86, 0.27, 0.56, 0.78, 0.60, 0.02, 'b'], [2.10, 0.80, 0.30, 0.48, 0.72, 0.50, 0.01, 'b']] },
  };
  const AX = { coupe: [1.2, 1.3], sedan: [1.25, 1.35], hatch: [1.02, 1.4], wedge: [1.34, 1.12] };
  const LAMP = [1, 0.97, 0.82], DARK = [0.08, 0.08, 0.09], BAND = [0.1, 0.1, 0.11], STRUT = [0.12, 0.12, 0.13];
  const row = (s) => ({ x: s[0], w: s[1], yb: s[2], ybelt: s[3], wt: s[4], yt: s[5], cr: s[6], k: s[7] });
  // the builder's pieces, in look units (render.js carGeometry: its headlights and grille, the rear bumper's band, the mirrors, the spoiler)
  function geo(b) {
    const S = b.secs.map(row), F = S[S.length - 1], R = S[0], ws = S.find(s => s.k === 'gf'), hly = (F.yb + F.ybelt) / 2 + 0.03;
    return { S, F, R, ws, hly, head: { x: F.x + 0.02, y: hly + 0.005, z: F.w * 0.6, w: 0.34, h: 0.15 },
      grille: { x: F.x + 0.02, y: hly - 0.05, w: F.w * 0.7, h: 0.14 }, band: { x: R.x - 0.03, y: R.yb + 0.09, w: R.w * 1.6, h: 0.14 },
      tail: { x: R.x - 0.06, y: R.ybelt - 0.085, z: R.w * 0.6, w: 0.42, h: 0.15 },
      mirror: { x: ws.x + 0.45, y: ws.ybelt + 0.05, z: ws.w + 0.07 }, wing: b.spoiler ? { x: R.x + 0.28, y0: S[1].yt - 0.02, y: S[1].yt + 0.28, w: R.w * 0.95 } : null };
  }
  function look(key) {
    const b = B[key], G = geo(b);
    return {
      body: { len: b.len, wid: b.wid, secs: b.secs, wz: 0.1, engRear: b.engRear },
      wheels: { style: 'std', spokes: 5, w: 0.24, rim: [0.62, 0.64, 0.68], tyre: [0.08, 0.08, 0.09] },
      build(K) {
        const P = K.paint, sk = K.shade(K.paint, 0.62);
        // the builder's loft: the skirts the paint at 62 %, the side, the glass bands, the top's edges, the crown in the stripe colour
        const L = K.loft(K.body.secs, (k, e, kind) => { const gt = kind === 'gf' || kind === 'gr';
          return e === 0 || e === 8 ? sk : e === 1 || e === 7 ? P : e === 2 || e === 6 ? (kind === 'b' ? P : K.GLASS) : e === 3 || e === 5 ? (gt ? K.GLASS : P) : gt ? K.GLASS : K.strp; },
          { caps: { front: { col: P }, rear: { col: P } } });
        const H = G.head, T = G.tail, Mi = G.mirror;
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(H.x, H.y, sd * H.z, 0.07, { shape: 'rect', w: H.w, h: H.h, ring: null, col: LAMP }); });
        K.part('bumperF', () => K.deli('maska', () => K.box(G.F.x - 0.02, G.hly - 0.12, 0, 0.08, 0.14, G.grille.w, 0, DARK)));
        K.part('bumperR', () => K.box(G.R.x + 0.02, G.R.yb + 0.02, 0, 0.1, 0.14, G.band.w, 0, BAND));
        K.deli('zadnje_luci', () => { for (const sd of [-1, 1]) K.tailLamp(T.x, T.y, sd * T.z, T.w, T.h); });
        K.deli('ogledala', () => { for (const sd of [-1, 1]) K.part(sd < 0 ? 'mirrorL' : 'mirrorR', () => K.box(Mi.x, Mi.y - 0.05, sd * Mi.z, 0.14, 0.1, 0.12, 0, P)); });
        if (G.wing) { const Wg = G.wing; K.part('trunk', () => K.deli('krilo', () => {
          for (const sd of [-1, 1]) K.box(Wg.x, Wg.y0, sd * G.R.w * 0.62, 0.12, 0.3, 0.06, 0, STRUT);
          K.box(Wg.x, Wg.y, 0, 0.36, 0.06, G.R.w * 1.9, 0, K.strp); })); }
        else K.part('trunk', () => K.deli('krilo', () => {}));
        for (const id of ['aero', 'hauba', 'zmigavci', 'relijske_luci', 'auspuh', 'prtljaznik', 'vlecne_kljuke', 'lovilci_blata', 'streha', 'stresna_zajemalka',
          'antena', 'crte', 'celjusti', 'dim_gum', 'nalepke', 'soncni_pas', 'zamasek', 'akumulator', 'filter_zraka', 'turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji']) K.deli(id, () => {});
        K.part('trunk', () => K.deli('zaluzije', () => {}));
        K.seat(G.ws.x - 0.75, 0.5, -0.36); K.seat(G.ws.x - 0.75, 0.5, 0.36); K.engine(b.engRear ? -AX[key][1] - 0.15 : AX[key][0] + 0.15, G.S[0].yb + 0.05, 0);   // (the inner block)
        return L;
      },
    };
  }
  // where the garage's parts go (js/deli.js, look units): measured from the same sections and pieces (the axles from the model: a, b)
  const ip = (S, x, k) => { if (x <= S[0].x) return S[0][k]; for (let i = 1; i < S.length; i++) if (x <= S[i].x) { const a = S[i - 1], b = S[i]; return a[k] + (b[k] - a[k]) * (x - a.x) / (b.x - a.x); } return S[S.length - 1][k]; };
  function mounts(key) {
    const b = B[key], G = geo(b), S = G.S, F = G.F, R = G.R, [fa, fb] = AX[key], at = (x, k) => ip(S, x, k);
    const gi = S.findIndex(s => s.k === 'gf'), ri = S.findIndex(s => s.k === 'r'), gri = S.findIndex(s => s.k === 'gr');
    const wsTop = S[gi].x, wsBase = S[gi + 1].x, roofR = S[ri].x, grFoot = gri < 0 ? roofR : S[gri].x, d0 = wsBase, d1 = wsBase - 1.15, mid = (roofR + wsTop) / 2;
    const deck = !b.spoiler ? null : S[1];   // (a boot's deck: the wing on it; the hatch's on the roof's rear edge)
    const H = G.head, T = G.tail, Mi = G.mirror, eng = b.engRear ? -fb - 0.15 : fa + 0.15;
    const kx = deck ? R.x + 0.5 : roofR + 0.05;
    const out = {
      krilo: { x: kx, w: at(kx, 'wt') * 0.9, part: 'trunk' },
      zarometi: { x: H.x, y0: H.y, lean: 0, zc: H.z, yc: H.y, s: 0.62, depth: 0.03, hosts: ['body', 'body'] },
      platisca: {},
      aero: { xf: F.x, xr: R.x, w: F.w * 0.92, yf: F.yb, yr: R.yb, sill: [-fb + 0.47, fa - 0.47], ws: at(0, 'w') * 0.95, ys: at(0, 'yb') - 0.03, exh: [-0.45, 0.035] },
      hauba: { x0: wsBase + 0.2, x1: Math.max(S[S.length - 2].x - 0.08, wsBase + 0.72), w: Math.min(at(wsBase, 'wt'), F.wt) * 0.4, bulge: 0.5 },
      maska: { x: F.x, y0: G.hly - 0.05, lean: 0, yc: G.hly - 0.05, w: G.grille.w * 0.9, h: 0.1 },
      zmigavci: { front: { x: F.x, y: F.yb + 0.06, z: 0.5 * F.w / 0.82, w: 0.12, h: 0.04, part: 'bumperF' }, side: { x: fa + 0.42, y: at(fa + 0.42, 'ybelt') - 0.1, z: at(fa + 0.42, 'w'), host: 'body' },
        rear: { x: R.x, y: R.yb + 0.22, z: 0.22, part: 'bumperR' }, mirror: { x: Mi.x + 0.075, y: Mi.y, z: Mi.z, w: 0.1, parts: ['mirrorL', 'mirrorR'] } },
      relijske_luci: { bumper: [F.x, F.yb + 0.12, 0.3], nose: [F.x, G.hly + 0.1], intake: [F.x, F.yb + 0.05, 0.8, 0.12], roof: [wsTop - 0.08, at(wsTop - 0.08, 'wt') * 0.8], pod: [F.x, G.hly - 0.06, 0.66, 0.5], part: 'bumperF' },
      zadnje_luci: { x: R.x + 0.02, zc: T.z, yc: T.y, w: 0.42, h: 0.15, s: 0.5, shape: [[-0.21, -0.075], [0.21, -0.075], [0.21, 0.075], [-0.21, 0.075]] },
      auspuh: { x: R.x, y: R.yb + 0.01, z: 0.45, r: 0.035, len: 0.12, part: 'bumperR' },
      prtljaznik: { x: [R.x, R.x + 0.01], glass: grFoot, w: R.wt * 0.8, part: 'trunk' },
      vlecne_kljuke: { f: [F.x, F.yb + 0.1, 0.62], r: [R.x, R.yb + 0.1, 0.3] },
      lovilci_blata: { x: [fa - 0.45, -fb - (-R.x - fb < 0.7 ? 0.39 : 0.45)], z: [0.6, 0.72], y: [at(fa - 0.37, 'yb') + 0.06, 0.09], sill: [-fb + 0.6, fa - 0.6, at(0, 'yb'), at(0, 'w') - 0.11], part: 'body' },
      antena: { x: deck ? mid : roofR + 0.55, z: at(deck ? mid : roofR + 0.55, 'wt') * (deck ? 0.68 : 0.55), fin: [deck ? Math.min(roofR + 0.25, wsTop - 0.45) : roofR + 0.45, 0], front: [mid - 0.05, at(mid, 'wt') * (key === 'coupe' ? 0.5 : 0.7)], whip: wsTop - 0.05, part: 'body' },
      zaluzije: { x0: grFoot + 0.04, y0: at(grFoot + 0.04, 'yt') + 0.01, x1: roofR, y1: at(roofR, 'yt') + 0.01, w: Math.min(at(grFoot, 'wt'), at(roofR, 'wt')) * 0.85 },
      ogledala: { x: Mi.x, y: Mi.y, z: Mi.z, w: 0.12, h: 0.1, d: 0.14, z0: at(Mi.x, 'w') - 0.05, fwd: 0.04, up: 0.01 },
      zavore: { s: 1 },
      matice: { k: 4, r: 0.2 },
      barva: {}, zatemnitev: {}, luc_pod_avtom: {}, gume: {},
      crte: { z: [0.24, 0.38] },
      nalepke: { side: [[d1 + 0.1, fa - 0.45], [fa + 0.55, F.x - 0.2], [-fb + 0.45, d1 - 0.1]], y: [at(0, 'yb') + 0.2, at(0, 'ybelt') - 0.06], hood: { x: [wsBase + 0.1, F.x - 0.3], z: [0.26, 0.46] }, roof: { x: [roofR + 0.05, wsTop - 0.05] } },
      soncni_pas: { x: [wsTop, wsTop + 0.14] }, zamasek: { x: -fb + 0.42, y: at(-fb + 0.42, 'ybelt') - 0.08, z: at(-fb + 0.42, 'w'), r: 0.045 },
      celjusti: { r: [0.085, 0.16], a: [70, 125] },
      filter_zraka: { x: eng, y: 0.55, z: b.engRear ? -0.3 : -0.35 }, akumulator: b.engRear ? { x: -fb + 0.55, y: at(-fb + 0.65, 'yb') + 0.031, z: 0.12, back: true } : { x: eng + 0.275, y: S[0].yb + 0.05, z: 0.12, back: true }, turbo: { x: eng + (b.engRear ? -0.2 : 0.2), y: 0.45, z: 0.15 }, cip: { x: eng, y: S[0].yb + 0.05 + 0.274, z: 0.2 },
      vzmeti: key === 'hatch' ? { in: 0.15, top: 0.68, seat: [at(fa, 'yb'), at(-fb, 'yb')] } : { in: 0.15, top: 0.68 }, amortizerji: { in: 0.15, top: 0.68 }, stabilizatorji: { in: 0.13, floor: 0.29 }, dim_gum: {},
    };
    if (b.engRear) delete out.hauba;   // (the wedge's front lid: no engine under it, its low nose's top in the fenders' pieces)
    if (key === 'wedge') out.nalepke.hood.x[0] = 1.35;   // (the lid's flames on its flat front: the phone's +300)
    if (wsTop - roofR > 0.9) {   // (a roof long enough for the sunroof and the scoop: the sedan's, the hatch's; not the coupe's 0.6 m, the wedge's 0.8)
      out.streha = { x0: roofR + 0.05, x1: wsTop - 0.2, xf: wsTop - 0.23, xr: mid - 0.15, back: roofR + 0.05 };
      out.stresna_zajemalka = { x: wsTop - 0.05, z: 0, back: roofR + 0.05, wr: at(mid, 'wt') * 0.7 };
    }
    return out;
  }
  // ---- VIHAR V8 (MODELS 'muscle'): render.js muscleGeometry's pieces on BODIES.muscle's sections (the model's own size: no scaling)
  const MU = { len: 4.72, wid: 1.88, secs: [
    [-2.36, 0.86, 0.36, 0.80, 0.80, 0.90, 0.01, 'b'], [-2.26, 0.92, 0.31, 0.83, 0.86, 0.96, 0.02, 'b'], [-1.98, 0.93, 0.29, 0.84, 0.84, 0.92, 0.02, 'gr'],
    [-1.02, 0.93, 0.29, 0.85, 0.70, 1.24, 0.03, 'r'], [-0.12, 0.93, 0.29, 0.85, 0.68, 1.30, 0.03, 'gf'], [0.62, 0.93, 0.29, 0.85, 0.83, 0.93, 0.03, 'b'],
    [1.45, 0.94, 0.29, 0.84, 0.86, 0.91, 0.03, 'b'], [2.12, 0.92, 0.31, 0.81, 0.84, 0.87, 0.02, 'b'], [2.36, 0.88, 0.35, 0.76, 0.78, 0.80, 0.01, 'b']] };
  B.muscle = MU; AX.muscle = [1.3, 1.33];
  const CH = [0.82, 0.83, 0.86], BK = [0.06, 0.06, 0.07];
  function lookMuscle() {
    const S = MU.secs.map(row), F = S[S.length - 1], R = S[0];
    return {
      body: { len: MU.len, wid: MU.wid, secs: MU.secs, wz: 0.1, engRear: false },
      wheels: { style: 'std', spokes: 5, w: 0.28, rim: CH, tyre: [0.07, 0.07, 0.08] },
      build(K) {
        const P = K.paint, sk = K.shade(K.paint, 0.55);
        // the builder's loft: the skirts the paint at 55 %, the windscreen and the side windows glass, the rest paint
        const L = K.loft(K.body.secs, (k, e, kind) => e === 0 || e === 8 ? sk : (kind === 'gf' && e >= 3 && e <= 5) || ((kind === 'gf' || kind === 'r') && (e === 2 || e === 6)) ? K.GLASS : P,
          { caps: { front: { col: P }, rear: { col: P } } });
        const D = L.decal;
        D.band([[-0.52, 0], [-0.38, 0], [-0.38, 1], [-0.52, 1]], P, null, 0.014);   // (the B-pillar, the quarter window's back edge, the A-pillar)
        D.band([[-1.04, 0], [-0.9, 0], [-0.98, 0.72], [-1.04, 1]], P, null, 0.014);
        D.band([[0.46, 0], [0.64, 0], [0.64, 1], [0.34, 1]], P, null, 0.014);
        D.top([[-1.9, -0.5], [-1.9, 0.5], [-1.08, 0.56], [-1.08, -0.56]], K.GLASS, 0.008);   // (the fastback's rear window, its black louvres: the stock zaluzije)
        K.part('trunk', () => K.deli('zaluzije', () => { for (let i = 0; i < 6; i++) { const x = -1.84 + i * 0.13; D.top([[x, -0.5], [x, 0.5], [x + 0.055, 0.5], [x + 0.055, -0.5]], BK, 0.02); } }));
        K.deli('crte', () => { for (const sd of [-1, 1]) for (const [xa, xb] of [[0.66, 2.35], [-1.0, -0.16], [-2.34, -1.96]]) D.top([[xa, sd * 0.07], [xb, sd * 0.07], [xb, sd * 0.25], [xa, sd * 0.25]], K.strp, 0.012); });
        D.side([[-1.25, 0.43], [1.2, 0.43], [1.2, 0.5], [-1.25, 0.5]], BK);   // (the black rocker panel, the scoop ahead of the rear wheel, the badge on the front wing)
        D.side([[-1.18, 0.56], [-0.86, 0.56], [-0.86, 0.72], [-1.12, 0.72]], BK, null, 0.016);
        D.side([[1.62, 0.66], [1.86, 0.66], [1.86, 0.72], [1.62, 0.72]], CH, null, 0.016);
        K.deli('hauba', () => { const x = 1.28, y = L.topY(x, 0) - 0.01; K.box(x, y, 0, 0.62, 0.085, 0.44, 0, P); K.box(x + 0.315, y + 0.012, 0, 0.012, 0.06, 0.38, 0, BK); });
        const gx = F.x + 0.012, gy = 0.68;
        K.part('bumperF', () => K.deli('maska', () => K.box(gx - 0.03, gy - 0.1, 0, 0.06, 0.2, F.w * 1.7, 0, BK)));
        K.deli('zarometi', () => { for (const sd of [-1, 1]) { K.headLamp(gx + 0.012, gy, sd * 0.64, 0.077, { ring: CH, col: [1, 0.97, 0.84] }); K.headLamp(gx + 0.012, gy - 0.01, sd * 0.4, 0.05, { ring: CH, col: [1, 0.95, 0.8] }); } });
        K.part('bumperR', () => K.box(R.x - 0.005, 0.58, 0, 0.012, 0.25, R.w * 1.66, 0, BK));   // (the black panel round the lamps, the chrome cap in its middle)
        K.discX(R.x - 0.012, 0.7, 0, 0.06, 10, CH, -1);
        K.deli('zadnje_luci', () => { for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) K.tailLamp(R.x - 0.012, 0.705, sd * (0.22 + i * 0.19), 0.16, 0.12); });
        K.deli('auspuh', () => { for (const sd of [-1, 1]) for (const z of [0.5, 0.62]) K.tubeX(R.x + 0.25, R.x - 0.07, 0.31, sd * z, 0.042, 8, CH, [0.04, 0.04, 0.045]); });
        { const Mi = geo(MU).mirror; K.deli('ogledala', () => { for (const sd of [-1, 1]) K.part(sd < 0 ? 'mirrorL' : 'mirrorR', () => K.box(Mi.x, Mi.y - 0.05, sd * Mi.z, 0.14, 0.1, 0.12, 0, P)); }); }
        K.part('trunk', () => K.deli('krilo', () => {}));
        for (const id of ['aero', 'zmigavci', 'relijske_luci', 'prtljaznik', 'vlecne_kljuke', 'lovilci_blata', 'streha', 'stresna_zajemalka', 'antena', 'celjusti', 'dim_gum',
          'nalepke', 'soncni_pas', 'akumulator', 'filter_zraka', 'turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji']) K.deli(id, () => {});
        const ws = S.find(s => s.k === 'gf');
        K.seat(ws.x - 0.75, 0.5, -0.38); K.seat(ws.x - 0.75, 0.5, 0.38); K.engine(1.3 + 0.15, R.yb + 0.05, 0);
        return L;
      },
    };
  }
  function mountsMuscle() {   // (the generic ones, measured the same way; the builder's own lamps, grille, tail and pipes)
    const m = mounts('muscle'), S = MU.secs.map(row), F = S[S.length - 1], R = S[0], at = (x, k) => ip(S, x, k), gx = F.x + 0.012;
    m.krilo = { part: 'trunk' };
    m.zarometi = { x: gx + 0.012, y0: 0.68, lean: 0, zc: 0.64, yc: 0.68, s: 0.62, depth: 0.03, hosts: ['body', 'body'] };
    m.maska = { x: F.x, y0: 0.68, lean: 0, yc: 0.68, w: F.w * 1.5 / 2, h: 0.1 };
    m.zadnje_luci = { x: R.x + 0.01, zc: 0.41, yc: 0.705, w: 0.54, h: 0.12, s: 0.5, shape: [[-0.27, -0.06], [0.27, -0.06], [0.27, 0.06], [-0.27, 0.06]] };
    m.auspuh = { x: R.x - 0.07, y: R.yb + 0.01, z: 0.56, r: 0.042, len: 0.12, part: 'bumperR' };
    m.krilo.x = R.x + 0.14; m.krilo.w = at(R.x + 0.14, 'wt') * 0.9; m.krilo.front = -1.9;   // (the ducktail's lip: clear of the louvres)
    m.relijske_luci.bumper[0] = F.x - 0.01; m.relijske_luci.part = 'bumperF';
    m.turbo.ic = [F.x - 0.06, 0.45, 0];   // (the big intercooler behind the grille)
    m.hauba.w = Math.min(at(0.62, 'wt'), F.wt) * 0.34; m.hauba.x1 = 1.9;
    m.zaluzije.x0 = -1.86; m.zaluzije.y0 = at(-1.86, 'yt') + 0.01;   // (where the stock louvres begin)
    m.vzmeti = { in: 0.15, top: 0.68, seat: [at(1.3, 'yb'), at(-1.33, 'yb')] };
    delete m.zamasek; delete m.prtljaznik;   // (no boot rack on the fastback's short ducktail)   // (the stock cap is in the tail's middle; the element's caps go on the side)
    m.nalepke.side[0] = [-0.1, 0.6]; m.nalepke.hood.x = [1.0, 2.06];   // (the door's flames in one section, the bonnet's on its flat front: the phone's +300)
    return m;
  }
  // ---- BURJA R7 (MODELS 'rally'): render.js rallyGeometry's pieces on BODIES.rally's sections (look units: BODIES.rally's 3.8 m, the
  // builder's own x before its scaling to the model's 3.95: K.sx stretches them the same way; the wheels the kit's, at the model's a / b)
  const RA = { len: 3.8, wid: 1.80, spoiler: false, engRear: false, secs: [
    [-1.90, 0.84, 0.36, 0.74, 0.76, 0.96, 0.01, 'b'], [-1.84, 0.88, 0.32, 0.80, 0.78, 1.00, 0.02, 'gr'], [-1.60, 0.91, 0.30, 0.82, 0.70, 1.30, 0.02, 'gr'],
    [-1.45, 0.91, 0.30, 0.82, 0.75, 1.37, 0.03, 'r'], [-0.80, 0.90, 0.30, 0.82, 0.75, 1.39, 0.03, 'r'], [-0.10, 0.89, 0.30, 0.82, 0.75, 1.39, 0.03, 'r'],
    [0.35, 0.89, 0.30, 0.82, 0.75, 1.37, 0.03, 'gf'], [0.72, 0.90, 0.30, 0.80, 0.78, 0.93, 0.03, 'b'], [1.10, 0.92, 0.30, 0.79, 0.80, 0.90, 0.03, 'b'],
    [1.55, 0.92, 0.30, 0.75, 0.80, 0.84, 0.02, 'b'], [1.90, 0.86, 0.32, 0.66, 0.76, 0.74, 0.01, 'b']] };
  const RSX = 3.95 / 3.8;   // (the model's length over the body's: metres -> look units)
  B.rally = RA; AX.rally = [1.15 / RSX, 1.25 / RSX];
  const WH = [0.95, 0.95, 0.96], RK = [0.07, 0.07, 0.08];
  function lookRally() {
    const S = RA.secs.map(row), F = S[S.length - 1], R = S[0];
    return {
      body: { len: RA.len, wid: RA.wid, secs: RA.secs, wz: 0.1, engRear: false },
      wheels: { style: 'std', spokes: 5, w: 0.26, rim: [0.93, 0.93, 0.9], tyre: RK },
      build(K) {
        const Lv = K.paint;   // (the livery: the car's colour; the builder's turns a very light one blue, the kit's paint is recoloured per car)
        const sk = WH.map(v => v * 0.85);
        // the builder's loft: white paint, the glass, the rear glass' black louvred cover (its crown black, its edges dark grey)
        const L = K.loft(K.body.secs, (k, e, kind) => { const top = e >= 3 && e <= 5, up = e === 2 || e === 6;
          if (kind === 'gf' && (top || up)) return K.GLASS; if (kind === 'r' && up) return K.GLASS;
          if (kind === 'gr') return top ? (e === 4 ? RK : [0.13, 0.13, 0.15]) : up ? K.GLASS : e === 0 || e === 8 ? sk : WH;
          return e === 0 || e === 8 ? sk : WH; }, { caps: { front: { col: WH }, rear: { col: WH } } });
        const D = L.decal;
        // the livery: two slashes rising to the rear, the sill band, the rear quarter, the black intake; the white pillars on the glass
        D.side([[1.30, 0.47], [1.62, 0.47], [0.98, 0.79], [0.66, 0.79]], Lv); D.side([[0.10, 0.47], [0.58, 0.47], [-0.30, 0.79], [-0.78, 0.79]], Lv);
        D.side([[-1.45, 0.47], [1.45, 0.47], [1.45, 0.54], [-1.45, 0.54]], Lv); D.side([[-1.90, 0.52], [-1.52, 0.52], [-1.40, 0.79], [-1.90, 0.79]], Lv);
        D.side([[-1.34, 0.52], [-1.08, 0.52], [-1.08, 0.74], [-1.34, 0.74]], RK);
        D.band([[-0.20, 0], [-0.07, 0], [-0.07, 1], [-0.20, 1]], WH, null, 0.014); D.band([[-1.45, 0], [-1.12, 0], [-1.12, 1], [-1.45, 1]], WH, null, 0.014);
        D.top([[1.86, 0.50], [1.86, 0.74], [0.76, 0.40], [0.76, 0.18]], Lv, 0.014); D.top([[1.86, -0.50], [1.86, -0.74], [0.76, -0.40], [0.76, -0.18]], Lv, 0.014);
        D.top([[1.28, -0.24], [1.28, 0.24], [1.02, 0.24], [1.02, -0.24]], RK, 0.014);
        D.top([[-1.44, -0.62], [-1.44, 0.62], [-0.98, 0.62], [-0.98, -0.62]], Lv, 0.014);
        D.top([[0.30, 0.44], [0.30, 0.62], [-0.30, 0.62], [-0.05, 0.44]], Lv, 0.014); D.top([[0.30, -0.44], [0.30, -0.62], [-0.30, -0.62], [-0.05, -0.44]], Lv, 0.014);
        // the builder's pieces: the lamps and the amber ones by them, the grille, the lip, the tail's black panel, the two little pipes
        K.deli('zarometi', () => { for (const sd of [-1, 1]) { K.headLamp(F.x + 0.02, 0.575, sd * 0.5, 0.07, { shape: 'rect', w: 0.32, h: 0.15, ring: null, col: [1, 0.97, 0.84] });
          K.box(F.x - 0.02, 0.5, sd * 0.74, 0.08, 0.13, 0.12, 0, [1, 0.55, 0.12]); } });
        K.part('bumperF', () => { K.deli('maska', () => K.box(F.x - 0.02, 0.5, 0, 0.07, 0.12, 0.6, 0, RK)); K.box(F.x - 0.03, 0.37, 0, 0.07, 0.1, 1.0, 0, RK); });
        K.part('bumperR', () => { K.box(R.x + 0.02, 0.62, 0, 0.08, 0.2, 0.95, 0, RK);
          K.deli('auspuh', () => { for (const sd of [-1, 1]) K.box(R.x - 0.02, 0.36, sd * 0.36, 0.1, 0.08, 0.12, 0, [0.2, 0.2, 0.22]); }); });
        K.deli('zadnje_luci', () => { for (const sd of [-1, 1]) K.tailLamp(R.x - 0.06, R.ybelt - 0.085, sd * R.w * 0.6, 0.42, 0.15); });
        // the big wing over the hatch on its endplates, the roof scoop, the antenna, the black mirrors, the mud flaps behind the wheels
        const wx = -1.62;
        K.part('trunk', () => K.deli('krilo', () => { for (const sd of [-1, 1]) K.box(wx + 0.12, 1.36, sd * 0.62, 0.14, 0.2, 0.05, 0, RK);
          K.box(wx, 1.56, 0, 0.5, 0.07, 1.84, 0, Lv, Lv); for (const sd of [-1, 1]) K.box(wx + 0.02, 1.48, sd * 0.93, 0.56, 0.24, 0.04, 0, Lv, Lv); }));
        K.deli('stresna_zajemalka', () => { K.box(-0.62, 1.40, 0, 0.4, 0.1, 0.42, 0, Lv, Lv); K.box(-0.44, 1.43, 0, 0.03, 0.06, 0.34, 0, RK); });
        K.deli('antena', () => K.box(0.05, 1.40, 0.3, 0.025, 0.55, 0.025, 0, RK));
        K.deli('ogledala', () => { for (const sd of [-1, 1]) K.part(sd < 0 ? 'mirrorL' : 'mirrorR', () => K.box(0.66, 0.86, sd * 0.97, 0.12, 0.1, 0.12, 0, RK)); });
        K.deli('lovilci_blata', () => { for (const sd of [-1, 1]) for (const x of [K.fx, K.rx]) K.box(x - 0.44 / RSX, 0.17, sd * 0.82, 0.03, 0.26, 0.2, 0, RK); });
        for (const id of ['aero', 'hauba', 'zmigavci', 'relijske_luci', 'prtljaznik', 'vlecne_kljuke', 'streha', 'crte', 'celjusti', 'dim_gum', 'nalepke', 'soncni_pas',
          'zamasek', 'akumulator', 'filter_zraka', 'turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji']) K.deli(id, () => {});
        K.part('trunk', () => K.deli('zaluzije', () => {}));
        const ws = S.find(s => s.k === 'gf');
        K.seat(ws.x - 0.75, 0.5, -0.36); K.seat(ws.x - 0.75, 0.5, 0.36); K.engine(AX.rally[0] + 0.15, R.yb + 0.05, 0);
        return L;
      },
    };
  }
  function mountsRally() {   // (the generic ones, measured the same way; the builder's own lamps, grille, tail, wing, scoop and flaps)
    const m = mounts('rally'), S = RA.secs.map(row), F = S[S.length - 1], R = S[0], at = (x, k) => ip(S, x, k);
    m.zarometi = { x: F.x + 0.02, y0: 0.575, lean: 0, zc: 0.5, yc: 0.575, s: 0.62, depth: 0.03, hosts: ['body', 'body'] };
    m.maska = { x: F.x, y0: 0.56, lean: 0, yc: 0.56, w: 0.27, h: 0.1 };
    m.ogledala = { x: 0.66, y: 0.91, z: 0.97, w: 0.12, h: 0.1, d: 0.12, z0: at(0.66, 'w') - 0.05, fwd: 0.04, up: 0.01 };
    m.zmigavci.mirror = { x: 0.66 + 0.07, y: 0.91, z: 0.97, w: 0.1, parts: ['mirrorL', 'mirrorR'] };
    m.auspuh = { x: R.x - 0.07, y: 0.40, z: 0.36, r: 0.035, len: 0.12, part: 'bumperR' };
    m.krilo = { x: -1.45, w: at(-1.45, 'wt') * 0.9, part: 'trunk' };
    m.relijske_luci.intake = [F.x, 0.42, 0.8, 0.1];   // (in the black lip under the grille: clear of the splitter)
    m.vzmeti = { in: 0.15, top: 0.68, seat: [at(AX.rally[0], 'yb'), at(-AX.rally[1], 'yb')] };
    m.nalepke.side[0] = [-0.08, 0.7]; m.nalepke.hood.x = [1.12, 1.75]; m.crte.z = [0.3, 0.44];   // (the flames and the stripes' bands over fewer sections: the phone's +300)
    return m;
  }
  // ---- SAMUM 4x4 (MODELS 'truck'): render.js truckGeometry's pieces on BODIES.truck's sections (the model's own size); its flares and
  // coil-overs at the kit's wheels (the model's a / b), the rest where the builder puts it
  const TR = { len: 5.2, wid: 2.15, spoiler: false, engRear: false, secs: [
    [-2.60, 0.98, 0.64, 1.10, 0.97, 1.20, 0.0, 'b'], [-2.54, 1.00, 0.62, 1.14, 0.99, 1.24, 0.0, 'b'], [-0.88, 1.00, 0.62, 1.14, 0.99, 1.24, 0.0, 'b'],
    [-0.80, 1.00, 0.62, 1.18, 0.86, 1.74, 0.02, 'r'], [0.34, 1.00, 0.62, 1.20, 0.84, 1.76, 0.03, 'gf'], [1.02, 1.01, 0.62, 1.20, 0.95, 1.30, 0.03, 'b'],
    [2.06, 1.01, 0.64, 1.16, 0.95, 1.20, 0.03, 'b'], [2.60, 0.95, 0.70, 1.04, 0.89, 1.08, 0.02, 'b']] };
  B.truck = TR; AX.truck = [1.6, 1.5];
  function lookTruck() {
    const S = TR.secs.map(row), F = S[S.length - 1], R = S[0], TK = [0.06, 0.06, 0.065], K2 = [0.13, 0.13, 0.14], LN = [0.17, 0.17, 0.18], hz = TR.wid / 2 - 0.16;
    return {
      body: { len: TR.len, wid: TR.wid, secs: TR.secs, wz: 0.16, engRear: false },
      wheels: { style: 'knob', w: 0.36, rimK: 0.56, rim: [0.74, 0.75, 0.78], gap: 0.07 },
      build(K) {
        const P = K.paint, St = K.strp;   // (the livery and the springs: the stripe's colour; the builder's paint at 70 % when the car has none)
        // the builder's loft: the black tucks, the bed liner, the windscreen and the side windows glass, the rest paint
        const L = K.loft(K.body.secs, (k, e, kind) => e === 0 || e === 8 ? TK : k <= 1 && e >= 3 && e <= 5 ? LN : (kind === 'gf' && e >= 3 && e <= 5) || ((kind === 'gf' || kind === 'r') && (e === 2 || e === 6)) ? K.GLASS : P,
          { caps: { front: { col: P }, rear: { col: P } } });
        const D = L.decal;
        D.band([[-0.8, 0], [-0.42, 0], [-0.5, 1], [-0.8, 1]], P, null, 0.014); D.band([[0.84, 0], [1.02, 0], [1.02, 1], [0.7, 1]], P, null, 0.014);
        { const xw = (y) => S[2].x + (y - S[2].yt) / (S[3].yt - S[2].yt) * (S[3].x - S[2].x) - 0.012;   // (the small rear window on the cab's sloping back wall)
          K.face([[xw(1.3), 1.3, -0.58], [xw(1.3), 1.3, 0.58], [xw(1.62), 1.62, 0.52], [xw(1.62), 1.62, -0.52]], K.GLASS); }
        D.side([[-2.5, 0.76], [-1.2, 0.76], [0.6, 1.1], [-0.3, 1.1], [-2.5, 0.96]], St); D.side([[0.9, 0.76], [2.55, 0.76], [2.55, 0.9], [1.3, 0.9]], St);
        for (const sd of [-1, 1]) D.top([[1.2, sd * 0.2], [1.56, sd * 0.2], [1.56, sd * 0.5], [1.2, sd * 0.5]], TK, 0.01);
        // the grille, the lamps in their dark housings, the skid plate; the tail lamps' black surrounds, the exhaust in front of the rear wheel
        K.part('bumperF', () => { K.deli('maska', () => K.box(F.x - 0.01, 0.84, 0, 0.04, 0.18, 1.0, 0, TK)); K.box(F.x - 0.18, 0.5, 0, 0.5, 0.05, 1.3, 0, K2); });
        K.deli('zarometi', () => { for (const sd of [-1, 1]) { K.box(F.x + 0.01, 0.87, sd * 0.62, 0.03, 0.13, 0.28, 0, K2);
          K.headLamp(F.x + 0.03, 0.935, sd * 0.62, 0.05, { shape: 'rect', w: 0.24, h: 0.1, ring: null, col: [1, 0.97, 0.84] }); } });
        K.part('bumperR', () => { for (const sd of [-1, 1]) K.box(R.x - 0.012, 0.92, sd * 0.85, 0.03, 0.23, 0.16, 0, TK); });
        K.deli('zadnje_luci', () => { for (const sd of [-1, 1]) K.tailLamp(R.x - 0.03, 1.035, sd * 0.85, 0.11, 0.17); });
        K.deli('auspuh', () => K.tubeX(K.rx + 0.95, K.rx + 0.62, 0.66, TR.wid / 2 - 0.1, 0.055, 8, [0.62, 0.62, 0.64], [0.04, 0.04, 0.045]));
        // the flares over the wheels, the coil-overs in the arches (the shock, its spring in the stripe's colour)
        for (const A of K.arches) for (const sd of [-1, 1]) K.flare(A.x, K.rw + 0.07, K.rw + 0.17, sd * 0.86, sd * (TR.wid / 2 + 0.04), TK, { n: 9 });
        K.deli('amortizerji', () => {}, () => { for (const A of K.arches) for (const sd of [-1, 1]) K.bar([A.x + 0.08, K.rw + 0.1, sd * (hz - 0.2)], [A.x - 0.1, 1.08, sd * 0.7], 0.035, [0.74, 0.74, 0.77], { n: 4 }); });   // (the truck's own coil-overs stay with the garage's, which go in the inner block)
        K.deli('vzmeti', () => {}, () => { for (const A of K.arches) for (const sd of [-1, 1]) K.bar([A.x + 0.05, K.rw + 0.3, sd * (hz - 0.23)], [A.x - 0.05, 0.86, sd * 0.74], 0.05, St, { n: 4 }); });
        // the spare in the bed, the cage from the roof down to the tail, the light bar on the roof, the snorkel
        K.tyre(-1.72, 1.41, 0, { axis: 'y', r: 0.44, w: 0.34 });
        const cg = [0.1, 0.1, 0.11], bars = [[[-2.2, 1.62, -0.84], [-2.2, 1.62, 0.84]], [[-1.35, 1.68, -0.8], [-1.35, 1.68, 0.8]]];
        for (const sd of [-1, 1]) bars.push([[-0.78, 1.72, sd * 0.78], [-2.2, 1.62, sd * 0.84]], [[-2.2, 1.62, sd * 0.84], [-2.52, 1.24, sd * 0.9]], [[-2.2, 1.62, sd * 0.84], [-1.45, 1.24, sd * 0.94]]);
        K.cage(bars, 0.03, cg, { inner: false });
        K.deli('relijske_luci', () => { K.box(0.26, 1.8, 0, 0.12, 0.11, 1.56, 0, TK); for (let i = 0; i < 6; i++) K.box(0.325, 1.815, (i - 2.5) * 0.25, 0.012, 0.08, 0.19, 0, [1, 0.96, 0.82]);
          for (const sd of [-1, 1]) K.bar([0.24, 1.75, sd * 0.6], [0.24, 1.8, sd * 0.6], 0.025, TK, { n: 4 }); });
        K.bar([1.0, 1.22, TR.wid / 2 - 0.1], [0.62, 1.8, TR.wid / 2 - 0.2], 0.05, TK, { n: 4 }); K.box(0.6, 1.76, TR.wid / 2 - 0.2, 0.14, 0.12, 0.12, 0, TK);
        // black door mirrors (the builder has none; the part table has them, every part needs some geometry): the generic place
        { const Mi = geo(TR).mirror; K.deli('ogledala', () => { for (const sd of [-1, 1]) K.part(sd < 0 ? 'mirrorL' : 'mirrorR', () => K.box(Mi.x, Mi.y - 0.05, sd * Mi.z, 0.14, 0.1, 0.12, 0, TK)); }); }
        K.part('trunk', () => K.deli('krilo', () => {}));
        for (const id of ['aero', 'hauba', 'zmigavci', 'prtljaznik', 'vlecne_kljuke', 'lovilci_blata', 'streha', 'stresna_zajemalka', 'antena', 'crte', 'celjusti',
          'dim_gum', 'nalepke', 'soncni_pas', 'zamasek', 'akumulator', 'filter_zraka', 'turbo', 'cip', 'stabilizatorji']) K.deli(id, () => {});
        K.part('trunk', () => K.deli('zaluzije', () => {}));
        const ws = S.find(s => s.k === 'gf');
        K.seat(ws.x - 0.75, 0.9, -0.4); K.seat(ws.x - 0.75, 0.9, 0.4); K.engine(AX.truck[0] + 0.15, 0.7, 0);
        K.inner(() => K.box(1.0, 0.66, 0, 0.03, 0.6, 1.8, 0, [0.1, 0.1, 0.11]));   // (the bulkhead behind the engine: the bay closed from the long cab and bed)
        return L;
      },
    };
  }
  function mountsTruck() {   // (the generic ones, measured the same way; the builder's own lamps, grille, tail, bar and coil-overs)
    const m = mounts('truck'), S = TR.secs.map(row), F = S[S.length - 1], R = S[0], at = (x, k) => ip(S, x, k);
    m.zarometi = { x: F.x + 0.03, y0: 0.935, lean: 0, zc: 0.62, yc: 0.935, s: 0.62, depth: 0.03, hosts: ['body', 'body'] };
    m.maska = { x: F.x, y0: 0.93, lean: 0, yc: 0.93, w: 0.4, h: 0.1 };
    m.zadnje_luci = { x: R.x - 0.012, zc: 0.85, yc: 1.035, w: 0.11, h: 0.17, s: 0.5, shape: [[-0.055, -0.085], [0.055, -0.085], [0.055, 0.085], [-0.055, 0.085]] };
    m.zarometi.x = F.x;   // (the options' lamps on the nose's face: the stock housings go with the stock lamps)
    m.zadnje_luci.x = R.x; m.auspuh.x = R.x - 0.03; m.auspuh.y = R.yb + 0.04;   // (on the tail's face; the silencer under the floor touching it)
    m.crte.dy = 0.25;   // (the side bands on the tall flat side)
    m.filter_zraka = { x: 1.65, y: 0.95, z: -0.2 }; m.turbo.y = 0.95;   // (on the engine's block; the turbo over the front arches' tops)
    // (the bed: the spare lying in it; no wing on the rally-raid truck: the cage over the bed; no splitter, sills nor diffuser under the
    // high body (as GOLJAT); the bonnet's top hardly over the belt: its fenders' part reaches over it, so the stock vents stay)
    delete m.prtljaznik; delete m.krilo; delete m.aero; delete m.hauba;
    m.vzmeti = { in: 0.25, top: 1.0, seat: 0.62 }; m.amortizerji = { in: 0.25, top: 1.0 }; m.stabilizatorji = { in: 0.13, floor: 0.62 };   // (inboard of the wide tyres, from the high floor to the tubs' tops)
    m.nalepke.side[0] = [0.38, 1.0]; m.nalepke.hood.x = [1.45, 2.04];   // (the door's flames in one section, the bonnet's on its flat front: the phone's +300)
    return m;
  }
  // ---- STRELA EV (MODELS 'ev'): render.js evGeometry's pieces on BODIES.ev's sections (the model's own size). Its top is a glass canopy
  // from the rear deck to the bonnet (black rails along its edges): what goes on the roof stands on the rails or on the painted deck
  const EV = { len: 4.62, wid: 2.0, spoiler: false, engRear: false, secs: [
    [-2.31, 0.90, 0.30, 0.64, 0.86, 0.78, 0.01, 'b'], [-2.20, 0.98, 0.26, 0.70, 0.93, 0.86, 0.02, 'b'], [-1.72, 1.00, 0.25, 0.72, 0.86, 0.84, 0.03, 'b'],
    [-1.28, 1.00, 0.25, 0.73, 0.64, 0.97, 0.03, 'gr'], [-0.30, 0.97, 0.25, 0.72, 0.58, 1.15, 0.03, 'r'], [0.34, 0.96, 0.25, 0.71, 0.58, 1.13, 0.03, 'gf'],
    [1.10, 0.97, 0.25, 0.71, 0.88, 0.77, 0.03, 'b'], [1.78, 0.97, 0.26, 0.67, 0.88, 0.715, 0.03, 'b'], [2.31, 0.88, 0.28, 0.50, 0.80, 0.55, 0.01, 'b']] };
  B.ev = EV; AX.ev = [1.42, 1.38];
  const CYAN = [0.12, 0.78, 0.95];
  function lookEv() {
    const S = EV.secs.map(row), F = S[S.length - 1], R = S[0], EK = [0.05, 0.05, 0.06], CF = [0.1, 0.1, 0.11], W = [0.95, 0.97, 1.0];
    return {
      body: { len: EV.len, wid: EV.wid, secs: EV.secs, wz: 0.13, engRear: false, decalX: 1.42, decalY: 0.772, decalRz: -0.08, decalS: 0.72 },   // (the number on the bonnet, as BODIES.ev's)
      wheels: { style: 'std', spokes: 5, w: 0.3, rim: [0.15, 0.16, 0.18], tyre: [0.07, 0.07, 0.08] },
      build(K) {
        const P = K.paint;
        // the builder's loft: carbon tucks, the canopy's glass (the window bands and the top of every segment but the body's), the rest paint
        // (the side glass over the rear arch black: the builder's blade behind the side glass there, the arch's flares clear of the glass)
        const L = K.loft(K.body.secs, (k, e, kind, at) => e === 0 || e === 8 ? CF : kind !== 'b' && e >= 2 && e <= 6 ? ((e === 2 || e === 6) && at && at.x < -0.95 ? EK : K.GLASS) : P,
          { caps: { front: { col: P }, rear: { col: P } } });
        const D = L.decal, cx = S.filter(q => q.x >= -1.28 && q.x <= 1.1).map(q => q.x);
        for (const sd of [-1, 1]) { const edge = cx.map(x => [x, sd * L.prop(x, 'wt')]), inner = cx.map(x => [x, sd * (L.prop(x, 'wt') - 0.07)]).reverse(); D.top(edge.concat(inner), EK, 0.006); }
        D.band([[0.92, 0], [1.1, 0], [1.1, 1], [0.8, 1]], P, null, 0.012); D.band([[-1.28, 0], [-1.02, 0], [-1.16, 1], [-1.28, 1]], EK, null, 0.012);
        D.side([[-1.6, 0.39], [1.72, 0.39], [1.72, 0.45], [-1.6, 0.45]], CF); D.side([[-1.6, 0.45], [1.72, 0.45], [1.72, 0.47], [-1.6, 0.47]], CYAN, null, 0.014);
        D.side([[-1.3, 0.5], [-0.98, 0.5], [-1.04, 0.66], [-1.3, 0.68]], EK, null, 0.014);
        for (const sd of [-1, 1]) D.top([[1.9, sd * 0.16], [2.14, sd * 0.2], [2.14, sd * 0.46], [1.9, sd * 0.44]], EK, 0.01);
        D.top([[-2.23, -0.88], [-2.16, -0.88], [-2.16, 0.88], [-2.23, 0.88]], EK, 0.012);
        // the nose: the light bar right across, the lamp clusters at the corners (the lenses), the black intake, the splitter
        K.deli('zarometi', () => { K.box(F.x - 0.02, 0.492, 0, 0.05, 0.026, F.w * 1.72, 0, W);
          for (const sd of [-1, 1]) { K.box(F.x + 0.004, 0.43, sd * 0.62, 0.03, 0.058, 0.3, 0, EK); K.headLamp(F.x + 0.022, 0.465, sd * 0.62, 0.015, { shape: 'rect', w: 0.26, h: 0.03, ring: null, col: W }); } });
        K.part('bumperF', () => { K.deli('maska', () => K.box(F.x - 0.02, 0.29, 0, 0.05, 0.12, 1.24, 0, EK)); K.box(F.x - 0.1, 0.21, 0, 0.24, 0.03, F.w * 2.0, 0, CF); });
        // the tail: black under the light bar, the bar (two halves), the diffuser with its fins
        // (its black panel down to 0.48 m, the builder's from 0.62: the options' lamps on it, under the deck's part)
        K.part('bumperR', () => { K.box(R.x - 0.01, 0.48, 0, 0.03, 0.28, R.w * 1.84, 0, EK); K.box(R.x + 0.14, 0.19, 0, 0.34, 0.1, 1.5, 0, CF);
          for (let i = -2; i <= 2; i++) K.box(R.x + 0.12, 0.13, i * 0.3, 0.3, 0.2, 0.025, 0, EK); });
        K.deli('zadnje_luci', () => { for (const sd of [-1, 1]) K.tailLamp(R.x - 0.03, 0.712, sd * 0.415, 0.83, 0.034); });
        { const Mi = geo(EV).mirror; K.deli('ogledala', () => { for (const sd of [-1, 1]) K.part(sd < 0 ? 'mirrorL' : 'mirrorR', () => K.box(Mi.x, Mi.y - 0.05, sd * Mi.z, 0.14, 0.1, 0.12, 0, P)); }); }
        K.part('trunk', () => K.deli('krilo', () => {}));
        for (const id of ['aero', 'hauba', 'zmigavci', 'relijske_luci', 'auspuh', 'prtljaznik', 'vlecne_kljuke', 'lovilci_blata', 'streha', 'stresna_zajemalka', 'antena',
          'crte', 'celjusti', 'dim_gum', 'nalepke', 'soncni_pas', 'zamasek', 'akumulator', 'filter_zraka', 'turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji']) K.deli(id, () => {});
        K.part('trunk', () => K.deli('zaluzije', () => {}));
        const ws = S.find(s => s.k === 'gf');
        K.seat(ws.x - 0.75, 0.45, -0.38); K.seat(ws.x - 0.75, 0.45, 0.38); K.engine(AX.ev[0] + 0.15, R.yb + 0.05, 0, { h: 0.3 });
        K.inner(() => K.box(1.08, 0.3, 0, 0.03, 0.42, 1.7, 0, CF));   // (the bulkhead at the windscreen's foot: the front bay closed from the long cabin)
        return L;
      },
    };
  }
  function mountsEv() {   // (the generic ones, measured the same way; the builder's own lamps, grille and tail; the roof's parts on the rails)
    const m = mounts('ev'), S = EV.secs.map(row), F = S[S.length - 1], R = S[0], at = (x, k) => ip(S, x, k), rail = (x) => at(x, 'wt') - 0.035;
    m.zarometi = { x: F.x + 0.02, y0: 0.465, lean: 0, zc: 0.62, yc: 0.465, s: 0.62, depth: 0.03, hosts: ['body', 'body'] };
    m.maska = { x: F.x, y0: 0.35, lean: 0, yc: 0.35, w: 0.5, h: 0.08 };
    m.zadnje_luci = { x: R.x - 0.01, zc: 0.6, yc: 0.6, w: 0.4, h: 0.06, s: 0.5, shape: [[-0.2, -0.03], [0.2, -0.03], [0.2, 0.03], [-0.2, 0.03]] };   // (on the black panel, under the bar: the deck's part over it)
    m.krilo = { x: -2.0, w: at(-2.0, 'wt') * 0.9, part: 'trunk' };   // (on the painted deck behind the canopy)
    m.vzmeti = { in: 0.15, top: 0.78, seat: [at(AX.ev[0], 'yb'), at(-AX.ev[1], 'yb')] }; m.amortizerji = { in: 0.15, top: 0.78 };   // (up into the arches' tubs)
    m.relijske_luci.feet = 0.4; m.relijske_luci.bumper[0] = F.x - 0.05; m.relijske_luci.nose[0] = F.x - 0.04; m.vlecne_kljuke.f = [F.x, 0.33, 0.78]; m.filter_zraka = { x: 1.45, y: 0.5, z: -0.35 };   // (the bumper's lamps inside the head lamps; the filter on the low block, under the falling bonnet)
    m.relijske_luci.roof = [1.22, at(1.22, 'wt') * 0.8];   // (the roof's bar on the cowl in front of the windscreen: off the glass)
    // (no bonnet parts: its top hardly over the belt, the fenders' part reaches over it, as SAMUM's)
    // (no aerial: the canopy's glass, the bonnet the hood's part, the deck the wing's; no exhaust on the electric car)
    delete m.hauba; delete m.antena; delete m.auspuh; delete m.streha; delete m.stresna_zajemalka; delete m.zaluzije; delete m.soncni_pas; delete m.prtljaznik;   // (the canopy: no sunroof, scoop, louvres or sun strip on glass; no boot)
    m.nalepke.hood.x = [1.4, 2.01];   // (the bonnet's flames on its flat front: the phone's +300)
    return m;
  }
  // ---- FORMULA ORKAN (MODELS 'formula'): render.js formulaGeometry's pieces on its own tub (look units = metres): a closed loft (the
  // cockpit's opening black on its top), pods, floor, diffuser, gearbox, halo, helmet in 'body'; the nose 'hood', the wings 'bumperF' /
  // 'bumperR', the engine cover 'trunk', the bargeboards 'fenderL' / 'fenderR', the mirrors on the pods; one track for both axles (hw 0.78:
  // the stock rear's, the front 5 cm in; docs/deli.md)
  const FSECS = [[-0.86, 0.27, 0.09, 0.52, 0.12, 0.85, 0.06, 'b', 0.2], [-0.62, 0.30, 0.09, 0.50, 0.14, 0.87, 0.06, 'r', 0.2],
    [-0.44, 0.36, 0.09, 0.42, 0.27, 0.60, 0.06, 'r', 0.2], [-0.10, 0.36, 0.09, 0.40, 0.30, 0.56, 0.06, 'r', 0.2],
    [0.42, 0.33, 0.09, 0.38, 0.27, 0.57, 0.06, 'gf', 0.2], [0.80, 0.29, 0.10, 0.38, 0.23, 0.54, 0.06, 'b', 0.2],
    [1.20, 0.25, 0.15, 0.38, 0.21, 0.515, 0.06, 'b', 0.15], [1.72, 0.21, 0.20, 0.37, 0.17, 0.49, 0.06, 'b', 0.12]];
  // (a ring of ten round x: bottom (yb, wb), the side (ym, wm), the top (yt, wt), its crown tf of wt; for K.skin)
  const fRing = (x, yb, wb, ym, wm, yt, wt, tf) => { const f = tf == null ? 0.5 : tf, r = Math.min(0.06, (yt - ym) * 0.4);
    return [[x, yb, -wb * 0.86], [x, yb + 0.025, -wb], [x, ym, -wm], [x, yt - r, -wt], [x, yt, -wt * f], [x, yt, wt * f], [x, yt - r, wt], [x, ym, wm], [x, yb + 0.025, wb], [x, yb, wb * 0.86]]; };
  const ngon = (n, f) => { const o = []; for (let i = 0; i < n; i++) o.push(f(i / n * Math.PI * 2)); return o; };
  const FK2 = [0.15, 0.15, 0.17];   // (the carbon's grey: FK and DARK are too near the glass's colours)
  function lookFormula() {
    return {
      body: { len: 5.2, wid: 1.96, wz: 0.2, secs: FSECS, roofY: 0.576, engRear: true, engine: [-1.05, 0.62], crush: { x0: 0, x1: 0, z: 0 },
        eye: { x: -0.12, y: 0.76, near: 0.12, tilt: 0.06, style: 'formula' }, decalX: 1.0, decalY: 0.576, decalRz: -0.075, decalS: 0.36 },
      wheels: { style: 'slick', w: 0.3, wR: 0.4, arch: false, rim: [0.12, 0.12, 0.13], tyre: [0.07, 0.07, 0.08] },
      regions: 'none',
      build(K) {
        const P = K.paint, S = K.strp, KB = K.black, KD = K.dark;
        const L = K.loft(K.body.secs, (k, e, kind) => kind === 'r' && e >= 3 && e <= 5 ? KB : e === 0 || e === 8 ? FK2 : P,
          { caps: { front: { col: FK2, low: 'body', high: 'body', cut: 0 }, rear: { col: FK2, low: 'body', high: 'body', cut: 0 } }, arches: false, tubs: false });
        K.part('body', () => {
          const POD = [[0.62, 0.64, 0.5], [0.4, 0.71, 0.53], [-0.2, 0.71, 0.5], [-0.75, 0.62, 0.41], [-1.32, 0.44, 0.24]];   // the pods (x, the outer z, the top)
          for (const sd of [-1, 1]) K.skin(POD.map(([x, zo, yt]) => [[x, 0.1, sd * 0.25], [x, 0.1, sd * (zo - 0.05)], [x, 0.16, sd * zo], [x, yt - 0.08, sd * zo], [x, yt, sd * (zo - 0.12)], [x, yt, sd * 0.25]]),
            (k, e) => e === 0 ? KB : e === 1 ? FK2 : e === 3 ? S : P, KB, KB);
          const FL = [[1.1, 0.3], [0.7, 0.6], [0.3, 0.74], [-1.15, 0.74], [-1.48, 0.64], [-1.75, 0.54]];   // the floor (convex)
          K.plate(FL.map(([x, z]) => [x, 0.065, z]).concat(FL.slice().reverse().map(([x, z]) => [x, 0.065, -z])), 0.04, KB);
          K.plate([[-1.75, 0.065, -0.54], [-1.75, 0.065, 0.54], [-2.36, 0.32, 0.5], [-2.36, 0.32, -0.5]], 0.02, KB);   // the diffuser's ramp
          for (const z of [-0.5, -0.24, 0.24, 0.5]) K.endplate([[-1.75, 0.05], [-2.36, 0.34], [-2.36, 0.06], [-1.75, 0.045]], z, 0.012, FK2);
          K.skin([fRing(-2.05, 0.2, 0.14, 0.4, 0.13, 0.52, 0.08), fRing(-2.28, 0.25, 0.09, 0.36, 0.09, 0.46, 0.06), fRing(-2.44, 0.28, 0.05, 0.34, 0.055, 0.4, 0.04)],
            (k, e) => e >= 3 && e <= 5 ? P : KB, FK2, KB);   // the gearbox
          K.box(-2.31, 0.44, 0, 0.2, 0.035, 0.92, 0, KB); K.box(-2.3, 0.44, 0, 0.14, 0.45, 0.03, 0, KB);   // the beam wing, the pylon (up to the main plane)
          K.box(-2.22, 0.5, 0, 0.18, 0.06, 0.07, 0, [0.52, 0.5, 0.47]); K.box(-0.7, 0.925, 0, 0.13, 0.05, 0.11, 0, [0.96, 0.78, 0.08]);   // the exhaust, the camera
          const fx = 1.8, rx = -1.7, sus = (a, b) => K.bar(a, b, 0.014, KB, { n: 3 });   // the wishbones, push rods, track rods, drive shafts
          for (const sd of [-1, 1]) {
            const hf = sd * 0.61, hr = sd * 0.56;
            sus([fx + 0.24, 0.47, sd * 0.19], [fx, 0.5, hf]); sus([fx - 0.26, 0.47, sd * 0.21], [fx, 0.5, hf]); sus([fx + 0.28, 0.2, sd * 0.15], [fx, 0.2, hf]); sus([fx - 0.3, 0.2, sd * 0.2], [fx, 0.2, hf]);
            sus([fx - 0.02, 0.22, hf - sd * 0.03], [fx - 0.08, 0.5, sd * 0.2]); sus([fx + 0.12, 0.32, sd * 0.17], [fx + 0.1, 0.33, hf]);
            sus([rx + 0.28, 0.48, sd * 0.2], [rx, 0.52, hr]); sus([rx - 0.22, 0.48, sd * 0.14], [rx, 0.52, hr]); sus([rx + 0.32, 0.18, sd * 0.24], [rx, 0.17, hr]); sus([rx - 0.26, 0.18, sd * 0.2], [rx, 0.17, hr]);
            K.bar([rx, 0.36, sd * 0.14], [rx, 0.36, hr], 0.025, [0.3, 0.3, 0.32], { n: 4 });
          }
          const H = [[-0.44, 0.62, -0.26], [-0.28, 0.79, -0.285], [-0.02, 0.855, -0.25], [0.18, 0.875, -0.15], [0.28, 0.88, 0]];   // the halo (its feet on the tub's top edge)
          K.sweep([[-0.025, -0.025], [0.025, -0.025], [0.025, 0.025], [-0.025, 0.025]], H.concat(H.slice(0, 4).reverse().map(p => [p[0], p[1], -p[2]])), KB, { capA: KB, capB: KB });
          K.bar([0.28, 0.88, 0], [0.46, 0.625, 0], 0.02, KB, { n: 4 });   // its strut down to the tub
        }, { noCrush: true });
        K.tailLamp(-2.445, 0.34, 0, 0.085, 0.07);   // the rain light on the gearbox's tip
        K.part('body', () => {   // the driver's helmet, its visor
          const HX = -0.16, HY = 0.755, ring = (dy, r) => ngon(10, a => [HX + Math.cos(a) * r, HY + dy, Math.sin(a) * r]);
          K.skin([ring(-0.14, 0.06), ring(-0.06, 0.125), ring(0, 0.135), ring(0.06, 0.12), ring(0.11, 0.07)],
            (k, e) => (k === 1 || k === 2) && (e === 8 || e === 9 || e === 0 || e === 1) ? [0.26, 0.17, 0.06] : [0.95, 0.95, 0.93], KD, P);
        }, { noCrush: true, noDent: true, sub: 'driver' });
        K.part('hood', () => {   // the nose
          K.skin([fRing(1.72, 0.2, 0.172, 0.37, 0.212, 0.552, 0.172), fRing(2.1, 0.205, 0.11, 0.31, 0.14, 0.43, 0.11), fRing(2.4, 0.19, 0.08, 0.27, 0.1, 0.36, 0.075), fRing(2.62, 0.18, 0.05, 0.235, 0.06, 0.29, 0.045)],
            (k, e) => e === 9 ? KB : k === 2 ? S : P, FK2, S);
          K.inner(() => K.box(1.75, 0.218, 0, 0.06, 0.3, 0.34, 0, KD));
        });
        K.part('bumperF', () => {   // the front wing: the main plane, two flaps, the end plates, the pylons up to the nose
          K.wingPlank(2.70, 0.08, 2.30, 0.12, 0.022, -0.9, 0.9, KB);
          for (const sd of [-1, 1]) {
            K.wingPlank(2.42, 0.15, 2.23, 0.215, 0.018, sd * 0.22, sd * 0.9, P); K.wingPlank(2.29, 0.225, 2.15, 0.29, 0.016, sd * 0.3, sd * 0.9, S);
            K.endplate([[2.71, 0.07], [2.13, 0.07], [2.13, 0.33], [2.39, 0.30], [2.64, 0.18]], sd * 0.915, 0.02, P);
            K.endplate([[2.55, 0.1], [2.35, 0.12], [2.35, 0.2], [2.55, 0.185]], sd * 0.05, 0.012, KB);
          }
        });
        K.part('bumperR', () => {   // the rear wing: two planes, the end plates
          K.wingPlank(-2.22, 0.865, -2.48, 0.93, 0.032, -0.49, 0.49, P); K.wingPlank(-2.43, 0.975, -2.595, 1.075, 0.018, -0.485, 0.485, S);
          for (const sd of [-1, 1]) K.endplate([[-2.18, 0.8], [-2.26, 0.48], [-2.62, 0.48], [-2.62, 1.06], [-2.22, 1.0]], sd * 0.5, 0.022, P);
        });
        K.part('trunk', () => {   // the engine cover, its fin; the engine, its gearbox and exhaust under it
          K.skin([fRing(-0.86, 0.088, 0.322, 0.52, 0.272, 0.912, 0.122), fRing(-1.3, 0.1, 0.28, 0.5, 0.22, 0.78, 0.1), fRing(-1.75, 0.12, 0.2, 0.45, 0.16, 0.63, 0.08), fRing(-2.05, 0.2, 0.142, 0.4, 0.132, 0.522, 0.082)],
            (k, e) => e === 9 ? KB : P, FK2, FK2);
          K.endplate([[-0.9, 0.9], [-1.95, 0.58], [-1.95, 0.7], [-1.02, 0.99]], 0, 0.016, S);
          K.inner(() => {
            K.box(-1.45, 0.3, 0, 0.9, 0.3, 0.36, 0, [0.4, 0.41, 0.43]); K.box(-1.25, 0.6, 0, 0.36, 0.12, 0.2, 0, [0.16, 0.16, 0.18]);
            K.box(-1.87, 0.36, 0, 0.3, 0.14, 0.18, 0, [0.62, 0.5, 0.36]); K.bar([-1.6, 0.45, 0], [-2.12, 0.5, 0], 0.025, [0.62, 0.6, 0.56], { n: 6 });
          });
        });
        for (const sd of [-1, 1]) K.part(sd < 0 ? 'fenderL' : 'fenderR', () => K.box(0.84, 0.19, sd * 0.63, 0.46, 0.22, 0.02, 0, P));   // the bargeboards (1 cm into the pods)
        K.deli('ogledala', () => { for (const sd of [-1, 1]) K.mirror(0.34, 0.562, sd * 0.5, { w: 0.07, h: 0.065, d: 0.15, col: P, z0: sd * 0.285 }); });
        for (const id of ['crte', 'nalepke', 'celjusti', 'akumulator', 'turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum']) K.deli(id, () => {});
        return L;
      },
    };
  }
  function mountsFormula() {   // (the open car's own: no glass, lamps, bonnet, roof or doors; the wings are the car's, the aero kit none)
    return { platisca: {}, barva: {}, luc_pod_avtom: {}, gume: {}, zavore: { s: 1 }, matice: { k: 4, r: 0.2, lock: true },
      ogledala: { x: 0.34, y: 0.562, z: 0.5, w: 0.07, h: 0.065, d: 0.15, z0: 0.285 }, celjusti: { r: [0.11, 0.21], a: [70, 125] },
      crte: { z: [0.05, 0.13], x: [[0.8, 1.7]], fit: true, dy: -0.36, sx: [0.65, 1.7] }, nalepke: { side: [[0.85, 1.55]], y: [0.2, 0.36], hood: { x: [0.85, 1.5], z: [0.04, 0.14] } },
      dim_gum: { w: 0.4 }, cip: { x: -0.95, y: 0.4, z: 0 }, turbo: { x: -1.1, y: 0.15, z: 0.2, ic: [-0.6, 0.13, 0.39] }, akumulator: { x: -1.07, y: 0.612, z: 0, back: true },
      vzmeti: { in: 0.58, top: 0.48 }, amortizerji: { in: 0.575, top: 0.5 }, stabilizatorji: { in: 0.42, floor: [0.2, 0.09] } };
  }
  // ---- TAIFUN LM (MODELS 'lm'): render.js lmGeometry's pieces (look units = metres): the canopy a closed loft (its glass the stock's); the tub,
  // the pontoons, floor, diffuser, fences, gearbox and the tail's band in 'body'; the nose 'hood', the splitter 'bumperF', the rear wing on its
  // swan necks with the DRS flap 'bumperR', the engine cover with the fin 'trunk', the louvres 'fenderL' / 'fenderR', the mirrors on stalks down
  // to the pontoons; one track for both axles (hw 0.825: the stock front's 5 mm in, the rear's 5 mm out; docs/deli.md)
  const LSECS = [[-1.05, 0.40, 0.52, 0.72, 0.28, 0.81, 0.06, 'r', 0.03], [-0.45, 0.475, 0.52, 0.84, 0.36, 0.99, 0.06, 'r', 0.03],
    [0.22, 0.485, 0.52, 0.86, 0.38, 1.01, 0.06, 'gf', 0.03], [0.8, 0.475, 0.52, 0.76, 0.36, 0.91, 0.06, 'gf', 0.03],
    [1.2, 0.4375, 0.5033, 0.5933, 0.36, 0.6383, 0.0233, 'b', 0.0258], [1.28, 0.43, 0.5, 0.56, 0.36, 0.584, 0.016, 'b', 0.025]];   // (1.2: the windscreen's painted foot)
  const lPod = (x, zi, zo, yb, yt, sd) => [[x, yb, sd * zi], [x, yb, sd * (zo - 0.04)], [x, yb + 0.05, sd * zo], [x, yt - 0.1, sd * zo], [x, yt - 0.02, sd * (zo - 0.07)],
    [x, yt, sd * (zo - 0.2)], [x, yt - 0.03, sd * (zi + 0.12)], [x, yt - 0.12, sd * zi]];
  const LPOD = [[2.45, 0.42, 0.9, 0.16, 0.36], [2.2, 0.4, 0.98, 0.12, 0.62], [1.95, 0.4, 1.0, 0.34, 0.8], [1.55, 0.42, 1.0, 0.44, 0.87], [1.15, 0.44, 1.0, 0.36, 0.8],
    [0.95, 0.46, 0.99, 0.12, 0.7], [0.55, 0.5, 0.98, 0.12, 0.6], [-0.6, 0.5, 0.98, 0.12, 0.64], [-0.95, 0.46, 0.99, 0.14, 0.78], [-1.1, 0.44, 1.0, 0.36, 0.86],
    [-1.45, 0.42, 1.0, 0.46, 0.92], [-1.85, 0.42, 1.0, 0.38, 0.88], [-2.1, 0.42, 0.98, 0.2, 0.8], [-2.42, 0.4, 0.94, 0.18, 0.7]];
  function lookLm() {
    return {
      body: { len: 4.95, wid: 2.0, wz: 0.175, secs: LSECS, roofY: 1.07, engRear: true, engine: [-1.35, 0.78], crush: { x0: 0, x1: 0, z: 0 },
        eye: { x: 0.3, y: 0.85 }, decalX: -0.12, decalY: 1.06, decalS: 0.62, lamps: [[2.49, 0.3, 0.7], [-2.47, 0.615, 0.62]] },
      wheels: { style: 'slick', w: 0.3, wR: 0.34, arch: false, rim: [0.1, 0.1, 0.11], tyre: [0.075, 0.075, 0.08] },
      regions: 'none',
      build(K) {
        const P = K.paint, S = K.strp, KB = K.black, KD = K.dark;
        // the canopy: its windscreen (the 'gf' bands' top) and side windows (the window band over the cockpit) the stock's glass
        const L = K.loft(K.body.secs, (k, e) => ((k === 2 || k === 3) && e >= 3 && e <= 5) || ((k === 1 || k === 2) && (e === 2 || e === 6)) ? K.GLASS : P,
          { caps: { front: { col: P, low: 'body', high: 'body', cut: 0 }, rear: { col: P, low: 'body', high: 'body', cut: 0 } }, arches: false, tubs: false });
        K.part('body', () => {
          K.skin([fRing(1.3, 0.08, 0.46, 0.34, 0.5, 0.54, 0.44, 0.7), fRing(0.9, 0.08, 0.52, 0.38, 0.56, 0.58, 0.5, 0.7), fRing(-0.4, 0.08, 0.56, 0.4, 0.6, 0.6, 0.54, 0.7),
            fRing(-1.05, 0.08, 0.54, 0.4, 0.58, 0.6, 0.5, 0.7)], (k, e) => e === 9 ? KB : P, FK2, FK2);   // (the tub)
          for (const sd of [-1, 1]) {   // the pontoons over the wheels (their stripe on the top over the arches) and their intakes
            K.skin(LPOD.map(([x, zi, zo, yb, yt]) => lPod(x, zi, zo, yb, yt, sd)), (k, e) => e <= 1 || e === 7 ? KB : e === 4 && (k === 2 || k === 3 || k === 9 || k === 10) ? S : P, P, KB);
            K.plate([[0.92, 0.2, sd * 0.997], [0.62, 0.2, sd * 0.987], [0.62, 0.5, sd * 0.987], [0.92, 0.6, sd * 0.997]], 0.006, KB);   // (planar: z linear in x)
          }
          K.box(0.2, 0.045, 0, 4.2, 0.035, 1.3, 0, KB);   // the floor, the diffuser and its fences, the gearbox, the tail's band
          K.plate([[-1.8, 0.08, -0.66], [-1.8, 0.08, 0.66], [-2.44, 0.34, 0.66], [-2.44, 0.34, -0.66]], 0.012, KB);
          for (const z of [-0.62, -0.3, 0.3, 0.62]) K.box(-2.18, 0.06, z, 0.5, 0.2, 0.02, 0, FK2);
          K.box(-2.3, 0.16, 0, 0.28, 0.34, 0.62, 0, KB); K.box(-2.435, 0.585, 0, 0.02, 0.06, 1.8, 0, KB);
        }, { noCrush: true });
        K.deli('zarometi', () => { for (const sd of [-1, 1]) K.headLamp(2.461, 0.2925, sd * 0.68, 0.03, { shape: 'rect', w: 0.34, h: 0.045, ring: null, col: [0.95, 0.97, 1.0], host: 'body' }); });
        K.deli('zadnje_luci', () => { for (const sd of [-1, 1]) K.tailLamp(-2.444, 0.615, sd * 0.425, 0.85, 0.04, { d: 0.02 }); });   // (x -2.462..-2.442 as stock)
        K.part('hood', () => {   // the nose (its stripe the stock's), the front's dark bay under it
          K.skin([fRing(1.3, 0.1, 0.46, 0.34, 0.5, 0.545, 0.44, 0.7), fRing(1.8, 0.1, 0.4, 0.3, 0.44, 0.465, 0.38, 0.7), fRing(2.2, 0.1, 0.34, 0.24, 0.38, 0.37, 0.32, 0.7),
            fRing(2.52, 0.1, 0.22, 0.18, 0.25, 0.26, 0.2, 0.7)], (k, e) => e === 9 ? KB : k === 2 ? S : P, FK2, S);
          K.inner(() => K.box(1.5, 0.148, 0, 0.5, 0.2, 0.44, 0, KD));
        });
        K.part('bumperF', () => {   // the splitter, the dive planes and their end plates
          K.wingPlank(2.56, 0.06, 2.04, 0.072, 0.024, -0.97, 0.97, KB);
          for (const sd of [-1, 1]) { K.wingPlank(2.40, 0.30, 2.18, 0.34, 0.014, Math.min(sd * 0.93, sd * 1.06), Math.max(sd * 0.93, sd * 1.06), P);
            K.endplate([[2.56, 0.04], [2.04, 0.04], [2.1, 0.14], [2.5, 0.12]], sd * 0.975, 0.016, KB); }
        });
        K.part('bumperR', () => {   // the rear wing, its DRS flap, end plates and swan necks
          K.wingPlank(-2.02, 0.965, -2.40, 1.03, 0.032, -0.9, 0.9, P); K.wingPlank(-2.26, 1.08, -2.42, 1.17, 0.018, -0.88, 0.88, S);
          for (const sd of [-1, 1]) { K.endplate([[-1.96, 0.7], [-2.52, 0.7], [-2.52, 1.16], [-2.02, 1.1]], sd * 0.92, 0.02, P);
            K.bar([-2.18, 0.6, sd * 0.24], [-2.16, 0.94, sd * 0.24], 0.02, KB, { n: 4 }); K.bar([-2.16, 0.94, sd * 0.24], [-2.22, 1.035, sd * 0.24], 0.0175, KB, { n: 4 }); }
        });
        K.part('trunk', () => {   // the engine cover, the fin; the engine, its intake, the gearbox's case and the exhaust under the cover
          K.skin([fRing(-1.0, 0.5, 0.42, 0.72, 0.38, 0.875, 0.28, 0.7), fRing(-1.6, 0.5, 0.38, 0.66, 0.34, 0.785, 0.24, 0.7), fRing(-2.1, 0.5, 0.34, 0.6, 0.3, 0.705, 0.2, 0.7),
            fRing(-2.4, 0.48, 0.3, 0.56, 0.26, 0.645, 0.16, 0.7)], (k, e) => e === 9 ? KB : P, null, FK2);
          K.endplate([[-0.5, 1.03], [-2.26, 0.99], [-2.26, 0.66], [-1.0, 0.86]], 0, 0.018, S);
          K.inner(() => { K.box(-1.5, 0.52, 0, 0.8, 0.16, 0.36, 0, [0.4, 0.41, 0.43]); K.box(-1.3, 0.68, 0, 0.36, 0.08, 0.2, 0, [0.16, 0.16, 0.18]);
            K.box(-1.95, 0.55, 0, 0.26, 0.12, 0.18, 0, [0.62, 0.5, 0.36]); K.bar([-1.7, 0.6, 0], [-2.3, 0.58, 0], 0.03, [0.62, 0.6, 0.56], { n: 6 }); });
        });
        for (const sd of [-1, 1]) K.part(sd < 0 ? 'fenderL' : 'fenderR', () => {   // the louvres over the front wheels
          K.box(1.55, 0.868, sd * 0.72, 0.42, 0.012, 0.26, 0, KB);
          for (let i = 0; i < 5; i++) K.box(1.39 + i * 0.08, 0.872, sd * 0.72, 0.022, 0.02, 0.24, 0, [0.22, 0.22, 0.24]);
        });
        K.deli('ogledala', () => { for (const sd of [-1, 1]) { K.mirror(1.0, 0.9, sd * 0.8, { w: 0.1, h: 0.06, d: 0.17, col: P, z0: sd * 0.75 });
          K.part(sd < 0 ? 'mirrorL' : 'mirrorR', () => K.box(1.02, 0.712, sd * 0.75, 0.03, 0.168, 0.03, 0, KB)); } });   // (the stalk down into the pontoon)
        for (const id of ['crte', 'nalepke', 'celjusti', 'akumulator', 'turbo', 'cip', 'vzmeti', 'amortizerji', 'stabilizatorji', 'dim_gum']) K.deli(id, () => {});
        return L;
      },
    };
  }
  function mountsLm() {   // (its own wings and aero; no doors, bonnet, grille, roof, rear window or exhaust in sight)
    return { platisca: {}, barva: {}, luc_pod_avtom: {}, gume: {}, zatemnitev: {}, zavore: { s: 1 }, matice: { k: 4, r: 0.2, lock: true },
      ogledala: { x: 1.0, y: 0.9, z: 0.8, w: 0.1, h: 0.06, d: 0.17, z0: 0.75 }, celjusti: { r: [0.11, 0.21], a: [70, 125] },
      zarometi: { x: 2.452, y0: 0.2925, lean: 0, zc: 0.68, yc: 0.2925, s: 0.19, hosts: ['body', 'body'], shape: [[-0.17, -0.0225], [0.17, -0.0225], [0.17, 0.0225], [-0.17, 0.0225]], bulge: 0, ringW: 0.006 },
      zadnje_luci: { x: -2.426, zc: 0.43, yc: 0.615, w: 0.14, h: 0.3, s: 0.28, shape: [[-0.4, -0.02], [-0.4, 0.02], [0.4, 0.02], [0.4, -0.02]], hosts: ['body', 'body'] },
      crte: { z: [0.05, 0.13], x: [[-1.0, 0.2], [1.21, 1.28]], fit: true }, nalepke: { side: [[-0.42, 0.2], [0.0, 0.55], [-0.85, -0.3]], y: [0.65, 0.83], hood: { x: [-1.0, -0.48], z: [0.04, 0.14] } },
      dim_gum: { w: 0.34 }, cip: { x: 1.55, y: 0.348, z: 0 }, turbo: { x: -1.35, y: 0.53, z: 0.15, twin: [-0.32, 0.02], ic: [-0.3, 0.3, 0.75] }, akumulator: { x: 0.2, y: 0.08, z: 0.2 },
      vzmeti: { in: 0.345, top: 0.72, seat: [0.44, 0.46] }, amortizerji: { in: 0.34, top: 0.72 }, stabilizatorji: { in: 0.45, floor: [0.2, 0.09] } };   // (the battery on the tub's floor; the coil-overs in the pontoons against their inner wall)
  }
  for (const [id, key] of [['kaze', 'coupe'], ['vortex', 'sedan'], ['pico', 'hatch'], ['strega', 'wedge']])
    VEHICLE_DEFS.push({ id, patch: true, look: look(key), mounts: mounts(key) });
  VEHICLE_DEFS.push({ id: 'muscle', patch: true, look: lookMuscle(), mounts: mountsMuscle() });
  VEHICLE_DEFS.push({ id: 'rally', patch: true, look: lookRally(), mounts: mountsRally() });
  VEHICLE_DEFS.push({ id: 'truck', patch: true, look: lookTruck(), mounts: mountsTruck() });
  VEHICLE_DEFS.push({ id: 'ev', patch: true, look: lookEv(), mounts: mountsEv() });
  VEHICLE_DEFS.push({ id: 'formula', patch: true, look: lookFormula(), mounts: mountsFormula() });
  VEHICLE_DEFS.push({ id: 'lm', patch: true, look: lookLm(), mounts: mountsLm() });
})();
