// The career's path of 1.0 in a real page (js/kariera.js, docs/kariera-1-0.md; part B): the menu's bridge, MenuBridge.kariera() (the view)
// and MenuBridge.karieraStart(id) (a cup started; window.__game's kariera and karieraStart call them), with the saves on the disk:
//   1. no career: no view (null), no cup started
//   2. a career of before 1.0 (v 1, no path; the pico and the kaze): the path added in stage 1; still v 1 in memory, the save on the disk as
//      it was (the game writes it at its next save); the view: stage 1 open, stage 2 locked, the class cups by the cars owned, the money
//   3. the bridge's refusals, each with its toast and no championship: an unknown cup (no toast), a locked one (Superavti: no supercar), a
//      car not owned, a car of another class
//   4. a save of v 2 with a damaged path: cleaned (the places whole from 1, the goals true, the first wins strings once, the km over 0, the
//      junk gone); v 1 in memory, the save on the disk as it was; the view: stage 2 open (kept), the cups won, the goal done, the km
//   5. a class cup (Pokal razreda · Mali avti) started from the bridge in the pico: its championship saved; its first round (Ghoufi) driven
//      to the finish: the path is Kariera.poDirki's of the career before the race and this race (the class km past 100: that goal and its
//      reward whatever the place; a win: the first win on the track too), the rewards paid as they are (the money and the earnings) and on
//      the results screen, the race counted, the save v 1 (it was v 2) with the path, the championship with its round
//   6. another cup while that one runs: refused
// (part B's logic alone, every path and cup, the rewards, the edge cases: tests/kariera-pot.test.js)
// Run: node tests/browser/kariera-pot.test.mjs
import { serve, launch, openGame, driveToResults, checker } from './lib.mjs';

