// The co-driver on the real open roads (docs/sovoznik.md): the roads he reads (Core.codrvRoad: every real open road, not a test track, not
// the roads of the USA but Pikes Peak), the grades of the bends by their tightest radius (Core.noteGrade), the calls of every road
// (Track.paceNotes: in order along the run, apart, as many as a co-driver reads, every slow corner in a slow note, only the co-driver's own
// words), the English the voice says (Core.codrvSay) and the captions in both languages, short enough for a phone (Core.codrvCap), the
// road's own crests from its heights (none on a flat road; a crest, a jump, a big jump as the hump grows), the roundabouts by their exit,
// and the time to work the notes out. The rally stages' words: rally.test.js, katu.test.js; the HUD: browser/sovoznik.test.mjs.
//   node tests/sovoznik.test.js
'use strict';
const { loadCore } = require('./lib/core.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };

// 1. the roads: the 15 of the plan (Pikes Peak twice: tarmac and gravel), a new road on its own; no test track, no road of the USA but Pikes Peak
const ROADS = ['tianmen', 'iroha', 'sani', 'rastro', 'vrsic', 'mountbuller', 'caracoles', 'medvode', 'chapman', 'hotham', 'greatalpine', 'harju', 'ouninpohja', 'katu', 'pikes', 'pikesg'];
const US = ['baldy', 'beartooth', 'bigsur', 'maunakea', 'moki', 'mulholland', 'palomar', 'uncompahgre'];
const roads = C.TRACKS.filter(d => C.codrvRoad(d));
{
  const ids = roads.map(d => d.id);
  check('roads: every real open road of the plan, none a test track, none of the USA but Pikes Peak, no circuit',
    ROADS.every(id => ids.includes(id)) && roads.every(d => d.open && !d.test) && !ids.some(id => US.includes(id)) && !C.codrvRoad(C.TRACKS.find(d => !d.open)),
    `${ids.length}: ${ids.join(' ')}`);
}

// 2. the grades: by the tightest radius, 1 under 16 m ... 6 under 120 m, flat from 120 m
{
  const G = [[15.9, 1], [16, 2], [25.9, 2], [26, 3], [37.9, 3], [38, 4], [54.9, 4], [55, 5], [79.9, 5], [80, 6], [119.9, 6], [120, 0], [400, 0]];
  const wrong = G.filter(([r, g]) => C.noteGrade(r) !== g);
  check('grades: 1 under 16 m, 2 under 26, 3 under 38, 4 under 55, 5 under 80, 6 under 120 m, flat beyond', !wrong.length, wrong.map(([r, g]) => `${r} m: ${C.noteGrade(r)} not ${g}`).join(', '));
}

// 3. the words: the voice's English and the captions as the plan has them (the test page's calls)
{
  const say = [
    [['caution', 'hairpin', 'L', 'into', 'R', 3, 'tightens', 'd150'], 'caution, hairpin left into right three tightens, one fifty'],
    [['L', 3, 'over', 'crest', 'and', 'flat', 'R', 'd200', 'fin'], 'left three over crest and flat right, two hundred to finish'],
    [['ring', 'straight', 'd200'], 'roundabout straight, two hundred'],
    [['square', 'R', 'onto', 'cobbles'], 'square right onto cobbles']];
  const cap = [
    [['L', 4, 'long'], 'LEVO 4 · DOLGO', 'LEFT 4 · LONG'],
    [['caution', 'jump'], 'POZOR · SKOK', 'CAUTION · JUMP'],
    [['R', 5, 'tightens', 'd150'], 'DESNO 5 · ZAPIRA · 150', 'RIGHT 5 · TIGHTENS · 150'],
    [['hairpin', 'L', 'into', 'R', 2], 'LASNICA L › D2', 'HAIRPIN L › R2'],
    [['L', 3, 'over', 'crest', 'and', 'R', 4], 'L3 GRBINA › D4', 'L3 CREST › R4'],
    [['ring', 'straight', 'd200'], 'KROŽIŠČE NARAVNOST · 200', 'ROUNDABOUT STRAIGHT'],
    [['flat', 'L'], 'LEVO POLNO', 'FLAT LEFT'],
    [['square', 'L', 'and', 'ring', 'L', 'd400'], '90 L › KROŽIŠČE L · 400', 'SQUARE L › ROUNDABOUT L']];
  const s = say.filter(([t, w]) => C.codrvSay(t) !== w), c = cap.filter(([t, sl, en]) => C.codrvCap(t, 'sl') !== sl || C.codrvCap(t, 'en') !== en);
  check('words: the voice in English, the caption in the game\'s language (one note in full, more short, a long one without its straight)', !s.length && !c.length,
    s.map(([t]) => `"${C.codrvSay(t)}"`).concat(c.map(([t]) => `"${C.codrvCap(t, 'sl')}" / "${C.codrvCap(t, 'en')}"`)).join(', '));
}

// 4. every road's calls
const vocab = (w) => C.CD_EN[w] !== undefined || /^d\d+$/.test(w);
const slowOk = (t) => t.some(w => w === 'hairpin' || w === 'square' || w === 'ring' || w === 'chicane' || (typeof w === 'number' && w <= 3));
const rows = [];
let worst = 0;
for (const def of roads) {
  const T = new C.Track(def), t0 = process.hrtime.bigint(), N = T.paceNotes(), ms = Number(process.hrtime.bigint() - t0) / 1e6, km = (T.finishS - T.startS) / 1000;
  worst = Math.max(worst, ms);
  const order = N.every((c, k) => c.e >= c.s && c.s >= T.startS && c.s < T.finishS && (k === 0 || c.s >= N[k - 1].e));
  const words = N.every(c => c.toks.every(vocab) && C.codrvSay(c.toks) === c.text && !/undefined/.test(c.text));
  const caps = N.every(c => ['sl', 'en'].every(l => { const x = C.codrvCap(c.toks, l); return x && x.length <= C.CD_MAX && !/undefined/.test(x); }));
  const slow = T.hudSigns().filter(g => g.kind === 'corner' && g.r < 26 && g.s0 >= T.startS + 30 && g.s0 < T.finishS);   // (a one or a two; the first 30 m: the start)
  const miss = slow.filter(g => !N.some(c => c.s - 5 <= g.s1 && c.e + 5 >= g.s0 && slowOk(c.toks)));
  const dens = N.length / km;
  rows.push(`${def.id} ${N.length} (${dens.toFixed(1)}/km, ${ms.toFixed(1)} ms)`);
  check(`${def.id}: calls in order along the run, apart, 1.5-8 a km, only the co-driver's words, captions of ${C.CD_MAX} characters at most, every one or two in a slow note`,
    order && words && caps && dens >= 1.5 && dens <= 8 && !miss.length,
    `${N.length} calls, ${dens.toFixed(1)}/km${order ? '' : ', out of order'}${words ? '' : ', a word not the co-driver\'s'}${caps ? '' : ', a caption too long'}${miss.length ? ', slow corners not read: ' + miss.map(g => Math.round(g.s0 - T.startS) + ' m').join(' ') : ''}`);
}
console.log('     ' + rows.join(' | '));
check('time: the notes of a road worked out in under 60 ms (once at the start of a race)', worst < 60, `the slowest ${worst.toFixed(1)} ms`);

// 5. the road's own crests (no def.bumps): none on a flat road; a hump on Vršič's straight 900 m after the start read as a crest (3 m),
// a jump (8 m), a big jump with a caution (12 m), at its top
{
  const def = C.TRACKS.find(d => d.id === 'vrsic'), T0 = new C.Track(def), at = T0.startS + 900, f = at / T0.len, dw = 40 / T0.len;
  const bumps = (elev) => new C.Track(Object.assign({}, def, { elev })).paceNotes().filter(c => c.toks.some(w => w === 'crest' || w === 'jump' || w === 'bigjump'));
  const flat = bumps([[0, 0], [1, 0]]), hump = (h) => bumps([[0, 0], [f - dw, 0], [f, h], [f + dw, 0], [1, 0]]);
  const one = (L, w, caution) => L.length === 1 && L[0].toks.includes(w) && Math.abs(L[0].s + 10 - at) < 15 && (!caution || L[0].toks[0] === 'caution');
  const h3 = hump(3), h8 = hump(8), h12 = hump(12);
  check('crests from the heights: none on a flat road; a hump 3 m high a crest, 8 m a jump, 12 m a big jump with a caution, at its top',
    !flat.length && one(h3, 'crest') && one(h8, 'jump') && one(h12, 'bigjump', true),
    `flat ${flat.length}; 3 m ${h3.map(c => Math.round(c.s - T0.startS) + ' "' + c.text + '"')}; 8 m ${h8.map(c => '"' + c.text + '"')}; 12 m ${h12.map(c => '"' + c.text + '"')}`);
}

// 6. the roundabouts (def.rings, Medvode): each one in the run read once, by its exit
{
  const T = new C.Track(C.TRACKS.find(d => d.id === 'medvode')), N = T.paceNotes();
  const rings = T.hudSigns().filter(g => g.kind === 'ring' && g.s0 >= T.startS && g.s0 < T.finishS), read = N.reduce((a, c) => a + c.toks.filter(w => w === 'ring').length, 0);
  const exits = N.flatMap(c => c.toks.map((w, i) => w === 'ring' ? c.toks[i + 1] : null).filter(Boolean));
  check('Medvode: every roundabout of the run read once, by its exit (straight, left, right)', rings.length > 0 && read === rings.length && exits.every(x => ['straight', 'L', 'R'].includes(x)),
    `${rings.length} roundabouts, ${read} read: ${exits.join(' ')}`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
