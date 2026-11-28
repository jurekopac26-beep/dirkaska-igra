// cusco.js: dvoboj s prometom, cv 1, skoda vklop: koraki okoli prvega dotika zidu (k=1767) v veji in main
const { SNAP, MAIN, load } = require('../fizika/lib.js');
const S = load(SNAP), M = load(MAIN);
S.C.setTest({ cv: 1 });
const mk = (L) => { Math.random = L.SIM.seeded(7); const SU = L.SIM.SETUPS.race;
  return L.SIM.makeRace(L.C, 'cusco', (C, tt, t) => Object.assign(SU.opts(C, tt, 'cs', t), { numAI: 1, playerGrid: 2, seed: 9, traffic: 1 })); };
const ra = mk(S), rb = mk(M);
const debN = (r) => { for (const k of Object.keys(r)) if (/deb/i.test(k) && r[k] && typeof r[k].length === 'number') return k + ':' + r[k].length; for (const k of Object.keys(r)) if (/deb/i.test(k) && r[k] && r[k].list) return k + '.list:' + r[k].list.length; return '?'; };
const f = (c) => 'v ' + Math.hypot(c.vx, c.vz).toFixed(4) + ' dmg ' + (c.dmg || 0).toFixed(5) + ' hitWall ' + (c.hitWall || 0).toFixed(3) + ' hitDebris ' + (c.hitDebris || 0).toFixed(3);
for (let k = 0; k < 1772; k++) { S.SIM.stepRace(S.C, ra, k); M.SIM.stepRace(M.C, rb, k);
  if (k >= 1764) console.log('k=' + k + ' veja ' + f(ra.cars[1]) + ' deli ' + debN(ra) + ' | main ' + f(rb.cars[1]) + ' deli ' + debN(rb)); }
