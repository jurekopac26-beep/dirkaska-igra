// The tyre marks of the last time trial runs (Rio do Rastro, a time trial): a run on autopilot that slides through the hairpins and is
// steered onto the grass once lays its marks, the rolling ruts off the road among them; at the finish they are stored (IndexedDB, packed:
// a few kB) and the next run on the track draws them under its own in one mesh; a race on the same road draws none and logs none; after
// eleven runs the track keeps the newest ten; a reload of the page keeps them.
//   node tests/browser/marks.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('marks');
const srv = await serve();
const browser = await launch();
// one run of the time trial from the start (paused, stepped here): the autopilot drives; at offAt s into the run it is steered hard right
// for 0.7 s (off the road onto the grass); the marks are laid by the frames drawn every 1/60 s for the first `drawn` s (the scene itself
// not drawn), the rest of the run only stepped
const run = (page, offAt, drawn) => page.evaluate(([offAt, drawn]) => {
  const g = window.__game; g.onAction('restart'); g.pause();
  const P = g.race.player, STEP = 1 / 120; let k = 0, laid = 0, prev = Render.skidCount;
  const old = Render.oldMarks;   // (drawn at the start: the stored runs come asynchronously, read again below)
  while (g.race.state !== 'racing' && k++ < 6000) g.sim(STEP, true);
  Render.scene.visible = false;
  for (k = 0; !P.finished && k < 120 * 60 * 6; k++) {
    const t = g.race.time;
    if (t > offAt && t < offAt + 0.7) g.sim(STEP, false, 1, 0.6, 0); else g.sim(STEP, true);
    if (t < drawn && k % 2) { Render.frame(1 / 60, 1, P, 'chase', {}); const c = Render.skidCount; laid += (c - prev + 8000) % 8000; prev = c; }
  }
  for (k = 0; k < 120; k++) g.sim(STEP, true);   // (past the line: the finish is taken on the next step, the run stored)
  Render.scene.visible = true;
  return { finished: P.finished, time: g.race.time, laid, old };
}, [offAt, drawn]);
const stored = (page) => page.evaluate(() => window.__game.marksOf('rastro'));   // (the stored runs: the list as it is once the writes before it are done)
// a packed run: [u32 chains] per chain [i32 x, z, y, u8 r, g, b, width, flags, u16 n] n x [i16 dx, dz, dy, u8 a0, a1]
function chains(a) {
  const b = Buffer.from(a), N = b.readUInt32LE(0); let o = 4, off = 0, on = 0, quads = 0, ok = true;
  for (let c = 0; c < N; c++) { if (o + 19 > b.length) { ok = false; break; } const f = b[o + 16], n = b.readUInt16LE(o + 17); quads += n; if (f & 1) off++; else on++; o += 19 + n * 8; }
  return { N, off, on, quads, ok: ok && o === b.length };
}
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'rastro', mode: 'tt', ghost: 0 }, { width: 480, height: 270 }, { seed: 7 });
  await startTrack(page, 'rastro');
  const r1 = await run(page, 40, 400);
  const s1 = await stored(page), c1 = s1.length ? chains(s1[0]) : null;
  T.check('a run of the time trial lays its marks and finishes', r1.finished && r1.laid > 300 && r1.old === 0, JSON.stringify(r1));
  T.check('at the finish its marks are stored with the track: packed, a few kB, the slides on the asphalt and the ruts off the road', s1.length === 1 && c1 && c1.ok && c1.on > 20 && c1.off > 0 && s1[0].length > 2000 && s1[0].length < 60000,
    JSON.stringify({ runs: s1.length, bytes: s1[0] && s1[0].length, c1 }));
  // the next run: the stored one drawn, its quads all
  await page.evaluate(() => { const g = window.__game; g.onAction('restart'); g.pause(); });
  const q2 = await page.waitForFunction(() => Render.oldMarks > 0 && Render.oldMarks, null, { timeout: 10000 }).then(h => h.jsonValue()).catch(() => 0);
  T.check('the next time trial on the track draws the stored run under its own (one mesh)', q2 === c1.quads, `${q2} quads, stored ${c1 && c1.quads}`);
  // a race on the same road: none drawn, none logged
  const race = await page.evaluate(async () => {
    const g = window.__game; g.S.mode = 'race'; g.onAction('restart'); g.pause(); await new Promise(r => setTimeout(r, 300));
    const P = g.race.player; for (let k = 0; k < 120 * 20; k++) { g.sim(1 / 120, true); if (k % 2) Render.frame(1 / 60, 1, P, 'chase', {}); }
    const o = { tt: g.race.timeTrial, old: Render.oldMarks, take: !!Render.marksTake() }; g.S.mode = 'tt'; return o;
  });
  T.check('a race on the same road draws no stored marks and logs none', !race.tt && race.old === 0 && !race.take, JSON.stringify(race));
  // ten more runs (their marks from the first 25 s): the newest ten kept, the newest first
  const sizes = [];
  for (let i = 0; i < 10; i++) { const r = await run(page, 1e9, 25); sizes.push(r.finished ? r.laid : -1); }
  const s11 = await stored(page);
  T.check('after eleven runs the track keeps the newest ten, the newest first', s11.length === 10 && sizes.every(n => n > 0) && Buffer.compare(Buffer.from(s11[9]), Buffer.from(s1[0])) !== 0 && s11.every(a => chains(a).ok),
    JSON.stringify({ kept: s11.length, sizes, bytes: s11.map(a => a.length) }));
  // a reload: kept in the browser
  await page.reload({ timeout: 180000, waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.__game, null, { timeout: 180000 });
  await startTrack(page, 'rastro');
  const q3 = await page.waitForFunction(() => Render.oldMarks > 0 && Render.oldMarks, null, { timeout: 10000 }).then(h => h.jsonValue()).catch(() => 0);
  const want = s11.reduce((a, u) => a + chains(u).quads, 0);
  T.check('after a reload the time trial draws the ten stored runs', q3 === want, `${q3} quads, stored ${want}`);
  T.check('no errors', errors.length === 0, errors.slice(0, 3).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
