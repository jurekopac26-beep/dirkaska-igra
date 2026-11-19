// Kariera 1.0, part A (js/kariera.js, docs/kariera-1-0.md): the path's cups come from the real tracks only (every one of them, a new one by
// itself, never a test or pending one), the cups' sizes and names, the unlocking of the stages, the class cups, the move of the save from v1
// to v2, the rewards and the menu's view. And the economy (kariera-5): a simulation of the career, wins only, must buy every car in
// 250–300 wins and a car of the next stage every 6–18 races; outside those ranges the test fails (the plan's numbers, tuned 19. 11.).
'use strict';
const { loadCore } = require('./lib/core.js');
const C = loadCore();
const K = require('../js/kariera.js');

let n = 0, bad = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };

const real = C.TRACKS.filter(d => !d.test && !d.pending), byId = new Map(C.TRACKS.map(d => [d.id, d]));
const P = K.pot(C.TRACKS, C.CATS);
const onPath = new Set(P.pokali.flatMap(c => c.tracks)), inClass = new Set(P.razredi.flatMap(c => c.tracks));

/* ---- the path: only the real tracks, every one of them ---- */
check('every real track is on the path', real.every(d => onPath.has(d.id)), real.filter(d => !onPath.has(d.id)).map(d => d.id).join(', '));
const nu = [...onPath, ...inClass].filter(id => !byId.has(id) || byId.get(id).test || byId.get(id).pending);
check('no test or pending track on the path or in a class cup', !nu.length, nu.join(', '));
check('4 stages, each with 2 cups at least', P.stopnje.length === 4 && P.stopnje.every(s => s.pokali.length >= 2), P.stopnje.map(s => s.pokali.length).join('/'));
const sizes = P.pokali.filter(c => c.vrsta !== 'finale').filter(c => c.tracks.length < 3 || c.tracks.length > K.NAJVEC);
check('a stage cup has 3–6 races', !sizes.length, sizes.map(c => c.id + ':' + c.tracks.length).join(', '));
const fin = P.pokali.find(c => c.id === 's4-finale');
check('the final: 8–10 circuits, from 5 continents at least', fin && fin.tracks.length >= 8 && fin.tracks.length <= 10 && new Set(fin.tracks.map(id => K.celina(byId.get(id)))).size >= 5
  && fin.tracks.every(id => K.vrsta(byId.get(id)) === 'krog'), fin && fin.tracks.join(','));
check('a stage of 1–3: a circuit cup and a road cup', [1, 2, 3].every(s => ['krog', 'cesta'].every(v => P.pokali.some(c => c.stopnja === s && c.vrsta === v))));
check('time trials only in stage 4', P.pokali.filter(c => c.tracks.some(id => byId.get(id).timeTrial)).every(c => c.stopnja === 4 && (c.vrsta === 'tt')));
const ids = P.vse.map(c => c.id);
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

/* ---- unlocking (kariera-1, kariera-3) ---- */
{
  const s1 = P.stopnje[0].pokali, s2 = P.stopnje[1].pokali, s3 = P.stopnje[2].pokali;
  const p = K.novaPot();
  check('a new career: stage 1 open', K.odprta(p, P) === 1);
  p.pokali[s1[0]] = 1;
  check('one cup of stage 1 in the first three: still stage 1', K.odprta(p, P) === 1);
  p.pokali[s1[1]] = 4;
  check('4th place does not count', K.odprta(p, P) === 1);
  p.pokali[s1[1]] = 3;
  check('two cups in the first three: stage 2 opens', K.odprta(p, P) === 2);
  p.pokali[s2[0]] = 2; p.pokali[s2[2]] = 1; p.pokali[s3[0]] = 1; p.pokali[s3[1]] = 3;
  check('then stage 3 and 4', K.odprta(p, P) === 4);
  const st = (cupId, cats) => K.stanje(p, P.vse.find(c => c.id === cupId), P, cats).stanje;
  check('the cup states', st(s1[0]) === 'osvojen' && st(s2[1]) === 'odprt' && st(P.stopnje[3].pokali[0]) === 'odprt'
    && K.stanje(K.novaPot(), P.vse.find(c => c.id === s2[0]), P).stanje === 'zaklenjen');
  check('a class cup: locked without a car of its class, open with one', st('r-reli', ['mali']) === 'zaklenjen' && st('r-reli', ['mali', 'reli']) === 'odprt');
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
  check('a damaged v2 path is cleaned', dirty.pot.stopnja === 4 && JSON.stringify(dirty.pot.pokali) === '{"a":2}' && dirty.pot.cilji.g === true
    && dirty.pot.prve.length === 1 && JSON.stringify(dirty.pot.km) === '{"mali":12.5}', JSON.stringify(dirty.pot));
  check('novo: v2 with an empty path', K.novo({ money: 10000 }).v === 2 && K.novo().pot.stopnja === 1);
}

