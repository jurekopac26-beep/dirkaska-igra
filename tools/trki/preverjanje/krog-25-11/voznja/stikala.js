// stikala.js (samo veja): ali stikala deb 0 / pull 0 / tf 2, cv 1 in spletni nacin spremenijo voznjo brez dotika (sam avto) in polje do prvega dotika
const { load, SNAP } = require('../fizika/lib.js');
const S = load(SNAP), C = S.C, SIM = S.SIM, E = process.env, SECS = +(E.SECS || 60);
const CFG = { cv6: () => { C.setCrash({ glass: 1 }); C.setTest({ cv: 6 }); }, 'cv6 deb0 pull0 tf2': () => { C.setCrash({ glass: 1 }); C.setTest({ cv: 6, deb: 0, pull: 0, tf: 2 }); },
  'cv6 roll bump ai': () => { C.setCrash({ glass: 1, roll: 1, bump: 1, ai: 1 }); C.setTest({ cv: 6 }); }, cv1: () => { C.setCrash({ glass: 1 }); C.setTest({ cv: 1 }); }, splet: () => { C.setCrash({ net: 1 }); C.setTest({}); } };
const F = ['x', 'z', 'h', 'vx', 'vz', 'w', 'dmg'];
function run(cfg, tid, mid, solo, opts) { CFG[cfg](); Math.random = SIM.seeded(7);
  const r = SIM.makeRace(C, tid, (C2, tt, t) => Object.assign(SIM.SETUPS.race.opts(C2, solo ? true : tt, 'cs', t), mid ? { playerModel: C2.MODELS.find(m => m.id === mid) } : {}, { seed: 9 }, opts || {}));
  const n = Math.round(SECS * 120), tr = new Float64Array(n * r.cars.length * F.length); let p = 0, dmgK = -1;
  for (let K = 0; K < n; K++) { SIM.stepRace(C, r, K); for (const c of r.cars) { for (const f of F) tr[p++] = c[f]; if (dmgK < 0 && c.dmg > 0) dmgK = K; } }
  return { tr, nc: r.cars.length, dmgK }; }
const cmp = (a, b) => { for (let i = 0; i < a.tr.length; i++) if (a.tr[i] !== b.tr[i] && !(a.tr[i] !== a.tr[i] && b.tr[i] !== b.tr[i])) return Math.floor(i / (a.nc * F.length)); return -1; };
const solo = (E.SOLO || 'spa/rally,spa/formula,kotor/truck,koli/rally,koli/formula,seoul/truck,pikesg/levs,killar/kolibri').split(','), field = (E.FIELD || 'spa,kotor,koli').split(','), OP = E.OPTS ? JSON.parse(E.OPTS) : {};
for (const s of solo) { const [tid, mid] = s.split('/'); const base = run('cv6', tid, mid, true, OP); const out = [];
  for (const k of Object.keys(CFG)) if (k !== 'cv6') { const d = cmp(base, run(k, tid, mid, true, OP)); out.push(k + ': ' + (d < 0 ? 'ENAKO' : 'RAZLIKA k=' + d)); }
  console.log('sam ' + s + ' ' + SECS + ' s (prva skoda k=' + base.dmgK + ') | ' + out.join(' | ')); }
for (const tid of field) { const base = run('cv6', tid, '', false, OP); const out = [];
  for (const k of ['cv6 deb0 pull0 tf2']) { const d = cmp(base, run(k, tid, '', false, OP)); out.push(k + ': ' + (d < 0 ? 'ENAKO' : 'RAZLIKA k=' + d)); }
  console.log('polje ' + tid + ' ' + SECS + ' s (prva skoda k=' + base.dmgK + ') | ' + out.join(' | ')); }
