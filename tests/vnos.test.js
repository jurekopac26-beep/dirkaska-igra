// Vnos (Svetovna lestvica, seja 1: ponovljivost; docs/svetovna-lestvica.md, »Ponovljivost med brskalniki«): a repeatable run's input recorded
// (js/vnos.js) and replayed in Node, no server (tools/lestvica-preveri.mjs). Spa, Belgija: a lap alone on the autopilot with the player's own
// throttle between its calls, the same lap as a player's analog input (every step's steering, throttle and brake set by the game, no autopilot), and
// 40 s with 12 rivals and a crash (a rescue, the renderer emptying the dents in place, js/render.js). The recording touches no physics (a race
// recorded runs as one not recorded, to the last bit; opts.repro, which a run alone now has, changes nothing in a run that touches nothing), the
// replay agrees to the last bit, a record made up or cut fails, the record holds no names, and the tool reads a record from a .json and a .rrp.
// The browser's side (Chrome against Node): tests/browser/vnos.test.mjs.
//   node tests/vnos.test.js
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), zlib = require('zlib'), crypto = require('crypto');
const { spawnSync } = require('child_process');
const { loadCore } = require('./lib/core');
const { DT, seeded, raceState } = require('./lib/sim.js');
const C = loadCore(), V = require('../js/vnos.js');
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const T = new C.Track(C.TRACKS.find(d => d.id === 'spa'));
const BASE = { playerModel: C.MODELS[4], assist: 2, difficulty: 1, damage: 2, phys: 'cs', repro: true };
const SOLO = Object.assign({ numAI: 0, playerGrid: 1, laps: 1, seed: 9 }, BASE), PACK = Object.assign({ numAI: 12, playerGrid: 12, laps: 2, seed: 6 }, BASE);
const LAP = 120 * 240, PACKN = 40 * 120;   // (a lap's most steps; the pack's 40 s)

// one run: the race built (recorded if rec), started and stepped, drive(race, k) before each step, to the finish or max steps; Math.random
// seeded and counted (a race with opts.repro draws none: Race.rnd); eat: the dents emptied in place after each step, as the renderer does
function run(opts, drive, max, rec, eat) {
  const orig = Math.random, R0 = seeded(7); let calls = 0;
  Math.random = () => { calls++; return R0(); };
  try {
    const race = new C.Race(T, Object.assign({}, opts)), R = rec ? V.made(C, race, { kind: 'quali' }) : null, P = race.player, h = crypto.createHash('sha256');
    race.start(); let k = 0;
    for (; k < max && !P.finished; k++) {
      drive(race, k); race.step(DT);
      if (eat) for (const c of race.cars) if (c.dents && c.dents.length) c.dents.length = 0;
      if ((k + 1) % 1200 === 0) h.update(raceState(race));
    }
    h.update(raceState(race));
    return { race, R, k, calls, digest: h.digest('hex').slice(0, 16), fin: !!P.finished, ft: P.finishTime, x: P.x, z: P.z, dmg: +(P.dmg || 0).toFixed(2), loose: race.debrisId || 0, rescues: race.__res || 0 };
  } finally { Math.random = orig; }
}
// the autopilot's call, and the player's own throttle between its calls (a field the game sets: half throttle 30 steps in every 400)
const auto = (race, k) => { C.aiControl(race.player, race, DT); if (k % 400 < 30) race.player.inThr = 0.5; };
// the crash of tests/lib/sim.js crashDrive: from 6 s full left lock for 2.5 s, rescued when stuck (a call into the race), else the autopilot
const crash = (race, k) => {
  const P = race.player, t = k * DT;
  if (P.stuckT > 3 || P.wrongT > 3) { race.rescue(P); race.__res = (race.__res || 0) + 1; }
  if (t >= 6 && t < 8.5) { P.inSteer = -1; P.inThr = 1; P.inBrk = 0; P.inHand = 0; P.digitalSteer = true; } else { P.digitalSteer = false; C.aiControl(P, race, DT); }
};
// a player's analog input, step by step (the autopilot's lap taken down once, its steering to 1/64 as a touch slider gives it): only fields, no calls
const q64 = (v) => Math.round(v * 64) / 64, IN = { st: [], th: [], br: [], hb: [] };
run(SOLO, (race, k) => { const P = race.player; C.aiControl(P, race, DT); P.inSteer = q64(P.inSteer); IN.st.push(P.inSteer); IN.th.push(P.inThr); IN.br.push(P.inBrk); IN.hb.push(P.inHand); }, LAP);
const analog = (race, k) => { const P = race.player, j = Math.min(k, IN.st.length - 1); P.inSteer = IN.st[j]; P.inThr = IN.th[j]; P.inBrk = IN.br[j]; P.inHand = IN.hb[j]; P.digitalSteer = false; };

