// Analiza kroga (js/analiza.js, docs/analiza-kroga.md; no browser, the game's hooks in tests/browser/analiza.test.mjs): a lap traced
// every 10 m as the game traces it (a real race on Spa, Belgija, the player driven by the AI), its time at the line, the trace stored and
// read back, the corners in order from the line, a lap against itself (no difference), and the tips: a lap that brakes 40 m early for a
// corner, one that takes a corner slower, one that is faster (a new best lap), all within 0.1 s (even).
//   node tests/analiza.test.js
'use strict';
const path = require('path');
const { loadCore } = require('./lib/core.js');
const A = require(path.join(__dirname, '..', 'js', 'analiza.js'));

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const seeded = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };

const def = C.TRACKS.find(d => d.id === 'spa'), T = new C.Track(def);
Math.random = seeded(7);
const r = new C.Race(T, { numAI: 3, playerGrid: 1, laps: 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 5, difficulty: 1 });
r.start();
const P = r.player, DT = 1 / 120, laps = [];
let cur = null, lap = -1;
for (let k = 0; k < 120 * 60 * 12 && !P.finished; k++) {
  C.aiControl(P, r, DT); r.step(DT);
  if (r.state === 'grid') continue;
  if (P.lap !== lap) {
    if (cur && P.lapTimes.length) { const e = A.end(cur, P.lapTimes[P.lapTimes.length - 1]); if (e) laps.push(e); }
    lap = P.lap; cur = P.lap >= 1 && !P.finished ? A.start(T.len) : null;
  }
  if (cur) A.step(cur, P.dist - (P.lap - 1) * T.len, r.time - P.lapStart, P.speed, P.inBrk || 0, P.inThr || 0, !!P.inPit);
}
check('three laps traced', laps.length === 3, laps.length + ' laps');
const L2 = laps[1];
check('a lap: every bin crossed, its time at the line', L2 && L2.ok && Math.abs(L2.t[L2.nb] - P.lapTimes[1]) < 1e-3 && L2.hit >= L2.nb * 0.95, L2 && `${L2.hit}/${L2.nb}, ${L2.t[L2.nb].toFixed(3)} s`);
let mono = true; for (let k = 1; k <= L2.nb; k++) if (!(L2.t[k] >= L2.t[k - 1])) mono = false;
check('the lap clock only goes on', mono);
check('the lap brakes and the speed is there', L2.b.some(x => x > 0.5) && Math.max(...L2.v) > 40, `max ${(Math.max(...L2.v) * 3.6).toFixed(0)} km/h`);

const O = JSON.parse(JSON.stringify(A.pack(L2))), U = A.unpack(O, T.len);
check('stored and read back (a few KB)', U && Math.abs(U.lt - L2.lt) < 0.001 && Math.abs(U.t[300] - L2.t[300]) < 0.006 && JSON.stringify(O).length < 20000, JSON.stringify(O).length + ' B');
check('another length: not this track\'s', A.unpack(O, T.len + 50) === null && A.unpack({ v: 9 }, T.len) === null);

const CS = A.lapCorners(T);
let ord = CS.length > 8; for (let i = 1; i < CS.length; i++) if (!(CS[i].a0 > CS[i - 1].a0)) ord = false;
check('corners in order from the line', ord && CS.every(c => c.a0 >= 0 && c.a1 >= c.a0 && c.a0 < T.len), CS.length + ' corners');

const self = A.compare(L2, L2, CS);
check('a lap against itself: no difference, even', Math.abs(self.delta) < 1e-6 && self.tip.kind === 'even' && self.zones.length === CS.length);
const sum = self.zones.reduce((s, z) => s + z.loss, 0), real = A.compare(laps[2], L2, CS), sumR = real.zones.reduce((s, z) => s + z.loss, 0);
check('the zones cover the whole lap', self.zones[0].d0 === 0 && self.zones[self.zones.length - 1].d1 === T.len && Math.abs(sumR - real.delta) < 0.01, `${sumR.toFixed(3)} vs ${real.delta.toFixed(3)} s`);