/* ---- the rewards ---- */
{
  const s1 = P.stopnje[0].pokali, T = K.NAGRADE.pokal[1];
  let c = K.novo({ money: 0 });
  let r = K.poPokalu(c, s1[0], 3, P);
  check('a cup in 3rd: its prize', r.nagrade.length === 1 && r.nagrade[0].amount === T[2]);
  r = K.poPokalu(r.career, s1[0], 1, P);
  check('the same cup later in 1st: the difference', r.nagrade.length === 1 && r.nagrade[0].amount === T[0] - T[2]);
  const again = K.poPokalu(r.career, s1[0], 1, P);
  check('and again in 1st: nothing', !again.nagrade.length);
  check('a worse place does not lower the best', K.poPokalu(r.career, s1[0], 5, P).career.pot.pokali[s1[0]] === 1);
  r = K.poPokalu(r.career, s1[1], 2, P);
  const gift = r.nagrade.find(x => x.id === 'stopnja:2');
  check('the second cup in the first three: the new stage and its gift', r.career.pot.stopnja === 2 && gift && gift.amount === K.NAGRADE.stopnja[2]);
  check('the career passed in is not changed', c.pot.stopnja === 1 && !Object.keys(c.pot.pokali).length);
  const ev = { track: 'kildare', pos: 1, car: 'pico', cat: 'mali', km: 12 };
  let d = K.poDirki(K.novo(), ev, P);
  check('the first win on a track: once, and the class win goal', d.nagrade.some(x => x.id === 'prva:kildare' && x.amount === K.NAGRADE.prva[1]) && d.nagrade.some(x => x.id === 'cilj:mali-zmaga'));
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
  check('view: stage, progress, stages with cups, classes', v.on && v.stopnja === 1 && v.stopenj === 4 && v.napredek.done === 1 && v.napredek.need === 2
    && v.stopnje.length === 4 && v.stopnje[0].odprta && !v.stopnje[1].odprta && v.stopnje[0].pokali[0].stanje === 'osvojen'
    && v.razredi.length === C.CATS.length && v.razredi.find(r => r.cat === 'mali').stanje === 'odprt' && v.razredi.find(r => r.cat === 'reli').stanje === 'zaklenjen'
    && v.razredi[0].cilji.length === 3);
  check('view is plain data (JSON round trip)', JSON.stringify(JSON.parse(JSON.stringify(v))) === JSON.stringify(v));
  check('view of no career', K.view(null, P).stopnja === 1);
}

/* ---- the economy (kariera-5): wins only, Core's race prizes (8 cars) plus the path's rewards ---- */
{
  const models = C.MODELS.filter(m => !m.retired), price = (id) => C.CAREER.car[id] || 0, catOf = (id) => models.find(m => m.id === id).cat;
  // strategy 'cheap': buys the cheapest car it can as soon as it can, races the dearest it has; the path's cups in order, a class's cup
  // when it gets a car of the class; after the path the plan's measure (normal difficulty, 4 km). 'save': saves for the cheapest car worth
  // the next stage (Kariera.AVTO_STOPNJE) and buys only that
  function sim(strategy) {
    let car = K.novo({ money: C.CAREER.start, cars: [C.CAREER.car0] }), wins = 0, stage = 1;
    const bought = {}, classDone = new Set();
    const best = () => car.cars.slice().sort((a, b) => price(b) - price(a))[0];
    const take = (r) => { car = r.career; for (const x of r.nagrade) car.money += x.amount; };
    const buy = () => {
      if (strategy === 'cheap') for (;;) {
        const m = models.filter(x => !car.cars.includes(x.id)).sort((a, b) => price(a.id) - price(b.id))[0];
        if (!m || price(m.id) > car.money) return;
        car.money -= price(m.id); car.cars = car.cars.concat([m.id]);
      } else {
        const tgt = K.AVTO_STOPNJE[stage + 1];
        if (!tgt || bought[stage] || car.money < tgt) return;
        const m = models.filter(x => price(x.id) >= tgt).sort((a, b) => price(a.id) - price(b.id))[0];
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
        if (!r || classDone.has(r.cat)) continue;
        classDone.add(r.cat);
        for (const t of r.tracks) race(t, r.diff, lapsKm(r, t), id);
        take(K.poPokalu(car, r.id, 1, P));
      }
    };
    for (const st of P.stopnje) {
      stage = st.n;
      for (const cid of st.pokali) {
        const c = P.pokali.find(x => x.id === cid);
        for (const t of c.tracks) race(t, c.diff, lapsKm(c, t), best());
        take(K.poPokalu(car, cid, 1, P)); buy(); classCups();
      }
    }
    const path = wins;
    if (strategy === 'cheap') while (car.cars.length < models.length && wins < 2000) { race('-', 1, 4, best()); classCups(); }
    return { wins, path, cars: car.cars.length, bought };
  }
  const a = sim('cheap');
  check('every car in 250–300 wins (kariera-5)', a.cars === models.length && a.wins >= 250 && a.wins <= 300, `${a.wins} wins, ${a.path} on the path, ${a.cars}/${models.length} cars`);
  const b = sim('save'), at = [0, b.bought[1], b.bought[2], b.bought[3]], gaps = [1, 2, 3].map(s => at[s] - at[s - 1]);
  check('a car of the next stage every 6–18 races', [1, 2, 3].every(s => Number.isFinite(at[s])) && gaps.every(g => g >= 6 && g <= 18), `bought after ${at.slice(1).join(', ')} races`);
}

console.log(`\n${n - bad}/${n} OK`);
if (bad) process.exit(1);