// the record made only for a repeatable race with a player
{
  const r0 = new C.Race(T, Object.assign({}, SOLO, { repro: false })), r1 = new C.Race(T, Object.assign({ numAI: 4, noPlayer: true, laps: 9 }, BASE));
  check('no record without opts.repro or without a player (Vnos.made: null; Vnos.out: none)', V.made(C, r0, {}) === null && V.out(r0) === undefined && V.made(C, r1, {}) === null && V.out(r1) === undefined);
}

// the recording touches no physics
const a0 = run(SOLO, auto, LAP, false), a1 = run(SOLO, auto, LAP, true);
check('a lap alone on the autopilot: recorded = not recorded, to the last bit (the whole state every 10 s, the finish time and place)', a0.fin && a0.digest === a1.digest && Object.is(a0.ft, a1.ft) && a0.x === a1.x && a1.R && a1.R.ok, JSON.stringify({ k: a0.k, ft: a0.ft, d: [a0.digest, a1.digest], ok: a1.R && a1.R.ok, why: a1.R && a1.R.why }));
const p0 = run(PACK, crash, PACKN, false, true), p1 = run(PACK, crash, PACKN, true, true);
check('12 rivals, a crash, a rescue: recorded = not recorded, to the last bit', p0.digest === p1.digest && p1.R && p1.R.ok, JSON.stringify({ d: [p0.digest, p1.digest], dmg: p1.dmg, loose: p1.loose, rescues: p1.rescues, why: p1.R && p1.R.why }));
check('the crash really happens (damage, loose panels, a rescue: the record has the race\'s random events and its calls)', p1.dmg > 0.1 && p1.loose > 0 && p1.rescues > 0 && p1.R.f.includes('!rescue'), JSON.stringify({ dmg: p1.dmg, loose: p1.loose, rescues: p1.rescues }));
const g0 = run(Object.assign({}, SOLO, { repro: false }), analog, LAP, false), g1 = run(SOLO, analog, LAP, false);
check('opts.repro (a run alone has it now) changes nothing in a run that touches nothing: a player\'s analog lap, to the last bit, no random number drawn', g0.fin && g0.digest === g1.digest && Object.is(g0.ft, g1.ft) && g0.calls === 0 && g1.calls === 0, JSON.stringify({ ft: [g0.ft, g1.ft], d: [g0.digest, g1.digest], calls: [g0.calls, g1.calls] }));

// the replay
const res = (r) => r && JSON.stringify({ ok: r.ok, why: r.why, n: r.n, fs: r.fs, dft: r.dft, maxD: r.maxD, dgBad: r.dgBad, exact: r.exact });
const rA = V.replay(C, a1.R);
check('the lap on the autopilot replayed: the finish in the same step, the same time, path and state to the last bit', rA.ok && rA.exact && rA.fs === a1.k && rA.dft === 0 && rA.maxD === 0, res(rA));
const g2 = run(SOLO, analog, LAP, true), rG = V.replay(C, g2.R);
check('the player\'s analog lap (every step\'s input a field) replayed to the last bit', g2.fin && g2.digest === g1.digest && rG.ok && rG.exact && rG.fs === g2.k, res(rG) + ' ' + JSON.stringify({ ev: g2.R.e.length / 3, f: g2.R.f.length }));
const rP = V.replay(C, p1.R);
check('12 rivals, the crash, the rescue, the dents emptied by the renderer: replayed to the last bit', rP.ok && rP.exact && rP.n === PACKN && rP.maxD === 0, res(rP));
const rF = V.replay(C, a1.R, { track: T }), rF2 = V.replay(C, a1.R);
check('a track reused for the replay is a fresh one (the same result; replayed twice, the same again)', rF.ok && rF.exact && rF2.ok && rF2.exact && res(rF) === res(rA) && res(rF2) === res(rA), res(rF));

