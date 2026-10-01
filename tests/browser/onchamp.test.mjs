// A championship over the internet: three browser pages play three phones in a private room (Ana the host, Bor and Cvet). The host
// switches Prvenstvo on and lists its two races (Jezero Ring, then Riviera, one lap each); the friends see the list. After the first race
// every page shows the standings under the results (25, 18, 15 by the finishing order); back in the room the standings, the next track
// (chosen for the host, the track list locked) and "Začni dirko 2/2". Cvet leaves the room: the points stay, marked odšel. After the
// second race (Ana and Bor) the final standings with the champion; the host can start a new championship (the points back to nothing).
//   node tests/browser/onchamp.test.mjs
import net from 'node:net';
import { createRequire } from 'node:module';
import { serve, launch, openGame, checker } from './lib.mjs';

const require = createRequire(import.meta.url);
const { PeerServer } = require('peer');
const T = checker('online championship');
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const port = await new Promise((resolve) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const peerHttp = await new Promise((resolve) => PeerServer({ port, host: '127.0.0.1', path: '/' }, resolve));
const srv = await serve();
const browser = await launch(['--disable-features=WebRtcHideLocalIpsWithMdns']);
const init = { content: `window.__peerOpts = ${JSON.stringify({ host: '127.0.0.1', port, path: '/', secure: false, config: { iceServers: [] } })};` };
const settings = { quality: 'retro', shadows: 0, camera: 'chase', zoom: 1.2, carV: 2 };
const open = (name, car, color) => openGame(browser, srv.base + '/index.html', Object.assign({ name, car, color }, settings), { width: 320, height: 240 }, { init });
const until = (p, fn, arg, ms = 60000) => p.waitForFunction(fn, arg, { timeout: ms, polling: 250 }).then(h => h.jsonValue());
let P = [];
try {
  P = [await open('Ana', 0, 0), await open('Bor', 1, 1), await open('Cvet', 2, 2)];
  const [A, B, Cv] = P, pages = P.map(x => x.page);

  // 1. the room: the host and two friends
  await A.page.evaluate(() => { window.__game.onAction('to-online'); window.__game.onAction('net-host'); });
  const code = await until(A.page, () => { const n = window.__game.net; return n && n.code && n.code.length === 4 ? n.code : null; });
  for (const x of P.slice(1)) { await x.page.evaluate((code) => { window.__game.onAction('to-online'); document.getElementById('on-code').value = code; window.__game.onAction('net-join'); }, code); await wait(400); }
  await until(A.page, () => { const n = window.__game.net; return n && n.players.length === 3; });
  for (const p of pages.slice(1)) await until(p, () => { const n = window.__game.net; return !!(n && n.players.length === 3 && n.synced); });

  // 2. the championship: on, Jezero Ring and Riviera, one lap; the friends see its list
  await A.page.evaluate(() => { const g = window.__game, t = document.getElementById('on-track'), l = document.getElementById('on-laps');
    t.value = 'jezero'; t.dispatchEvent(new Event('change')); l.value = '1'; l.dispatchEvent(new Event('change'));
    g.onAction('net-ch-on'); t.value = 'riviera'; t.dispatchEvent(new Event('change')); g.onAction('net-ch-add'); });
  const lists = await Promise.all(pages.map(p => until(p, () => { const li = [...document.querySelectorAll('#on-ch .on-ch-tracks li')].map(e => e.firstChild.textContent.trim()); return li.length === 2 ? { li, go: document.getElementById('on-go').textContent, row: !document.getElementById('on-chrow').classList.contains('off') } : null; }, null, 20000)));
  T.check('the championship on: Jezero Ring, then Riviera, on every page; the host\'s button "Začni dirko 1/2"', lists.every(x => x.li.join() === 'Jezero Ring,Riviera' && x.row) && lists[0].go === 'Začni dirko 1/2', JSON.stringify(lists));

  // 3. the first race: everyone on autopilot in real time; the standings under the results on every page
  for (const p of pages) await p.evaluate(() => { window.__game.autoDrive = true; });
  await A.page.evaluate(() => window.__game.onAction('net-go'));
  await Promise.all(pages.map(p => until(p, () => { const g = window.__game; return !!(g.race && g.net && g.net.race); }, null, 90000)));
  const tr1 = await A.page.evaluate(() => window.__game.race.track.def.id);
  const res1 = await Promise.all(pages.map(p => until(p, () => { const el = document.getElementById('res-ch'); return document.getElementById('s-results').classList.contains('show') && !el.classList.contains('off') && /po 1\. dirki od 2/.test(el.textContent)
    ? { head: el.querySelector('.ltab-h').textContent, rows: [...el.querySelectorAll('tbody tr')].map(r => r.innerText.replace(/\s+/g, ' ').trim()), race: [...document.querySelectorAll('#res-table tbody tr')].map(r => r.children[1].textContent.replace(' (ti)', '')) } : null; }, null, 240000)));
  const pts = (r) => r.rows.map(t => +t.split(' ').filter(w => /^\d+$/.test(w))[1]);
  T.check('after the first race (Jezero Ring): the standings under the results on every page, 25, 18, 15 by the finishing order', tr1 === 'jezero' && res1.every(r => r.rows.length === 3 && pts(r).join() === '25,18,15') && res1.every(r => r.race.join() === res1[0].race.join()),
    JSON.stringify(res1));

  // 4. back in the room: the standings, the next track (Riviera, chosen, locked), "Začni dirko 2/2"
  for (const p of pages) await p.evaluate(() => window.__game.onAction('net-room'));
  await until(A.page, () => !document.getElementById('on-go').disabled, null, 30000);
  const room = await Promise.all(pages.map(p => until(p, () => { const el = document.getElementById('on-ch'), nx = el.querySelector('li.next'); return nx ? { next: nx.firstChild.textContent.trim(), done: el.querySelectorAll('li.done').length, rows: el.querySelectorAll('tbody tr').length,
    track: document.getElementById('on-track').value, locked: document.getElementById('on-track').disabled, go: document.getElementById('on-go').textContent } : null; }, null, 20000)));
  T.check('back in the room: the standings, Riviera next (chosen and locked), "Začni dirko 2/2"', room.every(r => r.next === 'Riviera' && r.done === 1 && r.rows === 3 && r.track === 'riviera' && r.locked) && room[0].go === 'Začni dirko 2/2', JSON.stringify(room));

  // 5. Cvet leaves the room: the points stay, marked odšel
  const cvId = await Cv.page.evaluate(() => window.__game.net.me);
  await Cv.page.evaluate(() => window.__game.onAction('net-leave'));
  await wait(1500); await Cv.ctx.close();
  const left = await Promise.all([A, B].map(x => until(x.page, () => { const rows = [...document.querySelectorAll('#on-ch tbody tr')].map(r => r.innerText.replace(/\s+/g, ' ').trim()), c = rows.find(t => /Cvet/.test(t)); return c && /odšel/.test(c) && window.__game.net.players.length === 2 ? { rows } : null; }, null, 30000)));
  T.check('Cvet leaves: Cvet\'s points stay in the standings, marked (odšel)', left.every(x => x.rows.length === 3), JSON.stringify(left));

  // 6. the second race (Ana and Bor): the final standings, the champion
  await until(A.page, () => !document.getElementById('on-go').disabled, null, 30000);
  await A.page.evaluate(() => window.__game.onAction('net-go'));
  await Promise.all([A, B].map(x => until(x.page, () => { const g = window.__game; return !!(g.race && g.net && g.net.race); }, null, 90000)));
  const tr2 = await A.page.evaluate(() => window.__game.race.track.def.id);
  const res2 = await Promise.all([A, B].map(x => until(x.page, () => { const el = document.getElementById('res-ch'); return document.getElementById('s-results').classList.contains('show') && /končno stanje/.test(el.textContent)
    ? { head: el.querySelector('.ltab-h').textContent, rows: [...el.querySelectorAll('tbody tr')].map(r => r.innerText.replace(/\s+/g, ' ').trim()) } : null; }, null, 300000)));
  const tot = (r) => pts(r).reduce((a, b) => a + b, 0);
  T.check('after the second race (Riviera): the final standings with the champion; Cvet\'s 1st race points kept (odšel); 25 + 18 more given',
    tr2 === 'riviera' && res2.every(r => r.rows.length === 3 && tot(r) === 58 + 43 && r.rows.some(t => /Cvet.*odšel/.test(t))) && ((ch) => (ch[0] === 'Ti' && ch[1] === 'Ana') || (ch[0] === 'Bor' && ch[1] === 'Ti'))(res2.map(r => r.head.split('prvak: ')[1])),
    JSON.stringify(res2));

  // 7. a new championship (the host): the points back to nothing, the first track again
  for (const x of [A, B]) await x.page.evaluate(() => window.__game.onAction('net-room'));
  await until(A.page, () => !!document.querySelector('#on-ch [data-act="net-ch-new"]'), null, 30000);
  await A.page.evaluate(() => window.__game.onAction('net-ch-new'));
  const fresh = await Promise.all([A, B].map(x => until(x.page, () => { const el = document.getElementById('on-ch'), nx = el.querySelector('li.next'); return nx && !el.querySelector('tbody') ? { next: nx.firstChild.textContent.trim(), go: document.getElementById('on-go').textContent } : null; }, null, 20000)));
  T.check('a new championship: no points yet, Jezero Ring next again, "Začni dirko 1/2"', fresh.every(f => f.next === 'Jezero Ring') && fresh[0].go === 'Začni dirko 1/2', JSON.stringify(fresh));

  T.check('no page errors', P.every(x => !x.errors.length), P.flatMap(x => x.errors).slice(0, 5).join(' | '));
} catch (e) {
  T.check('the test ran to the end', false, String(e && e.message || e).split('\n')[0]);
  console.log('page errors: ' + (P.flatMap(x => x.errors).slice(0, 5).join(' | ') || 'none'));
} finally {
  await browser.close(); await srv.close();
  peerHttp.closeAllConnections(); peerHttp.close();
}
T.done();
process.exit(process.exitCode || 0);   // (the PeerJS server library keeps a timer running)
