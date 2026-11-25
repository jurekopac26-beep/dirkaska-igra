'use strict';
// fizika-2, robni primer: igralec ob štartu NE spelje (brez plina) sredi polja: stara veja cv 6, nova veja cv 6, main
const { SNAP, MAIN, load, loadInst } = require('./lib.js');
const OLD = (process.env.TRKI_SNAP || require('path').join(__dirname, '..', '..', '..', '..', '..')) + '';
const TA = '(o.stuckT > HZ.st && _hzGo.has(o))', TB = '(o.stuckT > HZ.st && (_hzGo.has(o) || !(o.inThr > 0)))';   // (možnost B: še ni speljal, a tudi ni na plinu = obtičan)
const L = [['stara cv6', load(OLD), 6], ['nova cv6', load(SNAP), 6], ['nova+B cv6', loadInst(SNAP, [[TA, TB]]), 6], ['main', load(MAIN), 0]];
for (const [, l, cv] of L) if (cv) l.C.setTest({ cv });
const TRACKS = (process.env.TRACKS || 'spa,cusco,rastro,kotor,hiva,jezero').split(','), SECS = +(process.env.SECS || 8), GRID = +(process.env.GRID || 4);
const stoj = (C, race) => { const P = race.player; P.inSteer = 0; P.inThr = 0; P.inBrk = 0; P.inHand = 0; };
for (const tid of TRACKS) { const out = [];
  for (const [name, l] of L) { Math.random = l.SIM.seeded(7);
    const r = l.SIM.makeRace(l.C, tid, (C, tt, t) => Object.assign(l.SIM.SETUPS.race.opts(C, false, 'cs', t), { playerGrid: GRID }));
    const P = r.player, DT = l.SIM.DT, N = Math.round(SECS / DT); let kHit = -1, kHz = -1, nHit = 0; const seen = new Set(), hit = new Set();
    for (let k = 0; k < N; k++) { l.SIM.stepRace(l.C, r, k, stoj);
      if (P.hitCar > 0) { nHit++; if (kHit < 0) kHit = k; }
      for (const c of r.cars) { if (c.aiHz) { seen.add(c); if (kHz < 0) kHz = k; } if (c !== P && c.hitCar > 0) hit.add(c); } }
    const za = r.cars.filter(c => c !== P && c.speed > 3).length;
    out.push(`${name}: igralec v=${P.speed.toFixed(2)}, dotik igralca ${kHit < 0 ? 'nikoli' : (kHit * DT).toFixed(2) + ' s (' + nHit + ' korakov)'}, tekmecev z dotikom ${hit.size}, oviro videlo ${seen.size}${kHz < 0 ? '' : ' od ' + (kHz * DT).toFixed(2) + ' s'}, tekmecev v vožnji po ${SECS} s ${za}/12`); }
  console.log(tid + '\n  ' + out.join('\n  ')); }
