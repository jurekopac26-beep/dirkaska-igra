// Trki: zrcalni vrstni red vogalov ob ograji (Core wallCollide, Realistična, cv 6) na celih dirkah, 20. 11. 2026 (docs/trki-realizem.md,
// »Krog 20. 11., drugi del«). Only a measurement: nothing of the game is changed. The versions compared are made here, in the tool, by
// changing one line of the Core's source text as it is loaded (tests/lib/core.js coreSource; js/core.js itself is not touched):
//   zrcalno   the game as it is: a car on the left half of the road (q.d < 0) takes its four corners in the order 1, 0, 3, 2
//   brez      the mirror order off: every car 0, 1, 2, 3 (the game before »Krog 20. 11., drugi del«)
//   obratno   the mirror order on the RIGHT half instead (a control: how far any change of the order moves a race)
// and every version gets a read-only counter at the end of wallCollide (which corners touched the barrier in the step, the hit, the
// damage the step added, the side). The tool stops if a line it changes is not found, and `ponovi` checks that the counted game is the
// game to the last bit.
//   node tools/trki/zrcalne-dirke.js dirke [tracks]    whole races of 13 cars (12 rivals, the player on the autopilot), cv 6: the
//                                                      versions step by step side by side: the first step they part at, the finishing
//                                                      times, the order, the damage, the cars out; per side of the road the touches of
//                                                      one corner and of two in one step, the hits and the damage
//   node tools/trki/zrcalne-dirke.js zrcalo            the true mirror image: a made-up circuit and its mirror image (z → -z), the same
//                                                      race on both from mirrored starts; and a field of cars on the flat test road with
//                                                      scripted pedals and wheels, started mirrored: how far the two are from each other's
//                                                      mirror image (cv 1 next to cv 6: what the race itself, not the barrier, adds)
//   node tools/trki/zrcalne-dirke.js ponovi [tracks]   the same race twice: the same state to the last bit (cv 6), and the counted Core
//                                                      against the plain one
//   --seeds 71,72,73,74,75,76   the runs            --cv 6   the version          --var zrcalno,brez,obratno   the versions (dirke)
//   --secs 900                  the longest race    --json   everything as JSON on stdout
// Default tracks: spa hiva koli ujarras cusco sacalobra seoul bathurst furka (all real, none frozen).
// Units: s, m, m/s, % of damage.
'use strict';
const path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const { coreSource } = require(path.join(ROOT, 'tests', 'lib', 'core.js'));
const SIM = require(path.join(ROOT, 'tests', 'lib', 'sim.js'));

const argv = process.argv.slice(2), VALUED = ['--seeds', '--cv', '--var', '--secs'];
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const SEEDS = arg('--seeds', '71,72,73,74,75,76').split(',').map(Number), CV = +arg('--cv', 6), VARS = arg('--var', 'zrcalno,brez,obratno').split(','), SECS = +arg('--secs', 900), JSON_OUT = argv.includes('--json');
const POS = argv.filter((a, i) => !a.startsWith('--') && !VALUED.includes(argv[i - 1])), PART = POS[0] || 'dirke';
const TRACKS = POS.length > 1 ? POS.slice(1) : ['spa', 'hiva', 'koli', 'ujarras', 'cusco', 'sacalobra', 'seoul', 'bathurst', 'furka'];
const f = (v, d = 1) => v == null || !Number.isFinite(v) ? '-' : v.toFixed(d), say = (...a) => { if (!JSON_OUT) console.log(...a); };
const table = (head, rows) => { const w = head.map((h, j) => Math.max(h.length, ...rows.map(r => String(r[j]).length))); for (const r of [head].concat(rows)) say('  ' + r.map((x, j) => String(x).padEnd(w[j])).join('  ')); };
const OUT = {};