const T = checker('kariera-pot');
const srv = await serve();
const browser = await launch();
const U = (motor, gume, zavore, aero) => ({ motor, gume, zavore, aero });
// (the path compared as canonical JSON: its fields in any order)
const canon = (x) => JSON.stringify(x, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(q => [q, v[q]])) : v);
// a cup of the view by its id (a stage's or a class cup)
const cupIn = (v, id) => v && v.razredi.concat(v.stopnje.flatMap(s => s.pokali)).find(c => c.id === id);   // (a class cup: its entry with the goals)
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'jezero', car: 0 }, { width: 390, height: 844 });
  const reload = async (save) => { await page.evaluate((j) => localStorage.setItem('tdgp-career', JSON.stringify(j)), save); await page.reload(); await page.waitForFunction(() => window.__game, null, { timeout: 120000 }); };
  // a cup started from the bridge in a car (its id): what the bridge gave, the toast it showed, the championship saved
  const start = (id, car) => page.evaluate(async ([id, car]) => {
    const g = window.__game, el = document.getElementById('toast');
    g.S.car = Core.MODELS.findIndex(m => m.id === car); el.textContent = '';
    const ok = g.karieraStart(id); await new Promise(r => setTimeout(r, 150));
    return { ok, toast: el.textContent, champ: localStorage.getItem('tdgp-champ') };
  }, [id, car]);
  const views = (v) => JSON.stringify(v && { stopnja: v.stopnja, napredek: v.napredek, money: v.money, prve: v.prve, stopnje: v.stopnje.map(s => s.n + (s.odprta ? '+' : '-') + ' ' + s.pokali.map(c => c.id + ':' + c.stanje + ':' + c.best).join()),
    razredi: v.razredi.map(r => r.id + ':' + r.stanje + ':' + r.best).join(), mali: (cupIn(v, 'r-mali') || {}).cilji });

  // 1. no career
  const v1 = await page.evaluate(() => window.__game.kariera()), s1 = await start('s1-cesta', 'pico');
  T.check('no career: no view of the path (null), no cup started (no championship)', v1 === null && s1.ok === false && !s1.champ, JSON.stringify({ v1, s1 }));

  // 2. a career of before 1.0
  const old = { v: 1, on: true, money: 5000, earned: 0, races: 0, wins: 0, cars: ['pico', 'kaze'], upg: { pico: U(0, 0, 0, 0), kaze: U(0, 0, 0, 0) } };
  await reload(old);
  const a = await page.evaluate(() => { const g = window.__game; return { v: g.career.v, pot: g.career.pot, disk: localStorage.getItem('tdgp-career'), view: g.kariera() }; });
  T.check('a career of before 1.0 (v 1, no path): the path added in stage 1, nothing won; still v 1 in memory, the save on the disk as it was',
    a.v === 1 && canon(a.pot) === canon({ stopnja: 1, pokali: {}, cilji: {}, prve: [], km: {} }) && a.disk === JSON.stringify(old), JSON.stringify({ v: a.v, pot: a.pot, disk: a.disk }));
  const va = a.view;
  const ev1 = (v, n) => v.stopnje[n - 1].pokali.filter(c => c.kind !== 'razred');
  T.check('its view: stage 1 open (its events open, none won; 9★ open the next), stage 2 locked (its class cup Športni avti too, the kaze owned); stage 1\'s class cups by the cars owned (Mali avti: the pico; no racing car), Superavti locked; the money; no first win',
    !!va && va.on && va.stopnja === 1 && va.stopnje[0].odprta && ev1(va, 1).every(c => c.stanje === 'odprt' && c.best === 0) && va.napredek.done === 0 && va.napredek.need === 9
    && !va.stopnje[1].odprta && va.stopnje[1].pokali.every(c => c.stanje === 'zaklenjen')
    && cupIn(va, 'r-mali').stanje === 'odprt' && cupIn(va, 'r-dirkalni').stanje === 'zaklenjen' && cupIn(va, 'r-sportni').stanje === 'zaklenjen' && cupIn(va, 'r-super').stanje === 'zaklenjen' && va.money === 5000 && va.prve === 0, views(va));

  // 3. the refusals
  const r1 = await start('ni-pokala', 'pico'), r2 = await start('r-super', 'pico'), r3 = await start('s1-cesta', 'strega'), r4 = await start('r-mali', 'kaze');
  T.check('the bridge refuses an unknown cup (no toast, no championship)', r1.ok === false && r1.toast === '' && !r1.champ, JSON.stringify(r1));
  T.check('… a locked cup (Superavti: no supercar owned), with its toast', r2.ok === false && r2.toast === 'Ta pokal je še zaklenjen.' && !r2.champ, JSON.stringify(r2));
  T.check('… a car not owned (the strega), with its toast', r3.ok === false && /^Ta avto še ni tvoj/.test(r3.toast) && !r3.champ, JSON.stringify(r3));
  T.check('… a car of another class (the kaze, a sports car, in the Mali avti cup), with its toast', r4.ok === false && r4.toast === 'Za ta pokal izberi avto njegovega razreda.' && !r4.champ, JSON.stringify(r4));

  // 4. a save of v 2 with a damaged path (the class km 0.1 short of its goal: the race of 5 passes it)
  const dmg = { v: 2, on: true, money: 1000, earned: 2000, races: 3, wins: 1, cars: ['pico'], upg: { pico: U(0, 0, 0, 0) },
    pot: { stopnja: 2, pokali: { 's1-krog': 2, 's1-cesta': 0, 'r-mali': 2.7, 's2-krog-1': -1 }, cilji: { 'mali-zmaga': 1, 'mali-medalja': 0 }, prve: ['hiva', 'hiva', 7, null], km: { mali: 99.9, sportni: -5, super: 'x' }, smeti: 1 } };
  await reload(dmg);
  const b = await page.evaluate(() => { const g = window.__game; return { v: g.career.v, pot: g.career.pot, disk: localStorage.getItem('tdgp-career'), view: g.kariera() }; });
  T.check('a save of v 2 with a damaged path: cleaned (the places whole from 1, the goals true, the first wins strings once, the km over 0, the junk gone); v 1 in memory, the save on the disk as it was',
    b.v === 1 && canon(b.pot) === canon({ stopnja: 2, pokali: { 's1-krog': 2, 'r-mali': 2 }, cilji: { 'mali-zmaga': true }, prve: ['hiva'], km: { mali: 99.9 } }) && b.disk === JSON.stringify(dmg),
    JSON.stringify({ v: b.v, pot: b.pot, disk: b.disk }));
  const vb = b.view, gm = (id) => ((cupIn(vb, 'r-mali') || {}).cilji || []).find(x => x.id === id) || {};
  T.check('its view: stage 2 open (kept, though only 4★ of the 9), its events open, stage 3 locked (21★); the cups won (2nd); Športni avti locked (no sports car now); the class goals (the win done, the km 99 of 100); one first win',
    !!vb && vb.stopnja === 2 && vb.stopnje[1].odprta && ev1(vb, 2).every(c => c.stanje === 'odprt') && !vb.stopnje[2].odprta && vb.napredek.done === 4 && vb.napredek.need === 21
    && cupIn(vb, 's1-krog').stanje === 'osvojen' && cupIn(vb, 's1-krog').best === 2 && cupIn(vb, 's1-cesta').stanje === 'odprt' && cupIn(vb, 'r-mali').stanje === 'osvojen' && cupIn(vb, 'r-mali').best === 2
    && cupIn(vb, 'r-sportni').stanje === 'zaklenjen' && gm('mali-zmaga').done === true && gm('mali-medalja').done === false && gm('mali-km').done === false && gm('mali-km').progress === 99 && vb.prve === 1 && vb.money === 1000, views(vb));

  // 5. the class cup from the bridge: its first round driven to the finish
  const go = await page.evaluate(() => {
    const g = window.__game; g.S.car = Core.MODELS.findIndex(m => m.id === 'pico');
    const before = JSON.parse(JSON.stringify(g.career)), ok = g.karieraStart('r-mali');
    return { ok, before, champ: JSON.parse(localStorage.getItem('tdgp-champ') || 'null') };
  });
  T.check('the class cup Mali avti started from the bridge in the pico: its championship saved (its difficulty, the car, 19 rivals, no round yet)',
    go.ok === true && !!go.champ && go.champ.id === 'r-mali' && go.champ.diff === 1 && go.champ.car === 'pico' && go.champ.n === 19 && go.champ.rounds.length === 0, JSON.stringify(go.champ));
  await page.waitForFunction(() => { const g = window.__game; return !!(g.race && g.race.track.def.id === 'ghoufi' && g.race.champ); }, null, { timeout: 90000 });
  await driveToResults(page);
  const r = await page.evaluate((before) => {
    const g = window.__game, c = g.career, R = g.race, P = R.player, tk = R.track, disk = JSON.parse(localStorage.getItem('tdgp-career'));
    const out = !P.finished && R.isOut(P), pos = out ? 0 : parseInt(document.getElementById('res-pos').textContent, 10);
    // (the race's end as the game passes it, js/game.js careerPath: the place, 0 a retirement; the km driven, at most the race's)
    const ev = { track: tk.def.id, pos, car: P.m.id, cat: P.m.cat, km: Math.min(Math.max(P.dist, 0), tk.open ? tk.raceLen : tk.len * R.laps) / 1000 };
    return { ev, exp: Kariera.poDirki(before, ev, Kariera.pot(Core.TRACKS, Core.CATS)), pot: c.pot, view: g.kariera(), money: c.money - before.money, earned: c.earned - before.earned,
      races: c.races - before.races, wins: c.wins - before.wins, sub: document.getElementById('res-sub').textContent, v: disk.v, disk: disk.pot, champ: JSON.parse(localStorage.getItem('tdgp-champ') || 'null') };
  }, go.before);
  const ids = r.exp.nagrade.map(n => n.id), sum = r.exp.nagrade.reduce((s, n) => s + n.amount, 0), won = r.ev.pos === 1, km = ((cupIn(r.view, 'r-mali') || {}).cilji || []).find(x => x.id === 'mali-km') || {};
  T.check('round 1 (Ghoufi) driven to the finish: the path is Kariera.poDirki\'s of the career before the race and this race (the Mali avti km past 100: that goal done, in the view too; a win: the first on the track; the class win done before: not again)',
    canon(r.pot) === canon(r.exp.career.pot) && r.ev.track === 'ghoufi' && r.ev.car === 'pico' && r.ev.cat === 'mali' && r.ev.km > 0.1 && r.pot.km.mali >= 100 && r.pot.cilji['mali-km'] === true && km.done === true && km.progress === 100
    && r.pot.prve.includes('ghoufi') === won && ids.includes('cilj:mali-km') && ids.includes('prva:ghoufi') === won && !ids.includes('cilj:mali-zmaga'), JSON.stringify({ ev: r.ev, pot: r.pot, exp: r.exp }));
  T.check('its rewards paid as they are (the money and the earnings alike, over the race\'s own prize), each on the results screen; the race counted (a win only for the first place)',
    r.money === r.earned && r.money >= sum && sum >= 20000 && r.exp.nagrade.every(n => r.sub.includes(n.name + ': +')) && r.sub.includes('Mali avti · 100 km: +') && r.races === 1 && r.wins === (won ? 1 : 0),
    JSON.stringify({ money: r.money, earned: r.earned, sum, races: r.races, wins: r.wins, sub: r.sub }));
  T.check('the save after the race: v 1 (it was v 2), with the path; the championship with its first round (Ghoufi)',
    r.v === 1 && canon(r.disk) === canon(r.pot) && !!r.champ && r.champ.id === 'r-mali' && r.champ.rounds.length === 1 && r.champ.rounds[0].track === 'ghoufi',
    JSON.stringify({ v: r.v, disk: r.disk, champ: r.champ && { id: r.champ.id, rounds: r.champ.rounds.map(x => x.track) } }));

  // 6. another cup while that one runs
  const r6 = await start('s1-cesta', 'pico');
  T.check('another cup (Pokal cest · Začetnik) while the class cup runs: refused with its toast, the championship kept',
    r6.ok === false && /^Najprej končaj ali opusti prvenstvo/.test(r6.toast) && !!r6.champ && JSON.parse(r6.champ).id === 'r-mali' && JSON.parse(r6.champ).rounds.length === 1, JSON.stringify(r6));

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
