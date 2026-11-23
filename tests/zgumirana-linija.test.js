// The rubbered-in line by the player's driving (docs/zgumirana-linija.md; Core only, no browser): Track.voznjaLinija gives a track the
// rubber's line, where the LOOK of its rubber goes (Track gl: the layer that builds up, the marbles beside it, the worlds' darker band and
// marks), and how hard the tyres work along it (gld, the layer's weight). On a road the player has driven it is their measured line
// (js/data/voznja.js, VOZNJA_PROFILI: Tianmen), elsewhere the line of their style (VOZNJA_SLOG: Spa), always on the road; without a dry
// profile of theirs the track keeps the computed line (gl is rl itself, the same array). The look only: the grip of the rubber and of the
// marbles stays on the computed line, and a race on a track with the player's line is the same to the last bit as on one without it
// (the driving physics is not changed). In the page: tests/browser/zgumirana-linija.test.mjs.
//   node tests/zgumirana-linija.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadCore, ROOT } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const cx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'data', 'voznja.js'), 'utf8') + '\n;this.L = VOZNJA_PROFILI; this.S = VOZNJA_SLOG;', cx, { filename: 'js/data/voznja.js' });
const L = Array.from(cx.L), S = cx.S;
const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const mine = (T) => L.filter(p => p.proga === T.def.id).concat(S ? [S] : []);   // (what js/game.js getTrack gives a real track)
const f2 = (x) => x.toFixed(2), pc = (x) => (x * 100).toFixed(0) + ' %';
// the rubber's line against the computed one: the most it is moved (m, and where), the mean, the share of the track moved by more than
// 0.3 m and the share not moved at all, the samples off the road (past the car's half width and a margin, 1.7 m, inside the edge, unless
// the computed line itself runs further out there)
function moved(T) {
  let mx = 0, at = 0, sum = 0, mv = 0, same = 0, out = 0;
  for (let i = 0; i < T.N; i++) {
    const d = Math.abs(T.gl[i] - T.rl[i]), lim = Math.max(Math.max(0, T.wAt(i) - 1.7), Math.abs(T.rl[i]));
    if (d > mx) { mx = d; at = i; }
    sum += d; if (d > 0.3) mv++; if (d < 0.02) same++; if (Math.abs(T.gl[i]) > lim + 1e-4) out++;
  }
  return { mx, at, mean: sum / T.N, mv: mv / T.N, same: same / T.N, out };
}
const say = (T, m) => `the most ${f2(m.mx)} m at ${Math.round(m.at * T.ds)} m, mean ${f2(m.mean)} m, ${pc(m.mv)} moved by more than 0.3 m, ${pc(m.same)} not moved, ${m.out} samples off the road`;
// the tyres' load along the line: within 0..1, high somewhere (the braking, the bends) and low somewhere (the straights)
function load(T) {
  const g = T.gld; let lo = 1, hi = 0, bad = 0;
  if (!(g instanceof Float32Array) || g.length !== T.N) return { ok: false, txt: 'no gld' };
  for (let i = 0; i < T.N; i++) { if (!(g[i] >= 0 && g[i] <= 1)) bad++; lo = Math.min(lo, g[i]); hi = Math.max(hi, g[i]); }
  return { ok: !bad && hi > 0.6 && lo < 0.2, txt: `gld ${f2(lo)} to ${f2(hi)}${bad ? ', ' + bad + ' outside 0..1' : ''}` };
}

// 1. a road the player has driven (Tianmen, an open road): the rubber's line is their measured line
{
  const T = track('tianmen'), P = L.find(p => p.proga === 'tianmen' && !p.razredi);
  check('a new track: the rubber\'s line is the computed one (the same array), no load along it', T.gl === T.rl && T.gld === null);
  const ok = T.voznjaLinija(mine(T)), m = moved(T), g = load(T);
  check('Tianmen (driven by the player): the track has the player\'s line, a line of its own', ok === true && !!P && T.gl !== T.rl && T.gl instanceof Float32Array && T.gl.length === T.N,
    `voznjaLinija ${ok}, the profile ${P ? P.dd.length + ' nodes every ' + (P.korak || 5) + ' m' : 'none'}`);
  check('it is metres from the computed line in the bends, on most of the road, never off the road', m.mx > 2 && m.mx < 9 && m.mv > 0.4 && m.out === 0, say(T, m));
  // the measured offsets themselves: from the start line to the profile's last node the line is the computed one plus the profile's dd
  // (one value every korak m from the start line, read between its two nodes, as the cars read it), kept on the road; before the start
  // line and past the last node the computed line itself
  let k = 0, kept = 0, off = 0, worst = 0, rest = 0, restOff = 0;
  for (let i = 0; P && i < T.N; i++) {
    const st = P.korak || 5, A = P.dd, sp = i * T.ds - T.startS;
    if (sp < 0 || sp > (A.length - 1) * st) { rest++; if (T.gl[i] !== T.rl[i]) restOff++; continue; }
    const j = Math.min(A.length - 2, Math.floor(sp / st)), dd = A[j] + (A[j + 1] - A[j]) * (sp / st - j);
    const lim = Math.max(Math.max(0, T.wAt(i) - 1.7), Math.abs(T.rl[i])), want = Math.max(-lim, Math.min(lim, T.rl[i] + dd));
    k++; if (want !== T.rl[i] + dd) kept++;
    const e = Math.abs(T.gl[i] - want); if (e > 0.002) off++; worst = Math.max(worst, e);
  }
  check('it is the computed line plus the measured offset, kept on the road; before the start line and past the profile the computed line', k > 2000 && off === 0 && rest > 20 && restOff === 0,
    `${k} samples along the profile (${kept} kept on the road), the worst ${worst.toFixed(4)} m off; ${rest} samples outside it, ${restOff} of them moved`);
  check('the tyres\' load along it: 0..1, high in the braking and the bends, low on the straights', g.ok, g.txt);
  const T2 = track('tianmen'), ok2 = T2.voznjaLinija([S]); let df = 0; for (let i = 0; i < T.N; i++) df = Math.max(df, Math.abs(T.gl[i] - T2.gl[i]));
  check('the measured profile goes before the style: the style alone gives the road another line', ok2 === true && df > 0.5, `the style's line up to ${f2(df)} m from the measured one`);
  check('a line taken away again (no profile): the computed one, the same array', T.voznjaLinija([]) === false && T.gl === T.rl && T.gld === null);
}