// a record made up or cut fails, with its reason
const cp = (R, f) => { const c = JSON.parse(JSON.stringify(R)); f(c); return c; };
const fi = a1.R.f.indexOf('c0.inThr'), ai = a1.R.f.indexOf('!aiControl');
const BAD = [
  ['the finish time 0.5 s less', (c) => { c.fin.t -= 0.5; }, /čas cilja/],
  ['the finish 60 steps sooner', (c) => { c.fs -= 60; }, /cilj/],
  ['the throttle changed (full where the player gave half)', (c) => { for (let i = 0; i < c.e.length; i += 3) if (c.e[i + 1] === fi) c.e[i + 2] = 1; }, /cilj|pot/],
  ['the input of the lap\'s second half cut', (c) => { c.e.length = 3 * Math.floor(c.e.length / 6); }, /cilj|pot/],
  ['the autopilot asked for a car not in the race', (c) => { for (let i = 0; i < c.e.length; i += 3) if (c.e[i + 1] === ai) { c.e[i + 2] = 99; break; } }, /ni avta #99/],
  ['another track', (c) => { c.track = 'ni-proge'; }, /ni proge/],
  ['another version of the record', (c) => { c.v = 99; }, /različice/],
];
for (const [name, f, re] of BAD) {
  const r = V.replay(C, cp(a1.R, f));
  check('a record changed fails: ' + name, !r.ok && re.test(r.why), r.why);
}
check('the tampering checks are real (throttle events and autopilot calls in the record)', fi >= 0 && ai >= 0);

// no names in a record (the player's, a friend's in a challenge: chal, champ), wherever the game sets them
{
  const N = 'Izmišljeni Voznik';
  const r = run(SOLO, (race, k) => { if (k === 10) { race.player.name = N; race.playerName = N; race.chal = { from: N }; race.champ = { name: N }; race.player.extra = { name: N, n: 1 }; } auto(race, k); }, 240, true);
  const s = JSON.stringify(r.R);
  check('no names in the record (set on the race and its car in the run: name, playerName, chal, champ, a name inside a field)', r.R.ok && !s.includes('Izmišljeni') && !r.R.f.some(f => /\.(name|playerName|chal|champ)$/.test(f)), r.R.f.filter(f => /name|chal|champ/i.test(f)).join(','));
}

// the tool: a record from a .json (itself or { vnos }) and from a .rrp (its header), on the command line too (exit 0 / 1)
(async () => {
  const L = await import('../tools/lestvica-preveri.mjs'), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vnos-'));
  try {
    const K = L.koda(), fj = path.join(dir, 'zapis.json'), fv = path.join(dir, 'vnos.json'), fb = path.join(dir, 'pokvarjen.json'), fr = path.join(dir, 'posnetek_spa_20261113-1010.rrp');
    fs.writeFileSync(fj, JSON.stringify(a1.R)); fs.writeFileSync(fv, JSON.stringify({ vnos: a1.R })); fs.writeFileSync(fb, JSON.stringify(cp(a1.R, BAD[0][1])));
    const Np = (await import('../tools/voznja.mjs')).napake(), w = 2, frames = [];
    for (let i = 0; i < 40; i++) { const f = new Float32Array(1 + (1 + 1) * w); f[0] = i * 0.1; frames.push(f); }
    const u = Np.rrp.pack({ n: 1, w, cars: [{ m: 'x' }], track: 'spa', vnos: a1.R }, frames);
    fs.writeFileSync(fr, zlib.gzipSync(Buffer.from(u.buffer, u.byteOffset, u.byteLength)));
    const ok = [fj, fv, fr].map(f => L.preveri(L.zapisIz(f, Np), K)), nb = L.preveri(L.zapisIz(fb, Np), K), np = L.preveri(cp(a1.R, (c) => { c.ok = false; c.why = 'avti'; }), K);
    check('the tool reads a record from a .json (itself, { vnos }) and from a .rrp\'s header, and replays it (OK; a changed one FAIL; one the game marked not complete FAIL)', ok.every(r => r.ok && r.res.exact) && !nb.ok && !np.ok && /ni popoln/.test(np.why), JSON.stringify(ok.map(r => r.why)) + ' ' + nb.why + ' | ' + np.why);
    const cli = (args) => spawnSync(process.execPath, [path.join(__dirname, '..', 'tools', 'lestvica-preveri.mjs')].concat(args), { encoding: 'utf8' });
    const c1 = cli([fj, fr]), c2 = cli([fj, fb]), c3 = cli([fb, '--json']);
    let j = null; try { j = JSON.parse(c3.stdout); } catch (_) { /* checked below */ }
    check('on the command line: exit 0 and an OK line for each good record; exit 1 and a FAIL line for a changed one; --json', c1.status === 0 && /^OK {3}zapis\.json/m.test(c1.stdout) && /^OK {3}posnetek_spa/m.test(c1.stdout) && c2.status === 1 && /^FAIL pokvarjen\.json/m.test(c2.stdout) && c3.status === 1 && j && j[0] && j[0].ok === false, (c1.stdout + c2.stdout).trim().split('\n').map(s => s.slice(0, 90)).join(' | '));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  console.log(`\n${n - bad}/${n} checks passed`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL ' + (e && e.stack || e)); process.exit(1); });
