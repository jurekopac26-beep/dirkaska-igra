// Kariera 1.0, part A and »Atlas« (js/kariera.js, docs/kariera-1-0.md): the path's events come from the real tracks only (every one of them,
// a new one by itself, never a test or pending one), the cups' sizes and names, the single events (a race, a time trial, a duel), the stars,
// the unlocking of the stages by the stars, the class cups, the move of the save from v1 to v2, the rewards and the menu's view. And the
// economy (kariera-5): a simulation of the career, wins only, must buy every car at about the end of the path (the last one at 80–105 % of
// its races) and a car of the next stage every 4–16 races (times the path's races / DIRK_REF); outside those ranges the test fails
// (kariera-5, option 2 'hitro', tuned 20. 11., with the single events 22. 11.; proge3-kariera 25. 11.: the ranges grow with the tracks).
'use strict';
const { loadCore } = require('./lib/core.js');
const C = loadCore();
const K = require('../js/kariera.js');

let n = 0, bad = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };

const real = C.TRACKS.filter(d => !d.test && !d.pending), byId = new Map(C.TRACKS.map(d => [d.id, d]));
const P = K.pot(C.TRACKS, C.CATS);
const onPath = new Set(P.pokali.concat(P.posamezne.filter(e => e.stopnja === 3 && e.kind === 'dirka')).flatMap(c => c.tracks)),   // (an ice track: stage 3's single race, in no cup)
  inClass = new Set(P.razredi.flatMap(c => c.tracks));

/* ---- the path: only the real tracks, every one of them ---- */
check('every real track is on the path', real.every(d => onPath.has(d.id)), real.filter(d => !onPath.has(d.id)).map(d => d.id).join(', '));
const nu = [...onPath, ...inClass].filter(id => !byId.has(id) || byId.get(id).test || byId.get(id).pending);
check('no test or pending track on the path or in a class cup', !nu.length, nu.join(', '));
// (proge3-kariera: a stage VELIKOST events, more when its cups and class cups leave no room for a race, a time trial and a duel)
const velikost = (s, i) => Math.max(K.VELIKOST[i], s.pokali.length + P.razredi.filter(r => r.stopnja === s.n).length + K.VRSTE_POS.length);
check('5 stages of ' + K.VELIKOST.join('/') + ' events at least (' + P.vse.length + '), room for 3 single events, stages 1–4 with 2 cups at least, stage 5 the final', P.stopnje.length === 5
  && P.vse.length === P.stopnje.reduce((a, s) => a + s.dogodki.length, 0)
  && P.stopnje.every((s, i) => s.dogodki.length === velikost(s, i) && (s.n === 5 ? s.pokali.join() === 's4-finale' : s.pokali.length >= 2)), P.stopnje.map(s => s.dogodki.length + ':' + s.pokali.length).join('/'));
const sizes = P.pokali.filter(c => c.vrsta !== 'finale').filter(c => c.tracks.length < 3 || c.tracks.length > K.NAJVEC);
check('a stage cup has 3–6 races', !sizes.length, sizes.map(c => c.id + ':' + c.tracks.length).join(', '));
const fin = P.pokali.find(c => c.id === 's4-finale');
check('the final: stage 5, 8–10 circuits, from 5 continents at least', fin && fin.stopnja === 5 && fin.tracks.length >= 8 && fin.tracks.length <= 10 && new Set(fin.tracks.map(id => K.celina(byId.get(id)))).size >= 5
  && fin.tracks.every(id => K.vrsta(byId.get(id)) === 'krog'), fin && fin.tracks.join(','));
