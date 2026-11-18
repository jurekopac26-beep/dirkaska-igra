// The co-driver on the real open roads (docs/sovoznik.md): the roads he reads (Core.codrvRoad: every real open road, not a test track, not
// the roads of the USA but Pikes Peak), the grades of the bends by their tightest radius (Core.noteGrade), the calls of every road
// (Track.paceNotes: in order along the run, apart, as many as a co-driver reads, every slow corner in a slow note, only the co-driver's own
// words), the English the voice says (Core.codrvSay) and the captions in both languages with every note of the call, short enough for a
// phone (Core.codrvCap: one line, a long one two), the road's own crests from its heights (none on a flat road; a crest, a jump, a big jump
// as the hump grows: Rio do Rastro), the roundabouts by their exit (two close by: both; Medvode), a stage's own notes (def.notes: only in
// the co-driver's words; Harju), the caution (a crest read with the bend behind it, a jump with a change of surface before a hairpin; Pikes
// Peak) and the time to work the notes out (all on roads that stay: one track a country, docs/proge-po-drzavah.md).
// The rally stages' words: rally.test.js, katu.test.js; the HUD: browser/sovoznik.test.mjs.
//   node tests/sovoznik.test.js
'use strict';
const { loadCore } = require('./lib/core.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };

// 1. the roads: the 15 of the plan (Pikes Peak twice: tarmac and gravel) but those since moved to the test tracks (one track a country,
// the user's choices of 5 and 6. 11. 2026: Vršič #394, Mount Buller and Sani #379; frozen until deleted), a new road on its own; no test
// track, no road of the USA but Pikes Peak
const PLAN = ['tianmen', 'iroha', 'sani', 'rastro', 'vrsic', 'mountbuller', 'caracoles', 'medvode', 'chapman', 'hotham', 'greatalpine', 'harju', 'ouninpohja', 'katu', 'pikes', 'pikesg'];
const ROADS = PLAN.filter(id => { const d = C.TRACKS.find(x => x.id === id); return d && !d.test; });
const US = ['baldy', 'beartooth', 'bigsur', 'maunakea', 'moki', 'mulholland', 'palomar', 'uncompahgre'];
const roads = C.TRACKS.filter(d => C.codrvRoad(d));
{
  const ids = roads.map(d => d.id);
  check('roads: every real open road of the plan, none a test track, none of the USA but Pikes Peak, no circuit',
    ROADS.length >= 9 && ROADS.every(id => ids.includes(id)) && roads.every(d => d.open && !d.test) && !ids.some(id => US.includes(id)) && !C.codrvRoad(C.TRACKS.find(d => !d.open)),
    `${ids.length}: ${ids.join(' ')}${ROADS.length < PLAN.length ? ' (of the plan now test tracks: ' + PLAN.filter(id => !ROADS.includes(id)).join(' ') + ')' : ''}`);
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
    [['square', 'L', 'and', 'ring', 'L', 'd400'], '90 L › KROŽIŠČE L · 400', 'SQUARE L › ROUNDABOUT L'],
    [['R', 4, 'tightens', 'into', 'L', 3, 'opens', 'and', 'square', 'R', 'onto', 'gravel'], 'D4 › L3 › 90 D', 'R4 › L3 › SQUARE R'],
    [['hairpin', 'L', 'and', 'hairpin', 'R', 'and', 'hairpin', 'L'], 'LASNICA L › LASNICA D › LASNICA L', 'HAIRPIN L › HAIRPIN R › HAIRPIN L']];
  const s = say.filter(([t, w]) => C.codrvSay(t) !== w), c = cap.filter(([t, sl, en]) => C.codrvCap(t, 'sl') !== sl || C.codrvCap(t, 'en') !== en);
  check('words: the voice in English, the caption in the game\'s language (one note in full, more short, a long one without its straight, then without the extras; every note stays)', !s.length && !c.length,
    s.map(([t]) => `"${C.codrvSay(t)}"`).concat(c.map(([t]) => `"${C.codrvCap(t, 'sl')}" / "${C.codrvCap(t, 'en')}"`)).join(', '));
}

