// diag.js: veja proti main, ob prvi razliki izpise vsa skalarna polja avta, ki se razlikujejo (tudi wreck), in korak prej
const { load, SNAP, MAIN } = require('../fizika/lib.js');
const S = load(SNAP), M = load(MAIN), E = process.env;
const CV = +(E.CV || 0), SECS = +(E.SECS || 60), tid = E.TRACK || 'mombasa', OPTS = E.OPTS ? JSON.parse(E.OPTS) : {}, SETUP = E.SETUP || 'race', DRIVE = E.DRIVE === '1';
if (CV) S.C.setTest({ cv: CV }); if (E.NET === '1') { S.C.setCrash({ net: 1 }); S.C.setTest({}); }
const mk = (L) => { Math.random = L.SIM.seeded(7); const SU = L.SIM.SETUPS[SETUP]; return L.SIM.makeRace(L.C, tid, (C, tt, t) => Object.assign(SU.opts(C, tt, 'cs', t), { seed: 9 }, OPTS)); };
const flat = (c) => { const o = {}; for (const k of Object.keys(c)) { const v = c[k]; if (typeof v === 'number' || typeof v === 'boolean') o[k] = v; }
  if (c.wreck) for (const k of Object.keys(c.wreck)) { const v = c.wreck[k]; if (typeof v === 'number' || typeof v === 'boolean') o['wreck.' + k] = v; else if (Array.isArray(v) && v.length <= 8 && v.every(x => typeof x === 'number' || typeof x === 'boolean')) o['wreck.' + k] = v.join(','); }
  return o; };
const dif = (a, b) => { const fa = flat(a), fb = flat(b), r = []; for (const k of new Set(Object.keys(fa).concat(Object.keys(fb)))) if (fa[k] !== fb[k] && !(Number.isNaN(fa[k]) && Number.isNaN(fb[k]))) r.push(k + ' ' + fa[k] + ' / ' + fb[k]); return r; };
const ra = mk(S), rb = mk(M), n = Math.round(SECS / S.SIM.DT); const da = DRIVE ? S.SIM.SETUPS[SETUP].drive : undefined, db = DRIVE ? M.SIM.SETUPS[SETUP].drive : undefined;
const core = ['x', 'z', 'h', 'vx', 'vz', 'w']; let hid = null;
for (let K = 0; K < n; K++) { S.SIM.stepRace(S.C, ra, K, da); M.SIM.stepRace(M.C, rb, K, db);
  for (let i = 0; i < ra.cars.length; i++) { const a = ra.cars[i], b = rb.cars[i];
    if (!hid) { const d = dif(a, b).filter(s => !/^(wreck\.|_)/.test(s) || /wreck\.(dnf|nL|stop)/.test(s)); const d2 = d.filter(s => { const k = s.split(' ')[0]; return k in flat(a) && k in flat(b); }); if (d2.length) { hid = 1; console.log('PRVA SKRITA RAZLIKA k=' + K + ' (' + (K / 120).toFixed(2) + ' s) ' + a.m.id + '#' + i + ' dmg ' + a.dmg + ' / ' + b.dmg + ' :: ' + d2.slice(0, 14).join(' ; ')); } }
    if (core.some(q => a[q] !== b[q])) { console.log('PRVA RAZLIKA STANJA k=' + K + ' (' + (K / 120).toFixed(2) + ' s) ' + a.m.id + '#' + i + ' v ' + a.speed + ' / ' + b.speed + ' dmg ' + a.dmg + ' / ' + b.dmg + ' :: ' + dif(a, b).slice(0, 40).join(' ; ')); process.exit(0); } } }
console.log('ENAKO ' + SECS + ' s');