// ---- the Core in a version: one line of wallCollide changed in the text, a counter before its last line ----
const SRC = coreSource();
const A_MIR = 'const mir = c.corners.length === 4 && krOn(c) && c.q && (c.q.d || -c.w) < 0 ? 1 : 0;';
const A_HIT = 'if (hit > 0) { c.hitWall = Math.max(c.hitWall, hit); c.fxWall = Math.max(c.fxWall || 0, hit); }';
const A_END = '\n    return hit;\n  }\n';
const once = (s, a) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error('zrcalne-dirke: vrstica wallCollide ni najdena natanko enkrat (' + n + '×): ' + a.trim().slice(0, 60)); };
function core(variant, plain) {
  let s = SRC; once(s, A_MIR); once(s, A_HIT);
  const k = s.indexOf(A_HIT), e = s.indexOf(A_END, k); if (e < 0 || e - k > 2000) throw new Error('zrcalne-dirke: konec wallCollide ni najden');
  if (!plain) s = s.slice(0, k) + 'const __d0 = c.dmg || 0; ' + s.slice(k, e) + '\n    if (tch && wallCollide.__zrc) wallCollide.__zrc(c, tch, hit, (c.dmg || 0) - __d0, mir);' + s.slice(e);
  if (variant === 'brez') s = s.replace(A_MIR, 'const mir = 0;');
  else if (variant === 'obratno') s = s.replace(A_MIR, A_MIR.replace('< 0 ? 1 : 0', '> 0 ? 1 : 0'));
  else if (variant !== 'zrcalno') throw new Error('zrcalne-dirke: neznana različica ' + variant);
  const m = { exports: {} }, C = new Function('module', 'exports', 'require', s + '\n;return Core;')(m, m.exports, require);
  C.setTest({ cv: CV }); return C;
}
const bits = (t) => (t & 1) + (t >> 1 & 1) + (t >> 2 & 1) + (t >> 3 & 1);
const side0 = () => ({ n1: 0, n2: 0, nx: 0, kx: 0, dmgx: 0, k1: 0, k2: 0, hit1: 0, hit2: 0, dmg1: 0, dmg2: 0, max: 0 });
// the counter: per side of the road (L: q.d < 0) the steps with one corner in the barrier (n1) and with two or more (n2), of them the
// knocks over 2.5 m/s (k1, k2: the ones that dent), the sum of the hits and of the damage they added. nx: of n2 the steps in which the order
// counts at all: both front corners (0 and 1) or both rear ones (2 and 3) in the barrier, the car nearly square to it (two corners of one
// side, 0 and 2 or 1 and 3, come in the same order in both versions); kx, dmgx: their knocks over 2.5 m/s and their damage
function counter(C, S) {
  C.wallCollide.__zrc = (c, tch, hit, dd) => { if (c.corners.length !== 4) return; const s = c.q && c.q.d < 0 ? S.L : S.R, two = bits(tch) >= 2;
    if (two) { if ((tch & 3) === 3 || (tch & 12) === 12) { s.nx++; if (hit > 2.5) s.kx++; s.dmgx += dd * 100; if (S.firstX == null && s === S.L) S.firstX = S.k; } s.n2++; if (hit > 2.5) s.k2++; s.hit2 += hit; s.dmg2 += dd * 100; if (S.first2 == null && s === S.L) S.first2 = S.k; }
    else { s.n1++; if (hit > 2.5) s.k1++; s.hit1 += hit; s.dmg1 += dd * 100; }
    if (hit > s.max) s.max = hit; };
}
function start(variant, tid, seed, plain) {
  const C = core(variant, plain), S = { L: side0(), R: side0(), first2: null, firstX: null, k: 0 };
  if (!plain) counter(C, S);
  Math.random = SIM.seeded(seed);
  const race = SIM.makeRace(C, tid, (C2, tt) => Object.assign(SIM.SETUPS.race.opts(C2, tt, 'cs'), { seed: seed - 68 }));
  return { C, race, S, k: 0 };
}
function step(R) { R.k++; R.S.k = R.k; for (const c of R.race.cars) { c.hitWall = 0; c.hitCar = 0; c.hitDebris = 0; } SIM.stepRace(R.C, R.race, R.k); }
const done = (R) => R.race.cars.every(c => c.finished || (c.wreck && c.wreck.dnf));
const result = (R) => { const cs = R.race.cars, ord = cs.map((c, i) => i).sort((a, b) => (cs[b].finished ? 1 : 0) - (cs[a].finished ? 1 : 0) || (cs[a].finished ? cs[a].finishTime - cs[b].finishTime : cs[b].dist - cs[a].dist));
  return { t: R.k * SIM.DT, fin: cs.filter(c => c.finished).length, out: cs.filter(c => c.wreck && c.wreck.dnf).length, dmg: cs.reduce((s, c) => s + (c.dmg || 0) * 100, 0), dmgMax: Math.max(...cs.map(c => (c.dmg || 0) * 100)),
    lost: cs.reduce((s, c) => s + Object.keys(c.lost || {}).length, 0), ft: cs.map(c => c.finished ? c.finishTime : null), ord, win: ord[0], S: R.S }; };