// 4. every road's calls
const vocab = (w) => C.CD_EN[w] !== undefined || /^d\d+$/.test(w);
const notesOf = (t) => 1 + t.filter(w => w === 'into' || w === 'and').length;   // (the notes of a call: 'into' and 'and' between them)
const slowOk = (t) => t.some(w => w === 'hairpin' || w === 'square' || w === 'ring' || w === 'chicane' || (typeof w === 'number' && w <= 3));
const rows = [], long = { sl: 0, en: 0, of: 0 };
let worst = 0;
for (const def of roads) {
  const T = new C.Track(def), t0 = process.hrtime.bigint(), N = T.paceNotes(), ms = Number(process.hrtime.bigint() - t0) / 1e6, km = (T.finishS - T.startS) / 1000;
  worst = Math.max(worst, ms);
  const order = N.every((c, k) => c.e >= c.s && c.s >= T.startS && c.s < T.finishS && (k === 0 || c.s >= N[k - 1].e));
  const words = N.every(c => c.toks.every(vocab) && C.codrvSay(c.toks) === c.text && !/undefined/.test(c.text));
  const caps = N.every(c => ['sl', 'en'].every(l => { const x = C.codrvCap(c.toks, l); if (x.length > C.CD_MAX) long[l]++; return x && x.length <= C.CD_MAX2 && x.split(' › ').length === notesOf(c.toks) && !/undefined/.test(x); }));
  long.of += N.length;
  const slow = T.hudSigns().filter(g => g.kind === 'corner' && g.r < 26 && g.s0 >= T.startS + 30 && g.s0 < T.finishS);   // (a one or a two; the first 30 m: the start)
  const miss = slow.filter(g => !N.some(c => c.s - 5 <= g.s1 && c.e + 5 >= g.s0 && slowOk(c.toks)));
  const dens = N.length / km;
  rows.push(`${def.id} ${N.length} (${dens.toFixed(1)}/km, ${ms.toFixed(1)} ms)`);
  check(`${def.id}: calls in order along the run, apart, 1.5-8 a km, only the co-driver's words, captions of ${C.CD_MAX} characters (${C.CD_MAX2} in two lines) at most with every note, every one or two in a slow note`,
    order && words && caps && dens >= 1.5 && dens <= 8 && !miss.length,
    `${N.length} calls, ${dens.toFixed(1)}/km${order ? '' : ', out of order'}${words ? '' : ', a word not the co-driver\'s'}${caps ? '' : ', a caption too long'}${miss.length ? ', slow corners not read: ' + miss.map(g => Math.round(g.s0 - T.startS) + ' m').join(' ') : ''}`);
}
console.log('     ' + rows.join(' | '));
console.log(`     captions over ${C.CD_MAX} characters (two lines on a phone upright): ${long.sl} in Slovenian, ${long.en} in English, of ${long.of}`);
check('time: the notes of a road worked out in under 60 ms (once at the start of a race)', worst < 60, `the slowest ${worst.toFixed(1)} ms`);

// 5. the road's own crests (no def.bumps): none on a flat road; a hump on a straight of Rio do Rastro (100 m after the first call after
// 300 m that has 200 m of straight behind it; 160 m long) read as a crest (5 m), a jump (8.5 m), a big jump with a caution (12 m), at its top
{
  const def = C.TRACKS.find(d => d.id === 'rastro'), elev = (P) => new C.Track(Object.assign({}, def, { elev: P }));
  const T0 = elev([[0, 0], [1, 0]]), N0 = T0.paceNotes(), k = N0.findIndex((c, i) => c.e > T0.startS + 300 && i + 1 < N0.length && N0[i + 1].s - c.e >= 200);
  const at = N0[k].e + 100, f = at / T0.len, dw = 80 / T0.len;
  const bumps = (P) => elev(P).paceNotes().filter(c => c.toks.some(w => w === 'crest' || w === 'jump' || w === 'bigjump'));
  const flat = bumps([[0, 0], [1, 0]]), hump = (h) => bumps([[0, 0], [f - dw, 0], [f, h], [f + dw, 0], [1, 0]]);
  const one = (L, w, caution) => L.length === 1 && L[0].toks.includes(w) && Math.abs(L[0].s + 10 - at) < 15 && (!caution || L[0].toks[0] === 'caution');
  const h5 = hump(5), h8 = hump(8.5), h12 = hump(12);
  check(`crests from the heights (Rio do Rastro, a hump ${Math.round(at - T0.startS)} m after the start): none on a flat road; a hump 160 m long and 5 m high a crest, 8.5 m a jump, 12 m a big jump with a caution, at its top`,
    !flat.length && one(h5, 'crest') && one(h8, 'jump') && one(h12, 'bigjump', true),
    `flat ${flat.length}; 5 m ${h5.map(c => Math.round(c.s - T0.startS) + ' "' + c.text + '"')}; 8.5 m ${h8.map(c => '"' + c.text + '"')}; 12 m ${h12.map(c => '"' + c.text + '"')}`);
}

