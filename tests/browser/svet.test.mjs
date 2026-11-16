// The world leaderboard in the game (Svetovna lestvica, docs/svetovna-lestvica.md, »V igri«: js/svet.js, the game's hooks in js/game.js, the
// menu's World tab in js/menu.js), against a server of the test's own (https://svet.test, Playwright's routes: the real one is
// streznik/svetovna-lestvica, tested in tests/svet-streznik.test.js; js/svet.js against it in tests/svet.test.js):
//  1. no server address (Svet.CFG.url empty, as till the server is up): nothing of it anywhere (no World tab, no Settings box, no
//     Leaderboard box, no results line).
//  2. the address set: the time trial on Pikes Peak in the menu's Friends view (the fourth camera) has the tabs Friends / World; World
//     before joining: what goes where (the consent), Join / Not now, the privacy policy; upright (360 × 640) and on its side (640 × 360)
//     nothing over the edge.
//  3. Join (the driver's name Lisica): the nickname posted, the world's top rows, the player's own row lit, "#3 of 8", the badge #3.
//  4. a run while the server is down (503): kept in the queue (Settings: one waiting); the server back: the queue sent, the run posted
//     once, the queue empty; a 429 waits as long as the server says.
//  5. the server down with the table kept: the kept rows and "as of HH.MM"; nothing kept: "World leaderboard is not available right now".
//  6. Settings: joined, the nickname, the id; Prijavi on the Leaderboard's World row (prijava posted with that driver's id); the
//     Leaderboard's World: Duh / Skrij / Prijavi on the others' rows, none on the player's; Skrij (asked first): the row gone on this device
//     only (nothing posted), Pokaži skrite voznike (1) brings it back; Duh of a driver without a ghost: a toast, no race; Duh of Hitri Jaka:
//     the ghost downloaded, the time trial started with it as the second ghost; Izbriši moje podatke (asked first): izbris posted, the player
//     out, nothing left waiting.
//   node tests/browser/svet.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('svetovna lestvica');
const srv = await serve();
const browser = await launch();
const SH = 'const root = document.getElementById("menu-host").shadowRoot;';
const ev = (page, body, arg) => page.evaluate(new Function('arg', SH + body), arg);
const J = JSON.stringify;
const URL0 = 'https://svet.test', ME = 'LisicaAbc123';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// the test's server: the world's table of one key (7 drivers, the player's run makes 8), what was posted
const F = { down: 0, retry: 0, rows: [], posts: [], key: '', gets: [] };
// a driver's ghost (Race ghost: GET /v1/duh): only Hitri Jaka's (the game's ghost JSON, js/game.js ghParse: 2 samples of 7 channels)
const GHOST = { v: 1, dt: 0.1, t: 600, n: 2, ch: 7, q0: [0, 0, 0], d: Buffer.alloc(28).toString('base64'), car: 'x' };
const others = () => ['Hitri Jaka', 'Megla', 'Kozorog', 'Sova', 'Burja', 'Polž', 'Zadnji'].map((ime, i) => ({ id: 'drv' + String(i).padStart(9, '0'), ime, oznaka: 'A' + i, ms: 600000 + i * 9000 + (i > 1 ? 20000 : 0), avto: 0 }));
const table = () => F.rows.slice().sort((a, b) => a.ms - b.ms).map((r, i) => Object.assign({ mesto: i + 1, vmes: [], nad: 0, pomoc: 0, priblizno: false, duh: true }, r));
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
async function route(page) {
  await page.route(URL0 + '/**', async (rt) => {
    const rq = rt.request(), u = new URL(rq.url()), p = u.pathname.replace('/v1/', ''), send = (status, o, h) => rt.fulfill({ status, contentType: 'application/json', headers: Object.assign({}, CORS, h), body: J(o) });
    if (rq.method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS });
    if (F.down) return send(F.down, { ok: false, napaka: F.down === 429 ? 'prehitro' : 'dol', cez: F.down === 429 ? F.retry : undefined });
    if (rq.method() === 'GET') {
      const t = table(); F.gets.push(p + '?' + u.searchParams.toString());
      if (p === 'duh') return u.searchParams.get('id') === 'drv000000000' && u.searchParams.get('kljuc') === F.key ? send(200, GHOST) : send(404, { ok: false, napaka: 'ni-duha' });
      if (p === 'lestvica') return send(200, { ok: true, kljuc: u.searchParams.get('kljuc'), od: 0, skupaj: t.length, vrstice: t.slice(0, +u.searchParams.get('n') || 100) });
      if (p === 'mesto') { const r = t.find(x => x.id === u.searchParams.get('id')); return r ? send(200, { ok: true, kljuc: u.searchParams.get('kljuc'), id: r.id, mesto: r.mesto, ms: r.ms, skupaj: t.length }) : send(404, { ok: false, napaka: 'ni-casa' }); }
      return send(404, { ok: false, napaka: 'ni' });
    }
    const buf = rq.postDataBuffer() || Buffer.alloc(0), nl = buf.indexOf(10), pk = JSON.parse(buf.subarray(0, nl < 0 ? buf.length : nl).toString('utf8'));
    F.posts.push([p, pk]);
    if (p === 'vzdevek') return send(200, { ok: true, ime: pk.ime, id: ME, skrit: false });
    if (p === 'oddaja') { F.rows = F.rows.filter(r => r.id !== ME); F.rows.push({ id: ME, ime: 'Lisica', oznaka: 'L1', ms: pk.t, avto: pk.avto | 0 }); return send(200, { ok: true, st: table().findIndex(r => r.id === ME) + 1 }); }
    if (p === 'prijava') return send(200, { ok: true });
    if (p === 'izbris') { F.rows = F.rows.filter(r => r.id !== ME); return send(200, { ok: true }); }
    return send(404, { ok: false, napaka: 'ni' });
  });
}
const posts = (p) => F.posts.filter(x => x[0] === p).map(x => x[1]);
// the track step's Friends view: its tabs, the World's rows, the line under them, the badge, anything over the edge
const view = (p) => ev(p, `const t = root.querySelector('.wtab'), rs = t ? [...t.querySelectorAll('tbody tr')].filter(r => r.getClientRects().length) : [], W = innerWidth, H = innerHeight, q = (s) => root.querySelector(s);
  return { tabs: [...root.querySelectorAll('.ftabs [role="tab"]')].map(b => b.textContent + (b.getAttribute('aria-selected') === 'true' ? '*' : '')), world: !!q('.dio.friends.world'),
    join: q('.fjoin') ? q('.fjoin').textContent : '', acts: [...root.querySelectorAll('.dio.friends [data-act]')].map(b => b.dataset.act), pol: q('.fpol') ? q('.fpol').getAttribute('href') : '',
    rows: rs.map(r => [...r.children].map(c => c.textContent)), me: rs.findIndex(r => r.classList.contains('me')), line: q('.wline') ? q('.wline').textContent : '', none: q('.dio.friends .fnone') ? q('.dio.friends .fnone').textContent : '',
    badge: (q('.fbadge') || {}).textContent || '', cut: rs.some(r => [...r.children].some(c => c.scrollWidth > c.clientWidth + 1)),
    over: [...root.querySelectorAll('.dio.friends, .dio.friends *, .fbadge')].filter(e => { const b = e.getBoundingClientRect(); return b.width && (b.right > W + 0.5 || b.left < -0.5 || b.bottom > H + 0.5 || b.top < -0.5); }).map(e => e.className || e.tagName) };`);
