// Trki: odpadli deli v stranskih cestah (K3, ostanek). MEASURING ONLY: nothing here changes the game; the game's own code is run (a Race
// stepped by Race.step), so the same script measures any tree: GAME_ROOT=<tree> picks the game, the harness is this tree's.
//   node tools/trki/odpadli-stranske.js                     every track with side roads (Track.stubs), one row each
//   node tools/trki/odpadli-stranske.js --proge katu,koli   those only;  --json  the rows as JSON (before | after: diff the two)
//   --del wheelFL  another part;  --v 18,40,60  other speeds (m/s);  --brez-kontrole  without the control throws
// Per track a bonnet is thrown from every 12 m of each side road's line that lies inside its limits, 18 and 40 m/s, eight ways, 2 s
// (tests/odpadli-deli.test.js, check 46). Per step and piece, with the side road found by this script's own search over ALL side roads
// (not the road's samples' lists, Track.stubNear):
//   izgub    times a point went from a side road (q.k >= 0) to the road (q.k -1) over 5 m beyond the road's barrier
//            (cona: of those, in a roundabout's zone, where Track.query gives no side road by design, def.barrier; rob: of those, outside
//            every side road's own limits: a piece that left its corridor sideways, not one lying in it)
//   duh      steps a piece is the road's (q.k -1), over 1 m beyond the road's barrier, while it lies inside a side road's own limits
//   visina   in those steps, on the ground: the most the piece's ground (Track.yAt) is off that side road's own height (m)
//   odboj    in those steps: the road's barrier turned or moved the piece (Track.wall > 0)
//   skok     the longest move of a piece in a step beyond its speed x the step (m)
//   konec    a digest of every piece's final state (x, y, z, vx, vz): before | after a change
// kontrola: a bonnet, a bumper, a wheel and a mirror thrown from a donor on the ROAD every 40 samples at 120 km/h, 6 s: the digest of the
// final states (pieces that are not thrown from inside a side road: to the last digit the same before and after)
'use strict';
const path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const { loadCore } = require(path.join(ROOT, 'tests', 'lib', 'core.js'));
const SIM = require(path.join(ROOT, 'tests', 'lib', 'sim.js'));
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const C = loadCore(), DT = 1 / 120, SEED = 20261120, MD = C.MODELS.find(m => m.id === 'sokol'), PT = C.partsOf(MD);
const f = (x, k) => x == null || !Number.isFinite(x) ? '-' : x.toFixed(k == null ? 2 : k);
const PART = opt('--del', 'hood'), VS = opt('--v', '18,40').split(',').map(Number);
const ONLY = opt('--proge') ? opt('--proge').split(',') : null;
const defs = C.TRACKS.filter(d => d.sideRoads && d.sideRoads.length && d.open && (!ONLY || ONLY.includes(d.id)));

function lone(T) {
  Math.random = SIM.seeded(SEED);
  const race = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 99, playerModel: MD, assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' }); race.start();
  return race;
}
// the side road a point lies in (inside its limits across and before its rail), by a search over every one; -1 none. o: t, u, y
const _sp = { S: null, j: -1 };
function inStub(T, x, z, o) {
  for (let k = 0; k < T.stubs.length; k++) { const S = T.stubs[k], b = S.bb; if (x < b[0] || x > b[2] || z < b[1] || z > b[3]) continue;
    _sp.S = null; if (!T._stubProj(S, x, z, _sp)) continue; const t = _sp.t;
    if (t < S.tb || t > S.L - 0.5 || Math.abs(_sp.u) > T.stubHw(S, t, _sp.u) + S.lim) continue;
    o.k = k; o.t = t; o.u = _sp.u; o.y = S.Y[_sp.j] + (S.Y[_sp.j + 1] - S.Y[_sp.j]) * _sp.f; o.deep = t >= S.tF; return k; }
  return -1;
}
const digest = (S) => { const h = crypto.createHash('sha1'); for (const s of S) { const d = s.d || s; h.update([d.x, d.y, d.z, d.vx, d.vz].join(',') + ';'); } return h.digest('hex').slice(0, 12); };

