/* Hitri osnutki novih tovornjakov in posebnega vozila (docs/vrsta.md, »4 novi tovornjaki + 1 posebno vozilo«): samo izhodišče za modele
   in za slike vprašanj `tovornjaki-bt-1`, `tovornjaki-bt-posebno` in `tovornjaki-ps-1` na strani Odločitve. NE gre v igro (index.html ga ne naloži; slike:
   node tools/tovornjaki/slike.mjs). Vozne vrednosti so TITANOVE (samo da osnutek pelje; prave pridejo z modelom, po vprašanju).
   Jedro dovoli največ 6,4 m dolžine (TITAN 5,9 m), zato so vsi dolgi 6,2–6,4 m.
   Id-ji: tb1a, tb1b, tb1c (prekucnik BIVOL: dolgi nos, kabina nad motorjem, kamnolomski), tbg (gasilsko vozilo FENIKS),
   tb2 (mešalec betona VRTINEC), tb3 (dolgonosi dirkalni vlačilec VIHAR), tb4 (avtovleka ŽERJAV).
   Vse izmišljeno, brez znamk in napisov. Datoteko izbriše seja, ki naredi zadnji model. */
var VEHICLE_DEFS = VEHICLE_DEFS || [];
(function () {
  'use strict';
  const DK = [0.13, 0.13, 0.15], ST = [0.42, 0.43, 0.46], AL = [0.72, 0.73, 0.76], AM = [1.0, 0.62, 0.12], BL = [0.25, 0.5, 1.0];
  function truck(o) {
    VEHICLE_DEFS.push({
      id: o.id, name: o.name, cat: 'tovornjaki', ord: 90, drive: 'FR', desc: o.name,
      phys: { mass: 5300, a: o.a, b: o.b, kI: 1.6, kw: 820, redline: 2800, idle: 600, gears: [6, 4.7, 3.7, 2.95, 2.4, 1.95, 1.6, 1.33, 1.13, 1], final: 3.42, rw: 0.55, cDrag: 0.8,
        len: o.len, wid: 2.5, steerMax: 0.55, tracK: 0.55, brakeK: 0.7, spinK: 0.4, dmgK: 0.6, vLim: 160, sway: 1.4, landV: 13 },
      arc: { amax: 1.42, kv: 1.8, rmin: 7.5 },
      csp: { bx: 0.12, coast: -0.06, thr: -0.01, liftP: 0.04, pwr: 0.04, out: 1.2, turn: 0.75, w: 0.92, tv: 1.2 },
      stats: { power: 10, grip: 1, weight: 1, drift: 10 }, price: 60000, pk: 'open', field: [o.id], fieldN: 1, fill: ['kolibri', 'miska'],
      snd: { kind: 'diesel', hz: 1, turbo: 0.8, loud: 1.3 },
      parts: { set: 'truck', ht: o.ht, y0: 0.6 },
      look: { body: { len: o.len, wid: 2.5, roofY: o.roofY, secs: o.secs, eye: o.eye }, wheels: { style: 'truck', w: 0.34, wR: 0.36, gap: 0.06, rim: o.rim || [0.84, 0.85, 0.87], mid: o.mid },
        regions: 'none', build: o.build },
    });
  }
  // kabina nad motorjem (prednja stena pri x1, zadnja pri x0; dno yb, streha yt): zaobljeni vogali kot TITAN
  const cabOver = (x0, x1, yb, yt, hw) => { const yg = yb + 0.8, w = hw; return [
    [x0, w - 0.14, yb, yg, w - 0.2, yt - 0.07, 0.05, 'r', 0.06], [x0 + 0.1, w, yb, yg, w - 0.07, yt, 0.06, 'r', 0.06],
    [x1 - 0.36, w, yb, yg + 0.01, w - 0.07, yt + 0.01, 0.06, 'r', 0.06], [x1 - 0.24, w, yb, yg + 0.01, w - 0.07, yt - 0.043, 0.058, 'r', 0.06],
    [x1 - 0.21, w, yb, yg + 0.01, w - 0.072, yt - 0.1, 0.055, 'gf', 0.06], [x1 - 0.03, w - 0.12, yb, yg, w - 0.19, yg + 0.12, 0.03, 'gf', 0.06],
    [x1, w - 0.24, yb, yg - 0.01, w - 0.31, yg + 0.03, 0.02, 'b', 0.06]]; };
  // lupina kabine: barva, vetrobransko steklo, stekla vrat med xa in xb
  function cab(K, xa, xb, P2) {
    const P = K.paint, G = K.GLASS;
    return K.loft(K.body.secs, (k, e, kind, at) => {
      if (at.end) return P;
      if (e === 0 || e === 8) return DK;
      if (kind === 'gf') return e >= 3 && e <= 5 ? G : P;
      if (kind === 'gr') return P;
      if ((e === 2 || e === 6) && at.x > xa && at.x < xb) return G;
      return e === 4 && P2 ? P2 : P;
    }, { caps: { front: { col: P, low: 'body', high: 'body' }, rear: { col: P, low: 'body', high: 'body' } }, arches: false,
      regions: ['L', 'R'].map(sd => ({ part: 'door' + sd, x: [xa, xb], bands: ['side', 'window'], side: sd })) });
  }
  const pair = (f) => { f(-1); f(1); };
  // šasija, rezervoarja, blatniki zadnjih osi, zadnja prečka z lučmi
  function chassis(K, x0, x1, axles, o) {
    o = o || {};
    pair(sd => K.box((x0 + x1) / 2, 0.78, sd * 0.43, x1 - x0, 0.3, 0.12, 0, DK));
    for (const x of [x0 + 0.5, (x0 + x1) / 2, x1 - 0.4]) K.box(x, 0.84, 0, 0.14, 0.16, 0.8, 0, DK);
    pair(sd => K.cyl([o.tank || 0.2, 0.74, sd * 0.86], [(o.tank || 0.2) + 1.0, 0.74, sd * 0.86], 0.3, AL, { n: 10 }));
    for (const x of axles) pair(sd => K.flare(x, 0.62, 0.66, sd * 0.86, sd * 1.25, DK));
    K.box(x0 - 0.02, 0.62, 0, 0.12, 0.2, 2.4, 0, DK, null, false, { part: 'bumperR' });
    pair(sd => { K.rect(x0 - 0.085, 0.72, sd * 0.95, 0.36, 0.14, DK, { dir: '-x' }); K.tailLamp(x0 - 0.09, 0.72, sd * 0.95, 0.3, 0.1); });
    pair(sd => K.box(x0 + 0.02, 0.14, sd * 0.98, 0.02, 0.5, 0.5, 0, DK, null, true));
  }
  // prednji odbijač z lučmi, maska, stopnice, ogledala
  function front(K, x, yb, o) {
    const B = o.bump || DK;
    K.box(x - 0.08, 0.5, 0, 0.3, yb - 0.5 - 0.06, 2.46, 0, B, null, false, { part: 'bumperF' });
    pair(sd => { for (const k of [0, 1]) K.headLamp(x + 0.075, (0.5 + yb) / 2, sd * (0.98 - k * 0.26), 0.1, { ring: ST }); });
    K.grille(x + 0.005, yb + (o.gh || 0.5) / 2 + 0.06, 0, o.gw || 1.7, o.gh || 0.5, { slats: o.slats || 5, frame: o.frame });
    pair(sd => { K.box(o.step, 0.5, sd * 1.14, 0.6, 0.06, 0.2, 0, ST); K.box(o.step, 0.82, sd * 1.14, 0.6, 0.06, 0.2, 0, ST); });
    pair(sd => K.mirror(o.mx, o.my, sd * 1.36, { col: DK, w: 0.16, h: 0.36 }));
    if (o.ax != null) pair(sd => K.flare(o.ax, 0.62, 0.66, sd * 0.86, sd * 1.25, DK));
  }
  // keson prekucnika: dno, stranici z rebri, čelna stena s ščitom nad kabino, zadnja loputa
  function tipper(K, x0, x1, y0, y1, o) {
    const C = o.col, C2 = K.shade(C, 0.8), hw = 1.24, L = x1 - x0, n = o.ribs || 5;
    K.box((x0 + x1) / 2, y0 - 0.12, 0, L, 0.12, 2 * hw, 0, C2);
    pair(sd => {
      K.box((x0 + x1) / 2, y0, sd * (hw - 0.03), L, y1 - y0, 0.06, 0, C);
      K.box((x0 + x1) / 2, y1 - 0.06, sd * (hw + 0.01), L, 0.1, 0.1, 0, C2);
      for (let i = 0; i < n; i++) K.box(x0 + 0.25 + (L - 0.5) * i / (n - 1), y0 - 0.1, sd * (hw + 0.015), 0.1, y1 - y0 + 0.06, 0.07, 0, C2);
    });
    K.box(x1 - 0.03, y0, 0, 0.06, y1 - y0 + (o.wall || 0), 2 * hw, 0, C);
    if (o.shield) { K.box(x1 + o.shield / 2, y1 + (o.wall || 0) - 0.07, 0, o.shield, 0.07, 2 * hw - 0.1, 0, C); K.box(x1 + o.shield - 0.03, y1 + (o.wall || 0) - 0.2, 0, 0.06, 0.14, 2 * hw - 0.1, 0, C2); }
    // loputa: okvir, dve prečki, tečaja zgoraj, zapaha spodaj (od zadaj jo vidi kamera za avtom)
    K.box(x0 + 0.03, y0, 0, 0.06, y1 - y0 - 0.04, 2 * hw - 0.08, 0, o.gate || C);
    for (const y of [y0 + 0.02, (y0 + y1) / 2 - 0.05, y1 - 0.16]) K.box(x0 - 0.02, y, 0, 0.06, 0.1, 2 * hw - 0.06, 0, C2);
    pair(sd => { K.box(x0 - 0.02, y0, sd * (hw - 0.07), 0.07, y1 - y0, 0.12, 0, C2); K.cyl([x0, y1 + 0.02, sd * (hw - 0.2)], [x0, y1 + 0.02, sd * (hw + 0.03)], 0.06, ST, { n: 8 }); });
    if (o.load) K.box((x0 + x1) / 2, y1 - 0.5, 0, L - 0.2, 0.38, 2 * hw - 0.2, 0, o.load, K.shade(o.load, 1.15));
    K.cyl([x1 - 0.5, 0.95, 0], [x1 - 0.2, y0 - 0.1, 0], 0.1, ST, { n: 8 });   // dvižni valj
  }
  const stacks = (K, x, y1, sides) => { for (const sd of sides) { K.cyl([x, 1.0, sd * 1.0], [x, y1, sd * 1.0], 0.075, AL, { n: 8 }); K.cyl([x, y1 - 0.9, sd * 1.0], [x, y1 - 0.3, sd * 1.0], 0.105, ST, { n: 8 }); } };
  const beacons = (K, x, y, zs, col) => { for (const z of zs) { K.box(x, y, z, 0.2, 0.05, 0.34, 0, DK); K.box(x, y + 0.05, z, 0.16, 0.1, 0.3, 0, col); } };

  // 1a · DOLGI NOS: klasičen prekucnik s kabino za motorjem, dolg pokrov, kromiran odbijač, dva dimnika
  truck({ id: 'tb1a', name: 'BIVOL A', len: 6.4, a: 2.25, b: 2.3, mid: -1.05, ht: 3.0, roofY: 2.62, eye: { x: 0.4, y: 2.2 },
    secs: [[-0.2, 1.1, 1.0, 1.72, 1.02, 2.52, 0.04, 'r', 0.06], [-0.1, 1.2, 1.0, 1.72, 1.1, 2.6, 0.06, 'r', 0.06], [0.96, 1.2, 1.0, 1.72, 1.1, 2.62, 0.06, 'gf', 0.06],
      [1.38, 1.2, 1.0, 1.7, 1.02, 1.86, 0.05, 'b', 0.06], [2.96, 1.0, 1.0, 1.62, 0.84, 1.78, 0.06, 'b', 0.06], [3.2, 0.9, 1.04, 1.56, 0.76, 1.7, 0.04, 'b', 0.06]],
    build(K) {
      const P = K.paint, CH = K.chrome || AL;
      cab(K, 0.0, 0.9);
      K.grille(3.205, 1.36, 0, 1.3, 0.56, { slats: 7, frame: CH });
      K.box(3.2, 0.56, 0, 0.26, 0.3, 2.46, 0, CH, null, false, { part: 'bumperF' });
      pair(sd => { K.flare(2.25, 0.62, 0.68, sd * 0.8, sd * 1.25, P); K.headLamp(3.18, 1.16, sd * 1.02, 0.13, { ring: CH }); K.box(3.06, 0.98, sd * 1.02, 0.24, 0.34, 0.3, 0, P); });
      pair(sd => { K.box(0.55, 0.5, sd * 1.14, 1.1, 0.06, 0.22, 0, ST); K.mirror(1.15, 2.1, sd * 1.36, { col: CH, w: 0.16, h: 0.36 }); });
      stacks(K, -0.32, 3.0, [-1, 1]);
      chassis(K, -3.1, -0.25, [-2.3, -1.05], { tank: -0.1 });
      tipper(K, -3.2, -0.45, 1.22, 2.3, { col: K.strp, ribs: 4, wall: 0.3, shield: 1.0, load: [0.5, 0.47, 0.42] });
      K.number(0.45, 1.36, -1.205, 0.4, { dir: '-z' }); K.number(0.45, 1.36, 1.205, 0.4, { dir: 'z' });
    } });

  // 1b · KABINA NAD MOTORJEM: sodoben gradbeni prekucnik, raven čelni del, visoke stranice z rebri, oranžni luči na strehi
  truck({ id: 'tb1b', name: 'BIVOL B', len: 6.4, a: 2.2, b: 2.25, mid: -1.0, ht: 3.0, roofY: 2.75, eye: { x: 2.6, y: 2.3 },
    secs: cabOver(1.75, 3.2, 1.16, 2.72, 1.24),
    build(K) {
      const S = K.strp;
      const C = cab(K, 2.15, 2.85);
      C.decal.side([[1.8, 1.3], [3.15, 1.3], [3.15, 1.5], [1.8, 1.5]], S, null, 0.008);
      front(K, 3.2, 1.16, { step: 2.45, mx: 2.95, my: 2.2, gw: 1.8, gh: 0.5, slats: 5, ax: 2.2 });
      beacons(K, 2.4, 2.74, [-0.7, 0.7], AM);
      stacks(K, 1.62, 2.9, [1]);
      chassis(K, -3.1, 1.7, [-2.25, -1.0], { tank: 0.3 });
      tipper(K, -3.2, 1.5, 1.25, 2.45, { col: S, ribs: 6, wall: 0.25, shield: 0.8, load: [0.62, 0.52, 0.36] });
      K.number(2.0, 1.72, -1.245, 0.3, { dir: '-z' }); K.number(2.0, 1.72, 1.245, 0.3, { dir: 'z' });
    } });

  // 1c · KAMNOLOMSKI: kratek težek prekucnik, visok keson z dolgim ščitom čez kabino, jeklen odbijač z lokom, opozorilne črte na loputi
  truck({ id: 'tb1c', name: 'BIVOL C', len: 6.2, a: 2.1, b: 2.2, mid: -0.95, ht: 3.2, roofY: 2.7, eye: { x: 2.5, y: 2.3 },
    secs: cabOver(1.75, 3.1, 1.2, 2.66, 1.2),
    build(K) {
      const P = K.paint, Y = [0.98, 0.8, 0.1];
      cab(K, 2.15, 2.8);
      front(K, 3.1, 1.2, { step: 2.4, mx: 2.85, my: 2.15, gw: 1.5, gh: 0.44, slats: 4, bump: ST, ax: 2.1 });
      K.bar([3.26, 0.9, -0.8], [3.26, 1.5, -0.8], 0.04, ST, { n: 6 }); K.bar([3.26, 0.9, 0.8], [3.26, 1.5, 0.8], 0.04, ST, { n: 6 }); K.bar([3.26, 1.5, -0.8], [3.26, 1.5, 0.8], 0.04, ST, { n: 6 });
      chassis(K, -3.0, 1.7, [-2.2, -0.95], { tank: 0.3 });
      tipper(K, -3.1, 1.5, 1.3, 2.7, { col: P, ribs: 4, wall: 0.35, shield: 1.55, gate: Y, load: [0.45, 0.44, 0.43] });
      for (let i = 0; i < 5; i++) K.rect(-3.135, 1.75, -0.9 + i * 0.45, 0.2, 0.5, DK, { dir: '-x' });   // opozorilne črte na loputi
      beacons(K, 2.4, 3.05, [0], AM);
      stacks(K, 1.62, 3.15, [-1]);
      K.number(1.98, 1.72, -1.205, 0.3, { dir: '-z' }); K.number(1.98, 1.72, 1.205, 0.3, { dir: 'z' });
    } });

  // P · gasilsko vozilo FENIKS: dolga kabina za posadko, nadgradnja z roletami, lestev na strehi, modre luči
  truck({ id: 'tbg', name: 'FENIKS', len: 6.4, a: 2.2, b: 2.0, mid: undefined, ht: 3.2, roofY: 2.75, eye: { x: 2.6, y: 2.3 },
    secs: cabOver(0.9, 3.2, 1.1, 2.7, 1.24),
    build(K) {
      const P = K.paint, W = [0.95, 0.95, 0.93], Y = [0.98, 0.85, 0.15];
      const C = cab(K, 1.2, 2.85);
      C.decal.side([[0.95, 1.2], [3.15, 1.2], [3.15, 1.36], [0.95, 1.36]], Y, null, 0.008);
      front(K, 3.2, 1.1, { step: 2.5, mx: 2.95, my: 2.2, gw: 1.7, gh: 0.46, slats: 4, bump: W, ax: 2.2 });
      beacons(K, 2.6, 2.72, [-0.75, 0.75], BL); K.box(2.6, 2.72, 0, 0.2, 0.08, 1.1, 0, W);
      // nadgradnja: omara v barvi vozila, tri srebrne rolete na vsaki strani, rumeni pas, zadaj roleta črpalke
      K.box(-1.2, 1.12, 0, 4.0, 1.6, 2.48, 0, P, W);
      pair(sd => { for (let i = 0; i < 3; i++) K.rect(-2.55 + i * 1.3, 2.05, sd * 1.243, 1.15, 1.0, AL, { dir: sd < 0 ? '-z' : 'z' });
        K.rect(-1.2, 1.3, sd * 1.243, 4.0, 0.16, Y, { dir: sd < 0 ? '-z' : 'z' }); K.flare(-2.0, 0.62, 0.66, sd * 0.86, sd * 1.25, P); });
      K.rect(-3.203, 2.05, 0, 1.6, 1.0, AL, { dir: '-x' }); K.rect(-3.203, 1.3, 0, 2.46, 0.16, Y, { dir: '-x' });
      K.box(-3.15, 0.6, 0, 0.16, 0.2, 2.44, 0, W, null, false, { part: 'bumperR' });
      pair(sd => { K.rect(-3.205, 2.6, sd * 1.05, 0.26, 0.14, DK, { dir: '-x' }); K.tailLamp(-3.21, 2.6, sd * 1.05, 0.2, 0.1);
        K.rect(-3.235, 0.7, sd * 1.0, 0.36, 0.14, DK, { dir: '-x' }); K.tailLamp(-3.24, 0.7, sd * 1.0, 0.3, 0.1); });
      // lestev na strehi (dva nosilca, prečke), sesalna cev
      pair(sd => K.bar([-3.1, 2.86, sd * 0.3 + 0.3], [0.6, 2.86, sd * 0.3 + 0.3], 0.035, AL, { n: 6 }));
      for (let i = 0; i < 12; i++) K.bar([-3.0 + i * 0.32, 2.86, 0], [-3.0 + i * 0.32, 2.86, 0.6], 0.022, AL, { n: 5 });
      K.cyl([-2.4, 2.86, -0.8], [-0.4, 2.86, -0.8], 0.11, [0.55, 0.3, 0.2], { n: 8 });
      beacons(K, -3.0, 2.72, [-0.9, 0.9], BL);
      K.number(1.5, 1.6, -1.245, 0.3, { dir: '-z' }); K.number(1.5, 1.6, 1.245, 0.3, { dir: 'z' });
    } });

  // 2 · mešalec betona VRTINEC: kabina nad motorjem, nagnjen boben z obroči, zadaj lijak, žleb in lestev
  truck({ id: 'tb2', name: 'VRTINEC', len: 6.4, a: 2.2, b: 2.25, mid: -1.0, ht: 3.3, roofY: 2.75, eye: { x: 2.6, y: 2.3 },
    secs: cabOver(1.75, 3.2, 1.16, 2.72, 1.24),
    build(K) {
      const P = K.paint, S = K.strp;
      const C = cab(K, 2.15, 2.85);
      C.decal.side([[1.8, 1.3], [3.15, 1.3], [3.15, 1.5], [1.8, 1.5]], S, null, 0.008);
      front(K, 3.2, 1.16, { step: 2.45, mx: 2.95, my: 2.2, gw: 1.8, gh: 0.5, slats: 5, ax: 2.2 });
      beacons(K, 2.4, 2.74, [-0.7, 0.7], AM);
      stacks(K, 1.62, 2.9, [1]);
      chassis(K, -3.1, 1.7, [-2.25, -1.0], { tank: 0.3 });
      // boben: os se proti zadku dviga (~10°); čelo, trebuh, dolg stožec do ustja; obroča v barvi vozila, zadaj jeklen tekalni obroč
      const ax = (x) => [x, 2.1 + (0.3 - x) * 0.176, 0];
      const rad = (x) => x > 1.0 ? 0.95 - (x - 1.0) / 0.45 * 0.4 : x > -0.3 ? 0.98 - (x + 0.3) / 1.3 * 0.03 : 0.98 - (-0.3 - x) / 2.45 * 0.48;
      const seg = (xa, xb, col, capA, capB, up) => K.cyl(ax(xa), ax(xb), rad(xa) + (up || 0), col, { n: 14, r2: rad(xb) + (up || 0), capA, capB });
      seg(1.45, 1.0, S, S, null); seg(1.0, -0.3, S, null, null); seg(-0.3, -2.75, S, null, DK);
      for (const [xa, xb, col] of [[0.6, 0.3, P], [-0.9, -1.2, P], [-2.2, -2.4, ST]]) seg(xa, xb, col, null, null, 0.025);
      K.box(1.45, 1.08, 0, 0.3, 0.75, 0.9, 0, ST);                                   // prednji podstavek z gonilom
      pair(sd => { K.box(-2.3, 1.08, sd * 0.72, 0.16, 1.1, 0.14, 0, ST); K.bar([-2.3, 2.18, sd * 0.72], [-2.92, 2.9, sd * 0.4], 0.04, ST); });
      K.box(-2.3, 1.82, 0, 0.16, 0.12, 1.58, 0, ST);
      // lijak nad ustjem, žleb pod njim
      K.cyl([-2.98, 3.3, 0], [-2.86, 2.85, 0], 0.32, ST, { n: 10, r2: 0.18, capA: DK, capB: null });
      K.wingPlank(-2.72, 2.02, -3.22, 1.42, 0.05, -0.2, 0.2, ST);
      pair(sd => K.endplate([[-2.72, 2.02], [-3.22, 1.42], [-3.22, 1.58], [-2.72, 2.18]], sd * 0.2, 0.014, ST));
      // lestev in ploščad na desni
      for (const z of [0.82, 1.14]) K.bar([-2.96, 1.1, z], [-2.96, 2.95, z], 0.03, AL);
      for (let i = 0; i < 6; i++) K.bar([-2.96, 1.3 + i * 0.3, 0.82], [-2.96, 1.3 + i * 0.3, 1.14], 0.02, AL, { n: 5 });
      K.box(-2.72, 2.42, 0.98, 0.5, 0.04, 0.4, 0, ST);
      K.number(2.0, 1.72, -1.245, 0.3, { dir: '-z' }); K.number(2.0, 1.72, 1.245, 0.3, { dir: 'z' });
    } });

  // 3 · dolgonosi dirkalni vlačilec VIHAR: nizek, kratek, dve osi; spojler spredaj, bočna pragova, krilo za kabino, progi čez pokrov in streho
  truck({ id: 'tb3', name: 'VIHAR', len: 6.2, a: 2.2, b: 2.0, mid: undefined, ht: 2.9, roofY: 2.46, eye: { x: 0.2, y: 2.05 },
    secs: [[-0.45, 1.1, 1.0, 1.66, 1.02, 2.36, 0.04, 'r', 0.06], [-0.35, 1.2, 1.0, 1.66, 1.1, 2.44, 0.06, 'r', 0.06], [0.7, 1.2, 1.0, 1.66, 1.1, 2.46, 0.06, 'gf', 0.06],
      [1.2, 1.2, 1.0, 1.64, 1.0, 1.8, 0.05, 'b', 0.06], [2.75, 1.02, 1.0, 1.5, 0.86, 1.62, 0.06, 'b', 0.06], [3.1, 0.92, 1.02, 1.4, 0.78, 1.5, 0.04, 'b', 0.06]],
    build(K) {
      const P = K.paint, S = K.strp;
      const C = cab(K, -0.25, 0.62);
      pair(sd => { C.decal.top([[1.26, sd * 0.12], [3.04, sd * 0.12], [3.04, sd * 0.4], [1.26, sd * 0.4]], S, 0.008);
        C.decal.top([[-0.3, sd * 0.12], [0.66, sd * 0.12], [0.66, sd * 0.4], [-0.3, sd * 0.4]], S, 0.008); });
      C.decal.side([[1.3, 1.3], [3.05, 1.3], [3.05, 1.42], [1.3, 1.42]], S, null, 0.008);
      K.grille(3.105, 1.2, 0, 1.3, 0.34, { slats: 4, frame: DK });
      // prednji spojler z odprtino in razdelilnikom, luči v odbijaču
      K.box(2.98, 0.28, 0, 0.24, 0.7, 2.46, 0, P, null, false, { part: 'bumperF' });
      K.box(3.0, 0.24, 0, 0.34, 0.04, 2.5, 0, DK);
      K.rect(3.103, 0.5, 0, 1.2, 0.24, DK, { dir: 'x' });
      pair(sd => { K.headLamp(3.105, 0.8, sd * 0.94, 0.1, { shape: 'rect', w: 0.36, h: 0.14, ring: null });
        K.flare(2.2, 0.62, 0.7, sd * 0.8, sd * 1.25, P); K.flare(-2.0, 0.62, 0.7, sd * 0.8, sd * 1.25, P);
        K.box(0.1, 0.3, sd * 1.2, 2.8, 0.66, 0.06, 0, P);                            // bočni prag med osema
        K.mirror(0.95, 2.0, sd * 1.36, { col: P, w: 0.14, h: 0.3 }); });
      chassis(K, -3.0, -0.5, [], { tank: -1.35 });
      K.cyl([-1.75, 1.08, 0], [-1.75, 1.14, 0], 0.55, ST, { n: 10 });                 // sedlo
      stacks(K, -0.62, 2.3, [-1, 1]);
      // krilo za kabino na dveh nosilcih
      K.wingPlank(-0.5, 2.52, -1.08, 2.7, 0.05, -1.15, 1.15, S);
      pair(sd => { K.endplate([[-0.42, 2.44], [-1.14, 2.44], [-1.14, 2.84], [-0.42, 2.66]], sd * 1.16, 0.014, P); K.box(-0.82, 1.08, sd * 0.6, 0.1, 1.54, 0.06, 0, ST); });
      K.number(0.2, 1.36, -1.205, 0.42, { dir: '-z' }); K.number(0.2, 1.36, 1.205, 0.42, { dir: 'z' });
    } });

  // 4 · avtovleka ŽERJAV: kabina s spalnikom, nizka nadgradnja z omaricami, dvignjena teleskopska roka z vitloma, zadaj vlečne vilice
  truck({ id: 'tb4', name: 'ŽERJAV', len: 6.4, a: 2.2, b: 2.25, mid: -1.0, ht: 3.3, roofY: 2.75, eye: { x: 2.6, y: 2.3 },
    secs: cabOver(1.35, 3.2, 1.16, 2.72, 1.24),
    build(K) {
      const P = K.paint, S = K.strp, Y = [0.98, 0.82, 0.12], RD = [0.85, 0.2, 0.12];
      const C = cab(K, 2.15, 2.85);
      C.decal.side([[1.4, 1.3], [3.15, 1.3], [3.15, 1.5], [1.4, 1.5]], S, null, 0.008);
      front(K, 3.2, 1.16, { step: 2.45, mx: 2.95, my: 2.2, gw: 1.8, gh: 0.5, slats: 5, ax: 2.2, bump: ST });
      K.box(2.4, 2.74, 0, 0.24, 0.05, 1.5, 0, DK); K.box(2.4, 2.79, 0, 0.2, 0.1, 1.44, 0, AM);   // svetlobna letev na strehi
      chassis(K, -3.0, 1.3, [-2.25, -1.0], { tank: 0.3 });
      // nadgradnja: nizek zaboj v barvi vozila, tri omarice na vsaki strani, zadaj opozorilni pas
      K.box(-0.9, 1.2, 0, 4.3, 0.65, 2.48, 0, P, K.shade(P, 0.82));
      pair(sd => { for (let i = 0; i < 3; i++) K.rect(-2.35 + i * 1.35, 1.52, sd * 1.243, 1.2, 0.5, AL, { dir: sd < 0 ? '-z' : 'z' }); });
      K.rect(-3.055, 1.5, 0, 2.46, 0.3, Y, { dir: '-x' });
      for (let i = 0; i < 5; i++) K.rect(-3.059, 1.5, -1.0 + i * 0.5, 0.25, 0.3, RD, { dir: '-x' });
      pair(sd => K.tailLamp(-3.06, 1.75, sd * 1.05, 0.22, 0.1));
      // stolp z vitloma, roka (zunanji del v drugi barvi, izvlek srebrn), dvižna valja, vrv s kavljem na ploščadi
      K.box(0.55, 1.85, 0, 0.7, 0.4, 0.9, 0, ST);
      pair(sd => { K.cyl([1.0, 2.04, sd * 0.1], [1.0, 2.04, sd * 0.5], 0.17, ST, { n: 8 }); K.cyl([-0.2, 1.88, sd * 0.26], [-0.95, 2.5, sd * 0.26], 0.06, AL, { n: 6 }); });
      K.cyl([0.6, 2.2, 0], [-1.45, 2.7, 0], 0.21, S, { n: 8 });
      K.cyl([-1.45, 2.7, 0], [-2.85, 3.04, 0], 0.15, AL, { n: 8 });
      K.box(-2.92, 2.9, 0, 0.26, 0.3, 0.34, 0, ST);
      K.bar([-3.0, 2.92, 0], [-2.9, 1.95, 0], 0.016, ST, { n: 5 }); K.box(-2.9, 1.85, 0, 0.16, 0.12, 0.16, 0, AM);
      // steber z opozorilnima lučema za kabino
      pair(sd => K.bar([1.2, 1.85, sd * 1.12], [1.2, 2.98, sd * 1.12], 0.04, ST));
      K.bar([1.2, 2.98, -1.12], [1.2, 2.98, 1.12], 0.04, ST);
      beacons(K, 1.2, 3.0, [-0.8, 0.8], AM);
      // vlečne vilice zadaj
      K.box(-3.02, 0.44, 0, 0.5, 0.12, 0.3, 0, ST); K.box(-3.22, 0.44, 0, 0.1, 0.12, 1.7, 0, ST);
      K.number(2.0, 1.72, -1.245, 0.3, { dir: '-z' }); K.number(2.0, 1.72, 1.245, 0.3, { dir: 'z' });
    } });
})();
