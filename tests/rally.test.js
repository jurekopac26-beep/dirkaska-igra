// The rally stages' extras (Ouninpohja, Harju): the co-driver's pace notes, the puddles of a race in the rain, the famous jump and the
// medal times; Harju's sections (the road's width and surface: tarmac, the esker's gravel, the school yard's paving stones). Fast checks on
// the track data and the core (the races themselves: races.test.js, also in the rain).
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
  const others = C.TRACKS.filter(d => d.rain && !d.rally);
  check('puddles only on the rally stages (def.rain)', !others.length, others.map(d => d.id).join(', '));
}

// the famous jump and the medals
{
  const J = def.jumpRec, big = jumps.reduce((a, j, k) => j.h > jumps[a].h ? k : a, 0);
  check('jump record: the Yellow House is the biggest jump, Märtin\'s 57 m', J.bump === big && J.m === 57 && /Märtin/.test(J.by), `bump ${J.bump} (biggest ${big}), ${J.m} m`);
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  check('medals: gold < silver < bronze, dry and wet; the rain slower', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0],
    `dry ${M.cs}, wet ${M.wet.cs}`);
}

// Harju, the city stage: the road's width and surface by section (tarmac down Yliopistonkatu and back up it, the esker's gravel up the ridge, the
// school yard's paving stones), the puddles of the rain only on its gravel, the co-driver's calls (the first hairpin, onto the gravel, onto the
// cobbles, back onto tarmac at Norssi), the barriers on the open road (the concrete blocks between the two carriageways), the medals
{
  const hd = C.TRACKS.find(d => d.id === 'harju'), H = new C.Track(hd), at = (d) => H.idx(H.startS + d), K = (s) => H.sf[at(s)];
  const wmin = Math.min(...H.wa), wmax = Math.max(...H.wa);
  check('Harju: the road half width by section (3-5 m), the surfaces: tarmac on the boulevard, gravel up the ridge, paving stones by the school',
    !!H.wa && wmin >= 2.9 && wmin <= 3.1 && wmax >= 4.7 && K(50) === 0 && K(300) === 0 && K(600) === 5 && K(900) === 0 && K(1900) === 4 && K(2010) === 0,
    `half width ${wmin.toFixed(2)}-${wmax.toFixed(2)} m, surfaces at 50/300/600/900/1900/2010 m: ${[50, 300, 600, 900, 1900, 2010].map(K).join(',')}`);
  const P = H.puddles, onGravel = P.every(([s]) => H.sf[H.idx(s)] === 5);
  check('Harju: the puddles as many as def.rain asks, only on the gravel', P.length === hd.rain.puddles && onGravel, `${P.length} puddles, on the gravel: ${onGravel}`);
  const N = H.paceNotes(), txt = N.map(n => n.text);
  check('Harju: the co-driver: the first hairpin left, onto the gravel, onto the cobbles, back onto tarmac, the chicanes', /^hairpin left/.test(txt[0]) && txt.some(x => /hairpin right onto gravel/.test(x)) &&
    txt.some(x => /onto cobbles/.test(x)) && /onto tarmac/.test(txt[txt.length - 1]) && txt.filter(x => /chicane/.test(x)).length === hd.chicanes.length,
    `${N.length} calls: "${txt[0]}" ... "${txt[txt.length - 1]}"`);
  const i1 = at(60), i2 = at(250);   // (the sprint down and the climb back up: the concrete blocks right at the left edge, the sidewalk's crowd fence on the right)
  check('Harju: the barriers down and back up the boulevard: the blocks between the carriageways at the edge, the fences on the sidewalks further out',
    H.bl[i1] - H.wa[i1] < 0.4 && H.bl[i2] - H.wa[i2] < 0.4 && H.br[i1] - H.wa[i1] > 2.5 && H.br[i2] - H.wa[i2] > 2.5, `left ${(H.bl[i1] - H.wa[i1]).toFixed(2)}/${(H.bl[i2] - H.wa[i2]).toFixed(2)}, right ${(H.br[i1] - H.wa[i1]).toFixed(2)}/${(H.br[i2] - H.wa[i2]).toFixed(2)} m past the edge`);
  const M = hd.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  check('Harju: medals gold < silver < bronze for both physics, dry and wet; the rain slower', asc(M.cs) && asc(M.arcade) && asc(M.wet.cs) && asc(M.wet.arcade) && M.wet.cs[0] > M.cs[0] && M.wet.arcade[0] > M.arcade[0],
    `cs ${M.cs}, arcade ${M.arcade}, wet cs ${M.wet.cs}, wet arcade ${M.wet.arcade}`);
}

console.log(bad ? `FAIL: ${bad} check(s)` : 'OK: all rally checks');
process.exit(bad ? 1 : 0);