// 2. a circuit the player has not driven (Spa): the line of their style, the bends moved, the straights as they were
{
  const T = track('spa'), M0 = T.marbles(), c0 = Float32Array.from(M0.c), k0 = Float32Array.from(M0.k), h0 = Float32Array.from(M0.h);
  const none = L.filter(p => p.proga === 'spa').length === 0, ok = T.voznjaLinija(mine(T)), m = moved(T), g = load(T), R = C.RUB;
  check('Spa (not driven by the player): the track has the line of their style', none && ok === true && T.gl !== T.rl && T.gl.length === T.N, `voznjaLinija ${ok}, ${L.filter(p => p.proga === 'spa').length} profiles of its own`);
  check('it is moved in the bends by metres, the straights are as they were, never off the road', m.mx > 1 && m.mx < 5 && m.mv > 0.05 && m.mv < 0.6 && m.same > 0.2 && m.out === 0, say(T, m));
  check('the tyres\' load along it: 0..1, high in the braking and the bends, low on the straights', g.ok, g.txt);
  // the grip stays on the computed line: the rubber's (Track.rubberAt) and the marbles' band (Track.marbles, found off rl, kept)
  let on = 0; for (let i = 0; i < T.N; i++) if (T.rubberAt(i, T.rl[i]) === 1) on++;
  check('the rubber\'s grip is on the computed line: all of it there, none on the player\'s line where that is further than RUB.out m', on === T.N && m.mx > R.out && T.rubberAt(m.at, T.gl[m.at]) === 0,
    `${on} of ${T.N} samples, at ${Math.round(m.at * T.ds)} m rubberAt on the player's line ${T.rubberAt(m.at, T.gl[m.at])}`);
  const MG = T.marblesAlong(T.gl), M1 = T.marbles(); let same = M1 === M0, dc = 0;
  for (let i = 0; i < T.N; i++) { if (M1.c[i] !== c0[i] || M1.k[i] !== k0[i] || M1.h[i] !== h0[i]) same = false; dc = Math.max(dc, Math.abs(MG.c[i] - c0[i])); }
  check('the marbles\' grip is the computed line\'s band as before; the band for the look, off the player\'s line, is another', same && MG !== M1 && dc > 0.5, `the look's band up to ${f2(dc)} m from the grip's`);
  // what gives a track no line: nothing, a profile of another road, a profile of the wet or of the winter
  const A = track('spa'), tm = L.filter(p => p.proga === 'tianmen'), wet = [Object.assign({}, S, { vreme: 'mokro' })], zima = [Object.assign({}, S, { vreme: 'zima' })];
  const no = [A.voznjaLinija(null), A.voznjaLinija([]), A.voznjaLinija(tm), A.voznjaLinija(wet), A.voznjaLinija(zima)];
  check('no line without a dry profile of the player\'s: none given, another road\'s, the wet\'s, the winter\'s', tm.length > 0 && no.every(x => x === false) && A.gl === A.rl && A.gld === null, no.join(' '));
}

// 3. the driving is not changed: the same race on a track with the player's line and on one without it, to the last bit (a circuit with
// tyres, where the rubber and the marbles build up and are gripped on, and the open road), every car's place and speed
{
  const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
  const run = (id, o, tEnd, line) => {
    const T = track(id), had = line ? T.voznjaLinija(mine(T)) : false;
    Math.random = seeded(3);
    const r = new C.Race(T, opts(o)), P = r.player; r.start(); let t = 0, k = 0;
    while (t < tEnd) { Math.random = seeded(5000 + (++k)); if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); C.aiControl(P, r, DT); r.step(DT); t += DT; }
    return { had, mb: r.mb ? [r.mb.d, r.mb.lv, r.mb.rb] : null, cars: r.cars.map(c => [c.x, c.y, c.z, c.h, c.vl, c.q ? c.q.i : -1, c.q ? c.q.d : 0]), far: Math.max(...r.cars.map(c => c.q ? c.q.i : 0)) * T.ds };
  };
  const rnd = Math.random;
  for (const [id, o, tEnd, name] of [['spa', { tyres: true, compounds: true }, 75, 'Spa, 13 cars with tyres, 75 s'], ['tianmen', {}, 40, 'Tianmen, 13 cars up the road, 40 s']]) {
    const a = run(id, o, tEnd, false), b = run(id, o, tEnd, true);
    check(`${name}: the race on the track with the player's line is the same to the last bit`, !a.had && b.had && JSON.stringify(a.cars) === JSON.stringify(b.cars) && JSON.stringify(a.mb) === JSON.stringify(b.mb) && a.far > 300,
      `the first car ${Math.round(a.far)} m on${a.mb ? `, rubber laid ${a.mb[2].toFixed(4)}, marbles ${a.mb[1].toFixed(4)}` : ', no rubber laid by a race (an open road)'}`);
  }
  Math.random = rnd;
}

console.log(`\n${n - bad} of ${n} checks passed`);
process.exit(bad ? 1 : 0);
