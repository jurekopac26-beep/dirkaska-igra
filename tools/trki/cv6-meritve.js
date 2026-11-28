// Trki: meritve različice Realistična (cv 6) proti Simulaciji (cv 1), 20. 11. 2026 (docs/trki-realizem.md). Three parts, each only a
// measurement: nothing of the game is changed and nothing of the physics is written here (part a runs tools/trki/avto-avto.js, parts b
// and c step the race loop itself: tests/lib/sim.js stepRace, a fresh Core for every run, Core.setTest({ cv })).
//   node tools/trki/cv6-meritve.js lestvica            (a) the ladder of car : car damage: head on, from behind, T-bone, offset, at 30, 60,
//                                                      120 and 200 km/h: damage in %, the speed lost, the turn (the flat test plane)
//   node tools/trki/cv6-meritve.js start [tracks]      (b) the start of 22 cars (21 rivals, the player on the autopilot from the middle of
//                                                      the grid), the first 15 s and 30 s; default spa tianmen ujarras
//   node tools/trki/cv6-meritve.js dirka [tracks]      (c) a whole race of 13 cars (12 rivals, the player on the autopilot) on narrow
//                                                      tracks; default hiva (3 laps), koli and ujarras (open roads: one run)
//   node tools/trki/cv6-meritve.js sled <track> [start|dirka]   where the damage comes from: every step that adds 5 % or more to a car, in
//                                                      both versions (the time, the car, the knock against a car or the barrier, the nose off the road)
//   node tools/trki/cv6-meritve.js                     all three (a, b, c)
//   --a 1 --b 6     the two versions compared (1 Simulacija ... 6 Realistična)        --seeds 77,78,79   the runs of parts b and c (default 71 ... 82)
//   --md            the tables as markdown                                             --json             everything as JSON on stdout
// A touch: a step with Car.hitCar over 0.5 m/s after 12 steps without one (a knock: over 3 m/s, a hard one: over 8 m/s); the same for
// the barrier (Car.hitWall). A spin: the nose more than 90° off the road, counted again once it is back under 30°. Standing: slower than
// 3 m/s, not finished. Out: Car.wreck.dnf (only the kit vehicles can retire; the fields here have none unless a track's field has).
// Units: km/h in part a, else m/s, m, s, %, degrees.
'use strict';
const path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const { loadCore } = require(path.join(ROOT, 'tests', 'lib', 'core.js'));
const SIM = require(path.join(ROOT, 'tests', 'lib', 'sim.js'));

const argv = process.argv.slice(2), VALUED = ['--a', '--b', '--seeds'];
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const CVA = +arg('--a', 1), CVB = +arg('--b', 6), SEEDS = arg('--seeds', '71,72,73,74,75,76,77,78,79,80,81,82').split(',').map(Number), MD = argv.includes('--md'), JSON_OUT = argv.includes('--json');
const POS = argv.filter((a, i) => !a.startsWith('--') && !VALUED.includes(argv[i - 1])), PART = POS[0] || 'vse', TR = POS.slice(1);
const NAMES = [null, 'Simulacija', 'Arkadna', 'Mehka', 'Kaskaderska', 'Stara', 'Realistična'];
const D = 180 / Math.PI, wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a)), f = (v, d = 1) => v == null || !Number.isFinite(v) ? '-' : v.toFixed(d);
const table = (head, rows) => { if (MD) { console.log('| ' + head.join(' | ') + ' |'); console.log('|' + head.map(() => '---').join('|') + '|'); for (const r of rows) console.log('| ' + r.join(' | ') + ' |'); }
  else { const w = head.map((h, j) => Math.max(h.length, ...rows.map(r => String(r[j]).length))); for (const r of [head].concat(rows)) console.log('  ' + r.map((x, j) => String(x).padEnd(w[j])).join('  ')); } };
const OUT = {};

