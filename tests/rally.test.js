// The rally stage's extras (Ouninpohja): the co-driver's pace notes, the puddles and the wet surfaces of a race in the rain, the
// famous jump and the medal times. Fast checks on the track data and the core (the races themselves: races.test.js, also wet).
//   node tests/rally.test.js
'use strict';
const { loadCore } = require('./lib/core.js');

const C = loadCore();
let bad = 0;
const check = (name, ok, info) => { if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${info ? ' — ' + info : ''}`); };

const def = C.TRACKS.find(d => d.id === 'ouninpohja'), T = new C.Track(def), jumps = def.bumps.map(b => ({ c: b.at * T.len, w: b.w || 8, h: b.h }));
const dAt = (s) => Math.round(s - T.startS);   // (metres after the start line)

// the co-driver: calls in order along the run, every jump and every bend read once, the famous places in their words
{
  const N = T.paceNotes(), text = N.map(n => n.text).join(' | ');
  const inOrder = N.every((n, k) => n.e >= n.s && (k === 0 || n.s > N[k - 1].s)), inRun = N.every(n => n.s >= T.startS && n.s < T.finishS);
  const words = (n) => (n.text.match(/\bjump\b|\bcrest\b/g) || []).length;
  const nJumps = N.reduce((a, n) => a + words(n), 0);
  check('pace notes: calls in order within the run, every jump and crest read', N.length > 25 && inOrder && inRun && nJumps === jumps.length, `${N.length} calls, ${nJumps} jumps and crests read of ${jumps.length}`);
  const at = (d) => N.find(n => Math.abs(dAt(n.s) - d) < 60), J = jumps[def.jumpRec.bump];
  const yellow = N.find(n => n.s <= J.c && n.e >= J.c - J.w * 0.8 - 1 && /big jump/.test(n.text));
  check('pace notes: the Yellow House is a big jump, Mutanen and the village square lefts, Kakaristo a hairpin right',
    !!yellow && /square left/.test((at(3060) || {}).text) && /square left/.test((at(6305) || {}).text) && /hairpin right/.test((at(8811) || {}).text),
    `Yellow House "${yellow && yellow.text}", Mutanen "${(at(3060) || {}).text}", village "${(at(6305) || {}).text}", Kakaristo "${(at(8811) || {}).text}"`);
  check('pace notes: distances only in hundreds and fifties, the last call to the finish', /, (one|two|three|four|five) (hundred|fifty)/.test(text) && /to finish$/.test(N[N.length - 1].text), `last "${N[N.length - 1].text}"`);
}

// the puddles: on the road, apart, never from a jump's approach to its landing; surfaces: dry makadam 5, in the rain 6, in a puddle 7
{
  const P = T.puddles;
  const onRoad = P.every(([s, d, hl, hw]) => Math.abs(d) + hw <= T.w && hl > 1 && hw > 0.5), apart = P.every((p, k) => k === 0 || p[0] - P[k - 1][0] > 30);
  const clear = P.every(([s]) => jumps.every(j => s < j.c - 2.2 * j.w - 25 || s > j.c + 1.6 * j.w + 10));
  check('puddles: as many as def.rain asks, on the road, 30 m apart, none on a jump', P.length === def.rain.puddles && onRoad && apart && clear, `${P.length} puddles`);
  const [s, d] = P[5], q = T.query(...(() => { const i = T.idx(s); return [T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d]; })(), T.idx(s), {});
  const q2 = T.query(T.px[T.idx(s + 15)], T.pz[T.idx(s + 15)], T.idx(s + 15), {});
  T.wet = false; const dry = [T.surface(q), T.surface(q2)];
  T.wet = true; const wet = [T.surface(q), T.surface(q2)]; T.wet = false;
  check('surfaces: dry makadam 5; in the rain the road 6 and the puddle 7', dry[0] === 5 && dry[1] === 5 && wet[0] === 7 && wet[1] === 6, `dry ${dry}, wet ${wet}`);
}

// a race in the rain: the track wet while it steps, a slower autopilot line; a dry race keeps no weather of its own (its state is as before)
{
  const mk = (wet) => new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, wet });
  const dry = mk(false), wet = mk(true);
  wet.step(1 / 120); const w1 = T.wet; dry.step(1 / 120); const w2 = T.wet;
  let slower = 0, n = 0; for (let i = T.startIdx; i < T.finishIdx; i += 20) { n++; if (wet.vprof[i] <= dry.vprof[i] + 1e-6) slower++; }
  check('rain: the track wet while the wet race steps, dry for the dry one; the autopilot never faster in the rain', w1 === true && w2 === false && slower === n, `wet ${w1}, then dry ${w2}; ${slower}/${n} samples no faster`);
  check('rain: a dry race has no weather key (its state and so the golden digests are as before)', !('wet' in dry) && wet.wet === true && !('wet' in new C.Race(new C.Track(C.TRACKS[0]), { numAI: 0, phys: 'cs', wet: true })), 'a circuit without def.rain stays dry too');
}

// the famous jump and the medals
{
  const J = def.jumpRec, big = jumps.reduce((a, j, k) => j.h > jumps[a].h ? k : a, 0);
  check('jump record: the Yellow House is the biggest jump, Märtin\'s 57 m', J.bump === big && J.m === 57 && /Märtin/.test(J.by), `bump ${J.bump} (biggest ${big}), ${J.m} m`);
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  check('medals: gold < silver < bronze for both physics, dry and wet; the rain slower', asc(M.cs) && asc(M.arcade) && asc(M.wet.cs) && asc(M.wet.arcade) && M.wet.cs[0] > M.cs[0] && M.wet.arcade[0] > M.arcade[0],
    `cs ${M.cs}, arcade ${M.arcade}, wet cs ${M.wet.cs}, wet arcade ${M.wet.arcade}`);
}

console.log(bad ? `FAIL: ${bad} check(s)` : 'OK: all rally checks');
process.exit(bad ? 1 : 0);
