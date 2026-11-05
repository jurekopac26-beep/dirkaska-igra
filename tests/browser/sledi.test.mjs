// The tyre marks of every run and of a friend's (js/game.js mkFlush, mkShare, mkFriendPut; js/render.js setOldMarks with a friend's
// runs). Rio do Rastro, a time trial: a run left with Ponovi after 20 s keeps its marks, so does one left for the menu and one to the
// finish (three runs, the newest first); Ponovi at once on the grid (no mark laid) adds nothing. The ghost as a file takes the three
// runs' marks along (base64, as stored); as a link as many as fit (16 000 characters). A second phone imports the file: the friend's
// marks kept for the track (three), and its time trial there draws them with its own none (one mesh: all their quads); Izbriši
// prijateljevega removes them with the ghost. A challenge's link carries the marks it has room for, and opened on the second phone they
// are kept (as many as came, the challenge's card says how many).
//   node tests/browser/sledi.test.mjs
import zlib from 'node:zlib';
import fs from 'node:fs';
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('sledi');
const srv = await serve();
const browser = await launch();
// drive the time trial on autopilot for sec s of race time (to the finish with sec Infinity); the frames drawn every 1/60 s lay the marks
// (the scene itself not drawn) for the first `drawn` s
const drive = (page, sec, drawn = 25) => page.evaluate(([sec, drawn]) => {
  const g = window.__game; g.pause(); const P = g.race.player, STEP = 1 / 120; let k = 0;
  while (g.race.state !== 'racing' && k++ < 6000) g.sim(STEP, true);
  Render.scene.visible = false;
  for (k = 0; g.race.time < sec && !P.finished && k < 120 * 60 * 6; k++) { g.sim(STEP, true); if (g.race.time < drawn && k % 2) Render.frame(1 / 60, 1, P, 'chase', {}); }
  if (P.finished) for (k = 0; k < 120; k++) g.sim(STEP, true);   // (past the line: the finish taken on the next step)
  Render.scene.visible = true;
  return { t: g.race.time, fin: P.finished };
}, [sec, drawn]);
const settle = (page) => page.waitForTimeout(1500);   // (a run's marks packed once the page is idle, then stored)
const stored = (page) => page.evaluate(() => window.__game.marksOf('rastro'));
const friends = (page) => page.evaluate(() => window.__game.marksFriendOf('rastro'));
// a packed run's quads: [u32 chains] per chain [i32 x, z, y, u8 r, g, b, width, flags, u16 n] n x [i16 dx, dz, dy, u8 a0, a1]
const quads = (a) => { const b = Buffer.from(a), N = b.readUInt32LE(0); let o = 4, q = 0; for (let c = 0; c < N && o + 19 <= b.length; c++) { const n = b.readUInt16LE(o + 17); q += n; o += 19 + n * 8; } return q; };
const unlink = (link, tag) => JSON.parse(zlib.inflateRawSync(Buffer.from(link.slice(link.indexOf('#' + tag + '=') + tag.length + 2).replace(/-/g, '+').replace(/_/g, '/'), 'base64')).toString('utf8'));
try {
  const A = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'rastro', mode: 'tt', name: 'Ana' }, { width: 480, height: 270 }, { seed: 7 });
  const pa = A.page;
  await pa.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: srv.base });
  await startTrack(pa, 'rastro');

  // 1. a run left with Ponovi after 20 s: its marks kept
  const r1 = await drive(pa, 20);
  await pa.evaluate(() => window.__game.onAction('restart')); await settle(pa);
  const s1 = await stored(pa);
  T.check('a run left with Ponovi after 20 s keeps its marks (one run stored)', !r1.fin && r1.t >= 20 && s1.length === 1 && s1[0].length > 100, JSON.stringify({ r1, runs: s1.length, bytes: s1.map(a => a.length) }));

  // 2. a run left for the menu: kept too
  await drive(pa, 15);
  await pa.evaluate(() => window.__game.onAction('to-title')); await settle(pa);
  const s2 = await stored(pa);
  T.check('a run left for the menu keeps its marks (two, the newest first)', s2.length === 2 && Buffer.compare(Buffer.from(s2[1]), Buffer.from(s1[0])) === 0, JSON.stringify({ runs: s2.length }));

  // 3. a run to the finish: kept (three); Ponovi at once on the grid adds nothing
  await startTrack(pa, 'rastro');
  const r3 = await drive(pa, Infinity, 30); await settle(pa);
  const s3 = await stored(pa);
  await pa.evaluate(() => { const g = window.__game; g.onAction('restart'); g.onAction('restart'); }); await settle(pa);
  const s3b = await stored(pa);
  T.check('a run to the finish keeps its marks (three); Ponovi at once on the grid (no mark laid) adds none', r3.fin && s3.length === 3 && s3b.length === 3, JSON.stringify({ r3, runs: s3.length, after: s3b.length }));

  // 4. the ghost shared: the file with the three runs' marks, the link with as many as fit
  const [dl] = await Promise.all([pa.waitForEvent('download'), pa.evaluate(() => window.__game.ghShare('rastro', 'file'))]);
  const fpath = await dl.path(), file = JSON.parse(fs.readFileSync(fpath, 'utf8'));
  const same = Array.isArray(file.marks) && file.marks.length === 3 && file.marks.every((m, i) => Buffer.compare(Buffer.from(m, 'base64'), Buffer.from(s3b[i])) === 0);
  T.check('the ghost as a file: the time, the ghost and the three runs\' marks (base64, the newest first, as stored)', file.kind === 'ghost' && file.track === 'rastro' && !!file.ghost && same, JSON.stringify({ kind: file.kind, marks: file.marks && file.marks.length }));
  await pa.evaluate(() => window.__game.ghShare('rastro', 'link')); await pa.waitForTimeout(400);
  const link = await pa.evaluate(() => window.__game.ghostLink), lo = link ? unlink(link, 'duh') : null;
  T.check('the ghost as a link: under 16 000 characters, the marks as many as fit (or a file when the ghost is too long for one)', !link || (link.length < 16200 && (lo.marks || []).length <= 3), JSON.stringify({ len: link && link.length, marks: lo && (lo.marks || []).length }));

  // 5. a second phone imports the file: the friend's marks kept and drawn in its time trial; Izbriši prijateljevega removes them
  const B = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'rastro', mode: 'tt' }, { width: 480, height: 270 });
  const pb = B.page;
  await pb.evaluate(() => { const g = window.__game; g.onAction('to-title'); g.onAction('to-board'); }); await pb.waitForTimeout(300);
  const [fc] = await Promise.all([pb.waitForEvent('filechooser'), pb.evaluate(() => window.__game.onAction('gh-import'))]);
  await fc.setFiles(fpath); await pb.waitForTimeout(800);
  const f1 = await friends(pb);
  T.check('imported: the friend\'s ghost and the three runs\' marks kept for the track', f1.length === 3 && !!(await pb.evaluate(() => localStorage.getItem('tdgp-fghost-rastro'))), JSON.stringify({ runs: f1.length }));
  await startTrack(pb, 'rastro');
  const want = f1.reduce((a, u) => a + quads(u), 0);
  const q1 = await pb.waitForFunction(() => Render.oldMarks > 0 && Render.oldMarks, null, { timeout: 15000 }).then(h => h.jsonValue()).catch(() => 0);   // (Render.oldMarks: the quads drawn, a getter)
  T.check('its time trial there draws the friend\'s marks (its own none): all their quads, one mesh', q1 === Math.min(want, 30000), `${q1} quads, the friend's ${want}`);
  await pb.evaluate(() => { const g = window.__game; g.onAction('to-title'); g.onAction('to-board'); }); await pb.waitForTimeout(300);
  await pb.evaluate(() => window.__game.onAction('gh-del')); await pb.waitForTimeout(500);
  const f2 = await friends(pb);
  T.check('Izbriši prijateljevega: the ghost and the friend\'s marks removed', f2.length === 0 && !(await pb.evaluate(() => localStorage.getItem('tdgp-fghost-rastro'))), JSON.stringify({ runs: f2.length }));

  // 6. a challenge's link with the marks it has room for; opened on the second phone they are kept, its card says how many
  await pa.evaluate(() => { const g = window.__game; g.onAction('to-title'); g.onAction('to-board'); }); await pa.waitForTimeout(300);
  await pa.evaluate(() => window.__game.onAction('gh-chal')); await pa.waitForTimeout(800);
  const clink = await pa.evaluate(() => window.__game.chalLink), co = clink ? unlink(clink, 'izziv') : null, nm = co && Array.isArray(co.marks) ? co.marks.length : 0;
  T.check('the challenge\'s link: under 16 000 characters, the time and the marks as many as fit (the ghost when it fits too)', !!clink && clink.length < 16200 && co.kind === 'challenge' && nm >= 1 && nm <= 3, JSON.stringify({ len: clink && clink.length, marks: nm, ghost: !!(co && co.ghost) }));
  await pb.goto(srv.base + '/index.html' + clink.slice(clink.indexOf('#'))); await pb.reload();   // (loaded again: the same page with only another # would not start the game again)
  await pb.waitForFunction(() => window.__game && window.__game.screen === 'chal', null, { timeout: 180000 });
  await pb.waitForTimeout(500);
  const f3 = await friends(pb), card = await pb.evaluate(() => document.getElementById('chal-card').innerText.replace(/\s+/g, ' '));
  T.check('opened on the second phone: the challenge\'s marks kept for the track, its card says how many (Sledi gum)', f3.length === nm && new RegExp('Sledi gum zadnjih voženj: ' + nm).test(card), JSON.stringify({ runs: f3.length, card }));

  T.check('no page errors', A.errors.length === 0 && B.errors.length === 0, A.errors.concat(B.errors).slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