// ---- (a) the ladder: avto-avto.js --json, the classic driving physics, the player's car into a rival's of the same model, no pedal after the touch ----
const LADDER = [['čelno', 'head-V-c'], ['čelno z zamikom', 'head-V-o'], ['od zadaj v stoječega', 'rear-V-stand-c'], ['od zadaj z zamikom', 'rear-V-stand-o'], ['od zadaj, 30 km/h razlike', 'rear-V-bump-c'],
  ['bočno (T) v stoječega', 'tbone-V-stand-mid'], ['bočno (T) v zadnjo os', 'tbone-V-stand-rear'], ['bočno (T) v vozečega', 'tbone-V-cross-mid']];
const VS = [30, 60, 120, 200];
function lestvica() {
  const get = (cv) => JSON.parse(cp.execFileSync(process.execPath, [path.join(__dirname, 'avto-avto.js'), '--cv', String(cv), '--v', VS.join(','), '--json'], { maxBuffer: 1 << 28 })).cs;
  const A = get(CVA), B = get(CVB), by = (L, n) => L.find(x => x.name === n), rows = [], res = [];
  // per car: damage %, the speed lost by 0.5 s after the touch (km/h), the largest turn (degrees)
  const cell = (r) => r && r.hit ? r.car.map(c => ({ dmg: c.dmg * 100, dv: c.v0 - c.v[2], turn: Math.abs(c.turnMax) })) : null;
  for (const [label, pat] of LADDER) for (const V of VS) {
    const n = pat.replace('V', V), a = cell(by(A, n)), b = cell(by(B, n)); if (!a || !b) { rows.push([label, V, 'ni dotika', '', '', '', '']); continue; }
    const dA = a[0].dmg + a[1].dmg, dB = b[0].dmg + b[1].dmg, k = dA > 0.5 ? dB / dA : null;
    res.push({ name: n, kmh: V, [CVA]: a, [CVB]: b, ratio: k });
    rows.push([label, V, f(a[0].dmg, 0) + '/' + f(a[1].dmg, 0) + ' → ' + f(b[0].dmg, 0) + '/' + f(b[1].dmg, 0), k == null ? '-' : f(k, 2) + '×',
      f(a[0].dv, 0) + '/' + f(a[1].dv, 0) + ' → ' + f(b[0].dv, 0) + '/' + f(b[1].dv, 0), f(a[0].turn, 0) + '/' + f(a[1].turn, 0) + ' → ' + f(b[0].turn, 0) + '/' + f(b[1].turn, 0)]);
  }
  OUT.lestvica = res; if (JSON_OUT) return;
  console.log('(a) Lestvica škode avto–avto, cv ' + CVA + ' ' + NAMES[CVA] + ' → cv ' + CVB + ' ' + NAMES[CVB] + ' (ravna plošča, isti model, A zadene / B zadet; izguba hitrosti 0,5 s po dotiku; zasuk: največji v 6 s)');
  table(['trk', 'km/h', 'škoda A/B %', 'razmerje škode', 'izguba hitrosti A/B km/h', 'zasuk A/B °'], rows);
  const bad = res.filter(r => r.ratio != null && (r.ratio > 2 || r.ratio < 0.5));
  console.log('  škoda cv ' + CVB + ' nad 2-kratnikom ali pod polovico cv ' + CVA + ': ' + (bad.length ? bad.map(r => r.name + ' ' + f(r.ratio, 2) + '×').join(', ') : 'nikjer'));
}

