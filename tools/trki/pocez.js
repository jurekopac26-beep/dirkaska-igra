// Trki: tekmeci in avto počez na cesti (Core aiHazard, Realistična, cv 6; odločitev trki-ozke-proge-20-11 = 2), 20. 11. 2026.
// Only a measurement: nothing of the game is changed. Two Cores side by side: the game as it is, and a base without aiHazard: the
// game's folder given with --base (e.g. a copy of origin/trki/realizem: git archive origin/trki/realizem index.html js | tar -x -C DIR),
// or, without --base, the same source with the one call of aiHazard cut out by text (the tool stops if the line is not found once).
//   node tools/trki/pocez.js enakost [tracks]   whole races of 13 cars (12 rivals, the player on the autopilot) in both Cores: the
//                                               whole state of the race and of every car (tests/lib/sim.js raceState) after every
//                                               step; the first step they part at, and the first step any car saw a hazard
//                                               (c.aiHz) in the game: the two must be the same race to the bit up to that step, and
//                                               the hazard there must be a car standing, stuck, retired, facing back or sliding across
//   node tools/trki/pocez.js skoda [tracks]     a car stood across the road (90°, held) 10 s into the race, 400 m ahead of the
//                                               leader (on a circuit: on the racing line), 12 rivals coming: the damage the rivals
//                                               take, their hits on it, its own damage, base against the game; cv 1 beside them
//   --seeds 71,72,73   --cv 6   --secs 240   --base DIR   --json
// Default tracks: enakost jezero toskana cusco tianmen hiva spa; skoda cusco tianmen hiva spa.
// Units: s, m, m/s, % of damage.
'use strict';
const path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const { coreSource } = require(path.join(ROOT, 'tests', 'lib', 'core.js'));
const SIM = require(path.join(ROOT, 'tests', 'lib', 'sim.js'));

const argv = process.argv.slice(2), VALUED = ['--seeds', '--cv', '--secs', '--base'];
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const SEEDS = arg('--seeds', '71,72,73').split(',').map(Number), CV = +arg('--cv', 6), SECS = +arg('--secs', 240), BASE = arg('--base', null), JSON_OUT = argv.includes('--json');
const POS = argv.filter((a, i) => !a.startsWith('--') && !VALUED.includes(argv[i - 1])), PART = POS[0] || 'enakost';
const TRACKS = POS.length > 1 ? POS.slice(1) : PART === 'skoda' ? ['cusco', 'tianmen', 'hiva', 'spa'] : ['jezero', 'toskana', 'cusco', 'tianmen', 'hiva', 'spa'];
const f = (v, d = 1) => v == null || !Number.isFinite(v) ? '-' : v.toFixed(d), say = (...a) => { if (!JSON_OUT) console.log(...a); };
const table = (head, rows) => { const w = head.map((h, j) => Math.max(h.length, ...rows.map(r => String(r[j]).length))); for (const r of [head].concat(rows)) say('  ' + r.map((x, j) => String(x).padEnd(w[j])).join('  ')); };
const OUT = {};

const CALL = '? aiHazard(c, race, v, Lw) : null;';
function core(base, cv) {
  let s;
  if (!base) s = coreSource();
  else if (base === 'cut') { s = coreSource(); const n = s.split(CALL).length - 1; if (n !== 1) throw new Error('pocez: klic aiHazard ni najden natanko enkrat (' + n + '×)'); s = s.replace(CALL, '? null : null;'); }
  else s = coreSource(path.resolve(base));
  const m = { exports: {} }, C = new Function('module', 'exports', 'require', s + '\n;return Core;')(m, m.exports, require);
  C.setTest({ cv }); return C;
}
const baseOf = () => BASE || 'cut';
function start(C, tid, seed) {
  Math.random = SIM.seeded(seed);
  const race = SIM.makeRace(C, tid, (C2, tt) => Object.assign(SIM.SETUPS.race.opts(C2, tt, 'cs'), { seed: seed - 68 }));
  return { C, race, k: 0 };
}
const done = (R) => R.race.cars.every(c => c.finished || (c.wreck && c.wreck.dnf));
const dig = (race) => crypto.createHash('sha256').update(SIM.raceState(race)).digest('hex');
const hzOf = (race) => race.cars.find(c => c.aiHz);