const key = (R) => { let s = ''; for (const c of R.race.cars) s += c.x + ',' + c.z + ',' + c.h + ',' + (c.dmg || 0) + ';'; return s; };

// ---- dirke: the versions of one race side by side ----
function dirke() {
  const rows = [], all = [], n = Math.round(SECS / SIM.DT);
  for (const tid of TRACKS) for (const seed of SEEDS) {
    const R = VARS.map(v => start(v, tid, seed)), part = VARS.map(() => null);
    for (let k = 1; k <= n && !R.every(done); k++) {
      const k0 = []; for (let j = 0; j < R.length; j++) { if (!done(R[j])) step(R[j]); k0.push(part[j] == null && j ? key(R[j]) : ''); }
      if (R.length > 1) { const a = key(R[0]); for (let j = 1; j < R.length; j++) if (part[j] == null && k0[j] !== a) part[j] = k; }
    }
    const res = R.map(result); all.push({ tid, seed, res, part });
    process.stderr.write(tid + ' ' + seed + ' ' + res.map(r => f(r.t, 0) + ' s').join(' / ') + '\n');
    res.forEach((r, j) => { const a = res[0], dt = r.ft.map((t, i) => t != null && a.ft[i] != null ? t - a.ft[i] : null).filter(x => x != null), mv = r.ord.reduce((s, c, p) => s + (a.ord[p] !== c ? 1 : 0), 0);
      rows.push([tid, seed, VARS[j], j ? (part[j] == null ? 'nikoli' : f(part[j] * SIM.DT, 2)) : '', r.S.firstX == null ? '-' : f(r.S.firstX * SIM.DT, 2), r.fin + '/' + r.out, f(r.dmg, 0), f(r.dmgMax, 0), r.lost,
        j ? (dt.length ? f(Math.max(...dt.map(Math.abs)), 2) : '-') : '', j ? mv : '', j ? (r.win === a.win ? 'isti' : 'drug') : '',
        r.S.L.n1 + '/' + r.S.L.n2 + '/' + r.S.L.nx, r.S.R.n1 + '/' + r.S.R.n2 + '/' + r.S.R.nx, f(r.S.L.dmg1 + r.S.L.dmg2, 0), f(r.S.R.dmg1 + r.S.R.dmg2, 0)]); });
  }
  OUT.dirke = all;
  say('Dirke 13 avtov, cv ' + CV + ', različice vrstnega reda vogalov (' + VARS.join(', ') + '); razhajanje: prvi korak, ko se stanje (x, z, smer, škoda kateregakoli avta) loči od prve različice');
  table(['proga', 'seme', 'različica', 'razhajanje s', 'prvi par vogalov levo s', 'cilj/izpad', 'škoda Σ %', 'največ %', 'deli', '|Δ čas| max s', 'mest drugače', 'zmagovalec', 'L 1/2/par', 'D 1/2/par', 'škoda ograje L %', 'D %'], rows);
  // the sums: per version, and per track
  const sum = (L, fn) => L.reduce((s, x) => s + fn(x), 0), agg = (L, j) => { const g = (sd, k) => sum(L, x => x.res[j].S[sd][k]);
    return { races: L.length, dmg: sum(L, x => x.res[j].dmg), out: sum(L, x => x.res[j].out), fin: sum(L, x => x.res[j].fin), lost: sum(L, x => x.res[j].lost), t: sum(L, x => sum(x.res[j].ft, t => t || 0)),
      L: Object.fromEntries(Object.keys(side0()).map(k => [k, k === 'max' ? Math.max(...L.map(x => x.res[j].S.L.max)) : g('L', k)])), R: Object.fromEntries(Object.keys(side0()).map(k => [k, k === 'max' ? Math.max(...L.map(x => x.res[j].S.R.max)) : g('R', k)])) }; };
  const line = (name, v, a) => [name, v, a.races, f(a.dmg / a.races, 1), a.out, a.lost, a.L.n1, a.L.n2, a.L.nx + ' (' + a.L.kx + ', ' + f(a.L.dmgx, 0) + ' %)', a.L.k1 + '/' + a.L.k2, f(a.L.dmg1, 0) + '/' + f(a.L.dmg2, 0), f(a.L.n2 ? a.L.dmg2 / a.L.n2 : NaN, 2), f(a.L.n2 ? a.L.hit2 / a.L.n2 : NaN, 2),
    a.R.n1, a.R.n2, a.R.nx + ' (' + a.R.kx + ', ' + f(a.R.dmgx, 0) + ' %)', a.R.k1 + '/' + a.R.k2, f(a.R.dmg1, 0) + '/' + f(a.R.dmg2, 0), f(a.R.n2 ? a.R.dmg2 / a.R.n2 : NaN, 2), f(a.R.n2 ? a.R.hit2 / a.R.n2 : NaN, 2)];
  const head = ['proga', 'različica', 'dirk', 'škoda/dirko %', 'izpadi', 'deli', 'L 1 vog.', 'L 2 vog.', 'L par (udarci, škoda)', 'L udarci>2,5 (1/2)', 'L škoda % (1/2)', 'L %/dotik 2', 'L m/s/dotik 2', 'D 1 vog.', 'D 2 vog.', 'D par (udarci, škoda)', 'D udarci>2,5 (1/2)', 'D škoda % (1/2)', 'D %/dotik 2', 'D m/s/dotik 2'];
  const srows = []; OUT.vsote = {};
  for (const tid of TRACKS.concat(['VSE'])) VARS.forEach((v, j) => { const a = agg(tid === 'VSE' ? all : all.filter(x => x.tid === tid), j); OUT.vsote[tid + '/' + v] = a; srows.push(line(tid, v, a)); });
  say('\nVsote po progah (koraki z dotikom ograje: 1 vogal / 2 ali več v istem koraku; par: oba sprednja ali oba zadnja, edini primer, ko vrstni red šteje; L: avto na levi polovici ceste, D: na desni)');
  table(head, srows);
  // per race: the spread of the total damage between the versions against the spread between the seeds
  if (VARS.length > 1) { const pr = []; OUT.razlike = {};
    for (let j = 1; j < VARS.length; j++) { const d = all.map(x => x.res[j].dmg - x.res[0].dmg), dt = all.map(x => { const a = x.res[0], b = x.res[j], w = a.ft[a.win], w2 = b.ft[b.win]; return w != null && w2 != null ? w2 - w : null; }).filter(x => x != null);
      const mean = (L) => L.reduce((s, x) => s + x, 0) / (L.length || 1), sd = (L) => { const m = mean(L); return Math.sqrt(mean(L.map(x => (x - m) * (x - m)))); }, nz = all.filter((x, i) => all[i].part[j] != null).length;
      const o = { razhajanj: nz, dirk: all.length, dDmg: mean(d), sdDmg: sd(d), se: sd(d) / Math.sqrt(d.length || 1), dWin: mean(dt), sdWin: sd(dt), drugZmag: all.filter(x => x.res[j].win !== x.res[0].win).length, dOut: sum(all, x => x.res[j].out - x.res[0].out) };
      OUT.razlike[VARS[j]] = o; pr.push([VARS[j] + ' − ' + VARS[0], o.razhajanj + '/' + o.dirk, f(o.dDmg, 2) + ' ± ' + f(o.se, 2), f(o.sdDmg, 1), f(o.dWin, 3), f(o.sdWin, 2), o.drugZmag, o.dOut]); }
    say('\nRazlike med različicami po dirkah (povprečje ± standardna napaka)');
    table(['par', 'razhajanj', 'Δ škoda Σ % na dirko', 'raztros %', 'Δ čas zmagovalca s', 'raztros s', 'drug zmagovalec', 'Δ izpadi'], pr); }
}