// ---- (b), (c): one race, a counter for every car ----
function run(tid, cv, seed, opts, secs, marks, log) {
  const C = loadCore(); C.setTest({ cv });
  Math.random = SIM.seeded(seed);
  const race = SIM.makeRace(C, tid, (C2, tt) => Object.assign(SIM.SETUPS.race.opts(C2, tt, 'cs'), opts, { seed: seed - 68 })), T = race.track, n = Math.round(secs / SIM.DT);
  const st = race.cars.map(() => ({ c0: 0, c3: 0, c8: 0, cMax: 0, w3: 0, wMax: 0, hMax: 0, spin: 0, inC: 0, inW: 0, sp: 0, stand: 0, stuck: 0, sk: 0 }));
  const snap = (t) => { const live = race.cars.filter(c => !c.finished), ds = race.cars.map(c => c.dist); return { t, touch: st.reduce((s, x) => s + x.c0, 0), c3: st.reduce((s, x) => s + x.c3, 0), c8: st.reduce((s, x) => s + x.c8, 0),
    cMax: Math.max(...st.map(x => x.cMax)), w3: st.reduce((s, x) => s + x.w3, 0), wMax: Math.max(...st.map(x => x.wMax)), dmgSum: race.cars.reduce((s, c) => s + (c.dmg || 0) * 100, 0), dmgMax: Math.max(...race.cars.map(c => (c.dmg || 0) * 100)),
    hurt: race.cars.filter(c => c.dmg > 0.005).length, lostP: race.cars.reduce((s, c) => s + Object.keys(c.lost || {}).length, 0), out: race.cars.filter(c => c.wreck && c.wreck.dnf).length, hMax: Math.max(...st.map(x => x.hMax)), spin: st.reduce((s, x) => s + x.spin, 0),
    stand: live.filter(c => c.speed < 3).length, standT: st.reduce((s, x) => s + x.stand, 0) * SIM.DT, stuck: st.reduce((s, x) => s + x.stuck, 0), spread: Math.max(...ds) - Math.min(...ds), distSum: ds.reduce((s, x) => s + x, 0), debris: (race.debris || []).length,
    fin: race.cars.filter(c => c.finished).length }; };
  const at = {}; let k = 1;
  for (; k <= n; k++) {
    for (const c of race.cars) { c.hitWall = 0; c.hitCar = 0; c.hitDebris = 0; }   // (as the game does before every step)
    SIM.stepRace(C, race, k);
    race.cars.forEach((c, i) => { const s = st[i], d1 = (c.dmg || 0) * 100;
      if (log && d1 - (s.d0 || 0) >= 5) log.push({ t: k * SIM.DT, car: i, id: c.m.id, add: d1 - (s.d0 || 0), dmg: d1, hitCar: c.hitCar, hitWall: c.hitWall, v: c.speed, off: c.q ? Math.abs(wrap(c.h - T.hd[c.q.i])) * D : 0 });
      s.d0 = d1;
      if (c.hitCar > 0.5) { if (!s.inC) { s.c0++; s.pk = 0; } if (c.hitCar > 3 && !(s.pk > 3)) s.c3++; if (c.hitCar > 8 && !(s.pk > 8)) s.c8++; s.pk = Math.max(s.pk, c.hitCar); s.inC = 12; s.cMax = Math.max(s.cMax, c.hitCar); } else if (s.inC) s.inC--;
      if (c.hitWall > 3) { if (!s.inW) s.w3++; s.inW = 12; s.wMax = Math.max(s.wMax, c.hitWall); } else if (s.inW) s.inW--;
      if (c.finished) return;
      const q = c.q, dh = q ? Math.abs(wrap(c.h - T.hd[q.i])) * D : 0; if (dh > s.hMax) s.hMax = dh;
      if (dh > 90 && !s.sp) { s.spin++; s.sp = 1; } else if (dh < 30) s.sp = 0;
      if (k > 600 && c.speed < 3) s.stand++;   // (after the first 5 s: the standing start itself is not counted)
      if (c.stuckT > 3) { if (!s.sk) { s.stuck++; s.sk = 1; } } else s.sk = 0; });
    for (const m of marks || []) if (k === Math.round(m / SIM.DT)) at[m] = snap(m);
    if (!marks && race.cars.every(c => c.finished)) break;
  }
  const end = snap(k * SIM.DT), fin = race.cars.filter(c => c.finished).map(c => c.finishTime).sort((x, y) => x - y), laps = [];
  for (const c of race.cars) for (const t of c.lapTimes || []) if (t > 0) laps.push(t);
  laps.sort((x, y) => x - y);
  return { at, end, n: race.cars.length, finT: fin, lapBest: laps[0], lapMed: laps.length ? laps[laps.length >> 1] : null, laps: laps.length, len: T.len, open: !!T.open,
    cars: race.cars.map((c, i) => ({ id: c.m.id, dmg: (c.dmg || 0) * 100, dist: c.dist, fin: c.finished ? c.finishTime : null, c3: st[i].c3, hMax: st[i].hMax, stuck: st[i].stuck })) };
}
const mean = (v) => v.reduce((s, x) => s + x, 0) / v.length;
// over the seeds: the least - the median - the largest
const span = (v, d = 0) => { const s = v.slice().sort((x, y) => x - y); return f(s[0], d) + '–' + f(s[s.length >> 1], d) + '–' + f(s[s.length - 1], d); };