check('a stage of 1–3: a circuit cup and a road cup', [1, 2, 3].every(s => ['krog', 'cesta'].every(v => P.pokali.some(c => c.stopnja === s && c.vrsta === v))));
check('time trials only in stage 4', P.pokali.filter(c => c.tracks.some(id => byId.get(id).timeTrial)).every(c => c.stopnja === 4 && (c.vrsta === 'tt')));
const ids = P.vse.map(c => c.id);
check('every event of a stage once, in no other stage', ids.every(id => P.stopnje.filter(s => s.dogodki.includes(id)).length === 1));
check('cup ids unique', new Set(ids).size === ids.length);
const noName = P.vse.filter(c => !c.name || !c.en || !c.en.name).concat(P.stopnje.filter(s => !s.name || !s.en || !s.en.name));
check('every cup and stage has its Slovene and English name', !noName.length, noName.map(c => c.id || c.n).join(', '));
check('the stages grow longer: the tracks of stage 1 shorter on average than of 2, of 2 than of 3', (() => {
  const avg = (s) => { const t = P.pokali.filter(x => x.stopnja === s).flatMap(x => x.tracks); return t.reduce((a, id) => a + K.km(byId.get(id)), 0) / t.length; };
  return avg(1) < avg(2) && avg(2) < avg(3);
})());
// a track's km without building it: within 2 % of Core's Track on a circuit, an open road and a long track
for (const id of ['kildare', 'tianmen', 'livorno']) {
  const d = byId.get(id), T = new C.Track(d), want = (d.open ? T.raceLen : T.len) / 1000, got = K.km(d);
  check(`km of ${id} close to the built track`, d.realKm ? got === d.realKm : Math.abs(got - want) / want < 0.02, `${got.toFixed(3)} / ${want.toFixed(3)}`);
}

/* ---- Atlas: the single events, the stars, the coins, the thresholds ---- */
{
  const E = P.posamezne, tr = E.map(e => e.tracks[0]), modes = (d) => d.modes || [];
  check('a single event: a race, a time trial or a duel, on one real track of its stage', E.length && E.every(e => K.VRSTE_POS.includes(e.kind) && e.tracks.length === 1
    && byId.has(e.tracks[0]) && P.stopnje[e.stopnja - 1].dogodki.includes(e.id)), E.length + '');
  check('the single events on as many tracks as there are of them', new Set(tr).size === tr.length, tr.join(','));
  check('a time trial only with medals, a race and a duel only where the track races', E.every(e => {
    const d = byId.get(e.tracks[0]);
    return e.kind === 'kronometer' ? d.medals && e.vrsta === 'tt' && (d.timeTrial || modes(d).includes('tt')) : (!d.timeTrial || modes(d).includes('race')) && e.vrsta !== 'tt';
  }));
  check('a duel: one rival', E.filter(e => e.kind === 'dvoboj').every(e => e.n === 1) && E.some(e => e.kind === 'dvoboj'));
  check('every stage a race, a time trial and a duel', P.stopnje.every(s => K.VRSTE_POS.every(k => E.some(e => e.stopnja === s.n && e.kind === k))));
  const z = (kind, places) => places.map(pl => K.zvezdice({ kind }, pl)).join('');
  check('the stars: a cup the first three, a race the first six, a duel the win, a time trial its medal', z('pokal', [1, 2, 3, 4]) === '3210' && z('razred', [1, 3, 4]) === '310'
    && z('finale', [2]) === '2' && z('dirka', [1, 2, 3, 4, 6, 7]) === '322110' && z('dvoboj', [1, 2]) === '30' && z('kronometer', [1, 2, 3, 4]) === '3210' && z('dirka', [0]) === '0');
  const up = P.vse.filter(x => { const k = K.kovanci(x, P); return !(k[0] > 0 && k[0] < k[1] && k[1] < k[2]); });
  check('the coins: 1★ < 2★ < 3★ for every event', !up.length, up.map(x => x.id).join(', '));
  check('the coins grow with the stage', [2, 3, 4, 5].every(s => P.nagrade.posamezna[s].every((x, i) => x > P.nagrade.posamezna[s - 1][i])));
  check('the thresholds: 0/9/21/36/54 of 132 stars, scaled (stage 2 at 9 always) to the path\'s ' + P.max, P.max === 3 * P.vse.length && P.pragovi.join('/') === K.PRAG.map((x, i) => i === 1 ? x : Math.round(x * P.max / 132)).join('/'), P.max + ': ' + P.pragovi.join('/'));
  check('the rewards: times DIRK_REF / the path\'s races (' + K.DIRK_REF + ' / ' + P.dirk + '), 1 at most, rounded to 500', P.faktor === Math.min(1, K.DIRK_REF / P.dirk)
    && P.nagrade.pokal[1].every((x, i) => x === Math.max(500, Math.round(K.NAGRADE.pokal[1][i] * P.faktor / 500) * 500)), P.faktor + '');
  const cene = {}; for (const m of C.MODELS) { const pr = C.CAREER.car[m.id]; if (pr && !m.retired && !(cene[m.cat] <= pr)) cene[m.cat] = pr; }
  const Q = K.pot(C.TRACKS, C.CATS, cene), rs = Q.razredi.slice().sort((a, b) => a.stopnja - b.stopnja);
  check('the class cups: two a stage, by the price of the class\'s cheapest car', P.stopnje.every(s => Q.razredi.filter(r => r.stopnja === s.n).length === 2)
    && rs.every(a => rs.every(b => a.stopnja >= b.stopnja || cene[a.cat] <= cene[b.cat])), rs.map(r => r.stopnja + r.cat).join(' '));
}

