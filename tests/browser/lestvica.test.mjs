// The friends' leaderboard (Lestvica prijateljev, docs/lestvica-prijateljev.md: js/lestvica.js, the game's hooks in js/game.js, the
// menu's Friends view in js/menu.js): two phones swap their links, a third gets the first one's profile.
//  1. Lisica (a lap on Spa) sends the times: a link of the game (#lestvica=..., under 16 000 characters).
//  2. A fresh profile opens it: Lisica's time kept as sent, the offer to send its own back; the nickname asked first (the default
//     name is no one's): Turbo Tina. The link back carries Tina's packet and Lisica's, exactly as Lisica signed it. The track step on
//     Spa in the Friends view (the fourth camera), upright (360 × 640) and on its side (640 × 360): every row in sight, the times
//     and gaps whole, nothing over the edge, Tina's row lit; the row's best (tw:best): its window on the Friends tab, Tina 2nd and lit
//     (the place among the friends by the best lap; the badge over the track step went with the row's windows, #667).
//  3. Lisica opens Tina's link in the game's open tab (only the address's #... changed: hashchange): Tina new, Lisica's own packet
//     in it not taken; the Friends view and the best's window: Lisica 1st; the Leaderboard's friends by Spa,
//     Prijatelji, Odstrani (asked first): gone and hidden; the same link again asks before it takes the times back (no: nothing
//     taken; yes: back).
//  4. Lisica's new lap on Jezero, sent again: Tina's game (the old menus) takes it; Tina's qualifying lap on Jezero: the results say
//     the place among the friends, and Pošlji prijateljem after the new best sends it with the day and the car; Lisica's Leaderboard
//     shows them. A link opened in the tab during the lap waits for the menus.
//  5. Lisica's profile file carries the leaderboard: the key (imported on another phone, the same friend: profImport puts back every
//     tdgp- key) and the friends' times.
//   node tests/browser/lestvica.test.mjs
import { readFile } from 'node:fs/promises';
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('lestvica prijateljev');
const srv = await serve();
const browser = await launch();
const SH = 'const root = document.getElementById("menu-host").shadowRoot;';
const ev = (page, body, arg) => page.evaluate(new Function('arg', SH + body), arg);
const J = JSON.stringify;
// (the records before the game starts, only the first time: the test's start-up script runs again at every load)
const recs = (t) => `if (!localStorage.getItem('tdgp-records')) localStorage.setItem('tdgp-records', ${J(J({ tracks: t }))});`;
const send = (p) => p.evaluate(async () => { const g = window.__game; g.lpLink = undefined; const how = await g.lp.send(); return { how, link: g.lpLink, screen: g.screen }; });
const zOf = (link) => (link || '').split('#lestvica=')[1] || '';
const lpScreen = (p) => p.evaluate(() => ({ screen: window.__game.screen, msg: document.getElementById('lp-msg').textContent, more: document.getElementById('lp-more').textContent,
  nick: !document.getElementById('lp-nick-w').classList.contains('off'), go: document.getElementById('lp-go').textContent }));
const friends = (p) => p.evaluate(() => { const S = window.__game.lp.store; return { F: Object.keys(S.friends).map(id => ({ id, name: S.friends[id].name, t: S.friends[id].t })), hidden: S.hidden.slice() }; });
const toast = (p) => p.evaluate(() => document.getElementById('toast').textContent);
// the track step's Friends view: its rows (the cells' texts), how many in sight, the player's row, the pressed camera,
// anything over the edge, a time or a gap cut short
const view = (p) => ev(p, `const t = root.querySelector('.ftab'), rs = t ? [...t.querySelectorAll('tbody tr')] : [], tb = t && t.getBoundingClientRect(), W = innerWidth, H = innerHeight;
  const pr = root.querySelector('.cams [aria-pressed="true"]');
  return { rows: rs.map(r => [...r.children].map(c => c.textContent)), seen: rs.filter(r => { const b = r.getBoundingClientRect(); return b.top >= tb.top - 0.5 && b.bottom <= tb.bottom + 0.5; }).length,
    me: rs.findIndex(r => r.classList.contains('me')), send: (root.querySelector('.fsend') || {}).textContent || '', pressed: pr ? pr.dataset.act : '',
    over: [...root.querySelectorAll('.dio.friends, .dio.friends *, .trow')].filter(e => { const b = e.getBoundingClientRect(); return b.width && (b.right > W + 0.5 || b.left < -0.5 || b.bottom > H + 0.5 || b.top < -0.5); }).map(e => e.className),
    cut: rs.some(r => [...r.children].slice(3).some(c => c.scrollWidth > c.clientWidth + 1)), track: __game.S.track, cam: __game.S.menuCam };`);