// 6. the roundabouts (def.rings, Medvode): each one in the run read once, by its exit
{
  const T = new C.Track(C.TRACKS.find(d => d.id === 'medvode')), N = T.paceNotes();
  const rings = T.hudSigns().filter(g => g.kind === 'ring' && g.s0 >= T.startS && g.s0 < T.finishS), read = N.reduce((a, c) => a + c.toks.filter(w => w === 'ring').length, 0);
  const exits = N.flatMap(c => c.toks.map((w, i) => w === 'ring' ? c.toks[i + 1] : null).filter(Boolean));
  check('Medvode: every roundabout of the run read once, by its exit (straight, left, right)', rings.length > 0 && read === rings.length && exits.every(x => ['straight', 'L', 'R'].includes(x)),
    `${rings.length} roundabouts, ${read} read: ${exits.join(' ')}`);
  // a second roundabout 10 m after the first of the run (the same ring, its centre on the road further on): both read, one after the other
  const def = T.def, g = rings[0], r0 = def.rings.reduce((a, r) => !a || Math.abs(T.startS + r.d - g.s0) < Math.abs(T.startS + a.d - g.s0) ? r : a, null);
  const sc = g.s1 + 10 + r0.r + (r0.hw || 3) + 8, i = T.idx(sc), T2 = new C.Track(Object.assign({}, def, { rings: def.rings.concat([Object.assign({}, r0, { c: [T.px[i], T.pz[i]], d: sc - T.startS })]) }));
  const rings2 = T2.hudSigns().filter(x => x.kind === 'ring' && x.s0 >= T2.startS && x.s0 < T2.finishS), N2 = T2.paceNotes(), read2 = N2.reduce((a, c) => a + c.toks.filter(w => w === 'ring').length, 0);
  const gap = rings2.length === rings.length + 1 ? Math.round(rings2[1].s0 - rings2[0].s1) : null;
  check('Medvode: two roundabouts close by (under 15 m between them), both read', gap !== null && gap < 15 && read2 === rings2.length,
    `${rings2.length} roundabouts (${gap} m between the first two), ${read2} read: ${N2.filter(c => c.toks.includes('ring')).map(c => '"' + c.text + '"').slice(0, 2).join(' ')}`);
}

// 7. a stage's own notes (def.notes, Harju: its chicanes): a note over its first hairpin in the co-driver's words read in its place (a
// digit as a grade); one with a word he does not have or that is no note's start: not read, the hairpin stays
{
  const def = C.TRACKS.find(d => d.id === 'harju'), T = new C.Track(def), N0 = T.paceNotes(), d0 = T.startS;
  const hp = N0.find(c => c.toks[0] === 'hairpin' && notesOf(c.toks) === 1), a = Math.round(hp.s - d0) - 2, b = Math.round(hp.e - d0) + 2;
  const run = (t) => new C.Track(Object.assign({}, def, { notes: def.notes.concat([[a, b, t]]) })).paceNotes(), at = (N) => N.find(c => Math.abs(c.s - hp.s) < 10);
  const same = ['narrow bit', 'and L 3', 'caution jump'].filter(t => JSON.stringify(run(t).map(c => c.toks)) === JSON.stringify(N0.map(c => c.toks)));
  const read = [['L 3', ['L', 3]], ['square R', ['square', 'R']], ['flat L long', ['flat', 'L', 'long']]].map(([t, w]) => { const x = at(run(t)); return { t, ok: !!x && JSON.stringify(x.toks.slice(0, w.length)) === JSON.stringify(w) && !x.toks.includes('hairpin'), say: x ? x.text : '-' }; });
  check('Harju: a note of its own in the co-driver\'s words read in the hairpin\'s place; one with a word he does not have, not read (the hairpin stays)',
    !!hp && same.length === 3 && read.every(x => x.ok), `the hairpin at ${a} m; the same calls with ${same.map(t => '"' + t + '"').join(' ') || '-'}; read: ${read.map(x => `"${x.t}" ${x.ok ? 'as' : 'NOT as'} "${x.say}"`).join(', ')}`);
}

// 8. the caution (Pikes Peak, its first hairpin after 150-250 m of straight): a crest 8 m before it, read with it ('hairpin left over
// crest'); a jump 45 m before it with a change of surface between (onto gravel 25 m before it); without the jump, none
{
  const def = C.TRACKS.find(d => d.id === 'pikes'), far = { at: 0.9999, h: 0.5 };   // (def.bumps: no crests of the road's own heights)
  const T = new C.Track(Object.assign({}, def, { bumps: [far] })), N0 = T.paceNotes(), d0 = T.startS;
  const hp = N0.find((c, k) => k > 0 && c.toks[0] === 'hairpin' && c.s - N0[k - 1].e >= 150 && c.s - N0[k - 1].e < 250);
  const call = (o) => { const N = new C.Track(Object.assign({}, def, o)).paceNotes(); return N.find(c => c.s <= hp.s + 1 && hp.s <= c.e) || { toks: [], text: '-' }; };
  const surf = [[hp.s - d0 - 25, T.finishS - d0, 'makadam']];
  const crest = call({ bumps: [far, { at: (hp.s - 8) / T.len, h: 0.5, w: 8 }] }), jump = call({ bumps: [far, { at: (hp.s - 45) / T.len, h: 1, w: 8 }], surf }), none = call({ bumps: [far], surf });
  check('Pikes Peak: caution for a hairpin right behind a crest read with it, and behind a jump with a change of surface between; none without the jump',
    !!hp && hp.toks[0] !== 'caution' && crest.toks[0] === 'caution' && crest.toks.includes('crest') && jump.toks[0] === 'caution' && jump.toks.includes('jump') && jump.toks.includes('onto') && none.toks.includes('onto') && none.toks[0] !== 'caution',
    `the hairpin at ${hp ? Math.round(hp.s - d0) : '-'} m "${hp ? hp.text : '-'}"; with the crest "${crest.text}"; with the jump "${jump.text}"; without it "${none.text}"`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
