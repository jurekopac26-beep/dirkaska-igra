// The championship (Prvenstvo), played through the menus: the choice of a series; its first round driven to the finish (on
// autopilot) with the points on the results; the standings (every driver, the player's points as the place gives them) and the next
// round on the next track; the championship kept over a reload of the page (the title button shows the round); a round left
// before the finish does not count, a restart drives the same round again; giving it up takes a second tap; the last round of a
// series ends it: the final standings and the record of the series.
//   node tests/browser/champ.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('championship');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', name: 'Ana' });
  const act = (a) => page.evaluate((a) => window.__game.onAction(a), a);
  const raceOn = (id, round) => page.waitForFunction(([id, round]) => { const g = window.__game; return !!(g.race && g.race.track.def.id === id && g.race.champ && g.race.champ.round === round); }, [id, round], { timeout: 90000 });
  // drive the race on screen to its results (autopilot), then read them
  const finish = () => page.evaluate(async () => {
    const g = window.__game;
    for (let i = 0; i < 700 && g.phase !== 'done'; i++) { g.sim(1, true); if (i % 10 === 0) await new Promise(r => setTimeout(r, 0)); }
    await new Promise(r => setTimeout(r, 400));
    const rows = [...document.querySelectorAll('#res-table tbody tr')], me = rows.findIndex(r => r.classList.contains('me'));
    return { screen: g.screen, phase: g.phase, head: [...document.querySelectorAll('#res-table thead th')].map(t => t.textContent).join(','), pos: me + 1,
      myPts: me >= 0 ? rows[me].lastElementChild.textContent : null, sub: document.getElementById('res-sub').textContent, btn: document.getElementById('res-restart').dataset.act + ':' + document.getElementById('res-restart').textContent };
  });
  const standings = () => page.evaluate(() => {
    const g = window.__game, rows = [...document.querySelectorAll('#ch-body tbody tr')];
    return { screen: g.screen, tag: document.getElementById('ch-tag').textContent, go: document.getElementById('ch-go').textContent, rows: rows.length,
      me: rows.map(r => r.classList.contains('me') ? r.children[1].textContent + ':' + r.children[3].textContent : '').filter(Boolean)[0],
      chips: [...document.querySelectorAll('.ch-rounds li')].map(l => l.className || '-').join(','), final: !!document.querySelector('.ch-final'),
      saved: JSON.parse(localStorage.getItem('tdgp-champ') || 'null') };
  });
  const PTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

  // 1. the choice of a series
  await act('to-champ'); await page.waitForTimeout(300);
  const pick = await page.evaluate(() => ({ screen: window.__game.screen, cards: [...document.querySelectorAll('[data-champ]')].map(b => b.dataset.champ + (b.classList.contains('sel') ? '*' : '')),
    go: document.getElementById('ch-go').textContent, quit: document.getElementById('ch-quit').classList.contains('off') }));
  T.check('Prvenstvo: the series to choose from (the first one chosen), no "Opusti" before one starts', pick.screen === 'champ' && pick.cards.length >= 3 && pick.cards[0].endsWith('*') && pick.go === 'Začni prvenstvo' && pick.quit, JSON.stringify(pick));

  // 2. "Domači pokal": round 1 on its first track, driven to the finish; the points on the results
  await page.evaluate(() => document.querySelector('[data-champ="domaci"]').click());
  await act('champ-go'); await raceOn('jezero', 0);
  const r1 = await finish();
  const p1 = PTS[r1.pos - 1] || 0;
  T.check('round 1 (Jezero Ring): results with a points column, the points of the place, on to the standings', r1.screen === 'results' && /Točke$/.test(r1.head) && r1.myPts === (p1 ? '+' + p1 : '') && /Domači pokal: \+\d+ točk/.test(r1.sub) && r1.btn === 'to-champ:Lestvica prvenstva',
    JSON.stringify(r1));

  // 3. the standings: every driver, the player's points, round 2 next; kept in the browser
  await page.evaluate(() => document.getElementById('res-restart').click()); await page.waitForTimeout(300);
  const s1 = await standings();
  T.check('standings after round 1: 13 drivers, the player with the points of the place, round 2 (Gorski reli) next, saved', s1.screen === 'champ' && s1.rows === 13 && s1.me === 'Ana:' + p1 && s1.tag === 'dirka 2/3' &&
    s1.go === 'Naslednja dirka: Gorski reli' && s1.chips.startsWith('done,next') && s1.saved && s1.saved.rounds.length === 1 && s1.saved.rounds[0].order.length === 13, JSON.stringify(s1));

  // 4. a reload of the page: the championship is still there, the title button shows the round
  await page.reload(); await page.waitForFunction(() => !!(window.__game && window.__game.screen === 'title'), null, { timeout: 30000 }); await page.waitForTimeout(500);
  const title = await page.evaluate(() => document.getElementById('btn-champ').textContent);
  await act('to-champ'); await page.waitForTimeout(300);
  const s2 = await standings();
  T.check('after a reload: "Prvenstvo · 2/3" on the title screen, the same standings', title === 'Prvenstvo · 2/3' && s2.me === 'Ana:' + p1 && s2.go === 'Naslednja dirka: Gorski reli', `title "${title}", ${JSON.stringify(s2)}`);

  // 5. round 2: a restart drives the same round again; left before the finish, it does not count
  await act('champ-go'); await raceOn('gora', 1);
  await page.evaluate(() => { window.__game.sim(12, true); });
  await act('restart'); await page.waitForTimeout(300);
  const again = await page.evaluate(() => { const g = window.__game; return { id: g.race.track.def.id, round: g.race.champ && g.race.champ.round, t: g.race.time }; });
  await page.evaluate(() => { window.__game.sim(12, true); });
  await act('to-title'); await act('to-champ'); await page.waitForTimeout(300);
  const s3 = await standings();
  T.check('round 2: a restart drives it again (Gorski reli, round 2); left before the finish, not counted', again.id === 'gora' && again.round === 1 && again.t < 1 && s3.saved.rounds.length === 1 && s3.tag === 'dirka 2/3',
    `${JSON.stringify(again)}, rounds saved ${s3.saved.rounds.length}`);

  // 6. giving it up: the first tap asks, the second one does it
  await page.evaluate(() => document.getElementById('ch-quit').click()); await page.waitForTimeout(200);
  const ask = await page.evaluate(() => ({ btn: document.getElementById('ch-quit').textContent, saved: !!localStorage.getItem('tdgp-champ') }));
  await page.evaluate(() => document.getElementById('ch-quit').click()); await page.waitForTimeout(300);
  const gone = await page.evaluate(() => ({ saved: localStorage.getItem('tdgp-champ'), go: document.getElementById('ch-go').textContent, cards: document.querySelectorAll('[data-champ]').length }));
  T.check('"Opusti": asks first ("Res opustim?"), a second tap gives it up (the choice again)', ask.btn === 'Res opustim?' && ask.saved && gone.saved === null && gone.go === 'Začni prvenstvo' && gone.cards >= 3, JSON.stringify({ ask, gone }));

  // 7. the last round of a series: two rounds already driven (the player 2nd, 1st), the third one (Riviera) to the finish
  await page.evaluate(() => {
    const K = Core.champKeys(12), ord = (p) => { const o = K.slice(1); o.splice(p - 1, 0, Core.PLAYER_KEY); return o; };
    localStorage.setItem('tdgp-champ', JSON.stringify({ v: 1, id: 'domaci', diff: 1, rounds: [{ track: 'jezero', order: ord(2) }, { track: 'gora', order: ord(1) }] }));
  });
  await page.reload(); await page.waitForFunction(() => !!(window.__game && window.__game.screen === 'title'), null, { timeout: 30000 }); await page.waitForTimeout(500);
  await act('to-champ'); await page.waitForTimeout(300);
  const s4 = await standings();
  await act('champ-go'); await raceOn('riviera', 2);
  const r4 = await finish();
  await page.evaluate(() => document.getElementById('res-restart').click()); await page.waitForTimeout(300);
  const s5 = await standings(), rec = await page.evaluate(() => (JSON.parse(localStorage.getItem('tdgp-records') || '{}').champ || {}).domaci || null);
  T.check('last round: the standings before it (43 points), the results lead to the final standings', s4.me === 'Ana:43' && s4.tag === 'dirka 3/3' && r4.screen === 'results' && r4.btn === 'to-champ:Končna razvrstitev', `${s4.me}, ${s4.tag}, ${r4.btn}`);
  T.check('final standings: the championship over, the place shown, "Novo prvenstvo"; the best final place kept for the series', s5.final && s5.tag === 'končano' && s5.go === 'Novo prvenstvo' && s5.chips === 'done,done,done' && rec && rec.best >= 1,
    JSON.stringify({ tag: s5.tag, go: s5.go, me: s5.me, rec }));
  await act('champ-go'); await page.waitForTimeout(200);
  const fresh = await page.evaluate(() => ({ saved: localStorage.getItem('tdgp-champ'), go: document.getElementById('ch-go').textContent }));
  T.check('"Novo prvenstvo": the finished one cleared, the choice of a series', fresh.saved === null && fresh.go === 'Začni prvenstvo', JSON.stringify(fresh));
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('the test ran to the end', false, String(e && e.message || e).split('\n')[0]);
} finally {
  await browser.close(); await srv.close();
}
T.done();
