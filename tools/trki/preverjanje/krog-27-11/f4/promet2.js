'use strict';
// fizika-4, krog 27. 11., odprta točka »kaj sledi zamaknjenemu naletu v promet«: promet.js in test merita en klic tf._hitVeh; tu po prvem
// dotiku tečejo koraki igre (race.step, brez vnosa: plin, zavora in volan 0) še SECS s, vsak klic _hitVehR se zabeleži:
//   sunek = klic, ki vrne hitrost zbliževanja > 0 (sicer samo razmik prekrivanja); energija para tik pred klicem in po njem (avto: masa z gorivom,
//   vrtenje; vozilo: hitrost, vrtenje, če je odlepljeno), gibalna količina para, globina prekrivanja (rboxHit) ob vsakem klicu.
// e med težiščema = (hitrost vozila − hitrost avta, obe vzdolž prvotne smeri vozila) / hitrost naleta: po prvem sunku in ob koncu prvega dotika (zadnji korak s prekrivanjem,
//   preden ga 0,05 s ni več); ponovni dotik = prvi sunek po tem (odlepljeno vozilo zavira 4,5 m/s², motor 7, avto brez vnosa se samo kotali, zato ga dohiti).
// Prizor in prvi dotik sta od promet.js (Bathurst, rally, vozilo stoji 60 m naprej, avto 5 cm v njegovem zadku, zamik 0 ali ±0,6 m, en klic tf._hitVeh);
// nato vozilo vodi promet (v.off = false: odlepljeno drsi po svojih pravilih, _loose) in tečejo koraki igre.
// Zagon: node promet2.js                           to drevo
//        TRKI_SNAP=<drevo pred> node promet2.js    drugo drevo (git worktree add --detach <mapa> <commit>)
//        VSE=1 node promet2.js                     izpiše vsak sunek posebej
const { SNAP, loadInst } = require('../../krog-25-11/fizika/lib.js');
const { C, SIM } = loadInst(SNAP, [
  ['const o = rboxHit(c, B); if (!o || v.nc > 0) return 0;', 'const o = rboxHit(c, B); if (this.__mer) this.__mer(c, v, o); if (!o || v.nc > 0) return 0;'],
]);
const f = (v, d = 2) => Number.isFinite(v) ? v.toFixed(d) : String(v), NAME = ['avto', 'kombi', 'avtobus', 'motor'], E = process.env, SECS = +(E.SECS || 3), DT = SIM.DT;
let bT = null;
function run(o) {
  C.setTest({ cv: 6 }); const orig = Math.random; Math.random = SIM.seeded(7);
  try {
    const T = bT || (bT = new C.Track(C.TRACKS.find((x) => x.id === 'bathurst')));
    const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 99, playerModel: C.MODELS.find((m) => m.id === 'rally'), assist: 2, phys: 'cs', seed: 9, difficulty: 1, damage: 2, endless: true }); r.start();
    const P = r.player, tf = r.tf; tf.win.dens = 0; for (const q of tf.veh) q.off = true;
    const v = tf._veh(1, o.p, P.q.s + 60, o.p); v.off = true; tf._winPlace(v, P.q.s + 60, 0); v.v = 0; tf._pose(v, 0); tf._pose(v, 0);
    const hx = Math.cos(v.h), hz = Math.sin(v.h), h = v.h, off = o.off || 0, back = v.len / 2 + P.m.len / 2 - 0.05;
    P.x = v.x - hx * back - hz * off; P.z = v.z - hz * back + hx * off;
    P.px = P.x; P.pz = P.z; P.h = P.ph = h; P.vx = Math.cos(h) * o.v; P.vz = Math.sin(h) * o.v; P.w = 0; P.net = false;
    const ma = P.m.mass + (P.fuelKg || 0), mb = v.mass, Ia = P.I * ma / P.m.mass, Ib = mb * (v.len * v.len + v.wid * v.wid) / 12;
    const vv = () => v.st === 0 ? [T.tx[v.i] * v.v * v.dir, T.tz[v.i] * v.v * v.dir] : [v.vx, v.vz];
    const en = () => { const b = vv(); return 0.5 * ma * (P.vx * P.vx + P.vz * P.vz) + 0.5 * Ia * P.w * P.w + 0.5 * mb * (b[0] * b[0] + b[1] * b[1]) + (v.st === 1 ? 0.5 * Ib * v.w * v.w : 0); };
    const mom = () => { const b = vv(); return [ma * P.vx + mb * b[0], ma * P.vz + mb * b[1]]; };
    const eC = () => { const b = vv(); return ((b[0] * hx + b[1] * hz) - (P.vx * hx + P.vz * hz)) / o.v; };
    const E0 = en(), hits = []; let k = 0, pen = 0, penMax = 0, penMaxT = 0, lastTouch = -1, touchSteps = 0;
    tf.__mer = (c, q, ov) => { if (c !== P || q !== v) return; pen = ov ? ov.pen : 0; if (ov) { lastTouch = k; touchSteps++; if (k > 0 && pen > penMax) { penMax = pen; penMaxT = k * DT; } } };
    const inner = tf._hitVehR;
    tf._hitVehR = function (c, q, K) {
      if (c !== P || q !== v) return inner.call(this, c, q, K);
      const e0 = en(), m0 = mom(), w0 = P.w, res = inner.call(this, c, q, K);
      if (res > 0) { const e1 = en(), m1 = mom(); hits.push({ k, t: k * DT, vn: res, dE: e1 - e0, dEr: (e1 - e0) / e0, dp: Math.hypot(m1[0] - m0[0], m1[1] - m0[1]) / Math.hypot(m0[0], m0[1]), pen, eC: eC(), w: P.w, w0, wv: v.w || 0, st: v.st }); }
      return res;
    };
    let nan = false, offK = 0, e1 = null, t1 = null, n1 = 0, again = null, dT = 0, dW = 0, dO = 0;   // (e1: e med težiščema, ko se prvi dotik konča; again: prvi sunek po njem)
    tf._hitVeh(P, v); v.off = false; v.s = tf._rs(v.s, tf.win.ps);   // (prvi dotik: isti klic kot promet.js in test; od tu vozilo vodi promet sam: odlepljeno drsi, _loose; s v zveznem merilu okna, sicer ga okno neskončne vožnje takoj izključi)
    const dmg1 = P.dmg, eCk = [eC()], GAP = Math.round(0.05 / DT), N = Math.round(SECS / DT);
    for (k = 1; k <= N; k++) {
      P.inThr = 0; P.inBrk = 0; P.inSteer = 0; P.inHand = 0;
      const h0 = hits.length, d0 = P.dmg; r.step(DT); eCk[k] = eC();
      if (P.dmg - d0 > 1e-9) { const vt = hits.slice(h0).reduce((m, x) => Math.max(m, x.vn), 0); if (vt > 3.5) dT += P.dmg - d0; else if (P.hitWall > 0) dW += P.dmg - d0; else dO += P.dmg - d0; }   // (od kod rast poškodb po prvem sunku: sunek prometa nad pragom 3,5 m/s, ograja v tem koraku, drugo)
      if (v.off) offK++;
      if (!Number.isFinite(P.x + P.z + P.vx + P.vz + P.w + v.x + v.z + (v.vx || 0) + (v.vz || 0) + (v.w || 0))) { nan = true; break; }
      if (e1 === null && k - lastTouch >= GAP) { e1 = eCk[lastTouch]; t1 = lastTouch * DT; n1 = hits.filter((x) => x.k <= lastTouch).length; }   // (prvi dotik je končan, ko 0,05 s ni prekrivanja; e ob koncu koraka z zadnjim prekrivanjem)
      if (e1 !== null && !again && hits.length > h0) again = hits[h0];
    }
    const dh = (a) => { let d = a - h; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
    return { hits, penMax, penMaxT, e1, t1, n1, back: again, nan, E0, touchSteps, st: v.st, mb, dhC: dh(P.h), dhV: dh(v.h), vC: Math.hypot(P.vx, P.vz), vV: Math.hypot(v.vx || 0, v.vz || 0),
      touching: N - lastTouch < GAP, dmg1, dmg: P.dmg, offK, dT, dW, dO };
  } finally { Math.random = orig; C.setTest(null); }
}
const pct = (a, b) => f(a / b * 100, 1);
console.log('drevo: ' + SNAP + '; ' + SECS + ' s po prvem dotiku, brez vnosa, korak ' + f(DT * 1000, 2) + ' ms; prvi dotik je končan, ko 0,05 s ni prekrivanja');
console.log('vozilo (kg) kmh zamik m | sunkov skupaj, v prvem dotiku | prvi: e med težiščema | drugi: ob s, vn km/h (delež prvega) | največji poznejši vn km/h (delež prvega) | največja sprememba energije para v enem sunku J | energija para: prvi sunek %, poznejši % | prvi dotik: konec ob s, e med težiščema | ponovni dotik: ob s, vn km/h | korakov v dotiku, ob koncu | največje prekrivanje po prvem koraku cm (ob s) | zasuk avta / vozila po ' + SECS + ' s st | hitrost avta / vozila km/h | poškodbe po prvem sunku → ob koncu | rast poškodb: sunek prometa nad 3,5 m/s / ograja / drugo');
const tot = { n: 0, gain: 0, gainMax: 0, n1: 0, back: 0, nan: 0, off: 0, e1neg: 0, penMax: 0 };
for (const p of [0, 1, 2, 3]) for (const kmh of [60, 120, 200]) for (const off of [0, 0.6, -0.6]) {
  const q = run({ p, v: kmh / 3.6, off }), H = q.hits, h1 = H[0], h2 = H[1], later = H.slice(1);
  const vmax = later.reduce((m, x) => Math.max(m, x.vn), 0), gain = H.reduce((m, x) => Math.max(m, x.dE), -Infinity), sumL = later.reduce((s, x) => s + x.dE, 0);
  tot.n += H.length; tot.n1 += q.n1; if (q.back) tot.back++; if (gain > 1e-6) { tot.gain++; tot.gainMax = Math.max(tot.gainMax, gain); } if (q.nan) tot.nan++; if (q.offK) tot.off++; if (q.e1 !== null && q.e1 < 0) tot.e1neg++; tot.penMax = Math.max(tot.penMax, q.penMax);
  console.log(`${NAME[p]} (${f(q.mb, 0)}) ${kmh} ${off} | ${H.length}, ${q.e1 === null ? H.length : q.n1} | ${h1 ? f(h1.eC, 3) : '-'} | ${h2 ? f(h2.t, 3) + ', ' + f(h2.vn * 3.6) + ' (' + f(h2.vn / h1.vn, 3) + ')' : '-'} | ${later.length ? f(vmax * 3.6) + ' (' + f(vmax / h1.vn, 3) + ')' : '-'} | ${H.length ? f(gain, 3) : '-'} | ${h1 ? pct(h1.dE, q.E0) : '-'}, ${pct(sumL, q.E0)} | ${q.e1 === null ? 'ni končan' : f(q.t1, 3) + ', ' + f(q.e1, 3)} | ${q.back ? f(q.back.t, 3) + ', ' + f(q.back.vn * 3.6) : '-'} | ${q.touchSteps}, ${q.touching ? 'v dotiku' : 'narazen'} | ${f(q.penMax * 100, 1)} (${f(q.penMaxT, 2)}) | ${f(q.dhC * 180 / Math.PI, 1)} / ${f(q.dhV * 180 / Math.PI, 1)} | ${f(q.vC * 3.6, 1)} / ${f(q.vV * 3.6, 1)} | ${f(q.dmg1, 3)} → ${f(q.dmg, 3)} | ${f(q.dT, 3)} / ${f(q.dW, 3)} / ${f(q.dO, 3)}${q.nan ? ' NaN' : ''}${q.offK ? ' VOZILO IZKLJUČENO ' + q.offK + ' korakov' : ''}`);
  if (E.VSE) for (const x of H) console.log(`    sunek ob ${f(x.t, 3)} s: vn ${f(x.vn * 3.6)} km/h, dE ${f(x.dE, 1)} J (${f(x.dEr * 100, 2)} %), dp ${x.dp.toExponential(1)}, prekrivanje ${f(x.pen * 100, 1)} cm, e med težiščema ${f(x.eC, 3)}, zasuk avta ${f(x.w0, 3)} → ${f(x.w, 3)} rad/s, vozila ${f(x.wv, 3)} rad/s`);
}
console.log(`skupaj: ${tot.n} sunkov, od tega ${tot.n1} v prvem dotiku; primerov s ponovnim dotikom: ${tot.back}; primerov z rastjo energije para v sunku: ${tot.gain} (največ ${f(tot.gainMax, 3)} J); primerov z e med težiščema < 0 ob koncu prvega dotika: ${tot.e1neg}; največje prekrivanje po prvem koraku ${f(tot.penMax * 100, 1)} cm; NaN: ${tot.nan}; primerov, kjer je promet vozilo izključil: ${tot.off}`);
