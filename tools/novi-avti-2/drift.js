// Drift points of a vehicle as the driving school's Drift lesson counts them (js/game.js schoolRef / driftTick): 40 s from the grid on the
// autopilot, no rivals, dry, stock car, standard set-up, points for the slip angle times the speed, a chain banked when the slide ends,
// lost at a knock. The lesson itself is at the Jezero Ring; the same run on other tracks compares cars there (docs/novi-avti-2.md).
//   node tools/novi-avti-2/drift.js [--proge jezero,spa,bathurst] [--t 40] sakal skorpijon kaze …
//   --mer: also the fleet test's measurements (tests/fleet.test.js: 0-100, top speed, steady lateral g at 100 km/h, 100-0) against the
//   category's envelope and the car's own expect
//   --set 'csp.tv=1.3,phys.kw=480,arc.amax=1.8': try other values on the listed cars without editing their files (tuning)
'use strict';
const fs = require('fs');
const path = require('path');
const { loadCore, ROOT } = require('../../tests/lib/core.js');
const { seeded } = require('../../tests/lib/sim.js');

const args = process.argv.slice(2), flag = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : d; };
const TRACKS = flag('--proge', 'jezero,spa,bathurst').split(','), T_RUN = +flag('--t', '40');
const SET = flag('--set', ''), MER = args.includes('--mer'), ids = args.filter(a => !a.startsWith('--'));
// the category envelopes of tests/fleet.test.js (ENVELOPE), read from the test so they stay the same
const ENV = (() => { const t = fs.readFileSync(path.join(ROOT, 'tests', 'fleet.test.js'), 'utf8'), o = {};
  for (const m of t.matchAll(/^\s+(\w+): \{ t100: \[([\d.]+), ([\d.]+)\], vmax: \[([\d.]+), ([\d.]+)\], latG: \[([\d.]+), ([\d.]+)\], d100: \[([\d.]+), ([\d.]+)\] \}/gm))
    o[m[1]] = { t100: [+m[2], +m[3]], vmax: [+m[4], +m[5]], latG: [+m[6], +m[7]], d100: [+m[8], +m[9]] };
  return o; })();

const C = loadCore();

const STEP = 1 / 120;   // (Core's own step: the lesson's reference uses the game's STEP)
function driftRun(id, tid) {
  const M = C.MODELS.find(m => m.id === id); if (!M) throw new Error('no vehicle ' + id);
  const T = new C.Track(C.TRACKS.find(d => d.id === tid));
  const upg = {}; for (const u of C.UPG) upg[u.id] = 0;
  const orig = Math.random; Math.random = seeded(1);
  try {
    const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 99, playerModel: M, playerUpg: upg, playerSetup: { wing: 1, gear: 1 }, playerColor: 0xd81f2a, playerNum: 7,
      seed: 1, difficulty: 1, assist: 2, damage: 0, phys: 'cs', rain: 0, launch: false });
    const P = r.player, D = { pts: 0, chain: 0, calm: 0, best: 0, lost: 0 }; let t = 0, bMax = 0, vSum = 0, n = 0, slide = 0;
    r.start();
    while (t < T_RUN) {
      C.aiControl(P, r, STEP); r.step(STEP); t += STEP;
      // driftTick (js/game.js)
      if (P.hitWall > 3 || P.hitCar > 3) { if (D.chain > 0) D.lost++; D.chain = 0; D.calm = 0; }
      else { const b = Math.abs(P.beta || 0), v = P.speed;
        if (b > 0.2 && v > 8 && !P.air) { D.chain += v * b * STEP * 10; D.calm = 0; slide += STEP; }
        else if (D.chain > 0 && (D.calm += STEP) > 0.6) { D.pts += D.chain; D.best = Math.max(D.best, D.chain); D.chain = 0; D.calm = 0; } }
      P.hitWall = P.hitCar = 0;
      bMax = Math.max(bMax, Math.abs(P.beta || 0)); vSum += P.speed; n++;
    }
    return { pts: Math.round(D.pts + D.chain), slide: +slide.toFixed(1), bMax: +(bMax * 57.3).toFixed(0), v: Math.round(vSum / n * 3.6), s: Math.round(P.q.s), lost: D.lost };
  } finally { Math.random = orig; }
}

// --set: phys.<k> on the model itself, arc.<k> / csp.<k> in Core's tables (what the vehicle's file would give)
function applySet(id) {
  if (!SET) return; const M = C.MODELS.find(m => m.id === id);
  for (const kv of SET.split(',')) { const [k, v] = kv.split('='), [grp, key] = k.split('.'), val = /^\[/.test(v) ? JSON.parse(v) : +v;
    if (grp === 'phys') M[key] = val; else if (grp === 'arc') C.ARC[id][key] = val; else if (grp === 'csp') C.CSP[id][key] = val; else throw new Error('--set ' + k); }
}

let H = null;
function measure(id) {   // as tests/fleet.test.js: MEAS
  if (!H) H = require('../../tests/lib/handling.js')(C);
  const M = C.MODELS.find(m => m.id === id), lo = H.longi(id), st = H.steady(id, 100, 1.0), m = { t100: lo.t100, vmax: H.topOf(id, 90)._v * 3.6, latG: st.ay, d100: lo.d100 };
  const E = ENV[M.cat], X = M.def && M.def.expect, f = { t100: 2, vmax: 0, latG: 2, d100: 1 };
  return Object.keys(f).map(k => { const v = m[k], inE = !E || (v >= E[k][0] && v <= E[k][1]), inX = !X || !X[k] || (v >= X[k][0] && v <= X[k][1]);
    return `${k} ${v.toFixed(f[k])}${inE ? '' : ' ZUNAJ ' + M.cat + ' ' + E[k].join('-')}${inX ? '' : ' (expect ' + X[k].join('-') + ')'}`; }).join(', ') + `, ${Math.round(M.kw * 1000 / M.mass)} W/kg`;
}

const rows = [];
for (const id of ids.length ? ids : ['sakal', 'skorpijon', 'kaze']) {
  if (!C.MODELS.find(m => m.id === id)) { console.log(id + ': not in this Core (a vehicle of another branch?)'); continue; }
  applySet(id);
  const r = { id }; for (const tid of TRACKS) r[tid] = driftRun(id, tid); rows.push(r);
  if (MER) console.log(id.padEnd(12) + measure(id));
  console.log(id.padEnd(12) + TRACKS.map(tid => `${tid} ${String(r[tid].pts).padStart(5)} (drsi ${r[tid].slide} s, kot do ${r[tid].bMax}°, ${r[tid].v} km/h, ${r[tid].s} m${r[tid].lost ? ', izgubljenih ' + r[tid].lost : ''})`).join(' · '));
}