// the row's best (tw:best): its window's tabs (the chosen one), its list (place, nickname, time), the player's row, anything over the
// edge; then Close
const best = async (p) => {
  await ev(p, 'root.querySelector(\'.trow [data-act="tw:best"]\').click();');
  await p.waitForFunction(() => { const sh = document.getElementById('menu-host').shadowRoot.querySelector('.sheet.twin.bst'); return sh && !sh.getAnimations({ subtree: true }).some(a => a.playState === 'running'); }, null, { timeout: 10000 }).catch(() => null);   // (the window slides up: measured once it is still)
  const b = await ev(p, `const sh = root.querySelector('.sheet.twin.bst'), W = innerWidth, H = innerHeight; if (!sh) return null;
    const ls = [...sh.querySelectorAll('.blist li:not(.dots)')];
    return { h: sh.querySelector('h2').textContent, tab: (sh.querySelector('[role="tab"][aria-selected="true"]') || {}).textContent || '', rows: ls.map(l => [...l.children].map(c => c.textContent)),
      me: ls.findIndex(l => l.classList.contains('me')), over: [sh, ...sh.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > W + 0.5 || r.left < -0.5 || r.bottom > H + 0.5 || r.top < -0.5); }).map(e => e.className) };`);
  await ev(p, 'root.querySelector(\'.sheet.twin button.go[data-act="close-sheet"]\').click();'); await p.waitForTimeout(300);
  return b;
};
try {
  // 1. Lisica's times as a link
  const A = await openGame(browser, srv.base + '/index.html', { name: 'Lisica', track: 'spa', mode: 'race' }, { width: 360, height: 640 }, { menu: true, init: recs({ 'spa@cs': { bestLap: 136.8 } }) });
  const pa = A.page;
  const a1 = await send(pa), z1 = zOf(a1.link), aId = await pa.evaluate(async () => (await Lestvica.me(false)).id);
  T.check('1. Lisica sends the times: a link of the game (#lestvica=...), under 16 000 characters, with a key of its own made for it',
    a1.link && a1.link.startsWith(srv.base + '/index.html#lestvica=') && /^[\w-]+$/.test(z1) && z1.length <= 16000 && /^[\w-]{12}$/.test(aId || ''), J({ how: a1.how, len: z1.length, aId }));

  // 2. a fresh profile opens it; the nickname; the link back; the Friends view upright and on its side
  const B = await openGame(browser, a1.link, { track: 'spa', mode: 'race', quali: 1 }, { width: 360, height: 640 }, { menu: true, init: recs({ 'spa@cs': { bestLap: 137.57 } }) });
  const pb = B.page;
  await pb.waitForFunction(() => window.__game.screen === 'lp', null, { timeout: 60000 });
  const b1 = await lpScreen(pb), f1 = await friends(pb);
  T.check('2. the link opened in a fresh profile: Lisica kept with the time as sent; "Nov prijatelj na lestvici: Lisica. Časov: 1, boljših od tvojih: 1. Pošlješ svoje nazaj?" (Pošlji svoje, Pozneje)',
    b1.msg === 'Nov prijatelj na lestvici: Lisica. Časov: 1, boljših od tvojih: 1. Pošlješ svoje nazaj?' && !b1.nick && b1.go === 'Pošlji svoje' && f1.F.length === 1 && f1.F[0].id === aId && f1.F[0].name === 'Lisica' && J(f1.F[0].t) === J({ 'spa@cs': [136800, 0, null] }), J({ b1, f1 }));
  await pb.click('#lp-go'); await pb.waitForTimeout(300);
  const b2 = await lpScreen(pb), l2 = await pb.evaluate(() => window.__game.lpLink);
  T.check('Pošlji svoje with the default name: the nickname asked first ("Vpiši vzdevek, ne pravega imena"), no link yet', b2.screen === 'lp' && b2.nick && b2.go === 'Pošlji' && /Vpiši vzdevek, ne pravega imena\./.test(b2.msg) && !l2, J(b2));
  await pb.fill('#lp-nick', 'Turbo Tina'); await pb.click('#lp-go');
  await pb.waitForFunction(() => window.__game.lpLink && document.getElementById('menu-host').shadowRoot.querySelector('.dio.friends'), null, { timeout: 60000 });
  const b3 = await pb.evaluate(async (z1) => { const g = window.__game, z = g.lpLink.split('#lestvica=')[1], L = await Lestvica.readLink(z), raw = JSON.parse(await Lestvica.unpack(z)).p, a = JSON.parse(await Lestvica.unpack(z1)).p[0];
    return { link: g.lpLink, name: g.S.name, screen: g.screen, p: L && L.packets.map(p => [p.name, p.t]), fwd: raw.length === 2 && raw[1][0] === a[0] && raw[1][1] === a[1] }; }, z1);
  T.check('the nickname kept as the driver\'s name; the link back: Tina\'s packet first, then Lisica\'s exactly as Lisica signed it; then the track step on Spa',
    b3.name === 'Turbo Tina' && b3.screen === 'track' && J(b3.p) === J([['Turbo Tina', { 'spa@cs': [137570, 0, null] }], ['Lisica', { 'spa@cs': [136800, 0, null] }]]) && b3.fwd, J(b3));
  const ROWS = J([['1', 'Lisica', '–', '2:16.800', ''], ['2', 'Turbo Tina', '–', '2:17.570', '+0.770']]), BEST = J([['1', 'Lisica', '2:16.800'], ['2', 'Turbo Tina', '2:17.570']]);
  for (const [w, h, how] of [[360, 640, 'upright'], [640, 360, 'on its side']]) {
    await pb.setViewportSize({ width: w, height: h }); await pb.waitForTimeout(700);
    const v = await view(pb);
    T.check(`the Friends view ${how} (${w} × ${h}): the fourth camera lit, Lisica 1st, Tina 2nd and lit, the gap +0.770; every row in sight, the times whole, nothing over the edge; Send my times`,
      v.track === 'spa' && v.cam === 4 && v.pressed === 'cam:4' && J(v.rows) === ROWS && v.seen === 2 && v.me === 1 && !v.cut && !v.over.length && v.send === 'Send my times', J(v));
    const b = await best(pb);
    T.check(`the row's best ${how}: its window "Best times · Spa" on the Friends tab, Lisica 1st, Tina 2nd and lit (the place among the friends by the best lap), nothing over the edge`,
      b && b.h === 'Best times · Spa' && b.tab === 'Friends' && J(b.rows) === BEST && b.me === 1 && !b.over.length, J(b));
  }
  await pb.setViewportSize({ width: 360, height: 640 });
  await ev(pb, 'root.querySelector(\'[data-act="cam:1"]\').click();'); await pb.waitForTimeout(400);
  const v1 = await view(pb);
  const b1m = await best(pb);
  await ev(pb, 'root.querySelector(\'[data-act="cam:4"]\').click();'); await pb.waitForTimeout(400);
  const v2 = await view(pb);
  T.check('on the map (camera 1) the row\'s best still has the friends\' times (Tina 2nd and lit); the fourth camera opens the Friends view again',
    v1.pressed === 'cam:1' && !v1.rows.length && b1m && b1m.tab === 'Friends' && J(b1m.rows) === BEST && b1m.me === 1 && v2.pressed === 'cam:4' && v2.rows.length === 2, J({ v1, b1m, v2 }));

  // 3. Lisica opens Tina's link; the Leaderboard; Odstrani; the link again
  await pa.goto(b3.link); await pa.waitForFunction(() => window.__game && window.__game.screen === 'lp', null, { timeout: 120000 });
  const a3 = await lpScreen(pa), fa3 = await friends(pa);
  const tId = (fa3.F[0] || {}).id;
  T.check('3. Lisica opens Tina\'s link in the game\'s open tab (hashchange): Tina new ("Časov: 1, boljših od tvojih: 0"), Lisica\'s own packet in it not taken',
    a3.msg === 'Nov prijatelj na lestvici: Turbo Tina. Časov: 1, boljših od tvojih: 0. Pošlješ svoje nazaj?' && !a3.more && fa3.F.length === 1 && fa3.F[0].name === 'Turbo Tina' && tId !== aId, J({ a3, fa3 }));
  await pa.click('[data-act="lp-later"]');
  await pa.waitForFunction(() => document.getElementById('menu-host').shadowRoot.querySelector('.dio.friends'), null, { timeout: 60000 });
  const va = await view(pa), ba = await best(pa);
  T.check('Pozneje: the track step on Spa in the Friends view, Lisica 1st and lit; the row\'s best: Lisica 1st and lit on the Friends tab',
    va.track === 'spa' && va.me === 0 && va.rows.length === 2 && va.rows[1][1] === 'Turbo Tina' && ba && ba.tab === 'Friends' && J(ba.rows) === BEST && ba.me === 0, J({ va, ba }));
  await pa.evaluate(() => window.__game.onAction('to-board')); await pa.waitForTimeout(400);
  const bd = await pa.evaluate(() => { const box = document.querySelector('#board-body .lp-box'); return box && { h: box.querySelector('.ltab-h').textContent, head: [...box.querySelectorAll('thead th')].map(e => e.textContent), rows: [...box.querySelectorAll('tbody tr')].map(r => [...r.children].map(c => c.textContent)), acts: [...box.querySelectorAll('[data-act]')].map(b => b.dataset.act + ':' + b.textContent) }; });
  T.check('the Leaderboard by Spa: the friends\' table (#, Voznik, Avto, Čas, Zaostanek, Datum), Pošlji svoje čase and Prijatelji (1)',
    bd && /^Prijatelji · Spa/.test(bd.h) && J(bd.head) === J(['#', 'Voznik', 'Avto', 'Čas', 'Zaostanek', 'Datum']) && bd.rows.length === 2 && bd.rows[0][1] === 'Lisica' && bd.rows[1][1] === 'Turbo Tina' && bd.rows[1][4] === '+0.770' &&
    J(bd.acts) === J(['lp-send:Pošlji svoje čase', 'lp-list:Prijatelji (1)']), J(bd));
  await pa.evaluate(() => window.__game.onAction('lp-list')); await pa.waitForTimeout(200);
  const ls = await pa.evaluate(() => [...document.querySelectorAll('#board-body tbody tr')].map(r => [...r.children].map(c => c.textContent)));
  let asked = '';
  pa.once('dialog', (d) => { asked = d.message(); d.accept(); });
  await pa.click('[data-act="lp-del"]'); await pa.waitForTimeout(300);
  const fa4 = await friends(pa), empty = await pa.evaluate(() => document.getElementById('board-body').textContent);
  T.check('Prijatelji: Tina with 1 time and Odstrani; Odstrani asked first: Tina gone and hidden',
    ls.length === 1 && ls[0][0] === 'Turbo Tina' && ls[0][1] === '1' && ls[0][3] === 'Odstrani' && /^Odstranim Turbo Tina z lestvice prijateljev\?/.test(asked) && !fa4.F.length && J(fa4.hidden) === J([tId]) && /Na lestvici še ni prijateljev\./.test(empty), J({ ls, asked, fa4 }));
  let asked2 = '';
  pa.once('dialog', (d) => { asked2 = d.message(); d.dismiss(); });
  await pa.goto(b3.link); await pa.waitForFunction(() => window.__game, null, { timeout: 120000 });
  await pa.waitForFunction(() => /ni dodana/.test(document.getElementById('toast').textContent), null, { timeout: 30000 }).catch(() => null);
  const fa5 = await friends(pa), t5 = await toast(pa);
  pa.once('dialog', (d) => d.accept());
  await pa.goto(b3.link); await pa.waitForFunction(() => window.__game && window.__game.screen === 'lp', null, { timeout: 120000 });
  const fa6 = await friends(pa);
  T.check('the hidden friend\'s link again: asked first; no: nothing taken ("Povezava od Turbo Tina ni dodana"); yes: Tina back, no longer hidden',
    asked2 === 'Turbo Tina: časi so odstranjeni z lestvice prijateljev. Dodam čase iz te povezave nazaj?' && !fa5.F.length && t5 === 'Povezava od Turbo Tina ni dodana: časi tega igralca so odstranjeni z lestvice.' &&
    fa6.F.length === 1 && fa6.F[0].id === tId && !fa6.hidden.length, J({ asked2, t5, fa5, fa6 }));
  await pa.click('[data-act="lp-later"]');

  // 4. Lisica's lap on Jezero sent again; Tina's qualifying lap there and its results
  await pa.evaluate(() => { const r = JSON.parse(localStorage.getItem('tdgp-records')); r.tracks['jezero@cs'] = { bestLap: 40 }; localStorage.setItem('tdgp-records', JSON.stringify(r)); });
  await pa.goto(srv.base + '/index.html'); await pa.waitForFunction(() => window.__game, null, { timeout: 120000 });
  const a7 = await send(pa), day = await pa.evaluate(() => Lestvica.dayOf(Date.now()));
  await pb.evaluate(() => localStorage.setItem('tdgp-menu', 'old'));
  await pb.evaluate((l) => history.replaceState(null, '', l), a7.link); await pb.reload(); await pb.waitForFunction(() => window.__game && window.__game.screen === 'lp', null, { timeout: 120000 });   // (the link with a load of its own: the old menus)
  const b7 = await lpScreen(pb), fb7 = await friends(pb);
  T.check('4. Lisica\'s new lap on Jezero, sent again: in Tina\'s game "Novi časi od: Lisica. Časov: 2, boljših od tvojih: 1", the lap with today\'s day',
    b7.msg === 'Novi časi od: Lisica. Časov: 2, boljših od tvojih: 1. Pošlješ svoje nazaj?' && fb7.F.length === 1 && J(fb7.F[0].t['jezero@cs']) === J([40000, day, null]), J({ b7, fb7, day }));
  await pb.click('[data-act="lp-later"]'); await pb.waitForTimeout(400);
  const b8 = await pb.evaluate(() => ({ screen: window.__game.screen, track: window.__game.S.track, h: (document.querySelector('#board-body .lp-box .ltab-h') || {}).textContent }));
  T.check('Pozneje in the old menus: the Leaderboard on Jezero with the friends\' times', b8.screen === 'board' && b8.track === 'jezero' && /^Prijatelji · Jezero/.test(b8.h || ''), J(b8));
  await startTrack(pb, 'jezero');
  await pb.evaluate((z) => { document.getElementById('toast').textContent = ''; location.hash = '#lestvica=' + z; }, zOf(a7.link)); await pb.waitForTimeout(500);
  const w1 = await pb.evaluate(() => ({ screen: window.__game.screen, hash: location.hash, toast: document.getElementById('toast').textContent }));
  await pb.evaluate(() => { const g = window.__game; g.pause(); for (let k = 0; k < 200 && g.screen !== 'results'; k++) { g.sim(1, true); if (g.race.player.finished) break; } g.resume(); });
  await pb.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 180000 });
  const r1 = await pb.evaluate(() => { const g = window.__game, l = document.getElementById('res-lpt'), b = document.getElementById('res-lp'); return { quali: !!g.race.quali, lap: g.qual && g.qual.lap, line: l.classList.contains('off') ? '' : l.textContent, btn: !b.classList.contains('off') && b.textContent }; });
  const ahead = r1.lap > 40, gap = ((Math.round(r1.lap * 1000) - 40000) / 1000).toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  T.check('Tina\'s qualifying lap on Jezero: the results say the place among the friends (2. od 2, Lisica ... s pred tabo; or 1. od 2, najhitrejši čas); Pošlji prijateljem after the new best',
    r1.quali && r1.lap > 0 && r1.line === (ahead ? `Med prijatelji: 2. od 2 (Lisica ${gap} s pred tabo).` : 'Med prijatelji: 1. od 2 (najhitrejši čas).') && r1.btn === 'Pošlji prijateljem', J(r1));
  await pb.click('#res-lp'); await pb.waitForTimeout(300);
  if ((await lpScreen(pb)).nick) { await pb.fill('#lp-nick', 'Turbo Tina'); await pb.click('#lp-go'); }   // (the test's start-up script wrote the default name again at the load)
  await pb.waitForFunction(() => window.__game.lpLink, null, { timeout: 30000 });
  const b9 = await pb.evaluate(async () => { const g = window.__game, L = await Lestvica.readLink(g.lpLink.split('#lestvica=')[1]); return { link: g.lpLink, screen: g.screen, car: g.race.player.m.id, carName: g.race.player.m.name, t: L.packets[0].t['jezero@cs'] }; });
  T.check('Pošlji prijateljem: the link with the new lap, its day today and the car it was driven in; back on the results',
    b9.screen === 'results' && J(b9.t) === J([Math.round(r1.lap * 1000), day, b9.car]), J(b9));
  await pb.evaluate(() => window.__game.onAction('to-title'));
  await pb.waitForFunction(() => /Nič novega/.test(document.getElementById('toast').textContent), null, { timeout: 30000 }).catch(() => null);
  const w2 = await pb.evaluate(() => ({ screen: window.__game.screen, toast: document.getElementById('toast').textContent }));
  T.check('Lisica\'s link opened in Tina\'s tab during the lap: the race goes on (the address cleared, no word); at the menus after it, "Nič novega od Lisica."',
    w1.screen === 'none' && !w1.hash && !w1.toast && w2.toast === 'Nič novega od Lisica.', J({ w1, w2 }));
  await pb.evaluate(() => { document.getElementById('toast').textContent = ''; });
  await pa.goto(b9.link); await pa.waitForFunction(() => window.__game && window.__game.screen === 'lp', null, { timeout: 120000 });
  await pa.evaluate(() => { window.__game.S.track = 'jezero'; window.__game.onAction('to-board'); }); await pa.waitForTimeout(400);
  const bj = await pa.evaluate(() => [...document.querySelectorAll('#board-body .lp-box tbody tr')].map(r => [...r.children].map(c => c.textContent)));
  const tina = bj.find(r => r[1] === 'Turbo Tina') || [];
  T.check('Lisica\'s Leaderboard by Jezero: Tina\'s lap with its car and today\'s date', bj.length === 2 && tina[2] === b9.carName && /^\d{1,2}\. \d{1,2}\. \d{4}$/.test(tina[5] || ''), J(bj));

  // 5. Lisica's profile file: the key and the friends with it
  await pa.evaluate(() => window.__game.onAction('to-title'));
  const [pd] = await Promise.all([pa.waitForEvent('download'), pa.evaluate(() => window.__game.onAction('prof-export'))]);
  const pf = JSON.parse(await readFile(await pd.path(), 'utf8')), a10 = await pa.evaluate(() => ({ me: localStorage.getItem('tdgp-lp-me'), lp: localStorage.getItem('tdgp-lp') }));
  const k10 = await pa.evaluate(async () => (await Lestvica.me(false)).id);
  T.check('5. the profile file carries the leaderboard: the key (another phone with it is the same friend) and the friends\' times',
    pf.kind === 'profile' && !!a10.me && pf.data['tdgp-lp-me'] === a10.me && pf.data['tdgp-lp'] === a10.lp && k10 === aId && /Turbo Tina/.test(a10.lp || ''), J({ keys: Object.keys(pf.data || {}).filter(k => /^tdgp-lp/.test(k)), k10 }));

  const errs = [...A.errors, ...B.errors];
  T.check('no errors in the pages', !errs.length, errs.slice(0, 4).join(' | '));
} catch (e) { T.check('the test ran to its end', false, e && e.stack ? e.stack.split('\n').slice(0, 8).join(' | ') : String(e)); }
await browser.close(); await srv.close();
T.done();
