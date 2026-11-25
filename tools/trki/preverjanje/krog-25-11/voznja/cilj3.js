// cilj3.js: cusco seme 3, cv 1 skoda 0: vrstni red cilja veje in main ob koraku razlike in na koncu
const { load, SNAP, MAIN } = require('../fizika/lib.js');
const S = load(SNAP), M = load(MAIN), E = process.env, tid = E.TRACK || 'cusco', seed = +(E.SEED || 3), CV = +(E.CV || 1);
S.C.setTest({ cv: CV });
const mk = (L) => { Math.random = L.SIM.seeded(7); return L.SIM.makeRace(L.C, tid, (C, tt, t) => Object.assign(L.SIM.SETUPS.race.opts(C, tt, 'cs', t), { seed }, { damage: 0 })); };
const ra = mk(S), rb = mk(M); const fo = (r) => r.finishOrder.map(c => r.cars.indexOf(c) + ':' + c.m.id + ' pos ' + c.finishPos + ' t ' + c.finishTime.toFixed(4)).join(' | '); let said = 0;
const core = ['x', 'z', 'h', 'vx', 'vz', 'w'];
for (let K = 0; K < 120 * 120; K++) { S.SIM.stepRace(S.C, ra, K); M.SIM.stepRace(M.C, rb, K);
  if (!said) for (let i = 0; i < ra.cars.length; i++) { const a = ra.cars[i], b = rb.cars[i]; if (a.finishPos !== b.finishPos || core.some(q => a[q] !== b[q])) { said = 1; console.log('k=' + K + ' (' + (K / 120).toFixed(2) + ' s) ' + a.m.id + '#' + i + ' finishPos ' + a.finishPos + ' / ' + b.finishPos + ' stanje enako: ' + !core.some(q => a[q] !== b[q]) + '\n veja zadnji trije: ' + fo(ra).split(' | ').slice(-3).join(' | ') + '\n main zadnji trije: ' + fo(rb).split(' | ').slice(-3).join(' | ')); break; } }
  if (ra.cars.every(c => c.finished) && rb.cars.every(c => c.finished)) break; }
const pos = (r) => r.cars.map(c => c.finishPos).join(',');
console.log('konec: finishPos po avtih veja ' + pos(ra) + '\n                          main ' + pos(rb) + '\n igralec (avto ' + ra.cars.indexOf(ra.player) + ') mesto veja ' + ra.player.finishPos + ' main ' + rb.player.finishPos + ' | poti enake na koncu: ' + ra.cars.every((a, i) => core.every(q => a[q] === rb.cars[i][q])));