const click = (page, act) => page.click(`[data-act="${act}"] >> visible=true`);
const ready = (page) => page.waitForFunction(() => window.Menu && Menu.ready && document.getElementById('menu-host').shadowRoot.querySelector('#s-title'), null, { timeout: 60000 });
const S = (page) => page.evaluate(() => ({ st: Svet.state(), q: Svet.queue() }));
const until = async (page, fn, arg, ms = 15000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true).catch(() => false);

try {
  const A = await openGame(browser, srv.base + '/index.html', { name: 'Lisica', intro: 2 }, { width: 360, height: 640 }, { menu: true });
  const pa = A.page; await route(pa);
  pa.on('dialog', d => d.accept());
  await ready(pa);
  await click(pa, 'single'); await click(pa, 'mode:trial');
  const n0 = await pa.evaluate(() => Menu.debug().list.length);
  for (let k = 0; k < n0; k++) { if (await pa.evaluate(() => { const d = Menu.debug(); return d.list[d.trackIdx]; }) === 'pikes') break; await click(pa, 'track:1'); }
  await click(pa, 'cam:4'); await pa.waitForTimeout(400);

  // 1. no address: nothing of it
  const d1 = await pa.evaluate(() => { const g = window.__game; return { on: g.svet.on, key: g.svet.key('pikes'), box: document.getElementById('set-svet').classList.contains('off'), board: !!document.getElementById('sv-box'), w: g.svet.world('pikes', 5) }; });
  const v1 = await view(pa);
  F.key = d1.key || '';
  T.check('1. no server address: nothing of the world leaderboard (no World tab in the Friends view, the Settings box hidden, no world table); the time trial on Pikes Peak has a world key',
    !d1.on && /^pikes@[a-z]+$/.test(d1.key || '') && d1.box && !d1.board && d1.w === null && !v1.tabs.length && !v1.world, J({ d1, v1 }));

  // 2. the address set: the tabs, the World before joining
  F.rows = others();
  await pa.evaluate((u) => { Svet.CFG.url = u; Menu.refresh(); }, URL0); await pa.waitForTimeout(300);
  await ev(pa, 'root.querySelector(\'[data-act="ftab:w"]\').click();'); await pa.waitForTimeout(300);
  for (const [w, h, how] of [[360, 640, 'upright'], [640, 360, 'on its side']]) {
    await pa.setViewportSize({ width: w, height: h }); await pa.waitForTimeout(600);
    const v = await view(pa);
    T.check(`2. the address set, the World tab before joining ${how} (${w} × ${h}): Friends / World (World chosen), the consent (EU server, a nickname, delete in Settings, under 15), Join, Not now, the privacy policy; nothing over the edge`,
      J(v.tabs) === J(['Friends', 'World*']) && v.world && /our server in the EU/.test(v.join) && /nickname, not your real name/.test(v.join) && /delete them in Settings/.test(v.join) && /Under 15/.test(v.join) &&
      v.acts.includes('world-join') && v.acts.includes('ftab:f') && v.pol === 'privacy.html' && !v.over.length && !F.posts.length, J(v));
  }
  await pa.setViewportSize({ width: 360, height: 640 }); await pa.waitForTimeout(400);

  // 3. Join: the nickname, the rows, the place
  await ev(pa, 'root.querySelector(\'[data-act="world-join"]\').click();');
  const nicked = await until(pa, () => Svet.state().id === 'LisicaAbc123');
  const s3 = await S(pa);
  T.check('3. Join with the driver\'s name Lisica: joined, the nickname posted (Lisica), the server\'s id kept, nothing sent before',
    nicked && s3.st.on === true && s3.st.ime === 'Lisica' && posts('vzdevek').length === 1 && posts('vzdevek')[0].ime === 'Lisica' && !posts('oddaja').length, J({ s3, posts: F.posts }));
  // a run (as the game's ttFinish gives it to svSend: Svet.add with the record's packet), sent at once
  const run = (t) => pa.evaluate(async ([k, t]) => { await Svet.add({ kljuc: k, avto: 0, nad: 0, pomoc: 0, t, zig: 'test', eng: 'V8', vmes: [], n: 1, s0: 1, s1: 2, fs: 1000 }, '{"v":1}', '{"g":1}'); return Svet.flush(); }, [F.key, t]);
  const r3 = await run(615000);
  await pa.evaluate(() => { __game.svet.world('pikes', 5); }); await sleep(100);
  // (the menu's table refreshed once a minute: the test's own clock moved on)
  await pa.evaluate(() => { const n = Date.now; Date.now = () => n() + 61e3; Menu.refresh(); setTimeout(() => { Date.now = n; }, 50); });
  await until(pa, () => !!document.getElementById('menu-host').shadowRoot.querySelector('.wtab tr.me'), null, 8000);
  const v3 = await view(pa);
  T.check('the run sent at once (oddaja posted once, the queue empty); the World tab: the top 5, Lisica 3rd and lit, "#3 of 8", the badge #3, the times whole, nothing over the edge',
    J(r3) === J([{ k: F.key, r: 'ok' }]) && posts('oddaja').length === 1 && posts('oddaja')[0].t === 615000 && v3.rows.length === 5 && v3.me === 2 && v3.rows[2][1] === 'Lisica' && v3.rows[0][1] === 'Hitri Jaka' &&
    /^#3 of 8/.test(v3.line) && v3.badge === '#3' && !v3.cut && !v3.over.length, J({ r3, v3 }));
  await pa.setViewportSize({ width: 640, height: 360 }); await pa.waitForTimeout(600);
  const v3b = await view(pa);
  T.check('on its side (640 × 360): the top 6, Lisica lit, nothing over the edge', v3b.rows.length === 6 && v3b.me === 2 && !v3b.cut && !v3b.over.length, J(v3b));
  await pa.setViewportSize({ width: 360, height: 640 }); await pa.waitForTimeout(400);

  // 4. the server down: the run waits; back: sent once; 429
  F.down = 503;
  const r4 = await run(612000), s4 = await S(pa), set4 = await pa.evaluate(() => __game.svet.set());
  F.down = 0;
  const r4b = await pa.evaluate(() => { const Q = JSON.parse(localStorage.getItem(Svet.QUEUE) || '[]'); for (const e of Q) e.at = 0; localStorage.setItem(Svet.QUEUE, JSON.stringify(Q)); Svet.config({}); return Svet.flush(); });   // (config: the queue read again from the store)
  const s4b = await S(pa);
  T.check('4. a better run while the server is down (503): kept in the queue (Settings: "Časi, ki čakajo na pošiljanje: 1"); the server back: sent once, the queue empty',
    J(r4) === J([{ k: F.key, r: 'later' }]) && s4.q.length === 1 && /Časi, ki čakajo na pošiljanje: 1/.test(set4) && J(r4b) === J([{ k: F.key, r: 'ok' }]) && s4b.q.length === 0 && posts('oddaja').length === 2 && posts('oddaja')[1].t === 612000,
    J({ r4, q: s4.q.length, r4b, q2: s4b.q.length, n: posts('oddaja').length }));
  F.down = 429; F.retry = 600;
  const r4c = await run(611000), s4c = await S(pa), w4c = s4c.q[0] && s4c.q[0].at;
  F.down = 0;
  const r4d = await pa.evaluate(() => Svet.flush());
  T.check('a 429 (cez 600 s): the run waits about 10 minutes, a flush before then sends nothing', J(r4c) === J([{ k: F.key, r: 'later' }]) && s4c.q.length === 1 && w4c - Date.now() > 500e3 && !r4d.length && posts('oddaja').length === 2,
    J({ r4c, at: w4c && Math.round((w4c - Date.now()) / 1000), r4d }));
  await pa.evaluate(() => { localStorage.setItem(Svet.QUEUE, '[]'); Svet.config({}); });

  // 5. the server down: the kept table with its time; nothing kept: one line
  F.down = 503;
  await pa.evaluate(() => { const n = Date.now; Date.now = () => n() + 122e3; Menu.refresh(); setTimeout(() => { Date.now = n; }, 50); });
  await until(pa, () => /as of/.test((document.getElementById('menu-host').shadowRoot.querySelector('.wline') || {}).textContent || ''), null, 8000);
  const v5 = await view(pa);
  T.check('5. the server down, the table kept: the kept rows, Lisica lit, "as of HH.MM"', v5.rows.length === 5 && v5.me >= 0 && /as of \d\d[.:]\d\d/.test(v5.line), J(v5));
  await pa.evaluate(() => { localStorage.removeItem(Svet.CACHE); });
  const B = await openGame(browser, srv.base + '/index.html', { name: 'Megla', intro: 2 }, { width: 360, height: 640 }, { menu: true });
  const pb = B.page; await route(pb); await ready(pb);
  await pb.evaluate((u) => { Svet.CFG.url = u; Svet.join(); }, URL0);
  await click(pb, 'single'); await click(pb, 'mode:trial');
  for (let k = 0; k < n0; k++) { if (await pb.evaluate(() => { const d = Menu.debug(); return d.list[d.trackIdx]; }) === 'pikes') break; await click(pb, 'track:1'); }
  await click(pb, 'cam:4'); await pb.waitForTimeout(300);
  await ev(pb, 'root.querySelector(\'[data-act="ftab:w"]\').click();');
  await until(pb, () => /not available/.test(((document.getElementById('menu-host').shadowRoot.querySelector('.dio.friends .fnone')) || {}).textContent || ''), null, 10000);
  const v5b = await view(pb);
  T.check('nothing kept (another phone, joined): "World leaderboard is not available right now", no rows, nothing over the edge', !v5b.rows.length && /World leaderboard is not available right now/.test(v5b.none) && !v5b.over.length, J(v5b));
  await B.ctx.close();
  F.down = 0;

  // 6. Settings; Prijavi; Izbriši moje podatke
  const set6 = await pa.evaluate(() => __game.svet.set());
  T.check('6. Settings: joined (Izstopi), the nickname Lisica, the id, Izbriši moje podatke, the privacy policy (zasebnost.html in Slovenian)',
    /data-act="sv-leave"/.test(set6) && /id="sv-nick"[^>]*value="Lisica"/.test(set6) && /Id igralca: LisicaAbc123/.test(set6) && /data-act="sv-erase"/.test(set6) && /zasebnost\.html/.test(set6), set6.slice(0, 400));
  await pa.evaluate(() => __game.svet.report('drv000000004', 'Burja'));
  const rep = await until(pa, () => true, null, 100) && await (async () => { for (let i = 0; i < 30 && !posts('prijava').length; i++) await sleep(100); return posts('prijava'); })();
  T.check('Prijavi a driver (asked first): prijava posted with that driver\'s id', rep.length === 1 && rep[0].id === 'drv000000004', J(rep));
  // the Leaderboard's World: Duh, Skrij, Pokaži skrite (the Leaderboard of Pikes Peak, the table from the server)
  const box = () => pa.evaluate(() => { const b = document.getElementById('sv-box'); return b && { rows: [...b.querySelectorAll('tbody tr')].map(r => ({ nm: (r.querySelector('.nm') || {}).textContent, me: r.classList.contains('me'), acts: [...r.querySelectorAll('[data-act]')].map(e => e.dataset.act) })), un: [...b.querySelectorAll('[data-act="sv-unhide"]')].map(e => e.textContent), w: Math.round(b.querySelector('table') ? b.querySelector('table').getBoundingClientRect().right : 0), W: innerWidth }; });
  const hit = (act, id) => pa.evaluate(([a, i]) => document.querySelector('#sv-box [data-act="' + a + '"]' + (i ? '[data-id="' + i + '"]' : '')).click(), [act, id]);
  await pa.evaluate(() => __game.onAction('to-board'));
  await until(pa, () => !!document.querySelector('#sv-box [data-act="sv-ghost"]'), null, 10000);
  const b7 = await box(), oth = b7 && b7.rows.filter(r => !r.me), mine7 = b7 && b7.rows.find(r => r.me);
  T.check('the Leaderboard\'s World of Pikes Peak: 8 rows, the others\' with Duh, Skrij and Prijavi, the player\'s own (Lisica) with none; the table within 360 px',
    b7 && b7.rows.length === 8 && oth.length === 7 && oth.every(r => J(r.acts) === J(['sv-ghost', 'sv-hide', 'sv-report'])) && mine7 && mine7.nm === 'Lisica' && !mine7.acts.length && !b7.un.length && b7.w > 0 && b7.w <= b7.W, J(b7));
  const np = F.posts.length;
  await hit('sv-hide', 'drv000000001'); await sleep(200);
  const b7b = await box(), h7 = await pa.evaluate(() => Svet.hidden()), w7 = await pa.evaluate(() => { const w = __game.svet.world('pikes', 8); return w && w.rows.map(r => r.name); });
  T.check('Skrij Megla (asked first): the row gone, "Pokaži skrite voznike (1)", kept on this device only (nothing posted); the menu\'s World without her too',
    b7b.rows.length === 7 && !b7b.rows.some(r => r.nm === 'Megla') && J(b7b.un) === J(['Pokaži skrite voznike (1)']) && J(h7) === J(['drv000000001']) && F.posts.length === np && w7 && !w7.includes('Megla'), J({ b7b, h7, w7 }));
  await hit('sv-unhide'); await sleep(200);
  const b7c = await box();
  T.check('Pokaži skrite voznike: Megla back, nothing hidden', b7c.rows.length === 8 && b7c.rows.some(r => r.nm === 'Megla') && !b7c.un.length && !(await pa.evaluate(() => Svet.hidden())).length, J(b7c));
  await hit('sv-ghost', 'drv000000001');
  const t7 = await until(pa, () => /ni mogoče naložiti/.test(document.getElementById('toast').textContent), null, 5000);
  T.check('Duh of a driver without a ghost (404): "Duha tega voznika ni mogoče naložiti.", no race, no ghost', t7 && !(await pa.evaluate(() => __game.ghostF)) && !!(await pa.evaluate(() => document.getElementById('sv-box'))) && F.gets.some(g => g === 'duh?' + new URLSearchParams({ kljuc: F.key, id: 'drv000000001' })), J(F.gets.filter(g => /^duh/.test(g))));
  await hit('sv-ghost', 'drv000000000');
  const g7ok = await until(pa, () => !!(window.__game.ghostF && window.__game.race), null, 30000), g7 = await pa.evaluate(() => ({ f: __game.ghostF, tt: !!(__game.race && __game.race.timeTrial), id: __game.race && __game.race.track && __game.race.track.def && __game.race.track.def.id }));
  T.check('Duh of Hitri Jaka: the ghost downloaded (GET /v1/duh with the key and his id), the time trial on Pikes Peak started with him as the second ghost (Hitri Jaka, 10:00.000, not a lap)',
    g7ok && g7.f && g7.f.name === 'Hitri Jaka' && Math.abs(g7.f.t - 600) < 1e-9 && g7.f.lap === false && g7.tt && F.gets.includes('duh?' + new URLSearchParams({ kljuc: F.key, id: 'drv000000000' })), J(g7));
  await pa.evaluate(() => __game.svet.erase());
  for (let i = 0; i < 30 && !posts('izbris').length; i++) await sleep(100);
  await until(pa, () => !Svet.state().id, null, 5000);
  const s6 = await S(pa), set6b = await pa.evaluate(() => __game.svet.set());
  T.check('Izbriši moje podatke (asked first): izbris posted, the player out (no id, not joined), nothing waiting; Settings: Pridruži se',
    posts('izbris').length === 1 && !s6.st.id && s6.st.on !== true && !s6.q.length && !F.rows.some(r => r.id === ME) && /data-act="sv-join"/.test(set6b), J({ st: s6.st, set6b: set6b.slice(0, 200) }));

  const errs = A.errors.filter(e => !/svet\.test|status of (503|429|404)/.test(e));
  T.check('no errors in the page (the test server\'s 503, 429 and 404 answers aside)', !errs.length, J(errs));
  await A.ctx.close();
} catch (e) {
  T.check('the test ran to the end', false, e && e.stack || String(e));
} finally {
  await browser.close(); srv.close();
}
T.done();
