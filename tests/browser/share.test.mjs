// The achievements and the statistics, a ghost shared with a friend, the profile moved to another phone. A race at Jezero Ring on
// autopilot: the numbers counted (a race, km, time, the track), the first achievement on the results and on the Dosežki screen (with the
// counting ones' progress). Its flying lap's ghost shared from the leaderboard as a link (a #duh=... address, deflated) and as a file; a
// second phone (a fresh profile) opens the link: the friend's ghost kept for the track, the track chosen, and in a race there it drives
// orange with the friend's name over it on the flying laps; brought in from the file too. The profile exported to a file and imported on
// the second phone (asked first): after the game starts again it has the first one's records, stats, career and ghost.
//   node tests/browser/share.test.mjs
import fs from 'node:fs';
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('share');
const srv = await serve();
const browser = await launch();
try {
  const A = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'jezero', name: 'Ana' }, { width: 390, height: 844 });
  const pa = A.page;
  await pa.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: srv.base });

  // 1. a race to the line: the numbers, the first achievement
  await startTrack(pa, 'jezero');
  await pa.evaluate(() => { const g = window.__game; g.pause(); for (let k = 0; k < 300 && g.phase !== 'done'; k++) g.sim(2, true); if (g.phase !== 'done') g.resume(); });
  await pa.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 180000 });
  const s1 = await pa.evaluate(() => ({ st: window.__game.stats, sub: document.getElementById('res-sub').textContent }));
  T.check('a race counted: 1 race, the km (a 5.3 km race), the time, the track; "Prvi cilj" unlocked, on the results', s1.st.races === 1 && s1.st.km > 4.5 && s1.st.km < 8 && s1.st.time > 60 && s1.st.tracks.jezero === 1 && s1.st.ach.first > 0 && /Novi dosežki: .*Prvi cilj/.test(s1.sub),
    JSON.stringify({ races: s1.st.races, km: s1.st.km, time: s1.st.time, ach: Object.keys(s1.st.ach), sub: s1.sub }));
  await pa.evaluate(() => { window.__game.onAction('to-title'); window.__game.onAction('to-stats'); });
  await pa.waitForTimeout(300);
  const s2 = await pa.evaluate(() => ({ cells: [...document.querySelectorAll('.st-cell')].map(c => c.innerText.replace(/\s+/g, ' ')), got: [...document.querySelectorAll('.ach.got b')].map(b => b.textContent), all: document.querySelectorAll('.ach').length,
    cards: Core.TRACKS.filter(d => !d.variantOf).length,   // (the tracks on the list: the variants on their cards)
    km100: [...document.querySelectorAll('.ach')].find(a => /100 kilometrov/.test(a.innerText)).innerText }));
  T.check(`Dosežki: the numbers (Dirke 1, Proge 1/${s2.cards} ...), every achievement, the unlocked ones gold, the counting ones how far`, s2.cells.some(c => /^1 Dirke$/.test(c)) && s2.cells.includes(`1/${s2.cards} Proge`) && s2.got.includes('Prvi cilj') && s2.all >= 25 && /\(\d+,\d\/100\)/.test(s2.km100), JSON.stringify(s2));

  // 2. the ghost of the flying lap shared: a link and a file
  await pa.evaluate(() => { const g = window.__game; g.onAction('to-title'); g.onAction('to-board'); });
  await pa.waitForTimeout(300);
  const b1 = await pa.evaluate(() => ({ box: document.querySelector('.gh-box').innerText.replace(/\s+/g, ' '), acts: [...document.querySelectorAll('.gh-box [data-act]')].map(b => b.dataset.act) }));
  await pa.evaluate(() => window.__game.onAction('gh-link')); await pa.waitForTimeout(800);
  const link = await pa.evaluate(() => window.__game.ghostLink), clip = await pa.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  T.check('the leaderboard: the player\'s ghost (a flying lap) to share (a link, a file, a challenge); the link (#duh=..., under 16 000 characters) copied', /Tvoj duh: \d\d:\d\d\.\d{3} \(leteči krog\)/.test(b1.box) && b1.acts.join() === 'gh-link,gh-file,gh-chal,gh-import' && /#duh=[\w-]{200,}$/.test(link || '') && link.length < 16000 && clip === link,
    JSON.stringify({ b1, len: link && link.length }));
  const [dl] = await Promise.all([pa.waitForEvent('download'), pa.evaluate(() => window.__game.onAction('gh-file'))]);
  const gpath = await dl.path(), gfile = JSON.parse(fs.readFileSync(gpath, 'utf8'));
  T.check('the ghost as a file (duh-jezero-....json: a ghost of the game, its track, the name)', /^duh-jezero-/.test(dl.suggestedFilename()) && gfile.kind === 'ghost' && gfile.track === 'jezero' && gfile.name === 'Ana' && gfile.ghost && gfile.ghost.lap === 1, dl.suggestedFilename());

  // 3. the profile to a file
  await pa.evaluate(() => window.__game.onAction('to-title'));
  const [pd] = await Promise.all([pa.waitForEvent('download'), pa.evaluate(() => window.__game.onAction('prof-export'))]);
  const ppath = await pd.path(), prof = JSON.parse(fs.readFileSync(ppath, 'utf8'));
  T.check('the profile as a file: every saved thing (settings, records, stats, the ghost)', /^apex-racing-profil-\d{8}\.json$/.test(pd.suggestedFilename()) && prof.kind === 'profile' && ['tdgp-settings', 'tdgp-records', 'tdgp-stats', 'tdgp-ghost-jezero@cs'].every(k => typeof prof.data[k] === 'string') && !prof.data['tdgp-noadapt'],
    JSON.stringify(Object.keys(prof.data || {})));

  // 4. a second phone opens the link: the friend's ghost in a race at Jezero Ring
  const B = await openGame(browser, srv.base + '/index.html' + link.slice(link.indexOf('#')), { quality: 'normal', shadows: 0, camera: 'chase', track: 'riviera' }, { width: 390, height: 844 });
  const pb = B.page;
  await pb.waitForFunction(() => !!localStorage.getItem('tdgp-fghost-jezero'), null, { timeout: 20000 });
  const g1 = await pb.evaluate(() => ({ track: window.__game.S.track, hash: location.hash, toast: document.getElementById('toast').textContent, stored: JSON.parse(localStorage.getItem('tdgp-fghost-jezero')) }));
  T.check('the link opened: the friend\'s ghost kept for Jezero Ring, the track chosen, a message; the address cleaned', g1.track === 'jezero' && g1.hash === '' && /Duh igralca Ana na progi Jezero Ring/.test(g1.toast) && g1.stored.name === 'Ana' && g1.stored.ghost.lap === 1, JSON.stringify({ track: g1.track, hash: g1.hash, toast: g1.toast }));
  await startTrack(pb, 'jezero');
  const seen = await pb.evaluate(async () => { const g = window.__game, out = []; g.pause();
    for (let k = 0; k < 90; k++) { g.sim(1, true); g.resume(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); g.pause(); const f = Render.ghostF; out.push({ lap: g.race.player.lap, vis: !!(f && f.visible), tag: f && f.tag }); if (out.filter(o => o.vis).length > 5) break; }
    return { gf: g.ghostF, vis: out.filter(o => o.vis).length, lap1: out.filter(o => o.lap === 1 && o.vis).length, tag: (out.find(o => o.tag) || {}).tag }; });
  T.check('in the race: the friend\'s ghost drives on the flying laps (from lap 2), orange with "Ana" and the lap time over it', seen.gf && seen.gf.name === 'Ana' && seen.gf.lap && seen.vis > 3 && seen.lap1 === 0 && /^Ana \d:\d\d\.\d{3}$/.test(seen.tag || ''), JSON.stringify(seen));
  await pb.evaluate(() => { const g = window.__game; g.resume(); g.onAction('to-title'); });

  // 5. from the file too (the friend's ghost deleted first)
  await pb.evaluate(() => { localStorage.removeItem('tdgp-fghost-jezero'); window.__game.onAction('to-board'); });
  await pb.waitForTimeout(300);
  const [fc] = await Promise.all([pb.waitForEvent('filechooser'), pb.evaluate(() => window.__game.onAction('gh-import'))]);
  await fc.setFiles(gpath); await pb.waitForTimeout(600);
  const g2 = await pb.evaluate(() => ({ stored: !!localStorage.getItem('tdgp-fghost-jezero'), box: document.querySelector('.gh-box').innerText.replace(/\s+/g, ' ') }));
  T.check('a ghost from a file: kept, shown on the leaderboard (Duh prijatelja: Ana)', g2.stored && /Duh prijatelja: Ana · \d\d:\d\d\.\d{3}/.test(g2.box), JSON.stringify(g2));

  // 6. the profile imported on the second phone (asked first): the first one's saved game after the restart
  pb.on('dialog', (d) => d.accept());
  await pb.evaluate(() => window.__game.onAction('to-title'));
  const [pc] = await Promise.all([pb.waitForEvent('filechooser'), pb.evaluate(() => window.__game.onAction('prof-import'))]);
  await Promise.all([pb.waitForNavigation({ timeout: 60000 }), pc.setFiles(ppath)]);
  await pb.waitForFunction(() => window.__game, null, { timeout: 180000 });
  const p2 = await pb.evaluate(() => ({ name: window.__game.S.name, races: window.__game.stats.races, ach: Object.keys(window.__game.stats.ach), rec: JSON.parse(localStorage.getItem('tdgp-records')).tracks['jezero@cs'], ghost: !!localStorage.getItem('tdgp-ghost-jezero@cs'), friend: !!localStorage.getItem('tdgp-fghost-jezero') }));
  // (the test's own start-up script writes the settings again at every load, so the name is not compared)
  T.check('the profile imported: the stats, the records and the ghost of the first phone (the second\'s own things replaced)', p2.races === 1 && p2.ach.includes('first') && p2.rec && p2.rec.bestLap > 0 && p2.ghost && !p2.friend, JSON.stringify(p2));

  T.check('no page errors', A.errors.length === 0 && B.errors.length === 0, A.errors.concat(B.errors).slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