/* ---- a new real track joins by itself; a test or pending one does not ---- */
{
  const base = byId.get('montreal'), nova = Object.assign({}, base, { id: 'nova-x', en: { name: 'Nova, Canada' } });
  const P2 = K.pot(C.TRACKS.concat([nova]), C.CATS);
  check('a new real track joins the path', P2.pokali.some(c => c.tracks.includes('nova-x')));
  const P3 = K.pot(C.TRACKS.concat([Object.assign({}, nova, { test: true }), Object.assign({}, nova, { id: 'nova-y', pending: true })]), C.CATS);
  check('a new test or pending track does not', !P3.vse.some(c => c.tracks.includes('nova-x') || c.tracks.includes('nova-y')));
  // seven more tracks of one stage: another cup of the same stage, the cups still 3–6
  const more = [1, 2, 3, 4, 5, 6, 7].map(i => Object.assign({}, byId.get('kildare'), { id: 'nova-k' + i }));
  const P4 = K.pot(C.TRACKS.concat(more), C.CATS), s1 = P4.pokali.filter(c => c.stopnja === 1 && c.vrsta === 'krog');
  check('more tracks of a stage: another cup of it', s1.length >= 2 && s1.every(c => c.tracks.length >= 3 && c.tracks.length <= K.NAJVEC), s1.map(c => c.tracks.length).join('/'));
}

/* ---- class cups and goals (kariera-4) ---- */
check('a class cup for every class, 3 races, 3 goals', P.razredi.length === C.CATS.length && P.razredi.every(r => r.tracks.length === K.RAZRED_N && r.cilji.length === 3));
check('the rally and off-road cups on roads, one gravel road at least', ['reli', 'teren'].every(cat => {
  const r = P.razredi.find(x => x.cat === cat), gr = (d) => d.roadSurface === 'makadam' || (Array.isArray(d.surf) && d.surf.some(s => s && s[2] === 'makadam'));
  return r.tracks.every(id => byId.get(id).open) && r.tracks.some(id => gr(byId.get(id)));
}));
check('the racing cars and trucks on circuits', ['dirkalni', 'tovornjaki'].every(cat => P.razredi.find(x => x.cat === cat).tracks.every(id => K.vrsta(byId.get(id)) === 'krog')));

/* ---- unlocking (kariera-1, kariera-3; Atlas: by the stars) ---- */
{
  const ev = (n) => P.stopnje[n - 1].dogodki.map(id => P.vse.find(x => x.id === id)).filter(x => x.kind !== 'razred');
  const e1 = ev(1), p = K.novaPot();
  check('a new career: stage 1 open', K.odprta(p, P) === 1);
  p.pokali[e1[0].id] = 1; p.pokali[e1[1].id] = 1; p.pokali[e1[2].id] = 3;
  check('7 stars: still stage 1', K.odprta(p, P) === 1, e1.slice(0, 3).map(x => x.id).join(','));
  p.pokali[e1[3].id] = 4;
  check('4th place in a cup: no star', K.odprta(p, P) === 1);
  p.pokali[e1[3].id] = 2;
  check('the 9th star: stage 2 opens', K.odprta(p, P) === 2);
  const st = (id, cats) => K.stanje(p, P.vse.find(c => c.id === id), P, cats).stanje;
  check('the event states', st(e1[0].id) === 'osvojen' && st(e1[4].id) === 'odprt' && st(ev(2)[0].id) === 'odprt' && st(ev(3)[0].id) === 'zaklenjen'
    && K.stanje(K.novaPot(), ev(2)[0], P).stanje === 'zaklenjen');
  const r1 = P.razredi.find(r => r.stopnja === 1).id, r5 = P.razredi.find(r => r.stopnja === 5);
  check('a class cup: locked without a car of its class or before its stage, open with one in it', st(r1, ['x']) === 'zaklenjen'
    && st(r1, [P.razredi.find(r => r.id === r1).cat]) === 'odprt' && st(r5.id, [r5.cat]) === 'zaklenjen');
  for (const n of [1, 2, 3, 4]) for (const x of ev(n)) p.pokali[x.id] = 1;
  check('every event of stages 1–4 won: stage 5', K.odprta(p, P) === 5 && st(r5.id, [r5.cat]) === 'odprt');
  check('a stage once open stays open', K.odprta({ stopnja: 3, pokali: {} }, P) === 3);
}

