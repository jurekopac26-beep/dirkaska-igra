// A race with a friend over the internet: two browser pages play the two phones. They connect through a PeerJS server of
// the test's own (the game uses the public one) and a direct WebRTC connection, as on real phones.
// - a wrong room code gives a clear message
// - the room: the host's code, the friend joins with it, both see both players; the host's track and laps reach the friend
// - the clocks: the friend's clock matches the host's
// - the race: both start at the same planned moment, each sees the other's car where the other really is, both finish, and
//   both result screens show the same two times
// - the host's weather: the second race in the rain on both phones
// - the friend leaves in the middle of a race: the host is told, the race goes on alone, the friend is shown as gone
// - quick match (no code): the first waits, the next connects at once; a third comes into the same room (up to 22); the host
//   starts before the room is full: the race is for the three in it (a big grid's states here from three cars on: 10 a second, passed
//   on by the host in batches; each sees the others move), the room takes nobody more and the next one waits in a new room; two
//   tapping at the same moment meet; a leftover of a dead waiter is skipped; a full room (here of three) starts its race by itself
//   node tests/browser/online.test.mjs
import net from 'node:net';
import { createRequire } from 'node:module';
import { serve, launch, openGame, checker } from './lib.mjs';

const require = createRequire(import.meta.url);
const { PeerServer } = require('peer');
const WebSocket = require('ws');
const T = checker('online (two players)');
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const port = await new Promise((resolve) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const peerHttp = await new Promise((resolve) => PeerServer({ port, host: '127.0.0.1', path: '/' }, resolve));   // (the callback gets its http server)
const srv = await serve();
const browser = await launch(['--disable-features=WebRtcHideLocalIpsWithMdns']);   // (local addresses as they are: both pages are on this machine)
// no STUN/TURN servers: both pages are on this machine, the test needs nothing from the internet
const init = { content: `window.__peerOpts = ${JSON.stringify({ host: '127.0.0.1', port, path: '/', secure: false, config: { iceServers: [] } })};` };
const settings = { quality: 'normal', shadows: 0, camera: 'chase', zoom: 1.2, carV: 2 };   // (carV: the car as set here, not the new players' default)
const open = (name, car, color, more) => openGame(browser, srv.base + '/index.html', Object.assign({ name, car, color }, settings), { width: 360, height: 300 }, { init: more ? { content: init.content + more } : init });
const netOf = (p) => p.evaluate(() => window.__game.net);
const until = (p, fn, arg, ms = 60000) => p.waitForFunction(fn, arg, { timeout: ms, polling: 200 }).then(h => h.jsonValue());
let A, B, C, D, E, F, dead;
try {
  A = await open('Ana', 0, 0); B = await open('Bor', 2, 2);

  // 1. a wrong code: a clear message, back to the choice
  await B.page.evaluate(() => { window.__game.onAction('to-online'); document.getElementById('on-code').value = 'ZZZZ'; window.__game.onAction('net-join'); });
  const wrong = await until(B.page, () => { const t = document.getElementById('on-err').textContent; return t || null; }, null, 40000);
  T.check('a code without a room: a clear message', /Sobe s to kodo ni/.test(wrong), wrong);

  // 2. the room
  await A.page.evaluate(() => { window.__game.onAction('to-online'); window.__game.onAction('net-host'); });
  const code = await until(A.page, () => { const n = window.__game.net; return n && n.code && n.code.length === 4 ? n.code : null; });
  await B.page.evaluate((code) => { document.getElementById('on-code').value = code.toLowerCase(); window.__game.onAction('net-join'); }, code);
  await until(A.page, () => { const n = window.__game.net; return !!(n && n.open && n.peer); });
  await until(B.page, () => { const n = window.__game.net; return !!(n && n.open && n.peer && n.synced); });
  const room = async (p) => p.evaluate(() => ({ players: document.getElementById('on-players').textContent, status: document.getElementById('on-status').textContent, go: !document.getElementById('on-go').classList.contains('off') && !document.getElementById('on-go').disabled }));
  const rA = await room(A.page), rB = await room(B.page);
  T.check('room: the host has a 4-character code, the friend joins with it (typed in small letters)', /^[A-Z2-9]{4}$/.test(code), code);
  T.check('room: both phones list both players with their cars', /Ana \(ti\) · KAZE RS/.test(rA.players) && /Bor · PICO TURBO/.test(rA.players) && /Bor \(ti\) · PICO TURBO/.test(rB.players) && /Ana · KAZE RS/.test(rB.players), `host: ${rA.players} | friend: ${rB.players}`);
  T.check('room: only the host can start', rA.go && !rB.go, `host ${rA.go}, friend ${rB.go}`);
  await A.page.evaluate(() => { const t = document.getElementById('on-track'); t.value = 'jezero'; t.dispatchEvent(new Event('change')); const l = document.getElementById('on-laps'); l.value = '1'; l.dispatchEvent(new Event('change')); });
  const pick = await until(B.page, () => { const n = window.__game.net; return n.track === 'jezero' && n.laps === 1 ? { track: n.track, laps: n.laps, shown: document.getElementById('on-track').value } : null; });
  T.check("room: the host's track and laps reach the friend", pick.shown === 'jezero', JSON.stringify(pick));

  // 3. the clocks: the friend's clock between two readings of the host's
  const a1 = await A.page.evaluate(() => window.__game.now()), b = await B.page.evaluate(() => window.__game.now()), a2 = await A.page.evaluate(() => window.__game.now());
  T.check("clocks: the friend's clock matches the host's", b >= a1 - 30 && b <= a2 + 30, `host ${a1.toFixed(0)}..${a2.toFixed(0)}, friend ${b.toFixed(0)}`);

  // 4. the race (1 lap of Jezero Ring, both on autopilot, in real time)
  for (const p of [A.page, B.page]) await p.evaluate(() => { window.__game.autoDrive = true; });
  await A.page.evaluate(() => window.__game.onAction('net-go'));
  const goA = await until(A.page, () => { const n = window.__game.net; return n && n.race ? n.race.goAt : null; }), goB = await until(B.page, () => { const n = window.__game.net; return n && n.race ? n.race.goAt : null; });
  T.check('race: both phones plan the same start moment', goA === goB, `host ${goA}, friend ${goB}`);
  const row = await A.page.evaluate(() => { const r = window.__game.race; return { d: [r.player.dist, r.remote.dist], side: Math.sign((r.remote.x - r.player.x) * Math.sin(r.player.h) - (r.remote.z - r.player.z) * Math.cos(r.player.h)) }; });
  T.check('race: the two side by side on the front row (the same distance to the line)', Math.abs(row.d[0] - row.d[1]) < 0.05 && row.d[0] < 0 && row.side !== 0, JSON.stringify(row));
  const started = (p) => until(p, () => { const n = window.__game.net; return n && n.race && n.race.startT != null ? n.race.startT : null; }, null, 60000);   // (the moment the lights went out there)
  const [sA, sB] = await Promise.all([started(A.page), started(B.page)]);
  T.check('race: both start on time (in the first frame after the planned moment)', sA - goA < 400 && sB - goB < 400 && sA >= goA && sB >= goB, `host +${(sA - goA).toFixed(0)} ms, friend +${(sB - goB).toFixed(0)} ms`);
  const cars = (p) => p.evaluate(() => { const r = window.__game.race; return { n: r.cars.length, me: r.player.num, it: r.remote.num, model: r.remote.m.id, grid: [r.player.grid, r.remote.grid] }; });
  const cA = await cars(A.page), cB = await cars(B.page);
  T.check("race: the two of them on the grid, each with the other's car; the same start number is changed for the friend", cA.n === 2 && cB.n === 2 && cA.model === 'pico' && cB.model === 'kaze' && cA.me === 1 && cA.it === 2 && cB.me === 2 && cB.it === 1 && cA.grid.join() === '1,2' && cB.grid.join() === '2,1',
    `host ${JSON.stringify(cA)}, friend ${JSON.stringify(cB)}`);
  // each sees the other's car where the other really is: the host's last frame showed the friend's car as it was 100 ms
  // earlier; after allowing for that and for the time between the two phones' last frames, within 12 m (a car standing still
  // or somewhere else would be off by far more)
  await wait(8000);
  const seen = [];
  for (let i = 0; i < 3; i++) {
    const va = await A.page.evaluate(() => { const r = window.__game.race; return { x: r.remote.x, z: r.remote.z, t: window.__game.net.race.frameT }; });
    const vb = await B.page.evaluate(() => { const r = window.__game.race; return { x: r.player.x, z: r.player.z, v: r.player.speed, t: window.__game.net.race.frameT }; });
    seen.push(Math.hypot(va.x - vb.x, va.z - vb.z) - vb.v * Math.abs(vb.t - (va.t - 100)) / 1000);
    await wait(1500);
  }
  const moved = await A.page.evaluate(() => window.__game.race.remote.dist);
  // the race keeps up with the shared clock also when frames are slow (here 100-300 ms: without catching up it would run at
  // 40-80 % of the real time); only a frame over 0.5 s loses time
  const lag = (p) => p.evaluate(() => { const g = window.__game, n = g.net.race; return { lag: (n.frameT - n.goAt) / 1000 - g.race.time, t: g.race.time }; });
  const lA = await lag(A.page), lB = await lag(B.page);
  T.check('race: on both phones the race keeps up with the shared clock', [lA, lB].every(l => l.lag < Math.max(1, l.t * 0.15)), `behind by ${lA.lag.toFixed(2)} s after ${lA.t.toFixed(0)} s (host), ${lB.lag.toFixed(2)} s after ${lB.t.toFixed(0)} s (friend)`);
  T.check("race: the host sees the friend's car where it is", seen.every(d => d < 12) && moved > 50, `off by ${seen.map(d => d.toFixed(1)).join(', ')} m (after allowing for the delay); friend's distance ${moved.toFixed(0)} m`);
  const [fA, fB] = await Promise.all([until(A.page, () => { const n = window.__game.net; return n && n.race && n.race.mine != null && n.race.theirs != null && document.getElementById('s-results').classList.contains('show') ? n.race : null; }, null, 300000),
    until(B.page, () => { const n = window.__game.net; return n && n.race && n.race.mine != null && n.race.theirs != null && document.getElementById('s-results').classList.contains('show') ? n.race : null; }, null, 300000)]);
  T.check('race: both finish, and both phones have the same two times', fA.mine === fB.theirs && fB.mine === fA.theirs && fA.mine > 20, `host ${fA.mine} s / ${fA.theirs} s, friend ${fB.mine} s / ${fB.theirs} s`);
  const res = async (p) => p.evaluate(() => ({ title: document.getElementById('res-title').textContent, rows: [...document.querySelectorAll('#res-table tbody tr')].map(r => r.textContent), back: document.getElementById('res-restart').textContent }));
  const qA = await res(A.page), qB = await res(B.page), hostWon = fA.mine < fA.theirs;
  T.check('results: the same order on both phones, the winner says Zmaga!', qA.rows.length === 2 && qB.rows.length === 2 && qA.rows[0].includes(hostWon ? 'Ana' : 'Bor') && qB.rows[0].includes(hostWon ? 'Ana' : 'Bor') && (hostWon ? qA : qB).title === 'Zmaga!',
    `host: ${qA.title} ${qA.rows.join(' / ')} | friend: ${qB.title} ${qB.rows.join(' / ')}`);

  // 5. back to the room: the host first. The friend is still on the results, so no start yet; the host's car leaves the
  // friend's track (it would stand there in the way). Then the friend comes back too
  await A.page.evaluate(() => window.__game.onAction('net-room'));
  const hideB = await until(B.page, () => { const r = window.__game.race; return r && r.remote.x === 1e5 ? { x: r.remote.x, title: document.getElementById('res-title').textContent } : null; }, null, 20000);
  const waitA = await A.page.evaluate(() => { window.__game.onAction('net-go'); return { status: document.getElementById('on-status').textContent, go: document.getElementById('on-go').disabled }; });   // (a start would say it loads the track)
  await B.page.evaluate(() => window.__game.onAction('net-room'));
  const inA = await until(A.page, () => !document.getElementById('on-go').disabled ? document.getElementById('on-status').textContent : null, null, 20000);
  T.check('back to the room: the host can start only once the friend is back; the car that left is off the track', hideB.title === qB.title && waitA.go && /vrne v sobo/.test(waitA.status) && /v sobi/.test(inA),
    `friend's results: ${hideB.title}, host's car off the track | host waiting: "${waitA.status}", start disabled ${waitA.go} | then: "${inA}"`);

  // 6. a second race (the friend on the left of the front row this time), in the rain the host chose (the friend's own setting is dry);
  //    the friend leaves in the middle of it
  await A.page.evaluate(() => document.querySelector('[data-set="weather"] button[data-v="rain"]').click());
  await A.page.evaluate(() => window.__game.onAction('net-go'));
  await until(B.page, () => { const g = window.__game; return !!(g.race && g.race.state === 'racing'); }, null, 60000);
  const gA = await A.page.evaluate(() => [window.__game.race.player.grid, window.__game.race.remote.grid]), gB = await B.page.evaluate(() => [window.__game.race.player.grid, window.__game.race.remote.grid]);
  T.check('second race: the sides of the front row change', gA.join() === '2,1' && gB.join() === '1,2', `host ${gA}, friend ${gB}`);
  const wx = await Promise.all([A.page, B.page].map(p => p.evaluate(() => ({ rain: window.__game.race.rain, wet: window.__game.race.player.wet, own: window.__game.S.weather }))));
  T.check("second race: the host's weather (rain) on both phones", wx.every(w => w.rain === 1 && w.wet < 1) && wx[1].own === 'dry', JSON.stringify(wx));
  await wait(3000);
  await B.ctx.close();
  const gone = await until(A.page, () => { const n = window.__game.net; return n && n.race && n.race.left ? { toast: document.getElementById('toast').textContent, dist: window.__game.race.remote.dist, state: window.__game.race.state } : null; }, null, 40000);
  T.check('the friend leaves mid-race: the host is told, the race goes on, the friend is out of the way', /Prijatelj|prekinjena/.test(gone.toast) && gone.dist < -1e8 && gone.state === 'racing', JSON.stringify(gone));
  // 7. quick match: no code, one button
  const big = 'window.__netBig = 2;';   // (a grid of three is big here: the batches of a big grid)
  C = await open('Cene', 0, 0, big); D = await open('Dana', 1, 1, big); E = await open('Eva', 2, 2, big); F = await open('Fani', 3, 3, big);
  const tap = (x) => x.page.evaluate(() => { window.__game.onAction('to-online'); window.__game.onAction('net-wait'); });
  const leave = (x) => x.page.evaluate(() => window.__game.onAction('to-title'));
  const paired = (x, name) => until(x.page, (n) => { const g = window.__game.net; return g && g.open && g.peer && g.peer.name === n ? g.role : null; }, name, 40000);
  const still = (x) => x.page.evaluate(() => { const g = window.__game.net; return !!(g && !g.open && !g.peer); });
  await tap(C);
  const cw = await until(C.page, () => { const t = document.getElementById('on-status').textContent; return /Čakam, da se kdo pridruži/.test(t) ? { t, back: document.getElementById('on-back').textContent, box: document.getElementById('on-codebox').classList.contains('off') } : null; }, null, 30000);
  T.check('quick match: the first waits with a cancel button and no code', cw.back === 'Prekliči' && cw.box, JSON.stringify(cw));
  await wait(1500); await tap(D);
  const [rC, rD] = [await paired(C, 'Dana'), await paired(D, 'Cene')];
  T.check('quick match: the second one taps and they are connected (the first is the host), no code needed', rC === 'host' && rD === 'guest', `${rC} / ${rD}`);
  await until(D.page, () => window.__game.net.synced, null, 20000);
  await tap(E);
  const rE = await until(E.page, () => { const g = window.__game.net; return g && g.open && g.synced && g.players.length === 3 ? { role: g.role, host: g.peer && g.peer.name } : null; }, null, 40000);
  const room3 = await until(C.page, () => { const g = window.__game.net; return g && g.players.length === 3 ? { status: document.getElementById('on-status').textContent, players: document.getElementById('on-players').textContent, go: !document.getElementById('on-go').disabled, locked: g.locked } : null; }, null, 20000);
  const d3 = await until(D.page, () => { const g = window.__game.net; return g && g.players.length === 3 ? document.getElementById('on-status').textContent : null; }, null, 20000);
  T.check('quick match: a third one taps and comes into the same room (up to 22); everyone sees the three, the host can start now', rE.role === 'guest' && rE.host === 'Cene' && /V sobi vas je 3 od 22/.test(room3.status) && /V sobi vas je 3 od 22/.test(d3) &&
    ['Cene', 'Dana', 'Eva'].every(n => room3.players.includes(n)) && room3.go && !room3.locked, `${JSON.stringify(rE)} | host: ${JSON.stringify(room3)} | Dana: ${d3}`);
  // the host starts before the room is full: the race is for the three; the next one to tap waits in a new room
  for (const x of [C, D, E]) await x.page.evaluate(() => { window.__game.autoDrive = true; const t = document.getElementById('on-track'); if (t.value !== 'jezero' && window.__game.net.role === 'host') { t.value = 'jezero'; t.dispatchEvent(new Event('change')); } });
  await C.page.evaluate(() => window.__game.onAction('net-go'));
  const lockC = await C.page.evaluate(() => { const g = window.__game.net; return { locked: g.locked, grid: g.setup ? g.setup.grid : g.race ? g.race.grid : null }; });
  await tap(F);
  await until(F.page, () => /Čakam, da se kdo pridruži/.test(document.getElementById('on-status').textContent) || null, null, 30000); await wait(2000);
  const fAlone = await still(F), fRole = await F.page.evaluate(() => window.__game.net.role);
  T.check('quick match: the host starts early: the race is for the three in the room, which takes nobody more; the next one waits in a new room', lockC.locked && lockC.grid && lockC.grid.length === 3 && fAlone && fRole === 'host',
    `host ${JSON.stringify(lockC)}, Fani alone ${fAlone} (${fRole})`);
  await Promise.all([C, D, E].map(x => until(x.page, () => { const g = window.__game; return !!(g.race && g.race.state === 'racing' && g.net && g.net.race); }, null, 90000)));
  await wait(7000);
  const views = await Promise.all([C, D, E].map(x => x.page.evaluate(() => { const g = window.__game, r = g.race; return { me: g.net.me, big: g.net.race.big, own: r.player.dist, cars: r.cars.length, seen: Object.fromEntries(r.remotes.map(c => [c.netOf.id, c.dist])) }; })));
  const own = Object.fromEntries(views.map(v => [v.me, v.own]));
  T.check('quick match, the race of three (a big grid: 10 states a second, the host passes them on in batches): three cars on every page, each sees the other two move where they are',
    views.every(v => v.big && v.cars === 3 && Object.keys(v.seen).length === 2 && Object.entries(v.seen).every(([id, d]) => d > 5 && Math.abs(d - own[id]) < 40)), JSON.stringify(views));   // (off the grid; the pages are read one after another)
  await leave(E); await leave(F); await leave(C); await leave(D); await wait(1500);
  await Promise.all([tap(C), tap(D)]);
  const [sC, sD] = [await paired(C, 'Dana'), await paired(D, 'Cene')];
  T.check('quick match: two who tap at the same moment meet (one waits, one connects)', sC !== sD && [sC, sD].includes('host'), `${sC} / ${sD}`);
  await leave(C); await leave(D); await wait(1500);
  // a waiting place whose owner is gone without a word (a phone that lost its network): skipped after a few seconds
  const ver = (await E.page.evaluate(() => window.__game.ver)).replace(/[^A-Za-z0-9]/g, '');
  dead = new WebSocket(`ws://127.0.0.1:${port}/peerjs?key=peerjs&id=apex-racing-dirkaska-q${ver}-0&token=dead`);
  await new Promise((res, rej) => { dead.on('open', res); dead.on('error', rej); }); await wait(500);
  await tap(E); await wait(500); await tap(F);
  const [tE, tF] = [await paired(E, 'Fani'), await paired(F, 'Eva')];
  T.check('quick match: a dead waiting place is skipped, the two still meet', tE === 'host' && tF === 'guest', `${tE} / ${tF}`);
  await leave(E); await leave(F);
  try { dead.terminate(); } catch (_) { } await wait(1500);
  // a full room starts its race by itself (here a room of three: Počakaj prijatelja takes up to 22)
  const [G, H, I] = [C, D, E];
  for (const x of [G, H, I]) await x.page.evaluate(() => { window.__quickRoom = 3; });
  await tap(G); await until(G.page, () => /Čakam, da se kdo pridruži/.test(document.getElementById('on-status').textContent) || null, null, 30000);
  await tap(H); await until(H.page, () => { const g = window.__game.net; return !!(g && g.open && g.synced); }, null, 40000);
  for (const x of [G, H, I]) await x.page.evaluate(() => { window.__game.autoDrive = true; });
  await tap(I);
  const fullG = await until(G.page, () => { const g = window.__game.net; return g && g.players.length === 3 ? { status: document.getElementById('on-status').textContent, locked: g.locked } : null; }, null, 40000);
  const auto = await Promise.all([G, H, I].map(x => until(x.page, () => { const g = window.__game; return g.race && g.net && g.net.race ? { cars: g.race.cars.length, grid: g.net.race.grid.length } : null; }, null, 90000)));
  T.check('quick match: a full room starts its race by itself (all three on the grid), and takes nobody more', /Soba je polna \(3\)/.test(fullG.status) && fullG.locked && auto.every(a => a.cars === 3 && a.grid === 3), `${JSON.stringify(fullG)} | ${JSON.stringify(auto)}`);
  for (const x of [G, H, I]) await leave(x);
  T.check('no page errors (quick match)', ![C, D, E, F].some(x => x.errors.length), [C, D, E, F].flatMap(x => x.errors).slice(0, 5).join(' | '));
  T.check('no page errors', !A.errors.length && !B.errors.length, A.errors.concat(B.errors).slice(0, 5).join(' | '));
} catch (e) {
  T.check('the test ran to the end', false, String(e && e.message || e).split('\n')[0]);   // (a wait that timed out: what was waited for is in the message)
  if (A && B) console.log('page errors: ' + (A.errors.concat(B.errors).slice(0, 5).join(' | ') || 'none'));
} finally {
  await browser.close(); await srv.close();
  try { if (dead) dead.terminate(); } catch (_) { }
  peerHttp.closeAllConnections(); peerHttp.close();
}
T.done();
process.exit(process.exitCode || 0);   // (the PeerJS server library keeps a timer running)
