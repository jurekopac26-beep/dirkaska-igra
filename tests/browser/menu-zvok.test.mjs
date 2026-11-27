// The intro's sounds let go (the 22. 11. review): each intro makes its music and its rotor through Web Audio (js/menu.js make), and once
// the intro is over (Skip, its end, another intro) their nodes come off the context and their files are let go; before, the context kept
// every intro's two elements and their nodes for good. Three intros one after the other (Pikes Peak's short intro, the sound on): the
// nodes still on the context stay at none after each, the elements without their files.
//   node tests/browser/menu-zvok.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('the intro\'s sounds let go');
const srv = await serve();
const browser = await launch();
// (before the game's scripts: every media element source and the gain it feeds counted, on while connected, off once disconnected)
const init = () => {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const L = window.__zv = { made: 0, on: new Set(), els: [] };
  const mes = AC.prototype.createMediaElementSource;
  AC.prototype.createMediaElementSource = function (el) { const n = mes.call(this, el); n.__zv = 1; L.made++; L.els.push(el); return n; };
  const con = AudioNode.prototype.connect, dis = AudioNode.prototype.disconnect;
  AudioNode.prototype.connect = function (...a) { if (this.__zv) { L.on.add(this); if (this.__zv === 1 && a[0] instanceof AudioNode) a[0].__zv = 2; } return con.apply(this, a); };   // (the gain an element's source feeds: counted too)
  AudioNode.prototype.disconnect = function (...a) { L.on.delete(this); return dis.apply(this, a); };
};
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { intro: 1, quali: 0, sound: 1, music: 1, track: 'pikes', mode: 'tt', lastTrack: 'pikes' }, { width: 412, height: 915 }, { menu: true, init });
  const click = (act) => page.click(`[data-act="${act}"] >> visible=true`);
  await page.waitForFunction(() => window.Menu && Menu.ready && document.getElementById('menu-host').shadowRoot.querySelector('#s-title'), null, { timeout: 60000 });
  const has = await page.evaluate(() => !!window.__zv);
  if (!has) T.check('Web Audio in this browser (skipped: none here)', true, 'no AudioContext');
  else {
    const rounds = [];
    for (let k = 0; k < 3; k++) {
      await click('single'); await click('mode:trial'); await click('race-single');
      await page.waitForFunction(() => { const r = document.getElementById('menu-host').shadowRoot; return r.querySelector('.intro video') && window.__zv.made > 0; }, null, { timeout: 90000 });
      const during = await page.evaluate(() => window.__zv.on.size);
      await page.waitForTimeout(500);
      await page.click('.intro [data-ix="skip"]');
      await page.waitForFunction(() => window.__game.race && window.__game.race.track.def.id === 'pikes', null, { timeout: 120000 });
      await page.waitForTimeout(900);   // (Skip's fade: half a second)
      rounds.push(await page.evaluate((d) => { const L = window.__zv; return { made: L.made, during: d, on: L.on.size, files: L.els.filter(e => e.getAttribute('src')).length }; }, during));
      await page.evaluate(() => __game.onAction('to-title')); await page.waitForTimeout(500);
    }
    T.check('each intro: its music and rotor on the context while it plays', rounds.every(r => r.during >= 2), JSON.stringify(rounds));
    T.check('after each intro: none of its nodes left on the context, no element holding its file', rounds.every(r => r.on === 0 && r.files === 0), JSON.stringify(rounds));
  }
  T.check('no page errors', !errors.filter(e => !/^request failed: \S+\/assets\//.test(e)).length, errors.join(' | '));
  await ctx.close();
} finally { await browser.close(); await srv.close(); }
T.done();
