// NALOGA A: kolesa, ki jih namestijo redarji (Race.rescue, wreck.fix): stanje fizike in risanja pred namestitvijo in po njej.
'use strict';
const ROOT = process.env.TRKI_SNAP || require('path').join(__dirname, '..', '..', '..', '..', '..');
const { loadCore } = require(ROOT + '/tests/lib/core.js');
const { DT, seeded } = require(ROOT + '/tests/lib/sim.js');
const CV = +(process.argv[2] || 6);
const C = loadCore(); C.setTest({ cv: CV });
const H = require(ROOT + '/tests/lib/handling.js')(C);
const D = 180 / Math.PI, f = (v, d = 2) => v == null || !Number.isFinite(v) ? String(v) : v.toFixed(d);
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const bendOf = (cd) => cd.map(x => Math.round(sstep(0.35, 0.7, x) * 20) / 20);   // (render.js wheelBend: what is drawn)
const st = (c) => ({ dmg: +f(c.dmg, 3), cd: c.cd.map(x => +f(x, 3)), narisano: bendOf(c.cd), wl: c.wreck && c.wreck.wl, nL: c.wreck && c.wreck.nL, fix: c.wreck && c.wreck.fix, hold: c.wreck && +f(c.wreck.hold, 2), dnf: c.wreck && c.wreck.dnf,
  lostW: Object.keys(c.lost).filter(n => /^wheel/.test(n)).join(','), v: +f(c.speed, 1) });

function race(tid, model, opts) {
  const T = new C.Track(C.TRACKS.find(d => d.id === tid)); Math.random = seeded(21);
  const r = new C.Race(T, Object.assign({ numAI: 4, playerGrid: 5, laps: 2, playerModel: C.MODELS.find(m => m.id === model), assist: 2, seed: 21, difficulty: 1, damage: 2 }, opts));
  r.start(); let k = 0; r._run = (sec, drive) => { for (let i = 0; i < sec / DT; i++) { Math.random = seeded(21000 + ++k); if (drive) drive(); else if (!r.isOut(r.player)) C.aiControl(r.player, r, DT); r.step(DT); } };
  return r;
}
// knocks on the front right corner until its wheel comes off by the game's own rule (applyDamage)
function knockFR(c, max) { let n = 0; while (!(c.wreck && c.wreck.nL) && n < (max || 200)) { C.applyDamage(c, 0.04, c.m.len * 0.5, c.m.wid * 0.5); n++; } return n; }

console.log('== cv ' + CV + ' (' + C.KV_IDS[C.TX.cv] + ')');
for (const tid of ['sacalobra', 'spa']) {
  const T = C.TRACKS.find(d => d.id === tid);
  console.log(`\n-- ${tid} (boksi: ${T.pit ? 'da' : 'ne'}), igralec BREZ pravila kolesa (vožnja na čas, kvalifikacije, »Dirka teče naprej«), škoda Vklop`);
  const r = race(tid, 'jelen', {}); const P = r.player, A = r.cars.find(c => !c.isPlayer && c.wreck);
  r._run(10);
  const nP = knockFR(P), nA = knockFR(A);
  console.log('igralec, kolo odpade po ' + nP + ' udarcih v sprednji desni vogal:', JSON.stringify(st(P)));
  console.log('tekmec ' + A.m.id + ', po ' + nA + ' udarcih:', JSON.stringify(st(A)));
  r._run(1.0); console.log('tekmec +1,0 s:', JSON.stringify(st(A)));
  r._run(1.0); console.log('tekmec +2,0 s:', JSON.stringify(st(A)));
  r.rescue(P); console.log('igralec po gumbu (rescue):', JSON.stringify(st(P)), 'xd', JSON.stringify(P.xd || null));
  r._run(5); console.log('+5 s: igralec', JSON.stringify(st(P)), 'tekmec', JSON.stringify(st(A)));
  r._run(6); console.log('+11 s: igralec', JSON.stringify(st(P)), 'tekmec', JSON.stringify(st(A)));
  if (T.pit) continue;
  r.repairCar(P); console.log('po polnem popravilu (repairCar):', JSON.stringify(st(P)));
}

