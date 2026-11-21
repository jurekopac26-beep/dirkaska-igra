// Najboljše vožnje in the game (docs/najboljse-voznje.md, js/najboljse.js): a time trial up Bâlea (a real track) driven by the autopilot over
// the finish is kept among the best runs: the game's own recording of the race, checked as tools/voznja.mjs checks a run. Nastavitve →
// Najboljše vožnje lists it (the track, its weather and driving physics, the runs: place, time, car, date) on a phone's screen held flat
// (640 × 360) and upright (360 × 640), nothing out of the screen, in Slovenian and in English. Deli 10 najboljših gives one file in the
// downloads, najboljse_balea_<date>.rrp, its runs one after another, and tools/voznja.mjs measures each of them (<file> #1, #2).
//   node tests/browser/najboljse.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { serve, launch, openGame, startTrack, driveToResults, checker, REPO } from './lib.mjs';

const T = checker('najboljse');
const srv = await serve();
const browser = await launch();
const OUT = path.join(REPO, 'test-results', 'najboljse'); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
try {
  const { page: Q, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase' }, { width: 640, height: 360 }, { context: { acceptDownloads: true }, seed: 7 });

  // 1. a time trial up Bâlea on the autopilot, over the finish: kept (the game's recording, checked; its time the race's)
  await startTrack(Q, 'balea', 'tt');
  await driveToResults(Q);
  const run = await Q.evaluate(async () => {
    await Najboljse.cakaj();
    const g = window.__game, P = g.race.player, def = g.race.track.def, l = await Najboljse.vse();
    return { ft: P.finishTime, tt: !!g.race.timeTrial, rid: def.recId || def.id, v: Najboljse.test.zadnja(),
      l: l.map((o) => ({ proga: o.proga, rid: o.rid, vreme: o.vreme, fiz: o.fiz, cas: o.cas, avto: o.avto, bytes: o.bytes, size: o.blob.size })) };
  });
  const o = run.l[0];
  T.check('vožnja na čas po Bâlei z avtopilotom do cilja je med najboljšimi (veljavna, kot jo meri orodje)',
    run.tt && run.l.length === 1 && o.proga === 'balea' && o.rid === run.rid && o.vreme === 'suho' && /^(cs|nova)$/.test(o.fiz) && o.cas === run.ft && !!o.avto && o.bytes === o.size && o.size > 1000,
    'čas ' + (run.ft || 0).toFixed(2) + ' s · preverjeno: ' + JSON.stringify(run.v) + ' · shranjeno: ' + JSON.stringify(run.l));

  // a second run of the same recording a little slower, as the next run kept would be: two places in the list, two runs in the file
  await Q.evaluate(async () => { const [o] = await Najboljse.vse(); if (o) await Najboljse.test.put(Object.assign({}, o, { id: o.id + '-2', cas: o.cas + 0.5, date: o.date + 1 })); });

  // 2. Nastavitve → Najboljše vožnje: the list, nothing out of the screen (no box from the list up to the page scrolls or cuts sideways; a
  // button's slant, skewX, may stand a hair out of the list's box, as Samodejne kopije's Obnovi does)
  const lay = () => Q.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms)), g = window.__game, d = document.getElementById('set-najboljse');
    if (g.screen !== 'settings') g.onAction('to-settings');
    d.open = false; await wait(60); document.getElementById('nv-list').innerHTML = ''; d.open = true;
    for (let k = 0; k < 60 && !document.querySelector('#nv-list [data-nv-deli]'); k++) await wait(100);
    d.scrollIntoView({ block: 'end' }); await wait(100);
    const W = innerWidth, b = document.querySelector('#nv-list [data-nv-deli]'), rows = [...document.querySelectorAll('#nv-list .nv-row .rlbl')].filter((e) => e.textContent);
    const wide = []; for (let e = document.getElementById('nv-list'); e && e !== document.documentElement; e = e.parentElement) if (getComputedStyle(e).overflowX !== 'visible' && e.scrollWidth > e.clientWidth + 1) wide.push((e.id || e.className || e.tagName) + ' ' + e.scrollWidth + '>' + e.clientWidth);
    const out = [...d.querySelectorAll('*')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.left < -0.5 || r.right > W + 0.5); }).map((e) => e.className || e.tagName);
    const br = b ? b.getBoundingClientRect() : null;
    return { W, H: innerHeight, screen: g.screen, sub: [...document.querySelectorAll('#nv-list .set-sub')].map((e) => e.textContent), note: [...document.querySelectorAll('#nv-list .set-note')].map((e) => e.textContent),
      rows: rows.map((e) => e.textContent), btn: b ? b.textContent : null, btnIn: !!br && br.width > 0 && br.left >= 0 && br.right <= W && br.top >= 0 && br.bottom <= innerHeight,
      wide, out: out.slice(0, 5), page: document.documentElement.scrollWidth <= W };
  });
  for (const [w, h] of [[640, 360], [360, 640]]) {
    await Q.setViewportSize({ width: w, height: h }); await Q.waitForTimeout(300);
    const L = await lay();
    T.check(`seznam v Nastavitvah ${w} × ${h}: proga, vreme in fizika, 2 vožnji, gumb Deli 10 najboljših; nič zunaj zaslona`,
      L.screen === 'settings' && L.sub.length === 1 && L.sub[0].indexOf('Bâlea') >= 0 && L.note.length === 1 && /^Suho · Fizika vožnje: (Klasična|Nova)$/.test(L.note[0]) &&
      L.rows.length === 2 && /^1\. .+ · .+ · .+$/.test(L.rows[0]) && /^2\. /.test(L.rows[1]) && L.btn === 'Deli 10 najboljših' && L.btnIn && !L.wide.length && !L.out.length && L.page,
      JSON.stringify({ sub: L.sub, note: L.note, rows: L.rows, btn: L.btn, btnIn: L.btnIn, wide: L.wide, out: L.out, page: L.page }));
  }
  await Q.setViewportSize({ width: 640, height: 360 }); await Q.waitForTimeout(300);

  // 3. Deli 10 najboljših: one file in the downloads, the runs one after another; tools/voznja.mjs measures each
  await lay();
  const dl0 = Q.waitForEvent('download', { timeout: 60000 });
  await Q.click('#nv-list [data-nv-deli="balea"]');
  const dl = await dl0, name = dl.suggestedFilename(), file = path.join(OUT, name);
  await dl.saveAs(file);
  const last = await Q.evaluate(() => window.__game.lastNajboljse);
  T.check('Deli 10 najboljših: datoteka najboljse_balea_<datum>.rrp v Prenosih, 2 vožnji', /^najboljse_balea_\d{8}-\d{4}\.rrp$/.test(name) && !!last && last.name === name && last.n === 2 && fs.statSync(file).size === last.bytes,
    name + ' · ' + JSON.stringify(last));
  const prof = path.join(OUT, 'profil.json');
  const res = await new Promise((r) => execFile(process.execPath, [path.join(REPO, 'tools', 'voznja.mjs'), file, '--out', prof], { cwd: REPO, timeout: 600000 }, (err, so, se) => r({ code: err ? err.code || 1 : 0, out: String(so) + String(se) })));
  let P = null; try { P = JSON.parse(fs.readFileSync(prof, 'utf8')); } catch (_) { /* no profile */ }
  const used = P ? P.proge.flatMap((p) => p.krogi.uporabljeni) : [], skip = P ? P.proge.flatMap((p) => p.krogi.izpusceni) : [];
  T.check('tools/voznja.mjs izmeri obe vožnji datoteke (<datoteka> #1, #2), nobena izpuščena',
    res.code === 0 && !!P && JSON.stringify(P.datoteke) === JSON.stringify([name + ' #1', name + ' #2']) && used.length === 2 && !skip.length && used.every((u) => Math.abs(u.cas - run.ft) < 0.001),
    'izhod ' + res.code + (P ? ' · ' + JSON.stringify(P.datoteke) + ' · ' + used.length + ' izmerjenih, ' + skip.length + ' izpuščenih' : ' · ' + res.out.split('\n').slice(-4).join(' | ')));

  // 4. in English: the list's words translated (Lang.tr), the list drawn again as it opens
  await Q.evaluate(() => { const g = window.__game; g.onAction('to-settings'); document.querySelector('[data-set="lang"] button[data-v="en"]').click(); });
  const E = await lay();
  T.check('seznam v angleščini (Dry · Driving physics, Share top 10)', /^Dry · Driving physics: (Classic|New)$/.test(E.note[0] || '') && E.btn === 'Share top 10' && E.rows.length === 2, JSON.stringify({ note: E.note, btn: E.btn }));

  T.check('brez napak na strani', !errors.length, errors.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran through', false, e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : String(e));
}
T.done();
await browser.close();
await srv.close();