// ---- enakost: the same race in both Cores, the whole state after every step ----
function enakost() {
  const rows = [], all = [], n = Math.round(SECS / SIM.DT);
  for (const tid of TRACKS) for (const seed of SEEDS) {
    const A = start(core(baseOf(), CV), tid, seed), B = start(core(null, CV), tid, seed);
    let part = null, hz = null, hzCar = null, k = 0;
    for (k = 1; k <= n && !(done(A) && done(B)); k++) {
      SIM.stepRace(A.C, A.race, k); SIM.stepRace(B.C, B.race, k);
      if (hz == null) { const c = hzOf(B.race); if (c) { hz = k; const o = c.aiHz.o, yaw = Math.abs(B.C.wrapPi ? B.C.wrapPi(o.h - B.race.track.hd[o.q.i]) : NaN); hzCar = { v: o.speed, yaw: yaw * 180 / Math.PI, dmg: (o.dmg || 0) * 100, stuck: o.stuckT, dnf: !!(o.wreck && o.wreck.dnf), hit: (o.dmg || 0) > 0 }; } }
      if (part == null && dig(A.race) !== dig(B.race)) part = k;
      if (part != null && hz != null) break;
    }
    const ok = part == null || (hz != null && part >= hz);
    all.push({ tid, seed, steps: k, part, hz, hzCar, ok });
    process.stderr.write(tid + ' ' + seed + ' ' + (ok ? 'OK' : 'RAZLIKA') + '\n');
    rows.push([tid, seed, f(Math.min(k, n) * SIM.DT, 0), part == null ? 'nikoli' : f(part * SIM.DT, 2), hz == null ? 'nikoli' : f(hz * SIM.DT, 2),
      hzCar ? `${f(hzCar.v, 1)} m/s, ${f(hzCar.yaw, 0)}°, škoda ${f(hzCar.dmg, 0)} %${hzCar.dnf ? ', izpadel' : ''}${hzCar.stuck > 0.8 ? ', obtičal' : ''}` : '-', ok ? 'da' : 'NE']);
  }
  OUT.enakost = all;
  say(`Enakost, cv ${CV}: osnova (${BASE ? BASE : 'brez klica aiHazard'}) proti igri, celo stanje vseh avtov po vsakem koraku (do ${SECS} s ali cilja)`);
  table(['proga', 'seme', 'do s', 'razhajanje s', 'prva nevarnost s', 'avto nevarnosti', 'bitno enako do nevarnosti'], rows);
  return all.every(r => r.ok);
}