// a made lap: a copy of the best one (as stored) changed in one zone, compared with the stored one
const Lr = A.unpack(A.pack(L2), T.len);
function variant(z, f) {
  const V = A.unpack(A.pack(L2), T.len), B = A.B;
  f(V, z, B);
  for (let k = 1; k <= V.nb; k++) if (V.t[k] < V.t[k - 1]) V.t[k] = V.t[k - 1];
  V.lt = V.t[V.nb];
  return V;
}
const zs = self.zones, braked = zs.filter(z => z.c && (() => { for (let i = Math.floor(z.d0 / 10); i <= Math.floor(z.c.a1 / 10); i++) if (L2.b[i] > 0.3) return true; return false; })() && z.c.a0 - z.d0 > 120);
const Z = braked[1] || braked[0];
check('a corner the lap brakes for, with a long run to it', !!Z, Z && `corner ${Z.n}`);
if (Z) {
  const B = 10, bp = (() => { for (let i = Math.floor(Z.d0 / B); i <= Math.floor(Z.c.a1 / B); i++) if (L2.b[i] > 0.3) return i; return -1; })();
  const early = variant(Z, (V) => { for (let i = bp - 4; i < bp; i++) V.b[i] = 1; for (let k = bp - 4; k <= V.nb; k++) V.t[k] += 0.35 * Math.min(1, (k - bp + 4) / 8); });
  const e = A.compare(early, Lr, CS);
  check('brakes 40 m early: »Prezgodaj zaviraš pred N. ovinkom«', e.tip.kind === 'early' && e.tip.n === Z.n && e.tip.m >= 30 && e.tip.m <= 50 && e.worst.n === Z.n, JSON.stringify(e.tip));
  const a0 = Math.floor(Z.c.a0 / B), a1 = Math.floor(Z.c.a1 / B);
  const slow = variant(Z, (V) => { for (let i = a0 - 2; i <= a1; i++) V.v[i] *= 0.85; for (let k = a0; k <= V.nb; k++) V.t[k] += 0.4 * Math.min(1, (k - a0) / Math.max(1, a1 - a0)); });
  const s = A.compare(slow, Lr, CS);
  check('slower through the corner: »Skozi N. ovinek pelji hitreje«', s.tip.kind === 'slow' && s.tip.n === Z.n && s.tip.v > s.tip.vc, JSON.stringify(s.tip));
  const fast = variant(Z, (V) => { for (let k = a0; k <= V.nb; k++) V.t[k] -= 0.3 * Math.min(1, (k - a0) / Math.max(1, a1 - a0)); });
  const f = A.compare(fast, Lr, CS);
  check('faster: a new best lap, its gain in that corner', f.delta < -0.29 && f.tip.kind === 'gain' && f.tip.n === Z.n, JSON.stringify(f.tip));
  const red = s.rate.slice(a0, a1 + 1).some(x => x > 0.005) && s.rate.slice(0, a0 - 12).every(x => Math.abs(x) < 1e-4);
  check('the map: red only where the time was lost', red);
}
// a lap missing a stretch (a rescue forward): filled in, still a lap
const R2 = A.start(1000); for (let d = 0; d <= 1000; d += 2) { if (d > 400 && d < 520) continue; A.step(R2, d, d / 40, 40, 0, 1, false); } A.end(R2, 25);
check('a stretch missing: the bins filled in between', R2.ok && R2.t.every(Number.isFinite) && Math.abs(R2.t[46] - 11.5) < 0.2, R2.t[46].toFixed(2));
const R3 = A.start(1000); for (let d = 0; d <= 500; d += 2) A.step(R3, d, d / 40, 40, 0, 1, false); A.end(R3, 30);
check('half a lap: no lap to compare', !R3.ok);

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