function side(def) {
  const orig = Math.random; try {
  const T = new C.Track(def), race = lone(T), P = race.player, Pt = PT[PART], S = [], _w = [], o = {};
  const R = { proga: def.id, cest: T.stubs.length, zamrznjena: !!(def.test || def.pending), kosov: 0, izgub: 0, duh: 0, duhCona: 0, izgubCona: 0, izgubRob: 0, duhKosov: 0, visina: 0, visinaKje: '', odboj: 0, skok: 0, konec: '' };
  let id = 0;
  for (let k = 0; k < T.stubs.length; k++) { const St = T.stubs[k];
    for (let j = 0; j < St.x.length; j += 6) { const q0 = T.query(St.x[j], St.z[j], -1, {}); if (T.wall(q0, Pt.r * 0.5, _w) > 0) continue;
      for (const v of VS) for (let a = 0; a < 8; a++) { const h = a * Math.PI / 4 + 0.2;
        S.push({ k, j, v, a, ghost: 0, d: { id: ++id, car: -1, part: PART, wh: PART.startsWith('wheel') ? 1 : 0, x: St.x[j], z: St.z[j], y: T.yAt(q0) + 0.6, vx: Math.cos(h) * v, vz: Math.sin(h) * v, vy: 2, yaw: 0, rx: 0, rz: 0, wx: 0, wy: 0, wz: 0, r: Pt.r, m: Pt.m, h: Pt.h, rest: false, ground: false, q: null, dead: false } }); } } }
  R.kosov = S.length;
  for (let b = 0; b < S.length; b += 2000) { const B = S.slice(b, b + 2000); race.debris.length = 0; for (const s of B) race.debris.push(s.d);
    for (let n = 0; n < 240; n++) {
      for (const s of B) { const d = s.d; s.x = d.x; s.z = d.z; s.sp = Math.hypot(d.vx, d.vz); s.k0 = d.q ? d.q.k : -1; s.rest = d.rest; }
      P.inThr = 0; P.inBrk = 1; race.step(DT);
      for (const s of B) { const d = s.d, q = d.q; if (s.rest) continue;
        const mv = Math.hypot(d.x - s.x, d.z - s.z) - s.sp * DT, out = Math.abs(q.d) - (q.d > 0 ? q.br : q.bl); if (mv > R.skok) R.skok = mv;
        if (s.k0 >= 0 && q.k < 0 && out > 5) { R.izgub++; if (T.def.barrier && T.inZone(d.x, d.z)) R.izgubCona++; else if (inStub(T, d.x, d.z, o) < 0) R.izgubRob++; }
        if (q.k < 0 && out > 1 && inStub(T, d.x, d.z, o) >= 0) { R.duh++; s.ghost++; if (T.def.barrier && T.inZone(d.x, d.z)) R.duhCona++;
          if (T.wall(q, d.r * 0.5, _w) > 0) R.odboj++;
          if (d.ground) { const e = Math.abs(T.yAt(q) - o.y); if (e > R.visina) { R.visina = e; R.visinaKje = `cesta ${o.k}, ${f(o.t, 0)} m, iz ceste ${s.k}`; } } } } } }
  R.duhKosov = S.filter(s => s.ghost).length; R.konec = digest(S);
  return R;
  } finally { Math.random = orig; }
}
function control(def) {
  const orig = Math.random; try {
  const T = new C.Track(def), race = lone(T), P = race.player, rnd = SIM.seeded(SEED + 1), all = [];
  for (let i0 = 20; i0 < T.N - 20; i0 += 40) { const D = new C.Car(MD, { phys: 'cs' }), h = T.hd[i0], v = 120 / 3.6; D.place(T.px[i0], T.pz[i0], h); if (T.hasElev) { D.y = D.py = T.hy[i0]; D.roadY = D.y; }
    D.vx = Math.cos(h) * v; D.vz = Math.sin(h) * v; D.q = T.query(D.x, D.z, i0, {});
    race.debris.length = 0; for (const p of ['hood', 'bumperF', 'wheelFL', 'mirrorL']) if (PT[p]) { race.spawnDebris(D, p, rnd); const d = race.debris[race.debris.length - 1]; d.by = null; d.byT = 0; all.push(d); }
    for (let n = 0; n < 720; n++) { P.inThr = 0; P.inBrk = 1; race.step(DT); } }
  return { kosov: all.length, konec: digest(all) };
  } finally { Math.random = orig; }
}

const rows = [];
for (const def of defs) { const r = side(def); if (!args.includes('--brez-kontrole')) r.kontrola = control(def); rows.push(r); }
if (args.includes('--json')) { console.log(JSON.stringify(rows, null, 1)); process.exit(0); }
console.log('proga          cest  kosov  izgub (cona/rob)    duh (cona) (kosov)  visina m  odboj   skok m  konec         kontrola');
for (const r of rows) console.log(`${(r.proga + (r.zamrznjena ? '*' : '')).padEnd(14)} ${String(r.cest).padStart(4)} ${String(r.kosov).padStart(6)} ${String(r.izgub).padStart(6)} ${('(' + r.izgubCona + '/' + r.izgubRob + ')').padStart(10)} ${String(r.duh).padStart(6)} ${('(' + r.duhCona + ')').padStart(6)} ${('(' + r.duhKosov + ')').padStart(7)} ${f(r.visina).padStart(9)} ${String(r.odboj).padStart(6)} ${f(r.skok).padStart(8)}  ${r.konec}  ${r.kontrola ? r.kontrola.kosov + ' ' + r.kontrola.konec : ''}` + (r.visina > 0.05 ? `   (${r.visinaKje})` : ''));
console.log('* zamrznjena ali v odločanju (samo brana)');
