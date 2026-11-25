// promet.js: dvoboj na odprti cesti s prometom (opts.traffic): veja cv 6 (Trk s prometom privzeto / 1 / 2) in cv 1 proti main; kdaj se prvic razlikuje
const { SNAP, MAIN, load } = require('../fizika/lib.js');
const S = load(SNAP), M = load(MAIN), E = process.env, SECS = +(E.SECS || 40);
const TRACKS = (E.TRACKS || 'cusco,vaoala,seoul,mombasa').split(','), OPTS = E.OPTS ? JSON.parse(E.OPTS) : {};
const mk = (L, tid) => { Math.random = L.SIM.seeded(7); const SU = L.SIM.SETUPS.race;
  return L.SIM.makeRace(L.C, tid, (C, tt, t) => Object.assign(SU.opts(C, tt, 'cs', t), { numAI: 1, playerGrid: 2, seed: 9, traffic: 1 }, OPTS)); };
const num = (o) => Object.keys(o).filter(k => typeof o[k] === 'number').sort().map(k => o[k]);
function run(L, tid, test) {
  if (test) { L.C.setCrash({}); L.C.setTest(test); }
  const r = mk(L, tid), n = Math.round(SECS / L.SIM.DT), tr = [], near = [];
  for (let k = 0; k < n; k++) { L.SIM.stepRace(L.C, r, k);
    tr.push(JSON.stringify([r.cars.map(c => [c.x, c.z, c.h, c.vx, c.vz, c.w, c.dmg]), r.tf ? r.tf.veh.map(num) : []]));
    let d = 1e9; if (r.tf) for (const c of r.cars) for (const v of r.tf.veh) if (typeof v.x === 'number' && !v.off) d = Math.min(d, Math.hypot(c.x - v.x, c.z - v.z)); near.push(d); }
  return { tr, near, nveh: r.tf ? r.tf.veh.length : -1, keys: r.tf && r.tf.veh[0] ? Object.keys(r.tf.veh[0]).slice(0, 12).join(',') : '' };
}
const diff = (a, b) => { for (let k = 0; k < a.tr.length; k++) if (a.tr[k] !== b.tr[k]) return k; return -1; };
for (const tid of TRACKS) {
  const m = run(M, tid, null), b6 = run(S, tid, { cv: 6 }), t1 = run(S, tid, { cv: 6, tf: 1 }), t2 = run(S, tid, { cv: 6, tf: 2 }), b1 = run(S, tid, { cv: 1 }), b1t = run(S, tid, { cv: 1, tf: 2 });
  let mn = 1e9, mk0 = -1; b6.near.forEach((d, k) => { if (d < mn) { mn = d; mk0 = k; } });
  const f = (x, y) => { const k = diff(x, y); return k < 0 ? 'ENAKO' : 'razlika k=' + k + ' (najblizje vozilo ' + y.near[k].toFixed(2) + ' m)'; };
  console.log(tid + ' ' + SECS + ' s vozil veja ' + b6.nveh + ' main ' + m.nveh + ' | najblizje vozilo v teku cv6 ' + mn.toFixed(2) + ' m pri k=' + mk0 + ' | cv6:main ' + f(b6, m) + ' | cv6 tf1:cv6 ' + f(t1, b6) + ' | cv6 tf2:cv6 ' + f(t2, b6) + ' | cv1:main ' + f(b1, m) + ' | cv1 tf2:cv1 ' + f(b1t, b1));
  if (tid === TRACKS[0]) console.log('  polja vozila: ' + b6.keys);
}
