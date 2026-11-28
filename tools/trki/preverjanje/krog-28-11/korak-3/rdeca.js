'use strict';
// korak 3 (F3), krog 28. 11.: cilj F3 (rdeča zastava in ustavljanje razbitin). Bathurst, kup dveh uničenih tekmecev ob trenutkih 30 ... 110 s
// (17 trenutkov; dirka in kup kot tests/redflag.test.js: run + pileUp(r, 2, 2)), po različicah trkov CVS in različicah retireBlocked (kandidati.js).
// Za vsako: v koliko trenutkih je rdeča zastava v 15 s po nesreči, čas do ustavitve razbitin (wreck.stop), pot, koliko razbitin so prestavili
// redarji (_parkRetired, skok za več kot 1,5 m v koraku), koraki dotika med razbitinama (potiskanje) in med razbitino in drugimi.
// Izpiše povzetek in trenutke, kjer se različice razlikujejo. Jedro je instrumentirano v pomnilniku, drevo ostane nedotaknjeno.
// Zagon: node rdeca.js > rdeca-po.log   (VARS=veja,brez);   TRKI_SNAP=<drevo 26d2b1d> VARS=veja,brez,ctr,gap,pas node rdeca.js > rdeca-pred.log
const { SNAP, loadInst } = require('../../krog-25-11/fizika/lib.js');
const { VARS, wrapCC } = require('./kandidati.js');
const E = process.env, NAMES = (E.VARS || 'veja,brez').split(','), CVS = (E.CVS || '1,6').split(',').map(Number), TID = E.TRACK || 'bathurst';
const ATS = []; for (let a = +(E.A0 || 30); a <= +(E.A1 || 110); a += +(E.AS || 5)) ATS.push(a);
const racing = (c) => !c.isPlayer && !c.finished && !c.inPit && !c.pitWant && !c.pitState && !(c.wreck && c.wreck.dnf) && !(c.fl && c.fl.stopT > 0);
function pileUp(C, r, k, heavy) { const o = r.order.filter(racing); for (let i = 0; i + k <= o.length; i++) { const g = o.slice(i, i + k); if (Math.abs(g[0].dist - g[k - 1].dist) < 40 && g.every(c => c.lap === g[0].lap)) { g.forEach((c, j) => { if (j < heavy) C.wreckCar(c); r.retire(c); }); return g; } } return null; }
function one(L, cv, at) {
  const C = L.C, DT = L.SIM.DT, seeded = L.SIM.seeded;
  C.setTest({ cv });
  Math.random = seeded(3);
  const T = new C.Track(C.TRACKS.find(d => d.id === TID));
  const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 8, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, flags: true, damage: 2 });
  r.start();
  const P = r.player; let t = 0, k = 0, ev = 0, hooked = null, out = null, red = null, W = null, cc = 0, co = 0;
  globalThis.__ev = (a, b) => { if (!out) return; const ia = out.includes(a), ib = out.includes(b); if (ia && ib) cc++; else if (ia || ib) co++; };
  while (t < at + 60) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); if (P.stuckT > 3) r.rescue(P);
    if (hooked == null && t >= at) { const g = pileUp(C, r, 2, 2); if (g) { hooked = t; out = g; W = g.map(c => ({ c, x: c.x, z: c.z, path: 0, stop: -1, park: false })); } }
    r.step(DT); t += DT;
    const F = r.fl; if (F && F.ev !== ev) { ev = F.ev; if (F.evK === 'red' && red == null && hooked != null) red = t; }
    if (W) {
      for (const w of W) { const j = Math.hypot(w.c.x - w.x, w.c.z - w.z); if (w.stop < 0) { if (j < 1.5) w.path += j; else w.park = true; } w.x = w.c.x; w.z = w.c.z; if (w.stop < 0 && w.c.wreck.stop) w.stop = t - hooked; }
      if (t > hooked + 31 || (W.every(w => w.stop >= 0) && (red != null || t > hooked + 16))) break;
    }
  }
  globalThis.__ev = null;
  return { at, red: red == null ? -1 : red - hooked, W: W ? W.map(w => ({ id: w.c.m.id, stop: w.stop, path: w.path, park: w.park })) : [], cc, co };
}
const LS = NAMES.map(n => loadInst(SNAP, [wrapCC, ...VARS[n]]));
for (const cv of CVS) {
  const R = LS.map(L => ATS.map(at => one(L, cv, at)));
  console.log('cv ' + cv + ' ' + TID + ', trenutki ' + ATS.join(' '));
  R.forEach((rs, i) => {
    const ws = rs.flatMap(x => x.W), st = ws.filter(w => w.stop >= 0), reds = rs.filter(x => x.red >= 0);
    const avg = (a) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN;
    console.log('   ' + NAMES[i].padEnd(5) + 'rdeca v 15 s: ' + rs.filter(x => x.red >= 0 && x.red < 15).length + ' od ' + rs.length + ' (sploh ' + reds.length + '), povp. ' + avg(reds.map(x => x.red)).toFixed(1) + ' s, najv. ' + Math.max(...reds.map(x => x.red)).toFixed(1) + ' s | ustavitev povp. ' + avg(st.map(w => w.stop)).toFixed(1) + ' s, najv. ' + Math.max(...st.map(w => w.stop)).toFixed(1) + ' s, neustavljenih ' + (ws.length - st.length) + ', prestavljenih ' + ws.filter(w => w.park).length + ' | pot povp. ' + avg(ws.map(w => w.path)).toFixed(0) + ' m, najv. ' + Math.max(...ws.map(w => w.path)).toFixed(0) + ' m | koraki dotika med razbitinama ' + rs.reduce((s, x) => s + x.cc, 0) + ', razbitina-drugi ' + rs.reduce((s, x) => s + x.co, 0));
  });
  ATS.forEach((at, j) => { const js = R.map(rs => JSON.stringify(rs[j])); if (js.every(s => s === js[0])) return;
    console.log('   t=' + at + ':'); R.forEach((rs, i) => { const x = rs[j]; console.log('      ' + NAMES[i].padEnd(5) + (i && js[i] === js[0] ? '= ' + NAMES[0] : 'rdeca ' + (x.red < 0 ? '-' : x.red.toFixed(1)) + ' s | ' + x.W.map(w => w.id + ' ustavi ' + (w.stop < 0 ? '>31' : w.stop.toFixed(1)) + ' s, ' + w.path.toFixed(0) + ' m' + (w.park ? ' (prestavljen)' : '')).join('; ') + ' | dotiki ' + x.cc + '/' + x.co)); }); });
}