/* ---- the save: v1 to v2 (kariera-6) ---- */
{
  const v1 = { v: 1, on: true, money: 123450, cars: ['pico', 'rally'], upg: { pico: { engine: 2 } }, earned: 400000, races: 30, wins: 12, rival: 'x', rent: null, garage: { cars: ['pico'] } };
  const copy = JSON.parse(JSON.stringify(v1)), v2 = K.migrate(v1);
  check('v1 to v2: every old field kept', v2.v === 2 && ['on', 'money', 'cars', 'upg', 'earned', 'races', 'wins', 'rival', 'rent', 'garage'].every(k => JSON.stringify(v2[k]) === JSON.stringify(v1[k])));
  check('v1 to v2: the path starts in stage 1', v2.pot && v2.pot.stopnja === 1 && !Object.keys(v2.pot.pokali).length && Array.isArray(v2.pot.prve));
  check('migrate does not change its argument', JSON.stringify(v1) === JSON.stringify(copy));
  check('migrate of a v2 save: the same', JSON.stringify(K.migrate(v2)) === JSON.stringify(v2));
  check('junk: null', [null, undefined, 5, 'x', [], {}, { v: 3 }, { v: 0 }].every(x => K.migrate(x) === null));
  const dirty = K.migrate({ v: 2, money: 5, pot: { stopnja: 99, pokali: { a: 2, b: -1, c: 'x' }, cilji: { g: 1 }, prve: ['kildare', 'kildare', 3], km: { mali: 12.5, x: -1 } } });
  check('a damaged v2 path is cleaned', dirty.pot.stopnja === K.STOPNJE.length && JSON.stringify(dirty.pot.pokali) === '{"a":2}' && dirty.pot.cilji.g === true
    && dirty.pot.prve.length === 1 && JSON.stringify(dirty.pot.km) === '{"mali":12.5}', JSON.stringify(dirty.pot));
  check('novo: v2 with an empty path', K.novo({ money: 10000 }).v === 2 && K.novo().pot.stopnja === 1);
}

