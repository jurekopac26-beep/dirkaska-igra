// The game in English (Nastavitve: Jezik · Language): every screen and the HUD show no Slovenian (no č, š, ž outside the names of
// drivers and places, no Slovenian words), with the expected English on each (the title, the cars, the upgrades, the tracks, the
// settings, the leaderboard, the championship, the career, a friend's race); a race on autopilot to the results; then the switch in the
// settings back to Slovenian: the page and the title in Slovenian at once, and English again.
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
  const c2 = await page.evaluate(() => ({ desc: document.getElementById('car-desc').textContent, stats: document.getElementById('car-stats').innerText, next: document.getElementById('car-next').textContent }));
  const s2 = await slovene();
  T.check('cars in English: "Four-wheel drive. An 80s rally car ... hp", Power / Grip, Next', /^(Rear-wheel drive|Four-wheel drive|Front-wheel drive|Mid-engined)\. [A-Z][a-z].*\. \d+ hp, \d+ kg\.$/.test(c2.desc) && /Power/.test(c2.stats) && /Grip/.test(c2.stats) && c2.next === 'Next' && !s2.length, JSON.stringify({ c2, s2 }));
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
  T.check('tracks in English: Mountain Rally, Monaco, Copper Forest, Tuscany, Thunder Cape, Styria, Austria; "N corners · 3 laps"; 2,862 m; the ways to drive Vršič', ['Mountain Rally', 'Monaco', 'Copper Forest', 'Tuscany', 'Thunder Cape', 'Styria, Austria', 'Ljubljana, Slovenia'].every(n => k3.names.includes(n)) &&
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
  T.check('championship in English: Home Cup / Superstars / Legends / Grand Championship, "4 races", Start the championship', h5.cards === 'Home Cup/Superstars/Legends/Grand Championship' && /^4 races · \d+ km$/.test(h5.meta) && h5.go === 'Start the championship' && /^Difficulty: medium/.test(h5.diff) && !sh.length, JSON.stringify({ h5, sh }));
  await act('to-career'); await page.waitForTimeout(200);
  const r5 = await page.evaluate(() => ({ info: document.getElementById('career-info').textContent, money: document.getElementById('career-money').textContent, toggle: document.getElementById('career-toggle').textContent }));
  const sr = await slovene();
  T.check('career in English, the money as €10,000', /^In the career you earn money/.test(r5.info) && /You start with €10,000 and the PICO TURBO\./.test(r5.info) && r5.money === '€10,000' && r5.toggle === 'Start career' && !sr.length, JSON.stringify({ r5, sr }));
  await act('to-title'); await page.waitForTimeout(150); await act('to-online'); await page.waitForTimeout(250);
  const o5 = await page.evaluate(() => document.querySelector('#s-online').innerText);
  const so = await slovene();
  T.check('a friend\'s race in English (Wait for a friend, Private room with a code)', /Wait for a friend/.test(o5) && /Private room with a code/.test(o5) && !so.length, JSON.stringify({ o5: o5.slice(0, 200), so }));
  await act('to-title'); await page.waitForTimeout(200);

  // 6. a race: the HUD, the pause, the results
  await startTrack(page, 'jezero');
  await page.evaluate(() => window.__game.sim(8, true));
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
