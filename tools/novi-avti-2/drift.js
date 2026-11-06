// Drift points of a vehicle as the driving school's Drift lesson counts them (js/game.js schoolRef / driftTick): 40 s from the grid on the
// autopilot, no rivals, dry, stock car, standard set-up, points for the slip angle times the speed, a chain banked when the slide ends,
// lost at a knock. The lesson itself is at the Jezero Ring; the same run on other tracks compares cars there (docs/novi-avti-2.md).
//   node tools/novi-avti-2/drift.js [--proge jezero,spa,bathurst] [--t 40] [--proto] sakal skorpijon kaze …
//   --proto: the prototypes of tools/novi-avti-2/prototipi.js too (their physics are stubs: only to check the tool runs)
'use strict';
const fs = require('fs');
const path = require('path');
const { loadCore, coreSource, ROOT } = require('../../tests/lib/core.js');
const { seeded } = require('../../tests/lib/sim.js');

const args = process.argv.slice(2), flag = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : d; };
const TRACKS = flag('--proge', 'jezero,spa,bathurst').split(','), T_RUN = +flag('--t', '40'), PROTO = args.includes('--proto');
const ids = args.filter(a => !a.startsWith('--'));

let C;
if (PROTO) {   // Core with the prototypes' file after the page's vehicle files (it pushes to VEHICLE_DEFS like them)
  const code = coreSource().replace(/(\n;\n)(?=[^]*?const Core = \(function)/, '$1' + fs.readFileSync(path.join(__dirname, 'prototipi.js'), 'utf8') + '\n;\n');
  const m = { exports: {} }; C = new Function('module', 'exports', 'require', code + '\n;return Core;')(m, m.exports, require);
} else C = loadCore();

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

const rows = [];
for (const id of ids.length ? ids : ['sakal', 'skorpijon', 'kaze']) {
  if (!C.MODELS.find(m => m.id === id)) { console.log(id + ': not in this Core (a vehicle of another branch?)'); continue; }
  const r = { id }; for (const tid of TRACKS) r[tid] = driftRun(id, tid); rows.push(r);
  console.log(id.padEnd(12) + TRACKS.map(tid => `${tid} ${String(r[tid].pts).padStart(5)} (drsi ${r[tid].slide} s, kot do ${r[tid].bMax}°, ${r[tid].v} km/h, ${r[tid].s} m${r[tid].lost ? ', izgubljenih ' + r[tid].lost : ''})`).join(' · '));
}
