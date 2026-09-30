// The rally stage's extras (Ouninpohja): the co-driver's pace notes, the puddles of a race in the rain, the famous jump and the
// medal times; the stage the other way round (ouninpohja-r). Fast checks on the track data and the core (the races themselves:
// races.test.js, also in the rain).
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
  T.inRain = false; const dry = [T.surface(q), T.surface(q2)];
  T.inRain = true; const wet = [T.surface(q), T.surface(q2)]; T.inRain = false;
  check('surfaces: makadam 5 in the dry; in the rain the puddle 6, the road around it makadam', dry[0] === 5 && dry[1] === 5 && wet[0] === 6 && wet[1] === 5, `dry ${dry}, wet ${wet}`);
}

// a race in the rain: the puddles only while it steps (the track is shared with a dry race), every car on the wet grip and in a puddle
// slower still; the puddle a surface of the core's own (not on any other track)
{
  const mk = (rain) => new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
  const dry = mk(0), wet = mk(1);
  wet.step(1 / 120); const w1 = T.inRain; dry.step(1 / 120); const w2 = T.inRain;
  check('rain: the track has its puddles while the wet race steps, none for the dry one; the wet grip on the car', w1 === true && w2 === false && wet.player.wet < 1 && dry.player.wet === 1, `wet ${w1}, then dry ${w2}; grip ${wet.player.wet} / ${dry.player.wet}`);
  const others = C.TRACKS.filter(d => !d.rally && d.rain);
  check('puddles only on the rally stages (def.rain)', !others.length, others.map(d => d.id).join(', '));
}

// the famous jump and the medals
{
  const J = def.jumpRec, big = jumps.reduce((a, j, k) => j.h > jumps[a].h ? k : a, 0);
  check('jump record: the Yellow House is the biggest jump, Märtin\'s 57 m', J.bump === big && J.m === 57 && /Märtin/.test(J.by), `bump ${J.bump} (biggest ${big}), ${J.m} m`);
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  check('medals: gold < silver < bronze for both physics, dry and wet; the rain slower', asc(M.cs) && asc(M.arcade) && asc(M.wet.cs) && asc(M.wet.arcade) && M.wet.cs[0] > M.cs[0] && M.wet.arcade[0] > M.arcade[0],
    `cs ${M.cs}, arcade ${M.arcade}, wet cs ${M.wet.cs}, wet arcade ${M.wet.arcade}`);
}

// the other way round (as before 1995): the same road reversed (and run on past this finish), the same crests, its own start and finish,
// the places in the reverse order, the co-driver's notes for this direction, its own medals and no famous record at the Yellow House
{
  const R = C.TRACKS.find(d => d.id === 'ouninpohja-r'); check('the reverse stage is on the track list', !!R); if (R) {
    const TR = new C.Track(R), n = def.points.length, rp = R.points.slice(0, n).reverse();
    const same = rp.every((p, k) => p[0] === def.points[k][0] && p[1] === def.points[k][1]) && R.points.length > n;
    check('reverse: the same road the other way (and on past its finish), the same heights and crests', same && R.bumps.length === def.bumps.length && JSON.stringify(R.elev) === JSON.stringify(def.elev),
      `${R.points.length} points (${n} forward), ${R.bumps.length} bumps`);
    const crests = def.bumps.map(b => { const i = T.idx(b.at * T.len); return [T.px[i], T.pz[i]]; }), rc = R.bumps.map(b => { const i = TR.idx(b.at * TR.len); return [TR.px[i], TR.pz[i]]; });
    check('reverse: every crest where it is on the forward stage (within 5 m: two 2 m samples)', crests.every((c, k) => Math.hypot(c[0] - rc[k][0], c[1] - rc[k][1]) < 5), crests.map((c, k) => Math.hypot(c[0] - rc[k][0], c[1] - rc[k][1]).toFixed(1)).join(' '));
    const names = TR.names.map(q => q.n), fwd = T.names.map(q => q.n).reverse();
    check('reverse: the places in the reverse order, from Hassintie to Hämepohja', names.join('|') === fwd.join('|') && names[0] === 'Hassintie' && names[names.length - 1] === 'Hämepohja', names.join(', '));
    check('reverse: ~9.8 km, the run-out past the finish at least 250 m', TR.raceLen > 9500 && TR.raceLen < 10100 && TR.len - TR.finishS >= 250, `${TR.raceLen.toFixed(0)} m, ${(TR.len - TR.finishS).toFixed(0)} m past the finish`);
    const N = TR.paceNotes(), fN = T.paceNotes(), nJ = N.reduce((a, q) => a + (q.text.match(/\bjump\b|\bcrest\b/g) || []).length, 0);
    check('reverse: its own pace notes (the corners the other way), every jump and crest read', N.length > 25 && nJ === R.bumps.length && N.map(q => q.text).join('|') !== fN.map(q => q.text).join('|'), `${N.length} calls, ${nJ} jumps and crests`);
    const M = R.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
    check('reverse: its own medals, gold < silver < bronze, the rain slower; the Yellow House without a famous record', asc(M.cs) && asc(M.arcade) && asc(M.wet.cs) && asc(M.wet.arcade) && M.wet.cs[0] > M.cs[0] && R.jumpRec && R.jumpRec.bump === def.jumpRec.bump && !R.jumpRec.m,
      `cs ${M.cs}, arcade ${M.arcade}`);
  }
}

console.log(bad ? `FAIL: ${bad} check(s)` : 'OK: all rally checks');
process.exit(bad ? 1 : 0);