// ---- ponovi: the same race twice, and the counted Core against the plain one ----
function ponovi() {
  const rows = []; let bad = 0; OUT.ponovi = [];
  const dig = (variant, tid, seed, plain) => { const R = start(variant, tid, seed, plain), h = crypto.createHash('sha256'), n = Math.round(Math.min(SECS, 120) / SIM.DT);
    for (let k = 1; k <= n; k++) { step(R); if (k % 600 === 0) h.update('t' + k + '|' + SIM.raceState(R.race)); } return h.digest('hex').slice(0, 16); };
  for (const tid of TRACKS) for (const seed of SEEDS.slice(0, 2)) {
    const a = dig('zrcalno', tid, seed), b = dig('zrcalno', tid, seed), p = dig('zrcalno', tid, seed, true), ok = a === b && a === p; if (!ok) bad++;
    OUT.ponovi.push({ tid, seed, a, b, plain: p, ok }); rows.push([tid, seed, a, a === b ? 'enako' : 'DRUGAČE ' + b, a === p ? 'enako' : 'DRUGAČE ' + p]);
  }
  say('Ponovljivost, cv ' + CV + ' (prvih ' + Math.min(SECS, 120) + ' s dirke, celotno stanje vsakih 5 s)');
  table(['proga', 'seme', 'povzetek', 'drugič', 'Core brez števca'], rows);
  say(bad ? '  NAPAKA: ' + bad + ' dirk ni ponovljivih' : '  vse ponovljive: ' + rows.length + '/' + rows.length);
  if (bad) process.exitCode = 1;
}

