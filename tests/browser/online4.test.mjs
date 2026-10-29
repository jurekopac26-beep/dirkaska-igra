// A race of four over the internet: four browser pages play four phones in a private room (the host and three friends who join
// with its code; a fifth finds the room full). Every page lists the four players; the race: four cars on every page, on a grid of
// two rows the same on every page, each page drives its own car (autopilot, in real time) and sees the others' cars move (the
// friends' states go through the host), all four finish with the same four times on every page, the same order in the results. In a
// second race a friend leaves: the others are told, its car leaves the track, the race goes on. Two of them in vehicles of the fleet:
// Cvet in the TITAN, Dan with a car saved as the retired model at index 5 (an older build's) that now is its heir, the LEV S; every page
// lists them so and draws them as those vehicles (their own kit bodies).
//   node tests/browser/online4.test.mjs
import net from 'node:net';
import { createRequire } from 'node:module';
import { serve, launch, openGame, checker } from './lib.mjs';

const require = createRequire(import.meta.url);
const { PeerServer } = require('peer');
const T = checker('online (four players)');
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const port = await new Promise((resolve) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const peerHttp = await new Promise((resolve) => PeerServer({ port, host: '127.0.0.1', path: '/' }, resolve));
const srv = await serve();
const browser = await launch(['--disable-features=WebRtcHideLocalIpsWithMdns']);
const init = { content: `window.__peerOpts = ${JSON.stringify({ host: '127.0.0.1', port, path: '/', secure: false, config: { iceServers: [] } })};` };
const settings = { quality: 'retro', shadows: 0, camera: 'chase', zoom: 1.2, carV: 2 };
const open = (name, car, color, carId) => openGame(browser, srv.base + '/index.html', Object.assign({ name, car, color }, settings, carId ? { carV: 3, carId } : null), { width: 320, height: 240 }, { init });   // (carId: a vehicle saved by its id)
const until = (p, fn, arg, ms = 60000) => p.waitForFunction(fn, arg, { timeout: ms, polling: 250 }).then(h => h.jsonValue());
const NAMES = ['Ana', 'Bor', 'Cvet', 'Dan'];
let P = [], X = null;
try {
  // (saved as the game saves them: a vehicle past the first 11 with the rally car's index for older builds; the retired model by its own)
  P = [await open('Ana', 0, 0), await open('Bor', 1, 1), await open('Cvet', 4, 2, 'titan'), await open('Dan', 5, 3, 'p206')];
  const [A] = P, pages = P.map(x => x.page);
  // (each page notes the grid as it builds its race, the places before anything moves: a page slow to build the vehicles' bodies, four
  // software renderers at once, may be read only once its race runs)
  for (const p of pages) await p.evaluate(() => { const R = Core.Race; Core.Race = class extends R { constructor(...a) { super(...a); this.gridD = this.cars.map(c => +c.dist.toFixed(2)); } }; });

  // 1. the room: the host's code, three friends join
  await A.page.evaluate(() => { window.__game.onAction('to-online'); window.__game.onAction('net-host'); });
  const code = await until(A.page, () => { const n = window.__game.net; return n && n.code && n.code.length === 4 ? n.code : null; });
  for (const x of P.slice(1)) { await x.page.evaluate((code) => { window.__game.onAction('to-online'); document.getElementById('on-code').value = code; window.__game.onAction('net-join'); }, code); await wait(400); }
  await until(A.page, () => { const n = window.__game.net; return n && n.players.length === 4; });
  for (const p of pages.slice(1)) await until(p, () => { const n = window.__game.net; return !!(n && n.players.length === 4 && n.synced); });
  const rooms = await Promise.all(pages.map(p => p.evaluate(() => ({ players: document.getElementById('on-players').innerText.replace(/\s+/g, ' '), status: document.getElementById('on-status').textContent, me: window.__game.net.me }))));
  T.check('the room: the host and three friends, every page lists all four (each itself as ti) with their cars (Cvet · TITAN, Dan · LEV S)', rooms.every((r, i) => NAMES.every(n => r.players.includes(n)) && r.players.includes(NAMES[i] + ' (ti)') && /Cvet( \(ti\))? · TITAN/.test(r.players) && /Dan( \(ti\))? · LEV S/.test(r.players)) &&
    rooms[0].me === 'h' && new Set(rooms.map(r => r.me)).size === 4 && /Prijatelji so v sobi/.test(rooms[0].status), JSON.stringify(rooms));

  // 2. a fifth: the room is full
  X = await open('Eva', 0, 4);
  await X.page.evaluate((code) => { window.__game.onAction('to-online'); document.getElementById('on-code').value = code; window.__game.onAction('net-join'); }, code);
  const full = await until(X.page, () => document.getElementById('on-err').textContent || null, null, 40000);
  T.check('a fifth finds the room full', /Ta soba je polna/.test(full), full);
  await X.ctx.close(); X = null;

  // 3. the race: 1 lap of the Jezero Ring, everyone on autopilot in real time
  await A.page.evaluate(() => { const t = document.getElementById('on-track'); t.value = 'jezero'; t.dispatchEvent(new Event('change')); const l = document.getElementById('on-laps'); l.value = '1'; l.dispatchEvent(new Event('change')); });
  for (const p of pages) await p.evaluate(() => { window.__game.autoDrive = true; });
  await A.page.evaluate(() => window.__game.onAction('net-go'));
  await Promise.all(pages.map(p => until(p, () => { const g = window.__game; return !!(g.race && g.net && g.net.race); }, null, 90000)));
  const grids = await Promise.all(pages.map(p => p.evaluate(() => { const r = window.__game.race, n = window.__game.net; return { n: r.cars.length, me: n.me, grid: n.race.grid, mine: r.player.grid, d: (r.gridD || r.cars.map(c => +c.dist.toFixed(2))).slice().sort((a, b) => b - a), nums: r.cars.map(c => c.num).sort((a, b) => a - b), others: r.remotes.map(c => ({ id: c.netOf.id, grid: c.grid, name: c.name })) }; })));
  const g0 = grids[0].grid;
  T.check('the race: four cars on every page, the same grid everywhere (each at its place), two rows of two', grids.every(g => g.n === 4 && g.grid.join() === g0.join() && g.mine === g.grid.indexOf(g.me) + 1 && g.others.every(o => o.grid === g.grid.indexOf(o.id) + 1)) &&
    grids.every(g => g.d[0] === g.d[1] && g.d[2] === g.d[3] && g.d[0] - g.d[2] > 5) && grids.every(g => new Set(g.nums).size === 4), JSON.stringify(grids));
  // the vehicles of the fleet: on every page the TITAN and the LEV S as those vehicles (the friends' too), drawn with their kit bodies
  const kits = await Promise.all(pages.map(p => p.evaluate(() => { const r = window.__game.race, of = (c) => { const v = Render.viewOf(c); return c.name + ':' + c.m.id + (v && v.kit ? ':kit' : v ? ':old' : ':none'); };
    return [r.player].concat(r.remotes).map(of).sort(); })));
  T.check('the fleet online: every page has Cvet\'s TITAN and Dan\'s LEV S (his saved car, the retired model, came as its heir) as those vehicles, drawn with their own kit bodies; the others\' cars as they are',
    kits.every(k => k.length === 4 && k.some(x => /:titan:kit$/.test(x)) && k.some(x => /:levs:kit$/.test(x)) && k.filter(x => /:old$/.test(x)).length === 2 && !k.some(x => /p206/.test(x))), JSON.stringify(kits));
  // (the pages draw slowly, four software renderers at once: each page is waited for until it sees all three others off the grid)
  const moved = await Promise.all(pages.map(p => until(p, () => { const r = window.__game.race; return r && r.remotes.every(c => c.dist > 5) ? r.remotes.map(c => c.dist) : null; }, null, 120000).catch(() => p.evaluate(() => window.__game.race.remotes.map(c => c.dist)))));
  T.check('every page sees the three others\' cars move (the friends\' states through the host)', moved.every(m => m.length === 3 && m.every(d => d > 5)), JSON.stringify(moved.map(m => m.map(d => +d.toFixed(1)))));
  const fins = await Promise.all(pages.map(p => until(p, () => { const n = window.__game.net, R = n && n.race; return R && R.mine != null && Object.values(R.fins).every(t => t != null) && document.getElementById('s-results').classList.contains('show') ? { me: n.me, mine: R.mine, fins: R.fins } : null; }, null, 400000)));
  const times = (f) => { const o = Object.assign({}, f.fins); o[f.me] = f.mine; return o; };
  const t0 = times(fins[0]);
  T.check('all four finish with the same four times on every page', fins.every(f => { const t = times(f); return Object.keys(t).length === 4 && Object.keys(t0).every(k => t[k] === t0[k]); }) && Object.values(t0).every(t => t > 20), JSON.stringify(fins.map(times)));
  const res = await Promise.all(pages.map(p => p.evaluate(() => ({ title: document.getElementById('res-title').textContent, rows: [...document.querySelectorAll('#res-table tbody tr')].map(r => r.children[1].textContent.replace(' (ti)', '')) }))));
  const win = Object.entries(t0).sort((a, b) => a[1] - b[1])[0][0], wi = fins.findIndex(f => f.me === win);
  T.check('the results: four rows in the same order on every page, the winner says Zmaga!', res.every(r => r.rows.length === 4 && r.rows.join() === res[0].rows.join()) && res[wi].title === 'Zmaga!' && res.filter(r => r.title === 'Zmaga!').length === 1,
    JSON.stringify(res));

  // 4. back in the room, a second race; a friend leaves in the middle of it
  for (const p of pages) await p.evaluate(() => window.__game.onAction('net-room'));
  await until(A.page, () => !document.getElementById('on-go').disabled, null, 30000);
  await A.page.evaluate(() => window.__game.onAction('net-go'));
  await Promise.all(pages.map(p => until(p, () => { const g = window.__game; return !!(g.race && g.race.state === 'racing'); }, null, 90000)));
  const grid2 = await A.page.evaluate(() => window.__game.net.race.grid);
  await wait(3000);
  const gone = P[2], goneId = await gone.page.evaluate(() => window.__game.net.me);
  // (the toasts watched before the friend leaves: the news can come before an observer set up after the close would see it)
  await Promise.all([P[1], P[3]].map(x => x.page.evaluate(() => { window.__toasts = []; new MutationObserver(() => window.__toasts.push(document.getElementById('toast').textContent)).observe(document.getElementById('toast'), { childList: true, characterData: true, subtree: true }); })));
  await gone.ctx.close();
  const after = await Promise.all([P[0], P[1], P[3]].map(x => until(x.page, (id) => { const g = window.__game, n = g.net, c = g.race && g.race.remotes.find(r => r.netOf.id === id);
    return n && n.race && c && c.x === 1e5 && n.players.length === 3 ? { toast: document.getElementById('toast').textContent, told: (window.__toasts || []).some(t => /Cvet je odšel/.test(t)), state: g.race.state, players: n.players.length } : null; }, goneId, 40000)));
  T.check('second race (the grid in turn); a friend leaves: the others are told, its car off the track, the race goes on', grid2.join() !== g0.join() && after.every(a => a.state === 'racing' && a.players === 3) && /Cvet/.test(after[0].toast) && after.slice(1).every(a => a.told),
    JSON.stringify({ grid2, after }));

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
