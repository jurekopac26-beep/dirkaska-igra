// Svetovi šele ob potrebi (I17, korak 5, docs/hitro-nalaganje.md; tools/svet-odvisnosti.mjs, World.need): ob zagonu igra ne naloži
// nobenega lenega sveta razen tistega, ki ga rabi njena proga; vsaka prava proga se v svežem zavihku zgradi samo s svojimi lenimi
// datotekami (manifest orodja), brez napak, z graditeljem svoje teme (World.ext); World.build brez naloženega sveta vrže napako, ne gradi
// splošnega sveta. PROGE=spa,pikes: samo te.
//   node tests/browser/svet-nalaganje.test.mjs
import { serve, launch, openGame, checker, izbrane } from './lib.mjs';
import { manifest } from '../../tools/svet-odvisnosti.mjs';
import fs from 'node:fs';

const T = checker('svetovi šele ob potrebi');
const M = manifest(fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8'));
const ids = izbrane(Object.keys(M.tracks));
const srv = await serve();
const browser = await launch();
try {
  for (const id of ids) {
    const want = M.tracks[id];
    const { page, errors, ctx } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, track: id }, { width: 480, height: 270 }, { lazy: true });
    await page.waitForFunction(() => document.getElementById('loading').classList.contains('off'), null, { timeout: 180000 });
    const r = await page.evaluate((theme) => ({ ext: !!World.ext[theme], scripts: [...document.querySelectorAll('script[src]')].map(s => (s.getAttribute('src') || '').replace(/\?.*$/, '')).filter(s => /^js\/(world-|data\/)/.test(s)) }), want.theme).catch(e => ({ err: String(e) }));
    T.check(id + ': naložena', !r.err, r.err || '');
    if (!r.err) {
      T.check(id + ': graditelj teme ' + want.theme, r.ext || !want.files.length);   // (privzeti svet, npr. lake: brez graditelja)
      const lazyHere = r.scripts.filter(s => M.lazy.includes(s));
      T.check(id + ': samo njene lene datoteke', JSON.stringify(lazyHere) === JSON.stringify(want.lazy), JSON.stringify(lazyHere) + ', manifest ' + JSON.stringify(want.lazy));
    }
    T.check(id + ': brez napak', !errors.length, errors.slice(0, 2).join('; '));
    await ctx.close();
  }
  // World.build za pravo progo, katere svet ni naložen: napaka, ne splošni svet
  const other = ids.find(id => M.tracks[id].lazy.length && M.tracks[id].theme !== (M.tracks[ids[0]] || {}).theme);
  if (other) {
    const { page, ctx } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, track: ids[0] }, { width: 480, height: 270 }, { lazy: true });
    await page.waitForFunction(() => document.getElementById('loading').classList.contains('off'), null, { timeout: 180000 });
    const msg = await page.evaluate(async (id) => { await Core.loadTrack(id); try { Render.buildWorld(new Core.Track(Core.TRACKS.find(d => d.id === id)), 1); return ''; } catch (e) { return String(e.message || e); } }, other);
    T.check(other + ' brez World.need: napaka', /not loaded/.test(msg), msg || 'zgrajen');
    const ok2 = await page.evaluate(async (id) => { const def = Core.TRACKS.find(d => d.id === id); await World.need(def.theme); Render.buildWorld(new Core.Track(def), 1); return !!World.ext[def.theme]; }, other);
    T.check(other + ': po World.need zgrajen', ok2);
    await ctx.close();
  }
} finally {
  await browser.close();
  await srv.close();
}
T.done();