// ---- zrcalo: the true mirror image ----
// (a) a made-up circuit (left and right bends, 4.6 m half width so the field meets the barriers) and its mirror image z → -z. The cars of
// the mirrored race are put where the mirror image of the first race's cars is (x, -z, -heading) before the first step.
// (b) the flat test road of tests/trki.test.js (straight, walls on both sides): a field of cars with scripted wheels and pedals (no
// autopilot), started mirrored about the middle line with the wheels mirrored; every third car starts nearly square to the barrier on its
// side (both front corners into it in one step: the case the order of the corners is about).
const CIRC = [[200, 215], [60, 215], [-90, 212], [-180, 200], [-226, 160], [-230, 95], [-200, 50], [-215, -10], [-180, -60], [-110, -75], [-60, -120], [5, -140], [60, -120], [70, -70], [25, -45], [10, 0], [50, 30], [120, 25], [180, -10], [240, -20], [270, 15], [260, 70], [285, 120], [280, 170], [250, 205]];
const ovalPts = (L, R) => { const p = [], r = Math.PI / 180;
  for (let x = 0; x < L; x += 100) p.push([x, 0]);
  for (let a = -90; a < 90; a += 15) p.push([L + R * Math.cos(a * r), R + R * Math.sin(a * r)]);
  for (let x = L; x > 0; x -= 100) p.push([x, 2 * R]);
  for (let a = 90; a < 270; a += 15) p.push([R * Math.cos(a * r), R + R * Math.sin(a * r)]);
  return p; };
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
// how far race B is from the mirror image of race A (z → -z): the largest of |xA - xB|, |zA + zB| (m) over the cars
const apart = (A, B) => { let d = 0; A.cars.forEach((a, i) => { const b = B.cars[i]; d = Math.max(d, Math.abs(a.x - b.x), Math.abs(a.z + b.z)); }); return d; };
function zrcalo() {
  OUT.zrcalo = {}; const rows = [];
  for (const cv of [1, CV]) for (const seed of SEEDS) {
    // (a) the circuit
    const mk = (pts) => { const C = core('zrcalno'); C.setTest({ cv }); const S = { L: side0(), R: side0(), first2: null, firstX: null, k: 0 }; counter(C, S);
      const T = new C.Track({ id: 'zrcalo', name: 'Krog, Preizkus', halfWidth: 4.6, points: pts, startX: 40, laps: 2, edgeBar: 0.5 });
      Math.random = SIM.seeded(seed); const race = new C.Race(T, Object.assign(SIM.SETUPS.race.opts(C, false, 'cs'), { seed: seed - 68, laps: 2 })); race.start(); return { C, race, S, k: 0 }; };
    const A = mk(CIRC), B = mk(CIRC.map(p => [p[0], -p[1]])), g0 = apart(A.race, B.race);
    B.race.cars.forEach((b, i) => { const a = A.race.cars[i], lk = b.locked; b.place(a.x, -a.z, -a.h); b.locked = lk; b.q = B.race.track.query(b.x, b.z, b.q ? b.q.i : 0, b.q); b.sPrev = b.q.s; b.dist = b.q.s - B.race.track.startS; });
    const d0 = apart(A.race, B.race); void g0;
    let first = null, at5 = null, at30 = null; const n = Math.round(Math.min(SECS, 240) / SIM.DT);
    for (let k = 1; k <= n && !(done(A) && done(B)); k++) { step(A); step(B); const d = apart(A.race, B.race); if (first == null && d > 1e-6) first = k; if (k === 600) at5 = d; if (k === 3600) at30 = d; }
    const ra = result(A), rb = result(B), o = { cv, seed, start: d0, first: first == null ? null : first * SIM.DT, at5, at30, dmg: [ra.dmg, rb.dmg], out: [ra.out, rb.out], win: [ra.win, rb.win], A: ra.S, B: rb.S };
    (OUT.zrcalo.krog = OUT.zrcalo.krog || []).push(o);
    rows.push([cv, seed, d0.toExponential(1), o.first == null ? 'nikoli' : f(o.first, 2), at5 == null ? '-' : at5.toExponential(1), at30 == null ? '-' : at30.toExponential(1), f(ra.dmg, 0) + ' / ' + f(rb.dmg, 0), ra.out + ' / ' + rb.out, ra.win === rb.win ? 'isti' : 'drug',
      ra.S.L.n1 + '/' + ra.S.L.n2 + '/' + ra.S.L.nx + ' ' + ra.S.R.n1 + '/' + ra.S.R.n2 + '/' + ra.S.R.nx, rb.S.R.n1 + '/' + rb.S.R.n2 + '/' + rb.S.R.nx + ' ' + rb.S.L.n1 + '/' + rb.S.L.n2 + '/' + rb.S.L.nx]);
  }
  say('(a) Krog in njegova zrcalna slika (z → -z), 13 avtov z avtopilotom, 2 kroga; odmik: največji |xA − xB|, |zA + zB| med avti (m)');
  table(['cv', 'seme', 'odmik na štartu', 'prvi odmik > 1e-6 s', 'odmik po 5 s', 'po 30 s', 'škoda Σ % A / B', 'izpadi', 'zmagovalec', 'A: L 1/2/par, D 1/2/par', 'B zrcalno: D, L'], rows);
  // (b) the flat road: scripted cars
  const rows2 = []; OUT.zrcalo.ravnina = [];
  for (const [cv, vr] of [[1, 'zrcalno'], [CV, 'zrcalno'], [CV, 'brez']]) for (const seed of SEEDS) for (const nCars of [1, 13]) {
    const mk = (sg) => { const C = core(vr); C.setTest({ cv }); const S = { L: side0(), R: side0(), first2: null, firstX: null, k: 0 }; counter(C, S);
      const T = new C.Track({ id: 'trki-oval', name: 'Ravnina, Preizkus', halfWidth: 6, points: ovalPts(1600, 220), startX: 50, edgeBar: 4, walls: [[100, 1400, 1, -1.5, 20], [100, 1400, -1, -1.5, 20]] });
      Math.random = SIM.seeded(64); const race = new C.Race(T, { numAI: nCars - 1, playerGrid: 1, laps: 99, playerModel: C.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs', noPlayer: false }); race.start();
      const rnd = SIM.seeded(seed), plan = [];
      race.cars.forEach((c, i) => { const row = i >> 1, d = (i % 2 ? 1 : -1) * (1.6 + rnd() * 1.4), th = i % 3 === 2 ? Math.sign(d) * (Math.PI / 2 + (rnd() - 0.5) * 0.12) : (rnd() - 0.5) * 0.3, v = 15 + rnd() * 25, x = 300 + row * 9 + rnd() * 2;
        c.place(x, sg * d, sg * th); c.locked = false; c.steer = 0; c.digitalSteer = true; c.vx = Math.cos(sg * th) * v; c.vz = Math.sin(sg * th) * v; c.w = 0;
        const M = c.m; for (let g = 1; g <= M.gears.length; g++) { c.gear = g; if (v / M.rw * M.gears[g - 1] * M.final * 9.5493 < M.redline * 0.9) break; }
        c.q = T.query(c.x, c.z, 0, c.q); c.sPrev = c.q.s; c.dist = c.q.s - T.startS;
        plan.push({ p: rnd() * 6.28, w: 0.6 + rnd() * 1.4, a: 0.1 + rnd() * 0.4, thr: 0.4 + rnd() * 0.6 }); });
      return { C, race, S, k: 0, plan, sg, T }; };
    const drive = (R) => { R.k++; R.S.k = R.k; const t = R.k * SIM.DT; Math.random = SIM.seeded(1000 + R.k);
      R.race.cars.forEach((c, i) => { const p = R.plan[i]; c.hitWall = 0; c.hitCar = 0; c.hitDebris = 0; c.inSteer = R.sg * p.a * Math.sin(p.p + p.w * t); c.inThr = p.thr; c.inBrk = 0; c.inHand = 0; });
      const C = R.C, cars = R.race.cars, T = R.T;   // (as the race does: every car's own step, then the pairs in the order of the field, then the barrier)
      for (const c of cars) { c.steer += C.clamp(c.inSteer - c.steer, -6 * SIM.DT, 6 * SIM.DT); c.step(SIM.DT, T); }
      for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) C.carCollide(cars[i], cars[j]);
      for (const c of cars) { C.wallCollide(c, T, true, null, SIM.DT); T.query(c.x, c.z, c.q.i, c.q); } };
    const A = mk(1), B = mk(-1), d0 = apart(A.race, B.race); let first = null, mx = 0; const n = Math.round(12 / SIM.DT);
    for (let k = 1; k <= n; k++) { drive(A); drive(B); const d = apart(A.race, B.race); if (first == null && d > 1e-9) first = k; if (d > mx) mx = d; }
    const ra = result(A), rb = result(B), o = { cv, vr, seed, cars: nCars, start: d0, first: first == null ? null : first * SIM.DT, max: mx, dmg: [ra.dmg, rb.dmg], A: ra.S, B: rb.S };
    OUT.zrcalo.ravnina.push(o);
    rows2.push([cv, vr, seed, nCars, d0.toExponential(1), o.first == null ? 'nikoli' : f(o.first, 3), mx.toExponential(1), f(ra.dmg, 1) + ' / ' + f(rb.dmg, 1), ra.S.L.n1 + '/' + ra.S.L.n2 + '/' + ra.S.L.nx + ' ' + ra.S.R.n1 + '/' + ra.S.R.n2 + '/' + ra.S.R.nx, rb.S.R.n1 + '/' + rb.S.R.n2 + '/' + rb.S.R.nx + ' ' + rb.S.L.n1 + '/' + rb.S.L.n2 + '/' + rb.S.L.nx]);
  }
  say('\n(b) Ravna preizkusna cesta z ograjo na obeh straneh, avti z zapisanim volanom in plinom (brez avtopilota), zrcalni štart, 12 s');
  table(['cv', 'različica', 'seme', 'avtov', 'odmik na štartu', 'prvi odmik > 1e-9 s', 'največji odmik m', 'škoda Σ % A / B', 'A: L 1/2/par, D 1/2/par', 'B zrcalno: D, L'], rows2);
}

const orig = Math.random;
try { if (PART === 'dirke') dirke(); else if (PART === 'zrcalo') zrcalo(); else if (PART === 'ponovi') ponovi(); else { console.error('uporaba: node tools/trki/zrcalne-dirke.js dirke|zrcalo|ponovi [proge] [--seeds ...] [--var ...]'); process.exitCode = 2; } }
finally { Math.random = orig; }
if (JSON_OUT) console.log(JSON.stringify(OUT));