/* ---- the rewards ---- */
{
  const s1 = P.stopnje[0].pokali, T = P.nagrade.pokal[1];
  let c = K.novo({ money: 0 });
  let r = K.poPokalu(c, s1[0], 3, P);
  check('a cup in 3rd: its prize', r.nagrade.length === 1 && r.nagrade[0].amount === T[2]);
  r = K.poPokalu(r.career, s1[0], 1, P);
  check('the same cup later in 1st: the difference', r.nagrade.length === 1 && r.nagrade[0].amount === T[0] - T[2]);
  const again = K.poPokalu(r.career, s1[0], 1, P);
  check('and again in 1st: nothing', !again.nagrade.length);
  check('a worse place does not lower the best', K.poPokalu(r.career, s1[0], 5, P).career.pot.pokali[s1[0]] === 1);
  const e1 = P.posamezne.filter(e => e.stopnja === 1), Q = P.nagrade.posamezna[1];
  r = K.poPokalu(r.career, s1[1], 1, P);
  check('6 stars: no new stage yet', r.career.pot.stopnja === 1 && !r.nagrade.some(x => x.id.startsWith('stopnja:')));
  r = K.poPokalu(r.career, e1[1].id, 3, P);
  check('a time trial\'s bronze: 1 star and its coins', r.nagrade.length === 1 && r.nagrade[0].amount === Q[0] && r.zvezdice.prej === 0 && r.zvezdice.zdaj === 1, JSON.stringify(r.nagrade));
  r = K.poPokalu(r.career, e1[0].id, 2, P);
  const gift = r.nagrade.find(x => x.id === 'stopnja:2');
  check('the 9th star (a race in 2nd: 2 stars): the new stage and its gift', r.career.pot.stopnja === 2 && gift && gift.amount === P.nagrade.stopnja[2] && r.stopnja.prej === 1
    && r.stopnja.zdaj === 2 && r.nagrade.some(x => x.id === 'pokal:' + e1[0].id && x.amount === Q[1]));
  r = K.poPokalu(r.career, e1[0].id, 1, P);
  check('the race won later: the difference to 3 stars', r.nagrade.length === 1 && r.nagrade[0].amount === Q[2] - Q[1] && r.zvezdice.prej === 2 && r.zvezdice.zdaj === 3);
  // (the first duel of the path, whatever its stage: with more tracks a stage's cups fill it and its single events are fewer, stage 1 may have none)
  const d1 = P.posamezne.find(e => e.kind === 'dvoboj'), duel = K.poPokalu(r.career, d1.id, 2, P);
  check('a duel lost: no star, nothing paid, the event not won', !duel.nagrade.length && duel.zvezdice.zdaj === 0
    && K.stanje(duel.career.pot, P.vse.find(x => x.id === d1.id), P).stanje !== 'osvojen');
  check('the career passed in is not changed', c.pot.stopnja === 1 && !Object.keys(c.pot.pokali).length);
  const ev = { track: 'kildare', pos: 1, car: 'pico', cat: 'mali', km: 12 };
  let d = K.poDirki(K.novo(), ev, P);
  check('the first win on a track: once, and the class win goal', d.nagrade.some(x => x.id === 'prva:kildare' && x.amount === P.nagrade.prva[1]) && d.nagrade.some(x => x.id === 'cilj:mali-zmaga'));
  const d2 = K.poDirki(d.career, ev, P);
  check('the second win there: no path reward', !d2.nagrade.length);
  check('a 2nd place: no first win', !K.poDirki(K.novo(), Object.assign({}, ev, { pos: 2 }), P).nagrade.some(x => x.id.startsWith('prva:')));
  let k = K.novo();
  for (let i = 0; i < 8; i++) k = K.poDirki(k, { track: 'kildare', pos: 3, cat: 'mali', km: 11.5 }, P).career;
  const last = K.poDirki(k, { track: 'kildare', pos: 3, cat: 'mali', km: 11.5 }, P);
  check('100 km in a class: its goal', !k.pot.cilji['mali-km'] && last.nagrade.some(x => x.id === 'cilj:mali-km') && last.career.pot.km.mali >= 100);
  check('a time trial medal: its goal', K.poDirki(K.novo(), { track: 'katu', pos: 0, cat: 'reli', km: 5, medal: 'bronze' }, P).nagrade.some(x => x.id === 'cilj:reli-medalja'));
}

/* ---- the menu's view ---- */
{
  const c = K.poPokalu(K.novo({ on: true, money: 5000 }), P.stopnje[0].pokali[0], 1, P).career, v = K.view(c, P, ['mali']);
  const first = v.stopnje[0].dogodki.find(e => e.id === P.stopnje[0].pokali[0]);
  check('view: stage, the stars, stages with events, classes', v.on && v.stopnja === 1 && v.stopenj === 5 && v.napredek.done === 3 && v.napredek.need === P.pragovi[1]
    && v.stopnje.length === 5 && v.stopnje[0].odprta && !v.stopnje[1].odprta && first && first.stanje === 'osvojen' && first.zvezdice === 3
    && v.stopnje.every((s, i) => s.dogodki.length === P.stopnje[i].dogodki.length && s.pokali === s.dogodki) && v.atlas.zvezdice === 3 && v.atlas.max === P.max
    && v.razredi.length === C.CATS.length && v.razredi.find(r => r.cat === 'mali').stanje === 'odprt' && v.razredi.find(r => r.cat === 'reli').stanje === 'zaklenjen'
    && v.razredi[0].cilji.length === 3);
  check('view: every event its kind and coins', v.stopnje.every(s => s.dogodki.every(e => ['pokal', 'finale', 'razred', 'dirka', 'dvoboj', 'kronometer'].includes(e.kind)
    && e.kovanci.length === 3 && e.kovanci[2] > e.kovanci[0])));
  check('view is plain data (JSON round trip)', JSON.stringify(JSON.parse(JSON.stringify(v))) === JSON.stringify(v));
  check('view of no career', K.view(null, P).stopnja === 1);
}

