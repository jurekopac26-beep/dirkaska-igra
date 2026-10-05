// The game in English (Nastavitve: Jezik · Language): every screen and the HUD show no Slovenian (no č, š, ž outside the names of
// drivers and places, no Slovenian words), with the expected English on each (the title, the cars, the upgrades, the tracks, the
// settings, the leaderboard, the championship, the career, a friend's race); a race on autopilot to the results; a vehicle of the fleet
// (the MIŠKA): its category and description on the car screen, destroyed in a race (the banner, Retire, the pause, the results with
// Retired); then the switch in the settings back to Slovenian: the page and the title in Slovenian at once, and English again.
//   node tests/browser/lang.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('lang');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { lang: 'en', quality: 'normal', shadows: 0, camera: 'chase', track: 'jezero', car: 0 }, { width: 390, height: 844 });
  const act = (a) => page.evaluate((a) => window.__game.onAction(a), a);
  const txt = (id) => page.evaluate((id) => document.getElementById(id).textContent, id);
  // the Slovenian left on what is shown (the screen on show, the HUD in a race, the toast): words with č, š, ž but the names of the
  // drivers, the tracks and the places; and Slovenian words
  const slovene = (extra) => page.evaluate((extra) => {
    const names = new Set(['Vršič', 'Kovač', 'Slovenščina']);   // (the language switch names Slovenian in Slovenian)
    for (let k = 0; k < 20; k++) for (const w of Core.aiDriver(k).name.split(/\s+/)) names.add(w);
    for (const m of Core.MODELS) for (const w of m.name.split(/\s+/)) names.add(w);   // (the names of the vehicles stay as they are: MIŠKA, JEŽEK E ...)
    const parts = [...document.querySelectorAll('.screen.show')].map(e => e.innerText);
    if (extra) for (const id of extra) { const e = document.getElementById(id); if (e) parts.push(e.innerText); }
    const text = parts.join(' \n ');
    const words = text.split(/[^A-Za-zÀ-žčšžČŠŽ]+/).filter(Boolean);
    const sl = new Set(['je', 'za', 'se', 'pri', 'od', 'ki', 'ni', 'ga', 'tvoj', 'tvoja', 'tvoje', 'proga', 'progo', 'dirka', 'dirko', 'krog', 'kroga', 'krogi', 'krogov', 'mesto', 'nazaj', 'naprej', 'vklop', 'izklop', 'nastavitve',
      'prvenstvo', 'kariera', 'lestvica', 'avto', 'voznik', 'gume', 'dež', 'suho', 'zavora', 'plin', 'kamera', 'začni', 'izberi', 'ponovi', 'glavni', 'meni', 'naj', 'čas', 'rekord', 'točke', 'zmaga', 'cilj']);
    return [...new Set(words.filter(w => (/[čšžČŠŽ]/.test(w) && !names.has(w)) || sl.has(w.toLowerCase())))];
  }, extra || null);

  // 1. the title
  const t1 = await page.evaluate(() => ({ lang: document.documentElement.lang, champ: document.getElementById('btn-champ').textContent, sub: document.getElementById('title-sub').textContent, hint: document.getElementById('title-hint').textContent,
    race: document.querySelector('[data-act="to-car"]').textContent }));
  const s1 = await slovene();
  T.check('title in English: Race, Championship, "Jezero Ring · 3 laps · 12 rivals", "Track: Jezero Ring", <html lang="en">', t1.lang === 'en' && t1.race === 'Race' && t1.champ === 'Championship' && t1.sub === 'Jezero Ring · 3 laps · 12 rivals' &&
    /^Track: Jezero Ring\. Controls: Buttons, camera: behind the car \(phone upright\)\. Change them in the settings\.$/.test(t1.hint) && !s1.length, JSON.stringify({ t1, s1 }));

  // 2. the cars and their upgrades
  await act('to-car'); await page.waitForTimeout(250);
  const c2 = await page.evaluate(() => ({ desc: document.getElementById('car-desc').textContent, stats: document.getElementById('car-stats').innerText, next: document.getElementById('car-next').textContent,
    cat: document.getElementById('car-cat').textContent, chips: [...document.querySelectorAll('#car-cats .cat-chip')].map(b => b.textContent).join('/'), strip: document.getElementById('car-strip').getAttribute('aria-label') }));
  const s2 = await slovene();
  T.check('cars in English: "Four-wheel drive. An 80s rally car ... hp", Power / Grip, Next; the categories (Small cars … Specials), "Rally · 2/3" under the name (the BURJA R7)', /^(Rear-wheel drive|Four-wheel drive|Front-wheel drive|Mid-engined)\. [A-Z][a-z].*\. \d+ hp, \d+ kg\.$/.test(c2.desc) && /Power/.test(c2.stats) && /Grip/.test(c2.stats) && c2.next === 'Next' &&
    c2.chips === 'Small cars/Sports cars/Supercars/Classics/Rally/Off-road/Racing/Trucks/Electric/Specials' && c2.cat === 'Rally · 2/3' && c2.strip === 'Vehicles in the category' && !s2.length, JSON.stringify({ c2, s2 }));
  await act('to-upg'); await page.waitForTimeout(250);
  const u2 = await page.evaluate(() => [...document.querySelectorAll('#upg-list .upg-row')].map(r => r.querySelector('.rlbl').textContent + ': ' + [...r.querySelectorAll('button')].map(b => b.textContent).join('/')).join(' | '));
  const su = await slovene();
  T.check('upgrades in English: Engine: Stock/Stage 1/Stage 2/Racing, Tyres ... Semi-slick, Brakes ... Ceramic, Aerodynamics ... GT pack', /Engine: Stock\/Stage 1\/Stage 2\/Racing/.test(u2) && /Tyres: Stock\/Sport\/Semi-slick\/Slick/.test(u2) && /Brakes: Stock\/Sport\/Racing\/Ceramic/.test(u2) && /Aerodynamics: Stock\/Spoiler\/Wing\/GT pack/.test(u2) && !su.length, JSON.stringify({ u2, su }));
  await act('upg-done'); await page.waitForTimeout(150);

  // 3. the tracks
  await act('to-track'); await page.waitForTimeout(400);
  const k3 = await page.evaluate(() => ({ names: [...document.querySelectorAll('.track-card h3')].map(h => h.textContent), meta: document.querySelector('[data-track="jezero"] .tmeta').textContent,
    pikes: document.querySelector('[data-track="pikes"] .tdesc').textContent, vrsic: [...document.querySelectorAll('[data-track="vrsic"] .tc-mode button')].map(b => b.textContent).join('/') }));
  const s3 = await slovene();
  T.check('tracks in English: Mountain Rally, Monaco, Copper Forest, Tuscany, Thunder Cape, Styria, Austria; "N corners · 3 laps"; 2,862 m; the ways to drive Vršič', ['Mountain Rally', 'Monte Carlo, Monaco', 'Copper Forest', 'Tuscany, Italy', 'Thunder Cape', 'Styria, Austria'].every(n => k3.names.includes(n)) &&
    /^\d\.\d\d km · \d+ corners · 3 laps/.test(k3.meta) && /2,862 m/.test(k3.pikes) && k3.vrsic === 'Race/Time trial/Traffic/Police' && !s3.length, JSON.stringify({ k3, s3 }));

  // 4. the settings (the language switch on English)
  await act('to-settings'); await page.waitForTimeout(200);
  const g4 = await page.evaluate(() => ({ sel: document.querySelector('[data-set="lang"] .sel').textContent, name: document.querySelector('#set-name').closest('.row').querySelector('.rlbl').textContent, aria: document.getElementById('set-name').getAttribute('aria-label') }));
  const s4 = await slovene();
  T.check('settings in English, "English" chosen, labels too (aria-label)', g4.sel === 'English' && g4.name === 'Driver name' && g4.aria === 'Driver name for the leaderboard' && !s4.length, JSON.stringify({ g4, s4 }));
  await act('settings-done'); await page.waitForTimeout(150);

  // 5. the leaderboard, the championship, the career, a friend's race
  await act('to-title'); await page.waitForTimeout(150); await act('to-board'); await page.waitForTimeout(250);
  const b5 = await txt('board-body'), s5 = await slovene();
  await page.evaluate(() => document.querySelector('[data-board="pikes"]').click()); await page.waitForTimeout(200);
  const b5p = await txt('board-body'), s5p = await slovene();
  T.check('leaderboard in English (a circuit\'s records, a time trial\'s board)', /^Records · Jezero Ring · 3 laps/.test(b5) && /Best lap/.test(b5) && /No times on this track yet\. Drive the climb/.test(b5p) && !s5.length && !s5p.length, JSON.stringify({ b5, b5p, s5, s5p }));
  await act('to-champ'); await page.waitForTimeout(250);
  const h5 = await page.evaluate(() => ({ cards: [...document.querySelectorAll('.ch-card h3')].map(h => h.textContent).join('/'), meta: document.querySelector('.ch-card .tmeta').textContent, go: document.getElementById('ch-go').textContent, diff: document.getElementById('ch-diff').textContent }));
  const sh = await slovene();
  T.check('championship in English: Home Cup / Superstars / Legends / Grand Championship, "3 races", Start the championship', h5.cards === 'Home Cup/Superstars/Legends/Grand Championship' && /^3 races · \d+ km$/.test(h5.meta) && h5.go === 'Start the championship' && /^Difficulty: medium/.test(h5.diff) && !sh.length, JSON.stringify({ h5, sh }));
  await act('to-career'); await page.waitForTimeout(200);
  const r5 = await page.evaluate(() => ({ info: document.getElementById('career-info').textContent, money: document.getElementById('career-money').textContent, toggle: document.getElementById('career-toggle').textContent,
    garage: [...document.querySelectorAll('#career-garage h4')].map(h => h.textContent).join('/'), price: (document.querySelectorAll('#career-garage .gcar .pr')[1] || {}).textContent }));   // (the MIŠKA's)
  const sr = await slovene();
  T.check('career in English, the money as €10,000; the garage under the categories (Small cars … Specials), the prices as €6,000', /^In the career you earn money/.test(r5.info) && /You start with €10,000 and the PICO TURBO\./.test(r5.info) && r5.money === '€10,000' && r5.toggle === 'Start career' &&
    r5.garage === 'Small cars/Sports cars/Supercars/Classics/Rally/Off-road/Racing/Trucks/Electric/Specials' && /^€\d+,\d{3}$/.test(r5.price || '') && !sr.length, JSON.stringify({ r5, sr }));
  await act('to-title'); await page.waitForTimeout(150); await act('to-online'); await page.waitForTimeout(250);
  const o5 = await page.evaluate(() => document.querySelector('#s-online').innerText);
  const so = await slovene();
  T.check('a friend\'s race in English (Wait for a friend, Private room with a code)', /Wait for a friend/.test(o5) && /Private room with a code/.test(o5) && !so.length, JSON.stringify({ o5: o5.slice(0, 200), so }));
  await act('to-title'); await page.waitForTimeout(200);

  // 6. a race: the HUD, the pause, the results
  await startTrack(page, 'jezero');
  await page.evaluate(() => window.__game.sim(8, true));
  // sim() advances the race but does not redraw the HUD (that happens on the next frame); drive a frame so h-lap reflects the running race, not its initial markup
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(300);
  const h6 = await page.evaluate(() => ({ lap: document.getElementById('h-lap').textContent, rank: document.querySelector('#h-rank .h-lbl').textContent, best: document.querySelector('#h-best .h-lbl').textContent }));
  const sH = await slovene(['hud', 'touch']);
  T.check('HUD in English: POS, LAP 1/3, BEST, GAS / BRAKE', h6.rank === 'POS' && /^LAP [12]\/3$/.test(h6.lap) && h6.best === 'BEST' && !sH.length, JSON.stringify({ h6, sH }));
  await page.evaluate(() => window.__game.pause()); await page.waitForTimeout(200);
  const p6 = await page.evaluate(() => ({ restart: document.getElementById('pause-restart').textContent, cam: document.getElementById('pause-cam').textContent }));
  const sp = await slovene();
  T.check('pause in English: Restart race, Camera: behind the car', p6.restart === 'Restart race' && p6.cam === 'Camera: behind the car' && !sp.length, JSON.stringify({ p6, sp }));
  await page.evaluate(() => { const g = window.__game; for (let k = 0; k < 300 && g.phase !== 'done'; k++) g.sim(2, true); if (g.phase !== 'done') g.resume(); });
  await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 180000 });
  const r6 = await page.evaluate(() => ({ title: document.getElementById('res-title').textContent, pos: document.getElementById('res-pos').textContent, sub: document.getElementById('res-sub').textContent, head: document.querySelector('#res-table thead').innerText }));
  const sR = await slovene();
  T.check('results in English: Victory! / On the podium! / Finish, "Race time ... You started 12th. (New achievements: ...)", Driver / Car / Time / Best lap', /^(Victory!|On the podium!|Finish)$/.test(r6.title) && /^\d+(st|nd|rd|th)$/.test(r6.pos) &&
    /^Race time \d+:\d\d\.\d{3}, best lap \d+:\d\d\.\d{3}.*\. You started 12th\.( New achievements: [A-Z][\w ,]+\.)?$/.test(r6.sub) && /Driver/.test(r6.head) && /Best lap/.test(r6.head) && !sR.length, JSON.stringify({ r6, sR }));

  // 6b. a vehicle of the fleet: the MIŠKA (Small cars, its engine at the back) on the car screen; in a race destroyed (wreckCar): VEHICLE
  //     DESTROYED with Retire on the HUD, the pause with View the car and Retire, the first tap asks (Really retire? and the toast), the
  //     second retires: the results with Retired; nowhere a Slovenian word
  await act('to-title'); await page.waitForTimeout(200);
  await page.evaluate(() => { const g = window.__game; g.S.car = Core.MODELS.findIndex(m => m.id === 'miska'); g.onAction('to-car'); }); await page.waitForTimeout(300);
  const f6 = await page.evaluate(() => ({ cat: document.getElementById('car-cat').textContent, desc: document.getElementById('car-desc').textContent, strip: [...document.querySelectorAll('#car-strip .car-chip b')].map(b => b.textContent).join('/') }));
  const sF = await slovene();
  T.check('a vehicle of the fleet in English: "Small cars · 2/6", "Rear-engined. A tiny Italian city car from the 60s ... hp, 560 kg."', f6.cat === 'Small cars · 2/6' && /^Rear-engined\. A tiny Italian city car from the 60s, [^.]*\. \d+ hp, 560 kg\.$/.test(f6.desc) && /MIŠKA/.test(f6.strip) && !sF.length, JSON.stringify({ f6, sF }));
  await startTrack(page, 'jezero');
  const w6 = await page.evaluate(async () => { const g = window.__game, P = g.race.player, raf = () => new Promise(q => requestAnimationFrame(q));
    g.pause(); g.sim(5, true); Core.wreckCar(P); g.sim(1, true); g.resume(); for (let i = 0; i < 6; i++) await raf();
    return { car: P.m.id, title: document.getElementById('h-wreck-t').textContent, btn: document.getElementById('btn-retire').textContent, show: document.getElementById('h-wreck').classList.contains('show') }; });
  const sW = await slovene(['hud']);
  await page.evaluate(() => window.__game.pause()); await page.waitForTimeout(200);
  const p6b = await page.evaluate(() => ({ view: document.getElementById('pause-view').textContent, retire: document.getElementById('pause-retire').textContent, on: !document.getElementById('pause-retire').classList.contains('off') }));
  const sPb = await slovene();
  await page.evaluate(() => window.__game.resume()); await page.waitForTimeout(250);
  const tap = await page.evaluate(async () => { const b = document.getElementById('btn-retire'), raf = () => new Promise(q => requestAnimationFrame(q)); for (let i = 0; i < 4; i++) await raf();
    b.click(); const ask = { btn: b.textContent, toast: document.getElementById('toast').textContent };
    b.click(); await new Promise(q => setTimeout(q, 400)); const me = document.querySelector('#res-table tr.me');
    return { ask, screen: window.__game.screen, title: document.getElementById('res-title').textContent, sub: document.getElementById('res-sub').textContent, row: me ? [...me.children].map(td => td.textContent) : null, view: document.getElementById('res-view').textContent }; });
  const sR6 = await slovene();
  T.check('destroyed in English: VEHICLE DESTROYED with Retire on the HUD; the pause: View the car, Retire; the first tap: Really retire? (Tap again …); the results: Retired, "Retired on the 1st lap", Retired in the table, View the car',
    w6.car === 'miska' && w6.show && w6.title === 'VEHICLE DESTROYED' && w6.btn === 'Retire' && !sW.length && p6b.view === 'View the car' && p6b.retire === 'Retire' && p6b.on && !sPb.length &&
    tap.ask.btn === 'Really retire?' && /^Tap again if you really want to retire/.test(tap.ask.toast) && tap.screen === 'results' && tap.title === 'Retired' && /^Retired on the 1st lap/.test(tap.sub) && tap.row && tap.row[3] === 'Retired' && tap.view === 'View the car' && !sR6.length,
    JSON.stringify({ w6, sW, p6b, sPb, tap, sR6 }));
  await page.evaluate(() => { window.__game.S.car = 0; });   // (the KAZE RS again, as the title below expects)

  // 7. back to Slovenian in the settings: the page and the title at once; then English again
  await act('to-title'); await page.waitForTimeout(250); await act('to-settings'); await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('[data-set="lang"] button[data-v="sl"]').click()); await page.waitForTimeout(250);
  const g7 = await page.evaluate(() => ({ lang: document.documentElement.lang, S: window.__game.S.lang, name: document.querySelector('#set-name').closest('.row').querySelector('.rlbl').textContent, done: document.querySelector('[data-act="settings-done"]').textContent, stored: JSON.parse(localStorage.getItem('tdgp-settings')).lang, player: window.__game.S.name }));
  await act('settings-done'); await page.waitForTimeout(200);
  const t7 = await page.evaluate(() => ({ champ: document.getElementById('btn-champ').textContent, sub: document.getElementById('title-sub').textContent, race: document.querySelector('[data-act="to-car"]').textContent }));
  T.check('Slovenian again at once: the settings (Ime voznika, Končano), the title (Dirkaj, Prvenstvo, "3 krogi · 12 nasprotnikov"), kept; the default name Igralec', g7.lang === 'sl' && g7.S === 'sl' && g7.stored === 'sl' && g7.name === 'Ime voznika' && g7.done === 'Končano' && t7.race === 'Dirkaj' && t7.champ === 'Prvenstvo' &&
    t7.sub === 'Jezero Ring · 3 krogi · 12 nasprotnikov' && g7.player === 'Igralec', JSON.stringify({ g7, t7 }));
  await act('to-settings'); await page.waitForTimeout(150);
  await page.evaluate(() => document.querySelector('[data-set="lang"] button[data-v="en"]').click()); await page.waitForTimeout(250);
  const g8 = await page.evaluate(() => ({ name: document.querySelector('#set-name').closest('.row').querySelector('.rlbl').textContent, player: window.__game.S.name }));
  const s8 = await slovene();
  T.check('English again: the settings in English, the default name Player', g8.name === 'Driver name' && g8.player === 'Player' && !s8.length, JSON.stringify({ g8, s8 }));

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