// ---- skoda: a car stood across the road, the field coming ----
function skoda() {
  const rows = [], all = [];
  const run = (C, tid, seed) => { const R = start(C, tid, seed), T = R.race.track, P = R.race.player, n = Math.round(Math.min(SECS, 90) / SIM.DT);
    let on = false, X = 0, Z = 0, Hd = 0, pd = 0, hits = 0, hitMax = 0, d0 = null, byP = 0, byC = 0, byW = 0;
    for (let k = 1; k <= n; k++) {
      if (!on && R.race.time > 10) { on = true; const lead = R.race.cars.filter(c => c !== P).reduce((a, c) => c.dist > a.dist ? c : a), i = T.idx(lead.q.s + 400), d = T.rl[i];
        X = T.px[i] + T.nx[i] * d; Z = T.pz[i] + T.nz[i] * d; Hd = T.hd[i] + Math.PI / 2; pd = lead.dist + 400; P.place(X, Z, Hd); T.query(X, Z, -1, P.q);
        d0 = R.race.cars.map(c => c.dmg || 0); }
      for (const c of R.race.cars) { c.hitCar = 0; c.hitWall = 0; }
      const dm = R.race.cars.map(c => c.dmg || 0);
      if (on) { if (!(P.dmg > 0.3)) { P.x = X; P.z = Z; P.h = Hd; P.vx = P.vz = P.w = 0; } P.inThr = 0; P.inBrk = 1; P.inSteer = 0; P.dist = pd; Math.random = SIM.seeded(1000 + k); R.race.step(SIM.DT); P.dist = pd; }
      else SIM.stepRace(R.C, R.race, k);
      if (on) { if (P.hitCar > 0.5) hits++; if (P.hitCar > hitMax) hitMax = P.hitCar;
        R.race.cars.forEach((c, j) => { if (c === P) return; const dd = ((c.dmg || 0) - dm[j]) * 100; if (!(dd > 0)) return;
          if (c.hitCar > 0 && Math.hypot(c.x - P.x, c.z - P.z) < (c.m.len + P.m.len) * 0.5 + 1) byP += dd; else if (c.hitCar > 0) byC += dd; else byW += dd; }); }
    }
    const cs = R.race.cars, riv = cs.filter(c => c !== P);
    return { riv: riv.reduce((s, c) => s + ((c.dmg || 0) - d0[cs.indexOf(c)]) * 100, 0), out: riv.filter(c => c.wreck && c.wreck.dnf).length, pDmg: ((P.dmg || 0) - d0[cs.indexOf(P)]) * 100, hits, hitMax, byP, byC, byW, past: riv.filter(c => c.dist > pd + 10).length };
  };
  for (const tid of TRACKS) for (const seed of SEEDS) {
    const r1 = run(core(null, 1), tid, seed), a = run(core(baseOf(), CV), tid, seed), b = run(core(null, CV), tid, seed);
    all.push({ tid, seed, cv1: r1, base: a, game: b });
    process.stderr.write(tid + ' ' + seed + '\n');
    for (const [nm, r] of [['cv 1', r1], ['cv 6 osnova', a], ['cv 6 igra', b]]) rows.push([tid, seed, nm, f(r.riv, 1), f(r.byP, 0) + ' / ' + f(r.byC, 0) + ' / ' + f(r.byW, 0), f(r.pDmg, 1), r.hits, f(r.hitMax, 1), r.out, r.past + '/12']);
  }
  OUT.skoda = all;
  const sum = (k) => all.reduce((s, x) => s + x[k].riv + x[k].pDmg, 0);
  say(`Avto počez (90°, držan) 400 m pred vodilnim od 10 s, 12 tekmecev, do ${Math.min(SECS, 90)} s; škoda po postavitvi`);
  table(['proga', 'seme', 'različica', 'škoda tekmecev Σ %', 'v avto počez / v druge / ograja %', 'škoda avta počez %', 'koraki z udarcem', 'najmočnejši m/s', 'izpadli', 'mimo'], rows);
  for (const tid of TRACKS) { const t = all.filter(x => x.tid === tid), s = (k) => t.reduce((a, x) => a + x[k].riv + x[k].pDmg, 0);
    say(`  ${tid}: skupna škoda cv 1 ${f(s('cv1'), 0)} %, cv 6 osnova ${f(s('base'), 0)} % (${f(s('base') / s('cv1'), 2)}×), cv 6 igra ${f(s('game'), 0)} % (${f(s('game') / s('cv1'), 2)}×)`); }
  say(`  vse: cv 1 ${f(sum('cv1'), 0)} %, osnova ${f(sum('base'), 0)} %, igra ${f(sum('game'), 0)} %`);
  return true;
}

const okAll = PART === 'skoda' ? skoda() : enakost();
if (JSON_OUT) console.log(JSON.stringify(OUT));
process.exit(okAll ? 0 : 1);