function start() {
  const tracks = TR.length ? TR : ['spa', 'tianmen', 'ujarras', 'sosnova'], res = {}, rows = [], MARKS = [15, 30];
  for (const tid of tracks) { res[tid] = {};
    for (const cv of [CVA, CVB]) { const R = SEEDS.map(s => run(tid, cv, s, { numAI: 21, numSet: true, playerGrid: 11 }, 30, MARKS)); res[tid][cv] = R;
      for (const m of MARKS) { const S = R.map(r => r.at[m]), a = (k, d = 1) => f(mean(S.map(x => x[k])), d), mx = (k, d = 1) => f(Math.max(...S.map(x => x[k])), d);
        rows.push([tid, 'cv ' + cv, m + ' s', a('touch'), a('c3'), a('c8'), mx('cMax'), a('w3'), a('dmgSum'), span(S.map(x => x.dmgSum)), mx('dmgMax'), S.filter(x => x.dmgMax >= 50).length + '/' + S.length, a('hurt'), a('lostP'), a('out'), mx('hMax', 0), a('spin'), Math.max(...S.map(x => x.stand)) + ' (' + S.filter(x => x.stand > 0).length + ' semen)', a('spread', 0), a('distSum', 0)]); } } }
  OUT.start = res; if (JSON_OUT) return;
  console.log('(b) Štart z 22 avti (21 tekmecev, igralec na samovozniku z 11. mesta), stanje po 15 s in po 30 s; povprečje semen ' + SEEDS.join(', ') + ' (največ: največje med semeni; stoji: za vsako seme posebej)');
  table(['proga', 'različica', 'čas', 'dotikov', 'nad 3 m/s', 'nad 8 m/s', 'največji m/s', 'ograja nad 3', 'škoda skupaj %', 'škoda skupaj po semenih (najmanj–srednja–največ)', 'škoda največ %', 'semen z avtom nad 50 %', 'poškodovanih', 'odpadlih delov', 'izločenih', 'največji zasuk °', 'vrtenj', 'stoji (< 3 m/s) največ', 'razpon m', 'pot vseh m'], rows);
}

function dirka() {
  const tracks = TR.length ? TR : ['hiva', 'koli', 'ujarras', 'cusco', 'sacalobra', 'seoul'], res = {}, rows = [];
  for (const tid of tracks) { res[tid] = {};
    for (const cv of [CVA, CVB]) { const R = SEEDS.map(s => run(tid, cv, s, { laps: 3 }, 900, null)); res[tid][cv] = R;
      const E = R.map(r => r.end), a = (k, d = 1) => f(mean(E.map(x => x[k])), d), mx = (k, d = 1) => f(Math.max(...E.map(x => x[k])), d);
      rows.push([tid, 'cv ' + cv, R[0].n, a('touch'), a('c3'), a('c8'), mx('cMax'), a('w3'), a('dmgSum'), span(E.map(x => x.dmgSum)), mx('dmgMax'), E.filter(x => x.dmgMax >= 50).length + '/' + E.length, a('lostP'), a('out'), mx('hMax', 0), a('spin'), a('stuck'), a('standT'), Math.min(...R.map(r => r.end.fin)) + '–' + Math.max(...R.map(r => r.end.fin)),
        f(mean(R.map(r => r.finT[0])), 2), f(mean(R.map(r => r.finT[r.finT.length >> 1])), 2), f(mean(R.map(r => r.finT[r.finT.length - 1])), 2), f(mean(R.map(r => r.lapBest)), 2), f(mean(R.map(r => r.lapMed)), 2)]); } }
  OUT.dirka = res; if (JSON_OUT) return;
  console.log('(c) Cela dirka 13 avtov (12 tekmecev, igralec na samovozniku z 12. mesta; krožna 3 krogi, odprta cesta en tek) na ozkih progah; povprečje semen ' + SEEDS.join(', '));
  table(['proga', 'različica', 'avtov', 'dotikov', 'nad 3 m/s', 'nad 8 m/s', 'največji m/s', 'ograja nad 3', 'škoda skupaj %', 'škoda skupaj po semenih (najmanj–srednja–največ)', 'škoda največ %', 'semen z avtom nad 50 %', 'odpadlih delov', 'izločenih', 'največji zasuk °', 'vrtenj', 'obtičal', 'stanja s', 'v cilju', 'zmagovalec s', 'srednji s', 'zadnji s', 'najhitrejši krog s', 'srednji krog s'], rows);
}

