// Vnos in the browser (Svetovna lestvica, seja 1: ponovljivost; docs/svetovna-lestvica.md, »Ponovljivost med brskalniki«): the game records a
// run's input (js/vnos.js; js/game.js newRace) in a run alone and in the test mode, never in a race with rivals; the record rides in the
// recording's file (Shrani posnetek, .rrp: its header's vnos) and replays in Node (tools/lestvica-preveri.mjs) by the rule: the finish in the
// same step (1/120 s), the path within 0.5 m (the browser's V8 and Node's differ in the last bit of Math.sin, exp …, so not every bit), and in
// the same browser to the last bit. Spa, Belgija: qualifying alone to the line (the autopilot's calls, the player's own throttle between
// them); the test mode with its rivals for 20 s; a race with rivals (no record). The Node side alone: tests/vnos.test.js.
//   node tests/browser/vnos.test.mjs
import zlib from 'node:zlib';
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';
import { koda, preveri } from '../../tools/lestvica-preveri.mjs';
import { napake } from '../../tools/voznja.mjs';

const T = checker('vnos');
const srv = await serve();
const browser = await launch();
const K = koda(), N = napake();
// the race's record (a summary) and the recording's file as the game writes it (Shrani posnetek), its bytes as base64
const sum = (page) => page.evaluate(() => { const g = window.__game, R = typeof Vnos !== 'undefined' && Vnos.out(g.race);
  return { phase: g.phase, repro: !!g.race.opts.repro, ft: g.race.player && g.race.player.finishTime, rec: R ? { ok: R.ok, why: R.why, n: R.n, fs: R.fs, kind: R.kind, eng: R.eng, w: R.w, track: R.track, names: ((nm) => !!nm && JSON.stringify(R).includes(JSON.stringify('s' + nm)))(g.race.player && g.race.player.name), name: g.race.player && typeof g.race.player.name } : null }; });
const rrp = (page) => page.evaluate(async () => { const f = await Napake.rrp.pisi(); if (!f) return null; const u = new Uint8Array(await f.blob.arrayBuffer()); let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return { name: f.name, b64: btoa(s) }; });
const self = (page) => page.evaluate(() => { const r = Vnos.replay(Core, JSON.parse(JSON.stringify(Vnos.out(window.__game.race)))); return { ok: r.ok, why: r.why, n: r.n, fs: r.fs, dft: r.dft, maxD: r.maxD, exact: r.exact }; });
const fromFile = (f) => { let u = new Uint8Array(Buffer.from(f.b64, 'base64')); if (u[0] === 0x1f && u[1] === 0x8b) u = new Uint8Array(zlib.gunzipSync(u)); return N.rrp.unpack(u).H; };
const res = (r) => r && JSON.stringify({ ok: r.ok, why: r.why, fs: r.fs, dft: r.dft, maxD: r.maxD, exact: r.exact });
const errs = [];
try {
  { // qualifying alone, to the line
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quali: 1, track: 'spa', damage: 2 }, { width: 640, height: 360 });
    await startTrack(page, 'spa');
    await page.evaluate(() => { const g = window.__game; g.pause(); let k = 0;
      for (let i = 0; i < 400 && g.phase !== 'done'; i++) g.drive(1, (P) => { k++; return { thr: k % 400 < 30 ? 0.5 : P.inThr, brk: P.inBrk }; }); });
    const s = await sum(page), f = await rrp(page), me = await self(page);
    const H = f && fromFile(f), rec = H && H.vnos, r = rec ? preveri(rec, K) : null;
    T.check('qualifying alone on Spa, to the line: the race repeatable, its input recorded (kind quali, engine V8, complete, the finish\'s step)', s.phase === 'done' && s.repro && s.rec && s.rec.ok && s.rec.kind === 'quali' && /^V8/.test(s.rec.eng) && s.rec.track === 'spa' && s.rec.fs > 12000 && !s.rec.names, JSON.stringify(s));
    T.check('… the record in the recording\'s file (Shrani posnetek, .rrp: its header\'s vnos), the same as the race\'s', !!rec && rec.fs === s.rec.fs && rec.n === s.rec.n && /^posnetek_spa_/.test(f.name), f ? f.name : 'no file');
    T.check('… replayed in Node from the file: OK (the finish in the same step, the time to the step, the path within 0.5 m)', r && r.ok && r.res.fs === s.rec.fs && Math.abs(r.res.dft) < 1 / 120 && r.res.maxD <= 0.5, r && (r.why || '') + ' ' + res(r.res));
    T.check('… replayed in the same browser: to the last bit', me.ok && me.exact && me.fs === s.rec.fs, res(me));
    errs.push(...errors); await ctx.close();
  }
  { // the test mode: its rivals, the autopilot, 20 s
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?proga=spa&seme=7&t=20', { damage: 2 }, { width: 640, height: 360 }, { seed: 101 });
    await page.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000 });
    const s = await sum(page), me = await self(page), rec = await page.evaluate(() => JSON.parse(JSON.stringify(Vnos.out(window.__game.race)))), r = preveri(rec, K);
    const nc = await page.evaluate(() => window.__game.race.cars.length);
    T.check('the test mode (?seme=7, its rivals, the autopilot, 20 s): recorded, replayed in the same browser to the last bit', s.repro && s.rec && s.rec.ok && nc > 5 && s.rec.n >= 2400 && me.ok && me.exact, JSON.stringify({ nc, n: s.rec && s.rec.n }) + ' ' + res(me));
    T.check('… replayed in Node: OK (no finish in 20 s, the path within 0.5 m every 0.5 s)', r.ok && r.res.fs == null && r.res.maxD <= 0.5, (r.why || '') + ' ' + res(r.res));
    errs.push(...errors); await ctx.close();
  }
  { // a race with rivals: none (not repeatable, nothing recorded)
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { track: 'spa' }, { width: 640, height: 360 });
    await startTrack(page, 'spa');
    await page.evaluate(() => window.__game.sim(3, true));
    const s = await sum(page), nc = await page.evaluate(() => window.__game.race.cars.length);
    T.check('a race with rivals: not repeatable, no record', nc > 1 && !s.repro && !s.rec, JSON.stringify({ nc, repro: s.repro, rec: s.rec }));
    errs.push(...errors); await ctx.close();
  }
  T.check('no errors on the pages', !errs.length, errs.slice(0, 3).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