// the wheel rule's car in a race: no refit, the race over
{
  console.log('\n-- sacalobra, igralec S pravilom kolesa (dirka, privzeto »Konec dirke«)');
  const r = race('sacalobra', 'jelen', { wheelRule: C.MODELS.map(m => m.id) }); const P = r.player; r._run(10);
  console.log('pravilo:', JSON.stringify(P.wreck.rule));
  let n = 0; while (!P.wreck.nL && n < 200) { C.applyDamage(P, 0.04, P.m.len * 0.5, P.m.wid * 0.5); n++; }
  console.log('kolo odpade po ' + n + ' udarcih:', JSON.stringify(st(P)), 'rule', JSON.stringify(P.wreck.rule));
  r.rescue(P); console.log('po rescue:', JSON.stringify(st(P)));
  r._run(6); console.log('+6 s:', JSON.stringify(st(P)), 'rule', JSON.stringify(P.wreck.rule), 'isOut', r.isOut(P), 'state', r.state);
  r.rescue(P); r._run(8); console.log('rescue še enkrat, +8 s:', JSON.stringify(st(P)), 'rule', JSON.stringify(P.wreck.rule));
}

// the plane: the same car healthy, with the bent corner and the wheel on (as the marshals leave it), and with the wheel off
function plane(model, cd, dmg, off, mode) {
  const mk = (v) => { const A = H.mkCar(model, { v }); A.dmgMode = mode == null ? 2 : mode; if (cd) { A.cd = cd.slice(); A.dmg = dmg; } if (off) C.detachPart(A, 'wheelFR'); return A; };
  // straight for 2 s at 80 km/h, the wheel held straight: the turn (deg), the shake (deg/s), the speed held
  let A = mk(80), h0 = A.h, hp = A.h, t = 0; const rs = [];
  while (t < 2) { H.step(A, { thr: 'hold', st: 0 }); t += DT; const w = (A.h - hp) / DT * D; hp = A.h; if (t > 1) rs.push(w); }
  const n = rs.length, xm = (n - 1) / 2, m = rs.reduce((a, x) => a + x, 0) / n, sl = rs.reduce((a, x, i) => a + (i - xm) * (x - m), 0) / rs.reduce((a, x, i) => a + (i - xm) * (i - xm), 0);
  const o = { zavoj: (A.h - h0) * D, tresenje: rs.reduce((a, x, i) => Math.max(a, Math.abs(x - m - sl * (i - xm))), 0), v2: A._v * 3.6 };
  // a steady turn, half lock, 80 km/h, 4 s: the yaw rate of the last second (deg/s), left and right
  for (const s of [-0.5, 0.5]) { A = mk(80); let w = 0, k = 0; for (let i = 0; i < 4 / DT; i++) { H.step(A, { thr: 'hold', st: s }); if (i >= 3 / DT) { w += A._om * D; k++; } } o[s < 0 ? 'levo' : 'desno'] = w / k; o[s < 0 ? 'vL' : 'vD'] = A._v * 3.6; }
  // braking from 100 km/h: the distance
  A = mk(100); let x0 = A.x, tb = 0; while (A._v > 0.3 && tb < 15) { H.step(A, { thr: 0, brk: 1 }); tb += DT; } o.zav = Math.hypot(A.x - x0, A.z); o.zavT = tb; o.zavZ = A.z;
  // top speed after 20 s flat out from 80 km/h
  A = mk(80); for (let i = 0; i < 20 / DT; i++) H.step(A, { thr: 1, st: 0 }); o.vmax = A._v * 3.6;
  return o;
}
console.log('\n-- ravnina (tests/lib/handling.js), jelen, škoda Vklop: zdrav / zvit sprednji desni vogal s kolesom (stanje po redarjih) / isti vogal brez kolesa (po pestu)');
{
  const r = race('sacalobra', 'jelen', {}); const P = r.player; r._run(10); knockFR(P); const cd = P.cd.slice(), dmg = P.dmg;
  const rows = [['zdrav', plane('jelen', null, 0, false)], ['po redarjih (cd ' + cd.map(x => f(x, 2)).join('/') + ', kolo nameščeno)', plane('jelen', cd, dmg, false)], ['brez kolesa (isti cd)', plane('jelen', cd, dmg, true)],
    ['po redarjih, Samo videz', plane('jelen', cd, dmg, false, 1)], ['zadnje desno zvito (cd 0/0/0/0.8)', plane('jelen', [0, 0, 0, 0.8], 0.5, false)]];
  for (const [n, o] of rows) console.log(n.padEnd(52), `zavoj v 2 s ${f(o.zavoj, 2)}°, tresenje ${f(o.tresenje, 3)}°/s, hitrost ${f(o.v2, 1)} km/h | krog levo ${f(o.levo, 1)}°/s (${f(o.vL, 0)} km/h), desno ${f(o.desno, 1)}°/s (${f(o.vD, 0)} km/h) | zaviranje 100-0: ${f(o.zav, 1)} m, ${f(o.zavT, 2)} s, odmik ${f(o.zavZ, 2)} m | 20 s polni plin: ${f(o.vmax, 0)} km/h`);
}