// where the damage comes from: the steps that add 5 % or more, by cause (a car, the barrier, else: a landing, a loose piece)
function sled() {
  const tid = TR[0] || 'ujarras', kind = TR[1] || 'start', res = {}, rows = [];
  for (const cv of [CVA, CVB]) { const L = []; let sum = 0;
    for (const s of SEEDS) { const log = [], r = kind === 'start' ? run(tid, cv, s, { numAI: 21, numSet: true, playerGrid: 11 }, 30, [30], log) : run(tid, cv, s, { laps: 3 }, 900, null, log); sum += r.end.dmgSum; for (const e of log) L.push(Object.assign(e, { seed: s })); }
    res[cv] = L; const by = (fn) => L.filter(fn), tot = (X) => X.reduce((a, e) => a + e.add, 0);
    const car = by(e => e.hitCar > 0.5 && e.hitCar >= e.hitWall), wall = by(e => e.hitWall > 0.5 && e.hitWall > e.hitCar), other = by(e => !(e.hitCar > 0.5) && !(e.hitWall > 0.5)), side = by(e => e.off > 45);
    rows.push(['cv ' + cv, f(sum / SEEDS.length), L.length, car.length + ' (' + f(tot(car) / SEEDS.length) + ' %)', wall.length + ' (' + f(tot(wall) / SEEDS.length) + ' %)', other.length + ' (' + f(tot(other) / SEEDS.length) + ' %)',
      side.length + ' (' + f(tot(side) / SEEDS.length) + ' %)', f(Math.max(0, ...car.map(e => e.hitCar))), f(Math.max(0, ...wall.map(e => e.hitWall)))]); }
  OUT.sled = res; if (JSON_OUT) return;
  console.log('Od kod škoda: ' + tid + ', ' + (kind === 'start' ? 'štart z 22 avti, 30 s' : 'cela dirka 13 avtov') + ', semena ' + SEEDS.join(', ') + ' (koraki, ki avtu dodajo 5 % ali več; v oklepaju škoda na dirko)');
  table(['različica', 'škoda skupaj na dirko %', 'korakov nad 5 %', 'ob avto', 'ob ograjo', 'drugo', 'od tega z nosom nad 45° od ceste', 'največji udarec avto m/s', 'največji udarec ograja m/s'], rows);
  if (argv.includes('--rows')) for (const cv of [CVA, CVB]) for (const e of res[cv]) console.log('  cv ' + cv + ' seme ' + e.seed + ' t ' + f(e.t, 2) + ' s avto ' + e.car + ' ' + e.id + ': +' + f(e.add) + ' % (' + f(e.dmg) + ' %), ob avto ' + f(e.hitCar) + ', ob ograjo ' + f(e.hitWall) + ' m/s, hitrost ' + f(e.v) + ' m/s, nos ' + f(e.off, 0) + '° od ceste');
}

if (PART === 'sled') sled();
if (PART === 'lestvica' || PART === 'vse') lestvica();
if (PART === 'start' || PART === 'vse') start();
if (PART === 'dirka' || PART === 'vse') dirka();
if (JSON_OUT) console.log(JSON.stringify(OUT));