/* ---- the economy (kariera-5): wins only, Core's race prizes (8 cars) plus the path's rewards ---- */
{
  const models = C.MODELS.filter(m => !m.retired), price = (id) => C.CAREER.car[id] || 0, catOf = (id) => models.find(m => m.id === id).cat;
  // strategy 'cheap': buys the cheapest car it can as soon as it can, races the dearest it has; the path's events in order (Atlas: the cups
  // and the single events), a class's cup when it has a car of the class and the cup's stage is open; after the path the plan's measure
  // (normal difficulty, 4 km). 'save': saves for the cheapest car worth the stage after the highest open one (Kariera.AVTO_STOPNJE; Atlas:
  // a stage opens with the stars, before its events are done) and buys only that
  function sim(strategy) {
    let car = K.novo({ money: C.CAREER.start, cars: [C.CAREER.car0] }), wins = 0, stage = 1, last = 0;
    const bought = {}, classDone = new Set();
    const best = () => car.cars.slice().sort((a, b) => price(b) - price(a))[0];
    const take = (r) => { car = r.career; for (const x of r.nagrade) car.money += x.amount; };
    const buy = () => {
      if (strategy === 'cheap') for (;;) {
        const m = models.filter(x => !car.cars.includes(x.id)).sort((a, b) => price(a.id) - price(b.id))[0];
        if (!m || price(m.id) > car.money) return;
        car.money -= price(m.id); car.cars = car.cars.concat([m.id]); if (car.cars.length === models.length) last = wins;
      } else {
        stage = K.odprta(car.pot, P);
        const tgt = K.AVTO_STOPNJE[stage + 1];
        if (!tgt || bought[stage] || car.money < tgt) return;
        const m = models.filter(x => price(x.id) >= tgt).sort((a, b) => price(a.id) - price(b.id))[0];
        if (!m) return;
        car.money -= price(m.id); car.cars = car.cars.concat([m.id]); bought[stage] = wins;
      }
    };
    const race = (track, diff, km, id) => {
      car.money += C.careerPrize(1, 8, km * 1000, diff, id); wins++;
      take(K.poDirki(car, { track, pos: 1, car: id, cat: catOf(id), km }, P)); buy();
    };
    const lapsKm = (c, id) => K.km(byId.get(id)) * (c.laps || Math.max(1, byId.get(id).laps || 1));
    const classCups = () => {
      if (strategy !== 'cheap') return;
      for (const id of car.cars.slice()) {
        const r = P.razredi.find(x => x.cat === catOf(id));
        if (!r || classDone.has(r.cat) || r.stopnja > K.odprta(car.pot, P)) continue;
        classDone.add(r.cat);
        for (const t of r.tracks) race(t, r.diff, lapsKm(r, t), id);
        take(K.poPokalu(car, r.id, 1, P));
      }
    };
    for (const st of P.stopnje) {
      for (const cid of st.dogodki) {
        const c = P.vse.find(x => x.id === cid);
        if (c.kind === 'razred') continue;
        for (const t of c.tracks) race(t, c.diff, lapsKm(c, t), best());
        take(K.poPokalu(car, cid, 1, P)); buy(); classCups();
      }
    }
    const path = wins;
    if (strategy === 'cheap') while (car.cars.length < models.length && wins < 2000) { race('-', 1, 4, best()); classCups(); }
    return { wins, path, last, cars: car.cars.length, bought };
  }
  const a = sim('cheap');
  check('every car at about the end of the path: the last at 80–105 % of its races (kariera-5, proge3-kariera)', a.cars === models.length && a.last >= 0.8 * a.path && a.last <= 1.05 * a.path,
    `the last after ${a.last} wins, ${a.path} on the path, ${a.cars}/${models.length} cars`);
  const b = sim('save'), at = [0, b.bought[1], b.bought[2], b.bought[3], b.bought[4]], gaps = [1, 2, 3, 4].map(s => at[s] - at[s - 1]);
  const most = Math.round(16 * Math.max(1, P.dirk / K.DIRK_REF));
  check('a car of the next stage every 4–' + most + ' races (16 times ' + P.dirk + ' / ' + K.DIRK_REF + ')', [1, 2, 3, 4].every(s => Number.isFinite(at[s])) && gaps.every(g => g >= 4 && g <= most), `bought after ${at.slice(1).join(', ')} races`);
}

console.log(`\n${n - bad}/${n} OK`);
if (bad) process.exit(1);
