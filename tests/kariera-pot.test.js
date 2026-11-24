// The career's path of 1.0 (js/kariera.js) in depth, beside tests/kariera.test.js (the plan's measures and the economy): every cup of the
// real path against the rule (its tracks' kind and stage, by length, split evenly into cups of at most NAJVEC, the km, the names, ids and
// difficulties, the final, the class cups), made-up paths (many new tracks, none, TRACKS in any order, 40 random sets of tracks and
// classes won cup by cup to the end), a track's length and stage, every reward table and place (better places later, the stage gifts,
// the first wins, the class goals), the edge cases (bad places, unknown cups and tracks, odd km), the view, the save v1 → v2, broken
// saves and the other answers of the decisions (Kariera.ODLOCITVE). Atlas (22. 11.): 5 stages, the final in stage 5, the class cups in
// stages 1–5 by price, the single events (a race, a time trial, a duel) filling every stage, the stages open by stars (the thresholds at
// most the stars of the stages before without their class cups), the gifts from the saved stage.
//   node tests/kariera-pot.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const C = loadCore();
const K = require('../js/kariera.js');

let n = 0, bad = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const J = JSON.stringify, N = K.NAGRADE, S = K.STOPNJE;
const byId = new Map(C.TRACKS.map(d => [d.id, d]));
const P = K.pot(C.TRACKS, C.CATS);
const cupIn = (Q, id) => Q.vse.find(c => c.id === id);
const rim = (k) => ['', '', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII'][k];
// an event's coins by the place of its 3, 2, 1 stars (a single event: its own table, 1★ … 3★)
const tabela = (c) => c.vrsta === 'razred' ? N.razred : c.vrsta === 'finale' ? N.finale : K.VRSTE_POS.includes(c.kind) ? N.posamezna[c.stopnja].slice().reverse() : N.pokal[c.stopnja];
const freeze = (o) => { if (o && typeof o === 'object' && !ArrayBuffer.isView(o) && !Object.isFrozen(o)) { Object.freeze(o); for (const k of Object.keys(o)) freeze(o[k]); } return o; };
const rnd = (seed) => () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const shuffle = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const kopije = (id, k, pre) => Array.from({ length: k }, (_, i) => Object.assign({}, byId.get(id), { id: pre + (i + 1) }));
const tries = (fn) => { try { return fn(); } catch (e) { return e; } };
const catName = (id) => C.CATS.find(c => c.id === id).name;

// the rule of the path on any tracks and classes: what is wrong (an empty list: nothing)
function pravilo(Q, tracks, cats) {
  const err = [], T = (tracks || []).filter(K.prava), D = new Map(T.map(d => [d.id, d])), L = new Map(T.map(d => [d.id, K.km(d)]));
  const leg = (id) => K.LEGENDE.includes(id), ord = (a, b) => L.get(a) - L.get(b) || (a < b ? -1 : 1);
  const kmOf = (c) => Math.round(c.tracks.reduce((s, id) => s + (L.get(id) || 0) * Math.max(1, c.laps || (D.get(id) || {}).laps || 1), 0) * 10) / 10;
  // every real track in one cup exactly (the final aside); nothing else on the path; the ids unique
  const cnt = new Map();
  for (const c of Q.pokali) if (c.vrsta !== 'finale') for (const id of c.tracks) cnt.set(id, (cnt.get(id) || 0) + 1);
  for (const d of T) if ((cnt.get(d.id) || 0) !== (d.ice ? 0 : 1)) err.push(d.id + ' in ' + (cnt.get(d.id) || 0) + ' cups');
  // an ice track (def.ice; the decision kariera-envalira-791): in no cup, stage 3's single race (its first event)
  for (const d of T.filter(d => d.ice)) {
    const e = (Q.posamezne || []).filter(x => x.tracks.includes(d.id));
    if (e.length !== 1 || e[0].stopnja !== 3 || e[0].kind !== 'dirka' || e[0].id !== 'e3-dirka-' + d.id) err.push(d.id + ': not stage 3\'s single race ' + e.map(x => x.id));
  }
  for (const c of Q.vse) for (const id of c.tracks) if (!D.has(id)) err.push(c.id + ': ' + id + ' not a real track');
  if (new Set(Q.vse.map(c => c.id)).size !== Q.vse.length) err.push('ids not unique');
  // a group (a stage and a kind; the long tracks; the time trials): its tracks by length (km, then id), split evenly into parts of at
  // most NAJVEC (the longer parts first), the ids and names numbered (the first part plain, then II, III …), the stage's difficulty
  const grupe = [];
  for (let s = 1; s <= 3; s++) for (const v of ['krog', 'cesta']) {
    grupe.push({ key: 's' + s + '-' + v, s, v, cups: Q.pokali.filter(c => c.stopnja === s && c.vrsta === v), want: T.filter(d => !leg(d.id) && !d.ice && K.vrsta(d) === v && K.stopnjaProge(d) === s),
      name: (k, m) => (v === 'krog' ? 'Pokal dirkališč' : 'Pokal cest') + (m > 1 ? rim(k) : '') + ' · ' + S[s - 1].name,
      en: (k, m) => (v === 'krog' ? 'Circuit Cup' : 'Road Cup') + (m > 1 ? rim(k) : '') + ' · ' + S[s - 1].en });
  }
  grupe.push({ key: 's4-dolge', s: 4, v: 'dolge', cups: Q.pokali.filter(c => c.vrsta === 'dolge'), want: T.filter(d => !leg(d.id) && K.vrsta(d) !== 'tt' && L.get(d.id) >= K.DOLGA),
    name: (k, m) => 'Dolge proge' + (m > 1 ? rim(k) : ''), en: (k, m) => 'Long tracks' + (m > 1 ? rim(k) : '') });
  grupe.push({ key: 's4-tt', s: 4, v: 'tt', cups: Q.pokali.filter(c => c.vrsta === 'tt'), want: T.filter(d => K.vrsta(d) === 'tt'),
    name: (k, m) => 'Kronometri' + (m > 1 ? rim(k) : ''), en: (k, m) => 'Time trials' + (m > 1 ? rim(k) : '') });
  for (const g of grupe) {
    const m = g.cups.length, sizes = g.cups.map(c => c.tracks.length), want = g.want.map(d => d.id).sort(ord);
    if (m !== Math.ceil(want.length / K.NAJVEC)) err.push(g.key + ': ' + m + ' cups for ' + want.length + ' tracks');
    if (g.cups.flatMap(c => c.tracks).join() !== want.join()) err.push(g.key + ': not its tracks by length');
    if (sizes.some((x, i) => x < 1 || x > K.NAJVEC || (i && x > sizes[i - 1])) || (m && Math.max(...sizes) - Math.min(...sizes) > 1)) err.push(g.key + ': parts ' + sizes);
    g.cups.forEach((c, i) => {
      if (c.id !== g.key + (m > 1 ? '-' + (i + 1) : '') || c.name !== g.name(i + 1, m) || c.en.name !== g.en(i + 1, m)) err.push(c.id + ': ' + c.name + ' / ' + c.en.name);
      if (c.stopnja !== g.s || c.diff !== S[g.s - 1].diff) err.push(c.id + ': stage ' + c.stopnja + ', diff ' + c.diff);
      if ((g.v === 'dolge') !== (c.laps === 1)) err.push(c.id + ': laps ' + c.laps);
    });
  }
  // the Legends: their four (the real ones), in their order
  const lg = Q.pokali.filter(c => c.id === 's4-legende'), wl = K.LEGENDE.filter(id => D.has(id));
  if (wl.length ? !(lg.length === 1 && lg[0].tracks.join() === wl.join() && lg[0].stopnja === 4 && lg[0].vrsta === 'krog' && lg[0].diff === S[3].diff
    && lg[0].name === 'Legende' && lg[0].en.name === 'Legends') : lg.length) err.push('the Legends');
  // the final: FINALE_N circuits shorter than DOLGA (or all of them), each continent's longest first, the continents evenly (a continent
  // with fewer than one less than the most only when it has no more)
  const fin = Q.pokali.filter(c => c.vrsta === 'finale'), kr = T.filter(d => K.vrsta(d) === 'krog' && !d.ice && L.get(d.id) < K.DOLGA);   // (an ice track: none of the final's)
  if (kr.length ? !(fin.length === 1 && fin[0].id === 's4-finale' && fin[0].stopnja === 5 && fin[0].kind === 'finale' && fin[0].diff === 3 && fin[0].tracks.length === Math.min(K.FINALE_N, kr.length)
    && new Set(fin[0].tracks).size === fin[0].tracks.length && fin[0].tracks.every(id => kr.some(d => d.id === id))
    && fin[0].name === 'Finale · Veliko prvenstvo' && fin[0].en.name === 'Final · Grand Championship') : fin.length) err.push('the final');
  if (fin.length) {
    const po = {}, got = {};
    for (const d of kr) (po[K.celina(d)] = po[K.celina(d)] || []).push(d.id);
    for (const k in po) po[k].sort((a, b) => L.get(b) - L.get(a) || (a < b ? -1 : 1));
    for (const id of fin[0].tracks) { const c = K.celina(D.get(id)); (got[c] = got[c] || []).push(id); }
    const most = Math.max(...Object.values(got).map(a => a.length));
    for (const k in po) {
      const g = got[k] || [];
      if (g.join() !== po[k].slice(0, g.length).join()) err.push('the final: not the longest of ' + k);
      if (g.length < po[k].length && g.length < most - 1) err.push('the final: too few of ' + k);
    }
  }
  // the class cups: one a class (its index: its own tracks), up to RAZRED_N of the pool (rally and off-road: the roads; racing cars and
  // trucks: the circuits; the rest: both; shorter than DOLGA, no Legends, no time trials), the goals; the stage by the class's order (no
  // prices given: RAZRED_RED, then the id), as many in each stage
  const cs = cats || [], red = (id) => { const i = K.RAZRED_RED.indexOf(id); return i < 0 ? K.RAZRED_RED.length : i; };
  const rank = cs.map(c => c.id).sort((a, b) => red(a) - red(b) || (a < b ? -1 : 1));
  if (Q.razredi.length !== cs.length) err.push('class cups: ' + Q.razredi.length + ' for ' + cs.length);
  Q.razredi.forEach((r, i) => {
    const c = cs[i] || {}, pool = T.filter(d => K.vrsta(d) !== 'tt' && L.get(d.id) < K.DOLGA && !leg(d.id)
      && (['reli', 'teren'].includes(c.id) ? K.vrsta(d) === 'cesta' : ['dirkalni', 'tovornjaki'].includes(c.id) ? K.vrsta(d) === 'krog' : true));
    if (r.id !== 'r-' + c.id || r.cat !== c.id || r.stopnja !== 1 + Math.floor(rank.indexOf(c.id) * S.length / cs.length) || r.vrsta !== 'razred' || r.kind !== 'razred' || r.diff !== 1 || r.name !== 'Pokal razreda · ' + c.name || !/^Class Cup · ./.test(r.en.name)) err.push(r.id + ': its fields');
    if (r.tracks.length !== Math.min(K.RAZRED_N, pool.length) || new Set(r.tracks).size !== r.tracks.length || !r.tracks.every(id => pool.some(d => d.id === id))) err.push(r.id + ': tracks ' + r.tracks);
    if (r.cilji.map(g => g.id + ':' + g.need).join() !== [c.id + '-zmaga:1', c.id + '-medalja:1', c.id + '-km:' + K.RAZRED_KM].join()) err.push(r.id + ': goals');
  });
  // the km of every cup (its laps: a cup's own first, the long tracks' one; else the track's); the stages; vse
  for (const c of Q.vse) if (c.km !== kmOf(c)) err.push(c.id + ': ' + c.km + ' km, not ' + kmOf(c));
  if (Q.stopnje.length !== S.length || Q.stopnje.some((st, i) => st.n !== i + 1 || st.name !== S[i].name || st.en.name !== S[i].en || st.diff !== S[i].diff
    || st.pokali.join() !== Q.pokali.filter(c => c.stopnja === i + 1).map(c => c.id).join())) err.push('the stages');
  if (Q.stopnje.flatMap(st => st.pokali).join() !== Q.pokali.map(c => c.id).join()) err.push('the stages not in the cups\' order');
  if (Q.vse.map(c => c.id).join() !== Q.pokali.concat(Q.razredi, Q.posamezne).map(c => c.id).join()) err.push('vse');
  // Atlas: a stage's events (the valley's road): a single event, a cup, … in turn, the class cups last, at most VELIKOST; a single event on
  // one real track of its stage (stage 5: of stages 3 and 4, not the final's), another in the stage, a race, a time trial (a track with
  // medals) and a duel (one rival) in turn, its stage's difficulty, a long track once round
  const pos = Q.posamezne;
  if (pos.some(e => !(e.stopnja >= 1 && e.stopnja <= S.length))) err.push('a single event of no stage');
  Q.stopnje.forEach((st, i) => {
    const s = i + 1, cups = Q.pokali.filter(c => c.stopnja === s), cls = Q.razredi.filter(r => r.stopnja === s), mine = pos.filter(e => e.stopnja === s);
    const want = [], a = mine.slice(), b = cups.slice();
    while (a.length || b.length) { if (a.length) want.push(a.shift()); if (b.length) want.push(b.shift()); }
    if (st.dogodki.join() !== want.concat(cls).map(x => x.id).join()) err.push('stage ' + s + ': its events ' + st.dogodki);
    if (mine.length > Math.max(0, K.VELIKOST[i] - cups.length - cls.length)) err.push('stage ' + s + ': ' + mine.length + ' single events');
    if (new Set(mine.map(e => e.tracks[0])).size !== mine.length) err.push('stage ' + s + ': a track twice');
    for (const e of mine) {
      const t = D.get(e.tracks[0]), ts = t ? K.stopnjaProge(t) : 0;
      if (e.tracks.length !== 1 || !t || !K.VRSTE_POS.includes(e.kind) || e.diff !== S[i].diff || e.id !== 'e' + s + '-' + e.kind + '-' + t.id
        || (s <= 4 ? ts !== s : ts < 3 || fin.some(f => f.tracks.includes(t.id))) || (e.kind === 'dvoboj') !== (e.n === 1)
        || e.vrsta !== (e.kind === 'kronometer' ? 'tt' : K.vrsta(t) === 'tt' ? 'cesta' : K.vrsta(t)) || (e.kind === 'kronometer' ? !t.medals : t.timeTrial && !(t.modes || []).includes('race'))
        || (L.get(t.id) >= K.DOLGA) !== (e.laps === 1)) err.push(e.id + ': its fields');
    }
  });
  // the stars: 3 an event; the thresholds the plan's share of them (of 132: 44 events), at most the stars of the stages before without
  // their class cups (every stage can open without a car of a class)
  const zv = Q.stopnje.map((st, i) => 3 * (Q.pokali.filter(c => c.stopnja === i + 1).length + pos.filter(e => e.stopnja === i + 1).length));
  const prag = K.PRAG.map((x, i) => Math.min(Math.round(x * Q.max / 132), zv.slice(0, i).reduce((a, b) => a + b, 0)));
  if (Q.max !== 3 * Q.vse.length || JSON.stringify(Q.pragovi) !== JSON.stringify(prag)) err.push('the thresholds ' + JSON.stringify(Q.pragovi) + ', not ' + JSON.stringify(prag));
  if (Q.pokali.length !== grupe.reduce((s, g) => s + g.cups.length, 0) + lg.length + fin.length) err.push('a cup of no kind');
  return err;
}

// every event of a path won in turn (the stages in order, each its events on the valley's road; a class cup with races and a car of its
// class): the events found locked, the stage gifts, the events' rewards against their tables
function igraj(Q, cats) {
  let car = K.novo({ on: true, money: 0 }), dobil = 0, tabele = 0, igral = 0;
  const zaklenjeni = [], darila = {}, o0 = K.odprta(car.pot, Q);
  const en = (c) => {
    igral++;
    if (K.stanje(car.pot, c, Q, cats).stanje === 'zaklenjen') zaklenjeni.push(c.id);
    const r = K.poPokalu(car, c.id, 1, Q, cats);
    car = r.career; tabele += tabela(c)[0];
    for (const x of r.nagrade) if (x.id.startsWith('stopnja:')) darila[x.id] = (darila[x.id] || 0) + 1; else if (x.id === 'pokal:' + c.id) dobil += x.amount;
  };
  for (const st of Q.stopnje) for (const id of st.dogodki) { const c = cupIn(Q, id); if (c.vrsta !== 'razred' || (c.tracks.length && cats.includes(c.cat))) en(c); }
  return { car, zaklenjeni, darila, o0, igral, dobil, tabele, odprta: K.odprta(car.pot, Q), v: K.view(car, Q, cats) };
}
// the gifts of the stages opened on the way, each once: from stage 2 once an event was played (a stage open from the start pays its gift at
// the first event: poPokalu pays from the saved stage); none without an event
const darilaOk = (g) => { const want = []; for (let s = g.igral ? 2 : g.o0 + 1; s <= g.odprta; s++) if (N.stopnja[s]) want.push('stopnja:' + s); return J(Object.keys(g.darila).sort()) === J(want) && Object.values(g.darila).every(x => x === 1); };

/* ---- a track's length, stage, kind, continent (made-up tracks) ---- */
{
  const sq = [[0, 0], [1000, 0], [1000, 1000], [0, 1000]];
  const krog = { id: 'a', points: sq }, cesta = { id: 'b', open: true, points: sq }, nazaj = { id: 'c', open: true, points: sq, start: [0, 1000], finish: [1000, 0] };
  check('a length from the points: a circuit closes its loop (4 km), a road from its start to its finish (3 km; given backwards 2 km); realKm first, unless 0, negative, NaN, Infinity or text',
    K.km(krog) === 4 && K.km(cesta) === 3 && K.km(nazaj) === 2 && K.km(Object.assign({ realKm: 5 }, krog)) === 5 && [0, -1, NaN, Infinity, '5'].every(r => K.km(Object.assign({ realKm: r }, krog)) === 4) && K.km({ id: 'd' }) === 0,
    [K.km(krog), K.km(cesta), K.km(nazaj)].join());
  const at = (km, o) => Object.assign({ id: 'x', realKm: km }, o);
  check('the stage bounds: circuits ≤ ' + K.MEJE.krog.join(' / ≤ ') + ' km, roads ≤ ' + K.MEJE.cesta.join(' / ≤ ') + ' km, from ' + K.DOLGA + ' km stage 4; a time trial and a Legend stage 4 at any length',
    [[2.6, 1], [2.61, 2], [4.7, 2], [4.71, 3], [7.99, 3], [8, 4]].every(([km, s]) => K.stopnjaProge(at(km)) === s)
    && [[2.2, 1], [2.21, 2], [3.7, 2], [3.71, 3], [8, 4]].every(([km, s]) => K.stopnjaProge(at(km, { open: true })) === s)
    && K.stopnjaProge(at(1, { timeTrial: true, open: true })) === 4 && K.stopnjaProge(at(1, { id: 'spa' })) === 4);
  check('the kind (a time trial before a road, a road before a circuit); test, pending tracks and nothing are not real',
    K.vrsta({ timeTrial: true, open: true }) === 'tt' && K.vrsta({ open: true }) === 'cesta' && K.vrsta({}) === 'krog' && !K.prava(null) && !K.prava({ test: true }) && !K.prava({ pending: true }) && K.prava({}));
  check('the continent: the country of the English name, else »drugo«', K.celina({ name: 'X, Slovenija', en: { name: 'X, Slovenia' } }) === 'evropa' && K.celina({ name: 'Y, Japan' }) === 'azija'
    && K.celina({ name: 'Z' }) === 'drugo' && K.celina({ en: { name: 'W, Atlantis' } }) === 'drugo');
}

/* ---- the real path ---- */
{
  const e = pravilo(P, C.TRACKS, C.CATS);
  check('the real path keeps the rule: every real track in one cup of its kind and stage, by length, split evenly (≤ ' + K.NAJVEC + '), the km, names, ids, difficulties, the Legends, the final, the class cups',
    !e.length, e.slice(0, 6).join(' | '));
  check('the difficulties: the stages ' + S.map(s => s.diff).join('/') + ', the final 3 (stage 5), the class cups 1, two a stage', J(S.map(s => s.diff)) === '[0,1,2,2,3]' && cupIn(P, 's4-finale').diff === 3
    && cupIn(P, 's4-finale').stopnja === 5 && P.razredi.every(r => r.diff === 1) && S.every(st => P.razredi.filter(r => r.stopnja === st.n).length === 2));
  check('Atlas on the real path: ' + P.stopnje.map(st => st.dogodki.length).join('/') + ' events (' + P.vse.length + '; ' + P.posamezne.length + ' single, ' + P.pokali.length + ' cups, ' + P.razredi.length
    + ' class cups), ' + P.max + '★, the thresholds ' + P.pragovi.join('/'), J(P.stopnje.map(st => st.dogodki.length)) === J(K.VELIKOST) && P.vse.length === 44 && P.max === 132 && J(P.pragovi) === '[0,9,21,36,54]');
  check('the numbering (the plan\'s »Pokal cest · Klub«): a first part plain, a second » II«, never » I« (fixed: it began at » II«)',
    P.pokali.some(c => c.name === 'Pokal cest · Klub' && c.en.name === 'Road Cup · Club') && !P.vse.some(c => / I( ·|$)/.test(c.name) || / I( ·|$)/.test(c.en.name)), P.pokali.map(c => c.name).join(', '));
  check('the class cups: an English name for every class of Core; a new class keeps its own name', P.razredi.every((r, i) => r.en.name !== 'Class Cup · ' + C.CATS[i].name)
    && K.pot(C.TRACKS, [{ id: 'nov', name: 'Nov razred' }]).razredi[0].en.name === 'Class Cup · Nov razred');
  const g = igraj(P, C.CATS.map(c => c.id));
  check('the real path won event by event: never a locked event, stage 5 open and saved, the gifts of stages 2–5 once each, every event its 1st place\'s reward, all won in the view',
    !g.zaklenjeni.length && g.o0 === 1 && g.odprta === 5 && g.car.pot.stopnja === 5 && darilaOk(g) && Object.keys(g.darila).length === 4 && g.dobil === g.tabele
    && g.v.stopnje.every(st => st.odprta && st.pokali.every(c => c.stanje === 'osvojen')) && g.v.razredi.every(r => r.stanje === 'osvojen'),
    J({ z: g.zaklenjeni, d: g.darila, dobil: g.dobil, tabele: g.tabele }));
}

/* ---- made-up paths ---- */
{
  const T13 = C.TRACKS.concat(kopije('kildare', 13, 'nova-k')), P13 = K.pot(T13, C.CATS), e = pravilo(P13, T13, C.CATS);
  const s1 = P13.pokali.filter(c => c.stopnja === 1 && c.vrsta === 'krog');
  check('13 new short circuits: the rule holds, the circuit cup of stage 1 in ' + s1.length + ' parts (Pokal dirkališč · Začetnik, … II, III, IV; Circuit Cup IV · Rookie)',
    !e.length && s1.length >= 4 && s1[0].id === 's1-krog-1' && s1[0].name === 'Pokal dirkališč · Začetnik' && s1[1].name === 'Pokal dirkališč II · Začetnik' && s1[3].name === 'Pokal dirkališč IV · Začetnik' && s1[3].en.name === 'Circuit Cup IV · Rookie',
    e.slice(0, 3).join(' | ') || s1.map(c => c.name).join(', '));
  const T2 = C.TRACKS.concat(kopije('caracoles', 7, 'nova-d'), kopije('harju', 3, 'nova-t')), P2 = K.pot(T2, C.CATS), e2 = pravilo(P2, T2, C.CATS);
  const dl = P2.pokali.filter(c => c.vrsta === 'dolge'), tt = P2.pokali.filter(c => c.vrsta === 'tt');
  check('7 new long tracks and 3 time trials: the rule holds, »Dolge proge«, »Dolge proge II« (once round), »Kronometri«, »Kronometri II« (Long tracks II, Time trials II)',
    !e2.length && dl.length >= 2 && dl[0].name === 'Dolge proge' && dl[1].name === 'Dolge proge II' && dl[1].en.name === 'Long tracks II' && dl.every(c => c.laps === 1)
    && tt.length >= 2 && tt[0].name === 'Kronometri' && tt[1].name === 'Kronometri II' && tt[1].en.name === 'Time trials II', e2.slice(0, 3).join(' | ') || dl.concat(tt).map(c => c.name).join(', '));
  const r = rnd(7), same = [];
  for (let t = 0; t < 5; t++) same.push(J(K.pot(shuffle(C.TRACKS, r), C.CATS)) === J(P));
  check('TRACKS in any order (5 shuffles): the same path, the class cups too (fixed: as long tracks took the order of TRACKS)', same.every(Boolean), J(same));
  const none = [[], null, undefined].map(t => tries(() => { const Q = K.pot(t); return Q.pokali.length === 0 && Q.razredi.length === 0 && Q.posamezne.length === 0 && Q.stopnje.length === 5 && J(Q.pragovi) === '[0,0,0,0,0]' && K.odprta(K.novaPot(), Q) === 5 && K.view(K.novo(), Q, []).stopnja === 5; }));
  const Qc = K.pot([], C.CATS);
  check('no tracks ([], null, undefined): 5 empty stages, the thresholds 0, all open, a view; with the classes: class cups without races (the game lists only cups with races)',
    none.every(x => x === true) && Qc.razredi.length === C.CATS.length && Qc.razredi.every(x => !x.tracks.length && x.km === 0), J(none.map(String)));
  const dolga = { id: 'x-dolga', name: 'X, Italija', en: { name: 'X, Italy' }, realKm: 9, laps: 3 }, kratka = { id: 'x-kratka', name: 'Y, Italija', en: { name: 'Y, Italy' }, realKm: 2, laps: 3 };
  const Q = K.pot([dolga, kratka]);
  check('a cup\'s km: the long tracks\' cup once round (a 9 km track of 3 laps: 9 km, not 27: fixed), a circuit its laps (2 km × 3)',
    cupIn(Q, 's4-dolge').km === 9 && cupIn(Q, 's1-krog').km === 6 && cupIn(Q, 's4-finale').km === 6, Q.pokali.map(c => c.id + ' ' + c.km).join(', '));
  const T7 = C.TRACKS.concat(kopije('kildare', 7, 'nova-k')), Q7 = K.pot(T7, C.CATS), p = { stopnja: 2, pokali: { 's1-krog': 1, 's1-cesta': 2 } };
  check('a stage opened before new tracks split a cup (s1-krog → s1-krog-1 …): open still (the saved stage); the old cup\'s place stays in the save, the new parts open',
    Q7.stopnje[0].pokali.length > P.stopnje[0].pokali.length && K.odprta(p, Q7) === 2 && K.view({ pot: p }, Q7, []).stopnje[1].odprta && K.stanje(p, cupIn(Q7, 's1-krog-1'), Q7).stanje === 'odprt', Q7.stopnje[0].pokali.join());
  const rr = rnd(20261119), real = C.TRACKS.filter(K.prava), other = C.TRACKS.filter(d => !K.prava(d)), fails = [];
  for (let t = 0; t < 40; t++) {
    const k = 1 + Math.floor(rr() * real.length), sub = shuffle(real, rr).slice(0, k).concat(other), cats = shuffle(C.CATS, rr).slice(0, Math.floor(rr() * (C.CATS.length + 1)));
    const Qs = K.pot(sub, cats), es = pravilo(Qs, sub, cats), gs = igraj(Qs, cats.map(c => c.id));
    if (es.length || gs.zaklenjeni.length || gs.odprta !== 5 || !darilaOk(gs) || gs.dobil !== gs.tabele) fails.push(k + ' tracks: ' + es.concat(gs.zaklenjeni).slice(0, 3).join('; ') + ' ' + J(gs.darila));
  }
  check('40 random sets of the real tracks (the test ones beside) and classes: the rule holds, each path won event by event to stage 5 (fixed: a small set locked a stage), never locked, its gifts once', !fails.length, fails.slice(0, 3).join(' | '));
  const fr = tries(() => { freeze(C.TRACKS); freeze(C.CATS); return J(K.pot(C.TRACKS, C.CATS)) === J(P); });
  check('pot only reads the tracks and the classes (frozen: no write, the same path)', fr === true, String(fr));
}

/* ---- the reward tables ---- */
{
  const t3 = (t) => Array.isArray(t) && t.length === 3 && t.every(x => Number.isInteger(x) && x > 0) && t[0] > t[1] && t[1] > t[2];
  check('the cups\' tables (stages 1–4, the final, the class cups): 3 places, whole amounts, 1st > 2nd > 3rd', [1, 2, 3, 4].every(s => t3(N.pokal[s])) && t3(N.finale) && t3(N.razred));
  check('the rewards grow with the stage (the cups, the first wins, the gifts: none for stage 1; a car of the stage dearer), the final above stage 4, a goal paid',
    [2, 3, 4].every(s => N.pokal[s].every((x, i) => x > N.pokal[s - 1][i]) && N.prva[s] > N.prva[s - 1] && N.stopnja[s] > N.stopnja[s - 1] && K.AVTO_STOPNJE[s] > K.AVTO_STOPNJE[s - 1])
    && N.finale.every((x, i) => x > N.pokal[4][i]) && N.stopnja[1] === 0 && N.prva[1] > 0 && N.cilj > 0);
}

/* ---- a cup's end (poPokalu) ---- */
{
  const fresh = () => K.novo({ on: true, money: 777 });
  const pay = (car, id, place) => K.poPokalu(car, id, place, P, ['mali']);
  const amt = (r, id) => r.nagrade.filter(x => x.id === 'pokal:' + id).reduce((s, x) => s + x.amount, 0);
  const gift = (r) => r.nagrade.filter(x => x.id.startsWith('stopnja:'));
  const cups = ['s1-krog', P.stopnje[1].pokali[0], P.stopnje[2].pokali[0], 's4-legende', 's4-finale', 'r-mali'], wrong = [];
  for (const id of cups) for (const pl of [1, 2, 3]) { const r = pay(fresh(), id, pl); if (r.nagrade.length !== 1 || amt(r, id) !== tabela(cupIn(P, id))[pl - 1] || r.career.pot.pokali[id] !== pl) wrong.push(id + ' ' + pl); }
  check('every table, every place: ' + cups.join(', ') + ' pay their 1st, 2nd, 3rd (one reward), the place kept', !wrong.length, wrong.join(', '));
  const r4 = pay(fresh(), 's1-krog', 4), r3 = pay(r4.career, 's1-krog', 3);
  check('4th place: kept, nothing paid; 3rd later: the whole 3rd', !r4.nagrade.length && r4.career.pot.pokali['s1-krog'] === 4 && amt(r3, 's1-krog') === N.pokal[1][2] && r3.career.pot.pokali['s1-krog'] === 3);
  const s3 = P.stopnje[2].pokali[0], a = pay(fresh(), s3, 3), b = pay(a.career, s3, 2), d = pay(b.career, s3, 1), w = pay(d.career, s3, 2);
  check('3rd, 2nd, 1st in turn: the differences, together the 1st; a worse place later: nothing, the best kept',
    amt(a, s3) === N.pokal[3][2] && amt(b, s3) === N.pokal[3][1] - N.pokal[3][2] && amt(d, s3) === N.pokal[3][0] - N.pokal[3][1] && amt(a, s3) + amt(b, s3) + amt(d, s3) === N.pokal[3][0]
    && !w.nagrade.length && w.career.pot.pokali[s3] === 1);
  const badPl = [0, -1, NaN, '1', null, undefined, 2.5, Infinity, true, [1], {}].filter(pl => { const r = pay(fresh(), 's1-krog', pl); return r.nagrade.length || J(r.career.pot) !== J(K.novaPot()); });
  check('a bad place (0, -1, NaN, "1", null, undefined, 2.5, Infinity, true, [1], {}): nothing paid, nothing kept (fixed: 2.5 was kept and paid NaN)', !badPl.length, J(badPl.map(String)));
  const badId = ['x', undefined, null, '', 's9-krog'].filter(id => { const r = pay(fresh(), id, 1); return r.nagrade.length || J(r.career.pot) !== J(K.novaPot()); });
  check('an unknown cup (x, undefined, null, "", s9-krog): nothing paid, nothing kept', !badId.length, J(badId.map(String)));
  // Atlas: the stars open a stage (stage 2 at 9★): two cups 2nd (2★ each), a race won (3★), a time trial 2nd (2★)
  const [k1, k2] = P.stopnje[0].pokali, st1 = P.stopnje[0].dogodki.map(id => cupIn(P, id)), d1 = st1.find(x => x.kind === 'dirka'), t1 = st1.find(x => x.kind === 'kronometer');
  const g1 = pay(fresh(), k1, 2), g2 = pay(g1.career, k2, 2), g3 = pay(g2.career, d1.id, 1), g4 = pay(g3.career, t1.id, 2), g5 = pay(g4.career, k1, 1);
  check('stage 1 to ' + P.pragovi[1] + '★ (two cups 2nd, a race won, a time trial 2nd): the gift »Nova stopnja · Klub« (New stage · Club, ' + N.stopnja[2] + ') at the 9th star, stage 2 open and saved; a better place later: the difference, no gift again',
    P.pragovi[1] === 9 && !gift(g1).length && !gift(g2).length && !gift(g3).length && K.odprta(g3.career.pot, P) === 1
    && J(gift(g4).map(x => [x.id, x.name, x.en, x.amount])) === J([['stopnja:2', 'Nova stopnja · Klub', 'New stage · Club', N.stopnja[2]]]) && g4.career.pot.stopnja === 2 && K.odprta(g4.career.pot, P) === 2
    && g4.stopnja.prej === 1 && g4.stopnja.zdaj === 2 && g4.zvezdice.prej === 0 && g4.zvezdice.zdaj === 2 && !gift(g5).length && amt(g5, k1) === N.pokal[1][0] - N.pokal[1][1]);
  // the path cups of stages 2 and 3 won with the saved stage 1 (24★: the stars open stage 3)
  const won = Object.fromEntries(P.stopnje[1].pokali.concat(P.stopnje[2].pokali).map(id => [id, 1])), odd = { v: 2, on: true, pot: { stopnja: 1, pokali: won } };
  const o3 = K.odprta(odd.pot, P), m1 = pay(odd, k1, 1), om = K.odprta(m1.career.pot, P), want = [];
  for (let s = 2; s <= om; s++) want.push('stopnja:' + s);
  check('an odd save (stages 2 and 3 won with the saved stage 1; the stars open stage ' + o3 + '): the missing gifts at its next event, at once, each once; never again',
    o3 === 3 && om >= 3 && J(gift(m1).map(x => x.id)) === J(want) && gift(m1).reduce((s, x) => s + x.amount, 0) === want.reduce((s, x) => s + N.stopnja[+x.split(':')[1]], 0)
    && m1.career.pot.stopnja === om && m1.stopnja.prej === 1 && m1.stopnja.zdaj === om && !gift(pay(m1.career, k1, 1)).length && !gift(pay(m1.career, k2, 1)).length);
  const x1 = pay({ v: 2, pot: { stopnja: 3 } }, k1, 1), x2 = pay(x1.career, k2, 1);
  check('a saved stage 3: stage 1 won late pays no gift for stages 2 and 3', !gift(x1).length && !gift(x2).length && x2.career.pot.stopnja === 3);
  let rc = fresh(); const rg = [];
  for (const r of P.razredi) { const x = pay(rc, r.id, 1); rc = x.career; rg.push(...gift(x)); }
  const zR = 3 * P.razredi.length, oR = 1 + P.pragovi.slice(1).filter(x => zR >= x).length, wR = [];
  for (let s = 2; s <= oR; s++) wR.push('stopnja:' + s);
  check('every class cup won: their stars count (' + zR + '★), stage ' + oR + ' open and saved, the gifts of stages 2–' + oR + ' once each', oR === 3 && J(rg.map(x => x.id)) === J(wR) && K.odprta(rc.pot, P) === oR && rc.pot.stopnja === oR);
  const nm = pay(fresh(), 's1-krog', 1).nagrade[0], nr = pay(fresh(), 'r-mali', 2).nagrade[0];
  check('the rewards\' names: »Pokal dirkališč · Začetnik · 1. mesto« (Circuit Cup · Rookie · P1), »Pokal razreda · ' + catName('mali') + ' · 2. mesto« (Class Cup · Small cars · P2)',
    nm.id === 'pokal:s1-krog' && nm.name === 'Pokal dirkališč · Začetnik · 1. mesto' && nm.en === 'Circuit Cup · Rookie · P1' && nr.name === 'Pokal razreda · ' + catName('mali') + ' · 2. mesto' && nr.en === 'Class Cup · Small cars · P2', J([nm, nr]));
  const inp = freeze({ v: 2, on: true, money: 5, pot: { stopnja: 1, pokali: { 's1-krog': 3 }, cilji: {}, prve: [], km: {} } }), pr = tries(() => pay(inp, 's1-krog', 1));
  check('poPokalu only reads the career (frozen) and leaves the money (the game pays)', !(pr instanceof Error) && pr.career.money === 5 && pr.career.pot.pokali['s1-krog'] === 1 && inp.pot.pokali['s1-krog'] === 3, String(pr));
}

/* ---- a race's end (poDirki) ---- */
{
  const dir = (track, o, car) => K.poDirki(car || K.novo({ on: true }), Object.assign({ track, pos: 1, cat: 'mali', km: 3 }, o), P);
  const prva = (r) => r.nagrade.filter(x => x.id.startsWith('prva:')), ids = (r) => r.nagrade.map(x => x.id).sort();
  const own = (id) => (P.pokali.find(c => c.vrsta !== 'finale' && c.tracks.includes(id)) || P.posamezne.find(e => e.tracks.includes(id))).stopnja;   // (an ice track: its single race's)
  const tt = cupIn(P, 's4-tt').tracks[0];
  const firsts = P.stopnje.map(st => cupIn(P, st.pokali[0]).tracks[0]).concat(['spa', cupIn(P, 's4-dolge').tracks[0], tt]);
  const badF = firsts.filter(id => { const r = prva(dir(id)); return r.length !== 1 || r[0].id !== 'prva:' + id || r[0].amount !== N.prva[own(id)] || r[0].name !== 'Prva zmaga na progi' || r[0].en !== 'First win on the track'; });
  check('the first win on a track of each stage (' + firsts.join(', ') + '): »Prva zmaga na progi«, by the stage of its cup', !badF.length, badF.join());
  const fin = cupIn(P, 's4-finale').tracks, badFin = fin.filter(id => (prva(dir(id))[0] || {}).amount !== N.prva[own(id)]);
  check('the final\'s tracks: the first win by the stage of their own cup (' + fin.map(id => id + ' ' + own(id)).join(', ') + ')', !badFin.length, badFin.join());
  const test = C.TRACKS.find(d => d.test).id, pend = (C.TRACKS.find(d => d.pending) || { id: 'nic2' }).id, off = ['nic', test, pend].map(id => dir(id));
  check('a win off the path (an unknown track, the test track ' + test + ', the pending ' + pend + '): no first win; the class win goal yes (any career race counts for the class goals)',
    off.every(r => !prva(r).length && !r.career.pot.prve.length && J(ids(r)) === J(['cilj:mali-zmaga'])));
  const noWin = ['1', 2, 0, true, null].filter(pos => dir('kildare', { pos }).nagrade.length);
  check('no win (pos "1", 2, 0, true, null): no first win, no class win goal', !noWin.length, J(noWin));
  const gold = dir(tt, { pos: 0, medal: 'gold' }), silver = dir(tt, { pos: 0, medal: 'silver' }), again = dir(tt, { pos: 0, medal: 'gold' }, gold.career);
  check('a time trial (the game passes pos 0): gold is its win, the first win of ' + tt + ' (' + N.prva[4] + '; fixed: never paid) and the class medal goal, once; silver the goal only; never the class win goal',
    J(ids(gold)) === J(['cilj:mali-medalja', 'prva:' + tt]) && prva(gold)[0].amount === N.prva[4] && J(ids(silver)) === J(['cilj:mali-medalja']) && !again.nagrade.length, J([ids(gold), ids(silver)]));
  const wood = ['wood', true, 'Gold', 1].filter(medal => dir(tt, { pos: 0, medal }).nagrade.length);
  check('no medal (wood, true, "Gold", 1): nothing', !wood.length, J(wood));
  let k = K.novo({ on: true });
  const step = (km) => { const r = K.poDirki(k, { track: 'kildare', pos: 3, cat: 'mali', km }, P); k = r.career; return r; };
  step(40); step(40);
  const b19 = step(19.999), b1 = step(0.001), at100 = k.pot.km.mali, b5 = step(5);
  check('100 km: 40 + 40 + 19.999 not yet, + 0.001 exactly 100 (the goal, once), 5 km more: nothing again', !b19.nagrade.length && at100 === 100 && J(ids(b1)) === J(['cilj:mali-km']) && !b5.nagrade.length && k.pot.km.mali === 105, J([at100, k.pot.km]));
  check('one race, several rewards: a win of 120 km pays the first win, the class win and 100 km', J(ids(dir('kildare', { km: 120 }))) === J(['cilj:mali-km', 'cilj:mali-zmaga', 'prva:kildare']));
  const junk = [null, [], 'x', 5, undefined, true].filter(e => { const r = K.poDirki(K.novo(), e, P); return r.nagrade.length || J(r.career.pot) !== J(K.novaPot()); });
  check('no race (null, [], "x", 5, undefined, true): nothing', !junk.length, J(junk.map(String)));
  const kmOf = (km) => K.poDirki(K.novo(), { track: 'kildare', pos: 2, cat: 'mali', km }, P).career.pot.km.mali;
  const bk = [-3, NaN, null, '1e400', Infinity, 0, 'x'].filter(km => kmOf(km) !== undefined);
  check('odd km (-3, NaN, null, "1e400", Infinity, 0, "x"): none counted; "5": 5', !bk.length && kmOf('5') === 5, J(bk.map(String)));
  const big = K.poDirki(K.poDirki(K.novo(), { cat: 'mali', km: 1e305 }, P).career, { cat: 'mali', km: 1e305 }, P).career;
  check('km past what a number holds: kept finite, the save the same through JSON (fixed: Infinity, saved as null), the goal\'s progress 100',
    Number.isFinite(big.pot.km.mali) && big.pot.km.mali > 1e304 && J(JSON.parse(J(big))) === J(big) && K.view(big, P, ['mali']).razredi.find(r => r.cat === 'mali').cilji[2].progress === 100, J(big.pot.km));
  const nz = dir('kildare').nagrade.find(x => x.id === 'cilj:mali-zmaga'), nmd = dir(tt, { pos: 0, medal: 'bronze', cat: 'reli' }).nagrade.find(x => x.id === 'cilj:reli-medalja'), nk = dir('kildare', { pos: 2, km: 100 }).nagrade.find(x => x.id === 'cilj:mali-km');
  check('the goals\' names: »' + catName('mali') + ' · Zmaga« (Small cars · A win), »' + catName('reli') + ' · Medalja na kronometru« (Rally · A time trial medal), »' + catName('mali') + ' · 100 km«, ' + N.cilj + ' each',
    nz.name === catName('mali') + ' · Zmaga' && nz.en === 'Small cars · A win' && nmd.name === catName('reli') + ' · Medalja na kronometru' && nmd.en === 'Rally · A time trial medal'
    && nk.name === catName('mali') + ' · 100 km' && nk.en === 'Small cars · 100 km' && [nz, nmd, nk].every(x => x.amount === N.cilj), J([nz, nmd, nk]));
  const uc = dir('kildare', { cat: 'nic', km: 200 }), nc = dir('kildare', { cat: undefined, km: 200 });
  check('a class not on the path: its km kept, no goals; no class: no km; the first win paid either way',
    J(ids(uc)) === J(['prva:kildare']) && uc.career.pot.km.nic === 200 && J(ids(nc)) === J(['prva:kildare']) && J(nc.career.pot.km) === '{}');
  const inp = freeze({ v: 2, on: true, money: 9, pot: { stopnja: 1, pokali: {}, cilji: {}, prve: ['spa'], km: { mali: 99 } } }), pr = tries(() => K.poDirki(inp, { track: 'kildare', pos: 1, cat: 'mali', km: 2 }, P));
  check('poDirki only reads the career (frozen) and leaves the money', !(pr instanceof Error) && pr.career.money === 9 && pr.career.pot.km.mali === 101 && pr.career.pot.prve.join() === 'spa,kildare' && inp.pot.prve.length === 1, String(pr));
}

/* ---- the menu's view ---- */
{
  const v0 = K.view(K.novo({ on: true, money: 10000 }), P, ['mali']);
  check('a new path: stage 1, 0 of ' + P.pragovi[1] + '★, the events of stage 1 open, of stage 2 locked, the class cups by the classes owned (and their stage)',
    v0.stopnja === 1 && v0.napredek.done === 0 && v0.napredek.need === P.pragovi[1] && v0.stopnje[0].odprta && v0.stopnje[0].pokali.filter(c => c.vrsta !== 'razred').every(c => c.stanje === 'odprt' && c.best === 0)
    && !v0.stopnje[1].odprta && v0.stopnje[1].pokali.every(c => c.stanje === 'zaklenjen') && v0.razredi.every(r => r.stanje === (r.cat === 'mali' && r.stopnja <= 1 ? 'odprt' : 'zaklenjen')) && v0.money === 10000 && v0.prve === 0);
  // every event of stages 1–4 2nd (a duel won: its only place); every class owned
  const v4 = K.view({ on: true, pot: { pokali: Object.fromEntries(P.vse.filter(c => c.stopnja <= 4).map(c => [c.id, c.kind === 'dvoboj' ? 1 : 2])) } }, P, C.CATS.map(c => c.id));
  check('every event of stages 1–4 placed: stage 5 of 5, every stage open, nothing more needed', v4.stopnja === 5 && v4.stopenj === 5 && v4.napredek.need === 0 && v4.stopnje.every(st => st.odprta)
    && v4.stopnje[0].pokali.every(c => c.stanje === 'osvojen' && c.best === (c.kind === 'dvoboj' ? 1 : 2)));
  const v3 = K.view({ pot: { stopnja: 3 } }, P, []);
  check('a saved stage 3: stages 1–3 open, stage 4 locked, 0 of ' + P.pragovi[3] + '★', v3.stopnja === 3 && v3.stopnje[2].odprta && !v3.stopnje[3].odprta && v3.napredek.done === 0 && v3.napredek.need === P.pragovi[3]);
  const goals = (km) => K.view({ pot: { km: { mali: km }, cilji: { 'mali-zmaga': true } } }, P, ['mali']).razredi.find(r => r.cat === 'mali').cilji;
  check('the class goals in the view: done, the km goal\'s progress floored and at most 100 (42.9 → 42, 250 → 100)',
    goals(42.9)[0].done && goals(42.9)[0].progress === 1 && goals(42.9)[1].progress === 0 && goals(42.9)[2].progress === 42 && goals(250)[2].progress === 100);
  const money = [-5, '100', NaN, Infinity, null].map(m => K.view({ money: m }, P).money);
  check('the money in the view: odd values 0, a fraction floored', money.every(x => x === 0) && K.view({ money: 1234.7 }, P).money === 1234, J(money));
  const odd = [null, 'x', [], 5, undefined].map(c => tries(() => K.view(c, P, ['mali']).stopnja));
  check('the view of no career (null, "x", [], 5, undefined): stage 1, no error', odd.every(x => x === 1), J(odd.map(String)));
  const [c1, c2] = P.stopnje[0].pokali, v5 = K.view({ pot: { pokali: { [c1]: 3, [c2]: 4 } } }, P, []);
  const f1 = v5.stopnje[0].pokali.find(c => c.id === c1), f2 = v5.stopnje[0].pokali.find(c => c.id === c2);
  check('a cup\'s state: 3rd won (osvojen, best 3, 1★), 4th open (odprt, best 4, 0★)', f1.stanje === 'osvojen' && f1.best === 3 && f1.zvezdice === 1 && f2.stanje === 'odprt' && f2.best === 4 && f2.zvezdice === 0);
  f1.tracks.push('x');
  check('the view\'s cups are copies (a list changed in the view leaves the path)', !cupIn(P, c1).tracks.includes('x'));
  check('the first wins counted; cups no longer on the path harmless', K.view({ pot: { prve: ['kildare', 'spa'], pokali: { 's9-nic': 1, 's1-krog-7': 2 } } }, P, []).prve === 2 && K.view({ pot: { pokali: { 's9-nic': 1, 's1-krog-7': 2 } } }, P, []).stopnja === 1);
}

/* ---- the save: v1 → v2, broken saves ---- */
{
  const m1 = K.migrate({ v: 1, on: true, money: 5, pot: { stopnja: 3, pokali: { 's1-krog': 1 } } });
  check('a v1 save has no path: a pot in it ignored, a new path (the game keeps v 1 on disk and passes v 2 when its save has the pot)', m1.v === 2 && m1.money === 5 && J(m1.pot) === J(K.novaPot()));
  const m2 = K.migrate({ v: 2, money: 5, pot: { stopnja: 2.7, pokali: { a: 2.9, b: '1', c: 0, d: 0.5 }, cilji: { g: 'yes', h: 0, i: null }, prve: 'kildare', km: { mali: 1.23456, reli: '1e400', x: 0, y: -2 } } });
  check('a broken path cleaned: stage 2.7 → 2, places floored (2.9 → 2; "1", 0, 0.5 dropped), goals true, prve not a list → [], km to 3 decimals (too big, 0, negative dropped)',
    J(m2.pot) === J({ stopnja: 2, pokali: { a: 2 }, cilji: { g: true }, prve: [], km: { mali: 1.235 } }), J(m2.pot));
  const st = [0, Infinity, 'x', -3, '3', null].map(s => K.migrate({ v: 2, pot: { stopnja: s } }).pot.stopnja);
  check('a stage of no use (0, Infinity, "x", -3, "3", null): stage 1', st.every(x => x === 1), J(st));
  const shapes = [[], 'x', 5, null, true].map(p => J(K.migrate({ v: 2, pot: p }).pot)).concat([[1, 2], 'x', 5, null].map(x => J(K.migrate({ v: 2, pot: { pokali: x, cilji: x, km: x, prve: x } }).pot)));
  check('a path of no shape ([], "x", 5, null, true) or with parts of no shape: a new path', shapes.every(x => x === J(K.novaPot())), J(shapes));
  const vs = [{ v: '1' }, { v: '2' }, { v: 1.5 }, { v: null }, { v: true }, { v: -1 }, { money: 5 }].map(c => K.migrate(c));
  check('a save of another version (v "1", "2", 1.5, null, true, -1, none): null', vs.every(x => x === null), J(vs));
  const once = K.migrate({ v: 2, on: true, money: 7, cars: ['pico'], pot: { stopnja: 2, pokali: { 's1-krog': 1 }, cilji: { 'mali-zmaga': true }, prve: ['kildare'], km: { mali: 12.5 } } });
  check('a save through JSON and back, migrated again: the same', J(K.migrate(JSON.parse(J(once)))) === J(once) && J(K.migrate(K.migrate(once))) === J(once));
  const evil = K.migrate(JSON.parse('{"v":2,"pot":{"stopnja":2,"pokali":{"__proto__":{"polluted":1},"constructor":2,"s1-krog":1},"cilji":{"__proto__":{"polluted":1}},"km":{"__proto__":5},"prve":["__proto__"]}}'));
  check('»__proto__« and »constructor« in a saved path: nothing outside the save changed, the rest kept', ({}).polluted === undefined && evil.pot.pokali['s1-krog'] === 1 && K.view(evil, P, []).stopnja === 2);
  const fz = tries(() => K.migrate(freeze({ v: 2, money: 5, pot: { stopnja: 2 } }))), nv = tries(() => K.novo(freeze({ money: 1 })));
  check('migrate and novo only read the save (frozen)', !(fz instanceof Error) && fz.pot.stopnja === 2 && !(nv instanceof Error) && nv.money === 1 && nv.v === 2, String(fz) + ' ' + String(nv));
}

/* ---- the other answers of the decisions (Kariera.ODLOCITVE: the plan's session switches them in one place) ---- */
{
  const before = J(K.ODLOCITVE);
  const z = (k, v, fn) => { const old = K.ODLOCITVE[k]; K.ODLOCITVE[k] = v; try { return fn(); } catch (e) { return e; } finally { K.ODLOCITVE[k] = old; } };
  check('kariera-6 »znova«: an old (v1) career starts over (null); »vse«: every stage open, no gift',
    z('stare', 'znova', () => K.migrate({ v: 1, money: 5 })) === null
    && z('stare', 'vse', () => { const c = K.migrate({ v: 1, money: 5 }); return c.pot.stopnja === K.STOPNJE.length && K.odprta(c.pot, P) === K.STOPNJE.length && !K.poPokalu(c, 's1-krog', 1, P).nagrade.some(x => x.id.startsWith('stopnja:')); }) === true);
  check('kariera-4 »pokal«: the class cups without goals (none paid); »nic«: no class cups',
    z('razredi', 'pokal', () => { const Q = K.pot(C.TRACKS, C.CATS); return Q.razredi.length === C.CATS.length && Q.razredi.every(r => !r.cilji.length) && !K.poDirki(K.novo(), { track: 'kildare', pos: 1, cat: 'mali', km: 200 }, Q).nagrade.some(x => x.id.startsWith('cilj:')); }) === true
    && z('razredi', 'nic', () => K.pot(C.TRACKS, C.CATS).razredi.length) === 0);
  check('kariera-1 »odprto«, kariera-3 »nic«: every stage open from the start', z('zgradba', 'odprto', () => K.view(K.novo(), P, []).stopnje.every(st => st.odprta)) === true && z('odklep', 'nic', () => K.odprta(K.novaPot(), P)) === K.STOPNJE.length);
  check('the decisions as they were after the switches', J(K.ODLOCITVE) === before);
}

console.log(`\n${n - bad}/${n} OK`);
if (bad) process.exit(1);
